/* ================= 第二十二夜 · 蔷花红莲 ================= */
(() => {
  /* ---------- 地图小工具 ---------- */
  function grid(w, h, c) {
    const g = [...Array(h)].map(() => Array(w).fill(c));
    const api = {
      set(x, y, ch) { if (y >= 0 && y < h && x >= 0 && x < w) g[y][x] = ch; return api; },
      rect(x0, y0, x1, y1, ch) { for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) api.set(x, y, ch); return api; },
      get(x, y) { return g[y][x]; },
      rows() { return g.map(r => r.join('')); }
    };
    return api;
  }
  const N = t => S => S.narr(t);
  const cyc = (who, lines, k) => async S => { const f = S.f; const i = f[k] = ((f[k] ?? -1) + 1) % lines.length; await S.say(who, lines[i]); };

  /* ---------- 合成音（S.tone，双方都听得到） ---------- */
  function drum(S, n, vol = .3) { for (let i = 0; i < n; i++) { S.tone('sine', 120, 52, .45, vol, i * .75, 380); S.tone('triangle', 75, 40, .5, vol * .6, i * .75, 260); } }   // 更鼓
  function clapper(S, n, vol = .07) { for (let i = 0; i < n; i++) S.tone('square', 1300, 900, .035, vol, i * .32, 2600); }   // 打更的梆子
  function gavel(S) { S.tone('square', 700, 240, .05, .22, 0, 1800); S.tone('sine', 150, 60, .2, .32, 0, 600); }   // 惊堂木
  function drip(S, vol = .05, d = 0) { S.tone('sine', 1500, 620, .07, vol, d, 3200); }
  function weep(S, vol = .03) { S.tone('sine', 560, 515, .9, vol, 0, 1300); S.tone('sine', 530, 470, 1.2, vol * .85, .95, 1300); }
  function chirp(S, vol = .05) { S.tone('sine', 2300, 3100, .07, vol, 0); S.tone('sine', 2600, 3300, .06, vol, .12); }
  function growl(S, vol = .08) { S.tone('sawtooth', 80, 52, 1.1, vol, 0, 260); }
  function crowd(S) { for (let i = 0; i < 7; i++) S.tone('triangle', 180 + Math.random() * 120, 150 + Math.random() * 80, .25, .025, i * .09, 700); }

  /* ---------- 惊吓大头像 ---------- */
  const FACES = {
    /* 红莲：湿发贴在脸上，一只眼从发缝里看出来，发紫的嘴唇慢慢张开，水一直往下淌 */
    hongF(R, a, t) {
      const HR = '#07080c', SK = '#d6dde2', SK2 = '#a9b4bc', WT = 'rgba(160,200,230,.85)';
      R(0, 0, 32, 32, '#04060a');
      R(6, 2, 20, 6, HR); R(4, 5, 5, 27, HR); R(23, 5, 5, 27, HR); R(2, 18, 4, 14, HR); R(26, 16, 4, 16, HR);
      R(9, 7, 14, 20, SK); R(9, 7, 1, 20, SK2); R(22, 7, 1, 20, SK2); R(10, 26, 12, 2, SK2); R(12, 28, 8, 1, SK2);
      R(9, 7, 14, 3, HR); R(11, 10, 2, 9, HR); R(18, 10, 3, 13, HR); R(20, 9, 2, 17, HR); R(15, 10, 1, 4, HR);
      const k = Math.min(1, a * 1.5), o = k > .5 ? 3 : 2;
      R(13, 14, 5, o, '#000'); R(12, 14, 1, o, '#6a2a34'); R(18, 14, 1, o, '#6a2a34'); R(13, 13, 5, 1, '#8a3a44'); R(15, 14 + (o > 2 ? 1 : 0), 1, 1, '#f0f4f8');
      R(19, 16, 1, 2, '#000'); R(19, 16, 1, 1, '#e8eef4');
      R(13, 17, 1, 7, WT);
      if (k < .6) R(14, 23, 5, 1, '#5a6478'); else { R(14, 22, 5, 3, '#3a3448'); R(15, 23, 3, 1, '#0a0810'); }
      R(8, 28, 16, 4, '#eceee8'); R(15, 28, 2, 4, '#c8ccc4'); R(12, 28, 1, 4, '#ffffff'); R(19, 28, 1, 4, '#ffffff');
      for (let i = 0; i < 6; i++) { const x = [5, 8, 24, 27, 10, 21][i], y = ((t * 18 + i * 7) % 26) + 4; R(x, y | 0, 1, 2, WT); }
    },
    /* 蔷花：头发里缠着水草，闭着的眼睛慢慢睁开，嘴角往下淌黑泥水 */
    jangF(R, a, t) {
      const HR = '#090a0c', SK = '#cfd8d6', SK2 = '#9aa8a6', WD = '#2e4a2c', WT = 'rgba(140,180,170,.8)';
      R(0, 0, 32, 32, '#030605');
      R(5, 2, 22, 7, HR); R(3, 6, 6, 26, HR); R(23, 6, 6, 26, HR);
      R(9, 8, 14, 19, SK); R(9, 8, 1, 19, SK2); R(22, 8, 1, 19, SK2); R(11, 26, 10, 2, SK2);
      R(8, 8, 16, 3, HR); R(10, 11, 1, 6, HR); R(21, 11, 1, 8, HR);
      R(4, 9, 2, 14, WD); R(6, 4, 1, 9, WD); R(25, 7, 2, 16, WD); R(23, 3, 1, 8, '#3e5e38'); R(12, 7, 6, 1, WD); R(7, 22, 3, 1, '#3e5e38');
      const k = Math.min(1, a * 1.4);
      if (k < .5) { R(12, 15, 4, 1, '#2a2e30'); R(17, 15, 4, 1, '#2a2e30'); }
      else { R(12, 14, 4, 3, '#000'); R(17, 14, 4, 3, '#000'); R(13, 15, 1, 1, '#e8f0ec'); R(19, 15, 1, 1, '#e8f0ec'); R(12, 13, 4, 1, '#6a3a3a'); R(17, 13, 4, 1, '#6a3a3a'); }
      R(15, 18, 2, 3, SK2);
      R(13, 23, 6, 1, '#4a5a6a'); R(14, 24, 1, 3 + Math.round(k * 3), '#2a2a20'); R(18, 24, 1, 2 + Math.round(k * 2), '#2a2a20');
      R(8, 28, 16, 4, '#e2e6e0'); R(15, 28, 2, 4, '#c0c6be');
      for (let i = 0; i < 5; i++) { const x = [6, 26, 9, 22, 16][i], y = ((t * 15 + i * 9) % 24) + 6; R(x, y | 0, 1, 2, WT); }
    }
  };

  /* ---------- 人物 ---------- */
  const gat = (c = 'rgba(16,14,18,.9)') => (g, d, fr, G, R) => { R(0, G.hT + 1, 16, 1, c); R(1, G.hT, 14, 1, 'rgba(40,36,44,.45)'); R(4, G.hT - 4, 8, 5, c); R(5, G.hT - 4, 2, 1, 'rgba(140,140,150,.5)'); if (d === 0) { R(4, G.hT + 2, 1, 6, '#2a2020'); R(11, G.hT + 2, 1, 6, '#2a2020'); } };
  const samo = (g, d, fr, G, R) => { R(4, G.hT - 2, 8, 4, '#121016'); R(5, G.hT - 4, 6, 2, '#121016'); R(6, G.hT - 4, 2, 1, '#3a3640'); if (d === 1) R(11, G.hT - 1, 4, 2, '#121016'); else { R(0, G.hT - 1, 4, 2, '#121016'); R(12, G.hT - 1, 4, 2, '#121016'); } };
  const wetX = (g, d, fr, G, R) => { R(3, G.tB, 1, 3, 'rgba(150,190,220,.75)'); R(12, G.tT + 4, 1, 2, 'rgba(150,190,220,.75)'); R(8, G.tB + 2, 1, 2, 'rgba(150,190,220,.6)'); R(5, G.hT + 8, 1, 2, 'rgba(150,190,220,.6)'); };
  const PEOPLE = {
    me: { key: 'jh-me', skin: '#e8c4a0', hair: '#1a1414', hs: 'short', top: '#e8e4da', top2: '#cfc8b8', bottom: '#e0dcd0', robe: true, shoes: '#2a2a2a', extra: gat() },
    meO: { key: 'jh-meO', skin: '#e8c4a0', hair: '#1a1414', hs: 'short', top: '#2a4a66', top2: '#d8d0c0', bottom: '#24405a', robe: true, shoes: '#1a1a1a',
      extra(g, d, fr, G, R) { samo(g, d, fr, G, R); R(3, G.tT + 6, 10, 1, '#c8a85a'); if (d === 0) { R(6, G.tT + 2, 4, 3, '#c8a85a'); R(7, G.tT + 3, 2, 1, '#e8d8a0'); } } },
    kim: { key: 'jh-kim', skin: '#d8b08a', hair: '#3a3430', hs: 'short', top: '#6a5a48', top2: '#d0c8b8', bottom: '#4a4038', robe: true, shoes: '#2a2a2a', extra: gat('rgba(20,18,22,.85)') },
    bok: { key: 'jh-bok', skin: '#f0c8a0', hair: '#1a1414', hs: 'short', top: '#5a7aa8', top2: '#e8e4da', bottom: '#3a3a4a', child: true, shoes: '#3a2a2a',
      extra(g, d, fr, G, R) { if (d === 3) { R(7, G.hT + 3, 2, 9, '#1a1414'); R(7, G.hT + 12, 2, 2, '#b8303a'); } else if (d === 1) R(10, G.hT + 3, 2, 8, '#1a1414'); } },
    heo: { key: 'jh-heo', skin: '#e2bc9c', hair: '#1a1414', hs: 'bun', top: '#7a4a5a', top2: '#ece4d8', bottom: '#3a2a3a', robe: true, shoes: '#2a2020',
      extra(g, d, fr, G, R) { R(6, G.hT - 2, 4, 2, '#1a1414'); R(4, G.hT - 2, 8, 1, '#c8a85a'); } },
    bae: { key: 'jh-bae', skin: '#d8b090', hair: '#a8a4a0', hs: 'short', top: '#e4e0d6', top2: '#c8c0b0', bottom: '#d8d4c8', robe: true, shoes: '#3a3a3a',
      extra(g, d, fr, G, R) { gat()(g, d, fr, G, R); if (d === 0) R(6, G.hT + 7, 4, 3, '#b8b4ae'); if (d === 1) R(3, G.hT + 7, 3, 3, '#b8b4ae'); } },
    jang: { key: 'jh-jang', skin: '#d4a07a', hair: '#1a1414', hs: 'messy', top: '#6a5a44', top2: '#8a7a64', bottom: '#5a5040', shoes: '#3a2a1a',
      extra(g, d, fr, G, R) { if (d !== 3) R(d === 1 ? 4 : 11, G.hT + 3, 2, 3, '#f0ece4'); R(4, G.hT + 2, 8, 1, '#f0ece4'); if (d === 0) { R(2, G.tT + 1, 12, 1, '#e8e4dc'); R(2, G.tT + 2, 3, 4, '#e8e4dc'); } } },
    yumo: { key: 'jh-yumo', skin: '#d8b49a', hair: '#cfcac4', hs: 'bun', top: '#ece8de', top2: '#d0c8b8', bottom: '#d8d2c6', robe: true, shoes: '#3a3030' },
    steward: { key: 'jh-stw', skin: '#e0b896', hair: '#2a2020', hs: 'short', top: '#5a4a3a', top2: '#c8b8a0', bottom: '#4a3a2e', robe: true, shoes: '#2a2a2a', extra: gat() },
    runner: { key: 'jh-run', skin: '#d4a07a', hair: '#1a1414', hs: 'short', top: '#2e2a30', top2: '#a83a2a', bottom: '#2a2a2e', shoes: '#1a1a1a', hat: 'cap', hatC: '#141214',
      extra(g, d, fr, G, R) { R(2, G.hT + 1, 12, 1, '#141214'); if (d === 0) R(4, G.tT + 1, 8, 6, '#a83a2a'); R(7, G.hT - 3, 2, 2, '#c8302a'); } },
    ojak: { key: 'jh-ojak', skin: '#c89a74', hair: '#3a3430', hs: 'short', top: '#7a7a6a', bottom: '#5a5a4e', shoes: '#2a2a2a', hat: 'scarf', hatC: '#d8d0c0' },
    fisher: { key: 'jh-fish', skin: '#b88a62', hair: '#9a948e', hs: 'short', top: '#8a8070', top2: '#c8c0b0', bottom: '#5a5448', shoes: '#3a3020', hat: 'straw' },
    vil: { key: 'jh-vil', skin: '#c89a74', hair: '#1a1414', hs: 'short', top: '#d8d0c0', bottom: '#a8a090', shoes: '#4a3a2a', hat: 'scarf', hatC: '#ece6d8' },
    hong: { key: 'jh-hong', skin: '#dfe4e6', hair: '#07080c', hs: 'long', cover: true, top: '#eef0ec', top2: '#ffffff', bottom: '#e6e8e4', robe: true, ghost: true, eye: '#0a0a10', mouth: '#6a7a8a', extra: wetX },
    jangG: { key: 'jh-jangG', skin: '#d4dcda', hair: '#08090b', hs: 'long', cover: true, top: '#e6eae6', top2: '#ffffff', bottom: '#dfe3df', robe: true, ghost: true, eye: '#0a0a10', mouth: '#5a6a6a',
      extra(g, d, fr, G, R) { wetX(g, d, fr, G, R); R(3, G.hT + 3, 1, 7, '#2e4a2c'); R(12, G.hT + 2, 1, 9, '#3e5e38'); } },
    /* 平冤以后：衣裳是干的，颜色像她们的名字 */
    hongD: { key: 'jh-hongD', skin: '#f0d8c8', hair: '#120e10', hs: 'long', top: '#f2dce0', top2: '#ffffff', bottom: '#c8404e', robe: true, ghost: true, eye: '#1a1214', mouth: '#b85a5a', blush: true,
      extra(g, d, fr, G, R) { if (d === 3) { R(7, G.tT + 2, 2, 4, '#c8303a'); } } },
    jangD: { key: 'jh-jangD', skin: '#f0d8c8', hair: '#120e10', hs: 'long', top: '#f6eedc', top2: '#ffffff', bottom: '#d86a7a', robe: true, ghost: true, eye: '#1a1214', mouth: '#b85a5a',
      extra(g, d, fr, G, R) { if (d === 3) { R(7, G.tT + 2, 2, 4, '#e07a8a'); } } }
  };

  /* ---------- 道具精灵 ---------- */
  const SPRITES = {
    mun(g, e, t, R) {   // 格子门（墙面一行）
      R(1, 0, 14, 16, '#4a2e1a');
      if (e.open) { R(2, 1, 12, 15, '#0c0806'); R(2, 1, 2, 15, '#6a4a2a'); return; }
      R(2, 1, 12, 15, e.lit ? '#f4e2b0' : '#e6dcc0');
      for (let x = 4; x < 14; x += 3) R(x, 1, 1, 15, '#7a5a3a'); for (let y = 3; y < 16; y += 3) R(2, y, 12, 1, '#7a5a3a');
      R(7, 1, 2, 15, '#4a2e1a');
    },
    changho(g, e, t, R) {   // 窗（墙面一行）
      R(1, 2, 14, 11, '#4a2e1a');
      if (e.open) {
        R(2, 3, 12, 9, '#0a0e18'); R(3, 4, 2, 2, 'rgba(200,210,240,.5)');
        R(-3, 2, 4, 11, '#e6dcc0'); R(15, 2, 4, 11, '#e6dcc0'); R(-2, 4, 2, 1, '#7a5a3a'); R(16, 7, 2, 1, '#7a5a3a');
        return;
      }
      R(2, 3, 12, 9, e.lit ? '#f4e2b0' : '#ddd2b4');
      for (let x = 4; x < 14; x += 3) R(x, 3, 1, 9, '#7a5a3a'); for (let y = 5; y < 12; y += 3) R(2, y, 12, 1, '#7a5a3a');
    },
    deung(g, e, t, R) {   // 灯架上的油灯
      R(4, 13, 8, 2, '#3a2414'); R(7, -6, 2, 20, '#5a3a22'); R(4, -8, 8, 2, '#8a7050'); R(5, -9, 6, 1, '#a88a60');
      if (e.full) R(6, -9, 4, 1, '#c8a040');
      if (!e.off) { const f = Math.sin(t * 13) > 0 ? 1 : 0; R(7, -14 + f, 2, 5 - f, '#ffb040'); R(7, -12, 2, 2, '#fff2c0'); R(3, -16, 10, 10, 'rgba(255,200,110,.10)'); }
      else R(7, -11, 2, 1, '#2a2020');
    },
    byeong(g, e, t, R) {   // 屏风（w 格）
      const w = e.w * 16;
      R(0, -12, w, 27, '#3a2214');
      for (let i = 0; i < e.w * 2; i++) { const x = i * 8 + 1; R(x, -11, 6, 25, '#e8dcbc'); R(x + 1, 2 + (i % 3), 4, 3, '#6a7a6a'); R(x + 2, -1 + (i % 2), 2, 3, '#4a5a4a'); R(x, -6 + (i % 2) * 2, 6, 1, 'rgba(90,110,130,.4)'); }
      R(w - 10, -9, 6, 5, '#c84a3a');
    },
    seoan(g, e, t, R) {   // 书案（w=2）
      R(1, 13, 30, 2, 'rgba(0,0,0,.35)'); box(R, 0, 2, 32, 9, '#6a3e22'); R(1, 3, 30, 2, '#8a5a32'); R(2, 11, 3, 4, '#4a2a16'); R(27, 11, 3, 4, '#4a2a16');
      R(3, -1, 9, 4, '#e8e0c8'); R(3, 0, 9, 1, '#b8ae94'); R(4, -3, 7, 2, '#d8ceb0');
      R(15, 1, 6, 3, '#1a1a1e'); R(16, 2, 4, 1, '#3a3a44'); R(23, -2, 1, 5, '#c8a870'); R(23, -3, 1, 1, '#1a1a1a'); R(26, 0, 4, 3, '#b83a2a');
    },
    rack(g, e, t, R) {   // 衣架（官服挂着 / 已经穿上）
      R(1, -10, 14, 2, '#5a3a22'); R(2, -10, 2, 25, '#5a3a22'); R(12, -10, 2, 25, '#5a3a22'); R(1, 13, 14, 2, '#4a2a16');
      if (!e.off) { R(3, -8, 10, 18, '#2a4a66'); R(3, -8, 10, 2, '#d8d0c0'); R(6, -4, 4, 3, '#c8a85a'); R(3, 2, 10, 1, '#c8a85a'); R(5, -14, 6, 4, '#121016'); R(3, -13, 2, 2, '#121016'); R(11, -13, 2, 2, '#121016'); }
    },
    chestK(g, e, t, R) {   // 半开式木箱（盘达期）
      box(R, 0, 1, 16, 14, '#6a3a1e'); R(1, 2, 14, 2, '#8a5228'); R(1, 7, 14, 1, '#3a1e0e');
      R(2, 3, 3, 3, '#c8a050'); R(11, 3, 3, 3, '#c8a050'); R(6, 8, 4, 4, '#d8b060'); R(7, 9, 2, 2, '#3a2a10');
      if (e.open) { R(1, -3, 14, 5, '#4a2810'); R(2, -2, 12, 3, '#e8dcc0'); }
    },
    brazier(g, e, t, R) { R(3, 9, 10, 6, '#4a4a48'); R(2, 8, 12, 2, '#6a6a66'); R(4, 7, 8, 2, e.off ? '#3a3230' : '#d85a2a'); if (!e.off) R(6, 6, 4, 1, '#ffaa50'); },
    wetp(g, e, t, R) { R(4, 4, 3, 5, 'rgba(40,60,80,.55)'); R(9, 8, 3, 5, 'rgba(40,60,80,.55)'); R(5, 5, 1, 2, 'rgba(160,200,230,.5)'); R(10, 9, 1, 2, 'rgba(160,200,230,.5)'); },
    puddle2(g, e, t, R) { R(2, 6, 12, 7, 'rgba(40,60,80,.45)'); R(4, 7, 6, 2, 'rgba(160,200,230,.35)'); },
    gate(g, e, t, R) {   // 府衙三门（w=2，压在南墙上）
      R(-4, -18, 40, 5, '#2e3138'); R(-2, -13, 36, 2, '#4a505a'); for (let x = -3; x < 36; x += 4) R(x, -14, 2, 2, '#6a707a');
      R(0, -11, 3, 27, '#8a2a22'); R(29, -11, 3, 27, '#8a2a22'); R(3, -11, 26, 3, '#7a2420');
      R(3, -8, 13, 24, '#9a3a2a'); R(16, -8, 13, 24, '#9a3a2a'); R(15, -8, 2, 24, '#5a1a12');
      for (let y = -4; y < 14; y += 5) { R(5, y, 9, 1, '#6a2418'); R(18, y, 9, 1, '#6a2418'); }
      R(12, 2, 2, 2, '#d8b060'); R(18, 2, 2, 2, '#d8b060'); R(9, -10, 14, 2, '#d8d0b0');
    },
    plaque(g, e, t, R) { R(6, 4, 20, 9, '#2a1a10'); R(7, 5, 18, 7, '#1a120c'); R(10, 7, 4, 3, '#d8b060'); R(18, 7, 4, 3, '#d8b060'); },
    drum(g, e, t, R) { R(2, 4, 2, 11, '#5a3a22'); R(12, 4, 2, 11, '#5a3a22'); R(3, -2, 10, 9, '#8a2a22'); R(4, -1, 8, 7, '#c8b890'); R(5, 0, 6, 5, '#b8a880'); R(1, 2, 14, 1, '#4a2a16'); },
    yo(g, e, t, R) {   // 褥子（h=2）
      R(1, 2, 14, 28, '#e0d4bc'); R(2, 3, 12, 6, '#f0e8d8'); R(1, 10, 14, 20, '#b85a6a'); R(1, 10, 14, 2, '#d07a88');
      for (let y = 14; y < 29; y += 5) R(2, y, 12, 1, '#a04a5a');
      R(3, 20, 6, 4, 'rgba(90,40,40,.35)'); R(4, 21, 1, 1, '#8a8478'); R(6, 22, 1, 1, '#8a8478');
    },
    cage(g, e, t, R) {   // 老鼠笼
      box(R, 2, 5, 12, 9, '#7a5a34'); for (let x = 4; x < 14; x += 2) R(x, 6, 1, 7, '#4a3418'); R(2, 4, 12, 1, '#5a3e20');
      if (e.open) { R(12, 1, 1, 5, '#7a5a34'); R(3, 12, 6, 1, '#3a1410'); R(5, 11, 2, 1, '#e8c060'); }
    },
    ashpit(g, e, t, R) { R(1, 5, 14, 10, '#3a3430'); R(2, 6, 12, 8, '#8a8680'); R(3, 7, 10, 5, '#a8a49c'); R(5, 8, 3, 2, '#6a6660'); if (!e.s.dug) R(9, 9, 2, 1, '#7a7268'); else { R(6, 7, 6, 4, '#4a4440'); } },
    onggi(g, e, t, R) { R(2, 13, 12, 2, 'rgba(0,0,0,.3)'); R(3, 3, 10, 11, '#5a3018'); R(2, 6, 12, 6, '#6a3a1e'); R(4, 1, 8, 3, '#4a2810'); R(5, 4, 2, 6, '#8a5a3a'); },
    stoveK(g, e, t, R) {   // 灶（w=2）
      R(0, 2, 32, 13, '#8a6a4a'); R(0, 2, 32, 2, '#a88a68'); R(3, 0, 10, 6, '#1e1c1c'); R(19, 0, 10, 6, '#1e1c1c'); R(4, 0, 8, 1, '#3a3838'); R(20, 0, 8, 1, '#3a3838');
      R(5, 9, 6, 5, '#140c08'); R(21, 9, 6, 5, '#140c08'); if (!e.off) { R(6, 11, 4, 3, '#a83a1a'); R(7, 12, 2, 2, '#e8803a'); }
    },
    woodpile(g, e, t, R) { for (let i = 0; i < 3; i++) for (let j = 0; j < 3 - i; j++) { R(1 + j * 5 + i * 2, 10 - i * 4, 5, 4, '#7a5a3a'); R(2 + j * 5 + i * 2, 11 - i * 4, 3, 2, '#c8a070'); } R(10, 2, 1, 12, '#6a4a2a'); R(8, 2, 5, 2, '#9aa0a6'); },
    lowtbl(g, e, t, R) { box(R, 1, 6, 14, 5, '#7a4a28'); R(2, 11, 2, 4, '#5a3418'); R(12, 11, 2, 4, '#5a3418'); if (!e.s.taken) { R(4, 4, 6, 3, '#f0ead8'); R(5, 5, 4, 1, '#6a6a6a'); } R(10, 3, 4, 4, '#c87a8a'); R(11, 4, 2, 2, '#e8c040'); },
    willow(g, e, t, R) {   // 柳树
      R(3, 13, 10, 3, 'rgba(0,0,0,.3)'); R(6, -2, 4, 17, '#4a3a28'); R(7, -2, 1, 17, '#5a4a34');
      R(-2, -16, 20, 10, '#3a5a34'); R(0, -18, 16, 4, '#4a6a3e');
      const s = Math.round(Math.sin(t * 1.3 + e.px) * 1);
      for (let i = 0; i < 9; i++) { const x = -1 + i * 2 + s; R(x, -8, 1, 10 + (i % 3) * 3, i % 2 ? '#5a7a44' : '#3e5e36'); }
    },
    rose(g, e, t, R) { R(1, 4, 14, 11, '#2a4a2a'); R(2, 3, 12, 3, '#3a5a34'); for (let i = 0; i < 6; i++) { const x = [3, 8, 11, 5, 12, 2][i], y = [5, 4, 7, 9, 11, 10][i]; R(x, y, 2, 2, i % 2 ? '#e86a8a' : '#d8405a'); R(x, y, 1, 1, '#f8b0c0'); } },
    lotus(g, e, t, R) { R(1, 9, 7, 4, '#3a6a3a'); R(9, 6, 6, 4, '#2e5a32'); R(2, 10, 3, 1, '#5a8a4a'); if (!e.off) { R(5, 4, 5, 5, '#c83a4a'); R(6, 3, 3, 2, '#e85a6a'); R(4, 6, 2, 2, '#e85a6a'); R(9, 6, 2, 2, '#e85a6a'); R(7, 6, 1, 1, '#f8d060'); } },
    bramble(g, e, t, R) {
      R(1, 5, 14, 10, '#2a2a1e'); for (let i = 0; i < 10; i++) R((i * 5) % 14 + 1, 4 + (i * 3) % 10, 2, 1, '#4a4a30'); for (let i = 0; i < 8; i++) R((i * 7) % 13 + 1, 6 + (i * 5) % 8, 1, 1, '#8a8a60');
      if (!e.s.taken) { R(8, 2, 7, 6, '#6a5a44'); R(9, 3, 5, 1, '#8a7a64'); R(11, 5, 3, 3, '#4a2018'); R(13, 7, 1, 3, '#6a5a44'); R(9, 7, 3, 2, '#8a6a44'); }
    },
    tracks(g, e, t, R) { const P = (x, y) => { R(x, y + 2, 4, 3, 'rgba(40,30,20,.55)'); R(x, y, 1, 1, 'rgba(40,30,20,.55)'); R(x + 2, y - 1, 1, 1, 'rgba(40,30,20,.55)'); R(x + 4, y, 1, 1, 'rgba(40,30,20,.55)'); }; P(2, 3); P(9, 9); },
    bird(g, e, t, R) {   // 青鸟
      const y = e.fr ? -2 : Math.round(Math.sin(t * 3) * .6);
      R(5, 9 + y, 6, 4, '#3a7ac8'); R(9, 7 + y, 4, 4, '#4a8ad8'); R(12, 9 + y, 2, 1, '#e8c040'); R(10, 8 + y, 1, 1, '#0a0a10'); R(2, 10 + y, 4, 2, '#2a5aa0'); R(6, 12 + y, 4, 1, '#bcd8f0');
      if (e.fr) { R(4, 4 + y, 6, 4, '#5a9ae8'); } else R(5, 9 + y, 4, 2, '#2a5aa0');
      R(7, 13 + y, 1, 2, '#c89a40'); R(9, 13 + y, 1, 2, '#c89a40');
    },
    kkotsin(g, e, t, R) { R(3, 9, 10, 5, '#d86a8a'); R(4, 8, 8, 2, '#f0a0b8'); R(5, 10, 4, 2, '#3a2a2a'); R(10, 10, 2, 2, '#f8e070'); R(9, 11, 1, 1, '#4a8a4a'); R(3, 13, 10, 1, 'rgba(40,60,80,.5)'); },
    shroud(g, e, t, R) { R(0, 7, 16, 7, '#e8e6de'); R(0, 7, 16, 1, '#ffffff'); R(1, 13, 14, 1, '#b8b4a8'); R(3, 8, 1, 5, '#c8c4b8'); R(12, 8, 1, 5, '#c8c4b8'); R(0, 14, 16, 2, 'rgba(60,40,30,.35)'); },
    mound(g, e, t, R) { R(0, 4, 32, 11, '#4a6a3a'); R(2, 1, 28, 5, '#5a7a44'); R(6, -1, 20, 3, '#6a8a4e'); R(0, 13, 32, 2, '#3a5a2e'); for (let i = 0; i < 8; i++) R(3 + i * 4, 4 + (i % 2), 1, 2, '#7a9a5a'); },
    stele(g, e, t, R) { R(2, 12, 12, 3, '#6a6a64'); R(4, -6, 8, 19, '#a8a8a0'); R(4, -6, 8, 1, '#c8c8c0'); R(5, -3, 6, 13, '#9a9a92'); for (let y = -2; y < 9; y += 2) R(7, y, 2, 1, '#4a4a46'); if (e.flowers) { R(1, 11, 3, 3, '#e8d040'); R(12, 11, 3, 3, '#e86a8a'); } if (e.lit) { R(13, 6, 1, 6, '#c8b890'); R(13, 4, 1, 2, '#e8803a'); } },
    bundle(g, e, t, R) { R(3, 8, 10, 6, '#d8d0bc'); R(4, 7, 8, 2, '#e8e0cc'); R(5, 10, 6, 3, 'rgba(120,40,40,.45)'); R(7, 6, 2, 2, '#b8ae94'); if (e.open) { R(5, 9, 6, 3, '#9a6a5a'); R(6, 10, 1, 1, '#2a1a10'); R(8, 11, 1, 1, '#2a1a10'); R(9, 10, 1, 1, '#2a1a10'); } },
    silver(g, e, t, R) { box(R, 2, 6, 12, 8, '#5a2a1a'); R(3, 7, 10, 2, '#7a3a24'); R(7, 9, 2, 2, '#d8b060'); if (e.open) { R(3, 4, 10, 3, '#e8e8f0'); R(4, 4, 3, 1, '#ffffff'); } },
    storedoor(g, e, t, R) {   // 偏房的门（墙面一行）
      R(1, 0, 14, 16, '#3a2414'); R(2, 1, 12, 15, '#6a4628'); R(7, 1, 2, 15, '#3a2414'); R(5, 8, 1, 2, '#c8a050'); R(10, 8, 1, 2, '#c8a050');
      if (e.text) { R(3, -6, 10, 5, '#2a1a10'); R(4, -5, 8, 3, '#d8c890'); }
    }
  };

  /* ---------- 瓦片 ---------- */
  const TILES = {
    giwa: { solid: true, paint(R, X, Y) { R(0, 0, 16, 16, '#3b3f48'); for (let x = 0; x < 16; x += 4) { R(x, 0, 3, 16, '#4a505a'); R(x + 3, 0, 1, 16, '#2a2d34'); } for (let y = 3; y < 16; y += 5) R(0, y, 16, 1, '#2e3138'); if (hash(X, Y, 9) < .15) R(((hash(X, Y, 2) * 12) | 0) + 1, ((hash(X, Y, 3) * 12) | 0) + 1, 2, 2, '#5a6068'); } },
    giwaE: { solid: true, paint(R, X, Y) { R(0, 0, 16, 16, '#3b3f48'); for (let x = 0; x < 16; x += 4) { R(x, 0, 3, 12, '#4a505a'); R(x + 3, 0, 1, 12, '#2a2d34'); R(x, 11, 3, 3, '#6a707a'); R(x + 1, 12, 1, 1, '#8a909a'); } R(0, 14, 16, 2, '#1e2026'); } },
    ondol: { solid: false, paint(R, X, Y) { R(0, 0, 16, 16, '#c89a58'); R(0, 15, 16, 1, '#a87a40'); R(15, 0, 1, 16, '#b88a4a'); if (hash(X, Y, 4) < .3) R(((hash(X, Y, 5) * 12) | 0) + 2, ((hash(X, Y, 6) * 12) | 0) + 2, 3, 1, '#b8884a'); } },
    earth: { solid: false, paint(R, X, Y) { speck(R, '#6a5a48', ['#5a4a3a', '#7a6a56', '#4e4034'], X, Y, 20, 5); } }
  };
  const LEG = { F: 'giwa', E: 'giwaE', O: 'ondol', x: 'earth' };

  /* ---------- 地图行 ---------- */
  function gwanaRows() {
    const G = grid(24, 17, 'd');
    G.rect(0, 0, 23, 3, '#'); G.rect(6, 0, 17, 1, 'F'); G.rect(6, 2, 17, 2, 'E');
    G.rect(6, 4, 17, 5, 'l'); G.rect(6, 6, 17, 6, 'k');
    G.rect(1, 4, 5, 5, 'F'); G.rect(1, 6, 5, 6, 'E'); G.rect(1, 7, 5, 7, '#');
    G.rect(18, 4, 22, 5, 'F'); G.rect(18, 6, 22, 6, 'E'); G.rect(18, 7, 22, 7, '#');
    G.rect(0, 4, 0, 16, '#'); G.rect(23, 4, 23, 16, '#'); G.rect(0, 15, 23, 16, '#');
    G.rect(11, 7, 12, 14, 'k');
    G.set(2, 13, 'T'); G.set(21, 13, 'T');
    return G.rows();
  }
  function dongRows() { const G = grid(14, 10, 'O'); G.rect(0, 0, 13, 1, '#'); G.rect(0, 0, 0, 9, '#'); G.rect(13, 0, 13, 9, '#'); G.rect(0, 9, 13, 9, '#'); G.set(6, 9, 'O'); return G.rows(); }
  function baeRows() {
    const G = grid(26, 18, 'd');
    G.rect(0, 0, 25, 1, '#'); G.rect(0, 0, 0, 17, '#'); G.rect(25, 0, 25, 17, '#');
    G.rect(1, 2, 7, 5, 'O'); G.rect(8, 2, 8, 6, '#'); G.rect(0, 6, 8, 6, '#'); G.set(4, 6, 'O');
    G.rect(9, 2, 16, 5, 'l'); G.rect(9, 6, 16, 6, 'k');
    G.rect(17, 2, 17, 6, '#'); G.rect(18, 2, 24, 5, 'O'); G.rect(17, 6, 25, 6, '#'); G.set(21, 6, 'O');
    G.rect(0, 10, 7, 10, '#'); G.rect(7, 10, 7, 16, '#'); G.rect(1, 11, 6, 16, 'x'); G.set(4, 10, 'x');
    G.rect(18, 10, 25, 10, '#'); G.rect(18, 10, 18, 16, '#'); G.rect(19, 11, 24, 16, 'w'); G.set(21, 10, 'w');
    G.rect(0, 17, 25, 17, '#'); G.set(12, 17, 'd'); G.set(13, 17, 'd');
    G.set(24, 8, 'T');
    return G.rows();
  }
  function pondRows() {
    const G = grid(26, 18, '"');
    G.rect(0, 0, 25, 1, 'T'); G.rect(0, 2, 0, 17, 'T'); G.rect(25, 2, 25, 17, 'T');
    for (let y = 2; y <= 12; y++) for (let x = 6; x <= 24; x++) { const d = ((x - 15.5) / 7.6) ** 2 + ((y - 6.8) / 4.4) ** 2; if (d < 1) G.set(x, y, '~'); else if (d < 1.32) G.set(x, y, 'o'); }
    G.rect(4, 12, 4, 17, 'd'); G.rect(4, 13, 23, 13, 'd');
    [[7, 10], [7, 9], [8, 11], [22, 10], [23, 9], [23, 8], [24, 7]].forEach(([x, y]) => G.set(x, y, 'e'));
    G.set(1, 9, 'T'); G.set(2, 16, 'B'); G.set(23, 15, 'T'); G.set(10, 16, 'B');
    return G.rows();
  }
  const POND = pondRows();
  const DEEP = []; POND.forEach((r, y) => [...r].forEach((c, x) => { if (c === '~') DEEP.push([x, y]); }));

  /* ================= 常量与通用 ================= */
  const EVN = { trap: '空鼠笼', fur: '灰坑里的毛皮', shoe: '池边的绣花鞋', sleeve: '荆棘上的袖子', dowry: '张氏的嫁妆单', letter: '红莲的字条' };
  const EV = ['trap', 'fur', 'shoe', 'sleeve', 'dowry'];
  const evN = S => EV.filter(k => S.has(k)).length;
  function dayGoal(S) {
    const n = evN(S);
    if (n >= 5) return S.goal('证物齐了（5/5）——回府衙');
    S.goal('查访裴座首家和城外池塘，收集证物（' + n + '/5）');
  }
  function prepLeft(S) {
    const f = S.f, L = [];
    if (!f.diary) L.push('看前任留下的册子');
    if (!S.ent('lamp').full) L.push('给灯添油');
    if (!S.has('fire')) L.push('找火镰');
    if (!f.robe) L.push('换上官服');
    return L;
  }
  function prepGoal(S) { const L = prepLeft(S); S.goal(L.length ? '天黑以前准备好：' + L.join('、') : '准备好了——到书案后坐下'); }

  /* 吓死：前任们就是这样死的 */
  async function scared(S, msg, title, kind) {
    S.clearTimer(); S.lights(null);
    if (kind === 'face') await S.scare('face', { spr: '@hongF', dur: 1 });
    else { S.fx('red'); await S.scare('flash', { dur: .8, sfx: 'scream' }); }
    await S.die(msg, title);
  }

  /* ================= 到任：府衙 ================= */
  async function kimTalk(S) {
    const f = S.f; S.face('kim', 'pl');
    if (f.ph === 'arrive') {
      await S.say('金吏房', ['大人！一路辛苦。下官是本府吏房，姓金。', '……大人，下官斗胆说一句。今晚，您千万别在东轩过夜。']);
      await S.say('金吏房', ['三年了。前头五位大人，没有一位熬过上任的头一夜。', '第二天早上，都是下官进去收的。人坐在书案后头，眼睛瞪得这么大。……没一处伤。', '都说是吓死的。']);
      const r = await S.ask('「吓死的？被什么吓死？」', ['「夜里出了什么事？」', '「荒唐。我今晚就住东轩。」'], '');
      if (r === 0) await S.say('金吏房', ['一过三更，东轩里就起阴风。门外有水声，滴答滴答的，像有人浑身湿透了在走。', '第三任大人听见水声就喊人。喊着喊着……就没声了。', '所以现在天一黑，衙门里一个人都不留。']);
      await S.say('金吏房', ['……大人要是执意留下，前任李大人临走那晚写的册子，还在东轩书案上。下官没敢动。', '灯油在西边库房，火镰在东边吏房的抽屉里。官服给您挂在东轩衣架上了。']);
      f.ph = 'prep'; prepGoal(S);
      return;
    }
    if (f.ph === 'prep') {
      const L = prepLeft(S);
      if (!L.length) return S.say('金吏房', ['……都备好了？', '那下官……下官先告退了。大人，灯千万别灭。']);
      if (!S.ent('lamp').full && !S.has('oil')) return S.say('金吏房', '灯油在西边库房里，门上挂着「库」字的那间。');
      if (!S.has('fire')) return S.say('金吏房', '火镰在东边吏房，靠门那张桌子的抽屉里。');
      return S.say('金吏房', ['第三任大人，是喊人喊死的。第四任，是想跑，倒在了院子里。', '大人……您可千万别学他们。']);
    }
    if (f.ph === 'day') return kimDay(S);
    if (f.ph === 'trialwait') return trialStart(S);
    if (f.ph === 'after') return S.say('金吏房', '大人，乡里的人都去池塘那边了。说是要亲眼看着两位小姐上来。');
    await S.say('金吏房', '大人。');
  }
  async function kimDay(S) {
    const f = S.f;
    const n = f.kimN = (f.kimN || 0) + 1;
    if (evN(S) >= 5) return S.say('金吏房', '证物都齐了？那下官这就去准备升堂。');
    const tips = [];
    if (!S.has('trap') || !S.has('fur')) tips.push(n >= 3 ? '裴家的乳母说过：库房里的鼠笼、灶房里的灰坑。大人去那两处看看。' : '裴家有个老乳母，在那家里待了二十年，什么都知道。只是许氏在跟前，她不敢说。');
    if (!S.has('shoe')) tips.push(n >= 3 ? '那只青鸟，大人跟着它走。它落在哪儿，就去哪儿找。' : '城外那池塘……打鱼的老汉说，这阵子总有一只青鸟落在池边柳树上，赶都赶不走。');
    if (!S.has('sleeve')) tips.push(n >= 3 ? '池塘那条小路边上的荆棘丛，地上有爪印的地方。' : '长锁那只耳朵，说是山里摔的。可那几天，池塘边的路上有人看见过老虎脚印。');
    if (!S.has('dowry')) tips.push(n >= 3 ? '裴座首屋里有只上锁的箱子。拿池边找到的东西给他看——他是糊涂，心不坏。' : '两位小姐的亲娘张氏，过门的时候陪嫁很厚。那些田地银子，如今在谁手里？');
    await S.say('金吏房', tips.slice(0, 2));
  }
  async function bokTalk(S) {
    const f = S.f; S.face('bok', 'pl');
    if (f.ph === 'arrive' || f.ph === 'prep') return cyc('福童', [
      '大、大人真要住东轩？我奶奶说，冤鬼夜里来，是来告状的。',
      '我奶奶还说，你越怕，它越冤；你一跑，它就跟你到天涯海角。所以……千万别跑。',
      '要是我，我就把灯点得亮亮的，坐得直直的，一声都不出。……可我不敢试。'
    ], '_bk')(S);
    if (f.ph === 'day') return cyc('福童', [
      '大人还活着！我跟他们打赌，赢了三个铜板！',
      '池塘那边的老汉说，那天夜里林子里有老虎叫。第二天，裴家长锁就少了一只耳朵。',
      '裴家二小姐红莲不见的那天，有人看见一只青色的鸟，在她家院墙上叫了一早上。'
    ], '_bk2')(S);
    if (f.ph === 'trialwait') return S.say('福童', '升堂！升堂！大人，我去敲鼓！');
    await S.say('福童', '大人！');
  }
  async function storeDoor(S) {
    const f = S.f;
    if (f.ph === 'prep' && !S.has('oil') && !S.ent('lamp').full) { S.sfx('open'); S.give('oil'); return S.narr('库房里一股霉味。墙角排着几只油坛子。\n你灌了满满一瓶灯油。'); }
    await S.narr('西边的库房。门上挂着一块「库」字木牌。\n里面堆着历任府使留下的箱笼，没人来领。');
  }
  async function clerkDoor(S) {
    const f = S.f;
    if (f.ph === 'prep' && !S.has('fire')) { S.sfx('open'); S.give('fire'); return S.narr('吏房里文书堆得齐腰高。\n靠门那张桌子的抽屉里，有一副火镰，一包火绒。'); }
    await S.narr('东边的吏房。文书一摞一摞，墨味和霉味混在一起。');
  }
  async function gateUse(S) {
    const f = S.f;
    if (f.ph === 'arrive' || f.ph === 'prep') return S.narr('大门外是铁山的街。家家户户的门板都上得早。\n吏曹的任命书还揣在怀里。');
    if (f.ph === 'trialwait') return S.narr('证物都齐了。该升堂了——跟金吏房说一声。');
    if (f.ph === 'after') { const r = await S.ask('去哪儿？', ['城外的池塘', '先不出去']); if (r) return; return S.go('pond', 4, 16, 3); }
    if (f.ph === 'day') {
      const r = await S.ask('去哪儿？', ['裴座首家（城东）', '城外的池塘', '先不出去']);
      if (r === 0) { S.sfx('open'); return S.go('bae', 12, 16, 3); }
      if (r === 1) { S.sfx('open'); return S.go('pond', 4, 16, 3); }
    }
  }
  async function drumUse(S) { await S.narr('告状用的大鼓。鼓面上落了一层灰。\n这三年，铁山没有一个百姓敢来敲它。'); if (S.f.ph === 'trialwait') { drum(S, 3, .25); await S.narr('咚。咚。咚。'); } }

  async function gwanaEnter(S, first) {
    const f = S.f;
    const day = ['arrive', 'prep', 'day', 'trialwait', 'after'].includes(f.ph);
    S.show('kim', day && f.ph !== 'trial'); S.show('bok', day);
    if (f.ph === 'arrive' && first) {
      await S.narr('铁山府衙。\n大门的红漆掉得斑斑驳驳，院子里的草长到了脚脖子。\n衙役们远远地站着，看你的眼神，像在看一个将死的人。');
      S.goal('跟金吏房说话');
      return;
    }
    if (f.ph === 'day' && evN(S) >= 5 && !f.bribed) return bribe(S);
  }

  /* ================= 东轩：准备 ================= */
  async function deskUse(S) {
    const f = S.f;
    if (f.ph === 'arrive' || f.ph === 'prep') {
      await S.note('diary'); f.diary = true;
      if (f.ph === 'prep') { await S.think('（灯灭了，人就没了。……灯油要满，火要在手边，窗要关紧。）'); prepGoal(S); }
      return;
    }
    if (f.ph === 'night') return S.narr('书案上摊着案卷。字在灯下一跳一跳的，你一个也看不进去。');
    if (f.ph === 'day' || f.ph === 'trialwait') return S.note('case');
    await S.narr('书案上的案卷已经合上了。朱笔批了一个字：结。');
  }
  async function lampUse(S) {
    const f = S.f, l = S.ent('lamp'), w = S.ent('win');
    if (f.ph === 'prep' || f.ph === 'arrive') {
      if (l.full) return S.narr('灯盏里的油满满的，够烧到天亮。');
      if (S.has('oil')) { l.full = true; S.take('oil'); S.sfx('water'); await S.narr('你把灯油添满。灯芯吸饱了油，沉甸甸的。'); return prepGoal(S); }
      return S.narr('灯盏里的油只剩一层底。\n撑不过半夜。');
    }
    if (f.ns === 'dark') {
      if (w.open) {
        S.timerAdd(-1.5); S.sfx('match');
        await S.narr('火镰一擦，火苗刚舔上灯芯——\n窗外一股风灌进来，又灭了。');
        S.goal('窗还开着！先关窗，再点灯');
        return;
      }
      S.clearTimer(); S.lights(null); S.sfx('match'); l.off = false; S.dark(.84); S.plr(null);
      await S.narr('火镰擦了三下。灯芯「噗」地亮了。');
      return ev2(S);
    }
    if (f.ph === 'night') return S.narr('灯火稳稳地烧着。你盯着它，不敢眨眼。');
    await S.narr('灯架上的油灯。灯芯剪得整整齐齐。');
  }
  async function winUse(S) {
    const f = S.f, w = S.ent('win');
    if (f.ns === 'dark' && w.open) {
      w.open = false; S.sfx('close'); S.amb('night'); S.lights(null);
      await S.narr('你扑到窗边，把窗扇拽回来，插上了插销。');
      S.goal('窗关上了——点灯！');
      return;
    }
    if (f.ph === 'night') return S.narr('窗插销插得死死的。\n窗纸外面，黑得什么也看不见。');
    if (f.ph === 'prep' || f.ph === 'arrive') return S.narr('朝东的窗。窗纸新糊过，插销却锈了，一推就晃。');
    await S.narr('窗纸透进来白白的天光。');
  }
  async function rackUse(S) {
    const f = S.f, r = S.ent('rack');
    if (r.off) return S.narr('空衣架。');
    if (f.ph !== 'prep') return S.narr('衣架上挂着一身青色的官服，胸前绣着补子。还有一顶纱帽。');
    r.off = true; f.robe = true; S.wear('@meO'); S.sfx('paper');
    await S.narr('你换上青色的官服，戴正纱帽。\n衣裳上有樟脑味，不知道上一个穿它的人是谁。');
    await S.think('（她们要找的是「府使」。……那就让她们找到。）');
    prepGoal(S);
  }
  async function seatUse(S) {
    const f = S.f;
    if (f.ph === 'prep' || f.ph === 'arrive') {
      const L = prepLeft(S);
      if (f.ph === 'arrive') return S.narr('书案后面的方席。坐上去，正对着门。');
      if (L.length) return S.narr('还没准备好：' + L.join('、') + '。');
      const r = await S.ask('就在这里，坐到天亮？', ['坐下，等她们来', '再准备一下']);
      if (r) return;
      return startNight(S);
    }
    if (f.ns === 'sit') return startStill(S);
    if (f.ph === 'night') return S.narr('你挺直了背。坐着，别动。');
    await S.narr('书案后的方席，压出了一个坐痕。');
  }
  async function dongDoor(S) {
    const f = S.f;
    if (f.ph === 'night' && ['dark', 'sit', 0].includes(f.ns)) {
      const r = await S.ask('门就在背后。跑出去，穿过院子，拔开大门的门闩——', ['逃！逃出府衙', '（回去）']);
      if (r === 0) return fleeEnd(S);
      return;
    }
    if (f.ph === 'night') return;
    S.sfx('open');
    await S.go('gwana', 11, 4, 0);
  }

  /* ================= 夜：东轩 ================= */
  const SEAT = [6, 3], LAMP_T = 9, SIT_T = 6, STILL_T = 7;
  let stillWarnT = 0, dripT = 2;
  function seatPl(S) { S.pos(SEAT[0], SEAT[1], 0); }
  function nightReset(S) {
    const f = S.f;
    S.clearTimer(); S.lights(null);
    S.ent('lamp').off = false; S.ent('win').open = false;
    ['hong', 'jangG', 'wet1', 'wet2', 'wet3'].forEach(i => S.hide(i));
    S.ent('hong').alpha = 1; S.place('hong', 6, 8, 3); S.hide('hong');
    S.dark(.84); S.plr(null); S.amb('night'); seatPl(S);
    f.ns = 0; f.warn = 0;
  }
  async function startNight(S) {
    const f = S.f;
    f.ph = 'night';
    await S.fade(1, 700);
    S.dark(.92, 'gwana'); S.dark(.84); S.amb('night'); seatPl(S);
    await S.card('那天夜里', '', '金吏房和衙役们，天没黑就走光了。\n偌大一座府衙，只剩下我一个人，\n和东轩里这一盏灯。');
    await S.fade(0, 700);
    S.goal('端坐书案后，守着灯（一人盯窗和门，一人守灯）');
    nightReset(S); f.ph = 'night';
    S.cp('night');
    await ev1(S, false);
  }
  async function ev1(S, again) {
    const f = S.f;
    if (!again) {
      clapper(S, 2); await S.wait(500); drum(S, 2);
      await S.narr('二更了。\n院子里的梆子，是你自己想象出来的——打更的人，也早就回家了。');
      await S.wait(800);
    }
    drum(S, 3);
    await S.narr('三更。');
    S.amb('none'); await S.wait(500);
    drip(S, .06); await S.wait(700); drip(S, .06); await S.wait(900); drip(S, .07);
    await S.narr('滴答。\n……滴答。\n是水声。从门外传进来的。');
    S.sfx('heart'); await S.wait(500);
    S.shake(600, 3); S.sfx('glass'); S.ent('win').open = true; S.ent('lamp').off = true;
    S.dark(.97); S.plr(1.3); S.amb('wind');
    S.lights([[10 * 16 + 8, 2 * 16 + 8, 2, .45]]);   // 撞开的窗外透进来一点月光
    await S.say('', '灯灭了。', { style: 'big' });
    f.ns = 'dark';
    S.goal('风把窗撞开了，灯灭了——先关窗，再点灯！');
    S.timer(LAMP_T, '黑暗', async S => {
      S.f.ns = 0;
      await scared(S, '黑暗里，水声停在了你面前。\n一只又湿又冷的手，摸上了你的脸。\n\n第二天早上，金吏房在书案后面找到了你。眼睛睁得很大。', '灯灭了', 'face');
    }, { during: true });
  }
  async function ev2(S) {
    const f = S.f;
    f.ns = 'sit';
    S.show('wet1'); drip(S, .07);
    await S.narr('门——开着一条缝。\n门槛上，一串湿脚印，正一个一个，朝屋里印过来。');
    S.show('wet2');
    S.goal('回到书案后，端坐！');
    S.timer(SIT_T, '它进来了', async S => {
      S.f.ns = 0;
      await scared(S, '你还站在屋子当中。\n湿脚印一直印到了你的脚尖前面。\n有人贴着你的耳朵，叹了一口气。冷得像井水。', '你没坐住');
    }, { during: true });
  }
  async function startStill(S) {
    const f = S.f;
    S.clearTimer(); seatPl(S); S.show('wet3');
    await S.narr('你坐回书案后，攥紧了袖口。');
    const h = S.ent('hong'); h.alpha = 0; S.place('hong', 6, 8, 3);
    await S.alpha('hong', .92, 900);
    weep(S, .025);
    await S.narr('门缝里，进来一个人。\n白衣，长头发，浑身往下淌水。\n她低着头，一步，一步，朝书案走过来。');
    await S.say('', '别动。别出声。', { style: 'big' });
    f.ns = 'still'; stillWarnT = .5;
    S.goal('端坐，别动——一下也别动');
    S.timer(STILL_T, '别动', stillDone);
  }
  function dongTick(S, dt) {
    const f = S.f;
    if (f.ph === 'night' && (f.ns === 0 || f.ns === 'sit' || f.ns === 'still') && !W.busy) {
      dripT -= dt; if (dripT <= 0) { dripT = 1.4 + Math.random() * 1.8; drip(S, f.ns === 'still' ? .05 : .025); }
    }
    if (f.ns !== 'still' || W.busy) return;
    const h = S.ent('hong'), ty = 5 * TS;
    if (h.py > ty) { h.py = Math.max(ty, h.py - dt * TS * 3.2 / STILL_T); h.y = Math.round(h.py / TS); h.fr = ((W.t * 2) | 0) % 2 ? 1 : 3; }
    if (stillWarnT > 0) { stillWarnT -= dt; return; }
    if (S.moving) {
      if (!f.warn) {
        f.warn = 1; stillWarnT = 99;
        S.run(async S => {
          S.clearTimer(); seatPl(S); S.sfx('heart');
          await S.narr('她停住了。\n歪了歪头，像是在听什么。\n……你屏住呼吸，一点一点，坐回原处。');
          await S.think('（再动一下，就完了。）');
          stillWarnT = .7; S.timer(STILL_T, '别动', stillDone);
        });
      } else {
        f.ns = 0; S.clearTimer();
        S.run(async S => scared(S, '你只是挪了一下膝盖。\n她猛地抬起头——\n灯，灭了。', '你动了', 'face'));
      }
    }
  }
  async function stillDone(S) {
    const f = S.f;
    f.ns = 'face'; S.place('hong', 6, 5, 3); S.ent('hong').alpha = .92;
    S.cp('face');
    await ev3(S);
  }
  async function ev3(S) {
    const f = S.f;
    await S.narr('她在书案前停住了。\n水从她的头发上、袖口上，一滴一滴落在地板上。\n滴答。滴答。');
    await S.wait(500);
    await S.narr('她慢慢地，抬起了头——');
    await S.scare('face', { spr: '@hongF', dur: 1.1 });
    let r = await S.ask('灯芯「哔剥」响了一声。', ['（屏住呼吸，端坐不动）', '「来——来人哪！」', '（夺门而逃）']);
    if (r === 1) return scared(S, '「来人——」\n喊声撞在墙上，又弹回来。没有人来。\n她脸上的水，一下子全涌了出来。\n灯，灭了。', '你喊出了声');
    if (r === 2) return fleeEnd(S);
    S.face('hong', 0);
    await S.narr('她跪了下去。');
    let quiet = 0;
    for (;;) {
      r = await S.ask('她的嘴唇动了动，没有声音。\n……她在等你先开口。', ['「你是何人？有何冤情，起来说话。」', '「妖孽！还不退下！」', '（一言不发）']);
      if (r === 1) return scared(S, '「妖孽，退下！」\n她的肩膀抖了一下。\n然后，哭声从四面八方涌了过来——墙里，地下，你的耳朵里。', '你骂走了她');
      if (r === 0) break;
      quiet++;
      await S.narr('你没有出声。她也没有。\n灯芯一点一点矮下去。她就那样跪着，抬着头，等。');
      await S.think(quiet === 1 ? '（……前任们，是不是也这样，到死都没问她一句？）' : '（她是来告状的。……问她。）');
    }
    await ghostTale(S);
  }
  async function ghostTale(S) {
    const f = S.f;
    weep(S, .02);
    await S.say('红莲', ['……大人。', '小女子红莲，是本府座首裴武龙的小女儿。我有个姐姐，叫蔷花。', '娘过世以后，爹爹娶了许氏。她生了三个儿子……她嫌我们姐妹碍眼，更嫌娘留给我们的嫁妆。'], { style: 'whisper' });
    await S.say('红莲', ['那年秋天，她说姐姐与人私通，夜里在被窝里小产了。她拿着一团血淋淋的东西给爹爹看。', '爹爹信了。当天夜里，叫长锁哥送姐姐去外婆家。', '……姐姐再也没有回来。'], { style: 'whisper' });
    await S.say('红莲', ['后来我梦见姐姐。浑身是水，头发上缠着水草，说她冷。', '有一只青鸟落在我窗前。我跟着它，走到了城外的池塘边……', '……后来，我也留在那里了。'], { style: 'whisper' });
    S.ent('jangG').alpha = 0; S.place('jangG', 7, 7, 3);
    await S.alpha('jangG', .8, 900);
    await S.narr('红莲身后，不知什么时候，又站了一个人。\n年纪大一些，也是一身湿透的白衣。她始终没有抬头。');
    await S.say('蔷花', '……我没有。', { style: 'whisper' });
    await S.say('红莲', ['我们去找过五位大人。只想说一句冤枉。', '可他们一看见我们，就……', '大人。姐姐不是那样的人。求您，替她把名声要回来。'], { style: 'whisper' });
    await S.say('你', '我是铁山府使。这桩案子，我接了。');
    await S.narr('两个人对着你，深深地拜了下去。\n再抬起头的时候，屋里已经没有人了。\n只有地板上，两滩水。');
    S.hide('hong'); S.hide('jangG'); S.show('pud');
    f.ns = 'done';
    await S.fade(1, 900);
    S.dark(null); S.dark(null, 'gwana'); S.amb('room'); S.ent('win').lit = true;
    ['wet1', 'wet2', 'wet3'].forEach(i => S.hide(i));
    await S.card('第二天一早', '', '鸡叫的时候，我还坐在书案后面。\n灯油烧掉了一大半。\n地板上那两滩水，到中午都没干。');
    f.ph = 'day';
    S.show('kimD'); S.show('bokD'); S.face('kimD', 3); S.face('bokD', 3);
    await S.fade(0, 900);
    await morning(S);
  }
  async function morning(S) {
    const f = S.f;
    S.sfx('open');
    await S.narr('门被推开了。金吏房带着福童和两个衙役，抬着一块门板站在门口。\n——是来收尸的。');
    S.bubble('kimD', '!', 1400); S.bubble('bokD', '!', 1400);
    await S.say('福童', '……活、活的！大人是活的！');
    await S.say('金吏房', ['大人……您、您这一夜……', '……下官这就去给大人煮粥。']);
    await S.say('你', ['不急。把裴座首家的案卷拿来。', '他家的两个女儿，蔷花、红莲。']);
    await S.narr('金吏房的脸一下子白了。');
    await S.say('金吏房', ['……大人怎么知道的？', '裴家大小姐蔷花，说是失了身，夜里小产，羞得连夜跑了。二小姐红莲没过多久也不见了。', '这是裴家自己报上来的。前任李大人觉得蹊跷，批了个「待查」。……第二天，就是下官进来收的他。']);
    await S.note('case');
    await S.say('金吏房', ['裴家在城东。许氏、长锁都在家。城外有个池塘，人家都说……二小姐是在那儿不见的。']);
    S.hide('kimD'); S.hide('bokD'); S.hide('pud');
    dayGoal(S);
    S.cp('day');
  }
  async function fleeEnd(S) {
    S.clearTimer(); S.lights(null);
    await S.fade(1, 500);
    await S.narr('你撞开门，跌跌撞撞穿过黑漆漆的院子。\n身后，滴答，滴答。\n你拔开大门的门闩，一头扎进了夜里。');
    S.sfx('bad');
    return S.end({ bad: true, id: 'flee', title: '夜逃', text: '我连夜逃出了铁山，官印都没顾上拿。\n后来听说，朝廷又派了第六任府使。\n他也死在了上任的头一夜。\n\n有时候我会梦见那间东轩。\n灯下跪着一个浑身湿透的姑娘，抬着头，\n等我问她一句话。\n\n我始终没有问。' });
  }

  /* ================= 白天：裴家 ================= */
  async function heoTalk(S) {
    const f = S.f; S.face('heo', 'pl');
    if (!f.heo1) {
      f.heo1 = true;
      await S.say('许氏', ['哎哟，府使大人亲自上门……民妇有失远迎。', '大人是为蔷花那丫头来的吧？家门不幸。好好一个姑娘家，做出那种事，连夜跑了，老爷差点没气死。']);
      await S.say('许氏', ['大人要是不信——那晚从她褥子里落下来的东西，民妇用布包着，留着呢。', '好叫人知道，民妇没冤枉她。']);
      return;
    }
    if (S.has('dowry')) return S.say('许氏', '……大人翻老爷的箱子做什么？那是我们裴家的东西。');
    return cyc('许氏', [
      '大人尽管查。我们裴家清清白白。',
      '红莲？那孩子心眼小，想姐姐想得魔怔了，自己跑出去的。',
      '民妇一个后娘，平日里对她们比亲生的还好。街坊谁不知道？'
    ], '_heo')(S);
  }
  async function baeTalk(S) {
    const f = S.f; S.face('bae', 'pl');
    if (f.key) return S.say('裴座首', '箱子开着……大人，都拿去吧。要什么都拿去。');
    if (S.has('shoe')) {
      await S.narr('你把那只湿透的绣花鞋，放在他面前。');
      S.sfx('cry');
      await S.narr('裴座首盯着那只鞋看了很久。\n鞋面上绣着一枝蔷薇——是她娘生前一针一针教她绣的。');
      await S.say('裴座首', ['……这是蔷花的鞋。', '她走的那晚，穿的就是这双。', '不是去外婆家了吗？……怎么会在池子里？怎么会……']);
      await S.say('裴座首', ['是我糊涂。许氏拿那团东西给我看，我连看都没敢细看，就叫长锁连夜送她走……', '……箱子钥匙在这儿。她们娘留下的东西，都在里面。我一直没脸打开。']);
      f.key = true; S.toast('获得：箱子的钥匙');
      return;
    }
    return cyc('裴座首', [
      '……大人。家丑，家丑啊。',
      '蔷花……那孩子从小就懂事。我怎么也想不到……可那东西，我是亲眼看见的。',
      '红莲走的那天早上，窗外有只鸟一直叫。我嫌吵，拿竹竿把它赶走了。……要是没赶走就好了。'
    ], '_bae')(S);
  }
  async function jangTalk(S) {
    const f = S.f; S.face('jang', 'pl');
    if (S.has('sleeve')) { S.bubble('jang', '!', 1200); return S.say('长锁', ['……看、看什么看！', '那件褂子早扔了！谁知道被谁捡去挂在哪儿！']); }
    return cyc('长锁', [
      '……看什么看！耳朵？山里砍柴，摔的！',
      '那晚？我送她到外婆家村口就回来了。后面的事我不知道！',
      '（他劈柴的手一直在抖。吊着的那条胳膊，绷带上渗着黄水。）'
    ], '_jang')(S);
  }
  async function yumoTalk(S) {
    const f = S.f; S.face('yumo', 'pl');
    const n = f.ymN = (f.ymN || 0) + 1;
    if (n === 1) {
      await S.narr('井边洗衣裳的老妇人，看见你，先往大厅那边瞟了一眼。');
      await S.say('乳母', ['大人……夫人在那边，老身不敢多嘴。', '……老身是两位小姐的乳母。她们是吃我的奶长大的。'], { style: 'whisper' });
      await S.say('乳母', ['出事前一天，库房的鼠笼里逮着一只耗子，这么大——（她比了一下，比猫还大）', '第二天一早，笼子空了。夫人一个人在灶房里烧东西，不许人进去。', '……然后，大小姐的褥子里，就有了「那个」。'], { style: 'whisper' });
      return;
    }
    if (n === 2) return S.say('乳母', ['那天夜里长锁少爷出门，天快亮才回来。满身是血，耳朵没了，胳膊也耷拉着。', '说是山里摔的。……山里，哪有那么大的口子。'], { style: 'whisper' });
    return S.say('乳母', ['二小姐那几天天天哭。走之前，在她们屋里写了点什么。', '老身不识字。纸还在小桌上，夫人没瞧见。'], { style: 'whisper' });
  }
  async function trapUse(S) {
    const c = S.ent('cage');
    if (S.has('trap')) return S.narr('鼠笼已经拿走了。地上只剩一圈压痕。');
    c.open = true; S.give('trap');
    await S.narr('角落里一只木头鼠笼。笼门开着，诱饵还在。\n笼底，一片干了的黑血。笼子里关过的东西，是被人「取」出去的。');
  }
  async function ashUse(S) {
    const a = S.ent('ash');
    if (S.has('fur')) return S.narr('灰坑被你翻过了。灰里只剩些碎骨渣。');
    a.s.dug = true; S.give('fur'); S.sfx('paper');
    await S.narr('你拿火钩拨开灰坑。\n底下埋着一团东西，没烧透——\n一张灰色的毛皮，剥得很仔细，还连着一截细长的尾巴。');
    await S.think('（……杀鸡杀兔，哪来这样的尾巴。）');
  }
  async function yoUse(S) { await S.narr('蔷花的褥子。洗过了，可上面还留着一片褪不掉的暗渍。\n你凑近了看——暗渍边上，粘着几根灰色的短毛。'); }
  async function deskGirls(S) {
    const t = S.ent('girlsdesk');
    if (!t.s.taken) {
      t.s.taken = true; S.give('letter', true); S.toast('获得：红莲的字条');
      await S.narr('小桌上压着一张纸。字是小孩子的字，写得很用力。');
      await S.note('letter');
      return;
    }
    await S.narr('小桌上的针线笸箩里，有一只绣了一半的荷包。\n一面是蔷薇，一面是莲花。');
  }
  async function chestUse(S) {
    const f = S.f, c = S.ent('dchest');
    if (S.has('dowry')) return S.narr('箱子里叠着张氏的旧衣裳，一股樟脑味。');
    if (!f.key) return S.narr('一只描金的木箱，挂着铜锁。\n锁上积了灰——好几年没人开过了。');
    c.open = true; S.sfx('open'); S.give('dowry', true); S.toast('获得：张氏的嫁妆单');
    await S.narr('铜锁「咔」地开了。\n箱底压着一张发黄的单子。');
    await S.note('dowry');
    await S.think('（「二女若皆亡，尽归裴门」……裴门。也就是许氏的三个儿子。）');
    dayGoal(S);
  }
  async function baeEnter(S, first) {
    if (first) {
      await S.narr('裴座首家。\n瓦房，院子扫得干干净净，酱缸擦得发亮。\n看不出这户人家，一年里没了两个女儿。');
    }
    dayGoal(S);
  }

  /* ================= 白天：池塘 ================= */
  const BIRD = [[6, 12], [14, 12], [21, 11], [22, 9]];
  async function glide(S, id, tx, ty, ms) {
    const e = S.ent(id), x0 = e.px, y0 = e.py, x1 = tx * TS, y1 = ty * TS, n = Math.max(1, Math.round(ms / 50));
    for (let i = 1; i <= n; i++) { e.px = x0 + (x1 - x0) * i / n; e.py = y0 + (y1 - y0) * i / n - Math.sin(Math.PI * i / n) * 18; e.fr = i % 2; await S.wait(50); }
    e.x = tx; e.y = ty; e.fr = 0;
  }
  async function birdUse(S) {
    const f = S.f, k = f.bird || 0;
    chirp(S, .07);
    if (k >= 3) return S.narr('青鸟停在芦苇尖上，安安静静的，不叫了。');
    const lines = ['柳树底下站着一只青色的小鸟。\n你一走近，它就扑棱棱飞起来，落到了前面的岸边。\n……回头看着你。', '青鸟又往前飞了一段，落在芦苇边上。\n叫了两声，像在催你。', '青鸟飞进了芦苇丛，停在一根芦苇尖上，不动了。\n底下的泥水里，有一点粉红色。'];
    await S.narr(lines[k]);
    f.bird = k + 1;
    await glide(S, 'bird', BIRD[k + 1][0], BIRD[k + 1][1], 900);
    if (f.bird === 3) { S.show('shoe'); S.sfx('chime'); S.goal('芦苇边的泥水里，有东西'); }
  }
  async function shoeUse(S) {
    S.hide('shoe'); S.give('shoe');
    await S.narr('一只绣花鞋，半埋在芦苇根的泥里。\n粉红色的鞋面，绣着一枝蔷薇。鞋里灌满了水。');
    await S.think('（「潜逃外家」。……她连池塘都没走出去。）');
    dayGoal(S);
  }
  async function brambleUse(S) {
    const b = S.ent('bramble');
    if (b.s.taken) return S.narr('荆棘丛被扯开了一个口子，枝条上还挂着几根线头。');
    b.s.taken = true; S.give('sleeve');
    await S.narr('荆棘上挂着半截袖子。粗布，袖口打着补丁，上面一大片发黑的血。\n地上有好几个碗口大的爪印，一直延到林子里去。');
    growl(S, .05);
    await S.think('（这么大的爪子……是老虎。）');
    dayGoal(S);
  }
  async function fisherTalk(S) {
    const f = S.f; S.face('fisher', 'pl');
    if (f.ph === 'after') return S.say('渔翁', '大人，乡亲们都来了。……开闸吧。');
    return cyc('渔翁', [
      ['大人也来看池子？……这池子，打那以后就没人敢来打鱼了。', '那天夜里我在这儿下网。听见池边有人喊「救命」——是个男人的声音。还有……老虎叫。', '第二天，裴家的大小子就少了一只耳朵。'],
      ['那只青鸟啊，打那以后天天落在池边的柳树上，赶都赶不走。', '老辈人说，青鸟是给人带路的。'],
      ['九月了，荷叶都枯了，就池子当中那几朵红莲开得正好。', '……您说怪不怪。']
    ], '_fish')(S);
  }
  async function waterUse(S) {
    const f = S.f;
    if (f.ph === 'after') return;
    if (S.once('water1')) { S.sfx('heart'); return S.narr('池水黑沉沉的，一丝风都没有。\n你低头看——水底下，好像有两个人影。\n手牵着手。'); }
    await S.narr('池水黑沉沉的。你的影子映在上面，后面……什么都没有。');
  }
  async function pondEnter(S, first) {
    const f = S.f;
    if (f.ph === 'after') return drainScene(S);
    if (first) { await S.narr('城外的池塘。四面是柳树和芦苇。\n明明是正午，这里却凉飕飕的，连蝉都不叫。'); }
    dayGoal(S);
  }
  function pondTick(S, dt) {
    const f = S.f; if (W.busy || f.ph !== 'day') return;
    f._ch = (f._ch ?? 3) - dt; if (f._ch <= 0) { f._ch = 4 + Math.random() * 5; if ((f.bird || 0) < 3) chirp(S, .035); }
  }

  /* ================= 银子 ================= */
  async function bribe(S) {
    const f = S.f;
    S.show('steward'); S.show('silver'); S.face('steward', 'pl');
    S.cp('bribe');
    await S.narr('一进大门，就有个穿绸褂子的人迎上来。\n他身后摆着一只红漆木箱。');
    await S.say('许家管事', ['小人是许家的管事。夫人说，大人新官上任，开销大……一点心意。', '裴家那桩事，本来就是家丑。大人按裴家报上来的，结了就是。大家都清净。']);
    S.ent('silver').open = true; S.sfx('chime');
    await S.narr('箱盖掀开一条缝。白花花的，全是银锭。');
    const r = await S.ask('「大人？」', ['（收下银子，按「失节潜逃」结案）', '「拿回去。告诉许氏，明日升堂。」']);
    if (r === 0) return silverEnd(S);
    await S.narr('管事的脸色变了变，赔着笑，叫人把箱子抬走了。');
    S.hide('steward'); S.hide('silver');
    f.bribed = true; f.ph = 'trialwait';
    S.goal('升堂——跟金吏房说一声（两人：一人翻案卷念供词，一人挑证物）');
    S.cp('trial');
  }
  async function silverEnd(S) {
    S.sfx('item');
    await S.narr('那天夜里，银箱就摆在东轩的书案底下。\n你睡得很沉。');
    await S.fade(1, 600);
    await S.narr('……半夜，你被冷醒了。\n地板是湿的。银箱的盖子开着。\n里面没有银子——全是黑乎乎的、池底的淤泥。泥里缠着一缕长头发。');
    await S.scare('face', { spr: '@jangF', face: 'jangF', dur: 1.2 });
    S.fx('red');
    return S.end({ bad: true, id: 'silver', title: '一箱银子', text: '第二天，案子按许氏说的结了：\n蔷花失节潜逃，红莲下落不明。\n\n我在铁山做了三年太平官。\n只是每年秋天，东轩的地板上，\n总有两滩擦不干的水。' });
  }

  /* ================= 升堂 ================= */
  const TRIAL = ['heoT', 'jangT', 'baeT', 'yumoT', 'run1', 'run2', 'bundle'];
  function trialStage(S, on) {
    TRIAL.forEach(i => S.show(i, on));
    if (on) { S.place('kim', 9, 5, 0); S.show('bok'); S.place('bok', 14, 5, 0); }
    else { S.place('kim', 8, 9, 0); S.place('bok', 15, 10, 0); S.hide('ojakT'); }
  }
  async function trialStart(S) {
    const f = S.f;
    const r = await S.ask('「升堂？」', ['升堂', '再等等']);
    if (r) return;
    f.ph = 'trial'; f.awe = 6;
    await S.fade(1, 600);
    trialStage(S, true); S.pos(11, 5, 0);
    await S.fade(0, 600);
    gavel(S); await S.wait(300);
    S.tone('triangle', 220, 200, .6, .06, 0, 900); S.tone('triangle', 165, 150, .7, .05, .1, 900);
    await S.narr('衙役们拄着水火棍，齐声喝了一声堂威。\n府衙门口挤满了看热闹的百姓——三年来，铁山头一回升堂。');
    await S.narr('许氏、长锁跪在阶下。裴座首被人搀着，跪在一边。\n乳母缩在人群里，攥着衣角。');
    S.goal('驳倒许氏：她每说一句，就出示能驳倒她的证物（两人：一人念案卷，一人挑证物）');
    if (!(await round1(S))) return;
    if (!(await present(S, 'r2', '许氏：「……就、就算民妇看走了眼！那丫头自己心里有鬼，连夜跑了，说不定早跟野男人——」\n——蔷花，真的「跑了」吗？', ['shoe'], ['金吏房（小声）：「案卷上写她『潜逃外家』……可外家那边说，从没见过她。」', '金吏房：「城外的池塘。那只青鸟落过的芦苇边。」', '金吏房：「大人，出示池边找到的绣花鞋。」']))) return;
    S.face('yumoT', 3);
    await S.say('乳母', '那是小姐的鞋！是她娘教她绣的蔷薇！小姐那晚穿着它出的门！', { style: 'big' });
    await S.narr('百姓里一阵哗然。\n一只鞋，在城外池塘的芦苇里。——她根本没走到外婆家。');
    crowd(S); gavel(S);
    S.face('jangT', 3);
    await S.say('长锁', ['我、我把她送到外婆家村口就回来了！', '这耳朵是上山砍柴，自己摔的！']);
    if (!(await present(S, 'r3', '长锁那一夜，到底去了哪里？', ['sleeve'], ['金吏房：「他说他在山里摔的……可那天夜里，城外的池塘边有人喊救命。」', '金吏房：「池塘小路边的荆棘丛，地上有爪印的地方。」', '金吏房：「大人，出示荆棘上的那半截袖子。」']))) return;
    await S.narr('衙役把那半截袖子往长锁身上一比——\n补丁对补丁，针脚对针脚。');
    S.bubble('jangT', '!', 1400); S.sfx('cry');
    await S.say('长锁', ['……是娘！是娘叫我的！', '她说，送到池子边上，推下去，就说她自己跑了……', '我推了……她在水里喊我弟弟……然后林子里，林子里蹿出来一只老虎——'], { style: 'big' });
    growl(S, .06);
    await S.narr('长锁捂着没了耳朵的那半边脑袋，趴在地上哭嚎起来。');
    S.face('heoT', 3);
    await S.say('许氏', ['他胡说！他被老虎吓傻了！', '民妇一个妇道人家，害她们姐妹，图什么？！']);
    if (!(await present(S, 'r4', '图什么？', ['dowry'], ['金吏房：「两位小姐的亲娘张氏，当年陪嫁很厚……」', '金吏房：「裴座首屋里那只上锁的箱子。」', '金吏房：「大人，出示张氏的嫁妆单。」']))) return;
    await S.narr('你把嫁妆单当堂念了一遍。\n「良田二十石落，奴婢四口，白银三百两……留与二女为嫁资。二女若皆亡，尽归裴门。」');
    await S.say('你', '尽归裴门——也就是归你的三个儿子。');
    await S.narr('许氏张了张嘴，什么也没说出来。\n过了很久，她瘫坐在地上。');
    await S.say('许氏', '……那块地，那些银子……本来就该是我儿子的……', { style: 'whisper' });
    gavel(S); await S.wait(300); gavel(S); await S.wait(300); gavel(S);
    await S.narr('许氏、长锁当堂画押，收监。\n案情具状，呈报观察使定罪。');
    S.face('baeT', 3);
    await S.say('裴座首', ['大人……是我糊涂。', '我是她们的爹。我连看都没细看一眼，就把亲生女儿赶出了门……', '大人怎么判，我都认。']);
    const m = await S.ask('裴座首，怎么发落？', ['念他受人蒙蔽，悔过真切，从轻发落', '纵容继室，害死亲女，一并重罚']);
    f.mercy = m === 0;
    await S.narr(f.mercy ? '你判裴座首杖责、罚粮，放他回家。\n他磕了三个头，额头磕出了血。' : '你判裴座首一并收监，听候观察使发落。\n他没有求饶，只是一直看着衙门外面，池塘的方向。');
    await S.say('乳母', '大人……两位小姐，还在池子里。', { style: 'whisper' });
    await S.fade(1, 600);
    trialStage(S, false);
    await S.fade(0, 600);
    f.ph = 'after';
    S.goal('去城外的池塘，把姐妹俩接上来');
    S.cp('after');
  }
  async function round1(S) {
    const f = S.f;
    S.face('heoT', 3); S.ent('bundle').open = false;
    await S.say('许氏', ['大人请看。', '这就是那晚从蔷花褥子里落下来的东西。老爷亲眼看见的！']);
    const a = await present(S, 'r1', '许氏捧着那团布包。\n——那团东西，究竟是什么来路？', ['trap', 'fur'], ['金吏房（小声）：「她说那是『胎』……可裴家那几天，不是在闹耗子吗？」', '金吏房：「乳母说过——库房里的鼠笼，还有灶房里的灰坑。」', '金吏房：「大人，出示那只空鼠笼，或者灰坑里的毛皮。」']);
    if (!a) return false;
    const other = a === 'trap' ? 'fur' : 'trap';
    if (a === 'trap') await S.say('许氏', '灶房闹耗子，逮着一只有什么稀奇？早扔了！');
    else await S.say('许氏', '杀鸡剥兔，灶房里哪天没有几张皮？');
    const b = await present(S, 'r1b', a === 'trap' ? '扔了？那只比猫还大的耗子，到底去哪儿了？' : '兔子？兔子哪有这么长的尾巴。——这张皮原先长在什么东西身上，关在哪儿？', [other], ['金吏房：「两样东西，得凑在一起看。」', a === 'trap' ? '金吏房：「灶房的灰坑。」' : '金吏房：「库房里的鼠笼。」', '金吏房：「大人，出示' + EVN[other] + '。」']);
    if (!b) return false;
    for (;;) {
      const r = await S.ask('「来人——」', ['叫仵作，当堂剖开那团东西', '叫许氏把它收好，改日再审', '让裴座首再认一认']);
      if (r === 0) break;
      if (r === 1) { if (!(await wrongCost(S, '许氏松了一口气，嘴角往上一翘。\n衙役们面面相觑。'))) return false; continue; }
      await S.narr('裴座首看了一眼，就别过脸去。\n「……我那晚，就是看了这一眼。」');
    }
    S.show('ojakT'); S.place('ojakT', 11, 9, 3);
    await S.narr('仵作把布包摊在地上，小刀一划——');
    S.ent('bundle').open = true; S.sfx('cut');
    await S.narr('里面没有骨头，没有胎形。\n只有一团剥了皮的肉，肚子里塞满了黑乎乎的、米粒大的东西。');
    await S.say('仵作', ['回大人……是耗子屎。', '这是一只剥了皮的大耗子。']);
    crowd(S); gavel(S);
    await S.narr('百姓里炸开了锅。');
    S.face('baeT', 3);
    await S.say('裴座首', '耗子……我……我把亲生女儿……就为了一只耗子……', { style: 'whisper' });
    S.hide('ojakT');
    return true;
  }
  /* 出示证物：答错扣威信、按错几次给逐级提示；威信扣光就退堂（从检查点重来） */
  async function present(S, k, q, ok, hints) {
    const f = S.f;
    for (;;) {
      const ids = Object.keys(EVN).filter(i => S.has(i));
      const r = await S.ask(q, ids.map(i => '出示：' + EVN[i]).concat(['（翻看案卷）']), '');
      if (r === ids.length) { await S.note('case'); continue; }
      const id = ids[r];
      if (ok.includes(id)) { gavel(S); S.sfx('good'); return id; }
      const n = f['w_' + k] = (f['w_' + k] || 0) + 1;
      const WR = {
        trap: '许氏：「一只破鼠笼？大人这是要审耗子？」', fur: '许氏：「一张烂皮子，跟这事有什么相干？」',
        shoe: '许氏：「一只鞋？谁家没有鞋！」', sleeve: '许氏：「破布条子也拿来当证据？」',
        dowry: '许氏：「嫁妆单子？大人这是要查我们家的账？」', letter: '裴座首（发抖）：「这是……红莲的字……」\n许氏：「小丫头做梦的胡话，也算数？」'
      };
      if (!(await wrongCost(S, WR[id] || '许氏冷笑了一声。', n))) return null;
      if (n >= 2) await S.say('', hints[Math.min(n, 4) - 2]);
    }
  }
  async function wrongCost(S, line, n) {
    const f = S.f;
    f.awe = (f.awe ?? 6) - 1; S.sfx('bad');
    await S.say('', line);
    crowd(S);
    if (f.awe <= 0) {
      await S.narr('百姓们交头接耳，有人笑出了声。\n许氏端端正正地磕了个头：「大人断不了，民妇告退。」');
      await S.die('这一堂，你输了。\n那天夜里，东轩的地板上，又是两滩水。', '退堂');
      return false;
    }
    if (n === 2) { drip(S, .08); S.shake(200, 1); await S.narr('堂上一阵阴风。\n你的手背上，落了一滴冰凉的水。'); }
    S.toast('威信 -1（还剩 ' + f.awe + '）');
    return true;
  }

  /* ================= 平冤 ================= */
  async function drainScene(S) {
    const f = S.f;
    if (f.drained) return;
    ['vil1', 'vil2', 'kimP', 'baeP', 'yumoP'].forEach(i => S.show(i));
    S.show('baeP', f.mercy);
    S.hide('bird');
    await S.narr('池塘边站满了人。\n乡亲们扛着锄头、提着木桶，谁也没说话。');
    await S.say('金吏房', '大人，开闸吧。');
    S.sfx('water'); S.amb('river');
    for (let i = 0; i < 4; i++) {
      DEEP.forEach(([x, y]) => { const d = ((x - 15.5) / 7.6) ** 2 + ((y - 6.8) / 4.4) ** 2; if (d >= 1 - (i + 1) * .25 && d < 1 - i * .25 + .001) S.tile(x, y, 'u', 'pond'); });
      ['lotus1', 'lotus2', 'lotus3', 'lotus4'].forEach((id, j) => { if (j <= i) S.hide(id); });
      await S.wait(700);
    }
    S.amb('wind');
    S.show('sh1'); S.show('sh2'); S.focus(15, 7);
    await S.narr('水一点一点退下去。\n池底的淤泥里，躺着两个姑娘。\n手牵着手。');
    await S.narr('过了这么久，她们的脸还像睡着了一样。\n连头发上的水草，都是青的。');
    S.focus(null);
    if (f.mercy) await S.say('裴座首', '蔷花……红莲……爹来接你们了……', { style: 'whisper' });
    await S.say('乳母', '小姐……', { style: 'whisper' });
    await S.fade(1, 900);
    S.hide('sh1'); S.hide('sh2'); S.show('mound'); S.show('stele');
    S.place('kimP', 4, 7, 3); S.place('yumoP', 2, 7, 3); S.place('baeP', 5, 6, 1);
    await S.card('三天以后', '', '两个姑娘换上了干净的衣裳，葬在池塘边的山坡上。\n乡亲们凑钱立了一块碑。\n碑上刻着：蔷花红莲之墓。');
    await S.fade(0, 900);
    f.drained = true;
    S.goal('在碑前上一炷香');
  }
  async function steleUse(S) {
    const f = S.f, st = S.ent('stele');
    if (f.ph !== 'after' || !f.drained) return;
    if (st.lit) return;
    st.lit = true; st.flowers = true; S.sfx('match');
    await S.narr('你点了一炷香，插在碑前。\n烟直直地往上走，一点都不散。');
    if (S.has('letter')) {
      await S.narr('你把红莲的字条折好，压在了香炉底下。');
      f.letterBack = true;
    }
    await S.fade(1, 900);
    S.ent('lamp').off = false;
    await S.go('dongheon', 6, 3, 0, { fade: false });
    S.dark(.8);
    S.show('hongD'); S.show('jangD'); S.face('hongD', 3); S.face('jangD', 3);
    await S.fade(0, 900);
    return finale(S);
  }
  async function finale(S) {
    const f = S.f;
    await S.narr('那天夜里，我又坐在东轩的书案后面。\n三更。灯没有灭。');
    await S.narr('门开了。进来两个姑娘。\n衣裳是干的。头发梳得整整齐齐，辫梢上系着红头绳。');
    await S.say('红莲', ['大人。', '姐姐的名声，回来了。']);
    await S.say('蔷花', ['……谢谢您。', '谢谢您那天夜里，问了我们一句。']);
    await S.narr('两个人对着你，又拜了一拜。\n这一回，你看清了她们的脸。');
    await S.fade(1, 1200);
    await S.card('后来', '', '那年冬天，铁山再没有府使死在东轩里。\n福童到处跟人说，新来的府使大人，连鬼都给他磕头。\n\n我没有纠正他。');
    if (f.mercy && f.letterBack) return S.end({ id: 'twins', title: '第二十二夜　完（并蒂）', text: '又过了两年，裴座首续了弦。\n第二年春天，他家里添了一对孪生女儿。\n\n他抱着两个孩子来府衙道谢，求我给起个名字。\n我还没开口，他自己先哭了：\n「大人，就叫蔷花、红莲吧。」\n\n两个孩子的后颈上，各有一颗小小的红痣，像一粒莲子。\n乳母说，她们一生下来，就不怕水。' });
    return S.end({ id: 'pingyuan', title: '第二十二夜　完', text: '池塘边的山坡上，那块碑一直立着。\n每年九月，池子里还是会开几朵红莲。\n开在荷叶都枯了的时候，开得正红。\n\n铁山的老人说，那是两个姑娘回来看看。\n她们的衣裳，是干的。' });
  }

  /* ================= 地图 ================= */
  function MAPS() {
    return {
      /* ---------------- 铁山府衙 ---------------- */
      gwana: {
        amb: 'wind', dark: .12, plr: 3.4, wall: 'wood', floor: 'lightwood', legend: LEG, tileOpts: { treeC: '#3a4a2e' },
        rows: gwanaRows(),
        ents: [
          { id: 'plaque', x: 10, y: 2, w: 2, spr: 'plaque', solid: true, on: N('东轩的匾额。金字已经褪成了土黄色。') },
          { id: 'dongdoor', x: 11, y: 3, spr: 'mun', to: ['dongheon', 6, 8, 3] },
          { x: 8, y: 3, spr: 'changho', on: N('东轩的窗。窗纸破了几个洞，用别的纸补过。') },
          { x: 15, y: 3, spr: 'changho', on: N('窗底下的地板上，有一圈洗不掉的水渍。') },
          { id: 'clerkdoor', x: 20, y: 7, spr: 'storedoor', on: clerkDoor },
          { id: 'storedoor', x: 3, y: 7, spr: 'storedoor', text: '库', on: storeDoor },
          { id: 'gate', x: 11, y: 15, w: 2, spr: 'gate', on: gateUse },
          { x: 2, y: 10, spr: 'drum', on: drumUse },
          { x: 21, y: 10, spr: 'stonelantern', on: N('石灯笼。里头积了一窝落叶。') },
          { x: 6, y: 12, spr: 'onggi', on: N('墙根下的水缸。缸沿上长了一圈青苔。') },
          { x: 17, y: 12, spr: 'woodpile', on: N('柴火码得整整齐齐。是前任府使到任那天码的，一根也没烧。') },
          { id: 'kim', x: 8, y: 9, spr: '@kim', dir: 0, on: kimTalk },
          { id: 'bok', x: 15, y: 10, spr: '@bok', dir: 0, on: bokTalk },
          { id: 'steward', x: 10, y: 13, spr: '@steward', hidden: true, dir: 3, on: S => S.say('许家管事', '大人……') },
          { id: 'silver', x: 9, y: 13, spr: 'silver', hidden: true, on: N('红漆木箱。') },
          { id: 'heoT', x: 10, y: 9, spr: '@heo', hidden: true, dir: 3, on: N('许氏跪得笔直。') },
          { id: 'jangT', x: 13, y: 9, spr: '@jang', hidden: true, dir: 3, on: N('长锁的眼睛一直往门外瞟。') },
          { id: 'baeT', x: 15, y: 10, spr: '@bae', hidden: true, dir: 3, on: N('裴座首佝偻着背，像一夜老了十岁。') },
          { id: 'yumoT', x: 7, y: 12, spr: '@yumo', hidden: true, dir: 3, on: N('乳母攥着衣角，嘴唇一直在动。') },
          { id: 'run1', x: 8, y: 7, spr: '@runner', hidden: true, dir: 2, on: N('衙役拄着水火棍，目不斜视。') },
          { id: 'run2', x: 15, y: 7, spr: '@runner', hidden: true, dir: 1, on: N('衙役拄着水火棍，目不斜视。') },
          { id: 'ojakT', x: 11, y: 9, spr: '@ojak', hidden: true, dir: 3 },
          { id: 'bundle', x: 10, y: 10, spr: 'bundle', hidden: true, solid: false, on: N('一团用白布包着的东西。布上渗着发黑的血迹。') }
        ],
        enter: gwanaEnter
      },
      /* ---------------- 东轩 ---------------- */
      dongheon: {
        amb: 'room', dark: .3, plr: 3, wall: 'paper', floor: 'lightwood', legend: LEG,
        rows: dongRows(),
        ents: [
          { id: 'win', x: 10, y: 1, spr: 'changho', on: winUse },
          { x: 3, y: 1, spr: 'changho', on: N('朝西的窗。插销上缠着一圈红线，不知道是哪一任府使缠的。') },
          { x: 4, y: 2, w: 4, spr: 'byeong', on: N('屏风上画着山水。右下角有一方朱印，被水泡得洇开了。') },
          { id: 'seat', x: 6, y: 3, spr: 'cushion', solid: false, on: seatUse },
          { id: 'desk', x: 6, y: 4, w: 2, spr: 'seoan', on: deskUse },
          { id: 'lamp', x: 8, y: 4, spr: 'deung', light: { r: 4.6, col: 'rgba(255,190,110,.22)', flick: true }, on: lampUse },
          { id: 'rack', x: 1, y: 2, spr: 'rack', on: rackUse },
          { x: 2, y: 2, spr: 'bookshelf', on: N('书架上是历任府使留下的书。有一本《无冤录》，书页翻得起了毛边。') },
          { x: 12, y: 2, spr: 'chestK', on: N('放官印的箱子。官印用黄布包着，沉甸甸的。') },
          { x: 2, y: 6, spr: 'brazier', off: true, on: N('火盆里的炭早就冷了。') },
          { id: 'wet1', x: 6, y: 8, spr: 'wetp', decal: true, hidden: true, solid: false },
          { id: 'wet2', x: 6, y: 7, spr: 'wetp', decal: true, hidden: true, solid: false },
          { id: 'wet3', x: 6, y: 6, spr: 'wetp', decal: true, hidden: true, solid: false },
          { id: 'pud', x: 6, y: 5, spr: 'puddle2', decal: true, hidden: true, solid: false, on: N('一滩水。凉得刺骨。\n水里漂着一小片枯荷叶。') },
          { id: 'hong', x: 6, y: 8, spr: '@hong', hidden: true, solid: false, dir: 3 },
          { id: 'jangG', x: 7, y: 7, spr: '@jangG', hidden: true, solid: false, dir: 3 },
          { id: 'kimD', x: 5, y: 7, spr: '@kim', hidden: true, dir: 3 },
          { id: 'bokD', x: 7, y: 8, spr: '@bok', hidden: true, dir: 3 },
          { id: 'hongD', x: 6, y: 6, spr: '@hongD', hidden: true, solid: false, dir: 3 },
          { id: 'jangD', x: 7, y: 6, spr: '@jangD', hidden: true, solid: false, dir: 3 },
          { x: 6, y: 9, spr: 'invisible', touch: dongDoor }
        ],
        tick: dongTick,
        async enter(S, first) {
          const f = S.f;
          if (f.ph === 'prep' && first) {
            await S.narr('东轩里收拾得很干净，干净得不像有人住过。\n书案后的方席正对着门。书案上，摊着一本册子。');
            prepGoal(S);
          } else if (f.ph === 'prep') prepGoal(S);
          if (f.ph === 'day' || f.ph === 'trialwait') S.ent('win').lit = true;
        }
      },
      /* ---------------- 裴座首家 ---------------- */
      bae: {
        amb: 'wind', dark: .1, plr: 3.4, wall: 'mud', floor: 'lightwood', legend: LEG, tileOpts: { treeC: '#5a4a2a' },
        rows: baeRows(),
        ents: [
          /* 姐妹的屋 */
          { id: 'yo', x: 2, y: 3, h: 2, spr: 'yo', on: yoUse },
          { id: 'girlsdesk', x: 5, y: 3, spr: 'lowtbl', on: deskGirls },
          { x: 7, y: 2, spr: 'chestK', on: N('姐妹俩的衣箱。最上面叠着两件一模一样的绿色小袄，一件大一点，一件小一点。') },
          { x: 1, y: 5, spr: 'mirror', on: N('一面小铜镜。镜面擦得很亮，照出你身后空荡荡的屋子。') },
          /* 大厅 */
          { id: 'heo', x: 12, y: 4, spr: '@heo', dir: 0, on: heoTalk },
          { x: 10, y: 2, spr: 'chestK', on: N('大厅里的木柜，摆着裴家的祖先牌位。牌位前供着新鲜的柿子。') },
          { x: 15, y: 2, spr: 'scroll', on: N('墙上挂着一幅字：「家和万事兴」。') },
          /* 裴座首的屋 */
          { id: 'bae', x: 21, y: 3, spr: '@bae', dir: 0, on: baeTalk },
          { id: 'dchest', x: 23, y: 2, spr: 'chestK', on: chestUse },
          { x: 19, y: 2, spr: 'bookshelf', on: N('书架上的书落满了灰。只有一本族谱，像是最近被人翻过。') },
          /* 院子 */
          { x: 3, y: 8, spr: 'well', on: N('井水很凉。井绳上系着一只小小的红布条。') },
          { id: 'yumo', x: 5, y: 8, spr: '@yumo', dir: 1, on: yumoTalk },
          { id: 'jang', x: 15, y: 9, spr: '@jang', dir: 0, on: jangTalk },
          { x: 16, y: 9, spr: 'woodpile', on: N('劈好的柴。长锁只用一只手劈，劈得歪歪扭扭。') },
          ...[19, 20, 21].map(x => ({ x, y: 8, spr: 'onggi', on: N('酱缸台上的酱缸，擦得锃亮。') })),
          /* 灶房 */
          { x: 1, y: 11, w: 2, spr: 'stoveK', on: N('灶上两口大铁锅。灶膛里还有余温。') },
          { id: 'ash', x: 5, y: 13, spr: 'ashpit', on: ashUse },
          { x: 1, y: 15, spr: 'onggi', on: N('水缸。水面上漂着一只葫芦瓢。') },
          /* 库房 */
          { id: 'cage', x: 23, y: 13, spr: 'cage', on: trapUse },
          { x: 20, y: 12, spr: 'sack', on: N('米袋子。袋口被什么东西咬了个洞。') },
          { x: 24, y: 12, spr: 'sack', on: N('一袋黄豆。') },
          { x: 22, y: 15, spr: 'barrel', on: N('木桶里是腌菜，盐味冲鼻子。') },
          { x: 12, y: 17, spr: 'invisible', touch: async S => S.go('gwana', 11, 14, 3) },
          { x: 13, y: 17, spr: 'invisible', touch: async S => S.go('gwana', 12, 14, 3) }
        ],
        enter: baeEnter
      },
      /* ---------------- 城外池塘 ---------------- */
      pond: {
        amb: 'wind', dark: .18, plr: 3.6, legend: LEG, tileOpts: { grassC: '#4a5a34', treeC: '#2e4228' }, fog: .12,
        rows: POND,
        ents: [
          { x: 5, y: 11, spr: 'willow', on: N('老柳树。垂下来的枝条拂到水面上。') },
          { x: 15, y: 14, spr: 'willow', on: N('柳树底下有一块平平的石头，像是常有人坐。') },
          { x: 21, y: 12, spr: 'willow', on: N('这棵柳树歪向水面，好像要伸手去够什么。') },
          { id: 'bird', x: 6, y: 12, spr: 'bird', solid: false, on: birdUse },
          { id: 'shoe', x: 23, y: 10, spr: 'kkotsin', hidden: true, solid: false, on: shoeUse },
          { id: 'bramble', x: 2, y: 14, spr: 'bramble', on: brambleUse },
          { x: 3, y: 15, spr: 'tracks', decal: true, solid: false, on: N('碗口大的爪印。一直往林子里去了。') },
          { x: 5, y: 14, spr: 'tracks', decal: true, solid: false, on: N('爪印旁边，泥地上有一道被拖过的痕迹。') },
          { x: 9, y: 12, spr: 'rose', on: N('岸边一丛野蔷薇，花开得乱糟糟的。\n九月了，它还在开。') },
          { id: 'fisher', x: 17, y: 14, spr: '@fisher', dir: 3, on: fisherTalk },
          { x: 12, y: 11, spr: 'boat', on: N('一条拴在岸边的小船，船底积了半舱雨水。') },
          { id: 'lotus1', x: 12, y: 6, spr: 'lotus', decal: true, solid: false },
          { id: 'lotus2', x: 17, y: 8, spr: 'lotus', decal: true, solid: false },
          { id: 'lotus3', x: 15, y: 4, spr: 'lotus', decal: true, solid: false },
          { id: 'lotus4', x: 19, y: 6, spr: 'lotus', decal: true, solid: false },
          { x: 15, y: 11, spr: 'invisible', solid: false, on: waterUse },
          { id: 'sh1', x: 15, y: 7, spr: 'shroud', hidden: true, solid: false },
          { id: 'sh2', x: 16, y: 7, spr: 'shroud', hidden: true, solid: false },
          { id: 'mound', x: 2, y: 4, w: 2, spr: 'mound', hidden: true, on: N('新堆的坟。土还是湿的。') },
          { id: 'stele', x: 3, y: 5, spr: 'stele', hidden: true, on: steleUse },
          { id: 'vil1', x: 8, y: 12, spr: '@vil', hidden: true, dir: 3, on: N('乡亲们低着头，谁也不说话。') },
          { id: 'vil2', x: 19, y: 12, spr: '@vil', hidden: true, dir: 3, on: N('「作孽啊……」') },
          { id: 'kimP', x: 6, y: 14, spr: '@kim', hidden: true, dir: 3, on: N('金吏房红着眼圈，假装在看天。') },
          { id: 'baeP', x: 10, y: 14, spr: '@bae', hidden: true, dir: 3, on: N('裴座首跪在地上，一动不动。') },
          { id: 'yumoP', x: 11, y: 14, spr: '@yumo', hidden: true, dir: 3, on: N('乳母抱着两件绿色的小袄。') },
          { x: 4, y: 17, spr: 'invisible', touch: async S => S.go('gwana', 11, 14, 3) }
        ],
        tick: pondTick,
        enter: pondEnter
      }
    };
  }

  /* ================= 章节 ================= */
  defChapter({
    id: 'janghwa', n: 22, title: '蔷花红莲', sub: '铁山府三年死了五任府使。夜里，东轩外有水声，滴答，滴答——有人浑身湿透，来告状。', origin: '韩国古典小说《蔷花红莲传》', color: '#2a3a4a',
    amb: 'wind', floor: 'lightwood', wall: 'wood', dark: .15, plr: 3.4,
    endings: { pingyuan: '第二十二夜　完', twins: '并蒂（隐藏）', flee: '夜逃', silver: '一箱银子' },
    thumb(g, w, h) {   // 湿发里的一只眼 + 池上一朵红莲
      const s = Math.max(2, Math.floor(h / 44)), ox = Math.round(w / 2 - 36 * s), oy = Math.round((h - 22) / 2 - 16 * s);
      FACES.hongF((x, y, ww, hh, c) => { g.fillStyle = c; g.fillRect(ox + x * s, oy + y * s, ww * s, hh * s); }, .8, .3);
      const R = (x, y, ww, hh, c) => { g.fillStyle = c; g.fillRect(x, y, ww, hh); };
      const lx = Math.round(w * .7), ly = h - 22 - 14;
      R(lx - 22, ly + 8, 48, 4, 'rgba(120,160,200,.18)'); R(lx - 14, ly + 6, 14, 5, '#2e5a32'); R(lx + 8, ly + 5, 12, 5, '#3a6a3a');
      R(lx - 2, ly - 6, 10, 10, '#c83a4a'); R(lx, ly - 10, 6, 5, '#e85a6a'); R(lx - 6, ly - 2, 5, 4, '#e85a6a'); R(lx + 7, ly - 2, 5, 4, '#e85a6a'); R(lx + 2, ly - 2, 2, 2, '#f8d060');
      for (let i = 0; i < 5; i++) R(ox + (6 + i * 5) * s, oy + (30 + (i % 2) * 3) * s, s, 2 * s, 'rgba(160,200,230,.6)');
    },
    people: PEOPLE,
    faces: FACES,
    items: {
      oil: { name: '一瓶灯油', desc: '库房里灌的灯油，够烧一整夜。' },
      fire: { name: '火镰和火绒', desc: '吏房抽屉里找到的。擦三下才着。' },
      trap: { name: '空鼠笼', desc: '裴家库房里的木头鼠笼。笼门开着，诱饵没动，笼底一片干了的黑血。' },
      fur: { name: '灰坑里的毛皮', desc: '裴家灶房灰坑里扒出来的一张灰毛皮，剥得很仔细，连着一截细长的尾巴。' },
      shoe: { name: '池边的绣花鞋', desc: '城外池塘芦苇根下找到的一只粉红绣鞋，鞋面绣着蔷薇。' },
      sleeve: { name: '荆棘上的袖子', desc: '池塘小路边荆棘上挂着的半截粗布袖子，袖口打着补丁，浸着黑血。' },
      dowry: { name: '张氏的嫁妆单', desc: '裴座首箱底压着的单子，是蔷花红莲的亲娘张氏的陪嫁清单。' },
      letter: { name: '红莲的字条', desc: '姐妹屋里小桌上压着的一张纸，字写得很用力。' }
    },
    notes: {
      diary: { title: '前任府使的册子', text: '（东轩书案上，一本摊开的册子。最后几行字歪歪扭扭。）\n\n初三　到任。吏属皆言东轩不可宿，余笑之。\n初三夜　二更，灯下阅案卷。窗纸无风自响。\n三更鼓起，窗忽洞开，灯灭。\n黑暗中有水声，滴答，自门外来，渐近。\n余呼左右，无一人应。余不敢视，以衾蒙首——\n\n（后面没有字了，只有一道长长的墨痕，拖到了纸边。）\n\n（册子里夹着一张更早的字条，是再前一任留下的：\n「灯油将尽。窗未闭。火镰不知何处。」）' },
      case: { title: '刑房案卷·裴门一案（抄）', text: '呈报人：座首 裴武龙\n\n一、长女蔷花，年十九。某夜于闺中小产，血污衾褥，家人共见。\n　　（继室许氏收其秽物，以布裹之为证。）\n二、蔷花自知失节，当夜潜逃外家。\n　　异母弟长锁送至半途而返，此后不知所终。\n三、长锁同夜于山中失足，伤耳及臂。\n四、旬日后，次女红莲失踪。\n\n（页边，前任李府使用朱笔批了一行小字：\n「所供多可疑。外家称未见其人。待查。」\n——这是他死前一天写的。）' },
      letter: { title: '红莲的字条', text: '爹爹：\n\n昨夜我梦见姐姐了。\n她浑身是水，头发上缠着水草，站在床边一直哭。\n她说她没有做过那样的事。\n她说她在池子里，很冷。\n\n今天早上，窗外落了一只青色的小鸟，一直冲我叫。\n我想跟它去看看。\n\n爹爹别找我。爹爹多保重。\n\n　　　　　　　　　　红莲' },
      dowry: { title: '亡室张氏妆奁记', text: '亡室张氏　妆奁记\n\n良田　二十石落（铁山东坪）\n奴婢　四口\n白银　三百两\n绸缎　若干\n\n此皆张氏陪嫁之物，\n留与二女蔷花、红莲，各半为嫁资。\n二女若皆亡，尽归裴门。\n\n　　　　　　　　　　裴武龙　手书' }
    },
    legend: '《蔷花红莲传》（장화홍련전）是朝鲜王朝后期流传的古典小说，作者不详，有汉文本和多种谚文本，情节大同小异。一般认为它取材于十七世纪中叶平安道铁山的一桩案子：据说孝宗年间，一位新到任的铁山府使审理了一桩姐妹冤死的案子，后人据此敷衍成书。小说里，铁山座首裴武龙的前妻张氏留下两个女儿蔷花、红莲；续娶的许氏把一只剥了皮的大老鼠塞进蔷花的被褥，诬她小产失节，又让儿子长锁趁夜把她带到池塘边推下水，长锁当场被林中窜出的老虎咬掉了耳朵（一说还有一条胳膊和一条腿）。红莲后来跟着一只青鸟来到池边，也没入了水中。\n\n此后，姐妹的冤魂夜夜向新任府使诉冤，接连几任府使都被吓死，铁山府一度无人敢去。直到一位胆大的府使端坐灯下，问明了冤情，第二天升堂审案：许氏拿出所谓的「胎」作证，府使命人当堂剖开，里面全是老鼠屎，真相大白。许氏和长锁被依律处死（各本刑罚的说法不一），裴武龙获释。姐妹的尸身从池中打捞上来，面色如生，被安葬立碑。不少版本还有后话：裴武龙再娶后得了一对孪生女儿，仍取名蔷花、红莲，被看作姐妹转世。\n\n这个故事在韩国家喻户晓，是「继母型」家庭小说和公案故事的代表。它背后是朝鲜民间对「冤鬼」（원귀）的观念：含冤而死的人冤情不雪，就不得安息，会一次次回来诉说，而平冤、安葬与立碑才能让亡魂安心离去。二十世纪以来它被多次搬上银幕，1924 年就有了电影改编；2003 年的电影《蔷花，红莲》（英文名 A Tale of Two Sisters）借用了姐妹与继母的框架，讲的是一个全新的现代故事，后来还有好莱坞翻拍。\n\n（本章中的尹府使、金吏房、福童、乳母、渔翁、许家管事等人物，前任府使的册子和刑房案卷的文字，灯油、火镰、关窗与端坐不动的守夜规矩，鼠笼、灰坑、袖子、嫁妆单这几样证物和升堂问答的顺序，红莲的字条，许家送银子的情节，以及孪生姐妹后颈上的红痣，均为游戏虚构。小说中对许氏相貌的丑化描写，本章没有沿用。）',
    start: { map: 'gwana', x: 11, y: 14, dir: 3 },
    resume: {
      night: async S => { nightReset(S); S.f.ph = 'night'; S.goal('端坐书案后，守着灯'); await S.think('（灯一灭，先关窗，再点灯。点着了就坐回去——别动，别出声。）'); await ev1(S, true); },
      face: async S => {
        S.clearTimer(); S.lights(null); S.ent('lamp').off = false; S.ent('win').open = false; S.dark(.84); S.plr(null); S.amb('night'); seatPl(S);
        S.place('hong', 6, 5, 3); S.ent('hong').alpha = .92; S.hide('jangG'); S.f.ns = 'face';
        await S.think('（别喊，别跑。……她是来告状的。）');
        await ev3(S);
      },
      day: async S => { ['hong', 'jangG', 'kimD', 'bokD', 'pud'].forEach(i => S.hide(i)); dayGoal(S); },
      bribe: async S => { await S.think('（许家的人还在门口等着。）'); await bribe(S); },
      trial: async S => { trialStage(S, false); S.f.ph = 'trialwait'; await S.think('（许氏每说一句，就拿证物驳她。拿不准的时候，翻翻案卷，按她说的那一条去找。）'); },
      after: async S => { trialStage(S, false); }
    },
    async intro(S) {
      S.f.ph = 'arrive';
      await S.card('第二十二夜　蔷花红莲', '朝鲜王朝·十七世纪中叶　平安道铁山', '铁山府，三年里换了五任府使。\n每一任，都死在上任的头一夜。\n\n朝廷再派人，没有人肯去。\n最后，吏曹的名册上，写下了我的名字。');
    },
    sprites: SPRITES,
    tiles: TILES,
    maps: MAPS()
  });
})();
