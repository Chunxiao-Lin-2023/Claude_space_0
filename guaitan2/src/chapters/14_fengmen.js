/* ================= 第十四夜 · 封门村 ================= */
(() => {
  /* ---------- 小工具 ---------- */
  const FONT = '"Noto Sans CJK SC","Microsoft YaHei","PingFang SC","Hiragino Sans",sans-serif';
  const row = (w, f) => Array.from({ length: w }, (_, x) => f(x)).join('');
  const TXC = new Map();
  function txtBmp(s, px, col) {   // 二值化像素字，小字号不糊
    const k = s + '|' + px + '|' + col; let c = TXC.get(k); if (c) return c;
    const m = mk(8, 8).getContext('2d'); m.font = `bold ${px}px ${FONT}`;
    const w = Math.ceil(m.measureText(s).width) + 2, h = px + 4;
    c = mk(w, h); const x = c.getContext('2d');
    x.font = `bold ${px}px ${FONT}`; x.fillStyle = col; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(s, w / 2, h / 2 + 1);
    const im = x.getImageData(0, 0, w, h), d = im.data;
    for (let i = 3; i < d.length; i += 4) d[i] = d[i] >= 96 ? 255 : 0;
    x.putImageData(im, 0, 0);
    TXC.set(k, c); return c;
  }
  function txt(g, R, s, a, b, px, col) {   // 借 R 拿到当前绘制偏移
    let X = 0, Y = 0; g.fillRect = (x, y) => { X = x; Y = y; }; R(a, b, 1, 1, '#000'); delete g.fillRect;
    const c = txtBmp(s, px, col); g.drawImage(c, Math.round(X - c.width / 2), Math.round(Y - c.height / 2));
  }
  const vtxt = (g, R, s, a, b, px, col) => [...s].forEach((ch, i) => txt(g, R, ch, a, b + i * (px + 1), px, col));

  /* ---------- 常量 ---------- */
  const GONG_ANS = '才台才台七仓';     // 戏本上的「收头」
  const PAT_SPD = 2.2;               // 巷子里那个旦角的步速（玩家走 4.2）
  const FOUL_R = 2, NEAR_R = 6;      // 这么近（曼哈顿距离）还在动 = 犯规；6 格内开始心跳
  const RUN3_T = 12;                 // 第三上：背着锣鼓声走的时限（对白念完才开始计）
  const CXC = 16, CYC = 11;          // 槐台中心
  const LURES = ['lure0', 'lure1', 'lure2'];
  const DLMAP = { cunkou: 'dl_k', xiang: 'dl_x', xizi: 'dl_h', xitai: 'dl_t' };
  /* 巡游路线：北巷 → 广场 → 东巷 → 广场 → 南巷 → 广场 → 西巷 → 广场（相邻两点同行或同列） */
  const WP = [[16, 1], [16, 9], [19, 9], [19, 11], [31, 11], [19, 11], [19, 13], [16, 13], [16, 21], [16, 13], [13, 13], [13, 11], [1, 11], [13, 11], [13, 9], [16, 9]];
  let PI = 0, FOULT = 0, SINGT = 0, ERHT = 3, HEART = 0, GONGT = 0, CHILL = false, LP = null, DIED = null;

  /* ---------- S.tone 合成音效（双方都听得到） ---------- */
  const ERHU_A = [[587, .55], [659, .3], [587, .3], [523, .6], [440, .45], [523, .3], [587, 1]];
  const ERHU_B = [[440, .5], [392, .3], [440, .3], [523, .8], [587, .4], [523, .4], [440, 1.1]];
  function erhu(S, ph, v = .03, d = 0) {   // 二胡：锯齿波 + 低通，音头往上滑一点
    let t = d;
    for (const [f, du] of ph) { S.tone('sawtooth', f * .97, f, du, v, t, 1500); S.tone('sawtooth', f * 1.004, f * 1.008, du, v * .45, t + .02, 1300); t += du * .93; }
  }
  function sing(S, v = .04, d = 0) {   // 旦腔：高、拖腔、带一点颤
    const ph = [[880, 1046, .5], [1046, 988, .35], [988, 880, .45], [880, 784, .7], [784, 880, .55], [880, 830, .9]];
    let t = d;
    for (const [a, b, du] of ph) { S.tone('sine', a, b, du, v, t, 3200); S.tone('sine', a * 1.012, b * 1.014, du, v * .45, t + .03, 3200); S.tone('triangle', a / 2, b / 2, du, v * .22, t, 1400); t += du * .9; }
  }
  function bang(S, v = .06, d = 0) { S.tone('square', 1250, 1180, .05, v, d, 4000); S.tone('sine', 2400, 2300, .03, v * .5, d, 6000); }   // 梆子
  function luo(S, k, v = .07, d = 0) {   // 锣鼓经：仓=大锣 才=钹 台=小锣 七=小钹
    if (k === '仓') { S.tone('sine', 165, 148, 1.4, v, d, 1800); S.tone('sawtooth', 330, 296, .8, v * .3, d, 2200); S.tone('square', 2200, 1900, .5, v * .1, d, 6000); }
    else if (k === '才') { S.tone('sawtooth', 3100, 2800, .35, v * .22, d, 8000); S.tone('square', 4300, 4100, .25, v * .1, d, 9000); }
    else if (k === '台') { S.tone('sine', 740, 690, .5, v * .8, d, 3000); S.tone('triangle', 1480, 1400, .3, v * .22, d, 4000); }
    else if (k === '七') { S.tone('square', 5200, 5000, .12, v * .14, d, 9000); S.tone('sine', 3600, 3500, .1, v * .2, d, 9000); }
  }
  const luoSeq = (S, s, gap = .38, v = .07) => [...s].forEach((k, i) => luo(S, k, v, i * gap));
  function puff(S, d = 0) { S.tone('sine', 220, 80, .35, .05, d, 600); S.tone('triangle', 900, 300, .2, .015, d, 1200); }   // 灯笼自己点着
  function suona(S, d = 0) {   // 远处的唢呐：喜庆的调子
    const m = [[784, .3], [880, .3], [1046, .6], [880, .3], [784, .3], [659, .6], [784, .3], [880, .3], [784, 1]];
    let t = d; for (const [f, du] of m) { S.tone('square', f, f * 1.01, du, .018, t, 2600); S.tone('sawtooth', f * 1.005, f, du, .01, t, 2000); t += du; }
  }
  function beat(S) { bang(S, .07); bang(S, .07, .22); }   // 走对一步：梆子两响
  function sour(S) { S.tone('sine', 740, 610, .6, .06, 0, 2000); S.tone('sine', 784, 640, .6, .04, .04, 2000); bang(S, .05, .3); }   // 走乱了

  /* ---------- 人物 ---------- */
  const PEOPLE_F = {
    me: { key: 'fm-me', skin: '#efc9a6', hair: '#1c1614', hs: 'short', top: '#b4502c', top2: '#2a2a2a', bottom: '#33384a', shoes: '#3a2a1e',
      extra(g, d, fr, G, R) { if (d === 3) { R(4, G.tT, 8, 7, '#3a4a3a'); R(5, G.tT + 1, 6, 1, '#2a382a'); } else if (d === 1) R(10, G.tT, 3, 7, '#3a4a3a'); } },
    daliu: { key: 'fm-daliu', skin: '#e2b48e', hair: '#1a1410', hs: 'short', hat: 'cap', hatC: '#4a5a3a', top: '#7a6a48', top2: '#3a3428', bottom: '#2a2c30', shoes: '#2a2018',
      extra(g, d, fr, G, R) { if (d === 0) { R(5, G.tT, 1, 6, '#141414'); R(6, G.tT + 5, 4, 3, '#1e1e1e'); R(7, G.tT + 6, 2, 1, '#6a8aa0'); } } },
    daliuX: { key: 'fm-daliuX', skin: '#ecc8b0', hair: '#141010', hs: 'short', top: '#3a5a9a', top2: '#f0ece0', robe: true, bottom: '#3a5a9a', shoes: '#141414', blush: '#e08a8a',
      extra(g, d, fr, G, R) {   // 小生巾 + 水袖
        R(4, G.hT - 2, 8, 3, '#2a3a6a'); R(4, G.hT - 2, 8, 1, '#c8a040');
        if (d === 0) { R(1, G.hT + 1, 2, 7, '#2a3a6a'); R(13, G.hT + 1, 2, 7, '#2a3a6a'); R(2, G.tB - 1, 2, 5, '#f4f0e6'); R(12, G.tB - 1, 2, 5, '#f4f0e6'); }
        else if (d === 1) { R(11, G.hT + 1, 3, 7, '#2a3a6a'); R(6, G.tB - 1, 3, 5, '#f4f0e6'); }
      } },
    erhu: { key: 'fm-erhu', skin: '#cfae90', hair: '#dcd8d0', hs: 'short', top: '#1e1e22', top2: '#e8e4da', bottom: '#1e1e22', shoes: '#141414', mouth: '#7a4a3a',
      extra(g, d, fr, G, R) {
        if (d === 0) { R(6, G.hT + 4, 1, 1, '#e8e4dc'); R(9, G.hT + 4, 1, 1, '#e8e4dc'); R(5, G.hT + 5, 2, 1, '#a88a70'); R(9, G.hT + 5, 2, 1, '#a88a70');
          for (let y = G.tT + 1; y < G.tB; y += 2) R(7, y, 2, 1, '#e8e4da');
          R(12, G.hT - 2, 1, 16, '#5a3a20'); R(11, G.hT - 3, 3, 2, '#3a2414'); R(10, G.tB - 2, 4, 3, '#2a1a10'); R(10, G.tB - 2, 4, 1, '#8a6a40'); R(3, G.tT + 4, 9, 1, '#c8b890'); }
        else if (d === 1) { R(3, G.hT - 2, 1, 16, '#5a3a20'); R(2, G.tB - 2, 4, 3, '#2a1a10'); }
      } },
    dan: { key: 'fm-dan', skin: '#f4eeee', hair: '#0e0a0c', hs: 'long', top: '#a8202e', top2: '#e8cf8a', robe: true, noFeet: true, ghost: true, bottom: '#a8202e', eye: '#1a0a0a', mouth: '#c01828',
      extra(g, d, fr, G, R) { danExtra(g, d, fr, G, R); } },
    danIcon: { key: 'fm-danIcon', skin: '#f4eeee', hair: '#0e0a0c', hs: 'long', top: '#a8202e', top2: '#e8cf8a', robe: true, noFeet: true, bottom: '#a8202e', eye: '#1a0a0a', mouth: '#c01828',
      extra(g, d, fr, G, R) { danExtra(g, d, fr, G, R); } }
  };
  function danExtra(g, d, fr, G, R) {   // 凤冠、珠串、眼周的胭脂、拖到地的水袖
    const h = G.hT;
    R(3, h - 3, 10, 3, '#d8a830'); R(4, h - 4, 2, 1, '#e8c040'); R(10, h - 4, 2, 1, '#e8c040'); R(7, h - 5, 2, 2, '#e04050');
    if (d === 0) {
      R(5, h + 3, 2, 3, '#e07080'); R(9, h + 3, 2, 3, '#e07080'); R(6, h + 4, 1, 1, '#1a0a0a'); R(9, h + 4, 1, 1, '#1a0a0a');
      R(5, h + 2, 2, 1, '#1a0a0a'); R(9, h + 2, 2, 1, '#1a0a0a');
      for (let i = 0; i < 4; i++) { R(2, h + i * 2, 1, 1, '#f4f0e0'); R(13, h + i * 2, 1, 1, '#f4f0e0'); }
      R(1, G.tB - 2, 3, 8, '#f4f0e6'); R(12, G.tB - 2, 3, 8, '#f4f0e6');
    } else if (d === 1) { R(5, h + 3, 2, 3, '#e07080'); R(5, h + 4, 1, 1, '#1a0a0a'); R(4, h + 1, 1, 6, '#f4f0e0'); R(5, G.tB - 2, 4, 8, '#f4f0e6'); }
    else if (d === 3) R(3, h + 1, 10, 3, '#d8a830');
  }

  /* ---------- 惊吓大头像（32×32） ---------- */
  const FACES_F = {
    /* 旦角：凤冠、珠串、雪白的脸、眼周一片胭脂红；张嘴拖腔时眼睛变成两个黑洞 */
    dan(R, a) {
      const H = '#0c0809', GO = '#d8a830', GO2 = '#f0d060', PE = '#f4f0e0', W0 = '#f6f0ee', W1 = '#dcd0d0', PK = '#e06a7c', PK2 = '#b83a50', K = '#100606', RD = '#c01428';
      R(3, 6, 26, 26, H); R(1, 14, 30, 18, H);
      R(4, 3, 24, 5, GO); R(6, 1, 4, 3, GO2); R(14, 0, 4, 4, '#e04050'); R(22, 1, 4, 3, GO2); R(4, 7, 24, 1, '#8a6a20');
      for (let i = 0; i < 6; i++) { R(2, 8 + i * 3, 2, 2, PE); R(28, 8 + i * 3, 2, 2, PE); }
      R(8, 8, 16, 3, W0); R(6, 11, 20, 12, W0); R(8, 23, 16, 3, W0); R(11, 26, 10, 2, W0); R(22, 11, 4, 12, W1);
      R(7, 13, 8, 7, PK); R(17, 13, 8, 7, PK); R(8, 18, 6, 3, PK2); R(18, 18, 6, 3, PK2);
      R(7, 11, 7, 1, K); R(18, 11, 7, 1, K); R(13, 10, 2, 1, K); R(17, 10, 2, 1, K);   // 吊梢眉
      if (a < .5) { R(9, 14, 5, 2, K); R(18, 14, 5, 2, K); R(10, 14, 2, 1, '#f4f4f4'); R(19, 14, 2, 1, '#f4f4f4'); R(13, 13, 2, 1, K); R(18, 13, 1, 1, K); }
      else { R(9, 13, 5, 5, K); R(18, 13, 5, 5, K); R(11, 18, 1, Math.round((a - .5) * 14), '#5a0610'); R(20, 18, 1, Math.round((a - .5) * 10), '#5a0610'); }
      R(15, 18, 2, 3, W1);
      const mh = 1 + Math.round(a * 4); R(13, 23, 6, mh, RD); if (mh > 2) R(14, 24, 4, mh - 1, '#3a0408');
      R(4, 28, 24, 4, '#a8202e'); R(13, 28, 6, 4, '#e8cf8a');
    },
    /* 拉二胡的：满脸褶子、白头发；抬头时，两只眼睛白蒙蒙的，没有眼仁 */
    erhu(R, a) {
      const HW = '#dcd8d0', SK = '#cfae90', SK2 = '#a88a70', SK3 = '#8a6a54', K = '#1a1210', WE = '#eeece4';
      R(6, 2, 20, 6, HW); R(4, 6, 4, 10, HW); R(24, 6, 4, 10, HW);
      R(8, 6, 16, 4, SK); R(7, 10, 18, 14, SK); R(9, 24, 14, 3, SK); R(12, 27, 8, 2, SK); R(21, 10, 4, 15, SK2);
      R(9, 8, 14, 1, SK3); R(10, 10, 12, 1, SK3);   // 抬头纹
      if (a < .4) { R(9, 14, 5, 1, K); R(18, 14, 5, 1, K); }
      else { R(9, 13, 5, 3, WE); R(18, 13, 5, 3, WE); R(9, 12, 5, 1, SK3); R(18, 12, 5, 1, SK3); }
      R(8, 17, 3, 1, SK3); R(21, 17, 3, 1, SK3); R(15, 16, 2, 4, SK2); R(12, 22, 8, 1, '#7a4a3a'); R(11, 21, 1, 1, SK3); R(20, 21, 1, 1, SK3);
      R(4, 29, 24, 3, '#1e1e22'); R(15, 29, 2, 3, '#e8e4da');
      R(27, 0, 2, 32, '#5a3a20'); R(25, 26, 6, 6, '#2a1a10'); R(24, 6, 6, 1, '#c8b890');
    }
  };

  /* ---------- 瓦片 ---------- */
  const TILES_F = {
    roof: { solid: true, paint(R, X, Y) {   // 太行山的石板房顶
      R(0, 0, 16, 16, '#34322f');
      for (let r = 0; r < 4; r++) { const o = (r * 5 + X * 7) % 9; R(0, r * 4, 16, 1, '#252321'); R(o, r * 4 + 1, 5, 2, '#423f3b'); if (hash(X, Y, r) < .3) R((o + 8) % 13, r * 4 + 1, 3, 2, '#4a4640'); }
      if (hash(X, Y, 9) < .14) { R(3, 9, 4, 2, '#2c3a22'); R(4, 8, 2, 1, '#3a4a2a'); }
    } },
    htai: { solid: true, paint(R, X, Y) {   // 槐台：石头垒的方台
      R(0, 0, 16, 16, '#5e5a52'); R(0, 7, 16, 1, '#46433d'); R((X * 5) % 8, 0, 1, 7, '#46433d'); R((X * 5 + 7) % 14, 8, 1, 8, '#46433d');
      if (Y === 12) { R(0, 13, 16, 3, '#3a3732'); R(0, 13, 16, 1, '#6e6a60'); }
      if (hash(X, Y, 5) < .4) R(9, 3, 2, 1, '#706c62');
    } },
    stg: { solid: false, paint(R, X, Y) {   // 戏台台板
      R(0, 0, 16, 16, '#5a3a26'); for (let y = 3; y < 16; y += 5) R(0, y, 16, 1, '#3e2618');
      if (hash(X, Y, 2) < .3) R(4, 1 + (X % 3) * 5, 3, 1, '#6a4a32');
    } },
    sfront: { solid: true, paint(R, X) {   // 台口：雕花的立板
      R(0, 0, 16, 16, '#2e1a12'); R(0, 0, 16, 2, '#6a4a2a'); R(0, 2, 16, 1, '#c8a040');
      R(2, 4, 12, 9, '#4a1e14'); R(3, 5, 10, 7, '#5e2a1a'); R(6, 7, 4, 3, X % 2 ? '#7a3a20' : '#8a5a2a'); R(0, 14, 16, 2, '#1a0e0a');
    } },
    swall: { solid: true, paint(R, X) {   // 戏台后墙：守旧
      R(0, 0, 16, 16, '#3e1612'); R(0, 0, 16, 2, '#1e0a08'); R(0, 13, 16, 3, '#2a0e0a');
      R(2, 3, 12, 8, '#5a2018'); if (X % 3 === 0) { R(5, 5, 6, 4, '#7a5020'); R(7, 6, 2, 2, '#c8a040'); }
    } },
    spill: { solid: true, paint(R, X, Y) {   // 红漆柱子
      R(0, 0, 16, 16, '#141010'); R(4, 0, 8, 16, '#7a1e18'); R(5, 0, 2, 16, '#a03028'); R(10, 0, 2, 16, '#5a1410');
      if (Y === 6) { R(2, 10, 12, 6, '#5e5a52'); R(2, 10, 12, 1, '#706c62'); }
    } },
    sroof: { solid: true, paint(R, X, Y) {   // 戏台的瓦顶，下沿是翘起来的檐
      R(0, 0, 16, 16, '#1c1a1c');
      for (let x = 0; x < 16; x += 4) R(x, 0, 2, 16, '#26242a');
      if (Y === 1) { R(0, 11, 16, 3, '#3a3236'); for (let x = 1; x < 16; x += 4) R(x, 13, 2, 3, '#4a4048'); R(0, 14, 16, 1, '#141214'); }
    } }
  };

  /* ---------- 精灵 ---------- */
  const SPR_F = {
    stele(g, e, t, R) {   // 石碑（竖排字）
      R(1, 10, 14, 5, '#3a3834'); R(2, -22, 12, 33, '#6a665e'); R(3, -21, 10, 31, '#7a766c'); R(2, -24, 12, 3, '#5a564e');
      vtxt(g, R, e.text || '风门', 8, -16, 8, '#2a2824');
      if (e.red) { R(13, -12, 1, 7, '#a8201c'); txt(g, R, '封', 17, -18, 8, '#b8241e'); }
    },
    tudi(g, e, t, R) {   // 土地庙：齐膝高的小石龛
      R(0, -6, 16, 3, '#3a3430'); R(1, -3, 14, 17, '#6a625a'); R(4, 0, 8, 9, '#1a1410'); R(5, 1, 6, 1, '#a8201c'); R(6, 4, 4, 4, '#8a7a60');
      R(3, 11, 10, 3, '#4a4440'); R(6, 9, 1, 3, '#8a3a2a'); R(9, 9, 1, 3, '#8a3a2a');
      if (e.lit) { R(6, 7 + Math.sin(t * 2), 1, 2, 'rgba(230,230,230,.5)'); R(8, 7, 1, 3, '#f0f0e0'); R(8, 6, 1, 1, '#ff6a2a'); }
    },
    tuya(g, e, t, R) {   // 墙上的喷漆和粉笔字
      const c = e.col || '#c03030';
      R(1, 2, 6, 1, c); R(2, 4, 9, 1, c); R(1, 6, 5, 1, c); R(8, 6, 6, 1, c); R(3, 8, 10, 1, c); R(12, 3, 1, 4, c);
    },
    pillar(g, e, t, R) {   // 巷口石柱，上头挂着竖匾
      R(4, -22, 8, 36, '#5e5a52'); R(5, -22, 2, 36, '#706c62'); R(3, 12, 10, 3, '#46433d');
      if (e.text) { R(2, -20, 12, 26, '#2a1a10'); R(3, -19, 10, 24, '#3e2614'); vtxt(g, R, e.text, 8, -14, 8, '#d8b040'); }
    },
    huai(g, e, t, R) {   // 老槐树：粗树干 + 罩住整个石台的树冠，枝上挂红布条
      R(20, 2, 8, 30, '#3a2a1c'); R(22, 2, 2, 30, '#4a3826'); R(16, 30, 16, 4, 'rgba(0,0,0,.3)');
      const C = ['#22362a', '#2c4430', '#38523a'];
      for (let i = 0; i < 14; i++) { const x = (hash(i, 1, 33) * 40) | 0, y = -26 + ((hash(i, 2, 33) * 34) | 0), s = 10 + ((hash(i, 3, 33) * 10) | 0); R(x, y, s, s - 2, C[i % 3]); }
      R(4, -20, 40, 22, 'rgba(26,42,28,.45)'); for (let i = 0; i < 6; i++) R(8 + i * 6, -18 + (i % 3) * 5, 3, 2, '#4a6a48');
      const n = Math.min(10, 3 + (e.num || 0) * 2);
      for (let i = 0; i < n; i++) { const x = 4 + ((hash(i, 5, 7) * 38) | 0), y = -6 + ((hash(i, 6, 7) * 16) | 0), sw = Math.round(Math.sin(t * 1.6 + i) * 1.2); R(x + sw, y, 1, 6 + (i % 3), '#b0201c'); R(x + sw, y, 2, 1, '#d03a2a'); }
      if ((e.num || 0) >= 2) for (let i = 0; i < 5; i++) R(6 + i * 8, 30 + (i % 2) * 6, 3, 2, '#d8d0b8');   // 地上的纸钱
    },
    sdoor(g, e, t, R) {   // 石头房的木门，贴着褪了色的春联
      const c = e.col || '#4a3420';
      box(R, 2, -2, 12, 16, c); R(7, -2, 1, 16, shade(c, -.4)); R(5, 4, 1, 2, '#8a8a80'); R(10, 4, 1, 2, '#8a8a80');
      R(0, -2, 2, 14, e.red ? '#b02a24' : '#7a4a40'); R(14, -2, 2, 14, e.red ? '#b02a24' : '#7a4a40'); R(2, -4, 12, 2, e.red ? '#b02a24' : '#6a4a40');
      if (e.red) txt(g, R, '囍', 8, 8, 7, '#d83a2a');
      if (e.text) txt(g, R, e.text, 8, 1, 6, '#e8d8b0');
    },
    swin(g, e, t, R) {   // 木格子窗
      box(R, 2, 0, 12, 11, '#3a2a1a'); R(3, 1, 10, 9, e.lit ? '#c8a050' : '#0c0a0a');
      for (let x = 5; x < 13; x += 3) R(x, 1, 1, 9, '#3a2a1a'); R(3, 5, 10, 1, '#3a2a1a');
    },
    board(g, e, t, R) { box(R, 1, -1, 14, 11, '#2a3a2a'); R(3, 1, 10, 1, '#d8d8c8'); R(3, 4, 7, 1, '#d8d8c8'); R(3, 7, 9, 1, '#d8d8c8'); R(9, 1, 3, 3, '#c03030'); },
    xi(g, e, t, R) { R(1, -1, 14, 14, '#7a1a16'); R(2, 0, 12, 12, '#a82820'); txt(g, R, '囍', 8, 6, 11, '#f0c060'); },
    hli(g, e, t, R) { R(3, 0, 10, 12, '#e8e0cc'); R(3, 0, 10, 3, '#b02a24'); R(5, 5, 6, 1, '#4a4440'); R(5, 8, 4, 1, '#4a4440'); },
    frame(g, e, t, R) {
      box(R, 2, 0, 12, 11, '#5a3a1a'); R(3, 1, 10, 9, e.s.ph ? '#c8b890' : '#1a1814');
      if (e.s.ph) { for (let i = 0; i < 4; i++) { R(4 + i * 2, 4, 1, 4, '#4a3a2a'); R(4 + i * 2, 3, 1, 1, '#6a5040'); } R(4, 3, 1, 1, '#a82020'); }
      else { R(4, 2, 2, 2, 'rgba(220,220,220,.25)'); R(9, 6, 3, 2, 'rgba(220,220,220,.15)'); }
    },
    taishi(g, e, t, R) {   // 太师椅：高背、两边扶手
      const c = '#4a2414';
      R(3, -10, 10, 14, shade(c, -.3)); R(4, -9, 8, 12, c); R(6, -7, 4, 6, shade(c, .15)); R(2, -11, 12, 2, shade(c, -.2));
      box(R, 1, 3, 14, 5, shade(c, .1)); R(0, -1, 3, 9, shade(c, -.15)); R(13, -1, 3, 9, shade(c, -.15));
      R(2, 8, 2, 6, shade(c, -.4)); R(12, 8, 2, 6, shade(c, -.4));
    },
    xixiang(g, e, t, R) {   // 戏箱：红漆、铜包角
      box(R, 0, 2, 16, 12, '#7a1e18'); R(0, 6, 16, 1, '#5a1410'); R(0, 2, 2, 2, '#c8a040'); R(14, 2, 2, 2, '#c8a040'); R(0, 12, 2, 2, '#c8a040'); R(14, 12, 2, 2, '#c8a040');
      R(7, 6, 2, 3, '#d8b040');
      if (e.open) { R(1, -4, 14, 6, '#5a1410'); R(2, 3, 12, 3, '#d8c890'); R(3, 3, 4, 2, '#3a5a9a'); }
    },
    xmen(g, e, t, R) {   // 上下场门：门帘 + 门楣上的字
      R(1, -3, 14, 17, '#1e0a08'); R(2, 0, 12, 14, e.open ? '#050303' : '#7a1e24');
      if (!e.open) { R(2, 0, 12, 2, '#c8a040'); for (let x = 4; x < 14; x += 3) R(x, 2, 1, 12, '#5a1418'); R(6, 6, 4, 4, '#d8b040'); }
      R(0, -12, 16, 9, '#2a1a10'); R(1, -11, 14, 7, '#c8a040'); txt(g, R, e.text || '出将', 8, -8, 7, '#3a1a0a');
    },
    stairs(g, e, t, R) { for (let i = 0; i < 4; i++) { R(2 + i, 2 + i * 3, 28 - i * 2, 3, i % 2 ? '#4a3020' : '#5a3a26'); R(2 + i, 2 + i * 3, 28 - i * 2, 1, '#6a4a30'); } if (!e.s.ok) { R(10, 5, 6, 2, '#140a06'); R(20, 11, 5, 2, '#140a06'); } },
    luo(g, e, t, R) {   // 锣架：大锣、小锣、一副钹
      R(1, -10, 2, 24, '#3a2414'); R(13, -10, 2, 24, '#3a2414'); R(1, -11, 14, 2, '#3a2414');
      R(3, -8, 10, 10, '#a88a30'); R(4, -7, 8, 8, '#c8a848'); R(7, -4, 2, 2, '#8a6a20');
      R(5, 5, 6, 5, '#b89a40'); R(7, 7, 2, 1, '#7a5a1a'); R(2, 11, 4, 2, '#c8b060'); R(10, 11, 4, 2, '#c8b060');
    },
    gu(g, e, t, R) { R(2, 0, 12, 13, '#6a1a14'); R(1, 0, 14, 3, '#d8c8a0'); R(2, 1, 12, 1, '#c0b090'); R(3, 13, 2, 2, '#3a2414'); R(11, 13, 2, 2, '#3a2414'); },
    cam(g, e, t, R) { R(3, 8, 10, 6, '#1a1a1a'); R(6, 7, 4, 2, '#1a1a1a'); R(7, 9, 4, 4, '#3a4a5a'); R(8, 10, 2, 2, '#8ab0d0'); R(2, 13, 4, 1, '#2a2a2a'); if (Math.sin(t * 4) > .7) R(11, 9, 1, 1, '#ff3a2a'); },
    cdoor(g, e, t, R) { box(R, 1, -2, 14, 16, '#3a2414'); R(7, -2, 2, 16, '#2a180c'); R(5, 5, 1, 2, '#c8a040'); R(10, 5, 1, 2, '#c8a040'); R(0, -9, 16, 6, '#1e140c'); R(1, -8, 14, 4, '#3a2a1a'); txt(g, R, '祠堂', 8, -6, 6, '#c8a040'); },
    stool(g, e, t, R) { box(R, 3, 8, 10, 3, '#5a3a20'); R(4, 11, 2, 4, '#3a2414'); R(10, 11, 2, 4, '#3a2414'); }
  };

  /* ---------- 文本 ---------- */
  const NOTES_F = {
    n_post: { title: '【原创】独闯「中国第一鬼村」（多图，胆小勿入）', text: '（大刘打印出来的户外论坛帖子，折了好几道。）\n\n1楼 楼主「山野老驴」2009-08\n上周末一个人去了趟封门村。\n村口有块碑。房子都还在，人一个没有。\n有间屋墙上贴着大红囍字，炕边一把太师椅——\n都说坐过那把椅子的人，回去就出事。我没敢坐。\nGPS 在村里乱跳。明明往外走，走着走着，\n又回到了那棵大槐树底下。\n\n7楼：楼主住了吗？听说半夜能听见唱戏。\n9楼 楼主：没住。天擦黑的时候，好像真听见有人拉二胡……我就跑了。\n15楼：夜里听见唱戏，千万别上台。老辈人说的。\n22楼：我就是山下的。村里人是嫌山上没路没水、孩子上学难，几十年前陆续搬下来的。啥鬼村，别瞎传。\n23楼：那照片上那张脸怎么解释？\n24楼：光线。\n\n（楼主后来再没回过帖。）' },
    n_xiben: { title: '戏本《风门关》（手抄）', text: '（线装的手抄戏本，边角被虫蛀了。翻到最后几页——）\n\n【锣鼓经·收头】\n戏唱完了，场面上打「收头」，台上的人才下得了场：\n　才　台　才　台　七　仓\n（铅笔小注：才=钹　台=小锣　七=小钹　仓=大锣齐响）\n\n【末场·夜出风门】\n（生自出将门上，绕台一周。）\n生（唱）一更天，风门关前月儿暗——\n（生从入相门下。）\n（生再上，至井边，望井。）\n生（唱）二更天，井里照见旧时颜——\n（生从入相门下。）\n（生三上。锣鼓声紧。生背着锣鼓声疾走，不回头，下。）\n生（唱）三更天，背着锣鼓出风关——\n\n（末页有人用毛笔补了一行小字：\n「台上的戏走到哪儿，台下的路就通到哪儿。」）' },
    n_bei: { title: '重修戏楼碑记', text: '（祠堂前的石碑，字口里长着青苔。手电斜着照，才认得出来。）\n\n吾村居太行之隘口，两山夹峙，终岁风过如门，\n故名「风门」。\n村中旧有戏楼，每逢庙会，延梆子班唱戏三日，\n酬神娱人。\n村心植槐，垒石为台，村人呼曰「槐台」。\n台之东西两巷口，仿戏楼上下场门，各立石柱：\n西曰「出将」，东曰「入相」。\n意谓全村即一戏台，往来之人，皆台上过客。\n　　　　　　　民国二十六年冬　阖村公立\n\n（碑的背面，有人后刻了一行歪歪扭扭的字：\n「风门不是封门。我们是搬下山了，不是死绝了。」）' },
    n_photo: { title: '老照片（背面）', text: '（发黄的合影：戏楼前站着一排穿戏服的人。最前面是个扮旦角的姑娘，凤冠压得很低，笑得有点拘谨。\n照片背面，钢笔字——）\n\n风门庙会　梆子班留影\n民国二十六年腊月\n\n秀芝：唱完这一台，我就不唱了，下台嫁人。\n囍字是我自己剪的。\n\n（最后一笔拖得很长，像是写字的人被谁叫走了。）' }
  };
  const ITEMS_F = {
    shoudian: { name: '手电', desc: '大刘网上买的强光手电，说是能照三百米。在这村子里，好像照不了那么远。' },
    duijiang: { name: '对讲机', desc: '一对里的一个，另一个在大刘那儿。调在 3 频道，一直沙沙地响。' },
    xiangji: { name: '大刘的相机', desc: '最后一张照片，拍的是你的后脑勺——从戏台上往下拍的。你不想再看第二遍。' },
    xiben: { name: '戏本', desc: '手抄的《风门关》。最后几页有锣鼓经和末场的舞台提示（在「笺」里可以重看）。' },
    oldphoto: { name: '老照片', desc: '大刘从喜字房墙上拿的戏班合影。最前面的旦角姑娘，凤冠压得很低。' }
  };

  /* ---------- 小函数 ---------- */
  const night = S => S.f.ph === 'stage' || S.f.ph === 'night';
  const gpos = e => [Math.round(e.px / TS), Math.round(e.py / TS)];
  function dlSync(S) {   // 大刘跟着走：每张地图一个替身实体，进图时放到玩家身边
    const id = DLMAP[S.map]; if (!id) return;
    const e = getEnt(id); if (!e) return;
    if (!S.f.dl) { if (e.follow) S.follow(id, false); return; }
    const m = curMap(), p = S.pl;
    const c = [[0, 1], [0, -1], [-1, 0], [1, 0], [-1, 1], [1, 1]].map(([a, b]) => [p.x + a, p.y + b]).find(([x, y]) => passable(m, x, y, e)) || [p.x, p.y];
    S.place(id, c[0], c[1], p.dir); e.alpha = 1; e.spr = '@daliu'; S.follow(id, true);
  }
  function ghostFar(S) {   // 把巷子里的旦角挪到离玩家最远的路点
    const p = S.pl; let best = 0, bd = -1;
    WP.forEach(([x, y], i) => { const d = Math.abs(x - p.x) + Math.abs(y - p.y); if (d > bd) { bd = d; best = i; } });
    S.stop('dan'); S.freeze('dan', false); S.place('dan', WP[best][0], WP[best][1], 0); S.ent('dan').alpha = 1;
    PI = (best + 1) % WP.length; FOULT = 0;
  }
  function ritGoal(S) {
    if (S.f.ph === 'stage') return S.goal('让大刘下台（千万别上台）');
    if (S.f.ph !== 'night') return;
    if (!S.f.erhuLore) return S.goal(S.f.loops ? '又回到槐树下了……问问树下拉二胡的' : '回村口（往南走）');
    const r = S.f.rit || 0, n = r < 3 ? '一' : r < 6 ? '二' : '三';
    S.goal('照戏本走出村子（第' + n + '上）');
  }
  function ritHint(S) {
    if (!S.f.readXB) return '戏本在喜字房的戏箱里。末场叫《夜出风门》。';
    const L = (S.f.resets || 0) + (S.f.htalk || 0);
    if (L <= 1) return ['戏台有上场门、下场门。这村子也有——广场东西两头那两根石柱，你去看看上头的字。', '「台」嘛，就是这棵槐树底下的石台。' + (S.f.readBei ? '' : '祠堂门口那块碑上都写着。')];
    if (L === 2) return ['西头是出将，东头是入相。', '从出将门上，绕槐台走一圈，一直往东走到头，就是从入相门下了。', '再上，去井边望一眼，再下。'];
    return ['从西头进广场，绕槐台一圈，往东走到头；', '再从西头进来，到井边看一眼，再往东走到头；', '第三回进来，锣鼓从哪边响，你就背着它走，跑起来，别回头——哪怕看着像是往村里头去。'];
  }
  function ritReset(S, why) {
    if (!(S.f.rit >= 1 && S.f.rit <= 6)) return false;
    S.f.rit = 0; S.f.cs = 0; S.f.cq = null; S.f.half = false; S.f.resets = (S.f.resets || 0) + 1;
    sour(S); S.toast('……梆子乱了一拍。' + (why || '戏走乱了，得从头走。'));
    return true;
  }

  /* ================= 村口 ================= */
  async function steleOn(S) {
    if (S.f.ph === 'out') return S.narr('石碑上的「风门」两个字，在晨光里清清楚楚。\n旁边那个红漆写的「封」字，淡得快要看不见了。');
    await S.narr('村口立着一块半人多高的石碑。\n竖着刻了两个字：「风门」。');
    await S.narr('不知谁用红漆在旁边歪歪扭扭写了个「封」字，还画了个箭头——\n「封门村 →」');
    if (S.once('stele')) await S.think('……原来碑上刻的是「风门」。\n网上传来传去，传成了「封门」。');
  }
  async function tudiOn(S) {
    if (S.f.bow) return S.narr('土地庙前的那根烟，还在一明一灭地烧着。');
    await S.narr('路边一座齐膝高的小土地庙，石头垒的。\n龛里的土地公脸都磨平了，供台上却摆着两个新鲜的苹果。\n……还有人回来上供。');
    const r = await S.ask('土地庙前……', ['点根烟，拜一拜', '算了']);
    if (r) return;
    S.f.bow = true; S.ent('tudi').lit = true; S.sfx('match');
    await S.narr('你把一根烟点着，立在供台的缝里，作了个揖。\n「打扰了。我们看看就走。」');
  }
  async function walkie1(S) {
    S.f.wk1 = true;
    S.sfx('tv');
    await S.narr('对讲机「咔」地响了一声。');
    await S.say('对讲机', ['……老程？……老程！村里头有个大院子……', '有个戏台！还挺全乎，柱子都是红的……', '……哎，你听见没有？有人在唱戏……']);
    sing(S, .03, .2);
    S.fx('static'); S.sfx('tv');
    await S.narr('后面的话，被一阵沙沙声吞掉了。\n再按通话键，只有电流的声音。');
    S.goal('进村找大刘（往北走）');
    S.cp();
  }
  /* ================= 喜字房 ================= */
  async function xixiangOn(S) {
    const e = S.ent('xixiang');
    if (S.f.readXB) { await S.narr('戏箱里叠着几件褪了色的戏服，最上面一件，是红的。'); return S.note('n_xiben'); }
    S.f.readXB = true; e.open = true; S.sfx('open');
    await S.narr('炕脚放着一只红漆戏箱，铜包角。锁扣是开着的。\n掀开盖子——一股樟脑和霉味。');
    await S.narr('里面叠着几件戏服：一件红褶子，一顶凤冠，珠子掉了一半。\n最底下压着一本线装的手抄本。');
    S.give('xiben');
    await S.note('n_xiben');
    if (S.f.ph === 'stage') await S.think('「收头」——才、台、才、台、七、仓。\n台边上那个锣架……');
  }
  async function chairOn(S) {
    if (S.once('chair1')) await S.narr('炕边摆着一把太师椅，红木的，扶手磨得发亮。\n屋里别的东西都落了厚厚一层灰，只有这把椅子，干干净净的。');
    await S.think('帖子里说：坐过这把椅子的人，回去就出事。');
    const r = await S.ask('坐下歇歇脚？', ['坐下', '不坐']);
    if (r) return S.narr('你没有坐。\n转身的时候，椅子「吱」地响了一声——像是有人刚从上面站起来。');
    S.sfx('thud');
    await S.narr('你坐了下去。\n……椅子是温的。');
    sing(S, .02);
    await S.narr('耳边有人在轻轻地哼戏。\n一双冰凉的手搭上你的肩膀，替你理了理衣领。');
    const r2 = await S.ask('眼皮越来越沉……', ['猛地站起来', '就坐一会儿']);
    if (r2 === 0) {
      S.sfx('sting'); S.shake(300, 2);
      return S.narr('你一下子弹了起来，后背全是冷汗。\n身后什么也没有。椅面上，留着一个浅浅的人形印子。');
    }
    await S.narr('你闭上了眼睛。\n那双手轻轻地拍着你，一下，一下，像哄孩子睡觉。');
    await S.fade(1, 1200);
    return S.end({ bad: true, id: 'chair', title: '那把太师椅', text: '第二天中午，搜救的人在喜字房里找到了大刘的对讲机，一直调在 3 频道。\n\n太师椅上落满了灰，像是几十年没人碰过。\n只有扶手上挂着一支手电，开关是开着的，\n亮了一整夜，到早上才没电。\n\n后来再有驴友发帖，说喜字房里那把椅子，\n又多了一个「坐过就回不去」的说法。' });
  }
  async function frameOn(S) {
    const e = S.ent('frame');
    if (e.s.ph) return S.narr('相框里，戏班的人站成一排。\n最前面的旦角姑娘，好像比刚才笑得松快了一点。');
    if (!S.has('oldphoto')) return S.narr('墙上挂着一个木头相框——里面是空的。\n玻璃上有一圈新鲜的指印，灰被抹掉了一块。\n……刚才有人把里面的东西拿走了。');
    const r = await S.ask('把老照片放回相框里吗？', ['放回去', '先不']);
    if (r) return;
    S.take('oldphoto'); e.s.ph = true; S.f.photoBack = true; S.sfx('paper');
    await S.narr('你把照片按回相框，扶正。\n玻璃上那圈指印，不知什么时候没了。');
    if (S.f.dl) await S.say('大刘', '……对不住了。我不该拿的。');
    bang(S, .04); await S.wait(300);
    await S.narr('屋外，唱腔停了一拍，又接着唱下去。\n调子好像软了些。');
  }

  /* ================= 戏台院子 ================= */
  async function camOn(S) {
    S.hide('cam'); S.give('xiangji');
    await S.narr('台阶底下扔着大刘的相机，镜头盖还拴在背带上。\n你按亮屏幕，往前翻——');
    await S.narr('村口的碑，大刘比着剪刀手。\n贴着囍字的屋子，他手里捏着一张发黄的照片，冲镜头挤眼睛。');
    S.sfx('sting');
    await S.narr('这座戏台。大刘背对镜头，站在写着「出将」的门前——\n他身后的门帘缝里，露出半张抹得雪白的脸。');
    await S.narr('最后一张：一个人的后脑勺，是从台上往下拍的。\n那件橘色冲锋衣，就是你身上这件。');
    S.amb('none'); S.dark(.96); S.sfx('switch');
    await S.wait(900);
    bang(S, .07); await S.wait(450); bang(S, .07); await S.wait(260); bang(S, .09);
    for (const id of ['lanL', 'lanR']) { puff(S); S.ent(id).off = false; await S.wait(500); }
    S.dark(.84); S.amb('drone');
    erhu(S, ERHU_A, .035);
    await S.narr('檐下的两盏红灯笼，自己亮了。不知从哪儿，响起了二胡。');
    S.place('dan_st', 13, 4, 0); S.ent('dan_st').alpha = 0; await S.alpha('dan_st', 1, 900);
    S.ent('menL').open = true; S.sfx('open'); S.place('dl_st', 7, 3, 0); await S.walk('dl_st', [9, 4], 2.2); S.face('dl_st', 0); S.ent('menL').open = false;
    sing(S, .05);
    await S.say('台上', '……一更天……风门关前……月儿暗……', { style: 'whisper' });
    await S.scare('face', { spr: '@dan', dur: 1 });
    await S.narr('台上站着一个旦角。凤冠、红褶子，水袖一直垂到台板上。\n她身边，大刘套着一件不合身的蓝褶子，嘴一张一合，跟着她唱。\n大刘从来不会唱戏。');
    await S.narr('你喊了一声「大刘！」\n他没有回头。眼睛直直地看着台下——那一排排空着的长凳。');
    await S.think('帖子里说过：夜里听见唱戏，千万别上台。\n……可总得让他下来。');
    S.f.ph = 'stage'; S.dark(.86, 'xiang'); S.dark(.9, 'xizi'); nightLights(S);
    ritGoal(S);
    S.cp('stage');
  }
  async function frontOn(S) {
    if (S.f.ph === 'stage' && S.f.gong) return S.narr('台上空了。两盏红灯笼还亮着。\n台侧的地上，大刘还趴着没动。');
    if (S.f.ph === 'stage') {
      const n = S.f.shout = (S.f.shout || 0) + 1;
      if (n === 1) { await S.say('程野', '大刘！下来！我们走了！'); return S.narr('大刘唱得更起劲了。\n那个旦角的水袖一甩，轻轻搭在他肩膀上。'); }
      if (n === 2) {
        S.face('dan_st', 0); S.bubble('dan_st', '…', 1500); S.sfx('sting');
        await S.narr('旦角转过脸，朝你看过来。\n她慢慢抬起一只手，朝你招了招——');
        return S.say('旦角', '……上来呀。', { style: 'whisper' });
      }
      return S.think(S.f.readXB ? '喊是喊不下来的。\n戏本上说：戏唱完了，场面上打「收头」，台上的人才下得了场。\n——台边那个锣架。' : '喊是喊不下来的。\n台上的戏，得唱完才算完吧……\n台边上有个锣架。可是该怎么敲？');
    }
    if (S.f.ph === 'night' || S.f.ph === 'out') return S.narr('戏台上空荡荡的。两盏红灯笼还亮着，照着台板上两道拖过去的水袖印子。');
    return S.narr('台口的立板上雕着花，红漆剥得斑斑驳驳。\n台板比你的头还高，黑洞洞的，看不清上面。');
  }
  async function stairsOn(S) {
    if (S.f.ph === 'dusk' || !S.f.ph) return S.narr('上台的木台阶缺了两级，剩下的也朽得发黑。\n……你不太想上去。');
    if (S.f.ph === 'stage' && S.f.gong) return S.think('大刘已经下来了。\n……先去看看他。');
    const q = S.f.ph === 'stage' ? '台阶就在脚下。大刘离你只有几步远。' : '戏台上空荡荡的。台阶好像比刚才完整了。';
    const r = await S.ask(q, S.f.ph === 'stage' ? ['上台，把他拽下来', '不能上台'] : ['上去看看', '算了']);
    if (r) return S.think('「夜里听见唱戏，千万别上台」。');
    return stageEnd(S);
  }
  async function stageEnd(S) {
    S.clearTimer();
    await S.narr('你踩上台阶，一步，两步，翻上了戏台。\n台板「吱呀」一声，像是等你很久了。');
    S.sfx('sting'); bang(S, .08); erhu(S, ERHU_B, .045);
    await S.narr('二胡一下子拔高。\n台下那一排排空长凳上——坐满了人。黑压压的，一动不动，全都仰着脸看你。');
    await S.scare('face', { spr: '@dan', dur: .9 });
    await S.say('旦角', '相公，你可来了。\n……咱们，接着唱。', { style: 'whisper' });
    await S.fade(1, 1200);
    return S.end({ bad: true, id: 'stage', title: '上了戏台', text: '后来又有人在论坛上发帖，说半夜路过那个村子，\n听见戏台上在唱《风门关》。\n\n这回不是一个人唱。是一个旦，两个生。\n两个生都唱得不好，老是跑调，\n可是一直在唱，一直唱到天亮。' });
  }
  async function gongOn(S) {
    if (S.f.ph !== 'stage' || S.f.gong) return S.narr(S.f.gong ? '锣架上的大锣还在微微地颤，嗡嗡的余音一直不散。' : '台边的锣架上挂着一面大锣、一面小锣，一副钹。\n这是「场面」——唱戏时打锣鼓的人坐的地方。锣面上落满了灰。');
    if (!S.f.readXB) {
      await S.narr('锣架上挂着大锣、小锣和钹。\n台上的戏还在唱，锣鼓却一直空着。');
      return S.think(S.f.gongPeek ? '那间贴囍字的屋子里，有只红漆戏箱……\n唱戏的人，锣鼓经都写在戏本上。' : (S.f.gongPeek = true, '敲锣……可该怎么敲？\n瞎敲一气，不知道会招来什么。'));
    }
    const r = await S.ask('照戏本打一遍「收头」吗？', ['打', '先翻一遍戏本', '先不']);
    if (r === 2) return;
    if (r === 1) await S.note('n_xiben');
    if (S.once('gongTip')) S.toast('两个人的话：一个人翻「笺」念锣鼓经，一个人敲');
    const v = await S.keypad('锣鼓经 · 收头（敲 6 下）\n仓=大锣　才=钹　台=小锣　七=小钹', ['仓', '才', '台', '七'], 6, { alias: { '1': '仓', '2': '才', '3': '台', '4': '七' } });
    if (v == null) return S.narr('你放下了锣槌。');
    luoSeq(S, v); await S.wait(6 * 380 + 400);
    if (v === GONG_ANS) return gongOK(S);
    const n = S.f.gongWrong = (S.f.gongWrong || 0) + 1;
    S.sfx('sting'); S.shake(300, 2); S.bubble('dan_st', '!', 1200);
    const [sx, sy] = gpos(S.ent('dan_st'));   // 她往台口逼近一步，灯笼一暗
    S.ent('lanL').off = true; S.ent('lanR').off = true;
    await S.walk('dan_st', [sx > 12 ? sx - 1 : sx, Math.min(5, sy + 1)], 3); S.face('dan_st', 0);
    S.ent('lanL').off = false; S.ent('lanR').off = false; puff(S);
    if (n >= 3) S.fx('red');
    if (n === 1) await S.narr('锣鼓点乱成一团。\n台上，大刘唱得更急了，嗓子都劈了。');
    else await S.narr('锣声一乱，台上那个旦角猛地转过脸来。\n灯笼一暗一亮——她离台口，又近了一步。');
    if (n === 2) await S.think('戏本上写的是「才　台　才　台　七　仓」……\n顺序得一下都不差。');
    else if (n === 3) await S.think('才、台、才、台……然后是小钹「七」，最后大锣「仓」收住。');
    else if (n >= 4) await S.think('才台才台七仓。\n——钹、小锣、钹、小锣、小钹、大锣。');
  }
  async function gongOK(S) {
    S.f.gong = true;
    await S.narr('最后一声大锣——「仓！」\n震得戏台檐下的瓦都在响。\n唱腔停了。二胡也停了。');
    S.face('dan_st', 0); await S.wait(500);
    await S.narr('台上的旦角慢慢转过身，朝着台下那一排排空长凳，深深地福了一福。');
    await S.say('旦角', '……戏，还差最后一场。', { style: 'whisper' });
    await S.walk('dan_st', [16, 3], 2); S.face('dan_st', 3); await S.alpha('dan_st', 0, 700);
    await S.narr('她挑开写着「入相」的门帘，进去了。\n大刘像被线牵着似的，跟在她身后，也走进了那道门。');
    await S.walk('dl_st', [16, 3], 2.2); S.face('dl_st', 3); await S.alpha('dl_st', 0, 600);
    S.sfx('thud'); S.shake(300, 1); await S.wait(700);
    S.place('dl_t', 18, 7, 1); S.ent('dl_t').alpha = 1; S.bubble('dl_t', '…', 1500);
    await S.narr('戏台侧面「咚」的一声。\n大刘从台侧的矮墙后头滚了出来，趴在地上，一动不动。');
    S.goal('去看看大刘');
  }
  async function dlWake(S) {
    if (S.f.dl) return S.say('大刘', S.f.ph === 'night' ? '……老程，咱照着那戏本走吧。我、我跟着你。' : '走走走，赶紧走。');
    if (!S.f.gong) return;
    S.face('dl_t', 'pl');
    await S.narr('你把大刘翻过来，使劲拍他的脸。\n身上那件蓝褶子不见了，还是他自己的摄影背心。');
    await S.say('大刘', ['……老程？我、我怎么躺这儿了……', '我就记得进了那间贴囍字的屋子……']);
    await S.say('程野', '你刚才在台上唱戏。');
    await S.say('大刘', ['唱戏？我？……', '……对不住，老程。我从那屋墙上，拿了张老照片。想着回去发帖，带张实物有面子……']);
    S.give('oldphoto');
    await S.note('n_photo');
    await S.say('大刘', ['后来就听见有人在耳朵边上叫我。叫我「相公」。', '……再睁眼，我就站在台上了。']);
    await S.think('「戏，还差最后一场」。');
    S.f.dl = true; S.f.ph = 'night'; S.dark(.9, 'cunkou'); S.ent('stairs').s.ok = true;
    S.follow('dl_t', true);
    for (const id of LURES) S.hide(id);
    ritGoal(S);
    S.toast('大刘跟着你走');
    S.cp('night');
  }
  async function beiOn(S) {
    if (S.once('bei1')) await S.narr('祠堂门口立着一块石碑，比人还高。\n你拿手电斜着照过去，一个字一个字地认。');
    S.f.readBei = true;
    await S.note('n_bei');
    if (S.f.ph === 'night' && S.once('bei2')) await S.think('出将、入相……槐台。\n整个村子，就是一座戏台。');
  }

  function nightLights(S) {   // 夜里：槐树上的红布条、巷口竖匾的金字，都泛着一点光
    S.ent('huai').light = { r: 3.4, dy: 12, col: 'rgba(200,50,40,.12)' };
    for (const id of ['pW', 'pE']) S.ent(id).light = { r: 1.7, dy: -6, col: 'rgba(255,210,90,.12)' };
  }
  /* ================= 巷子：鬼打墙 ================= */
  async function erhuAppear(S) {
    S.show('erhuM'); S.show('stoolM'); S.focus(12, 14);
    erhu(S, ERHU_A, .045);
    await S.narr('槐树底下，不知什么时候坐了个老头。\n黑布对襟褂子，膝盖上架着一把二胡，吱吱呀呀地拉着。');
    await S.scare('face', { spr: '@erhu', dur: .7 });
    await S.narr('他抬起头来。\n两只眼睛白蒙蒙的，没有眼仁。');
    S.focus(null);
  }
  async function loopBack(S, why) {
    S.f.loops = (S.f.loops || 0) + 1;
    const reset = ritReset(S, why);
    await S.fade(1, 500);
    S.pos(16, 7, 0); LP = [16, 7];
    if (S.f.dl) S.place('dl_x', 16, 6, 0);
    S.ent('huai').num = Math.min(3, S.f.loops);
    if (S.f.ph === 'night' && Math.abs(gpos(S.ent('dan'))[0] - 16) + Math.abs(gpos(S.ent('dan'))[1] - 7) < 9) ghostFar(S);
    await S.fade(0, 500);
    S.sfx('sting');
    const L = ['你朝着村口一直走，一直走……\n眼前又是那棵老槐树。', '又是这棵槐树。\n树枝上的红布条，好像比刚才多了。', '槐树底下撒了一地纸钱。\n刚才明明没有。'];
    await S.narr(L[Math.min(2, S.f.loops - 1)]);
    if (S.f.loops === 1) { S.sfx('blip'); await S.narr('你掏出手机看导航。\n代表你的小蓝点在山坳里一点点往南挪……然后「啪」地一跳，又回到了村子正中间。'); await S.think('……帖子里说的。GPS 乱跳，走着走着，又回到大槐树底下。'); }
    if (!getEnt('erhuM') || S.ent('erhuM').hidden) await erhuAppear(S);
    else if (!S.f.erhuLore || reset) await S.think(reset && S.f.resets >= 2 ? '……槐树底下那个拉二胡的，好像什么都知道。' : '树底下那个拉二胡的，还在拉。');
    ritGoal(S);
  }
  async function toWestEnd(S, msg) {   // 入相门下 → 黑暗里绕一圈 → 出将门外
    await S.fade(1, 600);
    if (msg) await S.narr(msg);
    S.pos(1, 11, 2); LP = [1, 11];
    if (S.f.dl) S.place('dl_x', 1, 10, 2);
    if (S.f.ph === 'night') { const [gx, gy] = gpos(S.ent('dan')); if (Math.abs(gx - 1) + Math.abs(gy - 11) < 10) ghostFar(S); }
    await S.fade(0, 600);
  }
  async function edgeSouth(S) {
    if (!night(S)) { await S.go('cunkou', 12, 1, 0); return; }
    return loopBack(S, '你朝村口走了——这不是戏里的路。');
  }
  async function edgeNorth(S) {
    if (S.f.rit === 7) return finale(S);
    if (ritReset(S, '走进了戏台院子，戏断了。')) await S.wait(300);
    await S.go('xitai', 11, 14, 3);
  }
  async function edgeWest(S) {
    if (!night(S)) { await S.narr('巷子走到头，是一堵塌了半边的院墙，荒草比人还高。\n过不去了。'); return S.pos(1, S.pl.y, 2); }
    if (S.f.rit === 7) return rit7Abort(S, '你转身往出将门外跑——锣鼓声一下子停了。\n……你又站在了西头巷口的黑暗里。');
    if (S.f.rit === 3 || S.f.rit === 6) { await S.think('身后黑漆漆的，什么都没有。\n……只能往前（往东）走。'); return S.pos(2, S.pl.y, 2); }
    return loopBack(S, '出将门只上不下——你从西头出去了。');
  }
  async function edgeEast(S) {
    if (!night(S)) { await S.narr('巷子东头接着一条上山的小路，早被荆棘封死了。\n手电照过去，荆棘上挂着几条褪色的布条——都是驴友系的路标。'); return S.pos(31, S.pl.y, 1); }
    const r = S.f.rit || 0;
    if (r === 7) return rit7Abort(S, '东边也不对。锣鼓声一下子停了。\n……你又站在了西头巷口的黑暗里。');
    if (r === 2 || r === 5) {
      S.f.rit = r + 1; beat(S);
      await toWestEnd(S, r === 2 ? '你走进东头巷子尽头的黑暗。\n脚下一空——再站稳时，你在西头的巷口。\n像戏子从下场门进去，又绕到了上场门后头。' : '又是那片黑暗。\n你从东头进去，又从西头出来了。');
      if (S.once('rit1tip')) await S.think('入相门下，出将门上……\n一点儿不差。');
      ritGoal(S); S.cp('night'); return;
    }
    if (ritReset(S, r === 1 ? '台还没绕，就下场了。' : r === 4 ? '还没望井，就下场了。' : null)) { /* 已提示 */ }
    await toWestEnd(S, '东头巷子尽头的黑暗……\n再站稳时，你在西头的巷口。');
    ritGoal(S);
  }
  async function enterStage(S) {   // 从出将门（西）走进广场 = 上场
    const r = S.f.rit || 0;
    if (r === 0) { S.f.rit = 1; S.f.cs = 0; S.f.cq = null; S.f.half = false; beat(S); if (S.once('up1')) S.toast('（梆子「梆梆」响了两声）'); ritGoal(S); }
    else if (r === 3) { S.f.rit = 4; beat(S); ritGoal(S); }
    else if (r === 6) return third(S);
  }
  function circleStep(S, x, y) {   // 绕槐台一周：按四个方位累计转过的圈
    const dx = x - CXC, dy = y - CYC;
    if (Math.abs(dx) > 4 || Math.abs(dy) > 3) { S.f.cq = null; return; }
    const q = ((Math.round(Math.atan2(dy, dx) / (Math.PI / 2)) % 4) + 4) % 4;
    if (S.f.cq != null && q !== S.f.cq) { const d = (q - S.f.cq + 4) % 4; if (d === 1) S.f.cs = (S.f.cs || 0) + 1; else if (d === 3) S.f.cs = (S.f.cs || 0) - 1; }
    S.f.cq = q;
    if (Math.abs(S.f.cs || 0) >= 2 && !S.f.half) { S.f.half = true; bang(S, .035); }   // 半圈：轻轻一声
    if (Math.abs(S.f.cs || 0) >= 4) { S.f.rit = 2; beat(S); S.toast('（绕了槐台一周。梆子响了两声）'); }
  }
  async function wellOn(S) {
    if (S.f.rit === 4) {
      S.f.rit = 5; beat(S);
      await S.narr('你扶着井沿，往下望。');
      S.sfx('drip'); erhu(S, ERHU_B, .03);
      await S.narr('井水里映出来的，不是你。\n是一个张灯结彩的村子：戏台上挂满了灯，台下挤满了人，娃娃骑在大人脖子上。');
      await S.narr('台侧，一个上好了妆的姑娘正对着井水正凤冠。\n她抬起眼，隔着水看了你一下，抿着嘴笑了。');
      await S.narr('一阵风吹皱了水面。\n井里，又只剩下黑。');
      ritGoal(S); return;
    }
    if (night(S)) return S.narr('井口黑沉沉的。手电照下去，照不到底。\n水面上浮着一点红——是戏台那边灯笼的倒影？这儿明明看不见戏台。');
    return S.narr('广场角上一口老井，井台的石头被井绳磨出了一道道深槽。\n往下看，水面离得很远。');
  }
  async function erhuOn(S) {
    S.face('erhuM', 'pl');
    await erhuTalk(S);
    S.face('erhuM', 0);
  }
  async function erhuTalk(S) {
    if (S.f.ph === 'stage' && S.f.gong) return S.say('拉二胡的', '……锣打完了？那就去把台边上那个后生扶起来。');
    if (S.f.ph === 'stage') {
      await S.say('拉二胡的', ['台上那个，是跟你一道来的吧。', '戏没唱完，台上的人下不来。', '台边上有锣。打个「收头」，这出就算唱完了。锣鼓经，戏本上都有。']);
      if (!S.f.readXB) await S.say('拉二胡的', '戏本？……那间贴喜字的屋里，有她的戏箱。');
      return;
    }
    if (S.f.ph !== 'night') return;
    if (!S.f.erhuLore) {
      S.f.erhuLore = true;
      await S.say('拉二胡的', ['民国二十六年腊月，梆子班来风门唱庙会。', '唱到最后一天，最后一场《夜出风门》——', '……后头的事，各人说法不一样。有说大雪封了山，有说是兵来了。反正那出戏，没唱完。']);
      await S.say('拉二胡的', ['她就一直在台上等。等一个把末场走完的人。', '你们拿了她的东西，又替她开了一回锣。这出戏，算你们接下了。', '照着戏本，把《夜出风门》走一遍。走完了，路就开了。']);
      if (S.has('oldphoto') && !S.f.photoBack) await S.say('拉二胡的', '……还有。人家的东西，记得还回去。');
      S.toast('两个人的话：一个人翻「笺」念戏本，一个人走；唱腔近了，提醒对方站住');
      ritGoal(S); return;
    }
    S.f.htalk = (S.f.htalk || 0) + 1;
    await S.say('拉二胡的', ritHint(S));
    if (S.has('oldphoto') && !S.f.photoBack) await S.say('拉二胡的', '那张照片，放回她屋里去。');
  }
  async function third(S) {   // 第三上：锣鼓从南边响起来
    S.f.rit = 7; S.stop('dan'); S.hide('dan');
    LURES.forEach(id => { S.show(id); S.ent(id).alpha = 1; });
    luoSeq(S, '仓才仓才仓', .3, .08); S.shake(300, 1); GONGT = 1.6;
    S.goal('背着锣鼓声走！别回头');
    if (S.once('r3')) {
      await S.say('南边巷子里', '……喂——！有人吗——！\n我们是山下派出所的！往这边走——！', { style: 'whisper' });
      if (S.f.dl) await S.say('大刘', '搜救队！老程，是搜救队！往南——');
      await S.think('锣鼓声……也是从南边来的。');
    } else S.toast('锣鼓声从南边来了——');
    S.timer(RUN3_T, '锣鼓声紧', run3Fail, { during: true });
  }
  async function rit7Abort(S, msg) {
    S.clearTimer(); LURES.forEach(id => S.hide(id)); S.f.rit = 6;
    await toWestEnd(S, msg);
    S.show('dan'); ghostFar(S);
    ritGoal(S);
  }
  async function run3Fail(S) {
    if (S.f.rit !== 7) return;
    DIED = 'time';
    S.sfx('scream'); S.fx('red');
    await S.die('锣鼓声追到了你背后，一声比一声紧。\n有人在你耳边喊了一嗓子「好——！」\n你回了头。', '戏没走完');
  }
  async function lureCaught(S) {
    S.clearTimer(); DIED = 'lure';
    await S.narr('你朝着那片光跑了过去。\n跑近了才看清——那不是手电，是一盏一盏的红灯笼。\n提灯笼的人，脸都抹得雪白。');
    S.fx('red'); S.sfx('scream');
    await S.die('锣鼓声把你团团围住。有人往你手里塞了一根马鞭——\n「相公，该你上场了。」', '你走进了锣鼓声里');
  }
  async function patrolCaught(S) {
    if (S.f.ph !== 'night') return;
    DIED = 'patrol'; S.stop('dan');
    await S.scare('face', { spr: '@dan', dur: .8 });
    await S.die('唱腔一下子贴到了你耳边。\n一截冰凉的水袖搭上你的肩——再睁眼，你站在戏台上，台下坐满了人。', '你被拉上了台');
  }
  async function finale(S) {
    S.clearTimer(); S.f.ph = 'out'; S.f.rit = 8; LURES.forEach(id => S.hide(id)); S.hide('dan'); S.lights(null);
    await S.narr('你没有回头。\n锣鼓、喊声、灯笼的光，全在你背后。你拽着大刘，一头扎进了北边黑漆漆的巷子。');
    bang(S, .06); bang(S, .04, .5); bang(S, .02, 1);
    await S.narr('巷子越走越窄。脚下的石板变成了土，土变成了草。\n锣鼓声，远了。');
    S.dark(.42, 'cunkou');
    await S.go('cunkou', 12, 2, 0);
    S.amb('wind');
    await S.narr('天边发白了。\n眼前是村口那块碑——「风门」。\n你们明明是往村子里头走的。');
    await S.say('大刘', ['……出来了？', '……老程，出来了！']);
    if (S.f.photoBack) {
      suona(S, .3);
      await S.narr('山坳里，隐隐约约飘来一阵唢呐。\n不是戏，是娶亲的调子——喜庆的，热热闹闹的，越吹越远。');
      await S.think('「唱完这一台，我就不唱了，下台嫁人。」');
    } else {
      await S.narr('大刘的背包侧袋里，露出半张发黄的照片。\n风一吹，它轻轻地拍着背包，拍了一下，又一下。');
    }
    if (S.f.bow) await S.narr('路边土地庙前，你昨晚立的那根烟，刚好烧到了头。');
    if (S.f.photoBack) return S.end({ id: 'out', title: '第十四夜　完', text: '下山路上，碰见一个上山给老宅扫院子的大爷。\n问起戏台，他说：「早先庙会都请梆子班。\n听俺奶奶讲，有年腊月一出戏没唱完，班子就散了。\n唱旦的叫秀芝，唱完那场本来要出嫁的。」\n\n「后来村里人都搬下山了。山上没路没水，娃娃上学要走二十里。\n——那是俺们的家，不是啥鬼村。」\n\n大刘回去以后，把那篇攻略帖删了。' });
    return S.end({ id: 'photo', title: '照片还在包里', text: '回城以后，大刘把那张老照片夹进了一本书里，\n说等哪天再上山，一定还给秀芝。\n\n过了一个月，他半夜给你打电话。\n电话那头没人说话，只有一个人在轻轻地哼——\n是《风门关》的调子。大刘从来不会唱戏。\n\n（照片……要放回喜字房的相框里。）' });
  }

  /* ================= 地图数据 ================= */
  const CK_W = 26;
  function ckCell(x, y) {
    if ((x >= 11 && x <= 13 && y <= 10) || (y >= 10 && y <= 12 && x >= 1 && x <= 24)) return hash(x, y, 7) < .1 ? '"' : 'd';
    if ((y === 2 || y === 3) && ((x >= 3 && x <= 9) || (x >= 15 && x <= 21))) return '#';
    if (y <= 1 || y >= 14 || x === 0 || x === 25) return hash(x, y, 3) < .5 ? 'P' : 'T';
    if (y === 4) return '"';
    if (y >= 4 && y <= 9 && x >= 8 && x <= 17) return '"';
    const h = hash(x, y, 11);
    return h < .12 ? 'T' : h < .17 ? 'P' : h < .2 ? 'K' : '"';
  }
  const CK_ROWS = Array.from({ length: 16 }, (_, y) => row(CK_W, x => ckCell(x, y)));
  const XW = 33, XH = 23;
  const xFloor = (x, y) => (x >= 11 && x <= 21 && y >= 8 && y <= 14) || (x >= 15 && x <= 17 && (y <= 7 || y >= 15)) || (y >= 10 && y <= 12 && (x <= 10 || x >= 22));
  const XIANG_ROWS = Array.from({ length: XH }, (_, y) => row(XW, x => {
    if (x >= 15 && x <= 17 && y >= 10 && y <= 12) return 'H';
    if (xFloor(x, y)) return (x >= 11 && x <= 21 && y >= 8 && y <= 14) ? 'k' : (hash(x, y, 21) < .12 ? '"' : 'd');
    if (y + 1 < XH && xFloor(x, y + 1)) return '#';
    return hash(x, y, 141) < .07 ? 'T' : 'R';
  }));
  const XT_W = 24;
  const XITAI_ROWS = Array.from({ length: 16 }, (_, y) => row(XT_W, x => {
    if (x <= 3 || x >= 20) { if (y >= 7 && y <= 14 && x >= 1 && x <= 22) { if (x >= 19 && y >= 10 && y <= 12) return y === 12 ? '#' : 'R'; return hash(x, y, 4) < .2 ? 'd' : 'k'; } return '#'; }
    if (y <= 1) return 'Q';
    if (y <= 6 && (x === 4 || x === 19)) return 'I';
    if (y === 2) return 'J';
    if (y <= 5) return 'G';
    if (y === 6) return 'F';
    if (y === 15) return x >= 10 && x <= 13 ? 'd' : '#';
    if (x >= 19 && y >= 10 && y <= 12) return y === 12 ? '#' : 'R';
    return hash(x, y, 4) < .2 ? 'd' : hash(x, y, 5) < .06 ? '"' : 'k';
  }));

  defChapter({
    id: 'fengmen', n: 14, title: '封门村', sub: '一个空了几十年的村子。天黑以后，巷子会自己绕回老槐树底下——还有人在唱戏。', origin: '中国河南网络都市传说', color: '#5a1a16',
    icon: '@danIcon', amb: 'wind', floor: 'dirt', wall: 'stone', dark: .6, plr: 3, darkC: '#06040a',
    people: PEOPLE_F, tiles: TILES_F, sprites: SPR_F, items: ITEMS_F, notes: NOTES_F, faces: FACES_F,
    endings: { out: '第十四夜　完', photo: '照片还在包里', stage: '上了戏台', chair: '那把太师椅' },
    legend: '「封门村」是流传最广的中国网络「鬼村」之一。最常见的说法是，它在河南沁阳一带的太行山深处（网上也有把它放在别处的版本）。去过的人多次指出，这个村子在老地图上和当地人嘴里一直叫「风门」——两山夹着一个山口，风大；「封门」是网上以讹传讹的写法，至于「封门绝户」之类的得名故事，查不到任何出处。\n\n2000 年代后期起，户外论坛和贴吧里陆续出现「独闯封门村」一类的探险帖，传说越滚越大：坐过就会出事的太师椅、贴着大红囍字的「喜字房」、照片里多出来的人脸、进村 GPS 就失灵、走着走着又回到原地、半夜听见唱戏……它常被列进各种「中国十大灵异地点」，吸引了不少驴友专门去夜宿探险。\n\n当地人和走访过的媒体给出的说法要平常得多：村民是因为山里交通不便、缺水、孩子上学远等现实困难，几十年间陆续搬到了山下，老房子留着，没人住了；「怪脸」多是光影加心理暗示，也有后期加工的；「太师椅」的说法找不到源头，专门带仪器去的人也说 GPS 一切正常。也常有人提醒：空村里的房子仍然是别人家的老宅，进去乱翻、拿东西，都不合适。\n\n（本章的程野、大刘、梆子班与旦角秀芝、拉二胡的盲眼老人、手抄戏本《风门关》和它的锣鼓经、广场上的「出将」「入相」石柱、重修戏楼碑记、照着戏走出鬼打墙的规矩，以及各个结局，都是游戏虚构；论坛帖的楼层是按流传的说法重写的，不是原帖。戏台上下场门题「出将」「入相」、用「仓才七台」记锣鼓经、庙会请梆子班唱戏（豫剧又称河南梆子），是真实的戏曲习俗，具体的锣鼓点为虚构。）',
    start: { map: 'cunkou', x: 7, y: 12, dir: 3 },
    resume: {
      stage: async S => {
        S.amb('drone'); SINGT = 0; ERHT = 2; LP = null; S.clearTimer(); S.lights(null);
        ritGoal(S);
      },
      night: async S => {
        PI = 0; FOULT = 0; CHILL = false; SINGT = 1; HEART = 0; S.f.foul = 0;
        S.clearTimer(); S.lights(null); LURES.forEach(id => S.hide(id));
        if (S.f.rit === 7) S.f.rit = 6;
        S.stop('dan'); S.freeze('dan', false);
        if (S.map === 'xiang') { S.show('dan'); ghostFar(S); LP = [S.pl.x, S.pl.y]; }
        dlSync(S); ritGoal(S);
        if (DIED) {
          const d = DIED; DIED = null;
          await S.think({ patrol: '唱腔近了，就站住，一步也别挪。\n她只拿会动的人。等她走过去再走。', lure: '第三上，锣鼓从哪边响，就往反方向走——\n哪怕那边看着像是往村子里头去。', time: '第三上不能犹豫。锣鼓一响，马上背着它走，跑起来。' }[d]);
        }
      }
    },
    async intro(S) {
      PI = 0; FOULT = 0; LP = null; DIED = null; CHILL = false;
      await S.card('第十四夜　封门村', '2011年10月　河南　太行山深处', '论坛上有个帖子，叫「独闯中国第一鬼村」。\n楼主说，那个村子里的路，会自己绕圈。\n\n大刘看完帖子，第二天就买好了手电和对讲机。\n「去看看呗，」他说，「天黑前出来就行。」');
    },
    thumb(g, w, h) {   // 戏台剪影：翘檐、红柱、出将入相两道门、两盏红灯笼
      g.fillStyle = '#140808'; g.fillRect(6, 14, 66, 8); g.fillRect(2, 20, 74, 4); g.fillRect(0, 18, 6, 3); g.fillRect(72, 18, 6, 3);
      g.fillStyle = '#7a1e18'; g.fillRect(12, 24, 4, 34); g.fillRect(62, 24, 4, 34);
      g.fillStyle = '#3e1612'; g.fillRect(16, 24, 46, 26);
      g.fillStyle = '#7a1e24'; g.fillRect(20, 34, 10, 16); g.fillRect(48, 34, 10, 16);
      g.fillStyle = '#c8a040'; g.fillRect(19, 28, 12, 5); g.fillRect(47, 28, 12, 5);
      g.font = `bold 5px ${FONT}`; g.fillStyle = '#3a1a0a'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('出将', 25, 31); g.fillText('入相', 53, 31);
      g.fillStyle = '#2e1a12'; g.fillRect(10, 50, 58, 10); g.fillStyle = '#c8a040'; g.fillRect(10, 50, 58, 1);
      for (const x of [18, 58]) { g.fillStyle = '#e8a050'; g.fillRect(x - 3, 24, 6, 7); g.fillStyle = '#a04020'; g.fillRect(x - 3, 26, 6, 1); const gr = g.createRadialGradient(x, 28, 1, x, 28, 16); gr.addColorStop(0, 'rgba(255,140,80,.35)'); gr.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = gr; g.fillRect(x - 16, 12, 32, 32); }
    },
    maps: {
      /* ---------------- 村口 ---------------- */
      cunkou: {
        amb: 'wind', dark: .5, plr: 3.2, wall: 'stone', floor: 'dirt', darkC: '#0a0610',
        tileOpts: { grassC: '#2a3420', treeC: '#14200f' },
        rows: CK_ROWS,
        ents: [
          { id: 'car', x: 3, y: 11, w: 2, spr: 'car', col: '#5a6a72', on: S => S.narr(S.f.ph === 'out' ? '车窗上落了一层露水。\n挡风玻璃上，有一对小小的手印——是从外面按上去的。' : '大刘那辆二手越野，后备箱里塞着帐篷和两箱矿泉水。\n仪表盘上的导航还开着，屏幕上的小箭头，停在一片什么都没有的灰色里。') },
          { id: 'stele', x: 10, y: 5, spr: 'stele', text: '风门', red: true, on: steleOn },
          { id: 'tudi', x: 15, y: 5, spr: 'tudi', on: tudiOn },
          { x: 5, y: 3, spr: 'tuya', decal: true, col: '#c03030', on: S => S.narr('墙上用红漆喷着：「封门村　有去无回」。\n底下又有人用粉笔补了一行：「回来了，没啥」。') },
          { x: 8, y: 3, spr: 'tuya', decal: true, col: '#d8d8c8', on: S => S.narr('粉笔字：「2010.5.1　XX户外到此一游」。\n旁边画了个笑脸，笑脸被人用石头刮掉了一半。') },
          { x: 17, y: 3, spr: 'tuya', decal: true, col: '#d0a020', on: S => S.narr('黄漆写着：「别坐那把椅子！！！」\n三个感叹号，一个比一个大。') },
          { x: 20, y: 3, spr: 'tuya', decal: true, col: '#e0e0e0', on: S => S.narr('一行很工整的粉笔字：\n「这是俺们的老家。来看可以，别乱翻，别拿东西。」') },
          { id: 'dl_k', x: 8, y: 11, spr: '@daliu', dir: 1, on: S => S.say('大刘', S.f.ph === 'out' ? '回家。回家我先睡他三天。' : '快点儿快点儿，天要黑了。') },
          ...[11, 12, 13].map(x => ({ x, y: 0, spr: 'invisible', solid: false, async touch(S) {
            if (S.f.ph === 'out') { await S.think('……不回去了。'); return S.pos(x, 2, 0); }
            if (!S.f.wk1) await walkie1(S);
            await S.go('xiang', 16, 21, 3);
          } }))
        ],
        async enter(S, first) {
          dlSync(S);
          if (!first) return;
          S.give('shoudian', true); S.give('duijiang', true); S.f.ph = 'dusk';
          await S.narr('车在土路尽头停下。再往前，就只能走了。\n太阳已经压到了山尖上，山坳里的影子一层一层地漫上来。');
          S.face('dl_k', 'pl');
          await S.say('大刘', ['到了到了！看见没，那就是村口的碑。', '帖子你再看一眼——我打印出来了。']);
          await S.note('n_post');
          await S.say('大刘', ['我先进去占个好机位，趁天没黑拍几张。', '你锁好车跟上来，对讲机开着啊！']);
          await S.walk('dl_k', [12, 4], 5); await S.walk('dl_k', [12, 1], 5); await S.alpha('dl_k', 0, 400);
          S.goal('在村口看看，然后进村找大刘（往北）');
        },
        step(S, x, y) { if (!S.f.wk1 && y <= 7 && x >= 10 && x <= 14 && S.f.ph === 'dusk') return walkie1(S); }
      },
      /* ---------------- 村里的巷子（鬼打墙） ---------------- */
      xiang: {
        amb: 'wind', dark: .58, plr: 3, wall: 'stone', floor: 'dirt', darkC: '#06040a',
        legend: { R: 'roof', H: 'htai' },
        tileOpts: { grassC: '#26301c', treeC: '#121c0e' },
        rows: XIANG_ROWS,
        ents: [
          { id: 'huai', x: 15, y: 10, w: 3, h: 3, spr: 'huai', num: 0, on: S => S.narr(night(S) ? '老槐树的枝杈在黑暗里张着，像一只手。\n红布条在风里一飘一飘——没有风的时候，它们也在飘。' : '广场正中一棵老槐树，粗得两个人都抱不过来，底下垒着一圈石台。\n树枝上系满了褪色的红布条。有的是村里人以前系的，有的，是驴友系的。') },
          { id: 'well', x: 20, y: 14, spr: 'well', on: wellOn },
          { id: 'stoolM', x: 12, y: 14, spr: 'stool', hidden: true, decal: true, solid: false },
          { id: 'erhuM', x: 12, y: 14, spr: '@erhu', dir: 0, hidden: true, on: erhuOn, light: { r: 1.9, col: 'rgba(255,190,110,.12)' } },
          { id: 'pW', x: 10, y: 9, spr: 'pillar', text: '出将', on: S => S.narr(night(S) ? '西头巷口的石柱，竖匾上两个金字：「出将」。\n戏台上，演员就是从这道门走上台的。' : '西头巷口立着一根石柱，上头挂着一块竖匾，金漆剥落：「出将」。\n……村子的巷口，怎么挂着戏台上的字？') },
          { x: 10, y: 13, spr: 'pillar' },
          { id: 'pE', x: 22, y: 9, spr: 'pillar', text: '入相', on: S => S.narr(night(S) ? '东头巷口的石柱：「入相」。\n戏唱完一段，演员就从这道门下场。' : '东头巷口也有一根石柱，竖匾上写着：「入相」。\n出将、入相——那是戏台上两道门的名字。') },
          { x: 22, y: 13, spr: 'pillar' },
          { id: 'xdoor', x: 5, y: 9, spr: 'sdoor', red: true, col: '#5a3420', async on(S) { await S.go('xizi', 5, 8, 3); } },
          { x: 2, y: 9, spr: 'sdoor', on: S => S.narr('木门上贴着门神，颜色褪得只剩下轮廓。\n门环上拴着一根铁丝，拧得死死的——主人走的时候，是想着要回来的。') },
          { x: 8, y: 9, spr: 'swin', on: S => S.narr('窗户纸早破了。屋里墙上挂着一本老黄历，翻在 1983 年的某一页。') },
          { x: 24, y: 9, spr: 'sdoor', text: '光荣', on: S => S.narr('门楣上钉着一块小铁牌：「光荣之家」。\n铁牌擦得很干净，和周围的灰格格不入。') },
          { x: 27, y: 9, spr: 'swin', on: S => S.narr('窗台上摆着一排空酒瓶，瓶口插着野花，早就干成了褐色。\n不知道是哪拨驴友摆的。') },
          { x: 30, y: 9, spr: 'sdoor', on: S => S.narr('门上有一行粉笔字，被雨水冲得只剩一半：\n「……搬到山下……勿念……」') },
          { x: 12, y: 7, spr: 'swin', on: S => S.narr('「代销点」。窗里的货架上还剩几包受潮的火柴，和一个落满灰的算盘。') },
          { x: 13, y: 7, spr: 'sdoor', on: S => S.narr('代销点的门锁着。门缝里塞着一张纸条：「赊的账，下山找我」。') },
          { x: 19, y: 7, spr: 'sdoor', text: '村委', on: S => S.narr('村委会。门上的油漆字还认得出：「要想富，先修路」。\n路，到底没修上来。') },
          { x: 20, y: 7, spr: 'board', on: S => S.narr('一块黑板报：「关于整体搬迁的通知」。\n下面的字被雨冲花了，只看得清「自愿」「补助」「山下新村」几个词。') },
          { id: 'dan', x: 16, y: 1, spr: '@dan', dir: 0, hidden: true, solid: false, light: { r: 3.2, col: 'rgba(255,80,80,.24)', flick: true } },
          ...LURES.map((id, i) => ({ id, x: [15, 17, 16][i], y: [15, 16, 17][i], spr: 'lantern', hidden: true, solid: false, z: 1, light: { r: 2.6, col: 'rgba(255,80,50,.22)', flick: true } })),
          { id: 'dl_x', x: 0, y: 0, spr: '@daliu', hidden: true, on: dlWake },
          ...[15, 16, 17].map(x => ({ x, y: 22, spr: 'invisible', solid: false, touch: edgeSouth })),
          ...[15, 16, 17].map(x => ({ x, y: 0, spr: 'invisible', solid: false, touch: edgeNorth })),
          ...[10, 11, 12].map(y => ({ x: 0, y, spr: 'invisible', solid: false, touch: edgeWest })),
          ...[10, 11, 12].map(y => ({ x: 32, y, spr: 'invisible', solid: false, touch: edgeEast }))
        ],
        async enter(S, first) {
          LP = [S.pl.x, S.pl.y];
          dlSync(S);
          if (S.f.ph === 'night' && S.f.rit !== 7) { const e = S.ent('dan'); if (e.hidden || Math.abs(gpos(e)[0] - S.pl.x) + Math.abs(gpos(e)[1] - S.pl.y) < 9) { S.show('dan'); ghostFar(S); } }
          if (first) {
            await S.narr('村子比照片上还要安静。\n石头垒的房子一座挨着一座，屋顶铺着石板，门窗都还在——就是没有人。');
            await S.think('大刘说的大院子……戏台……\n应该在村子北头。');
            S.goal('找大刘（村子北头的大院子）');
            return;
          }
          if (S.f.ph === 'night' && S.once('nightIntro')) {
            await S.narr('巷子里，天已经黑透了。\n那个唱腔又响了起来——这回不在戏台上，在巷子里。');
            S.place('dan', 19, 11, 2); PI = 4; S.focus(19, 11); sing(S, .05);
            await S.narr('是台上那个旦角。\n她甩着水袖，在巷子里慢慢地走，一边走一边唱。');
            if (S.ent('erhuM').hidden) await erhuAppear(S);
            S.focus(12, 14);
            await S.say('拉二胡的', ['……后生，唱腔近了，就站住。', '一步也别挪。她不拿不动的人。']);
            S.focus(null);
            S.toast('唱腔近了就站住别动 · 等她走过去再走');
            ritGoal(S);
          }
        },
        step(S, x, y) {
          const lx = LP ? LP[0] : x; LP = [x, y];
          if (!night(S)) return;
          if (S.f.ph === 'night' && x === 11 && lx === 10 && y >= 10 && y <= 12) return enterStage(S);
          if (S.f.rit >= 1 && S.f.rit <= 2 && x >= 15 && x <= 17 && y === 6 && S.once('nWarn')) return (async () => {
            await S.think('「绕台一周」……\n戏台在院子里。可这出戏，是在巷子里唱的。\n村心那座石头垒的台子，也叫「台」。');
            S.pos(x, 8, 0); LP = [x, 8];
          })();
          if (S.f.rit === 1) circleStep(S, x, y);
          if (S.f.rit === 7 && y >= 16 && x >= 15 && x <= 17) return lureCaught(S);
        },
        tick(S, dt) {
          const p = S.pl, em = S.ent('erhuM');
          if (em && !em.hidden && night(S)) { ERHT -= dt; if (ERHT <= 0) { ERHT = 7.5; const d = Math.abs(p.x - 12) + Math.abs(p.y - 14); erhu(S, Math.random() < .5 ? ERHU_A : ERHU_B, .035 * Math.max(.15, 1 - d / 18)); } }
          if (S.f.ph === 'stage') { SINGT -= dt; if (SINGT <= 0) { SINGT = 4; sing(S, .012 + Math.max(0, (11 - p.y)) * .002); } return; }
          if (S.f.ph !== 'night') return;
          if (S.f.rit === 7) { GONGT -= dt; if (GONGT <= 0) { GONGT = .85; const dd = Math.abs(p.x - 16) + Math.abs(p.y - 17); luo(S, Math.random() < .5 ? '仓' : '才', .015 + .075 * Math.max(0, 1 - dd / 18)); } return; }
          const g = S.ent('dan'); if (!g || g.hidden) return;
          const [gx, gy] = gpos(g), d = Math.abs(gx - p.x) + Math.abs(gy - p.y);
          SINGT -= dt; if (SINGT <= 0) { SINGT = 2.6; const v = .06 * Math.max(0, 1 - d / 15); if (v > .003) sing(S, v); }
          if (S.busy) return;
          if (FOULT > 0) { FOULT -= dt; if (FOULT <= 0) S.freeze('dan', false); }
          else if (!g.mv) {
            const [tx, ty] = WP[PI];
            if (gx === tx && gy === ty) PI = (PI + 1) % WP.length;
            else startMove(g, tx > gx ? 2 : tx < gx ? 1 : ty > gy ? 0 : 3, PAT_SPD);
          }
          if (d <= NEAR_R) {
            HEART -= dt; if (HEART <= 0) { HEART = d <= FOUL_R ? .45 : .85; S.sfx('heart'); }
            if (!S.f.nearTip) { S.f.nearTip = true; S.toast('唱腔近了——站住，别动。'); }
          }
          if (FOULT <= 0 && d <= FOUL_R && S.moving) {
            if (!S.f.foul) {
              S.f.foul = 1; FOULT = 1.8; S.freeze('dan');
              g.dir = Math.abs(p.x - gx) > Math.abs(p.y - gy) ? (p.x < gx ? 1 : 2) : (p.y < gy ? 3 : 0);
              S.bubble('dan', '!', 1500); S.sfx('sting'); bang(S, .12); S.fx('flash'); S.shake(250, 1);
              S.toast('她停下了，脸朝着你——站住！别动！');
            } else S.run(patrolCaught);
          }
          if (d === 0 && !S.moving && !CHILL) { CHILL = true; S.toast('……一阵凉风，从你身上穿了过去。'); }
        }
      },
      /* ---------------- 喜字房 ---------------- */
      xizi: {
        amb: 'room', dark: .72, plr: 3, wall: 'mud', floor: 'dirt', darkC: '#06040a',
        rows: [
          '############',
          '############',
          '#..........#',
          '#..........#',
          '#..........#',
          '#..........#',
          '#..........#',
          '#..........#',
          '#..........#',
          '#####.######'],
        ents: [
          { id: 'xi', x: 5, y: 1, spr: 'xi', on: S => S.narr('正墙上贴着一张大红的囍字，剪得很细，边上还剪出了一对凤凰。\n红纸褪成了暗红，四个角还是牢牢地粘在墙上。') },
          { id: 'frame', x: 8, y: 1, spr: 'frame', on: frameOn },
          { x: 2, y: 1, spr: 'swin', on: S => S.narr(night(S) ? '窗外黑漆漆的。远处，唱腔若有若无。' : '窗外，太阳只剩最后一道边。') },
          { x: 3, y: 1, spr: 'hli', on: S => S.narr('墙上一本老黄历，停在腊月。\n那一页上用毛笔圈了一个日子，旁边写着两个小字：「宜嫁娶」。') },
          { id: 'bed', x: 9, y: 2, h: 2, spr: 'bed', col: '#8a2420', on: S => S.narr('土炕上铺着一床大红的缎子被，叠得方方正正。\n被面上绣着鸳鸯。几十年了，没有人在上面睡过。') },
          { id: 'taishi', x: 3, y: 4, spr: 'taishi', on: chairOn },
          { x: 1, y: 2, spr: 'vanity', on: S => S.narr('梳妆台的镜子蒙了一层灰。\n你用袖子擦开一块——镜子里，你身后的炕沿上，好像坐着一个人。\n回头看，什么也没有。') },
          { id: 'xixiang', x: 7, y: 6, spr: 'xixiang', on: xixiangOn },
          { id: 'dl_h', x: 0, y: 0, spr: '@daliu', hidden: true, on: dlWake },
          { x: 5, y: 9, spr: 'invisible', solid: false, async touch(S) { await S.go('xiang', 5, 10, 0); } }
        ],
        async enter(S, first) {
          dlSync(S);
          if (first) {
            await S.narr('屋里一股陈年的灰味。\n手电一照，正墙上一个大红的囍字，红得扎眼。');
            await S.think('……这就是帖子里的「喜字房」。');
          }
        }
      },
      /* ---------------- 戏台院子 ---------------- */
      xitai: {
        amb: 'night', dark: .7, plr: 3, wall: 'stone', floor: 'stone', darkC: '#06040a',
        legend: { Q: 'sroof', J: 'swall', I: 'spill', G: 'stg', F: 'sfront', R: 'roof' },
        rows: XITAI_ROWS,
        ents: [
          { id: 'menL', x: 7, y: 2, spr: 'xmen', text: '出将', on: S => S.narr('台上左手边那道门，门楣上写着「出将」。') },
          { id: 'menR', x: 16, y: 2, spr: 'xmen', text: '入相', on: S => S.narr('台上右手边那道门，门楣上写着「入相」。') },
          { id: 'lanL', x: 5, y: 2, spr: 'lantern', off: true, z: 1, light: { r: 4, dy: 4, col: 'rgba(255,90,60,.22)', flick: true } },
          { id: 'lanR', x: 18, y: 2, spr: 'lantern', off: true, z: 1, light: { r: 4, dy: 4, col: 'rgba(255,90,60,.22)', flick: true } },
          { id: 'stairs', x: 11, y: 6, w: 2, spr: 'stairs', on: stairsOn },
          ...[5, 6, 7, 8, 9, 10, 13, 14, 15, 16, 17, 18].map(x => ({ x, y: 6, spr: 'invisible', on: frontOn })),
          { id: 'cam', x: 12, y: 7, spr: 'cam', decal: true, solid: false, on: camOn },
          { id: 'luo', x: 3, y: 7, spr: 'luo', on: gongOn },
          { id: 'gu', x: 20, y: 7, spr: 'gu', on: S => S.narr('一面堂鼓，鼓皮裂了一道口子。\n你没碰它。可它刚才好像自己「咚」地响了一下。') },
          ...[6, 9, 13, 16].flatMap(x => [9, 11].map(y => ({ x, y, w: 2, spr: 'bench', on: S => S.narr(y === 9 ? (night(S) ? '第一排的长凳。凳面上没有灰。\n……像是一直有人坐着。' : '看戏的长凳，一排一排朝着戏台。\n第一排的凳面，比后面几排都干净。') : '后排的长凳，腿都朽了，歪歪斜斜地排着。') }))),
          { id: 'bei', x: 19, y: 13, spr: 'stele', text: '重修', on: beiOn },
          { x: 21, y: 12, spr: 'cdoor', on: S => S.narr('祠堂的门上着一把大铁锁，锁上缠着红绳。\n门缝里飘出一点陈年的香灰味。') },
          { id: 'dan_st', x: 13, y: 4, spr: '@dan', dir: 0, hidden: true, solid: false, light: { r: 2, col: 'rgba(255,120,120,.12)' } },
          { id: 'dl_st', x: 7, y: 3, spr: '@daliuX', dir: 0, hidden: true, solid: false },
          { id: 'dl_t', x: 18, y: 7, spr: '@daliu', dir: 1, hidden: true, on: dlWake },
          ...[10, 11, 12, 13].map(x => ({ x, y: 15, spr: 'invisible', solid: false, async touch(S) { await S.go('xiang', 16, 1, 0); } }))
        ],
        async enter(S, first) {
          dlSync(S);
          if (first) {
            await S.narr('穿过一道塌了半边的院门，眼前豁然一空。\n院子北头，一座戏台。');
            await S.narr('翘起来的檐角、红漆的柱子，台口的雕花板缺了好几块。\n台下摆着几排长凳，朝着戏台，整整齐齐的，像是在等开戏。');
            await S.say('程野', '大刘？');
            await S.narr('没有人应。\n对讲机里只有沙沙声。');
            S.goal('找大刘（台阶底下好像有东西）');
          }
        },
        tick(S, dt) {
          if (S.f.ph === 'stage' && !S.f.gong) {
            SINGT -= dt; if (SINGT <= 0) { SINGT = 3.6; sing(S, .04); }
            ERHT -= dt; if (ERHT <= 0) { ERHT = 7; erhu(S, Math.random() < .5 ? ERHU_A : ERHU_B, .03); }
          } else if (S.f.ph === 'night') { ERHT -= dt; if (ERHT <= 0) { ERHT = 9; erhu(S, ERHU_B, .012); } }
        }
      }
    }
  });
})();
