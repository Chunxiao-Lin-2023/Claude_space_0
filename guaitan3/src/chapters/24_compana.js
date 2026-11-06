/* ================= 第二十四夜 · 圣伴 ================= */
(() => {
  const cyc = (S, key, lines) => lines[(S.f[key] = ((S.f[key] ?? -1) + 1) % lines.length)];
  let LASTD = '';     // 上一次是怎么死的（重来时给针对性的提示）
  let DRAWW = 0;      // 画错星的总次数（跨死亡累计，用来逐级给提示）

  /* ================= 声音（S.tone 合成） ================= */
  function bell(S, v = .06) {   // 引路的小手铃：清、细、短
    S.tone('triangle', 1760, 1738, .26, v, 0, 7000); S.tone('sine', 3520, 3490, .15, v * .35, 0, 7000);
    S.tone('triangle', 1760, 1738, .2, v * .65, .14, 7000);
  }
  function churchBell(S) {   // 教区教堂的钟
    for (let i = 0; i < 3; i++) { S.tone('triangle', 392, 388, 1.3, .045, i * 1.1, 1600); S.tone('sine', 784, 778, .8, .018, i * 1.1, 2400); S.tone('sine', 196, 195, 1.5, .022, i * 1.1, 600); }
  }
  function chant(S, v = .02) {   // 路口的念经声：低、含糊、像风
    S.tone('sawtooth', 147, 145, .7, v, 0, 520); S.tone('sawtooth', 165, 159, .5, v * .8, .7, 520);
    S.tone('sawtooth', 147, 140, .6, v, 1.2, 480); S.tone('sine', 73, 73, 1.7, v * .6, 0, 300);
  }
  function drunkSong(S) { [392, 440, 494, 440, 392, 330, 392].forEach((f, i) => S.tone('triangle', f, f * (i % 2 ? 1.02 : .98), .2, .03, i * .24, 2600)); }
  function dogHowl(S, v = .022) { S.tone('sine', 520, 820, .5, v, 0, 2000); S.tone('sine', 820, 610, .9, v, .5, 2000); }
  function knock(S) { S.tone('triangle', 180, 120, .15, .08, 0, 900); S.tone('sine', 90, 60, .25, .07, 0, 500); }
  function chimeOK(S) { S.tone('sine', 1047, 1047, 1.2, .035, 0, 5000); S.tone('sine', 1319, 1319, 1.1, .028, .15, 5000); S.tone('sine', 1568, 1568, 1, .025, .3, 5000); }

  /* ================= 地图生成 ================= */
  const GR = (w, h, c) => [...Array(h)].map(() => Array(w).fill(c));
  const rect = (g, x0, y0, x1, y1, c) => { for (let y = Math.min(y0, y1); y <= Math.max(y0, y1); y++) for (let x = Math.min(x0, x1); x <= Math.max(x0, x1); x++) if (g[y] && x >= 0 && x < g[0].length) g[y][x] = c; };
  const poly = (g, pts, c) => { for (let i = 0; i + 1 < pts.length; i++) rect(g, pts[i][0], pts[i][1], pts[i + 1][0], pts[i + 1][1], c); };
  const rows = g => g.map(r => r.join(''));

  const ALDEA = (() => {
    const g = GR(28, 18, '"');
    rect(g, 0, 0, 27, 1, 'T'); rect(g, 0, 17, 27, 17, 'T'); rect(g, 0, 0, 1, 17, 'T'); rect(g, 26, 0, 27, 17, 'T');
    rect(g, 2, 10, 25, 10, 'k');                                     // 村里的石板路
    rect(g, 5, 5, 5, 9, 'k'); rect(g, 11, 5, 11, 9, 'k'); rect(g, 20, 9, 20, 9, 'k');
    rect(g, 16, 2, 24, 8, 'M'); rect(g, 17, 3, 23, 7, 'd'); g[8][20] = 'k';   // 墓园
    rect(g, 8, 11, 14, 14, 'k');                                     // 小广场
    g[11][4] = 'k';                                                  // 去谷仓
    rect(g, 22, 11, 22, 17, 'd');                                    // 老路入口
    [[15, 13], [17, 15], [3, 15], [25, 13], [7, 3], [14, 6], [2, 6], [24, 15], [19, 12]].forEach(([x, y]) => g[y][x] = 'T');
    return rows(g);
  })();

  /* 老路：主路 + 三处岔口的死路（岔口都要「拐弯」，直走是死路；亡灵龛的灯在该拐的那边） */
  const MAIN = [[3, 0], [3, 4], [10, 4], [10, 9], [17, 9], [17, 14], [24, 14], [24, 18], [20, 18], [20, 21], [28, 21], [28, 23]];
  const WRONGB = [
    { cells: [[11, 4], [12, 4], [13, 4]], fork: [10, 4], dir: 0 },
    { cells: [[17, 15], [17, 16], [17, 17]], fork: [17, 14], dir: 2 },
    { cells: [[19, 18], [18, 18]], fork: [20, 18], dir: 0 }
  ];
  const PETOS = [[2, 2], [9, 5], [19, 13], [21, 19]];
  const CORR = (() => {
    const g = GR(32, 24, 'M');
    poly(g, MAIN, 'v'); WRONGB.forEach(b => b.cells.forEach(([x, y]) => g[y][x] = 'v'));
    g[12][18] = 'v';                    // 路边石墙的凹处
    rect(g, 13, 9, 15, 9, 'u');         // 烂泥
    for (let y = 0; y < 24; y++) for (let x = 0; x < 32; x++) if (g[y][x] === 'M' && hash(x, y, 24) < .22) g[y][x] = 'T';
    PETOS.forEach(([x, y]) => g[y][x] = 'M');
    return rows(g);
  })();

  const CRUZ = (() => {
    const g = GR(19, 15, '"');
    rect(g, 0, 0, 18, 0, 'T'); rect(g, 0, 14, 18, 14, 'T'); rect(g, 0, 0, 0, 14, 'T'); rect(g, 18, 0, 18, 14, 'T');
    rect(g, 9, 0, 9, 5, 'd'); rect(g, 9, 11, 9, 14, 'd'); rect(g, 0, 8, 6, 8, 'd'); rect(g, 12, 8, 18, 8, 'd');
    rect(g, 7, 6, 11, 10, 'k');
    [[3, 3], [4, 2], [13, 4], [14, 3], [15, 4], [2, 12], [15, 12], [16, 11], [5, 11], [3, 6]].forEach(([x, y]) => g[y][x] = 'T');
    return rows(g);
  })();

  /* ================= 圣伴的行列 ================= */
  const SOULS = { corredoira: ['c0', 'c1', 'c2', 'c3', 'c4', 'c5'], encrucillada: ['e0', 'e1', 'e2', 'e3', 'e4', 'e5'] };
  const BASE = 2.5, TARGET = 5, SP = 1.15;
  /* TR：行列跟着走的「足迹」——玩家走过的每一格依次记下，领头的亡灵沿足迹走（s = 领头者在足迹上的位置） */
  let TR = null;
  function trPos(C, s) {
    const a = Math.max(0, Math.floor(s)), b = Math.min(C.length - 1, a + 1), k = s - a, A = C[Math.min(a, C.length - 1)], B = C[b];
    const d = B[0] > A[0] ? 2 : B[0] < A[0] ? 1 : B[1] > A[1] ? 0 : B[1] < A[1] ? 3 : null;
    return [(A[0] + (B[0] - A[0]) * k) * TS, (A[1] + (B[1] - A[1]) * k) * TS, d];
  }
  function placeSouls(S) {
    if (!TR) return;
    SOULS[TR.map].forEach((id, i) => {
      const e = S.ent(id); if (!e) return;
      const s = TR.s - i * SP;
      if (s < 0) { e.hidden = true; return; }
      const [px, py, d] = trPos(TR.cells, s);
      e.hidden = false; e.alpha = 1; e.px = px; e.py = py; e.x = Math.round(px / TS); e.y = Math.round(py / TS);
      if (d != null) e.dir = d;
      e.fr = TR.moving ? [1, 0, 3, 0][Math.floor(s * 4) % 4] : 0;
    });
  }
  function procStart(S, x, y, back, gap) {
    const cells = []; for (let i = 14; i >= 1; i--) cells.push([x + DIRS[back][0] * i, y + DIRS[back][1] * i]);
    cells.push([x, y]);
    TR = { map: S.map, cells, s: cells.length - 1 - gap, moving: false };
    placeSouls(S);
  }
  const gapNow = () => TR ? TR.cells.length - 1 - TR.s : 99;
  function creep(S, n, keep = 1.6) { if (!TR) return; TR.s = Math.max(TR.s, Math.min(TR.s + n, TR.cells.length - 1 - keep)); placeSouls(S); }
  function saveTrail(S) { S.f.trail = TR.cells.map(c => c.slice()); S.f.ts = TR.s; }

  function procTick(S, dt) {
    const f = S.f;
    if (!TR || TR.map !== S.map) return;
    const p = W.pl, C = TR.cells;
    if (!S.busy && !W.endScreen) {
      const L = C[C.length - 1];
      if (p.x !== L[0] || p.y !== L[1]) { const P2 = C[C.length - 2]; if (P2 && P2[0] === p.x && P2[1] === p.y) C.pop(); else C.push([p.x, p.y]); }
    }
    if (!f.procOn || S.busy || W.endScreen || W.ended) { TR.moving = false; placeSouls(S); return; }
    if (S.map === 'corredoira') {
      const b = WRONGB.find(b => b.cells.some(c => c[0] === p.x && c[1] === p.y));
      if (b) { f.procOn = false; S.run(S2 => lost(S2, b)); return; }
    }
    const gap = C.length - 1 - TR.s;
    if (f.holdT > 0) { f.holdT -= dt; TR.moving = false; }
    else { TR.s = Math.min(C.length - 1, TR.s + Math.min(6, BASE + Math.max(0, gap - TARGET) * 1.2) * dt); TR.moving = true; }
    placeSouls(S);
    const h = S.ent(SOULS[S.map][0]);
    if (!(f.holdT > 0) && h && !h.hidden && Math.abs(h.px - p.px) + Math.abs(h.py - p.py) < TS * 1.05) { f.procOn = false; S.run(caught); return; }   // 一格以内算追上（警告后的喘息时间里不算）
    const B = C[C.length - 2], fx = p.x + DIRS[p.dir][0], fy = p.y + DIRS[p.dir][1];
    if (B && fx === B[0] && fy === B[1]) { f.procOn = false; S.run(lookBack); return; }
    f._bell = (f._bell ?? 0) - dt; if (f._bell <= 0) { f._bell = .4 + Math.max(0, gap) * .14; bell(S, Math.max(.022, .1 - gap * .01)); }
    if (gap < 2.6) { f._ht = (f._ht ?? 0) - dt; if (f._ht <= 0) { f._ht = .75; S.sfx('heart'); } }
    f._dog = (f._dog ?? 7) - dt; if (f._dog <= 0) { f._dog = 13 + Math.random() * 8; dogHowl(S); }
  }

  async function caught(S) {
    const f = S.f;
    if (!f.warnStop) {
      f.warnStop = true; S.sfx('sting'); S.shake(300, 2); f.holdT = 1.6;
      await S.narr('一滴热蜡落在你的后颈上。\n有什么东西就贴在你背后——近得能听见蜡烛芯「噼」的一声。');
      await S.think('别停！停下来，他们就会从我身上走过去。');
      f.procOn = true; return;
    }
    LASTD = f.late ? 'pray' : 'stop';
    await S.scare('face', { face: 'alma', sfx: 'scream' });
    if (f.late) return S.die('念经声停了，你还站在圈外。\n烛光一圈一圈围上来。冰冷的手指把十字架从你手里接过去——\n往你空出来的手里，塞了一支蜡烛。', '没赶上念经的工夫');
    await S.die('你停下了。\n烛光从你肩膀两边涌过去，像水漫过一块石头。\n冰冷的手指把十字架从你手里接过去——\n往你空出来的手里，塞了一支蜡烛。', '你停了下来');
  }
  async function lookBack(S) {
    const f = S.f, C = TR.cells, A = C[C.length - 1], B = C[C.length - 2];
    const fd = DIRS.findIndex(d => d[0] === A[0] - B[0] && d[1] === A[1] - B[1]);
    S.pos(A[0], A[1], fd >= 0 ? fd : W.pl.dir);
    if (!f.warnLook) {
      f.warnLook = true; S.sfx('sting'); S.shake(300, 2);
      await S.narr('你的脖子刚转过去一半——\n眼角里，一排白色的兜帽，一齐停住了。');
      await S.think('别回头！（再回一次头，就没有下一次了。）');
      f.holdT = .8; f.procOn = true; return;
    }
    LASTD = 'look';
    await S.scare('face', { face: 'alma', sfx: 'scream' });
    await S.die('你回头了。\n最前面那顶兜帽慢慢抬起来。兜帽底下没有脸，只有一支蜡烛的光。\n「……谢谢你，替我们拿了这么久。」', '你回了头');
  }
  async function lost(S, b) {
    const f = S.f; f.lost = (f.lost || 0) + 1;
    S.sfx('sting');
    await S.narr(f.lost === 1 ? '……这边没有灯。\n前面是一堵长满青苔的石墙，路断了。' : '又走错了。脚下的路一下子窄得只剩石头。');
    await S.fade(1, 250);
    while (TR.cells.length > 2) { const c = TR.cells[TR.cells.length - 1]; if (c[0] === b.fork[0] && c[1] === b.fork[1]) break; TR.cells.pop(); }
    S.pos(b.fork[0], b.fork[1], b.dir);
    if (f.lost === 1) creep(S, 2.5, 2);
    else { creep(S, 99, 1.3); f.holdT = 1.4; }
    await S.fade(0, 250);
    if (f.lost === 1) await S.think('我没有回头——是背对着他们，一步一步倒退回岔口的。\n铃声近了很多。……要走有灯的那边。');
    else if (f.warnStop) {
      LASTD = 'lost';
      await S.scare('face', { face: 'alma', sfx: 'scream' });
      return S.die('你在死路尽头倒退回来，后背撞上了什么东西。\n软的，冷的，一排。\n烛光从你肩膀两边涌了过去。', '你走岔了路');
    } else { f.warnStop = true; await S.think('铃声就贴在后脑勺上——他们就在我背后一格！\n（再出一次错，就会被追上。有灯的那边！）'); }
    f.procOn = true;
  }

  /* ================= 亡灵递来的十字架 ================= */
  async function gateOn(S) {
    const e = S.ent('cancela'), f = S.f;
    if (e.open) return S.narr(f.ph === 'lane' ? '木栅门敞着。门柱上那块马蹄铁，在烛光里发着暗红的光。' : '一道木栅门，白天总是敞着。\n门柱上钉着一块生锈的马蹄铁，开口朝上——老人说，这样能兜住福气。');
    S.sfx('locked');
    await S.narr('一道木栅门横在路上——白天还是开着的。\n门闩上缠着湿草绳。你一只手举着十字架，只能用另一只手去解。');
    S.sfx('open'); e.open = true; e.solid = false;
    creep(S, 2.2, 1.8); bell(S, .09);
    await S.think('解开了。铃声近了。');
    f.procOn = true;
  }
  async function manuelN(S) {
    const f = S.f; f.metManuel = true;
    S.place('manuel_n', 17, 13, 3);
    drunkSong(S);
    await S.narr('前面的黑暗里，有人在唱歌。跑调的，含含糊糊的。\n一束手电筒的光晃了过来。');
    await S.say('曼努埃尔', ['哟……谁啊，这么晚……', '卢卡斯？你小子举着个啥？……后面那是……蜡烛？']);
    bell(S, .08);
    await S.narr('十字架在你手里突然变重了，重得手腕发酸。\n它往前倾，往曼努埃尔那边倾，像一条狗闻到了生人。');
    await S.say('', '……给他。', { style: 'whisper' });
    await S.think('只要递过去，他一接，我就自由了。\n就像安塞尔莫对我做的那样。');
    const r = await S.ask('曼努埃尔眯着眼，朝你伸出手：「啥呀，给我瞧瞧——」', ['把十字架递给他', '抱紧十字架：「别过来！趴下，脸朝下！」'], '卢卡斯');
    if (r === 0) return badHanded(S);
    await S.say('卢卡斯', '别过来！趴下，脸朝下，等他们过去！快！');
    await S.say('曼努埃尔', '你、你吓唬谁呢——');
    bell(S, .1);
    await S.narr('他看见了你身后的东西。\n手电筒「啪」地掉在地上，滚进了石墙根。');
    S.ent('manuel_n').light = null;
    await S.walk('manuel_n', [18, 12], 5);
    S.place('manuel_n', 18, 12, 0);   // 路被玩家挡住时也直接缩进凹处，不会趴在路中间
    const m = S.ent('manuel_n'); m.spr = 'tendido'; m.light = { r: 1.3, col: 'rgba(255,240,200,.12)', dx: 2, dy: 12 };
    await S.narr('曼努埃尔连滚带爬地缩进路边的石墙凹里，脸朝下趴着，\n嘴里一遍一遍地念：「圣母玛利亚，圣母玛利亚……」');
    await S.think('……继续走。别停。');
    f.procOn = true;
  }
  async function badHanded(S) {
    await S.narr('你把十字架递了过去。\n「这是啥？哦，好，好……」曼努埃尔笑嘻嘻地接住了。');
    S.amb('none'); await S.wait(500);
    await S.narr('身后的铃声一下子没有了。\n你回过头——你终于可以回头了——看见那排烛光，正一支一支地挪到曼努埃尔身后。');
    bell(S, .05);
    await S.narr('他还在笑。他手里的十字架，在烛光里白得像骨头。');
    await S.fade(1, 1500);
    const stick = S.has('baston') ? '\n\n爷爷的拐杖，你挂回了谷仓的柱子上。\n它和你一样，再也没有走过那条路。' : '';
    await S.end({ bad: true, id: 'handed', title: '交出十字架', text: '你自由了。\n\n白天，你什么都记得。\n曼努埃尔什么都不记得。他只是一天比一天瘦，小酒馆里的人都说，他总算把酒戒了。\n\n每个夜里，你都把窗关得死死的。\n可那只小铃铛，你还是听得见——\n从老路那头传过来，一下，一下。' + stick });
  }

  /* ================= 十字路口 ================= */
  const PRAYT = 45;
  async function crossArrive(S) {
    const f = S.f; f.crossIn = true;
    procStart(S, 9, 0, 3, f.carryGap || 5);
    await S.narr('十字路口。\n四条路在这里碰头。路中间，一座石十字架立在三层台阶上，比你高出两个头。');
    await S.think('就是这里。石十字架前面……那圈旧痕。');
    S.goal('走到石十字架前，站进那圈旧痕');
    f.procOn = true;
  }
  async function pray(S) {
    const f = S.f; f.procOn = false; f.pray = true; f.prayT = PRAYT; f.prayW1 = f.prayW2 = false;
    const to = TR.cells.length - 1 - 3.2;
    TR.moving = true; while (TR.s < to) { TR.s = Math.min(to, TR.s + .13); placeSouls(S); await S.wait(50); }
    TR.moving = false; placeSouls(S);
    chant(S);
    await S.narr('身后的铃声停了。\n队伍停在了路口外。你听见他们在念——很轻很轻，像风吹过栗子树的叶子。');
    await S.think('像送葬的队伍走到路口的石十字架前，停下来念一段经。\n……就是现在。');
    S.goal('站进石十字架前的圈痕，画圈画星');
    if (S.coop) S.toast('两个人：一个翻笔记念笔顺，一个在地上画');
    saveTrail(S); S.cp('cross');
    await retryTip(S);
  }
  async function prayEnd(S) {
    bell(S, .08);
    await S.narr('念经声停了。\n铃声又响起来——一下，一下，朝你走过来。');
    S.f.procOn = true;
  }
  async function ringOn(S) {
    const f = S.f;
    if (f.ph !== 'lane') {
      await S.narr('石十字架前的地上，有一圈磨得发白的旧痕，大小刚好够一个人站进去。\n像有很多人，在很多个夜里，在这里画过圈。');
      if (f.ph === 'cruz') { await S.narr('你抬起头，看向面前石十字架的底座。'); return cruceiroOn(S); }
      return;
    }
    if (f.drawn) return S.narr('圈和星都画好了。淡淡的白线，像落了一层霜。');
    const p = W.pl; if (p.x !== 9 || p.y !== 9) S.pos(9, 9, 3); S.turn(3);
    if (!f.tool) {
      if (S.has('baston')) { f.tool = 'baston'; await S.narr('你握紧爷爷的栗木拐杖。\n把手被几十年的手汗磨得发亮，握在手里，竟然是暖的。'); }
      else { f.tool = 'rama'; S.give('rama', true); await S.narr('手边没有能画的东西。\n你从老橡树垂下来的枝条上，折了一根枯枝。'); }
    }
    const tl = f.tool === 'baston' ? '拐杖' : '枯枝';
    if (!f.circle) {
      await S.narr(`你用${tl}尖抵住地面，沿着那圈旧痕，绕着自己走了一圈。\n一笔。没停。回到起点。`);
      f.circle = true; S.ent('circulo').s.circle = 1; S.sfx('chime');
    }
    for (; ;) {
      const v = await S.keypad('圈里画所罗门的记号。地上有五个点：\n1 正对石十字架，顺着日头（顺时针）依次是 2、3、4、5。\n点下笔顺（一笔画完，回到起点）' + (S.coop ? '\n（两个人：一个念笔记，一个点）' : ''), ['1', '2', '3', '4', '5'], 6, { sep: '-' });
      if (v == null) { await S.think('……铃声还在念。想清楚再画。\n（可以先翻翻笔记。）'); return; }
      if (v === '1-3-5-2-4-1') return drawn(S);
      f.wrong = (f.wrong || 0) + 1; DRAWW++;
      const a = v.split('-');
      let msg;
      if (a[0] !== '1') msg = '起笔就歪了——要正对着石十字架的那一点起笔。';
      else if (a[5] !== a[0]) msg = '最后一笔没回到起点，星断开了一个口子。';
      else if (v === '1-2-3-4-5-1') msg = '你只是沿着圈，又描了一个五边形。';
      else if (v === '1-4-2-5-3-1') msg = '是一颗星——可你是逆着日头画的。';
      else if (new Set(a.slice(0, 5)).size < 5) msg = '有的点画了两次，有的点一次也没碰到。';
      else msg = '线交叉成一团，不像星，像一团乱麻。';
      S.sfx('bad');
      await S.narr(msg + '\n地上的线暗了下去。');
      if (f.wrong >= 5) {
        LASTD = 'draw';
        await S.scare('face', { face: 'alma', sfx: 'scream' });
        return S.die('线又断了。\n烛光一圈一圈围上来，把你和那个画不完的圈围在中间。\n有人轻轻地，把一支蜡烛放进你空着的那只手里。', '圈没有画成');
      }
      bell(S, .07);
      const h0 = S.ent('e0'); S.focus(Math.round(h0.px / TS), Math.round(h0.py / TS));
      for (let k = 0; k < 8; k++) { creep(S, .2, 1.4); await S.wait(60); }
      await S.wait(300); S.focus(null);
      await S.narr(f.wrong >= 4 ? '铃声响了一下。最前面的烛光，已经到了圈边上。\n（再画错一次，就来不及了。）' : `铃声轻轻响了一下。烛光往前挪了一步。\n（还能再错 ${4 - f.wrong} 次。）`);
      if (DRAWW >= 4) await S.think('（1 → 3 → 5 → 2 → 4 → 1。）');
      else if (DRAWW === 3) await S.think('（从 1 起笔，顺着日头，第一笔连到 3——跳过 2。\n石十字架底座上刻着：正对十字起笔，顺着日头走。）');
      else if (DRAWW === 2) await S.think('（爷爷的本子里写过：星是一笔画成的，每一笔都跳过旁边那个点。）');
    }
  }
  async function drawn(S) {
    const f = S.f; f.drawn = true; f.pray = false; f.procOn = false;
    const r = S.ent('circulo'); r.s.star = 1; r.light = { r: 1.5, col: 'rgba(220,230,255,.16)' };
    chimeOK(S);
    await S.narr('最后一笔回到起点。\n地上的线亮了一下，像露水反着月光——然后变成了很淡很淡的白。');
    await S.think('圈画好了。\n现在……把十字架交给石十字架。');
    S.goal('把十字架交给石十字架');
    S.amb('none'); bell(S, .05);
    S.place('anselmo_n', 18, 8, 1);
    await S.say('？', '卢卡斯——！');
    await S.walk('anselmo_n', [11, 9], 4.6);
    S.face('anselmo_n', 1); S.face('pl', 2);
    await S.say('安塞尔莫', ['孩子……我跟着铃声找过来的。', '把它给我。是我害了你。', '我老了，老婆在那边等我。你还年轻——把它还给我，我替你走。']);
    const q = await S.ask('他站在圈外，伸出手，手指抖得厉害。\n十字架一下子变得很沉，往他那边拽。', ['把十字架递给安塞尔莫', '摇头，把十字架放到石十字架脚下'], '卢卡斯');
    if (q === 0) return badReturned(S);
    await S.say('卢卡斯', '不。谁也不用再拿着它了。');
    S.turn(3);
    S.wear('@me');
    const cz = S.ent('cruzchao'); cz.hidden = false;
    knock(S);
    await S.narr('你转过身，把木十字架靠在石十字架的台阶上。\n木头碰到石头，轻轻「叩」了一声。');
    await S.narr('手里一下子空了。\n像背了七个月——不，像背了好多好多年的东西，终于放了下来。');
    return passBy(S);
  }
  async function badReturned(S) {
    await S.narr('你把十字架递了过去。\n安塞尔莫握住它的那一刻，你听见身后的铃声，换了一个方向。');
    S.wear('@me');
    bell(S, .06);
    await S.narr('他转过身，背对着你，朝老路走去。\n一排烛光，一支接一支，跟在他身后。\n他没有回头。他不能回头。');
    await S.fade(1, 1500);
    await S.end({ bad: true, id: 'returned', title: '还给了安塞尔莫', text: '第二年的诸圣节，墓园里多了一块新碑，挨着他妻子的那一块。\n\n你每年都去献一束菊花。\n\n那个圈，你画得那么好。\n最后，它只护住了你一个人。' + (S.f.tool === 'baston' ? '\n\n爷爷的拐杖，那天夜里被你忘在了圈里。\n第二天去找，地上只剩一圈淡淡的白。' : '') });
  }
  /* 结尾：亡灵们绕过圈，从石十字架旁边走过去，一个接一个熄掉蜡烛，往南边的路去 */
  const ENDP = [[9, 1], [9, 2], [9, 3], [9, 4], [9, 5], [9, 6], [10, 6], [10, 7], [10, 8], [10, 9], [10, 10], [9, 10], [9, 11], [9, 12], [9, 13], [9, 14]];
  async function march(S, ids, from, to, spd, fin = true) {
    let p = from;
    const put = () => ids.forEach((id, i) => {
      const e = S.ent(id), s = p - i * SP;
      if (s < 0 || s > ENDP.length - 1) { e.hidden = true; return; }
      const [px, py, d] = trPos(ENDP, s); e.hidden = false; e.px = px; e.py = py; e.x = Math.round(px / TS); e.y = Math.round(py / TS); if (d != null) e.dir = d;
      e.alpha = Math.max(0, Math.min(1, fin ? s / 2 : 1, (ENDP.length - 1 - s) / 3));
      e.fr = [1, 0, 3, 0][Math.floor(s * 4) % 4];
      if (s > 8.5 && e.light) { e.light = null; S.tone('sine', 660 - i * 40, 640 - i * 40, .5, .015, 0, 3000); }   // 经过石十字架，蜡烛就灭了
    });
    while (p < to) { p = Math.min(to, p + spd * .05); put(); await S.wait(50); }
    ids.forEach(id => { S.ent(id).fr = 0; });
  }
  async function passBy(S) {
    const f = S.f, ids = SOULS.encrucillada, avo = f.tool === 'baston';
    const h = S.ent('e0'), hx = Math.round(h.px / TS), hy = h.py / TS;
    let p0 = 0;
    if (!h.hidden && hx === 9 && hy >= 1 && hy <= 6) p0 = hy - 1;   // 领头的还在北边路上：从它现在的位置接着走
    else ids.forEach(id => S.hide(id));
    TR = null;   // 从这里起由结尾的行进接管，不再沿足迹摆放
    S.focus(9, 7);
    bell(S, .06);
    await S.narr('铃声又响了。这一次，很慢，很轻。\n队伍动了——不是朝你，是绕着你的圈。');
    if (avo) {
      await march(S, ids, p0, 9 + 5 * SP, 2.2, !p0);
      await S.narr('每一个走过石十字架的，手里的蜡烛都悄悄灭了。\n最后一个兜帽，在你身边停了下来。');
      const e = S.ent('e5'); e.spr = '@avo'; S.face('e5', 1); S.face('pl', 2);
      await S.narr('他把兜帽放了下来。');
      await S.say('爷爷', ['……拐杖，还是那根。', '我当年也站在这个圈里。手抖得厉害，画歪了两回。']);
      if (f.flores) await S.say('爷爷', '菊花，我看见了。');
      await S.say('爷爷', ['回去告诉多罗特娅：窗台上的栗子，我吃了。', '叫她……诸圣节的晚上，好好睡一觉。']);
      await S.say('卢卡斯', '爷爷——');
      await S.narr('他笑了笑，把兜帽重新戴上，转身跟上了前面的烛光。');
      e.spr = '@alma';
      await march(S, ids, 9 + 5 * SP, ENDP.length + 5 * SP + 1, 2.2, false);   // 他跟上去，整条队伍一起走远
    } else {
      await march(S, ids, p0, ENDP.length + 5 * SP + 1, 2.2, !p0);
      await S.narr('每一个走过石十字架的，手里的蜡烛都悄悄灭了。\n最后一点烛光，沉进了南边那条路的黑暗里。');
    }
    S.focus(null);
    S.face('anselmo_n', 1);
    await S.narr('安塞尔莫跪在圈外，捂着脸，哭得像个孩子。');
    await S.say('安塞尔莫', '……谢谢你。谢谢你没有给我。');
    S.amb('wind');
    await S.fade(1, 1400);
    if (avo) {
      await S.card('第二天清晨', '', '我扶着安塞尔莫走回村子的时候，天刚蒙蒙亮。\n奶奶和乌希亚在后门口等了一夜。曼努埃尔也在，裹着毯子，酒全醒了。\n\n窗台上那碟栗子，只剩下一堆壳。\n\n我把爷爷的话告诉了奶奶。\n她没有哭。她说：「这个老头子。」\n然后进屋，睡了三十七年来第一个安稳的诸圣节。');
      return S.end({ id: 'farewell', title: '第二十四夜　完', text: '后来，那根栗木拐杖重新挂回了谷仓的柱子上。\n\n每年诸圣节，奶奶还是在窗台上点一盏灯、摆一碟栗子。\n第二天早上，栗子总是只剩下壳。\n\n乌希亚说是老鼠。\n奶奶只是笑。' });
    }
    await S.card('第二天清晨', '', '我扶着安塞尔莫走回村子的时候，天刚蒙蒙亮。\n奶奶和乌希亚在后门口等了一夜。\n奶奶一句话也没问，只是把我的手攥得很紧。\n曼努埃尔从那以后，再也没走老路回家。\n\n后来神父去了一趟十字路口。\n石十字架脚下的那个木十字架，他没有拿走。\n他在旁边跪了很久，为所有走过那条路的人念了一段经。');
    return S.end({ id: 'circle', title: '第二十四夜　完', text: '那个木十字架，至今还靠在路口的石十字架脚下，被雨水泡成了灰白色。\n\n村里的老人说，从那以后，老路上再也没有人听见过铃声。\n\n只是每年诸圣节的夜里，十字路口会亮起一圈很淡很淡的白——\n像霜，像有人在那里画过一个圈。' });
  }

  /* ================= 白天的人和物 ================= */
  async function avoaOn(S) {
    const f = S.f, ph = f.ph; S.face('avoa', 'pl');
    if (ph === 'morning') {
      await S.say('奶奶', '起来了？过来，喝碗热汤。');
      await S.narr('奶奶把汤碗递过来，眼睛落在你的手上——\n你的指甲缝里，嵌着一点一点白色的蜡。');
      await S.narr('她的手抖了一下，汤洒出来一点。\n她在胸前画了个十字，什么也没说。');
      await S.say('奶奶', ['你昨晚……走的是老路？', '……今天是诸圣节。先去墓园，给你爷爷送束花。', '路上见到谁，谁跟你说了什么，回来都告诉我。']);
      S.give('flores');
      f.ph = 'village'; S.goal('带菊花去村子右上角的墓园看爷爷');
      return;
    }
    if (ph === 'village') return S.say('奶奶', cyc(S, '_av', ['去吧。墓园在教堂右边。', '花别压坏了。你爷爷最喜欢黄的。']));
    if (ph === 'knows') {
      await S.narr('你把安塞尔莫的信递给奶奶。\n她看完，把信折好，压在灶台上，很久没有说话。');
      await S.say('奶奶', [
        '你爷爷年轻的时候，也走过。',
        '一九四九年，秋天，四十个晚上。白天他什么都不记得，只是一天天瘦下去。是我先发现他鞋底的泥、袖口的蜡。',
        '有人劝他：把十字架交给下一个碰见的人就好了。他不肯。他说，那是把自己的命塞给别人。',
        '诸圣节那天夜里，他走到老路尽头的十字路口，在石十字架前面画了个圈，站了进去。用的是他那根栗木拐杖。',
        '天亮的时候，他自己走回来了。手里是空的。'
      ]);
      await S.say('奶奶', ['他的本子，我一直收在箱子里。你拿去看。', '那根拐杖……还挂在谷仓的柱子上。']);
      f.toldStory = true;
      await S.note('caderno');
      await S.say('奶奶', ['今晚他们还会来叫你。拦不住的——拦你的人，会被一起带走。', '趁天还亮，去十字路口看看那个石十字架。把路记住。']);
      f.ph = 'cruz'; S.goal('趁天亮，沿老路去十字路口（村子右下）');
      return;
    }
    if (ph === 'cruz') return S.say('奶奶', cyc(S, '_av2', ['老路从村子右下角进去。岔口多，别走岔了。', '你爷爷说过，那根拐杖认得路。']));
    if (ph === 'dusk') {
      await S.say('奶奶', '吃饱了？……要带的东西，都带上了吗？');
      const r = await S.ask('灶膛里的火噼啪响了一下。', ['都带上了。坐下，等夜里', '我再去准备一下'], '卢卡斯');
      if (r === 1) return S.say('奶奶', '去吧。天黑透之前回来。');
      return nightStart(S);
    }
  }
  async function uxiaOn(S) {
    const f = S.f; S.face('uxia', 'pl');
    if (!f.readTrab) {
      await S.say('乌希亚', ['表哥，你昨晚几点回来的？', '半夜我听见你出门了。还听见铃铛——叮，叮，从老路那边。', '……你脸好白。']);
      await S.say('乌希亚', '奶奶不肯讲。可我做过一份作业，问过村里好多老人。你看看。');
      f.readTrab = true;
      return S.note('trabajo');
    }
    if (f.ph === 'dusk') {
      await S.say('乌希亚', ['我把作业和爷爷本子里要紧的话，都抄在一张纸上了。', '你画的时候，就当我在旁边念给你听。']);
      if (S.coop) S.toast('两个人：一个翻笔记念，一个画');
      return;
    }
    await S.say('乌希亚', cyc(S, '_ux', ['我陪你去？……奶奶不让我出门。', '作业里那些，你要是想再看，我随时念给你听。', '老师说这些都是迷信。……可我昨晚真的听见铃铛了。']));
  }
  async function espelloOn(S) {
    const f = S.f;
    if (S.once('mirror')) {
      await S.narr('脸盆上方挂着一面小镜子。你掬了一捧凉水，抬起头——');
      await S.scare('face', { face: 'vivo', sfx: 'sting', dur: 1.1 });
      await S.narr('镜子里的人，脸白得像蜡，眼窝发青。\n脸颊上还粘着一滴凝固的蜡泪。');
      await S.think('这是……我？\n镜子深处那几点亮光……是窗外的太阳。一定是。');
      return;
    }
    await S.narr(f.ph === 'dusk' ? '镜子里的脸，比早上更白了。' : '还是那么白。冷水泼了三次，也泼不回一点血色。');
  }
  async function cura(S) {
    const f = S.f; S.face('cura', 'pl');
    if (S.once('cura')) {
      await S.say('比埃托神父', ['卢卡斯。弥撒刚结束，你奶奶没来，我还担心呢。', '……你脸色不好。']);
      const r = await S.ask('神父看着你。', ['「神父，您信圣伴吗？」', '「没事，昨晚睡得晚。」'], '卢卡斯');
      if (r === 0) await S.say('比埃托神父', ['教会不教这些。可我在这个教区待了三十年，听老人讲过太多回。', '今天是诸圣节，明天是追思已亡节。我们为亡人祈祷，是盼他们安息——不是怕他们。', '要是夜里碰见了什么……记住：路口的石十字架，是先人立起来护着走夜路的人的。']);
      else await S.say('比埃托神父', ['那就好。今晚早点睡。', '路口的石十字架前，今晚也有人去点蜡烛。为亡人祈祷，总是好事。']);
      return;
    }
    await S.say('比埃托神父', cyc(S, '_cu', ['替我问候你奶奶。告诉她，明天的弥撒，我会念你爷爷的名字。', '那个石十字架是一七九三年立的。比教堂的钟楼还老。', '有什么话，随时来找我。不管多晚。']));
  }
  async function carmina(S) {
    S.face('carmina', 'pl');
    if (S.once('carmina')) {
      await S.say('卡尔米尼亚', ['卢卡斯！哎哟，脸怎么白成这样？来，吃颗栗子。', '老人说，诸圣节吃一颗栗子，就能救一个灵魂出炼狱。']);
      return S.narr('烤栗子烫手，剥开来，又甜又面。');
    }
    await S.say('卡尔米尼亚', cyc(S, '_ca', ['磨坊的安塞尔莫，病了大半年，瘦得跟柴火棍似的，说夜里怎么也睡不好。\n今天一早，倒红光满面地去墓园了。怪事。', '昨晚村里的狗叫了一整夜。我家那条钻到床底下，怎么叫都不出来。', '我外婆说，夜路上闻到蜡烛味，就得赶紧趴下，脸贴着地。\n……我从来没闻到过。谢天谢地。']));
  }
  async function manuelDay(S) {
    S.face('manuel', 'pl');
    await S.say('曼努埃尔', cyc(S, '_ma', ['哟，维拉家的小子！来一口新酒？……不喝？没出息。', '昨晚我从十字路口的小酒馆回来，走的也是老路。\n好像看见一串蜡烛……喝多了，喝多了！', '今晚我还走老路。怕啥？我老曼努埃尔，啥没见过。']));
  }
  async function anselmoOn(S) {
    const f = S.f; S.face('anselmo', 'pl');
    await S.narr('安塞尔莫站在他妻子的墓前。\n邻居们说他病了大半年，可今天，他脸上有了血色，像换了一个人。');
    S.bubble('anselmo', '!', 1200);
    await S.narr('他看见你，脸一下子白了。');
    await S.say('安塞尔莫', ['卢、卢卡斯……', '我……我不知道怎么跟你说。']);
    await S.narr('他从外套口袋里掏出一个折得很小的信封，塞进你手里，\n转身就走——几乎是跑着出了墓园。');
    await S.walk('anselmo', [20, 8], 4.4);
    await S.alpha('anselmo', 0, 500);
    await S.note('carta');
    await S.think('昨晚那个人……是他。');
    f.ph = 'knows'; S.goal('回家，把信给奶奶看');
  }
  async function tumbaAvo(S) {
    const f = S.f, e = S.ent('tumba_avo');
    if (S.has('flores')) {
      S.take('flores'); e.flowers = true; f.flores = true;
      await S.narr('「拉蒙·维拉　1924—1979」\n你把菊花插进碑前的石瓶，把落叶扫开。');
      return S.think('爷爷。……昨晚，我好像走了一段你走过的路。');
    }
    await S.narr('「拉蒙·维拉　1924—1979」\n你插的菊花，在风里轻轻晃。');
  }
  async function horreoOn(S) {
    const f = S.f;
    if (S.once('horreo')) await S.narr(['奶奶家的谷仓（hórreo），架在三对石脚上。石脚顶上压着圆圆的石盘，老鼠爬不上去。\n屋脊一头立着一个小石十字架。', '山墙的石头上刻着一个圈，圈里一颗五个角的星——所罗门的记号，辟邪用的。\n刻痕在五个角上都没有断开：是一笔刻成的。']);
    else await S.narr('谷仓山墙上那颗一笔刻成的五角星，被雨水洗得发白。');
    if (f.toldStory && !S.has('baston') && !f.tool) {
      const r = await S.ask('谷仓的木柱上挂着一根栗木拐杖，把手磨得发亮。', ['取下爷爷的拐杖', '先不动它'], '卢卡斯');
      if (r === 0) { S.give('baston'); await S.narr('拐杖比看上去轻。\n杖尖上还沾着一点干透的红泥——很多年前的。'); }
    }
  }
  async function petoOn(S, e) {
    const lit = !e.off;
    await S.narr(S.once('peto') ? '亡灵龛（peto de ánimas）：路边石头砌的小龛，里面画着在火焰里向上伸手的灵魂。\n下面有个投硬币的小缝，刻着一行字：请为炼狱中的灵魂祈祷。' + (lit ? '\n龛里的油灯点着了。' : '\n龛里放着一盏没点的油灯。') : lit ? '龛里的小油灯亮着。火苗一动不动。' : '一盏没点的油灯。奶奶说，今晚家家都会来点上。');
  }

  /* ================= 剧情 ================= */
  async function prologue(S) {
    S.f.ph = 'prologue';
    await S.go('corredoira', 11, 9, 2, { fade: false });
    S.dark(.9); S.amb('wind');
    SOULS.corredoira.forEach((id, i) => S.place(id, 17, 10 + i, 3));
    S.place('pro_vivo', 17, 9, 3);
    await S.fade(0, 900);
    await S.narr('昨夜。\n栗子节散了以后，你一个人走老路回奶奶家。嘴里还有烤栗子的甜味。');
    await S.walk('pl', [14, 9], 3);
    bell(S, .045); dogHowl(S, .02);
    await S.narr('风一下子冷了。\n一股味道飘过来——蜡烛的味道，像教堂里弥撒刚散。\n远处，谁家的狗在叫，叫得像哭。');
    await S.narr('前面拐角，一排小小的火光，一动不动地亮着。\n最前面站着一个人，手里举着一个十字架。');
    await S.walk('pl', [16, 9], 2.2);
    S.face('pro_vivo', 1); bell(S, .07);
    await S.say('举十字架的人', ['……孩子。', '帮我拿一下。就一下。我的手……举不动了。'], { style: 'whisper' });
    await S.narr('他的手瘦得像栗子树的枯枝。\n你还没想明白，自己的手已经伸了出去。');
    S.fx('flash'); S.sfx('sting'); S.wear('@vivo');
    await S.narr('十字架落进你手里。冰冷，沉。\n那个人长长地吐了一口气，像终于从水底浮了上来。');
    await S.say('举十字架的人', '……对不起。', { style: 'whisper' });
    await S.fade(1, 1400);
    S.hide('pro_vivo'); SOULS.corredoira.forEach(id => S.hide(id)); S.dark(null); S.wear('@me');
    S.f.ph = 'wake'; S.f._wakeGo = true;
    await S.go('casa', 2, 4, 3, { fade: false });
  }
  async function morning(S) {
    S.f.ph = 'morning';
    churchBell(S);
    await S.narr('……早上。\n窗外有公鸡在叫。远处，教堂的钟一下一下地敲着。');
    await S.think('好累。浑身都疼，像走了一整夜的路。\n……昨晚的事，只剩下一股蜡烛味。');
    S.goal('看看自己身上的怪事，再去灶边找奶奶');
  }
  async function cruceiroOn(S) {
    const f = S.f;
    if (f.ph === 'lane') return S.narr('石十字架。月光照在受难像的脸上。\n先站进它前面的那圈旧痕里。');
    await S.note('pedra');
    if (f.ph === 'cruz') return toDusk(S);
  }
  async function toDusk(S) {
    await S.think('「正对十字起笔，顺着日头走。」\n……爷爷当年，就站在这里。');
    S.f.ph = 'dusk';
    await S.narr('风从山上压下来，一下子凉了。\n太阳落到栗子树后面去了——比你以为的快得多。');
    await S.fade(1, 900);
    await S.go('casa', 6, 6, 3, { fade: false });
  }
  async function dusk(S) {
    await S.card('傍晚', '', '奶奶在窗台上点了一盏小灯，摆了一碟烤栗子。\n「给今晚回家的人。」她说。\n\n村里家家户户的窗台上，都亮着这样一盏灯。');
    await S.fade(0, 700);
    S.goal('准备好了，就到灶边找奶奶');
  }
  async function nightStart(S) {
    await S.say('奶奶', ['今晚他们来叫你，我和乌希亚拦不住。拦你的人，会被一起带走。', '记住你爷爷的话：别回头，别停。路上碰见谁，十字架给谁都不行。', '岔口上，跟着亡灵龛的灯走。到了路口——画圈。']);
    await S.narr('奶奶拿出念珠。乌希亚挨着她坐下。\n灶膛里的火慢慢暗下去。念珠一颗一颗数过去，像雨落在屋檐上。');
    await S.fade(1, 1400);
    await S.card('午夜', '', '铃声把我叫醒了。\n\n叮。叮。\n\n我已经站在后门外的老路上，手里握着那个木头十字架。\n身后，一排烛光，静静地等着。');
    S.f.ph = 'lane'; S.wear('@vivo');
    await S.go('corredoira', 3, 1, 0, { fade: false });
  }
  function nightSetup(S) {
    S.dark(.9); S.plr(1.8); S.norun(true); S.speed(1); S.amb('wind');
    ['p0', 'p1', 'p2', 'p3'].forEach(id => { S.ent(id).off = false; });
    const g = S.ent('cancela'); g.open = false; g.solid = true;
    S.hide('manuel_n'); S.hide('pro_vivo');
  }
  async function retryTip(S) {
    const T = {
      stop: '（刚才停下了。他们会一直跟到你背后一格——走慢点没关系，千万别停。）',
      look: '（刚才回了头。只管往前走：走错岔口会自己退回来，不用转身。）',
      draw: '（刚才画错太多次。星是一笔：1 起笔，每笔跳过旁边的点，顺着日头。）',
      pray: '（刚才念经停了，他们又走了过来。一站进圈痕就画，别在路口逗留。）',
      lost: '（刚才走错了岔口。每个岔口都要拐弯——拐向亮着油灯的亡灵龛那一边。）'
    }[LASTD];
    LASTD = '';
    if (T) await S.think(T);
  }
  async function laneStart(S, retry) {
    const f = S.f;
    nightSetup(S);
    Object.assign(f, { procOn: false, warnStop: false, warnLook: false, holdT: 0, _bell: 0 });
    procStart(S, 3, 1, 3, 6);
    if (!retry) {
      await S.fade(0, 900);
      bell(S, .07);
      await S.narr('老路。月亮躲在云后面。\n两边的石墙高过头顶，墙头的蕨叶上全是露水。');
      await S.narr('十字架很沉，只能双手举着，跑不起来。\n身后，铃声一下，一下。烛光照在你前面的地上，把你的影子拉得很长。');
      await S.narr('……你忍不住，眼角往后一瞥——');
      await S.scare('face', { face: 'alma', sfx: 'sting', dur: .8 });
      await S.think('别回头！别停！\n岔口跟着亡灵龛的灯。铃声越急，他们离我越近。');
      S.goal('举着十字架走到十字路口（别回头，别停）');
      if (S.coop) S.toast('两个人：一个盯岔口的油灯，一个听铃声报距离');
      S.cp('night');
    } else {
      S.goal('举着十字架走到十字路口（别回头，别停）');
      await retryTip(S);
    }
    f.procOn = true;
  }
  async function toCross(S) {
    const f = S.f;
    if (f.ph !== 'lane') return S.go('encrucillada', 9, 1, 0);
    if (f._going) return; f._going = true;
    f.carryGap = Math.max(3, Math.min(7, gapNow())); f.procOn = false; S.speed(1);
    await S.go('encrucillada', 9, 0, 0);
    f._going = false;
  }

  defChapter({
    id: 'compana', n: 24, title: '圣伴', sub: '夜里的老路上，一排烛光跟在你身后。别回头，别停，十字架不能交给任何人。', origin: '西班牙加利西亚民间传说', color: '#24342c',
    icon: '@vivo', amb: 'wind', floor: 'stone', wall: 'stone', dark: .3, plr: 3,
    endings: { farewell: '窗台上的栗子', circle: '十字架交给十字架', handed: '交出十字架', returned: '还给了安塞尔莫' },
    thumb(g, w, h) {
      const gy = h - 22;
      g.fillStyle = '#0c120e'; g.fillRect(0, 0, w, gy);
      g.fillStyle = '#1a2a1c'; g.fillRect(0, gy - 30, w, 30);
      g.fillStyle = '#2a2018'; g.beginPath(); g.moveTo(0, gy); g.lineTo(w * .55, gy - 30); g.lineTo(w * .7, gy - 30); g.lineTo(w * .5, gy); g.closePath(); g.fill();
      for (let i = 0; i < 6; i++) {   // 一排兜帽和烛光，从远到近
        const x = w * .62 - i * 9, y = gy - 32 + i * 5, s = .6 + i * .12;
        g.fillStyle = 'rgba(220,216,204,.75)'; g.fillRect(x - 3 * s, y - 10 * s, 6 * s, 12 * s);
        g.fillStyle = 'rgba(255,207,90,.95)'; g.fillRect(x - 1, y - 4 * s, 2, 2);
        g.fillStyle = 'rgba(255,200,120,.12)'; g.beginPath(); g.arc(x, y - 3 * s, 7 * s, 0, 7); g.fill();
      }
    },
    people: {
      me: { skin: '#e8c09a', hair: '#2a1c14', hs: 'short', top: '#4e5a36', top2: '#d8d0c0', bottom: '#2e3440', shoes: '#3a2a1a' },
      vivo: { key: 'cp-vivo', skin: '#d8d6cc', hair: '#2a1c14', hs: 'short', top: '#4e5a36', top2: '#d8d0c0', bottom: '#2e3440', shoes: '#3a2a1a', eye: '#2a2a3a', extra: crossX },
      avoa: { key: 'cp-avoa', skin: '#dcae8c', hair: '#d8d4cc', hs: 'bun', hat: 'scarf', hatC: '#18181c', top: '#1e1e22', top2: '#2a2a30', robe: true, apron: '#4a4a52', shoes: '#111' },
      uxia: { skin: '#f0c8a0', hair: '#4a2a14', hs: 'twin', top: '#a83a32', top2: '#e8e0d0', bottom: '#2a3a5a', skirt: true, shoes: '#3a2a1a' },
      cura: { skin: '#e0b490', hair: '#a8a298', hs: 'short', top: '#141418', top2: '#f0f0f0', robe: true, shoes: '#111' },
      carmina: { skin: '#d8a07a', hair: '#2a2020', hs: 'bun', hat: 'scarf', hatC: '#4a2a3a', top: '#3a2a34', top2: '#5a4a50', robe: true, apron: '#a8a090', shoes: '#1a1a1a' },
      manuel: { skin: '#c8906a', hair: '#5a5048', hs: 'messy', hat: 'cap', hatC: '#3a3a40', top: '#6a5a3a', top2: '#4a3a2a', bottom: '#2a2a30', blush: '#d87070', shoes: '#2a2a2a' },
      anselmo: { skin: '#d89a7a', hair: '#d0ccc4', hs: 'bald', top: '#4a3a2a', top2: '#a89878', bottom: '#3a3428', shoes: '#2a2018', key: 'cp-ans', extra(g, d, fr, G, R) { if (d === 0) { R(5, G.tT + 4, 2, 1, '#d8d0c0'); R(9, G.tT + 7, 2, 1, '#d8d0c0'); } } },
      anselmo_n: { key: 'cp-ansn', skin: '#c8c6bc', hair: '#d0ccc4', hs: 'bald', top: '#3a3024', top2: '#6a5a48', bottom: '#2a261e', shoes: '#1a1610', eye: '#0a0a0a', extra: crossX },
      alma: { key: 'cp-alma', skin: '#cfcbc0', hair: '#cfcbc0', top: '#d8d4c8', top2: '#b8b4a8', robe: true, ghost: true, hat: 'hood', hatC: '#e0dcd0', eye: '#050505', extra: soulX(false) },
      campa: { key: 'cp-campa', skin: '#cfcbc0', hair: '#cfcbc0', top: '#d0ccc0', top2: '#b0aca0', robe: true, ghost: true, hat: 'hood', hatC: '#d8d4c8', eye: '#050505', extra: soulX(true) },
      avo: { key: 'cp-avo', skin: '#d8d0c4', hair: '#e8e4dc', hs: 'short', top: '#d8d4c8', top2: '#b8b4a8', robe: true, ghost: true, eye: '#2a2a2a', mouth: '#a89888', extra: soulX(false, true) }
    },
    faces: {
      alma(R, a, t) {
        R(0, 0, 32, 32, '#040406');
        R(5, 2, 22, 30, '#cfcabc'); R(7, 1, 18, 2, '#dcd8cc'); R(4, 8, 2, 24, '#b8b4a6'); R(26, 8, 2, 24, '#b8b4a6');
        R(9, 6, 14, 20, '#0a0a0e');                                   // 兜帽里面是黑的
        R(11, 15, 10, 9, '#9a968a'); R(12, 16, 8, 7, '#c4beae');      // 下半张脸，被烛光从下面照亮
        const eh = 2 + Math.round(a * 3); R(12, 11, 3, eh, '#000'); R(17, 11, 3, eh, '#000');
        R(13, 12, 1, 1, '#ffcf5a'); R(18, 12, 1, 1, '#ffcf5a');       // 眼窝里反着烛光
        const m = Math.round(a * 4); R(14, 20, 4, 1 + m, '#1a1010');
        R(14, 25, 4, 7, '#f0ead0'); R(15, 22 - (Math.sin(t * 2) > 0 ? 1 : 0), 2, 3, '#ffcf5a'); R(15, 21, 2, 1, '#fff6c0'); R(13, 26, 1, 3, '#e8e0c8');
      },
      vivo(R, a, t) {
        R(0, 0, 32, 32, '#1a1c20'); R(2, 2, 28, 28, '#3a4048');
        R(8, 5, 16, 22, '#d8d6cc'); R(8, 4, 16, 4, '#2a1c14'); R(7, 5, 2, 8, '#2a1c14'); R(23, 5, 2, 8, '#2a1c14');
        R(10, 12, 4, 3, '#6a6a7a'); R(18, 12, 4, 3, '#6a6a7a'); R(11, 13, 2, 1, '#111'); R(19, 13, 2, 1, '#111');
        R(13, 21, 6, 1, '#8a8478'); R(15, 17, 2, 2, '#c8c4b8'); R(20, 18, 1, 4, '#f0ead0'); R(20, 22, 2, 1, '#f0ead0');
        for (let i = 0; i < 5; i++) { const v = a > .15 + i * .12; R(4 + i * 2, 27 - i, 1, 1, v ? '#ffcf5a' : '#3a4048'); R(27 - i * 2, 27 - i, 1, 1, v ? '#ffcf5a' : '#3a4048'); }   // 镜子深处：身后一排很小的烛光
      }
    },
    items: {
      flores: { name: '一束黄菊花', desc: '奶奶从院子里剪的，用麻绳扎着。诸圣节的墓园里，每座坟前都有这样一束。' },
      baston: { name: '爷爷的栗木拐杖', desc: '把手磨得发亮，杖尖沾着一点很多年前的红泥。1949 年，爷爷用它在十字路口画过一个圈。' },
      rama: { name: '橡树枯枝', desc: '从十字路口的老橡树上折下来的，细，但够直。' }
    },
    notes: {
      trabajo: { title: '乌希亚的作业：《我们教区的老说法》', text: '（初三的民俗作业。老师在页边打了个红色的「好」。）\n\n一、圣伴（A Santa Compaña）\n夜里，一队亡灵在乡间小路上走：白衣，兜帽，每人一支蜡烛。看不见他们时，也能闻到蜡烛味、听见一只小铃铛；狗一直叫，风突然变冷。据说他们经过谁家门口，谁家不久就要办丧事。\n\n二、走在最前面的是一个活人\n他举着十字架，不能回头，不能松手。白天什么都不记得，只是一天比一天苍白。要把十字架交给下一个在夜路上碰见的人，才能解脱。\n\n三、在路上遇见他们\n——在地上画个圈，站进去（有人说圈里还要画「所罗门的记号」：五个角的星）\n——或者脸朝下趴着，等他们过去\n——或者抱住路口的石十字架\n——他们递来的东西，都不要接\n\n（别的叫法：Estadea……阿斯图里亚斯叫 Güestia。\n页尾有一行铅笔小字：奶奶讲到这里，就不肯讲了。）' },
      carta: { title: '安塞尔莫的信', text: '卢卡斯：\n当面说不出口，就写下来。\n\n今年三月的一个夜里，我在老路上碰见一个举十字架的人。他叫我帮他拿一下，我接了。\n从那以后，每天夜里我都走在他们前面。白天什么都不记得，只有鞋底的泥、袖口的蜡。七个月，我瘦了二十公斤。\n\n前天夜里，铃铛响得特别急。我知道自己撑不过这个冬天。\n昨天夜里，你从栗子节回来。我把十字架递给你：「孩子，帮我拿一下。」你接了。\n\n他们说，交给下一个人就自由了。可我今天站在我老婆坟前，一点也不觉得自由。对不起。\n\n还有一件事，是我走了七个月才知道的：老路上那几座亡灵龛，今晚会点灯。每到岔口，有灯的那边，才是他们要走的路。\n\n——安塞尔莫' },
      caderno: { title: '爷爷的旧本子（1949）', text: '（一本发黄的小本子，铅笔字，写得很用力，有几页被水泡过。）\n\n十月二十三。第三十个晚上。\n白天我不记得。可我在袖口缝了一块白布，每天早上数上面的蜡点。\n\n十一月一。神父说他不懂这个，但他为我祈祷。多罗特娅说了一个老法子，是她外婆教的：\n到老路尽头的十字路口，在石十字架前面画一个圈，站进去。\n圈要一笔画完，笔不能离地。\n圈里画所罗门的记号——五个角的星，也是一笔：从一个角出发，每一笔都跳过旁边那个角，连到再过去的那个，五笔回到起点。\n\n十一月二。第四十个晚上。成了。\n画完最后一笔，我把十字架靠在石十字架的脚下。石头的十字架接过去了——它本来就是立在那里，护着走夜路的人的。\n不要交给活人。千万不要。\n\n用的是我那根栗木拐杖。我把它挂在谷仓的柱子上，再也不拿下来了。' },
      pedra: { title: '石十字架底座上的刻字', text: '（石十字架立在三层台阶上。正面刻着受难的基督，背面刻着圣母。底座的青苔下面，有一行刻得很浅的字。）\n\nANO DE 1793\n（一七九三年）\nPARA QUE NINGUÉN SE PERDA NA NOITE\n（愿无人在夜里迷路）\n\n（下面还有一行更小的字，像是后来有人用小刀刻上去的：）\n\nCOMEZA DE CARA Á CRUZ · VAI CO SOL\n（正对十字起笔 · 顺着日头走）\n\n（台阶前的地上，有一圈磨得发白的旧痕，大小刚好够一个人站进去。）' }
    },
    legend: '圣伴（加利西亚语 A Santa Compaña，也叫 Estadea 等）是西班牙西北部加利西亚最有名的民间传说之一，阿斯图里亚斯、莱昂一带也有相近的说法（如 Güestia）。流传最广的版本是：深夜的乡间小路上，一队亡灵排成行列缓缓走过，他们穿着白衣或戴着兜帽，每人手里一支蜡烛；有时人看不见他们，只闻到蜡烛的气味、听见一只小铃铛，狗会狂吠，风会忽然变冷。据说圣伴经过谁家门口，那家不久就会有人去世。\n\n据说走在行列最前面的是一个活人，举着十字架，有的版本里还提着一桶圣水。他不能回头，也不能放下十字架；白天什么都不记得，只是一天天苍白、消瘦，直到在夜路上碰见另一个人、把十字架交出去，才得解脱，否则就会被耗尽。所以老人告诫：夜里遇见圣伴，要在地上画一个圈（有人说还要画「所罗门的记号」，即五角星）站进去，或者脸朝下趴在地上，或者抱住路边的石十字架；他们递来的东西，一样都不要接。\n\n石十字架（cruceiro）和亡灵龛（peto de ánimas）是加利西亚乡间真实常见的东西：前者多立在路口、教堂前和墓园边；后者是路边的小石龛，画着炼狱里的灵魂，请过路人为亡灵祈祷、投下施舍。不少谷仓（hórreo）和老房子的石头上刻着五角星，当作辟邪的记号。旧时送葬的队伍经过路口的石十字架，常会停下来念一段经。11 月 1 日是诸圣节，人们去墓园献花；11 月 2 日是追思已亡节；秋天的栗子节（magosto）也在这前后，有一种说法是这时吃一颗栗子，就能让一个灵魂离开炼狱。天主教会并不讲授圣伴的说法，它是民间信仰与为亡者祈祷的天主教习俗交织而成的；也有学者认为其中带着基督教传入之前更古老的观念。\n\n（本章的拉马斯村与所有人物、1949 年的往事、爷爷的本子、石十字架底座的刻字、五角星的笔顺规则、「把十字架交给石十字架」的解法、队伍在路口停下念经的情节，以及全部结局，均为游戏虚构。）',
    start: { map: 'casa', x: 2, y: 4, dir: 3 },
    async intro(S) {
      await S.card('第二十四夜　圣伴', '1986年11月1日（诸圣节）　西班牙加利西亚　奥伦塞山区', '昨晚是邻村的栗子节。\n烤栗子，新酒，篝火，风笛。\n\n我记得自己一个人走老路回奶奶家。\n记得路上有一股蜡烛的味道。\n\n后面的事，一点也想不起来了。');
      await prologue(S);
    },
    resume: {
      night: async S => { S.wear('@vivo'); await laneStart(S, true); },
      cross: async S => {
        const f = S.f;
        S.dark(.88); S.plr(1.8); S.norun(true); S.speed(1); S.amb('wind'); S.wear('@vivo');
        TR = { map: 'encrucillada', cells: f.trail.map(c => c.slice()), s: f.ts, moving: false };
        Object.assign(f, { procOn: false, pray: true, prayT: Math.max(f.prayT || 0, PRAYT), prayW1: false, prayW2: false, late: false, wrong: 0, warnStop: false, warnLook: false, holdT: 0 });
        placeSouls(S);
        S.goal('站进石十字架前的圈痕，画圈画星');
        await retryTip(S);
      }
    },
    tick(S) {   // 烂泥拖慢脚步（白天夜里都是）
      const p = W.pl, on = S.map === 'corredoira' && CORR[p.y] && CORR[p.y][p.x] === 'u', v = on ? .45 : 1;
      if ((p.speed || 1) !== v) { S.speed(v); if (on && S.f.ph === 'lane' && S.once('mudT')) S.toast('烂泥拖住了脚——铃声在追'); }
    },
    sprites: {
      casaF(g, e, t, R) {
        R(-2, -18, 68, 4, '#22232a'); R(0, -14, 64, 10, '#30313a'); for (let i = 0; i < 8; i++) R(i * 8 + 2, -13, 1, 8, '#26272e');
        R(-3, -5, 70, 3, '#1c1c22'); R(0, -2, 64, 34, '#7c7568');
        for (let y = 0; y < 32; y += 5) for (let x = (y / 5) % 2 ? 0 : 6; x < 64; x += 12) R(x, -2 + y, 11, 1, '#5e584e');
        R(2, 2, 26, 2, '#5a3a22'); R(2, 4, 26, 1, '#3a2414'); for (let i = 0; i < 7; i++) R(3 + i * 4, 4, 1, 6, '#5a3a22'); R(2, 10, 26, 2, '#4a2e1a');
        R(8, 14, 10, 9, '#3a2a1a'); R(9, 15, 8, 7, e.lit ? '#e8c070' : '#141820'); R(13, 15, 1, 7, '#3a2a1a'); if (e.lit) R(10, 20, 2, 2, '#fff0a0');
        R(34, 10, 12, 22, '#3a2414'); R(35, 11, 10, 21, '#5a3a22'); R(43, 21, 1, 2, '#c9a35a');
        R(50, 4, 10, 8, '#3a2a1a'); R(51, 5, 8, 6, e.lit ? '#d8b060' : '#141820');
      },
      igrexa(g, e, t, R) {
        R(30, -30, 20, 22, '#8a8478'); R(33, -26, 5, 8, '#141418'); R(42, -26, 5, 8, '#141418'); R(34, -22, 3, 3, '#a88a3a'); R(43, -22, 3, 3, '#a88a3a');
        R(39, -40, 2, 10, '#6a665e'); R(36, -37, 8, 2, '#6a665e');
        R(-2, -10, 84, 4, '#2c2a2e'); R(4, -14, 72, 4, '#353338');
        R(0, -6, 80, 54, '#8e877a');
        for (let y = 0; y < 54; y += 6) for (let x = (y / 6) % 2 ? 0 : 8; x < 80; x += 16) R(x, -6 + y, 15, 1, '#6e685c');
        R(34, 2, 12, 12, '#4a443c'); R(36, 4, 8, 8, e.lit ? '#d8a050' : '#28262e'); R(39, 4, 2, 8, '#4a443c'); R(36, 7, 8, 2, '#4a443c');
        R(30, 26, 20, 22, '#5e584c'); R(32, 28, 16, 20, '#3a2414'); R(33, 29, 14, 19, '#4e3220'); R(39, 29, 1, 19, '#2e1c10');
        if (e.lit) R(39, 44, 2, 4, 'rgba(255,200,120,.6)');
      },
      nichos(g, e, t, R) {
        R(0, -18, 112, 34, '#a8a294'); R(0, -20, 112, 3, '#6a665e');
        for (let c = 0; c < 7; c++) for (let r = 0; r < 2; r++) {
          const x = c * 16 + 2, y = -15 + r * 15;
          R(x, y, 12, 12, '#8a8478'); R(x + 1, y + 1, 10, 10, '#c8c2b4'); R(x + 3, y + 4, 6, 1, '#6a665e');
          R(x + 1, y + 8, 3, 3, ['#e8d040', '#e8e8e0', '#c83a3a'][(c + r) % 3]); R(x + 8, y + 8, 2, 3, '#f0ecd8'); if (Math.sin(t * 6 + c * 2 + r) > -.2) R(x + 8, y + 7, 2, 1, '#ffcf5a');
        }
      },
      horreo(g, e, t, R) {
        for (const x of [2, 21, 40]) { R(x, 2, 6, 13, '#7a766c'); R(x - 2, 0, 10, 3, '#8e8a80'); }
        R(-1, -22, 50, 22, '#8a8478'); R(4, -19, 40, 16, '#6a5a44'); for (let i = 0; i < 10; i++) R(5 + i * 4, -19, 2, 16, '#4a3a28');
        R(-3, -28, 54, 6, '#7a3a2a'); for (let i = 0; i < 9; i++) R(-2 + i * 6, -27, 1, 5, '#5a2a1e');
        R(-1, -37, 2, 9, '#8e8a80'); R(-3, -34, 6, 2, '#8e8a80'); R(46, -34, 3, 6, '#8e8a80'); R(46, -36, 3, 2, '#9e9a90');
        R(0, -18, 5, 1, '#5a564e'); R(0, -14, 5, 1, '#5a564e'); R(0, -18, 1, 5, '#5a564e'); R(4, -18, 1, 5, '#5a564e'); R(2, -17, 1, 3, '#5a564e'); R(1, -16, 3, 1, '#5a564e');
      },
      fogueira(g, e, t, R) {
        if (e.off) { R(2, 10, 12, 4, '#2a2420'); R(4, 9, 8, 2, '#3a302a'); R(6, 9, 2, 1, '#6a3a1a'); return; }
        for (let i = 0; i < 5; i++) { const h = 4 + ((Math.sin(t * 9 + i * 1.7) + 1) * 3) | 0; R(3 + i * 2, 12 - h, 2, h, i % 2 ? '#ff8a2a' : '#ffcf5a'); }
        R(1, 11, 14, 3, '#3a2a20'); R(2, 3, 12, 2, '#2a2a2a'); R(4, 2, 2, 1, '#6a3a1a'); R(8, 2, 2, 1, '#6a3a1a'); R(11, 2, 2, 1, '#6a3a1a'); R(13, 3, 4, 1, '#2a2a2a');
      },
      peto(g, e, t, R) {
        R(1, -12, 14, 26, '#7e786c'); R(0, -14, 16, 3, '#8e887c'); R(7, -21, 2, 7, '#6e685e'); R(5, -19, 6, 2, '#6e685e');
        R(3, -9, 10, 12, '#2a1a14'); R(4, -8, 8, 10, '#5a2a1a');
        R(4, -1, 8, 3, '#c84a1a'); R(5, -3, 1, 2, '#e8a040'); R(10, -4, 1, 3, '#e8a040'); R(6, -6, 2, 3, '#d8c8b0'); R(9, -6, 1, 2, '#d8c8b0');
        R(6, 6, 4, 1, '#2a2420');
        if (!e.off) { R(7, 0, 2, 2, '#ffcf5a'); R(7, -1, 2, 1, '#fff6c0'); R(6, 2, 4, 1, '#8a6a3a'); } else R(6, 1, 4, 2, '#6a5a3a');
      },
      cancela(g, e, t, R) {
        R(0, -4, 2, 18, '#4a3420'); R(14, -4, 2, 18, '#4a3420');
        if (e.open) { R(2, -2, 3, 14, '#6a4a2a'); for (let i = 0; i < 3; i++) R(2, i * 4, 3, 1, '#3a2414'); R(13, 2, 1, 1, '#c8c0a0'); R(14, -6, 2, 3, '#4a6a3a'); return; }
        for (let i = 0; i < 3; i++) R(1, i * 4, 14, 2, '#6a4a2a'); R(2, -1, 2, 11, '#5a3a22'); R(11, -1, 2, 11, '#5a3a22'); R(6, 3, 4, 2, '#a89a6a'); R(14, -6, 2, 3, '#4a6a3a');
      },
      cruceiro(g, e, t, R) {
        R(-8, 8, 32, 8, '#6a665c'); R(-5, 4, 26, 5, '#7a766c'); R(-2, 0, 20, 5, '#868278'); R(-2, 4, 20, 1, '#5a564e'); R(-5, 8, 26, 1, '#5a564e');
        R(6, -28, 4, 30, '#8e8a7e'); R(7, -28, 1, 30, '#a29e92'); R(4, -32, 8, 4, '#8e8a7e');
        R(7, -46, 2, 15, '#9a968a'); R(2, -42, 12, 2, '#9a968a'); R(7, -42, 2, 6, '#c8c0b0'); R(6, -41, 1, 1, '#c8c0b0'); R(9, -41, 1, 1, '#c8c0b0');
        R(5, -20, 2, 3, '#4a6a3a'); R(9, -10, 1, 3, '#4a6a3a');
      },
      circulo(g, e, t, R) {
        const col = e.star ? 'rgba(236,240,255,.9)' : e.circle ? 'rgba(226,222,210,.7)' : 'rgba(200,196,180,.3)';
        for (let a = 0; a < 40; a++) { const x = 8 + Math.cos(a / 40 * 6.283) * 12, y = 9 + Math.sin(a / 40 * 6.283) * 9; R(x, y, 1, 1, col); }
        if (e.star) {
          const P = [0, 1, 2, 3, 4].map(k => [8 + Math.cos(-1.5708 + k * 1.2566) * 10.5, 9 + Math.sin(-1.5708 + k * 1.2566) * 7.8]);
          [0, 2, 4, 1, 3, 0].forEach((k, i, A) => { if (i === 0) return; const a = P[A[i - 1]], b = P[k]; for (let s = 0; s <= 16; s++) R(a[0] + (b[0] - a[0]) * s / 16, a[1] + (b[1] - a[1]) * s / 16, 1, 1, col); });
        }
      },
      rama(g, e, t, R) { R(1, 10, 12, 1, '#5a4030'); R(4, 8, 1, 2, '#5a4030'); R(9, 11, 5, 1, '#4a3424'); R(3, 13, 8, 1, '#4a3424'); R(12, 9, 1, 2, '#5a4030'); },
      taberna(g, e, t, R) {
        R(-1, -18, 50, 5, '#7a3a2a'); R(0, -13, 48, 29, '#8a8274'); R(18, -2, 12, 18, '#3a2414'); R(19, -1, 10, 17, '#4e3220');
        R(4, -6, 10, 8, '#2a2a30'); R(34, -6, 10, 8, '#2a2a30'); R(14, -12, 20, 5, '#3a2a1a'); R(16, -11, 16, 3, '#c8b890'); R(36, 6, 6, 9, '#6a4a2a');
      },
      estampa(g, e, t, R) { box(R, 4, 2, 8, 10, '#8a6a2a'); R(5, 3, 6, 8, '#2a3a6a'); R(7, 4, 2, 2, '#e8d0b0'); R(6, 6, 4, 5, '#3a5a9a'); R(7, 3, 2, 1, '#e8c860'); R(12, 1, 1, 7, '#3a5a2a'); R(13, 2, 1, 2, '#4a7a3a'); R(11, 4, 1, 2, '#4a7a3a'); },
      arca(g, e, t, R) { box(R, 0, 3, 16, 12, '#5a3a22'); R(1, 4, 14, 2, '#6a4a2e'); R(0, 7, 16, 1, '#3a2414'); R(7, 8, 2, 2, '#c9a35a'); R(3, 10, 3, 1, '#7a5a3a'); R(10, 10, 3, 1, '#7a5a3a'); },
      castanas(g, e, t, R) { R(3, 6, 10, 3, '#d8d0c0'); R(4, 5, 8, 1, '#e8e0d0'); for (let i = 0; i < 4; i++) R(4 + i * 2, 4 - (i % 2), 2, 2, '#6a3a1a'); },
      palangana(g, e, t, R) { R(4, 6, 8, 8, '#5a3a22'); R(2, 3, 12, 4, '#d8d4c8'); R(3, 4, 10, 2, '#8aa0b0'); R(5, 13, 1, 3, '#3a2414'); R(10, 13, 1, 3, '#3a2414'); },
      tendido(g, e, t, R) { R(1, 8, 12, 5, '#6a5a3a'); R(12, 7, 4, 5, '#c8906a'); R(12, 6, 4, 2, '#3a3a40'); R(0, 9, 2, 3, '#2a2a30'); R(2, 12, 9, 2, '#2a2a30'); R(4, 7, 3, 1, '#4a3a2a'); },
      cruzchao(g, e, t, R) { R(12, -8, 2, 20, '#6a4a2a'); R(12, -8, 1, 20, '#8a6a3a'); R(9, -4, 8, 2, '#6a4a2a'); }
    },
    tiles: {
      muro: { solid: true, paint(R, X, Y) {
        R(0, 0, 16, 16, '#34362e');
        for (let r = 0; r < 3; r++) { const o = (r + X) % 2 ? 0 : 5; for (let i = -1; i < 3; i++) R(o + i * 8 + 1, r * 5 + 1, 6, 4, shadeT('#55574a', hash(X, Y, r * 7 + i) - .5)); }
        for (let i = 0; i < 4; i++) R((hash(X, Y, 60 + i) * 14) | 0, (hash(Y, X, 70 + i) * 14) | 0, 3, 2, i % 2 ? '#3f5a2e' : '#4a6a34');
      } },
      lane: { solid: false, paint(R, X, Y) {
        speck(R, '#5a3e2a', ['#6a4a32', '#4a3222', '#704e34'], X, Y, 20, 31);
        if (hash(X, Y, 32) < .35) R(3, (hash(X, Y, 33) * 12) | 0, 10, 1, '#4a3020');
        if (hash(X, Y, 34) < .18) { const x = (hash(X, Y, 35) * 12) | 0, y = (hash(X, Y, 36) * 12) | 0; R(x, y, 3, 3, '#6a5a2a'); R(x + 1, y - 1, 1, 1, '#8a7a3a'); }
        if (hash(X, Y, 37) < .2) R((hash(X, Y, 38) * 13) | 0, (hash(X, Y, 39) * 13) | 0, 2, 2, '#7a7468');
      } }
    },
    maps: {
      /* ---------------- 奶奶家 ---------------- */
      casa: {
        amb: 'room', dark: .3, plr: 3.2, floor: 'stone', wall: 'stone',
        rows: ['##############', '##############', '#............#', '#............#', '#............#', '#............#', '#............#', '#............#', '######.#######'],
        ents: [
          { id: 'cama', x: 1, y: 2, h: 2, spr: 'bed', col: '#6a5a4a', on: S => S.narr(S.f.ph === 'dusk' ? '你今晚不打算睡了。' : '被子上全是红泥点子。\n枕头边掉着一小片干了的蜡，白白的，像一片指甲。') },
          { id: 'botas', x: 2, y: 3, spr: 'shoes', col: '#3a2a1a', on: S => S.narr('你的靴子。湿透了，鞋底塞满了老路上的红泥和栗子壳的碎刺。\n……可你记得，昨晚是光着脚上床的。') },
          { id: 'estampa', x: 2, y: 1, spr: 'estampa', on: S => S.narr('奶奶的圣母像，画框擦得发亮。\n旁边钉着一小枝干了的月桂——棕枝主日从教堂带回来的。') },
          { id: 'janela', x: 4, y: 1, spr: 'window', lit: true, on: S => S.narr(S.f.ph === 'dusk' ? '窗外，山坡上的村子一盏一盏亮起小灯。\n不是电灯——是窗台上给亡人点的灯。' : '窗外是奶奶的菜园，再远是栗子树林。\n林子下面，那条老路的石墙一直弯到看不见的地方。') },
          { id: 'vela', x: 4, y: 2, spr: 'candle', hidden: true, light: { r: 2, col: 'rgba(255,190,110,.2)', flick: true }, on: S => S.narr('窗台上，一盏小油灯，一碟烤栗子。「给今晚回家的人。」奶奶说。\n窗外，山坡上的村子一盏一盏亮起小灯——不是电灯，是家家窗台上给亡人点的灯。') },
          { id: 'espello', x: 6, y: 1, spr: 'mirror' },
          { id: 'palangana', x: 6, y: 2, spr: 'palangana', on: S => espelloOn(S) },
          { id: 'reloxo', x: 8, y: 1, spr: 'wallclock', on: S => S.narr(S.f.ph === 'dusk' ? '挂钟：傍晚六点。钟摆的声音，今天格外响。' : '挂钟：上午十点。你从来没睡到这么晚过。') },
          { id: 'lareira', x: 9, y: 2, w: 2, spr: 'fireplace', light: { r: 3, col: 'rgba(255,150,70,.2)', flick: true }, on: S => S.narr('石砌的灶膛（lareira），栗木柴烧得噼啪响。\n铁锅里炖着白菜土豆汤，屋梁上挂着熏肠和一串串大蒜。') },
          { id: 'avoa', x: 11, y: 2, spr: '@avoa', dir: 1, on: S => avoaOn(S) },
          { id: 'mesa', x: 5, y: 5, w: 2, spr: 'table2', col: '#5a3e26', on: S => S.narr('厚木桌，桌面被刀和碗磨出了一道道浅沟。\n一碟乌希亚剥了一半的栗子。') },
          { id: 'castanas', x: 5, y: 5, spr: 'castanas', solid: false, z: 1 },
          { id: 'uxia', x: 7, y: 5, spr: '@uxia', dir: 1, on: S => uxiaOn(S) },
          { id: 'arca', x: 12, y: 6, spr: 'arca', on: S => S.narr(S.f.toldStory ? '奶奶的嫁妆箱子。爷爷的本子就是从这里拿出来的。\n箱盖内侧刻着一颗五角星——和谷仓山墙上那颗一样。' : '奶奶的嫁妆箱子，上了锁。\n箱盖上刻着一颗小小的五角星。') },
          { id: 'x_casa', x: 6, y: 8, spr: 'invisible', async touch(S) {
            const ph = S.f.ph;
            if (ph === 'morning') { await S.narr('奶奶在灶边叫你：「先过来，把汤喝了。」'); return S.pos(6, 7, 3); }
            await S.go('aldea', 5, 5, 0);
          } }
        ],
        async enter(S) {
          const f = S.f;
          if (f.ph === 'dusk') { S.show('vela'); S.ent('janela').lit = false; S.dark(.6); }
          else S.dark(null);
          if (f.ph === 'wake') { if (f._wakeGo) { f._wakeGo = false; return; } return morning(S); }
          if (f.ph === 'dusk' && S.once('dusk')) return dusk(S);
        }
      },
      /* ---------------- 拉马斯村 ---------------- */
      aldea: {
        amb: 'wind', dark: .08, plr: 3.2, floor: 'grass', legend: { M: 'muro' },
        tileOpts: { grassC: '#2e4a28', treeC: '#1a3a1e' },
        rows: ALDEA,
        ents: [
          { id: 'casaF', x: 3, y: 3, w: 4, h: 2, spr: 'casaF' },
          { id: 'd_casa', x: 5, y: 4, spr: 'invisible', solid: true, async on(S) { S.sfx('open'); await S.go('casa', 6, 7, 3); } },
          { id: 'igrexa', x: 9, y: 2, w: 5, h: 3, spr: 'igrexa' },
          { id: 'd_igrexa', x: 11, y: 4, spr: 'invisible', solid: true, on: S => S.narr(S.f.ph === 'dusk' ? '教堂的门虚掩着，门缝里漏出一点烛光。\n里面有人在为亡人祈祷，声音很轻。' : '教区教堂，圣马蒂尼奥。弥撒刚散，门关着。\n门楣上刻着年份：1702。') },
          { id: 'cura', x: 12, y: 5, spr: '@cura', dir: 0, on: S => cura(S) },
          { id: 'nichos', x: 17, y: 3, w: 7, spr: 'nichos', on: S => S.narr('墓园北墙是一格一格的壁龛墓。\n每一格前面都插满了菊花，点着罩在玻璃里的小白蜡烛。') },
          { id: 'tumba_avo', x: 18, y: 5, spr: 'gravestone', flowers: false, on: S => tumbaAvo(S) },
          { id: 'tumba2', x: 20, y: 5, spr: 'gravestone', flowers: true, on: S => S.narr('「何塞·洛萨达一家」\n碑前堆满了菊花，还有一张泛黄的照片：一家人站在去阿根廷的船前。') },
          { id: 'velas_m', x: 21, y: 5, spr: 'candles', on: S => S.narr('一排小白蜡烛。风吹过来，火苗晃也不晃。') },
          { id: 'tumba3', x: 22, y: 5, spr: 'gravestone', flowers: true, on: S => S.narr('「卡梅拉·平托　1931—1985」\n碑前一小束野花，还有一碟剥好的栗子。') },
          { id: 'anselmo', x: 22, y: 6, spr: '@anselmo', dir: 3, on: S => anselmoOn(S) },
          { id: 'horreo', x: 3, y: 12, w: 3, spr: 'horreo', on: S => horreoOn(S) },
          { id: 'fogueira', x: 12, y: 12, spr: 'fogueira', light: { r: 2.2, col: 'rgba(255,150,70,.18)', flick: true }, on: S => S.narr(S.ent('fogueira').off ? '篝火熄了，灰还是温的。' : '篝火上架着一口满是小孔的铁锅，栗子在里面噼噼啪啪地爆开。\n焦香飘满了整个广场。') },
          { id: 'carmina', x: 13, y: 12, spr: '@carmina', dir: 1, on: S => carmina(S) },
          { id: 'banco', x: 8, y: 14, w: 2, spr: 'bench', on: S => S.narr('广场上的石凳，被太阳晒得暖暖的。') },
          { id: 'manuel', x: 8, y: 13, spr: '@manuel', dir: 0, on: S => manuelDay(S) },
          { id: 'p_aldea', x: 23, y: 14, spr: 'peto', off: true, light: { r: 1.6, col: 'rgba(255,190,100,.18)' }, on: (S, e) => petoOn(S, e) },
          { id: 'sinal_a', x: 21, y: 11, spr: 'sign', on: S => S.narr('木牌：↓ 老路（corredoira）· 十字路口') },
          { id: 'x_corr', x: 22, y: 17, spr: 'invisible', async touch(S) {
            const ph = S.f.ph;
            if (ph === 'cruz') return S.go('corredoira', 3, 1, 0);
            await S.narr(ph === 'village' ? '老路通往十字路口。……奶奶让你先去墓园。' : ph === 'knows' ? '先回家，把信给奶奶看。' : '天快黑了。今晚，你会走上这条路的——但不是现在。');
            S.pos(22, 16, 3);
          } }
        ],
        async enter(S) {
          const f = S.f;
          if (f.ph === 'dusk') {
            S.dark(.6); ['carmina', 'manuel', 'cura', 'anselmo'].forEach(id => S.hide(id));
            S.ent('fogueira').off = true; S.ent('casaF').lit = true; S.ent('igrexa').lit = true; S.ent('p_aldea').off = false;
            if (S.once('aldeaDusk')) await S.narr('天快黑了。家家户户的窗台上，都点着一盏小灯。\n广场上的篝火熄了，只剩一股烤栗子的焦香。');
            return;
          }
          S.dark(null);
          if (f.ph === 'village' && S.once('aldea1')) { churchBell(S); await S.narr('诸圣节的早上。\n村里人都穿着深色的衣服，手里捧着菊花，往教堂旁边的墓园走。'); }
        }
      },
      /* ---------------- 老路 ---------------- */
      corredoira: {
        amb: 'wind', dark: .25, plr: 3, floor: 'dirt', legend: { M: 'muro', v: 'lane' },
        tileOpts: { grassC: '#24402a', treeC: '#183420' },
        rows: CORR,
        ents: [
          { id: 'cx_up', x: 3, y: 0, spr: 'invisible', async touch(S) { if (S.f.ph === 'lane') return; await S.go('aldea', 22, 16, 3); } },
          { id: 'cx_down', x: 28, y: 23, spr: 'invisible', touch: S => toCross(S) },
          ...PETOS.map(([x, y], i) => ({ id: 'p' + i, x, y, spr: 'peto', off: true, light: { r: 1.9, col: 'rgba(255,190,100,.2)' }, on: (S, e) => petoOn(S, e) })),
          { id: 'cancela', x: 10, y: 7, spr: 'cancela', open: true, solid: false, on: S => gateOn(S), bump: S => gateOn(S) },
          { id: 'w1', x: 4, y: 3, spr: 'invisible', solid: true, on: S => S.narr('石墙比人还高，石头缝里长满了蕨和青苔。\n摸上去，冰凉，湿。') },
          { id: 'w2', x: 16, y: 10, spr: 'invisible', solid: true, on: S => S.narr('墙头上一棵老栗子树，把枝条伸到路中间。\n地上落满了带刺的栗子壳。') },
          { id: 'w3', x: 25, y: 15, spr: 'invisible', solid: true, on: S => S.narr('墙上嵌着一块旧石头，刻着一个快磨平的十字。') },
          { id: 'w4', x: 21, y: 20, spr: 'invisible', solid: true, on: S => S.narr('墙那边是谁家的牧场。一头牛在黑暗里喷了一下鼻子。') },
          { id: 'pro_vivo', x: 17, y: 9, spr: '@anselmo_n', hidden: true, solid: false },
          { id: 'c0', x: 3, y: 0, spr: '@campa', hidden: true, solid: false, light: { r: 1.5, col: 'rgba(255,200,120,.12)' } },
          ...[1, 2, 3, 4, 5].map(i => ({ id: 'c' + i, x: 3, y: 0, spr: '@alma', hidden: true, solid: false, light: { r: 1.9, col: 'rgba(255,200,120,.16)' } })),
          { id: 'manuel_n', x: 17, y: 13, spr: '@manuel', hidden: true, light: { r: 2.4, col: 'rgba(255,240,200,.14)' }, on: S => S.narr(S.ent('manuel_n').spr === 'tendido' ? '曼努埃尔脸朝下趴着，一动也不敢动。' : '……') }
        ],
        async enter(S) {
          const f = S.f;
          if (f.ph === 'prologue') return;
          if (f.ph === 'lane') return laneStart(S, false);
          S.dark(null);
          if (f.ph === 'cruz' && S.once('corr1')) {
            await S.narr('老路（corredoira）：两边是比人还高的石墙，墙头长满了青苔和蕨。\n栗子树和橡树的枝条在头顶合拢，白天也像傍晚。');
            await S.think('岔口不少。……记住哪边有亡灵龛。');
            S.goal('沿老路走到十字路口（留意岔口和亡灵龛）');
          }
        },
        tick(S, dt) {
          procTick(S, dt);
          const f = S.f, p = W.pl;
          if (f.ph !== 'lane' || S.busy || W.endScreen) return;
          if (!f.metManuel && f.procOn && p.x === 17 && p.y >= 10 && p.y <= 12) { f.procOn = false; S.run(manuelN); return; }
          if (f.procOn && p.x === 28 && p.y === 23) S.run(toCross);
        }
      },
      /* ---------------- 十字路口 ---------------- */
      encrucillada: {
        amb: 'wind', dark: .15, plr: 3, floor: 'grass',
        tileOpts: { grassC: '#2a4626', treeC: '#183a1e' },
        rows: CRUZ,
        ents: [
          { id: 'x_n', x: 9, y: 0, spr: 'invisible', async touch(S) { if (S.f.ph === 'lane') return; await S.go('corredoira', 28, 22, 3); } },
          ...[['x_w', 0, 8, 1, 8, 2, '往西的路通到山上的牧场。'], ['x_e', 18, 8, 17, 8, 1, '往东的路通到圣克鲁斯村，安塞尔莫的磨坊在那边。'], ['x_s', 9, 14, 9, 13, 3, '往南的路通到教区的旧墓地。']].map(([id, x, y, bx, by, bd, msg]) => ({ id, x, y, spr: 'invisible', async touch(S) {
            await S.narr(S.f.ph === 'lane' ? '十字架往后拽着你，要你回到路口中间去。' : msg + '今天先不去。');
            S.pos(bx, by, bd);
          } })),
          { id: 'cruceiro', x: 9, y: 8, spr: 'cruceiro', on: S => cruceiroOn(S) },
          { id: 'cruzchao', x: 9, y: 8, spr: 'cruzchao', hidden: true, solid: false, z: 1 },
          { id: 'circulo', x: 9, y: 9, spr: 'circulo', decal: true, solid: false, on: S => ringOn(S) },
          { id: 'rama', x: 12, y: 6, spr: 'rama', decal: true, solid: false, on: S => S.narr('老橡树底下落了一地枯枝，细，但都挺直。') },
          { id: 'carballo', x: 13, y: 4, spr: 'invisible', solid: true, on: S => S.narr('一棵老橡树（carballo），树干要三个人才抱得过来。\n树皮上刻满了名字和年份，最早的一个是 1898。') },
          { id: 'sinal', x: 11, y: 5, spr: 'sign', on: S => S.narr('路牌：\n↑ 拉马斯（老路）　→ 圣克鲁斯　← 山上牧场　↓ 旧墓地') },
          { id: 'taberna', x: 13, y: 10, w: 3, spr: 'taberna', on: S => S.narr(S.f.ph === 'lane' ? '小酒馆黑着灯，门上挂着一把锁。' : '路口的小酒馆，招牌上写着 TABERNA。曼努埃尔每晚都在这里喝到打烊。\n今天过节，关着门。') },
          { id: 'luar', x: 9, y: 7, spr: 'invisible', solid: false, light: { r: 4, col: 'rgba(170,190,220,.06)' } },
          { id: 'e0', x: 9, y: 0, spr: '@campa', hidden: true, solid: false, light: { r: 1.5, col: 'rgba(255,200,120,.12)' } },
          ...[1, 2, 3, 4, 5].map(i => ({ id: 'e' + i, x: 9, y: 0, spr: '@alma', hidden: true, solid: false, light: { r: 1.9, col: 'rgba(255,200,120,.16)' } })),
          { id: 'anselmo_n', x: 18, y: 8, spr: '@anselmo', hidden: true, solid: false }
        ],
        async enter(S) {
          const f = S.f;
          if (f.ph === 'lane') {
            S.dark(.88); S.plr(1.8);
            if (!f.crossIn) return crossArrive(S);
            return;
          }
          S.dark(null); S.plr(null);
          if (f.ph === 'cruz' && S.once('cruz1')) {
            await S.narr('十字路口。四条路在这里碰头。\n路中间，一座石十字架立在三层台阶上，青苔一直爬到受难像的脚下。');
            S.goal('看看石十字架');
          }
        },
        tick(S, dt) {
          procTick(S, dt);
          const f = S.f, p = W.pl;
          if (f.ph !== 'lane' || W.endScreen) return;
          if (!S.busy && f.crossIn && f.procOn && !f.pray && !f.drawn && !f.late && p.y >= 6) { f.procOn = false; S.run(pray); return; }
          if (f.pray && !S.busy) {
            f.prayT -= dt; f._ch = (f._ch ?? 0) - dt;
            if (f._ch <= 0) { f._ch = 2.6; chant(S, .008 + .014 * Math.max(0, f.prayT) / PRAYT); }
            if (f.prayT < 20 && !f.prayW1) { f.prayW1 = true; S.toast('念经声越来越轻了……'); }
            if (f.prayT < 8 && !f.prayW2) { f.prayW2 = true; bell(S, .03); S.toast('最后一句了——铃铛动了一下'); }
            if (f.prayT <= 0) { f.pray = false; f.late = true; S.run(prayEnd); }
          }
        }
      }
    }
  });

  /* ================= 人物外观的额外几笔 ================= */
  function crossX(g, d, fr, G, R) {   // 双手举着木十字架
    const C = '#6a4a2a', L = '#8a6a3a';
    if (d === 0) { R(7, G.tT - 3, 2, 13, C); R(7, G.tT - 3, 1, 13, L); R(4, G.tT, 8, 2, C); R(6, G.tT + 6, 4, 2, '#d8d4c8'); }
    else if (d === 1) { R(1, G.tT - 4, 2, 13, C); R(1, G.tT - 4, 1, 13, L); R(-1, G.tT - 1, 6, 2, C); R(2, G.tT + 5, 3, 2, '#d8d4c8'); }
    else { R(7, G.hT - 7, 2, 9, C); R(4, G.hT - 5, 8, 2, C); }
  }
  function soulX(bell, bare) {
    return function (g, d, fr, G, R) {
      if (d === 0) {
        if (!bare) { R(5, G.hT + 3, 6, 4, '#0c0c10'); R(6, G.hT + 4, 1, 1, '#ffcf5a'); R(9, G.hT + 4, 1, 1, '#ffcf5a'); }
        if (bell) { const sw = fr === 1 ? -1 : fr === 3 ? 1 : 0; R(7, G.tT + 1, 1, 3, '#8a7a5a'); R(5 + sw, G.tT + 4, 5, 4, '#c8a850'); R(6 + sw, G.tT + 4, 1, 3, '#e8d080'); R(7 + sw * 2, G.tT + 8, 1, 2, '#6a5a3a'); }
        else { R(7, G.tT + 3, 2, 5, '#f0ead0'); R(7, G.tT + 1, 2, 2, '#ffcf5a'); R(7, G.tT, 1, 1, '#fff6c0'); R(6, G.tT + 7, 4, 1, '#d8d4c8'); }
      } else if (d === 1) {
        if (!bare) R(4, G.hT + 3, 3, 3, '#0c0c10');
        if (bell) { const sw = fr === 1 ? -1 : fr === 3 ? 1 : 0; R(2 + sw, G.tT + 4, 4, 4, '#c8a850'); R(3 + sw * 2, G.tT + 8, 1, 2, '#6a5a3a'); } else { R(3, G.tT + 3, 2, 5, '#f0ead0'); R(3, G.tT + 1, 2, 2, '#ffcf5a'); }
      } else if (!bell) R(11, G.tT + 1, 2, 2, 'rgba(255,207,90,.6)');
    };
  }
  function shadeT(hex, k) { return shade(hex, k * .3); }
})();
