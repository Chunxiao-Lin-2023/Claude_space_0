/* ================= 第二十八夜 · 巴恩加尔古堡 ================= */
(() => {
  /* ---------- 小工具 ---------- */
  const row = (w, f) => Array.from({ length: w }, (_, x) => f(x)).join('');
  const T16 = 16;
  /* 白天的「日影钟」：S.f.min = 离日落还剩多少分钟（只在城里流逝，剧本运行时按动作扣） */
  const DAY0 = 66, DAYRATE = .45;
  const FRONT0 = 3, SAMX = 27;   // 宫殿的影子从 x=3 爬到苦行僧小屋 x=27
  const frontOf = min => FRONT0 + (1 - Math.max(0, Math.min(DAY0, min)) / DAY0) * (SAMX - FRONT0);
  function cost(S, n) {
    if (S.f.ph !== 'day') return;
    S.f.min = Math.max(.5, (S.f.min ?? DAY0) - n);
    if (n >= 3) S.toast(S.f.min < 25 ? '影子又往前爬了一大截——快来不及了！' : '影子又往前爬了一截。');
  }
  function fingers(S) {
    const m = Math.max(0, S.f.min ?? DAY0), n = Math.round(m / 15 * 2) / 2;
    const fs = n < .5 ? '连半指都不到' : (Math.floor(n) ? cnum(Math.floor(n)) + '指' : '') + (n % 1 ? (Math.floor(n) ? '半' : '半指') : '');
    const ph = m >= 75 ? '一个多钟头' : m >= 58 ? '一个钟头上下' : m >= 42 ? '三刻钟左右' : m >= 28 ? '半个多钟头' : m >= 14 ? '不到半个钟头' : '不到一刻钟了';
    return { n, txt: '你伸直胳膊，手掌横过来，四指并拢，一指一指往下量。\n太阳底边离山脊——' + fs + '。\n一指一刻钟。大约还剩' + ph + '。' };
  }
  /* S.tone 合成的关键音效（双方都听得到） */
  const SND = {
    drum(S, k = 1) { S.tone('sine', 92, 46, .42, .32 * k, 0); S.tone('triangle', 180, 70, .12, .08 * k, 0, 700); },   // 纳格拉鼓
    drums(S) { [0, .5, .75, 1.25].forEach((d, i) => { S.tone('sine', 96, 44, .4, i === 0 ? .34 : .22, d); S.tone('triangle', 190, 70, .1, .06, d, 700); }); },
    ghungroo(S, k = 1) { for (let i = 0; i < 6; i++) S.tone('triangle', 2900 + (i % 3) * 260, 2700, .07, .022 * k, i * .045 + (i > 2 ? .18 : 0), 6000); },   // 脚铃
    conch(S, k = 1) { S.tone('sawtooth', 233, 247, 2.6, .05 * k, 0, 900); S.tone('triangle', 466, 494, 2.6, .03 * k, .05, 1600); S.tone('sine', 233, 247, 2.6, .05 * k, 0); },   // 海螺号
    whistle(S, n = 3) { for (let i = 0; i < n; i++) S.tone('square', 2350, 2450, i === n - 1 ? .55 : .2, .022, i * .28, 4200); },   // 守门人的哨子
    monkey(S) { [0, .09, .2, .33].forEach((d, i) => S.tone('triangle', 900 + i * 140, 700, .08, .03, d, 3000)); },
    chant(S) { for (let i = 0; i < 4; i++) S.tone('sawtooth', 98 + (i % 2) * 6, 96, .7, .045, i * .55, 500); S.tone('sine', 49, 49, 2.6, .12, 0); },   // 山上的念咒
    drip(S) { S.tone('sine', 1500, 420, .09, .07, 0); S.tone('sine', 1300, 380, .09, .05, .35); },
    rumble(S) { S.tone('sine', 55, 30, 1.6, .35, 0); S.tone('sawtooth', 40, 28, 1.4, .06, .1, 200); },
    pray(S) { S.tone('sine', 523, 523, 1.6, .06, 0); S.tone('sine', 784, 784, 1.4, .04, .3); }   // 小铃（神龛、苦行僧的油灯）
  };

  /* ---------- 人物 ---------- */
  const turban = (c, c2) => (g, d, fr, G, R) => {
    const h = G.hT;
    if (d === 0) { R(3, h - 2, 10, 4, c); R(4, h - 3, 8, 1, c); R(4, h - 1, 8, 1, c2); R(10, h - 2, 2, 2, shade(c, .2)); }
    else if (d === 3) { R(3, h - 2, 10, 5, c); R(4, h - 3, 8, 1, c); R(5, h, 6, 1, c2); }
    else { R(4, h - 2, 8, 4, c); R(5, h - 3, 6, 1, c); R(10, h + 1, 2, 3, c2); }
  };
  const faceless = skin => (g, d, fr, G, R) => { if (d === 0) { R(5, G.hT + 3, 6, 4, skin); R(6, G.hT + 7, 4, 1, shade(skin, -.05)); } else if (d === 1) R(4, G.hT + 3, 3, 4, skin); };
  const PEOPLE = {
    me: { key: 'bh-me', skin: '#f0cdb0', hair: '#1e1612', hs: 'bob', hat: 'straw', hatC: '#d8c08a', top: '#e8e2d4', top2: '#c8c0ae', bottom: '#8a7a5a', shoes: '#5a4632',
      extra(g, d, fr, G, R) { if (d === 3) { R(4, G.tT + 1, 8, 6, '#4a5a6a'); R(5, G.tT + 2, 6, 1, '#5e7082'); } else if (d === 1) R(10, G.tT + 1, 2, 6, '#4a5a6a'); } },
    yu: { key: 'bh-yu', skin: '#e8c4a0', hair: '#1a1410', hs: 'messy', hat: 'cap', hatC: '#2e3a2a', top: '#5a6a3a', top2: '#3a4628', bottom: '#2e3a52', shoes: '#d8d4c8',
      extra(g, d, fr, G, R) { if (d === 0) { R(12, G.tT + 2, 2, 1, '#1a1a1a'); R(13, G.tT - 2, 1, 5, '#2a2a2a'); R(12, G.tT - 4, 3, 3, '#141414'); R(13, G.tT - 3, 1, 1, '#6ab0e0'); } else if (d === 1) { R(2, G.tT + 1, 1, 4, '#2a2a2a'); R(1, G.tT - 1, 3, 3, '#141414'); } } },
    yuT: { key: 'bh-yuT', skin: '#d8c0a8', hair: '#1a1410', hs: 'messy', hat: 'cap', hatC: '#2e3a2a', top: '#5a6a3a', top2: '#3a4628', bottom: '#2e3a52', shoes: '#d8d4c8', eye: '#5a4a40',
      extra(g, d, fr, G, R) { if (d === 0) { R(5, G.hT + 4, 2, 1, '#d8c0a8'); R(9, G.hT + 4, 2, 1, '#d8c0a8'); R(5, G.hT + 5, 2, 1, '#3a2a20'); R(9, G.hT + 5, 2, 1, '#3a2a20'); } } },   // 被香油迷住：半闭着眼
    suresh: { key: 'bh-suresh', skin: '#8a5a3a', hair: '#1a1210', hs: 'short', top: '#ece8dc', top2: '#d8d2c2', bottom: '#e4dfd2', shoes: '#4a3020', coat: true,
      extra(g, d, fr, G, R) { turban('#e07a1a', '#c0401a')(g, d, fr, G, R); if (d === 0) { R(5, G.hT + 6, 6, 1, '#1a1210'); R(4, G.hT + 5, 1, 1, '#1a1210'); R(11, G.hT + 5, 1, 1, '#1a1210'); } else if (d === 1) R(3, G.hT + 6, 3, 1, '#1a1210'); } },
    guard: { key: 'bh-guard', skin: '#7a5236', hair: '#d8d4cc', hs: 'short', top: '#8a7a4a', top2: '#6a5a32', bottom: '#7a6a42', shoes: '#2a2018', hat: 'cap', hatC: '#6a5a32',
      extra(g, d, fr, G, R) { if (d === 0) { R(5, G.hT + 6, 6, 1, '#e8e4dc'); R(11, G.tT + 2, 1, 4, '#c8c8c0'); } else if (d === 1) R(3, G.hT + 6, 3, 1, '#e8e4dc'); } },
    resW: { key: 'bh-resW', skin: '#a89888', hair: '#1a1414', hs: 'long', hat: 'veil', hatC: '#8a3a28', top: '#9a6a3a', top2: '#7a4a28', bottom: '#7a3a2a', dress: true, ghost: true, eye: '#a89888', extra: faceless('#a89888') },
    resM: { key: 'bh-resM', skin: '#9a8a7a', hair: '#1a1414', hs: 'short', top: '#d8d0c0', top2: '#b8b0a0', bottom: '#d0c8b8', robe: true, ghost: true, eye: '#9a8a7a',
      extra(g, d, fr, G, R) { turban('#6a5a8a', '#4a3a6a')(g, d, fr, G, R); faceless('#9a8a7a')(g, d, fr, G, R); } },
    merch: { key: 'bh-merch', skin: '#9a8a7a', hair: '#1a1414', hs: 'short', top: '#c8b890', top2: '#a89870', bottom: '#c8b890', robe: true, eye: '#9a8a7a',
      extra(g, d, fr, G, R) { turban('#c8a040', '#8a6a20')(g, d, fr, G, R); faceless('#9a8a7a')(g, d, fr, G, R); } },
    maid: { key: 'bh-maid', skin: '#b0a090', hair: '#1a1414', hs: 'long', hat: 'veil', hatC: '#c89a3a', top: '#5a7a6a', top2: '#3a5a4a', bottom: '#4a6a5a', dress: true, ghost: true, eye: '#b0a090',
      extra(g, d, fr, G, R) { faceless('#b0a090')(g, d, fr, G, R); if (d === 0) { R(2, G.tT + 4, 12, 2, '#c8a040'); R(3, G.tT + 3, 10, 1, '#e8c860'); R(7, G.tT + 1, 2, 2, '#8a5a3a'); } else if (d === 1) { R(1, G.tT + 4, 6, 2, '#c8a040'); } } },
    ratna: { key: 'bh-ratna', skin: '#d8b898', hair: '#0e0a0a', hs: 'long', hat: 'veil', hatC: '#b8203a', top: '#a01830', top2: '#e8c050', bottom: '#8a1428', dress: true, ghost: true, eye: '#3a2020',
      extra(g, d, fr, G, R) { if (d === 0) { R(3, G.hT - 1, 10, 1, '#e8c050'); R(7, G.hT + 1, 2, 1, '#e8c050'); R(4, G.tT + 6, 8, 1, '#e8c050'); R(7, G.hT + 5, 2, 1, '#8a2a2a'); } else if (d === 1) R(3, G.hT - 1, 8, 1, '#e8c050'); } },
    singhia: { key: 'bh-singhia', skin: '#7a7470', hair: '#0c0a0a', hs: 'messy', top: '#1a1418', top2: '#3a1a1a', bottom: '#1a1418', robe: true, noFeet: true, eye: '#ff9a30', redEye: true,
      extra(g, d, fr, G, R) { const h = G.hT; R(4, h - 3, 8, 3, '#0c0a0a'); R(6, h - 4, 4, 1, '#0c0a0a'); if (d === 0) { R(7, h + 1, 2, 2, '#e04020'); R(5, h + 7, 6, 2, '#2a2420'); for (let i = 0; i < 5; i++) R(5 + i, G.tT + 2 + (i % 2), 1, 1, '#6a3a1a'); } else if (d === 1) { R(5, h + 1, 1, 2, '#e04020'); R(4, h + 7, 3, 2, '#2a2420'); } } }
  };

  /* ---------- 惊吓大头像（32×32） ---------- */
  const FACES = {
    /* 巫师辛吉亚：一头乱缠的黑发、额头一道朱红、烧着的橙色眼睛、灰白的脸、越张越大的嘴 */
    singhia(R, a) {
      const H = '#0a0808', H2 = '#24201c', SK = '#8a847e', SK2 = '#5e5a56', RD = '#e0401c', EY = '#ffb040', K = '#120606';
      R(5, 0, 22, 9, H); R(2, 4, 28, 10, H); R(1, 12, 30, 20, H); for (let i = 0; i < 7; i++) R(2 + i * 4, 1 + (i % 2) * 2, 2, 7, H2);
      R(8, 7, 16, 3, SK); R(6, 10, 20, 12, SK); R(7, 22, 18, 3, SK); R(21, 10, 5, 14, SK2); R(6, 15, 2, 6, SK2);
      R(14, 6, 4, 6, RD); R(15, 4, 2, 2, RD); R(10, 9, 12, 1, '#e8e0d0');   // 竖着的朱砂和一道白灰
      R(8, 12, 6, 3, K); R(18, 12, 6, 3, K); const g = a > .35 ? 1 : 0;
      R(9, 13 - g, 4, 1 + g * 2, EY); R(19, 13 - g, 4, 1 + g * 2, EY); R(10, 13, 2, 1, '#fff2c0'); R(20, 13, 2, 1, '#fff2c0');
      R(14, 15, 4, 4, SK2); R(13, 18, 2, 1, K); R(17, 18, 2, 1, K);
      const mh = 2 + Math.round(a * 5); R(10, 21, 12, mh, K); R(11, 21, 2, 2, '#c8b060'); R(19, 21, 2, 2, '#c8b060'); R(14, 21 + mh - 1, 4, 1, '#3a0a0a');
      R(7, 24, 18, 8, H2); R(8, 25, 16, 7, H);   // 胡子
      for (let i = 0; i < 9; i++) R(5 + i * 3, 30 - (i % 2), 2, 2, '#7a3a1a');   // 念珠
    },
    /* 城里的人：面纱底下一张光溜溜的脸，什么都没有——然后，那块皮肉慢慢凹下去 */
    ghost(R, a) {
      const V = '#8a2a1e', V2 = '#5a1a14', VG = '#c8a040', SK = '#b0a090', SK2 = '#8a7a6a', K = '#1a0c0a';
      R(4, 0, 24, 32, V); R(2, 8, 28, 24, V); R(6, 1, 20, 1, VG); R(3, 9, 1, 23, VG); R(28, 9, 1, 23, VG); R(5, 2, 2, 30, V2); R(25, 2, 2, 30, V2);
      R(9, 5, 14, 3, SK); R(8, 8, 16, 14, SK); R(9, 22, 14, 3, SK); R(11, 25, 10, 2, SK); R(20, 8, 4, 16, SK2);
      if (a > .3) { const k = Math.min(1, (a - .3) / .5); R(11, 12, 3, 1 + Math.round(k), SK2); R(18, 12, 3, 1 + Math.round(k), SK2); }
      if (a > .55) { const k = Math.min(1, (a - .55) / .4), h = 1 + Math.round(k * 5); R(14, 18, 4, h, K); R(15, 17, 2, 1, SK2); }
      R(0, 28, 32, 4, V2);
    }
  };

  /* ---------- 瓦片 ---------- */
  const TILES = {
    /* 白天的天空与阿拉瓦利山脊（太阳另画） */
    hillD: { solid: true, paint(R, X, Y) {
      if (Y === 0) { R(0, 0, 16, 6, '#e8a860'); R(0, 6, 16, 5, '#f0c070'); R(0, 11, 16, 5, '#f4d090'); if (hash(X, 1, 3) < .2) R((hash(X, 2, 3) * 12) | 0, 3, 5, 1, '#f4c890'); }
      else { R(0, 0, 16, 16, '#f4d090'); const h = (3 + Math.sin(X * .55) * 3 + hash(X, 0, 9) * 3) | 0; R(0, h, 16, 16 - h, '#7a6440'); R(0, h, 16, 1, '#9a8050'); for (let i = 0; i < 3; i++) if (hash(X, i, 21) < .5) R((hash(X, i, 22) * 14) | 0, h + 2 + i * 3, 2, 2, '#5a5a2e'); }
    } },
    hillN: { solid: true, paint(R, X, Y) {
      if (Y === 0) { R(0, 0, 16, 16, '#0a0e22'); for (let i = 0; i < 3; i++) if (hash(X, i, 50) < .35) R((hash(X, i, 51) * 15) | 0, (hash(i, X, 52) * 14) | 0, 1, 1, '#9aa4c8'); }
      else { R(0, 0, 16, 16, '#101632'); const h = (3 + Math.sin(X * .55) * 3 + hash(X, 0, 9) * 3) | 0; R(0, h, 16, 16 - h, '#06060c'); R(0, h, 16, 1, '#1a1e34'); }
    } },
    sdst: { solid: false, paint(R, X, Y) {   // 砂岩铺地
      R(0, 0, 16, 16, '#a88a62'); const o = Y % 2 ? 5 : 0;
      for (let i = -1; i < 3; i++) { R(o + i * 10, 0, 1, 16, '#8a6e4a'); }
      R(0, 15, 16, 1, '#8a6e4a'); if (hash(X, Y, 4) < .3) R(((hash(X, Y, 5) * 12) | 0) + 2, ((hash(X, Y, 6) * 10) | 0) + 3, 3, 1, '#967a54');
      if (hash(X, Y, 7) < .12) R(((hash(X, Y, 8) * 12) | 0) + 1, ((hash(X, Y, 9) * 12) | 0) + 2, 1, 2, '#6a7a3a');
    } },
    dust: { solid: false, paint(R, X, Y) { speck(R, '#94785a', ['#a08464', '#86694c', '#9c8060', '#7a6a3e'], X, Y, 20, 61); if (hash(X, Y, 62) < .1) R(((hash(X, Y, 63) * 12) | 0) + 2, 9, 4, 3, '#6e5e3a'); } },
    stp: { solid: false, paint(R, X, Y) { R(0, 0, 16, 16, '#9a7c56'); for (let y = 0; y < 16; y += 4) { R(0, y, 16, 1, '#c0a07a'); R(0, y + 3, 16, 1, '#6a5236'); } } },   // 阶梯井的台阶
    stair: { solid: false, paint(R, X, Y) { R(0, 0, 16, 16, '#8a6e4a'); for (let y = 1; y < 16; y += 5) { R(0, y, 16, 2, '#b89a70'); R(0, y + 2, 16, 1, '#5a4430'); } } },
    para: { solid: true, paint(R, X, Y) { R(0, 0, 16, 16, '#a88a62'); R(0, 6, 16, 10, '#8a6a46'); R(0, 6, 16, 2, '#c8a87a'); for (let x = 1; x < 16; x += 5) R(x, 9, 3, 4, '#5a4430'); R(0, 14, 16, 2, '#4a3828'); } },   // 露台矮墙（镂空）
    rub: { solid: true, paint(R, X, Y) { R(0, 0, 16, 16, '#94785a'); R(1, 6, 7, 7, '#7a6040'); R(6, 3, 8, 8, '#a08060'); R(9, 9, 6, 6, '#6a5236'); R(2, 12, 12, 3, '#4a3a28'); R(7, 4, 4, 2, '#c0a07a'); } }   // 塌下来的石块
  };
  /* ---------- 夜里的「月影」：哪些格子在影子里 ---------- */
  const STALLS = [
    { id: 's1', x: 7, sym: 'peacock', name: '孔雀', col: '#8a2a2a', hint: '孔雀……是会飞的。采买单上说，飞的那家不进。' },
    { id: 's2', x: 11, sym: 'fish', name: '鱼', col: '#2a3a7a', hint: '鱼是游的。采买单上说，游的那家不进。' },
    { id: 's3', x: 15, sym: 'lotus', name: '莲花', col: '#c87a1a', hint: '莲花开在水上。采买单上说，开在水上的那家也不进。' },
    { id: 's4', x: 19, sym: 'elephant', name: '大象', col: '#2a6a3a', hint: '' },
    { id: 's5', x: 23, sym: 'moon', name: '新月', col: '#d8d0c0', hint: '新月两头都是尖的。可壁龛里那个瓶底印，弧线的一头是往里卷着的。' }
  ];
  const ANSWER = 's4';
  const GATEX = 42;   // 汉努曼门里侧的灯下（x ≥ 42）
  function poolAt(x, y) {   // 灯下（夜里永远亮着的地方）
    if (y === 8 && STALLS.some(s => x === s.x || x === s.x + 1)) return true;
    if (x >= 25 && x <= 29 && y >= 2 && y <= 3) return true;   // 苦行僧小屋前的油灯
    if (x >= 39 && x <= 41 && y >= 7 && y <= 9) return true;   // 鸟食台边的火把
    if (x >= GATEX && y >= 7 && y <= 12) return true;           // 城门的灯
    return false;
  }
  function maskAt(x, y) {   // 月亮底下也照不到的地方
    if (y < 2) return false;
    if (x <= 6) return true;                                   // 宫殿的影子
    if (y === 4 && x <= 31) return true;                       // 北排铺子背后的小巷
    if (x === 27 && y >= 5 && y <= 7) return true;             // 通小屋的窄道
    if (x >= 30 && x <= 38 && y >= 4 && y <= 10) return true;  // 大榕树
    if (y === 11 && x >= 7 && x <= 38) return true;            // 南排铺子墙根
    if (y === 10 && (x === 11 || x === 12 || x === 23 || x === 24)) return true;   // 断柱的影子
    if (x >= 7 && x <= 8 && y >= 14 && y <= 16) return true;   // 神庙背阴
    if (x >= 31 && x <= 32 && y >= 13 && y <= 17) return true; // 舞女宅子的墙影
    return false;
  }
  let CLOUD_ON = false;
  const shadowAt = (x, y) => !poolAt(x, y) && (CLOUD_ON || maskAt(x, y));

  /* ---------- 精灵 ---------- */
  function sym(R, k, x, y, c) {   // 门楣上的浮雕小图（约 12×7）
    const d = shade(c, -.35);
    if (k === 'peacock') { R(x - 3, y, 6, 3, c); R(x + 2, y - 3, 1, 4, c); R(x + 3, y - 4, 2, 1, c); R(x + 4, y - 6, 1, 2, d); R(x - 5, y + 1, 2, 1, d); R(x - 2, y + 3, 1, 2, d); R(x + 1, y + 3, 1, 2, d); }
    else if (k === 'fish') { R(x - 7, y - 1, 5, 3, c); R(x - 6, y - 2, 3, 1, c); R(x - 9, y - 2, 2, 2, d); R(x - 9, y + 1, 2, 2, d); R(x - 3, y - 1, 1, 1, d); R(x + 2, y - 1, 5, 3, c); R(x + 3, y - 2, 3, 1, c); R(x + 7, y - 2, 2, 2, d); R(x + 7, y + 1, 2, 2, d); R(x + 2, y - 1, 1, 1, d); }
    else if (k === 'lotus') { R(x - 1, y - 3, 2, 4, c); R(x - 4, y - 1, 2, 3, c); R(x + 2, y - 1, 2, 3, c); R(x - 6, y + 1, 2, 2, c); R(x + 4, y + 1, 2, 2, c); R(x - 6, y + 3, 12, 1, d); }
    else if (k === 'elephant') { R(x - 4, y - 2, 7, 4, c); R(x + 2, y - 3, 3, 3, c); R(x + 5, y - 1, 1, 3, c); R(x + 4, y + 2, 2, 1, c); R(x + 4, y + 1, 1, 1, d); R(x - 4, y + 2, 1, 2, d); R(x - 2, y + 2, 1, 2, d); R(x, y + 2, 1, 2, d); R(x + 2, y + 2, 1, 2, d); }
    else if (k === 'moon') { R(x - 2, y - 3, 3, 1, c); R(x - 3, y - 2, 2, 4, c); R(x - 2, y + 2, 3, 1, c); R(x + 1, y - 4, 1, 1, c); R(x + 1, y + 3, 1, 1, c); }
  }
  const SPR_B = {
    hgate(g, e, t, R) {   // 汉努曼门（画在玩家上面；夜里门洞里是黑的）
      const S1 = '#b08a5a', S2 = '#8a6a42', S3 = '#c8a676', K = '#5a4630';
      if (e.lit) { R(0, -8, 32, 24, 'rgba(2,2,8,.82)'); }
      R(-10, -18, 10, 34, S2); R(32, -18, 10, 34, S2); R(-9, -17, 8, 32, S1); R(33, -17, 8, 32, S1);
      R(-12, -30, 56, 12, S2); R(-11, -29, 54, 10, S1); R(-12, -31, 56, 2, S3);
      for (let i = 0; i < 6; i++) R(-10 + i * 10, -36, 6, 6, S1);   // 城垛
      R(0, -18, 32, 4, S1); R(2, -14, 4, 3, S1); R(26, -14, 4, 3, S1); R(6, -12, 2, 2, S1); R(24, -12, 2, 2, S1);
      R(13, -27, 6, 7, '#d8601a'); R(14, -29, 4, 2, '#d8601a');   // 门楣上涂了朱砂的哈奴曼浮雕
      R(15, -44, 1, 14, '#5a4630'); R(16, -44, 8, 5, '#e87a1a'); R(16, -40, 5, 2, '#c0501a');   // 小旗
      R(-9, 8, 8, 2, K); R(33, 8, 8, 2, K);
    },
    asi(g, e, t, R) { R(0, 0, 2, 14, '#3a3a3a'); R(14, 0, 2, 14, '#3a3a3a'); box(R, -6, -16, 28, 18, '#1e4e9a', '#0e2a5a'); R(-4, -14, 24, 3, '#e8eef8'); for (let i = 0; i < 4; i++) R(-4, -9 + i * 3, 12 + (i * 7) % 12, 1, '#c8d4ec'); R(14, -3, 6, 1, '#c8d4ec'); },
    hshrine(g, e, t, R) {   // 墙上的哈奴曼小神龛
      R(1, -4, 14, 18, '#7a5a3a'); R(2, -3, 12, 16, '#c8a676'); R(3, -1, 10, 13, '#2a160c');
      R(6, 2, 4, 9, '#e0601a'); R(6, 0, 4, 3, '#e8701a'); R(5, 4, 1, 3, '#e0601a'); R(10, 4, 1, 3, '#e0601a'); R(7, 1, 1, 1, '#ffe0a0'); R(9, 1, 1, 1, '#ffe0a0');
      for (let i = 0; i < 6; i++) R(3 + i * 2, -1 + (i % 2), 1, 1, i % 2 ? '#f0c020' : '#f08020');   // 万寿菊花环
      R(5, 11, 6, 2, '#8a6a3a'); R(7, 10, 2, 1, Math.sin(t * 9) > 0 ? '#ffd060' : '#ffb030');   // 油灯
      R(7, -12, 1, 9, '#5a4630'); R(8, -12, 6, 4, '#e87a1a');
    },
    booth(g, e, t, R) { box(R, 0, -10, 16, 24, '#8a6a42'); R(-1, -13, 18, 4, '#5a4630'); R(3, -6, 10, 6, '#1a1410'); R(3, -3, 10, 3, '#6a5236'); R(3, -9, 10, 2, '#e8e0c8'); R(5, -9, 6, 1, '#4a3a28'); },
    chai(g, e, t, R) {   // 茶摊
      R(1, 12, 30, 2, 'rgba(0,0,0,.3)'); box(R, 0, 0, 32, 12, '#7a5a3a'); R(2, -2, 28, 3, '#5a4028');
      R(4, -7, 8, 6, '#5a5a5a'); R(5, -9, 6, 2, '#3a3a3a'); R(6, -6, 4, 2, '#e07020');   // 炉子
      R(5, -12, 6, 4, '#b8b0a0'); R(10, -11, 2, 1, '#b8b0a0');   // 壶
      for (let i = 0; i < 4; i++) R(16 + i * 3, -4, 2, 3, '#a8603a');   // 陶杯
      const s = (t * 6) | 0; R(7 + (s % 3) - 1, -16 - (s % 4), 1, 2, 'rgba(230,230,230,.35)'); R(8 - (s % 2), -20 - (s % 3), 1, 2, 'rgba(230,230,230,.25)');
    },
    cow(g, e, t, R) {   // 趴着反刍的白牛
      R(-2, 12, 24, 3, 'rgba(0,0,0,.25)'); R(-1, 3, 18, 9, '#e4ded2'); R(0, 2, 15, 2, '#f0ece2'); R(4, 6, 5, 4, '#cfc8ba');
      R(16, 0, 7, 7, '#e4ded2'); R(21, 3, 3, 3, '#c8a8a0'); R(17, -2, 1, 3, '#d8d0b0'); R(21, -2, 1, 3, '#d8d0b0'); R(18, 2, 1, 1, '#1a1a1a');
      R(-3, 5, 3, 1, '#cfc8ba'); R(-4, 6, 1, 3, '#3a3030'); if (Math.sin(t * 3) > .7) R(22, 6, 1, 1, '#c8a8a0');
    },
    monkey(g, e, t, R) {   // 叶猴：灰身子、黑脸，长尾巴垂下来
      const f = e.dir === 1 ? -1 : 1, X = x => f > 0 ? x : 16 - x - 1;
      R(X(5), 4, 6, 7, '#b8b4a8'); R(X(6), 0, 5, 5, '#c8c4b8'); R(X(7), 1, 3, 3, '#1a1a1a'); R(X(4), 10, 3, 3, '#a8a498');
      const sw = Math.round(Math.sin(t * 2 + e.px) * 2); R(X(10), 9, 1, 8, '#a8a498'); R(X(10) + sw, 16, 1, 6, '#a8a498');
    },
    stall(g, e, t, R) {   // 香油巷的小铺：白天是没顶的门洞，夜里挂上布棚、点着灯
      const S1 = '#b89a70', S2 = '#8a6e4a', S3 = '#d0b488';
      if (!e.lit) {
        R(1, -14, 30, 28, S2); R(2, -13, 28, 26, S1); R(6, -4, 20, 18, '#3a2a1a'); R(7, -3, 18, 3, '#4a3624');
        R(3, -13, 26, 8, S3); R(3, -6, 26, 1, S2); sym(R, e.sym, 16, -9, '#7a5a3a');
        R(1, -16, 6, 3, S2); R(25, -15, 7, 2, S2); if (hash(e.x, 3, 2) < .5) R(28, -2, 4, 6, '#a88a62');
        R(6, 12, 20, 2, '#6a5236');   // 磨凹的门槛
        return;
      }
      const C = e.col || '#8a2a2a';
      R(2, -12, 28, 26, '#4a3020'); R(6, -6, 20, 20, '#7a4a22'); R(6, -6, 20, 3, '#5a361a');
      for (let i = 0; i < 4; i++) for (let j = 0; j < 2; j++) R(8 + i * 5, -3 + j * 5, 2, 3, ['#e8c060', '#c84a3a', '#5aa070', '#e8e0d0'][(i + j) % 4]);   // 架子上的瓶子
      // 掌柜（没有脸）
      R(13, 2, 6, 6, '#c8b890'); R(13, -3, 6, 5, '#9a8a7a'); R(12, -5, 8, 3, '#c8a040'); R(13, -6, 6, 1, '#c8a040');
      R(4, 6, 24, 7, '#6a4428'); R(4, 6, 24, 1, '#9a6a40');   // 柜台
      if (e.s && e.s.done) { R(15, 3, 2, 3, '#a8603a'); R(15, 2, 2, 1, '#2a1a10'); R(13, 1, 6, 6, 'rgba(255,230,140,.18)'); }
      // 布棚 + 遮住门楣的布帘
      R(-2, -18, 36, 6, C); for (let i = 0; i < 6; i++) R(-2 + i * 6, -12, 3, 2, shade(C, .25));
      if (e.s && e.s.peek) { R(3, -13, 26, 6, S3); sym(R, e.sym, 16, -10, '#7a5a3a'); R(2, -14, 4, 7, shade(C, -.2)); }
      else { R(3, -13, 26, 6, shade(C, -.25)); R(3, -8, 26, 1, shade(C, -.45)); }
      R(29, -10, 1, 4, '#3a2a1a'); R(27, -6, 5, 4, '#c8a040'); R(28, -5, 3, 2, Math.sin(t * 11 + e.x) > -.2 ? '#ffe090' : '#ffc060');   // 黄铜吊灯
    },
    samadhi(g, e, t, R) {   // 苦行僧巴鲁·纳特的小屋（刷白的小圆顶）
      R(0, 12, 16, 3, 'rgba(0,0,0,.3)'); box(R, 0, 4, 16, 10, '#c8c0b0', '#8a8478'); R(2, -6, 12, 11, '#e0dace'); R(12, -6, 2, 11, '#bab4a6');
      R(3, -11, 10, 5, '#e8e2d6'); R(5, -13, 6, 2, '#e8e2d6'); R(7, -16, 2, 3, '#c8a040');
      R(6, -2, 4, 7, '#2a2018'); R(1, -6, 14, 1, '#a8a294');
      R(13, -22, 1, 12, '#6a5236'); R(14, -22, 6, 4, '#e8801a');
      R(6, 11, 4, 2, '#8a5a3a'); if (e.lit) { R(7, 9, 2, 2, Math.sin(t * 8) > 0 ? '#ffe080' : '#ffb040'); R(6, 8, 4, 1, 'rgba(255,220,120,.4)'); }
    },
    pillar(g, e, t, R) { R(2, 12, 14, 3, 'rgba(0,0,0,.25)'); R(4, -12, 8, 24, '#a88a62'); R(10, -12, 2, 24, '#8a6e4a'); R(3, -14, 10, 3, '#c0a27a'); R(3, -15, 4, 1, '#c0a27a'); R(3, 10, 10, 3, '#8a6e4a'); for (let y = -8; y < 10; y += 6) R(5, y, 5, 1, '#967a54'); },
    chab(g, e, t, R) {   // 鸟食台
      box(R, 0, 2, 32, 12, '#a88a62', '#6a5236'); R(1, 2, 30, 2, '#c8a87a'); R(12, -14, 8, 16, '#b89a70'); R(10, -18, 12, 4, '#c8a87a'); R(11, -19, 10, 1, '#d8c098');
      for (let i = 0; i < 5; i++) R(4 + i * 6, 5, 1, 1, '#e8e0c8');   // 撒在台上的谷子
    },
    torch(g, e, t, R) { R(7, -8, 2, 22, '#4a3420'); R(5, -11, 6, 4, '#6a4a2a'); if (e.lit) { const f = Math.sin(t * 13 + e.px) > 0; R(6, -16, 4, 5, '#ffb040'); R(7, f ? -19 : -18, 2, 3, '#ffe090'); } },
    temple(g, e, t, R) {   // 戈皮纳特神庙
      R(-2, 12, 52, 3, 'rgba(0,0,0,.3)'); box(R, -2, 0, 52, 14, '#b89a70', '#7a6040'); for (let i = 0; i < 6; i++) R(2 + i * 8, 6, 5, 2, '#8a6e4a');
      box(R, 4, -18, 22, 19, '#c8aa80', '#8a6e4a'); R(10, -10, 8, 11, e.lit ? '#6a3a1a' : '#2a1e14'); if (e.lit) R(13, -6, 2, 2, '#ffd060');
      R(26, -40, 18, 41, '#c0a078'); R(28, -46, 14, 6, '#c8aa80'); R(31, -50, 8, 4, '#c8aa80'); R(34, -54, 2, 4, '#c8a040');
      for (let y = -38; y < 0; y += 5) { R(26, y, 18, 1, '#9a7c56'); R(29, y + 2, 1, 2, '#9a7c56'); R(40, y + 2, 1, 2, '#9a7c56'); }
      R(4, -22, 22, 4, '#a88a62'); R(6, -25, 18, 3, '#b89a70');
    },
    havdoor(g, e, t, R) { R(1, -2, 14, 16, '#8a6e4a'); R(3, 0, 10, 14, e.lit ? '#5a3418' : '#2a1e14'); R(2, -4, 12, 3, '#b89a70'); R(5, -6, 6, 2, '#b89a70'); if (e.lit) { R(5, 4, 2, 2, '#ffd060'); R(9, 3, 1, 4, 'rgba(255,200,120,.4)'); } },
    pshade(g, e, t, R) {   // 白天：宫殿的影子从左边爬过来（边缘是宫殿轮廓的锯齿）
      const fr = e.s.fr ?? FRONT0; if (fr <= 0) return;
      const ox = e.px - e.sx, oy = e.py - e.sy, x0 = Math.max(0, (ox / T16) | 0), y0 = Math.max(2, (oy / T16) | 0);
      const x1 = Math.min(46, x0 + 22), y1 = Math.min(20, y0 + 14);
      for (let y = y0; y < y1; y++) {
        const jag = [0, .6, 1.2, .4, -.3, .9, 1.5, .2, -.5, .7][y % 10];
        const fx = fr + jag;
        for (let x = x0; x < x1; x++) {
          if (x + 1 <= fx) R(x * T16 - e.px, y * T16 - e.py, 16, 16, 'rgba(34,16,40,.34)');
          else if (x < fx) R(x * T16 - e.px, y * T16 - e.py, Math.round((fx - x) * 16), 16, 'rgba(34,16,40,.34)');
        }
      }
    },
    nshade(g, e, t, R) {   // 夜里：月亮照不到的地方更黑；云遮月时整条街都黑下来，只剩灯底下
      const cl = e.s.cl || 0;
      if (e.s.run) {   // 天亮前：灯全灭，整条街一样黑，只有城门那头亮
        const ox = e.px - e.sx, oy = e.py - e.sy, x0 = Math.max(0, (ox / T16) | 0), y0 = Math.max(2, (oy / T16) | 0), x1 = Math.min(46, x0 + 22), y1 = Math.min(20, y0 + 14);
        for (let y = y0; y < y1; y++) for (let x = x0; x < x1; x++) if (x < GATEX) R(x * T16 - e.px, y * T16 - e.py, 16, 16, 'rgba(4,4,16,.3)');
        return;
      }
      const ox = e.px - e.sx, oy = e.py - e.sy, x0 = Math.max(0, (ox / T16) | 0), y0 = Math.max(2, (oy / T16) | 0);
      const x1 = Math.min(46, x0 + 22), y1 = Math.min(20, y0 + 14);
      for (let y = y0; y < y1; y++) for (let x = x0; x < x1; x++) {
        if (poolAt(x, y)) continue;
        const X = x * T16 - e.px, Y = y * T16 - e.py;
        if (maskAt(x, y)) R(X, Y, 16, 16, 'rgba(2,2,12,.48)');
        else if (cl > 0) R(X, Y, 16, 16, `rgba(2,2,12,${.4 * cl})`);
        else if (hash(x, y, 77) < .25) R(X + ((hash(x, y, 78) * 12) | 0), Y + ((hash(x, y, 79) * 12) | 0), 2, 1, 'rgba(190,210,255,.18)');
      }
    },
    skyhud(g, e, t, R) {   // 右上角的小天空：白天看太阳离山脊几指，夜里看云有没有遮住月亮，最后看东边的天光
      const X = (typeof VW === 'number' ? VW : 320) - 50 - e.sx, Y = 20 - e.sy, md = e.s.md || 'day';
      R(X - 1, Y - 1, 46, 32, '#1a1410');
      if (md === 'day') {
        const m = Math.max(0, e.s.min ?? DAY0), k = 1 - m / DAY0;
        R(X, Y, 44, 30, k > .7 ? '#c86a3a' : '#e8a860'); R(X, Y + 15, 44, 15, k > .7 ? '#e0904a' : '#f0c070');
        for (let i = 0; i <= 5; i++) R(X + 2, Y + 25 - i * 4, i % 2 ? 2 : 3, 1, '#6a4a2a');   // 一指一格
        const sy = Y + 25 - Math.round(m / 15 * 4) - 3; R(X + 19, sy, 6, 6, k > .7 ? '#ff7a3a' : '#fff0a0'); R(X + 18, sy + 1, 8, 4, k > .7 ? '#ff7a3a' : '#fff0a0');
        R(X, Y + 25, 44, 5, '#5a4630'); for (let i = 0; i < 44; i += 4) R(X + i, Y + 24 - ((i * 7) % 3), 4, 2, '#5a4630');   // 山脊
      } else if (md === 'night') {
        const cl = e.s.cl || 0;
        R(X, Y, 44, 30, '#0c1430'); R(X + 6, Y + 4, 1, 1, '#9aa4c8'); R(X + 36, Y + 7, 1, 1, '#9aa4c8'); R(X + 30, Y + 20, 1, 1, '#9aa4c8');
        R(X + 17, Y + 8, 10, 10, '#eef2fa'); R(X + 16, Y + 10, 12, 6, '#eef2fa'); R(X + 21, Y + 11, 3, 2, '#c8d0e0');
        if (cl > 0) { const w = Math.round(44 * Math.min(1, cl)); R(X, Y + 6, w, 7, '#3a3e56'); R(X + 2, Y + 11, Math.max(0, w - 4), 6, '#2e3248'); R(X, Y + 4, Math.max(0, w - 10), 3, '#454a64'); }
        R(X, Y + 25, 44, 5, '#06060c');
      } else {
        const dn = e.s.dawn || 0;
        R(X, Y, 44, 30, '#141a36'); R(X, Y + 14, 44, 11, dn > .5 ? '#6a5a7a' : '#2a2a4a'); R(X, Y + 20, 44, 5, dn > .3 ? (dn > .75 ? '#f0b060' : '#a06a5a') : '#3a3050');
        R(X + 20, Y + 24 - Math.round(dn * 3), 6, 2, dn > .9 ? '#ffe0a0' : 'rgba(0,0,0,0)');
        R(X, Y + 25, 44, 5, '#06060c');
      }
    },
    sun(g, e, t, R) { const r = e.s.r || 0; R(2, 2, 12, 12, r > .5 ? '#f07a3a' : '#f8b050'); R(4, 1, 8, 14, r > .5 ? '#f07a3a' : '#f8b050'); R(1, 4, 14, 8, r > .5 ? '#f07a3a' : '#f8b050'); R(5, 4, 4, 3, r > .5 ? '#f8a060' : '#fce0a0'); },
    moon(g, e, t, R) {
      R(2, 2, 12, 12, '#e8ecf4'); R(4, 1, 8, 14, '#e8ecf4'); R(1, 4, 14, 8, '#e8ecf4'); R(8, 5, 3, 3, '#c8d0e0'); R(4, 9, 2, 2, '#c8d0e0');
      const cl = e.s.cl || 0; if (cl > 0) { R(-10, 5, 38, 7, `rgba(40,44,66,${.95 * cl})`); R(-4, 2, 26, 4, `rgba(40,44,66,${.9 * cl})`); R(-6, 11, 30, 4, `rgba(30,32,50,${.9 * cl})`); }
    },
    niche(g, e, t, R) {   // 寝宫墙上的壁龛
      R(3, 0, 10, 12, '#3a2a1c'); R(2, -1, 12, 2, '#c8a87a'); R(4, -3, 8, 2, '#c8a87a'); R(6, -4, 4, 1, '#c8a87a'); R(3, 11, 10, 2, '#b89a70');
      if (e.s.k === 'clue') { R(5, 9, 6, 2, e.lit ? '#2a1a0c' : '#4a3018'); if (e.lit) { R(6, 9, 4, 1, '#6a4a28'); R(9, 8, 1, 1, '#6a4a28'); } }
      else if (e.lit) { R(6, 9, 4, 2, '#8a6a3a'); R(7, 7, 2, 2, Math.sin(t * 9 + e.px) > 0 ? '#ffe080' : '#ffb040'); }
    },
    jharokha(g, e, t, R) {   // 凸窗
      R(0, -6, 16, 20, '#8a6e4a'); R(2, -2, 12, 14, e.lit ? '#2a3456' : '#e8c890'); for (let x = 3; x < 14; x += 3) R(x, -2, 1, 14, '#6a5236'); R(2, 4, 12, 1, '#6a5236');
      R(-1, -9, 18, 4, '#b89a70'); R(3, -12, 10, 3, '#c8aa80'); R(6, -14, 4, 2, '#c8aa80');
    },
    chhatri(g, e, t, R) {   // 山顶的小亭子：传说里巫师的住处
      if (e.s.crush) { R(0, 8, 16, 6, '#3a3028'); R(2, 6, 5, 3, '#4a3e32'); R(9, 5, 6, 4, '#4a3e32'); return; }
      const C = e.lit ? '#2a2420' : '#8a7458';
      R(1, 10, 14, 3, C); R(2, 1, 2, 9, C); R(12, 1, 2, 9, C); R(1, -2, 14, 3, C); R(3, -6, 10, 4, C); R(6, -8, 4, 2, C);
      if (e.lit) { const f = Math.sin(t * 9) > 0; R(6, 6, 4, 4, '#ff7020'); R(7, f ? 3 : 4, 2, 3, '#ffc050'); }
    },
    boulder(g, e, t, R) { R(-2, 12, 20, 3, 'rgba(0,0,0,.3)'); R(-1, -2, 18, 14, '#6a5a4a'); R(1, -4, 14, 4, '#7a6a58'); R(2, -2, 6, 3, '#8a7a66'); R(10, 6, 6, 5, '#54473a'); if (e.s.oil) { R(3, -3, 9, 2, 'rgba(255,230,150,.55)'); R(5, 0, 3, 8, 'rgba(255,230,150,.35)'); } },
    palm(g, e, t, R) { R(2, 7, 12, 3, '#c8b070'); R(2, 7, 12, 1, '#e0c890'); R(4, 8, 7, 1, '#6a5230'); R(1, 8, 1, 1, '#8a6a3a'); R(14, 8, 1, 1, '#8a6a3a'); },
    bottle(g, e, t, R) { R(5, 12, 6, 2, 'rgba(0,0,0,.3)'); R(6, 6, 4, 6, '#a8603a'); R(7, 4, 2, 2, '#8a4a2a'); R(7, 3, 2, 1, '#2a1a10'); R(6, 7, 1, 3, '#c8805a'); },
    arcade(g, e, t, R) { R(5, -14, 6, 26, '#b89a70'); R(9, -14, 2, 26, '#8a6e4a'); R(1, -18, 14, 4, '#c8aa80'); R(-3, -16, 4, 2, '#c8aa80'); R(15, -16, 4, 2, '#c8aa80'); R(4, 10, 8, 3, '#8a6e4a'); },
    fountain(g, e, t, R) { R(-4, 0, 40, 14, '#8a6e4a'); R(-2, 2, 36, 10, '#5a4a36'); R(0, 4, 32, 6, '#4a3e2e'); R(14, -4, 4, 10, '#a88a62'); R(12, -6, 8, 3, '#b89a70'); },
    parch(g, e, t, R) { R(-6, -20, 6, 36, '#8a6e4a'); R(32, -20, 6, 36, '#8a6e4a'); R(-8, -26, 48, 8, '#a88a62'); R(0, -18, 32, 3, '#a88a62'); R(4, -15, 3, 2, '#a88a62'); R(25, -15, 3, 2, '#a88a62'); }
  };
  /* ---------- 文本 ---------- */
  const NOTES = {
    asi: { title: '城门口的蓝色告示牌', text: '（蓝底白字，印地语一遍、英语一遍。你看得懂英语那一遍。）\n\n印度考古局\n巴恩加尔 · 受保护古迹\n\n· 日出之前、日落之后，严禁进入巴恩加尔范围。\n· 禁止在古迹内刻画、攀爬、生火。\n· 损坏或带走古迹内任何物品者，依法追究。\n\n（牌子右下角，有人用马克笔加了一行小字，又被谁用力擦过，只剩半截：\n「……STILL HERE」）' },
    balu: { title: '小屋前的木牌', text: '（木牌上的字是手写的。印地语下面，有人补了几行歪歪扭扭的英语。）\n\n巴鲁·纳特　修行之处\n\n很久以前，这座山脚下住着一位苦行僧。\n国王要在这里建城，先来求他。\n他说：可以。只有一条——\n「城里的房子，影子不能落到我身上。\n影子落下来的那天，城就没了。」\n\n后来的王，把宫殿一层一层往上加。\n有一天傍晚，宫殿的影子爬过整条集市，\n落在了这间小屋上。\n\n（最底下一行英语：\n村里人说，这里盖的屋顶，从来留不住。）' },
    sketch: { title: '速写本 · 集市北排', text: '（你的速写本。铅笔线条很快，旁边是随手记的字。）\n\n集市北边一排五间小铺，门脸窄，门楣上都刻着东西。\n苏雷什说，这一排以前卖香料和香油。\n\n从宫殿那头往城门数——\n一　孔雀。脖子弯着，尾巴被打掉了。\n二　鱼。两条，头对着头。\n三　莲花。八瓣，开在水波上。\n四　大象。鼻子往里卷着。\n五　一弯新月。两头尖尖的。\n\n门槛都被踩得凹下去了。\n几百年了，石缝里好像还有一点甜甜的花香。\n——大概是心理作用。' },
    list: { title: '侍女的采买单', text: '（一片窄窄的棕榈叶，用尖笔刻着字。那种弯弯绕绕的字，你一个也不认识——\n可你看着它，就是懂了。）\n\n给公主，买茉莉香油一瓶。\n\n去香油巷，认准门楣：\n飞的那家不进，游的那家不进，\n开在水上的那家，也不进。\n\n掌柜递过来的瓶子，瓶底按着他家的印。\n拿回来，放进寝宫的壁龛。\n公主梳头时要用。' }
  };
  const ITEMS = {
    phone: { name: '手机（没电了）', desc: '在城门口拍告示牌的时候，屏幕闪了一下，黑了。\n现在只能靠太阳看时间。' },
    oil: { name: '小陶瓶', desc: '拇指大的陶瓶，瓶口封着一层发黑的蜡，蜡上有道裂缝。\n离得老远，就是一股浓得发腻的茉莉香。\n瓶底的印磨得只剩一点凸起，看不出是什么。' },
    thread: { name: '红线', desc: '苏雷什从哈奴曼神龛前取下来、系在你手腕上的红黄两色棉线。\n「它替你挡一次。」' },
    book: { name: '速写本', desc: '画了半本拉贾斯坦的门、窗和台阶。铅笔快用完了。' }
  };

  /* ================= 白天：日影计时 ================= */
  function dayGoal(S) {
    if (S.f.ph !== 'day') return;
    if (S.f.foundYu) S.goal('带周屿回汉努曼门（赶在宫殿的影子爬到苦行僧的小屋之前）');
    else if (S.f.metGuard) S.goal('去集市尽头的宫殿找周屿（左边）· 看看影子爬到哪儿了');
    else S.goal('进城找周屿，日落前一起出来（双人：一个人盯着影子，一个人找人）');
  }
  function dayLight(S) {   // 天色随时间变暗、变红
    const k = 1 - Math.max(0, S.f.min) / DAY0, v = Math.round((.06 + k * .42) * 50) / 50;
    if (S.f._dk !== v) { S.f._dk = v; S.dark(v, 'bazaar'); S.dark(v, 'palace'); S.dark(Math.max(.04, v - .1), 'gate'); }
  }
  let WH30 = false, WH10 = false;   // 只在主机 tick 里用的瞬时量（重来时复位）
  function anchorTick(S) {   // 影子图层和小天空的锚点跟着镜头中心走（过场镜头移开时也不被裁掉）
    const cf = W.camFocus, ax = cf ? cf[0] * T16 : S.pl.px, ay = cf ? cf[1] * T16 : S.pl.py;
    for (const id of ['pshade', 'nshade', 'hudB', 'hudP']) { const e = getEnt(id, S.map); if (e) { e.px = ax; e.py = ay; } }
    const hud = getEnt(S.map === 'palace' ? 'hudP' : 'hudB', S.map);
    if (hud && !hud.hidden) {
      const md = S.f.ph === 'run' || S.f.ph === 'dawn' ? 'run' : S.f.ph === 'day' ? 'day' : 'night';
      if (hud.s.md !== md) hud.s.md = md;
      if (md === 'day') { const v = Math.round(Math.max(0, S.f.min ?? DAY0) * 2) / 2; if (hud.s.min !== v) hud.s.min = v; }
      if (md === 'night') { const v = CL.on ? 1 : CL.warn ? .45 : 0; if (hud.s.cl !== v) hud.s.cl = v; }
      if (md === 'run') { const v = Math.round((1 - Math.max(0, S.timerLeft ?? 0) / RUN_T) * 20) / 20; if (hud.s.dawn !== v) hud.s.dawn = v; }
      const cam = typeof CAM === 'object' ? CAM : { x: 0, y: 0 }, L = [[cam.x + VW - 28, cam.y + 35, 2.4, 1]];
      const k = L[0][0] | 0; if (S.f._hl !== k + '|' + (L[0][1] | 0)) { S.f._hl = k + '|' + (L[0][1] | 0); S.lights(L); }
    }
  }
  function runTick(S, dt) {   // 天一点点亮起来
    if (S.f.ph !== 'run') return;
    const k = 1 - Math.max(0, S.timerLeft ?? 0) / RUN_T, v = Math.round((.84 - k * .3) * 50) / 50;
    if (S.f._dr !== v) { S.f._dr = v; S.dark(v, 'bazaar'); S.dark(v, 'palace'); }
  }
  function dayTick(S, dt) {
    if (S.f.ph !== 'day' || S.map === 'gate') return;
    if (!S.busy) S.f.min -= dt * DAYRATE;
    dayLight(S);
    const sh = getEnt('pshade', 'bazaar'); if (sh) { const fr = Math.round(frontOf(S.f.min) * 4) / 4; if (sh.s.fr !== fr) sh.s.fr = fr; }
    for (const id of ['sunB', 'sunP']) { const e = S.ent(id); if (e) { const oy = Math.round((1 - Math.max(0, S.f.min) / DAY0) * 15); if (e.oy !== oy) e.oy = oy; e.s.r = S.f.min < 30 ? 1 : 0; } }
    if (S.busy) return;
    if (!WH30 && S.f.min < 30) { WH30 = true; SND.whistle(S, 3); S.toast('远处传来守门人的哨子——要清场了。'); }
    if (!WH10 && S.f.min < 10) { WH10 = true; SND.whistle(S, 5); S.toast('哨子又响了，又急又长。太阳快碰到山脊了！'); }
    if (S.f.min <= 0) { S.f.min = 0; S.run(nightfall); }
  }
  async function view(S, where) {   // 量太阳
    if (S.f.ph !== 'day') return S.narr(where === 'p' ? '露台外面是黑黢黢的山。\n山顶那座小亭子里，有一点火光。' : '月亮挂在宫殿上头，又白又冷。');
    cost(S, 1);
    const r = fingers(S);
    await S.narr((where === 'p' ? '露台朝西的一角，太阳正挂在山脊上方。\n' : where === 'g' ? '' : '你爬上鸟食台，朝宫殿那边望。太阳挂在宫殿背后的山脊上方。\n') + r.txt);
    if (where === 'b') await S.narr('宫殿的影子已经铺过了大半条' + (frontOf(S.f.min) > 18 ? '集市，离苦行僧的白色小屋不远了。' : '集市的西头，正一点一点往东爬。'));
    S.f.views = (S.f.views || 0) + 1;
  }
  /* ---------- 城门口 ---------- */
  async function sureshOn(S) {
    if (S.f.ph === 'dawn') return S.say('苏雷什', '回去吧，林小姐。上车。');
    if (S.f.ph !== 'day') return;
    if (!S.f.metSu) {
      S.f.metSu = true;
      await S.say('苏雷什', ['林小姐，您朋友先进去了，说要去宫殿上头「踩点」。', '我跟他说了：太阳落山之前，一定要出来。他就笑。']);
      await S.say('苏雷什', ['您的手机也没电了吧？那我教您一个老法子——', '伸直胳膊，手掌横过来，四根手指并拢。\n太阳底边到山脊之间，能放下几根手指，就还剩几个一刻钟。']);
      const r = fingers(S);
      await S.narr('你照着比了比。\n太阳离西边的山脊，差不多' + (r.n >= 5 ? '五指多。' : cnum(Math.max(1, Math.floor(r.n))) + '指。') + '\n——一个多钟头。');
      await S.say('苏雷什', ['还有，城里人看时间不用手。', '老人们说：宫殿的影子爬过集市，碰到苦行僧的小屋，就是关门的时候。\n您进去看一眼地上就知道了。']);
      S.f.min = DAY0; dayGoal(S);
      return;
    }
    const q = await S.ask('「林小姐，还有什么事？」', ['城里有什么说法？', '再说一遍量太阳的法子', '没事，我进去了'], '苏雷什');
    if (q === 0) {
      if (S.f.legend) return S.say('苏雷什', '公主、巫师、那瓶油……我都说过啦。快去快回。');
      S.f.legend = true; cost(S, 0);
      await S.say('苏雷什', ['说法多了。我奶奶讲的是公主的故事。', '巴恩加尔的公主叫拉特纳瓦蒂，十八岁，好看得整个拉贾斯坦都知道。', '城里有个会法术的人，叫辛吉亚。他配不上公主，就打起了歪主意。', '有一天，公主的侍女去集市买香油。辛吉亚在那瓶油上下了咒——\n谁抹了那瓶油，谁就会自己走到他身边去。', '公主一闻就知道不对。她把油泼在一块石头上。', '那块石头自己滚了起来，一路滚过去，把辛吉亚压在了底下。', '他死之前咒了这座城：城要毁，城里的人要死，死了也不得往生。', '……第二年打仗，公主死了。这座城，就空了。']);
      await S.say('苏雷什', '还有一个苦行僧的说法。他的小屋就在集市北边，白色的，您路过能看见。');
      return;
    }
    if (q === 1) return S.say('苏雷什', '胳膊伸直，四指并拢。太阳到山脊之间放得下几指，就还剩几个一刻钟。\n——我在这儿等您。别忘了，看影子。');
  }
  async function gateIn(S) {
    if (S.f.ph === 'day') {
      if (!S.f.metSu) { await S.think('苏雷什在茶摊那边朝你招手。\n……先过去跟他说一声。'); return S.pos(S.pl.x, 5, 0); }
      return S.go('bazaar', 44, 9, 1);
    }
    if (S.f.ph === 'dawn') { await S.think('……不。\n再也不进去了。'); return S.pos(S.pl.x, 5, 0); }
    return S.go('bazaar', 44, 9, 1);
  }
  async function gateDay(S) {   // 带着周屿在日落前走到城门口：提前一步
    S.f.early = true; S.f.ph = 'dusk';
    S.place('suresh', 13, 7, 3);
    await S.narr('你拽着周屿，从汉努曼门底下钻了出来。\n太阳还贴在山脊上。门外的停车场一片橙红。');
    await S.say('苏雷什', '出来了！好，好——');
    S.bubble('suresh', '?', 1500); await S.wait(500);
    await S.say('苏雷什', '……等等。什么味儿？\n茉莉……这么浓的茉莉？');
    S.face('suresh', 'yu');
    await S.say('苏雷什', '谁从城里拿了东西？', { style: 'big' });
    await S.say('周屿', S.f.lied ? ['……就一个小瓶子。', '我、我刚才没放回去。我想着带回去给观众看看——又不是什么文物——'] : ['……就一个小瓶子，壁龛里捡的。', '又不是什么文物，路边都是碎陶片——']);
    await S.say('苏雷什', ['放回去！现在！太阳还没落，还来得及！', '那座城里的东西，是不让带出门的！']);
    S.face('yu', 3);
    await S.narr('周屿嘟囔着转过身，往门里走了两步。');
    SND.drums(S); S.shake(500, 2);
    S.ent('hgate').lit = true;
    await S.narr('咚——！\n城里传出一声鼓响。\n门洞里面，天一下子黑了。\n门外还是傍晚，门里，已经是深夜。');
    S.ent('yu').spr = '@yuT';
    await S.say('周屿', '……她在叫我。', { style: 'whisper' });
    S.follow('yu', false);
    await S.walk('yu', [12, 3], 2.4);
    await S.alpha('yu', 0, 700);
    S.moveTo('yu', 'palace', 23, 3, 3); S.ent('yu').alpha = 1; S.hide('yu');
    S.place('oilG', 12, 4); S.sfx('drip');
    await S.narr('他走进了那片黑里。\n一个小陶瓶从他兜里掉出来，骨碌碌滚回到你脚边。');
    await S.say('苏雷什', ['林小姐！别慌，听我说——', '哈奴曼看着这扇门。']);
    S.sfx('select'); SND.pray(S);
    S.give('thread');
    await S.narr('苏雷什从门边的神龛前扯下一根红黄两色的线，飞快地系在你手腕上。');
    await S.say('苏雷什', ['这根线能替你挡一次。', '城里的东西，都在影子里走。月亮底下、灯底下，它们够不着你。', '记住：太阳出来的那一刻，人一定要站在城外。\n早一步，门不开；晚一步，就回不来了。']);
    setNight(S, true); S.show('yu');
    S.f.ph = 'night'; S.f.nightAt = 'gate';
    S.goal('捡起地上的小陶瓶，进城找周屿（他往宫殿那边去了）');
    S.cp('night');
    await takeOil(S, 'oilG');
    S.goal('进城找周屿（他往宫殿那边去了）');
  }
  /* 早到/迟到：夜里第一次想起来 */
  async function lateThought(S) {
    if (S.f.early || !S.once('late')) return;
    await S.think('……晚了。\n要是太阳落山之前回到城门口就好了。');
  }
  /* ---------- 城里（白天） ---------- */
  async function guardOn(S) {
    if (S.f.ph !== 'day') return;
    if (S.f.metGuard) return S.say('守门人', S.f.min < 30 ? '还看什么！影子都快到老苦行僧那儿了！' : '那个拍电影的小伙子？往宫殿去了。快去快回。');
    S.f.metGuard = true; cost(S, 2);
    await S.say('守门人', ['你也是一起的？那个举着小棍子拍电影的小伙子？', '往宫殿那边去了。我喊他，他就摆手。']);
    await S.say('守门人', ['你看地上。', '看见宫殿那头过来的影子了吗？等它爬到北边那间白色小屋，我就吹哨关门。', '关门以后，谁都别在里面。']);
    dayGoal(S);
  }
  async function lintelOn(S, st) {
    if (S.f.ph === 'day') {
      if (S.f.sketch) return S.narr('门楣上刻着' + st.name + '。\n你已经把这一排都画进速写本了。');
      await S.narr('一排窄窄的门脸，屋顶早就没了。门楣上刻着' + st.name + '，被风吹得只剩轮廓。');
      const r = await S.ask('把这一排门楣画下来吗？（要花一点时间）', ['画下来', '算了，先找人']);
      if (r) return;
      S.f.sketch = true; cost(S, 6); S.give('book', true);
      await S.narr('你蹲在路中间，一口气把五间铺子的门楣全画了下来。\n画到最后一笔，抬头一看，影子又往前爬了一截。');
      return S.note('sketch');
    }
    return stallNight(S, st);
  }
  async function samadhiOn(S) {
    if (S.f.ph === 'day') {
      if (!S.f.balu) { S.f.balu = true; cost(S, 3); await S.narr('白色的小圆顶，矮得要弯腰才能进门。门口立着一块木牌。'); await S.note('balu'); }
      else await S.narr('苦行僧的小屋。门口的油灯里没有油。');
      if (S.f.ph === 'day') await S.narr('你回头看了一眼。\n宫殿的影子正从集市西头爬过来——' + (frontOf(S.f.min) > 20 ? '已经很近了。' : '还隔着好长一段。'));
      return;
    }
    if (S.f.ph === 'run') return;
    if (!S.f.baluN) {
      S.f.baluN = true; SND.pray(S);
      await S.narr('小屋门口那盏油灯，自己亮着。\n火苗很小，一动不动。');
      await S.say('？？？', ['……孩子。影子落下来了。', '城里的人，只能在影子里走。月光底下，灯底下，他们够不着你。', '云遮住月亮的时候，到灯底下去。', '在影子里，别跑，也别动——他们是听脚步的。'], { style: 'whisper' });
      await S.say('？？？', ['那瓶油，不是你的，也不是那孩子的。让它回到它出来的地方去。', '天亮的那一刻，要站在城外。'], { style: 'whisper' });
      const r = await S.ask('油灯的火苗晃了一下。', ['双手合十，拜一拜', '轻轻退开']);
      if (r === 0) { S.f.bowB = true; SND.pray(S); await S.narr('你朝小屋拜了一拜。\n火苗直直地往上一蹿，又安静下来。'); }
      return;
    }
    return S.narr('油灯还亮着。照着门口一小块地方，暖暖的。');
  }
  async function hanuOn(S) {
    if (S.f.ph === 'dawn') return S.narr('神龛里的哈奴曼，脸上的朱砂被晨光照得发亮。');
    if (S.f.bowH) return S.narr('门边的小神龛里，供着涂满朱砂的哈奴曼。\n油灯的火苗安安静静的。');
    await S.narr('城门边的小神龛里，供着一尊涂满朱砂的哈奴曼，脖子上挂着万寿菊花环。\n脚边的油灯还亮着。');
    const r = await S.ask('', ['双手合十，拜一拜', '不打扰了']);
    if (r === 0) { S.f.bowH = true; SND.pray(S); await S.narr('你学着苏雷什的样子，双手合十，低了低头。'); }
  }
  /* 周屿跟着走时，切地图要把他一起带过去 */
  async function goWith(S, map, x, y, dir) {
    if (map === 'gate') { S.lights(null); S.f._hl = null; }
    const yu = S.ent('yu');
    if (yu && yu.follow) S.moveTo('yu', map, x, y, dir);
    await S.go(map, x, y, dir);
  }
  async function yuDayOn(S) {
    if (S.f.foundYu) return S.say('周屿', S.f.min < 25 ? '走走走，我跟着呢！' : '好啦好啦，我跟着你。');
    S.f.foundYu = true; cost(S, 4);
    S.face('yu', 'pl');
    await S.say('周屿', ['禾！你来得正好，你看这个光——', '再过一会儿太阳落到山后面，宫殿的影子会一直拖到集市那头。\n这个镜头我等了一下午。']);
    await S.say('林禾', '守门的已经在吹哨了。走。');
    await S.say('周屿', ['等等，给你看个好东西。', '在那边寝宫的壁龛里捡的。一个小陶瓶，几百年了，还香！\n我刚才在手腕上抹了一点——你闻。']);
    S.sfx('item');
    const r = await S.ask('他把手腕凑到你鼻子底下。浓浓的茉莉味。', ['凑过去闻一闻', '「你疯了？快放回去！」'], '');
    if (r === 0) {
      S.f.sniff = true;
      await S.narr('茉莉。甜得发腻，腻得人头晕。\n有那么一瞬间，你觉得背后的山上，好像有人在看你。');
      await S.say('林禾', '……这东西不对劲。放回去。');
    }
    await S.say('周屿', '好好好，放回去放回去。');
    await S.walk('yu', [11, 5], 4.5); S.hide('yu'); await S.wait(700); S.show('yu'); await S.walk('yu', [21, 5], 4.5);
    S.f.lied = true;
    await S.say('周屿', '放好了。走吧，大小姐。');
    S.follow('yu', true);
    dayGoal(S);
  }
  /* ---------- 日落：影子碰到苦行僧的小屋 ---------- */
  async function nightfall(S) {
    if (S.f.ph !== 'day') return;
    S.f.ph = 'dusk'; S.f.nightAt = S.map;
    const yuWith = !!S.ent('yu').follow;
    if (S.map === 'bazaar') {
      S.ent('pshade').s.fr = SAMX + 1;
      S.focus(27, 4); await S.wait(600);
      await S.narr('宫殿的影子爬过最后一截空地，\n轻轻地，搭在了苦行僧那间白色小屋的门槛上。');
    } else await S.narr('太阳的最后一道边，沉到了山脊后面。');
    SND.drums(S); S.shake(600, 2);
    await S.wait(400);
    setNight(S);
    await S.narr('咚——！\n鼓声。从城的四面八方一起响起来。\n天，一下子全黑了。');
    if (S.map === 'bazaar') {
      await S.narr('没有屋顶的铺子，一间一间挂上了布棚，点起了灯。\n路上多了许多人。他们来来往往，没有一点声音。');
      S.focus(null);
    } else await S.narr('残破的墙上，一盏一盏亮起了灯。\n远处的集市里，响起了很多很多人的脚步声——却没有一个人说话。');
    if (yuWith) {
      S.ent('yu').spr = '@yuT'; S.follow('yu', false);
      S.face('yu', S.map === 'bazaar' ? 1 : 3);
      await S.say('周屿', '……她在叫我。', { style: 'whisper' });
      const yx = Math.round(S.ent('yu').px / T16), yy = Math.round(S.ent('yu').py / T16);
      S.place('oilD', yx, yy); S.sfx('drip');
      if (S.map === 'bazaar') { await S.walk('yu', [Math.max(1, yx - 4), yy], 2.6); await S.alpha('yu', 0, 600); S.moveTo('yu', 'palace', 23, 3, 3); S.ent('yu').alpha = 1; }
      else { await S.walk('yu', [23, 3], 2.6); S.face('yu', 3); }
      await S.narr('周屿像梦游一样走了。\n一个小陶瓶从他兜里掉出来，留在了地上。');
      await S.think('……他抹在手腕上的那点油。');
      S.f.ph = 'night';
      S.goal('捡起地上的小陶瓶');
      S.cp('night');
      await S.walk('pl', [yx, yy], 4);
      await takeOil(S, 'oilD');
    } else {
      S.moveTo('yu', 'palace', 23, 3, 3); S.ent('yu').spr = '@yuT'; S.ent('yu').alpha = 1;
      await S.think('周屿……还在宫殿上面。');
    }
    S.f.ph = 'night';
    nightGoal(S);
    await lateThought(S);
    if (S.map === 'bazaar') await nightIntro(S);
    S.cp('night');
  }
  function setNight(S, outside) {
    for (const st of STALLS) { const e = S.ent(st.id); e.lit = true; e.off = false; e.col = st.col; }
    for (const id of ['samadhi', 'templeB', 'havdoor', 'torchB', 'torchG', 'jharo', 'chhatri']) { const e = S.ent(id); if (e) { e.lit = true; e.off = false; } }
    for (const id of ['guard', 'sunB', 'sunP', 'pshade', 'mk2', 'mk3p']) S.hide(id);
    for (const id of ['moonB', 'moonP', 'nshade', 'palmL', 'pmaid1', 'pmaid2', 'ratnaW']) S.show(id);
    for (const r of RES) if (!r.temp) S.show(r.id);
    for (let x = 0; x < 46; x++) { S.tile(x, 0, 'N', 'bazaar'); S.tile(x, 1, 'N', 'bazaar'); }
    for (let x = 0; x < 30; x++) { S.tile(x, 0, 'N', 'palace'); S.tile(x, 1, 'N', 'palace'); }
    for (const id of ['nicheC', 'n1', 'n2', 'n4']) S.ent(id).lit = true;
    S.dark(.62, 'bazaar'); S.dark(.66, 'palace');
    if (!outside) S.amb('otherworld');
    aiReset(S);
  }
  function nightGoal(S) {
    if (S.f.ph !== 'night') return;
    if (!S.has('oil')) return S.goal('去宫殿露台找周屿');
    const c = [];
    if (S.f.list) c.push('不进飞的、游的、开在水上的');
    if (S.f.imprint) c.push('瓶底印：一头往里卷的弧');
    if (c.length) return S.goal('把香油瓶放回它出来的那家铺子（' + c.join('；') + '）');
    if (S.f.yuN) return S.goal('在宫殿里找找：那瓶油原本是从哪儿来的？');
    S.goal('去宫殿找周屿（夜里的城，规矩不一样了）');
  }
  async function takeOil(S, from) {
    if (from) S.hide(from);
    S.give('oil');
    await S.narr((from ? '你捡起那个小陶瓶。' : '你把小陶瓶从他手心里拿了出来。') + '\n瓶口的蜡裂了一道缝，浓浓的茉莉香从缝里往外渗。');
    const r = await S.ask('香味钻进鼻子里，甜得人发昏。', ['收好，别再闻', '凑近闻一闻']);
    if (r === 0) { await S.narr('你用手帕把它裹了三层，塞进背包最里面。'); return nightGoal(S); }
    S.f.sniff = true; SND.chant(S);
    await S.narr('茉莉。茉莉底下，还有一股烧焦的头发味。\n很远的地方，有人在念什么——一个字一个字，念进你的脑子里。');
    await S.say('？？？', '……抹一点。抹在手腕上。\n……然后，到山上来。', { style: 'whisper' });
    const r2 = await S.ask('你的手指已经碰到了瓶口的蜡。', ['抹一点在手腕上', '猛地把瓶子塞回包里']);
    if (r2 === 1) { S.shake(200, 1); await S.narr('你把瓶子塞回包里，拉上拉链，手心全是汗。\n那个声音，慢慢地远了。'); return nightGoal(S); }
    return charmEnd(S);
  }
  async function charmEnd(S) {
    SND.chant(S);
    await S.narr('凉凉的，滑滑的。\n茉莉香一下子炸开，你什么都听不见了。');
    await S.narr('你站起来，往城后面的山上走。\n路很黑，可你的脚认得路。每一块石头，都在往山上指。');
    await S.scare('face', { spr: '@singhia', dur: 1 });
    return S.end({ bad: true, id: 'charm', title: '山上的灯', text: '第二天早上，苏雷什在门口等到了中午。\n\n后来，有放羊的人说，看见两个外国年轻人坐在城后山顶的破亭子里，\n一动不动，朝着山下的宫殿，像在等什么人。\n\n他走近一看，亭子里什么都没有。\n只有一股茉莉味，很浓，很浓。' });
  }

  /* ================= 夜里：月影 ================= */
  const RES = [
    { id: 'r1', path: [[3, 4], [3, 18]], spd: 2.2 },               // 宫殿的影子里来回走
    { id: 'r2', path: [[31, 4], [38, 4], [38, 10], [31, 10]] },    // 大榕树底下
    { id: 'r3', path: [[8, 11], [29, 11]] },                        // 南排铺子墙根
    { id: 'r4', path: [[5, 4], [30, 4]] },                          // 北排铺子背后的小巷
    { id: 'r5', temp: true, path: [[20, 11], [20, 11]] }            // 认错铺子时被惊动的那个
  ];
  const MOON_T = 12, CLOUD_T = 6, WARN_T = 2.2;
  let AI = {}, CL = { on: false, t: MOON_T, warn: false }, INV = 0, CAUGHT = false;
  const ZW = { chase: { zone: (x, y) => shadowAt(x, y) } };
  function aiReset(S) {
    CLOUD_ON = false; CL = { on: false, t: MOON_T, warn: false }; INV = 0; CAUGHT = false;
    const ns = S.ent('nshade'); if (ns) ns.s.cl = 0;
    for (const id of ['moonB']) { const e = S.ent(id); if (e) e.s.cl = 0; }
    for (const r of RES) {
      const e = S.ent(r.id); if (!e) continue;
      e.mv = null; e.chase = null; e.frozen = false;
      if (r.temp) { e.hidden = true; AI[r.id] = null; continue; }
      const [x, y] = r.path[0]; e.px = x * T16; e.py = y * T16; e.x = x; e.y = y; e.alpha = .9;
      AI[r.id] = { i: 1, st: 'walk', t: 0, wait: 0 };
    }
  }
  function setCloud(S, on) {
    CLOUD_ON = on; CL.on = on; CL.warn = false; CL.t = on ? CLOUD_T : MOON_T;
    const ns = S.ent('nshade'); if (ns) ns.s.cl = on ? 1 : 0;
    const mn = S.ent('moonB'); if (mn) mn.s.cl = on ? 1 : 0;
    S.dark(on ? .86 : .62, 'bazaar');
    if (on && S.once('cloud1')) S.toast('云遮住了月亮——影子连成了一片。待在灯底下！');
  }
  function stepToward(S, e, tx, ty, spd) {
    const m = W.maps[S.map], ex = Math.round(e.px / T16), ey = Math.round(e.py / T16);
    const d = bfsStep(m, ex, ey, tx, ty, ZW, 1600); if (d < 0) return false;
    const nx = ex + DIRS[d][0], ny = ey + DIRS[d][1];
    if (!shadowAt(nx, ny) && !(nx === S.pl.x && ny === S.pl.y)) return false;
    startMove(e, d, spd); return true;
  }
  function nightTick(S, dt) {
    if (S.map !== 'bazaar' || S.f.ph !== 'night' || S.busy) return;
    /* 云 */
    CL.t -= dt;
    if (!CL.on && !CL.warn && CL.t <= WARN_T) { CL.warn = true; S.tone('sine', 300, 180, 1.8, .05, 0, 500); S.toast('起风了——云要遮住月亮了！'); const mn = S.ent('moonB'); if (mn) mn.s.cl = .45; S.dark(.72, 'bazaar'); }
    if (CL.t <= 0) setCloud(S, !CL.on);
    if (INV > 0) INV -= dt;
    const p = S.pl, pS = shadowAt(p.x, p.y) && !p.hidden;
    if (S.has('oil') && p.x >= 34 && !S.f.horn) { S.f.horn = true; [0, .5].forEach(d => { S.tone('square', 415, 415, .35, .03, d, 1800); S.tone('square', 523, 523, .35, .025, d, 1800); }); S.toast('城门那边传来两声车喇叭——是苏雷什在门外？'); }
    for (const r of RES) {
      const e = S.ent(r.id), a = AI[r.id]; if (!e || e.hidden || !a || e.s.park) continue;
      const ex = Math.round(e.px / T16), ey = Math.round(e.py / T16);
      if (a.st === 'melt') {
        a.t -= dt; e.alpha = Math.max(.06, a.t / 1.2 * .9);
        if (a.t <= 0) { if (r.temp) { e.hidden = true; AI[r.id] = null; continue; } const [hx, hy] = r.path[0]; e.mv = null; e.px = hx * T16; e.py = hy * T16; e.x = hx; e.y = hy; e.alpha = .9; a.st = 'walk'; a.i = 1; }
        continue;
      }
      if (!e.mv && !shadowAt(ex, ey)) { a.st = 'melt'; a.t = 1.2; if (S.once('melt1')) S.toast('那个人一走到亮处，就像烟一样散了。'); continue; }
      const dist = Math.abs(ex - p.x) + Math.abs(ey - p.y);
      const R = (S.running ? 7 : S.moving ? 4.5 : 1.5) + (CL.on ? 1.5 : 0);
      const face = () => { const dx = p.x - ex, dy = p.y - ey; e.dir = Math.abs(dx) > Math.abs(dy) ? (dx < 0 ? 1 : 2) : (dy < 0 ? 3 : 0); };
      if (a.st === 'walk') {
        if (pS && dist <= R && INV <= 0) { a.st = 'alert'; a.t = .6; face(); S.bubble(r.id, '!', 900); S.tone('triangle', 660, 990, .25, .05, 0, 3000); if (S.once('spot1')) S.toast('被发现了！离开影子——到月光底下或者灯底下去！'); continue; }
        if (e.mv) continue;
        if (a.wait > 0) { a.wait -= dt; continue; }
        const [tx, ty] = r.path[a.i];
        if (ex === tx && ey === ty) { a.i = (a.i + 1) % r.path.length; a.wait = .4; continue; }
        if (!stepToward(S, e, tx, ty, r.spd || 1.8)) a.wait = .5;
      } else if (a.st === 'alert') {
        a.t -= dt; face();
        if (a.t <= 0) a.st = (pS && dist <= R + 3) ? 'chase' : 'walk';
      } else if (a.st === 'chase') {
        if (!pS || dist > 9) { a.lost = (a.lost || 0) + dt; if (a.lost > .8) { a.st = 'walk'; a.lost = 0; } } else a.lost = 0;
        if (!e.mv && pS) stepToward(S, e, p.x, p.y, CL.on ? 3.8 : 3.4);
      }
      if (a.st === 'chase' && pS && INV <= 0 && !CAUGHT && Math.abs(e.px - p.px) + Math.abs(e.py - p.py) < 12) { CAUGHT = true; S.run(s => caught(s, r.id)); return; }
    }
  }
  let DEATHS = 0;
  async function caught(S, id) {
    const e = S.ent(id);
    if (S.has('thread')) {
      S.take('thread'); S.f.threadUsed = true;
      S.sfx('cut'); S.fx('flash'); S.shake(300, 2);
      await S.narr('一只冰凉的手搭上你的手腕——\n「啪」。手腕上的红线断了。');
      await S.narr('那只手像碰到了火，猛地缩了回去。\n那个人散成了一团灰，飘回了影子里。');
      if (AI[id]) { AI[id].st = 'melt'; AI[id].t = 1.2; }
      INV = 2.5; CAUGHT = false;
      await S.think('……只能挡这一次。');
      return;
    }
    if (!S.f.graced) {
      S.f.graced = true; S.sfx('sting'); S.shake(300, 2);
      await S.narr('一只冰凉的手，擦过了你的手腕。\n你猛地一挣——挣脱了。');
      if (AI[id]) { AI[id].st = 'melt'; AI[id].t = 1.2; }
      INV = 2.5; CAUGHT = false;
      await S.think('下一次……就没这么走运了。\n离开影子！到月光底下、灯底下去！');
      return;
    }
    DEATHS++;
    await S.scare('face', { spr: '@resW', face: 'ghost', dur: .9 });
    return S.die(['一只冰凉的手搭上你的肩膀。\n那张没有五官的脸，凑到了你的耳边。\n\n你听见很多很多人，同时轻轻地说：\n「……留下来吧。」', '影子里伸出来的手，一只，两只，三只……\n它们没有用力，只是轻轻地拉着你。\n你就再也走不出那片影子了。'][DEATHS % 2], '你留在了影子里');
  }
  async function nightIntro(S) {   // 第一次在夜里的集市：看一个人走进月光里散掉
    if (!S.once('nintro')) return;
    const e = S.ent('r3'), a = AI.r3;
    S.focus(14, 10); e.px = 14 * T16; e.py = 11 * T16; e.mv = null; e.dir = 3; e.alpha = .9; if (a) { a.st = 'walk'; a.i = 0; }
    await S.narr('一个蒙着面纱的女人，从墙根的影子里走出来，迈进了月光。');
    await S.walk('r3', 'u', 1.2);
    await S.alpha('r3', .1, 900);
    await S.narr('她一碰到月光，就像一缕烟，散了。\n……片刻之后，墙根的影子里，又慢慢站起来一个人影。');
    e.px = 8 * T16; e.py = 11 * T16; e.alpha = .9; if (a) { a.st = 'walk'; a.i = 1; }
    S.focus(null);
    await S.think('他们只在影子里走。\n月光底下……灯底下……够不着我。');
    if (DEATHS) await S.think('在影子里别跑，也别乱动。云遮月的时候，躲到铺子的灯底下。');
  }
  /* ---------- 香油巷（谜题） ---------- */
  function puzzleHint(S) {
    const w = (S.f.wrong || 0) + Math.floor((S.f.hes || 0) / 2);
    if (w >= 4) return '从宫殿那头数，第四家。门楣上刻着大象的那家。';
    if (w >= 3) return S.f.imprint ? '壁龛里的瓶底印，弧线的一头是卷着的。新月两头都是尖的——\n只剩大象了。速写本上，大象是从宫殿那头数第几家？' : '寝宫墙上的壁龛……瓶子原来放在那儿，也许留下了瓶底的印。';
    if (w >= 2) return S.f.list ? '采买单说：飞的、游的、开在水上的都不进。\n孔雀、鱼、莲花都不是。剩下大象和新月。' : '侍女去哪家买油，宫殿里也许有人记着。去寝宫找找。';
    return S.f.sketch ? '布帘挡着门楣。白天画的速写本里，记着每一家门楣上刻的是什么。（日志里能翻）' : '布帘挡着门楣……白天要是把门楣画下来就好了。\n现在只能掀开布帘看——掌柜会发现的。';
  }
  async function wakeRes(S, near) {   // 惊动一个城里的人：从影子里出来找你（不刷在身边）
    const e = S.ent('r5'), p = S.pl;
    const cand = [];
    for (let y = 4; y <= 11; y++) for (let x = 3; x <= 30; x++) { const d = Math.abs(x - p.x) + Math.abs(y - p.y); if (d >= 4 && d <= 7 && maskAt(x, y) && !poolAt(x, y) && passable(W.maps.bazaar, x, y, e)) cand.push([x, y, d]); }
    if (!cand.length) return;
    cand.sort((a, b) => a[2] - b[2]); const [x, y] = cand[0];
    S.place('r5', x, y, 3); e.alpha = 0; await S.alpha('r5', .9, 400);
    AI.r5 = { i: 0, st: 'alert', t: 1.2, wait: 0 }; S.bubble('r5', '!', 1100);
    if (near) S.toast('影子里站起来一个人，朝这边转过了头。');
  }
  async function stallNight(S, st) {
    const e = S.ent(st.id);
    if (S.f.ph === 'given' || S.f.ph === 'run' || S.f.ph === 'scene') return S.narr(st.id === ANSWER ? '掌柜朝你点了点头。\n至少……你觉得那是点头。' : '没有脸的掌柜坐在柜台后面，一动不动。');
    if (!S.has('oil')) return S.narr('没有脸的掌柜坐在柜台后面。\n架子上一排排小陶瓶，满屋子都是花香。');
    if (S.once('stall1')) await S.narr('布棚底下点着一盏黄铜灯。架子上摆满了小陶瓶，玫瑰、檀香、茉莉……\n柜台后面坐着掌柜。头巾底下，没有脸。');
    if (!e.s.peek && !S.f.sketch) {
      const r = await S.ask('门楣被布帘遮住了，看不见刻的是什么。', ['掀开布帘看一眼', '把香油瓶放在这家', '先不动']);
      if (r === 2) { S.f.hes = (S.f.hes || 0) + 1; if (S.f.hes % 2 === 0) await S.think(puzzleHint(S)); return; }
      if (r === 0) {
        e.s.peek = true; S.sfx('tear');
        await S.narr('你踮起脚，掀开布帘一角——门楣上刻着' + st.name + '。');
        S.bubble(st.id, '!', 900); await S.narr('柜台后面那张没有五官的脸，慢慢朝你转了过来。');
        await wakeRes(S, true);
        return;
      }
    } else {
      const r = await S.ask('把香油瓶放在这家的柜台上吗？' + (e.s.peek ? '（门楣：' + st.name + '）' : ''), ['放下', '先不动']);
      if (r) { S.f.hes = (S.f.hes || 0) + 1; if (S.f.hes % 2 === 0) await S.think(puzzleHint(S)); return; }
    }
    if (st.id === ANSWER) return rightStall(S, st);
    S.f.wrong = (S.f.wrong || 0) + 1;
    S.sfx('sting'); S.shake(300, 2);
    await S.narr('你把小陶瓶放在柜台上。\n掌柜没有伸手。那张没有五官的脸，一点一点抬了起来，对着你。');
    if (S.f.wrong === 1) await S.scare('face', { spr: '@merch', face: 'ghost', dur: .8 }); else S.fx('red');
    await S.narr('瓶子在柜台上自己滚了半圈，滚回到你手边。\n……不是这家。');
    await wakeRes(S, true);
    if (st.hint && (S.f.list || S.f.imprint)) await S.think(st.hint);
    await S.think(puzzleHint(S));
  }
  async function rightStall(S, st) {
    S.take('oil'); S.f.ph = 'given'; const e = S.ent(st.id); e.s.done = true; e.s.peek = true;
    for (const r of RES) { const x = S.ent(r.id); if (x && !x.hidden) { x.mv = null; if (AI[r.id]) AI[r.id].st = 'walk'; } }
    setCloud(S, false); CL.t = 999;
    SND.pray(S);
    await S.narr('你把小陶瓶放在柜台上。\n掌柜伸出手，把它拿起来，在瓶底按了一下——按上了他家的印。');
    await S.narr('门楣上的布帘被风掀开了一角。底下刻着一头卷着鼻子的大象。');
    SND.ghungroo(S);
    const m = S.ent('maidB'); S.place('maidB', st.x + 1, 9, 3); m.alpha = 0; await S.alpha('maidB', 1, 600);
    await S.narr('叮铃，叮铃。\n一个端着铜盘的侍女，不知什么时候站在了你身后。她也没有脸。');
    await S.narr('掌柜把陶瓶放进她的铜盘里。\n她转过身，朝宫殿走去。脚铃一路响着。');
    for (const r of RES) { const x = S.ent(r.id); if (x && !x.hidden) S.face(r.id, 1); }
    await S.walk('maidB', [st.x + 1, 10], 2.4); SND.ghungroo(S, .7);
    await S.walk('maidB', 'llll', 2.4);
    await S.alpha('maidB', 0, 600);
    await S.narr('满街没有脸的人，都停下了脚步，转过身，朝着她走的方向。');
    S.goal('跟着侍女回宫殿');
    S.cp('night');
  }
  async function bazaarLeft(S) {   // 集市西头 → 宫殿
    if (S.f.ph === 'run') return S.pos(2, S.pl.y, 2);
    if (S.f.ph === 'day' && !S.f.metGuard && S.once('leftHint')) await S.think('……宫殿。周屿要拍宫殿，多半在上面。');
    return goWith(S, 'palace', 14, 18, 3);
  }
  async function bazaarRight(S) {   // 集市东头 → 城门
    if (S.f.ph === 'day') {
      if (!S.f.foundYu) { await S.think('周屿还没找到。\n……不能一个人出去。'); return S.pos(43, S.pl.y, 1); }
      await goWith(S, 'gate', 12, 4, 0);
      return;
    }
    if (S.f.ph === 'run') { await S.think('门洞里还是一片漆黑。\n……等太阳。'); return S.pos(43, S.pl.y, 1); }
    if (S.has('oil')) {
      await S.narr('门洞里黑漆漆的。\n可是在那片黑的尽头，你看见了一点车灯——是苏雷什的车。\n他在门外等着。');
      const r = await S.ask('门开着一条缝。外面就是停车场。', ['就这样出去', '不行，周屿还在里面']);
      if (r === 0) return oilEnd(S);
      return S.pos(43, S.pl.y, 1);
    }
    await S.think('门外还是黑的。\n「太阳出来的那一刻，人要站在城外」——还不是时候。');
    return S.pos(43, S.pl.y, 1);
  }
  async function oilEnd(S) {
    await S.narr('你攥着背包带，侧身从门缝里挤了出去。\n身后，鼓声停了。');
    await S.narr('苏雷什靠在车门上睡着了。你把他摇醒，他看看你，又看看你身后——\n「……您朋友呢？」');
    return S.end({ bad: true, id: 'oil', title: '茉莉香', text: '周屿再也没有从那扇门里走出来。\n搜救队找了三天。考古局的人说，城里的规矩写在牌子上，写得清清楚楚。\n\n回国以后，你的背包怎么洗都是一股茉莉味。\n小陶瓶就在包底，裹着三层手帕。你不记得自己是什么时候把它装进去的。\n\n每天夜里，你都会梦见一座没有屋顶的城。\n梦里有人在山上，一遍一遍地喊你过去。' });
  }

  /* ---------- 宫殿（夜里） ---------- */
  async function nicheOn(S, e) {
    if (e.s.k !== 'clue') return S.narr(S.f.ph === 'day' ? '墙上的小壁龛，里面空空的，积着一层灰。' : '壁龛里摆着一盏小油灯，火苗一动不动。');
    if (S.f.ph === 'day') return S.narr('这个壁龛里的灰被抹掉了一块，底下有一圈新鲜的油印子。\n……有人刚从这儿拿走了一个小瓶子。');
    if (!S.f.imprint) { S.f.imprint = true; S.sfx('paper'); }
    await S.narr('壁龛底部的灰泥上，压着一圈油印。\n油印正中，是瓶底按下去的一个小小的印子——\n一道弯弯的弧线，一头往里卷着，像一截卷起来的什么东西。');
    if (S.f.list) await S.think('采买单上说：瓶底按着掌柜家的印。\n这就是那家铺子的记号。');
    nightGoal(S);
  }
  async function palmOn(S) {
    S.f.list = true;
    await S.narr('地上掉着一片窄窄的棕榈叶，叶面上刻满了字。');
    await S.note('list');
    if (S.f.imprint) await S.think('瓶底按着掌柜家的印……壁龛里那个卷着的印子，就是那家铺子的记号。');
    else await S.think('「拿回来，放进寝宫的壁龛」……\n瓶子原来就放在这间屋里。壁龛里，会不会还留着它的印？');
    nightGoal(S);
    if (S.once('coopT')) S.toast('双人：一个人翻日志里的速写本和采买单念线索，一个人去香油巷的铺子');
  }
  async function yuNightOn(S) {
    if (S.f.ph === 'given' || S.f.ph === 'scene') return;
    await S.narr('周屿站在露台边上，脸朝着城后面的山。\n眼睛半闭着，嘴唇在动。他手腕上的茉莉味，浓得像一团雾。');
    await S.say('周屿', '……她在山上……不，他在山上……他在叫我……', { style: 'whisper' });
    if (!S.has('oil') && !S.f.gotOil && S.f.ph === 'night') {
      S.cp('night');
      S.f.gotOil = true;
      await S.narr('他攥着拳头。你掰开他的手指——掌心里是一个小陶瓶。');
      await takeOil(S, null);
      S.cp('night');
    }
    await S.narr('你喊他，摇他，掐他的胳膊。他一点反应都没有。');
    await S.think('只要那瓶油还在作祟，他就醒不过来。\n' + (S.f.baluN ? '「让它回到它出来的地方去」……' : '这瓶油……是从哪儿来的，就该回到哪儿去。'));
    S.f.yuN = true; nightGoal(S);
  }
  async function hillOn(S) {
    if (S.f.ph === 'day') return view(S, 'p');
    if (S.f.ph !== 'night' || !S.once('hill')) return S.narr('山顶那座小亭子里，火光一跳一跳。');
    SND.chant(S);
    await S.narr('露台外面是城后的山。\n山顶上那座小亭子里，亮着一点火光。');
    await S.narr('火光前面，坐着一个人。\n他好像察觉到了你的目光——慢慢地，转过头来。');
    await S.scare('face', { spr: '@singhia', dur: .9 });
    await S.narr('……你回过神时，亭子里只剩下火光。\n念咒的声音，还在一下一下地往你耳朵里钻。');
  }
  async function palaceEnter(S, first) {
    S.amb(S.f.ph === 'day' ? 'wind' : S.f.ph === 'run' ? 'drone' : 'otherworld');
    if (S.f.ph === 'night' && S.once('pnight')) {
      await S.narr('夜里的宫殿，墙上一盏盏小油灯亮着。\n几个蒙着面纱的侍女站在回廊下，面朝着墙，一动不动。');
      await S.think('周屿……在露台上吗？');
      S.cp('night');
    }
    if (S.f.ph === 'given') return palaceScene(S);
    if (S.f.ph === 'day' && first) { await S.narr('宫殿一层层叠在山坡上，拱门套着拱门，屋顶全塌了。\n上面的露台上，有人在挥手——是周屿。'); }
  }
  /* ---------- 公主泼油 ---------- */
  async function palaceScene(S) {
    S.f.ph = 'scene';
    const m = S.ent('pmaid'), rt = S.ent('ratna');
    S.place('pmaid', 14, 17, 3); m.alpha = 1;
    SND.ghungroo(S);
    await S.narr('脚铃声在你前面。端着铜盘的侍女，正一级一级走上台阶。');
    await Promise.all([S.walk('pmaid', [22, 5], 3.4), (async () => { await S.wait(500); await S.walk('pl', [19, 6], 3.4); })()]);
    S.face('pl', 2);
    S.place('ratna', 24, 4, 1); rt.alpha = 0; await S.alpha('ratna', 1, 900);
    await S.narr('露台上站着一个姑娘。红色的长裙，面纱上缀着金线。\n周屿就站在她身边，像一根木头。');
    S.face('pmaid', 2); SND.ghungroo(S, .6);
    await S.narr('侍女跪下来，把铜盘举过头顶。\n姑娘拿起那个小陶瓶，揭开蜡封，凑到面纱底下闻了闻。');
    await S.alpha('pmaid', 0, 600);
    await S.say('拉特纳瓦蒂', '……这油，下过咒。', { style: 'whisper' });
    S.focus(24, 2); SND.chant(S);
    await S.narr('她抬起头，望向山顶那点火光。\n念咒的声音一下子变响了，像是有人急了。');
    await S.walk('ratna', 'r', 1.6); S.face('ratna', 2);
    S.ent('rock').s.oil = true; SND.drip(S); S.sfx('water');
    await S.narr('她走到露台角上那块大石头跟前，把一整瓶油，泼在了石头上。');
    SND.rumble(S); S.shake(1200, 3);
    await S.narr('石头动了。');
    const rk = S.ent('rock'); rk.solid = false;
    const path = [[27, 2.4], [26.6, 1.8], [26, 1.3], [25.4, 1], [24.8, .9], [24.3, .9]];
    for (const [x, y] of path) { rk.px = x * T16; rk.py = y * T16; S.shake(200, 2); S.sfx('thud'); await S.wait(260); }
    SND.rumble(S); S.shake(900, 4); S.fx('flash');
    S.ent('chhatri').s.crush = true; S.ent('chhatri').off = true; S.hide('rock');
    await S.scare('face', { spr: '@singhia', sfx: 'scream', dur: 1.1 });
    await S.say('山上的声音', ['巴恩加尔——！', '城要倒……城里的人要死……\n死了，也不得往生……！'], { style: 'big' });
    S.amb('wind');
    await S.narr('喊声断了。\n山顶的火光灭了。满城的鼓声，也一下子停了。');
    S.focus(null);
    S.face('ratna', 1);
    await S.narr('姑娘转过身，第一次看向你。\n面纱底下，你看不清她的脸。');
    await S.say('拉特纳瓦蒂', ['天要亮了。', '……走吧。别让太阳在城里找到你。'], { style: 'whisper' });
    await S.alpha('ratna', 0, 1200);
    S.ent('yu').spr = '@yu'; S.sfx('thud');
    await S.narr('周屿腿一软，坐在了地上。');
    await S.say('周屿', ['……禾？', '我怎么在这儿？天怎么黑了？我的相机呢——']);
    await S.say('林禾', '别问了。跟紧我，跑！');
    S.follow('yu', true);
    await runStart(S);
  }
  /* ---------- 天亮前跑出城 ---------- */
  const RUN_T = 32;
  let LAST_LEFT = null;
  const RUNNERS = [['r1', 3, 5], ['r2', 34, 6], ['r3', 14, 4], ['r4', 24, 4], ['r5', 41, 15], ['r6', 17, 17]];   // 从身后、两侧和开阔地扑过来，不堵在一格宽的口子上
  async function runStart(S) {
    S.f.ph = 'run';
    SND.rumble(S); S.shake(800, 3);
    for (const [x, y] of [[20, 8], [20, 9], [20, 10], [20, 11], [36, 8], [36, 9], [36, 10]]) S.tile(x, y, 'X', 'bazaar');
    for (const st of STALLS) S.ent(st.id).off = true;
    S.ent('torchB').off = true; S.ent('samadhi').off = true;
    const ns = getEnt('nshade', 'bazaar'); ns.s.run = 1; ns.s.cl = 0; S.hide('moonB'); S.hide('moonP');
    await S.narr('脚底下的石头在抖。\n远处传来轰隆隆的声音——集市那边，有墙塌了。');
    await S.narr('满城的灯，一盏接一盏地灭了。\n街上那些没有脸的人，全都转过身来，朝着宫殿这边。\n巫师的咒还在：城里的人，一个都不许走。');
    SND.conch(S, .5);
    await S.narr('很远很远的地方，村子里的庙吹响了海螺。\n东边的天，透出了一线灰白。');
    await S.think((S.f.early ? '苏雷什说过：「太阳出来的那一刻，人一定要站在城外。」' : S.f.baluN ? '苦行僧说过：「天亮的那一刻，要站在城外。」' : '「别让太阳在城里找到你」——\n天一亮，人就得在城外！') + '\n汉努曼门在集市的另一头！');
    LAST_LEFT = null;
    S.goal('日出之前跑到汉努曼门的灯下（集市最东头）！');
    S.f.runLeft = RUN_T;
    S.cp('run');
    S.timer(RUN_T, '日出', sunrise, { during: true });
  }
  function runChase(S) {
    for (const [id, x, y] of RUNNERS) {
      const e = S.ent(id); if (!e) continue;
      e.s.park = false; S.place(id, x, y, 0); e.alpha = .9; e.mv = null;
      S.chase(id, { spd: 3.0, zone: (zx, zy) => zx < GATEX - 2, wander: false, catch: runCaught });
    }
  }
  async function runCaught(S) {
    LAST_LEFT = S.timerLeft;
    if (S.has('thread')) {
      S.take('thread'); S.f.threadUsed = true; S.sfx('cut'); S.fx('flash');
      S.toast('手腕上的红线「啪」地断了——那只手缩了回去！');
      const g = GEN;
      for (const [id] of RUNNERS) { const e = S.ent(id); if (e && Math.abs(e.px - S.pl.px) + Math.abs(e.py - S.pl.py) < 40) { S.stop(id); e.alpha = .3; setTimeout(() => { if (g === GEN && W && W.f.ph === 'run' && !e.hidden) { e.alpha = .9; S.chase(id, { spd: 3.0, zone: (zx, zy) => zx < GATEX - 2, wander: false, catch: runCaught }); } }, 1500); } }
      return;
    }
    if (!S.f.gracedR) {
      S.f.gracedR = true; S.sfx('sting'); S.shake(300, 2);
      S.toast('有只手抓住了你的衣角——你挣开了！别停！');
      const g = GEN;
      for (const [id] of RUNNERS) { const e = S.ent(id); if (e && Math.abs(e.px - S.pl.px) + Math.abs(e.py - S.pl.py) < 40) { S.stop(id); e.alpha = .3; setTimeout(() => { if (g === GEN && W && W.f.ph === 'run' && !e.hidden) { e.alpha = .9; S.chase(id, { spd: 3.0, zone: (zx, zy) => zx < GATEX - 2, wander: false, catch: runCaught }); } }, 1500); } }
      return;
    }
    DEATHS++;
    S.clearTimer();
    await S.scare('face', { spr: '@resW', face: 'ghost', dur: .8 });
    return S.die('它们没有用力，只是拉着你的衣角，拉着你的胳膊。\n一只，两只，三只……\n\n东边的山脊上，太阳出来了。\n可是它照不进这座城。', '天亮了，你还在城里');
  }
  async function sunrise(S) {
    S.clearTimer();
    for (const [id] of RUNNERS) S.stop(id);
    if (S.map === 'bazaar' && S.pl.x >= GATEX) return dawnEnd(S);
    return stayEnd(S);
  }
  async function stayEnd(S) {
    SND.conch(S);
    await S.narr('第一道阳光，从东边的山脊上越过来，落在汉努曼门的门楣上。\n你还在城里。');
    await S.narr('四周没有脸的人，一个接一个地停下来，转过身，朝你点了点头。\n像是在欢迎什么人。');
    return S.end({ bad: true, id: 'stay', title: '没有屋顶的城', text: '苏雷什在门外等到了日上三竿。\n守门人开了门，城里空空的，什么人也没有。\n\n只是从那天起，村里人说，巴恩加尔夜里的集市上，\n多了两个穿着外国衣服的人影。\n\n一个举着一根小棍子，一个抱着一本速写本，\n在没有屋顶的铺子之间，走来走去。' });
  }
  async function dawnEnd(S) {
    S.f.ph = 'dawn';
    SND.conch(S);
    await S.narr('第一道阳光，从东边的山脊上越过来，落在汉努曼门的门楣上。');
    await S.narr('身后，那些没有脸的人，一个接一个散成了灰。\n灰被晨风一吹，落进了没有屋顶的铺子里。');
    S.ent('hgate').lit = false;
    await goWith(S, 'gate', 12, 5, 0);
    for (const id of ['mk1', 'mk2', 'mk3', 'cow']) S.show(id);
    S.place('suresh', 15, 7, 1);
    S.dark(.2, 'gate');
    await S.say('苏雷什', ['林小姐！周先生！', '哈奴曼保佑……哈奴曼保佑……']);
    await S.narr('你们三个人坐在茶摊的长凳上，谁都没说话。\n太阳一点一点升起来，把城墙照成了金色。');
    const ex = [];
    if (S.f.threadUsed) ex.push('你低头看手腕。那根红线断在了城里，只剩下一圈浅浅的勒痕。'); else if (S.f.early) ex.push('手腕上的红线还在。苏雷什看了一眼，什么也没说，只是朝门边的神龛拜了拜。');
    if (S.f.bowB) ex.push('临走时，你远远地朝集市北边那间白色小屋望了一眼。\n门口的油灯，还亮着一点点火。');
    if (S.f.sketch) ex.push('回国的飞机上，你翻开速写本。\n门楣那一页后面，多了一幅你不记得自己画过的画——\n一个蒙着面纱的姑娘，站在露台上，朝东边望着。');
    else ex.push('周屿后来翻看那天的素材。从日落那一刻起，画面全是黑的。\n只有声音：鼓声，脚铃声，还有一个姑娘很轻很轻地说——「走吧」。');
    if (S.f.sniff) ex.push('直到很久以后，你闻到茉莉，还会恍惚一下。');
    return S.end({ id: 'dawn', title: '日出时，站在城外', text: '汉努曼门外的停车场上，太阳完完整整地升了起来。\n告示牌还立在那里，蓝底白字，一个字都没有变。\n\n' + ex.join('\n\n') });
  }
  /* ================= 地图 ================= */
  const scrub = (x, y) => hash(x, y, 31) < .3 ? 'K' : 'B';
  const BAZ = [];
  for (let y = 0; y < 20; y++) BAZ.push(row(46, x => {
    if (y <= 1) return 'H';
    if (y === 19) return scrub(x, y);
    if (y >= 8 && y <= 11) return 'S';
    if (x === 0 || x === 45) return scrub(x, y);
    if (y === 2) return x >= 25 && x <= 29 ? 'D' : scrub(x, y);
    if (y === 3) return x >= 24 && x <= 30 ? 'D' : scrub(x, y);
    if (y === 4) return 'D';
    if (y >= 5 && y <= 7) { if (x >= 4 && x <= 30 && x !== 27) return '#'; if ((x === 34 || x === 35) && y <= 6) return 'T'; return 'D'; }
    if (y === 12 || y === 13) return x >= 4 && x <= 30 && x !== 10 && x !== 26 ? '#' : 'D';
    if (x >= 18 && x <= 20 && y >= 15 && y <= 17) return '~';
    if (x >= 17 && x <= 21 && y >= 14 && y <= 18) return 'E';
    if (x >= 34 && x <= 40 && y >= 14 && y <= 16) return '#';
    return 'D';
  }));
  const PAL = [];
  for (let y = 0; y < 20; y++) PAL.push(row(30, x => {
    if (y <= 1) return 'H';
    if (y === 2) return x >= 19 && x <= 28 ? 'Y' : '#';
    if (y >= 3 && y <= 7) { if (x === 0 || x === 29) return '#'; if ((x === 10 || x === 18) && y !== 5) return '#'; return '.'; }
    if (y >= 8 && y <= 11) return x >= 13 && x <= 16 ? 'Z' : '#';
    if (y >= 12 && y <= 18) return x === 0 || x === 29 ? '#' : 'S';
    return x === 14 || x === 15 ? 'S' : '#';
  }));
  const GATE = [];
  for (let y = 0; y < 16; y++) GATE.push(row(24, x => {
    if (y <= 1) return 'H';
    if (y === 2 || y === 3) return x === 11 || x === 12 ? 'k' : '#';
    if (y === 15 || x === 0 || x === 23) return hash(x, y, 5) < .4 ? 'T' : 'B';
    if ((x === 2 || x === 3) && (y === 6 || y === 7)) return 'T';
    if ((x === 21) && (y === 5 || y === 6)) return 'T';
    if (x === 11 || x === 12) return 'd';
    return 's';
  }));
  const NOTEB = ['陶片', '陶片', '破瓦罐'];
  const RES_ENTS = [['r1', '@resM'], ['r2', '@resW'], ['r3', '@resW'], ['r4', '@resM'], ['r5', '@resW'], ['r6', '@resM']].map(([id, spr]) => ({ id, x: 1, y: 19, spr, hidden: true, solid: false, alpha: .9 }));

  defChapter({
    id: 'bhangarh', n: 28, title: '巴恩加尔古堡', sub: '蓝色告示牌上写着：日出之前、日落之后，不得入内。宫殿的影子，正一点一点爬过集市。', origin: '印度拉贾斯坦邦 · 古堡传说', color: '#7a3a1a',
    amb: 'wind', floor: 'sdst', wall: 'stone', dark: .1, plr: 4, darkC: '#2a1206',
    people: PEOPLE, tiles: TILES, sprites: SPR_B, items: ITEMS, notes: NOTES, faces: FACES,
    endings: { dawn: '日出时，站在城外', oil: '茉莉香', charm: '山上的灯', stay: '没有屋顶的城' },
    legend: '巴恩加尔（Bhangarh）在印度拉贾斯坦邦阿尔瓦尔县，萨里斯卡自然保护区的边上，离斋浦尔大约两个多小时车程。一般认为它建于十六世纪末，是安伯王室为一位王子修的城：城门、集市、神庙、宫殿依着阿拉瓦利山坡一层层排开。十七世纪以后它渐渐衰落，有一种说法是十八世纪的一场饥荒后人们彻底迁走了。如今城里的房子大多没有屋顶，由印度考古局（ASI）作为受保护古迹管理，戈皮纳特神庙、索梅什瓦尔神庙、集市两旁的石头铺面、「舞女的宅子」和山坡上的宫殿都还看得出模样。\n\n关于它为什么荒废，流传最广的是两个传说。一个说，苦行僧巴鲁·纳特（Guru Balu Nath）同意人们在他修行的地方建城，条件是城里房子的影子不能落到他身上；后来的君主把宫殿越加越高，影子终于落到了他的修行处，城便毁了。据说他的墓（萨玛迪）至今还在城里，附近村民也常说「这里盖的屋顶留不住」。另一个说，懂法术的辛吉亚（Singhia）爱慕公主拉特纳瓦蒂（Ratnavati），在侍女从集市买来的香油上下了咒；公主识破了，把油泼在石头上，石头滚过去压死了他，他临死前诅咒全城覆灭、城里的人不得往生——第二年与邻城阿杰布格尔交战，公主和城里的人都死了。两个传说各有许多版本，公主的年纪、香油是抹发的油还是香水、石头滚向哪里，说法都不一样，都没有史料可以印证。\n\n「印度最闹鬼的地方」这个名声，主要是近二三十年网络、旅游节目和媒体推出来的。城门口的考古局告示牌确实写着日出前、日落后禁止进入，但这是印度许多受保护古迹的通行规定，牌子上并没有提到鬼。至于夜里闯进去的人「再也没出来」之类的故事，查无实据。\n\n游戏虚构：林禾、周屿、司机苏雷什、守门人都是虚构的；「宫殿的影子碰到小屋就关门」是把巴鲁·纳特的传说做成了计时；夜里古城复活、「城里的人只在影子里走」、香油巷五家铺子的门楣、侍女的采买单、瓶底的印、红线挡一次、「日出那一刻要站在城外」都是游戏的设定。「伸手量太阳，一指约一刻钟」是民间常用的粗略估算法，只是个大概。',
    start: { map: 'gate', x: 12, y: 12, dir: 3 },
    thumb(g, w, h) {
      const sk = g.createLinearGradient(0, 0, 0, h - 22); sk.addColorStop(0, '#5a2a3a'); sk.addColorStop(.6, '#d8703a'); sk.addColorStop(1, '#f0b060'); g.fillStyle = sk; g.fillRect(0, 0, w, h - 22);
      g.fillStyle = '#ffd890'; g.beginPath(); g.arc(30, 20, 7, 0, 7); g.fill();
      g.fillStyle = '#5a3a2a'; for (let x = 0; x < w; x++) { const y = 46 + Math.sin(x * .07) * 4 + Math.sin(x * .19) * 2; g.fillRect(x, y, 1, h - y); }
      g.fillStyle = '#2a1810'; g.fillRect(8, 40, 46, 30); g.fillRect(12, 32, 12, 8); g.fillRect(32, 28, 16, 12); g.fillRect(36, 22, 8, 6); g.fillRect(16, 26, 4, 6);
      for (let i = 0; i < 4; i++) { g.fillStyle = '#5a3a2a'; g.fillRect(12 + i * 10, 52, 5, 8); }
      g.fillStyle = 'rgba(30,12,30,.6)'; g.beginPath(); g.moveTo(54, 66); g.lineTo(118, 60); g.lineTo(120, 68); g.lineTo(54, 70); g.fill();
      g.fillStyle = '#e8e2d6'; g.fillRect(118, 56, 9, 9); g.fillRect(119, 52, 7, 4); g.fillRect(121, 50, 3, 2); g.fillStyle = '#2a2018'; g.fillRect(121, 60, 3, 5);
      g.fillStyle = '#e8801a'; g.fillRect(126, 44, 5, 3); g.fillStyle = '#5a4630'; g.fillRect(125, 44, 1, 10);
      g.fillStyle = '#3a3a3a'; g.fillRect(139, 56, 2, 12); g.fillRect(149, 56, 2, 12); g.fillStyle = '#1e4e9a'; g.fillRect(134, 44, 22, 14); g.fillStyle = '#e8eef8'; g.fillRect(136, 46, 18, 2); g.fillStyle = '#c8d4ec'; for (let i = 0; i < 3; i++) g.fillRect(136, 50 + i * 2, 10 + i * 3, 1);
    },
    resume: {
      night: async S => {
        aiReset(S); setCloud(S, false); CL.t = MOON_T;
        if (DEATHS && S.map === 'bazaar') await S.think(DEATHS > 1 ? '影子里别跑、别乱动。被发现了就往月光底下、灯底下躲。\n云遮月之前（起风的时候），先站到铺子的灯底下。' : '……在影子里别跑。被发现了，就往亮处躲。');
      },
      run: async S => { await runResume(S, 24); },
      run2: async S => { runChase(S); await runResume(S, 18); }
    },
    async intro(S) {
      WH30 = false; WH10 = false; DEATHS = 0; LAST_LEFT = null; AI = {}; CLOUD_ON = false; CAUGHT = false; INV = 0;
      S.f.ph = 'day'; S.f.min = DAY0;
      await S.card('第二十八夜　巴恩加尔古堡', '十一月　下午四点　印度 拉贾斯坦邦 阿尔瓦尔县', '萨里斯卡的山脚下，有一座没有屋顶的城。\n\n城门口的蓝色告示牌上写着：\n日出之前、日落之后，不得入内。\n\n周屿说，他就是冲着这块牌子来的。');
    },
    tick(S, dt) {
      anchorTick(S);
      if (S.f.ph === 'day') dayTick(S, dt);
      else if (S.f.ph === 'night') nightTick(S, dt);
      else if (S.f.ph === 'run') runTick(S, dt);
    },
    maps: {
      /* ---------------- 汉努曼门外 ---------------- */
      gate: {
        amb: 'wind', dark: .06, plr: 5, wall: 'stone', floor: 'sand', wallC: { top: '#7a6040', face: '#a8865c', trim: '#5a4630' },
        legend: { H: 'hillD' }, tileOpts: { grassC: '#6a6a3a', treeC: '#3a4a26' },
        rows: GATE,
        ents: [
          { id: 'hgate', x: 11, y: 3, w: 2, spr: 'hgate', solid: false, z: 1 },
          { x: 11, y: 3, spr: 'invisible', solid: false, touch: gateIn },
          { x: 12, y: 3, spr: 'invisible', solid: false, touch: gateIn },
          { id: 'asi', x: 9, y: 4, spr: 'asi', async on(S) { await S.note('asi'); if (S.f.ph === 'day' && S.once('asiP')) await S.think('……周屿说的「冲着这块牌子来的」，就是它。'); } },
          { id: 'hanu', x: 14, y: 3, spr: 'hshrine', on: hanuOn },
          { x: 6, y: 5, spr: 'booth', on: S => S.narr('售票亭的窗口拉下来一半。玻璃上贴着一张褪色的纸：\n「开放时间：日出至日落」。') },
          { x: 17, y: 8, w: 2, spr: 'chai', on: S => S.narr(S.f.ph === 'dawn' ? '茶摊的炉子刚生起火。卖茶的老人往你手里塞了一杯，烫得握不住。' : '路边的茶摊。小陶杯里的奶茶甜得发齁，杯子喝完就摔在地上，碎成土。\n卖茶的老人朝城门那边看了一眼，又看了看天。') },
          { id: 'suresh', x: 16, y: 10, spr: '@suresh', dir: 1, on: sureshOn },
          { x: 19, y: 11, w: 2, spr: 'car', col: '#e8e6dc', on: S => S.narr('苏雷什的白色小车，车身上糊满了红土。\n后视镜上挂着一串万寿菊和一个小小的哈奴曼像。') },
          { id: 'cow', x: 5, y: 11, w: 2, spr: 'cow', on: S => S.narr('一头白牛趴在路边，慢吞吞地嚼着什么。\n它看了你一眼，又把眼睛闭上了。') },
          { id: 'mk3', x: 4, y: 2, spr: 'monkey', solid: false, on: null },
          { id: 'mk1', x: 19, y: 2, spr: 'monkey', dir: 1, solid: false },
          { id: 'oilG', x: 12, y: 4, spr: 'bottle', hidden: true, solid: false, on: S => takeOil(S, 'oilG') },
          { x: 3, y: 9, spr: 'invisible', solid: true, on: S => S.narr('城墙外的空地上，散着几块凿过的砂岩。\n上面还留着几百年前石匠的记号。') }
        ],
        async enter(S, first) {
          if (first) {
            S.give('phone', true);
            S.amb('wind'); SND.monkey(S);
            S.focus(12, 5);
            await S.narr('红土路的尽头，一道砂岩城墙横在山脚下。\n城门上蹲着几只灰毛黑脸的叶猴，尾巴垂下来，一晃一晃的。');
            await S.narr('你举起手机想拍门口的蓝色告示牌——屏幕闪了一下，黑了。\n……没电了。');
            S.focus(null);
            S.goal('和司机苏雷什说话（茶摊旁边）');
            return;
          }
          if (S.f.ph === 'day' && S.f.foundYu && S.ent('yu').follow) return gateDay(S);
        }
      },
      /* ---------------- 城里：集市 ---------------- */
      bazaar: {
        dark: .1, plr: 4, wall: 'stone', floor: 'dust', wallC: { top: '#7a6040', face: '#a8865c', trim: '#5a4630' }, darkC: '#060818',
        legend: { H: 'hillD', N: 'hillN', S: 'sdst', D: 'dust', E: 'stp', X: 'rub' },
        tileOpts: { grassC: '#6a6a3a', treeC: '#3a4a26' },
        rows: BAZ,
        ents: [
          { id: 'pshade', x: 0, y: 0, spr: 'pshade', decal: true, solid: false, s: { fr: FRONT0 } },
          { id: 'nshade', x: 0, y: 0, spr: 'nshade', decal: true, solid: false, hidden: true, s: { cl: 0 } },
          { id: 'sunB', x: 4, y: 0, spr: 'sun', solid: false, oy: 0 },
          { id: 'hudB', x: 0, y: 0, spr: 'skyhud', solid: false, z: 3, s: { md: 'day', min: DAY0 } },
          { id: 'moonB', x: 40, y: 0, spr: 'moon', solid: false, hidden: true },
          ...STALLS.map(st => ({ id: st.id, x: st.x, y: 7, w: 2, spr: 'stall', sym: st.sym, off: true, light: { r: 2.2, dx: 16, dy: 22, col: 'rgba(255,190,90,.24)', flick: true }, on: S => lintelOn(S, st) })),
          { id: 'samadhi', x: 27, y: 2, spr: 'samadhi', off: true, light: { r: 2.6, dy: 20, col: 'rgba(255,210,120,.22)' }, on: samadhiOn },
          { id: 'guard', x: 31, y: 9, spr: '@guard', dir: 1, on: guardOn },
          { x: 13, y: 10, spr: 'pillar', on: S => S.narr('一根断了一半的石柱，柱身上刻着一圈圈的花纹。\n不知道它以前撑着的是谁家的屋顶。') },
          { x: 25, y: 10, spr: 'pillar', on: S => S.narr('断柱底下堆着几个小石子，摆成一个圈。\n像是有人在这儿许过愿。') },
          { id: 'chab', x: 39, y: 6, w: 2, spr: 'chab', on: S => view(S, 'b') },
          { id: 'torchB', x: 41, y: 7, spr: 'torch', off: true, light: { r: 2.4, dy: -10, col: 'rgba(255,170,70,.24)', flick: true }, on: S => S.narr(S.f.ph === 'day' ? '一根插在地上的旧火把杆，顶上缠着烧黑的布。' : '火把烧得噼啪响。火光圈里，暖暖的。') },
          { id: 'torchG', x: 44, y: 7, spr: 'torch', off: true, light: { r: 3, dy: -10, col: 'rgba(255,180,90,.26)', flick: true }, on: S => S.narr(S.f.ph === 'day' ? '城门里侧的火把杆。' : '汉努曼门里侧的火把。火光照着门洞，门洞里是一片黑。') },
          { id: 'templeB', x: 5, y: 17, w: 3, spr: 'temple', off: true, light: { r: 2, dx: 22, dy: -4, col: 'rgba(255,190,90,.2)' }, on: S => S.narr(S.f.ph === 'day' ? '戈皮纳特神庙。高高的塔身上刻满了花纹，门里空空的，神像早就不在了。\n台阶上落满了鸽子毛。' : '神庙的门里点着一盏灯。有人在里面低声唱着什么，一遍又一遍。\n你没有进去。') },
          { x: 19, y: 15, spr: 'invisible', solid: true, on: S => S.narr(S.f.ph === 'day' ? '索梅什瓦尔神庙边上的阶梯水池。台阶一层层往下，底下的水是绿的。\n水面上漂着几片树叶，一动不动。' : '池水黑得像墨。\n水面上映着月亮——还有一排蒙着面纱的人影，站在台阶上。\n你抬头看，台阶上一个人也没有。') },
          { id: 'havdoor', x: 37, y: 16, spr: 'havdoor', off: true, light: { r: 1.8, dy: 6, col: 'rgba(255,190,90,.18)' }, on: S => S.narr(S.f.ph === 'day' ? '「舞女的宅子」。苏雷什说，以前这里夜夜有人跳舞。\n现在只剩几道拱门，和满地的猴子粪。' : '门里传出脚铃声，一下一下，踩着鼓点。\n有人在里面跳舞。……跳给谁看呢？') },
          { x: 3, y: 9, spr: 'item', on: S => S.narr(S.f.ph === 'day' ? '一个踩扁的矿泉水瓶，瓶身上贴着中文标签。\n——周屿的。他往宫殿那边去了。' : '那个踩扁的矿泉水瓶还在地上。\n在这座城里，它是唯一一件属于「现在」的东西。') },
          { x: 31, y: 15, spr: 'invisible', solid: true, on: S => S.narr('墙脚堆着几个破瓦罐，' + NOTEB[2] + '里长出一棵小小的仙人掌。') },
          { id: 'mk2', x: 8, y: 5, spr: 'monkey', solid: false },
          { id: 'oilD', x: 1, y: 19, spr: 'bottle', hidden: true, solid: false, on: S => takeOil(S, 'oilD') },
          { id: 'maidB', x: 1, y: 19, spr: '@maid', hidden: true, solid: false },
          ...RES_ENTS,
          ...[8, 9, 10, 11].map(y => ({ x: 0, y, spr: 'invisible', solid: false, touch: bazaarLeft })),
          ...[8, 9, 10, 11].map(y => ({ x: 45, y, spr: 'invisible', solid: false, touch: bazaarRight }))
        ],
        async enter(S, first) {
          S.amb(S.f.ph === 'day' ? 'wind' : S.f.ph === 'run' ? 'drone' : 'otherworld');
          if (S.f.ph === 'day') {
            if (first) {
              await S.narr('城门里面，是一条笔直的石板街。\n两边一间挨一间的铺子，墙都还在，屋顶一个也没有。');
              await S.narr('街的西头，宫殿叠在山坡上。\n它的影子已经铺到了街上，边缘是一排锯齿——是宫殿的轮廓。');
              await S.think('苏雷什说的就是这个……\n影子爬到北边那间白色小屋，就是关门的时候。');
              dayGoal(S);
            }
            return;
          }
          if (S.f.ph === 'night') { if (S.f.nightAt === 'gate' && S.once('ngate')) await S.narr('门洞里黑得伸手不见五指。\n走出来，眼前是一条点满了灯的街。'); await nightIntro(S); S.cp('night'); return; }
          if (S.f.ph === 'run') {
            runChase(S);
            S.f.runLeft = Math.max(1, S.timerLeft ?? RUN_T);
            S.cp('run2');
            if (S.once('runB')) S.toast('集市中间塌了！从南边的院子或者北边的小巷绕过去！');
          }
        },
        step(S, x, y) {
          if (S.f.ph === 'run' && x >= GATEX && S.once('gatez')) { S.toast('站在汉努曼门的灯底下——等太阳！'); S.goal('站在门灯底下，等太阳出来'); }
          if (S.f.ph === 'night' && x <= 6 && y >= 4 && S.once('pzone')) return S.think('宫殿的影子……\n这一片，月亮永远照不到。');
        }
      },
      /* ---------------- 宫殿 ---------------- */
      palace: {
        dark: .1, plr: 4, wall: 'stone', floor: 'sdst', wallC: { top: '#7a6040', face: '#a8865c', trim: '#5a4630' }, darkC: '#060818',
        legend: { H: 'hillD', N: 'hillN', S: 'sdst', Y: 'para', Z: 'stair' },
        rows: PAL,
        ents: [
          { id: 'sunP', x: 2, y: 0, spr: 'sun', solid: false, oy: 0 },
          { id: 'hudP', x: 0, y: 0, spr: 'skyhud', solid: false, z: 3, s: { md: 'day', min: DAY0 } },
          { id: 'moonP', x: 8, y: 0, spr: 'moon', solid: false, hidden: true },
          { id: 'chhatri', x: 24, y: 1, spr: 'chhatri', solid: false, off: true, light: { r: 2.4, dy: 6, col: 'rgba(255,120,40,.3)', flick: true } },
          { id: 'rock', x: 27, y: 3, spr: 'boulder', on: S => S.narr(S.f.ph === 'day' ? '露台角上一块半人高的大石头，表面被磨得很光。\n石头底下，好像有一道很深的车辙一样的印子，一直通到矮墙边。' : '露台角上的大石头。月光底下，它看起来湿漉漉的。') },
          ...[20, 21, 22, 23, 24, 25, 26].map(x => ({ x, y: 2, spr: 'invisible', solid: true, on: hillOn })),
          { id: 'yu', x: 22, y: 4, spr: '@yu', dir: 3, async on(S) { if (S.f.ph === 'day') return yuDayOn(S); if (S.f.ph === 'run') return S.say('周屿', '跑啊！'); return yuNightOn(S); } },
          { id: 'n1', x: 2, y: 2, spr: 'niche', on: (S, e) => nicheOn(S, e) },
          { id: 'n2', x: 4, y: 2, spr: 'niche', on: (S, e) => nicheOn(S, e) },
          { id: 'nicheC', x: 6, y: 2, spr: 'niche', s: { k: 'clue' }, on: (S, e) => nicheOn(S, e) },
          { id: 'n4', x: 8, y: 2, spr: 'niche', on: (S, e) => nicheOn(S, e) },
          { id: 'jharo', x: 14, y: 2, spr: 'jharokha', on: S => S.narr(S.f.ph === 'day' ? '雕花的凸窗。石头格子镂得像蕾丝一样。\n以前，宫里的女人就是隔着这样的格子看外面的。' : '月光透过石头格子，在地上印出一片碎碎的花。') },
          { id: 'palmL', x: 6, y: 6, spr: 'palm', hidden: true, on: palmOn },
          { id: 'ratnaW', x: 2, y: 5, spr: '@ratna', dir: 2, hidden: true, solid: false, async on(S) { await S.narr('一个穿红裙的姑娘侧身坐在窗下，慢慢地梳着长发。\n你还没开口，她就像被风吹散的灯影一样，淡了。'); await S.alpha('ratnaW', 0, 900); } },
          { id: 'ratna', x: 25, y: 3, spr: '@ratna', dir: 1, hidden: true, solid: false },
          { id: 'pmaid', x: 14, y: 17, spr: '@maid', hidden: true, solid: false },
          { id: 'pmaid1', x: 6, y: 13, spr: '@maid', dir: 3, hidden: true, solid: false, on: S => S.narr('侍女面朝着墙站着，铜盘里什么也没有。\n她在等什么。') },
          { id: 'pmaid2', x: 23, y: 13, spr: '@resW', dir: 3, hidden: true, solid: false, on: S => S.narr('她面朝着墙，一动不动。\n你绕到她侧面看了一眼——面纱底下，什么都没有。') },
          ...[4, 8, 12, 17, 21, 25].map(x => ({ x, y: 13, spr: 'arcade', on: S => S.narr('回廊的石柱，柱头雕成一朵倒挂的莲花。') })),
          { x: 13, y: 15, w: 3, spr: 'fountain', on: S => S.narr('干涸的水池，池底积着一层红土。\n池边刻着一行字，已经磨平了。') },
          { id: 'mk3p', x: 5, y: 11, spr: 'monkey', solid: false },
          { id: 'oilD', x: 1, y: 18, spr: 'bottle', hidden: true, solid: false, on: S => takeOil(S, 'oilD') },
          { x: 14, y: 19, w: 2, spr: 'parch', solid: false, z: 1 },
          { x: 14, y: 19, spr: 'invisible', solid: false, touch: S => goWith(S, 'bazaar', 1, 9, 2) },
          { x: 15, y: 19, spr: 'invisible', solid: false, touch: S => goWith(S, 'bazaar', 1, 10, 2) }
        ],
        enter: palaceEnter
      }
    }
  });
  async function runResume(S, floor) {
    const cpL = S.f.runLeft ?? RUN_T, left = Math.min(cpL, Math.max(LAST_LEFT ?? 0, Math.min(cpL, floor)));
    LAST_LEFT = null;
    S.timer(left, '日出', sunrise, { during: true });
    if (DEATHS) await S.think('别停下，一直跑。集市中间塌了——从南边的院子，或者北边的小巷绕过去。');
  }
})();
