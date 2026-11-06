/* ================= 第十六夜 · 哈默林的捕鼠人 ================= */
(() => {
  const bg = p => { if (p && p.catch) p.catch(() => { }); return p; };

  /* ---------------- 曲子：数字 = 柳笛上松开几个孔（1 最低，5 最高） ---------------- */
  const TUNE = [3, 5, 2, 4, 1];
  const REV = TUNE.slice().reverse();                 // 1 4 2 5 3
  const FREQ = [0, 523, 587, 659, 784, 880];
  const NCOL = ['', '#7ab0e0', '#8ad0a0', '#e8d070', '#f0a050', '#e86a6a'];
  const T_HILL = 40, T_BACK = 52, T_PAID = 10;         // 秒：山上 / 回城 / 清了账多给的（真人速度实测见 reviews/pied.md）
  const KIDN = 26;                                    // 每个小人代表二十来个孩子（五队 × 26 = 130）

  function pipeNote(S, n, d, v = 1, delay = 0) { const f = FREQ[n]; S.tone('triangle', f, f * 1.006, d, .07 * v, delay, 3200); S.tone('sine', f * 2, f * 2.012, d * .8, .016 * v, delay + .01, 5000); }
  function piperTune(S, v = 1, sp = 1) { TUNE.forEach((n, i) => pipeNote(S, n, .34 / sp, v, i * .37 / sp)); }
  function willow(S, seq, v = 1) { seq.forEach((n, i) => { const f = FREQ[n]; S.tone('square', f, f, .3, .02 * v, i * .4, 1700); S.tone('triangle', f, f * .994, .34, .05 * v, i * .4, 2400); }); }
  function hum(S, n, v = 1) { const f = FREQ[n] / 2; S.tone('sine', f, f, 1.5, .07 * v, 0, 900); S.tone('sine', f * 1.013, f * 1.013, 1.5, .05 * v, .05, 900); S.tone('triangle', f * 2, f * 2, 1, .014 * v, .1, 1500); }
  function ratTune(S, v = 1) { [311, 294, 330, 277, 311, 262].forEach((f, i) => { S.tone('sawtooth', f, f * .96, .19, .028 * v, i * .19, 1100); S.tone('square', f * 4, f * 4.4, .05, .01 * v, i * .19 + .09, 5000); }); }
  function bell(S, v = 1, delay = 0) { S.tone('sine', 392, 389, 2.2, .09 * v, delay, 2200); S.tone('sine', 790, 780, 1.4, .035 * v, delay, 3000); S.tone('sine', 467, 464, 1.7, .025 * v, delay, 2000); S.tone('triangle', 196, 195, 2.4, .05 * v, delay, 800); }
  function chant(S, v = 1) { [[147, 220], [165, 247], [147, 220], [131, 196]].forEach(([a, b], i) => { S.tone('sine', a, a, 1.25, .028 * v, i * 1.15, 700); S.tone('sine', b, b, 1.25, .018 * v, i * 1.15, 700); }); }
  function rumble(S, v = 1) { S.tone('sawtooth', 44, 34, 2.2, .07 * v, 0, 220); S.tone('sine', 31, 26, 2.4, .18 * v, 0, 0); }

  /* ---------------- 巷子 ---------------- */
  const LCOL = [4, 9, 14];
  const BTOP = [29, 21, 13, 5];                       // 第 k 段巷子占 BTOP[k]..BTOP[k]+4 行（k=0 离广场最近）
  const LN = [[3, 1, 5], [2, 4, 5], [3, 4, 5], [2, 3, 1]];
  const LNAME = [['马市巷', '铜匠巷', '面包街'], ['织工巷', '屠夫巷', '皮匠巷'], ['酿酒巷', '新市街', '修道院巷'], ['骑士街', '绳匠巷', '东城根小巷']];
  const LFLAV = [
    ['马市巷：一块马蹄铁形的招牌。地上还有前天集市留下的干草。', '铜匠巷：招牌是一口小铜锅。平时这里叮叮当当一整天，今天一声也没有。', '面包街：招牌是个金黄的大面包圈。烤炉是凉的——面包师也去望弥撒了。'],
    ['织工巷：招牌上挂着一只木梭子。二楼的窗口晾着一匹没染的麻布。', '屠夫巷：招牌是一把铁砍刀。石缝里的血水早就冲干净了，苍蝇还在。', '皮匠巷：招牌是一张撑开的皮子。一股鞣皮的酸味。爹常来这里买皮料。'],
    ['酿酒巷：招牌是一只橡木桶。门口摆着为今晚篝火准备的一排酒桶。', '新市街：门楣上刻着建街的年份。窗台上摆着一盆盆圣约翰草，黄花开得正好。', '修道院巷：墙头露出修道院的十字架。修士们这会儿正在唱经。'],
    ['骑士街：一面褪了色的盾牌挂在门上。这条街住的都是有马的人家。', '绳匠巷：招牌是一盘粗麻绳。巷子又长又直，绳匠们在这里搓绳子。', '东城根小巷：没有招牌。巷子窄得两个人得侧着身子才能错开，一直通到东门。']
  ];
  const LANES = [];
  BTOP.forEach((top, k) => LCOL.forEach((x, i) => LANES.push({ k, i, x, top, n: LN[k][i], name: LNAME[k][i], ok: LN[k][i] === TUNE[k + 1], id: 'l_hum' + k + i })));
  const RIVER = { k: 1, river: true, x: 0, y: 27, name: '鱼门巷' };
  const mouthAt = (x, y) => LANES.find(L => L.x === x && (y === L.top + 5 || y === L.top - 1)) || (x === 1 && y === 27 ? RIVER : null);
  const commitAt = (x, y) => LANES.find(L => L.x === x && y === L.top + 2) || (x === 0 && y === 27 ? RIVER : null);
  const okLane = k => LANES.find(L => L.k === k && L.ok);
  function laneRows() {
    const rows = [];
    for (let y = 0; y < 38; y++) {
      let r = '';
      for (let x = 0; x < 19; x++) {
        let c;
        if (y === 0) c = x === 9 ? 'L' : 'M';
        else if (y === 1) c = x === 9 ? 'L' : 'N';
        else if (y === 37) c = x === 9 ? 'L' : 'R';
        else {
          const k = BTOP.findIndex(t => y >= t && y <= t + 4);
          if (k >= 0) c = LCOL.includes(x) ? 'L' : (y === BTOP[k] + 4 ? 'F' : 'R');
          else c = (x === 0 || x === 18) ? 'R' : ',';
        }
        if (y === 27 && x === 0) c = 'L';
        r += c;
      }
      rows.push(r);
    }
    return rows;
  }

  /* ---------------- 山坡：孩子们走的路（从东门 → 山缝） ---------------- */
  const HPATH = [];
  [[10, 19, 10, 15], [11, 15, 15, 15], [15, 14, 15, 11], [14, 11, 7, 11], [7, 10, 7, 7], [8, 7, 12, 7], [12, 6, 12, 3]].forEach(([x0, y0, x1, y1]) => {
    const dx = Math.sign(x1 - x0), dy = Math.sign(y1 - y0); let x = x0, y = y0;
    for (; ;) { HPATH.push([x, y]); if (x === x1 && y === y1) break; x += dx; y += dy; }
  });
  const HKIDS = ['h_k5', 'h_k4', 'h_k3', 'h_k2', 'h_k1', 'h_li'];   // 队头 → 队尾（莉泽尔最后）
  const HGAP = 1.15, HV = .44;
  const H_END = HPATH.length - 1 + (HKIDS.length - 1) * HGAP + .6;  // 队尾走进山缝时的队头位置
  const TBASE = ['li', 'k1', 'k2', 'k3', 'k4', 'k5', 'gr'];         // 回城时的队伍：莉泽尔拉着你，格蕾特殿后

  /* 一排人沿路径摆好（s = p - i*gap；走进路尽头的就消失） */
  function placeLine(S, ids, path, p, gap = 1, walking = true) {
    const L = path.length;
    ids.forEach((id, i) => {
      const e = S.ent(id); if (!e) return;
      const s = p - i * gap;
      if (s < 0 || s > L - .5) { e.hidden = true; return; }
      const a = Math.min(L - 1, Math.floor(s)), b = Math.min(L - 1, a + 1), k = s - a, A = path[a], B = path[b];
      e.hidden = false; e.alpha = clamp(L - .5 - s, .15, 1);
      e.px = (A[0] + (B[0] - A[0]) * k) * TS; e.py = (A[1] + (B[1] - A[1]) * k) * TS;
      e.x = Math.round(e.px / TS); e.y = Math.round(e.py / TS);
      if (B[0] !== A[0] || B[1] !== A[1]) e.dir = B[0] > A[0] ? 2 : B[0] < A[0] ? 1 : B[1] > A[1] ? 0 : 3;
      e.fr = walking ? [1, 0, 3, 0][Math.floor(s * 4) % 4] : 0;
    });
  }
  let MARCH = null;
  async function march(S, ids, path, from, to, spd = 2, gap = 1) {
    let p = from; MARCH = { ids, path, p, gap };
    try { while (p < to) { p = Math.min(to, p + spd * .05); MARCH.p = p; placeLine(S, ids, path, p, gap); await S.wait(50); } }
    finally { MARCH = null; }
  }
  /* 回城的队伍：孩子们踩着你走过的格子跟在后面 */
  function trailTick(S, dt, pre) {
    const f = S.f; if (!f.trail || !f.tb) return;
    const p = W.pl, last = f.trail[f.trail.length - 1];
    if (!last || last[0] !== p.x || last[1] !== p.y) { f.trail.push([p.x, p.y]); if (f.trail.length > 24) f.trail.shift(); }
    const n = f.trail.length;
    f.tb.forEach((b, k) => {
      const e = S.ent(pre + b); if (!e || e.hidden) return;
      const c = f.trail[Math.max(0, n - 2 - k)], tx = c[0] * TS, ty = c[1] * TS, dx = tx - e.px, dy = ty - e.py, d = Math.abs(dx) + Math.abs(dy);
      if (d > TS * 5) { e.px = tx; e.py = ty; }
      else if (d > .5) {
        const st = TS * 4.8 * dt;
        if (Math.abs(dx) >= Math.abs(dy)) { e.px += Math.sign(dx) * Math.min(Math.abs(dx), st); e.dir = dx > 0 ? 2 : 1; }
        else { e.py += Math.sign(dy) * Math.min(Math.abs(dy), st); e.dir = dy > 0 ? 0 : 3; }
        e.walked = (e.walked || 0) + st; e.fr = [1, 0, 3, 0][Math.floor(e.walked / 8) % 4];
      } else { e.px = tx; e.py = ty; }
      e.x = Math.round(e.px / TS); e.y = Math.round(e.py / TS);
    });
  }
  function trailPlace(S, pre, cells) {   // cells：从队尾到你脚下
    const f = S.f; f.trail = cells.map(c => c.slice());
    const n = f.trail.length;
    TBASE.forEach(b => { const e = S.ent(pre + b); if (e) e.hidden = true; });
    f.tb.forEach((b, k) => { const c = f.trail[Math.max(0, n - 2 - k)]; S.place(pre + b, c[0], c[1], 0); const e = S.ent(pre + b); e.alpha = 1; e.solid = false; e.follow = false; });
  }

  /* ---------------- 人物 ---------------- */
  const wreath = (a, b) => (g, d, fr, G, R) => { const h = G.hT - 1; R(4, h, 8, 1, '#4a7a3a'); if (d !== 3) { R(4, h, 1, 1, a); R(7, h, 1, 1, b); R(10, h, 1, 1, a); R(5, h - 1, 1, 1, b); R(9, h - 1, 1, 1, a); } else { R(5, h, 1, 1, b); R(9, h, 1, 1, a); } };
  const kid = (key, o, a, b) => Object.assign({ key, child: true, skin: '#f2cfae', shoes: '#4a3424', extra: wreath(a, b) }, o);
  function piperX(g, d, fr, G, R) {
    const c = ['#d8302a', '#e8c040', '#3a8a4a', '#2a5aa8'];
    if (d === 0 || d === 3) { for (let y = 0; y < 4; y++) for (let x = 0; x < 3; x++) R(4 + x * 3 - (y % 2), G.tT + 1 + y * 2, 2, 2, c[(x + y + (d === 3 ? 1 : 0)) % 4]); }
    else for (let y = 0; y < 4; y++) R(5 + (y % 2), G.tT + 1 + y * 2, 3, 2, c[y % 4]);
    R(2, G.hT - 1, 12, 2, '#a8141c'); R(4, G.hT - 3, 8, 2, '#c81e24'); R(5, G.hT - 4, 6, 1, '#c81e24');
    if (d !== 3) { R(11, G.hT - 6, 1, 3, '#f0e8d0'); R(12, G.hT - 7, 1, 2, '#f0e8d0'); }
    if (d === 0) { R(7, G.hT + 6, 2, 1, '#2a0808'); R(8, G.hT + 7, 1, 6, '#c8b080'); R(7, G.hT + 9, 1, 1, '#3a2a1a'); R(7, G.hT + 11, 1, 1, '#3a2a1a'); }
    else if (d === 1) { R(1, G.hT + 6, 4, 1, '#c8b080'); R(0, G.hT + 7, 3, 1, '#c8b080'); }
  }
  function crutch(g, d, fr, G, R) {
    if (d === 0) { R(13, G.tT + 1, 1, G.lB - G.tT + 1, '#8a6a3a'); R(12, G.tT, 3, 1, '#6a4a2a'); }
    else if (d === 3) { R(2, G.tT + 1, 1, G.lB - G.tT + 1, '#8a6a3a'); R(1, G.tT, 3, 1, '#6a4a2a'); }
    else { R(3, G.tT + 1, 1, G.lB - G.tT + 1, '#8a6a3a'); R(2, G.tT, 3, 1, '#6a4a2a'); }
  }
  function slateX(g, d, fr, G, R) { if (d === 0) { R(4, G.tT + 1, 8, 5, '#2e3236'); R(4, G.tT + 1, 8, 1, '#6a5a42'); R(5, G.tT + 3, 3, 1, '#e8e8e0'); R(9, G.tT + 4, 2, 1, '#e8e8e0'); } else if (d === 1) R(3, G.tT + 2, 2, 5, '#2e3236'); }

  /* ---------------- 剧情小工具 ---------------- */
  const goalLane = S => {
    const b = S.f.band;
    if (b >= 4) return '出东门（北边的城门），追上山去';
    return `第 ${b + 2} 个音松开几个孔？（石板在「笺」里）走墙在哼它的巷子`;
  };
  function lightAll(S) {
    const m = S.map, ph = S.f.ph;
    if (m === 'square') S.dark(ph === 'done' ? .12 : .26);
  }

  defChapter({
    id: 'pied', n: 16, title: '哈默林的捕鼠人', sub: '一二八四年，圣约翰与保罗日。穿花衣的人吹着笛子走过街道，孩子们一个接一个跟了上去。', origin: '德国下萨克森 · 哈默林传说', color: '#6a3a1e',
    icon: '@piper', iconX: 30, amb: 'wind', floor: 'stone', wall: 'stone', dark: .3, plr: 3.4,
    endings: { home: '回家', debt: '清账', silent: '无鼓巷', mountain: '走进山里' },
    people: {
      me: { key: 'pd-me', child: true, skin: '#f0c8a0', hair: '#5a3a22', hs: 'messy', top: '#7a6a48', top2: '#5a4a32', bottom: '#4a3a2a', shoes: '#3a2a1a', extra: crutch },
      liesel: kid('pd-li', { hair: '#e0bc68', hs: 'twin', top: '#b83a3a', top2: '#e8e0c8', dress: true, blush: '#f0a0a0' }, '#f0e060', '#ffffff'),
      grete: { key: 'pd-gr', child: true, skin: '#eecaa8', hair: '#8a3e22', hs: 'long', top: '#4a5a6a', top2: '#c8c0b0', bottom: '#3a3a44', skirt: true, shoes: '#2a2420', extra: slateX },
      k1: kid('pd-k1', { hair: '#3a2a1a', hs: 'short', top: '#4a6a8a', bottom: '#3a3020' }, '#ffffff', '#f0d040'),
      k2: kid('pd-k2', { hair: '#c89048', hs: 'bun', top: '#6a8a4a', dress: true }, '#f080a0', '#ffffff'),
      k3: kid('pd-k3', { hair: '#2a1a12', hs: 'messy', top: '#8a5a3a', bottom: '#2a2a3a' }, '#f0d040', '#e8a0e0'),
      k4: kid('pd-k4', { hair: '#d8c080', hs: 'bob', top: '#a86a9a', dress: true }, '#ffffff', '#f0d040'),
      k5: kid('pd-k5', { hair: '#5a3a22', hs: 'short', top: '#9a8a5a', bottom: '#4a3a2a' }, '#e86a6a', '#ffffff'),
      hans2: { key: 'pd-hans2', child: true, skin: '#f2cfae', hair: '#c8a060', hs: 'messy', top: '#3a5a8a', top2: '#c8a050', bottom: '#5a4a3a', coat: true, shoes: '#4a3424' },
      hans: { key: 'pd-hans', child: true, skin: '#f2cfae', hair: '#c8a060', hs: 'messy', top: '#e8e4d8', top2: '#d0ccc0', bottom: '#5a4a3a', shoes: '#4a3424' },
      piper: { key: 'pd-piper', skin: '#e6d8c4', hair: '#1a1410', hs: 'long', top: '#c8302a', top2: '#e8c040', bottom: '#3a6a3a', shoes: '#4a2a1a', coat: true, eye: '#0a0606', extra: piperX },
      clerk: { key: 'pd-clerk', skin: '#e0b898', hair: '#d8d8d0', hs: 'bald', top: '#3a3048', top2: '#d8d0c0', robe: true, shoes: '#2a2020',
        extra(g, d, fr, G, R) { if (d === 0) { R(4, G.hT + 7, 8, 2, '#d8d8d0'); R(12, G.tT + 4, 2, 2, '#e8e0c8'); } } },
      barbel: { key: 'pd-bb', skin: '#f0c8a8', hair: '#b06a32', hs: 'bun', top: '#6a3a4a', top2: '#e8e0d0', bottom: '#5a3a3a', skirt: true, apron: '#e8e0d0', shoes: '#3a2a20' },
      mom: { key: 'pd-mom', skin: '#ecc4a0', hair: '#5a3a22', hs: 'bun', hat: 'scarf', hatC: '#e8e0d0', top: '#5a4a6a', top2: '#e8e0d0', bottom: '#4a3a4a', robe: true, apron: '#d8d0c0', shoes: '#2a2020' }
    },
    faces: {
      /* 红帽子底下的脸：帽檐的阴影里两点亮光，嘴角一点一点咧开，笛子斜在嘴边 */
      piper(R, a, t) {
        R(0, 0, 32, 32, '#0a0604');
        R(9, 9, 14, 21, '#d8cab4'); R(10, 28, 12, 3, '#c8baa4'); R(9, 9, 2, 18, '#b8aa94'); R(21, 9, 2, 18, '#b8aa94');
        R(2, 7, 28, 4, '#8a0e14'); R(6, 1, 20, 7, '#b8161e'); R(8, 0, 16, 2, '#c8222a'); R(6, 6, 20, 1, '#6a0a10');
        R(24, 0, 2, 5, '#f0e8d0'); R(26, 0, 2, 3, '#f0e8d0'); R(27, 3, 2, 2, '#e0d8c0');
        R(9, 11, 14, 5, '#3a2a22');
        const gl = .5 + .5 * Math.sin(t * 9); R(12, 13, 2, 1, `rgba(255,${200 + gl * 55},150,1)`); R(18, 13, 2, 1, `rgba(255,${200 + gl * 55},150,1)`);
        R(15, 16, 2, 5, '#c0b29c'); R(14, 20, 4, 1, '#a89a84');
        const w = 3 + Math.round(a * 5); R(16 - w, 23, w * 2, 1, '#3a0a0a'); R(16 - w, 22, 1, 1, '#3a0a0a'); R(15 + w, 22, 1, 1, '#3a0a0a'); if (a > .4) R(17 - w, 24, w * 2 - 2, 1, '#1a0404');
        for (let i = 0; i < 8; i++) R(19 + i, 24 + i, 2, 2, '#c8b080'); R(21, 26, 1, 1, '#2a1a10'); R(24, 29, 1, 1, '#2a1a10');
        const c = ['#d8302a', '#e8c040', '#3a8a4a', '#2a5aa8']; for (let i = 0; i < 8; i++) R(i * 4, 29, 4, 3, c[i % 4]);
      },
      /* 鱼门巷底下的河：一层一层的红眼睛 */
      rats(R, a, t) {
        R(0, 0, 32, 32, '#06100e');
        for (let i = 0; i < 6; i++) R(0, 4 + i * 5 + Math.round(Math.sin(t * 2 + i)), 32, 1, '#0e2622');
        const n = 6 + Math.round(a * 16);
        for (let i = 0; i < n; i++) {
          const x = (hash(i, 3, 16) * 28) | 0, y = 4 + ((hash(i, 5, 16) * 24) | 0) - Math.round(a * 3), s = hash(i, 7, 16) < .3 ? 2 : 1;
          R(x - 2, y - 1, 7, 3, '#1a1612'); R(x, y, s, s, '#ff2a1a'); R(x + 2 + s, y, s, s, '#ff2a1a'); R(x + 5, y + 1, 3, 1, '#3a2a22');
        }
        R(8, 20 + Math.round(4 - a * 4), 16, 10, '#2a221c'); R(11, 21 + Math.round(4 - a * 4), 3, 3, '#ff3020'); R(18, 21 + Math.round(4 - a * 4), 3, 3, '#ff3020');
        R(13, 26 + Math.round(4 - a * 4), 6, 2, '#e8e0d0'); R(14, 28, 1, 2, '#e8e0d0'); R(17, 28, 1, 2, '#e8e0d0');
      },
      /* 回过头来的莉泽尔：花环还戴着，眼睛只剩白的，嘴里在哼 */
      liesel(R, a, t) {
        R(0, 0, 32, 32, '#040302');
        R(5, 6, 4, 16, '#d8b060'); R(23, 6, 4, 16, '#d8b060'); R(6, 20, 2, 6, '#c8a050'); R(24, 20, 2, 6, '#c8a050');
        R(8, 5, 16, 20, '#e8dcd0'); R(9, 25, 14, 3, '#d8ccc0'); R(8, 4, 16, 4, '#e0bc68'); R(8, 8, 2, 4, '#e0bc68'); R(22, 8, 2, 4, '#e0bc68');
        R(7, 3, 18, 2, '#4a7a3a'); [[7, 2], [11, 1], [15, 2], [19, 1], [23, 2]].forEach(([x, y], i) => { R(x, y, 3, 3, i % 2 ? '#ffffff' : '#f0e060'); R(x + 1, y + 1, 1, 1, '#c8a020'); });
        const e = 2 + Math.round(a * 2); R(11, 13, 4, e, '#f8f8f4'); R(18, 13, 4, e, '#f8f8f4'); R(11, 13, 4, 1, '#8a7a70'); R(18, 13, 4, 1, '#8a7a70');
        const m = 1 + Math.round(a * 3); R(15, 20, 3, m, '#3a1010');
        R(8, 28, 16, 4, '#b83a3a'); R(14, 28, 4, 2, '#e8e0c8');
        for (let i = 0; i < 3; i++) { const y = 6 + ((t * 8 + i * 4) % 12); R(26 + (i % 2) * 2, 18 - y / 2, 2, 2, NCOL[(i * 2 + 1) % 5 + 1]); }
      }
    },
    items: {
      pipe: { name: '柳笛', desc: '春天你自己削的柳木笛，五个孔。松开一个孔最低，五个全松开最高。' },
      key: { name: '客房钥匙', desc: '金天鹅客栈楼上那间客房的钥匙，铁的，有你半个巴掌长。' },
      ledger: { name: '账簿上撕下的一页', desc: '老奥托从城里的账簿上撕下来的。墨迹还没干透：「约定的酬金，分文未付。哈默林欠他的。书记员奥托作证。」' }
    },
    notes: {
      decree: { title: '市政厅门口的告示', text: '（羊皮纸钉在木板上，边角被老鼠啃出了一排小牙印）\n\n哈默林市议会告全城：\n城中鼠患，咬噬粮仓、布匹与摇篮。\n凡能除尽城中老鼠者，议会必重重酬谢，\n决不食言。\n\n　　　　　　　　　　　　市长与全体议员\n\n（底下贴着一张新的小纸条，墨色还很新）\n\n鼠患已自行平息。前项悬赏，即日作废。' },
      contract: { title: '桌上的契约', text: '（一张折了四折的羊皮纸，盖着哈默林市议会的红蜡印）\n\n立约人：哈默林市议会，与一位不肯留下姓名的捕鼠人。\n\n捕鼠人以笛声引全城之鼠出城。\n鼠尽之日，议会即付约定酬金，\n不得拖欠，不得反悔。\n\n（纸背面，有人用很细的笔迹写着）\n\n他们说：老鼠是自己跳进河里的。\n他们说：一个吹笛子的，也配要这么多钱？\n\n好。\n约翰与保罗日，我再来收账。\n这一回，我收别的。' },
      rhyme: { title: '芭贝尔记下的歌', text: '（芭贝尔歪歪扭扭的字，写在一张账单的背面）\n\n那个花衣裳的人，每天夜里在屋里哼这支歌。我听了十几遍，记下来了。\n\n　五个孔，五个音，\n　一个不多，一个不少。\n　顺着吹，跟我走，\n　走过的街，记得我的调。\n　倒着吹，往回走，\n　从最后一声，吹回第一声，\n　走散的羊，各回各的家。\n\n（最后一句他总是哼得很轻，像是不想让人听见。）' },
      slate: { title: '格蕾特的石板', text: '（格蕾特听不见笛声。可她一直盯着他的手指——\n她用粉笔画了五支小笛子，每支五个孔。涂黑的是按住的，空着的是松开的）\n\n　第一支　●　●　○　○　○\n　第二支　○　○　○　○　○\n　第三支　●　●　●　○　○\n　第四支　（被莉泽尔的手蹭花了，看不清）\n　第五支　●　●　●　●　○\n\n（她在石板角上又画了一个小小的广场，在第一支笛子旁边打了个勾：\n第一个音，是他在广场上吹的。）\n\n松开一个孔最低，五个全松开最高。' }
    },
    legend: '哈默林（Hameln）是德国下萨克森州威悉河畔的一座小城。关于这件事，最早的说法并不是传说，而是一段语焉不详的记载：据说城里的市场教堂（圣尼古拉教堂）曾有一扇约1300年前后的彩色玻璃窗，画着一个穿花衣的吹笛人和一群穿白衣的孩子，这扇窗在17世纪毁掉了，只留下后人的描述；15世纪中叶的一部手抄本写道：1284年，约翰与保罗日，6月26日，一百三十个生在哈默林的孩子，被一个穿着各色衣服的吹笛人引走，在科彭山附近的刑场一带失踪。城里一份14世纪的记录据说还写过：「我们的孩子离开已经一百年了。」\n\n捕鼠的情节要到16世纪才出现在记载里，后来格林兄弟《德国传说集》（1816）和罗伯特·勃朗宁的长诗《哈默林的花衣吹笛人》（1842）让它家喻户晓：鼠患、悬赏、赖账、吹笛人在约翰与保罗日扮成猎人、戴着奇怪的红帽子回来。各个版本里留下来的孩子不太一样——格林版是一个瞎眼的（找不到路）和一个哑巴（说不出话），还有一个小男孩回家去拿外套，就这样躲过了；勃朗宁诗里是一个瘸腿的孩子，跟不上队伍；也有版本说是一个聋孩子，听不见笛声。孩子们去了哪里，另一种说法是：他们从很远的特兰西瓦尼亚（「七山之地」）的山洞里走了出来。\n\n历史学家提出过许多推测：东迁拓殖（13世纪大量年轻人被招募到东欧定居）、儿童十字军、瘟疫、舞蹈狂热、山崩或渡河时的意外，至今没有定论。哈默林至今有一条「邦格罗森街」（Bungelosenstraße，意思是「没有鼓声的街」），据说是孩子们最后走过的地方，街上不许奏乐跳舞，连路过的婚礼队伍也要停下乐器。\n\n（本章的马蒂亚斯、格蕾特、莉泽尔、书记员奥托、芭贝尔与金天鹅客栈，契约与告示的文字，巷子「记得」笛声、倒着吹就能把孩子们带回来的规则，以及所有结局，均为游戏虚构。「东城根小巷」就是游戏里的那条无鼓巷。）',
    start: { map: 'square', x: 24, y: 5, dir: 0 },
    async intro(S) {
      await S.card('第十六夜　哈默林的捕鼠人', '1284年6月26日　圣约翰与保罗日　哈默林', '一个月前，城里来了一个穿花衣裳的人。\n他吹着笛子走过大街小巷，\n老鼠们从墙缝里、地窖里涌出来，\n跟着他，一只不剩地走进了威悉河。\n\n议会答应过他的钱，一个子儿也没给。\n\n今天是圣约翰与保罗日。\n大人们一早都去教堂望弥撒了。');
    },
    resume: {
      lanes: async S => { lanesSetup(S); await S.think('（鱼门巷里飘出来的是老鼠的曲子。只走墙里哼着「下一个音」的巷子。）'); S.goal(goalLane(S)); },
      hill: async S => { await S.think('倒着吹——从石板上最后一个音，吹回第一个。'); hillStart(S); },
      back: async S => { await S.think('倒着走他来时的路。巷子的顺序，就是倒过来的曲子：1、4、2、5，最后回到广场。'); backTimer(S); }
    },
    tick(S, dt) {
      if (!W.noRun) S.norun(true);
      const f = S.f;
      if (S.map === 'lanes') LANES.forEach(L => { const e = S.ent(L.id); if (e && e.s.hv > 0) e.s.hv = Math.max(0, e.s.hv - dt); });
      if (S.map === 'square') { const e = S.ent('s_hum'); if (e && e.s.hv > 0) e.s.hv = Math.max(0, e.s.hv - dt); }
      if (f.ph === 'back' && !f.warn10 && S.timerLeft != null && S.timerLeft < 10) { f.warn10 = true; piperTune(S, 1, 1.6); S.bubble('pl', '!', 1200); S.toast('（山上的笛声越吹越急——莉泽尔攥着你的手，忽然松了一下）'); }
      if (f.ph === 'back' && (S.map === 'hill' || S.map === 'lanes')) {
        f._bt = (f._bt ?? 4) - dt;
        if (f._bt <= 0) { f._bt = 7.5; piperTune(S, S.map === 'hill' ? .7 : .32, .9); const e = S.ent((S.map === 'hill' ? 'h_' : 'l_') + f.tb[f.tb.length - 2]); if (e && !e.hidden && !W.busy) S.bubble(e.id, '…', 1400); }
      }
    },
    thumb(g, w, h) {
      const sky = g.createLinearGradient(0, 0, 0, h - 22); sky.addColorStop(0, '#1a1410'); sky.addColorStop(1, '#4a3424'); g.fillStyle = sky; g.fillRect(0, 0, w, h - 22);
      g.fillStyle = '#2a2a1e'; g.beginPath(); g.moveTo(0, h - 22); g.lineTo(w * .25, h - 70); g.lineTo(w * .48, h - 58); g.lineTo(w * .62, h - 22); g.fill();
      g.fillStyle = '#e8d890'; g.fillRect(w * .25 - 2, h - 64, 4, 10); g.fillStyle = 'rgba(240,220,140,.2)'; g.fillRect(w * .25 - 8, h - 70, 16, 18);
      const C = ['#e8e4d8', '#b83a3a', '#4a6a8a', '#6a8a4a', '#a86a9a'];
      for (let i = 0; i < 9; i++) { const x = w * .27 + i * 7, y = h - 58 + i * 4; g.fillStyle = C[i % 5]; g.fillRect(x, y, 3, 5); g.fillStyle = '#f2cfae'; g.fillRect(x, y - 3, 3, 3); g.fillStyle = '#f0e060'; g.fillRect(x, y - 4, 3, 1); }
      for (let i = 0; i < 5; i++) { g.fillStyle = NCOL[TUNE[i]]; g.fillRect(14 + i * 9, 18 + (5 - TUNE[i]) * 4, 3, 3); g.fillRect(16 + i * 9, 12 + (5 - TUNE[i]) * 4, 1, 7); }
    },
    sprites: {
      chdoor(g, e, t, R) { R(1, -10, 14, 26, '#6a6458'); R(2, -12, 12, 3, '#6a6458'); R(3, -13, 10, 2, '#6a6458'); box(R, 3, -8, 10, 22, e.open ? '#1a1008' : '#5a3a22'); if (!e.open) { R(8, -8, 1, 22, '#3a2414'); for (let i = 0; i < 4; i++) { R(4, -6 + i * 5, 1, 1, '#2a2a2a'); R(11, -6 + i * 5, 1, 1, '#2a2a2a'); } R(6, 3, 1, 2, '#c8a050'); R(10, 3, 1, 2, '#c8a050'); } else { R(6, 0, 4, 12, 'rgba(255,200,120,.25)'); R(7, -2, 1, 2, '#ffd890'); } },
      rosewin(g, e, t, R) { R(1, -12, 14, 14, '#5a5650'); R(3, -10, 10, 10, '#2a2030'); const c = ['#c83a3a', '#3a6ac8', '#e8c040', '#3a9a5a']; for (let i = 0; i < 8; i++) { const a = i / 8 * Math.PI * 2; R(7 + Math.round(Math.cos(a) * 3), -6 + Math.round(Math.sin(a) * 3), 2, 2, c[i % 4]); } R(7, -6, 2, 2, '#f0e0a0'); },
      innsign(g, e, t, R) { R(2, -12, 12, 2, '#2a2a2a'); R(3, -10, 1, 2, '#2a2a2a'); R(12, -10, 1, 2, '#2a2a2a'); box(R, 1, -8, 14, 10, '#6a4a2a'); R(5, -6, 6, 4, '#e8c040'); R(9, -8, 2, 3, '#e8c040'); R(10, -9, 2, 1, '#c89a20'); R(4, -2, 8, 1, '#c89a20'); },
      hdoor(g, e, t, R) { box(R, 3, -6, 10, 22, e.open ? '#1a1008' : (e.col || '#5a3a22')); if (!e.open) { R(5, -4, 1, 18, shade(e.col || '#5a3a22', -.3)); R(8, -4, 1, 18, shade(e.col || '#5a3a22', -.3)); R(10, 4, 1, 2, '#c8a050'); } R(2, -7, 12, 1, '#3a2a1a'); },
      win(g, e, t, R) { R(3, -4, 10, 10, '#3a2a1a'); if (e.open) { R(4, -3, 8, 8, '#0e0e14'); R(1, -3, 3, 8, '#5a6a3a'); R(12, -3, 3, 8, '#5a6a3a'); } else { R(4, -3, 4, 8, '#5a6a3a'); R(8, -3, 4, 8, '#4e5e34'); R(5, -1, 2, 1, '#3a4a2a'); R(9, -1, 2, 1, '#3a4a2a'); R(5, 2, 2, 1, '#3a4a2a'); R(9, 2, 2, 1, '#3a4a2a'); } R(2, 6, 12, 2, '#8a8070'); if (e.flowers) { R(3, 4, 2, 2, '#f0d040'); R(6, 4, 2, 2, '#f0d040'); R(10, 4, 2, 2, '#f0d040'); R(3, 5, 9, 1, '#3a6a2a'); } },
      board(g, e, t, R) { box(R, 1, -6, 14, 14, '#5a3a22'); R(3, -4, 10, 9, '#e8dcc0'); R(4, -2, 8, 1, '#6a5a4a'); R(4, 0, 6, 1, '#6a5a4a'); R(4, 2, 7, 1, '#6a5a4a'); R(9, 3, 3, 2, '#e8e0d0'); R(7, -5, 2, 1, '#2a2a2a'); },
      shoesign(g, e, t, R) { R(2, -11, 12, 1, '#2a2a2a'); R(4, -10, 1, 2, '#2a2a2a'); box(R, 2, -8, 12, 9, '#6a4a2a'); R(5, -6, 3, 5, '#2a1a10'); R(5, -2, 7, 2, '#2a1a10'); },
      johfire(g, e, t, R) { for (let i = 0; i < 5; i++) R(2 + i, 12 - i * 3, 12 - i * 2, 3, i % 2 ? '#6a4a2a' : '#7a5632'); R(7, -6, 2, 6, '#5a3a22'); R(4, -7, 8, 2, '#4a7a3a'); R(4, -7, 1, 1, '#f0e060'); R(8, -8, 1, 1, '#ffffff'); R(11, -7, 1, 1, '#f0e060'); R(2, 13, 12, 2, 'rgba(0,0,0,.3)'); },
      lsign(g, e, t, R) {
        R(2, -10, 12, 1, '#2a2a2a'); R(4, -9, 1, 2, '#2a2a2a'); R(11, -9, 1, 2, '#2a2a2a'); box(R, 2, -7, 12, 8, '#5a4228');
        const ic = e.ic | 0, c = ['#c8b080', '#d08840', '#c8b080', '#e8e0c8', '#a8a8b0', '#a87a5a', '#8a5a32', '#e8c040', '#c8c0b0', '#a8b0c0', '#c8a870', '#3a3a3a'][ic % 12];
        if (ic === 11) R(4, -5, 8, 4, '#2a2420'); else { R(5, -5, 6, 4, c); R(6, -6, 4, 1, c); }
      },
      hum(g, e, t, R) {
        const v = e.hv || 0; if (v <= 0) return;
        const A = g.globalAlpha; g.globalAlpha = A * Math.min(1, v);
        const n = e.n | 0, col = e.rat ? '#c83a3a' : NCOL[n] || '#fff', y0 = -10 - (e.rat ? 2 : n * 3) - Math.round(Math.sin(t * 6) * 1.5);
        R(5, y0 + 5, 4, 3, col); R(8, y0 - 3, 1, 8, col); R(9, y0 - 3, 2, 1, col); R(10, y0 - 2, 1, 2, col);
        if (!e.rat) for (let i = 0; i < n; i++) R(8 - n * 1.5 + i * 3, y0 + 10, 2, 2, '#fff8e0');
        else { R(2, y0 + 10, 2, 2, '#ff3020'); R(6, y0 + 11, 2, 2, '#ff3020'); R(11, y0 + 10, 2, 2, '#ff3020'); }
        g.globalAlpha = A;
      },
      petals(g, e, t, R) { const c = ['#f0e060', '#ffffff', '#f080a0', '#e8a0e0']; for (let i = 0; i < 6; i++) R((hash(e.x, e.y, i) * 13) | 0, (hash(e.y, e.x, i + 9) * 13) | 0, 2, 1 + (i % 2), c[i % 4]); R(5, 8, 5, 1, '#4a7a3a'); },
      wreath(g, e, t, R) { R(3, 8, 10, 5, '#3a6a2a'); R(5, 9, 6, 3, '#2a2a22'); R(3, 8, 2, 2, '#f0e060'); R(8, 7, 2, 2, '#ffffff'); R(11, 9, 2, 2, '#f0e060'); R(4, 11, 2, 2, '#ffffff'); R(10, 12, 2, 1, '#f080a0'); },
      gatearch(g, e, t, R) { R(-8, -18, 32, 7, '#5a564e'); R(-6, -20, 28, 2, '#6a665e'); R(-8, -11, 7, 27, '#5a564e'); R(17, -11, 7, 27, '#5a564e'); R(-1, -11, 18, 2, '#4a463e'); for (let x = 0; x < 16; x += 3) R(x, -9, 1, 4, '#2a2a2a'); R(0, -5, 16, 1, '#2a2a2a'); },
      rivermouth(g, e, t, R) { R(0, 0, 16, 16, 'rgba(40,70,80,.35)'); R(2, 3 + ((t * 2) % 8), 5, 1, 'rgba(160,200,210,.35)'); R(8, 9, 5, 2, '#3a3028'); R(13, 10, 3, 1, '#5a4a40'); R(8, 9, 1, 1, '#8a2a20'); },
      cave(g, e, t, R) {
        const o = e.open ? 1 : .4, w = Math.round(6 + o * 8);
        R(16 - w / 2 - 2, -14, w + 4, 30, '#1a1814'); R(16 - w / 2, -12, w, 28, '#050403');
        const gl = .25 + .2 * Math.sin(t * 2.3); R(16 - w / 2 + 1, -4, w - 2, 20, `rgba(220,200,150,${gl * o})`); R(14, 4, 4, 12, `rgba(255,240,190,${gl * o * 1.2})`);
        for (let i = 0; i < 4; i++) R(16 - w / 2 + ((hash(i, 2, 7) * w) | 0), -10 + i * 6, 1, 1, '#6a6050');
      },
      gallows(g, e, t, R) { R(2, -30, 3, 45, '#4a3a2a'); R(2, -31, 22, 3, '#4a3a2a'); R(5, -26, 6, 2, '#3a2a1a'); R(20, -28, 1, 10, '#8a7a5a'); R(19, -18, 3, 3, '#8a7a5a'); R(0, 13, 8, 2, '#3a3a36'); },
      echo(g, e, t, R) { R(0, 3, 16, 12, '#5a5c58'); R(1, 1, 14, 4, '#6e706a'); R(3, 2, 8, 2, '#7e807a'); R(0, 14, 16, 2, '#2a2c2a'); R(11, 6, 3, 1, '#4a4c48'); if (!e.read) R(7, -4 + (Math.sin(t * 4) > 0 ? 1 : 0), 2, 2, '#ffe680'); },
      tally(g, e, t, R) {
        for (let b = 0; b < 9; b++) { const x = 1 + b * 3.4; R(x, 1, 1, 4, '#e8e8e0'); R(x + 1, 1, 1, 4, '#e8e8e0'); R(x - 1, 3, 4, 1, '#e8e8e0'); }
        for (let i = 0; i < 26; i++) R(1 + i * 1.15, 8, 1, 4, i % 5 === 4 ? '#f0e0a0' : '#d8d8d0');
      },
      feather(g, e, t, R) { R(4, 10, 8, 2, '#c81e24'); R(5, 9, 6, 1, '#e83a3a'); R(11, 11, 3, 1, '#f0e8d0'); R(6, 12, 1, 1, '#8a1018'); },
      ledgerpg(g, e, t, R) { R(3, 7, 10, 7, '#e8dcc0'); R(4, 9, 7, 1, '#5a4a3a'); R(4, 11, 5, 1, '#5a4a3a'); }
    },
    tiles: {
      cob: { solid: false, paint(R, X, Y) { R(0, 0, 16, 16, '#4e4a44'); for (let r = 0; r < 4; r++) { const o = (r + Y) % 2 ? 0 : 4; for (let c = -4; c < 16; c += 8) { const h = hash(X * 3 + c, Y * 5 + r, 11); R(c + o + 1, r * 4 + 1, 6, 3, h < .3 ? '#6a655c' : h < .7 ? '#625d55' : '#5a564e'); } } if (hash(X, Y, 12) < .2) R((hash(X, Y, 13) * 12) | 0, (hash(X, Y, 14) * 12) | 0, 2, 1, '#3e5a34'); } },
      lane: { solid: false, paint(R, X, Y) { R(0, 0, 16, 16, '#3c3934'); for (let r = 0; r < 4; r++) { const o = (r + Y) % 2 ? 0 : 4; for (let c = -4; c < 16; c += 8) { const h = hash(X * 7 + c, Y * 3 + r, 21); R(c + o + 1, r * 4 + 1, 6, 3, h < .4 ? '#4e4a44' : '#46423d'); } } R(7, 0, 2, 16, 'rgba(20,20,24,.35)'); } },
      roof: { solid: true, paint(R, X, Y) { R(0, 0, 16, 16, '#7a3a28'); for (let y = 0; y < 16; y += 4) { R(0, y, 16, 1, '#5a281c'); const o = (y / 4 + Y) % 2 ? 0 : 4; for (let x = o; x < 16; x += 8) R(x, y + 1, 1, 3, '#5a281c'); R(o + 2, y + 1, 3, 1, '#8e4a34'); } } },
      roofq: { solid: true, paint(R, X, Y) { R(0, 0, 16, 16, '#3a3e48'); for (let y = 0; y < 16; y += 3) { R(0, y, 16, 1, '#2a2e36'); const o = (y / 3 + Y) % 2 ? 0 : 3; for (let x = o; x < 16; x += 6) R(x, y + 1, 1, 2, '#2a2e36'); } if (hash(X, Y, 5) < .15) R(4, 6, 3, 1, '#4e5260'); } },
      roofs: { solid: true, paint(R, X, Y) { R(0, 0, 16, 16, '#4a5058'); for (let y = 0; y < 16; y += 4) { R(0, y, 16, 1, '#363c44'); const o = (y / 4 + Y) % 2 ? 0 : 4; for (let x = o; x < 16; x += 8) R(x, y + 1, 1, 3, '#363c44'); } } },
      timb: { solid: true, paint(R, X, Y) { R(0, 0, 16, 16, '#d6ccb4'); R(0, 0, 16, 2, '#3a2a1c'); R(0, 0, 2, 16, '#3a2a1c'); R(0, 9, 16, 1, '#3a2a1c'); if (X % 2) { for (let i = 0; i < 7; i++) R(2 + i, 2 + i, 2, 1, '#3a2a1c'); } else { for (let i = 0; i < 7; i++) R(13 - i, 2 + i, 2, 1, '#3a2a1c'); } R(0, 14, 16, 2, '#6a655c'); R(0, 13, 16, 1, '#4a453e'); } },
      chface: { solid: true, paint(R, X, Y) { R(0, 0, 16, 16, '#7e786c'); for (let r = 0; r < 4; r++) { R(0, r * 4 + 3, 16, 1, '#5a564e'); R((r * 5 + X * 3) % 16, r * 4, 1, 3, '#5a564e'); } R(0, 14, 16, 2, '#4a463e'); } },
      hallface: { solid: true, paint(R, X, Y) { R(0, 0, 16, 16, '#a08a68'); for (let r = 0; r < 3; r++) { R(0, r * 5 + 4, 16, 1, '#7a6848'); R((r * 6 + X * 5) % 16, r * 5, 1, 4, '#7a6848'); } R(0, 14, 16, 2, '#5a4a34'); } },
      cwall: { solid: true, paint(R, X, Y) { R(0, 0, 16, 16, '#2a2a28'); R(0, 0, 16, 2, '#3a3a36'); if (X % 2 === 0) R(2, 0, 12, 4, '#4a4a44'); } },
      cwf: { solid: true, paint(R, X, Y) { R(0, 0, 16, 16, '#5a564e'); for (let r = 0; r < 3; r++) { R(0, r * 5 + 4, 16, 1, '#3a3832'); R((r * 7 + X * 4) % 16, r * 5, 1, 4, '#3a3832'); } R(0, 14, 16, 2, '#3a3832'); } },
      mtn: { solid: true, paint(R, X, Y) { R(0, 0, 16, 16, '#4a4438'); for (let i = 0; i < 4; i++) R((hash(X, Y, 30 + i) * 12) | 0, (hash(X, Y, 40 + i) * 14) | 0, 4, 2, i % 2 ? '#5a5444' : '#3a362c'); if (hash(X, Y, 50) < .3) R(3, 12, 5, 2, '#3a4a2a'); } }
    },
    maps: {
      /* ---------------- 市集广场 ---------------- */
      square: {
        amb: 'wind', dark: .26, plr: 3.4, floor: 'stone', fog: .12,
        legend: { Q: 'roofq', R: 'roof', S: 'roofs', G: 'chface', F: 'timb', H: 'hallface', L: 'lane', ',': 'cob' },
        rows: [
          'QQQQQQQQQRRRRRLSSSSSSSSRRRRRR',
          'QQQQQQQQQRRRRRLSSSSSSSSRRRRRR',
          'QQQQQQQQQRRRRRLSSSSSSSSRRRRRR',
          'GGGGGGGGGFFFFFLHHHHHHHHFFFFFF',
          'R,,,,,,,,,,,,,,,,,,,,,,,,,,,R',
          'R,,,,,,,,,,,,,,,,,,,,,,,,,,,R',
          'R,,,,,,,,,,,,,,,,,,,,,,,,,,,R',
          'R,,,,,,,,,,,,,,,,,,,,,,,,,,,R',
          'R,,,,,,,,,,,,,,,,,,,,,,,,,,,,',
          'R,,,,,,,,,,,,,,,,,,,,,,,,,,,R',
          'R,,,,,,,,,,,,,,,,,,,,,,,,,,,R',
          'R,,,,,,,,,,,,,,,,,,,,,,,,,,,R',
          'R,,,,,,,,,,,,,,,,,,,,,,,,,,,R',
          'RRRRRRRRRRRRRRRRRRRRRRRRRRRRR',
          'RRRRRRRRRRRRRRRRRRRRRRRRRRRRR'],
        ents: [
          { id: 's_chdoor', x: 4, y: 3, spr: 'chdoor', on: S => chDoor(S) },
          { id: 's_rose', x: 6, y: 3, spr: 'rosewin', on: S => S.narr('教堂正面的圆玫瑰窗，红的蓝的黄的玻璃拼成圣尼古拉——管水手、商人，也管孩子的圣人。\n早晨的光从外面照不进去，看起来灰扑扑的。') },
          { id: 's_chwin', x: 1, y: 3, spr: 'win', on: S => S.narr('教堂侧面的小窗，窗缝里漏出蜡烛的烟味。\n里面的唱经声嗡嗡的，像隔着一层水。') },
          { id: 's_innwin', x: 10, y: 3, spr: 'win', flowers: true, on: S => S.narr('客栈的窗台上摆着一排黄色的圣约翰草，是芭贝尔种的。花开得正旺，今晚要扎进篝火的花环里。') },
          { id: 's_innd', x: 11, y: 3, spr: 'hdoor', col: '#5a3a22', on: S => innDoor(S) },
          { id: 's_innsign', x: 12, y: 3, spr: 'innsign', on: S => S.narr('「金天鹅」。木招牌上的天鹅是镀过金的，掉了一半，剩下的一半在晨光里闪。') },
          { id: 's_lanegate', x: 14, y: 3, spr: 'invisible', solid: true, on: S => S.narr('北边的小巷通往城里的大街小巷，一直通到东门。\n娘说过：今天不许走出广场。') },
          { id: 's_hum', x: 14, y: 2, spr: 'hum', z: 1, solid: false, s: { n: TUNE[0], hv: 0 } },
          { id: 's_lexit', x: 14, y: 1, spr: 'invisible', async touch(S) {
            if (S.f.ph === 'fwd') return S.go('lanes', 9, 36, 3);
            S.pos(14, 2, 0);
          } },
          { id: 's_board', x: 17, y: 3, spr: 'board', async on(S) { if (S.once('board')) await S.narr('市政厅门口的告示板。最上面那张羊皮纸的边角，被老鼠啃出了一排小牙印。'); await S.note('decree'); } },
          { id: 's_halld', x: 19, y: 3, spr: 'hdoor', col: '#3a2a1a', on: S => S.narr('市政厅的橡木大门锁着，铁环冰凉。\n议员们都在教堂里，坐最前面的那几排。') },
          { id: 's_hallwin', x: 22, y: 3, spr: 'win', on: S => S.narr('市政厅的窗板关得严严的。\n窗台底下的墙根，还留着一道老鼠啃出来的洞，被人用灰泥糊上了。') },
          { id: 's_shoesign', x: 24, y: 3, spr: 'shoesign', on: S => S.narr('爹的鞋铺。招牌上画着一只靴子，是你去年帮着刷的漆。') },
          { id: 's_homed', x: 25, y: 3, spr: 'hdoor', col: '#6a4a2a', on: S => homeDoor(S) },
          { id: 's_homewin', x: 27, y: 3, spr: 'win', on: S => S.narr('鞋铺的窗台上摆着一双给莉泽尔做的小红鞋，还差一道鞋带。') },
          { id: 's_clerk', x: 20, y: 4, spr: '@clerk', dir: 0, on: S => clerk(S) },
          { id: 's_well', x: 14, y: 8, spr: 'well', on: S => S.narr(S.f.ph === 'done' ? '井水晃了一下，又静了。' : '广场中间的水井。井沿上刻满了孩子们的记号。\n一个月前，井里捞上来过十几只淹死的老鼠。那以后谁也不敢喝这口井的水。') },
          { id: 's_stall1', x: 5, y: 6, w: 2, spr: 'stall2', col: '#8a5a2a', on: S => S.narr('集市的摊子收起来了，木板上还粘着几粒麦子。\n今天过节，不开市。') },
          { id: 's_stall2', x: 8, y: 6, w: 2, spr: 'stall2', col: '#2a5a7a', on: S => S.narr('布摊。帆布底下露出一角花布——红的、黄的、绿的拼在一起。\n……像他的衣服。') },
          { id: 's_cart', x: 21, y: 10, w: 2, spr: 'cart', on: S => S.narr('一辆装满木柴的手推车。今晚要在广场上点圣约翰之火，大人小孩围着火跳舞。') },
          { id: 's_fire', x: 24, y: 11, spr: 'johfire', on: S => S.narr('码好的篝火堆，顶上插着一个圣约翰草编的花环。\n今晚点火的时候，孩子们要跳过火堆——跳过去，这一年就不会生病。') },
          { id: 's_barrel', x: 2, y: 5, spr: 'barrel', on: S => S.narr('雨水桶。水面上漂着一根灰色的长尾巴——是老鼠的。你赶紧走开了。') },
          { id: 's_east', x: 28, y: 8, spr: 'invisible', async touch(S) { S.pos(27, 8, 1); await S.narr(S.f.ph === 'fwd' ? '他们往北边的巷子去了，不是东边。' : '东边的街通往河边的码头。\n娘说过：今天不许走出广场。'); } },
          { id: 's_li', x: 12, y: 10, spr: '@liesel', dir: 0, on: S => liesel(S) },
          { id: 's_k1', x: 11, y: 11, spr: '@k1', dir: 2, on: S => S.say('小卡尔', '我们在玩「狐狸进羊圈」！马蒂亚斯，你当狐狸——哦，你跑不动……那你当羊圈吧。') },
          { id: 's_k2', x: 13, y: 11, spr: '@k2', dir: 1, on: S => S.say('小玛格达', '你看我的花环！圣约翰草，晚上要扔进火里，许愿用的。') },
          { id: 's_hans', x: 8, y: 10, spr: '@hans', dir: 0, on: S => hans(S) },
          { id: 's_gr', x: 17, y: 7, spr: '@grete', dir: 1, on: S => grete(S) },
          { id: 's_piper', x: 28, y: 8, spr: '@piper', hidden: true, solid: false, dir: 1 },
          { id: 's_k3', x: 11, y: 4, spr: '@k3', hidden: true, solid: false },
          { id: 's_k4', x: 19, y: 4, spr: '@k4', hidden: true, solid: false },
          { id: 's_k5', x: 4, y: 4, spr: '@k5', hidden: true, solid: false },
          { id: 's_mom', x: 4, y: 4, spr: '@mom', hidden: true, solid: false, dir: 0 },
          { id: 's_bb', x: 11, y: 4, spr: '@barbel', hidden: true, solid: false, dir: 0, on: S => S.say('芭贝尔', ['我怎么会在山上？我明明在擦桌子……', '……那支歌，我再也不哼了。']) }
        ],
        async enter(S, first) {
          const f = S.f; lightAll(S);
          if (first) return opening(S);
          if (f.ph === 'inn' && S.once('bell7')) {
            S.amb('none');
            for (let i = 0; i < 3; i++) bell(S, 1, i * 1.1);
            await S.wait(1600);
            await S.narr('教堂的钟敲起来了。……五、六、七。\n钟声停了。连唱经的声音也停了。\n广场上静得出奇，静得能听见井里滴水。');
            S.amb('wind');
          }
          if (f.ph === 'back') return finale(S);
        },
        step(S, x, y) {
          const f = S.f;
          if (f.ph === 'inn' && Math.abs(x - 14) + Math.abs(y - 8) <= 3) return procession(S);
          if (f.ph === 'fwd' && x === 14 && y === 2) { hum(S, TUNE[0]); S.ent('s_hum').s.hv = 2.4; S.toast('（巷口的墙在哼：松开 3 个孔——他在广场上吹的第一个音）'); }
        },
        tick(S, dt) {
          const f = S.f;
          if (W.busy || !['morning', 'inn'].includes(f.ph)) return;
          f._ch = (f._ch ?? 2) - dt;
          if (f._ch <= 0) { f._ch = 7; const d = Math.abs(W.pl.x - 4) + Math.abs(W.pl.y - 3); chant(S, Math.max(.15, 1.1 - d / 14)); }
        }
      },
      /* ---------------- 金天鹅客栈 ---------------- */
      inn: {
        amb: 'room', dark: .5, plr: 3.2, floor: 'wood', wall: 'wood',
        legend: { l: 'lightwood' },
        rows: [
          '##############',
          '##############',
          '#llllllllllll#',
          '#llllllllllll#',
          '#llllllllllll#',
          '######l#######',
          '######l#######',
          '#wwwwwwwwwwww#',
          '#wwwwwwwwwwww#',
          '#wwwwwwwwwwww#',
          '#wwwwwwwwwwww#',
          '#######w######'],
        ents: [
          { id: 'i_exit', x: 7, y: 11, spr: 'invisible', async touch(S) { await S.go('square', 11, 4, 0); } },
          { id: 'i_bb', x: 4, y: 8, spr: '@barbel', dir: 0, on: S => barbel(S) },
          { id: 'i_c1', x: 1, y: 7, spr: 'counter', on: S => S.narr('柜台上摆着一排擦得锃亮的锡杯。最边上那只没洗，杯底剩一口麦酒。') },
          { id: 'i_c2', x: 2, y: 7, spr: 'counter', on: S => S.narr('柜台后面的墙上挂着一串钥匙。有一个钉子是空的。') },
          { id: 'i_c3', x: 3, y: 7, spr: 'counter', on: S => S.narr('一块记账的木牌，用粉笔写着谁欠几杯酒。最下面一行：「花衣裳的——房钱七天，未付」。') },
          { id: 'i_fire', x: 9, y: 6, w: 2, spr: 'fireplace', light: { r: 2.4, col: 'rgba(255,140,60,.18)', flick: true, dx: 16 }, on: S => S.narr('炉火烧得很小，锅里炖着今晚过节的汤。\n火苗噼啪一声，你吓了一跳。') },
          { id: 'i_t1', x: 8, y: 8, spr: 'table', on: S => S.narr('桌上的锡杯里还有半杯麦酒。客人们走得急，弥撒的钟一响，全跑了。') },
          { id: 'i_cup', x: 8, y: 8, spr: 'cup', solid: false, z: 1, oy: -5 },
          { id: 'i_t2', x: 11, y: 9, spr: 'table', on: S => S.narr('有人在桌面上刻了一只老鼠，又在老鼠身上划了一个大叉。') },
          { id: 'i_b1', x: 12, y: 7, spr: 'barrel', on: S => S.narr('麦酒桶。桶底下压着几张捕鼠夹——这一个月，用不上了。') },
          { id: 'i_door', x: 6, y: 6, spr: 'hdoor', col: '#4a2e1a', on: S => innRoomDoor(S) },
          { id: 'i_tally', x: 3, y: 1, w: 2, spr: 'tally', on: S => tallyOn(S) },
          { id: 'i_win', x: 9, y: 1, spr: 'window', on: S => S.narr('窗外是威悉河。河水很急，灰绿色的，往北流。\n一个月前，老鼠们就是从那个码头一只接一只跳下去的。') },
          { id: 'i_bed', x: 1, y: 2, h: 2, spr: 'bed', col: '#6a5a4a', on: S => S.narr('床铺得整整齐齐，像没人睡过。\n枕头上落着一根很长的黑头发。') },
          { id: 'i_table', x: 8, y: 3, spr: 'table', col: '#5a3a24' },
          { id: 'i_contract', x: 8, y: 3, spr: 'paper', solid: false, z: 1, oy: -5, on: S => contract(S) },
          { id: 'i_sack', x: 11, y: 2, spr: 'sack', on: S => S.narr('一只麻袋，口子扎得紧紧的。袋子上全是被牙齿咬穿的小洞——\n从里面咬的。袋子是空的。') },
          { id: 'i_feather', x: 5, y: 3, spr: 'feather', decal: true, on: S => S.narr('地板上一根红羽毛，跟他帽子上插的那根一样。\n你没敢捡。') }
        ],
        async enter(S, first) {
          if (first) {
            await S.narr('客栈里一股麦酒和烟熏肉的味道。客人们也都去望弥撒了。\n只有芭贝尔在擦桌子。');
            S.face('i_bb', 'pl');
          }
        }
      },
      /* ---------------- 巷子 ---------------- */
      lanes: {
        amb: 'wind', dark: .46, plr: 3, floor: 'stone', fog: .2,
        legend: { R: 'roof', F: 'timb', L: 'lane', ',': 'cob', M: 'cwall', N: 'cwf' },
        rows: laneRows(),
        ents: [
          { id: 'l_gexit', x: 9, y: 0, spr: 'invisible', async touch(S) {
            const f = S.f;
            if (f.ph === 'fwd') return S.go('hill', 10, 18, 3);
            S.pos(9, 2, 0); await S.think('孩子们在你身后。不能回头。');
          } },
          { id: 'l_gate', x: 9, y: 1, spr: 'gatearch', solid: false, decal: true },
          { id: 'l_bexit', x: 9, y: 37, spr: 'invisible', async touch(S) {
            const f = S.f;
            if (f.ph === 'back') { S.clearTimer(); return S.go('square', 14, 4, 0); }
            S.pos(9, 36, 3); await S.think('笛声在前面。现在回头，就再也追不上了。');
          } },
          ...LANES.map(L => ({ id: L.id, x: L.x, y: L.top + 2, spr: 'hum', z: 1, solid: false, s: { n: L.n, hv: 0 } })),
          { id: 'l_humr', x: 0, y: 27, spr: 'hum', z: 1, solid: false, s: { rat: 1, hv: 0 } },
          ...LANES.map((L, j) => ({ id: 'l_sg' + L.k + L.i, x: L.x - 1, y: L.top + 4, spr: 'lsign', s: { ic: j }, on: S => S.narr(LFLAV[L.k][L.i]) })),
          ...LANES.filter(L => L.ok).flatMap(L => [1, 2, 3].map(d => ({ id: 'l_pet' + L.k + d, x: L.x, y: L.top + d, spr: 'petals', decal: true, hidden: true }))),
          { id: 'l_river', x: 0, y: 27, spr: 'rivermouth', decal: true },
          { id: 'l_rsign', x: 1, y: 26, spr: 'sign', col: '#3a5a6a', on: S => S.narr('木牌：鱼门巷 → 码头。\n巷子尽头是威悉河。风从那边吹过来，带着一股烂水草和……死老鼠的味道。') },
          { id: 'l_wreath', x: 11, y: 35, spr: 'wreath', decal: true, on: S => S.narr('一个圣约翰草编的花环掉在石板上，被踩扁了一半。\n是小玛格达的。她刚才还在跟你显摆。') },
          { id: 'l_trough', x: 2, y: 19, spr: 'barrel', on: S => S.narr('饮马的水槽。水面一动不动，映出两边的屋檐——还有一条窄窄的、灰白色的天。') },
          { id: 'l_cart', x: 15, y: 11, w: 2, spr: 'cart', on: S => S.narr('一辆卸了牲口的大车横在路边。车板上摆着一只孩子的木鞋，鞋头朝着北边。') },
          { id: 'l_shoe', x: 6, y: 3, spr: 'shoes', col: '#8a6a3a', on: S => S.narr('一只木鞋，孤零零地立在东门前的石板上。\n穿鞋的人没有停下来捡。') },
          { id: 'l_crate', x: 16, y: 27, spr: 'crate', on: S => S.narr('码在墙根的木箱，上面用炭笔写着「酒馆·金天鹅」。') },
          ...TBASE.map(b => ({ id: 'l_' + b, x: 9, y: 36, spr: b === 'li' ? '@liesel' : b === 'gr' ? '@grete' : '@' + b, hidden: true, solid: false, on: S => kidOn(S, b) })),
          { id: 'l_shadow', x: 9, y: 5, spr: '@piper', hidden: true, solid: false, alpha: .5 }
        ],
        async enter(S, first) {
          const f = S.f;
          if (f.ph === 'fwd') {
            lanesSetup(S);
            if (first) {
              await S.narr('巷子里一个人也没有。家家户户的窗板都关着。\n笛声已经远了——可巷口的墙在嗡嗡地响，像有人把那支曲子按进了石头缝里。');
              await S.think('站到每条巷子口听一听，墙在哼哪个音。\n和石板上的下一个音对上的，就是他走过的那条。');
              f.band = 0; S.goal(goalLane(S));
              if (S.coop) S.toast('双人：一人看「笺」里格蕾特的石板报孔数，一人走巷子听墙');
              S.cp('lanes');
            }
          } else if (f.ph === 'back') {
            S.f.tb.forEach(b => S.show('l_' + b));
            trailPlace(S, 'l_', [[9, 1], [9, 1], [9, 2]]);
            if (S.once('backLanes')) S.toast('倒着走：先走哼「1」的，再「4」「2」「5」，最后回广场');
          }
        },
        step(S, x, y) {
          const f = S.f, M = mouthAt(x, y);
          if (M) humLane(S, M);
          const C = commitAt(x, y);
          if (C && f.ph === 'fwd') return fwdCommit(S, C);
          if (C && f.ph === 'back') return backCommit(S, C);
        },
        tick(S, dt) {
          const f = S.f; if (f.ph === 'back') trailTick(S, dt, 'l_');
          if (f.ph === 'fwd' && !W.busy) { f._la = (f._la ?? 3) - dt; if (f._la <= 0) { f._la = 8 + Math.random() * 4; piperTune(S, .16 + .04 * (f.band || 0), .95); if (Math.random() < .5) S.sfx('giggle'); } }
          const e = S.ent('l_humr'); if (e && e.s.hv > 0) e.s.hv = Math.max(0, e.s.hv - dt);
        }
      },
      /* ---------------- 科彭山 ---------------- */
      hill: {
        amb: 'wind', dark: .34, plr: 3.4, floor: 'dirt', fog: .26,
        legend: { K: 'mtn' },
        tileOpts: { grassC: '#3a4a2a', treeC: '#1e3020' },
        rows: [
          'KKKKKKKKKKKKKKKKKKKKKK',
          'KKKKKKKKKKKKKKKKKKKKKK',
          'KKKKKKKKKKKKKKKKKKKKKK',
          'PP""""""""""d"""""""PP',
          'P"""""""""""d""""""""P',
          'P"""P"""""""d"""""P""P',
          'P"""""""""""d"""""""PP',
          'PP"""""dddddd"""""""PP',
          'P""""""d"""""""""""""P',
          'P""P"""d""""""""""P""P',
          'P""""""d""""""""""""PP',
          'PP"""""ddddddddd""""PP',
          'P"P""""""""""""d"""""P',
          'P"""P""""""""""d""P""P',
          'P""""""""""""""d"""""P',
          'PP""""""""dddddd"""PPP',
          'P"""""""""d""""""""""P',
          'P""P""""""d"""""""P""P',
          'PP""""""""d"""""""""PP',
          'PPPPPPPPPPdPPPPPPPPPPP'],
        ents: [
          { id: 'h_exit', x: 10, y: 19, spr: 'invisible', async touch(S) {
            const f = S.f;
            if (f.ph === 'back') return S.go('lanes', 9, 2, 0);
            S.pos(10, 18, 3); await S.think('莉泽尔还在山上。');
          } },
          { id: 'h_cave', x: 11, y: 2, w: 2, spr: 'cave', solid: true, on: S => S.narr(S.f.ph === 'back' ? '山缝里黑洞洞的。笛声是从里面传出来的，又像是从你自己的骨头里。' : '光秃秃的科彭山上裂开了一道缝。缝里透出一点暖黄的光，像有人在里面点了灯，在等。') },
          { id: 'h_piper', x: 13, y: 3, spr: '@piper', dir: 0, on: S => S.narr('他站在山缝边上吹笛子，眼睛在红帽檐的阴影里，一眨不眨。') },
          { id: 'h_echo', x: 10, y: 12, spr: 'echo', on: S => echoRock(S) },
          { id: 'h_cr1', x: 4, y: 8, spr: 'cross', on: S => S.narr('路边的木十字架，被风吹得歪了。城里人管这面坡叫「受难坡」，复活节的时候会抬着十字架上来。') },
          { id: 'h_cr2', x: 17, y: 9, spr: 'cross', on: S => S.narr('十字架底下放着一小把野花，已经干了。不知道是给谁的。') },
          { id: 'h_gal', x: 17, y: 4, spr: 'gallows', on: S => S.narr('城外的刑场。绞架上的绳子早就烂了，在风里轻轻晃。\n大人们从来不许孩子到这里来。') },
          { id: 'h_cr3', x: 5, y: 15, spr: 'cross', on: S => S.narr('一个更旧的石十字，字已经磨平了。底下的草被踩倒了一大片——刚刚有很多双小脚从这里走过。') },
          { id: 'h_wr', x: 13, y: 16, spr: 'wreath', decal: true, on: S => S.narr('又一个花环。圣约翰草的黄花被踩进了泥里。') },
          ...HKIDS.map(id => ({ id, x: 10, y: 19, spr: id === 'h_li' ? '@liesel' : '@' + id.slice(2), hidden: true, solid: false, on: S => kidOn(S, id.slice(2)) })),
          { id: 'h_gr', x: 10, y: 18, spr: '@grete', hidden: true, solid: false, on: S => kidOn(S, 'gr') }
        ],
        async enter(S, first) {
          const f = S.f;
          if (f.ph === 'fwd') { f.ph = 'hill'; return hillIntro(S); }
        },
        tick(S, dt) {
          const f = S.f;
          if (f.ph === 'hill' && !f.hstop && f.hp != null) {
            const tl = S.timerLeft;
            if (tl != null) f.hp = H_END - HV * tl;
            placeLine(S, HKIDS, HPATH, f.hp, HGAP, tl != null);
            f._ht = (f._ht ?? 1) - dt;
            if (f._ht <= 0) { f._ht = 3.4; const d = Math.abs(W.pl.x - 13) + Math.abs(W.pl.y - 3); piperTune(S, Math.max(.35, 1.2 - d / 22)); }
          }
          if (f.ph === 'back') trailTick(S, dt, 'h_');
        }
      }
    }
  });

  /* ================= 早晨 ================= */
  async function opening(S) {
    const f = S.f; f.ph = 'morning'; S.give('pipe', true); S.speed(.85);
    S.place('s_mom', 25, 4, 0);
    await S.say('娘', ['马蒂亚斯，你腿不好，今天就别去教堂站一上午了。', '看好莉泽尔。别让她跑出广场，听见没有？弥撒一完我们就回来。']);
    await S.walk('s_mom', [5, 4], 3.2); S.hide('s_mom');
    S.sfx('close');
    await S.narr('娘拐进了教堂。厚重的木门在她身后合上，唱经声隔着墙嗡嗡地传出来。\n广场上只剩下一群孩子。');
    const r = await S.ask('你拄着拐杖站在家门口。', ['（先去看看莉泽尔）', '（先在广场上转转）'], '马蒂亚斯');
    if (r === 0) S.goal('看着莉泽尔（她在井边和小伙伴玩）');
    else S.goal('在广场上转转：大人们都在教堂里望弥撒');
  }
  async function liesel(S) {
    const f = S.f; S.face('s_li', 'pl');
    if (f.ph === 'inn') return procession(S);
    if (!f.liTalk) {
      f.liTalk = true;
      await S.say('莉泽尔', ['哥哥！你听说了吗？那个花衣裳的人，就住在金天鹅客栈楼上！', '芭贝尔说他的屋子锁着，里面有一麻袋老鼠骨头！', '你去看看嘛——我不敢。我在这儿等你，保证不乱跑。']);
      S.goal('去金天鹅客栈看看那个吹笛人住过的屋子（教堂右手边）');
      return;
    }
    await S.say('莉泽尔', ['金天鹅！就在教堂旁边那个挂天鹅的门！', '我保证不乱跑！'][(f._li = ((f._li ?? -1) + 1) % 2)]);
  }
  async function hans(S) {
    S.face('s_hans', 'pl');
    const ph = S.f.ph;
    if (ph === 'fwd') return S.say('小汉斯', ['我……我只是回家拿外套……出来的时候，他们都不见了……', '马蒂亚斯，我是不是……是不是逃掉了？']);
    if (ph === 'done') return S.say('小汉斯', '我再也不嫌外套热了。');
    await S.say('小汉斯', '娘说今天热，不许我穿外套出来。可我就想穿那件新的，袖子上有铜扣子！');
  }
  async function grete(S) {
    const f = S.f; S.face('s_gr', 'pl');
    if (f.ph === 'fwd') return S.note('slate');
    if (!f.grTalk) {
      f.grTalk = true;
      await S.narr('格蕾特是皮匠家的女儿，比你大一岁。她生下来就听不见。\n她冲你笑了笑，在小石板上画了一只老鼠，又画了一个大叉。');
      await S.narr('然后她指指客栈的方向，皱起眉头，在石板上画了一顶尖尖的帽子。\n……她也在想那个吹笛人。');
      return;
    }
    await S.narr(['格蕾特用粉笔在石板上画了一个太阳，又画了一团火——今晚的篝火。她冲你比划：一起跳。', '格蕾特低头盯着自己的手指，一根一根地弯下去，又伸开。\n她最近总是这样，像在学什么。'][(f._gr = ((f._gr ?? -1) + 1) % 2)]);
  }
  async function chDoor(S) {
    const ph = S.f.ph;
    if (ph === 'done') return S.narr('教堂的门开着。蜡烛还没熄。');
    if (ph === 'morning' || ph === 'inn') { S.sfx('locked'); return S.narr('门从里面闩上了。弥撒的时候不许人进出。\n隔着门板，你听见神父在念拉丁文，还有娘咳嗽的声音。'); }
    S.sfx('knock'); await S.narr('你用拳头砸门。没有人应。\n里面在唱「垂怜经」，唱得那么响，什么也听不见。');
  }
  async function homeDoor(S) {
    if (S.f.ph === 'done') return S.narr('家里的门开着。爹在里面喊莉泽尔的名字，一遍又一遍。');
    await S.narr('家门关着。屋里很暗，爹的鞋楦整整齐齐地挂了一墙。\n娘让你在外面看着莉泽尔。');
  }
  async function innDoor(S) {
    if (S.f.ph === 'fwd') return S.narr('客栈的门开着一条缝。芭贝尔不在了——她也跟着去了。');
    S.sfx('open'); await S.go('inn', 7, 10, 3);
  }
  async function clerk(S) {
    const f = S.f; S.face('s_clerk', 'pl');
    if (f.ph === 'fwd') return S.say('老奥托', ['孩子们……我看见了，我都看见了……我这双腿……', '去吧，马蒂亚斯。跟着那声音去。']);
    if (f.ph === 'done') return S.say('老奥托', '今天的事，我要一个字一个字地记进城里的书里。');
    if (f.readContract && !S.has('ledger')) return clerkLedger(S);
    if (S.has('ledger')) return S.say('老奥托', '拿好那页纸。');
    if (!f.clerkTold) {
      f.clerkTold = true;
      await S.say('书记员老奥托', [
        '马蒂亚斯？又被你娘留下来看妹妹了？我这脚痛风犯了，弥撒也去不成喽。',
        '一个月前的事你还记得吧？满城的老鼠，咬面包、咬布、咬摇篮里的娃娃。',
        '那个穿花衣裳的人来了，说他能把老鼠一只不剩地带走。议会当场就答应了：重重有赏。',
        '他在街上一吹笛子，老鼠就从墙缝里、地窖里涌出来，跟着他，一只接一只走进了威悉河。',
        '第二天他来领钱。议员们说：老鼠是自己跳下河的，凭什么付钱？',
        '他什么也没说。走之前只留了一句：约翰与保罗日，我再来。\n……今天，就是约翰与保罗日。',
        '他在金天鹅客栈住过。要是那张契约还在……就能证明议会赖了账。\n可谁会听一个书记员的呢。']);
      return;
    }
    await S.say('老奥托', ['那张契约要是还在，八成在他住过的屋子里。', '议员们今天坐在教堂第一排。上帝看着呢。'][(f._ck = ((f._ck ?? -1) + 1) % 2)]);
  }
  async function clerkLedger(S) {
    await S.narr('你把客栈里那张契约的事告诉了老奥托。');
    await S.say('老奥托', ['……背面写着「我收别的」？', '（老人沉默了很久，手指在膝盖上一下一下地敲。）', '那天议会开会，我就坐在边上记账。他们笑着说，一个吹笛子的。我一个字也没敢说。']);
    S.sfx('tear');
    await S.narr('他从怀里掏出一本厚厚的账簿，翻到最后，撕下一页，蘸着唾沫把笔尖润湿，写了几行字。');
    S.give('ledger');
    await S.say('老奥托', ['要是你见到他……把这个给他。', '这是哈默林欠他的。总得有人肯认这笔账。']);
    await procession(S);
  }

  /* ================= 客栈 ================= */
  async function barbel(S) {
    const f = S.f; S.face('i_bb', 'pl');
    if (!S.has('key') && !f.roomOpen) {
      await S.say('芭贝尔', ['鞋匠家的马蒂亚斯？你也是来看那间屋子的？', '那个花衣裳的人走的时候没给房钱，爹就把他的屋子锁了，说等他回来算账。', '……你想看？好吧，反正爹在教堂。钥匙给你，看完了还我。']);
      S.give('key');
      await S.say('芭贝尔', ['还有这个。他住在这儿那几天，每天夜里都在屋里哼一支歌。', '我在门外听了十几遍，偷偷记下来了。怪好听的，就是有点……让人想跟着走。']);
      await S.note('rhyme');
      S.goal('用钥匙打开北边那扇门，看看他住过的屋子');
      return;
    }
    const L = ['他的屋子就在那扇门后面。', '他吃饭从来不摘帽子。爹说那是猎人的帽子，红得扎眼。', '他走的那天晚上，我听见他在屋里数数，数了很久很久。'];
    if (f.readContract) return S.say('芭贝尔', '你脸色怎么这么白？……外面怎么这么安静？');
    await S.say('芭贝尔', L[(f._bb = ((f._bb ?? -1) + 1) % L.length)]);
  }
  async function innRoomDoor(S) {
    const f = S.f, e = S.ent('i_door');
    if (e.open) return;
    if (!S.has('key')) { S.sfx('locked'); return S.narr('门锁着。门缝里飘出一股淡淡的、像是羊圈的味道。\n……芭贝尔大概有钥匙。'); }
    S.sfx('open'); e.open = true; e.solid = false; f.roomOpen = true; S.take('key');
    await S.narr('钥匙转了两圈，门开了。\n屋里很暗，窗板只开了一条缝。');
  }
  async function tallyOn(S) {
    await S.narr('墙上画着两排粉笔道。\n上面一排密密麻麻，五道一捆，每一捆都被横着划掉了。你数不过来——有好几百。');
    await S.narr('下面一排是新画的，一道也没有划掉。\n你一道一道地数……一百三十。');
    await S.think('老鼠是上面那一排。\n……那下面这一排，是什么？');
  }
  async function contract(S) {
    const f = S.f;
    await S.note('contract');
    if (f.readContract) return;
    f.readContract = true; f.ph = 'inn';
    await S.think('「这一回，我收别的。」\n……莉泽尔还在广场上。');
    S.goal('回广场找莉泽尔（市政厅台阶上的老奥托好像知道些什么）');
  }

  /* ================= 吹笛人来了 ================= */
  const PROC = (() => { const p = []; for (let x = 27; x >= 16; x--) p.push([x, 8]); [[16, 7], [16, 6], [15, 6], [15, 5], [14, 5], [14, 4], [14, 3], [14, 2], [14, 1], [14, 0]].forEach(c => p.push(c)); return p; })();
  const PIDX = 11;   // 吹笛人停在 (16,8)
  const PLINE = ['s_piper', 's_li', 's_k1', 's_k2', 's_k3', 's_k4', 's_k5'];
  async function procession(S) {
    const f = S.f; if (f.procDone || f.ph === 'proc') return; f.ph = 'proc';
    S.amb('none'); S.goal('');
    await S.fade(1, 300);
    S.pos(10, 9, 2); S.place('s_gr', 10, 10, 2); S.place('s_li', 12, 10, 0); S.place('s_k1', 11, 11, 2); S.place('s_k2', 13, 11, 1); S.place('s_hans', 8, 10, 2);
    await S.fade(0, 400);
    await S.wait(500);
    piperTune(S, .4);
    await S.narr('东边的街口，传来了笛声。');
    S.place('s_piper', 27, 8, 1); S.ent('s_piper').alpha = 0; bg(S.alpha('s_piper', 1, 800));
    piperTune(S, .7);
    await S.walk('s_piper', [16, 8], 2.2);
    piperTune(S, 1); S.face('s_piper', 1);
    await S.narr('是他。可他不再是那个满身补丁的捕鼠人了——\n一身猎人的打扮，帽子红得扎眼，脸色白得像刷过灰。\n他把笛子横在嘴边，吹了五个音。');
    piperTune(S, 1.1);
    S.ent('s_hum').s.hv = 3;
    await S.wait(1900);
    ['s_li', 's_k1', 's_k2'].forEach(id => { S.face(id, 's_piper'); S.bubble(id, '♥', 1600); });
    S.place('s_k3', 11, 4, 0); S.place('s_k4', 19, 4, 0); S.place('s_k5', 4, 4, 0);
    await S.narr('孩子们一个接一个停下来，转过身。\n客栈的门开了，市政厅后面的小门开了，连教堂边上的地窖口也钻出一个脑袋——\n全城的孩子，都朝他走过去。');
    const slots = id => PROC[PIDX - PLINE.indexOf(id)];
    PLINE.forEach(id => { S.ent(id).solid = false; });
    await Promise.all(PLINE.slice(1).map(id => S.walk(id, slots(id), 3.4).catch(() => { })));
    PLINE.slice(1).forEach(id => S.face(id, 1));
    await S.say('马蒂亚斯', '莉泽尔！回来！');
    await S.narr('莉泽尔没有回头。她的嘴角弯着，眼睛半闭，像在做一个很甜的梦。');
    S.bubble('s_hans', '!', 1200);
    await S.say('小汉斯', '等等我——我回去拿外套！');
    S.walk('s_hans', [25, 4], 4).then(() => S.hide('s_hans')).catch(() => { });
    S.face('s_piper', 'pl');
    await S.wait(600);
    await S.scare('face', { face: 'piper', sfx: 'sting' });
    await S.say('吹笛人', ['瘸腿的孩子。', '你跟不上的。'], { style: 'whisper' });
    S.face('s_piper', 1);
    bg((async () => { for (let i = 0; i < 4; i++) { piperTune(S, .9 - i * .2); await S.wait(1900); } })());
    const mw = bg(march(S, PLINE, PROC, PIDX, PROC.length + PLINE.length, 2.1));
    await S.wait(900);
    await S.walk('pl', [12, 7], 2);
    await S.narr('你拄着拐杖往前追。一步，两步——伤腿一软，整个人扑在了石板上。\n笛声和孩子们的脚步声，钻进了北边的小巷。');
    await mw;
    PLINE.forEach(id => S.hide(id));
    S.walk('s_gr', [12, 8], 3).catch(() => { });
    await S.wait(500);
    S.face('pl', 0);
    await S.narr('一只手把你拽了起来。是格蕾特。\n她没有跟去——她听不见那笛声。');
    await S.narr('她把石板塞进你手里，飞快地用粉笔画着，指了指自己的眼睛，又指了指北边的巷子。\n她一直在看他的手指。');
    await S.note('slate');
    await S.think('五支小笛子……我的柳笛也是五个孔。\n松开一个孔最低，五个全松开最高。\n第四支被蹭花了——芭贝尔的歌里说：五个音，一个不多，一个不少。');
    S.hide('s_lanegate'); f.procDone = true; f.ph = 'fwd';
    S.amb('wind');
    S.focus(14, 3); hum(S, TUNE[0]); S.ent('s_hum').s.hv = 3.5;
    await S.narr('北边巷口的墙，还在嗡嗡地响。\n像那支曲子留在了石头里。');
    S.focus(null);
    S.follow('s_gr', true);
    S.place('s_hans', 20, 8, 1);
    S.goal('追进北边的巷子：只走墙在哼「下一个音」的那条（石板在「笺」里）');
  }

  /* ================= 巷子 ================= */
  function lanesSetup(S) {
    const g = S.ent('l_gr');
    if (S.f.ph === 'fwd') { S.place('l_gr', W.pl.x, W.pl.y, 0); g.solid = false; S.follow('l_gr', true); }
  }
  function humLane(S, L) {
    const f = S.f, key = L.river ? 'r' : L.id;
    if (f._hk === key && W.t - (f._htm || 0) < 1.6) return;
    f._hk = key; f._htm = W.t;
    if (L.river) { ratTune(S, .9); S.ent('l_humr').s.hv = 2.4; return S.toast('（鱼门巷里飘出另一支曲子，又尖又碎……一个月前，老鼠们就是跟着它下河的）'); }
    hum(S, L.n); S.ent(L.id).s.hv = 2.4;
    S.toast(`（${L.name}的墙在哼：松开 ${L.n} 个孔的音）`);
  }
  async function fwdCommit(S, L) {
    const f = S.f;
    if (L.river) return riverLane(S);
    if (L.k < f.band) return;
    if (L.k > f.band) return;
    if (L.ok) return fwdRight(S, L);
    return fwdWrong(S, L);
  }
  async function fwdRight(S, L) {
    const f = S.f;
    f.band++; f.wb = 0;
    [1, 2, 3].forEach(d => S.show('l_pet' + L.k + d));
    pipeNote(S, L.n, .5, .5); S.bubble('l_gr', '!', 1000);
    if (S.once('petals')) await S.narr('脚下的石缝里落着几片花瓣——黄的、白的，是孩子们头上的花环掉的。\n走对了。');
    else S.toast(`（${L.name}——花瓣。他走的是这条）`);
    S.goal(goalLane(S));
    if (f.band >= 4) await S.narr('最后一条巷子的尽头，就是东门。\n城门洞开着，门外的山坡上，笛声一声比一声远。');
    S.cp('lanes');
  }
  async function fwdWrong(S, L) {
    const f = S.f; f.wb = (f.wb || 0) + 1;
    const N = f.band + 2, want = TUNE[f.band + 1], R = okLane(f.band);
    S.tone('sine', 140, 110, .8, .08, 0, 600);
    S.place('l_shadow', L.x, L.top, 0); S.ent('l_shadow').alpha = .45; S.sfx('laugh');
    await S.wait(700); bg(S.alpha('l_shadow', 0, 500));
    await S.narr(`走进${L.name}没几步，墙里的嗡嗡声就停了。\n巷子尽头，红帽子一闪就不见了。地上没有花瓣，没有脚印。`);
    if (f.wb === 1) await S.think(`走错了。是第 ${N} 个音……回巷口听清楚再走。`);
    else if (f.wb === 2) await S.think(f.band === 2 ? '第四支笛子被蹭花了。\n五个音，一个不多，一个不少——石板上已经有的四个里，少了哪一个？' : `石板上第 ${N} 支笛子：数一数空着的孔。`);
    else {
      await S.narr(`格蕾特拽住你的袖子，把石板上第 ${N} 支笛子点给你看，又伸出 ${want} 根手指。`);
      if (f.wb >= 4) await S.narr(`然后她一瘸一拐地学着你的样子，走到${R.name}的巷口，冲你使劲招手。`);
    }
    await S.fade(1, 250);
    S.pos(L.x, L.top + 5, 3); S.place('l_gr', L.x + (L.x > 9 ? -1 : 1), L.top + 6, 3);
    await S.fade(0, 300);
  }
  async function riverLane(S) {
    const f = S.f;
    ratTune(S, 1.2); S.ent('l_humr').s.hv = 3;
    if (!f.ratWarn) {
      f.ratWarn = true; S.shake(500, 2);
      await S.narr('那支曲子钻进耳朵里——又尖又碎，像一千只小爪子在挠。\n你的腿自己往前迈了一步。又一步。河水的声音越来越近。');
      S.sfx('thud');
      await S.narr('一只手死死揪住了你的后领。\n格蕾特。她听不见那支曲子，她只看见你像梦游一样往河里走。');
      await S.fade(1, 250); S.pos(2, 27, 2); S.place('l_gr', 3, 27, 1); await S.fade(0, 300);
      await S.think('鱼门巷通到威悉河——那是老鼠的曲子。\n再靠近一次，就没有人拉得住我了。');
      return;
    }
    S.ent('l_humr').s.hv = 4;
    await S.narr('又是那支曲子。这一回，你连拐杖什么时候掉的都不知道。');
    await S.scare('face', { face: 'rats', sfx: 'scream' });
    await S.die('码头的石阶又湿又滑。河水漫过膝盖，漫过胸口——你一点也不觉得冷。\n灰绿色的威悉河里，有无数双红眼睛在等你。\n就像一个月前，那些老鼠一样。', '你跟着老鼠的曲子走了');
  }
  function backCommit(S, L) {
    const f = S.f;
    if (L.river) { loseChild(S, '鱼门巷'); S.pos(2, 27, 2); return; }
    if (L.k !== f.rb) return;
    f.rb--;
    if (L.ok) { willow(S, [L.n], .8); S.toast(`（${L.name}——对了。孩子们跟着你的柳笛声往前走）`); }
    else loseChild(S, L.name);
  }
  function loseChild(S, where) {
    const f = S.f, pre = S.map === 'hill' ? 'h_' : 'l_';
    if (f.tb.length <= 2) return;
    const b = f.tb.splice(f.tb.length - 2, 1)[0];
    f.lost = (f.lost || 0) + 1; f.lostAt = where;
    const e = S.ent(pre + b);
    if (e) bg((async () => { e.dir = 3; S.bubble(e.id, '…', 1500); S.sfx('cry'); for (let i = 0; i < 12; i++) { e.py -= TS / 6; e.fr = [1, 0, 3, 0][i % 4]; await S.wait(80); } await S.alpha(e.id, 0, 700); })());
    if (W.timer) backTimer(S, Math.max(.1, S.timerLeft - 3));
    piperTune(S, .9); S.shake(300, 1);
    S.toast(`（${where}——不对。队伍末尾二十来个孩子停下来，转过身，往山那边走回去了……）`);
  }

  async function kidOn(S, b) {
    const f = S.f;
    if (b === 'gr') {
      if (f.ph === 'fwd' || f.ph === 'hill') return S.note('slate');
      return S.narr('格蕾特走在队伍最后，冲你比了个手势：快走。\n她把一个想往回看的小男孩，轻轻推了回去。');
    }
    if (f.ph === 'hill' && !f.hstop) return S.narr(b === 'li' ? '你扯住莉泽尔的袖子。她轻轻一挣就挣开了，眼睛半闭着，嘴里跟着哼。\n她听不见你。' : '那孩子的眼睛半闭着，嘴角弯着，脚下一步也不停。\n你叫他的名字，他听不见。');
    if (b === 'li') return S.say('莉泽尔', ['哥哥，我刚才做了个梦。', '梦里有个好大的花园，花环怎么摘都摘不完……']);
    return S.narr('那孩子揉着眼睛，紧紧跟在前面的人后面，一步也不敢落下。');
  }

  /* ================= 山上 ================= */
  async function hillIntro(S) {
    const f = S.f;
    S.place('h_gr', W.pl.x, W.pl.y, 3); S.follow('h_gr', true); S.ent('h_gr').solid = false;
    f.hp = H_END - HV * T_HILL; placeLine(S, HKIDS, HPATH, f.hp, HGAP, false);
    S.focus(12, 5); S.ent('h_cave').open = true; rumble(S, .6);
    piperTune(S, .8);
    await S.narr('出了东门，是一面长满青草的山坡。坡顶那座光秃秃的科彭山——\n裂开了一道缝。缝里透出暖黄的光，像谁家的窗。');
    S.focus(10, 10);
    await S.narr('孩子们排成一长串，一个跟着一个往上走。头上的花环歪了，谁也不去扶。\n大人们说过的一百三十个……你数不过来，队伍一直排到雾里。\n队伍的最后，是莉泽尔。');
    S.focus(null);
    await S.think('路边那块平顶的回声石——小时候我们站在上面喊话，整座山都会回答。\n站在那儿吹，他们一定听得见。\n芭贝尔记下的歌：倒着吹，从最后一声，吹回第一声。');
    S.goal('在孩子们走进山之前，到回声石旁边，用柳笛把那支曲子倒着吹');
    if (S.coop) S.toast('双人：一人看石板念孔数（倒着念），一人吹');
    S.cp('hill');
    hillStart(S);
  }
  function hillStart(S) {
    const f = S.f; f.hstop = false;
    S.timer(T_HILL, '孩子们走进山里', hillTimeout, { during: true });
    f.hp = H_END - HV * T_HILL;
  }
  async function echoRock(S) {
    const f = S.f;
    if (f.ph !== 'hill' || f.hstop) return S.narr('平顶的回声石。你冲着山喊一声，山会把你的声音还回来。');
    const v = await S.keypad('柳笛（五个孔）　吹五个音\n数字 = 松开几个孔：1 最低 … 5 最高' + (f.kw >= 3 ? '\n（倒过来：' + REV.slice(0, Math.min(5, f.kw)).join(' · ') + (f.kw >= 4 ? '' : ' …') + '）' : ''), ['1', '2', '3', '4', '5'], 5, { sep: '·' });
    if (v == null) return;
    const seq = v.split('·').map(Number);
    willow(S, seq);
    await S.wait(2100);
    if (seq.join('') === REV.join('')) { REV.forEach((n, i) => { const fq = FREQ[n]; S.tone('triangle', fq, fq * .99, .5, .03, .25 + i * .4, 900); }); return stopKids(S); }
    if (seq.join('') === TUNE.join('')) {
      S.timerAdd(-8); S.sfx('laugh');
      await S.narr('……你吹的是他的调子。\n孩子们的脚步一下子快了，像有人在后面推。山缝里，有人笑出了声。');
      return;
    }
    f.kw = (f.kw || 0) + 1; S.timerAdd(-2);
    S.tone('sine', 220, 160, .6, .06, 0, 800);
    const H = ['孩子们的肩膀抖了一下，又接着往上走。\n（芭贝尔的歌：倒着吹——从最后一声，吹回第一声。）',
      '莉泽尔的脚步慢了半拍，又跟上了。\n（石板上最后一支笛子：松开 1 个孔。从它开始。）',
      `莉泽尔停了一下，好像要回头。\n（倒过来是：${REV.slice(0, 3).join(' · ')} …… 后面两个，是第二个音和第一个音。）`,
      `差一点。\n（倒过来就是：${REV.join(' · ')}）`];
    await S.narr(H[Math.min(H.length - 1, f.kw - 1)]);
  }
  async function stopKids(S) {
    const f = S.f; S.clearTimer(); f.hstop = true;
    HKIDS.forEach(id => { const e = S.ent(id); if (e && !e.hidden) e.fr = 0; });
    S.amb('none');
    await S.narr('笛声一出口就变了——像一支曲子被人拎着尾巴，倒着抖开。\n回声石把它送上了山坡，山又把它送了回来。');
    HKIDS.forEach(id => { const e = S.ent(id); if (e && !e.hidden) { e.dir = 0; S.bubble(id, '?', 1600); } });
    await S.narr('孩子们一个接一个停下了脚步。\n莉泽尔揉了揉眼睛，回过头来。');
    await S.say('莉泽尔', '……哥哥？');
    S.face('h_piper', 'pl'); S.focus(12, 6);
    await S.say('吹笛人', ['倒着吹。', '……谁教你的？'], { style: 'whisper' });
    await S.say('马蒂亚斯', '把他们还给我们。');
    await S.say('吹笛人', ['你们哈默林欠我的，还没还。', '我收我的账，有什么不对？']);
    const opts = S.has('ledger') ? ['（把老奥托撕下的那页账递给他）', '「我只有这支柳笛。」', '（放下柳笛，跟他走）'] : ['「我只有这支柳笛。」', '（放下柳笛，跟他走）'];
    let r = await S.ask('他在等你的回答。', opts, '马蒂亚斯');
    if (!S.has('ledger')) r++;
    if (r === 2) return badMountain(S, 'follow');
    if (r === 0) {
      f.paid = true; S.take('ledger');
      await S.narr('他接过那页纸，看了很久。\n「约定的酬金，分文未付。哈默林欠他的。书记员奥托作证。」');
      await S.say('吹笛人', ['……一个月了。', '整座城里，第一个肯写下这句话的人，是个瘸腿老头。', '好。账，我认了。']);
    } else await S.say('吹笛人', ['客栈墙上那一百三十道，是我一道一道画上去的。', '你们的议会说，一个吹笛子的，也配要钱？——那就看你的笛子了。']);
    S.focus(null);
    await S.say('吹笛人', ['我会再吹一遍。孩子们听谁的，就跟谁走。', '你走错一条巷子，就有一群回到我这儿来。' + (f.paid ? '\n……我吹得慢一点。' : '')]);
    await backStart(S);
  }
  async function backStart(S) {
    const f = S.f;
    f.ph = 'back'; f.tb = TBASE.slice(); f.lost = 0; f.rb = 3; f._bt = 3;
    S.follow('h_gr', false);
    await S.fade(1, 400);
    HKIDS.forEach(id => S.hide(id));
    S.pos(10, 14, 0);
    trailPlace(S, 'h_', [[11, 7], [11, 8], [11, 9], [11, 10], [11, 11], [11, 12], [11, 13], [10, 13], [10, 14]]);
    await S.fade(0, 400);
    LANES.filter(L => L.ok).forEach(L => [1, 2, 3].forEach(d => S.hide('l_pet' + L.k + d)));
    await S.narr('莉泽尔跑下来，攥住了你的手。孩子们在你身后排成一长串，格蕾特走在最后，把掉队的往前推。\n山缝里，笛声又响了。');
    await S.narr('一阵山风从东门灌进城里。巷子里那些花瓣，一片也不剩了。');
    if (S.coop) S.toast('双人：一人记着巷子的顺序报方向，一人带路');
    S.goal('带孩子们回广场：倒着走他来时的路（东门 → 东城根小巷 … → 广场）');
    S.cp('back');
    backTimer(S);
  }
  function backTimer(S, left) { const n = S.f.lost || 0; S.timer(left ?? T_BACK + (S.f.paid ? T_PAID : 0), '山上的笛声' + (n ? ` · 走散 ${n} 队` : ''), S2 => badMountain(S2, 'back'), { during: true }); }
  async function hillTimeout(S) { await badMountain(S, 'hill'); }

  /* ================= 结局 ================= */
  async function badMountain(S, why) {
    const f = S.f; S.clearTimer(); f.over = true;
    S.amb('none'); rumble(S);
    if (why === 'hill') {
      await S.narr('最后一个走进山缝的，是莉泽尔。\n她在缝口停了一下，回过头来——');
      await S.scare('face', { face: 'liesel', sfx: 'whisper' });
      await S.narr('她在笑。她在跟着哼那支曲子。\n然后她转过身，走进了那片暖黄的光里。');
    } else if (why === 'back') {
      await S.narr('山上的笛声忽然拔高了。\n身后的脚步声停了。你回过头——孩子们一个接一个松开了手，转过身，往东门走回去。');
      await S.scare('face', { face: 'liesel', sfx: 'whisper' });
      await S.narr('莉泽尔也松开了你。她的手很凉，眼睛半闭着，嘴里在哼。');
    } else {
      await S.narr('你放下了柳笛。\n笛声又响起来的时候，你才发现——它原来这么好听。');
      await S.scare('face', { face: 'piper', sfx: 'sting' });
    }
    await S.narr('你拄着拐杖，一步一步跟了上去。伤腿一点也不疼了。\n身后，山缝慢慢合上。');
    const cv = S.ent('h_cave'); if (cv) cv.open = false; rumble(S, 1.2); S.shake(900, 3);
    await S.fade(1, 1400);
    const tail = why === 'follow' ? '后来城里的人说，那个瘸腿的孩子是自己放下笛子的。\n他们说起这件事的时候，总是压低了声音，好像怕谁听见：\n「他说，那是他听过的最好听的曲子。」' : '很多年以后，有人说，在很远很远的东方，七座山中间的一个山洞里，走出来一群说着奇怪口音的人。\n他们中间有一个瘸腿的，走得很慢，手里攥着一支柳笛。';
    await S.end({ bad: true, id: 'mountain', title: '走进山里', text: '那年的约翰与保罗日，哈默林丢了一百三十个孩子。\n格蕾特站在山坡上，看着那道缝合上。她听不见里面的笛声，也没有人听得懂她比划的话。\n\n' + tail });
  }
  async function finale(S) {
    const f = S.f; S.clearTimer(); f.ph = 'done'; lightAll(S);
    S.amb('wind');
    const kids = f.tb.filter(b => b !== 'li' && b !== 'gr');
    S.place('s_li', 13, 5, 0); S.place('s_gr', 15, 5, 0);
    const spots = [[12, 6], [16, 6], [13, 7], [15, 7], [14, 6]];
    ['k1', 'k2', 'k3', 'k4', 'k5'].forEach(b => S.hide('s_' + b));
    kids.forEach((b, i) => { const p = spots[i]; S.place('s_' + b, p[0], p[1], 0); S.ent('s_' + b).solid = false; });
    S.follow('s_gr', false); S.ent('s_gr').solid = false;
    S.place('s_hans', 20, 8, 1); S.ent('s_hans').spr = '@hans2'; S.place('s_bb', 11, 6, 0);
    S.pos(14, 4, 0);
    await S.narr('你从巷子里走出来，后面跟着一长串孩子。\n广场上的阳光白得晃眼。');
    S.sfx('open'); S.ent('s_chdoor').open = true;
    for (let i = 0; i < 3; i++) bell(S, .8, i * .9);
    await S.narr('教堂的门开了——弥撒散了。\n大人们走出来，一眼看见满广场站着的孩子，愣在台阶上。');
    S.place('s_mom', 4, 4, 0); await S.walk('s_mom', [12, 5], 3.4); S.face('s_mom', 2);
    await S.say('娘', '莉泽尔？……你们怎么都在这儿？头发上怎么全是草？');
    S.face('s_li', 'pl');
    await S.say('莉泽尔', '娘，哥哥吹笛子了。吹得可难听了。');
    S.face('s_hans', 'pl'); S.bubble('s_hans', '!', 1000);
    await S.say('小汉斯', '（穿着那件有铜扣子的新外套，热得满头汗）马蒂亚斯！我拿了外套出来，你们都不见了——我在这儿等了一上午！');
    if (f.lost > 0) return endSilent(S);
    if (f.paid) return endDebt(S);
    return endHome(S);
  }
  async function endHome(S) {
    await S.narr('没有人相信你。大人们只当孩子们趁着弥撒，跑到城外疯了一上午。\n格蕾特在石板上画了五支小笛子，给每个大人看。他们摸摸她的头，走开了。');
    await S.fade(1, 1200);
    await S.card('那天夜里', '', '圣约翰之火照常点了起来。\n孩子们围着火堆跳舞，一个接一个跳过火焰。\n\n你坐在火边，没有跳。\n东边的山上，好像有人在吹笛子，\n很轻，很远。\n\n莉泽尔跳过来，把她的花环扔进了火里。');
    await S.end({ id: 'home', title: '第十六夜　完', text: '议会从来没有付过那笔钱。\n\n后来，每到约翰与保罗日，你都会拄着拐杖爬上那面山坡，在回声石上坐一整天。\n山缝再也没有开过。\n\n城里的老人说，那天他吹着笛子走过的东城根小巷，从此不该再有乐声——婚礼的队伍走到那里，也都停下鼓乐，静悄悄地走过去。人们管它叫「无鼓巷」。\n\n可是有一年，你在回声石上发现了一根红羽毛。\n羽毛底下压着一张纸条：「账还没清。」' });
  }
  async function endDebt(S) {
    await S.narr('老奥托拄着拐杖，一瘸一拐地走到议员们跟前，把他那本账簿摊开在台阶上。\n最后一页被撕掉了。他就站在那儿，当着全城人的面，把那笔账一个字一个字地念了出来。');
    await S.narr('议员们的脸一阵红一阵白。');
    await S.fade(1, 1200);
    await S.card('那天夜里', '', '圣约翰之火照常点了起来。\n孩子们围着火堆跳舞，一个接一个跳过火焰。\n\n火光照不到的东门外，有人吹了一段笛子。\n不是那支曲子。是一支很普通的、\n乡下人赶集时哼的小调。\n\n然后，就再也没有响过。');
    await S.end({ id: 'debt', title: '第十六夜　完', text: '第二年，市议会在城里的书上添了一行字：「约定的酬金，分文未付。哈默林欠他的。」\n据说那是全城第一次，有人肯把自己赖掉的账写下来。\n\n很多年以后，你成了城里最好的鞋匠。\n你给每一个瘸腿的孩子都做一双鞋，左右两只不一样高——\n这样，他们就跟得上了。' });
  }
  async function endSilent(S) {
    const f = S.f, n = f.lost * KIDN;
    await S.narr(`可是人群里，有的母亲一直在喊，一直在找。\n回来的孩子里，少了 ${n} 个。`);
    await S.narr(`有人说，最后看见他们，是在${f.lostAt || '那条巷子'}的巷口。\n他们停下来，转过身，往东门走回去了，谁也拉不住。`);
    await S.fade(1, 1200);
    await S.card('那天夜里', '', '圣约翰之火没有点。\n\n广场上只有哭声。\n你坐在家门口，攥着那支柳笛，\n一下也没有吹。');
    await S.end({ id: 'silent', title: '第十六夜　完', text: `从那以后，孩子们最后走过的那条东城根小巷，再也不许敲鼓、吹笛、唱歌。\n连路过的婚礼队伍走到这里，乐手也要停下来，安安静静地走过去。\n人们管它叫「无鼓巷」。\n\n城里的书上写着：「1284年，约翰与保罗日，${n} 个生在哈默林的孩子，被一个穿花衣的吹笛人引走，没有回来。」\n后面一行是你的笔迹，很小，很小：「是我走错了。」` });
  }
})();
