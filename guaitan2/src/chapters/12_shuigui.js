/* ================= 第十二夜 · 水鬼找替身 ================= */
(() => {
  const RED = '#c8202a', WET = '#8ab8b0', HB = '#a8141c';

  /* ---------------- 回龙湾：水往东流（左 → 右） ---------------- */
  const RIVER_ROWS = [
    'PPPPPPPPPPPPPPPPPPPPPPPPPPPPPP',
    'PTTeeeTTPPTTTeeeeTTTPPTTTeeeTP',
    '~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~',
    '~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~',
    '~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~',
    '~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~',
    '~~~~~~~~~~DD~~~~~~~~~~~~~~~~~~',
    '~~~~~~~~~~DD~~~~~~SS~~~~~~~~~~',
    '~~~~X~~~~~DD~~~~~~SS~~~eeeueee',
    '"ddddddddd,,dddddd,,d""eeeueee',
    'Td""""dddd,,d""""""dd""eeeueeT',
    'dddddddddddddddddddddddddduddT',
    'T""B""""""""""dddd"""""B""""TT',
    'TTT"""""""""""dddd""""""""""TT',
    'TTTTTTTTTTTTTTddddTTTTTTTTTTTT',
    'TTTTTTTTTTTTTTddddTTTTTTTTTTTT'];
  const RW = RIVER_ROWS[0].length, RH = RIVER_ROWS.length;
  const RLEG = { D: 'pier', S: 'jie', X: 'xiyi' };
  const ch_ = (x, y) => (y >= 0 && y < RH && x >= 0 && x < RW) ? RIVER_ROWS[y][x] : 'T';
  const WATER = (x, y) => ch_(x, y) === '~';
  const WALK = (x, y) => 'dDSXu,"'.includes(ch_(x, y));
  const N4 = [[0, 1], [1, 0], [-1, 0], [0, -1]];
  /* 岸边格：能走、且挨着水的格子——水里那东西够得着 */
  const EDGE = new Set();
  for (let y = 0; y < RH; y++) for (let x = 0; x < RW; x++) if (WALK(x, y) && N4.some(([a, b]) => WATER(x + a, y + b))) EDGE.add(x + ',' + y);
  const onEdge = (x, y) => EDGE.has(x + ',' + y);
  /* 水里的寻路（只走水格） */
  function waterStep(sx, sy, tx, ty) {
    if (sx === tx && sy === ty) return null;
    const prev = new Map(), q = [[sx, sy]]; prev.set(sx + ',' + sy, null);
    while (q.length) {
      const [x, y] = q.shift();
      if (x === tx && y === ty) { let k = x + ',' + y, p = prev.get(k); while (p && p !== sx + ',' + sy) { k = p; p = prev.get(k); } return k.split(',').map(Number); }
      for (const [a, b] of N4) { const nx = x + a, ny = y + b, k = nx + ',' + ny; if (!WATER(nx, ny) || prev.has(k)) continue; prev.set(k, x + ',' + y); q.push([nx, ny]); }
    }
    return null;
  }
  /* 离玩家最近的水格 */
  function laneCell(px, py) {
    let best = null, bd = 1e9;
    for (let y = 2; y < RH; y++) for (let x = Math.max(0, px - 8); x <= Math.min(RW - 1, px + 8); x++) if (WATER(x, y)) { const d = Math.abs(x - px) + Math.abs(y - py) * 1.2; if (d < bd) { bd = d; best = [x, y]; } }
    return best;
  }
  /* 从 (x,y) 出发，最近的「不挨水」的岸上格 */
  function safeCell(x, y) {
    const seen = new Set([x + ',' + y]), q = [[x, y]];
    while (q.length) {
      const [cx, cy] = q.shift();
      if (WALK(cx, cy) && !onEdge(cx, cy)) return [cx, cy];
      for (const [a, b] of N4) { const nx = cx + a, ny = cy + b, k = nx + ',' + ny; if (seen.has(k) || !WALK(nx, ny)) continue; seen.add(k); q.push([nx, ny]); }
    }
    return [x, Math.min(RH - 1, y + 2)];
  }

  /* ---------------- 合成声音（双方都听得见） ---------------- */
  function callTone(S, v = 1) {   // 拖长了调子的「禾——禾——」
    S.tone('sine', 640, 600, .55, .05 * v, 0, 1800); S.tone('sine', 600, 430, .9, .05 * v, .6, 1500);
    S.tone('triangle', 320, 300, .55, .012 * v, 0, 900); S.tone('triangle', 300, 215, .9, .012 * v, .6, 900);
  }
  function gurgle(S, v = 1) { for (let i = 0; i < 6; i++) { const f = 120 + Math.random() * 140; S.tone('sine', f, f * .55, .12, .06 * v, i * .09 + Math.random() * .04, 600); } }
  function drum(S, v = 1, d = 0) { S.tone('sine', 110, 46, .32, .16 * v, d, 420); S.tone('triangle', 72, 40, .25, .05 * v, d, 300); }
  function gong(S, v = 1, d = 0) { S.tone('triangle', 330, 312, 1.4, .05 * v, d, 2400); S.tone('square', 165, 160, .9, .012 * v, d, 900); S.tone('sine', 662, 640, .7, .015 * v, d, 3000); }
  function skips(S, n) {   // 打水漂：一下比一下快、一下比一下轻
    let d = 0, gap = .3;
    for (let i = 0; i < n; i++) { S.tone('triangle', 1100 + i * 70, 880 + i * 60, .06, .06 * (1 - i / (n + 3)), d, 3200); S.tone('sine', 320, 190, .05, .02, d, 800); d += gap; gap *= .84; }
    S.tone('sine', 230, 110, .35, .05, d + .05, 600);
  }
  function cry(S, v) { S.tone('sawtooth', 900, 820, .35, .022 * v, 0, 2200); S.tone('sawtooth', 820, 680, .55, .022 * v, .4, 2000); }
  function slap(S, v) { S.tone('square', 260, 110, .05, .03 * v, 0, 900); S.tone('square', 240, 100, .05, .024 * v, .24, 900); }

  /* ---------------- 人物 ---------------- */
  function chunX(alive) {
    return function (g, d, fr, G, R) {
      const h = G.hT;
      if (d !== 3) { R(3, h + 2, 10, 1, HB); if (d === 0) { R(12, h + 3, 2, 1, HB); R(13, h + 4, 1, 2, HB); } else R(10, h + 3, 2, 2, HB); }
      else { R(3, h + 2, 10, 1, HB); R(7, h + 3, 2, 3, HB); }
      if (!alive) {
        if (d === 0) { R(5, h + 3, 1, 4, '#080c0e'); R(10, h + 3, 1, 5, '#080c0e'); R(7, h + 3, 1, 2, '#080c0e'); R(6, h + 8, 1, 2, WET); R(9, h + 9, 1, 2, WET); R(4, G.tT + 3, 1, 2, WET); R(11, G.tT + 2, 1, 3, WET); R(6, G.tT + 2, 4, 1, '#3a5a50'); }
        else if (d === 1) { R(9, h + 3, 2, 5, '#080c0e'); R(5, h + 8, 1, 2, WET); }
      }
    };
  }
  function yunX(water) {
    return function (g, d, fr, G, R) {
      if (d === 0) { R(7, G.hT + 3, 2, 1, '#e0a020'); }   // 额头上雄黄点的「王」
      if (water) {
        if (d === 0) { R(2, G.tT - 4, 1, 5, '#f4d0b0'); R(13, G.tT - 5, 1, 5, '#f4d0b0'); R(5, G.hT + 7, 1, 2, '#18100c'); R(10, G.hT + 7, 1, 3, '#18100c'); }
        else if (d === 1) { R(6, G.tT - 5, 1, 5, '#f4d0b0'); }
      }
    };
  }

  /* ---------------- 水鬼（主机逻辑；状态放 e.s 同步给客机） ---------------- */
  const GSPD = 2.8, RISE = .65, FULL = 130, FLOOR = 95;
  let G = null, LASTLEFT = null, DEATHS = 0;
  const GIRLS = ['yA', 'yB', 'yC', 'yD'], RIPS = ['rA', 'rB', 'rC', 'rD'];
  const SPOT = {
    A: { girl: 'yA', rip: 'rA', st: [11, 6], g: [11, 4] },
    B: { girl: 'yB', rip: 'rB', st: [19, 7], g: [19, 5] },
    C: { girl: 'yC', rip: 'rC', st: [4, 8], g: [4, 6] },
    D: { girl: 'yD', rip: 'rD', st: [26, 8], g: [26, 6], real: true }
  };
  const GOAL_BUOY = '去三叔公的棚屋拿救生圈（小路西头）';
  const GOAL_FIND = '认出真的小芸，站在岸上抛救生圈（别下水；可一人念本子、一人去看）';

  function ghostPlace(S, x, y, st = 'swim', t = 0) {
    S.place('gui', x, y, 0); const e = S.ent('gui'); e.s = { st, t }; G = null;
  }
  function ghostTick(S, dt) {
    const e = S.ent('gui'), f = S.f; if (!e || e.hidden || !f.danger || W.endScreen) return;
    const p = W.pl, s = e.s, busy = S.busy;
    if (s.st === 'sink') { if (!busy) s.t -= dt; if (s.t <= 0) s.st = 'swim'; return; }
    if (s.st === 'rise') {
      if (busy) { s.t = Math.max(s.t - dt, .7); return; }   // 手停在水面上等着：对话一结束，你还有 0.7 秒退开
      s.t -= dt;
      if (s.t <= 0) {
        const adj = Math.abs(p.x - e.x) + Math.abs(p.y - e.y) === 1 && onEdge(p.x, p.y) && !p.hidden;
        if (adj) { s.st = 'grab'; S.run(grab); }
        else { s.st = 'sink'; s.t = 1.1; S.sfx('splash'); }
      }
      return;
    }
    if (s.st !== 'swim') return;
    if (G) {
      if (busy) return;
      G.p = Math.min(1, G.p + GSPD * dt);
      e.px = lerp(G.fx, G.tx, G.p) * TS; e.py = lerp(G.fy, G.ty, G.p) * TS;
      if (G.p < 1) return;
      e.x = G.tx; e.y = G.ty; G = null;
    }
    if (busy) return;
    if (!p.hidden && onEdge(p.x, p.y) && Math.abs(p.x - e.x) + Math.abs(p.y - e.y) === 1) {
      s.st = 'rise'; s.t = RISE; gurgle(S, 1.2); S.sfx('splash'); return;
    }
    const tg = laneCell(p.x, p.y); if (!tg || (tg[0] === e.x && tg[1] === e.y)) return;
    const n = waterStep(e.x, e.y, tg[0], tg[1]); if (!n) return;
    e.dir = n[0] > e.x ? 2 : n[0] < e.x ? 1 : n[1] > e.y ? 0 : 3;
    G = { fx: e.x, fy: e.y, tx: n[0], ty: n[1], p: 0 };
  }
  async function grab(S) {
    const f = S.f, e = S.ent('gui'); f.hits = (f.hits || 0) + 1;
    if (f.hits === 1) {
      await S.scare('face', { face: 'shou', sfx: 'splash' });
      await S.narr('一只冰凉的手从水里伸出来，攥住了你的脚踝——\n一拽，你半条腿就踩进了水里。');
      S.take('wucai'); S.sfx('cut');
      await S.narr('手腕上「啪」的一声。外婆系的五彩绳，断了。\n那只手像被烫了一下，缩了回去，水底下一道黑影往下游窜远了。\n你连滚带爬地退上了岸。');
      const [sx, sy] = safeCell(W.pl.x, W.pl.y); S.pos(sx, sy, 0);
      S.timerAdd(-8);
      ghostPlace(S, Math.min(RW - 1, e.x + 6), 3, 'sink', 3);   // 被五彩绳烫了一下，退到下游去了
      await S.think('它游得没有我跑得快……\n先把它引到别处，再到水边去。');
    } else {
      LASTLEFT = S.timerLeft; DEATHS++; f.danger = false;
      await S.scare('face', { face: 'shou', sfx: 'scream' });
      await S.die('那只手又攥住了你。这一次，五彩绳已经断了。\n水底很黑，很冷。底下还有很多只手。', '你被拖下了水');
    }
  }
  const timeUp = async S => {
    LASTLEFT = 0; DEATHS++; S.f.danger = false;
    await S.narr('拍水声一下比一下慢。\n东头芦苇丛里，那团红色往下沉了一沉——');
    await S.die('你再也等不下去，鞋都没脱，就跳进了水里。\n水底下有一双手，早就在等你。', '你下了水');
  };
  function startDanger(S, retry) {
    const f = S.f; f.danger = true;
    for (const k in SPOT) { S.show(SPOT[k].girl); S.show(SPOT[k].rip); }
    ghostPlace(S, 27, 3);
    const left = retry && LASTLEFT != null ? Math.max(LASTLEFT, FLOOR) : retry ? FLOOR + 10 : FULL;
    LASTLEFT = null; f._cry = 2;
    S.timer(left, '小芸的力气', timeUp, { during: true });
  }

  /* ---------------- 四处岸边：看、抛 ---------------- */
  const AGAIN = {
    A: '码头那个：木桩上抱着人，水里只有木桩的影子。',
    B: '河埠头那个：喊得又响又清楚，喊的是「禾禾」。',
    C: '洗衣石那个：一声不吭，叶子往上游漂。',
    D: '苇丛那个：不喊，只拍水，叶子顺水往下游漂。'
  };
  const LOOK = {
    async A(S) {
      await S.narr('码头尽头的木桩上，抱着一个穿红裙子的小女孩。\n她没有喊，只是一下一下地拍着水。');
      await S.narr('你把手电照过去。光落在水面上，照出了木桩的影子、缆绳的影子——\n木桩上明明抱着一个人，水里却只有一根光秃秃的木桩。');
    },
    async B(S) {
      await S.narr('河埠头最下面一级石阶外，一个穿红裙子的小女孩泡在水里，扯着嗓子在喊。');
      cry(S, 1);
      await S.say('水里', '禾禾哥——禾禾哥——救我——');
      if (S.once('askB')) {
        if (S.f.answered) await S.think('……黄昏的时候，我已经应过一回了。\n「应两回，你就是它的。」');
        const a = await S.ask('她在喊你。', ['应她一声', '不应'], '');
        if (a === 0) { if (await answered(S, 'B')) return true; }
        else await S.narr('你咬住嘴唇，没出声。她喊得更响了，一声比一声清楚。');
      }
      await S.narr('手电光底下，她的倒影就在水里。\n她喊得那么响，那么清楚……一口水也没呛着。');
    },
    async C(S) {
      await S.narr('洗衣石边上，一个穿红裙子的小女孩扒着石头，下半身泡在水里，一声也不吭。\n手电照过去，水里有她的倒影。');
      await S.narr('你从石缝里摸出一片落叶，丢进她身边的水里——\n叶子打了个转，慢慢地，往上游漂去了。');
    },
    async D(S) {
      await S.narr('芦苇丛的缺口外面，一团红色在水里一沉一浮。\n没有喊声，只有手拍水的声音：啪，啪，越来越慢。');
      slap(S, 1);
      await S.narr('手电照过去，水里有她小小的倒影。\n你丢下一片苇叶，苇叶顺着水，往下游漂走了。');
      await S.narr('她的脸露出水面一下——嘴张着，喊不出声。');
    }
  };
  const WHY = {
    A: '……木桩上明明抱着一个人，水里却没有她的影子。',
    B: '她喊的是「禾禾」。小芸从来只叫我「阿禾哥」。',
    C: '她身边的叶子，是往上游漂的。'
  };
  const IDLE = {
    A: '码头尽头的木桩，被水泡得发黑。三叔公的渡船拴在这儿，轻轻地晃。\n木板上有两个湿脚印，脚尖朝着水。',
    B: '河埠头的石阶一级一级伸进水里，最下面一级长满了青苔。\n白天，村里的女人在这儿淘米、洗菜。',
    C: '洗衣石。一块平平的大青石，半截泡在水里，被棒槌捶得发亮。\n石头边上的水，打着小小的旋。',
    D: '芦苇丛中间被人踩出一个缺口，烂泥里有一串小小的脚印，一直走到水边。'
  };
  async function spot(S, k) {
    const f = S.f;
    if (f.ph === 'final') return k === 'B' ? finale(S) : S.think('……他在河埠头等你。');
    if (f.ph !== 'night' || !f.danger) return S.narr(IDLE[k]);
    if (f.gone && f.gone[k]) return S.narr('水面上空荡荡的。刚才那个「小芸」，不见了。');
    if (f['seen' + k]) { S.bubble(SPOT[k].girl, k === 'B' ? '!' : '…', 1200); await S.think(AGAIN[k]); }
    else if (await LOOK[k](S)) return;
    f['seen' + k] = true;
    if (!S.has('buoy')) {
      const j = await S.ask('……', ['跳下去救她', '伸竹竿去够', '先去棚屋拿救生圈'], '');
      if (j === 1) { await S.narr('你抓起岸边一根竹竿，伸到头——还差两三尺。\n竹竿梢子在水面上划了一下，什么也没碰着。'); await S.think('够不着……「够不着就扔东西」。三叔公棚屋门口有救生圈。'); S.goal(GOAL_BUOY); return; }
      if (j === 0) { LASTLEFT = S.timerLeft; DEATHS++; f.danger = false; await S.scare('face', { face: 'shou', sfx: 'splash' }); return S.die('你一头扎进了水里。\n水比看上去冷得多，也深得多。有什么东西缠上了你的腿。', '你下了水'); }
      S.goal(GOAL_BUOY); return;
    }
    const c = await S.ask('把救生圈抛给她？', ['抛！', '再看看别处'], '');
    if (c === 0) await throwAt(S, k);
  }
  async function throwAt(S, k) {
    const f = S.f; S.sfx('splash');
    await S.narr('你抡圆了胳膊，把救生圈连着绳子抛了出去——');
    if (SPOT[k].real) return rescue(S);
    f.wrong = (f.wrong || 0) + 1; (f.gone = f.gone || {})[k] = true;
    await S.narr('救生圈落在她手边。她伸手抓住了——\n绳子那头猛地一沉！一股大得吓人的力气，把你往水里拽。');
    await S.scare('face', { face: 'fake', sfx: 'scream' });
    S.hide(SPOT[k].girl); S.hide(SPOT[k].rip);
    await S.narr('你松开绳子，一屁股坐在岸上。\n水面上只剩救生圈在打转。那个「小芸」，不见了。\n……救生圈慢慢漂回岸边，你把它捞了上来。');
    S.timerAdd(-15); S.toast('小芸的力气 −15');
    await S.think(WHY[k]);
    if (f.wrong === 2) await S.think('三叔公的本子上写着：真落水的人，喊不出声，只会拍水。');
    if (f.wrong >= 3) await S.think('……只剩东头芦苇丛那边了。那边一直只有拍水声。');
  }
  async function answered(S, where) {   // 应了一声：第一次警告，第二次是坏结局
    const f = S.f; f.answered = (f.answered || 0) + 1;
    if (f.answered >= 2) { await endAnswer(S); return true; }
    await S.narr('「……哎！」\n你应出口，才反应过来——');
    if (where === 'dusk') await S.narr('外婆的声音，是从河里传上来的。\n对岸的芦苇沙沙地响了一阵，像有人在笑。');
    else await S.narr('那声音是从水底下冒上来的。水面上咕嘟咕嘟，冒起一串泡。');
    gurgle(S);
    await S.think('「应一回，它记住你；应两回，你就是它的。」\n……不能再应了。');
    return false;
  }

  /* ---------------- 救人 → 终章 ---------------- */
  async function rescue(S) {
    const f = S.f; S.clearTimer(); f.danger = false; f.saved = true;
    const g = S.ent('gui'); g.s.st = 'off';
    await S.narr('救生圈「啪」地落在她手边。\n一双小手胡乱抓了两下，死死抱住了它。');
    await S.narr('你攥紧绳子往回拖。\n沉——沉得不像一个八岁的孩子。水底下，好像有什么东西拽着她的脚。');
    S.shake(600, 2); gurgle(S);
    await S.narr('然后，那股力气忽然松了。\n不……不是松了。\n是有一只手，在水底下，把她往岸边推了一把。');
    S.hide('gui');
    for (const k of ['A', 'B', 'C']) { await S.alpha(SPOT[k].girl, 0, 300); S.hide(SPOT[k].rip); }
    S.hide('rD'); S.hide('yD'); for (const k in SPOT) S.ent('s' + k).s.glow = 0;
    S.pos(26, 9, 3); S.place('yun', 26, 8, 0);
    S.sfx('splash');
    await S.say('小芸', ['咳、咳咳……', '阿禾哥……']);
    S.place('guifen', 26, 11, 3); S.place('san', 25, 11, 3);
    await S.walk('guifen', [26, 10], 5);
    await S.say('桂芬婶', '小芸！小芸啊——');
    await S.say('小芸', ['妈……水里有个哥哥，叫我去捡球……', '后来……后来又是他，把我推上来的。']);
    S.face('san', 1);
    await S.say('三叔公', ['……是春生。', '这伢子。十年了，还是这个性子。']);
    await S.say('三叔公', ['我送她娘俩回去。你也赶紧回家——', '莫回头，莫应声。']);
    S.place('yun', 26, 10, 0); S.hide('yun'); S.hide('guifen'); S.hide('san');
    S.amb('none'); await S.wait(900);
    callTone(S, .7);
    await S.say('', '「阿禾。」', { style: 'whisper' });
    await S.think('是春生的声音。从河埠头那边传过来的。\n……他叫的不是小名。');
    f.ph = 'final'; S.goal('去河埠头'); S.amb('river');
    S.cp('final');
  }
  async function finale(S) {
    const f = S.f; if (f.fin) return; f.fin = true;
    S.pos(19, 7, 3); S.dark(.92); S.amb('none');
    await S.narr('河埠头最下面一级石阶，被水淹了一半。\n水面平得像一块黑玻璃。');
    gurgle(S, .8); await S.wait(700);
    S.place('chun', 19, 6, 0); S.ent('chun').alpha = 0; await S.alpha('chun', 1, 1500);
    await S.scare('face', { face: 'chunsheng', sfx: 'sting' });
    await S.narr('春生站在水里，水只到他的腰。\n月光照着他。水面上，没有他的倒影。');
    await S.say('春生', ['阿禾。', '你长这么高了。我还是这么高。']);
    await S.say('春生', ['今天上午，龙舟又下水了。锣一响，我就在这儿等。', '等了十个端午。你一个都没来。']);
    await S.say('你', '……对不起。');
    await S.say('春生', ['水里好冷。底下黑，什么都没有。', '过了今晚，我就再也上不去了。']);
    callTone(S);
    if (f.answered) await S.think('「应两回，你就是它的。」……我已经应过一回了。');
    const a = await S.ask('「禾禾——」\n他学着外婆的腔调，轻轻喊了一声。', ['应他', '不应'], '春生');
    if (a === 0) { if (await answered(S, 'final')) return; }
    else await S.narr('你咬着嘴唇，没有出声。\n春生愣了一下，眼睛里的光暗了下去。');
    await S.narr('他把手伸出了水面。\n那只手很小，很白，指甲缝里塞着河泥。');
    await S.say('春生', '你拉我一把，好不好？就一把。');
    const h = await S.ask('……', ['伸手拉他', '不伸手'], '');
    if (h === 0) return endHand(S);
    await S.narr('你把手攥成拳头，背到了身后。');
    await S.say('春生', '……你也不肯。');
    S.shake(700, 3); gurgle(S, 1.3);
    await S.narr('水面「哗」地翻起一圈白浪。\n石阶底下，伸出了第二只手，第三只手——');
    await S.say('你', ['春生，我不下去。', '可我也不走。我在这儿，陪你说说话。']);
    await S.narr('那些手停住了。');
    if (S.has('stone')) {
      await S.narr('你从口袋里摸出那块青石片。\n扁扁的，磨得溜光。……十年了，它一直躺在外婆的旧木箱里。');
      await S.say('你', '你说过，等我来了，教我打七个。');
      await S.narr('你侧过身子，贴着水面，把石片甩了出去——');
      skips(S, 7); await S.wait(2400);
      await S.narr('一，二，三，四，五，六……七。\n石片在黑色的水面上跳了七下，沉了下去。');
      await S.say('春生', '……七个。你学会了。');
      S.take('stone'); f.skipped = true;
    } else {
      await S.say('春生', '……我给你的那块石片呢？');
      await S.say('你', '我……弄丢了。');
      await S.say('春生', '没关系。河滩上多的是。');
    }
    await S.say('你', '你推小芸上来的时候，我看见了。');
    await S.say('春生', ['……我本来想拉她下去的。拉下去，我就能上岸了。', '可她喊不出声，就那么拍水，跟我那天一样。我下不去手。']);
    if (f.readLiulang) {
      await S.say('你', ['春生，我给你讲个故事。三叔公棚子里那本旧书上的。', '从前有个水鬼，叫王六郎。他也在等替身……']);
      await S.narr('你把王六郎的故事讲给他听：渔夫洒进河里的酒，抱着孩子的妇人，那个下不去手的水鬼，还有后来那座土地庙。');
      await S.say('春生', ['……他放过了那个女人，老天爷就让他当了土地？', '那我刚才把小芸推上去……算不算？']);
      await S.say('你', '算。');
      await S.narr('春生低下头，很久很久。\n然后，他笑了——像十年前那个下午，站在河埠头上冲你喊「快来呀」的那个春生。');
      await S.say('春生', ['那我不找了。', '阿禾，明年端午，你还来吗？']);
      await S.say('你', '来。每年都来。');
      return endGood(S, 'guard');
    }
    await S.say('你', '你不是那种水鬼，春生。从来都不是。');
    await S.narr('春生看了你很久。');
    await S.say('春生', ['……算了。我不找了。', '阿禾，明年端午，你还来吗？']);
    await S.say('你', '来。每年都来。');
    return endGood(S, 'spare');
  }
  function tail(S) {
    const f = S.f; let t = '';
    if (f.skipped) t += '\n\n那天晚上，你打出了七个水漂。后来你再也没打出过那么多。';
    t += S.has('wucai') ? '\n\n端午后的第一场雨，你把手腕上的五彩绳剪下来，丢进了回龙湾。' : '\n\n你手腕上的五彩绳那晚断了。第二天，外婆又给你系了一根新的。';
    return t;
  }
  async function endGood(S, id) {
    S.sfx('chime'); await S.alpha('chun', 0, 2200); S.hide('chun');
    S.lights([[19 * TS + 8, 5 * TS + 8, 2.2, .7]]); await S.wait(1200); S.lights(null);
    if (id === 'guard') return S.end({ id, title: '回龙湾的土地', text: '春生沉了下去。水面上亮起一点点光，像有人提着一盏灯，慢慢走远了。\n\n第二天，三叔公说他夜里梦见春生来道别：上头看他心善，派他去守回龙湾，做这一湾水的土地。\n\n第二年，村里人在河埠头边上砌了一座半人高的小土地庙。从那以后，回龙湾落水的孩子，都说水底下有个大哥哥，推了他们一把。' + tail(S) });
    return S.end({ id, title: '放过', text: '春生沉了下去，再也没有浮上来。\n\n天亮以后，三叔公说他夜里梦见春生来道别：阎王爷看他心善，不找替身，许他去投胎了——投个好人家，这回离水远一点。\n\n那年夏天，回龙湾一个人也没淹死。\n三叔公说，他棚子里那本旧书上，也有一个这样的水鬼——后来当了土地。' + tail(S) });
  }
  async function endHand(S) {
    await S.narr('你蹲下来，把手伸进了水里。\n他的手好凉，凉得像十年前那天下午的河水。');
    await S.say('春生', '……谢谢你，阿禾。');
    await S.scare('face', { face: 'chunsheng', sfx: 'splash' });
    await S.narr('他握住你，轻轻一拉——\n石阶上的青苔，好滑。');
    await S.fade(1, 900);
    await S.end({ bad: true, id: 'hand', title: '伸手', text: '第二天一早，外婆在河埠头的石阶上，找到了你的一只鞋。\n\n后来，柳湾村的孩子们说，回龙湾底下有个大哥哥，会喊人去捡球。\n他的声音很温和。他知道每个人的小名。\n\n三叔公后来逢人就说：看见有人落水，伸竹竿，扔东西——莫伸手，莫跳。' });
  }
  async function endAnswer(S) {
    S.clearTimer(); S.f.danger = false;
    await S.narr('「……哎。」\n你应了第二声。');
    await S.narr('然后，你就什么都不怕了。\n河水看起来又暖又亮，有人在水底下冲你招手——是外婆？是春生？\n你一级一级，走下了石阶。');
    await S.fade(1, 900);
    await S.end({ bad: true, id: 'answer', title: '应声', text: '应一回，它记住你；应两回，你就是它的。\n\n那年端午之后，柳湾村的老人们又多念叨了一句：\n夜里在河边，不管是谁喊你，不管喊得多像——\n都别应。' });
  }

  /* ---------------- 黄昏：岸边的诱惑 ---------------- */
  async function duskLure(S) {
    const f = S.f; f.lured = true;
    const b = S.ent('ball'); S.place('ball', 6, 5); b.ox = 0;
    S.focus(5, 6); S.sfx('splash');
    await S.narr('「咚。」\n水面上漂过来一个红皮球，在洗衣石旁边打着转。');
    await S.say('水里', '哥哥——帮我捡一下球——', { style: 'whisper' });
    await S.think('……谁？岸上一个人都没有。');
    const c = await S.ask('怎么办？', ['到洗衣石上，伸手去捞', '用码头边的竹竿去拨', '不管它'], '');
    if (c === 0) {
      S.pos(4, 8, 3);
      await S.narr('你蹲在洗衣石上，伸手去够——\n指尖刚碰到水，水底下有什么东西擦过你的手指。冰凉，滑腻，像一缕头发。');
      S.fx('flash'); S.sfx('sting');
      await S.narr('你猛地缩回了手。');
      S.pos(4, 9, 3);
    } else if (c === 1) await S.narr('你抽来码头边的竹竿去拨。竹竿刚碰到球，球就轻轻一转，滑开了。');
    else await S.narr('你没有动。球在原地打了个转。');
    for (let i = 0; i < 40; i++) { b.ox = -i; await S.wait(45); }
    S.sfx('splash'); S.hide('ball'); b.ox = 0;
    await S.narr('……球逆着水，慢悠悠地往上游漂了一截，「咕咚」一声，沉了。');
    await S.think('河水是往东流的。那个球，在往西漂。');
    S.toast('三叔公的本子：二、它待的地方，水往回流');
    S.focus(null); await S.wait(700);
    callTone(S);
    const a = await S.ask('「禾禾——回来吃粽子咯——」\n是外婆在喊你。', ['应一声', '不应'], '');
    if (a === 0) await answered(S, 'dusk');
    else await S.narr('你攥紧手腕上的五彩绳，一声没吭。\n喊声又响了两遍，一遍比一遍近……然后，没了。\n外婆在村里。外婆不会到河边来喊你。');
    S.goal('去龙王庙供粽子（河边小路往西）');
  }

  async function sanTalk(S) {
    const f = S.f;
    if (f.metSan) return S.say('三叔公', '供完粽子就回家，莫在水边耽搁。');
    S.face('san', 'pl');
    await S.say('三叔公', '哟，林家的外孙？长这么高了。粽子？好，好，替我谢谢你外婆。');
    S.take('zongzi'); S.give('zongzi2', true);
    await S.say('你', '三叔公，外婆说这湾水，每年夏天都要……');
    await S.say('三叔公', ['要一个。\n你还记得春生不？十年前端午赛龙舟，就在这湾里翻了船。别人都爬上来了，就他一个没上来。', '老话讲，淹死的人，魂困在水里，上不了岸，投不了胎。\n要上岸，就得拉一个活人下去，顶它的位子——这叫找替身。', '我撑了五十年船，不信春生是那种伢子。\n可今天，是他第十个端午了。老辈人讲，等过十个端午还上不来，就永世上不来了。']);
    await S.say('三叔公', '水里的东西认人，我记在本子上了。你拿去，河边有什么不对劲，就照这个来。');
    await S.note('rules'); f.gotRules = true; S.give('rules', true);
    await S.say('三叔公', ['棚子里桌上还有本旧书，夹着一页，讲的是另一个水鬼——心善的。', '我去上游收网。救生圈挂在棚子门口，用得着就拿。']);
    f.metSan = true; S.goal('去龙王庙供粽子（河边小路往西）');
    await S.walk('san', [[10, 11], [15, 13]], 3.2);
    S.hide('san');
  }
  async function shed(S) {
    const f = S.f, e = S.ent('shed');
    if (f.ph === 'night' && e.s.buoy) {
      e.s.buoy = false; S.give('buoy');
      await S.narr('你一把扯下门口的救生圈——旧轮胎内胎改的，拴着一大卷麻绳。');
      S.goal(GOAL_FIND);
      if (S.once('shedNight')) await S.think('三叔公的本子……影子、水流、小名，还有：真落水的人喊不出声。');
      return;
    }
    const opts = ['翻翻桌上那本旧书'];
    if (e.s.buoy) opts.push('取下救生圈带上');
    opts.push('算了');
    const c = await S.ask(e.s.buoy ? '三叔公的棚屋。门口挂着一个救生圈，屋里一张小桌，桌上压着一本旧书。' : '三叔公的棚屋。屋里一张小桌，桌上压着一本旧书。', opts, '');
    if (opts[c] === '翻翻桌上那本旧书') { await S.note('liulang'); f.readLiulang = true; if (S.once('liuThink')) await S.think('王六郎……一个下不去手的水鬼。'); }
    else if (opts[c] === '取下救生圈带上') { e.s.buoy = false; S.give('buoy'); await S.narr('救生圈是旧轮胎内胎改的，拴着一大卷麻绳。你把它挎在了肩上。'); if (f.ph === 'night') S.goal(GOAL_FIND); }
  }

  /* ---------------- 庙里 → 1986 ---------------- */
  async function maybePast(S) {
    const f = S.f; if (!f.offered || !f.readEssay || f.pastDone) return;
    f.pastDone = true;
    await S.think('「明年端午他还来……」\n……我想起来了。那天，我就站在河埠头上。');
    await S.fade(1, 1200);
    await S.go('past', 18, 9, 3, { fade: false });
  }
  async function pastTalk(S) {
    const f = S.f; if (f.pastTalked) return S.say('春生', '快去岸上占个好位置！');
    S.face('chunk', 'pl');
    await S.say('春生', ['阿禾！你可算来了。', '下午我要上龙舟打锣！你在岸上看着，可别眨眼。']);
    await S.say('春生', '先教你打水漂——你上回才打三个，丢不丢人。');
    let tries = 0;
    for (; ;) {
      const c = await S.ask('怎么打？', ['使劲往水里砸', '侧着身子，贴着水面甩出去'], '春生');
      if (c === 1) break;
      skips(S, 1); tries++;
      await S.narr('「咕咚。」石片直接沉了底。\n春生笑得直不起腰。');
      if (tries >= 1) await S.say('春生', '侧着身子！贴着水！跟削水似的！');
    }
    skips(S, 3); await S.wait(1500);
    await S.narr('一，二，三。');
    await S.say('春生', '看我的。');
    skips(S, 7); await S.wait(2400);
    await S.narr('一，二，三，四，五，六……七！');
    await S.say('春生', ['这块给你。是我在河滩上找到的最好的一块。', '明年端午你再来，我教你打七个。到时候，你把它还我。']);
    await S.say('你', '好！拉钩。');
    await S.say('春生', '拉钩上吊，一百年不许变！');
    gong(S, 1); drum(S, 1, .3); drum(S, 1, .6);
    await S.say('岸上', '春生——上船咯——');
    await S.say('春生', '来啦——！');
    f.pastTalked = true;
    await S.walk('chunk', [[17, 9], [12, 11]], 5); S.hide('chunk');
    await S.wait(600);
    await S.card('那天下午', '一九八六年　端午', '龙舟在回龙湾翻了。\n\n大人们捂着我的眼睛，把我抱回了外婆家。\n第二天，爸妈就把我接回了城里。\n\n后来，我再也没有回来过。\n那块石片，我也忘了放在哪里。');
    S.wear('@me2'); f.ph = 'templeNight';
    await S.go('temple', 12, 4, 0);
  }

  /* ---------------- 章节 ---------------- */
  defChapter({
    id: 'shuigui', n: 12, title: '水鬼找替身', sub: '村口那湾水，每年夏天都要带走一个人。河边有人喊你，不要应。', origin: '中国民间传说', color: '#12403c',
    icon: '@chun', amb: 'river', floor: 'dirt', wall: 'wood', dark: .3, plr: 3.4,
    endings: { guard: '回龙湾的土地', spare: '放过', hand: '伸手', answer: '应声' },
    people: {
      me: { key: 'sg-me', skin: '#f0c8a0', hair: '#1e1814', hs: 'short', top: '#c8302a', top2: '#e8e0d0', bottom: '#2e3e5e', shoes: '#e8e8e0' },
      me2: { key: 'sg-me2', skin: '#f0c8a0', hair: '#1e1814', hs: 'short', top: '#e8e6dc', top2: '#c8c6bc', bottom: '#2e3e5e', shoes: '#e8e8e0' },
      kid: { key: 'sg-kid', child: true, skin: '#f0c8a0', hair: '#1e1814', hs: 'short', top: '#e8c040', bottom: '#3a5a8a', shoes: '#c84a3a' },
      waipo: { key: 'sg-wp', skin: '#e2b48e', hair: '#d0d0c8', hs: 'bun', top: '#34466a', top2: '#e0dcd0', bottom: '#2a2a30', shoes: '#1a1a1a', mouth: '#a06a5a',
        extra(g, d, fr, G, R) { if (d === 0) { R(5, G.hT + 3, 2, 1, '#c09a7a'); R(9, G.hT + 3, 2, 1, '#c09a7a'); R(5, G.tT + 1, 6, 1, '#e0dcd0'); } } },
      yun: { key: 'sg-yun', child: true, skin: '#f4d0b0', hair: '#18100c', hs: 'twin', top: RED, top2: '#f0e0d0', dress: true, shoes: '#c82030', blush: '#f0a0a0', extra: yunX(false) },
      yunw: { key: 'sg-yunw', child: true, skin: '#f4d0b0', hair: '#18100c', hs: 'twin', top: RED, top2: '#f0e0d0', dress: true, ghost: true, blush: '#e8a0a0', extra: yunX(true) },
      guifen: { key: 'sg-gf', skin: '#e8bc94', hair: '#1a1410', hs: 'bun', top: '#5a7a52', top2: '#e0d8c0', bottom: '#2a2a34', apron: '#d8d0bc', shoes: '#2a2020' },
      san: { key: 'sg-san', skin: '#c8946a', hair: '#c8c8c0', hs: 'short', hat: 'straw', hatC: '#c9a35a', top: '#6a5a44', top2: '#4a3e30', bottom: '#2a2a28', shoes: '#3a3a30',
        extra(g, d, fr, G, R) { if (d === 0) { R(6, G.hT + 6, 4, 1, '#e0e0d8'); R(5, G.hT + 3, 2, 1, '#a07050'); R(9, G.hT + 3, 2, 1, '#a07050'); } } },
      chun: { key: 'sg-chun', skin: '#b4c6c2', hair: '#080c0e', hs: 'messy', top: '#d4d8ce', top2: '#b8bcb2', ghost: true, eye: '#020404', mouth: '#3a4a48', extra: chunX(false) },
      chunk: { key: 'sg-chunk', skin: '#c8946a', hair: '#100c0a', hs: 'messy', top: '#ecece0', top2: '#d0d0c4', bottom: '#3a4a7a', shoes: '#2a2a2a', mouth: '#8a4a3a', extra: chunX(true) },
      v1: { key: 'sg-v1', skin: '#d8a880', hair: '#1a1410', hs: 'short', top: '#4a6a8a', bottom: '#2a2a30', shoes: '#2a2a2a' },
      v2: { key: 'sg-v2', skin: '#e8c0a0', hair: '#1a1410', hs: 'bun', top: '#b85a4a', bottom: '#3a3040', shoes: '#2a2020' },
      v3: { key: 'sg-v3', child: true, skin: '#e0b090', hair: '#1a1410', hs: 'short', top: '#e8e0d0', bottom: '#4a4a6a', shoes: '#2a2a2a' }
    },
    faces: {
      /* 春生：湿透的头发贴在脸上，红布条，两只发白的眼睛 */
      chunsheng(R, a, t) {
        R(0, 0, 32, 32, '#03080a'); for (let i = 0; i < 6; i++) R(0, 3 + i * 5 + Math.round(Math.sin(t * 2 + i)), 32, 1, '#0a1a1c');
        R(7, 5, 18, 22, '#9fb4b0'); R(8, 27, 16, 2, '#8ea29e'); R(22, 8, 3, 18, '#869a96');
        R(6, 2, 20, 7, '#05090a'); R(5, 5, 3, 16, '#05090a'); R(24, 5, 3, 18, '#05090a');
        R(9, 9, 2, 9, '#05090a'); R(13, 9, 1, 6, '#05090a'); R(17, 9, 1, 5, '#05090a'); R(20, 9, 2, 8, '#05090a');
        R(5, 8, 22, 2, HB); R(25, 9, 3, 2, HB); R(27, 10, 2, 4, '#8a1018');
        const eh = 2 + Math.round(a * 3); R(10, 14, 5, eh, '#081012'); R(18, 14, 5, eh, '#081012');
        R(12, 15, 2, 2, '#e4f4ee'); R(20, 15, 2, 2, '#e4f4ee');
        const mh = 1 + Math.round(a * 4); R(13, 22, 7, 1, '#2a3a38'); R(14, 23, 5, mh, '#050a0a');
        for (let i = 0; i < 5; i++) R(9 + i * 3, 20 + ((t * 16 + i * 5) % 10), 1, 2, WET);
        R(15, 23 + mh, 1, 3 + ((t * 10) % 3), WET);
        R(3, 28, 26, 4, '#c8ccc0'); R(3, 28, 26, 1, '#9aa09a');
      },
      /* 水里伸出来的手 */
      shou(R, a, t) {
        R(0, 0, 32, 32, '#041816'); for (let i = 0; i < 6; i++) R(0, 4 + i * 5 + Math.round(Math.sin(t * 3 + i)), 32, 1, '#0c302c');
        const y = 30 - Math.round(a * 14);
        R(11, y, 10, 18, '#b8c8c0'); R(11, y, 1, 18, '#8a9a94');
        R(9, y - 9, 14, 10, '#c8d6d0'); R(10, y - 8, 12, 8, '#d4e0da'); R(10, y - 2, 12, 1, '#a8b8b2');
        [[10, 9], [13, 12], [16, 11], [19, 8]].forEach(([x, l]) => { R(x, y - 9 - l, 2, l, '#d4e0da'); R(x + 1, y - 9 - l, 1, l, '#b0c0ba'); R(x, y - 9 - l, 2, 2, '#3a4a44'); });
        R(7, y - 7, 3, 2, '#c8d6d0'); R(5, y - 10, 2, 4, '#d4e0da');
        for (let i = 0; i < 4; i++) R(8 + i * 5, y - 4 + i * 3, 1, 10, '#2a5a3a');   // 缠着的水草
        R(0, 25, 32, 7, 'rgba(8,40,36,.88)'); for (let i = 0; i < 5; i++) R(3 + i * 6, 25 + ((t * 10 + i * 3) % 3), 4, 1, 'rgba(200,230,225,.5)');
      },
      /* 假小芸：抓住了绳子，抬起脸——眼窝里全是水 */
      fake(R, a, t) {
        R(0, 0, 32, 32, '#06100e');
        R(2, 8, 4, 14, '#18100c'); R(26, 8, 4, 14, '#18100c'); R(3, 6, 3, 4, '#18100c'); R(26, 6, 3, 4, '#18100c');
        R(8, 5, 16, 19, '#d8c4b4'); R(7, 3, 18, 6, '#18100c'); R(7, 9, 2, 10, '#18100c'); R(23, 9, 2, 10, '#18100c');
        R(15, 6, 2, 2, '#e0a020');
        const eh = 3 + Math.round(a * 3); R(11, 12, 4, eh, '#000'); R(18, 12, 4, eh, '#000');
        for (let i = 0; i < 2; i++) { R(12 + i * 7, 12 + eh, 1, 6 + ((t * 14) % 4), WET); }
        const mh = 2 + Math.round(a * 6); R(13, 19, 6, mh, '#0a0404'); R(14, 19 + mh, 1, 4, WET); R(17, 19 + mh, 1, 3, WET);
        R(4, 26, 24, 6, RED); R(4, 26, 24, 1, '#f0e0d0');
        R(0, 28, 32, 4, 'rgba(8,36,32,.85)');
      }
    },
    items: {
      aicao: { name: '艾草和菖蒲', desc: '新割的，叶子上还带着露水。苦香苦香的。' },
      wucai: { name: '五彩绳', desc: '红黄蓝白黑，五股丝线拧在一起，系在你手腕上。端午后的第一场雨，才能剪下来丢进河里。' },
      zongzi: { name: '一串粽子', desc: '外婆包的碱水粽，用马莲草捆成一串，还烫手。四个：两个给三叔公，两个供龙王庙。' },
      zongzi2: { name: '两个粽子', desc: '要供到河边龙王庙去的。' },
      torch: { name: '手电筒', desc: '外婆的老式铁皮手电，要拍两下才亮。' },
      stone: { name: '青石片', desc: '一块扁扁的青石片，磨得溜光，边上有一道白纹。在外婆的旧木箱里放了很多年。' },
      rules: { name: '三叔公的本子', desc: '「水里的东西学人，有三样学不像。」（在档案里可以再看）' },
      buoy: { name: '救生圈', desc: '旧轮胎内胎改的，拴着一大卷麻绳。够不着的时候，就扔这个。' }
    },
    notes: {
      notice: { title: '村口告示栏上的通知', text: '柳湾村村民委员会　通知\n\n端午将至，天气转热。回龙湾一带水深流急，湾底有暗流、漩涡，严禁在该水域游泳、戏水、摸鱼。家长务必看管好自家小孩。\n\n近年来该处已发生多起溺水事故，教训深刻。\n\n　　　　　　　　　　一九九六年五月\n\n（告示下面，有人用粉笔歪歪扭扭地添了一行：「水鬼找替身，端午莫下河。」又被人擦掉了一半。）' },
      rules: { title: '三叔公的本子', text: '（铅笔写的，字很大，有几个错字）\n\n水里的东西学人，学得再像，有三样学不像：\n\n一、它没有影子。人在水面上，水里有倒影。它在水面上，水里什么也没有。\n二、它待的地方，水往回流。丢片叶子下去，叶子逆着水走。\n三、它叫你小名。小名是它在你家门口听来的。应一回，它记住你；应两回，你就是它的。\n\n救人：\n真落水的人喊不出声，只会拍水。\n看见了，莫跳。够得着伸竹竿，够不着扔东西。\n自己下去，是两条命。' },
      liulang: { title: '旧书里夹着的一页', text: '（从旧书上撕下来的一页，竖排小字，三叔公在旁边用铅笔写了白话）\n\n《聊斋志异·王六郎》大意：\n\n有个姓许的渔夫，夜夜在河边打鱼。喝酒之前，总先往河里洒一杯，敬河里淹死的人。\n后来有个少年来陪他喝酒，替他赶鱼。少年说：我叫王六郎，是淹死的鬼。明天有人来替我，我就能投胎了。\n第二天，一个抱孩子的妇人掉进河里，沉沉浮浮，竟自己爬上了岸。\n夜里六郎来了：「我可怜她怀里的孩子。替我一个，要搭上两条命，我不忍心。」\n后来，上天看他心善，派他去招远县邬镇，做了土地。\n\n（三叔公在下面写：春生也是个心善的伢子。）' },
      essay: { title: '春生的作文本', text: '明天是端午节　　初二（2）班　春生\n\n明天是端午节。我们村要赛龙舟，我爸是舵手，我是锣手。我在船头打锣，锣一响，大家就一起划。\n\n奶奶说，划龙舟是为了找屈原。屈原跳了江，大家划着船去找他，还往江里丢粽子，叫鱼别吃他。我觉得屈原要是知道，一定很高兴。\n\n城里来的阿禾是我最好的朋友。他打水漂只能打三个。我们拉了钩，明年端午他还来，我教他打七个。\n\n我长大了要当舵手，比我爸还厉害。\n\n（老师用红笔批：语句通顺，感情真挚。「锣手」写得好。）\n\n（本子里夹着一张糖纸，叠成了一只小船。）' }
    },
    legend: '「水鬼找替身」是流传很广的中国民间说法：溺水而死的人，魂魄被困在水里，不能离开、不能投胎，要等另一个人在同一处淹死、「顶替」它的位置，才能解脱，所以它会想方设法引人下水。这类故事在明清笔记小说里很常见，各地细节不一：有的说水鬼会变成漂在水面上的财物、衣裳、皮球引人去捞；有的说它会学熟人的声音喊人的名字，所以「夜里在水边听见有人叫你，不要应」；有的地方说穿红衣服容易被水里的东西「看上」，也有说法认为穿红衣溺亡的人怨气重、不肯走。这些都属于民间信仰和口头传说，并无实据。\n\n最有名的「心善的水鬼」出自清代蒲松龄《聊斋志异·王六郎》：渔夫许某每晚饮酒前先酹酒于河，与水鬼王六郎结为朋友；六郎本该由一个抱着孩子落水的妇人替代，却因可怜她怀里的婴儿而放弃，后来被上天任命为招远县邬镇的土地神。「善念能让水鬼脱离找替身」的情节，后来在许多民间故事里反复出现。\n\n端午节在农历五月初五。流传最广的说法是：战国时屈原投汨罗江，百姓划船寻找，往江里投粽子，免得鱼虾伤他，于是有了赛龙舟、吃粽子的习俗（各地还有纪念伍子胥、曹娥等不同版本）。五月旧称「恶月」，人们挂艾草菖蒲、喝雄黄酒、给孩子系五彩绳辟邪；有的地方在端午后第一场雨时，把五彩绳剪下扔进河里。而在现实中，夏季溺水是儿童意外死亡的重要原因之一。真正溺水的人往往喊不出声，只能本能地拍水挣扎；施救时应先呼救，再用竹竿、绳子、救生圈「伸、抛」，不熟悉水性的人不要贸然下水——这比任何禁忌都管用。\n\n（本章中的柳湾村、回龙湾、春生和他的作文、三叔公的本子与「水里的东西三样学不像」、「等过十个端午就永世上不来」的说法，以及所有人物和结局，均为游戏虚构。）',
    start: { map: 'village', x: 3, y: 6, dir: 3 },
    async intro(S) {
      await S.card('第十二夜　水鬼找替身', '1996年　农历五月初五　端午　江南·柳湾村', '村口那条青溪，流到回龙湾，水就慢下来，绿得发黑。\n\n外婆说，那湾水每年夏天都要带走一个人。\n老人们讲，是水鬼在找替身——\n找到了，它就能上岸投胎。\n\n我十年没回来过了。\n上一次来，我九岁。');
    },
    resume: {
      night: async S => {
        if (DEATHS) await S.think('（它跟着你在水里游，游得比你跑得慢：先把它引开，再去水边。\n认法在三叔公的本子里——影子、水流、小名、拍水。）');
        startDanger(S, true);
      },
      final: async S => { S.goal('去河埠头'); }
    },
    thumb(g, w, h) {   // 黑水、红皮球、水里伸出来的一只白手
      const R = (x, y, ww, hh, c) => { g.fillStyle = c; g.fillRect(x, y, ww, hh); };
      R(0, 30, w, h - 52, '#0c2a2a'); for (let i = 0; i < 9; i++) R((i * 37) % (w - 20), 36 + (i * 11) % 30, 12, 1, 'rgba(160,210,210,.25)');
      R(18, 44, 10, 10, RED); R(19, 43, 8, 1, RED); R(19, 54, 8, 1, '#7a1014'); R(18, 48, 10, 2, '#f0e0d0'); R(16, 56, 14, 1, 'rgba(200,230,230,.4)');
      const x0 = 44, y0 = 30; R(x0, y0 + 10, 6, 20, '#c8d6d0'); R(x0 - 2, y0 + 4, 10, 8, '#d4e0da');
      [[-2, 6], [1, 8], [4, 7], [7, 5]].forEach(([dx, l]) => R(x0 + dx, y0 + 4 - l, 2, l, '#d4e0da'));
      R(x0 - 6, y0 + 30, 18, 1, 'rgba(200,230,230,.5)'); R(x0 - 4, y0 + 32, 14, 1, 'rgba(200,230,230,.3)');
    },
    sprites: {
      /* 水流：一道道细纹往东漂；洗衣石那一片是回流，往西漂 */
      flow(g, e, t, R) {
        const X0 = Math.round(e.px / TS);
        for (let i = 0; i < 16; i++) {
          const lx0 = hash(X0, i, 3) * 48, ly = 2 + hash(i, X0, 5) * 90;
          const wy = 2 + ly / 16, wx0 = X0 + lx0 / 16;
          const eddy = wx0 >= 1 && wx0 < 8 && wy >= 4.5 && wy < 8;
          const sp = eddy ? -9 : 13, lx = ((lx0 + t * sp) % 48 + 48) % 48;
          if (!WATER(Math.floor(X0 + lx / 16), Math.floor(wy))) continue;
          const len = 3 + (i % 3) * 2, fa = Math.min(1, lx / 8, (48 - lx) / 8);
          R(lx, ly, len, 1, `rgba(170,215,220,${(eddy ? .3 : .2) * fa})`);
        }
      },
      /* 水里的小芸：腰以下泡在水里，水线 + 涟漪 + 拍起来的水花 */
      ripple(g, e, t, R) {
        const w = Math.sin(t * 2 + e.px) * 1.2;
        R(-2, 8, 20, 9, 'rgba(10,40,44,.6)'); R(-1, 8, 18, 1, 'rgba(190,225,225,.4)');
        if (e.refl) {   // 水里的倒影（只有活人才有）：倒过来的红裙子和头发，随水波晃
          R(4 + w, 10, 8, 4, 'rgba(200,32,42,.30)'); R(5 - w, 14, 6, 4, 'rgba(240,208,176,.20)'); R(4 + w, 18, 8, 2, 'rgba(24,16,12,.32)');
        }
        const a = (t * 1.1 + (e.px % 7) * .2) % 1.6, r = 4 + a * 6;
        R(8 - r, 9, r * 2, 1, `rgba(200,230,230,${Math.max(0, .45 - a * .28)})`);
        if (e.k === 'slap' && Math.sin(t * 5 + e.px) > .6) { R(1, 2, 2, 2, 'rgba(220,240,240,.8)'); R(13, 0, 2, 2, 'rgba(220,240,240,.8)'); R(4, -1, 1, 1, '#fff'); R(11, 4, 1, 1, '#fff'); }
      },
      /* 水鬼：贴着水面的一团黑影，头发散开；伸手时露出一条白胳膊 */
      shuigui(g, e, t, R) {
        const st = e.st || 'swim', A = g.globalAlpha;
        if (st === 'sink') g.globalAlpha = A * .3;
        if (st === 'off') g.globalAlpha = 0;
        R(3, 7, 10, 6, 'rgba(3,10,10,.85)'); R(4, 6, 8, 1, 'rgba(3,10,10,.6)');
        for (let i = 0; i < 6; i++) { const w = Math.sin(t * 2 + i) * 2; R(1 + i * 2.5 + w, 10 + (i % 3), 1, 5, 'rgba(4,12,12,.7)'); }
        R(5, 8, 1, 1, '#d8f0e8'); R(9, 8, 1, 1, '#d8f0e8');
        if (st === 'swim') {   // 身后一串气泡，标出它往哪边游
          const dx = e.dir === 2 ? 1 : e.dir === 1 ? -1 : 0, dy = e.dir === 0 ? 1 : e.dir === 3 ? -1 : 0;
          for (let i = 0; i < 4; i++) { const k = 6 + i * 5, b = (t * 5 + i * 1.3) % 3; R(7 - dx * k, 8 - dy * k - b, i < 2 ? 2 : 1, i < 2 ? 2 : 1, `rgba(200,235,230,${.55 - i * .1})`); }
        }
        if (st === 'rise' || st === 'grab') {
          const hh = 10 + Math.sin(t * 20) * 1;
          R(6, 8 - hh, 4, hh, '#b8c8c0'); R(5, 8 - hh - 4, 6, 5, '#c8d6d0');
          R(4, 8 - hh - 8, 1, 4, '#c8d6d0'); R(6, 8 - hh - 9, 1, 5, '#c8d6d0'); R(8, 8 - hh - 9, 1, 5, '#c8d6d0'); R(10, 8 - hh - 7, 1, 4, '#c8d6d0');
          R(2, 6, 12, 1, 'rgba(220,240,240,.7)'); R(0, 4, 2, 2, 'rgba(220,240,240,.7)'); R(14, 3, 2, 2, 'rgba(220,240,240,.7)');
        }
        g.globalAlpha = A;
      },
      wetprint(g, e, t, R) {   // 一对湿脚印，脚尖朝水；夜里泛着一点水光
        if (e.glow) { const b = (Math.sin(t * 2.4 + e.px * .13) + 1) / 2; R(2, 1, 12, 12, `rgba(150,215,205,${.05 + b * .1})`); R(3, 6, 4, 1, `rgba(200,240,235,${.2 + b * .3})`); R(8, 3, 4, 1, `rgba(200,240,235,${.2 + b * .3})`); }
        R(4, 6, 3, 5, 'rgba(20,40,44,.55)'); R(9, 3, 3, 5, 'rgba(20,40,44,.55)'); R(4, 5, 3, 1, 'rgba(20,40,44,.4)'); R(9, 2, 3, 1, 'rgba(20,40,44,.4)');
        R(5, 7, 1, 2, 'rgba(160,200,200,.25)'); R(10, 4, 1, 2, 'rgba(160,200,200,.25)');
      },
      ball(g, e, t, R) { const b = Math.sin(t * 3) > 0 ? 1 : 0; R(4, 6 + b, 8, 8, RED); R(5, 5 + b, 6, 1, RED); R(5, 14 + b, 6, 1, '#7a1014'); R(4, 9 + b, 8, 2, '#f0e0d0'); R(6, 6 + b, 2, 1, '#f08080'); R(2, 14, 12, 1, 'rgba(200,230,230,.35)'); },
      sunw(g, e, t, R) {   // 黄昏：一条碎金似的夕阳倒影，从对岸一直铺到脚下
        for (let i = 0; i < 14; i++) { const y = 2 + i * 6.6, w = 8 + (i % 4) * 5 + Math.sin(t * 1.5 + i) * 3, x = 24 - w / 2 + Math.sin(t + i * 1.7) * 3; R(x, y, w, 1, `rgba(255,${150 + i * 5},80,${.5 - i * .025})`); }
      },
      moonw(g, e, t, R) { const w = Math.sin(t * 1.3) * 1.5; R(2 + w, 6, 12, 2, 'rgba(230,235,210,.35)'); R(4 - w, 9, 8, 1, 'rgba(230,235,210,.25)'); R(5 + w, 11, 6, 1, 'rgba(230,235,210,.18)'); },
      shed(g, e, t, R) {
        R(-2, -18, 36, 6, '#6a5a3a'); for (let i = 0; i < 9; i++) R(-2 + i * 4, -14, 2, 3, '#8a7a4a'); R(-2, -12, 36, 2, '#4a3e28');
        box(R, 0, -10, 32, 25, '#5a4630'); for (let y = -8; y < 14; y += 4) R(1, y, 30, 1, '#4a3826');
        R(12, -4, 9, 18, '#2a1e14'); R(19, 4, 1, 2, '#c8a050');
        if (e.buoy) { R(23, -6, 8, 8, '#2a2a2a'); R(25, -4, 4, 4, '#5a4630'); R(23, -6, 8, 1, '#4a4a4a'); R(27, -8, 1, 3, '#c8b890'); R(22, 2, 2, 6, '#c8b890'); }
        R(2, -6, 2, 20, '#9a8a5a');   // 靠着墙的竹竿
      },
      willow(g, e, t, R) {
        R(6, -6, 5, 22, '#3a2c20'); R(7, -6, 2, 22, '#4a3a2a'); R(3, 13, 11, 3, '#2a2018');
        R(-14, -34, 46, 14, '#2a4a2c'); R(-10, -38, 36, 6, '#345a34'); R(-6, -24, 30, 6, '#2a4a2c');
        for (let i = 0; i < 14; i++) { const x = -14 + i * 3.4, l = 14 + (i * 7) % 14, w = Math.sin(t * 1.4 + i) * 1.5; R(x + w, -22, 1, l, i % 2 ? '#3a6a3a' : '#2e5a30'); }
      },
      madeng(g, e, t, R) { R(7, -14, 2, 30, '#4a3a2a'); R(9, -14, 5, 1, '#4a3a2a'); R(11, -13, 4, 6, '#2a2a2a'); R(12, -12, 2, 4, e.off ? '#4a3a2a' : '#ffd890'); R(3, 14, 10, 2, '#2a2018'); },
      zao(g, e, t, R) {
        box(R, 0, 2, 16, 13, '#8a5a3a'); R(1, 3, 14, 2, '#a06a48'); R(5, 9, 6, 5, '#1a0c08'); R(6, 11, 4, 2, '#c84a1a');
        R(2, -1, 12, 4, '#2a2a2a'); R(3, -2, 10, 1, '#4a4a4a');
        for (let i = 0; i < 3; i++) { const y = -4 - ((t * 10 + i * 6) % 14); R(4 + i * 3 + Math.sin(t * 2 + i), y, 2, 2, `rgba(230,230,230,${.35 - ((t * 10 + i * 6) % 14) / 50})`); }
      },
      chest(g, e, t, R) { box(R, 1, 5, 14, 10, '#6a4a2a'); R(1, 5, 14, 3, '#7a5a34'); R(7, 8, 2, 2, '#c8a050'); R(2, 10, 12, 1, '#5a3a22'); },
      jar(g, e, t, R) { R(4, 4, 8, 10, '#6a3a1e'); R(3, 6, 10, 6, '#7a4628'); R(5, 2, 6, 3, '#5a301a'); R(5, 7, 6, 4, '#c82a20'); R(7, 8, 2, 2, '#f0d040'); R(4, 1, 8, 2, '#d8c8a0'); },
      aidoor(g, e, t, R) {
        R(1, -2, 14, 18, '#3a2416'); R(2, -1, 12, 17, '#5a3a22'); R(7, -1, 2, 17, '#3a2416'); R(5, 6, 1, 2, '#c8a050'); R(10, 6, 1, 2, '#c8a050');
        R(0, -5, 16, 3, '#2a1a10'); R(4, -4, 8, 2, '#b8202a');
        if (e.ai) {
          for (let i = 0; i < 4; i++) { R(-1 + i, -6 + i, 1, 12, '#4a7a3a'); R(14 - i, -6 + i, 1, 12, '#3a6a2e'); }
          R(-2, -8, 3, 4, '#5a8a44'); R(15, -8, 3, 4, '#5a8a44'); R(0, 4, 2, 1, '#c8202a'); R(14, 4, 2, 1, '#c8202a');
        }
      },
      clothes(g, e, t, R) { R(1, -12, 1, 27, '#5a4a2a'); R(30, -12, 1, 27, '#5a4a2a'); R(1, -11, 30, 1, '#8a7a5a'); const w = Math.sin(t * 2) > 0 ? 1 : 0; R(5 + w, -10, 6, 7, '#e8e0c8'); R(13, -10, 5, 9, '#5a7aa0'); R(20 + w, -10, 7, 6, '#c8a0b0'); },
      notice(g, e, t, R) { R(2, 0, 2, 15, '#4a3a22'); R(12, 0, 2, 15, '#4a3a22'); box(R, 0, -12, 16, 13, '#7a6a4a'); R(2, -10, 7, 9, '#e8e0c8'); R(10, -10, 4, 5, '#e8d0a0'); R(3, -8, 5, 1, '#3a3a3a'); R(3, -6, 4, 1, '#3a3a3a'); R(3, -4, 5, 1, '#c82a20'); },
      photo2(g, e, t, R) { box(R, 1, 4, 14, 10, '#7a5a3a'); R(4, 1, 8, 6, '#3a2a1a'); R(5, 2, 6, 4, '#c8c0a8'); R(6, 3, 1, 2, '#3a3a3a'); R(9, 3, 1, 2, '#3a3a3a'); R(5, 3, 6, 1, '#b8141c'); },
      tudi(g, e, t, R) { R(0, -5, 16, 3, '#5a2a1a'); R(-1, -6, 18, 1, '#7a3a22'); box(R, 1, -2, 14, 16, '#8a7a66'); R(4, 0, 8, 8, '#2a1a10'); R(6, 2, 4, 5, '#c84030'); R(5, 9, 6, 2, '#6a4a2a'); R(7, 6 + Math.sin(t * 2), 1, 2, 'rgba(220,220,220,.4)'); },
      gongde(g, e, t, R) { R(1, -2, 14, 16, '#9a1a1a'); R(2, -1, 12, 14, '#b8282a'); for (let i = 0; i < 5; i++) R(3, 1 + i * 2.5, 10 - (i % 2) * 3, 1, '#e8c060'); R(2, 9, 12, 4, '#c8b890'); R(3, 10, 8, 1, '#5a4a3a'); },
      memorial(g, e, t, R) {
        box(R, 0, 4, 16, 11, '#5a3a22'); R(1, 5, 14, 2, '#6a4a2a');
        R(4, -6, 8, 11, '#1a1410'); R(5, -5, 6, 8, '#c8c4b4'); R(6, -4, 4, 4, '#8a8478'); R(6, -5, 4, 1, '#2a2420'); R(5, -2, 6, 1, '#7a1a1a');
        R(1, 2, 4, 3, '#8a8a8a'); R(1, 2, 4, 1, '#a8a8a8'); R(12, 2, 3, 2, '#6a8a3a'); R(11, 3, 4, 2, '#5a7a30');
      },
      longzhou(g, e, t, R) {
        R(0, 6, 96, 6, '#7a1a14'); R(2, 4, 92, 3, '#a8241c'); R(4, 12, 88, 2, '#4a0e0a');
        for (let i = 0; i < 10; i++) { R(12 + i * 8, 3, 2, 2, '#e8c050'); R(12 + i * 8, 13, 1, 4, '#8a6a3a'); }
        R(-6, -6, 14, 14, '#c8202a'); R(-8, -4, 4, 6, '#c8202a'); R(-4, -8, 8, 3, '#b81a22'); R(-2, -2, 2, 2, '#f0c040');   // 蒙着红布的龙头
        R(92, 0, 6, 8, '#a8241c'); R(94, -4, 3, 5, '#e8c050');
        R(20, -2, 8, 7, '#b88a3a'); R(21, -1, 6, 5, '#d8aa4a'); R(26, 2, 2, 1, '#2a1a10');   // 船头的铜锣，缺一个口
      },
      drum(g, e, t, R) { R(2, 8, 2, 7, '#4a2a18'); R(12, 8, 2, 7, '#4a2a18'); R(1, 0, 14, 10, '#9a2a1a'); R(2, 0, 12, 2, '#e8d8b0'); R(1, 9, 14, 1, '#5a1a10'); for (let i = 0; i < 5; i++) R(2 + i * 3, 3, 1, 1, '#e8c050'); },
      longboat(g, e, t, R) {
        const b = Math.sin(t * 6 + e.px) > 0 ? 1 : 0;
        R(0, 8, 64, 5, '#8a1a14'); R(2, 6, 60, 3, '#c8302a'); R(4, 13, 56, 1, 'rgba(220,240,240,.5)');
        R(-6, 0, 10, 10, '#d8a020'); R(-8, 2, 4, 3, '#d8a020'); R(-4, 2, 2, 2, '#1a1a1a'); R(60, 2, 5, 6, '#c8302a');
        for (let i = 0; i < 7; i++) { R(8 + i * 7, 1 + b, 4, 5, i % 2 ? '#e8e0c8' : '#d8b890'); R(8 + i * 7, 6, 1, 6 + (b ? 1 : -1), '#6a4a2a'); }
        R(6, -2 + b, 4, 6, '#ecece0'); R(5, -3, 6, 2, '#b8141c');
      }
    },
    tiles: {
      pier: { solid: false, paint(R, X, Y) { R(0, 0, 16, 16, '#123a3c'); R(0, 0, 16, 15, '#5a4630'); for (let y = 0; y < 16; y += 4) { R(0, y, 16, 1, '#2a1e14'); R(0, y + 1, 16, 1, '#6a5438'); } R(2 + (X % 2) * 8, 0, 1, 16, '#3a2c1e'); if (hash(X, Y, 4) < .4) R((hash(X, Y, 5) * 12) | 0, 6, 3, 1, 'rgba(120,170,170,.25)'); } },
      jie: { solid: false, paint(R, X, Y) { const wet = Y >= 7; R(0, 0, 16, 16, wet ? '#4a5650' : '#6a6e66'); R(0, 0, 16, 2, wet ? '#5a6a62' : '#7e827a'); R(0, 14, 16, 2, '#2e3632'); for (let i = 0; i < 4; i++) R((hash(X, Y, 10 + i) * 14) | 0, 4 + i * 2, 3, 1, '#565a52'); if (wet) { R(0, 10, 16, 4, '#3a5a44'); R((hash(X, Y, 3) * 10) | 0, 9, 4, 1, '#4a7a50'); } } },
      xiyi: { solid: false, paint(R, X, Y) { R(0, 0, 16, 16, '#1b3149'); R(1, 2, 14, 12, '#6e746c'); R(2, 1, 12, 2, '#828a80'); R(2, 3, 10, 2, '#9aa298'); R(1, 13, 14, 1, '#3a4040'); R(3, 7, 8, 1, '#5e6460'); } }
    },
    maps: {
      /* ---------------- 外婆家 · 村道（端午下午） ---------------- */
      village: {
        amb: 'wind', dark: .08, plr: 4, floor: 'dirt', wall: 'mud',
        tileOpts: { grassC: '#3a5a2e', treeC: '#244a28', fenceBase: 'grass' },
        rows: [
          'T##########TTT#########T',
          'T##########TTT#########T',
          'TkkkkkkkkkkdddkkkkkkkkkT',
          'TkkkkkkkkkkdddkkkkkkkkkT',
          'TkkkkkkkkkkdddkkkkkkkkkT',
          'Tff"ffffffffdffff"fffffT',
          'T""d""""""""d""""d"""""T',
          'Tddddddddddddddddddddd"T',
          'T"""""""""dddd"""""""""T',
          'TTTB"""""""dd""""""BTTTT',
          'TTTTTT"""""dd"""""TTTTTT',
          'TTTTTTTTT""dd""TTTTTTTTT',
          'TTTTTTTTTT"dd"TTTTTTTTTT',
          'TTTTTTTTTTTddTTTTTTTTTTT'],
        ents: [
          { id: 'door', x: 5, y: 1, spr: 'aidoor', async on(S) {
            const e = S.ent('door');
            if (e.s.ai) return S.narr('门框上插着艾草和菖蒲，风一吹，满院子苦香。');
            if (!S.has('aicao')) return S.narr('堂屋的木门。门框两边各钉着一颗钉子，等着挂东西。');
            S.take('aicao'); e.s.ai = true; S.sfx('item');
            await S.narr('你把艾草和菖蒲一左一右插在门框上。\n外婆说，菖蒲像剑，艾草像旗，五月里的邪祟见了，都要绕道走。');
            S.face('waipo', 'pl');
            await S.say('外婆', '挂得好。手伸出来。');
            S.give('wucai');
            await S.narr('外婆在你手腕上系了一根五彩绳——红黄蓝白黑，五股丝线拧在一起。');
            await S.say('外婆', ['戴着，莫摘。有它在，水里的东西近不了你的身。\n等端午过了，落第一场雨，再剪下来丢到河里，让水把灾带走。', '粽子煮好了。这一串，你给渡口的三叔公送去；剩下两个，供到河边的龙王庙。']);
            S.give('zongzi'); S.give('torch');
            await S.say('外婆', ['天黑前回来。手电带上，河边路黑。', '还有——河边要是有人喊你名字，莫应。不管喊得多像，莫应。']);
            S.goal('把粽子送去渡口给三叔公（村道往南）');
          } },
          { x: 8, y: 1, spr: 'window', on: S => S.narr('堂屋的窗户。窗台上摆着一排晒干的艾草，是去年的。') },
          { x: 17, y: 1, spr: 'door', on: S => S.narr('桂芬婶家的门。门上也挂了艾草，还贴着一张小小的红纸老虎。') },
          { x: 20, y: 1, spr: 'window', on: S => S.narr('窗户里飘出雄黄酒的味道，冲鼻子。') },
          { id: 'waipo', x: 6, y: 3, spr: '@waipo', dir: 0, async on(S) {
            S.face('waipo', 'pl');
            if (!S.ent('door').s.ai) return S.say('外婆', '艾草在篮子里，挂到堂屋门上去。');
            await S.say('外婆', ['快去快回。', '……莫应啊。']);
          } },
          { x: 2, y: 3, spr: 'zao', light: { r: 1.6, col: 'rgba(255,140,60,.14)', flick: true }, on: S => S.narr('灶上的大锅咕嘟咕嘟煮着粽子，粽叶的清香混着柴火烟。\n外婆包的是碱水粽，要蘸白糖吃。') },
          { id: 'basket', x: 3, y: 3, spr: 'basket', async on(S) {
            if (S.ent('door').s.ai || S.has('aicao')) return S.narr('篮子里只剩几片碎叶子。');
            S.give('aicao');
            await S.narr('一篮子新割的艾草和菖蒲，叶子上还带着露水，苦香苦香的。');
            S.goal('把艾草和菖蒲挂到堂屋门上');
          } },
          { x: 4, y: 3, spr: 'jar', on: S => S.narr('一坛雄黄酒，坛口封着红纸。\n早上外婆给隔壁小芸的额头点了个「王」字——老虎是百兽之王，五毒见了就跑。') },
          { x: 8, y: 3, spr: 'photo2', async on(S) {
            await S.narr('小方桌上压着一张褪色的照片：两个光脚的男孩蹲在河埠头上，一个瘦瘦黑黑，额头扎着红布条，冲镜头比划着什么。\n背面是外婆的字：「禾禾和春生　一九八六年端午」。');
            if (S.once('photoThink')) await S.think('春生……\n我九岁那年的端午，就是和他一起过的。后来呢？后来……我怎么一点也想不起来了。');
          } },
          { id: 'box', x: 1, y: 4, spr: 'chest', async on(S) {
            if (S.f.gotStone) return S.narr('旧木箱里是你小时候的东西：弹珠、连环画、一只缺了口的哨子。');
            S.f.gotStone = true; S.give('stone');
            await S.narr('屋檐下的旧木箱。外婆说，里头都是你小时候落在这儿的东西。\n弹珠、连环画……还有一块扁扁的青石片，磨得溜光，边上有一道白纹。');
            await S.think('……这是哪来的？不记得了。');
          } },
          { x: 10, y: 4, spr: 'well', on: S => S.narr('井口盖着木板。外婆说，端午正午打的井水叫「午时水」，洗了眼睛，一年都亮。') },
          { x: 12, y: 2, spr: 'tudi', light: { r: 1.2, col: 'rgba(255,120,70,.12)', flick: true }, on: S => S.narr('村头的小土地庙，半人高。香炉里插着三支新香。\n外婆说，土地爷管着这一方水土——河里的事，他也知道。') },
          { id: 'guifen', x: 19, y: 3, spr: '@guifen', dir: 0, async on(S) {
            S.face('guifen', 'pl');
            await S.say('桂芬婶', ['阿禾回来啦？哎呀，大小伙子了。', '你小时候跟春生两个，天天泡在河埠头，把你外婆急得哟。']);
            await S.say('桂芬婶', ['春生走那年，你才九岁吧。……今天正好十年。', '我给小芸做了条红裙子，你外婆非说端午不能穿红的。迷信。']);
          } },
          { id: 'yun', x: 16, y: 4, spr: '@yun', dir: 0, async on(S) {
            S.face('yun', 'pl');
            await S.say('小芸', ['阿禾哥！你看我的新裙子！我妈做的，红的！']);
            await S.say('小芸', ['昨天我在河边捡到一个红皮球。河里有个哥哥说，那是他的球。', '他叫我晚上去河边，跟他一起玩。']);
            await S.say('小芸', '我妈不让我去。哼。');
            if (S.once('yunThink')) await S.think('河里的……哥哥？');
          } },
          { x: 21, y: 3, w: 2, spr: 'clothes', on: S => S.narr('竹竿上晾着几件小孩衣裳。风一吹，袖子朝着河那边飘。') },
          { id: 'notice', x: 14, y: 8, spr: 'notice', async on(S) { await S.note('notice'); } },
          ...[11, 12].map(x => ({ x, y: 13, spr: 'invisible', async touch(S) {
            if (!S.has('zongzi') && !S.f.metSan) { await S.narr('外婆还在院子里等你帮忙挂艾草呢。'); return S.pos(x, 12, 3); }
            await S.go('river', 15, 14, 3);
          } }))
        ],
        async enter(S, first) {
          if (!first) return;
          S.f.ph = 'day';
          S.face('waipo', 'pl');
          await S.say('外婆', ['禾禾！可算到了——', '让外婆看看。哎呀，长这么高了。']);
          await S.say('外婆', '你这孩子，怎么穿件红的？快去换了。');
          await S.say('你', '红的怎么了？');
          await S.say('外婆', ['今天端午。红衣裳莫往河边穿。', '老辈人讲，水里那个东西眼神不好，就认得红——穿红的，它隔老远都看得见。']);
          await S.fade(1, 400); S.wear('@me2'); await S.fade(0, 400);
          await S.narr('你回屋换了件白汗衫。外婆这才点了头。');
          await S.say('外婆', ['隔壁小芸天天念叨，城里的阿禾哥要回来了。', '上午龙舟都划完了，你没赶上。门上的艾草，外婆特意留着等你挂。']);
          S.goal('把篮子里的艾草和菖蒲挂到堂屋门上');
        }
      },

      /* ---------------- 回龙湾 ---------------- */
      river: {
        amb: 'river', dark: .5, plr: 3.6, floor: 'dirt', floor2: 'stone',
        legend: RLEG,
        tileOpts: { grassC: '#2a4a2c', treeC: '#183a22' },
        rows: RIVER_ROWS,
        ents: [
          ...[0, 3, 6, 9, 12, 15, 18, 21, 24, 27].map(x => ({ x, y: 2, w: 3, h: 6, spr: 'flow', decal: true, solid: false })),
          { id: 'sun', x: 14, y: 2, w: 3, h: 6, spr: 'sunw', decal: true, solid: false, light: { r: 5, col: 'rgba(255,150,70,.16)', dx: 24, dy: 30 } },
          { id: 'moon', x: 15, y: 3, spr: 'moonw', decal: true, solid: false, hidden: true, light: { r: 4, col: 'rgba(200,210,190,.06)', a: .45 } },
          { x: 12, y: 7, w: 2, spr: 'boat', solid: false },
          { id: 'san', x: 10, y: 7, spr: '@san', dir: 2, on: S => sanTalk(S) },
          { id: 'shed', x: 5, y: 13, w: 2, spr: 'shed', s: { buoy: true }, on: S => shed(S) },
          { x: 16, y: 10, spr: 'willow', on: S => S.narr('老柳树的枝条一直垂到水面上。\n小时候，你和春生就是从这根最低的枝上往河里跳的。') },
          { id: 'madeng', x: 12, y: 10, spr: 'madeng', light: { r: 3, col: 'rgba(255,200,120,.14)', flick: true }, on: S => S.narr('码头边竖着一根竹竿，挂着三叔公的马灯。\n灯罩被熏黑了一半。') },
          { x: 13, y: 10, spr: 'sign', col: '#a83a2a', on: S => S.narr('红漆木牌：「回龙湾　水深流急　严禁游泳」。\n牌子底下有人摆了一个粽子，已经馊了。') },
          { x: 1, y: 12, spr: 'sign', col: '#5a3a22', on: S => S.narr('木牌：龙王庙 ←\n回龙湾的龙王庙不大，供的是这一湾水。') },
          { x: 21, y: 12, spr: 'invisible', solid: true, on: S => S.narr('一丛野蔷薇，开着细碎的白花。') },
          { x: 8, y: 9, spr: 'invisible', solid: false, on: S => S.narr(S.f.ph === 'dusk' ? '水是往东流的。夕阳把整湾水染成了铁锈色。' : '黑漆漆的水，往东流着。水声里好像有人在小声说话。') },
          { id: 'sA', x: 11, y: 6, spr: 'wetprint', decal: true, solid: false, on: S => spot(S, 'A') },
          { id: 'sB', x: 19, y: 7, spr: 'wetprint', decal: true, solid: false, on: S => spot(S, 'B') },
          { id: 'sC', x: 4, y: 8, spr: 'wetprint', decal: true, solid: false, on: S => spot(S, 'C') },
          { id: 'sD', x: 26, y: 8, spr: 'wetprint', decal: true, solid: false, on: S => spot(S, 'D') },
          { id: 'yA', x: 11, y: 4, spr: '@yunw', dir: 0, hidden: true, solid: false, light: { r: 1.2, col: 'rgba(200,220,220,.08)' } },
          { id: 'yB', x: 19, y: 5, spr: '@yunw', dir: 0, hidden: true, solid: false, light: { r: 1.2, col: 'rgba(200,220,220,.08)' } },
          { id: 'yC', x: 4, y: 6, spr: '@yunw', dir: 0, hidden: true, solid: false, light: { r: 1.2, col: 'rgba(200,220,220,.08)' } },
          { id: 'yD', x: 26, y: 6, spr: '@yunw', dir: 0, hidden: true, solid: false, light: { r: 1.2, col: 'rgba(200,220,220,.08)' } },
          { id: 'rA', x: 11, y: 4, spr: 'ripple', hidden: true, solid: false, z: 1, s: { k: 'slap' } },
          { id: 'rB', x: 19, y: 5, spr: 'ripple', hidden: true, solid: false, z: 1, s: { k: 'shout', refl: 1 } },
          { id: 'rC', x: 4, y: 6, spr: 'ripple', hidden: true, solid: false, z: 1, s: { k: 'still', refl: 1 } },
          { id: 'rD', x: 26, y: 6, spr: 'ripple', hidden: true, solid: false, z: 1, s: { k: 'slap', refl: 1 } },
          { id: 'ball', x: 6, y: 5, spr: 'ball', hidden: true, solid: false },
          { id: 'gui', x: 27, y: 3, spr: 'shuigui', hidden: true, solid: false, light: { r: 1.5, col: 'rgba(100,200,180,.18)' }, s: { st: 'off', t: 0 } },
          { id: 'yun', x: 26, y: 8, spr: '@yun', hidden: true, dir: 0 },
          { id: 'guifen', x: 26, y: 11, spr: '@guifen', hidden: true, dir: 3 },
          { id: 'chun', x: 19, y: 6, spr: '@chun', hidden: true, solid: false, light: { r: 1.8, col: 'rgba(160,220,210,.14)' } },
          { x: 0, y: 11, spr: 'invisible', async touch(S) {
            const ph = S.f.ph;
            if (ph === 'dusk' && !S.f.metSan) { await S.narr('先把粽子送给码头上的三叔公。'); return S.pos(1, 11, 2); }
            if (ph === 'night') { await S.narr('小芸还在水里！'); return S.pos(1, 11, 2); }
            if (ph === 'final') { await S.think('……他在河埠头等你。'); return S.pos(1, 11, 2); }
            await S.go('temple', 7, 9, 3);
          } },
          ...[14, 15, 16, 17].map(x => ({ x, y: 15, spr: 'invisible', async touch(S) {
            const ph = S.f.ph;
            const msg = ph === 'night' ? '小芸还在水里！' : ph === 'final' ? '……他在河埠头等你。' : S.f.metSan ? '外婆交代的粽子，还有两个要供到龙王庙（往西）。' : '先把粽子送给码头上的三叔公。';
            await S.narr(msg); S.pos(x, 14, 3);
          } }))
        ],
        async enter(S, first) {
          const f = S.f;
          if (S.has('torch')) S.plr(f.ph === 'dusk' || first ? 3.6 : 3.8);
          if (first) {
            f.ph = 'dusk';
            await S.narr('回龙湾。\n青溪在这里拐了个大弯，水一下子慢了，绿得发黑。');
            await S.narr('太阳快落山了。码头上，一个戴草帽的老人在钓鱼。');
            S.goal('把粽子交给码头上的三叔公');
            S.cp('dusk');
            return;
          }
          if (f.ph === 'night' && !f.nightIn) {
            f.nightIn = true; S.dark(.88); S.show('moon'); S.hide('san');
            for (const k in SPOT) { S.show(SPOT[k].girl); S.show(SPOT[k].rip); S.ent('s' + k).s.glow = 1; }
            S.hide('sun'); S.sfx('splash');
            await S.narr('回龙湾黑得像一口井。');
            for (const [x, y] of [[11, 4], [19, 5], [4, 6], [26, 6]]) { S.focus(x, y); await S.wait(650); }
            S.focus(15, 5);
            await S.narr('码头尽头的木桩上、河埠头的石阶下、洗衣石边、东头的芦苇丛里——\n四个穿红裙子的小女孩，泡在水里。');
            await S.think('……四个。水里有四个小芸。\n四条红裙子。外婆说过：穿红的，它隔老远都看得见。');
            S.place('gui', 27, 3); S.ent('gui').s = { st: 'swim', t: 0 }; S.focus(26, 4);
            gurgle(S, .8);
            await S.narr('下游的水面上，有一道波纹，逆着水，慢慢朝岸边游过来。');
            S.focus(null);
            await S.think('它够得着的，只有挨着水的那一排：岸边、码头、石阶、洗衣石。\n走在后面的小路上，它就够不着。');
            await S.think(S.has('buoy') ? '不能下水。……对照三叔公的本子，认出真的那个。' : '得先去三叔公的棚屋拿救生圈。……绝对不能下水。');
            S.goal(S.has('buoy') ? GOAL_FIND : GOAL_BUOY);
            S.cp('night');
            startDanger(S, false);
          }
        },
        step(S, x, y) {
          const f = S.f;
          if (f.ph === 'dusk' && f.metSan && !f.lured && x <= 8 && y >= 9 && y <= 12) return duskLure(S);
          if (f.ph === 'final' && !f.fin && x >= 18 && x <= 19 && y >= 7 && y <= 9) return finale(S);
        },
        tick(S, dt) {
          const f = S.f;
          ghostTick(S, dt);
          if (!f.danger) return;
          const gu = S.ent('gui');
          if (gu && gu.s.st === 'swim') {   // 离你 3 格以内，水底下咕嘟咕嘟，越近越响
            const gd = Math.abs(gu.x - W.pl.x) + Math.abs(gu.y - W.pl.y);
            f._gg = (f._gg ?? 0) - dt; if (gd <= 3 && f._gg <= 0) { f._gg = 1.3; gurgle(S, clamp(1.2 - gd * .28, .3, 1)); }
          }
          if (!S.busy) {
            f._dt = (f._dt || 0) + dt;
            if (f._dt > 30 && !f.nudge1 && !'ABCD'.split('').some(k => f['seen' + k])) { f.nudge1 = true; S.run(S => S.think('……光在小路上看不清。\n码头尽头、石阶、洗衣石、苇丛缺口——岸边有湿脚印的地方，才看得清水里。')); }
            else if (f._dt > 60 && !f.nudge2 && !f.wrong) { f.nudge2 = true; S.run(S => S.think('三叔公的本子上写着……真落水的人，喊不出声，只会拍水。')); }
          }
          f._cry = (f._cry ?? 3) - dt;
          if (f._cry <= 0) {   // 四个声音：远近用音量区分
            f._cry = 3.2 + Math.random() * 2.5;
            const ks = Object.keys(SPOT).filter(k => !(f.gone && f.gone[k]) && k !== 'C');
            const k = ks[(Math.random() * ks.length) | 0], sp = SPOT[k]; if (!sp) return;
            const d = Math.abs(W.pl.x - sp.g[0]) + Math.abs(W.pl.y - sp.g[1]), v = clamp(1 - d / 18, .12, 1);
            if (k === 'B') { cry(S, v); S.bubble(sp.girl, '!', 1400); }
            else { slap(S, v); S.bubble(sp.girl, '…', 1200); }
          }
        }
      },

      /* ---------------- 龙王庙 ---------------- */
      temple: {
        amb: 'drone', dark: .55, plr: 3.2, floor: 'stone', wall: 'wood',
        rows: [
          '################',
          '################',
          '#..............#',
          '#..............#',
          '#..............#',
          '#..............#',
          '#..............#',
          '#..............#',
          '#..............#',
          '#..............#',
          '#######..#######'],
        ents: [
          { x: 7, y: 2, w: 2, spr: 'statue', on: S => S.narr('龙王像的脸被香火熏得乌黑，一双眼睛却描得雪亮。\n供桌上方挂着一块匾：「泽被一湾」。') },
          { id: 'altar', x: 7, y: 3, w: 2, spr: 'altar', light: { r: 2.6, col: 'rgba(255,170,80,.18)', flick: true }, async on(S) {
            const f = S.f;
            if (f.offered) return S.narr('供桌上摆着你供的两个粽子，香灰落了一层。');
            if (!S.has('zongzi2')) return S.narr('供桌上香火正旺。');
            S.take('zongzi2'); f.offered = true; S.sfx('item');
            await S.narr('你把两个粽子摆上供桌，学外婆的样子拜了三拜。');
            await S.think('外婆说，粽子丢进江里，是喂鱼虾的——让它们吃粽子，别去咬屈原。');
            if (!f.readEssay) S.goal('庙里右边的小桌上，供着谁的照片');
            await maybePast(S);
          } },
          { x: 3, y: 1, spr: 'gongde', on: S => S.narr('红纸功德榜贴了好几层。最底下一张旧得发黄：\n「一九八六年端午　龙舟竞渡……午后舟至回龙湾，遇暗流，舟覆。众皆获救，唯锣手春生，年十四，没于湾中。」') },
          { x: 12, y: 1, spr: 'scroll', on: S => S.narr('墙上挂着一幅褪色的画：一个戴高冠的人，站在江边，衣带飘飘。\n旁边写着「屈子行吟」。') },
          { id: 'mem', x: 12, y: 3, spr: 'memorial', light: { r: 1.6, col: 'rgba(255,170,80,.12)', flick: true }, async on(S) {
            const f = S.f;
            await S.narr('小桌上立着一张黑白照片：一个额头扎红布条的瘦男孩，咧着嘴笑。\n照片前摆着一碟粽子，一个铁皮文具盒。');
            await S.note('essay'); f.readEssay = true;
            if (!f.offered) { await S.think('……先把外婆的粽子供上吧。'); S.goal('把粽子供到龙王像前'); }
            await maybePast(S);
          } },
          { x: 2, y: 6, w: 6, spr: 'longzhou', async on(S) {
            await S.narr('上午刚赛完的龙舟搁在木架上，船身还是湿的。龙头蒙着红布，红布底下露出一只金色的龙眼睛。\n船头那面铜锣，边上缺了一个口。');
            if (S.once('gongThink')) await S.think('船头打锣的位置……春生那年，就坐在那里。');
          } },
          { x: 12, y: 7, spr: 'drum', async on(S) {
            drum(S, 1, 0); drum(S, 1, .45); drum(S, 1, .9);
            await S.narr('「咚、咚、咚。」\n鼓声在小庙里嗡嗡地回荡。');
            if (S.once('drumEcho')) { await S.wait(500); drum(S, .35, 0); drum(S, .35, .45); drum(S, .35, .9); await S.narr('……河那边，好像也有什么，跟着敲了三下。'); }
          } },
          { x: 2, y: 3, spr: 'candles', light: { r: 1.6, col: 'rgba(255,170,80,.14)', flick: true }, on: S => S.narr('一排蜡烛，有的已经烧到了底。') },
          { x: 13, y: 9, spr: 'shelf', on: S => S.narr('架子上堆着龙舟会的桨，每一支桨柄上都刻着名字。\n有一支桨上的名字被人用红漆描过：春生。') },
          { id: 'guifen', x: 7, y: 9, spr: '@guifen', hidden: true, dir: 3 },
          ...[7, 8].map(x => ({ x, y: 10, spr: 'invisible', async touch(S) {
            if (S.f.ph === 'templeNight') { S.f.ph = 'night'; S.f.nightIn = false; }
            await S.go('river', 1, 11, 2);
          } }))
        ],
        async enter(S, first) {
          const f = S.f;
          if (first) {
            await S.narr('龙王庙不大，一进门就是香灰和桐油的味道。\n上午刚赛完的龙舟搁在木架上，龙头上还蒙着红布。');
            S.goal('把粽子供到龙王像前');
          }
          if (f.ph === 'templeNight' && !f.tnDone) {
            f.tnDone = true; S.dark(.82);
            await S.narr('……你回过神来。\n天已经黑透了。供桌上的蜡烛，烧下去了一大截。');
            S.place('guifen', 7, 10, 3);
            await S.walk('guifen', [8, 7], 6);
            await S.say('桂芬婶', ['阿禾！看见小芸没有？', '我一转身她就不见了！穿着那条红裙子……说河里有个哥哥，叫她去玩球……']);
            await S.say('你', '……回龙湾！');
            await S.say('桂芬婶', '我去喊人！你先去——');
            await S.walk('guifen', [7, 10], 6); S.hide('guifen');
            S.goal('快去回龙湾！');
          }
        }
      },

      /* ---------------- 1986 年端午 · 回龙湾（回忆） ---------------- */
      past: {
        amb: 'river', dark: .04, plr: 4, floor: 'dirt', floor2: 'stone',
        legend: RLEG,
        tileOpts: { grassC: '#3a6a34', treeC: '#245a2c' },
        rows: RIVER_ROWS,
        ents: [
          ...[0, 3, 6, 9, 12, 15, 18, 21, 24, 27].map(x => ({ x, y: 2, w: 3, h: 6, spr: 'flow', decal: true, solid: false })),
          { id: 'lz1', x: 2, y: 3, w: 4, spr: 'longboat', solid: false },
          { id: 'lz2', x: 16, y: 4, w: 4, spr: 'longboat', solid: false },
          { x: 12, y: 7, w: 2, spr: 'boat', solid: false },
          { x: 16, y: 10, spr: 'willow' },
          { id: 'chunk', x: 18, y: 8, spr: '@chunk', dir: 0, on: S => pastTalk(S) },
          { x: 13, y: 11, spr: '@waipo', dir: 3, on: S => S.say('外婆', '禾禾，莫往水边去！看龙舟就在这儿看。') },
          { x: 8, y: 11, spr: '@v1', dir: 3, on: S => S.say('看龙舟的人', '今年肯定是我们柳湾的船赢！') },
          { x: 9, y: 11, spr: '@v3', dir: 3, on: S => S.say('小孩', '加油——加油——') },
          { x: 22, y: 11, spr: '@v2', dir: 3, on: S => S.say('看龙舟的人', '春生那伢子，又跑去河埠头打水漂了。') },
          { x: 24, y: 11, spr: '@v1', dir: 3, on: S => S.narr('一个大人把小孩扛在肩上，小孩手里攥着一个咬了一半的粽子。') }
        ],
        async enter(S) {
          S.wear('@kid');
          await S.card('一九八六年　端午', '回龙湾', '……锣鼓声。\n满河都是锣鼓声。\n\n那年我九岁。');
          await S.fade(0, 600);
          S.goal('去河埠头找春生');
        },
        tick(S, dt) {
          const f = S.f;
          for (const [id, sp] of [['lz1', 1.6], ['lz2', 1.2]]) { const e = S.ent(id); if (!e) continue; e.px += sp * TS * dt; if (e.px > RW * TS + 40) e.px = -80; }
          f._dr = (f._dr ?? 0) - dt;   // 「咚咚　咚——」的龙舟鼓点，每两小节一声锣；说话时轻一半
          if (f._dr <= 0) { f._db = ((f._db || 0) + 1) % 6; f._dr = [.24, .36, .6][f._db % 3]; const v = S.busy ? .22 : .45; drum(S, f._db % 3 === 2 ? v * .75 : v); if (f._db === 0) gong(S, v * .8); }
        }
      }
    }
  });
})();
