/* ================= 第七夜 · 雪女 ================= */
(() => {
  /* ---------------- 常量 ---------------- */
  const HUT = (x, y) => x >= 17 && x <= 24 && y >= 11 && y <= 13;          // 渡守小屋里面
  const HUTR = (x, y) => x >= 16 && x <= 25.99 && y >= 9 && y <= 14.99;    // 屋顶底下（画雪时跳过）
  const NEARF = (x, y) => Math.min(Math.abs(x - 20), Math.abs(x - 21)) + Math.abs(y - 12) <= 2;   // 地炉边
  const NIGHT = 100;                        // 前半夜要熬的秒数（真人时间；剧情对话时暂停）
  const R1 = .5;                            // 第一幕：风雪里的掉温速度（每秒）
  const OUT = 3.2, GUSTK = 1.8, MINOK = .65; // 小屋外：掉温；起白风时 ×1.8；披蓑衣 ×0.65
  const NEARW = 4.5, INW = 1.8, HUGW = 1.2;  // 有火：地炉边 / 屋里别处 回暖；挨着茂作坐 额外
  const COLD = 2.2, PLUG = .4, DOORL = .8;   // 没火：屋里掉温；每塞一道墙缝少掉；门开着多掉
  const PRE = .6;                           // 生火之前，屋里的掉温
  const BURN = 1.5, WOOD = 38, BREATH = 30; // 火每秒烧掉 / 一捆柴 / 白影吹一口气
  const CN = ['一', '二', '三', '四', '五', '六'];
  const cycle = (S, key, lines) => lines[(S.f[key] = ((S.f[key] ?? -1) + 1) % lines.length)];
  const nextTo = (S, id) => { const e = S.ent(id); if (!e || e.hidden) return false; const p = S.pl; return Math.abs(Math.round(e.px / TS) - p.x) + Math.abs(Math.round(e.py / TS) - p.y) === 1; };
  /* 死亡计数写进当前检查点（S.f 会在重来时被检查点覆盖），用于重来后的逐级提示 */
  function bumpDeath(S, key) { if (W.cp && W.cp.f) W.cp.f[key] = (W.cp.f[key] || 0) + 1; }

  /* ---------------- 合成音（S.tone，双方都听得到） ---------------- */
  const TONE = {
    /* 白风：风声忽然尖起来（低—高—细） */
    gust(S, v = 1) { S.tone('sine', 300, 780, 1.8, .05 * v, 0, 1400); S.tone('triangle', 620, 1560, 1.5, .022 * v, .25, 2600); S.tone('sine', 1560, 990, 1.3, .016 * v, 1.2, 3200); S.tone('sawtooth', 90, 70, 1.2, .02 * v, 0, 300); },
    /* 她的一口气：细长的嘶声 + 冷冷的高音 */
    breath(S) { S.sfx('whisper'); S.tone('sine', 2100, 1500, 1.7, .026, 0, 4200); S.tone('sine', 3300, 2700, 1.2, .012, .25, 5200); },
    /* 结霜的「叮」 */
    frost(S) { [2637, 3136, 3951, 5274].forEach((f, i) => S.tone('sine', f, f * .985, 1 - i * .18, .028, i * .07)); },
    /* 火镰打火石 */
    flint(S, n = 3) { for (let i = 0; i < n; i++) { S.tone('square', 3800, 2400, .03, .05, i * .3, 6000); S.tone('triangle', 5200, 4100, .05, .02, i * .3 + .01, 7000); } },
    /* 柴火噼啪 */
    crackle(S, n = 3, v = 1) { for (let i = 0; i < n; i++) S.tone('square', 900 + Math.random() * 1500, 260, .025, .035 * v, i * .09 + Math.random() * .05, 3000); },
    /* 渡口的板木：梆——梆——梆 */
    itagi(S, n = 3) { for (let i = 0; i < n; i++) { S.tone('triangle', 720, 640, .2, .13, i * .5, 1800); S.tone('sine', 360, 330, .32, .08, i * .5, 900); } },
    /* 抱柴：木头碰木头 */
    log(S) { S.tone('triangle', 310, 220, .09, .09, 0, 1400); S.tone('triangle', 260, 190, .09, .08, .1, 1400); },
    /* 阿雪哼的摇篮曲（简单的五声音阶） */
    lullaby(S, sp = 1) {
      const N = [[880, 1], [988, 1], [1175, 1], [1175, 1], [988, 1], [880, 2], [784, 1], [880, 1], [988, 2], [880, 3]];
      let t = 0; for (const [f, d] of N) { S.tone('triangle', f / 2, f / 2, .38 * d * sp, .04, t, 1500); S.tone('sine', f / 4, f / 4, .38 * d * sp, .02, t, 700); t += .42 * d * sp; }
    }
  };

  /* ---------------- 人物 ---------------- */
  const MINO = (g, d, fr, G, R) => {   // 蓑衣（草编雨衣）
    const c1 = '#8c7a48', c2 = '#6a5a32', c3 = '#a8945a';
    if (d === 3) { R(3, G.tT - 1, 10, 12, c1); for (let x = 3; x < 13; x += 2) R(x, G.tT + 2, 1, 9, c2); R(3, G.tT - 1, 10, 1, c3); return; }
    if (d === 0) { R(2, G.tT, 3, 10, c1); R(11, G.tT, 3, 10, c1); R(2, G.tT + 9, 12, 2, c1); for (let x = 2; x < 14; x += 2) R(x, G.tT + 10, 1, 2, c2); R(3, G.tT + 2, 1, 7, c2); R(12, G.tT + 2, 1, 7, c2); R(4, G.tT - 1, 8, 1, c3); }
    else { R(8, G.tT, 5, 11, c1); for (let y = G.tT + 1; y < G.tT + 11; y += 2) R(9, y, 4, 1, c2); R(8, G.tT - 1, 4, 1, c3); }
  };
  const ME = { skin: '#ecc6a0', hair: '#1a1410', hs: 'short', top: '#34466a', top2: '#22304a', bottom: '#2a2e3a', shoes: '#9a8456', hat: 'hood', hatC: '#6a5e52' };
  const PEOPLE7 = {
    me: Object.assign({ key: 'yk-me' }, ME),                                  // 巳之吉，十八岁：头巾、绀色短褂、草鞋
    meMino: Object.assign({ key: 'yk-meM', extra: MINO }, ME),
    me2: { key: 'yk-me2', skin: '#dcb08a', hair: '#161210', hs: 'short', top: '#2e3c58', top2: '#1e2a40', bottom: '#2a2e3a', shoes: '#9a8456',   // 十年后，下巴上有了胡茬
      extra(g, d, fr, G, R) { if (d === 0) R(5, G.hT + 6, 6, 1, 'rgba(60,44,36,.55)'); else if (d === 1) R(4, G.hT + 6, 3, 1, 'rgba(60,44,36,.55)'); } },
    mosaku: { key: 'yk-mo', skin: '#c8966e', hair: '#c0bcb4', hs: 'bald', top: '#5a4a36', top2: '#3a2e22', bottom: '#3a342a', shoes: '#9a8456', hat: 'hood', hatC: '#4a4440', eye: '#2a2020',
      extra(g, d, fr, G, R) { MINO(g, d, fr, G, R); if (d === 0) R(5, G.hT + 6, 6, 2, '#d8d4cc'); else if (d === 1) R(4, G.hT + 6, 3, 2, '#d8d4cc'); } },   // 白胡子、蓑衣
    yuki: { key: 'yk-yuki', skin: '#eef3f8', hair: '#07070c', hs: 'long', top: '#f2f5fa', top2: '#c4d2e2', robe: true, noFeet: true, ghost: true, eye: '#0a0a14', mouth: '#7e98c0',
      extra(g, d, fr, G, R) {   // 白衣、白腰带、被风吹乱的长发
        if (d === 0) { R(4, G.tT + 4, 8, 1, '#aebfd4'); R(7, G.tT, 2, 4, '#dfe7f0'); R(3, G.hT + 1, 1, 12, '#07070c'); R(12, G.hT + 1, 1, 12, '#07070c'); R(2, G.hT + 6, 1, 8, '#07070c'); R(13, G.hT + 5, 1, 9, '#07070c'); }
        else if (d === 1) { R(10, G.hT + 3, 3, 12, '#07070c'); R(12, G.hT + 6, 2, 8, '#07070c'); R(5, G.tT + 4, 6, 1, '#aebfd4'); }
        else if (d === 3) R(3, G.hT + 2, 10, 14, '#07070c');
      } },
    oyuki: { key: 'yk-oyu', skin: '#eef0f3', hair: '#0e0c10', hs: 'bun', top: '#3e4a64', top2: '#e6e6ec', robe: true, apron: '#5e5e70', shoes: '#2a2020', eye: '#141018', mouth: '#b07888',
      extra(g, d, fr, G, R) { if (d === 0) R(10, G.hT - 2, 3, 1, '#c8ccd4'); else if (d === 1) R(10, G.hT - 1, 3, 1, '#c8ccd4'); } },   // 阿雪：同一张雪白的脸，素色发簪
    tabi: { key: 'yk-tabi', skin: '#eef0f3', hair: '#0e0c10', hs: 'long', top: '#6a5a7a', top2: '#e6e6ec', robe: true, shoes: '#2a2020', eye: '#141018', mouth: '#b07888', hat: 'scarf', hatC: '#8a8a9a' },
    kichi: { key: 'yk-ki', skin: '#eac09a', hair: '#1a1410', hs: 'messy', top: '#5a6a4a', top2: '#3a4630', bottom: '#3a3a3a', shoes: '#9a8456', child: true },
    haru: { key: 'yk-ha', skin: '#f0caa6', hair: '#1a1410', hs: 'bob', top: '#a04a4a', top2: '#7a3030', skirt: true, bottom: '#5a3a3a', shoes: '#9a8456', child: true, blush: '#e0907a' },
    baba: { key: 'yk-ba', skin: '#c8a080', hair: '#d0ccc4', hs: 'bun', top: '#4a4038', top2: '#2e2822', robe: true, shoes: '#2a2020', hat: 'scarf', hatC: '#5a4a5a' },
    nyobo: { key: 'yk-ny', skin: '#e2b896', hair: '#1a1410', hs: 'bun', top: '#6a4a3a', top2: '#4a3020', robe: true, apron: '#3a4a5a', shoes: '#2a2020' }
  };

  /* ---------------- 惊吓大头像（32×32） ---------------- */
  const FACES = {
    /* 雪女：被风吹向一边的黑长发、雪白瘦长的脸、眉上挂霜、全黑的细眼里一点银光、淡青的唇里吐出白气 */
    yuki(R, a, t) {
      const H = '#05050a', HL = '#1c2030', SK = '#f2f6fb', SK2 = '#cfdae6', SK3 = '#9aaabd', LIP = '#6f88b4', EYE = '#020206', ICE = '#dff0ff';
      R(5, 1, 22, 31, H); R(2, 6, 4, 26, H); R(26, 4, 5, 24, H); R(29, 8, 3, 14, H); R(0, 14, 3, 18, H);
      const RIM = '#3a4a66';   // 发梢的一圈冷光：黑发在黑底上也看得出轮廓
      R(8, 0, 16, 1, RIM); R(5, 1, 3, 1, RIM); R(24, 1, 3, 1, RIM); R(4, 2, 1, 4, RIM); R(1, 6, 1, 8, RIM); R(27, 3, 1, 2, RIM); R(30, 7, 1, 2, RIM); R(31, 9, 1, 12, RIM);
      for (let i = 0; i < 4; i++) R(27 + i, 9 + i * 4, 1, 4, HL);   // 被风吹向一边的几绺
      R(7, 3, 1, 28, HL); R(24, 3, 1, 26, HL);
      R(10, 5, 12, 3, SK); R(9, 8, 14, 13, SK); R(10, 21, 12, 3, SK); R(12, 24, 8, 2, SK);
      R(20, 7, 2, 16, SK2); R(18, 23, 3, 2, SK2); R(9, 14, 1, 6, SK2);
      R(9, 4, 14, 3, H); R(9, 7, 2, 10, H); R(21, 7, 2, 8, H); R(14, 6, 1, 3, H); R(17, 6, 1, 2, H);
      R(11, 10, 4, 1, ICE); R(17, 10, 4, 1, ICE);
      R(10, 11, 5, 1, SK3); R(17, 11, 5, 1, SK3); R(10, 14, 5, 1, SK2); R(17, 14, 5, 1, SK2);
      if (a < .25) { R(10, 13, 5, 1, EYE); R(17, 13, 5, 1, EYE); }   // 先是闭着的，然后猛地睁开
      else {
        R(11, 12, 4, 2, '#d6e2ee'); R(17, 12, 4, 2, '#d6e2ee');
        R(10, 12, 5, 1, EYE); R(17, 12, 5, 1, EYE); R(10, 13, 1, 1, EYE); R(21, 13, 1, 1, EYE);
        R(13, 13, 1, 1, EYE); R(18, 13, 1, 1, EYE); R(13, 12, 1, 1, '#2a3a5a'); R(18, 12, 1, 1, '#2a3a5a');
      }
      R(12, 6, 1, 14, H); R(13, 19, 1, 3, H); R(20, 6, 1, 9, HL);   // 吹到脸前的发丝
      R(15, 15, 1, 3, SK3);
      const mo = Math.round(a * 2);
      R(13, 20, 6, 1, LIP); if (mo) R(14, 21, 4, mo, '#203050'); R(13, 21 + mo, 6, 1, LIP);
      if (a > .2) { const k = (a - .2) / .8; for (let i = 0; i < 7; i++) { const ww = 2 + Math.round(k * (i * 2 + 2)); R(16 - ww / 2, 23 + i, ww, 1, `rgba(235,245,255,${.7 - i * .08})`); } }
      for (let i = 0; i < 9; i++) { const x = (i * 7 + Math.floor(t * 20) + i * i) % 32, y = (i * 11 + Math.floor(t * 14)) % 32; R(x, y, 1, 1, 'rgba(240,248,255,.8)'); }
    }
  };

  /* ---------------- 瓦片 ---------------- */
  const TILES7 = {
    snowg: { solid: false, paint(R, X, Y, o) {
      const b = (o && o.snowC) || '#c9d2dc'; R(0, 0, 16, 16, b);
      for (let i = 0; i < 7; i++) { const h = hash(X, Y, 300 + i); R((h * 15) | 0, (hash(Y, X, 310 + i) * 15) | 0, 2, 1, i % 2 ? shade(b, -.08) : shade(b, .12)); }
      if (hash(X, Y, 330) < .18) { R(3, 9, 6, 2, shade(b, -.12)); R(4, 8, 4, 1, shade(b, -.05)); }
    } },
    snowpath: { solid: false, paint(R, X, Y, o) {
      TILES7.snowg.paint(R, X, Y, o); R(0, 4, 16, 8, '#a9b2bd');
      for (let i = 0; i < 4; i++) R(((hash(X, Y, 340 + i) * 12) | 0) + 1, 5 + (i % 3) * 2, 3, 1, '#8f99a6');
    } },
    snowpine: { solid: true, paint(R, X, Y, o) {
      TILES7.snowg.paint(R, X, Y, o); const c = '#1a2a26';
      for (let i = 0; i < 7; i++) { R(7 - i, 1 + i * 2, 2 + i * 2, 2, i % 2 ? c : shade(c, .12)); R(7 - i, 1 + i * 2, 2 + i * 2, 1, '#dde4ec'); }
      R(7, 14, 2, 2, '#2a1c12');
    } },
    iceshore: { solid: true, paint(R, X, Y) {
      R(0, 0, 16, 16, '#8ea6b8'); R(0, 0, 16, 5, '#5e7a92'); R(0, 12, 16, 4, '#c9d2dc');
      for (let i = 0; i < 3; i++) R((hash(X, Y, 350 + i) * 13) | 0, 6 + i * 2, 4, 1, '#b8cad8');
      if (hash(X, Y, 360) < .4) R((hash(X, Y, 361) * 10) | 0, 2, 5, 1, '#9ab4c8');
    } },
    dockw: { solid: false, paint(R) {
      R(0, 0, 16, 16, '#3a4a5a'); for (let y = 0; y < 16; y += 4) { R(1, y, 14, 3, '#6a5844'); R(1, y, 14, 1, '#d4dce4'); }
      R(0, 0, 1, 16, '#2a2018'); R(15, 0, 1, 16, '#2a2018');
    } }
  };

  /* ---------------- 精灵 ---------------- */
  const FL = []; let flT = 0;
  const SPR7 = {
    /* 头顶的体温条（跟着玩家画；客机直接读本地玩家位置，不会拖影）。右边的小木棍 = 怀里抱着几捆柴 */
    thermo(g, e, t, R) {
      if (W.pl.hidden) return;
      const ox = e.px - e.sx, oy = e.py - e.sy, X = Math.round(W.pl.px - ox) + 1, Y = Math.round(W.pl.py - oy) - 18;
      const F = (x, y, w, h, c) => { g.fillStyle = c; g.fillRect(X + x, Y + y, w, h); };
      const v = clamp(e.num ?? 100, 0, 100), n = Math.round(v / 100 * 11);
      const col = v > 60 ? '#f0a050' : v > 30 ? '#e8dca0' : (v > 15 || Math.sin(t * 10) > 0 ? '#7ab8f0' : '#e8f4ff');
      F(-1, -1, 16, 5, '#07090c'); F(0, 0, 14, 3, '#1c2430');
      F(0, 0, 2, 3, v > 30 ? '#f07040' : '#9ad0ff');
      if (n) { F(3, 1, n, 1, col); F(3, 0, n, 1, shade(col, .25)); F(3, 2, n, 1, shade(col, -.25)); }
      const wd = (e.s && e.s.wd) || 0; for (let i = 0; i < wd; i++) { F(15 + i * 3, -2, 2, 6, '#9a7a4a'); F(15 + i * 3, -2, 2, 1, '#c8a870'); }
      if (e.s && e.s.m) { F(-4, -1, 3, 5, '#a8945a'); F(-4, 3, 3, 1, '#6a5a32'); }
      if (e.s && e.s.fi != null) {   // 夜里：上面一道小火苗刻度 = 地炉的火还剩多少（屋外也看得见）
        const fi = e.s.fi, fc = fi > 3 ? '#ff9a3a' : fi > 0 ? (Math.sin(t * 8) > 0 ? '#ff5a2a' : '#a02a10') : '#3a3a40';
        F(-1, -6, 16, 4, '#07090c'); F(0, -5, 2, 2, fc); F(1, -6, 1, 1, fc);
        if (fi) F(3, -5, Math.round(fi * 1.1), 2, fc); else { F(3, -5, 11, 2, '#22242a'); }
      }
    },
    /* 风雪：屏幕空间的雪花（屋顶下不画）；顺便按「在屋里/屋外/起白风」改黑暗的颜色（双方各自画） */
    snowfx(g, e, t, R) {
      const dt = Math.min(.05, Math.max(0, t - flT)); flT = t;
      const lv = e.lv ?? 2, gust = e.g ? 1 : 0, m = curMap();
      const camx = e.px - e.sx, camy = e.py - e.sy;
      if (m.def.wxDark) { const ins = m.def.inside && m.def.inside(W.pl.x, W.pl.y); m.def.darkC = ins ? '#07060a' : gust ? '#5c6470' : (e.dk || m.def.wxDark); }
      const want = [0, 45, 100, 170][lv] + gust * 90;
      while (FL.length < want) FL.push({ x: Math.random() * VW, y: Math.random() * VH, v: .6 + Math.random() * .8, s: Math.random() < .25 ? 2 : 1 });
      const vx = -(16 + lv * 16 + gust * 110), vy = 24 + lv * 12 + gust * 24;
      const vis = [];
      for (let i = 0; i < want; i++) {
        const f = FL[i];
        f.x += vx * f.v * dt; f.y += vy * f.v * dt;
        if (f.y > VH + 2) { f.y = -2; f.x = Math.random() * (VW + 80); }
        if (f.x < -4) { f.x = VW + Math.random() * 20; f.y = Math.random() * VH; }
        if (m.def.roof && m.def.roof((f.x + camx) / TS, (f.y + camy) / TS)) continue;
        vis.push(f);
      }
      /* 先画一像素灰蓝的影子，雪花落在雪地上也看得出来；起白风时拉成斜线 */
      g.fillStyle = 'rgba(52,62,84,.45)'; for (const f of vis) g.fillRect((f.x | 0) + 1, (f.y | 0) + 1, gust ? 4 : f.s, f.s);
      g.fillStyle = gust ? 'rgba(244,248,255,.95)' : 'rgba(240,246,252,.9)';
      for (const f of vis) { if (gust) { g.fillRect(f.x | 0, f.y | 0, 4, 1); g.fillRect((f.x | 0) + 3, (f.y | 0) - 1, 2, 1); } else g.fillRect(f.x | 0, f.y | 0, f.s, f.s); }
    },
    /* 六地藏之一。k：hat 戴斗笠 / blown 斗笠被风刮掉 / towel 包着手巾；b = 雪已拂掉；fix = 斗笠已给它戴回去 */
    jizo(g, e, t, R) {
      const ST = '#8a8a86', ST2 = '#6a6a66', SN = '#e6ecf2', SN2 = '#c4ced8', k = e.k || 'hat';
      box(R, 2, 10, 12, 6, '#5e5e5a'); R(3, 10, 10, 1, SN);
      R(4, 1, 8, 10, ST); R(5, -4, 6, 6, ST); R(10, 1, 2, 10, ST2); R(9, -4, 2, 6, ST2);
      R(4, 4, 8, 3, '#a8302a'); R(5, 7, 6, 1, '#7a2420');
      R(6, -2, 1, 1, '#3a3a38'); R(9, -2, 1, 1, '#3a3a38'); R(7, 0, 2, 1, '#5a5a56');
      const hat = () => { R(1, -5, 14, 2, '#b89a5a'); R(4, -7, 8, 2, '#a08448'); R(6, -8, 4, 1, '#8a703a'); R(1, -3, 14, 1, '#8a703a'); };
      const lying = () => { R(8, 12, 9, 2, '#b89a5a'); R(9, 11, 7, 1, '#a08448'); };
      if (!e.b) {
        R(3, 2, 10, 8, SN2); R(4, 1, 8, 1, SN);
        if (k === 'hat') { R(1, -6, 14, 3, SN); R(2, -3, 12, 1, SN2); R(4, -8, 8, 2, SN); R(1, -3, 1, 2, '#cfe0f0'); R(14, -3, 1, 2, '#cfe0f0'); R(5, -3, 1, 1, '#cfe0f0'); R(10, -3, 1, 1, '#cfe0f0'); }
        else { R(4, -7, 8, 4, SN); R(5, -8, 6, 1, SN); R(4, -3, 8, 3, SN2); }
        if (k === 'towel') { R(5, 1, 1, 2, '#3c4c72'); R(10, 1, 1, 2, '#3c4c72'); R(5, 1, 1, 1, '#d8e0ee'); R(10, 1, 1, 1, '#d8e0ee'); }
        if (k === 'blown') { lying(); R(8, 11, 9, 1, SN); }
      } else {
        if (k === 'hat' || (k === 'blown' && e.fix)) hat();
        if (k === 'towel') { R(4, -5, 8, 3, '#3c4c72'); R(4, -3, 1, 4, '#3c4c72'); R(11, -3, 1, 4, '#3c4c72'); R(5, 1, 2, 1, '#3c4c72'); R(9, 1, 2, 1, '#3c4c72'); R(5, -4, 6, 1, '#d8dce8'); }
        if (k === 'blown' && !e.fix) lying();
      }
    },
    /* 小屋的板门（嵌在南墙的门洞里）；locked：铁锁 + 留守书 */
    itado(g, e, t, R) {
      R(0, -6, 16, 3, '#2a1e14');
      if (e.open) { R(0, -3, 3, 19, '#5a4430'); R(1, -2, 1, 17, '#3a2a1c'); R(3, -3, 13, 19, 'rgba(10,12,18,.85)'); R(3, 13, 13, 3, '#c9d2dc'); return; }
      R(0, -3, 16, 19, '#5e4632'); for (let x = 3; x < 16; x += 4) R(x, -3, 1, 19, '#45321f'); R(0, 4, 16, 1, '#45321f');
      R(12, 5, 2, 3, '#2a1e14');
      if (e.locked) { R(6, 5, 4, 4, '#3a3a40'); R(7, 3, 2, 2, '#5a5a62'); R(1, -2, 5, 6, '#d8cfb8'); R(2, -1, 3, 1, '#3a3a3a'); R(2, 1, 3, 1, '#3a3a3a'); R(2, 3, 2, 1, '#3a3a3a'); }
    },
    /* 地炉（2×1）：num = 火势 0~100；em = 灰里还有一点火星 */
    irori(g, e, t, R) {
      box(R, 0, 1, 32, 14, '#3a2a1e'); R(2, 3, 28, 10, '#5a5450'); R(3, 4, 26, 8, '#6e6862');
      const f = e.num || 0;
      if (f > 0 || !e.bury) { R(8, 8, 16, 3, '#3a2418'); R(11, 6, 10, 2, '#4a2e1c'); }
      if (f > 0) {
        const n = 2 + Math.round(f / 25), hgt = 2 + Math.round(f / 12);
        for (let i = 0; i < n; i++) { const hh = Math.max(2, hgt - ((i * 3) % 4) + (((Math.sin(t * 11 + i * 1.7) + 1) * 1.5) | 0)); R(10 + i * Math.round(12 / n), 9 - hh, 3, hh, i % 2 ? '#ff8a2a' : '#ffd060'); }
        R(9, 9, 14, 2, '#ff6a20');
      } else if (e.em) { R(12, 9, 2, 1, Math.sin(t * 3) > 0 ? '#c03a10' : '#801808'); R(17, 8, 1, 1, '#a02a0a'); }
      R(15, -18, 2, 14, '#2a2420'); box(R, 10, -6, 12, 9, '#26262a'); R(11, -5, 10, 1, '#46464a'); R(21, -3, 3, 1, '#26262a');
      if (f > 30) R(14 + Math.sin(t * 2) * 2, -10 - ((t * 5) % 6), 3, 2, 'rgba(210,210,210,.3)');
    },
    /* 屋檐下的柴垛：num = 还剩几捆 */
    maki(g, e, t, R) {
      const n = e.num ?? 3;
      R(-2, -10, 20, 3, '#3a2a1e'); R(-2, -11, 20, 1, '#dde4ec');
      for (let r = 0; r < 3; r++) { if (r >= n) continue; for (let i = 0; i < 3; i++) { R(1 + i * 5, 10 - r * 5, 5, 5, '#5a3c22'); R(2 + i * 5, 11 - r * 5, 3, 3, '#9a7a4a'); } }
      if (n > 0) R(1, 10 - (n - 1) * 5 - 1, 15, 2, '#e6ecf2'); else R(1, 12, 14, 3, '#b8c2cc');
      R(0, 15, 16, 1, '#c9d2dc');
    },
    /* 西边的船棚（3×1）：倒扣的旧船、稻草（wara）、柴（num） */
    funagoya(g, e, t, R) {
      R(-2, -20, 52, 6, '#2c241c'); R(-2, -21, 52, 2, '#e6ecf2'); for (let x = 0; x < 48; x += 6) R(x, -15, 3, 1, '#d8e0e8');
      R(0, -14, 3, 30, '#3a2a1e'); R(45, -14, 3, 30, '#3a2a1e');
      R(3, -14, 42, 28, '#14100c');
      box(R, 6, 2, 22, 7, '#4a3a2c'); R(7, 2, 20, 1, '#6a5640');
      if (e.wara) for (let i = 0; i < 3; i++) { R(30 + i * 5, -6, 4, 14, '#b8a060'); R(30 + i * 5, -6, 4, 2, '#8a7440'); R(30 + i * 5, 2, 4, 1, '#8a7440'); }
      const n = e.num ?? 3; for (let i = 0; i < n; i++) { R(6 + i * 7, -10, 6, 5, '#5a3c22'); R(7 + i * 7, -9, 4, 3, '#9a7a4a'); }
      R(-2, 14, 52, 2, '#c9d2dc');
    },
    tana(g, e, t, R) { R(0, 4, 16, 2, '#4a3624'); R(1, 6, 1, 3, '#3a2a1c'); R(14, 6, 1, 3, '#3a2a1c'); if (!e.open) { box(R, 3, -1, 8, 5, '#6a4a2a'); R(4, 0, 6, 1, '#8a6a42'); } R(11, 0, 3, 4, '#7a7a70'); },
    minoW(g, e, t, R) { R(7, -1, 2, 2, '#2a1e14'); if (e.open) return; R(3, 1, 10, 3, '#a8945a'); R(2, 4, 12, 9, '#8c7a48'); for (let x = 2; x < 14; x += 2) R(x, 6, 1, 8, '#6a5a32'); R(2, 13, 12, 1, '#6a5a32'); },
    /* 格子窗：face = 窗外贴着一张雪白的脸 */
    mado(g, e, t, R) {
      R(1, 1, 14, 11, '#2a1e14'); R(2, 2, 12, 9, e.face ? '#9aa6b4' : '#3a4656');
      for (let i = 0; i < 6; i++) R(2 + ((i * 5 + Math.floor(t * 18)) % 12), 2 + ((i * 3 + Math.floor(t * 9)) % 9), 1, 1, '#e0e8f0');
      if (e.face) { R(5, 3, 6, 8, '#eef3f8'); R(4, 2, 8, 2, '#06060a'); R(4, 3, 1, 8, '#06060a'); R(11, 3, 1, 8, '#06060a'); R(6, 6, 1, 1, '#06060a'); R(9, 6, 1, 1, '#06060a'); R(7, 9, 2, 1, '#7e98c0'); }
      for (let x = 2; x < 14; x += 3) R(x, 2, 1, 9, '#2a1e14'); R(2, 6, 12, 1, '#2a1e14');
    },
    /* 墙缝：雪沫子往屋里钻（dx/dy = 往里的方向）；covered = 塞了稻草 */
    suki(g, e, t, R) {
      if (e.covered) { R(4, 3, 8, 9, '#b8a060'); for (let i = 0; i < 4; i++) R(4 + i * 2, 2 + (i % 2), 1, 3, '#d0bc78'); R(5, 11, 6, 1, '#8a7440'); return; }
      R(7, 1, 2, 13, '#0a0c10'); R(6, 4, 1, 4, '#0a0c10'); R(9, 8, 1, 4, '#0a0c10');
      for (let i = 0; i < 5; i++) { const k = (t * 1.6 + i * .2) % 1; R(8 + (e.dx || 0) * k * 12 + (i % 2), 3 + i * 2 + (e.dy || 0) * k * 12, 1, 1, `rgba(230,240,250,${1 - k})`); }
    },
    kai(g, e, t, R) { if (e.open) { R(3, 13, 10, 2, '#5a4430'); R(4, 12, 3, 1, '#7a5a38'); return; } R(6, -14, 2, 26, '#7a5a38'); R(5, 8, 4, 7, '#8a6a44'); R(6, -14, 2, 1, '#9a7a54'); R(4, 14, 8, 1, 'rgba(0,0,0,.3)'); },
    mizugame(g, e, t, R) { box(R, 2, 2, 12, 13, '#5a4a3e'); R(3, 3, 10, 3, e.ice ? '#c8dcea' : '#1a2630'); R(4, 4, 4, 1, e.ice ? '#eef6fc' : '#3a5060'); R(2, 9, 12, 1, '#4a3c32'); R(1, 1, 14, 2, '#3a3028'); },
    mushiro(g, e, t, R) { R(0, 2, 16, 13, '#8a7a4a'); for (let y = 3; y < 15; y += 2) R(0, y, 16, 1, '#7a6a3e'); },
    /* 渡口的板木：敲了叫对岸的渡守 */
    itagi(g, e, t, R) {
      R(1, -14, 2, 30, '#3a2a1e'); R(13, -14, 2, 30, '#3a2a1e'); R(0, -15, 16, 2, '#2a1e14'); R(0, -16, 16, 1, '#e6ecf2');
      const sw = e.sw ? Math.round(Math.sin(t * 14)) : 0;
      R(7, -13, 1, 3, '#6a5a4a'); box(R, 3 + sw, -10, 10, 7, '#7a6448'); R(5 + sw, -8, 6, 1, '#5a4430');
      R(11, 2, 1, 6, '#5a4430'); R(10, 1, 3, 2, '#7a6448');
    },
    /* 白风里的人影 */
    yukiShade(g, e, t, R) {
      const fl = Math.sin(t * 23) > .7 ? 1 : 0;
      R(4, -8, 8, 22 - fl, 'rgba(240,246,252,.75)'); R(3, -4, 10, 14, 'rgba(240,246,252,.5)');
      R(5, -9, 6, 5, 'rgba(6,6,12,.9)'); R(4, -7, 2, 12, 'rgba(6,6,12,.85)'); R(10, -7, 2, 10, 'rgba(6,6,12,.85)'); R(11, -6, 4, 3, 'rgba(6,6,12,.55)');
      R(6, -5, 4, 4, 'rgba(230,238,248,.95)'); R(6, -3, 1, 1, '#06060a'); R(9, -3, 1, 1, '#06060a');
      for (let i = 0; i < 6; i++) R(((i * 5 + t * 30) % 20) - 2, ((i * 7 + t * 40) % 26) - 10, 1, 1, 'rgba(255,255,255,.8)');
    },
    /* 她吐出的白气：朝 dir 方向的一缕亮晶晶的白烟 */
    breath(g, e, t, R) {
      const sx = e.dir === 1 ? -1 : 1;
      for (let i = 0; i < 10; i++) { const k = (t * 1.4 + i * .1) % 1, x = 8 + sx * k * 18, y = -6 + Math.sin(k * 6 + i) * 2 + k * 6; R(x, y, 2 + k * 3, 1 + k * 2, `rgba(235,245,255,${.85 - k * .7})`); }
      if (Math.sin(t * 9) > .5) R(8 + sx * 10, -4, 1, 1, '#ffffff');
    },
    /* 躺着的茂作（头朝左，盖着蓑衣）；fz = 冻住了 */
    moLie(g, e, t, R) {
      const fz = e.fz, sk = fz ? '#c4d2dc' : '#c8966e', hr = fz ? '#eef2f6' : '#c0bcb4';
      R(0, 8, 16, 7, '#8a7a4a');
      R(1, 5, 5, 6, sk); R(1, 4, 5, 2, hr); R(2, 7, 1, 1, fz ? '#8a9aa6' : '#2a2020'); R(1, 9, 4, 2, hr);
      R(5, 5, 11, 8, fz ? '#b8c4c8' : '#8c7a48'); for (let x = 6; x < 16; x += 2) R(x, 6, 1, 7, fz ? '#9aa8ae' : '#6a5a32');
      if (fz) { for (let i = 0; i < 7; i++) R((hash(i, 2, 7) * 15) | 0, 4 + (hash(i, 3, 7) * 9 | 0), 1, 1, '#ffffff'); }
      else if (Math.sin(t * 1.5) > .6) R(0, 2, 2, 1, 'rgba(220,220,220,.35)');
    },
    /* 躺着的巳之吉（S.wear 用） */
    meLie(g, e, t, R) {
      R(0, 8, 16, 7, '#8a7a4a');
      R(1, 5, 5, 6, '#ecc6a0'); R(1, 4, 5, 2, '#6a5e52'); R(2, 7, 1, 1, '#1a1410');
      R(5, 5, 11, 8, '#8c7a48'); for (let x = 6; x < 16; x += 2) R(x, 6, 1, 7, '#6a5a32');
      if (Math.sin(t * 2.2) > .7) R(0, 3, 2, 1, 'rgba(230,240,250,.4)');
    },
    /* ---- 村子 ---- */
    minka(g, e, t, R) {   // 雪压的茅草顶民家（w 格宽，向上画两格）；lit = 窗里有灯
      const L = e.w * 16, dx = e.dx ?? (L / 2 - 6);
      R(-4, -30, L + 8, 14, '#3a2e22'); R(-4, -32, L + 8, 4, '#e6ecf2'); for (let x = -2; x < L + 4; x += 7) R(x, -28, 3, 2, '#d8e0e8'); R(-2, -18, L + 4, 2, '#2a2018');
      R(0, -16, L, 32, '#5a4632'); for (let x = 4; x < L; x += 8) R(x, -16, 1, 32, '#46341f');
      R(dx, 0, 12, 16, '#1a120c'); R(dx + 1, 1, 10, 15, e.lit ? '#c88a48' : '#2a1e14'); R(dx + 6, 1, 1, 15, '#1a120c');
      const wx = dx > L / 2 ? 4 : L - 14; R(wx, -9, 10, 7, '#1a120c'); R(wx + 1, -8, 8, 5, e.lit ? '#e8b060' : '#2a2018'); R(wx + 5, -8, 1, 5, '#3a2a1c');
      R(-4, 14, L + 8, 2, '#c9d2dc');
    },
    yukidaruma(g, e, t, R) {   // 孩子们堆的「雪女」：木炭的长头发
      R(1, 14, 14, 2, 'rgba(0,0,0,.15)'); R(2, 6, 12, 9, '#eef2f6'); R(3, 5, 10, 1, '#eef2f6'); R(4, -2, 8, 8, '#f4f7fa');
      R(3, -3, 10, 3, '#14141a'); R(3, 0, 2, 9, '#14141a'); R(11, 0, 2, 9, '#14141a');
      R(6, 1, 1, 1, '#14141a'); R(9, 1, 1, 1, '#14141a'); R(7, 3, 2, 1, '#a04a4a'); R(6, 8, 4, 1, '#c8d0d8');
    },
    /* ---- 家 ---- */
    andon(g, e, t, R) { R(4, 12, 8, 3, '#3a2a1c'); R(5, -4, 1, 16, '#3a2a1c'); R(10, -4, 1, 16, '#3a2a1c'); R(4, -6, 8, 10, e.off ? '#6a6050' : '#f0d8a0'); if (!e.off) R(5, -5, 6, 8, Math.sin(t * 13) > -.8 ? '#f8e8b8' : '#f0dca8'); R(4, -6, 8, 1, '#3a2a1c'); R(4, 3, 8, 1, '#3a2a1c'); R(7, -6, 1, 10, 'rgba(60,40,20,.4)'); },
    butsudan(g, e, t, R) { box(R, 1, -2, 14, 15, '#2a1a12'); R(3, 0, 10, 10, '#140c08'); R(6, 2, 4, 6, '#c9a35a'); R(7, 1, 2, 1, '#c9a35a'); R(4, 9, 8, 1, '#5a3a20'); R(4, 7, 1, 2, '#e8e0d0'); R(11, 7, 1, 2, '#e8e0d0'); if (Math.sin(t * 13) > -.6) R(4, 6, 1, 1, '#ffb040'); R(9, 4 - ((t * 3) % 5), 1, 2, 'rgba(200,200,200,.3)'); },
    kfuton(g, e, t, R) {   // 孩子的被褥（竖 1×2）；in = 孩子睡在里面
      const c = e.col || '#7a4a4a';
      box(R, 1, 0, 14, 30, '#d8d2c0'); R(2, 1, 12, 5, '#eee8d8'); R(2, 9, 12, 19, c); R(2, 9, 12, 2, shade(c, .2));
      if (e.in) { const sk = e.kid === 'haru' ? '#f0caa6' : '#eac09a'; R(5, 2, 6, 5, sk); R(4, 1, 8, 2, '#1a1410'); if (e.kid === 'haru') { R(3, 2, 2, 4, '#1a1410'); R(11, 2, 2, 4, '#1a1410'); } R(6, 4, 1, 1, '#2a2020'); R(9, 4, 1, 1, '#2a2020'); R(4, 10 + (Math.sin(t * 1.4 + e.px) > 0 ? 1 : 0), 8, 1, shade(c, -.2)); }
    },
    goemon(g, e, t, R) {   // 五右卫门风呂（铁锅浴桶）；ice = 水面浮着一根冰凌
      R(1, 10, 14, 6, '#3a3a3a'); R(3, 12, 10, 3, e.lit ? (Math.sin(t * 9) > 0 ? '#ff7a2a' : '#e86a20') : '#1a1a1a');
      box(R, 1, -2, 14, 13, '#4a4038'); R(2, -1, 12, 4, '#3a5a6a'); R(3, 0, 5, 1, '#6a8a9a'); R(0, -3, 16, 2, '#6a5a44');
      if (e.lit) for (let i = 0; i < 3; i++) R(4 + i * 4, -6 - ((t * 6 + i * 2) % 6), 2, 2, 'rgba(230,230,230,.3)');
      if (e.ice) { R(4, 0, 8, 1, '#e8f4ff'); R(5, 1, 6, 1, '#b8d8f0'); R(11, 0, 2, 1, '#f4ece0'); }
    },
    kamado(g, e, t, R) { box(R, 0, 0, 16, 15, '#8a7a6a'); R(2, 1, 12, 4, '#2a2a2a'); R(4, 7, 8, 7, '#1a0c08'); if (!e.off) R(5, 10 + (Math.sin(t * 9) > 0 ? 1 : 0), 6, 3, '#d86a2a'); R(3, -3, 10, 4, '#3a3a3c'); },
    kemuri(g, e, t, R) {   // 地炉上方的天窗（烟出し）和垂下来的拉绳；open = 拉开了
      R(2, -14, 12, 8, '#1a140e'); R(3, -13, 10, 6, e.open ? '#3a4a5e' : '#2a2018');
      if (e.open) for (let i = 0; i < 5; i++) R(4 + ((i * 3 + t * 8) % 8), -13 + ((i * 5 + t * 14) % 24), 1, 1, '#e8f0f8');
      R(8, -6, 1, 16, '#8a7a5a'); R(7, 9, 3, 3, '#8a7a5a');
    },
    chawan(g, e, t, R) {   // 她手边的茶碗和针线笸箩；lit = 热茶冒着热气；full = 换成了凉水
      R(1, 9, 14, 5, '#4a3020'); R(2, 9, 12, 1, '#6a4a30');
      R(3, 5, 6, 5, '#d8d4c8'); R(3, 5, 6, 1, '#b8b4a8'); if (e.full) R(4, 6, 4, 1, '#9ab8d0'); else R(4, 6, 4, 1, '#7a5a30');
      if (e.lit) R(5 + Math.sin(t * 2), 2 - ((t * 4) % 4), 1, 2, 'rgba(220,220,220,.45)');
      R(10, 6, 5, 3, '#8a6a4a'); R(11, 5, 3, 1, '#5a6a8a');
    },
    tsukue(g, e, t, R) { box(R, 1, 6, 14, 6, '#5a3a24'); R(2, 12, 2, 3, '#3a2418'); R(12, 12, 2, 3, '#3a2418'); R(3, 4, 9, 4, '#ece6d4'); R(4, 5, 3, 1, '#2a2a2a'); R(8, 5, 2, 2, '#2a2a2a'); R(4, 7, 5, 1, '#2a2a2a'); R(12, 4, 1, 4, '#3a2a1a'); },
    makiIn(g, e, t, R) { for (let r = 0; r < 3; r++) for (let i = 0; i < 3; i++) { R(1 + i * 5, 10 - r * 5, 5, 5, '#5a3c22'); R(2 + i * 5, 11 - r * 5, 3, 3, '#9a7a4a'); } }
  };

  /* ================= 公用：体温条、风雪跟着玩家 ================= */
  function hudFollow(S) {
    const p = S.pl;
    for (const id of ['hud', 'wx']) { const h = curMap().ents.find(e => e.id === id); if (h) { h.px = p.px; h.py = p.py; h.x = p.x; h.y = p.y; } }
    const h = curMap().ents.find(e => e.id === 'hud'); if (!h) return;
    h.num = Math.round(S.f.T ?? 100); h.s.wd = S.f.wood || 0; h.s.m = S.has('mino') ? 1 : 0;
    const fi = S.f.ph === 'night' ? Math.ceil((S.f.fire || 0) / 10) : null; if (h.s.fi !== fi) h.s.fi = fi;
  }
  async function frozen(S) {
    if (S.f._dying) return; S.f._dying = 1;
    bumpDeath(S, '_dCold'); S.clearTimer();
    TONE.frost(S); S.sfx('heart');
    await S.fade(.7, 900);
    await S.die('手脚早就没有知觉了。\n眼皮越来越沉……沉得睁不开。\n雪落在你身上，一层，又一层。', '冻僵了');
  }

  /* ================= 第一幕：渡口 ================= */
  const JZD = {
    hat: '雪在它头顶堆成一个宽宽的、平平的圆盘，盘沿上挂着一圈冰溜子。',
    blown: '它头顶的雪堆得圆圆的，像个馒头。\n脚边的雪里，斜插着一道弧形的草边。',
    towel: '它头顶的雪堆得圆圆的，像个馒头。\n下巴底下，两个冻得硬邦邦的小尖角从雪里支棱出来，被风吹得簌簌直抖。'
  };
  function jizoGoal(S) { S.goal('在六地藏那里找小屋的钥匙（留守书在「笺」里）' + (S.coop ? '——一人念留守书，一人看雪的形状' : '')); }
  async function arriveIntro(S) {
    const f = S.f; f.ph = 'arrive'; f.T = 100;
    const tj = S.rand(6); let bj = S.rand(5); if (bj >= tj) bj++;
    f.tj = tj; f.bj = bj;
    for (let i = 0; i < 6; i++) S.ent('jz' + i).s = { k: i === tj ? 'towel' : i === bj ? 'blown' : 'hat', b: 0 };
    S.follow('mosaku', true);
    await S.narr('风雪大得睁不开眼。\n天还没黑透，四下里已经白茫茫一片，分不清哪里是路，哪里是田。');
    await S.say('茂作', ['……巳之吉，前头就是渡口了。', '过了河，再走一里地就到家。']);
    await S.narr('（头顶那道横条是体温。在风雪里站着，它会一点一点往下掉。）');
    S.goal('去渡口（往东，河边）');
    S.cp('arrive');
  }
  async function dockScene(S) {
    const f = S.f; if (f.dock) return; f.dock = 1;
    S.focus(21, 2); await S.wait(500);
    await S.narr('河面上全是翻滚的雪。\n渡船——拴在对岸的木桩上，被雪埋了半截。');
    S.focus(null);
    await S.say('茂作', ['……渡守那家伙，早早收工回家了。', '这么大的风雪，喊破嗓子他也听不见。']);
    await S.say('茂作', '岸边有渡守歇脚的小屋。今晚……只好在那里熬一夜了。');
    S.goal('去渡守的小屋（河岸南边）');
  }
  async function itagiOn(S) {
    const e = S.ent('itagi'); e.s.sw = 1; TONE.itagi(S, 3); await S.wait(1500); e.s.sw = 0;
    await S.narr('你抡起木槌，敲了三下板木。\n梆——梆——梆——\n声音一出口，就被风撕碎了。对岸，一点灯光也没有。');
    if (!S.f.dock) await dockScene(S);
  }
  async function kasaTale(S) {
    await S.say('茂作', ['六地藏……你听过「笠地藏」吧？', '穷老头大年三十进城卖斗笠，一顶也没卖出去。回来的路上，看见六尊地藏淋着雪。', '他把斗笠一顶一顶给它们戴上。少了一顶，就解下自己的旧手巾，给最后那一尊包上了。', '……那天夜里，地藏菩萨扛着米和年糕，一直送到他家门口。']);
    await S.say('茂作', '渡守家的老婆子，怕是也学着编了斗笠。');
  }
  /* 拂错时：先按错法说一句（戴着斗笠的 / 斗笠被风刮掉的），再按错的次数逐级给提示 */
  async function jizoHint(S, k) {
    const n = S.f.jzMiss || 0, tj = S.f.tj;
    await S.say('茂作', k === 'hat' ? '……这一尊戴着斗笠呢。留守书上说的，是没赶上斗笠、包着手巾的那一尊。' : '……它脚边那顶斗笠，是让风刮掉的。它本来是戴着的。');
    if (n === 2) return S.say('茂作', ['戴着斗笠的，头顶的雪又宽又平；没戴的，雪是圆的。', '圆的里头，再看看谁的斗笠掉在脚边。']);
    if (n === 3) return S.say('茂作', '手巾在下巴底下打的结，结头会支棱出来。看看哪一尊的下巴底下有东西。');
    if (n >= 4) return S.say('茂作', '……左数第' + CN[tj] + '尊。下巴底下那两个尖角，就是手巾结。');
  }
  async function jizoOn(S, i) {
    const f = S.f, e = S.ent('jz' + i), k = e.s.k, n = '左数第' + CN[i] + '尊地藏。';
    if (f.ph === 'arrive' && S.once('kasa')) await kasaTale(S);
    if (e.s.b) {
      if (k === 'blown' && !e.s.fix) {
        const r = await S.ask(n + '它的斗笠掉在脚边的雪里。', ['捡起来，给它戴好', '算了']);
        if (r === 0) { e.s.fix = 1; S.sfx('select'); f.kind = (f.kind || 0) + 1; await S.narr('你拍掉斗笠上的雪，给它戴正，在下巴底下系好。\n石头的脸，好像在笑。'); }
        return;
      }
      return S.narr(n + (k === 'towel' ? '洗得发白的旧手巾在下巴底下打着结，冻得硬邦邦的。' : '斗笠底下，一张圆圆的、闭着眼的石头脸。'));
    }
    await S.narr(n + '\n' + JZD[k]);
    if (f.ph !== 'arrive' || S.has('key') || !S.ent('door').locked) return;
    if (!f.readRusu) { await S.think('（雪埋得这么厚……）'); return S.say('茂作', '别光看地藏了。小屋门上好像钉着块木板，先去看看写的什么。'); }
    const cost = 10 + 4 * (f.jzMiss || 0);   // 越拂手越僵：每拂错一次，下一次更冷
    const r = await S.ask(`拂掉它身上的雪？（手会冻得发麻：体温 −${cost}）`, ['拂掉', '先不动']);
    if (r) return;
    f.T = Math.max(1, (f.T ?? 100) - cost); S.sfx('step'); S.toast(`手冻得发麻（体温 −${cost}）`);
    e.s.b = 1;
    if (k === 'towel') {
      S.give('key');
      await S.narr('雪底下露出一块洗得发白的旧手巾，在下巴底下打了个结。\n地藏脚边，压着一个油纸包——里面是一把铁钥匙。');
      await S.say('茂作', '……就是这一尊。南无地藏菩萨，借用了。');
      S.goal('用钥匙打开小屋的门');
      return;
    }
    f.jzMiss = (f.jzMiss || 0) + 1;
    await S.narr(k === 'hat' ? '雪底下是一顶草编的斗笠，编得密密实实。\n脚边只有雪。' : '雪底下光秃秃的，没戴斗笠，也没包手巾。\n它的斗笠，掉在脚边的雪里——是让风刮掉的。脚边，什么也没有。');
    await jizoHint(S, k);
  }
  async function mosakuOn(S) {
    const f = S.f;
    S.face('mosaku', 'pl');
    if (f.ph === 'arrive') {
      if (!f.dock) return S.say('茂作', '渡口就在前头。走吧，别站着，越站越冷。');
      if (S.has('key') || !S.ent('door').locked) return S.say('茂作', '开门吧……我这脚，快冻得没知觉了。');
      if (!f.readRusu) return S.say('茂作', '小屋门上好像钉着什么。去看看。');
      return S.say('茂作', cycle(S, '_mo1', ['钥匙托给了六地藏……留守书上是这么写的吧？', '手揣在怀里，别老露在外头。拂一回雪，手就冻木一回。', '六地藏头上的雪——你看那形状。']));
    }
    if (f.ph === 'hut') return S.say('茂作', S.has('hiuchi') ? '柴在屋檐底下。披上蓑衣，快去快回。' : '火镰该在架子上……先把火生起来。');
    if (f.ph === 'night') {
      if (nextTo(S, 'mosaku') && S.once('hugTalk')) return S.say('茂作', ['……对，挨着坐。', '两个人挤着，比一个人暖和。']);
      return S.say('茂作', cycle(S, '_mo2', [
        ['柴烧得快。屋檐底下的抱完了，西边的船棚里还有。', '怀里一回只抱得动两捆。'],
        '墙缝里灌风。船棚里有稻草，塞上就好些。',
        '过来，挨着我坐。别光守着火——人也是一团火。',
        ['……巳之吉，外头风声要是忽然尖起来，雪里看见什么白的——', '别动。屏住气，等风过去。']
      ]));
    }
    return S.narr('老爹靠着墙，眯着眼，像是睡着了。');
  }
  async function doorOn(S) {
    const d = S.ent('door'), f = S.f, p = S.pl;
    if (d.locked) {
      if (!f.readRusu) {
        f.readRusu = 1; await S.narr('门上挂着一把铁锁。门板上钉着一块薄木板，是渡守的留守书。'); await S.note('rusu');
        if (!S.has('key')) { f.dock = 1; jizoGoal(S); S.cp('arrive'); }   // 找钥匙前存档：冻死重来不用再读一遍
      }
      if (!S.has('key')) { jizoGoal(S); return S.narr('铁锁冻得粘手。……钥匙托给了六地藏。'); }
      S.take('key'); d.locked = false; d.open = true; d.solid = false; S.sfx('open');
      await S.narr('钥匙在锁眼里转了半圈——「咔」。\n板门被风一推，自己开了。');
      S.goal('进小屋');
      return;
    }
    if (p.x === 20 && p.y === 14) return S.narr('站在门槛上，关不了门。');
    if (d.open) { d.open = false; S.sfx('close'); f.blown = 0; if (S.once('doorClose')) S.toast('门关上了：屋里的热气不往外跑'); }
    else { d.open = true; S.sfx('open'); }
  }
  async function doorBump(S) { if (S.ent('door').locked) return doorOn(S); }
  /* 开了锁以后门不挡路：走上门槛就拉开，走开两格自己合上（被风撞开的除外） */
  async function doorTouch(S) { const d = S.ent('door'); if (!d.locked && !d.open) { d.open = true; S.sfx('open'); } }

  /* ================= 第二幕：渡守的小屋 ================= */
  async function hutScene(S) {
    const f = S.f; if (f.ph !== 'arrive') return; f.ph = 'hut';
    await S.fade(1, 300);
    S.follow('mosaku', false); S.place('mosaku', 19, 12, 2); S.pos(21, 13, 3);
    await S.fade(0, 300);
    S.amb('room');
    await S.narr('屋里没有风了。可也没有火。\n地炉里是冷透的灰，水缸冻成了一整块冰。');
    await S.say('茂作', ['……得生火。', '渡守的火镰，该在架子上。柴……屋檐底下有。', '去吧，巳之吉。我这把老骨头，先坐一坐。']);
    await S.say('茂作', '外头冷。墙上挂着蓑衣，披上再出门。');
    S.goal(nightGoalText(S));
    S.cp('hut');
  }
  function nightGoalText(S) {
    const f = S.f, co = S.coop ? '（双人：一人盯火和体温，一人出门抱柴；风声变尖就喊「别动」）' : '';
    if (f.ph === 'hut') return !S.has('hiuchi') ? '生火：架子上找火镰，屋檐下抱柴' : !f.wood ? '去屋外抱柴（屋檐底下有）' : '把柴放进地炉，用火镰点火';
    const p = S.pl, d = S.ent('door');
    if (f.blown && d && d.open) return '风把门撞开了——去把门关上（对着门按调查）' + co;
    if (f.fire <= 0) return '火灭了！快抱柴回来点上' + co;
    f._low = f.fire < 25 || (f._low && f.fire < 40);
    if (f._low) return '火快灭了——出门抱柴（屋檐下 / 西边船棚）' + co;
    return '守住火，熬过前半夜：添柴、稻草塞墙缝、挨着茂作坐' + co;
  }
  function iroriVis(S) {
    const f = S.f, e = S.ent('irori'); if (!e) return;
    e.num = Math.round(f.fire || 0); e.s.em = (f.fire || 0) <= 0 && f.lit ? 1 : 0;
    const b = Math.ceil((f.fire || 0) / 20);
    if (b !== f._lb) { f._lb = b; e.light = b ? { r: 1.6 + b * .5, col: 'rgba(255,140,60,.2)', flick: true } : (f.lit ? { r: .9, col: 'rgba(200,60,20,.15)' } : null); }
  }
  async function tanaOn(S) {
    const e = S.ent('tana');
    if (e.open) return S.narr('架子上还剩一个小陶罐，装着粗盐。罐口结了一圈白霜。');
    e.open = true; S.give('hiuchi');
    await S.narr('架子上有个小木匣。打开来，是一块火石、一片月牙形的火镰，还有一团干透了的火绒。');
    if (S.f.ph === 'hut') S.goal(nightGoalText(S));
  }
  async function minoOn(S) {
    const e = S.ent('minoW');
    if (e.open) return S.narr('挂蓑衣的木钉空着。');
    e.open = true; S.give('mino'); S.wear('@meMino');
    await S.narr('你把墙上那件蓑衣披在身上。稻草扎得厚厚的，一股陈年的草腥味。');
    S.toast('披上蓑衣：在屋外掉温慢一些');
  }
  async function takeWood(S, from, label) {
    const f = S.f, e = S.ent(from);
    if ((f.wood || 0) >= 2) return S.narr('怀里已经抱了两捆，再多就抱不住了。');
    if (!(e.num > 0)) return S.narr(label + '的柴抱光了。' + (from === 'makiA' ? '\n西边的船棚里还有。' : ''));
    e.num--; f.wood = (f.wood || 0) + 1; TONE.log(S);
    if (S.once('wood1')) await S.narr('你扒开积雪，抽出一捆冻得梆硬的柴。');
    S.toast(`抱起一捆柴（怀里 ${f.wood} 捆，${label}还剩 ${e.num} 捆）`);
    if (f.ph === 'hut' || f.ph === 'night') S.goal(nightGoalText(S));
  }
  async function makiOn(S) {
    if (S.f.ph === 'arrive') return S.narr('屋檐底下码着几捆柴，上头压着厚厚的雪。');
    if (S.f.ph !== 'hut' && S.f.ph !== 'night') return S.narr('屋檐下空空的。');
    return takeWood(S, 'makiA', '屋檐下');
  }
  async function goyaOn(S) {
    const f = S.f, e = S.ent('goya');
    if (f.ph !== 'hut' && f.ph !== 'night') return S.narr('渡守的船棚。里头倒扣着一条旧船，船底长满了青苔。');
    if (e.s.wara) {
      e.s.wara = 0; f.wara = 3; S.give('wara');
      await S.narr('船棚里堆着几捆稻草。你抱了一大抱——够塞三道墙缝。');
    }
    if (e.num > 0 && (f.wood || 0) < 2) return takeWood(S, 'goya', '船棚里');
    if (!(e.num > 0)) return S.narr('船棚里的柴也抱光了。只剩那条倒扣的旧船。');
    return S.narr('怀里抱不下了。');
  }
  async function gapOn(S, i) {
    const f = S.f, e = S.ent('gap' + i);
    if (e.covered) return S.narr('墙缝塞得严严实实的。风声小了。');
    if (f.wara > 0) {
      e.covered = true; f.wara--; f.plug = (f.plug || 0) + 1; S.sfx('paper');
      if (!f.wara) S.take('wara');
      await S.narr('你把稻草拧成一股，使劲塞进墙缝里。');
      S.toast(`墙缝塞上了（${f.plug}/3）：屋里冷得慢些，火也烧得省些`);
      return;
    }
    return S.narr('风从板缝里往里灌，带着雪沫子，吹在脸上像针扎。\n得找东西塞上——' + (f.ph === 'night' || f.ph === 'hut' ? '西边船棚里有稻草。' : '……'));
  }
  async function kaiOn(S) {
    const f = S.f, e = S.ent('kai');
    if (e.open) return S.narr('劈开的船桨，只剩一截桨把。');
    if (f.ph !== 'night') return S.narr('墙角靠着一支备用的船桨。桨叶上刻着「权」字。');
    if ((f.wood || 0) >= 2) return S.narr('怀里已经抱着两捆柴了。先把柴添进地炉。');
    const r = await S.ask('墙角靠着一支备用的船桨。劈了烧火？', ['劈了（能顶一捆柴）', '算了，那是人家吃饭的家伙']);
    if (r) return;
    e.open = true; f.kai = 1; f.wood = (f.wood || 0) + 1; TONE.log(S); S.sfx('thud');
    await S.narr('你把船桨踩在脚下，「咔」一声撅成两截。');
    await S.say('茂作', '……开春，我替你赔渡守一支。');
    S.goal(nightGoalText(S));
  }
  async function iroriOn(S) {
    const f = S.f;
    if (f.ph === 'arrive') return S.narr('地炉里是冷透的灰。');
    if (f.ph === 'hut') {
      if (!S.has('hiuchi')) return S.narr('地炉里是冷透的灰。没有火镰火石，点不着。');
      if (!f.wood) return S.narr('地炉里一根柴也没有。屋檐底下有。');
      return lightFirst(S);
    }
    if (f.ph !== 'night') return S.narr('地炉里只剩一点暗红。');
    if (f.wood > 0) {
      const was = f.fire;
      f.fire = Math.min(100, f.fire + WOOD * f.wood); f.wood = 0; f.lit = 1; f._ins = undefined;
      if (was <= 0) { TONE.flint(S, 2); await S.wait(700); S.sfx('match'); }
      TONE.crackle(S); iroriVis(S);
      await S.narr(was <= 0 ? '你又打着了火。火苗舔着新柴，慢慢旺起来。' : '你把柴架进地炉。火「呼」地一下旺了。');
      S.goal(nightGoalText(S));
      return;
    }
    const v = f.fire;
    return S.narr(v <= 0 ? '火灭了。灰底下只剩几点火星。' : v < 30 ? '火苗矮下去了，只剩几根柴头还红着。' : v < 70 ? '火烧得正稳。烤得脸发烫，后背还是凉的。' : '火烧得旺旺的。铁壶里的雪水，咕嘟咕嘟地响。');
  }
  async function lightFirst(S) {
    const f = S.f;
    f.wood--; 
    await S.narr('你把柴架进地炉，掏出火绒塞在底下。');
    TONE.flint(S, 3); await S.wait(1000); TONE.flint(S, 2); await S.wait(800);
    S.sfx('match'); f.fire = 55; f.lit = 1; iroriVis(S); S.amb('fire');
    await S.narr('火星子落进火绒——冒了一缕烟——\n「噗」的一声，火苗蹿了起来。');
    S.face('mosaku', 2);
    await S.say('茂作', ['……好，好。', '巳之吉，过来烤烤手。']);
    await S.say('茂作', '这一夜还长着呢。我跟你说说，山里人冬天的规矩。');
    await S.note('mosaku');
    f.ph = 'night'; f.gT = 14; f._ins = undefined; S.ent('wx').s.dk = '#0c1018'; S.dark(.87);
    S.timer(NIGHT, '夜还长', yukiCome);
    S.goal(nightGoalText(S));
    S.cp('night');
  }
  function resetNight(S) {
    const f = S.f;
    f.T = Math.max(f.T ?? 0, 80); f.fire = Math.max(f.fire ?? 0, 50); f.lit = 1; f.gust = 0; f.blown = 0;
    const d = S.ent('door'); d.open = false; d.solid = false; f.gT = 12; f._dying = 0; f._ins = undefined; f._lb = -1; f._cb = -1;
    S.hide('shade'); S.ent('mado').face = false; S.ent('wx').s.g = 0; S.ent('wx').s.dk = '#0c1018'; S.dark(.87); S.plr(null); S.speed(1);
    iroriVis(S);
  }
  /* ---- 前半夜：每帧 ---- */
  function ferryTick(S, dt) {
    const f = S.f, p = S.pl, ph = f.ph;
    hudFollow(S);
    if (ph === 'hold') return holdTick(S, dt);
    if (ph !== 'arrive' && ph !== 'hut' && ph !== 'night') return;
    const ins = HUT(p.x, p.y), door = S.ent('door');
    if (ins !== f._ins) {
      f._ins = ins;
      S.speed(ins || ph === 'arrive' ? 1 : .8);
      if (ph !== 'arrive') S.amb(ins ? (f.fire > 0 ? 'fire' : 'room') : 'wind');
      if (!f.gust) S.plr(ins ? 2.8 : null);
      if (!ins && ph !== 'arrive' && S.once('outTip')) S.toast('屋外：体温掉得快（看头顶的体温条）');
    }
    if (W.busy || W.ended) return;
    if (ph !== 'arrive' && door.open && !f.blown && Math.abs(p.x - 20) + Math.abs(p.y - 14) >= 2) { door.open = false; S.sfx('close'); }
    if (ph === 'night' && f.fire > 0) {
      const k = (door.open ? 1.4 : 1) * (1 - .08 * (f.plug || 0));
      f.fire = Math.max(0, f.fire - BURN * k * dt);
      if (f.fire <= 0) { S.amb(ins ? 'room' : 'wind'); if (S.once('fireOut')) S.toast('火灭了！'); }
    }
    iroriVis(S);
    let dT;
    if (ph === 'arrive') dT = -R1;
    else if (ins) {
      if (f.fire > 0) dT = NEARF(p.x, p.y) ? NEARW : INW;
      else dT = ph === 'hut' ? -PRE : -(COLD - PLUG * (f.plug || 0)) - (door.open ? DOORL : 0);
      if (ph === 'night' && nextTo(S, 'mosaku')) { dT += HUGW; if (S.once('hugTip')) S.toast('挨着茂作老爹：两个人挤着，暖和些'); }
      if (ph === 'night' && f.fire <= 0) dT = Math.min(dT, -.8);
      if (ph === 'night' && door.open && f.blown) { f._doT = (f._doT || 0) + dt; if (f._doT > 4 && S.once('doorNag')) S.run(async S => { S.face('mosaku', 3); await S.say('茂作', '巳之吉，门！把门带上——热气全跑了。'); }); } else f._doT = 0;
      if (f.fire > 0) { f._ck = (f._ck ?? 2) - dt; if (f._ck <= 0) { f._ck = 2.5 + Math.random() * 2; TONE.crackle(S, NEARF(p.x, p.y) ? 3 : 2, NEARF(p.x, p.y) ? 1 : .45); } }
    } else dT = -OUT * (S.has('mino') ? MINOK : 1) * (f.gust && f.gOut ? GUSTK : 1);
    f.T = clamp((f.T ?? 100) + dT * dt, 0, 100);
    if (f.T <= 0) { S.run(frozen); return; }
    /* 冷：心跳、光圈缩小 */
    if (f.T < 25) { f._hb = (f._hb || 0) - dt; if (f._hb <= 0) { S.sfx('heart'); f._hb = f.T < 12 ? .6 : 1; } }
    const cb = f.T < 15 ? 2 : f.T < 30 ? 1 : 0;
    if (cb !== f._cb && !f.gust) { f._cb = cb; S.plr(cb ? (cb === 2 ? 1.2 : 1.6) : (ins ? 2.8 : null)); }
    if (f.T < 30 && ph !== 'arrive' && S.once('coldWarn')) S.run(async S => { S.bubble('mosaku', '!', 1000); await S.say('茂作', '巳之吉！你脸都青了——快到火边来！'); });
    if (f.T < 30 && ph === 'arrive' && S.once('coldWarn1')) S.run(async S => { await S.say('茂作', '……巳之吉，不能在雪里耗着了。快找钥匙！'); });
    if (ph === 'night') gustTick(S, dt);
    f._gl = (f._gl || 0) - dt; if (f._gl <= 0 && ph !== 'arrive') { f._gl = .5; S.goal(nightGoalText(S)); }
  }
  /* ---- 白风：风声尖起来，雪里站着一个白影。屋外的人要站住不动 ---- */
  function shadeSpot(S) {
    const p = S.pl, m = curMap(), d = DIRS[p.dir], c = [];
    for (let r = 3; r <= 5; r++) for (let k = -2; k <= 2; k++) {
      const x = p.x + d[0] * r + (d[0] ? 0 : k), y = p.y + d[1] * r + (d[1] ? 0 : k);
      if (!HUTR(x, y) && y >= 6 && passable(m, x, y)) c.push([x, y]);
    }
    if (!c.length) for (const [dx, dy] of [[4, 0], [-4, 0], [0, 4], [0, -4], [3, 3], [-3, -3], [3, -3], [-3, 3]]) { const x = p.x + dx, y = p.y + dy; if (!HUTR(x, y) && y >= 6 && passable(m, x, y)) { c.push([x, y]); break; } }
    return c.length ? c[(Math.random() * c.length) | 0] : [p.x + 3, p.y];
  }
  function startGust(S) {
    const f = S.f, p = S.pl, ins = HUT(p.x, p.y);
    f.gust = 3; f.gG = .7; f.gHit = false; f.gOut = !ins; f.gN = (f.gN || 0) + 1;
    TONE.gust(S); S.ent('wx').s.g = 1; S.dark(.9);
    if (!ins) {
      S.plr(1.3);
      const [x, y] = shadeSpot(S); S.place('shade', x, y, 0); S.ent('shade').alpha = 0;
      if (S.once('gust1')) S.run(async S => { S.sfx('sting'); await S.narr('风声忽然尖了起来——\n雪幕里，站着一个白色的人影。'); await S.think('（……别动。屏住气。）'); });
    } else {
      S.ent('mado').face = true; S.sfx('sting');
      f.fire = Math.max(0, f.fire - 12);
      const d = S.ent('door');
      if (!d.open) { d.open = true; S.sfx('open'); S.bubble('mosaku', '!', 1000); }
      f.blown = 1;
      if (S.once('madoFace')) S.run(async S => { await S.narr('「哐」——风把门撞开了。\n窗格子外头，贴着一张雪白的脸。\n……一眨眼，又只剩下雪。'); await S.say('茂作', '……关上门。别往外看。'); });
    }
  }
  function endGust(S) {
    const f = S.f, ins = HUT(S.pl.x, S.pl.y);
    f.gust = 0; f.gT = 15 + Math.random() * 7;
    S.hide('shade'); S.ent('mado').face = false; S.ent('wx').s.g = 0; S.dark(.87); f._cb = -1;
    S.plr(ins ? 2.8 : null);
  }
  function breathHit(S) {
    const f = S.f; f.gHit = true; f.breaths = (f.breaths || 0) + 1;
    const loss = Math.round(BREATH * (S.has('mino') ? .8 : 1));
    f.T = Math.max(0, f.T - loss);
    TONE.breath(S); TONE.frost(S); S.fx('flash'); S.shake(300, 2); S.face('shade', 'pl');
    if (f.T <= 0) { S.run(frozen); return; }
    if (f.breaths === 1) S.run(async S => { await S.narr('那个白影，朝你这边吹了一口气。\n一股冷得发疼的风从领口灌进去，一直钻到骨头缝里。'); await S.think('（……她看见我动了。）\n风声尖起来的时候，站住，一下也别动。'); });
    else S.toast(`她朝你吹了一口气（体温 −${loss}）`);
  }
  function gustTick(S, dt) {
    const f = S.f;
    if (!f.gust) { f.gT = (f.gT ?? 14) - dt; if (f.gT <= 0) startGust(S); return; }
    f.gust -= dt; f.gG -= dt;
    if (f.gOut) {
      const sh = S.ent('shade'); if (!sh.hidden) sh.alpha = Math.min(.9, sh.alpha + dt * 2);
      if (f.gG <= 0 && !f.gHit && S.moving) breathHit(S);
    }
    if (f.gust <= 0) endGust(S);
  }

  /* ================= 后半夜：雪女 ================= */
  async function yukiCome(S) {
    const f = S.f; if (f.ph !== 'night') return;
    f.ph = 'late'; if (f.gust) endGust(S);
    await S.narr('不知什么时候，风声低了下去。');
    await S.fade(1, 1000);
    S.hide('hud'); f.wood = 0;
    const d = S.ent('door'); d.open = false;
    S.hide('mosaku'); S.hide('mushiro'); S.show('moLie'); S.ent('moLie').s.fz = 0;
    f.fire = 4; f._lb = -1; iroriVis(S);
    S.wear('meLie'); S.pos(23, 12, 0); S.speed(1); S.plr(1.8); S.dark(.86); S.amb('wind');
    await S.card('后半夜', '', '地炉里只剩一点暗红。\n\n茂作老爹早就睡着了。\n你们俩挤在草席上，盖着蓑衣，\n听着风雪一下一下地撞门。\n\n不知什么时候，你也睡着了。');
    await S.fade(0, 900);
    await S.narr('……脸上一凉。\n你睁开眼。雪花正一片一片，落在你的脸上。');
    S.sfx('open'); d.open = true; S.shake(400, 2); TONE.gust(S, .6);
    await S.narr('小屋的门，不知什么时候开了。');
    S.place('yuki', 20, 14, 3); S.ent('yuki').alpha = 0; await S.alpha('yuki', 1, 1200);
    await S.narr('借着雪光，你看见屋里站着一个女人。\n浑身雪白。');
    await S.walk('yuki', [22, 11], 1.2); S.face('yuki', 2);
    S.place('breath', 22, 11, 2); TONE.breath(S);
    await S.narr('她朝茂作老爹俯下身去，吹了一口气。\n那口气，像一缕亮晶晶的白烟。');
    S.ent('moLie').s.fz = 1; TONE.frost(S); S.hide('breath');
    await S.think('（老爹……！）\n你想喊。喉咙里发不出一点声音。');
    S.face('yuki', 0); await S.wait(500);
    await S.walk('yuki', [22, 12], .9); S.face('yuki', 2);
    await S.narr('她转过身来，朝你俯下身——');
    await S.scare('face', { spr: '@yuki', dur: 1.2 });
    await S.narr('她的脸，几乎贴到了你的脸上。\n很美。美得叫人害怕。\n那双眼睛，冷得像冬夜里的井水。');
    S.goal('屏住气——一下也别动');
    S.cp('yuki');
    await startHold(S);
  }
  async function startHold(S) {
    const f = S.f; f.ph = 'hold'; f.hG = .6;
    if (f._dHold) await S.think(f._dHold > 1 ? '（方向键一下也别碰。等她自己直起身子。）' : '（……这一回，一根手指头也不能动。）');
    else await S.think('（……屏住气。一下也别动。）');
    S.goal('屏住气——一下也别动' + (S.coop ? '（联机：操作的人别碰方向键）' : ''));
    S.timer(6, '屏住气', holdDone);
  }
  function holdTick(S, dt) {
    const f = S.f; if (W.busy) return;
    f.hG -= dt; if (f.hG > 0) return;
    f._hb = (f._hb || 0) - dt; if (f._hb <= 0) { S.sfx('heart'); f._hb = .8; }
    if (!S.moving) return;
    S.pos(23, 12, 0);
    if (!f.hWarn) {
      f.hWarn = 1; f.hG = .8;
      S.run(async S => { S.bubble('yuki', '…', 1400); TONE.frost(S); await S.narr('你的手指动了一下。\n她停住了，慢慢歪过头，像在听什么。'); await S.think('（……别动。别动。别动。）'); S.timerAdd(2); });
      return;
    }
    S.clearTimer(); f.ph = 'holdx'; S.run(breathDie);
  }
  async function breathDie(S) {
    bumpDeath(S, '_dHold');
    S.place('breath', 22, 12, 2); TONE.breath(S); TONE.frost(S);
    await S.narr('她轻轻叹了口气。\n「……你动了。」');
    await S.scare('flash', { sfx: 'sting', dur: .6 });
    S.hide('breath');
    await S.die('一缕亮晶晶的白烟，落在你的脸上。\n冷。\n……然后，什么都不冷了。', '她吹了一口气');
  }
  async function holdDone(S) {
    const f = S.f; if (f.ph !== 'hold') return; f.ph = 'promise'; S.goal('');
    await S.say('雪女', ['……我本来，想让你也跟他一样。', '可是，我有点可怜你——你还这么年轻。', '你长得真好看，巳之吉。我现在，不伤你。'], { style: 'whisper' });
    await S.say('雪女', ['可是，今晚看见的事，你要是告诉任何人——', '哪怕是你的母亲——我都会知道。', '到那时，我就杀了你。'], { style: 'whisper' });
    await S.say('雪女', '……记住我的话。', { style: 'big' });
    S.face('yuki', 0);
    await S.walk('yuki', [20, 14], 1.4);
    TONE.gust(S, .5); await S.alpha('yuki', 0, 1000);
    await S.narr('她走出门去。风雪一下子，把她吞没了。');
    S.wear('@me'); S.pos(22, 12, 2);
    await S.narr('你终于能动了。你爬起来扑到门口——外头只有雪，什么也没有。');
    await S.say('巳之吉', '老爹！茂作老爹！', { style: 'big' });
    S.face('pl', 3);
    await S.narr('你摸到老爹的脸。\n冷得像冰。');
    await S.narr((S.has('mino') ? '你把身上的蓑衣解下来，盖在老爹身上，一直盖到下巴。' : '你把老爹身上的蓑衣往上拉了拉，一直盖到下巴。') + '\n就像这一夜，他怕你冷，一遍一遍叫你挨着他坐那样。');
    await S.fade(1, 1400);
    await S.card('天亮以后', '', '天亮的时候，渡守划着船过来，在小屋里找到了你们。\n茂作老爹早已冻僵了。你倒在他身边，人事不省。\n\n你病了很久。\n村里人问起那一夜，你只说：冷，太冷了。\n\n——别的，你一个字也没说。');
    S.speed(1); S.plr(null); S.dark(null); S.lights(null);
    f.ph = 'road0';
    await S.go('road', 1, 6, 2);
  }

  /* ================= 第三幕：村道（第二年冬天 / 十年后） ================= */
  async function roadIntro(S) {
    const f = S.f; f.ph = 'road0';
    S.wear('@me'); S.pos(2, 6, 2);
    await S.card('第二年冬天', '', '又一个下雪的傍晚。\n巳之吉背着柴，从山里往回走。');
    S.place('tabi', 15, 6, 1); await S.walk('tabi', [4, 6], 2.2); S.face('tabi', 1); S.face('pl', 2);
    await S.narr('路上迎面走来一个姑娘。\n个子高高的，身子很单薄，模样好看极了。');
    await S.say('姑娘', '……您好。');
    await S.narr('她回你的招呼，声音清清亮亮的，像鸟叫一样好听。');
    await S.say('姑娘', ['我叫阿雪。爹娘前些日子都不在了。', '我想去江户。那边有几户穷亲戚，兴许能帮我找个做女佣的地方。']);
    const r = await S.ask('「江户啊……」', ['「……许了人家没有？」', '「这么冷的天，一个人赶路？」']);
    if (r === 0) await S.say('阿雪', '（笑）……还没有呢。');
    else await S.say('阿雪', ['一个人惯了。', '……冷，我倒是不怕。']);
    await S.say('阿雪', '您呢？成亲了吗？');
    await S.say('巳之吉', '家里只有一个守寡的老娘。……还没顾上。');
    await S.narr('后来，两个人都不说话了，并排往前走。\n老话说：有心的话，眼睛也会像嘴一样说话。');
    await S.narr('走到村口的时候，你们已经很喜欢对方了。');
    await S.say('巳之吉', '……天快黑了。到我家歇歇脚吧。');
    S.bubble('tabi', '♥', 1200);
    await S.say('阿雪', '……嗯。');
    await S.fade(1, 1000);
    S.hide('tabi');
    await S.card('后来', '', '娘很喜欢阿雪，留她住了下来。\n阿雪再也没去江户。\n\n她做了你的媳妇。\n五年后娘临终的时候，最后说的，也是阿雪的好话。');
    await S.card('十年后', '', '阿雪给你生了好几个孩子，男孩女孩，一个比一个白净好看。\n村里的女人们都说，阿雪是个了不起的人——\n可她们也说，怪得很：\n生了那么多孩子，她还和刚进村那天，一模一样。');
    S.wear('@me2'); S.pos(1, 6, 2);
    for (const id of ['kichi', 'haru', 'baba', 'nyobo']) S.show(id);
    f.ph = 'road';
    await S.fade(0, 900);
    await S.narr('又是一个下雪的傍晚。\n巳之吉背着柴，走在回家的路上。');
    S.goal('天黑了，回家（村子东头，窗里亮着灯的那一户）');
    S.cp('road');
  }
  async function babaOn(S) {
    S.face('baba', 'pl');
    if (S.once('babaTale')) {
      await S.say('阿松婆婆', ['巳之吉，回来啦。……今年的雪来得早。', '夜里落雪，可别在屋里讲雪女的故事。讲了，她就站在门外听。']);
      await S.say('阿松婆婆', ['山那边的老人还讲过一个：风雪夜里，有个白净的姑娘来投宿，后来就嫁给了那家的男人。', '什么都好，就是怎么也不肯洗热水澡。', '男人心疼她，非要她泡一泡、暖暖身子——', '第二天早上，浴桶里只剩一根细细的冰凌，和一把梳子。']);
      S.f.icicle = 1;
      return S.say('阿松婆婆', '……瞧我，又讲这些。快回去吧，阿雪等着呢。');
    }
    return S.say('阿松婆婆', cycle(S, '_ba', ['快回去吧，阿雪等着呢。', '你家阿雪啊，见了谁都笑眯眯的。……就是那双手，凉得很。', '雪夜里，别讲雪女。']));
  }
  async function nyoboOn(S) {
    S.face('nyobo', 'pl');
    if (S.once('nyobo')) return S.say('邻家媳妇', ['哎，巳之吉。', '你家阿雪是怎么保养的？生了那么多孩子，脸还跟刚嫁过来那年一模一样。', '……我们这些人，早成黄脸婆喽。']);
    return S.say('邻家媳妇', '阿雪下午在河边站了好久，看那雪落进水里。……她可真喜欢雪呀。');
  }
  async function kidsOn(S) {
    const f = S.f;
    if (!f.kids) {
      f.kids = 1;
      S.face('kichi', 'pl'); S.face('haru', 'pl');
      await S.say('吉太', '爹！你看，我们堆了个雪女！');
      await S.say('阿春', ['娘看见了，摸摸它的脸，笑了。', '娘的手跟雪一样凉。']);
      await S.say('吉太', ['娘说，等今年头一场大雪下来，她又要站在门口看一整夜。', '爹，晚上讲个吓人的故事吧！要最吓人的！']);
      await S.say('阿春', '我们先回家啦——！');
      await S.fade(1, 400); S.hide('kichi'); S.hide('haru'); await S.fade(0, 400);
      return;
    }
    return S.narr('孩子们已经跑回家去了。');
  }
  async function darumaOn(S) {
    await S.narr('孩子们堆的「雪女」。木炭当头发，红果子当嘴唇。\n雪做的脸，在暮色里白得发青。');
    if (S.once('darumaT')) await S.think('（……那一夜的事，跟谁都不能说。）\n（十年了。连阿雪，也不能。）');
  }

  /* ================= 第四幕：家 ================= */
  async function homeIntro(S) {
    const f = S.f; f.ph = 'home';
    S.amb('fire');
    S.face('oyuki', 0);
    await S.say('阿雪', '回来啦。冷吧？快去火边暖暖。');
    await S.narr('她接过你背上的柴。手指碰到你的手背——凉的。\n像刚从雪里捧出来。');
    await S.say('吉太', '爹！讲故事！讲吓人的！');
    await S.say('阿春', '要最吓人的！像百物语那样，讲完一个吹一支蜡烛！');
    await S.say('阿雪', '……就讲一个。讲完就睡。');
    await S.walk('oyuki', [5, 3], 2.4); S.face('oyuki', 1);
    S.cp('story');
    await storyScene(S);
  }
  async function storyScene(S) {
    const f = S.f;
    S.place('kiA', 12, 9, 1); S.place('haA', 13, 9, 1); S.face('pl', 2);
    await S.narr('孩子们挨着你坐下，眼巴巴地看着你。\n座敷那边，阿雪在行灯底下拿起了针线。');
    let r = await S.ask('讲个什么故事？', ['讲……那年冬天，渡口小屋里的事', '讲「笠地藏」', '「太晚了，明天再讲。」']);
    if (r === 0) {
      await S.narr('你张开嘴：「那年冬天，爹十八岁……」');
      S.sfx('heart');
      await S.narr('座敷那边，针线的声音，停了。');
      await S.think('（……说出来吧。憋了十年了。孩子们只当是个故事……）');
      const c = await S.ask('孩子们屏着气等你往下讲。', ['接着讲下去', '「……不对不对，爹记岔了。讲笠地藏吧。」']);
      if (c === 0) return toldEnd(S, 'kids');
      r = 1;
    }
    if (r === 1) {
      await S.narr('你讲了穷老头大年三十卖不出去的斗笠，讲了雪地里的六尊地藏，讲了少的那一顶，和老头解下来的旧手巾。');
      await S.say('阿春', '……后来呢？');
      await S.narr('后来，地藏菩萨扛着米和年糕，一直送到了老头家门口。\n「嘿呦、嘿呦」——');
      await S.say('吉太', '……嘿呦……嘿呦……');
      await S.narr('话没说完，两个小脑袋已经一点一点，靠在你身上睡着了。');
      f.story = 1;
    } else {
      await S.say('阿春', '……那明天一定要讲！');
      await S.say('吉太', '要最吓人的！拉钩！');
      await S.narr('你跟两只冰凉的小手指拉了钩。\n说好了的事，就要做到。');
      f.story = 2;
    }
    await S.fade(1, 600);
    S.hide('kiA'); S.hide('haA'); S.ent('kf0').s.in = 1; S.ent('kf1').s.in = 1;
    await S.fade(0, 600);
    S.goal('孩子们睡了。收拾一下，去跟阿雪说说话（她在行灯下缝衣服）' + (S.coop ? '（双人：一人翻「笺」念娘留下的话，一人照着做）' : ''));
    S.cp('home');
  }
  const accAll = S => S.f.aK && S.f.aM && S.f.aU;
  function accCheck(S) {
    const n = (S.f.aK ? 1 : 0) + (S.f.aM ? 1 : 0) + (S.f.aU ? 1 : 0);
    if (n === 2 && S.once('acc2')) S.run(async S => { await S.think(S.f._o_haha ? '（娘的字条上写的那几样……还差一样。）' : '（她喜欢的东西……还有什么，是我一直没替她做的？）'); });
    if (accAll(S) && S.once('accAll')) S.run(async S => { await S.think('（天窗、凉水、埋上的火……）\n（她喜欢的，都是冷的东西。……其实，我一直都知道。）'); });
  }
  async function butsudanOn(S) {
    if (S.once('haha')) { await S.narr('佛龛里供着娘的牌位。牌位后面压着一张折好的纸。'); await S.note('haha'); return; }
    return S.narr('娘的牌位前，一炷香快烧到头了。\n香灰弯弯地垂着，没有断。');
  }
  async function tsukueOn(S) { if (S.once('tenarai')) { await S.narr('矮桌上摊着吉太的习字本。'); return S.note('tenarai'); } return S.narr('吉太的习字本。「雪」字写了满满一页，越写越歪。'); }
  async function kemuriOn(S) {
    const f = S.f, e = S.ent('kemuri');
    if (e.open) return S.narr('天窗拉开了一道缝。雪花一片一片飘进来，落在地炉边，滋地化了。');
    const r = await S.ask('地炉正上方的天窗（烟出し），拉绳垂在柱子边。', ['拉开一道缝', '算了']);
    if (r) return;
    e.open = true; f.aK = 1; S.sfx('open');
    await S.narr('一股冷风从天窗灌下来。几片雪花打着旋儿飘落。');
    S.bubble('oyuki', '…', 1200);
    await S.narr('座敷那边，阿雪抬起头，朝天窗看了一眼。\n肩膀，轻轻地松了下来。');
    accCheck(S);
  }
  async function kameOn(S) {
    if (S.has('hiyamizu') || S.f.aM) return S.narr('缸里的水冰凉，水面上浮着一层薄冰。');
    const r = await S.ask('缸里的水冰凉，水面上浮着一层薄冰。', ['舀一碗凉水', '算了']);
    if (r) return;
    S.give('hiyamizu');
  }
  async function chawanOn(S) {
    const f = S.f, e = S.ent('chawan');
    if (f.aM) return S.narr('茶碗里是一碗清清的凉水。');
    if (S.has('hiyamizu')) {
      S.take('hiyamizu'); e.full = true; e.lit = false; f.aM = 1; S.sfx('water');
      await S.narr('她的茶碗里，是一碗冲好的热茶，一口没动。\n你把热茶倒掉，换上了缸里的凉水，轻轻放回她手边。');
      S.face('oyuki', 2); S.bubble('oyuki', '♥', 1200);
      await S.narr('阿雪看了看茶碗，又看了看你。什么也没说，嘴角弯了一下。');
      accCheck(S);
      return;
    }
    return S.narr('她手边的茶碗里，是一碗热茶，冒着热气，一口也没动。\n针线笸箩里，是吉太的小褂，补了一半。');
  }
  async function irori2On(S) {
    const f = S.f, e = S.ent('irori2');
    if (f.aU) return S.narr('炭埋在灰里，只透出一点暗红。屋里凉丝丝的，孩子们在被窝里睡得很香。');
    const r = await S.ask('地炉里的火烧得正旺。', ['再添几块柴，烧旺些', '用灰把火埋上（睡前的「埋火」）', '算了']);
    if (r === 2) return;
    if (r === 0) {
      e.num = 100; e.light = { r: 4.2, col: 'rgba(255,150,70,.24)', flick: true }; TONE.crackle(S, 5); f.hot = 1;
      await S.narr('火苗蹿起来，屋里一下子暖烘烘的。');
      S.bubble('oyuki', '…', 1200);
      return S.narr('座敷那边，阿雪悄悄把坐垫往墙角挪了挪。\n额头上，沁出了一层细细的水珠。');
    }
    e.num = 0; e.s.bury = 1; e.s.em = 1; e.light = { r: 1.2, col: 'rgba(200,70,30,.14)' }; f.aU = 1; f.hot = 0; S.sfx('step');
    await S.narr('你拿火箸把炭拢到一起，一铲一铲埋进灰里。\n屋里慢慢凉下来，只剩灰底下一点暗红——明早扒开，火还在。');
    accCheck(S);
  }
  async function furoOn(S) {
    const r = await S.ask('土间角上的五右卫门风吕。热水烧好了，冒着白气。', ['叫阿雪先来洗', '自己去泡一泡', '算了']);
    if (r === 2) return;
    if (r === 1) {
      await S.narr('热水泡得骨头都酥了。\n你闭上眼——十年前那一夜，冷得骨头缝里结冰。');
      return S.think('（……那件事，要是能跟谁说说就好了。）');
    }
    S.face('oyuki', 2);
    await S.say('阿雪', ['……我最后洗就好。', '水凉了，我洗正合适。你先去吧。']);
    await S.think(S.f.icicle ? '（……阿松婆婆讲的那个故事，怎么偏偏这时候想起来了。）' : '（她总是最后一个洗。等水凉透了才洗。）');
    const c = await S.ask('「你先去吧。」', ['「今天你先洗。水正热，好好暖暖身子。」', '「……那好。」']);
    if (c === 1) return;
    return meltEnd(S);
  }
  async function minoHomeOn(S) {
    await S.narr('墙上挂着你的蓑衣，稻草扎得厚厚的。');
    if (S.once('minoMem')) { S.sfx('heart'); await S.think('（那一夜，盖在身上的，就是这样一件蓑衣。）\n（……要是能跟谁说说就好了。哪怕一句。）'); }
  }
  async function yukiTalk(S) {
    const f = S.f;
    const pre = await S.ask('阿雪在行灯底下缝着吉太的小褂。\n（跟她说话，就是今晚最后一件事了。）', ['「阿雪……」', '（先不打扰她）']);
    if (pre) return;
    S.cp('lamp');
    return lampScene(S);
  }
  async function lampScene(S) {
    S.face('oyuki', 'pl'); S.face('pl', 'oyuki');
    await S.narr('行灯的光照在她脸上。\n雪白的脸，细细的眉，长长的睫毛。十年了，一点都没有变。');
    S.sfx('heart');
    await S.narr('你看着她，看着看着，忽然想起——\n十八岁那年，渡口的小屋里，俯在你脸上的那一张脸。');
    await S.say('阿雪', '……怎么了？一直盯着我看。');
    const opts = ['「……我想起一件怪事。十八岁那年……」', '「没什么。……就是觉得，你一点都没变。」'];
    if (accAll(S)) opts.push('「……今年的雪，下得真好。」');
    const r = await S.ask('「怎么了？」', opts);
    if (r === 0) {
      await S.think('（说出来吧。憋了十年了。说出来，心里就轻了……）');
      const c = await S.ask('阿雪停下针，等你往下说。', ['说下去', '「……算了，没什么。」']);
      if (c === 0) return toldEnd(S, 'lamp');
      return keptEnd(S);
    }
    if (r === 1) return keptEnd(S);
    return trueEnd(S);
  }
  async function toldEnd(S, via) {
    const o = S.ent('oyuki');
    if (via === 'kids') {
      await S.narr('你讲下去了。\n渡口的小屋，冻僵的茂作老爹，雪白的女人，那一缕亮晶晶的白烟……\n孩子们听得大气都不敢出。');
      await S.say('巳之吉', '……爹跟谁都没说过。那到底是梦，还是真的，爹到今天也不知道。');
      S.place('oyuki', 9, 4, 2);
    } else {
      await S.say('巳之吉', ['十八岁那年，我在渡口的小屋里，见过一个跟你一模一样的女人。', '雪一样白。……也许是做梦吧。可那张脸，我到今天都忘不了。', '那是我第一回，也是最后一回见到雪女。……这件事，我跟谁都没说过。']);
    }
    S.sfx('sting'); S.ent('andon').off = true; S.amb('wind'); S.dark(.8);
    await S.narr('阿雪把手里的针线一扔，站了起来。');
    o.spr = '@yuki'; S.face('oyuki', 'pl');
    await S.scare('face', { spr: '@yuki', dur: 1.2 });
    await S.say('阿雪', ['是我——是我——是我！', '那就是我，阿雪！', '我跟你说过，你要是说出一个字，我就杀了你！'], { style: 'big' });
    await S.say('阿雪', [via === 'kids' ? '……要不是看在孩子们份上，我现在就杀了你。' : '……要不是看在那边睡着的孩子们份上，我现在就杀了你。', '往后，你好好待他们。', '要是哪一天，他们有一点委屈——我就照你该得的，来对付你。'], { style: 'whisper' });
    S.ent('kemuri').open = true; TONE.gust(S, .7);
    await S.narr('她的声音越来越细，细得像风声。\n她的身子化成一团亮晶晶的白雾，升上房梁——');
    await S.alpha('oyuki', 0, 1600);
    await S.narr('——打着旋儿，从天窗里飘了出去。');
    await S.narr('从那以后，再也没有人见过她。');
    await S.end({ bad: true, id: 'told', title: '说出了那晚', text: '第二天，雪停了。\n孩子们问娘去哪儿了，你说，娘回娘家了。\n\n你一个人把他们拉扯大。\n每年头一场雪的夜里，你都把天窗拉开一道缝，坐在地炉边，一直坐到天亮。\n\n她再也没有回来。\n可是那些年，孩子们一个冬天也没有生过冻疮。' });
  }
  async function meltEnd(S) {
    await S.say('阿雪', '……');
    await S.narr('她看了你很久。然后笑了一下，笑得很淡。');
    await S.say('阿雪', ['……好。你说的，我听。', '孩子们……要好好的。']);
    await S.walk('oyuki', [17, 9], 2); S.face('oyuki', 2);
    await S.fade(1, 900);
    S.hide('oyuki');
    await S.wait(900); S.sfx('water'); await S.wait(1200);
    await S.narr('水声响了一下。\n然后，什么声音都没有了。');
    await S.fade(0, 900);
    await S.say('巳之吉', '……阿雪？');
    await S.walk('pl', [17, 9], 3); S.face('pl', 2);
    S.ent('furo').s.ice = 1; S.ent('furo').lit = false; TONE.frost(S);
    await S.narr('浴桶里的热水还冒着白气。\n水面上，浮着一根细细的、亮晶晶的冰凌，和一把白木梳子。');
    await S.narr('冰凌在你眼前，一点一点，化掉了。');
    await S.end({ bad: true, id: 'melt', title: '一池温水', text: (S.f.icicle ? '你想起阿松婆婆讲的那个故事。\n' : '后来，你听阿松婆婆讲过一个故事：\n') + '风雪夜里来的媳妇，怎么也不肯洗热水澡。男人好心，非要她暖暖身子——\n第二天，浴桶里只剩下一根冰凌。\n\n你想，她其实是知道的。\n她只是，不想让你难过。' });
  }
  async function keptEnd(S) {
    await S.say('阿雪', '……你今天真怪。');
    await S.narr('她低下头，接着缝那件小褂。\n行灯的火苗轻轻晃着。屋外的雪，落得没有一点声音。');
    TONE.lullaby(S); await S.wait(2500);
    await S.narr('她嘴里轻轻哼起了摇篮曲。');
    const n = (S.f.aK ? 1 : 0) + (S.f.aM ? 1 : 0) + (S.f.aU ? 1 : 0);
    const tail = n ? '\n\n（那天夜里，天窗、凉水、埋火——娘留下的话，你做到了' + ['', '一', '两', '三'][n] + '样。）' : '';
    await S.end({ id: 'kept', title: '第七夜　完', text: '那一夜的事，你到底一个字也没有说。\n\n阿雪一直没有老。\n孩子们长大了，娶了媳妇，嫁了人；你的头发白了，背也弯了。\n每年头一场雪的夜里，她都站在门口，看很久很久的雪。\n\n你从来没有问过她在看什么。\n她也从来没有问过你，那天夜里，你为什么一直看着她。\n\n——约定，就这样守了一辈子。' + tail });
  }
  async function trueEnd(S) {
    await S.narr('阿雪抬起头。\n她看了看天窗里飘下来的雪，看了看茶碗里那碗凉水，又看了看地炉里埋好的火。');
    await S.narr('最后，她看着你。');
    await S.say('阿雪', '……巳之吉。');
    await S.narr('她什么也没问。你也什么都没说。');
    await S.say('阿雪', ['……谢谢你。', '谢谢你，一直都没说。'], { style: 'whisper' });
    await S.narr('她端起那碗凉水，慢慢喝了一口。\n然后低下头，接着缝那件小褂，嘴里轻轻哼起了摇篮曲。');
    TONE.lullaby(S, 1.1); await S.wait(2800);
    await S.end({ id: 'unspoken', title: '不说出口的话', text: '后来的很多年，每到头一场雪的夜里，你都把天窗拉开一道缝，把地炉里的火埋上，给她舀一碗缸里的凉水。\n\n孩子们问：「娘，你为什么那么喜欢雪呀？」\n阿雪就笑着说：「因为娘是从雪里来的呀。」\n孩子们哈哈大笑，谁也不信。\n你也跟着笑。\n\n约定说的是：不许说出口。\n——可没有说，不许知道。' });
  }

  /* ================= 章节 ================= */
  const HUD = { id: 'hud', x: 0, y: 0, spr: 'thermo', z: 6, solid: false, num: 100, s: { wd: 0, m: 0 }, light: { r: 1, pl: true, dx: 8, dy: -16, a: .7 } };
  const WX = (lv) => ({ id: 'wx', x: 0, y: 0, spr: 'snowfx', z: 7, solid: false, s: { lv, g: 0 } });
  const look = t => S => S.narr(t);

  defChapter({
    id: 'yukionna', n: 7, title: '雪女', sub: '暴风雪夜的渡口小屋。她吹了一口气，老人冻死了；她放过了你——只要你永远不说出今晚。', origin: '日本民间传说·小泉八云《怪谈》（1904）', color: '#2a3a56',
    amb: 'wind', floor: 'dirt', wall: 'wood', dark: .8, plr: 2.4,
    endings: { kept: '守住了约定', unspoken: '不说出口的话', told: '说出了那晚', melt: '一池温水' },
    thumb(g, w, h) {
      const s = Math.max(2, Math.floor(h / 42)), ox = Math.round(w / 2 - 16 * s), oy = Math.round((h - 22) / 2 - 16 * s);
      const gr = g.createRadialGradient(w / 2, oy + 16 * s, 2, w / 2, oy + 16 * s, 24 * s); gr.addColorStop(0, 'rgba(200,225,255,.35)'); gr.addColorStop(1, 'rgba(200,225,255,0)'); g.fillStyle = gr; g.fillRect(0, 0, w, h);
      FACES.yuki((x, y, ww, hh, c) => { g.fillStyle = c; g.fillRect(ox + x * s, oy + y * s, ww * s, hh * s); }, .75, 0);
      for (let i = 0; i < 46; i++) { g.fillStyle = `rgba(240,248,255,${.4 + hash(i, 7, 7) * .5})`; const z = hash(i, 8, 7) < .3 ? 2 : 1; g.fillRect((hash(i, 5, 7) * w) | 0, (hash(i, 6, 7) * (h - 22)) | 0, z * Math.max(1, s / 2), z * Math.max(1, s / 2)); }
    },
    people: PEOPLE7,
    faces: FACES,
    tiles: TILES7,
    sprites: SPR7,
    items: {
      key: { name: '小屋的钥匙', desc: '一把冻得粘手的铁钥匙，用油纸包着。纸上有一股旧手巾的汗味。' },
      hiuchi: { name: '火镰和火石', desc: '月牙形的火镰、一块边角磨圆了的火石，还有一团干透的火绒。打一下，迸出一串火星。' },
      mino: { name: '蓑衣', desc: '渡守的蓑衣，稻草扎得厚厚的。披着出门，风雪钻不进脖子。' },
      wara: { name: '一抱稻草', desc: '船棚里抱来的干稻草。拧成一股，能塞住墙缝。' },
      hiyamizu: { name: '一碗凉水', desc: '从缸里舀的凉水，碗沿结着一圈细细的冰碴。' }
    },
    notes: {
      rusu: { title: '小屋门上的留守书', text: '（门上钉着一块薄木板，炭写的字被雪打湿了，有点洇）\n\n过河的客人：\n天黑了，风雪大，船我拴到对岸去了。明早头一班再来摆渡。\n\n小屋的钥匙，照老样子，托给了六地藏。\n去年腊月，老婆子给六位地藏菩萨编斗笠，只赶出了五顶。\n剩下的那一位，戴的是我的旧手巾——在下巴底下打了个结。\n钥匙，就压在那一位的脚边。\n\n屋里的柴不多。屋檐底下还有几捆，西边的船棚里也有。\n用了不要紧，开春还上就行。\n\n　　　　　　　　　　　　　　渡守　权六' },
      mosaku: { title: '茂作老爹说的雪夜规矩', text: '「山里人冬天的规矩，你记着。」\n\n一、风雪夜里，火不能灭。柴烧完了就去抱。人冻僵了，就醒不过来了。\n二、墙缝拿稻草塞上。蓑衣披着出门。回屋挨着人坐——两个人挤着，比一个人暖。\n三、风声忽然尖起来、雪里站着个白衣裳的女人——别跑，别出声。屏住气，一动也别动，等风过去。\n四、雪夜里有女人抱着孩子，求你帮她抱一下——别接。接过来，那孩子越抱越沉，沉得你再也站不起来。\n五、她要是讨水，给凉的。「给热的，她就化了——我奶奶是这么说的。」\n\n「……都是老人家吓唬小孩的。睡吧，巳之吉。」' },
      haha: { title: '娘留下的话', text: '（娘临终前，请寺里的和尚替她写下的）\n\n巳之吉：\n阿雪是个好媳妇。娘这辈子，没有比她进门更高兴的事了。\n\n有几样，你是男人家，怕是看不见，娘替你记着——\n她不爱挨着火坐。冬天夜里把地炉的火埋上，她才睡得安稳。\n她只喝缸里的凉水。烧好的茶端给她，她总是等凉透了才喝。\n起风下雪的晚上，把天窗拉开一道缝，她就松快了，像回了娘家。\n\n娘不问她从哪里来。你也别问。\n好好待她。' },
      tenarai: { title: '吉太的习字本', text: '（歪歪扭扭的大字，旁边画了一个雪人）\n\n雪　雪　雪　雪\n\n娘的手是凉的。我发烧的时候，娘把手放在我额头上，舒服极了。\n娘说，她最喜欢下雪的晚上。\n娘从来不挨着地炉坐。阿春说娘怕烫。\n爹打呼噜。\n\n（「爹打呼噜」几个字被人用墨涂掉了一半）' }
    },
    legend: '「雪女」是日本雪国流传很广的妖怪传说。据说最早的文字记载见于托名室町时代连歌师宗祇的《宗祇诸国物语》，讲他在越后国的大雪里见到过雪女。各地说法差别很大：有的说她在雪夜抱着婴儿，求过路人帮忙抱一下，接过来的人会被越来越沉的孩子压进雪里；岩手远野一带说，小正月或冬天满月的夜里，雪女会领着一群孩子出来玩（见柳田国男《远野物语》）；还有「冰柱媳妇」一类的故事：风雪夜来投宿的美丽女子嫁给了男人，却怎么也不肯洗热水澡，被劝着泡进浴桶以后，只剩下一根细细的冰柱。\n\n今天最广为人知的版本出自小泉八云（Lafcadio Hearn）1904 年出版的《怪谈》。他在序里说，这是武藏国西多摩郡调布村的一位农夫讲给他听的家乡传说：樵夫茂作和十八岁的徒弟巳之吉在暴风雪中躲进渡守的小屋，夜里一个白衣女人进来，朝老人吹了一口气，老人冻死；她放过巳之吉，条件是永远不许说出这一夜。第二年冬天，巳之吉在路上遇见名叫阿雪的姑娘，娶她为妻，生了十个孩子，她却多年不老。某夜他在行灯下看着她缝衣，说出了那一晚的事——她说那就是我，看在孩子们份上不杀你，要他好好待孩子，随即化作白雾，从屋顶的烟孔飘走了。\n\n有人认为，八云的版本把雪女从「冻死行人的山中妖怪」写成了一个会爱、会守约、也会离开的女子，这个形象后来又反过来影响了日本各地的雪女故事和影视作品；也有说法认为调布村本地原本未必有这个传说，是八云的书出名以后才「回流」到当地的。据说今天东京都青梅市多摩川边的调布桥附近，立有纪念这个故事的石碑。\n\n（本章中渡守权六与他的留守书、六地藏托钥匙的情节、体温与火、稻草塞墙缝、窗外的白脸、吉太与阿春、阿松婆婆、娘留下的话、天窗/凉水/埋火三件小事与「不说出口的话」结局，均为游戏虚构；「一池温水」结局改编自「冰柱媳妇」一类民间故事；原著中茂作与巳之吉是师徒，不是父子；雪女与阿雪的台词据八云原著意译。）',
    start: { map: 'ferry', x: 2, y: 12, dir: 2 },
    resume: {
      arrive: async S => { S.f._dying = 0; S.f.T = Math.max(S.f.T ?? 0, 70); if (S.f._dCold) await S.think(S.f._dCold > 1 ? '（留守书上说：没有斗笠、包着手巾、在下巴底下打了结……）\n（先看清楚雪的形状，再动手拂。）' : '（……不能在雪里耗太久。快找钥匙。）'); },
      hut: async S => { S.f._dying = 0; S.f._ins = undefined; S.speed(1); S.f.T = Math.max(S.f.T ?? 0, 60); if (S.f._dCold) await S.think('（先拿架子上的火镰，再披上蓑衣出门抱柴。快去快回。）'); },
      night: async S => {
        resetNight(S);
        S.timer(NIGHT, '夜还长', yukiCome);
        S.goal(nightGoalText(S));
        const n = S.f._dCold || 0;
        if (n === 1) await S.think('（火一灭，屋里冷得比外头还快……别让火断了。）');
        else if (n >= 2) { await S.think('（墙缝塞上，屋里就冷得慢。挨着老爹坐，也暖和些。）'); S.toast('提示：怀里最多抱两捆柴；船棚的稻草塞墙缝；蓑衣披上再出门；风声变尖就站住'); }
      },
      yuki: async S => { S.wear('meLie'); S.pos(23, 12, 0); S.f.hWarn = 0; await startHold(S); },
      story: async S => { await storyScene(S); },
      lamp: async S => { S.goal('跟阿雪说说话（她在行灯下缝衣服）'); }
    },
    async intro(S) {
      await S.card('第七夜　雪女', '武藏国　某年冬', '樵夫茂作和徒弟巳之吉，\n每天一同进山砍柴。\n\n回村的路上，要过一条大河。\n河上没有桥，只有一条渡船。\n\n那天傍晚，下起了大雪。');
    },
    tick(S, dt) {
      if (S.map === 'ferry') ferryTick(S, dt);
      else if (S.map === 'road') hudFollow(S);
    },
    maps: {
      /* ---------------- 渡口与渡守的小屋 ---------------- */
      ferry: {
        amb: 'wind', dark: .8, plr: 2.2, wall: 'wood', floor: 'dirt', speed: 1,
        legend: { S: 'snowg', Y: 'snowpine', i: 'iceshore', D: 'dockw' },
        wallC: { face: '#4e3c2a', top: '#cdd6df', trim: '#2e2216' },
        tileOpts: { woodC: '#5a4630', snowC: '#c3ccd6' },
        wxDark: '#1c222c', inside: HUT, roof: HUTR,
        rows: [
          'YYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYY',
          'SSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSS',
          '~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~',
          '~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~',
          '~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~',
          'iiiiiiiiiiiiiiiiiiiiiDDiiiiiiiii',
          'YSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSY',
          'YSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSY',
          'YSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSY',
          'YSSSSSSSSSSSSSSS##########SSSSSY',
          'YSSSSSSSSSSSSSSS##########SSSSSY',
          'SSSSSSSSSSSSSSSS#wwwwwwww#SSSSSY',
          'SSSSSSSSSSSSSSSS#wwwwwwww#SSSSSY',
          'YSSSSSSSSSSSSSSS#dddddddd#SSSSSY',
          'YSSSSSSSSSSSSSSS####d#####SSSSSY',
          'YSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSY',
          'YSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSY',
          'YYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYY'],
        ents: [
          { x: 0, y: 11, spr: 'invisible', solid: true, on: look('来时的山路，脚印已经被雪填平了。\n回头是一片白，什么也看不见。') },
          { x: 0, y: 12, spr: 'invisible', solid: true, on: look('来时的山路，脚印已经被雪填平了。') },
          ...[0, 1, 2, 3, 4, 5].map(i => ({ id: 'jz' + i, x: 4 + i, y: 7, spr: 'jizo', s: { k: 'hat', b: 0 }, on: S => jizoOn(S, i) })),
          { x: 3, y: 7, spr: 'invisible', solid: true, on: look('六地藏前头的雪地上，插着半截烧剩的线香。\n不知是谁，大雪天也来上过香。') },
          { id: 'kanban', x: 18, y: 6, spr: 'sign', col: '#5a4a32', on: look('渡口的木牌：「渡船　卯时至酉时　风雪停渡」。\n牌子底下，被雪埋了一半的，是一行小字：「急事敲板木」。') },
          { id: 'itagi', x: 24, y: 6, spr: 'itagi', on: itagiOn },
          { x: 21, y: 4, spr: 'invisible', solid: true, on: look('河水黑沉沉的，水面上浮着一块一块的碎冰，撞在栈桥的木桩上，咯吱咯吱地响。\n渡船在对岸。游过去，人还没到河心就冻僵了。') },
          { x: 22, y: 4, spr: 'invisible', solid: true, on: look('雪落进河里，一点声音也没有。') },
          { x: 9, y: 5, spr: 'invisible', solid: true, on: look('岸边结了一层薄冰。冰底下，河水在走。') },
          { x: 28, y: 5, spr: 'invisible', solid: true, on: look('对岸的松林只剩一道黑影。\n风把雪从河面上卷起来，像一层白烟，贴着水往下游飘。') },
          { id: 'fune', x: 21, y: 1, w: 2, spr: 'boat' },
          /* 小屋外 */
          { id: 'makiA', x: 26, y: 12, spr: 'maki', num: 3, on: makiOn },
          { id: 'goya', x: 3, y: 15, w: 3, spr: 'funagoya', num: 3, s: { wara: 1 }, on: goyaOn },
          { id: 'door', x: 20, y: 14, spr: 'itado', locked: true, solid: true, on: doorOn, bump: doorBump, touch: doorTouch },
          /* 小屋里 */
          { id: 'irori', x: 20, y: 12, w: 2, spr: 'irori', num: 0, on: iroriOn },
          { id: 'mosaku', x: 1, y: 12, spr: '@mosaku', dir: 2, on: mosakuOn },
          { id: 'tana', x: 18, y: 10, spr: 'tana', on: tanaOn },
          { id: 'mado', x: 21, y: 10, spr: 'mado', on: look('格子窗糊的纸早破了，雪沫子从窗格里一阵一阵扑进来。\n外头白茫茫的，什么也看不清。') },
          { id: 'minoW', x: 23, y: 10, spr: 'minoW', on: minoOn },
          { id: 'gap0', x: 16, y: 12, spr: 'suki', s: { dx: 1 }, on: S => gapOn(S, 0) },
          { id: 'gap1', x: 25, y: 11, spr: 'suki', s: { dx: -1 }, on: S => gapOn(S, 1) },
          { id: 'gap2', x: 22, y: 10, spr: 'suki', s: { dy: 1 }, on: S => gapOn(S, 2) },
          { id: 'kai', x: 17, y: 13, spr: 'kai', on: kaiOn },
          { id: 'kame', x: 24, y: 13, spr: 'mizugame', s: { ice: 1 }, on: look('水缸冻成了一整块冰。冰里冻着一片枯叶，叶脉清清楚楚。') },
          { id: 'mushiro', x: 23, y: 12, spr: 'mushiro', decal: true, on: look('地上铺着两张草席，硬得像木板。\n今晚，就睡在这上面了。') },
          /* 夜里的东西 */
          { id: 'shade', x: 8, y: 8, spr: 'yukiShade', hidden: true, solid: false, z: 2 },
          { id: 'yuki', x: 20, y: 13, spr: '@yuki', hidden: true, solid: false },
          { id: 'breath', x: 22, y: 11, spr: 'breath', hidden: true, solid: false, z: 3 },
          { id: 'moLie', x: 23, y: 11, spr: 'moLie', hidden: true },
          Object.assign({}, HUD), WX(3)
        ],
        async enter(S, first) { if (first) await arriveIntro(S); },
        step(S, x, y) {
          const f = S.f;
          if (f.ph === 'arrive' && !f.dock && x >= 17 && y <= 8) return dockScene(S);
          if (f.ph === 'arrive' && x === 20 && y === 13 && !S.ent('door').locked) return hutScene(S);
        }
      },
      /* ---------------- 村道 ---------------- */
      road: {
        amb: 'wind', dark: .62, plr: 3.2, floor: 'dirt',
        legend: { S: 'snowg', Y: 'snowpine', p: 'snowpath' },
        tileOpts: { snowC: '#c6ced8' }, darkC: '#141a26',
        rows: [
          'YYYYYYYYYYYYYYYYYYYYYYYYYYYY',
          'YYYYYYYYYYYYYYYYYYYYYYYYYYYY',
          'YYSSSSSSSSSSSSSSSSSSSSSSSSYY',
          'YSSSSSSSSSSSSSSSSSSSSSSSSSSY',
          'YSSSSSSSSSSSSSSSSSSSSSSSSSSY',
          'SSSSSSSSSSSSSSSSSSSSSSSSSSSY',
          'pppppppppppppppppppppppppppY',
          'SSSSSSSSSSSSSSSSSSSSSSSSSSSY',
          'YSSSSSSSSSSSSSSSSSSSSSSSSSSY',
          'YSSSSSSSSSSSSSSSSSSSSSSSSSSY',
          'YYYYYYYYYYYYYYYYYYYYYYYYYYYY'],
        ents: [
          { x: 0, y: 5, spr: 'invisible', solid: true, on: look('往山里去的路。今天的柴，已经背回来了。') },
          { x: 0, y: 6, spr: 'invisible', solid: true, on: look('往山里去的路。再往里走，就是那条大河，和渡口。') },
          { x: 0, y: 7, spr: 'invisible', solid: true, on: look('往山里去的路。') },
          { id: 'sign2', x: 2, y: 4, spr: 'sign', col: '#5a4a32', on: S => { S.narr('路牌：「往渡口　一里」。'); if (S.f.ph === 'road' && S.once('signMem')) return S.think('（渡口的小屋早就翻修过了。……那一夜的事，跟谁都没说过。）'); } },
          { id: 'hBaba', x: 4, y: 3, w: 3, spr: 'minka', lit: true, dx: 18, on: look('阿松婆婆家。窗里亮着灯，飘出一股烤年糕的焦香。') },
          { id: 'hNei', x: 13, y: 3, w: 3, spr: 'minka', dx: 6, on: look('邻居家。窗户黑着，屋檐下挂了一排冰溜子，长的快垂到地上了。') },
          { id: 'hHome', x: 21, y: 3, w: 4, spr: 'minka', lit: true, dx: 26, on: async S => { if (S.f.ph !== 'road') return; await S.narr('自己家。窗户纸上映着行灯黄黄的光。'); await S.go('home', 10, 10, 3); } },
          { id: 'baba', x: 5, y: 4, spr: '@baba', dir: 0, hidden: true, on: babaOn },
          { id: 'nyobo', x: 10, y: 4, spr: '@nyobo', dir: 0, hidden: true, on: nyoboOn },
          { id: 'well', x: 12, y: 8, spr: 'well', on: look('村里的井。井绳冻得像一根铁棍，井口结了一圈冰。') },
          { id: 'tourou', x: 8, y: 8, spr: 'stonelantern', on: look('路边的石灯笼，戴着一顶厚厚的雪帽子。') },
          { id: 'daruma', x: 17, y: 8, spr: 'yukidaruma', on: darumaOn },
          { id: 'kichi', x: 18, y: 8, spr: '@kichi', dir: 1, hidden: true, on: kidsOn },
          { id: 'haru', x: 16, y: 8, spr: '@haru', dir: 2, hidden: true, on: kidsOn },
          { id: 'tabi', x: 15, y: 6, spr: '@tabi', dir: 1, hidden: true },
          WX(1)
        ],
        async enter(S, first) { if (first) await roadIntro(S); }
      },
      /* ---------------- 家 ---------------- */
      home: {
        amb: 'fire', dark: .55, plr: 3, wall: 'wood', floor: 'wood',
        wallC: { face: '#5a4430', top: '#140f0b' },
        tileOpts: { woodC: '#5e4430' },
        rows: [
          '######################',
          '######################',
          '#tttttttt#wwwwwwwwwww#',
          '#tttttttt#wwwwwwwwwww#',
          '#tttttttt.wwwwwwwwwww#',
          '#tttttttt#wwwwwwwwwww#',
          '#tttttttt#wwwwwwwwwww#',
          '##########wwwwwwwwwww#',
          '#dddddddddddddddddddd#',
          '#dddddddddddddddddddd#',
          '#dddddddddddddddddddd#',
          '##########d###########'],
        ents: [
          { id: 'butsudan', x: 3, y: 1, spr: 'butsudan', on: butsudanOn },
          { id: 'andon', x: 4, y: 3, spr: 'andon', light: { r: 3.2, col: 'rgba(255,200,120,.2)', flick: true }, on: look('纸糊的行灯，灯芯剪得短短的。光是黄的，暖的——可照在她脸上，还是那样白。') },
          { id: 'oyuki', x: 10, y: 8, spr: '@oyuki', dir: 0, on: S => S.f.story ? yukiTalk(S) : S.narr('……') },
          { id: 'chawan', x: 6, y: 3, spr: 'chawan', lit: true, on: chawanOn },
          { id: 'kf0', x: 2, y: 5, h: 2, spr: 'kfuton', col: '#4a5a7a', s: { kid: 'kichi' }, on: S => S.narr(S.ent('kf0').s.in ? '吉太睡得四仰八叉，被子蹬掉了一半。\n你替他掖好被角。他的额头，凉凉的。' : '吉太的被褥。') },
          { id: 'kf1', x: 4, y: 5, h: 2, spr: 'kfuton', col: '#9a4a5a', s: { kid: 'haru' }, on: S => S.narr(S.ent('kf1').s.in ? '阿春攥着娘缝的布老虎，嘴里嘟囔着「嘿呦……嘿呦……」。' : '阿春的被褥，枕边放着一只布老虎。') },
          { id: 'kf2', x: 6, y: 5, h: 2, spr: 'kfuton', col: '#6a7a5a', s: { kid: 'baby', in: 1 }, on: look('最小的那个，含着手指头睡得正香。\n小脸白白的，像他娘。') },
          { id: 'irori2', x: 14, y: 4, w: 2, spr: 'irori', num: 60, light: { r: 3.4, col: 'rgba(255,150,70,.2)', flick: true }, on: irori2On },
          { id: 'kemuri', x: 15, y: 1, spr: 'kemuri', on: kemuriOn },
          { id: 'minoH', x: 19, y: 1, spr: 'minoW', on: minoHomeOn },
          { id: 'tsukue', x: 11, y: 6, spr: 'tsukue', on: tsukueOn },
          { id: 'tansu', x: 20, y: 2, spr: 'dresser', on: look('娘留下来的衣柜。最底下一格，叠着阿雪嫁过来时穿的那件白衣裳。\n十年了，一点也没有发黄。') },
          { id: 'kamado', x: 2, y: 8, spr: 'kamado', on: look('灶膛里的火压着，锅里温着明早的粥。') },
          { id: 'kame2', x: 5, y: 8, spr: 'mizugame', on: kameOn },
          { id: 'makiIn', x: 13, y: 8, spr: 'makiIn', on: look('今天背回来的柴，码得整整齐齐。') },
          { id: 'furo', x: 18, y: 9, spr: 'goemon', lit: true, on: furoOn },
          { id: 'hdoor', x: 10, y: 11, spr: 'itado', on: look('外头的雪越下越大。今晚，哪儿也不去了。') },
          { id: 'kiA', x: 12, y: 9, spr: '@kichi', dir: 1 },
          { id: 'haA', x: 13, y: 9, spr: '@haru', dir: 1 }
        ],
        async enter(S, first) { if (first) await homeIntro(S); }
      }
    }
  });
})();
