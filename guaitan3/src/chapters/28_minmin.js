/* ================= 第二十八夜 · 敏敏光 ================= */
(() => {
  /* ---------- 常量 ---------- */
  const R0 = 5.5, OMEGA = .3;          // 返程荒原：光绕着玩家飘的半径（格）与角速度（弧度/秒）
  const LURE_MAX = 4.5;                // 朝着光走累计多少秒，就到了「还要追吗」
  const LENA_XY = [16, 4];             // 桉树下的莉娜
  const SKY_KEYS = ['1', '2', '3', '4', '5', '6'];
  const MARKS = ['枯树', '岩堆', '栅栏桩', '白蚁丘', '土墩', '灌木'];
  const MARK_LINE = MARKS.map((n, i) => (i + 1) + ' ' + n).join('　');
  let DEATHS = 0;                      // 被光扑上来死过几次（不随检查点回滚，用于规则小结）

  const setL = (e, x, y) => { e.px = x * TS; e.py = y * TS; e.x = Math.round(x); e.y = Math.round(y); };
  const plXY = () => [W.pl.px / TS, W.pl.py / TS];

  /* ---------- 声音（S.tone 合成，双方都听得到） ---------- */
  const SND = {
    squelch(S) { S.tone('square', 1400, 1400, .06, .03); S.tone('square', 900, 900, .05, .025, .07); },
    radioHiss(S, n = 4) { for (let i = 0; i < n; i++) S.tone('sawtooth', 300 + Math.random() * 900, 200 + Math.random() * 700, .12, .012, i * .13, 2400); },
    genOff(S) { S.tone('sawtooth', 110, 34, 2.4, .05, 0, 700); S.tone('square', 55, 22, 2.2, .03, .1, 400); },
    hum(S, near) { const f = 180 + near * 90; S.tone('sine', f, f * 1.03, .7, .012 + near * .02); S.tone('sine', f * 8, f * 7.6, .5, .003 + near * .006, .05); },
    rush(S) { S.tone('sine', 240, 1300, .5, .05); S.tone('triangle', 120, 900, .5, .03); },
    dingo(S) { S.tone('sine', 480, 720, .9, .025, 0, 1800); S.tone('sine', 720, 560, 1.1, .022, .85, 1800); },
    star(S) { S.tone('sine', 1568, 1568, .9, .03); S.tone('sine', 2093, 2093, 1.1, .02, .12); S.tone('sine', 2637, 2637, 1.3, .015, .24); },
    wind(S) { for (let i = 0; i < 6; i++) S.tone('sawtooth', 90 + i * 30, 60 + i * 20, .8, .02, i * .25, 500); }
  };

  /* ---------- 小数字字模（星空里给地平线标号用） ---------- */
  const DIG = { 1: ['010', '110', '010', '010', '111'], 2: ['111', '001', '111', '100', '111'], 3: ['111', '001', '111', '001', '111'], 4: ['101', '101', '111', '001', '001'], 5: ['111', '100', '111', '001', '111'], 6: ['111', '100', '111', '101', '111'] };
  function digit(R, n, x, y, col) { DIG[n].forEach((row, j) => { for (let i = 0; i < 3; i++) if (row[i] === '1') R(x + i, y + j, 1, 1, col); }); }
  function disc(R, cx, cy, r, col) { for (let y = Math.floor(cy - r); y <= cy + r; y++) { const h = Math.sqrt(Math.max(0, r * r - (y - cy) * (y - cy))); if (h > 0) R(cx - h, y, h * 2, 1, col); } }

  /* ---------- 南天（返程时站到岩石上看的那一片） ----------
     设计：南天极 P=(140,60)；南十字长轴从顶上的星往下穿过最下面那颗，再延长 4.5 个十字长度正好到 P；
     两颗指极星连线的中垂线也过 P；P 垂直落到地平线（y=100）正对 4 号白蚁丘。 */
  const POLE = [140, 84], HZ = 108, MXS = [20, 60, 100, 140, 180, 220];
  function crossStars() {   // 南十字：长轴往下延长 4.5 个十字长度到南天极
    const L = 14, D = 63, ph = 35 * Math.PI / 180, u = [Math.cos(ph), -Math.sin(ph)], n = [Math.sin(ph), Math.cos(ph)];
    const A = [POLE[0] + u[0] * D, POLE[1] + u[1] * D], G = [A[0] + u[0] * L, A[1] + u[1] * L], C = [A[0] + u[0] * L * .58, A[1] + u[1] * L * .58];
    const B = [C[0] - n[0] * 5, C[1] - n[1] * 5], Dl = [C[0] + n[0] * 4, C[1] + n[1] * 4];
    return { A, G, B, D: Dl, E: [(A[0] + Dl[0]) / 2 + 1, (A[1] + Dl[1]) / 2 + 1], coal: [(A[0] + B[0]) / 2 - n[0] * 5 + u[0] * -3, (A[1] + B[1]) / 2 - n[1] * 5 + u[1] * -3] };
  }
  function pointerStars() {   // 指极星：两颗连线的中垂线过南天极
    const ps = 150 * Math.PI / 180, u = [Math.cos(ps), -Math.sin(ps)], p = [Math.sin(ps), Math.cos(ps)];
    const M = [POLE[0] + u[0] * 60, POLE[1] + u[1] * 60];
    return { M, beta: [M[0] - p[0] * 6, M[1] - p[1] * 6], alpha: [M[0] + p[0] * 6, M[1] + p[1] * 6] };
  }
  function markSil(R, i, x, b, col, rim) {   // 地平线上的六个剪影（地图上的实体长得一样）
    if (i === 0) { R(x - 1, b - 16, 2, 16, col); R(x - 6, b - 13, 5, 1, col); R(x - 6, b - 16, 1, 3, col); R(x + 1, b - 11, 5, 1, col); R(x + 5, b - 14, 1, 3, col); R(x - 3, b - 19, 1, 3, col); R(x + 2, b - 18, 1, 2, col); R(x - 1, b - 16, 1, 16, rim); }
    if (i === 1) { R(x - 6, b - 4, 12, 4, col); R(x - 4, b - 7, 8, 3, col); R(x - 2, b - 10, 5, 3, col); R(x - 1, b - 12, 3, 2, col); R(x - 4, b - 7, 8, 1, rim); }
    if (i === 2) { R(x - 1, b - 11, 2, 11, col); R(x - 12, b - 8, 11, 1, col); R(x + 1, b - 8, 11, 1, col); R(x - 12, b - 5, 11, 1, col); R(x + 1, b - 5, 11, 1, col); R(x - 12, b - 9, 1, 9, col); R(x + 11, b - 9, 1, 9, col); R(x - 1, b - 11, 2, 1, rim); }
    if (i === 3) { for (let k = 0; k < 14; k++) { const w = Math.max(1, Math.round(1 + k * .45)); R(x - w, b - 14 + k, w * 2, 1, col); } R(x + 1, b - 13, 1, 4, rim); R(x - 3, b - 7, 1, 2, rim); }
    if (i === 4) { for (let k = 0; k < 6; k++) { const w = Math.round(Math.sqrt(36 - (5 - k) * (5 - k) * .9) * 1.3); R(x - w, b - 6 + k, w * 2, 1, col); } R(x - 4, b - 6, 8, 1, rim); }
    if (i === 5) { R(x - 5, b - 5, 10, 5, col); R(x - 6, b - 3, 12, 3, col); R(x - 3, b - 7, 3, 2, col); R(x + 1, b - 6, 3, 2, col); R(x - 3, b - 7, 3, 1, rim); }
  }
  let SKYC = null;
  function skyCanvas() {
    if (SKYC) return SKYC;
    const c = mk(240, 150), g = c.getContext('2d');
    const R = (x, y, w, h, col) => { g.fillStyle = col; g.fillRect(Math.round(x), Math.round(y), Math.ceil(w), Math.ceil(h)); };
    const gr = g.createLinearGradient(0, 0, 0, HZ); gr.addColorStop(0, '#02030a'); gr.addColorStop(.7, '#0a1024'); gr.addColorStop(1, '#1c2238'); g.fillStyle = gr; g.fillRect(0, 0, 240, HZ);
    /* 银河：从左下斜着穿过指极星和十字，一路伸到右上 */
    for (let i = 0; i < 1100; i++) {
      const x = -10 + hash(i, 1, 28) * 260, cy = 70 - x * .19 + Math.sin(x * .03) * 4;
      const off = (hash(i, 2, 28) + hash(i, 3, 28) + hash(i, 4, 28) - 1.5) * 16;
      R(x, cy + off, 1, 1, `rgba(170,185,235,${.03 + hash(i, 5, 28) * .08})`);
    }
    const X = crossStars(), P = pointerStars();
    disc(R, X.coal[0], X.coal[1], 5, 'rgba(2,3,10,.7)');   // 煤袋：十字旁边那块黑
    for (let i = 0; i < 110; i++) R(hash(i, 6, 28) * 240, hash(i, 7, 28) * (HZ - 4), 1, 1, `rgba(210,218,255,${.08 + hash(i, 8, 28) * .24})`);
    const glow = (p, r, col) => { const q = g.createRadialGradient(p[0] + .5, p[1] + .5, 0, p[0] + .5, p[1] + .5, r); q.addColorStop(0, col); q.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = q; g.fillRect(p[0] - r, p[1] - r, r * 2 + 1, r * 2 + 1); };
    const star = (p, s, col, gc) => { if (gc) glow(p, s + 3, gc); R(p[0], p[1], 1, 1, col); if (s > 1) { R(p[0] - 1, p[1], 3, 1, col); R(p[0], p[1] - 1, 1, 3, col); } if (s > 2) { R(p[0] - 2, p[1], 5, 1, 'rgba(255,255,255,.4)'); R(p[0], p[1] - 2, 1, 5, 'rgba(255,255,255,.4)'); } };
    star(X.A, 3, '#eef4ff', 'rgba(180,200,255,.55)'); star(X.G, 3, '#ffc29a', 'rgba(255,170,120,.45)'); star(X.B, 3, '#eef4ff', 'rgba(180,200,255,.5)'); star(X.D, 2, '#dfe6ff', 'rgba(180,200,255,.35)'); star(X.E, 1, '#c8d0f0');
    star(P.alpha, 3, '#fff4d0', 'rgba(255,230,170,.6)'); star(P.beta, 3, '#eef4ff', 'rgba(190,210,255,.55)');
    /* 假十字：更大、更暗，旁边没有亮星 */
    const FC = [222, 26]; [[0, -10], [0, 10], [-7, 1], [7, -1]].forEach(([a, b]) => star([FC[0] + a, FC[1] + b], 2, 'rgba(200,210,245,.7)'));
    /* 地面、剪影与标号（标号写在剪影上方的天上，对话框高的设备也挡不住） */
    R(0, HZ, 240, 50, '#0a0706'); R(0, HZ, 240, 1, '#2a1e16');
    for (let i = 0; i < 40; i++) R(hash(i, 9, 28) * 240, HZ + 2 + hash(i, 10, 28) * 40, 2, 1, '#1a120c');
    MXS.forEach((x, i) => { markSil(R, i, x, HZ, '#050403', '#2c2218'); digit(R, i + 1, x - 1, HZ - 27, '#d8c8a4'); });
    SKYC = c; return c;
  }
  /* 答对以后：把两条线和落点画出来 */
  function skyLines(g, ox, oy, s, t) {
    const X = crossStars(), P = pointerStars(), T = (p) => [ox + p[0] * s, oy + p[1] * s];
    g.save(); g.lineWidth = Math.max(1, s * .6); g.setLineDash([3 * s, 3 * s]); g.lineDashOffset = -t * 8;
    const line = (a, b, col) => { const A = T(a), B = T(b); g.strokeStyle = col; g.beginPath(); g.moveTo(A[0], A[1]); g.lineTo(B[0], B[1]); g.stroke(); };
    line(X.G, POLE, 'rgba(255,220,160,.7)'); line(P.M, POLE, 'rgba(180,210,255,.7)'); line(POLE, [POLE[0], HZ], 'rgba(255,255,255,.75)');
    g.setLineDash([]); const Q = T(POLE); g.fillStyle = 'rgba(255,255,255,.9)'; g.fillRect(Q[0] - s, Q[1] - s, s * 2, s * 2); g.restore();
  }
  /* ---------- 精灵 ---------- */
  const SPRITES = {
    skyview(g, e, t) {   // 全屏星空（只在看天的剧本里显示；此时地图黑暗度临时设为 0）
      const c = skyCanvas(), s = Math.min(VW / 240, VH / 150), w = 240 * s, h = 150 * s, ox = (VW - w) / 2, oy = Math.max(0, (VH - h) / 2 - VH * .06);
      g.fillStyle = '#02030a'; g.fillRect(0, 0, VW, VH);
      g.fillStyle = '#0a0706'; g.fillRect(0, oy + HZ * s, VW, VH);
      g.imageSmoothingEnabled = false; g.drawImage(c, ox, oy, w, h);
      if (e.lines) skyLines(g, ox, oy, s, t);
      /* 1 号上方那盏「宅院的灯」：扁扁的，一直在抖（逆温层里的蜃景） */
      const fx = ox + 20 * s, fy = oy + (HZ - 5) * s, sh = Math.sin(t * 7) * 1.2 * s;
      const gr = g.createRadialGradient(fx, fy, 0, fx, fy, 9 * s); gr.addColorStop(0, 'rgba(255,220,150,.9)'); gr.addColorStop(.3, 'rgba(255,190,110,.35)'); gr.addColorStop(1, 'rgba(255,160,80,0)');
      g.save(); g.translate(fx, fy); g.scale(1.8, .55 + Math.sin(t * 3) * .08); g.translate(-fx, -fy); g.fillStyle = gr; g.beginPath(); g.arc(fx + sh, fy, 9 * s, 0, 7); g.fill(); g.restore();
      for (let i = 0; i < 6; i++) { const k = (i * 37 + Math.floor(t * 3)) % 150; g.fillStyle = 'rgba(255,255,255,.6)'; g.fillRect(ox + hash(k, 11, 28) * w, oy + hash(k, 12, 28) * (HZ - 6) * s, 1, 1); }
    },
    minmin(g, e, t) {   // 那团光：白里透蓝，一明一暗，像在呼吸；偶尔变红变绿
      const sz = e.sz ?? 1, x = e.sx + 8, y = e.sy + 2 + Math.sin(t * 1.7 + (e.px || 0) * .01) * 2;
      const pul = (.86 + Math.sin(t * 3.1) * .1 + (Math.random() < .03 ? -.25 : 0)) * sz, r = 6 * pul;
      const tint = Math.sin(t * .23 + 1) > .93 ? [255, 150, 140] : Math.sin(t * .19 + 4) > .95 ? [160, 255, 190] : [200, 222, 255];
      const gr = g.createRadialGradient(x, y, 0, x, y, r * 3.2);
      gr.addColorStop(0, 'rgba(255,255,252,.98)'); gr.addColorStop(.16, `rgba(${tint[0]},${tint[1] + 20 > 255 ? 255 : tint[1] + 20},255,.85)`);
      gr.addColorStop(.42, `rgba(${tint[0]},${tint[1]},${tint[2]},.26)`); gr.addColorStop(1, `rgba(${tint[0]},${tint[1]},${tint[2]},0)`);
      g.fillStyle = gr; g.beginPath(); g.arc(x, y, r * 3.2, 0, 7); g.fill();
      g.fillStyle = 'rgba(200,220,255,.10)'; g.fillRect(x - r * 2, e.sy + 14, r * 4, 2);
    },
    fakelight(g, e, t) {   // 远处「宅院的灯」：两扇亮着的窗，压得扁扁的、一直在抖
      const x = e.sx + 8 + Math.sin(t * 6) * 1.2, y = e.sy + 6, a = .7 + Math.sin(t * 2.3) * .2;
      const gr = g.createRadialGradient(x, y, 0, x, y, 16); gr.addColorStop(0, `rgba(255,214,140,${a})`); gr.addColorStop(1, 'rgba(255,170,90,0)');
      g.save(); g.translate(x, y); g.scale(1.6, .6); g.translate(-x, -y); g.fillStyle = gr; g.beginPath(); g.arc(x, y, 16, 0, 7); g.fill(); g.restore();
      g.fillStyle = `rgba(255,236,180,${a})`; g.fillRect(x - 6, y - 1, 4, 2); g.fillRect(x + 2, y - 1, 4, 2);
    },
    eyes(g, e, t, R) { if (e.off) return; const b = Math.sin(t * .9 + e.x) > .95; if (b) return; R(3, 6, 2, 1, '#9cff9c'); R(7, 6, 2, 1, '#9cff9c'); R(10, 11, 1, 1, '#7ae07a'); R(13, 11, 1, 1, '#7ae07a'); },
    boots(g, e, t, R) { const c = 'rgba(30,14,8,.55)'; R(3, 4, 3, 5, c); R(3, 3, 2, 1, c); R(10, 9, 3, 5, c); R(10, 8, 2, 1, c); },
    ute(g, e, t, R) {   // 皮卡（2 格宽），车头朝右
      const c = e.col || '#d8d4c8';
      R(1, 13, 30, 2, 'rgba(0,0,0,.35)');
      R(0, 2, 30, 9, c); R(0, 2, 30, 1, shade(c, .2)); R(0, 10, 30, 1, shade(c, -.35));
      R(1, -1, 17, 3, shade(c, -.3)); R(1, -1, 1, 4, shade(c, -.4)); R(17, -1, 1, 4, shade(c, -.4));
      R(18, -6, 11, 9, c); R(18, -6, 11, 1, shade(c, .25)); R(20, -4, 7, 5, e.open ? '#0c0c0c' : '#3a5060'); R(21, -4, 2, 1, '#8aa0b0');
      if (e.open) { R(26, -5, 2, 14, shade(c, -.2)); R(27, -4, 3, 12, shade(c, -.35)); }
      R(28, -1, 4, 12, '#2e2e2e'); R(29, 1, 2, 2, '#555'); R(29, 6, 2, 2, '#555');
      R(3, 9, 6, 6, '#141414'); R(21, 9, 6, 6, '#141414'); R(5, 11, 2, 2, '#6a6a6a'); R(23, 11, 2, 2, '#6a6a6a');
      R(0, 4, 1, 3, '#a02020');
      if (e.lamps) { R(30, 3, 2, 3, e.dim ? '#c8a860' : '#fff6c8'); }
      R(5, 3, 8, 1, shade(c, -.15));
    },
    windmill(g, e, t, R) {   // 南十字牌风车：铁架塔，顶上一圈叶片
      const L = '#8a8a86', D = '#55554f';
      R(2, 14, 12, 2, 'rgba(0,0,0,.3)');
      for (let i = 0; i < 9; i++) { const y = 10 - i * 6, hw = 6 - i * .55; R(8 - hw, y, 1, 6, L); R(8 + hw, y, 1, 6, L); if (i % 2 === 0) R(8 - hw, y, hw * 2, 1, D); else { R(8 - hw + 1, y + 2, hw * 2 - 1, 1, D); } }
      const cx = 8, cy = -48, a = t * (e.off ? .35 : 1.2);
      for (let k = 0; k < 12; k++) { const ang = a + k * Math.PI / 6; for (let r = 3; r < 10; r++) R(cx + Math.cos(ang) * r, cy + Math.sin(ang) * r * .9, 1, 1, r > 6 ? '#b0b0aa' : '#8a8a84'); }
      R(cx - 1, cy - 1, 3, 3, '#4a4a46'); R(cx + 2, cy - 1, 10, 2, '#6a6a64'); R(cx + 10, cy - 5, 6, 9, '#9a9a94'); R(cx + 11, cy - 2, 4, 1, '#6a3a2a'); R(cx + 11, cy, 4, 1, '#6a3a2a');
    },
    tank(g, e, t, R) {   // 波纹铁皮水箱（2×2）
      R(0, 30, 32, 2, 'rgba(0,0,0,.35)');
      R(1, -2, 30, 32, '#8a9098'); for (let x = 2; x < 31; x += 3) R(x, -2, 1, 32, '#6e747c');
      R(1, -4, 30, 3, '#a8aeb6'); R(4, -6, 24, 2, '#9aa0a8'); R(1, 14, 30, 1, '#6a7078'); R(23, 22, 3, 6, '#5a5a5a'); R(22, 27, 5, 2, '#4a4a4a');
    },
    genset(g, e, t, R) {   // 柴油发电机
      const j = e.off ? 0 : (Math.sin(t * 50) > 0 ? 1 : 0);
      R(1, 13, 14, 2, 'rgba(0,0,0,.3)'); box(R, 1, 3 + j, 14, 11, '#c8a830'); R(3, 5 + j, 6, 6, '#2a2a2a'); for (let y = 6; y < 11; y += 2) R(3, y + j, 6, 1, '#5a5a5a');
      R(11, 5 + j, 2, 2, e.off ? '#3a1a1a' : '#ff4030'); R(12, -3, 2, 7, '#4a4a4a');
      if (!e.off) for (let i = 0; i < 4; i++) R(12 + Math.round(Math.sin(t * 3 + i)), -5 - i * 3, 2, 2, `rgba(120,120,120,${.4 - i * .08})`);
    },
    board(g, e, t, R) { box(R, 1, 1, 14, 11, '#e8e6dc', '#8a8a86'); R(3, 3, 8, 1, '#3a4a8a'); R(3, 5, 10, 1, '#3a4a8a'); R(3, 7, 6, 1, '#3a4a8a'); R(3, 9, 9, 1, '#c03030'); R(11, 7, 2, 2, '#c03030'); },
    frame(g, e, t, R) { box(R, 3, 1, 10, 12, '#5a4030'); R(4, 2, 8, 10, '#d8ccaa'); R(5, 3, 6, 2, '#5a5040'); for (let y = 6; y < 11; y += 2) R(5, y, 6, 1, '#8a8068'); },
    torchhook(g, e, t, R) { R(7, 3, 2, 2, '#6a6a6a'); if (!e.got) { R(6, 4, 4, 8, '#2a2a2a'); R(6, 11, 4, 2, '#ffeaa0'); R(6, 4, 4, 1, '#555'); } },
    waterbag(g, e, t, R) { R(7, 1, 2, 2, '#6a6a6a'); if (!e.got) { R(8, 2, 1, 2, '#8a7a5a'); R(4, 4, 8, 9, '#c8b088'); R(4, 4, 8, 1, '#a89068'); R(5, 8, 6, 4, '#a89470'); R(10, 3, 2, 2, '#3a3a3a'); } },
    bulb(g, e, t, R) { R(8, -2, 1, 5, '#222'); R(6, 3, 5, 2, '#3a3a3a'); R(7, 5, 3, 3, e.off ? '#4a4a44' : '#fff6c8'); if (!e.off) R(6, 8, 5, 1, 'rgba(255,240,180,.4)'); },
    firedrum(g, e, t, R) {
      R(2, 14, 12, 2, 'rgba(0,0,0,.35)'); box(R, 3, 4, 10, 11, '#5a4236'); R(3, 7, 10, 1, '#3a2a22'); R(3, 11, 10, 1, '#3a2a22'); R(5, 5, 2, 9, '#7a5a46');
      if (!e.off) for (let i = 0; i < 6; i++) { const h = 3 + Math.round(Math.sin(t * 9 + i * 1.7) * 2 + 2); R(4 + i * 1.5, 4 - h, 2, h, i % 2 ? '#ffb040' : '#ff6a20'); }
      else R(5, 3, 6, 1, '#3a3a3a');
    },
    uhf(g, e, t, R) {   // 门廊桌子上的 UHF 对讲机
      R(0, 6, 16, 3, '#6a4a32'); R(1, 9, 2, 6, '#4a3222'); R(13, 9, 2, 6, '#4a3222');
      box(R, 3, 0, 10, 6, '#2a2a2a'); R(4, 1, 5, 3, '#5a7a5a'); R(10, 2, 2, 2, '#888');
      R(10, 4, 2, 1, e.rx && Math.sin(t * 14) > 0 ? '#ff3020' : '#30c040'); R(12, -9, 1, 9, '#9a9a9a');
      R(1, 3, 2, 3, '#1a1a1a'); R(0, 4, 1, 1, '#555');
    },
    dog(g, e, t, R) {   // 蓝色赶牛犬
      const c = '#5e6e80', d = '#3a4452', tail = Math.sin(t * (e.wag ? 16 : 2.5)) > 0 ? 1 : 0, up = e.alert ? -1 : 0;
      R(2, 14, 12, 1, 'rgba(0,0,0,.3)');
      R(3, 7, 9, 5, c); R(3, 7, 9, 1, shade(c, .18)); R(4, 8, 3, 2, d); R(8, 9, 2, 1, d); R(5, 11, 4, 1, '#b07a50');
      R(11, 4 + up, 4, 4, c); R(11, 2 + up, 1, 3, d); R(13, 2 + up, 1, 3, d); R(14, 6 + up, 2, 2, '#b07a50'); R(15, 6 + up, 1, 1, '#111'); R(13, 5 + up, 1, 1, '#111');
      R(4, 12, 1, 3, c); R(6, 12, 1, 3, d); R(9, 12, 1, 3, c); R(11, 12, 1, 3, d);
      R(1, 6 - tail, 2, 2, c); R(2, 7, 1, 2, c);
    },
    plaque(g, e, t, R) { R(3, 2, 2, 13, '#4a3a2a'); R(11, 2, 2, 13, '#4a3a2a'); box(R, 0, -9, 16, 12, '#2a3a2a', '#151c15'); R(2, -7, 12, 1, '#c8c0a0'); R(2, -5, 9, 1, '#a8a088'); R(2, -3, 11, 1, '#a8a088'); R(2, -1, 7, 1, '#a8a088'); },
    chimney(g, e, t, R) { R(1, 13, 14, 2, 'rgba(0,0,0,.3)'); for (let y = -22; y < 14; y += 3) { const o = (y / 3) % 2 ? 0 : 2; for (let x = 2 + o; x < 14; x += 4) R(x, y, 3, 2, shade('#7a6a5a', (hash(x, y, 4) - .5) * .3)); } R(2, -22, 12, 1, '#4a3e34'); R(5, 4, 6, 8, '#140e0a'); R(5, 4, 6, 1, '#3a2e24'); },
    bedstead(g, e, t, R) { const c = '#6a3a24'; R(1, 2, 2, 12, c); R(13, 2, 2, 12, c); R(1, 2, 14, 1, c); R(1, 6, 14, 1, c); for (let x = 4; x < 13; x += 3) R(x, 3, 1, 3, c); R(1, 12, 14, 1, '#4a2a1a'); },
    bottles(g, e, t, R) { R(3, 9, 2, 4, 'rgba(110,150,100,.75)'); R(3, 8, 1, 1, 'rgba(110,150,100,.75)'); R(8, 11, 4, 2, 'rgba(140,100,60,.7)'); R(12, 10, 1, 1, 'rgba(140,100,60,.7)'); R(6, 13, 2, 1, 'rgba(200,220,220,.5)'); },
    grave(g, e, t, R) {
      R(2, 12, 12, 3, '#3a2a20'); for (let x = 2; x < 14; x += 3) R(x, 11, 2, 2, '#5a4a40');
      const k = e.kind || 0;
      if (k === 0) { R(7, -4, 2, 15, '#6a5a44'); R(3, -1, 10, 2, '#6a5a44'); R(7, -4, 1, 15, '#8a7a5e'); }
      else if (k === 1) { R(2, -1, 1, 12, '#3a2a24'); R(13, -1, 1, 12, '#3a2a24'); R(2, -1, 12, 1, '#3a2a24'); R(2, 5, 12, 1, '#3a2a24'); for (let x = 4; x < 13; x += 3) R(x, 0, 1, 11, '#4a3a30'); }
      else { R(5, 4, 6, 8, '#6a6258'); R(5, 4, 6, 1, '#8a8278'); R(4, 9, 2, 2, '#5a5248'); R(10, 8, 2, 3, '#5a5248'); }
    },
    camera(g, e, t, R) { if (Math.sin(t * 5) > 0) R(5, -3, 1, 1, '#ff3020'); R(7, 2, 1, 13, '#2a2a2a'); R(4, 14, 1, 1, '#2a2a2a'); R(11, 14, 1, 1, '#2a2a2a'); R(5, 9, 1, 5, '#2a2a2a'); R(10, 9, 1, 5, '#2a2a2a'); box(R, 3, -2, 10, 5, '#1a1a1a'); R(11, -1, 3, 3, '#3a3a3a'); R(12, 0, 1, 1, '#8ac0ff'); R(4, -3, 3, 1, '#3a3a3a'); },
    deadtree(g, e, t, R) { markSil(R, 0, 8, 15, '#a8a090', '#d8d0c0'); R(5, 14, 7, 2, 'rgba(0,0,0,.3)'); },
    cairn(g, e, t, R) { markSil(R, 1, 8, 15, '#6a5a50', '#9a8a7e'); },
    fpost(g, e, t, R) { markSil(R, 2, 8, 15, '#7a6248', '#a88a68'); },
    termite(g, e, t, R) { markSil(R, 3, 8, 15, '#9a5434', '#c8784e'); R(3, 14, 10, 2, 'rgba(0,0,0,.3)'); if (e.mark) { const a = .5 + Math.sin(t * 3) * .4; R(7, -6, 2, 1, `rgba(255,250,220,${a})`); R(8, -7, 1, 3, `rgba(255,250,220,${a})`); } },
    mound(g, e, t, R) { markSil(R, 4, 8, 15, '#6a4030', '#8a5a44'); },
    saltbush(g, e, t, R) { markSil(R, 5, 8, 15, '#6a7a6a', '#94a494'); },
    dust(g, e, t) {   // 旋风卷起的红沙：一道道斜着扫过整个画面
      g.fillStyle = 'rgba(120,50,24,.35)'; g.fillRect(0, 0, VW, VH);
      for (let i = 0; i < 260; i++) { const y = (hash(i, 1, 99) * VH + t * 40) % VH, x = (hash(i, 2, 99) * VW + t * (260 + hash(i, 3, 99) * 200)) % (VW + 20) - 10; g.fillStyle = i % 3 ? 'rgba(200,110,60,.55)' : 'rgba(240,170,110,.6)'; g.fillRect(x | 0, y | 0, 3 + (i % 4), 1); }
    },
    bones(g, e, t, R) { R(1, 13, 14, 2, 'rgba(0,0,0,.25)'); R(11, 6, 4, 5, '#e8e2d0'); R(12, 8, 1, 1, '#2a2018'); R(14, 8, 1, 1, '#2a2018'); R(10, 5, 2, 1, '#d8d2c0'); R(15, 5, 1, 2, '#d8d2c0'); R(2, 9, 9, 1, '#d8d2c0'); for (let x = 3; x < 11; x += 2) R(x, 5 + (x % 4 ? 1 : 0), 1, 8, '#e0dac8'); },
    tinbox(g, e, t, R) { R(3, 12, 10, 2, 'rgba(0,0,0,.25)'); box(R, 3, 7, 10, 6, '#7a4a2a'); R(4, 8, 8, 1, '#a0603a'); R(6, 10, 4, 2, '#c8a050'); R(5, 12, 2, 1, '#3a2010'); },
    rise(g, e, t, R) { R(0, 12, 16, 4, 'rgba(0,0,0,.35)'); R(1, 4, 14, 10, '#6a4a3a'); R(2, 2, 12, 3, '#8a6450'); R(3, 2, 8, 1, '#a07a62'); R(4, 7, 3, 2, '#4a3226'); R(10, 9, 4, 2, '#4a3226'); R(1, 12, 14, 2, '#4a3226'); }
  };

  /* ---------- 瓦片 ---------- */
  const TILES = {
    gibber: { solid: false, paint(R, X, Y) { speck(R, '#4e2c1e', ['#64382a', '#3c2016', '#72462e', '#2e180e'], X, Y, 22, 61); for (let i = 0; i < 3; i++) { const h = hash(X, Y, 70 + i); R((h * 13) | 0, (hash(X, Y, 74 + i) * 14) | 0, 2 + (i % 2), 1, i % 2 ? '#7a4c34' : '#5a3424'); } } },
    redsand: { solid: false, paint(R, X, Y) { speck(R, '#5e3624', ['#6c4230', '#50301e'], X, Y, 12, 62); } },
    chan: { solid: false, paint(R, X, Y) { speck(R, '#7a6650', ['#8a765e', '#6a5642', '#94806a'], X, Y, 14, 63); if (hash(X, Y, 64) < .5) R(2, (hash(X, Y, 65) * 12) | 0, 9, 1, '#8e7a62'); } },
    bank: { solid: true, paint(R, X, Y) { R(0, 0, 16, 16, '#3a2216'); R(0, 0, 16, 3, '#6e4630'); R(0, 0, 16, 1, '#8a5e40'); R(0, 13, 16, 3, '#2a180e'); for (let i = 0; i < 3; i++) R((hash(X, Y, 66 + i) * 13) | 0, 4 + i * 3, 3, 1, '#2a160c'); } },
    spin: { solid: true, paint(R, X, Y) { TILES.gibber.paint(R, X, Y); R(2, 7, 12, 7, '#4a4a26'); for (let i = 0; i < 9; i++) { const x = 2 + ((hash(X, Y, 80 + i) * 12) | 0); R(x, 3 + (i % 4), 1, 9 - (i % 4), i % 2 ? '#8a8a4a' : '#6e6e38'); } R(2, 13, 12, 1, '#2a2a14'); } },
    boulder: { solid: true, paint(R, X, Y) { TILES.gibber.paint(R, X, Y); R(2, 5, 12, 9, '#4a3a34'); R(3, 4, 9, 2, '#5e4c44'); R(4, 6, 4, 2, '#6e5a50'); R(2, 12, 12, 2, '#2a201c'); } },
    coolabah: { solid: true, paint(R, X, Y) { TILES.gibber.paint(R, X, Y); const c = '#4a5a48'; R(1, 2, 14, 10, c); R(2, 1, 12, 12, c); R(3, 3, 6, 4, '#62725e'); R(9, 8, 4, 3, '#34402f'); R(7, 11, 2, 5, '#d8d0c0'); R(6, 13, 1, 2, '#b8b0a0'); } },
    track: { solid: false, paint(R, X, Y) { speck(R, '#6a3e26', ['#7a4a30', '#5a321e'], X, Y, 12, 67); R(3, 0, 2, 16, '#5a321e'); R(11, 0, 2, 16, '#5a321e'); } },
    ruinw: { solid: true, paint(R, X, Y) { TILES.gibber.paint(R, X, Y); for (let r = 0; r < 2; r++) for (let c = 0; c < 3; c++) R(c * 5 + (r % 2) * 2, 5 + r * 4, 4, 3, shade('#7a6c5e', (hash(X * 3 + c, Y * 2 + r, 68) - .5) * .35)); R(0, 13, 16, 2, '#3a2e24'); } },
    wire: { solid: true, paint(R, X, Y) { TILES.gibber.paint(R, X, Y); R(0, 5, 16, 1, '#5a4a40'); R(0, 9, 16, 1, '#5a4a40'); R(1, 2, 2, 12, '#4a3a30'); R(9, 3, 1, 10, '#3a2e26'); R(13, 3, 1, 10, '#3a2e26'); } }
  };
  const OUT = { a: 'gibber', y: 'redsand', i: 'chan', v: 'bank', S: 'spin', O: 'boulder', Q: 'coolabah', j: 'track', U: 'ruinw', F: 'wire' };

  /* ---------- 人物 ---------- */
  const PEOPLE = {
    me: { key: 'ayuan', skin: '#e8c09a', hair: '#1a1412', hs: 'short', top: '#7a6a48', top2: '#5a4c34', bottom: '#34405a', shoes: '#4a3020', hat: 'cap', hatC: '#3a4a3a' },
    jack: { key: 'jack', skin: '#d4a07a', hair: '#d8d4cc', hs: 'short', top: '#4a6a8a', top2: '#3a5470', bottom: '#5a4a38', shoes: '#3a2818', hat: 'straw', hatC: '#6a5034',
      extra(g, d, fr, G, R) { if (d === 0) { R(5, G.hT + 6, 6, 2, '#e8e4dc'); R(6, G.hT + 8, 4, 1, '#e8e4dc'); } else if (d === 1) R(3, G.hT + 6, 4, 3, '#e8e4dc'); } },
    lena: { key: 'lena', skin: '#f0d2bc', hair: '#d8b860', hs: 'long', top: '#a83a32', top2: '#7a2a24', bottom: '#34405a', shoes: '#5a3a20' }
  };

  /* ---------- 惊吓大头像（32×32）：凑到眼前的那团光——一圈一圈的白，中间一个越张越大的黑洞 ---------- */
  const FACES = {
    minmin(R, a, t) {
      R(0, 0, 32, 32, '#020208');
      const j = () => (Math.random() - .5) * 1.2;
      disc(R, 16, 16, 15.5, '#141a34'); disc(R, 16, 16, 13.5 + j(), '#2e3c70'); disc(R, 16, 16, 11.5 + j(), '#7486c4');
      disc(R, 16, 16, 9.5 + a * 1.5, '#d6e2ff'); disc(R, 16, 16, 7 + a, '#ffffff');
      if (a > .55) { const c = Math.random() < .5 ? 'rgba(255,90,80,.5)' : 'rgba(90,255,140,.45)'; for (let k = 0; k < 10; k++) { const an = k * .63 + t * 2; R(16 + Math.cos(an) * 12, 16 + Math.sin(an) * 12, 2, 2, c); } }
      for (let k = 0; k < 14; k++) { const an = k * .45 + t * .7; for (let r = 3 + a * 3; r < 7 + a; r++) R(16 + Math.cos(an) * r, 16 + Math.sin(an) * r, 1, 1, 'rgba(120,140,200,.55)'); }
      const pr = 1 + a * 5.5; disc(R, 16 + j() * .6, 16 + j() * .6, pr, '#06060c'); if (pr > 3) disc(R, 15, 15, pr * .35, '#000000');
    }
  };

  /* ---------- 地图行 ---------- */
  function grid(w, h, f) { const G = []; for (let y = 0; y < h; y++) { const r = []; for (let x = 0; x < w; x++) r.push(f(x, y)); G.push(r); } return G; }
  const join = G => G.map(r => r.join(''));
  function carveL(G, pts, keep) {   // 沿折线（先横后竖）挖出一条路，返回经过的格子
    const cells = [];
    const put = (x, y) => { if (!cells.length || cells[cells.length - 1][0] !== x || cells[cells.length - 1][1] !== y) cells.push([x, y]); if (!keep.includes(G[y][x])) G[y][x] = 'a'; };
    for (let i = 0; i < pts.length - 1; i++) {
      let [x, y] = pts[i]; const [tx, ty] = pts[i + 1];
      put(x, y);
      while (x !== tx) { x += Math.sign(tx - x); put(x, y); }
      while (y !== ty) { y += Math.sign(ty - y); put(x, y); }
    }
    return cells;
  }
  function homeRows() {
    const G = grid(30, 18, (x, y) => hash(x, y, 5) < .2 ? '"' : 'd');
    for (let x = 0; x < 30; x++) {
      for (const y of [0, 1]) G[y][x] = x <= 13 || (x >= 17 && x <= 23) ? '#' : 'T';
      if (x >= 1 && x <= 13) { G[2][x] = 'w'; G[3][x] = 'w'; }
      if (x >= 17 && x <= 23) G[2][x] = 'x';
      G[16][x] = 'f'; G[17][x] = 'T';
    }
    for (let y = 2; y < 18; y++) { G[y][0] = 'T'; G[y][29] = 'T'; }
    G[16][15] = 'm'; G[17][15] = 'd';
    return join(G);
  }
  const RUIN_FP = [[8, 10], [8, 6], [16, 6], [16, 1], [15, 1], [15, 0]];
  let RUIN_CELLS = [];
  function ruinsRows() {
    const G = grid(28, 20, (x, y) => hash(x, y, 7) < .22 ? 'y' : 'a');
    for (let y = 0; y < 20; y++) { G[y][0] = 'S'; G[y][27] = 'S'; G[y][3] = 'j'; G[y][4] = 'j'; }
    for (let x = 0; x < 28; x++) { if (x !== 3 && x !== 4 && (x < 14 || x > 16)) G[0][x] = 'S'; if (x !== 3 && x !== 4) G[19][x] = 'S'; }
    for (let x = 9; x <= 15; x++) for (let y = 7; y <= 11; y++) G[y][x] = (x === 9 || x === 15 || y === 7 || y === 11) ? 'U' : 'y';
    G[11][12] = 'a'; G[9][9] = 'a'; G[8][15] = 'a'; G[11][10] = 'a'; G[7][11] = 'a';
    for (let x = 18; x <= 24; x++) for (let y = 3; y <= 8; y++) if (x === 18 || x === 24 || y === 3 || y === 8) G[y][x] = 'F';
    G[8][21] = 'a';
    for (let y = 1; y < 19; y++) for (let x = 5; x < 27; x++) if (G[y][x] === 'a' && hash(x, y, 8) < .05 && !(x >= 17 && x <= 25 && y <= 9) && !(x >= 5 && x <= 8 && y >= 4 && y <= 17)) G[y][x] = 'S';
    RUIN_CELLS = carveL(G, RUIN_FP, ['j']);
    return join(G);
  }
  const PLAIN_FP = [[16, 38], [16, 36], [13, 35], [13, 29], [15, 27], [18, 26], [18, 17], [17, 14], [13, 13], [12, 11], [15, 11], [15, 7], [16, 5]];
  let PLAIN_CELLS = [];
  function plainRows() {
    const w = 32, h = 40;
    const G = grid(w, h, (x, y) => (x === 0 || x === w - 1 || y === 0 || y === h - 1) ? 'S' : hash(x, y, 3) < .25 ? 'y' : 'a');
    const band = (y0, y1, gaps) => { for (let x = 1; x < w - 1; x++) { G[y0][x] = 'v'; G[y1][x] = 'v'; for (let y = y0 + 1; y < y1; y++) G[y][x] = 'i'; } for (const gx of gaps) { G[y0][gx] = 'i'; G[y1][gx] = 'i'; } };
    band(30, 34, [12, 13, 26]); band(18, 21, [18, 19, 4]); band(8, 10, [15, 16]);
    for (let y = 1; y < h - 1; y++) for (let x = 1; x < w - 1; x++) {
      const c = G[y][x], hz = hash(x, y, 9);
      if ((c === 'a' || c === 'y') && hz < .07) G[y][x] = 'S'; else if ((c === 'a' || c === 'y') && hz < .11) G[y][x] = 'O';
      else if (c === 'v' && hash(x, y, 11) < .13) G[y][x] = 'Q';
    }
    const clear = (x0, y0, x1, y1) => { for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) if ('SOQ'.includes(G[y][x])) G[y][x] = 'a'; };
    clear(14, 2, 19, 6); clear(14, 36, 18, 38); clear(21, 25, 25, 29); clear(2, 18, 6, 22); clear(19, 11, 21, 13); clear(8, 35, 10, 37);
    for (const [gx, y0, y1] of [[12, 29, 35], [13, 29, 35], [26, 29, 35], [18, 17, 22], [19, 17, 22], [4, 17, 22], [15, 7, 11], [16, 7, 11]]) for (let y = y0; y <= y1; y++) for (let x = gx - 1; x <= gx + 1; x++) if ('SOQ'.includes(G[y][x])) G[y][x] = G[y][x] === 'Q' ? 'v' : 'a';
    for (const [gx, y0, y1] of [[12, 30, 34], [13, 30, 34], [26, 30, 34], [18, 18, 21], [19, 18, 21], [4, 18, 21], [15, 8, 10], [16, 8, 10]]) for (let y = y0; y <= y1; y++) G[y][gx] = 'i';
    G[3][17] = 'Q'; G[2][17] = 'Q';
    G[39][16] = 'a';
    PLAIN_CELLS = carveL(G, PLAIN_FP, ['i', 'v', 'Q']);
    return join(G);
  }
  /* 返程荒原：这张图「屏幕左边是南」——跟直觉相反，只有看星星才知道。 */
  const BACK_START = [24, 13];
  const MARK_XY = [[13, 23], [6, 22], [4, 18], [2, 12], [4, 6], [10, 2]];
  function backRows() {
    const w = 36, h = 26;
    const G = grid(w, h, (x, y) => (x === 0 || x === w - 1 || y === 0 || y === h - 1) ? 'S' : hash(x, y, 13) < .25 ? 'y' : 'a');
    for (let y = 1; y < h - 1; y++) { G[y][17] = 'v'; G[y][19] = 'v'; G[y][18] = 'i'; }
    for (const gy of [5, 20]) { G[gy][17] = 'i'; G[gy][19] = 'i'; }
    for (let y = 8; y <= 18; y++) { G[y][7] = 'v'; G[y][9] = 'v'; G[y][8] = 'i'; }
    G[10][7] = 'i'; G[10][9] = 'i';
    for (let y = 1; y < h - 1; y++) for (let x = 1; x < w - 1; x++) {
      const c = G[y][x], hz = hash(x, y, 14);
      if ((c === 'a' || c === 'y') && hz < .07) G[y][x] = 'S'; else if ((c === 'a' || c === 'y') && hz < .1) G[y][x] = 'O';
      else if (c === 'v' && hash(x, y, 15) < .12) G[y][x] = 'Q';
    }
    const clear = (x0, y0, x1, y1) => { for (let y = Math.max(1, y0); y <= Math.min(h - 2, y1); y++) for (let x = Math.max(1, x0); x <= Math.min(w - 2, x1); x++) if ('SO'.includes(G[y][x])) G[y][x] = 'a'; };
    clear(21, 10, 28, 16); clear(1, 10, 4, 15); clear(11, 12, 14, 16); clear(23, 22, 28, 24);
    for (const [x, y] of MARK_XY) clear(x - 1, y - 1, x + 1, y + 1);
    for (const gy of [5, 20]) clear(14, gy - 1, 22, gy + 1);
    clear(5, 9, 11, 11); clear(5, 6, 11, 7); clear(5, 19, 11, 20);
    G[13][0] = 'a';
    return join(G);
  }

  /* ---------- 目标 ---------- */
  function goalNow(S) {
    const f = S.f;
    if (f.phase === 'start') return '去门廊问老杰克：莉娜回来没有';
    if (f.phase === 'prep') {
      const need = [];
      if (!S.has('torch')) need.push('门边钩子上的手电筒');
      if (!S.has('water')) need.push('门廊柱子上的帆布水袋');
      return need.length ? '带上' + need.join('和') + '，再开皮卡出发' : '开皮卡去北边的敏敏老酒馆旧址找莉娜';
    }
    if (f.phase === 'out') {
      if (S.map === 'ruins') return f.readLena ? '跟着莉娜的靴印往北走——她进了荒原' : '看看莉娜的红皮卡里有什么';
      return '跟着靴印找莉娜（别追那团光）';
    }
    if (f.phase === 'back') return f.south ? '往白蚁丘（4 号）那边走：那边是南，是老酒馆和公路。别跑，别朝光走' : '迷路了。站到岩石上看南天，找出哪边是南（老杰克的画在「笺」里' + (S.coop ? '：一人念画，一人看天' : '') + '）';
    if (f.phase === 'home') return f.final1 ? '回到公路边你的白皮卡' : '穿过老酒馆旧址，回到公路边你的白皮卡';
    return '';
  }
  const upd = S => S.goal(goalNow(S));

  /* ================= 宅院 ================= */
  async function jackTalk(S) {
    const f = S.f;
    S.face('jack', 'pl');
    if (f.phase === 'start') return jackFirst(S);
    if (f.phase === 'prep') {
      const L = [
        ['敏敏是路北边那家老酒馆的名字。早烧没了，就剩几块石头、一圈小坟地。', '这光，就是打那儿得的名。'],
        ['这光不是我们这些白人先瞧见的。镇上原住民的老人说，他们的故事里早就有它了——比牧场老，比酒馆老。', '讲的是什么？那得他们自己讲，轮不到我这个老头子替人家讲。', '我只听说，有的老人觉得，白人来了以后，这光反倒多了。'],
        ['早年有人拿枪打过它。说一开枪它就灭了，过一会儿，又在别处亮起来。', '你别带枪。带枪的人，手比脑子快。'],
        ['有人说，追上它的人就回不来了。', '我没见过追上它的人。……我也不想见。'],
        ['抬头看看。看见那个小风筝没有？那就是南十字。', '风车尾巴上也写着「南十字」——这一带的风车，全是这个牌子。']
      ];
      await S.say('老杰克', L[(f._jk = ((f._jk ?? -1) + 1) % L.length)]);
      return upd(S);
    }
    await S.say('老杰克', '去吧。别追，也别跑。');
  }
  async function jackFirst(S) {
    const f = S.f; f.lock = true;
    await S.say('老杰克', ['莉娜？还没回来。下午四点去的 18 号井，说天黑前回。', '对讲机叫了三回，一回也没应。']);
    const r = S.ent('uhf'); r.s.rx = true;
    SND.squelch(S); SND.radioHiss(S, 6); S.sfx('tv');
    await S.say('对讲机', ['……阿远？杰克？……我在敏敏……老酒馆这边……', '有一盏灯，一直在路边跟着我……我停车，它也停……', '它在往后退……我去追它——'], { style: 'whisper' });
    SND.hum(S, .3); SND.squelch(S); r.s.rx = false;
    await S.narr('杂音里，好像还有一种很细很细的嗡嗡声。然后就什么都没有了。');
    S.ent('dog').s.alert = true; S.bubble('dog', '!', 1200); SND.dingo(S);
    await S.say('老杰克', ['……傻丫头。那是敏敏光。', '我这条腿开不了车。你去。记住——追它它就退，你跑它就跟。别追，也别跑。', '迷了路，别信地上的任何一盏灯。看南十字。宅院和公路，都在老酒馆正南。']);
    await S.note('cross');
    await S.say('老杰克', '手电在门边钩子上，水袋挂在柱子上。带上，开你那辆白皮卡去。');
    f.phase = 'prep'; f.lock = false;
    if (S.coop) S.toast('双人时：老杰克的画收在「笺」里——迷路时一个人念，一个人看天');
    upd(S);
  }
  async function uteHome(S) {
    const f = S.f;
    if (f.phase === 'start') return S.narr('你的白皮卡。车斗里堆着铁丝、桩子和半桶机油。\n……先去问问老杰克，莉娜到底回来没有。');
    const miss = [];
    if (!S.has('torch')) miss.push('外面没有一点灯，得带上手电。（门边的钩子上）');
    if (!S.has('water')) miss.push('莉娜在外面待了好几个钟头，得给她带水。（门廊柱子上的水袋）');
    if (miss.length) { await S.think(miss); return upd(S); }
    f.lock = true;
    await S.narr('你拉开车门，把手电和水袋扔到副驾驶上。');
    await S.say('老杰克', '等等——十点了。');
    SND.genOff(S); S.sfx('switch'); S.after(2600, async S => SND.dingo(S));
    for (const id of ['win1', 'win2', 'bulb', 'genset']) { const e = S.ent(id); e.off = true; if (e.lit) e.lit = false; }
    S.dark(.9);
    await S.narr('工具棚那边，发电机「突、突、突」地喘了几声，停了。\n门廊的灯泡暗下去，窗户一扇一扇地黑了。');
    await S.narr('整片牧场，一下子沉进了黑里。\n头顶的星星却一颗一颗地亮了出来，密得吓人。');
    await S.say('老杰克', ['看见没有？从现在起，这片地上，没有一盏灯是我们的。', '要是你在外面看见「宅院的灯」——那不是宅院。']);
    await S.narr('你发动了车子。车灯照亮了一段红土路，路两边的石子地一直铺进黑暗里。');
    await S.fade(1, 900);
    await S.card('四十分钟后', '', '红土路往北，一直往北。\n车灯里偶尔掠过一只袋鼠的影子，转眼又没进黑暗里。\n\n后视镜里，宅院早就看不见了。\n前面的路边，出现了几块黑黢黢的石头。\n\n——敏敏老酒馆旧址。');
    f.phase = 'out'; f.lock = false;
    await S.go('ruins', 5, 17, 3);
  }
  async function takeTorch(S) {
    const e = S.ent('torch_h');
    if (S.has('torch') || e.s.got) return S.narr('空钩子。');
    e.s.got = true; S.give('torch');
    await S.narr('一支铁皮长手电。推开开关，光柱黄黄的——电池该换了。');
    upd(S);
  }
  async function takeWater(S) {
    const e = S.ent('water_h');
    if (S.has('water') || e.s.got) return S.narr('柱子上只剩一颗钉子。');
    e.s.got = true; S.give('water');
    await S.narr('帆布水袋鼓鼓囊囊的，外面渗着一层水汽，摸上去是凉的。');
    upd(S);
  }

  /* ================= 老酒馆旧址 ================= */
  async function lenaUte(S) {
    const f = S.f;
    if (f.phase === 'home') return S.narr('莉娜的红皮卡。明天再叫人来拖吧。');
    if (S.once('lenaUte')) {
      await S.narr('莉娜的红皮卡斜停在路边，驾驶座的门敞着。\n车灯还亮着，已经黄得像两根快烧完的蜡烛——电瓶快没电了。');
      await S.narr('副驾驶座上扔着一本笔记本，压着一支圆珠笔。三脚架的套子空了。');
    }
    f.readLena = true;
    await S.note('lena');
    if (S.once('afterLena')) {
      await S.think('她把相机和三脚架都带走了……\n车门边的红土上，有一串靴印，往北，往荒原里去了。');
      if (S.coop) S.toast('双人时：一个人照着靴印走，一个人盯着四周有没有光');
    }
    upd(S);
  }
  async function riseScene(S) {
    const f = S.f; if (f.sawLight) return; f.sawLight = true; f.lock = true;
    const L = S.ent('mm_r'); L.s.sz = .15; setL(L, 21, 6.5); L.hidden = false;
    S.focus(20, 5);
    SND.hum(S, .2);
    await S.narr('墓地那边……有什么东西在亮。');
    for (let i = 0; i < 18; i++) { L.s.sz = .15 + i * .05; setL(L, 21, 6.5 - i * .12); if (i % 6 === 0) SND.hum(S, .3 + i * .03); await S.wait(70); }
    await S.narr('一团光，从那几座坟中间慢慢升了起来。先是像一点烟头，再像一盏马灯……\n你想起了相框里那张剪报。');
    S.focus(null);
    const [px, py] = plXY();
    let lx = 21, ly = 4.3;
    const dx = px - lx, dy = py - ly, d = Math.hypot(dx, dy), stop = Math.max(0, d - 3);
    for (let i = 1; i <= 14; i++) { const k = stop * i / 14 / d; setL(L, lx + dx * k, ly + dy * k); if (i % 4 === 0) SND.hum(S, .5 + i * .03); await S.wait(70); }
    S.sfx('heart');
    await S.narr('它朝你飘过来了。\n不快，也不慢。像是早就知道你会来。');
    await S.think('「你跑它就跟。」');
    const r = await S.ask('', ['（站着别动）', '（转身往车上跑）']);
    if (r === 1) {
      SND.rush(S); S.fx('flash', { dur: .7 }); S.shake(500, 3);
      const [qx, qy] = plXY(); setL(L, qx + .8, qy - .6);
      await S.narr('你刚一转身，后背就是一亮——\n它贴上来了。近得能听见一种很细的嗡嗡声。');
      await S.narr('你腿一软，跪在了石子地上。\n……它没有再往前。它就悬在那儿，像是在看你。');
      await S.think('不能跑。杰克说的是真的。');
      f.ruinRun = true;
    } else {
      await S.narr('你攥紧手电，一动不动。\n它在你面前三四步的地方停住了，一明一暗，像在喘气。');
    }
    SND.hum(S, .6);
    await S.narr('过了好一会儿，它慢慢地掉过头，贴着地面，往北边飘走了——\n正是那串靴印去的方向。');
    for (let i = 0; i < 16; i++) { setL(L, L.px / TS + (15 - L.px / TS) * .12, L.py / TS - .45); await S.wait(70); }
    await S.alpha('mm_r', 0, 600);
    L.alpha = 1;
    await S.think('它往莉娜那边去了。');
    f.lock = false; upd(S);
    S.cp('ruins2');
  }
  async function lastLight(S) {
    const f = S.f; if (f.final1) return; f.final1 = true; f.lock = true;
    const L = S.ent('mm_r'); L.s.sz = .9; setL(L, 21, 5.5); L.hidden = false; L.alpha = 1;
    SND.hum(S, .4); S.focus(19, 4);
    await S.narr('经过老酒馆的坟地时，那团光又从坟中间升了起来。');
    S.focus(null);
    const [px, py] = plXY(), dx = px - 21, dy = py - 5.5, d = Math.hypot(dx, dy) || 1, stop = Math.max(0, d - 1.6);
    for (let i = 1; i <= 16; i++) { const k = stop * i / 16 / d; setL(L, 21 + dx * k, 5.5 + dy * k); if (i % 4 === 0) SND.hum(S, .6 + i * .02); await S.wait(70); }
    S.sfx('heart');
    await S.narr('这一次，它离你们只有一步多远。');
    await S.say('莉娜', '……阿远。', { style: 'whisper' });
    const r = await S.ask('', ['（站住。握紧莉娜的手，不看它，也不跑）', '（拉着莉娜往皮卡跑）']);
    if (r === 1) return lightDeath(S, '你拉着莉娜刚迈开腿，身后就是一片白。\n\n「你跑它就跟。」\n老杰克的话，你听见了，可腿没听见。');
    SND.hum(S, 1);
    await S.narr('你们站着。\n光就悬在面前，近得能听见那种很细很细的嗡嗡声，像冬夜里电线在响。');
    await S.narr('它里面……什么也没有。\n没有灯芯，没有翅膀，没有脸。只有光。');
    await S.wait(500);
    await S.narr('过了很久——也许只有几秒钟——它慢慢地往后退，退回坟地中间，\n一点一点暗下去，像一盏被人拧小了的马灯。');
    for (let i = 0; i < 12; i++) { setL(L, L.px / TS + (21 - L.px / TS) * .2, L.py / TS + (5.5 - L.py / TS) * .2); await S.wait(60); }
    await S.alpha('mm_r', 0, 900); L.alpha = 1;
    await S.say('莉娜', '……它走了吗？');
    await S.say('阿远', '走吧。别回头。');
    f.lock = false; upd(S);
  }
  async function lightDeath(S, msg) {
    S.f.lock = true; DEATHS++;
    SND.rush(S);
    await S.scare('face', { face: 'minmin', dur: 1.3, sfx: 'scream' });
    S.fx('flash', { dur: 1.4 });
    await S.die(msg + '\n\n第二天，搜索队在离公路很远的地方找到了你们。\n两个人坐在一棵桉树底下，手拉着手，一直望着北边。', '它跟上了你');
  }
  async function uteMine(S) {
    const f = S.f;
    if (f.phase === 'out') return S.narr('你的白皮卡。前面是一道道干河沟，车开不进荒原。\n莉娜是走着进去的。你也只能走。');
    if (f.phase === 'home') return finale(S);
  }
  async function finale(S) {
    const f = S.f; f.lock = true;
    S.sfx('open');
    await S.narr('你拉开车门，把莉娜塞进副驾驶，拧钥匙。\n发动机咳了两声，响了。车灯「啪」地亮起来，照亮了一段红土路。');
    if (S.has('camera')) await S.say('莉娜', ['……你把我的相机捡回来了？', '谢谢。我……我拍了好多张。'], { style: 'whisper' });
    else await S.say('莉娜', ['我的相机还在外面。', '……算了。不要了。'], { style: 'whisper' });
    await S.fade(1, 1200);
    await S.card('凌晨一点', '', '你们沿着红土路往南开。\n车窗外，南十字已经转到了另一个角度，\n可那根长长的轴，还是指着同一个地方。\n\n后视镜里，荒原上有一团光，跟了你们很久。\n你没有回头，也没有踩油门。\n\n快到宅院的时候，整片牧场都黑着。\n只有门廊上，老杰克举着一盏马灯，站在那里等。');
    if (S.has('camera')) return S.end({ id: 'photo', title: '照片里的光', text: '过了两天，你们把相机里的照片导进莉娜的笔记本电脑。\n\n大部分照片上，地平线上方挂着一道拉长的光痕，压得扁扁的，正好在通往博利亚的公路方向。\n莉娜高兴得差点跳起来：「看！是远处的车灯，被逆温层折射过来的！」\n\n最后一张不一样。\n光就在镜头前两三步远，圆圆的，亮得把三脚架的影子投在了石子地上。\n\n「这张……」莉娜的声音低下去，「这张我没拍。那时候我根本不在相机旁边。」\n\n她把那张照片存进了一个单独的文件夹。\n从那以后，她再也没提过逆温层。' });
    return S.end({ id: 'stars', title: '第二十八夜　完', text: '莉娜睡了一整天。醒来以后，她把笔记本上那一页撕了下来，想了想，又粘了回去。\n\n「我还是觉得是逆温层，」她说，「几十公里外的车灯，被冷空气折过来……一定是。」\n老杰克点点头：「那就是。」' + (S.f.reflect ? '\n\n你没有说话。你想起关掉手电的那一刻：袋鼠的眼睛灭了，它还亮着。' : '') + '\n\n那天晚上，她没有去门廊上看星星。\n你去了。南十字挂在老地方，长的那一根，指着地平线上一个看不见的点。\n\n荒原的尽头，有一团光，静静地亮了一会儿。\n你没有起身。' });
  }

  /* ================= 荒原（去） ================= */
  async function eyesScene(S) {
    const f = S.f; if (f.eyes) return; f.eyes = true; f.lock = true;
    S.focus(23, 26);
    await S.narr('右手边，贴着地面，亮着两点绿光。\n……旁边又是两点。');
    S.sfx('heart');
    await S.think('莉娜的本子上写过怎么分辨：反光的东西，关掉手电就没了；自己会发光的，关了手电也还在。');
    const r = await S.ask('', ['（关掉手电看看）', '（不管它，继续走）']);
    if (r === 0) {
      S.sfx('switch'); S.plr(.7);
      for (const id of ['eyes1', 'eyes2']) S.ent(id).off = true;
      await S.narr('你推上开关。四周一下子黑透了。\n那几点绿光——没了。');
      S.focus(16, 10);
      await S.narr('可前面远处，那团白光还在。\n悬在半空，一明一暗。\n手电关着，它照样亮。');
      await S.think('……它不是反光。它自己在亮。');
      f.reflect = true;
      S.sfx('switch'); S.plr(null);
      for (const id of ['eyes1', 'eyes2']) S.ent(id).off = false;
      await S.narr('你重新推开手电。绿光又亮了，跟着一阵「嘭、嘭」的闷响，蹦远了——是几只袋鼠。');
    } else await S.narr('绿光一眨，跟着一阵「嘭、嘭」的闷响，蹦远了。\n……是几只袋鼠。');
    S.focus(null); f.lock = false;
  }
  async function cameraPick(S) {
    if (S.has('camera')) return;
    S.give('camera'); S.hide('camera');
    await S.narr('河沟里支着一个三脚架，上面架着一台相机，镜头对着北边。\n快门线垂在沙子上。屏幕上一闪一闪：电量低。');
    await S.think('这是莉娜的。她说过要拍那光……她怎么连相机都不要了？');
  }
  async function lenaScene(S) {
    const f = S.f; if (f.metLena) return; f.metLena = true; f.lock = true;
    S.face('pl', 'lena_p'); S.face('lena_p', 'pl');
    await S.narr('桉树底下站着一个人，一动不动。红格子衬衫——是莉娜。');
    await S.say('莉娜', ['……阿远？你也看见了？', '它就在那儿。我一往前走，它就往后退一点……就差一点点。'], { style: 'whisper' });
    const L = S.ent('mm_p'); setL(L, 16, 1.6);
    S.focus(16, 2); SND.hum(S, .5);
    await S.narr('那团光悬在桉树后面，一明一暗。莉娜的眼眶里，映着两个小小的白点。');
    S.focus(null);
    const r = await S.ask('', ['（挡在她和那团光中间）', '（抓住她的手，叫她的名字）', '（……你也想看清楚它）']);
    if (r === 2) { SND.hum(S, .8); S.sfx('whisper'); await S.narr('它真好看。像一盏挂在世界尽头的灯——\n一只冰凉的手抓住了你的手腕。是莉娜，她被你吓醒了。'); }
    else if (r === 0) await S.narr('你一步跨到她面前，用后背挡住了那团光。莉娜的眼睛眨了一下，又眨了一下。');
    else await S.narr('你攥住她冰凉的手，一遍一遍地叫她的名字。过了好一会儿，她的手指动了一下。');
    S.take('water');
    await S.narr('你把水袋递给她。她抱着喝了小半袋，牙齿还在打颤：「……回去的路在哪边？」');
    /* 一阵旋风：脚印没了，手电也暗了 */
    SND.wind(S); S.shake(1800, 2); S.dark(.5); S.show('dust_p');
    for (const e of curMap().ents) if (e.spr === 'boots') e.hidden = true;
    await S.narr('北边起了一阵旋风，卷着红沙「呜」地扑过来——\n你一把抱住莉娜，闭紧眼睛。手电在手里闪了几下，暗了下去。');
    await S.fade(1, 900);
    S.hide('dust_p');
    await S.card('', '', '风刮了很久。\n你们俩跌跌撞撞地，不知道往哪边躲了多远。\n\n等风终于停下来——\n四周全变了样。');
    f.phase = 'back'; f.lock = false;
    S.plr(2.2);
    await S.go('back', BACK_START[0], BACK_START[1], 1);
  }

  /* ================= 荒原（回）：光的追与逃 ================= */
  function placeLightBack(S, th, R) {
    const f = S.f, L = S.ent('mm_b'); if (!L) return;
    f.th = th; f.R = R; const [px, py] = plXY();
    setL(L, clamp(px + Math.cos(th) * R, 1, 34), clamp(py + Math.sin(th) * R, 1, 24)); L.hidden = false; L.alpha = 1;
    const H = S.ent('mm_halo'); if (H) { setL(H, L.px / TS, L.py / TS); H.hidden = false; }
  }
  function backTick(S, dt) {
    const f = S.f;
    if (f.phase !== 'back' || S.map !== 'back') return;
    const L = S.ent('mm_b'); if (!L || L.hidden) return;
    if (S.busy || f.lock) return;
    const p = W.pl, [px, py] = plXY();
    const mv = S.moving, run = S.running, fx = DIRS[p.dir][0], fy = DIRS[p.dir][1];
    f.th = (f.th ?? 0) + OMEGA * dt * (f.south ? 1.15 : 1);
    let R = f.R ?? R0;
    const lx = L.px / TS, ly = L.py / TS, vx = lx - px, vy = ly - py, d = Math.hypot(vx, vy) || 1;
    let toward = mv && (fx * vx + fy * vy) / d > .72;
    const F = S.ent('fake_b');
    if (F && !F.hidden) {
      const gx = F.px / TS - px, gy = F.py / TS - py, gd = Math.hypot(gx, gy) || 1;
      if (mv && gd < 14 && (fx * gx + fy * gy) / gd > .9) { toward = true; f._fk = 1; }
      if (gd < 6) {   // 追它它就退：走近了，那两点灯光就暗下去，过一会儿在更远处亮起来
        F.hidden = true; f._fkT = 3; f.lure = (f.lure || 0) + 1; S.sfx('whisper');
        S.toast('那两点灯光一下子暗了。……过了一会儿，又在更远的地方亮了起来。');
        setL(F, clamp(px + (gx >= 0 ? 9 : -9), 2, 33), 24);
      }
    } else if (F && F.hidden && f._fkT > 0) { f._fkT -= dt; if (f._fkT <= 0) F.hidden = false; }
    if (run) R -= 9 * dt;
    else if (toward) R = Math.min(8.5, R + 4 * dt);
    else if (mv) R += clamp(R0 - R, -2 * dt, 2 * dt);
    else { f._still = (f._still || 0) + dt; const floor = f._still > 5 ? 2 : 3; if (R > floor) R = Math.max(floor, R - .5 * dt); }
    if (mv) f._still = 0;
    f.R = R;
    setL(L, clamp(px + Math.cos(f.th) * R, .5, 35), clamp(py + Math.sin(f.th) * R, .5, 25));
    const H = S.ent('mm_halo'); if (H) setL(H, L.px / TS, L.py / TS);
    /* 嗡嗡声：越近越响、越高 */
    f._hm = (f._hm || 0) - dt;
    if (f._hm <= 0) { f._hm = .5 + R * .12; SND.hum(S, clamp((8 - R) / 7, 0, 1)); }
    if (R < 2.2 && !f._near) { f._near = 1; S.sfx('heart'); }
    if (R > 3.5) f._near = 0;
    if (R < 1) { S.run(caught); return; }
    /* 被它牵着走 */
    if (toward) f.lure = (f.lure || 0) + dt; else f.lure = Math.max(0, (f.lure || 0) - .2 * dt);
    if (f.lure > 1.4 && !f._lw1) { f._lw1 = 1; S.toast(f._fk ? '……那边那两点灯光，你一走近，它就往后退。' : '……它在往后退。你一走近，它就退。'); }
    if (f.lure > 3 && !f._lw2) { f._lw2 = 1; S.run(lureWarn); return; }
    if (f.lure >= LURE_MAX) { S.run(lureAsk); return; }
    if (f.lure < .4) { f._lw1 = 0; f._lw2 = 0; f._fk = 0; }
  }
  async function lureWarn(S) {
    S.sfx('whisper');
    await S.say('莉娜', S.f._fk ? ['阿远！那不是宅院的灯——', '杰克说了，十点以后，这片地上没有一盏灯是我们的！'] : ['阿远，你在跟着它走！', '它在前面挡着就停下……等它飘过去。'], { style: 'whisper' });
  }
  async function lureAsk(S) {
    const f = S.f; f.lock = true;
    S.sfx('whisper'); SND.hum(S, .9);
    await S.narr(f._fk ? '那两点暖黄的灯光就在前面，近得像是再翻过一道坎就到了家。\n只要再走快一点——' : '那团光就在前面，一步一步往后退，像在等你。\n只要再走快一点——就能看清它里面是什么了。');
    const r = await S.ask('', ['追上去', '（停下。闭上眼睛，想想老杰克的话）']);
    if (r === 0) return chaseEnd(S);
    await S.think('「追它它就退，你跑它就跟。」\n「地上的光，一盏都别信。」');
    await S.narr('你睁开眼睛。那团光不知什么时候绕到了你身后，悬在那儿，一明一暗。');
    f.lure = 1.2; f._lw1 = 1; f._lw2 = 0; f._fk = 0;
    placeLightBack(S, f.th + Math.PI, 6);
    f.lock = false;
  }
  async function chaseEnd(S) {
    const f = S.f; f.lock = true;
    S.amb('none');
    await S.narr('你追了上去。');
    await S.say('莉娜', '阿远——！', { style: 'big' });
    await S.narr('她的声音在身后，越来越小。\n那团光一直在前面，不远，也不近。你走快一点，它就退快一点。');
    S.fx('flash', { dur: 1.6 }); SND.hum(S, 1);
    await S.narr('石子地、干河沟、一丛一丛的刺草……全都一模一样。\n天上的星星转了半圈，你没有抬头看过一眼。');
    await S.fade(1, 1600);
    await S.end({ bad: true, id: 'chase', title: '追光进了荒原', text: '两天后，搜救的直升机在离公路四十公里的地方找到了莉娜。\n她坐在一棵桉树底下，嘴唇冻得发紫，一遍一遍地说：\n「他追着一团光往那边去了。我喊他，他没回头。」\n\n他们没有找到你。\n\n从那以后，博利亚一带又多了一个故事：\n冬天的夜里，荒原上有时会出现两团光，一前一后。\n一个追，一个退。' });
  }
  async function caught(S) {
    const f = S.f; f.lock = true;
    f.strike = (f.strike || 0) + 1;
    if (f.strike === 1) {
      SND.rush(S); S.fx('flash', { dur: .8 }); S.shake(600, 3); S.sfx('sting');
      await S.narr('光一下子扑到了你面前——白得什么都看不见。');
      await S.say('莉娜', '别跑！！杰克说过的——你跑它就跟！', { style: 'big' });
      await S.narr('莉娜死死拽住你的胳膊，你们俩一起摔在石子地上。\n再抬头的时候，那团光已经退回了几十步外，悬在那儿，一明一暗。');
      placeLightBack(S, f.th + Math.PI, 6.5);
      await S.think('……不能跑。下一回，它不会再退了。');
      f.lock = false; return;
    }
    return lightDeath(S, '你又跑了起来。\n这一回，它没有退。');
  }
  async function skyView(S, id) {
    const f = S.f; f.lock = true;
    const sky = S.ent('sky_b'); sky.px = W.pl.px; sky.py = W.pl.py; S.show('sky_b'); S.dark(0);
    SND.star(S);
    if (S.once('sky1')) {
      await S.narr('你爬上石头，背对着那团光，抬起头。');
      await S.narr('……满天的星。\n银河从地平线的一头斜着铺到另一头，亮得像一道撒了盐的河。');
    } else await S.narr('你又抬起头，把南边的天看了一遍。');
    if (f.south) { sky.s.lines = 1; await S.narr('十字架，指极星，南天极……落下去，正对着 4 号——那个尖尖的白蚁丘。'); }
    await S.say('', '地平线上从左到右：' + MARK_LINE + '\n（看清楚了，按确定）');
    S.hide('sky_b'); S.dark(null);
    if (f.south) { f.lock = false; return; }
    const v = await S.keypad('南天极垂直落到地平线上，正对着几号？\n' + MARK_LINE + '\n（取消 = 再看一眼）', SKY_KEYS, 1);
    if (v == null) { f.lock = false; return; }
    if (v === '4') return skySolved(S);
    const n = (f.skyMiss = (f.skyMiss || 0) + 1);
    S.sfx('whisper'); f.lure = (f.lure || 0) + 1; placeLightBack(S, f.th, 3);
    await S.narr('你从石头上下来，往那个方向看了一眼——\n那团光不知什么时候飘近了，就悬在几步外。');
    const near = {
      '6': '6 号……那是顺着「假十字」量的。假十字更大、更暗，旁边没有亮星。\n真的南十字小一些，左下边挨着两颗特别亮的指极星。',
      '1': '1 号上面亮着的，是那盏「宅院的灯」——可灯不是星星。\n宅院十点就熄灯了。'
    };
    if (near[v] && n < 4) await S.think(near[v]);
    else if (n === 1) await S.think('……不对。再把老杰克的画看一遍（「笺」里）。');
    else if (n === 2) await S.think('老杰克画的两条线：十字架长的那根往下延长四个半；两颗指极星连线的中垂线。\n两条线交在哪儿？那一点正下方才是正南。');
    else if (n === 3) await S.think('从十字架最下面那颗最亮的星往下，再延长四个半十字架那么长……\n那一点，落在 3 号和 5 号中间。');
    else await S.think('落下去正对着的，是那个尖尖的、红褐色的白蚁丘——4 号。');
    if (S.coop && n === 2) S.toast('双人时：一个人打开「笺」逐句念老杰克的画，一个人对着星空比划');
    f.lock = false;
  }
  async function skySolved(S) {
    const f = S.f; f.south = true;
    SND.star(S);
    await S.narr('十字架长的那根往下延长四个半……指极星的中垂线……\n两条线交在一片空空的黑里。从那里垂直落下去——');
    await S.think('4 号。那个尖尖的白蚁丘。\n那边是南。');
    const sky = S.ent('sky_b'); sky.s.lines = 1; sky.px = W.pl.px; sky.py = W.pl.py; S.show('sky_b'); S.dark(0);
    await S.narr('你又抬头看了一眼，在心里把两条线画了出来——\n交点下面，正对着那个尖尖的白蚁丘。');
    S.hide('sky_b'); S.dark(null);
    const t = S.ent('mark4'); t.s.mark = true;
    await S.say('莉娜', ['……那边？', '可我一直觉得，我们是从「下面」那边来的。那边还有灯……'], { style: 'whisper' });
    await S.say('阿远', '那不是灯。跟着星星走。');
    if (!f.reflect) await S.think('（莉娜的本子上写过：远处的灯光会被冷空气折上来，飘在地平线上——它看着近，其实远得很。）');
    f.lock = false; upd(S);
    S.cp('south');
  }
  async function markLook(S, i) {
    const f = S.f, n = MARKS[i];
    const T = [
      '一棵枯死的树，白森森的枝杈伸向天。',
      '一堆垒起来的石头。不知道是谁、在哪一年堆的。',
      '一根孤零零的旧栅栏桩，上面还缠着半截锈铁丝。围栏早就没了。',
      '一个比人还高的白蚁丘，尖尖的，红褐色，硬得像砖。',
      '一个风吹出来的小土墩，圆圆的，长着几根干草。',
      '一丛灰绿色的滨藜，叶子摸上去有一层盐霜。'
    ];
    await S.narr(T[i] + '\n（' + (i + 1) + ' 号：' + n + '）');
    if (i === 3 && !f.south) await S.think('……哪个方向是南？你得先抬头看看天。');
    else if (i === 3) await S.think('就是它。从这儿再往前，就是南边。');
    else if (f.south) await S.think('不是这个。要找的是 4 号，白蚁丘。');
  }
  async function exitBack(S) {
    const f = S.f;
    if (!f.south) { await S.think('你停下脚步。……这边是哪边？石子地一直铺进黑暗里，跟别的方向一模一样。\n先看看星星。'); return S.pos(1, 13, 2); }
    f.lock = true;
    await S.narr('你们绕过白蚁丘，一直往南走。\n那团光跟在后面，不远，也不近。你们谁也没有回头。');
    await S.fade(1, 900);
    await S.card('', '', '不知道走了多久。\n脚下的石子地变成了一道硬硬的车辙。\n\n车辙尽头，几块黑黢黢的石头，一圈歪斜的铁栏杆——\n老酒馆的坟地。');
    S.hide('mm_b'); S.hide('mm_halo'); S.follow('lena_b', false); S.hide('lena_b');
    f.phase = 'home'; f.lock = false;
    await S.go('ruins', 15, 1, 0);
  }

  /* ---------- 检查点复位 ---------- */
  const resetCommon = S => { const f = S.f; f.lock = false; f.lure = 0; f._lw1 = f._lw2 = 0; f._fk = 0; f._near = 0; S.norun(false); };
  const resumeBack = async S => {
    resetCommon(S);
    S.hide('sky_b'); S.dark(null); S.plr(2.2); S.amb('wind');
    S.follow('lena_b', true); S.ent('lena_b').solid = false;
    placeLightBack(S, Math.PI * .5, 6.5);
    const fk = S.ent('fake_b'); if (fk) { fk.hidden = false; S.f._fkT = 0; }
    upd(S);
    if (DEATHS) { await S.say('莉娜', ['……别跑。它挡在前面，我们就停下，等它飘过去。', '也别朝它走——一走近，它就退，把人往荒原里领。'], { style: 'whisper' }); S.toast('规则：别跑；别朝光走；它挡路就停下等'); }
  };
  const resumeHome = async S => {
    resetCommon(S); S.plr(2.2);
    S.hide('mm_r'); S.follow('lena_r', true); S.ent('lena_r').solid = false;
    upd(S);
    if (DEATHS) await S.say('莉娜', '……这回它要是再过来，我们就站着。不跑。', { style: 'whisper' });
  };
  const resumeSimple = async S => { resetCommon(S); upd(S); };

  /* ---------- 实体工具 ---------- */
  const look = text => S => S.narr(text);
  const fpEnts = (cells, pre, every = 2) => cells.filter((c, i) => i % every === 0 && i > 0).map(([x, y], i) => ({ id: pre + i, x, y, spr: 'boots', decal: true, solid: false }));

  const homeR = homeRows(), ruinsR = ruinsRows(), plainR = plainRows(), backR = backRows();

  defChapter({
    id: 'minmin', n: 28, title: '敏敏光', sub: '昆士兰内陆的荒原上，有一团光。你追它，它就退；你跑，它就跟。', origin: '澳大利亚昆士兰内陆传说', color: '#5a2c1c',
    amb: 'wind', floor: 'gibber', wall: 'wood', dark: .86, darkC: '#03040c', plr: 3,
    people: PEOPLE, sprites: SPRITES, tiles: TILES, faces: FACES,
    thumb(g, w, h) {
      const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#02030c'); gr.addColorStop(.75, '#141c38'); gr.addColorStop(1, '#2a2238'); g.fillStyle = gr; g.fillRect(0, 0, w, h);
      for (let i = 0; i < 70; i++) { g.fillStyle = `rgba(220,226,255,${.25 + hash(i, 2, 28) * .6})`; g.fillRect((hash(i, 3, 28) * w) | 0, (hash(i, 4, 28) * h * .7) | 0, 1, 1); }
      const cs = [[.27, .12], [.25, .3], [.19, .21], [.31, .22]]; cs.forEach(([x, y], k) => { g.fillStyle = k ? '#e8f0ff' : '#ffb48a'; g.fillRect((x * w) | 0, (y * h) | 0, 2, 2); });   // 南十字
      g.fillStyle = '#3a1a10'; g.fillRect(0, h * .72, w, h * .28); g.fillStyle = '#5a2a18'; g.fillRect(0, h * .72, w, 2);
      for (let i = 0; i < 30; i++) { g.fillStyle = '#4a2214'; g.fillRect((hash(i, 5, 28) * w) | 0, (h * .74 + hash(i, 6, 28) * h * .22) | 0, 2, 1); }
      /* 风车剪影 */
      g.fillStyle = '#08060a'; const wx = w * .14; for (let i = 0; i < 18; i++) g.fillRect(wx - 3 + i * .17, h * .72 - i * 2.6, 1, 3), g.fillRect(wx + 3 - i * .17, h * .72 - i * 2.6, 1, 3);
      for (let k = 0; k < 10; k++) { const a = k * .63; for (let r = 2; r < 8; r++) g.fillRect(wx + Math.cos(a) * r, h * .72 - 50 + Math.sin(a) * r, 1, 1); }
      /* 地平线上那团光 */
      const ox = w * .66, oy = h * .64, gl = g.createRadialGradient(ox, oy, 0, ox, oy, h * .28);
      gl.addColorStop(0, 'rgba(255,255,250,1)'); gl.addColorStop(.1, 'rgba(220,235,255,.9)'); gl.addColorStop(.35, 'rgba(170,200,255,.25)'); gl.addColorStop(1, 'rgba(150,180,255,0)');
      g.fillStyle = gl; g.beginPath(); g.arc(ox, oy, h * .28, 0, 7); g.fill();
      g.fillStyle = 'rgba(200,220,255,.18)'; g.fillRect(ox - 30, h * .73, 60, 2);
      /* 远处一个小小的人影 */
      g.fillStyle = '#06040a'; g.fillRect(w * .4, h * .66, 3, 9); g.fillRect(w * .4 - 1, h * .64, 5, 3);
    },
    items: {
      torch: { name: '手电筒', desc: '铁皮长手电，光柱黄黄的。电池该换了。' },
      water: { name: '帆布水袋', desc: '鼓鼓囊囊的帆布水袋，外面渗着一层水汽，摸上去是凉的。' },
      camera: { name: '莉娜的相机', desc: '架在三脚架上的数码相机，镜头冲着北边。屏幕一闪一闪：电量低。' }
    },
    notes: {
      board: { title: '门廊上的留言板', text: '【7月14日　周四】\n· 发电机 22:00 准时关。要用电的事，十点前办完。\n· 18 号井的水泵又不出水了——莉娜去看（下午四点出发，天黑前回）\n· 南边围栏的门别忘了关。\n· 阿远：明早五点喂马。\n\n（下面是莉娜用红笔写的，英文夹着歪歪扭扭的汉字：）\nAyuan——18 号井回来的路上，我想绕去敏敏老酒馆看看。\n听说那边晚上有「光」。我带了相机和三脚架。\n别告诉杰克！:)' },
      clip: { title: '相框里的旧剪报', text: '（一张发黄的剪报，报纸的名字被剪掉了。老杰克说，是他父亲年轻时剪下来的。下面是大意：）\n\n一位老牧工回忆：那是敏敏酒馆烧掉之后没几年。一个冬夜，他骑马路过酒馆后面的小坟地，看见坟中间亮起一团光，越来越大，大到像个西瓜，然后朝他飘了过来。\n\n他一身冷汗，拍马就跑。那团光一路跟着他，直到镇子边上才不见。\n他跑去跟警察说，警察只是笑了笑。\n\n（剪报边上，有人用铅笔添了一行：「别追，也别跑。」）' },
      cross: { title: '老杰克画的找南方法', text: '（饲料单的背面，铅笔画的。字很大，一笔一划。）\n\n迷了路，就看南天：\n① 找南十字：四颗亮星摆成小小的风筝，旁边还有一颗小的。\n　别认错「假十字」——假十字更大、更暗，旁边没有亮星。\n② 真十字的左边，挨着两颗特别亮的星：指极星。\n③ 第一条线：顺着十字架长的那一根，从上往下，过了最下面那颗星，\n　再延长四个半十字架那么长。\n④ 第二条线：两颗指极星连起来，从正中间垂直画一条线。\n⑤ 两条线交在一点——那就是南天极。\n　从那一点垂直落到地平线上，就是正南。\n\n宅院在敏敏老酒馆正南。公路也在南边。\n\n（底下又添了一行，压得很重：）\n地上的光，一盏都别信。' },
      lena: { title: '莉娜的笔记本', text: '（德文、英文夹着几句中文。下面是大意。）\n\n7月14日\n杰克说那叫 Min Min light。学物理的我当然不信鬼。候选解释：\n1. 蜃景——冬夜地面冷、上面暖（逆温层），地平线以下几十公里外的灯光会被折上来，看起来就飘在地平线上。光路跟着观察者走：你走它也走，你靠近它好像就退。\n2. 发光的昆虫，或者发光的猫头鹰（没人抓到过）。\n3. 沼气、岩石压电（这里是干的石头地，不太可能）。\n\n分辨方法：\n· 反光的东西（动物眼睛、反光牌）：关掉手电就没了。\n· 自己发光的：关了手电也还在。\n\n（最后几行字迹潦草，是今天傍晚写的）\n它从酒馆后面的坟地那儿升起来了。不是车灯——它在动。\n离我很近，可我一往前走，它就往后退。\n它在等我。我得看清楚它。' }
    },
    legend: '敏敏光（Min Min light）是流传在澳大利亚内陆的一种怪光，目击多集中在昆士兰西部的「河道之乡」（Channel Country）一带，从新南威尔士的布雷沃里纳到昆士兰的博利亚都有人讲起。流传的描述大同小异：一团边缘模糊的光，多半是白色，有时会由白变红、变绿；它悬在地平线上方，会靠近人，会跟着骑马或开车的人走，有人说它和车并排跑了很远；你朝它走过去，它就往后退；据说有人开枪打它，它一下子灭了，过一会儿又在别处亮起来。民间还有一句吓人的话：追上它的人，再也回不来讲这个故事。\n\n它的名字通常被认为来自博利亚以东一百公里左右的小地方敏敏（Min Min）。那里曾有一家路边酒馆兼驿站，据说二十世纪初毁于一场大火，只剩下石头地基和后面的一小片坟地，如今已是无人居住的「鬼镇」。最常被讲起的一个版本是：大约1918年，一个牧工夜里骑马经过酒馆旧址，看见坟地里升起一团光，越变越大，像个西瓜，朝他飘过来，一路跟着他到了镇边——这个故事几十年后才被报纸刊登出来，细节各有出入。也有说法认为「敏敏」一词来自当地的原住民语言，两种来历都没有定论。\n\n公开资料提到，在欧洲殖民者到来以前，澳大利亚好几个原住民文化里就已经有关于这类光的说法；也有原住民认为，殖民开始以后，这种光反倒出现得更多了。这些故事属于各自的社群，不同族群的讲法也不一样。本章只在台词里提到「他们的故事里早就有它」，没有复述、也没有改编任何具体的原住民神话或仪式。\n\n关于它是什么，至今没有定论。2003年，昆士兰的一位神经科学家发表论文，认为它是一种「上现蜃景」（一种复杂的海市蜃楼）：冬夜地面冷、上层暖，形成逆温层，地平线以下几十公里外的车灯、篝火，被这层空气折射上来，就像飘在地平线上；光线沿着空气层传播，所以看起来会「跟着人走」。据说他把车开到观察者看不见的十公里外打开车灯，观察者果然看见一团光浮在地平线上。别的解释还有发光的昆虫、带发光真菌的猫头鹰、沼气、岩石受压发电等，但都没有被证实，仍有不少目击解释不清。\n\n（本章中的蓝桉牧场、阿远、莉娜、老杰克、对讲机里的呼叫、剪报的具体内容和那句铅笔字、莉娜的笔记本和相机、返程时用来认方向的地平线标记，以及「宅院十点熄灯后出现的宅院之灯」，均为游戏虚构；南十字找南的方法是真实的野外常识，游戏里的星空做了简化。）',
    start: { map: 'home', x: 3, y: 4, dir: 0 },
    endings: { stars: '第二十八夜　完', photo: '照片里的光', chase: '追光进了荒原' },
    resume: { ruins: resumeSimple, ruins2: resumeSimple, plain: resumeSimple, back: resumeBack, south: resumeBack, home: resumeHome },
    async intro(S) {
      S.f.phase = 'start';
      await S.card('第二十八夜　敏敏光', '2011年7月14日　澳大利亚昆士兰西部·博利亚以东', '你在「蓝桉牧场」打工度假，已经是第三个月。\n这里离最近的小镇一百多公里，离最近的邻居四十公里。\n\n七月是南半球的冬天。白天晒得发烫的红石子地，\n一到夜里就冷得像冰。天上的星星，多得吓人。\n\n今晚，同屋的德国姑娘莉娜，还没有回来。');
    },
    tick(S, dt) {
      const f = S.f, m = S.map;
      if (f.lock || S.busy) return;
      if (m === 'ruins') {
        const [px, py] = plXY();
        if (f.phase === 'out' && f.readLena && !f.sawLight && px >= 12 && py <= 7) S.run(riseScene);
        else if (f.phase === 'home' && !f.final1 && py >= 3) S.run(lastLight);
      } else if (m === 'plain') {
        if (f.phase !== 'out') return;
        const L = S.ent('mm_p'), [px, py] = plXY();
        if (L && !L.hidden && !f.metLena) {   // 它总在前面七八步，你一走近它就退——一路把你领到莉娜那里
          let vx = LENA_XY[0] - px, vy = LENA_XY[1] - 2.5 - py; const dg = Math.hypot(vx, vy) || 1; vx /= dg; vy /= dg;
          const want = Math.min(8, dg), tx = px + vx * want + Math.sin(W.t * .4) * 1.5, ty = py + vy * want, lx = L.px / TS, ly = L.py / TS, k = Math.min(1, dt * 1.4);
          setL(L, lx + (tx - lx) * k, ly + (ty - ly) * k);
          f._hm = (f._hm || 0) - dt; if (f._hm <= 0) { f._hm = 1.6; SND.hum(S, .15); }
        }
        if (!f.eyes && py < 29.5) S.run(eyesScene);
        else if (!f.camCue && !S.has('camera') && py >= 18 && py <= 21 && px >= 16) { f.camCue = true; S.run(async S => { S.focus(5, 19); await S.think('河沟里往西，有一点红光一闪一闪。\n……不是那团光。太小了，像电器上的指示灯。'); S.focus(null); }); }
        else if (!f.metLena && Math.hypot(px - LENA_XY[0], py - LENA_XY[1]) < 2.5) S.run(lenaScene);
      } else if (m === 'back') backTick(S, dt);
    },
    maps: {
      /* ---------------- 蓝桉牧场宅院 ---------------- */
      home: {
        amb: 'night', dark: .6, plr: 3.2, wall: 'wood', floor: 'dirt',
        tileOpts: { grassC: '#4a4a2a', treeC: '#3a4a36', woodC: '#6a5038' },
        rows: homeR,
        ents: [
          { id: 'win1', x: 1, y: 1, spr: 'window', lit: true, light: { r: 2.2, col: 'rgba(255,210,140,.18)', dy: 14 }, on: S => S.narr(S.ent('win1').lit ? '宿舍的窗户亮着。屋里莉娜的床铺叠得整整齐齐，枕头边上放着一本德文小说。' : '窗户黑了。') },
          { id: 'torch_h', x: 2, y: 1, spr: 'torchhook', on: takeTorch },
          { id: 'door_bunk', x: 3, y: 1, spr: 'door', col: '#5a4434', on: look('宿舍的纱门，吱呀吱呀地响。门框上钉着一块马蹄铁，开口朝上——老杰克说这样能「兜住运气」。') },
          { id: 'water_h', x: 4, y: 1, spr: 'waterbag', on: takeWater },
          { id: 'win2', x: 5, y: 1, spr: 'window', lit: true, light: { r: 2.2, col: 'rgba(255,210,140,.18)', dy: 14 }, on: S => S.narr(S.ent('win2').lit ? '厨房的窗户。灶台上扣着一个盘子——是给莉娜留的晚饭，炖羊肉，早就凉了。' : '窗户黑了。') },
          { id: 'bulb', x: 7, y: 1, spr: 'bulb', light: { r: 4.6, col: 'rgba(255,220,150,.2)', dy: 16 }, on: S => S.narr(S.ent('bulb').off ? '灯泡黑了。灯罩里卡着几只冻僵的飞蛾。' : '门廊的灯泡，一群飞蛾绕着它打转。十点一过，它就会灭。') },
          { id: 'board', x: 8, y: 1, spr: 'board', async on(S) { await S.note('board'); if (S.once('boardT')) await S.think('「别告诉杰克」……她是特意绕去看那光的。'); } },
          { id: 'door_kit', x: 10, y: 1, spr: 'door', col: '#5a4434', on: look('厨房门。门后挂着一串钥匙和一顶落满灰的旧毡帽。') },
          { id: 'frame', x: 12, y: 1, spr: 'frame', async on(S) { await S.note('clip'); if (S.once('clipT')) await S.think('敏敏酒馆……老杰克说过，就在北边那条路上。'); } },
          { id: 'jack', x: 6, y: 3, spr: '@jack', dir: 0, on: jackTalk },
          { id: 'chair', x: 5, y: 3, spr: 'chair', col: '#6a4a30', on: look('一把磨得发亮的藤椅。老杰克的拐杖靠在扶手上。') },
          { id: 'uhf', x: 12, y: 3, spr: 'uhf', on: S => S.narr(S.f.phase === 'start' ? '门廊桌子上的 UHF 对讲机，绿灯亮着，喇叭里只有很轻的沙沙声。' : '对讲机里只剩下沙沙的杂音。你按下通话键喊了两声「莉娜」，没有回音。') },
          { id: 'genset', x: 18, y: 2, spr: 'genset', on: S => S.narr(S.ent('genset').off ? '发电机停了，铁壳子还是热的。' : '柴油发电机「突突突」地响着，整个牧场的电全靠它。\n每晚十点，它会准时停下来——柴油要省着烧。') },
          { id: 'door_shed', x: 20, y: 1, spr: 'door', col: '#6a6a6a', on: look('工具棚的铁皮门，挂着锁。门缝里飘出一股柴油味。') },
          { id: 'jerry', x: 22, y: 2, spr: 'barrel', col: '#a02a20', on: look('几只红色的油桶。最边上那只是空的——莉娜下午加满了她那辆红皮卡。') },
          { id: 'fire', x: 8, y: 6, spr: 'firedrum', light: { r: 3.2, col: 'rgba(255,140,60,.25)', flick: true }, on: look('一只烧火的铁桶，桶壁被烧得通红。你伸手烤了烤，手心发烫，后背还是冷的。') },
          { id: 'dog', x: 15, y: 6, spr: 'dog', on: async S => { S.bubble('dog', '!', 900); await S.narr(S.f.phase === 'start' ? '蓝仔，牧场的赶牛犬。它趴在地上，耳朵却一直竖着，冲着北边。' : '蓝仔冲着北边低低地呜呜叫，尾巴夹在后腿中间。'); } },
          { id: 'windmill', x: 25, y: 6, spr: 'windmill', on: look('铁架子风车，抽着井水往水箱里送。尾巴上的铁皮印着一行褪色的字：SOUTHERN CROSS（南十字）。') },
          { id: 'tank', x: 26, y: 9, w: 2, h: 2, spr: 'tank', on: look('波纹铁皮水箱。你敲了敲，声音闷闷的——还有大半箱。') },
          { id: 'ute_h', x: 16, y: 12, w: 2, spr: 'ute', col: '#d8d4c8', on: uteHome },
          { id: 'gate', x: 15, y: 17, spr: 'invisible', touch: async S => { await S.think('走着去？四十公里。……开车。'); S.pos(15, 15, 3); } }
        ],
        async enter(S, first) {
          if (!first) return;
          SND.dingo(S);
          await S.narr('你从宿舍里出来，冷风一下子钻进了领口。\n门廊的灯泡底下，飞蛾一圈一圈地转。远处有一声野狗的嚎叫。');
          await S.think('……莉娜还没回来？');
          upd(S);
        }
      },
      /* ---------------- 敏敏老酒馆旧址 ---------------- */
      ruins: {
        amb: 'wind', dark: .82, darkC: '#04060f', plr: 3, wall: 'stone', floor: 'gibber',
        legend: OUT, rows: ruinsR,
        ents: [
          { id: 'ute_me', x: 3, y: 16, w: 2, spr: 'ute', col: '#d8d4c8', on: uteMine },
          { id: 'ute_l', x: 6, y: 10, w: 2, spr: 'ute', col: '#a8302a', open: true, s: { lamps: true, dim: true }, light: { r: 2.2, dx: 36, dy: 6, col: 'rgba(255,220,140,.14)' }, on: lenaUte },
          { id: 'plaque', x: 6, y: 5, spr: 'plaque', on: look('一块铁皮牌子，字被风沙磨得只剩一半：\n「敏敏酒馆旧址……昔日驿站……毁于大火……『敏敏光』之名由此而来……」\n牌子底下，有人用石头压着一枚硬币。') },
          { id: 'chimney', x: 13, y: 7, spr: 'chimney', on: look('一截石头砌的烟囱，孤零零地立在地基边上。灶口黑洞洞的，里面塞满了风吹进来的枯草。') },
          { id: 'bedstead', x: 11, y: 9, spr: 'bedstead', on: look('一副锈透了的铁床架。不知道是哪个年头的客人，在这儿睡过最后一夜。') },
          { id: 'bottles', x: 13, y: 10, spr: 'bottles', solid: false, decal: true, on: look('碎玻璃瓶，绿的、棕的，半埋在土里。瓶底还认得出一个老酒厂的印子。') },
          { id: 'grave1', x: 19, y: 5, spr: 'grave', kind: 0, on: look('一个木头十字架，被太阳晒得发白，名字早就看不清了。') },
          { id: 'grave2', x: 21, y: 4, spr: 'grave', kind: 1, on: look('一圈锈铁栏杆围着的小坟。栏杆上缠着一截褪了色的布条。') },
          { id: 'grave3', x: 23, y: 6, spr: 'grave', kind: 2, on: look('几块石头围成的小坟，没有碑。石头缝里，有人插了一枝干枯的野花。') },
          { id: 'roadN', x: 3, y: 0, spr: 'invisible', touch: async S => { await S.think('路往北，通到 18 号井。\n……可莉娜的靴印不在路上，往荒原里去了。'); S.pos(3, 1, 0); } },
          { id: 'roadS', x: 4, y: 19, spr: 'invisible', touch: async S => { await S.think(S.f.phase === 'home' ? '开车走。皮卡就在这儿。' : '回宅院的路。……莉娜还没找到。'); S.pos(4, 18, 3); } },
          { id: 'toPlain', x: 15, y: 0, spr: 'invisible', touch: async S => {
            const f = S.f;
            if (f.phase === 'home') { await S.think('不能再进去了。'); return S.pos(15, 1, 0); }
            if (!f.readLena) { await S.think('先看看莉娜的车里有什么。'); return S.pos(15, 1, 0); }
            if (!f.sawLight) return riseScene(S);
            await S.go('plain', 16, 38, 3);
          } },
          { id: 'mm_r', x: 21, y: 6, spr: 'minmin', solid: false, hidden: true, z: 1, s: { sz: 1 }, light: { r: 2.6, dy: 4, col: 'rgba(190,210,255,.28)' } },
          { id: 'lena_r', x: 15, y: 2, spr: '@lena', hidden: true, dir: 0, on: S => S.say('莉娜', '……我不想再看见那种光了。', { style: 'whisper' }) },
          ...fpEnts(RUIN_CELLS, 'fpr')
        ],
        async enter(S, first) {
          const f = S.f;
          if (first) {
            await S.narr('你把车停在路边，熄了火。\n四周一下子静得吓人，只有风从石头缝里穿过去的声音。');
            await S.narr('车灯照着的地方，斜停着一辆红皮卡——是莉娜的车。');
            upd(S); S.cp('ruins');
            return;
          }
          if (f.phase === 'home' && S.once('ruinsHome')) {
            S.place('lena_r', 16, 1, 1); S.follow('lena_r', true); S.ent('lena_r').solid = false;
            await S.say('莉娜', '……是老酒馆。我们出来了。', { style: 'whisper' });
            upd(S); S.cp('home');
          }
        },
        step(S, x, y) { const f = S.f; if (f.phase === 'out' && f.readLena && !f.sawLight && x >= 12 && y <= 7) return riseScene(S); }
      },
      /* ---------------- 荒原（去） ---------------- */
      plain: {
        amb: 'wind', dark: .84, darkC: '#04060f', plr: 3, wall: 'stone', floor: 'gibber',
        legend: OUT, rows: plainR,
        ents: [
          { id: 'dust_p', x: 16, y: 5, spr: 'dust', solid: false, hidden: true, z: 5 },
          { id: 'exitP', x: 16, y: 39, spr: 'invisible', touch: async S => { await S.think('莉娜还在里面。'); S.pos(16, 37, 3); } },
          { id: 'mm_p', x: 16, y: 30, spr: 'minmin', solid: false, z: 1, s: { sz: .8 }, light: { r: 2.4, dy: 4, col: 'rgba(190,210,255,.26)' } },
          { id: 'eyes1', x: 23, y: 26, spr: 'eyes', solid: false, light: { r: .5, a: .9 } },
          { id: 'eyes2', x: 25, y: 27, spr: 'eyes', solid: false, light: { r: .5, a: .9 } },
          { id: 'camera', x: 4, y: 19, spr: 'camera', light: { r: .7, a: .9, dy: -2, col: 'rgba(255,60,40,.35)' }, on: cameraPick },
          { id: 'lena_p', x: LENA_XY[0], y: LENA_XY[1], spr: '@lena', dir: 3, on: lenaScene },
          { id: 'skull', x: 20, y: 12, spr: 'bones', on: look('一具牛骨架，白得发亮，半埋在红沙里。肋骨一根一根地支棱着，像一只倒扣的笼子。') },
          { id: 'tin', x: 9, y: 36, spr: 'tinbox', on: look('一只锈穿了的饼干铁盒，盖子上的花纹还隐约看得出来。不知道是哪一年，哪个赶牛的人丢在这儿的。') },
          ...fpEnts(PLAIN_CELLS, 'fpp')
        ],
        async enter(S, first) {
          if (!first) return;
          await S.narr('一离开路，脚下就全是硌脚的红石子。\n手电只照得亮眼前几步，再往外，就是一片看不到头的黑。');
          await S.narr('前面很远的地方，悬着一团白光。');
          await S.think('……就是它。跟着靴印走。它在前面，就让它在前面。');
          upd(S); S.cp('plain');
        }
      },
      /* ---------------- 荒原（回）：屏幕左边是南 ---------------- */
      back: {
        amb: 'wind', dark: .8, darkC: '#04060f', plr: 2.2, wall: 'stone', floor: 'gibber',
        legend: OUT, rows: backR,
        ents: [
          { id: 'sky_b', x: BACK_START[0], y: BACK_START[1], spr: 'skyview', solid: false, hidden: true, z: 5 },
          { id: 'rise1', x: 26, y: 11, spr: 'rise', on: skyView },
          { id: 'rise2', x: 12, y: 14, spr: 'rise', on: skyView },
          { id: 'mark1', x: MARK_XY[0][0], y: MARK_XY[0][1], spr: 'deadtree', light: { r: 1, a: .45 }, on: S => markLook(S, 0) },
          { id: 'mark2', x: MARK_XY[1][0], y: MARK_XY[1][1], spr: 'cairn', light: { r: 1, a: .45 }, on: S => markLook(S, 1) },
          { id: 'mark3', x: MARK_XY[2][0], y: MARK_XY[2][1], spr: 'fpost', light: { r: 1, a: .45 }, on: S => markLook(S, 2) },
          { id: 'mark4', x: MARK_XY[3][0], y: MARK_XY[3][1], spr: 'termite', light: { r: 1.1, a: .5 }, on: S => markLook(S, 3) },
          { id: 'mark5', x: MARK_XY[4][0], y: MARK_XY[4][1], spr: 'mound', light: { r: 1, a: .45 }, on: S => markLook(S, 4) },
          { id: 'mark6', x: MARK_XY[5][0], y: MARK_XY[5][1], spr: 'saltbush', light: { r: 1, a: .45 }, on: S => markLook(S, 5) },
          { id: 'fake_b', x: 26, y: 24, spr: 'fakelight', solid: false, light: { r: 1.6, dy: 6, col: 'rgba(255,200,120,.22)', flick: true } },
          { id: 'mm_halo', x: 24, y: 19, solid: false, hidden: true, light: { r: 7, a: .3 } },   // 光照亮的那一大片地：光在屏幕外时，也能从哪一边发亮看出它在哪儿
          { id: 'mm_b', x: 24, y: 19, spr: 'minmin', solid: false, z: 1, hidden: true, s: { sz: .9 }, light: { r: 2.6, dy: 4, col: 'rgba(190,210,255,.28)' } },
          { id: 'lena_b', x: 25, y: 13, spr: '@lena', dir: 1, on: S => S.say('莉娜', S.f.south ? '……往白蚁丘那边。我跟着你。' : ['我的腿在抖……', '杰克说过，迷路了就看天，对吧？'], { style: 'whisper' }) },
          { id: 'exit_b', x: 0, y: 13, spr: 'invisible', touch: exitBack }
        ],
        async enter(S, first) {
          if (!first) return;
          S.follow('lena_b', true); S.ent('lena_b').solid = false;
          await S.narr('风停了。\n你眯着眼睛四下看——石子地、刺草、几道黑黢黢的干河沟……每个方向都一模一样。');
          await S.say('莉娜', '我们……是从哪边来的？', { style: 'whisper' });
          await S.think('脚印全被风抹平了。手电只剩一圈昏黄的光。\n……老杰克说过：迷了路，就看南十字。');
          placeLightBack(S, Math.PI * .5, 6.5);
          SND.hum(S, .4);
          await S.narr('脚边不远，那团光又亮了起来。\n更远的地方，地平线上还浮着两点暖黄的灯光，像谁家亮着的窗。');
          await S.say('莉娜', '……那边有灯！是宅院吗？', { style: 'whisper' });
          await S.think('宅院十点就熄灯了。');
          if (S.coop) S.toast('双人时：一个人打开「笺」念老杰克的找南方法，一个人上岩石看天、按答案');
          upd(S); S.cp('back');
        }
      }
    }
  });
})();
