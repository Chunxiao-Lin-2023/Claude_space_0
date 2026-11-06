/* ================= 第三夜 · 犬鸣村 ================= */
(() => {
  /* ---------- 小工具 ---------- */
  const FONT = '"Noto Sans CJK JP","Hiragino Sans","Yu Gothic","Noto Sans CJK SC","Microsoft YaHei",sans-serif';
  const TXC = new Map();
  function txtBmp(s, px, col) {   // 二值化像素字（小字号不糊）
    const k = s + '|' + px + '|' + col; let c = TXC.get(k); if (c) return c;
    const m = mk(8, 8).getContext('2d'); m.font = `bold ${px}px ${FONT}`;
    const w = Math.ceil(m.measureText(s).width) + 2, h = px + 4;
    c = mk(w, h); const x = c.getContext('2d');
    x.font = `bold ${px}px ${FONT}`; x.fillStyle = col; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(s, w / 2, h / 2 + 1);
    const im = x.getImageData(0, 0, w, h), d = im.data;
    for (let i = 3; i < d.length; i += 4) d[i] = d[i] >= 96 ? 255 : 0;
    x.putImageData(im, 0, 0);
    TXC.set(k, c); return c;
  }
  function txt(g, R, s, a, b, px, col) {   // 借 R 拿到当前绘制偏移，在 (a,b) 处居中写字
    let X = 0, Y = 0; g.fillRect = (x, y) => { X = x; Y = y; }; R(a, b, 1, 1, '#000'); delete g.fillRect;
    const c = txtBmp(s, px, col); g.drawImage(c, Math.round(X - c.width / 2), Math.round(Y - c.height / 2));
  }
  const row = (w, f) => Array.from({ length: w }, (_, x) => f(x)).join('');
  const EXIT_T = 36;          // 出隧道的「信号」倒计时（秒）
  let PAT = null;             // 村人巡逻状态（进村 / 重来时重置）
  let RINGT = 0, DRIPT = 0, HOWLT = 9, LASTBAR = -1, DIED = 0, SCRT = 0;

  /* ---------- S.tone 合成音效（双方都听得到） ---------- */
  function ring(S) {   // 老式公用电话的电子铃：「噗噜噜噜——」两声
    for (let r = 0; r < 2; r++) for (let k = 0; k < 9; k++) S.tone('square', k % 2 ? 1250 : 1560, k % 2 ? 1250 : 1560, .055, .03, r * .75 + k * .062, 3400);
  }
  function howl(S, far, delay = 0) {   // 狗叫：远处一声拖长的嚎
    const v = far ? .025 : .06, lp = far ? 900 : 1500;
    S.tone('sawtooth', 300, 700, .6, v, delay, lp); S.tone('sawtooth', 700, 540, 1.3, v, delay + .55, lp);
    S.tone('triangle', 305, 720, .6, v * .7, delay + .02, lp + 500); S.tone('triangle', 720, 500, 1.4, v * .7, delay + .57, lp + 500);
  }
  function clank(S) {   // 空罐头互相撞
    [2600, 3300, 2100, 2900, 1850, 3150, 2400].forEach((f, i) => S.tone('triangle', f, f * .9, .13, .055, i * .045, 0));
    S.tone('square', 900, 640, .09, .03, 0, 2200); S.tone('square', 760, 560, .09, .025, .16, 2200);
  }
  function sigBeep(S, up) {   // 信号格变化的提示音：多一格往上跳，少一格往下沉
    if (up) { S.tone('sine', 880, 880, .07, .045); S.tone('sine', 1320, 1320, .1, .045, .08); }
    else S.tone('sine', 560, 250, .22, .045, 0, 1400);
  }
  function chop(S) { S.tone('square', 190, 55, .18, .1, 0, 700); S.sfx('thud'); }
  function heart(S, n = 2) { for (let i = 0; i < n; i++) { S.tone('sine', 62, 40, .16, .32, i * .7); S.tone('sine', 58, 38, .2, .26, i * .7 + .22); } }

  /* ---------- 人物 ---------- */
  const PEOPLE_I = {
    me: { skin: '#f2cfb0', hair: '#1e1614', hs: 'bob', top: '#5e6e52', top2: '#e8e4d8', bottom: '#2c3446', shoes: '#e4e0d8' },
    taku: { key: 'in-taku', skin: '#ecc6a2', hair: '#3a2a20', hs: 'messy', hat: 'cap', hatC: '#a83a2a', top: '#2a2c34', top2: '#d8d8d0', bottom: '#4a5a74', shoes: '#d8d4cc',
      extra(g, d, fr, G, R) { if (d === 0) { R(11, G.tT + 5, 4, 3, '#1a1a1e'); R(14, G.tT + 6, 1, 1, '#c03030'); } else if (d === 1) { R(2, G.tT + 5, 4, 3, '#1a1a1e'); R(2, G.tT + 6, 1, 1, '#4a8ad0'); } } },
    mura: { key: 'in-mura', skin: '#4a3e34', hair: '#0a0a0a', hs: 'short', hat: 'straw', hatC: '#8a7a4a', top: '#2e3428', top2: '#1e221a', bottom: '#2a2a26', shoes: '#141210', eye: '#e8e2c0',
      extra(g, d, fr, G, R) {
        const h = G.hT;
        if (d === 0) { R(4, h + 2, 8, 5, '#211a14'); R(6, h + 4, 1, 1, '#e8e2c0'); R(9, h + 4, 1, 1, '#e8e2c0'); R(13, G.tT + 1, 1, 10, '#6a4a2a'); R(12, G.tT, 3, 3, '#9aa0a6'); R(12, G.tT, 3, 1, '#d8dcdc'); R(3, G.tT + 6, 3, 3, '#e8a050'); R(4, G.tT + 7, 1, 1, '#fff0b0'); }
        else if (d === 1) { R(5, h + 2, 6, 5, '#211a14'); R(6, h + 4, 1, 1, '#e8e2c0'); R(3, G.tT + 1, 1, 10, '#6a4a2a'); R(1, G.tT, 3, 3, '#9aa0a6'); R(10, G.tT + 6, 3, 3, '#e8a050'); }
        else { R(13, G.tT + 1, 1, 10, '#6a4a2a'); R(12, G.tT, 3, 3, '#9aa0a6'); R(2, G.tT + 6, 3, 3, '#c88040'); }
      } },
    meX: { key: 'in-mex', skin: '#e6dccf', hair: '#1e1614', hs: 'bob', top: '#5e6e52', top2: '#e8e4d8', bottom: '#2c3446', shoes: '#e4e0d8', eye: '#000',
      extra(g, d, fr, G, R) { if (d === 0) { R(5, G.hT + 3, 2, 3, '#000'); R(9, G.hT + 3, 2, 3, '#000'); R(6, G.hT + 6, 4, 1, '#3a0a0a'); } } },
    stand: { key: 'in-stand', skin: '#b8b0a4', hair: '#141210', hs: 'short', top: '#3a3a34', top2: '#2a2a26', bottom: '#2a2a26', shoes: '#141210' }
  };

  /* ---------- 惊吓大头像（32×32） ---------- */
  const FACES_I = {
    /* 村人：草帽的帽檐压着一张黑得看不清的脸，只有两点发白的眼睛；斧刃从画面边上抬起来 */
    mura(R, a) {
      const HAT = '#8a7a4a', HAT2 = '#5a4e2e', SH = '#1c1510', K = '#050403', EY = '#ece6c4';
      R(8, 1, 16, 6, HAT); R(9, 0, 14, 1, '#a8965e'); R(8, 6, 16, 1, HAT2); R(1, 7, 30, 2, HAT); R(0, 9, 32, 2, HAT2);
      for (let i = 0; i < 8; i++) R(2 + i * 4, 7, 1, 2, '#6a5c34');
      R(7, 11, 18, 15, SH); R(8, 26, 16, 3, SH); R(10, 29, 12, 2, SH); R(7, 11, 18, 2, K);
      const eh = a > .4 ? 2 : 1;
      R(11, 16, 3, eh, EY); R(18, 16, 3, eh, EY); R(12, 16, 1, eh, K); R(19, 16, 1, eh, K);
      R(12, 23, 8, 1, K); if (a > .6) R(13, 24, 6, 1, K);
      R(3, 29, 26, 3, '#2e3428'); R(14, 29, 4, 3, '#1e221a');
      const ay = 31 - Math.round(a * 13);
      R(27, ay - 3, 2, 18, '#5a3e22'); R(23, ay - 8, 9, 6, '#9aa0a6'); R(23, ay - 8, 9, 1, '#e0e4e4'); R(31, ay - 8, 1, 6, '#e0e4e4'); R(23, ay - 3, 9, 1, '#5a5e62');
    },
    /* 「拓也」：一模一样的帽子和脸，眼睛是两个黑洞，耳边贴着一部亮着「圏外」的手机 */
    voice(R, a) {
      const CAP = '#a83a2a', CAP2 = '#7a2a1e', HR = '#3a2a20', SK = '#e8e0d8', SK2 = '#c4bab2', K = '#000';
      R(7, 2, 18, 6, CAP); R(8, 1, 16, 1, '#c04a36'); R(5, 8, 22, 2, CAP2);
      R(6, 9, 3, 7, HR); R(23, 9, 3, 7, HR);
      R(8, 10, 16, 14, SK); R(9, 24, 14, 3, SK); R(11, 27, 10, 2, SK); R(21, 10, 3, 15, SK2);
      const eh = 4 + Math.round(a * 3);
      R(10, 13, 5, eh, K); R(17, 13, 5, eh, K); R(11, 13 + eh, 1, 1 + Math.round(a * 4), '#1a0a0a');
      const w = 6 + Math.round(a * 9), x0 = 16 - (w >> 1);
      R(x0, 22, w, 2, K); R(x0 - 1, 21, 1, 1, K); R(x0 + w, 21, 1, 1, K);
      for (let i = 1; i < w - 1; i += 2) R(x0 + i, 22, 1, 1, '#d8d0c0');
      R(25, 12, 5, 10, '#1e1e24'); R(26, 13, 3, 4, a > .5 ? '#ff5a4a' : '#9ff0c0');
      R(3, 29, 26, 3, '#2a2c34');
    }
  };

  /* ---------- 瓦片 ---------- */
  const TILES_I = {
    crackasph: { solid: false, paint(R, X, Y) {
      speck(R, '#2a2a2e', ['#333338', '#232327', '#38383d'], X, Y, 18, 9);
      const h = hash(X, Y, 31); R(2 + ((h * 6) | 0), 3, 1, 5, '#18181b'); R(3 + ((h * 6) | 0), 7, 4, 1, '#18181b'); R(7 + ((h * 6) | 0), 8, 1, 4, '#18181b');
      if (h < .5) { R(1 + ((h * 20) | 0) % 12, 10, 1, 3, '#3a5a32'); R(2 + ((h * 20) | 0) % 12, 9, 1, 2, '#4a6a3a'); }
    } },
    valley: { solid: true, paint(R, X, Y) {
      R(0, 0, 16, 16, '#05070c');
      for (let i = 0; i < 3; i++) if (hash(X, Y, 80 + i) < .45) { const x = (hash(X, Y, 90 + i) * 12) | 0, y = (hash(Y, X, 95 + i) * 12) | 0; R(x, y, 4, 3, '#0b1410'); R(x + 1, y - 1, 2, 1, '#0b1410'); }
    } },
    tfloor: { solid: false, paint(R, X, Y) {
      speck(R, '#3a3a3a', ['#444444', '#303030', '#4a4a48'], X, Y, 16, 12);
      if (Y === 2) R(0, 0, 16, 2, '#262626');
      if (hash(X, Y, 41) < .2) { R(3, 6, 6, 3, '#2a3036'); R(4, 6, 3, 1, '#4a5660'); }
    } }
  };

  /* ---------- 精灵 ---------- */
  const SPR_I = {
    /* 头顶的手机信号格（跟着玩家；客机直接读本地玩家位置画，不会拖影） */
    sighud(g, e, t, R) {
      if (W.pl.hidden) return;
      const ox = e.px - e.sx, oy = e.py - e.sy, X = Math.round(W.pl.px - ox) + 10, Y = Math.round(W.pl.py - oy) - 17;
      const F = (x, y, w, h, c) => { g.fillStyle = c; g.fillRect(X + x, Y + y, w, h); };
      const n = e.num || 0;
      F(-1, -1, 13, 8, '#07090c'); F(0, 0, 11, 6, n ? '#14262a' : '#2a1416');
      F(1, 1, 3, 1, '#a8c0c8'); F(2, 2, 1, 3, '#a8c0c8');
      for (let i = 0; i < 4; i++) { const h = 2 + i; F(4 + i * 2, 6 - h, 1, h, i < n ? (n === 1 ? '#e8c860' : '#9ff0c0') : '#2e4044'); }
      if (!n) { const c = (Math.sin(t * 6) > -.3) ? '#ff5a4a' : '#8a2a22'; F(5, 1, 1, 1, c); F(9, 1, 1, 1, c); F(6, 2, 1, 1, c); F(8, 2, 1, 1, c); F(7, 3, 1, 1, c); F(6, 4, 1, 1, c); F(8, 4, 1, 1, c); F(5, 5, 1, 1, c); F(9, 5, 1, 1, c); }
    },
    /* 倒着走：不管往哪边走，人都朝着村子（左） */
    meBack(g, e, t, R) { g.drawImage(personSprite(PEOPLE_I.me, 1, e.fr || 0), e.sx, e.sy - 8); },
    takuBack(g, e, t, R) { g.drawImage(personSprite(PEOPLE_I.taku, 1, e.fr || 0), e.sx, e.sy - 8); },
    /* 隧道口（3 格宽，挂在墙面那一行）。v=村子那头；locked=被封死 */
    portal(g, e, t, R) {
      const S0 = '#4e4b44', S2 = '#68645b';
      R(-2, -26, 52, 42, '#33302b'); R(0, -24, 48, 40, S0);
      for (let r = 0; r < 8; r++) for (let c = 0; c < 6; c++) R(c * 8 + (r % 2) * 4, -24 + r * 5, 7, 4, shade(S0, (hash(c, r, 7) - .5) * .28));
      R(8, -12, 32, 28, '#030303'); R(10, -15, 28, 3, '#030303'); R(14, -17, 20, 2, '#030303');
      R(6, -13, 2, 29, S2); R(40, -13, 2, 29, S2); R(8, -16, 2, 3, S2); R(38, -16, 2, 3, S2); R(10, -18, 4, 2, S2); R(34, -18, 4, 2, S2); R(14, -19, 20, 2, S2);
      if (e.v && e.locked) {   // 村子那头：洞口变成了长满青苔的石壁
        R(8, -17, 32, 33, '#3a3730'); for (let i = 0; i < 14; i++) R(9 + (hash(i, 2, 5) * 28 | 0), -16 + (hash(i, 3, 5) * 30 | 0), 3, 2, i % 2 ? '#2e4228' : '#24341f');
        return;
      }
      if (e.v) { R(18, -6, 12, 22, 'rgba(30,44,40,.35)'); return; }
      const top = e.locked ? -16 : -6;
      for (let i = 0; ; i++) {
        const y = 11 - i * 6; if (y < top) break;
        for (let x = 8 - (i % 2 ? 5 : 0); x < 40; x += 10) { const x0 = Math.max(8, x), x1 = Math.min(40, x + 9); R(x0, y, x1 - x0, 5, '#858480'); R(x0, y, x1 - x0, 1, '#a6a5a0'); R(x0, y + 4, x1 - x0, 1, '#5e5d5a'); }
      }
      R(13, 2, 9, 1, '#9a2a22'); R(13, 2, 1, 6, '#9a2a22'); R(17, 2, 1, 6, '#9a2a22'); R(26, 6, 8, 1, '#9a2a22'); R(29, 3, 1, 7, '#9a2a22');   // 喷漆
    },
    graf(g, e, t, R) { txt(g, R, e.text || '犬鳴', 8, 6, 7, e.col || '#b02a22'); },
    notice(g, e, t, R) {
      R(2, 2, 2, 13, '#6a6a66'); R(12, 2, 2, 13, '#6a6a66');
      box(R, -3, -14, 22, 17, '#e4e0d4', '#5a5650'); R(-2, -13, 20, 4, '#b02a22');
      txt(g, R, '通行止', 8, -11, 7, '#f4f0e8'); R(0, -6, 16, 1, '#5a5650'); R(0, -3, 12, 1, '#5a5650'); R(0, 0, 14, 1, '#5a5650');
      R(1, -5, 9, 1, '#a02020'); R(4, -2, 8, 1, '#a02020');   // 红漆涂鸦
    },
    booth(g, e, t, R) {
      R(0, -21, 16, 3, '#2a5a3a'); R(1, -18, 14, 32, '#9aa4a0'); R(2, -17, 12, 29, 'rgba(150,210,190,.32)');
      R(2, -10, 12, 1, '#9aa4a0'); R(7, -17, 1, 29, 'rgba(154,164,160,.6)');
      R(4, -20, 8, 1, '#e8fff0');
      const j = e.ring ? (Math.sin(t * 40) > 0 ? 1 : -1) : 0;
      R(4, -7, 8, 8, '#2a8a4a'); R(5, -6, 6, 3, '#1a1a1a'); R(5, -9 + (e.ring ? (j > 0 ? -1 : 0) : 0), 7, 2, '#145a2c'); R(9, -2, 2, 2, '#e8c040');
      if (e.ring) { R(3 + j, -12, 1, 1, '#e8fff0'); R(12 - j, -12, 1, 1, '#e8fff0'); }
      if (e.face) { R(3, -16, 9, 9, '#dcd6cc'); R(4, -13, 3, 3, '#000'); R(8, -13, 3, 3, '#000'); R(5, -9, 5, 1, '#000'); }
      R(1, 13, 14, 1, '#2a2e2c');
    },
    carv(g, e, t, R) {   // 竖着停的车（1×2），车头朝上
      const c = e.col || '#e4e4dc';
      R(1, 31, 14, 2, 'rgba(0,0,0,.45)');
      box(R, 1, -5, 14, 36, c, shade(c, -.5)); R(2, -4, 12, 3, shade(c, .08));
      R(3, 0, 10, 6, '#16222c'); R(4, 1, 3, 2, '#3a5466'); R(3, 7, 10, 10, shade(c, -.08)); R(3, 18, 10, 5, '#16222c');
      R(0, 3, 1, 3, '#2a2a2a'); R(15, 3, 1, 3, '#2a2a2a');
      R(2, -5, 3, 2, e.off ? '#6a6a5a' : '#fff4c0'); R(11, -5, 3, 2, e.off ? '#6a6a5a' : '#fff4c0');
      R(2, 29, 3, 1, '#a01818'); R(11, 29, 3, 1, '#a01818');
    },
    kanban(g, e, t, R) { R(7, -2, 2, 17, '#5a5a56'); box(R, -3, -12, 22, 11, '#2a5a8a', '#18304a'); txt(g, R, e.text || '犬鳴峠', 8, -7, 7, '#f0f0ea'); },
    /* 传说里最有名的那块牌子：此处之后，日本国宪法不适用 */
    kenpo(g, e, t, R) {
      R(5, 0, 2, 15, '#4a3a28'); R(25, 0, 2, 15, '#4a3a28');
      box(R, -3, -30, 38, 32, '#d6d0be', '#3a3020');
      for (let i = 0; i < 6; i++) R(-1 + (hash(i, 1, 33) * 32 | 0), -28 + (hash(i, 2, 33) * 26 | 0), 3, 2, 'rgba(90,70,40,.35)');
      const L = String(e.text || '').split('|');
      L.forEach((s, i) => txt(g, R, s, 16, -22 + i * 9 + (3 - L.length) * 4, 7, /憲法|おかえり/.test(s) ? '#a01810' : '#1a1410'));
    },
    minka(g, e, t, R) {   // 3×2 的老房子
      R(-3, -10, 54, 6, '#16141a'); R(-1, -14, 50, 4, '#1e1c22'); R(4, -17, 40, 3, '#121016');
      for (let x = -2; x < 50; x += 4) R(x, -9, 1, 4, '#26242a');
      R(-3, -4, 54, 6, '#22202a'); R(-3, 2, 54, 2, '#0e0c10');
      R(1, 4, 46, 28, '#4a3a2a'); for (let x = 1; x < 47; x += 3) R(x, 4, 1, 28, '#3e3022');
      R(3, 10, 13, 14, '#2e241a'); R(32, 10, 13, 14, '#2e241a'); for (let y = 11; y < 24; y += 3) { R(3, y, 13, 1, '#241c14'); R(32, y, 13, 1, '#241c14'); }
      R(18, 12, 12, 20, '#140f0b'); R(23, 12, 1, 20, '#2a2018'); R(0, 30, 48, 2, '#1a140e');
      if (e.face && Math.sin(t * .8 + e.px) > .55) { R(35, 16, 3, 2, '#d8d0c4'); R(36, 16, 1, 1, '#000'); }
    },
    naya(g, e, t, R) {   // 2×2 铁皮顶仓库
      R(-3, -9, 38, 4, '#6a6a64'); R(-3, -5, 38, 5, '#4e4e4a'); R(4, -8, 6, 2, '#7a4a2a'); R(20, -6, 8, 2, '#6a3a22');
      R(1, 0, 30, 32, '#5a4632'); for (let x = 1; x < 31; x += 4) R(x, 0, 1, 32, '#4a3826');
      R(9, 10, 14, 22, e.open ? '#050404' : '#3a2a1c'); if (!e.open) { R(9, 18, 14, 2, '#6a5a40'); R(15, 12, 2, 18, '#2a1e14'); }
    },
    yagura(g, e, t, R) {
      R(3, -40, 1, 55, '#3a2e22'); R(12, -40, 1, 55, '#3a2e22'); for (let y = -32; y < 12; y += 11) { R(3, y, 10, 1, '#3a2e22'); R(4, y + 5, 8, 1, '#2e241a'); }
      R(1, -44, 14, 3, '#4a3a2a'); R(2, -56, 12, 3, '#2a221a'); R(4, -53, 1, 9, '#3a2e22'); R(11, -53, 1, 9, '#3a2e22'); R(6, -52, 4, 5, '#7a5a2a'); R(7, -47, 2, 1, '#5a4020');
    },
    shelter(g, e, t, R) {   // 2 格宽的木头候车亭
      R(-1, -18, 34, 3, '#4a3020'); R(0, -15, 32, 21, '#5e4e3a'); for (let x = 0; x < 32; x += 4) R(x, -15, 1, 21, '#4e3e2c');
      R(2, 4, 28, 3, '#6a5238'); R(3, 7, 2, 7, '#3a2a1c'); R(27, 7, 2, 7, '#3a2a1c');
      R(22, -12, 7, 9, '#d8d4c4'); R(23, -11, 5, 2, '#a03020'); R(23, -7, 5, 1, '#5a5650');
      if (!e.read) { const b = Math.sin(t * 4) > 0 ? 1 : 0; R(7, -9 + b, 6, 7, '#ece4cc'); R(9, -10 + b, 2, 1, '#c8c0a8'); }
    },
    kennel(g, e, t, R) {
      R(2, 2, 12, 12, '#5a3a24'); R(1, -1, 14, 4, '#3a2418'); R(6, 7, 4, 7, '#0a0606');
      const taut = e.taut != null && W.t >= e.taut && W.t - e.taut < 3;
      if (taut) for (let i = 0; i < 6; i++) R(9 + i, 12 - i, 1, 1, '#9a9a96'); else { R(9, 12, 6, 1, '#8a8a86'); R(13, 13, 2, 1, '#8a8a86'); }
    },
    hokora(g, e, t, R) {
      R(3, 10, 10, 5, '#5a5a56'); R(4, 1, 8, 9, '#6a4a30'); R(2, -3, 12, 4, '#3a2a20'); R(6, 3, 4, 6, '#2a1a10');
      R(7, 4, 2, 4, '#e8e4d8'); R(3, 9, 2, 3, '#e0b030'); R(11, 9, 2, 3, '#e8e8e0');
      if (e.lit) { const f = Math.sin(t * 13) > 0 ? 1 : 0; R(7, 8, 2, 2, '#e8e2cc'); R(7, 6 + f, 2, 2 - f, '#ffcf5a'); }
    },
    cans(g, e, t, R) {   // 挂满空罐头的草绳（竖着拦在路上）
      const sw = e.rung != null && W.t >= e.rung && W.t - e.rung < 1.5 ? Math.round(Math.sin(t * 30) * 2) : 0;
      if (e.end === 't') R(6, -3, 3, 6, '#5a4a32'); if (e.end === 'b') R(6, 12, 3, 6, '#5a4a32');
      R(7, 0, 1, 16, '#9a8a62');
      R(4 + sw, 3, 4, 4, '#b8bcc0'); R(4 + sw, 3, 4, 1, '#e4e8ea'); R(8 - sw, 10, 4, 4, '#a8acb0'); R(8 - sw, 10, 4, 1, '#dce0e2');
    },
    camcorder(g, e, t, R) { R(3, 8, 8, 5, '#1a1a1e'); R(10, 9, 3, 3, '#2a2a30'); R(11, 10, 1, 1, '#6ab0ff'); if (Math.sin(t * 5) > 0) R(4, 9, 1, 1, '#ff3030'); R(5, 7, 4, 1, '#2a2a30'); },
    dosign(g, e, t, R) {   // 岔路口的路牌（字会变）
      R(7, -4, 2, 19, '#4a3a28'); box(R, -12, -30, 40, 27, '#5a4630', '#2a2014');
      String(e.text || '').split('|').forEach((s, i) => txt(g, R, s, 8, -24 + i * 8, 7, '#ece4cc'));
    },
    rubble(g, e, t, R) { R(0, 4, 16, 11, '#4a4a48'); R(1, 2, 9, 5, '#686864'); R(8, 6, 7, 5, '#5a5a56'); R(2, 3, 6, 1, '#82827c'); R(11, 0, 1, 6, '#6a3a20'); R(4, 13, 10, 2, '#2a2a28'); },
    tlamp(g, e, t, R) { R(5, 3, 6, 5, '#1e1e1c'); R(6, 4, 4, 3, e.off ? '#2a2420' : '#ffb460'); R(5, 8, 6, 1, '#141412'); }
  };

  /* ---------- 文本 ---------- */
  const NOTES_I = {
    n_rumor: { title: '拓也打印的网页', text: '【福冈最恐】犬鸣村の噂まとめ（网友投稿整理）\n\n·旧犬鸣隧道早就被水泥块封死了。翻过去往里走，有一个地图上没有的村子。\n·村口立着一块牌子：「この先、日本国憲法つうじません」\n　（此处之后，日本国宪法不适用）\n·村子四周拉着挂满空罐头的绳子。一碰就响，村里人就知道有外人来了。\n·村里的人会拿着斧头追人。\n·靠近隧道，手机就没有信号，车子会熄火。\n·峠上的电话亭，半夜会响。\n\n※以上均为网友投稿，真伪不明。\n\n（页边是拓也的圆珠笔字：「全部打卡！标题就叫『潜入！犬鸣村』」）' },
    n_notice: { title: '路边的告示牌', text: '旧犬鸣隧道\n本隧道年久失修，有塌落危险，\n车辆及行人一律禁止通行。\n　　　　　　　　　　——道路管理者\n\n（告示下面，有人用红漆歪歪扭扭地加了一行：）\nこの先、日本国憲法つうじません\n\n（又有人用黑色记号笔把它划掉，在旁边写：）\n骗人的。那边只有水库。\n别再来了。' },
    n_memo: { title: '钉在长椅上的纸', text: '给下一个走到这里的人：\n\n一、这里的路牌会自己改字。别信。\n二、手机上的地图（GPS）会乱跳。别信。\n三、只有信号格不会骗人。\n　　哪条路信号多一格，哪条路就是回去的路。\n四、回去的时候，要倒着走出隧道。\n　　眼睛一直看着村子，直到出了洞口。\n　　背对它的人，会被它重新领回来。\n五、峠上的电话亭要是响了——\n　　不管里面是谁的声音，都别接。\n\n　　　　　　　　　　　　　一九九九年夏　Y\n\n（纸的背面，铅笔字已经很淡了：「它们会学人说话。」）' },
    n_video: { title: '拓也的摄像机（回放）', text: '[00:12] 「凌晨零点二十五分，我现在在旧犬鸣隧道里面——」\n　　　　（画面里只有手电筒的光，和滴水声）\n[03:40] 隧道出口。一块木牌。\n　　　　「……这字，刚才不是这么写的吧？」\n[05:02] 一排黑瓦的房子。屋前站着几个人，\n　　　　全都脸朝着墙，一动不动。\n[05:30] （小声）「……喂，打扰了？」　没有人回头。\n[06:15] 哐啷——（罐头的声音）。远处一声狗叫。\n[06:20] 一个戴草帽的人从路那头走过来。\n　　　　腰上挂着油灯，手里拖着斧头。\n[06:41] 拓也在跑。喘气声。画面扫过一间铁皮顶的仓库，\n　　　　在村子的西南角。\n[06:58] （画面黑了，录音还在继续）\n　　　　「……千夏……打不通……」\n[07:30] 门外有人说：「拓也，开门。是我，千夏。」\n\n（录像到这里为止。）' }
  };
  const ITEMS_I = {
    phone: { name: '手机', desc: '2008 年的翻盖手机，带 GPS 地图。屏幕右上角一排信号格。' },
    key: { name: '车钥匙', desc: '舅舅那辆旧车的钥匙。钥匙圈上挂着一只褪了色的招财猫，是舅舅从太宰府带回来的。' },
    flash: { name: '拓也的手电筒', desc: '在隧道的水坑边捡到的，还亮着。光圈比手机屏幕大多了。' },
    cam: { name: '拓也的摄像机', desc: '掉在村里的土路上。红色的录像灯还在一闪一闪。' }
  };
  /* ================= 信号格 ================= */
  const STG = [   // 三个岔路口：ok 是真正回去的路；路牌和 GPS 都在骗人
    { ok: 'e', sign: '↑ 宮若市|← 犬鳴ダム|→ 犬鳴村', sign2: '↑ 出口|← 宮若市|→ 犬鳴村', gps: '手机地图上，蓝点在三条路之间跳来跳去，最后停在左边那条上。\n导航的女声说：「请向左转。」' },
    { ok: 'n', sign: '↑ 犬鳴村|← 宮若市|→ 宮若市', sign2: '↑ 犬鳴村|← 犬鳴村|→ 出口', gps: '蓝点跳到了右边那条路上。\n导航说：「前方，右转。」' },
    { ok: 'w', sign: '↑ 出口|← 犬鳴村|→ 出口', sign2: '↑ 宮若市|← 犬鳴村|→ 宮若市', gps: '蓝点又跳了——落进地图上一大片蓝色的正中间。\n「犬鸣水库」。湖心。\n导航说：「请直行。」' }
  ];
  const DIRNAME = { n: '北边（上面）', w: '西边（左边）', e: '东边（右边）' };
  function forkBranch(x, y) {
    if (x === 10 && y <= 6) return ['n', 7 - y];
    if (y === 8 && x <= 7) return ['w', 8 - x];
    if (y === 8 && x >= 13) return ['e', x - 12];
    return [null, 0];
  }
  function bars(S) {
    const m = S.map, x = S.pl.x, y = S.pl.y, f = S.f;
    if (m === 'pass') return (f.ph === 'booth' || f.ph === 'done') ? (y >= 9 ? 4 : 3) : f.ph === 'wait' ? (y >= 5 ? 3 : 2) : (y >= 5 ? 2 : 1);
    if (m === 'tunnel') { if (f.ph === 'exit') return f.exitGo && W.timer ? Math.max(0, Math.min(4, Math.ceil(W.timer.left / EXIT_T * 4))) : 1; return x >= 24 ? 1 : 0; }
    if (m === 'village') { if (f.sealed) return (x <= 8 && y >= 13) ? (y >= 17 ? 2 : 1) : 0; return (x >= 22 && y <= 6) ? 1 : 0; }
    if (m === 'forks') {
      const [b, d] = forkBranch(x, y), st = STG[Math.min(2, f.stage || 0)];
      if (!b) return y >= 13 ? 0 : 1;
      if (b === st.ok) return d >= 4 ? 3 : d >= 2 ? 2 : 1;
      return d >= 2 ? 0 : 1;
    }
    return 0;
  }
  function hudTick(S) {
    const h = S.ent('hud'); if (!h) return;
    const p = W.pl; h.px = p.px; h.py = p.py; h.x = p.x; h.y = p.y;
    h.hidden = !S.f.phone || S.f.ph === 'done';
    const b = bars(S); h.num = b;
    if (S.f.phone && LASTBAR >= 0 && b !== LASTBAR && !W.ended) {
      sigBeep(S, b > LASTBAR);
      if (S.map === 'forks' && !W.busy && (S.f.ftoast || 0) < 3) { S.f.ftoast = (S.f.ftoast || 0) + 1; S.toast(b ? `信号 ${b} 格 ${b > LASTBAR ? '↑' : '↓'}` : '信号：圏外 ✕'); }
      if (S.map === 'tunnel' && !b && S.once('tun0')) S.toast('信号：圏外 ✕');
    }
    LASTBAR = b;
  }
  const HUD = { id: 'hud', x: 0, y: 0, spr: 'sighud', z: 5, solid: false, hidden: true, num: 0, light: { r: 1.1, pl: true, dx: 16, dy: -13, col: 'rgba(150,240,200,.12)' } };

  /* ================= 犬鸣峠 ================= */
  async function passIntro(S) {
    S.f.ph = 'wait';
    await S.narr('盛夏的深夜。山里的虫子叫成一片。\n车灯照着一条长满杂草的旧公路，路的尽头，是一面石壁。');
    S.focus(9, 3);
    await S.narr('石壁上嵌着一个拱形的隧道口——被灰白的水泥块，一层一层砌死了。\n只在最上面，留着一道黑黢黢的缝。');
    S.focus(null);
    await S.say('拓也', ['看！真封死了！跟网上说的一模一样。', '旧犬鸣隧道。据说从那道缝爬过去，再往里走，就是地图上没有的那个村子。']);
    await S.say('千夏', '……你真要进去？');
    await S.say('拓也', ['就十分钟。拍一段隧道，再拍一下那块牌子就回来。', '你在车边等我。手机有信号，有事我打给你。', '对了——峠上的电话亭要是响了，别接啊。网上都这么说。嘿嘿。']);
    await S.walk('taku', [9, 3], 3); S.face('taku', 3);
    S.sfx('step'); await S.wait(300); S.sfx('step');
    await S.alpha('taku', 0, 700);
    await S.narr('他把摄像机挂在脖子上，踩着水泥块爬上去，从那道缝里钻了进去。\n手电筒的光晃了两下，就看不见了。');
    S.give('phone', true); S.give('key', true); S.f.phone = true;
    await S.narr('你掏出手机看了一眼。凌晨零点二十分。\n屏幕右上角的信号格，还有三格。');
    S.toast('头顶的小图标：手机信号格');
    S.bubble('car', '!', 2600);
    S.goal('回车上等拓也（车停在路的下面；也可以先四处看看）');
  }
  async function carOn(S) {
    const ph = S.f.ph;
    if (ph === 'wait') {
      if (S.once('rumor')) { await S.narr('舅舅借你的旧车。副驾驶座上扔着一张拓也打印的网页。'); await S.note('n_rumor'); }
      const r = await S.ask('坐回车里等他吗？', ['坐进去等', '再看看周围']);
      if (r) return;
      return callEvent(S);
    }
    if (ph === 'booth') return goodEnd(S);
    if (S.once('stall')) { S.sfx('car'); await S.narr('你想把车往前挪一点，用大灯照照那道缝——\n钥匙拧下去，发动机「咔、咔」响了两声，熄了火。'); await S.think('……网页上写着，车子靠近这里会熄火。'); return; }
    await S.narr('车灯还亮着，照着那堵水泥块。\n副驾驶座上空荡荡的。');
    await S.think('拓也还在里面。');
  }
  async function callEvent(S) {
    await S.narr('你坐进驾驶座，拔下钥匙攥在手心。钥匙圈上的招财猫，叮当一声。');
    await S.fade(1, 700);
    await S.card('二十分钟后', '凌晨零点四十分', '拓也没有回来。\n信号格，掉到了两格。');
    S.f.ph = 'enter'; S.pos(10, 12, 3);
    await S.fade(0, 600);
    S.sfx('phone'); await S.wait(700); S.sfx('phone');
    await S.narr('手机响了。来电显示：拓也。');
    S.fx('static'); S.sfx('tv');
    await S.say('拓也（电话）', ['……千夏……听得见吗……', '……这里……有个村子……路牌上……写着……日本国……宪法……', '……别……ザ……信号……往……ザザ……'], { style: 'whisper' });
    await S.narr('电话断了。再拨回去——「您拨打的电话不在服务区」。');
    S.focus(13, 8); S.ent('booth').s.ring = true;
    ring(S); await S.wait(1500); ring(S);
    await S.narr('叮铃铃——叮铃铃——\n路边的电话亭亮着青白的灯，在响。');
    ring(S); await S.wait(1600);
    S.ent('booth').s.ring = false;
    await S.narr('……响了五声，停了。');
    S.focus(null);
    await S.think('深更半夜，谁会往山里的电话亭打电话？\n……拓也说过，别接。');
    S.goal('从水泥块上的缝爬进隧道，去找拓也');
    S.cp();
  }
  async function portalOn(S) {
    const ph = S.f.ph;
    if (ph === 'wait') return S.narr('灰白的水泥块砌到了拱顶下面，只剩一道一尺来宽的缝。\n块子上喷着红漆，已经看不清写的是什么。\n拓也说十分钟就回来——你答应过在车边等他。');
    if (ph === 'booth') return S.narr('那道缝黑漆漆的。\n你不想再看它第二眼。');
    const r = await S.ask('水泥块最上面那道缝，刚好能钻进一个人。', ['爬进去', '再等等']);
    if (r) return;
    S.sfx('step');
    await S.narr('你踩着水泥块的棱角爬上去，侧着身子，从缝里挤了进去。\n水泥擦过后背，凉得像井水。');
    await S.go('tunnel', 34, 3, 1);
  }
  async function boothOn(S) {
    const ph = S.f.ph;
    if (ph === 'wait') return S.narr('一座老式电话亭，玻璃上蒙着一层灰。里面是一台绿色的公用电话。\n这条路封了这么多年……它的灯居然还亮着。');
    if (ph === 'booth') return boothAsk(S);
    await S.narr('电话已经不响了。听筒挂在钩子上，冰凉冰凉的。\n投币口积满了灰——可数字键上的「1」和「9」，被谁磨得发亮。');
  }
  async function boothStart(S) {
    S.f.ph = 'booth'; S.f.boothSet = true; S.f.boothAsked = false;
    S.wear('@me'); S.norun(false); S.speed(.9);
    S.place('taku', 10, 3, 3); S.ent('taku').alpha = 1; S.follow('taku', true);
    await S.narr('你们一直退到水泥块外面，后背撞上了山里的夜风，才敢转过身来。');
    await S.narr('车还停在原地，车灯亮着。\n手机屏幕上——信号三格。');
    S.ent('booth').s.ring = true; S.f.ring = true; RINGT = 0;
    await S.narr('叮铃铃——叮铃铃——\n路边的电话亭，又响了。');
    await S.say('拓也', '……别管它。去车上。');
    S.goal('回到车上（别管电话亭）');
    S.cp('booth');
  }
  async function boothCall(S) {
    S.f.boothAsked = true; S.f.ring = false; S.ent('booth').s.ring = false;
    S.focus(13, 8);
    await S.narr('走到电话亭边上的时候，铃声停了。\n……然后，玻璃里面传出了说话声。明明没有人拿起听筒。');
    await S.say('电话亭', ['……千夏？是千夏吗？我是拓也。', '我在车里等你半天了……你在哪儿？快回来啊。'], { style: 'whisper' });
    await S.narr('是拓也的声音。\n拓也就站在你身后，脸白得像纸。他一个字也没说。');
    S.focus(null);
    return boothAsk(S);
  }
  async function boothAsk(S) {
    S.ent('booth').s.ring = true; ring(S);
    const r = await S.ask('电话亭在响。里面有人在叫你的名字。', ['拉开门，接起电话', '不接。上车']);
    S.ent('booth').s.ring = false;
    if (r === 0) return boothBad(S);
    S.f.ring = true;
    await S.narr('你攥住拓也的手腕，头也不回地往车那边走。\n身后的铃声，一声比一声急。');
    S.goal('上车，离开这里');
  }
  async function boothBad(S) {
    S.f.ring = false; S.ent('booth').s.ring = false;
    await S.narr('你拉开电话亭的门，拿起了听筒。\n听筒是温的，像刚有人握过。');
    await S.say('听筒', '……千夏。你终于接了。', { style: 'whisper' });
    await S.narr('你回过头，想让拓也也听听——\n身后没有人。\n车灯照着一片空荡荡的柏油路。');
    S.ent('booth').face = true;
    await S.scare('face', { face: 'voice', dur: 1 });
    await S.say('听筒', 'おかえり。\n（欢迎回来。）', { style: 'big' });
    await S.fade(1, 1200);
    return S.end({ bad: true, id: 'booth', title: '电话亭', text: '第二天早上，巡山的人在旧犬鸣隧道外面，发现了一辆车灯还亮着的旧车。\n车门开着，钥匙上挂着一只招财猫。\n路边电话亭的听筒，垂在半空中，轻轻地晃。\n\n据说，从那以后，犬鸣峠的电话亭半夜还会响。\n接起来的人，会听见两个年轻人的声音，在问回去的路。' });
  }
  async function goodEnd(S) {
    S.f.ring = false; S.f.ph = 'done'; S.ent('booth').s.ring = false;
    S.follow('taku', false); S.hide('taku');
    await S.narr('你们钻进车里。你拧了三次钥匙，发动机才咳嗽着转起来。');
    await S.fade(1, 900); S.amb('car');
    await S.card('下山的路上', '凌晨三点十二分', '谁都没有说话。\n后视镜里，那条旧路很快就被树影吞掉了。');
    S.sfx('phone'); await S.wait(500); S.sfx('blip');
    await S.narr('拐过一个弯，手机忽然震个不停。信号——四格。\n「未接来电　23」。全是拓也。');
    await S.narr('最后一个，是凌晨两点五十一分。\n那时候你们正在隧道里倒着走，他就在你身边，攥着你的袖子。');
    await S.say('拓也', ['……我的手机，进隧道没多久就没电了。', '一直到现在，都开不了机。']);
    if (S.has('cam')) await S.narr('他把摄像机抱在怀里，一路没有松手。\n后来那段录像，你们谁都没有再放过。\n——只有一次，拓也说，回放到最后，画面角落里一直有一盏油灯，跟着你们出了隧道。');
    if (S.f.prayed) await S.narr('天亮的时候，车开过新隧道口的观景台。山谷里那片水库，在晨光里静得像一面镜子。\n你想起石壁下那座小小的祠，和那把还很新鲜的野花。\n在心里，又轻轻拜了一下。');
    return S.end({ id: 'out', title: '第三夜　完', text: '那段视频，最后没有传到网上去。\n\n后来你查过：犬鸣这个名字是真的，水库也是真的。\n水库底下，原本是一片有人住过的山谷——\n住在那里的人，早就搬走了，过着和你一样平常的日子。\n\n至于那块牌子、那串罐头、那个提着斧头的人……\n你再也没有对任何人说起。\n\n只是从那以后，手机信号一掉到一格，你就会停下来，\n倒着，往回走。' });
  }

  /* ================= 旧犬鸣隧道 ================= */
  async function tunEnter(S, first) {
    if (S.f.ph === 'exit') return exitStart(S);
    S.goal('穿过隧道，找拓也');
    if (!first) return;
    await S.narr('隧道里比外面冷了十度。\n水从拱顶上滴下来，啪嗒，啪嗒，在脚边砸出一个个小水坑。');
    await S.think('拓也？……拓也！');
    await S.narr('回声来回撞了好几遍，没有人应。');
  }
  async function flashOn(S) {
    S.give('flash'); S.hide('flash'); S.plr(3.3);
    await S.narr('水坑边上滚着一支手电筒，还亮着。\n是拓也的。握把上缠着他那条红色的胶带。');
    await S.think('他是跑着把它掉在这儿的？');
  }
  async function tunGps(S) {
    S.sfx('blip');
    await S.narr('手机在口袋里震了一下。是 GPS 地图。\n屏幕上那个蓝点在跳：宫若市……久山町……又跳回宫若市。');
    await S.narr('最后，蓝点停在了一片什么都没有标的灰色上。');
    await S.think('隧道里收不到 GPS 吧……\n——可信号格，是一格一格掉下去的。');
  }
  async function toVillage(S) {
    if (S.f.ph === 'exit') { await S.think('那边是村子。\n……不能往回走。'); S.pos(Math.max(2, S.pl.x + 2), S.pl.y); return; }
    await S.narr('前面透进来一点灰白的光。\n是月光。');
    await S.go('village', 25, 3, 0);
  }
  async function toPassT(S) {
    if (S.f.ph === 'exit') return exitDone(S);
    await S.go('pass', 9, 3, 0);
  }
  /* ---- 出隧道：倒着走 ---- */
  async function exitStart(S) {
    S.clearTimer(); S.wear('@me'); S.norun(false); S.speed(.9);
    S.f.exitGo = false; S.f.v1 = false; S.f.v2 = false; S.f.vturn = 0;
    for (const id of ['mur1', 'mur2']) { S.stop(id); S.hide(id); }
    S.pos(5, 3, 2); S.place('takuT', 4, 3, 2); const tk = S.ent('takuT'); tk.spr = '@taku'; tk.alpha = 1; S.follow('takuT', true);
    S.goal('走出隧道');
    S.cp('exit');
    await S.narr('黑洞洞的拱形洞口。滴水声。\n——就是你们来时的那条隧道。');
    S.place('mur1', 0, 2, 2); S.place('mur2', 0, 5, 2); S.ent('mur1').alpha = 0; S.ent('mur2').alpha = 0;
    S.focus(2, 3); S.sfx('step'); await S.wait(300);
    S.alpha('mur1', 1, 900); await S.alpha('mur2', 1, 900);
    howl(S, false);
    await S.narr('身后，村子那头，亮起了两盏油灯。\n草帽。斧头。它们站在洞口，一动不动地看着你们。');
    S.focus(null);
    if (DIED) await S.think('倒着走。别停，也别回头——不管谁在身后叫你。');
    await S.say('拓也', S.f.memo ? '……那张纸上写着，要倒着走出去。一直看着村子。' : '……网上有人说，从那种地方出来，不能背对着它。');
    return exitAsk(S);
  }
  async function exitAsk(S) {
    const r = await S.ask('怎么出去？', ['倒着走出去（一直看着村子）', '转过身，拼命跑']);
    if (r === 1) {
      S.f.turnRun = (S.f.turnRun || 0) + 1;
      await S.narr('你拽着拓也转身就跑。\n脚步声在隧道里炸开，前面那一点光越来越大——你们冲了出去。');
      await S.fade(1, 400); S.pos(5, 3, 2); S.place('takuT', 4, 3, 2); S.sfx('sting'); S.fx('glitch'); await S.fade(0, 400);
      await S.narr('……眼前，是那块木牌：「おかえりなさい」。\n身后，还是那个黑洞洞的隧道口。两盏油灯，就在洞口边上。');
      await S.think(S.f.turnRun >= 2 ? '背对着它跑，就会被它领回来。\n只能倒着走——脸朝着村子，一步一步往后退。' : '……跑不出去。\n背对着它的人，会被它重新领回来？');
      return exitAsk(S);
    }
    S.wear('meBack'); S.ent('takuT').spr = 'takuBack';
    S.norun(true); S.speed(.6);
    S.f.exitGo = true;
    await S.narr('你面朝着村子，脚跟先落地，一步，一步，往后退。\n拓也攥着你的袖子，跟着你一起退。');
    S.goal('倒着走出隧道（一直看着村子，别转身）——信号没了之前' + (S.coop ? '（双人：一人盯着油灯，一人替同伴看出口那边的路）' : ''));
    if (S.coop) S.toast('双人：观看的一方替同伴看着出口那边的路');
    S.timer(EXIT_T, '信号', exitFail, { during: true });
    S.chase('mur1', { spd: 1.5, catch: exitCaught, wait: 2 }); S.chase('mur2', { spd: 1.4, catch: exitCaught, wait: 2.4 });
  }
  const VOICE = [
    null,
    ['身后——出口那边，有人在叫你。', '千夏！这边！出口在这边——你转过来看看我啊！', '是拓也的声音。\n可拓也就在你旁边，攥着你的袖子，眼睛一直盯着村子那边。', '身后有人叫你的名字。'],
    ['……又是那个声音。就贴在你耳朵后面。', '千夏……为什么不看我？', '袖子上，拓也的手抖得厉害。', '那个声音，就贴在你的后颈上。']
  ];
  async function voice(S, k) {
    S.f['v' + k] = true;
    const [lead, line, after, q] = VOICE[k];
    S.sfx('step'); await S.wait(250); S.sfx('step');
    await S.narr(lead);
    await S.say('？？？', line, { style: 'whisper' });
    await S.narr(after);
    const r = await S.ask(q, ['回头看', '不回头，继续倒着走']);
    if (r === 1) { await S.narr(k === 1 ? '你咬住嘴唇，盯着那两盏油灯，一步一步往后退。\n身后的声音叫了两声，不叫了。' : '你闭了一下眼睛。再睁开时，耳边只剩下滴水声。'); return; }
    S.f.vturn++;
    S.wear('@me'); S.turn(2);
    await S.scare('face', { face: 'voice', dur: .9 });
    S.wear('meBack');
    if (S.f.vturn >= 2) { S.clearTimer(); for (const id of ['mur1', 'mur2']) S.stop(id); return S.die('你又回头了。\n身后的出口不见了——只剩下那块木牌，和木牌上的四个字：おかえり。', '你背对了村子'); }
    S.timerAdd(-5);
    const p = S.pl, bx = Math.max(1, p.x - 4);
    for (const [id, dy] of [['mur1', -1], ['mur2', 1]]) { let y = Math.max(2, Math.min(5, p.y + dy)); if (!passable(W.maps.tunnel, bx, y, S.ent(id))) y = p.y; S.place(id, bx, y, 2); }
    await S.narr('身后什么都没有。\n可等你再看向村子那边——那两盏油灯，已经近得能看清草帽底下的下巴了。');
    await S.think('背对它的人，会被它重新领回来……\n不能再回头了。');
  }
  async function exitFail(S) {
    if (!S.f.exitGo) return;
    S.f.exitGo = false; for (const id of ['mur1', 'mur2']) S.stop(id);
    S.sfx('blip');
    await S.narr('手机屏幕上，最后一格信号，灭了。\n「圏外」。');
    S.focus(null); await S.scare('static', { dur: 1 });
    DIED++;
    return S.die('你身后的出口，不见了。\n隧道的两头，都是村子。', '信号没了');
  }
  async function exitCaught(S) {
    S.clearTimer(); S.focus(null); S.f.exitGo = false; for (const id of ['mur1', 'mur2']) S.stop(id);
    chop(S);
    await S.scare('face', { spr: '@mura', dur: .9 });
    DIED++;
    return S.die('油灯的光贴到了你的脸上。\n你一直盯着它——可你退得太慢了。', '被追上了');
  }
  async function exitDone(S) {
    S.clearTimer(); S.f.exitGo = false; S.focus(null);
    for (const id of ['mur1', 'mur2']) { S.stop(id); S.hide(id); }
    S.follow('takuT', false); S.hide('takuT');
    await S.narr('后背碰到了冰凉的水泥块。\n你摸到那道缝，倒着，一点一点挤了出去。\n那两盏油灯停在隧道里，没有再跟过来。');
    await S.go('pass', 9, 3, 3);
  }

  /* ================= 犬鸣村 ================= */
  const VWP = [[3, 9], [27, 9], [27, 8], [3, 8]];
  function patReset(S) {
    PAT = { st: 'patrol', wp: 1, t: 0, lost: 0, ax: 0, ay: 0, look: 0, hear: 0 };
    S.stop('mura'); S.freeze('mura', false); S.place('mura', 5, 9, 2); S.ent('mura').alpha = 1;
  }
  function solidEntAt(m, x, y) { return m.ents.some(z => !z.hidden && z.solid && typeof z.spr === 'string' && z.spr[0] !== '@' && x >= Math.round(z.px / TS) && x < Math.round(z.px / TS) + z.w && y >= Math.round(z.py / TS) && y < Math.round(z.py / TS) + z.h); }
  function canSee(m, e, p) {
    if (W.pl.hidden) return false;
    const ex = Math.round(e.px / TS), ey = Math.round(e.py / TS), dx = p.x - ex, dy = p.y - ey;
    if (Math.abs(dx) + Math.abs(dy) <= 1) return true;
    const d = e.dir; let ok = false;
    if (d === 2) ok = dx > 0 && dx <= 5 && Math.abs(dy) <= 1;
    else if (d === 1) ok = dx < 0 && -dx <= 5 && Math.abs(dy) <= 1;
    else if (d === 0) ok = dy > 0 && dy <= 4 && Math.abs(dx) <= 1;
    else ok = dy < 0 && -dy <= 4 && Math.abs(dx) <= 1;
    if (!ok) return false;
    const n = Math.max(Math.abs(dx), Math.abs(dy));
    for (let i = 1; i < n; i++) { const x = Math.round(ex + dx * i / n), y = Math.round(ey + dy * i / n); if (tileSolid(m, x, y) || solidEntAt(m, x, y)) return false; }
    return true;
  }
  function spot(S, e) {
    PAT.st = 'spot'; PAT.t = S.f.spotN ? .9 : 1.6; S.f.spotN = (S.f.spotN || 0) + 1; e.mv = null;
    S.face('mura', 'pl'); S.bubble('mura', '!', 1200); S.sfx('sting'); chop(S);
    if (S.once('spotTip')) S.toast('被发现了！快跑，甩开它，或者躲进水桶里');
  }
  async function vilCaught(S) {
    PAT && (PAT.st = 'patrol');
    chop(S);
    await S.scare('face', { spr: '@mura', dur: .9 });
    DIED++;
    return S.die('草帽底下，那两点白光一眨不眨地看着你。\n斧头抬了起来。', '你被村里的人发现了');
  }
  function alarm(S, x, y, rope) {
    clank(S); howl(S, false, .35);
    const k = S.ent('kennel'); if (k) k.s.taut = W.t;
    if (rope) for (const id of rope) { const c = S.ent(id); if (c) c.s.rung = W.t; }
    if (PAT && PAT.st !== 'chase' && PAT.st !== 'spot') {
      if (!S.f.alarmed) { S.f.alarmed = true; const m = S.ent('mura'), dx = x - Math.round(m.px / TS), dy = y - Math.round(m.py / TS); m.dir = Math.abs(dx) > Math.abs(dy) ? (dx < 0 ? 1 : 2) : (dy < 0 ? 3 : 0); PAT.st = 'look'; PAT.t = 2.2; PAT.look = 1.4; S.bubble('mura', '?', 1400); S.toast('哐啷——！空罐头响了。草帽转过来张望……下次它就会走过来'); }
      else { PAT.st = 'alert'; PAT.ax = x; PAT.ay = y; S.bubble('mura', '!', 900); if (S.once('canTip')) S.toast('罐头又响了——提斧头的人朝这边来了！'); }
    }
  }
  function nearestWp(e) {
    const ex = Math.round(e.px / TS), ey = Math.round(e.py / TS); let bi = 0, bd = 1e9;
    VWP.forEach(([x, y], i) => { const d = Math.abs(x - ex) + Math.abs(y - ey); if (d < bd) { bd = d; bi = i; } });
    return bi;
  }
  function vilTick(S, dt) {
    HOWLT -= dt; if (HOWLT <= 0) { HOWLT = 16 + Math.random() * 12; howl(S, true); }
    const e = S.ent('mura'); if (!e || !PAT || e.hidden || W.ended) return;
    const m = W.maps.village, p = S.pl, ex = Math.round(e.px / TS), ey = Math.round(e.py / TS);
    if (PAT.st === 'chase') {
      const dist = Math.abs(ex - p.x) + Math.abs(ey - p.y);
      if (W.pl.hidden || dist > 8) PAT.lost += dt; else PAT.lost = 0;
      if (PAT.lost > 2.5) { S.stop('mura'); PAT.st = 'return'; S.bubble('mura', '?', 1400); }
      return;
    }
    if (PAT.st === 'spot') {
      if (W.busy && !S.f.hiding) return;
      PAT.t -= dt;
      if (PAT.t <= 0) { if (W.pl.hidden) { PAT.st = 'return'; return; } PAT.st = 'chase'; PAT.lost = 0; S.chase('mura', { spd: 2.9, catch: vilCaught }); }
      return;
    }
    if (W.busy && !S.f.hiding) return;
    if (!e.mv && canSee(m, e, p)) return spot(S, e);
    /* 跑步声会被听见：身后三格内跑动，它会回头 */
    if (S.running && Math.abs(ex - p.x) + Math.abs(ey - p.y) <= 3 && !e.mv) { S.face('mura', 'pl'); S.bubble('mura', '?', 800); return; }
    if (e.mv) return;
    if (PAT.st === 'look') {
      PAT.t -= dt; PAT.look -= dt;
      if (PAT.look <= 0) { e.dir = [0, 1, 3, 2][(Math.random() * 4) | 0]; PAT.look = .55; }
      if (PAT.t <= 0) PAT.st = 'return';
      return;
    }
    let tx, ty, spd = 1.5;
    if (PAT.st === 'alert') { tx = PAT.ax; ty = PAT.ay; spd = 2.5; }
    else if (PAT.st === 'return') { PAT.wp = nearestWp(e); [tx, ty] = VWP[PAT.wp]; }
    else [tx, ty] = VWP[PAT.wp];
    if (ex === tx && ey === ty) {
      if (PAT.st === 'alert') { PAT.st = 'look'; PAT.t = 2.4; PAT.look = 0; }
      else if (PAT.st === 'return') PAT.st = 'patrol';
      else PAT.wp = (PAT.wp + 1) % VWP.length;
      return;
    }
    const d = bfsStep(m, ex, ey, tx, ty, e);
    if (d < 0) { if (PAT.st === 'alert') { PAT.st = 'look'; PAT.t = 1.5; } return; }
    startMove(e, d, spd);
  }
  async function hideIn(S, e) {
    if (!PAT || S.map !== 'village') return S.narr('一只盛雨水的大木桶，盖子歪着。');
    S.f.hiding = true; S.hidePlayer(true); S.sfx('close');
    if (S.f.rescued) { S.follow('takuV', false); S.hide('takuV'); }
    if (S.f.rescued) await S.narr('你让拓也缩进屋檐底下的柴堆后面，自己掀开桶盖，蹲了进去。\n桶里一股烂木头和雨水的味道。');
    else await S.narr('你掀开桶盖，蹲了进去，把盖子轻轻拉回来。\n桶里一股烂木头和雨水的味道。');
    let t = 0;
    while (true) {
      await S.wait(250); t += .25;
      const m = S.ent('mura'), d = Math.abs(Math.round(m.px / TS) - S.pl.x) + Math.abs(Math.round(m.py / TS) - S.pl.y);
      if ((d >= 6 && PAT.st !== 'chase' && PAT.st !== 'spot') || t > 16) break;
      if (t % 1.5 < .25) heart(S, 1);
    }
    S.hidePlayer(false); S.f.hiding = false; S.sfx('open');
    if (S.f.rescued) { const p = S.pl; S.place('takuV', p.x, p.y, 0); S.follow('takuV', true); }
    await S.narr('脚步声远了。你慢慢地爬了出来。');
  }
  async function villageIntro(S) {
    S.f.ph = 'village';
    patReset(S);
    await S.narr('隧道的另一头，是一个村子。\n没有一盏灯。月光底下，黑瓦的屋顶一排挨着一排。');
    await S.narr('路边立着一块木牌：\n「ようこそ　犬鳴村へ」（欢迎来到犬鸣村）');
    S.sfx('blip');
    await S.narr('手机震了一下。你低头看——信号格的位置，只剩一个红色的「×」。\n「圏外」。');
    S.ent('kenpo').text = 'この先、|日本国憲法|つうじません'; S.sfx('sting'); S.shake(300, 1);
    await S.narr('你再抬起头的时候——\n木牌上的字，变了。');
    await S.say('木牌', 'この先、日本国憲法つうじません。\n（此处之后，日本国宪法不适用。）', { style: 'big' });
    await S.think('网页上的那块牌子……\n可刚才，它明明写的是「欢迎」。');
    howl(S, true);
    S.focus(8, 9);
    await S.narr('远处，一声狗叫，拖得很长。\n村子中间的土路上，有个人影在慢慢地走。');
    await S.narr('草帽。腰上挂着一盏小油灯。\n手里拖着一把斧头，斧刃在月光底下，亮了一下。');
    S.focus(null);
    await S.think('拓也……你在哪儿？');
    const r = await S.ask('怎么办？', ['去找拓也', '先一个人回去报警']);
    if (r === 1) { const r2 = await S.ask('真的把他一个人留在这里？', ['……回去报警', '不。去找他']); if (r2 === 0) return aloneEnd(S); }
    S.goal('找到拓也（别被提斧头的人看见；空罐头绳一碰就响）');
    if (S.coop) S.toast('双人：一个人操作，另一个人盯着那盏油灯的方向');
    S.cp('village');
  }
  async function mimicScene(S) {
    S.f.mimic = true;
    const p = S.pl, mx = p.x === 3 && p.y === 16 ? 2 : 3;
    S.place('mimic', mx, 16, 3); S.ent('mimic').alpha = 1; S.ent('mimic').spr = '@meX';
    S.focus(3, 15);
    S.sfx('knock'); await S.wait(300); S.sfx('knock');
    await S.narr('仓库门前站着一个人，正在敲门。');
    await S.say('？？？', '拓也，开门。是我，千夏。', { style: 'whisper' });
    await S.narr('……那是你的声音。\n连句尾往上挑的那个习惯，都一模一样。\n那个人身上，穿着和你一样的外套。');
    S.face('mimic', 0); S.sfx('sting'); S.fx('glitch');
    await S.narr('它慢慢地把头转了过来——\n脸是你的脸。眼睛的地方，是两个黑洞。');
    await S.alpha('mimic', 0, 500);
    await S.narr('眨一下眼，门前什么都没有了。\n只有门板上，留着几个湿漉漉的手印。');
    S.focus(null);
    await S.think('会学人说话的东西……\n拓也一定被它骗怕了。');
  }
  async function aloneEnd(S) {
    await S.narr('你转过身，一头扎回了隧道里。');
    await S.fade(1, 900); S.amb('drone');
    await S.narr('你跑了很久。久得不像一条隧道该有的长度。\n手机一直是「圏外」。');
    await S.narr('等你从水泥块的缝里滚出来的时候，天已经蒙蒙亮了。');
    return S.end({ bad: true, id: 'alone', title: '一个人', text: '警察来了，消防队也来了。\n他们说，旧犬鸣隧道很多年前就被水泥块封死了，\n连一条能钻过人的缝都没有。\n舅舅的车停在旧道上，怎么也打不着火，最后是拖车拖下山的。\n\n拓也再也没有找到。\n\n只是从那以后，你的手机每天夜里两点都会响一次。\n来电显示：拓也。\n信号格那里，永远是一个红色的「×」。' });
  }
  async function kenpoOn(S) {
    if (S.f.sealed) return S.narr('「おかえりなさい」——欢迎回来。\n木牌上的墨，像是刚写上去的，还在往下淌。');
    await S.narr('「この先、日本国憲法つうじません」\n——此处之后，日本国宪法不适用。');
    await S.narr('木牌钉得很结实，边角被雨水泡得发黑。\n可那几个字，墨色新得像是今晚才写的。');
  }
  async function camOn(S) {
    S.give('cam'); S.hide('cam');
    await S.narr('土路正中间躺着一台摄像机。红色的录像灯，还在一闪一闪。\n是拓也的。');
    await S.note('n_video');
    S.f.video = true;
    await S.think('西南角……铁皮顶的仓库。\n还有——会学我声音的东西。');
    if (!S.f.rescued) S.goal('找到拓也：村子西南角，铁皮顶的仓库');
  }
  async function shelterOn(S) {
    if (S.f.memo) { await S.narr('木头候车亭。站牌上写着「犬鳴」，时刻表那一栏一班车都没有。'); return S.note('n_memo'); }
    await S.narr('一个木头搭的候车亭。站牌上写着「犬鳴」，时刻表那一栏，一班车都没有。\n长椅的靠背上，有人用图钉钉了一张折起来的纸。');
    await S.note('n_memo');
    S.f.memo = true;
  }
  async function nayaOn(S) {
    if (S.f.rescued) return S.narr('仓库的门敞着。里面一股干草和机油的味道。');
    S.sfx('knock'); await S.wait(250); S.sfx('knock');
    await S.narr('铁皮顶的仓库。门从里面闩上了。\n你贴着门板，压低声音：「拓也？拓也，是我！」');
    await S.wait(500);
    await S.say('门里', ['……千夏？', '……不对。刚才也有人在外面，用你的声音叫我开门。', '你要真是千夏——你那串车钥匙上，挂的是什么？'], { style: 'whisper' });
    const r = await S.ask('车钥匙上挂着的是……', ['招财猫', '御守', '小熊挂件', '铃铛']);
    if (r !== 0) {
      const w = S.f.idWrong = (S.f.idWrong || 0) + 1;
      await S.narr('门里没有声音了。');
      await S.say('门里', '……走开。', { style: 'whisper' });
      alarm(S, 3, 16);
      await S.narr('远处，狗叫了一声。土路那边，油灯晃了晃，朝这边转了过来。');
      await S.think(w === 1 ? '钥匙……钥匙就揣在兜里。\n（打开随身物品，看看车钥匙）' : w === 2 ? '钥匙圈上那个褪了色的挂件——是舅舅从太宰府带回来的。' : '是招财猫。那只褪了色的招财猫。');
      return;
    }
    return rescue(S);
  }
  async function rescue(S) {
    S.sfx('open'); S.ent('naya').open = true;
    await S.narr('门闩「咔哒」一声拉开了。');
    const p = S.pl;
    S.place('takuV', p.x === 3 && p.y === 16 ? 2 : 3, 16, 0); S.ent('takuV').alpha = 0; await S.alpha('takuV', 1, 500);
    S.face('takuV', 'pl'); S.face('pl', 'takuV');
    await S.say('拓也', ['千夏……真的是你……', '对不起，对不起。我不该进来的。', '那些人……它们都脸朝着墙站着。我叫了一声，它们没回头——可是那个提斧头的，一下子就朝我走过来了。']);
    await S.say('拓也', ['我跑的时候崴了脚。手机也没电了。', '……我们快走吧。']);
    S.f.rescued = true; S.f.ph = 'rescued';
    S.follow('takuV', true); S.speed(.85);
    if (S.has('cam')) await S.narr('你把摄像机塞回他手里。他攥得指节发白。');
    if (!S.f.memo) { await S.say('拓也', '……对了。我逃过来的时候，看见村子中间那个候车亭的长椅上，钉着一张纸。\n上面好像写着……怎么出去。'); S.bubble('shelter', '!', 2600); }
    S.goal('扶着拓也，回到村口的隧道（东北角）' + (S.f.memo ? '' : '；候车亭里那张纸也许有用'));
    S.cp('village2');
  }
  async function sealEvent(S) {
    S.f.sealed = true; S.f.ph = 'sealed';
    S.sfx('thud'); S.shake(500, 2);
    S.ent('portal2').locked = true;
    await S.narr('你们回到村口的时候——\n隧道口不见了。');
    await S.narr('拱形的石框还在。可里面那个黑洞洞的口子，变成了一面长满青苔的石壁。\n摸上去，又冷又湿。像是已经这样过了几十年。');
    await S.say('拓也', '怎么会……我们明明就是从这儿出来的！');
    S.ent('kenpo').text = 'おかえり|なさい'; S.sfx('sting');
    await S.narr('旁边那块木牌上的字，又变了：\n「おかえりなさい」——欢迎回来。');
    await S.think(S.f.memo ? '……纸上写着：只有信号格不会骗人。' : '……手机。看看手机。');
    S.sfx('blip');
    await S.narr('GPS 地图上，你们的蓝点停在一大片蓝色的正中间。\n「犬鸣水库」。');
    await S.narr('你举着手机，慢慢转了一圈。\n屏幕朝着村子西南边的时候，信号格那里，跳出来一格。');
    S.goal('跟着信号走：村子西南角往山里去的小路');
    S.cp('sealed');
  }
  async function toForks(S) {
    if (!S.f.rescued) { await S.narr('一条往山里去的小路，黑得看不见尽头。'); await S.think('拓也还在村子里。'); S.pos(6, 18, 3); return; }
    if (!S.f.sealed) { await S.think('先回村口的隧道。从那儿来的，就从那儿回去。'); S.pos(6, 18, 3); return; }
    S.hide('takuV'); S.follow('takuV', false);
    S.f.ph = 'forks';
    await S.narr('信号格一直亮着一格。你们顺着小路，往山里走。');
    await S.go('forks', 10, 11, 3);
  }
  async function portal2On(S) {
    if (S.f.sealed) return S.narr('长满青苔的石壁。\n你用手电筒照了照缝隙——后面什么都没有。只有石头。');
    if (S.f.rescued) return S.narr('隧道口黑洞洞的。');
    await S.narr('你们来时的隧道口，黑洞洞的。');
    const r = await S.ask('一个人回去？', ['不。先找到拓也', '回去报警']);
    if (r === 1) return aloneEnd(S);
  }
  async function hokoraOn(S) {
    if (S.f.prayed) return S.narr('小小的祠前，蜡烛头还亮着一点光。\n那把野花很新鲜，像是今天早上才有人放的。');
    await S.narr('石壁脚下有一座小小的祠，还没到膝盖高。\n供着一把野花——还很新鲜。旁边一块小石碑，字被雨水磨平了，只认得出一个「犬」字。');
    const r = await S.ask('要拜一拜吗？', ['合掌拜一拜', '走开']);
    if (r) return;
    S.f.prayed = true; S.ent('hokora').lit = true; S.sfx('bell');
    await S.narr('你合起双手，低下头。\n……远处的狗叫，停了一拍。');
  }
  async function vilResume(S) {
    for (const id of ['c1', 'c2', 'c3', 'c4']) { const c = S.ent(id); if (c) c.s.rung = null; }
    const k = S.ent('kennel'); if (k) k.s.taut = null;
    patReset(S); S.hidePlayer(false); S.f.hiding = false; S.norun(false);
    if (S.f.rescued) { const p = S.pl; S.place('takuV', p.x, Math.min(16, p.y + 1), 0); S.follow('takuV', true); S.speed(.85); }
    else S.speed(1);
    if (DIED) await S.think('它只看得见前面，和身边一格。\n别在它身后跑——被发现了就甩开它，或者躲进水桶。');
  }

  /* ================= 岔路口 ================= */
  async function forkEnter(S, first) {
    if (!first) return;
    S.place('takuF', 10, 12, 3); S.follow('takuF', true);
    await S.narr('小路在树林里拐了几个弯，忽然分成了三条。\n路口立着一块路牌。');
    await S.say('拓也', '……路牌上写着，往北是宫若市。那就是外面吧？');
    await S.think(S.f.memo ? '纸上写着：路牌会骗人，GPS 会乱跳。\n只有信号格不会骗人。' : '路牌、GPS、信号格……\n总有一样是真的。');
    S.f.stage = 0;
    return forkStage(S, true);
  }
  async function forkStage(S, first) {
    const st = S.f.stage, d = STG[st];
    S.f.fw = 0;
    S.ent('dosign').text = d.sign;
    S.show('jizo', st >= 1); S.show('shoe', st >= 2);
    S.stop('muraF'); S.hide('muraF');
    if (!first) { S.pos(10, 9, 3); S.place('takuF', 10, 10, 3); S.follow('takuF', true); }
    S.f.ftoast = 0;
    S.goal(`岔路口 ${st + 1}/3：找出回去的路（每条岔路走进去两步，看信号格）` + (S.coop ? '（双人：一人盯信号格，一人盯身后的油灯）' : ''));
    if (S.coop) S.toast('双人：一个人盯着信号格，一个人盯着身后的油灯');
    S.cp('forks');
    S.sfx('blip');
    await S.narr(d.gps);
    if (st === 0 && S.once('gpsWarn')) await S.think('……它在这里根本不准。');
    return muraFIn(S, 16);
  }
  async function muraFIn(S, y) {
    S.place('muraF', 10, y, 3); S.ent('muraF').alpha = 0;
    S.tone('sine', 1318, 1318, .8, .05); S.tone('sine', 1046, 1046, 1, .04, .2);
    await S.alpha('muraF', 1, 800);
    if (S.once('muraFtip')) S.toast('身后的小路上，亮起了一盏油灯');
    S.chase('muraF', { spd: .65, catch: forkCaught });
  }
  async function forkCommit(S, b) {
    const st = S.f.stage, d = STG[st];
    S.stop('muraF');
    if (b === d.ok) {
      S.f.stage = st + 1; S.hide('muraF');
      await S.fade(1, 500);
      if (S.f.stage >= 3) return forksDone(S);
      await S.fade(0, 400);
      await S.narr('你们顺着那条路走了很久。\n信号格一格一格地多起来——又在下一个路口，掉回了一格。');
      return forkStage(S, false);
    }
    const w = S.f.fw = (S.f.fw || 0) + 1;
    await S.fade(1, 500);
    S.ent('dosign').text = w % 2 ? d.sign2 : d.sign;
    S.pos(10, 9, 3); S.place('takuF', 10, 10, 3); S.follow('takuF', true); S.hide('muraF');
    await S.fade(0, 400);
    howl(S, true);
    await S.narr(['你们走了很久，很久。\n——眼前，又是那块路牌。', '……又回来了。\n路牌上的字，和刚才不一样了。', '又是这里。\n远处的狗叫声，近了。', '又是这块路牌。\n拓也攥着你袖子的手，在发抖。'][Math.min(3, w - 1)]);
    if (w === 1) await S.think(S.f.memo ? '纸上写着——只有信号格不会骗人。\n刚才那条路上，信号格是什么样的？' : '路牌在骗人。\n……手机。看看信号格。');
    else if (w === 2) await S.think('先别急着走到头。\n每条岔路都往里走两步，看信号格——是多了一格，还是变成红色的「×」。');
    else if (w === 3) await S.think('三条岔路里，有两条一走进去就是「圏外」。\n只有一条，信号格会多出来——别管路牌，三条都试一遍。');
    else await S.think(`是${DIRNAME[d.ok]}那条。\n往那边走的时候，信号格多了一格。`);
    return muraFIn(S, Math.max(12, 16 - 2 * w));
  }
  async function forkCaught(S) {
    chop(S);
    await S.scare('face', { spr: '@mura', dur: .9 });
    DIED++;
    return S.die('油灯的光照到了你的后背。\n你在路口站得太久了。', '你没能选出那条路');
  }
  async function forksDone(S) {
    S.follow('takuF', false); S.hide('takuF');
    S.f.ph = 'exit';
    await S.narr('不知道走了多久。\n信号格亮到了三格——然后，前面的树林里，露出了一个黑洞洞的拱形洞口。');
    await S.say('拓也', '……是隧道。我们来时的那条隧道！');
    await S.go('tunnel', 5, 3, 2);
  }
  async function forkSouth(S) {
    await S.think('回去的路上……那盏油灯就在那边。');
    S.pos(10, 13, 3);
  }

  /* ================= 地图数据 ================= */
  const PASS_W = 20;
  const passCell = (x, y) => {
    if (y <= 2) return '#';
    if (x <= 5) { if (y <= 4 && x >= 4) return '"'; const h = hash(x, y, 303); return h < .42 ? 'P' : h < .78 ? 'T' : '"'; }
    if (x === 6 || x === 12) return '"';
    if (x >= 7 && x <= 11) return hash(x, y, 304) < .22 ? 'Q' : ':';
    if (x <= 14) return hash(x, y, 305) < .3 ? '"' : 'd';
    if (x === 15) return 'L';
    return 'V';
  };
  const VIL_W = 30;
  const vilCell = (x, y) => {
    if (y <= 2) return '#';
    if (y >= 17) { if (x === 6) return 'd'; return hash(x, y, 404) < .55 ? 'P' : 'T'; }
    if (x === 0 || x === 29) return 'P';
    if (y === 16) return x <= 27 ? 'd' : '"';
    if (y === 14 || y === 15) { if (x === 1 || x === 5) return 'd'; if (x >= 8 && x <= 27) return x % 7 === 3 ? 'd' : 'o'; return '"'; }
    if (y === 8 || y === 9) return 'd';
    if (x === 25 && y <= 7) return 'd';
    return '"';
  };
  const fkCell = (x, y) => {
    if (x >= 8 && x <= 12 && y >= 7 && y <= 10) return '"';
    if (x === 10 && y >= 1 && y <= 6) return 'd';
    if (y === 8 && x >= 1 && x <= 7) return 'd';
    if (y === 8 && x >= 13 && x <= 19) return 'd';
    if (x === 10 && y >= 11) return 'd';
    return hash(x, y, 505) < .5 ? 'P' : 'T';
  };
  const ROPES = { r1: ['c1', 'c2'], r2: ['c3', 'c4'] };
  const cans = (id, x, y, end, rope) => ({ id, x, y, spr: 'cans', decal: true, solid: false, end, touch: S => alarm(S, x, y, ROPES[rope]), on: S => S.narr('一根草绳横拦在路上，挂满了生锈的空罐头。\n风一吹，罐头就轻轻碰在一起——人要是撞上去，整个村子都听得见。') });
  const barrel = (x, y) => ({ x, y, spr: 'barrel', on: (S, e) => hideIn(S, e) });
  const house = (id, x, y, text, face) => ({ id, x, y, w: 3, h: 2, spr: 'minka', face: !!face, on: S => S.narr(text) });

  const GRAF = [
    '喷漆写着「犬鳴村→」。箭头指着隧道深处。',
    '一行歪歪扭扭的字：「ここから先　日本国憲法　通用せず」。\n——从这里往前，日本国宪法不适用。\n字底下，还有人补了一句：「骗你的」。',
    '「帰れ」——回去。\n这两个字写得特别大，漆还没干透似的，泛着光。',
    '「たすけて」——救命。\n写得很低，差不多贴着地面。像是坐在地上写的。'
  ];
  const standOn = S => S.narr('一个穿旧工作服的人，脸贴着石壁站着，一动不动。\n你压低声音叫了他一声。他没有回头。\n……他的肩膀，也没有一点起伏。');

  defChapter({
    id: 'inunaki', n: 3, title: '犬鸣村', sub: '旧隧道的水泥块后面，据说有一座「日本宪法不适用」的村子。手机的信号格，一格一格地掉。', origin: '日本福冈都市传说', color: '#24382a',
    amb: 'night', floor: 'dirt', wall: 'stone', dark: .82, plr: 3, darkC: '#03050a',
    people: PEOPLE_I, tiles: TILES_I, sprites: SPR_I, items: ITEMS_I, notes: NOTES_I, faces: FACES_I,
    endings: { out: '第三夜　完', booth: '电话亭', alone: '一个人' },
    legend: '犬鸣峠（いぬなきとうげ）位于日本福冈县宫若市与久山町之间的山里。山口的旧犬鸣隧道在上世纪七十年代新隧道开通后就很少有车走了，后来入口被人用水泥块封住。大约从九十年代起，关于这一带的怪谈在年轻人和网络上越传越多，「犬鸣村」就是其中最出名的一个：据说旧隧道后面有一个与外界断绝来往、不在任何地图上的村子，村口立着写有「この先、日本国憲法つうじません」（此处之后，日本国宪法不适用）的牌子；村子四周拉着挂满空罐头的绳子，一碰就响；闯进去的人会被拿着斧头或镰刀的村民追赶；附近手机没有信号、车子会熄火；峠上的公用电话亭半夜会响。\n\n这些说法都查无实据，不同的人讲出来的版本也各不相同。真实的背景是：「犬鸣」确实是这一带山谷的旧地名，这里后来修建了犬鸣水库（九十年代建成），据说有一部分旧聚落因此迁走、沉进了水底，「消失的村子」的联想大概就是从这里来的。也有一种说法认为，八十年代末旧隧道附近发生过的一起真实刑事案件，让这一带在传闻里更添了阴影；本章不涉及其细节。\n\n需要说明的是，「宪法不适用的村子」「排斥外人的村民」这类说法，长期以来被批评为是在把历史上遭受歧视的社群妖魔化——现实中从来没有这样的村子，住在这片山谷里的人，只是因为修水库而搬到了别处，过着和所有人一样的生活。2020 年，这个传说被改编成电影《犬鸣村》，让「犬鸣」的名字传得更广，也让不少人专程去旧隧道「探险」；当地多次提醒，旧道和旧隧道一带禁止进入，深夜擅闯既危险也违法。\n\n（本章中的千夏和拓也、拓也打印的网页、告示牌上的涂鸦、钉在候车亭里的纸条和写纸条的人、信号格指路和「倒着走出隧道」的规矩、会学人说话的村人、仓库门前的「车钥匙」问答、三个岔路口、石壁下的小祠，以及所有结局，均为游戏虚构。）',
    start: { map: 'pass', x: 10, y: 6, dir: 3 },
    resume: {
      village: vilResume, village2: vilResume, sealed: vilResume,
      forks: async S => {
        S.f.fw = 0; const st = S.f.stage || 0; S.ent('dosign').text = STG[st].sign; S.stop('muraF'); S.hide('muraF');
        S.place('takuF', S.pl.x, S.pl.y + 1, 3); S.follow('takuF', true);
        if (DIED) await S.think('别在路口犹豫太久。\n每条岔路走进去两步，看信号格——多了一格的那条，才是回去的路。');
        return muraFIn(S, 16);
      },
      exit: async S => exitStart(S),
      booth: async S => { S.wear('@me'); S.norun(false); S.speed(.9); S.f.ring = true; RINGT = 0; S.ent('booth').s.ring = true; S.f.boothAsked = false; }
    },
    async intro(S) {
      DIED = 0; LASTBAR = -1; PAT = null;
      await S.card('第三夜　犬鸣村', '2008年8月　深夜　日本福冈县 · 犬鸣峠', '暑假的最后一个星期。\n拓也说要拍一段「心灵现场」的视频传到网上，\n千夏开着舅舅的旧车，陪他上了山。\n\n旧犬鸣隧道。\n据说穿过去，就是地图上没有的村子。');
    },
    tick(S, dt) {
      hudTick(S);
      if (S.f.ring && S.map === 'pass' && !W.ended) { RINGT -= dt; if (RINGT <= 0) { RINGT = 2.6; ring(S); const b = S.ent('booth'); if (b) b.s.ring = true; } }
    },
    thumb(g, w, h) {
      g.fillStyle = '#2a2824'; g.fillRect(0, 6, 84, h - 28);
      for (let i = 0; i < 9; i++) for (let j = 0; j < 6; j++) { g.fillStyle = hash(i, j, 3) < .5 ? '#34312c' : '#2e2b27'; g.fillRect(i * 10 + (j % 2) * 5 - 4, 8 + j * 9, 9, 8); }
      g.fillStyle = '#050505'; g.fillRect(16, 26, 44, 42); g.fillRect(19, 21, 38, 5); g.fillRect(25, 17, 26, 4);
      for (let r = 0; r < 5; r++) for (let x = 16 - (r % 2) * 6; x < 60; x += 12) { const x0 = Math.max(16, x), x1 = Math.min(60, x + 11); g.fillStyle = '#8a8984'; g.fillRect(x0, 62 - r * 7, x1 - x0, 6); g.fillStyle = '#a8a7a2'; g.fillRect(x0, 62 - r * 7, x1 - x0, 1); }
      g.fillStyle = '#9a2a22'; g.fillRect(24, 50, 14, 2); g.fillRect(30, 46, 2, 10);
      g.fillStyle = '#4a3a28'; g.fillRect(96, 58, 3, 12); g.fillRect(140, 58, 3, 12);
      g.fillStyle = '#3a3020'; g.fillRect(86, 14, 66, 46); g.fillStyle = '#d6d0be'; g.fillRect(88, 16, 62, 42);
      g.textAlign = 'center'; g.textBaseline = 'middle';
      g.font = `bold 10px ${FONT}`; g.fillStyle = '#1a1410'; g.fillText('この先、', 119, 25);
      g.font = `bold 11px ${FONT}`; g.fillStyle = '#a01810'; g.fillText('日本国憲法', 119, 38);
      g.font = `bold 10px ${FONT}`; g.fillStyle = '#1a1410'; g.fillText('つうじません', 119, 50);
      g.fillStyle = '#07090c'; g.fillRect(128, 2, 28, 11); g.fillStyle = '#2a1416'; g.fillRect(129, 3, 26, 9);
      for (let i = 0; i < 4; i++) { g.fillStyle = '#2e4044'; g.fillRect(138 + i * 4, 10 - (2 + i * 2), 2, 2 + i * 2); }
      g.fillStyle = '#ff5a4a'; for (let i = 0; i < 6; i++) { g.fillRect(140 + i * 2, 4 + i, 2, 1); g.fillRect(150 - i * 2, 4 + i, 2, 1); }
    },
    maps: {
      /* ---------------- 犬鸣峠 · 旧道 ---------------- */
      pass: {
        amb: 'night', dark: .8, plr: 3, wall: 'stone',
        legend: { Q: 'crackasph', V: 'valley' },
        tileOpts: { grassC: '#1c2a1e', treeC: '#0e1a12' },
        rows: Array.from({ length: 18 }, (_, y) => row(PASS_W, x => passCell(x, y))),
        ents: [
          { id: 'portal', x: 8, y: 2, w: 3, spr: 'portal', on: portalOn },
          { x: 4, y: 2, spr: 'graf', text: '犬鳴', on: S => S.narr('擁壁上喷着红漆：「犬鳴」。\n漆被雨水冲得往下淌，一道一道的。') },
          { x: 14, y: 2, spr: 'graf', text: '帰れ', col: '#d8d4c8', on: S => S.narr('白漆写着两个字：「帰れ」——回去。\n不知道是写给谁的。') },
          { id: 'notice', x: 13, y: 4, spr: 'notice', on: async S => { await S.narr('路边一块告示牌，铁皮的边都锈得卷起来了。'); await S.note('n_notice'); } },
          { id: 'booth', x: 13, y: 8, spr: 'booth', light: { r: 2.6, dy: -6, col: 'rgba(200,255,220,.14)' }, on: boothOn },
          { x: 6, y: 11, spr: 'kanban', text: '犬鳴峠', on: S => S.narr('蓝底白字的路牌：「犬鳴峠」。\n下面一行小字被石头砸得坑坑洼洼，只剩一个箭头，指着来时的方向。') },
          { x: 12, y: 13, spr: 'streetlamp', off: true, on: S => S.narr('一根路灯杆。灯罩碎了，里面结满蛛网。\n这条路上，大概很多年没亮过灯了。') },
          { id: 'car', x: 9, y: 13, h: 2, spr: 'carv', col: '#e4e4dc', light: { r: 4.6, dx: 8, dy: -14, col: 'rgba(255,240,200,.16)' }, on: carOn },
          { id: 'taku', x: 9, y: 4, spr: '@taku', dir: 3, on: S => S.say('拓也', S.f.ph === 'booth' ? '……别回头看那个电话亭。走吧。' : '那道缝能钻进去！你在这儿等我就行。') },
          ...[7, 8, 9, 10, 11].map(x => ({ x, y: 17, spr: 'invisible', solid: false, async touch(S) { await S.think(S.f.ph === 'booth' ? '车就在后面。' : '拓也还在里面。\n……不能就这么走了。'); S.pos(S.pl.x, 15, 3); } })),
          Object.assign({}, HUD)
        ],
        async enter(S, first) {
          if (S.f.ph === 'exit' && !S.f.boothSet) return boothStart(S);
          if (first) return passIntro(S);
        },
        step(S, x, y) { if (S.f.ph === 'booth' && !S.f.boothAsked && y >= 7 && y <= 9) return boothCall(S); }
      },
      /* ---------------- 旧犬鸣隧道 ---------------- */
      tunnel: {
        amb: 'drone', dark: .93, plr: 2.4, wall: 'concrete', darkC: '#020202',
        legend: { F: 'tfloor' },
        rows: [row(36, () => '#'), row(36, () => '#'), row(36, () => 'F'), row(36, () => 'F'), row(36, () => 'F'), row(36, () => 'F'), row(36, () => '#')],
        ents: [
          ...[[30, '犬鳴村→'], [22, 'ここから先 日本国憲法 通用せず'], [12, '帰れ'], [5, 'たすけて']].map(([x, t], i) => ({ x, y: 1, spr: 'graf', text: t, col: i % 2 ? '#d8d4c8' : '#b02a22', on: S => S.narr(GRAF[i]) })),
          ...[33, 27, 16, 9, 2].map(x => ({ x, y: 1, spr: 'tlamp', off: true, on: S => S.narr('墙上的照明灯。灯罩里积满了死虫子，早就不亮了。') })),
          ...[[28, 2], [28, 3], [22, 4], [22, 5], [15, 2], [15, 3], [15, 4], [8, 3], [8, 4], [8, 5]].map(([x, y]) => ({ x, y, spr: 'rubble', on: S => S.narr('从拱顶上塌下来的水泥块，钢筋锈成了红褐色。') })),
          ...[[31, 4], [19, 3], [11, 5], [3, 4], [25, 2]].map(([x, y]) => ({ x, y, spr: 'puddle', decal: true })),
          { id: 'flash', x: 18, y: 4, spr: 'flashlight', light: { r: 1.6, col: 'rgba(255,240,190,.14)' }, on: flashOn },
          ...[2, 3, 4, 5].map(y => ({ x: 0, y, spr: 'invisible', solid: false, touch: toVillage })),
          ...[2, 3, 4, 5].map(y => ({ x: 35, y, spr: 'invisible', solid: false, touch: toPassT })),
          { id: 'mur1', x: 0, y: 2, spr: '@mura', dir: 2, hidden: true, solid: false, light: { r: 2.2, dx: 6, dy: 10, col: 'rgba(255,150,70,.2)', flick: true } },
          { id: 'mur2', x: 0, y: 5, spr: '@mura', dir: 2, hidden: true, solid: false, light: { r: 2, dx: 6, dy: 10, col: 'rgba(255,150,70,.18)', flick: true } },
          { id: 'takuT', x: 4, y: 3, spr: '@taku', hidden: true },
          Object.assign({}, HUD)
        ],
        enter: tunEnter,
        step(S, x, y) {
          if (S.f.ph !== 'exit') { if (x <= 12 && S.once('gps1')) return tunGps(S); return; }
          if (!S.f.exitGo) return;
          if (x >= 18 && !S.f.v1) return voice(S, 1);
          if (x >= 29 && S.f.vturn >= 1 && !S.f.v2) return voice(S, 2);
        },
        tick(S, dt) {
          DRIPT -= dt; if (DRIPT <= 0) { DRIPT = 1.4 + Math.random() * 2.4; S.sfx('drip'); }
          if (!S.f.exitGo || W.busy) return;
          const p = S.pl; S.focus(Math.max(0, p.x - 3), p.y);   // 镜头偏向村子那边：盯着油灯；出口那边交给同伴
          SCRT -= dt;
          if (SCRT <= 0) {   // 斧头拖在水泥地上的刮擦声：越近越响、越亮
            let dmin = 99; for (const id of ['mur1', 'mur2']) { const e = S.ent(id); if (e && !e.hidden) dmin = Math.min(dmin, Math.abs(e.px / TS - p.x) + Math.abs(e.py / TS - p.y)); }
            const v = clamp(.07 - dmin * .006, .008, .07); SCRT = clamp(.35 + dmin * .08, .4, 1.2);
            S.tone('sawtooth', 150, 95, .3, v, 0, 600 + Math.max(0, 8 - dmin) * 180); S.tone('square', 2400, 1800, .05, v * .25, .05, 3000);
          }
        }
      },
      /* ---------------- 犬鸣村 ---------------- */
      village: {
        amb: 'night', dark: .8, plr: 3, wall: 'stone',
        tileOpts: { grassC: '#1e2c20', treeC: '#0d1a11' },
        rows: Array.from({ length: 22 }, (_, y) => row(VIL_W, x => vilCell(x, y))),
        ents: [
          { id: 'portal2', x: 24, y: 2, w: 3, spr: 'portal', v: true, on: portal2On },
          { id: 'kenpo', x: 22, y: 4, w: 2, spr: 'kenpo', text: 'ようこそ|犬鳴村へ', on: kenpoOn },
          { id: 'hokora', x: 2, y: 4, spr: 'hokora', on: hokoraOn },
          { x: 6, y: 3, spr: '@stand', dir: 3, on: standOn },
          { x: 17, y: 3, spr: '@stand', dir: 3, on: standOn },
          house('hA', 3, 5, '黑瓦的老房子。木板窗关得严严实实，门缝里没有一点光。\n门口的名牌，被人用刀刮掉了。'),
          house('hB', 8, 5, '雨户的木板缝里……好像有一只眼睛。\n你再看过去，只剩一片黑。', true),
          house('hC', 13, 5, '屋檐下挂着一串风干的柿子，黑得像一串小小的拳头。\n屋里，有人在很慢很慢地扫地。沙——沙——'),
          house('hD', 4, 11, '门口摆着两双草鞋，一大一小，鞋底沾着湿泥。\n可是门前的土上，一个脚印也没有。'),
          house('hE', 10, 11, '门上贴着一张褪色的日历。翻在「昭和」某一年的八月。', true),
          house('hF', 19, 11, '这家的门开着一条缝。\n门缝里吹出来的风，带着一股水草的腥味。'),
          { id: 'yagura', x: 19, y: 6, spr: 'yagura', on: S => S.narr('火の見櫓——村里救火用的瞭望塔。顶上挂着一口锈铃。\n铃舌被铁丝一圈一圈缠死了。') },
          barrel(7, 6), barrel(12, 6), barrel(17, 6), barrel(8, 12), barrel(17, 12),
          { x: 6, y: 10, spr: 'well', on: S => S.narr('一口石井，井口盖着木板，木板上压着石头。\n井底传出很轻的水声——像是很深、很深的地方，有一整片水在流。') },
          { id: 'shelter', x: 15, y: 10, w: 2, spr: 'shelter', on: shelterOn },
          { id: 'kennel', x: 14, y: 12, spr: 'kennel', on: S => S.narr('一个木头狗窝。拴狗的铁链从窝里伸出来，另一头什么也没拴。\n村子里到处都听得见狗叫——可你一只狗也没看见。') },
          cans('c1', 8, 8, 't', 'r1'), cans('c2', 8, 9, 'b', 'r1'), cans('c3', 18, 8, 't', 'r2'), cans('c4', 18, 9, 'b', 'r2'),
          ...[[10, 10], [9, 13], [6, 13], [3, 13], [1, 14], [1, 16]].map(([x, y]) => ({ x, y, spr: 'footprints', decal: true, col: 'rgba(80,60,38,.85)' })),
          { id: 'cam', x: 11, y: 8, spr: 'camcorder', solid: false, light: { r: .9, col: 'rgba(255,60,60,.12)' }, on: camOn },
          { id: 'naya', x: 2, y: 14, w: 2, h: 2, spr: 'naya', on: nayaOn },
          { id: 'mimic', x: 3, y: 16, spr: '@meX', dir: 3, hidden: true, solid: false },
          { id: 'takuV', x: 3, y: 16, spr: '@taku', hidden: true, on: S => S.say('拓也', '……我没事，还能走。快点离开这儿。') },
          ...[20, 21].map(y => ({ x: 6, y, spr: 'invisible', solid: false, touch: toForks })),
          { id: 'mura', x: 5, y: 9, spr: '@mura', solid: false, dir: 2, light: { r: 2.3, dx: 6, dy: 10, col: 'rgba(255,150,70,.2)', flick: true } },
          Object.assign({}, HUD)
        ],
        async enter(S, first) { if (first) return villageIntro(S); },
        step(S, x, y) {
          if (S.f.rescued && !S.f.sealed && y <= 5 && x >= 22 && x <= 27) return sealEvent(S);
          if (!S.f.rescued && !S.f.mimic && x <= 7 && y >= 13 && y <= 16) return mimicScene(S);
        },
        tick: vilTick
      },
      /* ---------------- 山里的岔路口 ---------------- */
      forks: {
        amb: 'wind', dark: .86, plr: 3, fog: .2,
        tileOpts: { grassC: '#1a281c', treeC: '#0c180f' },
        rows: Array.from({ length: 17 }, (_, y) => row(21, x => fkCell(x, y))),
        ents: [
          { id: 'dosign', x: 11, y: 7, spr: 'dosign', text: STG[0].sign, async on(S) {
            await S.narr('木头路牌上写着：\n' + String(S.ent('dosign').text).split('|').join('\n'));
            if (S.f.fw) await S.think('……字又不一样了。'); else if (S.once('signQ')) await S.think('刚走过来的时候，它是这么写的吗？');
          } },
          { id: 'jizo', x: 8, y: 7, spr: 'statue', hidden: true, on: S => S.narr('路边一尊小小的地藏。\n……上一个路口，也有它吗？它的脸被人凿平了。') },
          { id: 'shoe', x: 12, y: 10, spr: 'shoes', col: '#d8d4cc', hidden: true, on: S => S.narr('草丛里有一只白色的运动鞋。\n拓也低头看了看自己的脚——两只鞋都在。\n「……这不是我的。」') },
          { x: 10, y: 1, spr: 'invisible', solid: false, touch: S => forkCommit(S, 'n') },
          { x: 1, y: 8, spr: 'invisible', solid: false, touch: S => forkCommit(S, 'w') },
          { x: 19, y: 8, spr: 'invisible', solid: false, touch: S => forkCommit(S, 'e') },
          { x: 10, y: 16, spr: 'invisible', solid: false, touch: forkSouth },
          { id: 'muraF', x: 10, y: 16, spr: '@mura', dir: 3, hidden: true, solid: false, light: { r: 2.3, dx: 6, dy: 10, col: 'rgba(255,150,70,.22)', flick: true } },
          { id: 'takuF', x: 10, y: 12, spr: '@taku', hidden: true },
          Object.assign({}, HUD)
        ],
        enter: forkEnter
      }
    }
  });
})();
