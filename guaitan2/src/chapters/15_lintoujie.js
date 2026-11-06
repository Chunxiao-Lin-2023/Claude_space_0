/* ================= 第十五夜 · 林投姐 ================= */
(() => {
  /* ---------- 地图小工具 ---------- */
  const G = (w, h, c) => Array.from({ length: h }, () => Array(w).fill(c));
  const F = (g, x0, y0, x1, y1, c) => { for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) g[y][x] = c; };
  const ROWS = g => g.map(r => r.join(''));

  /* ---------- S.tone 合成音效 ---------- */
  const SND = {
    geng(S, n) {   // 更鼓「咚」几下，再两声梆子
      for (let i = 0; i < n; i++) { S.tone('sine', 110, 68, .4, .14, i * .6); S.tone('triangle', 230, 120, .12, .05, i * .6, 900); }
      for (let i = 0; i < 2; i++) S.tone('square', 980, 940, .05, .035, n * .6 + .3 + i * .34, 2600);
    },
    ding(S) { S.tone('triangle', 2350, 2320, .9, .06); S.tone('sine', 3520, 3500, .6, .03); S.tone('sine', 1180, 1170, .4, .02); },   // 铜钱弹一下：又脆又长
    drop(S) { S.tone('triangle', 1900, 1850, .25, .05); S.tone('triangle', 2400, 2300, .18, .035, .09); S.tone('triangle', 1700, 1680, .3, .03, .17); },   // 落进竹筒：叮当
    dud(S) { S.tone('triangle', 160, 70, .09, .08, 0, 500); },   // 纸：闷闷的「噗」
    cry(S) {   // 叫卖：烧——肉——粽——
      const L = 1100, v = .035;
      S.tone('sawtooth', 392, 400, .55, v, 0, L); S.tone('sawtooth', 440, 430, .45, v, .62, L); S.tone('sawtooth', 349, 330, 1.1, v, 1.15, L);
    },
    hum(S) {   // 林子深处，有个女人在哼歌仔调
      [330, 392, 440, 392, 330, 294, 330].forEach((f, i) => S.tone('sine', f, f * .995, .5, .018, i * .52, 1200));
    },
    gong(S, n = 1, gap = 1.1) { for (let i = 0; i < n; i++) { const d = i * gap; S.tone('sine', 180, 160, 2.2, .1, d); S.tone('triangle', 268, 250, 1.6, .05, d, 1500); S.tone('sine', 415, 400, 1.1, .03, d); } },
    swell(S, near) { S.tone('sawtooth', 70, 38, .9, near ? .08 : .035, 0, near ? 420 : 260); S.tone('sine', 52, 40, 1, near ? .08 : .03); if (near) S.tone('sawtooth', 300, 900, .8, .012, .2, 1600); },   // 浪头涌起来；落在你这一列时更响，还带一声嘶的浪尖
    crash(S) { S.tone('sawtooth', 120, 40, .6, .09, 0, 700); S.tone('square', 60, 30, .5, .05, .05, 400); },
    bell(S) { S.tone('triangle', 1320, 1310, 1.2, .04); S.tone('sine', 2640, 2630, .8, .015); },
    step(S, near) { S.tone('triangle', near ? 95 : 80, 50, .14, near ? .06 : .035, 0, 600); }   // 她飘过去时地板的轻响
  };

  /* ---------- 人物 ---------- */
  const douli = (g, d, fr, G2, R) => {   // 斗笠：压到眉下，脸埋在阴影里
    const c = '#8a7444', c2 = '#6a5634', sh = '#141210', h = G2.hT;
    if (d !== 3) R(d === 0 ? 4 : 4, h + 1, d === 0 ? 8 : 6, 6, sh);
    R(0, h + 2, 16, 1, c2); R(1, h + 1, 14, 1, c); R(3, h, 10, 1, c); R(5, h - 1, 6, 1, c); R(7, h - 2, 2, 1, c2);
  };
  const xianX = (g, d, fr, G2, R) => { if (d === 0) { R(5, G2.hT + 4, 2, 1, '#2a2a2a'); R(9, G2.hT + 4, 2, 1, '#2a2a2a'); R(7, G2.hT + 4, 2, 1, '#5a5a5a'); R(6, G2.hT + 7, 4, 3, '#c8c8c0'); } else if (d === 1) { R(5, G2.hT + 4, 2, 1, '#2a2a2a'); R(4, G2.hT + 7, 3, 3, '#c8c8c0'); } };
  const zhouX = (g, d, fr, G2, R) => { if (d === 0) { R(5, G2.hT + 6, 2, 1, '#1a1414'); R(9, G2.hT + 6, 2, 1, '#1a1414'); R(7, G2.tT + 2, 2, 2, '#c9a35a'); } else if (d === 1) R(4, G2.hT + 6, 2, 1, '#1a1414'); };
  const zzX = (g, d, fr, G2, R) => { if (d === 0) R(5, G2.hT + 6, 6, 4, '#e8e8e0'); else if (d === 1) R(4, G2.hT + 6, 3, 4, '#e8e8e0'); };
  const yuX = (g, d, fr, G2, R) => { R(4, G2.tB - 2, 8, 1, '#a89870'); if (d === 0) R(7, G2.tT + 1, 2, 4, '#b8ac88'); };   // 麻布孝带
  const qiX = (g, d, fr, G2, R) => { if (d === 0) { R(5, G2.tT + 2, 6, 5, '#c8a8a0'); R(6, G2.tT - 1, 4, 3, '#ecd0b6'); R(6, G2.tT - 1, 4, 1, '#1a1414'); } else if (d === 1) { R(3, G2.tT + 2, 5, 5, '#c8a8a0'); R(3, G2.tT - 1, 3, 3, '#ecd0b6'); } };
  const zongX = (g, d, fr, G2, R) => { if (d === 0) { R(0, G2.tT + 4, 5, 1, '#c8b88a'); R(0, G2.tT + 5, 5, 2, '#4e7030'); R(1, G2.tT + 7, 3, 1, '#4e7030'); R(2, G2.tT + 8, 1, 1, '#3e5a26'); } };
  const LTJ = { skin: '#e2e4de', hair: '#0c0a0a', hs: 'long', cover: true, top: '#dcdfd6', top2: '#c4c8bc', robe: true, ghost: true };
  const PEOPLE_L = {
    me: { skin: '#e8c09a', hair: '#1e1a18', hs: 'queue', top: '#4a6a8a', top2: '#3a5470', bottom: '#2e3440', shoes: '#6a5a3a' },
    geng: { skin: '#d8b08a', hair: '#3a3a3a', hs: 'queue', top: '#5a4a3a', bottom: '#3a3228', shoes: '#2a2018', hat: 'straw', hatC: '#a88a4a' },
    atu: { skin: '#c8946a', hair: '#1a1410', hs: 'messy', top: '#6a5a44', top2: '#544634', bottom: '#4a4030', shoes: '#3a2a1a' },
    yu: { key: 'ltj-yu', skin: '#ecd0b8', hair: '#1a1414', hs: 'bun', top: '#e6e2d6', top2: '#cfcab8', bottom: '#dad6c8', skirt: true, shoes: '#e8e4d8', hat: 'scarf', hatC: '#d4ccb2', extra: yuX },
    wang: { skin: '#e0b896', hair: '#2a2020', hs: 'bun', top: '#5a3a5a', bottom: '#2a2a34', apron: '#c8c0a8', shoes: '#2a2020' },
    ltj: Object.assign({ key: 'ltj-w' }, LTJ),
    ltjR: Object.assign({ key: 'ltj-r' }, LTJ, { redEye: true, top: '#c8ccc4', skin: '#cfd2cb' }),
    ltjHat: { key: 'ltj-hat', skin: '#e2e4de', hair: '#0c0a0a', hs: 'long', top: '#34343c', top2: '#2a2a30', robe: true, noFeet: true, extra: douli },
    ltjIcon: Object.assign({ key: 'ltj-icon' }, LTJ, { extra: zongX }),
    xian: { key: 'ltj-xian', skin: '#d8b48c', hair: '#9a9a9a', hs: 'queue', top: '#34485a', top2: '#2a3a4a', robe: true, shoes: '#1a1a1a', hat: 'qing', hatC: '#1e1e22', extra: xianX },
    laoda: { skin: '#b07a50', hair: '#1a1410', hs: 'queue', top: '#3a3024', bottom: '#4a4030', shoes: '#2a1a10', hat: 'straw', hatC: '#8a7040' },
    zhou: { key: 'ltj-zhou', skin: '#e4c4a0', hair: '#1a1414', hs: 'queue', top: '#5a2238', top2: '#c9a35a', robe: true, shoes: '#1a1a1a', hat: 'qing', hatC: '#1a1418', extra: zhouX },
    huoji: { skin: '#e0bc96', hair: '#1a1414', hs: 'queue', top: '#6a6a64', bottom: '#3a3a3a', apron: '#4a4a44', shoes: '#2a2a2a' },
    zz: { key: 'ltj-zz', skin: '#d8b896', hair: '#d8d8d0', hs: 'queue', top: '#3a3424', top2: '#2a2418', robe: true, shoes: '#1a1a1a', extra: zzX },
    lin: { skin: '#d8a882', hair: '#1a1410', hs: 'queue', top: '#4a5a4a', bottom: '#3a3428', shoes: '#2a2018' },
    zhouqi: { key: 'ltj-qi', skin: '#ecd0b6', hair: '#1a1414', hs: 'bun', top: '#7a4a5a', top2: '#c9a35a', dress: true, shoes: '#3a2a2a', extra: qiX }
  };

  /* ---------- 惊吓大头像（32×32）----------
     长发几乎占满画面，中间一道发缝里露出一条惨白的脸；眼睛从发缝底下往上翻着看人；
     特效推进时发帘分开、嘴张开，舌头一点点垂下来（传说里小贩认出她，就是因为这一幕）；
     下颌底下一道淡淡的暗痕。怨气重的那张，眼白发红、脸色发灰、舌头一出来就垂到底。 */
  function ltjFace(rage) {
    return (R, a) => {
      const H = '#070505', H2 = '#181010', SK = rage ? '#c8ccc4' : '#e4e6df', SK2 = rage ? '#9aa098' : '#c2c6bc';
      R(3, 0, 26, 32, H); R(1, 6, 30, 26, H);
      for (const [x, y, l] of [[5, 2, 26], [8, 0, 30], [23, 1, 28], [26, 4, 26], [3, 9, 22]]) R(x, y, 1, l, H2);
      const open = rage ? 2 : Math.round(Math.min(1, a * 1.5) * 2);
      const fx = 11 - open, fw = 10 + open * 2;
      R(fx + 1, 6, fw - 2, 2, SK); R(fx, 8, fw, 14, SK); R(fx + 1, 22, fw - 2, 2, SK); R(fx + 3, 24, fw - 6, 2, SK);
      R(fx + fw - 2, 8, 2, 14, SK2); R(fx, 8, 1, 14, SK2);
      R(fx + 1, 6, 1, 13, H); R(fx + fw - 2, 6, 2, 11, H); R(15, 5, 2, 4, H); R(fx + 2, 19, 1, 4, H2);
      const ey = 12;
      for (const ex of [12, 18]) { R(ex, ey, 3, 2, rage ? '#e8d0d0' : '#f2f2ea'); R(ex + 1, ey, 1, 1, rage ? '#c01818' : '#0a0a0a'); R(ex, ey + 2, 3, 1, SK2); R(ex, ey - 1, 3, 1, H2); }
      if (rage) { R(12, ey + 1, 1, 1, '#a02020'); R(20, ey + 1, 1, 1, '#a02020'); R(13, ey + 3, 1, 3, '#7a6a6a'); R(19, ey + 3, 1, 3, '#7a6a6a'); }
      R(15, 16, 2, 2, SK2);
      const m = Math.min(1, a * 1.6);
      if (m < .35 && !rage) R(14, 20, 4, 1, '#a8a8a0');
      else {
        R(14, 19, 4, 3, '#1a0606');
        const tl = rage ? 9 : Math.round((m - .35) * 16);
        if (tl > 0) { R(15, 21, 2, tl, '#7a1820'); R(16, 21, 1, tl, '#8e2830'); R(15, 21 + tl, 2, 1, '#5a0e14'); }
      }
      R(fx + 3, 26, fw - 6, 1, '#4a3434');
      R(5, 4, 2, 1, '#3c5a30'); R(6, 5, 2, 1, '#3c5a30'); R(7, 6, 2, 1, '#3c5a30'); R(8, 7, 2, 1, '#3c5a30'); R(6, 4, 1, 1, '#6a8a4a');
    };
  }
  const FACES_L = { ltj: ltjFace(false), ltjR: ltjFace(true) };

  /* ---------- 瓦片 ---------- */
  const TILES_L = {
    lintou: { solid: true, paint(R, X, Y) {   // 一丛林投：剑形长叶，叶缘一排倒刺
      speck(R, '#141e17', ['#1a281e', '#0e1610'], X, Y, 10, 31);
      const cx = 6 + ((hash(X, Y, 3) * 4) | 0), cy = 10 + ((hash(X, Y, 4) * 2) | 0);
      R(cx, cy, 2, 6, '#3a3024');
      const blades = [[-1, -1, 7], [1, -1, 7], [0, -1, 9], [-1, -.4, 8], [1, -.4, 8], [-1, .3, 6], [1, .3, 6]];
      blades.forEach(([dx, dy, l], i) => {
        const col = i % 2 ? '#2e4a2c' : '#3c5e36';
        for (let s = 0; s < l; s++) { R(cx + dx * s, cy + dy * s, 2, 1, s % 3 === 2 ? '#22381f' : col); if (s % 3 === 1) R(cx + dx * s + (dx >= 0 ? 2 : -1), cy + dy * s - 1, 1, 1, '#587a42'); }
      });
      if (hash(X, Y, 9) < .18) { R(cx - 3, cy - 3, 4, 4, '#a8782a'); R(cx - 3, cy - 3, 4, 1, '#c8902a'); R(cx - 2, cy - 1, 1, 1, '#7a5a1a'); }   // 林投果
    } },
    redbrick: { solid: false, paint(R, X, Y) { R(0, 0, 16, 16, '#5a2c20'); const c = shade('#9a4a36', (hash(X, Y, 4) - .5) * .16); R(1, 1, 14, 14, c); R(1, 1, 14, 1, shade(c, .1)); if (hash(X, Y, 8) < .2) R(4, 6, 3, 1, shade(c, -.15)); } },
    gunwale: { solid: true, paint(R, X, Y) { TILE.water.paint(R, X, Y); R(0, 4, 16, 8, '#3e2a1a'); R(0, 4, 16, 2, '#6a4a2e'); R(0, 11, 16, 1, '#22160e'); if (X % 3 === 0) R(7, 6, 2, 5, '#2a1c10'); } }
  };

  /* ---------- 自定义精灵 ---------- */
  const steam = (R, x, y, t, k = 0) => { for (let i = 0; i < 3; i++) { const p = (t * .7 + i / 3 + k) % 1; R(x + Math.round(Math.sin(t * 2 + i * 2) * 2), y - p * 12, 2, 2, `rgba(230,230,225,${.45 * (1 - p)})`); } };
  const SPR_L = {
    zao(g, e, t, R) {   // 砖灶，宽 2 格，上面两摞蒸笼
      R(0, 14, 32, 2, 'rgba(0,0,0,.4)'); box(R, 0, -2, 32, 17, '#8a4a34'); R(1, -4, 30, 3, '#5a3022');
      for (let y = 0; y < 14; y += 4) R(1, y, 30, 1, '#6a3626');
      R(6, 6, 8, 7, '#140806'); const fl = Math.sin(t * 9) > 0; R(8, 10, 4, 3, fl ? '#d8682a' : '#a8461a'); R(9, 9, 2, 1, '#e8a04a');
      if (!e.empty) for (const x of [3, 18]) { R(x, -13, 11, 10, '#b8935a'); R(x, -10, 11, 1, '#8a6a3a'); R(x, -6, 11, 1, '#8a6a3a'); R(x - 1, -14, 13, 2, '#9a7a48'); steam(R, x + 4, -15, t, x / 10); }
      else { R(5, -8, 9, 4, '#3a3a3a'); R(20, -8, 9, 4, '#3a3a3a'); }
    },
    zhutong(g, e, t, R) { R(5, -2, 6, 12, '#9aa04a'); R(5, -2, 1, 12, '#b8be66'); R(5, 1, 6, 1, '#6a7030'); R(5, 6, 6, 1, '#6a7030'); R(6, -2, 4, 1, '#2a2a1a'); R(7, -3, 2, 1, '#4a4a2a'); },
    sickbed(g, e, t, R) {   // 竹床，阿爸躺着，盖着蓝花被
      R(0, 30, 16, 2, 'rgba(0,0,0,.4)'); box(R, 0, 0, 16, 31, '#6a4a2e'); R(1, 1, 14, 29, '#c8b88a');
      for (let y = 3; y < 30; y += 3) R(1, y, 14, 1, '#b4a476');
      R(3, 2, 10, 4, '#e0d8c0'); R(5, 1, 6, 6, '#d8b08a'); R(5, 1, 6, 2, '#8a8a8a'); R(6, 4, 1, 1, '#3a2a20'); R(9, 4, 1, 1, '#3a2a20');
      R(1, 8, 14, 21, '#4a5a7a'); for (const [x, y] of [[3, 11], [9, 14], [5, 19], [11, 22], [4, 25]]) R(x, y, 2, 2, '#c8d0e0');
      const br = Math.sin(t * 1.6) > 0 ? 1 : 0; R(4, 9 - br, 8, 1, '#5a6a8a');
    },
    umbw(g, e, t, R) {   // 墙上挂的黑油纸伞（墙面行）
      R(7, 1, 2, 1, '#888');
      if (e.gone) return;
      R(7, 2, 1, 2, '#6a4a2a'); R(6, 4, 4, 9, '#2a1e18'); R(5, 6, 6, 5, '#2a1e18'); R(7, 4, 1, 9, '#4a3a2a'); R(9, 5, 1, 7, '#1a1210'); R(7, 13, 2, 2, '#8a6a3a');
    },
    dan(g, e, t, R) { R(0, 3, 16, 1, '#8a6a3a'); R(2, 4, 1, 4, '#c8b88a'); R(13, 4, 1, 4, '#c8b88a'); box(R, 0, 8, 6, 7, '#a8884a'); box(R, 10, 8, 6, 7, '#a8884a'); R(1, 9, 4, 1, '#c8a860'); R(11, 9, 4, 1, '#c8a860'); },
    gatetower(g, e, t, R) {   // 东门城楼，宽 2 格，画在门洞上方的墙上
      R(-8, -40, 48, 3, '#2a1c18'); R(-10, -38, 4, 2, '#2a1c18'); R(38, -38, 4, 2, '#2a1c18'); R(-4, -37, 40, 4, '#3a2a24');
      R(-2, -33, 36, 15, '#8a3a2a'); for (const x of [2, 12, 22]) { R(x, -30, 6, 8, '#2a1410'); R(x + 1, -29, 4, 6, '#5a2a1a'); }
      R(-6, -18, 44, 3, '#3a2a24'); R(0, -15, 32, 31, '#7a5040'); for (let y = -13; y < 16; y += 4) R(0, y, 32, 1, '#6a4436');
      R(10, -12, 12, 6, '#141010'); R(12, -10, 2, 2, '#c9a35a'); R(15, -10, 2, 2, '#c9a35a'); R(18, -10, 2, 2, '#c9a35a');
      R(6, 0, 20, 16, '#120c0a'); R(7, -2, 18, 2, '#120c0a'); R(9, -3, 14, 1, '#120c0a');
    },
    guatan(g, e, t, R) {   // 卦摊
      R(0, 14, 16, 2, 'rgba(0,0,0,.4)'); box(R, 0, 4, 16, 11, '#6a4a2e'); R(0, 4, 16, 4, '#c8b878'); R(3, 0, 3, 5, '#8a5a2a'); R(3, -1, 1, 1, '#c8b878'); R(5, -2, 1, 2, '#c8b878');
      R(14, -18, 1, 24, '#5a3a1a'); R(9, -18, 5, 16, '#e8e0c8'); for (let y = -16; y < -3; y += 3) R(10, y, 3, 1, '#2a1a1a');
    },
    tan(g, e, t, R) {   // 粽摊，宽 2 格：一根横杆挂着一串串肉粽，案板上一口锅
      R(0, 14, 32, 2, 'rgba(0,0,0,.4)'); R(2, 11, 2, 5, '#4a3020'); R(28, 11, 2, 5, '#4a3020');
      box(R, 0, 3, 32, 9, '#7a5a36'); R(1, 3, 30, 1, '#9a7a4e');
      R(0, -10, 1, 13, '#5a3a1a'); R(31, -10, 1, 13, '#5a3a1a'); R(0, -10, 32, 1, '#5a3a1a');
      const n = e.left == null ? 5 : e.left;
      for (let i = 0; i < 5; i++) { const x = 3 + i * 5; R(x + 1, -9, 1, 2, '#c8b88a'); if (i < n) { R(x, -7, 4, 1, '#3e5a26'); R(x, -6, 4, 2, '#4e7030'); R(x + 1, -4, 2, 1, '#4e7030'); } }
      R(19, -2, 10, 5, '#2a2a2a'); R(19, -2, 10, 1, '#4a4a4a'); steam(R, 23, -3, t);
      if (e.leaf) { R(6, 4, 8, 1, '#3c5e36'); R(8, 3, 4, 1, '#3c5e36'); R(13, 4, 1, 1, '#587a42'); }
      if (e.silver) { R(8, 0, 6, 3, '#d8d8d0'); R(9, -1, 4, 1, '#f0f0e8'); R(8, 2, 6, 1, '#9a9a90'); }
    },
    lampP(g, e, t, R) {   // 灯笼杆
      R(7, -20, 2, 36, '#4a3020'); R(7, -20, 7, 1, '#4a3020'); R(12, -19, 1, 2, '#2a2a2a');
      const off = e.off; R(10, -17, 6, 8, off ? '#3a1a14' : '#d8402a'); R(10, -17, 6, 1, '#2a1a10'); R(10, -10, 6, 1, '#2a1a10');
      if (!off) { R(12, -15, 2, 4, '#ffb060'); R(11, -14, 1, 2, '#f06a3a'); }
      R(12, -9, 2, 2, '#c8a860');
    },
    denglong(g, e, t, R) { R(7, 0, 2, 2, '#2a1a10'); R(4, 2, 8, 9, e.off ? '#3a1a14' : '#c8382a'); R(4, 2, 8, 1, '#2a1a10'); R(4, 10, 8, 1, '#2a1a10'); if (!e.off) R(6, 4, 4, 5, '#ff8a4a'); R(7, 11, 2, 3, '#c8a860'); },
    bogong(g, e, t, R) {   // 路边的伯公（土地公）小庙
      R(1, 14, 14, 2, 'rgba(0,0,0,.4)'); box(R, 2, 0, 12, 15, '#7a7468'); R(0, -3, 16, 4, '#5a3a2a'); R(-1, -2, 2, 1, '#5a3a2a'); R(15, -2, 2, 1, '#5a3a2a');
      R(5, 3, 6, 7, '#1a1410'); R(7, 5, 2, 4, '#c9a35a'); R(7, 4, 2, 1, '#e8d0a8'); R(7, 11, 2, 1, '#c84a2a');
      if (Math.sin(t * 3) > -.3) R(7, 10 - ((t * 4) % 3), 1, 1, 'rgba(220,220,220,.5)');
    },
    shenzhuo(g, e, t, R) {   // 自家神明桌：妈祖像、祖先牌位、香炉
      R(0, 14, 32, 2, 'rgba(0,0,0,.4)'); box(R, 0, 2, 32, 13, '#6a1e16'); R(1, 2, 30, 2, '#8a2a1e');
      box(R, 4, -12, 12, 14, '#4a1410'); R(6, -9, 8, 9, '#2a0a08'); R(8, -8, 4, 7, '#c8402a'); R(9, -8, 2, 2, '#e8d0a8'); R(8, -9, 4, 1, '#e8c84a');
      R(19, -8, 4, 10, '#c9a35a'); R(20, -6, 2, 6, '#2a1410'); R(25, -6, 4, 8, '#c9a35a'); R(26, -4, 2, 5, '#2a1410');
      R(13, 4, 6, 3, '#8a6a3a'); R(15, 0, 1, 4, '#c84a2a'); R(17, 1, 1, 3, '#c84a2a');
      if (Math.sin(t * 2) > -.5) R(15, -2 - ((t * 5) % 4), 1, 1, 'rgba(220,220,220,.45)');
    },
    zong(g, e, t, R) {   // 地上的一粒肉粽
      const c = e.old ? '#5a4a2a' : '#4e7030', c2 = e.old ? '#3a2e1a' : '#3e5a26';
      R(4, 13, 8, 2, 'rgba(0,0,0,.35)'); R(5, 12, 6, 1, c2); R(5, 10, 6, 2, c); R(6, 9, 4, 1, c); R(7, 8, 2, 1, c); R(7, 7, 1, 1, '#c8b88a'); R(8, 6, 1, 1, '#c8b88a');
      if (e.old) { R(6, 11, 1, 1, '#8a8a6a'); R(9, 10, 1, 1, '#8a8a6a'); }
    },
    rotzong(g, e, t, R) { for (const [x, y, c] of [[2, 9, '#3a2e1a'], [7, 10, '#2a2214'], [10, 8, '#4a3a22'], [5, 6, '#2e2618']]) { R(x, y + 3, 5, 1, c); R(x, y + 1, 5, 2, c); R(x + 1, y, 3, 1, c); R(x + 2, y - 1, 1, 1, c); } R(4, 12, 1, 1, '#7a7a5a'); R(11, 10, 1, 1, '#7a7a5a'); },
    oldlamp(g, e, t, R) { R(3, 13, 10, 2, 'rgba(0,0,0,.35)'); R(4, 8, 8, 6, '#6a3a26'); R(4, 8, 8, 1, '#2a1a10'); R(4, 13, 8, 1, '#2a1a10'); R(6, 9, 3, 3, '#140c08'); R(10, 10, 1, 2, '#140c08'); },
    shoe(g, e, t, R) { R(4, 13, 9, 2, 'rgba(0,0,0,.3)'); R(5, 10, 6, 3, '#7a1e22'); R(10, 11, 2, 2, '#7a1e22'); R(5, 10, 6, 1, '#9a2a2a'); R(7, 11, 1, 1, '#e8c84a'); R(8, 12, 1, 1, '#4e8a4a'); },
    fruit(g, e, t, R) { R(5, 12, 7, 2, 'rgba(0,0,0,.3)'); R(5, 8, 6, 5, '#a8782a'); R(5, 8, 6, 1, '#c8902a'); R(6, 10, 1, 1, '#7a5a1a'); R(9, 11, 1, 1, '#7a5a1a'); R(7, 6, 2, 2, '#3c5e36'); },
    bigtree(g, e, t, R) {   // 她那棵老林投：一圈支柱根、剑叶冠、一串林投果，高处一截褪了色的布条
      R(0, 14, 32, 2, 'rgba(0,0,0,.45)');
      for (const [x, y, h] of [[6, 4, 12], [22, 4, 12], [2, 8, 8], [27, 8, 8], [10, 2, 14], [19, 2, 14]]) R(x, y, 2, h, '#4a3a2a');
      R(12, -18, 7, 32, '#5a4a34'); for (let y = -16; y < 14; y += 4) R(12, y, 7, 1, '#3e3226');
      const cx = 15, cy = -20;
      [[-1, -1, 15], [1, -1, 15], [0, -1, 12], [-1, -.35, 17], [1, -.35, 17], [-1, .3, 15], [1, .3, 15], [-1, .8, 10], [1, .8, 10], [-.5, -1, 13], [.5, -1, 13]].forEach(([dx, dy, l], i) => {
        const sw = Math.sin(t * 1.3 + i) * .6;
        for (let s = 0; s < l; s++) { R(cx + dx * s, cy + (dy + sw * .03) * s, 2, 1, s % 3 === 2 ? '#22381f' : i % 2 ? '#2e4a2c' : '#3c5e36'); if (s % 3 === 1) R(cx + dx * s + (dx >= 0 ? 2 : -1), cy + dy * s - 1, 1, 1, '#587a42'); }
      });
      R(18, -16, 6, 7, '#a8782a'); R(18, -16, 6, 1, '#c8902a'); R(19, -14, 1, 1, '#7a5a1a'); R(22, -12, 1, 1, '#7a5a1a');
      const sw = Math.round(Math.sin(t * 1.1) * 1); R(4, -10, 4, 1, '#3e3226'); R(5 + sw, -9, 1, 9, '#bcb6a4'); R(5 + sw, 0, 1, 1, '#8a8474');
    },
    chest(g, e, t, R) {   // 半埋在树根里的嫁妆箱
      R(0, 13, 16, 3, 'rgba(0,0,0,.4)'); box(R, 1, 4, 14, 10, '#7a1e1a'); R(2, 6, 12, 1, '#5a1410');
      if (e.open) { R(1, -2, 14, 4, '#9a2a22'); R(2, -1, 12, 1, '#c84a3a'); R(2, 4, 12, 3, '#1a0a08'); }
      else { R(1, 3, 14, 3, '#9a2a22'); R(7, 6, 2, 3, '#c9a35a'); R(2, 4, 12, 1, '#c84a3a'); }
      R(0, 11, 16, 4, '#3a2c20'); R(3, 11, 2, 1, '#4a3a2a'); R(11, 12, 3, 1, '#4a3a2a');
    },
    /* ---- 船 ---- */
    mast(g, e, t, R) {   // 桅杆 + 一面打着竹条的帆
      R(6, -64, 4, 78, '#5a3e24'); R(6, -64, 1, 78, '#7a5a3a'); R(2, 12, 12, 3, '#3a2a1a');
      const fl = e.storm ? Math.round(Math.sin(t * 7) * 2) : 0;
      R(-18 + fl, -60, 36, 42, '#8a3a22'); for (let y = -58; y < -18; y += 6) R(-18 + fl, y, 36, 1, '#4a2a18');
      R(-18 + fl, -60, 1, 42, '#5a2a18'); R(17 + fl, -60, 1, 42, '#5a2a18');
    },
    crate2(g, e, t, R) { R(1, 14, 14, 2, 'rgba(0,0,0,.35)'); box(R, 1, 0, 14, 15, e.col || '#7a5a3a'); R(2, 4, 12, 1, shade(e.col || '#7a5a3a', -.25)); R(2, 9, 12, 1, shade(e.col || '#7a5a3a', -.25)); R(7, 0, 2, 15, '#c8b88a'); },
    hatch2(g, e, t, R) { R(1, 1, 14, 14, '#2a1a10'); for (let x = 2; x < 15; x += 3) R(x, 2, 1, 12, '#120a06'); R(1, 1, 14, 1, '#5a3e24'); R(1, 14, 14, 1, '#5a3e24'); },
    mazu(g, e, t, R) {   // 船尾的妈祖龛（船仔妈）
      R(0, 14, 16, 2, 'rgba(0,0,0,.4)'); box(R, 1, -10, 14, 24, '#8a1e1a'); R(0, -12, 16, 3, '#5a1410');
      R(3, -7, 10, 10, '#2a0e0a'); R(6, -6, 4, 7, '#c84a2a'); R(7, -5, 2, 2, '#e8d0a8'); R(6, -7, 4, 1, '#e8c84a');
      R(7, 6, 2, 2, e.lit ? (Math.sin(t * 8) > 0 ? '#ffd27a' : '#e8a84a') : '#5a3a1a');
      if (e.umb) { R(12, -8, 3, 18, '#2a1e18'); R(13, -8, 1, 18, '#4a3a2a'); R(12, 2, 3, 1, '#c8b88a'); R(12, 6, 3, 1, '#c8b88a'); }
    },
    tiller(g, e, t, R) { R(0, 6, 14, 3, '#5a3e24'); R(0, 6, 14, 1, '#7a5a3a'); R(12, 3, 4, 9, '#4a3020'); },
    wave(g, e, t, R) {   // 甲板上的浪：st 1 = 船舷上翻起白浪（预警）；st 2 = 整片白水砸下来
      const st = e.st || 0; if (!st) return;
      const w = 48, h = 112;
      if (st === 1) {
        const k = (Math.sin(t * 18) + 1) / 2;
        R(0, 0, w, h, `rgba(120,180,205,${.12 + k * .12})`); R(0, 0, 1, h, 'rgba(210,235,245,.5)'); R(w - 1, 0, 1, h, 'rgba(210,235,245,.5)');
        for (let x = 0; x < w; x += 3) { const hh = 4 + ((Math.sin(t * 14 + x) + 1) * 3) | 0; R(x, -4 - hh, 2, hh + 3, 'rgba(225,238,244,.85)'); }
        for (let y = 6; y < h; y += 14) R(2, y + ((t * 40) % 14), w - 4, 1, 'rgba(200,225,235,.35)');
      } else {
        R(0, -10, w, h + 10, 'rgba(205,228,238,.62)');
        for (let i = 0; i < 14; i++) { const x = (hash(i, 1, (t * 20) | 0) * w) | 0, y = (hash(i, 2, (t * 20) | 0) * h) | 0; R(x, y, 4, 1, 'rgba(255,255,255,.9)'); }
      }
    },
    /* ---- 汕头周家 ---- */
    zaltar(g, e, t, R) {   // 周家厅堂的神明桌：祖先牌位一排
      R(0, 14, 32, 2, 'rgba(0,0,0,.4)'); box(R, 0, 2, 32, 13, '#5a1a14'); R(1, 2, 30, 2, '#7a2a1e');
      box(R, 2, -14, 28, 16, '#3a1410');
      for (let i = 0; i < 4; i++) { R(5 + i * 6, -12, 4, 11, '#c9a35a'); R(6 + i * 6, -10, 2, 7, '#1a1410'); }
      R(13, 4, 6, 3, '#8a6a3a'); R(15, 0, 1, 4, '#c84a2a'); R(17, 1, 1, 3, '#c84a2a');
      R(3, -2, 2, 4, '#c82a2a'); R(27, -2, 2, 4, '#c82a2a'); R(3, -3, 2, 1, '#ffb050'); R(27, -3, 2, 1, '#ffb050');
      if (e.ev) { R(5, 3, 8, 6, '#e8e0c8'); R(6, 5, 6, 1, '#4a3a2a'); R(6, 7, 4, 1, '#4a3a2a'); R(20, 3, 8, 6, '#e0d4b0'); R(21, 5, 6, 1, '#4a3a2a'); R(25, 7, 2, 2, '#b82a2a'); }
    },
    luo(g, e, t, R) {   // 门口挂的铜锣
      R(1, 14, 14, 2, 'rgba(0,0,0,.35)'); R(1, -8, 2, 23, '#5a3a1a'); R(13, -8, 2, 23, '#5a3a1a'); R(1, -9, 14, 2, '#4a2a14');
      const sh = e.hit ? Math.round(Math.sin(t * 30)) : 0;
      R(3 + sh, -5, 10, 10, '#b8903a'); R(3 + sh, -5, 10, 1, '#8a6a2a'); R(4 + sh, -4, 8, 8, '#c9a35a'); R(7 + sh, -1, 2, 2, '#e8c84a');
    },
    zsign(g, e, t, R) { R(0, 2, 48, 11, '#1a1210'); R(1, 3, 46, 9, '#2a1a14'); for (const x of [5, 16, 27, 38]) { R(x, 5, 6, 1, '#c9a35a'); R(x + 2, 4, 2, 6, '#c9a35a'); R(x, 8, 6, 1, '#c9a35a'); } },
    umbO(g, e, t, R) {   // 撑开、立在地上的油纸伞
      R(1, 13, 14, 2, 'rgba(0,0,0,.4)'); R(3, 3, 10, 6, '#2a1e18'); R(1, 5, 14, 3, '#2a1e18'); R(5, 2, 6, 1, '#2a1e18');
      for (const x of [3, 6, 9, 12]) R(x, 4, 1, 4, '#4a3a2a'); R(7, 1, 2, 1, '#8a6a3a'); R(8, 8, 1, 6, '#8a6a3a');
    },
    idoor(g, e, t, R) { box(R, 1, -2, 14, 17, '#5a3a22'); R(3, 0, 10, 5, '#6a4a2e'); R(3, 7, 10, 5, '#6a4a2e'); R(11, 6, 2, 2, '#c9a35a'); if (e.locked) R(2, 6, 12, 1, '#3a2614'); },
    paiwei(g, e, t, R) { R(5, 13, 6, 2, 'rgba(0,0,0,.35)'); R(6, 2, 4, 11, '#d8b888'); R(5, 12, 6, 2, '#8a6a3a'); R(7, 4, 2, 7, '#2a1a10'); }
  };

  /* ---------- 笔记 ---------- */
  const NOTES_L = {
    gezai: { title: '歌仔册《林投姐歌》（手抄本）', text: '（阿爸床头那本翻烂了的歌仔册。纸黄了，字是请人抄的，有几处用红笔圈过。）\n\n劝恁大家听我念，府城东门外一边；\n林投树仔一大片，暗时有人出来行。\n\n有个寡妇叫招娘，丈夫早死守空房；\n厝内也有几分钱，一家大小免惊饥。\n\n唐山来个周亚思，嘴甜舌滑真够力；\n讲欲做伙来生理，汕头樟脑趁大钱。\n\n招娘听伊话一句，金银首饰交伊去；\n讲好船到写批返，一年两年无消息。\n\n债主上门来讨钱，厝也卖了田也无；\n可怜招娘无路走，林投树脚——\n（这一行被红笔涂掉了。阿爸说，小孩子不要念。）\n\n自彼时阵到今日，暗时林投出来行；\n来买肉粽一粒一，钱到天光变银纸。\n\n（最后一页，抄歌的人添了一行小字：「歌是唱的，字照音写，名姓或有差错，看官莫怪。」）' },
    zaji: { title: '《府城杂记》·「林投」一则（铁口仙的抄本）', text: '东门外有林投数亩，叶有刺，土人取以为篱。\n\n有卖粽者夜过其地。三更后，一妇人素衣披发，来市肉粽一枚，予钱一文。天明启视钱筐，钱中杂纸钱一片。\n\n如是者数夜，卖粽者疑而尾之。至林投深处，妇人不见，唯见粽在树下，并前夜所售者，皆未动也。\n\n或曰：此李氏妇也，为人所诳，财尽，殁于林中。\n（编者按：其事不可考。）\n\n又闻：有贪者，故收其钱，以纸钱当钱用。未几，家中夜夜闻妇人哭，钱箱尽为纸灰。\n\n（铁口仙在边上用朱笔批了一行：\n「认钱，莫认人。」）' },
    hunshu: { title: '婚书（嫁妆箱里）', text: '立婚书人周亚思，系广东潮州府澄海县人，现寓台湾府城。\n今凭媒说合，娶得台湾府　李氏□娘　为妻。\n自娶之后，夫妇和顺，白头偕老。\n恐口无凭，立此婚书为照。\n\n　　光绪二年　月　日\n　　立婚书人　周亚思（押）\n　　媒人　陈氏（押）\n\n（纸被水泡过。名字中间那个字晕成了一团墨，凑到灯下细看，只认得出左边是个「日」字旁。）\n\n（背面一行小字，像是后来添的：\n「娶时言明，伊在唐山并无妻室。」）' },
    jieju: { title: '借据（嫁妆箱里）', text: '立借字人周亚思，今因往汕头采办樟脑，资本不敷，\n借到　李□娘　名下纹银一千二百两正。\n言定船到汕头，货出即还，按月二分起息，不得拖欠。\n如有反悔，任凭债主执此字，向周姓亲族追讨。\n\n　　光绪三年四月\n　　立借字人　周亚思（押）\n　　汕头埠　周记樟脑行\n\n（出借人名字中间那个字，被一枚红指印压住了——是她按的手印。）\n（字据的一角，被林投叶的刺划破了好几道。）' }
  };

  const ITEMS_L = {
    dan: { name: '粽担', desc: '一根扁担两只竹篮，挂满一串串刚蒸好的肉粽。\n收钱的竹筒挂在扁担头上。' },
    hongzhi: { name: '红纸', desc: '铁口仙给的几张红纸。验出来是她的钱，就包起来另放，天光了烧还给她。' },
    silver: { name: '一锭银子', desc: '沉甸甸的，压手。是她留在案板上的。\n天亮了，它也没有变。' },
    hunshu: { name: '婚书', desc: '周亚思立的婚书。被水泡过，她名字中间那个字糊了，只剩左边一个「日」。' },
    jieju: { name: '借据', desc: '周亚思向她借银一千二百两的字据。她的名字被自己的红指印压住了一个字。' },
    paiwei: { name: '牌位', desc: '新刻的木牌位：「李氏昭娘之神位」。墨还没干透。' },
    umb: { name: '黑油纸伞', desc: '阿母留下的黑油纸伞。有一根伞骨是阿爸后来接上的。' }
  };
  let WV = null, RG = 0, HUMT = 0, DEATHS = {};

  /* ================= 通用 ================= */
  function townLight(S) {
    const f = S.f, night = ['n1', 'n2', 'n2g'].includes(f.ph), dusk = f.ph === 'n1prep';
    S.dark(night ? .86 : dusk ? .55 : .14, 'town');
    S.ent('lp').off = !night; S.ent('dl').off = !(night || dusk);
    S.show('xian', ['n1prep', 'd2', 'd3', 'd3b', 'd3u'].includes(f.ph));
    const day = ['d2', 'd3', 'd3b', 'd3u'].includes(f.ph), pre = f.ph === 'n1prep' && !S.has('dan');
    S.show('zhutong', day || pre); S.show('dan', day || pre);
  }
  /* 验钱：掂、照、弹，然后决定收进竹筒 / 红纸另包 / 退回。返回 'box' | 'red' | 'back' */
  const COIN = {
    real: { w: '沉甸甸的。铜钱边上，还带着人手心里的热气。', l: '你把钱凑到灯笼底下。方孔里透过来一点灯光，「光绪通宝」四个字清清楚楚，边上磨得发亮。', f: '「叮——」\n又脆又长，在夜里传出去老远。' },
    ghost: { w: '轻。轻得像捏着一片叶子。\n而且凉——凉得像刚从井水里捞起来。', l: '你把钱凑近灯笼。灯火忽然往一边倒，像是在躲它。\n方孔里透不过一点光，黑的。钱面上的字，你怎么看也看不清。', f: '「噗。」\n闷闷的一声，像弹在一张纸上。' }
  };
  async function coinCheck(S, kind, who, mode) {
    const C = COIN[kind];
    for (;;) {
      const opts = [['w', '掂一掂'], ['l', '照一照'], ['f', '弹一弹'], ['box', '收进竹筒']];
      if (mode === 2 && S.has('hongzhi')) opts.push(['red', '红纸另包']);
      opts.push(['back', '退回去']);
      const r = await S.ask(`${who}的钱，躺在你手心里。`, opts.map(o => o[1]), '阿添');
      const k = opts[r][0];
      if (k === 'w') { await S.narr(C.w); continue; }
      if (k === 'l') { await S.narr(C.l); continue; }
      if (k === 'f') { if (kind === 'real') SND.ding(S); else SND.dud(S); await S.narr(C.f); continue; }
      if (k === 'box') { if (kind === 'real') SND.drop(S); else SND.dud(S); return 'box'; }
      if (k === 'red') { S.sfx('paper'); return 'red'; }
      return 'back';
    }
  }
  const sell = S => { const t = S.ent('tan'); t.s.left = Math.max(1, (t.s.left || 5) - 1); S.sfx('blip'); };
  async function leave(S, id, x, y, spd = 3) { await S.walk(id, [x, y], spd); S.hide(id); }

  /* ================= 家 ================= */
  async function fatherN1(S) {
    await S.say('阿爸', ['收钱要验。现在市面上铅钱、鹅眼钱多得是。', '掂一掂，有没有分量；凑到灯底下照照，字清不清楚；指甲弹一下，听它响不响。'], { style: 'whisper' });
    await S.say('阿爸', ['还有……咳、咳……', '三更以后，要是有个女人从林投林那边过来买粽——', '你卖给她就是。别多问，也别跑。'], { style: 'whisper' });
  }
  async function fatherTalk(S) {
    const f = S.f;
    if (f.ph === 'n1prep') { if (!S.has('dan')) return fatherN1(S); return S.say('阿爸', '去吧。灯笼挂高一点，客人远远就看得见。', { style: 'whisper' }); }
    if (f.ph === 'd2') return S.say('阿爸', f.counted ? ['去城门口找铁口仙。', '床头那本歌仔册，你也翻翻。'] : '钱……数过没有？竹筒在桌上。', { style: 'whisper' });
    if (f.ph === 'n2g') return S.say('阿爸', '……你怎么回来了？她在林子里等你。', { style: 'whisper' });
    if (f.ph === 'd3') {
      if (S.once('fd3')) {
        if (f.took) await S.say('阿爸', ['……你又把她的钱收进竹筒了。我闻得到，一屋子金纸味。', '阿爸跟你讲过的。……算了，她没跟你计较。'], { style: 'whisper' });
        if (f.yuBad) await S.say('阿爸', ['一早，有个戴孝姑娘的阿伯找上门来，说你昨晚拿红纸包她的钱，咒她。', '阿爸替你赔了不是。……认钱，别认衣裳。'], { style: 'whisper' });
        if (f.wangBad) await S.say('阿爸', '王婶也来骂了一顿，说你触她霉头。……她是接生的，最忌这个。', { style: 'whisper' });
        await S.say('阿爸', ['看你的脸，就知道你见着她了。', '她给你的那两张纸，拿去给铁口仙看。'], { style: 'whisper' });
        return;
      }
      return S.say('阿爸', '拿着婚书，去找铁口仙。', { style: 'whisper' });
    }
    if (f.ph === 'd3b') return S.say('阿爸', ['牌位刻好了？', '墙上那把油纸伞，是你阿母留下的。拿去。'], { style: 'whisper' });
    if (f.ph === 'd3u') {
      if (S.once('fbye')) {
        await S.say('阿爸', ['那把伞，你阿母撑着它嫁过来的。', '过黑水沟的时候，记得拜船仔妈。船尾那个小神龛，妈祖婆坐在里头。'], { style: 'whisper' });
        await S.say('阿爸', ['……阿爸的病不要紧。', '去吧。早去早回。'], { style: 'whisper' });
        return;
      }
      return S.say('阿爸', '去吧。天黑了，她在等。', { style: 'whisper' });
    }
    return S.say('阿爸', '咳、咳……', { style: 'whisper' });
  }
  async function zaoUse(S) {
    const f = S.f;
    if (f.ph === 'n1prep' && !S.has('dan')) {
      S.give('dan'); S.hide('dan'); S.hide('zhutong'); S.ent('zao').s.empty = true;
      await S.narr('你掀开蒸笼，白气扑了一脸。\n一串串肉粽提出来，挂上扁担两头的竹篮；收钱的竹筒，挂在扁担头上。');
      await S.think('阿爸的粽，一粒粽一粒料：五花肉、卤蛋、香菇、花生。东门外的老客，吃了二十年。');
      S.goal('挑着粽担，出东门，到林投林边的老位置摆摊');
      return;
    }
    return S.narr(S.ent('zao').s.empty ? '蒸笼空了。灶膛里的火还没熄，一闪一闪。' : '灶上两摞蒸笼，噗噗地冒着白气。一屋子粽叶香。');
  }
  async function countMoney(S) {
    const f = S.f;
    if (f.ph === 'd2' && !f.counted) {
      f.counted = true; S.sfx('item');
      await S.narr('你把竹筒倒过来，铜钱哗啦啦倒了一桌。\n一个，两个……老蔡的四个，前前后后几个客人的……');
      SND.dud(S);
      await S.narr('最后滚出来的，不是铜钱。\n是一张折成圆片的纸。黄底子，当中贴着一小块锡箔——\n银纸。烧给死人的那种。');
      await S.think('……是她给的那一枚。');
      S.sfx('heart');
      await S.say('阿爸', ['……阿添，拿过来给阿爸看看。', '林投姐。……她又出来了。东门外卖粽的，哪个没收过她的钱。'], { style: 'whisper' });
      await S.say('阿爸', ['十几年前，城里有个李家的寡妇，丈夫死了，留下一点家底。唐山来的周亚思嘴甜，讲要跟她合伙做樟脑生意。', '她把家里的钱、去钱庄借的钱，都交给他带过海——他就再也没回来。债主上门，房子也没了。', '后来……有人在东门外的林投树底下，找到了她。'], { style: 'whisper' });
      await S.say('阿爸', ['她不害人，只买一粒粽。可她给的钱，不能当真钱花——拿她的钱做买卖，就是拿她的命做买卖。', '她要是开口求你什么……咳、咳……去城门口问铁口仙。他读过书，懂这些。'], { style: 'whisper' });
      S.goal('去东门口找算命的铁口仙（阿爸床头有本歌仔册）');
      return;
    }
    if (f.ph === 'n1prep') return S.narr('收钱的竹筒，空的。阿爸说，竹筒要挂在扁担头上，伸手就够得着。');
    return S.narr(f.counted ? '竹筒里的铜钱，阿爸叫你收进了神明桌的抽屉。\n那张银纸，单独压在香炉底下。' : '竹筒空着。');
  }
  async function umbUse(S) {
    const f = S.f, e = S.ent('umbw');
    if (e.s.gone) return S.narr('墙上只剩一根钉子。');
    if (f.ph === 'd3b') {
      e.s.gone = true; S.give('umb'); f.ph = 'd3u';
      await S.narr('你踮起脚，把墙上那把黑油纸伞取下来。\n伞面上落了一层灰，撑开一半，一股桐油味。');
      S.sfx('paper');
      await S.narr('你把牌位用红绳绑在伞柄上，收拢了伞。');
      await fatherTalk(S);
      S.goal('天黑以后，去林投林里她那棵树下请她（东门外路的尽头）');
      return;
    }
    return S.narr('墙上挂着一把黑油纸伞。阿母留下的。\n阿母走了以后，阿爸再没撑过它。');
  }
  async function altarHome(S) {
    const f = S.f;
    if (f.ph === 'd3u' && S.once('pray')) { S.sfx('match'); return S.narr('你在妈祖婆面前点了一炷香。\n「妈祖婆保庇……保庇我们过黑水沟。」\n香烟直直地升上去，没有散。'); }
    return S.narr('神明桌上供着妈祖婆和阿公阿嬷的牌位。\n香炉里的香，阿爸每天早晚都要换。');
  }

  /* ================= 第一夜 ================= */
  async function tanUse(S) {
    const f = S.f;
    if (f.ph === 'n1prep') {
      if (!S.has('dan')) return S.narr('阿爸的粽摊。车板上一层油光，横杆上还挂着去年的粽叶。\n得先回家，把蒸好的肉粽挑来。');
      return night1(S);
    }
    if (f.ph === 'n1' || f.ph === 'n2') {
      const list = f.ph === 'n1' ? N1 : N2, i = f.cust || 0;
      if (i >= list.length) return;
      f.cust = i + 1;
      if (S.pl.x !== 25 || S.pl.y !== 8) { await S.walk('pl', [25, 8], 4.2); }
      S.face('pl', 0);
      return list[i](S);
    }
    if (f.ph === 'n2g') return S.narr('摊子上的灯笼还亮着。\n她进了林投林。路的东头。');
    return S.narr(f.ph === 'd2' || f.ph === 'd3' || f.ph === 'd3b' || f.ph === 'd3u' ? '白天的粽摊，收着。车板上那片林投叶，你没敢扔。' : '阿爸的粽摊。');
  }
  async function night1(S) {
    const f = S.f, tan = S.ent('tan');
    S.take('dan'); f.ph = 'n1';
    await S.fade(1, 500);
    S.pos(25, 8, 0); tan.s.left = 5; townLight(S);
    await S.fade(0, 700);
    await S.narr('你把粽担卸下来，锅架上，灯笼挂上杆头。\n天黑透了。东门外这条路，白天就没几个人走，入了夜，只剩虫叫。');
    SND.cry(S); await S.wait(1500);
    await S.think('烧——肉——粽——\n……阿爸喊了二十年，满街都认得他的声音。我一喊，嗓子就劈了。');
    f.cust = 1;
    return n1geng(S);
  }
  async function n1geng(S) {
    SND.geng(S, 1); await S.wait(1300);
    S.place('c_geng', 18, 10, 2); await S.walk('c_geng', [25, 10], 3.4); S.face('c_geng', 3);
    await S.say('更夫老蔡', ['哟，阿添？换你出来卖啦。你阿爸咳得好点没？', '来一粒。打完一更，肚子先打起鼓来了。']);
    sell(S);
    await S.narr('他把四个铜钱放进你手心。');
    await S.think('阿爸说过：收钱先验。掂一掂，照一照，弹一弹。');
    const g = await coinCheck(S, 'real', '老蔡', 1);
    if (g === 'back') { await S.say('更夫老蔡', '不要钱？你阿爸知道要骂你。'); await S.narr('他把铜钱拍在案板上。你只好收进竹筒。'); SND.drop(S); }
    await S.say('更夫老蔡', ['验得这么仔细，你阿爸教的吧。', '……我跟你讲。三更以后，林投林那边要是过来什么人，卖她就是，别多看。'], );
    await S.say('更夫老蔡', '我打更打了十几年。三更以后，东门外这一段，我都绕着走。');
    await leave(S, 'c_geng', 18, 10, 3.4);
    S.goal('吆喝一声，等下一位客人（调查粽摊）');
  }
  async function n1atu(S) {
    const f = S.f;
    SND.cry(S); await S.wait(900);
    SND.geng(S, 2); await S.wait(1500);
    S.place('c_atu', 18, 11, 2); await S.walk('c_atu', [26, 10], 3); S.face('c_atu', 3);
    await S.say('罗汉脚阿土', ['头家……', '我身上一个钱都没有。明天要去安平港，听讲有船去汕头，缺人手。']);
    await S.say('罗汉脚阿土', '能不能赊我一粒？等我领了工钱，一定还你。');
    const r = await S.ask('他饿得两眼发直，喉结一上一下。', ['（拿一粒给他）不用还了。', '赊你一粒，我记在账上。', '……歹势，小本生意，不赊。'], '阿添');
    if (r < 2) {
      f.kind = r === 0 ? 2 : 1; sell(S);
      await S.narr('他接过去，烫得两只手来回倒，还是一口咬下去半粒。');
      await S.say('罗汉脚阿土', r === 0 ? ['……好人有好报。', '我叫阿土。你记住我。'] : ['我阿土讲话算话。', '等我从汕头回来，连本带利还你。']);
    } else await S.say('罗汉脚阿土', '……也是。打扰了。');
    await leave(S, 'c_atu', 18, 11, 3);
    S.goal('吆喝一声，等下一位客人（调查粽摊）');
  }
  async function n1ltj(S) {
    const f = S.f, tan = S.ent('tan');
    SND.cry(S); await S.wait(900);
    SND.geng(S, 3); await S.wait(2000);
    S.amb('wind'); SND.hum(S); await S.wait(2600);
    await S.narr('三更了。林投林深处，有个女人在哼歌仔调，哼得很轻。\n风忽然转了向，带着一股烧过金纸的味道。远处的狗叫了两声，不叫了。');
    S.ent('lp').flicker = true;
    S.place('c_ltj', 33, 10, 1); S.ent('c_ltj').alpha = 0;
    await S.alpha('c_ltj', 1, 1300);
    await S.walk('c_ltj', [26, 10], 1.7); S.face('c_ltj', 3);
    await S.narr('一个女人。\n一身素白的衫，长头发披下来，把脸遮得严严实实。\n她走到摊子前面，你才想起来——你没听见她的脚步声。');
    await S.say('白衫的女人', '……头家。一粒肉粽。', { style: 'whisper' });
    sell(S);
    await S.narr('你递过去一粒。她的手从袖子里伸出来，接住了。\n手白得发青。指甲缝里，嵌着一点泥。');
    await S.narr('然后，她把一枚钱放进你手心。');
    const c = await coinCheck(S, 'ghost', '她', 1);
    if (c === 'back') {
      await S.narr('你把钱递回去。她没有接。\n那枚钱从你指缝里滑下去，落在案板上，一点声音都没有。');
      await S.narr('……你犹豫了很久，还是把它收进了竹筒。总不能扔在路边。'); SND.dud(S);
    }
    await S.say('白衫的女人', '……唐山的船，这两日……有来无？', { style: 'whisper' });
    await S.say('阿添', '啊？我……我不知道。');
    await S.wait(700);
    S.face('c_ltj', 2);
    await S.walk('c_ltj', [30, 10], 1.6);
    S.ent('lp').flicker = false; S.ent('lp').off = true; S.sfx('whisper');
    await S.narr('灯笼「噗」地灭了。');
    S.hide('c_ltj'); S.ent('c_ltj').alpha = 1;
    await S.wait(900);
    S.sfx('match'); S.ent('lp').off = false; tan.s.leaf = true;
    await S.narr('你哆嗦着划了三根火柴，才把灯笼重新点着。\n路上空荡荡的。案板上，多了一片林投叶。');
    await S.think('……刚才那个，是人吗？');
    SND.geng(S, 4); await S.wait(1400);
    await S.fade(1, 900);
    await S.card('天光', '第二天早上', '你挑着粽担回到家，天已经蒙蒙亮了。\n一夜没合眼，可你怎么也睡不着。\n\n竹筒沉甸甸地挂在扁担头上。\n里面那一枚……');
    f.ph = 'd2'; f.cust = 0; tan.s.left = 0; S.ent('zao').s.empty = false; townLight(S);
    await S.go('town', 9, 4, 3);
    S.amb('room');
    S.goal('把竹筒里的钱倒出来数一数');
    S.cp('d2');
  }
  const N1 = [n1geng, n1atu, n1ltj];

  /* ================= 铁口仙 ================= */
  async function xianTalk(S) {
    const f = S.f; S.face('xian', 'pl');
    if (f.ph === 'n1prep') return S.say('铁口仙', ['阿添啊，替你阿爸出摊？', '天要暗了，我也该收摊了。……三更以后东门外的规矩，你阿爸跟你讲过没有？']);
    if (f.ph === 'd2') {
      if (!f.counted) return S.say('铁口仙', '一大早的，脸色这么白。昨晚收了什么钱，先回去数清楚。');
      await S.say('阿添', '先生……昨晚收的钱里，有一张银纸。');
      await S.say('铁口仙', ['给我看看。……嗯，是她。一粒粽能值几个钱？她要的不是粽——她有冤没处讲，夜夜出来，是在等人问她一句。', '这本《府城杂记》抄了她的事，你看看。']);
      await S.note('zaji');
      await S.say('铁口仙', ['看见我批的那一句？认钱，莫认人。她昨晚被你盯着瞧了半天，今晚未必还穿那身白衫来——鬼也知道人怕什么。', '验出来是她的钱，别收进竹筒。用这红纸包起来另放，天光了烧还给她。她肯开口，你就听。']);
      S.give('hongzhi');
      await S.say('铁口仙', '可也别认错了活人。人家好好地来买粽，你拿红纸包人家的钱，等于咒人家死。');
      await S.fade(1, 800);
      await S.card('第二夜', '', '太阳一落山，你又挑着粽担出了东门。\n\n红纸揣在怀里。\n灯笼挂上杆头的时候，你的手一直在抖。');
      return night2(S);
    }
    if (f.ph === 'd3') return carve(S);
    if (f.ph === 'd3b' || f.ph === 'd3u') {
      await S.say('铁口仙', ['伞底下是阴，太阳照不到，海风吹不散。', '今晚到她树下，撑开伞，罩着牌位，叫她的名字三声。她应了，就收伞。']);
      await S.say('铁口仙', '一路上，伞不能在日头底下打开。每到一处地头——上船、下船、进门——都叫她一声。');
      if (f.ph === 'd3b') S.goal('回家拿墙上那把油纸伞');
      return;
    }
    return S.narr('卦摊收了。只剩一块「铁口直断」的布招，在夜风里一下一下地晃。');
  }
  /* 谜题：刻牌位。名字要从歌仔册（音）、婚书（字形）、借据凑出来 */
  async function carve(S) {
    const f = S.f;
    if (!S.has('hunshu')) return S.say('铁口仙', '要刻牌位，得有她的真名。歌仔册是唱的，不作数。');
    if (S.once('carveIntro')) {
      await S.say('阿添', ['先生，她要我替她过海，去汕头找周亚思。', '这是她箱子里的婚书和借据。']);
      await S.say('铁口仙', ['阴魂不过海。海是妈祖婆的地界，她那样的，一沾海水就散了。', '要带她过去，得给她刻一块牌位，让她附在上面。']);
      await S.say('铁口仙', ['牌位上的名字要真，一笔都不能错。刻错了，她不认。', '歌仔里唱她叫「招娘」，府城人叫她「林投姐」——可她爹娘给她取的名字，你得自己对出来。']);
    }
    const keys = ['李', '林', '周', '招', '昭', '娘', '秀', '月'];
    const v = await S.keypad('刻牌位：她的名字（三个字）\n对照婚书、借据、歌仔册（一人念线索，一人下刀）', keys, 3);
    if (v == null) return S.say('铁口仙', '想好了再下刀。木头刻坏了，要刨掉重来。');
    if (v === '李昭娘') {
      S.sfx('good'); S.give('paiwei'); f.ph = 'd3b';
      await S.narr('刀尖一笔一笔走过去，木屑卷起来，落在卦摊上。\n「李氏昭娘之神位」。');
      await S.say('铁口仙', ['对了。日字边的昭，昭君的昭。', '歌仔是唱的，同音就写。她自己的名字，十几年没人叫对过。']);
      await S.say('铁口仙', ['安平港的金顺发，明天一早开去汕头。', '回家把伞拿来，天黑以后，去她树下请她。']);
      if (S.has('silver')) await S.say('铁口仙', '她给你的那锭银子……你自己心里清楚，它是什么。');
      S.goal('回家拿墙上那把油纸伞');
      return;
    }
    const n = f.carveN = (f.carveN || 0) + 1;
    S.sfx('cut'); S.shake(300, 2); S.fx('red'); S.sfx('whisper');
    await S.narr('刀一歪，刻刀「当」地掉在地上。\n卦摊上的签筒，自己倒了。竹签撒了一地——大白天的，你后颈一凉。');
    await S.narr('铁口仙半天没出声。然后叹了口气，拿刨子把那一层刨掉。');
    let hint;
    if (v[0] !== '李') hint = v[0] === '林' ? '林投是树，不是她的姓。' : v[0] === '周' ? '姓周？她跟周家，只剩一张骗人的婚书。' : '姓呢？婚书、借据上，都写着她姓什么。';
    else if (v[2] !== '娘') hint = '歌仔里、婚书上，最后一个字都一样。';
    else if (v[1] === '招') hint = '歌仔是唱的，照音写字。「招」是提手旁——婚书上糊掉的那个字，左边不是手。';
    else hint = '中间那个字……念出来的音，歌仔里唱过；字的模样，婚书上留着半边。';
    await S.say('铁口仙', hint);
    if (n === 2) await S.say('铁口仙', '音，从歌仔册里找；形，从婚书上找。两样合起来。');
    else if (n === 3) await S.say('铁口仙', '婚书上那个字，左边是「日」。念起来，跟歌仔里的「招」一个音。');
    else if (n >= 4) await S.say('铁口仙', '……是「昭」。日字边、昭君的昭。李——昭——娘。');
  }

  /* ================= 第二夜 ================= */
  async function night2(S) {
    const f = S.f, tan = S.ent('tan');
    f.ph = 'n2'; f.cust = 1; tan.s.left = 5; tan.s.leaf = false;
    townLight(S);
    await S.go('town', 25, 8, 0);
    S.amb('night');
    return n2yu(S);
  }
  async function n2yu(S) {
    const f = S.f;
    SND.cry(S); await S.wait(1200);
    SND.geng(S, 1); await S.wait(1300);
    S.place('c_yu', 33, 10, 1); await S.walk('c_yu', [25, 10], 2.4); S.face('c_yu', 3);
    await S.narr('林投林那头的路上，走过来一个人。\n一身白——白衫、白裙，头上包着一块白布。');
    S.sfx('heart');
    await S.think('……白衫。从林投林那边过来的。');
    await S.say('白衣姑娘', '……一粒肉粽。');
    sell(S);
    const a = await coinCheck(S, 'real', '白衣姑娘', 2);
    if (a === 'box') {
      f.yuOk = true;
      await S.say('白衣姑娘', ['……你一直看我做什么？', '我阿嬷过身，今天做头七。我去坟上守到这时候才回来。坟就在林投林后面。']);
      await S.say('白衣姑娘', ['你也看见她了吧？林投林那个。', '我阿嬷年轻时跟她住隔壁。阿嬷常讲，大家叫她林投姐，叫久了，没人记得她叫什么。']);
      await S.say('白衣姑娘', ['阿嬷记得。是「昭」——日字边的昭，昭君的昭。', '歌仔册上写成提手的「招」，阿嬷每回听人唱，都要骂一句：连名都给人写错了。']);
      f.yuClue = true;
      await S.say('白衣姑娘', '我叫阿玉。……你自己小心。');
    } else {
      f.yuBad = true;
      if (a === 'red') await S.narr('你把她的铜钱用红纸包了起来。');
      else await S.narr('你把钱推了回去。');
      await S.say('白衣姑娘', ['……你这是什么意思？', '我阿嬷才走七天！你当我是什么？！'], { style: 'big' });
      await S.narr('她把那粒粽往案板上一摔，扭头就走。');
    }
    await leave(S, 'c_yu', 18, 10, 3);
    S.goal('吆喝一声，等下一位客人（调查粽摊）');
  }
  async function n2wang(S) {
    const f = S.f;
    SND.cry(S); await S.wait(900);
    SND.geng(S, 2); await S.wait(1300);
    S.place('c_wang', 18, 11, 2); await S.walk('c_wang', [26, 10], 4); S.face('c_wang', 3);
    await S.say('产婆王婶', ['阿添！快，包四粒！', '城外林家媳妇要生了，我得赶过去。生孩子的人，半夜要吃点东西垫肚子。']);
    sell(S);
    const b = await coinCheck(S, 'real', '王婶', 2);
    if (b === 'red') { f.wangBad = true; await S.say('产婆王婶', ['夭寿哦！拿红纸包我的钱，咒我啊？', '我赶着去接生，你给我触这个霉头！'], { style: 'big' }); }
    else if (b === 'back') await S.say('产婆王婶', '不收？那我先欠着，你阿爸那边我自己跟他讲。');
    else await S.say('产婆王婶', '好孩子，跟你阿爸一样实在。');
    await leave(S, 'c_wang', 34, 11, 4);
    S.goal('吆喝一声，等下一位客人（调查粽摊）');
  }
  async function n2hat(S) {
    const f = S.f, tan = S.ent('tan');
    SND.cry(S); await S.wait(900);
    SND.geng(S, 3); await S.wait(1800);
    S.amb('wind'); SND.hum(S);
    await S.narr('三更。林子深处，又有人在哼那支歌仔调。\n你一直盯着林投林那头的路。那边黑漆漆的，什么都没有。');
    S.place('c_hat', 18, 10, 2); await S.walk('c_hat', [25, 10], 2.4); S.face('c_hat', 3);
    await S.narr('……从城门那边，来了一个戴斗笠的女人。一身黑衫，斗笠压得很低。\n走到摊子前面，你才发现自己没听见她的脚步声。');
    S.ent('lp').flicker = true;
    await S.say('戴斗笠的女人', '一粒。', { style: 'whisper' });
    sell(S);
    const c = await coinCheck(S, 'ghost', '戴斗笠的女人', 2);
    S.ent('lp').flicker = false;
    if (c === 'box') {
      f.took = true; S.sfx('heart');
      await S.say('戴斗笠的女人', '……收了。就是收了。', { style: 'whisper' });
      await S.think('那一声……不是铜钱掉进竹筒的声音。\n阿爸讲过：她给的钱，不能当真钱。');
    } else if (c === 'red') {
      f.wrapped = true;
      await S.say('阿添', '这钱，我不收。我用红纸包起来，明天天光，烧还给你。');
    } else {
      f.wrapped = true;
      await S.say('阿添', '这粒……不要钱。请你吃。');
    }
    S.ent('c_hat').spr = '@ltj'; S.sfx('whisper');
    await S.narr('她站着没动。过了很久，抬手把斗笠往上推了推——\n长头发底下，是昨晚那张脸。白得像浸过水的纸。');
    await S.say('她', '……你是第一个看清了我，还没跑的卖粽仔。', { style: 'whisper' });
    const q = await S.ask('她在等你开口。', ['你……就是林投姐？', '你天天问唐山的船——你在等谁？'], '阿添');
    if (q === 0) await S.say('她', '林投姐……大家都这样叫。我原来，不叫这个。', { style: 'whisper' });
    else await S.say('她', '等一个姓周的。他讲，船一到汕头，就写信回来。', { style: 'whisper' });
    await S.say('她', ['我等了十几年。船来了一艘又一艘，信一封也没有。', '卖粽仔，我求你一件事。林投林里，我那棵树底下埋着我的东西。你跟我来。'], { style: 'whisper' });
    tan.s.silver = true; S.sfx('ding');
    await S.narr('她把一样东西放在案板上。\n一锭银子。在灯笼底下，白得发亮。');
    await S.say('她', '这个，是粽钱。……也是船钱。', { style: 'whisper' });
    S.face('c_hat', 2);
    await S.walk('c_hat', [32, 10], 1.8);
    await S.alpha('c_hat', 0, 900);
    S.ent('c_hat').alpha = 1;
    tan.s.silver = false; S.give('silver');
    await S.think('……船钱？');
    f.ph = 'n2g';
    S.goal('跟她进林投林（路的东头）');
    S.cp('n2g');
  }
  const N2 = [n2yu, n2wang, n2hat];

  /* ================= 东门外：出入林投林 ================= */
  async function toGrove(S) {
    const f = S.f;
    if (f.ph === 'n2g') return S.go('grove', 1, 10, 2);
    if (f.ph === 'd3u') {
      await S.fade(1, 700);
      await S.card('第三夜', '', '你等到天黑透了，才撑着那把收拢的伞出了东门。\n\n今晚粽摊没有摆出来。\n东门外的路上，只有虫叫。');
      f.ph = 'n3';
      return S.go('grove', 23, 13, 2);
    }
    if (f.ph === 'd3' || f.ph === 'd3b') return S.narr('白天的林投林静悄悄的。她只在夜里出来。\n先把该办的事办了。');
    return S.narr('林投林里黑漆漆的，叶子边上的倒刺勾住了你的裤脚。\n阿爸说过，别往那里头去。');
  }
  async function bogongUse(S) {
    const f = S.f;
    if (S.once('bogong')) { S.sfx('match'); return S.narr('路边的伯公庙，小得只够伯公一个人坐。\n你合掌拜了拜：「伯公保庇，今晚生意平安。」\n庙里的香，不知道是谁点的，还没烧完。'); }
    return S.narr(f.ph === 'n2g' ? '伯公眯着眼睛，看着林投林那头。' : '伯公庙前的香炉里，插着几根烧剩的香脚。');
  }

  /* ================= 林投林 ================= */
  async function groveMeet(S) {
    const f = S.f;
    S.place('g_ltj', 24, 12, 3); S.focus(24, 12);
    await S.narr('林子忽然开阔了。一棵很老的林投树，支柱一样的根扎了一地。\n树底下站着她，背对着你。你轻轻喊了一声。');
    await S.wait(700);
    S.face('g_ltj', 1);
    await S.scare('face', { spr: '@ltj', face: 'ltj', dur: 1.4 });
    S.sfx('sting');
    await S.narr('她转过来的那一下——头发散开了。一截暗红的东西从她嘴里垂下来，一直垂到下巴底下。\n你倒退三步，后背撞进林投叶里，倒刺扎进了肉。');
    await S.wait(600);
    S.focus(null);
    await S.say('她', '……歹势，吓到你了。在这里站久了，我自己都忘了自己是什么样子。', { style: 'whisper' });
    await S.narr('她用袖子掩住了嘴。头发重新垂下来，把脸遮住了。\n树根底下，摆着你今晚卖给她的那粒粽，一口都没动。');
    await S.say('她', ['他叫周亚思，潮州澄海人，在府城做樟脑生意。我丈夫死后，他常来走动，讲话好听，对孩子也好。', '他娶了我。婚书上写得清清楚楚：他在唐山，没有妻室。', '后来他要我出本钱去汕头办樟脑。我把家里的钱都给了他，又去钱庄借，按了手印。他上了船——一年，两年。', '债主来了。房子没了。孩子……'], { style: 'whisper' });
    await S.narr('她没有说下去。林子里的风，停了一下。');
    await S.say('她', '后来听说，周记樟脑行生意做得很大。头家在汕头娶了妻，生了儿子。\n那些纸，在树根底下的箱子里。我拿不动它们了。', { style: 'whisper' });
    S.goal('打开树根下的嫁妆箱');
  }
  async function chestUse(S) {
    const f = S.f, e = S.ent('chest');
    if (f.ph === 'n3' && S.has('silver') && !f.silverBack) {
      const r = await S.ask('空箱子里只剩一股樟脑味。怀里那锭银子，沉甸甸地硌着你。', ['（把银锭放回箱子里）这个，还给你。', '（算了）'], '阿添');
      if (r === 0) { S.take('silver'); f.silverBack = true; S.sfx('ding'); await S.narr('你把银锭放进箱底，合上了盖子。\n林子里的风，轻轻地叹了一口气。'); }
      return;
    }
    if (f.ph !== 'n2g' || !f._o_meet) return S.narr(e.open ? '箱子空了。只剩一股樟脑味。' : '树根底下，半埋着一只红漆箱子。');
    if (e.open) return;
    e.open = true; S.sfx('open');
    await S.narr('你扒开树根底下的土。\n红漆的嫁妆箱，漆皮一片片翘起来。箱子里一股樟脑味——他留给她的，只有这个味道。');
    await S.note('hunshu'); S.give('hunshu', true);
    await S.note('jieju'); S.give('jieju', true);
    S.sfx('item'); S.toast('获得：婚书、借据');
    S.face('g_ltj', 'pl');
    await S.say('她', ['卖粽仔，替我过一趟海。我自己过不去——海是妈祖婆的地界，我这样的，一下水就散了。', '我不要他的命。我只要他周家的人、他周家的祖宗，都听一听：他欠了谁。'], { style: 'whisper' });
    await S.say('她', ['可是见了他，我怕我忍不住。到时候我要是变了——你就敲锣，把周家的人都叫来；把这两张纸摆到他周家祖宗面前，让他们自己念。', '借据上写着「向周姓亲族追讨」。那是他自己写的。'], { style: 'whisper' });
    await S.say('阿添', '我……该怎么叫你？');
    await S.say('她', '这里的人都叫我林投姐。叫了十几年，我自己都快想不起来，阿爸阿母是怎么叫我的了。', { style: 'whisper' });
    if (f.took) await S.say('她', '你把我的钱收进竹筒，当了真钱。……不要紧。下回，别再收了。', { style: 'whisper' });
    await S.alpha('g_ltj', 0, 1400);
    await S.narr('风一吹，她就不在了。\n树根底下，只剩那只空箱子。');
    await S.fade(1, 1000);
    await S.card('第三天', '', '你在林投林里坐到天亮，才找到出来的路。\n\n婚书和借据揣在怀里，\n她的名字，被水泡糊了一个字，被指印压住了一个字。\n\n得给她刻一块牌位。');
    f.ph = 'd3'; townLight(S);
    await S.go('town', 9, 4, 3);
    S.amb('room');
    S.goal('拿着婚书去东门口找铁口仙，给她刻牌位');
    S.cp('d3');
  }
  async function treeUse(S) {
    const f = S.f;
    if (f.ph === 'n3') {
      if (!S.has('umb') || !S.has('paiwei')) return S.narr('伞和牌位都得带来。');
      S.show('g_umb');
      await S.narr('你把牌位立在树根上，撑开油纸伞，罩住它。\n伞面在风里轻轻地抖。');
      for (let i = 0; i < 3; i++) { SND.bell(S); await S.say('阿添', '李昭娘——', { style: 'big' }); await S.wait(500); }
      S.place('g_ltj', 23, 13, 3); S.ent('g_ltj').alpha = 0;
      await S.alpha('g_ltj', 1, 1200);
      await S.say('她', ['……昭娘。', '好久……没有人这样叫我了。'], { style: 'whisper' });
      await S.narr('她低下头，看着牌位上那几个字，看了很久。');
      await S.say('李昭娘', '走吧。', { style: 'whisper' });
      await S.walk('g_ltj', [23, 12], 1.2);
      await S.alpha('g_ltj', 0, 1000);
      S.hide('g_umb');
      await S.narr('伞柄忽然沉了一下，像有人轻轻扶住了它。\n你收起伞。绑在伞柄上的牌位，凉得像一块冰。');
      await S.fade(1, 1000);
      await S.card('安平港', '第四天　一早', '天还没亮透，安平港已经闹哄哄的了。\n挑夫、牛车、讨价还价的商人。\n\n「金顺发」靠在最外头的码头上，帆半张着。\n船老大站在跳板边上，叉着腰。');
      f.ph = 'dock';
      return S.go('ship', 14, 12, 3);
    }
    return S.narr(f._o_meet ? '她的树。高处那截布条，你没有再抬头去看。' : '一棵很老的林投树。树根像几十只手，抓着地。');
  }

  /* ================= 船 ================= */
  async function laodaTalk(S) {
    const f = S.f;
    if (f.ph !== 'dock') return S.say('船老大', f.storm ? '抱紧了！去船尾！' : '顺风顺水，后天就到汕头。');
    S.face('laoda', 'pl');
    await S.say('船老大', ['去汕头？金顺发正要开。', '船钱一两二钱银。先给钱，后上船。']);
    for (;;) {
      const opts = [];
      if (S.has('silver')) opts.push(['silver', '（拿出那锭银子）这个够不够？']);
      opts.push(['coins', '我只有一串铜钱……']);
      opts.push(['work', '我不要工钱，在船上替你们煮饭、包粽，抵船钱。']);
      const r = await S.ask(S.has('silver') ? '「怎样？」\n（怀里那锭银子，沉甸甸的。）' : '「怎样？」', opts.map(o => o[1]), '船老大');
      const k = opts[r][0];
      if (k === 'silver') return badSilver(S);
      if (k === 'coins') { await S.say('船老大', '一串铜钱？搭到澎湖都不够。'); continue; }
      if (f.kind) {
        S.show('atu2');
        await S.say('阿土', ['阿添？！', '老大，这个是东门外卖粽的！他的粽我吃过——' + (f.kind === 2 ? '他请的！' : '赊的！还没还！'), '让他上船煮饭，我替他担保！']);
        await S.say('船老大', '……阿土替你担保？好，上船。煮不好，把你扔下海喂鱼。');
      } else {
        await S.say('船老大', ['煮饭？我船上有煮饭的。', '……包粽？你拿一粒来，我尝尝。']);
        await S.narr('你从怀里摸出最后一粒肉粽。冷了，可是粽叶还香。\n船老大三两口吞下去，舔了舔指头。');
        await S.say('船老大', '……好。上船。到了汕头，给伙计们包一锅。');
      }
      break;
    }
    return setSail(S);
  }
  async function badSilver(S) {
    await S.narr('你把那锭银子放进他手里。');
    await S.narr('他放进嘴里咬了一口，眯起眼看了看牙印。');
    await S.say('船老大', '真银！上船，上船！');
    S.sfx('whisper');
    await S.narr('你抱着伞走上跳板。\n伞柄上的牌位，忽然冷得扎手。');
    await S.say('她（伞里）', '……你拿我的钱，买我的路？', { style: 'whisper' });
    await S.scare('face', { spr: '@ltj', face: 'ltj', dur: 1.2 });
    await S.end({ bad: true, id: 'yinzhi', title: '阴间的头家', text: '船出了鹿耳门。天光的时候，船老大打开钱箱——\n里面没有银子，只有一叠折得方方正正的银纸。\n\n他们说你带了阴物上船，在澎湖把你赶了下去。那把伞，你一转身就不见了。\n\n你回到府城，照旧挑粽担。\n只是从那以后，来买粽的客人一个比一个安静，给的钱一枚比一枚凉。\n到了月底，竹筒里一个铜板也没有，全是银纸。\n\n东门外的人说，林投林边，夜里多了一个卖粽的。\n他只做三更以后的生意。' });
  }
  async function setSail(S) {
    const f = S.f;
    await S.fade(1, 700);
    for (let y = 11; y <= 13; y++) for (let x = 0; x < 30; x++) S.tile(x, y, '~');
    S.tile(14, 10, 'Q');
    for (const id of ['dk1', 'dk2', 'dk3']) S.hide(id);
    S.place('laoda', 4, 8, 1);
    if (f.kind) S.place('atu2', 6, 3, 0); else S.hide('atu2');
    S.ent('mast1').s.storm = true; S.ent('mast2').s.storm = true;
    S.pos(23, 6, 1); f.ph = 'sea';
    await S.card('黑水沟', '台湾海峡　第二天夜里', '船出了鹿耳门，一路往西。\n\n第二天傍晚，海水的颜色变了——\n由青转蓝，由蓝转黑。\n\n船老大说，这就是黑水沟。\n「六死，三留，一回头。」\n过台湾的人，十个里头，六个死在这道沟里。');
    S.dark(.82); S.amb('wind');
    await S.fade(0, 700);
    S.shake(500, 2); SND.crash(S);
    await S.narr('半夜，风起来了。\n你在舱底抱着伞，水从船板缝里一股一股地往里渗。');
    await S.say('船老大（船尾）', ['舱底进水了！', '有东西的，都往上搬！'], { style: 'big' });
    await S.narr('你抱着伞爬出舱口。\n甲板斜着，浪头一个接一个地从左舷扑上来。');
    await S.think('伞不能泡水……\n船尾有船仔妈的神龛。绑在那里，妈祖婆护着。');
    if (f.kind) await S.say('阿土', '阿添！看着左边船舷！白浪翻起来，就是要砸了！', { style: 'big' });
    f.ph = 'storm';
    S.cp('storm');
    startStorm(S);
  }
  const STORM_SEC = 30, WARN = 1.0, HITW = .45;
  const SHELTER = new Set(['18,5', '18,6', '7,5', '7,6', '13,4', '13,5']);
  function startStorm(S, grace) {
    const f = S.f; f.hits = 0; f.storm = true;
    WV = { st: 0, t: grace || 1.8, idle: 9, vx: 0 };
    const e = S.ent('wv'); e.s.st = 0; S.place('wv', 20, 3);
    S.norun(true);
    S.goal('抱伞去船尾妈祖龛（一人盯左舷喊停，一人走）');
    S.timer(STORM_SEC, '大浪', stormFail);
  }
  function stormTick(S, dt) {
    if (!WV || S.busy) return;
    const f = S.f, p = S.pl, e = S.ent('wv');
    const cx = Math.round(p.px / TS), cy = Math.round(p.py / TS);
    if (S.moving) { WV.idle = 0; WV.vx = p.dir === 1 ? -1 : p.dir === 2 ? 1 : 0; } else WV.idle += dt;
    WV.t -= dt;
    if (WV.st === 0) {
      if (WV.t > 0) return;
      let c = WV.idle < .35 && WV.vx ? cx + WV.vx * 4 : cx + ((Math.random() * 3) | 0) - 1;
      c = clamp(c, 4, 25);
      S.place('wv', c - 1, 3); e.s.st = 1; WV.st = 1; WV.t = WARN + (f.kind ? .25 : 0); WV.t0 = WV.t;
      const mine = cx >= c - 1 && cx <= c + 1;
      SND.swell(S, mine);
      if (mine && f.kind) S.bubble('atu2', '!', 900);
    } else if (WV.st === 1) {
      if (WV.t > 0) return;
      e.s.st = 2; WV.st = 2; WV.t = HITW; WV.hit = false; SND.crash(S); S.shake(250, 2);
    } else {
      const ex = Math.round(e.px / TS);
      if (!WV.hit && cx >= ex && cx <= ex + 2 && cy >= 3 && cy <= 9 && !SHELTER.has(cx + ',' + cy)) { WV.hit = true; e.s.st = 0; WV.st = 0; WV.t = 1.5; S.run(waveHit); return; }
      if (WV.t <= 0) { e.s.st = 0; WV.st = 0; WV.t = .45 + Math.random() * .5; }
    }
  }
  async function waveHit(S) {
    const f = S.f; f.hits = (f.hits || 0) + 1;
    S.shake(500, 3); S.sfx('splash');
    if (f.hits >= 2) {
      f.storm = false; DEATHS.storm = true; WV = null;
      await S.narr('又一个浪头劈头盖脸地砸下来。\n你的脚底一空——');
      await S.die('海水灌进嘴里，又咸又苦。\n你最后看见的，是那把伞在浪尖上打了个转，被黑水吞了下去。', '黑水沟');
      return;
    }
    await S.narr('浪头砸在你背上，把你拍倒在甲板上。\n你死死把伞压在怀里——伞面湿了一角。');
    S.toast('再被浪打中一次，伞就保不住了');
    await S.think('看着左舷：白浪先在船舷上翻起来，过一下才砸下来。\n看见白浪就停下，或者退开，等它砸完再走。');
  }
  async function stormFail(S) {
    const f = S.f; f.storm = false; DEATHS.storm = true; WV = null;
    S.ent('wv').s.st = 2; SND.crash(S); S.shake(900, 4);
    await S.narr('船老大的吼声被风撕碎了。\n一堵黑墙一样的大浪，从左舷压了过来。');
    await S.die('你没能赶到船尾。\n大浪退下去的时候，甲板上只剩几根断了的缆绳。', '黑水沟');
  }
  async function mazuUse(S) {
    const f = S.f;
    if (f.storm) return stormWin(S);
    return S.narr(S.ent('mazu').s.umb ? '伞柄用红绳绑在龛柱上。神龛前的油灯，一直亮着。' : '船尾的船仔妈神龛。小小的妈祖像，脸被香火熏得发黑。\n龛前一盏油灯，风再大也没灭过。');
  }
  async function stormWin(S) {
    const f = S.f; f.storm = false; WV = null; S.clearTimer(); S.ent('wv').s.st = 0; S.norun(false);
    const m = S.ent('mazu'); m.s.umb = true; m.lit = true;
    await S.narr('你扑到神龛前，用红绳把伞柄一圈一圈绑在龛柱上。');
    SND.bell(S);
    await S.narr('就在这时候，大浪来了。\n整条船被抬起来，悬在半空——');
    S.shake(1000, 4); SND.crash(S);
    await S.wait(1000);
    await S.narr('……又稳稳地落了下去。\n神龛前那盏小油灯晃了晃，没灭。');
    await S.say('船老大', ['妈祖婆保庇！', '……过了！黑水沟过了！']);
    if (f.kind) await S.say('阿土', '阿添，你抱着那把伞，比抱着自己的命还紧。');
    await S.say('她（伞里）', '……多谢。', { style: 'whisper' });
    await S.fade(1, 900);
    await S.card('汕头埠', '三天后　黄昏', '船进了汕头港。\n码头上的人讲话，跟府城的口音有点像，又不太一样。\n\n你问了七八个人。\n「周记樟脑行？大街上，最大那间就是。」');
    f.ph = 'shantou';
    await S.go('zhou', 2, 12, 2);
  }

  /* ================= 汕头周家 ================= */
  async function huojiTalk(S) {
    const f = S.f;
    if (f.ph === 'rage') return S.narr('柜台后面没有人。伙计早就躲起来了。');
    if (f.met) return S.say('伙计', '头家在厅堂里等你。右手边那道门进去。');
    await S.say('伙计', '要买樟脑？明天请早，今天收铺了。');
    await S.say('阿添', '我找周亚思，周头家。我从台湾府来。');
    S.bubble('huoji', '?', 1200);
    await S.say('伙计', '台湾府？……你等等。');
    f.met = true; S.show('zhou');
    S.goal('去厅堂见周亚思（店面右手边那道门）');
  }
  async function zhouTalk(S) {
    const f = S.f;
    if (f.ph !== 'shantou') return;
    S.face('zhou', 'pl');
    await S.say('周亚思', ['台湾府来的？我在台湾的生意，十几年前就收了。', '小兄弟，有什么事？']);
    await S.say('阿添', '我替一个人来讨债。');
    S.sfx('paper');
    await S.narr('你把借据摊开给他看。');
    S.bubble('zhou', '…', 1500);
    await S.narr('他的脸，一下子白了。');
    await S.say('周亚思', ['……这张纸，哪里来的？', '李家那个女人……她早就……']);
    await S.say('周亚思', ['人都没了，一张旧纸，跟谁讨？', '这是二十两银票。你拿去，坐船回去，当没来过。纸留下。']);
    await S.narr('他把银票推到你面前。这一回，是真银子。');
    await S.think('……真银子。\n可她要的，从来不是银子。');
    await S.narr('你没有接。\n你把伞立在厅堂正中，撑开。');
    S.show('umbHall'); SND.bell(S);
    await S.say('阿添', '李昭娘——到了。', { style: 'big' });
    S.amb('none'); S.sfx('whisper');
    S.place('rg', 14, 6, 2); S.ent('rg').alpha = 0;
    await S.alpha('rg', 1, 900);
    await S.scare('face', { spr: '@ltjR', face: 'ltjR', dur: 1.2 });
    await S.say('周亚思', '招……招娘——！', { style: 'big' });
    await S.narr('伞底下站着她。\n头发一根一根飘起来，像泡在水里。厅堂里的烛火全都倒向一边，变成了青的。');
    await S.say('她', '……周、亚、思。', { style: 'whisper' });
    S.place('zhou', 24, 3, 0); S.sfx('close');
    await S.narr('周亚思连滚带爬地逃进了里屋，「砰」地把门闩上。\n里屋传来女人的惊叫，还有小孩的哭声。');
    S.face('rg', 2);
    await S.narr('她转过身，朝里屋飘过去。\n一步。又一步。');
    await S.think('她说过——要是她变了，就敲锣，把周家的人都叫来；把那两张纸，摆到周家祖宗面前。');
    f.ph = 'rage';
    S.goal('敲门口的铜锣叫人，把字据摆上神明桌！（一人盯着她，一人跑）');
    S.cp('rage');
    startRage(S);
  }
  const RPATH = [[14, 6], [15, 6], [16, 6], [17, 6], [18, 6], [18, 7], [19, 7], [20, 7], [21, 7], [22, 7], [23, 7], [23, 6], [23, 5]];
  const RSTEP = 1.05;
  function startRage(S) {
    const f = S.f; f.rage = true; f.ri = 0; RG = -1.2;
    S.place('rg', 14, 6, 2); S.ent('rg').alpha = 1;
    S.ent('hallL').light = { r: 3.4, col: 'rgba(255,200,120,.16)' };
  }
  function rageTick(S, dt) {
    const f = S.f; if (!f.rage || S.busy) return;
    RG += dt; if (RG < RSTEP) return; RG -= RSTEP;
    f.ri++;
    const [x, y] = RPATH[f.ri], [px, py] = RPATH[f.ri - 1], e = S.ent('rg');
    const d = x > px ? 2 : x < px ? 1 : y < py ? 3 : 0;
    if (typeof startMove === 'function') { e.px = px * TS; e.py = py * TS; startMove(e, d, 1.25 / RSTEP); }
    else S.place('rg', x, y, d);
    SND.step(S, f.ri > 7);
    if (f.ri === 6) { const l = S.ent('hallL'); l.light = { r: 3.4, col: 'rgba(110,200,190,.2)', flick: true }; S.toast('厅堂里的烛火变青了……'); }
    if (f.ri === RPATH.length - 4) { S.toast('她快到里屋门口了！'); S.bubble('zq', '!', 1600); S.sfx('cry'); }
    if (f.ri >= RPATH.length - 1) { f.rage = false; S.run(S2 => revenge(S2, false)); }
  }
  async function gongUse(S) {
    const f = S.f, e = S.ent('luo');
    if (f.ph !== 'rage' || !f.rage) return S.narr(f.gong ? '锣声早就停了。' : '门口挂着一面铜锣。\n街坊有事，就敲它；一敲，半条街都听得见。');
    if (f.gong) return S.narr('锣声还在街上回响。');
    e.s.hit = true; SND.gong(S, 3, .45); S.shake(300, 1);
    await S.narr('你抡起锣槌——\n哐——哐——哐——\n锣声滚过半条街。');
    e.s.hit = false; f.gong = true;
    S.place('zz', 13, 7, 3); S.place('lin1', 12, 8, 3); S.place('lin2', 16, 8, 3);
    await S.narr('对门、隔壁的窗子一扇扇亮了。\n街坊举着灯笼涌进厅堂，走在最前头的，是个白胡子老人——周家的族长。');
    return checkBoth(S);
  }
  async function altarUse(S) {
    const f = S.f;
    if (f.ph === 'rage' && f.rage) {
      if (f.ev) return S.narr('婚书和借据，压在周家祖宗的牌位底下。');
      S.take('hunshu'); S.take('jieju'); S.ent('zaltar').s.ev = true; S.sfx('paper');
      await S.narr('你把婚书和借据摊开，压在周家祖宗的牌位底下。\n烛火「呼」地蹿高了一截。');
      f.ev = true;
      return checkBoth(S);
    }
    return S.narr(S.ent('zaltar').s.ev ? '周家的祖宗牌位前，婚书和借据并排摆着。' : '周家的神明桌。一排祖宗牌位，金字擦得锃亮。\n香炉里的香，是今天傍晚新插的。');
  }
  async function checkBoth(S) {
    const f = S.f;
    if (!(f.gong && f.ev)) { S.goal(f.gong ? '把婚书和借据摆上厅堂的神明桌——快！' : '去门口敲铜锣，把周家的人叫来——快！'); return; }
    f.rage = false;
    return confront(S);
  }
  async function confront(S) {
    const f = S.f;
    const e = S.ent('rg'); if (e.mv) { const mv = e.mv; e.mv = null; e.px = mv.tx * TS; e.py = mv.ty * TS; e.x = mv.tx; e.y = mv.ty; }
    S.goal('');
    S.face('rg', 1);
    await S.narr('族长走到神明桌前，看见了那两张纸。\n他把灯笼凑近，一个字一个字地念出声来：');
    await S.say('族长', ['「立借字人周亚思，借到李……」', '……这个字，被手印压住了。']);
    await S.say('阿添', ['昭。日字边的昭。', '她叫李昭娘。台湾府人。'], { style: 'big' });
    S.sfx('chime');
    await S.narr('走廊里，她停住了。');
    await S.narr('满屋子的人都看见了她。没有一个人跑。\n族长把借据举起来，对着她，又念了一遍：\n「借到李昭娘名下，纹银一千二百两正。」');
    await S.say('族长', ['——亚思！出来！', '当着祖宗的面，你自己讲：这字据，是不是你写的？']);
    S.place('zhou', 21, 8, 3); S.place('lin2', 22, 8, 1);
    await S.narr('里屋的门开了。周亚思被街坊架了出来，扑通一声跪在地上。\n他的妻子抱着孩子，缩在门边发抖。');
    S.show('zq'); S.place('zq', 23, 6, 0);
    await S.say('周亚思', ['……是我写的。婚书也是我写的。', '我在唐山早就有妻有子……我骗了她。钱，也是我拿的。']);
    await S.say('族长', ['周家祖宗在上——', '这笔债，连本带利，周家替他还。一半送回台湾府，给这位娘子修坟立祠；', '亚思，你亲自捧着她的牌位过海，在她坟前，跪满七天。']);
    S.cp('confront');
    return confrontChoice(S);
  }
  async function confrontChoice(S) {
    await S.narr('她低头看着跪在地上的那个人。\n头发慢慢地垂下来，不再飘了。');
    await S.say('她', ['……卖粽仔。', '你讲，我该放过他吗？'], { style: 'whisper' });
    const r = await S.ask('满屋子的人都在等。', ['放过他吧。公道，大家都听见了。', '……你想怎么做，就怎么做。'], '阿添');
    if (r === 1) return revenge(S, true);
    return goodEnd(S);
  }
  async function revenge(S, chosen) {
    const f = S.f; f.rage = false;
    if (!chosen) {
      DEATHS.rage = true;
      const e = S.ent('rg'); e.mv = null; S.place('rg', 23, 5, 3);
      await S.narr('她穿过了里屋的门。\n门闩还插着。');
      await S.think(!f.gong && !f.ev ? '锣没有响，字据也还揣在我怀里……没有一个人听见她。' : !f.gong ? '字据摆上去了，可锣没有响——周家没有一个人来听。' : '人都叫来了，可字据还揣在我怀里——没有人念给她听。');
    } else await S.narr('她没有再看你。');
    S.amb('none');
    await S.scare('face', { spr: '@ltjR', face: 'ltjR', dur: 1.3 });
    await S.end({ bad: true, id: 'baochou', title: '冤冤相报', text: '那一夜，周家里屋的灯一直亮到天光。\n街坊只听见周亚思一声一声地喊，喊了一夜，求饶的话翻来覆去——\n一次也没有喊出她的名字。\n\n天亮以后，周记樟脑行的门再也没开过。\n汕头人后来传说，周家那一夜出了大事，一个版本比一个吓人。\n\n你抱着伞回到台湾。伞柄上的牌位，空了。\n林投林里，夜夜还有人出来买粽。\n\n她讨到了命，却没讨回自己的名字。' });
  }
  async function goodEnd(S) {
    const f = S.f;
    S.ent('rg').spr = '@ltj';
    S.ent('hallL').light = { r: 3.4, col: 'rgba(255,200,120,.16)' };
    await S.narr('她轻轻点了一下头。\n伞底下的风停了。烛火一根根立直，又变回了黄的。');
    await S.say('她', '我叫李昭娘。', { style: 'whisper' });
    await S.narr('她说得很慢，像是怕自己再忘了。\n然后她转向你。');
    await S.say('李昭娘', '阿添。多谢你的粽。', { style: 'whisper' });
    await S.alpha('rg', 0, 1500);
    S.hide('umbHall');
    await S.narr('伞柄上的牌位，慢慢地有了一点温度。');
    await S.fade(1, 1200);
    const extra = [];
    if (S.has('silver')) extra.push('那锭银子，你在祠前烧了。火苗一舔，它就卷了起来——是一叠银纸。');
    else if (f.silverBack) extra.push('后来有人在林投林那棵老树底下，挖出一只空嫁妆箱。箱底压着一叠银纸，折成元宝的模样。');
    if (f.kind) extra.push('阿土留在金顺发上当了水手。每回船进安平港，他都先来祠前站一站。');
    if (f.yuClue) extra.push('阿玉初一十五都来上香。她说，阿嬷要是看见牌位上那个「昭」字，会高兴的。');
    else if (f.yuBad) extra.push('那个戴孝的姑娘，再也没来买过你的粽。你一直没机会跟她说一声对不起。');
    if (!f.kind) extra.push('后来你在安平港又见过那个罗汉脚一回。他没认出你，你也没叫他。');
    if (f.took) extra.push('阿爸后来常说：你把她的钱收进过竹筒，她一回都没跟你计较。');
    await S.card('后来', '', '周家把债连本带利还清了。\n第二年春天，周亚思捧着她的牌位过海，在东门外林投林边那座新坟前，跪了七天。\n\n府城人在坟边给她起了一座小祠。\n大家还是叫它林投姐庙——可庙里那块牌位上，刻的是：李氏昭娘。' + (extra.length ? '\n\n' + extra.join('\n') : ''));
    await S.end({ id: 'miao', title: '第十五夜　完', text: '粽担还是你挑。阿爸的咳嗽，开春就好了。\n\n每年端午，你都会在祠前摆一粒肉粽。\n第二天再去看，粽子还在，粽叶还青。\n\n她不再出来买粽了。\n可三更天路过东门外的人说，林投林里，偶尔还有个女人在哼歌仔——\n调子很轻，不像在哭。' });
  }

  /* ================= 地图 ================= */
  function townRows() {
    const g = G(36, 16, '#');
    F(g, 1, 2, 10, 7, 'j');            // 阿添家（红砖地）
    g[8][5] = 'j';                     // 家门
    F(g, 0, 9, 17, 12, 'k');           // 城里的石板街 + 东门门洞
    F(g, 18, 0, 35, 15, 'Y');          // 东门外：林投
    F(g, 18, 9, 35, 12, 'd');          // 土路
    F(g, 18, 8, 22, 8, '"'); F(g, 29, 8, 34, 8, '"'); F(g, 18, 13, 35, 13, '"'); F(g, 19, 14, 21, 14, '"');
    F(g, 23, 7, 28, 8, 'd');           // 摊位空地
    return ROWS(g);
  }
  const say = t => S => S.narr(t);
  const MAP_TOWN = {
    amb: 'night', dark: .55, plr: 3, wall: 'brick', floor: 'stone',
    legend: { j: 'redbrick', Y: 'lintou' }, tileOpts: { grassC: '#24331f' },
    rows: townRows(),
    ents: [
      // 家
      { id: 'zao', x: 2, y: 2, w: 2, spr: 'zao', on: zaoUse },
      { id: 'altarH', x: 5, y: 2, w: 2, spr: 'shenzhuo', on: altarHome },
      { x: 4, y: 1, spr: 'window', on: say('窗外是隔壁的屋檐。檐角挂着一串晒干的粽叶。') },
      { id: 'umbw', x: 8, y: 1, spr: 'umbw', on: umbUse },
      { id: 'bed', x: 9, y: 2, h: 2, spr: 'sickbed', on: fatherTalk },
      { x: 1, y: 4, spr: 'barrel', col: '#5a4a3a', on: say('水缸。水面上浮着一片粽叶，映着屋顶的黑。') },
      { x: 5, y: 5, w: 2, spr: 'table', col: '#6a4a2e', on: say('饭桌。桌角压着阿爸记账的本子，字歪歪扭扭的，最后一页停在入秋那天。') },
      { id: 'zhutong', x: 6, y: 5, spr: 'zhutong', z: 1, oy: -6, solid: false, on: countMoney },
      { id: 'shelf', x: 1, y: 6, spr: 'shelf', async on(S) { if (S.once('gz')) await S.narr('架子上摆着粽叶、咸草绳，还有阿爸床头那本翻烂了的歌仔册。'); await S.note('gezai'); } },
      { id: 'dan', x: 3, y: 6, spr: 'dan', on: S => S.f.ph === 'n1prep' ? zaoUse(S) : S.narr('粽担靠在墙角，竹篮里还剩几片没用完的粽叶。') },
      { x: 10, y: 6, spr: 'basket', on: say('一篮泡着的糯米。阿爸说，米要前一晚泡，粽子才会糯。') },
      { id: 'hlamp', x: 6, y: 4, spr: 'invisible', light: { r: 3.2, col: 'rgba(255,190,110,.12)' } },
      { id: 'dl', x: 4, y: 8, spr: 'denglong', off: false, light: { r: 2.4, col: 'rgba(255,120,60,.16)', dy: 14 }, on: say('门口的红灯笼，写着一个「陈」字。') },
      // 城里
      { id: 'notice', x: 13, y: 8, spr: 'poster', col: '#d8ccb0', on: say('墙上贴着告示：「安平港　金顺发　往汕头　逢五开船」。\n底下有人用炭笔添了一句：船上缺水手。') },
      { x: 9, y: 8, spr: 'denglong', off: true, on: say('隔壁杂货铺的灯笼，没点。') },
      { id: 'gate', x: 16, y: 8, w: 2, spr: 'gatetower', solid: false },
      { id: 'guatan', x: 13, y: 12, spr: 'guatan', on: xianTalk },
      { id: 'xian', x: 14, y: 12, spr: '@xian', dir: 3, on: xianTalk },
      // 东门外
      { id: 'tan', x: 25, y: 9, w: 2, spr: 'tan', s: { left: 0 }, on: tanUse },
      { id: 'lp', x: 27, y: 8, spr: 'lampP', off: true, light: { r: 3.8, col: 'rgba(255,150,70,.22)', dx: 13, dy: -6 }, on: say('灯笼杆。阿爸说，灯笼挂高一点，客人远远就看得见。') },
      { id: 'bogong', x: 20, y: 13, spr: 'bogong', on: bogongUse },
      ...[9, 10, 11, 12].map(y => ({ x: 35, y, spr: 'invisible', touch: toGrove })),
      // 客人
      { id: 'c_geng', x: 18, y: 10, spr: '@geng', hidden: true, solid: false, light: { r: 1.8, col: 'rgba(255,170,80,.14)' } },
      { id: 'c_atu', x: 18, y: 11, spr: '@atu', hidden: true, solid: false },
      { id: 'c_ltj', x: 33, y: 10, spr: '@ltj', hidden: true, solid: false },
      { id: 'c_yu', x: 33, y: 10, spr: '@yu', hidden: true, solid: false },
      { id: 'c_wang', x: 18, y: 11, spr: '@wang', hidden: true, solid: false, light: { r: 1.6, col: 'rgba(255,170,80,.12)' } },
      { id: 'c_hat', x: 18, y: 10, spr: '@ltjHat', hidden: true, solid: false }
    ],
    async enter(S, first) {
      const f = S.f;
      if (first && !f.ph) {
        f.ph = 'n1prep'; townLight(S);
        await S.narr('天快黑了。灶上的蒸笼噗噗地冒着白气，一屋子粽叶香。');
        await S.say('阿爸', ['……阿添。', '粽子蒸好了吧？咳、咳……'], { style: 'whisper' });
        await fatherN1(S);
        S.goal('从灶上的蒸笼里提出肉粽，挂上粽担');
        S.cp('start');
      }
    }
  };

  function groveRows() {
    const g = G(30, 18, 'Y');
    const L = (x0, y0, x1, y1) => F(g, Math.min(x0, x1), Math.min(y0, y1), Math.max(x0, x1), Math.max(y0, y1), 'd');
    L(0, 10, 7, 10); L(7, 4, 7, 15); L(7, 4, 15, 4); L(15, 2, 15, 8); L(15, 8, 21, 8); L(21, 8, 21, 13); L(22, 8, 27, 8);
    F(g, 22, 11, 27, 15, 'd');
    for (const [x, y] of [[3, 10], [7, 12], [18, 8], [26, 15], [22, 15]]) g[y][x] = '"';
    return ROWS(g);
  }
  async function groveExit(S) {
    const f = S.f;
    if (f.ph === 'n2g') return S.go('town', 34, 10, 1);
    return S.narr('来时的路。');
  }
  const MAP_GROVE = {
    amb: 'wind', dark: .84, plr: 2.8, floor: 'dirt', fog: .2, darkC: '#040605',
    legend: { Y: 'lintou' }, tileOpts: { grassC: '#1c2a1a' },
    rows: groveRows(),
    ents: [
      { id: 'gexit', x: 0, y: 10, spr: 'invisible', touch: groveExit },
      { id: 'z1', x: 7, y: 9, spr: 'zong', solid: false, light: { r: .9, col: 'rgba(160,200,120,.12)' }, on: say('一粒肉粽，摆在岔路口往北的那一边。粽叶还青，绳结是阿爸教你的打法——\n是你昨晚卖给她的那一粒。') },
      { id: 'z2', x: 15, y: 5, spr: 'zong', solid: false, light: { r: .9, col: 'rgba(160,200,120,.1)' }, on: say('又一粒，摆在往南的岔路上。粽叶发黄了，绳结不是你打的——\n是阿爸的手法。不知道是哪一年卖给她的。') },
      { id: 'z3', x: 21, y: 9, spr: 'zong', solid: false, s: { old: true }, light: { r: .9, col: 'rgba(160,200,120,.08)' }, on: say('这一粒已经干瘪了，粽叶发黑，绑的还是老式的咸草绳。\n好多年前的了。它指着往南的路。') },
      { id: 'z4', x: 25, y: 12, spr: 'zong', solid: false, on: say('树根底下这一粒，是你今晚卖给她的。粽叶还温着，一口都没动。\n——《府城杂记》里写的，一个字都不差。') },
      { x: 7, y: 15, spr: 'oldlamp', on: say('一盏破灯笼，竹骨都散了。\n不知道哪一年，哪个卖粽的追到这里，把灯笼一扔就跑了。\n——这条路是死的。') },
      { x: 15, y: 2, spr: 'rotzong', on: say('一堆粽子，黑的、霉的，层层叠叠堆在一起，粽叶烂成了泥。\n这些年她买走的粽，一粒都没吃过。全在这里。\n——前面没路了。') },
      { x: 27, y: 8, spr: 'shoe', on: say('一只绣花鞋。红缎面，鞋尖绣着一朵小小的黄花。\n只有一只。\n——前面没路了。') },
      { x: 11, y: 4, spr: 'fruit', solid: false, on: say('一颗掉在地上的林投果，像菠萝。闻着香，不能吃。') },
      { id: 'tree', x: 24, y: 11, w: 2, spr: 'bigtree', light: { r: 3.4, col: 'rgba(150,190,200,.1)', dy: -8 }, on: treeUse },
      { id: 'chest', x: 26, y: 13, spr: 'chest', on: chestUse },
      { id: 'g_ltj', x: 24, y: 12, spr: '@ltj', dir: 3, hidden: true, solid: false, on: say('她就站在那里。头发遮着脸。') },
      { id: 'g_umb', x: 23, y: 12, spr: 'umbO', hidden: true, solid: false },
      { id: 'glamp', x: 0, y: 0, spr: 'invisible', light: { r: 2.8, col: 'rgba(255,150,70,.12)', pl: true } }
    ],
    step(S, x, y) {
      const f = S.f;
      if (f.ph === 'n2g' && x >= 23 && y >= 11 && S.once('meet')) return groveMeet(S);
    },
    async enter(S, first) {
      const f = S.f;
      if (f.ph === 'n2g' && S.once('g1')) {
        await S.narr('林投叶子边上的倒刺，勾住了你的袖子。\n路比你想的窄。灯笼只照得见脚下三步。');
        await S.think('她就是进了这里……');
        S.goal('顺着地上的肉粽往林子里走');
      }
      if (f.ph === 'n3' && S.once('g3')) {
        await S.narr('这一回，你认得路。\n地上那几粒肉粽，一粒一粒，都还在原来的地方。');
        if (S.has('silver')) await S.think('怀里那锭银子，一路沉甸甸地硌着胸口。\n树根底下那只箱子……还在。');
        S.goal('在她的林投树下撑开伞，叫她的名字');
      }
    }
  };

  function shipRows() {
    const g = G(30, 14, '~');
    F(g, 2, 2, 27, 10, 'Q'); F(g, 3, 3, 26, 9, 'W');
    F(g, 27, 4, 28, 8, 'Q'); F(g, 27, 5, 27, 7, 'W');
    F(g, 0, 11, 29, 13, 'l');          // 码头（开船后改成海）
    g[10][14] = 'W';                   // 跳板
    return ROWS(g);
  }
  const crate = (x, y, col) => ({ x, y, spr: 'crate2', col, on: say('捆得死死的货箱，一股樟脑和咸鱼混在一起的味道。') });
  const MAP_SHIP = {
    amb: 'river', dark: .5, plr: 3, floor: 'darkwood', rain: true, shimmer: true,
    legend: { Q: 'gunwale' },
    rows: shipRows(),
    ents: [
      { id: 'laoda', x: 14, y: 10, spr: '@laoda', dir: 0, on: laodaTalk },
      { id: 'atu2', x: 16, y: 8, spr: '@atu', dir: 0, hidden: true, on: S => S.say('阿土', S.f.storm ? '看左舷！白浪起来就停！' : '到了汕头，我带你去找那间樟脑行。') },
      crate(20, 3, '#7a5a3a'), crate(20, 4, '#6a4a2e'), crate(20, 5, '#7a5a3a'), crate(20, 6, '#6a4a2e'),
      crate(15, 6, '#6a4a2e'), crate(15, 7, '#7a5a3a'), crate(15, 8, '#6a4a2e'), crate(15, 9, '#7a5a3a'),
      crate(10, 3, '#7a5a3a'), crate(10, 4, '#6a4a2e'), crate(10, 5, '#7a5a3a'), crate(10, 6, '#6a4a2e'),
      { id: 'cask', x: 13, y: 3, spr: 'barrel', col: '#4a3a2a', on: say('装淡水的木桶，用麻绳绑在船舷上。\n躲在它背后，浪头打不着。') },
      { id: 'mast1', x: 18, y: 4, spr: 'mast', on: say('主桅。帆绳绷得吱吱响。\n贴着桅杆背后站，浪头会被它挡开。') },
      { id: 'mast2', x: 7, y: 4, spr: 'mast', on: say('后桅。桅杆上钉着一道黄符，被雨打得透湿。') },
      { id: 'hatch', x: 23, y: 5, spr: 'hatch2', decal: true, on: say('舱口。底下的水已经漫过脚踝了。') },
      { id: 'mazu', x: 3, y: 5, spr: 'mazu', on: mazuUse },
      { x: 3, y: 8, spr: 'tiller', on: say('舵杆。船老大用整个身子压着它。') },
      { id: 'wv', x: 20, y: 3, w: 3, h: 7, spr: 'wave', z: 1, solid: false, hidden: true },
      { x: 5, y: 6, spr: 'invisible', light: { r: 3, col: 'rgba(255,190,110,.14)' } },
      { x: 22, y: 7, spr: 'invisible', light: { r: 2.6, col: 'rgba(255,190,110,.1)' } },
      { id: 'dk1', x: 10, y: 12, spr: 'crate', on: say('码头上堆着要装船的货。') },
      { id: 'dk2', x: 11, y: 12, spr: 'sack', on: say('一袋糖。台湾的糖，要运去唐山卖。') },
      { id: 'dk3', x: 19, y: 11, spr: 'sign', col: '#8a2a1a', on: say('木牌：「金顺发　往汕头」。') }
    ],
    async enter(S, first) {
      if (first) {
        await S.narr('海风里一股咸腥味。\n伞抱在怀里，伞柄上的牌位贴着你的胸口，凉丝丝的。');
        await S.say('阿添', '……李昭娘。上船了。', { style: 'whisper' });
        S.goal('跟船老大讲船钱');
        S.cp('dock');
      }
    }
  };

  function zhouRows() {
    const g = G(28, 14, '#');
    F(g, 1, 2, 9, 9, 'w'); g[10][5] = 'w';      // 店面 + 店门
    g[6][10] = 'j';                              // 店面 → 厅堂
    F(g, 11, 2, 18, 9, 'j');                     // 厅堂
    g[7][19] = 'k'; F(g, 20, 6, 26, 9, 'k');     // 走廊
    F(g, 21, 2, 26, 4, 'w'); g[5][23] = 'w';     // 里屋 + 门
    F(g, 0, 11, 27, 13, 'k');                    // 街
    return ROWS(g);
  }
  const MAP_ZHOU = {
    amb: 'night', dark: .62, plr: 3, wall: 'wood', floor: 'stone',
    legend: { j: 'redbrick' }, tileOpts: { woodC: '#5a3e28' },
    rows: zhouRows(),
    ents: [
      // 店面
      ...[3, 4, 5].map(x => ({ x, y: 4, spr: 'counter', on: huojiTalk })),
      { id: 'huoji', x: 4, y: 3, spr: '@huoji', dir: 0, on: huojiTalk },
      ...[[1, 7], [2, 7], [1, 8], [8, 2], [8, 3]].map(([x, y]) => ({ x, y, spr: 'crate', col: '#8a6a3a', on: say('一箱箱樟脑，封条上盖着「周记」的朱印。\n冲鼻子的香味，跟她那只嫁妆箱里的一模一样。') })),
      { x: 2, y: 1, spr: 'scroll', on: say('墙上一幅字：「生意兴隆通四海」。') },
      { id: 'zsign', x: 4, y: 10, w: 3, spr: 'zsign', solid: false },
      { x: 3, y: 10, spr: 'denglong', light: { r: 2.6, col: 'rgba(255,120,60,.18)', dy: 14 } },
      { x: 7, y: 10, spr: 'denglong', light: { r: 2.6, col: 'rgba(255,120,60,.18)', dy: 14 } },
      { id: 'luo', x: 8, y: 11, spr: 'luo', on: gongUse },
      { x: 6, y: 5, spr: 'invisible', light: { r: 3, col: 'rgba(255,200,130,.1)' } },
      // 厅堂
      { id: 'zaltar', x: 14, y: 2, w: 2, spr: 'zaltar', on: altarUse },
      { x: 12, y: 1, spr: 'scroll', on: say('「祖德流芳」。') }, { x: 17, y: 1, spr: 'scroll', on: say('「家声远振」。') },
      { x: 12, y: 4, spr: 'chair', on: say('太师椅，扶手上的漆磨得发亮。') }, { x: 17, y: 4, spr: 'chair', on: say('太师椅。椅背上搭着一件绸马褂。') },
      { id: 'hallL', x: 15, y: 3, spr: 'invisible', light: { r: 3.4, col: 'rgba(255,200,120,.16)' } },
      { id: 'zhou', x: 15, y: 5, spr: '@zhou', dir: 0, hidden: true, on: zhouTalk },
      { id: 'umbHall', x: 14, y: 6, spr: 'umbO', hidden: true, solid: false },
      { id: 'rg', x: 14, y: 6, spr: '@ltjR', dir: 2, hidden: true, solid: false, light: { r: 2, col: 'rgba(120,160,150,.16)' } },
      { id: 'zz', x: 13, y: 7, spr: '@zz', dir: 3, hidden: true, light: { r: 2, col: 'rgba(255,170,80,.14)' } },
      { id: 'lin1', x: 12, y: 8, spr: '@lin', dir: 3, hidden: true },
      { id: 'lin2', x: 16, y: 8, spr: '@lin', dir: 3, hidden: true },
      // 走廊、里屋
      { id: 'idoor', x: 23, y: 5, spr: 'idoor', locked: true, on: say('门从里面闩死了。\n里头有女人压着嗓子在哭，还有小孩一声一声地叫阿爸。') },
      { x: 25, y: 6, spr: 'plant', on: say('一盆兰花，叶子蔫了。') },
      { id: 'zq', x: 22, y: 3, spr: '@zhouqi', dir: 0, on: say('周亚思的妻子，抱着孩子。') },
      { x: 25, y: 2, h: 2, spr: 'bed', col: '#7a4a5a' },
      { x: 23, y: 3, spr: 'invisible', light: { r: 2.2, col: 'rgba(255,190,110,.1)' } },
      { x: 22, y: 8, spr: 'invisible', light: { r: 2, col: 'rgba(255,190,110,.08)' } }
    ],
    async enter(S, first) {
      if (first) {
        await S.narr('周记樟脑行的招牌是新漆的，金字在灯笼底下发亮。\n门口堆着一箱箱樟脑，满街都是那股冲鼻子的香味。');
        await S.say('阿添', '……李昭娘。到了。', { style: 'whisper' });
        S.goal('进周记樟脑行，找周亚思');
        S.cp('zhou');
      }
    }
  };

  /* ================= 章节 ================= */
  defChapter({
    id: 'lintoujie', n: 15, title: '林投姐', sub: '三更天，林投林边有个女人来买肉粽。她给的钱，天一亮就变成银纸。', origin: '台湾民间传说（清代台南）', color: '#22301e',
    icon: '@ltjIcon', amb: 'night', floor: 'stone', wall: 'brick', dark: .8, plr: 3, darkC: '#05060a',
    people: PEOPLE_L, tiles: TILES_L, sprites: SPR_L, items: ITEMS_L, notes: NOTES_L, faces: FACES_L,
    endings: { miao: '林投姐庙', yinzhi: '阴间的头家', baochou: '冤冤相报' },
    legend: '「林投姐」是台湾流传最广的鬼故事之一，和「周成过台湾」「吕祖庙烧金」一起，在二十世纪中叶的通俗读物里被并称为「清代台湾三大奇案」。故事大多放在清朝光绪年间的台南府城：寡妇李昭娘（也有写作「李招娘」的），丈夫早逝，留下一点家产和几个孩子；从唐山来的商人周亚思（也有写作「周阿司」的）取得了她的信任，以合伙做樟脑生意为名，把她的积蓄连同她借来的钱一起带过海，从此音讯全无。债主上门，她走投无路，据说在一棵林投树下结束了生命；孩子们的结局，各个版本说法不一，都很悲惨。\n\n此后，传说夜里有个披头散发的女人到林投林边，向卖肉粽的小贩买粽，给的钱到天亮就变成了银纸（烧给亡者的纸钱）。在常见的版本里，一位算命先生（有的版本叫周天道）听说了她的冤屈，替她刻了神主牌，用一把雨伞遮着，带她上船渡海到汕头（也有说是泉州或「唐山」某地）；周亚思见到她以后发了疯，伤害了自己后来娶的妻儿，最后自己也死了——这是一个典型的「冤魂复仇」结局。阴魂怕日光、难以渡海，要靠牌位依附、用伞遮蔽，这类说法在闽台民间信仰里很常见。\n\n日治时期的风俗志和报刊上已经记有这个故事；1950 年代它被拍成电影、编成歌仔戏，后来又不断被改编。据说府城居民曾为她立过一座小祠，一说在今天台南民族路一带，二十世纪初市区改建时已经拆除，如今既不见林投树，也没有遗迹。也有人把「买肉粽」和彰化一带为横死者送煞的「送肉粽」习俗联系在一起，但两者是否真有关联，并无定论。\n\n（本章的阿添与阿爸、更夫老蔡、罗汉脚阿土、戴孝的阿玉、产婆王婶、铁口仙、金顺发的船老大、周家的伙计和族长，以及《府城杂记》、歌仔册的唱词、婚书和借据的文字、「掂照弹」验钱和「认钱莫认人」、黑水沟的浪、在周家祖宗面前念出她的名字讨回公道的结局，都是游戏虚构。林投姐和周亚思是传说中的人物；伞遮神主牌渡海、钱变银纸、复仇的结局，是流传版本里的情节。「六死三留一回头」是清代渡台的俗谚。）',
    start: { map: 'town', x: 8, y: 4, dir: 2 },
    resume: {
      storm: async S => {
        WV = null; S.ent('wv').s.st = 0; S.ent('wv').hidden = true;
        startStorm(S, DEATHS.storm ? 2.6 : 1.8);
        if (DEATHS.storm) await S.think('看准左舷：白浪一翻起来，就别往那几列走——停下或者退开，等它砸完再过去。\n桅杆和水桶背后，浪打不着。');
      },
      rage: async S => {
        startRage(S);
        S.goal('敲门口的铜锣叫人，把字据摆上神明桌！（一人盯着她，一人跑）');
        if (DEATHS.rage) await S.think('她走得不快，可我不能犹豫。\n先冲出店门敲锣，再回厅堂把字据摆上神明桌。');
      },
      confront: async S => confrontChoice(S)
    },
    async intro(S) {
      WV = null; RG = 0; HUMT = 0; DEATHS = {};
      await S.card('第十五夜　林投姐', '清·光绪年间　台湾府城　东门外', '府城东门外，有一大片林投林。\n林投叶子边上长满倒刺，结的果子像菠萝，不能吃。\n\n你叫阿添，十七岁。\n阿爸挑了二十年粽担，入秋以后咳得下不了床。\n今晚起，东门外那个粽摊，归你了。');
    },
    tick(S, dt) {
      const f = S.f;
      if (S.map === 'ship' && f.storm) stormTick(S, dt);
      else if (S.map === 'zhou' && f.rage) rageTick(S, dt);
      else if (S.map === 'grove' && f.ph === 'n2g' && !S.busy) { HUMT += dt; if (HUMT > 9) { HUMT = 0; SND.hum(S); } }
    },
    maps: { town: MAP_TOWN, grove: MAP_GROVE, ship: MAP_SHIP, zhou: MAP_ZHOU }
  });
})();
