/* ================= 第十六夜 · 民雄鬼屋 ================= */
(() => {
  /* ---------- 调色：老照片（棕褐）/ 拍立得（褪色偏青） ---------- */
  const XC = new Map();
  function rgbOf(c) {
    if (c[0] === '#') { let h = c.slice(1); if (h.length === 3) h = h.split('').map(z => z + z).join(''); const n = parseInt(h, 16); return [n >> 16, (n >> 8) & 255, n & 255, 1]; }
    const m = c.match(/[\d.]+/g) || [0, 0, 0]; return [+m[0], +m[1], +m[2], m[3] == null ? 1 : +m[3]];
  }
  const cl = v => Math.max(0, Math.min(255, Math.round(v)));
  const out = (r, g, b, a) => a < 1 ? `rgba(${cl(r)},${cl(g)},${cl(b)},${a})` : '#' + ((1 << 24) | (cl(r) << 16) | (cl(g) << 8) | cl(b)).toString(16).slice(1);
  function SEP(c) {
    const k = 's' + c; let v = XC.get(k); if (v) return v;
    const [r, g, b, a] = rgbOf(c), L = .3 * r + .59 * g + .11 * b;
    v = out((34 + L * .86) * .86 + 232 * .14, (24 + L * .74) * .86 + 214 * .14, (14 + L * .52) * .86 + 178 * .14, a);
    XC.set(k, v); return v;
  }
  function POL(c) {
    const k = 'p' + c; let v = XC.get(k); if (v) return v;
    const [r, g, b, a] = rgbOf(c), L = .3 * r + .59 * g + .11 * b;
    v = out(24 + (r * .72 + L * .28) * .82, 32 + (g * .72 + L * .28) * .84, 36 + (b * .72 + L * .28) * .8, a);
    XC.set(k, v); return v;
  }
  const xR = (R, f) => (a, b, w, h, c) => R(a, b, w, h, c && f(c));
  function sepP(P, f, key) {
    const Q = Object.assign({ skin: '#f0c8a0', hair: '#2b2020', top: '#55607a', bottom: '#33384a', shoes: '#1b1b1b', eye: '#1a1214' }, P);
    if (!Q.top2) Q.top2 = shade(Q.top, -.25);
    for (const k in Q) if (typeof Q[k] === 'string' && Q[k][0] === '#') Q[k] = f(Q[k]);
    if (P.extra) { const ex = P.extra; Q.extra = (g, d, fr, G, R) => ex(g, d, fr, G, xR(R, f)); }
    Q.key = key; return Q;
  }

  /* ---------- 合成音效（双方都听得到） ---------- */
  function shutter(S) {        // 拍立得：快门「喀」+ 闪光灯回电 + 马达吐相纸
    S.tone('square', 2400, 900, .025, .06); S.tone('square', 700, 260, .05, .05, .03, 1800);
    S.tone('sine', 1100, 4200, .9, .014, .12);
    S.tone('sawtooth', 220, 196, .85, .03, .3, 900); S.tone('square', 110, 98, .85, .018, .3, 500);
  }
  function drip(S, d = 0, v = 1) { S.tone('sine', 1700, 420, .13, .05 * v, d); S.tone('sine', 820, 300, .22, .02 * v, d + .05); }
  function clog(S, d = 0, v = 1) { S.tone('triangle', 270, 170, .05, .07 * v, d, 1700); S.tone('square', 135, 90, .04, .025 * v, d, 700); }
  function wellEcho(S, d = 0) { S.tone('sine', 196, 180, 2.2, .05, d, 600); S.tone('sine', 293, 280, 1.8, .025, d + .3, 700); }
  /* 井边的哼唱：一首很旧的台语歌，五声音阶，越哼越慢 */
  const HUM = [[440, 1], [523, 1], [587, 2], [523, 1], [440, 1], [392, 2], [330, 1], [392, 1], [440, 3], [392, 1], [330, 1], [294, 2], [330, 3]];
  function hum(S, d0 = 0, v = 1) { let t = d0; HUM.forEach(([f, n], i) => { const b = .3 + i * .012; S.tone('triangle', f, f * .99, n * b * .92, .035 * v, t, 1100); t += n * b; }); return t; }

  /* ---------- 人物 ---------- */
  const PEOPLE_M = {
    me: { key: 'mx-me', skin: '#ecc6a0', hair: '#1c1414', hs: 'long', top: '#e2dccc', top2: '#c0b8a6', bottom: '#3e5276', shoes: '#e4e4e4',
      extra(g, d, fr, G, R) { if (d === 0) { R(11, G.tT + 5, 2, 3, '#2a2a2a'); R(11, G.tT + 8, 2, 1, '#ffe8a0'); } else if (d === 1) { R(2, G.tT + 5, 3, 2, '#2a2a2a'); R(1, G.tT + 5, 1, 2, '#ffe8a0'); } } },
    azhe: { key: 'mx-azhe', skin: '#d8a880', hair: '#141010', hs: 'short', hat: 'cap', hatC: '#2a3a5a', top: '#5a7a5a', top2: '#3a5a3a', bottom: '#4a4a52', shoes: '#2a2a2a',
      extra(g, d, fr, G, R) { if (d === 0) { R(5, G.tT + 3, 6, 4, '#e8e8e4'); R(7, G.tT + 4, 2, 2, '#2a2a2a'); R(9, G.tT + 3, 1, 1, '#c03030'); } else if (d === 1) { R(2, G.tT + 3, 4, 4, '#e8e8e4'); R(1, G.tT + 4, 1, 2, '#2a2a2a'); } } },
    apo: { key: 'mx-apo', skin: '#c8986a', hair: '#d4d4d0', hs: 'bun', top: '#6a4a7a', top2: '#8a6a9a', bottom: '#2a2a34', shoes: '#3a3a3a',
      extra(g, d, fr, G, R) { if (d === 0 || d === 1) { R(5, G.tT + 2, 1, 1, '#e8a0b0'); R(9, G.tT + 4, 1, 1, '#e8a0b0'); R(6, G.tT + 6, 1, 1, '#e8d070'); R(8, G.tT + 1, 1, 1, '#e8d070'); } } },
    achun: { key: 'mx-achun', skin: '#e6c49c', hair: '#141010', hs: 'bun', top: '#46587a', top2: '#38486a', bottom: '#34343e', shoes: '#7a5a3a', apron: '#d8d0bc', eye: '#1a1214' },
    achunG: { key: 'mx-achunG', skin: '#c4ccd0', hair: '#080a0e', hs: 'long', cover: true, ghost: true, top: '#3e4a5e', top2: '#2e3a4e', bottom: '#2e3a4e', shoes: '#2e3a4e',
      extra(g, d, fr, G, R) { R(4, G.tB + 1 + fr, 1, 1, '#9ab8d0'); R(11, G.tB - 2 + fr, 1, 1, '#9ab8d0'); R(7, G.hT + 9, 1, 2, '#9ab8d0'); } },
    taitai: { key: 'mx-tai', skin: '#ecd2b2', hair: '#1a1212', hs: 'bun', top: '#5a2a48', top2: '#c8a040', bottom: '#3a1a30', robe: true, shoes: '#1a1a1a', eye: '#1a1214',
      extra(g, d, fr, G, R) { R(9, G.hT - 2, 4, 1, '#d8b040'); if (d === 0) { R(3, G.tT + 6, 1, 1, '#3ab07a'); R(12, G.tT + 6, 1, 1, '#3ab07a'); } } },
    taiG: { key: 'mx-taiG', skin: '#f2eee6', hair: '#120c0c', hs: 'bun', top: '#4a1838', top2: '#b89030', bottom: '#2a1020', robe: true, shoes: '#1a1010', eye: '#0a0404', mouth: '#4a0a10',
      extra(g, d, fr, G, R) {
        R(9, G.hT - 2, 4, 1, '#d8b040');
        const sw = fr === 1 ? 1 : fr === 3 ? -1 : 0;
        if (d === 0) { R(12, G.tT + 4, 1, 3, '#2a1a10'); R(11 + sw, G.tT + 7, 4, 5, '#e89048'); R(11 + sw, G.tT + 8, 4, 1, '#a04020'); R(11 + sw, G.tT + 10, 4, 1, '#a04020'); R(12 + sw, G.tT + 9, 2, 1, '#ffe0a0'); }
        else if (d === 1) { R(2, G.tT + 4, 1, 3, '#2a1a10'); R(0 + sw, G.tT + 7, 4, 5, '#e89048'); R(0 + sw, G.tT + 8, 4, 1, '#a04020'); R(1 + sw, G.tT + 9, 2, 1, '#ffe0a0'); }
        else if (d === 3) { R(12, G.tT + 6, 3, 4, '#e89048'); }
      } },
    laoye: { key: 'mx-laoye', skin: '#d6ae8c', hair: '#1e1818', hs: 'short', top: '#34343c', top2: '#e8e4dc', bottom: '#34343c', shoes: '#121212', coat: true, eye: '#1a1214',
      extra(g, d, fr, G, R) { if (d === 0) { R(6, G.hT + 6, 4, 1, '#1e1818'); R(13, G.tT + 2, 1, 12, '#3a2a1a'); R(12, G.tT + 1, 2, 1, '#c8a040'); } } },
    shaoye: { key: 'mx-shao', skin: '#e2bc96', hair: '#141010', hs: 'short', hat: 'cap', hatC: '#16161c', top: '#1c1c26', top2: '#2a2a34', bottom: '#1c1c26', shoes: '#121212', eye: '#1a1214',
      extra(g, d, fr, G, R) { if (d === 0) { R(7, G.tT + 2, 1, 1, '#c8a848'); R(7, G.tT + 4, 1, 1, '#c8a848'); R(7, G.tT + 6, 1, 1, '#c8a848'); R(7, G.hT - 1, 2, 1, '#c8a848'); } } },
    xiaojie: { key: 'mx-xj', skin: '#ecc8a4', hair: '#1a1212', hs: 'bob', top: '#d8a8b8', top2: '#f0e0e4', bottom: '#d8a8b8', dress: true, shoes: '#2a1a1a', eye: '#1a1214',
      extra(g, d, fr, G, R) { R(10, G.hT - 1, 3, 2, '#f0f0f0'); } },
    ajiao: { key: 'mx-ajiao', skin: '#d8a878', hair: '#1a1010', hs: 'bob', child: true, top: '#8a7a5a', top2: '#6a5a40', bottom: '#6a5a4a', shoes: '#c89868', eye: '#1a1214' }
  };
  for (const k of ['laoye', 'taitai', 'shaoye', 'xiaojie', 'achun', 'ajiao']) PEOPLE_M['o_' + k] = sepP(PEOPLE_M[k], SEP, 'mx-o-' + k);
  PEOPLE_M.n_achunG = sepP(PEOPLE_M.achunG, POL, 'mx-n-achunG');

  /* ---------- 物品与笔记 ---------- */
  const ITEMS_M = {
    album: { name: '阿嬷的相簿', desc: '黑色硬皮，边角磨得发白。前三页是同一栋红砖洋楼，照片背面有钢笔写的拍摄位置。\n（按 J 可以重看背面的字）' },
    cam: { name: '拍立得', desc: '阿哲的拍立得，一盒十张相纸。按下快门，相纸会「嘰——」地吐出来，等一下才显影。' },
    bar: { name: '铁撬', desc: '电视台器材箱里的铁撬，一头扁一头弯，沉甸甸的。撬砖、撬土都用得上。' },
    jade: { name: '玉镯', desc: '一只翠绿的玉镯，冰得像刚从水里捞上来。\n内侧刻着一个小小的「刘」字。' }
  };
  const NOTES_M = {
    album: { title: '阿嬷的相簿（照片背面）', text: '第一页\n昭和十年十月十日　洋楼落成六周年　全家写真\n——自铁门入，第五块石板上，面北。\n\n第二页\n同日　大厅　奉茶\n——自神明桌前，退七步，面北。\n\n第三页\n同日　后院　井边\n——出了后门，往南走八步，再往西走九步，面北。\n\n最后一页，是阿嬷的字。铅笔，抖得很厉害：\n「阿春姊仔没有偷。照片里有。\n我那时候八岁，不敢讲。\n晴仔，帮阿嬷还给伊。」' },
    tvcrew: { title: '外景场记单（压在器材箱底下）', text: '《○○灵异档案》外景　民雄古厝　2001.7.14\n\n01　外观　OK\n02　大厅　OK（灯架倒了两次）\n03　东厢楼梯　NG（楼梯断了，上不去）\n04　后院「古井」　拍立得今昔对照\n　　第一张：正常。\n　　第二张：井边多一个人影？（导演：留着，后制再说）\n　　第三张：摄影大哥按完就说不拍了。\n\n备注：\n· 隔壁阿婆说，以前有人要拆，怪手一开进院子就熄火，换了三台都一样。（导演：这段可以用）\n· 先撤。器材箱明天再回来拿。' },
    heitai: { title: '日本兵留下的木牌与刻字', text: '木牌（墨字）：\n　夜間　井戸ニ近ヅクベカラズ　　部隊長\n　（夜间不得接近井边。）\n\n墙上用刺刀刻的字，一行一行，歪歪斜斜：\n　昭和十九年八月　本隊　此ノ屋ニ宿営ス\n　旧井戸ハ埋メ立テラレ　所在不明\n　新井戸ヲ東ニ掘ル\n　（旧井已被填平，位置不明。新井挖在东边。）\n　夜毎　井戸ノ辺ニ　女ノ泣ク声\n　（每夜，井边都有女人的哭声。）\n\n最底下一行刻得很浅：\n　帰リタイ（想回家）' },
    iou: { title: '铁盒里的借据', text: '借　据\n今借到　金参百圆整\n言明一月内连本带利奉还，不得延误。\n昭和十年十月九日\n借款人　刘○○（印）\n\n借据背面，铅笔写了一行小字：\n「镯仔暂放花瓶脚下，等风头过了再拿去当。」' }
  };

  /* ---------- 瓦片 ---------- */
  function rootsPaint(R, X, Y) {
    R(0, 0, 16, 16, '#1e1812');
    for (let i = 0; i < 6; i++) { const x = (hash(X, Y, 200 + i) * 14) | 0, c = i % 2 ? '#4a3a26' : '#3a2c1c'; R(x, 0, 2, 16, c); R(x + 1, (hash(X, Y, 210 + i) * 12) | 0, 1, 4, '#5e4a32'); }
    for (let i = 0; i < 3; i++) { const y = (hash(X, Y, 220 + i) * 14) | 0; R(0, y, 16, 1, '#2e2216'); }
    if (hash(X, Y, 230) < .5) { R(3, 4, 4, 3, '#24361e'); R(9, 10, 3, 2, '#2c4224'); }
  }
  const PT = {   // 照片里用的瓦片（全部可以走，放大镜要能移到任何地方）
    top: (R) => { R(0, 0, 16, 16, '#2a1e1a'); R(0, 15, 16, 1, '#3a2a22'); },
    brick: (R, X, Y) => paintWall(R, X, Y, true, WALLSTYLE.brick, () => true),
    plaster: (R, X, Y) => paintWall(R, X, Y, true, { face: '#b4a88c', trim: '#6a5a44', pat: 'plain' }, () => true),
    stone: (R, X, Y) => TILE.stone.paint(R, X, Y),
    slab: (R, X, Y) => slabPaint(R, X, Y),
    grass: (R, X, Y) => TILE.grass.paint(R, X, Y, { grassC: '#34502c' }),
    dirt: (R, X, Y) => TILE.dirt.paint(R, X, Y),
    terr: (R, X, Y) => terrPaint(R, X, Y, false),
    terrO: (R, X, Y) => terrPaint(R, X, Y, true),
    roots: (R, X, Y) => { TILE.dirt.paint(R, X, Y); for (let i = 0; i < 4; i++) { const x = (hash(X, Y, 240 + i) * 13) | 0, y = (hash(X, Y, 250 + i) * 10) | 0; R(x, y, 2, 16 - y, i % 2 ? '#5a4630' : '#4a3a26'); R(x + 1, y, 1, 3, '#6e5a40'); } R((hash(X, Y, 260) * 8) | 0, 9, 8, 1, '#4a3a26'); if (hash(X, Y, 261) < .5) R(3, 3, 3, 2, '#3a5a2e'); }
  };
  function slabPaint(R, X, Y) {
    TILE.grass.paint(R, X, Y, { grassC: '#2a3e26' });
    R(1, 1, 14, 14, '#4a4842'); R(2, 2, 12, 12, '#6e6a60'); R(2, 2, 12, 1, '#86827a'); R(2, 13, 12, 1, '#55524a');
    if (hash(X, Y, 61) < .5) R(4 + ((hash(X, Y, 62) * 6) | 0), 6, 4, 1, '#5a5850');
  }
  function terrPaint(R, X, Y, clean) {
    R(0, 0, 16, 16, clean ? '#c4b8a0' : '#8a8274');
    for (let i = 0; i < 14; i++) R((hash(X, Y, 300 + i) * 15) | 0, (hash(Y, X, 310 + i) * 15) | 0, 1, 1, i % 3 ? (clean ? '#a89c84' : '#6e665a') : (clean ? '#e0d6c0' : '#a49c8c'));
    R(0, 15, 16, 1, clean ? '#a4987e' : '#6a6256'); R(15, 0, 1, 16, clean ? '#a4987e' : '#6a6256');
    if (!clean && hash(X, Y, 320) < .35) { R(3, 9, 5, 3, '#4a4436'); R(9, 3, 3, 2, '#3e4a2c'); }
  }
  const TILES_M = {
    roots: { solid: true, paint: rootsPaint },
    slab: { solid: false, paint: slabPaint },
    ironf: { solid: true, paint(R, X, Y) { TILE.dirt.paint(R, X, Y); R(0, 4, 16, 2, '#3a2a22'); R(0, 12, 16, 2, '#3a2a22'); for (let x = 1; x < 16; x += 4) { R(x, 1, 2, 15, '#4a3428'); R(x, 0, 2, 1, '#6a4a38'); R(x + 1, 2, 1, 12, '#5e3e2c'); } if (hash(X, Y, 71) < .4) R(5, 7, 4, 2, '#7a3a1a'); } },
    bamboo: { solid: true, paint(R, X, Y) { R(0, 0, 16, 16, '#142418'); for (let i = 0; i < 4; i++) { const x = (hash(X, Y, 80 + i) * 14) | 0; R(x, 0, 2, 16, i % 2 ? '#4e7a40' : '#3e6232'); R(x, (hash(X, Y, 90 + i) * 13) | 0, 2, 1, '#22401e'); } R(0, 6, 16, 1, '#5a4a30'); R(0, 12, 16, 1, '#5a4a30'); } },
    terr: { solid: false, paint: (R, X, Y) => terrPaint(R, X, Y, false) },
    terrN: { solid: false, paint: (R, X, Y) => terrPaint(R, X, Y, true) },
    desk: { solid: false, paint(R, X, Y) { R(0, 0, 16, 16, '#2a1c14'); for (let r = 0; r < 4; r++) R(0, r * 4 + 3, 16, 1, '#20140e'); R(((hash(X, Y, 5) * 13) | 0), 1 + ((hash(X, Y, 6) * 3) | 0) * 4, 3, 1, '#34241a'); } }
  };
  for (const k in PT) {
    TILES_M['po_' + k] = { solid: false, paint: (R, X, Y, o) => PT[k](xR(R, SEP), X, Y, o) };
    TILES_M['pn_' + k] = { solid: false, paint: (R, X, Y, o) => PT[k](xR(R, POL), X, Y, o) };
  }
  const PH_LEG = { T: 'po_top', F: 'po_brick', P: 'po_plaster', K: 'po_stone', S: 'po_slab', G: 'po_grass', D: 'po_dirt', M: 'po_terrO',
    t: 'pn_top', f: 'pn_brick', p: 'pn_plaster', k: 'pn_stone', s: 'pn_slab', g: 'pn_grass', d: 'pn_dirt', m: 'pn_terr', r: 'pn_roots' };

  /* ---------- 自定义精灵（只用 R 画，好让照片版本统一调色） ---------- */
  const CS = {
    /* 正面洋楼：两层红砖、拱窗、女儿墙与山墙；左半边被榕树吞掉 */
    facade(g, e, t, R) {
      const W2 = e.w * 16, B = '#7c3a2c', BL = '#5e2a20', BH = '#94503c', TR = '#cbbfa6', TRD = '#9a8e78';
      R(0, -46, W2, 62, B);
      for (let y = -46; y < 16; y += 4) { R(0, y + 3, W2, 1, BL); const o = ((y / 4) & 1) ? 0 : 6; for (let x = o; x < W2; x += 12) R(x, y, 1, 3, BL); }
      R(-2, -52, W2 + 4, 7, TR); R(-2, -46, W2 + 4, 1, TRD); for (let x = 4; x < W2 - 4; x += 8) R(x, -51, 3, 5, TRD);
      const cx = W2 / 2; R(cx - 26, -62, 52, 11, TR); R(cx - 18, -68, 36, 7, TR); R(cx - 8, -72, 16, 5, TR); R(cx - 7, -63, 14, 10, TRD); R(cx - 5, -61, 10, 6, '#6a4a32');
      R(-2, -18, W2 + 4, 3, TR); R(-2, -15, W2 + 4, 1, TRD);
      for (const x of [0, 36, cx - 18, cx + 14, W2 - 40, W2 - 4]) R(x, -46, 4, 62, BH);
      const win = (x, y, k) => { R(x, y - 3, 12, 3, TR); R(x - 1, y, 14, 19, TR); R(x + 1, y + 1, 10, 17, '#0c1014'); R(x + 6, y + 1, 1, 17, TRD); R(x + 1, y + 8, 10, 1, TRD); R(x + 2, y + 3, 3, 4, '#1c2630'); if (k) R(x + 7, y + 10, 3, 5, '#2a3540'); R(x - 1, y + 19, 14, 2, TRD); };
      for (const [x, y] of [[18, -42], [50, -42], [cx - 6, -42], [W2 - 62, -42], [W2 - 30, -42], [18, -9], [50, -9], [W2 - 62, -9], [W2 - 30, -9]]) win(x, y, x !== cx - 6);
      /* 中间那扇窗：玻璃破了一个洞 */
      R(cx - 4, -38, 4, 5, '#05070a');
      /* 榕树的气根：从女儿墙爬下来，吞掉左边 */
      for (let i = 0; i < 18; i++) { const x = (hash(i, 3, 41) * 64) | 0, len = 30 + ((hash(i, 4, 41) * 50) | 0); R(x, -56, 2, len, i % 2 ? '#3a2a1a' : '#4a3824'); R(x + 1, -56 + len - 3, 1, 3, '#2a1e12'); }
      R(-4, -66, 70, 12, '#1e3220'); R(4, -72, 46, 8, '#24402a'); R(10, -64, 12, 4, '#2e5034'); R(40, -60, 18, 5, '#1a2c1c');
      for (let i = 0; i < 6; i++) R(W2 - 12 - i * 9, -50 + (i % 3) * 7, 2, 18 + i * 3, '#3a2a1a');
      R(W2 - 30, -66, 34, 10, '#1e3220');
    },
    /* 正门：拱形门洞，一扇门板歪着挂 */
    mdoor(g, e, t, R) {
      R(1, -14, 30, 4, '#cbbfa6'); R(3, -18, 26, 4, '#cbbfa6'); R(8, -20, 16, 2, '#cbbfa6');
      R(3, -10, 26, 26, '#cbbfa6'); R(5, -14, 22, 30, '#08070a'); R(7, -16, 18, 2, '#08070a');
      R(5, -8, 6, 24, '#4a3020'); R(6, -6, 4, 9, '#5a3c28'); R(6, 5, 4, 9, '#5a3c28'); R(10, 2, 1, 2, '#9a8a5a');
      R(20, -10, 3, 26, '#2a1c12'); R(14, 8, 8, 1, '#3a2a1a');
    },
    /* 大榕树：粗干、一把一把的气根、遮天的树冠 */
    banyan(g, e, t, R) {
      R(-14, -42, 60, 26, '#1a2e1c'); R(-6, -50, 44, 12, '#203a22'); R(-10, -30, 52, 18, '#162818');
      for (let i = 0; i < 8; i++) R(-8 + i * 7, -44 + (i % 3) * 4, 5, 3, '#2c4a2e');
      R(8, -18, 16, 34, '#3e3020'); R(10, -18, 4, 34, '#4e3e2a'); R(18, -12, 3, 28, '#2e2416');
      for (let i = 0; i < 11; i++) { const x = -8 + ((hash(e.x, i, 5) * 46) | 0); R(x, -24 + (i % 4) * 2, 1, 36 - (i % 4) * 2, i % 2 ? '#4a3a26' : '#3a2c1c'); }
      R(0, 13, 32, 3, '#2a2014'); R(-4, 14, 6, 2, '#3a2c1c'); R(28, 14, 7, 2, '#3a2c1c');
    },
    /* 照片背景用的洋楼正面（8 格宽、画三行高） */
    pfacade(g, e, t, R) {
      const W2 = 128, B = '#7c3a2c', BL = '#5e2a20', TR = '#cbbfa6', TRD = '#9a8e78';
      R(0, -32, W2, 48, B);
      for (let y = -32; y < 16; y += 4) { R(0, y + 3, W2, 1, BL); const o = ((y / 4) & 1) ? 0 : 6; for (let x = o; x < W2; x += 12) R(x, y, 1, 3, BL); }
      R(-1, -32, W2 + 2, 5, TR); for (let x = 3; x < W2 - 3; x += 7) R(x, -31, 2, 4, TRD);
      R(52, -32, 24, 3, TR); R(58, -32, 12, 1, TRD);
      R(-1, -1, W2 + 2, 2, TR); for (const x of [0, 40, 84, 124]) R(x, -32, 4, 48, '#94503c');
      if (e.k === 'n') {
        for (let i = 0; i < 14; i++) { const x = (hash(i, 9, 43) * 44) | 0; R(x, -30, 2, 20 + ((hash(i, 8, 43) * 30) | 0), i % 2 ? '#3a2a1a' : '#4a3824'); }
        R(0, -32, 48, 6, '#1e3220'); R(0, -32, 30, 3, '#24402a');
        R(70, -20, 22, 8, 'rgba(30,24,20,.35)'); R(100, 4, 18, 10, 'rgba(30,24,20,.3)');
      }
    },
    /* 照片里的窗：k=o 新玻璃 / b 碎玻璃 / f 碎玻璃后面贴着一张脸 */
    win(g, e, t, R) {
      const TR = '#cbbfa6', TRD = '#9a8e78';
      R(2, 0, 12, 2, TR); R(1, 2, 14, 13, TR); R(3, 3, 10, 11, e.k === 'o' ? '#3a4a5a' : '#0a0e12');
      if (e.k === 'o') { R(4, 4, 3, 4, '#6a7a8a'); R(9, 9, 2, 2, '#5a6a7a'); }
      R(7, 3, 1, 11, TRD); R(3, 8, 10, 1, TRD);
      if (e.k !== 'o') { R(4, 4, 2, 3, '#1c2630'); R(10, 10, 2, 3, '#2a3540'); }
      if (e.k === 'f') { R(4, 5, 7, 8, '#080a0c'); R(5, 6, 5, 6, '#d8dcd8'); R(5, 6, 5, 1, '#0a0a0c'); R(5, 7, 1, 4, '#0a0a0c'); R(9, 7, 1, 4, '#0a0a0c'); R(6, 8, 1, 1, '#101010'); R(8, 8, 1, 1, '#101010'); R(7, 10, 1, 1, '#5a4a5a'); }
    },
    /* 照片里的正门（2 格宽） */
    pdoor(g, e, t, R) {
      R(0, -2, 32, 18, '#cbbfa6'); R(3, -6, 26, 4, '#cbbfa6');
      if (e.k === 'o') { R(3, 0, 26, 16, '#5a3a22'); R(15, 0, 2, 16, '#3a2414'); for (const x of [5, 19]) { R(x, 2, 8, 5, '#6a4a30'); R(x, 9, 8, 5, '#6a4a30'); } R(13, 8, 1, 2, '#c8a040'); R(18, 8, 1, 2, '#c8a040'); }
      else { R(3, -2, 26, 18, '#08070a'); R(4, 0, 5, 16, '#3a2818'); R(20, -2, 2, 18, '#2a1c12'); }
    },
    plaque(g, e, t, R) { R(4, 2, 24, 10, '#cbbfa6'); R(6, 4, 20, 6, '#9a8e78'); R(10, 5, 2, 4, '#5a4a3a'); R(14, 5, 2, 4, '#5a4a3a'); R(18, 5, 2, 4, '#5a4a3a'); R(22, 5, 2, 4, '#5a4a3a'); },
    sapling(g, e, t, R) { R(7, 4, 2, 11, '#4a3624'); R(3, -4, 10, 9, '#2c4a2a'); R(5, -6, 6, 3, '#365a32'); R(4, 14, 8, 2, '#3a2c1c'); },
    banyanP(g, e, t, R) {   // 照片里的大榕树（2 格宽）
      R(0, -48, 36, 22, '#1a2e1c'); R(2, -48, 26, 6, '#203a22'); R(0, -30, 38, 16, '#162818');
      R(8, -16, 14, 32, '#3e3020'); R(10, -16, 3, 32, '#4e3e2a');
      for (let i = 0; i < 9; i++) R(-2 + i * 4, -28 + (i % 3) * 3, 1, 40 - (i % 3) * 3, i % 2 ? '#4a3a26' : '#3a2c1c');
    },
    geta(g, e, t, R) { for (const x of [3, 9]) { R(x, 9, 4, 6, '#8a6a42'); R(x, 9, 4, 1, '#a88a5a'); R(x + 1, 15, 2, 1, '#4a3420'); R(x + 1, 10, 2, 2, '#6a2a2a'); } R(4, 15, 9, 1, 'rgba(120,150,170,.5)'); },
    /* 神明桌（3 格宽）：k=new 供着观音、点着油灯 / ruin 塌了一角 */
    shenming(g, e, t, R) {
      const c = '#5a2418';
      if (e.k === 'ruin') {
        R(0, 2, 30, 10, c); R(1, 3, 28, 2, '#7a3a24'); R(30, 6, 18, 6, '#3a1a10'); R(36, 8, 10, 2, '#2a120a'); R(2, 12, 3, 4, '#3a1a10'); R(25, 12, 3, 4, '#3a1a10');
        R(12, -4, 10, 6, '#1a1210'); R(13, -3, 8, 4, '#2a2018');
        R(20, 2, 6, 1, '#1a1210'); R(40, 12, 6, 3, '#2a1a10');
        return;
      }
      R(0, 2, 48, 11, c); R(1, 3, 46, 2, '#8a4a2a'); R(2, 13, 3, 3, '#3a1a10'); R(43, 13, 3, 3, '#3a1a10');
      R(4, 6, 40, 6, '#b03020'); R(6, 7, 36, 1, '#d8a040');
      R(19, -10, 10, 12, '#2a1a10'); R(20, -9, 8, 10, '#e8e0cc'); R(22, -7, 4, 3, '#f0e8d8'); R(21, -4, 6, 5, '#d8d0bc');
      for (const x of [8, 37]) { R(x, -2, 3, 4, '#c8a040'); const f = Math.sin(t * 11 + x) > 0 ? 1 : 0; R(x + 1, -5 + f, 1, 3 - f, '#ffcf5a'); }
    },
    /* 青花大花瓶，摆在木架上 */
    vase(g, e, t, R) { R(3, 9, 10, 6, '#3a2418'); R(2, 8, 12, 2, '#5a3a24'); R(5, -10, 6, 3, '#e8ecf0'); R(4, -7, 8, 15, '#e8ecf0'); R(3, -3, 10, 9, '#e8ecf0'); R(5, -5, 6, 1, '#2a4a8a'); R(4, -1, 8, 2, '#3a5aa0'); R(5, 3, 2, 2, '#2a4a8a'); R(9, 2, 2, 3, '#2a4a8a'); R(6, -10, 4, 1, '#2a4a8a'); },
    /* 全家福相框：scr=头家娘的脸被刮掉 */
    famframe(g, e, t, R) {
      R(1, 0, 14, 12, '#5a3a1a'); R(2, 1, 12, 10, '#3a3028'); R(3, 2, 10, 8, '#8a8070');
      R(4, 4, 3, 3, '#d8c8b0'); R(4, 7, 3, 3, '#2a2a30'); R(9, 4, 3, 3, '#d8c8b0'); R(9, 7, 3, 3, '#5a2a48'); R(4, 3, 3, 1, '#1a1414'); R(9, 3, 3, 1, '#1a1414');
      if (e.scr) { R(8, 3, 5, 5, '#3a3028'); R(8, 4, 5, 1, '#c8c0b0'); R(9, 3, 1, 5, '#c8c0b0'); R(11, 3, 1, 5, '#c8c0b0'); R(8, 6, 5, 1, '#c8c0b0'); }
      if (e.brk) { R(3, 2, 1, 6, '#c8d0d8'); R(4, 6, 4, 1, '#c8d0d8'); }
    },
    /* 侧门：open 门洞（老照片、那一夜）/ 否则被红砖封死 */
    bricked(g, e, t, R) {
      R(1, -2, 14, 16, '#cbbfa6'); R(3, -4, 10, 2, '#cbbfa6');
      if (e.open) { R(3, -2, 10, 16, '#0a0806'); return; }
      R(3, -2, 10, 16, '#8a4a38'); for (let y = 0; y < 16; y += 3) { R(3, y - 1, 10, 1, '#5a2e22'); R(3 + ((y / 3) & 1) * 4, y - 3, 1, 2, '#5a2e22'); R(9 + ((y / 3) & 1) * 2, y - 3, 1, 2, '#5a2e22'); }
    },
    /* 八仙桌：k=new 摆着茶具和漆盒（漆盒里一点翠绿）/ ruin 烂掉的桌子 */
    tea(g, e, t, R) {
      if (e.k === 'ruin') { R(1, 4, 14, 8, '#3a2a1c'); R(2, 5, 12, 2, '#4a3828'); R(2, 12, 2, 4, '#2a1c12'); R(12, 12, 2, 3, '#2a1c12'); R(8, 6, 5, 2, '#2a1c12'); return; }
      R(1, 4, 14, 8, '#5a3420'); R(2, 5, 12, 2, '#7a4a2c'); R(2, 12, 2, 4, '#3a2014'); R(12, 12, 2, 4, '#3a2014');
      R(3, 1, 3, 4, '#e8e4dc'); R(4, 0, 1, 1, '#e8e4dc'); R(7, 3, 2, 2, '#e8e4dc'); R(10, 1, 4, 4, '#2a0a0a'); R(10, 1, 4, 1, '#8a1a1a');
      if (!e.empty) R(11, 2, 2, 2, '#4ac080');
    },
    pillar(g, e, t, R) {
      if (e.stub) { R(3, 6, 10, 9, '#c4b8a0'); R(3, 6, 10, 1, '#9a8e78'); R(4, 4, 3, 2, '#c4b8a0'); R(9, 5, 2, 1, '#c4b8a0'); for (let i = 0; i < 5; i++) R(2 + i * 3, 3 + (i % 2) * 3, 1, 12, '#4a3a26'); R(0, 13, 16, 3, '#3a2c1c'); return; }
      R(2, -26, 12, 3, '#d8ccb4'); R(3, -23, 10, 2, '#a89c84'); R(4, -21, 8, 33, '#c4b8a0'); R(4, -21, 2, 33, '#d8ccb4'); R(10, -21, 2, 33, '#9a8e78'); R(2, 12, 12, 3, '#a89c84');
    },
    capwell(g, e, t, R) {   // 水泥封住的「井」
      R(1, 3, 14, 12, '#6a6a68'); R(1, 3, 14, 1, '#8a8a86'); R(2, 13, 12, 2, '#4a4a48'); R(0, 1, 16, 4, '#7a7a76'); R(0, 1, 16, 1, '#9a9a94');
      R(3, 0, 10, 2, '#2a2422'); R(4, 0, 3, 1, '#4a3a30'); R(9, 0, 2, 1, '#5a4a3a');
      R(2, 6, 1, 5, '#c03020'); R(13, 7, 1, 4, '#c03020'); R(5, 7, 6, 1, '#4a4a48'); R(6, 9, 4, 1, '#4a4a48');
    },
    stump(g, e, t, R) { R(3, 6, 10, 8, '#4a3624'); R(3, 6, 10, 3, '#8a7050'); R(5, 7, 6, 1, '#6a5038'); R(7, 8, 2, 1, '#6a5038'); R(1, 12, 4, 3, '#3a2a1a'); R(11, 12, 4, 3, '#3a2a1a'); },
    mango(g, e, t, R) { R(6, 0, 4, 15, '#4a3624'); R(-4, -24, 24, 18, '#1e3a1e'); R(-2, -28, 20, 6, '#244824'); R(-6, -16, 28, 10, '#1a321a'); R(0, -20, 4, 3, '#3a6a32'); R(10, -14, 4, 3, '#3a6a32'); R(4, -10, 2, 2, '#c8a040'); },
    basin(g, e, t, R) { R(2, 8, 12, 6, '#7a5a3a'); R(2, 8, 12, 1, '#9a7a52'); R(3, 9, 10, 3, '#4a6a7a'); R(4, 9, 3, 2, '#5a9a4a'); R(9, 10, 3, 1, '#6aaa5a'); },
    wet(g, e, t, R) { R(3, 4, 10, 8, 'rgba(70,110,140,.32)'); R(5, 3, 6, 10, 'rgba(70,110,140,.28)'); R(6, 12, 1, 4, 'rgba(90,130,160,.4)'); R(10, 11, 1, 3, 'rgba(90,130,160,.35)'); R(5, 5, 3, 1, 'rgba(200,220,235,.35)'); },
    kneel(g, e, t, R) {   // 跪在地上的女人：湿头发垂到地上，两手按着地砖
      const H = '#080a0e', SK = '#c4ccd0', TP = '#3e4a5e';
      R(3, 6, 10, 8, TP); R(2, 12, 12, 3, TP); R(3, 14, 4, 1, SK); R(9, 14, 4, 1, SK);
      R(4, 1, 8, 8, H); R(3, 4, 10, 10, H); R(5, 12, 1, 4, H); R(8, 12, 2, 4, H); R(11, 12, 1, 3, H);
      R(6, 8, 4, 2, SK);
      R(1, 15, 14, 1, 'rgba(110,150,175,.6)'); const k = ((t * 3) | 0) % 4; R(4 + k * 2, 15, 1, 1, '#9ab8d0');
    },
    /* 照片边框：old 带黑色相角的老相纸 / pola 拍立得 */
    frame(g, e, t, R) {
      const w = e.w * 16, h = e.h * 16;
      if (e.k === 'old') {
        const c = '#d8ccb0'; R(-5, -5, w + 10, 5, c); R(-5, h, w + 10, 6, c); R(-5, 0, 5, h, c); R(w, 0, 5, h, c);
        for (let x = -5; x < w + 5; x += 3) { R(x, -6, 2, 1, c); R(x + 1, h + 6, 2, 1, c); }
        for (const [x, y, sx, sy] of [[-6, -6, 1, 1], [w + 6, -6, -1, 1], [-6, h + 6, 1, -1], [w + 6, h + 6, -1, -1]]) for (let i = 0; i < 7; i++) R(sx > 0 ? x : x - (7 - i), sy > 0 ? y + i : y - i, 7 - i, 1, '#141010');
      } else {
        const c = '#eeeae2'; R(-4, -4, w + 8, 4, c); R(-4, h, w + 8, 14, c); R(-4, 0, 4, h, c); R(w, 0, 4, h, c);
        R(w - 30, h + 5, 26, 1, '#a8a49c'); R(w - 22, h + 8, 18, 1, '#a8a49c');
      }
    },
    /* 找到的地方：红笔圈起来；h=提示（黄色虚线一闪一闪） */
    ring(g, e, t, R) {
      const w = e.w * 16, c = e.h2 ? (Math.sin(t * 8) > 0 ? '#ffe060' : 'rgba(0,0,0,0)') : '#e02020';
      if (!c) return;
      for (let x = 2; x < w - 2; x += e.h2 ? 3 : 1) { R(x, -1, 1, 1, c); R(x, 16, 1, 1, c); }
      for (let y = 1; y < 15; y += e.h2 ? 3 : 1) { R(0, y, 1, 1, c); R(w - 1, y, 1, 1, c); }
      R(1, 0, 1, 1, c); R(w - 2, 0, 1, 1, c); R(1, 15, 1, 1, c); R(w - 2, 15, 1, 1, c);
    },
    /* 放大镜（看照片时的「玩家」） */
    loupe(g, e, t, R) {
      const c = '#f0e8c8', d = '#2a2018';
      R(0, 0, 4, 1, c); R(0, 0, 1, 4, c); R(12, 0, 4, 1, c); R(15, 0, 1, 4, c); R(0, 15, 4, 1, c); R(0, 12, 1, 4, c); R(12, 15, 4, 1, c); R(15, 12, 1, 4, c);
      R(4, 2, 8, 1, d); R(4, 13, 8, 1, d); R(2, 4, 1, 8, d); R(13, 4, 1, 8, d); R(3, 3, 1, 1, d); R(12, 3, 1, 1, d); R(3, 12, 1, 1, d); R(12, 12, 1, 1, d);
      R(5, 3, 3, 1, 'rgba(255,255,255,.5)'); R(3, 5, 1, 3, 'rgba(255,255,255,.5)');
      R(13, 13, 2, 2, '#6a4a2a'); R(15, 15, 3, 3, '#5a3a20');
    },
    /* ---- 屋里 ---- */
    crack(g, e, t, R) {   // 神明桌右边那块裂开的地砖
      if (e.open) { R(1, 1, 14, 14, '#0e0c0a'); R(2, 2, 12, 2, '#2a2620'); if (!e.took) { R(4, 6, 8, 6, '#6a5a4a'); R(4, 6, 8, 1, '#8a7a62'); R(7, 8, 2, 2, '#4a3a2a'); } R(10, -2, 6, 4, '#8a8274'); return; }
      R(3, 4, 6, 1, '#3a342c'); R(8, 5, 1, 4, '#3a342c'); R(9, 8, 5, 1, '#3a342c'); R(5, 9, 3, 1, '#3a342c'); R(4, 10, 1, 3, '#3a342c');
      R(0, 0, 16, 1, '#5a5448'); R(0, 15, 16, 1, '#5a5448');
    },
    case(g, e, t, R) {   // 电视台丢下的铝合金器材箱
      R(0, 3, 16, 12, '#8a8e94'); R(0, 3, 16, 1, '#b4b8bc'); R(0, 14, 16, 1, '#5a5e64'); R(7, 2, 2, 2, '#3a3a3e'); R(2, 8, 12, 1, '#6a6e74');
      R(3, 11, 10, 2, '#e8e4dc'); R(4, 11, 3, 1, '#c02020');
      if (e.open) { R(0, -4, 16, 7, '#9a9ea4'); R(1, -3, 14, 5, '#3a3a3e'); if (!e.took) { R(3, 4, 10, 2, '#2a2a2e'); R(3, 4, 1, 4, '#2a2a2e'); } }
    },
    tripod(g, e, t, R) { R(7, -6, 2, 4, '#2a2a2e'); R(5, -2, 6, 3, '#3a3a3e'); R(4, 1, 1, 13, '#4a4a4e'); R(11, 1, 1, 9, '#4a4a4e'); R(10, 10, 4, 1, '#4a4a4e'); R(7, 1, 1, 14, '#4a4a4e'); },
    kisatsu(g, e, t, R) { R(3, -2, 10, 14, '#6a5032'); R(3, -2, 10, 1, '#8a6a42'); for (const x of [5, 8, 11]) for (let y = 0; y < 10; y += 2) R(x, y, 1, 1 + (y % 4 ? 0 : 1), '#141010'); R(7, -4, 2, 2, '#3a3a3a'); },
    carve(g, e, t, R) { for (let i = 0; i < 6; i++) R(2 + i * 2, 2, 1, 6, '#3a3028'); R(1, 5, 13, 1, '#3a3028'); for (let i = 0; i < 4; i++) R(3 + i * 3, 9, 2, 1, '#3a3028'); R(4, 11, 1, 2, '#3a3028'); R(7, 11, 3, 1, '#3a3028'); },
    suitou(g, e, t, R) { R(5, 6, 6, 8, '#4a5a3a'); R(6, 4, 4, 2, '#3a4a2e'); R(7, 3, 2, 1, '#8a8a8a'); R(5, 9, 6, 1, '#3a2a1a'); R(9, 7, 1, 2, '#6a7a5a'); },
    bdoor(g, e, t, R) {   // 东厢后门；roots=被榕树根缠死
      R(1, -3, 14, 17, '#cbbfa6'); R(3, -2, 10, 16, '#4a3020'); R(4, 0, 8, 5, '#5a3c28'); R(4, 7, 8, 5, '#5a3c28'); R(11, 6, 1, 2, '#9a8a5a');
      if (e.roots) for (let i = 0; i < 7; i++) { R(1 + i * 2, -4 + (i % 3) * 2, 2, 18, i % 2 ? '#3a2a1a' : '#4a3824'); R(0, 2 + i * 2, 16, 1, '#2e2216'); }
    },
    olamp(g, e, t, R) { R(6, 0, 4, 2, '#3a3028'); R(5, 2, 6, 6, '#c8a050'); R(6, 3, 4, 4, e.off ? '#4a3a2a' : '#ffd890'); R(7, 8, 2, 2, '#3a3028'); },
    oldwell(g, e, t, R) {   // 挖出来的旧井口：一圈石头，里面塞满了土
      R(0, 3, 16, 12, '#5a5650'); R(1, 4, 14, 10, '#6e6a62'); R(3, 5, 10, 7, '#0a0908'); R(4, 6, 8, 4, '#1a1612');
      for (const [x, y] of [[0, 3], [5, 2], [11, 3], [0, 10], [12, 11], [6, 13]]) R(x, y, 4, 2, '#7e7a70');
      R(5, 8, 2, 1, 'rgba(120,160,190,.4)');
      if (e.photo) { R(9, 4, 5, 6, '#e8e0cc'); R(10, 5, 3, 3, '#8a7a5a'); R(2, 4, 3, 2, '#4ac080'); }
    },
    clump(g, e, t, R) {   // 一团盘起来的树根和土
      if (e.open) { R(1, 4, 14, 10, '#2a2016'); R(3, 6, 10, 6, '#1a140e'); R(4, 8, 3, 2, '#7a3a2a'); R(9, 7, 3, 2, '#6a5a4a'); R(1, 2, 4, 3, '#3a2c1c'); R(12, 12, 4, 3, '#3a2c1c'); return; }
      R(1, 6, 14, 9, '#3a2c1c'); R(2, 4, 12, 4, '#4a3826');
      for (let i = 0; i < 6; i++) R(1 + i * 2 + (i % 2), 2 + (i % 3), 2, 12 - (i % 3), i % 2 ? '#4a3a26' : '#2e2216');
      R(0, 12, 16, 3, '#2a2014');
    },
    jinlu(g, e, t, R) { R(3, 4, 10, 11, '#6a2a1a'); R(2, 3, 12, 2, '#8a3a22'); R(5, 8, 6, 5, '#140806'); const f = Math.sin(t * 9) > 0 ? 1 : 0; R(6, 9 - f, 4, 3 + f, '#ff8a2a'); R(7, 10, 2, 2, '#ffcf5a'); R(7, -1, 1, 4, '#8a3a2a'); R(9, 0, 1, 3, '#8a3a2a'); R(7 + Math.sin(t * 2), -5, 1, 3, 'rgba(220,220,220,.45)'); },
    scooter(g, e, t, R) { R(1, 8, 14, 4, '#b02a2a'); R(2, 5, 7, 4, '#2a2a2a'); R(11, 2, 2, 7, '#8a8a8a'); R(10, 1, 4, 2, '#3a3a3a'); R(1, 11, 4, 4, '#1a1a1a'); R(11, 11, 4, 4, '#1a1a1a'); R(2, 12, 2, 2, '#6a6a6a'); R(12, 12, 2, 2, '#6a6a6a'); R(14, 6, 2, 2, '#ffe8a0'); },
    sign2(g, e, t, R) { R(7, -2, 2, 16, '#4a3a2a'); R(0, -12, 16, 11, '#e8e4dc'); R(0, -12, 16, 1, '#a8a49c'); R(2, -10, 12, 2, '#c02020'); R(2, -6, 9, 1, '#2a2a2a'); R(2, -4, 11, 1, '#2a2a2a'); R(9, -9, 6, 6, 'rgba(40,120,200,.6)'); }
  };
  const WRAP = ['win', 'pdoor', 'pfacade', 'plaque', 'sapling', 'banyanP', 'geta', 'shenming', 'vase', 'famframe', 'bricked', 'tea', 'armchair', 'portrait', 'window', 'pillar', 'well', 'mango', 'basin', 'stump', 'capwell', 'kneel'];
  const SPR_M = Object.assign({}, CS);
  for (const n of WRAP) {
    SPR_M['o_' + n] = (g, e, t, R) => (CS[n] || SPR[n])(g, e, t, xR(R, SEP));
    SPR_M['n_' + n] = (g, e, t, R) => (CS[n] || SPR[n])(g, e, t, xR(R, POL));
  }

  /* ---------- 照片对照：三组 ---------- */
  const O = (id, x, y, spr, on, ex) => Object.assign({ id, x: 1 + x, y: 1 + y, spr, solid: false, on }, ex || {});
  /* 横屏：老照片在左、拍立得在右；竖屏（iPad 竖着拿）：老照片在上、拍立得在下 */
  function phRows(o, n, v) {
    if (v) { const r = [' '.repeat(10)]; for (let y = 0; y < 7; y++) r.push(' ' + o[y] + ' '); r.push(' ' + '.'.repeat(8) + ' ', ' ' + '.'.repeat(8) + ' '); for (let y = 0; y < 7; y++) r.push(' ' + n[y] + ' '); r.push(' ' + '.'.repeat(8) + ' ', ' '.repeat(10)); return r; }
    const r = [' '.repeat(20)]; for (let y = 0; y < 7; y++) r.push(' ' + o[y] + '..' + n[y] + ' '); r.push(' ' + '.'.repeat(18) + ' '); r.push(' '.repeat(20)); return r;
  }
  const say = t => S => S.narr(t);
  const AJ = { A: 1, B: 2, C: 4 };
  const ajiaoOn = (k, t) => async S => {
    await S.narr(t);
    if (S.f.aj & AJ[k]) return;
    const first = !S.f.aj; S.f.aj = (S.f.aj || 0) | AJ[k]; S.sfx('chime');
    if (first) await S.think('（别的照片里……会不会也有阿嬷？）');
    else if (S.f.aj === 7) await S.think('三张照片里，都有她。\n阿嬷一直跟在阿春姊仔身边。');
  };
  /* 每组：找出「多出来的」与「位置变了的」东西 */
  const SCN = {
    A: {
      name: '洋楼正面', need: ['face', 'geta', 'banyan'],
      dirHint: ['看看二楼的窗户。', '看看老照片里阿春站的地方。', '看看左边那棵小榕树。'],
      posHint: ['二楼正中间那扇窗户。', '台阶上，右边数第二个人的位置。', '左下角，那一大团树。'],
      ret: ['yard', 11, 9]
    },
    B: {
      name: '大厅', need: ['door', 'frame', 'kneel'],
      dirHint: ['看看左边墙上那扇侧门。', '看看墙上挂的那几个框。', '看看老照片里摆花瓶的地方。'],
      posHint: ['左上角，侧门的门洞。', '神明桌正上方那张全家福。', '神明桌右边，花瓶原来的位置。'],
      ret: ['hall', 9, 10]
    },
    C: {
      name: '后院', need: ['stub', 'ghost', 'stump', 'cap'],
      dirHint: ['数一数廊下的柱子。', '看看老照片里井的位置。', '看看那棵芒果树。', '看看右下角。'],
      posHint: ['左数第二根柱子。', '第二、第三根柱子中间，廊下前面一步。', '芒果树原来的位置。', '右下角那口水泥封住的井。'],
      ret: ['back', 8, 10]
    }
  };
  const DIFF_TXT = {
    A_face: async S => {
      S.sfx('sting'); S.shake(300, 1);
      await S.narr('二楼正中间那扇窗户。\n老照片里，窗户关着，玻璃擦得发亮。\n拍立得里，玻璃破了一个洞——洞后面贴着一张白白的脸，正往下看。');
      await S.say('阿哲', '……我拍的时候，那扇窗里明明是黑的。我发誓。');
    },
    A_geta: async S => { drip(S); await S.narr('台阶右边，一双木屐，整整齐齐地并排摆着。木屐底下湿了一小片。\n老照片里，那个位置站着一个低着头的年轻女孩。她脚上穿的，就是木屐。'); },
    A_banyan: async S => { await S.narr('左边那棵小榕树……七十年，长成了这个样子。\n气根从二楼的窗户钻进去，又从一楼的门缝钻出来。整栋房子有一半，被它抱在怀里。'); },
    B_door: async S => { await S.narr('左边那扇侧门。老照片里是开着的，有个小女孩从门后面探出头。\n现在，门洞被红砖封死了。砖缝里的灰浆，比墙新得多。'); },
    B_frame: async S => {
      S.sfx('tear');
      await S.narr('神明桌上面那张全家福还在，玻璃碎了。\n头家还是端端正正地坐着——旁边头家娘的脸，被人用尖东西刮掉了。刮得很深，一圈一圈的。');
    },
    B_kneel: async S => {
      await S.scare('face', { spr: '@achunG', face: 'achun', sfx: 'scare' });
      await S.narr('神明桌右边——老照片里摆花瓶的位置——\n跪着一个人。\n湿透的头发垂到地上，两只手按着一块地砖。头低得快要碰到地面。');
      await S.say('阿哲', ['……那块砖。', '她在指那块砖。'], { style: 'whisper' });
    },
    C_stub: async S => { await S.narr('左数第二根柱子……不见了。\n只剩下半截，断口被榕树根包住，不仔细看，根本看不出那里原来有一根柱子。'); await S.think('所以现在从左边数的「第二根」，其实是原来的第三根。'); },
    C_ghost: async S => {
      drip(S); drip(S, .5, .7); S.sfx('whisper');
      await S.narr('第二根和第三根柱子中间，廊下前面一步——\n站着一个人，背对着镜头。\n粗布衫湿透了，水一滴一滴往下掉。她脚下什么都没有，只有土和树根。');
      await S.think('老照片里，那个位置……是井。');
    },
    C_stump: async S => { await S.narr('那棵芒果树只剩一个树头，被锯得平平的。\n老照片里，井就在芒果树的正后面（北边）。'); },
    C_cap: async S => { await S.narr('右下角那口水泥封住的「井」。\n老照片里，那个地方什么都没有。\n——电视台拍的「古井」，七十年前根本不存在。'); }
  };
  function phEnts(k, v) {
    const nx = v ? 1 : 11, ny = v ? 10 : 1;
    const N = (id, x, y, spr, on, ex) => Object.assign({ id, x: nx + x, y: ny + y, spr, solid: false, on }, ex || {});
    const df = (id, x, y, spr, ex) => N(k + '_' + id, x, y, spr, S => found(S, k, id), ex);
    const wets = [];
    const mi = (id, x, y, spr, t, ex) => { wets.push(N('wt_' + k + '_' + id, x, y, 'wet', null, { hidden: true, z: 1 })); return N(k + '_' + id, x, y, spr, S => miss(S, k, t, id), ex); };
    const rg = (id, x, y, w) => ({ id: 'rg_' + k + '_' + id, x: nx + x, y: ny + y, w: w || 1, spr: 'ring', hidden: true, solid: false, z: 2 });
    const fr = [{ x: 1, y: 1, w: 8, h: 7, spr: 'frame', s: { k: 'old' }, decal: true, solid: false }, { x: nx, y: ny, w: 8, h: 7, spr: 'frame', s: { k: 'pola' }, decal: true, solid: false }];
    if (k === 'A') return fr.concat([
      O(null, 0, 2, 'o_pfacade', null, { w: 8, decal: true, s: { k: 'o' } }),
      O('Ao_plq', 3, 0, 'o_plaque', say('山墙上的圆形浮雕，中间刻着几个字，糊掉了看不清。'), { w: 2 }),
      O('Ao_w1', 1, 1, 'o_win', say('新装的玻璃窗，擦得发亮。'), { s: { k: 'o' } }), O('Ao_w2', 4, 1, 'o_win', say('二楼正中间的窗户，关着。里面什么也没有。'), { s: { k: 'o' } }), O('Ao_w3', 6, 1, 'o_win', say('新装的玻璃窗。'), { s: { k: 'o' } }),
      O('Ao_w4', 1, 2, 'o_win', say('一楼的窗户。窗台上摆着一盆兰花。'), { s: { k: 'o' } }), O('Ao_w5', 6, 2, 'o_win', say('一楼的窗户。'), { s: { k: 'o' } }),
      O('Ao_door', 3, 2, 'o_pdoor', say('雕花的大门，门环是铜的。'), { w: 2, s: { k: 'o' } }),
      O('Ao_sap', 0, 3, 'o_sapling', say('一棵刚种下去的小榕树，还没有那个小女孩高。')),
      O('Ao_shao', 2, 4, '@o_shaoye', say('穿学生服的少爷，头抬得很高，两只手插在口袋里。'), { dir: 0 }),
      O('Ao_lao', 3, 4, '@o_laoye', say('中间穿西装的男人，拄着手杖，留着一撇小胡子。这是刘家的头家。'), { dir: 0 }),
      O('Ao_tai', 4, 4, '@o_taitai', say('头家娘。头发梳得光亮，两只手交叠在身前——手腕上戴着一只镯子，很粗，很亮。'), { dir: 0 }),
      O('Ao_xj', 5, 4, '@o_xiaojie', say('扎蝴蝶结的小姐，十二三岁，嘴巴抿着，不太想拍。'), { dir: 0 }),
      O('Ao_chun', 6, 4, '@o_achun', say('一个年轻女孩，穿着粗布衫，低着头，两手绞着围裙。\n照片边上，有人用钢笔写了很小的两个字：阿春。'), { dir: 0 }),
      O('Ao_ajiao', 7, 4, '@o_ajiao', ajiaoOn('A', '最边边，一个八九岁的小女孩，打赤脚，躲在阿春身后，只露出半张脸。\n……这个眼睛。这是阿嬷。'), { dir: 0 }),
      N(null, 0, 2, 'n_pfacade', null, { w: 8, decal: true, s: { k: 'n' } }),
      mi('plq', 3, 0, 'n_plaque', '山墙上的浮雕还在原来的地方，只是长满了青苔。', { w: 2 }),
      mi('w1', 1, 1, 'n_win', '窗玻璃碎了，可窗户还在原来的位置。', { s: { k: 'b' } }), df('face', 4, 1, 'n_win', { s: { k: 'f' } }), mi('w3', 6, 1, 'n_win', '碎掉的窗户，位置没变。', { s: { k: 'b' } }),
      mi('w4', 1, 2, 'n_win', '一楼的窗户，还在老地方。', { s: { k: 'b' } }), mi('w5', 6, 2, 'n_win', '窗框烂了，位置一样。', { s: { k: 'b' } }),
      mi('door', 3, 2, 'n_pdoor', '大门的门板没了，门洞还在原处。', { w: 2, s: { k: 'n' } }),
      mi('step', 2, 3, 'invisible', '台阶还是那几级台阶。'),
      df('geta', 6, 4, 'n_geta'), df('banyan', 0, 3, 'n_banyanP', { w: 2 }),
      rg('face', 4, 1), rg('geta', 6, 4), rg('banyan', 0, 3, 2)
    ], wets);
    if (k === 'B') return fr.concat([
      O('Bo_side', 0, 0, 'o_bricked', say('侧门开着，通往厨房。'), { open: true }),
      O('Bo_p1', 2, 0, 'o_portrait', say('祖先的画像，戴着瓜皮帽。')), O('Bo_fam', 3, 0, 'o_famframe', say('墙上挂着一张全家福：头家和头家娘，坐得端端正正。')), O('Bo_p2', 4, 0, 'o_portrait', say('另一张祖先画像。')),
      O('Bo_win', 6, 0, 'o_window', say('窗户开着，外面是后院的方向。')),
      O('Bo_alt', 2, 1, 'o_shenming', say('神明桌上供着观音，两边点着油灯。'), { w: 3, s: { k: 'new' } }),
      O('Bo_vase', 5, 1, 'o_vase', say('一人高的青花大花瓶，摆在神明桌右边的木架子上。')),
      O('Bo_arm', 4, 2, 'o_armchair', say('一张藤椅。')),
      O('Bo_tea', 3, 3, 'o_tea', say('八仙桌上摆着茶具，还有一个打开的漆盒。\n漆盒里，一只镯子。'), { s: { k: 'new' } }),
      O('Bo_tai', 4, 3, '@o_taitai', say('头家娘坐在藤椅前面，手搭在漆盒旁边。'), { dir: 0 }),
      O('Bo_chun', 2, 3, '@o_achun', say('阿春端着茶盘，弯着腰在奉茶。'), { dir: 2 }),
      O('Bo_shao', 6, 2, '@o_shaoye', say('少爷站在花瓶旁边。他没看镜头——他在看桌上的漆盒。'), { dir: 1 }),
      O('Bo_ajiao', 0, 1, '@o_ajiao', ajiaoOn('B', '侧门门口，露出一个小小的脑袋，正偷偷往里看。\n……又是阿嬷。'), { dir: 2 }),
      df('door', 0, 0, 'n_bricked'),
      mi('p1', 2, 0, 'n_portrait', '画像发了霉，还挂在老地方。'), df('frame', 3, 0, 'n_famframe', { s: { scr: true, brk: true } }), mi('p2', 4, 0, 'n_portrait', '另一张画像，位置没变。'),
      mi('win', 6, 0, 'n_window', '窗户还在原处，只是没有玻璃了。'),
      mi('alt', 2, 1, 'n_shenming', '神明桌塌了一角，可还在原来的位置。', { w: 3, s: { k: 'ruin' } }),
      mi('arm', 4, 2, 'n_armchair', '藤椅只剩骨架，还摆在同一个地方。'),
      mi('tea', 3, 3, 'n_tea', '烂掉的八仙桌，还在老地方。', { s: { k: 'ruin' } }),
      df('kneel', 5, 1, 'n_kneel'),
      rg('door', 0, 0), rg('frame', 3, 0), rg('kneel', 5, 1)
    ], wets);
    return fr.concat([
      O('Co_w1', 1, 0, 'o_window', say('后面的窗户。')), O('Co_w2', 5, 0, 'o_window', say('厨房的窗户，冒着一点蒸气。')),
      O('Co_p1', 0, 1, 'o_pillar', say('廊下的柱子，左数第一根。')), O('Co_p2', 2, 1, 'o_pillar', say('廊下的柱子，左数第二根。')), O('Co_p3', 4, 1, 'o_pillar', say('左数第三根柱子。')), O('Co_p4', 6, 1, 'o_pillar', say('左数第四根柱子。')),
      O('Co_well', 3, 2, 'o_well', say('一口有木头井架的井——就在左数第二根和第三根柱子正中间，廊下前面一步。')),
      O('Co_chun', 4, 2, '@o_achun', say('阿春弯着腰在打水，嘴巴微微张开，像是在哼歌。'), { dir: 1 }),
      O('Co_ajiao', 2, 3, '@o_ajiao', ajiaoOn('C', '小女孩蹲在地上洗菜，抬头看着阿春笑。\n……原来阿嬷小时候，是这样笑的。'), { dir: 2 }),
      O('Co_basin', 2, 4, 'o_basin', say('洗菜的木盆。')),
      O('Co_mango', 3, 5, 'o_mango', say('一棵芒果树，种在井的正前面（南边）。')),
      mi('w1', 1, 0, 'n_window', '窗户还在老地方。'), mi('w2', 5, 0, 'n_window', '厨房的窗户，位置没变。'),
      mi('p1', 0, 1, 'n_pillar', '这根柱子还在原处。'), df('stub', 2, 1, 'n_pillar', { s: { stub: true } }), mi('p3', 4, 1, 'n_pillar', '这根柱子还站着，位置没变。'), mi('p4', 6, 1, 'n_pillar', '这根柱子也还在。'),
      df('ghost', 3, 2, '@n_achunG', { dir: 3 }),
      df('stump', 3, 5, 'n_stump'), df('cap', 6, 5, 'n_capwell'),
      rg('stub', 2, 1), rg('ghost', 3, 2), rg('stump', 3, 5), rg('cap', 6, 5)
    ], wets);
  }
  const PH_SRC = {
    A: [['TTTTTTTT', 'TTTTTTTT', 'FFFFFFFF', 'KKKKKKKK', 'GGGSSGGG', 'GGGSSGGG', 'GGGSSGGG'],
      ['tttttttt', 'tttttttt', 'ffffffff', 'kkkkkkkk', 'rggssggg', 'rrgssggr', 'rggssgrr']],
    B: [['PPPPPPPP', 'MMMMMMMM', 'MMMMMMMM', 'MMMMMMMM', 'MMMMMMMM', 'MMMMMMMM', 'MMMMMMMM'],
      ['pppppppp', 'mmmmmmmr', 'rmmmmmmm', 'mmmmmmmm', 'mmmmmmmm', 'rmmmmmmr', 'rrmmmmrr']],
    C: [['PPPPPPPP', 'KKKKKKKK', 'DDDDDDDD', 'DDDDDDDD', 'GGGGGGGG', 'GGGGGGGG', 'GGGGGGGG'],
      ['pppppppp', 'kkkkkkkk', 'ddrrdddd', 'ddrrdddd', 'ggggggrg', 'ggrggggg', 'gggggggg']]
  };
  function phMap(k, v) {
    return { amb: null, dark: 0, floor: 'desk', legend: PH_LEG, rows: phRows(PH_SRC[k][0], PH_SRC[k][1], v), ents: phEnts(k, v), async enter(S, first) { if (first) await viewIntro(S, k); } };
  }

  /* ---------- 头家娘的巡夜（那一夜的大厅） ---------- */
  let PAT = null, NDIED = 0, VOXT = 4, FTT = 0, HBT = 0;
  const NWP = [[17, 3, 1.8], [15, 6], [12, 9], [8, 8], [6, 5], [2, 4, 1.4], [6, 5], [9, 7], [12, 6], [16, 5]];
  const VOX = ['「镯仔！我的镯仔！」', '「阿春——你给我出来！」', '「今晚没找到，谁都不准睡！」', '「贼仔……我知道你在这里……」'];
  function patReset(S) {
    PAT = { st: 'wait', t: 2.6, wp: 1, lost: 0 };
    S.stop('tai'); S.place('tai', 17, 3, 0); S.ent('tai').alpha = 1;
  }
  function losClear(m, x0, y0, x1, y1) {
    const n = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0));
    for (let i = 1; i < n; i++) { const x = Math.round(x0 + (x1 - x0) * i / n), y = Math.round(y0 + (y1 - y0) * i / n); if (tileSolid(m, x, y)) return false; }
    return true;
  }
  function spotPl(S) {
    PAT.st = 'spot'; PAT.t = .7; const e = S.ent('tai'); e.mv = null;
    S.face('tai', 'pl'); S.bubble('tai', '!', 1000); S.sfx('sting'); S.toast('「谁！」');
    if (S.once('spotTip')) S.toast('被看见了！快走开，绕开她');
  }
  function nightTick(S, dt) {
    if (S.map !== 'night' || !PAT || W.ended || PAT.st === 'done' || PAT.st === 'caught') return;
    const e = S.ent('tai'); if (!e || e.hidden) return;
    const m = W.maps.night, p = S.pl, ex = Math.round(e.px / TS), ey = Math.round(e.py / TS);
    const d = Math.hypot((e.px - p.px) / TS, (e.py - p.py) / TS);
    if (W.busy) return;
    /* 木屐声：越近越响 */
    FTT -= dt; if ((e.mv || PAT.st === 'chase') && FTT <= 0) { FTT = PAT.st === 'chase' ? .26 : .5; clog(S, 0, Math.max(.15, 1 - d / 12)); }
    VOXT -= dt; if (VOXT <= 0) { VOXT = 7 + Math.random() * 5; S.toast(VOX[(S.f._vx = ((S.f._vx ?? -1) + 1)) % VOX.length]); }
    HBT -= dt; if (d < 6 && HBT <= 0) { HBT = .5 + d * .15; S.sfx('heart'); }
    if (PAT.st === 'chase') {
      if (d > 6) PAT.lost += dt; else PAT.lost = 0;
      if (PAT.lost > 1.6) { S.stop('tai'); PAT.st = 'return'; S.bubble('tai', '?', 1200); }
      return;
    }
    if (PAT.st === 'spot') { PAT.t -= dt; if (PAT.t <= 0) { PAT.st = 'chase'; PAT.lost = 0; S.chase('tai', { spd: 3.4, catch: taiCatch }); } return; }
    if (PAT.st === 'wait') { PAT.t -= dt; if (PAT.t > 0) return; PAT.st = 'patrol'; }
    if (d <= 1.1) { PAT.st = 'caught'; e.mv = null; S.run(taiCatch); return; }
    if (d <= 2.6 && losClear(m, ex, ey, p.x, p.y)) return spotPl(S);
    if (S.moving && d <= 4.5 && PAT.st !== 'alert') {
      PAT.st = 'alert'; PAT.ax = p.x; PAT.ay = p.y; S.bubble('tai', '?', 1000);
      if (S.once('hearTip')) S.toast('她听见了，正往你这边走——快绕开她的灯笼！');
    }
    if (e.mv) return;
    if (PAT.st === 'pause' || PAT.st === 'look') { PAT.t -= dt; if (PAT.t <= 0) PAT.st = 'patrol'; return; }
    let tx, ty, spd = 1.7;
    if (PAT.st === 'alert') { tx = PAT.ax; ty = PAT.ay; spd = 2.3; }
    else if (PAT.st === 'return') { let bi = 0, bd = 1e9; NWP.forEach(([x, y], i) => { const dd = Math.abs(x - ex) + Math.abs(y - ey); if (dd < bd) { bd = dd; bi = i; } }); PAT.wp = bi; PAT.st = 'patrol'; [tx, ty] = NWP[bi]; }
    else [tx, ty] = NWP[PAT.wp];
    if (ex === tx && ey === ty) {
      if (PAT.st === 'alert') { PAT.st = 'look'; PAT.t = 1.4; e.dir = [0, 1, 2, 3][(Math.random() * 4) | 0]; return; }
      const w = NWP[PAT.wp]; PAT.wp = (PAT.wp + 1) % NWP.length;
      if (w[2]) { PAT.st = 'pause'; PAT.t = w[2]; }
      return;
    }
    const dir = bfsStep(m, ex, ey, tx, ty, e);
    if (dir < 0) { PAT.st = 'patrol'; PAT.wp = (PAT.wp + 1) % NWP.length; return; }
    startMove(e, dir, spd);
  }
  async function taiCatch(S) {
    S.stop('tai'); if (PAT) PAT.st = 'caught';
    if (!S.f.nWarn) {
      S.f.nWarn = 1; S.fx('red'); S.shake(400, 3); clog(S); clog(S, .12);
      await S.narr('一只冰凉的手攥住了你的手腕。\n「镯仔……交出来……」');
      await S.narr('你拼命一甩——挣开了。\n手腕上留下五道青紫色的指印。');
      const p = S.pl; let bi = 0, bd = -1;
      NWP.forEach(([x, y], i) => { const dd = Math.abs(x - p.x) + Math.abs(y - p.y); if (dd > bd) { bd = dd; bi = i; } });
      S.ent('tai').s.off = true; S.sfx('switch');
      await S.narr('灯笼「噗」地灭了。\n一片漆黑里，木屐声往大厅另一头去了。');
      S.place('tai', NWP[bi][0], NWP[bi][1], 0); S.ent('tai').s.off = false; S.fx('flash');
      PAT = { st: 'pause', t: 2.2, wp: (bi + 1) % NWP.length, lost: 0 };
      S.toast('再被抓到一次，就逃不掉了');
      return;
    }
    NDIED++;
    await S.scare('face', { spr: '@taiG', face: 'taitai', sfx: 'scream' });
    return S.die('灯笼一下子举到你脸前。\n那张敷着白粉的脸，嘴张得好大：「贼仔！」\n\n后来的事，你记不清楚了。\n只记得有人一直打你的手心，一下，一下，问你镯子藏到哪里去了。', '贼仔');
  }

  /* ---------- 跟着走的阿哲（每张图一个） ---------- */
  const AZ = { yard: 'az_y', hall: 'az_h', back: 'az_b' };
  function azHere(S) {
    const id = AZ[S.map]; if (!id || !S.f.az) return;
    const e = S.ent(id); if (e.follow && !e.hidden) return;
    const p = S.pl, m = W.maps[S.map]; let x = p.x - DIRS[p.dir][0], y = p.y - DIRS[p.dir][1];
    if (!passable(m, x, y, e)) { x = p.x; y = p.y; }
    S.place(id, x, y, p.dir); S.follow(id, true);
  }

  /* ---------- 卡关提示：阿哲隔一阵子嘀咕一句 ---------- */
  function phase(S) {
    const f = S.f;
    if (!f.pA) return 'A'; if (!f.pB) return 'B'; if (!f.pried) return S.has('bar') ? 'pry' : 'bar';
    if (!f.backOpen) return 'night'; if (!f.pC) return 'C'; if (!f.wellFound) return 'dig'; return 'end';
  }
  const IDLE_H = {
    A: ['「第一张：铁门进来，第五块石板……铁门那一格不算喔。」', '「从铁门往屋子走，数石板：一、二、三、四、五——站上去，面对房子。」'],
    B: ['「第二张在大厅：神明桌前面退七步。」', '「先站到神明桌正前面那一格，再往后退七步。」'],
    bar: ['「撬那块砖要工具吧……东厢那边好像有电视台丢下的东西。」', '「东厢那个铝箱子，去翻翻看。」'],
    pry: ['「神明桌右边，那块裂开的地砖。」', '「就是她跪着按住的那块。神明桌右边。」'],
    C: ['「第三张：后门往南八步，再往西九步。」', '「从后门口出来那一格开始数：往下八步，往左九步。」'],
    dig: ['「断掉的那根柱子也要算进去喔。」', '「井在原来的第二根、第三根柱子中间，芒果树头的正后面。」']
  };
  let DRT = 2;
  function chTick(S, dt) {
    if (S.map === 'night') return nightTick(S, dt);
    if (S.map === 'back' && S.f.pC && !S.f.wellFound && !W.busy) {
      DRT -= dt;
      if (DRT <= 0) { const d = Math.hypot(S.pl.x - 8, S.pl.y - 4); DRT = 2.2 + d * .12; drip(S, 0, Math.max(.12, 1.1 - d / 9)); if (d < 2.5) drip(S, .35, .6); }
    }
    if (W.busy || !S.f.az || S.map.startsWith('ph')) return;
    const ph = phase(S), H = IDLE_H[ph]; if (!H) return;
    if (S.f._ph !== ph) { S.f._ph = ph; S.f._idle = 0; S.f._il = 0; }
    S.f._idle = (S.f._idle || 0) + dt;
    const lv = S.f._idle > 110 ? 2 : S.f._idle > 50 ? 1 : 0;
    if (lv > (S.f._il || 0)) { S.f._il = lv; S.toast('阿哲：' + H[lv - 1]); const id = AZ[S.map]; if (id) S.bubble(id, '…', 1500); }
  }

  /* ---------- 章节 ---------- */
  defChapter({
    id: 'minxiong', n: 16, title: '民雄鬼屋', sub: '阿嬷留下的老照片，和今晚的拍立得。同一个角度，多出来一个人。', origin: '台湾嘉义民间传说', color: '#4a3020',
    icon: '@achunG', iconX: 22, amb: 'night', floor: 'dirt', wall: 'brick', dark: .78, plr: 3.4,
    tileOpts: { grassC: '#283c24', treeC: '#16301c' },
    people: PEOPLE_M, items: ITEMS_M, notes: NOTES_M, tiles: TILES_M, sprites: SPR_M,
    endings: { home: '第十六夜　完', shutter: '第三下快门', jade: '镯子带走了' },
    legend: '「民雄鬼屋」位于台湾嘉义县民雄乡，本名「刘家古厝」或「刘家洋楼」。一般的说法是：这栋两层红砖洋楼建于 1929 年前后，屋主是当地的刘姓仕绅，红砖、拱窗、山墙，在当时是很气派的房子。后来刘家迁居他处，房子荒废下来，被榕树的气根一层一层包住，渐渐成了台湾最有名的「鬼屋」之一，常被人列进所谓的「台湾几大鬼屋」。\n\n关于它为什么荒废，流传着好几个版本。最常听到的是「丫鬟投井」：刘家有个丫鬟跳进了宅院里的井，原因各说各话——有人说她和主人有私情被发现，有人说她受了委屈，有人说她被冤枉。另一种说法和军队有关：日本时代末期（也有人说是战后）曾有军队驻扎在这里，夜里有士兵看见井边的女人、听见哭声，后来还出了事。也有人说，后来想拆掉这栋房子，怪手一开进来就故障、工人接连生病，只好作罢。这些说法都查不到可靠的记载，多半是口耳相传、越传越凶。\n\n1990 年代以后，电视灵异节目多次到这里出外景，大学生、夜游的年轻人也常来「试胆」，它的名气就更大了。不过房子本身是私人产业，附近的居民有人觉得困扰；也有不少人说，它只是一栋被遗忘的老房子，和全台湾许多荒废的古厝一样，慢慢被树和时间收回去。\n\n（本章的人物——小晴、阿哲、阿婆、阿春、阿娇、头家娘与少爷——以及镯子与借据的冤情、阿嬷的相簿与照片背面的字、电视台的场记单、日本兵的木牌与刻字、「井边快门不可按第三下」的禁忌、旧井的位置，均为游戏虚构。）',
    start: { map: 'yard', x: 11, y: 16, dir: 3 },
    thumb(g, w, h) {   // 一张拍立得：红砖洋楼，二楼窗户里一张白脸
      const R = (x, y, ww, hh, c) => { g.fillStyle = c; g.fillRect(x, y, ww, hh); };
      const x0 = 8, y0 = h - 22 - 66;
      R(x0 + 3, y0 + 4, 50, 62, 'rgba(0,0,0,.45)'); R(x0, y0, 50, 62, '#ece8de'); R(x0 + 4, y0 + 4, 42, 42, '#2a2a28');
      R(x0 + 4, y0 + 4, 42, 10, '#3a4438');
      R(x0 + 7, y0 + 16, 36, 30, '#7a3a2c'); R(x0 + 6, y0 + 14, 38, 3, '#c8bca4'); R(x0 + 18, y0 + 10, 14, 5, '#c8bca4'); R(x0 + 6, y0 + 30, 38, 2, '#c8bca4');
      for (const [x, y] of [[10, 19], [30, 19], [10, 34], [30, 34]]) { R(x0 + x, y0 + y, 6, 9, '#c8bca4'); R(x0 + x + 1, y0 + y + 1, 4, 7, '#0e1216'); }
      R(x0 + 20, y0 + 19, 8, 9, '#c8bca4'); R(x0 + 21, y0 + 20, 6, 7, '#0a0c0e'); R(x0 + 22, y0 + 21, 4, 5, '#e0e4e0'); R(x0 + 22, y0 + 21, 4, 1, '#0a0a0a'); R(x0 + 23, y0 + 23, 1, 1, '#000'); R(x0 + 25, y0 + 23, 1, 1, '#000');
      R(x0 + 21, y0 + 36, 8, 10, '#0a0806');
      for (let i = 0; i < 7; i++) R(x0 + 5 + i * 2, y0 + 8 + (i % 3) * 2, 1, 28 - (i % 3) * 4, '#3a2a1a');
      R(x0 + 4, y0 + 4, 16, 6, '#1e3220');
      R(x0 + 30, y0 + 52, 14, 1, '#a8a49c'); R(x0 + 34, y0 + 55, 10, 1, '#a8a49c');
    },
    faces: {
      /* 阿春：湿头发中分垂下，盖住大半张脸，只露出一只睁得很大的眼睛 */
      achun(R, a, t) {
        const H = '#06080b', H2 = '#121820', SK = '#c6ced2', SK2 = '#98a4ac', BL = '#7a9ab8';
        R(0, 0, 32, 32, '#000');
        R(7, 0, 18, 6, H); R(4, 4, 24, 6, H); R(2, 8, 7, 24, H); R(23, 8, 7, 24, H);
        R(9, 8, 14, 20, SK); R(10, 27, 12, 3, SK2); R(9, 22, 2, 5, SK2);
        R(16, 6, 9, 26, H); R(14, 8, 3, 21, H2); R(12, 6, 2, 9, H); R(9, 6, 3, 5, H); R(15, 19, 2, 13, H);
        R(9, 12, 6, 5, SK2); R(10, 13, 5, 3, '#eef0ee'); R(12, 13, 2, 3, '#0a0606'); R(12, 14, 1, 1, '#4a0a0a'); R(10, 16, 5, 1, '#8a5a6a'); R(10, 12, 5, 1, '#5a6068');
        if (Math.sin(t * 5) > .92) R(10, 13, 5, 3, SK2);
        const m = 1 + Math.round(a * 3); R(10, 22, 5, m, '#3a2a3a'); R(10, 22, 5, 1, '#6a5a6a');
        for (let i = 0; i < 6; i++) { const y = ((t * 16 + i * 7) % 36) | 0; R([3, 6, 24, 27, 11, 20][i], y, 1, 2, BL); }
        R(5, 29, 22, 3, '#3a465a'); R(13, 29, 6, 2, '#2a3446');
      },
      /* 头家娘：敷白粉的脸、细眉、瞪大的眼，灯笼的光从下巴往上照 */
      taitai(R, a, t) {
        const SK = '#f0ece2', SK2 = '#cfc8ba', H = '#120c0c', G = '#d8b040';
        R(0, 0, 32, 32, '#000'); R(0, 22, 32, 10, '#2a1404'); R(4, 25, 24, 7, '#4a2408');
        R(9, 0, 14, 5, H); R(7, 3, 18, 6, H); R(22, 1, 7, 2, G); R(27, 0, 2, 4, G); R(6, 7, 4, 12, H); R(22, 7, 4, 12, H);
        R(9, 7, 14, 18, SK); R(10, 25, 12, 3, SK2); R(9, 20, 2, 5, SK2); R(21, 20, 2, 5, SK2);
        R(10, 10, 5, 1, '#3a2a2a'); R(17, 10, 5, 1, '#3a2a2a');
        R(10, 12, 5, 3, '#fff'); R(17, 12, 5, 3, '#fff'); R(12, 13, 1, 1, '#000'); R(19, 13, 1, 1, '#000');
        R(10, 16, 2, 2, '#e09a9a'); R(20, 16, 2, 2, '#e09a9a');
        const hh = 2 + Math.round(a * 5); R(13, 19, 6, hh, '#3a0608'); R(14, 19, 4, 1, '#c8b8a8');
        R(9, 22, 14, 3, 'rgba(255,150,60,.35)'); R(8, 17, 1, 3, G); R(23, 17, 1, 3, G);
        R(5, 29, 22, 3, '#4a1838'); R(13, 29, 6, 3, G);
      }
    },
    async intro(S) {
      NDIED = 0; PAT = null;
      await S.card('第十六夜　民雄鬼屋', '2004年8月　嘉义县民雄乡', '阿嬷的告别式过后，\n我在她衣柜的最底下，找到一本黑色硬皮相簿。\n\n前三页，是同一栋红砖洋楼。\n最后一页，是阿嬷用铅笔写的字：\n「阿春姊仔没有偷。照片里有。」');
    },
    resume: {
      night: async S => {
        S.norun(true); S.hidePlayer(false); patReset(S); VOXT = 4;
        if (NDIED) await S.think('灯笼照得到的地方，她看得见；离她四五步以内走动，她听得见。\n等她走远了，再走。');
      }
    },
    tick: chTick,
    maps: {
      /* ---------------- 古厝前院 ---------------- */
      yard: {
        amb: 'night', dark: .74, plr: 3.6, wall: 'brick',
        legend: { S: 'slab', I: 'ironf' },
        rows: [
          'TTTT##############TTTT',
          'TTTT##############TTTT',
          'TTT"##############"TTT',
          'TT""##############""TT',
          'T"""kkkkkkkkkkkkkk"""T',
          'TB""kkkkkkkkkkkkkk"""T',
          'T""""""""""S"""""""BBT',
          'T""""""""""S"""""""""T',
          'T""""""""""S"""""""""T',
          'T"B""""""""S"""""""""T',
          'T""""""""""S"""""""""T',
          'TT"""""""""S""""""""TT',
          'TT"""""""""S""""""""TT',
          'T""""""""""S"""""""""T',
          'IIIIIIIIIIIdIIIIIIIIII',
          'dddddddddddddddddddddd',
          '::::::::::::::::::::::',
          '::::::::::::::::::::::'],
        ents: [
          { id: 'facade', x: 4, y: 3, w: 14, spr: 'facade', decal: true, solid: false },
          { id: 'door', x: 10, y: 3, w: 2, spr: 'mdoor', on: S => enterHall(S) },
          { x: 5, y: 3, spr: 'invisible', solid: true, on: S => S.narr('一楼的拱窗。玻璃早就没了，窗框里塞满了榕树的气根，像一把握紧的手指。') },
          { x: 7, y: 3, spr: 'invisible', solid: true, on: S => S.narr('窗台上有人用喷漆写了「到此一游」，旁边画了一个鬼脸。\n喷漆也褪色了。') },
          { x: 14, y: 3, spr: 'invisible', solid: true, on: S => S.narr('红砖墙上一道一道黑色的水痕，从二楼一直流到地面，像是哭过。') },
          { x: 16, y: 3, spr: 'invisible', solid: true, on: S => S.narr('右边的窗户。手电筒照进去，里面一片漆黑，只看得到地上厚厚的落叶。') },
          { id: 'bany1', x: 1, y: 7, w: 2, spr: 'banyan', on: S => S.narr('一棵老榕树，树干要三个人才抱得住。\n气根从树枝上垂下来，一根一根扎进土里，又长成了新的树干。') },
          { id: 'bany2', x: 18, y: 9, w: 2, spr: 'banyan', on: S => S.narr('榕树底下摆着一尊小小的石头土地公，前面插着几支烧完的香。\n有人在这里拜过。') },
          { id: 'apo', x: 16, y: 15, spr: '@apo', dir: 3, on: S => apoOn(S) },
          { id: 'jinlu', x: 18, y: 15, spr: 'jinlu', light: { r: 2.2, col: 'rgba(255,140,60,.2)', flick: true }, on: S => S.narr('小小的金炉里，纸钱烧得「哔哔剥剥」的。\n灰烬飘起来，越过铁栏杆，往洋楼那边飘过去。') },
          { id: 'sign', x: 13, y: 15, spr: 'sign2', on: S => S.narr('「私人土地　请勿擅入」\n底下有人用奇异笔补了一行：「里面的也是。」') },
          { id: 'scooter', x: 7, y: 16, spr: 'scooter', on: S => S.narr('阿哲的机车。坐垫被晒得裂了一道缝，用胶带贴着。\n等一下，老照片和拍立得就摊在这个坐垫上对照。') },
          { id: 'lamp', x: 4, y: 15, spr: 'streetlamp', flicker: true, light: { r: 3.6, col: 'rgba(255,230,170,.16)' }, on: S => S.narr('路灯一闪一闪的，灯罩里积了一层死掉的飞蛾。') },
          { x: 12, y: 14, spr: 'invisible', solid: true, on: S => S.narr('铁门的锁早就被人剪断了，链子挂在门柱上，风一吹就「锵、锵」地响。') },
          { id: 'az_y', x: 12, y: 16, spr: '@azhe', dir: 3 }
        ],
        async enter(S, first) { azHere(S); if (first) await opening(S); },
        step(S, x, y) { return spotStep(S, 'A', x, y, [[11, 9]]); }
      },
      /* ---------------- 古厝一楼 ---------------- */
      hall: {
        amb: 'room', dark: .84, plr: 3.2, wall: 'plain', wallC: { face: '#6e6452', trim: '#443a2e', top: '#14110e' }, floor: 'terr',
        legend: { Y: 'roots' },
        rows: [
          '####################',
          '####################',
          '#Y...#........#....#',
          '#Y...#........#....#',
          '#....#........#....#',
          '#.............#....#',
          '#....#.............#',
          '#....#........#...Y#',
          '######........######',
          '######........######',
          '######........######',
          '######Y......Y######',
          '######Y......Y######',
          '#########..#########',
          '####################'],
        ents: [
          { x: 9, y: 13, spr: 'invisible', touch: S => leaveHall(S) },
          { x: 10, y: 13, spr: 'invisible', touch: S => leaveHall(S) },
          { id: 'altar', x: 8, y: 2, w: 3, spr: 'shenming', s: { k: 'ruin' }, on: S => S.narr('神明桌塌了一角。桌上的神像早就没了，只剩一块被香熏黑的印子。\n香炉里插着几支新的香脚——有人来拜过。') },
          { id: 'crack', x: 11, y: 2, spr: 'crack', decal: true, solid: false, on: S => crackOn(S) },
          { id: 'fam', x: 9, y: 1, spr: 'famframe', s: { brk: true }, on: S => S.narr(S.f.pB ? '你凑近看——\n玻璃碎了，相片泡过水，可是看得出来：头家娘的那张脸，真的被刮掉了。一圈一圈，刮得好深。' : '墙上挂着一个相框，玻璃碎了，相片泡过水，黄黄的，看不清楚。') },
          { x: 7, y: 1, spr: 'portrait', on: S => S.narr('一张祖先的画像，发了霉，脸的地方长出一块一块的白斑。') },
          { x: 12, y: 1, spr: 'portrait', on: S => S.narr('另一张画像。画框歪了，你没有去扶正它。') },
          { id: 'bricked', x: 6, y: 1, spr: 'bricked', on: S => S.narr(S.f.pB ? '被红砖封死的侧门。老照片里，阿嬷就是从这里探出头来的。\n砖缝里的灰浆比墙新——是后来住进来的人封的。' : '墙上一个拱形的门洞，被红砖封死了。新砖的颜色比旁边的墙红。') },
          { x: 13, y: 1, spr: 'window', light: { r: 2.4, col: 'rgba(140,170,220,.12)', dy: 18 }, on: S => S.narr('窗户外面就是那棵大榕树。一根气根从窗框伸进来，垂到你肩膀那么高。') },
          { id: 'table', x: 9, y: 4, spr: 'tea', s: { k: 'ruin' }, on: S => S.narr('一张烂掉的八仙桌，桌面拱起来，裂成好几块。桌脚下踩着几个空酒瓶。') },
          { x: 10, y: 4, spr: 'armchair', col: '#4a3a2a', on: S => S.narr('一张藤椅，只剩下骨架。坐垫的地方，长了一丛小小的蕨。') },
          /* 西厢：日本兵住过的房间 */
          { x: 1, y: 1, spr: 'window', light: { r: 2.2, col: 'rgba(140,170,220,.12)', dy: 18 }, on: S => S.narr('西厢的窗户被树根撑破了，月光从缝里漏进来，照在地上，一条一条的。') },
          { id: 'carve', x: 2, y: 1, spr: 'carve', on: S => heitaiOn(S) },
          { id: 'kisatsu', x: 3, y: 1, spr: 'kisatsu', on: S => heitaiOn(S) },
          { id: 'suitou', x: 3, y: 6, spr: 'suitou', solid: false, on: S => S.narr('一个生锈的军用水壶，壶身上印着一颗星。\n摇一摇——里面还有水的声音。你没有打开。') },
          { x: 4, y: 7, spr: 'crate', on: S => S.narr('木箱上用模板印着「陸軍」两个字，箱子里只剩一窝老鼠屎。') },
          /* 东厢：电视台丢下的器材 */
          { id: 'bdoor', x: 17, y: 1, spr: 'bdoor', s: { roots: true }, on: S => bdoorOn(S) },
          { id: 'case', x: 18, y: 5, spr: 'case', on: S => caseOn(S) },
          { x: 16, y: 7, spr: 'tripod', on: S => S.narr('一支断了脚的三脚架，倒在墙角。上面贴着一张胶带，写着「B 机」。') },
          { x: 15, y: 2, spr: 'stairsup', solid: true, on: S => S.narr('通往二楼的楼梯，断在半空中。上面黑漆漆的。\n……二楼正中间那扇窗户，就在这上面。\n你听见楼上的木板，「嘎」地响了一声。') },
          { id: 'az_h', x: 10, y: 12, spr: '@azhe', dir: 3, hidden: true }
        ],
        async enter(S, first) {
          azHere(S);
          if (S.f.backOpen) { S.ent('bdoor').s.roots = false; }
          if (first) await hallFirst(S);
        },
        step(S, x, y) { return spotStep(S, 'B', x, y, [[9, 10], [9, 9]]); }
      },
      /* ---------------- 那一夜（昭和十年十月十日） ---------------- */
      night: {
        amb: 'drone', dark: .9, plr: 2.6, wall: 'plain', wallC: { face: '#b4a68a', trim: '#6a5a44', top: '#16120e' }, floor: 'terrN', darkC: '#0a0604',
        rows: [
          '####################',
          '####################',
          '#....#........#....#',
          '#....#........#....#',
          '#....#........#....#',
          '#.............#....#',
          '#....#.............#',
          '#....#........#....#',
          '######........######',
          '######........######',
          '######........######',
          '######........######',
          '######........######',
          '#########..#########',
          '####################'],
        ents: [
          { x: 9, y: 13, spr: 'invisible', touch: S => frontLocked(S) },
          { x: 10, y: 13, spr: 'invisible', touch: S => frontLocked(S) },
          { x: 8, y: 2, w: 3, spr: 'shenming', s: { k: 'new' }, on: S => S.narr('神明桌上的观音低着眼睛。两盏油灯的火苗，一动也不动。') },
          { x: 11, y: 2, spr: 'vase', on: S => S.narr('青花大花瓶。木架子底下那块地砖，边缝里的灰是新的。') },
          { x: 9, y: 1, spr: 'famframe', on: S => S.narr('全家福里的头家娘，正端端正正地看着你。') },
          { x: 7, y: 1, spr: 'portrait', on: S => S.narr('祖先的画像。画框上的金漆亮得刺眼。') },
          { x: 12, y: 1, spr: 'portrait', on: S => S.narr('另一张祖先画像。') },
          { x: 6, y: 1, spr: 'bricked', open: true, on: S => S.narr('侧门开着，门后面是黑漆漆的厨房。\n门框底下，有一双小小的赤脚印。') },
          { x: 9, y: 4, spr: 'tea', s: { k: 'new', empty: true }, on: S => S.narr('八仙桌上的漆盒开着，里面是空的。\n茶已经凉了。') },
          { x: 10, y: 4, spr: 'armchair', col: '#6a4a2a', on: S => S.narr('头家娘的藤椅。椅背上搭着一条绣花手帕。') },
          { id: 'ol1', x: 13, y: 1, spr: 'olamp', light: { r: 2.2, col: 'rgba(255,190,90,.16)', flick: true } },
          { id: 'ol2', x: 3, y: 1, spr: 'olamp', light: { r: 2, col: 'rgba(255,190,90,.14)', flick: true } },
          { id: 'ol3', x: 16, y: 1, spr: 'olamp', light: { r: 2, col: 'rgba(255,190,90,.14)', flick: true } },
          { x: 2, y: 6, spr: 'futon', col: '#8a7a5a', solid: false, on: S => S.narr('丫鬟房的草席上，叠着一件粗布衫，叠得方方正正。') },
          { x: 18, y: 6, spr: 'sack', on: S => S.narr('一袋一袋的米，堆在墙角。') },
          { x: 18, y: 7, spr: 'sack', on: S => S.narr('米袋上印着「蓬莱米」。') },
          { id: 'gN', x: 12, y: 9, spr: 'geta', solid: false, on: S => S.narr('一只木屐，绳子断了。\n……阿春刚才跑过去的时候掉的。') },
          { id: 'bdoorN', x: 17, y: 1, spr: 'bdoor', on: S => escapeNight(S) },
          { id: 'chunN', x: 12, y: 8, spr: '@achun', hidden: true, solid: false },
          { id: 'tai', x: 17, y: 3, spr: '@taiG', solid: false, hidden: true, light: { r: 3, col: 'rgba(255,150,60,.22)', flick: true } }
        ],
        async enter(S, first) { if (first) await nightEnter(S); }
      },
      /* ---------------- 后院 ---------------- */
      back: {
        amb: 'night', dark: .8, plr: 3.4, wall: 'brick',
        legend: { J: 'bamboo', Y: 'roots' },
        rows: [
          '#####################',
          '#####################',
          '#kkkkkkkkkkkkkkkkkkk#',
          '#kkkkkkkkkkkkkkkkkkk#',
          'TddddddddddddddddddYT',
          'Tdddddddddddddddddd"T',
          'T"""""""""""""""""""T',
          'T"""""""""""""""""""T',
          'T"""""""""""""""""""T',
          'T"""""""""""""""""""T',
          'T"""""""""""""""""""T',
          'JJJJJJJJJJJJJJJJJJJJJ',
          'JJJJJJJJJJJJJJJJJJJJJ'],
        ents: [
          { id: 'bdoorB', x: 17, y: 1, spr: 'bdoor', on: S => backToHall(S) },
          { x: 4, y: 1, spr: 'window', on: S => S.narr('后墙的窗户，黑洞洞的。') },
          { x: 8, y: 1, spr: 'window', on: S => S.narr('窗户里面就是大厅。你好像看见神明桌那边，有一点点黄色的光。\n再看，又没有了。') },
          { x: 12, y: 1, spr: 'window', on: S => S.narr('窗台上长了一排小小的蕈，白白的。') },
          { id: 'pl1', x: 2, y: 3, spr: 'pillar', on: S => S.narr('廊下的柱子，从左边数第一根。') },
          { id: 'pl2', x: 6, y: 3, spr: 'pillar', s: { stub: true }, on: S => S.narr(S.f.pC ? '断掉的柱子，只剩半截。原来的「左数第二根」。' : '一团树根底下，好像包着半截水泥柱子。') },
          { id: 'pl3', x: 10, y: 3, spr: 'pillar', on: S => S.narr('一根柱子。上面有人用小刀刻了「2001.7.14」。') },
          { id: 'pl4', x: 14, y: 3, spr: 'pillar', on: S => S.narr('一根柱子，漆掉得一块一块的。') },
          { id: 'pl5', x: 18, y: 3, spr: 'pillar', on: S => S.narr('最右边的柱子，被榕树根缠住了一半。') },
          { id: 'c1', x: 4, y: 4, spr: 'clump', on: S => digOn(S, 'c1') },
          { id: 'c2', x: 8, y: 4, spr: 'clump', on: S => digOn(S, 'c2') },
          { id: 'c3', x: 12, y: 4, spr: 'clump', on: S => digOn(S, 'c3') },
          { id: 'c4', x: 16, y: 4, spr: 'clump', on: S => digOn(S, 'c4') },
          { id: 'well', x: 8, y: 4, spr: 'oldwell', hidden: true, on: S => wellOn(S) },
          { id: 'stump', x: 8, y: 7, spr: 'stump', on: S => S.narr(S.f.pC ? '芒果树的树头。老照片里，井就在它的正后面（北边）。' : '一个被锯得平平的树头，年轮一圈一圈的，数不清有几圈。') },
          { id: 'cap', x: 15, y: 7, spr: 'capwell', on: S => capOn(S) },
          { id: 'bany3', x: 2, y: 8, w: 2, spr: 'banyan', on: S => S.narr('后院的榕树比前面那棵还大，树根像蛇一样爬满了半个院子。') },
          { id: 'chunB', x: 8, y: 3, spr: '@achunG', hidden: true, solid: false, dir: 0 },
          { id: 'az_b', x: 17, y: 3, spr: '@azhe', dir: 0, hidden: true }
        ],
        async enter(S, first) { azHere(S); if (first) await backFirst(S); },
        step(S, x, y) { return spotStep(S, 'C', x, y, [[8, 10], [8, 9]]); }
      },
      phA: phMap('A'), phB: phMap('B'), phC: phMap('C'),
      phAv: phMap('A', true), phBv: phMap('B', true), phCv: phMap('C', true)
    }
  });

  /* ================= 前院 ================= */
  async function opening(S) {
    await S.narr('晚上十点四十分。省道旁边的小路，路灯坏了一半。\n铁栏杆后面，那栋红砖洋楼被两棵大榕树抱在怀里，像一只慢慢合起来的手。');
    S.face('az_y', 'pl');
    await S.say('阿哲', ['……就是这间？民雄鬼屋？', '我高中的时候来夜游过一次，走到门口就跑了。', '你说要来拍「今昔对照」，我还以为你是要交社团作业。']);
    const r = await S.ask('阿哲看着你。', ['是阿嬷的事。', '也算是作业啦。']);
    if (r === 0) await S.say('阿哲', '……好。那就好好拍。');
    else await S.say('阿哲', '最好是啦。你从下车到现在，一直抓着那本相簿。');
    S.give('cam'); S.give('album', true);
    await S.say('阿哲', ['拍立得我带了，一盒十张。', '拍出来的相纸要等一下才会显影，不要甩它。']);
    await S.narr('你翻开相簿。第一页的照片背面，有一行钢笔字。');
    await S.note('album'); S.f.album = true; S.f.film = 10; S.f.aj = 0;
    await S.think('第一张：「自铁门入，第五块石板上，面北。」\n站到老照片拍的那个位置，再拍一张一样的。');
    S.f.az = true; S.follow('az_y', true);
    S.goal('照相簿第一页：从铁门进来，站到第五块石板上');
    S.toast('相簿背面的字，按 J 随时可以重看');
    if (S.coop) S.toast('联机：一个人翻相簿念背面的字，一个人照着走');
  }
  async function apoOn(S) {
    S.face('apo', 'pl');
    if (S.once('apo')) {
      await S.say('阿婆', '少年仔，这么晚了还来？……又是来拍鬼的喔？\n前几年电视台的人也来，扛着大台的机器，最后东西丢着就跑了。');
      const r = await S.ask('阿婆眯着眼睛看你。', ['我阿嬷以前在这里做过事。', '只是来拍照的。']);
      if (r === 0) await S.say('阿婆', '……恁阿嬷？那是日本时代的事了喔。\n我阿母讲，那时候刘家很好额，这间厝是昭和初年起的。');
      else await S.say('阿婆', '拍照喔……拍照好啦，不要乱摸就好。');
      await S.say('阿婆', ['有人讲，刘家有一个查某囝仔（丫鬟），后来跳落后壁那口井。\n有人讲是给头家娘冤枉，有人讲是跟少爷有私情——讲的人多，讲法就多。', '后来日本兵来住过，又有人讲，夜里兵仔听到井边有人在哭。\n光复以后有人要拆，怪手开进来就熄火。……这款事，我也是听人讲的。']);
      await S.say('阿婆', ['我只给你讲一项，你要记牢：\n井边，相机按两下就好。毋通按第三下。', '头一下拍的是人，第二下拍的是伊。\n第三下……就换伊拍你了。']);
      S.f.rule = true;
      return;
    }
    const ph = phase(S);
    const T = {
      A: '照相喔？那个铁门进来，一块一块石板，以前是刘家的人走的。',
      B: '厝内底暗，你脚步放轻。神明桌那边，有人还会去拜。',
      bar: '电视台的人丢一箱东西在东厢，没人敢去拿。',
      pry: '电视台的人丢一箱东西在东厢，没人敢去拿。',
      C: '后壁那口水泥封起来的井，大家都在那边烧金纸。……我阿母讲，那口不是。',
      dig: '我阿母讲，旧的那口井，早就给人填平了。种芒果的那边。',
      end: '……恁去吧。记牢，第三下毋通按。'
    };
    const L = [T[ph] || T.end]; if (S.f.rule && ph === 'dig') L.push('记牢：井边，相机按两下就好。');
    await S.say('阿婆', L);
  }

  /* ================= 拍照与对照 ================= */
  function spotStep(S, k, x, y, ok) {
    const need = k === 'A' ? S.f.album && !S.f.pA : k === 'B' ? S.f.pA && !S.f.pB : S.f.backOpen && !S.f.pC;
    if (!need) return;
    if (ok.some(([a, b]) => a === x && b === y)) { S.f.ret = [S.map, x, y]; return takeShot(S, k); }
    if (ok.some(([a, b]) => Math.abs(x - a) + Math.abs(y - b) === 1) && S.once('near' + k + x + ',' + y)) S.toast('取景框里的角度，跟老照片差一点点……');
  }
  const FRAME_TXT = { A: '红砖洋楼整个装进了框里，左边是那棵大榕树。', B: '神明桌在正中间，两边是墙上的画像。', C: '廊下的柱子排成一排，后墙的窗户黑洞洞的。' };
  async function takeShot(S, k) {
    S.turn(3);
    const r = await S.ask('取景框里，' + FRAME_TXT[k] + '\n和老照片的角度，对上了。', ['按下快门', '再等等']);
    if (r) return;
    shutter(S); S.fx('flash'); S.f.film = (S.f.film ?? 10) - 1;
    await S.wait(700);
    await S.narr('「嘰——」相纸从拍立得前面慢慢吐出来。\n一片灰白。你把它夹在指尖，等它显影。');
    S.toast('相纸还剩 ' + S.f.film + ' 张');
    await S.wait(400);
    S.f.view = k; S.wear('loupe');
    const v = VH > VW && VW < 300;   // 竖屏：上下摆
    await S.go('ph' + k + (v ? 'v' : ''), v ? 5 : 10, v ? 9 : 8, 3);
  }
  async function viewIntro(S, k) {
    if (k === 'A') await S.narr('你把老照片和刚显影的拍立得并排摊在机车坐垫上，阿哲用手电筒照着。\n左边，是七十年前。右边，是今晚。');
    else if (k === 'B') await S.narr('你蹲下来，把第二张老照片和拍立得并排放在地上。手电筒的光在相纸上抖。');
    else await S.narr('第三张。你的手指有点冰。');
    const n = SCN[k].need.length;
    S.goal('对照片：拍立得里多出来、变了位置的东西（' + n + ' 处）');
    S.toast('「多出来的」和「位置变了的」才算；没变的不算');
    if (k === 'A') S.toast('用放大镜移到可疑的地方，按调查键。左边老照片上的人和东西也能看');
    if (k === 'A' && S.coop) S.toast('联机：一个人盯着左边的老照片念，一个人在右边找');
  }
  async function found(S, k, id) {
    const key = 'd_' + k + '_' + id;
    if (S.f[key]) return S.narr('这里已经用红笔圈起来了。');
    S.f[key] = true; S.show('rg_' + k + '_' + id); S.ent('rg_' + k + '_' + id).s.h2 = false;
    S.sfx('ding');
    await DIFF_TXT[k + '_' + id](S);
    const sc = SCN[k], got = sc.need.filter(n => S.f['d_' + k + '_' + n]).length;
    if (got < sc.need.length) { S.toast('找到 ' + got + ' / ' + sc.need.length); return; }
    return viewDone(S, k);
  }
  async function miss(S, k, t, id) {
    await S.narr(t);
    S.show('wt_' + k + '_' + id);
    const m = S.f['miss' + k] = (S.f['miss' + k] || 0) + 1;
    const sc = SCN[k], i = sc.need.findIndex(n => !S.f['d_' + k + '_' + n]);
    if (i < 0) return;
    drip(S, 0, .6);
    if (m === 3) { S.fx('static'); S.sfx('whisper'); await S.narr('相纸上，有一滴水慢慢晕开。\n……你没有碰到它。'); }
    if (m === 2) await S.think('「没变的」不算。找老照片里没有、或者换了位置的。\n' + sc.dirHint[i]);
    else if (m === 3) await S.think(sc.posHint[i]);
    else if (m >= 4) { const r = S.ent('rg_' + k + '_' + sc.need[i]); r.hidden = false; r.s.h2 = true; await S.say('阿哲', '……这里。你看这里，跟老照片不一样。'); }
  }
  async function viewDone(S, k) {
    await S.wait(300);
    if (k === 'A') {
      await S.think('多出来的那个人，站在二楼的窗户后面。\n她站的地方，老照片里是阿春；她穿的木屐，摆在阿春站过的位置。');
      await S.say('阿哲', ['……「照片里有」。你阿嬷说的，就是这个吗？', '我们……真的要进去喔？']);
      await S.say('小晴', '嗯。第二张，在大厅。');
      S.f.pA = true; await closeView(S);
      S.goal('进屋：找到相簿第二页的大厅（神明桌前退七步）');
    } else if (k === 'B') {
      await S.think('花瓶的位置——神明桌右边。\n她跪在那里，按着一块地砖。');
      S.f.pB = true; S.ent('fam').s.scr = true; await closeView(S);
      S.goal(S.has('bar') ? '撬开神明桌右边那块裂开的地砖' : '撬开神明桌右边那块裂开的地砖（先找件工具）');
    } else {
      await S.think('旧井在原来的第二根、第三根柱子正中间，廊下前面一步——\n也就是芒果树头的正后面。\n断掉的那根柱子，要算进去。');
      await S.narr('……仔细听。后院里，有很轻的滴水声。');
      S.f.pC = true; await closeView(S);
      S.goal('在后院找到旧井的位置，用铁撬把树根和土撬开');
    }
  }
  async function closeView(S) {
    const [m, x, y] = S.f.ret || SCN[S.f.view].ret; S.f.view = null;
    S.wear('@me'); await S.go(m, x, y, 3);
  }

  /* ================= 屋里 ================= */
  async function enterHall(S) {
    if (!S.f.pA) { S.face('az_y', 'pl'); return S.say('阿哲', '欸，第一张都还没拍耶。先照你阿嬷的相簿来啦。'); }
    S.sfx('open'); await S.go('hall', 9, 12, 3);
  }
  async function leaveHall(S) {
    await S.go('yard', 10, 4, 0);
  }
  async function hallFirst(S) {
    await S.narr('一股霉味和土味扑过来。\n手电筒照过去，地上是碎掉的磨石子，墙上是一块一块剥落的灰泥。\n天花板破了一个大洞，榕树的根从洞里垂下来，像一道帘子。');
    await S.say('阿哲', ['……好冷。外面三十度耶。', '神明桌在那边。'], { style: 'whisper' });
    S.cp('hall');
  }
  async function heitaiOn(S) {
    if (S.once('heitai')) await S.narr('西厢的墙上钉着一块木牌，墨字已经发黑。\n旁边的灰泥上，有人用刀尖刻了好几行字。');
    await S.note('heitai'); S.f.heitai = true;
  }
  async function caseOn(S) {
    const e = S.ent('case');
    if (!e.s.open) {
      e.s.open = true; S.sfx('open');
      await S.narr('一个铝合金的器材箱，箱子上贴着电视台的贴纸。锁扣没扣。\n你掀开盖子——一卷电线、两颗没电的电池、一支铁撬。\n箱子底下压着一张纸。');
      S.give('bar'); e.s.took = true;
      await S.note('tvcrew'); S.f.crew = true;
      await S.say('阿哲', ['「器材箱明天再回来拿」……', '三年了耶。'], { style: 'whisper' });
      if (S.f.pB && !S.f.pried) S.goal('撬开神明桌右边那块裂开的地砖');
      return;
    }
    await S.narr('器材箱空了。');
    await S.note('tvcrew');
  }
  async function bdoorOn(S) {
    if (S.f.backOpen) return backDoorGo(S);
    await S.narr('东厢的后门。门板被榕树的根缠得死死的，一根一根比手腕还粗。\n门缝里吹进来一阵风，冷得像井水。');
    if (S.has('bar')) await S.think('铁撬撬不动这么粗的根……\n后院，得找别的路。');
  }
  async function backDoorGo(S) { S.sfx('open'); await S.go('back', 17, 2, 0); }
  async function backToHall(S) { S.sfx('open'); await S.go('hall', 17, 2, 0); }
  async function crackOn(S) {
    const e = S.ent('crack');
    if (S.f.pried) return S.narr('撬开的地砖底下，只剩一个方方的洞。');
    if (!S.f.pB) return S.narr('神明桌右边，一块裂开的地砖。裂缝像一张小小的蜘蛛网。\n踩上去，有一点空空的声音。');
    if (!S.has('bar')) { await S.narr('她按着的，就是这块砖。\n你用指甲抠了抠砖缝——抠不起来。'); return S.think('要工具……东厢那边，好像有电视台丢下的东西。'); }
    S.f.pried = true;
    S.sfx('thud'); S.shake(250, 1);
    await S.narr('你把铁撬的扁头插进砖缝，用力一压。\n「喀」——地砖翘了起来。');
    e.s.open = true;
    await S.narr('砖底下是一个小小的铁盒，锈成了红褐色。\n盒盖一掀就掉了。里面包着一块油纸——');
    S.give('jade'); e.s.took = true;
    await S.narr('油纸里，是一只翠绿的玉镯。\n还有一张对折的纸。');
    await S.note('iou');
    await S.say('阿哲', ['……「镯仔暂放花瓶脚下」。', '是少爷。镯子是少爷拿的。'], { style: 'whisper' });
    await S.narr('你把镯子拿起来的那一刻——\n镯子冰得像刚从井里捞上来。');
    S.fx('static'); S.sfx('tv'); S.shake(600, 2);
    await S.wait(500);
    await S.go('night', 11, 3, 3, { ms: 900 });
  }

  /* ================= 那一夜 ================= */
  async function nightEnter(S) {
    S.norun(true);
    await S.narr('……灯亮着。\n油灯的光，黄黄的，照在擦得发亮的磨石子地上。\n神明桌上的观音、青花大花瓶、墙上的全家福——全都是新的。');
    await S.narr('阿哲不见了。\n你手上还握着那只镯子。');
    S.show('chunN'); S.place('chunN', 12, 8, 3);
    clog(S); clog(S, .2); clog(S, .4);
    await S.narr('一个穿粗布衫的女孩，从你面前跑过去。\n她跑得很急，木屐掉了一只，也没有回头捡。');
    await S.walk('chunN', [[13, 6], [16, 5], [17, 2]], 5);
    S.hide('chunN');
    S.sfx('close');
    await S.narr('她穿过东厢，推开后门，跑进了后院。\n——往井的方向。');
    await S.say('？？？', '镯仔！是谁偷了我的镯仔！', { style: 'big' });
    clog(S); clog(S, .5); clog(S, 1);
    S.place('tai', 17, 3, 0); S.ent('tai').alpha = 0; S.sfx('open');
    await S.alpha('tai', 1, 700);
    await S.narr('后门又被推开了。一盏灯笼走进来，停在东厢的后门口。\n灯笼后面，是一张敷着白粉的脸。');
    S.goal('跟着阿春跑过的路，从东厢的后门出去（灯笼近了就别动）');
    S.toast('灯笼照得到的地方她看得见；离她四五步以内走动，她听得见');
    S.toast('木头地板，一跑就响（这里不能奔跑）');
    if (S.coop) S.toast('联机：一个人盯着灯笼喊「停」，一个人走');
    S.cp('night');
    patReset(S); VOXT = 4;
  }
  async function frontLocked(S) {
    await S.narr('大门从外面闩上了。推不开。');
    S.pos(S.pl.x, 12, 3);
  }
  async function escapeNight(S) {
    if (PAT) PAT.st = 'done'; S.stop('tai');
    S.sfx('open');
    await S.narr('你拉开门闩，冲了出去——');
    S.fx('flash'); S.norun(false);
    S.f.backOpen = true;
    await S.go('back', 17, 2, 0, { ms: 700 });
  }

  /* ================= 后院 ================= */
  async function backFirst(S) {
    S.amb('night');
    await S.narr('冷风。蝉叫。手电筒的光。');
    S.face('az_b', 'pl');
    await S.say('阿哲', ['小晴！小晴！', '你刚刚站在神明桌旁边，一动也不动，叫你都没反应——', '然后你就自己走到东厢，把后门……那些树根，是你扯断的吗？']);
    await S.narr('你低头看。手腕上，五道青紫色的指印——' + (S.f.nWarn ? '还在。' : '……没有。只有掌心里那只镯子，冰得发痛。'));
    await S.think('阿春那天晚上，就是这样跑出来的。\n第三张照片：后院，井边。');
    S.goal('照相簿第三页：从后门往南八步，再往西九步');
    S.cp('back');
  }
  async function capOn(S) {
    await S.narr('一口用水泥封死的井。井口的水泥盖上堆着烧过的金纸灰，插着几根红蜡烛头。\n盖子边上刻着几个字：「昭和十九年」。');
    if (S.f.heitai) await S.think('昭和十九年……日本兵挖的「新井」。\n不是这口。');
    else if (S.f.pC) await S.think('老照片里，这里什么都没有。');
  }
  async function digOn(S, id) {
    const e = S.ent(id);
    if (e.s.open) return S.narr('撬开的土坑，底下只有碎砖。坑里积了一点水。');
    if (!S.f.pC) return S.narr('一团盘起来的榕树根，底下的土鼓鼓的。');
    if (!S.has('bar')) return S.narr('徒手挖不开。');
    const r = await S.ask('用铁撬把这团树根和土撬开？', ['撬开', '先不要']);
    if (r) return;
    S.sfx('thud'); S.shake(250, 1);
    if (id === 'c2') return wellFound(S);
    e.s.open = true;
    const m = S.f.digMiss = (S.f.digMiss || 0) + 1;
    drip(S); drip(S, .3, .8);
    await S.narr('你把树根一根一根撬断，把土扒开……底下只有碎砖。\n脚边的土忽然变得好湿，冰冷的水从土里渗出来，漫过你的鞋底。');
    if (m >= 2) { S.fx('static'); S.sfx('whisper'); await S.narr('有什么东西，在土底下，轻轻碰了一下你的脚踝。'); }
    S.face('az_b', 'pl');
    if (m === 1) await S.say('阿哲', '……不是这里吧？');
    else if (m === 2) await S.say('阿哲', '柱子……你有算到那根断掉的吗？左边数过来，第二根是断的。');
    else if (m === 3) await S.say('阿哲', '芒果树头在那里。老照片里，井就在芒果树的正后面。');
    else { await S.say('阿哲', '……就是芒果树头正后面、廊下前面那一团。'); S.bubble('c2', '!', 3000); }
  }
  async function wellFound(S) {
    S.f.wellFound = true;
    await S.narr('铁撬「锵」地敲到了石头。');
    S.hide('c2'); S.show('well'); wellEcho(S);
    await S.narr('你把土一把一把扒开——一圈圆圆的石头井口，从树根底下露了出来。\n井里塞满了土。可是一凑近，就闻到一股很深、很冷的水的味道。');
    await S.say('阿哲', '……找到了。', { style: 'whisper' });
    S.goal('把老照片还回井边');
    S.cp('well');
  }
  async function wellOn(S) {
    if (S.f.done) return;
    S.f.shots = 0;
    S.focus(8, 4);
    S.show('chunB'); S.ent('chunB').alpha = 0; S.face('chunB', 3);
    await S.alpha('chunB', .85, 1200);
    hum(S, .2, .8);
    await S.narr('井的另一边，廊下的柱子之间，站着一个人。\n背对着你。粗布衫湿透了，头发一绺一绺地贴在背上。\n她在哼一首很旧的歌。听不出歌词。');
    S.face('az_b', 'chunB');
    await S.say('阿哲', '……小晴。她在。', { style: 'whisper' });
    await S.think('阿嬷，我找到了。');
    while (true) {
      const opts = ['把照片和镯子放回井边', '按下快门', '只放照片，镯子留着当证据'];
      const r = await S.ask('你手里拿着阿嬷的相簿、那只玉镯，和拍立得。', opts);
      if (r === 0) return goodEnd(S);
      if (r === 2) return jadeEnd(S);
      const n = S.f.shots + 1;
      if (n === 3) {
        S.face('az_b', 'pl');
        await S.say('阿哲', ['第三下了！', '阿婆讲的——头一下拍人，第二下拍伊，第三下……'], { style: 'big' });
        const c = await S.ask('你的手指压在快门上。', ['……不按了', '按下去']);
        if (c === 0) { await S.narr('你慢慢把手指移开。\n阿哲抓着你的手腕，抓得好紧。'); continue; }
        return shutterEnd(S);
      }
      S.f.shots = n; shutter(S); S.fx('flash'); S.f.film = (S.f.film ?? 7) - 1;
      await S.wait(600);
      if (n === 1) {
        await S.narr('闪光灯亮了一下。\n相纸吐出来，慢慢显影——\n照片上，她的头转过来了一点。');
        if (S.f.rule) await S.think('「头一下拍的是人……」');
      } else {
        S.face('chunB', 0);
        await S.scare('face', { spr: '@achunG', face: 'achun', sfx: 'scream' });
        await S.narr('相纸上，她就站在镜头正前面。\n湿头发中间，一只眼睛，看着你。');
        await S.say('阿哲', '够了！不要再拍了！', { style: 'whisper' });
      }
    }
  }
  async function goodEnd(S) {
    S.f.done = true;
    S.take('jade'); S.ent('well').s.photo = true;
    await S.narr('你蹲下来，把三张老照片，和那只镯子，轻轻放在井口的石头上。');
    const r = await S.ask('你想对她说……', ['「阿春姊仔，你没有偷。阿嬷都看到了。」', '「对不起，让你等这么久。」']);
    await S.say('小晴', r === 0 ? '阿春姊仔，你没有偷。\n阿嬷都看到了。她那时候八岁，不敢讲。' : '对不起，让你等了这么久。\n阿嬷她……一直记得你。');
    S.face('chunB', 0);
    await S.narr('哼歌的声音停了。\n她慢慢转过身来。\n湿头发底下，是一张很年轻、很年轻的脸。十七岁。眼睛红红的。');
    await S.narr('她弯下腰，看了看井边的照片。\n手指在第一张——全家福最边边那个小女孩的脸上——停了很久。');
    S.sfx('chime');
    await S.alpha('chunB', 0, 1600);
    await S.narr('风停了。蝉又叫了起来。\n井口的石头上，镯子不见了。照片还在，被露水打湿了一角。');
    const aj = (S.f.aj || 0) === 7;
    S.focus(null);
    return S.end({ id: 'home', title: '第十六夜　完', text: '第二天，我们把借据和阿嬷的相簿，一起交给了乡公所。\n办事员看了很久，说这种事，他也不知道该归哪一科。\n\n后来我再也没有回去过。\n听隔壁阿婆说，从那以后，夜里再也没人听见大厅里有木屐声，和那一声一声的「镯仔」。\n听说那年秋天，后院那团榕树根底下，开出了一丛白色的野姜花。\n\n那三张拍立得，多出来的人都不见了。\n只有最后一张——井边，老照片放着的地方——\n有一个很淡、很淡的影子，弯着腰，像在捡什么东西。' + (aj ? '\n\n阿嬷的相簿里，后来多了一张照片。是我没拍过的：\n后院的井边，一个打赤脚的小女孩，牵着一个穿粗布衫的姊姊。\n她们在笑。' : '') });
  }
  async function jadeEnd(S) {
    S.f.done = true;
    await S.narr('你把三张老照片放在井口的石头上，把镯子收进了口袋。\n「这是证据，」你说，「要让大家知道，她是被冤枉的。」');
    S.fx('red'); S.sfx('whisper'); drip(S); drip(S, .4);
    await S.narr('哼歌的声音停了。\n她没有回头。');
    return S.end({ bad: true, id: 'jade', title: '镯子带走了', text: '镯子后来放在我书桌的抽屉里。\n\n从那天起，我拍的每一张照片——毕业照、家族旅行、过年的团圆饭——\n角落里，都多了一个低着头的女孩。\n她跪在地上，两只手按着地面，像在找什么东西。\n\n阿哲说，你该把镯子还回去。\n我每次都说好，明天。' });
  }
  async function shutterEnd(S) {
    S.f.done = true;
    shutter(S); S.fx('flash'); S.fx('red'); S.sfx('scream'); S.shake(700, 3);
    await S.wait(500);
    await S.narr('闪光灯亮的那一下，你看见她就站在你面前。\n近得你看得见她睫毛上的水珠。');
    return S.end({ bad: true, id: 'shutter', title: '第三下快门', text: '后来，阿哲说，他什么都没看到。\n闪光灯亮了一下，你就不见了。\n\n地上只剩那台拍立得，吐出了最后一张相纸。\n照片上是后院的井边。\n一个人背对着镜头站着，衣服湿透了，头发一绺一绺地贴在背上。\n\n是你。' });
  }
})();
