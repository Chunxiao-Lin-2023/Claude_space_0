/* ================= 第二十四夜 · 分身女（Manananggal） ================= */
(() => {
  const cyc = (S, key, lines) => lines[(S.f[key] = ((S.f[key] ?? -1) + 1) % lines.length)];
  /* 会话内计数（不进存档）：死过几次 → 重来时给规则小结 / 逐级提示 */
  const FAILS = { guard: 0, sky: 0, grove: 0, siege: 0 };

  /* ---------- 合成音效（双方都听得到） ---------- */
  const tiktik = (S, v = .05) => { for (let i = 0; i < 2; i++) { S.tone('square', 2500, 2300, .025, v, i * .17, 6000); S.tone('triangle', 1250, 1150, .03, v * .5, i * .17, 4000); } };
  const scratch = (S, v = .06) => { for (let i = 0; i < 7; i++) S.tone('sawtooth', 240 + Math.random() * 140, 120, .05, v, i * .07, 1000); };
  const flap = (S, v = .1, n = 3, gap = .32) => { for (let i = 0; i < n; i++) { S.tone('sine', 92, 38, .17, v, i * gap, 420); S.tone('triangle', 230, 110, .12, v * .45, i * gap + .02, 700); } };
  const hiss = S => { S.tone('sawtooth', 1900, 500, .38, .04, 0, 3600); S.tone('square', 900, 300, .25, .015, .05, 2000); };
  const slurp = S => { S.tone('sine', 320, 110, .45, .06, 0, 900); S.tone('triangle', 150, 80, .55, .05, .12, 600); };
  const shriek = (S, v = .06) => { S.tone('sawtooth', 1300, 2300, .5, v, 0, 4200); S.tone('square', 1550, 820, .75, v * .5, .4, 3000); S.tone('sawtooth', 2100, 1700, .4, v * .6, .9, 4200); };
  const heart = S => { S.tone('sine', 62, 40, .12, .2); S.tone('sine', 56, 38, .12, .16, .18); };
  const bell = (S, t, v = .08) => { S.tone('sine', 660, 652, 1.8, v, t, 3200); S.tone('sine', 1322, 1300, .9, v * .35, t, 3200); };
  const angelus = S => { [0, 1.1, 2.2, 4.2, 5.3, 6.4, 8.4, 9.5, 10.6].forEach(t => bell(S, t, .07)); };   // 三钟经：三下、三下、三下
  const rooster = S => { let t = 0; for (const [a, b, d] of [[560, 760, .16], [760, 700, .14], [700, 980, .3], [980, 520, .6]]) { S.tone('sawtooth', a, b, d, .05, t, 2600); S.tone('square', a * 1.01, b, d, .015, t, 2000); t += d + .03; } };
  const hum = S => { [392, 440, 392, 330, 294, 330, 392, 330].forEach((f, i) => S.tone('sine', f, f, .55, .045, i * .5, 1600)); };   // 外婆哼的摇篮曲
  const babyCry = S => { for (let i = 0; i < 3; i++) { S.tone('triangle', 620, 820, .25, .05, i * .55, 3000); S.tone('triangle', 820, 560, .3, .05, i * .55 + .25, 3000); } };

  /* ---------- 小工具 ---------- */
  function bfsDist(m, sx, sy) {
    const D = new Map(), q = [[sx, sy]]; D.set(sx + ',' + sy, 0);
    while (q.length) { const [x, y] = q.shift(), d = D.get(x + ',' + y); for (const [dx, dy] of DIRS) { const nx = x + dx, ny = y + dy, k = nx + ',' + ny; if (D.has(k) || !passable(m, nx, ny, W.pl)) continue; D.set(k, d + 1); q.push([nx, ny]); } }
    return D;
  }
  const pick = a => a[(Math.random() * a.length) | 0];
  async function fly(S, id, tx, ty, sec) {   // 飞行：直线插值（竹丛、屋顶这些实心格子挡不住她）
    const e = S.ent(id), x0 = e.px, y0 = e.py, n = Math.max(1, Math.round(sec * 20));
    for (let i = 1; i <= n; i++) { e.px = x0 + (tx * TS - x0) * i / n; e.py = y0 + (ty * TS - y0) * i / n; await S.wait(50); }
    e.x = tx; e.y = ty;
  }

  /* =====================================================================
     危险一：屋顶的缝（守）
     她在屋顶上撕开一道缝（沙沙声 + 草屑往下掉 + 一道月光），1.1 秒后舌头往下垂；
     跑过去调查那道缝 = 塞进一头蒜。舌头垂到底：第一次外婆撒盐救下，第二次——死。
     ===================================================================== */
  const SPOTS = { g1: '堂屋', g2: '堂屋', g3: '莉莎房里', g4: '莉莎房里', g5: '厨房', g6: '厨房' };
  const PROBES = 5, WARN = 1.1, DESC = [3.8, 3.4, 3.1, 2.8, 2.6];
  const G = { st: 'off', k: 0, spot: null, sc: 0 };
  const LZ = { st: 'off', id: null, k: 0, sc: 0 };   // 天亮前：被抠松的那头蒜
  function guardReset(S) {
    G.st = 'off'; G.k = 0; G.spot = null;
    for (const id in SPOTS) { const e = S.ent(id); e.hidden = true; e.s = {}; e.light = null; }
    S.f.pn = 0; S.f.strike = 0;
  }
  function startProbe(S) {
    const m = curMap(), D = bfsDist(m, W.pl.x, W.pl.y);
    const open = Object.keys(SPOTS).filter(id => !S.ent(id).s.seal);
    const dd = id => { const e = S.ent(id); return D.get(Math.round(e.px / TS) + ',' + Math.round(e.py / TS)) ?? 99; };
    let c = open.filter(id => dd(id) >= 5 && dd(id) <= 13);
    if (!c.length) c = open.filter(id => dd(id) >= 2);
    if (!c.length) c = open;
    const id = pick(c), e = S.ent(id);
    e.hidden = false; e.s = { st: 'warn', tg: 0 }; e.light = { r: 1.5, col: 'rgba(190,205,255,.14)' };
    G.spot = id; G.st = 'warn'; G.k = WARN; G.sc = 0;
    tiktik(S, .012); scratch(S, .07);
    const L = S.ent('lola'); if (L && !L.hidden) { const lx = Math.round(L.px / TS), ly = Math.round(L.py / TS), ex = Math.round(e.px / TS), ey = Math.round(e.py / TS); S.face('lola', Math.abs(ex - lx) > Math.abs(ey - ly) ? (ex < lx ? 1 : 2) : (ey < ly ? 3 : 0)); S.bubble('lola', '!', 1300); }
    S.toast(S.f.pn === 0 ? `（沙沙沙——${SPOTS[id]}的屋顶上！草屑往下掉，月光漏进来了——快跑过去！）` : `（沙沙沙——${SPOTS[id]}顶上！）`);
  }
  function guardTick(S, dt) {
    if (S.f.ph !== 'guard' || S.map !== 'bahay' || G.st === 'off' || S.busy) return;
    if (G.st === 'gap') { G.k -= dt; if (G.k <= 0) startProbe(S); return; }
    const e = S.ent(G.spot);
    if (G.st === 'warn') {
      G.k -= dt; G.sc -= dt; if (G.sc <= 0) { G.sc = .35; scratch(S, .05); }
      if (G.k <= 0) { G.st = 'tongue'; G.k = 0; e.s.st = 'tongue'; e.s.tg = .02; slurp(S); }
      return;
    }
    if (G.st === 'tongue') {
      G.k += dt / DESC[Math.min(S.f.pn, DESC.length - 1)]; e.s.tg = Math.min(1, G.k);
      G.sc -= dt; if (G.sc <= 0) { G.sc = .7; heart(S); }
      if (G.k >= 1) { G.st = 'hit'; S.run(strike); }
    }
  }
  function nextProbe(S) {
    S.f.pn++;
    if (S.f.pn >= PROBES) { G.st = 'off'; return true; }
    G.st = 'gap'; G.k = 2.2 + Math.random();
    tiktik(S, .07);
    if (S.f.pn === 2) S.toast('（tik-tik 声又响又远……可每次她扑下来之前，都轻得几乎听不见。）');
    return false;
  }
  async function gapOn(S, e) {
    if (S.f.ph === 'guard' && G.spot === e.id && (G.st === 'warn' || G.st === 'tongue')) {
      e.s = { seal: 1 }; e.light = null; S.sfx('thud'); hiss(S);
      S.toast(G.st === 'tongue' ? '你把一头蒜死死塞进缝里——上面「嘶」的一声，舌头缩回去了。' : '你抢在舌头下来之前，把蒜塞进了缝里。上面一阵乱抓。');
      if (nextProbe(S)) return guardWin(S);
      return;
    }
    if (LZ.st === 'on' && LZ.id === e.id) {
      e.s = { seal: 1 }; e.light = null; LZ.st = 'off'; S.sfx('thud'); hiss(S);
      S.toast('你把蒜重新塞回缝里，用手掌死死按住。上面「嘶」的一声。');
      return;
    }
    if (e.s.seal) {   // 封好的缝不抢别的东西的调查：面前有东西就调查面前的
      const p = W.pl, tx = p.x + DIRS[p.dir][0], ty = p.y + DIRS[p.dir][1];
      const f = entsAt(curMap(), tx, ty, z => typeof z.on === 'function' && z.spr !== 'gap')[0];
      if (f) return f.on(S, f);
    }
    if (e.s.seal === 2) return S.narr('撒上去的那把盐还粘在缝边上，白花花的。');
    if (e.s.seal) return S.narr('缝里卡着一头蒜。蒜皮被抓破了，辣味冲得人眼睛发酸。');
    return S.narr('屋顶上漏下来一线光。');
  }
  async function strike(S) {
    const e = S.ent(G.spot);
    S.f.strike = (S.f.strike || 0) + 1;
    if (S.f.strike >= 2) {
      FAILS.guard++;
      S.sfx('scream');
      await S.scare('face', { spr: '@mana', face: 'mana', sfx: 'scream' });
      return S.die('那条舌头又细又长，像一根湿透的麻绳，\n从屋顶的缝里一直垂到蚊帐上，钻了进去。\n莉莎的叫声只响了一下。', '屋顶的缝');
    }
    S.sfx('scream'); S.shake(500, 3);
    await S.say('莉莎', '啊——！有东西……有东西碰到蚊帐了！', { style: 'big' });
    S.face('lola', 1);
    await S.narr('外婆抓起一把盐，朝那道缝扬了上去。\n「嘶——」舌头像被烫了一样缩回屋顶。盐粒落了一地。');
    e.s = { seal: 2 }; e.light = null;
    await S.say('外婆', '拉蒙！听见沙沙响就跑过去！别等它垂到底！');
    await S.think('（下一次外婆就来不及了。听声音、看哪里掉草屑和月光——跑过去，对着缝调查。可以跑。）');
    if (nextProbe(S)) return guardWin(S);
  }

  /* =====================================================================
     危险二：天上的影子（村里找油迹时）
     扑翅声 1.3 秒后，一大片翅膀的影子从头顶扫过。站在屋檐下（深色的檐影）或芭蕉叶底下才安全。
     第一次被扫到：扑倒、后背一道血痕（警告）；第二次——死。
     ===================================================================== */
  const SH = { st: 'off', t: 0, k: 0, x0: 0, chk: false, fl: 0 };
  function covered(S) {
    const m = curMap(), x = W.pl.x, y = W.pl.y, c = m.mods[y * m.w + x] ?? m.rows[y][x];
    if (c === 'v') return true;
    return m.ents.some(e => !e.hidden && e.spr === 'saging' && Math.round(e.px / TS) === x && Math.round(e.py / TS) === y);
  }
  function skyReset(S, first) { SH.st = 'idle'; SH.t = first ?? (4 + Math.random() * 2); SH.k = 0; SH.chk = false; const k = S.ent('kpak'); if (k) k.hidden = true; }
  function skyTick(S, dt) {
    if (S.f.ph !== 'hunt' || S.map !== 'baryo' || SH.st === 'off' || S.busy) return;
    const k = S.ent('kpak');
    if (SH.st === 'idle') {
      SH.t -= dt;
      if (SH.t <= 0) {
        SH.st = 'warn'; SH.k = 1.3; SH.fl = 0; S.bubble('pl', '!', 1300);
        S.toast(S.f.skyN < 3 ? '扑——扑——头顶上有翅膀的声音！躲到屋檐下或芭蕉叶底下！' : '扑——扑——');
        S.f.skyN = (S.f.skyN || 0) + 1;
      }
      return;
    }
    if (SH.st === 'warn') {
      SH.k -= dt; SH.fl -= dt;
      if (SH.fl <= 0) { SH.fl = .42; flap(S, .1 + (1.3 - SH.k) * .06, 1); }
      if (SH.k <= 0) {
        SH.st = 'pass'; SH.k = 0; SH.chk = false;
        const dir = Math.random() < .5 ? 1 : -1; SH.dir = dir; SH.x0 = W.pl.px - dir * 11 * TS;
        k.hidden = false; k.px = SH.x0; k.py = W.pl.py; k.dir = dir > 0 ? 2 : 1;
        flap(S, .16, 2, .2); S.tone('sawtooth', 600, 200, .5, .03, 0, 1500);
      }
      return;
    }
    if (SH.st === 'pass') {
      SH.k += dt / 1.1;
      k.px = SH.x0 + SH.dir * SH.k * 22 * TS;
      if (!SH.chk && SH.k >= .5) { SH.chk = true; if (!covered(S)) { SH.st = 'hit'; k.hidden = true; return S.run(skyHit); } }
      if (SH.k >= 1) { k.hidden = true; SH.st = 'idle'; SH.t = 6 + Math.random() * 3.5; }
    }
  }
  async function skyHit(S) {
    S.f.sky = (S.f.sky || 0) + 1;
    shriek(S, .07);
    if (S.f.sky >= 2) {
      FAILS.sky++;
      await S.scare('face', { spr: '@mana', face: 'mana', sfx: 'scream' });
      return S.die('一阵腥风从头顶压下来。\n两只又冷又硬的爪子扣住你的肩膀，你的脚离开了地面——\n稻田、屋顶、教堂的十字架，一下子都在你脚底下了。', '天上的影子');
    }
    S.fx('flash'); S.shake(600, 4); S.sfx('thud');
    await S.narr('一阵腥风从头顶压下来。你扑倒在泥地上，后背被什么东西划了一道，火辣辣地疼。\n翅膀拍了两下，那东西又飞高了。');
    await S.think('（扑翅声一响，马上躲到屋檐底下（墙根那一溜深色的檐影）或者芭蕉叶下面。\n下一次——她不会再扑空了。）');
    skyReset(S, 5);
  }

  /* ---------- 人物 ---------- */
  const SELA = { skin: '#b07a52', hair: '#16100c', hs: 'bun', top: '#6a8a5a', top2: '#e8dcc0', bottom: '#4a3a52', skirt: true, shoes: '#5a4030', mouth: '#a05a4a', eye: '#1a1010' };
  const MANA = { key: 'mn-mana', skin: '#a8805e', hair: '#0c0808', hs: 'long', top: '#6a8a5a', top2: '#e8dcc0', ghost: true, noFeet: true, redEye: true,
    extra(g, d, fr, G, R) { if (d === 0) { R(3, G.hT - 1, 1, 12, '#0c0808'); R(12, G.hT - 1, 1, 13, '#0c0808'); R(7, G.hT + 9, 2, 3, '#5a1818'); R(7, G.hT + 12, 1, 3, '#7a2424'); } else if (d === 1) { R(10, G.hT + 1, 3, 12, '#0c0808'); R(3, G.hT + 9, 2, 4, '#5a1818'); } else R(3, G.hT + 1, 10, 13, '#0c0808'); } };

  defChapter({
    id: 'manananggal', n: 24, title: '分身女', sub: '她的下半身还站在竹林里。天亮之前，别让她合上。', origin: '菲律宾民间传说（阿斯旺）', color: '#3a2236',
    amb: 'night', floor: 'dirt', wall: 'wood', dark: .72, plr: 3,
    thumb(g, w, h) {
      g.fillStyle = '#e8e0c0'; g.beginPath(); g.arc(w * .78, h * .26, 11, 0, 7); g.fill();
      g.fillStyle = 'rgba(232,224,192,.15)'; g.beginPath(); g.arc(w * .78, h * .26, 17, 0, 7); g.fill();
      /* 椰叶屋顶 */
      g.fillStyle = '#1a120c'; g.beginPath(); g.moveTo(w * .06, h - 22); g.lineTo(w * .3, h * .5); g.lineTo(w * .56, h - 22); g.fill();
      g.fillStyle = '#2a1e14'; for (let i = 0; i < 9; i++) g.fillRect(w * .1 + i * 7, h - 26 - (i < 5 ? i : 8 - i) * 5, 5, 2);
      /* 半截女人 + 蝙蝠翅膀 */
      const cx = w * .55, cy = h * .3;
      g.fillStyle = '#0c0608';
      for (const s of [-1, 1]) { g.beginPath(); g.moveTo(cx, cy + 4); g.lineTo(cx + s * 36, cy - 14); g.lineTo(cx + s * 30, cy - 2); g.lineTo(cx + s * 24, cy + 4); g.lineTo(cx + s * 16, cy + 2); g.lineTo(cx + s * 10, cy + 10); g.fill(); }
      g.fillRect(cx - 4, cy - 6, 8, 18); g.fillRect(cx - 5, cy - 13, 10, 8);
      g.fillStyle = '#ff3a2a'; g.fillRect(cx - 3, cy - 10, 2, 1); g.fillRect(cx + 1, cy - 10, 2, 1);
      g.fillStyle = '#6a1a1a'; g.fillRect(cx - 1, cy + 12, 1, 22); g.fillRect(cx, cy + 30, 1, 6);   // 垂向屋顶的舌头
      /* 竹林边站着的一双腿 */
      g.fillStyle = '#1e3a1e'; for (let i = 0; i < 4; i++) g.fillRect(w - 18 + i * 4, h - 70, 2, 48);
      g.fillStyle = '#4a3a52'; g.fillRect(w - 34, h - 40, 10, 8);
      g.fillStyle = '#8a6040'; g.fillRect(w - 33, h - 32, 3, 10); g.fillRect(w - 28, h - 32, 3, 10);
      g.fillStyle = '#5a1414'; g.fillRect(w - 34, h - 41, 10, 2);
    },
    endings: { ninang: '教母', dawn: '鸡叫天亮', window: '屋顶的窗', joined: '她合上了' },
    people: {
      me: { skin: '#b07a52', hair: '#141010', hs: 'short', top: '#e8e4da', top2: '#3a6a9a', bottom: '#3a4a6a', shoes: '#3a6a9a' },
      lola: { key: 'mn-lola', skin: '#9a6a46', hair: '#cfcfcf', hs: 'bun', top: '#ece4d2', top2: '#d8c8a8', bottom: '#6a3a5a', skirt: true, shoes: '#3a2a1a',
        extra(g, d, fr, G, R) { if (d !== 3) { R(5, G.tT + 2, 1, 1, '#c86a8a'); R(9, G.tT + 3, 1, 1, '#c86a8a'); R(7, G.tT + 5, 1, 1, '#c86a8a'); } } },
      lolaS: { key: 'mn-lolas', skin: '#8a5e40', hair: '#cfcfcf', hs: 'messy', top: '#ece4d2', top2: '#d8c8a8', bottom: '#6a3a5a', skirt: true, shoes: '#3a2a1a',
        extra(g, d, fr, G, R) { if (d !== 3) { R(3, G.tT + 4, 3, 2, '#e8e8e0'); R(3, G.tT + 4, 3, 1, '#c84a4a'); } } },
      sela: Object.assign({ key: 'mn-sela', extra(g, d, fr, G, R) { if (d !== 3) { R(5, G.tT + 2, 1, 1, '#e8c0c8'); R(9, G.tT + 4, 1, 1, '#e8c0c8'); R(6, G.tT + 6, 1, 1, '#e8c0c8'); R(10, G.tT + 1, 1, 1, '#e8c0c8'); } } }, SELA),
      mana: MANA,
      paz: { key: 'mn-paz', skin: '#c08a60', hair: '#2a1a14', hs: 'bob', top: '#d8a040', top2: '#c08a30', bottom: '#4a4a5a', skirt: true, apron: true, shoes: '#5a3a2a' },
      rosa: { key: 'mn-rosa', skin: '#b8865c', hair: '#0e0a0a', hs: 'long', top: '#26242a', top2: '#3a3840', bottom: '#26242a', skirt: true, shoes: '#2a2a2a',
        extra(g, d, fr, G, R) { if (d === 0) { for (let i = 0; i < 4; i++) R(6 + i, G.tT + 3 + (i % 2), 1, 1, '#c8c0a0'); R(8, G.tT + 6, 1, 2, '#c8c0a0'); } } }
    },
    faces: {
      mana(R, a, t) {   // 倒挂在屋顶破洞里的脸：两边撑开的蝙蝠翅膀、血红的眼睛、一直垂下去的舌头
        R(0, 0, 32, 32, '#060406');
        const fl = Math.round(Math.sin(t * 9) * 1.5);
        for (const s of [0, 1]) {
          const X = x => s ? 31 - x : x, W2 = (x, y, w, h, c) => R(s ? 32 - x - w : x, y, w, h, c);
          W2(0, 3 + fl, 9, 2, '#2a1a22'); W2(0, 5 + fl, 8, 10, '#1a0e14'); W2(1, 15 + fl, 3, 4, '#1a0e14'); W2(5, 14 + fl, 3, 3, '#1a0e14');
          W2(2, 4 + fl, 1, 14, '#4a3038'); W2(5, 4 + fl, 1, 12, '#4a3038'); W2(8, 4 + fl, 1, 9, '#4a3038'); void X;
        }
        R(9, 1, 14, 6, '#0c0808'); R(8, 4, 2, 14, '#0c0808'); R(22, 4, 2, 16, '#0c0808');
        R(10, 5, 12, 15, '#a8805e'); R(11, 4, 10, 1, '#a8805e'); R(11, 20, 10, 2, '#98704e');
        R(10, 5, 1, 15, '#8a6444'); R(21, 5, 1, 15, '#8a6444');
        R(10, 3, 12, 3, '#0c0808'); R(13, 6, 1, 3, '#0c0808'); R(19, 6, 1, 4, '#0c0808');
        R(12, 9, 3, 3, '#f0e0d0'); R(18, 9, 3, 3, '#f0e0d0');
        const bl = Math.sin(t * 6) > .95 ? 1 : 0;
        if (!bl) { R(13, 10, 1, 1, '#ff2a1a'); R(19, 10, 1, 1, '#ff2a1a'); R(12, 9, 1, 1, '#c84a3a'); R(20, 11, 1, 1, '#c84a3a'); }
        else { R(12, 10, 3, 1, '#5a3a2a'); R(18, 10, 3, 1, '#5a3a2a'); }
        R(11, 8, 4, 1, '#3a2418'); R(18, 8, 4, 1, '#3a2418');
        const o = Math.min(4, 1 + Math.floor(a * 6));
        R(13, 16, 6, o, '#1a0404'); R(12, 16, 1, 1, '#e8e0d0'); R(19, 16, 1, 1, '#e8e0d0'); R(13, 15, 6, 1, '#6a3030');
        const L = Math.min(16, Math.floor(a * 22));   // 舌头越伸越长
        R(15, 16 + o - 1, 2, L, '#8a1e24'); R(15, 16 + o - 1, 1, L, '#a8323a'); if (L > 3) R(14, 16 + o - 1 + L, 4, 2, '#6a1418');
      },
      sela(R, a, t) {   // 合上以后的赛拉大婶：笑得很和气——眼睛里映着一个倒立的小人
        R(0, 0, 32, 32, '#0c0a08'); R(6, 2, 20, 6, '#16100c'); R(13, 0, 6, 3, '#16100c');
        R(8, 6, 16, 20, '#b07a52'); R(9, 5, 14, 1, '#b07a52'); R(10, 26, 12, 3, '#a06c46'); R(8, 6, 1, 20, '#94643e'); R(23, 6, 1, 20, '#94643e');
        R(8, 5, 16, 3, '#16100c');
        R(10, 12, 5, 4, '#f0e8dc'); R(17, 12, 5, 4, '#f0e8dc'); R(11, 12, 3, 4, '#1a1010'); R(18, 12, 3, 4, '#1a1010');
        if (a > .4) { R(12, 13, 1, 1, '#e8dcc0'); R(12, 14, 1, 1, '#3a6a9a'); R(19, 13, 1, 1, '#e8dcc0'); R(19, 14, 1, 1, '#3a6a9a'); R(12, 12, 1, 1, '#3a4a6a'); R(19, 12, 1, 1, '#3a4a6a'); }   // 倒着的你
        R(10, 10, 5, 1, '#3a2418'); R(17, 10, 5, 1, '#3a2418');
        R(15, 17, 2, 3, '#94643e');
        R(12, 22, 8, 1, '#7a3a30'); R(11, 21, 1, 1, '#7a3a30'); R(20, 21, 1, 1, '#7a3a30');
        if (a > .7) { R(13, 23, 6, 1, '#5a1414'); }
        R(5, 28, 22, 4, '#6a8a5a'); R(9, 28, 1, 1, '#e8c0c8'); R(20, 29, 1, 1, '#e8c0c8');
      }
    },
    items: {
      asin: { name: '一包粗盐', desc: '帕丝大婶用旧报纸包的一包海盐，颗粒又粗又白。外婆说，卡皮斯的盐是海风晒出来的。' },
      ahos: { name: '一串大蒜', desc: '外婆从灶边墙上取下来的一整串大蒜，用香蕉树皮的细绳编成辫子。辣味冲鼻子。' },
      halo: { name: '一碗盐蒜灰', desc: '椰壳碗里，捣烂的大蒜、粗盐和灶灰拌在一起，灰扑扑、湿乎乎的一团，辣得眼睛发酸。' },
      takure: { name: '一壶热水', desc: '铝壶烫手，你用衣角垫着提。' }
    },
    notes: {
      komiks: { title: '漫画周刊《午夜惊奇》', text: '（一本翻得卷了边的恐怖漫画周刊，是莉莎躺着解闷看的。封面上画着一个长着蝙蝠翅膀的半截女人，趴在椰叶屋顶上。）\n\n第 7 格：月亮底下，一个女人在自家后院往身上抹油。\n第 8 格：「嘶——啦——」她的上半身从腰那里断开，背上撑开一对蝙蝠翅膀。下半身还直直地站在芭蕉树底下。\n第 9 格：她趴在一户人家的屋顶上。屋里睡着一个大肚子的女人。一条又细又长的舌头，从屋顶的缝里慢慢垂下来……\n第 12 格：主角在芭蕉树下找到那半截身子，往断口上撒了一把盐。\n第 13 格：「天亮了！她合不回去了！」\n\n（最后一页读者来信：「我外婆说光撒盐不够，还要捣大蒜。」「我们那里撒的是灶灰。」编辑回复：「各地说法不同，欢迎来信。」）' },
      tape: { title: '录音带家书 · 第六盘', text: '（一盘贴着胶布的磁带，胶布上写着「给莉莎 · 第六盘」。你按下播放键。嘶嘶的底噪之后，是姐夫多东的声音，背景里有空调嗡嗡地响。）\n\n「莉莎，是我。利雅得这边四十几度，我们中午在工棚里睡觉，晚上干活。\n钱这个月寄了，比上个月多一百里亚尔。给孩子买个摇篮，别买太贵的。\n外婆还好吗？她又在窗户上挂大蒜了吧？你就随她，老人家图个安心。\n屋顶那几处漏雨的缝，等我回去再补。雨季之前，你们先拿塑料布盖一盖。\n……我昨晚梦见孩子了。是个女孩，眼睛像你。\n名字等我回来一起取。」\n\n（磁带里沉默了好一会儿，只有空调的声音。）\n\n「……替我摸摸她。」' },
      libro: { title: '外婆的小本子', text: '（封皮用旧日历纸糊的。前面记的是鸡蛋钱、米钱、谁家欠了几个比索。翻到后面，字变得又老又细——是外婆的外婆那一辈传下来的话，外婆一笔一笔抄过来的。）\n\n怎么认出阿斯旺（aswang）：\n· 白天和人一样，待人特别和气，常往有孕妇的人家走动。\n· 不吃咸的。\n· 盯着她的眼睛看，里面映出来的你，是倒着的。\n· 夜里听见 tik-tik 的叫声：声音越小，她越近。\n\n会分身的那一种（manananggal）：\n· 夜里抹了油，从腰那里断开，长出蝙蝠一样的翅膀飞走，下半身留在原地。\n· 专找怀孕的女人。屋顶有缝，她就把舌头伸下来。\n· 天亮以前必须飞回去，和下半身合上。合不上，太阳一照，她就完了。\n\n最后一页——口诀：\n　　海水晒干剩下的，\n　　一瓣一瓣抱成团的，\n　　火走了以后留下的。\n　　三样一起捣匀，撒在她断开的地方，\n　　太阳会替你做完剩下的事。' },
      aviso: { title: '小教堂门口的布告栏', text: '（布告栏上钉着两张纸。）\n\n【五月花节（Flores de Mayo）】\n本月每天傍晚六点，三钟经之后，请孩子们带鲜花到小教堂献给圣母。月底最后一个星期日举行圣十字游行（Santacruzan），请各家姑娘报名。\n\n【村长告示】（手写，字很大）\n近来邻近几个村子，接连有怀孕的妇女夜里受惊，说屋顶上有响动。\n请各家晚上关好门窗，屋顶有破洞的尽早修补。\n不要乱传谣言，不要上门找人麻烦。\n有事，敲教堂的钟。' }
    },
    legend: 'Manananggal（马纳南加尔）的名字来自他加禄语 tanggal——「分开、卸下」。她是菲律宾「阿斯旺」（aswang）一类精怪里最出名的一种：白天是村里普普通通、甚至格外和气的女人；夜里在身上抹油，从腰部断开，上半身长出蝙蝠一样的翅膀飞走，下半身留在原地。人们相信她专找怀孕的女人，趴在椰叶或茅草屋顶上，从缝隙里垂下一条又细又长的舌头。流传最广的破解法是：找到她留下的下半身，在断口上撒盐、抹捣碎的大蒜或撒灰，她就合不回去，天一亮便会死去。大蒜、盐、圣水、黄貂鱼尾做的鞭子（buntot pagi）、刀，都被说成能挡住她；还有一种说法：看阿斯旺的眼睛，映出来的人影是倒着的。\n\n各地说法差别很大。米沙鄢一带常把这类精怪统称为阿斯旺，也有人用夜里的叫声给它们起名：tik-tik、wakwak；据说 tik-tik 声越轻，它其实越近。班乃岛的卡皮斯省在全国「以阿斯旺多出名」，这个名声让不少卡皮斯人哭笑不得，也让当地人背了很久的玩笑与偏见。有研究者认为，阿斯旺的形象与西班牙殖民时期传教士把本地女祭司、草药师（babaylan）说成魔鬼有关；历史上被指为阿斯旺的，也常常是寡妇、外来者、独居的女人。据说二十世纪五十年代，还曾有外国军事顾问在菲律宾的反游击战里利用过阿斯旺传说吓唬人（见于当事人的回忆录）。马来半岛的「佩南加兰」（penanggalan）、泰国的 krasue 等，都是会和身体分开、夜里飞出来的女鬼，东南亚各地的说法彼此呼应。\n\n二十世纪的菲律宾漫画周刊（komiks）和电影把分身女画得家喻户晓，直到今天她仍是菲律宾恐怖片的常客。本章里的「三钟经」「五月花节」、在窗口挂蒜、海外劳工寄回家的录音带家书，都是那个年代菲律宾乡村常见的生活细节。\n\n（本章的村子、拉蒙一家、赛拉大婶、帕丝大婶、罗莎，那本小本子上的口诀，屋顶上数缝塞蒜、天上翅膀影子的规矩，以及结局，均为游戏虚构；盐、蒜、灰与「倒着的人影」是民间说法，并非宗教信仰的一部分。）',
    start: { map: 'bahay', x: 4, y: 6, dir: 3 },
    async intro(S) {
      await S.card('第二十四夜　分身女', '1989年5月　菲律宾 班乃岛 卡皮斯省 一个种稻的村子', '外婆家在稻田边上，一座竹子和椰叶搭的高脚屋。\n姐姐莉莎怀孕八个多月了，姐夫在沙特做工，一年才回来一次。\n\n卡皮斯在全菲律宾都有名——\n别处的人都说，这里阿斯旺最多。\n\n村里人听了只是笑。\n可一到晚上，家家户户还是把大蒜挂在窗口。');
    },
    resume: {
      guard: async S => {
        guardReset(S); S.ent('lola').hidden = false;
        await S.think(FAILS.guard ? '（规矩：沙沙声 + 草屑 + 一道月光 = 她在那里撕屋顶。马上跑过去对着那道缝调查，把蒜塞进去。\n舌头垂到底之前塞进去就行。别站着等——可以跑。）' : '（听见沙沙响，就跑过去把蒜塞进那道缝。）');
        G.st = 'gap'; G.k = 2;
      },
      hunt: async S => {
        S.f.sky = 0; skyReset(S, 4);
        if (FAILS.sky) await S.think('（扑翅声一响，就躲到屋檐底下（房子墙根那一溜深色的檐影）或芭蕉叶下面，等影子过去。\n跟着地上反光的油迹走。）');
      },
      grove: async S => groveStart(S, true),
      siege: async S => siegeStart(S, true)
    },
    tick(S, dt) {
      guardTick(S, dt); skyTick(S, dt);
      if (S.f.ph === 'grove' && S.map === 'kawayan' && !S.busy) groveTick(S, dt);
      if (S.f.ph === 'dawnwait' && S.map === 'bahay') siegeTick(S, dt);
    },
    tiles: {
      slat: { solid: false, paint(R, X, Y) {   // 竹片地板：一条条劈开的竹片，缝里透着底下的黑
        R(0, 0, 16, 16, '#14100a');
        for (let i = 0; i < 4; i++) { const c = hash(X * 4 + i, Y, 3) < .5 ? '#9a8450' : '#8a7444'; R(i * 4, 0, 3, 16, c); R(i * 4, 0, 1, 16, shade(c, .12)); if (hash(X, Y * 4 + i, 5) < .35) R(i * 4, (hash(X, i, Y) * 13) | 0, 3, 1, '#6a5a32'); }
      } },
      eave: { solid: false, paint(R, X, Y) {   // 屋檐底下：泥地上压着一溜深色的檐影，檐口垂下几缕椰叶
        speck(R, '#3a2e20', ['#433524', '#30261a', '#4a3a28'], X, Y, 10, 9);
        R(0, 0, 16, 7, 'rgba(8,6,4,.62)'); R(0, 7, 16, 2, 'rgba(8,6,4,.3)');
        for (let i = 0; i < 4; i++) R(1 + i * 4 + ((hash(X, Y, i) * 2) | 0), 0, 1, 3 + ((hash(Y, X, i) * 3) | 0), '#5a4a2a');
      } },
      paddy: { solid: true, paint(R, X, Y) {   // 水田：一汪浅水里插着一撮撮秧苗
        R(0, 0, 16, 16, '#1c2a26'); if (hash(X, Y, 2) < .5) R(2, 6, 5, 1, 'rgba(170,190,200,.18)');
        for (let i = 0; i < 4; i++) { const x = 2 + (i % 2) * 8, y = 2 + ((i / 2) | 0) * 8; R(x, y + 2, 1, 3, '#3a6a32'); R(x + 1, y, 1, 5, '#4a7a3a'); R(x + 2, y + 1, 1, 4, '#3a6a32'); }
      } },
      dike: { solid: false, paint(R, X, Y) { R(0, 0, 16, 16, '#1c2a26'); R(1, 1, 14, 14, '#4a3e2a'); R(2, 2, 12, 2, '#5a4c34'); if (hash(X, Y, 1) < .5) R(4, 9, 2, 2, '#3a6a32'); } },
      kawayan: { solid: true, paint(R, X, Y) {   // 竹丛：一根根黄绿的竹竿挤在一起，竹节一圈圈
        R(0, 0, 16, 16, '#0e140c');
        for (let i = 0; i < 5; i++) { const x = ((hash(X, Y, i) * 13) | 0), c = i % 2 ? '#5a7a32' : '#6a8a3a'; R(x, 0, 2, 16, c); R(x, 0, 1, 16, shade(c, .2)); for (let y = (i * 3) % 6; y < 16; y += 6) R(x, y, 2, 1, '#3a5020'); }
        if (hash(X, Y, 9) < .4) { R(2, 3, 4, 1, '#3a5a24'); R(10, 9, 4, 1, '#3a5a24'); }
      } },
      litter: { solid: false, paint(R, X, Y) { speck(R, '#2a2414', ['#4a4020', '#3a3018', '#5a5028', '#22301a'], X, Y, 16, 4); if (hash(X, Y, 8) < .3) R(3, 7, 6, 1, '#6a6030'); } }
    },
    sprites: {
      gap(g, e, t, R) {   // 屋顶撕开的缝：一道月光、往下掉的草屑；舌头从上往下垂（tg 0→1）；seal=1 卡着蒜，2 撒着盐
        if (e.dawn) { R(4, -40, 8, 52, 'rgba(255,225,160,.16)'); R(2, 8, 12, 6, 'rgba(255,225,160,.14)'); }
        if (e.seal) {
          R(4, 10, 8, 4, 'rgba(0,0,0,.25)');
          if (e.seal === 1) { R(5, 7, 6, 6, '#e8e0cc'); R(6, 6, 4, 1, '#d8d0bc'); R(7, 5, 2, 1, '#b8a888'); R(6, 8, 1, 4, '#c8bca0'); R(9, 8, 1, 4, '#c8bca0'); }
          else for (let i = 0; i < 9; i++) R(2 + ((hash(e.px, i, 1) * 12) | 0), 4 + ((hash(i, e.py, 1) * 10) | 0), 1, 1, '#f0f0f0');
          return;
        }
        const a = .16 + Math.sin(t * 3) * .03;
        R(4, -40, 8, 52, `rgba(200,215,255,${a.toFixed(2)})`); R(2, 8, 12, 6, `rgba(200,215,255,${(a * .8).toFixed(2)})`);
        for (let i = 0; i < 6; i++) { const y = ((t * 40 + i * 9) % 50) - 38; R(4 + ((hash(i, e.px, 3) * 8) | 0), y, 1, 2, '#8a7444'); }
        if (e.st === 'tongue') {
          const L = Math.round(e.tg * 50), y0 = -40;
          R(7, y0, 2, L, '#7a1a20'); R(7, y0, 1, L, '#a8323a');
          R(6, y0 + L, 4, 2, '#5a1218'); R(7, y0 + L + 2, 2, 1, '#5a1218');
          if (L > 10) for (let i = 0; i < 3; i++) R(8, y0 + ((t * 60 + i * 16) % L), 1, 1, '#c84a50');
        }
      },
      kulambo(g, e, t, R) {   // 挂着蚊帐的床，莉莎侧躺在里面，肚子圆圆的
        box(R, 0, 0, 32, 30, '#5a3c26'); R(2, 2, 28, 26, '#d8d0c0'); R(2, 2, 7, 26, '#ece6da');
        const br = e.labor ? Math.round(Math.sin(t * 6)) : 0;
        R(3, 6, 6, 6, '#120c0a'); R(4, 7, 5, 5, '#b8845a');
        R(9, 7 + br, 14, 8, '#c87a8a'); R(13, 4 + br, 9, 4, '#c87a8a'); R(14, 3 + br, 7, 1, '#d88a9a');
        R(9, 15, 18, 6, '#9a5a6a'); R(23, 15, 5, 4, '#b8845a');
        R(2, 20, 28, 8, '#7a8aa8'); R(2, 20, 28, 1, '#8a9ab8');
        R(-1, -16, 34, 46, 'rgba(235,235,225,.22)'); R(-1, -16, 34, 2, 'rgba(240,240,232,.5)');
        for (let x = 3; x < 32; x += 6) R(x, -14, 1, 44, 'rgba(240,240,232,.16)');
        R(-1, -16, 1, 46, 'rgba(240,240,232,.4)'); R(32, -16, 1, 46, 'rgba(240,240,232,.4)');
      },
      kalan(g, e, t, R) {   // 泥土灶：灶口的火、锅或水壶、灶前一堆灰
        box(R, 0, 2, 16, 13, '#8a5a3a'); R(1, 3, 14, 2, '#a06a44'); R(4, 8, 8, 6, '#1a0e08');
        if (e.fire) { const f = Math.sin(t * 14 + e.px) > 0 ? 1 : 0; R(5, 10 + f, 6, 4 - f, '#ff8a2a'); R(6, 11, 4, 3, '#ffd05a'); R(7, 9 + f, 2, 2, '#ff6a1a'); }
        else { R(5, 12, 6, 2, '#5a1a0a'); R(6, 12, 1, 1, '#c84a1a'); }
        if (e.kettle) { R(3, -4, 10, 7, '#a8acb0'); R(4, -5, 8, 1, '#c8ccd0'); R(12, -2, 3, 1, '#a8acb0'); R(6, -7, 4, 2, '#7a7e82'); if (e.fire) R(7, -12 + ((t * 8) % 4), 2, 3, 'rgba(230,230,230,.3)'); }
        else { R(2, -2, 12, 5, '#2a2422'); R(3, -3, 10, 1, '#3a3432'); }
        R(1, 14, 6, 2, '#8a8682'); R(2, 13, 4, 1, '#a8a4a0');
      },
      hatch(g, e, t, R) {   // 灶上方墙高处的天窗：竹框、椰叶编的窗板，用一根竹竿支着
        box(R, 2, 0, 12, 11, '#4a3420'); R(3, 1, 10, 9, e.open ? '#0a1020' : '#7a6438');
        if (e.open) { R(5, 3, 1, 1, '#e8e8f0'); R(10, 5, 1, 1, '#c8c8d8'); }
        else { for (let y = 2; y < 10; y += 2) R(3, y, 10, 1, '#6a5430'); R(3, 1, 10, 1, '#8a7448'); }
        R(7, 10, 1, 6, '#9a8450'); R(6, 14, 3, 1, '#7a6438');
        if (e.smoke) for (let i = 0; i < 4; i++) { const y = 12 - ((t * 6 + i * 4) % 16); R(3 + ((hash(i, 2, 5) * 8) | 0), y, 4, 2, 'rgba(170,165,160,.35)'); }
      },
      bawang(g, e, t, R) {   // 墙上挂的一串大蒜
        R(7, -2, 2, 4, '#8a7a4a'); const n = e.n ?? 6;
        for (let i = 0; i < n; i++) { const x = 4 + (i % 2) * 5, y = 1 + i * 2; R(x, y, 5, 4, '#ece4d0'); R(x + 1, y - 1, 3, 1, '#d8ccb0'); R(x + 2, y + 1, 1, 3, '#c8b898'); }
      },
      lusong(g, e, t, R) { R(3, 5, 10, 10, '#6a4a2a'); R(2, 5, 12, 2, '#8a6038'); R(4, 6, 8, 2, '#2a1a0e'); R(3, 14, 10, 1, '#3a2614'); R(9, -6, 2, 13, '#9a7a4a'); R(9, -6, 2, 2, '#b89a5a'); },
      banga(g, e, t, R) { R(3, 4, 10, 10, '#8a4a2a'); R(2, 6, 12, 6, '#9a5432'); R(4, 2, 8, 2, '#7a3a20'); R(5, 2, 6, 1, e.oil ? '#c8a040' : '#1a2a30'); R(4, 7, 3, 3, '#b06a42'); R(3, 14, 10, 1, '#3a2014'); if (e.oil) R(6, 5, 1, 6, 'rgba(220,180,80,.5)'); },
      jars(g, e, t, R) {   // 架子上一排罐子
        box(R, 0, -6, 16, 21, '#5a3c22'); R(1, 2, 14, 1, '#3a2614'); R(1, 9, 14, 1, '#3a2614');
        R(2, -3, 4, 5, '#e8e8e0'); R(7, -3, 3, 5, '#d8c8a0'); R(11, -3, 3, 5, '#c8a870');
        R(2, 4, 5, 5, '#a8a49a'); R(8, 4, 3, 5, '#7a5a3a'); R(12, 5, 2, 4, '#4a6a3a');
        R(2, 11, 4, 3, '#e8e4d8'); R(7, 11, 7, 3, '#b8a080');
      },
      santo(g, e, t, R) {   // 小供桌：圣婴像、一枝蜡烛、一小束花
        box(R, 1, 4, 14, 11, '#5a3420'); R(2, 5, 12, 1, '#7a4a2a');
        R(6, -4, 4, 9, '#b82a2a'); R(6, -6, 4, 3, '#d8b090'); R(6, -7, 4, 1, '#d8b040'); R(7, -8, 2, 1, '#e8c850'); R(5, 0, 1, 4, '#b82a2a'); R(10, 0, 1, 4, '#b82a2a');
        R(12, 0, 1, 5, '#ece8dc'); const f = Math.sin(t * 13) > 0 ? 1 : 0; R(12, -2 + f, 1, 2, '#ffd05a');
        R(2, 1, 3, 4, '#3a6a32'); R(2, 0, 1, 1, '#f0f0e8'); R(4, 0, 1, 1, '#f0f0e8'); R(3, -1, 1, 1, '#f0f0e8');
      },
      tapedeck(g, e, t, R) { R(1, 6, 14, 8, '#2a2a2e'); R(2, 7, 5, 5, '#141416'); R(9, 7, 5, 5, '#141416'); R(3, 8, 3, 3, '#4a4a50'); R(10, 8, 3, 3, '#4a4a50'); R(6, 4, 4, 2, '#5a5a60'); R(2, 13, 12, 1, '#c84a2a'); },
      banig(g, e, t, R) {   // 草席；oil=席子上一个油亮的人形印子
        R(0, 2, 32, 12, '#a88a58'); for (let y = 2; y < 14; y += 2) R(0, y, 32, 1, (y / 2) % 2 ? '#b89a66' : '#98804e');
        for (let x = 0; x < 32; x += 4) R(x, 2, 1, 12, 'rgba(120,40,40,.25)');
        if (e.oil) { R(4, 5, 22, 6, 'rgba(200,170,70,.45)'); R(8, 4, 12, 1, 'rgba(200,170,70,.35)'); R(26, 7, 3, 2, 'rgba(200,170,70,.35)'); }
      },
      saging(g, e, t, R) {   // 芭蕉：细细的假茎，几片宽大下垂的叶子（站在叶子底下能躲开天上的眼睛）
        const s = Math.round(Math.sin(t * 1.2 + e.px) * 1);
        R(7, -2, 2, 17, '#5a6a32'); R(7, -2, 1, 17, '#6a7a3a');
        for (const [x, y, w, d] of [[-6, -10, 12, 1], [8, -12, 13, -1], [-4, -18, 11, 1], [6, -20, 12, -1]]) { R(x + s, y, w, 4, '#3a6a2a'); R(x + s, y, w, 1, '#5a9a3a'); R(x + s + 2, y + 2, w - 4, 1, '#2a5222'); R(x + s + (d > 0 ? 0 : w - 3), y + 4, 3, 2, '#3a6a2a'); }
        R(0, 10, 16, 5, 'rgba(0,0,0,.35)');
        R(2, 13, 12, 3, 'rgba(0,0,0,.35)');
      },
      lana(g, e, t, R) { const a = .5 + Math.sin(t * 3 + e.px * .1) * .3; R(6, 8, 3, 2, `rgba(220,180,70,${a.toFixed(2)})`); R(10, 5, 2, 1, `rgba(220,180,70,${(a * .7).toFixed(2)})`); R(7, 8, 1, 1, '#fff0b0'); },
      tiil(g, e, t, R) {   // 留在竹林里的下半身：裙摆、两条腿，腰上的断口湿漉漉的
        R(2, 14, 12, 2, 'rgba(0,0,0,.4)');
        R(4, 2, 8, 2, '#5a1414'); R(5, 1, 6, 1, '#3a0a0a'); R(4, 2, 1, 1, '#7a2020'); R(10, 1, 1, 2, '#7a2020');
        R(3, 3, 10, 6, '#4a3a52'); R(3, 3, 10, 1, '#5a4a62'); R(5, 5, 1, 1, '#e8c0c8'); R(10, 6, 1, 1, '#e8c0c8');
        R(5, 9, 2, 5, '#a8805e'); R(9, 9, 2, 5, '#a8805e'); R(5, 9, 1, 5, '#b8906e'); R(4, 14, 3, 1, '#8a6444'); R(9, 14, 3, 1, '#8a6444');
        const gl = Math.sin(t * 2.5) > .2; if (gl && !e.halo) { R(4, 4, 1, 4, 'rgba(240,210,120,.6)'); R(11, 9, 1, 3, 'rgba(240,210,120,.6)'); }
        if (e.halo) { R(4, 0, 8, 3, '#8a8682'); R(5, 1, 1, 1, '#f0f0f0'); R(8, 0, 1, 1, '#f0f0f0'); R(10, 1, 1, 1, '#ece4d0'); R(6, 2, 2, 1, '#ece4d0'); R(3, 3, 1, 2, '#8a8682'); }
      },
      manafly(g, e, t, R) {   // 飞着的上半身：一对蝙蝠翅膀
        const f = Math.round(Math.sin(t * (e.slow ? 4 : 10)) * 3), P = W.ch.people.mana;
        for (const s of [0, 1]) {
          const X = (x, w) => s ? 16 - x - w : x;
          R(X(-14, 16), -2 + f, 16, 2, '#2a1a22'); R(X(-13, 14), 0 + f, 14, 7, '#160c12'); R(X(-14, 4), 7 + f, 4, 4, '#160c12'); R(X(-7, 4), 6 + f, 4, 3, '#160c12');
          R(X(-12, 1), -1 + f, 1, 9, '#4a3038'); R(X(-7, 1), -1 + f, 1, 7, '#4a3038'); R(X(-2, 1), 0 + f, 1, 6, '#4a3038');
        }
        g.drawImage(personSprite(P, e.dir, 0), e.sx, e.sy - 8);
      },
      kpak(g, e, t, R) {   // 从头顶掠过的翅膀影子
        const f = Math.round(Math.sin(t * 12) * 2);
        R(-24, 4 + f, 64, 6, 'rgba(0,0,0,.5)'); R(-18, 1 + f, 52, 3, 'rgba(0,0,0,.4)'); R(-28, 9 + f, 10, 5, 'rgba(0,0,0,.45)'); R(34, 9 + f, 10, 5, 'rgba(0,0,0,.45)');
        R(2, 0, 12, 16, 'rgba(0,0,0,.55)'); R(4, 16, 8, 6, 'rgba(0,0,0,.35)');
      },
      aso(g, e, t, R) {   // 瘦黄狗，夹着尾巴趴着
        const c = '#8a6a42', sh = Math.sin(t * 20) > 0 ? 1 : 0;
        R(3 + sh, 9, 9, 5, c); R(10 + sh, 7, 5, 5, c); R(10 + sh, 6, 2, 2, '#5a4428'); R(13 + sh, 9, 1, 1, '#111'); R(14 + sh, 10, 1, 1, '#222'); R(4, 13, 2, 2, c); R(9, 13, 2, 2, c); R(2, 12, 3, 1, '#6a5030');
      },
      atip(g, e, t, R) {   // 椰叶（nipa）屋顶：一层层压着的叶片，屋脊一道深色；ch=1 小教堂（铁皮顶 + 小钟楼）
        const W2 = e.w * 16, H = e.h * 16;
        if (e.ch) {
          R(-2, -2, W2 + 4, H + 5, '#5a5e62'); for (let x = 0; x < W2; x += 4) R(x, -2, 1, H + 5, '#46494c'); R(-2, H + 2, W2 + 4, 1, '#2a2c2e');
          R(W2 / 2 - 5, -16, 10, 15, '#d8d0c0'); R(W2 / 2 - 6, -18, 12, 3, '#6a4a2a'); R(W2 / 2 - 2, -12, 4, 5, '#1a1410'); R(W2 / 2 - 1, -10, 2, 2, '#c9a35a'); R(W2 / 2 - 1, -24, 2, 7, '#6a4a2a'); R(W2 / 2 - 3, -22, 6, 2, '#6a4a2a');
          return;
        }
        R(-3, -3, W2 + 6, H + 6, '#5a4628');
        for (let y = -3; y < H + 3; y += 3) { R(-3, y, W2 + 6, 1, '#6e5832'); for (let x = -3 + ((y / 3) & 1) * 2; x < W2 + 3; x += 4) R(x, y + 1, 1, 2, '#4a3a20'); }
        R(-3, H / 2 - 2, W2 + 6, 3, '#3a2c18'); R(-3, H / 2 - 2, W2 + 6, 1, '#7a6438');
        for (let x = -3; x < W2 + 3; x += 3) R(x, H + 2, 1, 2 + ((hash(x, e.py, 2) * 3) | 0), '#5a4628');
      },
      coop(g, e, t, R) { R(0, 2, 16, 12, '#6a5a32'); for (let x = 1; x < 16; x += 3) R(x, 3, 1, 10, '#3a3018'); R(0, 0, 16, 3, '#7a6a3a'); R(4, 9, 3, 3, '#e8e0d0'); R(10, 8, 3, 3, '#c86a3a'); R(2, 14, 12, 1, '#2a2010'); },
      feather(g, e, t, R) { for (let i = 0; i < 6; i++) { const x = (hash(e.px, i, 4) * 13) | 0, y = 3 + ((hash(i, e.py, 4) * 10) | 0); R(x, y, 3, 1, i % 2 ? '#e8e0d0' : '#c86a3a'); } },
      kalabaw(g, e, t, R) {   // 卧在田埂上的水牛
        R(2, 6, 20, 8, '#3a3a40'); R(2, 6, 20, 2, '#4a4a52'); R(20, 4, 8, 7, '#3a3a40'); R(19, 2, 4, 2, '#d8d0c0'); R(26, 2, 4, 2, '#d8d0c0'); R(18, 1, 2, 2, '#d8d0c0'); R(29, 1, 2, 2, '#d8d0c0');
        R(25, 6, 1, 1, '#111'); R(4, 13, 4, 2, '#2a2a30'); R(15, 13, 4, 2, '#2a2a30'); R(0, 8, 2, 4, '#3a3a40');
        if (Math.sin(t * .8) > .7) R(27, 9, 2, 1, '#5a5a62');
      },
      duster(g, e, t, R) { R(7, -6, 2, 2, '#5a5a5a'); R(3, -4, 10, 14, '#6a8a5a'); R(3, -4, 10, 1, '#7a9a6a'); R(5, -1, 1, 1, '#e8c0c8'); R(9, 2, 1, 1, '#e8c0c8'); R(6, 5, 1, 1, '#e8c0c8'); }
    },
    maps: {
      /* ---------------- 外婆的高脚屋 ---------------- */
      bahay: {
        amb: 'night', dark: .66, plr: 3, wall: 'wood',
        legend: { s: 'slat' },
        rows: [
          '###################',
          '###################',
          '#ssssss#sssss#ssss#',
          '#ssssss#sssss#ssss#',
          '#sssssssssssssssss#',
          '#ssssss#sssss#ssss#',
          '#ssssss#sssss#ssss#',
          '#ssssss#sssss#ssss#',
          '###s###############'],
        ents: [
          { x: 3, y: 8, spr: 'invisible', touch: S => exitHouse(S) },
          /* 堂屋 */
          { id: 'win1', x: 2, y: 1, spr: 'window', on: S => S.narr(S.f.ph === 'eve' || S.f.ph === 'eve2' ? '窗户撑开着，外头是一片金黄的稻田。一头水牛卧在田埂上甩尾巴。\n窗框上挂着一小串蒜。' : '窗板放下来了，插销上缠着一圈蒜头。\n缝里透进来一线月光。') },
          { x: 4, y: 1, spr: 'poster', col: '#e0d0a8', on: S => S.narr('杂货铺送的挂历，印着一瓶汽水和一个笑得很甜的明星。\n五月那一页上，外婆用圆珠笔圈了一个日子，写着「预产期」。旁边是莉莎的字：「多东，快回来。」') },
          { x: 6, y: 1, spr: 'portrait', on: S => S.narr('姐夫多东的照片。他穿着借来的西装站在照相馆的布景前面，背后画着一架飞机。\n那是他第一次出国前照的。') },
          { id: 'santo', x: 5, y: 2, spr: 'santo', light: { r: 1.6, col: 'rgba(255,190,110,.18)', flick: true }, on: S => S.narr('小供桌上供着一尊圣婴像（Santo Niño），红袍子、金王冠，是外婆年轻时从宿务带回来的。\n蜡烛旁边插着一枝去年圣枝主日的棕榈叶（palaspas），已经干成了黄色。') },
          { id: 'table', x: 3, y: 5, spr: 'table', on: async S => { if (S.once('komiks')) await S.narr('桌上摊着一本漫画周刊，是莉莎看的。封面上画着一个长着翅膀的半截女人。'); await S.note('komiks'); } },
          { id: 'mat', x: 1, y: 6, spr: 'banig', w: 2, solid: false, on: S => S.f.ph === 'visit3' ? nightFall(S) : S.narr(S.f.ph === 'eve' || S.f.ph === 'eve2' || S.f.ph === 'visit2' ? '卷起来的草席，晚上铺开就是你的床。席子边上用红色的草编着花。' : '你的草席。还留着你躺过的印子。') },
          /* 莉莎的房间 */
          { id: 'win2', x: 9, y: 1, spr: 'window', on: S => S.narr('莉莎房里的窗户钉了一块塑料布，是多东走之前钉的。风一吹，塑料布呼啦呼啦地鼓起来。') },
          { id: 'bed', x: 10, y: 2, w: 2, h: 2, spr: 'kulambo', on: S => lizaTalk(S) },
          { id: 'deck', x: 12, y: 2, spr: 'tapedeck', on: async S => { if (S.once('tape')) await S.narr('床头放着一台录音机，旁边摞着几盘磁带，每盘都贴着胶布，写着「给莉莎」。'); await S.note('tape'); } },
          { x: 8, y: 7, spr: 'basket', on: S => S.narr('一篮子小衣服，都是村里人送的，洗得软软的。最上面是一顶钩针织的小白帽。\n帽檐上的花，看针脚像是赛拉大婶的手艺。') },
          { x: 12, y: 7, spr: 'dresser', on: S => S.narr('一个旧五斗柜。最上面一格放着接生用的东西：干净的白布、一把剪刀、一卷线，都用开水烫过了。') },
          /* 厨房 */
          { id: 'hatch', x: 15, y: 1, spr: 'hatch', on: S => hatchOn(S) },
          { id: 'kalan', x: 16, y: 2, spr: 'kalan', s: { fire: 1 }, light: { r: 1.8, col: 'rgba(255,150,60,.2)', flick: true }, on: S => kalanOn(S) },
          { id: 'bawang', x: 17, y: 1, spr: 'bawang', on: S => bawangOn(S) },
          { id: 'jars', x: 14, y: 2, spr: 'jars', on: S => S.narr(S.f.salted ? '架子上的罐子：盐、糖、米、醋，还有一罐晒干的小鱼。\n盐罐子刚灌满，白得发亮。' : '架子上的罐子：糖、米、醋、一罐晒干的小鱼……\n盐罐子见了底。') },
          { id: 'lusong', x: 14, y: 7, spr: 'lusong', on: S => lusongOn(S) },
          { x: 15, y: 7, spr: 'crate', on: S => S.narr('劈好的木柴码得整整齐齐，还有一捆晒干的椰子壳，烧起来火旺。') },
          { x: 17, y: 7, spr: 'banga', on: S => S.narr('一口大陶缸，盛着从井里挑来的水。水面浮着一只椰壳瓢。') },
          { id: 'lola', x: 16, y: 5, spr: '@lola', dir: 1, on: S => lolaTalk(S) },
          { id: 'sela', x: 3, y: 7, spr: '@sela', hidden: true, dir: 3, on: S => S.narr('赛拉大婶。') },
          { id: 'rosaH', x: 12, y: 3, spr: '@rosa', hidden: true, dir: 1, on: S => rosaHouse(S) },
          /* 屋顶的缝（她撕开的地方） */
          { id: 'g1', x: 2, y: 3, spr: 'gap', hidden: true, solid: false, z: 1, on: (S, e) => gapOn(S, e) },
          { id: 'g2', x: 5, y: 6, spr: 'gap', hidden: true, solid: false, z: 1, on: (S, e) => gapOn(S, e) },
          { id: 'g3', x: 9, y: 6, spr: 'gap', hidden: true, solid: false, z: 1, on: (S, e) => gapOn(S, e) },
          { id: 'g4', x: 12, y: 5, spr: 'gap', hidden: true, solid: false, z: 1, on: (S, e) => gapOn(S, e) },
          { id: 'g5', x: 15, y: 6, spr: 'gap', hidden: true, solid: false, z: 1, on: (S, e) => gapOn(S, e) },
          { id: 'g6', x: 17, y: 4, spr: 'gap', hidden: true, solid: false, z: 1, on: (S, e) => gapOn(S, e) },
          { id: 'g0', x: 10, y: 4, spr: 'gap', hidden: true, solid: false, z: 1, on: (S, e) => gapOn(S, e) }
        ],
        async enter(S, first) {
          if (first) return opening(S);
          if (S.f.ph === 'eve2') return visit(S);
        }
      },
      /* ---------------- 村子 ---------------- */
      baryo: {
        amb: 'night', dark: .42, plr: 3.4, wall: 'wood', floor: 'dirt',
        legend: { v: 'eave', p: 'paddy', i: 'dike', K: 'kawayan' },
        tileOpts: { grassC: '#2c3a22', treeC: '#16241a' },
        rows: [
          'TTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTT',
          'T""""""""""""""""""""""""""""""""T',
          'T"######"""#######"""""######""""T',
          'T"######"""#######"""""######""""T',
          'T"######"""#######"""""######""""T',
          'T"vvvvvv"""vvvvvvv"""""vvvvvv""""T',
          'TddddddddddddddddddddddddddddddddT',
          'T""""""""d"""""d"""""d"""""""""""T',
          'T""""""""d"""""d"""""d"""""""""""T',
          'T""""""""d"""""d"""""d"""""""""""T',
          'T"######"d"""""d"""""d""######KKKT',
          'T"######"d"""""""""""d""######KKKT',
          'T"######"d"""""""""""d""######KKKT',
          'T"vvvvvv"d"""""""""""d""vvvvvvKKKT',
          'TdddddddddddddddddddddddddddddKKKT',
          'TpppppppppipppppppppppippppppppppT',
          'TpppppppppipppppppppppippppppppppT',
          'TiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiT',
          'TpppppppppipppppppppppippppppppppT',
          'TTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTT'],
        ents: [
          ...[[2, 2, 6], [11, 2, 7], [23, 2, 6], [2, 10, 6], [24, 10, 6]].map(([x, y, w]) => ({ x, y, w, h: 2, spr: 'atip', solid: false, s: { ch: x === 23 ? 1 : 0 } })),
          /* 外婆家 */
          { id: 'hdoor', x: 4, y: 4, spr: 'door', col: '#6a4a2a', on: async S => { S.sfx('open'); await S.go('bahay', 3, 7, 3); } },
          { x: 2, y: 4, spr: 'window', lit: true, light: { r: 1.6, col: 'rgba(255,170,80,.14)' }, on: S => S.narr('外婆家的窗户。窗框上挂着一串蒜。') },
          { x: 6, y: 4, spr: 'window', on: S => S.narr('莉莎房间的窗户，钉着一块塑料布。') },
          /* 杂货铺 */
          { id: 'stall', x: 12, y: 5, w: 2, spr: 'stall2', col: '#3a6a8a', light: { r: 2, col: 'rgba(255,200,120,.14)' }, on: S => S.narr(S.f.ph === 'hunt' ? '杂货铺的木板窗关得死死的。板缝里飘出一股鱼干和煤油的味道。' : '帕丝大婶的杂货铺（sari-sari）：成串的小包洗发水、一罐罐糖果、散装的香烟，一根一根卖。\n柜台上的收音机在放一首他加禄语的情歌。') },
          { id: 'paz', x: 15, y: 5, spr: '@paz', dir: 0, on: S => pazTalk(S) },
          { x: 16, y: 4, spr: 'poster', col: '#c83a2a', on: S => S.narr('铁皮招牌，画着一瓶汽水，红底白字。被雨淋得锈了一半。') },
          { x: 13, y: 4, spr: 'window', lit: true, light: { r: 1.6, col: 'rgba(255,190,110,.12)' }, on: S => S.narr(S.f.ph === 'hunt' ? '窗户黑着。里面传来呼噜声，一高一低——帕丝大婶和她丈夫，睡得正香。\n收音机没关，嘶嘶地响着雪花声。' : '杂货铺的窗户里亮着一盏煤油灯。') },
          /* 小教堂 */
          { id: 'cdoor', x: 25, y: 4, spr: 'door', col: '#e8e0d0', on: S => S.narr(S.f.ph === 'hunt' ? '小教堂的门锁着。门口的花在夜里白得发亮。\n村长说过，有事就敲钟——可是钟绳在里面。' : '小教堂的门开着，里面一排排木长椅，圣母像前堆满了五月的鲜花：茉莉（sampaguita）、栀子、九重葛。\n几个孩子正踮着脚往花瓶里插花。') },
          { x: 26, y: 3, spr: 'cross', on: S => S.narr('教堂门楣上的木十字架，漆是新刷的。') },
          { id: 'aviso', x: 27, y: 4, spr: 'poster', col: '#e8e0c8', on: async S => { if (S.once('aviso')) await S.narr('教堂门口的布告栏。'); await S.note('aviso'); } },
          { x: 24, y: 5, spr: 'marigold', decal: true, on: S => S.narr('一小堆五月花节的鲜花，茉莉的香味浓得发甜。') },
          { x: 28, y: 5, spr: 'marigold', decal: true },
          /* 罗莎家 */
          { id: 'rdoor', x: 4, y: 12, spr: 'door', col: '#4a3a2a', on: S => rosaDoor(S) },
          { id: 'rwin', x: 6, y: 12, spr: 'window', lit: true, light: { r: 1.8, col: 'rgba(255,190,110,.16)' }, on: S => S.narr(S.f.ph === 'hunt' ? '罗莎家的窗户亮着。窗板后面有人在小声念《玫瑰经》：\n「……圣母玛利亚，天主之母，为我们罪人祈求天主……」' : '罗莎家的窗户。窗台上摆着一个男人的照片，照片前点着一根小蜡烛。') },
          { id: 'well', x: 15, y: 11, spr: 'well', on: S => S.narr('村里的老井，井绳磨得发亮。井台边长着一丛薄荷。') },
          { id: 'rosa', x: 16, y: 12, spr: '@rosa', dir: 1, on: S => rosaTalk(S) },
          /* 赛拉家 */
          { id: 'sdoor', x: 26, y: 12, spr: 'door', col: '#5a4a3a', on: S => selaDoor(S) },
          { x: 28, y: 12, spr: 'window', on: S => S.narr(S.f.ph === 'hunt' ? '赛拉家的窗户黑着。窗板没关，屋里黑得像一口井。' : '赛拉家的窗户。窗台上晒着一排小鱼干。') },
          { id: 'selaV', x: 27, y: 13, spr: '@sela', dir: 0, on: S => selaTalk(S) },
          { id: 'coop', x: 23, y: 13, spr: 'coop', on: S => S.narr(S.f.ph === 'hunt' ? '鸡笼里的鸡全挤在最里面的角落，一声不吭。' : '赛拉家的鸡笼，几只母鸡咕咕地叫。') },
          { id: 'dog', x: 28, y: 13, spr: 'aso', hidden: true, on: S => S.narr('一条瘦黄狗趴在赛拉家门口，冲着屋里呜呜地叫，就是不敢进去。\n它的尾巴夹得紧紧的。') },
          /* 田里 */
          { id: 'kalabaw', x: 15, y: 17, w: 2, spr: 'kalabaw', on: S => S.narr(S.f.ph === 'hunt' ? '水牛还卧在田埂上，耳朵竖着，鼻孔一张一合，盯着天上。' : '一头水牛（kalabaw）卧在田埂上嚼草，看见你，慢慢地眨了一下眼睛。') },
          { x: 1, y: 7, spr: 'sign', col: '#4a5a3a', on: S => S.narr('木牌：BARANGAY ——（村名被雨水冲掉了一半）\n底下有人用油漆加了一行小字：「欢迎来到卡皮斯，阿斯旺的故乡」，又被人用泥巴糊掉了。') },
          /* 芭蕉（躲天上的影子） */
          ...[[10, 1], [19, 1], [30, 2], [7, 8], [12, 8], [18, 8], [24, 8], [29, 7], [11, 11], [19, 11], [12, 13], [18, 13], [31, 1]].map(([x, y], i) => ({ id: 'sg' + i, x, y, spr: 'saging', solid: false, light: { r: 1, col: 'rgba(140,210,120,.07)', dy: 6 }, on: S => S.narr(S.f.ph === 'hunt' ? '芭蕉叶又宽又大，垂下来像一把伞。站在底下，天上什么也看不见你。' : '一丛芭蕉，挂着一串青香蕉，用旧米袋套着，防蝙蝠偷吃。') })),
          /* 夜里的油迹 */
          ...[[6, 6], [9, 6], [12, 6], [15, 6], [18, 6], [21, 7], [21, 9], [21, 11], [21, 13], [23, 14], [24, 14], [26, 14]].map(([x, y], i) => ({ id: 'oil' + i, x, y, spr: 'lana', decal: true, hidden: true, light: { r: .7, col: 'rgba(230,190,90,.1)' }, on: S => S.narr(i === 0 ? '地上一滴油，亮晶晶的。凑近一闻，是椰子油，里面混着一股说不出的腥气。\n是从外婆家的屋檐上滴下来的。一滴，一滴，往东边去了。' : '又一滴椰子油，在月光底下亮晶晶的。') })),
          { id: 'kpak', x: 1, y: 1, spr: 'kpak', hidden: true, solid: false, z: 2 },
          { id: 'manaB', x: 22, y: 0, spr: 'manafly', hidden: true, solid: false, z: 3, dir: 1 }
        ],
        async enter(S, first) {
          if (S.f.ph === 'prep' && S.has('halo')) return huntStart(S);
          if (first && (S.f.ph === 'eve' || S.f.ph === 'eve2')) {
            await S.narr('太阳落到稻田那头去了，天边红得像烧着的炭。\n村路上飘着烧椰子壳的烟味，谁家在炸香蕉，谁家的收音机在放情歌。');
            angelus(S);
            await S.narr('「当——当——当——」\n小教堂的钟响了。是六点的三钟经（Angelus）。路上的人都停下来，低头画了个十字。');
            await S.think('帕丝大婶的杂货铺在村路中间，挂蓝棚子的那家。');
          }
        }
      },
      /* ---------------- 赛拉家 ---------------- */
      sela: {
        amb: 'room', dark: .88, plr: 2.6, wall: 'wood',
        legend: { s: 'slat' },
        rows: [
          '############',
          '############',
          '#ssssssssss#',
          '#ssssssssss#',
          '#ssssssssss#',
          '#ssssssssss#',
          '#####s######'],
        ents: [
          { x: 5, y: 6, spr: 'invisible', touch: async S => { await S.go('baryo', 26, 13, 0); } },
          { id: 'smirror', x: 2, y: 1, spr: 'mirror', covered: true, on: S => selaMirror(S) },
          { x: 4, y: 1, spr: 'portrait', on: S => S.narr('一张结婚照。年轻的赛拉穿着白纱，旁边的男人头发抹得锃亮。\n村里人说，她丈夫在马尼拉开吉普尼，好几年没回来了。') },
          { x: 6, y: 1, spr: 'duster', on: S => S.narr('钉子上挂着一件绿底小碎花的家常裙——就是她傍晚穿的那件。\n裙子挂得整整齐齐，像有人刚刚从里面钻出去。') },
          { id: 'bdoor', x: 9, y: 1, spr: 'door', col: '#3a2a1a', on: S => selaBack(S) },
          { id: 'mat2', x: 2, y: 4, w: 2, spr: 'banig', solid: false, s: { oil: 1 }, on: S => S.narr('一张草席，上面印着一个油亮亮的印子——\n印子只有半个人那么长。从头到腰，到腰就断了。') },
          { id: 'oiljar', x: 8, y: 2, spr: 'banga', s: { oil: 1 }, on: S => S.narr('一口小陶罐，满满一罐椰子油，油面上漂着几片说不出名字的树叶。\n味道和外婆家屋檐下滴的一模一样。') },
          { x: 6, y: 2, spr: 'chair', on: S => S.narr('一把藤椅。椅背上搭着一块没织完的钩针活——又是一顶小白帽。') },
          ...[[5, 5], [6, 4], [7, 3], [8, 3], [9, 2]].map(([x, y]) => ({ x, y, spr: 'lana', decal: true, light: { r: .6, col: 'rgba(230,190,90,.1)' } }))
        ],
        async enter(S, first) {
          if (first) {
            await S.narr('屋里一股浓浓的椰子油味，甜得发腻，底下压着一股腥气。\n没有人。');
            S.goal('找到赛拉藏下半身的地方（油迹往屋子后面去了）');
          }
        }
      },
      /* ---------------- 竹林 ---------------- */
      kawayan: {
        amb: 'night', dark: .9, plr: 2.5, floor: 'dirt',
        legend: { K: 'kawayan', l: 'litter' },
        rows: [
          'KKKKKKKKKKKKKKKKKKKKKKKK',
          'KKKKKKKKKKKKKKKKKKKKKKKK',
          'KKllllKKKKKKKKKKllllllKK',
          'KKllllKKKKKKKKKKllllllKK',
          'KKKlKKKKKKKKKKKKKllKKKKK',
          'KKKlllllllKKKKKKKllKKKKK',
          'KKKKKKKKKlKKKKKKKllKKKKK',
          'KKlllKKKKllllllllllKKKKK',
          'KKlKlKKKKlKKKKlKKKKKKKKK',
          'KKlKllllllKKKKllllKKKKKK',
          'KKlKKKKKKKKKKKKKKlKKKKKK',
          'KKllllKKKlllllllllKKKKKK',
          'KKKKKlKKKlKKKKKKKKKKKKKK',
          'KKKKKllllllKKKKKKKKKKKKK',
          'KKKKKlKKKKKKKKKKKKKKKKKK',
          'KKKKKlKKKKKKKKKKKKKKKKKK'],
        ents: [
          { x: 5, y: 15, spr: 'invisible', touch: async S => { if (S.f.ph === 'grove') { await S.narr('不能回去。天亮之前，必须找到她的下半身。'); await S.walk('pl', 'u', 5); } } },
          { id: 'tiil', x: 18, y: 3, spr: 'tiil', on: S => tiilOn(S) },
          { id: 'manaG', x: 18, y: 1, spr: 'manafly', hidden: true, solid: false, z: 2, dir: 0, light: { r: 2, col: 'rgba(255,90,70,.12)' } },
          { x: 3, y: 2, spr: 'feather', decal: true, on: S => S.narr('一地鸡毛，白的、红的，被露水打湿了贴在地上。\n这里什么也没有。油迹不往这边来。') },
          { x: 4, y: 7, spr: 'feather', decal: true, on: S => S.narr('死路。几根鸡毛挂在竹枝上，风一吹就打转。') },
          { x: 2, y: 11, spr: 'invisible', solid: false, on: S => S.narr('竹丛挤得密不透风。这边走不通。') },
          { x: 2, y: 9, spr: 'invisible', solid: false, on: S => S.narr('一根倒下的竹子横在路上，竹节里积着雨水。') },
          ...[[5, 13], [7, 13], [9, 13], [10, 11], [12, 11], [14, 11], [16, 11], [17, 9], [15, 9], [14, 8], [16, 7], [18, 7], [18, 5]].map(([x, y]) => ({ x, y, spr: 'lana', decal: true, light: { r: .7, col: 'rgba(230,190,90,.12)' } }))
        ],
        async enter(S, first) { if (S.f.ph === 'hunt') return groveStart(S); }
      }
    }
  });

  /* ================= 开场：傍晚 ================= */
  async function opening(S) {
    S.f.ph = 'eve';
    await S.narr('傍晚五点多，屋里一股烧椰子壳的烟味。厨房的泥灶上咕嘟咕嘟地炖着一锅酸汤鱼（sinigang）。\n竹片地板踩上去吱呀吱呀地响，缝里能看见屋底下的鸡。');
    await S.say('外婆（厨房）', '拉蒙——过来！');
    S.goal('去厨房找外婆');
  }
  async function lolaTalk(S) {
    S.face('lola', 'pl');
    const ph = S.f.ph;
    if (ph === 'eve') {
      if (S.once('lola1')) {
        await S.say('外婆', ['在伊洛伊洛念护士念得怎么样？瘦了。城里的饭不养人。', '盐罐子见底了。去帕丝的杂货铺买一包粗盐回来，记账。顺便捎两根蜡烛。', '天黑以前回来。']);
        const r = await S.ask('外婆一边说，一边往窗框上挂了一串蒜。', ['外婆，这蒜是做什么的？', '（不问了，去买盐）'], '拉蒙');
        if (r === 0) await S.say('外婆', ['挡东西的。你姐快生了，这几个月屋里屋外，蒜和盐都不能断。', '……城里人笑我们迷信。笑就笑吧。']);
        S.goal('去村里帕丝大婶的杂货铺买盐（出门：堂屋下面的楼梯）');
        return;
      }
      return S.say('外婆', cyc(S, '_l1', ['帕丝的铺子在村路中间，挂蓝棚子的那家。', '天黑以前回来。', '路上遇见赛拉，替我谢谢她送的小帽子。']));
    }
    if (ph === 'eve2') return S.say('外婆', '盐呢？拿来。');
    if (ph === 'visit2') return lolaExplain(S);
    if (ph === 'visit3') return S.say('外婆', '去睡吧。我守着。');
    if (ph === 'prep') {
      if (S.has('halo')) return S.say('外婆', ['……去……跟着……椰子油的味道……', '天亮……以前……'], { style: 'whisper' });
      const mx = S.f.mix || 0;
      return S.say('外婆', mx >= 4 ? ['……盐……蒜……灶灰……', '……捣在一起……'] : mx === 3 ? ['……盐罐……墙上的蒜……灶膛……'] : mx === 2 ? ['……一句……一样东西……', '……海……瓣……火……'] : ['……本子……最后一页……', '……石臼……'], { style: 'whisper' });
    }
    if (ph === 'siege' || ph === 'dawnwait') return S.say('外婆', S.f.rosaHelp ? '……有罗莎在……好……好……' : ['……热水……', '莉莎，吸气……慢慢地……'], { style: 'whisper' });
    return S.say('外婆', '嘘——');
  }
  async function lizaTalk(S) {
    const ph = S.f.ph;
    if (ph === 'eve' || ph === 'eve2') {
      if (S.once('liza1')) {
        await S.say('莉莎', ['拉蒙！护士先生回来啦。……别笑，以后我生孩子就靠你了。', '多东上个月寄了磁带回来，你听了没有？就在床头。他在磁带里唱歌，跑调跑到沙特去了。']);
        await S.say('莉莎', ['外婆这几天紧张得很，窗户上挂蒜，门槛上撒盐。', '赛拉大婶也天天来，送吃的，送小衣服，摸摸我的肚子说是个女孩。……她自己没有孩子。']);
        return;
      }
      return S.say('莉莎', cyc(S, '_z1', ['孩子在踢我。你摸摸——', '晚上屋顶漏风，呼呼的，像有人在上面喘气。', '快去吧，外婆等着盐呢。']));
    }
    if (ph === 'guard') return S.say('莉莎', '拉蒙……上面……上面有东西在爬……', { style: 'whisper' });
    if (ph === 'prep') return S.say('莉莎', S.has('halo') ? '我没事……肚子一阵一阵地疼，还早。快去！' : ['外婆烧得好厉害……她一直在说「本子」「最后一页」……', '拉蒙，你看看外婆的本子。'], { style: 'whisper' });
    if (ph === 'siege' || ph === 'dawnwait') return siegeLiza(S);
    return S.narr('莉莎睡着了。');
  }
  async function exitHouse(S) {
    const ph = S.f.ph;
    if (ph === 'eve') { if (!S.f._o_lola1) { await S.narr('外婆在厨房叫你。'); return S.walk('pl', 'u', 5); } return S.go('baryo', 4, 5, 0); }
    if (ph === 'eve2') return S.go('baryo', 4, 5, 0);
    if (ph === 'prep') {
      if (!S.has('halo')) { await S.narr('外婆烧得说胡话，一直念着「本子」「最后一页」。\n空着手出去，找到了也没用。'); return S.walk('pl', 'u', 5); }
      return S.go('baryo', 4, 5, 0);
    }
    if (ph === 'siege' || ph === 'dawnwait') { await S.narr('天亮之前，哪儿也不能去。'); return S.walk('pl', 'u', 5); }
    await S.narr(ph === 'visit2' || ph === 'visit3' ? '外婆在门槛上撒了一道盐。天黑透了，她不让你出门。' : '外面黑得什么都看不见。'); return S.walk('pl', 'u', 5);
  }

  /* ================= 傍晚的村子 ================= */
  async function pazTalk(S) {
    S.face('paz', 'pl');
    if (S.f.ph === 'eve') {
      await S.say('帕丝大婶', ['哎哟，拉蒙！伊洛伊洛的大学生！你外婆天天念叨你。', '盐？有。外婆要的，记账。蜡烛也拿两根。']);
      S.give('asin');
      await S.narr('帕丝大婶从麻袋里舀了一大勺粗盐，用旧报纸包好，又多抓了一小把塞进去。');
      await S.say('帕丝大婶', ['多给你点。你姐快生了，盐多备着。', '……我跟你说，晚上看好你姐。最近邻村不太平。']);
      await S.say('帕丝大婶', ['你看见井边那个穿黑衣服的没有？罗莎。男人去年出海没回来，她天天晚上点着灯不睡觉。', '村里人都说……啧，我可什么也没说啊。'], { style: 'whisper' });
      const r = await S.ask('帕丝大婶朝井边努了努嘴。', ['……她晚上点灯，可能只是睡不着吧。', '（不接话）'], '拉蒙');
      if (r === 0) { S.f.rosaKind = true; await S.say('帕丝大婶', '哼，你们读书人就是心软。……也是，也是。村长也说不让乱讲。'); }
      else await S.say('帕丝大婶', '快回去吧，天要黑了。替我跟你外婆问好。');
      await S.say('帕丝大婶', ['对了——我奶奶那辈的人说，对付那东西，光撒盐不够，还得加点灶灰。', '这都是老话，听听就算了。']);
      S.f.ph = 'eve2';
      S.goal('把盐带回外婆家');
      return;
    }
    if (S.f.ph === 'eve2') return S.say('帕丝大婶', cyc(S, '_p1', ['快回去，天要黑了。', '教堂门口贴了村长的告示，你看了没有？', '赛拉又给你姐送吃的了吧？那女人心好，就是命苦，一直没有孩子。']));
    return S.narr('杂货铺门口没有人。');
  }
  async function rosaTalk(S) {
    S.face('rosa', 'pl');
    if (S.f.ph !== 'eve' && S.f.ph !== 'eve2') return;
    if (S.once('rosa1')) {
      await S.narr('一个穿黑衣服的年轻女人在井边打水，手腕上缠着一串木头念珠。她看见你，低下头往后退了一步。');
      await S.say('罗莎', '……你是伊黛外婆家的外孙吧。');
      const r = await S.ask('她的水桶装得满满的，晃一下就溅出来。', ['我帮你提回去吧。', '嗯。（点点头走开）'], '拉蒙');
      if (r === 0) {
        S.f.rosaKind = true;
        await S.narr('你帮她把水桶提到她家门口。她一路上没说话，到了门口才小声说了句「谢谢」。');
        await S.say('罗莎', ['……我娘以前是村里的接生婆（hilot）。你姐姐出生的时候，就是我娘接的。', '你外婆是个好人。那时候村里只有她肯跟我说话。', '要是……要是有什么事，晚上来敲我的门。我睡得晚。']);
      } else await S.say('罗莎', '……替我问你外婆好。');
      return;
    }
    return S.say('罗莎', S.f.rosaKind ? '有什么事，晚上来敲我的门。' : '……');
  }
  async function selaTalk(S) {
    S.face('selaV', 'pl');
    if (S.f.ph !== 'eve' && S.f.ph !== 'eve2') return;
    if (S.once('sela1')) {
      await S.narr('赛拉大婶在鸡笼前撒米，穿着一件绿底小碎花的家常裙。看见你，她笑得眼睛眯成两道缝。');
      await S.say('赛拉大婶', ['哎呀，拉蒙！长这么高了。', '你姐怎么样？肚子是不是又大了？是个女孩——我一摸就知道。', '我晚上煮了椰汁甜糯米（ginataan），待会儿给她送一碗过去。孕妇要多吃甜的。']);
      await S.narr('她说话的时候，凑得很近。你在她黑亮的眼珠里看见了自己——\n……好像是倒着的。');
      await S.think('……天快黑了，眼花了吧。');
      return;
    }
    return S.say('赛拉大婶', cyc(S, '_s1', ['快回去吧，待会儿我就过去。', '替我摸摸你姐的肚子。']));
  }

  /* ================= 赛拉来送甜汤 ================= */
  async function visit(S) {
    S.f.ph = 'visit';
    S.take('asin'); S.f.salted = true;
    S.place('lola', 15, 4, 1);
    await S.narr('外婆把盐倒进罐子里，抓了一小撮，含在嘴里抿了抿。');
    await S.say('外婆', '海盐。好。');
    await S.fade(1, 600);
    S.dark(.74);
    S.place('lola', 9, 3, 2); S.pos(9, 5, 3);
    await S.fade(0, 600);
    await S.narr('天黑透了。煤油灯（gasera）的火苗只有黄豆那么大。\n楼梯吱呀一声——');
    S.sfx('knock');
    await S.say('门外', 'Maayong gab-i！（晚上好！）莉莎，我给你送甜汤来啦！');
    const sl = S.ent('sela'); sl.hidden = false; S.place('sela', 3, 7, 3);
    await S.walk('sela', [[3, 4], [8, 4], [10, 4]], 3);
    S.face('sela', 3);
    await S.narr('赛拉大婶端着一碗椰汁甜糯米，热气腾腾。她把碗放下，伸手隔着蚊帐摸了摸莉莎的肚子，摸了很久。');
    await S.say('赛拉大婶', ['女孩。我说是女孩就是女孩。', '……真香啊。'], { style: 'whisper' });
    await S.say('外婆', '赛拉，吃了饭再走。尝尝我腌的虾酱（ginamos），咸得下饭。');
    await S.say('赛拉大婶', '不了不了，伊黛姨。我不吃咸的，医生说我血压……');
    S.face('sela', 'pl');
    await S.narr('她转过头冲你笑。煤油灯就在她脸旁边，你看得清清楚楚——\n她的眼珠里映着一个小小的你。\n头朝下，脚朝上。');
    heart(S);
    await S.say('赛拉大婶', '拉蒙，你也多吃点。……晚上睡觉，记得把屋顶的缝盖好。漏风。');
    await S.walk('sela', [[8, 4], [3, 4], [3, 7]], 3);
    S.hide('sela');
    await S.narr('楼梯又吱呀了一声。外婆一直站着没动，等到脚步声走远了，才抓起盐罐，在门槛上、楼梯口，厚厚地撒了一道白线。');
    S.f.ph = 'visit2';
    S.goal('问问外婆：赛拉大婶的眼睛，是怎么回事');
  }
  async function lolaExplain(S) {
    S.face('lola', 'pl');
    await S.say('外婆', ['……拉蒙，你也看见了，是不是。倒着的。', '我活了七十岁，就见过一次——我十二岁那年，我娘生我小弟的时候。']);
    await S.say('外婆', ['阿斯旺。会分身的那种，他加禄人叫 manananggal。', '白天是人。夜里抹了油，从腰那里断开，上半身长出蝙蝠翅膀飞走，下半身就站在原地等她。', '她找怀孕的女人。趴在屋顶上，从缝里把舌头伸下来——', '……天亮以前，她必须飞回去，和下半身合上。']);
    await S.say('外婆', ['我不能说是谁。说错了，会害死人的。村长说得对。', '我外婆的话，我都抄在这个本子上了。你拿着。']);
    await S.note('libro');
    await S.say('外婆', ['今晚你睡堂屋。我守着你姐。', '听见 tik-tik 的声音，就叫我。']);
    S.f.ph = 'visit3';
    S.goal('去堂屋的草席上躺下');
  }
  async function nightFall(S) {
    await S.narr('你把草席铺开，躺下。竹片地板硌着背，屋底下的鸡偶尔咕咕两声。\n椰叶屋顶上，风呼呼地吹。');
    await S.fade(1, 900);
    S.pos(2, 6, 3); S.place('lola', 9, 3, 2);
    S.dark(.8);
    await S.card('', '夜里十一点四十', '……\n\n你是被一阵声音吵醒的。\n\ntik……tik……\n\n很轻，很近。\n像是就在屋顶上。');
    tiktik(S, .04);
    await S.fade(0, 700);
    await S.wait(900);
    tiktik(S, .025);
    await S.wait(900);
    scratch(S, .05);
    await S.narr('头顶上，椰叶屋顶沙沙地响了一下。又一下。\n像有什么很重的东西，正趴在上面，慢慢地爬。');
    await S.say('外婆（里屋）', '拉蒙！来！', { style: 'big' });
    S.face('lola', 'pl');
    S.give('ahos');
    S.ent('bawang').s.n = 1;
    await S.say('外婆', ['她来了。拿着蒜。', '她会撕开屋顶，从缝里把舌头伸下来。哪里沙沙响、往下掉草屑、漏进月光，就跑过去——把蒜塞进那道缝！', '我守着莉莎。快！']);
    S.f.ph = 'guard';
    S.goal('哪里沙沙响、漏月光，就跑去把蒜塞进缝里（联机：一人报位置，一人塞）');
    S.amb('none');
    guardReset(S);
    S.cp('guard');
    G.st = 'gap'; G.k = 1.6;
  }

  /* ================= 守住屋顶之后 ================= */
  async function guardWin(S) {
    G.st = 'off';
    await S.wait(900);
    scratch(S, .09); S.shake(700, 2);
    await S.narr('屋顶上一阵疯狂的乱抓。椰叶哗啦啦往下掉——就在莉莎的床尾上面！');
    const e = S.ent('g0'); e.hidden = false; e.s = { st: 'tongue', tg: .6 }; e.light = { r: 2.2, col: 'rgba(190,205,255,.18)' };
    S.focus(10, 3);
    await S.wait(500);
    await S.scare('face', { spr: '@mana', face: 'mana', sfx: 'scream', dur: 1.2 });
    await S.narr('一张脸从破洞里倒挂下来。头发垂着，眼睛红得像两粒炭火。\n是赛拉大婶的脸。');
    S.face('lola', 2);
    await S.narr('外婆扑在莉莎身上。那条舌头「啪」地抽在外婆的胳膊上——\n外婆闷哼一声，另一只手抓起一把盐，狠狠地朝那张脸撒了上去。');
    shriek(S, .08); S.sfx('scream');
    e.s = { seal: 2 }; e.light = null;
    await S.wait(600);
    flap(S, .12, 5, .35);
    await S.narr('一声尖叫，像猪被宰的那种叫。翅膀扑扑地拍了几下，越来越远，越来越远……\n只剩下 tik……tik……，越来越响。');
    S.focus(null); S.amb('night');
    await S.narr('外婆的胳膊上一道紫红的印子，肿得发亮。她靠着墙坐下去，浑身打颤，额头烫得吓人。');
    S.ent('lola').spr = '@lolaS';
    await S.say('外婆', ['……她……她还会回来……', '天亮以前……她要回去……合上……', '本子……最后一页……海里的……土里的……火里的……', '……跟着……椰子油的味道……'], { style: 'whisper' });
    await S.say('莉莎', '外婆！外婆你别吓我……拉蒙，怎么办？', { style: 'big' });
    await S.think('外婆说过：找到她的下半身，她就合不回去。天一亮……\n先照本子最后一页的口诀，把东西调出来。');
    S.f.ph = 'prep'; S.f.mix = 0;
    S.goal('照本子最后一页的口诀，在厨房石臼里调药（联机：一人念本子，一人调）');
    S.cp('prep');
  }

  /* ================= 谜题：口诀 → 石臼 ================= */
  const KEYS = ['盐', '糖', '米', '蒜', '姜', '洋葱', '灰', '醋'];
  const WHY = {
    糖: '糖是甘蔗熬出来的——「海水晒干剩下的」是咸的。',
    米: '米是田里长的，不是海水晒出来的。',
    姜: '姜是一整块根茎，掰不出「一瓣一瓣」。',
    洋葱: '洋葱是一层一层包着的，不是「一瓣一瓣抱成团」。',
    醋: '醋是椰子水酿出来的，跟火没关系。'
  };
  async function lusongOn(S) {
    if (S.f.ph !== 'prep') return S.narr(S.f.ph === 'eve' || S.f.ph === 'eve2' ? '木头石臼，平时舂米、捣蒜用的。杵子被手磨得发亮。' : '石臼里还留着一股蒜味。');
    if (S.has('halo')) return S.narr('东西已经调好了。椰壳碗里那一团，辣得眼睛发酸。');
    const r = await S.keypad('照口诀，选三样放进石臼一起捣：\n「海水晒干剩下的，一瓣一瓣抱成团的，火走了以后留下的。」', KEYS, 3, { sep: ',' });
    if (r == null) return;
    const got = r.split(',').filter(Boolean), set = new Set(got);
    if (set.size === 3 && set.has('盐') && set.has('蒜') && set.has('灰')) {
      S.sfx('thud'); await S.wait(200); S.sfx('thud');
      await S.narr('你从罐子里抓了两大把粗盐，从蒜辫上掰下一整头蒜，又用椰壳从灶膛里舀了一捧还温着的灰。\n杵子一下一下地捣，蒜汁溅到手上，火辣辣的。');
      S.give('halo');
      S.ent('bawang').s.n = 0;
      await S.narr('海水晒干剩下的——盐。一瓣一瓣抱成团的——蒜。火走了以后留下的——灰。\n三样捣成了灰扑扑的一团，盛在椰壳碗里。');
      S.goal('出门，跟着屋檐下滴落的椰子油迹走');
      return;
    }
    S.f.mix = (S.f.mix || 0) + 1; S.sfx('bad');
    const wrong = got.filter(k => WHY[k]);
    let msg = set.size < 3 ? '三样要各不相同。' : wrong.length ? WHY[wrong[0]] : '不对。';
    await S.think('……不对。' + msg);
    S.f.late = Math.min(3, (S.f.late || 0) + 1); scratch(S, .07); S.shake(300, 1);
    await S.think('（屋顶上又沙沙地响了一阵——她就在附近转。耽误得越久，她回去得越早。）');
    if (S.f.mix === 2) await S.think('（口诀三句，一句一样东西：海、瓣、火。）');
    else if (S.f.mix === 3) await S.think('（海水晒干——架子上刚灌满的那罐。一瓣一瓣——灶边墙上挂着的那串。火走了以后——灶膛里剩下的。）');
    else if (S.f.mix >= 4) await S.think('（盐、蒜、灶灰。）');
  }
  async function bawangOn(S) {
    if (S.f.ph === 'eve' || S.f.ph === 'eve2' || S.f.ph === 'visit') return S.narr('灶边墙上挂着一大串蒜，用香蕉树皮的细绳编成辫子。\n外婆说，这串蒜挂在这里，比门锁还管用。');
    return S.narr('墙上只剩一头蒜了，孤零零地挂着。');
  }
  async function kalanOn(S) {
    const ph = S.f.ph;
    if (ph === 'siege' || ph === 'dawnwait') return siegeKalan(S);
    if (ph === 'prep') return S.narr(S.has('halo') ? '灶膛里的火快熄了。' : '灶膛里的火快熄了，底下积着厚厚一层灰，还是温的。');
    return S.narr('泥土垒的灶（kalan），锅里炖着酸汤鱼，罗望子的酸味直冲鼻子。\n灶膛底下积着厚厚一层灰。');
  }

  /* ================= 夜里的村子：跟着油迹 ================= */
  async function huntStart(S) {
    S.f.ph = 'hunt';
    S.dark(.86);
    for (let i = 0; i < 12; i++) S.show('oil' + i);
    S.hide('paz'); S.hide('rosa'); S.hide('selaV'); S.show('dog');
    S.ent('stall').light = null;
    await S.narr('村子里一片漆黑，只有罗莎家的窗户还亮着一点光。\n地上，一滴一滴的油在月光里亮晶晶的，从外婆家的屋檐底下，一直往东边去。');
    tiktik(S, .07);
    await S.wait(500);
    const B = S.ent('manaB'); S.place('manaB', 22, 0, 1); B.dir = 1;
    S.focus(13, 2); flap(S, .1, 6, .3);
    await fly(S, 'manaB', 2, 1, 2.2);
    S.hide('manaB'); S.focus(null);
    await S.narr('月亮前面掠过一道影子——半截身子，长头发，一对撑开的蝙蝠翅膀。\n扑——扑——它绕着村子飞了一圈，又转回来了。');
    flap(S, .14, 3, .3);
    const k = S.ent('kpak'); k.hidden = false; k.px = 16 * TS; k.py = 6 * TS; k.dir = 1;
    for (let i = 0; i < 16; i++) { k.px -= TS * 1.3; await S.wait(55); }
    k.hidden = true;
    await S.narr('一大片翅膀的影子从村路上扫过去。你缩在屋檐底下，一动不敢动。\n……影子没有停。它没看见你。');
    await S.think('屋檐底下（墙根那一溜深色的檐影）和芭蕉叶下面，天上看不见。\n扑翅声一响，就躲进去，等影子过去。');
    S.goal('跟着发亮的油迹走；扑翅声一响，躲进檐下或芭蕉叶下');
    S.f.sky = 0; S.f.skyN = 0;
    S.cp('hunt');
    skyReset(S, 3.5);
  }
  async function rosaDoor(S) {
    if (S.f.ph !== 'hunt') return S.narr('罗莎家的门关着。');
    if (S.f.rosaHelp) return S.narr('门虚掩着。罗莎已经去你外婆家了。');
    S.sfx('knock');
    await S.narr('你敲了敲门。念经的声音停了。');
    if (!S.f.rosaKind) {
      await S.say('门后', ['……谁？', '伊黛家的？……你们家不是也说，我是阿斯旺吗？', '……走吧。我什么都不知道。'], { style: 'whisper' });
      return;
    }
    await S.narr('门开了一条缝。罗莎手里攥着念珠，脸色发白。');
    await S.say('拉蒙', '罗莎姐……外婆被那东西伤了，烧得说胡话。我姐快生了……');
    await S.say('罗莎', ['……我就知道今晚不太平。', '我跟着我娘接过十几个孩子。你去做你的事——你姐那里，我去。', '快走。天亮以前。']);
    S.f.rosaHelp = true;
    S.place('rosa', 3, 13, 0); S.ent('rosa').light = { r: 1.8, col: 'rgba(255,190,110,.18)', flick: true };
    await S.narr('罗莎点了一盏小油灯，把念珠缠在手腕上，从你身边走了过去。');
    S.focus(4, 9);
    await S.walk('rosa', [[3, 14], [9, 14], [9, 6], [4, 6], [4, 5]], 5);
    S.sfx('open'); S.hide('rosa'); S.focus(null);
    S.toast('罗莎进了你外婆家。');
    S.goal('跟着发亮的油迹走；扑翅声一响，躲进檐下或芭蕉叶下');
  }
  async function selaDoor(S) {
    if (S.f.ph !== 'hunt') return S.narr(S.f.ph === 'eve' || S.f.ph === 'eve2' ? '赛拉家的门开着，屋里飘出椰汁甜糯米的香味。' : '赛拉家的门。');
    if (S.once('sdoor')) await S.narr('油迹一直滴到赛拉家的门口。门虚掩着，门缝里黑洞洞的。\n门口的黄狗冲着屋里呜呜地叫，尾巴夹得紧紧的。');
    S.sfx('open');
    await S.go('sela', 5, 5, 3);
  }
  async function selaMirror(S) {
    if (S.once('mirror')) {
      await S.narr('墙上挂着一面镜子，用一块黑布蒙着。你掀开布的一角——');
      heart(S);
      await S.narr('镜子里的你，头朝下，脚朝上。\n……你眨了眨眼。再看，又是正的了。');
      return;
    }
    return S.narr('蒙着黑布的镜子。你不想再掀开它。');
  }
  async function selaBack(S) {
    await S.narr('后门开着，门槛上一滴油。门外是黑压压的竹林，竹叶沙沙地响。');
    S.sfx('open');
    await S.go('kawayan', 5, 14, 3);
  }

  /* ================= 危险三：竹林里的下半身（限时） ================= */
  const GROVE_T = 22;
  let groveTT = 0;
  async function groveStart(S, retry) {
    if (!retry) {
      S.f.ph = 'grove';
      await S.narr('竹林里比外面还黑。竹竿一根挨一根，风一吹，咯吱咯吱地互相磨。\n地上的油迹一滴一滴，往竹林深处去了。');
      tiktik(S, .07);
      await S.think('tik-tik 的声音很响——她还远。\n……可它在慢慢变小。');
      S.goal('趁她没回来，跟着油迹找到下半身，撒上盐蒜灰');
      S.cp('grove');
    } else {
      S.ent('tiil').s = {}; S.hide('manaG');
      if (FAILS.grove) await S.think('（别停下来看别的。跟着亮晶晶的油迹走，找到了就把盐蒜灰撒上去。）');
    }
    groveTT = 0;
    S.timer(GROVE_T - 2 * (S.f.late || 0) + (S.coop ? 6 : 0), 'tik-tik 声越来越小', groveLate, { during: true });
  }
  function groveTick(S, dt) {
    groveTT -= dt;
    const left = S.timerLeft; if (left == null) return;
    if (groveTT <= 0) { groveTT = Math.max(2.2, left / 5); tiktik(S, Math.max(.01, .07 * left / GROVE_T)); }
  }
  async function tiilOn(S) {
    if (S.f.ph !== 'grove') return S.narr('那双腿还站在那里。');
    if (S.once('tiil1')) {
      await S.narr('一丛竹子后面的空地上，直直地站着半个人。\n绿底小碎花的裙子，两条光着的腿，脚趾抠进泥里。\n腰上面……什么都没有。断口湿漉漉的，泛着椰子油的光。');
      heart(S);
    }
    const r = await S.ask('……', ['把盐蒜灰撒在断口上', '（先退后）'], '拉蒙');
    if (r !== 0) return;
    S.clearTimer();
    S.ent('tiil').s.halo = 1; S.sfx('splash');
    await S.narr('你抓起碗里那团东西，一把一把，糊在断口上。\n盐粒「滋滋」地响，冒起一缕白烟。那两条腿猛地一抖，脚趾在泥里抓出了几道沟。');
    hiss(S);
    await S.wait(500);
    flap(S, .15, 4, .25);
    S.place('manaG', 18, -1, 0); S.ent('manaG').s.slow = 0;
    S.focus(18, 2);
    await fly(S, 'manaG', 18, 2, .9);
    await S.narr('翅膀扑下来的风把竹叶都压弯了。\n她回来了——上半身悬在空中，长头发垂着，正往下半身上落。');
    S.tone('sawtooth', 300, 120, .6, .06, 0, 1600); hiss(S);
    await S.narr('「滋——」\n白烟腾起来。她合不上。');
    await S.scare('face', { spr: '@mana', face: 'mana', sfx: 'scream', dur: 1 });
    shriek(S, .08);
    await S.say('？？？', '拉——蒙——！', { style: 'big' });
    S.focus(null);
    await S.narr('你转身就跑。竹枝抽在脸上，你听见身后翅膀扑扑地追了几下，又停了——\n她舍不得离开那双腿。');
    S.hide('manaG');
    await S.go('bahay', 3, 7, 3);
    return siegeStart(S);
  }
  async function groveLate(S) {
    FAILS.grove++;
    flap(S, .16, 5, .28);
    S.place('manaG', 18, -1, 0); S.ent('manaG').s.slow = 1;
    S.focus(18, 2);
    await S.narr('tik-tik 的声音，没有了。\n头顶上，翅膀扑扑地落下来。');
    await fly(S, 'manaG', 18, 2, 1.2);
    S.tone('sine', 180, 90, .8, .06, 0, 800);
    await S.narr('那半截身子轻轻地落在那双腿上。腰和腰对上，「咔」的一声，像关上一扇门。\n翅膀收了回去。');
    S.hide('manaG');
    S.ent('tiil').spr = '@sela'; S.ent('tiil').dir = 0;
    await S.say('赛拉大婶', ['……拉蒙？', '这么晚了，你在我家竹林里做什么？'], { style: 'whisper' });
    await S.scare('face', { face: 'sela', spr: '@sela', sfx: 'sting', dur: 1.1 });
    S.focus(null);
    await S.end({ bad: true, id: 'joined', title: '她合上了', text: '第二天早上，赛拉大婶照常端着一碗粥来看莉莎。\n她的眼睛红红的，像一夜没睡。\n她隔着蚊帐摸了摸莉莎的肚子，笑着说：「快了。」\n\n外婆一直烧到第三天。\n你再也不敢看赛拉大婶的眼睛。\n\n——竹林里，在她回来之前把盐蒜灰撒上去。跟着油迹，别回头。' });
  }

  /* ================= 天亮之前 ================= */
  async function siegeStart(S, retry) {
    S.f.ph = 'siege'; S.f.water = 0; S.f.hand = 0; S.f.towel = 0; S.f.ev = 0; S.f.sstrike = 0; LZ.st = 'off';
    S.clearTimer(); S.plr(null);
    S.ent('lola').spr = '@lolaS'; S.place('lola', 9, 3, 2);
    S.ent('bed').s.labor = 1;
    S.ent('hatch').open = false;
    if (S.f.rosaHelp) { S.place('rosaH', 12, 3, 1); S.ent('kalan').s.kettle = 1; }
    else S.hide('rosaH');
    if (!retry) {
      await S.narr('你一头撞进门，摔在竹片地板上。');
      await S.say('莉莎（里屋）', '拉蒙——！孩子……孩子要出来了……！', { style: 'big' });
      if (S.f.rosaHelp) {
        S.face('rosaH', 'pl');
        await S.say('罗莎', ['羊水破了。别慌，头胎慢，天亮前后的事。', '热水我烧上了。你过来，握住你姐的手，陪她说话。', '……天窗千万别开。烟大也别开。']);
        S.goal('去握住莉莎的手，陪着她（千万别开天窗）');
      } else {
        await S.say('外婆', ['……热水……烧一壶热水来……', '天窗……千万别开……'], { style: 'whisper' });
        S.goal('在灶上烧一壶热水，送到莉莎房里（千万别开天窗）');
      }
      S.cp('siege');
    } else if (FAILS.siege) await S.think('（不管多闷、谁求你，天亮之前都别碰那扇天窗。烟大就拿湿毛巾捂一捂。）');
    scratch(S, .05);
  }
  async function siegeKalan(S) {
    if (S.f.rosaHelp) return S.narr('灶上的水壶咕嘟咕嘟地响，是罗莎烧上的。\n满屋子都是烟，熏得人睁不开眼。');
    if (S.has('takure') || S.f.water) return S.narr('灶膛里的火噼噼啪啪。厨房里的烟越积越厚。');
    S.ent('kalan').s.kettle = 1; S.sfx('switch');
    await S.narr('你往灶膛里塞了两块椰子壳，把铝壶坐上去。火「呼」地蹿起来。\n烟顺着屋顶往上冒，可天窗关着，烟出不去，在屋梁底下越积越厚。');
    await S.wait(1200);
    S.tone('sine', 1200, 1500, .8, .03, 0, 3000);
    await S.narr('壶嘴「呜——」地叫了起来。');
    S.give('takure');
    S.goal('把热水送到莉莎房里');
  }
  async function siegeLiza(S) {
    if (S.f.ph === 'dawnwait') {
      S.f.hand = 1;
      return S.say('莉莎', cyc(S, '_lz', ['拉蒙……别走……', '好闷……烟……我喘不过气……', '多东……多东要是在就好了……']), { style: 'whisper' });
    }
    if (!S.f.rosaHelp && S.has('takure')) {
      S.take('takure'); S.f.water = 1;
      await S.narr('你把热水壶放在床边。外婆撑着坐起来，把白布浸进热水里，手一直在抖。');
      await S.say('外婆', ['……好孩子……', '握着你姐的手。天亮……就快了……'], { style: 'whisper' });
      return dawnWait(S);
    }
    if (!S.f.rosaHelp) return S.say('莉莎', '拉蒙……热水……外婆要热水……', { style: 'whisper' });
    S.f.hand = 1;
    await S.narr('你隔着蚊帐握住莉莎的手。她的手又湿又烫，攥得你骨头都疼。');
    await S.say('莉莎', ['拉蒙……你说……孩子会不会……', '……没事。没事的。护士先生说没事就没事。'], { style: 'whisper' });
    return dawnWait(S);
  }
  async function dawnWait(S) {
    S.f.ph = 'dawnwait'; S.f.ev = 0; S.f.evT = 4;
    S.goal('守到天亮（不管多闷，别开天窗）');
    S.timer(36 + (S.coop ? 6 : 0), '离天亮', dawnCome, { during: true });
  }
  function loosen(S) {
    const m = curMap(), D = bfsDist(m, W.pl.x, W.pl.y);
    const c = ['g1', 'g2', 'g5', 'g6'].filter(id => { const e = S.ent(id); return !e.hidden && e.s.seal; });
    if (!c.length) return;
    c.sort((a, b) => { const da = D.get(Math.round(S.ent(a).px / TS) + ',' + Math.round(S.ent(a).py / TS)) ?? 0, db = D.get(Math.round(S.ent(b).px / TS) + ',' + Math.round(S.ent(b).py / TS)) ?? 0; return db - da; });
    const id = c[0], e = S.ent(id);
    e.s = { st: 'tongue', tg: 0 }; e.light = { r: 1.5, col: 'rgba(190,205,255,.14)' };
    LZ.st = 'on'; LZ.id = id; LZ.k = 0; LZ.sc = 0;
    tiktik(S, .012); scratch(S, .08); S.sfx('thud');
    S.toast(`（咔嚓——${SPOTS[id]}那道缝里的蒜被抠掉了！舌头又垂下来了——快去塞回去！）`);
  }
  async function siegeStrike(S) {
    const e = S.ent(LZ.id); LZ.st = 'off';
    S.f.sstrike = (S.f.sstrike || 0) + 1;
    if (S.f.sstrike >= 2) {
      FAILS.siege++;
      await S.scare('face', { spr: '@mana', face: 'mana', sfx: 'scream' });
      return S.die('舌头从缝里一直垂到地上，又顺着竹片地板，\n像一条蛇一样，往里屋游过去。\n你听见莉莎的叫声停了。', '天亮之前');
    }
    S.sfx('scream'); S.shake(500, 3);
    await S.narr(S.f.rosaHelp ? '罗莎冲出来，抓起一把盐朝那道缝扬上去。「嘶——」舌头缩了回去。' : '外婆撑着墙爬过来，抓起一把盐朝那道缝扬上去。「嘶——」舌头缩了回去。外婆一下子跪倒在地上。');
    e.s = { seal: 2 }; e.light = null;
    await S.think('（蒜被抠松了就马上跑过去塞回去。下一次，没人替你了。）');
  }
  const SIEGE_EV = [
    S => { scratch(S, .07); S.toast('（沙沙——堂屋顶上。蒜味顶着，她下不来。）'); },
    S => loosen(S),
    S => { S.sfx('thud'); S.shake(400, 2); S.toast('（咚！咚！——厨房的天窗在震。）'); },
    S => S.run(async S2 => { S2.ent('hatch').s.smoke = 1; S2.dark(.88); await S2.say('莉莎', '好闷……拉蒙……把天窗打开一点……就一点……', { style: 'whisper' }); }),
    S => { tiktik(S, .02); S.toast('（tik……tik……轻得几乎听不见。她就在屋顶上。）'); },
    S => { S.sfx('thud'); S.shake(500, 3); scratch(S, .08); S.toast('（天窗的竹框被抓得吱吱响。）'); },
    S => loosen(S),
    S => S.run(async S2 => { await S2.think('烟呛得人眼泪直流……开一条缝透透气，应该没事吧？'); }),
    S => { flap(S, .1, 3); S.toast('（翅膀扑扑地，绕着屋顶转圈。）'); }
  ];
  function siegeTick(S, dt) {
    if (S.busy) return;
    if (LZ.st === 'on') {
      const e = S.ent(LZ.id); LZ.k += dt / 5.5; e.s.tg = Math.min(1, LZ.k);
      LZ.sc -= dt; if (LZ.sc <= 0) { LZ.sc = .7; heart(S); }
      if (LZ.k >= 1) { LZ.st = 'hit'; S.run(siegeStrike); }
      return;
    }
    S.f.evT -= dt;
    if (S.f.evT <= 0) { S.f.evT = 5.2; const f = SIEGE_EV[S.f.ev % SIEGE_EV.length]; S.f.ev++; f(S); }
  }
  async function hatchOn(S) {
    const ph = S.f.ph;
    if (ph === 'siege' || ph === 'dawnwait') {
      const r = await S.ask('天窗用一根竹竿顶着。烟在屋梁底下翻滚，熏得人睁不开眼。\n外面，有什么东西在轻轻地刮那块窗板。', ['推开天窗，透一口气', '不开——拿湿毛巾捂一捂', '（走开）'], '拉蒙');
      if (r === 1) {
        S.f.towel = 1;
        return S.narr('你从水缸里浸湿一条毛巾，拧了拧，捂在莉莎和外婆脸前，又把另一条塞在天窗的缝底下。\n烟还是呛，可没那么要命了。\n窗板外面，那东西「嘶」地抽了一口气。');
      }
      if (r !== 0) return;
      return badWindow(S);
    }
    if (ph === 'guard') return S.narr('天窗关得紧紧的，竹竿顶得死死的。外婆说过，今晚这扇窗一寸都不能开。');
    return S.narr('灶台上方墙高处的小天窗，平时撑开放烟。窗板是椰叶编的，用一根竹竿支着。\n外婆说，有孕妇的人家，夜里天窗一定要关死。');
  }
  async function badWindow(S) {
    FAILS.siege++;
    S.clearTimer();
    S.ent('hatch').open = true; S.sfx('open');
    await S.narr('你抽掉竹竿，把窗板往上一推。\n夜风灌进来，烟呼地涌了出去。你深深吸了一口气——');
    await S.wait(400);
    shriek(S, .09);
    await S.scare('face', { spr: '@mana', face: 'mana', sfx: 'scream', dur: 1.2 });
    await S.end({ bad: true, id: 'window', title: '屋顶的窗', text: '窗口里，倒挂下来一张脸。\n腰下面空空荡荡，翅膀把整个窗洞都堵满了。\n\n后来的事，你记不清了。\n只记得莉莎的叫声，外婆的哭声，\n和天亮以后，竹林里那一声很长很长的尖叫。\n\n——天亮之前，那扇窗，一寸都不能开。' });
  }
  async function dawnCome(S) {
    S.f.ph = 'done';
    if (LZ.st !== 'off') { const e = S.ent(LZ.id); e.s = { seal: 1 }; e.light = null; LZ.st = 'off'; }
    rooster(S);
    await S.narr('「喔——喔喔——」\n远处，谁家的公鸡叫了。');
    S.dark(.5);
    await S.wait(600);
    rooster(S);
    for (const id of ['g0', ...Object.keys(SPOTS)]) { const g = S.ent(id); if (g && !g.hidden) { g.s.dawn = 1; g.light = { r: 1.8, col: 'rgba(255,220,150,.22)' }; } }
    await S.narr('塞着蒜、撒着盐的那几道缝里，透进来一线一线灰白的光。\n五点二十几分。天亮了。');
    S.dark(.3);
    shriek(S, .05);
    await S.narr('竹林那边传来一声尖叫，又尖又长，像一根铁丝被一点一点拉断。\n……然后什么声音都没有了。');
    await S.wait(800);
    babyCry(S); S.sfx('cry');
    await S.narr('里屋，一声响亮的哭声。');
    S.ent('bed').s.labor = 0;
    if (S.f.rosaHelp) {
      S.face('rosaH', 'pl');
      await S.say('罗莎', ['女孩。……七斤多。', '你听听这嗓门，像她爸在磁带里唱歌。']);
    } else {
      await S.say('外婆', ['……女孩……', '好……好……'], { style: 'whisper' });
    }
    await S.say('莉莎', '多东……你看见了吗……', { style: 'whisper' });
    await S.fade(1, 1200);
    if (S.f.rosaHelp) {
      return S.end({ id: 'ninang', title: '教母', text: '早上，村里人在赛拉家后面的竹林里，找到一圈烧焦似的黑印子，和一摊发黑的椰子油。\n赛拉大婶再也没有回来。有人说，她去马尼拉找丈夫了。\n\n外婆的烧第二天就退了。\n孩子满月受洗那天，莉莎请罗莎做了孩子的教母（ninang）。\n帕丝大婶在杂货铺门口跟每个人说：「我早就说罗莎是个好人。」\n\n那以后，村里再没人说罗莎是阿斯旺。\n\n多东寄回来的第七盘磁带里，只有一句话，录了三遍：\n「替我摸摸她。」' });
    }
    return S.end({ id: 'dawn', title: '鸡叫天亮', text: '早上，村里人在赛拉家后面的竹林里，找到一圈烧焦似的黑印子，和一摊发黑的椰子油。\n赛拉大婶再也没有回来。有人说，她去马尼拉找丈夫了。\n\n外婆的烧第二天就退了。孩子很壮，哭声大得半个村子都听得见。\n篮子里那顶钩针织的小白帽，外婆拿去灶里烧了。\n\n多东寄回来的第七盘磁带里，只有一句话，录了三遍：\n「替我摸摸她。」\n\n（井边那个穿黑衣服的女人，那晚一直亮着灯。）' });
  }
  async function rosaHouse(S) {
    S.face('rosaH', 'pl');
    return S.say('罗莎', cyc(S, '_rh', ['握着你姐的手。别的交给我。', '天窗千万别开。烟大，忍一忍。', '我娘说，孩子总是挑天亮的时候来。']));
  }
})();
