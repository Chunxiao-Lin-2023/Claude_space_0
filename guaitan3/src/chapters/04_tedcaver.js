/* ================= 第四夜 · 泰德的洞穴 ================= */
(() => {
  /* ---------------- 常量与运行态 ---------------- */
  const HARD = [0, 3, 3, 4, 4, 4, 5];          // 六段石缝各要凿几下
  const SEGX = k => 20 + k;                     // 第 k 段石缝的 x（y 固定为 6）
  const CRAWL = .5;                             // 缝里爬行的速度倍率
  const CHASE_SPD = 3.0, WIND_DRAG = .75;        // 追逐者速度（格/秒）、逆风时玩家速度倍率
  const AIR_STEP = 1.6;                          // 缝深处不吹风时，每隔几秒少一格空气
  const STA_MAX = 5, AIR_MAX = 5;
  const KEYS = ['手', '螺旋', '叉', '眼', '弯月', '抓痕'];
  const ANS = '弯月-眼-螺旋-手';                // 从最里面开始：最后凿下来的封石最先塞回去
  const STONE = { 1: ['st_hand', '手'], 2: ['st_spiral', '螺旋'], 4: ['st_eye', '眼'], 5: ['st_moon', '弯月'] };
  const WCYC = {
    pulse: [['out', 2.4], ['calm', 1.6]],
    breath: [['out', 3.2], ['calm', 1.2], ['in', 3.2], ['calm', 1.2]],
    breath3: [['out', 2.6], ['calm', 1.0], ['in', 2.8], ['calm', 1.0]]
  };
  let WT = 0, PH = '', STA_T = 0, AIR_T = 0, SCR_T = 0, FLK = 0, WIND_T = 0;
  let SEAL_LEFT = null;      // 封缝倒计时剩余（死亡重来后不回满：取剩余与下限的较大者）
  let FLEE_DIED = 0, ROPE_DIED = 0, SEAL_DIED = 0;

  /* ---------------- S.tone 合成的关键音效 ---------------- */
  const SND = {
    strike(S) { S.tone('triangle', 2200, 1750, .07, .07); S.tone('square', 190, 90, .1, .05, 0, 900); },
    windOut(S, k) { S.tone('sawtooth', 74, 56, 2.6, .03 * k, 0, 260); S.tone('sine', 150, 118, 2.4, .022 * k, .1, 700); },
    windIn(S, k) { S.tone('sawtooth', 50, 84, 2.6, .032 * k, 0, 300); S.tone('sine', 110, 170, 2.4, .02 * k, .15, 700); },
    thump(S, n, v) { for (let i = 0; i < n; i++) S.tone('sine', 64, 38, .38, v || .16, i * .62, 320); },
    scream(S) { S.tone('sawtooth', 820, 360, 1.7, .05, 0, 2400); S.tone('sawtooth', 836, 372, 1.7, .03, .04, 1600); S.tone('sine', 410, 190, 1.8, .03, .1); },
    scrape(S, d, v) { S.tone('sawtooth', 48, 43, d, .06 * (v || 1), 0, 420); S.tone('square', 96, 86, d, .02 * (v || 1), .05, 300); },
    whine(S) { S.tone('sine', 880, 1380, .32, .05); S.tone('sine', 1320, 760, .55, .05, .34); },
    growl(S) { S.tone('sawtooth', 92, 78, .9, .05, 0, 520); },
    modem(S) { [1200, 2200, 1200, 2400, 980, 1650, 2100, 1300].forEach((f, i) => S.tone('square', f, f, .11, .025, i * .12, 3200)); S.tone('sawtooth', 1800, 600, .9, .02, 1.0, 2600); },
    seal(S, i) { S.tone('sine', 196 - i * 18, 180 - i * 18, .5, .08, 0, 900); S.tone('triangle', 98 - i * 9, 90 - i * 9, .7, .05, .05, 500); }
  };
  function windSound(S, ph, mode) {
    const k = (mode === 'steady' ? .7 : mode === 'breath3' || mode === 'suck' ? 1.25 : 1) * (.75 + (S.f.seg || 0) * .08);
    if (ph === 'out') SND.windOut(S, k); else if (ph === 'in') SND.windIn(S, k);
  }
  function windPhase(mode, t) {
    if (mode === 'steady') return 'out';
    if (mode === 'dead' || !mode) return 'dead';
    if (mode === 'suck') return 'in';
    const c = WCYC[mode], P = c.reduce((a, b) => a + b[1], 0); let x = t % P;
    for (const [p, d] of c) { if (x < d) return p; x -= d; }
    return 'calm';
  }
  function setWind(S, ph) {
    for (const id of ['tape', 'seg1', 'seg2', 'seg3', 'seg4', 'seg5', 'seg6']) { const e = S.ent(id); if (e) e.s.ph = ph; }
  }
  function airFx(S) { S.plr(1.5 + (S.f.air ?? AIR_MAX) * .3); }

  /* ---------------- 人物 ---------------- */
  const helmet = (col, lamp) => (g, d, fr, G, R) => {
    const h = G.hT;
    if (d === 0) { R(3, h - 1, 10, 3, col); R(4, h - 2, 8, 1, col); R(3, h + 1, 10, 1, shade(col, -.35)); R(7, h - 1, 2, 2, lamp); }
    else if (d === 3) { R(3, h - 1, 10, 3, col); R(4, h - 2, 8, 1, col); R(3, h + 1, 10, 1, shade(col, -.35)); R(7, h, 2, 1, '#222'); }
    else { R(3, h - 1, 10, 3, col); R(4, h - 2, 8, 1, col); R(2, h + 1, 11, 1, shade(col, -.35)); R(2, h, 2, 2, lamp); }
  };
  const PEOPLE_T = {
    me: { key: 'tc-me', skin: '#efc8a2', hair: '#6a4628', hs: 'short', top: '#c8621e', top2: '#8a3e10', bottom: '#b0561a', shoes: '#3a2a1a',
      extra(g, d, fr, G, R) { helmet('#e8e4d8', '#fff2b0')(g, d, fr, G, R); if (d === 0) R(4, G.tT + 3, 8, 1, '#2a2a2a'); } },
    bud: { key: 'tc-bud', skin: '#e2b48e', hair: '#3a2a1e', hs: 'short', top: '#3a5a8a', top2: '#2a3a5a', bottom: '#2a3a5a', shoes: '#2a2018',
      extra(g, d, fr, G, R) { helmet('#d8b028', '#fff2b0')(g, d, fr, G, R); if (d === 0) { R(5, G.hT + 5, 6, 2, '#3a2a1e'); R(6, G.hT + 7, 4, 1, '#3a2a1e'); } else if (d === 1) R(4, G.hT + 5, 3, 3, '#3a2a1e'); } },
    /* 圆石后面的东西：没有眼睛，一张圆圆的、张开的嘴，胳膊长到地上 */
    it: { key: 'tc-it', big: true, skin: '#b4b0a6', hair: '#b4b0a6', hs: 'bald', top: '#8a867c', top2: '#6a665e', robe: true, noFeet: true, bottom: '#8a867c', eye: '#b4b0a6', mouth: '#b4b0a6', ghost: true,
      extra(g, d, fr, G, R) {
        const h = G.hT;
        if (d === 0) { R(4, h + 1, 8, 4, '#b4b0a6'); R(5, h + 3, 2, 1, '#7a766e'); R(9, h + 3, 2, 1, '#7a766e'); R(6, h + 4, 4, 3, '#050404'); R(7, h + 4, 2, 1, '#1a1210'); R(10, h, 1, 3, '#6a665e'); R(5, h - 1, 1, 2, '#6a665e'); }
        else if (d === 1) { R(3, h + 4, 3, 3, '#050404'); R(8, h, 1, 3, '#6a665e'); }
        else if (d === 3) { R(7, h + 1, 1, 4, '#6a665e'); }
        R(2, G.tT + 1, 1, 14, '#c8c4ba'); R(13, G.tT + 1, 1, 14, '#c8c4ba'); R(1, G.tT + 14, 2, 1, '#d8d4ca'); R(13, G.tT + 14, 2, 1, '#d8d4ca'); R(0, G.tT + 15, 1, 1, '#d8d4ca'); R(15, G.tT + 15, 1, 1, '#d8d4ca');
      } }
  };

  /* ---------------- 惊吓大头像 ---------------- */
  const FACES_T = {
    /* 石头一样的灰脸、裂纹、两块光溜溜的凹陷（没有眼睛）、一张越张越大的圆嘴，嘴里往外喷灰 */
    it(R, a, t) {
      const K = '#060505', S1 = '#8e8a82', S2 = '#6e6a62', S3 = '#a8a49a', CR = '#3a3732';
      R(0, 0, 32, 32, '#0a0908');
      R(9, 1, 14, 3, S2); R(6, 3, 20, 24, S1); R(4, 7, 24, 16, S1); R(8, 27, 16, 3, S2); R(23, 4, 3, 22, S2); R(6, 5, 3, 10, S3);
      R(12, 4, 1, 5, CR); R(13, 8, 1, 3, CR); R(14, 10, 2, 1, CR); R(21, 6, 1, 4, CR); R(20, 9, 1, 3, CR); R(7, 18, 2, 1, CR); R(24, 19, 1, 4, CR);
      R(8, 10, 6, 4, S2); R(18, 10, 6, 4, S2); R(9, 11, 4, 2, '#5a564e'); R(19, 11, 4, 2, '#5a564e');   // 眼睛的位置只有两块凹陷
      const r = 3 + Math.round(a * 4), cx = 16, cy = 20;
      for (let y = -r; y <= r; y++) { const w = Math.round(Math.sqrt(r * r - y * y)); R(cx - w, cy + y, w * 2, 1, K); }
      R(cx - r - 1, cy - 1, 1, 2, CR); R(cx + r, cy - 1, 1, 2, CR);
      if (a > .2) for (let i = 0; i < 9; i++) { const s = (t * 30 + i * 7) % 14; R(cx - 1 + Math.round(Math.sin(i * 2.1) * s * .6), cy + r + Math.round(s * .4) - 2, 1, 1, 'rgba(200,190,170,.8)'); }
      R(0, 23, 4, 9, S2); R(1, 20, 2, 4, S2); R(28, 23, 4, 9, S2); R(29, 20, 2, 4, S2);   // 两只扒在边上的长手指
    }
  };

  /* ---------------- 瓦片 ---------------- */
  const TILES_T = {
    cfl: { solid: false, paint(R, X, Y) { speck(R, '#3a3128', ['#463b30', '#2e2720', '#51453a'], X, Y, 18, 41); if (hash(X, Y, 43) < .18) R(4, 9, 5, 2, '#2a231c'); } },
    ccr: { solid: false, paint(R, X, Y) { speck(R, '#2c251f', ['#352d25', '#221c17'], X, Y, 12, 44); R(0, 0, 16, 3, '#17130f'); R(0, 13, 16, 3, '#17130f'); R(0, 3, 16, 1, '#3e352c'); } },
    cbo: { solid: true, paint(R, X, Y) { TILES_T.cfl.paint(R, X, Y); R(2, 4, 12, 10, '#4a4036'); R(3, 3, 9, 3, '#5a4f43'); R(4, 5, 4, 2, '#6a5e50'); R(2, 12, 12, 2, '#2a241e'); } },
    scr: { solid: false, paint(R, X, Y) { speck(R, '#40372d', ['#4e443a', '#332b23', '#5a4e42'], X, Y, 22, 45); for (let i = 0; i < 3; i++) R(2 + i * 5, 2 + i * 4, 4, 1, '#2a231c'); } },
    hdr: { solid: false, paint(R, X, Y) { speck(R, '#5a4834', ['#6a5640', '#4a3a2a', '#725e46'], X, Y, 16, 46); } },
    hsd: { solid: false, paint(R, X, Y) { speck(R, '#7a6a50', ['#8a7a5e', '#6a5a42'], X, Y, 14, 47); } },
    jun: { solid: true, paint(R, X, Y) { TILES_T.hdr.paint(R, X, Y); const c = '#1e2e1c'; R(2, 3, 12, 10, c); R(3, 2, 10, 12, c); R(4, 4, 5, 3, '#2c4228'); R(9, 8, 4, 3, '#16241a'); R(7, 13, 2, 3, '#3a2a1a'); } },
    hbo: { solid: true, paint(R, X, Y) { TILES_T.hdr.paint(R, X, Y); R(2, 5, 12, 9, '#6a5e52'); R(3, 4, 9, 2, '#7a6e60'); R(4, 6, 4, 2, '#8a7e70'); R(2, 12, 12, 2, '#3a3028'); } }
  };

  /* ---------------- 符号（5×5 像素） ---------------- */
  const GLYPH = {
    手: ['10101', '10101', '11111', '01110', '01110'],
    螺旋: ['11111', '10001', '10101', '10111', '10000'],
    叉: ['10001', '01010', '00100', '01010', '10001'],
    眼: ['01110', '10001', '10101', '10001', '01110'],
    弯月: ['01110', '11000', '10000', '11000', '01110'],
    抓痕: ['10101', '10101', '10101', '10101', '10101']
  };
  function glyph(R, sym, x, y, col, s) { const G = GLYPH[sym]; if (!G) return; s = s || 1; for (let j = 0; j < 5; j++) for (let i = 0; i < 5; i++) if (G[j][i] === '1') R(x + i * s, y + j * s, s, s, col); }
  function stickman(R, x, y, col, lying) { if (lying) { R(x, y + 3, 5, 1, col); R(x - 1, y + 2, 1, 1, col); } else { R(x + 1, y, 1, 1, col); R(x + 1, y + 1, 1, 3, col); R(x, y + 2, 3, 1, col); R(x, y + 4, 1, 1, col); R(x + 2, y + 4, 1, 1, col); } }

  /* ---------------- 精灵 ---------------- */
  const SPR_T = {
    seam(g, e, t, R) {
      if (e.rub) {   // 凿下来的碎石堆
        R(1, 6, 14, 9, '#3a3128'); for (let i = 0; i < 7; i++) R(1 + (i * 5) % 12, 5 + (i * 3) % 7, 4, 3, i % 2 ? '#5a4e42' : '#4a4036');
        R(2, 13, 12, 2, '#1e1914'); return;
      }
      R(0, -3, 16, 19, '#3c342b'); R(0, -3, 16, 2, '#4c4236'); R(13, -1, 3, 17, '#2c251e'); R(2, 1, 5, 3, '#4e4438'); R(8, 10, 4, 3, '#463c31');
      R(0, 7, 16, 2, '#0b0907'); R(5, 6, 3, 1, '#0b0907'); R(10, 9, 4, 1, '#0b0907');
      const k = e.k || 0;
      if (k > 0) { R(3, 2, 1, 5, '#16120e'); R(4, 9, 1, 4, '#16120e'); }
      if (k > 1) { R(9, 1, 1, 6, '#16120e'); R(11, 9, 1, 5, '#16120e'); R(6, 4, 3, 1, '#16120e'); }
      if (k > 2) { R(1, 4, 14, 1, '#16120e'); R(2, 12, 12, 1, '#16120e'); }
      if (k > 3) { R(7, -2, 1, 16, '#16120e'); }
      const ph = e.ph;
      if (ph === 'out' || ph === 'in') for (let i = 0; i < 5; i++) {
        const s = (t * (ph === 'out' ? 22 : 18) + i * 9) % 18, x = ph === 'out' ? 16 - s : s - 2;
        R(x, 7 + ((i * 3) % 3) - 1, 1, 1, 'rgba(200,185,160,.7)');
      }
    },
    tape(g, e, t, R) {
      if (e.mark) { R(3, 3, 1, 1, '#d8d0c0'); R(4, 4, 1, 1, '#d8d0c0'); R(5, 5, 1, 1, '#d8d0c0'); R(6, 6, 1, 1, '#d8d0c0'); R(7, 7, 1, 1, '#d8d0c0'); R(7, 3, 1, 1, '#d8d0c0'); R(6, 4, 1, 1, '#d8d0c0'); R(4, 6, 1, 1, '#d8d0c0'); R(3, 7, 1, 1, '#d8d0c0'); }
      R(10, 11, 3, 3, '#4a4036'); R(11, 12, 2, 2, '#ff7a1a');
      const L = e.torn ? 5 : 10, ph = e.ph, OR = '#ff7a1a', OR2 = '#c85a10';
      for (let i = 0; i < L; i++) {
        let x = 11, y = 13;
        if (ph === 'out' || ph === 'steady') { x = 11 - i; y = 13 + Math.round(Math.sin(t * 14 + i * .8) * (i / L) * 2); }
        else if (ph === 'in') { x = 12 + i; y = 13 + Math.round(Math.sin(t * 13 + i * .9) * (i / L) * 2); }
        else if (ph === 'calm') { x = 12 + Math.round(Math.sin(t * 2 + i * .5) * (i / L)); y = 13 + i; }
        else { x = 12; y = 13 + i; }
        R(x, y, 1, 2, i % 3 === 2 ? OR2 : OR);
      }
    },
    mark(g, e, t, R) {
      const c = 'rgba(232,224,206,.85)';
      if (e.sym === '叉') { for (let i = 0; i < 9; i++) { R(4 + i, 2 + i, 1, 1, c); R(12 - i, 2 + i, 1, 1, c); } R(3, 12, 10, 1, 'rgba(232,224,206,.35)'); }
      else { for (let k = 0; k < 3; k++) { R(4 + k * 3, 1, 1, 11, c); R(5 + k * 3, 3, 1, 9, 'rgba(60,50,40,.9)'); } }
    },
    pile(g, e, t, R) { const n = e.n || 0; if (!n) { R(3, 11, 10, 3, '#2e2720'); return; } for (let i = 0; i < 4 + n * 3; i++) R((i * 7) % 13, 12 - Math.min(10, (i * 5) % (3 + n * 2)), 4, 3, i % 2 ? '#5a4e42' : '#463c31'); R(0, 14, 16, 2, '#1e1914'); },
    stal(g, e, t, R) { const c = '#6a5c4a'; R(2, 0, 3, 6, c); R(3, 6, 1, 3, c); R(8, 0, 4, 9, c); R(9, 9, 2, 3, c); R(10, 12, 1, 1, c); R(13, 0, 2, 4, c); R(9, 1, 1, 7, '#8a7a64'); },
    soot(g, e, t, R) { const c = 'rgba(10,8,6,.85)'; R(2, 4, 3, 1, c); R(3, 5, 1, 4, c); R(6, 4, 2, 5, c); R(9, 4, 3, 1, c); R(10, 5, 1, 4, c); R(13, 4, 1, 5, c); R(1, 11, 14, 1, c); },
    cgate(g, e, t, R) {
      R(1, -6, 14, 20, '#080605'); R(2, -8, 12, 2, '#080605'); R(0, -7, 1, 21, '#3a3028'); R(15, -7, 1, 21, '#3a3028');
      if (e.open) { for (let i = 0; i < 3; i++) R(1 - i, -5, 1, 18, '#5a5a5a'); return; }
      for (let x = 2; x < 15; x += 3) R(x, -6, 1, 20, '#6a6a68'); R(1, -2, 14, 1, '#5a5a58'); R(1, 7, 14, 1, '#5a5a58'); R(10, 2, 3, 3, '#a88a3a');
    },
    regbox(g, e, t, R) { R(7, 4, 2, 10, '#4a4a48'); box(R, 3, -2, 10, 7, '#6a7a6a'); R(4, -1, 8, 1, '#8a9a8a'); R(6, 2, 4, 1, '#2a2a2a'); },
    fssign(g, e, t, R) { R(7, 2, 2, 12, '#5a4a34'); box(R, 0, -9, 16, 11, '#6a4a2a'); R(2, -7, 12, 1, '#e8d8a8'); R(2, -4, 9, 1, '#e8d8a8'); R(2, -1, 11, 1, '#e8d8a8'); },
    dog(g, e, t, R) {
      const f = e.dir === 2, X = x => f ? 15 - x : x, B = (x, y, w, h, c) => R(f ? 16 - x - w : x, y, w, h, c);
      const c = '#c89a5a', d = '#8a6232', step = e.fr ? 1 : 0;
      B(3, 6, 10, 5, c); B(11, 2, 4, 5, c); B(14, 4, 2, 2, d); B(12, 1, 2, 2, d); B(4, 7, 3, 2, d); B(9, 6, 2, 2, d);
      B(3, 11, 2, 3 - step, c); B(11, 11, 2, 3 - (1 - step), c); B(6, 11, 2, 3, d); B(1, 5, 2, 2, c);
      R(X(13), 3, 1, 1, '#1a1210');
      if (e.growl) { B(13, 6, 3, 1, '#f0e8d8'); B(14, 5, 1, 1, '#1a1210'); }
      R(3, 14, 11, 1, 'rgba(0,0,0,.3)');
    },
    pcdesk(g, e, t, R) {
      box(R, 0, 0, 32, 14, '#6a4a30'); R(1, 1, 30, 2, '#7a5a3c'); R(2, 13, 2, 3, '#3a2818'); R(28, 13, 2, 3, '#3a2818');
      box(R, 4, -14, 16, 15, '#d8d0b8'); R(6, -12, 12, 10, e.power ? '#1a3a6a' : '#141a20');
      if (e.power) { R(7, -11, 8, 1, '#e8e8f0'); R(7, -9, 10, 1, '#8ab0e0'); R(7, -7, 6, 1, '#8ab0e0'); R(7, -5, 9, 1, '#ffd060'); if (Math.sin(t * 6) > 0) R(16, -5, 1, 1, '#fff'); }
      R(10, 1, 4, 2, '#b8b098'); box(R, 21, -2, 9, 4, '#c8c0a8'); R(22, -1, 7, 1, '#9a9282');
    },
    gearpile(g, e, t, R) { R(1, 8, 14, 6, '#5a4a3a'); R(2, 6, 5, 4, '#e8e4d8'); R(3, 7, 2, 1, '#fff2b0'); R(8, 7, 6, 5, '#b0561a'); R(9, 9, 4, 1, '#8a3e10'); R(1, 13, 14, 2, '#3a2a1e'); for (let i = 0; i < 3; i++) R(2 + i * 4, 11, 2, 1, '#2a1e14'); },
    mural(g, e, t, R) {
      const W0 = 96, ink = '#b84a2a', ink2 = '#2a0e08';
      R(0, -6, W0, 20, 'rgba(70,58,46,.55)'); R(0, -6, W0, 1, 'rgba(140,120,96,.4)');
      const seq = ['手', '螺旋', '叉', '眼', '弯月', '抓痕'], men = { 手: 2, 螺旋: 3, 眼: 1, 弯月: 4 };
      seq.forEach((s, i) => {
        const x0 = 3 + i * 16;
        glyph(R, s, x0 + 3, -4, ink, 2);
        if (men[s]) for (let k = 0; k < men[s]; k++) stickman(R, x0 + 1 + k * 4 - (men[s] - 1) * 0, 7, ink);
        else { R(x0 + 3, 7, 9, 5, ink2); R(x0 + 5, 6, 5, 1, ink2); R(x0 + 4, 7, 1, 1, '#d8c8a8'); R(x0 + 10, 7, 1, 1, '#d8c8a8'); stickman(R, x0 + 1, 8, ink, true); stickman(R, x0 + 9, 9, ink, true); }
      });
    },
    rrock(g, e, t, R) {
      const cx = 8, cy = 6, r = 11;
      for (let y = -r; y <= r; y++) { const w = Math.round(Math.sqrt(r * r - y * y)); R(cx - w, cy + y, w * 2, 1, y < -4 ? '#6a6052' : y > 5 ? '#3e362c' : '#544a3e'); }
      R(cx - 3, cy - 3, 6, 6, '#3e362c'); R(cx - 2, cy - 2, 4, 4, '#4a4034'); R(cx - 9, cy - 1, 2, 1, '#7a705e'); R(cx + 5, cy - 7, 2, 1, '#7a705e');
      if (Math.sin(t * 1.3) > .2) { R(cx - 6, cy - 8, 1, 3, 'rgba(190,210,220,.5)'); R(cx + 7, cy + 2, 1, 2, 'rgba(190,210,220,.4)'); }   // 湿石头上的一点反光
      R(cx - 10, cy + 10, 20, 2, 'rgba(0,0,0,.45)');
    },
    gap(g, e, t, R) { R(-1, -4, 18, 20, '#020101'); R(0, -6, 16, 2, '#020101'); for (let i = 0; i < 4; i++) R(17, -2 + i * 4, 6, 1, 'rgba(160,150,130,.25)'); },
    cairn(g, e, t, R) { R(3, 11, 10, 3, '#4a4036'); R(4, 8, 8, 3, '#5a4e42'); R(5, 5, 6, 3, '#4a4036'); R(6, 3, 4, 2, '#6a5e50'); R(3, 14, 10, 1, 'rgba(0,0,0,.4)'); },
    xstone(g, e, t, R) { box(R, 3, 6, 10, 8, '#5a4e42'); for (let i = 0; i < 5; i++) { R(5 + i, 7 + i, 1, 1, '#e8e0ce'); R(9 - i, 7 + i, 1, 1, '#e8e0ce'); } },
    coil(g, e, t, R) { R(3, 8, 10, 6, '#3a6ab0'); R(5, 10, 6, 2, '#1a2a40'); R(12, 10, 4, 1, '#3a6ab0'); },
    lamplight(g, e, t, R) { }
  };

  /* ---------------- 物品与笔记 ---------------- */
  const ITEMS_T = {
    hammer: { name: '锤子和凿子', desc: '一把两磅的手锤，一根磨秃了的钢凿。木柄被 B 的手汗浸得发黑。' },
    lighter: { name: '打火机', desc: '老式的翻盖打火机。火苗往哪边倒，风就往哪边吹；火苗缩成豆粒大，就该出去喘口气了。' },
    st_hand: { name: '刻石（手）', desc: '从第一段缝里抠出来的方石块，四四方方，像是砌进去的。背面刻着一只张开的手。B 用粉笔在侧面写了个「1」。' },
    st_spiral: { name: '刻石（螺旋）', desc: '第二块方石块。背面刻着一圈往里绕的螺旋。侧面粉笔写着「2」。' },
    st_eye: { name: '刻石（眼）', desc: '第三块方石块。背面刻着一只没有眼皮的眼睛。侧面粉笔写着「3」——是 B 最后一次写的数字。' },
    st_moon: { name: '刻石（弯月）', desc: '第四块方石块。背面刻着一弯月亮。粉笔是你自己写的：「4」。' },
    rope: { name: 'B 的绳子', desc: '一卷蓝色的静力绳。B 放在你门口的，上面用胶带贴了张纸条：「拴着。」' },
    stoneX: { name: '刻着叉的石头', desc: '和你凿下来的那几块差不多大。刻的是一个叉。刻痕里的石粉是白的——新刻的。它握在手里，是温的。' }
  };
  const NOTES_T = {
    j1: { title: '洞穴日志 · 3月25日', text: '（你的免费个人主页「诺兰的洞穴日志」，访客计数器：0347）\n\n这周六和 B 又去了那个老洞，最里面那道会吹风的缝。\n风大得吓人，打火机凑过去，火苗直接被按平。B 说风这么大，后面肯定有个大洞厅。\n\n我们决定把缝凿宽。一锤一锤来，碎石拖到后面堆好。\n凿开第一段，掉下来一块方方正正的石头——不是天然的，是砌进去的。\n背面刻着一只手。第二块刻着一圈螺旋。\n\nB 用粉笔在石头上编了号。他说拆发动机的规矩：\n「拆下来的东西照原样装回去，最后拆的最先装。」\n\n凿开第二段以后，风声变了。\n呼——停——呼——\n像是喘气。\n\n速写：①手（石块）　②螺旋（石块）' },
    j2: { title: '洞穴日志 · 4月8日', text: '（访客计数器：1882）\n\n这次 B 带了他的狗斑点。斑点走到洞口就不肯动了，冲着里面低吼，然后夹着尾巴跑回了车底下。它从来不这样。\n\n风现在会往里吸了。一会儿往外吹，一会儿往里吸。\nB 发现，趁它吸气的时候凿，灰就被吸进缝里；吹气的时候凿，灰全扑在脸上。\n\n第三段后面没有石块，是天然的缝。\n缝壁上刻着一个叉。刻痕里的石粉是白的。\n上一次，我们根本没凿到那么深。\n\n第四段，第三块石头：一只眼睛。\n我们把它抠出来的那一刻，缝深深地吸了一口气。\n然后，从很远很远的地方，传来一声尖叫。\n接着是石头在石头上刮的声音。很慢。很长。\n\nB 说他不干了。\n\n速写：③叉（刻在缝壁上，新的）　④眼（石块）' },
    guest: { title: '访客留言板', text: '「假的吧。照片都看不清。」\n\n「我也下洞十几年了。洞会『呼吸』是真的——外面气压一变，洞里的风就会换方向。没什么好怕的。」\n\n「……可是一会儿吹一会儿吸、跟喘气一样？那得是多大的气压变化？」\n\n「我爷爷是那一带长大的。他说老辈人讲，那边山里有些洞，是被人从里面封上的。不让碰。」\n\n「别再往里挖了。求你。」\n\n「B 怎么样了？」\n\n「楼上的，楼主说了 B 不干了。」\n\n「下次带把枪去。说真的。」\n\n「坐等更新。」' },
    sketch: { title: '速写本', text: '（从第一天起就揣在胸口口袋里，纸边全是泥手印。）\n\n【石缝里凿出来的东西，从外往里】\n① 手——石块（粉笔 1）　←缝口\n② 螺旋——石块（粉笔 2）\n③ 叉——刻在缝壁上，刻痕是新的\n④ 眼——石块（粉笔 3）\n⑤ 弯月——石块（粉笔 4）\n⑥ 三道抓痕——缝壁上，从里往外抓的　←最里面\n\n【缝那头的壁画，从左到右】\n一只手，下面站着两个小人。\n一圈螺旋，下面站着三个小人。\n一个叉，下面没有人——是一团涂黑的东西，旁边的小人都躺着。\n一只眼睛，下面站着一个小人。\n一弯月亮，下面站着四个小人。\n三道竖线，下面也是那团黑的，小人躺着。\n\n（小人们站在记号下面，像是在守着什么。）' }
  };

  /* ================= 挖缝 ================= */
  function segGoal(S) {
    const k = S.f.seg + 1, e = S.f.seg ? S.ent('seg' + S.f.seg) : null;
    if (e && e.s.rub && !e.hidden) return S.goal('把碎石清出去（面对碎石按调查键）');
    S.goal('凿开石缝 · 第 ' + k + '/6 段（两人时一人看布条喊口令）');
  }
  async function segOn(S, k) {
    const e = S.ent('seg' + k);
    if (e.s.rub) return clearRub(S, k);
    if (S.f.tripDone || k !== S.f.seg + 1) return S.narr('石缝冰凉。风从缝里一丝一丝地往外渗。');
    if (!S.has('hammer')) return S.think('得先拿上锤子和凿子。');
    if (S.f.sta <= 0) { S.toast('胳膊酸得抬不起来了——歇口气（体力 0/' + STA_MAX + '）'); return; }
    const ph = PH, breathing = S.f.wmode === 'breath' || S.f.wmode === 'breath3';
    const bad = breathing && ph === 'out', cost = bad ? 2 : 1;
    S.f.sta = Math.max(0, S.f.sta - cost); S.f.hits = (S.f.hits || 0) + 1; STA_T = 0;
    SND.strike(S); S.shake(120, 1); e.s.k = S.f.hits;
    if (bad) {
      S.f.badHits = (S.f.badHits || 0) + 1; S.sfx('step');
      if (S.f.badHits === 1) { await S.think('咳——咳咳！\n风正往外吹，石粉全扑在了脸上。\n……得等布条往缝里飘的时候再凿。'); }
      else if (S.f.badHits % 3 === 0) S.toast('又呛了一口灰。看布条：往缝里飘的时候再凿');
    }
    if (S.f.hits >= HARD[k]) return segBreak(S, k);
    S.toast((bad ? '咳……' : ph === 'in' ? '咚！碎屑被吸进了缝里。' : '咚！') + '（这一段 ' + S.f.hits + '/' + HARD[k] + ' · 体力 ' + S.f.sta + '/' + STA_MAX + '）');
    await S.wait(260);
  }
  async function clearRub(S, k) {
    const e = S.ent('seg' + k), pile = S.ent('pile');
    if (S.f.trip < 3) {
      if (S.once('haul1')) await S.narr('你把碎石一捧一捧扒进帆布桶里。\nB 接过桶，拖着往后面爬。');
      else S.sfx('step');
      e.hidden = true; S.f.cleared = k;
      await S.walk('bud', [10, 9], 5); S.sfx('thud'); pile.s.n = (pile.s.n || 0) + 1; await S.wait(250);
      await S.walk('bud', [19, 7], 5); S.face('bud', 2);
    } else {
      if (S.f.sta < 2) { S.toast('没力气扒碎石了——先歇口气（体力 ' + S.f.sta + '/' + STA_MAX + '）'); return; }
      S.f.sta -= 2; STA_T = 0; S.sfx('step');
      if (S.once('haul3')) await S.narr('没有 B 拖桶了。\n你只能把碎石扒到身子底下，用脚一点一点往后蹬。');
      else S.toast('你把碎石蹬到了身后（体力 ' + S.f.sta + '/' + STA_MAX + '）');
      e.hidden = true; S.f.cleared = k; pile.s.n = (pile.s.n || 0) + 1;
    }
    segGoal(S);
  }
  async function segBreak(S, k) {
    const e = S.ent('seg' + k);
    S.f.seg = k; S.f.hits = 0; e.s.k = 0; e.s.rub = true;
    S.sfx('thud'); S.shake(350, 2);
    if (STONE[k]) { S.give(STONE[k][0]); }
    if (k === 1) {
      await S.narr('咔啦——\n一整块石头松动了。你把凿子别进缝里一撬，它「咚」地掉了下来。');
      await S.narr('方方正正的。四个角都是直的。\n这不是天然裂下来的——是有人砌进去的。');
      await S.narr('你把它翻过来。\n背面刻着一只手。五根手指张得开开的，像在说「停」。');
      S.face('bud', 2);
      await S.say('B', ['……这是人刻的。', '给它编个号。我修车的规矩：拆下来的东西照原样装回去——最后拆的最先装。', '万一哪天有人问起来，咱们好原样塞回去。']);
      await S.narr('B 掏出一截粉笔，在石头侧面写了个「1」。');
      return segGoal(S);
    }
    if (k === 2) {
      await S.narr('第二块方石头掉了出来。\n背面刻着一圈螺旋，从外往里绕，绕到正中间是一个小小的坑。');
      await S.narr('B 在侧面写了个「2」。');
      S.f.wmode = 'pulse'; WT = 0;
      await S.wait(500);
      await S.narr('风声变了。\n刚才还是一股劲儿地往外吹，现在——\n呼——停住。呼——又停住。');
      await S.say('B', ['……你听。', '它刚才是不是，停了一下？'], { style: 'whisper' });
      await S.wait(700);
      await S.say('B', '今天就到这儿吧。都快两点了。');
      return tripEnd(S, 1);
    }
    if (k === 3) {
      e.hidden = true; S.f.cleared = 3; S.f.seg = 3;
      await S.narr('这一段塌下来的只是碎石。后面没有方石块，是天然的缝，又窄又深。');
      S.show('mk3'); S.sfx('sting');
      await S.narr('你的头灯扫过缝壁——\n上面刻着一个叉。');
      await S.narr('刻痕里的石粉是白的。\n洞里的东西，几十年都是一个颜色。只有刚刻上去的，才是白的。');
      await S.say('B', ['……上次有这个吗？', '我们上次，根本没凿到这么深。']);
      return segGoal(S);
    }
    if (k === 4) {
      await S.narr('第三块方石头。\n背面刻着一只眼睛，没有眼皮，就那么瞪着。');
      await S.narr('B 在侧面写了个「3」。他写得很慢，粉笔断了两次。');
      S.f.wmode = 'suck'; WT = 0; PH = ''; S.amb('none');
      await S.wait(400);
      SND.windIn(S, 1.6); S.shake(900, 2);
      await S.narr('缝深深地吸了一口气。\n你的头发、B 的布条、地上的灰，全朝缝里飘了过去。');
      await S.wait(500);
      SND.scream(S); S.fx('red');
      await S.narr('然后——\n从很远很远的地方，传来一声尖叫。');
      await S.wait(600);
      SND.scrape(S, 3.2); S.shake(1500, 1);
      await S.narr('接着，是石头在石头上刮的声音。\n很慢。很长。像是有人在推一扇很重很重的门。');
      S.face('bud', 2); S.bubble('bud', '!', 1600);
      await S.say('B', ['走。', '现在就走。'], { style: 'big' });
      S.f.wmode = 'dead'; PH = '';
      return tripEnd(S, 2);
    }
    if (k === 5) {
      await S.narr('第四块方石头。背面刻着一弯月亮，弯得像一道指甲印。');
      await S.narr('你摸出 B 留下的半截粉笔，在侧面写了个「4」。');
      return segGoal(S);
    }
    if (k === 6) {
      S.show('mk6'); S.sfx('sting');
      await S.narr('凿子底下的石头突然一空——\n整段缝壁往里塌了下去，碎石哗啦啦地滚进了黑暗里。');
      e.hidden = true; S.f.cleared = 6;
      await S.narr('塌开的缝壁上，有三道抓痕。\n很深。从里往外抓的。');
      S.f.wmode = 'dead'; PH = ''; setWind(S, 'dead'); S.amb('none'); S.plr(null);
      await S.wait(800);
      await S.narr('……风停了。\n从三月到现在，这道缝第一次一丝风都没有。\n静得能听见自己的耳鸣。');
      await S.think('通了。');
      S.goal('钻过石缝（往右爬到头）');
      S.f.phase = 'through';
      S.cp('through');
    }
  }
  async function tripEnd(S, n) {
    S.f.tripDone = true;
    await S.fade(1, 900);
    S.amb('none'); S.speed(1); S.plr(null);
    if (n === 1) {
      await S.card('凌晨三点', '回家的路上', 'B 把皮卡开得很慢。\n两块刻石用旧毛巾包着，搁在你们中间的座位上。\n一路上，谁也没有说话。');
    } else {
      await S.card('那天夜里', '', '你们几乎是滚出洞口的。\n斑点在车底下叫了一整夜。\n\n上车以前，B 把头灯摘下来塞给了你。\n「我不干了，」他说，「你也别干了。」');
    }
    S.f.home = n; S.f.posted = false; S.f.slept = false;
    await S.go('home', 7, 5, 3);
  }

  /* ================= 家 ================= */
  async function pcOn(S) {
    if (S.f.dream) return S.narr('屏幕是黑的。\n黑屏上映着你的脸——和你身后，开着一条缝的衣柜。');
    if (S.f.posted) return S.narr(S.f.home === 2 ? '访客计数器还在跳。1883、1884……\n你把显示器关了。' : '日志已经发上去了。访客计数器停在 0347。');
    S.ent('pc').power = true; S.sfx('switch');
    await S.narr('你打开电脑，拨号上网。');
    SND.modem(S); await S.wait(1600);
    await S.narr('嘀——嘟——嘶嘶嘶——\n猫叫了足足半分钟，才连上。');
    S.f.posted = true;
    if (S.f.home === 1) {
      await S.note('j1');
      S.goal('该睡了（床）');
    } else {
      await S.note('j2');
      await S.narr('你点开访客留言板。\n一个月前，这里一共只有三条留言。');
      await S.note('guest');
      await S.wait(400);
      return budCall(S);
    }
  }
  async function budCall(S) {
    S.sfx('phone'); S.bubble('phone', '!', 1800);
    await S.narr('电话响了。凌晨一点。');
    S.f.called = true;
    await S.say('B', ['……是我。', '斑点到现在还在叫。冲着我家衣柜叫。', '我把衣柜门打开给它看，里面什么都没有。它还是叫。']);
    await S.say('B', ['我做了个梦。梦见我趴在那道缝里，前面那头也有人在凿。', '一下，一下。跟我对着凿。']);
    const r = await S.ask('B 在电话那头喘气。', ['「我也梦见了。」', '「只是梦，B。」']);
    await S.say('B', r === 0 ? '……我就知道。' : '……你自己信吗？');
    await S.say('B', ['我不会再下去了。', '你要是非去不可——我把我的绳子放你门口了。拴着去。', '……答应我，拴着。']);
    await S.narr('电话挂了。');
    S.goal('该睡了（床）');
  }
  async function bedOn(S) {
    if (S.f.dream) return S.narr('床单上全是灰。\n你不记得自己是什么时候下的床。');
    if (S.f.slept) return S.narr('你一点都不想再躺回去。');
    if (!S.f.posted) return S.think('先把今天的事写进主页日志吧。\n不写下来，明天就会觉得是自己瞎想的。');
    if (S.f.home === 2 && !S.f.called) return S.think('……');
    S.f.slept = true;
    S.ent('pc').power = false;
    await S.fade(1, 900);
    if (S.f.home === 1) return dream1(S);
    return dream2(S);
  }
  async function dream1(S) {
    S.amb('none');
    S.dark(.97); S.plr(1.3); S.show('ctape');
    await S.wait(300); await S.fade(0, 900);
    SND.windOut(S, .6); await S.wait(1400); SND.windIn(S, .6);
    await S.narr('……梦里，你趴在那道缝里。\n石头贴着你的后背、你的胸口、你的脸。');
    await S.narr('你举起锤子。咚。\n过了一会儿，从缝的那一头，也传来一声。\n咚。');
    SND.thump(S, 2, .1);
    await S.narr('你停下，它也停下。\n你凿一下，它也凿一下。\n它离你越来越近。');
    S.sfx('heart'); await S.wait(300);
    await S.fade(1, 300);
    S.hide('ctape'); S.dark(null); S.plr(null);
    await S.card('4月7日　傍晚', '第二次下洞', 'B 打电话来，说这周末接着干。\n「那两块石头我查了半天，」他说，「哪本书上都没有那种记号。」\n\n他还说，要带上他的狗。');
    return startTrip2(S);
  }
  async function dream2(S) {
    S.f.dream = true;
    S.amb('otherworld'); S.dark(.95); S.plr(1.8);
    const cl = S.ent('closet'); cl.open = true; S.show('ctape');
    await S.wait(700);
    await S.fade(0, 900);
    SND.windIn(S, .7);
    await S.narr('……你睁开眼睛。\n房间里很黑。有风。');
    await S.narr('风从衣柜那边来。\n一下往外吹，一下往里吸。');
    S.goal('……衣柜里有风？');
  }
  async function closetOn(S) {
    if (!S.f.dream) return S.narr(S.f.woke ? '衣柜门关得好好的。\n你没有打开它。' : '衣柜里挂着几件衬衫，和一套还没干透的连体服。一股洞里的土腥味。');
    S.f.dream = false;
    await S.narr('衣柜门开着一条缝。门缝上系着一截橙色的布条，哗啦啦地往里飘。\n你把门拉开。');
    await S.narr('衬衫后面，本该是木板的地方，是一道石缝。\n缝在呼吸。');
    SND.windIn(S, 1); await S.wait(500);
    await S.narr('你把头灯凑过去。\n缝的那一头，有什么东西，也把脸凑了过来。');
    await S.scare('face', { spr: '@it', dur: 1.1 });
    await S.fade(1, 200);
    S.ent('closet').open = false; S.hide('ctape'); S.dark(null); S.plr(null); S.amb('room');
    await S.wait(500);
    await S.fade(0, 900);
    S.f.woke = true;
    await S.narr('你醒了。\n四点十七分。窗外还是黑的。');
    await S.narr('被子上落着一层细细的灰。\n你看了看自己的手——指甲缝里，全是石粉。');
    S.show('ropeD');
    await S.think('……出门以前，把 B 的绳子带上。');
    S.goal('出门（门口有 B 的绳子）');
  }
  async function doorOn(S) {
    if (!S.f.woke) return S.narr(S.f.home === 2 ? '这个点儿，哪儿也不想去。' : '门锁好了。链子也挂上了。');
    if (!S.has('rope')) return S.think('B 的绳子还在门口。');
    const r = await S.ask('天还没亮。真的要一个人去吗？', ['去。把它凿通。', '……再等等']);
    if (r) return S.narr('你在门口站了很久。\n最后，你还是把背包甩上了肩。\n（再按一次调查键出门）');
    return startTrip3(S);
  }

  /* ================= 三次下洞 ================= */
  function resetSegs(S, upTo) {
    for (let k = 1; k <= 6; k++) { const e = S.ent('seg' + k); e.s.rub = false; e.s.k = 0; e.hidden = k <= upTo; }
    S.f.seg = upTo; S.f.cleared = upTo; S.f.hits = 0;
  }
  async function startTrip2(S) {
    S.f.trip = 2; S.f.tripDone = false; S.f.dogEv = false; S.f.wmode = 'breath'; S.f.sta = STA_MAX;
    resetSegs(S, 2); S.ent('pile').s.n = 2;
    S.amb('wind'); S.dark(null); S.plr(null);
    S.place('dog', 8, 9, 2); S.ent('dog').s.growl = false; S.ent('gate').open = false;
    S.place('budH', 8, 8, 0);
    await S.go('hill', 7, 10, 3);
    await S.narr('斑点从皮卡后斗上跳下来，绕着你的腿转了两圈，尾巴摇得像风车。');
    await S.say('B', '在家憋坏了。带它出来遛遛。');
    S.goal('去洞口（铁栅门）');
    S.cp('trip2');
  }
  async function dogEvent(S) {
    S.f.dogEv = true;
    S.focus(17, 3);
    await S.walk('dog', [18, 2], 6);
    S.face('dog', 3); await S.wait(500);
    S.ent('dog').s.growl = true; SND.growl(S);
    await S.narr('斑点跑到洞口，突然站住了。\n它背上的毛一根一根竖了起来，冲着黑洞洞的铁栅门里面，喉咙里滚着低低的呼噜声。');
    await S.wait(400);
    SND.whine(S);
    await S.narr('然后，它夹着尾巴，掉头就跑——');
    S.ent('dog').s.growl = false;
    await S.walk('dog', [6, 10], 8);
    S.hide('dog');
    await S.narr('一头钻进了皮卡底下。');
    S.focus(null);
    S.face('budH', 'pl');
    await S.say('B', ['……斑点？', '它从来不这样。打雷都不这样。']);
    await S.narr('B 把斑点从车底下拖出来，关进了驾驶室。\n斑点趴在车窗上，一直看着洞口，一声都不出了。');
    S.goal('进洞（铁栅门）');
  }
  async function startTrip3(S) {
    S.f.trip = 3; S.f.tripDone = false; S.f.wmode = 'breath3'; S.f.sta = STA_MAX; S.f.air = AIR_MAX; S.f.t3a = false;
    resetSegs(S, 4); S.ent('pile').s.n = 4;
    S.hide('bud');
    const tp = S.ent('tape'); tp.s.mark = true; tp.s.torn = true;
    await S.fade(1, 600);
    await S.card('4月28日　凌晨', '一个人', '你没有告诉 B。\n你也没有带枪——留言板上有人让你带，可你想不出来，枪能对着什么开。\n\n铁栅门的锁是你上次偷偷配的钥匙打开的。\n登记簿你没有签。\n\nB 的绳子挂在你的腰上。');
    S.amb('drone'); S.dark(null); S.plr(null); S.speed(1);
    await S.go('cave', 1, 6, 2);
    await S.narr('洞里比上次冷。\n没有 B 的头灯，你的光圈小得可怜。');
    S.goal('去洞厅尽头的石缝');
    S.cp('trip3');
  }
  async function trip3Chamber(S) {
    S.f.t3a = true;
    S.focus(21, 6);
    await S.narr('布条还系在缝口上方。\n可它短了一截——像是被什么扯断的。');
    await S.narr('布条旁边的石壁上，多了一个叉。\n刻痕是白的。');
    S.focus(null);
    await S.think('它在给这条路做记号。\n……从里面那头。');
    await S.narr('缝的呼吸比上次快，也比上次深。\n越往里，空气越闷。你把打火机揣进了胸口的口袋。');
    await S.think('火苗缩小了，就退到缝口喘口气——缝深处是喘不上气的。\n趁它往外吹的时候退出来歇，趁它往里吸的时候凿。');
    segGoal(S);
  }

  /* ================= 缝那头 ================= */
  async function muralOn(S) {
    const first = !S.f.sawWall;
    if (first) {
      await S.narr('头灯扫过石壁。\n赭红色的颜料。一排记号，每个记号下面，都画着火柴一样的小人。');
      await S.narr('手。螺旋。叉。眼睛。弯月。三道竖线。\n小人们站在记号下面，一动不动，像是在守着什么。');
      await S.narr('只有叉和三道竖线下面没有站人。\n那里涂着一团黑乎乎的东西。旁边的小人，全都躺着。');
      await S.think('……手、螺旋、眼睛、弯月。\n是从缝里凿下来的那四块石头。');
    }
    S.f.sawWall = true;
    await S.narr(first ? '你掏出速写本，把壁画一笔一笔描了下来。' : '你又对着速写本核了一遍。');
    await S.note('sketch');
    if (first) { S.toast('速写本可以随时在「笺」里翻看'); S.goal('看看尽头那块圆石'); }
  }
  async function rrockOn(S) {
    if (S.f.rockOpen) return S.narr('圆石滚开了一半。后面的黑，比洞里任何地方都黑。');
    if (!S.f.sawWall) {
      await S.narr('洞厅尽头，一块磨盘一样的圆石，正正好好嵌在一道石拱里。\n比你还高。');
      await S.narr('它脚下的地面上，有一道弧形的刮痕。很新。');
      return S.think('……先看看别的地方。\n石壁上好像画着什么。');
    }
    S.f.rockOpen = true;
    S.amb('none');
    await S.narr('你把手按在圆石上。\n冰凉的。');
    SND.thump(S, 3, .18); S.shake(300, 1);
    await S.narr('咚。咚。咚。\n圆石的另一面，有什么在敲。');
    await S.wait(700);
    SND.scrape(S, 3.4, 1.4); S.shake(2200, 2);
    await S.narr('石头刮着石头。\n圆石自己动了——一寸一寸地，往旁边滚开。');
    S.place('rrock', 25, 7); S.show('gap');
    S.f.wmode = 'suck'; SND.windIn(S, 1.6);
    await S.narr('风又起来了。\n这一次，所有的风都往那道缝里灌。你的布条、你的头发、地上的灰——');
    await S.narr('圆石后面，是一个更小的空间。\n你的头灯照进去，光像是被吞掉了。');
    S.goal('……');
    const r = await S.ask('黑暗里，有呼吸声。', ['钻进去看看', '退回去——现在就跑']);
    if (r === 0) return insideEnd(S);
    return fleeStart(S);
  }
  async function insideEnd(S) {
    await S.narr('你弯下腰，钻了进去。\n石壁擦着你的肩膀。风推着你的后背，像是在帮你。');
    await S.fade(1, 1200);
    SND.windIn(S, 1.2); await S.wait(600); SND.thump(S, 1, .2);
    await S.narr('头灯照到的最后一样东西，是一面墙。\n墙上刻满了火柴一样的小人。每一个小人，都站在一个记号下面。');
    await S.narr('最新的那一个，刻痕还是白的。\n它戴着一顶头盔。头盔上，有一盏灯。');
    S.sfx('scare'); S.fx('black', { dur: 1.2 });
    await S.wait(900);
    return S.end({ bad: true, id: 'inside', title: '最后那个空间', text: '「诺兰的洞穴日志」最后一次更新，是4月8日。\n\n访客留言板上的留言，后来又多了几百条。\n\n「更新呢？」\n「楼主？」\n「B 说他报了警。搜救队在洞里找到了一卷蓝色的绳子，两头都是空的。」\n「那道缝呢？」\n「……封着的。用石头封得好好的。」\n\n最后一页的链接，点下去，只会回到同一页。' });
  }
  async function fleeStart(S) {
    S.f.phase = 'flee';
    S.cp('flee');
    return chaseGo(S);
  }
  async function chaseGo(S) {
    S.speed(WIND_DRAG); S.f.wmode = 'suck'; S.amb('none');
    S.place('rrock', 25, 7); S.show('gap');
    const it = S.ent('it'); S.stop('it'); S.place('it', 26, 8, 1); it.alpha = 0;
    S.pos(22, 8, 1);   // 你踉跄着退开几步：它从缝里探出来时离你四格
    S.sfx('sting'); S.bubble('pl', '!', 1000);
    await S.alpha('it', 1, 500);
    if (FLEE_DIED) await S.think(FLEE_DIED === 1 ? '别停。别回头看。\n顺着来的路，一直往左跑——按住跑步键。' : '贴着洞厅北边跑，绕开那几块大石头。\n碎石坡就在最左边。');
    S.goal('跑！回左边的碎石坡（逆风，按住跑）');
    S.chase('it', { spd: CHASE_SPD, wait: 1.0, catch: fleeCaught });
  }
  async function fleeCaught(S) {
    FLEE_DIED++;
    await S.scare('face', { spr: '@it', dur: .9 });
    await S.die('一只冰凉的、长得不像话的手，从后面握住了你的脚踝。\n风把你往回拽。你的头灯在石头上磕灭了。', '它追上了你');
  }
  async function slopeTop(S) {
    if (S.f.phase !== 'flee') return;
    S.f.phase = 'climb';
    S.stop('it'); S.speed(1); S.plr(null);
    await S.walk('pl', [[4, 5], [4, 4]], 3.4);
    const it = S.ent('it'), ix = Math.round(it.px / TS);
    if (!it.hidden && ix <= 12) { S.face('it', 3); S.turn(0); await S.wait(600); S.sfx('whisper'); await S.narr('你回头看了一眼。\n它停在碎石坡底下，仰着那张没有眼睛的脸。圆圆的嘴一张一合，在吸气。'); S.turn(3); }
    await S.alpha('it', 0, 500);
    S.cp('rope');
    return ropeTug(S);
  }
  async function ropeTug(S) {
    S.sfx('heart'); S.shake(600, 3);
    await S.narr('爬到一半，腰上猛地一紧——\nB 的绳子。你下来的时候，绳子一头拴着缝口的石头，一头拴着你。\n中间那一截松松地拖在洞厅里。');
    await S.narr('现在，有什么东西攥住了那一截。\n往回拽。');
    if (ROPE_DIED) await S.think('它不会松手的。……是你自己把绳子拴在身上的。');
    const r = await S.ask('绳子勒进你的腰里。', ['解开腰上的绳结', '扒住岩石，往上挣']);
    if (r === 1) {
      if (!S.f.ropeWarn) {
        S.f.ropeWarn = true;
        await S.walk('pl', 'd', 2.5); S.shake(500, 3);
        await S.narr('你的手指在石头上刮出了血。\n你被拽下去一大截。');
        const r2 = await S.ask('它在下面。它不会松手的。', ['解开腰上的绳结', '扒住岩石，往上挣']);
        if (r2 === 1) return ropeDie(S);
        await S.walk('pl', 'u', 3);
      } else return ropeDie(S);
    }
    await S.narr('你的手指抖得不听使唤。绳结勒得死紧——\n松了。');
    S.sfx('whisper');
    await S.narr('绳子从你腰上滑开，像一条蛇，「嗖」地缩进了下面的黑暗里。\n再也没有动静。');
    await S.walk('pl', [[4, 3], [1, 3]], 4);
    S.f.phase = 'seal';
    await S.go('cave', 27, 6, 1);
    return sealStart(S);
  }
  async function ropeDie(S) {
    ROPE_DIED++;
    await S.scare('face', { spr: '@it', dur: .8 });
    await S.die('你的手指一根一根地被扯开。\n绳子拖着你，一路滑进了圆石后面的黑暗里。\n……绳子拴在你身上。是你自己拴的。', '你没有松开绳子');
  }

  /* ================= 封缝 ================= */
  async function sealStart(S) {
    S.f.phase = 'seal'; S.f.sealAuto = false; S.f.wmode = 'suck'; PH = '';
    S.speed(CRAWL); S.plr(null);
    S.goal('爬回缝口，把封石按原样塞回去（两人时一人翻速写本）');
    S.cp('seal');
    const t = SEAL_LEFT == null ? 45 : Math.max(SEAL_LEFT, 35);
    S.timer(t, '刮擦声', sealFail, { during: true });
    SND.scrape(S, 2.4, 1.2);
    if (SEAL_DIED) await S.think(SEAL_DIED === 1 ? '只塞人站在下面的那几块。\n最里面那一格先塞——最里面的，是最后凿出来的。' : '弯月、眼、螺旋、手。');
    else await S.narr(['身后的黑暗里，石头刮着石头。\n它在往这边挤。', '得从缝口把四块封石照原样塞回去。\n塞错一块，缝就漏一回风——它就挤得更快。']);
  }
  async function sealFail(S) {
    SEAL_LEFT = 0; SEAL_DIED++;
    await S.scare('face', { spr: '@it', dur: .9 });
    await S.die('刮擦声停在了你的脚后跟。\n缝里的风，最后一次，深深地吸了一口气。', '缝没有封上');
  }
  async function sealPrompt(S) {
    if (S.f.phase !== 'seal') return;
    for (;;) {
    const v = await S.keypad('你趴在缝口，把胳膊伸进石缝里。\n从最里面那一格开始，一块一块塞回去（4 块）', KEYS, 4, { sep: '-' });
    if (v == null) { await S.think('……快！（面对缝口上方的布条，可以重新开始塞）'); return; }
    if (v === ANS) return sealOK(S);
    S.f.sealWrong = (S.f.sealWrong || 0) + 1;
    SEAL_LEFT = Math.max(0, (S.timerLeft || 0) - 10); S.timerAdd(-10);
    SND.scrape(S, 1.6, 1.5); S.shake(600, 3); S.sfx('sting');
    const n = S.f.sealWrong, parts = v.split('-'), uniq = new Set(parts).size === parts.length;
    const allFour = uniq && ['弯月', '眼', '螺旋', '手'].every(p => parts.includes(p));
    await S.narr('最后一块怎么也塞不严。\n缝里还在漏风——吸得更凶了。');
    if (n >= 3) await S.think('弯月——眼——螺旋——手。');
    else if (parts.some(p => p === '叉' || p === '抓痕')) await S.think('叉和三道抓痕……那不是封石，你手里根本没有那样的石块。\n壁画上，那两个记号底下站的不是人。');
    else if (!uniq) await S.think('同一块石头，塞不进两个格子。\n四块封石，一块一格。');
    else if (allFour) await S.think(n === 1 ? '四块石头都对。是顺序错了。\n……B 说过拆东西的规矩。' : '「最后拆的最先装。」\n最里面那一格，是你最后凿开的那一块。');
    else await S.think(n === 1 ? '只有人站在下面的记号，才是封石。\n可顺序呢？……B 说过拆东西的规矩。' : '「最后拆的最先装。」\n最里面那一格，是你最后凿开的那一块。');
    }
  }
  async function sealOK(S) {
    S.clearTimer(); SEAL_LEFT = null;
    const seq = ['弯月', '眼', '螺旋', '手'];
    for (let i = 0; i < 4; i++) {
      SND.seal(S, i); S.shake(200, 1);
      await S.narr(['弯月。最里面那一格。石头「咔」地一声卡了进去。', '眼。缝里的风小了一半。', '螺旋。刮擦声停了一下。', '手。五根手指张开着，朝着里面。'][i]);
    }
    S.f.wmode = 'dead'; PH = ''; setWind(S, 'dead');
    S.amb('none');
    await S.narr('风停了。\n刮擦声，也停了。');
    await S.wait(900);
    SND.thump(S, 3, .06);
    await S.narr('……然后，从石头的那一面，传来很轻很轻的三下。\n咚。咚。咚。\n像是有人隔着一扇门，在跟你道别。或者在记住你。');
    let kept = false;
    if (S.has('stoneX')) {
      const r = await S.ask('胸口的口袋里，还揣着那块刻着叉的石头。它是温的。', ['从最后那道细缝里塞回去', '……留着它']);
      if (r === 0) { S.take('stoneX'); await S.narr('你把它从石头之间的细缝里推了进去。\n它滚落下去，很久才响。'); }
      else { kept = true; await S.narr('你把它揣得更紧了。\n它贴着你的心口，一下，一下，像是在跳。'); }
    }
    S.f.phase = 'end';
    await S.wait(500);
    S.place('bud', 2, 6, 2); S.ent('bud').alpha = 1;
    await S.narr('洞厅那头，亮起一盏头灯。');
    await S.walk('bud', [17, 6], 5);
    S.face('bud', 2); S.face('pl', 1);
    await S.say('B', ['诺兰？！', '……我就知道你会一个人来。我在家怎么都睡不着。']);
    await S.say('B', '封上了？');
    await S.say('诺兰', '……封上了。照原样。最后拆的，最先装。');
    await S.narr('B 看了很久那面重新砌好的石缝。\n然后他解下自己的布条，系在了缝口上方。\n布条垂着，一动不动。');
    S.speed(1);
    const reg = S.f.reg ? '\n\n下山的时候，你在洞口的登记簿上补了一行：\n「4月28日　诺兰　签退。」\n往前翻几页，1974年的那一行，出洞时间还空着。' : '';
    if (kept) return S.end({ id: 'keep', title: '桌上的石头', text: '那天之后，你又更新了一篇日志，说缝已经封上了，以后不会再去了。\n访客留言板上，有人说「烂尾」，有人说「这样最好」。' + reg + '\n\n那块刻着叉的石头，你一直摆在书桌上。\n五月的一个夜里，你被风声吵醒。\n风是从书桌那边来的。一下往外吹，一下往里吸。\n\n「诺兰的洞穴日志」，再也没有更新过。' });
    return S.end({ id: 'seal', title: '封回去', text: '那天之后，你写了最后一篇日志。\n「缝已经照原样封上了。我们不会再去了。也请你们别去找它。」\n然后你把主页关了。' + reg + '\n\n有人说那是编的。有人说他知道是哪个洞。\n你一条都没有回。\n\n只是从那以后，你再也没有下过洞。\n每年春天气压变化的时候，你会在半夜醒过来，\n听一会儿窗外的风——确认它只是在吹，没有在吸。' });
  }

  /* ================= 地图数据 ================= */
  const row = (w, f) => Array.from({ length: w }, (_, x) => f(x)).join('');
  const CAVE_ROWS = [
    '#############################',
    '#############################',
    '#############################',
    '##########fffffffff##########',
    '#########ffffffffffff########',
    '########ffffoffffffff########',
    'fffffffffffffffffffffccccccc#',
    'ffffffffffffffffffff#########',
    '########fffffffffff##########',
    '#########ffoffffff###########',
    '##########fffff##############',
    '#############################',
    '#############################'
  ];
  const DEEP_ROWS = [
    '############################',
    '############################',
    '############################',
    '#ffff#######################',
    '####S#######################',
    '####S#######################',
    '#fffffffffffffffffffffffff##',
    '#ffffffffffffffffffffffff###',
    '#fffffffffffoofffffffffffff#',
    '#ffffffoffffffffffffoffffff#',
    '#fffffffffffffffffffffffff##',
    '##fffffffffffffffffffffff###',
    '############################'
  ];
  const HPATH = new Set();
  for (let y = 2; y <= 7; y++) HPATH.add('17,' + y);
  for (let x = 7; x <= 17; x++) HPATH.add(x + ',7');
  for (let y = 7; y <= 11; y++) HPATH.add('7,' + y);
  const HJ = new Set(['0,2', '1,2', '0,3', '24,2', '25,2', '25,3', '0,10', '0,11', '1,11', '25,11', '24,11', '25,10', '11,3', '21,9', '22,10', '3,4', '13,11', '12,11']);
  const HB = new Set(['4,3', '23,4', '10,10', '20,5', '15,10', '2,7']);
  const HILL_ROWS = [row(26, () => '#'), row(26, () => '#')];
  for (let y = 2; y <= 12; y++) HILL_ROWS.push(row(26, x => y === 12 ? 'J' : HJ.has(x + ',' + y) ? 'J' : HB.has(x + ',' + y) ? 'O' : HPATH.has(x + ',' + y) ? 's' : 'd'));

  defChapter({
    id: 'tedcaver', n: 4, title: '泰德的洞穴', sub: '老洞最深处，一道会吹风的窄缝。他们决定把它凿宽。', origin: '美国　2001 年网络连载', color: '#5a3a1a',
    amb: 'drone', floor: 'dirt', wall: 'stone', dark: .9, plr: 3, darkC: '#040302',
    people: PEOPLE_T, tiles: TILES_T, sprites: SPR_T, items: ITEMS_T, notes: NOTES_T, faces: FACES_T,
    endings: { seal: '封回去', keep: '桌上的石头', inside: '最后那个空间' },
    legend: '「泰德的洞穴」（Ted the Caver）是英语网络早期最有名的恐怖故事之一。据说它最早在2001年前后，以一位洞穴爱好者个人主页上的探洞日志形式出现在一个免费建站网站上：写日志的人自称泰德，和朋友「B」在一个老洞的深处发现了一个小洞口，里面不停地往外吹着强风。风这么大，说明后面有很大的空间，于是他们一趟又一趟地带着锤子、凿子和电钻回去，想把它扩宽钻过去。\n\n日志一篇比一篇不对劲。据说 B 带去的狗到了洞口就焦躁不安；缝的那头传来像是尖叫、又像石头刮着石头的声音；钻过去以后，洞壁上出现了像象形文字一样的图画，画着站在某个记号下面的人；泰德开始做噩梦、出现幻觉，后来同去的一个朋友吓得再也不肯说他看见了什么。最后一篇日志说，他们准备带上枪再下去一次——之后主页再也没有更新。流传最广的说法是，最后一页的链接点下去，只会回到同一页。\n\n因为写成了实时更新的个人日志，还配着真实的洞穴照片，它在当年的论坛和邮件里被大量转发，很多人争论它是真是假。后来据说作者本人出面说明：照片和最初的几次下洞是真的，故事则是在这些经历上加工出来的小说。它常被看作「Creepypasta」（网络怪谈）最早的代表作之一，2010年代还有过一部改编电影；网上流传过别人写的「后续」，作者表示那不是他写的。\n\n（本章中的诺兰、B（巴德）、狗斑点、洞内布局、会「呼吸」的风与趁吸气凿石的做法、六段石缝和四块刻着手、螺旋、眼睛、弯月的方石、1974年登记簿上的警告、访客留言、梦里的衣柜、圆石后的空间和「把洞封回去」的结局，均为游戏虚构；日志内容是按传说情节重写的，不是原文。洞穴会随外界气压「呼吸」是真实存在的自然现象。）',
    start: { map: 'hill', x: 7, y: 10, dir: 3 },
    thumb(g, w, h) {
      const cx = w / 2, gy = h - 22;
      g.fillStyle = '#2a1e14'; g.fillRect(0, 0, w, gy);
      g.fillStyle = '#3a2c1e'; for (let i = 0; i < 12; i++) g.fillRect((hash(i, 5, 4) * w) | 0, (hash(i, 6, 4) * gy) | 0, 10 + ((hash(i, 7, 4) * 16) | 0), 3);
      g.fillStyle = '#4a3a2a'; g.beginPath(); g.moveTo(cx - 6, 6); g.lineTo(cx + 8, 20); g.lineTo(cx + 5, 38); g.lineTo(cx + 10, 56); g.lineTo(cx + 4, gy); g.lineTo(cx - 8, gy); g.lineTo(cx - 4, 54); g.lineTo(cx - 9, 36); g.lineTo(cx - 5, 20); g.closePath(); g.fill();
      g.fillStyle = '#030201'; g.beginPath(); g.moveTo(cx - 4, 8); g.lineTo(cx + 6, 20); g.lineTo(cx + 3, 38); g.lineTo(cx + 8, 56); g.lineTo(cx + 2, gy); g.lineTo(cx - 6, gy); g.lineTo(cx - 2, 54); g.lineTo(cx - 7, 36); g.lineTo(cx - 3, 20); g.closePath(); g.fill();
      g.fillStyle = '#ff7a1a';
      for (let i = 0; i < 16; i++) g.fillRect(cx + 6 - i * 1.6, 30 + Math.round(Math.sin(i * .9) * 2 * (i / 16)), 2, 3);
      g.fillStyle = '#4a4036'; g.fillRect(cx + 4, 28, 4, 4);
      g.strokeStyle = 'rgba(220,210,190,.45)'; g.lineWidth = 1;
      for (let i = 0; i < 4; i++) { g.beginPath(); g.moveTo(cx - 8, 42 + i * 6); g.lineTo(cx - 26 - i * 6, 40 + i * 6); g.stroke(); }
      const gr = g.createRadialGradient(cx, 40, 4, cx, 40, 70); gr.addColorStop(0, 'rgba(255,220,150,.18)'); gr.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = gr; g.fillRect(0, 0, w, h);
      g.fillStyle = '#e8e0ce'; for (let i = 0; i < 6; i++) { g.fillRect(cx + 18 + i, 16 + i, 1, 1); g.fillRect(cx + 23 - i, 16 + i, 1, 1); }
    },
    async intro(S) {
      WT = 0; PH = ''; STA_T = 0; AIR_T = 0; SEAL_LEFT = null; FLEE_DIED = 0; ROPE_DIED = 0; SEAL_DIED = 0;
      S.f.trip = 1; S.f.seg = 0; S.f.hits = 0; S.f.sta = STA_MAX; S.f.wmode = 'steady';
      await S.card('第四夜　泰德的洞穴', '2001年3月24日　美国西部某处', '诺兰和 B 是在周末洞穴俱乐部认识的。\n一个在复印店上夜班，一个修车。\n\n上个周末，他们在一个老洞的最深处，\n发现了一道会吹风的石缝。\n\n风大得能把打火机的火苗按平。');
    },
    resume: {
      trip2: async S => { S.speed(1); S.dark(null); S.plr(null); },
      trip3: async S => { WT = 0; PH = ''; S.speed(1); S.plr(null); },
      through: async S => { S.speed(CRAWL); S.plr(null); },
      deep: async S => { S.speed(1); S.plr(null); S.f.wmode = 'dead'; },
      flee: async S => { S.plr(null); await chaseGo(S); },
      rope: async S => { S.speed(1); S.plr(null); S.hide('it'); S.f.phase = 'climb'; await ropeTug(S); },
      seal: async S => { S.pos(27, 6, 1); await sealStart(S); }
    },
    maps: {
      /* ---------------- 半山腰的洞口 ---------------- */
      hill: {
        amb: 'wind', dark: .8, plr: 3.4, wall: 'stone', wallC: { top: '#120e0a', face: '#5a4636', trim: '#2e2219' }, darkC: '#05060c',
        legend: { d: 'hdr', s: 'hsd', J: 'jun', O: 'hbo' },
        rows: HILL_ROWS,
        ents: [
          { id: 'truck', x: 4, y: 9, w: 2, spr: 'car', col: '#7a5a3a', light: { r: 4.6, dx: 34, dy: 8, col: 'rgba(255,236,190,.16)' },
            on: S => S.narr(S.f.trip === 2 ? '斑点趴在驾驶室的车窗上，鼻子把玻璃哈出了一小片白雾。\n它一直看着洞口。' : 'B 的老皮卡。车斗里堆着绳子、头盔、两个帆布桶。\n收音机里在放乡村音乐，信号时有时无。') },
          { id: 'gear', x: 6, y: 9, spr: 'crate', async on(S) {
            if (S.has('hammer')) return S.narr('车斗里还剩一卷绳子和半包牛肉干。');
            S.give('hammer'); S.give('lighter', true);
            await S.narr('你从车斗里拿出锤子和凿子，掂了掂。\n打火机揣进胸口的口袋。');
            S.face('budH', 'pl');
            await S.say('B', '帆布桶我拿。走吧——钥匙在我这儿。');
            S.goal('跟 B 去洞口（铁栅门）');
          } },
          { id: 'budH', x: 8, y: 8, spr: '@bud', dir: 3, async on(S) {
            if (S.f.trip === 2) return S.say('B', S.f.dogEv ? '……它从来不这样。' : '斑点！别乱跑！');
            if (!S.has('hammer')) return S.say('B', '工具在后斗里。锤子、凿子都带上。');
            return S.say('B', ['老规矩：进洞前在登记簿上签个名。', '……虽然这个洞，十几年都没几个人签过了。']);
          } },
          { id: 'dog', x: 8, y: 9, spr: 'dog', dir: 2, hidden: true, solid: false, async on(S) {
            if (S.f.dogEv) return S.narr('……');
            SND.whine(S);
            await S.narr('你蹲下摸了摸斑点的脑袋。\n它舔了一下你的手，又转过头去，看着山坡上那个黑洞洞的口子。');
          } },
          { id: 'gate', x: 17, y: 1, spr: 'cgate', async on(S) {
            if (!S.has('hammer')) return S.think('先去皮卡后斗拿工具。');
            if (S.f.trip === 2 && !S.f.dogEv) return dogEvent(S);
            S.ent('gate').open = true; S.sfx('open');
            if (S.f.trip === 1) await S.narr('B 掏出钥匙打开铁栅门上的挂锁。\n门轴吱呀一声。一股凉气从黑洞里扑出来，带着湿土和石头的味道。');
            else await S.narr('铁栅门开了。\n身后，斑点在驾驶室里，一声都没有出。');
            S.amb('drone');
            await S.go('cave', 1, 6, 2);
          } },
          { id: 'reg', x: 19, y: 1, spr: 'regbox', async on(S) {
            if (S.f.reg) return S.narr('登记簿上，你们的名字下面空着「出洞时间」那一栏。');
            await S.narr('洞口边上钉着一个铁皮盒子，里面是一本受潮发胀的登记簿。\n进洞的人写下名字和时间，出洞时再签退。');
            await S.narr('你往前翻了翻。最近的一行是三年前的。\n再往前翻，翻到一页发黄的纸——');
            await S.narr('「1974年11月　R.K.　进洞」\n出洞那一栏是空的。\n旁边用另一种笔迹，歪歪扭扭地补了一行：\n「最里面的缝在吹风。别碰它。」');
            const r = await S.ask('要签个名吗？', ['签：诺兰、B，3月24日，进洞', '……不签了']);
            if (r === 0) { S.f.reg = true; S.sfx('paper'); await S.narr('你写下了你们俩的名字。\nB 在旁边看了一眼那行「别碰它」，哼了一声：「吓唬新手的。」'); }
            else await S.narr('你把登记簿合上，塞回了铁皮盒子里。');
          } },
          { x: 14, y: 1, spr: 'fssign', on: S => S.narr('国家森林管理处的木牌：\n「洞穴生态脆弱。请勿破坏洞内任何结构。」\n下面被人用小刀划了一道。') },
          { x: 12, y: 6, spr: 'cairn', on: S => S.narr('一堆垒起来的小石头，是上山路上的路标。\n最上面那块，被风吹得歪向一边。') }
        ],
        async enter(S, first) {
          if (!first) return;
          await S.narr('皮卡的车灯照着半山腰的岩壁。\n三月底的夜里，山风刮在脸上还是生疼。');
          await S.narr('岩壁底下，一扇锈迹斑斑的铁栅门，锁着那个老洞。');
          await S.say('B', '装备在后斗里。锤子、凿子都带上。今天争取凿开两段。');
          S.goal('从皮卡后斗拿上工具');
        },
        step(S, x, y) {
          if (S.f.trip === 2 && !S.f.dogEv && y <= 5 && S.has('hammer')) return dogEvent(S);
        }
      },
      /* ---------------- 老洞 ---------------- */
      cave: {
        amb: 'drone', dark: .93, plr: 3, wall: 'stone', wallC: { top: '#0c0a08', face: '#4a3f33', trim: '#28211a' }, darkC: '#030202',
        legend: { f: 'cfl', c: 'ccr', o: 'cbo' },
        rows: CAVE_ROWS,
        ents: [
          ...[0].flatMap(x => [6, 7].map(y => ({ x, y, spr: 'invisible', solid: false, async touch(S) {
            await S.think(S.f.phase === 'seal' ? '缝还没封上！它会跟出来的。' : S.f.phase === 'end' ? '……' : S.f.trip === 3 ? '……不。今天必须把它凿通。' : '活儿还没干完呢。');
            S.pos(1, S.pl.y, 2);
          } }))),
          { x: 4, y: 5, spr: 'soot', on: S => S.narr('有人用电石灯的黑烟在洞顶熏了一行字。\n「到此为止」\n下面是一个年份：1974。') },
          { x: 10, y: 2, spr: 'stal', decal: true, on: S => S.narr('钟乳石一根一根垂下来，尖上挂着水珠。\n一滴水要好几分钟才落下来一次。') },
          { x: 15, y: 2, spr: 'stal', decal: true, on: S => S.narr('这一排钟乳石被人敲断过几根，断口发白。\n洞穴俱乐部最恨这种人。') },
          { id: 'pile', x: 9, y: 9, spr: 'pile', s: { n: 0 }, on: S => S.narr(S.ent('pile').s.n ? '你们凿下来的碎石，在这里堆成了一个小坟包。' : 'B 说，凿下来的碎石都堆这儿。') },
          { id: 'tape', x: 21, y: 5, spr: 'tape', decal: true, hidden: true, async on(S) {
            if (S.f.phase === 'seal') return sealPrompt(S);
            const ph = S.ent('tape').s.ph;
            const t = { out: '布条哗啦啦地往外飘，冲着你的脸。\n——它在往外吹。这时候凿，灰全扑你脸上。', steady: '布条一直往外飘。风一刻都没有停过。', in: '布条笔直地指向缝里。\n——它在往里吸。这时候凿，灰会被吸进去。', calm: '布条软软地垂着。\n风停了一下。它在……换气？', dead: '布条垂着，一动不动。' }[ph] || '一截橙色的测量布条。';
            await S.narr(t + (S.ent('tape').s.mark ? '\n旁边的石壁上，刻着一个新的叉。' : ''));
          } },
          ...[1, 2, 3, 4, 5, 6].map(k => ({ id: 'seg' + k, x: SEGX(k), y: 6, spr: 'seam', solid: true, s: { k: 0 }, on: S => segOn(S, k) })),
          { id: 'mk3', x: 23, y: 5, spr: 'mark', sym: '叉', decal: true, hidden: true, on: S => S.narr('缝壁上刻着一个叉。\n刻痕里的石粉是白的。') },
          { id: 'mk6', x: 26, y: 5, spr: 'mark', sym: '抓痕', decal: true, hidden: true, on: S => S.narr('三道抓痕。指甲的宽度——如果那算是指甲的话。\n是从里往外抓的。') },
          { id: 'deepEnt', x: 27, y: 6, spr: 'invisible', solid: false, async touch(S) {
            if (S.f.phase === 'seal' || S.f.phase === 'end') { await S.think('身后是黑的。不能回去。'); S.pos(26, 6, 1); return; }
            if (S.f.phase !== 'through') return;
            await S.narr('缝的尽头，石头往下一折。\n你倒着身子，一点一点滑了出去——');
            await S.go('deep', 1, 3, 2);
          } },
          { id: 'bud', x: 2, y: 7, spr: '@bud', dir: 2, light: { r: 2.6, col: 'rgba(255,230,170,.12)' }, async on(S) {
            if (S.f.phase === 'end') return S.say('B', '走吧。回家。');
            if (S.f.trip === 2) return S.say('B', S.f.seg >= 3 ? '……那个叉。我们上次真没凿到那么深。' : '等它吸气。听，呼——停——吸——');
            return S.say('B', S.f.seg >= 1 ? ['编了号的石头别弄混了。', '最后拆的最先装。'] : '慢慢来。胳膊酸了就歇。');
          } }
        ],
        async enter(S, first) {
          S.speed(S.pl.x >= 21 ? CRAWL : 1);
          if (S.f.phase === 'seal') return;
          PH = '';
          if (S.f.trip === 1 && first) {
            S.place('bud', 2, 7, 2);
            await S.narr('洞口那一段还能弯着腰走。\n再往里，就得手脚并用了。');
            await S.say('B', '就在最里面。跟着我。');
            (async () => { try { await S.walk('bud', [19, 7], 4); S.face('bud', 2); } catch (e) { } })();
            S.goal('去洞厅尽头（往右）');
          } else if (S.f.trip === 2) {
            S.place('bud', 2, 7, 2); S.show('tape');
            (async () => { try { await S.walk('bud', [19, 7], 4); S.face('bud', 2); } catch (e) { } })();
            S.goal('去洞厅尽头的石缝');
          }
        },
        step(S, x, y) {
          S.speed(x >= 21 ? CRAWL : 1);
          if (S.f.trip === 1 && !S.f.tut1 && x >= 15) return tut1(S);
          if (S.f.trip === 2 && !S.f.tut2 && x >= 15) return tut2(S);
          if (S.f.trip === 3 && !S.f.t3a && x >= 15) return trip3Chamber(S);
          if (S.f.phase === 'seal' && x <= 20 && !S.f.sealAuto) { S.f.sealAuto = true; return sealPrompt(S); }
        },
        tick(S, dt) {
          WT += dt;
          const ph = windPhase(S.f.wmode, WT);
          if (ph !== PH) { PH = ph; setWind(S, ph); if (S.f.trip !== 3 || S.f.phase !== 'seal') windSound(S, ph, S.f.wmode); WIND_T = 0; }
          else if (ph === 'out' || ph === 'in' || ph === 'steady') { WIND_T += dt; if (WIND_T > (ph === 'steady' ? 2.4 : 3.2)) { WIND_T = 0; windSound(S, ph, S.f.wmode); } }
          if (S.f.phase === 'seal') {
            SCR_T -= dt;
            if (SCR_T <= 0) { const left = S.timerLeft ?? 30; SCR_T = 1.2 + left / 25; SND.scrape(S, 1.1, 1.6 - Math.min(1, left / 55)); if (left < 15) S.shake(200, 1); }
            return;
          }
          if (S.busy || S.f.tripDone || !S.f.trip) return;
          if (S.f.sta < STA_MAX) { if (S.f.sta <= 1) S.f.staLow = true; STA_T += dt; if (STA_T >= 1.3) { STA_T = 0; S.f.sta++; if (S.f.sta === STA_MAX && S.f.staLow) { S.f.staLow = false; S.toast('缓过劲来了（体力 ' + STA_MAX + '/' + STA_MAX + '）'); } } }
          if (S.f.trip === 3 && S.f.seg < 6 && S.f.t3a) {
            const deep = S.pl.x >= 23;
            if (deep && PH !== 'out') {
              AIR_T += dt;
              if (AIR_T >= AIR_STEP) {
                AIR_T = 0; S.f.air = Math.max(0, (S.f.air ?? AIR_MAX) - 1); airFx(S);
                if (S.f.air <= 0) S.run(blackout);
                else if (S.f.air === 3 && S.once('airTip')) S.run(async S => { await S.think('打火机的火苗矮了一截……\n缝里不吹风的时候，空气就不流动。\n等布条往外飘，退到缝口喘口气。'); });
                else S.toast(['', '眼前一阵阵发黑——快退出去！', '打火机的火苗缩成了一个蓝点', '火苗矮了一截。胸口发闷', '空气有点闷'][S.f.air] + '（空气 ' + S.f.air + '/' + AIR_MAX + '）');
              }
            } else if (deep) { AIR_T = Math.min(AIR_T, 0); }   // 缝深处吹风时：不再变差，但也缓不过来
            else if ((S.f.air ?? AIR_MAX) < AIR_MAX) {     // 退到缝口才喘得上气
              AIR_T -= dt;
              if (AIR_T <= -.6) { AIR_T = 0; S.f.air++; airFx(S); if (S.f.air === AIR_MAX) S.toast('你在缝口大口喘了几口气（空气 ' + AIR_MAX + '/' + AIR_MAX + '）'); }
            } else AIR_T = 0;
          }
        }
      },
      /* ---------------- 缝的那头 ---------------- */
      deep: {
        amb: 'none', dark: .95, plr: 3, wall: 'stone', wallC: { top: '#0a0807', face: '#3e352c', trim: '#221c16' }, darkC: '#020101',
        legend: { f: 'cfl', o: 'cbo', S: 'scr' },
        rows: DEEP_ROWS,
        ents: [
          { x: 2, y: 3, spr: 'coil', decal: true, on: S => S.narr('B 的绳子，一头拴在缝口一块凸出来的石角上，打了个双八字结。\n另一头，拴在你的腰上。') },
          { id: 'mural', x: 9, y: 5, w: 6, spr: 'mural', decal: true, on: muralOn },
          { x: 19, y: 6, spr: 'cairn', on: S => S.narr('一堆垒起来的石头，和洞外山路上的路标一模一样。\n可是谁会在这种地方指路？指给谁？') },
          { x: 17, y: 10, spr: 'cairn', on: S => S.narr('又一堆石头。最上面那块，放着一枚生了绿锈的铜扣子。') },
          { id: 'xstone', x: 23, y: 10, spr: 'xstone', solid: false, async on(S) {
            await S.narr('圆石脚下滚着一块方石头，和你凿下来的那几块差不多大。\n上面刻着一个叉。刻痕是白的。');
            const r = await S.ask('它看起来就像是……在等人捡起来。', ['揣进口袋', '别碰它']);
            if (r === 0) { S.hide('xstone'); S.give('stoneX'); await S.narr('你把它揣进了胸口的口袋。\n隔着衣服，它是温的。'); }
            else await S.narr('你把手缩了回来。');
          } },
          { id: 'gap', x: 25, y: 8, spr: 'gap', decal: true, hidden: true, on: S => S.narr('黑。') },
          { id: 'rrock', x: 25, y: 8, spr: 'rrock', light: { r: 1.4, dy: 6, col: 'rgba(150,170,180,.08)' }, on: rrockOn },
          { id: 'it', x: 26, y: 8, spr: '@it', dir: 1, hidden: true, solid: false },
          ...[1].map(() => ({ id: 'slope', x: 4, y: 6, spr: 'invisible', solid: false, touch: slopeTop }))
        ],
        async enter(S, first) {
          S.speed(1); S.plr(null);
          if (!first) return;
          S.f.wmode = 'dead';
          await S.narr('你从缝里滑出来，落在一块窄窄的岩台上。\n头灯往下照——是一个洞厅。比外面那个大得多。');
          await S.narr('没有风。没有水声。\n只有你自己的喘气声，被石壁弹回来，像是好几个人在喘。');
          await S.narr('你把 B 的绳子一头拴在缝口的石角上，一头拴在腰上，\n顺着碎石坡往下滑。');
          await S.walk('pl', [[4, 3], [4, 4], [4, 5], [4, 6], [5, 6]], 3);
          S.goal('看看这是什么地方（石壁上好像画着东西）');
          S.cp('deep');
        },
        tick(S, dt) {
          if (S.f.phase !== 'flee' || S.busy) return;
          FLK -= dt;
          if (FLK <= 0) { const dim = Math.random() < .3; FLK = dim ? .12 + Math.random() * .2 : .4 + Math.random() * .8; S.plr(dim ? 1.3 : 2.7); }
          WIND_T += dt; if (WIND_T > 2.8) { WIND_T = 0; SND.windIn(S, 1.4); }
        }
      },
      /* ---------------- 家 ---------------- */
      home: {
        amb: 'room', dark: .62, plr: 2.6, wall: 'paper', floor: 'wood', wallC: { face: '#5a5a4e', trim: '#2e2e26' }, darkC: '#06060c',
        tileOpts: { rugC: '#5a3a2a', woodC: '#5e4430' },
        rows: [
          '##############',
          '##############',
          '#wwwwwwwwwwww#',
          '#wwwwwwwwwwww#',
          '#wwwrrrrrwwww#',
          '#wwwrrrrrwwww#',
          '#wwwrrrrrwwww#',
          '#wwwwwwwwwwww#',
          '#wwwwwwwwwwww#',
          '##############'
        ],
        ents: [
          { id: 'pc', x: 1, y: 2, w: 2, spr: 'pcdesk', light: { r: 2.4, dx: 12, dy: -4, col: 'rgba(120,170,255,.12)' }, on: pcOn },
          { id: 'phone', x: 4, y: 2, spr: 'phone', on: S => S.narr(S.f.called ? '听筒还是温的。' : '电话。答录机上的红灯没有闪——这礼拜没人找你。') },
          { x: 3, y: 1, spr: 'poster', col: '#c8b88a', on: S => S.narr('墙上钉着一张地质调查局的地形图。\n那个老洞的位置，被你用红笔圈了三圈。') },
          { x: 7, y: 1, spr: 'window', on: S => S.narr('窗外是镇子的夜。加油站的灯牌一闪一闪。\n远处的山，黑得看不出轮廓。') },
          { id: 'door', x: 10, y: 1, spr: 'door', on: doorOn },
          { id: 'ropeD', x: 10, y: 2, spr: 'rope', hidden: true, solid: false, async on(S) {
            S.hide('ropeD'); S.give('rope');
            await S.narr('门口放着一卷蓝色的静力绳。\n上面用胶带贴着一张纸条，是 B 的字：「拴着。」');
          } },
          { id: 'closet', x: 12, y: 2, spr: 'wardrobe', col: '#5a4030', on: closetOn },
          { id: 'ctape', x: 12, y: 2, spr: 'tape', z: 1, ox: -6, oy: -6, solid: false, hidden: true, s: { ph: 'in' } },
          { id: 'bed', x: 11, y: 5, h: 2, spr: 'bed', col: '#4a5a6a', on: bedOn },
          { id: 'lampH', x: 9, y: 2, spr: 'lamp', light: { r: 3.2, dy: -6, col: 'rgba(255,220,150,.13)' }, on: S => S.narr('落地灯。灯罩上烫了个小洞，是去年抽烟的时候烫的。') },
          { x: 1, y: 7, spr: 'gearpile', on: S => S.narr('连体服、头盔、手套，摊在地上晾着。\n泥干了以后是灰白色的，像一层壳。') }
        ],
        async enter(S, first) {
          S.speed(1);
          if (S.f.home === 1 && first) {
            await S.narr('你回到镇上的出租屋，已经快四点了。\n手上的水泡破了，一攥拳头就疼。');
            await S.think('得把今天的事写下来。');
          } else if (S.f.home === 2) {
            await S.narr('出租屋里很安静。冰箱嗡嗡地响。\n你开着所有的灯，还是觉得房间的角落比平时黑。');
          }
          S.goal('把今天的事写进主页日志（电脑）');
        },
        tick(S, dt) {
          if (!S.f.dream || S.busy) return;
          WIND_T += dt; if (WIND_T > 3.4) { WIND_T = 0; SND.windIn(S, .5); }
        }
      }
    }
  });

  /* ---------------- 教学段 ---------------- */
  async function budCatchUp(S) {
    S.stop('bud'); const b = S.ent('bud');
    if (Math.round(b.px / TS) !== 19 || Math.round(b.py / TS) !== 7) { await S.walk('bud', [19, 7], 5.5); }
    S.face('bud', 2);
  }
  async function tut1(S) {
    S.f.tut1 = true;
    await budCatchUp(S);
    await S.narr('爬过一段只容一个人的窄道，眼前豁然一宽。\n是个不大的洞厅，钟乳石像一排獠牙。');
    S.focus(21, 6);
    SND.windOut(S, .9);
    await S.narr('洞厅东头的石壁上，裂着一道缝。\n不到一拃宽。风从里面往外吹，呜呜地响。');
    await S.say('B', '就是它。');
    await S.narr('B 掏出打火机凑到缝口。\n火苗一下子被按平了，往你们这边倒。');
    S.show('tape'); S.sfx('cut');
    await S.narr('他从兜里扯出一截橙色的测量布条，系在缝口上方的石头尖上。\n布条哗啦啦地往外飘。');
    S.focus(null);
    await S.say('B', ['风这么大，后面肯定有个大洞厅。', '一锤一锤来。胳膊酸了就歇，别逞强。碎石我来拖。']);
    await S.think('面对石缝按调查键凿。\n累了就停下来喘口气——体力会慢慢回来。');
    segGoal(S);
    S.cp();
  }
  async function tut2(S) {
    S.f.tut2 = true;
    await budCatchUp(S);
    await S.narr('布条还系在缝口上方。\n可它不再一股劲儿往外飘了——');
    S.focus(21, 6);
    SND.windOut(S, 1); await S.wait(900); SND.windIn(S, 1);
    await S.narr('它往外飘一阵，垂下来，又笔直地指向缝里。\n往外，停，往里，停。');
    await S.say('B', ['……它在喘气。', '听着，咱们这么干：它往里吸的时候凿，灰就被吸进去了。', '它往外吹的时候别凿——灰全扑你脸上，呛得你半天缓不过来。']);
    S.focus(null);
    await S.think('看布条：往缝里飘的时候凿，往外飘的时候歇。');
    segGoal(S);
  }
  async function blackout(S) {
    S.amb('none'); SND.thump(S, 2, .08);
    await S.fade(1, 700);
    await S.narr('火苗灭了。\n你眼前一黑——');
    S.f.air = AIR_MAX; S.f.sta = 0; airFx(S);
    S.speed(1); S.pos(19, 6, 2);
    await S.wait(500);
    await S.fade(0, 900);
    S.amb('drone');
    await S.narr('你醒过来的时候，仰面躺在洞厅里。\n离缝口有两米远。');
    await S.think('……我是怎么爬出来的？\n脚踝上，有一圈冰凉的、被攥过的感觉。');
    await S.think('不能在缝里待太久。往外吹风的时候退出来喘口气。');
  }
})();
