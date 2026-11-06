/* ================= 第二十二夜 · 玛丽金巷 ================= */
(() => {
  const cyc = (S, key, lines) => lines[(S.f[key] = ((S.f[key] ?? -1) + 1) % lines.length)];
  let MEMW = 0;   // 巷子里推错门的总次数（跨死亡累计，用来逐级给提示）
  let LASTD = '';   // 上一次是怎么死的（重来时给针对性的提示）
  let DOCFACE = false;   // 鸟嘴医生的特写只闪一次

  /* ================= 声音（S.tone 合成） ================= */
  function hum(S, vol = .035) {   // 苏格兰老摇篮曲《Baloo Baleerie》的调子，安妮轻轻地哼
    let t = .1;
    for (const [f, d] of [[440, .5], [392, .25], [349, .5], [294, .75], [349, .5], [392, .25], [440, .5], [523, .75], [440, .5], [392, .25], [349, .5], [330, .5], [294, 1.2]]) {
      S.tone('sine', f, f * .996, d * .92, vol, t, 1400); S.tone('triangle', f * 2, f * 2, d * .6, vol * .12, t, 2400); t += d;
    }
  }
  function bell(S, vol = .05, n = 2) {   // 送饭人的铜手铃
    for (let i = 0; i < n; i++) { S.tone('triangle', 1480, 1450, .7, vol, i * .32, 6000); S.tone('sine', 2960, 2940, .45, vol * .35, i * .32, 6000); S.tone('sine', 740, 735, .5, vol * .3, i * .32 + .02, 2000); }
  }
  function giggle(S, vol = .045) { [1320, 1520, 1260, 1460, 1380].forEach((f, i) => S.tone('triangle', f, f * .84, .08, vol, i * .11, 5200)); }
  function steps(S, n = 2, vol = .07) { for (let i = 0; i < n; i++) { S.tone('sine', 92, 52, .22, vol, i * .55, 420); S.tone('triangle', 190, 90, .07, vol * .45, i * .55, 900); } }
  function sniff(S, vol = .018) {   // 鸟嘴里长长地吸一口气：嘶——嘶——
    S.tone('sawtooth', 280, 620, .38, vol, 0, 900); S.tone('sawtooth', 300, 700, .32, vol * .8, .55, 900);
  }
  function sputter(S) { S.tone('square', 240, 60, .12, .03, 0, 1200); S.tone('square', 180, 50, .1, .025, .16, 1000); S.tone('sawtooth', 90, 40, .25, .02, .3, 600); }
  function nails(S, n = 3) { for (let i = 0; i < n; i++) { S.tone('square', 980, 940, .05, .05, i * .5, 4000); S.tone('sine', 140, 90, .12, .06, i * .5, 700); } }
  function breathOut(S) { S.tone('sawtooth', 500, 160, .6, .02, 0, 700); }

  /* ================= 火苗 ================= */
  const FLID = { close: 'flC', under: 'flU', house: 'flH' };
  const FL = id => ({ id, x: 1, y: 1, spr: 'flame', solid: false, hidden: true, z: 2, light: { r: 1.7, col: 'rgba(255,186,110,.2)', pl: true } });
  /* 火苗往哪边歪（-1 直立；0下 1左 2右 3上）。地下的风往外抽：火苗往哪边歪，哪边就通着。 */
  function leanAt(S, x, y) {
    if (S.map === 'close') return S.f.gap && y >= 19 && x >= 8 && x <= 11 ? 0 : -1;
    if (S.map !== 'under' || S.f.phase !== 'maze') return -1;
    const d = (a, b) => Math.abs(x - a) + Math.abs(y - b);
    if (d(14, 6) <= 1) return 2;
    if (d(24, 11) <= 1) return ((W.t * 1.4) | 0) % 2 ? 0 : 1;   // 两边都有风：一会儿朝下，一会儿朝左
    if (d(14, 14) <= 1) return 0;
    return -1;
  }
  function flameOn(S, v = true) { const id = FLID[S.map]; if (id) { const e = S.ent(id); if (e) e.hidden = !v; } S.f.lit = v ? 1 : 0; }

  /* ================= 地下迷巷 ================= */
  const UR = (() => {
    const w = 30, h = 34, g = [...Array(h)].map(() => Array(w).fill('#'));
    const c = (x0, y0, x1, y1, ch = 'd') => { for (let y = Math.min(y0, y1); y <= Math.max(y0, y1); y++) for (let x = Math.min(x0, x1); x <= Math.max(x0, x1); x++) g[y][x] = ch; };
    c(14, 1, 14, 6);            // 砖墙洞口往下
    c(6, 6, 24, 6);             // 岔口一：左（死路）/右
    c(6, 6, 6, 10); c(6, 9, 6, 10, 'u');
    c(24, 6, 24, 19);           // 往下到岔口二，再往下是医生那条
    c(14, 11, 24, 11);          // 岔口二往左
    c(14, 11, 14, 23);          // 往下到岔口三，再往下挤出房缝
    c(6, 14, 14, 14); c(6, 14, 6, 17); c(6, 16, 6, 17, 'u');   // 岔口三：左（死路）
    c(15, 14, 23, 14);          // 岔口三：右（通到医生那条）
    c(24, 18, 24, 19, 'u');
    c(2, 24, 28, 25, 'k');      // 上层巷子
    c(26, 26, 27, 29, 'S');     // 台阶
    c(2, 30, 28, 31, 'k');      // 下层巷子
    return g.map(r => r.join(''));
  })();
  const inZ = (x, y) => (x === 24 && y >= 13 && y <= 19) || (y === 14 && x >= 17 && x <= 23);
  const CANDLE = 36, CANDLE_MIN = 22;
  const J = { J1: [14, 6], J2: [24, 11], J3: [14, 14] };
  const JTXT = {
    J1: '火苗朝右边歪过去。\n左边的岔道里，飘出一股死水和烂草的臭味。',
    J2: '火苗一会儿朝下歪，一会儿朝左歪——两边都有风。\n往下的那条岔道里，有一股薰衣草和丁香的味道。',
    J3: '火苗朝下歪。\n左边：死水的臭味。右边：薰衣草和丁香。'
  };

  const caughtDoc = async S => {
    S.clearTimer(); LASTD = 'doc';
    S.f.dS = 0; S.stop('docU');
    sniff(S, .03);
    await S.scare('face', { spr: '@doc', face: 'doc', sfx: 'scream' });
    await S.die('黑袍裹住了你。那只长长的鸟嘴凑到你的脖子边上，深深地吸了一口气——\n薰衣草、丁香，还有烧过的硫磺。\n「……病气。」一个闷闷的声音说，「熏。」', '他闻到了你');
  };
  async function candleOut(S) {
    LASTD = 'candle';
    S.f.dS = 0; S.stop('docU'); flameOn(S, false); S.plr(.2); sputter(S); S.amb('none');
    await S.narr('火苗缩成一个小小的蓝点，抖了两下——\n灭了。');
    S.sfx('heart'); await S.wait(900); giggle(S, .03);
    await S.die('黑暗里，有一只冰凉的小手拉住了你的衣角。\n「这下好了，」一个小女孩的声音贴着你的耳朵说，「谁也看不见我们了。」', '蜡烛灭了');
  }
  function startCandle(S, sec) {
    S.f.candleT = sec;
    S.timer(sec, '蜡烛', candleOut, { during: true });
  }
  function resetDoc(S) {
    S.stop('docU'); const d = S.ent('docU'); if (d) { d.hidden = true; d.alpha = 1; }
    S.f.dS = 0; S.f.dT = 0; S.f.dFade = 0; S.f.inD = 0; S.f.atJ = '';
  }
  function docSpawn(S, far) {
    const p = S.pl, d = S.ent('docU');
    let x, y;
    if (p.x === 24) { x = 24; y = far ? 19 : Math.min(19, p.y + 3); }
    else { y = 14; x = far ? 23 : Math.min(23, p.x + 3); }
    S.place('docU', x, y); S.face('docU', 'pl'); d.alpha = far ? .7 : 1; d.hidden = false;
  }
  function mazeTick(S, dt) {
    const f = S.f; if (f.phase !== 'maze') return;
    const p = S.pl, x = p.x, y = p.y;
    if (S.timerLeft != null) {
      if (S.running) {   // 跑起来风大，火苗被扯得乱晃，烧得更快
        S.timerAdd(-dt * 1.2);
        if (!f.runTold && !S.busy) { f.runTold = 1; S.toast('跑起来风大，火苗被扯得乱晃——蜡烛烧得更快了。'); }
      }
      const k = Math.max(0, Math.min(1, S.timerLeft / CANDLE));
      S.plr(1.45 + 1.15 * k);
    }
    const d = S.ent('docU');
    if (f.dFade > 0 && d) { d.alpha = Math.max(0, d.alpha - dt * 1.4); if (d.alpha <= 0) { d.hidden = true; d.alpha = 1; f.dFade = 0; } }
    if (S.busy) return;
    /* 过了岔口就存档（蜡烛剩多少记多少，重来时不回满） */
    const pass = (k, c) => { if (!f[k] && c) { f[k] = 1; f.candleT = S.timerLeft ?? f.candleT; S.cp('maze'); S.toast('（已存档）'); } };
    pass('cp1', y === 6 && x >= 17); pass('cp2', y === 11 && x <= 21); pass('cp3', x === 14 && y >= 16 && y <= 20);
    /* 走到岔口：说一句火苗和气味 */
    let at = '';
    for (const k in J) if (x === J[k][0] && y === J[k][1]) at = k;
    if (at && f.atJ !== at) { f.atJ = at; S.toast(JTXT[at]); }
    else if (!at && f.atJ) { const [jx, jy] = J[f.atJ]; if (Math.abs(x - jx) + Math.abs(y - jy) >= 2) f.atJ = ''; }
    /* 死路：一阵阴风倒灌，火苗一矮 */
    const dk = x === 6 && (y === 9 || y === 10) ? 'D1' : x === 6 && (y === 16 || y === 17) ? 'D2' : '';
    if (dk && f.inD !== dk) {
      f.inD = dk; S.timerAdd(-8); sputter(S); S.sfx('drip');
      S.toast('死路。塌下来的石头和烂泥把路堵死了。\n一股阴风从石缝里倒灌进来——火苗一矮，差点灭了。');
    } else if (!dk && f.inD && !(x === 6 && (y >= 8 && y <= 10 || y >= 15 && y <= 17))) f.inD = 0;
    /* 鸟嘴医生 */
    if (inZ(x, y)) {
      if (!f.dS) {
        if (!f.docWarned) {
          f.docWarned = 1; f.dS = 'warn'; f.dT = 2.6; docSpawn(S, true);
          sniff(S); bell(S, .03, 1); S.bubble('docU', '…', 1600);
          S.toast('薰衣草和丁香的味道浓得呛人——\n岔道深处站着一个黑影，戴着鸟嘴面具，正低着头，一下一下地闻。');
        } else {
          f.dS = 'pre'; f.dT = .8; docSpawn(S, false);
          S.sfx('sting'); sniff(S, .03); S.bubble('docU', '!', 900); S.shake(300, 1);
          S.toast('薰衣草的味道一下子扑到脸上——他来了！快退回岔口！');
        }
      } else if (f.dS === 'warn') {
        f.dT -= dt;
        if (f.dT <= 0) { f.dS = 'pre'; f.dT = .6; S.bubble('docU', '!', 900); S.sfx('sting'); S.toast('鸟嘴猛地抬了起来——他闻到你了！'); }
      } else if (f.dS === 'pre') {
        if (!DOCFACE) { DOCFACE = true; S.sfx('scare'); S.fx('face', { face: 'doc', dur: .6 }); S.shake(300, 2); }   // 他抬起头的那一下（不阻塞，蜡烛照烧）
        f.dT -= dt;
        if (f.dT <= 0) { f.dS = 'chase'; d.alpha = 1; S.chase('docU', { spd: 3.2, zone: inZ, catch: caughtDoc }); }
      } else if (f.dS === 'chase' && d && !d.hidden) {
        if (Math.abs(d.px - p.px) + Math.abs(d.py - p.py) <= 16) { f.dS = 0; S.stop('docU'); S.run(caughtDoc); }   // 一格以内就算追上
      }
    } else if (f.dS) {
      const was = f.dS; f.dS = 0; S.stop('docU'); f.dFade = 1;
      if (was === 'warn') S.toast('他没有追上来。……下一次，就不一定了。');
      else S.toast('薰衣草的味道，慢慢退回了黑暗里。');
    }
    if (x === 14 && y >= 22) { f.phase = 'laneIn'; S.clearTimer(); resetDoc(S); S.run(laneEnter); }
  }

  /* ================= 巷子里的门 ================= */
  const DESC = {
    dFish: '一扇门，门板上画着一条鱼。窗外挂着白旗。\n门环上挂着一只空篮子，篮底躺着三根削好的木签。门没有钉死。',
    dShoe: '门上钉着一块马蹄铁。窗外挂着白旗。\n门板上横着钉了两根木条——封死了。门前的篮子满满的，面包长了绿毛，一口没动。',
    dKey: '门板上刻着一把钥匙。窗外挂着白旗。\n门上钉着木条，封死了。门前放着一只空篮子，里面什么也没有。',
    dWheat: '门上刻着一束麦穗。窗外没有挂白旗，窗户里黑着。\n门前没有篮子。',
    dBird: '门板上画着一只小鸟，颜料快掉光了，歪歪扭扭的，像是小孩子画的。窗外挂着白旗。\n门上钉着木条，封死了。门前放着一只空篮子，里面一根签也没有。',
    dCross: '门上刻着一个十字。窗外挂着白旗。\n门上钉着木条，封死了。门前的篮子满满的，燕麦饼已经发霉了，一口没动。'
  };
  const WRONGT = {
    dFish: '门没有钉死，篮子里有签——这家的人还活着。不是被封死的那一家。',
    dShoe: '账本上，马蹄铁这家开头是三根签——三个人。安妮说，屋里就她和妈妈两个。',
    dCross: '十字门最后那几天，篮子根本没人取。可安妮说，篮子都是她去门口拿的。',
    dKey: '钥匙门从头到尾都只有一根签——一个人。安妮家是两个人。',
    dWheat: '窗外没挂白旗——这家没染上疫病，送饭人根本不往这儿送。'
  };
  function laneHint(n) {
    if (n <= 1) return '';
    if (n === 2) return '\n……账本上记的是每家篮子里的签数。安妮说过三句话（翻笺：「安妮说过的话」）——一句一句对。';
    if (n === 3) return '\n……开头是两根签的只有两家：十字门和小鸟门。安妮每天都去拿篮子，最后签用完了。';
    return '\n……是下层巷子里，那扇画着小鸟的门。';
  }
  async function doorOn(S, id) {
    await S.narr(DESC[id]);
    if (S.f.phase !== 'lane') return;
    if (S.once('door1')) await S.think('哪一扇是安妮的家？\n（账本、告示、安妮说过的话——都在笺里。）');
    const r = await S.ask('推开这扇门？', ['推门', '再看看']);
    if (r) return;
    if (id === 'dBird') return openBird(S);
    return wrongDoor(S, id);
  }
  function terraceY(S) { const y = S.pl.y; return y <= 27 ? 24 : 30; }
  async function wrongDoor(S, id) {
    S.f.wrong = (S.f.wrong || 0) + 1; MEMW++;
    const w = S.f.wrong, p = S.pl, ty = terraceY(S), dir = p.x > 15 ? -1 : 1;
    S.sfx('locked'); S.shake(300, 1);
    await S.narr(id === 'dFish' || id === 'dWheat' ? '门后面一点声音也没有。\n门缝里吹出一股凉气。' : '你推了推，木条纹丝不动。\n门缝里吹出一股凉气，带着熏过的硫磺味。');
    const near = n => { let x = p.x + dir * n; x = Math.max(2, Math.min(28, x)); return x; };
    if (w === 1) {
      S.place('docL', dir > 0 ? 28 : 2, ty, dir > 0 ? 1 : 2); S.ent('docL').alpha = 0;
      bell(S, .04, 2); sniff(S);
      await S.alpha('docL', .9, 800);
      S.toast('薰衣草和丁香的味道……巷子那头，站着一个戴鸟嘴面具的人。');
      await S.think(WRONGT[id] + laneHint(MEMW));
      S.goal('找到安妮的家——推错一次，他就走近一步');
    } else if (w === 2) {
      S.place('docL', near(5), ty, dir > 0 ? 1 : 2); S.ent('docL').alpha = 1;
      steps(S, 3); sniff(S, .025); S.bubble('docL', '…', 1500);
      S.toast('他又走近了。鸟嘴一下一下地闻着地上的篮子。');
      await S.think(WRONGT[id] + laneHint(MEMW) + '\n……再推错一次，他就到跟前了。');
    } else {
      S.place('docL', near(4), ty, dir > 0 ? 1 : 2); S.ent('docL').alpha = 1;
      steps(S, 4, .09); sniff(S, .03);
      await S.walk('docL', [near(1), ty], 3.2);
      S.face('docL', 'pl');
      await S.scare('face', { spr: '@doc', face: 'doc', sfx: 'scream' });
      await S.die('鸟嘴凑到你的脸上，深深地吸了一口气。\n「这一家……也没有签。」闷闷的声音说，「封。」\n叮。叮。叮。', '门被钉死了');
    }
  }
  async function openBird(S) {
    const e = S.ent('dBird');
    S.sfx('knock'); await S.narr('你把手按在那只小鸟上。');
    nails(S, 3);
    e.s.boards = 0;
    await S.narr('门板上的钉子，一根一根自己退了出来，落在石头上。\n叮。叮。叮。');
    e.open = true; S.sfx('open');
    await S.wait(500);
    S.hide('docL');
    await S.go('house', 6, 6, 3);
  }

  /* ================= 章节 ================= */
  defChapter({
    id: 'marykings', n: 22, title: '玛丽金巷', sub: '爱丁堡地底下压着一条十七世纪的小巷。一间小屋里堆满了玩具——都是送给一个叫安妮的小女孩的。', origin: '苏格兰 爱丁堡传说', color: '#2c2a24',
    icon: '@annie', amb: 'drone', floor: 'stone', wall: 'stone', dark: .5, plr: 3,
    thumb(g, w, h) {   // 玩具堆 + 一根牛油蜡烛
      const toy = (x, y, c, s) => { g.fillStyle = c; g.fillRect(x, y, s * 3, s * 3); g.fillRect(x - s, y - s, s * 1.2, s * 1.2); g.fillRect(x + s * 2.8, y - s, s * 1.2, s * 1.2); g.fillStyle = '#111'; g.fillRect(x + s * .7, y + s, s * .5, s * .5); g.fillRect(x + s * 1.8, y + s, s * .5, s * .5); };
      g.fillStyle = '#1a1712'; g.fillRect(0, h * .72, w, h * .28);
      toy(w * .08, h * .62, '#a8784a', 5); toy(w * .22, h * .7, '#d8c8b0', 4); toy(w * .7, h * .66, '#c86a6a', 4); toy(w * .8, h * .58, '#8a9aa8', 5); toy(w * .62, h * .76, '#e8d8a0', 3);
      g.fillStyle = '#e8e2cc'; g.fillRect(w * .9, h * .5, 4, 12); g.fillStyle = '#ffcf5a'; g.fillRect(w * .9 + 1, h * .5 - 6, 2, 5); g.fillStyle = '#ff8a2a'; g.fillRect(w * .9 + 1, h * .5 - 7, 1, 1);
    },
    endings: { home: '有人来开门了', toy: '新的玩具', candle: '无人生还' },
    people: {
      me: { skin: '#f0caa0', hair: '#1e1818', hs: 'bun', top: '#5a4632', top2: '#e8e0cc', bottom: '#3a2c22', dress: true, shoes: '#2a2018', apron: '#cfc6b0' },
      morag: { key: 'mk-morag', skin: '#f2d0b8', hair: '#b0502a', hs: 'bob', top: '#2a4a3a', top2: '#c8b890', bottom: '#3a2a2a', skirt: true, shoes: '#1a1a1a',
        extra(g, d, fr, G, R) { if (d !== 3) { R(3, G.tT, 10, 2, '#7a2a2a'); R(5, G.tT, 1, 2, '#2a4a7a'); R(9, G.tT, 1, 2, '#2a4a7a'); R(3, G.tT + 2, 2, 3, '#7a2a2a'); } else R(3, G.tT, 10, 5, '#7a2a2a'); } },
      doug: { skin: '#e8c0a0', hair: '#c8c0b8', hs: 'bald', top: '#26304a', top2: '#d8d020', bottom: '#202430', shoes: '#111' },
      annie: { key: 'mk-annie', child: true, ghost: true, dress: true, skin: '#e6e2da', hair: '#8a6a4a', hs: 'long', top: '#a8a294', top2: '#d8d4c8', eye: '#140e0e', extra: coif(false) },
      annie_r: { key: 'mk-annie-r', child: true, ghost: true, dress: true, skin: '#ece8e0', hair: '#8a6a4a', hs: 'long', top: '#a8a294', top2: '#d8d4c8', eye: '#140e0e', mouth: '#b07070', extra: coif(true) },
      doc: { key: 'mk-doc', robe: true, noFeet: true, skin: '#2a2420', hair: '#141210', hs: 'bald', top: '#161412', top2: '#26221e', eye: '#2a2420', extra: beak(true) },
      docman: { key: 'mk-docman', robe: true, noFeet: true, skin: '#dcbc9c', hair: '#5a3a22', hs: 'short', top: '#161412', top2: '#26221e', extra: beak(false) },
      mq: { key: 'mk-mq', skin: '#cfc8bc', hair: '#8a8070', hs: 'bun', top: '#7a6a52', top2: '#6a5a44', bottom: '#5a4a3a', dress: true, eye: '#a8a090' }
    },
    faces: {
      annie(R, a, t) {
        R(0, 0, 32, 32, '#06070a');
        R(6, 3, 20, 6, '#e8e4d8'); R(5, 6, 3, 19, '#e8e4d8'); R(24, 6, 3, 19, '#e8e4d8'); R(7, 2, 18, 1, '#d8d4c8');
        R(8, 8, 16, 16, '#dcd8ce'); R(9, 24, 14, 3, '#d0ccc2'); R(11, 27, 10, 1, '#c4c0b6');
        R(8, 8, 16, 2, '#8a6a4a'); R(8, 10, 2, 5, '#8a6a4a'); R(22, 10, 2, 6, '#8a6a4a');
        R(9, 19, 2, 3, '#c2bdb2'); R(21, 19, 2, 3, '#c2bdb2');
        if (a < .45) { R(11, 14, 3, 3, '#120c0c'); R(18, 14, 3, 3, '#120c0c'); R(12, 14, 1, 1, '#e8e8e8'); R(19, 14, 1, 1, '#e8e8e8'); R(15, 22, 2, 1, '#6a3a3a'); }
        else {   // 眼睛一下子变成两个黑洞，脸上挂着两道灰白的泪痕
          R(10, 12, 5, 6, '#030303'); R(17, 12, 5, 6, '#030303');
          R(12, 18, 1, 6, '#9aa4b0'); R(19, 18, 1, 7, '#9aa4b0');
          const o = Math.min(4, 1 + Math.floor((a - .45) * 9)); R(14, 21, 4, o, '#140606');
        }
      },
      doc(R, a, t) {
        R(0, 0, 32, 32, '#040404');
        R(5, 5, 22, 27, '#14100c'); R(2, 3, 28, 3, '#0c0a08'); R(8, 0, 16, 4, '#0c0a08'); R(8, 3, 16, 1, '#2a2218');
        R(8, 6, 16, 14, '#3a2c22'); R(15, 6, 1, 10, '#20160e'); R(8, 6, 16, 1, '#4a3a2c');
        for (const ex of [9, 17]) { R(ex, 9, 6, 6, '#8a7a5a'); R(ex + 1, 10, 4, 4, '#2a0a08'); const gl = Math.sin(t * 8) > 0 ? '#e0482a' : '#c83a22'; R(ex + 1, 10, 4, 4, gl); R(ex + 1, 10, 1, 1, '#ffd8b8'); }
        const op = Math.min(2, Math.floor(a * 4));
        for (let i = 0; i < 14; i++) {
          const x = 12 + i * .85, y = 16 + i, wd = Math.max(1, 7 - i * .45);
          R(x, y, wd, 1, i % 3 ? '#d6c9ab' : '#c8b898'); R(x + wd - 1, y, 1, 1, '#9a8a6a');
          if (op && i > 2 && i < 11) R(x + 1, y + 1, wd - 2, op > 1 ? 1 : 0, '#1a0e08');
        }
        R(6, 20, 3, 2, '#2a2218'); R(23, 20, 3, 2, '#2a2218');
      }
    },
    items: {
      rabbit: { name: '毛线小兔', desc: '一只毛线织的小兔子，一只耳朵长，一只耳朵短，脖子上系着一根红毛线。\n一个七八岁的小姑娘留下的，她说：「请交给安妮。」' },
      candle: { name: '牛油蜡烛和火柴', desc: '烛光导览用的牛油蜡烛，点起来有一股淡淡的羊油味。\n火苗很敏感——一点点风，它就歪。' },
      stick: { name: '一根木签', desc: '削好的白木签，一指来长，削得很仔细。' }
    },
    notes: {
      script: { title: '莫拉格的导览手册（手写本）', text: '· 玛丽·金：十七世纪住在这条巷子里的一位商人寡妇，巷子因她得名。\n· 1645 年，爱丁堡最后一场大鼠疫。染病的人家，窗外要挂白旗。\n· 「封巷」：游客最爱问——是不是当年把病人连人带房封死在巷子里？讲的时候要说清楚：这是传说，档案里找不到。\n· 1753 年起，皇家交易所（今天的市政厅）压着巷子盖起来。巷子上半截拆了，下半截成了大楼的地基。\n· 安妮的房间：九十年代初，一位来访的灵媒说在这间屋里感觉到一个小女孩，叫安妮，丢了她的娃娃。她出去买了个娃娃放在这儿。从那以后，游客就一直给安妮留玩具。\n\n（页边铅笔字：）\n停电别慌。地下的风往外抽——蜡烛火苗往哪边歪，哪边就通着。　——莫\n（导游之间的老笑话：闻到薰衣草和丁香，是鸟嘴医生来查房了；闻到死水烂草，是塌了的老地沟，别往里钻。）' },
      edict: { title: '一六四五年 爱丁堡市议会告示（展板）', text: '（展板上的字是导游组照着老档案的意思写的，下面配着一幅木刻：一条巷子，家家窗外挂着白布。）\n\n一、凡染疫之家，须于窗外悬白布为旗；全家闭门，不得出入。\n二、每日清晨，送饭人将食篮置于门前。屋内之人取食后，须在空篮中放入木签，一人一根，以报生者之数。\n三、食篮三日无人取，或空篮中无签，即作屋内无人生还论。由清洁工（clenger）封门、熏屋，屋中衣物器具，一概烧毁。\n四、医生出入疫屋，须戴鸟嘴面具，嘴中盛香草，以避疫气。' },
      ledger: { title: '送饭人的账本（1645 年秋）', text: '（一本油乎乎的账簿，字写得很大，像是不常写字的人记的。前面的页都烂了，只剩最后五天。）\n\n每日清晨送篮到门前。收回空篮，数篮里的木签——一根签，一个活人。\n\n鱼　门：四、四、四、三、三\n马蹄铁：三、二、未取、未取、未取\n十字门：二、一、未取、未取、未取\n小鸟门：二、二、二、一、空篮无签\n钥匙门：一、一、一、一、空篮无签\n麦穗门：未挂白旗，不送\n\n（最底下一行：）\n马蹄铁、十字、小鸟、钥匙——四家，报清洁工，封门熏屋。' },
      words: { title: '安妮说过的话', text: '（你在心里一句一句记下来的。）\n\n在「安妮的房间」里：\n「这屋里就我和妈妈两个人。」\n\n在砖墙的洞口：\n「妈妈睡着以后，篮子都是我去门口拿的。可重了。」\n\n在下面这条巷子口：\n「妈妈最后一次往篮子里放签，只放了一根。她说，这根是你的。\n后来签用完了。我不会削——妈妈不让我碰刀。」' }
    },
    legend: '玛丽金巷（Mary King’s Close）是爱丁堡老城皇家一英里大道边上的一条小巷，以十七世纪住在这里的一位商人寡妇玛丽·金得名。1753 年起，市里在巷子上方修建皇家交易所（今天的爱丁堡市政厅），巷子的上半截房子被拆掉，下半截被压在大楼底下当了地基，从此成了「地下的街」。据说一直到十九世纪末还有人住在里面。2003 年，这里作为景点「真实的玛丽金巷」对外开放，导游穿着十七世纪的服装，带游客顺着陡峭的石阶往下走。\n\n1645 年，爱丁堡暴发了最后一场大鼠疫。流传的说法是：染病的人家要在窗外挂白旗示警，全家隔离；据记载，市里还专门聘请过瘟疫医生。鸟嘴面具、嘴里塞香草的形象更多来自欧洲大陆，但常被和这条巷子联系在一起。最出名的传说是「封巷」——市里把染疫的居民连人带房封死在巷子里，任其死去。这个说法流传极广，却查无实据，历史学者多认为它是后来附会出来的。1685 年出版的一本讲鬼神的书里，记载了一对夫妇在巷中的住所看见飘浮的人头、一个孩子和一条狗，此后这条巷子的鬼故事就越来越多。\n\n安妮的故事要晚得多。据说 1992 年，一位来自日本的灵媒参观时，在一间小屋里感觉到一个小女孩的存在——她叫安妮，因为丢了自己的娃娃而哭。灵媒出去买了一个娃娃留在屋里。流传的版本还说安妮是在鼠疫中被家人留下的病孩子。从那以后，世界各地的游客都给安妮留玩具，那间屋子渐渐堆满了布娃娃、小熊和各种小东西，成了巷子里最出名的一站。\n\n（本章的主角、莫拉格和道格、送饭的篮子与「一根签一个人」的规矩、送饭人的账本、六扇门、安妮的妈妈和布娃娃莉兹、封死的下半截巷子，以及那个找了安妮三百六十年的医生，均为游戏虚构。）',
    start: { map: 'lobby', x: 8, y: 6, dir: 3 },
    async intro(S) {
      MEMW = 0;
      await S.card('第二十二夜　玛丽金巷', '2005年11月　苏格兰 爱丁堡　皇家一英里大道', '爱丁堡老城的主街底下，\n压着一条十七世纪的小巷。\n\n一七五三年，市里在它头顶盖起了大楼，\n巷子的上半截被拆掉，下半截成了地基。\n\n现在，它是一处景点。\n导游每天带着游客往下走，走到一间小屋门口——\n屋里堆满了玩具。\n\n都是送给一个叫安妮的小女孩的。');
    },
    resume: {
      maze: async S => {
        resetDoc(S); flameOn(S, true); S.amb('drone');
        const tip = LASTD === 'doc' ? '上一次，我在薰衣草的岔道里愣住了。\n闻到那股味道就退回岔口——别等他抬头。'
          : LASTD === 'candle' ? '上一次，蜡烛烧完了。\n别在岔口站太久，也别钻有死水味的岔道——死路里的阴风会把火苗压矮。' : '';
        await S.think('……火苗往哪边歪，哪边就通着；薰衣草和丁香是他，死水是死路。' + (tip ? '\n' + tip : '\n别跑——跑起来蜡烛烧得更快。'));
        startCandle(S, Math.max(S.f.candleT || CANDLE, CANDLE_MIN));
      },
      lane: async S => {
        S.hide('docL'); S.ent('docL').alpha = 1; flameOn(S, true);
        await S.think('……这一次，先把账本和安妮的话对清楚，再推门。' + laneHint(Math.max(2, MEMW)));
      },
      house: async S => { flameOn(S, true); await S.think('……安妮还坐在床边，抱着膝盖，看着你手里的蜡烛。'); }
    },
    tick(S, dt) {
      const id = FLID[S.map]; if (!id) return;
      const e = curMap().ents.find(z => z.id === id); if (!e || e.hidden) return;
      e.px = W.pl.px; e.py = W.pl.py; e.x = W.pl.x; e.y = W.pl.y;
      e.s.lean = leanAt(S, W.pl.x, W.pl.y);
      e.s.low = S.f.phase === 'maze' && S.timerLeft != null && S.timerLeft < 12 ? 1 : 0;
    },
    tiles: {
      tartan: { solid: false, paint(R, X, Y) { R(0, 0, 16, 16, '#5a1e22'); for (const k of [3, 11]) { R(k, 0, 2, 16, 'rgba(30,50,40,.6)'); R(0, k, 16, 2, 'rgba(30,50,40,.6)'); } R(7, 0, 1, 16, 'rgba(220,200,120,.35)'); R(0, 7, 16, 1, 'rgba(220,200,120,.35)'); } },
      gutter: { solid: false, paint(R, X, Y) { speck(R, '#3e3a34', ['#46423a', '#35322c'], X, Y, 10, 5); R(X % 2 ? 0 : 3, 0, 13, 16, '#2a2824'); R(X % 2 ? 0 : 3, 0, 13, 1, '#1c1a18'); if (hash(X, Y, 3) < .3) R(6, 6, 3, 2, 'rgba(120,140,150,.35)'); if (Y % 4 === 0) R(0, 15, 16, 1, '#24221e'); } },
      steps: { solid: false, paint(R, X, Y) { R(0, 0, 16, 16, '#4a463e'); for (let i = 0; i < 4; i++) { R(0, i * 4, 16, 1, '#6a665c'); R(0, i * 4 + 3, 16, 1, '#2a2824'); } } }
    },
    sprites: {
      flame(g, e, t, R) {   // 手里的牛油蜡烛（跟着玩家画；客机按自己画面里的玩家位置画）
        const ox = W.pl.px - e.px, oy = W.pl.py - e.py, d = W.pl.dir;
        const hx = ox + (d === 1 ? 1 : d === 2 ? 13 : 12), hy = oy + (d === 3 ? 3 : 5);
        R(hx - 1, hy + 4, 4, 1, '#6a5a3a'); R(hx, hy, 2, 4, '#e8e2cc'); R(hx, hy, 1, 4, '#f6f0dc');
        const L = e.lean ?? -1, sm = e.low ? 1 : 0, f = Math.sin(t * 17) > 0 ? 0 : 1;
        if (L === -1) {   // 直直地立着
          R(hx - (sm ? 0 : 1), hy - 4 + f + sm, sm ? 2 : 4, 3 - f, '#ffcf5a'); R(hx, hy - 6 + f + sm * 2, 2, 2, '#ffcf5a'); R(hx, hy - 2, 2, 1, '#fff2b0');
          if (!sm) R(hx + (f ? 1 : 0), hy - 7 + f, 1, 1, '#ff8a2a');
        } else {   // 歪向一边：火舌被扯过去，前面一串风纹往那边飘（朝上/下歪时火舌偏到身子外侧，不挡蜡烛）
          const v = DIRS[L], side = d === 1 ? -1 : 1;
          const tx = hx + (v[1] ? side * 3 : v[0] * 4), ty = hy - 3 + (v[1] ? v[1] * 2 : 0);
          R(hx, hy - 2, 2, 2, '#fff2b0');
          R(Math.min(hx, tx), Math.min(hy - 3, ty), Math.abs(tx - hx) + 2, Math.abs(ty - (hy - 3)) + 2 - sm, '#ffcf5a');
          R(tx, ty, 1, 1, '#ff8a2a'); R(hx + (tx > hx ? 0 : 1), hy - 2, 1, 1, '#fff8d8');
          for (let k = 0; k < 5; k++) {
            const p = (t * 1.4 + k / 5) % 1, dist = 6 + p * 20, j = Math.sin(t * 5 + k * 1.7) * 2, a = ((1 - p) * .9).toFixed(2);
            R(Math.round(hx + .5 + v[0] * dist + (v[1] ? j : 0)), Math.round(hy - 2 + v[1] * dist + (v[0] ? j : 0)), v[0] ? 2 : 1, v[1] ? 2 : 1, `rgba(255,230,170,${a})`);
          }
        }
      },
      wisp(g, e, t, R) {   // 气味：薰衣草（紫）/ 死水（灰绿）
        const lav = e.col === 'lav', n = 6;
        for (let i = 0; i < n; i++) {
          const p = (t * (lav ? .5 : .3) + i / n) % 1, x = 8 + Math.sin(t * 1.3 + i * 2.1) * 5 + (i % 2 ? 2 : -2), y = 14 - p * 16, a = (Math.sin(p * Math.PI) * (lav ? .7 : .55)).toFixed(2);
          R(x, y, lav ? 1 : 2, 1, lav ? `rgba(196,160,236,${a})` : `rgba(130,150,96,${a})`);
          if (lav && i % 2) R(x + 1, y - 1, 1, 1, `rgba(240,220,255,${a})`);
        }
      },
      toypile(g, e, t, R) {   // 安妮的玩具堆（两格宽）；wall = 全都转过去，脸朝墙
        const back = !!e.wall;
        const bear = (x, y, c) => { R(x, y + 3, 7, 6, c); R(x + 1, y, 5, 4, c); R(x, y - 1, 2, 2, c); R(x + 5, y - 1, 2, 2, c); if (!back) { R(x + 2, y + 1, 1, 1, '#111'); R(x + 4, y + 1, 1, 1, '#111'); R(x + 3, y + 2, 1, 1, '#3a2016'); } else R(x + 2, y + 4, 3, 1, shade(c, -.2)); };
        const doll = (x, y, c, hc) => { R(x + 1, y, 4, 4, '#ecdcc8'); R(x, y, 6, 2, hc); R(x, y + 4, 6, 6, c); if (!back) { R(x + 2, y + 2, 1, 1, '#111'); R(x + 4, y + 2, 1, 1, '#111'); } else R(x, y, 6, 4, hc); };
        R(-2, 10, 36, 6, '#3a3026'); R(0, 8, 32, 3, '#4a3e30');
        bear(1, 4, '#a8784a'); doll(9, 3, '#c86a6a', '#d8b060'); bear(16, 5, '#d8c8b0'); doll(24, 2, '#6a8ac8', '#5a3a22');
        R(4, 11, 6, 3, '#3a6ac8'); R(5, 13, 1, 1, '#111'); R(8, 13, 1, 1, '#111');
        bear(11, 9, '#8a9aa8'); R(20, 11, 5, 3, '#e8d8a0'); R(26, 10, 4, 4, '#c84a4a'); R(27, 10, 2, 1, '#f0f0f0');
        if (e.rab) { R(13, -3, 6, 7, '#efe8dc'); R(13, -7, 2, 5, '#efe8dc'); R(17, -5, 2, 3, '#efe8dc'); R(13, 2, 6, 1, '#c82a2a'); R(14, -1, 1, 1, '#111'); R(17, -1, 1, 1, '#111'); }
      },
      board(g, e, t, R) { box(R, 1, 1, 14, 11, '#1c2228'); R(3, 3, 10, 1, '#d8d4c8'); R(3, 5, 8, 1, '#8a9098'); R(3, 7, 9, 1, '#8a9098'); R(3, 9, 6, 1, '#8a9098'); if (e.col) R(11, 8, 3, 3, e.col); },
      bulb(g, e, t, R) { R(7, -14, 1, 6, '#2a2a2a'); R(6, -8, 3, 1, '#3a3a3a'); const on = !e.off && !(e.flicker && Math.sin(t * 31) > .2); R(6, -7, 3, 3, on ? '#ffe8a0' : '#4a4436'); if (on) R(7, -6, 1, 1, '#fff'); R(5, -7, 1, 4, '#2a2a2a'); R(9, -7, 1, 4, '#2a2a2a'); },
      rack(g, e, t, R) {   // 戏服架：鸟嘴医生的行头
        R(1, -14, 1, 28, '#5a5a5a'); R(14, -14, 1, 28, '#5a5a5a'); R(1, -14, 14, 1, '#7a7a7a');
        R(3, -12, 10, 22, '#161412'); R(4, -12, 8, 3, '#0c0a08'); R(2, -13, 12, 1, '#0c0a08');
        R(5, -9, 6, 4, '#3a2c22'); R(6, -8, 1, 1, '#c83a2a'); R(9, -8, 1, 1, '#c83a2a'); R(7, -5, 2, 4, '#d6c9ab'); R(8, -1, 1, 2, '#c8b898');
      },
      docstand(g, e, t, R) {   // 展柜：鸟嘴医生假人；empty = 假人不见了
        box(R, 0, -16, 16, 31, '#1a1e22'); R(1, -15, 14, 29, 'rgba(150,180,200,.12)'); R(2, 12, 12, 2, '#3a3a3a');
        if (!e.empty) { R(4, -12, 8, 24, '#161412'); R(3, -14, 10, 2, '#0c0a08'); R(5, -16, 6, 2, '#0c0a08'); R(5, -11, 6, 5, '#3a2c22'); R(6, -10, 1, 1, '#c83a2a'); R(9, -10, 1, 1, '#c83a2a'); R(7, -7, 2, 5, '#d6c9ab'); R(12, -10, 1, 22, '#6a5038'); }
        else { R(3, 4, 11, 1, '#6a5038'); R(12, 3, 2, 1, '#6a5038'); }
        R(2, -15, 1, 28, 'rgba(220,240,255,.18)');
      },
      herbs(g, e, t, R) { box(R, 3, 8, 10, 6, '#8a6a3a'); for (let i = 0; i < 5; i++) R(4 + i * 2, 5 + (i % 2), 1, 4, ['#8a70b0', '#6a8a4a', '#8a70b0', '#7a5a3a', '#6a8a4a'][i]); },
      seal(g, e, t, R) {   // 巷子尽头的砖墙（四格宽）；gap = 塌开一个洞
        R(0, -10, 64, 26, '#4a3028');
        for (let y = -10; y < 16; y += 4) for (let x = ((y / 4) & 1) * 4; x < 64; x += 8) { R(x, y, 7, 3, hash(x, y, 4) < .5 ? '#6a4034' : '#5e3a2e'); }
        if (e.gap) { R(22, -2, 20, 18, '#050404'); R(20, 0, 3, 16, '#2a1a14'); R(41, 1, 3, 15, '#2a1a14'); R(18, 13, 28, 3, '#3a2a22'); R(24, 12, 4, 2, '#6a4034'); R(36, 13, 5, 2, '#5e3a2e'); }
        else { R(2, 6, 1, 9, '#8a8a8a'); R(61, 6, 1, 9, '#8a8a8a'); R(2, 7, 60, 1, '#a83030'); }
      },
      pdoor(g, e, t, R) {   // 1645 年的门（墙面）：mk 门上的记号；boards 钉死；bk 篮子
        const c = '#4a3624';
        if (e.open) { R(2, -2, 12, 16, '#050404'); R(2, -2, 2, 16, '#2a1e14'); }
        else {
          box(R, 2, -2, 12, 16, c); for (let x = 4; x < 14; x += 3) R(x, -1, 1, 14, '#3a2818');
          const k = e.mk, M = '#d8ccb0';
          if (k === 'fish') { R(5, 3, 5, 3, M); R(10, 2, 2, 5, M); R(6, 4, 1, 1, c); }
          else if (k === 'shoe') { R(5, 2, 2, 6, '#8a8a8a'); R(9, 2, 2, 6, '#8a8a8a'); R(5, 2, 6, 2, '#8a8a8a'); }
          else if (k === 'key') { R(5, 2, 3, 3, M); R(6, 3, 1, 1, c); R(8, 3, 5, 1, M); R(11, 4, 1, 2, M); }
          else if (k === 'wheat') { R(8, 1, 1, 8, M); for (let i = 0; i < 3; i++) { R(6, 2 + i * 2, 2, 1, M); R(9, 2 + i * 2, 2, 1, M); } }
          else if (k === 'bird') { R(5, 4, 5, 3, '#b8c8d8'); R(9, 3, 3, 2, '#b8c8d8'); R(12, 4, 1, 1, '#d8a040'); R(10, 3, 1, 1, '#111'); R(4, 5, 2, 1, '#b8c8d8'); }
          else if (k === 'cross') { R(7, 1, 2, 9, M); R(4, 4, 8, 2, M); }
          R(11, 7, 2, 2, '#9a8a5a');
          if (e.boards) { R(0, 0, 16, 2, '#6a5034'); R(0, 0, 16, 1, '#8a6a44'); R(0, 8, 16, 2, '#6a5034'); R(0, 8, 16, 1, '#8a6a44'); for (const [x, y] of [[1, 0], [14, 0], [1, 8], [14, 8]]) R(x, y, 1, 1, '#222'); }
        }
        const bk = e.bk;
        if (bk === 'sticks') { R(10, 6, 6, 5, '#a07a40'); R(11, 5, 4, 1, '#a07a40'); R(11, 7, 1, 3, '#e8e0c8'); R(13, 7, 1, 3, '#e8e0c8'); R(14, 6, 1, 4, '#e8e0c8'); }
        else if (bk) {
          R(9, 16, 7, 5, '#a07a40'); R(9, 16, 7, 1, '#7a5a2a'); R(10, 14, 1, 2, '#a07a40'); R(14, 14, 1, 2, '#a07a40'); R(10, 13, 5, 1, '#a07a40');
          if (bk === 'full') { R(10, 15, 5, 2, '#b89a60'); R(11, 15, 1, 1, '#5a7a3a'); R(13, 16, 1, 1, '#5a7a3a'); }
        }
      },
      fwin(g, e, t, R) {   // 小窗；flag = 窗外挂着白布
        box(R, 3, 0, 10, 8, '#3a2c20'); R(4, 1, 8, 6, e.lit ? '#a89060' : '#0e1218'); R(8, 1, 1, 6, '#3a2c20'); R(4, 4, 8, 1, '#3a2c20');
        if (e.flag) { const s = Math.round(Math.sin(t * 1.1 + e.px) * 1); R(4, 7, 8, 1, '#5a4a3a'); R(5 + s, 8, 6, 6, '#e8e4d8'); R(5 + s, 13, 2, 2, '#e8e4d8'); R(9 + s, 13, 2, 1, '#e8e4d8'); R(6 + s, 9, 1, 4, '#cfcabc'); }
      },
      pbasket(g, e, t, R) { R(3, 8, 10, 6, '#a07a40'); R(3, 8, 10, 1, '#7a5a2a'); R(4, 4, 1, 4, '#a07a40'); R(11, 4, 1, 4, '#a07a40'); R(4, 3, 8, 1, '#a07a40'); if (e.st) { R(6, 6, 1, 3, '#e8e0c8'); } if (e.rope) R(8, -10, 1, 13, '#8a7a5a'); },
      niche(g, e, t, R) { R(2, 0, 12, 12, '#1a1410'); R(2, 0, 12, 1, '#3a3228'); R(3, 7, 9, 4, '#5a4a30'); R(4, 7, 7, 1, '#d8ccb0'); R(11, 3, 2, 4, '#6a6a5a'); R(11, 2, 2, 1, '#3a3a30'); },
      sticks(g, e, t, R) { if (e.taken) { R(4, 11, 8, 1, '#6a5a3a'); return; } for (let i = 0; i < 7; i++) R(4 + i, 4 + (i % 2), 1, 9, '#e0d8c0'); R(3, 8, 10, 1, '#8a7a5a'); },
      bellh(g, e, t, R) { R(7, 4, 2, 5, '#5a4030'); R(5, 9, 6, 4, '#c8a050'); R(4, 12, 8, 1, '#a08040'); R(7, 13, 2, 1, '#6a5030'); },
      rubble(g, e, t, R) { R(1, 6, 14, 9, '#3a342c'); R(3, 3, 6, 5, '#4a443a'); R(9, 5, 5, 4, '#423c32'); R(5, 10, 3, 2, '#2a241e'); R(10, 11, 4, 2, '#5a4a3a'); },
      rat(g, e, t, R) { const m = Math.sin(t * 3 + e.px) > .6 ? 1 : 0; R(4 + m, 10, 6, 3, '#3a3430'); R(10 + m, 10, 2, 2, '#3a3430'); R(11 + m, 10, 1, 1, '#c83a3a'); R(1 + m, 11, 3, 1, '#5a4a44'); },
      hearth(g, e, t, R) { box(R, 0, -10, 16, 25, '#5a4a44'); R(3, -2, 10, 14, '#120a08'); R(4, 9, 8, 3, '#4a4038'); R(5, 10, 2, 1, '#6a6058'); R(0, -12, 16, 3, '#3a2a24'); },
      boxbed(g, e, t, R) {   // 木箱床，毯子底下一个人的形状（头朝上）
        box(R, 0, -6, 32, 36, '#4a3422'); R(2, -4, 28, 32, '#1e160e');
        R(4, -1, 12, 6, '#d8d0bc'); R(6, 0, 8, 4, '#8a6a4a'); R(6, 4, 8, 1, '#8a6a4a');   // 枕头和一绺浅棕的头发
        R(3, 5, 26, 21, '#6a5a44'); R(3, 5, 26, 1, '#8a7a62');
        R(5, 6, 14, 6, '#7e6c52'); R(7, 12, 11, 8, '#7a684e'); R(8, 20, 9, 5, '#76644a');   // 肩膀、身子、腿，鼓起来的轮廓
        R(19, 7, 1, 17, '#4a3e2e'); R(4, 12, 1, 12, '#4a3e2e');
        R(3, 26, 26, 2, '#5a4a36');
      },
      slump(g, e, t, R) {   // 莫拉格靠着墙坐着睡着了
        R(3, 12, 10, 3, '#3a2a2a'); R(2, 14, 3, 1, '#1a1a1a'); R(11, 14, 3, 1, '#1a1a1a');   // 伸出去的腿
        R(4, 2, 8, 10, '#2a4a3a'); R(3, 3, 10, 3, '#7a2a2a'); R(5, 3, 1, 3, '#2a4a7a'); R(9, 3, 1, 3, '#2a4a7a');   // 身子、格子披肩
        R(5, -5, 7, 7, '#f2d0b8'); R(4, -6, 9, 4, '#b0502a'); R(4, -2, 2, 4, '#b0502a'); R(11, -2, 2, 4, '#b0502a');
        R(6, -1, 2, 1, '#5a3a2a'); R(9, -1, 2, 1, '#5a3a2a');   // 闭着的眼睛
        const z = (t * .8) % 1; if (z < .7) R(13 + z * 4, -8 - z * 6, 2, 1, `rgba(220,220,240,${(.7 - z).toFixed(2)})`);
      },
      stool(g, e, t, R) { R(4, 8, 8, 3, '#6a5038'); R(4, 11, 1, 4, '#4a3624'); R(11, 11, 1, 4, '#4a3624'); }
    },
    maps: {
      /* ---------------- 地面：游客中心 ---------------- */
      lobby: {
        amb: 'rain', dark: .2, plr: 4, wall: 'plain', floor: 'tartan',
        legend: { a: 'tartan' },
        rows: [
          '################',
          '################',
          '#aaaaaaaaaaaaaa#',
          '#aaaaaaaaaaaaaa#',
          '#aaaaaaaaaaaaaa#',
          '#aaaaaaaaaaaaaa#',
          '#aaaaaaaaaaaaaa#',
          '#aaaaaaaaaaaaaa#',
          '#aaaaaaaaaaaaaa#',
          '#aaaaaaaaaaaaaa#',
          '################'],
        ents: [
          { id: 'lWin', x: 3, y: 1, spr: 'window', on: S => S.narr('雨打在玻璃上。窗外是皇家一英里大道，石板路亮得像抹了油。\n圣贾尔斯大教堂的尖顶黑黑地立在雨里。') },
          { id: 'lDoor', x: 7, y: 1, spr: 'door', col: '#3a2a20', on: S => S.narr('通往大街的门。夜班还没收尾，你还不能走。') },
          { id: 'lPoster', x: 10, y: 1, spr: 'poster', col: '#c8b890', on: S => S.narr('海报：「走进爱丁堡地下的十七世纪」。\n画上，一个鸟嘴医生提着灯，站在陡峭的石阶上，玻璃眼睛红红的。') },
          { id: 'lClock', x: 13, y: 1, spr: 'wallclock', on: S => S.narr('九点四十二分。道格十点锁总闸。') },
          { id: 'lCounter', x: 2, y: 3, w: 3, spr: 'counter', col: '#3a2c22', on: S => dougTalk(S) },
          { id: 'doug', x: 3, y: 2, spr: '@doug', dir: 0, on: S => dougTalk(S) },
          { id: 'lManual', x: 6, y: 3, spr: 'desk', col: '#4a3626', async on(S) { if (S.once('manual')) await S.narr('导游休息桌上摊着莫拉格的导览手册，边角都翻毛了。'); await S.note('script'); } },
          { id: 'lCrate', x: 9, y: 3, spr: 'crate', on: S => S.narr('烛光导览的道具箱：一捆牛油蜡烛，几盒火柴，一盏铁皮提灯（坏了）。\n牛油蜡烛点起来有一股淡淡的羊油味。') },
          { id: 'lRack', x: 12, y: 3, spr: 'rack', on: S => rackOn(S) },
          { id: 'lBox', x: 14, y: 6, spr: 'basket', on: S => S.narr('一只大纸箱，写着「给安妮的玩具 · 每月整理」。\n里面是从安妮房间收上来的玩具，洗干净了，叠得整整齐齐。莫拉格说，攒多了就送去城里的儿童医院。') },
          { id: 'lBench', x: 2, y: 7, w: 2, spr: 'bench', on: S => S.narr('游客等候区的长椅。椅子底下滚着一颗玻璃弹珠。') },
          { id: 'morag', x: 10, y: 5, spr: '@morag', dir: 1, on: S => S.say('莫拉格', '快去快回。巷子坡陡，石头湿，别跑。') },
          { id: 'lStairs', x: 8, y: 9, spr: 'stairsdown', solid: false, async touch(S) { S.sfx('step'); await S.go('close', 9, 3, 0); } }
        ],
        async enter(S, first) { if (first) return opening(S); }
      },
      /* ---------------- 玛丽金巷（景点里的上半截） ---------------- */
      close: {
        amb: 'drone', dark: .52, plr: 3, wall: 'stone', floor: 'stone',
        legend: { G: 'gutter' },
        tileOpts: { woodC: '#5a4630' },
        rows: [
          '####################',
          '####################',
          '########kGGk########',
          '########kGGk########',
          '#wwwwww#kGGk#llllll#',
          '#wwwwww#kGGk#llllll#',
          '#wwwwwwwkGGkkllllll#',
          '#wwwwww#kGGk#llllll#',
          '#wwwwww#kGGk#llllll#',
          '########kGGk########',
          '########kGGk########',
          '########kGGk########',
          '#kkkkkk#kGGk#xxxxxx#',
          '#kkkkkk#kGGk#xxxxxx#',
          '#kkkkkkkkGGkkxxxxxx#',
          '#kkkkkk#kGGk#xxxxxx#',
          '#kkkkkk#kGGk#xxxxxx#',
          '########kGGk########',
          '########kGGk########',
          '#dddddd#kGGk########',
          '#ddddddkkGGk########',
          '#dddddd#kGGk########',
          '########kGGk########',
          '########kGGk########',
          '####################',
          '####################'],
        ents: [
          { id: 'cUp', x: 9, y: 2, w: 2, spr: 'stairsup', solid: false, touch: S => upStairs(S) },
          { id: 'cSign', x: 11, y: 1, spr: 'board', on: S => S.narr('铁牌子：「玛丽金巷 · 坡陡，请扶好扶手」。\n巷子中间那道石槽，是当年的排水沟——楼上的人家喊一声「gardyloo!」，就把脏水往下倒。') },
          { id: 'b1', x: 8, y: 4, spr: 'bulb', solid: false, z: 1, light: { r: 4, col: 'rgba(255,220,150,.12)' } },
          { id: 'b2', x: 11, y: 10, spr: 'bulb', solid: false, z: 1, light: { r: 4, col: 'rgba(255,220,150,.12)' } },
          { id: 'b3', x: 8, y: 17, spr: 'bulb', solid: false, z: 1, light: { r: 4, col: 'rgba(255,220,150,.12)' } },
          { id: 'b4', x: 11, y: 22, spr: 'bulb', solid: false, z: 1, light: { r: 3.5, col: 'rgba(255,220,150,.12)' } },
          { id: 'b5', x: 3, y: 7, spr: 'bulb', solid: false, z: 1, light: { r: 3.5, col: 'rgba(255,220,150,.1)' } },
          { id: 'b6', x: 15, y: 7, spr: 'bulb', solid: false, z: 1, light: { r: 3.5, col: 'rgba(255,220,150,.1)' } },
          { id: 'b7', x: 3, y: 15, spr: 'bulb', solid: false, z: 1, light: { r: 3.5, col: 'rgba(255,200,150,.12)' } },
          { id: 'b8', x: 16, y: 15, spr: 'bulb', solid: false, z: 1, light: { r: 3.5, col: 'rgba(200,220,255,.1)' } },
          { id: 'b9', x: 3, y: 21, spr: 'bulb', solid: false, z: 1, light: { r: 3, col: 'rgba(255,220,150,.1)' } },
          /* 一六四五年的一户人家 */
          { id: 'cEdict', x: 2, y: 3, spr: 'board', col: '#e8e4d8', async on(S) { if (S.once('edictB')) await S.narr('墙上一块展板，标题是「一六四五年，鼠疫」。'); await S.note('edict'); } },
          { id: 'cWinA', x: 5, y: 3, spr: 'fwin', flag: true, on: S => S.narr('复原的小窗，窗外挂着一块白布。\n讲解牌：「家里有人染上鼠疫，就要在窗外挂白旗。」') },
          { id: 'cBedA', x: 1, y: 5, h: 2, spr: 'bed', col: '#6a5a44', on: S => S.narr('复原的病床。草褥子上躺着一个蜡做的假人，盖着粗毯子，只露出一只灰白的手。\n讲解词里，这是「一六四五年的一户人家」。') },
          { id: 'cMq', x: 3, y: 5, spr: '@mq', dir: 1, on: S => S.narr('一个穿粗布裙的蜡像女人，跪在床边，手里攥着一块湿布。\n脸做得很逼真——累得连哭都忘了。') },
          { id: 'cBskA', x: 6, y: 5, spr: 'pbasket', on: S => S.narr('门边一只柳条篮子。讲解牌：「被隔离的人家，靠城里每天送饭过活。」') },
          /* 最后的住户 */
          { id: 'cBoardD', x: 13, y: 3, spr: 'board', on: S => S.narr('展板：「巷子里最后的住户，一直住到十九世纪末。墙纸、壁炉、窗帘，都是照原样复原的。」') },
          { id: 'cHearth', x: 15, y: 3, spr: 'hearth', on: S => S.narr('十九世纪的小壁炉，铸铁炉栅擦得发亮。炉膛里放着一盏假火苗的电灯。') },
          { id: 'cClock', x: 17, y: 3, spr: 'wallclock', on: S => S.narr('一只停了的座钟，指针停在三点。展签上写：「原物」。') },
          { id: 'cArm', x: 14, y: 5, spr: 'armchair', on: S => S.narr('一把磨得发亮的扶手椅。椅背上搭着一条手织的毯子。') },
          { id: 'cDresser', x: 17, y: 6, spr: 'dresser', on: S => S.narr('五斗柜上摆着一只缺了口的瓷狗。') },
          /* 安妮的房间 */
          { id: 'cAnnieB', x: 5, y: 11, spr: 'board', col: '#d8a0a0', on: S => S.narr('门口的小牌子：「安妮的房间」。\n底下一行小字：「请把给安妮的礼物放在这里。我们会定期整理，送给需要的孩子。」') },
          { id: 'pile', x: 2, y: 12, w: 2, spr: 'toypile', on: S => pileOn(S) },
          { id: 'cStool', x: 5, y: 13, spr: 'stool', on: S => S.narr('一把小木凳，凳面磨出了一个浅浅的坑。') },
          { id: 'anC', x: 5, y: 16, spr: '@annie', hidden: true, solid: false, dir: 1 },
          /* 鸟嘴医生的展柜 */
          { id: 'cBoardE', x: 17, y: 11, spr: 'board', on: S => S.narr('展板：「鸟嘴面具里塞满了香草，人们相信这样能挡住瘟疫的瘴气。」\n「这种装束在欧洲大陆更常见；据说爱丁堡的瘟疫医生也穿过类似的皮衣。」') },
          { id: 'cDoc', x: 15, y: 12, spr: 'docstand', on: S => S.narr(S.ent('cDoc').s.empty ? '展柜空了。玻璃门开着一条缝。\n木杖倒在地上，假人不见了。……空气里有一股薰衣草和丁香的味道。' : '展柜里立着一个鸟嘴医生的假人：黑袍、宽边帽、皮手套，手里一根长木杖——当年的医生用它拨开病人的被子，不用手碰。\n玻璃眼睛映着你的影子。') },
          { id: 'cHerbs', x: 14, y: 16, spr: 'herbs', on: S => S.narr('一小篮干香草：薰衣草、丁香、迷迭香。展签：「医生的鸟嘴里装的就是这些」。') },
          /* 牛栏 */
          { id: 'cBoardC', x: 3, y: 18, spr: 'board', on: S => S.narr('展板：「牛栏」。巷子里的人家，把牛养在房子最底下一层。') },
          { id: 'cCrate', x: 1, y: 19, spr: 'crate', on: S => S.narr('装干草的木箱。草早就烂成了灰。') },
          { id: 'cBarrel', x: 5, y: 19, spr: 'barrel', on: S => S.narr('一只盛水的木桶，桶箍锈穿了。桶后面是一条塌死的老地沟，\n一股死水泡烂草的臭味直往鼻子里钻。\n——走不通的地方，就是这个味儿。') },
          { id: 'cRat', x: 3, y: 21, spr: 'rat', decal: true },
          /* 巷子尽头 */
          { id: 'seal', x: 8, y: 23, w: 4, spr: 'seal', on: S => sealOn(S) },
          { id: 'torch', x: 8, y: 21, spr: 'flashlight', hidden: true, on: S => S.narr('莫拉格的手电筒，摔在砖墙跟前，灭了。玻璃罩裂了一道缝。\n你按了几下开关——没有反应。') },
          FL('flC')
        ],
        async enter(S, first) { if (first) return enterClose(S); },
        tick(S, dt) {
          const f = S.f, p = S.pl; if (f.phase !== 'dark' || S.busy) return;
          if (!f.thud && p.x >= 8 && p.x <= 11 && p.y >= 12 && p.y <= 15) {   // 路过展厅门口：假人倒了
            f.thud = 1; S.sfx('thud'); S.shake(200, 1); S.toast('右手边的展厅里「哐」的一声——有什么东西倒了。');
          }
          if (!f.gard && p.x >= 8 && p.x <= 11 && p.y >= 18) { f.gard = 1; S.run(gardyloo); }
        }
      },
      /* ---------------- 砖墙后面：封住的下半截巷子 ---------------- */
      under: {
        amb: 'drone', dark: .94, plr: 2.6, wall: 'stone', floor: 'dirt', fog: .06,
        legend: { S: 'steps' },
        rows: UR,
        ents: [
          { id: 'uIn', x: 14, y: 1, spr: 'invisible', solid: false, async touch(S) { await S.narr('身后的洞口……不见了。只有冰凉的砖。'); await S.walk('pl', 'd', 4); } },
          { id: 'uGraf', x: 13, y: 5, spr: 'invisible', on: S => S.narr('墙上用炭写着一行歪歪扭扭的字：\n「Lord have mercy upon us」——主啊，怜悯我们。') },
          { id: 'w1', x: 12, y: 6, spr: 'wisp', col: 'rot', decal: true, light: { r: .8, col: 'rgba(130,150,96,.1)' } },
          { id: 'w2', x: 6, y: 8, spr: 'wisp', col: 'rot', decal: true },
          { id: 'w3', x: 24, y: 13, spr: 'wisp', col: 'lav', decal: true, light: { r: .8, col: 'rgba(196,160,236,.12)' } },
          { id: 'w4', x: 24, y: 16, spr: 'wisp', col: 'lav', decal: true },
          { id: 'w5', x: 12, y: 14, spr: 'wisp', col: 'rot', decal: true, light: { r: .8, col: 'rgba(130,150,96,.1)' } },
          { id: 'w6', x: 16, y: 14, spr: 'wisp', col: 'lav', decal: true, light: { r: .8, col: 'rgba(196,160,236,.12)' } },
          { id: 'w7', x: 20, y: 14, spr: 'wisp', col: 'lav', decal: true },
          { id: 'w8', x: 6, y: 15, spr: 'wisp', col: 'rot', decal: true },
          { id: 'rub1', x: 6, y: 10, spr: 'rubble', on: S => S.narr('塌下来的石头和烂泥，把路堵得死死的。\n石缝里渗着水，一股烂草的臭味。') },
          { id: 'rub2', x: 6, y: 17, spr: 'rubble', on: S => S.narr('又是塌方。一只老鼠从石缝里钻出来，看了你一眼，又钻了回去。') },
          { id: 'uRat', x: 9, y: 6, spr: 'rat', decal: true },
          { id: 'uRat2', x: 19, y: 11, spr: 'rat', decal: true },
          { id: 'uGrate', x: 24, y: 19, spr: 'invisible', on: S => S.narr('岔道尽头是一道铁栅栏，栅栏外面黑洞洞的，一股薰衣草和硫磺的味道往外飘。') },
          { id: 'docU', x: 24, y: 19, spr: '@doc', hidden: true, solid: false, dir: 3 },
          /* 下面那条巷子 */
          { id: 'niche', x: 3, y: 23, spr: 'niche', on: S => nicheOn(S) },
          { id: 'sticks', x: 2, y: 24, spr: 'sticks', solid: false, on: S => sticksOn(S) },
          { id: 'hbell', x: 4, y: 25, spr: 'bellh', solid: false, on: async S => { bell(S, .05, 3); await S.narr('一只铜手铃，铃舌上缠着布条。\n送饭人每天早上摇着它，挨家挨户告诉屋里的人：篮子来了。\n……铃声在巷子里荡了很久。'); } },
          { id: 'dFish', x: 5, y: 23, spr: 'pdoor', mk: 'fish', bk: 'sticks', on: S => doorOn(S, 'dFish') },
          { id: 'wFish', x: 4, y: 23, spr: 'fwin', flag: true, lit: true, light: { r: 2.2, col: 'rgba(230,200,140,.12)' }, on: S => S.narr('窗户里透着一点昏黄的光。窗外挂着白布。\n屋里好像有人在小声念经。') },
          { id: 'dShoe', x: 10, y: 23, spr: 'pdoor', mk: 'shoe', boards: 1, bk: 'full', on: S => doorOn(S, 'dShoe') },
          { id: 'wShoe', x: 11, y: 23, spr: 'fwin', flag: true, on: S => S.narr('窗户黑着，窗外挂着白布，布上落满了灰。') },
          { id: 'dKey', x: 22, y: 23, spr: 'pdoor', mk: 'key', boards: 1, bk: 'empty', on: S => doorOn(S, 'dKey') },
          { id: 'wKey', x: 23, y: 23, spr: 'fwin', flag: true, on: S => S.narr('窗户黑着，窗外挂着白布。窗台上摆着一只空碗。') },
          { id: 'dWheat', x: 6, y: 29, spr: 'pdoor', mk: 'wheat', on: S => doorOn(S, 'dWheat') },
          { id: 'wWheat', x: 7, y: 29, spr: 'fwin', on: S => S.narr('窗户黑着。窗外什么也没挂。') },
          { id: 'dBird', x: 13, y: 29, spr: 'pdoor', mk: 'bird', boards: 1, bk: 'empty', on: S => doorOn(S, 'dBird') },
          { id: 'wBird', x: 12, y: 29, spr: 'fwin', flag: true, lit: true, light: { r: 1.8, col: 'rgba(200,210,230,.12)' }, on: S => S.narr('窗户里有一点发青的光，像月光。窗外挂着白布。\n窗台上，用炭笔画着一只小鸟。') },
          { id: 'dCross', x: 20, y: 29, spr: 'pdoor', mk: 'cross', boards: 1, bk: 'full', on: S => doorOn(S, 'dCross') },
          { id: 'wCross', x: 21, y: 29, spr: 'fwin', flag: true, on: S => S.narr('窗户黑着，窗外挂着白布。') },
          { id: 'uRat3', x: 17, y: 31, spr: 'rat', decal: true },
          { id: 'lan1', x: 16, y: 23, spr: 'lantern', light: { r: 3, col: 'rgba(220,230,170,.12)', flick: true }, on: S => S.narr('墙上挂着一盏油灯，火苗是发绿的，一点热气也没有。') },
          { id: 'lan2', x: 9, y: 29, spr: 'lantern', light: { r: 3, col: 'rgba(220,230,170,.12)', flick: true }, on: S => S.narr('一盏油灯。灯油早就干了，可它还亮着。') },
          { id: 'lan3', x: 24, y: 29, spr: 'lantern', light: { r: 3, col: 'rgba(220,230,170,.12)', flick: true }, on: S => S.narr('油灯底下的墙上，有人用指甲刻了一道一道的印子，一共四十道。') },
          { id: 'docL', x: 28, y: 24, spr: '@doc', hidden: true, solid: false, dir: 1 },
          FL('flU')
        ],
        async enter(S, first) { if (first) return enterMaze(S); },
        tick(S, dt) { mazeTick(S, dt); }
      },
      /* ---------------- 安妮的家 ---------------- */
      house: {
        amb: 'none', dark: .72, plr: 2.2, wall: 'mud', floor: 'darkwood',
        rows: [
          '############',
          '############',
          '#WWWWWWWWWW#',
          '#WWWWWWWWWW#',
          '#WWWWWWWWWW#',
          '#WWWWWWWWWW#',
          '#WWWWWWWWWW#',
          '######W#####'],
        ents: [
          { id: 'hOut', x: 6, y: 7, spr: 'invisible', solid: false, async touch(S) { await S.narr('门外是那条巷子……还有那股薰衣草的味道。\n你不能把安妮一个人留在这儿。'); await S.walk('pl', 'u', 4); } },
          { id: 'hWin', x: 4, y: 1, spr: 'fwin', flag: true, lit: true, light: { r: 2.6, col: 'rgba(190,205,235,.16)' }, on: S => S.narr('窗外挂着白布。月光从布后面透进来，把屋子照得发青。') },
          { id: 'hHearth', x: 8, y: 1, spr: 'hearth', on: S => S.narr('冷透的炉灰。炉台上放着一把削签子用的小刀，刀柄是牛角的。\n刀放得很高——小孩子够不着。') },
          { id: 'hBed', x: 1, y: 2, w: 2, h: 2, spr: 'boxbed', on: S => S.narr('粗毛毯底下是一个人的形状。你没有掀开它。\n毯子边上露出一绺头发，和安妮的一样，是浅棕色的。') },
          { id: 'hBasket', x: 4, y: 2, spr: 'pbasket', rope: 1, on: S => basketOn(S) },
          { id: 'hStool', x: 7, y: 3, spr: 'stool', on: S => S.narr('一把小木凳。凳腿上刻着一道一道的印子，像是有人在量个子。') },
          { id: 'annie', x: 3, y: 3, spr: '@annie', dir: 1, solid: true, on: S => annieOn(S) },
          { id: 'moragH', x: 9, y: 2, spr: 'slump', on: S => S.narr('莫拉格靠着墙，睡得很沉。你摇了摇她——\n她皱了皱眉，嘴里嘟囔着：「……别……别吹蜡烛……」') },
          { id: 'docH', x: 6, y: 7, spr: '@doc', hidden: true, solid: false, dir: 3 },
          FL('flH')
        ],
        async enter(S, first) { if (first) return enterHouse(S); }
      }
    }
  });

  /* ================= 地面 ================= */
  async function opening(S) {
    S.f.phase = 'lobby';
    await S.narr('晚上九点四十，最后一组夜场游客刚走。\n外面下着雨，你还穿着导游的十七世纪戏服：粗布长裙，围裙，头发盘在帽子底下。');
    S.face('morag', 'pl');
    await S.say('莫拉格', ['辛苦了，遥。第一次带夜场，讲得不错——就是讲到鼠疫那段，你自己脸都白了。', '给，今晚最后一件事。']);
    S.give('rabbit');
    await S.narr('她递给你一只毛线织的小兔子，一只耳朵长，一只耳朵短，脖子上系着一根红毛线。');
    await S.say('莫拉格', ['刚才那组里有个小姑娘，七八岁，走的时候塞给我的。她说：「请交给安妮。」', '规矩是当天送下去，放到安妮房间的玩具堆上。']);
    const r = await S.ask('莫拉格看着你。', ['……安妮真的在下面吗？', '好，我这就去。'], '遥');
    if (r === 0) await S.say('莫拉格', ['我在这儿干了十一年，一次也没见过她。', '可是每天早上，那堆玩具总有几个换了地方。……你就当是清洁工手重吧。']);
    await S.say('莫拉格', ['我先下去巡最后一遍，把各间屋的灯关了。你放好兔子就上来，咱们锁门。', '对了——带根蜡烛。下面的电线是七十年代拉的，三天两头跳闸。']);
    S.give('candle');
    await S.narr('她从道具箱里摸出一根牛油蜡烛和一盒火柴，塞进你围裙的口袋。');
    await S.say('莫拉格', '巷子坡陡，石头湿。别跑。');
    await S.walk('morag', [8, 8], 4);
    S.hide('morag');
    S.sfx('step');
    S.goal('把毛线小兔送到楼下巷子里的「安妮的房间」');
  }
  async function dougTalk(S) {
    S.face('doug', 'pl');
    if (S.once('doug1')) {
      await S.say('道格', ['又是给安妮的玩具？上个礼拜有人送了一整套乐高。', '我在这儿值了六年夜班。监控里什么都没拍到过。', '……就是有几回，早上来一看，安妮房间那堆玩具，全都转了个方向。']);
      await S.say('道格', ['你知道「gardyloo」吧？以前老城的人从楼上往街上倒脏水，倒之前先喊一声。', '你在巷子里要是听见有人喊这个——赶紧往边上躲。', '开玩笑的。……大概是开玩笑的。']);
      return;
    }
    await S.say('道格', cyc(S, '_dg', [
      ['外面的人说，当年鼠疫，市里把整条巷子连人带房封死了。', '手册上说那是瞎传的。我也希望是瞎传的。'],
      ['有本三百多年前的书，说住在巷子里的一对夫妻，半夜看见一颗老头的脑袋飘在半空，冲他们笑。', '后来还看见一个小孩，一条狗……他们第二天就搬走了。'],
      '早点上来。我十点锁总闸。'
    ]));
  }
  async function rackOn(S) {
    await S.narr('导游的戏服架上挂着一套鸟嘴医生的行头：黑色蜡布长袍、宽边帽，还有一只皮面具，嘴巴是又长又弯的鸟喙。');
    if (S.once('rack')) {
      await S.narr('你把鼻子凑近那只鸟嘴——里面塞着干花。\n薰衣草、丁香、迷迭香……又香又呛，呛得你直想打喷嚏。');
      await S.think('莫拉格讲过：当年的人相信瘟疫是从「坏空气」里来的，医生就往鸟嘴里塞香草。\n……这股味道，闻过一次就忘不掉。');
    }
  }
  async function upStairs(S) {
    if (S.f.phase === 'lit') { await S.narr('兔子还没送下去呢。安妮的房间在坡下左手边。'); return S.walk('pl', 'd', 4); }
    S.sfx('locked');
    await S.narr('楼梯顶上的铁门推不开，像是从外面卡住了。\n你喊了两声道格——没有人应。');
    return S.walk('pl', 'd', 4);
  }

  /* ================= 景点里的巷子 ================= */
  async function enterClose(S) {
    S.f.phase = 'lit';
    await S.narr('楼梯尽头，空气一下子凉了下来。\n你站在一条又窄又陡的石头巷子顶上。头顶不是天，是两百多年前压下来的大楼地基。');
    await S.narr('两边的老房子只剩下最底下的一两层，门洞黑黑的。巷子中间一道石槽，一路往坡下去。\n灯泡一盏一盏挂在墙上，嗡嗡地响。');
    await S.think('安妮的房间……莫拉格说过，在坡下左手边的第二间。');
    S.goal('把毛线小兔放到「安妮的房间」（坡下左手边第二间）');
  }
  async function pileOn(S) {
    const P = S.ent('pile');
    if (S.f.phase !== 'lit') return S.narr(P.s.wall ? '玩具全都转过去了，脸朝着墙。\n只有你刚才放上去的地方，空着。' : '玩具堆。小熊、布娃娃、玩具车……一层压着一层。');
    await S.narr('房间角落里，玩具堆得快到膝盖那么高了。\n小熊、布娃娃、玩具车、一盒蜡笔……有的新得还带着标签，有的已经褪了色。\n每一个，都是有人从世界上某个地方带来，留给一个从来没见过的小女孩的。');
    const r = await S.ask('把毛线小兔放上去吗？', ['放上去', '先看看别处']);
    if (r) return;
    return cutEvent(S);
  }
  async function cutEvent(S) {
    const P = S.ent('pile');
    S.take('rabbit'); P.s.rab = 1; S.sfx('select');
    await S.narr('你把小兔子放在最上面，让它脸朝着门口坐好。\n「安妮，这是给你的。」');
    for (let i = 1; i <= 9; i++) S.ent('b' + i).flicker = true;
    S.sfx('switch'); await S.wait(900);
    for (let i = 1; i <= 9; i++) { const b = S.ent('b' + i); b.flicker = false; b.off = true; }
    S.dark(.97); S.amb('none'); S.shake(200, 1);
    await S.narr('啪。\n所有的灯，一下子全灭了。');
    await S.think('……别慌。蜡烛。');
    S.sfx('match'); await S.wait(500);
    flameOn(S, true); S.plr(2.6); S.dark(.92);
    await S.narr('火柴「嚓」地亮了。牛油蜡烛的火苗跳了两下，稳住了。\n一小圈黄光，刚刚够照亮你的手。');
    P.s.wall = 1; P.s.rab = 0;
    await S.narr('你举起蜡烛——\n玩具堆上的每一个玩具，小熊、娃娃、兔子……全都转过去了，脸朝着墙。');
    giggle(S, .035);
    const A = S.ent('anC'); A.alpha = 0; S.show('anC'); S.face('anC', 'pl');
    await S.alpha('anC', .8, 900);
    await S.narr('墙角蹲着一个小女孩。白色的亚麻小帽，灰布裙子，光着脚。\n她背对着你，在一个一个地数玩具。');
    await S.say('小女孩', ['这屋里就我和妈妈两个人。', '……你看见莉兹了吗？她被拿走了。'], { style: 'whisper' });
    S.toast('（她说的话，你记下了）');
    S.face('anC', 'pl');
    await S.scare('face', { spr: '@annie', face: 'annie' });
    S.hide('anC');
    await S.narr('她回过头来的那一下，你看见了她的眼睛——\n然后，墙角就空了。');
    S.give('rabbit', true);
    await S.narr('毛线小兔掉在你脚边，不知道什么时候，被人从玩具堆上拿了下来。\n你把它捡起来。它浑身冰凉。');
    S.toast('毛线小兔又回到了你手里');
    S.ent('cDoc').s.empty = 1; S.show('torch');
    S.ent('seal').s.gap = 1; S.f.gap = 1;
    S.amb('drone');
    S.sfx('whisper');
    await S.say('莫拉格（很远）', ['……遥？……遥！', '砖墙后面……还有一条巷子……别——'], { style: 'whisper' });
    await S.narr('声音是从巷子坡底传来的。闷闷的，像隔着一堵墙。');
    S.f.phase = 'dark';
    S.goal('莫拉格的声音从坡底的砖墙后面传来——去找她');
    S.cp('dark');
  }
  async function gardyloo(S) {   // 头顶上有人喊了一声——老城倒脏水之前的那一嗓子
    S.tone('sawtooth', 330, 220, .7, .03, 0, 1100); S.tone('sawtooth', 262, 196, .9, .025, .5, 1000);
    await S.say('头顶上，一个女人的声音', 'Gardyloo——！', { style: 'big' });
    S.sfx('splash'); S.shake(250, 1);
    await S.narr('哗啦一声，石槽里的水猛地晃了一下，溅湿了你的裙角。\n你抬起头。头顶只有大楼的地基，黑漆漆的，一扇窗户也没有。');
    await S.think('……道格说那是开玩笑的。');
  }
  async function sealOn(S) {
    const e = S.ent('seal');
    if (!e.s.gap) return S.narr('巷子的尽头是一堵砖墙。砖缝里抹着十八世纪的灰浆——再往下的半截巷子，盖大楼的时候封死了。\n墙前面拦着一根红绳：「游客止步」。');
    if (S.once('gap1')) {
      await S.narr('砖墙塌开了一个洞，刚好容一个人弯腰钻进去。\n洞里黑得什么也看不见，一股冷风往里抽。');
      await S.think('火苗朝洞里歪过去了。\n……风往里头抽。下面是通的。');
      giggle(S, .02);
      await S.say('洞里，小女孩的声音', '妈妈睡着以后，篮子都是我去门口拿的。可重了。', { style: 'whisper' });
      S.toast('（她说的话，你记下了）');
    }
    const r = await S.ask('钻进砖墙的洞里？', ['钻进去', '再等等']);
    if (r) return;
    await S.go('under', 14, 1, 0);
  }

  /* ================= 迷巷 ================= */
  async function enterMaze(S) {
    S.f.phase = 'mazeIn'; flameOn(S, true);
    await S.narr('砖墙后面，是另一条巷子。\n没有灯，没有展板，没有扶手。石头上长着一层滑腻腻的青苔，空气又冷又沉，像在井底。');
    await S.narr('巷子在前面分成好几岔，黑得像一张张张开的嘴。\n你低头看了看蜡烛——已经烧掉了一小截。');
    await S.think('莫拉格手册上写的（笺里能翻到）：火苗往哪边歪，哪边就通着。\n闻到薰衣草和丁香——是鸟嘴医生，别往那边去。闻到死水和烂草——死路。\n还有……别跑。跑起来风大，蜡烛烧得更快。');
    S.goal('跟着火苗走；薰衣草＝他，死水＝死路（一人盯火苗，一人念笺）');
    S.f.phase = 'maze'; S.f.candleT = CANDLE;
    S.cp('maze');
    startCandle(S, CANDLE);
  }
  async function laneEnter(S) {
    MEMW = 0; S.plr(1.9); S.dark(.8);
    await S.narr('窄缝的尽头……你侧着身子挤了出去。\n眼前又是一条巷子，和上面那条一模一样——只是这里的房子没有被拆。');
    await S.narr('窗户里透着昏黄的光。家家窗外都挂着一块白布，在没有风的地方，轻轻地摆。\n每扇门前，都放着一只篮子。');
    await S.think('……这是一六四五年的巷子。');
    giggle(S, .02); hum(S, .02);
    await S.say('巷子深处，小女孩的声音', ['妈妈最后一次往篮子里放签，只放了一根。她说，这根是你的。', '后来签用完了。我不会削——妈妈不让我碰刀。'], { style: 'whisper' });
    await S.think('她说的每一句话，我都记着。');
    await S.note('words');
    S.f.phase = 'lane'; S.f.wrong = 0;
    S.goal('找到安妮的家（一人念笺：账本、告示、安妮的话；一人看门）');
    S.cp('lane');
  }
  async function nicheOn(S) {
    if (S.once('niche')) await S.narr('墙上凿出一个小龛，里面放着一盏熄了的油灯，和一本油乎乎的账簿。');
    await S.note('ledger');
    if (S.f.phase !== 'lane') return;
    S.f.nicheN = (S.f.nicheN || 0) + 1;
    const lv = Math.min(4, Math.max(S.f.nicheN, MEMW + 1));
    if (lv < 2) return;
    await S.think(lv === 2 ? '一根签，一个活人。安妮说她家是两个人——先找开头是两根签的人家。'
      : lv === 3 ? '开头两根签的：十字门、小鸟门。\n安妮说篮子都是她去拿的，最后签用完了——哪一家「未取」，哪一家「空篮无签」？'
      : '……是下层巷子里，那扇画着小鸟的门。');
  }
  async function sticksOn(S) {
    const e = S.ent('sticks');
    if (e.s.taken) return S.narr('墙根下的麻绳空了。');
    await S.narr('墙根下一捆削好的白木签，用麻绳扎着。\n是送饭人备着的？还是哪家没来得及用上的？每一根都削得很仔细。');
    const r = await S.ask('抽一根带上？', ['抽一根', '不碰它']);
    if (r) return;
    e.s.taken = 1; S.give('stick');
  }

  /* ================= 安妮的家 ================= */
  async function enterHouse(S) {
    S.f.phase = 'houseIn'; flameOn(S, true); S.plr(1.9);
    await S.narr('屋里很小。壁炉是冷的，窗外挂着一块白布。\n墙角靠着一个人——是莫拉格。她闭着眼睛，呼吸很轻，像是睡着了。');
    S.face('annie', 'pl');
    await S.narr('床边坐着那个小女孩。床上盖着一条粗毛毯，毯子底下是一个人的形状，一动不动。');
    await S.say('安妮', ['你找到我家了。', '嘘——别吵醒妈妈。她睡了好久好久了。']);
    await S.say('安妮', ['那天篮子里没有签了。我就把莉兹放进去。莉兹是妈妈给我缝的布娃娃。', '这样外面的人就知道，屋里还有人。', '……可他们把莉兹拿走了。然后就有人在外面钉门。叮，叮，叮。']);
    steps(S, 3, .06); await S.wait(900); sniff(S, .025);
    S.toast('门缝底下，渗进来一股薰衣草和丁香的味道。');
    S.sfx('knock'); await S.wait(400); S.sfx('knock');
    await S.say('门外', '……屋里，还有人吗？', { style: 'whisper' });
    await S.say('安妮', ['是他。他用鼻子闻。闻到了，就要进来熏屋子，把东西都烧掉。', '你的蜡烛……光从门缝里漏出去了。', '吹了吧。黑了，他就以为没有人。我们躲着，像我和妈妈那样。'], { style: 'whisper' });
    S.f.phase = 'house';
    S.goal('把带来的东西给安妮——或者照她说的，吹熄蜡烛');
    S.cp('house');
  }
  async function basketOn(S) {
    if (S.f.stickIn) return S.narr('篮子已经顺着绳子放到窗外去了。篮底躺着一根白木签。');
    await S.narr('窗台底下一只空篮子，篮底一根签也没有。\n篮子把手上系着一根绳，绳子从窗缝里垂到外面去。');
    if (S.f.phase !== 'house' || !S.has('stick')) return;
    const r = await S.ask('把木签放进篮子，顺着绳子放到窗外去？', ['放进去', '先不']);
    if (r) return;
    return putStick(S);
  }
  async function putStick(S) {
    S.take('stick'); S.f.stickIn = 1; S.ent('hBasket').s.st = 1;
    await S.narr('你把那根白木签放进篮底，顺着绳子，把篮子慢慢放到了窗外。\n绳子一松——篮子落地了。');
    await S.narr('门外的脚步声，停住了。');
    await S.think('一根签，一个活人。');
  }
  async function annieOn(S) {
    if (S.f.phase !== 'house') return;
    S.face('annie', 'pl');
    const r = await S.ask('安妮抱着膝盖，看着你手里的蜡烛。', ['把毛线小兔给她', '照她说的，吹熄蜡烛', '（再想想）'], '遥');
    if (r === 2) return S.say('安妮', '他还在外面。你听。', { style: 'whisper' });
    if (r === 1) {
      await S.narr('墙角的莫拉格在梦里皱紧了眉头：「……别……」');
      const c = await S.ask('真的要吹熄蜡烛吗？', ['吹熄它', '不吹了'], '遥');
      if (c) return S.say('安妮', '……那你就别让他闻到你。', { style: 'whisper' });
      return blowOut(S);
    }
    if (S.has('stick') && !S.f.stickIn) {
      await S.think('……窗台底下那只篮子，还空着。我口袋里有一根签。');
      const c = await S.ask('先把木签放进篮子吗？', ['先放签', '直接把兔子给她'], '遥');
      if (c === 0) await putStick(S);
    }
    return giveToy(S);
  }
  async function blowOut(S) {
    S.f.phase = 'end';
    await S.narr('你低下头，对着火苗，轻轻吹了一口气。');
    breathOut(S); flameOn(S, false); S.plr(.2); S.dark(.99);
    await S.narr('火苗歪了一下——灭了。');
    await S.say('安妮', '……好了。现在没有光了。', { style: 'whisper' });
    sniff(S, .03); await S.wait(600);
    await S.say('门外', '没有光。没有签。\n……屋里无人生还。', { style: 'whisper' });
    nails(S, 3);
    await S.narr('叮。叮。叮。\n钉子一根一根钉进门板。');
    await S.scare('face', { spr: '@annie', face: 'annie' });
    await S.narr('黑暗里，一只冰凉的小手握住了你的手。\n「你陪我。」她说，「像妈妈那样。」');
    await S.fade(1, 1500);
    await S.end({ bad: true, id: 'candle', title: '无人生还', text: '第二天早上，道格在安妮的房间里找到了莫拉格。她靠着那堆玩具睡着了，什么都不记得。\n砖墙好好的，一块砖都没有松。\n\n警察找了一个礼拜。后来，夜场的导游说，讲到安妮的时候，那间小屋里偶尔会多出一个声音，跟着大家一起轻轻地数：\n「一个，两个……」\n\n在一六四五年的规矩里，黑着灯、篮子里没有签的屋子——就是没有活人了。' });
  }
  async function giveToy(S) {
    S.f.phase = 'end';
    S.take('rabbit');
    await S.narr('你蹲下来，把毛线小兔递给她。');
    await S.say('遥', ['这是今天一个小姑娘留给你的。她跟你差不多大。', '她说：「请交给安妮。」']);
    await S.narr('安妮没有马上接。她看了很久，伸出一根手指，碰了碰兔子那只长耳朵。');
    await S.say('安妮', ['它不是莉兹。', '……它一只耳朵长，一只耳朵短。', '它是新的。是给我的。']);
    const A = S.ent('annie'); A.spr = '@annie_r';
    S.sfx('chime');
    await S.narr('她把兔子抱进怀里，下巴抵着它的脑袋。\n你第一次看见她笑。');
    hum(S);
    await S.say('安妮', 'Baloo, baloo, my wee wee thing……\n（睡吧，睡吧，我的小东西……）', { style: 'whisper' });
    if (S.f.stickIn) return trueEnd(S);
    return goodEnd(S);
  }
  async function goodEnd(S) {
    steps(S, 3, .04);
    await S.narr('门外的脚步声停了一会儿，慢慢地走远了。\n薰衣草的味道，淡了下去。');
    await S.say('安妮', ['我困了。我要挨着妈妈睡。', '你回去吧。蜡烛别灭——路上黑。']);
    await S.narr('她爬上那张木箱床，挨着毯子底下那个一动不动的形状躺下，把兔子搂在胸口。\n闭眼之前，她又看了你一眼。');
    await S.alpha('annie', 0, 1600);
    await S.fade(1, 1400);
    await S.card('', '晚上十点零七分', '……\n\n有人在拍你的脸。\n「遥？遥！醒醒——」');
    await S.end({ id: 'toy', title: '第二十二夜　完', text: '你和莫拉格是在安妮的房间里醒过来的。头顶的灯全亮着，砖墙好好的，一块砖都没松。莫拉格说，她只记得自己下楼关灯，然后闻到一股薰衣草的味道。\n\n玩具堆上，所有的玩具都转回来了，脸朝着门口。\n最上面坐着那只毛线小兔，一只耳朵长，一只耳朵短。\n\n莫拉格看了它很久，说：「这一只，咱们就留在这儿吧。不收了。」\n\n只有一件事，你没跟任何人说：那间屋子窗台底下的篮子，一直是空的。' });
  }
  async function trueEnd(S) {
    bell(S, .05, 3);
    await S.narr('窗外响起了铃声。\n是送饭人的铜手铃，一下，一下，就在门口。');
    await S.say('门外', ['……一根签。', '这屋里，还有一个人。'], { style: 'whisper' });
    S.sfx('thud'); await S.wait(500); S.sfx('thud'); await S.wait(500); S.sfx('open');
    S.dark(.35); S.toast('门板上的木条，一根一根被撬了下来。');
    const D = S.ent('docH'); D.alpha = 0; S.show('docH'); S.face('docH', 'pl');
    await S.alpha('docH', 1, 900);
    await S.narr('门开了。门口站着那个穿黑袍的人。\n他抬起手，摘下了鸟嘴面具。');
    D.spr = '@docman';
    await S.narr('面具底下是一张年轻的脸，熬得发青，眼睛又红又肿。');
    await S.say('戴面具的人', ['我数错了。', '那天篮子里没有签，只有一个布缝的小人。我不认字……我以为那是死人留下的东西。', '……我在这条巷子里找你，找了三百六十年。']);
    await S.narr('他从黑袍里掏出一个布娃娃。一角烧焦了，脸上的针线还在。');
    await S.say('安妮', '莉兹！');
    await S.narr('安妮一只手抱着兔子，一只手抱着莉兹，站在门口的光里。\n外面的巷子亮了——不是灯，是早晨。一六四五年的早晨。');
    await S.say('安妮', ['妈妈说过，会有人来开门的。', '……谢谢你的兔子。'], { style: 'whisper' });
    await S.narr('她回头看了一眼那张床，然后牵起那个年轻人的手，走进了光里。');
    await S.alpha('annie', 0, 1500); S.hide('docH');
    await S.fade(1, 1500);
    await S.card('', '第二天', '……');
    await S.end({ id: 'home', title: '第二十二夜　完', text: '你和莫拉格是在安妮的房间里醒过来的。灯全亮着，砖墙好好的。\n\n第二天的夜场，有游客说，那间小屋里有股好闻的味道——不是薰衣草，是刚烤好的燕麦饼。\n\n玩具堆最上面，那只毛线小兔旁边，多了一个旧布娃娃，烧焦了一角。谁也说不清它是从哪儿来的。\n莫拉格把它登记进册子，在「来源」一栏里写了两个字：\n「送还。」' });
  }

  /* ---------------- 人物外观小工具 ---------------- */
  function coif(rab) {   // 白亚麻小帽；rab = 怀里抱着毛线小兔
    return function (g, d, fr, G, R) {
      const C = '#eeeae0';
      if (d === 0) { R(3, G.hT - 1, 10, 3, C); R(3, G.hT + 2, 1, 5, C); R(12, G.hT + 2, 1, 5, C); R(6, G.hT + 8, 4, 1, '#d8d4c8'); }
      else if (d === 3) R(3, G.hT - 1, 10, 8, C);
      else { R(4, G.hT - 1, 9, 3, C); R(10, G.hT + 2, 3, 5, C); }
      if (rab && d !== 3) { R(5, G.tT + 2, 6, 5, '#efe8dc'); R(5, G.tT - 1, 2, 3, '#efe8dc'); R(9, G.tT, 2, 2, '#efe8dc'); R(5, G.tT + 4, 6, 1, '#c82a2a'); }
    };
  }
  function beak(mask) {   // 宽边帽；mask = 戴着鸟嘴面具（否则拿在手里）
    return function (g, d, fr, G, R) {
      const H = '#0c0a08';
      if (d === 0) {
        R(4, 0, 8, 2, H); R(1, 2, 14, 1, H);
        if (mask) { R(4, 3, 8, 6, '#3a2c22'); R(5, 4, 2, 2, '#c83a2a'); R(9, 4, 2, 2, '#c83a2a'); R(5, 4, 1, 1, '#ffb090'); R(9, 4, 1, 1, '#ffb090'); R(7, 7, 2, 6, '#d6c9ab'); R(7, 13, 1, 2, '#c8b898'); }
        else { R(11, G.tT + 4, 3, 2, '#3a2c22'); R(12, G.tT + 6, 1, 4, '#d6c9ab'); }
      } else if (d === 3) { R(4, 0, 8, 2, H); R(1, 2, 14, 1, H); R(4, 3, 8, 4, '#161412'); }
      else {
        R(5, 0, 7, 2, H); R(1, 2, 13, 1, H);
        if (mask) { R(4, 3, 7, 6, '#3a2c22'); R(5, 4, 2, 2, '#c83a2a'); R(5, 4, 1, 1, '#ffb090'); R(0, 6, 5, 2, '#d6c9ab'); R(0, 8, 3, 1, '#c8b898'); }
      }
    };
  }
})();
