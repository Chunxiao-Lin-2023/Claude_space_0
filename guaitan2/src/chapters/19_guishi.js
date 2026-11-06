/* ================= 第十九夜 · 鬼市 ================= */
(() => {
  /* ---------- 小工具 ---------- */
  const cycle = (S, key, lines) => lines[(S.f[key] = ((S.f[key] ?? -1) + 1) % lines.length)];
  const nm = id => (W.ch.items[id] || { name: id }).name;
  /* 能摆上去换的东西（按这个顺序列出） */
  const TRADE = ['zhen', 'shu', 'jing', 'tuo', 'fc', 'zan', 'zq4', 'zq7'];
  /* 袖里吞金：一到十的手势（爹的手势本），密码盘上打乱顺序显示 */
  const SIGNS = ['伸食指', '剪子', '三指', '四指', '张掌', '翘拇小', '三尖捏', '八字', '勾指', '攥拳'];
  const KORD = [3, 7, 0, 5, 9, 2, 6, 1, 8, 4];
  const KEYS = KORD.map(i => SIGNS[i]);
  const KALIAS = {}; KEYS.forEach((k, i) => { KALIAS[String((i + 1) % 10)] = k; });
  /* 散市（逃出段）参数：鸡叫倒计时、重来下限、灰袍客速度 */
  const ESC_T = 33, ESC_FLOOR = 26, HP_SPD = 3.0;
  const CRATES = ['cr1a', 'cr1b', 'cr2a', 'cr2b', 'cr3a', 'cr3b'];
  const CUSTOM = ['c1', 'c2', 'c3', 'c4', 'w1', 'w2'];
  const MATS = ['tan_zhi', 'tan_xie', 'tan_yi', 'tan_jiu', 'tan_deng', 'tan_zhong', 'tan_cha', 'tan_shu', 'tan_tang', 'tan_hua', 'tan_wan'];
  const ROUTE = [[5, 8], [8, 6], [12, 4], [16, 6], [22, 8], [27, 8], [29, 6], [33, 4], [37, 5]];
  /* 收摊的人流：逆着你往西走，走到头再从东头冒出来 */
  const CROWD = [
    { id: 'q1', y: 4, lo: 2, hi: 18, x0: 18, spd: 1.8 },
    { id: 'q2', y: 5, lo: 2, hi: 18, x0: 11, spd: 1.8 },
    { id: 'q3', y: 8, lo: 12, hi: 29, x0: 29, spd: 1.8 },
    { id: 'q4', y: 9, lo: 12, hi: 29, x0: 22, spd: 1.8 },
    { id: 'q5', y: 4, lo: 26, hi: 38, x0: 38, spd: 1.7 },
    { id: 'q6', y: 5, lo: 26, hi: 38, x0: 32, spd: 1.7 }
  ];

  /* ---------- 合成音（双方都听得到） ---------- */
  const BANG = (S, v = 1) => { S.tone('square', 1250, 1150, .05, .05 * v, 0, 2800); S.tone('triangle', 640, 600, .14, .1 * v, 0, 1600); };   // 更夫的梆子
  const CROW = (S, v = 1) => { const a = .05 * v; S.tone('sawtooth', 480, 760, .16, a, 0, 2000); S.tone('sawtooth', 760, 700, .2, a, .17, 2000); S.tone('sawtooth', 720, 940, .26, a, .4, 2200); S.tone('sawtooth', 940, 470, .7, a, .68, 1800); };   // 鸡叫
  const CHIME = (S, v = 1) => { S.tone('sine', 2093, 2080, 1.1, .022 * v, 0); S.tone('sine', 2637, 2620, .8, .014 * v, .06); };   // 灯笼底下的风铃
  const CLICK = S => { S.tone('square', 2600, 2300, .03, .035, 0, 4200); S.tone('square', 2400, 2200, .03, .03, .09, 4200); };   // 戥子
  const PAPER = (S, v = 1) => { S.tone('sawtooth', 340, 180, .22, .022 * v, 0, 900); S.tone('sawtooth', 300, 160, .18, .018 * v, .14, 900); };   // 纸摩擦的沙沙声
  const HEART = (S, v = 1) => { S.tone('sine', 62, 48, .16, .14 * v, 0, 300); S.tone('sine', 58, 44, .14, .1 * v, .22, 300); };

  /* ---------- 人物 ---------- */
  const ME = lant => ({
    key: lant ? 'gsh-me2' : 'gsh-me', skin: '#ecc49c', hair: '#16110e', hs: 'short', top: '#3a5a7a', top2: '#2a4058', bottom: '#2e2a34', shoes: '#3a2a24', mouth: '#b06060',
    extra(g, d, fr, G, R) {
      if (d === 0) { R(11, G.hT + 5, 2, 8, '#16110e'); R(11, G.hT + 13, 2, 1, '#c03030'); }
      else if (d === 3) { R(7, G.hT + 6, 2, 10, '#16110e'); R(7, G.hT + 16, 2, 1, '#c03030'); }
      else if (d === 1) { R(10, G.hT + 5, 2, 8, '#16110e'); R(10, G.hT + 13, 2, 1, '#c03030'); }
      if (lant) {
        if (d === 0) { R(13, G.tT + 5, 1, 3, '#3a2a1a'); R(12, G.tT + 8, 3, 5, '#eef0f2'); R(12, G.tT + 9, 3, 1, '#b8c0c8'); R(12, G.tT + 11, 3, 1, '#b8c0c8'); }
        else if (d === 1) { R(3, G.tT + 5, 1, 3, '#3a2a1a'); R(2, G.tT + 8, 3, 5, '#eef0f2'); R(2, G.tT + 10, 3, 1, '#b8c0c8'); }
      }
    }
  });
  const SHUAN = fc => ({
    key: fc ? 'gsh-sh1' : 'gsh-sh2', skin: '#e8c09a', hair: '#1a1410', hs: 'bald', top: '#4a6a9a', bottom: '#2a2a3a', shoes: '#2a2020', child: true, eye: '#3a3a3a',
    extra(g, d, fr, G, R) {
      if (d !== 3) R(7, G.hT, 2, 2, '#1a1410'); else R(6, G.hT, 4, 3, '#1a1410');
      if (fc && d === 0) { R(13, G.tT - 1, 1, 8, '#8a6a3a'); R(11, G.tT - 4, 2, 3, '#e04040'); R(14, G.tT - 4, 2, 2, '#e0c040'); R(11, G.tT - 1, 2, 2, '#40a0e0'); R(14, G.tT - 1, 2, 3, '#40c060'); R(13, G.tT - 2, 1, 1, '#f4f0e0'); }
    }
  });
  const GH = (key, o) => Object.assign({ key, skin: '#c4c8c0', hair: '#18181c', hs: 'short', top: '#3a3e48', bottom: '#2a2a30', shoes: '#18181c', eye: '#141418', ghost: true }, o);

  defChapter({
    id: 'guishi', n: 19, title: '鬼市', sub: '子时开市，鸡叫就散。卖东西的不说话，买东西的不问价——弟弟的长命锁，摆在了寿摊上。', origin: '中国民间传说', color: '#2c3644',
    icon: '@huipao', amb: 'wind', floor: 'stone', wall: 'wood', dark: .78, plr: 3, darkC: '#03050a',
    endings: { home: '鸡叫之前', zan: '一根银簪', mute: '开了口', dawn: '鸡叫了' },
    /* 选章卡片：一路远去的白灯笼，地摊上一排长命锁和一杆戥子；灰袍的纸人站在一旁 */
    thumb(g, w, h) {
      const R = (x, y, ww, hh, c) => { g.fillStyle = c; g.fillRect(x, y, ww, hh); };
      R(0, 54, w, 14, '#22262e'); R(0, 54, w, 1, '#3a404a');
      for (let i = 0; i < 7; i++) {
        const s = 1 - i * .12, x = 6 + i * 15, y = 12 + i * 3, lw = Math.max(3, Math.round(9 * s)), lh = Math.max(4, Math.round(12 * s));
        g.fillStyle = 'rgba(210,228,255,.10)'; g.beginPath(); g.arc(x + lw / 2, y + lh / 2, 12 * s, 0, 7); g.fill();
        R(x + (lw >> 1), y - 6, 1, 6, '#141210'); R(x, y, lw, lh, '#e8ecf0'); R(x, y + 2, lw, 1, '#a8b0bc'); R(x, y + lh - 3, lw, 1, '#a8b0bc');
      }
      R(6, 58, 62, 10, '#3a2a34'); R(6, 58, 62, 1, '#5a4a54');
      for (let i = 0; i < 6; i++) { const x = 10 + i * 7; R(x + 1, 51, 1, 5, '#a02020'); R(x, 56, 4, 3, '#c8ccd0'); R(x + 1, 57, 2, 1, '#7a7e84'); }
      R(56, 34, 1, 22, '#5a4a3a'); R(44, 34, 24, 1, '#c9a35a'); R(45, 35, 1, 8, '#888'); R(42, 43, 7, 2, '#b8b0a0'); R(43, 40, 4, 3, '#e0e4e8'); R(44, 38, 1, 2, '#d03030'); R(67, 35, 1, 4, '#888');
    },
    /* 惊吓大头像（32×32） */
    faces: {
      /* 灰袍客：纸糊的脸，两团胭脂、墨点的眼、画上去的笑——笑一点点撕开 */
      huipao(R, a) {
        const HD = '#5e5e64', HD2 = '#7a7a80', P = '#efede4', P2 = '#d8d6cc', INK = '#0c0c10', RED = '#d84040';
        R(0, 0, 32, 32, '#08080c');
        R(3, 1, 26, 31, HD); R(5, 0, 22, 2, HD2); R(3, 3, 2, 29, HD2); R(27, 3, 2, 29, '#4a4a50');
        R(8, 5, 16, 22, P); R(7, 8, 18, 15, P); R(10, 27, 12, 3, P);
        R(8, 12, 16, 1, P2); R(15, 5, 1, 24, P2); R(9, 21, 14, 1, P2);   // 纸的折痕
        R(10, 10, 4, 1, INK); R(18, 10, 4, 1, INK);                       // 描出来的细眉
        R(11, 13, 2, 2, INK); R(19, 13, 2, 2, INK); R(12, 13, 1, 1, '#f8f8f0'); R(20, 13, 1, 1, '#f8f8f0');
        if (a > .35) { R(11, 15, 1, 2 + Math.round(a * 5), INK); R(20, 15, 1, 1 + Math.round(a * 4), INK); }   // 墨洇下来
        R(8, 17, 4, 3, RED); R(9, 16, 2, 1, RED); R(20, 17, 4, 3, RED); R(21, 16, 2, 1, RED);
        const op = Math.round(a * 5);
        R(11, 22, 10, 1, RED); R(10, 21, 1, 1, RED); R(21, 21, 1, 1, RED);
        if (op > 0) { R(11, 23, 10, op, '#140608'); for (let i = 0; i < 5; i++) R(11 + i * 2, 23 + op, 1, 1, P); R(10, 22, 1, op, P2); R(21, 22, 1, op, P2); R(12, 23, 1, 1, P); R(19, 23, 1, 1, P); }
      },
      /* 市官：乌纱帽、蒙脸的白布、布上一方红印；白布底下慢慢吸进去一个嘴的形状 */
      shiguan(R, a) {
        const K = '#0a0a0e', K2 = '#1e1e26', C = '#f0eee6', C2 = '#cfcdc4', RED = '#b02424';
        R(0, 0, 32, 32, '#06060a');
        R(7, 0, 18, 8, K); R(9, 0, 14, 2, K2); R(0, 4, 8, 2, K); R(24, 4, 8, 2, K); R(0, 3, 3, 1, K2); R(29, 3, 3, 1, K2);
        R(6, 8, 20, 22, C); R(7, 30, 18, 2, C2); R(6, 8, 20, 1, C2);
        R(9, 13, 4, 3, C2); R(19, 13, 4, 3, C2); R(15, 16, 2, 4, C2);    // 布底下隐约的眼窝和鼻梁
        R(12, 22, 8, 7, 'rgba(176,36,36,.75)'); R(13, 23, 6, 5, C); R(14, 24, 4, 1, RED); R(15, 25, 2, 2, RED);   // 红印
        const m = Math.round(a * 3); if (m > 0) R(13, 19, 6, m, '#9a988e');
        R(26, 16, 3, 16, '#2a1c14'); R(26, 16, 3, 1, '#5a4030');         // 戒尺
      }
    },
    people: {
      me: ME(false), me2: ME(true), shuan: SHUAN(true), shuan2: SHUAN(false),
      huipao: { key: 'gsh-hp', skin: '#eeece4', hair: '#202024', hs: 'short', top: '#86868c', top2: '#6a6a70', robe: true, noFeet: true, hat: 'hood', hatC: '#76767c', eye: '#101012', blush: '#e04848', mouth: '#c03030',
        extra(g, d, fr, G, R) { if (d === 0) { R(4, G.hT + 3, 8, 1, '#dcdad0'); R(7, G.hT + 1, 1, 6, '#dcdad0'); R(3, G.tT + 4, 1, 2, '#eeece4'); R(12, G.tT + 4, 1, 2, '#eeece4'); } } },
      shiguan: { key: 'gsh-sg', skin: '#e8e6dc', hair: '#101010', hs: 'short', top: '#1c1c22', top2: '#101014', robe: true, noFeet: true, eye: '#e8e6dc',
        extra(g, d, fr, G, R) {
          R(3, G.hT - 2, 10, 3, '#101014'); R(5, G.hT - 3, 6, 1, '#101014');
          if (d === 0) { R(0, G.hT - 1, 3, 1, '#101014'); R(13, G.hT - 1, 3, 1, '#101014'); R(4, G.hT + 2, 8, 6, '#f0eee6'); R(7, G.hT + 5, 2, 2, '#b02424'); R(12, G.tT + 1, 1, 9, '#3a2a1a'); }
          else if (d === 1) { R(12, G.hT - 1, 3, 1, '#101014'); R(3, G.hT + 2, 5, 6, '#f0eee6'); R(2, G.tT + 2, 1, 8, '#3a2a1a'); }
        } },
      xie: GH('gsh-xie', { hair: '#b8b4ac', hs: 'bald', top: '#4a4438', skin: '#bcb8ac', extra(g, d, fr, G, R) { if (d === 0) { R(5, G.hT + 7, 6, 2, '#d8d4cc'); R(6, G.hT + 9, 4, 1, '#d8d4cc'); } else if (d === 1) R(4, G.hT + 6, 3, 2, '#d8d4cc'); } }),
      shu: GH('gsh-shu', { hs: 'long', cover: true, hair: '#0e0c10', top: '#5a6878', skirt: true, skin: '#d0d4cc' }),
      jiu: GH('gsh-jiu', { robe: true, top: '#34443a', hat: 'qing', hatC: '#1a1a1a', extra(g, d, fr, G, R) { if (d === 0) { R(5, G.hT + 4, 2, 2, '#e4e8e4'); R(9, G.hT + 4, 2, 2, '#e4e8e4'); R(7, G.hT + 4, 2, 1, '#6a6a5a'); } else if (d === 1) R(4, G.hT + 4, 2, 2, '#e4e8e4'); } }),
      tang: GH('gsh-tang', { child: true, top: '#a83a2a', skin: '#d8d4c8', bottom: '#3a2a2a',
        extra(g, d, fr, G, R) { const o = '#d88a2a'; R(3, G.hT - 1, 10, 4, o); R(3, G.hT - 2, 2, 2, o); R(11, G.hT - 2, 2, 2, o); R(6, G.hT - 1, 1, 2, '#2a1a10'); R(9, G.hT - 1, 1, 2, '#2a1a10'); if (d === 0) { R(5, G.hT, 1, 1, '#2a1a10'); R(10, G.hT, 1, 1, '#2a1a10'); R(7, G.hT, 2, 1, '#2a1a10'); R(4, G.hT + 6, 1, 1, '#e06060'); R(11, G.hT + 6, 1, 1, '#e06060'); } } }),
      cheng: GH('gsh-cheng', { hs: 'bun', hair: '#d0ccc4', hat: 'scarf', hatC: '#1e1c22', top: '#2a2830', skirt: true, skin: '#b8b0a0',
        extra(g, d, fr, G, R) { if (d === 0) { R(2, G.tT + 6, 2, 2, '#b8b0a0'); R(1, G.tT + 2, 1, 8, '#c9a35a'); } } }),
      zha: GH('gsh-zha', { hair: '#8a8680', hs: 'bald', top: '#4a3a2a', apron: '#6a5a4a' }),
      cha: GH('gsh-cha', { hs: 'bun', hair: '#9a968e', top: '#3a4a5a', skirt: true }),
      g1: GH('gsh-g1', { top: '#3e4a44', hat: 'straw', hatC: '#8a7a5a' }),
      g2: GH('gsh-g2', { top: '#4a3e48', hs: 'bun', hair: '#2a2228', skirt: true }),
      g3: GH('gsh-g3', { top: '#2e3440', hs: 'queue' }),
      g4: GH('gsh-g4', { top: '#4a4232', hat: 'qing', hatC: '#222' }),
      q: GH('gsh-q', { top: '#3a3a40', hat: 'straw', hatC: '#6a6a5a', extra(g, d, fr, G, R) { if (d === 1) { R(9, G.tT - 2, 6, 7, '#5a4a3a'); R(9, G.tT - 2, 6, 1, '#7a6a52'); } else { R(2, G.tT - 3, 12, 3, '#5a4a3a'); R(2, G.tT - 3, 12, 1, '#7a6a52'); } } })
    },
    items: {
      deng: { name: '白灯笼', desc: '白纸糊的灯笼，竹骨，提杆上缠着红布条。奶奶说，鬼市只认白灯笼——红的是活人办喜事用的。' },
      zq4: { name: '纸钱（四叠）', desc: '黄表纸打的纸钱，四叠，用麻绳捆着。过年烧剩下的。' },
      zq7: { name: '纸钱（七叠）', desc: '七叠纸钱。四叠是家里的，三叠是糖人摊那孩子塞给你的——那三叠摸着，比家里的凉。' },
      fc: { name: '纸风车', desc: '红黄蓝绿四片纸叶，插在一根秫秸秆上。没有风，它也会自己慢慢地转。' },
      zhen: { name: '针线包', desc: '奶奶的针线包，蓝布缝的，里头插着两根大针、一绕黑线、一个铜顶针。' },
      zan: { name: '奶奶的银簪', desc: '簪头一朵小小的梅花。奶奶戴了一辈子，从没摘下来过。拿在手里，还是温的。' },
      shu: { name: '桃木梳', desc: '一把桃木梳子，梳齿一根没断，梳背上刻着一朵小梅花。鞋摊老汉从破布底下摸出来的。' },
      jing: { name: '铜镜', desc: '巴掌大的铜镜，背面铸着缠枝花，沉甸甸的。镜面磨得很亮——可照不出你身后的东西。' },
      tuo: { name: '铜秤砣', desc: '拳头大的铜秤砣，压得手腕一沉。底下錾着一个「公」字。' },
      suo: { name: '栓子的长命锁', desc: '银的，正面錾着「长命百岁」，背面刻着「秦栓子」和他的生辰。红绳是你去年亲手编的。握在手心里，是温的。' }
    },
    notes: {
      guiju: { title: '奶奶说的规矩', text: '（奶奶一句一句说，你拿炭条记在一张黄表纸背面）\n\n一、子时开市，鸡叫就散。头遍鸡叫之前，必须出牌楼。\n二、进了鬼市，一个字也不许说。谁喊你，都别应。\n三、不问价。想要什么，就把自己的东西摆到人家摊上；他收了，买卖就成了；他推回来，就是不换。\n四、真要论价，价钱在袖子里——你爹那行的规矩。\n五、买东西用纸钱，铜钱银子他们不认。\n六、提白灯笼。不许跑——在鬼市里跑的，是贼。\n七、鬼市的东西，一口也别吃。\n\n（最底下，奶奶让你又添了一句：看见熟人，也别认。）' },
      yahang: { title: '爹的牙行手势本', text: '（爹赶集贩牲口，做的是牙行。木箱底下压着他的小本子，字歪歪扭扭）\n\n袖里吞金：买卖两家把手揣进一个袖筒里一捏，价就讲定了，旁人一个字也听不见。\n\n一　伸食指　　　二　剪子（食指中指）\n三　三指（拇指扣住食指）\n四　四指（拇指扣在掌心）　五　张掌\n六　翘拇小（拇指小指翘起，余三指蜷）\n七　三尖捏（拇指食指中指三个尖捏拢）\n八　八字（拇指食指张开）\n九　勾指（食指弯成钩）　十　攥拳\n\n（页边上爹添了一行：袖里摸着别家的手，先别慌，摸清他比的是几。压他一手就够——多出来的，都是白给。）' },
      hua: { title: '栓子的画', text: '（炕沿上一张糊窗户剩下的纸，栓子用烧火棍画的）\n\n一条弯弯的河。河边一排小人，每个人头顶一个圈——是灯笼。\n\n一个戴虎头帽的小人，举着一个风车。\n一个穿蓝衣裳的小人（栓子自己），伸着手，手里画了一把锁。\n\n纸的另一头：一个驼背的老太太，手里提着一杆秤，秤钩上挂着那把锁。\n老太太身边站着一个灰色的人，脸画得圆圆的，脸蛋上涂了两团红。\n\n（栓子把那个灰色的人涂了又涂，纸都戳破了。）' },
      guji: { title: '旧货摊上的残页', text: '（旧货摊边上压着的一页残书，纸黄得发脆，字是刻版印的）\n\n……海边时有鬼市，半夜而合，鸡鸣而散，人从之，多得异物。\n　　　　　　　　——题作《番禺杂记》\n\n……茶坊每五更点灯，博易买卖衣服、图画、花环、领抹之类，至晓即散，谓之「鬼市子」。\n　　　　　　　　——题作《东京梦华录》\n\n（书页背面，有人用小字批了一句：问价者，市散不得归。）' }
    },
    legend: '「鬼市」这个词，很早就出现在中国的笔记里。唐人郑熊的《番禺杂记》（原书已散佚，这段话靠后世书籍的转引才留下来）写岭南海边「时有鬼市，半夜而合，鸡鸣而散，人从之，多得异物」。宋代孟元老《东京梦华录》记北宋汴京潘楼东街一带的茶坊「每五更点灯，博易买卖衣服图画花环领抹之类，至晓即散，谓之鬼市子」。这里的「鬼」，多半说的是它半夜聚、天亮散，灯影幢幢、来去无踪，未必真指鬼魂。\n\n在民间故事里，鬼市渐渐成了阴阳交界的集市：子时开，鸡叫散；摊主不吆喝，顾客不问价；买东西要用纸钱，天亮后收到的钱变成纸灰、树叶。流传较广的禁忌有：不说话、不问来历、不吃鬼市的东西、鸡叫前必须离开，否则就回不来了。至于摊上卖「寿数」，用长命锁或八字押着一个人的寿，则是这类故事里常见的变体之一，各地说法不一。\n\n明清以来，北京、天津等地也有被叫作「鬼市」「晓市」的天不亮就开张的旧货集：借着灯笼、马灯照亮，买卖旧衣、古玩、杂物，东西来路不明，买的人也不问，天一亮就散。牲口市、旧货行里的经纪人（牙人）讲价，常把手揣进对方袖筒或盖在衣襟下捏指头比数，叫「袖里吞金」「摸码」，据说为的是不让旁人听见价钱；各地手势不尽相同。\n\n（本章中的柳渡镇、秦家祖孙、腊月初一的鬼市、秤婆与寿摊、灰袍纸人、市官、各摊主与「换物链」、银簪换寿、以长命锁押寿、爹的手势本中的具体手势写法，均为游戏虚构。）',
    start: { map: 'home', x: 7, y: 4, dir: 1 },
    resume: {
      market: async S => { S.norun(true); light(S); S.goal(mGoal(S)); },
      escape: async S => {
        S.norun(true); light(S); startTimer(S);
        const n = S.f._escD || 0;
        if (n === 1) await S.think('……还在寿巷里。锁还在手心里。\n不能跑。顺着还亮着的那一路灯笼走——别碰着收摊的人，也别停。');
        else if (n >= 2) { await S.think('收摊的人逆着走过来——两条道，他往哪条走，你就换到另一条。\n灰袍客跟得紧，别回头，别停。'); S.toast('提示：跟着地上亮着的灯笼光走；人流迎面来时换一条道让开'); }
      }
    },
    async intro(S) {
      await S.card('第十九夜　鬼市', '清光绪年间　腊月初一　运河边的柳渡镇', '镇西的旧河滩上，每逢初一，子时开一个集。\n天亮之前，它就散了。\n\n镇上的人，管它叫——鬼市。');
    },
    tick(S, dt) {
      if (S.map === 'guishi') { if (S.f.ph === 'escape') escTick(S, dt); else marketTick(S, dt); }
    },
    sprites: {
      kang(g, e, t, R) {   // 土炕（3×2），奶奶躺在被窝里
        R(0, 12, 48, 20, '#6a4a3a'); for (let y = 14; y < 32; y += 4) R(0, y, 48, 1, '#5a3c2e'); for (let x = 4; x < 48; x += 8) R(x + ((x / 8) % 2) * 4, 12, 1, 20, '#5a3c2e');
        R(0, 2, 48, 11, '#a08a5a'); for (let x = 1; x < 48; x += 3) R(x, 3, 1, 9, '#8a7448');
        R(2, 3, 10, 7, '#d8d0b8'); R(3, 4, 8, 1, '#c8c0a8');
        R(10, 4, 36, 10, '#7a3a3a'); R(10, 4, 36, 1, '#9a4a4a'); for (let x = 14; x < 46; x += 8) R(x, 7, 3, 3, '#a85a3a');
        const sk = '#d8b090';
        R(4, 1, 7, 6, sk); R(4, 0, 7, 2, '#d8d4cc'); R(3, 1, 1, 4, '#d8d4cc'); R(5, -1, 4, 1, '#d8d4cc');
        if (!e.s.gone) R(9, -1, 2, 1, '#c8ccd0');
        R(5, 3, 2, 1, '#5a4030'); R(8, 3, 2, 1, '#5a4030'); R(6, 5, 3, 1, '#a07060');
      },
      muxiang(g, e, t, R) { R(1, 14, 14, 2, 'rgba(0,0,0,.35)'); box(R, 1, 3, 14, 12, '#5a3a22'); R(2, 4, 12, 3, '#6a4a2e'); R(1, 7, 14, 1, '#3a2414'); R(7, 7, 2, 3, '#c9a35a'); R(3, 10, 2, 4, '#4a2e1a'); R(11, 10, 2, 4, '#4a2e1a'); },
      xiazi(g, e, t, R) { R(1, 9, 14, 6, '#3a2818'); box(R, 3, 4, 10, 6, '#5a3a24'); if (!e.s.empty) { R(3, 3, 10, 2, '#6a4a30'); R(7, 4, 2, 6, '#c02828'); } else R(4, 5, 8, 3, '#1a100a'); },
      baideng(g, e, t, R) { R(7, -14, 2, 29, '#3a2a1a'); R(3, 14, 10, 2, '#2a1e14'); R(9, -14, 3, 1, '#3a2a1a'); R(11, -13, 1, 3, '#3a2a1a'); box(R, 8, -10, 8, 10, '#eef0f2', '#9aa2ac'); R(8, -7, 8, 1, '#c0c8d0'); R(8, -4, 8, 1, '#c0c8d0'); R(10, -11, 4, 1, '#2a2018'); R(10, 0, 4, 1, '#2a2018'); },
      jiwo(g, e, t, R) {   // 鸡窝，一只芦花鸡
        box(R, 0, 3, 16, 12, '#6a5030'); for (let x = 2; x < 15; x += 3) R(x, 4, 1, 10, '#3a2a18'); R(-1, 1, 18, 3, '#4a3a22');
        const b = Math.sin(t * 2.6) > .8 ? 1 : 0;
        R(5, 7 + b, 6, 5, '#c8c8c0'); for (let x = 5; x < 11; x += 2) R(x, 8 + b, 1, 4, '#5a5a58'); R(10, 5 + b, 3, 3, '#d0d0c8'); R(11, 4 + b, 2, 1, '#c02020'); R(13, 6 + b, 1, 1, '#e8b030'); R(11, 6 + b, 1, 1, '#111'); R(4, 6 + b, 2, 3, '#4a4a48');
      },
      pailou(g, e, t, R) {   // 牌楼：横跨河滩小路（竖跨 4 格），两盏白灯笼
        R(5, -10, 6, 74, '#2a2420'); R(6, -8, 4, 70, '#4a3e34'); R(1, -16, 14, 6, '#1a1612'); R(0, -18, 16, 2, '#3a3430');
        R(1, 56, 14, 6, '#1a1612'); R(0, 54, 16, 2, '#3a3430');
        box(R, 2, 20, 12, 18, '#1e1a18', '#5a5048'); R(4, 23, 8, 12, '#d8d4c8'); R(6, 25, 4, 1, '#2a2420'); R(7, 27, 2, 5, '#2a2420'); R(5, 29, 6, 1, '#2a2420'); R(6, 33, 4, 1, '#2a2420');
        for (const y of [6, 44]) { R(12, y - 4, 1, 4, '#2a2018'); box(R, 10, y, 6, 8, '#eef0f2', '#9aa2ac'); R(10, y + 3, 6, 1, '#c0c8d0'); R(12, y + 8, 2, 2, '#c02828'); }
      },
      hedeng(g, e, t, R) { const b = Math.round(Math.sin(t * 1.6 + e.x) * 1.2); R(3, 10 + b, 10, 2, '#7a3040'); R(4, 8 + b, 3, 3, '#d06878'); R(9, 8 + b, 3, 3, '#d06878'); R(6, 7 + b, 4, 4, '#e88898'); R(7, 4 + b + (Math.sin(t * 9 + e.x) > 0 ? 1 : 0), 2, 3, '#ffd070'); R(7, 6 + b, 2, 1, '#fff0b0'); R(2, 13, 12, 1, 'rgba(255,200,120,.25)'); },
      xiangmen(g, e, t, R) { R(5, -12, 5, 28, '#24160e'); R(6, -10, 3, 24, '#3a2618'); R(9, -10, 6, 2, '#24160e'); for (const [x, l] of [[11, 9], [13, 13]]) { R(x, -8, 1, l, '#a02020'); R(x - 1, -8 + l, 3, 3, '#b8bcc0'); R(x, -7 + l, 1, 1, '#6a6e72'); } },
      gdeng(g, e, t, R) { R(7, -16, 2, 32, '#2a2018'); R(5, 14, 6, 2, '#1a120c'); R(9, -16, 4, 1, '#2a2018'); R(12, -15, 1, 2, '#2a2018'); box(R, 9, -13, 7, 9, e.off ? '#4a4c52' : '#eef0f2', '#8a929c'); R(9, -10, 7, 1, e.off ? '#3a3c40' : '#c0c8d0'); },
      /* 地摊（2×1）：一块布、一盏小白灯笼、摊上的货按 s.k 画 */
      tan(g, e, t, R) {
        const C = e.col || '#3a3440', k = e.s.k;
        R(1, 14, 30, 2, 'rgba(0,0,0,.35)'); R(0, 6, 32, 9, C); R(0, 6, 32, 1, shade(C, .25)); R(0, 14, 32, 1, shade(C, -.35));
        R(30, -11, 1, 17, '#2a2018'); R(27, -11, 4, 1, '#2a2018'); R(27, -10, 1, 2, '#2a2018');
        box(R, 25, -8, 5, 7, e.off ? '#4a4c52' : '#eef0f2', '#8a929c'); R(25, -5, 5, 1, e.off ? '#3a3c40' : '#c0c8d0');
        if (k === 'zhi') {   // 纸马、纸人；最末一个空位，地上一双脚印
          box(R, 2, 0, 8, 7, '#f0ece0', '#a8a498'); R(3, -3, 3, 4, '#f0ece0'); R(4, -2, 1, 1, '#c02020'); R(3, 7, 1, 3, '#d8d4c8'); R(8, 7, 1, 3, '#d8d4c8');
          for (const x of [12, 16]) { R(x, -4, 3, 3, '#f0ece0'); R(x, 0, 3, 8, '#9a9aa2'); R(x, -2, 1, 1, '#e04848'); R(x + 2, -2, 1, 1, '#e04848'); }
          R(20, 11, 2, 1, '#2a2430'); R(23, 11, 2, 1, '#2a2430'); R(20, 9, 1, 1, '#2a2430'); R(24, 9, 1, 1, '#2a2430');
        } else if (k === 'xie') {
          for (let i = 0; i < 4; i++) { const x = 2 + i * 6; R(x, 9, 4, 3, i % 2 ? '#2a2a34' : '#3a2a2a'); R(x, 11, 4, 1, '#d8d0c0'); }
          if (!e.s.done) { R(3, 4, 5, 2, '#3a3036'); R(3, 6, 5, 1, '#d8d0c0'); R(4, 3, 2, 1, '#d8d0c0'); }
        } else if (k === 'yi') {
          R(2, 5, 12, 6, '#2a3a5a'); R(3, 4, 10, 2, '#3a4a6a'); R(15, 6, 9, 5, '#5a2a2a'); R(16, 5, 7, 1, '#6a3a3a');
          const d = (t * 3) % 6; R(6, 11 + d, 1, 1, 'rgba(150,180,220,.8)'); R(19, 11 + ((d + 3) % 6), 1, 1, 'rgba(150,180,220,.8)');
        } else if (k === 'jiu') {   // 画轴；左角压着秤砣，右边被风掀起来——换来铜镜后压平
          R(1, 7, 22, 6, '#e8e0cc'); R(1, 7, 1, 6, '#6a4a2a'); R(3, 8, 6, 1, '#7a8a8a'); R(9, 9, 6, 1, '#6a7a7a'); R(12, 8, 2, 3, '#5a5a5a');
          if (!e.s.mirror) { R(1, 10, 4, 3, '#b08a3a'); R(2, 9, 2, 1, '#c8a050'); const lift = Math.round((Math.sin(t * 5) + 1) * 2); R(18, 7 - lift, 6, 2, '#e8e0cc'); R(23, 7 - lift, 1, 6, '#6a4a2a'); }
          else { R(10, 8, 6, 5, '#a88a4a'); R(11, 9, 4, 3, '#d8c890'); R(23, 7, 1, 6, '#6a4a2a'); }
        } else if (k === 'deng') {
          for (let i = 0; i < 4; i++) { const x = 2 + i * 5, c = i === 2 ? '#c84040' : '#e8ecf0'; box(R, x, 4, 4, 6, c, shade(c, -.4)); R(x, 6, 4, 1, shade(c, -.2)); }
          R(13, 6, 2, 2, '#2a2020');
        } else if (k === 'zhong') {
          for (const x of [3, 12]) { box(R, x, 1, 7, 10, '#4a3020'); R(x + 1, 2, 5, 5, '#e8e0c8'); R(x + 3, 2, 1, 3, '#1a1a1a'); }
          R(20, 9, 3, 3, '#c9a35a'); R(21, 10, 1, 1, '#e8e0c8');
        } else if (k === 'cha') {
          box(R, 2, 3, 8, 8, '#8a6a3a'); R(10, 5, 3, 1, '#8a6a3a'); R(4, 1, 4, 2, '#7a5a2a');
          for (const x of [14, 19]) { R(x, 9, 4, 2, '#d8d4c8'); R(x + 1, 8, 2, 1, '#6a4a2a'); }
          R(16 + Math.sin(t * 2) * 1, 3 - ((t * 4) % 4), 1, 2, 'rgba(220,220,220,.35)');
        } else if (k === 'shu') {   // 头绳、胭脂；扣着的铜镜（换走后变成梳子 / 银簪）
          R(2, 9, 6, 1, '#c03040'); R(2, 11, 6, 1, '#3060a0'); box(R, 10, 8, 4, 3, '#d04050');
          if (!e.s.traded) { R(16, 6, 7, 6, '#7a6a3a'); R(17, 7, 5, 4, '#9a8a4a'); }
          else if (e.s.traded === 'zan') { R(16, 9, 7, 1, '#c8ccd0'); R(22, 8, 2, 2, '#e8e8f0'); }
          else { R(16, 8, 7, 3, '#b07a4a'); for (let x = 16; x < 23; x += 2) R(x, 11, 1, 1, '#8a5a3a'); }
        } else if (k === 'tang') {   // 草把子插满糖人；顶上的窟窿，换回风车后插上
          R(18, -8, 4, 18, '#c8a860'); R(19, -8, 2, 18, '#d8b870');
          for (const [x, y] of [[14, -5], [22, -3], [14, 1], [22, 3]]) { R(x, y, 3, 3, '#e0a030'); R(x + 1, y + 3, 1, 3, '#d8c890'); }
          for (const x of [3, 7]) { R(x, 9, 3, 3, '#e0a030'); R(x + 1, 12, 1, 2, '#d8c890'); }
          if (e.s.fc) { const s = Math.sin(t * 3) > 0; R(19, -14, 1, 6, '#8a6a3a'); R(s ? 16 : 17, -16, 3, 3, '#e04040'); R(20, s ? -16 : -15, 3, 3, '#e0c040'); R(s ? 17 : 16, -13, 3, 3, '#40a0e0'); R(20, -13, 3, 3, '#40c060'); }
          else R(19, -9, 2, 1, '#2a1a0a');
        } else if (k === 'hua') {
          for (const [x, c] of [[2, '#c8c0b0'], [10, '#b8b0a0'], [18, '#d0c8b8']]) { box(R, x, 2, 7, 9, '#2a1a12'); R(x + 1, 3, 5, 7, c); R(x + 2, 4, 3, 3, '#e0d8c8'); R(x + 2, 4, 3, 1, '#1a1410'); }
        } else if (k === 'wan') {
          for (let i = 0; i < 4; i++) { const x = 2 + i * 6; R(x, 8, 5, 3, i % 2 ? '#d8d8e0' : '#c0c8d8'); R(x + 1, 8, 3, 1, '#6a8aaa'); R(x + 2, 6 + (Math.sin(t * 8 + i) > 0 ? 1 : 0), 1, 2, '#ffcc66'); }
        }
      },
      /* 寿摊（3×1）：一排长命锁、锁前的白蜡烛、右边一杆戥子 */
      shoutan(g, e, t, R) {
        box(R, 0, 4, 48, 11, '#3a2418'); R(1, 5, 46, 2, '#4a3020'); R(2, 15, 3, 1, '#1a0e08'); R(43, 15, 3, 1, '#1a0e08');
        for (let i = 0; i < 6; i++) {
          const x = 3 + i * 5; R(x + 1, -2, 1, 3, '#a02020'); R(x, 1, 3, 3, '#c0c4c8'); R(x + 1, 2, 1, 1, '#7a7e82');
          let h = 2 + Math.floor(hash(i, 3, 19) * 5); if (i === 5) h = Math.max(1, 6 - 2 * (e.s.burn || 0));
          R(x + 1, 11 - h, 1, h, '#f0ece0'); R(x + 1, 10 - h + (Math.sin(t * 10 + i) > .3 ? 0 : -1), 1, 1, '#ffcc66');
        }
        R(41, -10, 1, 15, '#5a4a3a'); R(34, -10, 13, 1, '#c9a35a'); R(41, -11, 1, 1, '#e0c070');
        R(35, -9, 1, 6, '#888'); R(33, -3, 5, 1, '#b8b0a0'); R(32, -2, 7, 1, '#9a9488');
        if (e.s.suo) { R(34, -6, 3, 3, '#e0e4e8'); R(35, -5, 1, 1, '#9a9ea2'); R(35, -8, 1, 2, '#d03030'); }
        if (e.s.tuo) { R(45, -9, 1, 4, '#888'); R(44, -5, 3, 3, '#b08a3a'); R(44, -5, 3, 1, '#d0aa5a'); }
        else { const sw = Math.round(Math.sin(t * 2.2) * 1); R(45 + sw, -9, 1, 3, '#888'); R(44 + sw, -6, 1, 1, '#888'); }
      },
      suoqiang(g, e, t, R) {   // 寿巷墙上：一串一串的长命锁
        for (let i = 0; i < 12; i++) { const x = 3 + i * 8, l = 6 + Math.floor(hash(i, 1, 9) * 6); R(x, 0, 1, l, '#7a1a1a'); R(x - 1, l, 3, 3, '#a8acb0'); R(x, l + 1, 1, 1, '#6a6e72'); if (hash(i, 2, 9) > .5) { R(x - 1, l + 5, 3, 3, '#a8acb0'); R(x, l + 3, 1, 2, '#7a1a1a'); } if (Math.sin(t * 2 + i * 1.7) > .97) R(x - 1, l, 1, 1, '#f0f4ff'); }
      },
      baoguo(g, e, t, R) {   // 散市时堵在路当中的箱笼和包袱
        R(0, 14, 16, 2, 'rgba(0,0,0,.4)'); box(R, 1, 4, 14, 11, '#6a5236', '#2a1e12'); R(2, 5, 12, 1, '#9a7a52'); R(7, 4, 2, 11, '#c8b48a'); R(1, 9, 14, 1, '#c8b48a');
        box(R, 3, -4, 10, 9, '#4a4a5a', '#1e1e26'); R(4, -3, 8, 1, '#6a6a7a'); R(7, -6, 2, 3, '#c8b48a'); R(5, -6, 6, 1, '#c8b48a');
      },
      dengjia(g, e, t, R) {   // 墙上的灯架：一排小油灯，有亮有灭
        R(0, 11, e.w * 16, 2, '#3a2a1a'); R(0, 13, e.w * 16, 1, '#1a120a');
        for (let i = 0; i < e.w * 3; i++) { const x = 2 + i * 5, lit = hash(i, e.x, 7) > .35; R(x, 9, 4, 2, '#6a5a4a'); if (lit) { R(x + 1, 6 + (Math.sin(t * 11 + i) > 0 ? 1 : 0), 2, 3, '#ffcc66'); R(x + 1, 8, 2, 1, '#fff0b0'); } else R(x + 1, 3 - ((t * 3 + i) % 4), 1, 2, 'rgba(200,200,200,.25)'); }
      }
    },
    maps: {
      /* ---------------- 秦家 ---------------- */
      home: {
        amb: 'wind', dark: .66, plr: 3, wall: 'mud', floor: 'wood', wallC: { face: '#6a5040', top: '#160f0a' },
        tileOpts: { woodC: '#5a4230', fenceBase: 'dirt' },
        rows: [
          '###################',
          '###################',
          '#wwwwwwwwwww#kkkkk#',
          '#wwwwwwwwwww#kkkkk#',
          '#wwwwwwwwwwwwkkkkk#',
          '#wwwwwwwwwww#kkkkk#',
          '#wwwwwwwwwww#kkkkk#',
          '#####ww############',
          '#dddddddddddddddddd',
          '#dddddddddddddddddd',
          'fffffffffffffffffff'],
        ents: [
          { x: 18, y: 8, spr: 'invisible', touch: exit('hetan', 1, 3, 2) },
          { x: 18, y: 9, spr: 'invisible', touch: exit('hetan', 1, 4, 2) },
          { id: 'kang', x: 1, y: 2, w: 3, h: 2, spr: 'kang', solid: true, on: S => naiOn(S) },
          { id: 'shuan', x: 4, y: 3, spr: '@shuan', dir: 0, on: S => shuanOn(S) },
          { id: 'hua', x: 5, y: 3, spr: 'paper', decal: true, async on(S) { if (S.once('hua')) await S.narr('炕沿底下压着一张纸。是栓子画的。'); await S.note('hua'); S.f.readHua = true; } },
          { x: 7, y: 2, w: 2, spr: 'altar', light: { r: 2.2, col: 'rgba(255,170,90,.16)', flick: true }, on: S => S.narr('供桌上立着娘的牌位，前年腊月里没的。\n牌位前一盏豆油灯，一碟没动过的饺子。\n灯芯「啪」地爆了一下，火苗往门口那边歪过去。') },
          { id: 'xiang', x: 10, y: 2, spr: 'muxiang', async on(S) { if (S.once('xiang')) await S.narr('爹的木箱。爹跟着运河上的船跑买卖，一年回来两趟。\n箱子底下，压着一本油乎乎的小本子。'); await S.note('yahang'); S.f.readYa = true; } },
          { x: 3, y: 1, spr: 'window', on: S => S.narr('窗纸上结着一层霜花。\n外头的风呜呜地刮，像有人隔着窗户，一遍一遍地数数。') },
          { x: 10, y: 1, spr: 'window', on: S => S.narr('窗外是镇西的方向。黑沉沉的，什么也看不见。\n……又好像，河滩那头，有一点白光，一闪。') },
          { x: 8, y: 5, spr: 'table', col: '#5a3e28' },
          { x: 8, y: 5, spr: 'cup', full: true, on: S => S.narr('奶奶的药碗。药早凉了，碗底沉着一层黑渣。') },
          { id: 'basket', x: 11, y: 6, spr: 'basket', on: S => basketOn(S) },
          { id: 'baideng', x: 4, y: 6, spr: 'baideng', light: { r: 1.6, col: 'rgba(220,230,255,.12)' }, on: S => dengOn(S) },
          { x: 14, y: 2, spr: 'stove', light: { r: 2, col: 'rgba(255,140,60,.14)', flick: true }, on: S => S.narr('灶膛里的火压着，只剩一点红。\n锅里温着半锅小米粥，是给栓子留的。他一口没吃。') },
          { x: 15, y: 1, spr: 'scroll', on: S => S.narr('灶王爷的画像，嘴上抹着去年祭灶的糖。\n画像底下是一只小木匣。') },
          { id: 'xiazi', x: 15, y: 2, spr: 'xiazi', on: S => xiaziOn(S) },
          { x: 16, y: 2, spr: 'cabinet', on: S => S.narr('碗柜里摞着粗瓷碗。最上头那只豁了口的，是栓子的。') },
          { x: 17, y: 6, spr: 'barrel', on: S => S.narr('水缸的水面结了一层薄冰。冰底下，映着灶膛那一点红光。') },
          { x: 13, y: 6, spr: 'sack', on: S => S.narr('半袋玉米面。过了腊八，就只剩这么多了。') },
          { x: 3, y: 9, spr: 'well', on: S => S.narr('院里的井。井口的辘轳冻住了，绳子硬得像铁丝。') },
          { x: 15, y: 8, spr: 'jiwo', on: S => S.f.ph === 'out' ? S.narr('芦花鸡伸长脖子，叫了一声又一声。') : S.narr('鸡窝里，家里那只芦花鸡缩着脖子睡着。\n奶奶说过：鸡叫头遍，鬼市就散了。') },
          { x: 10, y: 8, spr: 'invisible', solid: false, on: S => S.narr('院子里的雪被扫到了墙根，扫帚还靠在门边。') }
        ],
        async enter(S, first) {
          if (S.f.ph === 'out') return;
          if (!first) return prepGoal(S);
          S.f.ph = 'home';
          await S.narr('煤油灯捻得很小。\n屋里只听得见奶奶喘气的声音，和窗户纸被风吹得一鼓一瘪。');
          S.bubble('kang', '…', 1400);
          await S.say('奶奶', '……小满？你过来。');
          S.goal('到炕边，和奶奶说说话');
        }
      },
      /* ---------------- 镇西旧河滩 ---------------- */
      hetan: {
        amb: 'night', dark: .82, plr: 3, floor: 'dirt', fog: .28,
        tileOpts: { grassC: '#2a3428', treeC: '#16241c' },
        rows: [
          'TTTTTTTTTTTTTTTTTTTTTTTTTTTTTT',
          'T""""T"""""T""""""T"""""""""PP',
          '""""""""""""""""""""""""""""""',
          'dddddddddddddddddddddddddddddd',
          'dddddddddddddddddddddddddddddd',
          'ssssssssssssssssssssssssssssss',
          'sseeesssssseeesssssseeessssses',
          '~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~',
          '~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~'],
        ents: [
          { x: 0, y: 3, spr: 'invisible', touch: exit('home', 17, 8, 1) },
          { x: 0, y: 4, spr: 'invisible', touch: exit('home', 17, 9, 1) },
          { x: 29, y: 3, spr: 'invisible', touch: exit('guishi', 38, 5, 1) },
          { x: 29, y: 4, spr: 'invisible', touch: exit('guishi', 38, 5, 1) },
          { x: 2, y: 2, spr: 'sign', col: '#5a5448', on: S => S.narr('一块半埋在土里的石碑，刻着两个字：「柳渡」。\n碑脚下有人烧过纸，纸灰被风吹成一个圈。') },
          { x: 6, y: 2, spr: 'shrine', on: S => S.narr('路边的土地庙，比鸡窝大不了多少。\n庙里的土地公，被人用红布蒙住了眼睛。') },
          { x: 9, y: 7, w: 2, spr: 'boat', on: S => S.narr('一条冻在河边的小船。船舱里积着雪，雪上有一串小小的脚印——一直走到船头，就没了。') },
          { x: 20, y: 2, spr: 'invisible', solid: true, on: S => S.narr('枯了的柳树。树杈上挂着一只褪了色的小鞋。') },
          { x: 15, y: 6, spr: 'invisible', solid: true, on: S => S.narr('芦苇底下就是运河。冰没冻严，水在冰底下咕噜咕噜地走。') },
          { x: 4, y: 7, spr: 'hedeng', light: { r: 1.2, col: 'rgba(255,190,110,.16)' } },
          { x: 16, y: 8, spr: 'hedeng', light: { r: 1.2, col: 'rgba(255,190,110,.16)' } },
          { x: 23, y: 7, spr: 'hedeng', light: { r: 1.2, col: 'rgba(255,190,110,.16)' } },
          { x: 12, y: 6, spr: 'invisible', solid: true, on: S => S.narr('河面上漂着几盏莲花灯，不知是谁放的。\n腊月里，冰缝里，它们不往下游漂——它们往上游漂。') },
          ...[2, 3, 4, 5].map(y => ({ id: 'blk' + y, x: 28, y, spr: 'invisible', solid: true, on: S => S.narr('路到头了。前头是旧城隍庙塌了的后墙，墙根底下一片荒草。\n……这么晚了，什么也没有。') })),
          { id: 'pailou', x: 27, y: 2, h: 4, spr: 'pailou', z: 1, solid: false, hidden: true, light: { r: 3.4, dx: 14, dy: 32, col: 'rgba(210,228,255,.2)' } },
          { id: 'post1', x: 27, y: 2, spr: 'invisible', solid: true, hidden: true, on: S => S.narr('牌楼的柱子是黑的，摸上去不凉不热，像摸着一张旧纸。') },
          { id: 'post2', x: 27, y: 5, spr: 'invisible', solid: true, hidden: true, on: S => S.narr('柱脚下摆着一只碗，碗里是一碗清水，水面上漂着一层纸灰。') },
          { id: 'gh1', x: 15, y: 5, spr: '@g1', dir: 2, hidden: true, solid: false, alpha: .8 },
          { id: 'gh2', x: 18, y: 5, spr: '@g2', dir: 2, hidden: true, solid: false, alpha: .8 },
          { id: 'gh3', x: 21, y: 5, spr: '@g3', dir: 2, hidden: true, solid: false, alpha: .8 }
        ],
        async enter(S, first) {
          if (S.f.ph === 'out') return finaleOut(S);
          if (first) {
            S.f.ph = 'road'; S.wear('@me2');
            await S.narr('腊月的河滩，风像刀子。\n白灯笼在手里晃，照得见三步远的路，照不见河。');
            S.goal('沿河滩往东走，到旧城隍庙后头');
          }
        },
        step(S, x, y) { if (S.f.ph === 'road' && x >= 12) return midnight(S); }
      },
      /* ---------------- 鬼市 ---------------- */
      guishi: {
        amb: 'otherworld', dark: .82, plr: 3, wall: 'wood', floor: 'stone', fog: .18,
        wallC: { face: '#2a2a30', top: '#0a0a0e' },
        tileOpts: {},
        rows: [
          '########################################',
          '########################################',
          'dddddddddddddddddddddddddddddddddddddddd',
          'dddddddddddddddddddddddddddddddddddddddd',
          'kkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkk',
          'kkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkk',
          'dddddddddddddddddddddddddddddddddddddddd',
          'dddddddddddddddddddddddddddddddddddddddd',
          'kkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkk',
          'kkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkk',
          'LLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLL',
          '~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~',
          '~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~'],
        ents: [
          { x: 0, y: 8, spr: 'invisible', touch: exit('shouxiang', 16, 4, 1) },
          { x: 0, y: 9, spr: 'invisible', touch: exit('shouxiang', 16, 5, 1) },
          { x: 39, y: 4, spr: 'invisible', touch: exit('hetan', 26, 3, 1) },
          { x: 39, y: 5, spr: 'invisible', touch: exit('hetan', 26, 4, 1) },
          { x: 0, y: 7, spr: 'xiangmen', solid: true, on: S => S.narr('西头一条窄巷，巷口的木柱上挂着一串一串的长命锁，红绳子垂下来，一动不动。\n巷子里，一点一点的，是油灯的光。') },
          { x: 39, y: 3, spr: 'gdeng', solid: true, light: { r: 2, dx: 12, dy: -6, col: 'rgba(210,228,255,.16)' }, on: S => S.narr('牌楼的柱子。出了它，就是河滩。') },
          { x: 39, y: 6, spr: 'gdeng', solid: true, light: { r: 2, dx: 12, dy: -6, col: 'rgba(210,228,255,.16)' }, on: S => S.narr('柱子上贴着一张告示，墨迹早洇开了，只认得出最后两个字：「勿言」。') },
          ...stall('tan_zhi', 'zhi', 3, 3, '@zha', '#3a3436', S => decor(S, 'zhi')),
          ...stall('tan_xie', 'xie', 9, 3, '@xie', '#3a3a44', S => stallXie(S)),
          ...stall('tan_yi', 'yi', 16, 3, '@g2', '#30383e', S => decor(S, 'yi')),
          ...stall('tan_jiu', 'jiu', 23, 3, '@jiu', '#3a3430', S => stallJiu(S)),
          ...stall('tan_deng', 'deng', 30, 3, '@g4', '#34303a', S => decor(S, 'deng')),
          ...stall('tan_zhong', 'zhong', 36, 3, '@g3', '#2e3238', S => decor(S, 'zhong')),
          ...stall('tan_cha', 'cha', 5, 7, '@cha', '#3a3a34', S => decor(S, 'cha')),
          ...stall('tan_shu', 'shu', 12, 7, '@shu', '#3a3040', S => stallShu(S)),
          ...stall('tan_tang', 'tang', 19, 7, '@tang', '#44342a', S => stallTang(S)),
          ...stall('tan_hua', 'hua', 26, 7, '@g1', '#2e2e34', S => decor(S, 'hua')),
          ...stall('tan_wan', 'wan', 33, 7, '@g2', '#30363a', S => decor(S, 'wan')),
          { id: 'book', x: 25, y: 3, spr: 'book', col: '#8a7a5a', async on(S) { if (S.once('book')) await S.narr('旧货摊边上，地上压着一页发黄的书，被一块碎砖头压着。\n长衫先生没拦你。'); await S.note('guji'); } },
          { id: 'sg_g', x: 37, y: 6, spr: '@shiguan', dir: 1, solid: false, on: S => S.narr('一个戴乌纱帽的高个子，脸上蒙着一块白布，手里握着一根乌木戒尺。\n他不看摊子，也不看人。\n——他在听。') },
          { id: 'c1', x: 17, y: 4, spr: '@g3', dir: 3, solid: false, alpha: .75, on: S => S.narr('一个弯着腰挑旧衣裳的人。他拎起一件湿棉袄，在自己身上比了比。\n灯笼照着他，他脚底下，没有影子。') },
          { id: 'c2', x: 27, y: 8, spr: '@g4', dir: 3, solid: false, alpha: .75, on: S => S.narr('一个人捧着一张画像，看了很久很久。\n画像上那张脸，和他自己的一模一样。') },
          { id: 'c3', x: 6, y: 8, spr: '@g2', dir: 3, solid: false, alpha: .75, on: S => S.narr('一个女人端着茶碗，一口一口地喝。碗里的茶，怎么也不见少。') },
          { id: 'c4', x: 31, y: 4, spr: '@g1', dir: 3, solid: false, alpha: .75, on: S => S.narr('一个挑灯笼的人，把一盏白灯笼举到眼前，又放下，又举起来。\n他找的那盏，好像不在这儿。') },
          { id: 'w1', x: 8, y: 5, spr: '@g4', dir: 2, solid: false, alpha: .7, s: { d: 2, lo: 6, hi: 34 } },
          { id: 'w2', x: 30, y: 9, spr: '@g3', dir: 1, solid: false, alpha: .7, s: { d: 1, lo: 10, hi: 36 } },
          { id: 'hp_g', x: 0, y: 8, spr: '@huipao', dir: 2, solid: false, hidden: true },
          ...CROWD.map(c => ({ id: c.id, x: c.x0, y: c.y, spr: '@q', dir: 1, solid: false, hidden: true, alpha: .85, light: { r: 1.5, dx: 4, dy: 4, col: 'rgba(200,220,255,.18)' } })),
          { id: 'cr1a', x: 9, y: 8, spr: 'baoguo', solid: true, hidden: true, on: S => crateOn(S) },
          { id: 'cr1b', x: 9, y: 9, spr: 'baoguo', solid: true, hidden: true, on: S => crateOn(S) },
          { id: 'cr2a', x: 19, y: 4, spr: 'baoguo', solid: true, hidden: true, on: S => crateOn(S) },
          { id: 'cr2b', x: 19, y: 5, spr: 'baoguo', solid: true, hidden: true, on: S => crateOn(S) },
          { id: 'cr3a', x: 30, y: 8, spr: 'baoguo', solid: true, hidden: true, on: S => crateOn(S) },
          { id: 'cr3b', x: 30, y: 9, spr: 'baoguo', solid: true, hidden: true, on: S => crateOn(S) }
        ],
        async enter(S, first) {
          light(S);
          if (S.f.ph === 'escape') return escMarket(S);
          if (S.f.ph === 'night') return enterMarket(S);
        },
        step(S, x, y) {
          if (S.f.ph === 'market' && x <= 26 && !S.f.momDone) return momScene(S);
          if (S.f.ph === 'escape' && x >= 20 && S.once('voiceTrap')) return voiceTrap(S);
        }
      },
      /* ---------------- 寿巷 ---------------- */
      shouxiang: {
        amb: 'drone', dark: .84, plr: 3, wall: 'wood', floor: 'stone',
        wallC: { face: '#2a2622', top: '#0a0806' },
        rows: [
          '##################',
          '##################',
          '#kkkkkkkkkkkkkkkk#',
          '#kkkkkkkkkkkkkkkk#',
          '#kkkkkkkkkkkkkkkkk',
          '#kkkkkkkkkkkkkkkkk',
          '#kkkkkkkkkkkkkkkk#',
          '##################'],
        ents: [
          { x: 17, y: 4, spr: 'invisible', touch: exit('guishi', 1, 8, 2) },
          { x: 17, y: 5, spr: 'invisible', touch: exit('guishi', 1, 9, 2) },
          { id: 'shoutan', x: 2, y: 3, w: 3, spr: 'shoutan', solid: true, light: { r: 2.8, dx: 24, dy: 4, col: 'rgba(255,200,120,.2)', flick: true }, s: { suo: true }, on: S => chengOn(S) },
          { id: 'cheng', x: 3, y: 2, spr: '@cheng', dir: 0, on: S => chengOn(S) },
          { x: 2, y: 2, spr: 'barrel', on: S => S.narr('一只黑陶缸，缸口蒙着红布。\n布底下，有什么东西在一下一下地敲缸壁。……很轻。') },
          { x: 1, y: 3, spr: 'sack', on: S => S.narr('一只麻袋，袋口露出一截红绳，绳头上拴着一把小小的锁。\n和摊上那些一样。') },
          { x: 4, y: 2, spr: 'invisible', solid: true, on: S => S.narr('秤婆身后的墙根，一盏小油灯也没点。黑地里，有什么东西在一下一下地数数。') },
          { id: 'hp_s', x: 5, y: 3, spr: '@huipao', dir: 1, on: S => hpOn(S) },
          { x: 1, y: 1, w: 6, spr: 'suoqiang', on: S => S.narr('墙上钉满了钉子，每颗钉子上挂一串长命锁。\n有的锁上刻着字，有的锁锈得认不出来了。\n风从巷口吹进来，满墙的锁，一齐轻轻地响。') },
          { x: 8, y: 1, w: 3, spr: 'dengjia', light: { r: 1.8, dx: 24, dy: 8, col: 'rgba(255,190,110,.14)' }, on: S => S.narr('墙上的木架子，一排一排的小油灯，每盏灯底下贴着一张红纸条。\n有几盏灭了。灭了的那几张纸条上，名字被人拿墨划掉了。') },
          { x: 12, y: 1, w: 3, spr: 'dengjia', light: { r: 1.8, dx: 24, dy: 8, col: 'rgba(255,190,110,.14)' }, on: S => S.narr('你一盏一盏看过去，看见一张纸条上写着「刘」，一张写着「王」……\n没有「秦」。你松了一口气，又不敢再往下看了。') },
          { x: 9, y: 6, spr: 'candles', on: S => S.narr('墙根底下一堆烧剩的蜡烛头，蜡泪淌了一地，冻成了白花花的一片。') },
          { x: 14, y: 6, spr: 'invisible', solid: true, on: S => S.narr('巷子的墙皮剥落了，露出底下的青砖。砖缝里塞着一卷一卷的红纸条。') },
          { id: 'sg_s', x: 9, y: 4, spr: '@shiguan', dir: 0, solid: false, hidden: true }
        ],
        async enter(S, first) {
          light(S);
          if (S.f.ph === 'market' && !S.f.sawCheng) return firstCheng(S);
        }
      }
    }
  });

  /* ================= 地摊生成 ================= */
  function stall(id, k, x, y, keeper, col, fn) {
    const onK = S => fn(S);
    return [
      { id, x, y, w: 2, spr: 'tan', col, solid: true, s: { k }, light: { r: 2.3, dx: 28, dy: -4, col: 'rgba(210,228,255,.16)' }, on: onK },
      { id: id + '_k', x, y: y - 1, spr: keeper, dir: 0, alpha: .9, on: onK },
      { id: id + '_f', x: x + 1, y: y - 1, spr: 'invisible', solid: true, on: onK }
    ];
  }

  /* ================= 出口与光照 ================= */
  function blockMsg(S, to) {
    const ph = S.f.ph;
    if (S.map === 'home' && to === 'hetan') {
      if (ph === 'home') return '（先听奶奶把话说完。）';
      const miss = missing(S); if (miss.length) return '（还没带齐：' + miss.join('、') + '。）';
    }
    if (S.map === 'hetan' && to === 'home' && ph !== 'road') return '（回不去了。牌楼的灯，在身后亮着。）';
    if (S.map === 'guishi' && to === 'hetan' && ph === 'market') return '（栓子的锁还没换回来。\n这会儿出了牌楼，就再也换不回来了。）';
    if (S.map === 'guishi' && to === 'shouxiang' && ph === 'escape') return '（回头就是寿巷——不能回头！往东，出牌楼！）';
    return null;
  }
  function exit(to, x, y, dir) {
    return async S => {
      const m = blockMsg(S, to);
      if (m) { S.sfx('locked'); await S.narr(m); const p = S.pl; if (p.prev && (p.prev[0] !== p.x || p.prev[1] !== p.y)) S.pos(p.prev[0], p.prev[1]); return; }
      if (S.map === 'guishi' && to === 'hetan' && S.f.ph === 'escape') return finale(S);
      await S.go(to, x, y, dir);
    };
  }
  function light(S) {
    const inMkt = S.map === 'guishi' || S.map === 'shouxiang';
    if (S.map === 'guishi') S.dark(S.f.ph === 'escape' ? .9 : null);
    else if (S.map === 'shouxiang') S.dark(S.f.ph === 'escape' ? .88 : null);
    else S.dark(null);
    S.plr(inMkt && S.f.drankTea ? 2.2 : null);   // 喝过鬼市的茶，白灯笼就暗了
  }
  function nearCell(S) {
    const p = S.pl, m = curMap(), D = [[0, -1], [-1, 0], [1, 0], [0, 1]];
    const f = DIRS[p.dir]; const order = [[f[0], f[1]], ...D];
    for (const [dx, dy] of order) { const x = p.x + dx, y = p.y + dy; if (passable(m, x, y)) return [x, y]; }
    return [p.x, p.y - 1];
  }

  /* ================= 第一幕：秦家 ================= */
  function missing(S) {
    const r = [];
    if (!S.has('deng')) r.push('白灯笼'); if (!S.has('zq4')) r.push('纸钱'); if (!S.has('fc')) r.push('栓子的风车'); if (!S.has('zhen')) r.push('针线包');
    return r;
  }
  function prepGoal(S) {
    if (S.f.ph === 'home') return;
    const miss = missing(S);
    S.goal(miss.length ? '带上' + miss.join('、') + '（奶奶说的）' : '出院门，往东去镇西的旧河滩');
  }
  async function naiOn(S) {
    if (S.f.ph === 'out') return S.narr('奶奶闭着眼睛。');
    if (S.once('nai1')) {
      await S.say('奶奶', ['栓子昨儿后半夜，是从河滩那边回来的。脖子上的长命锁没了，手里攥着个纸风车。', '那锁上刻着他的名字、生辰，押着他的寿。他拿锁换了风车。']);
      await S.narr('你回头看栓子。他坐在炕沿上，睁着眼，不哭也不闹。\n灯在他背后——他脚底下，没有影子。');
      await S.say('奶奶', ['镇西旧河滩，每逢初一，子时开一个集，鸡叫头遍就散。那是鬼市。', '今儿腊月初一。那把锁今晚准摆在「寿摊」上——鸡叫前不赎回来，栓子的寿就是别人的了。', '奶奶这腿，走不到河滩了。规矩你记着。']);
      await S.note('guiju');
      await S.say('奶奶', ['白灯笼在门边，纸钱在灶王爷底下的匣子里。栓子手里那风车，也带上。', '再带样家里的小物件，针线包就挺好。你爹木箱里那本手势本子，也看看。']);
      await S.narr('奶奶从发髻上拔下那根银簪，塞进你手心。');
      await S.say('奶奶', '这个你也拿着。……实在换不来，就把它摆上去。');
      S.give('zan');
      S.f.ph = 'prep';
      prepGoal(S);
      return;
    }
    if (!missing(S).length) return S.say('奶奶', cycle(S, '_n2', ['去吧。鸡叫头遍之前，一定出来。', '一个字也别说。谁喊你都别应——哪怕是熟人。', '小满……灯笼提稳了。']));
    return S.say('奶奶', cycle(S, '_n1', ['栓子画了张画，压在炕沿底下。小孩子眼睛干净，看见的比大人多。', '东西带齐了再走。鬼市里，不认钱多钱少，认你摆上去的是不是人家要的。', '鸡叫头遍之前，一定出来。']));
  }
  async function shuanOn(S) {
    if (S.f.ph === 'out') return S.say('栓子', '姐……');
    if (S.has('fc') || S.f.fcGone) return S.narr(cycle(S, '_sh', ['栓子直愣愣地看着窗户。\n你叫他，他慢慢转过头来——眼睛里有你，又好像没有。', '你摸摸他的手，冰凉。\n他嘴唇动了动，没出声。', '炕沿下，灯照着的地方，只有你一个人的影子。']));
    await S.narr('栓子攥着那只纸风车，攥得指节都白了。\n你一根一根掰开他的手指，把风车拿了出来。');
    S.give('fc'); S.ent('shuan').spr = '@shuan2';
    await S.narr('他没有哭，手还保持着攥东西的样子。\n风车在你手里，没有风，自己慢慢转了半圈。');
    prepGoal(S);
  }
  async function basketOn(S) {
    if (S.has('zhen') || S.f.zhenGone) return S.narr('针线笸箩里剩下几团碎布头和一把剪子。');
    await S.narr('奶奶的针线笸箩。最上头是那个蓝布针线包，里头插着两根大针，一绕黑线。');
    S.give('zhen'); prepGoal(S);
  }
  async function dengOn(S) {
    await S.narr('门边的木架上挂着一盏白纸灯笼。\n你点上灯，提起来。灯光是白的，冷冷的，照在手背上没有一点热气。');
    S.give('deng'); S.hide('baideng'); S.wear('@me2'); prepGoal(S);
  }
  async function xiaziOn(S) {
    const e = S.ent('xiazi');
    if (e.s.empty) return S.narr('匣子空了，底上落着一点黄纸屑。');
    await S.narr('灶王爷底下的小木匣，封口贴着红纸。\n里头是四叠纸钱，麻绳捆着。');
    e.s.empty = true; S.give('zq4'); prepGoal(S);
  }

  /* ================= 第二幕：河滩，子时 ================= */
  async function midnight(S) {
    S.f.ph = 'night';
    for (let i = 0; i < 3; i++) { BANG(S); await S.wait(260); BANG(S, .8); await S.wait(700); }
    await S.narr('镇子那头，更夫的梆子敲了三更。\n——子时了。');
    S.ent('pailou').alpha = 0; S.show('post1'); S.show('post2'); [2, 3, 4, 5].forEach(y => S.hide('blk' + y));
    CHIME(S, 1.2);
    S.focus(26, 3);
    await S.alpha('pailou', 1, 1400);
    await S.narr('河滩尽头，一盏、两盏、三盏……白灯笼一盏接一盏亮起来。\n灯笼底下立着一座牌楼。刚才那儿，明明只有半堵塌墙。');
    S.focus(null);
    ['gh1', 'gh2', 'gh3'].forEach(id => S.show(id));
    await Promise.all([S.walk('gh1', [26, 3], 2.2), S.walk('gh2', [25, 4], 2.1), S.walk('gh3', [24, 3], 2)]);
    await S.narr('芦苇丛里走出三个人影，提着白灯笼，一声不响地走进了牌楼。\n他们走过的沙地上，没有脚印。');
    await Promise.all(['gh1', 'gh2', 'gh3'].map(id => S.alpha(id, 0, 700)));
    await S.think('奶奶说……提着白灯笼，跟着走。别说话，别跑。');
    S.goal('提着白灯笼，走进河滩尽头的牌楼');
    S.cp();
  }

  /* ================= 第三幕：鬼市 ================= */
  async function enterMarket(S) {
    S.f.ph = 'market'; S.norun(true);
    CHIME(S, .8);
    await S.narr('一进牌楼，风就停了。\n两排地摊，一眼望不到头，每个摊角上挑着一盏小白灯笼。');
    await S.narr('卖东西的蹲在摊子后头，不吆喝。买东西的弯着腰看，不问价。\n满街的人，没有一点声音。你自己的脚步声，闷闷的，像踩在棉花上。');
    await S.think('一个字也不能说。不能跑。\n栓子的画上……锁挂在一个提秤的老太太手里。');
    S.goal(mGoal(S));
    S.cp('market');
  }
  function mGoal(S) {
    const f = S.f;
    if (f.won) return '鸡叫之前，走出鬼市东头的牌楼（不能跑，不能出声）';
    if (!f.sawCheng) return '找栓子的长命锁（栓子的画：锁挂在一个提秤的老太太手里）';
    if (f.t_cheng) return S.has('zq7') || !f.shortMoney ? '把手伸进秤婆的袖筒比价，压过灰袍客（双人时：一人翻「笺」里爹的手势本念，一人比）' : '纸钱不够压过灰袍客——糖人摊那孩子，好像在找自己丢的东西';
    if (S.has('tuo')) return '回寿巷，把秤砣摆到秤婆的摊上';
    if (S.has('jing')) return '把铜镜摆到旧货摊上，换那个秤砣';
    if (f.sawJiu) {
      if (f.sawShu && !f.t_shu) return S.has('shu') ? '把桃木梳摆到梳头女人的摊上，换她的铜镜' : '梳头的女人缺把梳子……鬼市里谁有？';
      return '旧货摊的秤砣压不住画——先生要一样又沉又宽的东西才肯换';
    }
    return '秤婆的戥子缺个秤砣——鬼市里，哪个摊上有？';
  }
  async function momScene(S) {
    S.f.momDone = true;
    S.sfx('whisper');
    await S.narr('人群里，有人轻轻喊了一声：\n「……小满。」');
    await S.think('这声音……是娘。\n娘走了两年了。');
    const r = await S.ask('那声音又近了一点，就在你耳朵后头。', ['「……娘？」', '（咬住嘴唇。不应，也不回头）']);
    if (r === 0) { S.f.ansMom = true; await speak(S, '……娘？'); await S.narr('人群里，再也没有那个声音了。'); return; }
    await S.narr('你攥紧灯笼杆，指甲掐进手心。\n过了好一会儿，身后有人很轻很轻地叹了口气。\n脚步声没有——可你知道，她走远了。');
  }
  function marketTick(S, dt) {
    if (W.busy) return;
    S.f._ct = (S.f._ct ?? 4) - dt;
    if (S.f._ct <= 0) { S.f._ct = 5 + Math.random() * 4; CHIME(S, .5 + Math.random() * .4); }
    for (const id of ['w1', 'w2']) {   // 两个慢慢踱步的「客人」
      const e = S.ent(id); if (!e || e.hidden || e.mv) continue;
      const x = Math.round(e.px / TS); let d = e.s.d;
      if ((d === 2 && x >= e.s.hi) || (d === 1 && x <= e.s.lo)) { e.s.d = d = d === 2 ? 1 : 2; }
      if (Math.abs(S.pl.x - (x + (d === 2 ? 1 : -1))) + Math.abs(S.pl.y - Math.round(e.py / TS)) === 0) continue;
      startMove(e, d, 1.1);
    }
  }
  /* ---------- 开口 ---------- */
  async function speak(S, line) {
    S.f.spoke = (S.f.spoke || 0) + 1;
    await S.say('小满', line);
    if (S.f.spoke >= 2) return badMute(S);
    const id = S.map === 'shouxiang' ? 'sg_s' : 'sg_g', sg = S.ent(id), keep = [sg.px, sg.py, sg.dir, sg.hidden];
    S.sfx('sting'); S.dark(.96);
    await S.narr('话一出口，四下里一下子静了。\n不是原先那种静——是所有的灯笼，一齐朝你这边转过来的那种静。');
    const [cx, cy] = nearCell(S);
    S.place(id, cx, cy); S.face(id, 'pl'); S.face('pl', id);
    await S.scare('face', { spr: '@shiguan', dur: 1 });
    await S.narr('一个戴乌纱帽的高个子，就站在你跟前。脸上蒙着一块白布，布底下，什么起伏也没有。\n他抬起一根乌木戒尺，轻轻点在你嘴唇上。冰的。');
    await S.narr('戒尺点了一下，停住。\n——这是一下。');
    sg.px = keep[0]; sg.py = keep[1]; sg.x = Math.round(keep[0] / TS); sg.y = Math.round(keep[1] / TS); sg.dir = keep[2]; sg.hidden = keep[3];
    light(S);
    await S.think('……再开口，就留在这儿了。');
    S.toast('在鬼市里再开口一次，就回不去了');
  }
  async function badMute(S) {
    S.clearTimer(); for (const id of ['hp_g']) S.stop(id);
    S.sfx('sting'); S.dark(.97);
    await S.narr('你听见自己的声音从嘴里出去——\n然后，就再也没回来。');
    await S.scare('red', { dur: .9 });
    await S.narr('你张开嘴想喊，嗓子里只有一阵风。\n有人轻轻拍了拍你的肩膀，把一块叠好的蓝布，塞进你手里。');
    await S.end({ bad: true, id: 'mute', title: '开了口', text: '第二年腊月初一，有人在镇西的鬼市上，看见一个不说话的姑娘。\n\n她蹲在一块蓝布后头，布上摆着一盏白纸灯笼、一个针线包。\n谁走过去，她就抬起头，嘴唇动一动——\n像是想问路，又像是在喊一个人的名字。\n\n没有人停下来。\n鬼市里，不说话。\n\n那年冬天，秦家的小儿子，一直没有醒。' });
  }
  /* ---------- 摆上东西换 ---------- */
  async function offer(S, prompt) {
    const ids = TRADE.filter(i => S.has(i));
    const opts = ids.map(i => '摆上' + nm(i));
    opts.push('（开口问）「这个……怎么换？」', '（走开）');
    const r = await S.ask(prompt, opts);
    if (r === ids.length) { await speak(S, '这个……怎么换？'); return null; }
    if (r == null || r > ids.length) return null;
    const id = ids[r];
    if (id === 'zan') {
      const c = await S.ask('奶奶说：「实在换不来，就把它摆上去。」\n……现在，算不算「实在换不来」？', ['摆上去', '（攥紧簪子，再想想）']);
      if (c !== 0) return null;
    }
    return id;
  }
  async function refuse(S, key, lines) {
    S.sfx('paper');
    const n = S.f['_r_' + key] = (S.f['_r_' + key] || 0) + 1;
    await S.narr(lines[Math.min(n, lines.length) - 1]);
    /* 乱摆有代价：每被推回三次，市官的戒尺响一声，散市时就少两秒（最多六秒） */
    S.f._wrongAll = (S.f._wrongAll || 0) + 1;
    if (S.f._wrongAll % 3 === 0) {
      S.f.escPen = Math.min(6, (S.f.escPen || 0) + 2);
      S.tone('square', 900, 700, .04, .06, 0, 2600); S.tone('square', 880, 690, .04, .05, .12, 2600);
      await S.narr('远处，「嗒、嗒」两声——市官的戒尺，在他自己掌心里敲了两下。\n他朝你这边，偏了偏头。');
      if (S.f._wrongAll === 3) await S.think('……乱摆东西，他听得见。\n看清楚人家缺什么，再摆。');
    }
  }
  function escapeLook(S) { return S.narr(cycle(S, '_esl', ['摊子已经卷起来了，地上只剩一块湿印子。', '卖东西的扛着包袱，头也不回地往巷子深处去了。'])); }
  async function stallXie(S) {
    if (S.f.ph === 'escape') return escapeLook(S);
    if (S.f.t_xie) return S.narr('老汉低着头，一针一针地纳鞋底。缝好的那只旧鞋，已经穿在他脚上了。\n另一只脚，还光着。');
    if (S.once('xie0')) {
      S.f.sawXie = true;
      await S.narr('鞋摊。一块破布上摆着十几双布鞋，都是新的，鞋底纳得密密麻麻。\n可卖鞋的老汉自己，光着一双脚。');
      await S.narr('他手里攥着一只旧鞋，鞋帮和鞋底裂开一道大口子。\n他捏着两根手指，一下一下地在半空里比划——像在穿针引线。可他手里什么也没有。');
    } else await S.narr('老汉捏着两根手指，在半空里一下一下地比划：穿针，引线。');
    const id = await offer(S, '摆上什么？');
    if (!id) return;
    if (id !== 'zhen') return refuse(S, 'xie', ['老汉看了看，把它推了回来。\n手指头又在半空里比划：穿针，引线。', '他把那只破鞋往你跟前一递，指指裂口，又捏起两根手指，往鞋帮上「扎」了一下。', '老汉叹了口气，对着你的灯笼眯起眼——要是有根针就好了。', '（你想起来：奶奶那个蓝布针线包，就在你兜里。）']);
    S.take('zhen'); S.f.zhenGone = true; S.sfx('item');
    await S.narr('你把针线包摆在破布上。\n老汉愣了一下，抓起针，凑到灯笼底下——针眼对了半天，线头怎么也穿不进去。');
    const r = await S.ask('他的手在抖。', ['（接过针，替他穿上）', '（等着他自己穿）']);
    if (r === 0) { S.f.kindXie = true; await S.narr('你接过针，把线头在嘴唇上抿了抿——没出声——一下就穿过去了。\n老汉朝你作了个揖，腰弯得很低。'); }
    else await S.narr('他试到第五回，才穿过去。');
    S.ent('tan_xie').s.done = true;
    await S.narr('他三两下缝好旧鞋，套在脚上，又从破布底下摸出一把桃木梳子，推到你跟前。');
    S.f.t_xie = true; S.give('shu'); S.goal(mGoal(S));
  }
  async function stallShu(S) {
    if (S.f.ph === 'escape') return escapeLook(S);
    if (S.f.t_shu) return S.narr(S.f.zanGone ? '她把头发挽了起来，银簪别在发髻上。\n簪头那朵小梅花，你看了一辈子。' : '她还在梳头。一下，一下，从头顶一直梳到地上。\n头发里不再往下掉沙子了。');
    if (S.once('shu0')) {
      S.f.sawShu = true;
      await S.narr('一个女人跪坐在摊子后头，长头发散着，一直垂到地上，把脸遮得严严实实。\n摊上摆着头绳、胭脂盒，还有一面扣着的铜镜。');
      await S.narr('她的手指一遍一遍插进头发里，往下梳——指头被打结的头发卡住，扯断了几根，又从头来。');
    } else await S.narr('她的手指插在头发里，一下，一下，梳不通。');
    const id = await offer(S, '摆上什么？');
    if (!id) return;
    if (id === 'zan') {
      S.take('zan'); S.f.zanGone = true; S.f.t_shu = true; S.ent('tan_shu').s.traded = 'zan';
      await S.narr('你把银簪摆过去。\n她的手停住了。她拿起簪子，把一头长发绾起来，别住——\n发髻挽好的那一下，你听见很远很远的地方，有人轻轻咳嗽了一声。');
      await S.narr('她把那面扣着的铜镜推给了你。');
      S.give('jing'); S.goal(mGoal(S)); return;
    }
    if (id !== 'shu') return refuse(S, 'shu', ['她的手顿了一下，又接着梳。那东西被她的头发扫回到你面前。', '她把手伸到你面前，五根手指张开，像梳齿一样，从头顶往下一划。', '她的指甲缝里全是扯下来的头发。她要的，是一把能梳通的东西。', '（梳子……鞋摊老汉的破布底下，好像压着一把。他缺的是针线。）']);
    S.take('shu'); S.f.t_shu = true; S.ent('tan_shu').s.traded = 'shu'; S.sfx('item');
    await S.narr('你把桃木梳摆过去。\n她拿起梳子，从头顶往下，一梳到底。头发里簌簌地掉下来一些东西——沙子，水草，一枚生了锈的顶针。');
    await S.narr('她梳了很久，然后把那面扣着的铜镜推给你。\n你接镜子的时候，镜面朝上晃了一下——镜子里，她身后空空的，连那一头长发都没有。');
    S.give('jing'); S.goal(mGoal(S));
  }
  async function stallJiu(S) {
    if (S.f.ph === 'escape') return escapeLook(S);
    if (S.f.t_jiu) return S.narr('先生两手揣在袖子里，看着压平了的画，一动不动。\n画上那座桥底下，好像多了一个提灯笼的人。');
    if (S.once('jiu0')) {
      S.f.sawJiu = true;
      await S.narr('旧货摊。一个穿长衫的先生，戴着一副圆眼镜——镜片后头，什么也没有。');
      await S.narr('摊上摊着一幅画轴，画的是一条河、一座桥。画的左角压着一个铜秤砣，右边却老被风掀起来，啪嗒、啪嗒。\n先生拿袖子按住它，一松手，又掀起来。');
      if (S.f.sawCheng) await S.think('秤砣！秤婆的戥子上，缺的就是它。');
      S.goal(mGoal(S));
    } else await S.narr('画的右边又掀起来了，啪嗒、啪嗒。先生拿袖子按着。');
    const id = await offer(S, '摆上什么？');
    if (!id) return;
    if (id !== 'jing') return refuse(S, 'jiu', ['先生把它往画上压了压——压不住，画角照样掀起来。他摇摇头，推了回来。', '他两只手比了一个圆，比秤砣大得多，又往下按了按：要沉的，要宽的。', '他用指节敲了敲秤砣，又敲了敲画边：小了，压不住一整条。要一样又平、又沉、又宽的东西——像一块铜饼子。', '（又平又沉的铜东西……梳头女人摊上那面扣着的铜镜！）']);
    S.take('jing'); S.f.t_jiu = true; S.ent('tan_jiu').s.mirror = true; S.sfx('item');
    await S.narr('你把铜镜轻轻压在画上。\n画平了，再也不掀了。');
    await S.narr('先生低头看了半天，伸手摸了摸镜子的边，点点头。他把秤砣从画角上拿下来，推到你面前。');
    S.give('tuo'); S.goal(mGoal(S));
  }
  async function stallTang(S) {
    if (S.f.ph === 'escape') return escapeLook(S);
    if (S.f.t_tang) return S.narr('小孩仰着脸，看草把子顶上那只风车，一圈，一圈，一圈。\n他好像已经忘了你。');
    if (S.once('tang0')) {
      S.f.sawTang = true;
      await S.narr('一个戴虎头帽的小孩蹲在摊子后头。草把子上插满了糖人：猴子、公鸡、关老爷。\n草把子顶上空着一个窟窿，原先插着什么。');
      await S.narr('小孩东张西望，一会儿看看这个，一会儿看看那个——像在找自己丢的东西。');
      if (S.f.readHua) await S.think('虎头帽……栓子画上那个举着风车的小人！');
    } else await S.narr('小孩踮着脚，在人缝里张望。');
    const id = await offer(S, '摆上什么？');
    if (!id) return;
    if (id !== 'fc') return refuse(S, 'tang', ['小孩看了一眼，扁扁嘴，把头扭到一边。', '他伸出食指，在空中画了一个圈，转啊转，转啊转。', '他踮起脚，对着草把子顶上的窟窿，「呼——」地吹了一口气。没有声音。', '（窟窿是插风车的。栓子的画上，虎头帽举着的，就是你兜里那只风车。）']);
    S.take('fc'); S.f.fcGone = true; S.f.t_tang = true; S.ent('tan_tang').s.fc = true; S.sfx('item');
    await S.narr('你把风车摆在他跟前。\n小孩一把抓过去，往草把子顶上一插。风车没有风，自己转了起来。\n他咯咯地笑——没有声音，只看得见虎头帽一颤一颤。');
    await S.narr('笑完了，他从怀里掏出一沓纸钱，数出三叠，塞进你手里。\n那纸钱凉得扎手。……是秤婆收锁的时候，付给他的钱。');
    S.take('zq4'); S.give('zq7'); S.goal(mGoal(S));
  }
  const DECOR = {
    zhi: ['纸扎摊：纸马、纸轿、纸金山，一排纸人涂着两团红脸蛋，站得笔直。\n最末一个位置空着。地上留着一圈浅浅的印子，是一双脚的形状。', '扎纸的老头低着头，剪刀咔嚓咔嚓，剪出来的都是小人。他一个也不摆，剪完就揣进怀里。'],
    yi: ['旧衣摊：棉袄、马褂、绣花鞋……每一件都是湿的，衣角滴着水，在石板上积成一小摊一小摊。', '卖衣裳的女人把一件小棉袄抖开，比了比，又叠起来。那棉袄的大小，正合栓子穿。'],
    deng: ['灯笼摊：白的、扁的、圆的。只有一盏是红的，挂在最里头。\n有一盏白灯笼上写着「秦」字——你家的姓。', '卖灯笼的人把那盏写着「秦」字的灯笼，往里头挪了挪。'],
    zhong: ['几只座钟、一块怀表，指针全停在同一个地方——子时。\n你看了很久，没有一根针动过。', '摊主拿起怀表贴在耳朵上听，听了很久，又放下了。'],
    hua: ['画像摊：一摞摞装框的画像，都是过世的人，穿着寿衣，脸画得白白的。\n最上面一张，是个梳着圆髻的年轻女人。……你娘也梳这样的头。', '你不敢再看那张画像了。'],
    wan: ['碗摊：粗瓷碗、青花碗，每只碗里盛着一点清水，水面上漂着一根点着的灯芯。\n有一只碗里的灯芯，刚刚灭了。', '卖碗的人把灭了灯芯的那只碗收进了筐里。']
  };
  async function decor(S, k) {
    if (S.f.ph === 'escape') return escapeLook(S);
    if (k === 'cha') return chaOn(S);
    const L = DECOR[k];
    await S.narr(S.once('dc_' + k) ? L[0] : L[1]);
  }
  async function chaOn(S) {
    if (S.f.drankTea) return S.narr('卖茶的老婆婆又倒了一碗，推过来。你没有再碰。');
    await S.narr('茶摊：一把大铜壶，一摞粗碗。卖茶的老婆婆倒了一碗，推到你面前。\n茶是温的，冒着白气，闻着像……家里过年煮的枣茶。');
    const r = await S.ask('碗沿碰到了你的手指，暖的。', ['（端起来喝一口）', '（把碗推回去）']);
    if (r === 1) return S.narr('你想起奶奶的话：鬼市的东西，一口也别吃。\n你把碗推了回去。老婆婆也不恼，把茶倒回壶里。');
    S.f.drankTea = true; S.sfx('sting'); S.shake(300, 1);
    await S.narr('你嘴唇刚碰到碗沿——\n碗里的茶，一下子变成了河底的泥汤，一股腥味直冲鼻子。\n你干呕着把碗放下。老婆婆把那碗泥汤倒回壶里，又倒了一碗。');
    S.plr(2.2);
    await S.narr('手里的白灯笼「噗」地缩了一下，火苗变成青幽幽的，只照得见脚尖。');
    await S.think('……奶奶说过，一口也别吃。\n舌头底下，一股河泥味，怎么也咽不下去。');
  }
  async function crateOn(S) { return S.narr('收摊的人把箱笼摞在路当中，堵死了。\n往别处绕——跟着还亮着的灯笼走。'); }

  /* ================= 第四幕：寿巷 ================= */
  async function firstCheng(S) {
    S.f.sawCheng = true;
    await S.narr('巷子很窄。两边墙上一层一层的木架，架上点着一盏盏小油灯——有的亮，有的灭了。');
    S.focus(4, 3);
    await S.narr('巷子尽头一个摊子。摊子后头坐着个驼背的老太太，手边一杆戥子。\n摊上摆满了长命锁，每把锁前头点着一根白蜡烛，有长有短。');
    await S.think('寿摊……就是奶奶说的寿摊。');
    await S.narr('戥子的秤盘里，躺着一把锁。红绳是你去年亲手给他编的。\n摊边站着一个穿灰袍子的人，一只手揣在老太太的袖筒里——在讲价。');
    CLICK(S);
    await S.narr('可老太太的戥子上没有秤砣。秤钩空荡荡地晃着。\n她一次一次去够那根秤杆，秤杆一次一次翘起来。');
    S.focus(null);
    await S.think('没有秤砣，她称不了……这买卖就还没成。\n得给她找个秤砣来。');
    if (S.f.sawJiu) await S.think('旧货摊的画角上，压着的不就是一个秤砣？');
    S.goal(mGoal(S));
  }
  async function hpOn(S) {
    if (S.f.won) return S.narr('灰袍客已经不在了。地上留着一小撮纸灰。');
    await S.narr(cycle(S, '_hp', ['灰袍客背对着你，一只手揣在秤婆的袖筒里。\n他的袍子底下，没有脚——袍摆贴着地，纹丝不动。', '你凑近一点，闻见一股新糨糊的味道。\n他的后脖颈是白的，白得发亮，上头一道一道，是纸的折痕。', '他的手在袖筒里一动不动，像在等。\n等秤砣，还是等鸡叫？']));
  }
  async function chengOn(S) {
    if (S.f.ph === 'escape') return S.narr('秤婆低着头，拨弄她的戥子。她没有再看你一眼。\n摊上的蜡烛，一根接一根地矮下去。');
    if (!S.f.sawCheng) return firstCheng(S);
    if (S.f.t_cheng) return bid(S);
    await S.narr(cycle(S, '_ch', ['秤婆抬起眼皮看了你一眼，枯手指点了点空着的秤钩，又拿拇指和食指圈了个圈。', '秤婆把秤杆提起来，秤杆「噌」地翘上了天。她摇摇头，又点了点秤钩。']));
    const id = await offer(S, '摆上什么？');
    if (!id) return;
    if (id === 'zan') return zanTrade(S);
    if (id !== 'tuo') return refuse(S, 'cheng', ['秤婆看也不看，枯手指把它推了回来，又点了点空秤钩。', '她把那东西往秤钩上比了比——挂不上。她拿拇指和食指圈了个圈，往下坠了坠：要一个能挂上去、沉甸甸的东西。', '秤婆用指甲在摊边上划了一个字：「砣」。', '（秤砣……旧货摊那幅画的左角上，压着一个。）']);
    S.take('tuo'); S.f.t_cheng = true; S.ent('shoutan').s.tuo = true; S.sfx('item');
    await S.narr('你把铜秤砣摆上摊子。\n秤婆一把抓过去，挂上秤钩，提起戥子——');
    CLICK(S); await S.wait(500); CLICK(S);
    await S.narr('秤砣在秤杆上慢慢滑，滑过一颗星，又一颗星……停住了。\n秤婆眯着眼看了很久，然后把另一只袖筒，朝你伸了过来。');
    await S.think('……这是叫我出价。\n价钱在袖子里。');
    S.goal(mGoal(S));
    return bid(S);
  }
  async function zanTrade(S) {
    S.take('zan'); S.f.zanGone = true; S.sfx('item');
    await S.narr('你把银簪摆在摊上。\n秤婆的手停住了。她拿起银簪，放在手心里掂了掂——用不着秤，她也知道它有多重。');
    await S.narr('灰袍客的手，从她袖筒里慢慢抽了出去。\n秤婆从秤盘里拿起那把锁，放进你手心里。温的。');
    return gotLock(S);
  }
  async function bid(S) {
    if (S.once('sleeve1')) await S.narr('你把手伸进秤婆的袖筒。袖筒里又冷又空，像伸进一口井。\n……里头已经有一只手了。凉的，薄的，一碰就沙沙响，像一张折起来的纸。');
    else await S.narr('秤婆又把袖筒伸了过来。你把手伸进去——那只纸手还在。');
    HEART(S, .8);
    await S.narr('你摸着它的指头：拇指和小指支棱着，中间三根，蜷在掌心里。\n它不动，在等你出价。');
    const have = S.has('zq7') ? 7 : S.has('zq4') ? 4 : 0;
    const v = await S.keypad('在袖筒里比你的价：压过他（兜里：纸钱' + have + '叠）' + (S.coop ? '\n（另一位可以打开「笺」里爹的手势本念给你听；键盘 1–0 对应按钮顺序）' : '\n（爹的手势本可以在「笺」里重看；键盘 1–0 对应按钮顺序）'), KEYS, 1, { alias: KALIAS });
    if (v == null || v === '') return S.narr('你把手抽了回来。袖筒里那只纸手，还在原处。');
    const n = SIGNS.indexOf(v) + 1, money = S.has('zq7') ? 7 : S.has('zq4') ? 4 : 0;
    if (n === 7 && money >= 7) return winBid(S);
    S.f.bidWrong = (S.f.bidWrong || 0) + 1;
    const b = S.ent('shoutan'); b.s.burn = Math.min(3, (b.s.burn || 0) + 1);
    S.sfx('bad');
    if (n <= 6) await S.narr(n === 6 ? '你比的，和那只纸手一模一样。\n秤婆摇了摇头。——一样多，锁就归先出价的那个。' : '秤婆摇了摇头。\n袖筒里那只纸手，轻轻地、得意地，蹭了一下你的手背。');
    else { if (money < n) S.f.shortMoney = true; await S.narr('秤婆点了点头，枯手指在托盘边上敲了敲：拿钱来。\n你把纸钱一叠一叠数到托盘里……数完了，还差' + (n - money) + '叠。\n秤婆把纸钱推回来，眼皮都没抬。'); }
    S.tone('sine', 320, 70, .3, .07, 0, 900); S.tone('sawtooth', 160, 60, .2, .02, 0, 500); HEART(S, 1);
    await S.narr('寿摊上，栓子那把锁跟前的蜡烛，「噗」地矮了一截。');
    const k = S.f.bidWrong;
    if (k === 1) await S.think('他比的那个手势……爹的本子上有。\n要比他多一手，又不能多过我兜里的纸钱。');
    else if (k === 2) await S.think('拇指和小指翘着，是「六」。\n压过他，就得比「七」。');
    else await S.think('「七」是三尖捏——拇指、食指、中指三个尖捏在一起。\n纸钱得有七叠才付得起。');
    if (money < 7 && n >= 7) await S.think('兜里只有四叠……糖人摊那孩子，好像在找什么东西。');
    S.goal(mGoal(S));
  }
  async function winBid(S) {
    S.take('zq7');
    await S.narr('你在袖筒里捏拢了三根指尖。\n那只纸手僵了一下，慢慢地，抽了出去。');
    CLICK(S);
    await S.narr('你把七叠纸钱数进托盘。秤婆数了一遍，点点头，从秤盘里拿起那把锁。');
    S.face('hp_s', 'pl');
    await S.scare('face', { spr: '@huipao', dur: 1 });
    await S.narr('灰袍客转过脸来。\n那是一张纸糊的脸：两团红胭脂，墨点的眼睛，画上去的笑。\n画上去的笑，一点一点，咧开了。');
    await S.narr('秤婆把锁放进你手心。温的。');
    return gotLock(S);
  }
  async function gotLock(S) {
    S.f.won = true; S.ent('shoutan').s.suo = false;
    S.give('suo');
    PAPER(S, 1);
    await S.alpha('hp_s', 0, 800);
    await S.narr('你再抬头，灰袍客已经不见了。\n他站过的地方，留着一小撮纸灰。');
    for (let i = 0; i < 5; i++) { BANG(S, .7); await S.wait(420); }
    await S.narr('巷子外头，远远地，梆子敲了五下。五更了。\n寿摊上的蜡烛，一根接一根地矮下去——鬼市要散了。');
    await S.think('鸡叫之前，出牌楼！');
    S.f.ph = 'escape'; S.norun(true); light(S);
    S.goal(mGoal(S));
    S.cp('escape');
    startTimer(S);
  }

  /* ================= 第五幕：散市 ================= */
  function startTimer(S) {
    const base = Math.max(ESC_FLOOR, ESC_T - 2 * Math.min(3, S.f.bidWrong || 0) - (S.f.escPen || 0));   // 答错、乱摆会扣时间，但不低于下限
    const t = S.f._escT != null ? Math.min(base, Math.max(ESC_FLOOR, S.f._escT)) : base;
    S.timer(t, '鸡叫', dawnBad, { during: true });
  }
  /* 死亡/坏结局时写进当前检查点：重来后的计时（剩余与下限取大）和死亡次数 */
  function bumpEsc(S, left) { if (W.cp && W.cp.f) { W.cp.f._escT = Math.max(ESC_FLOOR, left || 0); W.cp.f._escD = (W.cp.f._escD || 0) + 1; } }
  async function escMarket(S) {
    CRATES.forEach(id => S.show(id));
    CUSTOM.forEach(id => S.hide(id));
    MATS.forEach(id => { S.ent(id).off = true; S.hide(id + '_k'); });   // 摊主都收摊走了，只剩摊布
    if (S.f.kindXie) { S.hide('cr2a'); S.hide('cr2b'); S.place('tan_xie_k', 19, 3, 0); }   // 替他穿过针：老汉把那摞箱笼挪开了
    S.lights(ROUTE.map(([x, y]) => [x * TS + 8, y * TS + 8, 1.5, .6]));
    CROWD.forEach(c => { const e = S.ent(c.id); S.place(c.id, c.x0, c.y, 1); e.alpha = .85; e.s.away = 0; });
    const h = S.ent('hp_g'); S.stop('hp_g'); h.px = 0; h.py = 8 * TS; h.x = 0; h.y = 8; h.hidden = true;
    S.f._hpOn = false; S.f._hpT = 2.4; S.f._hpWarn = false; S.f._hitCD = false; S.f._hits = 0;
    if (!S.f._escD && S.once('escIntro')) {
      await S.narr('鬼市在散。卖东西的卷起地上的布，扛起包袱，逆着你往巷子里走。\n摊上的灯笼都灭了——只剩一路，还亮着。');
      if (S.f.kindXie) await S.narr('路当中摞着的箱笼旁边，光脚的老汉朝你作了个揖，把一摞箱笼推到了墙根。');
    } else S.toast(S.f.kindXie ? '跟着亮着的灯笼走；鞋摊老汉替你挪开了一摞箱笼' : '跟着亮着的那一路灯笼走');
  }
  function escTick(S, dt) {
    if (W.busy) return;
    const p = S.pl;
    if (!S.f._hpOn) {
      S.f._hpT -= dt;
      /* 预警：先听见沙沙声，巷口晃出半个灰影（不追），一秒后才追上来 */
      if (S.f._hpT <= 1 && !S.f._hpWarn) { S.f._hpWarn = true; PAPER(S, 1.2); S.place('hp_g', 0, 8, 2); S.ent('hp_g').alpha = .35; S.toast('身后，寿巷口晃出一角灰袍……'); }
      const d = p.x + Math.abs(p.y - 8);
      if (S.f._hpT <= 0 && (d >= 3 || S.f._hpT < -2)) { S.f._hpOn = true; S.ent('hp_g').alpha = 1; S.chase('hp_g', { spd: HP_SPD, catch: hpCatch }); }
    }
    if ((S.f._grace || 0) > 0) S.f._grace -= dt;
    /* 人流经过时的纸沙沙声：越近越响 */
    S.f._rs = (S.f._rs ?? .5) - dt;
    if (S.f._rs <= 0) { S.f._rs = .75; let dm = 99; for (const c of CROWD) { const e = S.ent(c.id); if (e && !e.hidden) dm = Math.min(dm, Math.abs(e.px - p.px) / TS + Math.abs(e.py - p.py) / TS); } if (dm <= 5) PAPER(S, .25 + .6 * (1 - dm / 5)); }
    for (const c of CROWD) {
      const e = S.ent(c.id); if (!e) continue;
      if (e.s.away > 0) {   // 撞过你的那个先走远几秒，再从东头回来
        e.s.away -= dt;
        if (e.s.away <= 0) { if (Math.abs(p.x - c.hi) + Math.abs(p.y - c.y) > 4) { e.px = c.hi * TS; e.py = c.y * TS; e.x = c.hi; e.y = c.y; e.mv = null; e.hidden = false; } else e.s.away = .5; }
        continue;
      }
      if (e.hidden) continue;
      if (!e.mv) {
        const x = Math.round(e.px / TS);
        if (x <= c.lo) { if (Math.abs(p.x - c.hi) + Math.abs(p.y - c.y) > 3) { e.px = c.hi * TS; e.py = c.y * TS; e.x = c.hi; e.y = c.y; } }
        else startMove(e, 1, c.spd);
      }
      if (!S.f._hitCD && !(S.f._grace > 0) && Math.abs(e.px - p.px) + Math.abs(e.py - p.py) < 12) { S.f._hitCD = true; S.run(crowdHit(c)); return; }
    }
  }
  function crowdHit(c) {
    return async S => {
      const e = S.ent(c.id);
      S.f._hits = (S.f._hits || 0) + 1;
      if (S.f._hits >= 2) {
        bumpEsc(S, S.timerLeft);
        S.sfx('sting');
        await S.narr('又一只冰凉的手攥住了你——这回是两只，三只……');
        return S.die('收摊的人流从你身上漫过去，像一阵冷水。\n你被裹在包袱和袍子中间，脚不沾地，跟着他们，往鬼市的深处走去。\n手里的长命锁，一点一点，凉了。', '卷进了人流');
      }
      S.sfx('sting'); S.shake(300, 2);
      e.mv = null; e.hidden = true; e.s.away = 4;
      await S.narr('一只冰凉的手攥住了你的手腕——\n收摊的人扛着包袱，从你身上挤过去，像一阵冷水漫过。你使劲一挣，挣开了。');
      S.timerAdd(-4);
      await S.think('别碰着他们……再被卷住，就出不去了。');
      S.f._hitCD = false; S.f._grace = 2;
    };
  }
  async function hpCatch(S) {
    bumpEsc(S, S.timerLeft);
    S.f._hpOn = false;
    await S.scare('face', { spr: '@huipao', dur: 1 });
    await S.die('一只纸糊的手，轻轻拍了拍你的头顶。\n……你忽然觉得，跟着他走，也挺好的。\n\n手心里那把锁，被他慢慢地，一根一根地，掰开了手指拿走。', '被拍了头');
  }
  async function voiceTrap(S) {
    PAPER(S, .7);
    await S.narr('身后，很近很近的地方，有个小孩在喊：\n「姐——！姐，等等我——！」');
    const r = await S.ask('那声音带着哭腔，就在你脚后跟上。……栓子？', ['（回头喊）「栓子！」', '（咬紧牙，往前走）']);
    if (r === 0) { S.f.ansVoice = true; await speak(S, '栓子！'); await S.narr('身后什么也没有。\n只有一阵沙沙的、纸摩擦的笑声。'); return; }
    await S.narr('那声音又喊了两声，忽然笑起来——沙沙的，像风吹着一张纸。\n不是栓子。栓子在家里，等着你。');
  }
  async function dawnBad(S) {
    bumpEsc(S, 0);
    S.stop('hp_g'); S.norun(false);
    CROW(S, 1);
    await S.narr('鸡叫了。');
    await S.narr('满街的灯笼一齐灭了。你低头看自己的手——手指头，正一点一点变淡，像一张被水泡开的纸。');
    await S.end({ bad: true, id: 'dawn', title: '鸡叫了', text: '第二天一早，拾粪的老汉在镇西的河滩上，捡到一盏白纸灯笼。\n\n灯笼没有灭，火苗是白的，冷冷的。\n灯笼底下，压着一把银长命锁，锁上刻着「秦栓子」。\n\n老汉把锁送到了秦家。\n秦家奶奶摸着那把锁，坐了一整天，一句话也没说。\n\n——鬼市鸡鸣而散。散的时候，还在里头的，就跟着一起散了。' });
  }
  async function finale(S) {
    S.clearTimer(); S.stop('hp_g'); S.hide('hp_g'); CROWD.forEach(c => S.hide(c.id));
    S.lights(null); S.norun(false); S.plr(null); S.f.ph = 'out'; S.goal('');
    await S.go('hetan', 26, 3, 1);
  }
  async function finaleOut(S) {
    await S.narr('你一脚跨出牌楼——');
    await S.wait(600);
    CROW(S, .55);
    await S.narr('远远地，不知谁家的鸡，叫了头一遍。');
    await S.alpha('pailou', 0, 1500); S.hide('post1'); S.hide('post2');
    await S.narr('身后的灯笼一盏接一盏灭了。你回过头——\n河滩上只有一片芦苇、几块乱石，和一地被露水打湿的纸灰。');
    await S.narr('纸灰里歪着一个纸人：灰纸糊的袍子，两团红胭脂，画上去的笑叫露水洇花了。\n它的脚底下，是一圈空着的印子——纸扎摊上少的，就是它。');
    if (!S.f.ansMom) await S.narr('……牌楼淡下去之前，你好像看见柱子底下，站着一个提灯的女人。\n她朝你摆了摆手，叫你快走。');
    await S.fade(1, 900);
    await S.card('天亮', '', '你一路跑回家。\n这回，你跑了。');
    return homeEnding(S);
  }
  async function homeEnding(S) {
    await S.go('home', 4, 4, 3, { fade: false });
    S.dark(.42, 'home'); S.wear('@me');
    if (S.f.zanGone) S.ent('kang').s.gone = true;
    await S.fade(0, 900);
    await S.narr('天边泛出一点鱼肚白的时候，你推开了家门。\n你把长命锁挂回栓子脖子上，红绳打了个死结。');
    S.take('suo');
    S.bubble('shuan', '…', 1200); await S.wait(900);
    await S.say('栓子', '……姐？你手怎么这么凉？');
    await S.narr('窗纸透进来的光里，炕沿底下，慢慢地，多出一个小小的影子。');
    CROW(S, .9);
    if (S.f.zanGone) {
      await S.narr('院子里，芦花鸡叫了头遍。\n你回过头——奶奶躺在炕上，脸朝着栓子。她的发髻散在枕头上。');
      return S.end({ id: 'zan', title: '一根银簪', text: '奶奶的脸朝着栓子，像是在笑。\n那根戴了一辈子的银簪，不在她头上了。\n她的手，已经凉了。\n\n后来你才想明白：那天夜里，她把簪子塞给你，说的是「实在换不来」。\n她早就想好了，拿什么换。\n\n——鬼市里不问价。\n可每样东西，都有它的价。' });
    }
    const shoe = S.f.kindXie ? '\n\n开春的时候，你在门槛上捡到一双新布鞋，鞋底纳得密密麻麻，大小正合栓子的脚。' : '';
    const extra = shoe + (!S.f.ansMom ? '\n\n你一直没跟奶奶说牌楼底下那个提灯的女人。\n奶奶也没问。她只是那天早上，往娘的牌位前，多上了一炷香。' : '');
    return S.end({ id: 'home', title: '鸡叫之前', text: '院子里，芦花鸡叫了头遍。\n\n奶奶在被子里长长地出了一口气，抬手摸了摸发髻上的银簪。\n「回来了就好。」\n\n后来栓子长大了，从不跟人提那天夜里的事。\n只是每到腊月初一，他都早早睡下——\n睡前，把一只纸风车插在门框上。' + extra });
  }
})();
