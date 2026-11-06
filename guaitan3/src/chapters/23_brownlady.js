/* ================= 第二十三夜 · 布朗夫人 ================= */
(() => {
  /* 主题：长曝光。快门开得越久，越淡的东西越能「吃」进底片——可快门开着的时候，谁也不能动：
     动的东西留不下来，只留下一道糊影。她只在你一动不动的时候，才站在那儿。
     谜题：油灯挂在哪个灯钩、快门开几秒（曝光笔记 + 「淡的东西要十五秒往上」两个条件一起推）。
     危险：抱着她的画像回她的房间。油灯照着她的脸，她会站住、把脸扭开——可灯油有限，往前走又得把背对着她。
     双人：一人在「笺」里念曝光笔记、一人挂灯开快门；追逐时一人盯着她喊「转身照她」，一人赶路。 */
  let DIED = 0;   // 本局被她追上几次（只影响重来时的提示和惊吓方式）
  const SPD = 3.0, OIL = 5;   // 她的速度（格/秒）；灯油：能照住她的总秒数
  const DUSK = ['arrive', 'tut', 'tut2', 'tut3'];
  const KEYS = ['1', '2', '4', '8', '15', '30'], AL = { '5': '15', '3': '30' };
  /* 每种光照下，人站在平台上「刚好」的曝光秒数（与曝光笔记一致） */
  const NEED = { win: 4, p: 1, '5': 4, '10': 15, f: 30, hand: 30, moon: 30, rlamp: 1, rmoon: 30 };
  const HOOKN = { p: '平台', '5': '第五级', '10': '第十级', f: '楼梯脚的柱头' };
  const LN = { p: '挂在平台的灯钩上', '5': '挂在第五级的灯钩上', '10': '挂在第十级的灯钩上', f: '挂在楼梯脚的柱头上', hand: '拿在你手里，就在相机边上', moon: '吹灭了——只有高窗的月光照着平台' };
  const LAMPL = { r: 3.2, col: 'rgba(255,186,100,.22)', flick: true, dy: 4 };
  const MOONL = { r: 2.8, col: 'rgba(150,172,230,.16)', dx: 24, dy: 40 };
  const DUSKL = { r: 4.2, col: 'rgba(255,170,90,.18)', dx: 24, dy: 34 };
  const MOON2 = { r: 2.6, col: 'rgba(150,172,230,.15)', dy: 30 };
  const FIREL = { r: 3.6, col: 'rgba(255,120,50,.16)', flick: true, dx: 16, dy: 6 };
  const REDL = { r: 3.4, col: 'rgba(255,30,20,.30)', dy: 6 };

  /* ---------------- 合成音 ---------------- */
  const SND = {
    shutter(S) { S.tone('square', 2600, 1300, .03, .07, 0, 4200); S.tone('triangle', 900, 520, .06, .14, .025, 0); },
    creak(S, d = 0) { S.tone('sawtooth', 190, 120, .4, .045, d, 520); S.tone('sine', 74, 52, .22, .26, d, 0); },
    step(S, d = 0, v = .22) { S.tone('sine', 120, 68, .11, v, d, 0); S.tone('triangle', 240, 150, .05, v * .3, d, 900); },
    rustle(S, v = .012) { for (let i = 0; i < 6; i++) S.tone('sawtooth', 2400 + Math.random() * 1200, 1700, .05, v, i * .055, 3000); },   // 锦缎裙摆擦过地板
    chime(S) { [659, 587, 523, 392].forEach((f, i) => { S.tone('sine', f, f, 1.6, .12, i * .55, 0); S.tone('sine', f * 2, f * 2, 1.0, .03, i * .55, 0); }); },   // 落地钟的一刻钟报时
    boom(S) { S.tone('sawtooth', 170, 38, .55, .42, 0, 900); S.tone('square', 1400, 200, .18, .1, 0, 2600); S.tone('sine', 60, 30, .8, .4, .02, 0); },   // 镁粉「砰」
    hum(S) {   // 她哼的一支很老的曲子（小调，很轻）
      const N = [[440, .5], [523, .5], [494, .5], [440, 1], [392, .5], [440, .5], [330, 1.2], [349, .5], [392, .5], [440, 1.6]];
      let t = 0; for (const [f, d] of N) { S.tone('sine', f, f * .995, d * 1.05, .07, t, 0); S.tone('triangle', f / 2, f / 2, d, .025, t, 700); t += d; }
    },
    door(S) { S.tone('sawtooth', 320, 180, .9, .035, 0, 700); S.tone('sawtooth', 210, 260, .6, .03, .5, 600); }
  };

  /* ---------------- 底片（用 faces 画：32×32，a=显影进度） ---------------- */
  const SP = ['#1a120a', '#2c2014', '#43321e', '#5c4830', '#786046', '#977e60', '#b49c7e', '#d0bc9c', '#e8dcc2', '#f6f0e2'];
  const PAPER = '#ebe3cf';
  function mixc(a, b, k) {
    k = clamp(k, 0, 1); const p = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16)); const A = p(a), B = p(b);
    return '#' + A.map((v, i) => Math.round(v + (B[i] - v) * k).toString(16).padStart(2, '0')).join('');
  }
  /* 先是一张白相纸，影像在 a=0.05~0.55 之间慢慢浮出来；over/under 整体偏白/偏黑 */
  function devR(R0, a, o) {
    const k = clamp((a - .05) / .5, 0, 1);
    return (x, y, w, h, c) => { let z = c; if (o.over) z = mixc(z, SP[9], o.over); if (o.under) z = mixc(z, SP[0], o.under); R0(x, y, w, h, mixc(PAPER, z, k)); };
  }
  function stairsPlate(o) {
    return (R0, a) => {
      const R = devR(R0, a, o);
      R(0, 0, 32, 32, SP[1]); R(0, 0, 32, 12, SP[2]);
      for (let x = 1; x < 32; x += 4) R(x, 0, 1, 11, SP[1]);                        // 护墙板
      const wc = o.moon ? SP[6] : SP[7], wd = o.moon ? SP[4] : SP[5];
      R(19, 0, 10, 11, SP[0]); R(20, 1, 8, 9, wc); R(23, 1, 2, 9, SP[3]); R(20, 5, 8, 1, SP[3]); R(20, 1, 1, 9, wd);   // 高窗
      R(3, 11, 26, 4, SP[3]); R(3, 11, 26, 1, SP[5]); R(14, 12, 13, 2, o.moon ? SP[5] : SP[4]);                    // 平台，窗光落在上面
      for (let y = 15; y < 32; y++) {
        const l = Math.round(10 - (y - 15) * .45), r = Math.round(22 + (y - 15) * .45), tr = (y - 15) % 3;
        R(l, y, r - l, 1, tr === 0 ? SP[5] : tr === 1 ? SP[4] : SP[2]); R(l + 3, y, r - l - 6, 1, tr === 0 ? SP[4] : SP[2]);   // 台阶和中间的地毯
      }
      for (let y = 11; y < 32; y++) {
        const xl = Math.round(9 - (y - 11) * .42), xr = Math.round(22 + (y - 11) * .42);
        R(xl, y, 1, 1, SP[0]); R(xr, y, 1, 1, SP[0]); if (y % 3 === 0) { R(xl - 1, y, 1, 3, SP[1]); R(xr + 1, y, 1, 3, SP[1]); }   // 两边的扶手
      }
      if (o.lamp) { R(22, 22, 2, 2, SP[8]); R(21, 21, 4, 4, SP[6]); R(22, 22, 2, 2, SP[9]); }                     // 第十级的油灯
      if (o.smear) { R(14, 8, 3, 4, SP[3]); R(15, 7, 1, 6, SP[4]); }                                               // 平台上那一小团白
      if (o.lady) {
        const k2 = clamp((a - .3) / .35, 0, 1), F = (x, y, w, h, c) => R(x, y, w, h, mixc(SP[2], c, k2));
        F(13, 5, 6, 1, SP[5]); F(12, 6, 8, 4, SP[6]); F(13, 7, 6, 3, SP[9]);                                       // 罩纱、脸
        F(11, 10, 10, 3, SP[6]); F(12, 10, 8, 3, SP[7]);                                                           // 肩
        F(10, 13, 12, 4, SP[5]); F(11, 13, 10, 4, SP[6]); F(13, 13, 6, 4, SP[7]);                                  // 裙
        F(9, 17, 14, 4, SP[4]); F(10, 17, 12, 4, SP[5]); F(12, 17, 8, 4, SP[6]);                                   // 裙摆，淡进台阶里
        F(15, 10, 2, 9, SP[8]);
        if (o.eyes && a > .7) { F(14, 8, 1, 1, SP[0]); F(17, 8, 1, 1, SP[0]); }
      }
      if (o.blur) { for (let i = 0; i < 6; i++) R(2 + i * 2, 20 + i, 18 - i * 2, 2, i % 2 ? SP[5] : SP[6]); R(6, 18, 3, 2, SP[6]); }   // 横着拖过去的一道人影
      R(0, 0, 32, 1, SP[0]); R(0, 31, 32, 1, SP[0]); R(0, 0, 1, 32, SP[0]); R(31, 0, 1, 32, SP[0]);
    };
  }
  function roomPlate(o) {
    return (R0, a) => {
      const R = devR(R0, a, o);
      R(0, 0, 32, 32, SP[2]); for (let y = 2; y < 20; y += 4) for (let x = (y % 8 ? 1 : 3); x < 32; x += 4) R(x, y, 1, 1, SP[3]);   // 锦纹壁纸
      R(0, 20, 32, 12, SP[3]); for (let y = 22; y < 32; y += 3) R(0, y, 32, 1, SP[2]);                                        // 地板
      R(5, 3, 7, 11, SP[0]); R(6, 4, 5, 9, SP[6]); R(7, 4, 1, 9, SP[1]); R(9, 4, 1, 9, SP[1]); R(6, 8, 5, 1, SP[1]);       // 带铁栏的窗
      if (o.room) { R(1, 5, 4, 5, SP[5]); R(2, 6, 2, 3, SP[8]); R(2, 6, 1, 1, SP[3]); R(3, 8, 1, 1, SP[3]); }                // 窗边：刺绣
      else { R(1, 5, 4, 5, SP[3]); }
      const pf = o.room || o.fin;
      if (pf) { R(14, 2, 4, 1, SP[7]); R(13, 3, 6, 7, SP[7]); R(14, 10, 4, 1, SP[7]); R(14, 3, 4, 7, SP[1]); R(15, 4, 2, 2, SP[8]); R(14, 6, 4, 4, SP[3]); R(15, 6, 2, 1, SP[7]); }   // 床头：椭圆的画像
      else R(13, 3, 6, 8, SP[3]);
      R(11, 11, 10, 3, SP[1]); R(12, 14, 8, 2, SP[7]); R(11, 16, 10, 7, SP[4]); R(11, 16, 10, 1, SP[5]); R(11, 23, 10, 1, SP[1]);   // 床
      if (o.room) { R(24, 3, 5, 8, SP[4]); R(25, 4, 3, 6, SP[7]); R(26, 4, 1, 3, SP[9]); } else R(24, 3, 5, 8, SP[3]);          // 壁炉边：镜子
      R(22, 12, 9, 9, SP[4]); R(22, 12, 9, 1, SP[5]); R(24, 14, 5, 7, SP[0]);                                                    // 壁炉
      const k2 = clamp((a - .32) / .35, 0, 1), F = (x, y, w, h, c) => R(x, y, w, h, mixc(SP[3], c, k2));
      if (o.room) {   // 窗户底下，跪着一团白，一只手按着地板；手边一点亮
        F(6, 17, 3, 2, SP[8]); F(5, 19, 5, 3, SP[6]); F(4, 22, 7, 2, SP[5]); F(9, 22, 2, 1, SP[8]);
        if (a > .6) R(10, 24, 1, 1, SP[9]);
      }
      if (o.fin) {    // 画像旁边站着她，一只手搭在画框上；这一次脸上有眼睛
        F(20, 4, 4, 1, SP[6]); F(19, 5, 6, 4, SP[7]); F(20, 6, 4, 3, SP[9]); F(18, 9, 8, 4, SP[6]); F(17, 13, 10, 7, SP[5]); F(19, 13, 6, 7, SP[6]); F(18, 7, 1, 3, SP[7]);
        if (a > .55) { F(21, 7, 1, 1, SP[2]); F(23, 7, 1, 1, SP[2]); }
        if (o.ring && a > .6) { R(18, 8, 1, 1, SP[9]); R(17, 7, 1, 1, SP[8]); }
      }
      if (o.blur) for (let i = 0; i < 5; i++) R(14 + i, 18 + i * 2, 14, 2, i % 2 ? SP[5] : SP[6]);
      R(0, 0, 32, 1, SP[0]); R(0, 31, 32, 1, SP[0]); R(0, 0, 1, 32, SP[0]); R(31, 0, 1, 32, SP[0]);
    };
  }
  const FACES = {
    pl_dusk: stairsPlate({ smear: true }),
    pl_empty: stairsPlate({ moon: true }),
    pl_lamp: stairsPlate({ moon: true, lamp: true }),
    pl_under: stairsPlate({ moon: true, under: .78 }),
    pl_over: stairsPlate({ moon: true, over: .8 }),
    pl_blur: stairsPlate({ moon: true, blur: true }),
    pl_lady: stairsPlate({ moon: true, lady: true }),
    pl_flash(R0, a) {   // 全白。正中间两个挨得很近的小黑点
      const R = devR(R0, a, {}); R(0, 0, 32, 32, SP[9]); R(11, 4, 10, 18, '#f0e8d6'); R(13, 6, 6, 4, '#ece2cc');
      if (a > .4) { R(14, 8, 1, 1, SP[0]); R(17, 8, 1, 1, SP[0]); }
    },
    rm_plate: roomPlate({ room: true }),
    rm_empty: roomPlate({}),
    rm_under: roomPlate({ under: .78 }),
    rm_over: roomPlate({ over: .8 }),
    rm_blur: roomPlate({ blur: true }),
    rm_fin: roomPlate({ fin: true }),
    rm_finring: roomPlate({ fin: true, ring: true }),
    dorothy(R, a) {   // 棕色锦缎的兜帽，发亮的脸，眼睛的地方是两个越来越大的黑洞，嘴角慢慢往上翘
      const H = '#4a3220', H2 = '#6a4a2e', GD = '#b08a4a', SK = '#e6e2d4', SK2 = '#c2beb0', SK3 = '#8e8a7e', K = '#040302', L = '#2a1a12';
      R(10, 0, 12, 2, H); R(7, 2, 18, 3, H); R(5, 5, 22, 21, H); R(4, 26, 24, 6, H2);
      for (let y = 4; y < 32; y += 3) for (let x = (y % 2 ? 6 : 8); x < 27; x += 5) if (x < 9 || x > 22 || y > 24) R(x, y, 1, 1, GD);   // 锦缎上的金线
      R(11, 6, 10, 2, SK); R(9, 8, 14, 12, SK); R(10, 20, 12, 2, SK); R(12, 22, 8, 2, SK); R(20, 9, 3, 11, SK2); R(18, 21, 3, 2, SK2);
      R(8, 9, 1, 10, 'rgba(255,250,230,.35)'); R(23, 9, 1, 10, 'rgba(255,250,230,.25)');   // 脸边的一圈微光
      const s = 3 + Math.round(a * 2);
      for (const cx of [13, 19]) { const x0 = cx - Math.floor(s / 2); R(x0 - 1, 11, s + 2, s + 1, SK3); R(x0, 12 - (s > 3 ? 1 : 0), s, s, K); }
      R(15, 15, 2, 3, SK2); R(14, 18, 1, 1, SK3); R(17, 18, 1, 1, SK3);
      R(13, 20, 6, 1, L); if (a > .45) { R(12, 19, 1, 1, L); R(19, 19, 1, 1, L); } if (a > .75) { R(11, 18, 1, 1, L); R(20, 18, 1, 1, L); }
      R(9, 25, 14, 2, '#d8d0c0'); R(10, 27, 12, 1, '#b8b0a0');
    },
    portrait(R) {   // 椭圆金框里的年轻女人：中分的深色卷发、好好的一双眼睛、棕色锦缎裙、蕾丝领、一串珍珠
      const G = '#b08a3a', G2 = '#d8b45a', BG = '#2c3222', HR = '#2e1e14', SK = '#ecd2b8', SK2 = '#d4b498', DR = '#6a4426', DR2 = '#8a5a32';
      for (let y = 0; y < 32; y++) { const t = (y - 15.5) / 16, hw = Math.round(12 * Math.sqrt(Math.max(0, 1 - t * t))); if (hw > 0) { R(16 - hw, y, hw * 2, 1, G); if (hw > 2) R(18 - hw, y, hw * 2 - 4, 1, BG); } }
      R(5, 8, 1, 3, G2); R(26, 20, 1, 3, G2);
      R(11, 5, 10, 3, HR); R(10, 8, 12, 9, HR); R(9, 11, 2, 7, HR); R(21, 11, 2, 7, HR); R(15, 5, 2, 1, BG);
      R(12, 8, 8, 9, SK); R(13, 17, 6, 2, SK); R(18, 9, 2, 8, SK2);
      R(13, 11, 2, 1, '#f4f0e8'); R(17, 11, 2, 1, '#f4f0e8'); R(14, 11, 1, 1, '#3a2a1e'); R(18, 11, 1, 1, '#3a2a1e'); R(13, 10, 2, 1, HR); R(17, 10, 2, 1, HR);
      R(16, 12, 1, 3, SK2); R(15, 15, 3, 1, '#b8645a'); R(13, 14, 1, 1, '#e8b8a8'); R(19, 14, 1, 1, '#e8b8a8');
      R(10, 20, 12, 3, '#ece4d4'); R(13, 23, 6, 1, '#ece4d4'); for (let x = 11; x < 21; x += 2) R(x, 19, 1, 1, '#f4f0e8');
      R(8, 22, 16, 9, DR); for (let y = 24; y < 31; y += 3) for (let x = 9 + (y % 2); x < 24; x += 3) R(x, y, 1, 1, DR2);
    }
  };

  defChapter({
    id: 'brownlady', n: 23, title: '布朗夫人', sub: '诺福克的老庄园。快门开着的时候谁也别动——楼梯上会多出一个穿棕色锦缎裙子的女人。', origin: '英国诺福克 · 1936年', color: '#5a3e22',
    icon: '@lady', iconX: 34, amb: 'room', floor: 'wood', wall: 'wood', dark: .5, plr: 3.2,
    thumb(g, w, h) {   // 一张发黄的底片：楼梯、高窗、楼梯中间一个罩着纱的白影
      const P = (x, y, ww, hh, c) => { g.fillStyle = c; g.fillRect(x, y, ww, hh); };
      P(8, 6, 60, 60, '#e8dcc0'); P(11, 9, 54, 52, '#2c2014'); P(11, 9, 54, 20, '#43321e');
      P(44, 11, 14, 16, '#14100a'); P(46, 13, 10, 12, '#b49c7e'); P(50, 13, 2, 12, '#5c4830');
      P(14, 29, 48, 6, '#5c4830'); for (let y = 35; y < 61; y += 3) { const s = (y - 35) * .5; P(26 - s, y, 24 + s * 2, 2, '#786046'); }
      g.globalAlpha = .85; P(33, 14, 10, 4, '#b49c7e'); P(31, 18, 14, 10, '#b49c7e'); P(29, 28, 18, 10, '#977e60'); P(35, 15, 6, 5, '#f6f0e2'); P(37, 20, 2, 16, '#e8dcc2'); g.globalAlpha = 1;
      P(36, 17, 1, 1, '#1a120a'); P(39, 17, 1, 1, '#1a120a');
    },
    people: {
      me: { key: 'bl-me', skin: '#f0caa6', hair: '#5a3a22', hs: 'short', top: '#6a5a40', top2: '#e8e2d0', bottom: '#3a3428', shoes: '#2a1a10', hat: 'cap', hatC: '#5a4a36',
        extra(g, d, fr, G, R) { if (d === 0) { R(5, G.tT, 1, 6, '#2a1a10'); R(9, G.tT + 5, 3, 2, '#1a1a1a'); } else if (d === 1) R(5, G.tT + 4, 3, 3, '#1a1a1a'); } },   // 挎着折叠相机
      hale: { key: 'bl-hale', skin: '#e8c4a4', hair: '#c8c2b8', hs: 'short', top: '#34343c', top2: '#e8e4da', bottom: '#2a2a30', coat: true, shoes: '#1a1a1a', hat: 'cap', hatC: '#3a3a3a',
        extra(g, d, fr, G, R) { if (d === 0) { R(5, G.hT + 6, 6, 1, '#c8c2b8'); R(5, G.hT + 4, 2, 1, '#2a2a2a'); R(9, G.hT + 4, 2, 1, '#2a2a2a'); R(7, G.hT + 4, 2, 1, '#2a2a2a'); } else if (d === 1) R(4, G.hT + 6, 3, 1, '#c8c2b8'); } },   // 白胡子、圆眼镜
      pell: { key: 'bl-pell', skin: '#ecd0b8', hair: '#a09a90', hs: 'bun', top: '#26222a', top2: '#e8e4dc', bottom: '#26222a', dress: true, apron: '#ece8de', shoes: '#1a1a1a',
        extra(g, d, fr, G, R) { if (d === 0) { R(7, G.tT + 1, 2, 1, '#c9a35a'); R(6, G.tT + 3, 1, 4, '#8a8a8a'); } } },   // 胸针、腰间一串钥匙
      lady: { key: 'bl-lady', skin: '#e6e2d4', hair: '#3a2a1c', hs: 'long', top: '#6a4a2c', top2: '#d8ccb4', ghost: true, hat: 'hood', hatC: '#5a3e24', eye: '#040302',
        extra(g, d, fr, G, R) {
          if (d === 0) { R(5, G.hT + 3, 2, 3, '#040302'); R(9, G.hT + 3, 2, 3, '#040302'); R(6, G.tT, 4, 1, '#d8ccb4'); }   // 空洞的眼窝、蕾丝领
          for (let y = G.tT + 2; y < 21; y += 3) R(d === 1 ? 6 : 5 + (y % 2) * 2, y, 1, 1, '#b08a4a');   // 锦缎上的金线
        } }
    },
    faces: FACES,
    items: {
      lamp: { name: '油灯', desc: '黄铜底座的手提油灯，玻璃罩上熏了一圈黑。灯芯拧到最大，也只照得亮身边几步。' },
      flash: { name: '镁光闪光枪', desc: '一根带扳机的金属槽。倒进镁粉一扣，「砰」地一团白光。黑尔先生说：老房子里别乱点。' },
      fold: { name: '折叠相机', desc: '黑尔先生的备用相机，皮腔能折进一个巴掌大的盒子里。拍细节用。' },
      portrait: { name: '她的画像', desc: '椭圆形的金框，画里的年轻女人穿着棕色的锦缎裙子。框背后用墨水写着一个字母：D。' },
      ring: { name: '戒指', desc: '一枚很小的金戒指，镶着一颗钻石。钻石的尖上磨出了一道细细的白痕——像是在玻璃上划过很多字。' }
    },
    notes: {
      table: { title: '黑尔先生的曝光笔记', text: '雷纳姆 · 大楼梯（下午试拍时记的）\n相机架在楼梯脚南边，镜头对着平台。\n\n油灯一盏，人站在平台上时，曝光几秒刚好：\n· 灯挂在平台的灯钩上 ………… 1 秒\n· 灯挂在第五级 ……………………… 4 秒\n· 灯挂在第十级 ……………………… 15 秒\n· 灯在楼梯脚（或拿在相机边）… 30 秒\n· 不点灯，只有月光照着平台 …… 30 秒\n给少了：一片黑。给多了：一片白。\n\n另：这批底片吃光慢。淡的东西——烟、纱帘、\n台阶上扬起来的灰——快门不开到十五秒往上，\n底片上是不会有的。\n\n（页边小字：快门开着的时候，谁也别动。\n动的东西留不下来，只留下一道糊影。）' },
      guest: { title: '访客留言簿里夹着的一页（1836年）', text: '……我们三个人提着灯，从走廊这头往那头走。\n她从对面过来。棕色的锦缎裙子，手里也提着一盏灯。\n\n走近了，她把灯举起来，朝我们笑了一下。\n那个笑容，我这辈子不愿再见第二回。\n\n我手里正好有一把手枪。我开了枪。\n子弹穿过她，钉进了她身后的门板。\n她不见了。\n\n（下面是另一个人的字：「前一年圣诞，有位上校说他在楼梯上看清过她的脸——发着光，可是眼睛的地方，是两个黑洞。」）\n（再下面，铅笔：弹孔至今还在楼上走廊那扇门上。）' },
      pane: { title: '窗玻璃上的字', text: '（一块窗玻璃上，有人用戒指上的钻石，一笔一笔划出来的字。很小，歪歪斜斜。）\n\n他们说我病了。\n门从外面锁上，钥匙在他口袋里。\n孩子们在楼下，我听得见，看不见。\n\n我只剩墙上这一个我——\n年轻的，穿着那条棕色的裙子。\n我每天看她，她也看我。\n\nD. 1726' },
      letter: { title: '地板底下的信', text: '（折得很小，墨水已经褪成了褐色。）\n\n给我的孩子们：\n\n要是你们读到这个，我大概已经不在这间屋子里了——\n或者，还在。\n\n他们会把我的画像摘下来，说看着不吉利。\n别让他们这么做。挂回床头去。\n那是我每天早上睁开眼，第一个看见的地方；\n那时候我还没有被锁起来，你们还会爬到我床上来。\n\n要是有一天，我在楼梯上走来走去，\n那只是因为，我在找回这间屋子的路。\n\n——你们的母亲' }
    },
    legend: '雷纳姆庄园（Raynham Hall）在英格兰东部的诺福克郡，三百多年来一直是汤森家族的宅邸。传说中的「布朗夫人」（The Brown Lady），据说就是十八世纪初的女主人多萝西·沃波尔——英国第一位首相的妹妹、第二代汤森子爵的第二任妻子。流传最广的说法是：子爵疑心她不忠，把她关在庄园楼上的房间里，连孩子都不让见，直到1726年她在那里去世。官方记载她死于天花；也有人说她是从楼梯上摔下去的，还有人说那场葬礼是假的、她其实又被关了很多年。这些说法大多查无实据。\n\n关于她的目击，最有名的有两次。据说1835年圣诞节，一位来做客的上校在楼梯上看见一个穿棕色锦缎裙子的女人，脸上发着光，眼睛的位置却是两个黑洞。第二年，一位以写海洋小说出名的海军军官来庄园做客，特意要求住进挂着她画像的那间「闹鬼的房间」；据说他夜里在走廊上撞见她提着一盏灯走过来，对着他笑了一下，他抬手就开了枪——子弹穿过她，打进了她身后的门板。也有说法称，二十世纪二十年代庄园主人的儿子和朋友在楼梯上见过她，一眼就认出她是画像里的人。\n\n让她闻名世界的是一张照片。1936年9月，《乡村生活》杂志的两位摄影师来庄园拍内景。据他们说，其中一人看见一个半透明的身影正从主楼梯上走下来，急忙叫同伴按快门；罩在黑布底下的同伴什么也没看见，可冲出来的底片上，楼梯中间真的有一个罩着长纱的模糊女人。照片当年12月刊出，后来成了最著名的「鬼照片」之一。怀疑者的解释五花八门：双重曝光、镜头上的油污、长时间曝光时相机被碰动、把别处一尊圣母像叠了上去……两位摄影师始终否认作假，可也拿不出更多的证明。据说在那之后，就很少再有人在楼梯上见到她了。\n\n（本章中的摄影师黑尔先生、管家佩尔太太、身为助手的你、曝光笔记里的数字和四个灯钩、锁了两百年的房间和墙上的三块印子、裹着床单藏在暗房里的画像、窗玻璃上的字、地板下的信和戒指、「油灯照着她的脸她就会站住」的规矩，以及「画像挂回原处之后她就不再出现」的说法，都是游戏虚构；真实照片的拍摄经过也与本章不同。真实的摄影师和目击者均未使用姓名。）',
    endings: { home: '挂回原处', ring: '她的戒指', flash: '镁光一闪' },
    start: { map: 'hall', x: 10, y: 12, dir: 3 },
    resume: {
      night: async S => { if (S.f.act !== 'night') return; S.f.expo = null; S.hide('lady'); setLights(S); },
      seen: async S => { setLights(S); },
      chase: async S => {
        if (S.f.act !== 'chase') return;
        S.norun(true); S.speed(.8); setLights(S);
        if (DIED) {
          S.sfx('heart');
          await S.think(DIED === 1 ? '……再来。\n她会从暗房门口进来。抱着画往东头的仆人楼梯走，别停下。\n到了楼上，她要是迎面过来，就举着灯朝她走——灯照着她的脸，她会站住。'
            : '别在门口发愣，也别把背对着她太久。\n底片上，画像挂在床头。');
        }
        startChase(S);
      },
      final: async S => { if (S.f.act !== 'final') return; S.norun(false); S.speed(1); S.f.chase = false; setLights(S); }
    },
    async intro(S) {
      DIED = 0;
      await S.card('第二十三夜　布朗夫人', '1936年9月　英国诺福克郡　雷纳姆庄园', '一家画报要给这座老庄园做一组内景专题。\n你是摄影师的助手：背三脚架、换片匣、在暗房里守着红灯。\n\n管家说，这房子里有一位夫人，\n两百年来，每天夜里都要从楼梯上走下来一次。');
    },
    tick(S, dt) {
      const f = S.f;
      if (f.expo && !S.busy) expoTick(S, dt);
      if (f.chase && !S.busy) chaseTick(S, dt);
      if (S.busy) return;
      if (!DUSK.includes(f.act) && !f.expo && (S.map === 'upper' || S.map === 'hall')) {   // 夜里老房子自己会响
        f._ck = (f._ck ?? 6) - dt; if (f._ck <= 0) { f._ck = 9 + Math.random() * 8; SND.creak(S); }
      }
    },
    sprites: {
      tripod(g, e, t, R) {   // 胡桃木三脚架上的大画幅相机，从背后看：毛玻璃、皮腔、一块黑罩布；s.open 拔掉了镜头盖
        R(3, 5, 1, 11, '#5a3a20'); R(12, 5, 1, 11, '#5a3a20'); R(7, 6, 2, 10, '#4a2e18'); R(2, 15, 3, 1, '#2a1a0e'); R(11, 15, 3, 1, '#2a1a0e');
        R(2, -5, 12, 10, '#2a1c12'); R(3, -4, 10, 8, '#5a3a22'); R(4, -3, 8, 6, e.open ? '#8a7a5a' : '#3a3a34'); R(5, -2, 2, 1, '#aaa48a');
        R(1, -8, 14, 4, '#141414'); R(0, -5, 3, 9, '#141414'); R(13, -5, 3, 7, '#141414');
        R(6, -10, 4, 3, '#b08a3a'); R(7, -9, 2, 1, e.open ? '#000' : '#6a6a6a');
      },
      hook(g, e, t, R) {   // 扶手上的黄铜灯钩；s.post = 楼梯脚的柱头；lit 挂着油灯
        if (e.post) { R(4, -2, 8, 16, '#3a2414'); R(5, -1, 6, 14, '#5a3a20'); R(4, -5, 8, 4, '#4a2e18'); R(6, -6, 4, 2, '#6a4a2a'); }
        R(6, 2, 4, 2, '#b08a3a'); R(9, 3, 1, 3, '#8a6a2a');
        if (e.lit) {
          const fl = Math.sin(t * 11 + e.px) > 0 ? 1 : 0;
          R(7, 6, 5, 1, '#6a5020'); R(7, 7, 5, 6, 'rgba(255,230,160,.35)'); R(8, 7, 3, 6, '#3a2a14'); R(9, 8 + fl, 1, 3 - fl, '#ffd070'); R(9, 10, 1, 1, '#fff2c0'); R(7, 13, 5, 1, '#8a6a2a');
        }
      },
      arch(g, e, t, R) { R(0, -4, 16, 18, '#3a2e24'); R(2, -2, 12, 16, '#0a0806'); R(3, -3, 10, 1, '#0a0806'); R(1, 12, 14, 2, '#5a4a3a'); },
      tallwin(g, e, t, R) {   // 平台上方的高窗（3 格宽），s.moon 夜里
        const fr = '#2e2218', gl = e.moon ? '#2e3a56' : '#b8864a', gl2 = e.moon ? '#4a5a7a' : '#e0b070';
        R(2, -14, 44, 28, fr); R(4, -12, 40, 24, gl); R(10, -16, 28, 3, fr); R(12, -14, 24, 2, gl);
        for (let i = 0; i < 6; i++) R(6 + i * 7, -10 + (i % 2) * 3, 3, 4, gl2);
        R(17, -12, 2, 24, fr); R(30, -12, 2, 24, fr); R(4, -1, 40, 1, fr); R(2, 12, 44, 2, '#5a4a38');
        if (e.moon) { R(34, -9, 5, 5, '#c8d0e0'); R(35, -8, 3, 3, '#e8ecf4'); }
      },
      patch(g, e, t, R) { R(3, 0, 10, 12, 'rgba(255,236,200,.10)'); R(3, 0, 10, 1, 'rgba(255,236,200,.14)'); R(7, 1, 2, 1, '#2a2a2a'); },   // 墙纸上一块浅色的方印子
      mark(g, e, t, R) {   // 房间里的方印子；s.hang 挂着她的画像；eyes:'void' 坏结局里画像的眼睛
        if (!e.hang) { R(3, 0, 10, 12, 'rgba(255,236,200,.11)'); R(3, 0, 10, 1, 'rgba(255,236,200,.16)'); R(7, 1, 2, 1, '#2a2a2a'); return; }
        R(5, -2, 6, 1, '#b08a3a'); R(4, -1, 8, 13, '#b08a3a'); R(5, 12, 6, 1, '#b08a3a'); R(5, 0, 6, 11, '#2c3222');
        R(6, 1, 4, 3, '#2e1e14'); R(6, 2, 4, 4, '#ecd2b8'); R(5, 3, 1, 3, '#2e1e14'); R(10, 3, 1, 3, '#2e1e14');
        if (e.eyes === 'void') { R(6, 3, 2, 2, '#000'); R(8, 3, 2, 2, '#000'); } else { R(7, 4, 1, 1, '#3a2a1e'); R(9, 4, 1, 1, '#3a2a1e'); }
        R(5, 7, 6, 4, '#6a4426'); R(6, 7, 4, 1, '#ece4d4');
      },
      wrapped(g, e, t, R) {   // 裹着旧床单、脸朝墙立着的画框；s.slip 床单滑下来一半；s.taken 拿走了
        if (e.taken) { R(1, 12, 14, 2, 'rgba(0,0,0,.25)'); return; }
        if (e.slip) {
          R(2, -10, 12, 22, '#b08a3a'); R(3, -9, 10, 20, '#2c3222'); R(5, -7, 6, 3, '#2e1e14'); R(5, -5, 6, 5, '#ecd2b8'); R(6, -3, 1, 1, '#3a2a1e'); R(9, -3, 1, 1, '#3a2a1e'); R(4, 0, 8, 8, '#6a4426');
          R(1, 4, 14, 10, '#d8d2c2'); R(2, 6, 3, 8, '#bcb4a2'); R(9, 5, 2, 9, '#bcb4a2'); return;
        }
        R(1, -10, 14, 24, '#d8d2c2'); R(2, -9, 2, 22, '#bcb4a2'); R(9, -10, 2, 24, '#c8c0ae'); R(12, -4, 2, 18, '#bcb4a2'); R(5, -6, 5, 4, '#ece4cc'); R(6, -5, 3, 1, '#7a6a5a');
      },
      devtray(g, e, t, R) {   // 显影台：三只药盘、几个棕色瓶子
        R(-1, 2, 34, 5, '#5a4430'); R(-1, 2, 34, 1, '#7a5e40'); R(0, 7, 2, 8, '#3a2a1a'); R(30, 7, 2, 8, '#3a2a1a');
        for (let i = 0; i < 3; i++) { R(1 + i * 10, 3, 9, 3, '#1a1a1a'); R(2 + i * 10, 4, 7, 1, ['#4a3a2a', '#3a3a30', '#3a2a2a'][i]); }
        R(3, -4, 3, 6, '#5a2a10'); R(8, -3, 2, 5, '#6a3a18'); R(26, -5, 4, 7, '#4a2010'); R(27, -6, 2, 1, '#888');
      },
      safelight(g, e, t, R) { R(5, 2, 6, 7, '#2a2a2a'); R(6, 3, 4, 5, e.off ? '#3a0a0a' : '#ff2a1a'); R(7, 0, 2, 2, '#444'); },
      lectern(g, e, t, R) { R(7, 5, 2, 10, '#4a2e1a'); R(4, 14, 8, 1, '#3a2414'); R(2, 0, 12, 6, '#5a3a22'); R(3, 1, 10, 4, '#e8e0c8'); R(8, 1, 1, 4, '#b8a888'); R(4, 2, 3, 1, '#8a7a6a'); R(9, 3, 3, 1, '#8a7a6a'); },
      chest(g, e, t, R) {   // 床尾的木箱；s.cam 上面搁着折叠相机
        R(1, 3, 14, 11, '#3a2414'); R(2, 4, 12, 9, '#5a3a22'); R(2, 6, 12, 1, '#3a2414'); R(7, 7, 2, 2, '#b08a3a');
        if (e.cam) { R(5, -1, 6, 4, '#1a1a1a'); R(7, 0, 2, 2, '#b08a3a'); R(8, 1, 1, 1, e.open ? '#000' : '#555'); }
      },
      board(g, e, t, R) { R(1, 6, 14, 4, 'rgba(20,12,6,.35)'); R(1, 6, 14, 1, '#1a1008'); R(1, 9, 14, 1, '#1a1008'); if (e.open) R(2, 7, 12, 2, '#050302'); },
      plateshelf(g, e, t, R) { R(0, -6, 16, 20, '#4a3424'); for (let s = 0; s < 3; s++) { R(1, -4 + s * 6, 14, 1, '#2a1a10'); for (let i = 0; i < 5; i++) R(2 + i * 3, -3 + s * 6, 2, 4, 'rgba(180,200,210,.55)'); } },
      dryline(g, e, t, R) { R(0, -14, 48, 1, '#8a8a80'); for (let i = 0; i < 4; i++) { R(4 + i * 11, -13, 7, 9, '#e8e0cc'); R(5 + i * 11, -12, 5, 6, ['#5c4830', '#43321e', '#786046', '#2c2014'][i]); R(6 + i * 11, -14, 1, 2, '#c9a35a'); } },
      bwindow(g, e, t, R) { R(2, 1, 12, 11, '#3a2a1e'); R(3, 2, 10, 9, '#3a4a66'); R(4, 3, 3, 2, '#5a6a8a'); for (let x = 4; x < 13; x += 3) R(x, 1, 1, 11, '#141414'); R(3, 6, 10, 1, '#141414'); R(2, 11, 12, 1, '#5a4a38'); },
      bulletdoor(g, e, t, R) { R(0, -2, 16, 16, '#2a1a10'); R(1, -1, 14, 15, '#5a3a24'); R(3, 1, 4, 5, '#4a2e1c'); R(9, 1, 4, 5, '#4a2e1c'); R(3, 8, 4, 5, '#4a2e1c'); R(9, 8, 4, 5, '#4a2e1c'); R(12, 7, 2, 1, '#c9a35a'); R(8, 4, 1, 1, '#000'); R(7, 4, 1, 1, '#2a1a10'); }
    },
    tiles: {
      flags: { solid: false, paint(R, X, Y) { const a = shade('#6e665a', (hash(X, Y, 3) - .5) * .12); R(0, 0, 16, 16, a); R(0, 0, 16, 1, '#4a443a'); R(Y % 2 ? 8 : 0, 0, 1, 16, '#4a443a'); if (hash(X, Y, 4) < .2) R(4, 9, 4, 1, shade(a, -.1)); } },
      stairN: { solid: false, paint(R) { R(0, 0, 16, 16, '#4a3020'); for (let i = 0; i < 4; i++) { R(0, i * 4, 16, 3, '#6a4628'); R(0, i * 4, 16, 1, '#8a6240'); R(0, i * 4 + 3, 16, 1, '#26180c'); R(3, i * 4, 10, 3, '#5a1e1a'); R(3, i * 4, 10, 1, '#7a2a24'); } } },
      stairE: { solid: false, paint(R) { R(0, 0, 16, 16, '#4a3020'); for (let i = 0; i < 4; i++) { R(i * 4, 0, 3, 16, '#6a4628'); R(i * 4 + 2, 0, 1, 16, '#8a6240'); R(i * 4 + 3, 0, 1, 16, '#26180c'); R(i * 4, 3, 3, 10, '#5a1e1a'); R(i * 4 + 2, 3, 1, 10, '#7a2a24'); } } },
      banV: { solid: true, paint(R, X, Y) { R(0, 0, 16, 16, '#1e140c'); R(5, 0, 6, 16, '#3a2414'); R(6, 0, 4, 16, '#5a3a20'); R(7, 0, 1, 16, '#7a5230'); R(4, 7, 8, 2, '#3a2414'); } },
      banH: { solid: true, paint(R, X, Y) { R(0, 0, 16, 16, '#1e140c'); R(0, 2, 16, 4, '#5a3a20'); R(0, 2, 16, 1, '#7a5230'); for (let x = 1; x < 16; x += 4) R(x, 6, 2, 9, '#3a2414'); R(0, 14, 16, 2, '#2a1a10'); } }
    },
    maps: {
      /* ---------------- 大厅与大楼梯 ---------------- */
      hall: {
        amb: 'room', dark: .42, plr: 3.2, wall: 'wood', wallC: { face: '#4e3a28', trim: '#2a1e14', top: '#16110c' }, floor: 'flags',
        legend: { S: 'stairN', E: 'stairE', W: 'darkwood', V: 'banV', H: 'banH' },
        rows: [
          '######################',
          '######################',
          '#####WWWEEEEEEW#######',
          '####VWWWHHHHHHH......#',
          '####VSSSV............#',
          '####VSSSV............#',
          '####VSSSV............#',
          '####VSSSV............#',
          '####VSSSV............#',
          '#....................#',
          '#....................#',
          '#....................#',
          '#....................#',
          '#....................#',
          '######################'],
        ents: [
          { id: 'h_win', x: 5, y: 1, w: 3, spr: 'tallwin', light: DUSKL, async on(S) {
            if (DUSK.includes(S.f.act)) return S.narr('平台上方的高窗。夕阳从铅条格子里斜斜地照进来，把楼梯一级一级地描成金色。');
            await S.narr('高窗外是雾。月亮挂在雾后面，像一枚泡在水里的硬币。\n月光只落在平台上——楼梯其余的地方，全是黑的。');
          } },
          { id: 'h_arch', x: 14, y: 1, spr: 'arch', async on(S) { await S.go('upper', 2, 3, 2); } },
          { id: 'h_pv', x: 9, y: 1, spr: 'portrait', col: '#3a2a1a', on: S => S.narr('一位戴着长假发的老爷，手按着佩剑，眼皮耷拉着。\n铜牌上刻着：第二代汤森子爵。\n他的画像挂在楼梯上，正对着平台。') },
          { id: 'h_patch', x: 11, y: 1, spr: 'patch', on: S => S.narr(S.f.toldPortrait ? '这里就是她的画像挂过的地方。\n一百年前上校在楼梯上见了她，第二天，老爷就让人把画摘了。' : '墙纸上有一块颜色浅一点的方印子，比周围亮一圈，中间钉着一颗钉子。\n这里原来挂过一幅画。') },
          { id: 'h_pl', x: 13, y: 1, spr: 'portrait', col: '#2a2a3a', on: S => S.narr('一位穿红色猎装的后代，抱着一条猎犬。\n画家把狗画得比人好。') },
          { id: 'h_dkdoor', x: 19, y: 2, spr: 'door', col: '#3a2a1e', async on(S) { S.sfx('open'); await S.go('darkroom', 2, 7, 3); } },
          { id: 'h_clock', x: 15, y: 3, spr: 'clock', on: S => S.narr(DUSK.includes(S.f.act) ? '一座落地钟，钟摆慢吞吞地摆。表盘上画着月亮的盈亏。' : '落地钟。指针过了十一点。\n钟摆的声音在空荡荡的大厅里，大得吓人。') },
          { id: 'h_fire', x: 16, y: 3, w: 2, spr: 'fireplace', light: FIREL, on: S => S.narr(DUSK.includes(S.f.act) ? '大壁炉里烧着一截苹果木，满屋子淡淡的甜味。' : '壁炉里只剩一层红炭。离得这么近，你的后背还是凉的。') },
          { id: 'h_lect', x: 19, y: 6, spr: 'lectern', async on(S) {
            await S.narr('一只读经台上摊着庄园的访客留言簿，皮面磨得发亮。\n最前面夹着一张单独的旧纸，折痕都快断了。');
            await S.note('guest');
          } },
          { id: 'hk_p', x: 4, y: 3, spr: 'hook', on: S => hookOn(S, 'p') },
          { id: 'hk_5', x: 8, y: 5, spr: 'hook', on: S => hookOn(S, '5') },
          { id: 'hk_10', x: 8, y: 7, spr: 'hook', on: S => hookOn(S, '10') },
          { id: 'hk_f', x: 8, y: 9, spr: 'hook', s: { post: true }, on: S => hookOn(S, 'f') },
          { id: 'tripod', x: 6, y: 12, spr: 'tripod', on: S => tripodOn(S) },
          { id: 'h_chair', x: 12, y: 10, spr: 'armchair', col: '#5a2a22', on: S => S.narr('一把高背扶手椅，皮面裂成了细细的网。椅子正对着壁炉，背对着楼梯。') },
          { id: 'hale', x: 8, y: 12, spr: '@hale', dir: 1, on: S => haleTalk(S) },
          { id: 'pell', x: 16, y: 8, spr: '@pell', dir: 0, on: S => pellTalk(S) },
          { id: 'h_case1', x: 2, y: 10, spr: 'crate', on: S => S.narr('黑尔先生的器材箱，侧面用白漆刷着画报社的名字。里面码着一盒一盒的玻璃底片。') },
          { id: 'h_case2', x: 1, y: 11, spr: 'box', on: S => S.narr('装镁粉的小铁罐，贴着红色的标签：「易燃。远离明火。」') },
          { id: 'h_pic', x: 2, y: 8, spr: 'painting', col: '#3a4a3a', on: S => S.narr('一幅庄园全景的油画：草地、湖、一排排的栗树。\n画里所有的窗户都是黑的，只有楼上一扇亮着。') },
          { id: 'h_armour', x: 20, y: 12, spr: 'statue', on: S => S.narr('一副旧盔甲立在角落。头盔的面罩合着，缝里黑洞洞的。') },
          { id: 'h_plant', x: 1, y: 13, spr: 'plant', on: S => S.narr('一盆蕨，叶子尖都枯了。佩尔太太说，这屋里什么花都养不长。') },
          { id: 'h_table', x: 15, y: 12, w: 2, spr: 'table2', col: '#4a2e1a', on: S => S.narr('茶几上摆着一套银茶具，茶早凉了。糖罐盖子上，落着一只死飞蛾。') },
          { id: 'lady', x: 14, y: 2, spr: '@lady', hidden: true, solid: false, light: { r: 1.5, col: 'rgba(230,214,180,.14)' }, on: S => ladyOn(S) }
        ],
        async enter(S, first) {
          setLights(S);
          if (first) {
            S.f.act = 'arrive'; stage(S); setLights(S);
            await S.narr('橡木的大楼梯从大厅中间升上去，在高窗底下拐一个弯。\n夕阳正从那扇窗里照进来。整座大厅都是旧木头和蜂蜡的味道。');
            S.goal('跟黑尔先生打个招呼（相机旁边）');
            return;
          }
          if (S.f.chase) spawnBehind(S);
        }
      },
      /* ---------------- 楼上长走廊 ---------------- */
      upper: {
        amb: 'room', dark: .62, plr: 3, wall: 'paper', wallC: { face: '#4a3836', trim: '#2a1e1e', top: '#141012' }, floor: 'darkwood',
        tileOpts: { carpetC: '#4a1c1e' },
        rows: [
          '######################',
          '######################',
          '#....................#',
          '#cccccccccccccccccccc#',
          '#....................#',
          '######################'],
        ents: [
          { id: 'u_down', x: 1, y: 3, spr: 'stairsdown', solid: false, async touch(S) { await S.go('hall', 14, 2, 1); } },
          { id: 'u_back', x: 20, y: 3, spr: 'stairsdown', solid: false, async touch(S) { await S.go('darkroom', 12, 3, 0); } },
          { id: 'cdoor', x: 9, y: 1, spr: 'door', col: '#4a2e1e', locked: true, on: S => chamberDoor(S) },
          { id: 'u_hdoor', x: 5, y: 1, spr: 'door', col: '#5a3a24', on: S => S.narr(DUSK.includes(S.f.act) || S.f.act === 'night' ? '客房。佩尔太太给你们收拾好了，床头搁着一个暖床的铜壶。' : '黑尔先生的房间。门缝里传出很响的鼾声。\n……你忽然很羡慕他。') },
          { id: 'u_pdoor', x: 16, y: 1, spr: 'door', col: '#5a3a24', on: S => S.narr(['arrive', 'tut', 'tut2', 'tut3', 'night'].includes(S.f.act) ? '佩尔太太的房间，门锁着。' : '佩尔太太的房间。门缝底下的灯已经熄了。') },
          { id: 'u_bdoor', x: 13, y: 1, spr: 'bulletdoor', on: S => S.narr('一扇旧门。齐胸高的地方有一个小圆洞，用木塞堵过，木塞又掉了。\n你把手指伸进去——洞很深，里面还卡着一点发黑的铅。') },
          { id: 'u_p1', x: 3, y: 1, spr: 'portrait', col: '#3a2a2a', on: S => S.narr('一位戴珍珠耳环的老夫人。画框下面的铜牌被人撬走了。') },
          { id: 'u_p2', x: 7, y: 1, spr: 'portrait', col: '#2a3a2a', on: S => S.narr('两个穿蕾丝领的孩子，手拉着手站在草地上。\n画的背面贴着一张小纸片：「她的孩子们」。') },
          { id: 'u_p3', x: 11, y: 1, spr: 'portrait', col: '#3a3a2a', on: S => S.narr('一个骑马的青年。画上的天空裂了好几道细纹。') },
          { id: 'u_p4', x: 18, y: 1, spr: 'portrait', col: '#2a2a3a', on: S => S.narr('一位穿军装的先生，胸前挂满了勋章，表情像是刚闻到什么不好的味道。') },
          { id: 'u_win', x: 20, y: 1, spr: 'window', on: S => S.narr(DUSK.includes(S.f.act) ? '走廊尽头的窗外是草地和湖。湖面上已经起了一层薄雾。' : '窗外全是雾。雾里好像有一盏灯，在很远的地方慢慢地晃。') },
          { id: 'u_table', x: 6, y: 4, spr: 'table', col: '#4a2e1a', on: S => S.narr('一张靠墙的小桌，上面一只青花瓷瓶，插着几枝早就干透的薰衣草。') },
          { id: 'u_plant', x: 15, y: 4, spr: 'plant', on: S => S.narr('一盆棕榈，叶子全都朝着走廊中间那扇门的方向歪。') }
        ],
        async enter(S, first) {
          setLights(S);
          if (first) await S.narr('楼上是一条长走廊，地毯吃掉了脚步声。两边挂满了画像，一张张脸都朝着你。');
          if (S.f.act === 'seen' && S.once('doorAjar')) { S.sfx('heart'); await S.narr('走廊中间那扇门，开着一条缝。\n门缝里透出一点灰白的光，和一股很冷、很旧的空气。'); }
          if (S.f.chase) spawnAcross(S);
        }
      },
      /* ---------------- 她的房间（锁了两百年） ---------------- */
      chamber: {
        amb: 'drone', dark: .92, plr: 3, wall: 'paper', wallC: { face: '#54442e', trim: '#2e2418', top: '#141008' }, floor: 'wood',
        tileOpts: { woodC: '#4e3a28' },
        rows: [
          '############',
          '############',
          '#..........#',
          '#..........#',
          '#..........#',
          '#..........#',
          '#..........#',
          '#..........#',
          '######.#####'],
        ents: [
          { id: 'c_exit', x: 6, y: 8, spr: 'invisible', solid: false, async touch(S) { await S.go('upper', 9, 2, 0); } },
          { id: 'mkA', x: 2, y: 1, spr: 'mark', on: S => markOn(S, 'A') },
          { id: 'c_win', x: 3, y: 1, spr: 'bwindow', light: MOON2, async on(S) {
            await S.narr('窗户外面钉着铁栏杆，一根一根，比你的手腕还粗。\n月光从栏杆缝里漏进来。有一块玻璃上，划满了很小很小的字。');
            await S.note('pane');
          } },
          { id: 'mkB', x: 5, y: 1, spr: 'mark', on: S => markOn(S, 'B') },
          { id: 'c_fire', x: 8, y: 2, w: 2, spr: 'fireplace', on: S => S.narr('壁炉冷了两百年。炉膛里有一小堆灰，灰里埋着半截烧剩的蜡烛。') },
          { id: 'mkC', x: 10, y: 1, spr: 'mark', on: S => markOn(S, 'C') },
          { id: 'c_bed', x: 5, y: 3, h: 2, spr: 'bed', col: '#6a4a2e', on: S => S.narr(S.f.act === 'final' ? '床铺上，那个人形的凹陷不见了。被子平平整整的，像刚有人铺过。' : '一张四柱床，帐子烂成了一缕一缕的。床被人从墙边拖开了一尺。\n被子上有一个人形的凹陷——很浅，很浅。') },
          { id: 'c_chest', x: 5, y: 5, spr: 'chest', on: S => chestOn(S) },
          { id: 'c_board', x: 3, y: 3, spr: 'board', decal: true, solid: false, on: S => boardOn(S) },
          { id: 'c_chair', x: 2, y: 5, spr: 'chair', col: '#4a2e1a', on: S => S.narr('一把椅子摆在窗边，正对着窗外。椅面上的绒布被坐出了两个浅坑。') },
          { id: 'c_desk', x: 1, y: 7, spr: 'desk', on: S => S.narr('一张小写字台。墨水瓶干了，羽毛笔的毛掉光了。\n抽屉里只有一沓白纸——一个字都没写，像是有人不许她写。') },
          { id: 'c_vanity', x: 10, y: 5, spr: 'vanity', on: S => S.narr('梳妆台上的镜子被人取走了，只剩一个空框。\n台面上一把象牙梳子，齿缝里缠着几根长长的深色头发。') },
          { id: 'c_toy', x: 9, y: 7, spr: 'box', on: S => S.narr('一只小木箱，里面是一匹掉了漆的木马、两只布娃娃。\n……孩子们的东西。可孩子们不许进这间屋子。') }
        ],
        async enter(S, first) {
          setLights(S);
          if (S.f.act === 'seen') {
            S.f.act = 'room'; S.sfx('heart');
            await S.narr('门里比走廊冷得多。\n灰在月光里慢慢地转。一张床，一把椅子，一个冷了两百年的壁炉。');
            await S.narr('墙上有三块颜色浅一点的方印子，大小差不多，各钉着一颗钉子。\n这里原来挂过三样东西。现在什么都没有了。');
            await S.think('黑尔先生的折叠相机还在我身上。\n楼梯上那一张，是快门开久了才「吃」进去的……这间屋子，也拍一张。');
            S.goal('把折叠相机搁在床尾的箱子上，拍一张这间屋子（只有窗口的月光）');
          }
          if (S.f.chase) spawnBehind(S);
        }
      },
      /* ---------------- 暗房（从前的储藏间） ---------------- */
      darkroom: {
        amb: 'room', dark: .74, darkC: '#140404', plr: 2.6, wall: 'plain', wallC: { face: '#4a3a34', trim: '#2a1e1a', top: '#120c0a' }, floor: 'stone',
        rows: [
          '##############',
          '##############',
          '#......#.....#',
          '#......#.....#',
          '#............#',
          '#......#.....#',
          '#......#.....#',
          '#......#.....#',
          '##.###########'],
        ents: [
          { id: 'd_exit', x: 2, y: 8, spr: 'invisible', solid: false, async touch(S) { S.sfx('open'); await S.go('hall', 19, 3, 0); } },
          { id: 'wrapped', x: 1, y: 2, spr: 'wrapped', on: S => wrappedOn(S) },
          { id: 'd_tray', x: 3, y: 2, w: 2, spr: 'devtray', on: S => develop(S) },
          { id: 'd_red', x: 5, y: 1, spr: 'safelight', light: REDL, on: S => S.narr('暗房的红色安全灯。在这种光底下，你的手看起来像是浸过血。') },
          { id: 'd_shelf', x: 6, y: 2, spr: 'shelf', on: S => S.narr('架子上一排棕色的药瓶：显影液、定影液、停显液。黑尔先生在每个瓶子上都贴了手写的标签，字比印的还工整。') },
          { id: 'd_sink', x: 1, y: 5, spr: 'sink', on: S => S.narr('一只石头水槽，水龙头滴着水。冲洗底片的水，冷得扎手。') },
          { id: 'd_line', x: 3, y: 7, w: 3, spr: 'dryline', solid: false, on: S => S.narr('绳子上晾着下午拍的几张：门厅、书房、壁炉。\n每一张都清清楚楚，每一张里都没有人。') },
          { id: 'd_plates', x: 9, y: 2, spr: 'plateshelf', on: S => S.narr('一格一格的玻璃底片，用纸隔着。最底下一格的纸袋发黄了，上面写着：1904。') },
          { id: 'd_crate', x: 9, y: 6, spr: 'crate', on: S => S.narr('一只旧木箱，装着过圣诞用的锡纸彩带和一盒蜡烛头。') },
          { id: 'd_sack', x: 11, y: 6, spr: 'sack', on: S => S.narr('一袋煤，口子扎得死死的。') },
          { id: 'd_back', x: 12, y: 2, spr: 'stairsup', solid: false, async touch(S) { await S.go('upper', 19, 3, 1); } }
        ],
        async enter(S, first) {
          setLights(S);
          if (first) await S.narr('暗房原来是一间储藏室。没有窗户，只有一盏红灯。\n药水的酸味里，混着一股樟脑丸的味道。\n东头有一道窄窄的仆人楼梯，通到楼上走廊。');
          if (S.f.chase) spawnBehind(S);
        }
      }
    }
  });

  /* ---------------- 布景：谁在哪儿、灯怎么亮 ---------------- */
  function stage(S) {
    const a = S.f.act, h = S.ent('hale'), p = S.ent('pell');
    if (DUSK.includes(a)) { S.place('hale', 8, 12, 1); h.oy = 0; S.place('pell', 16, 8, 0); }
    else if (a === 'night') { S.place('hale', 12, 10, 3); h.oy = -3; S.place('pell', 18, 10, 1); }
    else { S.hide('hale'); S.hide('pell'); }
  }
  function setLights(S) {
    const f = S.f, night = !DUSK.includes(f.act);
    S.dark(night ? .88 : .42, 'hall'); S.dark(night ? .9 : .62, 'upper'); S.dark(.92, 'chamber'); S.dark(.74, 'darkroom');
    const w = S.ent('h_win'); w.light = night ? MOONL : DUSKL; w.s.moon = night;
    lampPlr(S);
  }
  function lampPlr(S) {
    const f = S.f;
    if (DUSK.includes(f.act)) return S.plr(null);
    if (f.lampOut) return S.plr(.9);
    if (f.chase && f.oil <= 0) return S.plr(1.2);
    S.plr(S.has('lamp') ? 3.0 : 1.4);
  }
  function unhangAll(S) { for (const k of ['p', '5', '10', 'f']) { const e = S.ent('hk_' + k); e.lit = false; e.light = null; } S.f.lamp = null; S.give('lamp', true); }

  /* ---------------- 黑尔先生 ---------------- */
  async function haleTalk(S) {
    const f = S.f, a = f.act;
    S.face('hale', 'pl');
    if (a === 'arrive') {
      await S.say('黑尔先生', ['来了？三脚架我已经架好了，镜头对着楼梯平台。', '趁着还有窗光，先拍一张做底。你来——我看看你这个学徒，这半年学到了多少。']);
      await S.say('黑尔先生', ['曝光：窗光，四秒。', '到相机后面去，我说「开」，你拔镜头盖。']);
      f.act = 'tut'; S.goal('到相机后面（楼梯脚南边的三脚架），按黑尔先生说的拍一张：窗光，四秒');
      return;
    }
    if (a === 'tut') return S.say('黑尔先生', '窗光，四秒。快点，太阳可不等你。');
    if (a === 'tut2') return S.say('黑尔先生', '底片冲出来再说。暗房在大厅东北角那扇门后面。');
    if (a === 'tut3') return toNight(S);
    if (a === 'night') {
      const n = f.fails || 0;
      if (n >= 3) return S.say('黑尔先生', ['……还没拍好？', '我本子上那几行小字你看了没有：淡的东西，快门不开到十五秒往上，底片上不会有。', '表里哪几行是十五秒、三十秒？灯就挂到那一行写的地方。实在不行，灯拿在手里站在相机边，开三十秒。']);
      if (n >= 1) return S.say('黑尔先生', ['冲出来不对？别瞎试。', '先看一片黑还是一片白：黑是给少了，白是给多了。', '要是曝光刚好、平台上却什么都没有——那是快门太短。我本子页边写着呢。']);
      return S.say('黑尔先生', ['灯挂哪儿、快门开多久，照我本子来。我眯一会儿。', '拍好了自己去冲。还有——镁光那东西别乱点，这种老房子，一点就是一屋子白烟。']);
    }
  }
  async function toNight(S) {
    const f = S.f;
    await S.say('黑尔先生', ['平台上一小团白？给我看看。', '……灰。要么是镜头上的油。干这行三十年，我见过的「鬼」，全是从冲洗槽里出来的。', '不过窗光够了。好，今晚拍夜景——编辑就要这个：月光底下的大楼梯。']);
    await S.say('黑尔先生', ['夜里只有一盏油灯。灯挂在哪个灯钩上、快门开几秒，我下午都试过了，记在本子上。', '你拿着。照着本子来。']);
    S.give('lamp', true); S.give('flash', true); S.give('fold', true); S.sfx('item'); S.toast('获得：油灯、镁光闪光枪、折叠相机');
    await S.note('table');
    await S.say('黑尔先生', '我在壁炉边眯一会儿。天黑透了你就拍，拍好了自己去冲。');
    await S.fade(1, 900);
    SND.chime(S);
    await S.card('夜　十一点', '', '佩尔太太把大厅的灯一盏一盏地熄了，只留下你手里那一盏。\n黑尔先生在壁炉边的扶手椅里打起了盹。\n\n窗外起了雾。月亮从高窗里照进来，\n正好落在楼梯的平台上。');
    f.act = 'night'; f.fails = 0; stage(S); setLights(S);
    S.pos(6, 13, 3);
    await S.fade(0, 800);
    S.goal('拍夜里的楼梯：油灯挂上灯钩，再到相机后面定曝光（曝光笔记在「笺」里；两人时一人念笔记、一人挂灯开快门）');
    S.cp('night');
  }

  /* ---------------- 佩尔太太 ---------------- */
  const PELL = [
    ['那位？……这房子里的人不叫她「布朗夫人」。我们叫她「夫人」。', '两百年前，她是这儿的女主人。子爵的第二位太太，叫多萝西。', '据说子爵疑心她，把她锁在楼上那间屋子里，连孩子都不让见，一直锁到她死。', '有人说她是出天花死的；也有人说，是从这道楼梯上摔下去的。', '她穿一条棕色的锦缎裙子。夜里从楼上那扇门出来，沿着楼梯往下走，在平台上站一站——', '然后就不见了。'],
    ['一百年前的圣诞节，有位上校在楼梯上看清过她的脸。', '他说那张脸是亮的，像点着一盏灯。可眼睛那儿……是两个黑窟窿。', '第二年又来了一位客人，在走廊上碰见她，还冲她开了一枪。门上的洞还在呢。那张纸夹在留言簿里，您自己看吧。'],
    ['老辈人传下来一句话：在楼梯上碰见她，别拿灯去照她的脸。', '灯照着，她就站住了，把脸扭过去——她不愿意让人看清。', '……可也别把背对着她。谁也说不清，那时候她会做什么。'],
    ['楼梯上原来挂着她一张画像，就在子爵对面。', '上校那件事以后，老爷让人摘了，说看着瘆人。也不知道塞到哪儿去了。', '我小时候见过一回。画上的她，眼睛好好的，还有点想笑的样子。'],
    ['那间屋子从那时候起就锁着，两百年没人开过。钥匙？早就没了。', '您拍您的楼梯。楼上那扇门，别去碰。']
  ];
  async function pellTalk(S) {
    const f = S.f;
    S.face('pell', 'pl');
    if (DUSK.includes(f.act) && S.once('pellHi')) {
      await S.say('佩尔太太', ['您就是画报社来的那位？我是这儿的管家，佩尔。', '老爷一家在伦敦过冬，房子交给我。您要拍什么，跟我说一声就行。', '只有一样——夜里在楼梯上看见什么，别大声嚷嚷。']);
      return;
    }
    const i = f._pl = ((f._pl ?? -1) + 1) % PELL.length;
    await S.say('佩尔太太', PELL[i]);
    if (i === 3) f.toldPortrait = true;
    if (f.flashN && S.once('pellFlash2')) await S.say('佩尔太太', '还有——那个「砰」一下冒白光的东西，再也别在楼梯上点了。求您了。');
  }

  /* ---------------- 灯钩与相机 ---------------- */
  async function hookOn(S, k) {
    const f = S.f, e = S.ent('hk_' + k);
    const where = HOOKN[k], dist = { p: '贴着平台', '5': '离平台五级', '10': '离平台十级', f: '离平台十五级——整道下半截楼梯' }[k];
    if (f.act !== 'night') return S.narr(k === 'f' ? `楼梯脚的柱头，雕成一颗松果，顶上钉着一只黄铜灯钩。${dist}。` : `扶手上的一只黄铜灯钩：${where}，${dist}。\n从前仆人们夜里在这儿挂灯，照着主人上楼。`);
    if (f.expo) return S.narr('快门开着呢。别动。');
    if (e.lit) {
      e.lit = false; e.light = null; f.lamp = null; S.give('lamp', true); S.sfx('switch'); lampPlr(S);
      return S.narr(`你把油灯从${where}的灯钩上摘了下来。`);
    }
    if (S.has('lamp')) {
      S.take('lamp'); e.lit = true; e.light = LAMPL; f.lamp = k; S.sfx('switch'); lampPlr(S);
      return S.narr(`你把油灯挂上了${where}的灯钩（${dist}）。\n灯光在台阶上铺开一小圈，再往外，就全是黑的了。`);
    }
    await S.narr(`${where}的灯钩，空着。\n油灯挂在${HOOKN[f.lamp] || '别处'}。`);
  }
  async function tripodOn(S) {
    const f = S.f, a = f.act;
    if (f.expo) return S.narr('快门开着呢。别碰相机，也别动。');
    if (a === 'arrive') return S.narr('黑尔先生的大画幅相机，架在胡桃木三脚架上，镜头对着楼梯平台。\n皮腔、黄铜镜头、一块黑罩布——比你的年纪还大。');
    if (a === 'tut') {
      const v = await S.keypad('曝光几秒？\n黑尔先生：「窗光，四秒。」', KEYS, 1, { alias: AL });
      if (v == null) return;
      if (v !== '4') { S.sfx('bad'); return S.say('黑尔先生', +v < 4 ? '……四秒。给少了，底片是黑的。' : '四秒！给多了一片白。听我的。'); }
      await S.say('黑尔先生', ['好。快门开着的时候，谁也别动——动的东西留不下来，只留下一道糊影。', '……开。']);
      return beginExpo(S, 'tut', 'win', 4);
    }
    if (a === 'tut2' || a === 'tut3') return S.narr('片匣里那张已经拍过了。先去暗房冲出来。');
    if (a === 'night') return nightShot(S);
    await S.narr('相机还对着楼梯平台。\n……你不太想再从毛玻璃里看那个平台了。');
  }
  async function nightShot(S) {
    const f = S.f;
    if (f.plate) { const r = await S.ask('片匣里那张还没冲。', ['换一块新底片，重拍', '先去冲'], ''); if (r === 1) return; f.plate = null; }
    const c = await S.ask('相机对着楼梯平台。', ['开快门（长曝光）', '点镁光，拍一张闪光的', '先不拍']);
    if (c === 2) return;
    if (c === 1) return nightFlash(S);
    let light = f.lamp;
    if (!light) {
      if (S.has('lamp')) {
        const r = await S.ask('油灯还在你手里。', ['就拿在手里（和挂在楼梯脚一样远）', '吹灭它，只用月光', '先去挂灯']);
        if (r === 2) return;
        light = r === 0 ? 'hand' : 'moon';
      } else light = 'moon';
    }
    if (light === 'moon') { f.lampOut = true; lampPlr(S); S.sfx('switch'); }
    const v = await S.keypad(`曝光几秒？\n灯：${LN[light]}\n（曝光笔记可以在「笺」里翻看）`, KEYS, 1, { alias: AL });
    if (v == null) { if (f.lampOut) { f.lampOut = false; lampPlr(S); } return; }
    await S.narr('你钻到黑罩布底下，对好焦，又钻出来，手指捏住镜头盖。\n大厅里只剩落地钟的声音。');
    beginExpo(S, 'night', light, +v);
  }
  async function nightFlash(S) {
    const f = S.f;
    f.flashN = (f.flashN || 0) + 1;
    await S.narr('你把镁粉倒进闪光槽，对着楼梯平台高高举起，扣下扳机——');
    SND.boom(S); S.fx('flash', { dur: 1.2 }); S.shake(600, 3);
    if (f.flashN >= 2) {
      S.sfx('scream'); await S.wait(500);
      await S.scare('face', { spr: '@lady', face: 'dorothy', sfx: 'scare', dur: 1.1 });
      return S.end({ bad: true, id: 'flash', title: '镁光一闪', text: '第二团白光里，平台上的她没有扭开脸。\n她转过来，正对着你。\n那两个黑洞，也看清了你。\n\n天亮的时候，佩尔太太在楼梯脚找到了你。你坐在相机旁边，眼睛睁得大大的，一直望着平台。\n那张底片冲出来是全白的，只有正中间两个挨得很近的小黑点。\n\n从那以后，你再也拍不了长曝光——快门一开，你就忍不住要回头。' });
    }
    await S.narr('「砰」！白光把整座大厅照得像正午。\n就在那一下里，你看见平台上有个人影——她猛地把脸扭开了。');
    S.sfx('scream'); S.shake(500, 2);
    if (f.lamp) { unhangAll(S); }
    lampPlr(S);
    await S.narr('白烟慢慢散开。灯钩上的油灯被震灭了，你摸黑把它摘下来，重新点上。');
    S.face('pell', 'pl'); S.bubble('pell', '!', 1200);
    await S.say('佩尔太太', ['谁点的闪光？！', '……老天爷。别在这道楼梯上点那个。上校那一回，就是举着灯去照她的脸——', '别再有第二回了。求您。']);
    await S.say('黑尔先生', '镁粉贵得很，省着点。……底片你自己冲去吧。');
    f.plate = 'flash';
    S.goal('拍夜里的楼梯：油灯挂上灯钩，再到相机后面定曝光（别再点镁光了）');
  }

  /* ---------------- 曝光：快门开着的时候不能动 ---------------- */
  function beginExpo(S, kind, light, secs) {
    const f = S.f;
    SND.shutter(S);
    f.expo = { kind, light, secs, t: 0, dur: Math.max(.6, secs * .6) / FAST, st: 0 };
    S.timer(f.expo.dur, '快门开着 · 别动', endExpo);
    if (kind === 'room') { S.ent('c_chest').s.cam = true; S.ent('c_chest').s.open = true; }
    else S.ent('tripod').s.open = true;
    if (kind === 'night') { S.moveTo('lady', 'hall', 14, 2, 1); const L = S.ent('lady'); L.alpha = 0; L.oy = 0; S.focus(6, 7); }
    if (kind === 'room') { S.moveTo('lady', 'chamber', 3, 3, 3); const L = S.ent('lady'); L.alpha = 0; L.oy = 4; }
  }
  function expoTick(S, dt) {
    const f = S.f, ex = f.expo;
    ex.t += dt;
    if (S.moving && ex.t > .15) return ruinExpo(S);
    const k = ex.t / ex.dur, L = S.ent('lady');
    if (ex.kind === 'night' && S.map === 'hall') {
      const u = clamp((k - .1) / .45, 0, 1), d = u * 9;
      const x = d <= 8 ? 14 - d : 6, y = d <= 8 ? 2 : 2 + (d - 8);
      L.px = x * 16; L.py = y * 16; L.dir = d <= 8 ? 1 : 0; L.hidden = false;
      L.alpha = Math.min(.42, k * 3) * (k > .9 ? (1 - k) / .1 : 1);
      const st = Math.floor(d); if (st > ex.st && d < 9) { ex.st = st; SND.step(S, 0, .18); }
      ex.rs = (ex.rs ?? .4) - dt; if (ex.rs <= 0) { ex.rs = .9 + Math.random() * .6; SND.rustle(S); }
      if (k > .5 && !ex.told) { ex.told = true; S.sfx('heart'); S.bubble('pl', '!', 1400); if (!f.sawLady) S.toast('（平台上……站着一个人。别动。）'); }
    }
    if (ex.kind === 'room' && S.map === 'chamber') {
      L.hidden = false;
      L.alpha = Math.min(.36, k * 2.5) * (k > .88 ? (1 - k) / .12 : 1);
      if (k > .55 && !ex.rose) { ex.rose = true; L.oy = 0; L.dir = 0; S.sfx('whisper'); S.toast('（窗户底下那团白，站了起来）'); }
      if (k > .25 && !ex.told) { ex.told = true; SND.creak(S); S.sfx('heart'); }
    }
  }
  function ruinExpo(S) {
    const f = S.f, ex = f.expo;
    S.clearTimer(); f.expo = null;
    const L = S.ent('lady'); L.hidden = true; L.alpha = 1; L.oy = 0;
    S.ent('tripod').s.open = false; S.ent('c_chest').s.open = false;
    f.plate = ex.kind === 'tut' ? null : ex.kind === 'room' ? 'r_blur' : 'blur';
    S.run(async S => {
      SND.shutter(S); S.focus(null);
      if (f.lampOut) { f.lampOut = false; lampPlr(S); }
      if (ex.kind === 'tut') { S.face('hale', 'pl'); return S.say('黑尔先生', ['你动了！', '……快门开着的时候，人一动，底片上就是一道糊影。换块底片，重来。']); }
      S.sfx('sting');
      await S.narr(ex.kind === 'room' ? '你一动——\n窗户底下那团白，一下子就没了。\n这张底片，大概只剩一道糊影。' : '你一动——\n平台上的影子一下子就没了，像一口吹散的气。\n这张底片，大概只剩一道糊影。');
      if (S.once('ruinTip')) await S.think('她只在你一动不动的时候，才站在那儿。');
    });
  }
  async function endExpo(S) {
    const f = S.f, ex = f.expo; if (!ex) return;
    f.expo = null; SND.shutter(S); S.focus(null);
    S.ent('tripod').s.open = false; S.ent('c_chest').s.open = false;
    const L = S.ent('lady'); if (!L.hidden) { await S.alpha('lady', 0, 500); } L.oy = 0;
    f.plate = expoResult(ex.kind, ex.light, ex.secs);
    if (f.lampOut) { f.lampOut = false; lampPlr(S); }
    if (ex.kind === 'tut') {
      S.face('hale', 'pl');
      await S.say('黑尔先生', ['好，合上。', '去暗房冲出来，我要看看窗光够不够。暗房在大厅东北角那扇门后面。']);
      f.act = 'tut2'; S.goal('去暗房冲底片（大厅东北角的门）');
      return;
    }
    if (ex.kind === 'night') {
      await S.narr('「咔」。你把镜头盖扣了回去。');
      if (!f.sawLady) {
        f.sawLady = true;
        await S.narr('平台上空空的。只有月光，和一点被风吹歪的灰。');
        await S.think('可是刚才……平台上站着一个女人。罩着长长的纱，一动不动，脸朝着镜头。');
        S.face('hale', 'pl');
        await S.say('黑尔先生', ['嗯？拍完了？', '看见什么？我背对着楼梯，在打盹。', '……你那张脸，白得跟底片似的。去冲吧。']);
      }
      S.goal('去暗房冲这张底片');
      return;
    }
    await S.narr('「咔」。你扣上镜头盖，重新点亮油灯。\n床那边的凹陷，好像比刚才深了一点。');
    S.goal('回暗房冲这张底片（走廊东头有仆人楼梯直通暗房）');
  }
  function expoResult(kind, light, secs) {
    if (kind === 'tut') return 'dusk';
    const need = NEED[light], r = kind === 'room' ? 'r_' : '';
    if (secs < need) return r + 'under';
    if (secs > need) return r + 'over';
    if (secs < 15) return r + 'empty';
    return kind === 'room' ? 'room' : (light === '10' ? 'lady10' : 'lady');
  }

  /* ---------------- 暗房：显影 ---------------- */
  const PFACE = { dusk: 'pl_dusk', under: 'pl_under', over: 'pl_over', empty: 'pl_empty', blur: 'pl_blur', flash: 'pl_flash', lady: 'pl_lady', lady10: 'pl_lady',
    r_under: 'rm_under', r_over: 'rm_over', r_empty: 'rm_empty', r_blur: 'rm_blur', room: 'rm_plate' };
  const showPlate = (S, face, dur = 6.5) => S.scare('face', { face, dur, sfx: 'paper', shake: .01, shakeMs: 1, wait: false });
  async function develop(S) {
    const f = S.f, p = f.plate;
    if (f.expo) return S.narr('快门还开着呢。');
    if (!p) {
      if (f.act === 'found' || f.act === 'chase') return S.narr('显影盘里的药水还在轻轻晃。');
      return S.narr(DUSK.includes(f.act) ? '显影台上三只药盘：显影、停显、定影。黑尔先生说，冲底片和做菜一样，全凭手感和耐心。' : '药盘里的显影液泛着一层暗红的光。片匣是空的——先去拍。');
    }
    f.plate = null;
    await S.narr('红灯底下，你把底片滑进显影盘，轻轻地晃着药水。\n白色的玻璃上，影子一点一点地浮出来——');
    showPlate(S, PFACE[p]); await S.wait(1900);
    const night = ['under', 'over', 'empty'];
    if (p === 'dusk') {
      await S.narr('楼梯、扶手、高窗——窗光把台阶一级一级地描了出来。\n只是平台上，有一小团说不清的白，像一口呵在玻璃上的气。');
      f.act = 'tut3'; S.goal('把底片拿给黑尔先生看');
      return;
    }
    if (night.includes(p)) {
      f.fails = (f.fails || 0) + 1;
      await S.narr({ under: '底片几乎是黑的，只认得出几道扶手的轮廓。\n——曝光不够：灯离平台太远，或者快门开得太短。', over: '一片白雾。平台、高窗和扶手糊成了一团光。\n——曝光太多：灯离得太近，或者快门开得太久。', empty: '曝光刚刚好：台阶、扶手、窗棂都清清楚楚。\n可平台上什么也没有——连下午那一小团白都不见了。' }[p]);
      await nightHint(S, p);
      await nightCost(S);
      return;
    }
    if (p === 'blur') { await S.narr('楼梯是清楚的。可画面底下横着一道灰白的糊影，像一个人从镜头前走了过去。\n——那是你自己。快门开着的时候，你动了。'); return; }
    if (p === 'flash') { S.sfx('sting'); await S.narr('整张底片白得发亮，什么都看不出来。\n……只有正中间，两个小小的黑点，挨得很近。\n像一双眼睛。'); return; }
    if (p === 'lady' || p === 'lady10') return famousScene(S);
    if (['r_under', 'r_over', 'r_empty'].includes(p)) {
      f.rfails = (f.rfails || 0) + 1;
      await S.narr({ r_under: '底片黑乎乎的，只认得出窗户的铁栏杆。——给少了。', r_over: '一片白，床和壁炉都化成了雾。——给多了。', r_empty: '屋子拍得清清楚楚，可墙上那三块印子还是空的。\n快门太短——那么淡的东西，吃不进去。' }[p]);
      if (f.rfails >= 3) await S.think('房间里没有灯钩……曝光笔记最后一行：不点灯，只有月光——三十秒。');
      else if (f.rfails >= 2) await S.think('油灯就搁在相机边上，等于贴着拍——一秒刚好，可一秒太短了。\n要开到十五秒往上，就不能点灯。');
      return;
    }
    if (p === 'r_blur') { await S.narr('床、窗户、壁炉——上面斜斜地拖着一道糊影。是你自己。'); return; }
    if (p === 'room') return roomScene(S);
  }
  async function nightHint(S, p) {
    const n = S.f.fails;
    if (n === 1 && p === 'empty') await S.think('平台上什么都没有……可下午那张，明明有一小团白。');
    if (n === 2) await S.think('黑尔先生的本子：灯挂在哪儿，就开多久——一行对一行。\n还有页边那几行小字：淡的东西，要开多久才吃得进去？');
    if (n === 3) await S.think('「十五秒往上」……表里哪几行是十五秒、三十秒？\n灯就挂到那一行写的地方——或者干脆不挂灯。');
    if (n >= 4) { S.sfx('knock'); await S.say('黑尔先生（隔着暗房门）', ['还没好？我都睡醒一觉了。', '灯挂第十级，开十五秒。要么灯拿在手里站在相机边上，开三十秒。照做，别跟我犟。']); }
  }
  async function nightCost(S) {   // 每错一次，夜就更深一点：她离你更近
    const n = S.f.fails;
    if (n === 1) { SND.step(S, 0); SND.step(S, .7); SND.step(S, 1.4); await S.wait(1600); await S.narr('暗房门外，有人慢慢走了过去。\n裙摆擦着地板，「沙——沙——」。'); return; }
    if (n === 2) { const r = S.ent('d_red'); r.off = true; S.sfx('sting'); await S.wait(700); r.off = false; await S.narr('红灯灭了一下，又亮了。\n就在黑下来的那半秒里，你觉得有人站在你身后，往显影盘里看。'); return; }
    S.sfx('whisper'); S.shake(300, 1.5); await S.narr('暗房的门把手，慢慢地转了半圈，又转了回去。');
  }
  async function famousScene(S) {
    const f = S.f;
    await S.narr('楼梯一级一级地浮出来。扶手，高窗，平台——\n平台底下的台阶上，站着一个人。');
    await S.narr('一个女人。淡得像一层纱，从头到脚罩着长长的衣裳，正一级一级地往下走。\n底片是黑白的，可你知道那条裙子是什么颜色。');
    await S.think('你把底片凑到红灯底下，想看清那张脸——');
    await S.scare('face', { spr: '@lady', face: 'dorothy', sfx: 'scare', dur: 1.1 });
    await S.narr('……没有眼睛。\n那张发着光的脸上，眼睛的地方，是两个黑洞。');
    S.sfx('open');
    await S.say('黑尔先生', ['冲好了？我看看。', '……', '双重曝光。肯定是片匣没擦干净，叠上了别的东西。', '要么是镜头上沾了油——灯光一照，拖出来这么一道。']);
    const r = await S.ask('黑尔先生把底片举到红灯底下，看了很久。', ['「我看见她了。她就站在平台上。」', '「……也许真是油。」'], '黑尔先生');
    await S.say('黑尔先生', r === 0 ? ['你看见了，我没看见。这就是我们这行最麻烦的地方：', '照片不会撒谎——可拍照片的人会，看照片的人也会。'] : ['这就对了。', '……虽然我也说不清，油怎么会长成一个人的样子。']);
    await S.say('黑尔先生', ['这张先收着，别跟佩尔太太说。明天一早我坐头班车回伦敦，让编辑去头疼。', '我去睡了。你也早点睡——别再一个人往楼梯上跑。']);
    f.act = 'seen'; stage(S); unhangAll(S); setLights(S);
    await S.wait(900);
    SND.door(S); S.shake(300, 1);
    await S.narr('楼上，「吱——呀——」一声，很长。\n像一扇很久很久没有开过的门。');
    const d = S.ent('cdoor'); d.open = true; d.locked = false;
    S.goal('楼上有一扇门开了——去看看（大楼梯上去，或者走暗房东头的仆人楼梯）');
    S.cp('seen');
  }
  async function roomScene(S) {
    const f = S.f;
    await S.narr('底片上慢慢浮出那间屋子——\n可那不是你刚才看见的那间屋子。');
    await S.narr('墙上的三块印子，都挂着东西：\n窗边，是一幅小小的刺绣；壁炉边，是一面镜子；\n床头上方，是一幅椭圆形的画像，画里的人穿着深色的裙子。');
    await S.narr('窗户底下，有一团淡淡的白，跪在地板上。\n它的一只手按着一块地板，手边有一点小小的亮光。');
    f.plate2 = true;
    await S.wait(500);
    S.ent('wrapped').s.slip = true; S.sfx('paper'); S.shake(200, 1);
    await S.narr('身后，「沙——」的一声。\n墙角那个裹着床单、脸朝墙立着的画框——床单自己滑下来了一半。');
    showPlate(S, 'portrait', 4); await S.wait(1200);
    await S.narr('一个年轻的女人，穿着棕色的锦缎裙子，坐在椭圆形的金框里，安安静静地看着你。\n她的眼睛好好的，嘴角有一点想笑的样子。');
    await S.think('就是她。这就是从她房间里摘下来的那幅画。\n……它一直被藏在这儿，脸朝着墙。');
    f.act = 'found'; S.goal('把画像拿起来，挂回她房间里底片上的原处');
  }

  /* ---------------- 画像与追逐 ---------------- */
  async function wrappedOn(S) {
    const f = S.f, e = S.ent('wrapped');
    if (e.s.taken) return S.narr('墙角只剩一张滑落的旧床单，和地上一个干干净净的方印子。');
    if (f.act !== 'found') {
      await S.narr('一个画框，用旧床单裹得严严实实，脸朝墙立着。\n床单上别着一张发黄的纸条：「老爷吩咐：不许打开。」');
      if (!DUSK.includes(f.act)) await S.think('你伸手去掀——又缩了回来。纸条上那几个字，写得太用力了。');
      return;
    }
    e.s.taken = true; S.give('portrait'); S.norun(true); S.speed(.8);
    await S.narr('画框比你想的沉。你把它抱在怀里，金框的棱角硌着下巴。\n——这样是跑不起来的。');
    f.act = 'chase'; f.oil = OIL; f.wrong = 0;
    S.goal('抱着画像回她的房间，挂回原处！（仆人楼梯在暗房东头；油灯照着她的脸，她会站住）');
    S.cp('chase');
    startChase(S);
  }
  function startChase(S) {
    const f = S.f;
    f.chase = true; S.stop('lady'); S.hide('lady');
    f.spawn = { map: 'darkroom', x: 2, y: 7, t: 1.1, dir: 3 };
    SND.door(S); S.toast('（暗房的门，自己开了一条缝）');
  }
  function spawnBehind(S) {   // 换图后：她从你进来的那扇门跟进来
    const f = S.f; S.stop('lady'); S.hide('lady');
    const t = S.map === 'chamber' ? 1.6 : 1.3;
    f.spawn = { map: S.map, x: S.pl.x, y: S.pl.y, t, dir: S.pl.dir };
    SND.creak(S, t * .5); S.toast('（身后的门响了）');
  }
  function spawnAcross(S) {   // 楼上走廊：她抄了另一道楼梯，从走廊那头迎面过来
    const f = S.f; S.stop('lady'); S.hide('lady');
    const east = S.pl.x > 10;
    f.spawn = { map: 'upper', x: east ? 2 : 19, y: 3, t: .8, dir: east ? 2 : 1 };
    SND.rustle(S, .02); S.toast(east ? '（走廊那头，有一点灯光在晃）' : '（走廊这头的楼梯上，有裙摆擦过的声音）');
  }
  function chaseTick(S, dt) {
    const f = S.f, L = S.ent('lady'), p = W.pl;
    if (f.spawn && f.spawn.map === S.map) {
      f.spawn.t -= dt;
      if (f.spawn.t <= 0) {
        const sp = f.spawn; f.spawn = null;
        S.moveTo('lady', S.map, sp.x, sp.y, sp.dir); L.alpha = 1; L.oy = 0;
        S.chase('lady', { spd: SPD, catch: caught }); L.chase.wait = 0;
        S.sfx('sting'); S.bubble('pl', '!', 900);
      }
      return;
    }
    if (!L || L.hidden || !L.chase || !W.maps[W.mapId].ents.includes(L)) return;
    const dx = (L.px - p.px) / 16, dy = (L.py - p.py) / 16, [fx, fy] = DIRS[p.dir];
    const along = dx * fx + dy * fy, perp = Math.abs(dx * fy - dy * fx);
    const lit = f.oil > 0 && along > .3 && along <= 3.5 && perp <= 1.2;
    if (lit) {
      if (!L.frozen) { S.freeze('lady', true); L.dir = 3; if (S.once('freezeTip')) S.toast('她站住了，把脸扭开——油灯正照着她'); }
      f.oil -= dt;
      if (f.oil <= 0) { f.oil = 0; S.freeze('lady', false); lampPlr(S); S.sfx('switch'); S.toast('油灯「噗」地灭了'); }
    } else if (L.frozen) S.freeze('lady', false);
    f._hb = (f._hb ?? 0) - dt; const dd = Math.abs(dx) + Math.abs(dy);
    if (dd < 6 && f._hb <= 0) { f._hb = .25 + dd * .12; S.sfx('heart'); }
    if (!L.frozen && Math.abs(L.px - p.px) + Math.abs(L.py - p.py) < 16) { S.stop('lady'); S.run(caught); }
  }
  async function caught(S) {
    const f = S.f; if (!f.chase) return;
    f.chase = false; S.stop('lady');
    DIED++;
    if (DIED === 1) await S.scare('face', { spr: '@lady', face: 'dorothy', sfx: 'scream', dur: 1 });
    else await S.scare('red', { sfx: 'scream', dur: .8 });
    await S.die('一只冰凉的手从后面搭上了画框。\n你回过头——那张发光的脸离你只有一拃远。眼睛的地方，两个黑洞，正对着你。\n画框从你怀里滑了下去。', '她找到了你');
  }
  async function ladyOn(S) {
    const f = S.f;
    if (f.act !== 'final') return;
    if (S.has('ring') && !f.ringGiven) {
      const r = await S.ask('她站在画像前面，一动不动。\n你口袋里那枚戒指，沉甸甸的。', ['把戒指放在画框的下沿', '先不']);
      if (r === 1) return;
      S.take('ring'); f.ringGiven = true;
      S.tone('sine', 1568, 1568, 1.6, .06, 0, 0); S.tone('sine', 2093, 2093, 1.2, .03, .08, 0);
      await S.narr('你把戒指轻轻搁在金框的下沿上。\n钻石在月光里闪了一下。');
      await S.narr('她低下头，看了它很久。\n然后，一只半透明的手抬起来，把它拿了过去。');
      S.goal('最后一张：在床尾的箱子上，拍下她');
      return;
    }
    await S.narr(f.ringGiven ? '她站在画像前面。一只手搭在画框上，手指上有一点亮光。' : '她站在画像前面，一动不动。\n从背后看，那条棕色的锦缎裙子，和画里的一模一样。');
  }
  async function chamberDoor(S) {
    const f = S.f, d = S.ent('cdoor');
    if (!d.open) {
      S.sfx('locked');
      await S.narr('一扇厚重的橡木门，锁着。锁眼里塞满了灰。\n门缝底下吹出来的风，比走廊冷得多。');
      return;
    }
    S.sfx('open'); await S.go('chamber', 6, 7, 3);
  }
  const MARKN = { A: '窗边', B: '床头', C: '壁炉边' }, MARKW = { A: '一幅小小的刺绣', C: '一面镜子' };
  async function markOn(S, k) {
    const f = S.f, e = S.ent('mk' + k);
    if (e.s.hang) return S.narr(e.eyes === 'void' ? '画像里那双眼睛的地方，只剩两个洞。' : '她的画像挂在床头，金框在月光里发着暗暗的光。\n画里的人，好像真的在笑。');
    if (!S.has('portrait')) return S.narr(`${MARKN[k]}的墙上，一块颜色浅一点的方印子，比周围亮一圈。钉子还在。` + (f.plate2 ? `\n底片上，这里挂的是${k === 'B' ? '她的画像' : MARKW[k]}。` : ''));
    if (k !== 'B') {
      f.wrong = (f.wrong || 0) + 1;
      S.sfx('thud'); S.shake(300, 2);
      if (f.wrong >= 2 && f.chase) {
        await S.narr('画框又一次从钉子上滑了下来，「哐」地砸在地板上。\n你弯腰去捡——一只冰凉的手，比你先碰到了它。');
        S.ent('lady').chase = null; return caught(S);
      }
      await S.narr(`你把画挂上${MARKN[k]}那颗钉子——\n画框歪了一下，「哐」地滑了下来。\n这里原来挂的不是她。底片上，这儿是${MARKW[k]}。`);
      if (f.chase) {
        S.stop('lady'); S.moveTo('lady', 'chamber', 6, 7, 3); S.chase('lady', { spd: SPD, catch: caught }); S.ent('lady').chase.wait = .6;
        S.sfx('sting'); await S.narr('门口，月光暗了一下。\n她已经站在门里了。');
      }
      return;
    }
    /* 挂对了 */
    f.chase = false; f.spawn = null; S.stop('lady'); S.freeze('lady', false);
    S.take('portrait'); e.s.hang = 'portrait'; S.norun(false); S.speed(1);
    S.sfx('switch');
    await S.narr('画框「咔」的一声，稳稳地挂上了那颗两百年前的钉子。\n正正地，在床头上方。');
    const L = S.ent('lady');
    if (L.hidden || !W.maps.chamber.ents.includes(L)) { S.moveTo('lady', 'chamber', 6, 7, 3); L.alpha = 0; await S.alpha('lady', 1, 600); }
    await S.walk('lady', [4, 2], 1.6); S.face('lady', 3);
    S.amb('none'); SND.hum(S);
    await S.narr('她从你身边走过去，没有看你。\n她在画像前面停下来，仰着头，看着那个穿棕色裙子的年轻女人。');
    await S.narr('很轻很轻地，屋子里有人在哼一支歌。\n很老的调子，像是哄孩子睡觉的。');
    f.act = 'final'; f.oil = Math.max(f.oil, 1); lampPlr(S);
    S.goal('最后一张：在床尾的箱子上，拍下她' + (S.has('ring') ? '（你口袋里还揣着那枚戒指）' : ''));
    S.cp('final');
  }
  async function boardOn(S) {
    const f = S.f, e = S.ent('c_board');
    if (e.s.open) return S.narr('地板底下空了，只剩一层两百年的灰。');
    if (!f.plate2) return S.narr('窗户底下有一块地板颜色深一点，两边的缝也宽一点。\n你踩了踩，它「咯」地响了一声。');
    await S.narr('你想起底片上那团跪着的白——它的手，就按在这块地板上。\n你用指甲抠住缝，把地板掀了起来。');
    e.s.open = true; S.give('ring'); f.ring = true;
    await S.narr('底下躺着一枚很小的金戒指，和一封折得只有指甲盖大的信。');
    await S.note('letter');
  }
  async function chestOn(S) {
    const f = S.f, a = f.act;
    if (f.expo) return S.narr('快门开着呢。别动。');
    if (a === 'final') return finalShot(S);
    if (a !== 'room') return S.narr(f.plate2 ? '床尾的木箱。箱盖上落着一层薄灰，中间有一块被相机压出来的干净的方印子。' : '床尾一只雕花的木箱，箱盖上落满了灰。');
    if (f.plate) { const r = await S.ask('折叠相机里那张还没冲。', ['换一块新底片，重拍', '先去冲']); if (r === 1) return; f.plate = null; }
    const l = await S.ask('你把折叠相机搁在箱盖上，镜头对着床头那面墙。\n屋里只有窗口那一小块月光。', ['点着油灯拍', '吹灭油灯，只借月光', '先不拍']);
    if (l === 2) return;
    const light = l === 0 ? 'rlamp' : 'rmoon';
    if (light === 'rmoon') { f.lampOut = true; lampPlr(S); S.sfx('switch'); }
    const v = await S.keypad(`曝光几秒？\n灯：${l === 0 ? '点着，就搁在相机旁边' : '吹灭了——只有窗口的月光'}`, KEYS, 1, { alias: AL });
    if (v == null) { if (f.lampOut) { f.lampOut = false; lampPlr(S); } return; }
    await S.narr('你拔下镜头盖，屏住气。');
    beginExpo(S, 'room', light, +v);
  }
  async function finalShot(S) {
    const f = S.f;
    const r = await S.ask('最后一张。\n她就站在画像前面，背对着你。', ['吹灭油灯，开长曝光', '点镁光，拍清她的脸', '先不拍']);
    if (r === 2) return;
    S.ent('c_chest').s.cam = true;
    if (r === 1) {
      await S.narr('你把镁粉倒进闪光槽，举高——\n「看清楚她」，你只想看清楚她。');
      SND.boom(S); S.fx('flash', { dur: 1.4 }); S.shake(900, 4); S.sfx('scream');
      S.ent('mkB').eyes = 'void';
      await S.wait(600);
      showPlate(S, 'pl_flash', 3); await S.wait(1600);
      return S.end({ bad: true, id: 'flash', title: '镁光一闪', text: '「砰」——\n一秒钟里，整间屋子白得像正午。她猛地转过身来。\n你看清了她的脸。那两个黑洞，也看清了你。\n\n歌声停了。\n\n天亮以后，那张底片冲出来是全白的，只有正中间两个挨得很近的小黑点。\n床头那幅画像，从此眼睛的地方是两个洞。\n佩尔太太说，夜里楼梯上的脚步声又响起来了——比从前更急，像是在找什么人。' });
    }
    S.ent('c_chest').s.open = true; SND.shutter(S);
    f.lampOut = true; S.plr(.7); S.dark(.97);
    await S.narr('你吹灭油灯，拔下镜头盖。\n屋里只剩窗口那一小块月光。你一动不动。');
    SND.hum(S);
    await S.wait(2600);
    await S.narr('歌声慢慢低下去。\n月光从栏杆缝里移过来，一寸一寸，爬上了床头。');
    await S.wait(1500);
    await S.narr(f.ringGiven ? '她抬起那只戴着戒指的手，搭在画框上。\n然后，她回过头来，看了你一眼。' : '她抬起一只手，搭在画框上。\n然后，她回过头来，看了你一眼。');
    await S.narr('只有一眼。\n那张脸上，有眼睛。');
    await S.fade(1, 1400);
    SND.shutter(S);
    await S.card('天亮', '', '你在暗房里守着红灯，冲出了最后一张。');
    await S.fade(0, 600);
    showPlate(S, f.ringGiven ? 'rm_finring' : 'rm_fin', 5); await S.wait(2400);
    const tail = '\n\n黑尔先生把楼梯那张底片带回了伦敦。那年冬天，它登在了画报上，后来又被印进无数本书里。人们争了几十年：是双重曝光，是镜头上的油，还是一个真的站在楼梯上的女人。\n\n床头那一张，你没有给任何人看。\n据说从那以后，雷纳姆庄园的楼梯上，就很少再有人见过那位穿棕色锦缎裙子的夫人了。';
    if (f.ringGiven) return S.end({ id: 'ring', title: '她的戒指', text: '底片上，床头挂着那幅画像。画像旁边，有一团很淡很淡的白——像一个人站在那儿，一只手搭在画框上。\n那只手的手指上，有一点小小的亮光。\n这一次，那张脸上有眼睛，嘴角有一点想笑的样子。' + tail });
    return S.end({ id: 'home', title: '挂回原处', text: '底片上，床头挂着那幅画像。画像旁边，有一团很淡很淡的白——像一个人站在那儿，一只手搭在画框上。\n这一次，那张脸上有眼睛。' + tail });
  }
})();
