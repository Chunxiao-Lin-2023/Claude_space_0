/* ================= 小剧场里的怪物（手画像素，比普通小人大 2–3 倍） =================
   都是通用的恐怖原型（长发红衣女鬼、瘦长无脸、两张脸的影子、半边塌掉的脸……），不照搬任何改编作品的造型。
   GH[形象](R, t, o)：R(x, y, w, h, 颜色) 以精灵左上角为原点；o = { dir, moving, talk, glow, k }。
   GHOST_OF：剧本里的名字 → 形象。画两遍：先画身体（会被黑暗盖住），黑暗之后再画一遍“发光”的部分（脸、眼、红衣），
   所以它们在黑里也看得见——像真的站在那儿。 */
/* 画笔：不再是一块块方块——按行画的“有机形状”（每一行有自己的中心和宽度）、折线肢体、带深色描边 */
function ghKit(R) { const r = Math.round; const K = {
  shape(y0, y1, f, c, ol) { for (let y = y0; y <= y1; y++) { const q = f(y); if (!q || q[1] <= 0) continue; const [cx, w] = q; if (ol) R(r(cx - w / 2) - 1, y, Math.max(1, r(w)) + 2, 1, ol); } for (let y = y0; y <= y1; y++) { const q = f(y); if (!q || q[1] <= 0) continue; const [cx, w] = q; R(r(cx - w / 2), y, Math.max(1, r(w)), 1, c); } if (ol) { const a = f(y0), b = f(y1); if (a && a[1] > 0) R(r(a[0] - a[1] / 2), y0 - 1, Math.max(1, r(a[1])), 1, ol); if (b && b[1] > 0) R(r(b[0] - b[1] / 2), y1 + 1, Math.max(1, r(b[1])), 1, ol); } },
  line(x0, y0, x1, y1, c, th) { th = th || 1; const n = Math.max(1, Math.ceil(Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0)))); for (let i = 0; i <= n; i++) R(r(x0 + (x1 - x0) * i / n - (th - 1) / 2), r(y0 + (y1 - y0) * i / n), th, th > 1 ? th - 1 || 1 : 1, c); },
  limb(p, c, th, ol) { if (ol) for (let i = 0; i < p.length - 1; i++) { K.line(p[i][0] - 1, p[i][1], p[i + 1][0] - 1, p[i + 1][1], ol, th); K.line(p[i][0] + 1, p[i][1], p[i + 1][0] + 1, p[i + 1][1], ol, th); } for (let i = 0; i < p.length - 1; i++) K.line(p[i][0], p[i][1], p[i + 1][0], p[i + 1][1], c, th); },
  fingers(x, y, dirs, len, c) { for (const d of dirs) K.line(x, y, x + Math.cos(d) * len, y + Math.sin(d) * len, c); },
  px(x, y, c) { R(r(x), r(y), 1, 1, c); } }; return K; }
const GH = {
  /* 长发红衣：身子扭成 S 形，头歪着，头发一绺一绺垂到腰；一只手垂到膝盖，另一只往前伸，手指又细又长；裙摆撕成一条一条 */
  redwoman: { w: 24, h: 42, draw(R, t, o) { const K = ghKit(R), b = Math.round(Math.sin(t * 1.6) * 1.2) - 2, H = o.hair || '#0b0707', D = o.dress || '#8e0c0c', D2 = o.dress2 || '#4a0404', S = o.skin || '#e6dfd8', OL = '#160202';
    const cx = y => 12 + Math.sin(y * .17 + t * 1.1) * 1.4; const tilt = Math.sin(t * .7) * 1.5 + 2;
    K.shape(14 + b, 37 + b, y => { const k = (y - 14 - b) / 23; return [cx(y), 4 + k * 10 + (k > .85 ? Math.sin(y * 3 + t * 6) * 1.5 : 0)]; }, D, OL);
    for (let i = 0; i < 9; i++) { const x = cx(36) - 7 + i * 1.8, l = 2 + (hash(i, 7, 3) * 4 | 0) + (Math.sin(t * 4 + i) > .3 ? 1 : 0); K.line(x, 37 + b, x + Math.sin(t * 2 + i) * .8, 37 + b + l, i % 2 ? D2 : D); }
    K.line(cx(16) - 1, 16 + b, cx(30) - 2, 32 + b, D2); K.line(cx(18) + 2, 18 + b, cx(30) + 3, 31 + b, o.dressHi || '#b01a1a');
    K.limb([[cx(15) - 3, 15 + b], [cx(15) - 6, 23 + b], [cx(15) - 5, 31 + b]], S, 1, OL); K.fingers(cx(15) - 5, 31 + b, [1.3, 1.6, 1.9, 2.2], 3, S);
    const rx = cx(15) + 3, reach = Math.sin(t * .9) * 2; K.limb([[rx, 15 + b], [rx + 5, 20 + b], [rx + 9 + reach, 17 + b]], S, 1, OL); K.fingers(rx + 9 + reach, 17 + b, [-.5, -.15, .2, .55], 3, S);
    K.line(cx(13), 13 + b, cx(13) + tilt * .5, 10 + b, S);
    const hx = cx(8) + tilt; K.shape(2 + b, 11 + b, y => [hx + (y - 6 - b) * .25, [4, 6, 7, 8, 8, 8, 7, 7, 6, 4][y - 2 - b] || 4], H, OL);
    for (let i = 0; i < 8; i++) { const x0 = hx - 4 + i * 1.2, len = 10 + (hash(i, 3, 9) * 16 | 0), sw = Math.sin(t * 1.8 + i * .7) * 1.6; K.line(x0, 8 + b, x0 + sw + (i - 4) * .4, 8 + b + len, H); }
    K.line(hx, 5 + b, hx - .5, 10 + b, S); if (Math.sin(t * 1.3) > -.6) K.px(hx, 7 + b, '#ff2a2a');
    if (o.drip) for (let i = 0; i < 4; i++) K.px(cx(36) - 5 + i * 3, 38 + b + ((t * 16 + i * 7) % 8), D2); } },
  /* 镜鬼：身体像碎镜子一样一截一截错开；脸是一块裂开的镜片；一只手变成长长的玻璃片 */
  mirrorghost: { w: 24, h: 40, draw(R, t, o) { const K = ghKit(R), b = Math.round(Math.sin(t * 1.4)) - 1, G = '#9aa0aa', G2 = '#545a66', M = '#c8d4dc', OL = '#14161c';
    const off = y => Math.round(Math.sin(Math.floor(y / 5) * 1.7 + t * 2.2) * (Math.floor(y / 5) % 2 ? 2 : 1));
    K.shape(13 + b, 36 + b, y => [12 + off(y), 5 + (y - 13 - b) * .22], G, OL); K.shape(14 + b, 34 + b, y => [11 + off(y), 2], G2);
    for (let y = 18; y < 36; y += 5) R(7, y + b, 10, 1, OL);
    K.limb([[9 + off(15), 15 + b], [5, 22 + b], [4, 29 + b]], G, 1, OL); K.fingers(4, 29 + b, [1.4, 1.8, 2.1], 3, G);
    K.limb([[15 + off(15), 15 + b], [19, 20 + b]], G, 1, OL); K.line(19, 20 + b, 23, 30 + b, M, 2); K.px(22, 28 + b, '#fff');
    K.shape(2 + b, 12 + b, y => [12 + (y - 7 - b) * .2, [5, 7, 8, 8, 8, 8, 8, 7, 6, 5, 3][y - 2 - b]], M, OL);
    K.line(10, 3 + b, 13, 11 + b, OL); K.line(12, 6 + b, 15, 5 + b, OL); K.line(11, 8 + b, 8, 9 + b, OL); K.px(14, 7 + b, '#ff3030'); K.px(10, 4 + b, '#ffffff');
    for (let i = 0; i < 5; i++) { const a = t * 1.3 + i * 1.26, x = 12 + Math.cos(a) * 11, y = 20 + b + Math.sin(a) * 7; K.line(x, y, x + 1, y + 3, M); K.px(x, y, '#fff'); } } },
  /* 两张脸：驼着背的黑色东西，头很宽，左边一张脸歪着，右边一张倒着长；手臂拖到地上 */
  twoface: { w: 30, h: 44, draw(R, t, o) { const K = ghKit(R), b = Math.round(Math.sin(t * 1.1)), Kc = '#0e0b10', K2 = '#221c26', F = '#e8e0d8', OL = '#000', tw = Math.sin(t * 6.3) > .9 ? 1 : 0;
    K.shape(15 + b, 39, y => { const k = (y - 15) / 24; return [15 - k * 3 + Math.sin(k * 3) * 2, 12 - k * 4 + Math.sin(k * 5 + t) * 1]; }, Kc, OL); K.shape(18 + b, 32, y => [14 - (y - 18) * .12, 4], K2);
    for (let i = 0; i < 5; i++) K.px(16 + i, 16 + i * 2 + b, '#3a3040');
    K.limb([[8, 19 + b], [3, 29 + b], [2, 41]], Kc, 2, OL); K.fingers(2, 41, [-.3, 0, .3], 3, Kc); K.limb([[21, 18 + b], [27, 28 + b], [27, 41]], Kc, 2, OL); K.fingers(27, 41, [2.8, 3.1, 3.4], 3, Kc);
    K.shape(0 + b, 15 + b, y => [15, [10, 14, 18, 20, 22, 22, 22, 22, 22, 22, 21, 20, 18, 16, 13, 9][y - b]], Kc, OL);
    const L = (y) => 9 + (y - 8 - b - tw) * .45; K.shape(2 + b + tw, 13 + b + tw, y => [L(y), [4, 6, 7, 8, 8, 8, 8, 8, 7, 6, 5, 3][y - 2 - b - tw]], F, '#000');
    K.px(L(5 + b + tw) - 2, 5 + b + tw, '#000'); K.px(L(5 + b + tw) - 1, 5 + b + tw, '#000'); K.px(L(6 + b + tw) + 2, 6 + b + tw, '#000'); K.shape(9 + b + tw, 11 + b + tw, y => [L(y), 3], '#300'); K.line(L(6) - 2, 7 + b + tw, L(11) - 2, 13 + b + tw, '#6a6060');
    K.shape(2 + b - tw, 13 + b - tw, y => [21, [3, 5, 6, 7, 8, 8, 8, 8, 8, 7, 6, 4][y - 2 - b + tw]], F, '#000'); K.shape(3 + b - tw, 5 + b - tw, y => [21, 4 - (y - 3 - b + tw)], '#300'); K.px(19, 10 + b - tw, '#000'); K.px(20, 10 + b - tw, '#000'); K.px(23, 10 + b - tw, '#000'); K.px(22, 10 + b - tw, '#000'); K.line(23, 11 + b - tw, 23, 15 + b - tw, '#6a6060'); } },
  /* 半边脸：左肩高右肩低的大块头，肚子往下坠；右半边头塌进去，一只眼睛鼓出来，嘴斜着裂到耳根；右手一把长刀拖地 */
  deformed: { w: 28, h: 42, draw(R, t, o) { const K = ghKit(R), P = '#8aa0b4', P2 = '#5a7084', S = '#d8bea4', B = '#6a1010', OL = '#14100c', sw = Math.sin(t * 1.8);
    K.shape(14, 32, y => { const k = (y - 14) / 18; return [13 + k * 1.5, 12 + Math.sin(k * 3.1) * 6]; }, P, OL); K.shape(15, 31, y => [9 + (y - 15) * .1, 3], P2);
    R(10, 19, 4, 5, B); R(16, 24, 3, 6, B); R(12, 28, 2, 3, B); K.line(7, 14, 18, 18, P2);
    K.limb([[10, 32], [8, 37], [9, 41]], P2, 3, OL); K.limb([[17, 32], [20, 36], [18, 41]], P2, 3, OL);
    K.limb([[6, 15], [3, 22], [5, 27]], S, 2, OL); K.limb([[20, 18], [23, 24], [23 + sw, 28]], S, 2, OL); K.line(23 + sw, 27, 25 + sw, 41, '#b8bcc4', 2); K.line(22 + sw, 27, 25 + sw, 27, '#4a3020'); K.px(24 + sw, 36, B);
    K.shape(2, 14, y => { const k = (y - 2) / 12; return [11 + k * .5, [6, 9, 11, 12, 12, 12, 12, 12, 11, 11, 10, 9, 7][y - 2]]; }, S, OL);
    K.shape(4, 13, y => [15.5, [3, 4, 5, 5, 6, 6, 5, 5, 4, 3][y - 4]], '#6a3040'); K.shape(6, 10, y => [16, [3, 4, 4, 4, 3][y - 6]], '#f0ece0'); K.px(16, 8, '#000'); K.px(17, 7, B);
    K.px(8, 6, '#000'); K.px(9, 6, '#000'); K.line(6, 10, 15, 13, '#2a0606'); for (let i = 0; i < 4; i++) K.px(8 + i * 2, 11 + i * .3, '#e8e0d0'); K.line(12, 2, 12, 14, '#3a1a20'); for (let y = 3; y < 14; y += 2) K.px(11, y, '#3a1a20'); } },
  /* 独臂：驼背，左边袖子空着晃，右手长得不对劲、指节拖在地上 */
  onearm: { w: 24, h: 42, draw(R, t, o) { const K = ghKit(R), P = '#8aa0b4', P2 = '#5a7084', S = '#d6c0aa', OL = '#141010', B = '#7a0a0a', sl = Math.sin(t * 2.2) * 2, ll = Math.sin(t * .9) * 1.5;
    K.shape(13, 31, y => { const k = (y - 13) / 18; return [11 + k * 2 - Math.sin(k * 3) * 3, 7 + k * 2]; }, P, OL); K.line(7, 15, 9, 29, P2); for (let i = 0; i < 4; i++) K.line(11, 17 + i * 2, 15, 18 + i * 2, '#6a7f90');
    K.limb([[7, 14], [5 + sl, 21], [6 + sl, 24]], P, 2); K.shape(24, 26, y => [6 + sl, 3], '#c8c0b0'); for (let i = 0; i < 3; i++) K.px(5 + sl + i, 27 + ((t * 9 + i * 3) % 9), B);
    K.limb([[15, 14], [20, 22], [21, 31], [19 + ll, 40]], S, 1, OL); K.fingers(19 + ll, 40, [2.6, 2.9, 3.2, 3.5], 3, S);
    K.limb([[9, 31], [7, 36], [9, 41]], P2, 2, OL); K.limb([[14, 31], [15, 36], [13, 41]], P2, 2, OL);
    const tl = Math.sin(t * .6) * 1 + 2; K.line(11, 13, 12 + tl * .5, 11, S, 2);
    K.shape(1, 11, y => [12 + tl + (y - 6) * .5, [4, 6, 8, 9, 9, 9, 9, 8, 7, 6, 4][y - 1]], S, OL); K.line(9 + tl, 2, 16 + tl, 4, '#5a3030'); for (let x = 10; x < 16; x += 2) K.px(x + tl, 3 + (x - 9) * .25, '#2a1010');
    K.px(11 + tl, 5, '#000'); K.px(15 + tl, 7, '#000'); K.shape(7, 10, y => [14 + tl, [2, 3, 3, 2][y - 7]], '#080404'); } },
  /* 瘦长：比人高两倍半，脖子往前折，头吊在胸口前面；膝盖反着弯；手臂有三节，手指像一把扇子 */
  slender: { w: 26, h: 64, draw(R, t, o) { const K = ghKit(R), C = o.col || '#d2ccc2', C2 = '#8a847a', OL = '#141210', H = '#0e0c0c', sway = Math.sin(t * .8) * 1.5, one = o.oneEye;
    K.limb([[12, 36], [8, 47], [13, 58], [11, 63]], C2, 2, OL); K.limb([[14, 36], [18, 47], [14, 58], [16, 63]], C2, 2, OL);
    K.shape(16, 37, y => [13 + Math.sin((y - 16) * .2) * .8 + sway * (37 - y) / 21, 3 + (y < 20 ? (y - 16) * .6 : 2.4)], C, OL);
    for (let y = 20; y < 36; y += 3) K.px(12 + sway * (37 - y) / 21, y, C2);
    const sx = 13 + sway; K.limb([[sx - 2, 18], [sx - 8, 28], [sx - 5, 40], [sx - 7, 49]], C, 1, OL); K.fingers(sx - 7, 49, [1.2, 1.5, 1.8, 2.1, 2.4], 5, C);
    K.limb([[sx + 2, 18], [sx + 8, 29], [sx + 6, 41], [sx + 8, 50]], C, 1, OL); K.fingers(sx + 8, 50, [.7, 1, 1.3, 1.6, 1.9], 5, C);
    K.line(sx, 17, sx + 3, 14, C2, 2); K.line(sx + 3, 14, sx + 5, 18, C2, 2);
    const hx = sx + 5; K.shape(17, 28, y => [hx, [3, 5, 6, 6, 6, 6, 6, 5, 5, 4, 3, 2][y - 17]], H, OL);
    for (let i = 0; i < 5; i++) K.line(hx - 2 + i, 26, hx - 2 + i + Math.sin(t * 1.5 + i) * .8, 30 + (i * 3) % 5, H);
    K.line(hx, 22, hx, 27, '#000'); K.px(hx, 24, '#4a0000');
    if (one) { K.shape(19, 22, y => [hx + 1, [2, 4, 4, 2][y - 19]], '#e8e0c8'); K.px(hx + 1, 20, Math.sin(t * 3) > 0 ? '#f02020' : '#a00'); K.px(hx + 1, 21, '#000'); } } },
  /* 护士：头折到右肩上，一抽一抽；左手反着拧到背后；右手攥着滴水的针管；膝盖往里扣 */
  nurse: { w: 24, h: 40, draw(R, t, o) { const K = ghKit(R), W = '#e2e0d8', W2 = '#a8a69e', S = '#d8d0cc', B = '#7a0c0c', OL = '#18161a', jerk = Math.sin(t * 9) > .85 ? 1 : 0;
    K.shape(13, 30, y => { const k = (y - 13) / 17; return [11, 6 + k * 5]; }, W, OL); K.line(8, 14, 9, 29, W2); R(10, 19, 3, 3, B); R(8, 26, 4, 2, B);
    K.limb([[9, 31], [11, 35], [8, 39]], S, 1, OL); K.limb([[13, 31], [11, 35], [14, 39]], S, 1, OL);
    K.limb([[8, 15], [4, 19], [6, 13], [9, 17]], S, 1, OL);
    K.limb([[14, 15], [17, 21], [19, 24]], S, 1, OL); K.line(18, 24, 23, 22, '#c8d8e0', 1); K.px(23, 22, '#8a8a90'); K.px(18, 25 + ((t * 7) % 5), '#9ad0e0');
    K.line(12, 13, 15 + jerk, 9, S, 2);
    const hx = 17 + jerk, hy = 8; K.shape(hy - 4, hy + 4, y => [hx + (y - hy) * .6, [3, 5, 6, 7, 7, 7, 6, 5, 3][y - hy + 4]], S, OL);
    K.line(hx - 3, hy - 4, hx + 4, hy, '#e8e8e0', 2); K.px(hx + 1, hy - 3, '#c03030'); K.shape(hy + 1, hy + 3, y => [hx + 1 + (y - hy) * .6, 4], '#f0f0ea'); K.px(hx - 2, hy - 1, '#000'); K.px(hx - 1, hy - 2, '#000'); K.px(hx + 1, hy, '#000'); K.px(hx + 2, hy - 1, '#000'); } },
  /* 老院长：很高的红衣，衣摆一条一条垂着；头拉得很长，下巴脱臼一样掉到胸口；手只剩骨头 */
  dean: { w: 24, h: 46, draw(R, t, o) { const K = ghKit(R), b = Math.round(Math.sin(t * 1)) - 1, Rr = '#8e1212', R2 = '#4a0606', S = '#e0d8d2', OL = '#1a0202';
    K.shape(15 + b, 41 + b, y => { const k = (y - 15 - b) / 26; return [12 + Math.sin(k * 4 + t * .8) * .8, 6 + k * 9]; }, Rr, OL);
    for (let i = 0; i < 7; i++) K.line(6 + i * 2, 30 + b, 5.5 + i * 2.2, 42 + b + (hash(i, 2, 5) * 3 | 0), i % 2 ? R2 : Rr);
    K.limb([[9, 17 + b], [6, 26 + b], [7, 33 + b]], Rr, 2, OL); K.limb([[15, 17 + b], [18, 26 + b], [17, 33 + b]], Rr, 2, OL); K.fingers(7, 33 + b, [1.3, 1.7, 2.1], 4, S); K.fingers(17, 33 + b, [1, 1.4, 1.8], 4, S);
    K.shape(1 + b, 15 + b, y => [12, [4, 6, 7, 8, 8, 8, 7, 7, 6, 6, 5, 5, 5, 4, 3][y - 1 - b]], S, OL); K.line(8, 1 + b, 16, 1 + b, '#d0d0cc');
    K.shape(4 + b, 6 + b, y => [10, 2], '#080606'); K.shape(4 + b, 6 + b, y => [14, 2], '#080606'); K.shape(8 + b, 14 + b, y => [12, [2, 3, 3, 3, 3, 2, 2][y - 8 - b]], '#200404'); K.line(10, 15 + b, 14, 15 + b, '#b8b0a8'); } },
  /* 拿斧子的人：往前探着身子，斧子举过头顶一晃一晃；眼睛瞪得太圆，嘴咧开 */
  axeman: { w: 26, h: 38, draw(R, t, o) { const K = ghKit(R), S = '#e2c2a2', T = '#5a4a3a', B = '#7a0e0e', OL = '#140e0a', sw = Math.sin(t * (o.moving ? 8 : 2)) * 1.5;
    K.shape(13, 27, y => { const k = (y - 13) / 14; return [12 - k * 1.5, 9 + k * 2]; }, T, OL); R(10, 16, 3, 2, B); R(13, 21, 2, 3, B); R(9, 24, 2, 2, B);
    K.limb([[10, 27], [8, 32], [9, 37]], '#3a3530', 3, OL); K.limb([[14, 27], [16, 32], [15, 37]], '#3a3530', 3, OL);
    K.limb([[8, 14], [6, 8 + sw], [10, 3 + sw]], S, 1, OL); K.limb([[16, 14], [18, 8 + sw], [13, 3 + sw]], S, 1, OL);
    K.line(11, 4 + sw, 21, -2 + sw, '#5a3a20', 2); K.shape(-3 + Math.round(sw), 4 + Math.round(sw), y => [22, 5], '#aab0b8', OL); K.line(24, -3 + sw, 24, 4 + sw, '#e0e4e8'); K.px(21, 2 + sw, B); K.px(22, 3 + sw, B);
    K.shape(4, 13, y => [11 + (y - 4) * .2, [6, 8, 9, 9, 9, 9, 9, 8, 7, 5][y - 4]], S, OL); K.line(6, 4, 15, 4, '#2a2420', 2); K.line(6, 5, 7, 9, '#2a2420');
    K.shape(6, 8, y => [9, 3], '#f8f8f0'); K.shape(6, 8, y => [13.5, 3], '#f8f8f0'); K.px(9, 7, '#000'); K.px(14, 7, '#000'); K.line(8, 11, 14, 10, '#4a1010'); K.px(10, 11, '#e8e0d0'); K.px(12, 11, '#e8e0d0'); K.px(15, 9, B); } },
  /* 兜帽刀客：瘦，半蹲着往前走；兜帽里只看得见一张咧到两边的笑；刀垂在腿边 */
  knifeman: { w: 22, h: 38, draw(R, t, o) { const K = ghKit(R), H = '#5a1c18', H2 = '#300c0a', S = '#d8bca0', OL = '#100606';
    K.shape(12, 27, y => { const k = (y - 12) / 15; return [11 - k * .5 + Math.sin(k * 3) * .8, 8 + k * 2]; }, H, OL); K.line(7, 13, 8, 26, H2);
    K.limb([[9, 27], [7, 32], [9, 37]], '#2a2a30', 2, OL); K.limb([[13, 27], [16, 32], [14, 37]], '#2a2a30', 2, OL);
    K.limb([[8, 14], [5, 21], [6, 26]], H, 2, OL); K.limb([[14, 14], [17, 20], [17, 24]], H, 2, OL); K.line(17, 24, 19, 35, '#d8dce0', 1); K.px(17, 24, '#2a1a10');
    K.shape(1, 12, y => [11, [4, 7, 9, 10, 10, 10, 10, 10, 10, 9, 8, 6][y - 1]], H2, OL); K.shape(4, 11, y => [11, [5, 7, 8, 8, 8, 8, 7, 5][y - 4]], '#0c0404');
    for (let x = 6; x <= 16; x++) { const y = 9 + Math.round(Math.pow((x - 11) / 5, 2) * -2.5 + 0); K.px(x, y, '#f0e8d8'); if (x % 2) K.px(x, y + 1, '#300'); }
    const gl = Math.sin(t * 2) > .7 ? '#f0f0f0' : '#555'; K.px(9, 6, gl); K.px(13, 6, gl); } },
  /* 死去的孩子：头大得不对，歪着；身子很小，手脚像细棍；眼睛是两个黑洞，黑水一直往下淌 */
  deadchild: { w: 18, h: 30, draw(R, t, o) { const K = ghKit(R), C = o.col || '#9a1818', S = '#e8e4e0', OL = '#120404', b = Math.round(Math.sin(t * 2) * .6), tl = Math.sin(t * .9) * 1.2 + 1;
    K.shape(15 + b, 23 + b, y => [9, 4 + (y - 15) * .3], C, OL); K.limb([[8, 23 + b], [7, 27], [8, 29]], S, 1, OL); K.limb([[10, 23 + b], [11, 27], [10, 29]], S, 1, OL);
    K.limb([[7, 16 + b], [4, 21 + b], [5, 24 + b]], S, 1, OL); K.limb([[11, 16 + b], [14, 20 + b], [14, 24 + b]], S, 1, OL);
    K.shape(1 + b, 14 + b, y => [9 + tl * (14 - y) / 13, [6, 9, 11, 12, 12, 12, 12, 12, 11, 11, 10, 9, 7, 4][y - 1 - b]], S, OL); K.line(4 + tl, 2 + b, 13 + tl, 2 + b, '#141214', 2);
    K.shape(6 + b, 8 + b, y => [6.5 + tl * .6, 3], '#000'); K.shape(6 + b, 8 + b, y => [11.5 + tl * .6, 3], '#000'); K.line(6 + tl * .6, 9 + b, 6 + tl * .5, 14 + b + ((t * 3 | 0) % 3), '#1a0a0a'); K.line(12 + tl * .6, 9 + b, 12 + tl * .5, 13 + b, '#1a0a0a'); K.shape(11 + b, 12 + b, y => [9 + tl * .4, 3], '#2a0000'); } },
  /* 淹死的人：泡胀了，肚子和脸都圆鼓鼓的，皮肤发青，血管发黑；头发湿成一条一条贴在脸上 */
  drowned: { w: 24, h: 40, draw(R, t, o) { const K = ghKit(R), S = '#a8bcc2', S2 = '#7a949e', H = '#0e1416', C = o.col || '#4a5a6a', OL = '#0a1014', b = Math.round(Math.sin(t * 1.2));
    K.shape(13 + b, 32, y => { const k = (y - 13) / 19; return [12, 7 + Math.sin(k * 2.6) * 8]; }, C, OL); K.line(9, 18, 7, 28, '#34404c'); K.line(14, 16, 16, 24, '#2a3640');
    K.limb([[10, 32], [9, 39]], S2, 3, OL); K.limb([[14, 32], [15, 39]], S2, 3, OL); K.limb([[6, 15 + b], [3, 22], [4, 28]], S, 3, OL); K.limb([[18, 15 + b], [21, 22], [20, 28]], S, 3, OL);
    K.shape(1 + b, 13 + b, y => [12, [6, 9, 11, 12, 13, 13, 13, 13, 12, 12, 11, 9, 7][y - 1 - b]], S, OL); K.line(9, 5 + b, 10, 11 + b, '#5a7680'); K.line(15, 6 + b, 14, 12 + b, '#5a7680');
    for (let i = 0; i < 7; i++) K.line(6 + i * 2, 1 + b, 6 + i * 2 + Math.sin(i) * 1.5, 7 + b + (i * 5) % 7, H); K.px(9, 7 + b, '#f0f8f8'); K.px(15, 7 + b, '#f0f8f8'); K.shape(10 + b, 11 + b, y => [12, 4], '#203030');
    for (let i = 0; i < 5; i++) K.px(5 + i * 3.5, 28 + ((t * 18 + i * 9) % 12), '#7ab0c8'); } },
  /* 学生：脖子断了，头往一边折过去吊着；两条胳膊一长一短，耷拉着 */
  student: { w: 20, h: 36, draw(R, t, o) { const K = ghKit(R), U = '#2e3e5e', W = '#e8e8e8', S = '#d8d2cc', OL = '#0c0e14', tl = o.tilt ?? 4, sg = Math.sign(tl) || 1, sw = Math.sin(t * 1.4) * .6;
    K.shape(12, 25, y => [10, 7 + (y - 12) * .1], U, OL); K.shape(12, 15, y => [10, 3], W); K.limb([[8, 25], [8, 30], [7, 35]], U, 2, OL); K.limb([[12, 25], [12, 30], [13, 35]], U, 2, OL);
    K.limb([[7, 13], [5, 20], [5 + sw, 27]], S, 1, OL); K.limb([[13, 13], [15, 19], [15 + sw, 23]], S, 1, OL);
    K.line(10, 12, 10 + sg * 3, 10, S, 2); const hx = 10 + sg * 6, hy = 10; K.shape(hy - 3, hy + 4, y => [hx + (y - hy) * sg * .5, [4, 6, 7, 7, 7, 6, 5, 3][y - hy + 3]], S, OL);
    K.line(hx + sg * 3, hy - 3, hx + sg * 3, hy + 3, '#141214', 2); K.px(hx - sg, hy - 1, '#000'); K.px(hx - sg, hy + 2, '#000'); K.line(hx + sg * -2, hy - 1, hx + sg * -2, hy + 2, '#300'); } },
  /* 影子：边缘一直在冒烟的黑色人形，只有两点白；脚底下拖着烟 */
  shadow: { w: 20, h: 40, draw(R, t, o) { const K = ghKit(R), Kc = '#050407', K2 = '#100e14';
    K.shape(11, 36, y => [10 + Math.sin(y * .5 + t * 3) * .8, 6 + (y - 11) * .12 + Math.sin(y * 1.3 + t * 5) * 1.2], Kc); K.shape(13, 30, y => [10, 3], K2);
    K.shape(1, 11, y => [10 + Math.sin(y + t * 4) * .5, [4, 6, 7, 8, 8, 8, 8, 7, 6, 5, 4][y - 1]], Kc); K.limb([[6, 13], [3, 22], [4, 30]], Kc, 2); K.limb([[14, 13], [17, 21], [16, 29]], Kc, 2);
    for (let i = 0; i < 8; i++) { const x = 4 + i * 1.7, h = (t * 6 + i * 2.3) % 5; K.px(x + Math.sin(t * 3 + i), 37 - h, i % 2 ? Kc : K2); K.px(x + 1, 38 - h * .5, Kc); }
    if (Math.sin(t * 1.9) > -.6) { K.px(8, 6, '#e8e4dc'); K.px(12, 6, '#e8e4dc'); } } }
};

/* 剧本里的名字 → 怪物形象（没列的照旧用普通像素小人） */
const GHOST_OF = { 张雅: ['redwoman'], 红影: ['redwoman', { hair: '#2a0404', dress: '#5a0404', dress2: '#300202', dressHi: '#7a0808', skin: '#8a3030', drip: 1 }], 舞蹈室的女孩: ['redwoman', { dress: '#d8ccd0', dress2: '#9a8a90', dressHi: '#f0e8ea', hair: '#141214' }],
  镜鬼: ['mirrorghost'], 黑影: ['twoface'], 畸形脸: ['deformed'], 独臂: ['onearm'], 瘦长怪物: ['slender'], 瘦长怪物乙: ['slender', { col: '#c8c2b6' }], 独眼的瘦长怪物: ['slender', { oneEye: 1, col: '#bfb8ae' }],
  女护士: ['nurse'], 戴口罩的护士: ['nurse'], 老院长: ['dean'], 王琦: ['axeman'], 张鹏: ['knifeman'], 男孩: ['deadchild'], 小男孩: ['deadchild', { col: '#5a6a7a' }], 小女孩: ['deadchild', { col: '#c88a9a' }],
  湿透的男人: ['drowned'], 雨衣女孩: ['drowned', { col: '#c8a818' }], 学生: ['student'], 学生乙: ['student', { tilt: -3 }], 学生丙: ['student', { tilt: 5 }] };
/* 发光的颜色：红鬼泛红光，别的泛冷白光 */
function ghAura(name) { const k = (GHOST_OF[name] || [])[0]; return k === 'redwoman' || k === 'dean' || k === 'deadchild' ? 'rgba(170,10,10,' : k === 'axeman' || k === 'knifeman' || k === 'deformed' ? 'rgba(120,20,10,' : 'rgba(160,190,210,'; }
/* 画一个怪物；pass = 'body' | 'glow' */
function ghDraw(g, a, pass) { const def = GHOST_OF[a.name]; if (!def) return false; const G = GH[def[0]], o = Object.assign({ dir: a.dir, moving: a.moving, talk: a.talk, glow: pass === 'glow' }, def[1] || {}); const flip = a.dir === 1, x0 = Math.round(a.x - G.w / 2), y0 = (a.feet ?? FEET) - G.h + 2;
  g.save(); if (a.down) { g.translate(x0 + G.w / 2 + G.h / 2, FEET - 2); g.rotate(-Math.PI / 2); g.translate(-G.w / 2, -G.h); } else g.translate(x0, y0);
  const tt = STG.t + a.x * .37, tw = Math.sin(tt * 2.3) > .95 || Math.sin(tt * 5.1 + 1) > .985, b0 = (hash(Math.floor(tt * 8), a.x | 0, 3) * G.h) | 0, dx = tw ? (Math.random() < .5 ? -2 : 2) : 0;
  const R = (x, y, w, h, c) => { if (!c) return; g.fillStyle = c; const sh = tw && y >= b0 && y < b0 + 7 ? dx : 0; g.fillRect((flip ? G.w - x - w : x) + sh, y, w, h); }; G.draw(R, STG.t + a.x * .01, o); g.restore(); return true; }
function ghIs(name) { return !!GHOST_OF[name]; }

/* ================= 怪物发光、新效果、镜头推近 ================= */
function stGhostGlow(g, list, dark, off) { for (const a of list) { if (!ghIs(a.name) || a.alpha < .05) continue; const G = GH[GHOST_OF[a.name][0]], cx = a.x, cy = FEET - G.h / 2, r = G.h * .85, au = ghAura(a.name);
    const gr = g.createRadialGradient(cx, cy, 2, cx, cy, r); gr.addColorStop(0, au + ((dark ? (au.startsWith('rgba(160') ? .16 : .3) : .1) * a.alpha) + ')'); gr.addColorStop(1, au + '0)'); g.globalCompositeOperation = 'lighter'; g.fillStyle = gr; g.fillRect(cx - r, cy - r, r * 2, r * 2); g.globalCompositeOperation = 'source-over';
    if (dark) { g.globalAlpha = a.alpha * (off ? .2 : .5 + .15 * Math.sin(STG.t * 3 + a.x)); ghDraw(g, a, 'glow'); g.globalAlpha = 1; } } }
/* 效果：blood 血从上往下淌 · fog 地上的雾 · eyes 黑暗里的眼睛 · hands 地上伸出来的手 · crack 屏幕裂开 · ash 黑色的雪 · pulse 心跳红晕 · chroma 重影 · lightning 打雷
   另外：台上有怪物、又是黑的时候，四周自动压一圈暗红，偶尔闪一下 */
function stFxOver(g, list, dark) { const F = STG.fx, t = STG.t, H = (i, k) => hash(i, k, 31);
  if (F.fog) for (let i = 0; i < 14; i++) { const L = i % 3, x = ((H(i, 1) * (SW + 120) + t * (5 + L * 4)) % (SW + 120)) - 60, y = 78 + L * 9 + Math.sin(t * .6 + i) * 3, rw = 46 + H(i, 2) * 40, gr = g.createRadialGradient(x, y, 2, x, y, rw); gr.addColorStop(0, 'rgba(170,180,190,' + (.12 + L * .03) + ')'); gr.addColorStop(1, 'rgba(170,180,190,0)'); g.fillStyle = gr; g.fillRect(x - rw, y - rw * .45, rw * 2, rw * .9); }
  if (F.blood) { STG.bloodT0 = STG.bloodT0 || t; const k = Math.min(1, (t - STG.bloodT0) / 3.5); for (let i = 0; i < 22; i++) { const x = (H(i, 1) * SW) | 0, len = (8 + H(i, 2) * 58) * Math.min(1, k * (1.3 - H(i, 3) * .6)), w = H(i, 4) > .7 ? 2 : 1; g.fillStyle = '#5c0404'; g.fillRect(x, 0, w + 1, 3 + H(i, 5) * 4); g.fillStyle = '#7a0808'; g.fillRect(x, 0, w, len | 0); g.fillRect(x - (w > 1 ? 0 : 0), len | 0, w + 1, 2); }
    g.fillStyle = 'rgba(90,4,4,' + .5 * k + ')'; for (let i = 0; i < 6; i++) g.fillRect((H(i, 9) * SW) | 0, FEET + 2 + ((H(i, 8) * 10) | 0), (10 + H(i, 7) * 24) | 0, 2); } else STG.bloodT0 = 0;
  if (F.eyes && dark) for (let i = 0; i < 9; i++) { const ph = (t * (.35 + H(i, 2) * .4) + H(i, 3)) % 1; if (ph > .72) continue; const x = (12 + H(i, 1) * (SW - 24)) | 0, y = (18 + H(i, 4) * 48) | 0, blink = ph > .68 || (ph % .23) < .012; if (blink) continue; g.fillStyle = H(i, 5) > .4 ? '#e01818' : '#e8e2c8'; g.fillRect(x, y, 1, 1); g.fillRect(x + 3, y, 1, 1); }
  if (F.hands) { STG.handT0 = STG.handT0 || t; for (let i = 0; i < 8; i++) { const up = Math.min(1, Math.max(0, (t - STG.handT0) * .7 - H(i, 3) * .8)), x = (10 + H(i, 1) * (SW - 20)) | 0, h = (6 + up * (12 + H(i, 2) * 10) + Math.sin(t * 3 + i) * 1.5) | 0, y = SH - h, S = '#cfc6ba';
      g.fillStyle = S; g.fillRect(x, y + 4, 3, h); g.fillRect(x - 1, y + 2, 5, 3); for (let f = 0; f < 4; f++) g.fillRect(x - 1 + f + (f > 1 ? 1 : 0) - (f === 0 ? 1 : 0), y - 2 + (f % 2), 1, 3 + (f === 3 ? -1 : 0)); g.fillStyle = '#6a0a0a'; g.fillRect(x, y + h - 2, 3, 2); } } else STG.handT0 = 0;
  if (F.ash) { for (let i = 0; i < 60; i++) { const x = ((H(i, 1) * SW + Math.sin(t * .8 + i) * 10 + t * 6) % SW) | 0, y = ((H(i, 2) * SH + t * (14 + H(i, 3) * 16)) % SH) | 0; g.fillStyle = H(i, 4) > .5 ? '#0a0808' : '#2a2626'; g.fillRect(x, y, 2, 2); } }
  if (F.crack) { g.strokeStyle = 'rgba(230,236,240,.75)'; g.lineWidth = 1; const cx = SW * .62, cy = 34; for (let i = 0; i < 9; i++) { let x = cx, y = cy, a = i / 9 * 6.28 + H(i, 1); g.beginPath(); g.moveTo(x, y); for (let s = 0; s < 6; s++) { a += (H(i, s + 2) - .5) * .9; const l = 6 + H(i, s + 9) * 14; x += Math.cos(a) * l; y += Math.sin(a) * l; g.lineTo(x | 0, y | 0); } g.stroke(); } g.fillStyle = 'rgba(255,255,255,.08)'; g.fillRect(cx - 6, cy - 6, 12, 12); }
  const ghosts = list.filter(a => ghIs(a.name) && a.alpha > .6 && !a.leaving), pres = ghosts.length && (dark || F.red);
  if (F.pulse || pres) { const beat = Math.max(0, Math.sin(t * 7.5)) ** 8 + Math.max(0, Math.sin(t * 7.5 - .9)) ** 8 * .6, A = (F.pulse ? .45 : .22) * (.55 + beat * .45); const gr = g.createRadialGradient(SW / 2, SH / 2, SH * .35, SW / 2, SH / 2, SW * .62); gr.addColorStop(0, 'rgba(90,0,0,0)'); gr.addColorStop(1, 'rgba(90,0,0,' + A + ')'); g.fillStyle = gr; g.fillRect(0, 0, SW, SH); if (pres && Math.random() < .006) STG.glitch = Math.max(STG.glitch || 0, .18); }
  if (F.water) { g.fillStyle = 'rgba(20,60,90,.35)'; g.fillRect(0, 0, SW, SH); const T = STG.wt || (STG.wt = mk(SW, SH)), tg = T.getContext('2d'); tg.clearRect(0, 0, SW, SH); tg.drawImage(g.canvas, 0, 0); for (let y = 0; y < SH; y += 4) g.drawImage(T, 0, y, SW, 4, Math.round(Math.sin(y * .12 + t * 3) * 2), y, SW, 4); g.fillStyle = 'rgba(200,230,240,.5)'; for (let i = 0; i < 14; i++) { const x = (H(i, 1) * SW) | 0, y = SH - ((t * (16 + H(i, 2) * 20) + H(i, 3) * SH) % SH); g.fillRect(x + Math.round(Math.sin(t * 4 + i) * 2), y | 0, 2, 2); } }
  if (F.lightning) { STG.ltT = (STG.ltT ?? 2) - 1 / 30; if (STG.ltT <= 0) { STG.ltT = 3 + Math.random() * 4; STG.flash = .9; sfx('boom'); } }
  if (F.chroma || STG.glitch > .3) { const T = STG.ct || (STG.ct = mk(SW, SH)), tg = T.getContext('2d'); tg.clearRect(0, 0, SW, SH); tg.drawImage(g.canvas, 0, 0); g.globalCompositeOperation = 'lighter'; g.globalAlpha = .16; g.drawImage(T, 2, 0); g.drawImage(T, -2, 1); g.globalAlpha = 1; g.globalCompositeOperation = 'source-over'; } }
/* 镜头推近某个人（^zoom 名字 [倍数] / ^zoom off） */
function stZoom(full, g) { STG.zoomT = null; const Z = STG.zoom; if (!Z) return; Z.z += (Z.k - Z.z) * .14; const a = stFind(Z.n), pr = !a && STG.props[Z.n], ax = a ? a.x : pr ? pr[1] * 16 + 8 : SW / 2, ay = a ? FEET - (GHOST_OF[Z.n] ? GH[GHOST_OF[Z.n][0]].h * .7 : 18) : pr ? pr[2] * 16 + 7 : SH / 2;
  const T = STG.zt || (STG.zt = mk(SW, SH)), tg = T.getContext('2d'); tg.clearRect(0, 0, SW, SH); tg.drawImage(full, 0, 0); const w = SW / Z.z, h = SH / Z.z, sx = clamp(ax - w / 2, 0, SW - w), sy = clamp(ay - h / 2, 0, SH - h);
  g.imageSmoothingEnabled = false; g.drawImage(T, sx, sy, w, h, 0, 0, SW, SH); STG.zoomX = (ax - sx) * Z.z; STG.zoomT = { sx, sy, z: SW / w }; }

/* ================= 新道具：墙里的脸、吊着的布偶、血字、三个人的合影 ================= */
Object.assign(SPR, {
  wallface(g, e, t, R) { const k = Math.sin(t * .9) * .5 + .5; R(3, 1, 10, 13, 'rgba(0,0,0,.25)'); R(4, 2, 8, 11, '#8a7e72'); R(5, 3, 6, 9, '#a49688'); R(5, 5, 2, 2, '#1a1412'); R(9, 5, 2, 2, '#1a1412'); R(6, 9, 4, 2 + Math.round(k), '#2a1612'); R(4, 1, 1, 13, '#6a6058'); R(11, 1, 1, 13, '#6a6058'); R(2, 13, 2, 1, '#6a6058'); R(12, 0, 2, 1, '#6a6058'); },
  hangdoll(g, e, t, R) { const s = Math.round(Math.sin(t * 1.3) * 2); R(8, -16, 1, 18 + 0, '#8a7a5a'); R(5 + s, 2, 6, 6, e.col || '#d8c8b0'); R(4 + s, 1, 2, 2, e.col || '#d8c8b0'); R(10 + s, 1, 2, 2, e.col || '#d8c8b0'); R(6 + s, 4, 1, 1, '#111'); R(9 + s, 4, 1, 1, '#a00'); R(4 + s, 8, 8, 6, e.col || '#d8c8b0'); R(5 + s, 14, 2, 3, '#b8a890'); R(9 + s, 14, 2, 3, '#b8a890'); R(7 + s, 9, 1, 5, '#8a1010'); },
  scrawl(g, e, t, R) { const x = e.x * 16, y = e.y * 16; g.save(); g.font = (e.size || 10) + 'px serif'; g.fillStyle = e.col || '#7a0a0a'; g.globalAlpha = .9; g.fillText(e.t || '救我', x, y + 11); g.globalAlpha = 1; g.fillStyle = e.col || '#7a0a0a'; const n = (e.t || '救我').length; for (let i = 0; i < n * 2; i++) g.fillRect(x + 2 + i * (e.size || 10) / 2, y + 11, 1, 2 + (hash(i, 3, 5) * 9 | 0)); g.restore(); },
  famphoto(g, e, t, R) { R(1, 0, 14, 12, '#3a2a1a'); R(2, 1, 12, 10, '#d8d0c0'); for (let i = 0; i < 3; i++) { const x = 3 + i * 4; R(x, 3, 2, 2, '#c8a890'); R(x, 2, 2, 1, '#2a2020'); R(x - (i === 2 ? 0 : 0), 5, 2, 4, ['#4a5a7a', '#8a3a4a', '#d8c8a0'][i]); } if (e.cross) { R(10, 2, 4, 1, '#000'); R(11, 1, 1, 9, '#7a0a0a'); R(13, 1, 1, 9, '#7a0a0a'); } if (e.four) { R(13, 6, 1, 4, '#1a1a1a'); R(13, 5, 1, 1, '#e8e0d0'); } },
  bloodpool(g, e, t, R) { R(1, 11, 14, 4, '#5a0606'); R(3, 10, 9, 2, '#6a0808'); R(4, 12, 4, 1, '#8a1010'); }
});
/* 墙上和地上的脏污、裂缝、霉斑（grime 1–3），画进背景缓存 */
function stGrime(g, n, key) { const H = (i, k) => hash(i, k, key.length * 7);
  for (let i = 0; i < 6 * n; i++) { const x = (H(i, 1) * SW) | 0, y = (6 + H(i, 2) * 34) | 0, w = (4 + H(i, 3) * 16) | 0, h = (3 + H(i, 4) * 10) | 0; g.fillStyle = 'rgba(20,14,8,' + (.12 + H(i, 5) * .18) + ')'; g.fillRect(x, y, w, h); g.fillRect(x + (w / 3 | 0), y + h, 2, (H(i, 6) * 10) | 0); }
  for (let i = 0; i < 3 * n; i++) { let x = (H(i, 7) * SW) | 0, y = (2 + H(i, 8) * 20) | 0; g.fillStyle = 'rgba(0,0,0,.45)'; for (let s = 0; s < 8; s++) { g.fillRect(x, y, 1, 2); x += Math.round((H(i, s + 9) - .5) * 3); y += 2; } }
  for (let i = 0; i < 4 * n; i++) { g.fillStyle = 'rgba(10,8,4,' + (.1 + H(i, 20) * .15) + ')'; g.fillRect((H(i, 21) * SW) | 0, (52 + H(i, 22) * 56) | 0, (6 + H(i, 23) * 22) | 0, (2 + H(i, 24) * 4) | 0); }
  if (n >= 2) for (let i = 0; i < n; i++) { const x = (20 + H(i, 30) * (SW - 40)) | 0, y = (14 + H(i, 31) * 20) | 0; g.fillStyle = 'rgba(100,6,6,.75)'; g.fillRect(x, y, 3, 4); g.fillRect(x - 1, y - 2, 1, 3); g.fillRect(x + 1, y - 3, 1, 3); g.fillRect(x + 3, y - 2, 1, 3); g.fillRect(x + 1, y + 4, 1, 4 + (H(i, 32) * 8 | 0)); }
  if (n >= 3) { g.fillStyle = 'rgba(90,4,4,.55)'; for (let i = 0; i < 3; i++) { const x = (H(i, 40) * SW) | 0; g.fillRect(x, 60 + (H(i, 41) * 30 | 0), 18 + (H(i, 42) * 20 | 0), 2); g.fillRect(x + 4, 62 + (H(i, 41) * 30 | 0), 10, 1); } } }

/* ================= 按剧情地点细化的布景 ================= */
Object.assign(STAGES, {
  /* 员工休息室：储物柜、旧沙发、桌上一部黑色手机、监控屏、恐怖屋海报 */
  staffroom: { wall: 'plain', floor: 'wood', grime: 1, props: [['locker', 1, 3], ['locker', 2, 3], ['poster', 4, 1, { col: '#5a1a1a' }], ['sofa', 5, 4], ['table', 9, 4], ['phone', 9, 3], ['wallclock', 9, 1], ['tv', 12, 2, { power: 'static' }], ['desk', 12, 3], ['window', 15, 1], ['lamp', 17, 3], ['doll', 18, 4, { col: '#b8a080' }]] },
  /* 平安公寓 208：发霉起皮的墙、破窗、旧床、墙上划痕和血手印 */
  apt208: { wall: 'paper', floor: 'darkwood', grime: 3, props: [['curtain', 3, 1], ['window', 4, 1], ['wardrobe', 1, 3], ['table', 7, 4], ['chair', 6, 4], ['mirror', 10, 1], ['bed', 14, 3, { col: '#5a4a44' }], ['newspaper', 10, 5], ['handprint', 16, 1], ['door', 18, 2, { col: '#3a2a20' }]],
    paint(g) { SPR.scrawl(g, { x: 12, y: 1, t: '五', col: '#4a0606', size: 9 }, 0, () => {}); } },
  /* 海明公寓 303：三个人的家——三把椅子、三副碗筷、全家福，镜子 */
  apt303: { wall: 'paper', floor: 'wood', grime: 1, props: [['sofa', 1, 4], ['tv', 2, 2], ['famphoto', 7, 1], ['table', 8, 4], ['chair', 7, 4], ['chair', 9, 4], ['cup', 7, 4], ['cup', 8, 4], ['cup', 9, 4], ['wallclock', 11, 1], ['mirror', 14, 1], ['shoes', 12, 5, { col: '#3a3a40' }], ['shoes', 13, 5, { col: '#6a3a4a' }], ['shoes', 14, 5, { col: '#c8b8a0' }], ['door', 17, 2], ['lamp', 5, 3]] },
  /* 浴室：浴缸、裂开的镜子、瓷砖缝发黑 */
  bathroom: { wall: 'tile', floor: 'tile', grime: 2, props: [['mirror', 10, 1], ['sink', 10, 3], ['bathtub', 13, 4], ['toilet', 4, 3], ['towel', 6, 2], ['puddle', 12, 5], ['door', 1, 2]] },
  /* 西城体育器材室：垫子、球筐、带铁栏的窗，柜子后面一张单人床 */
  storage: { wall: 'concrete', floor: 'concrete', grime: 2, props: [['shelf', 1, 3], ['shelf', 2, 3], ['basket', 4, 4], ['futon', 5, 5, { col: '#3a5a3a' }], ['box', 7, 4], ['crate', 8, 3], ['window', 13, 1], ['locker', 16, 3], ['locker', 17, 3], ['locker', 18, 3]],
    paint(g) { g.fillStyle = '#2a2a2a'; for (let i = 0; i < 4; i++) g.fillRect(13 * 16 + 4 + i * 3, 18, 1, 9); } },
  /* 院长办公室：书柜、档案、一张眼睛会动的旧画像、拉死的红窗帘 */
  deanroom: { wall: 'paper', floor: 'darkwood', grime: 2, props: [['bookshelf', 1, 3], ['bookshelf', 2, 3], ['cabinet', 4, 3], ['portrait', 8, 1, { eyes: 1 }], ['wallclock', 12, 1], ['curtain', 15, 1], ['curtain', 16, 1], ['stain', 6, 5], ['plant', 18, 3]] },
  /* 门后的三号病房：红色的世界，三张床，铁笼，墙上全是手印 */
  sickroom: { wall: 'red', floor: 'redfloor', red: 1, grime: 3, props: [['bed', 2, 3, { col: '#6a0a0a' }], ['bed', 6, 3, { col: '#5a0808' }], ['wheelchair', 10, 4], ['curtain', 12, 1], ['handprint', 5, 1], ['handprint', 8, 2], ['handprint', 16, 1], ['cage', 17, 4]] },
  /* 后山的深井：雨里，荒草，一口封着的井 */
  wellyard: { out: 1, floor: 'dirt', back: 'woods', tiles: [['tree', 0, 3], ['tree', 1, 5], ['pine', 18, 3], ['tree', 19, 5], ['bushes', 3, 6], ['reeds', 15, 6]], props: [['well', 10, 4], ['rope', 12, 5], ['gravestone', 16, 3], ['paper', 7, 5]] },
  /* 最后一间教室：一排排课桌，黑板上没擦掉的字 */
  lastclass: { wall: 'school', floor: 'wood', grime: 2, props: [['blackboard', 9, 1, { text: 1 }], ['schooldesk', 3, 4], ['schooldesk', 5, 4], ['schooldesk', 7, 4], ['schooldesk', 11, 4], ['schooldesk', 13, 4], ['schooldesk', 15, 4], ['schooldesk', 3, 6], ['schooldesk', 5, 6], ['schooldesk', 13, 6], ['schooldesk', 15, 6], ['wallclock', 16, 1], ['window', 2, 1]],
    paint(g) { SPR.scrawl(g, { x: 5, y: 1, t: '回不去', col: '#5a0606', size: 8 }, 0, () => {}); } }
});
/* 已有的布景再加些细节 */
STAGES.hut.props.push(['linen', 3, 4], ['knife', 6, 5], ['handprint', 12, 1], ['stain', 9, 5], ['photo', 16, 4]); STAGES.hut.grime = 3; STAGES.hut.paint = g => SPR.scrawl(g, { x: 2, y: 1, t: '救我', size: 10 }, 0, () => {});
STAGES.burnt.props.push(['hangdoll', 14, 2], ['wallface', 19, 1]); STAGES.burnt.grime = 3;
STAGES.attic.props.push(['mannequin', 15, 3], ['mannequin', 16, 3], ['box', 9, 4], ['hangdoll', 6, 2, { col: '#a89880' }]); STAGES.attic.grime = 2;
STAGES.wardhall.grime = 3; STAGES.wardhall.props.push(['wheelchair', 9, 4], ['handprint', 5, 1], ['handprint', 14, 2]);
STAGES.doorhall.grime = 3; STAGES.laundry.grime = 3; STAGES.laundry.props.push(['stain', 8, 5], ['handprint', 9, 1]);
STAGES.toilet.grime = 2; STAGES.wc.grime = 1; STAGES.dorm.grime = 2; STAGES.classroom.grime = 1; STAGES.corridor.grime = 1; STAGES.parking.grime = 2; STAGES.inside.grime = 3; STAGES.prop.grime = 1; STAGES.hall.grime = 1;
Object.assign(STAGE_PLACE, { hh_rest: 'staffroom', pa_208: 'apt208', hm_303: 'apt303', xc_office: 'storage', kf_dean: 'deanroom', kf_in3: 'sickroom', my_last: 'lastclass' });
/* 影子：没有脸的黑色人形，只有两点白（镜头里、身后、楼梯底下“多出来的那个人”） */
Object.assign(GHOST_OF, { 影子: ['shadow'], 人影: ['shadow'] });
PPL.影子 = PPL.人影 = P_({ sil: '#060508', ghost: 1 });
