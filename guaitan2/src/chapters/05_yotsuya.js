/* ================= 第五夜 · 四谷怪谈 ================= */
(() => {
  /* ---------------- 常量 ---------------- */
  const KN = ['', '壱', '弐', '参', '四', '五'];          // 灯座上的粉笔号 / 第几
  /* 浪宅四盏行灯（从左=下手到右=上手）。正确的粉笔号从上手数起是 壱弐参四，即从左到右 四参弐壱；
     她那盏（f.h1，每局随机）写的是「把上手当成左边」时的号 h+1——只有知道上手在右边才认得出 */
  const lampNum = (i, h) => i === h ? h + 1 : 4 - i;
  const PX = [9, 18, 27];                                 // 隐亡堀三块门板的 x
  const RAT_SPD = 2.75;
  const DONOR = ['四谷灯笼座 一同', '三河屋', '左门町町会', '若竹会', '大道具 源吉'];
  const DIED = { taku: 0, hori: 0, inari: 0 };            // 本局各幕死过几次（只影响提示，不随检查点回滚）
  let HOLD = 0, sqT = 0;                                  // 被头发绊住的剩余秒数；鼠群叫声节拍（主机本地）

  /* ---------------- 合成音（S.tone，双方都听得到） ---------------- */
  const TONE = {
    /* 拍子木：两块硬木对敲「梆」 */
    hyoshigi(S, n = 2, gap = .3) { for (let i = 0; i < n; i++) { const t = i * gap * (n > 3 ? Math.max(.45, 1 - i * .12) : 1) + (n > 3 ? i * .02 : 0); S.tone('square', 2600, 1700, .035, .1, t, 3400); S.tone('triangle', 1250, 1050, .07, .14, t, 2600); } },
    /* 鬼魂出场的「ヒュー、ドロドロ」：笛子滑音 + 低低的大鼓连击 */
    doro(S) { S.tone('sine', 1500, 960, 1.4, .045, 0, 5000); S.tone('triangle', 1520, 980, 1.4, .02, .02, 3000); for (let i = 0; i < 18; i++) S.tone('sine', 64, 46, .14, .17 - i * .004, .25 + i * .085, 280); },
    /* 梳子刮过头发：高频的嚓嚓声 */
    comb(S, n = 3) { for (let i = 0; i < n; i++) { const t = i * .62; S.tone('sawtooth', 5400, 2300, .17, .02, t, 6400); S.tone('square', 3300, 1600, .13, .012, t + .04, 4400); S.tone('sine', 180, 120, .2, .02, t + .12, 500); } },
    /* 老鼠：短促上滑的尖叫 */
    squeak(S, n = 3) { for (let i = 0; i < n; i++) S.tone('sine', 2800 + (i % 3) * 350, 4300, .05, .04, i * .1 + (i % 2) * .04); },
    /* 稻荷社的铃 */
    bell(S) { [1760, 2350, 3130, 4010].forEach((f, i) => S.tone('sine', f, f * .996, 1.7 - i * .3, .05 - i * .01, i * .012)); },
    /* 本钓钟「当——」（芝居里的「时の鐘」） */
    kane(S) { S.tone('sine', 98, 96, 3.6, .14, 0, 600); S.tone('sine', 196, 193, 2.6, .05, 0, 900); S.tone('sine', 293, 290, 1.6, .02, 0, 1200); },
    /* 撕蚊帐 */
    tear(S) { for (let i = 0; i < 7; i++) S.tone('sawtooth', 900 - i * 60, 300, .06, .03, i * .05, 2400); }
  };

  /* ---------------- 惊吓大头像 ---------------- */
  const FACES = {
    /* 阿岩：稀疏的长发和秃斑、灰白的脸、左眼上肿起的紫色肉瘤把眼睛压得垂下来、涂黑的牙（铁浆）、发间的玳瑁梳 */
    oiwa(R, a) {
      const H = '#120a0e', HL = '#3a2a34', SK = '#d8d2c4', SK2 = '#b0a898', SW = '#7a4a68', SW2 = '#4a2440', K = '#2a1a20', WH = '#f0ece0';
      R(6, 2, 20, 4, H); R(4, 6, 24, 26, H); R(2, 14, 28, 18, H);
      R(9, 2, 3, 2, SK2); R(16, 1, 4, 2, SK2); R(21, 3, 3, 2, SK2); R(12, 4, 2, 1, SK2);
      R(9, 6, 14, 16, SK); R(10, 22, 12, 4, SK); R(12, 26, 8, 2, SK); R(20, 7, 3, 15, SK2);
      R(9, 6, 2, 12, H); R(22, 6, 1, 14, H); R(13, 5, 1, 5, H); R(16, 5, 1, 3, H);
      const w = a < .15 ? 1 : 3;
      R(11, 12, 5, 4, K); R(12, 13 - (w >> 1), 3, w, WH); R(13, 13, 1, 1, '#300');
      R(17, 9, 6, 7, SW); R(18, 8, 4, 1, SW); R(23, 11, 1, 4, SW2); R(17, 16, 5, 3, SW2); R(19, 14, 2, 3, '#2a0e20'); R(20, 15, 1, 1, '#e8e0d0'); R(18, 10, 2, 1, '#9a6a88');
      R(15, 17, 2, 2, SK2);
      const mh = 1 + Math.round(a * 3);
      R(13, 21, 7, mh + 1, '#3a1418'); R(14, 21, 5, mh, '#141010'); R(13, 22 + mh, 7, 1, SK2);
      for (let i = 0; i < 5; i++) { const y = 4 + ((a * 30 + i * 7) % 26); R(6 + i * 5, y, 1, 4, HL); }
      R(19, 4, 7, 2, '#a8702a'); R(19, 6, 7, 1, '#6a3a12'); R(20, 4, 1, 1, '#e8c070');
    },
    /* 提灯お岩：灯笼纸面从中间裂开，裂缝里是她的脸，底下垂出头发 */
    lantern(R, a) {
      const P = '#eedcaa', P2 = '#c8b480', K = '#120a0c';
      R(10, 0, 12, 3, '#2a1a10'); R(9, 29, 14, 3, '#2a1a10'); R(15, -1, 2, 2, '#2a1a10');
      R(6, 3, 20, 26, P); R(4, 6, 24, 20, P); R(4, 6, 2, 20, P2); R(26, 6, 2, 20, P2);
      for (let y = 6; y < 28; y += 3) R(4, y, 24, 1, P2);
      R(4, 18, 24, 3, '#b02a20');
      const o = 2 + Math.round(a * 4);
      R(16 - o, 7, o * 2, 20, K); R(16 - o - 1, 9, 1, 16, '#8a6a40'); R(16 + o, 9, 1, 16, '#8a6a40');
      R(13, 10, 6, 5, '#d8d2c4'); R(12, 10, 1, 4, K); R(19, 10, 1, 4, K);
      R(16, 9, 4, 5, '#7a4a68'); R(17, 13, 2, 2, '#2a0e20'); R(17, 14, 1, 1, '#e8e0d0');
      R(13, 11, 2, 1, '#f0ece0'); R(14, 11, 1, 1, '#300');
      R(14, 17, 4, 2, '#d8d2c4'); R(14, 17, 4, 1, '#141010');
      for (let i = 0; i < 6; i++) R(11 + i * 2, 27, 1, 3 + ((i * 3) % 4) + Math.round(a * 3), '#120a0e');
      R(10, 4, 12, 1, 'rgba(255,240,180,.7)');
    },
    /* 缠上来的头发：满屏的黑发，缝里一只眼睛 */
    kami(R, a) {
      R(0, 0, 32, 32, '#0a0608');
      for (let i = 0; i < 46; i++) { const x = (i * 7 + (i >> 2)) % 32, l = 8 + ((i * 13) % 20); R(x, ((i * 5) % 10) - 4, 1, l + Math.round(a * 12), i % 3 ? '#2a1a22' : '#1a1016'); }
      const ex = 17, ey = 15, op = a < .2 ? 0 : 1;
      R(ex - 4, ey - 2, 9, 5, '#0a0608'); R(ex - 3, ey - op, 7, 1 + op, '#e8e4d8'); R(ex, ey - op, 1, 1 + op, '#300'); R(ex - 2, ey - 2, 5, 1, '#7a4a68');
      for (let i = 0; i < 6; i++) R(ex - 5 + i * 2, ey - 3, 1, 8, '#1a1016');
    }
  };

  /* ---------------- 人物 ---------------- */
  function mkIemon(n) {
    return {
      key: 'yt-iemon' + n, skin: '#e8c0a0', hair: '#141010', hs: 'messy', top: '#1e1e28', top2: '#d8d0c0', bottom: '#1e1e28', coat: true, shoes: '#3a2a1a',
      extra(g, d, fr, G, R) {
        if (d === 0) { R(11, G.tB - 4, 5, 1, '#2a1a10'); R(13, G.tB - 5, 1, 3, '#c9a35a'); }
        else if (d === 3) { R(0, G.tB - 4, 5, 1, '#2a1a10'); R(2, G.tB - 5, 1, 3, '#c9a35a'); }
        else { R(8, G.tB - 4, 7, 1, '#2a1a10'); R(9, G.tB - 5, 1, 3, '#c9a35a'); }
        R(4, G.tT + 3, 8, 1, '#3a3a4a');
        if (n >= 1) { R(4, G.lB, 8, 1, '#06040a'); R(3, G.lB - 2, 1, 3, '#06040a'); R(12, G.lB - 1, 1, 3, '#06040a'); R(2, G.lB + 1, 2, 1, '#06040a'); }
        if (n >= 2) { R(2, G.tT + 5, 2, 2, '#06040a'); R(1, G.tT + 6, 1, 6, '#06040a'); R(13, G.tT + 5, 2, 2, '#06040a'); R(14, G.tT + 6, 1, 5, '#06040a'); }
      }
    };
  }
  const GEN = { skin: '#d8a880', hair: '#bdbdb5', hs: 'short', top: '#2a3a5a', top2: '#e8e4d8', bottom: '#2a2a30', shoes: '#2a2018' };
  const PEOPLE5 = {
    me: { skin: '#f0c8a0', hair: '#1a1414', hs: 'short', top: '#2a3040', top2: '#4a5468', bottom: '#24242c', shoes: '#141414' },
    iemon0: mkIemon(0), iemon1: mkIemon(1), iemon2: mkIemon(2),
    gen: Object.assign({}, GEN, { key: 'yt-gen', extra(g, d, fr, G, R) { R(4, G.hT + 1, 8, 1, '#e8e4d8'); if (d === 0) { R(5, G.tT + 2, 1, 6, '#e8e4d8'); R(10, G.tT + 2, 1, 6, '#e8e4d8'); R(6, G.tT + 4, 2, 2, '#c03030'); } } }),
    /* 在你眼里，源叔长着她的脸 */
    gen_o: Object.assign({}, GEN, { key: 'yt-geno', skin: '#d0ccc0', hair: '#141014', hs: 'long', extra(g, d, fr, G, R) { if (d === 0) { R(8, G.hT + 3, 3, 3, '#7a4a68'); R(9, G.hT + 5, 1, 2, '#2a0e20'); R(7, G.hT + 6, 2, 1, '#141010'); R(5, G.tT + 2, 1, 6, '#e8e4d8'); } } }),
    oiwa: {
      key: 'yt-oiwa', skin: '#d6d2c6', hair: '#120c10', hs: 'long', top: '#ece8de', top2: '#c8c4b8', robe: true, ghost: true,
      extra(g, d, fr, G, R) {
        if (d === 0) { R(8, G.hT + 3, 3, 3, '#6e4466'); R(9, G.hT + 5, 1, 1, '#2a1a24'); R(5, G.hT, 2, 1, '#b8b0a4'); R(9, G.hT - 1, 2, 1, '#b8b0a4'); R(7, G.hT + 6, 2, 1, '#141014'); }
        else if (d === 3) { R(5, G.hT + 1, 2, 2, '#b8b0a4'); R(9, G.hT, 2, 1, '#b8b0a4'); }
        R(3, G.tB + 1, 1, 3, '#120c10'); R(12, G.tB, 1, 4, '#120c10');
      }
    },
    kurogo: {
      key: 'yt-kurogo', skin: '#0e0e12', hair: '#0e0e12', hs: 'short', top: '#101014', top2: '#101014', bottom: '#101014', shoes: '#0a0a0a', hat: 'hood', hatC: '#0c0c10',
      extra(g, d, fr, G, R) { if (d === 0) { R(4, G.hT + 1, 8, 8, '#18181c'); R(4, G.hT + 3, 8, 1, '#202026'); } }
    }
  };

  /* ---------------- 精灵 ---------------- */
  const SPR5 = {
    /* 楽屋的化妆镜台：一圈灯泡；e.ghost=1 镜中有人梳头，2 她转过来 */
    kyodai(g, e, t, R) {
      box(R, 0, 3, 16, 11, '#5a4430'); R(1, 5, 14, 1, '#7a5a40'); R(3, 7, 3, 2, '#d8c0a0'); R(10, 7, 2, 3, '#a04040'); R(7, 8, 2, 1, '#2a2a2a');
      box(R, 1, -13, 14, 15, '#3a2a20'); R(3, -11, 10, 11, '#4e5a66'); R(4, -10, 2, 6, 'rgba(220,230,255,.22)');
      for (let i = 0; i < 4; i++) { R(1, -12 + i * 4, 2, 2, i === 2 ? '#6a6050' : '#fff4c8'); R(13, -12 + i * 4, 2, 2, i === 1 ? '#6a6050' : '#fff4c8'); }
      if (e.ghost) {
        const c = '#e8e4dc', hb = '#120c10';
        R(5, -6, 6, 6, c); R(6, -9, 4, 4, e.ghost === 2 ? '#d8d2c4' : hb); R(5, -8, 1, 7, hb); R(10, -8, 1, 7, hb);
        if (e.ghost === 2) { R(6, -9, 4, 1, hb); R(8, -8, 2, 2, '#7a4a68'); R(6, -7, 1, 1, '#111'); } else { const k = (t * 1.6) % 1; R(9, -9 + k * 5, 2, 1, '#c89848'); }
        for (let i = 0; i < 2; i++) { const y = (t * 5 + i * 4) % 8; R(5 + i * 4, -3 + y, 1, 2, hb); }
      }
    },
    /* 衣桁：挂着阿岩那件洗白了的单衣 */
    ikou(g, e, t, R) { R(1, -12, 1, 26, '#3a2414'); R(14, -12, 1, 26, '#3a2414'); R(0, -13, 16, 2, '#4a2e1a'); R(2, -11, 12, 17, '#e4e0d4'); R(2, -11, 12, 1, '#c8c4b8'); R(7, -11, 2, 17, '#d0ccc0'); R(3, 1, 10, 5, '#c8c0aa'); R(4, 4, 3, 2, '#8a8070'); R(0, 12, 16, 2, '#3a2414'); },
    /* 化妆箱：白粉、眉墨、铁浆，最上面是左眼的肿包 */
    kesho(g, e, t, R) { box(R, 1, 4, 14, 10, '#6a3a24'); R(2, 6, 12, 1, '#8a5a3a'); R(7, 9, 2, 1, '#c9a35a'); R(3, 2, 4, 3, '#f0ece4'); R(8, 2, 3, 3, '#141010'); R(11, 1, 3, 3, '#8a5a78'); R(12, 1, 1, 1, '#b08aa0'); },
    /* 鬘：木头模子上的阿岩假发，前额稀疏 */
    katsura(g, e, t, R) { R(6, 6, 4, 8, '#5a3a24'); R(3, 12, 10, 2, '#4a2e1a'); R(4, -4, 8, 9, '#c8a880'); R(3, -6, 10, 3, '#120c10'); R(5, -6, 2, 1, '#c8a880'); R(9, -7, 2, 1, '#c8a880'); R(2, -3, 2, 13, '#120c10'); R(12, -3, 2, 12, '#120c10'); R(3, 9, 1, 3, '#120c10'); },
    /* 墙上贴的纸 */
    harigami(g, e, t, R) { R(3, 1, 10, 12, '#e8e2cc'); R(3, 1, 10, 1, '#c8c0a8'); for (let i = 0; i < 4; i++) R(5, 3 + i * 2, 6 - (i % 2) * 2, 1, '#3a3430'); R(5, 12, 1, 1, '#a02020'); },
    /* 楽屋稻荷：小神龛、一对瓷狐狸；lit = 上了香 */
    kamidana(g, e, t, R) {
      R(0, 6, 16, 2, '#6a4a2a'); R(1, 8, 1, 3, '#4a3018'); R(14, 8, 1, 3, '#4a3018');
      R(5, -1, 6, 7, '#c8a878'); R(4, -2, 8, 2, '#3a2818'); R(7, 1, 2, 4, '#2a1a10'); R(5, 0, 6, 1, '#c03030');
      R(1, 3, 3, 3, '#f0ece4'); R(2, 2, 1, 1, '#f0ece4'); R(12, 3, 3, 3, '#f0ece4'); R(13, 2, 1, 1, '#f0ece4'); R(1, 4, 1, 1, '#c03030'); R(14, 4, 1, 1, '#c03030');
      if (e.lit) { R(8, 5, 1, 1, '#ff8040'); R(8, 2 + Math.sin(t * 2) * 1, 1, 3, 'rgba(220,220,220,.45)'); }
    },
    hyoshigi(g, e, t, R) { box(R, 2, 8, 12, 6, '#5a4430'); R(3, 5, 4, 4, '#d8c49a'); R(8, 5, 4, 4, '#d8c49a'); R(3, 5, 4, 1, '#f0dcb0'); R(8, 5, 4, 1, '#f0dcb0'); R(6, 4, 3, 1, '#c03030'); },
    katanakake(g, e, t, R) { R(2, 10, 12, 4, '#2a1a10'); R(3, 0, 2, 11, '#2a1a10'); R(11, 0, 2, 11, '#2a1a10'); R(2, 1, 4, 2, '#3a2818'); R(10, 1, 4, 2, '#3a2818'); R(2, 6, 4, 2, '#3a2818'); R(10, 6, 4, 2, '#3a2818'); if (e.full) R(1, 1, 14, 1, '#141014'); },
    /* 定式幕：黑、柿、萌葱三色竖条；glow = 幕后亮了 */
    jmaku(g, e, t, R) {
      const C = ['#141414', '#9a4a22', '#1e5a3a'];
      for (let i = 0; i < 12; i++) R(i * 4, -2, 4, 16, C[i % 3]);
      for (let i = 0; i < 12; i++) R(i * 4, 12, 4, 2, shade(C[i % 3], -.3));
      R(0, -3, 48, 2, '#2a1a10');
      if (e.open) { R(0, -2, 48, 16, '#0a0806'); R(12, -2, 24, 16, 'rgba(255,200,120,.35)'); for (let i = 0; i < 3; i++) { R(i * 3, -2, 3, 16, C[i]); R(39 + i * 3, -2, 3, 16, C[i]); } R(0, -3, 48, 2, '#2a1a10'); return; }
      if (e.glow) { const a = .35 + .25 * Math.sin(t * 3); R(22, -2, 4, 16, `rgba(255,200,120,${a})`); R(18, 13, 12, 1, `rgba(255,200,120,${a})`); }
    },
    /* 举在肩头的手镜里看见的提灯（镜像排列）；e.num = 镜子里左数第几盏有脸 */
    mview(g, e, t, R) {
      const F = '#2a1a10', G = '#c9a35a';
      R(22, 2, 4, 16, F); R(23, 2, 2, 16, '#3a2818');
      R(4, -38, 40, 2, F); R(2, -36, 44, 30, F); R(4, -6, 40, 2, F); R(3, -37, 42, 1, G); R(3, -5, 42, 1, G);
      R(5, -35, 38, 28, '#1a2028'); R(6, -34, 8, 3, 'rgba(220,230,255,.18)');
      for (let k = 0; k < 5; k++) {
        const x = 8 + k * 7, face = k + 1 === e.num;
        R(x + 1, -30, 4, 1, '#1a1210'); R(x, -29, 6, 12, '#f0dcb0'); R(x, -24, 6, 2, '#b02a20'); R(x + 1, -17, 4, 1, '#1a1210');
        if (face) { const fl = Math.sin(t * 7) > -.4; R(x + 1, -28, 4, 10, '#120a0c'); if (fl) { R(x + 1, -27, 2, 2, '#d8d2c4'); R(x + 3, -27, 2, 2, '#7a4a68'); R(x + 2, -23, 2, 1, '#141010'); } }
      }
      R(5, -12, 38, 5, 'rgba(10,12,16,.6)'); R(18, -11, 12, 3, '#22202a');
    },
    /* 行灯：e.num 灯座上的粉笔号（画成竖道）；torn = 纸罩裂开 */
    andon(g, e, t, R) {
      R(3, 11, 10, 3, '#3a2616'); R(3, 13, 2, 2, '#2a1a10'); R(11, 13, 2, 2, '#2a1a10');
      R(3, -12, 1, 23, '#3a2616'); R(12, -12, 1, 23, '#3a2616'); R(3, -13, 10, 1, '#3a2616');
      const lit = !e.off;
      const pc = !lit ? '#6a6250' : '#f2dca0';
      R(4, -11, 8, 21, pc); R(4, -11, 8, 1, shade(pc, -.2)); R(4, -1, 8, 1, shade(pc, -.18)); R(7, -11, 1, 21, shade(pc, -.1));
      if (lit) R(5, -6, 6, 4, 'rgba(255,250,220,.5)');
      if (e.torn) { R(6, -10, 4, 19, '#140c08'); R(5, -8, 1, 3, '#140c08'); R(10, -4, 1, 3, '#140c08'); R(7, -7, 2, 2, '#d8d2c4'); R(8, -7, 1, 1, '#7a4a68'); }
      const n = e.num || 0; for (let i = 0; i < n; i++) R(5 + i * 2, 11, 1, 2, '#ece8dc');
    },
    /* 蚊帐（3 格宽）：萌黄的网、红边、四角吊环；who = 里面坐着人；down = 被扯下来了 */
    kaya(g, e, t, R) {
      if (e.down) { R(1, 8, 46, 6, '#4a6a3a'); R(1, 8, 46, 1, '#9a2a2a'); for (let x = 4; x < 46; x += 4) R(x, 9, 1, 5, '#3a5a2a'); R(30, 12, 3, 1, '#c8c0b0'); R(34, 13, 2, 1, '#c8c0b0'); return; }
      R(0, -16, 48, 30, 'rgba(110,170,90,.32)');
      for (let x = 3; x < 46; x += 3) R(x, -14, 1, 26, 'rgba(170,210,150,.16)');
      for (let y = -12; y < 12; y += 3) R(2, y, 44, 1, 'rgba(170,210,150,.14)');
      R(0, -16, 48, 2, '#9a2a2a'); R(0, 12, 48, 2, '#9a2a2a'); R(0, -16, 2, 30, '#9a2a2a'); R(46, -16, 2, 30, '#9a2a2a');
      R(-1, -18, 3, 3, '#c9a35a'); R(46, -18, 3, 3, '#c9a35a');
      if (e.who) { const c = 'rgba(16,12,18,.78)'; R(19, -3, 11, 13, c); R(21, -10, 7, 8, c); R(19, -9, 2, 14, c); R(28, -8, 2, 12, c); R(17, 2, 5, 4, c); }
    },
    /* 阿岩的镜台：黑漆小台、圆铜镜；ghost = 镜中梳头；hair = 台上掉的头发；comb = 梳子 */
    okyo(g, e, t, R) {
      box(R, 2, 4, 12, 10, '#1e1214'); R(3, 6, 10, 1, '#c9a35a'); R(7, 9, 2, 1, '#c9a35a');
      R(7, -5, 2, 10, '#2a1a14'); R(5, 3, 6, 1, '#2a1a14');
      R(3, -14, 10, 10, '#7a6a40'); R(4, -13, 8, 8, e.ghost ? '#3a3a40' : '#9a9068'); R(5, -12, 3, 2, 'rgba(255,255,230,.35)');
      if (e.ghost) {
        R(6, -12, 4, 6, '#d8d4c8'); R(5, -13, 6, 2, '#120c10'); R(5, -11, 1, 5, '#120c10'); R(10, -11, 1, 5, '#120c10'); R(8, -10, 2, 2, '#6a3a5a'); R(6, -10, 1, 1, '#111');
        const k = (t * 1.8) % 1; R(10, -13 + k * 7, 2, 1, '#c89848');
        for (let i = 0; i < 3; i++) { const y = (t * 6 + i * 5) % 10; R(4 + i * 3, -4 + y, 1, 2, '#140c10'); }
        R(12, 2, 2, 2, Math.sin(t * 9) > 0 ? '#ffd070' : '#e8a040');
      }
      if (e.comb) { R(4, 3, 6, 2, '#a86a2a'); R(10, 2, 3, 3, '#5a4a30'); }
      if (e.hair) { R(3, 4, 4, 1, '#140c10'); R(9, 5, 4, 1, '#140c10'); R(6, 3, 1, 3, '#140c10'); }
    },
    butsudan(g, e, t, R) { box(R, 1, -8, 14, 22, '#141012'); R(3, -6, 10, 12, '#2a1a10'); R(6, -5, 4, 6, '#c9a35a'); R(7, -4, 2, 4, '#3a2a18'); R(4, 7, 8, 1, '#c9a35a'); R(5, 9, 3, 2, '#f0ece4'); R(6, 8, 1, 1, '#e8e4dc'); R(9, 9, 3, 2, '#5a4a3a'); },
    byobu(g, e, t, R) { for (let i = 0; i < 2; i++) { box(R, i * 16, -10, 16, 24, '#3a2414'); R(i * 16 + 2, -8, 12, 20, '#c8a85a'); R(i * 16 + 4, 2, 1, 9, '#5a6a3a'); R(i * 16 + 8, 0, 1, 11, '#5a6a3a'); R(i * 16 + 11, 4, 1, 7, '#5a6a3a'); R(i * 16 + 3, 1, 3, 1, '#a04030'); } R(15, -10, 2, 24, '#2a1a10'); },
    yurikago(g, e, t, R) { R(2, 6, 12, 8, '#8a6a3a'); R(1, 5, 14, 2, '#a07a48'); for (let x = 3; x < 14; x += 2) R(x, 7, 1, 6, '#6a4a28'); R(3, 7, 10, 3, '#d8c8b0'); R(5, 7, 4, 2, '#e8dcc8'); },
    /* 跑来跑去的老鼠（装饰） */
    rat(g, e, t, R) { const k = Math.sin(t * 1.3 + e.px) > .6 ? ((t * 30) | 0) % 2 : 0; R(5 + k, 10, 5, 3, '#4a4446'); R(9 + k, 10, 2, 2, '#5a5456'); R(10 + k, 10, 1, 1, '#ff4040'); R(2 + k, 12, 3, 1, '#6a5a5a'); },
    /* 隐亡堀的门板（浮在水上）；cold = 是她（玩家走近时水面结霜）；sunk = 沉下去了 */
    toita(g, e, t, R) {
      if (e.sunk) { const k = (t * 1.2) % 1; R(8 - k * 8, 6, k * 16, 1, `rgba(180,200,220,${.4 - k * .35})`); R(3, 10, 10, 1, 'rgba(180,200,220,.18)'); return; }
      const b = Math.round(Math.sin(t * 1.6 + e.px * .05));
      R(-5, 13, 26, 2, 'rgba(10,20,30,.5)');
      box(R, -4, 1 + b, 24, 13, '#6a5640'); for (let x = -2; x < 20; x += 5) R(x, 2 + b, 1, 11, '#5a4834');
      R(-2, 3 + b, 20, 9, '#8a7a50'); for (let y = 4; y < 12; y += 2) R(-2, y + b, 20, 1, '#7a6a42');
      R(-3, 5 + b, 3, 1, '#120c10'); R(-5, 6 + b, 2, 5, '#120c10'); R(-6, 9 + b, 1, 4, '#120c10');
      R(18, 8 + b, 3, 2, '#c8b898');
      if (e.cold && W && W.pl && W.mapId === 'hori') {
        const d = Math.abs(W.pl.x - (e.x ?? 0)) + Math.abs(W.pl.y - 4);
        if (d <= 3) { for (let i = 0; i < 12; i++) { const fx = (hash(i, 3, 7) * 32 - 8) | 0, fy = (hash(i, 4, 7) * 5) | 0; R(fx, 13 + fy, 2, 1, `rgba(230,240,255,${.45 + .3 * Math.sin(t * 3 + i)})`); } R(-7, 14, 30, 1, 'rgba(220,235,255,.4)'); R(-6, 0, 28, 1, 'rgba(220,235,255,.25)'); }
      }
    },
    kui(g, e, t, R) { R(6, 0, 4, 14, '#4a3a2a'); R(6, 0, 4, 1, '#6a5a44'); R(10, 6, 6, 1, '#8a7a5a'); },
    /* 柳树：枝条一直垂下来 */
    yanagi(g, e, t, R) {
      R(6, -2, 4, 16, '#3a2a1a'); R(0, -18, 16, 8, '#1e3020');
      for (let i = 0; i < 9; i++) { const sw = Math.round(Math.sin(t * .9 + i) * 1.2); R(-2 + i * 2.4 + sw, -12, 1, 14 + (i % 3) * 4, i % 2 ? '#2e4a30' : '#3a5a38'); }
    },
    /* 鼠群 */
    rats(g, e, t, R) {
      for (let i = 0; i < 9; i++) { const ox = (hash(i, 1, 5) * 22 - 4) | 0, oy = (hash(i, 2, 5) * 12) | 0, w = Math.sin(t * 22 + i * 1.7) > 0 ? 1 : 0; R(ox + w, oy + 4, 5, 3, '#4a4446'); R(ox + 4 + w, oy + 4, 2, 2, '#5a5456'); R(ox + 5 + w, oy + 4, 1, 1, '#ff4040'); R(ox - 2 + w, oy + 6, 3, 1, '#6a5a5a'); }
    },
    tsurizao(g, e, t, R) { R(2, 12, 1, 2, '#3a2a1a'); for (let i = 0; i < 12; i++) R(2 + i, 12 - i, 1, 1, '#6a5030'); R(14, 0, 1, 1, '#6a5030'); R(14, 1, 1, 9, 'rgba(220,220,220,.35)'); },
    bridge(g, e, t, R) { R(0, -2, 16, 36, '#4a3a2a'); for (let y = 0; y < 32; y += 4) R(0, y, 16, 1, '#2e2418'); R(0, -2, 2, 36, '#2a1e14'); R(14, -2, 2, 36, '#2a1e14'); },
    /* 献纳提灯：face = 纸面裂开露出她的脸 */
    chochin(g, e, t, R) {
      R(-1, -15, 18, 1, '#3a2818'); R(7, -14, 2, 3, '#2a1a10');
      R(4, -11, 8, 2, '#1a1210'); R(4, 8, 8, 2, '#1a1210');
      const lit = !e.off, c = lit ? '#f4e2b8' : '#7a7262';
      R(3, -9, 10, 17, c); R(2, -7, 12, 13, c); for (let y = -8; y < 8; y += 3) R(2, y, 12, 1, shade(c, -.12));
      R(2, -2, 12, 3, lit ? '#b02a20' : '#5a2a20');
      R(6, -7, 4, 1, '#2a2020'); R(7, -6, 2, 3, '#2a2020'); R(6, 3, 4, 1, '#2a2020'); R(7, 4, 2, 2, '#2a2020');
      if (lit) R(4, -6, 3, 6, 'rgba(255,250,220,.35)');
      if (e.face) { R(5, -8, 6, 16, '#120a0c'); R(6, -5, 3, 3, '#d8d2c4'); R(8, -6, 3, 4, '#7a4a68'); R(6, 1, 4, 2, '#d8d2c4'); R(7, 1, 2, 1, '#141010'); for (let i = 0; i < 3; i++) R(6 + i * 2, 9, 1, 3 + i, '#120a0e'); }
    },
    ogami(g, e, t, R) { R(2, 5, 12, 8, '#5a5854'); R(3, 5, 10, 1, '#7a7874'); R(4, 7, 3, 1, '#6a6864'); R(2, 12, 12, 1, '#3a3836'); },
    kitsune(g, e, t, R) {
      const m = e.flip ? -1 : 1, X = x => (e.flip ? 15 - x : x);
      R(3, 8, 10, 6, '#7a7874'); R(3, 8, 10, 1, '#9a9894');
      R(5, -2, 6, 10, '#e8e6e0'); R(Math.min(X(4), X(7)), -6, 4, 5, '#e8e6e0'); R(X(4), -8, 1, 2, '#e8e6e0'); R(X(7), -8, 1, 2, '#e8e6e0');
      R(X(5), -4, 1, 1, '#a02020'); R(5, 1, 6, 3, '#b02a20'); R(X(11), 0, 2, 6, '#e8e6e0'); void m;
    },
    ema(g, e, t, R) { R(1, -6, 2, 20, '#4a3420'); R(29, -6, 2, 20, '#4a3420'); R(0, -7, 32, 2, '#3a2818'); R(2, 0, 28, 1, '#3a2818'); for (let i = 0; i < 6; i++) { R(3 + i * 5, 1, 4, 4, '#d8c49a'); R(3 + i * 5, 1, 4, 1, '#b8a47a'); R(4 + i * 5, 3, 2, 1, i === 4 ? '#a02020' : '#3a3430'); } for (let i = 0; i < 5; i++) { R(5 + i * 5, -5, 4, 4, '#d8c49a'); R(6 + i * 5, -3, 2, 1, '#3a3430'); } },
    yuisho(g, e, t, R) { R(3, 4, 2, 10, '#3a2818'); R(11, 4, 2, 10, '#3a2818'); box(R, 0, -9, 16, 14, '#4a3420'); R(2, -7, 12, 10, '#d8ccaa'); for (let i = 0; i < 4; i++) R(4 + i * 2.5, -6, 1, 8, '#3a3430'); },
    chozu(g, e, t, R) { box(R, 1, 4, 14, 10, '#6a6864'); R(3, 5, 10, 4, '#1e3a4a'); R(4, 6, 3, 1, 'rgba(200,220,240,.4)'); R(9, 7, 2, 2, '#c8a030'); R(12, 1, 1, 5, '#8a6a3a'); R(10, 1, 4, 1, '#8a6a3a'); }
  };

  const LAMPL = { r: 2.5, col: 'rgba(255,190,110,.2)', dy: -2 };

  defChapter({
    id: 'yotsuya', n: 5, title: '四谷怪谈', sub: '首演前夜的剧场。行灯、门板、提灯——有一件不是道具，是她。', origin: '江户怪谈·鹤屋南北（1825）', color: '#3a2440',
    amb: 'room', floor: 'wood', wall: 'wood', dark: .6, plr: 3.2,
    endings: { inari: '第五夜　完', iemon: '成了伊右卫门', kushi: '梳子还在你手里' },
    thumb(g, w, h) {
      const s = Math.max(2, Math.floor(h / 42)), ox = Math.round(w / 2 - 16 * s), oy = Math.round((h - 22) / 2 - 16 * s);
      const gr = g.createRadialGradient(w / 2, oy + 16 * s, 2, w / 2, oy + 16 * s, 22 * s); gr.addColorStop(0, 'rgba(255,190,110,.35)'); gr.addColorStop(1, 'rgba(255,190,110,0)'); g.fillStyle = gr; g.fillRect(0, 0, w, h);
      FACES.lantern((x, y, ww, hh, c) => { g.fillStyle = c; g.fillRect(ox + x * s, oy + y * s, ww * s, hh * s); }, .6);
    },
    people: PEOPLE5,
    faces: FACES,
    items: {
      kushi: { name: '玳瑁梳子', desc: '玳瑁的，齿很密，梳背上描着一枝金色的秋草。座长从古董市淘来的「江户真货」。拿在手里，总是温的。' },
      kagami: { name: '带柄手镜', desc: '黑漆柄的小手镜。戏里，宅悦就是用这面镜子让阿岩看见了自己的脸。' },
      senko: { name: '线香', desc: '源叔带来的一把线香，已经点着了，一点红光一明一灭。' }
    },
    notes: {
      dougu: { title: '道具帳（源吉 记）', text: '※ 上手＝从观众席看过去的右边；下手＝左边。\n\n【二幕目·浪宅】\n行灯 四基，靠里一排，都是电灯泡。\n　灯座粉笔号，从上手数起：壱、弐、参、四。\n蚊帐 一顶（萌黄红边）。镜台 一。\n梳子 一——座长的真货，散场即收匣！\n\n【三幕目·隐亡堀】\n戸板 三枚（本番一、备用二），一面阿岩、一面小平的替身人偶，盖草席。钓竿 一。\n\n【大诘·蛇山庵室】\n提灯 一（「提灯抜け」用，纸面开缝）。' },
      kuden: { title: '源叔的规矩（贴在楽屋墙上）', text: '演四谷，记住这几条——\n\n一、开演前，全组去左门町的於岩稻荷上香。\n二、她要是借道具现身：\n　道具是死的，她是活的。对不上道具帳的那一件，就是她。\n　她身边是冷的，三伏天也冷。\n　正眼看不见的时候，用镜子看。\n三、认准了，再叫一声「阿岩夫人」。认错了，她就缠上来。\n四、千万别拔刀。拔了刀，你就成了伊右卫门。\n\n　　　　　　　　　　　　　　　　源吉' },
      daihon: { title: '台本扉页的手抄梗概', text: '浪人民谷伊右卫门为了娶阿岩，杀了她的父亲。\n邻家伊藤喜兵卫想把孙女阿梅嫁给他，送来一包「血道药」——是毁容的毒。\n阿岩喝下，半边脸肿起，一只眼垂了下来。按摩师宅悦把镜子递给她——她对镜梳头，头发一绺一绺地掉。知道真相后，她含恨而死。\n伊右卫门把她和仆人小平的尸体钉在一块门板的两面，扔进隐亡堀。（戸板返し）\n新婚之夜，他看见阿梅长着阿岩的脸、喜兵卫长着小平的脸，拔刀砍下——倒下的是活人。\n最后在蛇山的庵室，提灯上浮出她的脸，老鼠成群（戏里说她生在子年）……' },
      yuisho: { title: '於岩稻荷　由来（门前木牌）', text: '此处原是田宫家宅邸里供奉的稻荷。\n\n据说田宫家的阿岩与丈夫和睦，笃信稻荷，家道因此兴旺；街坊感念，便称这里为「於岩稻荷」。\n\n后来的歌舞伎《东海道四谷怪谈》借用了她的名字，戏里的毒杀与怨灵，据说与她本人并无关系。\n\n上演四谷怪谈的演员和剧组，至今仍有开演前来此参拜的习惯。' }
    },
    legend: '《东海道四谷怪谈》是四代目鹤屋南北写的歌舞伎狂言，文政八年（1825）七月在江户中村座首演，当时和《假名手本忠臣藏》分两天交替上演——伊右卫门本是赤穗藩的浪人，这出戏是忠臣藏的「外传」。浪人民谷伊右卫门为了攀附富家，让妻子阿岩喝下毁容的毒药；她对镜梳头、头发大把脱落的「髮梳き」，门板一面钉着阿岩、翻过来是仆人小平的「戸板返し」，蛇山庵室里提灯裂开、浮出她的脸的「提灯抜け」，都是这出戏的名场面；老鼠也是戏里反复出现的意象。戏里鬼魂出场时，后台打的是低沉的大鼓「ドロドロ」。\n\n这几场戏靠的是舞台机关和「早替り」：同一个演员在几秒钟里从阿岩换成小平，从提灯里钻出来。葛饰北斋在《百物语》里画的「お岩さん」，就是一盏长着她的脸的破提灯。此后两百年，四谷怪谈被一再改编成歌舞伎、电影和电视剧，阿岩肿起的半边脸成了日本怨灵最有名的形象之一。\n\n戏里的阿岩是虚构的，但名字有来处：东京新宿区四谷左门町有一座於岩稻荷田宫神社，原是田宫家宅邸里的稻荷（明治年间曾迁往中央区新川，如今两处都有）。神社的说法是，真实的阿岩与丈夫和睦、笃信稻荷，跟戏里的毒杀毫无关系；一般认为南北把她的名字和当时别的传闻、案件糅进了戏里。对街的陽運寺也供奉着阿岩。演员和剧组开演前到这里参拜的习惯流传至今；「不去参拜就会出事」的说法在剧场圈子里流传很广，多是传闻，难以查证。\n\n（本章的「四谷灯笼座」、源叔、真弓、座长和那把江户梳子，「找出变成道具的阿岩」的玩法，源叔的规矩、手镜看提灯的方法，以及三个结局，均为游戏虚构。）',
    start: { map: 'gakuya', x: 6, y: 5, dir: 3 },
    async intro(S) {
      for (const k in DIED) DIED[k] = 0;   // 新开一局：死亡计数清零（重来不清）
      await S.card('第五夜　四谷怪谈', '1986年8月　东京·四谷　某小剧场', '《东海道四谷怪谈》首演前夜。\n通排演到「梳头」那一场，扮阿岩的真弓\n梳下来一大把真头发，当场昏了过去。\n\n大家都跟去了医院。\n留在剧场里收拾道具的，只有你。');
    },
    resume: {
      taku: async S => { HOLD = 0; S.speed(1); const h = S.f.h1, n = 4 - h; if (DIED.taku) await S.think(DIED.taku === 1 ? '（道具帳：从上手数起，壱、弐、参、四。上手，是观众席看过去的右边。）' : `（右边数起第${KN[n]}盏，该是「${KN[n]}」——灯座上写的却是「${KN[h + 1]}」。）`); },
      hori: async S => {
        HOLD = 0; S.speed(1); S.stop('rats'); S.place('rats', 0, 5, 2); S.hide('rats'); S.f.ratsOn = false;
        if (DIED.hori) await S.think(DIED.hori === 1 ? '（别停下来。她身边是冷的——跑过门板的时候，看看边上的水面有没有结霜。）' : `（从西往东，第${KN[S.f.herP + 1]}块门板。它边上的水，结着霜。）`);
      },
      inari: async S => { HOLD = 0; S.speed(1); if (DIED.inari) { const n = 5 - S.f.lanH; await S.think(DIED.inari === 1 ? '（背对着灯笼，镜子里的左边，转过身来就是右边。）' : `（镜子里左数第${KN[n]}盏，就是转过身来右数第${KN[n]}盏。）`); } }
    },
    tick(S, dt) {
      if (HOLD > 0) { HOLD -= dt; if (HOLD <= 0) S.speed(1); }
      if (S.map === 'hori' && S.f.ratsOn && !S.f.act2) {
        sqT -= dt;
        if (sqT <= 0) { const r = S.ent('rats'), d = Math.abs(r.px / TS - S.pl.x) + Math.abs(r.py / TS - S.pl.y); sqT = d < 4 ? .45 : .9 + Math.random() * .6; S.tone('sine', 3000 + Math.random() * 600, 4400, .05, d < 4 ? .06 : d < 8 ? .035 : .018, 0); if (d < 4) S.sfx('heart'); }
      }
    },
    sprites: SPR5,
    maps: {
      /* ---------------- 楽屋 + 走廊 + 舞台袖 ---------------- */
      gakuya: {
        amb: 'room', dark: .62, plr: 3.2, wall: 'wood', floor: 'wood',
        rows: [
          '######################',
          '######################',
          '#tttttttt#nnnnnnWWWWW#',
          '#tttttttt#nnnnnnWWWWW#',
          '#tttttttt.nnnnnnWWWWW#',
          '#tttttttt#nnnnnnWWWWW#',
          '#tttttttt#nnnnnnWWWWW#',
          '######################'],
        ents: [
          { id: 'ikou', x: 1, y: 2, spr: 'ikou', on: S => S.narr(S.f.mirror1 ? '那件白衣裳……袖子好像比刚才垂得低了一点。像是有人刚把手从里面抽出去。' : '衣桁上挂着阿岩的戏服：一件洗得发白的单衣，下摆故意染脏了。\n袖口里掉出一根长长的黑头发。') },
          { id: 'kyodai', x: 2, y: 2, spr: 'kyodai', light: { r: 2.6, col: 'rgba(255,230,170,.18)', dy: -2 }, on: S => kyodaiUse(S) },
          { id: 'kesho', x: 3, y: 2, spr: 'kesho', async on(S) { await S.narr('化妆箱。白粉、眉墨、一小罐涂黑牙齿用的「铁浆」……\n最上面是一块用棉花和蜡捏的紫色肿包——贴在阿岩左眼上的。底下压着一本卷了边的台本。'); await S.note('daihon'); } },
          { id: 'harigami', x: 4, y: 1, spr: 'harigami', async on(S) { if (S.once('kudenRead')) await S.narr('墙上贴着一张纸，毛笔字，是源叔的字。'); await S.note('kuden'); } },
          { id: 'katsura', x: 5, y: 2, spr: 'katsura', on: S => S.narr('阿岩的假发套在木头模子上。前额的头发故意做得稀稀拉拉——\n戏里，毒药让她的头发一把一把地掉。') },
          { x: 6, y: 1, spr: 'poster', col: '#3a2440', on: S => S.narr('海报：「东海道四谷怪谈　八月公演　四谷灯笼座」。\n画上的阿岩半边脸肿着，手里攥着一把梳子。有人在她脸上用圆珠笔画了个圈。') },
          { id: 'kamidana', x: 7, y: 1, spr: 'kamidana', on: S => kamidanaUse(S) },
          { x: 3, y: 5, spr: 'cushion', on: S => S.narr('坐垫上还留着一个浅浅的坑。真弓下午就坐在这里，一遍一遍地对着镜子练梳头。') },
          { x: 6, y: 6, spr: 'lowtable', on: S => S.narr('矮桌上一只烟灰缸，两个茶杯。源叔的那杯还冒着热气。') },
          { x: 8, y: 6, spr: 'lamp', light: { r: 4, col: 'rgba(255,200,130,.15)' }, on: S => S.narr('台灯。灯罩上烫了一个小洞。') },
          { id: 'gen', x: 6, y: 4, spr: '@gen', dir: 0, on: S => S.say('源叔', '……') },
          { id: 'gdoor', x: 11, y: 1, spr: 'door', on: S => S.narr(S.f.mirror1 ? '楽屋口的门把手是湿的。门缝底下渗进来一股水沟的腥味。\n……门拉不开。' : '楽屋口，通后巷。源叔从外面锁上了，说天亮前回来。') },
          { x: 13, y: 2, spr: 'shelf', on: S => S.narr('小道具架。茶碗、烟管、药包、一叠假的小判金币……\n每一样上面都贴着源叔写的小纸条。') },
          { x: 14, y: 2, spr: 'shelf', on: S => S.narr('架子最上层空着一格，纸条上写着「梳子（真货）」。') },
          { x: 10, y: 6, spr: 'box', on: S => S.narr('一箱备用灯泡，箱子上写着「行灯用·豆电球」。\n台上的行灯，都是源叔亲手接的电线。') },
          { x: 12, y: 6, spr: 'hyoshigi', on: S => S.narr('拍子木。两块硬木，开幕前「梆」地一敲，全场就静下来。') },
          { x: 15, y: 6, spr: 'crate', on: S => S.narr('一摞旧门板的边角料。其中一块上，用粉笔画着一个歪歪扭扭的人形。') },
          { id: 'kake', x: 17, y: 2, spr: 'katanakake', on: S => S.narr(S.f.mirror1 ? '刀架是空的。伊右卫门的那把刀……不见了。' : '舞台袖的刀架。伊右卫门的刀架在上面——竹子做的刀身，刀鞘漆得乌亮。'), full: true },
          { id: 'jmaku', x: 18, y: 1, w: 3, spr: 'jmaku', on: S => makuUse(S) },
          { x: 20, y: 6, spr: 'rope', on: S => S.narr('吊景用的麻绳，一圈一圈盘在地上。') }
        ],
        async enter(S, first) { if (first) await genIntro(S); }
      },
      /* ---------------- 二幕目：伊右卫门浪宅（舞台变成了真的） ---------------- */
      taku: {
        amb: 'night', dark: .88, plr: 2.6, wall: 'shoji', floor: 'tatami',
        rows: [
          '################',
          '################',
          '#tttttttttttttt#',
          '#tttttttttttttt#',
          '#tttttttttttttt#',
          '#tttttttttttttt#',
          '#tttttttttttttt#',
          '#llllllllllllll#',
          '################'],
        ents: [
          { id: 'hdoor', x: 1, y: 1, spr: 'sliding', on: S => hdoorUse(S) },
          { x: 4, y: 1, spr: 'scroll', on: S => S.narr('挂轴上写着一个「忍」字。墨迹有一处洇开了，像是被水滴过。') },
          { id: 'butsu', x: 7, y: 2, spr: 'butsudan', on: S => S.narr('小佛龛。牌位上的字被烟熏得看不清了。\n供着一碗白饭，饭上直直地插着一双筷子。') },
          { x: 11, y: 2, spr: 'rat', solid: false, decal: true, on: S => S.narr('一只老鼠蹲在墙角，看了你一眼，钻进了纸门的破洞里。') },
          { id: 'byobu', x: 13, y: 2, w: 2, spr: 'byobu', on: S => S.narr('两折的屏风，画的是秋草。\n屏风后面，好像有人在很小声地哼着摇篮曲。') },
          { id: 'an0', x: 3, y: 3, spr: 'andon', num: lampNum(0, 2), off: true, light: LAMPL, on: S => andonUse(S, 0) },
          { id: 'an1', x: 6, y: 3, spr: 'andon', num: lampNum(1, 2), off: true, light: LAMPL, on: S => andonUse(S, 1) },
          { id: 'an2', x: 9, y: 3, spr: 'andon', num: lampNum(2, 2), off: true, light: LAMPL, on: S => andonUse(S, 2) },
          { id: 'an3', x: 12, y: 3, spr: 'andon', num: lampNum(3, 2), off: true, light: LAMPL, on: S => andonUse(S, 3) },
          { id: 'kaya', x: 2, y: 5, w: 3, spr: 'kaya', on: S => S.narr(S.ent('kaya').s.down ? '扯下来的蚊帐堆在榻榻米上。网眼上勾着几片薄薄的、半月形的东西。\n……你没敢细看。' : '萌黄色的蚊帐，红布镶边。') },
          { id: 'okyo', x: 13, y: 5, spr: 'okyo', on: S => okyoUse(S) },
          { id: 'cradle', x: 10, y: 6, spr: 'yurikago', on: S => S.narr('竹编的摇篮，铺着小被子。……空的。\n被子上有一块小小的凹痕，还是温的。') },
          { id: 'kurogo', x: 1, y: 6, spr: '@kurogo', dir: 2, on: S => kurogoHint(S, 'taku') },
          { x: 14, y: 7, spr: 'invisible', solid: true, on: S => S.narr('台口。往下看，是黑沉沉的观众席。\n……第三排正中间，好像坐着一个人。') }
        ],
        async enter(S, first) { if (first) await takuIntro(S); }
      },
      /* ---------------- 三幕目：隐亡堀 ---------------- */
      hori: {
        amb: 'river', dark: .8, plr: 3.3, floor: 'dirt', shimmer: true,
        legend: { 'Y': { t: 'reeds', solid: true } },
        rows: [
          'eeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee',
          '~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~',
          '~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~',
          '~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~',
          'dddddddddddddddddddddddddddddddddd',
          'dddddddddddddddddddddddddddddddddd',
          'eeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee',
          'eeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee'],
        ents: [
          { id: 'tp0', x: PX[0], y: 3, spr: 'toita', on: S => panelUse(S, 0) },
          { id: 'tp1', x: PX[1], y: 3, spr: 'toita', on: S => panelUse(S, 1) },
          { id: 'tp2', x: PX[2], y: 3, spr: 'toita', on: S => panelUse(S, 2) },
          { x: PX[0] - 2, y: 3, spr: 'kui' }, { x: PX[1] - 2, y: 3, spr: 'kui' }, { x: PX[2] - 2, y: 3, spr: 'kui' },
          { x: 2, y: 6, spr: 'sign', col: '#4a3a2a', on: S => S.narr('木牌：「隐亡堀」。\n隐亡，是从前看守火葬场的人。这条水沟，通着那边。') },
          { x: 6, y: 6, spr: 'yanagi', on: S => S.narr('柳树。枝条一直垂到水面上，夜风一吹，像有人在水里梳头。') },
          { x: 14, y: 6, spr: 'yanagi', on: S => S.narr('柳树底下，扔着一只湿透的草鞋。') },
          { x: 23, y: 6, spr: 'yanagi', on: S => S.narr('柳树。树皮上被人用小刀刻了一个「岩」字。') },
          ...[11, 20, 29].map(x => ({ x, y: 6, spr: 'stonelantern', light: { r: 2.6, col: 'rgba(170,200,255,.12)' }, on: S => S.narr('石灯笼。灯火是青白色的，照得水面一片惨白。') })),
          { id: 'rod', x: 3, y: 4, spr: 'tsurizao', solid: false, on: S => S.narr('一根钓竿斜插在岸边的泥里，鱼线垂进黑水。\n戏里，伊右卫门就是在这里钓鱼的。') },
          { id: 'rats', x: 0, y: 5, spr: 'rats', hidden: true, solid: false },
          { id: 'bridge', x: 33, y: 4, h: 2, spr: 'bridge', solid: false, touch: S => bridgeTouch(S) }
        ],
        async enter(S, first) { if (first) await horiIntro(S); },
        step(S, x) {
          const f = S.f; if (f.act2) return;
          if (!f.ratsOn && x >= 5) return ratsStart(S);
          if (f.herP != null && Math.abs(x - PX[f.herP]) <= 1 && S.once('breath')) S.toast('你呼出的气……是白的。');
        }
      },
      /* ---------------- 大诘：四谷左门町·於岩稻荷 ---------------- */
      inari: {
        amb: 'night', dark: .84, plr: 3, wall: 'wood', floor: 'asphalt',
        tileOpts: { grassC: '#24361f' },
        rows: [
          'hhhhhhhhhhhhhhhhhhhh',
          'hhhhhhhhhhhhhhhhhhhh',
          'h"""""""kkkk"""""""h',
          'h"""""""kkkk"""""""h',
          'h"""""""kkkk"""""""h',
          'h"""""""kkkk"""""""h',
          'h"""""""kkkk"""""""h',
          'hhhhhhhhkkkkhhhhhhhh',
          '::::::::::::::::::::',
          '::::::::::::::::::::',
          '####################'],
        ents: [
          ...[0, 1, 2, 3, 4].map(i => ({ id: 'ch' + i, x: 2 + i, y: 3, spr: 'chochin', light: { r: 1.9, col: 'rgba(255,170,90,.2)', flick: true, dy: 0 }, on: S => lanternUse(S, i) })),
          { id: 'ogami', x: 4, y: 5, spr: 'ogami', solid: false, decal: true, on: S => ogamiUse(S) },
          { id: 'mview', x: 3, y: 5, spr: 'mview', solid: false, hidden: true, z: 2 },
          { id: 'yashiro', x: 9, y: 2, w: 2, spr: 'shrine', light: { r: 2.4, col: 'rgba(255,190,120,.12)' }, on: S => shrineUse(S) },
          { x: 7, y: 2, spr: 'kitsune', on: S => S.narr('石狐。嘴里叼着一把钥匙，脖子上系着褪了色的红围兜。') },
          { x: 12, y: 2, spr: 'kitsune', flip: true, on: S => S.narr('石狐。嘴里衔着一颗宝珠。底座上刻着献纳者的名字，已经磨平了。') },
          { id: 'torii', x: 9, y: 7, spr: 'torii', solid: false, z: 1 },
          { x: 14, y: 4, spr: 'chozu', on: S => S.narr('手水钵。水面上漂着一片银杏叶。\n……水里照出来的提灯，一盏也没有脸。') },
          { x: 15, y: 2, w: 2, spr: 'ema', on: S => S.narr('绘马架上挂满了绘马。「首演顺利」「阿岩大人保佑」「全组平安」……\n有一块字迹很新：「对不起，我们会好好演。」') },
          { id: 'yuisho', x: 17, y: 5, spr: 'yuisho', on: async S => { S.f.readYuisho = true; await S.note('yuisho'); } },
          { x: 3, y: 9, spr: 'streetlamp', light: { r: 3, col: 'rgba(220,230,255,.12)' }, on: S => S.narr('电线杆上的路灯，灯罩里积着一层死虫子。') },
          { x: 14, y: 9, spr: 'vending', light: { r: 2.2, col: 'rgba(200,230,255,.16)' }, on: S => S.narr('自动贩卖机。可乐一百日元，灯管嗡嗡地响。\n……这是你熟悉的四谷。可你身上还穿着伊右卫门的戏服。') },
          { id: 'kurogo2', x: 18, y: 8, spr: '@kurogo', dir: 1, on: S => kurogoHint(S, 'inari') },
          { id: 'oiwaI', x: 9, y: 3, spr: '@oiwa', dir: 3, hidden: true, on: S => oiwaUse(S) },
          { id: 'genO', x: 9, y: 6, spr: '@gen_o', dir: 3, hidden: true, on: S => genInari(S) },
          { id: 'genI', x: 9, y: 6, spr: '@gen', dir: 3, hidden: true, on: S => genInari(S) }
        ],
        async enter(S, first) { if (first) await inariIntro(S); },
        step(S, x, y) { if (!S.ent('mview').hidden && !(x === 4 && y === 5)) S.hide('mview'); }
      }
    }
  });

  /* ================= 剧本 ================= */
  /* 认错了：头发缠上来；缠满三次就死，从本幕开头重来 */
  async function tangle(S, act, why) {
    const f = S.f; f.tangle = (f.tangle || 0) + 1; f.wrongAll = (f.wrongAll || 0) + 1;
    if (f.prayed && !f.forgiven) {   // 楽屋稻荷上过香：第一次认错，她只是看了你一眼
      f.forgiven = true; f.tangle--; S.sfx('whisper');
      await S.narr('有什么东西从你脚边滑了过去，又缩了回去。\n远远地，像是有一炷香的味道。');
      if (why) await S.think(why);
      return;
    }
    S.sfx('whisper'); TONE.comb(S, 2); S.shake(400, 2);
    if (f.tangle >= 3) {
      DIED[act]++;
      await S.scare('face', { face: 'kami', dur: 1, sfx: 'sting' });
      await S.die('第三缕头发缠上了你的脖子。\n冰凉的梳齿贴着你的后颈，一下，一下，从上往下梳——\n梳一下，掉一绺。', '她缠上了你');
      return;
    }
    S.wear('@iemon' + f.tangle);
    await S.narr(f.tangle === 1 ? '一缕湿冷的黑发从地板缝里钻出来，缠住了你的脚踝。' : '又一缕头发缠上了你的手腕。\n……再认错一次，它就要缠到脖子上来了。');
    if (why) await S.think(why);
  }
  /* 一幕结束：头发松开 */
  async function release(S) {
    const t = S.f.tangle; S.f.tangle = 0; S.wear('@iemon0');
    if (t > 0) await S.narr('缠在你身上的头发，一缕一缕地松开，缩回了暗处。');
  }

  /* ---------------- 楽屋 ---------------- */
  async function genIntro(S) {
    S.face('gen', 'pl');
    await S.say('源叔', ['回来啦。……真弓那丫头，送进医院了。', '医生说是贫血。贫血？梳个头，梳下来一大把。']);
    await S.say('源叔', ['我跟了四十年道具，四谷怪谈少说也做过十几回。', '开演前，全组人都要去左门町的於岩稻荷上香——老规矩了。', '今年这位座长说那是迷信，不去。还非要用他从古董市淘来的那把真梳子，说江户的老东西，「有味道」。']);
    const r = await S.ask('', ['源叔，你信这个？', '那把梳子……在我这儿。']);
    if (r === 0) await S.say('源叔', ['信不信的……我见过台上的行灯自己灭，见过戸板怎么也翻不过来。', '小心点，没坏处。']);
    else await S.say('源叔', '……是你从真弓手里掰下来的吧。她攥得那么紧。');
    await S.say('源叔', ['我去医院看一眼，天亮前去趟稻荷，替这帮小子把香补上。', '你把梳子收进镜台抽屉的匣子里，就能回去睡觉了。', '道具帳给你。明天的道具照它摆。墙上贴着我的规矩，走之前看一眼。']);
    await S.note('dougu');
    await S.say('源叔', '……还有。今晚别对着镜台梳头。');
    await S.walk('gen', [9, 4], 3.2); await S.walk('gen', [11, 2], 3.2);
    S.sfx('open'); S.hide('gen'); await S.wait(300); S.sfx('close');
    S.goal('把梳子收进化妆镜台的匣子里（楽屋左上角）');
  }
  async function kamidanaUse(S) {
    const k = S.ent('kamidana');
    if (S.f.prayed) return S.narr('楽屋稻荷。香还在烧，烟细细的一缕，笔直地往上走。');
    await S.narr('墙上高处钉着一块小木板，供着巴掌大的稻荷神龛和一对瓷狐狸。\n剧场里的人叫它「楽屋稻荷」。香炉是凉的——今天谁也没顾上。');
    const r = await S.ask('', ['点一炷香，拜一拜', '算了']);
    if (r) return;
    S.f.prayed = true; k.lit = true; S.sfx('match'); TONE.bell(S);
    await S.narr('你点了一炷香，合掌拜了拜。\n「大家没去左门町，不是有意怠慢……请多担待。」');
  }
  async function kyodaiUse(S) {
    const f = S.f, k = S.ent('kyodai');
    if (f.mirror1) return S.narr('化妆镜台。镜子里只有你，和你身后那件白衣裳。\n抽屉里的桐木匣子开着，空的。');
    await S.narr('化妆镜台。镜子四周一圈小灯泡，坏了两个。\n抽屉里有个桐木匣子，是装那把梳子的。');
    const c = await S.ask('把梳子收进匣子？', ['收进去', '……再看一眼']);
    if (c === 0) await S.narr('你拉开抽屉，打开桐木匣子——\n匣底的绸子上，盘着一绺长长的黑头发。像是有人刚把梳子从里面拿出来时，顺手留下的。');
    await S.narr('你把梳子举到灯下。玳瑁的，齿很密，梳背上描着一枝金色的秋草。\n……齿缝里缠着几根头发，很长，很黑。');
    await S.think('（真弓的头发是烫过的栗色。）');
    S.amb('none'); await S.wait(500);
    k.s.ghost = 1; TONE.comb(S, 3);
    await S.narr('镜子里，你的身后——\n有个女人背对着你跪坐在榻榻米上，一下，一下，在梳头。');
    S.turn(0); S.sfx('thud');
    await S.narr('你猛地回头。\n身后只有衣桁上挂着的那件白衣裳。');
    S.turn(3); await S.wait(400);
    k.s.ghost = 2; S.sfx('sting');
    await S.narr('再看镜子——她转过来了。');
    await S.scare('face', { face: 'oiwa', dur: 1.1 });
    k.s.ghost = 0; S.take('kushi');
    if (f.prayed) await S.narr('（神棚上那炷香的烟，忽然打了个旋。）');
    await S.narr('……镜子里什么也没有了。\n你低头看自己的手。梳子不见了。');
    await S.wait(500);
    TONE.hyoshigi(S, 2, .45);
    await S.narr('舞台那边，「梆、梆」——拍子木响了两声。\n开幕的信号。');
    TONE.doro(S);
    await S.narr('紧接着是笛子尖尖的一声，和低低的大鼓：咚咚咚咚……\n戏里，鬼魂出场的时候，后台就打这个。');
    f.mirror1 = true; S.ent('jmaku').s.glow = true; S.ent('kake').full = false; S.amb('drone');
    S.goal('去舞台袖（东边），掀开定式幕');
  }
  async function makuUse(S) {
    if (!S.f.mirror1) return S.narr('定式幕。黑、柿、萌葱三色的竖条，明天一开演就会拉开。\n现在它静静地垂着。');
    await S.narr('定式幕后面亮着灯。\n有人在台上，用很慢很慢的调子念：「……伊右卫门殿。」');
    const r = await S.ask('', ['掀开幕', '再等等']);
    if (r) return;
    TONE.hyoshigi(S, 1); S.ent('jmaku').open = true; S.sfx('open');
    await S.narr('你抓住幕布的边，往旁边一拉。三色的幕「哗——」地滑开了。\n台上的灯，亮得睁不开眼。');
    S.wear('@iemon0');
    await S.go('taku', 8, 7, 3);
  }

  /* ---------------- 二幕目：浪宅 ---------------- */
  async function takuIntro(S) {
    TONE.hyoshigi(S, 6, .26);
    await S.card('二幕目　伊右卫门浪宅', '', '幕拉开了。\n台下的观众席黑沉沉的，一个人也没有。\n台上的布景……不再是布景了。');
    await S.narr('榻榻米是真的，纸门是真的。空气里有一股霉味和药味。\n你低头——身上是一件黑色的旧和服，腰上插着一把刀。\n伊右卫门的戏服。');
    await S.think('（源叔的规矩：千万别拔刀。）');
    const k = S.ent('kaya'); k.s.who = true; S.focus(3, 5);
    await S.narr('屋子中间吊着一顶萌黄色的蚊帐。蚊帐里坐着一个女人，怀里抱着什么，一动不动。');
    await S.say('蚊帐里的女人', ['……这顶蚊帐，不能拿走。', '没有它，夜里蚊子会叮孩子。'], { style: 'whisper' });
    await S.narr('你的手自己伸了出去，攥住了蚊帐的一角。');
    await S.think('（不是我——我没想动！）');
    S.shake(500, 2); TONE.tear(S); S.sfx('tear');
    k.s.down = true; k.s.who = false;
    await S.narr('你往回一拽。蚊帐「哗」地塌了下来。\n她的手指还勾在网眼上——「噗、噗」，很轻的几声，像是什么薄薄的东西，一片一片剥落了。');
    await S.narr('……塌下来的蚊帐里，什么也没有。');
    S.focus(null); await S.wait(400);
    const h = S.f.h1 = S.rand(4);
    for (let i = 0; i < 4; i++) { const e = S.ent('an' + i); e.num = lampNum(i, h); e.light = i === h ? Object.assign({}, LAMPL, { flick: true }) : LAMPL; }
    for (let i = 0; i < 4; i++) { S.ent('an' + i).off = false; S.sfx(i === h ? 'match' : 'switch'); await S.wait(420); }
    await S.narr('靠里的一排行灯，一盏接一盏亮了。');
    await S.think('（台上的行灯都是源叔接的电灯泡。……她借道具现身，总有一处对不上道具帳。）');
    S.f.tangle = 0;
    S.goal(S.coop ? '四盏行灯里有一盏是她：一人翻道具帳（J）念号数，一人看灯座，找出来叫「阿岩夫人」' : '四盏行灯里有一盏是她：对照道具帳找出来，对它叫「阿岩夫人」');
    S.cp('taku');
  }
  async function andonUse(S, i) {
    const e = S.ent('an' + i), f = S.f;
    if (f.act1) return S.narr(e.s.torn ? '裂开的纸罩耷拉着。里面是一只烧干了的油碟——没有灯泡，也没有电线。' : `行灯。灯座上的粉笔号：「${KN[e.num]}」。\n纸罩里一只小灯泡，电线从底座后面拖下去。`);
    if (e.off) return S.narr('行灯还没亮。');
    await S.narr(`行灯。纸罩糊得发黄，透出昏黄的光。\n灯座上用白粉笔写着一个「${KN[e.num]}」字。`);
    if (S.once('lampJ')) await S.think('（道具帳记在手账里——按 J，或点右上角的「笺」翻看。）');
    const r = await S.ask('', ['（是道具）走开', '「阿岩夫人——是您吧」']);
    if (r !== 1) return;
    const h = f.h1;
    if (i === h) return act1Reveal(S, e);
    f.w_taku = (f.w_taku || 0) + 1;
    S.sfx('switch');
    await S.narr('纸罩里只有一只小灯泡，嗡嗡地响。……是道具。');
    const why = i === 3 - h ? '（这盏的号数，跟它的位置对得上。……上手到底是哪一边？）' : '（这盏的号数四盏里独一份。有两盏写着同一个号——她在那两盏里。）';
    await tangle(S, 'taku', why);
    if (f.w_taku >= 2 && f.tangle < 3) await S.think('（「上手」是观众席看过去的右边。从右往左数：壱、弐、参、四。）');
  }
  async function act1Reveal(S, e) {
    S.f.act1 = true;
    TONE.doro(S);
    await S.narr('你叫出那一声的时候，纸罩里的光，一下子不晃了。');
    e.s.torn = true; S.sfx('tear');
    await S.scare('face', { face: 'oiwa', dur: 1.1 });
    e.off = true;
    await S.narr('纸罩「嗤」地一声从上到下裂开，一张脸从裂缝里探出来——\n灯灭了。');
    await S.say('阿岩', '……伊右卫门殿。', { style: 'whisper' });
    await release(S);
    S.ent('okyo').s.ghost = 1;
    await S.narr('上手那边，她的镜台上，亮起了一点豆大的灯火。');
    S.goal('去上手（右边）的镜台前看看');
  }
  async function okyoUse(S) {
    const f = S.f, o = S.ent('okyo');
    if (!f.act1) return S.narr('黑漆的小镜台，立着一面圆圆的铜镜。\n镜子里是你的脸——和你身上那件黑衣裳。');
    if (f.act1Done) return S.narr('铜镜里只有你自己。镜台上散着几缕长头发。');
    await S.narr('黑漆的小镜台，一盏小油灯。圆圆的铜镜里……没有你。\n镜子里，有个女人跪坐着。');
    await S.say('阿岩（镜中）', '……宅悦，把镜子拿来。', { style: 'whisper' });
    await S.narr('她接过一面带柄的小手镜，照了照。\n手镜从她手里滑了下去。');
    await S.say('阿岩（镜中）', '……这，是我的脸吗？', { style: 'whisper' });
    await S.narr('她拿起一把玳瑁梳子——就是真弓手里那一把——慢慢地梳下去。');
    TONE.comb(S, 4);
    await S.narr('梳一下，掉一绺。\n梳一下，掉一绺。\n黑头发落在镜台上，一缕一缕，像水草。');
    o.s.hair = true;
    await S.say('阿岩（镜中）', ['伊藤家送来的「血道药」……我喝了。', '想快点好起来。好起来，给你看。'], { style: 'whisper' });
    S.sfx('sting'); S.fx('red');
    await S.say('阿岩（镜中）', '伊右卫门殿——这口怨气，我怎能咽下！', { style: 'big' });
    await S.wait(500);
    o.s.ghost = 0; o.s.comb = true;
    await S.narr('油灯「噗」地灭了。再亮起来的时候，镜子里只剩下你。\n镜台上放着那把玳瑁梳子，旁边扣着那面小手镜。');
    o.s.comb = false; S.give('kushi'); S.give('kagami');
    await S.say('？？？', '……送回去。', { style: 'whisper' });
    TONE.hyoshigi(S, 7, .24);
    await S.narr('「梆、梆、梆梆梆——」拍子木越敲越急，是换场的「柝」。\n下手那扇纸门，自己滑开了一道缝。外面吹进来一股水腥味。');
    S.ent('hdoor').open = true; f.act1Done = true;
    S.goal('从下手（左边）的纸门出去');
  }
  async function hdoorUse(S) {
    if (!S.f.act1Done) return S.narr('纸门拉不开。门那边有水声。');
    await S.go('hori', 1, 4, 2);
  }

  /* ---------------- 三幕目：隐亡堀（危险段） ---------------- */
  async function horiIntro(S) {
    const f = S.f;
    await S.card('三幕目　隐亡堀', '', '深川，隐亡堀。\n戏里，伊右卫门在这里钓鱼，\n水上漂来了一块门板。');
    await S.narr('一条黑沉沉的水沟，柳条垂到水面上。\n水上漂着三块门板，一块一块拴在木桩上，都盖着草席。');
    await S.think('（道具帳：戸板三枚，一块本番、两块备用。……可这里的三块，有一块不是道具。）');
    await S.think('（源叔说过：她身边是冷的。三伏天也冷。）');
    f.herP = S.rand(3); for (let i = 0; i < 3; i++) S.ent('tp' + i).s.cold = i === f.herP;
    f.tangle = 0; S.wear('@iemon0');
    S.goal('三块门板里有一块是她（她身边是冷的）：找出来，叫「阿岩夫人」' + (S.coop ? '——一人盯身后，一人看水面' : ''));
    S.cp('hori');
  }
  async function ratsStart(S) {
    const f = S.f; f.ratsOn = true;
    TONE.squeak(S, 7); S.sfx('whisper');
    await S.narr('身后的芦苇里「沙沙沙沙」地响，然后是「吱、吱吱」——很多很多声。');
    await S.think('（老鼠……听说戏里的阿岩是子年生的，老鼠一直跟着她。别停下来！）');
    S.place('rats', 0, S.pl.y === 4 ? 5 : 4, 2);
    S.chase('rats', { spd: RAT_SPD, always: true, wait: 1.0, catch: ratsCatch });
    S.goal('别停下！找出冷的那块门板，叫「阿岩夫人」');
  }
  async function ratsCatch(S) {
    const f = S.f;
    if (!f.ratBit) {   // 第一次被扑到：只是警告
      f.ratBit = true; HOLD = 0; S.speed(1); S.sfx('scream'); S.shake(500, 3); TONE.squeak(S, 5);
      S.place('rats', Math.max(0, S.pl.x - 7), S.pl.y === 4 ? 5 : 4, 2);
      await S.narr('老鼠扑上来，咬住了你的草鞋带子——你一脚踢开，跌跌撞撞地往前冲。\n下一次，就不是草鞋了。');
      S.chase('rats', { spd: RAT_SPD, always: true, wait: 1.0, catch: ratsCatch });
      return;
    }
    DIED.hori++; HOLD = 0; S.speed(1);
    S.sfx('scream'); await S.scare('red', { dur: .8 });
    await S.die('黑压压的老鼠漫过你的脚背，顺着戏服的下摆往上爬。\n你摔倒在水沟边上。\n……黑水里，有一只白白的手，在等你。', '鼠群');
  }
  async function panelUse(S, i) {
    const f = S.f, e = S.ent('tp' + i);
    if (f.act2) return S.narr(e.s.sunk ? '水面上只剩一圈一圈的涟漪。' : '门板在水上一沉一浮。草席底下露出一截木头假手——是道具。');
    const her = i === f.herP;
    await S.narr('门板拴在木桩上，一沉一浮。草席底下露出一缕黑头发。');
    const r = await S.ask('', ['走开', '「阿岩夫人——是您吧」', '翻过来看看（戸板返し）', '蹲下，伸手探探水']);
    if (r === 0) return;
    if (r === 3) {
      S.sfx('water'); await S.wait(900);
      return S.narr(her ? '指尖一碰到水，冰得一下子缩了回来。\n八月的水沟……水面上浮着一层薄薄的冰碴。' : ['水是温的，泡着几片烂柳叶。', '水温吞吞的，浮着一层油花。', '水是温的，有一股腥味。'][i]);
    }
    if (r === 2) {
      S.sfx('splash');
      if (S.once('flip')) {
        await S.narr('你抓住门板边，把它翻了个面——\n另一面也盖着草席，草席底下伸出一只瘦瘦的手，死死攥着一个纸包。');
        await S.say('？？？', '……药……老爷的药……', { style: 'whisper' });
        await S.narr('是小平。戏里那个偷药给主人治病、被伊右卫门杀掉的仆人。\n你把门板翻了回去。');
      } else await S.narr('翻过来，是小平攥着药包的手。你又把它翻了回去。');
      return;
    }
    if (her) return act2Reveal(S, e);
    f.w_hori = (f.w_hori || 0) + 1; S.sfx('splash');
    await S.narr('草席底下是一个木头假人，眼睛是画上去的。');
    HOLD = 1.4; S.speed(.3);
    await tangle(S, 'hori', '（这块门板边上的水是温的。……她身边是冷的。）');
  }
  async function act2Reveal(S, e) {
    const f = S.f; f.act2 = true; S.stop('rats'); f.ratsOn = false; HOLD = 0; S.speed(1);
    TONE.doro(S);
    await S.narr('草席自己滑进了水里。');
    await S.scare('face', { face: 'oiwa', dur: 1 });
    await S.narr('门板上的女人睁开了眼睛。半边脸肿得发紫，一只眼睛垂在脸颊上。\n她看了你很久。');
    await S.say('阿岩', '……你，不是他。', { style: 'whisper' });
    if (!S.ent('rats').hidden) await S.alpha('rats', 0, 700);
    await S.narr('身后的「吱吱」声，一下子全停了。');
    await S.say('阿岩', ['……那把梳子。', '是母亲留给我的。'], { style: 'whisper' });
    e.s.sunk = true; S.sfx('water');
    await S.narr('门板慢慢翻过去，沉进了黑水里。翻过去的那一面上，一个瘦小的男人朝你点了点头。\n水沟尽头，桥那边，亮起了一串提灯。');
    await release(S);
    S.goal('过桥（水沟东头），往提灯那边去');
  }
  async function bridgeTouch(S) {
    if (!S.f.act2) {
      S.sfx('splash');
      await S.narr('桥板上缠满了湿漉漉的黑头发。脚一踩上去就被缠住，怎么也迈不开步。');
      S.pos(31, S.pl.y, 1); return;
    }
    await S.go('inari', 1, 8, 2);
  }

  /* ---------------- 大诘：於岩稻荷 ---------------- */
  async function inariIntro(S) {
    const f = S.f;
    TONE.hyoshigi(S, 2, .5);
    await S.card('大诘　於岩稻荷', '', '戏里的最后一幕，伊右卫门躲在蛇山的庵室，\n提灯上浮出了她的脸。\n\n……你过了桥，脚下踩到的是柏油路。');
    await S.narr('一条窄窄的小巷。电线杆，自动贩卖机，远处一辆出租车开过去。\n是四谷，左门町。');
    await S.narr('鸟居后面，挂着一排献纳的提灯，上面写着剧团和演员的名字。\n五盏，全都亮着。');
    await S.think('（源叔的规矩：正眼看不见的时候，用镜子看。……宅悦的那面手镜。）');
    f.lanH = [0, 1, 3, 4][S.rand(4)];
    f.tangle = 0; S.wear('@iemon0');
    S.goal('她躲在一盏提灯里：站到提灯前的拜石上，背对提灯，用手镜看' + (S.coop ? '——一人举镜报位置，一人去认' : ''));
    S.cp('inari');
  }
  async function ogamiUse(S) {
    const f = S.f;
    if (f.act3) return S.narr('提灯前一块平平的石头，被人站得发亮。');
    S.turn(0);
    await S.narr('你背对着那排提灯，站到石头上，把手镜举到肩头——');
    TONE.kane(S);
    const n = 5 - f.lanH;
    const mv = S.ent('mview'); mv.num = n; S.place('mview', S.pl.x - 1, S.pl.y - 1, 0);
    await S.narr(`镜子里，五盏提灯排成一排。\n左边数起第${KN[n]}盏的纸面上……浮着一张脸。`);
    f.sawMirror = true;
    if (S.once('mirrorTurn')) { S.hide('mview'); S.turn(3); await S.narr('你猛地回头。五盏提灯一模一样，安安静静地亮着。'); S.turn(0); S.show('mview'); }
    if (S.coop) S.toast('双人：举镜的人站在拜石上报位置（镜子会一直举着），另一个人换手去认');
    else S.toast('站在拜石上，镜子就一直举着；走下来就放下');
    S.goal('镜子里看见她了：转过身来是哪一盏？对它叫「阿岩夫人」');
  }
  async function lanternUse(S, i) {
    const f = S.f, e = S.ent('ch' + i);
    if (f.act3) return S.narr(e.face ? '纸面裂开的那盏提灯灭了。裂缝里黑洞洞的。' : `献纳提灯：「${DONOR[i]}」。`);
    await S.narr(`献纳提灯。白纸红腰，墨笔写着「${DONOR[i]}」。\n火苗在纸里一跳一跳。……正眼看过去，什么也没有。`);
    if (!f.sawMirror) await S.think('（正眼看不见她……用镜子。站到那块拜石上，背过身去。）');
    const r = await S.ask('', ['走开', '「阿岩夫人——是您吧」']);
    if (r !== 1) return;
    if (!f.sawMirror) return S.think('（……不行。正眼认不出她，乱叫一声，她就缠上来了。先用镜子。）');
    if (i === f.lanH) return act3Reveal(S, e);
    f.w_inari = (f.w_inari || 0) + 1;
    const n = 5 - f.lanH;
    await S.narr('提灯里的火苗晃了晃，什么也没有发生。');
    const why = i === n - 1 ? '（镜子里的左右是反的——你是背对着提灯看的。）' : `（不是这一盏。镜子里，是左数第${KN[n]}盏。）`;
    await tangle(S, 'inari', why);
    if (f.w_inari >= 2 && f.sawMirror && f.tangle < 3) await S.think(`（背对着提灯时，镜子里的左边就是转过身来的右边。……右数第${KN[n]}盏。）`);
  }
  async function act3Reveal(S, e) {
    const f = S.f; f.act3 = true;
    TONE.doro(S);
    await S.narr('提灯里的火苗「呼」地蹿起老高。');
    e.face = true; S.sfx('tear');
    await S.scare('face', { face: 'lantern', dur: 1.2 });
    await S.narr('纸面从中间裂开，像一张嘴——裂缝里是她的脸。\n跟戏里最后一幕一模一样：提灯里的阿岩。');
    e.off = true; await S.wait(500);
    S.ent('oiwaI').alpha = 0; await S.alpha('oiwaI', 1, 900);
    await S.narr('提灯灭了。\n再看时，稻荷社前站着一个穿白衣裳的女人，背对着你。头发稀稀拉拉地垂到腰。');
    await release(S);
    S.sfx('step'); await S.wait(250); S.sfx('step'); await S.wait(250); S.sfx('step');
    await S.narr('身后的巷子里，有人跑过来。木屐「嗒、嗒、嗒」。');
    const g = S.ent('genO'); g.alpha = 1; S.place('genO', 9, 8, 3);
    const tg = [[9, 6], [10, 6], [8, 6], [10, 7]].find(([x, y]) => !(S.pl.x === x && S.pl.y === y) && !(S.pl.x === x && S.pl.y === y + 1));
    await S.walk('genO', tg, 3.4);
    S.face('genO', 'pl');
    await S.say('？？？', '喂——！');
    S.sfx('heart');
    await S.narr('你回过头。\n站在鸟居底下的那个人……长着她的脸。半边肿着，一只眼睛垂在脸颊上。');
    await S.think('（跟戏里一模一样。伊右卫门在新婚之夜，看谁都是她的脸——他拔刀砍了下去。倒下的，是活人。）');
    f.genIn = true;
    S.goal('……鸟居底下那个人，是谁？');
  }
  async function genInari(S) {
    const f = S.f;
    if (f.genKnown) return S.say('源叔', S.has('senko') ? '去吧。香插稳了，梳子放在社前头。' : '……');
    const r = await S.ask('那张肿着半边的脸，在提灯底下看着你。', ['拔刀砍过去', '「……源叔？」', '别过脸去']);
    if (r === 0) return iemonEnd(S, 'gen');
    if (r === 2) return S.narr('你别过脸去。那个人还站在那里，一动不动。\n他手里攥着什么，一点红光，一明一灭。');
    await S.narr('你咽了口唾沫，叫了一声。');
    const o = S.ent('genO'); S.place('genI', Math.round(o.px / TS), Math.round(o.py / TS), o.dir); S.hide('genO'); S.face('genI', 'pl'); S.sfx('chime');
    await S.say('源叔', ['是我啊！你小子……怎么穿着伊右卫门的衣裳？', '我从医院出来，越想越不对劲，就直接奔这儿来了。']);
    await S.narr('提灯底下，是源叔那张皱巴巴的脸。手里攥着一把点着的线香。');
    await S.say('源叔', ['……她在那儿，是吧。我看不见，可我闻得到——一股梳头油的味道。', '把梳子还给她吧。香我带来了。']);
    S.give('senko'); f.genKnown = true;
    S.goal('在稻荷社前上香，把梳子供进去');
  }
  async function oiwaUse(S) {
    const r = await S.ask('她背对着你，站在稻荷社前。', ['把梳子递给她', '拔刀', '……什么也不做']);
    if (r === 1) return iemonEnd(S, 'oiwa');
    if (r === 0) {
      await S.narr('你把梳子递过去。\n她没有接。她只是慢慢抬起手，指了指面前的稻荷社。');
      if (!S.f.genKnown) await S.think('（空着手去社前，总不像话。……鸟居底下那个人，手里好像有香。）');
    }
  }
  async function shrineUse(S) {
    const f = S.f;
    if (!f.act3) return S.narr('於岩稻荷。小小的社殿，屋檐下挂着铃铛，拉绳是红白两色的。\n……先找到她。');
    if (!S.has('senko')) return S.narr('社前的香炉是空的。你身上没有香。\n鸟居底下那个人，手里有一点红光，一明一灭。');
    const r = await S.ask('於岩稻荷。她就站在你身边。', ['摇铃，上香，把梳子供进社里', '……这把梳子，留下吧']);
    if (r === 1) {
      await S.narr('梳子在你手心里慢慢变凉了。\n她没有回头。可你觉得，她在等。');
      const r2 = await S.ask('', ['……还是留下', '把梳子供进去']);
      if (r2 === 0) return kushiEnd(S);
    }
    return goodEnd(S);
  }

  /* ---------------- 结局 ---------------- */
  async function iemonEnd(S, who) {
    S.amb('none');
    await S.narr('你的手按上了刀柄。\n这一次，不是戏服替你动的。');
    S.sfx('cut'); S.fx('flash'); S.shake(600, 3);
    if (who === 'gen') {
      await S.narr('刀落了下去。\n……提灯底下，倒在地上的人捂着额头，指缝里渗出血来。他的脸，是源叔的脸。');
      await S.say('源叔', '……傻小子。那是……道具刀啊……', { style: 'whisper' });
      await S.narr('舞台上的刀是竹子做的，没有开刃。\n可你砍下去的时候，没有一点犹豫。');
    } else {
      await S.narr('刀穿过了她，像穿过一缕烟。\n她慢慢回过头，冲你笑了。');
      await S.say('阿岩', '……夫君。', { style: 'whisper' });
      await S.narr('身后，源叔手里的线香掉在地上。\n他看见的，是一个穿着伊右卫门戏服的人，对着空气挥刀。');
    }
    await S.end({ bad: true, id: 'iemon', title: '成了伊右卫门', text: '那年夏天的《四谷怪谈》停演了。\n\n你再也没回过剧场。可每天晚上，你都会梦见自己穿着那件黑色的旧和服，\n在一间又一间屋子里找她——\n行灯里，门板上，提灯后面。\n\n找到了，就拔刀。\n\n戏里的伊右卫门，就是这样一辈子都没能走出来的。' });
  }
  async function kushiEnd(S) {
    await S.narr('你把梳子攥在手心里。玳瑁的，温温的，像刚从谁的头发里拔出来。\n……这么好看的东西，凭什么要埋在一个小小的社里？');
    S.amb('none');
    await S.narr('她没有回头。\n源叔手里的香头，一下子全灭了。');
    await S.end({ bad: true, id: 'kushi', title: '梳子还在你手里', text: '第二年夏天，剧团又演《四谷怪谈》。\n这一次，扮阿岩的是你。\n\n座长说，你梳头那一场演得太真了，台下有人吓晕过去。\n\n每天晚上卸了妆，你都对着镜台，用那把玳瑁梳子一下一下地梳头。\n梳一下，掉一绺。\n梳一下，掉一绺。' });
  }
  async function goodEnd(S) {
    const f = S.f;
    TONE.bell(S);
    await S.narr('你拉动红白的绳子，铃铛「哗啦啦」地响了。');
    S.take('senko');
    await S.narr('三根线香插进香炉，青烟笔直地往上走。\n你把玳瑁梳子轻轻放在社前，合掌。');
    await S.say('阿岩', '……多谢。', { style: 'whisper' });
    S.face('oiwaI', 0);
    await S.narr('她转过身来。那半边肿着的脸，在香烟里一点一点地平复下去。\n是一张很普通的、温和的脸。像这条巷子里随便哪一户人家的主妇。');
    if (f.readYuisho) await S.narr('你想起门前那块木牌：真实的阿岩，和丈夫和睦，在这里供奉稻荷。\n……两百年来，每一出四谷开演，她都要再死一次。');
    await S.alpha('oiwaI', 0, 1600);
    S.take('kushi'); S.amb('wind');
    S.dark(.35); S.plr(5);
    for (let i = 0; i < 5; i++) S.ent('ch' + i).off = true;
    await S.narr('天边泛白了。巷子里，有人家拉开了木板窗。');
    S.wear('@me');
    await S.narr('你低头。身上是自己的衣服。');
    if (S.ent('genI').hidden) S.place('genI', 9, 6, 3);
    S.face('genI', 'pl');
    await S.say('源叔', ['……走吧。回去还得把道具摆好。', '下午，我把座长那帮小子押过来上香。']);
    await S.fade(1, 1200);
    await S.card('那天下午', '', '座长带着全剧组来左门町上了香。\n真弓出院了。医生说，她的头发会长回来的。\n\n《东海道四谷怪谈》如期开演。\n「梳头」那一场，用的是一把普通的塑料梳子。' + (f.prayed ? '\n\n后来源叔问你：「楽屋的神棚，是你上的香吧？」\n「那天晚上，她本来可以缠得更紧的。」' : '') + (!f.wrongAll ? '\n\n……一次也没有认错。\n源叔说，这样的道具方，他四十年里只见过一个。' : ''));
    await S.end({ id: 'inari', title: '第五夜　完', text: '如今，於岩稻荷的提灯里，有一盏写着「四谷灯笼座 一同」。\n\n听说夜里路过的人，偶尔会看见提灯底下站着一个梳头的女人。\n她不吓人。她只是在等下一出四谷开演。' });
  }

  /* ---------------- 黒衣：逐级提示 ---------------- */
  async function kurogoHint(S, act) {
    const f = S.f;
    if ((act === 'taku' && f.act1) || (act === 'inari' && f.act3)) return S.narr('黒衣低着头，一动不动。\n——按规矩，观众要当他不存在。');
    if (S.once('kurogo_' + act)) await S.narr('一个从头到脚裹着黑布的人蹲在角落里。是「黒衣」——台上递道具的人。\n按规矩，观众要当他不存在。');
    const k = f['hk_' + act] = Math.min(3, (f['hk_' + act] || 0) + 1);
    const lv = Math.max(k, Math.min(3, (f['w_' + act] || 0) + 1), DIED[act] ? 3 : 0);
    if (act === 'taku') {
      if (lv === 1) { await S.narr('黒衣把一本道具帳递到你面前，翻到「浪宅」那一页。'); await S.note('dougu'); return S.think('（四盏行灯，灯座上各有一个粉笔号。……对一对。）'); }
      if (lv === 2) { await S.narr('黒衣抬起一只手，指了指你的右边。'); return S.think('（「上手」是观众席看过去的右边。从右往左，该是壱、弐、参、四。）'); }
      const h = f.h1, n = 4 - h;
      S.bubble('an' + h, '?', 2000);
      await S.narr('黒衣走到一盏行灯后面，停了一下，又退回角落里。');
      return S.think(`（右边数起第${KN[n]}盏——该是「${KN[n]}」，灯座上写的却是「${KN[h + 1]}」。）`);
    }
    const n = 5 - f.lanH;
    if (!f.sawMirror) { await S.narr('黒衣指了指提灯前那块平平的石头，做了个举镜子的动作，然后背过身去。'); return S.think('（站到拜石上，背对提灯，用手镜看。）'); }
    if (lv === 1) { await S.narr('黒衣举起一只手，掌心朝着你，慢慢翻了过来。'); return S.think('（镜子里的左右，是反的。）'); }
    if (lv === 2) return S.think(`（背对着提灯时，镜子里的左边，就是转过身来的右边。镜子里左数第${KN[n]}盏……）`);
    S.bubble('ch' + f.lanH, '?', 2000);
    await S.narr('黒衣朝一盏提灯抬了抬下巴。');
    return S.think(`（转过身来看，是右数第${KN[n]}盏。）`);
  }
})();
