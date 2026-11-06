/* ================= 第二十夜 · 迪亚特洛夫山口（卷二收束） ================= */
(() => {
  const N = t => S => S.narr(t);
  function grid(w, h, c) {
    const g = [...Array(h)].map(() => Array(w).fill(c));
    const api = {
      set(x, y, ch) { if (y >= 0 && y < h && x >= 0 && x < w) g[y][x] = ch; return api; },
      rect(x0, y0, x1, y1, ch) { for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) api.set(x, y, ch); return api; },
      rows() { return g.map(r => r.join('')); }
    };
    return api;
  }
  const dist = (x1, y1, x2, y2) => Math.hypot(x1 - x2, y1 - y2);
  /* 跨死亡的计数：检查点会把 S.f 还原，所以「死了几次 / 拧错几次」放在模块里，开场时清零 */
  const D = { slab: 0, out: 0, bw: 0 };
  const KS = ['lev', 'pav', 'tan'];
  const NAME = { lev: '列夫', pav: '帕维尔', tan: '塔尼娅' };
  const BAGX = { lev: 2, pav: 4, tan: 6 };
  /* 帐篷里安全的一侧：最里头（x≥9）、靠下坡的两排（y≥4） */
  const inSafe = (x, y) => x >= 9 && x <= 12 && y >= 4 && y <= 5;
  const TENT = [13, 5];          // 雪原上回到帐篷的那一格（割开的口子外面）
  const LEV = [24, 16];          // 列夫蹲着的石脊（帐篷 → 这里 = 135°）

  /* ---------- 声音（S.tone 合成，双方都听得到） ---------- */
  const SND = {
    /* 次声：耳朵几乎听不见、胸口先感觉到的低频嗡鸣（两路相近频率打拍子） */
    hum(S, v = .12) { S.tone('sine', 41, 37, 2.4, v, 0, 160); S.tone('sine', 43.5, 39.5, 2.2, v * .8, .05, 160); S.tone('triangle', 62, 55, 1.8, v * .3, .2, 220); },
    /* 雪层塌陷的「嗡——」（whumpf）：整片坡轻轻一沉 */
    whumpf(S) { S.tone('sawtooth', 80, 28, 1.0, .28, 0, 160); S.tone('sine', 55, 26, 1.3, .5, 0); S.tone('sine', 110, 40, .5, .1, .05, 400); },
    creak(S, d = 0) { S.tone('sawtooth', 210, 150, .5, .045, d, 900); S.tone('square', 95, 80, .45, .02, d + .05, 500); },
    /* 列夫的哨子：三短声；远近用音量区分 */
    whistle(S, v) { [0, .3, .6].forEach(t => S.tone('sine', 2750, 2650, .18, v, t)); },
    rocket(S) { S.tone('sawtooth', 46, 38, 3.2, .07, 0, 140); S.tone('sine', 32, 30, 3.4, .12, .1); },
    breath(S) { S.tone('triangle', 330, 300, .9, .025, 0, 700); S.tone('triangle', 300, 260, 1.1, .02, 1.0, 600); }
  };

  const VOL2 = '十个夜晚。\n睡谷的木桥上，追来一个把头搁在马鞍上的骑兵；\n好望角的风暴里，一艘永远靠不了岸的船；\n大西洋上空无一人的双桅船——饭还在桌上，后来的人这么说。\n爱尔兰的哭声，摇篮里换掉的孩子，\n哈默林的笛子，雾里的魔王和灰色的老柳树，\n鸡腿上的小屋，河边荡秋千的绿头发姑娘——\n还有乌拉尔山的东坡上，一顶从里面割开的帐篷。\n\n海、山、森林、河。\n人在黑夜里，总想给看不见的东西起一个名字。\n有的叫鬼，有的叫仙，有的叫魔王。\n有的名字，人们找了六十年，最后写下的是：雪。\n\n可那些真的走进过黑夜的人，不该只剩下一个怪谈。\n记住他们，比解开他们更要紧。';

  /* ---------- 惊吓大头像：风里的脸（次声和寒冷造出来的幻觉：雪做的长脸，空眼窝，张得越来越大的嘴） ---------- */
  const FACES = {
    windF(R, a, t) {
      R(0, 0, 32, 32, '#070c16');
      for (let i = 0; i < 9; i++) { const y = ((i * 7 + t * 46) % 34) - 1; R(0, y | 0, 32, 1, 'rgba(190,210,235,.13)'); }
      const SN = '#e4ebf3', SN2 = '#b4c2d2', SH = '#71829a';
      R(9, 2, 14, 27, SN); R(8, 6, 16, 20, SN); R(10, 28, 12, 3, SN2); R(8, 6, 1, 20, SN2); R(23, 6, 1, 20, SN2);
      R(9, 2, 3, 3, SN2); R(20, 1, 3, 4, SN2);                                   // 被风吹散的轮廓
      R(12, 3, 1, 6, SH); R(13, 8, 1, 3, SH); R(20, 4, 1, 7, SH); R(19, 10, 1, 2, SH);   // 冰裂纹
      R(11, 10, 4, 7, '#01030a'); R(18, 10, 4, 7, '#01030a'); R(11, 17, 3, 3, '#0a1424'); R(19, 17, 3, 3, '#0a1424');   // 空眼窝往下淌
      R(15, 15, 2, 4, SN2);
      const k = Math.min(1, a * 1.5), h = 3 + Math.round(k * 8);
      R(13, 21, 6, h, '#01030a'); R(12, 22, 1, Math.max(1, h - 2), SH); R(19, 22, 1, Math.max(1, h - 2), SH);   // 嘴：嚎叫
      for (let i = 0; i < 7; i++) R(19 + i * 2, 22 + ((t * 34 + i * 5) % 7), 2, 1, 'rgba(230,240,250,.75)');   // 风雪从嘴里灌出来
      for (let i = 0; i < 7; i++) R(i * 2, 12 + ((t * 30 + i * 3) % 9), 2, 1, 'rgba(230,240,250,.55)');
    }
  };

  /* ---------- 瓦片 ---------- */
  const TILES = {
    snowg: { solid: false, paint(R, X, Y, o) {
      const b = (o && o.snowC) || '#c9d2dc'; R(0, 0, 16, 16, b);
      for (let i = 0; i < 6; i++) R((hash(X, Y, 400 + i) * 15) | 0, (hash(Y, X, 410 + i) * 15) | 0, 2, 1, i % 2 ? shade(b, -.07) : shade(b, .1));
      if (hash(X, Y, 430) < .22) { const y = 4 + ((hash(X, Y, 431) * 8) | 0); R(1, y, 12, 1, shade(b, -.1)); R(3, y - 1, 8, 1, shade(b, .08)); }   // 风刻出来的雪棱
      if (o && o.diag && hash(X, Y, 435) < .3) { const x0 = (hash(X, Y, 436) * 6) | 0; for (let k = 0; k < 5; k++) R(x0 + k * 2, 3 + k * 2, 2, 1, shade(b, -.12)); }   // 顺坡往东南淌的雪纹：看得出哪边是下坡
    } },
    spath: { solid: false, paint(R, X, Y, o) {
      TILES.snowg.paint(R, X, Y, o); const b = (o && o.snowC) || '#c9d2dc';
      R(4, 0, 2, 16, shade(b, -.13)); R(10, 0, 2, 16, shade(b, -.13)); R(4, 0, 1, 16, shade(b, -.2)); R(10, 0, 1, 16, shade(b, -.2));   // 两道滑雪板压出的辙
      if (hash(X, Y, 440) < .5) R(7, 3 + ((hash(X, Y, 441) * 9) | 0), 2, 2, shade(b, -.16));   // 雪杖戳的小坑
    } },
    snowpine: { solid: true, paint(R, X, Y, o) {
      TILES.snowg.paint(R, X, Y, o); const c = '#172a24';
      for (let i = 0; i < 7; i++) { R(7 - i, 1 + i * 2, 2 + i * 2, 2, i % 2 ? c : shade(c, .1)); R(7 - i, 1 + i * 2, 2 + i * 2, 1, '#dbe3ec'); }
      R(7, 14, 2, 2, '#2a1c12');
    } },
    ice: { solid: false, paint(R, X, Y) {
      R(0, 0, 16, 16, '#9cb2c4'); R(0, 0, 16, 1, '#b8cad8');
      for (let i = 0; i < 3; i++) R((hash(X, Y, 450 + i) * 12) | 0, 3 + i * 4, 5, 1, '#c4d4e0');
      if (hash(X, Y, 455) < .35) { const x = (hash(X, Y, 456) * 10) | 0; R(x, 5, 1, 4, '#7890a6'); R(x + 1, 8, 3, 1, '#7890a6'); }
      if (hash(X, Y, 457) < .3) R(((hash(X, Y, 458) * 9) | 0), 10, 6, 3, '#d4dce6');
    } },
    srock: { solid: true, paint(R, X, Y, o) {
      TILES.snowg.paint(R, X, Y, o);
      R(2, 5, 12, 10, '#4a5058'); R(3, 4, 10, 2, '#5c636c'); R(10, 6, 3, 8, '#3a3f46'); R(4, 8, 3, 2, '#646c76');
      R(2, 3, 11, 2, '#e2e8ef'); R(4, 2, 6, 1, '#eef2f6'); R(1, 14, 14, 2, shade((o && o.snowC) || '#c9d2dc', -.12));
    } },
    /* 帐篷里：靠坡那面切开的雪墙，能看见雪层：硬壳、雪板、底下砂糖一样的深霜 */
    swall: { solid: true, paint(R, X, Y) {   // 雪板这一层，门口那头（左）最厚、最里头（右）最薄——和探杆读数一致
      const sb = Math.max(2, 10 - Math.round(X * .6)), hb = 3 + sb;
      R(0, 0, 16, 16, '#dfe6ee'); R(0, 2, 16, 1, '#f2f5f8'); R(0, 3, 16, sb, '#c4ced8');
      R(0, hb, 16, 16 - hb, '#a6b2c0'); for (let i = 0; i < 9; i++) R((hash(X, Y, 460 + i) * 15) | 0, hb + ((hash(X, Y, 470 + i) * Math.max(1, 15 - hb)) | 0), 1, 1, i % 2 ? '#e8eef4' : '#8c98a8');
      R(0, hb - 1, 16, 1, '#8e9aaa');
    } },
    cvt: { solid: true, paint(R, X, Y) { R(0, 0, 16, 16, '#b0a07e'); R(0, 0, 16, 4, '#d8e0e8'); R(0, 4, 16, 1, '#8a7c60'); R(0, 13, 16, 3, '#9a8c6c'); if (X % 3 === 0) R(15, 4, 1, 12, '#8a7c60'); R(3 + (X % 2) * 6, 8, 3, 1, '#c2b292'); } },
    cvb: { solid: true, paint(R, X, Y) { R(0, 0, 16, 16, '#a69676'); R(0, 0, 16, 2, '#8a7c60'); R(0, 12, 16, 4, '#d0d8e2'); if (X % 3 === 1) R(15, 0, 1, 12, '#8a7c60'); R(5, 5, 4, 1, '#bcac8c'); } },
    cve: { solid: true, paint(R, X, Y) { R(0, 0, 16, 16, '#9c8c6c'); R(7, 0, 2, 16, '#7e7054'); R(0, 0, 16, 1, '#7e7054'); R(2, 5, 3, 1, '#b4a484'); R(11, 10, 3, 1, '#b4a484'); } },
    tfloor: { solid: false, paint(R, X, Y) {
      R(0, 0, 16, 16, '#6e6048'); for (let y = 1; y < 16; y += 5) { R(0, y, 16, 3, '#7e7056'); R(0, y + 3, 16, 1, '#54483a'); }   // 帆布底下垫着的滑雪板
      if (hash(X, Y, 480) < .3) R(((hash(X, Y, 481) * 10) | 0), 6, 5, 4, '#5a4e3c');
    } },
    sfill: { solid: true, paint(R, X, Y) {
      R(0, 0, 16, 16, '#cdd6e0'); R(1, 1, 7, 6, '#dfe6ee'); R(8, 4, 7, 7, '#d6dee8'); R(2, 9, 6, 6, '#e6ecf2'); R(0, 7, 16, 1, '#a8b4c2'); R(7, 0, 1, 16, '#b4c0cc');
      if (hash(X, Y, 490) < .4) R(10, 12, 4, 2, '#a8b4c2');
    } }
  };

  /* ---------- 道具精灵 ---------- */
  const FL = []; let flT = 0;
  const SPRITES = {
    /* 风雪：屏幕空间的雪花；起白风（g）时横着砸、黑暗也变成灰白色（双方各自画） */
    snowfx(g, e, t, R) {
      const dt = Math.min(.05, Math.max(0, t - flT)); flT = t;
      const lv = e.lv ?? 1, gust = e.g ? 1 : 0, m = curMap();
      if (m.def.wxDark) m.def.darkC = gust ? '#6a7482' : m.def.wxDark;
      const want = [0, 40, 90, 160][lv] + gust * 110;
      while (FL.length < want) FL.push({ x: Math.random() * VW, y: Math.random() * VH, v: .6 + Math.random() * .8, s: Math.random() < .25 ? 2 : 1 });
      const vx = -(18 + lv * 18 + gust * 150), vy = 20 + lv * 10 + gust * 18;
      g.fillStyle = 'rgba(44,54,76,.42)';
      for (let i = 0; i < want; i++) { const f = FL[i]; f.x += vx * f.v * dt; f.y += vy * f.v * dt; if (f.y > VH + 2) { f.y = -2; f.x = Math.random() * (VW + 80); } if (f.x < -6) { f.x = VW + Math.random() * 20; f.y = Math.random() * VH; } g.fillRect((f.x | 0) + 1, (f.y | 0) + 1, gust ? 4 : f.s, f.s); }
      g.fillStyle = gust ? 'rgba(244,248,255,.95)' : 'rgba(240,246,252,.9)';
      for (let i = 0; i < want; i++) { const f = FL[i]; if (gust) { g.fillRect(f.x | 0, f.y | 0, 4, 1); g.fillRect((f.x | 0) + 3, (f.y | 0) - 1, 2, 1); } else g.fillRect(f.x | 0, f.y | 0, f.s, f.s); }
    },
    /* 头顶的小 HUD：心跳条（帐篷里的恐慌）/ 指北针的方位（雪原上拧对了方位环之后） */
    hud(g, e, t, R) {
      if (W.pl.hidden) return;
      const ox = e.px - e.sx, oy = e.py - e.sy, X = Math.round(W.pl.px - ox), Y = Math.round(W.pl.py - oy);
      const F = (x, y, w, h, c) => { g.fillStyle = c; g.fillRect(X + x, Y + y, w, h); };
      if (e.num != null) {
        const v = clamp(e.num, 0, 100), n = Math.round(v / 100 * 11), beat = Math.sin(t * (5 + v / 10)) > .55;
        const col = v < 50 ? '#e8c87a' : v < 80 ? '#f08a4a' : (Math.sin(t * 14) > 0 ? '#ff4a4a' : '#a02020');
        F(-1, -18, 18, 5, '#07090c'); F(0, -17, 16, 3, '#1c2430');
        F(0, -17, 3, 3, beat ? '#ff5a6a' : '#9a2a3a'); F(1, -18, 1, 1, beat ? '#ff5a6a' : '#9a2a3a');
        if (n) { F(4, -16, n, 1, col); F(4, -17, n, 1, shade(col, .25)); F(4, -15, n, 1, shade(col, -.25)); }
      }
      if (e.b != null) {
        const a = e.b * Math.PI / 180, cx = X + 8, cy = Y + 6;
        g.fillStyle = 'rgba(10,12,18,.6)'; g.fillRect(cx - 2, cy - 2, 4, 4);
        for (let i = 0; i < 5; i++) { const r = 10 + i * 3; g.fillStyle = i < 3 ? 'rgba(255,96,70,.95)' : 'rgba(255,214,170,.7)'; g.fillRect(cx + Math.round(Math.sin(a) * r) - 1, cy - Math.round(Math.cos(a) * r) - 1, 2, 2); }
        g.fillStyle = '#e8eef4'; g.fillRect(cx - 1, cy - 14, 2, 3);   // 北
      }
    },
    cedar(g, e, t, R) {   // 林子边上那棵老雪松（w=2）：离地四五米以下没有活枝
      R(1, 13, 30, 4, 'rgba(0,0,0,.3)');
      const TK = '#4a3626', TD = '#30221a', C = '#1a3226', C2 = '#244432', SN = '#dde5ee';
      R(12, -44, 8, 58, TK); R(17, -44, 3, 58, TD); R(10, 9, 12, 6, TK); R(9, 13, 14, 2, TD);
      [[-34, 0], [-27, 1], [-20, 0], [-13, 1], [-7, 0]].forEach(([y, s]) => s ? R(20, y, 3, 1, TD) : R(9, y, 3, 1, TD));   // 断枝的旧疤
      const sw = Math.round(Math.sin(t * 1.3) * 1);
      R(3 + sw, -76, 26, 10, C); R(0 + sw, -68, 32, 12, C2); R(4 + sw, -58, 24, 10, C); R(8, -50, 16, 5, C2);
      R(5 + sw, -78, 22, 3, SN); R(1 + sw, -69, 11, 2, SN); R(20 + sw, -69, 11, 2, SN); R(5 + sw, -59, 8, 2, SN); R(19 + sw, -59, 9, 2, SN);
      for (let i = 0; i < 10; i++) R(4 + ((hash(i, 2, 7) * 24) | 0) + sw, -74 + ((hash(i, 3, 7) * 26) | 0), 2, 1, '#2e5440');
    },
    labaz(g, e, t, R) {   // 架在半人高的木桩上的存储仓（w=2）
      R(1, 13, 30, 3, 'rgba(0,0,0,.25)');
      for (const x of [2, 13, 18, 28]) R(x, -2, 2, 16, '#4a3626');
      R(0, -4, 32, 3, '#5c4630'); R(0, -5, 32, 1, '#e2e8ef');
      if (e.full) { R(3, -14, 10, 10, '#6a5a3a'); R(4, -14, 8, 2, '#7e6c48'); R(15, -12, 12, 8, '#4a5a7a'); R(16, -12, 10, 1, '#5a6a8a'); R(2, -17, 28, 2, '#8a6a44'); R(1, -18, 30, 1, '#e2e8ef'); }
      else { R(4, -10, 24, 6, '#3a2e22'); R(4, -11, 24, 1, '#5a4a36'); }
    },
    fire(g, e, t, R) {
      R(2, 11, 12, 4, '#3a2a1c'); R(1, 12, 14, 2, '#2a1e14'); R(3, 10, 10, 2, '#4a3626');
      if (e.off) { R(5, 9, 6, 2, '#3a3a3a'); return; }
      const f = Math.sin(t * 13) > 0 ? 1 : 0, f2 = Math.sin(t * 9 + 1) > 0 ? 1 : 0;
      R(4, 4 + f, 8, 7 - f, '#c8501a'); R(5, 2 + f2, 6, 7, '#e8801e'); R(6, 0 + f, 4, 7, '#f8c040'); R(7, -2 + f2, 2, 4, '#fff0a0');
    },
    logf(g, e, t, R) { R(0, 8, 16, 7, '#5a4430'); R(0, 8, 16, 2, '#6e5640'); R(1, 9, 1, 5, '#3a2a1c'); R(14, 9, 1, 5, '#3a2a1c'); R(0, 7, 16, 1, '#e2e8ef'); R(4, 4, 8, 5, '#3a5a8a'); R(5, 5, 6, 1, '#e8e2d0'); R(5, 7, 4, 1, '#e8e2d0'); },
    skis(g, e, t, R) { R(3, -14, 3, 28, '#8a5a30'); R(9, -15, 3, 29, '#7a4a28'); R(3, -15, 3, 2, '#c03030'); R(9, -16, 3, 2, '#c03030'); R(1, -10, 1, 24, '#888'); R(13, -10, 1, 24, '#888'); R(0, -11, 3, 1, '#333'); R(12, -11, 3, 1, '#333'); R(0, 12, 16, 3, '#dfe6ee'); },
    hole(g, e, t, R) { R(2, 4, 12, 8, '#1c2a3a'); R(3, 5, 10, 6, '#22384e'); R(3, 4, 10, 1, '#e2e8ef'); R(4, 7 + (Math.sin(t * 3) > 0 ? 1 : 0), 4, 1, '#4a6a8a'); },
    signp(g, e, t, R) { R(7, -2, 2, 16, '#4a3626'); R(1, -8, 14, 7, '#6a5236'); R(1, -9, 14, 1, '#e2e8ef'); R(3, -6, 8, 1, '#2a1e14'); R(3, -4, 6, 1, '#2a1e14'); },
    memorial(g, e, t, R) {   // 山口的大石头上钉着的纪念牌（w=2）
      R(0, 12, 32, 4, 'rgba(0,0,0,.25)');
      R(1, -12, 30, 26, '#4a5058'); R(3, -16, 24, 6, '#5a616a'); R(22, -10, 8, 22, '#3a3f46'); R(4, -4, 4, 3, '#646c76');
      R(2, -18, 22, 3, '#e2e8ef'); R(1, -13, 6, 2, '#e2e8ef'); R(24, -14, 6, 2, '#e2e8ef');
      R(8, -8, 14, 12, '#2a2620'); R(9, -7, 12, 10, '#6a5a3a'); for (let y = -5; y < 2; y += 2) R(10, y, 10, 1, '#c8b480');   // 金属牌，九行字
      if (e.flowers) { for (let i = 0; i < 6; i++) { R(9 + i * 2, 6, 1, 6, '#3a5a2a'); R(8 + i * 2, 4 + (i % 2), 3, 2, i % 3 ? '#c8283a' : '#e03a48'); } R(8, 11, 14, 2, '#d8d0c0'); }
    },
    probe(g, e, t, R) {   // 插在雪里的竹竿，标帐篷的位置；探过以后底下有个探杆戳出来的洞
      const s = Math.round(Math.sin(t * 6 + e.px) * 1);
      R(7, -12, 2, 26, '#c8a860'); R(7, -12, 2, 1, '#8a6a30'); R(9, -12, 4 + s, 2, '#d03030'); R(9, -10, 3 + s, 1, '#a02020');
      if (e.done) { R(5, 11, 6, 3, '#4a5a6a'); R(6, 11, 4, 1, '#2a3440'); }
    },
    tentX(g, e, t, R) {   // 帐篷外观（w=3）：flat = 门口那半边被雪板压平；cut = 最里头的口子
      R(0, 12, 48, 4, 'rgba(0,0,0,.3)');
      R(-2, -10, 52, 4, '#dfe6ee');   // 靠坡那面的雪墙
      if (e.flat) { R(0, 0, 26, 14, '#d0d8e2'); R(2, 2, 22, 3, '#e2e8ef'); R(4, 8, 8, 2, '#a69676'); R(16, 10, 6, 2, '#a69676'); R(26, -4, 22, 18, '#a89878'); R(26, -6, 22, 3, '#c0b090'); R(46, -4, 2, 18, '#7e7054'); }
      else { R(0, -4, 48, 18, '#a89878'); R(0, -6, 48, 3, '#c0b090'); R(23, -7, 2, 21, '#7e7054'); R(0, -4, 2, 18, '#7e7054'); R(46, -4, 2, 18, '#7e7054'); R(1, 2, 6, 10, '#6a5c44'); R(3, 3, 1, 8, '#8a7c60'); }
      for (const x of [-3, 50]) { R(x, 4, 1, 1, '#333'); R(x + (x < 0 ? 1 : -1), 3, 1, 1, '#555'); }
      if (e.cut) { R(43, -2, 2, 14, '#0a0a10'); R(42, 0, 1, 10, '#c8b896'); R(45, 2, 1, 8, '#c8b896'); }
      if (e.lit && !e.flat) { R(8, 0, 30, 10, 'rgba(255,190,110,.35)'); }
    },
    sbag(g, e, t, R) {   // 睡袋（h=2，头朝靠坡那面）；full = 里面有人，col = 帽子颜色
      R(1, 1, 14, 30, '#3a3a5a'); R(2, 2, 12, 28, '#4a4a6e'); for (let y = 6; y < 30; y += 5) R(2, y, 12, 1, '#3a3a5a');
      if (e.full) {
        const b = Math.sin(t * 1.4 + e.px) > 0 ? 1 : 0;
        R(2, 8, 12, 20 + b, '#56567c'); R(3, 9, 10, 2, '#6a6a90');
        R(4, 1, 8, 7, '#e6c4a2'); R(3, 0, 10, 4, e.col || '#4a3a30'); R(3, 4, 1, 4, e.col || '#4a3a30'); R(12, 4, 1, 4, e.col || '#4a3a30');
        R(6, 4, 1, 1, '#2a1a14'); R(9, 4, 1, 1, '#2a1a14');
      } else { R(3, 2, 10, 6, '#5e5e84'); R(3, 7, 10, 1, '#2e2e48'); }
      if (e.boots) { R(4, 26, 3, 4, '#5a4a3a'); R(9, 26, 3, 4, '#5a4a3a'); }
    },
    instr(g, e, t, R) {   // 挂在支杆上的温度计 + 气压表（在靠坡那面的帆布上）
      R(7, -4, 2, 20, '#6a5236');
      R(2, 1, 4, 11, '#e8e4d8'); R(3, 2, 2, 9, '#d0d0d0'); R(3, 7, 2, 4, '#c02828');
      R(9, 3, 7, 7, '#2a2620'); R(10, 4, 5, 5, '#e8e2cc'); const a = -.6 - (Math.sin(t * .7) * .1); R(12 + Math.round(Math.cos(a) * 2), 6 + Math.round(Math.sin(a) * 2), 1, 1, '#a02020'); R(12, 6, 1, 1, '#111');
    },
    recorder(g, e, t, R) { box(R, 2, 6, 12, 8, '#3a3a3a'); R(4, 8, 3, 3, '#1a1a1a'); R(9, 8, 3, 3, '#1a1a1a'); R(5, 9, 1, 1, '#888'); R(10, 9, 1, 1, '#888'); R(3, 12, 10, 1, '#555'); if (!e.off && Math.sin(t * 5) > 0) R(12, 7, 1, 1, '#ff3030'); R(7, 1, 2, 5, '#555'); R(6, 0, 4, 2, '#777'); },
    boots(g, e, t, R) { R(2, 4, 5, 10, '#5a4a3a'); R(9, 3, 5, 11, '#4e4032'); R(1, 12, 7, 3, '#4a3a2c'); R(8, 12, 7, 3, '#40342a'); R(2, 4, 5, 1, '#e2e8ef'); R(9, 3, 5, 1, '#e2e8ef'); },
    thermos(g, e, t, R) { R(5, 1, 6, 13, '#3a6a4a'); R(5, 1, 6, 2, '#aaa'); R(6, 4, 1, 8, '#5a8a6a'); R(4, 13, 8, 2, '#2a4a3a'); },
    packs(g, e, t, R) { R(1, 2, 8, 12, '#7a3a2a'); R(2, 3, 6, 3, '#8a4a3a'); R(8, 5, 7, 9, '#3a5a3a'); R(9, 6, 5, 2, '#4a6a4a'); R(3, 9, 4, 1, '#c8b880'); },
    lampH(g, e, t, R) { R(7, -2, 2, 6, '#555'); R(4, 4, 8, 9, '#3a3a3a'); R(5, 5, 6, 7, e.off ? '#3a3020' : (Math.sin(t * 11) > .8 ? '#f8d070' : '#f0c060')); R(3, 12, 10, 2, '#2a2a2a'); },
    tdoor(g, e, t, R) { R(0, -16, 16, 32, '#9c8c6c'); R(4, -12, 9, 26, '#8a7a5c'); R(8, -12, 1, 26, '#6a5c44'); for (let y = -10; y < 14; y += 4) R(7, y, 3, 1, '#c8c0a8'); R(2, 14, 13, 2, '#d8e0e8'); },
    slit(g, e, t, R) { const s = Math.round(Math.sin(t * 9) * 1); R(5, -14, 6, 30, '#0a0e18'); R(4 + s, -12, 2, 26, '#c8b896'); R(10 - s, -10, 2, 24, '#c8b896'); for (let i = 0; i < 4; i++) R(6, -12 + ((t * 40 + i * 7) % 26), 3, 1, '#e8eef4'); },
    bulge(g, e, t, R) {   // 靠坡那面的帆布被雪墙压进来（k=1 正在鼓、k=2 塌平）
      const k = e.k || 0; if (!k) return;
      const w = e.w * 16;
      if (k === 1) { const d = 3 + Math.round(Math.sin(t * 2.3) * 1.5); for (let x = 0; x < w; x += 4) { const h = Math.round(d * (1 - Math.abs(x - w * .35) / (w * .6))); if (h > 0) { R(x, 15, 4, h + 2, '#9a8c6c'); R(x, 15 + h + 2, 4, 1, '#6a5c44'); } } R(0, 0, w, 4, '#eef2f6'); }
      else { R(0, 0, w * .7, 16, '#cdd6e0'); R(0, 0, w * .7, 3, '#e6ecf2'); }
    },
    glowc(g, e, t, R) { const a = .12 + Math.sin(t * 1.7) * .04; R(0, 0, e.w * 16, e.h * 16, `rgba(255,140,60,${a})`); R(0, (e.h - 1) * 16, e.w * 16, 6, `rgba(255,170,90,${a + .1})`); },
    notebook(g, e, t, R) { R(3, 8, 10, 7, '#2a2a3a'); R(4, 8, 8, 6, '#e8e2d0'); R(5, 10, 6, 1, '#555'); R(5, 12, 4, 1, '#555'); R(3, 7, 1, 8, '#1a1a2a'); },
    prints(g, e, t, R) { R(3, 4, 3, 4, 'rgba(70,84,104,.7)'); R(9, 9, 3, 4, 'rgba(70,84,104,.7)'); R(3, 4, 3, 1, 'rgba(40,50,66,.6)'); R(9, 9, 3, 1, 'rgba(40,50,66,.6)'); },
    polelamp(g, e, t, R) { R(7, -14, 2, 28, '#8a5a30'); R(5, -16, 6, 2, '#555'); R(4, -14, 8, 8, '#3a3a3a'); R(5, -13, 6, 6, Math.sin(t * 9) > .85 ? '#f8d070' : '#f0b850'); R(3, 12, 10, 3, '#dfe6ee'); },
    /* 从门口探出头看见的天：屏幕空间画——星星、黑色山脊、一团慢慢张开的发光的雾（火箭尾焰）和一道弯尾巴 */
    skyv(g, e, t, R) {
      const w = VW, h = VH, gr = g.createLinearGradient(0, 0, 0, h);
      gr.addColorStop(0, '#03050c'); gr.addColorStop(.7, '#121a2e'); gr.addColorStop(1, '#232c44'); g.fillStyle = gr; g.fillRect(0, 0, w, h);
      for (let i = 0; i < 70; i++) { g.fillStyle = `rgba(230,236,255,${.25 + hash(i, 1, 5) * .6})`; g.fillRect((hash(i, 2, 5) * w) | 0, (hash(i, 3, 5) * h * .7) | 0, 1, 1); }
      const cx = w * .62, cy = h * .34, k = 1 + ((t * .06) % 1) * .35;
      for (let j = 0; j < 46; j++) { g.fillStyle = `rgba(255,${190 + (j % 3) * 10},150,${Math.max(0, .55 - j / 80)})`; g.fillRect((cx - j * 2.3) | 0, (cy + j * 1.5 + Math.sin(j * .22) * 4) | 0, 2, 2); }
      for (let i = 6; i >= 1; i--) { g.fillStyle = `rgba(255,${140 + i * 14},${90 + i * 22},${.04 + .025 * (7 - i)})`; g.beginPath(); g.ellipse(cx, cy, 13 * i * k, 8 * i * k * .8, -.35, 0, 7); g.fill(); }
      g.fillStyle = 'rgba(255,236,210,.9)'; g.fillRect(cx - 1, cy - 1, 3, 3);
      g.fillStyle = '#05070c'; g.beginPath(); g.moveTo(0, h * .8); g.lineTo(w * .2, h * .7); g.lineTo(w * .38, h * .76); g.lineTo(w * .6, h * .64); g.lineTo(w * .8, h * .72); g.lineTo(w, h * .66); g.lineTo(w, h); g.lineTo(0, h); g.fill();
      g.fillStyle = '#c9d2dc'; g.fillRect(0, h - 22, w, 22); g.fillStyle = '#6a5c44'; g.fillRect(0, 0, 20, h); g.fillRect(w - 20, 0, 20, h); g.fillStyle = '#8a7a5c'; g.fillRect(18, 0, 3, h); g.fillRect(w - 21, 0, 3, h);   // 门帘的两边
    },
    flame(g, e, t, R) {   // 坡下林子边的「火光」：远、小、一直在抖
      const f = Math.sin(t * 7) > 0 ? 1 : 0; R(6, 8 + f, 4, 5, '#c8501a'); R(7, 6 + f, 2, 5, '#f8a040'); R(7, 5, 2, 2, '#ffe08a');
    }
  };

  /* ---------- 地图 ---------- */
  function valleyRows() {
    const G = grid(28, 18, 'S');
    G.rect(0, 0, 27, 1, 'P'); G.rect(0, 2, 1, 17, 'P'); G.rect(26, 2, 27, 17, 'P'); G.rect(0, 16, 27, 17, 'P');
    G.rect(2, 14, 25, 15, 'i');
    G.rect(13, 1, 14, 8, ',');
    [[4, 4], [5, 11], [8, 3], [23, 10], [24, 4], [3, 8], [17, 2], [22, 13], [7, 12], [18, 12], [2, 3], [25, 7], [10, 3], [22, 2]].forEach(([x, y]) => G.set(x, y, 'P'));
    return G.rows();
  }
  function slopeRows() {
    const G = grid(30, 20, 'S');
    G.rect(0, 0, 29, 1, 'K'); G.rect(0, 2, 0, 19, 'K'); G.rect(29, 2, 29, 19, 'K'); G.rect(0, 19, 29, 19, 'K'); G.set(15, 19, 'S');
    [[5, 5], [6, 5], [20, 6], [22, 14], [4, 14], [25, 16], [8, 16], [23, 3], [26, 3], [27, 4], [17, 3], [2, 9], [27, 10]].forEach(([x, y]) => G.set(x, y, 'K'));
    return G.rows();
  }
  function tentRows() {
    return [
      'ZZZZZZZZZZZZZZ',
      'EUUUUUUUUUUUUE',
      'EffffffffffffE',
      'EffffffffffffE',
      'EffffffffffffE',
      'EffffffffffffE',
      'EDDDDDDDDDDDDE',
      '              '
    ];
  }
  function fieldRows() {
    const G = grid(44, 32, 'S');
    G.rect(0, 0, 43, 0, 'K'); G.rect(0, 31, 43, 31, 'K'); G.rect(0, 0, 0, 31, 'K'); G.rect(43, 0, 43, 31, 'K');
    G.rect(34, 28, 42, 30, 'P'); G.rect(36, 27, 42, 27, 'P'); [[33, 30], [32, 30], [41, 26], [42, 25]].forEach(([x, y]) => G.set(x, y, 'P'));
    [[25, 15], [25, 16], [25, 17], [26, 16], [26, 17], [6, 12], [7, 12], [19, 8], [20, 8], [30, 6], [31, 6], [15, 20], [16, 20], [20, 25], [21, 25], [28, 11], [8, 22], [35, 14], [36, 14], [4, 4], [18, 3], [12, 14], [30, 20], [10, 27], [27, 27], [38, 9], [3, 18]].forEach(([x, y]) => G.set(x, y, 'K'));
    return G.rows();
  }
  /* 列夫的脚印：从帐篷的口子一路歪歪扭扭往坡下（135°），越往下越淡，后半段被风填平了 */
  const PRINTS = (() => {
    const out = [], seen = new Set();
    for (let k = 0; k <= 17; k++) { const tt = k / 17, x = Math.round(14 + 9 * tt + Math.sin(k * .9) * 1.2), y = Math.round(6 + 9 * tt), key = x + ',' + y; if (seen.has(key)) continue; seen.add(key); out.push([x, y]); }
    return out;
  })();
  const printAlpha = i => i < 6 ? .9 : Math.max(0, .9 - (i - 5) * .18);

  /* ================= 河谷：林子边 ================= */
  const ready = f => f.cache && f.probeGot;
  function valleyGoal(S) {
    const f = S.f, L = [];
    if (!f.cache) L.push('把多余的口粮放进仓里（西边）');
    if (!f.probeGot) L.push('去河边找塔尼娅');
    S.goal(L.length ? L.join('；') : '上坡（北边那条小路）');
  }
  async function pavelV(S) {
    const f = S.f; S.face('pavV', 'pl');
    if (!f.met) {
      await S.say('帕维尔', ['到了。这儿就是林子的边。', '再往上就没有树了。风会直接从山脊上刮下来。']);
      await S.say('帕维尔', ['照计划：多余的口粮和备用滑雪板，在这儿搭个仓存起来，轻装上坡。', '天黑以前到坡上——先去纪念碑献花，再扎营。']);
      await S.note('n_route');
      S.give('flowers');
      await S.say('帕维尔', '花你拿着。……按咱们的规矩，给逝者的花，要双数。');
      f.met = true; valleyGoal(S); return;
    }
    if (ready(f)) return S.say('帕维尔', '都弄好了？走吧，北边那条小路。二月的天，四点多就黑了。');
    return S.say('帕维尔', !f.cache ? '仓在西边那两根木桩上。多余的吃的都塞进去。' : '去找塔尼娅。她那根宝贝探杆，你替她扛上去。');
  }
  async function tanyaV(S) {
    const f = S.f; S.face('tanV', 'pl');
    if (!f.met) return S.say('塔尼娅', '先去跟帕维尔对一下计划吧。他在火边。');
    if (!f.probeGot) {
      await S.say('塔尼娅', ['你听这冰底下。咕噜，咕噜。', '山上下来的水，一整个冬天都冻不透。']);
      await S.say('塔尼娅', ['这个你扛着。雪崩探杆，三米长，一节一节拧起来的。', '上了坡，扎营以前我要先探一探雪。帕维尔嫌我啰嗦——你帮我盯着他。']);
      S.give('probe'); f.probeGot = true; valleyGoal(S);
      if (ready(f)) await S.say('帕维尔', '（远远地）都好了就走！');
      return;
    }
    return S.say('塔尼娅', '风是从东边山谷里往上刮的。山脊这边的雪，夜里会被它一层一层堆到坡上……我不喜欢这个风。');
  }
  async function levV(S) {
    const f = S.f; S.face('levV', 'pl');
    if (!f.levTalk) {
      await S.say('列夫', ['……这棵树。', '据说那年，他们最后到过这棵树下。']);
      await S.narr('列夫没再往下说。他举起一个小小的传声器，对着树顶，听了很久。');
      await S.say('列夫', ['我不是来找什么怪物的。', '我只是想知道，那天夜里，这座山是什么声音。', '——我的剪报夹在火边那根木头上，你想看就看。']);
      f.levTalk = true; return;
    }
    return S.say('列夫', '录音机我裹了三层毛衣。零下三十度，电池撑不了多久。');
  }
  async function cedarUse(S) {
    if (S.once('cedar')) {
      await S.narr('一棵很老的西伯利亚松。这边的人管它叫雪松。\n树干两个人才合抱得过来。离地四五米以下，一根活的枝丫都没有——断口很旧了，早就长出了新的树皮。');
      await S.think('（……他们最后到过这里。）');
      await S.narr('你在树下站了一会儿。\n风从坡上下来，树顶沙沙地响，像有人在很远的地方说话。');
      return;
    }
    return S.narr('雪松的树顶在风里摇。树底下的雪，被很多年里来过的人踩得实实的。');
  }
  async function cacheUse(S) {
    const f = S.f, e = S.ent('labaz');
    if (!f.met) return S.narr('两根木桩上架着一块木板，盖着帆布——帕维尔中午搭的存储仓，离地半人高，防野兽。还空着。');
    if (!f.cache) {
      await S.narr('你把背包里多余的东西塞进仓里：两袋荞麦、一罐炼乳、一包黑面包干，还有备用的滑雪板。\n帆布盖好，用绳子勒紧。');
      e.full = true; f.cache = true; S.sfx('item'); valleyGoal(S);
      if (ready(f)) await S.say('帕维尔', '（远远地）都好了就走！');
      return;
    }
    return S.narr('仓里的东西码得整整齐齐。明天下山的时候来取。');
  }
  async function valleyExit(S) {
    const f = S.f;
    if (!f.met) { await S.say('帕维尔', '喂！先过来，对一下计划。'); return S.walk('pl', 'd', 4); }
    if (!ready(f)) { await S.say('帕维尔', '等等，东西还没收拾好呢。'); valleyGoal(S); return S.walk('pl', 'd', 4); }
    await S.narr('你们踩着滑雪板，一个跟着一个，往坡上爬。\n林子在身后一点一点矮下去。');
    return S.go('slope', 15, 17, 3);
  }

  /* ================= 山坡：纪念碑与探雪 ================= */
  async function slopeEnter(S, first) {
    if (!first) return;
    S.f.ph = 'slope';
    await S.narr('树一棵一棵地矮下去，然后就没有了。\n眼前只有雪，和一道往上斜着的、灰白色的坡。');
    await S.say('帕维尔', ['霍拉特-西亚赫尔。', '曼西人的话，常被翻成「死山」。']);
    await S.say('塔尼娅', '……也有人说，意思只是「没有猎物的山」。');
    await S.say('帕维尔', '先去献花。纪念碑在右上边那块大石头上。');
    S.goal('去纪念碑献花（右上边的大石头）'); S.cp();
  }
  async function memoUse(S) {
    const f = S.f, e = S.ent('memo');
    if (!f.flowers && S.has('flowers')) {
      await S.narr('大石头上钉着一块金属纪念牌，上面刻着九个名字。\n你一个一个地看过去，没有念出声。');
      S.take('flowers'); e.flowers = true; f.flowers = true; S.sfx('paper');
      await S.narr('你把花放在牌子底下。\n红色的康乃馨，一碰就沙沙地响——已经冻硬了。');
      await S.wait(700);
      await S.narr('风停了一下。\n谁也没有说话。');
      await S.say('帕维尔', '……我们不是来猎奇的。是来陪他们过一夜的。');
      if (S.has('camera')) {
        const r = await S.ask('相机里的胶卷，只剩最后一张了。', ['留着——也许夜里用得上', '拍下纪念碑和那捧花']);
        if (r === 1) { f.memoPhoto = true; S.fx('flash'); S.sfx('switch'); await S.narr('「咔嚓。」\n取景框里，红色的花在灰白的石头底下，像一小团火。'); }
      }
      S.goal('回坡中间的营地，找塔尼娅'); S.cp(); return;
    }
    return S.narr('花还在牌子底下。风把雪吹上去，又吹走。');
  }
  const PROBE = {
    pr1: ['门口那头', '探杆往下，先「咔」地穿过一层硬壳。\n再往下很硬，一直硬到六十厘米——\n然后一下子空了。探杆自己往下滑了半截，像捅进了一袋砂糖。', '六十。……门口这头，风把雪全堆在这儿了。'],
    pr2: ['中间', '硬壳，然后是硬雪板，四十厘米左右。\n再往下，又是一空。', '四十。底下还是那层砂糖。'],
    pr3: ['最里头', '只穿过二十厘米就碰到了底。\n再往下戳，戳不动——压得实实的。', '二十，底下是实的。这头最好。']
  };
  function probeGoal(S) {
    const f = S.f, L = ['pr1', 'pr2', 'pr3'].filter(k => !f[k]).map(k => PROBE[k][0]);
    S.goal('用探杆探三根竹竿的位置（还剩：' + L.join('、') + '）');
  }
  async function tanyaS(S) {
    const f = S.f; S.face('tanS', 'pl');
    if (!f.flowers) return S.say('塔尼娅', '先去献花吧。我在这儿等你。');
    if (!f.probeTold) {
      await S.say('塔尼娅', ['就是这儿了。帕维尔要在坡上挖一道平台扎帐篷——像他们当年那样。', '这坡有二十五度。上面的雪，是风一夜一夜从山谷那边搬上来的。']);
      await S.say('塔尼娅', ['帐篷的位置我插了三根竹竿：门口那头、中间、最里头。', '你拿探杆一根一根探下去，我记数。']);
      f.probeTold = true; probeGoal(S); return;
    }
    return S.say('塔尼娅', '慢慢往下插，手上别使猛劲。感觉一下：哪儿硬，哪儿突然空了。');
  }
  async function probeUse(S, k) {
    const f = S.f;
    if (!f.probeTold) return S.narr('一根插在雪里的竹竿，杆头系着红布条，在风里扑扑地抖。\n塔尼娅插的。');
    if (f[k]) return S.narr('（' + PROBE[k][0] + '）探过了。' + PROBE[k][2].split('。')[0] + '。');
    const [nm, t, tl] = PROBE[k];
    S.sfx('blip');
    await S.narr('（' + nm + '）\n' + t);
    await S.say('塔尼娅', tl);
    f[k] = true; S.ent(k).s.done = true;
    if (f.pr1 && f.pr2 && f.pr3) return pitch(S);
    probeGoal(S);
  }
  async function pitch(S) {
    const f = S.f;
    await S.note('n_probe');
    await S.say('塔尼娅', '要我说，就别在这儿扎。往下走，回林子里去。');
    await S.say('帕维尔', ['天已经黑了。下去要一个多钟头——摸黑在坡上走，更危险。', '平台挖浅一点。门开在西头，背风，风灌不进来。']);
    await S.say('塔尼娅', '……背风的那头，就是雪堆得最厚的那头。');
    await S.say('帕维尔', '我知道。所以今晚，谁也别睡死。');
    await S.fade(1, 700);
    ['pr1', 'pr2', 'pr3', 'pavS', 'levS', 'tanS'].forEach(id => S.hide(id));
    S.show('tentS'); f.pitched = true; S.dark(.8); S.ent('wxS').s.lv = 2;
    await S.card('傍晚六点', '', '你们在坡上挖出一道平台，靠坡那面切出了一人高的雪墙。\n帆布帐篷底下垫着滑雪板，门朝西。\n\n天黑透了。风越来越大。');
    await S.fade(0, 700);
    S.goal('进帐篷（门在西头）'); S.cp();
  }

  /* ================= 帐篷里的夜 ================= */
  function sleepAll(S) {
    for (const k of KS) { S.hide(k + 'P'); S.ent(k + 'B').full = true; }
    S.ent('myB').full = true; S.hidePlayer(true);
  }
  function getUp(S) { S.ent('myB').full = false; S.pos(8, 4, 3); S.hidePlayer(false); }
  function freeCell(S, x) {
    const m = curMap(), p = W.pl;
    for (const [cx, cy] of [[x, 4], [x, 5], [x - 1, 4], [x + 1, 4], [x - 1, 5], [x + 1, 5], [x + 2, 4], [x + 2, 5]])
      if (passable(m, cx, cy, null) && !(p.x === cx && p.y === cy)) return [cx, cy];
    return [x, 5];
  }
  function wakeP(S, k) { S.ent(k + 'B').full = false; const c = freeCell(S, BAGX[k]); S.place(k + 'P', c[0], c[1], 0); }
  function panicGoal(S) {
    const f = S.f, L = [];
    if (!f.c1) L.push('叫醒塔尼娅'); if (!f.c2) L.push('看一眼温度计'); if (!f.c3) L.push('安抚列夫');
    S.goal('稳住（心跳条满了就完了）：' + L.join('、') + (L.length > 1 ? '（两人时分头做：一人叫醒塔尼娅，一人去看温度计）' : ''));
  }
  async function tentEnter(S, first) {
    if (!first) return;
    S.f.ph = 'bed';
    await S.narr('帐篷里点着一盏马灯。\n靠坡那面贴着刚切出来的雪墙，冷气一阵一阵地往外冒。\n雪墙的切面上看得见一层一层的雪：门口那头的硬雪板，比最里头厚了一大截。');
    await S.say('帕维尔', '都进来了？把门帘系紧。');
    await S.say('塔尼娅', '靴子别放门口——冻硬了，明早穿不进去。塞到睡袋脚头，焐着。');
    await S.say('列夫', '录音机我挂在杆子边上了。夜里有什么声音，它都会录下来。');
    S.goal('睡前：收好门口的靴子，钻进你的睡袋（中间偏里那个）'); S.cp();
  }
  async function bootsUse(S) {
    const f = S.f;
    if (f.ph === 'bed' && !f.boots) {
      const r = await S.ask('你的毡靴，靴筒上结了一圈冰碴。', ['塞进睡袋脚头', '先放门口吧']);
      if (r === 0) { f.boots = true; S.hide('bootsT'); S.ent('myB').s.boots = true; S.sfx('item'); await S.narr('你把靴子塞进睡袋的脚头。\n冰碴贴着脚背，凉得人一哆嗦。'); }
      return;
    }
    return S.narr('门口的毡靴，冻得像两块木头。');
  }
  async function myBag(S) {
    const f = S.f;
    if (f.ph === 'bed') {
      if (!f.boots && !f.bootsQ) {
        f.bootsQ = true;
        const r = await S.ask('靴子还在门口。', ['爬回去拿，塞进睡袋', '算了，就放那儿']);
        if (r === 0) { f.boots = true; S.hide('bootsT'); S.ent('myB').s.boots = true; await S.narr('你爬回门口，把靴子抱了回来，塞进睡袋脚头。'); }
      }
      return ev1(S);
    }
    if (f.ph === 'calm') return ev2(S);
    if (f.ph === 'calm2') return ev3(S);
    if (f.ph === 'panic') return S.narr('你根本躺不下去。胸口像压着一块石头。');
    if (f.ph === 'light') return S.narr('帐篷布还亮着。你得先去门口看一眼。');
    if (f.ph === 'slab') return S.narr('没时间了！');
    return S.narr('你的睡袋。');
  }
  async function bagUse(S, k) {
    const f = S.f, b = S.ent(k + 'B');
    if (f.ph === 'slab') { if (!b.full) return S.narr(NAME[k] + '已经起来了。'); return slabWake(S, k); }
    if (f.ph === 'panic') {
      if (k === 'tan' && !f.c1) return calmTanya(S);
      if (k === 'pav') return S.narr('帕维尔睡得像块石头，呼噜打得比风还响。\n……有人能睡着，挺好。');
    }
    if (b.full) return S.narr({ lev: '列夫蜷在睡袋里，录音机的红灯在他头顶一闪一闪。', pav: '帕维尔的呼噜声。一下，一下，比钟还准。', tan: '塔尼娅睡得很浅，睫毛一直在动。' }[k]);
    return S.narr(NAME[k] + '的睡袋，空着。');
  }
  async function personUse(S, k) {
    const f = S.f; S.face(k + 'P', 'pl');
    if (f.ph === 'bed') return S.say(NAME[k], { lev: '你听，风绕过山脊那排石头的声音。像有人在吹空瓶子。', pav: '明天六点起。谁赖床，谁背炉子。', tan: '……今晚别睡死。我说真的。' }[k]);
    if (f.ph === 'panic') {
      if (k === 'lev' && !f.c3) return calmLev(S);
      if (k === 'tan') return S.say('塔尼娅', '别看帐篷布。看着我。');
      return S.say('列夫', '……吸。……呼。');
    }
    if (f.ph === 'slab') return S.say(NAME[k], '往哪边？！');
    if (f.ph === 'after') return S.say(NAME[k], k === 'pav' ? '下去……得下去……' : '……');
    return S.say(NAME[k], { lev: '……', pav: '列夫那小子……', tan: '快去。' }[k]);
  }
  async function ev1(S) {
    const f = S.f; f.ph = 'panic0';
    sleepAll(S);
    await S.fade(1, 600);
    await S.card('夜里十一点', '', '马灯拧到了最小。\n风越刮越大，帐篷布一鼓一瘪，像在喘气。');
    await S.fade(0, 600);
    SND.hum(S, .14); await S.wait(1400);
    await S.narr('……有一个声音。\n不是风声。比风声低得多，低到耳朵几乎听不见——是胸口先听见的。');
    SND.hum(S, .17); S.shake(600, 1); S.sfx('heart');
    getUp(S); wakeP(S, 'lev'); S.face('levP', 'pl');
    await S.say('列夫', ['……你也听见了？', '不对。不对劲。我心里发慌——我说不清为什么。']);
    await S.think('（心跳得好快。手心全是汗。）');
    f.ph = 'panic'; f.panic = 30; f.c1 = f.c2 = f.c3 = false;
    panicGoal(S); S.cp('panic'); f.panicOn = true;
  }
  async function calmTanya(S) {
    const f = S.f;
    wakeP(S, 'tan'); S.face('tanP', 'pl');
    await S.say('塔尼娅', ['……怎么了？', '（她听了一会儿。）']);
    await S.say('塔尼娅', ['是风。山脊上那排石头，风绕过去，会一左一右甩出旋涡——一个接一个，像旗子在抖。', '旋涡一甩，空气就跟着抖。抖得太慢，耳朵听不见，可身体听得见。这叫次声。', '它会让人心慌，会让人觉得外面有东西。……可它只是风。']);
    f.c1 = true; f.panic = Math.max(0, f.panic - 30); return checkCalm(S);
  }
  async function calmLev(S) {
    const f = S.f;
    await S.narr('你握住列夫的手。他的手在抖。');
    await S.say('你', ['跟着我数。吸——四下。', '屏住——四下。呼——四下。']);
    SND.breath(S);
    await S.say('列夫', '……吸。……呼。');
    f.c3 = true; f.panic = Math.max(0, f.panic - 30); return checkCalm(S);
  }
  async function instrUse(S) {
    const f = S.f;
    if (f.ph === 'panic' && !f.c2) {
      if (!f.sawFace) { f.sawFace = true; await S.narr('你凑到帆布跟前去看温度计。\n帆布在你鼻尖前面，一鼓，一瘪——'); await faceEv(S); }
      await S.narr('支杆上挂着温度计和气压表。\n零下二十七度。气压表的指针在往下掉——风还要更大。');
      await S.think('（……数字是实的。数字不会骗人。）');
      f.c2 = true; f.panic = Math.max(0, f.panic - 20); return checkCalm(S);
    }
    return S.narr('温度计：零下二十七度。气压表的指针，比睡前又往下走了一格。');
  }
  async function checkCalm(S) {
    const f = S.f;
    if (!(f.c1 && f.c2 && f.c3)) { panicGoal(S); return; }
    f.panicOn = false; f.ph = 'calm'; S.ent('hudT').num = null;
    await S.narr('不知道过了多久，风向变了。\n那个低低的声音，一点一点退了下去。');
    await S.say('列夫', '……对不起。我刚才，真以为外面有人。');
    await S.say('塔尼娅', '睡吧。我醒着。');
    for (const k of ['lev', 'tan']) { S.hide(k + 'P'); S.ent(k + 'B').full = true; }
    S.show('levNoteT');
    S.goal('回睡袋（列夫的笔记本掉在他睡袋边上）'); S.cp();
  }
  async function faceEv(S) {
    const f = S.f;
    S.sfx('whisper'); await S.wait(300);
    await S.scare('face', { face: 'windF', dur: 1.1 });
    await S.narr('帐篷布外面……贴着一张脸。\n白的。没有眼睛。嘴张得很大很大——风从那张嘴里灌进来。');
    S.sfx('scream');
    await S.say('列夫', '你看见了吧？！外面有人！', { style: 'big' });
    await S.think('（……是帐篷布被风压出来的褶子。是吧？）');
    f.panic = Math.min(99, f.panic + 8);
  }
  async function warnEv(S) {
    await S.think('你的手，不知道什么时候摸到了腰上的刀。\n割开它。出去。出去就好了——');
    await S.say('', '稳住。', { style: 'big' });
    panicGoal(S);
  }
  async function panicEnd(S) {
    const f = S.f; f.panicOn = false; S.ent('hudT').num = null;
    await S.narr('你拔出了刀。');
    S.sfx('tear'); S.shake(400, 2); await S.wait(300); S.sfx('tear');
    await S.narr('刀划过帆布的声音，比风还响。');
    return S.end({ bad: true, id: 'panic', title: '割开帐篷', text: '你割开了帐篷。\n你们一个接一个钻出去，钻进风里——谁也没有回头拿靴子。\n那个低低的声音一直跟在后面。\n\n帐篷留在了坡上。\n里面的东西都还在：靴子、外套、那台还在转的录音机。\n录音机最后录下的，只有风声。\n\n（心跳条快满的时候：叫醒塔尼娅、看一眼温度计、握住列夫的手。）' });
  }
  async function ev2(S) {
    const f = S.f; f.ph = 'light0';
    sleepAll(S);
    await S.fade(1, 600);
    await S.card('零点四十分', '', '你迷迷糊糊地睡着了一会儿。');
    await S.fade(0, 600);
    S.show('glowT'); SND.rocket(S);
    await S.narr('帐篷布忽然亮了。\n橘红色的光，从布的那一面透进来，慢慢地，越来越亮。');
    await S.say('列夫', ['（睡袋里传来他的声音）……火球。', '是火球！跟他们说的一样——'], { style: 'whisper' });
    getUp(S);
    f.ph = 'light'; S.goal('去门口看看那道光（门在西头）'); S.cp();
  }
  async function doorUse(S) {
    const f = S.f;
    if (f.ph === 'light') {
      await S.narr('你解开冻硬的门帘，探出头去。');
      S.dark(0); S.show('skyT');
      await S.narr('天上，东南边的山脊上面，有一团光。\n它慢慢地张开，像一只发光的水母，边上拖着一道弯弯的尾巴。\n没有声音。过了好一会儿，才隐隐约约传来一阵闷雷似的轰鸣。');
      SND.rocket(S);
      await S.narr('（塔尼娅也挤了过来，下巴搁在你肩膀上。）');
      await S.say('塔尼娅', ['……是火箭。北边普列谢茨克发射场的。', '尾焰升到很高的地方，被地平线底下的太阳照亮了——几百公里外都看得见。', '六十年前，也有人在这一带看见过天上的光球。据说是在他们出事以后的那几个星期。']);
      if (f.memoPhoto) await S.narr('你下意识去摸相机——胶卷已经在纪念碑那儿用完了。');
      else if (S.has('camera')) {
        const r = await S.ask('胶卷还剩最后一张。', ['举起相机，拍下来', '算了——手已经冻僵了']);
        if (r === 0) { f.photo = true; S.fx('flash'); S.sfx('switch'); await S.narr('「咔嚓。」\n快门的声音，小得像一根树枝断了。'); }
      }
      S.hide('glowT'); S.hide('skyT'); S.dark(null);
      await S.say('列夫', '……火箭。哈。我还以为……');
      f.ph = 'calm2'; S.goal('回睡袋'); S.cp(); return;
    }
    if (f.ph === 'bed' || f.ph === 'calm' || f.ph === 'calm2') return S.narr('门帘系紧了。外面风雪呼呼地响。\n帕维尔说过：夜里谁也不许一个人出帐篷。');
    if (f.ph === 'panic') { f.panic = Math.min(99, f.panic + 6); return S.narr('（出去。出去就好了——）\n你攥住门帘，又松开了。心跳得更快了。'); }
    if (f.ph === 'slab') { S.sfx('locked'); return S.narr('门帘冻住了——拉链上全是冰，拽不开！\n头顶的帆布在往下压。'); }
    return S.narr('门口那头已经埋在雪底下了。');
  }
  async function ev3(S) {
    const f = S.f; f.ph = 'slab0';
    sleepAll(S);
    await S.fade(1, 600);
    await S.card('凌晨一点五十分', '', '');
    await S.fade(0, 600);
    await S.narr('风停了。\n停得那么突然，耳朵里嗡嗡地响。');
    await S.wait(500);
    SND.whumpf(S); S.shake(800, 2);
    await S.narr('「嗡——」\n身子底下，整片坡轻轻地沉了一下。');
    S.ent('bulgeT').s.k = 1; SND.creak(S); SND.creak(S, .6);
    await S.say('塔尼娅', '……雪板。', { style: 'whisper' });
    getUp(S);
    await S.narr('靠坡那面的帐篷布，正在一点一点地鼓进来。\n雪墙在往下压。');
    await S.say('塔尼娅', '它要塌了！快——把他们叫起来！（她的拉链卡住了，在睡袋里拼命地挣）', { style: 'big' });
    f.ph = 'slab';
    S.goal('雪板要塌了！叫醒三个人，带他们躲到安全的一侧（两人时：一人翻塔尼娅的探杆记录，一人去拉人）');
    S.cp('slab'); return startSlab(S);
  }
  async function startSlab(S) {
    const f = S.f; f.w_lev = f.w_pav = f.w_tan = false;
    await S.think(D.slab >= 2 ? '（再来一次。最里头、下坡那一侧——先叫醒他们。）' : '（只有十几秒。雪最厚的是哪一头？靠坡的是哪一边？）');
    crT = 0; S.timer(SLAB_T + Math.min(4, D.slab * 2), '雪板', slabFall, { during: true });
  }
  async function slabWake(S, k) {
    const f = S.f;
    wakeP(S, k); f['w_' + k] = true; S.follow(k + 'P', true); S.sfx('blip');
    await S.say(NAME[k], { lev: '……什么？！怎么了？！', pav: '——谁？出什么事了？', tan: '拉链冻住了——拽我一把！' }[k]);
    S.bubble(k + 'P', '!', 800);
    const n = KS.filter(q => f['w_' + q]).length;
    if (n < 3) S.toast('叫醒了 ' + n + '/3'); else S.toast('三个人都起来了——带他们躲到安全的一侧！');
  }
  async function slabFall(S) {
    const f = S.f, p = W.pl;
    const all = f.w_lev && f.w_pav && f.w_tan, safe = inSafe(p.x, p.y);
    SND.whumpf(S); S.shake(900, 3);
    if (!all || !safe) {
      D.slab++;
      for (const k of KS) if (f['w_' + k]) S.follow(k + 'P', false);
      let why;
      if (!safe && p.x >= 9) why = '最里头是对的——可靠坡那半边也会被压住。往下坡那一侧（靠下的两排）躲。';
      else if (!safe) why = D.slab === 1 ? '雪板先从雪最厚的地方塌下来。翻翻塔尼娅的探杆记录：哪头最厚，哪头最薄？靠坡那面是雪墙。'
        : D.slab === 2 ? '门口那头最厚，最里头最薄；靠坡那半边会先被压住。往最里头、下坡那一侧去。'
          : '帐篷最里头、靠下坡的那两排（右下角那几格）。先叫醒三个人，再带他们一起过去。';
      else why = '你躲对了地方——可' + KS.filter(k => !f['w_' + k]).map(k => NAME[k]).join('、') + '还在睡袋里。先把三个人都叫醒，让他们跟着你。';
      S.fx('flash');
      await S.die('雪板塌了下来。\n帐篷的那一半，一下子就平了。\n雪是硬的，像一整块水泥，压得人喘不上气。\n\n（' + why + '）', '雪板');
      return;
    }
    return collapse(S);
  }
  async function collapse(S) {
    const f = S.f; f.ph = 'after';
    for (const k of KS) S.follow(k + 'P', false);
    const cells = [[12, 4], [12, 5], [11, 5], [11, 4], [10, 5], [10, 4], [9, 5], [9, 4]].filter(([x, y]) => !(x === W.pl.x && y === W.pl.y));
    KS.forEach((k, i) => S.place(k + 'P', cells[i][0], cells[i][1], 1));
    S.fx('flash'); S.sfx('thud');
    for (let y = 2; y <= 5; y++) for (let x = 1; x <= 12; x++) if (!inSafe(x, y)) S.tile(x, y, 'X');
    ['levB', 'pavB', 'tanB', 'myB', 'recT', 'instrT', 'levNoteT', 'bootsT', 'packT', 'lampT', 'thermT'].forEach(id => S.hide(id));
    S.ent('bulgeT').s.k = 2; S.dark(.92); S.plr(2.6);
    await S.narr('一声闷响。\n帐篷的大半边，一下子就平了——门口那头、靠坡那面，全埋进了雪里。\n马灯被压灭了。');
    await S.narr('你们四个挤在最里头的这一角，谁也不敢动。\n……没有人受伤。');
    if (!f.boots) await S.think('（我的靴子……在门口那头的雪底下。）');
    SND.hum(S, .15);
    await S.say('列夫', ['出去……我要出去……', '又来了——那个声音又来了！你们听不见吗？！']);
    S.sfx('tear'); await S.wait(250); S.sfx('tear');
    S.tile(13, 4, 'f'); S.show('slitT');
    await S.narr('列夫拔出刀，在最里头那面帐篷布上，「嘶啦」一声划开一道长口子。\n他从口子里钻了出去。');
    await S.walk('levP', [13, 4], 6); S.hide('levP');
    await S.say('帕维尔', ['列夫！！', '……下去。都下去！到林子里去，那儿有树，能生火——']);
    await S.say('塔尼娅', ['帕维尔。', '六十年前，他们大概也是这么想的。那天夜里，换了谁都会这么想。', '可我们知道后来的事。']);
    S.goal('做决定：跟帕维尔下山，还是留下？'); S.cp('choice');
    return choice(S);
  }
  async function choice(S) {
    const f = S.f;
    const r = await S.ask('帕维尔已经在往口子那边挤了。', ['跟着帕维尔，往林子那边跑', '「不行。衣服在这儿，帐篷在这儿——你们把能挖的挖出来。我去把列夫追回来。」']);
    if (r === 0) return cedarEnd(S, 'tent');
    await S.say('帕维尔', ['……好。好。', '（他的声音在抖。）你一个人？——带上这个。']);
    S.give('compass');
    await S.say('塔尼娅', ['顺着他的脚印走。风很快会把脚印填平——看不见了，就听哨子。他兜里有哨子。', '别往林子那边去。不管看见什么。']);
    if (!f.boots) { await S.narr('塔尼娅把一件毛衣撕成两半，一圈一圈缠在你脚上。'); await S.say('塔尼娅', '只能撑一会儿。快去快回。'); }
    f.ph = 'go'; S.goal('从帐篷最里头割开的口子出去，顺着脚印把列夫追回来'); S.cp();
  }
  async function slitUse(S) {
    if (S.f.ph !== 'go') return;
    return S.go('field', TENT[0], TENT[1], 2);
  }

  /* ================= 雪原：夜 ================= */
  async function fieldEnter(S, first) {
    if (!first) return;
    await S.narr('外面是黑的。\n不——是灰的。风卷着雪，天和地分不清，只有头灯照着的那一小圈是白的。');
    if (!S.f.boots) await S.narr('缠着毛衣的脚一踩进雪里，就像踩进了冰水。\n……走快点。');
    await S.narr('雪地上有一行脚印，歪歪扭扭的，往坡下去了。');
    await S.say('塔尼娅', '（身后传来她的喊声）我们在这儿挖！灯挂在滑雪杖上——回来的时候看灯！');
    S.goal('顺着列夫的脚印往坡下找他（体温在掉，别停）');
    S.cp('out'); return startOut(S);
  }
  const tempLabel = S => S.f.boots ? '体温' : '体温（只穿毡袜）';
  function startOut(S) {
    const f = S.f; f.ph = 'search'; f.gust = false; f.lureW = false;
    S.norun(true); S.ent('wxF').s.g = 0; S.ent('hudF').s.b = null; S.dark(.9); S.plr(2.4);
    S.timer(f.boots ? 46 : 38, tempLabel(S), freeze, { during: true });
  }
  async function freeze(S) {
    D.out++;
    const hint = D.out === 1 ? '体温见底就完了：别停下，也别跟着火光走。找到列夫后，把指北针拧到回帐篷的方位。'
      : '帕维尔的路线卡上写着：帐篷 → 雪松约 135°。回去要反过来——135 加 180，是 315。';
    S.hidePlayer(false);
    await S.die('你停下来，想喘一口气。\n雪落在睫毛上，不化了。\n你想：就坐一会儿。就一会儿。\n\n（' + hint + '）', '冻僵');
  }
  async function foundLev(S) {
    const f = S.f, left = S.timerLeft; S.clearTimer(); f.ph = 'found';
    S.face('levF', 'pl');
    await S.narr('石脊后面，列夫蹲在雪里。手电筒的光一晃一晃。\n他在看坡下。');
    await S.say('列夫', ['你看……下面有火。', '林子边上。有人在下面生了火。我们过去吧。过去就暖和了。']);
    S.focus(38, 26); await S.wait(1300); S.focus(null);
    await S.say('你', '那边什么都没有，列夫。跟我回去。');
    S.ent('wxF').s.g = 1; S.dark(.96); S.plr(1.5); S.shake(700, 2);
    await S.scare('face', { face: 'windF', dur: 1 });
    await S.narr('起白风了。\n雪不是落下来的，是横着砸过来的。头灯的光，只照得到自己的手。\n刚才那张脸——是风。是风吧。');
    S.follow('levF', true); f.ph = 'return'; f.gust = true; levWh = false;
    S.ent('flameF').light = { r: 3.8, col: 'rgba(255,140,50,.36)', flick: true };
    S.goal('起白风了：让列夫照着，把指北针拧到回帐篷的方位，带他回去（两人时：一人看路线卡报方位，一人走）');
    S.timer(Math.max(left ?? 20, 16), tempLabel(S), freeze, { during: true });
    return bearingPad(S);
  }
  async function bearingPad(S) {
    const f = S.f;
    while (f.bear !== 315) {
      const r = await S.keypad('列夫举着手电照着指北针。\n方位环拧到多少度？（三位数）\n帕维尔的路线卡：帐篷 → 雪松，约 135°', ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'], 3);
      if (r == null) { S.toast('过一会儿会再问你；也可以对着列夫按调查键'); S.after(4000, async S => { if (S.f.ph === 'return' && S.f.bear !== 315) return bearingPad(S); }); return; }
      const v = parseInt(r, 10);
      if (v === 315) break;
      D.bw++; S.timerAdd(-6); S.sfx('bad'); S.shake(200, 1);
      const h = v === 135 ? '那是往林子去的方向——是我们下来的方向！'
        : Math.abs(v - 315) <= 12 ? '差一点……风这么大，差几度就摸不到帐篷了。'
          : D.bw <= 1 ? '我们是从帐篷往 135° 走下来的……回去，得反过来吧？'
            : D.bw === 2 ? '反过来，就是转半圈——加一百八十度。'
              : D.bw === 3 ? '指北针上：东是 90，南是 180，西是 270。东南的反面，是西北。'
                : '135 加 180……是 315！';
      await S.say('列夫', [h, '（风灌进领子里。手指更僵了。）']);
    }
    f.bear = 315; S.ent('hudF').s.b = 315; S.sfx('good');
    await S.narr('方位环「咔哒」一声。\n红针稳稳地指着北——你要走的方向，在它左边那一格：西北，315°。\n你盯着它，顶着风，一步一步往回走。');
    S.goal('盯着指北针（315°）走回帐篷，别松开列夫');
  }
  async function levFUse(S) {
    const f = S.f;
    if (f.ph === 'return' && f.bear !== 315) return bearingPad(S);
    if (f.ph === 'return') return S.narr('列夫攥着你的衣角，一声不吭。');
    return S.say('列夫', '……');
  }
  function shove(S) {
    const p = W.pl, m = curMap(), r = Math.random();
    const d = r < .34 ? 2 : r < .68 ? 0 : r < .84 ? 1 : 3, nx = p.x + DIRS[d][0], ny = p.y + DIRS[d][1];
    if (!passable(m, nx, ny, W.pl)) return;
    S.pos(nx, ny); S.shake(150, 1);
    if (S.once('shoveTip')) S.toast('风推得你站不稳——拧好指北针，盯着它走');
  }
  /* 往坡上（左上）推回去几格，落脚点必须能站 */
  function pushBack(S, n) {
    const p = W.pl, m = curMap();
    for (let k = n; k >= 1; k--) for (const [x, y] of [[p.x - k, p.y - k], [p.x - k, p.y], [p.x, p.y - k]]) if (passable(m, x, y, W.pl)) { S.pos(x, y, 3); return; }
  }
  async function lureWarn(S) {
    await S.narr('风在背后推着你，坡越来越陡。\n下面那一点火光，好像近了一点。');
    await S.think('（……再往下，就是林子了。帐篷在上面。）');
    pushBack(S, 2);
  }
  async function lureAsk(S) {
    const r = await S.ask('火光就在下面。不远了。暖和的、橘红色的光。', ['往火光那边走', '回头——帐篷在上面']);
    if (r === 0) return cedarEnd(S, 'field');
    pushBack(S, 3);
  }
  async function backHome(S) {
    const f = S.f; S.clearTimer(); f.ph = 'home'; S.follow('levF', false);
    await S.narr('风里亮起一点昏黄的光。\n是塔尼娅挂在滑雪杖上的马灯。');
    S.place('levF', TENT[0] + 1, TENT[1] + 1, 3);
    await S.say('塔尼娅', '……列夫！');
    await S.say('帕维尔', '回来了。……都回来了。');
    await S.say('列夫', ['……对不起。', '下面什么都没有。我知道。可我刚才，真的看见了火。']);
    await S.say('塔尼娅', '进来。剩下的那一角，挤得下四个人。');
    return dawn(S);
  }
  async function dawn(S) {
    const f = S.f;
    S.norun(false);
    await S.fade(1, 1200);
    await S.card('', '', '你们挤在帐篷剩下的那一角里。\n两个睡袋，四个人，八只脚塞在一起。\n帕维尔一直在数：一、二、三、四。\n数了一整夜。');
    const wx = S.ent('wxF'); wx.s.g = 0; wx.s.lv = 1; S.ent('hudF').s.b = null; S.hide('flameF');
    S.dark(.3); S.plr(null); S.amb('wind');
    S.place('levF', 14, 6, 1); S.place('pavF', 11, 6, 0); S.place('tanF', 15, 5, 1); S.pos(13, 6, 2);
    await S.fade(0, 1200);
    await S.narr('天亮的时候，风停了。\n坡上的雪，被晨光照得发蓝。');
    await S.say('塔尼娅', ['（她指着帐篷。）你看，门口那头。', '雪板塌下来的地方，边缘整整齐齐，像一刀切开的。只压了半顶帐篷。不大……', '可是够了。']);
    await S.narr('你往坡下看。\n林子边上，那棵雪松好好地立着。树底下什么都没有，没有火，也没有人。');
    await S.say('帕维尔', '……下山吧。路过那棵树的时候，停一下。');
    await S.fade(1, 1000);
    await S.card('卷二　终', '', VOL2);
    const tail = '\n\n六十年前那天夜里，他们做的事，换了谁都会做：从一顶正在塌下来的帐篷里出来，往有树、有火的地方去。\n我们只是多知道了六十年。\n多了一根探杆，一本笔记，和后来那么多人一点一点拼出来的几句话。';
    const later = '\n\n第二年夏天，新闻里说，检方的结论是：雪板，加上那天夜里看不见路的风雪。\n有人信，有人不信。塔尼娅看完新闻，什么也没说，把她的探杆记录夹进了相框。';
    const boots = f.boots ? '' : '\n\n（你的脚冻伤了，在伊夫德尔的医院里躺了两个星期。护士说，再晚一个钟头就保不住了。）';
    if (f.photo) return S.end({ id: 'photo', title: '第二十夜　完（最后一张底片）', text: '下山的路上，你们在那棵雪松底下站了很久。谁都没说话。' + tail + boots + later + '\n\n回到叶卡捷琳堡，你把胶卷送去冲洗。\n最后一张底片上，是那道光：一团慢慢张开的、发亮的雾，底下是黑色的山脊。\n——是火箭。你知道是火箭。\n\n冲印店的老人看了很久，问你：「是在那座山上拍的？」\n你说是。\n他把底片还给你，说：「有人讲，他们的最后一张，也是一团光。」\n\n你把这张照片，和帕维尔的路线卡、塔尼娅的探杆记录、列夫的笔记本，放在了一起。' });
    const memo = f.memoPhoto ? '\n\n胶卷冲出来，最后一张是纪念碑：灰白的石头，底下一小团红。\n你把它放大，挂在了门口。' : '';
    return S.end({ id: 'dawn', title: '第二十夜　完', text: '下山的路上，你们在那棵雪松底下站了很久。谁都没说话。' + tail + boots + later + memo + '\n\n第二年二月，你们又上了一次山。\n还是红色的康乃馨，还是双数。' });
  }
  async function cedarEnd(S, from) {
    S.clearTimer(); S.norun(false);
    if (from === 'tent') {
      await S.narr('你们跟着帕维尔，从口子里钻出去，往坡下跑。\n风在背后推着你们。');
      return S.end({ bad: true, id: 'cedar', title: '往雪松那边', text: '一千五百米。白天走二十分钟的路。\n\n雪松底下，火生起来了。很小，一直在冒烟。\n帕维尔说：等天亮，就回去拿衣服。\n\n天一直没有亮。\n\n——后来，有人在那棵树底下，放了一束花。\n\n（帐篷塌了一半，可剩下的那一角还在。衣服在那儿，靴子在那儿。）' });
    }
    S.follow('levF', false);
    await S.narr('你朝那点火光走过去。\n它一直在前面，不远，也不近。');
    return S.end({ bad: true, id: 'cedar', title: '往雪松那边', text: '火光一直在前面。\n你走了很久，久到不觉得冷了。\n\n塔尼娅在坡上喊你们的名字，喊了一夜。\n风把她的声音吹散了。\n\n天亮以后，林子边上什么都没有。没有火，也没有人生过火的痕迹。\n\n（找到列夫以后，就别再往坡下走。回帐篷的方位，在帕维尔的路线卡上。）' });
  }
  function fieldTick(S, dt) {
    const f = S.f, p = W.pl;
    if (S.busy) return;
    if (f.ph === 'search') {
      whT -= dt; if (whT <= 0) { const d = dist(p.x, p.y, LEV[0], LEV[1]); whT = 1.3 + d * .07; SND.whistle(S, clamp(.2 - d * .008, .025, .2)); }
      if (dist(p.x, p.y, LEV[0], LEV[1]) <= 1.6) { S.run(foundLev); return; }
    }
    if (f.ph === 'search' || f.ph === 'return') {
      if (p.x >= 33 && p.y >= 24) { S.run(lureAsk); return; }
      if (p.x >= 30 && p.y >= 21 && !f.lureW) { f.lureW = true; S.run(lureWarn); return; }
    }
    if (f.ph === 'return') {
      if (dist(p.x, p.y, TENT[0], TENT[1]) <= 1.6) { S.run(backHome); return; }
      if (f.bear === 315 && !levWh && dist(p.x, p.y, LEV[0], LEV[1]) >= 5) { levWh = true; S.run(async S => { S.bubble('levF', '…', 1500); await S.say('列夫', '……火在后面。我们是不是走反了？', { style: 'whisper' }); await S.think('（指北针不会骗人。315°。）'); }); return; }
      if (f.gust && f.bear !== 315) { shT -= dt; if (shT <= 0) { shT = 1.15; shove(S); } }
    }
  }
  let whT = 1, shT = 1.2, pulseT = 2, heartT = 1, crT = 0, levWh = false;
  const PANIC_RATE = 2.2, SLAB_T = 14;
  function tentTick(S, dt) {
    const f = S.f, hud = S.ent('hudT');
    if (hud) { const v = f.panicOn ? Math.round(f.panic) : null; if (hud.num !== v) hud.num = v; }
    if (f.ph === 'slab' && S.timerLeft != null) {   // 雪板倒计时：雪墙一直在响，越到后面抖得越厉害
      crT -= dt; if (crT <= 0) { const l = S.timerLeft; crT = Math.max(.45, l / 7); SND.creak(S); S.shake(220, l < 4 ? 2 : 1); }
    }
    if (!f.panicOn || S.busy) return;
    f.panic += PANIC_RATE * dt;
    pulseT -= dt; if (pulseT <= 0) { pulseT = 2.8; SND.hum(S, .09 + f.panic / 900); S.shake(250, f.panic > 70 ? 2 : 1); }
    heartT -= dt; if (heartT <= 0) { heartT = Math.max(.42, 1.6 - f.panic / 75); S.sfx('heart'); }
    if (f.panic >= 100) { f.panicOn = false; S.run(panicEnd); }
    else if (f.panic >= 55 && !f.sawFace) { f.sawFace = true; S.run(faceEv); }
    else if (f.panic >= 80 && !f.warn80) { f.warn80 = true; S.run(warnEv); }
  }

  /* ================= 地图数据 ================= */
  const SNOWLEG = { S: 'snowg', P: 'snowpine', K: 'srock', i: 'ice', ',': 'spath' };
  const WX = (id, lv) => ({ id, x: 0, y: 0, spr: 'snowfx', z: 7, solid: false, s: { lv, g: 0 } });
  const MAPS = {
    /* ---------------- 河谷：林子边（下午三点） ---------------- */
    valley: {
      amb: 'wind', dark: .25, plr: 4, legend: SNOWLEG, tileOpts: { snowC: '#c8d0da' }, darkC: '#141a28',
      rows: valleyRows(),
      ents: [
        { id: 'cedar', x: 19, y: 4, w: 2, spr: 'cedar', on: cedarUse },
        { id: 'labaz', x: 5, y: 7, w: 2, spr: 'labaz', on: cacheUse },
        { id: 'fireV', x: 12, y: 9, spr: 'fire', light: { r: 4, col: 'rgba(255,150,70,.22)', flick: true }, on: N('一小堆篝火，烧的是倒在雪里的枯枝。\n锅里的雪化成水，咕嘟咕嘟地冒泡。') },
        { id: 'logV', x: 11, y: 10, spr: 'logf', on: S => S.note('n_news') },
        { id: 'skisV', x: 16, y: 7, spr: 'skis', on: N('四副木头滑雪板插在雪里。帕维尔坚持用老式的——「跟他们当年一样」。\n绑带是皮的，冻得硬邦邦。') },
        { id: 'holeV', x: 9, y: 14, spr: 'hole', on: N('塔尼娅在冰面上凿的小洞。\n黑色的水在底下流，看不见底。') },
        { id: 'signV', x: 21, y: 13, spr: 'signp', on: N('一块钉在桩子上的木牌：「奥斯皮亚河」。\n字是用烧红的铁丝烫上去的。') },
        { id: 'pavV', x: 15, y: 9, spr: '@pavel', dir: 1, on: pavelV },
        { id: 'tanV', x: 9, y: 13, spr: '@tanya', dir: 0, on: tanyaV },
        { id: 'levV', x: 20, y: 6, spr: '@lev', dir: 3, on: levV },
        { id: 'exV1', x: 13, y: 1, spr: 'invisible', solid: false, touch: valleyExit },
        { id: 'exV2', x: 14, y: 1, spr: 'invisible', solid: false, touch: valleyExit },
        WX('wxV', 1)
      ],
      async enter(S, first) { if (first) { S.goal('去篝火边，跟帕维尔对一下计划'); } }
    },
    /* ---------------- 山坡（傍晚） ---------------- */
    slope: {
      amb: 'wind', dark: .55, plr: 3.4, legend: SNOWLEG, tileOpts: { snowC: '#bec7d2' }, darkC: '#0c1220',
      rows: slopeRows(),
      ents: [
        { id: 'memo', x: 24, y: 4, w: 2, spr: 'memorial', on: memoUse },
        { id: 'pr1', x: 11, y: 8, spr: 'probe', on: S => probeUse(S, 'pr1') },
        { id: 'pr2', x: 12, y: 8, spr: 'probe', on: S => probeUse(S, 'pr2') },
        { id: 'pr3', x: 13, y: 8, spr: 'probe', on: S => probeUse(S, 'pr3') },
        { id: 'tentS', x: 11, y: 8, w: 3, spr: 'tentX', hidden: true, s: { lit: true }, light: { r: 2.4, col: 'rgba(255,190,110,.18)' }, on: S => S.go('tent', 1, 4, 2) },
        { id: 'skisS', x: 8, y: 9, spr: 'skis', on: N('滑雪板插在雪里，排成一排。\n风把雪吹得在板子背后堆成了一个个小尖。') },
        { id: 'pavS', x: 16, y: 11, spr: '@pavel', dir: 3, on: S => S.say('帕维尔', S.f.flowers ? (S.f.probeTold ? '天要黑了。快点。' : '塔尼娅非要先探雪。……让她探吧。') : '纪念碑在右上边。去吧，我们在这儿等。') },
        { id: 'tanS', x: 10, y: 10, spr: '@tanya', dir: 3, on: tanyaS },
        { id: 'levS', x: 18, y: 9, spr: '@lev', dir: 2, on: S => S.say('列夫', S.f.flowers ? '听——风绕过那排石头的声音。像有人在吹空瓶子。' : '风速表已经过了十五米每秒。还在往上涨。') },
        { id: 'exS', x: 15, y: 19, spr: 'invisible', solid: false, touch: async S => { await S.say('帕维尔', '天快黑了，别往回走！'); return S.walk('pl', 'u', 4); } },
        WX('wxS', 1)
      ],
      enter: slopeEnter
    },
    /* ---------------- 帐篷里：上 = 靠坡那面（雪墙），左 = 门口（西头），右 = 最里头 ---------------- */
    tent: {
      amb: 'wind', dark: .72, plr: 3, speed: .8, legend: { Z: 'swall', U: 'cvt', D: 'cvb', E: 'cve', f: 'tfloor', X: 'sfill' }, darkC: '#06070c',
      rows: tentRows(),
      ents: [
        { id: 'doorT', x: 0, y: 4, spr: 'tdoor', on: doorUse },
        { id: 'lampT', x: 5, y: 1, spr: 'lampH', light: { r: 4.6, col: 'rgba(255,190,110,.22)', flick: true }, on: N('马灯挂在支杆上，火苗拧到了最小。\n灯罩上结着一层细细的霜。') },
        { id: 'instrT', x: 10, y: 1, spr: 'instr', on: instrUse },
        { id: 'bulgeT', x: 1, y: 1, w: 12, spr: 'bulge', solid: false, z: 1, s: { k: 0 } },
        { id: 'glowT', x: 1, y: 1, w: 12, h: 6, spr: 'glowc', solid: false, z: 2, hidden: true, light: { r: 7, col: 'rgba(255,140,60,.2)', dx: 96, dy: 48 } },
        { id: 'levB', x: 2, y: 2, h: 2, spr: 'sbag', col: '#4a6a3a', on: S => bagUse(S, 'lev') },
        { id: 'pavB', x: 4, y: 2, h: 2, spr: 'sbag', col: '#4a3a30', on: S => bagUse(S, 'pav') },
        { id: 'tanB', x: 6, y: 2, h: 2, spr: 'sbag', col: '#d8d0c0', on: S => bagUse(S, 'tan') },
        { id: 'myB', x: 8, y: 2, h: 2, spr: 'sbag', col: '#a85a20', on: myBag },
        { id: 'recT', x: 3, y: 2, spr: 'recorder', on: N('列夫的录音机，接着一个低频传声器。\n磁带在转。表头的指针在最左边轻轻地抖。') },
        { id: 'levNoteT', x: 1, y: 3, spr: 'notebook', hidden: true, on: S => S.note('n_lev') },
        { id: 'bootsT', x: 1, y: 5, spr: 'boots', on: bootsUse },
        { id: 'thermT', x: 12, y: 5, spr: 'thermos', on: N('一个绿色的保温壶。里面的茶还温着。\n帕维尔说，后半夜再喝。') },
        { id: 'packT', x: 12, y: 2, spr: 'packs', on: N('四个背包堆在最里头。帆布上结着霜。') },
        { id: 'levP', x: 3, y: 5, spr: '@lev', dir: 3, on: S => personUse(S, 'lev') },
        { id: 'pavP', x: 5, y: 5, spr: '@pavel', dir: 3, on: S => personUse(S, 'pav') },
        { id: 'tanP', x: 7, y: 5, spr: '@tanya', dir: 3, on: S => personUse(S, 'tan') },
        { id: 'slitT', x: 13, y: 4, spr: 'slit', solid: false, hidden: true, touch: slitUse },
        { id: 'skyT', x: 6, y: 3, spr: 'skyv', solid: false, hidden: true, z: 9 },
        { id: 'hudT', x: 0, y: 0, spr: 'hud', z: 8, solid: false }
      ],
      tick: tentTick,
      enter: tentEnter
    },
    /* ---------------- 雪原：夜（左上是帐篷，右下是林子和雪松） ---------------- */
    field: {
      amb: 'wind', dark: .9, plr: 2.4, speed: .85, legend: SNOWLEG, tileOpts: { snowC: '#b4bdc9', diag: true }, darkC: '#0a0e18', wxDark: '#0a0e18',
      rows: fieldRows(),
      ents: [
        { id: 'tentF', x: 10, y: 5, w: 3, spr: 'tentX', s: { flat: true, cut: true }, on: N('帐篷塌了大半边。帕维尔和塔尼娅跪在雪里，用饭盒一下一下地刨。') },
        { id: 'lampF', x: 13, y: 4, spr: 'polelamp', light: { r: 2.8, col: 'rgba(255,190,110,.24)', flick: true }, on: N('塔尼娅把马灯挂在了滑雪杖上。\n风里，那一点黄光一直在晃。') },
        { id: 'pavF', x: 9, y: 6, spr: '@pavel', dir: 3, on: S => S.say('帕维尔', S.f.ph === 'home' ? '……一、二、三、四。' : '快去！我们在这儿挖！') },
        { id: 'tanF', x: 11, y: 6, spr: '@tanya', dir: 3, on: S => S.say('塔尼娅', S.f.ph === 'home' ? '……回来了就好。' : '顺着脚印！看不见了就听哨子！别往林子去！') },
        ...PRINTS.map(([x, y], i) => ({ id: 'pf' + i, x, y, spr: 'prints', decal: true, solid: false, alpha: printAlpha(i), hidden: printAlpha(i) <= 0 })),
        { id: 'levF', x: LEV[0], y: LEV[1], spr: '@lev', dir: 0, light: { r: 1.8, col: 'rgba(255,240,200,.16)' }, on: levFUse },
        { id: 'cedarF', x: 37, y: 25, w: 2, spr: 'cedar', on: N('那棵老雪松。离地四五米以下，没有一根活枝。\n树底下黑黢黢的。没有火，也没有人。') },
        { id: 'flameF', x: 36, y: 26, spr: 'flame', solid: false, light: { r: 2.4, col: 'rgba(255,140,50,.3)', flick: true } },
        { id: 'hudF', x: 0, y: 0, spr: 'hud', z: 8, solid: false },
        WX('wxF', 2)
      ],
      tick: fieldTick,
      enter: fieldEnter
    }
  };

  /* ================= 章节 ================= */
  const hoodTrim = c => (g, d, fr, G, R) => { if (d === 0) { R(3, G.hT - 1, 10, 1, c); R(3, G.hT, 1, 7, c); R(12, G.hT, 1, 7, c); } else if (d === 1) { R(4, G.hT - 1, 8, 1, c); R(4, G.hT, 1, 6, c); } };
  defChapter({
    id: 'dyatlov', n: 20, title: '迪亚特洛夫山口', sub: '那天夜里，九个人从里面割开帐篷，走进了风雪。六十年后，你们在同一片坡上，扎下同一种帐篷。', origin: '苏联乌拉尔山 · 1959 年真实事件', color: '#2c3a50',
    amb: 'wind', floor: 'wood', wall: 'plain', dark: .6, plr: 3.2,
    endings: { dawn: '第二十夜　完', photo: '最后一张底片（隐藏）', cedar: '往雪松那边', panic: '割开帐篷' },
    thumb(g, w, h) {   // 夜里的雪坡：一顶从里面割开的帐篷，脚印一路往坡下，林子边一棵雪松、一点火光
      const P = (c, x, y, ww, hh) => { g.fillStyle = c; g.fillRect(x, y, ww, hh); };
      g.fillStyle = '#26303f'; g.beginPath(); g.moveTo(0, 30); g.lineTo(30, 20); g.lineTo(58, 26); g.lineTo(100, 10); g.lineTo(160, 28); g.lineTo(160, 90); g.lineTo(0, 90); g.fill();
      g.fillStyle = '#b8c2cf'; g.beginPath(); g.moveTo(0, 36); g.lineTo(160, 64); g.lineTo(160, 90); g.lineTo(0, 90); g.fill();
      g.fillStyle = '#dbe2ea'; g.beginPath(); g.moveTo(0, 36); g.lineTo(160, 64); g.lineTo(160, 67); g.lineTo(0, 40); g.fill();
      P('#a89878', 34, 38, 34, 9); P('#c0b090', 34, 36, 34, 3); P('#7e7054', 50, 35, 2, 12); P('#e2e8ef', 32, 33, 38, 3);   // 帐篷
      P('#05070c', 63, 37, 3, 10); P('#d8c8a6', 62, 38, 1, 8); P('#d8c8a6', 66, 39, 1, 7);                                 // 割开的口子
      for (let i = 0; i < 11; i++) P('rgba(60,72,92,.8)', 70 + i * 7 + (i % 2) * 2, 48 + i * 2.4 + (i % 2), 2, 2);           // 往坡下的脚印
      P('#0d1a14', 138, 50, 10, 6); P('#0d1a14', 135, 56, 16, 7); P('#0d1a14', 137, 63, 12, 6); P('#1e140c', 141, 68, 4, 12);   // 雪松
      P('#f0a040', 132, 76, 3, 3); P('#ffe08a', 133, 75, 1, 2); g.fillStyle = 'rgba(255,150,60,.18)'; g.beginPath(); g.arc(133, 77, 9, 0, 7); g.fill();
      for (let i = 0; i < 70; i++) { g.fillStyle = `rgba(240,246,252,${.35 + hash(i, 9, 20) * .5})`; g.fillRect((hash(i, 1, 20) * w) | 0, (hash(i, 2, 20) * h) | 0, hash(i, 3, 20) < .3 ? 2 : 1, 1); }
      for (let i = 0; i < 6; i++) { g.fillStyle = 'rgba(220,230,240,.12)'; g.fillRect(0, 14 + i * 12, w, 1); }
    },
    people: {
      me: { key: 'dy-me', skin: '#eccaa8', hair: '#5a3a24', hs: 'short', top: '#c8742a', top2: '#e8e0d0', bottom: '#2a3040', shoes: '#5a4a3a', coat: true, hat: 'hood', hatC: '#a85a20', extra: hoodTrim('#e8e0d0') },
      pavel: { key: 'dy-pav', skin: '#e0b494', hair: '#4a3020', hs: 'short', top: '#7a2a2a', top2: '#d8d0c0', bottom: '#2a2a34', shoes: '#4a3a2a', coat: true, hat: 'hood', hatC: '#4a3a30',
        extra(g, d, fr, G, R) { hoodTrim('#c8bca8')(g, d, fr, G, R); if (d === 0) { R(5, G.hT + 5, 6, 3, '#6a4a2c'); R(6, G.hT + 8, 4, 1, '#6a4a2c'); R(7, G.hT + 6, 2, 1, '#3a2014'); } else if (d === 1) R(4, G.hT + 5, 4, 3, '#6a4a2c'); } },
      tanya: { key: 'dy-tan', skin: '#f2d2b8', hair: '#d8b870', hs: 'long', top: '#2a5a8a', top2: '#e8e8e8', bottom: '#2a2a3a', shoes: '#4a3a2a', coat: true, hat: 'scarf', hatC: '#d8d0c0', blush: '#e8a0a0' },
      lev: { key: 'dy-lev', skin: '#e8c4a4', hair: '#2a2420', hs: 'messy', top: '#4a6a3a', top2: '#d0d0c0', bottom: '#2a2e2a', shoes: '#3a3028', coat: true, hat: 'hood', hatC: '#3a5030',
        extra(g, d, fr, G, R) { hoodTrim('#b8b8a8')(g, d, fr, G, R); if (d === 0) { R(5, G.hT + 4, 2, 1, '#9ab4c8'); R(9, G.hT + 4, 2, 1, '#9ab4c8'); R(7, G.hT + 4, 2, 1, '#2a2a2a'); R(5, G.hT + 3, 2, 1, '#2a2a2a'); R(9, G.hT + 3, 2, 1, '#2a2a2a'); } else if (d === 1) { R(5, G.hT + 4, 2, 1, '#9ab4c8'); R(7, G.hT + 4, 3, 1, '#2a2a2a'); } } }
    },
    items: {
      camera: { name: '胶片相机', desc: '一台老「佐尔基」旁轴相机。胶卷还剩最后一张——你一直舍不得按。' },
      flowers: { name: '红康乃馨', desc: '一捧红色的康乃馨，用报纸包着，已经冻得硬邦邦的。\n按俄罗斯的规矩，给逝者的花要双数。' },
      probe: { name: '雪崩探杆', desc: '塔尼娅的探杆，三米长，一节一节拧起来。插进雪里，手能感觉到哪一层硬、哪一层空。' },
      compass: { name: '指北针', desc: '帕维尔的指北针，带一圈能拧的方位环。\n红针指北；方位从北开始顺时针数：东 90°，南 180°，西 270°。' }
    },
    notes: {
      n_route: { title: '帕维尔的路线卡', text: '（一张塑封的卡片，帕维尔用铅笔写得密密麻麻。）\n\n2019 年 2 月 1 日　复刻路线\n· 上午：沿奥斯皮亚河谷上行，到林子边\n· 在林子边搭存储仓：多余的口粮、备用滑雪板留下\n· 下午：上霍拉特-西亚赫尔山东坡，去纪念碑献花\n· 傍晚：在坡上扎营——帆布帐篷、毡靴、木头滑雪板，和他们当年一样\n· 2 月 2 日：下山，取仓，回伊夫德尔\n\n坡上营地 → 林子边那棵大雪松：\n方位约 135°（东南），一千五百米。\n\n（下面用红笔补了一行：夜里谁也不许一个人出帐篷。）' },
      n_news: { title: '列夫的剪报夹', text: '（夹子里是几张打印的新闻，边角都翻毛了。）\n\n【2019 年 2 月】据报道，俄罗斯检察机关宣布，将重新核查 1959 年乌拉尔山登山队遇难一事。核查只考虑三种自然原因：雪崩、雪板、飓风。\n（列夫在空白处写：「次声呢？」）\n\n【流传的说法——列夫自己抄的】\n· 帐篷是从里面割开的。\n· 大部分靴子和外衣留在帐篷里。\n· 坡上的脚印一直往下，通向林子边。\n· 有人说那天夜里天上有火球；有人说是军队在试什么；有人说是雪人。\n· 有人说，他们相机里的最后一张底片，是一团光。\n\n（最底下一行，划掉了又重写：别猎奇。他们是九个人，不是九个谜。）' },
      n_probe: { title: '塔尼娅的探杆记录', text: '（塔尼娅把读数写在手套背面，进帐篷后抄进了本子。）\n\n营地：东坡，坡度约 25°。\n门开在西头——背风，风灌不进来。\n\n探杆读数（从门口往里）：\n① 门口那头：硬雪板约 60 厘米；再往下一捅就空——松散的深霜层，像一袋砂糖。\n② 中间：硬雪板约 40 厘米，底下也是空的。\n③ 最里头：只有 20 厘米，底下压得实实的。\n\n备注：\n· 风把雪从山谷那边搬上来，堆在背风的地方。背风的那头，雪板最厚。\n· 我们挖平台的时候，靠坡那面切出了一人高的雪墙——等于把雪板的「脚」切掉了。\n· 雪板要是塌，先压的是雪最厚的那头，和靠坡的那半边。\n\n（最后一行写得很用力：今晚别睡死。）' },
      n_lev: { title: '列夫的笔记本', text: '（字越写越歪。）\n\n设备：便携录音机＋低频传声器，下限 1 赫兹。\n\n22:40　东风，18 米每秒。山脊那排石头后面有涡流（卡门涡街？）。\n23:05　读数：15–20 赫兹，一阵一阵，间隔两三秒。耳朵听不见，胸口听得见。\n23:10　心率 130。手在抖。有资料说 19 赫兹附近会让人看见视野边上的影子。\n23:12　帐篷布外面有一张脸。\n23:30　风向偏北了。读数掉了下去。脸也没了。\n\n（另起一行，是塔尼娅的字：数字是实的。脸不是。）' }
    },
    legend: '1959 年 1 月底，一支以乌拉尔工学院学生和毕业生为主的十人滑雪登山队从斯维尔德洛夫斯克（今叶卡捷琳堡）出发，计划穿越北乌拉尔、登上奥托滕山。途中一名队员因病折返，成了唯一的生还者。2 月 1 日，其余九人在奥斯皮亚河上游的林子边搭了存储仓，傍晚在霍拉特-西亚赫尔山（曼西语，常被译作「死山」）的东坡上挖开积雪，扎下帐篷，此后再无音讯。2 月下旬，搜救队在坡上找到了帐篷：帐篷被从里面割开，大部分靴子和外衣留在里面，雪地上的脚印一直通向坡下一公里多外的林子边。九人在之后的几个月里陆续被找到，都已遇难。1959 年 5 月，调查以「不可抗拒的自然力量」结案。后来，那道山口以这支队伍队长的姓氏命名。\n\n因为留下的疑点太多，六十年来众说纷纭：雪崩（反对者说坡度不够陡、也没看到明显的雪崩痕迹）；山脊上的风形成「卡门涡街」、产生让人恐慌的次声（2010 年代流行起来的说法）；军方的武器或火箭试验（据说那年 2 月中旬和 3 月底，附近有人看到天上的发光球体，后来常被认为是导弹发射的尾焰）；还有放射性污染、曼西猎人（很早就被排除）、雪人、外星人、队员内讧……「他们相机里的最后一张底片是一团光」之类的说法也流传甚广，真伪一直有争议。\n\n2019 年 2 月，俄罗斯检方宣布重新核查此案，只考虑雪崩、雪板和飓风三种自然原因；2020 年 7 月公布的结论是：一场雪崩（雪板）加上极差的能见度，迫使队员离开帐篷，最终在严寒中遇难。2021 年，瑞士的研究者在《通讯—地球与环境》上发表模拟研究，认为在坡上切出平台、再加上夜里下坡风不断堆积的积雪，足以在几个小时后引发一次小规模的雪板滑落——不大，却足以压塌帐篷的一部分。也有遇难者亲属和研究者至今不接受这个结论。如今山口附近立着纪念碑，每年都有人上山献花。\n\n（本章中的「你」、帕维尔、塔尼娅、列夫，以及 2019 年 2 月 1 日的「复刻」登山，均为游戏虚构，不对应任何真实人物；真实遇难者的姓名没有出现在游戏中。探杆读数、门开在背风的一头、那一夜的次声和「风里的脸」、天上的火箭光、凌晨雪板塌下的时刻与位置、「帐篷正确的一侧」、指北针的方位、坡下林子边的火光，也都是游戏虚构。游戏把几种流行的解释做成了可以感觉到的现象，并不代表 1959 年那一夜真正发生了什么。）',
    start: { map: 'valley', x: 14, y: 10, dir: 3 },
    faces: FACES,
    resume: {
      panic: async S => { const f = S.f; f.panic = 30; f.sawFace = false; f.warn80 = false; S.amb('wind'); await S.think('（深呼吸。叫醒塔尼娅、看一眼温度计、握住列夫的手。）'); f.panicOn = true; },
      slab: async S => { S.amb('wind'); S.ent('bulgeT').s.k = 1; S.hidePlayer(false); return startSlab(S); },
      choice: async S => { S.amb('wind'); return choice(S); },
      out: async S => {
        S.amb('wind');
        await S.think(D.out ? '（顺着脚印，听哨子。找到他以后看指北针——回帐篷要反过来。别往火光那边去。）' : '（……快。）');
        startOut(S);
      }
    },
    async intro(S) {
      D.slab = D.out = D.bw = 0;
      S.give('camera', true);
      await S.card('第二十夜　迪亚特洛夫山口', '2019年2月1日　北乌拉尔　奥斯皮亚河谷', '六十年前的这一天，九个人在这座山的东坡上搭起了帐篷。\n那天夜里，他们从里面割开帐篷，走进了零下二十几度的风雪，再也没有回来。\n\n我们是来给他们献花的。\n帕维尔说，还要在同一片坡上，过同一个夜。');
    },
    tick(S, dt) {
      const m = curMap(), p = W.pl;
      for (const e of m.ents) if (e.id && (e.id[0] === 'w' && e.id[1] === 'x' || e.id.startsWith('hud'))) { e.px = p.px; e.py = p.py; e.x = p.x; e.y = p.y; }
    },
    sprites: SPRITES,
    tiles: TILES,
    maps: MAPS
  });
})();
