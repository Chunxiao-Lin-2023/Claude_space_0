/* ================= 恐怖屋的怪物（从 kongbuwu/src/53_zmonsters.js 搬来，和小剧场里是同一套造型） =================
   在夜晚任务里当道具精灵用：spr: 'gh_redwoman' 等；参数写在 e.s.o（例如 { s: { o: { tilt: 5 } } }）。鬼一般 solid:false，自带一圈冷光。 */
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

for (const k in GH) SPR['gh_' + k] = function (g, e, t, R) {
  const G = GH[k], flip = e.dir === 1, ox = 8 - G.w / 2, oy = 16 - G.h;
  const o = Object.assign({ dir: e.dir, moving: !!e.mv, talk: false }, (e.s && e.s.o) || {});
  const tw = Math.sin(t * 2.3 + (e.px || 0) * .37) > .95, b0 = (hash(Math.floor(t * 8), e.px | 0, 3) * G.h) | 0, sh = tw ? (Math.random() < .5 ? -2 : 2) : 0;
  G.draw((x, y, w, h, c) => { if (!c) return; const X = flip ? G.w - x - w : x; R(X + ox + (tw && y >= b0 && y < b0 + 7 ? sh : 0), y + oy, w, h, c); }, t, o);
};
