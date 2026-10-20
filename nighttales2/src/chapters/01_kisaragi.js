/* ================= 第一夜 · 如月车站 ================= */
(() => {
  /* ---------- 小工具 ---------- */
  const L = (w, fill, marks) => { const a = Array(w).fill(fill); for (const [x, s] of (marks || [])) for (let i = 0; i < s.length; i++) a[x + i] = s[i]; return a.join(''); };
  const FONT = '"Noto Sans CJK JP","Hiragino Sans","Yu Gothic","Noto Sans CJK SC","Microsoft YaHei",sans-serif';
  /* 在精灵里写字：借 R 拿到当前绘制偏移（R 内部调用 g.fillRect(x,y,…)） */
  function txt(g, R, s, a, b, px, col, flip) {
    let X = 0, Y = 0; g.fillRect = (x, y) => { X = x; Y = y; }; R(a, b, 1, 1, '#000'); delete g.fillRect;
    g.save(); g.font = `bold ${px}px ${FONT}`; g.fillStyle = col; g.textAlign = 'center'; g.textBaseline = 'middle';
    g.translate(X, Y); if (flip) g.scale(-1, 1); g.fillText(s, 0, 0); g.restore();
  }
  const BAT0 = 38;
  function bat(S, n) { S.f.bat = Math.max(2, (S.f.bat ?? BAT0) - n); S.toast('手机电量 ' + S.f.bat + '%'); }
  const batT = S => (S.f.bat ?? BAT0) + '%';
  async function post(S, id, lead, cost) {
    if (lead) await S.narr(lead);
    S.sfx('blip'); bat(S, cost ?? 3);
    await S.note(id);
  }
  const PROC = ['p1', 'p2', 'p3', 'p4'];
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
/*@@PART2@@*/
})();
