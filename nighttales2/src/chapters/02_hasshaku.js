/* ================= 第二夜 · 八尺大人 ================= */
(() => {
  const FULL = '高野翔太';
  const HATC = '#f5f2e8';
  let poT = 3;

  /* ---------- 地图绘制小工具 ---------- */
  function grid(w, h, c) {
    const g = [...Array(h)].map(() => Array(w).fill(c));
    const api = {
      set(x, y, ch) { if (y >= 0 && y < h && x >= 0 && x < w) g[y][x] = ch; return api; },
      rect(x0, y0, x1, y1, ch) { for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) api.set(x, y, ch); return api; },
      rows() { return g.map(r => r.join('')); }
    };
    return api;
  }

  /* ---------- 声音：ぽ、ぽぽ、ぽ ---------- */
  async function popo(S) { const gaps = [300, 150, 380, 220]; for (let i = 0; i < 4; i++) { S.sfx('drip'); await S.wait(gaps[i]); } }
  function popoBg(S) { S.sfx('drip'); setTimeout(() => { if (W) S.sfx('drip'); }, 170); setTimeout(() => { if (W) S.sfx('drip'); }, 430); }

  /* 实体沿横向平移（树篱上方的帽子） */
  async function slide(S, id, tx, ms) {
    const e = S.ent(id); if (!e) return;
    const x0 = e.px, x1 = tx * TS, n = Math.max(1, Math.round(ms / 60));
    for (let i = 1; i <= n; i++) { e.px = x0 + (x1 - x0) * i / n; e.fr = (i >> 2) % 2; await S.wait(60); }
    e.x = tx; e.fr = 0;
  }

  /* ---------- 她：比树篱还高的白衣女人 ---------- */
  function hachiBody(R, e) {
    const y = e.fr ? -1 : 0, back = e.dir === 3, D = '#120d10';
    const DR = '#ebe7dc', DS = '#c9c2b2', SK = '#e7ded2', HR = '#0f0a0c';
    R(1, 13, 14, 3, 'rgba(0,0,0,.35)');
    R(1, -10 + y, 14, 25 - y, D); R(3, -21 + y, 10, 12, D); R(-1, -22 + y, 18, 4, D); R(3, -27 + y, 10, 6, D);
    R(4, -20 + y, 8, 15, HR);
    R(4, -9 + y, 8, 6, DR); R(3, -3 + y, 10, 6, DR); R(2, 3 + y, 12, 11 - y, DR);
    R(10, -9 + y, 2, 6, DS); R(11, -3 + y, 2, 6, DS); R(12, 3 + y, 2, 11 - y, DS); R(2, 13, 12, 1, '#a9a293');
    R(2, -8 + y, 1, 17, SK); R(13, -8 + y, 1, 17, '#d6cbbd'); R(1, 8 + y, 2, 2, SK); R(13, 8 + y, 2, 2, '#d6cbbd');
    R(7, -11 + y, 2, 2, SK);
    if (back) R(5, -19 + y, 6, 9, HR);
    else {
      R(5, -19 + y, 6, 8, SK); R(5, -19 + y, 6, 2, HR); R(4, -19 + y, 1, 13, HR); R(11, -19 + y, 1, 13, HR);
      R(6, -15 + y, 1, 1, '#1a1214'); R(9, -15 + y, 1, 1, '#1a1214');
      if (e.red) { R(6, -13 + y, 4, 1, '#5a0c10'); R(5, -14 + y, 1, 1, '#5a0c10'); R(10, -14 + y, 1, 1, '#5a0c10'); }
      else R(7, -12 + y, 2, 1, '#8a3434');
    }
    R(0, -21 + y, 16, 2, HATC); R(0, -19 + y, 16, 1, '#cbc4b2'); R(4, -26 + y, 8, 5, HATC); R(4, -22 + y, 8, 1, '#d9d1bc'); R(5, -26 + y, 2, 1, '#ffffff');
  }

  /* ---------- 道具精灵 ---------- */
  const SPRITES = {
    hachi(g, e, t, R) { hachiBody(R, e); },
    tallhedge(g, e, t, R) {   // 两米多高的树篱（向上伸出很高，能挡住后面的人）
      const w = e.w * 16, k = (e.px | 0);
      R(0, -22, w, 38, '#122412'); R(0, -21, w, 36, '#1f3a20');
      for (let i = 0; i < e.w * 12; i++) { const x = (hash(i, k, 3) * (w - 3)) | 0, y = -20 + ((hash(i, 7, k) * 33) | 0); R(x, y, 3, 2, i % 3 ? '#2b4d2a' : '#162b16'); }
      for (let x = 0; x < w; x += 3) R(x, -23 - ((hash(x, 1, 5) * 2) | 0), 2, 2, '#264526');
      R(0, 13, w, 3, '#0f1d10');
    },
    kido(g, e, t, R) {   // 树篱里的柴门
      R(-1, -24, 18, 3, '#2a2420'); R(0, -21, 2, 37, '#4a3420'); R(14, -21, 2, 37, '#4a3420');
      if (e.open) { R(2, -18, 12, 32, '#3a3226'); return; }
      R(2, -14, 12, 28, '#5c4630'); for (let x = 3; x < 14; x += 3) R(x, -13, 2, 26, '#6e563a'); R(2, -6, 12, 1, '#3a2a1a'); R(2, 6, 12, 1, '#3a2a1a');
      for (let x = 3; x < 14; x += 3) R(x, -13, 1, 1, '#1a140c');
    },
    van(g, e, t, R) {   // 白色面包车（侧面，w=3）
      R(1, 13, 46, 2, 'rgba(0,0,0,.4)'); box(R, 0, -6, 48, 19, '#e4e2da'); R(1, -5, 46, 2, '#f4f2ec');
      for (let i = 0; i < 4; i++) R(4 + i * 10, -3, 8, 6, '#2a3440'); R(40, -3, 6, 6, '#3a4654'); R(46, 5, 2, 3, '#ffeeaa'); R(0, 5, 1, 3, '#a01010');
      R(6, 10, 7, 5, '#1a1a1a'); R(34, 10, 7, 5, '#1a1a1a'); R(8, 11, 3, 3, '#777'); R(36, 11, 3, 3, '#777'); R(2, 6, 44, 1, '#a8a69e');
    },
    butsudan(g, e, t, R) {
      box(R, 0, -14, 16, 29, '#2a1810'); R(2, -12, 12, 16, '#5a3e14'); R(3, -11, 10, 14, '#8a6a24');
      R(6, -9, 4, 5, '#d8d0bc'); R(7, -8, 2, 2, '#3a3030'); R(4, -3, 1, 3, '#e8e2cc'); R(11, -3, 1, 3, '#e8e2cc');
      const f = Math.sin(t * 12) > 0 ? 1 : 0; R(4, -5 + f, 1, 2, '#ffcf5a'); R(11, -5 + f, 1, 2, '#ffcf5a');
      R(2, 6, 12, 1, '#c9a35a'); R(7, 9, 2, 1, '#c9a35a'); R(9, 0, 4, 4, '#e8e4d8'); R(10, 1, 2, 2, '#4a4a50');
    },
    fan(g, e, t, R) { R(7, 2, 2, 11, '#d8d8d0'); R(4, 13, 8, 2, '#c8c8c0'); R(3, -6, 10, 10, '#9ab0bc'); R(4, -5, 8, 8, '#e8f0f4'); const a = (t * 14) % 2 > 1; if (a) R(5, -2, 6, 2, '#7a9ab0'); else R(7, -4, 2, 6, '#7a9ab0'); R(7, -2, 2, 2, '#4a6a80'); },
    furin(g, e, t, R) { R(7, -16, 1, 4, '#888'); R(5, -12, 6, 5, 'rgba(200,230,240,.85)'); R(6, -11, 1, 3, '#d84a4a'); R(9, -10, 1, 2, '#4a7ad8'); const s = Math.round(Math.sin(t * 2.4) * 1.5); R(7, -7, 1, 4, '#888'); R(6 + s, -3, 3, 7, '#e8e0b0'); },
    katori(g, e, t, R) { R(4, 8, 8, 6, '#3a6a3a'); R(3, 9, 1, 4, '#3a6a3a'); R(6, 9, 4, 4, '#1e3a1e'); R(7 + Math.round(Math.sin(t)), 3 + Math.round(Math.sin(t * 1.3)), 1, 5, 'rgba(220,220,220,.35)'); },
    monohoshi(g, e, t, R) {
      R(1, -8, 2, 22, '#6a5a44'); R(29, -8, 2, 22, '#6a5a44'); R(0, -8, 32, 1, '#c8b880');
      if (e.full) { const s = Math.round(Math.sin(t * 2)); R(4 + s, -7, 8, 13, '#f2f2ee'); R(5 + s, -7, 6, 2, '#d8d8d4'); R(14 + s, -7, 6, 9, '#e8e4d8'); R(22 + s, -7, 6, 8, '#7a8aa8'); }
    },
    suika(g, e, t, R) { box(R, 1, 6, 14, 9, '#8a8e94'); R(2, 7, 12, 5, '#5a7a8a'); R(4, 4, 8, 7, '#2e6a2a'); for (let i = 0; i < 3; i++) R(5 + i * 3, 4, 1, 7, '#1a3a18'); },
    jizo(g, e, t, R) {
      if (e.cracked) { R(3, 11, 10, 4, '#5a5a56'); R(4, 1, 8, 11, '#8a8a84'); R(4, 1, 8, 1, '#a8a8a2'); R(7, 1, 2, 1, '#e8e8e0'); R(4, 2, 8, 4, e.col || '#b8302a'); R(5, 6, 6, 1, '#6a1a18'); return; }
      const c = e.col || '#b8302a';
      R(3, 11, 10, 4, '#5a5a56'); R(4, 1, 8, 11, '#8a8a84'); R(5, -5, 6, 7, '#9a9a94'); R(6, -2, 1, 1, '#5a5a56'); R(9, -2, 1, 1, '#5a5a56'); R(7, 0, 2, 1, '#6a6a66');
      R(4, 2, 8, 4, c); R(5, 6, 6, 1, shade(c, -.3));
      if (e.water) { R(5, -5, 2, 2, '#5a7a4a'); R(4, 8, 2, 3, '#5a7a4a'); R(10, 3, 1, 6, '#3a3a36'); }
      if (e.flowers) { R(2, 12, 2, 3, '#e8a030'); R(12, 12, 2, 3, '#e85030'); }
      if (e.full) { R(11, 12, 4, 2, '#c8a860'); R(1, 12, 4, 2, '#c8a860'); }
    },
    jhead(g, e, t, R) { R(4, 13, 8, 2, 'rgba(0,0,0,.3)'); R(5, 8, 6, 6, '#9a9a94'); R(6, 10, 1, 1, '#5a5a56'); R(9, 10, 1, 1, '#5a5a56'); R(7, 12, 2, 1, '#5a5a56'); R(3, 9, 1, 5, '#4a7a3a'); R(12, 8, 1, 6, '#4a7a3a'); },
    barrier(g, e, t, R) { R(1, 2, 2, 12, '#888'); R(13, 2, 2, 12, '#888'); for (let i = 0; i < 4; i++) R(i * 4, 3, 4, 4, i % 2 ? '#1a1a1a' : '#e8c020'); R(4, 8, 8, 6, '#e8e4d8'); R(5, 10, 6, 1, '#c03030'); },
    keiji(g, e, t, R) { R(2, -2, 2, 17, '#4a3826'); R(12, -2, 2, 17, '#4a3826'); box(R, 0, -10, 16, 11, '#6a5236'); R(-1, -12, 18, 2, '#3a2a1a'); R(2, -8, 5, 6, '#e8e2d0'); R(9, -8, 5, 4, '#e8d8a0'); R(3, -6, 3, 1, '#666'); R(10, -6, 3, 1, '#a33'); },
    kakashi(g, e, t, R) { const s = Math.round(Math.sin(t * 1.7) * .8); R(7, -6, 2, 21, '#6a5236'); R(1, -2, 14, 2, '#6a5236'); R(4, -1, 8, 8, '#4a5a8a'); R(5, -10, 6, 5, '#e8e2cc'); R(1 + s, -12, 14, 2, HATC); R(4 + s, -15, 8, 4, HATC); R(6, -8, 1, 1, '#222'); R(9, -8, 1, 1, '#222'); R(6, -6, 4, 1, '#222'); },
    sanmon(g, e, t, R) { R(-6, -26, 44, 4, '#2a2420'); R(-4, -22, 40, 2, '#4a3a2a'); R(-3, -20, 4, 35, '#5a3a22'); R(31, -20, 4, 35, '#5a3a22'); R(0, -18, 32, 3, '#5a3a22'); R(10, -15, 12, 4, '#d8d0bc'); R(11, -14, 10, 1, '#333'); R(12, -12, 6, 1, '#333'); },
    saisen(g, e, t, R) { box(R, 0, 2, 32, 12, '#6a4a2a'); for (let x = 3; x < 30; x += 3) R(x, 3, 2, 3, '#2a1a10'); R(2, 8, 28, 1, '#4a3020'); R(12, 9, 8, 3, '#c9a35a'); R(14, -18, 4, 20, '#c8b890'); R(15, -18, 2, 20, '#e8dcb0'); },
    kane(g, e, t, R) { R(-2, -22, 20, 3, '#2a2018'); R(0, -19, 2, 34, '#4a3020'); R(14, -19, 2, 34, '#4a3020'); R(5, -16, 6, 2, '#3a3a30'); R(4, -14, 8, 12, '#5a5a48'); R(4, -14, 8, 1, '#7a7a64'); R(3, -3, 10, 2, '#4a4a3a'); R(6, -9, 4, 1, '#6a6a54'); },
    neko(g, e, t, R) { const b = Math.sin(t * 1.5) > 0 ? 1 : 0; R(3, 9, 10, 5, e.col || '#e8e2d6'); R(9, 6, 5, 5, e.col || '#e8e2d6'); R(9, 5, 1, 2, e.col || '#e8e2d6'); R(13, 5, 1, 2, e.col || '#e8e2d6'); R(5, 10, 3, 2, '#3a3030'); R(1, 12 - b, 3, 2, '#c8a060'); R(10, 8, 1, 1, '#3a3030'); R(12, 8, 1, 1, '#3a3030'); },
    shopfront(g, e, t, R) {   // 杂货店门脸（画在屋顶最下一行，w=3）
      const w = e.w * 16;
      R(0, -6, w, 22, '#4a3a2a'); R(1, -4, w - 2, 18, '#2a2018');
      for (let i = 0; i < 3; i++) { R(3 + i * 15, -3, 12, 7, '#8a6a44'); R(4 + i * 15, -2, 3, 3, ['#d84a4a', '#e8c040', '#4a8ad8'][i]); R(8 + i * 15, -2, 3, 3, ['#e8e2d0', '#6ac06a', '#e88a40'][i]); }
      R(2, 6, w - 4, 3, '#2a4a7a'); for (let x = 4; x < w - 4; x += 8) R(x, 9, 6, 6, '#2a4a7a'); R(w / 2 - 6, 6, 12, 2, '#e8e2d0');
      R(0, -9, w, 3, '#7a2a22'); R(4, -8, w - 8, 1, '#e8e2d0');
    },
    denwa(g, e, t, R) { box(R, 2, 4, 12, 11, '#5a4030'); R(4, 1, 8, 4, '#121212'); R(3, 0, 10, 2, '#1e1e1e'); R(6, 2, 4, 2, '#3a3a3a'); R(7, 2, 2, 1, '#c8c8c8'); },
    omaru(g, e, t, R) { R(3, 7, 10, 7, '#e8e4dc'); R(3, 7, 10, 1, '#c8c4bc'); R(4, 8, 8, 2, '#5a6a8a'); R(12, 9, 2, 3, '#e8e4dc'); },
    shikibuton(g, e, t, R) {
      R(1, 1, 14, 30, '#d8d2c2'); R(2, 2, 12, 6, '#eeeae0'); R(1, 9, 14, 22, '#7a8aa8'); R(1, 9, 14, 2, '#9aa6be');
      for (let y = 13; y < 30; y += 5) R(2, y, 12, 1, '#6a7a98');
      if (e.lump) { R(2, 6, 12, 20, '#8a9ab8'); R(3, 7, 10, 3, '#a8b4cc'); R(2, 25, 12, 2, '#5a6a88'); }
    },
    nwin(g, e, t, R) {   // 糊着报纸的窗（墙面）
      box(R, 1, 0, 14, 12, '#4a3a2a');
      R(2, 1, 12, 10, e.lit ? '#efe2b8' : '#cfc8b2'); for (let y = 2; y < 10; y += 2) R(3, y, (y * 7) % 5 + 5, 1, e.lit ? '#b8a880' : '#8a8478');
      if (e.fuda) { R(7, 2, 2, 7, e.dark ? '#4a4040' : '#f4f0e6'); R(7, 3, 2, 1, e.dark ? '#201818' : '#b02020'); R(7, 5, 2, 2, '#202020'); }
      if (e.peel) { R(11, 1, 3, 3, '#0a0a10'); R(10, 1, 1, 1, '#a8a294'); R(11, 4, 3, 1, '#a8a294'); }
      if (e.shadow) { R(2, 1, 12, 2, 'rgba(240,236,226,.9)'); R(11, 1, 3, 3, '#e8e4dc'); R(4, 3, 8, 6, 'rgba(20,16,20,.55)'); R(5, 9, 6, 2, 'rgba(20,16,20,.4)'); }
    },
    kibako(g, e, t, R) {   // 木箱 + 小佛像
      box(R, 1, 4, 14, 11, '#6a5236'); R(2, 5, 12, 2, '#7e6444');
      const c = '#b08a3a', f = e.facing || 'door';
      R(5, -6, 6, 10, c); R(6, -9, 4, 4, c); R(4, 1, 8, 3, shade(c, -.2)); R(6, -10, 4, 1, shade(c, .25));
      if (f === 'win') { R(6, -5, 4, 8, shade(c, -.15)); R(7, -8, 2, 2, shade(c, -.25)); }
      else if (f === 'door') { R(7, -7, 1, 1, '#3a2a10'); R(9, -7, 1, 1, '#3a2a10'); R(7, -2, 2, 2, shade(c, .25)); R(5, -4, 1, 3, shade(c, .2)); R(10, -4, 1, 3, shade(c, .2)); }
      else { const x = f === 'l' ? 6 : 9; R(x, -7, 1, 1, '#3a2a10'); R(f === 'l' ? 5 : 10, -4, 1, 3, shade(c, .25)); }
    },
    moru(g, e, t, R) {
      R(3, 12, 10, 2, '#7a5a3a'); R(4, 11, 8, 1, '#8a6a4a');
      if (!e.full) return;
      const lv = e.dark || 0, c = lv >= 2 ? '#2a2628' : lv === 1 ? '#a09a8e' : '#f4f2ec', d = lv >= 2 ? '#141214' : lv === 1 ? '#7a746a' : '#cfcac0';
      R(5, 8, 6, 3, c); R(6, 6, 4, 2, c); R(7, 5, 2, 1, c); R(9, 8, 2, 3, d);
    },
    tclock(g, e, t, R) { box(R, 4, 4, 8, 9, '#8a3a2a'); R(5, 5, 6, 6, '#eeeae0'); const a = ((e.num ?? 8) % 12) / 12 * Math.PI * 2; R(8, 8, 1, 1, '#111'); R(8 + Math.round(Math.sin(a) * 2), 8 - Math.round(Math.cos(a) * 2), 1, 1, '#111'); R(8, 6, 1, 2, '#111'); R(5, 3, 2, 1, '#c9a35a'); R(9, 3, 2, 1, '#c9a35a'); },
    bag(g, e, t, R) { box(R, 2, 6, 12, 8, '#2a4a7a'); R(4, 4, 8, 2, '#1a2a4a'); R(3, 9, 10, 1, '#e8e8e8'); R(10, 10, 3, 3, '#e8e2cc'); },
    fusuma(g, e, t, R) {
      if (e.open) { R(1, 1, 14, 14, '#0e0a08'); R(1, 1, 2, 14, '#3a2a1a'); return; }
      R(0, 1, 16, 14, '#3a2a1a'); R(1, 2, 7, 12, '#d9d2bc'); R(8, 2, 7, 12, '#d4ccb4'); R(6, 7, 1, 2, '#3a2a1a'); R(9, 7, 1, 2, '#3a2a1a');
      if (e.fuda) { R(3, 3, 2, 7, e.dark ? '#4a4040' : '#f4f0e6'); R(3, 4, 2, 1, '#b02020'); R(3, 6, 2, 2, '#202020'); }
    },
    andon(g, e, t, R) { R(5, 12, 6, 3, '#3a2a1a'); box(R, 4, 0, 8, 12, '#3a2a1a'); R(5, 1, 6, 10, e.off ? '#4a3a2a' : '#f4d890'); R(5, 5, 6, 1, '#3a2a1a'); }
  };

  /* ---------- 瓦片 ---------- */
  const TILES = {
    paddy: { solid: true, paint(R, X, Y) { R(0, 0, 16, 16, '#34502a'); R(0, 15, 16, 1, '#2a3e22'); for (let y = 1; y < 16; y += 5) for (let x = 1 + (y % 2) * 2; x < 16; x += 4) { R(x, y, 1, 3, '#5d8a38'); R(x + 1, y + 1, 1, 2, '#7aa84a'); } if (hash(X, Y, 3) < .3) R(((hash(X, Y, 4) * 10) | 0) + 2, ((hash(X, Y, 5) * 10) | 0) + 3, 3, 1, '#6a8a8a'); } },
    roof: { solid: true, paint(R, X, Y) { R(0, 0, 16, 16, '#3c424e'); for (let y = 0; y < 16; y += 4) { R(0, y + 3, 16, 1, '#272b33'); for (let x = (y / 4 % 2) * 2; x < 16; x += 4) R(x, y, 1, 3, '#4e5664'); } } },
    gravel: { solid: false, paint(R, X, Y) { speck(R, '#8e8a80', ['#a29e94', '#7a766c', '#b4b0a6'], X, Y, 26, 14); } }
  };

  /* ---------- 村子地图 ---------- */
  function muraRows() {
    const G = grid(36, 26, 'p');
    G.rect(0, 0, 35, 1, 'P');
    G.rect(0, 2, 1, 25, '~');
    G.rect(35, 2, 35, 25, 'T'); G.rect(2, 25, 34, 25, 'T');
    G.rect(2, 11, 34, 11, '"'); G.rect(2, 13, 34, 13, '"');
    G.rect(16, 2, 16, 24, '"'); G.rect(18, 2, 18, 24, '"');
    G.rect(18, 4, 29, 4, '"'); G.rect(18, 6, 29, 6, '"');
    G.rect(19, 7, 28, 10, '"'); G.rect(21, 8, 26, 10, 'F');
    G.rect(2, 12, 34, 12, 'd'); G.rect(17, 2, 17, 24, 'd'); G.rect(17, 0, 17, 1, 'k'); G.rect(18, 5, 29, 5, 'd');
    G.rect(30, 2, 34, 10, 'T'); G.set(30, 5, 'k');
    G.rect(3, 15, 12, 21, 'h'); G.rect(4, 16, 11, 20, '"'); G.rect(5, 17, 10, 19, 'F'); G.set(8, 14, 'd'); G.set(8, 15, 'd'); G.set(8, 16, 'j');
    G.rect(21, 16, 27, 21, 'h'); G.rect(22, 17, 26, 20, '"'); G.rect(22, 18, 26, 19, 'F');
    G.set(10, 9, 'T'); G.set(11, 9, 'T'); G.set(5, 7, 'T'); G.set(26, 22, 'T'); G.set(5, 23, 'T'); G.set(6, 23, 'T'); G.set(29, 15, 'B'); G.set(3, 4, 'T'); G.set(13, 5, 'B'); G.set(31, 19, 'T');
    return G.rows();
  }

  /* ---------- 通用：被她带走 ---------- */
  async function caught(S, msg, title) {
    S.clearTimer(); S.hidePlayer(false);
    await S.scare('face', { spr: '@hachiF', dur: 1.1 });
    await S.die(msg, title || '你被她看上了');
  }

  /* ---------- 目标 ---------- */
  const JZ = { N: '北', E: '东', S: '南', W: '西' };
  function jizoGoal(S) {
    const left = ['N', 'E', 'S', 'W'].filter(k => !S.f['j' + k]).map(k => JZ[k]);
    if (!left.length || S.f.broken) return S.goal('回寺里，告诉K婆婆碎的是哪一尊');
    S.goal('查看村子四个方向的地藏（还剩：' + left.join('、') + '）');
  }
  function setupLeft(S) {
    const f = S.f, L = [];
    if ((f.salt || 0) < 4) L.push('四角的盐 ' + (f.salt || 0) + '/4');
    if (!f.fWin) L.push('窗上的护符');
    if (!f.fDoor) L.push('门上的护符');
    if (!f.butsu) L.push('佛像的朝向');
    return L;
  }
  function setupGoal(S) { const L = setupLeft(S); S.goal(L.length ? '布置房间：' + L.join('、') : '布置好了——去门口叫K婆婆上来看看'); }

  /* ================= 白天：院子 ================= */
  async function jiiTalk(S) {
    const f = S.f; S.face('jii', 'pl');
    if (f.phase === 'day' && !f.toldLaundry) {
      await S.say('爷爷', ['哟，来了。……一年不见，又蹿高了一截。', '坐。檐廊这儿有穿堂风，比屋里凉快。']);
      await S.narr('爷爷眯着眼抽烟。风铃叮叮地响，院子里的知了叫得人头昏。');
      await S.say('爷爷', ['……西边的山头起云了，傍晚要下雷阵雨。', '去帮你奶奶把晾的衣服收了。就在院子那头。']);
      f.toldLaundry = true; S.goal('把院子里晾的衣服收进来');
      return;
    }
    if (f.phase === 'day' && !f.saw) return S.say('爷爷', ['衣服在晾衣竿上。收完了去井里捞西瓜，晚上切。', '……怎么，城里的孩子连衣服都不会收？'][(f._jl = ((f._jl ?? -1) + 1) % 2)]);
    if (f.phase === 'day' && f.saw && !f.jiiIn) return jiiReact(S);
    if (f.phase === 'morning') return jiiMorning(S);
    if (f.phase === 'totera') return S.say('爷爷', '走吧。别磨蹭。');
    await S.say('爷爷', '……别怕。爷爷在。');
  }
  async function jiiReact(S) {
    const f = S.f;
    await S.narr('你把刚才看见的东西说了。\n树篱上面的白帽子，帽檐底下那张脸，还有那个声音——');
    await S.say('你', '……ぽ、ぽぽ、ぽ。就是这样。像是有人在嘴里含着什么。');
    S.sfx('thud'); S.bubble('jii', '!', 1500);
    await S.narr('爷爷手里的烟掉在了檐廊的木板上。\n他没去捡。');
    let r = await S.ask('「……有多高？」', ['比树篱还高。帽子和脸都露在上面。', '……也可能是我看错了。'], '爷爷');
    if (r === 1) await S.say('爷爷', '看错了？看错了的人，会学得出那个声音？');
    r = await S.ask('「它……看见你了没有？」', ['看见了。还冲我笑了一下。', '好像……没有吧。'], '爷爷');
    if (r === 1) await S.say('爷爷', '你脸都白了，还说没有。');
    await S.say('爷爷', ['……八尺大人。', '你在这儿待着。哪儿也别去，谁叫你都别出院子。']);
    await S.narr('爷爷光着脚就进了屋，连木屐都没穿。');
    await S.walk('jii', [12, 11], 4); S.hide('jii');
    f.jiiIn = true; S.goal('进屋看看爷爷在干什么');
  }
  async function laundry(S) {
    const f = S.f, m = S.ent('hoshi');
    if (f.saw || !m.full) return S.narr(f.phase === 'morning' ? '晾衣竿空着。昨天那条床单，后来谁也没捡。' : '空空的晾衣竿。床单掉在地上，沾了一片泥。');
    if (!f.toldLaundry) return S.narr('晾衣竿上挂着白床单和爷爷的汗衫，晒得硬邦邦的，一股太阳的味道。');
    m.full = false;
    await S.narr('你把床单从竿子上扯下来，抱了满怀。');
    S.amb('none'); await S.wait(500);
    await S.narr('……知了忽然一起不叫了。');
    await popo(S);
    await S.narr('ぽ、ぽぽ、ぽ、ぽ……\n很怪的声音。低低的，一下一下的，像有人在嘴里含着什么。\n是从树篱外面的村道上传来的。');
    S.place('hachiY', 0, 3, 2); S.focus(6, 4);
    await slide(S, 'hachiY', 6, 1500);
    await S.narr('树篱上面，有一顶帽子。\n白色的、宽檐的女式帽子，在树篱的顶上，慢慢地移过来。');
    await S.think('（……这道树篱，有两米多高。）');
    S.focus(12, 4); await slide(S, 'hachiY', 12, 1500);
    S.face('hachiY', 0); S.sfx('heart');
    await S.narr('帽子在院门那儿停住了。\n帽檐底下，是一张女人的脸。白得像纸。长头发。\n……她在树篱的那一边，低头看着你。');
    await S.wait(700); S.sfx('sting'); S.shake(300, 1);
    await S.narr('她笑了一下。');
    await popo(S);
    S.face('hachiY', 2); await slide(S, 'hachiY', 25, 2600);
    S.hide('hachiY'); S.focus(null); S.amb('wind');
    S.sfx('thud');
    await S.narr('床单掉在了地上。\n过了好一会儿，知了才重新叫起来。');
    await S.think('（树篱外面是村道。那个女人……是踩着高跷吗？）');
    f.saw = true; f.popo = 'far'; S.goal('告诉爷爷刚才看见的东西');
  }
  async function gateUse(S) {
    const f = S.f;
    if (f.phase === 'day') return S.narr(f.saw ? '你的手碰到柴门，又缩了回来。\n门外，就是她刚才站着的地方。' : '柴门外面是村道。\n爷爷说太阳毒，下午别出去乱跑。');
    if (f.phase === 'setup') return S.narr('天已经黑透了。K婆婆说过：天黑以后，一步也别出这个院子。');
    if (f.phase === 'morning') {
      if (!f.briefed) return S.narr('门外的村道上停着一辆白色面包车。\n爷爷在院子里叫你。');
      const r = await S.ask('上车吗？', ['上车', '再等等']); if (r) return;
      S.cp('car');
      return rideCar(S);
    }
    S.sfx('open');
    await S.go('mura', 8, 14, 3);
  }

  /* ================= 屋里 ================= */
  async function phoneScene(S) {
    const f = S.f;
    S.show('jii_n'); S.face('jii_n', 1); S.focus(2, 6);
    await S.narr('走廊尽头，爷爷背对着你，攥着那部黑色的电话。');
    await S.say('爷爷', ['……是。是八尺大人。我孙子看见了。', '……对，ぽぽぽ。他自己学给我听的。', '……我知道。我知道。我现在就带他过去。'], { style: 'whisper' });
    S.sfx('close'); S.focus(null);
    S.face('jii_n', 'pl');
    await S.say('爷爷', ['翔太。跟我去一趟寺里，找K婆婆。现在就走。', '路上不管看见什么、听见什么，别停，别回头，跟紧我。']);
    S.face('baa_n', 'pl');
    await S.say('奶奶', '……他爷爷，真的是那个？', { style: 'whisper' });
    await S.say('爷爷', '回头再说。你把二楼里屋收拾出来，窗户拿报纸糊上。');
    await S.narr('奶奶手里的汤勺「当」地掉进了锅里。');
    f.called = true; f.phase = 'totera'; S.hide('jii_n');
    S.goal('跟爷爷去寺里（出院门，往东北走）');
  }
  async function baaTalk(S) {
    const f = S.f; S.face('baa_n', 'pl');
    if (f.phase === 'day') return S.say('奶奶', ['晚上给你做冷荞麦面。井里泡着西瓜呢。', '你爷爷那个人，嘴上不说，一大早就去村口望了三回，看你们的车来没来。', '别光坐着吹电扇，出去晒晒太阳。城里的孩子，白得跟纸似的。'][(f._bl = ((f._bl ?? -1) + 1) % 3)]);
    if (f.phase === 'totera') return S.say('奶奶', '快去吧。……跟紧你爷爷。', { style: 'whisper' });
    if (f.phase === 'setup') return S.say('奶奶', ['二楼的里屋，奶奶已经收拾好了。窗户也糊上了。', 'K婆婆打电话来说，东西你带回来了，就照她写的摆。她念完经就过来。']);
    await S.say('奶奶', '……');
  }

  /* ================= 寺 ================= */
  async function teraMeet(S) {
    const f = S.f;
    S.face('kbaa', 'pl');
    await S.narr('本堂的檐廊上坐着一个很老很老的婆婆。\n她好像早就知道你们要来。');
    await S.say('K婆婆', ['……就是这孩子？', '过来。让我看看你的脸。']);
    await S.narr('她的手又干又凉，捏着你的下巴，左右看了看。\n然后，叹了一口很长的气。');
    await S.say('K婆婆', ['被看上了。', '那东西，村里的老人叫它「八尺大人」。个子有八尺高——比屋檐还高。', '穿白衣服，戴一顶白帽子。有人说是年轻女人的样子，有人说是老太婆，有人说穿着丧服……看见的人，说的都不一样。', '只有两样不变：个子高。还有那个笑声。ぽ、ぽぽ。']);
    await S.say('K婆婆', ['它只找年轻的男孩子。', '被它看上的，过不了几天，就会被带走。']);
    await S.say('爷爷', '……五十年前，我最小的弟弟，就是这么没的。', { style: 'whisper' });
    await S.narr('K婆婆从身后的柜子里抽出一本发黄的册子，翻开，推到你面前。');
    await S.note('kakocho');
    await S.say('K婆婆', ['很久以前，村里请了游方的和尚，在村子的东西南北各立了一尊地藏，把它封在这一片里。它出不去，就只能在这几个村子之间转悠。', '它这几年一直很安静。今天突然出来，还大白天地在村道上走——', '……是有一尊地藏碎了。']);
    await S.say('K婆婆', ['天黑以前，它不会动手。它喜欢慢慢来。', '你去看看，是哪一尊碎了。四尊都看，仔细看。看清楚了回来告诉我。', '我得知道它是从哪一边漏出来的。']);
    S.give('mamori');
    await S.say('K婆婆', '这个带上，攥在手里。白天它不敢靠得太近。');
    await S.say('爷爷', '我在这儿借电话，把亲戚们都叫来。……翔太，快去快回。');
    f.phase = 'jizo'; f.popo = 'far'; S.show('jii_t'); S.face('jii_t', 0);
    jizoGoal(S); S.cp();
  }
  async function kbaaTalk(S) {
    const f = S.f; S.face('kbaa', 'pl');
    if (f.phase === 'jizo') {
      const seen = ['N', 'E', 'S', 'W'].filter(k => f['j' + k]).length;
      if (!seen) return S.say('K婆婆', '还愣着做什么。去看地藏。东西南北，四尊。');
      return report(S);
    }
    if (f.phase === 'dusk') return S.say('K婆婆', '快走！太阳下山以前，一定要进屋！');
    await S.say('K婆婆', '南无阿弥陀佛……');
  }
  async function report(S) {
    const f = S.f;
    const r = await S.ask('「碎的是哪一尊？」', ['北边，山道口那尊', '东边，村界那尊', '南边，往镇上去的那尊', '西边，河边那尊', '（我再去看看）'], 'K婆婆');
    if (r === 4) return S.say('K婆婆', '去吧。碎了的东西，有时候看上去是好好的。');
    if (r === 1) return S.say('K婆婆', ['东边那尊？今天早上我才去给它换过花。', '……再去看看。碎了的东西，有时候看上去是好好的。']);
    if (r === 2) return S.say('K婆婆', ['南边那尊，昨天傍晚我还去浇过水。', '……再去看看。碎了的东西，有时候看上去是好好的。']);
    if (r === 3) return S.say('K婆婆', ['西边那尊肩膀上的裂缝？', '……那道缝，我嫁到这个村子那年就有了。不是它。', '再去看看。碎了的东西，有时候看上去是好好的。']);
    if (!f.broken) await S.say('K婆婆', '……北边？你连碰都没碰它，倒是猜得准。');
    else await S.say('K婆婆', ['头被人摆回去了？……修路的那帮人。', '撞碎了地藏，连说都不敢说一声。']);
    await S.say('K婆婆', ['北边。山道口。', '那就是它漏出来的口子。今晚，它会从北边来。', '新的地藏，明天就让人去请。可是开眼供养，少说也要三天。你等不了三天。']);
    await S.say('K婆婆', ['今晚，你一个人待在你爷爷家二楼的里屋里，熬到天亮。', '明天一早，让你们家的亲戚开车，从南边那条路，把你送出村子。', '南边那尊地藏好好的。过了它，它就跟不过去了。']);
    S.give('shio', true); S.give('fuda', true); S.toast('获得：一袋盐、护符');
    await S.narr('K婆婆把一袋粗盐、三张手写的护符，和一张写满了字的草纸塞进你怀里。');
    await S.note('okite');
    await S.say('K婆婆', ['回去照这上面写的，把屋子布置好。我念完经就过去，亲自看一眼。', '……你爷爷留在这儿打电话。你自己回去。', '跑回去。别停。']);
    S.sfx('bell');
    await S.narr('寺里的钟「当——」地响了一声。\n不知什么时候，太阳已经挂在西边的山头上了。');
    S.take('mamori');
    await S.think('（护身符……K婆婆把它收回去了。「只能管到天黑」，她说。）');
    f.phase = 'dusk'; f.reported = true;
    S.goal('天黑之前，跑回爷爷家（村子西南边）');
    S.cp('dusk');
  }

  /* ================= 地藏 ================= */
  async function jizoN(S) {
    const f = S.f, j = S.ent('jizoN');
    if (f.broken) return S.narr('没了头的地藏，静静地立在山道口。\n脖子的断口上，落着一只蜻蜓。');
    if (f.phase !== 'jizo' && !f.reported) return S.narr('山道口的地藏。红围兜褪成了粉色。\n旁边竖着「通行止」的牌子。');
    if (!f.jN) { await S.narr('山道口的地藏，好好地立着。\n红围兜褪成了粉色，脚边放着一个空了的供杯。'); f.jN = true; }
    const r = await S.ask('看上去没什么异样。', ['凑近仔细看看', '算了']);
    if (r) { jizoGoal(S); return; }
    await S.narr('你蹲下来。\n地藏的脖子上，有一圈新的白茬。头和身子之间，夹着几粒碎石子。');
    S.sfx('thud'); j.cracked = true; S.show('jhead'); S.shake(200, 1);
    await S.narr('你伸手碰了一下——\n石头脑袋「咯噔」一下歪倒，滚进了路边的草里。');
    await S.think('（是被人随手摆回去的。……撞碎了以后。）');
    f.broken = true;
    await S.wait(500);
    S.ent('hachiN').alpha = 0; S.show('hachiN'); S.sfx('heart');
    await S.alpha('hachiN', 1, 700);
    await S.narr('你抬起头。\n山道上面，杉树林的边上，有一顶白帽子。');
    await popo(S);
    await S.alpha('hachiN', 0, 900);
    await S.narr('……再看的时候，那里只有杉树。');
    jizoGoal(S);
  }
  async function jizoE(S) {
    const f = S.f;
    if (f.phase === 'jizo' && !f.jE) { f.jE = true; S.sfx('select'); }
    await S.narr('村子东头的地藏。脚边的竹筒里插着新换的野菊花，还挂着水珠。\n再往东，就是邻村的地界了。');
    if (f.phase === 'jizo') jizoGoal(S);
  }
  async function jizoS(S) {
    const f = S.f;
    if (f.phase === 'jizo' && !f.jS) { f.jS = true; S.sfx('select'); }
    await S.narr('往镇上去的路口，立着一尊地藏。\n脚下的石头是湿的——有人给它浇过水。脚边摆着一双新编的小草鞋。');
    if (f.phase === 'jizo') jizoGoal(S);
  }
  async function jizoW(S) {
    const f = S.f;
    if (f.phase === 'jizo' && !f.jW) { f.jW = true; S.sfx('select'); }
    await S.narr('河边的地藏，半边身子长满了青苔。\n它的肩膀上，有一道很深的裂缝，从脖子一直裂到胸口。');
    if (f.phase === 'jizo' && S.once('wCrack')) await S.think('（……是这尊吗？可是裂缝里也长满了青苔。）');
    if (f.phase === 'jizo') jizoGoal(S);
  }

  /* ================= 黄昏：跑回家 ================= */
  async function duskStart(S) {
    const f = S.f;
    S.dark(.62); S.plr(3.6); S.amb('wind');
    S.stop('hachiM'); S.place('hachiM', 34, 12, 1); S.ent('hachiM').alpha = 1;
    if (S.once('duskSeen')) {
      S.focus(32, 12); S.sfx('sting');
      await S.narr('夕阳把整片稻田染成了橘红色。\n村道东头，村界的地藏旁边，站着一个白色的、细长的影子。');
      await popo(S);
      await S.narr('它比路边的电线杆还要高。\n帽檐慢慢地抬起来，转向了你这边。');
      S.focus(null);
      await S.think('（……它在等我。跑！）');
    } else { S.sfx('heart'); await S.narr('村道东头，白色的影子又站在那里了。'); }
    f.popo = 'near';
    S.chase('hachiM', { spd: 2.75, wait: 1, catch: async S => caught(S, '你听见身后「ぽ」的一声，近得就在耳朵边上。\n一只又白又长的手，从你头顶上伸下来，盖住了你的眼睛。', '它追上你了') });
    S.timer(60, '日落', async S => { S.stop('hachiM'); await caught(S, '太阳落山了。\n最后一点光从稻田上收走的时候，有什么东西弯下腰，在你耳边笑了一声。', '天黑了'); });
    S.goal('天黑之前，跑回爷爷家（村子西南边）');
  }
  async function homeGate(S) {
    const f = S.f;
    if (f.phase === 'dusk') {
      S.stop('hachiM'); S.hide('hachiM'); S.clearTimer(); f.phase = 'setup'; f.popo = null; S.dark(null); S.plr(null);
      S.sfx('close');
      await S.go('niwa', 12, 5, 0);
      return;
    }
    S.sfx('open');
    await S.go('niwa', 12, 5, 0);
  }

  /* ================= 那个房间 ================= */
  async function sumiUse(S, e) {
    const f = S.f;
    if (f.phase === 'setup') {
      if (e.full) return S.narr('碟子里的盐堆成了一座小小的尖山。');
      if (!S.has('shio')) return S.narr('一个空的小碟子。');
      e.full = true; f.salt = (f.salt || 0) + 1; S.sfx('paper');
      await S.narr(['你把盐倒进角落的碟子里，用手指捏成一个尖。', '第二个角。盐粒沙沙地响。', '第三个角。你的手有点抖，洒了几粒在榻榻米上。', '第四个角。……四个角都放好了。'][Math.min(f.salt - 1, 3)]);
      if (f.salt >= 4) S.take('shio');
      return setupGoal(S);
    }
    const lv = e.s.dark || 0;
    if (f.phase === 'night' || f.phase === 'morning') return S.narr(lv >= 2 ? '盐……黑了。\n像是被人一把一把地捏过，又像是在烟里熏了一整夜。' : lv === 1 ? '盐的尖上，变成了灰色。\n你没敢碰它。' : '雪白的一小堆盐。');
    await S.narr('角落里放着一个空的小碟子。');
  }
  async function winUse(S) {
    const f = S.f, w = S.ent('win');
    if (f.phase === 'setup') {
      if (!w.s.fuda && S.has('fuda')) {
        w.s.fuda = true; f.fWin = true; S.sfx('paper');
        await S.narr('你在报纸上贴了一张护符，用手掌抹平。');
        fudaCheck(S); return setupGoal(S);
      }
      return S.narr('窗户朝北，正对着院门、树篱，和树篱外面的村道。\n玻璃上里里外外糊满了旧报纸，一点光也透不进来。' + (w.s.fuda ? '\n报纸当中贴着一张护符。' : ''));
    }
    if (f.phase === 'night') {
      if (f.ns === 2 && !f.hideEv) return ev3(S);
      if (f.hideEv) return S.narr('别看了！快躲起来！');
      return S.narr(w.s.dark ? '窗上的护符黑了一大半，边上卷了起来。\n报纸的破口被你用手按着，又一点一点地翘起来。' : '报纸糊得严严实实。\n可你总觉得，报纸的那一边，也有什么在看着这一边。');
    }
    if (f.phase === 'morning') return S.narr('窗外是灰白的晨光。\n护符黑得像一片烧过的纸。');
  }
  function fudaCheck(S) { if (S.f.fWin && S.f.fDoor) { S.take('fuda'); S.give('fudaH', true); S.toast('剩下的一张护符，攥在手里'); } }
  async function butsuUse(S) {
    const f = S.f, b = S.ent('butsu');
    if (f.phase === 'setup') {
      await S.narr('木箱上立着一尊小小的佛像，巴掌大，金漆掉了一半。');
      const r = await S.ask('把佛像的脸转向哪一边？', ['朝着窗户', '朝着门', '朝着左手边的墙', '朝着右手边的墙', '先别动']);
      if (r === 4) return;
      b.s.facing = ['win', 'door', 'l', 'r'][r]; f.butsu = true; f.butsuDir = r; S.sfx('select');
      await S.narr(['你把佛像转过去，让它对着糊满报纸的窗户。', '你把佛像转过来，让它对着门。', '你让佛像对着左手边的墙。', '你让佛像对着右手边的墙。'][r]);
      return setupGoal(S);
    }
    if (f.phase === 'night') return S.narr('小小的佛像对着窗户，背对着你。\n你对着它的背影，小声念了一遍南无阿弥陀佛。');
    await S.narr('小小的佛像。金漆的脸上，好像多了几道细细的裂纹。');
  }
  async function heyaDoor(S) {
    const f = S.f, d = S.ent('fusuma');
    if (f.phase === 'setup') {
      if (!d.s.fuda && S.has('fuda')) {
        d.s.fuda = true; f.fDoor = true; S.sfx('paper');
        await S.narr('你在纸门的内侧贴上一张护符。');
        fudaCheck(S); return setupGoal(S);
      }
      const L = setupLeft(S);
      if (L.length) {
        const r = await S.ask('还没布置好：' + L.join('、') + '。', ['再看一遍K婆婆写的规矩', '先下楼']);
        if (r === 0) return S.note('okite');
        return S.go('naka', 17, 6, 1);
      }
      return kCheck(S);
    }
    if (f.phase === 'night') return S.narr('门闩插得好好的。\nK婆婆说过：七点以前，不管谁叫，都不要开。');
    if (f.phase === 'morning') { S.sfx('open'); return S.go('naka', 17, 6, 1); }
  }
  async function kCheck(S) {
    const f = S.f;
    S.sfx('step'); await S.wait(300); S.sfx('step');
    S.show('kbaaH'); S.face('kbaaH', 'pl');
    await S.say('奶奶（楼下）', 'K婆婆来了！', { style: 'whisper' });
    await S.narr('K婆婆拄着拐杖，一级一级地爬上楼来。\n她在门口站定，看了看四个角，看了看窗户，又看了看那尊佛像。');
    if (f.butsuDir !== 0) {
      await S.say('K婆婆', ['佛像。', '我写的是什么？地藏碎在哪一边，它就从哪一边来——佛像的脸，要对着那一边。', '碎的是哪一尊，你自己看见的。这扇窗户朝哪边，你自己看看。']);
      S.hide('kbaaH'); S.goal('把佛像转到正确的方向');
      return;
    }
    await S.say('K婆婆', ['……嗯。', '你听好。从现在起，到明天早上七点，你一步都不能出这个门。', '门从里面插上。不管谁叫你，不管是什么声音——你爷爷、你奶奶、我，都一样——不要应，不要开。', '怕了，就攥着那张护符，对着佛像念经。']);
    await S.say('K婆婆', '……熬过今晚。熬过去就好了。');
    await S.narr('K婆婆退了出去。纸门合上了。\n你照她说的，从里面插上了门闩。\n楼梯吱吱呀呀地响了一阵，然后就安静了。');
    S.hide('kbaaH'); f.phase = 'night'; f.ns = 0; S.dark(null); S.amb('night');
    await S.fade(1, 600);
    await S.card('晚上八点', '', '行灯的光晕在榻榻米上一圈一圈地晃。\n虫子在窗外叫。\n\n离早上七点，还有十一个小时。');
    await S.fade(0, 600);
    S.goal('钻进被子里，熬到早上七点');
    S.cp('night');
  }

  /* ---------- 夜里的事 ---------- */
  function saltDark(S, lv, idx) { for (const i of idx) { const e = S.ent('sumi' + i); e.s.dark = Math.max(e.s.dark || 0, lv); } }
  async function futonUse(S) {
    const f = S.f;
    if (f.phase === 'setup') return S.narr('被子已经铺好了。K婆婆说，布置好了以后，就待在被子里别出来。');
    if (f.phase !== 'night') return S.narr('被子乱成一团，汗湿了一大片。');
    if (f.hideEv) return hideIn(S);
    const n = f.ns || 0;
    if (n === 0) return ev1(S);
    if (n === 1) return ev2(S);
    if (n === 2) return S.narr('窗户上的报纸翘着一个角，冷风从那里钻进来。\n不把它按回去，你睡不着。');
    if (n === 3) return ev4(S);
    if (n === 4) return ev5(S);
    return ev6(S);
  }
  async function ev1(S) {
    const f = S.f;
    await S.narr('你钻进被子里，把那张护符攥在手心。');
    await S.fade(1, 600); S.ent('clockH').num = 11; await S.wait(700); await S.fade(0, 600);
    S.amb('none');
    await S.narr('……不知道过了多久，虫子不叫了。');
    S.sfx('knock'); await S.wait(500); S.sfx('knock');
    await S.narr('叩、叩。\n窗户被敲了两下。\n\n——这里是二楼。');
    await popo(S);
    await S.say('窗外', 'ぽ、ぽぽ、ぽ……', { style: 'whisper' });
    const r = await S.ask('有什么东西，贴在窗户外面。', ['（屏住呼吸，攥紧护符）', '「……谁？」', '掀开报纸看一眼']);
    if (r === 1) return caught(S, '「谁？」\n话一出口，窗外的声音就停了。\n然后，你听见报纸被一点一点撕开的声音。', '你应了声');
    if (r === 2) return caught(S, '你掀开报纸的一角。\n玻璃外面，是一只眼睛。很大，很近，在笑。', '你看了');
    await S.narr('你咬着被角，一动也不敢动。\n叩、叩。叩。\n敲了很久，很久。然后停了。');
    S.amb('night'); saltDark(S, 1, [0, 1]); f.ns = 1;
    await S.narr('虫子又叫了起来。\n窗户那边的两个角上……盐，好像变灰了。');
    S.goal('熬到早上七点（再躺回被子里）'); S.cp('night');
  }
  async function ev2(S) {
    const f = S.f;
    await S.fade(1, 600); S.ent('clockH').num = 12; await S.wait(700); await S.fade(0, 600);
    await S.narr('十二点四十分。');
    S.sfx('step'); await S.wait(600); S.sfx('step'); await S.wait(600); S.sfx('step');
    await S.narr('楼梯上，有人慢慢地走上来。\n吱——吱——\n脚步声停在了纸门外面。');
    await S.say('门外', ['翔太。是爷爷。', '没事了。K婆婆说，它今晚不会来了。', '你一个人害怕吧？把门开开，爷爷进来陪着你。'], { style: 'whisper' });
    const r = await S.ask('是爷爷的声音。一模一样。', ['（不出声）', '「……爷爷？」', '去拔门闩']);
    if (r === 1) return caught(S, '「爷爷？」\n门外安静了。\n然后，那个声音很高兴地说：「……找到了。」', '你应了声');
    if (r === 2) return caught(S, '门闩一拔开，纸门就自己滑开了。\n门外没有爷爷。\n只有一条白色的裙摆，一直垂到地上。你顺着它，慢慢地往上看——', '你开了门');
    await S.narr('你把护符按在胸口，指甲掐进手心。');
    await S.say('门外', ['翔太？', '……翔太。'], { style: 'whisper' });
    await S.wait(800);
    await S.say('门外', '……是吗。', { style: 'whisper' });
    await S.narr('脚步声下楼去了。\n下楼的时候，楼梯一声都没有响。');
    S.sfx('tear'); S.ent('win').s.peel = true; saltDark(S, 1, [2, 3]); f.ns = 2;
    await S.narr('窗户那边，「嘶啦」一声。');
    S.goal('窗上的报纸翘起来了一角——去按回去'); S.cp('night');
  }
  async function ev3(S) {
    const f = S.f, w = S.ent('win');
    await S.narr('你蹑手蹑脚地走到窗边。\n报纸的右上角翘了起来，露出一小块黑漆漆的玻璃。');
    S.sfx('heart');
    await S.narr('你伸手去按——\n玻璃外面，有一片白。');
    w.s.shadow = true; S.sfx('sting'); S.shake(300, 2);
    await S.narr('不是月光。是布。白色的、垂下来的布。\n它在往下移——是有什么东西，正在窗外弯下腰来，要从那个缝里往里看。');
    f.hideEv = true; S.goal('快钻进被子里！');
    S.timer(7, '它在弯腰', async S => { S.f.hideEv = false; await caught(S, '你没来得及躲。\n报纸的破口里，一只眼睛对上了你的眼睛。\n「ぽ。」', '她看见你了'); });
  }
  async function hideIn(S) {
    const f = S.f, w = S.ent('win'), fu = S.ent('futonH');
    S.clearTimer(); f.hideEv = false; S.hidePlayer(true); fu.s.lump = true;
    await S.narr('你一头扎进被子，把护符死死按在胸口上。');
    S.sfx('tear'); await S.wait(700);
    await S.narr('嘶——啦——\n报纸被一点一点撕开的声音。');
    await popo(S);
    await S.narr('有什么在看。\n从窗户那儿，看着这间屋子。看着被子里鼓起来的这一团。');
    S.sfx('whisper'); await S.wait(900);
    await S.say('窗外', '……ぽ。', { style: 'whisper' });
    S.sfx('knock'); await S.wait(400); S.sfx('knock'); await S.wait(900);
    await S.narr('很久。很久很久。\n然后，窗外那片白，慢慢地滑走了。');
    S.hidePlayer(false); fu.s.lump = false; w.s.shadow = false; w.s.dark = true; S.ent('clockH').num = 2;
    f.ns = 3; saltDark(S, 2, [0, 1]);
    await S.narr('你从被子里探出头。\n窗上那张护符，黑了一大半，像被火燎过。窗户这边两个角的盐，已经全黑了。');
    S.goal('熬到早上七点（再躺回被子里）'); S.cp('night');
  }
  async function ev4(S) {
    const f = S.f, an = S.ent('andon');
    await S.fade(1, 600); S.ent('clockH').num = 4; await S.wait(700); await S.fade(0, 600);
    S.amb('none');
    await S.narr('四点十分。');
    an.s.off = true; S.sfx('switch');
    await S.narr('行灯灭了。');
    await popo(S); await S.wait(300); await popo(S);
    await S.narr('ぽぽぽ。ぽ、ぽぽ。\n左边。右边。头顶上。门外。\n那个声音，绕着这间屋子，一圈、一圈地转。');
    S.shake(1200, 2); S.sfx('knock'); await S.wait(300); S.sfx('knock'); await S.wait(200); S.sfx('knock');
    await S.narr('四面的墙都被拍响了。屋子在晃。');
    const r = await S.ask('你快喘不过气了。', ['攥着护符，对着佛像念「南无阿弥陀佛」', '捂住耳朵，大喊「走开！」']);
    if (r === 1) return caught(S, '「走开！走开！！」\n你喊出了声。\n拍墙的声音一下子停了。然后，从四面八方，同时响起了笑声。', '你出了声');
    S.sfx('chant');
    await S.say('你', ['南无阿弥陀佛……', '南无阿弥陀佛。南无阿弥陀佛……'], { style: 'whisper' });
    await S.narr('你不记得念了多少遍。\n念到嗓子哑了，念到外面的声音，好像离得远了一点。');
    an.s.off = false; S.amb('night'); saltDark(S, 2, [0, 1, 2, 3]); f.ns = 4;
    await S.narr('行灯又亮了。\n四个角的盐，全都黑了。');
    S.goal('熬到早上七点（再躺回被子里）'); S.cp('night');
  }
  async function ev5(S) {
    const f = S.f;
    await S.fade(1, 600); S.ent('clockH').num = 5; await S.wait(700); await S.fade(0, 600);
    await S.narr('迷迷糊糊之中，你听见了鸟叫。');
    S.sfx('knock'); await S.wait(400); S.sfx('knock');
    await S.say('门外', ['翔太，天亮了。', '是我，K婆婆。出来吧。都结束了。']);
    let r = await S.ask('K婆婆的声音。门外的人在等你开门。', ['先看一眼钟', '「来了！」（去拔门闩）']);
    if (r === 1) return caught(S, '「来了！」\n你一把拔开门闩。\n门外没有人。地板上放着一顶白色的宽檐帽。\n……你身后，有人「ぽ」地笑了一声。', '你应了声');
    await S.narr('你从被子里伸出手，摸到了枕边的座钟。\n五点十分。\n窗户上的报纸，还是黑的。');
    await S.think('（……还没到七点。）');
    r = await S.ask('「翔太？怎么了？开门呀。」', ['（不出声）', '「……还没到七点吧。」']);
    if (r === 1) return caught(S, '「……还没到七点吧。」\n门外安静了。\n「是啊，」那个声音说，「还没到呢。」', '你应了声');
    await S.wait(600);
    await S.say('门外', '……ぽ、ぽぽ。', { style: 'whisper' });
    await S.narr('门外的「K婆婆」，笑着走远了。');
    f.ns = 5; S.goal('再等一等。等到真的天亮'); S.cp('night');
  }
  async function ev6(S) {
    const f = S.f;
    await S.narr('你没敢再睡。睁着眼睛，盯着黑漆漆的窗户。');
    await S.fade(1, 900);
    S.ent('clockH').num = 7; S.ent('win').lit = true; S.dark(.45); S.amb('wind');
    await S.card('早上七点', '', '报纸后面，一点一点地透进来灰白色的光。\n鸟在叫。远处有一辆拖拉机发动了。\n\n这一次，是真的天亮了。');
    await S.fade(0, 900);
    S.sfx('knock');
    await S.say('门外', ['七点了。翔太，你还在吧？', '……不用答话。我自己开门。']);
    S.sfx('open'); S.ent('fusuma').open = true; S.show('kbaaH'); S.face('kbaaH', 'pl');
    await S.narr('门闩是从外面用细铁丝挑开的。\nK婆婆站在门口，看了你很久。');
    await S.say('K婆婆', ['……好孩子。你熬过来了。']);
    await S.narr('她看了一眼四个角上全黑的盐，又看了看窗上那张焦黑的护符，脸色很难看。');
    await S.say('K婆婆', ['它在这儿守了一整夜。天亮了，它也没走远。', '下楼吧。车在等着了。']);
    f.phase = 'morning'; S.hide('kbaaH'); S.dark(.45);
    S.goal('下楼，到院子里去'); S.cp('morning');
  }

  /* ================= 早上：车 ================= */
  async function jiiMorning(S) {
    const f = S.f;
    if (f.briefed) return S.say('爷爷', '上车吧。坐中间。……别睁眼。');
    await S.say('爷爷', ['……你熬过来了。', '这些都是咱们高野家的人。你叔公、你婶婶、你堂哥……一共八个，都是一个血脉的。']);
    await S.say('K婆婆', ['你坐中间，他们围着你坐。同一个血脉的人坐在一起，它就分不清哪一个才是你。', '车从南边那条路出村。出了村界，过了那尊地藏，就安全了。', '从现在起，低下头，闭上眼睛。不管听见什么——外面有人叫你，有人敲窗户，车停下来——都不许睁眼。']);
    await S.say('K婆婆', ['到了地方，我会叫你。', '我会叫你的全名。听清楚了——只有我叫你的全名，你才可以睁眼。']);
    await S.say('爷爷', '……五十年前，你小爷爷就是在车上睁了眼。', { style: 'whisper' });
    f.briefed = true; S.goal('上车（院门外）');
  }
  async function rideCar(S) {
    const f = S.f;
    S.sfx('open');
    await S.narr('村道上停着一辆白色的面包车。车窗里，亲戚们已经坐好了。\n你被让进第二排的正中间。左边是叔公，右边是婶婶，爷爷和姑婆坐在后排。开车的是堂哥。');
    await S.say('K婆婆（副驾驶）', '低头。闭眼。南无阿弥陀佛……');
    await S.fade(1, 900); S.dark(1); S.plr(0); S.hidePlayer(true); S.amb('car'); S.f.popo = null;
    await S.fade(0, 300);
    await S.narr('你闭上了眼睛。\n车门关上。发动机响了起来。');
    S.sfx('car'); await S.wait(900);
    await S.narr('车子一颠一颠地开动了。K婆婆的念经声，和发动机的声音混在一起。');
    await S.wait(600); await popo(S);
    await S.narr('ぽ、ぽぽ、ぽ。\n声音就在车窗外面。\n车开得不慢。可它一直在那里。不远不近，跟着车一起走。');
    await S.say('叔公', '……别抬头。', { style: 'whisper' });
    let r = await S.ask('它就在你这一侧的窗外。', ['（闭着眼，低着头）', '睁眼看一眼']);
    if (r) return badCar(S);
    S.sfx('knock'); await S.wait(500); S.sfx('knock');
    await S.narr('叩、叩。\n有人在敲你旁边的车窗。');
    await S.say('窗外', ['翔太？是妈妈呀。', '妈妈来接你了。你爸也来了。……把窗户摇下来，让妈妈看看你。'], { style: 'whisper' });
    r = await S.ask('是妈妈的声音。', ['（不动）', '摇下车窗', '睁开眼']);
    if (r) return badCar(S);
    await S.narr('婶婶的手伸过来，紧紧握住了你的手。她的手心全是汗。');
    S.sfx('brake'); S.shake(500, 2); await S.wait(500);
    await S.narr('车子猛地一刹。');
    await S.say('堂哥', '……前、前面路当中，站着一个人——', { style: 'whisper' });
    await S.say('K婆婆', '别停！开过去！', { style: 'big' });
    r = await S.ask('车停了。周围一下子安静得可怕。', ['（死死闭着眼）', '睁眼看看前面怎么了']);
    if (r) return badCar(S);
    S.sfx('car'); S.shake(300, 1);
    await S.narr('发动机吼了一声，车子冲了出去。\n有什么东西，从车顶上「哗」地擦了过去。');
    await S.wait(500); S.sfx('drip'); await S.wait(600); S.sfx('drip'); await S.wait(1100);
    await S.narr('ぽ……ぽ…………\n声音落在了后面。越来越远。');
    await S.say('姑婆', '……过了。过了地藏了。', { style: 'whisper' });
    await S.wait(800);
    await S.say('爷爷', '翔太，到了。没事了，睁眼吧。');
    r = await S.ask('是爷爷的声音。', ['睁开眼', '（等K婆婆叫我的全名）']);
    if (r === 0) return badCar(S, true);
    await S.wait(900);
    await S.say('K婆婆', FULL + '。', { style: 'big' });
    await S.say('K婆婆', '……睁眼吧。');
    await S.fade(1, 500);
    S.dark(null); S.plr(null); S.hidePlayer(false);
    await S.go('deguchi', 6, 6, 3, { ms: 900 });
  }
  async function badCar(S, late) {
    S.amb('none'); S.dark(null); S.plr(null);
    await S.narr(late ? '你睁开了眼睛。\n车还在开。叔公、婶婶、姑婆……所有人都低着头，紧紧闭着眼。\n爷爷也是。他的嘴，一直紧紧地抿着。\n——刚才那句话，不是他说的。' : '你睁开了眼睛。');
    await S.scare('face', { spr: '@hachiF', dur: 1.2 });
    S.fx('red');
    return S.end({ bad: true, title: '你睁开了眼睛', text: '车窗外，一张白色的脸贴着玻璃，跟着车一起跑。\n帽檐底下，她在笑。\n\nぽ、ぽぽ、ぽ。\n\n四天以后，村子南边的地藏脚下，多了一双小小的草鞋。\n寺里那本发黄的过去帐上，添了新的一行。' });
  }
  async function deguchiEnter(S, first) {
    if (!first) return;
    S.amb('wind');
    await S.narr('清晨的县道。山间的雾还没散。\n路边立着一尊地藏，脚边摆着新编的小草鞋——这是村子南边的村界。');
    await S.narr('面包车停在路边。前面不远，停着爸爸的车。');
    S.goal('跟K婆婆和爷爷道别');
  }
  async function kbaaBye(S) {
    const f = S.f; S.face('kbaa_d', 'pl');
    if (f.byeK) return S.say('K婆婆', '去吧。别回头。');
    await S.say('K婆婆', ['它跟到地藏跟前，停住了。……它过不来。', '可它记住你了。它记性好得很。']);
    await S.narr('K婆婆把你一直攥在手里的那张护符抽出来，看了看，又塞回你手心。');
    await S.say('K婆婆', ['这张，一辈子带在身上。', '还有——以后，不管发生什么事，都不要再回这个村子。']);
    f.byeK = true; byeGoal(S);
  }
  async function jiiBye(S) {
    const f = S.f; S.face('jii_d', 'pl');
    if (f.byeJ) return S.say('爷爷', '……走吧。');
    await S.say('爷爷', ['翔太。', '……本来想让你在乡下过一整个暑假的。西瓜还泡在井里呢。']);
    await S.narr('爷爷笑了一下。笑得很难看。');
    await S.say('爷爷', ['以后，别再回来了。', '爷爷要是想你了，就去城里看你。……你别回来。']);
    f.byeJ = true; byeGoal(S);
  }
  function byeGoal(S) { S.goal(S.f.byeK && S.f.byeJ ? '上爸爸的车' : '跟K婆婆和爷爷道别'); }
  async function chichiTalk(S) {
    const f = S.f; S.face('chichi', 'pl');
    if (!(f.byeK && f.byeJ)) return S.say('爸爸', ['……你爷爷半夜打电话给我，让我天亮之前开到这儿来等着。', '先去跟你爷爷说两句。']);
    const r = await S.ask('「走吧。回家。」', ['上车', '再看一眼村子的方向']);
    if (r === 1) { await S.narr('你回过头。\n雾里，只看得见那尊地藏，和它身后弯弯曲曲往山里去的路。\n……路的尽头，好像有什么白色的东西。'); S.sfx('heart'); await S.think('（别看了。）'); return; }
    return ending(S);
  }
  async function ending(S) {
    S.sfx('close');
    await S.narr('车开动了。\n后视镜里，爷爷和K婆婆站在地藏旁边，一直没有动。');
    await S.fade(1, 1400);
    await S.card('之后', '', '那年夏天，我再也没有回过那个村子。\n第二年，K婆婆去世了。\n又过了几年，爷爷也走了。葬礼的时候，奶奶在电话里说：\n「你别回来。」\n\n那张护符，我一直带在钱包里。\n已经黑得看不出字了。');
    await S.note('tegami');
    await S.end({ title: '第二夜　完', text: '十年后，我把这件事写了下来。\n\n写完的那天晚上，我做了一个梦。\n梦里我站在爷爷家的院子里，树篱上面，有一顶白色的帽子，慢慢地移过来。\n\nぽ、ぽぽ、ぽ。' });
  }

  /* ================= 地图 ================= */
  const LEG = { p: 'paddy', F: 'roof', j: 'gravel' };
  const say = (who, lines, k) => async S => { const f = S.f; const i = f[k] = ((f[k] ?? -1) + 1) % lines.length; await S.say(who, lines[i]); };
  const N = t => S => S.narr(t);
  function niwaRows() {
    const G = grid(24, 15, '"');
    G.rect(0, 0, 23, 1, 'P'); [0, 3, 7, 12, 16, 21].forEach(x => G.set(x, 1, 'T'));
    G.rect(0, 2, 23, 3, 'd'); G.rect(0, 4, 23, 4, 'h'); G.set(12, 4, 'd');
    G.rect(0, 5, 0, 10, 'h'); G.rect(23, 5, 23, 10, 'h'); G.rect(12, 5, 12, 10, 'j');
    G.set(21, 8, 'T'); G.set(1, 9, 'T');
    G.rect(0, 11, 23, 11, 'l'); G.set(0, 11, 'F'); G.set(23, 11, 'F');
    G.rect(0, 12, 23, 14, 'F'); G.set(12, 12, 'l');
    return G.rows();
  }
  function nakaRows() { const G = grid(20, 9, '#'); G.rect(1, 2, 7, 5, 't'); G.rect(9, 2, 12, 5, 'W'); G.rect(14, 2, 18, 5, 't'); G.rect(1, 6, 18, 6, 'l'); return G.rows(); }
  function heyaRows() { return grid(10, 9, '#').rect(1, 2, 8, 7, 't').rows(); }
  function teraRows() {
    const G = grid(20, 14, 'j');
    G.rect(0, 0, 19, 2, '#'); G.rect(0, 0, 1, 13, 'P'); G.rect(18, 0, 19, 13, 'P');
    G.rect(2, 3, 17, 3, 'l'); G.rect(9, 4, 10, 11, 'k');
    G.rect(0, 12, 19, 13, 'P'); G.rect(9, 12, 10, 13, 'k'); G.set(2, 11, 'P'); G.set(17, 11, 'P'); G.set(17, 10, 'B');
    return G.rows();
  }
  function deguchiRows() {
    const G = grid(20, 12, '"');
    G.rect(0, 0, 19, 1, 'P'); [2, 9, 16].forEach(x => G.set(x, 1, 'T')); G.set(0, 2, 'T'); G.set(19, 3, 'B');
    G.rect(0, 4, 19, 4, ':'); G.rect(0, 5, 19, 5, '='); G.rect(0, 6, 19, 6, ':');
    G.rect(0, 8, 19, 10, 'p'); G.rect(0, 11, 19, 11, 'T');
    return G.rows();
  }
  async function clockUse(S) {
    const n = S.ent('clockH').num, T = { 8: '晚上八点多。', 11: '十一点二十分。', 12: '十二点四十分。', 2: '两点零五分。', 4: '四点十分。', 5: '五点十分。', 7: '七点整。' };
    if (S.f.phase === 'setup') return S.narr('枕边的小座钟。七点刚过。\n离明天早上七点，还有十二个小时。');
    await S.narr('枕边的小座钟。' + (T[n] || '') + (S.f.phase === 'night' ? '\n秒针走得慢极了。' : ''));
  }
  async function butsudanUse(S) {
    await S.narr('佛坛。线香的味道。\n里面摆着好几张黑白照片。最边上那张，是一个穿立领学生服的男孩，看起来跟你差不多大。');
    if (S.f.saw) await S.think('（……爷爷说，五十年前，他最小的弟弟就是这么没的。）');
    else await S.think('（……这是谁？）');
  }
  async function noufuTalk(S) {
    const f = S.f; S.face('noufu', 'pl');
    if (f.phase === 'dusk') return S.say('种田的老伯', '天要黑了！还在外面晃什么，快回家！');
    if (f.phase === 'totera') return S.say('种田的老伯', ['哟，高野家的孙子？长这么高了。', '……老高野，你脸色怎么这么难看？'][(f._nf = ((f._nf ?? -1) + 1) % 2)]);
    await say('种田的老伯', [
      '北边山道口？前几天修路的卡车在那儿倒车，咣当一声，撞着了什么。司机下来鼓捣了半天，左右瞅瞅，开着车就跑了。',
      '八尺大人？……小孩子别瞎打听。',
      '我小时候，大人吓唬我们：夜里听见「ぽぽぽ」，就把窗户关严，钻进被子里。不管谁在外面叫，都别应声。'
    ], '_nf2')(S);
  }
  async function tenshuTalk(S) {
    const f = S.f; S.face('tenshu', 'pl');
    if (f.phase === 'dusk') return S.say('杂货店的婆婆', '……快走吧。别回头。', { style: 'whisper' });
    await say('杂货店的婆婆', [
      '要买点什么？……今天不卖给你。买完了还得在外面多待一会儿。快回去吧。',
      '你是高野家的孙子吧。你爷爷那个最小的弟弟，阿清……跟你差不多大的时候，夏天里没的。',
      '老辈人说，那东西个子高，最爱从树篱上面往院子里看。所以这一带的人家，树篱都种得特别高。\n……可是再高，也没有它高。'
    ], '_ts')(S);
  }
  async function kakashiUse(S) {
    if (S.once('kakashi')) {
      S.sfx('sting'); S.shake(300, 1);
      await S.narr('稻田当中，站着一个人影。\n戴着一顶白色的宽檐帽——');
      await S.wait(500);
      await S.narr('……是稻草人。\n可这顶白帽子，是谁给它戴上的？');
      return;
    }
    await S.narr('稻草人。白帽子在风里一晃一晃的。\n你不想多看它。');
  }
  async function southEnd(S) {
    await S.narr(S.f.phase === 'totera' ? '「不是这边！」爷爷一把拽住了你。「寺在东北边。」' : '再往南，就是出村的路了。\n路口的地藏低着头，像在等什么人。');
    S.pos(17, 23, 3);
  }
  async function niwaEnter(S, first) {
    const f = S.f;
    S.dark(f.phase === 'setup' ? .72 : f.phase === 'morning' ? .32 : null);
    if (!['day', 'totera', 'morning'].includes(f.phase)) S.hide('jii');
    if (f.phase === 'day' && S.once('niwa1')) {
      await S.narr('院子里的知了叫得人头昏。\n树篱比你还高出一大截，把外面的村道挡得严严实实。\n爷爷坐在檐廊上抽烟。');
      S.goal('跟檐廊上的爷爷打个招呼');
    }
    if (f.phase === 'totera') { S.place('jii', 11, 11, 2); S.follow('jii', true); S.goal('跟爷爷去寺里（出院门，往东北走）'); }
    if (f.phase === 'setup' && S.once('homeN')) {
      S.amb('night'); S.show('baa_y'); S.face('baa_y', 3);
      await S.narr('你冲进院门，反手把柴门闩上。\n喘了好一会儿，才敢回头。\n……树篱上面，什么都没有。');
      await S.say('奶奶', ['翔太！快进屋！', '二楼的里屋，奶奶已经收拾出来了，窗户也拿报纸糊上了。K婆婆打电话来，叫你照她写的摆。她念完经就过来。']);
      S.goal('上二楼的里屋（屋里走廊尽头的楼梯）');
    }
    if (f.phase === 'morning' && S.once('mornN')) {
      ['rel1', 'rel2', 'rel3', 'rel4', 'kbaa_y', 'baa_y', 'van'].forEach(i => S.show(i));
      S.place('jii', 12, 7, 0); S.follow('jii', false); S.amb('wind');
      await S.narr('院子里站满了人。\n叔公、婶婶、堂哥、姑婆……都是爷爷连夜打电话叫来的亲戚。谁也没说话。\n树篱外面，停着一辆白色的面包车。');
      S.goal('跟爷爷说话');
    }
  }
  async function nakaEnter(S, first) {
    const f = S.f;
    S.dark(f.phase === 'setup' ? .78 : f.phase === 'morning' ? .5 : null);
    S.show('baa_n', !['setup', 'morning'].includes(f.phase));
    if (f.phase === 'day' && first) {
      await S.narr('八月的午后。电风扇嗡嗡地摇着头。\n爸妈把你放下就开车回城了——说好暑假结束再来接你。');
      await S.say('奶奶（厨房）', '翔太，你爷爷在檐廊上乘凉呢，去陪他说说话。');
      S.goal('去院子那边的檐廊找爷爷');
      return;
    }
    if (f.jiiIn && !f.called) return phoneScene(S);
    if (f.phase === 'setup' && S.once('nakaS')) { await S.narr('屋里一盏灯也没开。奶奶把所有的木板窗都关上了。\n走廊尽头的楼梯，黑洞洞地通到二楼。'); }
  }
  async function muraEnter(S, first) {
    const f = S.f;
    S.show('jii_m', f.phase === 'totera');
    if (f.phase === 'totera') {
      S.place('jii_m', 8, 13, 0); S.follow('jii_m', true);
      if (S.once('mura1')) await S.narr('正午的村道白晃晃的。稻田一直铺到山脚下。\n爷爷走得很快，一句话也不说。');
      S.goal('跟爷爷去寺里（往东，再往北）');
    } else S.follow('jii_m', false);
    if (f.phase === 'jizo') jizoGoal(S);
    if (f.phase === 'dusk') return duskStart(S);
  }
  async function teraEnter(S, first) {
    const f = S.f;
    S.show('jii_t', ['jizo', 'dusk'].includes(f.phase));
    S.dark(f.phase === 'dusk' ? .55 : null);
    if (f.phase === 'totera') {
      await S.narr('杉树围着一座老旧的小寺。蝉声一下子远了。');
      S.place('jii_t', 13, 5, 3);
      await S.walk('pl', [14, 4], 4); S.turn(3);
      await teraMeet(S);
      S.place('jii_t', 16, 3, 0);
    }
  }
  async function teraExit(S) { await S.go('mura', 29, 5, 1); }
  function MAPS() {
    return {
      /* ---------------- 爷爷家：院子 ---------------- */
      niwa: {
        amb: 'wind', dark: .05, plr: 3.4, floor: 'lightwood', wall: 'wood', legend: LEG,
        tileOpts: { grassC: '#3a5a2e', treeC: '#24402a' },
        rows: niwaRows(),
        ents: [
          { id: 'hedgeL', x: 0, y: 4, w: 12, spr: 'tallhedge', on: N('树篱密得插不进一根手指，比你高出一大截。\n外面是村道。从院子里，只看得见天。') },
          { id: 'hedgeR', x: 13, y: 4, w: 11, spr: 'tallhedge', on: N('树篱上爬着几只蜗牛。\n奶奶说，这一带的人家，树篱都种得特别高。') },
          { id: 'kido', x: 12, y: 4, spr: 'kido', on: gateUse },
          { id: 'van', x: 13, y: 2, w: 3, spr: 'van', hidden: true, solid: false },
          { id: 'hachiY', x: 0, y: 3, spr: 'hachi', hidden: true, solid: false },
          { id: 'hoshi', x: 3, y: 6, w: 2, spr: 'monohoshi', full: true, on: laundry },
          { x: 19, y: 6, spr: 'well', on: N('老水井。往下看，黑沉沉的水面上映着一小块天。\n还有你的脸。') },
          { x: 15, y: 8, spr: 'suika', on: S => S.narr(S.f.saw ? '西瓜还泡在井水里。\n……那天晚上，你没有吃到这个西瓜。' : '铁盆里泡着一个大西瓜，井水冰得手发麻。\n奶奶说，晚上切。') },
          { x: 8, y: 8, spr: 'stonelantern', off: true, on: N('长满青苔的石灯笼。里面有个蜘蛛网，网上挂着一只干瘪的蝉。') },
          { id: 'jii', x: 7, y: 11, spr: '@jii', dir: 0, on: jiiTalk },
          { x: 5, y: 11, spr: 'furin', solid: false, on: N('檐下的玻璃风铃。叮——\n风一停，它也就不响了。') },
          { x: 8, y: 11, spr: 'katori', solid: false, on: N('绿色的蚊香，烟细细地往上飘。夏天的味道。') },
          { id: 'neko', x: 17, y: 11, spr: 'neko', on: S => S.narr(S.f.saw ? '白猫弓着背，冲着树篱那边，发出低低的呜呜声。' : '一只白猫趴在檐廊上睡觉。\n你摸它，它只甩了一下尾巴。') },
          { x: 12, y: 10, spr: 'shoes', col: '#6a5a44', on: N('爷爷的木屐。摆得整整齐齐。') },
          { x: 12, y: 12, spr: 'invisible', touch: async S => S.go('naka', 10, 2, 0) },
          { id: 'baa_y', x: 14, y: 11, spr: '@baa', hidden: true, on: S => S.say('奶奶', S.f.phase === 'morning' ? ['……翔太。', '路上千万别睁眼。到了城里，给奶奶打个电话。'] : '快上楼去！') },
          { id: 'rel1', x: 9, y: 7, spr: '@ojiK', hidden: true, on: say('叔公', ['我是你爷爷的弟弟。你小时候我还抱过你。', '五十年前，我也坐过一回这样的车。那一回坐在中间的，是我们最小的弟弟，阿清。', '……他在车上睁了眼。我就坐在他旁边，没能按住他。'], '_r1') },
          { id: 'rel2', x: 15, y: 6, spr: '@obaS', hidden: true, on: say('婶婶', ['别怕。我们都在。', '坐在中间，左右前后都是自家人。谁也看不见你。'], '_r2') },
          { id: 'rel3', x: 17, y: 9, spr: '@itoko', hidden: true, on: say('堂哥', ['我开车。……一脚油门都不会松，你放心。', '昨天半夜接到电话，我还以为谁出事了。……原来是真的啊。'], '_r3') },
          { id: 'rel4', x: 6, y: 9, spr: '@obaK', hidden: true, on: say('姑婆', ['同一个血脉的人围着坐，它就分不清哪一个是你了。', '……K婆婆是这么说的。我活了七十年，头一回信这种事。'], '_r4') },
          { id: 'kbaa_y', x: 11, y: 6, spr: '@kbaa', hidden: true, on: S => S.say('K婆婆', '等你爷爷交代完，就上车。') }
        ],
        enter: niwaEnter
      },
      /* ---------------- 爷爷家：屋里 ---------------- */
      naka: {
        amb: 'room', dark: .12, plr: 3.4, wall: 'shoji', floor: 'tatami', legend: LEG,
        rows: nakaRows(),
        ents: [
          { id: 'doorN', x: 10, y: 1, spr: 'sliding', on: async S => { S.sfx('open'); await S.go('niwa', 12, 11, 3); } },
          { x: 1, y: 2, spr: 'butsudan', on: butsudanUse },
          { x: 3, y: 1, spr: 'scroll', on: N('挂轴上写着四个字。你只认得出一个「佛」字。') },
          { x: 4, y: 2, spr: 'tv', on: N('电视里在转播甲子园。解说员的声音跟知了叫混在一起。\n满垒。观众席上一片白花花的帽子。') },
          { x: 6, y: 2, spr: 'fan', on: N('电风扇一边摇头一边嗡嗡响。\n你对着它「啊——」了一声，声音被吹得一颤一颤的。') },
          { x: 3, y: 4, w: 2, spr: 'lowtable', on: N('矮桌上摆着麦茶和一盘腌黄瓜。') },
          { x: 9, y: 2, spr: 'fridge', on: N('冰箱上贴着一张村营巴士的时刻表。一天三班。') },
          { x: 11, y: 2, spr: 'sink', on: N('水龙头里流出来的是井水，凉得扎手。') },
          { x: 12, y: 2, spr: 'stove', on: N('锅里煮着荞麦面的汤底。') },
          { id: 'baa_n', x: 12, y: 3, spr: '@baa', dir: 3, on: baaTalk },
          { id: 'denwa', x: 1, y: 6, spr: 'denwa', on: N('黑色的拨盘电话。听筒还是温的。') },
          { id: 'jii_n', x: 2, y: 6, spr: '@jii', hidden: true, dir: 1 },
          { id: 'bag', x: 14, y: 2, spr: 'bag', on: N('你的运动包。暑假作业塞在最底下，一个字都没写。') },
          { x: 16, y: 3, h: 2, spr: 'futon', col: '#c88a5a', on: N('昨晚睡的被褥，叠到一半就懒得叠了。') },
          { x: 16, y: 1, spr: 'window', lit: true, on: N('窗外是后山。绿得发黑的杉树林，一直连到天边。') },
          { x: 18, y: 2, spr: 'dresser', col: '#6a4a30', on: N('衣柜里挂着爷爷年轻时的西装，一股樟脑丸的味道。') },
          { id: 'stairs', x: 18, y: 6, spr: 'stairsup', solid: false, to: ['heya', 4, 7, 3], lock: S => ['setup', 'morning'].includes(S.f.phase), lockMsg: '通往二楼的楼梯。\n奶奶说，楼上的里屋堆满了杂物，好多年没人进去过了。' }
        ],
        enter: nakaEnter
      },
      /* ---------------- 二楼的里屋 ---------------- */
      heya: {
        amb: 'night', dark: .8, plr: 2.4, wall: 'paper', floor: 'tatami', legend: LEG,
        rows: heyaRows(),
        ents: [
          { id: 'win', x: 4, y: 1, spr: 'nwin', on: winUse },
          { id: 'clockH', x: 3, y: 2, spr: 'tclock', num: 7, on: clockUse },
          { id: 'butsu', x: 6, y: 3, spr: 'kibako', on: butsuUse },
          { id: 'futonH', x: 2, y: 4, h: 2, spr: 'shikibuton', on: futonUse },
          ...[[1, 2], [8, 2], [1, 7], [8, 7]].map(([x, y], i) => ({ id: 'sumi' + i, x, y, spr: 'moru', solid: false, on: S => sumiUse(S, S.ent('sumi' + i)) })),
          { id: 'andon', x: 7, y: 6, spr: 'andon', light: { r: 3.6, col: 'rgba(255,190,110,.2)', flick: true }, on: N('纸糊的行灯。灯芯滋滋地响。\n光只照得到半间屋子。') },
          { x: 8, y: 5, spr: 'omaru', on: N('一个搪瓷尿壶。K婆婆说：「七点以前，不许出这个门。」\n……你决定今晚少喝水。') },
          { id: 'fusuma', x: 4, y: 8, spr: 'fusuma', on: heyaDoor },
          { id: 'kbaaH', x: 5, y: 7, spr: '@kbaa', hidden: true, dir: 3 }
        ],
        async enter(S, first) {
          const f = S.f;
          if (f.phase === 'setup') {
            if (first) {
              S.dark(.6);
              await S.narr('六叠大的屋子。一股霉味。\n窗户上里里外外糊满了旧报纸。屋子当中摆着一个木箱，箱子上立着一尊小小的佛像。\n四个角上，各放着一个空的小碟子。');
              await S.think('（K婆婆写的规矩……再看一遍。）');
              await S.note('okite');
            }
            setupGoal(S);
          }
        }
      },
      /* ---------------- 村道 ---------------- */
      mura: {
        amb: 'wind', dark: .05, plr: 3.6, legend: LEG, tileOpts: { grassC: '#3a5a2e', treeC: '#24402a' },
        rows: muraRows(),
        ents: [
          { x: 8, y: 15, spr: 'invisible', touch: homeGate },
          { x: 30, y: 5, spr: 'invisible', touch: async S => S.go('tera', 9, 11, 3) },
          { x: 17, y: 24, spr: 'invisible', touch: southEnd },
          { id: 'barrier', x: 17, y: 1, spr: 'barrier', on: N('「通行止　北山道塌方修复中」\n栏杆后面，石阶一路往上，没进了杉树林里。') },
          { x: 17, y: 3, spr: 'stain', col: 'rgba(60,40,20,.45)', decal: true, on: N('泥地上有很深的车辙。\n在地藏跟前，车辙拐了一个很急的弯。') },
          { id: 'jizoN', x: 16, y: 3, spr: 'jizo', col: '#c87870', on: jizoN },
          { id: 'jhead', x: 16, y: 4, spr: 'jhead', hidden: true, solid: false, on: N('地藏的头，脸朝上躺在草丛里。\n它在笑。地藏一直都是笑着的。') },
          { id: 'jizoE', x: 34, y: 11, spr: 'jizo', flowers: true, on: jizoE },
          { id: 'jizoS', x: 18, y: 23, spr: 'jizo', full: true, on: jizoS },
          { id: 'jizoW', x: 2, y: 11, spr: 'jizo', water: true, on: jizoW },
          { id: 'keiji', x: 16, y: 11, spr: 'keiji', on: S => S.note('keiji') },
          { id: 'noufu', x: 12, y: 14, spr: '@noufu', dir: 3, on: noufuTalk },
          { x: 22, y: 10, w: 3, spr: 'shopfront', on: N('村里唯一的杂货店。卖烟、卖酒、卖盐、卖蚊香，也卖小孩子喝的弹珠汽水。') },
          { id: 'tenshu', x: 23, y: 11, spr: '@tenshu', dir: 0, on: tenshuTalk },
          { id: 'kakashi', x: 25, y: 14, spr: 'kakashi', on: kakashiUse },
          { x: 27, y: 11, spr: 'vending', col: '#c83030', on: N('自动售货机。一罐汽水一百二十日元。\n你摸了摸口袋——只有五十。') },
          { x: 33, y: 13, spr: 'busstop', on: N('村营巴士站。一天只有三班，最后一班是下午四点。') },
          { id: 'hachiM', x: 34, y: 12, spr: 'hachi', hidden: true, solid: false },
          { id: 'hachiN', x: 19, y: 1, spr: 'hachi', hidden: true, solid: false },
          { id: 'jii_m', x: 8, y: 13, spr: '@jii', hidden: true, on: S => S.say('爷爷', '别停。快走。') }
        ],
        enter: muraEnter
      },
      /* ---------------- 寺 ---------------- */
      tera: {
        amb: 'wind', dark: .12, plr: 3.6, wall: 'wood', floor: 'lightwood', legend: LEG, tileOpts: { treeC: '#1e3a24' },
        rows: teraRows(),
        ents: [
          ...[3, 4, 9, 10].map(x => ({ x, y: 2, spr: 'sliding', on: N('本堂的拉门关着。门缝里飘出线香的烟。') })),
          { x: 6, y: 3, w: 2, spr: 'saisen', on: N('功德箱。你往里面丢了一枚十日元硬币，硬币在木格子上弹了两下才掉下去。') },
          { id: 'kakocho', x: 13, y: 3, spr: 'book', col: '#7a6a4a', on: S => S.note('kakocho') },
          { id: 'kbaa', x: 14, y: 3, spr: '@kbaa', dir: 0, on: kbaaTalk },
          { id: 'jii_t', x: 16, y: 3, spr: '@jii', hidden: true, dir: 0, on: S => S.say('爷爷', S.f.phase === 'dusk' ? '快走！爷爷打完电话就回去！' : ['……喂？是我。阿清那件事，又来了。', '亲戚们天亮之前都会到。你快去快回。'][S.f._jt = ((S.f._jt ?? -1) + 1) % 2]) },
          { x: 17, y: 3, spr: 'denwa', on: N('寺里的电话。拨号盘被磨得发亮。') },
          { x: 4, y: 6, spr: 'kane', on: N('钟楼。粗大的撞木用麻绳吊着。\nK婆婆说，盂兰盆的时候才撞。') },
          { x: 14, y: 7, spr: 'gravestone', on: N('长满青苔的墓碑。字已经被风雨磨平了。') },
          { x: 16, y: 7, spr: 'gravestone', on: N('墓碑前供着一罐啤酒，还没打开。') },
          { x: 14, y: 9, spr: 'gravestone', on: N('一块很小的墓碑。上面只刻着「童子」两个字。') },
          { id: 'graveT', x: 15, y: 9, spr: 'gravestone', flowers: true, on: N('「高野家之墓」\n侧面刻着一行行名字。最后一行是：\n昭和二十七年八月　俗名　清　行年十六\n\n墓前的花是新换的。') },
          { x: 16, y: 9, spr: 'gravestone', on: N('墓碑后面插着一排木牌，墨迹被雨水泡得发灰。') },
          ...[2, 3, 4].map(x => ({ x, y: 9, spr: 'jizo', col: '#c83a30', on: N('一排小小的地藏，戴着红围兜和红帽子。\n脚边摆着风车，一动不动。') })),
          { x: 6, y: 9, spr: 'well', on: N('洗手的石盆。竹勺子搁在边上，水面上漂着一片落叶。') },
          { x: 8, y: 10, spr: 'stonelantern', on: N('石灯笼。') }, { x: 11, y: 10, spr: 'stonelantern', on: N('石灯笼。底座上刻着「享保」两个字。') },
          { x: 12, y: 6, spr: 'neko', col: '#3a3030', on: N('一只黑猫，从你脚边走过去，头也不回。') },
          { x: 9, y: 12, w: 2, spr: 'sanmon', solid: false },
          { x: 9, y: 13, spr: 'invisible', touch: teraExit }, { x: 10, y: 13, spr: 'invisible', touch: teraExit }
        ],
        enter: teraEnter
      },
      /* ---------------- 村口（南边的村界） ---------------- */
      deguchi: {
        amb: 'wind', dark: .3, plr: 3.6, legend: LEG, tileOpts: { grassC: '#3a5a3a', treeC: '#22402a' }, fog: .18,
        rows: deguchiRows(),
        ents: [
          { x: 1, y: 5, w: 3, spr: 'van', on: N('面包车的车顶上，有几道长长的刮痕。\n像是被什么很长的指甲划过。') },
          { x: 14, y: 5, w: 2, spr: 'car', col: '#2a3a5a', on: N('爸爸的车。车里一股烟味——他好多年前就说戒了。') },
          { x: 10, y: 3, spr: 'jizo', full: true, flowers: true, on: N('村子南边的地藏。脚边供着新编的草鞋和野花。\n它好好地立在这里。\n你对着它，深深地鞠了一躬。') },
          { x: 17, y: 3, spr: 'sign', col: '#2a6a3a', on: N('县道的路牌。往前四十公里，就是镇上的火车站。') },
          { id: 'jii_d', x: 5, y: 4, spr: '@jii', on: jiiBye },
          { id: 'kbaa_d', x: 8, y: 4, spr: '@kbaa', on: kbaaBye },
          { id: 'chichi', x: 13, y: 4, spr: '@chichi', on: chichiTalk },
          { x: 2, y: 3, spr: '@itoko', on: N('堂哥靠在车边抽烟，手还在抖。') },
          { x: 4, y: 7, spr: '@obaS', dir: 3, on: S => S.say('婶婶', '……你的手，都被你自己掐出血印子了。') }
        ],
        enter: deguchiEnter
      }
    };
  }

  /* ================= 章节 ================= */
  const hatX = (g, d, fr, G, R) => { R(0, G.hT + 1, 16, 1, HATC); R(4, G.hT - 3, 8, 3, HATC); R(4, G.hT, 8, 1, '#d9d1bc'); R(5, G.hT - 3, 2, 1, '#ffffff'); };
  defChapter({
    id: 'hasshaku', n: 2, title: '八尺大人', sub: '盛夏的乡下，树篱上方，一顶白色的宽檐帽慢慢走过。ぽ、ぽぽ、ぽ。', origin: '日本网络怪谈', color: '#3d5a3a',
    icon: '@hachi', amb: 'wind', floor: 'tatami', wall: 'shoji', dark: .1, plr: 3.4,
    people: {
      me: { key: 'shota', skin: '#f0c8a0', hair: '#1a1414', hs: 'short', top: '#f2f2ee', top2: '#d0d0c8', bottom: '#2a3448', shoes: '#e8e4dc' },
      jii: { skin: '#d6a47e', hair: '#c8c4c0', hs: 'bald', top: '#e8e4d8', top2: '#c8c0b0', bottom: '#8a8478', shoes: '#4a3a2a' },
      baa: { skin: '#e2bc9c', hair: '#bdb8b2', hs: 'bun', top: '#6a5a7a', bottom: '#4a4048', skirt: true, apron: '#e8e2d6', shoes: '#3a2a2a' },
      kbaa: { skin: '#d8b49a', hair: '#ece8e2', hs: 'bun', top: '#3a3040', top2: '#e8e2d6', bottom: '#3a3040', robe: true, shoes: '#2a2020' },
      noufu: { skin: '#b88a62', hair: '#3a3430', hs: 'short', top: '#7a8a9a', top2: '#e8e8e0', bottom: '#4a5a6a', shoes: '#2a2a2a', hat: 'straw' },
      tenshu: { skin: '#e2bc9c', hair: '#9a9490', hs: 'bun', top: '#7a4a4a', bottom: '#4a3a3a', skirt: true, apron: '#3a4a6a', shoes: '#2a2a2a' },
      ojiK: { skin: '#d4a07a', hair: '#d8d4d0', hs: 'short', top: '#2a2a2e', top2: '#e8e8e8', bottom: '#2a2a2e', shoes: '#1a1a1a' },
      obaS: { skin: '#f0c8a8', hair: '#2a1a14', hs: 'bob', top: '#8a7a9a', bottom: '#4a4058', skirt: true, shoes: '#3a3030' },
      itoko: { skin: '#e0b48e', hair: '#2a2020', hs: 'messy', top: '#4a6a4a', bottom: '#2a2a3a', shoes: '#e8e8e8' },
      obaK: { skin: '#e0b898', hair: '#aaa6a2', hs: 'bun', top: '#4a5a6a', bottom: '#3a3a44', skirt: true, shoes: '#2a2a2a' },
      chichi: { skin: '#e8c09a', hair: '#1e1818', hs: 'short', top: '#e8e8e8', top2: '#2a3a6a', bottom: '#3a3a40', shoes: '#1a1a1a' },
      hachi: { key: 'hachi-icon', skin: '#e7ded2', hair: '#0f0a0c', hs: 'long', top: '#ebe7dc', top2: '#ebe7dc', bottom: '#ebe7dc', robe: true, noFeet: true, eye: '#1a1214', mouth: '#8a3434', hat: 'straw', hatC: HATC, extra: hatX },
      hachiF: { key: 'hachi-face', skin: '#ece4da', hair: '#0f0a0c', hs: 'long', top: '#ebe7dc', top2: '#ebe7dc', bottom: '#ebe7dc', robe: true, noFeet: true, eye: '#000000', hat: 'straw', hatC: HATC,
        extra(g, d, fr, G, R) { hatX(g, d, fr, G, R); if (d === 0) { R(4, G.hT + 6, 8, 1, '#3a0a0c'); R(5, G.hT + 7, 6, 1, '#5a0c10'); R(6, G.hT + 3, 1, 3, '#000'); R(9, G.hT + 3, 1, 3, '#000'); } } }
    },
    items: {
      mamori: { name: '护身符', desc: 'K婆婆塞给你的小布袋，里面是一张折好的符。\n「天黑以前，它不敢靠得太近。」' },
      shio: { name: '一袋盐', desc: '寺里的粗盐，用报纸包着。要放在房间的四个角上。' },
      fuda: { name: '护符', desc: 'K婆婆亲手写的三张护符。窗户一张，门一张，剩下一张攥在手里。' },
      fudaH: { name: '最后一张护符', desc: '攥在手心里的护符。已经被汗浸得软塌塌的了。' }
    },
    notes: {
      kakocho: { title: '寺的过去帐（摘抄）', text: '（K婆婆翻开一本发黄的册子，把其中几页指给你看。毛笔字，你只看得懂一半。）\n\n○ 享保年间　山中有异物。身长八尺，著白衣，戴笠。其笑声曰「ぽぽ」。好魅少年。\n　乡人难之，请游方僧于四方村界立地藏四尊，封之于境内。\n　北·山道口　东·村界　南·往町之道　西·河畔\n\n○ 文政八年夏　邻村 男子 十七\n　见白衣高女于篱上。三日而亡。\n\n○ 明治三十一年　（虫蛀，看不清）\n\n○ 昭和二十七年八月　高野 清　行年十六\n　篱上见白笠，闻ぽぽ之声。其夜闭居一室。翌朝同族护送出境，于车中开目。四日而亡。\n\n（最后一页的空白处，有人用铅笔写了一行小字：\n地藏有损，则封有隙。）' },
      keiji: { title: '村道口的告示板', text: '【村内告示】\n\n一、北山道塌方修复工程\n　工期：八月三日～八月二十日\n　期间有工程车辆出入山道口，请注意安全。\n\n二、盂兰盆法会\n　八月十三日至十六日，于寺内举行。\n\n三、近日有村民反映夜里听到奇怪的声响。\n　请各家关好门窗。\n\n村公所\n\n（告示的角落，有人用红笔歪歪扭扭地补了一句：\n小孩子不要去北边！）' },
      okite: { title: 'K婆婆写的规矩', text: '（K婆婆的字，写在一张草纸上，墨还没干透。）\n\n一、盐。屋子四个角，每个角一碟。\n　盐要是变了颜色，别碰它，也别怕。\n\n二、护符三张。窗上一张，门上一张。\n　最后一张攥在手里，到天亮都别松开。\n\n三、佛像放在木箱上。\n　地藏在哪一边碎了，它就从哪一边来。佛像的脸，要朝着那一边。\n\n四、门从里面插上。\n　早上七点以前，不管谁叫你，不管是什么声音，都不要应，不要开门。\n\n五、怕了，就对着佛像念经。南无阿弥陀佛。\n\n天亮以后的事，天亮了再说。' },
      tegami: { title: '奶奶的信', text: '翔太：\n\n好久没给你写信了。在城里还好吗？工作忙不忙？\n\n你爷爷走了以后，家里就剩我一个人了。亲戚们轮流来看我，你不用惦记。\n葬礼没让你回来，你别怪奶奶。K婆婆走之前一直念叨，说那孩子这辈子都不能再踏进这里一步。\n\n有件事，奶奶想了很久，还是跟你说一声。\n前些日子，邻村修公路，把东边村界的那尊地藏挪了个地方。\n挪走的那天晚上，好几户人家都说，听见了一个声音。\n\n你知道是什么声音。\n\n护符还带着吧？\n别回来。奶奶不想你。\n……奶奶骗你的。可你还是别回来。\n\n　　　　　　　　　　奶奶' }
    },
    legend: '「八尺大人」（八尺様，Hasshaku-sama）出自日本网络论坛2ch的オカルト板。一般认为它最早发表于2008年8月，贴在「死ぬ程洒落にならない怖い話を集めてみない？」（收集真正吓人到笑不出来的故事）系列帖里：发帖人回忆高中时去乡下爷爷奶奶家过暑假，在院子里看见树篱上方有一顶白帽子移过去——树篱有两米多高，帽子底下是一个穿白连衣裙的女人，同时听到「ぽぽぽ」的奇怪声音。爷爷奶奶听了脸色大变，请来一位老婆婆，让他独自在一间窗户糊满报纸、贴着护符、四角放着盐、木箱上供着佛像的房间里过夜。夜里门外传来爷爷的声音叫他开门，他没有应；第二天早上，盐变成了黑色。之后，同一血脉的亲戚们围坐在一辆面包车里，把他夹在中间护送出村，路上那个声音一直跟着车，他被告诫绝对不能抬头睁眼。\n\n据帖中的说法，「八尺」（约两米四）是它的身高。它被认为只缠上年轻男性或男孩，被它「看上」的人几天之内就会死去；那一带的村子在边界的几个方向立着地藏，把它封在境内，因此只要逃出地藏围起来的范围就安全了，而当事人此后再也不能回到那里。故事的结尾，据说是多年之后，老家传来地藏被毁坏的消息。它的外貌在不同目击者口中并不一样——年轻女人、老妇人、穿丧服或和服——不变的只有异常的身高和「ぽぽぽ」的笑声。\n\n这个故事没有更早的民俗文献可考，一般认为是网络时代的原创怪谈，不过它借用了不少真实的乡间信仰：立在村界、守护村落不让灾厄进入的道祖神和地藏，驱邪的盛盐，以及「被叫名字不要随便应」的禁忌。它很快在日本网络上广泛流传，2010年代以后又以 Hachishakusama 之名传到海外，催生了大量同人画作和游戏改编，「高大的白衣女人」也因此成了一个颇有人气的形象。\n\n（本章中的高野翔太一家、K婆婆、村民，寺里的过去帐、昭和二十七年的往事，北边地藏被工程车撞碎、「叫全名才能睁眼」、门外假扮K婆婆和妈妈的声音，以及奶奶的信，均为游戏虚构。）',
    start: { map: 'naka', x: 16, y: 5, dir: 0 },
    resume: {
      dusk: async S => { S.stop('hachiM'); S.hide('hachiM'); S.f.popo = 'far'; },
      night: async S => { S.hidePlayer(false); S.f.hideEv = false; S.amb('night'); },
      morning: async S => { S.amb('wind'); },
      car: async S => { S.amb('wind'); }
    },
    async intro(S) {
      S.f.phase = 'day';
      await S.card('第二夜　八尺大人', '1998年8月　日本某县　山里的小村子', '那年我高二。\n爸妈把我送到乡下的爷爷奶奶家，\n说好在那里过完整个暑假。\n\n后来，我只在那里住了两天。\n十年过去了，我再也没有回去过。');
    },
    tick(S, dt) {
      const f = S.f; if (!f.popo || W.busy) return;
      poT -= dt; if (poT <= 0) { poT = f.popo === 'near' ? 2.5 + Math.random() * 3 : 16 + Math.random() * 12; popoBg(S); }
    },
    sprites: SPRITES,
    tiles: TILES,
    maps: MAPS()
  });
})();
