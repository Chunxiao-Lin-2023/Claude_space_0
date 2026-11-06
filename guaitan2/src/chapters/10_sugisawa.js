/* ================= 第十夜 · 杉泽村 ================= */
(() => {
  /* ---------- 小工具 ---------- */
  const FONT = '"Noto Sans CJK JP","Hiragino Sans","Yu Gothic","Noto Sans CJK SC","Microsoft YaHei",sans-serif';
  const mod = (a, n) => ((a % n) + n) % n;
  const FRAGS = ['frag_a', 'frag_b', 'frag_c', 'frag_d'];
  const MAP_ANS = '丙甲丁乙';     // 旧地图从西到东
  const LAN_T = 34;                 // 逃出村子的提灯倒计时（秒）
  const TORII_T = 14;               // 鸟居下摆石头的时限（秒）
  const ONO_SPD = 2.75;             // 那个男人的速度（玩家走 4.2）
  let BELLT = 0, AXT = 0, CRIT = 0, HIGT = 0, LANN = 0;

  /* ---------- S.tone 合成音效（双方都听得到） ---------- */
  function suzu(S, v = .05, d = 0) {   // 钥匙上的小铃铛
    S.tone('triangle', 2637, 2610, .55, v, d, 9000); S.tone('sine', 3951, 3900, .4, v * .6, d + .01, 9000); S.tone('sine', 5274, 5200, .28, v * .35, d + .02, 9000);
  }
  function jihou(S) {   // 收音机的报时：哔、哔、哔、嘣——
    for (let i = 0; i < 3; i++) S.tone('sine', 440, 440, .1, .05, i * 1);
    S.tone('sine', 880, 880, 1.1, .05, 3);
  }
  function tuneSweep(S) { S.tone('square', 500, 2600, .7, .012, 0, 1500); S.tone('square', 2600, 900, .5, .01, .7, 1500); }
  function song70(S) {   // 七十年代收音机里的老歌：小调五声音阶，带一点颤音
    [659, 587, 523, 440, 523, 587, 659, 784, 659, 587, 523, 440].forEach((f, i) => { S.tone('triangle', f, f, .34, .032, 3.6 + i * .36, 2200); S.tone('sine', f * 1.006, f * .994, .34, .014, 3.62 + i * .36, 2200); });
  }
  function oldBroadcast(S) {   // 更老的广播：发闷、断断续续的单音
    [523, 523, 587, 523, 440, 392, 440].forEach((f, i) => S.tone('sine', f, f * .99, .42, .03, i * .5, 800));
  }
  function higurashi(S, d = 0, v = .022) {   // 暮蝉：卡那卡那卡那……
    for (let i = 0; i < 8; i++) { const f = 4300 - i * 85; S.tone('sine', f, f * .93, .09, v, d + i * .14, 7000); S.tone('sine', f * 1.5, f * 1.42, .07, v * .4, d + i * .14 + .02, 7000); }
  }
  function cricket(S, d = 0) { for (let i = 0; i < 6; i++) S.tone('sine', 5200, 5100, .04, .01, d + i * .07, 9000); }
  function gong(S, n) {   // 柱时计的钟声
    for (let i = 0; i < n; i++) { S.tone('sine', 392, 386, 1.3, .07, i * .85, 1800); S.tone('sine', 784, 772, .7, .028, i * .85, 2600); S.tone('triangle', 196, 194, 1.1, .03, i * .85, 900); }
  }
  function axeDrag(S, v) {   // 斧头在地上拖：低沉的刮擦
    S.tone('sawtooth', 72, 54, .55, v, 0, 260); S.tone('square', 1900, 1500, .14, v * .12, .32, 3200);
  }
  function slipTone(S) {   // 时间往回倒：一串往上滑的音，像倒放
    for (let i = 0; i < 6; i++) S.tone('sine', 260 + i * 170, 1500 + i * 220, .75, .04, i * .26, 2600);
    S.tone('triangle', 2600, 180, 2.4, .035, 0, 1800);
  }
  function heart(S, n = 2) { for (let i = 0; i < n; i++) { S.tone('sine', 62, 40, .16, .3, i * .7); S.tone('sine', 58, 38, .2, .24, i * .7 + .22); } }

  /* ---------- 人物 ---------- */
  const PEOPLE_S = {
    me: { key: 'sg-me', skin: '#f2d2b6', hair: '#1a1416', hs: 'long', top: '#7a2e32', top2: '#e8e2d8', coat: true, bottom: '#2a2a34', shoes: '#3a2a20',
      extra(g, d, fr, G, R) { R(4, G.tT, 8, 2, '#e2dac4'); if (d === 0) R(9, G.tT + 1, 2, 4, '#e2dac4'); else if (d === 1) R(4, G.tT + 1, 2, 4, '#e2dac4'); } },
    naoto: { key: 'sg-naoto', skin: '#e8c4a2', hair: '#2a2220', hs: 'messy', top: '#3e4c3c', top2: '#c8c0a8', coat: true, bottom: '#2e3038', shoes: '#1a1612',
      extra(g, d, fr, G, R) { if (d === 0) { R(4, G.tT, 1, 6, '#141414'); R(9, G.tT + 5, 4, 3, '#202020'); R(10, G.tT + 6, 2, 1, '#6a8aa0'); } else if (d === 1) { R(3, G.tT + 5, 4, 3, '#202020'); R(3, G.tT + 6, 1, 1, '#6a8aa0'); } } },
    naotoD: { key: 'sg-naotoD', skin: '#e2c8b2', hair: '#2a2220', hs: 'messy', top: '#3e4c3c', top2: '#c8c0a8', coat: true, bottom: '#2e3038', shoes: '#1a1612',
      extra(g, d, fr, G, R) { if (d === 0) { R(5, G.hT + 4, 2, 1, '#e2c8b2'); R(9, G.hT + 4, 2, 1, '#e2c8b2'); R(5, G.hT + 5, 2, 1, '#5a4a44'); R(9, G.hT + 5, 2, 1, '#5a4a44'); R(9, G.tT + 5, 4, 3, '#202020'); } } },
    sumi: { key: 'sg-sumi', skin: '#c89a70', hair: '#c8c4bc', hs: 'bald', top: '#4a4a3a', top2: '#2a2a22', bottom: '#3a3a30', shoes: '#2a2018',
      extra(g, d, fr, G, R) { R(4, G.hT + 1, 8, 1, '#e8e4d8'); if (d === 0) { R(6, G.tT + 3, 1, 1, '#1a1a1a'); R(9, G.tT + 6, 1, 1, '#1a1a1a'); R(5, G.hT + 7, 6, 1, '#a8a49c'); } } },
    onna: { key: 'sg-onna', skin: '#ece2d4', hair: '#141012', hs: 'bun', top: '#3a4658', top2: '#d8d0c0', bottom: '#3a4658', robe: true, shoes: '#2a1e18',
      extra(g, d, fr, G, R) { if (d === 0) { R(4, G.hT + 2, 8, 4, 'rgba(14,10,16,.82)'); R(6, G.hT + 6, 4, 1, '#6a2020'); R(5, G.hT + 5, 1, 1, '#6a2020'); R(10, G.hT + 5, 1, 1, '#6a2020'); R(5, G.tT + 4, 6, 1, '#8a3a2a'); } } },
    ono: { key: 'sg-ono', skin: '#1c171a', hair: '#0a0808', hs: 'messy', top: '#151216', top2: '#0a0a0c', bottom: '#151216', shoes: '#0a0a0c', eye: '#e8e0d0',
      extra(g, d, fr, G, R) {
        if (d === 0) { R(5, G.hT + 4, 2, 1, '#efe8d8'); R(9, G.hT + 4, 2, 1, '#efe8d8'); R(13, G.tT - 1, 1, 12, '#4a3424'); R(11, G.tT + 8, 4, 4, '#8a8c90'); R(11, G.tT + 8, 4, 1, '#c8cad0'); }
        else if (d === 1) { R(4, G.hT + 4, 2, 1, '#efe8d8'); R(2, G.tT - 1, 1, 12, '#4a3424'); R(0, G.tT + 8, 4, 4, '#8a8c90'); R(0, G.tT + 8, 1, 4, '#c8cad0'); }
        else { R(13, G.tT - 1, 1, 12, '#4a3424'); R(11, G.tT + 8, 4, 4, '#6a6c70'); }
      } }
  };

  /* ---------- 惊吓大头像（32×32） ---------- */
  const FACES_S = {
    /* 那个男人：乱发的黑影、瞪得溜圆的白眼、针尖似的瞳孔，斧刃从下面慢慢升上来 */
    ono(R, a) {
      const H = '#100c10', S1 = '#241c22', S2 = '#3a2e34', E = '#f2ecdc', K = '#050304', AX = '#8a8c90', AX2 = '#d8dade', HD = '#4a3424';
      R(0, 0, 32, 32, '#040304');
      R(4, 3, 24, 10, H); for (let i = 0; i < 9; i++) R(2 + i * 3, (i % 2), 2, 5, H);
      R(5, 9, 22, 19, S1); R(4, 9, 4, 19, H); R(24, 9, 4, 19, H); R(9, 17, 14, 9, S2);
      R(8, 12, 7, 2, K); R(17, 12, 7, 2, K);
      const eh = 2 + Math.round(a * 2);
      R(9, 14, 5, eh, E); R(18, 14, 5, eh, E); R(11, 14 + (eh >> 1), 1, 1, K); R(20, 14 + (eh >> 1), 1, 1, K);
      R(15, 18, 2, 3, S1); R(12, 23, 8, 1, K); if (a > .5) R(13, 24, 6, 1, '#1a0808');
      R(1, 28, 30, 4, H);
      const ay = 31 - Math.round(a * 13);
      R(25, ay, 2, 16, HD); R(21, ay - 3, 9, 6, AX); R(21, ay - 3, 9, 1, AX2); R(21, ay + 2, 3, 1, '#5a5c60');
    },
    /* 村里的女人：梳得一丝不乱的发髻、白得发青的脸，眼窝是两团影子，笑越咧越开 */
    onna(R, a) {
      const H = '#141012', SK = '#ece2d4', SK2 = '#cfc4b4', K = '#0c080a';
      R(0, 0, 32, 32, '#0a0810');
      R(11, 0, 10, 5, H); R(6, 4, 20, 8, H); R(6, 8, 3, 18, H); R(23, 8, 3, 18, H);
      R(8, 8, 16, 18, SK); R(9, 26, 14, 2, SK); R(20, 9, 4, 17, SK2); R(9, 8, 14, 2, H);
      const eh = 3 + Math.round(a * 3);
      R(10, 13, 4, eh, a > .45 ? K : '#3a2a30'); R(18, 13, 4, eh, a > .45 ? K : '#3a2a30');
      if (a <= .45) { R(11, 14, 1, 1, '#e8a050'); R(19, 14, 1, 1, '#e8a050'); }
      R(15, 18, 2, 2, SK2);
      const w = 6 + Math.round(a * 10), x0 = 16 - (w >> 1);
      R(x0, 22, w, 1, '#6a1818'); R(x0 - 1, 21, 1, 1, '#6a1818'); R(x0 + w, 21, 1, 1, '#6a1818');
      if (a > .5) for (let i = 1; i < w - 1; i += 2) R(x0 + i, 22, 1, 1, '#e8e0d0');
      R(5, 28, 22, 4, '#3a4658'); R(13, 28, 6, 4, '#d8d0c0');
    },
    /* 骷髅石：长满青苔的石头，两个黑洞洞的眼窝，深处亮起一点红 */
    dokuro(R, a) {
      const ST = '#6a6862', ST2 = '#86847c', ST3 = '#4a4842', MO = '#3a5a2a', K = '#0e0c0a';
      R(0, 0, 32, 32, '#06080a');
      R(5, 3, 22, 26, ST); R(3, 7, 26, 18, ST); R(7, 1, 18, 3, ST2); R(6, 4, 8, 4, ST2);
      R(4, 3, 9, 3, MO); R(22, 20, 6, 6, MO); R(3, 12, 2, 5, MO);
      R(8, 10, 6, 7, K); R(18, 10, 6, 7, K);
      if (a > .35) { R(10, 13, 2, 2, '#c42018'); R(20, 13, 2, 2, '#c42018'); }
      R(15, 18, 2, 3, '#1a1814');
      R(9, 23, 14, 2, ST3); for (let i = 0; i < 6; i++) R(10 + i * 2, 23, 1, 3, ST2);
      R(16, 1, 1, 6, ST3); R(26, 9, 1, 8, ST3); R(6, 20, 3, 1, ST3);
    }
  };

  /* ---------- 瓦片 ---------- */
  const sugiPaint = (R, X, Y, o) => {
    if (o.snow) speck(R, '#c8d0dc', ['#dce4ee', '#b4bcc8'], X, Y, 14, 41);
    else if (o.leaf) speck(R, '#4a3a26', ['#8a3a1a', '#c06a2a', '#5a4a30'], X, Y, 16, 43);
    else TILE.grass.paint(R, X, Y, o);
    const c = o.sugiC || '#13261a';
    R(7, 14, 2, 2, '#2a1c12');
    for (let i = 0; i < 7; i++) { const w = 2 + i * 2; R(8 - w / 2, i * 2, w, 2, i % 2 ? c : shade(c, .14)); }
    R(3, 12, 10, 2, shade(c, -.25));
    if (o.snow) { R(7, 0, 2, 1, '#eef2f8'); R(5, 4, 3, 1, '#e4eaf2'); R(9, 6, 3, 1, '#e4eaf2'); R(3, 10, 4, 1, '#dce4ee'); R(10, 10, 3, 1, '#dce4ee'); }
  };
  const TILES_S = {
    sky0: { solid: true, paint(R, X, Y) {
      if (Y === 0) { R(0, 0, 16, 16, '#080c16'); if (hash(X, Y, 3) < .3) R((hash(X, 1, 4) * 15) | 0, (hash(X, 2, 5) * 14) | 0, 1, 1, '#5a6478'); return; }
      R(0, 0, 16, 16, '#0b1120'); const h = (6 + Math.sin(X * .33) * 3 + hash(X, 0, 9) * 2) | 0;
      R(0, h, 16, 16 - h, '#1a202e'); R(0, h, 16, 1, '#8a94a8'); R(0, h + 1, 16, 1, '#4a5466');
    } },
    sky1: { solid: true, paint(R, X, Y) {
      if (Y === 0) { R(0, 0, 16, 8, '#2a1a36'); R(0, 8, 16, 8, '#4a2442'); return; }
      R(0, 0, 16, 6, '#7a3a48'); R(0, 6, 16, 4, '#b8603e'); R(0, 10, 16, 2, '#e0904a');
      const h = (8 + Math.sin(X * .33) * 3 + hash(X, 0, 9) * 2) | 0; R(0, h, 16, 16 - h, '#24141e');
    } },
    sky2: { solid: true, paint(R, X, Y) {
      if (Y === 0) { R(0, 0, 16, 16, '#050818'); for (let i = 0; i < 3; i++) if (hash(X, Y, 20 + i) < .45) R((hash(X, i, 21) * 15) | 0, (hash(i, X, 22) * 15) | 0, 1, 1, i ? '#6a7aa8' : '#c8d0f0'); return; }
      R(0, 0, 16, 16, '#081026'); if (hash(X, Y, 23) < .3) R((hash(X, 9, 24) * 15) | 0, 2, 1, 1, '#8a9ac8');
      const h = (6 + Math.sin(X * .33) * 3 + hash(X, 0, 9) * 2) | 0; R(0, h, 16, 16 - h, '#04060e'); R(0, h, 16, 1, '#141c34');
    } },
    sugi: { solid: true, paint: sugiPaint },
    nae: { solid: true, paint(R, X, Y, o) {   // 刚种下的杉树苗（昭和四十五年）
      speck(R, '#4a3a26', ['#8a3a1a', '#c06a2a', '#5a4a30'], X, Y, 16, 43);
      R(7, 9, 2, 5, '#3a2a18'); R(5, 5, 6, 2, '#2a4a2a'); R(6, 3, 4, 2, '#3a5a32'); R(7, 1, 2, 2, '#3a5a32'); R(4, 7, 8, 2, '#24402a');
      R(10, 10, 4, 4, '#b8a070'); R(11, 11, 2, 1, '#5a4a30');
    } },
    snowg: { solid: false, paint(R, X, Y) { speck(R, '#c4ccd8', ['#dae2ec', '#aeb6c4', '#e8eef6'], X, Y, 20, 41); if (hash(X, Y, 44) < .2) R(3, 10, 6, 1, '#a8b2c2'); } },
    snowpath: { solid: false, paint(R, X, Y) { speck(R, '#a8b2c0', ['#96a0b0', '#bcc4d0'], X, Y, 14, 45); R(4, 3, 3, 4, '#8e98a8'); R(9, 10, 3, 4, '#8e98a8'); } },
    road0: { solid: false, paint(R, X, Y) { speck(R, '#9aa2ae', ['#b0b8c4', '#8a929e', '#c4ccd6'], X, Y, 16, 46); R(0, 4, 16, 2, '#6a7280'); R(0, 11, 16, 2, '#6a7280'); } },
    leafg: { solid: false, paint(R, X, Y) { speck(R, '#4a3a26', ['#8a3a1a', '#c06a2a', '#5a4a30', '#a84a20', '#d89a3a'], X, Y, 24, 43); } },
    bridge: { solid: false, paint(R, X, Y) {
      TILE.water.paint(R, X, Y); R(2, 0, 12, 16, '#6a4a2e');
      for (let y = 0; y < 16; y += 4) { R(2, y + 3, 12, 1, '#3a2818'); if (hash(X, Y + y, 47) < .3) R(4, y + 1, 3, 1, '#82603c'); }
      R(1, 0, 1, 16, '#3a2818'); R(14, 0, 1, 16, '#3a2818');
    } },
    kare: { solid: true, paint(R, X, Y) {   // 冬天的枯树：光秃秃的枝杈上压着雪
      speck(R, '#c4ccd8', ['#dae2ec', '#aeb6c4'], X, Y, 14, 41);
      R(7, 5, 2, 11, '#3a2e26'); R(8, 13, 3, 2, '#2a201a');
      R(4, 3, 1, 4, '#3a2e26'); R(5, 6, 2, 1, '#3a2e26'); R(11, 2, 1, 5, '#3a2e26'); R(9, 6, 2, 1, '#3a2e26'); R(6, 1, 1, 3, '#3a2e26'); R(10, 0, 1, 3, '#3a2e26');
      R(3, 2, 3, 1, '#e8eef6'); R(10, 1, 3, 1, '#e8eef6'); R(6, 0, 2, 1, '#e8eef6'); R(7, 4, 2, 1, '#dce4ee');
    } },
    kaya: { solid: true, paint(R, X, Y) {   // 茅草屋顶
      R(0, 0, 16, 16, '#5a4a2c');
      for (let r = 0; r < 4; r++) { R(0, r * 4 + 3, 16, 1, '#3e3220'); for (let i = 0; i < 6; i++) { const h = hash(X * 7 + i, Y * 4 + r, 61); R((h * 15) | 0, r * 4, 1, 3, h < .5 ? '#6e5c38' : '#4a3c24'); } }
      if (hash(X, Y, 62) < .25) R(4, 6, 5, 1, '#3a5a2a');
    } },
    ine: { solid: true, paint(R, X, Y) {   // 水田：映着天光的水，一行行稻苗
      R(0, 0, 16, 16, '#14262c'); if (hash(X, Y, 48) < .3) R(3, 6, 4, 1, '#2a4450');
      for (let i = 0; i < 5; i++) for (let j = 0; j < 4; j++) { R(1 + i * 3, 1 + j * 4, 1, 3, '#3e6a34'); R(2 + i * 3, 1 + j * 4, 1, 2, '#5a8a44'); }
      R(0, 15, 16, 1, '#2a3a22');
    } }
  };

  /* ---------- 精灵 ---------- */
  const SPR_S = {
    /* 天气：跟着玩家走，直接在屏幕上画（雪 / 落叶 / 萤火虫） */
    wx(g, e, t) {
      const k = e.kind, cx = CAM.x, cy = CAM.y;
      if (k === 'snow') {
        for (let i = 0; i < 80; i++) {
          const sp = 12 + hash(i, 1, 91) * 22, x = mod(hash(i, 2, 91) * 997 - cx + Math.sin(t * .8 + i) * 6 - t * 7, VW + 8) - 4, y = mod(hash(i, 3, 91) * 997 - cy + t * sp, VH + 8) - 4;
          g.fillStyle = i % 3 ? 'rgba(232,238,248,.7)' : 'rgba(255,255,255,.95)'; const s = i % 6 ? 1 : 2; g.fillRect(x | 0, y | 0, s, s);
        }
      } else if (k === 'leaf') {
        const C = ['#c0482a', '#d8782a', '#a83020', '#e0a040'];
        for (let i = 0; i < 26; i++) {
          const x = mod(hash(i, 2, 92) * 997 - cx + Math.sin(t * 1.3 + i) * 10 - t * 9, VW + 8) - 4, y = mod(hash(i, 3, 92) * 997 - cy + t * (9 + hash(i, 4, 92) * 8), VH + 8) - 4;
          g.fillStyle = C[i % 4]; if (Math.sin(t * 3 + i) > 0) g.fillRect(x | 0, y | 0, 2, 1); else g.fillRect(x | 0, y | 0, 1, 2);
        }
      } else {
        for (let i = 0; i < 22; i++) {
          const b = .5 + .5 * Math.sin(t * 1.7 + i * 1.9); if (b < .35) continue;
          const x = mod(hash(i, 2, 93) * 640 - cx, VW + 60) - 30 + Math.sin(t * .6 + i) * 9, y = mod(hash(i, 3, 93) * 400 - cy, VH + 40) - 20 + Math.cos(t * .5 + i * 2) * 6;
          g.fillStyle = `rgba(214,248,120,${(b * .9).toFixed(2)})`; g.fillRect(x | 0, y | 0, 2, 2); g.fillStyle = `rgba(214,248,120,${(b * .25).toFixed(2)})`; g.fillRect((x | 0) - 1, (y | 0) - 1, 4, 4);
        }
      }
    },
    kcar(g, e, t, R) {   // 直人的旧轿车：一个星期没动过，车顶积着雪
      R(1, 12, 30, 3, 'rgba(0,0,0,.4)');
      box(R, 0, 0, 32, 12, '#4a5868'); R(5, -6, 20, 7, '#3a4656'); R(7, -5, 7, 5, '#141c26'); R(16, -5, 7, 5, '#141c26');
      R(5, -8, 20, 3, '#e4eaf2'); R(4, -7, 22, 1, '#cfd6e0'); R(1, -1, 5, 2, '#dfe6ee'); R(25, -1, 6, 2, '#dfe6ee');
      R(3, 10, 6, 4, '#141414'); R(23, 10, 6, 4, '#141414'); R(30, 3, 2, 3, e.lit ? '#fff4c0' : '#8a8a70'); R(0, 3, 2, 3, '#7a2020');
      R(10, 4, 1, 3, '#2a3440'); R(20, 4, 1, 3, '#2a3440');
      if (e.open) { R(26, -1, 4, 3, '#e8e4d0'); R(27, 0, 2, 1, '#8a8470'); }
    },
    jizo(g, e, t, R) {
      R(3, 13, 10, 2, 'rgba(0,0,0,.35)'); R(3, 9, 10, 5, '#6a6a66'); R(4, 1, 8, 10, '#8a8a84'); R(5, -3, 6, 5, '#9a9a92'); R(6, 0, 1, 1, '#4a4a46'); R(9, 0, 1, 1, '#4a4a46');
      R(3, 3, 10, 4, e.faded ? '#9a5a50' : '#c42a22'); R(4, 6, 8, 1, e.faded ? '#7a4038' : '#8a1a14');
      if (e.snow) { R(4, -5, 8, 2, '#eef2f8'); R(3, 9, 3, 1, '#e4eaf2'); R(10, 9, 3, 1, '#e4eaf2'); }
      R(2, 12, 4, 2, '#7a7a74'); if (e.offer) R(11, 11, 3, 2, '#eee8d8');
    },
    glint(g, e, t, R) { R(5, 10, 6, 3, '#c8d0dc'); const b = Math.sin(t * 4) > .4; R(7, 9, 2, 1, b ? '#fff8c8' : '#c8b060'); if (b) { R(8, 7, 1, 1, '#fffbe0'); R(6, 9, 1, 1, '#fffbe0'); R(10, 9, 1, 1, '#fffbe0'); } },
    barrier(g, e, t, R) { R(2, 2, 2, 12, '#3a3a3a'); R(12, 2, 2, 12, '#3a3a3a'); for (let i = 0; i < 4; i++) R(i * 4, 3, 4, 3, i % 2 ? '#1a1a1a' : '#d8b830'); R(0, 2, 16, 1, '#e4eaf2'); },
    kanban0(g, e, t, R) { R(3, 4, 2, 11, '#4a3a2a'); R(11, 4, 2, 11, '#4a3a2a'); box(R, 0, -8, 16, 13, '#6a5a44', '#3a2e22'); R(1, -7, 7, 6, '#e8e4d8'); R(2, -6, 5, 2, '#2a2a2a'); R(2, -3, 4, 1, '#8a8a8a'); R(9, -7, 6, 8, '#d8d4c4'); R(10, -6, 4, 1, '#c03030'); R(10, -4, 4, 1, '#5a5a5a'); R(0, -9, 16, 2, '#e4eaf2'); },
    hokora(g, e, t, R) {   // 山神祠：小小的木头祠，前面挂着褪色的纸垂
      R(2, 13, 12, 2, 'rgba(0,0,0,.35)'); R(3, 4, 10, 10, '#5a4030'); R(1, 1, 14, 4, '#3a2a1e'); R(5, 6, 6, 6, '#1a120c'); R(7, 8, 2, 2, '#c9a35a');
      R(4, 5, 1, 3, '#e8e4d8'); R(11, 5, 1, 3, '#e8e4d8'); if (e.snow) { R(0, -1, 16, 3, '#eef2f8'); }
    },
    lump(g, e, t, R) {
      if (!e.open) { R(0, 13, 16, 3, 'rgba(20,28,48,.5)'); R(0, 8, 16, 6, '#8e98aa'); R(1, 7, 14, 6, '#c4ccda'); R(2, 4, 12, 4, '#dce4ee'); R(4, 2, 7, 3, '#f2f6fa'); R(2, 12, 12, 1, '#7a8498'); R(10, 9, 3, 2, '#a4aebe'); R(11, -1, 1, 4, '#4a3a2a'); R(12, -2, 1, 2, '#4a3a2a'); R(10, 0, 1, 1, '#4a3a2a'); return; }
      R(0, 9, 4, 5, '#d4dce8'); R(12, 9, 4, 5, '#d4dce8'); R(3, 11, 10, 4, '#2e2820');
      switch (e.kind) {
        case 'stump': R(4, 6, 8, 7, '#4a3626'); R(5, 6, 6, 2, '#8a6a48'); R(7, 6, 2, 1, '#5a4430'); break;
        case 'monu': R(5, -6, 6, 18, '#7a7a76'); R(5, -6, 6, 1, '#9a9a94'); for (let i = 0; i < 5; i++) R(7, -4 + i * 3, 2, 1, '#3a3a38'); break;
        case 'glove': R(5, 10, 6, 3, '#a03028'); R(10, 9, 2, 2, '#a03028'); R(5, 10, 6, 1, '#c04a3a'); break;
        case 'deer': R(4, 9, 8, 4, '#e2dccc'); R(5, 10, 2, 1, '#1a1a1a'); R(9, 10, 2, 1, '#1a1a1a'); R(3, 5, 1, 5, '#d8d0bc'); R(12, 5, 1, 5, '#d8d0bc'); R(2, 5, 2, 1, '#d8d0bc'); R(12, 5, 2, 1, '#d8d0bc'); break;
      }
    },
    nawa(g, e, t, R) {   // 东边那对老杉树之间的草绳（烂得发黑）
      for (let x = 8; x < 40; x++) { const y = -6 + Math.round(Math.sin((x - 8) / 32 * Math.PI) * 4); R(x, y, 1, 2, e.fresh ? '#c8b078' : '#4a4030'); }
      if (e.fresh) for (const x of [16, 24, 32]) { R(x, -1, 2, 3, '#e8e4d8'); R(x + 1, 2, 2, 2, '#e8e4d8'); }
    },
    hands(g, e, t, R) {   // 天亮时车身上的手印
      const c = 'rgba(40,24,24,.8)';
      for (const [x, y] of [[3, -4], [9, -6], [16, -3], [22, -6], [27, 0], [6, 3], [13, 5], [20, 2], [25, 6], [1, 6]]) { R(x, y + 2, 3, 3, c); R(x, y, 1, 2, c); R(x + 1, y - 1, 1, 3, c); R(x + 2, y, 1, 2, c); R(x + 3, y + 3, 1, 1, c); }
    },
    sankaku(g, e, t, R) { R(3, 13, 10, 2, 'rgba(0,0,0,.35)'); R(4, 2, 8, 12, '#a8a49a'); R(4, 2, 8, 1, '#c8c4ba'); R(7, 3, 2, 1, '#3a3a38'); R(7, 4, 1, 2, '#3a3a38'); R(11, 3, 1, 11, '#7a766c'); if (e.snow) R(4, 0, 8, 2, '#eef2f8'); },
    bbridge(g, e, t, R) {   // 塌掉的木桥：两根桩子和吊着的烂木板
      R(1, -2, 2, 30, '#3a2818'); R(13, -2, 2, 30, '#3a2818'); R(3, 2, 6, 2, '#5a3e26'); R(9, 6, 4, 2, '#4a3220'); R(4, 20, 7, 2, '#5a3e26');
      R(3, 3, 1, 8, '#4a3220'); R(12, 7, 1, 10, '#4a3220'); R(0, -3, 16, 2, '#e4eaf2');
    },
    skullst(g, e, t, R) {   // 骷髅石：e.open=立着；e.dir=眼睛朝向（0下 1左 2右 3上）
      const ST = e.moss ? '#64665e' : '#6e6c66', HI = '#86847c', K = '#121010', MO = '#3a5a2a';
      if (!e.open) { R(1, 13, 14, 2, 'rgba(0,0,0,.35)'); R(1, 8, 14, 6, ST); R(2, 7, 12, 2, HI); R(4, 8, 3, 1, MO); R(10, 11, 3, 1, '#4a4842'); return; }
      R(2, 13, 12, 2, 'rgba(0,0,0,.4)'); R(3, 1, 10, 13, ST); R(2, 4, 12, 8, ST); R(4, 0, 8, 1, HI); R(4, 2, 3, 2, HI);
      const d = e.dir;
      if (d === 0) { R(4, 5, 3, 3, K); R(9, 5, 3, 3, K); R(7, 9, 2, 2, '#2a2824'); R(5, 11, 6, 1, '#2a2824'); R(6, 12, 1, 1, '#2a2824'); R(9, 12, 1, 1, '#2a2824'); if (e.glow) { R(5, 6, 1, 1, '#c42018'); R(10, 6, 1, 1, '#c42018'); } }
      else if (d === 3) { R(7, 3, 1, 5, '#4a4842'); R(8, 7, 1, 3, '#4a4842'); R(5, 10, 6, 1, '#56544e'); }
      else { const x = d === 1 ? 2 : 11; R(x, 5, 3, 3, K); R(d === 1 ? 2 : 12, 9, 2, 1, '#2a2824'); R(d === 1 ? 3 : 10, 11, 3, 1, '#2a2824'); }
      if (e.moss) { R(3, 1, 5, 2, MO); R(11, 9, 2, 3, MO); }
      if (e.snow) R(3, 0, 10, 2, '#eef2f8');
    },
    otorii(g, e, t, R) {   // 旧鸟居：朱漆差不多掉光了，挂着一根发黑的注连绳
      const c = '#6a5a50', c2 = '#8a3a2a';
      R(4, 14, 8, 2, '#3a3834'); R(36, 14, 8, 2, '#3a3834');
      R(6, -30, 4, 45, c); R(38, -30, 4, 45, c); R(9, -30, 1, 45, '#4a3e36'); R(41, -30, 1, 45, '#4a3e36');
      R(-2, -37, 52, 3, '#2a221e'); R(0, -34, 48, 3, '#3a302a'); R(2, -27, 44, 3, c);
      R(7, -18, 2, 7, c2); R(39, -8, 2, 6, c2); R(22, -27, 5, 2, c2);
      R(10, -23, 28, 1, '#8a8060'); for (const x of [14, 22, 30]) { R(x, -22, 2, 2, '#d8d0c0'); R(x + 1, -20, 2, 2, '#d8d0c0'); R(x, -18, 2, 2, '#d8d0c0'); }
    },
    hollow(g, e, t, R) { R(2, 6, 12, 8, '#3a2c20'); R(4, 8, 8, 5, '#140e0a'); R(1, 5, 4, 2, '#5a4632'); R(11, 12, 4, 2, '#5a4632'); if (e.open) { R(4, 4, 8, 9, '#6e6c66'); R(5, 3, 6, 1, '#86847c'); R(5, 6, 1, 1, '#121010'); R(10, 6, 1, 1, '#121010'); } },
    kanban2(g, e, t, R) {   // 村口的木牌（竖着写）
      R(7, 4, 2, 11, '#3a2a1a'); box(R, 3, -14, 10, 19, '#7a6a50', '#3a2e22');
      for (let i = 0; i < 6; i++) R(7, -12 + i * 3, 2, 2, i < 3 ? '#1a1410' : '#7a1810');
      R(4, -13, 1, 17, '#5a4a36');
    },
    koya(g, e, t, R) {   // 烧炭小屋：茅草顶
      R(0, 13, 32, 3, 'rgba(0,0,0,.4)'); box(R, 1, -4, 30, 18, '#5a4634'); R(-2, -12, 36, 9, '#6a5a3a'); R(-2, -12, 36, 2, '#8a7a4a'); for (let x = 0; x < 32; x += 3) R(x, -6, 1, 3, '#4a3e28');
      R(12, 2, 8, 12, '#1a120c'); R(4, 1, 5, 4, '#2a1e14'); R(5, 2, 3, 2, '#e89040');
    },
    kama(g, e, t, R) {   // 炭窑：土堆似的窑，窑口一点红光，烟往上飘
      R(0, 13, 16, 3, 'rgba(0,0,0,.4)'); R(1, 4, 14, 10, '#6a4a32'); R(3, 1, 10, 4, '#7a5a3e'); R(5, 0, 6, 1, '#8a6a4a');
      R(5, 9, 6, 5, '#1a0c06'); R(6, 11, 4, 3, Math.sin(t * 5) > 0 ? '#e86020' : '#c84010');
      for (let i = 0; i < 3; i++) { const p = (t * .4 + i / 3) % 1; R(7 + Math.sin(t + i) * 2, -2 - p * 22, 3, 3, `rgba(170,170,170,${(.35 * (1 - p)).toFixed(2)})`); }
    },
    chochin(g, e, t, R) {   // 檐下 / 竿上的提灯（夏祭前夜）
      R(7, -14, 2, 28, '#3a2a1a'); R(3, -14, 10, 1, '#3a2a1a');
      R(4, -12, 8, 1, '#1a1410'); box(R, 3, -11, 10, 11, e.off ? '#4a3a32' : '#f0b060', e.off ? '#2a201a' : '#a05a20'); R(4, -9, 8, 1, e.off ? '#3a2c26' : '#c87830'); R(4, -5, 8, 1, e.off ? '#3a2c26' : '#c87830'); R(4, 0, 8, 1, '#1a1410');
      if (!e.off) { R(6, -8, 4, 2, '#c02818'); }
    },
    taiko(g, e, t, R) { R(1, 6, 2, 8, '#3a2a1a'); R(13, 6, 2, 8, '#3a2a1a'); R(2, -2, 12, 10, '#7a2a1a'); R(3, -1, 10, 8, '#e8dcc0'); R(2, -2, 12, 1, '#c9a35a'); R(2, 7, 12, 1, '#c9a35a'); R(6, 2, 4, 2, '#8a1a14'); },
    kairan(g, e, t, R) { R(3, 4, 2, 11, '#4a3a2a'); R(11, 4, 2, 11, '#4a3a2a'); box(R, -1, -10, 18, 15, '#5a4630', '#2e2418'); R(1, -8, 14, 11, '#d8ccb0'); for (let i = 0; i < 4; i++) R(2, -6 + i * 3, 10 - (i % 2) * 3, 1, '#3a3020'); R(12, -1, 2, 2, '#b82a1a'); },
    mdoor(g, e, t, R) {   // 农家的拉门（墙面那一行）
      R(1, -4, 14, 18, '#3a2a1c'); const lit = e.lit;
      R(2, -3, 6, 16, lit ? '#e8c890' : '#6a5a48'); R(8, -3, 6, 16, lit ? '#e0c088' : '#625240');
      for (let y = -3; y < 13; y += 4) { R(2, y, 12, 1, '#3a2a1c'); } R(7, -3, 2, 16, '#3a2a1c');
      if (e.open) { R(8, -3, 6, 16, '#120c08'); if (lit) R(8, 9, 6, 4, '#3a2410'); }
      if (e.blood) { R(3, 1, 1, 4, '#3a0a08'); R(4, 3, 2, 1, '#3a0a08'); R(10, -1, 1, 3, '#3a0a08'); }
    },
    irori(g, e, t, R) {   // 地炉：铁壶挂在自在钩上，炭火一明一暗
      box(R, 0, 0, 32, 15, '#4a3422', '#2a1c12'); R(3, 3, 26, 9, '#2a2420'); R(5, 5, 22, 5, '#3a3430');
      const b = Math.sin(t * 3) > 0; R(8, 7, 4, 2, b ? '#e86a28' : '#c04a18'); R(15, 6, 3, 3, b ? '#c04a18' : '#e86a28'); R(21, 7, 4, 2, '#a83a12');
      R(15, -22, 2, 24, '#2a2a2a'); R(11, -4, 10, 8, '#1e1e20'); R(12, -5, 8, 1, '#3a3a3c'); R(19, -2, 3, 1, '#1e1e20');
    },
    zen(g, e, t, R) {   // 一人份的饭菜：饭团、味噌汤、腌萝卜
      box(R, 1, 4, 14, 9, '#5a2a1a', '#3a1a10'); R(3, 6, 4, 4, '#f2f0e8'); R(3, 9, 4, 1, '#1a2a1a'); R(9, 6, 4, 4, '#3a2214'); R(10, 7, 2, 2, '#b8864a'); R(8, 11, 4, 1, '#e8c830');
      if (!e.off && Math.sin(t * 2) > -.2) { R(10, 2, 1, 2, 'rgba(230,230,230,.35)'); R(11, 0, 1, 2, 'rgba(230,230,230,.25)'); }
    },
    bundle(g, e, t, R) {   // 壁龛上用包袱布裹着的石头
      R(1, -2, 14, 16, '#5a4630'); R(2, 6, 12, 7, '#6a5238');
      if (e.open) return;
      R(3, 0, 10, 8, '#2a3a6a'); R(4, -1, 8, 2, '#3a4a7a'); R(7, -3, 2, 3, '#2a3a6a'); R(5, 2, 1, 1, '#d8d0c0'); R(10, 4, 1, 1, '#d8d0c0');
    },
    pclock(g, e, t, R) {   // 柱时计
      R(3, -10, 10, 22, '#4a2e1a'); R(4, -9, 8, 8, '#e8e0c8'); R(7, -7, 1, 4, '#1a1410'); R(8, -6, e.lit ? 1 : 3, 1, '#1a1410');
      R(5, 0, 6, 10, '#1a120c'); const sw = Math.round(Math.sin(t * 3.1) * 2); R(7 + sw, 1, 2, 7, '#8a6a30'); R(6 + sw, 7, 4, 2, '#c9a35a');
    },
    shoji2(g, e, t, R) {   // 障子窗：再看一眼，纸上多了一道发黑的痕迹
      R(0, -3, 16, 15, '#3a2a1c'); R(1, -2, 14, 13, '#e8e0c8'); for (let x = 1; x < 16; x += 5) R(x, -2, 1, 13, '#5a4630'); R(1, 2, 14, 1, '#5a4630'); R(1, 6, 14, 1, '#5a4630');
      if (e.blood) { R(4, 0, 2, 6, '#3a0c0a'); R(6, 3, 3, 1, '#3a0c0a'); R(9, -1, 1, 4, '#4a1010'); R(11, 4, 2, 1, '#3a0c0a'); R(5, 7, 1, 3, '#3a0c0a'); }
    },
    andon(g, e, t, R) { R(5, 12, 6, 3, '#3a2a1a'); R(4, 0, 8, 12, '#3a2a1a'); R(5, 1, 6, 10, e.off ? '#5a4a3a' : '#f0d8a0'); R(5, 5, 6, 1, '#3a2a1a'); }
  };

  /* ---------- 文本 ---------- */
  const NOTES_S = {
    n_bro: { title: '直人的采访笔记本', text: '【杉泽村·传闻】\n·据说昭和年间，青森山里有个村子，一个男人一夜之间杀光了全村的人。\n　村子后来被并进邻村，从地图上抹掉了。\n·入口有一座旧鸟居，底下有一块骷髅形状的石头。木牌上写着：\n　「ここから先へ立ち入る者、命の保証はない」（此处之后，擅入者性命不保）\n·找到村子的人，回不来。\n\n【我的发现】\n旧书店淘到一张昭和年间的地形图——上面有那个村子。\n山下的老猎人说：那种骷髅石不止一块，旧路上隔一段就有一块，\n「眼睛全朝着村子。顺着它的眼睛看过去，就看得见旧时候的路。」\n地图复印后裁成四条，塞在四个记号处：车里、地藏、林道闸门、山神祠。\n\n（最后一行，字迹很乱）\n美雪，要是我没回来，别来找我。\n钥匙上挂着你送的铃铛，我一直带着。' },
    n_frag: { title: '四条旧地图', text: '（四条窄窄的竖条复印纸。要从西到东——从左到右——摆。）\n\n甲（车里）\n左边缘：上面一条虚线（旧路）、下面一条双线（林道）伸进来。\n右边缘：虚线、双线伸出去；中间还多了一条蓝线——\n河是从这条纸上开始的，源头画着一个小圆圈。\n\n乙（地藏）\n左边缘：虚线、蓝线、双线都伸进来。右边缘是粗粗的图框线。\n蓝线南边画着两棵并排的小杉树「二本杉」，旁边是「△412.6」。\n\n丙（林道闸门）\n左边缘是图框线，印着经纬度。上方一个鸟居符号和几个小方块，\n地名被小刀刮掉了，只剩一个「沢」字。虚线和双线从右边缘出去。\n\n丁（山神祠）\n左右两边缘都是三条线：上面虚线、中间蓝线、下面双线。\n中间写着小小的「山ノ神」。' },
    n_map: { title: '拼好的旧地图', text: '（四条复印纸并排摆在车前盖上。手电筒的光里，一条旧路连了起来。）\n\n左上角：一座鸟居，几个代表房子的小方块。\n地名被刮掉了，只剩最后一个字——「沢」。\n\n一条虚线（旧路），从右下方的二本杉一直画到鸟居：\n　二本杉 → 往北，过沢上的小桥\n　→ 追分（岔路口）往西 → 鸟居\n\n直人的铅笔字：\n「旧地图上只有一处二本杉——旁边就是△412.6（三角点）。\n　现在山里的另外几对，是后来种的。」\n「第一块骷髅石：二本杉的正北、三角点的正西。被雪埋了就挖。」\n「每找到一块，就顺着它的眼睛看过去。」' },
    n_kairan: { title: '回覧板（杉沢部落会）', text: '一、明晚为夏祭。各户于今夜之内，把提灯挂到檐下。\n　　太鼓由青年团负责，笛子由孩子们负责。\n\n一、近来入夜以后，常有人听见村里「嚓——嚓——」地磨东西。\n　　天黑以后各户闩好门，不要一个人在外面走。\n\n一、若有山外的客人迷路进村，照老规矩，招待一宿。\n\n一、村口鸟居底下那块「看门石」，替山神看着村子，\n　　任何人不许挪动。\n\n（最底下是一排各户的印章，每一个都盖得端端正正。\n　最后一格空着——像是在等谁盖上去。）' }
  };
  const ITEMS_S = {
    frag_a: { name: '旧地图·甲', desc: '一条窄窄的复印纸。直人裁的，边上用铅笔标着「甲」。' },
    frag_b: { name: '旧地图·乙', desc: '一条窄窄的复印纸，压在地藏的供石底下，有点潮。' },
    frag_c: { name: '旧地图·丙', desc: '一条窄窄的复印纸，原本用图钉钉在闸门的告示板上。' },
    frag_d: { name: '旧地图·丁', desc: '一条窄窄的复印纸，塞在山神祠的格子门里。' },
    oldmap: { name: '拼好的旧地图', desc: '四条复印纸，用胶带粘成一张。上面有一条现在的地图上没有的路。（可以在「笺」里翻看）' },
    radio: { name: '直人的收音机', desc: '巴掌大的小收音机，旋钮磨得发亮。开着的时候，它自己会换台。' },
    key: { name: '车钥匙（带铃铛）', desc: '直人的车钥匙。钥匙圈上挂着一只小铜铃——是你去年送他的。一晃就「叮」地响。' },
    stone: { name: '骷髅石', desc: '用蓝色包袱布裹着的一块石头。比看上去沉得多。隔着布，也摸得出两个眼窝。' }
  };

  /* ================= 2001 年冬 · 林道和杉林 ================= */
  let CDIE = 0, TDIE = 0, TWHY = '', GRAZE = false, ONOSEE = 0, REGRAZE = 0;
  const nFrag = S => FRAGS.filter(f => S.f[f]).length;
  function fragGoal(S) {
    if (S.f.mapDone) return;
    const n = nFrag(S);
    if (n < 4) S.goal(`找直人留下的四条旧地图（车里 / 地藏 / 林道闸门 / 山神祠）· ${n}/4`);
    else S.goal('回到车前盖上，把四条旧地图拼起来');
  }
  async function gotFrag(S, id) {
    S.f[id] = true; S.give(id);
    if (nFrag(S) === 4) {
      await S.think('四条都齐了。\n……得找个平一点的地方把它们摆开。车前盖就行。');
      await S.note('n_frag');
    }
    fragGoal(S);
  }
  async function carOn(S) {
    if (!S.f.car1) {
      S.f.car1 = true;
      await S.narr('直人的车。蓝灰色的旧轿车，车顶积了厚厚一层雪。\n雨刷底下夹着一张警察留的条子，已经被雪水泡皱了。');
      await S.narr('车门没锁。车里冷得像冰箱。\n副驾驶座上扔着一本笔记本，和一台巴掌大的收音机。');
      await S.note('n_bro');
      S.give('radio');
      S.sfx('tv'); tuneSweep(S); await S.wait(700); jihou(S); await S.wait(500);
      await S.say('收音机', '……零点整。青森地方新闻。\n今天夜里，县内山区迎来了今年的第一场雪……', { style: 'whisper' });
      await S.narr('你把收音机揣进外套口袋。它开着，声音很小，像有人在你耳边说悄悄话。');
      await S.narr('手套箱里塞着一条窄窄的复印纸。边上用铅笔写着「甲」。');
      await gotFrag(S, 'frag_a');
      await S.narr('钥匙不在车上。\n警察说，他们也没找到。');
      return;
    }
    if (nFrag(S) === 4 && !S.f.mapDone) return assemble(S);
    if (S.f.mapDone) return S.narr('车前盖上还留着四道方方正正的印子——刚才摆地图的地方。\n雪又落了薄薄一层。');
    return S.narr('车里冷得像冰箱。驾驶座上，还留着直人坐出来的凹痕。\n……哥，你到底去哪儿了。');
  }
  async function assemble(S) {
    await S.narr('你把四条复印纸并排摆在车前盖上，用手电筒照着。\n风一吹，纸角就往上翘。');
    if (S.coop) S.toast('双人：一人打开「笺」念《四条旧地图》，一人在密码盘上摆');
    else if (!(await S.ask('先把四条纸各自的边看一遍吗？', ['看一遍《四条旧地图》', '直接拼']))) await S.note('n_frag');
    const tip = S.coop ? '\n（另一位可以打开「笺」念《四条旧地图》；键盘 1=甲 2=乙 3=丙 4=丁）' : '\n（「笺」里有《四条旧地图》；键盘 1=甲 2=乙 3=丙 4=丁）';
    const v = await S.keypad('从西到东（从左到右），依次摆哪一条？' + tip, ['甲', '乙', '丙', '丁'], 4, { alias: { '1': '甲', '2': '乙', '3': '丙', '4': '丁' } });
    if (v == null) return S.narr('你把纸条按住，先收了起来。');
    if (v === MAP_ANS) return mapOK(S);
    if (new Set(v).size < 4) { S.sfx('paper'); return S.think('……同一条纸，摆了两遍？\n四条纸，每条只能用一次。'); }
    const n = S.f.mapWrong = (S.f.mapWrong || 0) + 1;
    S.sfx('paper'); S.shake(200, 1);
    await S.narr('线对不上。虚线断在半空，蓝线一头扎进了林道里。');
    if (n === 2) { S.sfx('tv'); await S.narr('口袋里的收音机「咔」地一响，自己换了台。\n沙沙声里，有个女人在很远的地方笑。'); }
    else if (n === 3) { S.sfx('whisper'); S.shake(300, 1); await S.narr('一阵风贴着车顶刮过去，四条纸差点全飞走。\n你死死按住它们。手指冻得没了知觉。'); }
    return mapHint(S, v);
  }
  function mapHint(S, v) {
    const n = S.f.mapWrong || 0;
    if (n >= 4) return S.think('从左到右：丙、甲、丁、乙。');
    if (n === 3) return S.think('最左边，是带图框和鸟居的丙；最右边，是带图框和二本杉的乙。\n中间两条：看蓝线从哪一条开始。');
    if (n === 2) return S.think('「笺」里的《四条旧地图》——\n把每条纸的右边缘，和下一条的左边缘对上。线要一条接一条。');
    const a = [...v];
    if (a[0] !== '丙') return S.think('最西边那一条，左边缘应该印着图框线才对。');
    if (a[3] !== '乙') return S.think('最东边那一条，右边缘也该是图框线。');
    return S.think('中间两条……那条蓝色的河，总得先有源头，才能往东流。');
  }
  async function mapOK(S) {
    S.f.mapDone = true; FRAGS.forEach(f => S.take(f)); S.give('oldmap');
    S.tone('sine', 660, 660, .18, .04); S.tone('sine', 990, 990, .32, .04, .16);
    await S.narr('虚线接上了虚线，双线接上了双线。\n一条蓝色的河从纸的正中间冒出来，一路往东流。');
    await S.note('n_map');
    await S.think('二本杉、三角点……\n「第一块骷髅石：二本杉的正北、三角点的正西。」');
    S.goal('找第一块骷髅石（二本杉的正北、三角点的正西）——在雪堆底下');
    S.cp();
  }
  async function jizoOn(S) {
    if (!S.f.frag_b) {
      await S.narr('路边一尊小小的地藏，头上顶着一顶雪帽子，红围兜褪成了粉色。\n脚边的供石底下，压着一条复印纸。');
      await gotFrag(S, 'frag_b');
      if (!S.has('key')) { suzu(S, .022); await S.wait(300); await S.narr('……叮。\n风里，好像有一声很轻很轻的铃响。就在附近。'); }
      return;
    }
    return S.narr('地藏低着头，像是在看脚边的什么东西。\n你帮它把头上的雪拂掉了。');
  }
  async function keyOn(S) {
    if (S.has('key')) return;
    S.give('key'); S.hide('kkey'); suzu(S, .05);
    await S.narr('雪里有一点亮光。你蹲下去，扒开雪——\n是一串钥匙。钥匙圈上挂着一只小铜铃。');
    await S.think('……这是我去年送他的。\n他说过，走山路挂着铃铛，熊就不敢靠近。');
    await S.narr('他把钥匙掉在这儿了？还是……故意留下的？\n你把钥匙攥在手心里。铃铛「叮」地响了一声。');
  }
  async function gateOn(S) {
    if (!S.f.frag_c) {
      await S.narr('林道闸门旁边的告示板。\n「この先　崩落のため通行止め」——前方塌方，禁止通行。');
      await S.narr('旁边贴着一张新的寻人启事。照片上的人戴着眼镜，笑得有点傻。\n「十一月十四日起下落不明……如有线索，请与警察署联系」');
      await S.think('……哥。');
      await S.narr('寻人启事下面，用图钉钉着一条窄窄的复印纸。');
      return gotFrag(S, 'frag_c');
    }
    return S.narr('寻人启事上的照片被雪打湿了。\n你用袖子擦了擦。他还是那样傻笑着。');
  }
  async function hokoraOn(S) {
    if (!S.f.frag_d) {
      await S.narr('一座小小的山神祠。格子门上挂着褪色的纸垂。\n门缝里塞着一条复印纸，被雪水洇得发软。');
      await gotFrag(S, 'frag_d');
      return S.narr('你朝山神祠合了合掌。\n「打扰了。……请保佑我哥哥平安。」');
    }
    return S.narr('山神祠的格子门里黑洞洞的。\n供着的一小杯酒，早就冻成了冰。');
  }
  const LUMPS = { lp1: 'stump', lp2: 'monu', lp3: 'skull', lp4: 'glove', lp5: 'deer' };
  async function lumpOn(S, id) {
    const e = S.ent(id);
    if (e.open) return lumpDesc(S, LUMPS[id], false);
    if (!S.f.mapDone) return S.narr('一堆积雪，底下鼓鼓囊囊的。\n这一带到处都是这样的雪堆——没头没脑地挖，挖到天亮也挖不完。\n（先把直人的旧地图拼起来）');
    const r = await S.ask('把雪扒开看看吗？', ['扒开', '算了']); if (r) return;
    S.sfx('step'); await S.wait(220); S.sfx('step');
    if (id === 'lp3') return foundStone(S);
    e.open = true;
    S.f.digWrong = (S.f.digWrong || 0) + 1;
    await lumpDesc(S, LUMPS[id], true);
    return digHint(S);
  }
  async function lumpDesc(S, k, first) {
    if (k === 'stump') return S.narr(first ? '雪底下是一个树桩。切口平平整整的，年轮一圈套一圈。\n……不是这里。' : '一个被锯掉的树桩。');
    if (k === 'monu') return S.narr(first ? '雪底下立着一块小石碑：「植林記念　昭和四十五年」。\n……这一对杉树，是三十年前才种下的。' : '「植林記念　昭和四十五年」。');
    if (k === 'glove') { if (!first) return S.narr('雪坑里空了。直人的红手套，在你口袋里。'); S.f.glove = true; await S.narr('雪底下埋着一只红色的毛线手套。\n……是直人的。去年冬天，你看他戴过。\n你把它揣进了口袋。'); return S.think('他来过这里。\n他也在找。'); }
    if (k === 'deer') { if (!first) return S.narr('一个鹿的头骨，犄角断了一根。'); S.sfx('sting'); S.shake(250, 1); return S.narr('——一对空洞洞的眼窝，从雪里瞪着你。\n……是鹿的头骨。犄角断了一根。'); }
  }
  function digHint(S) {
    const n = S.f.digWrong || 0;
    if (n >= 4) return S.think('就在东边那对二本杉北边两步——三角点石桩的正西边。');
    if (n === 3) return S.think('从三角点那根石桩往西画一条线，从东边那对杉树正中间往北画一条线。\n两条线交叉的地方。');
    if (n === 2) return S.think('旧地图上只有一处二本杉，旁边就是三角点。\n——是东边那一对。');
    return S.think('「二本杉的正北、三角点的正西」。\n先找到三角点那根石桩。');
  }
  async function sankakuOn(S) {
    await S.narr('一根方方正正的花岗岩石桩，顶上刻着一个「十」字。\n侧面：「三等三角点」。');
    if (S.f.mapDone && S.f.era === 0) await S.think('△412.6……就是它。\n骷髅石在它的正西边。');
  }
  async function foundStone(S) {
    S.hide('lp3'); S.show('st1_0'); S.sfx('thud');
    await S.narr('雪底下，有什么硬邦邦的东西。\n你用冻僵的手，一捧一捧地把雪扒开——');
    await S.narr('一块圆滚滚的石头。\n两个黑洞洞的坑，像眼窝。下面一道裂缝，像咧开的牙。');
    await S.think('骷髅石……\n真的有。');
    await S.narr('它背对着你，脸朝着北边——朝着那座塌掉的桥。');
    S.goal('顺着骷髅石的眼睛看过去');
    return stone1On0(S);
  }
  async function stone1On0(S) {
    if (S.f.era >= 1) return;
    const r = await S.ask('「顺着石头的眼睛看过去，就看得见旧时候的路。」', ['蹲下来，和它朝同一个方向看', '先等一等']);
    if (r) return;
    S.f.era = 1;
    S.pos(29, 13, 3);
    await S.narr('你蹲在石头后面，下巴几乎贴着它冰凉的头顶。\n两个眼窝望着的地方——是塌掉的桥，和桥那边黑沉沉的林子。');
    slipTone(S); S.fx('glitch'); S.shake(900, 1); S.sfx('tv');
    await S.fade(1, 1000);
    await S.card('', '', '雪停了。\n\n脚下的雪一点一点化开，渗进土里。\n杉树一棵一棵地矮了下去。\n塌掉的桥，一根木头一根木头地，自己架了回去。\n\n风里，飘来烧炭的烟味。');
    await S.go('mori1', 29, 13, 3);
  }

  /* ================= 昭和四十五年 秋 ================= */
  async function sumiOn(S) {
    S.face('sumi', 'pl');
    if (S.f.sumiHelp) return S.say('烧炭老人', '天快黑透了。要走就趁早。');
    if (!S.f.sumi1) {
      S.f.sumi1 = true;
      await S.say('烧炭老人', '哟——这身打扮，城里来的？');
      await S.say('美雪', '我在找我哥哥。他一个星期前进了山，一直没回来。');
      await S.say('烧炭老人', ['……前两天——也许是前些年？我这记性。\n有个跟你一样穿得怪模怪样的小伙子，抱着一块石头，过了桥往西去了。喊他也不应。', '路边那些骷髅似的石头，老辈人管它叫「看门石」。\n眼睛朝着村子，替山神看着杉沢——一夜之间就没了的那个村子。', '后来山下的人又在旧路上添了几块，一样朝着村子。\n看住它，别让「那一夜」跑出来。']);
      heart(S);
      await S.say('烧炭老人', ['你要是真要去，记住两件事：\n那边的东西，别吃。那边的被子，别盖。', '吃了那边的饭、在那边睡了一宿的人，\n就成了那边的人，再也回不来了。']);
    }
    const r = await S.ask('「……还有什么事？」', ['追分那块倒了的石头，能帮我扶起来吗？', '没事了，谢谢您'], '烧炭老人');
    if (r) return S.say('烧炭老人', '天快黑透了。要走就趁早。');
    await S.say('烧炭老人', ['追分那块？倒了好些年了。', '……也罢。看你一个女娃子大老远跑来，我搭把手。']);
    S.f.sumiHelp = true;
    await S.fade(1, 400);
    S.place('sumi', 28, 7, 2); S.pos(29, 6, 0);
    await S.fade(0, 400);
    S.goal('扶起追分的骷髅石，让它的眼睛朝着旧路的方向');
    return turnStone(S);
  }
  async function stone2On(S) {
    const e = S.ent('st2_1');
    if (e.open) return S.narr('骷髅石立在追分的路口，眼睛望着西边。');
    if (!S.f.sumiHelp) {
      await S.narr('岔路口的草里，倒扣着一块圆滚滚的大石头。\n翻起来的一角，露出一个眼窝似的坑。');
      await S.narr('你抱住它使劲往上抬——它纹丝不动，沉得像长在了地里。');
      await S.think('一个人抬不动……\n东边的炭窑在冒烟。那里有人。');
      S.goal('找人帮忙扶起追分的骷髅石（东边冒烟的炭窑）');
      return;
    }
    const m = S.ent('sumi'); if (Math.round(m.px / TS) !== 28 || Math.round(m.py / TS) !== 7) S.place('sumi', 28, 7, 2);
    return turnStone(S);
  }
  async function turnStone(S) {
    await S.narr('老人朝手心啐了一口，和你一左一右抱住石头。\n「一、二——」');
    S.sfx('thud'); S.shake(300, 2);
    if (S.coop) S.toast('双人：一人翻「笺」看《拼好的旧地图》，一人指方向');
    const r = await S.ask('石头翻起来了。让它的眼睛朝哪边？', ['朝北（上山的岔路）', '朝东（炭窑那边）', '朝西（杉树林那边）', '朝南（来时的桥）']);
    if (r === 2) return stone2OK(S);
    S.f.st2Wrong = (S.f.st2Wrong || 0) + 1;
    const e = S.ent('st2_1');
    if (r === 3) {
      e.open = true; e.dir = 0; e.s.glow = true; S.sfx('sting');
      await S.scare('face', { face: 'dokuro', dur: .8 });
      await S.narr('两个黑洞洞的眼窝，正对着你。深处有一点红光。\n你和老人同时撒了手。石头「咚」地又倒了回去。');
      e.s.glow = false; e.open = false;
    } else {
      await S.say('烧炭老人', r === 1 ? '喂喂，别让它瞪着我的窑！\n这石头看的是「那边」，不是咱们这边。' : '北边？北边只有山崖，连兔子都上不去。');
      S.sfx('thud'); await S.narr('你们又把石头放倒了。');
    }
    if (S.f.st2Wrong >= 2) return S.think('拼好的旧地图：二本杉 → 过桥 → 追分往西 → 鸟居。');
    return S.think('旧路在追分往哪边拐？\n……地图上画着。');
  }
  async function stone2OK(S) {
    const e = S.ent('st2_1'); e.open = true; e.dir = 1; S.sfx('thud');
    S.f.era = 2;
    await S.narr('石头稳稳地立住了。两个眼窝，望着西边那片黑压压的杉树林。');
    await S.say('烧炭老人', ['……西边？西边早就什么也没有了啊。', '……', '你这孩子，真要往那边去？', '那就记牢了：那边的东西别吃，那边的被子别盖。\n天亮之前，一定要出来。']);
    S.pos(29, 6, 1);
    await S.think('顺着它的眼睛……往西看。');
    slipTone(S); S.fx('glitch'); S.shake(900, 1);
    await S.fade(1, 1000);
    higurashi(S, .6);
    await S.card('', '', '红叶一片一片地，飞回了树梢。\n叶子从红变黄，从黄变绿。\n太阳在往回走。\n\n远处，暮蝉叫了起来。\n卡那、卡那、卡那……');
    await S.go('mori2', 29, 6, 1);
  }

  /* ================= 昭和某年 夏夜 · 鸟居 ================= */
  async function hollowOn(S) {
    if (S.f.sealed) return S.narr('骷髅石回到了它的坑里，眼睛望着鸟居里面。');
    await S.narr('鸟居左边的柱子底下，有一个圆圆的土坑。\n坑边的土是新翻出来的，还很湿。');
    await S.think('……这里原本放着一块石头。\n被人搬走了。');
    if (S.once('hollow1')) await S.think('「鸟居底下有一块骷髅形状的石头」——\n直人，是你吗？');
    await S.think('路上那两块骷髅石，眼睛都朝着这边——朝着村子。\n这一块，原本也是吧。');
  }
  async function signOn(S) {
    await S.narr('一块竖着写的旧木牌，墨字已经发黑了：\n「ここから先へ立ち入る者、命の保証はない」\n——此处之后，擅入者性命不保。');
    if (S.once('sign1')) await S.narr('木牌底下的泥里，有一串新鞋印。\n是登山靴的鞋底纹。一直往鸟居里面去了。');
  }
  async function toMura(S) {
    if (S.f.sealed) { await S.think('……不能回头。'); return S.pos(11, 4, 0); }
    if (S.once('toriiPass')) await S.narr('你从鸟居底下穿了过去。\n蝉声，一下子停了。');
    await S.go('mura', 16, 22, 3);
  }

  /* ================= 杉泽村 ================= */
  async function muraEnter(S, first) {
    if (!first) return;
    await S.narr('鸟居后面，是一个村子。\n茅草顶的房子一家挨着一家，家家户户的檐下都挂着提灯，暖黄暖黄的。');
    await S.narr('稻田里有蛙在叫。谁家的灶上在煮饭，空气里一股米香。\n……可是，一个人影都没有。');
    S.place('onna', 16, 20, 0); S.ent('onna').alpha = 0; await S.alpha('onna', 1, 600);
    await S.say('村里的女人', ['哎呀——又来了一位。', '山外来的客人吧？天都黑透了，山路走不得。', '今晚就在村里歇下吧。饭做好了，被子也晒过了。']);
    S.goal('去村子西北角的庄屋（最大的房子）找直人');
    S.cp();
    const r = await S.ask('女人笑眯眯地等着你回答。提灯在她身后，看不清她的脸。', ['谢谢，不用了。我在找我哥哥', '……那就打扰了']);
    if (r === 1) return stayEnd(S, 'invite');
    await S.say('村里的女人', ['哥哥？', '啊——是那个抱着石头的小伙子吧。在庄屋住下了。村子西北角，最大的那座房子。', '……你也会住下的吧？']);
    await S.alpha('onna', 0, 800);
    await S.narr('一眨眼，她就不见了。\n地上，连个脚印都没有留下。');
    S.goal('去村子西北角的庄屋（最大的房子）找直人');
  }
  async function doorAOn(S) {
    if (S.f.hasStone) return S.narr('门从里面闩上了。\n……屋里，什么声音也没有。');
    if (S.once('doorA1')) await S.narr('村子里最大的一座房子。门口挂着一块木牌：「庄屋」。\n拉门里透出暖黄的光。');
    S.sfx('open'); await S.go('ie', 6, 8, 3);
  }
  async function doorDOn(S) {
    const e = S.ent('doorD');
    if (!S.once('doorD1')) return S.narr('门闩着。门板干干净净的。\n……刚才那道黑印子，大概是你眼花了。');
    await S.narr('门闩着。里面黑着灯，没有声音。');
    e.blood = true; S.sfx('sting'); S.shake(200, 1);
    await S.narr('门板上……有一道发黑的印子，从上往下，一溜一溜的。');
    e.blood = false;
    await S.narr('你眨了眨眼。印子不见了。');
  }
  async function doorEOn(S) {
    heart(S);
    await S.narr('这户人家没有点提灯。门缝里黑洞洞的。\n里面有声音——');
    S.tone('square', 1900, 1500, .35, .02, 0, 3200); S.tone('square', 1900, 1500, .35, .02, .9, 3200);
    await S.narr('嚓——　嚓——\n像是有人在磨什么东西。磨得很慢，很仔细。');
    if (S.once('doorE1')) await S.think('……别敲这扇门。');
  }

  /* ---------- 庄屋 ---------- */
  async function naotoOn(S) {
    if (S.f.woke) return S.say('直人', S.f.hasStone ? '走吧。别跑，也别停。' : '石头……在壁龛上。得把它放回去。');
    if (!S.f.naoto1) {
      S.f.naoto1 = true;
      await S.narr('他盘腿坐在地炉边上，一动不动。\n脖子上还挂着那台旧相机。');
      await S.say('美雪', '……哥？');
      S.face('naoto', 'pl');
      await S.say('直人', ['……美雪？', '你怎么也来了。', '这里的人可好了。给我做了饭，还铺好了被子。', '我住一晚，明天一早就回去。']);
      await S.say('美雪', '一晚？你已经失踪一个星期了！警察找了你好几天——');
      await S.say('直人', ['一个星期？说什么呢。', '我今天下午才到的啊。……你看，太阳才刚落山。']);
      await S.narr('他的眼睛直勾勾的，像是隔着一层雾在看你。');
      S.goal('叫醒直人');
    }
    const opts = [], act = [];
    if (S.has('key')) { opts.push('摇响钥匙上的铃铛'); act.push('bell'); }
    opts.push('拽着他就走'); act.push('drag');
    opts.push('……陪他住一晚'); act.push('stay');
    opts.push('先等一等'); act.push('wait');
    const a = act[await S.ask('直人看着地炉里的火。', opts)];
    if (a === 'bell') return wakeNaoto(S);
    if (a === 'stay') return stayEnd(S, 'naoto');
    if (a === 'drag') {
      await S.narr('你抓住他的胳膊使劲往外拽。\n他的胳膊冰凉冰凉的，沉得像一块石头。');
      await S.say('直人', '别闹了，美雪。……明天再走。');
      return S.think(S.has('key') ? '……他听不进去。\n得让他想起「外面」。' : '叫不醒他……\n要是有什么东西，能让他想起「外面」就好了。');
    }
  }
  async function wakeNaoto(S) {
    await S.narr('你把钥匙举到他眼前，轻轻晃了晃。');
    suzu(S, .06); await S.wait(500); suzu(S, .05, .1);
    await S.narr('叮——\n铃声很小，却像是把屋子里的什么东西震碎了。');
    S.ent('naoto').spr = '@naoto';
    await S.say('直人', ['……这铃铛……', '……美雪？', '我……我在这儿待了多久？']);
    await S.say('美雪', '一个星期。');
    await S.say('直人', ['……', '那块石头，是我从鸟居底下搬来的。想拍几张照片给杂志……', '我抱着它一进村子，天就一直是这个晚上。', '得把它放回去。……就在壁龛上。']);
    S.f.woke = true;
    S.goal('从壁龛上拿起骷髅石');
  }
  async function bundleOn(S) {
    if (S.f.hasStone) return S.narr('壁龛上空了，只剩一个圆圆的印子。');
    await S.narr('壁龛上放着一个蓝色的包袱，鼓鼓囊囊的。\n你解开一角——两个黑洞洞的眼窝，从布里露了出来。');
    if (!S.f.woke) {
      if (!S.f.naoto1) return S.think('……地炉边坐着的那个人，是哥哥。\n先跟他说句话。');
      const r = await S.ask('直人还呆呆地坐在地炉边上。', ['不管他了，一个人带着石头走', '先别动它']);
      if (r) return;
      S.f.alone = true;
    }
    return takeStone(S);
  }
  async function takeStone(S) {
    S.f.hasStone = true; S.give('stone'); S.ent('bundle').open = true;
    await S.narr('你把包袱抱进怀里。\n沉。沉得像抱着一个睡着的孩子。');
    await S.wait(300);
    S.ent('pclock').lit = true; gong(S, 12);
    await S.narr('当——\n墙上的柱时计敲响了。一下，两下……');
    await S.narr('……十一，十二。');
    if (!S.ent('onna2').hidden) await S.alpha('onna2', 0, 500);
    const a = S.ent('andon'); a.off = true; a.light = null; S.sfx('switch');
    S.ent('shoji').blood = true;
    await S.narr('行灯「噗」地灭了。地炉里的火，一下子矮了下去。\n障子纸上，浮出一道黑色的痕迹。');
    if (S.f.woke) await S.say('直人', ['……来了。', '美雪，走。抱着石头跑不动的——别跑，也别停。']);
    else await S.narr('直人还坐在那里，一动不动。\n火光，照不到他的脸了。');
    S.goal('带着骷髅石离开村子');
  }
  async function zenOn(S) {
    await S.narr('一人份的饭菜：两个饭团，一碗味噌汤，一碟黄澄澄的腌萝卜。\n还冒着热气。');
    const r = await S.ask('从早上到现在，你什么都没吃。肚子咕地叫了一声。', ['吃一口', '不吃']);
    if (r === 0) return stayEnd(S, 'eat');
    return S.think('「那边的东西，别吃。」');
  }
  async function futonOn(S) {
    await S.narr('被子已经铺好了。蓬松松的，有太阳晒过的味道。');
    const r = await S.ask('你的眼皮，突然变得很沉。', ['躺下歇一会儿', '不行，不能睡']);
    if (r === 0) return stayEnd(S, 'sleep');
    return S.think('「那边的被子，别盖。」\n你狠狠掐了自己一下。');
  }
  async function shojiOn(S) {
    const e = S.ent('shoji');
    if (S.f.hasStone) return S.narr('障子纸上那道黑色的痕迹还在。\n……像是溅上去的。');
    if (!S.f.shoji1) { S.f.shoji1 = true; return S.narr('新糊的障子纸，白得发亮。\n外面的提灯光透进来，暖黄暖黄的。'); }
    if (!S.once('shoji2')) return S.narr('障子纸白得发亮。');
    e.blood = true; S.sfx('sting'); S.shake(200, 1);
    await S.narr('……障子纸上，有一道发黑的痕迹。\n一溜一溜的，像是什么东西溅上去的。');
    e.blood = false;
    await S.narr('你眨了眨眼。纸又是白的了。');
    return S.think('……刚才那个，是「还没有发生」的事吗。');
  }
  async function onna2On(S) {
    await S.say('村里的女人', ['饭菜给您端来了，趁热吃吧。', '被子也铺好了。……今晚就安心睡吧。', '明天是祭典呢。大家都会在的。']);
    await S.narr('她低着头，跪坐得端端正正。行灯照不到她的脸。');
  }
  async function ieExit(S) {
    await S.go('mura', 6, 7, 0);
    if (S.f.hasStone && S.f.ph !== 'chase') return chaseStart(S);
  }
  async function stayEnd(S, how) {
    S.clearTimer();
    if (how === 'eat') await S.narr('你拿起一个饭团，咬了一口。\n米是温的，甜丝丝的。好吃得让人想哭。');
    else if (how === 'sleep') await S.narr('你钻进被子里。被子暖得像是有人刚刚睡过。\n……就躺一会儿。就一会儿。');
    else if (how === 'naoto') await S.narr('你在直人身边坐了下来。\n地炉的火暖烘烘的。……也好，明天一早，两个人一起走。');
    else await S.narr('你跟着女人，走进了一户亮着灯的人家。\n矮桌上摆着饭菜，还冒着热气。');
    await S.say('村里的女人', '……这就对了。', { style: 'whisper' });
    await S.fade(1, 1200);
    gong(S, 12);
    await S.narr('迷迷糊糊之间，你听见柱时计敲了十二下。\n然后是一声拉门响。然后，是一声很重的、什么东西落下来的声音。');
    await S.scare('face', { face: 'onna', dur: .9 });
    await S.narr('……再睁开眼睛的时候，天还是黑的。\n提灯亮着，饭菜冒着热气。\n女人跪在门口，笑眯眯地说：「明天是祭典呢。」');
    return S.end({ bad: true, id: 'stay', title: '住了一晚', text: '回覧板最底下的那一格，盖上了一个新的印章。\n\n第二年春天，林道边那张寻人启事上，又多了一个名字。\n有人说，下雪的夜里，那片山里会飘出米饭的香味，\n还有一个女人的声音，在问迷路的人：\n「今晚，就在村里歇下吧？」' });
  }

  /* ---------- 逃出村子 ---------- */
  const LAN_IDS = ['lan0', 'lan1', 'lan2', 'lan3', 'lan4', 'lan5', 'lan6', 'lan7', 'lan8', 'lan9'];   // 从北往南，越靠村口越晚灭
  function lanReset(S) { for (const id of LAN_IDS) { const e = S.ent(id); e.off = false; e.light = e.def.light; } LANN = 0; }
  function chaseSetup(S) {
    S.f.ph = 'chase'; S.norun(true); S.clearTimer();
    lanReset(S);
    S.stop('ono'); S.place('ono', 16, 21, 3); S.ent('ono').alpha = 1; S.ent('ono').solid = false; S.hide('ono');
    S.hide('onna');
    if (S.f.woke) { S.place('naoto2', 7, 7, 0); S.follow('naoto2', true); }
    S.goal('抱着石头逃出村口——绕开他！（跑不动）');
  }
  async function chaseStart(S) {
    chaseSetup(S);
    S.cp('chase');
    await S.narr('外面的提灯还亮着。蛙声没有了，虫声也没有了。\n整个村子，静得像一口井。');
    return chaseGo(S, false);
  }
  async function chaseGo(S, retry) {
    axeDrag(S, .09);
    S.focus(16, 19);
    S.show('ono'); S.ent('ono').alpha = 0; await S.alpha('ono', 1, 700);
    S.bubble('ono', '…', 1500);
    await S.narr('嚓——　嚓——\n村口的路上，站着一个人。手里拖着什么长长的东西，刃口在提灯底下一闪。');
    S.focus(null);
    if (retry && CDIE) await S.think('他走得慢，可是会抄近路。\n别跟他走同一条路——村里的路一圈连着一圈，绕着房子转，从他身后过去。');
    else await S.think('村口被他堵住了。\n……村里的路一圈连着一圈。绕开他，从他身后过去。');
    if (S.coop) S.toast('双人：一人走，一人盯着他拐进了哪条路');
    GRAZE = false; ONOSEE = 0; REGRAZE = 0;
    S.timer(LAN_T, '提灯', lanOut, { during: true });
    S.chase('ono', { spd: ONO_SPD, catch: onoCatch, wait: .8 });
  }
  async function onoCatch(S) {
    if (!GRAZE) {
      GRAZE = true; S.sfx('thud'); S.shake(500, 3); S.fx('flash');
      S.bubble('ono', '!', 1200);
      const p = S.pl, [qx, qy] = p.prev || [p.x, p.y], dx = qx - p.x, dy = qy - p.y;   // 往来的方向踉跄退两步（他还堵在那条路上）
      let tx = p.x, ty = p.y;
      for (let k = 0; k < 2 && (dx || dy); k++) if (passable(curMap(), tx + dx, ty + dy, p)) { tx += dx; ty += dy; }
      S.pos(tx, ty);
      await S.narr('斧刃擦着你的耳朵劈下来，「咚」地砍进了身边的柱子里。\n你踉跄着退了两步。他拔了两下斧头，没拔出来——');
      REGRAZE = 1.4; S.ent('ono').solid = true;   // 在 tick 里过一会儿才重新追（立刻追会马上又判定抓到）；拔斧头时他还堵在路上
      return S.think('快走！下一次，他不会再砍偏了。');
    }
    S.clearTimer(); CDIE++;
    await S.scare('face', { face: 'ono', dur: .9 });
    await S.die('提灯底下，那个影子抬起了手。\n……后面的事，杉沢的回覧板上没有写。', '你没能走出村子');
  }
  async function lanOut(S) {
    if (S.f.ph !== 'chase') return;
    S.stop('ono'); CDIE++;
    for (const id of LAN_IDS) { const e = S.ent(id); e.off = true; e.light = null; }
    await S.narr('最后一盏提灯，「噗」地灭了。\n黑暗里，那个拖着东西的声音，就在你身后。');
    await S.scare('face', { face: 'ono', dur: .8 });
    await S.die('天，再也没有亮。', '提灯全灭了');
  }
  async function exitS(S) {
    if (S.f.ph === 'chase') return escape(S);
    await S.think('还没找到直人……\n不能就这么回去。'); return S.pos(16, 21, 3);
  }
  async function escape(S) {
    S.clearTimer(); S.stop('ono'); S.hide('ono'); S.f.ph = 'torii'; S.norun(false);
    if (S.f.woke) { S.follow('naoto2', false); S.hide('naoto2'); }
    await S.narr('你冲出了村口——');
    await S.go('mori2', 11, 3, 0);
    return toriiScene(S, false);
  }
  async function toriiScene(S, retry) {
    S.f.ph = 'torii'; S.norun(false);
    S.pos(11, 4, 1); S.hide('ono2');
    if (S.f.woke) S.place('naoto3', 11, 5, 3);
    S.goal('把骷髅石放回鸟居底下的坑里——快！');
    if (!retry) S.cp('torii');
    axeDrag(S, .1);
    S.place('ono2', 11, 2, 0); S.ent('ono2').alpha = 0; await S.alpha('ono2', 1, 500);
    await S.narr('嚓——\n那个影子跟出来了。它停在鸟居底下，离你只有两步。');
    if (retry && TWHY === 'time') await S.think('别犹豫。跪下去，解开包袱，马上选。');
    else if (retry && TDIE) await S.think('「看门石」——眼睛朝着村子，替山神看住它。\n路上那两块，眼睛也都朝着村子。');
    S.timer(TORII_T, '鸟居', toriiFail, { during: true });
    const r = await S.ask('你跪在土坑边上，扯开包袱。骷髅石的眼睛，要朝着哪边？', ['朝着鸟居里面——看着村子', '朝着来时的路——看着外面', '随手塞进坑里，先跑']);
    S.clearTimer();
    if (r === 0) return seal(S);
    TDIE++; TWHY = 'wrong';
    S.ent('hollow').open = true;
    await S.narr(r === 1 ? '石头的眼睛，朝着你来的方向。\n……它看的是你。不是村子。' : '石头歪在坑里，两个眼窝朝着天。');
    await S.scare('face', { face: 'ono', dur: .9 });
    return S.die('没有人替山神看着那个村子了。\n「那一夜」，从鸟居底下走了出来。', '看门石');
  }
  async function toriiFail(S) {
    if (S.f.ph !== 'torii') return;
    TDIE++; TWHY = 'time'; S.sfx('scream');
    await S.scare('red', { dur: .6 });
    return S.die('你的手抖得解不开包袱。\n身后，提灯的光照了过来。', '来不及了');
  }
  const VOL1 = '十个夜晚。\n玛丽在电话里一步一步走近；子取箱在旧仓里等了一百多年；\n犬鸣的隧道，讲不完的牛首，阿岩的梳子，井里数到九的阿菊；\n雪夜里的约定，没有脸的人，二楼最里面的那个房间——\n还有这座从地图上被擦掉的村子。\n\n它们说的，其实都是同一件事：\n活人和「那边」之间，有一条线。\n别回头，别打开，别说出来，别吃，别睡——\n规矩就是那条线。守住它，才回得了家。';
  async function seal(S) {
    S.f.sealed = true; S.f.ph = 'dawn'; S.take('stone');
    const h = S.ent('hollow'); h.open = true;
    S.sfx('thud'); S.shake(400, 2);
    await S.narr('你把骷髅石放进坑里，让它的两个眼窝，对着鸟居里面。\n对着那个村子。');
    S.tone('sine', 392, 392, 1.6, .04); S.tone('sine', 587, 587, 1.6, .03, .05); S.tone('sine', 784, 784, 1.8, .02, .1, 3000);
    S.bubble('ono2', '…', 1600);
    await S.narr('鸟居底下的影子，停住了。\n它低头看着那块石头。石头也看着它。');
    await S.alpha('ono2', 0, 1500);
    await S.narr('影子一点一点地淡了下去，像一滴墨落进了水里。\n鸟居那边的提灯，一盏，一盏，全都灭了。');
    if (S.f.woke) await S.say('直人', '……走吧。别回头。');
    await S.fade(1, 1200);
    await S.card('', '', (S.f.woke ? '你们没有回头。' : '你没有回头。') + '\n\n萤火虫一只一只地熄灭了。\n叶子从绿变黄，从黄变红，一片一片落下来。\n然后，是雪。');
    S.dark(.42, 'mori0');
    if (S.f.woke) S.show('naoto0');
    await S.go('mori0', 7, 22, 1);
    S.show('hands');
    await S.narr('天边泛起了鱼肚白。\n林道上的雪，被晨光照得发蓝。');
    await S.narr('直人的车上——车门、车窗、车顶，印满了手印。\n一个挨一个，都是从外面按上去的。\n车子四周的雪地上，却一个脚印也没有。');
    S.sfx('tv'); jihou(S); await S.wait(600);
    await S.say('收音机', '……早上六点。二〇〇一年十一月二十一日，星期三。\n青森地方，今天白天晴转多云……', { style: 'whisper' });
    if (S.f.woke) {
      S.face('naoto0', 'pl'); S.face('pl', 'naoto0');
      await S.say('直人', '……真冷啊。');
      if (S.f.glove) { await S.narr('你从口袋里掏出那只红手套，塞进他手里。'); await S.say('直人', ['……我还以为丢在哪儿了。', '一直在找它。在那边，好像也一直在找什么东西。']); }
      await S.say('直人', '美雪。那几张照片，我不交给杂志了。');
      await S.say('美雪', '嗯。');
      await S.narr('他把旧相机从脖子上摘下来，看了很久。然后打开后盖，把胶卷整卷拉了出来。\n胶卷在晨光里，一下子变成了白茫茫的一片。');
      await S.card('卷一　终', '', VOL1);
      return S.end({ id: 'home', title: '第十夜　完', text: '后来你查过很多资料。\n青森县的旧档案里，找不到一个叫「杉沢」的村子发生过那种事的记录。\n那块牌子、那座鸟居、那块骷髅石，也从来没有人拍到过。\n\n直人没有写那篇稿子。\n他把那张旧地图连同四条复印纸，一起烧掉了。\n\n只是每年下第一场雪的晚上，他都会把那只小铜铃挂在门口。\n风一吹，「叮」地一响——\n像是在替谁看着门。' });
    }
    await S.narr('林道上只有你一个人。\n直人的车还停在那里，车顶的雪又厚了一层。');
    await S.think('……哥。');
    await S.card('卷一　终', '', VOL1);
    return S.end({ id: 'alone', title: '一个人下山', text: '后来，警察又进山搜了两次。\n直人的名字，一直留在林道边那张寻人启事上。\n\n你有时候会梦见那个夏夜：提灯，米饭的香味，地炉边那个背影。\n他总是说：「明天一早就回去。」\n\n……要是那天，你手里有什么能让他想起「外面」的东西就好了。\n比如，地藏旁边雪地里，那一点小小的亮光。' });
  }

  /* ================= 地图数据 ================= */
  /* 同一片山林，三个年代共用一张底图：字符在不同年代的 legend 里代表不同的东西
     p = 后来才种的二本杉（2001 年是大杉树，昭和四十五年是树苗，更早是空地）
     r = 旧路（2001 年被灌木吞没）  v = 鸟居和村口（只在最早的那个夏夜里是路）  H = 沢上的桥（2001 年塌了） */
  const MW = 36, MH = 26;
  const KEYP = [[4, 14], [6, 14], [16, 14], [18, 14], [28, 14], [30, 14], [5, 12], [17, 12], [29, 12], [32, 16], [24, 19], [12, 20], [13, 21], [22, 16], [33, 12], [26, 21], [17, 13], [29, 13]];
  const nearKey = (x, y) => KEYP.some(([a, b]) => Math.abs(a - x) <= 1 && Math.abs(b - y) <= 1);
  function moriCell(x, y) {
    if (y <= 1) return 'N';
    if (x === 0 || x === MW - 1) return 'P';
    if (y === 2) return x === 11 ? 'v' : x === 30 ? 'K' : 'P';
    if (y <= 9) {
      if (x >= 10 && x <= 12 && y <= 5) return 'v';
      if (x === 11 && y === 6) return 'v';
      if (y === 6 && x >= 12 && x <= 32) return 'r';
      if (x === 30) return 'r';
      if (x >= 31 && x <= 34 && y >= 3 && y <= 8 && !(x === 34 && (y === 3 || y === 8))) return 'r';
      if (y >= 7 && y <= 8 && x >= 14 && x <= 27) return hash(x, y, 7) < .16 ? 'T' : 'G';
      return hash(x, y, 5) < .55 ? 'P' : 'T';
    }
    if (y <= 11) return x === 30 ? 'H' : '~';
    if (y >= 24) return y === 24 && hash(x, y, 9) < .5 ? 'T' : 'P';
    if (y >= 22) return ':';
    if ([[4, 14], [6, 14], [16, 14], [18, 14]].some(([a, b]) => a === x && b === y)) return 'p';
    if ((x === 28 || x === 30) && y === 14) return 'P';
    if (x <= 1 || x >= 34) return 'P';
    if (y === 21) return (x >= 3 && x <= 15) || nearKey(x, y) ? 'G' : (hash(x, y, 3) < .4 ? 'T' : 'G');
    if (!nearKey(x, y) && hash(x, y, 11) < .085) return hash(x, y, 12) < .5 ? 'P' : 'T';
    return 'G';
  }
  const MORI_ROWS = Array.from({ length: MH }, (_, y) => Array.from({ length: MW }, (_, x) => moriCell(x, y)).join(''));
  const UW = 34, UH = 24;
  const MTREE = ['27,9', '27,16', '3,4', '19,7', '13,7', '26,4'];
  function muraCell(x, y) {
    if (y <= 1) return 'N';
    if (x === 30 || x === 31) return '~';
    if (x <= 1 || x >= 32 || y === 2) return 'P';
    if (x >= 3 && x <= 9 && y >= 3 && y <= 6) return y === 6 ? '#' : 'k';
    if (x >= 4 && x <= 8 && ((y >= 10 && y <= 12) || (y >= 16 && y <= 18))) return y === 12 || y === 18 ? '#' : 'k';
    if (x >= 20 && x <= 25 && ((y >= 10 && y <= 12) || (y >= 16 && y <= 18))) return y === 12 || y === 18 ? '#' : 'k';
    if (y >= 21) return (x === 16 || (y === 21 && x >= 15 && x <= 17)) ? 'd' : 'P';
    if (x >= 10 && x <= 14 && ((y >= 9 && y <= 13) || (y >= 15 && y <= 19))) return 'i';
    if ((x === 15 || x === 17) && ((y >= 9 && y <= 13) || (y >= 15 && y <= 19))) return 'h';   // 大路两边的树篱：大路是一条窄道
    if (x === 16 && y >= 5) return 'd';
    if (y >= 3 && y <= 5 && x >= 13 && x <= 19) return 'd';
    if ((y === 8 || y === 14 || y === 20) && x >= 2 && x <= 29) return 'd';
    if (x === 2 && y >= 8 && y <= 20) return 'd';
    if (x === 29 && y >= 5 && y <= 20) return 'd';
    if (y === 5 && x >= 19 && x <= 29) return 'd';
    if (y === 7 && x >= 3 && x <= 9) return 'd';
    if ((y === 13 || y === 19) && ((x >= 4 && x <= 8) || (x >= 20 && x <= 25))) return 'd';
    if (MTREE.includes(x + ',' + y)) return 'T';
    return 'G';
  }
  const MURA_ROWS = Array.from({ length: UH }, (_, y) => Array.from({ length: UW }, (_, x) => muraCell(x, y)).join(''));
  const wxFollow = (S, id) => { const w = S.ent(id); if (w) { w.px = S.pl.px; w.py = S.pl.py; } };
  const LANP = [[12, 4], [20, 4], [15, 7], [3, 9], [28, 9], [17, 10], [3, 15], [28, 15], [15, 17], [17, 19]];
  const LANL = { r: 2.8, dy: -8, col: 'rgba(255,170,90,.22)', flick: true };
  const pillar = (x, y, d) => ({ x, y, spr: 'invisible', solid: true, on: S => S.narr(d) });
  const twins = (W2, C2, E2) => [[4, 14, W2], [6, 14, W2], [16, 14, C2], [18, 14, C2], [28, 14, E2], [30, 14, E2]].filter(a => a[2]).map(([x, y, d]) => pillar(x, y, d));

  defChapter({
    id: 'sugisawa', n: 10, title: '杉泽村', sub: '据说村口的鸟居底下，有一块骷髅形状的石头。找到那个村子的人，回不来。', origin: '日本青森都市传说', color: '#2c3644',
    amb: 'wind', floor: 'dirt', wall: 'wood', dark: .82, plr: 3,
    people: PEOPLE_S, faces: FACES_S, tiles: TILES_S, sprites: SPR_S, items: ITEMS_S, notes: NOTES_S,
    endings: { home: '第十夜　完', alone: '一个人下山', stay: '住了一晚' },
    legend: '「杉沢村」（すぎさわむら）是日本青森县流传最广的都市传说之一。据说昭和年间，青森的山里有一个村子，某天夜里，一个村民突然发了狂，杀害了全村的人；此后村子再也没有人住，被并入邻近的町村，从地图和行政记录上消失了。传说里，村子的入口有一座破旧的鸟居，鸟居底下有一块形状像骷髅的石头，旁边立着一块牌子：「ここから先へ立ち入る者、命の保証はない」（此处之后，擅入者性命不保）。穿过鸟居，能看见几间废屋，墙上还留着发黑的痕迹。最常见的结尾是：找到村子的人，再也没有回来。\n\n流传的版本很多：有的说几个年轻人开车去探险，在废屋里看见血迹后逃回车上，天亮才发现车身上印满了手印；有的说那块牌子只在特定的时候才看得见；也有的说，村子只是从地图上被抹掉了，「村里人」一直还在。这个传说在1990年代靠口耳相传和早期的网络扩散开来；2000年前后，一档电视节目做了「寻找杉泽村」的特辑，引发了一阵探访热潮，也给当地居民和土地所有者带来了不少困扰。\n\n有据可查的部分很少。日本各地有不少叫「杉沢」的地名，但青森县的记录里，并没有哪个村子发生过传说中那样的事件。据说有人实地查访过传说所指的地方，那里只是一处因人口外流而自然荒废的小聚落，住户早已搬到山下过日子；所谓的「骷髅石」和「鸟居」，多半是普通的石头和神社遗迹被传言放大了。也有一种说法认为，传说的原型是昭和初年发生在别的县的一桩真实惨案，在口口相传中被「搬」进了青森的山里——但这只是据说，两者之间并没有确凿的联系。\n\n（本章中的美雪与直人、旧地图与四条复印纸、沿着旧路排成一串的骷髅石、「顺着它的眼睛看过去」就能回到过去的设定、烧炭老人、杉沢的回覧板与夏祭前夜、村里的女人、钥匙上的铃铛，以及全部结局，均为游戏虚构。「吃了那边的东西就回不来」的规矩，取自日本神话里的「黄泉戸喫」。现实中的废弃聚落多是私有土地，请勿擅自进入。）',
    start: { map: 'mori0', x: 6, y: 22, dir: 1 },
    resume: {
      chase: async S => { chaseSetup(S); return chaseGo(S, true); },
      torii: async S => toriiScene(S, true)
    },
    async intro(S) {
      BELLT = 0; AXT = 0; CRIT = 0; HIGT = 4; LANN = 0; CDIE = 0; TDIE = 0;
      await S.card('第十夜　杉泽村', '2001年11月20日　深夜　日本青森县 · 山中林道', '哥哥直人失踪，已经一个星期了。\n\n他给一本神秘杂志写稿。最后一次打电话回家，\n他兴冲冲地说：「我找到杉泽村了。」\n\n警察在林道尽头找到了他的车。\n人，没有找到。');
    },
    thumb(g, w, h) {
      g.fillStyle = '#0a121c'; g.fillRect(0, 0, w, h - 22);
      for (let i = 0; i < 9; i++) { const x = i * 19 - 6 + (i % 2) * 5; g.fillStyle = '#0d1a16'; for (let k = 0; k < 6; k++) g.fillRect(x + 9 - k * 2, 4 + k * 8, 3 + k * 4, 8); g.fillStyle = '#c8d0dc'; g.fillRect(x + 9, 4, 3, 1); }
      g.fillStyle = '#b8c2d0'; g.fillRect(0, h - 30, w, 8);
      g.fillStyle = '#2a221e'; g.fillRect(42, 12, 76, 5); g.fillStyle = '#3a302a'; g.fillRect(45, 17, 70, 3);
      g.fillStyle = '#6a5a50'; g.fillRect(53, 17, 6, 52); g.fillRect(101, 17, 6, 52); g.fillRect(48, 26, 64, 4);
      g.fillStyle = '#8a3a2a'; g.fillRect(54, 34, 3, 9); g.fillRect(102, 44, 3, 6);
      g.fillStyle = '#8a8060'; g.fillRect(59, 33, 42, 1); g.fillStyle = '#d8d0c0'; for (const x of [66, 79, 92]) g.fillRect(x, 34, 3, 5);
      g.fillStyle = '#eef2f8'; g.fillRect(42, 11, 76, 2);
      g.fillStyle = '#5e5c56'; g.fillRect(69, 49, 22, 20); g.fillStyle = '#6e6c66'; g.fillRect(67, 52, 26, 13); g.fillRect(71, 47, 18, 3);
      g.fillStyle = '#eef2f8'; g.fillRect(70, 46, 20, 3);
      g.fillStyle = '#100c0a'; g.fillRect(72, 54, 6, 6); g.fillRect(82, 54, 6, 6); g.fillRect(79, 61, 2, 3); g.fillRect(73, 66, 14, 1);
      g.fillStyle = '#c42018'; g.fillRect(74, 56, 2, 2); g.fillRect(84, 56, 2, 2);
      g.fillStyle = '#3a2a1a'; g.fillRect(130, 44, 3, 25); g.fillStyle = '#7a6a50'; g.fillRect(124, 22, 15, 34); g.fillStyle = '#3a2e22'; g.fillRect(124, 22, 15, 1);
      g.font = `bold 8px ${FONT}`; g.textAlign = 'center'; g.textBaseline = 'middle';
      ['命', 'の', '保', '証'].forEach((c, i) => { g.fillStyle = i ? '#1a1410' : '#8a1810'; g.fillText(c, 131.5, 27 + i * 8); });
      for (let i = 0; i < 40; i++) { g.fillStyle = 'rgba(240,244,250,.8)'; g.fillRect((hash(i, 1, 10) * w) | 0, (hash(i, 2, 10) * (h - 24)) | 0, 1, 1); }
    },
    maps: {
      /* ---------------- 2001 年冬 · 林道尽头 ---------------- */
      mori0: {
        amb: 'wind', dark: .86, plr: 3.2, darkC: '#03060c',
        legend: { N: 'sky0', P: 'sugi', p: 'sugi', v: 'sugi', T: 'kare', G: 'snowg', ':': 'road0', H: { t: 'water', solid: true }, r: 'bushes', ',': 'snowpath' },
        tileOpts: { snow: true, grassC: '#aab2be', treeC: '#33302c', sugiC: '#13261a' },
        rows: MORI_ROWS,
        ents: [
          { id: 'wx0', x: 6, y: 22, spr: 'wx', kind: 'snow', solid: false, z: 3 },
          { id: 'car', x: 4, y: 22, w: 2, spr: 'kcar', on: carOn },
          { id: 'jizo', x: 12, y: 20, spr: 'jizo', snow: true, faded: true, on: jizoOn },
          { id: 'kkey', x: 13, y: 21, spr: 'glint', solid: false, on: keyOn },
          { id: 'gboard', x: 26, y: 21, spr: 'kanban0', on: gateOn },
          { id: 'bar1', x: 27, y: 22, spr: 'barrier', on: S => S.narr('黄黑相间的闸杆，锁得死死的。\n闸杆那边，林道塌了一半，再往前就是悬崖。') },
          { id: 'bar2', x: 27, y: 23, spr: 'barrier', on: S => S.narr('闸杆上挂着一块铁牌：「林道　関係者以外通行禁止」。\n铁牌上结了一层薄冰。') },
          { id: 'hokora', x: 22, y: 16, spr: 'hokora', snow: true, on: hokoraOn },
          { id: 'sankaku', x: 33, y: 12, spr: 'sankaku', snow: true, on: sankakuOn },
          { id: 'lp1', x: 5, y: 12, spr: 'lump', kind: 'stump', on: S => lumpOn(S, 'lp1') },
          { id: 'lp2', x: 17, y: 12, spr: 'lump', kind: 'monu', on: S => lumpOn(S, 'lp2') },
          { id: 'lp3', x: 29, y: 12, spr: 'lump', kind: 'skull', on: S => lumpOn(S, 'lp3') },
          { id: 'lp4', x: 32, y: 16, spr: 'lump', kind: 'glove', on: S => lumpOn(S, 'lp4') },
          { id: 'lp5', x: 24, y: 19, spr: 'lump', kind: 'deer', on: S => lumpOn(S, 'lp5') },
          { id: 'st1_0', x: 29, y: 12, spr: 'skullst', open: true, dir: 3, snow: true, hidden: true, on: stone1On0 },
          { id: 'bbr', x: 30, y: 10, h: 2, spr: 'bbridge', solid: true, on: S => S.narr('沢上原本有一座木桥。\n现在只剩两根黑乎乎的桩子，和几块吊在半空的烂木板。\n桥那边的旧路，早就被灌木吞没了。') },
          ...twins('并排的两棵杉树，一般粗细，树皮还很光滑。\n……二本杉？这片林子里，这样并排的杉树好像不止一对。', '并排的两棵杉树。树根边上鼓着一个雪堆。\n树干不算粗——大概也就三十来年。', '并排的两棵老杉树，比林子里别的杉树粗了一圈，树皮裂得像龟壳。\n两棵树之间，缠着一根烂得发黑的草绳。'),
          { id: 'nawa0', x: 28, y: 14, w: 3, spr: 'nawa', solid: false, z: 1 },
          { id: 'hands', x: 4, y: 22, w: 2, spr: 'hands', solid: false, z: 1, hidden: true },
          { id: 'fp0', x: 7, y: 21, spr: 'footprints', col: 'rgba(80,92,112,.5)', decal: true, on: S => S.narr('雪地上有一串脚印，被新雪盖得只剩浅浅的坑。\n往林子里去了。……一个星期了，居然还没被雪埋平。') },
          { x: 8, y: 19, spr: 'footprints', col: 'rgba(80,92,112,.4)', decal: true },
          { x: 10, y: 18, spr: 'footprints', col: 'rgba(80,92,112,.3)', decal: true },
          { x: 12, y: 17, spr: 'footprints', col: 'rgba(80,92,112,.2)', decal: true },
          { id: 'naoto0', x: 8, y: 22, spr: '@naoto', dir: 1, hidden: true, on: S => S.say('直人', '……回去吧。我开车。') }
        ],
        async enter(S, first) {
          if (!first) return;
          await S.narr('你把租来的车停在山脚下，打着手电走了四十分钟，才走到林道的尽头。\n雪还在下。四下里，只有雪落在杉树上的沙沙声。');
          await S.narr('林道尽头，停着一辆蓝灰色的轿车。车顶积了厚厚一层雪。');
          await S.think('……哥的车。');
          S.goal('看看直人的车');
        },
        tick(S, dt) {
          wxFollow(S, 'wx0');
          if (W.busy || S.has('key') || S.f.ph === 'dawn') return;
          const d = Math.abs(S.pl.x - 13) + Math.abs(S.pl.y - 21);
          if (d <= 5) { BELLT -= dt; if (BELLT <= 0) { BELLT = 2.2 + Math.random() * 1.5; suzu(S, .008 + (5 - d) * .005); } }
        }
      },
      /* ---------------- 昭和四十五年 秋 · 同一片山林 ---------------- */
      mori1: {
        amb: 'wind', dark: .5, plr: 3.4, darkC: '#1c0c16',
        legend: { N: 'sky1', P: 'sugi', p: 'nae', v: 'sugi', G: 'leafg', ':': 'dirt', H: 'bridge', r: 'dirt', ',': 'dirt' },
        tileOpts: { leaf: true, grassC: '#5a4a2a', treeC: '#a8401c', sugiC: '#1a3020' },
        rows: MORI_ROWS,
        ents: [
          { id: 'wx1', x: 29, y: 13, spr: 'wx', kind: 'leaf', solid: false, z: 3 },
          { id: 'st1_1', x: 29, y: 12, spr: 'skullst', open: true, dir: 3, moss: true, on: S => S.narr('长满青苔的骷髅石。\n它望着北边——桥的方向。') },
          { id: 'st2_1', x: 29, y: 7, spr: 'skullst', open: false, dir: 3, moss: true, on: stone2On },
          { id: 'sumi', x: 32, y: 7, spr: '@sumi', dir: 1, on: sumiOn },
          { id: 'koya', x: 33, y: 4, w: 2, spr: 'koya', on: S => S.narr('烧炭老人的小屋。茅草顶上压着几块石头。\n门口挂着一串干辣椒，还有一件打着补丁的蓑衣。') },
          { id: 'kama', x: 33, y: 7, spr: 'kama', light: { r: 2.6, dy: 4, col: 'rgba(255,120,40,.2)', flick: true }, on: S => S.narr('炭窑。窑口一明一暗，热气扑在脸上。\n在这个傍晚，它是唯一暖和的东西。') },
          { id: 'dead1', x: 11, y: 6, spr: 'invisible', solid: true, on: S => S.narr('旧路在这里被杉树林吞掉了。\n树密得插不进手。……这时候，这里已经什么都没有了。') },
          { id: 'cliff1', x: 30, y: 2, spr: 'invisible', solid: true, on: S => S.narr('岔路往北，到这里就是山崖。\n崖缝里长着一棵歪脖子松。') },
          { id: 'jizo1', x: 12, y: 20, spr: 'jizo', on: S => S.narr('路边的地藏。红围兜还是新的，鲜红鲜红。\n脚边供着一个苹果。') },
          { id: 'naef', x: 17, y: 12, spr: 'sign', col: '#6a5a40', on: S => S.narr('一块新钉的木牌：「植林地　昭和四十五年」。\n旁边的树苗，还没有你的膝盖高。') },
          ...twins('一棵刚种下的杉树苗，还没有膝盖高。', '一棵刚种下的杉树苗。旁边插着一块新木牌。', '两棵并排的老杉树。两树之间拉着一根新草绳，挂着白纸垂。'),
          { id: 'nawa1', x: 28, y: 14, w: 3, spr: 'nawa', fresh: true, solid: false, z: 1 },
          { id: 'sankaku1', x: 33, y: 12, spr: 'sankaku', on: S => S.narr('三角点的石桩。和三十年后一模一样，只是还没有那么旧。') }
        ],
        async enter(S, first) {
          if (!first) return;
          await S.narr('天是暗红色的。不是夜里——是傍晚。\n满山的叶子，红得像烧起来一样。');
          S.sfx('tv'); tuneSweep(S); await S.wait(700); song70(S);
          await S.say('收音机', '……ザザ……昭和四十五年，十月二十日，傍晚的新闻。\n今年青森的苹果，收成很好……', { style: 'whisper' });
          await S.think('昭和……四十五年？\n那是——三十多年前。');
          await S.narr('身后的骷髅石上长满了青苔。\n眼前，那座桥好端端地架在沢上，桥板新得发白。');
          S.goal('过桥，沿旧路往北，找追分（岔路口）的骷髅石');
          S.cp();
        },
        tick(S, dt) { wxFollow(S, 'wx1'); }
      },
      /* ---------------- 昭和某年 夏夜 · 鸟居 ---------------- */
      mori2: {
        amb: 'night', dark: .8, plr: 3, darkC: '#030612',
        legend: { N: 'sky2', P: 'sugi', p: 'grass', v: 'dirt', G: 'grass', ':': 'grass', H: 'bridge', r: 'dirt', ',': 'dirt' },
        tileOpts: { grassC: '#20381c', treeC: '#1a3a1e', sugiC: '#0f2216' },
        rows: MORI_ROWS,
        ents: [
          { id: 'wx2', x: 29, y: 6, spr: 'wx', kind: 'fly', solid: false, z: 3 },
          { id: 'st1_2', x: 29, y: 12, spr: 'skullst', open: true, dir: 3, on: S => S.narr('骷髅石。青苔还没有长出来，石头上的凿痕很新。\n它望着北边。') },
          { id: 'st2_2', x: 29, y: 7, spr: 'skullst', open: true, dir: 1, on: S => S.narr('追分的骷髅石，望着西边。\n萤火虫停在它的眼窝里，一明一暗。') },
          { id: 'otorii', x: 10, y: 3, w: 3, spr: 'otorii', solid: false, on: S => S.narr('一座旧鸟居。朱漆差不多掉光了，木头被雨水泡得发黑。\n横梁上挂着一根注连绳，纸垂一动不动。') },
          pillar(10, 3, '鸟居的柱子。手摸上去，木头是温的。'),
          pillar(12, 3, '鸟居的柱子上，有人用小刀刻了一道又一道的划痕——像是在数日子。'),
          { id: 'hollow', x: 10, y: 4, spr: 'hollow', decal: true, solid: false, on: hollowOn },
          { id: 'sign2', x: 12, y: 4, spr: 'kanban2', on: signOn },
          { id: 'exitN', x: 11, y: 2, spr: 'invisible', solid: false, touch: toMura },
          { id: 'jizo2', x: 12, y: 20, spr: 'jizo', on: S => S.narr('路边的地藏，石头的颜色还很浅。\n脚边供着一束野花，花还没有谢。') },
          ...twins(null, null, '两棵并排的杉树。比三十年后细得多，可已经是这片林子里最粗的了。'),
          { id: 'nawa2', x: 28, y: 14, w: 3, spr: 'nawa', fresh: true, solid: false, z: 1 },
          { id: 'tlan1', x: 10, y: 5, spr: 'stonelantern', light: { r: 2.4, dy: -2, col: 'rgba(255,190,110,.2)', flick: true }, on: S => S.narr('村口的石灯笼，里面点着一小截蜡烛。\n……是谁点的？') },
          { id: 'tlan2', x: 12, y: 5, spr: 'stonelantern', light: { r: 2.4, dy: -2, col: 'rgba(255,190,110,.2)', flick: true }, on: S => S.narr('石灯笼的火苗，一动不动地立着。\n这里没有风。') },
          { id: 'sankaku2', x: 33, y: 12, spr: 'sankaku', on: S => S.narr('三角点的石桩。棱角还很锋利。') },
          { id: 'dead2', x: 30, y: 2, spr: 'invisible', solid: true, on: S => S.narr('山崖。崖缝里，萤火虫一闪一闪。') },
          { id: 'ono2', x: 11, y: 2, spr: '@ono', dir: 0, hidden: true, solid: false, light: { r: 1.4, col: 'rgba(140,140,160,.12)' } },
          { id: 'naoto3', x: 11, y: 5, spr: '@naoto', dir: 3, hidden: true, on: S => S.say('直人', '快……！') }
        ],
        async enter(S, first) {
          if (!first) return;
          await S.narr('天黑了——可这不是刚才那个傍晚的黑。\n是夏天的夜。空气又湿又暖，草叶上挂着露水。');
          S.sfx('tv'); oldBroadcast(S);
          await S.say('收音机', '……ザ……こちらは……放送……\n……昭和……年……杉沢の……夏祭りは……明晩……', { style: 'whisper' });
          await S.think('杉沢……夏祭……');
          await S.narr('林子里飞着萤火虫。一点一点的绿光，全都往西边飘。\n你还穿着冬天的大衣，后背出了一层汗。');
          S.goal('沿旧路往西，去鸟居');
          S.cp();
        },
        tick(S, dt) {
          wxFollow(S, 'wx2');
          if (W.busy || S.f.sealed) return;
          HIGT -= dt; if (HIGT <= 0) { HIGT = 6 + Math.random() * 4; higurashi(S, 0, S.pl.x < 16 ? .012 : .022); }
        }
      },
      /* ---------------- 杉泽村 · 夏祭前夜 ---------------- */
      mura: {
        amb: 'night', dark: .8, plr: 2.6, darkC: '#05060e', wall: 'wood', wallC: { top: '#4a3c24', face: '#5e4430', trim: '#30221a' },
        legend: { N: 'sky2', G: 'grass', i: 'ine', k: 'kaya' },
        tileOpts: { grassC: '#22381e', treeC: '#1a3a1e' },
        rows: MURA_ROWS,
        ents: [
          { id: 'wxm', x: 16, y: 22, spr: 'wx', kind: 'fly', solid: false, z: 3 },
          { id: 'doorA', x: 6, y: 6, spr: 'mdoor', lit: true, on: doorAOn },
          { id: 'doorB', x: 6, y: 12, spr: 'mdoor', lit: true, open: true, on: S => S.narr('拉门开着一道缝。\n屋里的矮桌上摆着四副碗筷，饭还冒着热气。没有人。\n墙上挂着一件叠得整整齐齐的小孩浴衣——是明天祭典要穿的吧。') },
          { id: 'doorC', x: 6, y: 18, spr: 'mdoor', lit: true, on: S => S.narr('门里有人在哼歌。一首你没听过的童谣。\n你敲了敲门。歌声停了。\n……没有人来开门。') },
          { id: 'doorD', x: 22, y: 12, spr: 'mdoor', on: doorDOn },
          { id: 'doorE', x: 22, y: 18, spr: 'mdoor', on: doorEOn },
          { id: 'kairan', x: 17, y: 7, spr: 'kairan', on: S => S.note('n_kairan') },
          { id: 'well', x: 15, y: 13, spr: 'well', on: S => S.narr('井水黑得像墨。\n水面上映着檐下的提灯——比真正挂着的，多了一盏。') },
          { id: 'shrine', x: 15, y: 3, w: 2, spr: 'shrine', on: S => S.narr('村里的小神社。拜殿前摆着明天祭典要用的东西：\n笛子、纸垂，还有一捆捆新扎的稻草。') },
          { id: 'taiko', x: 18, y: 4, spr: 'taiko', on: S => S.narr('祭典的太鼓。鼓面上用墨写着「奉納」。\n你忍住了，没有去敲。') },
          ...LANP.map(([x, y], i) => ({ id: 'lan' + i, x, y, spr: 'chochin', light: LANL, on: S => S.narr(S.ent('lan' + i).off ? '提灯灭了。纸面上的「祭」字，黑得看不清。' : '竿子上挂着提灯，纸面上用红字写着一个「祭」。') })),
          { id: 'exitS', x: 16, y: 23, spr: 'invisible', solid: false, touch: exitS },
          { id: 'onna', x: 16, y: 20, spr: '@onna', dir: 0, hidden: true, solid: false },
          { id: 'ono', x: 16, y: 21, spr: '@ono', dir: 3, hidden: true, solid: false, light: { r: 1.4, col: 'rgba(140,140,160,.12)' } },
          { id: 'naoto2', x: 7, y: 7, spr: '@naoto', dir: 0, hidden: true, on: S => S.say('直人', '别停下！') }
        ],
        enter: muraEnter,
        tick(S, dt) {
          wxFollow(S, 'wxm');
          if (S.f.ph === 'chase' && W.timer && W.timer.label) {
            const n = Math.min(LAN_IDS.length, Math.floor((1 - W.timer.left / LAN_T) * (LAN_IDS.length + 1)));
            while (LANN < n) { const e = S.ent(LAN_IDS[LANN]); if (e) { e.off = true; e.light = null; } LANN++; S.tone('sine', 320, 110, .3, .035, 0, 900); }
            const o = S.ent('ono');
            if (REGRAZE > 0 && !W.busy) { REGRAZE -= dt; if (REGRAZE <= 0 && o && !o.chase) { o.solid = false; S.chase('ono', { spd: ONO_SPD, catch: onoCatch, wait: .1 }); } }
            AXT -= dt; ONOSEE -= dt;
            if (o && !o.hidden) {
              const d = Math.abs(o.px - S.pl.px) / TS + Math.abs(o.py - S.pl.py) / TS;
              if (AXT <= 0) { AXT = 1.5; axeDrag(S, Math.max(.02, .1 - d * .005)); if (d < 6) heart(S, 1); }
              if (d < 7 && ONOSEE <= 0) { ONOSEE = 4; S.bubble('ono', '!', 900); }
            }
          } else if (!W.busy && S.f.ph !== 'chase') { CRIT -= dt; if (CRIT <= 0) { CRIT = 2 + Math.random() * 3; cricket(S); } }
        }
      },
      /* ---------------- 庄屋 ---------------- */
      ie: {
        amb: 'fire', dark: .55, plr: 2.8, darkC: '#0a0604', wall: 'wood', floor: 'tatami',
        legend: { t: 'tatami', W: 'darkwood', d: 'dirt' },
        rows: [
          '##############',
          '##############',
          '#ttttttttttWW#',
          '#tttttttttttt#',
          '#tttttttttttt#',
          '#tttttttttttt#',
          '#tttttttttttt#',
          '#dddddddddddd#',
          '#dddddddddddd#',
          '######d#######'],
        ents: [
          { id: 'shoji', x: 2, y: 1, spr: 'shoji2', on: shojiOn },
          { id: 'pclock', x: 5, y: 1, spr: 'pclock', on: S => S.narr(S.ent('pclock').lit ? '柱时计的指针，停在十二点上。' : '柱时计。十一点五十几分。\n钟摆一下，一下。') },
          { x: 11, y: 1, spr: 'scroll', on: S => S.narr('壁龛里挂着一幅字：「五穀豊穣」。\n墨迹很新。') },
          { id: 'bundle', x: 12, y: 2, spr: 'bundle', on: bundleOn },
          { id: 'irori', x: 6, y: 4, w: 2, spr: 'irori', light: { r: 3.4, dx: 16, dy: 6, col: 'rgba(255,140,60,.24)', flick: true }, on: S => S.narr('地炉里的炭火一明一暗。铁壶咕嘟咕嘟地响。\n……火烤在脸上，却一点也不热。') },
          { id: 'naoto', x: 8, y: 4, spr: '@naotoD', dir: 1, on: naotoOn },
          { id: 'zen', x: 5, y: 5, spr: 'zen', on: zenOn },
          { id: 'futon', x: 10, y: 5, h: 2, spr: 'futon', col: '#5a3a3a', decal: true, solid: false, on: futonOn },
          { id: 'andon', x: 2, y: 6, spr: 'andon', light: { r: 2.4, dy: 2, col: 'rgba(255,220,150,.16)' }, on: S => S.narr(S.ent('andon').off ? '行灯灭了。灯芯上，一缕青烟还没散。' : '纸糊的行灯，光很柔。') },
          { id: 'onna2', x: 3, y: 4, spr: '@onna', dir: 2, on: onna2On },
          { id: 'ieExit', x: 6, y: 9, spr: 'invisible', solid: false, touch: ieExit }
        ],
        async enter(S, first) {
          if (!first) return;
          await S.narr('屋里很暖和。地炉里的炭火烧得正旺，铁壶咕嘟咕嘟地响。\n空气里一股味噌汤的香味。');
          await S.narr('地炉边，坐着一个人。\n门边，一个女人跪坐着，朝你低了低头。');
          S.goal('和地炉边的人说话');
        }
      }
    }
  });
})();
