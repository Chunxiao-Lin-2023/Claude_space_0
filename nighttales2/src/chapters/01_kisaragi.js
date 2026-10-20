/* ================= 第一夜 · 如月车站 ================= */
(() => {
  /* ---------- 小工具 ---------- */
  const L = (w, fill, marks) => { const a = Array(w).fill(fill); for (const [x, s] of (marks || [])) for (let i = 0; i < s.length; i++) a[x + i] = s[i]; return a.join(''); };
  const FONT = '"Noto Sans CJK JP","Hiragino Sans","Yu Gothic","Noto Sans CJK SC","Microsoft YaHei",sans-serif';
  /* 在精灵里写字：借 R 拿到当前绘制偏移（R 内部调用 g.fillRect(x,y,…)） */
  const TXC = new Map();
  function txtBmp(s, px, col) {   // 二值化的像素字（避免小字号抗锯齿糊成一团）
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
  function txt(g, R, s, a, b, px, col) {
    let X = 0, Y = 0; g.fillRect = (x, y) => { X = x; Y = y; }; R(a, b, 1, 1, '#000'); delete g.fillRect;
    const c = txtBmp(s, px, col); g.drawImage(c, Math.round(X - c.width / 2), Math.round(Y - c.height / 2));
  }
  const BAT0 = 38;
  function bat(S, n) { S.f.bat = Math.max(2, (S.f.bat ?? BAT0) - n); S.toast('手机电量 ' + S.f.bat + '%'); }
  const batT = S => (S.f.bat ?? BAT0) + '%';
  async function post(S, id, lead, cost) {
    if (lead) await S.narr(lead);
    S.sfx('blip'); bat(S, cost ?? 3);
    await S.note(id);
  }
  let TRV = 0, DRT = 1.5;

  /* ---------- 人物 ---------- */
  const closedEyes = (skin) => (g, d, fr, G, R) => { if (d === 0) { R(6, G.hT + 4, 1, 2, skin); R(9, G.hT + 4, 1, 2, skin); R(5, G.hT + 5, 2, 1, shade(skin, -.45)); R(9, G.hT + 5, 2, 1, shade(skin, -.45)); } };
  const PEOPLE_K = {
    me: { skin: '#f2cfb0', hair: '#1c1618', hs: 'bob', top: '#3b4152', top2: '#e2e2ea', coat: true, bottom: '#2a2c36', shoes: '#141214' },
    aoiIcon: { key: 'ks-aoi-icon', skin: '#f2cfb0', hair: '#1c1618', hs: 'bob', top: '#3b4152', top2: '#e2e2ea', coat: true, bottom: '#2a2c36', shoes: '#141214',
      extra(g, d, fr, G, R) { if (d === 0) { R(9, G.tT + 3, 4, 5, '#141414'); R(10, G.tT + 4, 2, 3, '#a6f5cf'); R(4, G.hT + 5, 2, 2, 'rgba(166,245,207,.5)'); } } },
    salary: { key: 'ks-salary', skin: '#e4c09e', hair: '#2a2420', hs: 'short', top: '#30343e', top2: '#d8d8d8', bottom: '#30343e', shoes: '#141414', extra: closedEyes('#e4c09e') },
    obaa: { key: 'ks-obaa', skin: '#e2c2a6', hair: '#b8b4ae', hs: 'bun', top: '#5a4a5a', bottom: '#3a3240', skirt: true, shoes: '#2a2222', extra: closedEyes('#e2c2a6') },
    youth: { key: 'ks-youth', skin: '#efcaa6', hair: '#6a4a2a', hs: 'messy', top: '#5a6a3a', bottom: '#2a3048', shoes: '#d8d8d0',
      extra(g, d, fr, G, R) { closedEyes('#efcaa6')(g, d, fr, G, R); R(4, G.hT - 1, 8, 1, '#202020'); if (d === 0) { R(3, G.hT + 3, 1, 3, '#202020'); R(12, G.hT + 3, 1, 3, '#202020'); } } },
    woman: { key: 'ks-woman', skin: '#f0cdb2', hair: '#3a2018', hs: 'long', top: '#8a6a5a', coat: true, bottom: '#2a2228', shoes: '#2a1a1a', extra: closedEyes('#f0cdb2') },
    student: { key: 'ks-student', skin: '#f2d0b2', hair: '#141010', hs: 'short', top: '#1e2230', top2: '#c8a040', bottom: '#1e2230', shoes: '#141414', extra: closedEyes('#f2d0b2') },
    drunk: { key: 'ks-drunk', skin: '#e8b494', hair: '#3a3430', hs: 'messy', top: '#4a4a42', top2: '#a02a2a', bottom: '#3a3a36', shoes: '#1a1a1a', blush: '#d07a6a', extra: closedEyes('#e8b494') },
    oldman: { key: 'ks-oldman', skin: '#cfae90', hair: '#d0ccc4', hs: 'bald', top: '#4a4438', top2: '#3a342a', bottom: '#3a362e', shoes: '#1a1814', mouth: '#5a3a2a',
      extra(g, d, fr, G, R) {
        if (d === 0 || d === 3) { g.clearRect(9, G.lT, 2, 7); R(9, G.lT, 2, 2, '#3a362e'); R(13, G.tT + 1, 1, 13, '#8a6a40'); R(12, G.tT + 1, 2, 1, '#8a6a40'); }
        else { g.clearRect(8, G.lT, 2, 7); g.clearRect(9, G.lT + 1, 3, 7); R(3, G.tT + 1, 1, 13, '#8a6a40'); }
      } },
    oni: { key: 'ks-oni', skin: '#e0d8cc', hair: '#0a0808', hs: 'messy', top: '#e6e2d8', top2: '#a02020', robe: true, noFeet: true, bottom: '#e6e2d8',
      extra(g, d, fr, G, R) {
        const h = G.hT;
        if (d === 0) { R(4, h, 8, 7, '#a81c1c'); R(4, h - 2, 1, 2, '#e8e0c8'); R(11, h - 2, 1, 2, '#e8e0c8'); R(5, h + 3, 2, 1, '#f0c030'); R(9, h + 3, 2, 1, '#f0c030'); R(6, h + 5, 4, 1, '#1a0606'); R(6, h + 6, 1, 1, '#fff'); R(9, h + 6, 1, 1, '#fff'); }
        else if (d === 1) { R(4, h, 4, 7, '#a81c1c'); R(5, h - 2, 1, 2, '#e8e0c8'); R(5, h + 3, 1, 1, '#f0c030'); }
      } },
    drummer: { key: 'ks-drummer', skin: '#d8d0c4', hair: '#0a0808', hs: 'short', top: '#e6e2d8', top2: '#2a2a3a', robe: true, noFeet: true, bottom: '#e6e2d8',
      extra(g, d, fr, G, R) {
        const h = G.hT;
        if (d === 0) { R(4, h, 8, 7, '#efeee6'); R(5, h + 3, 2, 1, '#2a2a2a'); R(9, h + 3, 2, 1, '#2a2a2a'); R(3, G.tT + 2, 10, 6, '#7a2a1a'); R(3, G.tT + 2, 10, 1, '#e8dcc0'); R(3, G.tT + 7, 10, 1, '#e8dcc0'); }
        else if (d === 1) { R(4, h, 5, 7, '#efeee6'); R(1, G.tT + 2, 5, 6, '#7a2a1a'); R(1, G.tT + 2, 1, 6, '#e8dcc0'); }
      } },
    suzu: { key: 'ks-suzu', skin: '#d8d0c4', hair: '#0a0808', hs: 'long', top: '#e6e2d8', top2: '#a02020', robe: true, noFeet: true, bottom: '#e6e2d8',
      extra(g, d, fr, G, R) {
        const h = G.hT;
        if (d === 0) { R(4, h, 8, 7, '#f2eee6'); R(4, h - 2, 2, 2, '#f2eee6'); R(10, h - 2, 2, 2, '#f2eee6'); R(5, h + 2, 2, 1, '#c02020'); R(9, h + 2, 2, 1, '#c02020'); R(7, h + 5, 2, 1, '#c02020'); }
        else if (d === 1) { R(3, h, 6, 7, '#f2eee6'); R(5, h - 2, 2, 2, '#f2eee6'); R(4, h + 2, 2, 1, '#c02020'); }
        R(13, G.tT - 5, 1, 13, '#8a6a40'); R(12, G.tT - 6, 3, 2, '#d8b840'); R(12, G.tT - 3, 3, 1, '#d8b840');
      } },
    lant: { key: 'ks-lant', skin: '#0a0a0c', hair: '#0a0a0c', hs: 'short', hat: 'hood', hatC: '#1c1c22', top: '#24242c', robe: true, noFeet: true, bottom: '#24242c', eye: '#0a0a0c',
      extra(g, d, fr, G, R) { const x = d === 1 ? 0 : 12; R(x + 1, G.tT - 2, 1, 4, '#3a3a3a'); R(x, G.tT + 2, 4, 6, '#e8a050'); R(x, G.tT + 4, 4, 1, '#a04020'); R(x + 1, G.tT + 3, 2, 1, '#ffd890'); } },
    driver: { key: 'ks-driver', skin: '#e2bf9c', hair: '#2a2420', hs: 'short', top: '#5a5a50', top2: '#c8c8c0', bottom: '#3a3a34', shoes: '#1a1a1a', mouth: '#8a4a3a',
      extra(g, d, fr, G, R) { if (d === 0) { R(5, G.hT + 4, 2, 1, '#9a9a9a'); R(9, G.hT + 4, 2, 1, '#9a9a9a'); R(7, G.hT + 4, 2, 1, '#6a6a6a'); } else if (d === 1) R(5, G.hT + 4, 2, 1, '#9a9a9a'); } },
    ekiin: { skin: '#e0bc98', hair: '#9a9690', hs: 'short', hat: 'cap', hatC: '#1e2a44', top: '#22304e', top2: '#e8e8e8', bottom: '#22304e', shoes: '#141414' },
    mother: { key: 'ks-mother', skin: '#e8e0d8', hair: '#141010', hs: 'long', top: '#6a5a6a', bottom: '#3a3040', eye: '#000',
      extra(g, d, fr, G, R) { if (d === 0) { R(5, G.hT + 3, 2, 3, '#000'); R(9, G.hT + 3, 2, 3, '#000'); R(6, G.hT + 6, 4, 2, '#2a0606'); } } }
  };

  /* ---------- 瓦片 ---------- */
  const TILES_K = {
    nsky: { solid: true, paint(R, X, Y) {
      R(0, 0, 16, 16, Y === 0 ? '#040b0a' : '#06110f');
      for (let i = 0; i < 2; i++) if (hash(X, Y, 50 + i) < .28) R((hash(X, Y, 60 + i) * 15) | 0, (hash(Y, X, 70 + i) * 12) | 0, 1, 1, '#3c5a52');
      if (Y === 1) { const h = (7 + Math.sin(X * .45) * 3 + hash(X, 0, 81) * 2) | 0; R(0, h, 16, 16 - h, '#020605'); R(0, h, 16, 1, '#0a1714'); }
    } },
    dawn: { solid: true, paint(R, X, Y) {
      if (Y === 0) { R(0, 0, 16, 8, '#1e2440'); R(0, 8, 16, 8, '#2e2c4c'); }
      else { R(0, 0, 16, 5, '#5a3c58'); R(0, 5, 16, 4, '#9a5a50'); R(0, 9, 16, 2, '#d89a60'); const h = (10 + Math.sin(X * .4) * 2 + hash(X, 0, 9) * 2) | 0; R(0, h, 16, 16 - h, '#1a1820'); }
      if (Y === 0 && hash(X, Y, 3) < .2) R((hash(X, Y, 4) * 15) | 0, (hash(X, Y, 5) * 6) | 0, 1, 1, '#8a8ab0');
    } },
    rails: { solid: false, paint(R, X, Y) {
      speck(R, '#34302c', ['#423c36', '#2a2622', '#4a443e'], X, Y, 18, 21);
      for (let i = 0; i < 16; i += 4) R(i + 1, 2, 2, 12, '#4a3626');
      R(0, 4, 16, 2, '#6e7278'); R(0, 4, 16, 1, '#aeb4ba'); R(0, 10, 16, 2, '#6e7278'); R(0, 10, 16, 1, '#aeb4ba');
    } },
    ballast: { solid: false, paint(R, X, Y) { speck(R, '#38342f', ['#46403a', '#2c2824', '#524a42'], X, Y, 22, 23); } },
    pedge: { solid: false, paint(R, X, Y) {
      speck(R, '#5e615e', ['#6a6d6a', '#555855'], X, Y, 10, 24);
      R(0, 3, 16, 3, '#b8a030'); for (let i = 1; i < 16; i += 3) R(i, 4, 1, 1, '#8a7820');
      R(0, 12, 16, 2, '#9a9c98'); R(0, 14, 16, 2, '#1a1c1a');
    } },
    trfloor: { solid: false, paint(R, X, Y) { R(0, 0, 16, 16, '#3c4844'); for (let y = 2; y < 16; y += 4) R(0, y, 16, 1, '#44524c'); if (hash(X, Y, 31) < .15) R(5, 7, 3, 1, '#34403c'); } }
  };
  PEOPLE_K.stare = { key: 'ks-stare', skin: '#d4d8d2', hair: '#141414', hs: 'short', top: '#30343e', bottom: '#30343e', shoes: '#141414',
    extra(g, d, fr, G, R) { if (d === 0) { R(5, G.hT + 3, 2, 3, '#000'); R(9, G.hT + 3, 2, 3, '#000'); R(6, G.hT + 4, 1, 1, '#e8e8e8'); R(10, G.hT + 4, 1, 1, '#e8e8e8'); } } };

  /* ---------- 精灵 ---------- */
  const SPR_K = {
    lseat(g, e, t, R) {
      if (e.bot) { R(0, 2, 16, 10, '#2e6a4e'); R(0, 2, 16, 2, '#3e805e'); R(0, 11, 16, 4, '#1c4434'); }
      else { R(0, 0, 16, 4, '#1c4434'); R(0, 4, 16, 10, '#2e6a4e'); R(0, 12, 16, 2, '#3e805e'); }
      R(0, 0, 1, 16, 'rgba(0,0,0,.25)');
    },
    trdoor(g, e, t, R) {
      R(0, -3, 16, 17, '#4c5652');
      if (e.open) { R(1, -2, 14, 16, '#010303'); return; }
      R(1, -2, 7, 16, '#a2aca8'); R(8, -2, 7, 16, '#96a09c'); R(7, -2, 2, 16, '#3a4440');
      R(2, 0, 4, 7, '#06100e'); R(10, 0, 4, 7, '#06100e'); R(3, 1, 1, 3, '#24423a'); R(11, 1, 1, 3, '#24423a');
    },
    cabdoor(g, e, t, R) {
      R(1, -3, 14, 17, '#58625e'); R(2, -2, 12, 15, '#8e9894'); R(4, 0, 8, 5, '#0c1a16');
      R(4, 0, 8, 3, '#2a4a3e'); for (let i = 0; i < 4; i++) R(4 + i * 2, 0, 1, 3, '#1a3028');
      R(11, 7, 2, 2, '#c8c8c0'); if (Math.sin(t * 2) > .6) R(9, 3, 1, 1, '#7affc0');
    },
    rmap(g, e, t, R) {
      R(0, 0, 16, 8, '#e6e4da'); R(0, 0, 16, 1, '#8a8a80'); R(1, 4, 14, 1, '#2a8a5a');
      for (let i = 0; i < 4; i++) R(1 + i * 4, 3, 2, 3, i === 3 ? '#c03030' : '#2a8a5a');
      R(2, 7, 12, 1, '#b8b6ac');
    },
    ad(g, e, t, R) { R(1, 0, 14, 11, '#d8cfb8'); R(2, 1, 12, 6, '#5a7a9a'); R(3, 4, 10, 3, '#3a5a3a'); R(5, 2, 3, 2, '#e8d8a0'); R(2, 8, 9, 1, '#5a4a3a'); },
    ekimei(g, e, t, R) {
      R(5, -2, 2, 16, '#2a2c2a'); R(41, -2, 2, 16, '#2a2c2a');
      R(-2, -26, 52, 26, '#1e201e'); R(-1, -25, 50, 24, e.red ? '#d8c8c0' : '#e8e8de');
      txt(g, R, e.text || 'きさらぎ', 24, -17, 12, e.red ? '#5a0a0a' : '#141414');
      R(-1, -10, 50, 1, '#2a7a4a');
      txt(g, R, e.s.prev || 'かたす', 13, -5, 8, '#2a2a2a');
      txt(g, R, e.s.next || 'やみ', 38, -5, 8, '#2a2a2a');
    },
    jikoku(g, e, t, R) { R(7, 2, 2, 12, '#2a2c2a'); R(1, -12, 14, 15, '#2a2c2a'); R(2, -11, 12, 13, '#d6d4c8'); R(2, -11, 12, 2, '#2a7a4a'); R(9, 0, 4, 1, '#8a8a80'); },
    hclock(g, e, t, R) { R(7, -12, 2, 26, '#2a2c2a'); R(3, -21, 10, 10, '#141414'); R(4, -20, 8, 8, '#e4e2d6'); R(7, -17, 2, 2, '#141414'); },
    klamp(g, e, t, R) { R(7, -26, 2, 40, '#2c2e2c'); R(2, -28, 12, 3, '#2c2e2c'); R(3, -25, 10, 2, e.off ? '#2e3430' : '#e8fff4'); R(5, 12, 6, 2, '#1a1c1a'); },
    kgate(g, e, t, R) {
      box(R, 0, -2, 5, 16, '#8a8c88'); box(R, 11, -2, 5, 16, '#8a8c88'); R(1, -1, 3, 2, '#2a7a4a'); R(12, -1, 3, 2, '#2a7a4a');
      R(5, 5, 6, 2, e.open ? 'rgba(0,0,0,0)' : '#c8a030'); R(2, 3, 1, 1, '#ff4a3a');
    },
    dengon(g, e, t, R) {
      R(1, -2, 2, 16, '#4a3a2a'); R(13, -2, 2, 16, '#4a3a2a');
      box(R, -2, -14, 20, 15, '#1e3a2a', '#4a3a2a');
      R(0, -11, 7, 1, '#c8d0c4'); R(1, -8, 10, 1, '#c8d0c4'); R(0, -5, 6, 1, '#c8d0c4'); R(9, -11, 6, 1, '#c8d0c4'); R(8, -5, 7, 1, '#c86a6a'); R(3, -2, 9, 1, '#c86a6a');
    },
    train(g, e, t, R) {
      const L = (e.w || 10) * 16;
      R(0, 10, L, 3, 'rgba(0,0,0,.5)');
      R(0, -21, L, 33, '#141c1a'); R(1, -20, L - 2, 31, '#d4d8d0'); R(1, -20, L - 2, 3, '#b0b4ac');
      R(1, 3, L - 2, 3, '#2a8a5a'); R(1, 7, L - 2, 4, '#5a5e5a');
      const dr = [36, 108];
      for (let x = 6; x < L - 8; x += 18) {
        if (dr.some(d => x + 14 > d && x < d + 14)) continue;
        R(x, -15, 14, 11, '#081210'); if (!e.off) R(x + 1, -14, 12, 9, 'rgba(200,255,232,.45)');
        if (!e.off && hash(x, 3, 7) < .5) { R(x + 4, -9, 4, 4, '#203028'); R(x + 5, -11, 2, 2, '#203028'); }
      }
      for (const x of dr) { R(x, -17, 14, 26, '#4c5652'); if (e.open) R(x + 1, -16, 12, 24, '#010303'); else { R(x + 1, -16, 6, 24, '#a2aca8'); R(x + 7, -16, 6, 24, '#96a09c'); R(x + 2, -13, 4, 7, '#081210'); R(x + 8, -13, 4, 7, '#081210'); } }
      R(L - 3, -4, 3, 4, e.off ? '#3a3a2a' : '#fff4c0'); R(0, -4, 2, 4, '#a01818');
    },
    hut(g, e, t, R) {
      box(R, 0, -9, 16, 24, '#5a5048'); R(-1, -12, 18, 4, '#2e2824'); R(-1, -12, 18, 1, '#4a403a');
      R(4, 0, 8, 14, e.open ? '#050404' : '#2e2622'); R(10, 7, 1, 2, '#8a8a80'); R(2, -6, 4, 3, '#121010');
      R(3, -5, 2, 1, '#3a3a30');
    },
    kusa(g, e, t, R) { for (let i = 0; i < 9; i++) { const x = (i * 5 + 1) % 16; R(x, -6 + (i % 3) * 2, 1, 20 - (i % 3) * 2, i % 2 ? '#3a4a2a' : '#4a5a32'); R(x, -7 + (i % 3) * 2, 1, 2, '#7a6a3a'); } },
    tplate(g, e, t, R) { R(-6, 2, 28, 10, '#1a1a18'); R(-5, 3, 26, 8, '#cfc8b4'); txt(g, R, e.text || '伊佐貫', 8, 7, 8, '#1a1a18'); },
    tlamp(g, e, t, R) { R(5, 3, 6, 5, '#1e1e1c'); R(6, 4, 4, 3, e.off ? '#2a1e14' : '#ffb460'); },
    kmpost(g, e, t, R) { R(4, 2, 8, 10, '#d8d6cc'); R(4, 2, 8, 1, '#8a8a80'); txt(g, R, String(e.num ?? 0), 8, 7, 7, '#1a1a18'); },
    portal(g, e, t, R) { R(-2, -2, 20, 16, '#3a3834'); R(1, 1, 14, 13, '#020202'); R(2, 0, 12, 1, '#020202'); R(4, -1, 8, 1, '#020202'); },
    kanban(g, e, t, R) { R(3, 4, 2, 11, '#4a3a2a'); R(11, 4, 2, 11, '#4a3a2a'); R(0, -6, 16, 11, '#4a3a2a'); R(1, -5, 14, 9, '#b8a888'); R(3, -3, 10, 1, '#3a2a1a'); R(3, 0, 7, 1, '#3a2a1a'); }
  };

  /* ---------- 文本 ---------- */
  const NOTES_K = {
    p1: { title: '【实况】末班车好像有点不对劲', text: '1 名無しさん 2004/01/08(木) 23:31:07 ID:kS7rA2gm\n可能是我想多了，先记一下。\n下班坐私铁回家。这条线平时每站四五分钟，\n这趟车已经二十分钟没停站了。\n车上还有几个人，全都睡着了。\n\n2 名無しさん 23:32:15 ID:Xp4Lw0dE\n>>1 坐上快车了吧？睡过站了？\n\n3 名無しさん 23:32:51 ID:kS7rA2gm\n>>2 普通车。每天都坐这趟，不会错的。\n窗外一盏灯都没有。\n\n5 名無しさん 23:34:40 ID:Hh9qTz1c\n去车头看看司机啊。叫醒旁边的人问问。\n\n6 名無しさん 23:35:02 ID:Rm2nV8yU\n来了来了（搬板凳）\n\n8 名無しさん 23:36:44 ID:Xp4Lw0dE\n把你看到的都写下来。站名、时间、周围有什么。\n万一真出了什么事，帖子就是记录。' },
    p2: { title: '实况帖 · 41～50', text: '41 名無しさん 2004/01/08(木) 23:58:12 ID:kS7rA2gm\n车停了。我下车了。\n站名叫「きさらぎ」。\n无人站。没有时刻表，也没有人。\n\n42 名無しさん 23:58:40 ID:Xp4Lw0dE\nきさらぎ？如月？二月的那个如月？\n查了沿线所有站名，没有这个站。\n\n43 名無しさん 23:59:03 ID:Pz3cQ6wa\n>>41 站名牌上，上一站和下一站写的什么？\n\n44 名無しさん 00:00:31 ID:kS7rA2gm\n上一站「かたす」，下一站「やみ」。\n\n45 名無しさん 00:00:58 ID:Pz3cQ6wa\nやみ……闇？\n倒过来念是「みや」——宫。神社的宫。\n\n46 名無しさん 00:01:20 ID:Hh9qTz1c\nかたす，听着像「堅州」。\n古事记里有个「根之堅州国」，是死者去的地方。\n……两头都不太妙啊。\n\n47 名無しさん 00:01:47 ID:Vb8sN1rk\n>>46 关东这边说「かたす」，是收拾、放回原处的意思。\n把东西放回原来的地方。我觉得是好兆头。\n\n48 名無しさん 00:02:10 ID:Rm2nV8yU\n总之别往「やみ」那边去。\n\n50 名無しさん 00:02:33 ID:Xp4Lw0dE\n车站有电话吗？打给家里，或者直接报警。' },
    p3: { title: '实况帖 · 78～83', text: '78 名無しさん 2004/01/09(金) 00:41:05 ID:kS7rA2gm\n顺着铁轨往回走。远处有太鼓和铃铛的声音，像是祭典。\n刚才身后有人大喊「别走在铁轨上！」\n回头一看，是个只有一条腿的老爷爷。\n一眨眼就不见了。\n\n79 名無しさん 00:41:30 ID:Pz3cQ6wa\n>>78 一条腿……？\n\n80 名無しさん 00:42:12 ID:Hh9qTz1c\n听他的。离铁轨远一点。\n\n81 名無しさん 00:42:40 ID:Vb8sN1rk\n太鼓声要是靠近了，就把手机屏幕关掉，找地方躲起来。\n那种东西是循着光来的。黑地里，你的手机屏幕跟灯笼一样亮。\n\n82 名無しさん 00:43:15 ID:Rm2nV8yU\n前面要是有隧道，进去以后千万别回头。\n伊邪那岐从黄泉逃回来的时候，就是回头看了一眼……\n\n83 名無しさん 00:43:51 ID:Xp4Lw0dE\n>>1 电量还剩多少？省着点用。\n还有，有人说要来接你的话，别随便跟着走。' },
    p4: { title: '实况帖 · 112～117', text: '112 名無しさん 2004/01/09(金) 01:20:44 ID:kS7rA2gm\n出隧道了。洞口的牌子上写着「伊佐貫」。\n这边是山路。远处好像有灯。\n\n113 名無しさん 01:21:02 ID:Pz3cQ6wa\n太好了！！有人家的话就去敲门！\n\n114 名無しさん 01:21:37 ID:Xp4Lw0dE\n伊佐貫，地图上查不到。\n\n115 名無しさん 01:22:10 ID:Hh9qTz1c\n>>112 灯也分好几种，看清楚再走。\n一晃一晃的光别跟。\n车站的灯是荧光灯，白的，一整夜都待在原地。\n\n117 名無しさん 01:22:48 ID:Rm2nV8yU\n……主播，你那边是不是有车的声音？' },
    dengon: { title: '检票口旁的传言板', text: '（车站常见的那种黑板，给等人的人留话用。粉笔字一层盖着一层，有的已经擦花了。）\n\n昭和62年2月　ここはどこですか\n　——这里是哪里？\n\n1994.2　やみ駅から歩いてきた。ここも違う。\n　——我是从「やみ站」走过来的。这里也不对。\n\n平成8年　ひつか駅で降りた人、いますか\n　——有没有在「ひつか站」下过车的人？\n\n（一行写得很工整的字）\n这边的东西，都是反过来的。\n站名要倒着念，路要往回走，电话也要倒着拨。\n　　　　　　　　　　——N\n\n（最底下，红粉笔，写得很用力）\n線路の上を歩くな\n迎えに来る人についていくな\n　——不要走在铁轨上。\n　——来接你的人，别跟他走。' },
    later: { title: '【体验谈】我从「如月站」回来了（个人博客 · 2011年）', text: '（很多年以后，你在网上看到了这样一篇文章。）\n\n我就是当年在帖子里实况的那个人。\n那天晚上我上了那辆车。之后的事情记不太清楚，\n只记得我在「那边」待了很久很久——\n回到这边的时候，已经过去了七年。\n\n——评论（节选）——\n\n·又是自称本人的。这几年冒出来好几个了。\n·和我知道的版本不一样啊。我听说的是她被司机送到了一个有温泉的小镇……\n·我也在「やみ站」下过车。真的。\n·「月の宮站」「ひつか站」……这类异界车站的帖子，后来每年都有新的。\n·所以最开始那个人，到底回来了没有？\n\n（你没有留言，把网页关掉了。\n那天晚上的帖子，你一直没敢再打开看。）' }
  };

  const ITEMS_K = {
    phone: { name: '手机', desc: '用了两年的翻盖手机。电话打不出去，只显示「圈外」——奇怪的是，帖子却一条一条发得出去。' },
    pass: { name: '月票', desc: '浜町—稲里区间的通勤月票。这条线你坐了整整三年。' },
    coin: { name: '十元硬币', desc: '从自动售货机的退币口里摸出来的。冰凉，边上沾着一点泥。' }
  };
  /* ================= 车厢 ================= */
  const CLUES = ['c_pax', 'c_win', 'c_map', 'c_cab'];
  async function trainClue(S, k) {
    if (S.f.arrived) return;
    S.f[k] = true;
    const n = CLUES.filter(c => S.f[c]).length;
    if (n >= 3) return arrive(S);
    S.goal('四处看看（乘客 / 车窗 / 线路图 / 驾驶室）');
  }
  async function pax(S, id, lines, k) {
    if (S.f.arrived) return S.narr('……');
    await S.narr(lines);
    return trainClue(S, k || 'c_pax');
  }
  async function arrive(S) {
    S.f.arrived = true;
    await S.wait(500);
    S.ent('tl3').off = true; S.sfx('switch'); await S.wait(300); S.ent('tl3').off = false; S.ent('tl2').off = true; await S.wait(250); S.ent('tl2').off = false;
    S.sfx('tv');
    await S.say('车内广播', 'ザ……ザザ……次は……き……さら……ぎ……\n（……下一站……きさらぎ……）', { style: 'whisper' });
    await S.think('きさらぎ？\n……这条线上，没有这个站。');
    S.sfx('brake'); S.shake(700, 2); S.amb('none');
    await S.narr('车厢猛地一顿。\n二十多分钟以来，电车第一次停了下来。');
    S.ent('door1').open = true; S.ent('door2').open = true; S.sfx('open');
    await S.narr('车门「噗嘶」一声打开了。\n门外吹进来一股风——带着青草和铁锈的味道，冷得不像一月的风。');
    S.goal('……要下车吗？');
    const r = await S.ask('车门开着。没有人上车，也没有人下车。', ['下车看看', '留在车上']);
    if (r === 1) {
      await S.narr('你攥紧扶手，没有动。');
      await S.wait(800);
      for (const id of ['tl1', 'tl2', 'tl3', 'tl4']) S.ent(id).off = true;
      S.sfx('switch'); S.dark(.97);
      await S.wait(900);
      for (const id of ['salary', 'obaa', 'youth', 'student']) { S.ent(id).spr = '@stare'; S.ent(id).oy = -2; }
      S.ent('tl2').off = false; S.dark(.8);
      S.sfx('sting'); S.shake(400, 2);
      await S.narr('灯又亮了。\n满车厢的人——全都睁着眼睛。\n他们一动不动，齐刷刷地看着你。');
      await S.say('乘客们', 'お降りください。\n（请下车。）', { style: 'big' });
      await S.scare('face', { spr: '@stare', dur: .8 });
      await S.narr('你几乎是摔出车门的。');
    } else await S.narr('你抓起包，走出了车厢。');
    await S.go('station', 9, 7, 3);
  }

  /* ================= 如月站 ================= */
  async function signOn(S) {
    if (S.f.sawSign) { await S.narr('「きさらぎ」。\n上一站「かたす」，下一站「やみ」。\n这块牌子看起来很新，新得像是昨天才挂上去的。'); return; }
    S.f.sawSign = true;
    await S.narr('白底黑字的站名牌。\n正中间四个大字：きさらぎ。\n底下，左边写着「かたす」，右边写着「やみ」。');
    await S.think('如月……？\n这条线上的站，你闭着眼睛都背得出来。没有一个叫这个名字的。');
    await S.narr('你掏出手机。电话还是「圈外」，可帖子的页面，居然还在刷新。');
    await post(S, 'p2', '你把站名发了上去。回复一条接一条地跳了出来。', 4);
    S.goal('想办法联系外面（站台上也许有电话）');
  }
  async function jikokuOn(S) {
    await S.narr('时刻表的框子里，什么都没有贴。\n空白的白纸上，只在最下面的角落印着一行小字：');
    await S.narr('「お問い合わせ　とおみ駅　☎ 0538-××-1427」\n（如有疑问，请联系：とおみ站）');
    S.f.sawNum = true;
    if (S.f.dengon) await S.think('一四二七……\n传言板上说，电话要「倒着拨」。');
  }
  async function dengonOn(S) {
    if (S.once('dengon1')) await S.narr('检票口边上立着一块传言板。\n不知道多少年没人擦过了，粉笔字一层压着一层。');
    await S.note('dengon');
    S.f.dengon = true;
  }
  async function vendOn(S) {
    if (S.f.gotCoin) return S.narr('售货机的按钮一排红灯，全是「売切」。\n——卖完了。每一样都卖完了。');
    S.f.gotCoin = true; S.give('coin');
    await S.narr('自动售货机亮着冷冷的光。一排按钮全都亮着红色的「売切」。\n你习惯性地摸了摸退币口——');
    await S.narr('指尖碰到一枚硬币。十元。\n冰凉冰凉的，边上沾着一点干掉的泥。');
  }
  async function phoneOn(S) {
    if (S.f.called) return S.narr('听筒里只剩下「嘟——」的长音。\n那个声音，再也没有打来过。');
    await S.narr('绿色的公用电话。听筒拿起来，里面有「嘟——」的拨号音。\n……它是通的。');
    if (!S.has('coin')) { await S.think('身上没有零钱……\n手机里的电子钱包在这儿可用不了。'); S.goal('找一枚硬币（打公用电话）'); return; }
    const r = await S.ask('投进十元硬币，拨号吗？', ['拨号', '先别']);
    if (r) return;
    S.sfx('ding');
    const v = await S.keypad('拨号（后四位）', ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'], 4);
    if (v == null) { await S.narr('你挂上了听筒。硬币「当啷」一声退了出来。'); return; }
    S.sfx('phone'); await S.wait(900);
    if (v === '7241') return callOK(S);
    if (v === '1427') {
      S.f.wrong1427 = (S.f.wrong1427 || 0) + 1;
      await S.narr('嘟……嘟……\n接通了。');
      S.sfx('thud'); await S.wait(500); S.sfx('thud'); await S.wait(500); S.sfx('bell');
      await S.narr('听筒里没有人说话。\n只有很远很远的太鼓声，一下，一下，和铃铛。');
      await S.say('听筒', '……みや……へ……おいで……\n（……到「宫」……来呀……）', { style: 'whisper' });
      S.fx('glitch'); S.sfx('sting');
      await S.narr('你「啪」地挂断了电话。硬币退了出来，烫得像刚从火里拿出来。');
      if (S.f.dengon) await S.think('……不对。\n传言板上说过：这边的东西都是反过来的。');
      else await S.think('这个号码……通向的不是「外面」。\n这个车站里，也许还有别人留下的线索。');
      return;
    }
    await S.narr('「您拨打的号码……」\n录音的女声说到一半，变成了一串听不懂的杂音。\n硬币退了出来。');
    if (!S.f.sawNum) await S.think('乱拨是没用的。\n站台上……总该有个能联系的号码吧。');
  }
  async function callOK(S) {
    S.take('coin'); S.f.called = true;
    await S.narr('嘟……嘟……嘟……\n「咔」的一声，接通了。');
    await S.say('听筒', '……はい、とおみ駅……（……喂，这里是とおみ站……）\n这么晚了，是哪位？');
    await S.say('葵', '我、我在一个叫「きさらぎ」的车站……末班车停在这儿，我下来了，周围什么都没有——');
    await S.say('听筒', '……きさらぎ？\n这条线上没有这个站啊。你是不是……');
    S.fx('static'); S.sfx('tv');
    await S.say('听筒', '……ザザ……往……来的方向……走……\n……隧道……出来……往山下……\n……白色的……灯……ザ……', { style: 'whisper' });
    await S.say('听筒', '……谁的车……都别……ザザザ——', { style: 'whisper' });
    await S.narr('电话断了。');
    await S.think('「往来的方向走」……\n来的方向，是「かたす」。');
    S.goal('沿铁轨往「かたす」方向（左边）走');
    S.cp();
  }
  async function gateOn(S) {
    if (S.f.field) return S.narr('检票口外面是一片草原。\n你已经走过一次了。不管往哪边走，最后都会回到这里。');
    await S.narr('无人的检票机。闸门开着，红灯一闪一闪。\n检票口外面……没有站前广场，没有路，什么都没有。\n只有一片黑沉沉的草原，一直铺到看不见的地方。');
    const r = await S.ask('走出检票口吗？', ['出去看看', '算了']);
    if (r) return;
    S.f.field = true;
    await S.fade(1, 600);
    S.amb('wind');
    await S.narr('你穿过闸门，踩进了齐膝深的草里。\n草是湿的。空气里有一股泥土和烧过的稻草的味道。');
    await S.narr('走了大概十分钟。四周一点光都没有。\n回头看，车站的灯已经变成很小的一个点。');
    await S.narr('你又走了十分钟。\n前面，亮起了一点白光。是房子？');
    S.sfx('sting');
    await S.narr('……是检票口。\n你从外面，又走回了如月站的检票口。');
    S.amb('otherworld');
    await S.fade(0, 600);
    await S.think('出不去。\n这个车站……是从外面走不出去的。');
  }
  async function leftEnd(S) {
    const back = () => S.walk('pl', [2, Math.min(7, Math.max(4, S.pl.y))], 5);
    if (!S.f.sawSign) { await S.think('先弄清楚这是哪儿……\n站名牌就在站台中间。'); return back(); }
    if (!S.f.called) {
      await S.narr('站台在这里到了头。铁轨往黑暗里延伸出去，看不见尽头。');
      await S.think('往哪边走……完全没有头绪。\n得先想办法联系上外面的人。');
      return back();
    }
    if (S.once('ring')) {
      S.sfx('phone'); S.focus(2, 4); S.bubble('phoneS', '!', 1500);
      await S.narr('身后，公用电话响了。\n叮铃铃——叮铃铃——');
      const r = await S.ask('没有人知道这个号码。可它在响。', ['回去接电话', '不接，走']);
      if (r === 0) {
        await S.walk('pl', [2, 5], 6); S.turn(3);
        await S.narr('你拿起了听筒。');
        await S.say('听筒', '……葵？是葵吗？');
        await S.think('是妈妈的声音。');
        await S.say('妈妈', ['你在哪儿？这么晚了还不回来……', '你就站在那儿别动。妈妈去接你。', '……别动哦。千万别动。妈妈马上就到。']);
        S.sfx('whisper');
        await S.narr('听筒里，太鼓声越来越近。\n妈妈的声音还在说话，可是——\n可是你从来没把这个车站的名字告诉过她。');
        await S.scare('face', { spr: '@mother', dur: .9 });
        await S.narr('你把听筒扔了出去。它挂在线上晃来晃去，里面还在说：\n「别动哦……」');
        S.f.momCall = true;
      } else await S.narr('你没有回头。\n铃声响了很久很久，在你身后，一直响。');
      S.focus(null);
    }
    S.f.phase = 'walk';
    await S.narr('你跳下站台，踩着碎石，往「かたす」的方向走去。');
    await S.go('tracks', 48, 4, 1);
  }
  async function rightEnd(S) {
    const back = () => S.walk('pl', [21, Math.min(7, Math.max(4, S.pl.y))], 5);
    if (!S.f.sawSign) { await S.think('先弄清楚这是哪儿……'); return back(); }
    await S.narr('站台的另一头。铁轨往「やみ」的方向延伸，没入一片比夜还黑的黑暗。\n很远的地方，好像有铃铛在响。');
    const r = await S.ask('往「やみ」的方向走吗？', ['往前走', '回去']);
    if (r) return back();
    await S.narr('你沿着铁轨往前走了几步。\n铃声近了。黑暗里亮起了一点、两点……一串红色的灯笼，正朝这边飘过来。');
    await S.scare('face', { spr: '@suzu', dur: 1 });
    await S.narr('你连滚带爬地逃回了站台。\n心脏跳得快要从嗓子里蹦出来。');
    await S.think('やみ……倒过来念，是「みや」。\n铃声和灯笼，都是往「宫」那边去的。\n……那边不是给活人走的路。');
    S.f.yami = true;
    return back();
  }
  /* ================= 铁轨 ================= */
  const PRC = [['pr0', '@lant'], ['pr1', '@drummer'], ['pr2', '@suzu'], ['pr3', '@drummer'], ['pr4', '@lant'], ['pr5', '@oni']];
  const ONI_CHASE = () => ({ spd: 2.8, zone: (x, y) => y === 6, catch: railCaught });
  function procReset(S) {
    PRC.forEach(([id], i) => { S.stop(id); S.place(id, 2 - i * 2, 6, 2); const e = S.ent(id); e.alpha = 1; e.hidden = false; });
  }
  async function oldMan(S) {
    S.f.phase = 'walk2';
    const p = S.pl, ox = Math.min(47, p.x + 5);
    S.sfx('thud'); await S.wait(300);
    await S.say('？？？', '危ないから、線路の上を歩くな！\n（危险！别走在铁轨上！）', { style: 'big' });
    S.place('oldman', ox, 4, 1); S.ent('oldman').alpha = 1;
    S.turn(2); S.bubble('pl', '!', 1000);
    await S.narr('你猛地回头。\n十来米外的小路上，站着一个老爷爷。');
    S.focus(ox, 4);
    await S.narr('他拄着一根木棍，身子歪向一边。\n一条裤管空荡荡地垂着——他只有一条腿。');
    await S.say('葵', '那、那个……请问，这里是——');
    S.sfx('whisper'); await S.alpha('oldman', 0, 900);
    await S.narr('一阵风吹过草丛。\n小路上，什么人都没有了。');
    S.focus(null); S.turn(1);
    await post(S, 'p3', '你的手指抖得按不准按键，还是把刚才的事发了上去。', 4);
    S.goal('沿小路往左走（别走在铁轨上）');
  }
  async function procStart(S) {
    S.f.phase = 'proc'; S.f.hid = false;
    S.hidePlayer(false); S.dark(null); S.plr(null); S.amb('night');
    procReset(S); S.stop('oniS'); S.hide('oniS');
    S.ent('hut').open = false; S.ent('kusa').open = false;
    S.cp('proc');
    S.sfx('thud'); S.shake(300, 2); await S.wait(380); S.sfx('thud'); S.shake(300, 2); await S.wait(380); S.sfx('bell');
    S.focus(5, 5);
    await S.narr('咚——！\n太鼓声一下子近了。\n前面的隧道口里，亮起了一串红灯笼。');
    S.focus(null);
    await S.think('它们是循着光来的……\n得躲起来！');
    S.goal('躲起来！（保线小屋 / 草丛）');
    S.timer(14, '太鼓逼近', procCaught);
  }
  async function procCaught(S) {
    if (S.f.hid) return;
    await S.scare('face', { spr: '@oni' });
    await S.die('太鼓声停在了你身后。\n灯笼的光把你的影子拉得很长、很长——\n然后，影子被一只手拽进了队伍里。', '你被队伍带走了');
  }
  async function hideIn(S, id) {
    if (S.f.phase !== 'proc' || S.f.hid) {
      if (id === 'hut') return S.narr(S.f.phase === 'proc' ? '……' : '铁皮顶的保线小屋，门上挂着生锈的挂锁——锁是开着的。\n门板上用油漆写着：「保線詰所」。\n门楣上一只小灯泡，昏昏地亮着。');
      return S.narr('一人多高的枯草，风一吹，沙沙作响。\n草丛深处黑得什么都看不见。');
    }
    S.f.hid = true; S.clearTimer();
    const e = S.ent(id); e.open = true; S.sfx(id === 'hut' ? 'open' : 'step');
    S.hidePlayer(true);
    await S.narr(id === 'hut' ? '你拉开保线小屋的门钻了进去，背靠着门板蹲下。\n屋里有一股机油和霉味。' : '你一头扎进比人还高的枯草丛里，趴在冰凉的泥地上。');
    S.sfx('thud');
    const r = await S.ask('手机屏幕还亮着。蓝白色的光，从指缝里漏了出来。', ['长按电源键，熄灭屏幕', '发帖：「它们来了」']);
    if (r === 1) {
      S.sfx('blip'); bat(S, 2);
      await S.narr('你飞快地按着按键——「它们来了」。发送。');
      S.sfx('thud'); await S.wait(500);
      await S.narr('屏幕的光，在黑暗里亮得像一盏灯。\n……太鼓声，停了。');
      await S.scare('face', { spr: '@oni', dur: 1 });
      return S.die('一张红色的脸，贴在缝隙外面，正往里看。\n帖子上那一句「它们来了」，是你发出的最后一条。', '屏幕的光');
    }
    if (id === 'hut') e.open = false;
    S.amb('none');
    await S.narr('屏幕黑了。\n你屏住呼吸。只能听。');
    await procPass(S, e);
  }
  async function procPass(S, spot) {
    const sx = Math.round(spot.px / TS), g = GEN;
    S.focus(sx, 5); S.dark(.93);
    for (const [id] of PRC) S.show(id);
    let going = true;
    (async () => { let i = 0; try { while (going && g === GEN) { S.sfx(i % 3 === 2 ? 'bell' : 'thud'); if (i % 3 === 0) S.shake(150, 1); i++; await S.wait(520); } } catch (e) { } })();
    const tasks = PRC.map(([id], i) => (async () => {
      await S.wait(i * 260);
      const e = S.ent(id), x0 = Math.round(e.px / TS);
      if (id === 'pr5') {
        await S.walk(id, 'r'.repeat(Math.max(0, sx - x0)), 4);
        going = false;
        S.face(id, 3); S.bubble(id, '…', 2600);
        S.sfx('whisper');
        await S.narr('……咚。\n太鼓声远了。可是有一个脚步声，停在了外面。');
        S.sfx('heart'); await S.wait(500); S.sfx('heart');
        await S.narr('很近。隔着一层薄薄的东西，有什么在闻。\n吸气——呼气——带着一股烧过的线香味。');
        await S.wait(700);
        S.sfx('bell');
        await S.narr('叮铃。\n它转过身，跟着队伍走远了。');
        await S.walk(id, 'r'.repeat(Math.max(0, 40 - sx)), 4.5);
      } else await S.walk(id, 'r'.repeat(Math.max(0, 40 - x0)), 4);
      await S.alpha(id, 0, 500);
    })());
    await Promise.all(tasks);
    going = false;
    S.focus(null); S.dark(null); S.amb('night');
    S.hidePlayer(false); spot.open = false;
    S.pos(sx, 4, 1);
    await S.narr('过了很久，很久。\n四周只剩下风声。你从藏身的地方爬了出来，膝盖软得站不住。');
    S.f.phase = 'rails';
    S.place('oniS', 6, 6, 2); S.ent('oniS').alpha = 1;
    S.focus(6, 6); S.sfx('sting');
    await S.narr('……队伍的最后面，还有一个没有走。\n它站在铁轨正中间，红色的面具，朝着你。');
    S.focus(null);
    await S.think('它站在铁轨上。……只在铁轨上。\n「别走在铁轨上」——');
    S.goal('从小路进隧道（离铁轨远一点！）');
    S.cp('rails');
    S.chase('oniS', ONI_CHASE());
  }
  async function railCaught(S) {
    await S.scare('face', { spr: '@oni' });
    await S.die('你的脚刚一靠近铁轨，一只冰凉的手就扣住了你的脚踝。\n老爷爷喊过的——不要走在铁轨上。', '你走上了铁轨');
  }
  async function toTunnel(S) {
    if (S.f.phase !== 'rails') { await S.think('隧道里黑漆漆的……\n远处的太鼓声，好像就是从那里面传出来的。'); S.pos(4, S.pl.y, 1); return; }
    S.stop('oniS'); S.hide('oniS');
    S.f.phase = 'tunnel';
    await S.go('tunnel', 32, 2, 1);
  }

  /* ================= 隧道 ================= */
  const TUN_LINES = [
    '',
    '……眼前，又是那块铭牌。\n「伊佐貫」。\n你明明一直在往前走。',
    '又是「伊佐貫」。\n墙上，多了几个黑乎乎的手印。\n刚才……有这些吗？',
    '里程标上的数字全变成了「4」。\n四。\n你不敢再往下想。'
  ];
  async function tunExit(S) {
    if (!S.f.tunBad) {
      S.f.tunOK = true;
      await S.narr('前方，黑暗的尽头透进来一点灰蓝色。\n是风。是外面的风。');
      return S.go('yama', 27, 4, 0);
    }
    S.f.loops = (S.f.loops || 0) + 1; S.f.trav = (S.f.trav || 0) + 1; S.f.tunBad = false;
    bat(S, 2);
    await S.go('tunnel', 32, 2, 1);
    const n = Math.min(3, S.f.loops);
    for (let i = 0; i < 6; i++) S.show('hp' + i, i < (n - 1) * 3);
    if (n >= 3) for (const k of ['km0', 'km1', 'km2']) S.ent(k).num = 4;
    S.sfx('sting');
    await S.narr(TUN_LINES[n]);
    if (S.f.loops === 1) await S.think('……是哪里做错了？\n帖子里说：隧道里别回头。老爷爷说：别走在铁轨上。');
    S.goal('穿过隧道（别回头，别踩铁轨）');
  }
  async function tunVoice(S) {
    S.f.voiceT = S.f.trav || 0;
    S.sfx('step'); await S.wait(350); S.sfx('step'); await S.wait(350); S.sfx('step');
    await S.narr('身后……有脚步声。\n和你的步子一样快。你停下，它也停下。');
    await S.say('？？？', '葵——', { style: 'whisper' });
    await S.narr(S.f.momCall ? '是妈妈的声音。\n和电话里的那个声音一模一样。' : '是妈妈的声音。\n……妈妈怎么会在这里？');
    const r = await S.ask('有人在身后叫你的名字。', ['回头看看', '不回头，继续往前走']);
    if (r === 0) {
      S.f.tunBad = true; S.turn(2);
      await S.scare('face', { spr: '@mother', dur: .8 });
      S.turn(1);
      await S.narr('你回头了。\n身后什么也没有。只有入口那一点灰色，远得像在另一个世界。');
      return;
    }
    await S.narr('你咬紧牙，盯着前面的黑暗，一步一步往前走。\n脚步声跟了一阵，停了。');
  }

  /* ================= 山路 ================= */
  async function carEvent(S) {
    S.f.carEv = true;
    const p = S.pl; if (p.y !== 4) S.pos(p.x, 4, 1);
    const cx = Math.max(2, S.pl.x - 4);
    S.sfx('car');
    await S.narr('山路前方的拐弯处，亮起了两盏车灯。\n引擎声，越来越近。');
    S.place('car', -3, 5, 2); S.ent('car').alpha = 1;
    await S.walk('car', 'r'.repeat(cx + 3), 6);
    S.sfx('brake'); S.shake(300, 1);
    await S.narr('一辆白色的轿车，在你身边停了下来。\n车窗摇下来一半。');
    S.place('drv', cx + 2, 4, 2); S.ent('drv').alpha = 0; await S.alpha('drv', 1, 500);
    S.face('drv', 'pl'); S.face('pl', 'drv');
    await S.say('男人', ['哎呀，这么晚了，一个人？', '这一带晚上可没有车。车站在山那边，我送你过去吧。']);
    await S.narr('是个戴眼镜的中年男人。他笑眯眯的，嗓音很温和。\n……温和得有点过头了。');
    let r = await S.ask('「上车吧。」', ['……谢谢您。（上车）', '不用了，我自己走。', '「车站在哪个方向？」']);
    if (r === 2) {
      await S.say('男人', '山那边呀。');
      await S.narr('他抬手指了指——指向黑黢黢的山里。\n可电话里说的是「往山下」。');
      r = await S.ask('「走路要走到天亮的。上车吧。」', ['……那就麻烦您了。（上车）', '不用了，我自己走。']);
    }
    if (r === 0) return badEnd(S);
    await S.say('葵', '不、不用了。我自己走就好。');
    await S.wait(600);
    await S.say('男人', '……是吗。');
    await S.narr('他还在笑。嘴角一动不动，像是贴上去的。');
    await S.say('男人', S.f.momCall ? ['可是，是你妈妈拜托我来接你的呀。', '她说，让你站在那儿，别动。'] : '可是，我就是专门来接你的呀。');
    S.sfx('heart');
    const r2 = await S.ask('男人拉开了后座的车门。', ['……上车', '「不用了！」（往后退）']);
    if (r2 === 0) return badEnd(S);
    S.sfx('whisper');
    await S.narr('你往后退了一步。\n男人看着你，看了很久很久。\n车灯「啪」地灭了。');
    await S.alpha('drv', 0, 700);
    await S.narr('车灯再亮起来的时候，路边已经没有人了。\n驾驶座上坐着一个黑影。车子慢慢地开动，开进了你刚刚走出来的那条隧道。');
    await S.walk('car', 'r'.repeat(Math.max(0, 26 - (cx + 3))), 5);
    await S.alpha('car', 0, 600);
    S.f.carDone = true;
    await S.think('……「迎えに来る人についていくな」。\n传言板上，是这么写的。');
    S.goal('在展望所看清方向');
    S.cp();
  }
  async function badEnd(S) {
    await S.narr('你拉开车门，坐进了后座。\n车里很暖和，飘着一股线香的味道。');
    S.hide('drv');
    await S.fade(1, 900);
    S.amb('car');
    await S.narr('车开起来了。\n可是它没有往山下开。它掉了个头，往山里开。');
    await S.say('葵', '那个……车站，是这边吗？');
    await S.narr('男人没有回答。\n后视镜里，他的眼睛一直看着你。一眨也不眨。');
    S.sfx('thud'); await S.wait(500); S.sfx('bell');
    await S.narr('窗外的树越来越密。远处，太鼓声又响了起来。\n越来越近。');
    S.f.bat = 1;
    await S.narr('手机电量：1%。\n你用发抖的手指，敲下了最后一条。');
    S.sfx('blip');
    await S.say('（帖子）', '……车一直往山里开，越开越深。司机一句话也不说。\n电量快没了。等找到机会，我就——');
    await S.narr('屏幕黑了。');
    return S.end({ bad: true, title: '帖子停在了这一句', text: '那天晚上，几十个人守在电脑前，一遍一遍地按刷新。\n\n「主播？」\n「还在吗？」\n「回个话啊」\n\n帖子再也没有更新。\n直到今天，还有人会把它翻出来，在最后一楼后面留一句：\n「……你回来了吗？」' });
  }
  async function viewOn(S) {
    if (S.f.lightOK) return S.narr('山脚下，那一点白光还在原地亮着。\n它一整夜都没有动过。');
    await S.narr('护栏边上钉着一块小木牌：「展望所」。\n从这里往下看，整片山谷黑得像一口井。');
    if (!S.f.carDone) return;
    await S.narr('黑暗里，有三处光。');
    const r = await S.ask('该往哪一处光走？', ['山腰上一晃一晃的红灯笼', '山下公路上，两盏亮着的车灯', '山脚下一点也不动的、发白的灯']);
    if (r === 0) { S.sfx('bell'); await S.narr('你盯着那串灯笼。\n它们在林子里一晃一晃，慢慢往山顶去——\n……铃声。是那支队伍。'); await S.think('一晃一晃的光，别跟。'); return; }
    if (r === 1) { S.sfx('sting'); await S.narr('山下的公路上停着一辆车，车灯亮着，朝着你。\n……那辆车明明开进了身后的隧道。它是怎么跑到山下去的？'); await S.think('它在等你。'); return; }
    S.f.lightOK = true; S.sfx('chime');
    await S.narr('山脚下，有一点白色的光。\n不晃，不动，冷冷的，是荧光灯的颜色。\n灯下面，好像还有一小截站台。');
    await S.think('……车站。\n「往山下」「白色的灯」——电话里说的，就是那里。');
    S.goal('从护栏缺口下山，往白色的灯走');
  }
  async function descend(S) {
    if (S.f.lightOK && S.f.carDone) { if (S.once('down')) await S.narr('护栏的缺口外面，一条踩出来的小路，弯弯曲曲地往山下去。'); return; }
    await S.narr('护栏的缺口外面有一条往下的小路。\n可下面黑得什么都看不清……');
    await S.think(S.f.carDone ? '先在展望所看清楚方向。' : '……还是先沿着山路走走看。');
    S.pos(S.pl.x, 5, 3);
  }
  async function finale(S) {
    S.f.phase = 'end';
    await S.narr('白色的光，是一盏荧光灯。\n它挂在一座小小的木头站房檐下，灯管嗡嗡地响。');
    S.ent('ekidoor').open = true; S.sfx('open');
    S.place('ekiin', 1, 10, 0); S.ent('ekiin').alpha = 0; await S.alpha('ekiin', 1, 500);
    S.face('ekiin', 'pl'); S.face('pl', 'ekiin');
    await S.say('站务员', ['哎？……这个点儿，怎么会有人从山上下来？', '……你该不会，就是刚才那个打电话的人吧？']);
    const r = await S.ask('站务员上下打量着你。', ['我是从「きさらぎ站」走过来的……', '……我也说不清自己是从哪儿来的。']);
    await S.say('站务员', r === 0 ? ['きさらぎ……', '我在这条线上干了三十年，从来没听说过这个站。'] : '……是吗。');
    await S.say('站务员', ['不过啊，干这行久了，偶尔也会碰上那么一两个——半夜里从铁轨那头走过来的人。', '他们都说，自己在一个没听说过的站下了车。', '……能自己走到这儿的，不多。']);
    await S.say('站务员', ['进来暖和暖和吧。首班车五点四十二分。', '放心，那是「这边」的车。']);
    await S.fade(1, 1000);
    S.amb('room');
    await S.card('清晨五点四十二分', 'とおみ站', '天边泛起了鱼肚白。\n首班车进站的时候，站务员在站台上朝你挥了挥手。\n\n车厢里坐着几个打瞌睡的高中生，和上早班的大叔。\n他们打着呵欠，揉着眼睛——\n睁开的眼睛，是活人的眼睛。');
    S.f.bat = 2;
    S.sfx('blip');
    await S.say('（帖子）', '……回来了。坐上了有人的车。\n谢谢大家。真的，谢谢。');
    await S.narr('按下发送的那一瞬间，手机屏幕黑了。\n电量耗尽。帖子停在了这一句。');
    await S.narr('后来你才知道，那天晚上帖子里的人，一直守到了天亮。');
    await S.card('很多年以后', '', '');
    await S.note('later');
    await S.end({ title: '第一夜　完', text: '如月站的帖子后来被一遍遍转载，越传越远。\n有人说那是编的，有人说那是真的，\n也有人说，自己也在某个没听说过的车站下过车。\n\n你从来没有在网上说过，那个实况的人就是你。\n\n只是从那以后，坐末班车的时候，\n你再也没有睡着过。' });
  }
  /* ================= 地图数据 ================= */
  const row = (w, f) => Array.from({ length: w }, (_, x) => f(x)).join('');
  const TRK_W = 50;
  const TRACKS_ROWS = [
    row(TRK_W, x => x < 4 ? '#' : 'N'),
    row(TRK_W, x => x < 4 ? '#' : 'N'),
    row(TRK_W, x => x < 4 ? '#' : (x % 5 === 2 || x % 7 === 0) ? 'P' : 'T'),
    row(TRK_W, x => x < 4 ? '#' : [9, 15, 26, 35, 41].includes(x) ? 'B' : '"'),
    row(TRK_W, x => x < 3 ? 'H' : 'd'),
    row(TRK_W, x => x < 3 ? 'H' : 'G'),
    row(TRK_W, x => x < 3 ? 'H' : 'Y'),
    row(TRK_W, x => x < 3 ? 'H' : 'G'),
    row(TRK_W, x => x < 4 ? '#' : '"'),
    row(TRK_W, x => x < 4 ? '#' : (x % 3 === 0 ? '"' : 'e')),
    row(TRK_W, x => x < 4 ? '#' : (x % 4 === 1 ? 'P' : 'T'))
  ];
  const YM_W = 30;
  const forest = (x, y) => { const h = hash(x, y, 404); return h < .45 ? 'P' : h < .8 ? 'T' : '"'; };
  const YAMA_ROWS = [
    row(YM_W, () => 'N'),
    row(YM_W, () => 'N'),
    row(YM_W, x => x >= 23 ? 'K' : (x % 6 === 2 ? 'P' : 'T')),
    row(YM_W, x => x >= 23 ? 'K' : [6, 16].includes(x) ? 'B' : '"'),
    row(YM_W, () => ':'),
    row(YM_W, () => ':'),
    row(YM_W, x => x === 3 || x === 4 ? 'd' : 'L'),
    row(YM_W, x => x < 3 ? '#' : x === 3 || x === 4 ? 'd' : forest(x, 7)),
    row(YM_W, x => x < 3 ? '#' : x === 3 ? 'd' : forest(x, 8)),
    row(YM_W, x => x < 3 ? '#' : x === 3 ? 'd' : x === 4 ? '"' : forest(x, 9)),
    row(YM_W, x => x < 9 ? 'x' : forest(x, 10)),
    row(YM_W, x => x < 9 ? 'x' : forest(x, 11)),
    row(YM_W, x => x < 9 ? 'E' : forest(x, 12)),
    row(YM_W, () => 'Y')
  ];
  const TRAIN_PAX = { salary: [3, 2, 0], obaa: [9, 2, 0], youth: [14, 2, 0], student: [22, 2, 0], woman: [11, 5, 3], drunk: [20, 5, 1] };

  defChapter({
    id: 'kisaragi', n: 1, title: '如月车站', sub: '末班车二十多分钟没有停站。车门打开时，站名牌上写着：きさらぎ。', origin: '日本 2ch 网络怪谈', color: '#14453a',
    icon: '@aoiIcon', amb: 'otherworld', floor: 'concrete', wall: 'concrete', dark: .82, plr: 2.8, darkC: '#020807',
    people: PEOPLE_K, tiles: TILES_K, sprites: SPR_K, items: ITEMS_K, notes: NOTES_K,
    legend: '「如月车站」（きさらぎ駅）是日本网络怪谈的代表作。2004年1月8日深夜，日本最大的匿名论坛 2ch 的超自然板块里，一位女性发帖人开始「实况」：她说自己坐上了静冈县某私铁的电车，平时几分钟一站的线路，这趟车却二十多分钟没有停站，车上的乘客全都睡着了。车终于停在一个叫「きさらぎ」的无人车站，站名牌上，上一站写着「かたす」，下一站写着「やみ」。\n\n帖子里的网友一边帮她查地图，一边出主意。她沿着铁轨往回走，听见远处传来太鼓和铃铛的声音；身后有人大喊「别走在铁轨上」，回头一看是个只有一条腿的老人，转眼就不见了；她穿过一条叫「伊佐貫」的隧道，隧道另一头有个陌生男人说要开车送她去车站。她上了车，说车一直往山里开、司机一言不发，说等有机会就逃——之后，帖子再也没有更新。\n\n因为全程是「实时」发生在网友眼前的，这个故事格外有真实感，后来被不断转载、考据和续写：有人把「かたす」联想到神话里的「根之堅州国」，把「やみ」读作「闇」；据说多年以后，网上出现过自称当事人、说自己在异界待了七年才回来的文章；「やみ站」「月之宫站」「ひつか站」等各种「异界车站」的帖子也一个个冒了出来。它还被改编成小说、漫画，2022年拍成了电影。至于当年的发帖人是谁、发生了什么，至今没有任何可以证实的说法。\n\n（本章中的主角葵、车上的乘客、传言板、とおみ站和它的站务员、公用电话与「倒着拨」的号码、隧道里的规矩、山脚下的白灯，以及好结局，均为游戏虚构。）',
    start: { map: 'train', x: 12, y: 4, dir: 3 },
    resume: {
      proc: async S => { await procStart(S); },
      rails: async S => {
        for (const [id] of PRC) S.hide(id);
        S.hidePlayer(false); S.dark(null); S.amb('night'); S.f.phase = 'rails';
        S.place('oniS', 6, 6, 2); S.ent('oniS').alpha = 1;
        S.chase('oniS', ONI_CHASE());
      }
    },
    async intro(S) {
      TRV = 0; S.f.bat = BAT0;
      await S.card('第一夜　如月车站', '2004年1月8日　深夜　日本静冈县', '加班到十一点。\n葵坐上了回家的私铁末班车。\n\n这条线她坐了整整三年，\n闭着眼睛都知道，下一站是哪儿。');
    },
    thumb(g, w, h) {
      g.fillStyle = '#9aa49e'; g.fillRect(0, h - 15, w, 2); g.fillRect(0, h - 9, w, 2);
      g.fillStyle = '#1e201e'; g.fillRect(8, 14, 62, 30); g.fillRect(14, 44, 3, 24); g.fillRect(61, 44, 3, 24);
      g.fillStyle = '#e8e8de'; g.fillRect(10, 16, 58, 26);
      g.fillStyle = '#2a7a4a'; g.fillRect(10, 34, 58, 1);
      g.font = `bold 13px ${FONT}`; g.fillStyle = '#141414'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('きさらぎ', 39, 25);
      g.font = `bold 7px ${FONT}`; g.fillText('かたす　　やみ', 39, 38);
      const gr = g.createRadialGradient(39, 28, 4, 39, 28, 50); gr.addColorStop(0, 'rgba(190,255,225,.18)'); gr.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = gr; g.fillRect(0, 0, w, h);
    },
    maps: {
      /* ---------------- 末班车车厢 ---------------- */
      train: {
        amb: 'bus', dark: .5, plr: 2.6, wall: 'bus', wallC: { face: '#3a5a52', trim: '#1a2a26' }, darkC: '#030a08',
        legend: { Q: 'trfloor' },
        rows: [
          '##########################',
          '##########################',
          '#QQQQQQQQQQQQQQQQQQQQQQQQ#',
          '#QQQQQQQQQQQQQQQQQQQQQQQQ#',
          '#QQQQQQQQQQQQQQQQQQQQQQQQ#',
          '#QQQQQQQQQQQQQQQQQQQQQQQQ#',
          '##########################'],
        ents: [
          ...[1, 2, 3, 4, 8, 9, 10, 11, 12, 13, 14, 15, 16, 20, 21, 22, 23, 24].map(x => ({ x, y: 2, spr: 'lseat', decal: true, solid: false })),
          ...Array.from({ length: 24 }, (_, i) => ({ x: i + 1, y: 5, spr: 'lseat', decal: true, solid: false, bot: true })),
          { id: 'door1', x: 6, y: 1, spr: 'trdoor', on: S => S.narr(S.f.arrived ? '车门开着。外面是站台。' : '车门关得死死的。\n门上的玻璃外面……只有黑。黑得像车窗上刷了一层漆。') },
          { id: 'door2', x: 18, y: 1, spr: 'trdoor', on: S => S.narr(S.f.arrived ? '车门开着。冷风一阵一阵往里灌。' : '你把脸贴在门玻璃上，用手挡住车厢里的光。\n外面什么都没有。没有灯，没有房子，连山的影子都看不见。') },
          { x: 1, y: 1, spr: 'door', col: '#5c6662', on: S => S.narr('通往后一节车厢的贯通门。\n门上的小窗外，后一节车厢黑漆漆的，一个人也没有，连灯都没开。\n门推不开。') },
          { id: 'cab', x: 24, y: 1, spr: 'cabdoor', async on(S) {
            if (S.f.c_cab) return S.narr('驾驶室的帘子还是拉得严严实实的。\n速度表的绿光，在帘子缝里一跳一跳。');
            S.sfx('knock'); await S.wait(300); S.sfx('knock');
            await S.narr('你敲了敲驾驶室的门。\n「不好意思……请问下一站是哪里？」');
            await S.wait(600);
            await S.narr('没有人回答。\n门上的小窗拉着帘子，帘子缝里透出一点绿光——是速度表。指针稳稳地停在八十。');
            await S.think('……驾驶座上，有人吗？');
            return trainClue(S, 'c_cab');
          } },
          { id: 'rmap', x: 10, y: 1, spr: 'rmap', async on(S) {
            await S.narr('车门上方贴着线路图。\n浜町—中之桥—稲里……每一站之间，都标着「4分」「5分」。');
            await S.narr('最后一个停的站，是中之桥。\n从那里开出来，已经过去二十三分钟了。');
            return trainClue(S, 'c_map');
          } },
          { x: 14, y: 1, spr: 'ad', on: S => S.narr('车厢里的旅游广告：\n「春の旅、出雲へ。——神々の国で、待っています。」\n（春天的旅行，去出云吧。——在众神之国，等你。）') },
          ...[3, 12, 21].map(x => ({ id: 'win' + x, x, y: 1, spr: 'invisible', solid: true, async on(S) {
            await S.narr('车窗外漆黑一片。\n没有路灯，没有人家，没有道口的警示灯。\n玻璃上只映着车厢，和你自己发白的脸。');
            if (x === 12) await S.narr('……还有你身后，那排睡着的人。\n倒影里，他们好像都朝着你这边。');
            return trainClue(S, 'c_win');
          } })),
          { id: 'salary', x: 3, y: 2, oy: -3, spr: '@salary', dir: 0, on: S => pax(S, 'salary', ['西装大叔歪着脑袋睡着，领带松松地挂着。', '你推了推他的肩膀：「不好意思……」\n没有反应。他的胸口一起一伏，慢得不像人在呼吸。']) },
          { id: 'obaa', x: 9, y: 2, oy: -3, spr: '@obaa', dir: 0, on: S => pax(S, 'obaa', '老奶奶怀里抱着一个包袱，嘴唇一张一合。\n你凑近了听——她在数数。\n「……四十一、四十二、四十三……」') },
          { id: 'youth', x: 14, y: 2, oy: -3, spr: '@youth', dir: 0, on: S => pax(S, 'youth', '戴耳机的年轻人，脑袋一点一点的。\n耳机里漏出来的不是音乐。\n是……太鼓？咚、咚、咚。') },
          { id: 'student', x: 22, y: 2, oy: -3, spr: '@student', dir: 0, on: S => pax(S, 'student', '穿立领校服的学生，书包上挂着一枚褪了色的御守。\n你叫了他两声。他睡得那么沉，像是永远不会醒了。') },
          { id: 'woman', x: 11, y: 5, oy: -1, spr: '@woman', dir: 3, async on(S) {
            await pax(S, 'woman', '穿大衣的女人背对着你，额头抵着车窗睡着了。');
            if (S.once('womanEye')) { S.sfx('sting'); S.shake(200, 1); await S.narr('车窗玻璃里，映着她的脸。\n……倒影里的那双眼睛，是睁着的。'); }
          } },
          { id: 'drunk', x: 20, y: 5, oy: -1, spr: '@drunk', dir: 1, on: S => pax(S, 'drunk', ['满身酒气的大叔，歪在座位上嘟嘟囔囔。', '「……这趟车啊……坐过头了……\n就……回不来喽……嘿嘿……」']) },
          { x: 16, y: 5, spr: 'newspaper', decal: true, z: 1, on: S => S.narr('座位上落着一份晚报，皱巴巴的。\n日期印的是「二月」。……今天明明是一月八号。') },
          { id: 'tl1', x: 4, y: 3, light: { r: 4.6, col: 'rgba(200,255,232,.11)' } },
          { id: 'tl2', x: 10, y: 3, light: { r: 4.6, col: 'rgba(200,255,232,.11)' } },
          { id: 'tl3', x: 16, y: 3, light: { r: 4.6, col: 'rgba(200,255,232,.11)' } },
          { id: 'tl4', x: 22, y: 3, light: { r: 4.6, col: 'rgba(200,255,232,.11)' } }
        ],
        async enter(S, first) {
          if (!first) return;
          S.give('phone', true); S.give('pass', true);
          await S.narr('咣当、咣当……\n末班车的车厢里，荧光灯白得发青。');
          await S.think('……怎么还没到站？');
          await S.narr('你看了一眼手机：23:31，电量 ' + batT(S) + '。\n从上一站开出来，已经二十多分钟了。这条线，平时每站只要四五分钟。');
          await post(S, 'p1', '你打开常逛的论坛，在超自然板块开了个帖子。', 3);
          S.goal('四处看看（乘客 / 车窗 / 线路图 / 驾驶室）');
        },
        tick(S, dt) { if (!W.busy && !S.f.arrived && Math.random() < dt * .1) S.shake(200, 1); }
      },
      /* ---------------- 如月站 ---------------- */
      station: {
        amb: 'otherworld', dark: .86, plr: 2.6, wall: 'concrete', floor: 'concrete',
        legend: { N: 'nsky', E: 'pedge', Y: 'rails', G: 'ballast' },
        tileOpts: { grassC: '#1a2c24', treeC: '#0c1a14', fenceBase: 'grass' },
        rows: [
          row(24, () => 'N'), row(24, () => 'N'),
          row(24, x => [2, 6, 7, 16, 20].includes(x) ? 'T' : '"'),
          row(24, x => x === 16 ? 'x' : 'f'),
          row(24, () => 'x'), row(24, () => 'x'), row(24, () => 'x'), row(24, () => 'x'),
          row(24, () => 'E'), row(24, () => 'Y'), row(24, () => 'G'), row(24, () => 'e')],
        ents: [
          { id: 'train', x: 5, y: 9, w: 10, spr: 'train', open: true, light: { r: 5, dx: 80, dy: -6, col: 'rgba(200,255,232,.12)' } },
          { id: 'phoneS', x: 2, y: 4, spr: 'payphone', on: phoneOn },
          { id: 'jikoku', x: 4, y: 4, spr: 'jikoku', on: jikokuOn },
          { id: 'lampA', x: 6, y: 4, spr: 'klamp', light: { r: 4, dy: -16, col: 'rgba(190,255,225,.14)' }, on: S => S.narr('站台的荧光灯。灯管一头已经发黑了，嗡嗡地响。\n几只白蛾子绕着它打转——一月份，哪儿来的蛾子？') },
          { id: 'ekimei', x: 9, y: 5, w: 3, spr: 'ekimei', on: signOn },
          { id: 'clockS', x: 13, y: 4, spr: 'hclock', on: S => S.narr('站台上的挂钟。\n表盘干干净净的——上面没有指针。') },
          { id: 'dengon', x: 15, y: 3, spr: 'dengon', on: dengonOn },
          { id: 'gate', x: 16, y: 3, spr: 'kgate', on: gateOn },
          { x: 18, y: 4, w: 2, spr: 'bench', on: S => S.narr('长椅冰凉，椅面上落着一层细细的灰。\n灰上有一个人坐过的印子。印子还是温的。') },
          { id: 'vend', x: 21, y: 4, spr: 'vending', col: '#2a6a5a', light: { r: 2.2, col: 'rgba(190,240,255,.12)' }, on: vendOn },
          { id: 'lampB', x: 19, y: 7, spr: 'klamp', light: { r: 3.6, dy: -16, col: 'rgba(190,255,225,.12)' }, on: S => S.narr('这盏灯一闪一闪的。\n每暗下去一次，站台尽头的黑暗就好像往这边挪近了一点。') },
          ...[4, 5, 6, 7, 8, 9, 10].map(y => ({ x: 0, y, spr: 'invisible', solid: false, touch: leftEnd })),
          ...[4, 5, 6, 7, 8, 9, 10].map(y => ({ x: 23, y, spr: 'invisible', solid: false, touch: rightEnd }))
        ],
        async enter(S, first) {
          if (!first) return;
          S.ent('train').open = false; S.sfx('close');
          await S.narr('你刚踏上站台，身后的车门就「噗嘶」一声关上了。');
          S.sfx('car');
          await S.walk('train', 'r'.repeat(18), 7);
          S.hide('train');
          await S.narr('电车开走了。尾灯一闪，就被黑暗吞了进去。\n连铁轨的声音都没有留下。');
          await S.think('……这里是哪儿？');
          S.goal('看看这是哪一站（站名牌）');
        },
        tick(S, dt) {
          DRT -= dt;
          if (DRT <= 0) { const l = S.ent('lampB'); if (l) { l.off = !l.off; DRT = l.off ? .25 + Math.random() * .4 : 1.2 + Math.random() * 2; } }
        }
      },
      /* ---------------- 铁轨 ---------------- */
      tracks: {
        amb: 'night', dark: .86, plr: 2.7, wall: 'stone', floor: 'dirt',
        legend: { N: 'nsky', Y: 'rails', G: 'ballast', H: 'black' },
        tileOpts: { grassC: '#18281e', treeC: '#0b1810' },
        rows: TRACKS_ROWS,
        ents: [
          { id: 'tplate', x: 1, y: 3, spr: 'tplate', text: '伊佐貫', on: S => S.narr('隧道口上方嵌着一块石头铭牌，字被雨水冲得发黑：\n「伊佐貫」。\n……这三个字，你从来没在任何地图上见过。') },
          ...[4, 5, 6, 7].map(y => ({ x: 0, y, spr: 'invisible', solid: false, touch: toTunnel })),
          ...[4, 5, 6, 7].map(y => ({ x: 49, y, spr: 'invisible', solid: false, async touch(S) { await S.think('……不能回去。\n那个车站，从外面是走不出去的。'); S.pos(47, S.pl.y, 1); } })),
          { x: 44, y: 3, spr: 'kmpost', num: 3, on: S => S.narr('铁轨边歪着一根里程标。\n上面的数字是「3」，可是从哪儿算起的三公里，没写。') },
          { x: 12, y: 3, spr: 'statue', on: S => S.narr('路边一尊小小的地藏，脑袋不见了。\n脚边供着一个冻得硬邦邦的饭团。\n……是谁供的？这附近根本没有人家。') },
          { id: 'hut', x: 22, y: 3, spr: 'hut', light: { r: 2.2, dy: -6, col: 'rgba(255,200,120,.10)' }, on: S => hideIn(S, 'hut') },
          { id: 'kusa', x: 30, y: 3, spr: 'kusa', solid: true, on: S => hideIn(S, 'kusa') },
          { id: 'oldman', x: 40, y: 4, spr: '@oldman', hidden: true },
          ...PRC.map(([id, spr], i) => ({ id, x: 2 - i * 2, y: 6, spr, dir: 2, hidden: true, solid: false, light: spr === '@lant' ? { r: 2.8, col: 'rgba(255,90,50,.22)', flick: true } : spr === '@suzu' ? { r: 1.6, col: 'rgba(255,200,120,.12)' } : null })),
          { id: 'oniS', x: 6, y: 6, spr: '@oni', dir: 2, hidden: true, solid: false, light: { r: 1.6, col: 'rgba(255,60,40,.16)' } }
        ],
        async enter(S, first) {
          if (!first) return;
          S.f.phase = 'walk';
          await S.narr('碎石在脚底下咯吱咯吱地响。\n两条铁轨在黑暗里闪着一点冷光，一直伸进看不见的地方。');
          S.sfx('thud'); await S.wait(500); S.sfx('thud'); await S.wait(500); S.sfx('bell');
          await S.narr('……远处，有什么声音。\n咚、咚。叮铃。\n是太鼓，和铃铛。像谁家在办祭典。');
          await S.think('这个时间，这种地方……哪儿来的祭典？');
          S.goal('沿着铁轨，往「かたす」方向（左边）走');
          S.cp();
        },
        step(S, x, y) {
          if (S.f.phase === 'walk' && x <= 38) return oldMan(S);
          if (S.f.phase === 'walk2' && x <= 29) return procStart(S);
        },
        tick(S, dt) {
          if (W.busy) return;
          TRV -= dt;
          if (TRV <= 0 && ['walk', 'walk2', 'rails'].includes(S.f.phase)) { TRV = 2.6 + Math.random() * 2.2; S.sfx(Math.random() < .3 ? 'bell' : 'thud'); }
          if (S.f.phase === 'proc' && !S.f.hid) PRC.forEach(([id], i) => { const e = S.ent(id); if (e && !e.mv && Math.round(e.px / TS) < 15 - i * 2) startMove(e, 2, .75); });
          const g = S.ent('oniS'), p = S.pl;
          if (g && g.chase && !g.hidden && !g.mv && (p.y < 5 || p.y > 7)) {
            const gx = Math.round(g.px / TS);
            if (gx !== p.x && gx >= 4 && gx <= 47) { g.chase.wait = .3; const d = gx < p.x ? 2 : 1; if ((d === 1 && gx > 4) || (d === 2 && gx < 47)) startMove(g, d, 2.2); }
            else g.dir = p.y < 6 ? 3 : 0;
          }
        }
      },
      /* ---------------- 伊佐貫隧道 ---------------- */
      tunnel: {
        amb: 'drone', dark: .93, plr: 2.4, wall: 'stone', floor: 'stone', darkC: '#010202',
        legend: { Y: 'rails', G: 'ballast' },
        rows: [
          row(34, () => '#'), row(34, () => '#'),
          row(34, () => 'k'), row(34, () => 'G'), row(34, () => 'Y'), row(34, () => 'G'),
          row(34, () => '#')],
        ents: [
          ...[4, 12, 20, 28].map((x, i) => ({ id: 'tl' + i, x, y: 1, spr: 'tlamp', off: i === 2, light: { r: 2.6, dy: 6, col: 'rgba(255,150,60,.15)' }, on: S => S.narr(i === 2 ? '这盏灯坏了。灯罩里积满了死掉的虫子。' : '隧道墙上的小灯，昏黄昏黄的，只照得亮脚下一小圈。') })),
          ...[8, 16, 24].map((x, i) => ({ id: 'km' + i, x, y: 1, spr: 'kmpost', num: 7 - i, on: S => S.narr('墙上钉着里程标：「' + S.ent('km' + i).num + '」。') })),
          ...[6, 10, 14, 19, 23, 27].map((x, i) => ({ id: 'hp' + i, x, y: 1, spr: 'handprint', hidden: true, col: 'rgba(20,16,14,.85)', oy: (i % 3) * 2 })),
          { id: 'tplate2', x: 30, y: 1, spr: 'tplate', text: '伊佐貫', on: S => S.narr('「伊佐貫」。\n隧道入口内侧，也嵌着一块一模一样的铭牌。') },
          ...[2, 3, 4, 5].map(y => ({ x: 0, y, spr: 'invisible', solid: false, touch: tunExit })),
          ...[2, 3, 4, 5].map(y => ({ x: 33, y, spr: 'invisible', solid: false, async touch(S) { S.f.tunBad = true; await S.narr('你转身想往回走——\n身后的洞口不见了。只剩下黑。'); S.pos(31, S.pl.y, 1); } }))
        ],
        async enter(S, first) {
          S.goal('穿过隧道（别回头，别踩铁轨）');
          if (!first) return;
          S.f.trav = 0; S.f.tunBad = false;
          await S.narr('隧道里比外面还要冷。\n水珠从头顶的拱上滴下来，滴答，滴答。');
          await S.think('「进去以后千万别回头」……\n「别走在铁轨上」……');
          S.cp();
        },
        step(S, x, y) {
          if (y >= 3 && !S.f.tunBad) S.f.tunBad = true;
          if (x <= 17 && S.f.voiceT !== (S.f.trav || 0)) return tunVoice(S);
        },
        tick(S, dt) { if (!W.busy && S.pl.dir === 2) S.f.tunBad = true; }
      },
      /* ---------------- 隧道另一头的山路 ---------------- */
      yama: {
        amb: 'wind', dark: .9, plr: 2.5, wall: 'wood', floor: 'asphalt', wallC: { face: '#5a4836', trim: '#2a2018' },
        legend: { N: 'nsky', Y: 'rails', E: 'pedge' },
        tileOpts: { grassC: '#18281e', treeC: '#0b1810' },
        rows: YAMA_ROWS,
        ents: [
          { x: 27, y: 3, spr: 'portal', on: S => S.narr('伊佐貫隧道的出口。\n黑洞洞的，像一张张开的嘴。你不想再回头看它。') },
          { id: 'car', x: -3, y: 5, w: 2, spr: 'car', col: '#d8d8d0', hidden: true, light: { r: 3.6, dx: 36, dy: 8, col: 'rgba(255,244,210,.18)' } },
          { id: 'drv', x: 0, y: 4, spr: '@driver', hidden: true, on: S => S.say('男人', '上车吧。') },
          { id: 'view', x: 12, y: 6, spr: 'kanban', on: viewOn },
          { x: 3, y: 6, spr: 'invisible', solid: false, touch: descend },
          { x: 4, y: 6, spr: 'invisible', solid: false, touch: descend },
          { x: 20, y: 3, spr: 'busstop', on: S => S.narr('一块锈得看不清字的公交站牌。\n时刻表那一栏，一班车都没有。') },
          { id: 'ekidoor', x: 1, y: 9, spr: 'door', col: '#6a5034', on: S => S.narr('站务室的门。门上贴着手写的告示：「终电已过。首班　5:42」') },
          { x: 0, y: 9, spr: 'window', lit: true, light: { r: 1.8, col: 'rgba(255,240,200,.10)' }, on: S => S.narr('站务室的窗户亮着灯。窗台上摆着一个热水瓶，和一盆小小的仙人掌。') },
          { x: 2, y: 9, spr: 'window', lit: true, light: { r: 1.8, col: 'rgba(255,240,200,.10)' }, on: S => S.narr('窗户里，一台小电视开着，正在放深夜的天气预报。\n……是这边的天气预报。') },
          { id: 'lampE', x: 4, y: 10, spr: 'klamp', light: { r: 4.8, dy: -16, col: 'rgba(225,245,255,.16)' }, on: S => S.narr('白色的荧光灯。灯管嗡嗡地响。\n它一整夜都待在这里，哪儿也没去。') },
          { id: 'ekimei2', x: 5, y: 11, w: 3, spr: 'ekimei', text: 'とおみ', s: { prev: 'いなさと', next: 'はまぐち' }, on: S => S.narr('站名牌：「とおみ」。\n上一站「いなさと」，下一站「はまぐち」。\n……都是你听说过的地名。') },
          { id: 'ekiin', x: 1, y: 10, spr: '@ekiin', hidden: true, on: S => S.say('站务员', '进来坐吧，外头冷。') }
        ],
        async enter(S, first) {
          if (!first) return;
          await S.narr('你走出了隧道。\n山风扑在脸上，冷得生疼——可这是风。是外面的风。');
          await post(S, 'p4', '手机震了一下。信号格跳出来一格。你把这边的情况发了上去。', 4);
          S.goal('沿着山路往左走');
          S.cp();
        },
        step(S, x, y) {
          if (!S.f.carEv && x <= 20 && y <= 5) return carEvent(S);
          if (y >= 10 && S.f.phase !== 'end') return finale(S);
        }
      }
    }
  });
})();
