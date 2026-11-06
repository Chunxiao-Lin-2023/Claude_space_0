/* ================= 第二十五夜 · 布包鬼（Pocong） ================= */
(() => {
  /* ---------- 小工具 ---------- */
  const cycle = (S, key, lines) => lines[(S.f[key] = ((S.f[key] ?? -1) + 1) % lines.length)];
  /* 死亡/警告计数写进当前检查点（S.f 会在重来时被检查点覆盖），用于重来后的提示 */
  function bumpCP(S, key) { if (W.cp && W.cp.f) W.cp.f[key] = (W.cp.f[key] || 0) + 1; }
  const tileAt = (x, y) => { const m = curMap(); return m ? tileName(m, x, y) : 'void'; };
  const dist = (e, x, y) => Math.abs(Math.round(e.px / TS) - x) + Math.abs(Math.round(e.py / TS) - y);

  /* ---------- 合成音 ---------- */
  /* 竹梆（kentongan）：空心竹筒「笃」的一声；titir = 连着敲，村里出事了 */
  const TOK = (S, v = 1, d = 0) => { const a = .08 * v; S.tone('square', 760, 640, .045, a * .55, d, 1500); S.tone('sine', 380, 330, .11, a, d); };
  const TITIR = (S, v = 1, n = 10) => { for (let i = 0; i < n; i++) TOK(S, v * (.8 + (i % 2) * .2), i * .13); };
  /* 落地：裹着布的脚闷闷地砸在泥里 */
  const HOP = (S, v = 1) => { const a = Math.max(.012, .15 * v); S.tone('sine', 82, 42, .22, a, 0, 480); S.tone('triangle', 150, 90, .07, a * .35, 0, 700); };
  /* 小礼拜堂的大鼓（beduk） */
  const BEDUK = (S, v = 1, d = 0) => { const a = .28 * v; S.tone('sine', 68, 48, 1.2, a, d, 360); S.tone('triangle', 112, 78, .45, a * .35, d, 600); S.tone('sawtooth', 54, 46, .3, a * .12, d, 240); };
  const RUSTLE = (S, v = 1) => { S.tone('sawtooth', 280, 220, .18, .014 * v, 0, 900); S.tone('sawtooth', 240, 200, .14, .01 * v, .08, 800); };
  const PING = S => { S.tone('sine', 1180, 1150, .14, .055); S.tone('sine', 590, 580, .3, .045, .02); };
  const LOCKC = S => { S.tone('square', 1900, 1750, .03, .045); S.tone('square', 1300, 1200, .04, .04, .07); };
  const HEART = (S, n = 2) => { for (let i = 0; i < n; i++) { S.tone('sine', 62, 50, .14, .16, i * .55); S.tone('sine', 58, 46, .12, .11, i * .55 + .17); } };
  const KNOCK2 = S => { S.tone('sine', 120, 70, .16, .2, 0, 500); S.tone('sine', 120, 70, .16, .2, .42, 500); };

  /* ---------- 人物 ---------- */
  const PECI = (g, d, fr, G, R) => { R(4, G.hT - 2, 8, 3, '#16141a'); R(4, G.hT - 2, 8, 1, '#2e2c36'); if (d === 1) R(4, G.hT - 2, 7, 3, '#16141a'); };
  const SARUNG = (c2) => (g, d, fr, G, R) => { if (d === 1) { R(4, G.tB + 1, 8, 1, c2); R(4, G.tB + 3, 6, 1, c2); } else { R(3, G.tB + 1, 10, 1, c2); for (let x = 4; x < 13; x += 3) R(x, G.tB, 1, 3, c2); } };
  const both = (...fs) => (g, d, fr, G, R) => fs.forEach(f => f(g, d, fr, G, R));
  const PEOPLE = {
    me: { key: 'pc-me', skin: '#c8946a', hair: '#1a1410', hs: 'short', top: '#ece8de', top2: '#c8c2b4', bottom: '#3a4a6a', skirt: true, shoes: '#2a2018', extra: both(PECI, SARUNG('#22304a')) },
    mbah: { key: 'pc-mbah', skin: '#b4865e', hair: '#cfcac0', hs: 'bun', top: '#6a4a5a', top2: '#4a3040', bottom: '#5a3a1e', skirt: true, shoes: '#3a2a1a', hat: 'veil', hatC: '#e6e0d2', extra: SARUNG('#7a5a2a') },
    modin: { key: 'pc-modin', skin: '#a87a52', hair: '#c8c4bc', hs: 'short', top: '#dcd6c4', top2: '#bab4a2', bottom: '#3a3a2a', skirt: true, shoes: '#2a2018',
      extra: both(PECI, SARUNG('#5a5a3a'), (g, d, fr, G, R) => { if (d === 0) { R(6, G.hT + 7, 4, 2, '#d8d4cc'); R(7, G.hT + 9, 2, 1, '#d8d4cc'); } else if (d === 1) R(4, G.hT + 6, 3, 2, '#d8d4cc'); }) },
    paklik: { key: 'pc-paklik', skin: '#b8865e', hair: '#1c1612', hs: 'short', top: '#7a4a24', top2: '#5a3418', bottom: '#2a2a2a', shoes: '#2a2018',
      extra(g, d, fr, G, R) { for (let i = 0; i < 3; i++) for (let j = 0; j < 2; j++) R(5 + i * 2 + (j % 2), G.tT + 2 + j * 3, 1, 1, '#d8b060'); } },
    tamu: { key: 'pc-tamu', skin: '#b07c54', hair: '#1a1410', hs: 'short', top: '#dcd8cc', bottom: '#4a3a2a', skirt: true, shoes: '#2a2018', extra: both(PECI, SARUNG('#3a2a1a')) },
    tamu2: { key: 'pc-tamu2', skin: '#9a6c48', hair: '#1a1410', hs: 'short', top: '#5a6a4a', bottom: '#2a3a4a', skirt: true, shoes: '#2a2018', extra: both(PECI, SARUNG('#1a2a3a')) },
    bowo: { key: 'pc-bowo', skin: '#a87650', hair: '#14100c', hs: 'short', top: '#3a4a3a', top2: '#2a362a', bottom: '#2a2a30', shoes: '#2a2018',
      extra(g, d, fr, G, R) { const c = '#8a2a2a'; if (d === 1) { R(4, G.tT - 1, 7, 3, c); R(8, G.tT + 2, 3, 4, c); } else { R(3, G.tT - 1, 10, 3, c); R(3, G.tT + 2, 2, 5, c); R(11, G.tT + 2, 2, 5, c); R(3, G.tT, 10, 1, '#b04a3a'); } } },
    yanto: { key: 'pc-yanto', skin: '#9a6a44', hair: '#8a867e', hs: 'short', top: '#4a4a5a', top2: '#34343e', bottom: '#3a3a2a', skirt: true, shoes: '#2a2018', hat: 'cap', hatC: '#2a2a2a', extra: SARUNG('#5a4a2a') },
    joko: { key: 'pc-joko', skin: '#a87650', hair: '#120e0a', hs: 'messy', top: '#cfc6aa', top2: '#b0a688', bottom: '#3a3a44', shoes: '#5a4a3a',
      extra(g, d, fr, G, R) { if (d === 0) { R(4, G.tT, 2, 1, '#a87650'); R(10, G.tT, 2, 1, '#a87650'); R(6, G.tT + 4, 3, 2, '#9a8a6a'); } } }
  };

  /* ---------- 惊吓大头像（32×32） ---------- */
  const FACES = {
    /* 门缝里看见的：白布从头顶裹到脚，头顶扎成一个结；布中间露出一张灰青的脸，两个黑窟窿一样的眼窝 */
    pocong(R, a) {
      const C = '#e8e6da', C2 = '#c4c1b2', T = '#7a776a', SK = '#8a907c', SK2 = '#6a7062', E = '#040404';
      R(13, 0, 6, 3, C); R(11, 0, 2, 2, C2); R(19, 0, 2, 2, C2); R(12, 3, 8, 1, T);   // 头顶的结
      R(5, 4, 22, 28, C); R(3, 8, 26, 24, C); R(24, 6, 3, 26, C2); R(3, 8, 2, 24, C2);
      for (let i = 0; i < 5; i++) R(6 + i * 4, 4 + (i % 2), 1, 4, C2);   // 布褶
      R(9, 8, 14, 17, SK); R(10, 7, 12, 1, SK); R(10, 25, 12, 1, SK); R(19, 9, 4, 16, SK2); R(9, 22, 14, 3, SK2);
      R(9, 8, 2, 3, C); R(21, 8, 2, 3, C); R(9, 23, 2, 2, C); R(21, 23, 2, 2, C);   // 布压着脸的边
      // 眼窝：深黑，眼皮青紫；a 大了以后，窟窿里亮起一粒针尖
      R(10, 12, 5, 5, '#3a3a40'); R(17, 12, 5, 5, '#3a3a40'); R(11, 13, 3, 3, E); R(18, 13, 3, 3, E);
      if (a > .35) { R(12, 14, 1, 1, '#e8f0d8'); R(19, 14, 1, 1, '#e8f0d8'); }
      R(15, 17, 2, 3, SK2); R(15, 19, 1, 1, '#2a2a26'); R(17, 19, 1, 1, '#2a2a26');
      const mh = 1 + Math.round(a * 2); R(13, 22, 6, mh, '#1a1412'); R(14, 22 + mh, 4, 1, SK2);
      R(3, 27, 26, 2, T); R(3, 30, 26, 1, T);   // 脖子上的绳
      R(6, 29, 4, 3, '#8a7a5a'); R(22, 30, 5, 2, '#8a7a5a');   // 泥
    },
    /* 被扑到时：脸贴到眼前，半边脸颊沾着坟土，眼白翻上来 */
    pocong2(R, a) {
      const C = '#e8e6da', C2 = '#c4c1b2', T = '#7a776a', SK = '#9a9e8c', SK2 = '#747a6a', DIRT = '#4a3a26';
      R(0, 0, 32, 32, C); R(0, 0, 4, 32, C2); R(28, 0, 4, 32, C2); R(10, 0, 12, 2, T);
      R(5, 3, 22, 27, SK); R(4, 6, 1, 20, SK); R(27, 6, 1, 20, SK); R(20, 4, 7, 25, SK2);
      R(4, 3, 3, 4, C); R(25, 3, 3, 4, C);
      R(5, 18, 7, 9, DIRT); R(6, 16, 4, 2, DIRT); R(7, 27, 4, 2, DIRT); R(9, 20, 2, 1, '#2a2016');   // 贴过土的那半边脸
      R(6, 8, 8, 7, '#2a2a30'); R(18, 8, 8, 7, '#2a2a30');
      if (a < .25) { R(7, 11, 6, 1, '#101010'); R(19, 11, 6, 1, '#101010'); }
      else { R(7, 9, 6, 5, '#ecebe0'); R(19, 9, 6, 5, '#ecebe0'); R(9, 9, 2, 1, '#141414'); R(21, 9, 2, 1, '#141414'); }
      R(15, 15, 2, 4, SK2); R(14, 18, 1, 1, '#1a1a18'); R(17, 18, 1, 1, '#1a1a18');
      const mh = 2 + Math.round(a * 4); R(11, 22, 10, mh, '#140c0c'); R(10, 23, 1, Math.max(1, mh - 2), '#140c0c'); R(21, 23, 1, Math.max(1, mh - 2), '#140c0c');
      R(0, 30, 32, 2, T);
    }
  };

  /* ---------- 自定义精灵 ---------- */
  const SPRITES = {
    /* 布包鬼：白布裹到脚，头顶扎结，身上一道道布绳；oy 是蹦起来的高度，影子留在地上 */
    pocong(g, e, t, R) {
      const C = '#e9e7dc', C2 = '#c6c3b4', T = '#86836f', MUD = '#6e5c40', O = '#24221e', SK = '#8e9482', SK2 = '#6e7466';
      const oy = e.oy || 0, sw = Math.max(5, 11 + oy);
      R(8 - sw / 2, 14 - oy, sw, 2, 'rgba(0,0,0,.38)');
      if (e.lie) {   // 躺下：横在坟头上
        R(-5, 7, 26, 8, O); R(-4, 8, 24, 6, C); R(-4, 13, 24, 1, C2); R(-8, 9, 4, 4, C); R(-9, 10, 2, 2, C2);
        for (const x of [-1, 4, 9, 14, 18]) R(x, 8, 1, 6, T);
        return;
      }
      // 轮廓
      R(6, -17, 4, 2, O); R(3, -14, 10, 12, O); R(2, -3, 12, 17, O); R(3, 14, 10, 2, O);
      // 头顶的结（第一道）
      R(7, -16, 2, 4, C); R(5, -17, 2, 2, C2); R(9, -17, 2, 2, C2); R(6, -13, 4, 1, T);
      // 头
      R(4, -13, 8, 10, C); R(10, -12, 2, 9, C2);
      // 身子
      R(3, -2, 10, 14, C); R(4, 12, 8, 2, C); R(11, -2, 2, 14, C2); R(5, 14, 6, 1, C2);
      // 绳：脖子、胸、腰、膝、踝，脚底一道收口——七道
      R(4, -3, 8, 1, T); for (const y of [1, 5, 9, 12]) R(3, y, 10, 1, T); R(6, 15, 4, 1, T);
      R(4, 13, 8, 1, MUD); R(3, 11, 2, 1, MUD); R(10, 12, 2, 1, MUD);
      // 脸
      const ey = e.alert ? '#ff4a3a' : '#dfe6d0';
      if (e.dir === 0) { R(5, -11, 6, 7, SK); R(9, -11, 2, 7, SK2); R(5, -11, 6, 1, SK2); R(5, -9, 2, 2, '#0a0a0c'); R(9, -9, 2, 2, '#0a0a0c'); R(6, -9, 1, 1, ey); R(9, -9, 1, 1, ey); R(7, -6, 2, 1, '#2a2a26'); }
      else if (e.dir === 1) { R(4, -11, 4, 7, SK); R(4, -9, 2, 2, '#0a0a0c'); R(4, -9, 1, 1, ey); R(4, -6, 2, 1, '#2a2a26'); R(3, -10, 1, 5, C); }
      else if (e.dir === 2) { R(8, -11, 4, 7, SK); R(10, -9, 2, 2, '#0a0a0c'); R(11, -9, 1, 1, ey); R(10, -6, 2, 1, '#2a2a26'); R(12, -10, 1, 5, C); }
      else { R(7, -12, 1, 24, C2); R(8, -12, 1, 24, '#d8d6ca'); }
    },
    /* 墙上的相框：外公戴着黑帽子，笑得眼睛眯成一条缝 */
    foto(g, e, t, R) {
      R(2, 1, 12, 13, '#3a2416'); R(3, 2, 10, 11, '#d8cfb4'); R(5, 4, 6, 6, '#a07850'); R(5, 3, 6, 2, '#16141a'); R(6, 6, 1, 1, '#2a1a10'); R(9, 6, 1, 1, '#2a1a10'); R(6, 8, 4, 1, '#6a4a30');
      R(4, 10, 8, 3, '#e8e2d2'); R(7, 10, 2, 3, '#c8c0aa'); R(6, 14, 4, 2, 'rgba(0,0,0,.25)');
    },
    /* 墙上的书法框：绿底金字（只是笔画的样子） */
    kaligrafi(g, e, t, R) {
      R(1, 2, 14, 11, '#4a3a1a'); R(2, 3, 12, 9, '#1e4a34'); const G = '#d8b44a';
      R(4, 5, 7, 1, G); R(10, 4, 1, 4, G); R(5, 7, 1, 3, G); R(5, 9, 6, 1, G); R(8, 6, 1, 2, G); R(12, 6, 1, 4, G); R(3, 8, 1, 1, G); R(7, 10, 1, 1, G);
    },
    /* 挂历：白纸，日期格子，底下一行小字是爪哇的五日周 */
    kalender(g, e, t, R) {
      R(3, 1, 10, 13, '#ece8dc'); R(3, 1, 10, 3, '#b02828'); R(7, 0, 2, 2, '#5a5a5a');
      for (let i = 0; i < 4; i++) for (let j = 0; j < 5; j++) R(4 + j * 2, 5 + i * 2, 1, 1, j === 0 ? '#b02828' : '#3a3a3a');
      R(4, 13, 8, 1, '#8a8a8a');
    },
    /* 竹编饭盒（besek）摞在一起：给客人带回家的 berkat */
    besek(g, e, t, R) {
      for (let i = 0; i < 3; i++) { const y = 10 - i * 4; R(2 + (i % 2), y, 12, 4, '#b89a5a'); R(2 + (i % 2), y, 12, 1, '#d4b878'); for (let x = 3; x < 14; x += 2) R(x + (i % 2), y + 1, 1, 3, '#9a7c42'); }
      R(2, 14, 13, 1, 'rgba(0,0,0,.3)');
    },
    /* 一摞绿皮的《雅辛章》小册子 */
    yasin(g, e, t, R) { for (let i = 0; i < 4; i++) { R(4 - (i % 2), 11 - i * 2, 9, 2, i % 2 ? '#2a6a3a' : '#1e5a30'); R(5 - (i % 2), 11 - i * 2, 7, 1, '#d8c060'); } },
    /* 墙上的煤油灯（teplok） */
    teplok(g, e, t, R) {
      R(6, 8, 4, 6, '#6a6a60'); R(5, 13, 6, 2, '#4a4a40'); R(7, 4, 2, 4, 'rgba(220,230,230,.5)'); R(6, 3, 4, 1, '#8a8a80');
      if (!e.off) { const f = Math.sin(t * 13 + e.x) > 0 ? 1 : 0; R(7, 5 + f, 2, 3 - f, '#ffb040'); R(7, 6, 2, 1, '#ffe8a0'); }
    },
    /* 土灶（tungku） */
    tungku(g, e, t, R) {
      R(1, 3, 14, 12, '#7a5038'); R(1, 3, 14, 2, '#8e6046'); R(3, 8, 4, 5, '#1a0c08'); R(9, 8, 4, 5, '#1a0c08');
      R(2, 0, 6, 4, '#2a2a2c'); R(9, 1, 5, 3, '#3a3a3a');
      if (!e.off) { const f = Math.sin(t * 9) > 0 ? 1 : 0; R(4, 10 + f, 2, 3 - f, '#ff8a2a'); R(10, 11, 2, 2, '#c84a1a'); }
    },
    /* 水缸（gentong）和水瓢 */
    gentong(g, e, t, R) { R(2, 3, 12, 12, '#8a5a3a'); R(1, 6, 14, 6, '#8a5a3a'); R(3, 3, 10, 2, '#2a3a44'); R(4, 3, 4, 1, '#4a6070'); R(2, 9, 12, 1, '#6a4028'); R(10, 1, 4, 2, '#c8a060'); R(12, 0, 1, 3, '#8a6a3a'); },
    /* 香蕉树 */
    pisang(g, e, t, R) {
      R(7, 2, 2, 13, '#6a7a3a'); R(8, 2, 1, 13, '#4a5a28');
      const s = Math.sin(t * 1.4 + e.x) * 1.2;
      R(-3 + s, -6, 9, 3, '#3a6a2a'); R(-5 + s, -4, 4, 2, '#2a5a20'); R(9 - s, -8, 9, 3, '#3a6a2a'); R(15 - s, -6, 4, 2, '#2a5a20');
      R(2, -12, 6, 3, '#4a7a30'); R(9, -13, 6, 3, '#447428'); R(6, -2, 4, 4, '#5a7a2a');
      R(4, 14, 9, 2, 'rgba(0,0,0,.3)');
    },
    /* 老式自行车 */
    sepeda(g, e, t, R) {
      const K = '#1a1a1a'; R(0, 8, 6, 6, K); R(1, 9, 4, 4, '#4a4a44'); R(10, 8, 6, 6, K); R(11, 9, 4, 4, '#4a4a44');
      R(3, 10, 10, 1, '#5a2a2a'); R(7, 5, 1, 6, '#5a2a2a'); R(5, 4, 4, 1, '#2a2a2a'); R(12, 4, 1, 6, '#5a2a2a'); R(11, 3, 3, 1, '#8a8a8a');
    },
    /* 竹梆（kentongan）：挂在岗亭柱子上的一截空心竹筒 */
    kentongan(g, e, t, R) { R(7, -6, 1, 6, '#3a2a1a'); R(5, 0, 6, 14, '#b89a5a'); R(5, 0, 6, 1, '#d4b878'); R(7, 3, 2, 8, '#2a1a0a'); R(10, 1, 1, 12, '#9a7c42'); R(12, 8, 3, 1, '#6a4a2a'); },
    /* 巡夜岗亭（pos ronda）：竹台子，铁皮顶，2×2 */
    posronda(g, e, t, R) {
      R(1, -10, 2, 40, '#4a3420'); R(29, -10, 2, 40, '#4a3420');
      R(-2, -16, 36, 7, '#6a6a68'); R(-2, -16, 36, 1, '#8a8a88'); for (let x = 0; x < 34; x += 4) R(x, -15, 1, 6, '#5a5a58');
      R(0, 12, 32, 6, '#b89a5a'); R(0, 12, 32, 1, '#d4b878'); for (let x = 2; x < 32; x += 3) R(x, 13, 1, 5, '#9a7c42');
      R(2, 18, 2, 12, '#4a3420'); R(28, 18, 2, 12, '#4a3420');
      R(6, 10, 7, 2, '#3a5a3a'); R(18, 8, 6, 4, '#2a2a2a'); R(19, 9, 4, 2, '#e8e0d0');   // 一盘没下完的多米诺、收音机
      R(8, 30, 18, 2, 'rgba(0,0,0,.35)');
    },
    /* 小礼拜堂门廊上的大鼓（beduk）：牛皮鼓面，木架 */
    beduk(g, e, t, R) {
      R(1, 6, 2, 9, '#4a3020'); R(13, 6, 2, 9, '#4a3020'); R(0, 5, 16, 2, '#5a3a24');
      R(2, -4, 12, 11, '#6a3a1e'); R(2, -4, 12, 1, '#8a5030'); R(3, -3, 2, 9, '#d8c49a'); R(3, -3, 1, 9, '#e8d8b0');
      for (let i = 0; i < 4; i++) R(6 + i * 2, -3, 1, 9, '#5a2e16');
      R(13, 2, 3, 1, '#3a2a1a'); R(15, 1, 1, 3, '#d8c49a');
    },
    /* 净身用的大水缸（padasan），带陶嘴 */
    padasan(g, e, t, R) { R(3, 2, 10, 10, '#8a5a3a'); R(4, 1, 8, 2, '#a06a44'); R(2, 6, 1, 3, '#6a4028'); R(0, 7, 3, 1, '#6a4028'); R(5, 12, 6, 3, '#6a4a3a'); if (Math.sin(t * 5) > .7) R(0, 9, 1, 2, 'rgba(170,200,220,.7)'); },
    /* 空屋门上：两块钉死的木板、一把挂着的挂锁 */
    papan(g, e, t, R) { R(1, 4, 14, 2, '#5a4026'); R(1, 10, 14, 2, '#5a4026'); R(2, 4, 1, 2, '#2a2a2a'); R(13, 10, 1, 2, '#2a2a2a'); },
    /* 饼干铁盒 + 挂锁 */
    kaleng(g, e, t, R) {
      R(1, 4, 14, 11, '#a82424'); R(1, 4, 14, 2, '#c84040'); R(3, 7, 10, 6, '#e8d8b0'); R(4, 8, 3, 4, '#5a3a2a'); R(8, 8, 2, 4, '#3a5a8a'); R(11, 9, 1, 3, '#a87a52');
      if (e.open) { R(0, 0, 16, 4, '#a82424'); R(1, 0, 14, 1, '#c84040'); R(3, 5, 10, 3, '#e8e4d8'); R(6, 5, 4, 2, '#d8d2c0'); return; }
      R(6, 12, 4, 4, '#c8a83a'); R(7, 10, 2, 3, '#8a8a88'); R(7, 13, 2, 1, '#5a4a1a');
      R(0, 9, 16, 1, '#8a8a88');   // 绕了一圈的铁丝
    },
    /* 供品（sesajen）：芭蕉叶上一撮花瓣，一小块安息香 */
    sesajen(g, e, t, R) {
      R(1, 9, 14, 5, '#3a6a2a'); R(2, 9, 12, 1, '#4a7a34');
      R(4, 9, 2, 2, '#e04050'); R(6, 8, 2, 2, '#f4f0e0'); R(9, 9, 2, 2, '#f0d050'); R(11, 10, 2, 1, '#e04050');
      R(7, 11, 3, 2, '#5a4030'); const k = (t * 6) % 10; R(8 + Math.sin(t * 2), 6 - k, 1, 2, 'rgba(210,210,210,.35)');
    },
    /* 竹床（amben），2×1 */
    amben(g, e, t, R) { R(0, 4, 32, 9, '#b89a5a'); R(0, 4, 32, 1, '#d4b878'); for (let x = 1; x < 32; x += 3) R(x, 5, 1, 8, '#9a7c42'); R(1, 13, 2, 3, '#6a4a2a'); R(29, 13, 2, 3, '#6a4a2a'); R(3, 5, 9, 4, '#7a6a5a'); R(20, 6, 8, 3, '#5a4a6a'); },
    /* 一副多米诺骨牌，摊在草席上 */
    domino(g, e, t, R) { R(0, 6, 16, 9, '#a08a5a'); for (let i = 0; i < 5; i++) { R(1 + i * 3, 8 + (i % 2), 2, 4, '#eeeae0'); R(1 + i * 3, 9 + (i % 2), 1, 1, '#1a1a1a'); R(2 + i * 3, 11 + (i % 2), 1, 1, '#1a1a1a'); } R(11, 7, 4, 2, '#e8e0c0'); },
    /* 坟头的木牌（新坟用的临时墓碑） */
    nisan(g, e, t, R) { R(5, -2, 6, 16, '#7a5a3a'); R(5, -2, 6, 1, '#9a7a52'); R(6, -4, 4, 2, '#7a5a3a'); R(7, -5, 2, 1, '#7a5a3a'); R(6, 3, 4, 1, '#3a2a1a'); R(6, 6, 4, 1, '#3a2a1a'); R(6, 9, 3, 1, '#3a2a1a'); R(4, 13, 8, 2, 'rgba(0,0,0,.35)'); if (e.s && e.s.tasbih) { R(4, 1, 1, 6, '#5a2a1a'); R(11, 1, 1, 6, '#5a2a1a'); R(5, 7, 6, 1, '#5a2a1a'); R(7, 8, 2, 2, '#3a1a10'); } },
    /* 插在新坟上的纸伞 */
    payung(g, e, t, R) { const s = Math.sin(t * 1.6) * .8; R(7, -6, 1, 21, '#4a3a2a'); R(0 + s, -12, 16, 3, '#e8e0c8'); R(2 + s, -14, 12, 2, '#d8d0b4'); R(5 + s, -15, 6, 1, '#c8c0a4'); for (let i = 0; i < 4; i++) R(1 + i * 4 + s, -9, 1, 2, '#b8b094'); R(5, 14, 6, 1, 'rgba(0,0,0,.3)'); },
    /* 陶水壶（kendi） */
    kendi(g, e, t, R) { R(4, 6, 8, 8, '#a8603a'); R(3, 8, 10, 4, '#a8603a'); R(6, 3, 4, 3, '#a8603a'); R(6, 2, 4, 1, '#c87a4a'); R(12, 7, 3, 2, '#8a4a2a'); R(5, 7, 2, 2, '#c87a4a'); R(4, 14, 8, 1, 'rgba(0,0,0,.3)'); },
    /* 新坟的土堆：撒满了玫瑰、茉莉、黄兰的花瓣（竖 1×2，画在最底层） */
    gundukan(g, e, t, R) {
      R(1, 0, 14, 32, '#4a3626'); R(2, 1, 12, 30, '#5a4230'); R(2, 1, 12, 2, '#6a4e38');
      const P = ['#d83a4a', '#f4f0e0', '#f0d050', '#e85a6a'];
      for (let i = 0; i < 22; i++) R(2 + ((hash(i, 3, 7) * 12) | 0), 2 + ((hash(i, 5, 7) * 28) | 0), 1, 1, P[i % 4]);
      if (e.open) { R(5, 4, 6, 8, '#2a1c12'); R(6, 5, 4, 6, '#160e08'); }   // 被挖开过又填回去的地方
    },
    /* 村里开基老人的墓亭（cungkup），3×2 */
    cungkup(g, e, t, R) {
      R(-2, -14, 52, 8, '#5a3a2a'); R(-2, -14, 52, 1, '#7a5a3a'); for (let x = 0; x < 48; x += 4) R(x, -13, 2, 7, '#4a2e20'); R(6, -18, 36, 4, '#4a2e20');
      R(1, -6, 2, 36, '#e8e4d8'); R(45, -6, 2, 36, '#e8e4d8'); R(4, 4, 40, 20, '#cfc8b4'); R(6, 6, 36, 16, '#bab29a');
      R(10, 8, 3, 10, '#e8e4d8'); R(35, 8, 3, 10, '#e8e4d8'); R(14, 12, 20, 4, '#9a9280');
      R(20, 18, 8, 6, 'rgba(0,0,0,.2)');
    },
    /* 打着结的布绳（放在铁盒里） */
    tali(g, e, t, R) { R(1, 10, 6, 1, '#d8d2c0'); R(9, 10, 6, 1, '#d8d2c0'); R(6, 8, 4, 4, '#c8c2b0'); R(7, 9, 2, 2, '#8a8474'); R(15, 9, 1, 3, '#a8a290'); }
  };

  /* ---------- 自定义瓦片 ---------- */
  const TILES = {
    /* 蒲草席（tikar），堂屋地上铺着 */
    tikar: { solid: false, paint(R, X, Y) { R(0, 0, 16, 16, '#b8a46a'); for (let y = 0; y < 16; y += 2) R(((y / 2) % 2) * 2, y, 16, 1, '#a8945a'); for (let x = 0; x < 16; x += 4) R(x, 0, 1, 16, '#c8b47a'); if (Y % 3 === 0) R(0, 7, 16, 2, '#9a3a2a'); } },
    /* 石阶：一级一级往上，雨水顺着台阶往下淌 */
    tangga: { solid: false, paint(R, X, Y) { R(0, 0, 16, 16, '#5e5a52'); for (let i = 0; i < 4; i++) { R(0, i * 4, 16, 3, shade('#7a766c', -i * .06)); R(0, i * 4 + 3, 16, 1, '#2e2c28'); } R(((hash(X, Y, 3) * 12) | 0) + 2, 6, 2, 1, 'rgba(150,180,200,.35)'); } },
    /* 减速坎（村里人叫它「睡着的警察」）：一道横在巷子里的水泥坎，刷着黄黑条 */
    polisi: { solid: false, paint(R, X, Y) { speck(R, '#6d6d70', ['#7a7a7d', '#5e5e61'], X, Y, 10, 3); R(0, 5, 16, 6, '#8a8a84'); for (let x = 0; x < 16; x += 6) { R(x, 5, 3, 6, '#c8a83a'); R(x + 3, 5, 3, 6, '#1e1e1e'); } R(0, 11, 16, 1, '#3a3a38'); R(0, 4, 16, 1, '#a8a8a2'); } },
    /* 竹林 */
    bambu: { solid: true, paint(R, X, Y) { R(0, 0, 16, 16, '#0e1a12'); for (let i = 0; i < 4; i++) { const x = ((hash(X, Y, i) * 13) | 0); R(x, 0, 2, 16, i % 2 ? '#4a6a34' : '#3a5a2a'); R(x, ((hash(X, Y, i + 9) * 12) | 0), 2, 1, '#22341a'); } R(((hash(Y, X, 4) * 12) | 0), 3, 4, 2, '#2c4a22'); R(((hash(Y, X, 5) * 12) | 0), 10, 4, 2, '#2c4a22'); } },
    /* 稻田（雨季，田里汪着水） */
    padi: { solid: true, paint(R, X, Y) { R(0, 0, 16, 16, '#1e3a3a'); for (let i = 0; i < 6; i++) { const x = (i * 3 + (Y % 2) * 2) % 16, y = ((hash(X, Y, i) * 12) | 0) + 1; R(x, y, 1, 4, '#4a7a34'); R(x + 1, y - 1, 1, 2, '#5a8a40'); } if (hash(X, Y, 8) < .3) R(((hash(X, Y, 9) * 12) | 0), 12, 4, 1, '#2e5050'); } },
    /* 香蕉丛（实心，作地图隔断） */
    pisangT: { solid: true, paint(R, X, Y, m) { TILE.grass.paint(R, X, Y, m); R(7, 6, 2, 10, '#6a7a3a'); R(0, 2, 8, 3, '#3a6a2a'); R(8, 0, 8, 3, '#447428'); R(2, 6, 5, 2, '#2a5a20'); R(9, 5, 6, 2, '#2a5a20'); R(3, 14, 10, 2, 'rgba(0,0,0,.3)'); } },
    /* 老坟：水泥砌的长方台子，头脚各一块石碑（竖两格：A 头 / V 脚） */
    kuburA: { solid: true, paint(R, X, Y, m) { TILE.grass.paint(R, X, Y, m); R(2, 4, 12, 12, '#8a867a'); R(3, 5, 10, 11, '#a09c8e'); R(5, 0, 6, 8, '#c8c4b4'); R(5, 0, 6, 1, '#e0dccc'); R(6, -1, 4, 1, '#c8c4b4'); R(7, 3, 2, 1, '#6a665a'); R(6, 5, 4, 1, '#6a665a'); } },
    kuburV: { solid: true, paint(R, X, Y, m) { TILE.grass.paint(R, X, Y, m); R(2, 0, 12, 12, '#8a867a'); R(3, 0, 10, 11, '#a09c8e'); R(5, 8, 6, 6, '#c8c4b4'); R(5, 8, 6, 1, '#e0dccc'); R(2, 12, 12, 2, 'rgba(0,0,0,.3)'); if (hash(X, Y, 2) < .5) { R(5, 3, 1, 1, '#d83a4a'); R(9, 5, 1, 1, '#f0d050'); } } },
    /* 鸡蛋花树（kamboja）：坟地里总种着它，白花黄心 */
    kamboja: { solid: true, paint(R, X, Y, m) { TILE.grass.paint(R, X, Y, m); R(7, 6, 3, 10, '#5a4a3a'); R(4, 8, 3, 2, '#5a4a3a'); R(10, 7, 3, 2, '#5a4a3a'); R(1, 1, 14, 8, '#2a4a2a'); R(3, 0, 10, 2, '#345a30'); for (let i = 0; i < 5; i++) { const x = 2 + ((hash(X, Y, i) * 11) | 0), y = 1 + ((hash(Y, X, i) * 6) | 0); R(x, y, 2, 2, '#f4f2ea'); R(x, y, 1, 1, '#f0d050'); } } }
  };

  /* ---------- 物品与笔记 ---------- */
  const ITEMS = {
    senter: { name: '手电筒', desc: '舅舅塞给你的铁皮手电筒，电池快没电了，光是黄的。拍一下，亮一点。' },
    tasbih: { name: '外公的念珠', desc: '三十三颗木头珠子，被手指磨得发亮。外公每天晨礼前，坐在小礼拜堂的门廊上一颗一颗地数。' },
    tali: { name: '打着结的布绳', desc: '一截发黄的白布绳，一头是刀割的齐口。正中间打着一个死结，湿了又干，硬得像一块骨头。\n攥在手里，它比雨水还凉。' }
  };
  const NOTES = {
    undangan: { title: '四十日祷念的请帖', text: '（一张油印的小请帖，边上沾了一圈饭粒）\n\n奉至仁至慈的真主之名\n\n敬请乡亲父老于\n　　2003 年 1 月 6 日　星期一晚\n　　（即 Selasa Pon 夜）宵礼之后\n莅临寒舍，为先父　卡西姆　诵读《雅辛章》，\n举行四十日祷念（tahlilan）。\n\n　　　　　　　　　　　　子女　敬邀\n\n（背面有人用圆珠笔记着：第三日、第七日、第四十日、第一百日、第一千日。前三个已经打了勾。）' },
    kalender: { title: '挂历背面的历书', text: '（外公的挂历。每个日期底下都印着一行小字：Legi、Pahing、Pon、Wage、Kliwon——爪哇的五日周。1 月 6 日底下印的是 Pahing。翻到背面，是外公用铅笔抄的一张表）\n\n　五日周　Legi 5　Pahing 9　Pon 7　Wage 4　Kliwon 8\n　七日周　星期日 5　星期一 4　星期二 3　星期三 7\n　　　　　星期四 8　星期五 6　星期六 9\n\n　一个日子的 neptu ＝ 七日周的数 ＋ 五日周的数\n\n　※ 日头一落，就算第二天。\n　　星期四晚上叫「星期五夜」（malam Jumat），\n　　neptu 照第二天的星期和五日周算。\n\n（最底下一行，铅笔写得重：「Jumat Kliwon 夜，莫出门。」）' },
    modin: { title: '莫丁老伯的殡葬簿', text: '（一本卷了边的硬皮本子。每一页一个名字，后面跟着同样的几行）\n\n净身　　已\n裹布　　白布三层，七道绳\n　　　　（头顶、颈、胸、腰、膝、踝、脚底）\n礼拜　　已（小礼拜堂）\n入土　　面朝天房（qibla），解开七道绳，\n　　　　让脸颊贴着土\n\n卡西姆　七十一岁　2002 年 11 月 28 日（星期四）\n解绳：一、二、三、四、五、六——\n\n（第七个字没有写。那一行被水洇开了，墨迹往下淌，像一道泪痕。）' },
    joko: { title: '乔科的小本子', text: '（油腻腻的小本子。前半本全是数字：押的号、欠的钱、谁谁谁的名字。后半本，字越写越大）\n\n邻村那个巫医说的，我记下来——\n一、要 Jumat Kliwon 夜去挖。\n二、要没解开的结。（莫丁老头自己在岗亭里说的：头顶那道没解。）\n三、割下来，结一下也不能动。\n四、到第四十夜天亮，它就归你。你要什么号，它给你什么号。\n\n12 月 19 日，礼拜四晚上。去了。\n\n饼干盒的锁我换了号，四位。\n前两位：我挖它那一夜的 neptu。\n后两位：它归我那一夜的 neptu。\n——天天开锁，天天记着：我欠它的，它欠我的。' }
  };
  const LEGEND = '「Pocong」（布包鬼）是印度尼西亚，尤其是爪哇一带流传最广的鬼怪之一。名字来自裹尸的方式：按当地穆斯林的葬俗，亡者净身后用白色的裹尸布（kain kafan）从头裹到脚，在头顶、脖子、脚底等几处用布绳扎住；下葬时，要把这些绳结一一解开，让亡者侧身面朝天房（qibla），脸颊贴着泥土。传说如果绳结忘了解，亡者的魂就被拴在身上，裹着白布从坟里出来——因为双脚被扎在一起，它只能一蹦一蹦地走，来找人替它把结解开。\n\n关于它的说法很多，彼此并不一致：有的说它脸色灰白、眼窝发黑，有的说它会滚、会飘；不少故事里它并不伤人，只是吓人。「四十天」来自爪哇人的丧葬习俗——人去世后的第三、七、四十、一百、一千天都要请乡亲来家里诵经祷念（tahlilan），民间有一种说法是，亡者的魂在头四十天里还会在家附近停留，所以布包鬼常被说成「在四十天内回来」。另一个流传很广的说法是「布包鬼的绳子」（tali pocong）：据说有人深夜去新坟偷绳结，当作赌博、隐身之类的护身符，尤其要死在特定日子的人身上的。这类传闻常见于报纸社会版和恐怖片，查无实据。\n\n「neptu」和「Jumat Kliwon 夜」是爪哇历法里真实的说法：爪哇人在七日的星期之外，还用 Legi、Pahing、Pon、Wage、Kliwon 五日一轮的「pasaran」，两者合起来三十五天一个周期，每个日子都有一个数（neptu），算婚期、算运势都用它。爪哇人从日落起算新的一天，所以「星期五夜」指的是星期四晚上；Jumat Kliwon 夜被看作阴气最重的夜晚。布包鬼也是印尼恐怖电影里的常客；据报道，2020 年疫情期间，中爪哇有村子让志愿者扮成布包鬼夜里巡逻，劝村民待在家里。\n\n（本章中的卡西姆一家、莫丁老伯、乔科和巡夜的人，「第四十夜天亮前必须解开」的规矩，用两个 neptu 拼成的锁号，以及布包鬼「直线越蹦越快、转身慢、遇坎要停」的蹦法，均为游戏虚构；裹尸、解绳、四十日祷念、竹梆示警、晨礼前击鼓等，据爪哇乡村的习俗改编。）';

  /* ---------- 地图 ---------- */
  const MAPS = () => ({
    /* ---------------- 外公家 ---------------- */
    rumah: {
      amb: 'rain', dark: .3, plr: 3.2, wall: 'plain', floor: 'tile',
      wallC: { face: '#a8a08a', top: '#3a2420' },
      tileOpts: { tileC: '#b8ae94', woodC: '#6a4a30', grassC: '#2a4228', fenceBase: 'grass' },
      legend: { M: 'tikar' },
      rows: [
        '########################',
        '########################',
        '#wwww#+++++++++++#ddddd#',
        '#wwww#+MMMMMMMMM+#ddddd#',
        '#wwww#+MMMMMMMMM+#ddddd#',
        '#wwww++MMMMMMMMM++ddddd#',
        '#wwww#+MMMMMMMMM+#ddddd#',
        '#wwww#+++++++++++#ddddd#',
        '######+++++++++++#ddddd#',
        '##########++############',
        '""""""""""kk""""""""""""',
        '""""""""""kk""""""""""""',
        '""""""""""kk""""""""""""',
        '""""""""""kk""""""""""""',
        'ffffffffffkkffffffffffff'],
      ents: [
        { x: 10, y: 14, spr: 'invisible', touch: S => rumahExit(S) },
        { x: 11, y: 14, spr: 'invisible', touch: S => rumahExit(S) },
        /* 外公的房间 */
        { x: 2, y: 1, spr: 'window', on: S => S.narr('窗外是后院的芭蕉。雨点打在芭蕉叶上，噼噼啪啪，像有人在叶子底下拍手。') },
        { x: 1, y: 2, h: 2, spr: 'bed', col: '#5a6a4a', on: S => S.narr('外公的木床，挂着一顶打了补丁的白蚊帐。\n枕头上还留着一个浅浅的坑。外婆这四十天，一直睡在厨房边的竹床上。') },
        { x: 3, y: 2, spr: 'shelf', on: S => S.narr('小木架最上层，一本《古兰经》用绿绒布包着，摆得端端正正。\n外婆每天早上都要用干净的布擦一遍。') },
        { x: 4, y: 2, spr: 'wardrobe', on: S => S.narr('衣柜里挂着外公的几件白衬衫，一顶黑绒帽（peci）搁在最上面。\n衬衫的口袋里，还插着一支没水的圆珠笔。') },
        { x: 1, y: 7, spr: 'shoes', col: '#4a3a2a', on: S => S.narr('床边摆着一双磨平了跟的皮拖鞋。\n外公每天凌晨三点多穿上它，啪嗒啪嗒地走去小礼拜堂。') },
        { x: 4, y: 7, spr: 'cushion', col: '#2a5a3a', on: S => S.narr('一块卷起来的绿色礼拜毯，边上的穗子被磨掉了一半。') },
        /* 堂屋 */
        { id: 'bulb', x: 11, y: 4, spr: 'invisible', solid: false, light: { r: 6.5, col: 'rgba(255,236,190,.18)' } },
        { x: 7, y: 1, spr: 'window', on: S => S.narr(S.f.ph === 'eve' ? '窗外，雨帘后面，邻居家的电灯一盏一盏亮着。' : '窗外黑透了。雨声里，远远地，好像有什么东西「咚」了一下。') },
        { x: 9, y: 1, spr: 'wallclock', on: S => S.narr('挂钟的指针指着十点二十。钟摆一下一下地晃，和雨声对不上拍子。') },
        { id: 'foto', x: 11, y: 1, spr: 'foto', on: S => S.narr('外公的照片。黑绒帽，白衬衫，笑得眼睛眯成一条缝。\n照片底下贴着一张小纸条：卡西姆，1931—2002。') },
        { x: 13, y: 1, spr: 'kaligrafi', on: S => S.narr('一幅绿底金字的书法，是外公年轻时从城里请回来的。\n他不识几个阿拉伯字，可每天出门前都要对着它站一会儿。') },
        { id: 'kalender', x: 15, y: 1, spr: 'kalender', async on(S) { if (S.once('kal')) await S.narr('一本印着清真寺照片的挂历，还停在一月。\n每个日期底下都印着一行小字。背面好像写着什么。'); S.f.rdKal = true; await S.note('kalender'); } },
        { x: 6, y: 7, spr: 'lowtable', col: '#5a3a24' },
        { id: 'undangan', x: 6, y: 7, spr: 'paper', async on(S) { S.f.rdUnd = true; await S.note('undangan'); } },
        { id: 'tep1', x: 16, y: 2, spr: 'teplok', hidden: true, light: { r: 3.6, col: 'rgba(255,170,80,.22)', flick: true }, on: S => S.narr('一盏铁皮煤油灯。火苗被门缝里的风吹得东倒西歪。') },
        { x: 16, y: 4, spr: 'besek', on: S => S.narr('一摞竹编的饭盒（besek），里面是黄姜饭、炸鸡和一小块甜糕。\n念完经，每位客人提一盒回家——这叫 berkat。还剩三盒。') },
        { x: 12, y: 3, spr: 'yasin', solid: false, on: S => S.narr('一摞绿皮的小册子，封面印着金字：《雅辛章》。\n今晚屋里坐满了人，一起念了三遍。') },
        { x: 9, y: 6, spr: 'cup', full: true, on: S => S.narr('一杯没喝完的甜茶，已经凉了。杯底沉着一层茶叶末。') },
        { x: 13, y: 7, spr: 'cup', on: S => S.narr('空茶杯，杯沿上还沾着一点糖。') },
        { id: 'modin', x: 8, y: 4, spr: '@modin', dir: 2, on: S => modinOn(S) },
        { id: 'paklik', x: 14, y: 6, spr: '@paklik', dir: 1, on: S => paklikOn(S) },
        { id: 'tamu1', x: 10, y: 8, spr: '@tamu', dir: 0 },
        { id: 'tamu2', x: 12, y: 8, spr: '@tamu2', dir: 0 },
        /* 厨房 */
        { id: 'backdoor', x: 20, y: 1, spr: 'door', on: S => backDoorOn(S) },
        { x: 22, y: 1, spr: 'window', on: S => S.narr(S.f.ph === 'eve' ? '厨房的小窗对着后院。窗台上晾着一排洗干净的竹篾饭盒。' : '小窗外面黑漆漆的。窗纸上，有一道水痕慢慢往下淌。') },
        { id: 'tungku', x: 18, y: 2, spr: 'tungku', light: { r: 2.2, col: 'rgba(255,130,60,.16)', flick: true }, on: S => S.narr('土灶里的柴火还没熄，锅里温着一锅姜茶。\n灶台边上，摞着今晚用过的几十只碗。') },
        { x: 19, y: 2, spr: 'shelf', on: S => S.narr('碗架上倒扣着一排搪瓷碗，碗底印着一圈褪色的蓝花。') },
        { x: 22, y: 3, spr: 'gentong', on: S => S.narr('一口大水缸，水面上漂着一只椰壳做的水瓢。\n水是井里打的，凉得扎手。') },
        { x: 22, y: 6, spr: 'basket', on: S => S.narr('一竹筐生米。外婆说，明天要给帮忙的邻居每家送一斤。') },
        { x: 18, y: 7, spr: 'chair', col: '#6a4a2a', on: S => S.narr('一张矮竹凳。外婆洗碗的时候就坐在上面，一坐就是一晚上。') },
        { id: 'mbah', x: 20, y: 5, spr: '@mbah', dir: 0, on: S => mbahOn(S) },
        /* 前院 */
        { id: 'facewin', x: 14, y: 9, spr: 'window', lit: true, on: S => S.narr('堂屋的窗户。从院子里看，屋里' + (S.f.ph === 'eve' ? '的灯光暖黄暖黄的。' : '只剩一点煤油灯的光，一跳一跳。')) },
        { x: 8, y: 9, spr: 'teplok', off: true, on: S => S.narr('屋檐下挂着一盏煤油灯，平时停电才点。灯罩上落了一层灰。') },
        { x: 3, y: 12, spr: 'well', on: S => S.narr('院子里的老井，井沿上长着青苔。\n外公说，这口井是他爷爷那一辈挖的。四十天前，他的净身水就是从这里打上来的。') },
        { x: 1, y: 10, spr: 'pisang', on: S => S.narr('一丛芭蕉。叶子被雨打得耷拉着，一串青芭蕉还没熟。') },
        { x: 21, y: 12, spr: 'pisang', on: S => S.narr('芭蕉叶下面黑乎乎的，雨水顺着叶子尖一滴一滴往下落。') },
        { x: 18, y: 10, spr: 'sepeda', on: S => S.narr('外公的老自行车，车把上挂着一只装鼓槌的布袋。\n链条已经锈住了。') },
        { id: 'pc_r', x: 22, y: 11, spr: 'pocong', hidden: true, solid: false, s: { hop: 1 }, light: { r: 1.8, col: 'rgba(225,230,215,.14)' } }
      ],
      enter: (S, first) => rumahEnter(S, first)
    },
    /* ---------------- 村子 ---------------- */
    kampung: {
      amb: 'rain', dark: .86, plr: 3.4, wall: 'plain', floor: 'concrete', rain: true, fog: .15,
      wallC: { face: '#8e887a', top: '#2e1e1a' },
      tileOpts: { grassC: '#22382a' },
      legend: { B: 'bambu', S: 'tangga', Y: 'polisi', Q: 'padi', N: 'pisangT', k: 'stone' },
      rows: [
        'BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBddBB',
        'BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBddBB',
        '~eBBBBBBBBBBBBBBBB######BBBBBBddBB',
        '~e############x###############ddBB',
        '~e############x###kkkkkk######ddBB',
        '~e###########xxxxxxxxYxxxxYxxxxxBB',
        '~e#############xx############x###B',
        '~e########x####xx##N#########S###B',
        '~e########x####xx############x###B',
        '~e########x##N#xx###xxxxxxxxxx###B',
        '~e########x####xx########S#####N#B',
        '~edddddd##x####xx######N#S#####N#B',
        '~eddddddxxxYxxxxx###NN###x#######B',
        '~ex############xx########xxxxxxx#B',
        '~ex#N###N######xx###########x####B',
        '~ex#########xxxxx#####N#####x####B',
        '~ex###x########xxdddd#######S#N##B',
        '~ex###x#####N##xxdddd#######S##N#B',
        '~ex###x########xxdddd#######x####B',
        '~exxxxxxxYxxxxxxxxxxxxYxxxxxxxxx#B',
        '~exxxxxxxYxxxxxxxxxxxxYxxxxxxxxx#B',
        '~NNkkNQQQQQQQQQQQQQQQQQQQQQQQQQQNB',
        '~QQkkQQQQQQQQQQQQQQQQQQQQQQQQQQQQB',
        '~QQkkQQQQQQQQQQQQQQQQQQQQQQQQQQQQB'],
      ents: [
        { x: 30, y: 0, spr: 'invisible', touch: S => toMakam(S) },
        { x: 31, y: 0, spr: 'invisible', touch: S => toMakam(S) },
        { x: 3, y: 23, spr: 'invisible', touch: S => toRumah(S) },
        { x: 4, y: 23, spr: 'invisible', touch: S => toRumah(S) },
        /* 乔科家 */
        { id: 'jdoor', x: 4, y: 10, spr: 'door', on: S => jdoorOn(S) },
        { x: 6, y: 10, spr: 'window', on: S => S.narr('竹屋的窗户用一块塑料布钉着，布上破了个洞，风从洞里呜呜地往里灌。') },
        { x: 2, y: 11, spr: 'invisible', solid: false, on: S => S.narr('院子尽头就是河。河水涨了，黄浊浊的，卷着芦苇往下游冲。') },
        { x: 7, y: 11, spr: 'crate', on: S => S.narr('一只装过鸡的竹笼，空的。笼底粘着几根湿漉漉的鸡毛。') },
        /* 空屋 */
        { id: 'kdoor', x: 10, y: 18, spr: 'door', open: true, light: { r: 1.6, col: 'rgba(255,170,80,.18)', flick: true }, on: S => kdoorOn(S) },
        { x: 12, y: 18, spr: 'papan', on: S => S.narr('空屋的窗户钉着两块木板。木板缝里，漏出一点煤油灯的光。') },
        /* 巡夜岗亭 */
        { id: 'posronda', x: 18, y: 16, w: 2, h: 2, spr: 'posronda', light: { r: 3.4, dx: 8, dy: 8, col: 'rgba(255,170,80,.22)', flick: true }, on: S => S.narr('巡夜岗亭。竹台子上摊着一盘没下完的多米诺骨牌，一台收音机沙沙地响，什么台也收不到。') },
        { x: 17, y: 16, spr: 'kentongan', on: S => S.narr('岗亭柱子上挂着一截空心竹筒——竹梆（kentongan）。\n敲一下是报时，慢慢地敲是有人去世，连着敲个不停——是出事了。') },
        { id: 'bowo', x: 17, y: 17, spr: '@bowo', dir: 2, on: S => bowoOn(S) },
        { id: 'yanto', x: 20, y: 17, spr: '@yanto', dir: 1, on: S => yantoOn(S) },
        { id: 'joko', x: 19, y: 18, spr: '@joko', dir: 0, on: S => jokoOn(S) },
        /* 小礼拜堂 */
        { id: 'ldoor', x: 21, y: 3, spr: 'door', locked: true, on: S => S.narr('小礼拜堂（langgar）的门锁着。门边钉着一块木牌：「晨礼　四点十分」。\n外公以前每天天不亮就来开这扇门。') },
        { x: 19, y: 4, spr: 'beduk', on: S => S.narr('门廊上架着一面大鼓（beduk），鼓面是整张牛皮，被鼓槌敲出了一圈发白的印子。\n每天晨礼之前，先敲鼓，再唤拜。外公敲了三十年。') },
        { x: 23, y: 4, spr: 'padasan', on: S => S.narr('净身用的大陶缸，缸嘴底下的石板被水滴出了一个小坑。') },
        { x: 18, y: 3, spr: 'window', on: S => S.narr('小礼拜堂的窗户黑着。窗台上放着一盏熄了的油灯。') },
        /* 路上的东西 */
        { x: 27, y: 18, spr: 'sign', col: '#4a3a2a', on: S => S.narr('一块手写的木牌，箭头朝着北边的石阶：\n「往坟地　走东头石阶」') },
        { x: 13, y: 5, spr: 'barrel', on: S => S.narr('一只接雨水的铁桶，早就满了，水哗哗地从桶沿往外溢。') },
        { x: 14, y: 3, spr: 'crate', on: S => S.narr('死胡同。墙角堆着几只破竹筐，里面是发了芽的椰子。') },
        { x: 10, y: 7, spr: 'gentong', on: S => S.narr('死胡同的尽头，一口没盖的水缸，水面上漂着一层鸡蛋花。') },
        { x: 6, y: 16, spr: 'sepeda', on: S => S.narr('一辆没有轮胎的旧三轮车，锁在墙根上，锈得看不出颜色了。') },
        { x: 12, y: 15, spr: 'basket', on: S => S.narr('一筐晒干的木薯片，盖着塑料布。塑料布被风掀开一角，木薯片全泡软了。') },
        { x: 24, y: 9, spr: 'crate', on: S => S.narr('巷子到头了。几只鸡缩在竹笼里，一声不吭。') },
        { x: 31, y: 13, spr: 'sack', on: S => S.narr('一袋水泥，被雨淋成了一块石头。') },
        { x: 12, y: 11, spr: 'teplok', light: { r: 2.2, col: 'rgba(255,170,80,.18)', flick: true }, on: S => S.narr('谁家屋檐下点着一盏煤油灯。窗户里，有人撩开帘子看了你一眼，又放下了。') },
        { x: 24, y: 18, spr: 'teplok', light: { r: 2.2, col: 'rgba(255,170,80,.18)', flick: true }, on: S => S.narr('屋檐下的煤油灯。门关得死死的，门缝里塞着一条湿毛巾。') },
        { x: 27, y: 12, spr: 'teplok', light: { r: 2, col: 'rgba(255,170,80,.16)', flick: true }, on: S => S.narr('石阶巷里的一盏煤油灯，玻璃罩裂了一道缝。') },
        { x: 6, y: 15, spr: 'teplok', off: true, on: S => S.narr('一盏熄了的煤油灯。这家人好像搬走很久了。') },
        { x: 9, y: 20, spr: 'puddle', decal: true },
        { x: 20, y: 12, spr: 'puddle', decal: true },
        { x: 16, y: 9, spr: 'puddle', decal: true },
        { x: 26, y: 5, spr: 'puddle', decal: true },
        /* 布包鬼 */
        { id: 'pc', x: 15, y: 12, dir: 1, spr: 'pocong', hidden: true, solid: false, s: { hop: 1 }, light: { r: 1.9, col: 'rgba(225,230,215,.16)' } }
      ],
      enter: (S, first) => kampungEnter(S, first),
      step: (S, x, y) => kampungStep(S, x, y)
    },
    /* ---------------- 乔科的竹屋 ---------------- */
    gubuk: {
      amb: 'rain', dark: .78, plr: 3, wall: 'wood', floor: 'dirt',
      wallC: { face: '#8a7444', top: '#22180e' },
      rows: [
        '###########',
        '###########',
        '#ddddddddd#',
        '#ddddddddd#',
        '#ddddddddd#',
        '#ddddddddd#',
        '#ddddddddd#',
        '#####d#####'],
      ents: [
        { x: 5, y: 7, spr: 'invisible', touch: S => gubukExit(S) },
        { x: 1, y: 2, w: 2, spr: 'amben', on: S => S.narr('一张竹床，铺着一床发黑的草席。\n枕头底下压着一沓揉皱的彩票存根，每一张都没中。') },
        { id: 'kaleng', x: 8, y: 3, spr: 'kaleng', on: S => kalengOn(S) },
        { x: 2, y: 5, spr: 'lowtable', col: '#5a4a32' },
        { id: 'buku', x: 2, y: 5, spr: 'book', col: '#5a4a2a', async on(S) { S.f.rdJoko = true; await S.note('joko'); } },
        { x: 5, y: 4, spr: 'domino', solid: false, on: S => S.narr('一副多米诺骨牌摊在草席上，摆成了一个「十」字。\n其中一张被人用烟头烫了个洞。') },
        { x: 9, y: 2, spr: 'sesajen', on: S => S.narr('墙角放着一份供品：芭蕉叶上一撮花瓣，一小块烧过的安息香（kemenyan）。\n是那个巫医让他摆的吧。花瓣已经烂了。') },
        { x: 3, y: 1, spr: 'window', on: S => S.narr('塑料布钉的窗户。外面的雨，一阵紧一阵慢。') },
        { x: 6, y: 1, spr: 'poster', col: '#c8b880', on: S => S.narr('墙上贴着一张发黄的「梦号对照表」：\n梦见蛇——号码多少，梦见死人——号码多少，梦见白衣人——号码多少……\n「白衣人」那一格，被红笔圈了好几圈。') },
        { x: 8, y: 1, spr: 'teplok', off: true, on: S => S.narr('一盏没油的煤油灯。灯芯烧成了一小截黑炭。') },
        { x: 9, y: 6, spr: 'barrel', on: S => S.narr('一只铁皮桶，里面泡着几件没洗的衣服，水面上漂着一层泡沫。') }
      ],
      enter: (S, first) => gubukEnter(S, first)
    },
    /* ---------------- 坟地 ---------------- */
    makam: {
      amb: 'rain', dark: .8, plr: 3.4, wall: 'brick', floor: 'grass', rain: true, fog: .25,
      wallC: { face: '#6a4a3a', top: '#1e1612' },
      tileOpts: { grassC: '#24382a' },
      legend: { B: 'bambu', A: 'kuburA', V: 'kuburV', K: 'kamboja' },
      rows: [
        '##########################',
        '##########################',
        'B""A"A"A""""""""A"A"K""""B',
        'B""V"V"V""""""""V"V""""""B',
        'B""""""""""""""""""""""""B',
        'BK"""""""""""""""""""""K"B',
        'B""""""""""""""""""""""""B',
        'B""A""A"A""""""""A"A""A""B',
        'B""V""V"V"K""""""V"V""V""B',
        'BK"""""""""""""""""""""""B',
        'B""""A""A""""""A""A""A"""B',
        'B""""V""V""""""V""V""V"""B',
        'B"dd""""""""""K""""""""K"B',
        'B"dd"""""K"""""""""""""""B',
        'B"dd"""""""""""""""""""""B',
        'BBddBBBBBBBBBBBBBBBBBBBBBB'],
      ents: [
        { x: 2, y: 15, spr: 'invisible', touch: S => makamExit(S) },
        { x: 3, y: 15, spr: 'invisible', touch: S => makamExit(S) },
        { x: 21, y: 2, w: 3, h: 2, spr: 'cungkup', on: S => S.narr('开村老人的墓亭，白墙，瓦顶。\n每年斋月前，全村人都要来这里扫墓、撒花。') },
        { x: 12, y: 5, h: 2, spr: 'gundukan', decal: true, open: true, on: S => S.f.ph === 'grave' ? nisanOn(S) : S.narr('外公的新坟。土还是新的，撒满了玫瑰、茉莉和黄兰的花瓣。\n坟头靠近木牌的地方，有一块土的颜色不一样——被挖开过，又填了回去。') },
        { id: 'nisanM', x: 12, y: 4, spr: 'nisan', on: S => nisanOn(S) },
        { x: 11, y: 3, spr: 'kendi', on: S => S.narr('坟头放着一只陶水壶（kendi）。下葬那天，壶里的水洒在了坟上。') },
        { x: 13, y: 3, spr: 'payung', on: S => S.narr('插在坟头的一把纸伞。新坟要撑一把伞，像替他挡着雨。\n伞面已经被雨打出了好几个洞。') },
        { x: 4, y: 12, spr: 'sign', col: '#4a3a2a', on: S => S.narr('坟地门口的木牌：\n「进来的人，请为亡者祈祷」') },
        { x: 9, y: 4, spr: 'invisible', solid: false, on: S => S.narr('脚下的草被踩倒了一片，一路通向外公的坟——是蹦过去的印子，一个坑，一个坑。') },
        { id: 'pcm', x: 12, y: 6, dir: 0, spr: 'pocong', solid: false, s: { hop: 1 }, light: { r: 2, col: 'rgba(225,230,215,.16)' } },
        { id: 'joko_m', x: 3, y: 14, dir: 3, spr: '@joko', hidden: true, solid: false }
      ],
      enter: (S, first) => makamEnter(S, first)
    }
  });

  /* ================= 布包鬼的蹦法 =================
     只能朝面对的方向一下一下地蹦；要拐弯，得先在原地慢慢转身；直路上越蹦越快。
     减速坎前要停下来蓄一口气；石阶只能一级一级地蹦。
     charge（坟地）：你站进它正对着的那条线，它就直直地扑过来，撞到东西才停。 */
  const CFG = {
    village: { map: 'kampung', id: 'pc', v0: 2.6, acc: .6, vmax: 6.4, turn: .6, sill: 1.0, stair: 1.3 },
    grave: { map: 'makam', id: 'pcm', v0: 1.4, acc: .15, vmax: 2.2, turn: .85, sill: 1, stair: 1.2, charge: true, range: 9, warn: .55, cv0: 3.2, cacc: .9, cvmax: 8.5 }
  };
  const UNTIE = 2.6;
  const AI = { on: false, cfg: CFG.village };
  let hbT = 0, ambT = 6;
  function aiStart(cfg, delay) { Object.assign(AI, { on: true, cfg, turn: 0, turnTo: -1, turnMid: -1, turnHalf: -1, pause: delay ?? .8, streak: 0, charge: false, warn: 0, grace: 0, gath: false }); }
  function aiStop() { AI.on = false; AI.charge = false; AI.warn = 0; }
  function pcFree(m, x, y, e) {   // 布包鬼能落脚的格子（不算玩家——蹦到玩家身上就是扑到了）
    if (tileSolid(m, x, y)) return false;
    for (const o of m.ents) { if (o === e || o.hidden || !o.solid) continue; const ox = Math.round(o.px / TS), oy = Math.round(o.py / TS); if (x >= ox && x < ox + o.w && y >= oy && y < oy + o.h) return false; }
    return true;
  }
  function hop(e, d, spd) { startMove(e, d, spd); }
  /* 从玩家那格往外铺一张距离图，挑一步离玩家更近的；几步一样近时，优先不转身（两格宽的巷子里不会左右乱拐） */
  function pcStep(m, e, ex, ey, px, py) {
    const W2 = m.w, H2 = m.h, D = new Int16Array(W2 * H2).fill(-1), q = [py * W2 + px]; D[q[0]] = 0;
    for (let qi = 0; qi < q.length; qi++) {
      const c = q[qi], cx = c % W2, cy = (c / W2) | 0;
      if (cx === ex && cy === ey) break;
      for (const [dx, dy] of DIRS) { const nx = cx + dx, ny = cy + dy; if (nx < 0 || ny < 0 || nx >= W2 || ny >= H2) continue; const k = ny * W2 + nx; if (D[k] >= 0) continue; if (!(nx === ex && ny === ey) && !pcFree(m, nx, ny, e)) continue; D[k] = D[c] + 1; q.push(k); }
    }
    const here = D[ey * W2 + ex]; if (here <= 0) return -1;
    let best = -1;
    for (let d = 0; d < 4; d++) { const nx = ex + DIRS[d][0], ny = ey + DIRS[d][1]; if (nx < 0 || ny < 0 || nx >= W2 || ny >= H2) continue; if (D[ny * W2 + nx] === here - 1) { if (d === e.dir) return d; if (best < 0) best = d; } }
    return best;
  }
  function lineDir(m, e, ex, ey, px, py, range) {
    if (ex !== px && ey !== py) return -1;
    const dx = Math.sign(px - ex), dy = Math.sign(py - ey), n = Math.abs(px - ex) + Math.abs(py - ey);
    if (n === 0 || n > range) return -1;
    for (let i = 1; i < n; i++) if (!pcFree(m, ex + dx * i, ey + dy * i, e)) return -1;
    return DIRS.findIndex(q => q[0] === dx && q[1] === dy);
  }
  function startTurn(S, e, d) {
    const back = d !== e.dir && d + e.dir === 3;   // 0↔3、1↔2：掉头
    AI.turnTo = d; AI.turn = AI.cfg.turn * (back ? 1.7 : 1); AI.turnHalf = back ? AI.turn / 2 : -1;
    AI.turnMid = back ? ((d === 0 || d === 3) ? 1 : 0) : -1;   // 转半圈：中途先朝侧面
    AI.streak = 0; AI.gath = false; RUSTLE(S, .6);
  }
  /* 蹦的弧线、落地的闷响（所有带 s.hop 的实体；oy 会同步给客机） */
  function hopTick(S) {
    const m = curMap(); if (!m) return;
    for (const e of m.ents) {
      if (!e.s || !e.s.hop || e.hidden) continue;
      const ai = AI.on && AI.cfg.id === e.id && AI.cfg.map === S.map;
      if (e.mv) { e._air = true; e.oy = -Math.round(Math.sin(e.mv.p * Math.PI) * (ai && AI.charge ? 4 : 6)); }
      else {
        if (e._air) { e._air = false; HOP(S, Math.max(.12, 1 - dist(e, S.pl.x, S.pl.y) / 13)); }
        e.oy = ai && (AI.turn > 0 || (AI.pause > 0 && AI.gath)) ? -Math.round(Math.abs(Math.sin(RT * 13)) * 2) : 0;
      }
    }
  }
  function pcTick(S, dt) {
    if (!AI.on || S.map !== AI.cfg.map || W.ended) return;
    const c = AI.cfg, e = S.ent(c.id); if (!e || e.hidden || S.busy) return;
    const p = S.pl, m = curMap(), ex = Math.round(e.px / TS), ey = Math.round(e.py / TS), dd = dist(e, p.x, p.y);
    hbT -= dt; if (dd <= 5 && hbT <= 0) { HEART(S, 1); hbT = dd <= 2 ? .45 : dd <= 3 ? .7 : 1.05; }   // 越近心跳越急
    if (AI.grace > 0) AI.grace -= dt;
    if (AI.grace <= 0 && !p.hidden && Math.abs(e.px - p.px) + Math.abs(e.py - p.py) < 12) { AI.grace = 99; S.run(pcCatch); return; }
    if (e.mv) return;
    if (AI.pause > 0) { AI.pause -= dt; return; }
    if (AI.turn > 0) { AI.turn -= dt; if (AI.turnMid >= 0 && AI.turn <= AI.turnHalf) { e.dir = AI.turnMid; AI.turnMid = -1; } if (AI.turn <= 0) e.dir = AI.turnTo; return; }
    if (AI.warn > 0) { AI.warn -= dt; if (AI.warn <= 0) { AI.charge = true; AI.streak = 0; } return; }
    if (AI.charge) {
      const nx = ex + DIRS[e.dir][0], ny = ey + DIRS[e.dir][1];
      if (!pcFree(m, nx, ny, e)) { AI.charge = false; AI.streak = 0; AI.pause = .6; e.s.alert = false; S.sfx('thud'); S.shake(160, 1); if (S.once('miss')) S.run(chargeMiss); return; }
      hop(e, e.dir, Math.min(c.cvmax, c.cv0 + AI.streak++ * c.cacc)); return;
    }
    if (c.charge) {
      const ld = lineDir(m, e, ex, ey, p.x, p.y, c.range);
      if (ld >= 0) { if (ld !== e.dir) { startTurn(S, e, ld); return; } AI.warn = c.warn; e.s.alert = true; S.bubble(c.id, '!', 700); PING(S); return; }
    }
    const d = pcStep(m, e, ex, ey, p.x, p.y);
    if (d < 0) { AI.pause = .3; return; }
    if (d !== e.dir) { startTurn(S, e, d); return; }
    const nx = ex + DIRS[d][0], ny = ey + DIRS[d][1], tn = tileName(m, nx, ny), here = tileName(m, ex, ey);
    if (tn === 'polisi' && !AI.gath) { AI.gath = true; AI.pause = c.sill; AI.streak = 0; RUSTLE(S, .5); return; }   // 坎前停下，蓄一口气
    AI.gath = false;
    if (tn === 'tangga' || here === 'tangga') { AI.streak = 0; hop(e, d, c.stair); return; }
    hop(e, d, Math.min(c.vmax, c.v0 + AI.streak++ * c.acc));
  }
  async function pcCatch(S) {
    const c = AI.cfg, e = S.ent(c.id), v = c === CFG.village;
    pauseUntie(S, false);
    S.stop(c.id); Object.assign(AI, { charge: false, warn: 0, turn: 0, gath: false, streak: 0 }); e.oy = 0; e.s.alert = false;
    const k = v ? 'hitV' : 'hitG'; S.f[k] = (S.f[k] || 0) + 1;
    if (S.f[k] === 1) {
      S.sfx('thud'); S.shake(450, 3); HEART(S, 3);
      const bx = Math.round(e.px / TS) - DIRS[e.dir][0], by = Math.round(e.py / TS) - DIRS[e.dir][1];   // 把它往回弹一格
      if (pcFree(curMap(), bx, by, e) && !(bx === S.pl.x && by === S.pl.y)) S.place(c.id, bx, by, e.dir);
      await S.narr(v ? '冰凉的、湿透的白布，一下子蹭过你的后颈——\n一股坟土混着茉莉花的味道。你一个踉跄，差点跪进泥里。' : '它扑到了你身上。\n裹尸布贴着你的脸，冰凉，潮湿——又弹开了。');
      S.toast('再被扑到一次，就完了');
      AI.pause = 1.5; AI.grace = 1.7; return;
    }
    aiStop(); bumpCP(S, v ? '_dV' : '_dG');
    await S.scare('face', { face: 'pocong2', dur: 1.1 });
    await S.die(v ? '它扑到了你身上。\n白布裹住了你的脸，坟土的味道灌进鼻子里。你想喊，喊不出声。\n……醒来的时候，天已经亮了。唤拜声早就响过了。' : '你没能躲开。\n它的脸贴在你的脸上，半边脸颊上沾着坟土。\n……等你醒来，鸡蛋花落了你一身，天已经大亮。', v ? '它追上了你' : '它扑到了你');
  }
  async function chargeMiss(S) { await S.think('它扑空了，一头撞在东西上，停住了——正慢慢地转身。\n……趁现在！'); }
  function back(S) { const p = S.pl; if (p.prev && (p.prev[0] !== p.x || p.prev[1] !== p.y)) S.pos(p.prev[0], p.prev[1]); }

  /* ================= 第一幕：外公家 ================= */
  async function rumahEnter(S, first) {
    if (!first) return;
    S.f.ph = 'eve';
    await S.narr('最后几位客人提着竹编的饭盒，一边道谢，一边钻进雨里。');
    await Promise.all([S.walk('tamu1', [[10, 9], [10, 13]], 3), S.walk('tamu2', [[11, 8], [11, 9], [11, 13]], 3)]);
    S.hide('tamu1'); S.hide('tamu2');
    await S.think(['外公走了四十天了。', '屋里还是一股茉莉花和湿草席的味道。……好像他随时会从小礼拜堂回来，在门口跺跺拖鞋上的泥。']);
    S.goal('跟外婆（厨房）和莫丁老伯（堂屋）说说话');
  }
  async function rumahExit(S) {
    const ph = S.f.ph;
    if (ph === 'eve' || ph === 'dark') {
      S.sfx('locked'); await S.narr(ph === 'eve' ? '雨还在下。客人刚散，外婆一个人在厨房忙……先跟外婆和莫丁老伯说说话。' : '后门……后门有东西。先去厨房看看。');
      return back(S);
    }
    await S.go('kampung', 3, 22, 3);
  }
  async function modinOn(S) {
    S.face('modin', 'pl'); const ph = S.f.ph;
    if (ph === 'eve') {
      if (!S.f.mod1) {
        await S.narr('莫丁老伯——村里管婚丧的老人——坐在草席上，手里攥着一本卷了边的硬皮本子，半天没动。');
        await S.say('莫丁老伯', ['阿迪啊，长这么高了。', '你外公是好人。七十一岁，一辈子没跟人红过脸。', '送他走的那天，雨大得很……']);
        await S.narr('老人说到这里，停住了。他低下头一页一页地翻那本本子，翻到某一页，又合上了。');
        S.f.mod1 = true; return checkBlackout(S);
      }
      return S.say('莫丁老伯', cycle(S, '_md', ['……没事。人老了，话就多。', '今晚来念经的人多。你外公听见了，会高兴的。', '你外婆这些天瘦了。多陪陪她。']));
    }
    if (ph === 'dark') return S.say('莫丁老伯', '……来了。它又来了。', { style: 'whisper' });
    return S.say('莫丁老伯', cycle(S, '_mo', ['拿回那截绳子，到你外公坟头上，念一声「比斯米拉」，把结解开。', '它只会直着蹦，转身慢。碰见了，拐弯、上台阶、翻坎——别跟它比直路。', '天亮以前。一定要在天亮以前。']));
  }
  async function mbahOn(S) {
    S.face('mbah', 'pl'); const ph = S.f.ph;
    if (ph === 'eve') {
      if (!S.f.mbah1) {
        await S.narr('外婆坐在矮竹凳边上洗碗，袖子挽得高高的。');
        await S.say('外婆', ['阿迪，冷不冷？锅里还有姜茶。', '……这十几天，每天夜里，后门都有人敲。', '咚、咚，敲两下，停一会儿，再敲两下。我不敢开。你舅舅说是野猫。', '野猫哪会敲得那么慢。']);
        S.f.mbah1 = true; return checkBlackout(S);
      }
      const t = cycle(S, '_mb', ['你外公以前天不亮就起来，去小礼拜堂敲鼓，叫大家起来做晨礼。敲了三十年。', '他走了以后，鼓换别人敲了。我一听就听得出来——不是他的手。', '喝口姜茶吧，啊。']);
      if (S.f._mb < 2) S.f.beduk = true;
      return S.say('外婆', t);
    }
    if (ph === 'dark') return S.say('外婆', '阿迪……你听。', { style: 'whisper' });
    if (!S.has('tasbih')) {
      await S.say('外婆', ['你要去？', '……把这个带上。你外公的念珠。他走的那天早上，手里还攥着它。']);
      S.give('tasbih'); S.f.beduk = true; return;
    }
    return S.say('外婆', cycle(S, '_mt', ['早点回来。', '别怕他。他是你外公啊。']));
  }
  async function paklikOn(S) {
    S.face('paklik', 'pl'); const ph = S.f.ph;
    if (ph === 'eve') {
      if (S.once('pk1')) return S.say('舅舅', ['阿迪，帮我把碗摞一摞。', '你外婆这几天夜里老说后门有人敲。我守了两夜，什么也没看见。', '村里人嘴碎，说什么的都有。别往心里去。']);
      return S.say('舅舅', cycle(S, '_pk', ['莫丁老伯今晚一直不太说话。', '明天还得把借来的碗挨家挨户送回去。']));
    }
    if (ph === 'dark') return S.say('舅舅', '……别出声。', { style: 'whisper' });
    return S.say('舅舅', cycle(S, '_pk2', ['乔科就缩在巡夜岗亭里，大路和下巷的路口。', '我守着你外婆。……小心点。']));
  }
  async function checkBlackout(S) { if (S.f.mbah1 && S.f.mod1 && S.f.ph === 'eve') await blackout(S); }
  async function blackout(S) {
    S.f.ph = 'dark';
    await S.wait(500);
    S.ent('bulb').off = true; S.ent('facewin').lit = false; S.dark(.9); S.sfx('switch');
    await S.narr('「啪」。\n灯灭了。');
    await S.narr('不光是外公家——窗外，整个村子的灯，一下子全灭了。\n只剩下雨声。');
    S.show('tep1'); S.sfx('match');
    S.face('paklik', 'pl');
    await S.say('舅舅', ['又停电了。雨季就这样。', '阿迪，手电筒拿着。']);
    S.give('senter'); S.plr(3.6);
    await S.wait(400); TITIR(S, .35, 12); await S.wait(1900);
    await S.narr('远处传来竹梆的声音，笃笃笃笃笃，一下接一下，敲个不停。');
    await S.say('舅舅', '……巡夜的在敲梆子。连着敲——出事了。');
    await S.wait(700); KNOCK2(S); await S.wait(1200);
    await S.narr('咚。\n……咚。');
    S.face('mbah', 3); S.bubble('mbah', '!', 1200);
    await S.narr('是厨房的后门。');
    S.goal('去厨房看看后门');
  }
  async function backDoorOn(S) {
    const ph = S.f.ph;
    if (ph === 'eve') return S.narr('厨房的后门，门闩插得紧紧的。门板底下的缝里，渗进来一线雨水。');
    if (ph !== 'dark') return S.narr('后门的门闩插得紧紧的。外婆在门板上贴了一张写着经文的小纸条。');
    await S.narr('你把手按在门板上。冰凉。\n门外，有什么东西靠着门。很轻，很慢，一下，一下。');
    const r = await S.ask('门板中间，有一道裂缝。', ['从门缝往外看', '（不看。退开）']);
    if (r === 0) {
      S.f.peek = true;
      await S.narr('你把眼睛凑到门缝上——');
      await S.scare('face', { face: 'pocong', dur: 1.1 });
      await S.narr('一张灰青的脸，贴在门缝外头。\n脸的四周裹着湿透的白布。眼睛的地方，是两个黑窟窿。');
    } else await S.narr('你往后退了一步。\n门外的东西停了一下，好像在听。');
    HOP(S, .7); await S.wait(600); HOP(S, .6);
    await S.narr('咚。……咚。\n声音离开了门口，绕着屋子，往前院去了。');
    S.place('pc_r', 22, 11, 1); S.focus(15, 11);
    await S.walk('pc_r', [[13, 11], [11, 12], [11, 14]], 2.2);
    S.hide('pc_r'); S.focus(null);
    await S.narr('一个裹着白布的东西，一下，一下，蹦过了前院。\n头顶扎着一个结。它蹦得很直、很慢，蹦出院门，往村子里去了。');
    await confession(S);
  }
  async function confession(S) {
    S.face('modin', 'pl');
    await S.narr('堂屋里，莫丁老伯不知什么时候站了起来，手里的本子在抖。');
    await S.say('莫丁老伯', ['……是我的错。', '裹布要扎七道绳。下葬的时候，要一道一道全解开，让他的脸贴着土，安安心心地走。', '那天雨太大，坑里全是水。我解了六道……头顶那一道泡了水，死死的，怎么也抠不开。大家都在催——我想着，等雨停了再来。']);
    await S.say('莫丁老伯', ['后来我心里过不去，在巡夜岗亭跟人说了。', '第二十二夜，是 Jumat Kliwon 夜。第二天一早，坟头被人挖开过——头顶那一道，连着结，被人割走了。']);
    await S.say('舅舅', '割走了？谁会去割那个……');
    await S.say('莫丁老伯', ['没解开的结，押号的人说最灵。村里整天押号的，只有一个。', '结不解，魂就拴着。老人们说，人走了四十天，魂才离开家——今晚就是第四十夜。天亮以前，晨礼的唤拜一响，他就再也走不了了。']);
    await S.narr('老人把那本硬皮本子塞到你手里。');
    await S.note('modin');
    await S.think('……我去把绳子拿回来。');
    await S.say('莫丁老伯', ['好孩子。拿回那截绳子，到你外公坟头上，念一声「比斯米拉」，把结解开。', '记着：它只会直着蹦，转身慢。碰见了别跟它比直路——拐弯，上台阶，翻坎。']);
    S.face('paklik', 'pl');
    await S.say('舅舅', '乔科这几天天天缩在巡夜岗亭里，就在大路和下巷的路口。我守着你外婆——去吧。');
    S.f.ph = 'out';
    S.goal('去村里找乔科，拿回那截打结的绳子（巡夜岗亭：大路和下巷的路口）');
    S.cp('out');
  }

  /* ================= 第二幕：村子 ================= */
  async function kampungEnter(S, first) {
    if (S.f.ph === 'chase0') return startChase(S);
    if (first) {
      await S.narr('雨小了，变成细细的雨丝。\n停了电的村子黑得像一口井。只有巡夜岗亭那边，亮着一盏煤油灯。');
      TOK(S, .4); TOK(S, .4, .5);
    }
  }
  function kampungStep(S, x, y) {
    if (S.f.ph === 'out' && (x === 15 || x === 16) && y >= 13 && y <= 18 && S.once('sight')) return sighting(S);
  }
  async function sighting(S) {
    S.place('pc', 16, 6, 0); S.show('pc');
    TITIR(S, .3, 8); S.focus(16, 9); await S.wait(600);
    await S.narr('大路的尽头，上巷口，站着一个白的东西。');
    await S.walk('pc', [[16, 5], [20, 5]], 2.2);
    await S.alpha('pc', 0, 600);
    S.focus(null);
    await S.think(['……它往小礼拜堂那边去了。', '一下，一下，蹦得笔直。']);
  }
  async function toMakam(S) {
    if (S.f.ph === 'chase') {
      aiStop(); S.stop('pc'); S.hide('pc');
      await S.narr('你一头扎进竹林里的小路。\n身后的跳步声……忽然停了。');
      return S.go('makam', 3, 14, 3);
    }
    S.sfx('locked'); await S.narr('竹林那头就是坟地。……手里什么都没有，现在去也没用。先把绳子拿回来。');
    back(S);
  }
  async function toRumah(S) {
    if (S.f.ph === 'chase') { S.sfx('locked'); await S.narr('不能往家里跑——外婆还在屋里！'); return back(S); }
    await S.go('rumah', 10, 13, 3);
  }
  async function jdoorOn(S) {
    if (S.f.ph === 'chase') { S.sfx('locked'); return S.narr('躲进去？竹墙一撞就倒——会被它堵死在屋里！'); }
    S.sfx('open'); await S.go('gubuk', 5, 6, 3);
  }
  async function kdoorOn(S) {
    if (S.f.ph !== 'chase') {
      await S.narr('下巷的空屋。房主去雅加达十几年了，一直没回来。\n门敞着，门里点着一盏煤油灯，灯前撒着一圈花瓣。门环上挂着一把打开的大挂锁。');
      if (S.f.ronda) await S.think('……巡夜的说的，就是这儿。引它进去，把门一锁。');
      return;
    }
    const r = await S.ask('空屋的门敞着，挂锁就挂在门环上。\n巡夜的说：引它进去，把门一锁。……它要的，就是你手里的绳子。', ['把绳子扔进空屋，等它跳进去就锁门', '不。带着绳子去坟地']);
    if (r === 0) return lockedEnd(S);
  }
  async function bowoOn(S) {
    S.face('bowo', 'pl');
    if (S.f.ph === 'chase') return S.say('博沃', '快跑啊！别往这边——', { style: 'big' });
    if (S.once('bw1')) return S.say('博沃', ['阿迪？你外公家也黑了吧，整个村都停了。', '刚才那阵梆子是我敲的。它又下来了——从坟地那边，顺着大路往下蹦。', '这十几天天天这样。蹦到你外公家后门，敲两下，再蹦回去。']);
    return S.say('博沃', cycle(S, '_bw', ['我守了三年夜，偷鸡的、偷牛的都碰见过……这个，我不敢。', '扬托大叔懂得多，你问他。']));
  }
  async function yantoOn(S) {
    S.face('yanto', 'pl');
    if (S.f.ph === 'chase') return S.say('扬托大叔', '别跑直线！拐弯！', { style: 'big' });
    if (!S.f.ronda) {
      await S.say('扬托大叔', ['它不害人。可人撞上它，魂要吓掉的——卖鸡蛋的萨迪上礼拜在大路上碰见，到今天还发着烧。', '碰见了别跟它跑直线。它在直路上越蹦越快，跟飞一样。可它转个身，要老半天。', '东头那条石阶巷，弯多、台阶多，它蹦不动。路上那几道减速坎，它也得停下来，蓄一口气才蹦得过去。']);
      await S.say('扬托大叔', '我们在下巷那间空屋里点了盏灯，门开着。等它蹦进去，就把门锁上——关一辈子，也好过天天来敲门。');
      await S.think('……关在屋里？那是外公啊。');
      S.f.ronda = true; return;
    }
    if (S.f.jk && !S.f.yHint) { S.f.yHint = true; return S.say('扬托大叔', ['乔科这个人，什么都要算日子。押号算日子，连锁的号都是按日子算的。', '你外公家墙上那本挂历，背面抄着算日子的表——他老人家是村里算得最准的。']); }
    return S.say('扬托大叔', cycle(S, '_yt', ['四十天……今晚是最后一夜了吧。', '你外公每天凌晨敲的那面鼓，我们听了三十年。']));
  }
  async function jokoOn(S) {
    S.face('joko', 'pl');
    if (!S.f.jk) {
      await S.narr('乔科裹着一条湿透的纱笼，缩在岗亭底下，浑身发抖。');
      await S.say('乔科', '别、别看我……不是我……');
      await S.say('阿迪', '莫丁老伯都说了。头顶那道绳子，是你割的。');
      await S.say('乔科', ['……是我。', '在我屋里，饼干盒里，锁着。我不给！再熬一夜，天一亮，它就是我的了……', '号？我不说！说了你们就……']);
      S.f.jk = true;
      S.goal('去乔科家打开饼干铁盒（横巷西头，河边的竹屋）');
      return;
    }
    return S.say('乔科', cycle(S, '_jk', ['……它天天夜里来敲我的门。咚、咚。我不开。我不开……', '我欠了人家八百万盾……你知道八百万是多少吗……', '别看我！']));
  }

  /* ================= 乔科的竹屋：密码锁 ================= */
  async function gubukEnter(S, first) {
    if (!first) return;
    await S.narr('乔科的竹屋。竹篾墙的缝里漏着风，一股潮霉味和烟草味。\n墙角，一只红色的饼干铁盒。');
    S.goal('打开饼干铁盒（四位数的密码锁）' + (S.coop ? '——一人翻档案念线索，一人拨锁' : ''));
  }
  async function gubukExit(S) { await S.go('kampung', 4, 11, 0); }
  async function kalengOn(S) {
    const k = S.ent('kaleng');
    if (k.open) return S.narr('铁盒空了。盒底沾着几片干了的花瓣，和一点黑色的香灰。');
    if (S.once('kal1')) await S.narr('一只红色的饼干铁盒，盖子上画着一家人围着桌子喝茶。\n盒子被铁丝缠了好几圈，铁丝上挂着一把四位数的密码锁。');
    const v = await S.keypad('四位数的密码锁' + (S.coop ? '\n（另一位可以在「档案」里翻读过的笔记）' : '\n（读过的笔记，可以在「档案」里重看）'), ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'], 4);
    if (v == null) return;
    LOCKC(S);
    if (v === '1410') return openBox(S);
    return wrongCode(S, v);
  }
  async function wrongCode(S, v) {
    const n = S.f.wrong = (S.f.wrong || 0) + 1;
    HOP(S, Math.min(.9, .3 + n * .15));
    if (n === 2) S.fx('static');
    if (n >= 3) S.shake(260, 2);
    await S.narr(n === 1 ? '锁扣纹丝不动。\n……屋外，远远地，「咚」了一声。' : n === 2 ? '还是不对。\n「咚」。——近了。竹墙的缝里，有什么白的东西晃了一下。' : '「咚」。\n就在竹墙外面。');
    const a = v.slice(0, 2), b = v.slice(2);
    let tip = null;
    if (v === '1213') tip = '两边都差了一点……外公的历书背面写着：日头一落，就算第二天。';
    else if (v === '1014') tip = '前后反了。本子上写：前两位，是他挖坟的那一夜。';
    else if (a === '12') tip = '前两位……他是礼拜四晚上去的。可日头一落，就该算星期五了。';
    else if (b === '13') tip = '后两位……今晚是星期一晚上。请帖上写的是「Selasa Pon 夜」。';
    else if (a === '14' && b !== '10') tip = '前两位像是对了。后两位：「它归我那一夜」——就是第四十夜，今晚。';
    else if (b === '10' && a !== '14') tip = '后两位像是对了。前两位：他去挖坟的那一夜。';
    if (tip) await S.think(tip);
    if (n >= 4) return S.think('……一、四、一、〇。是这个了。');
    if (n === 3) return S.think('挖坟那夜：乔科本子上写着 12 月 19 日礼拜四晚上——就是 Jumat Kliwon 夜，星期五 6 加 Kliwon 8。\n今晚：Selasa Pon 夜，星期二 3 加 Pon 7。');
    if (n === 2) {
      const miss = [!S.f.rdJoko && '桌上乔科的小本子', !S.f.rdKal && '外公家堂屋墙上的挂历', !S.f.rdUnd && '外公家矮桌上的请帖'].filter(Boolean);
      return S.think('号是两个 neptu 拼起来的：他挖坟的那一夜，和「它归他」的那一夜。' + (miss.length ? '\n得先看看：' + miss.join('、') + '。' : '\nneptu 怎么算，外公的挂历背面抄着。'));
    }
  }
  async function openBox(S) {
    const k = S.ent('kaleng'); k.open = true; S.sfx('open');
    await S.narr('「咔」。锁开了。\n你一圈一圈解开铁丝，掀开盖子——一股安息香和烂花瓣的味道。');
    S.give('tali');
    await S.narr('盒底垫着一块白布。白布上躺着一截发黄的布绳。\n一头是刀割的齐口；正中间，打着一个死结。');
    await S.think(['……外公。', '这四十天，你一直被拴在这个结上。']);
    S.amb('none'); await S.wait(500); HOP(S, .7); S.shake(250, 2);
    await S.narr('咚。\n——不远，就在横巷里。');
    TITIR(S, .6, 14);
    await S.narr('远处，竹梆连成了一片：笃笃笃笃笃笃笃。');
    S.f.ph = 'chase0';
    S.goal('带着绳子去坟地（村子东北角的竹林小路）——别跟它跑直线');
    S.cp('chase');
  }
  async function startChase(S) {
    S.f.ph = 'chase'; S.f.hitV = 0;
    const e = S.ent('pc'); S.place('pc', 10, 12, 1); e.s.alert = false; e.alpha = 1;
    S.focus(7, 12); S.bubble('pc', '!', 1200); PING(S);
    await S.narr('横巷里，减速坎那头，站着一个白的东西。\n它慢慢地，朝你这边转了过来。');
    S.focus(null);
    const n = S.f._dV || 0;
    if (n === 0) await S.think('……别跟它比直路。往河边那条小巷跑——下坡，再往东，走东头的石阶巷！');
    else { await S.think(n === 1 ? '它在直路上越蹦越快。……下巷有减速坎，东头的石阶巷弯多、台阶多。' : '先往河边的小巷跑，下石阶到下巷，往东翻过减速坎，再拐进东头的石阶巷——一路拐弯。'); S.toast('提示：河边小巷（往南）→ 下巷（往东）→ 东头石阶巷（往北）→ 竹林小路'); }
    S.goal('去坟地（村子东北角的竹林小路）——别跟它跑直线：拐弯、上石阶、翻减速坎');
    aiStart(CFG.village, .35);
  }
  async function lockedEnd(S) {
    aiStop(); const e = S.ent('pc'); S.stop('pc'); e.s.alert = false; e.oy = 0;
    S.take('tali'); S.sfx('item');
    await S.narr('你把那截绳子扔进了空屋。\n它在煤油灯前的花瓣上滚了两滚，停住了。');
    await S.walk('pl', [12, 20], 4.2); S.face('pl', 1);
    if (dist(e, 10, 19) > 7) { const sx = Math.round(e.px / TS) < 10 ? 4 : 16; S.place('pc', sx, 19, sx < 10 ? 2 : 1); }
    S.focus(10, 18);
    await S.narr('咚。……咚。\n白的东西蹦过来了。它没有看你。');
    await S.walk('pc', [10, 19], 2.6); S.face('pc', 3); await S.wait(500);
    await S.alpha('pc', 0, 900);
    await S.narr('它一下，一下，蹦进了门槛。');
    const d = S.ent('kdoor'); d.open = false; d.locked = true; S.sfx('close'); await S.wait(300); LOCKC(S); S.shake(200, 1);
    await S.narr('你扑过去把门拉上。「咔嗒」一声，挂锁扣死了。');
    for (let i = 0; i < 3; i++) { HOP(S, .45); await S.wait(800); }
    await S.narr('门里面，咚。……咚。\n不紧不慢，从这面墙，蹦到那面墙。');
    S.focus(null);
    await S.end({ bad: true, id: 'locked', title: '关在屋里', text: '巡夜的人把空屋的门锁上，又钉了两块木板。\n\n第二天，第三天，第一百天……\n每天夜里，空屋里都会传出那个声音：咚。……咚。\n不紧不慢，从这面墙蹦到那面墙。\n\n外公家的后门，再也没有人敲了。\n可外婆总是一个人走到下巷，站在空屋门口，一站就是很久。\n\n她说，你外公在里面，找不着回家的路。' });
  }

  /* ================= 第三幕：坟地 ================= */
  const GOAL_G = S => '到坟头的木牌前站定，解开那个结——别站在它正对着的那条线上' + (S.coop ? '（一人盯着它的朝向喊）' : '');
  async function makamEnter(S, first) {
    if (!first) return;
    S.f.ph = 'grave'; S.f.untieLeft = UNTIE; S.f.untying = false; S.f.hitG = 0;
    await S.narr('竹林尽头，是村里的坟地。\n雨小了。鸡蛋花一树一树地开着，白花瓣落了一地。');
    S.fx('flash'); S.sfx('sting'); S.shake(300, 2); S.focus(12, 8);
    await S.narr('一道闪电。\n——外公的新坟上，站着那个白的东西。\n它比你先到了。');
    S.focus(null);
    await S.think(['莫丁老伯说：在坟头上，把结解开。', '它只会朝它面对的方向直直地扑过来，撞到东西才停。要扑别的方向，得先慢慢地转过身。']);
    S.goal(GOAL_G(S));
    S.cp('grave');
    aiStart(CFG.grave, 1.0);
  }
  async function makamExit(S) {
    if (S.f.ph === 'grave' || S.f.ph === 'knot') { S.sfx('locked'); await S.narr('现在走，外公就永远走不了了。'); return back(S); }
    await S.go('kampung', 30, 1, 0);
  }
  async function nisanOn(S) {
    if (S.f.ph !== 'grave') return S.narr('外公的木牌。上面用白漆写着：卡西姆　1931—2002。');
    if (S.f.untying) return;
    if (S.once('nisan1')) await S.narr('木牌上用白漆写着：卡西姆　1931—2002。\n你蹲下来，掏出那截布绳，手指抠进那个死结里——');
    S.f.untying = true;
    S.timer(Math.max(.3, S.f.untieLeft ?? UNTIE), '解结', untieDone);
    S.toast('站着别动……一点一点地抠开');
    RUSTLE(S, .8);
  }
  function pauseUntie(S, msg) {
    if (!S.f.untying) return;
    S.f.untieLeft = Math.min(UNTIE, (S.timerLeft ?? S.f.untieLeft) + (msg ? .3 : 0)); S.clearTimer(); S.f.untying = false;
    if (msg) S.toast('手一松，结又滑紧了一点——要站着别动');
  }
  function untieTick(S) {
    if (S.map !== 'makam' || S.f.ph !== 'grave' || !S.f.untying || S.busy) return;
    const p = S.pl, near = Math.abs(p.x - 12) + Math.abs(p.y - 4) === 1;
    if (S.moving || !near) pauseUntie(S, true);
  }
  async function untieDone(S) {
    if (S.f.ph !== 'grave') return;
    aiStop(); S.stop('pcm'); S.f.untying = false; S.f.ph = 'knot';
    const e = S.ent('pcm'); e.s.alert = false; e.oy = 0;
    await S.narr('结松了。\n湿透的布绳一点一点地，从你的指缝里退出来——只差最后一下。');
    S.face('pcm', 'pl');
    await S.narr('坟地里的白东西停住了。\n它没有再扑过来。它就那么站着，脸朝着你，好像在等。');
    S.goal('解开最后一个结');
    S.cp('knot');
    await finale(S);
  }
  async function finale(S) {
    S.place('joko_m', 3, 14, 3);
    await S.say('乔科', '别解！！', { style: 'big' });
    await S.walk('joko_m', [3, 12], 3.4);
    await S.say('乔科', ['阿迪……那是我的命啊。我欠了人家八百万盾，人家说再不还就……', '天一亮，它就归我了。它给我号，我把钱还上，我给你外公修最好的坟——', '把绳子给我！求你了！']);
    const r = await S.ask('乔科伸着手，在雨里浑身发抖。\n坟头上，那个白的东西一动不动。', ['解开最后一个结', '把绳子扔给乔科']);
    return r === 1 ? jokoEnd(S) : goodEnd(S);
  }
  async function goodEnd(S) {
    const e = S.ent('pcm');
    await S.narr('你低声念了一句「比斯米拉」——奉真主之名。\n然后，把那个结拉开了。');
    RUSTLE(S, 1.5); S.sfx('tear'); S.take('tali');
    await S.wait(700);
    await S.narr('白布「沙」地一声松了下来，\n像一口憋了四十天的气，终于吐了出来。');
    e.s.lie = true; e.oy = 0; S.place('pcm', 12, 5, 0);
    await S.wait(800);
    await S.narr('它慢慢地躺了下去，躺回坟上，侧着身，脸朝着西边。\n雨停了。');
    await S.alpha('pcm', 0, 1800);
    for (let i = 0; i < 3; i++) { BEDUK(S, .55 + i * .15); await S.wait(1100); }
    for (let i = 0; i < 6; i++) BEDUK(S, .5, i * .32);
    await S.wait(2000);
    await S.narr('村那头，小礼拜堂里，有人敲响了大鼓。\n咚——咚——咚——\n然后，晨礼的唤拜声远远地飘过了竹林。');
    const ts = S.has('tasbih');
    if (ts) {
      S.ent('nisanM').s.tasbih = true; S.sfx('item');
      await S.narr('你把外公的念珠，挂在了木牌上。');
      await S.think(S.f.beduk ? ['三十年，每天天不亮，他就坐在小礼拜堂的门廊上一颗一颗地数着它，等着敲第一声鼓。', '……今天，换别人敲了。外公，你听见了吗？'] : '……外公，你听见了吗？');
    }
    S.face('joko_m', 3);
    await S.narr('乔科跪在泥里，把脸埋进了手里。');
    await S.end({ id: 'rest', title: '第二十五夜　完', text: '第四十一天的早上，雨停了。\n\n莫丁老伯带着几个年轻人上山，把外公的坟重新培好，又在坟前替他念了经。老人在坟前坐了很久，一句话也没说。\n\n乔科把那个小本子扔进了灶膛。听说他去邻村的砖窑干活了，欠的钱，一点一点地还。\n\n外婆说，从那天夜里起，后门再也没响过。' + (ts && S.f.beduk ? '\n只是每天天快亮的时候，她还是会醒过来，听一会儿小礼拜堂的鼓声，然后轻轻地说：\n「你外公起来了。」' : '') });
  }
  async function jokoEnd(S) {
    S.take('tali'); S.sfx('item');
    await S.narr('你把那截绳子扔了过去。\n乔科扑在泥里接住它，紧紧攥在胸口，爬起来就跑。');
    await S.walk('joko_m', [3, 14], 4.5); S.hide('joko_m');
    S.face('pcm', 0); RUSTLE(S);
    await S.narr('坟头上，那个白的东西，慢慢地转过了身。');
    await S.walk('pcm', [12, 9], 2.4);
    await S.alpha('pcm', 0, 900);
    await S.end({ bad: true, id: 'joko', title: '给了乔科', text: '乔科攥着那截绳子，跌跌撞撞地跑下了山。\n身后，一个白的东西，一下，一下，跟了上去。\n\n天亮的时候，唤拜声照常响起。\n乔科没有回家。有人说在稻田的田埂上看见过他，一直往前跑，一直往前跑，像是身后有什么东西在追。\n\n从那以后，每到 Jumat Kliwon 的夜里，村里人都能听见两种声音从田埂上过去：\n一种是跑的。\n一种是蹦的。' });
  }

  /* ================= 章节 ================= */
  defChapter({
    id: 'pocong', n: 25, title: '布包鬼', sub: '裹尸布上的结，要在下葬时一道一道解开。忘了解的那一个，会自己蹦回来。', origin: '印度尼西亚传说「Pocong」', color: '#2e3a34',
    amb: 'rain', floor: 'tile', wall: 'plain', dark: .5, plr: 3.2, darkC: '#04060a',
    people: PEOPLE, items: ITEMS, notes: NOTES, faces: FACES, sprites: SPRITES, tiles: TILES,
    endings: { rest: '第二十五夜　完', locked: '关在屋里', joko: '给了乔科' },
    legend: LEGEND,
    start: { map: 'rumah', x: 11, y: 7, dir: 0 },
    async intro(S) { aiStop(); await S.card('第二十五夜　布包鬼', '2003年1月6日　印度尼西亚　中爪哇', '外公走了四十天。\n\n今晚是四十日祷念。村里的男人们挤满了外公家的堂屋，\n一遍又一遍，念完了《雅辛章》。\n\n雨从傍晚下起，一直没停。'); },
    thumb(g, w, h) {   // 鸡蛋花树下的新坟、一把纸伞，坟上站着一个白布裹到脚、头顶扎结的身影
      const R = (x, y, ww, hh, c) => { g.fillStyle = c; g.fillRect(x, y, ww, hh); };
      const by = h - 22, bg = shade('#2e3a34', -.5);
      R(w - 34, 8, 12, 12, '#e8e4c8'); R(w - 30, 6, 12, 12, bg);   // 月牙
      R(10, by - 54, 5, 54, '#3a2e24'); R(4, by - 62, 34, 12, '#1c3222'); R(0, by - 56, 22, 8, '#1c3222'); R(14, by - 50, 4, 10, '#3a2e24');   // 鸡蛋花树
      for (let i = 0; i < 9; i++) { const x = 3 + (i * 37 % 32), y = by - 61 + (i * 13 % 12); R(x, y, 3, 3, '#f4f2ea'); R(x + 1, y + 1, 1, 1, '#f0d050'); }
      R(0, by - 4, w, 4, '#18241a');
      R(w - 28, by - 14, 6, 12, '#8a867a'); R(w - 16, by - 10, 6, 8, '#8a867a');   // 远处的老坟
      R(54, by - 6, 60, 6, '#3a2a1e'); for (let i = 0; i < 14; i++) R(56 + (i * 23 % 56), by - 5 + (i % 3), 2, 1, ['#d83a4a', '#f4f0e0', '#f0d050'][i % 3]);   // 新坟和花瓣
      R(57, by - 30, 1, 26, '#4a3a2a'); R(48, by - 36, 20, 4, '#e8e0c8'); R(51, by - 38, 14, 2, '#d8d0b4');   // 纸伞
      const x0 = 78, y0 = by - 64, C = '#ebe9de', C2 = '#c6c3b4', T = '#86836f';
      R(x0 + 7, y0, 4, 6, C); R(x0 + 3, y0 - 2, 4, 3, C2); R(x0 + 11, y0 - 2, 4, 3, C2); R(x0 + 6, y0 + 5, 6, 2, T);   // 头顶的结
      R(x0 + 2, y0 + 6, 14, 16, C); R(x0, y0 + 22, 18, 34, C); R(x0 + 2, y0 + 56, 14, 4, C); R(x0 + 14, y0 + 22, 4, 34, C2);
      R(x0 + 2, y0 + 21, 14, 2, T); for (const y of [28, 36, 44, 52]) R(x0, y0 + y, 18, 2, T);
      R(x0 + 4, y0 + 9, 10, 11, '#8e9482'); R(x0 + 5, y0 + 12, 3, 3, '#060606'); R(x0 + 10, y0 + 12, 3, 3, '#060606'); R(x0 + 6, y0 + 13, 1, 1, '#e8f0d8'); R(x0 + 11, y0 + 13, 1, 1, '#e8f0d8'); R(x0 + 7, y0 + 17, 4, 1, '#2a2a26');
      R(x0 + 3, y0 + 52, 12, 2, '#6e5c40'); R(x0 - 2, by - 2, 22, 2, 'rgba(0,0,0,.4)');
    },
    resume: {
      out: async S => { aiStop(); },
      chase: async S => {
        aiStop(); S.stop('pc'); S.hide('pc'); S.f.ph = 'chase0';
        const n = S.f._dV || 0;
        if (n) await S.think(n === 1 ? '……又回到了乔科的竹屋。\n这回出了门，先往河边的小巷跑。' : '出门往西，下河边小巷，到下巷往东，再进东头的石阶巷。直路上它比你快。');
      },
      grave: async S => {
        S.place('pcm', 12, 6, 0); const e = S.ent('pcm'); e.s.alert = false; e.s.lie = false; e.oy = 0;
        S.f.untying = false; S.f.untieLeft = UNTIE; S.f.hitG = 0; S.goal(GOAL_G(S));
        const n = S.f._dG || 0;
        if (n) { await S.think(n === 1 ? '……等它对准你、蹦起来的那一下，闪到旁边去。\n它停不下来——撞到东西，才会慢慢转身。' : '先站进它正对着的那条线，引它扑过来；一闪开，它就扑到坟地那头去了。\n趁它撞上东西、慢慢转身的时候，跑到木牌前站定。'); S.toast('提示：引它扑空 → 趁它转身 → 木牌旁站定解结'); }
        aiStart(CFG.grave, 1.2);
      },
      knot: async S => { aiStop(); S.stop('pcm'); await finale(S); }
    },
    tick(S, dt) {
      hopTick(S); pcTick(S, dt); untieTick(S);
      /* 去拿绳子之前，村子里偶尔远远地「咚」一声 */
      if (S.map === 'kampung' && S.f.ph === 'out' && !S.busy) { ambT -= dt; if (ambT <= 0) { ambT = 9 + Math.random() * 8; HOP(S, .12); } }
    },
    maps: MAPS()
  });
})();
