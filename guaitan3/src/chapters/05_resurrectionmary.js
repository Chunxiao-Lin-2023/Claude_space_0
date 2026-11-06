/* ================= 第五夜 · 复活玛丽 ================= */
(() => {
  /* ---------- 地图生成小工具 ---------- */
  const G = (w, h, c) => Array.from({ length: h }, () => Array(w).fill(c));
  const F = (g, x0, y0, x1, y1, c) => { for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) g[y][x] = c; };
  const ROWS = g => g.map(r => r.join(''));

  /* 蓝鹭舞厅（1979 / 1934 同一个格局）：24×15 */
  function hallRows() {
    const g = G(24, 15, 'c');
    F(g, 0, 0, 23, 1, '#'); F(g, 0, 14, 23, 14, '#');
    for (let y = 0; y < 15; y++) { g[y][0] = '#'; g[y][23] = '#'; }
    g[14][11] = 'n'; g[14][12] = 'n';
    F(g, 8, 2, 15, 3, 'S');            // 乐台
    F(g, 6, 5, 16, 11, 'p');           // 舞池
    F(g, 19, 2, 22, 13, 'W'); F(g, 19, 3, 19, 8, 'C');   // 吧台
    F(g, 1, 13, 4, 13, 'W'); F(g, 1, 12, 3, 12, 'C');    // 衣帽间
    return ROWS(g);
  }
  /* 阿彻大道：72×16 —— 西头舞厅 / 树林 / 复活公墓（路北）/ 旋律酒馆（路南） */
  function roadRows() {
    const g = G(72, 16, 'v');
    F(g, 0, 0, 10, 4, '#');                                  // 舞厅外墙
    for (let y = 0; y < 5; y++) for (let x = 11; x < 46; x++) g[y][x] = hash(x, y, 5) < .62 ? 'Y' : 'v';
    F(g, 0, 5, 10, 5, '_'); F(g, 11, 5, 45, 5, 'S');
    F(g, 46, 5, 71, 5, 'F'); g[5][56] = 'v'; g[5][57] = 'v';  // 公墓铁栅栏，大门两格
    for (const [x, y] of [[47, 1], [49, 3], [64, 0], [69, 2], [71, 4], [46, 0]]) g[y][x] = 'Y';
    for (let x = 0; x < 72; x++) { g[6][x] = '_'; g[7][x] = ':'; g[8][x] = '='; g[9][x] = ':'; g[10][x] = '_'; }
    F(g, 0, 11, 51, 11, 'S'); F(g, 61, 11, 71, 11, 'S');
    F(g, 52, 11, 60, 15, 'Q');                               // 旋律酒馆的屋顶
    for (let y = 12; y < 16; y++) for (let x = 0; x < 72; x++) if (x < 52 || x > 60) g[y][x] = hash(x, y, 9) < .3 ? 'Y' : 'v';
    return ROWS(g);
  }
  const RLEG = { 'v': 'snow', 'Y': 'spine', 'S': 'snowbank', 'F': 'ifence', 'Q': 'roof' };
  const HLEG = { 'p': 'parq', 'S': { t: 'darkwood', solid: true } };

  /* ---------- 曲子（S.tone 合成；三拍子低音嘭-嚓-嚓） ---------- */
  const SONGS = {
    fox: { meter: 4, mel: [[523, 1], [587, 1], [659, 2], [784, 2], [659, 2], [587, 1], [523, 1], [440, 2], [392, 4], [440, 1], [523, 1], [587, 2], [659, 2], [587, 1], [523, 1], [494, 2], [587, 2], [523, 4]], bass: [131, 131, 110, 98, 87, 131, 98, 131] },
    waltz: { meter: 3, mel: [[392, 3], [440, 2], [494, 1], [523, 3], [587, 2], [523, 1], [494, 3], [440, 2], [392, 1], [440, 3], [494, 2], [440, 1], [392, 3], [392, 3]], bass: [98, 98, 131, 147, 98, 147, 110, 147, 98, 98] },
    /* 《银色的月亮》：玛丽点的那一支（游戏虚构的曲子） */
    silver: { meter: 3, mel: [[659, 2], [587, 1], [523, 3], [392, 2], [440, 1], [523, 3], [587, 2], [659, 1], [698, 2], [659, 1], [587, 3], [494, 3], [659, 2], [587, 1], [523, 3], [440, 2], [523, 1], [698, 3], [659, 2], [587, 1], [523, 1], [494, 1], [440, 1], [494, 3], [523, 3]], bass: [131, 131, 98, 131, 147, 175, 98, 98, 131, 110, 175, 175, 131, 110, 98, 131] },
    night: { meter: 4, mel: [[523, 2], [440, 1], [392, 1], [349, 2], [392, 2], [440, 2], [392, 2], [523, 4]], bass: [131, 87, 98, 131] }
  };
  function playSong(S, key, o = {}) {
    const s = SONGS[key], B = o.beat || .42, bars = Math.min(o.bars ?? s.bass.length, s.bass.length), M = s.meter, d0 = o.delay || 0, vol = o.vol ?? .03, lp = o.lp ?? 1300, type = o.type || 'triangle';
    let b = 0;
    for (const [f, n] of s.mel) { if (b >= bars * M) break; S.tone(type, f, f, n * B * .92, vol, d0 + b * B, lp); b += n; }
    if (o.bass !== false) for (let i = 0; i < bars; i++) {
      const r = s.bass[i]; S.tone('triangle', r, r, B * .9, vol * 1.3, d0 + i * M * B, 600);
      for (let k = 1; k < M; k++) S.tone('triangle', r * 2, r * 2, B * .4, vol * .45, d0 + (i * M + k) * B, 900);
    }
    return bars * M * B;
  }
  const horn = S => { S.tone('sawtooth', 300, 430, .26, .07, 0, 1600); S.tone('sawtooth', 430, 250, .45, .07, .27, 1600); S.tone('square', 150, 215, .26, .03, 0, 900); S.tone('square', 215, 125, .45, .03, .27, 900); };

  /* ---------- 跳舞小游戏 ----------
     地板上亮起一双脚印，一圈光往脚印上收拢；光圈收拢、低音「嘭」落下的那一拍走上去。
     判定只看「走到了哪一格、什么时候到」：早了（抢拍）、晚了、走错格（踩脚）都算失误。
     状态放在 W._dn（只在主机、只在这一段里用，重来时随世界一起清掉）。 */
  const ZONE = (x, y) => x >= 7 && x <= 15 && y >= 5 && y <= 10;
  const DANCE = {
    d1: { song: 'fox', beat: .5, per: 4, n: 8, need: 5, early: 99, pat: [3, 2, 0, 1] },
    d2: { song: 'waltz', beat: .42, per: 3, n: 10, need: 7, early: .42, pat: [3, 2, 0, 1, 0, 1, 3, 2, 1, 2] },
    final: { song: 'silver', beat: .4, per: 3, n: 16, need: 11, early: .36, pat: [3, 2, 0, 1, 1, 1, 0, 2, 2, 3, 3, 1, 0, 0, 2, 3] }
  };
  let failN = { d1: 0, d2: 0 }, carDeaths = 0;
  const GHOSTS = ['v1a', 'v1b', 'v2a', 'v2b', 'v3a', 'v3b', 'v4a', 'v4b'];
  function buildMel(key) { const out = {}; let b = 0; for (const [f, n] of SONGS[key].mel) { (out[b] = out[b] || []).push([f, n]); b += n; } return out; }
  function startDance(S, kind, mary) {
    const C = DANCE[kind], f = S.f;
    let need = C.need;
    if (kind === 'final') need = clamp(11 + Math.min(2, f.wrong || 0) - 2 * (f.vfail || 0), 8, 13);
    else need = Math.max(C.need - 2, C.need - failN[kind]);
    W._dn = { kind, mary, map: W.mapId, beat: C.beat, per: C.per, n: C.n, need, early: C.early, late: .3, pat: C.pat, song: C.song, mel: buildMel(C.song),
      ci: C.per, t0: W.t + .7, nb: 0, i: 0, hits: 0, miss: 0, res: null, tgt: null, last: null, hold: -1, T: 0, over: false, off: [0, -1], said: {}, streak: 0 };
    const M = S.ent(mary); M.solid = false;
    S.pos(11, 9, 3); S.place(mary, 11, 8, 0);
    getEnt('dmark', W.mapId).s = { per: C.per };
    if (kind === 'final') for (const id of GHOSTS) { const e = getEnt(id, W.mapId); if (e) e.alpha = .3; }
    S.norun(true);
    S.goal(kind === 'final' ? '最后一支舞：光圈收拢、低音落下的那一拍，踩上脚印（' + need + '/' + C.n + '）' : '跳舞：光圈收拢、低音落下的那一拍，踩上发亮的脚印（' + need + '/' + C.n + '）');
  }
  function pickTarget(D, x, y) {
    const m = curMap(), d0 = D.pat[D.i % D.pat.length], ord = [d0, 3 - d0, (d0 + 1) % 4, (d0 + 2) % 4, (d0 + 3) % 4];
    for (const d of ord) {
      const nx = x + DIRS[d][0], ny = y + DIRS[d][1];
      if (ZONE(nx, ny) && ZONE(nx + D.off[0], ny + D.off[1]) && passable(m, nx, ny, W.pl)) return [nx, ny];
    }
    return [x + Math.sign(11 - x), Math.abs(9 - y) > 0 ? y + Math.sign(9 - y) : y];   // 跑出舞池了：往中间引
  }
  /* 玛丽领舞：脚印一亮，她先挪到「脚印 + 她的站位」（往后退、往旁边让），不会挡住脚印；
     只有往下（朝她反方向）那一步要等你先离开原地，她再跟上 */
  function maryTo(D, tx, ty) {
    const M = getEnt(D.mary, D.map); if (!M) return;
    const mx = Math.round(M.px / TS), my = Math.round(M.py / TS);
    if (mx === tx && my === ty) return;
    const dd = DIRS.findIndex(d => d[0] === tx - mx && d[1] === ty - my);
    if (dd >= 0 && !M.mv) startMove(M, dd, 9); else { M.mv = null; M.px = tx * TS; M.py = ty * TS; M.x = tx; M.y = ty; }
    M.dir = 0;
  }
  function nextDir(D, x, y) {   // 旁观的人看到的「再下一步」方向
    const save = D.i; D.i = save + 1; const t = pickTarget(D, x, y); D.i = save;
    return DIRS.findIndex(d => d[0] === t[0] - x && d[1] === t[1] - y);
  }
  function maryFollow(D, p) {
    const M = getEnt(D.mary, D.map); if (!M) return;
    const tx = p.x + D.off[0], ty = p.y + D.off[1], mx = Math.round(M.px / TS), my = Math.round(M.py / TS);
    if (mx === tx && my === ty) return;
    const dd = DIRS.findIndex(d => d[0] === tx - mx && d[1] === ty - my);
    if (dd >= 0 && !M.mv) startMove(M, dd, 9); else { M.mv = null; M.px = tx * TS; M.py = ty * TS; M.x = tx; M.y = ty; }
    M.dir = 0;
  }
  const MISS = { early: '早了——等光圈收拢、「嘭」的那一下再落脚', wrong: '踩到她的脚了——只走亮着的那一格', late: '慢了半拍——光圈快收拢时就该动身' };
  function judge(S, D, r) {
    const mk = getEnt('dmark', D.map);
    if (r === 'hit') {
      D.hits++; D.streak++; D.res = 'hit'; mk.s.res = 1; if (D.streak % 4 === 0) S.bubble(D.mary, '♥', 700); S.tone('sine', 1320, 1320, .07, .02, 0, 3000);
      if (D.kind === 'final') for (const id of GHOSTS) { const e = getEnt(id, D.map); if (e) e.alpha = Math.min(.95, .3 + .65 * D.hits / D.n); }   // 每踩对一步，舞池里的人就更清楚一点
    }
    else {
      D.miss++; D.streak = 0; D.res = r; mk.s.res = 2; S.bubble(D.mary, '…', 600);
      if (!D.said[r]) { D.said[r] = true; S.toast(MISS[r]); }
      if (D.kind !== 'd1') S.tone('sine', 196, 150, .18, .03, 0, 800);
    }
    mk.s.rt = W.t;
  }
  function playBeat(S, D, b) {
    const B = D.beat, s = SONGS[D.song], M = s.meter;
    if (b < D.ci) { S.tone('square', b === 0 ? 1600 : 1150, b === 0 ? 1600 : 1150, .03, .035, 0, 4200); return; }   // 领班数拍子：一、二、三
    const m = b - D.ci, bar = Math.floor(m / M), pos = m % M;
    if (bar >= s.bass.length) return;
    const r = s.bass[bar], fin = D.kind === 'final';
    if (pos === 0) S.tone('triangle', r, r, B * .9, .06, 0, 700);
    else if (M === 4 && pos === 2) S.tone('triangle', r * 1.5, r * 1.5, B * .8, .04, 0, 700);
    else { S.tone('triangle', r * 2, r * 2, B * .4, .022, 0, 1000); S.tone('triangle', r * 2.52, r * 2.52, B * .4, .015, 0, 1000); }
    const ns = D.mel[m];
    if (ns) for (const [f, n] of ns) { S.tone(fin ? 'triangle' : 'square', f, f, n * B * .92, fin ? .055 : .028, 0, fin ? 1100 : 1500); if (fin) S.tone('sine', f * 2, f * 2, n * B * .6, .012, 0, 2400); }
  }
  function danceTick(S, dt) {
    const D = W._dn; if (!D || D.over || W.mapId !== D.map) return;
    if (S.busy) { D.t0 += dt; return; }   // 有剧本在跑（比如误按了调查）：整支舞暂停
    const t = W.t - D.t0, B = D.beat, p = W.pl, mk = getEnt('dmark', D.map);
    if (t >= 0) { const bi = Math.floor(t / B); while (D.nb <= bi) playBeat(S, D, D.nb++); }
    const key = p.x + ',' + p.y;
    if (D.last == null) D.last = key;
    if (mk.s.res && W.t - (mk.s.rt || 0) > .3) mk.s.res = 0;
    if (D.i < D.n) {
      const Ti = (D.ci + D.i * D.per) * B, Ai = Ti - D.per * B;
      if (!D.tgt && t >= D.hold) {
        D.tgt = pickTarget(D, p.x, p.y); D.res = null; D.T = Ti; mk.hidden = false; mk.s.res = 0; mk.px = D.tgt[0] * TS; mk.py = D.tgt[1] * TS; mk.x = D.tgt[0]; mk.y = D.tgt[1];
        mk.s.nd = D.i + 1 < D.n ? nextDir(D, D.tgt[0], D.tgt[1]) : -1;
        const mx = D.tgt[0] + D.off[0], my = D.tgt[1] + D.off[1];
        if (!(mx === p.x && my === p.y)) maryTo(D, mx, my);
      }
      if (D.tgt) { mk.s.ph = Math.round(clamp((t - Ai) / (Ti - Ai), 0, 1) * 50) / 50; mk.s.bt = clamp(Math.floor((t - Ai) / B + .001), 0, D.per - 1); }
      if (key !== D.last) {
        D.last = key; maryFollow(D, p);
        if (D.tgt && D.res == null) {
          if (p.x === D.tgt[0] && p.y === D.tgt[1]) {
            judge(S, D, t >= Ti - D.early ? 'hit' : 'early');
            if (D.kind === 'd1' && t < Ti - .42 && !D.said.e1) { D.said.e1 = true; S.toast('早到也算——不过下一支华尔兹，早到就算抢拍了'); }
          } else judge(S, D, 'wrong');
        }
      }
      if (D.tgt && D.res == null && t > Ti + D.late) judge(S, D, 'late');
      if (D.tgt && D.res != null && t >= Ti) { D.i++; D.tgt = null; D.hold = t + .16; }
    } else {
      if (key !== D.last) { D.last = key; maryFollow(D, p); }
      if (t >= (D.ci + D.n * D.per) * B - .2) { D.over = true; mk.hidden = true; S.run(S2 => endDance(S2, D)); }
    }
  }
  /* 舞厅里的乐队：狐步无缝循环，一拍排一拍（跳舞一开始就停）；按离乐台的远近调音量和低通 */
  const BAND = { mel: buildMel('fox'), len: 32 };
  function bandTick(S, dt) {
    W._bgt = (W._bgt ?? 0) + dt; if (W._bgt < .5) return; W._bgt -= .5;
    const b = W._bgb = ((W._bgb ?? -1) + 1) % BAND.len, s = SONGS.fox, bar = Math.floor(b / 4), pos = b % 4, r = s.bass[bar];
    const dist = Math.abs(S.pl.x - 11) + Math.max(0, S.pl.y - 3), k = clamp(1 - dist / 16, .25, 1), v = .03 * k, lp = 500 + 1300 * k;
    if (pos === 0 || pos === 2) S.tone('triangle', pos ? r * 1.5 : r, pos ? r * 1.5 : r, .45, v * 1.4, 0, 600);
    else S.tone('triangle', r * 2, r * 2, .2, v * .5, 0, lp);
    const ns = BAND.mel[b]; if (ns) for (const [f, n] of ns) S.tone('square', f, f, n * .5 * .9, v * .8, 0, lp);
  }
  /* 舞池里其他人跟着拍子轻轻晃 */
  function swayTick(S, ids, dt) {
    W._sw = (W._sw || 0) + dt; if (W._sw < .55) return; W._sw = 0;
    const ph = W._swp = !W._swp;
    for (const [a, b, da, db] of ids) { const A = getEnt(a, W.mapId), Bq = getEnt(b, W.mapId); if (A && !A.hidden) A.dir = ph ? da : (da === 0 || da === 3 ? 1 : 0); if (Bq && !Bq.hidden) Bq.dir = ph ? db : (db === 0 || db === 3 ? 2 : 3); }
  }

  async function endDance(S, D) {
    const f = S.f, M = S.ent(D.mary), ok = D.hits >= D.need;
    W._dn = null; S.norun(false);
    S.hide('dmark');
    M.solid = D.kind !== 'final'; M.mv = null; M.px = Math.round(M.px / TS) * TS; M.py = Math.round(M.py / TS) * TS;
    S.face(D.mary, 'pl'); S.face('pl', D.mary);
    await S.wait(300);
    await S.narr('（' + D.hits + ' / ' + D.n + ' 步踩在拍子上' + (ok ? '。）' : '，至少要 ' + D.need + ' 步。）'));
    if (D.kind === 'd1') return ok ? afterD1(S) : failDance(S, 'd1');
    if (D.kind === 'd2') return ok ? afterD2(S) : failDance(S, 'd2');
    return ok ? finaleOK(S) : finaleFail(S);
  }
  async function failDance(S, kind) {
    failN[kind]++;
    await S.say('玛丽', kind === 'd1' ? ['……你踩了我好几脚。', '没关系。跟着低音走——「嘭」的那一下再落脚。'] : ['华尔兹是三拍子，嘭、嚓、嚓。', '只在「嘭」上迈步。早一点也不行。']);
    const r = await S.ask('她还握着你的手。冰凉。', ['再来一次', '先歇会儿'], '米克');
    if (r === 0) return startDance(S, kind, 'mary');
    S.place('mary', 17, 7, 1); S.face('mary', 1);
    S.goal(kind === 'd1' ? '找舞池边的玛丽再跳一次' : '找舞池边的玛丽，再跳一次华尔兹');
  }

  /* ---------- 舞厅里的人 ---------- */
  function rot(S, key, lines) { const i = S.f[key] = ((S.f[key] ?? -1) + 1) % lines.length; return lines[i]; }
  async function joeTalk(S) {
    const f = S.f;
    S.face('joe', 'pl');
    if (f.ph === 'back') return joeBack(S);
    if (!f.pin) {
      f.pin = true;
      await S.narr('老酒保六十多岁，瘦，背挺得笔直。白衬衫，黑马甲，黑领结。\n领结上别着一枚小小的月牙别针，镀金都磨掉了。');
      await S.say('乔', ['喝点什么？', '……开车的话，就来杯热的。']);
      return;
    }
    if (f.ph === 'leave') return S.say('乔', '……', { style: 'whisper' });
    await S.say('乔', rot(S, '_jl', [
      '这家舞厅一九二一年就开了。先是露天的，后来才盖了顶。',
      '我在这儿干了四十五年。洗杯子，倒酒。……一支舞也没跳过。',
      ['（他朝舞池边上看了一眼，又飞快地把目光挪开。）', '……别问我。'],
      '外头雪大。今晚回去，别走阿彻大道。'
    ]));
  }
  async function weiTalk(S) {
    const f = S.f;
    S.face('wei', 'pl');
    if (f.d1 && S.once('weiSaw')) {
      S.bubble('wei', '?', 1200);
      return S.say('老韦', ['……刚才跟你跳舞那姑娘是谁？', '灯太暗，我就看见一条白裙子在那儿转。脸愣是没看清。']);
    }
    if (S.once('weiStory')) {
      await S.say('老韦', ['小米克？你也来这儿跳舞？哈。', '跑夜班的规矩，你师傅没跟你讲过？阿彻大道上，金头发、白裙子、不穿大衣的姑娘招手——别停。']);
      await S.say('老韦', ['我拉过她一回。七三年冬天，就在这舞厅门口。', '她说往阿彻大道开。开到复活公墓门口，她说：停车。', '我一回头，后座空了。车门锁得好好的。']);
      await S.say('老韦', '第二天我去洗车。洗车的问我：后座上这一摊冰水是怎么回事？');
      return;
    }
    await S.say('老韦', rot(S, '_wl', [
      '公墓对面有家旋律酒馆。拉过她的司机，后来都爱往那儿跑。',
      '有人说她是三十年代死的。跟男朋友吵了架，一个人走回家，叫车撞了。',
      '我不怕她。我就是……不愿意再看见后视镜里那个空座位。'
    ]));
  }
  async function coatTalk(S) {
    await S.say('衣帽间的姑娘', rot(S, '_cl', [
      ['存大衣吗？……你说那个穿白裙子的？', '她从来不存大衣。十二月啊，光着两条胳膊。'],
      '我在这儿干了三年，她来过好几回。每回都一个人，站在舞池边上，一直等到打烊。',
      '有一回我摸到她的手。……跟刚从窗台上抓了一把雪似的。'
    ]));
  }
  async function leaderTalk(S) {
    S.face('leader', 'pl');
    if (S.f.ph === 'leave') return S.say('领班', '晚安，小伙子。路上滑。');
    await S.say('领班', rot(S, '_ll', [
      ['点歌？今晚的单子排满了。', '……那位小姐？她每回都点同一首，三十年代的老曲子。我们乐队没那个谱子。'],
      '曲名？……好像带个「月」字。记不清了。我师父那辈人才会拉。',
      '这台上站过的乐队，比你见过的出租车还多。'
    ]));
  }

  /* ---------- 和玛丽跳舞 ---------- */
  async function maryTalk(S) {
    const f = S.f;
    if (W._dn) return;
    S.face('mary', 'pl');
    if (f.d1) {
      await S.say('玛丽', '华尔兹……再跳一支吗？');
      if (await S.ask('她朝你伸出手。', ['好', '等等'], '米克')) return;
      return startDance(S, 'd2', 'mary');
    }
    if (!f.met) {
      f.met = true;
      await S.narr('她穿着一条白色的长裙，是老电影里才有的那种样式。金色的短发烫成一道一道的波浪。\n这么冷的天，她光着两条胳膊。');
      await S.say('米克', '……嗨。一个人？');
      await S.say('玛丽', ['我在等人。', '……他大概不会来了。']);
      const r = await S.ask('她看着舞池，脚尖跟着拍子，一下一下点着地板。', ['要跳一支吗？', '等谁？'], '米克');
      if (r === 1) { await S.say('玛丽', '等一个说好陪我跳舞的人。'); await S.say('米克', '那……我先替他一会儿？'); }
      await S.say('玛丽', '你会跳狐步吗？');
      await S.narr('她把手放进你手里。\n冰凉。像攥住了一把刚从窗台上抓来的雪。');
      await S.narr('（跳舞：地板上会亮起一双脚印，一圈光慢慢往它收拢。\n光圈收拢、低音「嘭」落下的那一拍，走到脚印上。一拍一步，别踩她的脚。）');
      if (S.coop) S.toast('联机：旁观的人可以跟着低音大声数拍子');
    } else {
      await S.say('玛丽', '再试一次？');
      if (await S.ask('她朝你伸出手。', ['好', '等等'], '米克')) return;
    }
    startDance(S, 'd1', 'mary');
  }
  async function afterD1(S) {
    const f = S.f; f.d1 = true;
    await S.say('玛丽', '你跳得不坏。');
    await S.say('米克', '我叫米克。开出租的。');
    await S.say('玛丽', '玛丽。');
    const r = await S.ask('她的手还搭在你手心里，一点也没有暖过来。', ['你的手怎么这么冰？', '你住附近吗？'], '米克');
    await S.say('玛丽', r === 0 ? '外头下雪呀。我走了很远的路。' : '阿彻大道那头。不远……走着就能到。');
    S.cp();
    await S.say('领班', '下面一支——华尔兹！');
    S.bubble('mary', '!', 900);
    await S.say('玛丽', ['华尔兹……', '他从来不肯陪我跳华尔兹。']);
    const r2 = await S.ask('她看着你。', ['那我陪你跳', '我不太会华尔兹'], '米克');
    if (r2 === 1) await S.say('玛丽', '一、二、三。跟着我就行。');
    await S.narr('（华尔兹是三拍子：嘭、嚓、嚓。只在「嘭」上迈步——这回提前站上去，也算抢拍。）');
    startDance(S, 'd2', 'mary');
  }
  async function afterD2(S) {
    const f = S.f; f.d2 = true;
    await S.say('玛丽', ['那天晚上，我点了最后一支舞，一支华尔兹。他说他不会跳，说我当着那么多人让他出丑。', '我们吵起来了。他一个人开车走了，把我丢在这儿。']);
    await S.say('米克', '……那天晚上？');
    S.bubble('mary', '…', 1200);
    await S.say('玛丽', '……今天晚上。我是说今天晚上。');
    const d = playSong(S, 'night', { beat: .45, vol: .03, type: 'square', lp: 1400 });
    await S.narr('领班凑到话筒前：「女士们先生们——今晚的最后一支舞！」\n乐队奏起一支慢悠悠的《晚安曲》。');
    await S.wait(Math.min(2500, d * 600));
    await S.say('玛丽', '……不是这首。', { style: 'whisper' });
    for (let i = 0; i < 6; i++) S.tone('sine', 523, 520, 1.4, .05, i * .9, 2000);
    S.dark(.12); S.sfx('switch');
    await S.narr('墙上的钟敲了十二下。大灯一下子全亮了，照得舞池白晃晃的。\n「谢谢各位，晚安！路上滑，开车小心！」');
    await S.say('玛丽', ['十二点了？我得回家了。妈妈说，十二点以前一定要到家。', '你能送我吗？沿着阿彻大道一直开，就到了。']);
    const r = await S.ask('她看着你。舞厅里的人正一对一对往外走。', ['我的车就在门口', '这么晚了，没人来接你？'], '米克');
    if (r === 1) await S.say('玛丽', '没有人来接我。从来没有。');
    S.sfx('glass'); S.bubble('joe', '!', 1500); S.shake(200, 1);
    await S.narr('吧台那边「啪」的一声。老酒保手里的杯子掉在地上，碎了。\n他死死盯着玛丽，脸白得跟吧台上的抹布一样。玛丽没有回头，朝门口走去。');
    S.ent('mary').solid = false;
    await S.walk('mary', [11, 13], 3);
    await S.alpha('mary', 0, 500);
    getEnt('marya', 'archer').hidden = false;
    f.ph = 'leave';
    S.goal('出门，开车送玛丽回家');
  }

  /* ---------- 舞厅：出入口、点唱机 ---------- */
  async function exitHall(S) {
    const f = S.f;
    if (f.ph === 'night') { await S.narr('外头在下大雪。好不容易来一趟，再待会儿吧。'); return S.walk('pl', 'u', 5); }
    if (f.ph === 'back') { await S.narr(f.code ? '点唱机还亮着。……还没完。' : '外头的雪还没停。乔还在等你开口。'); return S.walk('pl', 'u', 5); }
    await S.go('archer', 5, 5, 0);
  }
  const DIG = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'];
  const CAT = { '402': '晚安，芝加哥', '408': '弯月', '418': '月光下', '427': '湖畔的灯', '438': '银色的月亮', '448': '初雪', '451': '蓝鹭摇摆', '503': '月亮湾' };
  const CATTXT = '点唱机的曲目卡（舞厅开张那几年的老唱片）：\n402 晚安，芝加哥　408 弯月　418 月光下\n427 湖畔的灯　438 银色的月亮　448 初雪\n451 蓝鹭摇摆　503 月亮湾\n（点歌单上：《……月……》　唱片号 4□8）\n按唱片号（三位数字）';
  async function jukeOn(S) {
    const f = S.f, e = S.ent('jbox');
    if (f.ph !== 'back') return S.narr('一台老式点唱机，木壳子上的漆都磨花了。玻璃罩里排着一圈旧唱片。\n插头拔着。乔说它好些年不响了。');
    if (!f.plugged) return S.narr('点唱机黑着，插头拔了，垂在地上。\n……先跟乔说一声。');
    if (f.code) return playIt(S, true);
    if (S.coop && S.once('jcoop')) S.toast('联机：一个人按 J 念节目单和点歌单，一个人按号码');
    const v = await S.keypad(CATTXT, DIG, 3);
    if (v == null) return;
    if (v === '438') return playIt(S, false);
    if (!CAT[v]) { S.sfx('locked'); return S.narr('机械臂在唱片架上转了一圈，又空着手缩了回去。\n没有这个号码的唱片。'); }
    f.wrong = (f.wrong || 0) + 1;
    e.s.play = 1;
    playSong(S, v === '418' || v === '402' ? 'fox' : 'waltz', { bars: 2, beat: .44, vol: .022, type: 'square', lp: 900, bass: false });
    await S.narr('唱针落下去。沙沙的底噪里，钻出一支《' + CAT[v] + '》。');
    S.tone('sawtooth', 900, 120, .5, .05, 0, 2400);
    e.s.play = 0; S.dark(.86); S.sfx('whisper');
    if (f.wrong === 1) { await S.scare('face', { face: 'mary', sfx: 'scare', dur: .8 }); }
    await S.say('', '……不是这首。', { style: 'whisper' });
    S.dark(.74);
    await S.narr('唱针「嗞」地划出了唱片。点唱机的玻璃罩上，结了一层薄薄的霜。\n舞厅里一下子冷了好几度。');
    S.face('joe', 'pl');
    const why = { '418': '《月光下》是支狐步。那天晚上第四支就跳过了——她点的不是它。', '408': '《弯月》是伦巴，节目单上第六支。她点的不是伦巴。', '503': '《月亮湾》……点歌单上头一个数是四。这张是五开头的。' };
    await S.say('乔', why[v] || '这首歌的名字里，没有月亮。');
    if (f.wrong === 2) await S.say('乔', '她点的是最后一支舞。节目单最底下那一行，你看过没有？');
    else if (f.wrong === 3) await S.say('乔', ['点歌单上剩下的是四和八。名字里带「月」、四开头八结尾的，有三张。', '节目单上已经跳过的，就不是她点的那一首。']);
    else if (f.wrong >= 4) await S.say('乔', '……四、三、八。《银色的月亮》。我其实一直都记得。');
    if (f.wrong <= 2) await S.think('放错一张，她的手就更冷一分。……下一支舞会更难跳。');
    S.goal('在点唱机上放她点的那首歌（已放错 ' + f.wrong + ' 张：最后一支舞要多踩对 ' + Math.min(2, f.wrong) + ' 步）');
  }
  async function playIt(S, again) {
    const f = S.f, e = S.ent('jbox');
    f.code = true; e.s.play = 1;
    S.sfx('select');
    await S.narr(again ? '你又按下那三个号码。唱针落下去——' : '机械臂从唱片架上取下一张黑胶，轻轻放上转盘。\n唱针落下去。沙沙的底噪里，单簧管起了个头——');
    playSong(S, 'silver', { bars: 4, beat: .4, vol: .03, type: 'triangle', lp: 1000 });
    if (!again) {
      S.face('joe', 'pl');
      await S.say('乔', ['……《银色的月亮》。', '就是这首。四十五年了。']);
      await S.think('你认得这个调子。玛丽在出租车后座上，哼过它的前半段。');
    }
    await S.fade(1, 1400);
    await S.go('vision', 11, 9, 3, { fade: false });
  }

  /* ---------- 回到打烊后的舞厅：乔 ---------- */
  function closeHall(S) {
    for (const id of ['m1', 'm2', 'm3', 'leader', 'c1a', 'c1b', 'c2a', 'c2b', 'c3a', 'c3b', 'wei', 'coat', 'mary']) { const e = getEnt(id, 'ballroom'); if (e) e.hidden = true; }
    getEnt('mball', 'ballroom').off = true;
    S.dark(.74); S.amb('room');
  }
  async function joeBack(S) {
    const f = S.f;
    if (!f.backTalk) {
      await S.say('乔', '……你回来了。她在公墓门口下的车，对不对？');
      await S.say('米克', '你知道？');
      await S.say('乔', ['我在这吧台后头站了四十五年。隔一阵子，就有个小伙子陪她跳舞，开车送她走。', '有的再也没回来。有的回来了，坐在高脚凳上一句话不说，喝到天亮。']);
      await S.narr('你把那只串珠手包放在吧台上。');
      S.bubble('joe', '…', 1500);
      await S.say('乔', ['……那张点歌单。那首歌，点唱机里有。', '那台机器里，是舞厅开张那几年留下来的唱片。我四十五年没碰过它。']);
      const j = S.ent('jbox');
      S.place('joe', 3, 3, 1); j.lit = true; j.light = { r: 2.6, col: 'rgba(255,180,90,.22)', dy: -4 };
      S.sfx('switch');
      await S.narr('乔从吧台后面走出来，弯腰插上点唱机的插头。机器「嗡」地一声，玻璃罩里的灯一盏一盏亮了。\n他胸前那枚月牙别针，在灯底下闪了一下。');
      f.backTalk = true; f.plugged = true; f.pin = true;
      S.goal('在点唱机上放她点的那首歌（对照节目单和点歌单，按 J 看笔记）');
      return;
    }
    if (f.pin && !f.joeTold) {
      const r = await S.ask('乔站在点唱机旁边，手插在马甲口袋里。', ['那首歌，再说说？', '（拿出手包里的照片）……照片上这个人，是你吧？'], '米克');
      if (r === 1) return confession(S);
    }
    const w = f.wrong || 0;
    await S.say('乔', w >= 3 ? '点歌单上是四和八。节目单上跳过的，不是她那一首。' : rot(S, '_bl', [
      '她点的是最后一支舞。节目单最底下那一行写着。',
      '点歌单上烧掉的是中间那个数。',
      '那天晚上的节目单，就挂在墙上。我天天擦那块玻璃。'
    ]));
  }
  async function confession(S) {
    const f = S.f; f.joeTold = true;
    await S.narr('乔看着那张照片，看了很久。\n照片上的年轻人头发抹得锃亮，领结上别着一枚月牙别针。和他胸前那一枚，一模一样。');
    await S.say('乔', ['……那年我二十一岁。', '她点了那支华尔兹，当着全场的人朝我伸手。我不会跳。……不，我是怕。怕跳得难看，怕别人笑话。']);
    await S.say('乔', ['我说了很难听的话，一个人开车走了。我想让她自己走回去，冻一冻，就知道错了。', '那天晚上下雪。阿彻大道上没有几盏灯。', '一辆车从后面开过来。……没有停。']);
    await S.say('乔', ['第二天，我到这儿来找活干。他们缺个洗杯子的。我一洗，就是四十五年。', '打烊以后，我一个人在舞池里学华尔兹。学会了。', '可她来的那些晚上，我从来不敢从吧台后面走出来。']);
    const r = await S.ask('他把别针摘下来，攥在手心里。', ['她一直在等这支舞。', '……那不是你的错。'], '米克');
    await S.say('乔', r === 0 ? '……我知道。' : '是不是我的错，我都欠她一支舞。');
  }

  /* ---------- 1934 年的舞厅：最后一支舞 ---------- */
  async function visionStart(S, again) {
    const f = S.f;
    S.amb('none');
    getEnt('joev', 'vision').hidden = !f.joeTold;
    S.place('maryv', 11, 8, 0); S.ent('maryv').alpha = 1;
    await S.fade(0, 900);
    if (!again) {
      await S.narr('吧台、高脚凳、倒扣在桌上的椅子都不见了。\n水晶吊灯一盏一盏亮起来。空气里是发蜡、香水和雪的味道。');
      await S.narr('舞池里挤满了人。他们的脸都很淡，像隔着一层起了雾的玻璃。\n墙上的节目单还是新的。钟停在十一点五十八分。');
      await S.say('玛丽', ['你来了。', '这一首……就是这一首。']);
    } else await S.say('玛丽', '再试一次？我等得起。');
    f.joeDance = false;
    if (f.joeTold) {
      const r = await S.ask('乔站在舞池边上，攥着那枚月牙别针，一动不动。', ['我来跳这支舞', '「乔，该你了。」（把她的手交给乔）'], '米克');
      if (r === 1) {
        f.joeDance = true;
        S.hide('joev'); S.wear('@joey');
        await S.narr('乔往前走了一步。\n他走进吊灯底下的时候，背直了，白头发一根一根黑了回去——二十一岁。');
        await S.say('玛丽', '……乔？');
        await S.say('乔', '这回我学会了。');
        await S.say('玛丽', '那就别再踩我的脚。');
        await S.narr('（这支舞由你来带乔的步子。你在心里替他数拍子。）');
      }
    }
    if (f.vfail) await S.narr('（跟着光圈走：光圈收拢、「嘭」落下的那一下才落脚。早一点也不行。）');
    else if (!again) await S.narr('（还是三拍子，只在「嘭」上迈步。这是她的歌——这一回，一直跳到最后一个音。）');
    startDance(S, 'final', 'maryv');
  }
  async function finaleFail(S) {
    const f = S.f;
    f.vfail = (f.vfail || 0) + 1;
    S.tone('sawtooth', 900, 120, .6, .05, 0, 2400);
    await S.narr('唱针「嗞」地划出了唱片。\n吊灯一盏一盏灭了。她的手从你手心里滑了出去，像一捧化掉的雪。');
    await S.alpha('maryv', 0, 900);
    S.wear('@me');
    await S.fade(1, 700);
    await S.go('ballroom', 1, 3, 3, { fade: false });
    await S.fade(0, 700);
    await S.narr('你又站在黑漆漆的舞厅里。点唱机的灯还亮着。');
    S.face('joe', 'pl');
    await S.say('乔', ['光圈收拢的那一拍再落脚。别抢，也别慢。', '……她会等的。她一向等得起。']);
    S.goal('再放一次那张唱片（点唱机）');
  }
  async function finaleOK(S) {
    const f = S.f;
    if (f.joeDance) return joeEnd(S);
    await S.narr('最后一个音落下来。\n她停在你面前，白裙子的裙摆还在轻轻地晃。');
    await S.say('玛丽', ['谢谢你。', '这首歌的后半段，我终于想起来了。']);
    if (f.joeTold) {
      S.face('maryv', 'joev');
      await S.say('玛丽', '乔。');
      await S.say('乔', '……对不起。');
      await S.say('玛丽', ['我早就不生气了。', '回家吧，乔。别再一个人站在吧台后面了。']);
    } else {
      await S.say('玛丽', '替我谢谢那个一直站在吧台后面的人。……他会明白的。');
    }
    await S.say('玛丽', '我该回家了。这一回，我自己认得路。');
    await S.alpha('maryv', 0, 2200);
    await S.fade(1, 1500);
    await S.card('第二天早上', '', '雪停了。\n你走回公墓门口，出租车一拧钥匙就着了火。\n铁门上那两个焦黑的手印，太阳一照，淡得快看不见了。\n\n门里的雪地上，有一串很小的脚印，只进不出。\n脚印旁边，是两行转着圈的舞步。');
    const log = f.readLog ? '\n\n过了几天，你又去了一趟旋律酒馆，在那本「司机们的话」的最后一页写下一行：\n「1979.12　黄色出租。她把那支歌哼完了。」' : '';
    await S.end({ id: 'lastdance', title: '最后一支舞', text: '后来，阿彻大道上还是有人说，自己载过一个穿白裙子的金发姑娘。\n只是他们都说，她在后座上，会把一支三拍子的老曲子从头哼到尾。\n哼完最后一个音，才轻轻说一声：「就这儿，谢谢。」\n\n蓝鹭舞厅的点唱机，再也没人插过插头。\n可每到下雪的星期六，打烊以后，它会自己亮一下。' + log });
  }
  async function joeEnd(S) {
    await S.narr('乔的步子很慢，有点笨。\n可是一步也没有错。');
    await S.say('玛丽', '你学会了。');
    await S.say('乔', '学了四十五年。每天打烊以后，一个人。');
    await S.say('玛丽', '……傻瓜。');
    await S.say('玛丽', ['那天晚上的事，不全怪你。是我自己赌气，要走回去的。', '别再等了，乔。']);
    await S.alpha('maryv', 0, 2400);
    S.wear('@joe');
    await S.narr('吊灯灭了。\n空荡荡的舞池中间，站着一个六十六岁的老人。他慢慢地，朝门的方向鞠了一躬。');
    await S.fade(1, 1500);
    await S.card('那年冬天', '', '早上，清洁工发现乔趴在吧台上睡着了。\n手心里攥着那枚月牙别针，脸上带着笑。\n\n他醒来以后，辞掉了舞厅的工作。');
    await S.end({ id: 'joe', title: '迟到四十五年', text: '每个下雪的星期六，有人看见一个老人站在复活公墓的铁门外。\n他穿着一身熨得笔挺的旧西装，对着门里，慢慢地，一个人跳完一支华尔兹。\n\n那以后，阿彻大道上很久没人再载到过她。\n也许她终于等到了那支舞。也许，她只是不用再一个人走回家了。' });
  }

  /* ---------- 阿彻大道：开车 ---------- */
  const isCab = S => typeof S.pl.spr === 'string' && S.pl.spr.startsWith('cab');
  const HL = { 1: { pl: true, r: 3.6, col: 'rgba(255,236,170,.16)', dx: 8 - 36, dy: 6 }, 2: { pl: true, r: 3.6, col: 'rgba(255,236,170,.16)', dx: 8 + 36, dy: 6 } };
  function cabState(S) { S.norun(true); S.speed(1.5); S.amb('car'); }
  function footState(S) { S.norun(false); S.speed(1); S.amb('wind'); }
  async function cabOn(S) {
    const f = S.f;
    if (f.ph === 'leave') return enterCab(S);
    if (f.ph === 'night') return S.narr('你那辆黄色的方头出租车，车顶上已经积了一层雪。\n今晚收工了，不拉活。');
    await S.narr('钥匙拧到底，只有「咔哒」一声。\n仪表盘黑着。电瓶像是一下子冻死了。');
    if (!f.rule) await S.think('马路对面那家酒馆还亮着灯。去打个电话吧。');
  }
  async function enterCab(S) {
    const f = S.f;
    S.hide('cabp'); S.hide('marya'); S.sfx('open');
    S.pos(8, 7, 2); f.cf = 2; S.wear('cabpR'); f.inCab = true; cabState(S);
    S.sfx('close'); S.sfx('car');
    await S.narr('玛丽坐进了后座，把白裙子的裙摆小心地拢在膝盖上。\n车里的暖风开到了最大。后视镜上挂着的小松树，一动不动。');
    await S.say('玛丽', '沿着阿彻大道一直往东开。到了，我会告诉你。');
    f.ph = 'drive';
    S.goal('沿阿彻大道往东开，送玛丽回家');
    S.cp('drive');
  }
  async function evMeter(S) {
    S.sfx('tick');
    await S.narr('你没打表。\n可计价器「咔哒」一声，自己跳了起来。红色的数字一格一格地翻——\n19……34。然后就不动了。');
    await S.think('……这破表，又坏了。');
  }
  async function evHum(S) {
    playSong(S, 'silver', { bars: 8, beat: .48, type: 'sine', vol: .04, lp: 900, bass: false, delay: .3 });
    await S.narr('后座传来轻轻的哼唱。\n一支慢悠悠的三拍子曲子。你从来没听过，可听着听着，鼻子有点酸。');
    await S.wait(3200);
    await S.say('玛丽', ['……后半段，我想不起来了。', '那是我最喜欢的一支歌。我一直想跟他把它跳完。']);
  }
  async function evMirror(S) {
    await S.narr('你抬眼看了一下后视镜。');
    S.sfx('sting'); S.shake(250, 1);
    await S.narr('后视镜里，后座是空的。');
    await S.narr('你揉了揉眼睛，又看了一眼——');
    await S.scare('face', { face: 'mary', sfx: 'scare', dur: .7, shake: 2 });
    await S.narr('她的脸就贴在镜面上，离你不到一拃。蓝眼睛一眨不眨。\n你一眨眼，后座又空了。');
    await S.say('玛丽', ['那天晚上也下雪。', '我的鞋太薄了，走一步，滑一下。……路上一盏灯也没有。']);
    await S.think('她的声音，就在你脑后。\n你没敢回头。');
  }
  async function stopAsk(S) {
    const f = S.f; f.asked = true;
    await S.walk('pl', [55, 7], 2.4);
    S.cp('stop');
    return stopChoice(S);
  }
  async function stopChoice(S) {
    const f = S.f;
    await S.say('玛丽', '……就这儿。停一下好吗？');
    const r = await S.ask('车灯扫过右手边——一排黑色的铁栏杆，栏杆后面，是一片白茫茫的墓碑。\n复活公墓。', ['靠边停车', '不停，继续往前开'], '米克');
    if (r === 1) {
      await S.say('玛丽', '……求你了。', { style: 'whisper' });
      await S.narr('油门踩到了底，车却越走越慢。仪表盘上的灯一盏一盏灭了。\n出租车自己滑到公墓大门口，停住了。');
    } else S.sfx('brake');
    await S.walk('pl', [56, 7], 2);
    S.wear('cabR'); S.sfx('open');
    S.place('marya', 56, 6, 3); S.ent('marya').alpha = 0; S.ent('marya').solid = false;
    await S.alpha('marya', 1, 500);
    S.sfx('close');
    await S.narr('后车门开了，又关上。\n她站在雪地里，站在那两扇黑铁门前面。');
    S.face('marya', 0);
    await S.say('玛丽', ['谢谢你送我。', '……要进来坐坐吗？我家就在里面。']);
    const r2 = await S.ask('她朝你伸出一只手。雪落在她手心里，没有化。', ['下车，跟她进去', '待在车里，别动'], '米克');
    if (r2 === 0) return followEnd(S);
    return vanishScene(S);
  }
  function leaveCab(S, x, y) {
    const f = S.f;
    S.wear('@me'); f.inCab = false; footState(S);
    S.place('cabp', 56, 7, 2); S.ent('cabp').spr = 'cabR';
    S.pos(x, y, 3);
  }
  async function followEnd(S) {
    const g = S.ent('gate');
    S.sfx('open');
    leaveCab(S, 55, 6);
    await S.narr('你推开车门。冷风一下子灌进领口。');
    S.place('marya', 56, 5, 3); await S.alpha('marya', .6, 300); S.place('marya', 56, 3, 0); S.ent('marya').alpha = .9;
    S.sfx('open'); g.open = true; g.solid = false;
    await S.narr('铁门上的锁链「哗啦」一声掉进雪里。\n门自己开了。');
    await S.walk('pl', [56, 4], 2.4);
    await S.narr('门里的雪是平的。一个脚印也没有——连她的也没有。');
    S.face('marya', 'pl');
    await S.say('玛丽', ['你跳得真好。', '我们再跳一支吧。一直跳下去，好不好？']);
    playSong(S, 'silver', { bars: 3, beat: .5, type: 'sine', vol: .03, lp: 700, bass: false });
    await S.narr('她的手搭上你的肩膀。\n冷得像一块墓碑。');
    await S.scare('face', { face: 'mary', sfx: 'scream', dur: 1 });
    await S.fade(1, 900);
    await S.end({ bad: true, id: 'follow', title: '跟她回家', text: '第二天一早，守墓人在大门里面发现了一串脚印。\n只有一个人的。一直走到旧墓区，绕着一块被雪盖住的碑，转了很多很多圈——像是在跳舞。\n脚印的尽头，没有人。\n\n门外停着一辆黄色出租车。计价器还亮着：19.34。' });
  }
  async function vanishScene(S) {
    const f = S.f, g = S.ent('gate');
    await S.narr('你的手攥着方向盘，没有动。');
    await S.say('玛丽', '……这样啊。', { style: 'whisper' });
    S.face('marya', 3);
    g.s.burn = 1; g.light = { r: 2.4, col: 'rgba(255,140,60,.3)', flick: true, dx: 16, dy: 6 }; S.sfx('sting');
    S.tone('sawtooth', 1800, 600, 1.4, .02, 0, 3000); S.tone('sine', 80, 60, 1.2, .08, 0, 400);
    await S.narr('她转过身，两只手握住了铁门的两根栏杆。\n嘶——栏杆上冒起一股白汽。她手边的雪，一下子全化了。');
    S.place('marya', 56, 5, 3); S.ent('marya').alpha = 1;
    await S.alpha('marya', .5, 700);
    S.place('marya', 56, 4, 3); S.ent('marya').alpha = .5;
    await S.alpha('marya', 0, 1400);
    await S.narr('她从两根栏杆中间走了过去。\n像一缕烟，从门缝里钻进了公墓。');
    g.s.burn = 2; g.light = { r: 1.4, col: 'rgba(255,120,60,.1)', dx: 16, dy: 6 }; S.show('purse');
    S.amb('wind');
    await S.narr('发动机咳嗽了两声，熄了火。仪表盘上的灯，一盏一盏灭了。\n只剩下雪落在车顶上的声音。');
    leaveCab(S, 56, 6);
    f.ph = 'gate';
    S.goal('下车看看那扇铁门');
    S.cp('gate');
  }
  async function gateOn(S) {
    const f = S.f, g = S.ent('gate');
    if (!g.s.burn) return S.narr('复活公墓的大门。两扇黑铁门，中间挂着一把大锁，锁链上积着雪。\n门里黑沉沉的，只有一排一排的墓碑露着个白顶。');
    await S.narr('两根铁栏杆被人往外掰弯了。弯的地方，各有一个焦黑的手印。\n很小，五根手指细细长长，像个姑娘的手。');
    await S.narr('你伸手碰了一下。……还是热的。\n雪落在手印上，「嗞」的一声就化了。');
    if (!S.has('purse') && !f.purse) await S.think('门上好像还挂着什么东西，在雪光里一闪一闪的。');
  }
  async function purseOn(S) {
    const f = S.f;
    S.hide('purse'); S.give('purse'); f.purse = true;
    await S.narr('门栏杆的尖顶上，挂着一只白色的串珠小手包。\n你把它摘下来。冰凉的，珠子缝里嵌满了雪。');
    await S.note('purse');
    if (f.rule) return readyWalk(S);
    S.goal('去马路对面亮灯的酒馆（打个电话）');
  }
  async function readyWalk(S) {
    const f = S.f;
    if (f.ph !== 'gate') return;
    if (!f.rule) return;
    if (!S.has('purse')) { S.goal('先回公墓铁门那儿看看，门上挂着什么'); return; }
    f.ph = 'walk';
    S.goal('沿阿彻大道往西，走回舞厅（听见老式喇叭，就站进亮着的路灯光圈里）');
    if (S.coop) S.toast('联机：旁观的人会更早看见身后的车灯——替同伴盯着');
    S.cp('walk');
    W._car = { st: 'pre', t: 1.1, k: 0, demo: true };   // 第一辆：在门口看它开过去一回
  }
  async function demoAfter(S) {
    if (!S.once('demoSeen')) return;
    await S.narr('一辆黑色的老式轿车从你面前呼啸而过。只亮着一只灯。\n驾驶座上，没有人。');
    await S.think('……就是它。听见喇叭，就进光圈。');
  }

  /* ---------- 阿彻大道：那辆车（危险段） ----------
     只在 walk 阶段、玩家走在 x 11..51 的黑路上时出现。
     预警：先是低低的发动机声（旁观的人屏幕右边先亮起车灯），再是一声老式喇叭，1.2 秒后从背后开过来。
     亮着的路灯光圈里（灯下三格的路肩和外侧车道）、舞厅门口、酒馆门口是安全的；第一次被撞到只是摔进雪堆（警告），第二次才死。 */
  const LAMPS = [17, 33, 41, 49], BROKEN = [25];
  function isSafe(x, y) {
    if (x <= 10) return true;
    if (x >= 52 && x <= 60 && y >= 10) return true;
    for (const L of LAMPS) if (Math.abs(x - L) <= 1 && y >= 9) return true;
    return false;
  }
  function carTick(S, dt) {
    const f = S.f, p = S.pl, car = getEnt('gcar', 'archer'), hud = getEnt('hud', 'archer');
    const C = W._car || (W._car = { st: 'idle', t: 2.2 });
    if (f.ph !== 'walk' || W.ended) { if (C.st !== 'idle') { C.st = 'idle'; car.hidden = true; } hud.s.warn = 0; return; }
    if (S.busy) return;
    const px = p.px / TS, py = p.py / TS, tx = Math.round(px), ty = Math.round(py), safe = isSafe(tx, ty);
    if (C.st === 'idle') {
      if (tx >= 11 && tx <= 51) C.t -= dt;
      if (C.t <= 0) { C.st = 'pre'; C.t = .55; C.k = 0; hud.s.warn = 1; }
      return;
    }
    if (C.st === 'pre') {
      C.t -= dt; C.k -= dt;
      if (C.k <= 0) { C.k = .22; S.tone('sawtooth', 46, 50, .26, .03, 0, 180); }
      if (C.t <= 0) {
        C.st = 'run'; C.x = Math.min(76, px + 22); C.y = clamp(py, 6, 10); C.passed = false; C.k = 0;
        car.hidden = false; car.px = C.x * TS; car.py = C.y * TS; hud.s.warn = 2;
        horn(S);
      }
      return;
    }
    // run
    C.x -= 18 * dt; C.k -= dt;
    const d = C.x - px;
    if (C.k <= 0) { C.k = .16; const v = clamp(.09 - Math.abs(d) * .003, .02, .09); S.tone('sawtooth', 52, 58, .2, v, 0, 260 + (d > 0 ? 0 : 0)); }
    const ty2 = (safe || C.demo) ? (ty >= 9 ? 7 : 9) : clamp(py, 6, 10);
    C.y += (ty2 - C.y) * Math.min(1, dt * 4.5);
    car.px = C.x * TS; car.py = C.y * TS;
    if (!safe && !C.demo && Math.abs(py - C.y) < 1.1 && px + .5 >= C.x - .2 && px + .5 <= C.x + 3) { C.st = 'idle'; C.t = 4; car.hidden = true; hud.s.warn = 0; S.run(carHit); return; }
    if (!C.passed && C.x < px - .5) { C.passed = true; if (safe || C.demo) { S.shake(250, 1); S.tone('sawtooth', 140, 60, .5, .05, 0, 700); } }
    if (C.x < px - 12 || C.x < -6) { C.st = 'idle'; C.t = 1.2 + Math.random() * 2.3; car.hidden = true; hud.s.warn = 0; if (C.demo) S.after(150, demoAfter); }
  }
  async function carHit(S) {
    const f = S.f;
    if (!f.carWarn) {
      f.carWarn = true;
      S.sfx('brake'); S.fx('flash'); S.shake(600, 3);
      await S.narr('一团昏黄的光从背后扑过来——\n一股冷风把你掀翻在雪堆里。一辆黑色的老式轿车擦着你的衣角开了过去。');
      await S.narr('驾驶座上没有人。\n它没有刹车，也没有回头。');
      await S.think('……芭芭拉说过：听见喇叭，就站进亮着的路灯底下。\n下一回，它不会再偏开了。');
      const x = S.pl.x; let best = null;
      for (let d = 0; d < 40 && best == null; d++) { if (isSafe(x - d, 10)) best = -d; else if (isSafe(x + d, 10)) best = d; }
      if (best) S.toast('最近的光圈在你' + (best < 0 ? '左' : '右') + '边 ' + Math.abs(best) + ' 步（路肩那一侧）');
      if (W._car) W._car.t = Math.max(W._car.t, 3);
      return;
    }
    carDeaths++;
    S.sfx('brake');
    await S.scare('flash', { sfx: 'scream', dur: .7 });
    await S.die('车灯把你整个人吞了进去。\n它没有减速，也没有按第二声喇叭。\n就像四十五年前那个晚上一样。', '阿彻大道');
  }

  /* ---------- 酒馆 ---------- */
  async function barbTalk(S) {
    const f = S.f;
    S.face('barb', 'pl');
    if (!f.rule) {
      await S.say('老板娘', ['这么晚……开出租的？', '脸都白了。坐吧，咖啡是热的。']);
      await S.say('米克', '我……我刚才在门口载了个姑娘。到了公墓门口，她就——');
      S.bubble('barb', '…', 1400);
      await S.say('老板娘', ['金头发，白裙子，不穿大衣。到了铁门那儿，人就没了。', '你不是头一个，孩子。这三十年，半夜推门进来讨热咖啡的司机，少说二十个。柜台上那本本子，是他们写的。']);
      await S.say('米克', '电话能借我用一下吗？我的车打不着了。');
      await S.say('老板娘', ['线又冻断了，今晚不会有车来。你得顺着阿彻大道往西，走回舞厅去，两英里多。', '路上有一辆车。老式的黑轿车，只亮一只灯，驾驶座上没有人。', '听见那种老喇叭——「啊呜嘎」——就站到亮着的路灯底下。路边也不行。\n中间有一盏灯坏了好些年，那一段，你得跑。']);
      await S.say('老板娘', '那辆车？……就是那天晚上从后面撞了她、没停下来的那辆。\n它到现在也没停下来。');
      f.rule = true;
      S.goal(S.has('purse') ? '沿阿彻大道往西，走回舞厅（出门就是）' : '回公墓铁门那儿看看，再走回舞厅');
      return;
    }
    if (S.once('barb76')) {
      await S.say('老板娘', ['铁门上的手印？七六年夏天也出过一回。有人半夜看见她站在门里头，两只手抓着栏杆。', '公墓的人说，是卡车倒车撞弯的，工人拿喷灯烤直，才烤出了印子。', '后来那两根栏杆锯掉了，换了新的。……可你刚才也看见了。']);
      return;
    }
    await S.say('老板娘', rot(S, '_bb', [
      '听见喇叭，就站进路灯的光圈里。坏掉的那盏附近，跑过去。',
      '那姑娘从来不伤人。伤人的，是那辆车。',
      ['她的手包？……那你得还给她。', '舞厅那个老酒保，在那儿干了一辈子。他也许知道点什么。']
    ]));
  }

  defChapter({
    id: 'resurrectionmary', n: 5, title: '复活玛丽', sub: '芝加哥西南郊的老舞厅里，穿白裙子的金发姑娘陪你跳了一整晚。她要你沿着阿彻大道，送她回家。', origin: '美国 · 芝加哥都市传说', color: '#2e3450',
    icon: '@mary', iconX: 30, amb: 'room', floor: 'wood', wall: 'wood', dark: .4, plr: 3.4,
    thumb(g, w, h) {
      const P = (x, y, ww, hh, c) => { g.fillStyle = c; g.fillRect(x, y, ww, hh); };
      P(0, 50, 160, 18, '#c8d0dc'); P(0, 48, 160, 2, '#a8b0bc');
      P(6, 14, 8, 38, '#4a4846'); P(7, 15, 6, 36, '#6a6864'); P(5, 12, 10, 3, '#3a3836'); P(56, 14, 8, 38, '#4a4846'); P(57, 15, 6, 36, '#6a6864'); P(55, 12, 10, 3, '#3a3836');
      for (let x = 16; x < 56; x += 4) P(x, 18, 2, 32, '#121216');
      P(14, 20, 42, 2, '#121216'); P(14, 42, 42, 2, '#121216'); P(30, 10, 10, 2, '#121216'); P(34, 6, 2, 6, '#121216');
      P(26, 22, 2, 18, '#1a1410'); P(32, 22, 2, 18, '#1a1410');
      const hand = (x, y) => { P(x - 3, y, 6, 5, '#ff8a30'); P(x - 3, y - 4, 1, 4, '#ffb050'); P(x - 1, y - 5, 1, 5, '#ffb050'); P(x + 1, y - 5, 1, 5, '#ffb050'); P(x + 3, y - 3, 1, 4, '#ffb050'); P(x - 2, y + 1, 4, 3, '#ffe0a0'); };
      hand(27, 30); hand(33, 30);
      g.fillStyle = 'rgba(255,150,60,.18)'; g.beginPath(); g.arc(30, 30, 14, 0, 7); g.fill();
      for (let i = 0; i < 40; i++) P((hash(i, 1, 55) * 160) | 0, (hash(i, 2, 55) * 66) | 0, 1, 1, 'rgba(240,244,255,.8)');
    },
    endings: { lastdance: '最后一支舞', joe: '迟到四十五年', follow: '跟她回家' },
    people: {
      me: { key: 'rm-me', skin: '#eac4a0', hair: '#4a3020', hs: 'short', hat: 'cap', hatC: '#3a3a44', top: '#6a4a2e', top2: '#d8d0c0', bottom: '#2e3446', shoes: '#2a2018' },
      mary: { key: 'rm-mary', skin: '#f2e8e2', hair: '#e6cc7a', hs: 'bob', top: '#f2f0ea', top2: '#fbfaf6', bottom: '#f2f0ea', dress: true, shoes: '#e4dccf', eye: '#3a64a8',
        extra(g, d, fr, G, R) { if (d === 0) { R(4, G.hT + 2, 1, 1, '#c8ac58'); R(11, G.hT + 3, 1, 1, '#c8ac58'); R(5, G.hT, 6, 1, '#f4dc94'); R(9, G.tT + 1, 1, 1, '#ffffff'); } else if (d === 1) { R(5, G.hT, 5, 1, '#f4dc94'); R(9, G.hT + 3, 2, 1, '#c8ac58'); } else if (d === 3) { R(4, G.hT + 3, 8, 1, '#c8ac58'); } } },
      maryg: { key: 'rm-maryg', skin: '#e6eaf2', hair: '#dcc88c', hs: 'bob', top: '#eef0f6', top2: '#fafbff', bottom: '#eef0f6', dress: true, ghost: true, eye: '#3a64a8' },
      joe: { key: 'rm-joe', skin: '#e6c0a0', hair: '#d6d6d6', hs: 'short', top: '#ecebe4', top2: '#ecebe4', bottom: '#1e1e24', shoes: '#111',
        extra(g, d, fr, G, R) { if (d === 0) { R(4, G.tT + 1, 2, 6, '#1e1e24'); R(10, G.tT + 1, 2, 6, '#1e1e24'); R(6, G.tT, 4, 1, '#0a0a0a'); R(7, G.tT + 1, 2, 1, '#0a0a0a'); R(10, G.tT + 1, 1, 1, '#e0b84a'); } else if (d === 1) { R(5, G.tT + 1, 4, 6, '#1e1e24'); R(4, G.tT, 2, 1, '#0a0a0a'); } } },
      joey: { key: 'rm-joey', skin: '#efcaa8', hair: '#2a1c14', hs: 'short', top: '#2a2a36', top2: '#f0eee8', bottom: '#2a2a36', shoes: '#0a0a0a',
        extra(g, d, fr, G, R) { if (d === 0) { R(7, G.tT, 2, 4, '#f0eee8'); R(6, G.tT, 4, 1, '#0a0a0a'); R(10, G.tT + 1, 1, 1, '#ffd860'); } R(5, G.hT, 6, 1, '#3a2a20'); } },
      wei: { key: 'rm-wei', skin: '#d8a882', hair: '#9a9a9a', hs: 'short', hat: 'cap', hatC: '#5a4a30', top: '#7a3a2a', top2: '#c8b088', bottom: '#3a3a40',
        extra(g, d, fr, G, R) { if (d !== 3) { R(4, G.tT + 3, 8, 1, '#4a2018'); R(4, G.tT + 6, 8, 1, '#4a2018'); } } },
      leader: { key: 'rm-leader', skin: '#e0b896', hair: '#3a2a20', hs: 'short', top: '#f0ece0', top2: '#1a1a1a', bottom: '#1a1a1a', extra(g, d, fr, G, R) { if (d === 0) { R(6, G.tT, 4, 1, '#1a1a1a'); R(7, G.tT + 1, 2, 3, '#e8e4d8'); } } },
      muso1: { key: 'rm-m1', skin: '#c89a78', hair: '#1a1410', hs: 'short', top: '#2a2a3a', bottom: '#2a2a3a', extra(g, d, fr, G, R) { if (d === 0) { R(9, G.tT + 2, 2, 7, '#d8b048'); R(7, G.tT + 8, 4, 2, '#d8b048'); } } },
      muso2: { key: 'rm-m2', skin: '#8a5a3e', hair: '#1a1410', hs: 'short', top: '#2a2a3a', bottom: '#2a2a3a' },
      muso3: { key: 'rm-m3', skin: '#eac0a0', hair: '#b0b0b0', hs: 'short', top: '#2a2a3a', bottom: '#2a2a3a' },
      coat: { key: 'rm-coat', skin: '#f0caa8', hair: '#8a4a2a', hs: 'bun', top: '#7a2a3a', top2: '#e8d8c8', bottom: '#2a2a2a', skirt: true },
      om1: { key: 'rm-om1', skin: '#e2b896', hair: '#c8c8c8', hs: 'short', top: '#4a4a5a', bottom: '#3a3a44' },
      ow1: { key: 'rm-ow1', skin: '#ecc8ac', hair: '#d8d0c8', hs: 'bun', top: '#8a4a6a', bottom: '#8a4a6a', dress: true },
      om2: { key: 'rm-om2', skin: '#c8987a', hair: '#a0a0a0', hs: 'bald', top: '#5a4a3a', bottom: '#2e2a26' },
      ow2: { key: 'rm-ow2', skin: '#eed0b8', hair: '#c0b8b0', hs: 'bob', top: '#3a5a7a', bottom: '#3a5a7a', dress: true },
      om3: { key: 'rm-om3', skin: '#e8c0a0', hair: '#e0e0e0', hs: 'short', top: '#3a4a3a', bottom: '#2a2a2a' },
      ow3: { key: 'rm-ow3', skin: '#f0d0b8', hair: '#a8a098', hs: 'bun', top: '#9a7a3a', bottom: '#9a7a3a', dress: true },
      barb: { key: 'rm-barb', skin: '#ecc4a4', hair: '#b8b0a8', hs: 'messy', top: '#5a6a4a', apron: '#e8e0d0', bottom: '#3a3030', skirt: true },
      sleeper: { key: 'rm-sl', skin: '#d8a882', hair: '#6a5a4a', hs: 'short', hat: 'cap', hatC: '#2a3a5a', top: '#3a4a6a', bottom: '#2a2a30' },
      gm: { key: 'rm-gm', skin: '#dfe4ea', hair: '#2a2a30', hs: 'short', top: '#3a3e4a', bottom: '#3a3e4a', ghost: true },
      gw: { key: 'rm-gw', skin: '#e6eaf0', hair: '#4a3a30', hs: 'bob', top: '#c8c0d8', bottom: '#c8c0d8', dress: true, ghost: true },
      gw2: { key: 'rm-gw2', skin: '#e6eaf0', hair: '#c8b070', hs: 'bun', top: '#b8d0c8', bottom: '#b8d0c8', dress: true, ghost: true }
    },
    faces: {
      /* 玛丽：烫着波浪的金色短发，苍白的脸；越往后，蓝眼睛越黑，嘴唇发青，脸上结出霜 */
      mary(R, a, t) {
        const HR = '#e2c46c', HR2 = '#b8963e', HR3 = '#f4dc94', SK = '#f0e6e2', SK2 = '#cfc2c0', BL = '#3a64a8';
        R(0, 0, 32, 32, '#040406');
        R(8, 3, 16, 3, HR); R(5, 6, 22, 5, HR); R(4, 10, 6, 12, HR); R(22, 10, 6, 12, HR); R(5, 21, 5, 3, HR2); R(22, 21, 5, 3, HR2);
        for (let i = 0; i < 4; i++) { R(6 + i * 5, 5 + (i % 2), 4, 1, HR3); R(5 + i * 5, 8 + ((i + 1) % 2), 4, 1, HR2); }
        R(4, 13, 2, 1, HR3); R(26, 13, 2, 1, HR3); R(4, 17, 2, 1, HR2); R(26, 17, 2, 1, HR2);
        R(10, 9, 12, 15, SK2); R(11, 9, 10, 15, SK); R(12, 24, 8, 2, SK2);
        R(12, 12, 3, 1, '#9a7a3a'); R(18, 12, 3, 1, '#9a7a3a');
        const k = Math.min(1, a * 1.7);
        const eye = x => { R(x, 14, 4, 2, '#fafafa'); if (k < .45) { R(x + 1, 14, 2, 2, BL); R(x + 1, 14, 1, 1, '#0a1430'); } else { R(x, 14, 4, 2, '#060608'); R(x, 16, 4, 1, '#3a3a4a'); if (Math.sin(t * 20) > .6) R(x + 1, 14, 1, 1, '#8aa4e8'); } };
        eye(12); eye(17);
        R(16, 17, 1, 2, SK2);
        R(14, 21, 5, 1, k < .45 ? '#c86a72' : '#5a6a96'); const mh = Math.round(a * 3); if (mh) R(15, 22, 3, mh, '#1a0a10');
        if (k > .3) { R(10, 10, 1, 7, 'rgba(220,235,255,.85)'); R(21, 18, 1, 5, 'rgba(220,235,255,.75)'); R(13, 9, 3, 1, 'rgba(230,240,255,.85)'); R(19, 23, 2, 1, 'rgba(230,240,255,.7)'); }
        R(8, 26, 16, 6, '#f2f0ea'); R(12, 26, 8, 2, SK); R(15, 28, 2, 2, '#ffffff');
      }
    },
    items: {
      purse: { name: '串珠小手包', desc: '白色的串珠小手包，珍珠扣子。里面有一张舞票、一张烧了一角的点歌单、一张照片。' }
    },
    notes: {
      setlist: { title: '节目单 · 蓝鹭舞厅冬季舞会　1934年12月22日', text: '（镶在镜框里，玻璃发黄。底下的铜牌：「本厅保存最完整的一张节目单」。）\n\n第一支　狐步　《晚安，芝加哥》\n第二支　华尔兹　《湖畔的灯》\n第三支　林迪舞　《蓝鹭摇摆》\n第四支　狐步　《月光下》\n第五支　探戈　《初雪》\n第六支　伦巴　《弯月》\n第七支　华尔兹　《月亮湾》\n第八支　狐步　《别离开我，宝贝》\n……\n最后一支　华尔兹　（由来宾点播）\n\n伴奏：午夜钟声大乐队' },
      purse: { title: '玛丽的手包', text: '一只白色的串珠小手包，扣子是一颗小珍珠。\n\n· 一张舞票：「蓝鹭舞厅　冬季舞会　1934.12.22　女宾免费」\n· 一张折起来的点歌单，边上烧焦了一大块：\n　「最后一支舞，请奏《……月……》　唱片号 4□8」\n　中间那个数字，烧没了。\n· 一张小照片：一个瘦高的年轻人，头发抹得锃亮，领结上别着一枚月牙别针，笑得有点不好意思。\n　背面写着：「乔：今晚别再吵了。——M」\n· 一支用短了的口红，一枚 1934 年的五分硬币。' },
      cabbie: { title: '司机们的话（旋律酒馆柜台上的本子）', text: '（老板娘说：谁在这条路上载过她，就在这儿写一笔。）\n\n1951.1　黄色出租 214 号。白裙子，金头发，在舞厅门口上的车。到公墓门口叫停。没开车门，人就没了。\n1958.12　她坐前座。一路一句话没说，手冰得像铁。\n1964.2　车费没给。我追到铁门口，门里头一个人也没有。\n1973.12　我没停车。她在后座说「求你了」。一回头，后座只剩一小摊雪水。\n1977.11　她问我几点了。我说十二点半。她说：「完了，妈妈要骂我了。」\n1979.1　（字很抖）我看见她从铁栏杆中间走过去。像烟一样。\n\n（最后一页是老板娘的字：）\n这些人后来都还在跑夜班。没有一个是坏人。' },
      clip: { title: '剪报 · 本地小报　1976年8月', text: '「公墓铁门上的手印」\n\n一名驾车经过的男子深夜报警，称看见一名白衣女子站在复活公墓大门里面，双手抓着铁栏杆。巡警赶到时门内空无一人，大门上着锁。\n\n但有两根铁栏杆被往外掰弯，弯处留有焦黑的痕迹，形状像一双小手。\n\n公墓方面表示，栏杆是一辆卡车倒车时撞弯的，工人用喷灯加热后将其扳直，焦痕由此而来。\n\n此后数周，每晚都有车停在门口，对着铁门拍照。' }
    },
    legend: '「复活玛丽」（Resurrection Mary）是芝加哥一带流传最广的鬼故事，也是「消失的搭车客」最有名的地方版本之一（《百物语·壹》第七夜讲过那个更古老的骨架）。故事发生在芝加哥西南郊的阿彻大道上：一个金发蓝眼、穿白色舞裙和舞鞋的年轻姑娘，在路边的老舞厅里陪年轻人跳了一整晚的舞。她话很少，手冷得出奇。散场后她请人开车送她，说沿着阿彻大道一直走；车开到复活公墓门口，她要求停车——下了车，就消失在铁门那里。有的版本里，车还没停稳，她就不见了。据说从三十年代起就有人这样讲，七十年代是目击说法最多的时候，出租车司机的讲述尤其多。\n\n关于她是谁，流传的说法大致是：三十年代的一个冬夜，她在舞厅里和男朋友吵了一架，赌气一个人沿阿彻大道走回家，被一辆车撞倒，司机逃逸；家人把她穿着那条白裙子和舞鞋下葬在复活公墓。有人把她和一位死于1934年车祸的年轻姑娘联系起来，也有人说是1927年一个和父亲去舞厅、回家路上出了车祸的十二岁女孩——两种说法都对不上传说的全部细节——她究竟是谁，查无实据。传说里的舞厅，通常指阿彻大道边的柳溪舞厅（早年叫「O. Henry」舞厅），据报道它在2016年毁于一场大火。\n\n最出名的「物证」有当年的报道可查：1976年8月的一个夜里，有过路司机报警说看见一个白衣女子站在公墓大门里面，双手抓着栏杆，警察赶到时只见两根栏杆被掰弯，上面留着像手印一样的焦痕。公墓方面的解释是卡车撞弯了栏杆、工人用喷灯烤直时留下了痕迹。那两根栏杆后来被拆掉换新，据说正是因为来看的人太多。至于出租车司机的证言，大多是口耳相传、没有留下名字的故事；公墓对面的一家酒馆，也常被讲成「司机们跑进去问有没有见过一个白衣姑娘」的地方。\n\n（本章的蓝鹭舞厅、旋律酒馆、主人公米克、酒保乔、老韦、芭芭拉，《银色的月亮》等曲目和那台点唱机，1934年12月22日这个日子，玛丽的手包，阿彻大道上那辆没有司机的黑色轿车，以及全部情节，均为游戏虚构。复活公墓、阿彻大道和1976年栏杆焦痕的说法来自真实流传的传说。）',
    start: { map: 'ballroom', x: 11, y: 13, dir: 3 },
    resume: {
      drive: async S => { cabState(S); },
      stop: async S => { cabState(S); await stopChoice(S); },
      gate: async S => { footState(S); },
      walk: async S => {
        footState(S); W._car = null;
        const c = getEnt('gcar', 'archer'); if (c) c.hidden = true;
        if (carDeaths === 1) await S.think('规矩：听见「啊呜嘎」的喇叭，就站进亮着的路灯光圈里。\n坏掉的那盏灯前后那一大段黑路，得一口气跑过去。');
        else if (carDeaths > 1) S.toast('车开走以后马上动身；坏灯那一段按住奔跑键跑过去');
      },
      back: async S => { S.norun(false); }
    },
    async intro(S) {
      failN = { d1: 0, d2: 0 }; carDeaths = 0;
      await S.card('第五夜　复活玛丽', '1979年12月22日　美国伊利诺伊州　芝加哥西南郊 · 阿彻大道', '你叫米克，二十三岁，开夜班出租。\n星期六收工早，你把那辆黄色的方头出租车停在蓝鹭舞厅门口。\n这家老舞厅每到周六还请大乐队，来的大多是你爷爷奶奶那辈人。\n\n外头在下雪。阿彻大道上，一辆车也没有。');
    },
    tick(S, dt) { },
    sprites: {
      cabL(g, e, t, R) { cabSpr(R, false, 1, t); }, cabR(g, e, t, R) { cabSpr(R, false, 2, t); },
      cabpL(g, e, t, R) { cabSpr(R, true, 1, t); }, cabpR(g, e, t, R) { cabSpr(R, true, 2, t); },
      /* 没有司机的老式黑轿车：车头朝左，只亮一只灯 */
      gcar(g, e, t, R) {
        const B = '#0c0c10', B2 = '#1e1e26', CH = '#5a5a62';
        R(-4, 18, 52, 3, 'rgba(0,0,0,.5)');
        R(-2, 6, 18, 10, B); R(-1, 5, 14, 2, B2); R(2, 4, 8, 1, B2);           // 长车头
        R(14, -4, 22, 20, B); R(15, -3, 20, 2, B2);                            // 车厢
        R(17, -1, 7, 6, '#06070a'); R(26, -1, 7, 6, '#06070a'); R(25, -1, 1, 7, B);
        R(36, 4, 10, 12, B); R(44, 2, 4, 10, '#141418');                        // 后备箱、备胎
        R(-4, 12, 12, 6, B2); R(30, 12, 14, 6, B2); R(8, 15, 22, 2, CH);        // 挡泥板、踏板
        R(-1, 16, 7, 5, '#050505'); R(32, 16, 7, 5, '#050505'); R(1, 17, 3, 2, '#3a3a3a'); R(34, 17, 3, 2, '#3a3a3a');
        R(-4, 8, 2, 4, CH); R(-3, 6, 1, 8, CH);                                 // 格栅
        R(-6, 6, 4, 4, '#fff4c0'); R(-5, 7, 2, 2, '#ffffff');                   // 唯一亮着的灯
        R(2, 6, 3, 3, '#2a2a2a');                                              // 坏掉的那只
        if (Math.sin(t * 30) > .2) R(-7, 5, 1, 6, 'rgba(255,240,190,.6)');
      },
      /* 屏幕层：雪 + 身后车灯预警（旁观的人先看见） */
      hud(g, e, t, R) {
        if (W.mapId === 'archer') {
          for (let i = 0; i < 80; i++) {
            const sp = 14 + hash(i, 1, 5) * 20, W2 = VW + 20, H2 = VH + 20;
            const x = ((hash(i, 2, 5) * 997 + t * (5 + hash(i, 3, 5) * 6) + Math.sin(t * .8 + i) * 5 - CAM.x * .95) % W2 + W2) % W2 - 10;
            const y = ((hash(i, 4, 5) * 613 + t * sp - CAM.y * .95) % H2 + H2) % H2 - 10;
            g.fillStyle = i % 4 ? 'rgba(236,240,250,.8)' : '#ffffff'; g.fillRect(x | 0, y | 0, i % 6 ? 1 : 2, i % 6 ? 1 : 2);
          }
        }
        const li = e.light; if (!li) return;
        const w = e.warn || 0, show = w >= 2 || (w === 1 && !iControl());
        li.a = show ? (w >= 2 ? .95 : .6) : 0; li.col = show ? 'rgba(255,236,170,.34)' : null; li.r = 4.4; li.dx = VW - e.sx + 10; li.dy = 6;
      },
      cgate(g, e, t, R) {
        const S1 = '#5a5852', Sd = '#34322e', I = '#141418', Il = '#3a3a44', SN = '#e8eef6';
        R(-6, -18, 7, 33, Sd); R(-5, -17, 5, 31, S1); R(-7, -20, 9, 3, Sd); R(-7, -21, 9, 1, SN);
        R(31, -18, 7, 33, Sd); R(32, -17, 5, 31, S1); R(30, -20, 9, 3, Sd); R(30, -21, 9, 1, SN);
        R(1, -14, 30, 2, I); R(4, -18, 24, 2, I); R(15, -24, 2, 7, I); R(12, -21, 8, 1, I); R(4, -19, 24, 1, SN);
        const b = e.burn || 0;
        for (let x = 2; x < 31; x += 3) {
          const bent = b && (x === 11 || x === 20);
          R(x + (bent ? (x === 11 ? -1 : 1) : 0), -12, 1, 27, I); R(x, -13, 1, 1, '#2a2a30');
        }
        R(1, -6, 30, 1, Il); R(1, 8, 30, 1, Il); R(15, -12, 2, 27, '#0a0a0c');
        if (!b && !e.open) { R(13, 0, 6, 1, '#7a7468'); R(14, 1, 4, 4, '#6a5a3a'); }
        if (b) {
          const hot = b === 1, c1 = hot ? '#ff8a30' : '#1a1008', c2 = hot ? '#ffd890' : '#3a2010';
          const hand = (x, m) => { R(x - 3, 0, 6, 5, c1); R(x - 3 + (m ? 5 : 0), -3, 1, 4, c1); R(x - 2 + (m ? 1 : 0), -6, 1, 6, c1); R(x - 1 + (m ? 1 : 0), -7, 1, 7, c1); R(x + (m ? 1 : 0), -7, 1, 7, c1); R(x + 1 + (m ? 1 : 0), -6, 1, 6, c1); if (!m) R(x + 3, -2, 1, 3, c1); R(x - 2, 1, 4, 3, c2); };
          hand(10, false); hand(22, true);
          if (hot) { g.globalAlpha = .5 + Math.sin(t * 9) * .2; R(6, -6, 20, 12, 'rgba(255,140,60,.35)'); g.globalAlpha = 1; for (let i = 0; i < 4; i++) R(9 + i * 4, -8 - ((t * 14 + i * 5) % 12), 1, 2, 'rgba(240,240,240,.6)'); }
          else for (let i = 0; i < 2; i++) R(10 + i * 11, -6 - ((t * 6 + i * 7) % 10), 1, 1, 'rgba(220,220,220,.45)');
        }
        if (e.open) { R(2, -12, 1, 27, I); R(29, -12, 1, 27, I); }
      },
      purse(g, e, t, R) { R(2, -4, 1, 6, '#2a2a30'); R(3, 1, 9, 6, '#f2f0ea'); R(3, 1, 9, 1, '#ffffff'); for (let i = 0; i < 4; i++) R(4 + i * 2, 3 + (i % 2), 1, 1, '#d8d4e8'); R(7, 0, 2, 2, '#fffdf0'); if (Math.sin(t * 3) > .3) R(10, 2, 1, 1, '#ffffff'); },
      lpool(g, e, t, R) { if (e.off) return; g.globalAlpha = .55; R(4, 6, 40, 20, 'rgba(255,214,140,.16)'); R(8, 4, 32, 24, 'rgba(255,214,140,.12)'); R(2, 10, 44, 12, 'rgba(255,214,140,.1)'); g.globalAlpha = 1; R(6, 27, 36, 1, 'rgba(255,214,140,.25)'); },
      bneon(g, e, t, R) {   // 舞厅外墙：蓝鹭霓虹
        const on = Math.sin(t * 2.3) > -.85, c = on ? '#7ad8ff' : '#2a4a5a', c2 = on ? '#ff7ab0' : '#4a2a3a';
        R(4, -2, 104, 14, '#101418'); R(5, -1, 102, 12, '#182028');
        R(14, 1, 2, 8, c); R(16, 1, 6, 2, c); R(16, 4, 5, 2, c); R(16, 7, 6, 2, c);   // 简笔「蓝鹭」：一只单脚站着的鹭
        R(36, 2, 8, 2, c); R(42, 0, 2, 3, c); R(44, 0, 3, 1, c2); R(38, 4, 3, 5, c); R(39, 9, 1, 2, c);
        for (let i = 0; i < 7; i++) R(56 + i * 7, 3, 4, 4, (Math.floor(t * 3) + i) % 3 ? c2 : '#3a2a3a');
      },
      tavern(g, e, t, R) {   // 酒馆屋顶边缘、招牌、窗光
        R(0, 0, 144, 3, '#1a1416'); R(0, 3, 144, 2, '#2a2024');
        R(8, 4, 26, 4, 'rgba(255,190,110,.35)'); R(110, 4, 26, 4, 'rgba(255,190,110,.35)');
        const on = Math.sin(t * 1.7) > -.9;
        R(20, -10, 40, 12, '#0e0c10'); R(21, -9, 38, 10, '#1a1418');
        R(25, -6, 2, 5, on ? '#ff6a8a' : '#4a2a30'); R(27, -7, 4, 1, on ? '#ff6a8a' : '#4a2a30'); R(30, -7, 1, 4, on ? '#ff6a8a' : '#4a2a30'); R(29, -3, 2, 2, on ? '#ff6a8a' : '#4a2a30');   // 音符
        for (let i = 0; i < 4; i++) R(36 + i * 5, -6, 3, 4, on ? '#ffd27a' : '#4a3a20');
        R(98, -2, 30, 4, '#3a2a20'); R(98, -2, 30, 1, '#5a4030');
      },
      tdoor(g, e, t, R) { R(1, 0, 14, 10, '#2a1a12'); R(2, 1, 12, 9, '#c88a40'); R(3, 2, 10, 7, '#e8b060'); R(7, 2, 1, 7, '#8a5a2a'); R(0, -2, 16, 3, '#5a2a2a'); for (let x = 0; x < 16; x += 4) R(x, -2, 2, 3, '#d8c8b0'); },
      csign(g, e, t, R) { R(1, -10, 14, 9, '#2a2622'); R(2, -9, 12, 7, '#4a443c'); R(4, -7, 8, 1, '#c8c0a8'); R(4, -5, 6, 1, '#c8c0a8'); R(7, -1, 2, 14, '#2a2622'); R(1, -11, 14, 1, '#e8eef6'); },
      /* 舞厅里 */
      dmark(g, e, t, R) {
        const ph = e.ph || 0, res = e.res || 0;
        const c = res === 1 ? '#ffe070' : res === 2 ? '#ff5a4a' : '#fff4d0';
        g.globalAlpha = .35 + ph * .6;
        R(4, 3, 3, 5, c); R(4, 9, 3, 3, c); R(9, 5, 3, 5, c); R(9, 11, 3, 3, c);
        R(5, 2, 1, 1, c); R(10, 4, 1, 1, c);
        g.globalAlpha = 1;
        /* 拍点小灯：一小节几拍就几颗，走到哪一拍亮到哪一颗（静音也能踩准） */
        const n = e.per || 3, bt = e.bt ?? -1;
        for (let i = 0; i < n; i++) R(8 - n * 2 + i * 4 + 1, 17, 2, 2, i <= bt ? (i === n - 1 ? '#ffffff' : '#ffd27a') : 'rgba(255,220,160,.25)');
        /* 旁观的人：脚印旁边多一个小箭头，预告再下一步往哪儿走（一人报方向，一人踩） */
        if (!iControl() && e.nd != null && e.nd >= 0 && !res) {
          const A = '#7ad8ff', d = e.nd;
          if (d === 3) { R(7, -9, 2, 5, A); R(5, -8, 6, 1, A); R(6, -9, 4, 1, A); }
          else if (d === 0) { R(7, 18 + 4, 2, 5, A); R(5, 26, 6, 1, A); R(6, 27, 4, 1, A); }
          else if (d === 1) { R(-9, 7, 5, 2, A); R(-8, 5, 1, 6, A); R(-9, 6, 1, 4, A); }
          else { R(20, 7, 5, 2, A); R(24, 5, 1, 6, A); R(25, 6, 1, 4, A); }
        }
        if (!res) {
          const r = 4 + (1 - ph) * 15;
          g.strokeStyle = ph > .9 ? '#ffffff' : 'rgba(255,236,180,' + (.35 + ph * .6).toFixed(2) + ')'; g.lineWidth = ph > .9 ? 2 : 1;
          g.beginPath(); g.ellipse(e.sx + 8, e.sy + 8, r, r * .7, 0, 0, 7); g.stroke();
        } else { g.globalAlpha = .5; R(-2, -2, 20, 20, res === 1 ? 'rgba(255,224,112,.35)' : 'rgba(255,90,74,.3)'); g.globalAlpha = 1; }
      },
      mball(g, e, t, R) {
        R(7, -30, 2, 30, '#2a2a30');
        R(2, -2, 12, 12, '#8a8a96'); R(1, 1, 14, 6, '#8a8a96');
        for (let y = 0; y < 3; y++) for (let x = 0; x < 3; x++) R(3 + x * 4, y * 4 - 1, 3, 3, ((x + y + Math.floor(t * 4)) % 3) ? '#c8c8d8' : '#ffffff');
        if (!e.off) for (let i = 0; i < 9; i++) { const a = t * .7 + i * .7, rr = 18 + (i % 3) * 14; R(8 + Math.cos(a) * rr * 1.4, 40 + Math.sin(a) * rr * .6, 2, 2, 'rgba(255,250,230,.55)'); }
      },
      jbox(g, e, t, R) {
        const lit = e.lit, play = e.play;
        R(0, -14, 16, 29, '#3a2010'); R(1, -13, 14, 27, '#6a3a1a');
        R(2, -16, 12, 4, '#6a3a1a'); R(3, -17, 10, 2, '#7a4a2a');
        R(3, -11, 10, 9, lit ? '#3a2a18' : '#1a120c');
        for (let i = 0; i < 4; i++) R(4 + i * 2, -10 + (i % 2), 1, 7, lit ? '#1a1a1a' : '#0e0a08');
        if (play) { const a = t * 6; R(7 + Math.cos(a) * 2, -7 + Math.sin(a), 2, 2, '#c8c8c8'); }
        const L = lit ? (Math.sin(t * 2) > 0 ? '#ffb050' : '#ff8a40') : '#4a3020';
        R(2, -1, 12, 2, L); R(1, -12, 1, 24, lit ? '#ffd080' : '#5a3020'); R(14, -12, 1, 24, lit ? '#ffd080' : '#5a3020');
        R(3, 3, 10, 6, '#2a1a10'); for (let x = 4; x < 13; x += 2) R(x, 4, 1, 4, '#4a3020');
        R(4, 10, 8, 2, lit ? '#e8d8a8' : '#8a7a5a');
      },
      frame(g, e, t, R) { R(2, 0, 12, 13, '#6a4a1a'); R(3, 1, 10, 11, '#e8e0c8'); for (let y = 3; y < 11; y += 2) R(5, y, 6, 1, '#8a8070'); R(4, 2, 8, 1, '#3a3020'); if (!e.read) R(7, -4 + (Math.sin(t * 4) > 0 ? 1 : 0), 2, 2, '#ffe680'); },
      photo34(g, e, t, R) {
        R(1, 0, 30, 13, '#2a1c10'); R(2, 1, 28, 11, '#8a8478');
        for (let i = 0; i < 9; i++) { R(3 + i * 3, 3 + (i % 2), 2, 3, '#3a3630'); R(3 + i * 3, 2 + (i % 2), 2, 1, '#c8b8a0'); }
        for (let i = 0; i < 6; i++) if (i !== 2) { R(4 + i * 4, 7, 2, 4, i % 2 ? '#d8d0c0' : '#2a2620'); R(4 + i * 4, 6, 2, 1, '#c8b8a0'); }
        R(12, 6, 3, 5, '#f8f6f0'); R(12, 5, 3, 1, '#e8d080');
      },
      banner(g, e, t, R) {
        R(0, 1, 128, 11, '#2a1424'); R(1, 2, 126, 9, '#4a2040');
        for (let x = 4; x < 124; x += 8) R(x, 10, 4, 3, '#3a1830');
        R(56, 3, 2, 6, '#c8b070'); R(58, 3, 6, 2, '#c8b070'); R(62, 1, 2, 3, '#c8b070'); R(64, 1, 3, 1, '#d8a040'); R(58, 8, 1, 3, '#c8b070');
        R(20, 5, 24, 1, '#8a6a4a'); R(80, 5, 24, 1, '#8a6a4a');
      },
      swin(g, e, t, R) {
        R(2, 1, 12, 11, '#3a2a1a'); R(3, 2, 10, 9, '#1a2436'); R(3, 9, 10, 2, '#c8d0dc'); R(7, 2, 1, 9, '#3a2a1a'); R(3, 6, 10, 1, '#3a2a1a');
        for (let i = 0; i < 6; i++) R(4 + ((i * 3 + Math.floor(t * 2)) % 9), 2 + ((t * 4 + i * 3) % 8 | 0), 1, 1, '#e8eef6');
      },
      bottles(g, e, t, R) { R(0, 2, 48, 2, '#3a2416'); R(0, 8, 48, 2, '#3a2416'); for (let i = 0; i < 11; i++) { const c = ['#4a6a3a', '#7a3a1a', '#c8a050', '#3a4a6a', '#8a2a2a'][i % 5]; R(2 + i * 4, -3 + (i % 2), 2, 5, c); R(2 + i * 4, 4, 2, 4, ['#c8a050', '#4a6a3a', '#7a3a1a'][i % 3]); } },
      ctop(g, e, t, R) {
        const it = e.item;
        if (it === 'glass') { R(5, -4, 4, 5, 'rgba(200,220,230,.6)'); R(5, -2, 4, 3, '#c88a30'); R(10, -2, 3, 3, '#e8e0d0'); }
        if (it === 'tap') { R(6, -8, 3, 9, '#a8a8b0'); R(5, -9, 5, 2, '#5a3a20'); R(7, 0, 1, 2, '#888'); }
        if (it === 'ash') { R(4, -1, 7, 2, '#5a5a60'); R(6, -2, 3, 1, '#2a2a2a'); R(9, -3, 4, 1, '#e8e0d0'); R(13, -5 + Math.sin(t * 2), 1, 2, 'rgba(200,200,200,.4)'); }
        if (it === 'bell') { R(6, -2, 4, 3, '#d8b040'); R(7, -3, 2, 1, '#d8b040'); R(3, 1, 10, 1, '#e8e0d0'); }
        if (it === 'book') { R(3, -2, 10, 5, '#3a2a20'); R(4, -2, 8, 1, '#e8e0c8'); R(8, -2, 1, 5, '#1a1410'); if (!e.read) R(7, -7 + (Math.sin(t * 4) > 0 ? 1 : 0), 2, 2, '#ffe680'); }
        if (it === 'cup') { R(5, -2, 5, 4, '#e8e4d8'); R(10, -1, 2, 2, '#e8e4d8'); R(6, -2, 3, 1, '#3a2010'); R(7, -6 + Math.sin(t * 2), 1, 3, 'rgba(230,230,230,.4)'); }
        if (it === 'radio') { R(2, -5, 12, 8, '#4a2e18'); R(3, -4, 6, 6, '#c8b088'); for (let y = -3; y < 2; y += 2) R(3, y, 6, 1, '#8a7050'); R(10, -3, 3, 3, Math.sin(t * 2) > 0 ? '#ffc860' : '#e8a040'); }
      },
      stool(g, e, t, R) { R(4, 4, 8, 3, '#8a2a2a'); R(4, 4, 8, 1, '#aa4a4a'); R(7, 7, 2, 7, '#8a8a90'); R(4, 13, 8, 1, '#5a5a60'); },
      rack(g, e, t, R) { R(7, -10, 2, 24, '#3a2a1a'); R(3, -10, 10, 1, '#3a2a1a'); R(2, -9, 4, 10, '#4a4a5a'); R(10, -9, 4, 12, '#6a3a2a'); R(4, 13, 8, 1, '#2a1a10'); },
      drums(g, e, t, R) { R(2, 4, 12, 9, '#e8e4dc'); R(2, 4, 12, 2, '#c02a2a'); R(2, 11, 12, 2, '#c02a2a'); R(6, 6, 4, 4, '#2a2a30'); R(0, -2, 5, 2, '#d8b040'); R(11, -4, 5, 2, '#d8b040'); R(2, 0, 1, 4, '#888'); R(13, -2, 1, 6, '#888'); },
      dbass(g, e, t, R) { R(5, -12, 6, 8, '#7a3a1a'); R(3, -4, 10, 14, '#7a3a1a'); R(4, -3, 8, 12, '#9a5a2a'); R(7, -20, 2, 10, '#2a1a10'); R(6, 0, 1, 4, '#1a1a1a'); R(9, 0, 1, 4, '#1a1a1a'); R(7, 10, 2, 4, '#3a3a3a'); },
      mic(g, e, t, R) { R(7, -6, 2, 20, '#5a5a62'); R(5, 13, 6, 2, '#3a3a40'); R(6, -10, 4, 5, '#a8a8b0'); R(6, -10, 4, 1, '#d8d8e0'); },
      chand(g, e, t, R) {
        R(7, -30, 2, 26, '#c8a860');
        R(0, -4, 16, 2, '#c8a860'); R(2, -2, 12, 2, '#d8c080');
        for (let i = 0; i < 5; i++) { R(1 + i * 3, 0, 2, 4 + (i % 2) * 2, 'rgba(230,240,255,.85)'); R(1 + i * 3, -6, 2, 2, Math.sin(t * 7 + i) > -.6 ? '#fff4c0' : '#e8c880'); }
        R(6, 4, 4, 4, 'rgba(230,240,255,.8)');
      },
      clipf(g, e, t, R) { R(2, 0, 12, 13, '#3a2a1a'); R(3, 1, 10, 11, '#d8d0b8'); R(4, 2, 8, 2, '#3a3020'); for (let y = 5; y < 11; y += 2) R(4, y, 8, 1, '#8a8070'); R(9, 6, 3, 3, '#4a4a48'); if (!e.read) R(7, -4 + (Math.sin(t * 4) > 0 ? 1 : 0), 2, 2, '#ffe680'); }
    },
    tiles: {
      parq: { solid: false, paint(R, X, Y) {
        const A = '#8a5a32', B = '#7a4c28', L = '#5e3a1e';
        R(0, 0, 16, 16, (X + Y) % 2 ? A : B);
        if ((X + Y) % 2) { for (let x = 0; x < 16; x += 4) R(x, 0, 1, 16, L); } else { for (let y = 0; y < 16; y += 4) R(0, y, 16, 1, L); }
        R(0, 0, 16, 1, '#4a2e18'); R(0, 0, 1, 16, '#4a2e18');
        if (hash(X, Y, 3) < .4) R(3 + ((hash(X, Y, 4) * 8) | 0), 3 + ((hash(X, Y, 5) * 8) | 0), 3, 1, 'rgba(255,230,190,.12)');
      } },
      snow: { solid: false, paint(R, X, Y) { speck(R, '#c4ccd8', ['#d4dce8', '#b4bcc8', '#e2e8f2', '#aab2c0'], X, Y, 18, 31); } },
      snowbank: { solid: true, paint(R, X, Y) { speck(R, '#c8d0dc', ['#dce4ee', '#b0b8c6'], X, Y, 12, 33); R(0, 0, 16, 4, '#e2e8f2'); R(0, 4, 16, 1, '#d0d8e4'); for (let i = 0; i < 3; i++) R(((hash(X, Y, i) * 14) | 0), 6 + i * 3, 3, 1, '#a8b0be'); R(0, 14, 16, 2, '#9aa2b0'); } },
      spine: { solid: true, paint(R, X, Y) {
        speck(R, '#c4ccd8', ['#d4dce8', '#b4bcc8'], X, Y, 10, 34);
        const o = ((hash(X, Y, 7) * 3) | 0) - 1;
        R(7 + o, 11, 2, 5, '#3a2a1e'); R(2 + o, 6, 12, 6, '#1a2c22'); R(4 + o, 2, 8, 5, '#1e3426'); R(6 + o, 0, 4, 3, '#22382a');
        R(3 + o, 6, 10, 1, '#e8eef6'); R(5 + o, 2, 6, 1, '#e8eef6'); R(7 + o, 0, 2, 1, '#f4f8ff'); R(2 + o, 11, 4, 1, '#dce4ee'); R(10 + o, 11, 3, 1, '#dce4ee');
      } },
      ifence: { solid: true, paint(R, X, Y) {
        speck(R, '#c4ccd8', ['#d4dce8', '#b4bcc8'], X, Y, 10, 35);
        R(0, 3, 16, 1, '#141418'); R(0, 11, 16, 1, '#141418');
        for (let x = 1; x < 16; x += 3) { R(x, 0, 1, 15, '#121216'); R(x, -1, 1, 1, '#2a2a34'); R(x, 0, 1, 1, '#e8eef6'); }
        R(0, 15, 16, 1, '#a8b0be');
      } },
      roof: { solid: true, paint(R, X, Y) { R(0, 0, 16, 16, '#2a1e1c'); for (let y = 0; y < 16; y += 4) { R(0, y, 16, 1, '#1a1210'); for (let x = (y / 4 % 2) * 4; x < 16; x += 8) R(x, y, 1, 4, '#1a1210'); } R(0, 0, 16, 2, 'rgba(230,236,246,.7)'); } }
    },
    maps: {
      /* ---------------- 蓝鹭舞厅（1979） ---------------- */
      ballroom: {
        amb: 'room', dark: .38, plr: 3.4, wall: 'wood', floor: 'wood', legend: HLEG, tileOpts: { carpetC: '#5a2430', woodC: '#4a3020' },
        rows: hallRows(),
        ents: [
          { id: 'swin1', x: 2, y: 1, spr: 'swin', on: S => S.narr('窗外的雪下得正紧。停车场上，你那辆黄色出租车已经白了一半。') },
          { id: 'setlist', x: 4, y: 1, spr: 'frame', on: S => S.note('setlist') },
          { id: 'photo34', x: 6, y: 1, w: 2, spr: 'photo34', async on(S) {
            await S.narr('一张放大的黑白合影。底下的铜牌：「蓝鹭舞厅　1934年冬季舞会」。\n姑娘们的裙摆像一朵一朵倒扣的花，男孩子们的头发都抹得锃亮。');
            await S.narr('前排有个穿白裙子的金发姑娘，没在看镜头。\n她侧着脸，看着人群后面一个打领结的瘦高个儿。');
            if (S.f.d2 || S.f.ph === 'back') await S.think('……是玛丽。');
          } },
          { x: 8, y: 1, w: 8, spr: 'banner' },
          { x: 16, y: 1, spr: 'wallclock', on: S => S.narr(S.f.ph === 'back' ? '钟停在十二点。秒针在原地一下一下地抖。' : '十一点二十分。钟摆晃得很慢，像在跟着乐队打拍子。') },
          { x: 17, y: 1, spr: 'swin', on: S => S.narr('玻璃上蒙着一层水汽。有人在上面画了一颗心，又用手掌抹掉了一半。') },
          { x: 20, y: 1, w: 3, spr: 'bottles', on: S => S.narr('酒架上的酒瓶擦得一尘不染。最上面一层，放着一瓶没开封的香槟，瓶颈上系着一根褪色的白丝带。') },
          { id: 'jbox', x: 1, y: 2, spr: 'jbox', on: jukeOn },
          { x: 2, y: 5, spr: 'table', col: '#5a3424', on: S => S.narr('小圆桌上摆着两杯没喝完的潘趣酒，杯沿上一个口红印。') },
          { x: 1, y: 5, spr: 'chair', col: '#7a2a2a' }, { x: 3, y: 5, spr: 'chair', col: '#7a2a2a' },
          { x: 2, y: 9, spr: 'table', col: '#5a3424', item: 'cup', on: S => S.narr('老韦的咖啡早就凉了。杯子底下压着一张出租车公司的排班表。') },
          { x: 1, y: 9, spr: 'chair', col: '#7a2a2a' },
          { id: 'wei', x: 3, y: 9, spr: '@wei', dir: 1, oy: -2, on: weiTalk },
          { x: 8, y: 2, w: 2, spr: 'piano', on: S => S.narr('一架黑色的立式钢琴，琴盖上摆着一张乐谱，被翻得卷了边。') },
          { id: 'm1', x: 9, y: 3, spr: '@muso1', dir: 0, on: S => S.narr('吹萨克斯的老乐手闭着眼睛，腮帮子一鼓一鼓的。') },
          { id: 'mic', x: 10, y: 3, spr: 'mic' },
          { id: 'leader', x: 11, y: 3, spr: '@leader', dir: 0, on: leaderTalk },
          { x: 12, y: 2, spr: 'dbass' },
          { id: 'm2', x: 13, y: 2, spr: '@muso2', dir: 0, on: S => S.narr('拉低音提琴的乐手朝你点了点头，手指一下也没停。') },
          { id: 'm3', x: 14, y: 2, spr: '@muso3', dir: 0, on: S => S.narr('鼓手的刷子在军鼓上沙沙地扫，像雪落在伞上。') },
          { x: 14, y: 3, spr: 'drums' },
          { id: 'mball', x: 11, y: 6, spr: 'mball', solid: false, z: 1, oy: -56 },
          { id: 'c1a', x: 6, y: 6, spr: '@om1', dir: 0, on: S => S.say('老先生', '我们俩就是在这儿认识的。一九五一年。她那天踩了我十一脚。') },
          { id: 'c1b', x: 6, y: 7, spr: '@ow1', dir: 3, on: S => S.say('老太太', '是九脚。他到现在还记错。') },
          { id: 'c2a', x: 16, y: 8, spr: '@om2', dir: 0, on: S => S.say('老先生', '小伙子，难得看见年轻人来。……那边那个姑娘？什么姑娘？') },
          { id: 'c2b', x: 16, y: 9, spr: '@ow2', dir: 3, on: S => S.say('老太太', '别跟他说话，他耳朵背。……你在看那个穿白裙子的？她每回都站在那儿。') },
          { id: 'c3a', x: 9, y: 11, spr: '@om3', dir: 2, on: S => S.say('老先生', '这支狐步我跳了五十年，还是跳不好。') },
          { id: 'c3b', x: 10, y: 11, spr: '@ow3', dir: 1, on: S => S.say('老太太', '跳不好才要跳嘛。') },
          { id: 'mary', x: 17, y: 7, spr: '@mary', dir: 1, light: { r: 1.5, col: 'rgba(220,230,255,.14)' }, on: maryTalk },
          { id: 'dmark', x: 11, y: 8, spr: 'dmark', solid: false, decal: true, hidden: true },
          { x: 18, y: 4, spr: 'stool', solid: false }, { x: 18, y: 6, spr: 'stool', solid: false }, { x: 18, y: 8, spr: 'stool', solid: false },
          { x: 19, y: 3, spr: 'ctop', item: 'tap', on: S => S.narr('啤酒龙头上挂着一块小牌子：「本店不卖酒给开车的人」。底下有人用圆珠笔添了一句：「除了乔」。') },
          { id: 'ctop1', x: 19, y: 5, spr: 'ctop', item: 'glass', on: joeTalk },
          { x: 19, y: 7, spr: 'ctop', item: 'ash', on: S => S.narr('烟灰缸里只有一个烟头，烟嘴上一圈淡淡的口红。……这里今晚没有年轻姑娘抽烟。') },
          { id: 'joe', x: 20, y: 5, spr: '@joe', dir: 1, on: joeTalk },
          { id: 'coatc', x: 2, y: 12, spr: 'ctop', item: 'bell', on: coatTalk },
          { id: 'coat', x: 2, y: 13, spr: '@coat', dir: 3, on: coatTalk },
          { x: 1, y: 13, spr: 'rack' }, { x: 3, y: 13, spr: 'rack' },
          { x: 5, y: 2, spr: 'invisible', light: { r: 3.4, col: 'rgba(255,190,120,.12)' } },
          { x: 21, y: 4, spr: 'invisible', light: { r: 3.6, col: 'rgba(255,200,120,.14)' } },
          { x: 11, y: 2, spr: 'invisible', light: { r: 4.2, col: 'rgba(255,220,160,.12)', dy: 20 } },
          { x: 11, y: 14, spr: 'invisible', touch: exitHall }, { x: 12, y: 14, spr: 'invisible', touch: exitHall }
        ],
        async enter(S, first) {
          const f = S.f;
          if (first) {
            f.ph = 'night';
            await S.narr('门一推开，暖气、香水和铜管声一起扑到你脸上。');
            await S.narr('舞池里转着几对头发花白的老人。台上的大乐队在奏一支慢狐步。\n头顶上，一颗镜面球慢悠悠地转，把光斑洒了一地。');
            await S.think('爷爷说过，他和奶奶就是在这儿认识的。一九四七年。');
            S.goal('在舞厅里转转（舞池边站着一个穿白裙子的姑娘）');
            return;
          }
          if (f.ph === 'walk') {
            f.ph = 'back';
            closeHall(S);
            S.place('joe', 20, 5, 1);
            await S.narr('舞厅的大灯全熄了，只有吧台上还亮着一盏小灯。\n椅子都倒扣在桌上。镜面球不转了，舞池黑得像一口井。');
            await S.narr('吧台后面，老酒保还在擦杯子。一个，又一个。');
            S.goal('和吧台后面的乔谈谈');
            S.cp('back');
          }
        },
        tick(S, dt) {
          const f = S.f;
          danceTick(S, dt);
          if (f.ph === 'night' && !W._dn && !f.d2) {
            swayTick(S, [['c1a', 'c1b', 0, 3], ['c2a', 'c2b', 0, 3], ['c3a', 'c3b', 2, 1]], dt);
            bandTick(S, dt);
          }
        }
      },
      /* ---------------- 阿彻大道 ---------------- */
      archer: {
        amb: 'wind', dark: .8, plr: 2.6, wall: 'brick', floor: 'asphalt', legend: RLEG, darkC: '#04060c',
        rows: roadRows(),
        ents: [
          { x: 2, y: 2, w: 7, spr: 'bneon', light: { r: 3.2, col: 'rgba(120,200,255,.14)', dx: 56, dy: 16 } },
          { x: 2, y: 4, spr: 'window', lit: true, light: { r: 2.4, col: 'rgba(255,210,140,.16)', dy: 22 }, on: S => S.narr(S.f.ph === 'walk' || S.f.ph === 'back' ? '窗户里黑着，只有吧台那一点光。' : '窗户里人影晃来晃去，乐队的声音隔着玻璃，闷闷的。') },
          { id: 'hdoor', x: 5, y: 4, spr: 'door', col: '#4a2a2a', async on(S) {
            const f = S.f;
            if (f.inCab) return S.narr('你还在车里。');
            if (f.ph === 'leave') return S.narr('舞厅的灯已经灭了一半。玛丽在车边等你。');
            S.sfx('open');
            await S.go('ballroom', 11, 13, 3);
          } },
          { x: 8, y: 4, spr: 'window', lit: true, light: { r: 2.4, col: 'rgba(255,210,140,.16)', dy: 22 }, on: S => S.narr('玻璃上贴着一张手写的海报：「每周六晚　大乐队之夜」。') },
          { x: 4, y: 6, spr: 'invisible', light: { r: 4.6, col: 'rgba(255,200,140,.1)' } },
          { id: 'cabp', x: 8, y: 7, spr: 'cabR', dir: 2, on: cabOn },
          { id: 'marya', x: 9, y: 6, spr: '@mary', dir: 1, hidden: true, solid: false, light: { r: 1.4, col: 'rgba(220,230,255,.16)' }, on: S => S.say('玛丽', S.f.ph === 'leave' ? '车……是那辆黄色的吗？' : '……') },
          { id: 'hl', x: 8, y: 7, spr: 'invisible', hidden: true, light: HL[2] },
          // 路南的路灯：亮着的四盏 + 坏掉的一盏
          ...LAMPS.map(L => ({ id: 'L' + L, x: L, y: 11, spr: 'streetlamp', light: { r: 2.6, col: 'rgba(255,214,140,.2)', dy: -8 }, on: S => S.narr('路灯底下的雪被照得发黄。光圈不大，刚好罩住三四步路肩。') })),
          ...LAMPS.map(L => ({ id: 'P' + L, x: L - 1, y: 9, w: 3, h: 2, spr: 'lpool', solid: false, decal: true })),
          ...BROKEN.map(L => ({ id: 'L' + L, x: L, y: 11, spr: 'streetlamp', off: true, on: S => S.narr('这盏灯的灯罩碎了，灯泡里积满了雪。\n它前后那一大段路，黑得什么也看不见。') })),
          { x: 20, y: 11, spr: 'sign', col: '#2a5a3a', on: S => S.narr('路牌：「阿彻大道」。底下一块小牌子：「前方公墓　请减速」。') },
          { x: 37, y: 11, spr: 'sign', col: '#b08a20', on: S => S.narr('黄色的菱形牌子：「路滑」。牌子被撞弯过，又被人掰了回来。') },
          // 公墓
          { id: 'csign', x: 50, y: 5, spr: 'csign', on: S => S.narr('「复活公墓」。\n铁牌子上的字被雪糊住了一半。') },
          { id: 'Lg', x: 53, y: 5, spr: 'streetlamp', light: { r: 3, col: 'rgba(255,214,140,.16)', dy: 10 } },
          { id: 'gate', x: 56, y: 5, w: 2, spr: 'cgate', on: gateOn },
          { id: 'purse', x: 57, y: 5, spr: 'purse', solid: false, z: 1, hidden: true, on: purseOn },
          { x: 48, y: 2, spr: 'gravestone' }, { x: 51, y: 3, spr: 'gravestone' }, { x: 52, y: 1, spr: 'cross' }, { x: 54, y: 3, spr: 'gravestone' },
          { x: 59, y: 3, spr: 'gravestone' }, { x: 60, y: 1, spr: 'statue' }, { x: 62, y: 3, spr: 'gravestone' }, { x: 63, y: 2, spr: 'cross' }, { x: 66, y: 3, spr: 'gravestone' }, { x: 68, y: 1, spr: 'gravestone' },
          // 旋律酒馆（路南）
          { x: 52, y: 11, w: 9, spr: 'tavern', decal: true, light: { r: 3.4, col: 'rgba(255,170,100,.2)', dx: 72, dy: -6 } },
          { id: 'tdoor', x: 56, y: 11, spr: 'tdoor', async on(S) { S.sfx('open'); await S.go('tavern', 6, 8, 3); } },
          { id: 'gcar', x: 70, y: 8, spr: 'gcar', solid: false, hidden: true, z: 1, light: { r: 5.5, col: 'rgba(255,240,190,.24)', dx: -44, dy: 8 } },
          { id: 'hud', x: 5, y: 6, spr: 'hud', solid: false, z: 2, light: { r: 4.4, a: 0, col: null } }
        ],
        async enter(S, first) {
          const f = S.f;
          S.plr(null);
          if (f.inCab) { S.amb('car'); return; }
          S.amb('wind');
          if (f.ph === 'leave' && S.once('outside')) {
            await S.narr('雪下大了。阿彻大道上一辆车也没有，路灯一盏隔一盏地亮着。\n玛丽站在你的出租车旁边，光着两条胳膊，一点也不像冷的样子。');
            S.goal('上车（出租车停在门口），送玛丽回家');
          }
          if (f.ph === 'gate' && f.rule) await readyWalk(S);
        },
        step(S, x, y) {
          const f = S.f;
          if (f.inCab) {
            if (f.ph === 'drive') {
              if (x >= 15 && S.once('ev_meter')) return evMeter(S);
              if (x >= 25 && S.once('ev_hum')) return evHum(S);
              if (x >= 35 && S.once('ev_mirror')) return evMirror(S);
              if (x >= 47 && !f.asked) return stopAsk(S);
            }
            return;
          }
          if (x <= 0 || x >= 70) return (async () => { await S.narr('路往前一直伸进雪里，看不见头。\n不是这个方向。'); await S.walk('pl', x <= 0 ? 'r' : 'l', 5); })();
          if (f.ph === 'leave' && x >= 12) return (async () => { await S.narr('走着去？这么大的雪。\n玛丽还在车边等你。'); await S.walk('pl', 'l', 5); })();
          if (f.ph === 'gate' && x <= 50) return (async () => {
            await S.narr(!S.has('purse') ? '铁门上好像挂着什么东西，在雪光里一闪一闪的。\n先回去看看。' : '两英里多的雪路，就这么走回去？\n对面那家酒馆还亮着灯——先去打个电话。');
            await S.walk('pl', 'r', 5);
          })();
        },
        tick(S, dt) {
          const f = S.f, p = S.pl, cab = isCab(S);
          const hud = getEnt('hud', 'archer'); if (hud) { hud.px = p.px; hud.py = p.py; }
          const hl = getEnt('hl', 'archer');
          if (hl) { hl.hidden = !cab; if (cab) { const L = HL[f.cf === 1 ? 1 : 2]; if (hl.light !== L) hl.light = L; } }
          if (cab) {
            if (p.dir === 1 || p.dir === 2) f.cf = p.dir;
            const want = (String(p.spr).startsWith('cabp') ? 'cabp' : 'cab') + (f.cf === 1 ? 'L' : 'R');
            if (p.spr !== want) S.wear(want);
            W._eng = (W._eng ?? .5) - dt; if (W._eng <= 0) { W._eng = .5; S.tone('sawtooth', 62, 58, .35, .012, 0, 300); }
          }
          carTick(S, dt);
        }
      },
      /* ---------------- 旋律酒馆 ---------------- */
      tavern: {
        amb: 'room', dark: .45, plr: 3.4, wall: 'wood', floor: 'linoleum', tileOpts: { woodC: '#4a3020' },
        rows: [
          '##############',
          '##############',
          '#WWWWWWWWWCnn#',
          '#WWWWWWWWWCnn#',
          '#CCCCCCCCCCnn#',
          '#nnnnnnnnnnnn#',
          '#nnnnnnnnnnnn#',
          '#nnnnnnnnnnnn#',
          '#nnnnnnnnnnnn#',
          '######n#######'],
        ents: [
          { x: 2, y: 1, w: 3, spr: 'bottles' },
          { id: 'clipf', x: 11, y: 1, spr: 'clipf', on: S => S.note('clip') },
          { x: 12, y: 1, spr: 'swin', on: S => S.narr('窗户正对着马路那头的公墓大门。\n你的出租车还停在门口，车顶的灯黑着，车顶上的雪越积越厚。') },
          { id: 'phone', x: 12, y: 5, spr: 'payphone', async on(S) {
            S.sfx('phone');
            await S.narr('你投了一枚硬币。听筒里没有拨号音。');
            for (let i = 0; i < 6; i++) S.tone('square', i % 3 ? 1100 : 1500, i % 3 ? 1100 : 1500, .03, .02, .3 + i * .42, 3000);
            await S.narr('只有很远很远的地方，有人在轻轻地数拍子：\n一、二、三。一、二、三。');
            await S.think('你挂上了电话。硬币没有退出来。');
          } },
          { x: 2, y: 4, spr: 'ctop', item: 'radio', on: S => S.narr('收音机里在播天气：「今夜全市大雪，阿彻大道部分路段积雪严重，请勿夜间步行。」') },
          { id: 'barbc', x: 5, y: 4, spr: 'ctop', item: 'cup', on: barbTalk },
          { id: 'logbook', x: 8, y: 4, spr: 'ctop', item: 'book', on: async S => { S.f.readLog = true; await S.note('cabbie'); } },
          { id: 'barb', x: 5, y: 3, spr: '@barb', dir: 0, on: barbTalk },
          { x: 3, y: 5, spr: 'stool', solid: false }, { x: 5, y: 5, spr: 'stool', solid: false }, { x: 7, y: 5, spr: 'stool', solid: false },
          { x: 10, y: 7, spr: 'table', col: '#4a3020', on: S => S.narr('桌上一只烟灰缸，一顶出租车公司的帽子，一张写了一半的纸：\n「1979.12　她又——」后面没写下去。') },
          { x: 9, y: 7, spr: 'chair', col: '#5a3a2a' },
          { id: 'sleeper', x: 11, y: 7, spr: '@sleeper', dir: 1, oy: -2, on: S => S.narr('一个老司机趴在桌上打呼噜。\n他的胳膊底下，压着一张褪了色的黑白照片：舞厅门口，一个穿白裙子的金发姑娘。') },
          { x: 1, y: 8, spr: 'stove', light: { r: 2.8, col: 'rgba(255,150,80,.2)', flick: true }, on: S => S.narr('铁皮暖炉烧得通红。你把手伸过去，半天才觉出一点暖意。') },
          { x: 6, y: 2, spr: 'invisible', light: { r: 4.4, col: 'rgba(255,200,130,.12)' } },
          { x: 6, y: 9, spr: 'invisible', async touch(S) { S.sfx('open'); await S.go('archer', 56, 10, 3); } }
        ],
        async enter(S, first) {
          if (!first) return;
          await S.narr('门上的铃铛「叮」地响了一声。\n酒馆里只有一个客人，趴在角落的桌子上睡着了。吧台后面，一个头发花白的老板娘抬起头。');
          S.goal('和老板娘说说话');
        }
      },
      /* ---------------- 1934 年的舞厅 ---------------- */
      vision: {
        amb: 'none', dark: .3, plr: 3.6, wall: 'paper', floor: 'wood', legend: HLEG, darkC: '#1a1008', tileOpts: { carpetC: '#6a3a2a', woodC: '#5a3a20' },
        rows: hallRows(),
        ents: [
          { x: 2, y: 1, spr: 'swin' }, { x: 17, y: 1, spr: 'swin' },
          { x: 4, y: 1, spr: 'frame', read: true }, { x: 16, y: 1, spr: 'wallclock' },
          { x: 8, y: 1, w: 8, spr: 'banner' }, { x: 20, y: 1, w: 3, spr: 'bottles' },
          { x: 8, y: 2, w: 2, spr: 'piano' }, { x: 12, y: 2, spr: 'dbass' }, { x: 14, y: 3, spr: 'drums' }, { x: 10, y: 3, spr: 'mic' },
          { x: 9, y: 3, spr: '@gm', dir: 0, alpha: .55 }, { x: 13, y: 2, spr: '@gm', dir: 0, alpha: .55 }, { x: 14, y: 2, spr: '@gm', dir: 0, alpha: .55 }, { x: 11, y: 3, spr: '@gm', dir: 0, alpha: .6 },
          { id: 'v1a', x: 6, y: 6, spr: '@gm', dir: 0, alpha: .5 }, { id: 'v1b', x: 6, y: 7, spr: '@gw', dir: 3, alpha: .5 },
          { id: 'v2a', x: 16, y: 8, spr: '@gm', dir: 0, alpha: .5 }, { id: 'v2b', x: 16, y: 9, spr: '@gw2', dir: 3, alpha: .5 },
          { id: 'v3a', x: 8, y: 11, spr: '@gm', dir: 2, alpha: .5 }, { id: 'v3b', x: 9, y: 11, spr: '@gw', dir: 1, alpha: .5 },
          { id: 'v4a', x: 13, y: 11, spr: '@gm', dir: 2, alpha: .5 }, { id: 'v4b', x: 14, y: 11, spr: '@gw2', dir: 1, alpha: .5 },
          { x: 8, y: 6, spr: 'chand', solid: false, z: 1, oy: -56, light: { r: 4.6, col: 'rgba(255,220,150,.16)', dy: -20 } },
          { x: 14, y: 6, spr: 'chand', solid: false, z: 1, oy: -56, light: { r: 4.6, col: 'rgba(255,220,150,.16)', dy: -20 } },
          { id: 'maryv', x: 11, y: 8, spr: '@mary', dir: 0, light: { r: 1.8, col: 'rgba(230,236,255,.18)' } },
          { id: 'joev', x: 18, y: 9, spr: '@joe', dir: 1, hidden: true },
          { id: 'dmark', x: 11, y: 8, spr: 'dmark', solid: false, decal: true, hidden: true }
        ],
        async enter(S, first) { await visionStart(S, !first); },
        tick(S, dt) {
          danceTick(S, dt);
          swayTick(S, [['v1a', 'v1b', 0, 3], ['v2a', 'v2b', 0, 3], ['v3a', 'v3b', 2, 1], ['v4a', 'v4b', 2, 1]], dt);
        }
      }
    }
  });

  /* ---------- 黄色方头出租车（只画横向；face 1=朝左 2=朝右；pass=后座有人） ---------- */
  function cabSpr(R, pass, face, t) {
    const Y = '#e8b830', Yd = '#a07818', Yl = '#f8d860', GL = '#141c28', CH = '#c8c6bc', TY = '#0c0a0a';
    const H = (x, y, w, h, c) => R(face === 2 ? x : 16 - x - w, y, w, h, c);
    H(-8, 14, 32, 2, 'rgba(0,0,0,.5)');
    H(-9, 5, 34, 10, Yd); H(-8, 6, 32, 7, Y); H(-8, 6, 32, 1, Yl);
    H(-4, -2, 20, 9, Yd); H(-3, -1, 18, 7, Y); H(-3, -1, 18, 1, Yl);
    H(-2, 0, 7, 5, GL); H(6, 0, 8, 5, GL);
    for (let x = -8; x < 24; x += 4) { H(x, 9, 2, 1, '#1a1a1a'); H(x + 2, 10, 2, 1, '#1a1a1a'); }
    H(3, -5, 8, 3, '#1a1a1a'); H(4, -4, 6, 1, Math.sin(t * 2) > -.5 ? '#fff0a0' : '#c8a040');
    H(-8, 12, 32, 1, CH);
    H(-6, 11, 7, 5, TY); H(14, 11, 7, 5, TY); H(-4, 13, 3, 2, '#666'); H(16, 13, 3, 2, '#666');
    H(23, 7, 2, 3, '#fff2b0'); H(-9, 7, 1, 3, '#d02020');
    H(-3, -1, 18, 1, 'rgba(240,244,255,.9)');
    if (pass) { H(-1, 1, 3, 4, '#e6cc7a'); H(-1, 3, 3, 2, '#f2e8e2'); H(1, 4, 1, 1, '#3a64a8'); }
  }
})();
