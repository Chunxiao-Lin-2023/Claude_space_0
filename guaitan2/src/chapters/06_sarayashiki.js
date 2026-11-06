/* ================= 第六夜 · 番町皿屋敷 ================= */
(() => {
  /* ---------------- 常量 ---------------- */
  const KN = ['', '一', '二', '三', '四', '五', '六', '七', '八', '九', '十'];
  const CT = 1.5, NT = 2.4, WT = 3.2, QT = 2.6;          // 数一枚 / 九枚停顿 / 哭 / 两轮之间的安静（秒，真人时间）
  const WELL = [11, 7];
  const NIWA = [
    '######################',
    '######################',
    '##############"#######',
    '#lllllllllllll"#######',
    '#"""k""""""""""kkkkkk#',
    '#""""k""""""""k"k""""#',
    '#""P""k""""""k"""""BB#',
    '#"""""""kk"""""""""""#',
    '#""""""""""""""""""""#',
    '#B""""K""""""""""P"""#',
    '#""""""""""""~~K"""""#',
    '#"""""""""""~~~""""""#',
    '######################'];
  /* 挡住井口视线的实体（石灯笼、柴屋、小祠、柴堆、户袋）；水面不挡 */
  const BLK = new Set(['7,5', '14,6', '2,11', '3,11', '16,11', '19,11', '1,3']);
  const LOSB = new Set([...'#PKBT']);
  /* 井口「看得见」的格子：从井口到该格两个方向的直线都不被挡（地图是静态的，开局算一次） */
  const VIS = (() => {
    const blk = (x, y) => LOSB.has(NIWA[y][x]) || BLK.has(x + ',' + y);
    const line = (x0, y0, x1, y1) => { const p = []; const dx = Math.abs(x1 - x0), dy = -Math.abs(y1 - y0), sx = x0 < x1 ? 1 : -1, sy = y0 < y1 ? 1 : -1; let err = dx + dy; for (;;) { p.push([x0, y0]); if (x0 === x1 && y0 === y1) break; const e2 = 2 * err; if (e2 >= dy) { err += dy; x0 += sx; } if (e2 <= dx) { err += dx; y0 += sy; } } return p; };
    const clear = (a, b) => line(a[0], a[1], b[0], b[1]).slice(1, -1).every(([x, y]) => !blk(x, y));
    const out = new Set();
    for (let y = 0; y < NIWA.length; y++) for (let x = 0; x < NIWA[0].length; x++) {
      if (!'"lk'.includes(NIWA[y][x]) || BLK.has(x + ',' + y) || (x === WELL[0] && y === WELL[1])) continue;
      if (clear(WELL, [x, y]) && clear([x, y], WELL)) out.add(x + ',' + y);
    }
    return out;
  })();
  /* 视线薄雾：每 3 格一个贴地实体（实体离屏 3 格内才画，所以不能用一整张大图） */
  const GZM = {};
  const GZ_ENTS = [];
  for (let y = 2; y < NIWA.length; y++) for (let x0 = 1; x0 <= 20; x0 += 3) {
    let m = 0; for (let i = 0; i < 3; i++) if (VIS.has((x0 + i) + ',' + y)) m |= 1 << i;
    if (m) { GZM[x0 + ',' + y] = m; GZ_ENTS.push({ x: x0, y, spr: 'gaze', decal: true, solid: false }); }
  }
  const seen = p => VIS.has(p.x + ',' + p.y);
  /* 正在迈步时按「要迈进的那一格」算（从暗处一步迈进亮处也算在她眼皮底下动） */
  const seenGo = p => seen(p) || (p.mv && VIS.has(p.mv.tx + ',' + p.mv.ty));
  const nearWell = p => Math.max(Math.abs(p.x - WELL[0]), Math.abs(p.y - WELL[1])) <= 1;
  const cycle = (S, key, lines) => lines[(S.f[key] = ((S.f[key] ?? -1) + 1) % lines.length)];
  /* 死亡计数写进当前检查点（S.f 会在重来时被检查点覆盖），用于重来后的提示 */
  function bumpDeath(S, key) { if (W.cp && W.cp.f) W.cp.f[key] = (W.cp.f[key] || 0) + 1; }
  let GZC = { t: -1, v: 0 };
  function gzLevel() { if (GZC.t === RT) return GZC.v; const m = curMap(), w = m && m.ents.find(z => z.id === 'well'); GZC = { t: RT, v: (w && w.s && w.s.gz) || 0 }; return GZC.v; }

  /* ---------------- 合成音（S.tone，双方都听得到） ---------------- */
  const TONE = {
    /* 井底的女声「いちまい……」：两三个音节往下滑，尾音发颤；后面一声瓷盘轻轻放下的「叮」 */
    count(S, n, v = 1) {
      const a = .075 * v, f = 400 - (n % 2) * 22 - (n >= 8 ? 26 : 0);
      S.tone('sine', f * 1.06, f, .3, a, 0, 2400); S.tone('triangle', f * 2.12, f * 2, .28, a * .22, 0, 2800);
      S.tone('sine', f * .96, f * .86, .6, a, .33, 1900); S.tone('sine', f * .962, f * .84, .6, a * .45, .35, 1500);
      S.tone('sine', f * .86, f * .8, .5, a * .5, .9, 1200);
      if (n < 10) { S.tone('triangle', 3150, 3100, .22, .032 * v, 1.0); S.tone('sine', 4700, 4650, .16, .014 * v, 1.01); }
    },
    /* 「九枚……」拖长、断掉 */
    nine(S, v = 1) { const a = .08 * v; S.tone('sine', 360, 340, .5, a, 0, 2000); S.tone('sine', 330, 250, 1.4, a, .5, 1600); S.tone('sine', 332, 246, 1.4, a * .5, .52, 1200); S.tone('triangle', 3150, 3100, .22, .03 * v, 1.9); },
    /* 抽泣：一串往下掉的颤音 */
    sob(S, v = 1) { for (let i = 0; i < 6; i++) { const t = i * .46 + (i % 2) * .08, f = 520 - i * 18; S.tone('sine', f, f * .62, .38, .06 * v, t, 1700); S.tone('sine', f * 1.01, f * .6, .36, .025 * v, t + .03, 1300); } },
    drip(S, v = 1) { S.tone('sine', 1500, 640, .08, .05 * v, 0, 3200); S.tone('sine', 900, 500, .12, .02 * v, .05, 2000); },
    /* 寺里的晨钟 */
    kane(S) { S.tone('sine', 104, 102, 4, .14, 0, 600); S.tone('sine', 208, 205, 2.8, .05, 0, 900); S.tone('sine', 313, 309, 1.8, .025, 0, 1300); },
    /* 鸡叫 */
    cock(S) { S.tone('sawtooth', 620, 880, .18, .03, 0, 2200); S.tone('sawtooth', 880, 990, .3, .03, .2, 2200); S.tone('sawtooth', 990, 560, .55, .03, .52, 2000); },
    /* 盘子碰在一起：清亮的两声 */
    clink(S, v = 1) { S.tone('triangle', 2900, 2860, .25, .05 * v, 0); S.tone('sine', 4400, 4350, .2, .02 * v, .01); S.tone('triangle', 3300, 3250, .2, .03 * v, .12); },
    /* 十枚补齐：十声由低到高的「叮」 */
    ten(S) { for (let i = 0; i < 10; i++) S.tone('triangle', 1400 + i * 140, 1390 + i * 140, .5, .045, i * .13); S.tone('sine', 392, 390, 2.6, .05, 1.4, 1600); S.tone('sine', 588, 585, 2.2, .03, 1.45, 1800); }
  };

  /* ---------------- 惊吓大头像 ---------------- */
  const FACES = {
    /* 阿菊：湿透的长发一绺一绺贴在脸上，只露出一只睁得很大的眼睛；下巴底下双手捧着一枚青花盘子（月和雁） */
    okiku(R, a) {
      const H = '#09080d', HL = '#262a36', SK = '#e2e7ec', SK2 = '#b6bfc8', SK3 = '#8692a0', WT = 'rgba(160,190,225,.85)', PL = '#eef2f6', BL = '#2a4a9a';
      R(5, 0, 22, 4, H); R(3, 3, 26, 29, H); R(1, 10, 30, 22, H);
      R(6, 4, 1, 26, HL); R(25, 4, 1, 26, HL);
      R(10, 5, 12, 4, SK); R(9, 9, 14, 12, SK); R(10, 21, 12, 3, SK); R(12, 24, 8, 1, SK); R(19, 6, 3, 17, SK2);
      R(9, 5, 2, 18, H); R(21, 5, 2, 16, H); R(13, 4, 1, 9, H); R(16, 4, 2, 13, H); R(19, 4, 1, 7, H);
      R(11, 12, 4, 3, SK3); const ew = a < .2 ? 1 : 3; R(11, 13 - (ew >> 1), 4, ew, '#f4f4ee'); R(13, 13, 1, 1, '#0c0c10');
      R(18, 13, 3, 1, '#5a6070'); R(19, 13, 1, 1, '#d8dce0');
      R(14, 17, 2, 1, SK3);
      const mh = 1 + Math.round(a * 3); R(12, 20, 7, mh, '#1a1018'); R(12, 20 + mh, 7, 1, SK2);
      R(10, 23, 1, 2 + Math.round(a * 4), WT); R(20, 22, 1, 2 + Math.round(a * 5), WT); R(15, 21 + mh, 1, Math.round(a * 4), WT);
      R(6, 27, 20, 5, PL); R(8, 26, 16, 1, PL); R(7, 27, 18, 1, BL); R(8, 28, 16, 3, '#dde5ee');
      R(19, 28, 3, 2, '#fbfbf2'); R(10, 29, 1, 1, BL); R(12, 28, 1, 1, BL); R(14, 29, 1, 1, BL);
      R(4, 28, 3, 3, SK2); R(25, 28, 3, 3, SK2);
      R(3, 31, 1, 1, WT); R(28, 30, 1, 2, WT);
    }
  };

  /* ---------------- 人物 ---------------- */
  const OKI = { skin: '#e4e8ee', hair: '#0a090e', hs: 'long', top: '#e6e8ee', top2: '#c4c8d4', robe: true, ghost: true, noFeet: true, mouth: '#4a3a44' };
  const PEOPLE6 = {
    me: { key: 'sr-me', skin: '#f0cca4', hair: '#1a1414', hs: 'bun', top: '#6a5a86', top2: '#3e3256', robe: true, apron: '#3a4a66', shoes: '#c8b48a',
      extra(g, d, fr, G, R) { if (d === 0) { R(4, G.tT + 1, 8, 1, '#c84a4a'); R(10, G.hT - 2, 3, 1, '#c84a4a'); } else if (d === 1) R(9, G.hT - 2, 3, 1, '#c84a4a'); } },
    yahei: { key: 'sr-yahei', skin: '#d4a47c', hair: '#bdb8ae', hs: 'short', top: '#5a4a38', top2: '#3a3024', robe: true, shoes: '#8a7a5a', eye: '#2a1e18',
      extra(g, d, fr, G, R) { if (d === 0) { R(5, G.hT + 7, 6, 1, '#a89e90'); R(4, G.tT + 4, 8, 1, '#2a2218'); } else if (d === 1) R(3, G.hT + 6, 3, 1, '#a89e90'); } },
    okiku: Object.assign({ key: 'sr-okiku', cover: true,
      extra(g, d, fr, G, R) { if (d === 0) { R(5, G.tT + 3, 6, 2, '#eef2f6'); R(6, G.tT + 3, 4, 1, '#2a4a9a'); } } }, OKI),
    okikuU: Object.assign({ key: 'sr-okikuU', eye: '#1a1a24',
      extra(g, d, fr, G, R) { if (d === 0) { R(5, G.hT + 1, 1, 8, '#0a090e'); R(9, G.hT + 1, 1, 6, '#0a090e'); R(7, G.hT + 1, 1, 3, '#0a090e'); R(6, G.hT + 4, 1, 1, '#e8ecf0'); R(5, G.tT + 3, 6, 2, '#eef2f6'); R(6, G.tT + 3, 4, 1, '#2a4a9a'); } } }, OKI)
  };
  /* 数到九：她整个儿从井里升起来，比人高出一截 */
  PEOPLE6.okikuB = Object.assign({}, PEOPLE6.okikuU, { key: 'sr-okikuB', big: true });

  /* ---------------- 自定义精灵 ---------------- */
  /* 井上那圈小盘子：数到第几枚亮几枚；她抬头（偶数）时整圈泛青、最新那枚闪，低头（奇数）时是白的——报数的人一眼就知道能不能走 */
  const PLATE = (R, x, y, on, red, up, last) => { if (on) { R(x - 2, y - 1, 5, 3, up ? (last ? '#9ec4ff' : '#b8cce8') : '#e4ebf2'); R(x - 1, y, 3, 1, up ? '#1a3a8a' : '#3a5a9a'); if (up && last) R(x - 3, y - 2, 7, 1, 'rgba(160,200,255,.6)'); } else { R(x - 2, y, 5, 1, red ? '#c03030' : 'rgba(200,215,235,.28)'); } };
  const ARC = Array.from({ length: 10 }, (_, i) => { const th = Math.PI * (1.12 + i * .076); return [Math.round(8 + Math.cos(th) * 26), Math.round(-20 + Math.sin(th) * 9)]; });
  const SPRITES = {
    /* 番町的井：方形木井桁、两根柱子和横梁、辘轳和井绳；盖板（白天）；头顶一圈「数到第几枚」的小盘子 */
    ido(g, e, t, R) {
      R(-1, 14, 18, 2, 'rgba(0,0,0,.35)');
      R(0, 4, 16, 11, '#4a4844'); R(1, 5, 14, 9, '#5a5852');
      R(2, 5, 12, 7, '#05060a');
      if (!e.lid && e.gz) { const k = (t * 1.5) % 1; R(4, 8, 8, 1, `rgba(150,185,255,${.2 + k * .2})`); }
      R(-1, 2, 18, 3, '#6a5034'); R(-1, 2, 18, 1, '#8a6a44'); R(-1, 12, 18, 3, '#5a4028'); R(-1, 2, 3, 13, '#5e4630'); R(14, 2, 3, 13, '#5e4630');
      if (e.lid) { R(1, 4, 14, 9, '#7a5e3c'); R(1, 7, 14, 1, '#5a4228'); R(1, 10, 14, 1, '#5a4228'); R(4, 5, 8, 5, '#86847c'); R(5, 5, 6, 1, '#a09e96'); R(6, 6, 3, 3, '#d8c890'); R(7, 7, 1, 1, '#a03020'); }
      R(0, -14, 2, 17, '#3e2c1c'); R(14, -14, 2, 17, '#3e2c1c'); R(-1, -16, 18, 3, '#2e2014'); R(-1, -16, 18, 1, '#4a3420'); R(6, -13, 4, 3, '#6a6a64'); R(7, -12, 2, 1, '#2a2a28');
      R(8, -10, 1, e.lid ? 14 : 18, '#8a7a5a');
      if (!e.lid) { R(12, 1, 4, 3, '#6a5034'); R(12, 1, 4, 1, '#8a6a44'); }
      if (e.pl) { R(3, 1, 7, 3, '#e8eef4'); R(4, 1, 5, 1, '#fbfbf2'); R(5, 2, 3, 1, '#3a5a9a'); R(4, 3, 1, 1, '#c8b890'); R(8, 2, 1, 1, '#c8b890'); }
      if (e.n) { const up = e.n < 10 && e.n % 2 === 0 || e.n === 9; for (let i = 0; i < 10; i++) PLATE(R, ARC[i][0], ARC[i][1], i < e.n, i === 9 && e.n === 9 && Math.sin(t * 10) > 0, up, i === e.n - 1 && Math.sin(t * 8) > -.3); }
    },
    gaze(g, e, t, R) {
      const L = gzLevel(); if (!L) return;
      const m = GZM[Math.round(e.px / TS) + ',' + Math.round(e.py / TS)]; if (!m) return;
      const A = [0, .1, .22, .3, .46][L] * (L === 3 ? .7 + .3 * Math.sin(t * 9) : 1);
      for (let i = 0; i < 3; i++) if (m & (1 << i)) {
        R(i * 16, 0, 16, 16, `rgba(150,185,255,${A.toFixed(3)})`);
        if (L >= 2) R(i * 16 + (((t * 9 + i * 5 + e.px * .1) % 14) | 0), 8 + (i % 2) * 3, 2, 1, `rgba(225,238,255,${(A * 1.4).toFixed(3)})`);
      }
    },
    /* 碎片：草里一点白，偶尔闪一下 */
    kakera(g, e, t, R) {
      R(5, 10, 6, 3, '#e8eef4'); R(6, 9, 3, 1, '#e8eef4'); R(6, 11, 3, 1, '#2a4a9a'); R(4, 13, 8, 1, 'rgba(0,0,0,.3)');
      const k = (t * 1.3 + e.px * .03) % 2.2; if (k < .5) { const a = Math.sin(k / .5 * Math.PI); R(7, 6, 1, 7, `rgba(220,235,255,${a * .8})`); R(4, 10, 7, 1, `rgba(220,235,255,${a * .8})`); }
    },
    tobukuro(g, e, t, R) { box(R, 1, -14, 14, 29, '#4a3826'); for (let y = -12; y < 14; y += 5) R(2, y, 12, 1, '#3a2a1a'); R(1, -14, 14, 1, '#6a5034'); },
    hokora(g, e, t, R) {   // 小祠：石座、木龛、小屋顶
      R(2, 10, 12, 5, '#5a5852'); R(3, 10, 10, 1, '#6a6862'); box(R, 4, 1, 8, 9, '#6a4a2c'); R(5, 3, 6, 6, '#1a120c');
      R(1, -2, 14, 3, '#3a3a40'); R(3, -4, 10, 2, '#4a4a50'); R(7, 4, 2, 4, '#d8c8a0'); R(6, 9, 4, 1, '#e8e0d0');
    },
    monooki(g, e, t, R) {  // 柴屋（2×1）
      box(R, 0, -10, 32, 25, '#4a3624'); for (let x = 2; x < 31; x += 4) R(x, -8, 1, 22, '#3a2818');
      R(-2, -16, 36, 7, '#26282c'); R(-2, -16, 36, 1, '#3a3c42'); R(12, -2, 9, 16, '#1a120c'); R(13, -1, 7, 1, '#3a2818');
    },
    woodpile(g, e, t, R) { for (let r = 0; r < 3; r++) for (let i = 0; i < 4; i++) { R(i * 4, 2 + r * 4, 4, 4, '#5a3c22'); R(i * 4 + 1, 3 + r * 4, 2, 2, '#9a7a4a'); } },
    namako(g, e, t, R) {   // 土蔵的白墙和海参墙（なまこ壁）
      R(0, -2, 16, 18, '#d8d4c8'); R(0, 8, 16, 8, '#3a3a40');
      for (let x = -4; x < 16; x += 6) { R(x + 2, 9, 4, 1, '#e8e4dc'); R(x + 3, 10, 2, 4, '#e8e4dc'); R(x + 2, 14, 4, 1, '#e8e4dc'); }
      R(0, -2, 16, 1, '#b8b4a8');
    },
    kuradoor(g, e, t, R) {
      R(0, -2, 16, 18, '#d8d4c8'); box(R, 1, -1, 14, 17, '#e4e0d6'); R(2, 0, 12, 15, e.open ? '#0a0806' : '#5a4630');
      if (!e.open) { R(7, 0, 2, 15, '#3a2a1a'); R(4, 6, 3, 3, '#2a2a2c'); R(9, 6, 3, 3, '#2a2a2c'); R(6, 8, 4, 2, '#7a7a74'); }
      R(0, -4, 16, 2, '#2a2a30');
    },
    fusuma(g, e, t, R) { R(0, -2, 16, 16, '#3a2a1a'); R(1, -1, 7, 14, '#c8bc9a'); R(8, -1, 7, 14, '#c8bc9a'); R(2, 2, 5, 4, '#a89a78'); R(9, 6, 5, 4, '#a89a78'); R(6, 5, 1, 2, '#2a2a2c'); R(9, 5, 1, 2, '#2a2a2c'); },
    /* 障子：sh = 映在纸上的人影（跪坐、往前递盘子） */
    shoji(g, e, t, R) {
      R(0, -2, 16, 16, '#4a3626'); R(1, -1, 14, 14, e.lit ? '#f0dcae' : '#cfc6ae');
      if (e.sh) { const k = Math.sin(t * 1.6) > 0 ? 1 : 0; const C = 'rgba(30,24,30,.75)'; R(4, 1, 5, 4, C); R(3, 2, 2, 8, C); R(4, 5, 7, 7, C); R(9 + k, 7, 4, 2, C); R(12 + k, 6, 3, 3, C); }
      for (let x = 4; x < 15; x += 4) R(x, -1, 1, 14, '#5a4636'); for (let y = 3; y < 13; y += 4) R(1, y, 14, 1, '#5a4636');
    },
    tokonoma(g, e, t, R) {   // 床之间（2×1）：挂轴（月和三只雁），下面一只空的皿立
      R(0, -2, 32, 16, '#2a2018'); R(1, -1, 30, 14, '#3a3026'); R(1, 11, 30, 2, '#5a4632');
      R(10, -1, 10, 11, '#d8cfb4'); R(10, -1, 10, 1, '#6a4a2a'); R(10, 9, 10, 1, '#6a4a2a'); R(16, 1, 3, 3, '#f0ece0'); R(16, 1, 3, 1, '#c8c0a8');
      R(11, 5, 2, 1, '#3a3a40'); R(13, 4, 2, 1, '#3a3a40'); R(15, 6, 2, 1, '#3a3a40');
      R(23, 6, 6, 1, '#6a4a2a'); R(24, 3, 1, 4, '#6a4a2a'); R(28, 3, 1, 4, '#6a4a2a'); R(25, 5, 3, 1, 'rgba(255,255,255,.08)');
    },
    andon(g, e, t, R) {   // 行灯
      R(3, 13, 10, 2, '#2a2018'); R(4, 12, 1, 3, '#3a2a1a'); R(11, 12, 1, 3, '#3a2a1a');
      R(4, -4, 8, 16, e.lit ? '#f4d890' : '#d4c8a4'); R(4, -4, 8, 1, '#3a2a1a'); R(4, 4, 8, 1, '#5a4632'); R(7, -4, 1, 16, 'rgba(90,70,50,.5)');
      if (e.lit) { const f = Math.sin(t * 13) > 0 ? 1 : 0; R(7, 4 + f, 2, 3 - f, '#ffcf6a'); }
    },
    byobu(g, e, t, R) {   // 屏风（2×1）：金底，右上一轮月，三只雁
      for (let i = 0; i < 4; i++) { const y = i % 2 ? 1 : -1; R(i * 8, -14 + y, 8, 28, i % 2 ? '#b89a4a' : '#c8aa58'); R(i * 8, -14 + y, 8, 1, '#7a5e2a'); R(i * 8, 13 + y, 8, 1, '#5a4420'); }
      R(22, -10, 6, 6, '#f0ece0'); R(4, -2, 2, 1, '#2a2a2c'); R(7, -4, 2, 1, '#2a2a2c'); R(10, -6, 2, 1, '#2a2a2c'); R(3, 6, 1, 6, '#6a7a4a'); R(5, 5, 1, 7, '#6a7a4a'); R(20, 8, 8, 1, '#4a6a8a'); R(18, 10, 10, 1, '#4a6a8a');
    },
    katana(g, e, t, R) { R(2, 10, 12, 4, '#2a1a12'); R(3, 2, 2, 9, '#2a1a12'); R(11, 2, 2, 9, '#2a1a12'); R(1, 1, 14, 1, '#3a2418'); R(1, 5, 14, 1, '#3a2418'); },
    kamado(g, e, t, R) {   // 竈和饭釜
      box(R, 0, 1, 16, 14, '#8a6a52'); R(2, 9, 6, 5, '#1a0c08'); R(9, 9, 5, 5, '#1a0c08');
      if (!e.off) { const f = Math.sin(t * 9) > 0 ? 1 : 0; R(3, 11 + f, 4, 3 - f, '#ff8a2a'); R(10, 12, 3, 2, '#c85a1a'); }
      R(2, -3, 7, 5, '#2a2a2c'); R(1, -4, 9, 2, '#6a4a2a'); R(10, -1, 5, 3, '#3a3a3c');
      R(4 + Math.sin(t * 2) * 1.5, -9 - ((t * 5) % 6), 3, 2, 'rgba(220,220,220,.25)');
    },
    irori(g, e, t, R) {   // 围炉里（2×1）+ 自在钩上的铁瓶
      box(R, 0, 3, 32, 12, '#4a3a2a'); R(3, 5, 26, 8, '#3a3836'); R(5, 6, 22, 6, '#2a2624');
      for (let i = 0; i < 4; i++) { const h = 1 + (((Math.sin(t * 7 + i * 2.1) + 1) * 1.5) | 0); R(9 + i * 4, 11 - h, 3, h, i % 2 ? '#e86a2a' : '#ffa040'); }
      R(15, -16, 2, 14, '#2a2018'); R(11, -4, 10, 7, '#1e1e20'); R(12, -3, 8, 1, '#3a3a3c'); R(20, -2, 3, 1, '#1e1e20');
    },
    yuka(g, e, t, R) {   // 翘起一角的榻榻米；夜里缝里渗水
      R(1, 1, 14, 14, '#b8aa6c'); R(1, 1, 14, 1, '#d8ca8a'); R(1, 1, 1, 14, '#6a5a2a'); R(12, 1, 3, 3, '#2a2010');
      if (e.wet) { R(3, 12, 10, 3, 'rgba(60,80,110,.55)'); const k = (t * 1.2) % 1; R(13, 2 + k * 10, 1, 2, 'rgba(170,200,235,.8)'); }
    },
    sarabako(g, e, t, R) {   // 桐木皿箱，盖上墨书「十枚」
      R(0, 9, 16, 6, '#4a3624'); box(R, 1, 1, 14, 10, '#d8c8a0'); R(1, 1, 14, 2, '#e8dab4');
      if (e.open) { for (let i = 0; i < 3; i++) { R(3 + i * 4, 3, 3, 6, '#eef2f6'); R(4 + i * 4, 5, 1, 2, '#3a5a9a'); } }
      else { R(5, 4, 1, 4, '#1a1410'); R(4, 5, 3, 1, '#1a1410'); R(9, 4, 3, 1, '#1a1410'); R(10, 4, 1, 4, '#1a1410'); R(9, 6, 3, 1, '#1a1410'); R(1, 6, 14, 1, '#8a3a2a'); }
    },
    daiba(g, e, t, R) {   // 作业台（2×1）：刮刀、碗、蜡烛
      R(1, 12, 30, 3, 'rgba(0,0,0,.3)'); box(R, 0, 2, 32, 9, '#6a5034'); R(2, 11, 2, 4, '#4a3624'); R(28, 11, 2, 4, '#4a3624');
      R(5, 3, 6, 3, '#d8d0c0'); R(14, 4, 7, 1, '#9a9a94'); R(26, -3, 2, 6, '#e8e0c8'); const f = Math.sin(t * 12) > 0 ? 1 : 0; R(26, -6 + f, 2, 3 - f, '#ffc060');
      if (e.done) { R(13, 2, 8, 5, '#eef2f6'); R(15, 3, 4, 2, '#3a5a9a'); R(16, 2, 1, 5, '#d8d0b8'); }
    },
    nagamochi(g, e, t, R) { R(0, 12, 32, 3, 'rgba(0,0,0,.3)'); box(R, 0, 0, 32, 13, '#3a2418'); R(1, 1, 30, 2, '#4a3020'); R(4, 5, 4, 3, '#7a6a4a'); R(24, 5, 4, 3, '#7a6a4a'); R(14, 4, 4, 4, '#2a2a2c'); },
    tana(g, e, t, R) { R(0, -10, 16, 25, '#3a2a1c'); for (let y = -8; y < 14; y += 7) { R(1, y + 5, 14, 1, '#5a4430'); R(2, y, 5, 5, e.col || '#8a7a5a'); R(9, y + 1, 5, 4, '#a89870'); } },
    mado(g, e, t, R) { R(3, 1, 10, 8, '#1a2030'); R(3, 1, 10, 8, 'rgba(150,170,210,.25)'); for (let x = 4; x < 13; x += 3) R(x, 1, 1, 8, '#2a2a2c'); R(2, 0, 12, 1, '#c8c4b8'); R(2, 9, 12, 1, '#c8c4b8'); },
    rat(g, e, t, R) { const k = Math.sin(t * 3 + e.px) > .8 ? 1 : 0; R(5 + k, 11, 6, 3, '#4a4440'); R(10 + k, 10, 3, 3, '#4a4440'); R(12 + k, 11, 1, 1, '#c02020'); R(1 + k, 12, 4, 1, '#6a5a50'); }
  };

  defChapter({
    id: 'sarayashiki', n: 6, title: '番町皿屋敷', sub: '「一枚……两枚……」井底下有人在数盘子，数到九，就哭。', origin: '江户怪谈', color: '#1c2a44',
    amb: 'night', floor: 'wood', wall: 'shoji', dark: .5, plr: 3.4, darkC: '#04060c',
    endings: { jumai: '十枚', kotoba: '四十年后的一句话', ido: '井边的木屐' },
    thumb(g, w, h) {   // 井口上方一圈九枚发光的盘子，第十个空位，底下是她的脸
      const s = Math.max(2, Math.floor(h / 46)), ox = Math.round(w / 2 - 16 * s), oy = Math.round((h - 22) / 2 - 8 * s);
      const gr = g.createRadialGradient(w / 2, oy + 18 * s, 2, w / 2, oy + 18 * s, 24 * s); gr.addColorStop(0, 'rgba(150,185,255,.35)'); gr.addColorStop(1, 'rgba(150,185,255,0)'); g.fillStyle = gr; g.fillRect(0, 0, w, h);
      FACES.okiku((x, y, ww, hh, c) => { g.fillStyle = c; g.fillRect(ox + x * s, oy + y * s, ww * s, hh * s); }, .7);
      for (let i = 0; i < 10; i++) { const th = Math.PI * (1.1 + i * .08), x = w / 2 + Math.cos(th) * 20 * s, y = oy + 4 * s + Math.sin(th) * 7 * s; g.fillStyle = i < 9 ? '#e4ebf2' : '#c03030'; g.fillRect(Math.round(x - 2 * s), Math.round(y), i < 9 ? 5 * s : 5 * s, i < 9 ? 2 * s : s); if (i < 9) { g.fillStyle = '#3a5a9a'; g.fillRect(Math.round(x - s), Math.round(y), 2 * s, s); } }
    },
    people: PEOPLE6,
    faces: FACES,
    sprites: SPRITES,
    items: {
      kagi: { name: '土蔵的钥匙', desc: '一把巴掌长的铁钥匙，锈得发红。拴钥匙的红绳是新换的——弥平爷换的。' },
      ko: { name: '碎片·甲', desc: '一块盘沿的碎片（背面你用炭写了「甲」）。一圈唐草纹边，里面大半是空白，只有一道淡淡的蓝色弧线——弧线里面留白，外面晕着一层淡蓝。' },
      otsu: { name: '碎片·乙', desc: '巴掌大的一片，像是盘心（背面写了「乙」）。三个小小的蓝色「へ」字，一个比一个高，斜着排成一行。' },
      hei: { name: '碎片·丙', desc: '一片盘沿（背面写了「丙」）。几根细长的蓝线从边上斜伸进来，顶上垂着毛茸茸的穗子。' },
      tei: { name: '碎片·丁', desc: '一片盘沿（背面写了「丁」）。几道弯弯曲曲的蓝线，一道压着一道，线头卷起小小的白花。' },
      tenugui: { name: '旧手巾', desc: '一条褪了色的蓝白手巾，小孩用的尺寸。一角用红线歪歪扭扭地绣着一个「弥」字。' },
      sokui: { name: '续饭', desc: '熟饭粒在木板上用刮刀碾成的浆。补碗补盘子都用它，干得快，得趁湿用。' },
      sara: { name: '补好的盘子', desc: '四片碎片拼回了一枚盘子。右上一轮满月，三只雁朝着月亮飞。裂缝里的续饭干成了白线，像月光照出来的路。' }
    },
    notes: {
      kawaraban: { title: '旧瓦版「番町怪井之事」', text: '（一张旧瓦版，纸边发黄，弥平爷说是好些年前在街上买的）\n\n番町青山某之宅，有侍女名菊。\n家传之皿十枚，碎其一枚。主人大怒——\n（这里有几行被墨涂掉了）\n——菊遂没于井中。\n\n自是每夜，井中有女声：\n「一枚……二枚……」\n数至九枚，放声大哭。闻者无不毛骨悚然。\n未几，青山家断绝。\n\n又闻：有高僧夜坐井畔，候其数至九，大喝一声「十！」，女鬼遂寂然。\n又闻：有好事者伏井边窃听，数至九，人竟不见，唯余木屐一只。\n\n——好事者，慎之！' },
      tegami: { title: '没寄出的信', text: '（押入深处，旧针线盒的夹层里。字写得很小，很用心）\n\n母亲大人：\n\n我到青山老爷府上，已经三年了。\n府里规矩多，可大家待我都好。\n\n老爷有十枚宝贝盘子，一年只拿出来一回，派我去擦。一枚一枚擦，一枚一枚数，数到十，心里才踏实。\n\n新来了个小厮，叫小弥，九岁，跟弟弟一般大。夜里想家就哭，还尿过一回被子——我替他洗了，没告诉别人。\n\n等攒够了钱，今年冬天回去看您。\n\n　　　　　　　　　　　　　　　　菊' },
      souki: { title: '游方僧的留书', text: '（井旁小祠里压着一页纸，墨迹被潮气洇开了）\n\n去岁秋，贫僧路过番町，受邻人所托，夜坐此井畔诵经。\n\n女声数皿，至九。\n贫僧依古人之法，大喝一声：「十！」\n\n井中静了一静。\n随后，传来一句——\n「……不是这一枚。」\n\n哭声比先前更响了。\n\n贫僧惭愧。少的那一枚，不在嘴上。\n\n　　　　　　　　　　　　　　　　游方僧　某' },
      saracho: { title: '御皿帐', text: '（桐木箱底压着一本薄册，封面题「御皿帐」）\n\n染付　月に雁　十枚揃\n\n图样：月悬右上；雁三只，自左上排空而来；芦生左下；水流右下。缘绕唐草。\n取古歌「白云に羽うちかはし飛ぶ雁の数さへ見ゆる秋の夜の月」之意——\n白云间振翅的雁，连有几只都数得清，秋夜的月就是这样亮。\n\n（后面几页是历年点检的记录）\n十枚　改メ\n十枚　改メ\n十枚　改メ\n……\n九枚　一枚欠\n\n（「欠」字旁边，有人用很小的字补了一个字：菊）' }
    },
    legend: '「皿屋敷」是日本流传最广的怪谈之一。以江户番町为舞台的叫「番町皿屋敷」，以播磨国姬路为舞台的叫「播州皿屋敷」，此外出云、土佐等地也有类似的故事。番町版最常见的说法是：旗本青山家（主人有的说叫主膳，有的说叫播磨）的侍女阿菊，打碎了——或者被人诬陷打碎了——主家视为传家宝的十枚一组的盘子中的一枚，受到严惩后投井，也有说是被投进井里。此后每夜井中传出「一枚、两枚……」的数盘声，数到九枚便放声痛哭，青山家不久断绝。据说江户中期的《皿屋敷弁疑录》（1758）把这件事系在承应二年（1653），但这类记载本身就多有附会，查无实据。\n\n播州版据说更早，和姬路城有关：家老青山铁山图谋夺城，侍女阿菊探知了阴谋，铁山的同伙町坪弹四郎藏起一枚盘子诬陷她，把她杀死投井。姬路城内至今有一口被称作「阿菊井」的井。据说宽政七年（1795）前后，姬路一带大量出现一种形状像被反绑的女人的虫蛹，人们叫它「阿菊虫」（一般认为是麝凤蝶的蛹）。这个故事后来被写进人形净琉璃《播州皿屋敷》（1741）和歌舞伎；冈本绮堂 1916 年的新歌舞伎《番町皿屋敷》又把它改成了爱情悲剧——阿菊为了试探播磨的心，故意打碎了盘子。\n\n结尾也有好几种。流传很广的一种说：一位高僧（也有说是胆大的路人）躲在井边，等她数到「九枚」，抢先大喊一声「十枚！」，她便说一句「啊，真好（あら嬉しや）」，从此不再出现。落语《皿屋敷》则把它变成了笑话：来井边看热闹的人太多，阿菊越数越多，数到了十八枚——「明天要休息，今天把两天的份数了」。\n\n（本章中的阿铃、弥平（小弥）、新主人与游方僧，阿菊替孩子担下罪名的情节，「月に雁」的盘子图样与御皿帐、瓦版、书信的文字，四片碎片、续饭补盘、地板下的手巾，以及「她抬头时莫动、数到九莫被看见」的规矩，均为游戏虚构。古歌「白雲に羽うちかはし飛ぶ雁の数さへ見ゆる秋の夜の月」出自《古今和歌集》，佚名。）',
    start: { map: 'yashiki', x: 12, y: 9, dir: 3 },
    resume: {
      n2: async S => {
        nightSet(S); cntStart(S, QT + .9);
        const d = S.f._dN2 || 0;
        if (d === 1) await S.think('……又是这个院子。\n她低头数的时候走；她抬头，就站住；数到八，就得已经躲在她看不见的地方了。');
        else if (d >= 2) { await S.think('井口照不到的地方——石灯笼背后、松树背后、土蔵门口那一片。\n先站在暗处等她数完一轮、哭完，再趁安静的时候去捡。'); S.toast('提示：发蓝的地面是她看得见的地方；数到八之前躲进暗处'); }
      },
      fin: async S => {
        nightSet(S); S.f.cnt = { n: 0, t: 0, e: 0, ph: 'hold' }; S.f.strike = 0; setBeat(S, 0);
        if (S.f._dFin) await S.think('放下盘子以后，趁她低头，离开井边。\n她抬头时，站住别动。');
      }
    },
    async intro(S) {
      await S.card('第六夜　番町皿屋敷', '元禄年间·秋　江户　番町', '青山家断绝，已经四十年了。\n番町那座空宅子，街坊们叫它「皿屋敷」。\n\n今年秋天，宅子拨给了新主人。\n十六岁的下女阿铃，\n跟着老仆弥平，先来把它收拾出来。');
    },
    tick(S, dt) {
      countTick(S, dt);
      okikuAnim(S, dt);
      const f = S.f;
      /* 夜里在屋里：井那边隐约传来数数声（引人出去） */
      if (S.map === 'yashiki' && f.ph === 'n1' && !S.busy) { f._ft = (f._ft ?? 1.5) - dt; if (f._ft <= 0) { f._fn = (f._fn || 0) % 9 + 1; TONE.count(S, f._fn, .22); f._ft = f._fn === 9 ? 5 : 1.7; } }
      /* 地板缝里的滴水声 */
      if (S.map === 'yashiki' && f.ph === 'n1b' && !S.busy) { f._dt = (f._dt ?? 1) - dt; if (f._dt <= 0) { const d = Math.abs(S.pl.x - 3) + Math.abs(S.pl.y - 9); TONE.drip(S, Math.max(.15, 1 - d / 12)); f._dt = 1.1; } }
    },
    maps: {
      /* ---------------- 下人屋与台所 ---------------- */
      yashiki: {
        amb: 'room', dark: .4, plr: 3.4, wall: 'shoji', floor: 'wood',
        wallC: { face: '#6a5a44', top: '#1a1410' },
        tileOpts: { woodC: '#6a4e34' },
        rows: [
          '####################',
          '####################',
          '#llllllllllllllllll#',
          '#llllllllllllllllll#',
          '#####l#######l######',
          '#ttttt#wwwwwwwwwwww#',
          '#ttttt#wwwwwwwwwwww#',
          '#ttttt#wwwwwwwwwwww#',
          '#ttttt#dddddddddddd#',
          '#ttttt#dddddddddddd#',
          '#ttttt#dddddddddddd#',
          '####################'],
        ents: [
          { id: 'door_niwa', x: 4, y: 1, spr: 'sliding', on: S => toNiwa(S) },
          { id: 'door_oku', x: 16, y: 1, spr: 'fusuma', on: S => toOku(S) },
          { x: 9, y: 1, spr: 'shoji', on: S => S.narr(S.f.ph === 'd1' || S.f.ph === 'd2' ? '廊下的障子，纸是新糊的。\n糊纸的时候弥平爷说：「老宅子，纸一新，人就敢住了。」' : '障子外面就是后院。\n纸上映着一片青白的光——是月亮，还是井那边……') },
          { x: 12, y: 1, spr: 'shoji', on: S => S.narr('障子的格子里，有一格破了个指头大的洞，透进一缕凉风。') },
          { x: 18, y: 2, spr: 'invisible', solid: true, on: S => S.narr('廊下尽头堆着几块旧雨户，上面落满了灰。') },
          /* 下人部屋 */
          { id: 'closet', x: 2, y: 4, spr: 'closet', on: S => closetOn(S) },
          { x: 4, y: 5, spr: 'futon', col: '#6a6a8a', on: S => S.narr(S.f.ph === 'd1' ? '刚晒过的被褥，叠在墙角。今晚就睡这儿。' : '被窝还是温的。') },
          { x: 1, y: 7, spr: 'futon', col: '#8a6a5a', on: S => S.narr('另一床旧被褥，补丁摞着补丁。弥平爷说这屋从前睡过好几个下人，「小的挤一床」。') },
          { id: 'yuka', x: 3, y: 9, spr: 'yuka', solid: false, on: S => yukaOn(S) },
          { id: 'lamp_g', x: 5, y: 10, spr: 'andon', light: { r: 2.6, col: 'rgba(255,190,110,.18)', flick: true }, s: { lit: 1 }, on: S => S.narr('一盏行灯。灯油是菜籽油，烧起来有股炒菜的香味。') },
          /* 板之间 */
          { x: 10, y: 6, w: 2, spr: 'irori', light: { r: 3.6, col: 'rgba(255,140,60,.22)', flick: true }, on: S => S.narr(S.f.ph === 'd2' ? '铁瓶里的水咕嘟咕嘟地响。弥平爷一夜没睡，眼睛熬得通红。' : '围炉里烧着几块炭，自在钩上吊着一只铁瓶。\n火光一跳一跳，把墙上的影子拉得老长。') },
          { id: 'yahei', x: 12, y: 6, spr: '@yahei', dir: 1, on: S => yaheiOn(S) },
          { id: 'kawaraban', x: 8, y: 6, spr: 'newspaper', async on(S) { if (S.once('kwr')) await S.narr('地板上搁着一张发黄的旧纸，是街上卖的瓦版。'); await S.note('kawaraban'); S.f.readK = true; } },
          { x: 18, y: 5, spr: 'cabinet', col: '#5a4030', on: S => S.narr('碗柜里摞着几只粗陶碗，是弥平爷从自己家里带来的。\n——这宅子里，原来的碗碟一件也没剩下。') },
          { x: 15, y: 5, spr: 'invisible', solid: false, on: S => S.narr('地板被擦得发亮。四十年没人住的屋子，弥平爷擦了整整三天。') },
          /* 土间 */
          { id: 'kamado', x: 17, y: 8, spr: 'kamado', light: { r: 2, col: 'rgba(255,140,60,.16)', flick: true }, on: S => kamadoOn(S) },
          { x: 18, y: 10, spr: 'vat', on: S => S.narr('水缸里的水是从外头的公井挑来的。\n后院那口井的水，弥平爷说，一滴也不许用。') },
          { x: 8, y: 10, spr: 'sack', on: S => S.narr('一袋米，一袋盐，一捆干萝卜。新主人下个月才搬来，这些够吃到那时候了。') },
          { x: 12, y: 11, spr: 'sliding', on: S => S.narr(S.f.ph === 'd1' || S.f.ph === 'd2' ? '大门外是番町的石板路，两边全是旗本的长屋门。\n今天的活还没干完。' : '大门闩着。夜里的番町，连狗都不叫。') }
        ],
        async enter(S, first) {
          lightSet(S);
          if (first) return houseStart(S);
          if (S.f.ph === 'n1b' && S.once('dripHint')) { await S.narr('一进屋，就听见下人部屋那边「滴答……滴答……」。\n屋里没有水缸。'); S.goal('去下人部屋，找那滴水声'); }
        }
      },
      /* ---------------- 奥座敷 ---------------- */
      oku: {
        amb: 'room', dark: .6, plr: 3, wall: 'shoji', floor: 'tatami',
        wallC: { face: '#5a4a38', top: '#140f0c' },
        rows: [
          '##############',
          '##############',
          '#tttttttttttt#',
          '#tttttttttttt#',
          '#tttttttttttt#',
          '#tttttttttttt#',
          '#llllllllllll#',
          '#llllllllllll#',
          '######ll######',
          '######ll######'],
        ents: [
          { x: 6, y: 9, spr: 'invisible', touch: S => S.go('yashiki', 16, 2, 0) },
          { x: 7, y: 9, spr: 'invisible', touch: S => S.go('yashiki', 16, 2, 0) },
          { id: 'toko', x: 2, y: 1, w: 2, spr: 'tokonoma', on: S => tokoOn(S) },
          { id: 'shoji1', x: 6, y: 1, spr: 'shoji', on: S => S.narr('障子外头是后院。纸上映着松树的影子。') },
          { id: 'shoji2', x: 9, y: 1, spr: 'shoji', on: S => shojiOn(S) },
          { id: 'shoji3', x: 11, y: 1, spr: 'shoji', on: S => S.narr('这扇障子的纸被人从外面捅破过好几处，又一处一处补上了。') },
          { id: 'andon', x: 5, y: 3, spr: 'andon', light: { r: 3.4, col: 'rgba(255,190,110,.22)', flick: true }, s: { off: 1 }, on: S => andonOn(S) },
          { x: 10, y: 3, w: 2, spr: 'byobu', on: S => S.narr('一架六曲屏风，金底已经发乌了。\n右上画着一轮月，三只雁斜斜地飞过去，底下是芦苇和流水。\n——跟皿帐里写的那套盘子，好像是一个画法。') },
          { x: 12, y: 2, spr: 'katana', on: S => S.narr('空着的刀架。青山家的刀，四十年前就不知去向了。') },
          { x: 7, y: 4, spr: 'lowtable', col: '#3a2a1a', on: S => S.narr('一张文几，上面落了一层薄灰，只有正中间干干净净——\n像是刚有人在这里，摆过什么东西。') },
          { x: 3, y: 4, spr: 'cushion', col: '#5a2a2a', on: S => S.narr('一只褪了色的坐垫。老爷当年就是坐在这儿，一枚一枚地数他的盘子。') }
        ],
        async enter(S, first) {
          lightSet(S);
          if (first) await S.narr('奥座敷。拉门一开，一股陈年的榻榻米味扑面而来。\n屋里黑沉沉的，只有障子透进一点暮色。');
        }
      },
      /* ---------------- 后院与井 ---------------- */
      niwa: {
        amb: 'night', dark: .35, plr: 3.6, wall: 'shoji', floor: 'grass',
        wallC: { face: '#5a4a38', top: '#14100c' },
        tileOpts: { grassC: '#2a3a2c', woodC: '#6a5238' },
        rows: NIWA,
        ents: [
          ...GZ_ENTS,
          { id: 'door_house', x: 4, y: 2, spr: 'sliding', on: S => toHouse(S) },
          { x: 7, y: 2, spr: 'shoji', on: S => S.narr('下人屋的障子。里面黑着。') },
          { x: 10, y: 2, spr: 'shoji', on: S => S.narr('奥座敷的障子。纸上隐约映着屏风的影子。') },
          { id: 'tobukuro', x: 1, y: 3, spr: 'tobukuro', on: S => S.narr('收雨户的户袋，一人多高。\n站在它背后，井那边就看不见了。') },
          { id: 'yahei_n', x: 2, y: 3, spr: '@yahei', dir: 2, hidden: true, on: S => S.say('弥平', '……莫出声。', { style: 'whisper' }) },
          /* 土蔵 */
          ...[15, 16, 18, 19, 20].map(x => ({ x, y: 3, spr: 'namako', solid: true, on: S => S.narr('土蔵的白墙，下半截贴着方瓦，接缝抹成一道道白棱——海参墙。\n防火，也防贼。') })),
          { id: 'kuradoor', x: 17, y: 3, spr: 'kuradoor', on: S => toKura(S) },
          /* 院子 */
          { id: 'well', x: 11, y: 7, spr: 'ido', s: { lid: 1 }, on: S => wellOn(S) },
          { id: 'okiku', x: 11, y: 7, spr: '@okiku', solid: false, hidden: true, alpha: 0, dir: 0, oy: -5, on: S => S.narr('……') },
          { x: 7, y: 5, spr: 'stonelantern', off: true, on: S => S.narr('一座石灯笼，灯龛里积着落叶。\n它挡着的那一小块地方，井口照不到。') },
          { x: 14, y: 6, spr: 'stonelantern', off: true, on: S => S.narr('另一座石灯笼，青苔爬满了半边。灯龛里放着一枚生了锈的铜钱。') },
          { id: 'hokora', x: 16, y: 11, spr: 'hokora', async on(S) { if (S.once('hkr')) await S.narr('院子角落一座小小的祠，供着一块写着「菊」字的木牌。\n木牌底下压着一页纸。'); await S.note('souki'); S.f.readSouki = true; } },
          { x: 2, y: 11, w: 2, spr: 'monooki', on: S => S.narr('柴屋。门板歪着，里面堆着锄头、扫帚和几只破木桶。') },
          { x: 19, y: 11, spr: 'woodpile', on: S => S.narr('劈好的柴码得整整齐齐。弥平爷说，冬天来之前要劈够一百捆。') },
          { x: 3, y: 6, spr: 'invisible', solid: true, on: S => S.narr('一棵老松，枝子压得很低。松针上挂着露水。') },
          { x: 17, y: 9, spr: 'invisible', solid: true, on: S => S.narr('松树底下的土翻过，又填上了——像是有人在这儿找过什么。') },
          { x: 13, y: 11, spr: 'invisible', solid: true, on: S => S.narr('一方小池子，水黑得看不见底。\n池边的芦苇，秋天了还青着。') },
          { x: 6, y: 9, spr: 'invisible', solid: true, on: S => S.narr('一块青石，上面坐得光溜溜的。') },
          /* 夜里才看得见的碎片 */
          { id: 'k_ko', x: 10, y: 3, spr: 'kakera', solid: false, hidden: true, touch: S => pickShard(S, 'k_ko', 'ko', '甲') },
          { id: 'k_tei', x: 11, y: 8, spr: 'kakera', solid: false, hidden: true, touch: S => pickShard(S, 'k_tei', 'tei', '丁') },
          { id: 'k_hei', x: 11, y: 11, spr: 'kakera', solid: false, hidden: true, touch: S => pickShard(S, 'k_hei', 'hei', '丙') }
        ],
        async enter(S, first) {
          lightSet(S);
          const ph = S.f.ph;
          if (ph === 'n1') return tutorial(S);
          if (ph === 'n2') return enterN2(S);
          if (ph === 'fin') return enterFin(S);
          if (first) { await S.narr('后院不大。一口带井桁的老井，正对着奥座敷的廊下。\n井口盖着木板，木板上压着一块大石头。'); await S.think('……就是那口井吧。'); }
        }
      },
      /* ---------------- 土蔵 ---------------- */
      kura: {
        amb: 'drone', dark: .72, plr: 2.8, wall: 'plain', floor: 'darkwood',
        wallC: { face: '#c8c4b4', top: '#1a1a1c' },
        rows: [
          '############',
          '############',
          '#WWWWWWWWWW#',
          '#WWWWWWWWWW#',
          '#WWWWWWWWWW#',
          '#WWWWWWWWWW#',
          '#WWWWWWWWWW#',
          '#WWWWWWWWWW#',
          '#####WW#####',
          '#####WW#####'],
        ents: [
          { x: 1, y: 6, spr: 'invisible', solid: true, on: S => S.narr('土蔵的墙有一尺多厚，抹着白灰。\n墙角结着蜘蛛网，网上挂着一只干了的飞蛾。') },
          { x: 5, y: 9, spr: 'invisible', touch: S => S.go('niwa', 17, 4, 0) },
          { x: 6, y: 9, spr: 'invisible', touch: S => S.go('niwa', 17, 4, 0) },
          { x: 2, y: 1, spr: 'tana', col: '#7a6a4a', on: S => S.narr('架子上一排落满灰的木箱：「茶碗」「香炉」「挂轴」……\n箱子都是空的。') },
          { x: 3, y: 1, spr: 'tana', col: '#6a5a3a', on: S => S.narr('一只扁扁的漆盒，盖子上描着金色的秋草。\n打开——里面衬着红绸，压出十个圆圆的印子。') },
          { x: 6, y: 1, spr: 'mado', on: S => S.narr('高高的铁格子窗。月光从格子里漏进来，在地板上切出几道白。') },
          { x: 9, y: 1, spr: 'tana', col: '#8a6a4a', on: S => S.narr('一摞旧账本，被老鼠啃得只剩半边。') },
          { x: 2, y: 4, w: 2, spr: 'nagamochi', on: S => S.narr('一只长持（大衣箱），锁扣锈死了。\n箱盖上有一道很深的刀痕。') },
          { id: 'sarabako', x: 8, y: 4, spr: 'sarabako', on: S => sarabakoOn(S) },
          { id: 'ledger', x: 9, y: 4, spr: 'book', col: '#5a4a2a', async on(S) { await S.note('saracho'); S.f.readCho = true; } },
          { id: 'daiba', x: 4, y: 6, w: 2, spr: 'daiba', light: { r: 2.6, col: 'rgba(255,190,110,.2)', flick: true, dx: 27, dy: -2 }, on: S => daibaOn(S) },
          { x: 9, y: 7, spr: 'rat', solid: false, on: S => S.narr('一只老鼠蹲在墙根下，眼睛红红的。\n你一跺脚，它也不跑。') }
        ],
        async enter(S, first) {
          lightSet(S);
          if (first) await S.narr('土蔵里又冷又潮，一股樟木和老鼠屎的味道。\n门口透进来的光，只照得到脚尖前面。');
        }
      }
    }
  });

  /* ================= 光照与出入口 ================= */
  function lightSet(S) {
    const ph = S.f.ph || 'd1', night = !['d1', 'd2'].includes(ph);
    const T = { yashiki: night ? .74 : (ph === 'd2' ? .22 : .42), oku: night ? .82 : (S.ent('andon') && !S.ent('andon').s.off ? .48 : .66), niwa: night ? .5 : (ph === 'd2' ? .12 : .34), kura: .72 };
    S.dark(T[S.map] ?? null);
    if (S.map === 'niwa') { S.amb(night ? 'none' : 'night'); const w = S.ent('well'); w.s.lid = night ? 0 : 1; w.light = night ? { r: 2.8, col: 'rgba(140,175,255,.2)' } : null; }
    if (S.map === 'yashiki') S.amb(night ? 'night' : 'room');
  }
  function nightSet(S) { S.norun(true); lightSet(S); }
  async function toNiwa(S) {
    if (S.f.ph === 'd1' && !S.has('kagi')) { await S.narr('先去和弥平爷打个招呼吧。'); return; }
    if (S.f.ph === 'n1b') return S.think(S.has('otsu') ? '……' : '弥平爷叫回屋……\n那「滴答、滴答」的声音，是从下人部屋那边来的。');
    S.sfx('open'); await S.go('niwa', 4, 3, 0);
  }
  async function toHouse(S) {
    if (S.f.ph === 'fin' && S.f.cnt && S.f.cnt.ph !== 'hold') { S.sfx('locked'); return S.think('（现在走开，就前功尽弃了。）'); }
    S.sfx('open'); await S.go('yashiki', 4, 2, 0);
  }
  async function toOku(S) {
    if (S.f.ph !== 'd1') return S.narr(S.f.ph === 'd2' ? '奥座敷里的行灯已经灭了。白天的光从障子透进去，空荡荡的。\n——现在没工夫去那儿。' : '奥座敷的拉门关得紧紧的。\n门缝底下，透出一丝青白的光。……还是别开了。');
    S.sfx('open'); await S.go('oku', 6, 8, 3);
  }
  async function toKura(S) {
    if (S.f.ph === 'fin' && S.f.cnt && S.f.cnt.ph !== 'hold') { S.sfx('locked'); return S.think('（现在走开，就前功尽弃了。）'); }
    if (!S.has('kagi')) { S.sfx('locked'); return S.narr('土蔵的门上挂着一把大铁锁。'); }
    if (S.once('kuraOpen')) { S.sfx('open'); await S.narr('钥匙在锁眼里转了三圈，「咔」的一声。\n厚重的蔵门往里一推，吱——呀——'); }
    await S.go('kura', 5, 8, 3);
  }

  /* ================= 第一幕：黄昏 ================= */
  async function houseStart(S) {
    S.f.ph = 'd1';
    S.face('yahei', 'pl');
    await S.say('弥平', ['阿铃，过来。', '新主人下个月搬来。天黑之前，还有两件事——', '一件，奥座敷的行灯点上。主人吩咐了，那屋夜里不能黑着。', '一件，去后院土蔵里，把装盘子的桐木箱打开，点点数。主人要过目的。']);
    S.give('kagi');
    await S.say('弥平', ['……后院的井，白天去不碍事。', '天黑了，就莫过去。']);
    await S.say('阿铃', '那口井……就是街上说的那个？');
    await S.say('弥平', ['……是。我九岁那年，就在这府里当小厮。', '去吧。早些干完，早些吃饭。']);
    S.goal('点亮奥座敷的行灯（东边拉门），去后院土蔵点盘子');
  }
  function dayGoal(S) {
    const f = S.f;
    if (f.lit && f.counted) S.goal('回板之间，告诉弥平爷');
    else if (f.lit) S.goal('去后院土蔵，点点箱子里的盘子');
    else if (f.counted) S.goal('点亮奥座敷的行灯（廊下东头的拉门）');
  }
  async function andonOn(S) {
    const a = S.ent('andon');
    if (!a.s.off) return S.narr(S.f.ph === 'd1' ? '行灯亮着。纸罩子里的火苗，一跳一跳。' : '行灯亮着。');
    a.s.off = 0; a.s.lit = 1; S.sfx('match'); S.dark(.48);
    await S.narr('火镰「嚓」地一响，行灯亮了。\n暖黄的光漫开来，把屏风上的金色照得一闪。');
    if (S.once('shadow')) {
      await S.wait(500);
      const sj = S.ent('shoji2'); sj.s.sh = 1; sj.s.lit = 1;
      TONE.count(S, 1, .3); await S.wait(1600); TONE.count(S, 2, .3); await S.wait(1200);
      await S.narr('障子上，映出一个影子。\n一个跪坐着的女人，正把什么东西一枚一枚地往前摆。');
      TONE.count(S, 3, .32);
      await S.wait(900);
      sj.s.sh = 0; S.sfx('whisper');
      await S.narr('……影子没了。\n障子外面是后院，那里没有人。');
      await S.think(['灯光照在障子里面，影子怎么会映在纸上……', '……别想了。快点干完活。']);
    }
    S.f.lit = true; dayGoal(S);
  }
  async function shojiOn(S) {
    if (S.f.lit) return S.narr('刚才那个影子……就在这扇障子上。\n纸面干干净净，只有一小块，摸上去是湿的。');
    return S.narr('障子外头是后院，暮色一点点沉下去。');
  }
  async function tokoOn(S) {
    await S.narr('床之间挂着一幅画轴：右上一轮月，三只雁斜斜地飞过。\n底下摆着一只空的皿立——一排十个凹槽，一个也没放。');
    if (S.once('toko')) await S.think('那十枚盘子，从前就摆在这里吧。');
  }
  async function sarabakoOn(S) {
    const b = S.ent('sarabako');
    if (S.f.ph === 'd1' && !S.f.counted) {
      b.open = true; S.sfx('open');
      await S.narr('桐木箱的盖子上，墨笔写着「十枚」。\n打开，里面是一格一格的隔板，每一格里躺着一枚用薄纸包着的盘子。');
      await S.narr('你把它们一枚一枚拿出来，摆在箱盖上。');
      for (let i = 1; i <= 9; i++) { TONE.clink(S, .5 + i * .04); await S.wait(i < 9 ? 380 : 900); }
      await S.say('阿铃', '一枚、两枚、三枚、四枚、五枚、六枚、七枚、八枚……', { style: 'think' });
      await S.say('阿铃', '……九枚。', { style: 'think' });
      S.sfx('sting');
      await S.narr('第十格是空的。\n格子底下的木头上，有一圈圆圆的印子，颜色比别处浅。');
      await S.think(['……少一枚。', '每一枚的图样都一样：一轮月，三只雁，芦苇，流水。', '箱底还压着一本册子。']);
      S.f.counted = true; dayGoal(S);
      return;
    }
    if (S.f.ph === 'd2') return S.narr('九枚盘子并排摆在箱盖上，月亮都在右上，雁都朝着月亮飞。\n第十格空着。');
    return S.narr('九枚盘子。第十格空着。');
  }
  async function closetOn(S) {
    const c = S.ent('closet');
    if (S.once('letter')) {
      c.open = true; S.sfx('open');
      await S.narr('押入里塞着几床旧被子。最里面的角落，有一只掉了漆的针线盒。\n夹层里，夹着一封信。');
      await S.note('tegami'); S.f.readLetter = true;
      await S.think('「菊」……阿菊？');
      return;
    }
    await S.note('tegami');
  }
  async function kamadoOn(S) {
    if (S.f.ph !== 'd2') return S.narr(S.f.ph === 'd1' ? '竈上的饭釜咕嘟咕嘟地响，饭快好了。' : '竈里的火埋着，只剩一点红。');
    if (S.has('sokui')) return S.narr('手里的续饭还湿着，够用了。');
    if (!S.has('sara')) {
      S.give('sokui');
      await S.narr('从饭釜里抓一把剩饭，摊在木板上，用刮刀一下一下碾成黏浆。');
      if (S.once('sokui')) await S.say('弥平', '续饭干得快。拿过去就粘，莫磨蹭。', { style: 'whisper' });
      return;
    }
    return S.narr('饭釜里还剩小半锅饭。');
  }
  async function yaheiOn(S) {
    const f = S.f, ph = f.ph;
    S.face('yahei', 'pl');
    if (ph === 'd1') {
      if (!(f.lit && f.counted)) return S.say('弥平', cycle(S, '_y1', [f.lit ? '灯点上了？好。土蔵的盘子，点了没有？' : '奥座敷的灯，先点上。廊下东头那扇拉门。', '这宅子空了四十年。……莫乱碰东西。', '后院的土蔵钥匙给你了。别弄丢了。']));
      return night1(S);
    }
    if (ph === 'n1b' || ph === 'n2') return S.narr('弥平爷靠着柱子打盹，眉头皱得紧紧的。\n嘴里含含糊糊地念着什么……「阿菊姐」？');
    if (ph === 'd2') return yaheiDay2(S);
    return S.say('弥平', '……');
  }
  async function night1(S) {
    await S.say('阿铃', ['弥平爷，灯点上了。盘子……', '只有九枚。']);
    await S.narr('弥平爷拨火的手停住了。');
    await S.say('弥平', ['……一直是九枚。', '吃饭吧。吃完就睡，夜里不管听见什么，莫出屋。']);
    await S.fade(1, 900);
    S.f.ph = 'n1'; S.hide('yahei');
    S.pos(3, 7, 3);
    lightSet(S); S.ent('lamp_g').s.off = 1; S.ent('lamp_g').s.lit = 0;
    await S.card('夜半', '', '月亮升到了番町的屋顶上。\n\n阿铃睡得迷迷糊糊，\n听见有人在很远的地方，\n一字一字地，数着什么。');
    await S.fade(0, 900);
    await S.think(['……一枚……两枚……', '是从后院传来的。', '弥平爷的被褥是空的。']);
    S.goal('去廊下北边的拉门，看看后院');
    S.cp('n1');
  }

  /* ================= 数盘子：一拍一拍 ================= */
  /* n=1..9：她数到第几枚；0 = 不在数；10 = 补齐 */
  function setBeat(S, n, ph) {
    const w = S.ent('well'), o = S.ent('okiku');
    w.s.n = n;
    if (!n) { w.s.gz = S.f.ph === 'n2' || (S.f.ph === 'fin' && S.f.cnt && S.f.cnt.ph !== 'hold') ? 1 : 0; S.f.okA = 0; return; }
    S.f.okA = .9; o.hidden = false;
    if (n === 10) { w.s.gz = 0; o.spr = '@okikuU'; o.oy = -6; o.dir = 0; return; }
    if (ph === 'wail') { w.s.gz = 1; o.spr = '@okiku'; o.oy = -3; o.dir = 0; return; }
    if (n === 9) { w.s.gz = 4; o.spr = '@okikuB'; o.oy = -2; S.face('okiku', 'pl'); return; }
    if (n % 2) { w.s.gz = 1; o.spr = '@okiku'; o.oy = -5; o.dir = 0; }
    else { w.s.gz = n === 8 ? 3 : 2; o.spr = '@okikuU'; o.oy = -7; S.face('okiku', 'pl'); }
  }
  /* 离井越近声音越大（远处只剩模模糊糊的一点） */
  const vol = S => S.map !== 'niwa' ? .3 : Math.max(.4, Math.min(1.2, 1.3 - (Math.abs(S.pl.x - WELL[0]) + Math.abs(S.pl.y - WELL[1])) / 14));
  function sayBeat(S, n) {
    const v = vol(S);
    if (n === 9) { TONE.nine(S, v); S.toast('「……九枚……」'); return; }
    TONE.count(S, n, v); S.toast(`「${KN[n]}枚……」`);
    if (n === 8) S.sfx('heart');
  }
  function cntStart(S, quiet) { S.f.cnt = { n: 0, t: quiet ?? QT, e: 0, ph: 'quiet' }; S.f.strike = 0; setBeat(S, 0); const o = S.ent('okiku'); o.alpha = 0; o.hidden = true; }
  function okikuAnim(S, dt) {
    if (S.map !== 'niwa') return;
    const o = S.ent('okiku'); if (!o || o.hidden) return;
    const tg = S.f.okA ?? 0; o.alpha += (tg - o.alpha) * Math.min(1, dt * 5);
    if (tg === 0 && o.alpha < .04) { o.alpha = 0; o.hidden = true; }
  }
  function countTick(S, dt) {
    const f = S.f;
    if (S.map !== 'niwa' || (f.ph !== 'n2' && f.ph !== 'fin') || S.busy || !f.cnt) return;
    const c = f.cnt;
    if (c.ph === 'hold' || c.ph === 'dead') return;
    c.t -= dt; c.e += dt;
    const p = S.pl;
    /* 她抬头（偶数）的时候，在她看得见的地方动 */
    if (c.ph === 'count' && c.n % 2 === 0 && c.e > .6 && S.moving && seenGo(p)) return strike(S);   // .6 秒 = 反应 + 走完脚下这一格
    if (c.ph === 'count' && c.n === 8 && c.e > .75 && !c.hb) { c.hb = 1; S.sfx('heart'); }
    /* 九枚：她从井里升起来，转着头看 */
    if (c.ph === 'nine' && c.e > .6) {
      if (nearWell(p)) { c.ph = 'dead'; return S.run(idoEnd); }
      if (f.ph === 'fin') { if (!c.asked) { c.asked = true; S.run(shoutScene); } return; }
      if (seen(p)) {
        if (!f.strike) { f.strike = 1; c.ph = 'wail'; c.t = WT; c.e = 0; return S.run(nineWarn); }
        c.ph = 'dead'; return S.run(seenDie);
      }
    }
    if (c.t > 0) return;
    c.e = 0;
    if (c.ph === 'quiet') { c.ph = 'count'; c.n = 1; c.t = CT; setBeat(S, 1); sayBeat(S, 1); }
    else if (c.ph === 'count' && c.n < 8) { c.n++; c.t = CT; setBeat(S, c.n); sayBeat(S, c.n); }
    else if (c.ph === 'count') { c.ph = 'nine'; c.n = 9; c.t = NT; setBeat(S, 9); sayBeat(S, 9); S.shake(300, 1); }
    else if (c.ph === 'nine') { c.ph = 'wail'; c.t = WT; c.asked = false; setBeat(S, 9, 'wail'); TONE.sob(S); S.toast('「……少了一枚……」'); }
    else if (c.ph === 'wail') { c.ph = 'quiet'; c.n = 0; c.t = QT; setBeat(S, 0); cycleEnd(S); }
  }
  function strike(S) {
    const f = S.f; f.strike = (f.strike || 0) + 1;
    if (f.strike >= 2) { f.cnt.ph = 'dead'; return S.run(seenDie); }
    f.cnt.e = 0; f.cnt.t = Math.max(f.cnt.t, 1);
    S.run(async S => {
      S.face('okiku', 'pl'); S.bubble('okiku', '!', 1400); S.sfx('sting'); S.shake(200, 1);
      TONE.count(S, f.cnt.n, .5);
      await S.think('……她的头，一点一点朝这边转过来了。\n（她抬头的时候，在发蓝的地面上，一步也不能动。）');
    });
  }
  async function nineWarn(S) {
    const o = S.ent('okiku'); S.face('okiku', 'pl'); S.bubble('okiku', '!', 1600);
    S.sfx('sting'); S.shake(350, 2); TONE.count(S, 9, .7);
    await S.narr('她的脸转了过来。\n隔着湿头发，那只眼睛……停在了你身上。');
    S.sfx('heart'); await S.wait(500); S.sfx('heart');
    setBeat(S, 9, 'wail'); TONE.sob(S); o.spr = '@okiku';
    await S.think('……她沉下去了。没看清？\n下一回，数到八之前，一定要躲到发青的地面外头去。');
  }
  function cycleEnd(S) {
    const f = S.f;
    if (f.ph !== 'n2') return;
    if ((f.sh || 0) >= 3) return S.run(dawn);
    if (f.newSh) { f.newSh = false; S.cp('n2'); S.toast('她哭完了这一轮（已存档）'); }
  }
  async function seenDie(S) {
    bumpDeath(S, S.f.ph === 'fin' ? '_dFin' : '_dN2');
    const o = S.ent('okiku'); o.hidden = false; o.spr = '@okikuB'; o.oy = -2; S.f.okA = 1; S.face('okiku', 'pl');
    S.sfx('scream');
    await S.scare('face', { spr: '@okikuU', face: 'okiku', dur: 1 });
    await S.die('「……看见了。」\n\n井沿上，一只湿漉漉的、少了一根手指的手，朝你伸了过来。', '被她看见了');
  }
  async function idoEnd(S) {
    const o = S.ent('okiku'); o.hidden = false; o.spr = '@okikuB'; o.oy = -2; S.f.okA = 1; S.face('okiku', 'pl');
    await S.narr('「……九枚。」\n\n她就在你面前。井沿上的水，漫过了你的脚背。');
    await S.scare('face', { spr: '@okikuU', face: 'okiku', dur: 1.2 });
    S.sfx('splash');
    await S.end({ bad: true, id: 'ido', title: '井边的木屐', text: '第二天早上，弥平在井边找到了一只木屐。\n红色的鞋带，是阿铃的。\n\n井口的盖板压得好好的，石头一动没动。\n\n从那以后，番町的人都说，\n皿屋敷的井里，每夜数盘子的声音，\n变成了两个。' });
  }

  /* ================= 第一夜：躲在户袋后面看 ================= */
  async function beat(S, n, ms) { setBeat(S, n); sayBeat(S, n); await S.wait(ms); }
  async function tutorial(S) {
    S.f.ph = 'n1t';
    S.show('yahei_n'); S.place('yahei_n', 2, 3, 2);
    S.bubble('yahei_n', '!', 1200);
    await S.say('弥平', '……阿铃！这边，蹲下！', { style: 'whisper' });
    await S.walk('pl', [3, 3], 4.2);
    S.turn(0);
    await S.narr('弥平爷一把把你拽到户袋背后。他的手冰凉，抖得厉害。');
    S.focus(10, 6);
    S.ent('well').s.lid = 0;
    await S.narr('井口的盖板，不知什么时候挪开了一道缝。\n缝里漫出青白的光。');
    const o = S.ent('okiku'); o.hidden = false; o.alpha = 0; S.f.okA = .9;
    await beat(S, 1, 1500);
    await S.narr('一个穿白衣的女人，从井里慢慢升了上来。\n湿头发垂到胸口，低着头，像在看手里的什么东西。');
    await beat(S, 2, 900);
    await S.say('弥平', ['……她抬头了。莫动。', '院子里那一片发青的地，就是她看得见的地方。', '她低头数的时候，才能动。', '井上头那一圈小盘子，数到几枚就亮几枚。泛青的时候，就是她在抬头。'], { style: 'whisper' });
    await beat(S, 3, 1400); await beat(S, 4, 1400); await beat(S, 5, 1400); await beat(S, 6, 1400); await beat(S, 7, 1400);
    await beat(S, 8, 900);
    await S.say('弥平', '要数到九了……九的时候，她要出来看。\n被她瞧见的，被她够着的……', { style: 'whisper' });
    await beat(S, 9, 1600);
    S.shake(400, 1);
    await S.narr('她整个儿从井口升了起来，转着脑袋，一处一处地看。\n看过廊下，看过松树，看过石灯笼——\n看过户袋。');
    S.sfx('heart'); await S.wait(900); S.sfx('heart');
    setBeat(S, 9, 'wail'); TONE.sob(S);
    await S.say('阿菊', '……少了……一枚……', { style: 'whisper' });
    S.f.okA = 0; setBeat(S, 0); S.ent('well').s.gz = 0;
    await S.wait(1600);
    S.focus(null);
    await S.say('弥平', ['……四十年了。每夜都这样。', '她低头的时候能动；抬头的时候莫动；数到九，莫让她看见，更莫站在井边。', '回屋去。……今晚的事，莫跟人说。']);
    await S.fade(1, 700);
    S.f.ph = 'n1b'; S.hide('yahei_n');
    const y = S.ent('yahei'); y.hidden = false; S.place('yahei', 13, 6, 1);
    S.ent('yuka').s.wet = 1;
    await S.go('yashiki', 4, 2, 0);
  }

  /* ================= 第二夜：捡碎片 ================= */
  async function yukaOn(S) {
    const f = S.f;
    if (f.ph === 'd1') return S.narr('这块榻榻米翘起了一角。底下的地板，有一块是松的。\n……算了，明天叫弥平爷来修。');
    if (S.has('otsu') || f.ph === 'd2' || f.ph === 'fin' || f.ph === 'n2') return S.narr('掀开的榻榻米底下，地板缝里还湿着。\n那条手巾，在这底下泡了四十年。');
    if (f.ph === 'n1') return S.narr('翘起的榻榻米……底下好像有水声？\n可外头那个数数的声音，更要紧。');
    S.sfx('paper');
    await S.narr('滴答声就在这块翘起的榻榻米底下。\n你掀开榻榻米，抠起那块松了的地板——');
    S.ent('yuka').s.wet = 0;
    await S.narr('地板底下是湿的。一小团东西，用一条小孩的手巾包着，泡得发了霉。\n打开——\n是一块青花瓷片。');
    S.give('otsu'); S.give('tenugui', true);
    await S.think(['三只小小的雁……跟土蔵里那九枚盘子，是一样的画。', '少的那一枚……碎在这儿了？', '手巾的角上，绣着一个「弥」字。']);
    await S.think(['剩下的碎片呢？', '刚才在院子里……井口的光照过去的地方，草里好像有什么一闪一闪的。']);
    if (!f.readSouki) await S.think('还有井边那座小祠……白天就看见底下压着一页纸。');
    f.ph = 'n2'; f.sh = 0;
    S.goal('去后院捡剩下的三片碎片：她低头时走，抬头时站住，数到九前躲进暗处');
    S.toast(S.coop ? '双人：一人盯着井上的小盘子报「走／停」，一人走' : '提示：盯着井上那圈小盘子——白的时候走，泛青的时候停');
  }
  async function enterN2(S) {
    nightSet(S);
    for (const id of ['k_ko', 'k_tei', 'k_hei']) if (!S.f['got_' + id]) S.show(id);
    if (S.once('n2in')) {
      await S.narr('院子里静得吓人。井口那道缝里，青光一明一暗。\n草里、廊下、井边——有三处地方，一闪，一闪。');
      await S.think(['趁她还没开始数……', '她低头的时候走。抬头的时候站住。数到九之前，躲到发青的地面外头去。']);
    }
    if (!S.f.cnt || S.f.cnt.ph === 'dead') { cntStart(S, QT + .5); S.cp('n2'); }   // 从土蔵/屋里回来：接着刚才的拍子数，不白给一段安静
  }
  async function pickShard(S, eid, item, k) {
    if (S.f.ph !== 'n2' || S.f['got_' + eid]) return;
    S.f['got_' + eid] = true; S.hide(eid); S.give(item, true);
    S.f.sh = (S.f.sh || 0) + 1; S.f.newSh = true;
    TONE.clink(S, .6);
    S.toast(`捡到碎片（${S.f.sh}/3），背面写上「${k}」`);
    if (S.f.sh === 3) S.goal('三片都捡到了——躲进暗处，等她数完这一轮');
  }
  async function dawn(S) {
    S.f.cnt = null; setBeat(S, 0); S.ent('well').s.gz = 0;
    await S.wait(800);
    TONE.kane(S); await S.wait(1400);
    await S.narr('远处，传通院方向，敲响了晨钟。\n井口的青光一下子暗了下去。');
    TONE.cock(S);
    await S.narr('鸡叫了。');
    await S.fade(1, 1000);
    S.f.ph = 'd2'; S.norun(false);
    await S.card('第二天', '', '天亮了。\n阿铃把三片碎片和地板底下那片并排摆在一起。\n\n四片。\n拼得起来吗？');
    S.place('yahei', 12, 6, 1);
    await S.go('yashiki', 10, 8, 3);
    await S.fade(0, 800);
    S.goal('拿碎片给弥平爷看');
    S.cp('d2');
  }

  /* ================= 第二天：续饭补盘 ================= */
  async function yaheiDay2(S) {
    const f = S.f;
    if (!f.y2) {
      f.y2 = true;
      await S.narr('你把四片碎片摊在弥平爷面前。\n他盯着那片画着三只雁的，好久没有说话。');
      await S.say('弥平', ['……这是……那枚盘子的。', '你夜里出去了？……唉。', '碎了的东西，拿续饭粘。饭釜里的剩饭，碾成浆，趁湿抹在茬口上——从前补碗都这么补。', '拼的时候，对着土蔵里那本皿帐。图样怎么画的，碎片就怎么摆。']);
      S.goal('续饭（土间的竈）+ 四片碎片，到土蔵作业台上拼回盘子（对照御皿帐）');
      return;
    }
    if (!S.has('sara')) return S.say('弥平', cycle(S, '_y2', ['碎片上画的什么，先认清楚。三个「へ」字，那是雁。', '皿帐上写着呢——月在哪边，雁从哪边来。', '续饭干了就不黏了，拿过去就粘。']));
    return confront(S);
  }
  const ANS = '乙甲丁丙';   // 左上 雁、右上 月、右下 水、左下 芦
  async function daibaOn(S) {
    const f = S.f;
    if (f.ph !== 'd2') return S.narr('一张旧作业台，台面上有刀刻的划痕和干掉的漆。\n一截蜡烛插在台角上。');
    if (S.has('sara')) return S.narr('补好的盘子已经收起来了。台面上只剩一点干掉的续饭渣。');
    if (!S.has('sokui')) return S.think('碎片得拿续饭粘。……土间的竈上有饭釜。');
    const tip = S.coop ? '\n（另一位可以打开「笺」念御皿帐；键盘 1=甲 2=乙 3=丙 4=丁）' : '\n（键盘 1=甲 2=乙 3=丙 4=丁）';
    const r = await S.keypad('把四片碎片按图样摆好：从左上起，顺时针——左上、右上、右下、左下。\n甲：一道弧线，里面留白　乙：三个「へ」字\n丙：毛茸茸的穗子　　　　丁：卷着白花的蓝线' + tip, ['甲', '乙', '丙', '丁'], 4, { cancel: true, alias: { '1': '甲', '2': '乙', '3': '丙', '4': '丁' } });
    if (r == null) return;
    if (new Set(r).size < 4) return S.think('四片碎片，一片只能摆一个位置。');
    if (r === ANS) return plateDone(S);
    S.take('sokui'); f.pz = (f.pz || 0) + 1;
    S.sfx('bad'); TONE.clink(S, .3);
    /* 按错法给反馈：几片的位置对上了 */
    const ok = [...r].filter((c, i) => c === ANS[i]).length;
    await S.narr((ok ? `有${KN[ok]}片的茬口对上了，别的几片怎么也合不拢。` : '一片也对不上。') + '\n续饭糊了一手，转眼就干成了硬壳。得刮掉，重新碾一团。');
    const H = [
      '盘子的图样……皿帐上写过。先认出每一片画的是什么。',
      '三个斜着排的「へ」字是雁；弯弯的蓝线卷着白花，是水；毛茸茸的穗子是芦苇；只有一道弧线、里面留白的，是月亮的边。',
      '皿帐：月在右上，雁在左上——左上是乙，右上是甲……芦苇在左下，水在右下。',
      '左上乙、右上甲、右下丁、左下丙。'];
    await S.think(H[Math.min(f.pz, 4) - 1]);
    if (f.pz === 1 && !f.readCho) S.toast('提示：作业台旁的册子（御皿帐）');
  }
  async function plateDone(S) {
    S.take('sokui'); ['ko', 'otsu', 'hei', 'tei'].forEach(i => S.take(i));
    S.ent('daiba').s.done = 1;
    TONE.clink(S, .8);
    await S.narr('最后一片按上去，「咔」的一声轻响，茬口严丝合缝。\n续饭在裂缝里慢慢发白。');
    await S.narr('右上一轮满月。三只雁从左上飞来。芦苇，流水。\n——和箱子里那九枚，一模一样。');
    TONE.ten(S);
    S.give('sara');
    S.ent('daiba').s.done = 0;
    await S.think(['第十枚。', '那个游方僧说，「少的那一枚，不在嘴上」。', '今晚……把它还给她。']);
    S.goal('回屋找弥平爷');
  }
  async function confront(S) {
    const f = S.f;
    await S.say('弥平', '……补好了？');
    await S.narr('弥平爷把盘子捧在手里，翻过来，又翻过去。\n他的手抖得厉害。');
    const r = await S.ask('袖子里，那条绣着「弥」字的小手巾，沉甸甸的。', ['「弥平爷，这条手巾……」', '「今晚，我把它还给她。」']);
    if (r === 0) {
      f.confess = true;
      await S.narr('你把手巾放在他面前。\n他看着那个歪歪扭扭的「弥」字，看了很久。');
      await S.say('弥平', ['……那年我九岁。', '盘子一年才拿出来一回。阿菊姐擦完了，一枚一枚摆在廊下晾。', '我就想看看那上头的雁……三只雁，飞着去找月亮。', '手一滑。']);
      await S.say('弥平', ['我把有雁的那片包在手巾里，塞进地板底下。剩下的，扔进了院子。', '阿菊姐看见了。她什么也没说。', '第二天老爷数盘子，少了一枚。……她还是什么也没说。']);
      if (f.readLetter) await S.say('阿铃', '她的信里写着你。……说你跟她弟弟一般大。');
      await S.narr('弥平爷把脸埋进手里。\n肩膀一抽一抽的，像个九岁的孩子。');
      await S.say('弥平', ['四十年。每夜都听着她数。', '……今晚，我跟你去。']);
    } else {
      await S.narr('弥平爷点点头，把盘子还给你。\n他张了张嘴，像是想说什么，最后只是说：');
      await S.say('弥平', '……小心。');
    }
    await S.fade(1, 1000);
    S.f.ph = 'fin';
    await S.card('第二夜', '', '月亮又升起来了。\n\n这一夜，阿铃没有睡。\n她揣着那枚补好的盘子，\n坐在廊下，等井里的声音。');
    await S.go('niwa', 4, 3, 0);
    await S.fade(0, 800);
  }

  /* ================= 终幕：补上「十」 ================= */
  async function enterFin(S) {
    nightSet(S);
    if (S.f.cnt && S.f.cnt.ph !== 'hold') return;
    S.f.cnt = { n: 0, t: 0, e: 0, ph: 'hold' }; S.f.strike = 0; setBeat(S, 0);
    if (S.f.confess) { S.show('yahei_n'); S.place('yahei_n', 2, 3, 2); }
    if (S.once('finIn')) {
      await S.narr('井口的盖板又挪开了一道缝。\n缝里传出细细的、压着嗓子的哭声。');
      if (S.f.confess) await S.say('弥平', '……我在这儿看着。你去吧。', { style: 'whisper' });
      await S.think(['把盘子放上井沿。', '然后，趁她低头，离开井边。']);
    }
    S.goal('把补好的盘子放上井沿；她数的时候守规矩，数到九时离开井边');
    S.cp('fin');
  }
  async function wellOn(S) {
    const f = S.f, ph = f.ph;
    if (ph === 'd1' || ph === 'd2') {
      await S.narr('井口盖着木板，木板上压着一块大石头，石头上贴着一道褪了色的符。\n井桁的木头被摸得发亮——像是常有人坐在这儿。');
      if (S.once('wellDay')) await S.think('凑近了，能听见井底很深很深的地方，「咚」的一声水响。');
      return;
    }
    if (ph === 'fin' && f.cnt && f.cnt.ph === 'hold' && S.has('sara')) {
      S.take('sara'); S.ent('well').s.pl = 1;
      TONE.clink(S, .7);
      await S.narr('你把补好的盘子，轻轻放在井沿上。\n月光照着它。裂缝里的续饭，白得像一道道路。');
      await S.narr('井底下，有人吸了一口气。');
      f.cnt = { n: 1, t: CT, e: 0, ph: 'count' };
      setBeat(S, 1); sayBeat(S, 1);
      return;
    }
    if (ph === 'n2' || ph === 'fin') return S.narr('井口那道缝里，青光一明一暗。\n井底有水声。……还有别的声音。');
    return S.narr('……');
  }
  async function shoutScene(S) {
    const f = S.f;
    const r = await S.ask('「……九枚……」\n她的手停在半空，指尖滴着水。\n井沿上，那枚补好的盘子泛着白光。', ['「——十枚！」', '（捂住嘴，不出声）']);
    if (r === 1) {
      await S.narr('你死死捂着嘴。\n她的目光从盘子上滑过去——');
      f.cnt.ph = 'nine'; f.cnt.t = .1; f.cnt.e = 0; f.cnt.asked = true;
      return;
    }
    f.cnt = null;
    await S.say('阿铃', '——十枚！', { style: 'big' });
    S.ent('well').s.n = 10; S.ent('well').s.gz = 0;
    await S.wait(500);
    TONE.ten(S);
    const o = S.ent('okiku'); o.spr = '@okikuU'; o.oy = -6; o.dir = 0;
    await S.narr('井里的声音停了。\n她慢慢低下头，看着井沿上那枚补好的盘子。');
    S.ent('well').s.pl = 0;
    await S.narr('她伸手，把它捧了起来。\n捧到胸口，像捧着一个睡着的孩子。');
    await S.say('阿菊', '「……十枚。」', { style: 'whisper' });
    if (f.confess) {
      await S.walk('yahei_n', [9, 6], 2.2);
      S.face('yahei_n', 'okiku');
      await S.say('弥平', ['阿菊姐……', '那一枚，是我打碎的。', '……对不起。让你替我，数了四十年。']);
      await S.wait(600);
      await S.say('阿菊', ['「……小弥。」', '「长这么高了呀。」', '「我知道的。……那天就知道。」', '「不哭了。……被子，没再尿吧？」'], { style: 'whisper' });
      await S.narr('弥平爷哭着笑出了声。');
      S.f.okA = 0;
      await S.wait(1200);
      await S.end({ id: 'kotoba', title: '四十年后的一句话', text: '那一夜以后，番町皿屋敷的井里，再也没有人数盘子。\n\n第二天，弥平请人把井填了，\n在上面立了一块小小的石碑，碑上只刻了一个字：菊。\n\n每年秋天，月亮最圆的那一夜，\n他都会在碑前摆上一枚盘子，\n然后坐在廊下，一枚一枚地，数给她听。\n\n「一枚、两枚……九枚、十枚。」\n\n——数到十，心里才踏实。' });
      return;
    }
    await S.say('阿菊', '「……うれしや。」\n（真好啊。）', { style: 'whisper' });
    S.f.okA = 0;
    await S.wait(1200);
    await S.narr('她沉回井里。青光一点一点暗下去。\n井沿上，什么也没留下。');
    await S.end({ id: 'jumai', title: '十枚', text: '那一夜以后，番町皿屋敷的井里，再也没有人数盘子。\n\n新主人搬来的时候，土蔵里的桐木箱照旧写着「十枚」，\n箱子里照旧只有九枚。\n第十枚，她带走了。\n' + (f.readLetter ? '\n阿铃把那封没寄出去的信，压在了井边小祠的木牌底下。\n' : '') + '\n弥平爷从那以后，常常一个人坐在井边。\n阿铃问他在想什么，他只是摇头。\n\n那条绣着「弥」字的小手巾，阿铃一直收在袖子里。\n他没有问，她也没有拿出来。\n有些话，到最后也没有人说出口。' });
  }
})();
