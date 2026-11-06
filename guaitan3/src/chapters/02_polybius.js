/* ================= 第二夜 · 波利比乌斯 ================= */
(() => {
  /* ---------------- 常量 ---------------- */
  const CODE = ['31', '15', '44', '23', '15'], WORD = 'LETHE', HI = 9990, STEP = 1500;
  const GRID = 'ABCDEFGHIKLMNOPQRSTUVWXYZ'.split('');   // 波利比乌斯方阵：I/J 共用一格
  const DEAD = 180;                                     // 02:00（从 23:00 起算的分钟）
  const ISLAND = ['i1', 'i2', 'i3', 'i4', 'i5', 'i6', 'i7', 'i8', 'i9', 'i10', 'c1', 'c2', 'c3'];
  const FOES = ['e1', 'e2', 'e3'], DOTS = ['d1', 'd2', 'd3'];
  const WORDS = ['OBEY', 'NO THOUGHT', 'DO NOT SLEEP', 'FORGET', 'KEEP PLAYING', 'YOU ARE NOT TIRED'];
  let G = null;            // 当前这一局街机（主机）
  let DIED = 0;            // 危险段里被抓过几次（只影响提示）
  let LASTBAD = '';        // 上一个坏结局（重来时给一句提示）

  /* ---------------- 3×5 像素字 ---------------- */
  const FONT = {
    '0': '111101101101111', '1': '010110010010111', '2': '111001111100111', '3': '111001111001111', '4': '101101111001001',
    '5': '111100111001111', '6': '111100111101111', '7': '111001001010010', '8': '111101111101111', '9': '111101111001111',
    A: '010101111101101', B: '110101110101110', C: '011100100100011', D: '110101101101110', E: '111100110100111', F: '111100110100100',
    G: '011100101101011', H: '101101111101101', I: '111010010010111', J: '001001001101010', K: '101101110101101', L: '100100100100111',
    M: '101111111101101', N: '110101101101101', O: '010101101101010', P: '110101110100100', Q: '010101101110011', R: '110101110101101',
    S: '011100010001110', T: '111010010010010', U: '101101101101111', V: '101101101101010', W: '101101111111101', X: '101101010101101',
    Y: '101101010010010', Z: '111001010100111', ':': '000010000010000', '/': '001001010100100', '.': '000000000000010', '-': '000000111000000',
    '?': '111001010000010', '!': '010010010000010', '_': '000000000000111', '>': '100010001010100', '*': '000101010101000'
  };
  function TXT(R, x, y, s, col, sc = 1) {
    s = String(s).toUpperCase();
    for (let i = 0; i < s.length; i++) { const gl = FONT[s[i]]; if (gl) for (let k = 0; k < 15; k++) if (gl[k] === '1') R(x + (i * 4 + (k % 3)) * sc, y + ((k / 3) | 0) * sc, sc, sc, col); }
  }
  const TW = (s, sc = 1) => (String(s).length * 4 - 1) * sc;
  /* 矢量线：Bresenham */
  function LN(R, x0, y0, x1, y1, c) {
    x0 = Math.round(x0); y0 = Math.round(y0); x1 = Math.round(x1); y1 = Math.round(y1);
    const dx = Math.abs(x1 - x0), sx = x0 < x1 ? 1 : -1, dy = -Math.abs(y1 - y0), sy = y0 < y1 ? 1 : -1; let err = dx + dy;
    for (let n = 0; n < 200; n++) { R(x0, y0, 1, 1, c); if (x0 === x1 && y0 === y1) break; const e2 = 2 * err; if (e2 >= dy) { err += dy; x0 += sx; } if (e2 <= dx) { err += dx; y0 += sy; } }
  }
  function POLY(R, cx, cy, r, n, a, c) { let px = 0, py = 0; for (let i = 0; i <= n; i++) { const an = a + i * 2 * Math.PI / n, x = cx + Math.cos(an) * r, y = cy + Math.sin(an) * r; if (i) LN(R, px, py, x, y, c); px = x; py = y; } }
  /* 屏幕里往中心转的方框（整章的母题） */
  function SPIRAL(R, cx, cy, r, t, c, n = 4) { for (let k = 0; k < n; k++) { const p = (t * .45 + k / n) % 1; POLY(R, cx, cy, r * (1 - p) + .5, 4, t * .9 + p * 2.4, c); } }
  const clockStr = m => String((23 + Math.floor(m / 60)) % 24).padStart(2, '0') + ':' + String(m % 60).padStart(2, '0');
  const pad5 = n => String(Math.max(0, Math.floor(n))).padStart(5, '0');
  const handTxt = n => CODE.map((c, i) => i < n ? c : '__').join('　');

  /* ---------------- 合成音 ---------------- */
  const bleep = (S, f, d = .07, v = .12, dl = 0) => S.tone('square', f, f, d, v, dl);
  function jingle(S) { [523, 659, 784, 1046].forEach((f, i) => bleep(S, f, .09, .1, i * .09)); }
  function digitBeeps(S, code) { code.split('').forEach((d, i) => bleep(S, 300 + (+d) * 140, .12, .14, i * .16)); }
  function panelBeeps(S, n = 5) { for (let i = 0; i < n; i++) S.tone('sine', 1180, 1180, .07, .12, i * .26); }
  function hum(S, v = .08) { S.tone('sawtooth', 58, 56, 1.4, v, 0, 220); }
  /* 那台机器的嗡嗡声：离得越近越响、越亮（只有低频，靠近了才听见高一点的啸叫） */
  function proxHum(S, dt) {
    const f = S.f; f._hm = (f._hm ?? 0) - dt; if (f._hm > 0) return; f._hm = 1.7;
    const p = getEnt('poly', 'arcade'); if (!p || p.off || S.map !== 'arcade') return;
    const d = Math.abs(W.pl.x - 16) + Math.abs(W.pl.y - 2), k = Math.max(0, 1 - d / 15);
    if (k <= 0) return;
    S.tone('sawtooth', 58, 57, 1.8, .025 + .07 * k, 0, 140 + 500 * k);
    if (d <= 3) S.tone('sine', 15600 / 2, 15600 / 2, 1.6, .006 + .01 * k);
  }

  /* ---------------- 状态小工具 ---------------- */
  function hudSet(S, o) { const h = S.ent('hud'); if (h) Object.assign(h.s, o); }
  function setClock(S) { const c = S.ent('clk'); if (c) c.s.m = S.f.clock; }
  function applySym(S) {
    const n = S.f.frags || 0;
    for (const id of ['vg0', 'vg1', 'vg2', 'vg3']) { const e = getEnt(id, 'arcade'); if (e) e.hidden = !(n >= 4 && S.f.phase === 'night'); }
    S.dark(Math.min(.8, .6 + n * .04), 'arcade');
    S.plr(n >= 3 ? 2.8 : null);
    for (const id of ISLAND) { const e = getEnt(id, 'arcade'); if (e) e.s.poly = n >= 2; }
  }
  function goalNight(S) {
    const f = S.f;
    if (!f.knowFrames) S.goal('想办法在两点前关掉那台黑色的机器（现在 ' + clockStr(f.clock) + '）');
    else S.goal('玩「波利比乌斯」，记下画面里闪过的数字（' + f.frags + '/5）· 别过 9990 · 现在 ' + clockStr(f.clock));
  }
  function giveHand(S, n) { for (let i = 1; i <= 5; i++) S.take('hand' + i); if (n > 0) S.give('hand' + n, true); }

  /* ================= 街机：矢量小游戏 ================= */
  const PILLARS = [[3, 4], [8, 4], [3, 8], [8, 8]], EXIT = [10, 10], SPAWN = [6, 7];
  const GAME_ROWS = [
    'HHHHHHHHHHHH',
    'XXXXXXXXXXXX',
    'X..........X',
    'X..........X',
    'X..X....X..X',
    'X..........X',
    'X..........X',
    'X..........X',
    'X..X....X..X',
    'X..........X',
    'X..........X',
    'XXXXXXXXXXXX'];
  const ARENA = [];
  for (let y = 2; y <= 10; y++) for (let x = 1; x <= 10; x++) if (!PILLARS.some(p => p[0] === x && p[1] === y)) ARENA.push([x, y]);
  function freeCell(S, minD, ref) {
    const [rx, ry] = ref || [W.pl.x, W.pl.y];
    const busy = [...DOTS, ...FOES].map(id => getEnt(id, 'game')).filter(e => e && !e.hidden).map(e => [Math.round(e.px / TS), Math.round(e.py / TS)]);
    const ok = ARENA.filter(([x, y]) => !(x === EXIT[0] && y === EXIT[1]) && Math.abs(x - rx) + Math.abs(y - ry) >= minD && !busy.some(b => Math.abs(b[0] - x) + Math.abs(b[1] - y) < 2));
    const L = ok.length ? ok : ARENA;
    return L[(Math.random() * L.length) | 0];
  }
  function stopFoes(S) { for (const id of FOES) S.stop(id); }
  function resetFoes(S) {
    S.place('e1', 1, 2, 0); S.place('e2', 10, 2, 0);
    if (G && G.th >= 2) S.place('e3', 1, 10, 3); else S.hide('e3');
    for (const id of FOES) getEnt(id, 'game').s.gold = false;
  }
  const baseSp = S => Math.min(3.0, 2.25 - .1 * Math.min(3, S.f.mercy || 0) + .14 * G.th);
  function farCorner() { const C = [[1, 2], [10, 2], [1, 10]]; return C.sort((a, b) => (Math.abs(b[0] - W.pl.x) + Math.abs(b[1] - W.pl.y)) - (Math.abs(a[0] - W.pl.x) + Math.abs(a[1] - W.pl.y)))[0]; }
  function chaseFoes(S, spin) {
    const sp = spin ? 2.9 : baseSp(S);
    FOES.forEach((id, i) => { const e = getEnt(id, 'game'); if (e && !e.hidden) S.chase(id, { spd: sp - i * .12, catch: hitShip, wait: spin ? 0 : .6 }); });
  }
  async function startSession(S) {
    const f = S.f;
    G = { score: 0, lives: 3, th: 0, ph: 'ready', rate: 0, wt: 3 + Math.random() * 3, tk: 0, sess0: f.frags };
    resetFoes(S);
    for (const id of DOTS) { const c = freeCell(S, 3, SPAWN); S.place(id, c[0], c[1]); }
    const ex = S.ent('exitp'); ex.s.blink = false;
    hudSet(S, { sc: 0, li: 3, ph: 'ready', fl: 0, hi: HI });
    S.tone('square', 1320, 1320, .05, .1); S.tone('square', 1760, 1760, .08, .1, .06);   // 投币
    S.wear('ship'); S.norun(true);
    await S.go('game', SPAWN[0], SPAWN[1], 3);
    jingle(S); hum(S, .06);
    if (S.once('coopTip')) S.toast('双人：一个人握摇杆；另一个人盯着屏幕报数字，顺便盯住分数别过 9990');
    if (S.once('gameHelp')) await S.narr('屏幕里只有一艘小小的三角形飞船，和几颗一闪一闪的光点。\n吃光点加分。别被那些转来转去的多边形碰到。右下角的「EXIT」是离开。');
    await S.wait(700);
    G.ph = 'play'; hudSet(S, { ph: 'play' });
    chaseFoes(S, false);
  }
  async function collectDot(S, e) {
    if (!G || (G.ph !== 'play' && G.ph !== 'spin')) return;
    bleep(S, 990, .05, .1); bleep(S, 1480, .06, .08, .05);
    G.score += 500; hudSet(S, { sc: G.score });
    const c = freeCell(S, 4); S.place(e.id, c[0], c[1]);
    await checkScore(S);
  }
  async function checkScore(S) {
    if (G.score > HI) return recordEnd(S);
    while (G && G.ph === 'play' && G.score >= (G.th + 1) * STEP && S.f.frags < 5) { G.th++; await reveal(S); }
  }
  /* 闪过一帧：下一个还没见过的数字 */
  async function reveal(S) {
    const f = S.f, k = f.frags;
    f.frags = k + 1; f.knowFrames = true;
    const h = S.ent('hud'); hudSet(S, { fl: k + 1, flN: (h.s.flN || 0) + 1 });
    S.fx('flash', { dur: .25 }); digitBeeps(S, CODE[k]);
    giveHand(S, f.frags);
    S.toast('画面闪了一帧：' + CODE[k] + '（写在手背上了）');
    await S.wait(1300);
    if (f.frags === 3 && S.once('polyFace')) { await S.scare('face', { face: 'poly', sfx: 'scare', dur: 1 }); await S.think('（……刚才那一帧不是数字。是一张脸。用线画的脸。）'); }
    if (f.frags >= 5) return startSpin(S);
    const sp = baseSp(S);
    FOES.forEach((id, i) => { const e = getEnt(id, 'game'); if (e && e.chase) e.chase.spd = sp - i * .12; });
    if (G.th >= 2 && getEnt('e3', 'game').hidden) { const c = farCorner(); S.place('e3', c[0], c[1], 0); S.chase('e3', { spd: sp - .24, catch: hitShip, wait: 1 }); S.tone('sawtooth', 120, 480, .4, .08); }
  }
  /* 第五个数字之后：分数自己往上跳，要赶在 9990 之前跑到出口 */
  async function startSpin(S) {
    stopFoes(S);
    S.tone('square', 200, 1600, 1.2, .1);
    await S.think('（分数自己往上跳了！……它不想让我走。\n趁它破纪录之前——去右下角的 EXIT！）');
    G.ph = 'spin'; G.rate = Math.max(150, (HI + 1 - G.score) / 8); G.tk = 0;
    hudSet(S, { ph: 'spin' }); S.ent('exitp').s.blink = true;
    for (const id of FOES) getEnt(id, 'game').s.gold = true;
    chaseFoes(S, true);
  }
  async function hitShip(S, e) {
    if (!G) return;
    if (G.ph === 'spin') {   // 金色的多边形：撞上去反而加分
      bleep(S, 1760, .05, .12); bleep(S, 2093, .08, .1, .06); S.fx('flash', { dur: .2 });
      G.score += 1500; hudSet(S, { sc: G.score });
      const c = freeCell(S, 6); S.place(e.id, c[0], c[1]); S.chase(e.id, { spd: 2.9, catch: hitShip, wait: .5 });
      if (G.score > HI) return recordEnd(S);
      return;
    }
    if (G.ph !== 'play') return;
    stopFoes(S); G.ph = 'hit';
    S.tone('sawtooth', 520, 40, .7, .2); S.shake(400, 3); S.fx('glitch');
    G.lives--; hudSet(S, { li: G.lives, ph: 'hit' });
    if (G.lives <= 0) { hudSet(S, { ph: 'over' }); S.tone('square', 392, 392, .25, .1); S.tone('square', 330, 330, .25, .1, .28); S.tone('square', 262, 262, .5, .1, .56); await S.wait(1400); return endSession(S, 'over'); }
    await S.wait(500);
    S.pos(SPAWN[0], SPAWN[1], 3); resetFoes(S);
    hudSet(S, { ph: 'ready' }); await S.wait(800);
    G.ph = 'play'; hudSet(S, { ph: 'play' }); chaseFoes(S, false);
  }
  async function exitTouch(S) {
    if (!G) return;
    if (G.ph === 'spin') return endSession(S, 'escape');
    if (G.ph !== 'play') return;
    const r = await S.ask('离开游戏？这一局的分数不会留下；已经看到的数字，在你手背上。', ['继续玩', '离开']);
    if (r === 1) return endSession(S, 'exit');
  }
  async function recordEnd(S) {
    if (!G || G.ph === 'rec') return;
    G.ph = 'rec'; stopFoes(S); G.score = Math.max(G.score, HI + 10); hudSet(S, { ph: 'rec', sc: G.score });
    [523, 659, 784, 1046, 1318, 1568].forEach((f, i) => bleep(S, f, .12, .12, i * .11));
    await S.wait(1200);
    await S.narr('分数停了下来。屏幕正中间，一行字慢慢地亮起来：\nNEW RECORD　　ENTER YOUR NAME');
    await S.think('（名字……三个字母就行。我叫……我叫……）');
    await S.narr('摇杆停在字母「A」上。\n你想了很久，很久。屏幕上的光标一下一下地闪。');
    await S.scare('face', { face: 'poly', sfx: 'scare', dur: 1.1 });
    LASTBAD = 'record';
    await S.end({ bad: true, id: 'record', title: '新纪录', text: '第二天早上，厄尔在那台黑色的机器前面找到了你。\n你坐得笔直，眼睛睁着，手还握着摇杆。\n你记得怎么呼吸，怎么眨眼。别的，都不记得了。\n\n机器上的最高分换成了一个新的数字。\n名字那一栏，依旧是空的。' });
  }
  async function endSession(S, why) {
    const f = S.f; if (!G) return;
    const got = f.frags - G.sess0;
    G.ph = 'off'; stopFoes(S);
    if (why === 'escape') { S.fx('glitch'); S.tone('sawtooth', 900, 60, .9, .14); }
    await S.wait(350);
    G = null;
    S.wear('@me'); S.norun(false);
    f.clock += 25; f.sess = (f.sess || 0) + 1;
    setClock(S); applySym(S);
    await S.go('arcade', 16, 3, 3);
    hum(S, .05);
    await S.narr((why === 'over' ? 'GAME OVER。你松开摇杆，手心全是汗。\n' : why === 'escape' ? '你把飞船撞进 EXIT 的那一刻，屏幕猛地一黑——\n' : '你松开摇杆。\n') + '墙上的钟：' + clockStr(f.clock) + '。你只觉得玩了三四分钟。');
    if (f.sess === 1) await S.think('（……二十五分钟。时间被它吃掉了一块。）');
    if (why === 'over') { f.mercy = (f.mercy || 0) + 1; if (S.once('overHint')) await S.think('（它们只会直直地朝我冲过来。\n绕着那四根柱子兜圈子，就能把它们甩在后面。）'); }
    if (got > 0 && f.frags < 5) await S.think('（手背上，用圆珠笔写着：' + handTxt(f.frags) + '。\n……还差 ' + (5 - f.frags) + ' 个。）');
    else if (got === 0 && f.frags < 5) await S.think('（这一局什么都没看到。分数要再高一点，它才会「眨眼」。）');
    if (f.frags >= 3 && S.once('halluc')) { S.show('hall'); S.ent('hall').alpha = .55; }
    if (f.frags >= 5) return climax(S);
    if (f.clock >= DEAD) return mibEnd(S);
    if (f.clock >= DEAD - 30 && S.once('lateWarn')) await S.think('（' + clockStr(f.clock) + ' 了。再玩一局，就该两点了。）');
    goalNight(S);
  }
  async function polyUse(S) {
    const f = S.f;
    if (f.phase === 'pro') return S.narr('黑色的机器嗡嗡地响着。');
    if (f.phase === 'done') return S.narr('屏幕黑了。玻璃上映出你自己的脸。\n……你认得出来。');
    if (f.phase === 'climax') return S.think('（没时间玩了！背板——就在机器左边！）');
    if (!f.seenPoly) {
      f.seenPoly = true;
      await S.narr(['一台漆成哑光黑的街机。没有侧板画，没有厂牌，投币口上方连一行字都没有。\n只有屏幕正上方，用细细的矢量线写着：POLYBIUS。', '屏幕里，绿色的线条一圈一圈地往中心转，像一口井。\n最高分：9990。名字那一栏，是空的。']);
      await S.think('（瑞奇说过：分数越高，画面里「眨」得越多。\n……要找到关掉它的办法，也许只能从它自己的画面里找。）');
    } else await S.narr(f.frags >= 3 ? '绿色的线条在屏幕里转。\n你盯着它，想不起来自己上一次眨眼是什么时候。' : '绿色的线条一圈一圈地往里转。最高分 9990，名字那一栏是空的。');
    const r = await S.ask('投一枚二十五美分的硬币？', ['投币', '算了']);
    if (r) return;
    S.goal('在游戏里记下闪过的数字（' + f.frags + '/5）——别破 9990 的纪录' + (S.coop ? '（双人：一人握摇杆，一人盯屏幕报数字）' : ''));
    S.cp('cab');
    return startSession(S);
  }

  /* ================= 背板与结局 ================= */
  async function panelUse(S) {
    const f = S.f;
    if (f.phase === 'pro') return S.narr('机器左边的铁皮背板。');
    if (f.phase === 'done') return S.narr('背板敞着。红色的总闸拉在最下面，磁带不转了。');
    if (f.phase === 'climax') { if (!f.seenPanel) { f.seenPanel = true; await S.think('（五排五列的字母键，左上角 A，右下角 Z，没有 J。\n第一下，第三排最左边——）'); } }
    else if (!f.seenPanel) {
      f.seenPanel = true;
      await S.narr(['机身左侧有一块巴掌大的铁皮背板，四颗螺丝都焊死了。\n侧面靠下烫着一行很小的字：©1981 SINNESLÖSCHEN。你不认识这个词。', '背板上是一片小小的方形按键——五排，每排五个，刻着字母。\n左上角是 A，右下角是 Z。数了一遍：没有 J。']);
      await S.think('（那天夜里，黑西装就是在这儿按了五下。\n第一下，按在第三排最左边。）');
    }
    if (f.frags < 5 && f.phase !== 'climax') { const r = await S.ask('要试着按吗？', ['按五个键', '算了']); if (r) return; }
    const v = await S.keypad('【背板】五排 × 五列的字母键，按五下。\n手背上的数字：' + handTxt(f.frags) + (S.coop ? '\n（双人：一个人念数字，一个人数格子）' : ''), GRID, 5, { alias: { J: 'I' } });
    if (v == null) return;
    if (v === WORD) return unplug(S);
    return wrongCode(S, v);
  }
  async function wrongCode(S, v) {
    const f = S.f;
    S.tone('square', 140, 120, .5, .16); S.sfx('locked'); S.fx('glitch');
    if (f.frags >= 5) f.wrong = (f.wrong || 0) + 1;
    if (f.phase === 'climax') { S.timerAdd(-5); await S.narr('背板「嘟——」地叫了一声，又长又刺耳。\n门外，车门好像响了一下。'); }
    else if (f.frags < 5 && !f.freeWrong) { f.freeWrong = true; await S.narr('背板「嘟——」地叫了一声。屏幕猛地亮了一下。\n……你盯着墙上的钟看了好一会儿。还好，秒针还在走。'); }
    else { f.clock += 10; setClock(S); await S.narr('背板「嘟——」地叫了一声。屏幕猛地亮了一下。\n你再看墙上的钟：' + clockStr(f.clock) + '。又过去了十分钟。'); }
    if (f.frags < 5) {
      await S.think('（手背上的数字还不全。缺的那几个，只能回到它的屏幕里去找。）');
      if (f.phase !== 'climax' && f.clock >= DEAD) return mibEnd(S);
      return goalNight(S);
    }
    /* 按错法给提示，再逐级加码 */
    const tr = CODE.map(c => GRID[(+c[1] - 1) * 5 + (+c[0] - 1)]).join('');
    if (v === tr) return S.think('（……反了？那天他第一下按在「第三排」最左边。\n先数第几排，再数第几个。）');
    if (v[0] === 'L' && f.wrong < 4) return S.think('（第一个 L 对上了。剩下的，一格一格地数——两个数字一个字母。）');
    if (f.wrong >= 4) return S.think('（31——第三排第一个，L。15，E。44，T。23，H。15，又是 E。\nL、E、T、H、E。）');
    if (f.wrong >= 3) return S.think('（31：第三排，第一个。前一个数字是第几排，后一个是这一排的第几个。）');
    if (f.wrong >= 2) return S.think('（数字是两个两个的。背板也正好是五排、五列……\n瑞奇那本图书馆的书里，好像讲过这种格子。）');
    return S.think('（不对。……数字有十个，按键只按五下。）');
  }
  function mibNear(d) { for (const id of ['mib1', 'mib2']) { const e = getEnt(id, 'arcade'); if (e && !e.hidden && e.chase && Math.abs(e.px - W.pl.px) + Math.abs(e.py - W.pl.py) < d) return true; } return false; }
  async function climax(S) {
    const f = S.f;
    f.phase = 'climax'; S.hide('hall'); applySym(S);
    S.ent('ricky').s.sleep = true; S.place('ricky', 17, 9, 0); S.show('zz');
    S.lights([[152, 182, 4.5, .85], [128, 182, 3, .5]]);
    S.sfx('car'); S.tone('sawtooth', 70, 64, 2.5, .08, 0, 300);
    await S.narr('门外，一道车灯扫过玻璃门，停住了。\n引擎没有熄火。');
    if (f.clock >= DEAD) await S.think('（两点了。……他们准时来了。\n可我已经看完了它所有的数字。）');
    else await S.think('（现在才 ' + clockStr(f.clock) + '。他们提前来了。\n……是它把他们叫来的。我看完了它所有的数字。）');
    await S.think('（手背上：' + handTxt(5) + '。\n背板在机器左边——趁他们还没下车！）');
    S.goal('黑衣人进门之前，在机器左侧的背板上输入密码');
    S.cp('mib');
    mibSetup(S);
  }
  function mibSetup(S) {
    S.lights([[152, 182, 4.5, .85], [128, 182, 3, .5]]);
    S.hide('mib1'); S.hide('mib2'); S.show('mibcar');
    S.ent('ricky').s.sleep = true; S.show('zz');
    S.timer(DIED ? 30 : 45, '黑衣人', mibEnter, { during: true });   // 实测：知道答案的人 10 秒内能按完；边数格子边按约 30–40 秒
    S.goal('黑衣人进门之前，在机器左侧的背板上输入密码');
  }
  async function mibEnter(S) {
    S.tone('triangle', 2637, 2637, .5, .1); S.tone('triangle', 3136, 3136, .6, .08, .12);   // 门铃
    S.sfx('open');
    S.place('mib1', 9, 11, 3); S.place('mib2', 8, 10, 3);
    S.ent('mib1').light = { r: 3, col: 'rgba(230,240,255,.12)', dy: -8 };
    S.goal('他们进来了！在背板上按完密码，别被抓住');
    await S.narr('门上的铃铛「叮」地响了。\n两个穿黑西装的人走进来，手电筒的光在地毯上扫来扫去。');
    S.chase('mib1', { spd: 2.7, always: true, wait: .6, catch: caught });
    S.chase('mib2', { spd: 2.25, always: true, wait: 1.2, catch: caught });
  }
  async function caught(S) {
    DIED++; S.stop('mib1'); S.stop('mib2'); S.clearTimer();
    S.sfx('thud');
    await S.scare('face', { face: 'mib', sfx: 'scare' });
    await S.die('一只戴黑手套的手，按在了你的肩膀上。\n「样本十二。」', '被「回收」了');
  }
  async function unplug(S) {
    const f = S.f, inside = !getEnt('mib1', 'arcade').hidden;
    S.clearTimer(); f.phase = 'done';
    S.stop('mib1'); S.stop('mib2');
    S.sfx('switch'); S.tone('sine', 880, 1760, .25, .12);
    S.ent('svc').open = true;
    await S.narr('「咔哒」。背板弹开了。\n里面没有电路板——只有一个红色的总闸，和一盘正在缓缓转动的磁带。');
    await S.narr('磁带的标签上，用打字机打着一行字：\n「样本 11 ／ 第 10 晚」。');
    await S.ask(inside ? '身后的脚步声停了。' : '总闸就在手边。', ['拉下总闸']);
    S.sfx('cut'); S.tone('sawtooth', 320, 30, 1.8, .22); S.fx('static'); S.shake(700, 3);
    const p = S.ent('poly'); p.off = true; p.light = null;
    await S.wait(500);
    await S.narr('屏幕上的线条一下子全缩成了正中间的一个白点。\n白点亮了很久，很久，才终于灭掉。');
    for (const id of ISLAND) { const e = getEnt(id, 'arcade'); if (e) e.s.poly = false; }
    S.dark(.62, 'arcade'); S.plr(null);
    if (!inside) {
      S.tone('triangle', 2637, 2637, .5, .1); S.sfx('open');
      S.place('mib1', 9, 11, 3); S.place('mib2', 8, 10, 3);
      await S.narr('门上的铃铛响了。两个穿黑西装的人走进来。');
      const a = S.walk('mib1', [14, 3], 3.2); await S.wait(300); await S.walk('mib2', [16, 4], 3.2); await a;
    }
    S.face('mib1', 'pl'); S.face('mib2', 'poly'); S.face('pl', 'mib1');
    await S.narr('一个人弯下腰，看着那块黑掉的屏幕。另一个人翻开夹板，写了一行字。');
    await S.say('黑西装', '……样本中断。');
    await S.say('黑西装', '撤。', { style: 'whisper' });
    await S.narr('他们谁都没有看你。\n磁带停在背板里，离你的手只有一拃远。');
    const r = await S.ask('他们正盯着那块黑掉的屏幕——', ['把磁带塞进外套', '别碰它']);
    const photo = f.sawPhoto ? '\n\n失物招领箱里那张夏天的照片，你后来拿给他看。\n他看了很久，说：「这天我记得。」' : '';
    const card = f._o_readN4 ? '\n你想起雨里那张卡片上的字：「如遇断电——中止，撤收，不留痕迹。」他们说到做到。' : '';
    if (r === 0) {
      S.sfx('item');
      await S.narr('你把磁带抽出来，塞进外套里面。\n它贴着你的肚子，微微发热。');
      await S.end({ id: 'tape', title: '样本 11', text: '那天夜里，瑞奇在长椅上睡着了。他睡了整整十四个小时。\n醒来以后，他想起了你的名字，想起了他妈妈的生日。只有那十天，他怎么也想不起来。' + photo + '\n\n那盘磁带，你一直没有放。\n\n很多年以后，一个街机资料网站上出现了一条奇怪的条目：一台叫「波利比乌斯」的机器，1981 年，波特兰。\n下面有人回帖：编的吧。\n你盯着屏幕看了很久，没有留言。\n抽屉最深处，那盘磁带贴着你的手指，微微发热——像是还在转。' });
      return;
    }
    await S.end({ id: 'unplug', title: '拔掉电源', text: '那天夜里，他们没有带走任何人。\n天快亮的时候，瑞奇在长椅上睡着了。他睡了整整十四个小时。\n醒来以后，他想起了你的名字，想起了他妈妈的生日。只有那十天，他怎么也想不起来。' + photo + '\n\n几周后的一个早上，厄尔打开店门，发现最里面的角落空了。\n地毯上只剩下一块方方正正的、没有褪色的印子。\n没有人看见它是怎么被搬走的。' + card + '\n后来，再也没有人见过一台叫「波利比乌斯」的机器。\n\n你偶尔还会失眠。\n闭上眼睛，黑暗里有一圈很淡很淡的绿线，转一下，就停了。' });
  }
  async function mibEnd(S) {
    const f = S.f;
    f.phase = 'late'; S.clearTimer();
    S.lights([[152, 182, 4.5, .85]]);
    await S.narr('墙上的钟，指着两点整。\n门上的铃铛响了。');
    S.place('mib1', 9, 11, 3); S.place('mib2', 8, 10, 3);
    const a = S.walk('mib1', [16, 4], 3); await S.wait(300); await S.walk('mib2', [15, 4], 3); await a;
    S.face('mib1', 'pl'); S.face('pl', 'mib1');
    await S.say('黑西装', '你玩了。');
    await S.say('黑西装', '……多少分？');
    await S.scare('face', { face: 'mib', sfx: 'scare' });
    LASTBAD = 'mib';
    await S.end({ bad: true, id: 'mib', title: '两点整', text: '他们没有碰你。\n一个人打开背板，换了一盘新的磁带，在夹板上写了一行字。\n另一个人摘下墨镜，看着你的眼睛，看了很久。\n\n第二天，你在自己的床上醒来，不记得是怎么回的家。\n你记得游戏厅，记得厄尔，却怎么也想不起来——\n那个总坐在长椅边上的金头发男孩，叫什么名字。' });
  }

  /* ================= 角色 ================= */
  async function rickyUse(S) {
    const f = S.f;
    if (f.phase === 'pro') return;
    if (f.phase === 'climax' || f.phase === 'done') return S.narr('瑞奇靠着墙睡着了，嘴巴微微张着。\n十天来，他第一次睡着。');
    if (f.frags >= 4 && S.once('forgot')) {
      await S.think('（你走到他面前，张开嘴——\n……他叫什么来着？）');
      await S.wait(700);
      await S.think('（……瑞奇。是瑞奇！我刚才居然想不起来。）');
    }
    if (f.frags === 0) {
      await S.say('瑞奇', ['……别过一万。', '纪录那一栏没有名字，你看见了吗？……因为打破纪录的人，连自己叫什么都忘了。']);
      if (!f.readN1) await S.say('瑞奇', '我记过东西……在本子里。本子在包里。我不记得记了什么。');
      return;
    }
    if (f.frags <= 2) return S.say('瑞奇', ['你也看见了？……它眨眼的那一下。', '别盯着它看太久。它会往你脑子里写东西。写满了，就把原来的擦掉。']);
    return S.say('瑞奇', ['凯……凯尔。你的眼睛好红。', '……你多久没睡了？我也是。']);
  }
  async function bagUse(S) {
    const f = S.f;
    if (!f.readN1) {
      f.readN1 = true; f.knowFrames = true;
      await S.narr('瑞奇的书包。拉链坏了一半，里面塞着一本数学练习本。');
      await S.note('n1');
      await S.narr('书包底下，还压着一本图书馆的书。借书卡上最后一个名字是瑞奇。');
      await S.note('n3');
      await S.think('（两个数字两个数字地眨……还有这本书上的格子。\n得看清它到底在画面里藏了什么。）');
      if (f.phase === 'night') goalNight(S);
      return;
    }
    const r = await S.ask('瑞奇的书包。', ['看练习本', '看图书馆的书', '算了']);
    if (r === 0) await S.note('n1'); else if (r === 1) await S.note('n3');
  }
  async function phoneUse(S) {
    const f = S.f;
    if (f.phase === 'climax') return S.think('（来不及打电话了！）');
    const r = await S.ask('厄尔桌上的电话。', ['打给厄尔', '打给瑞奇家', '算了']);
    if (r === 2) return;
    S.sfx('phone');
    if (r === 0) { await S.narr('嘟——嘟——嘟——\n响了十几声，没人接。厄尔说过，他睡着了雷都打不醒。'); return; }
    if (f.frags >= 3) {
      await S.narr('电话通了。听筒里没有人说话。\n只有很远、很远的「嘀——嘀嘀——」，像一台街机在另一头开着。');
      digitBeeps(S, '3115');
      await S.narr('你挂掉电话。手心全是汗。');
      return;
    }
    await S.say('瑞奇的妈妈', ['……喂？凯尔？瑞奇说他今晚住你家。', '他这一个礼拜晚上都不睡，白天叫也叫不醒。我问他，他说……他说他不记得了。', '……你让他明天回家吃饭，好吗？']);
  }

  /* ================= 精灵 ================= */
  const SPRX = {
    /* 普通街机：e.col 机身，e.s.k 画面，e.s.poly = 画面变成那台机器的螺旋（症状） */
    cab(g, e, t, R) {
      const c = e.col || '#2a4a9a', k = e.s && e.s.k || 0;
      R(1, -14, 14, 30, '#07070b'); R(2, -13, 12, 28, c); R(2, -13, 12, 4, shade(c, .35)); R(3, -12, 10, 2, (Math.sin(t * 3 + e.px) > 0) ? '#fff6c8' : shade(c, .55));
      R(3, -8, 10, 8, '#0a0a10'); R(4, -7, 8, 6, '#020306');
      if (e.poly && Math.sin(t * 2.3 + e.px * .1) > -.6) SPIRAL(R, 8, -4, 3.4, t, '#4dff9a', 2);
      else if (k === 0) { for (let i = 0; i < 4; i++) R(5 + i * 2, -6 + ((t * 2 + i) | 0) % 2, 1, 1, '#7cf'); R(7 + Math.round(Math.sin(t * 2) * 2), -2, 2, 1, '#4f4'); }
      else if (k === 1) { R(5, -6, 6, 1, '#33f'); R(5, -3, 6, 1, '#33f'); const x = 5 + (((t * 4) | 0) % 6); R(x, -5, 2, 2, '#ff0'); R(10, -5, 1, 1, '#f8a'); }
      else if (k === 2) { const y = ((t * 6) | 0) % 6; R(7, -7, 2, 6, '#555'); R(7, -7 + y, 2, 1, '#fff'); R(5, -3, 2, 2, '#e33'); }
      else if (k === 3) { POLY(R, 8, -4, 2.5, 3, t * 2, '#fff'); R(5, -6, 1, 1, '#aaa'); R(11, -2, 1, 1, '#aaa'); }
      else if (k === 4) { for (let i = 0; i < 3; i++) R(4 + i * 3, -7, 2, 1, ['#f44', '#fa4', '#4f4'][i]); R(4 + (((t * 5) | 0) % 7), -3, 1, 1, '#fff'); R(6, -2, 4, 1, '#ccc'); }
      else { R(4, -7, 8, 6, '#151515'); R(5, -5, 6, 2, '#e8e0a0'); }
      R(1, 0, 14, 4, '#1a1a22'); R(4, 1, 1, 2, '#999'); R(4, 0, 1, 1, '#e33'); R(9, 2, 1, 1, '#ee4'); R(11, 2, 1, 1, '#4e4');
      R(2, 4, 12, 11, shade(c, -.25)); R(6, 7, 4, 2, '#333'); R(7, 8, 2, 1, '#c9a35a');
    },
    /* 波利比乌斯：哑光黑，没有任何字，屏幕里绿线一圈圈往里转 */
    polycab(g, e, t, R) {
      R(0, -16, 16, 32, '#020203'); R(1, -15, 14, 30, '#0d0d10'); R(1, -15, 14, 5, '#09090b');
      R(3, -9, 10, 9, '#000'); R(4, -8, 8, 7, e.off ? '#050607' : '#010402');
      if (!e.off) { SPIRAL(R, 8, -4.5, 4, t, '#59ff9e', 3); if (Math.sin(t * 7) > .97) R(4, -8, 8, 7, 'rgba(200,255,220,.5)'); }
      else R(8, -5, 1, 1, Math.sin(t) > .99 ? '#fff' : '#050607');
      R(1, 0, 14, 4, '#111114'); R(5, 1, 1, 2, '#333'); R(5, 0, 1, 1, '#222'); R(10, 2, 1, 1, '#222');
      R(1, 4, 14, 11, '#0a0a0c'); R(6, 7, 4, 2, '#1a1a1a'); R(7, 8, 2, 1, '#555');
    },
    /* 侧面的服务背板：5×5 小键；open = 打开，露出红色总闸和磁带 */
    svc(g, e, t, R) {
      R(10, -12, 6, 27, '#0b0b0e');
      R(10, -6, 5, 10, e.open ? '#16161a' : '#6c6f74'); R(10, -6, 5, 1, '#8a8e94');
      if (!e.open) { for (let y = 0; y < 5; y++) for (let x = 0; x < 5; x++) R(10 + x, -5 + y * 2 - (x % 1), 1, 1, (x + y) % 2 ? '#2a2c30' : '#3a3d42'); }
      else { R(11, -5, 3, 4, '#a01818'); R(12, -6 + (e.lit ? 0 : 3), 1, 2, '#e8e0d0'); R(10, 0, 5, 3, '#2a2420'); R(11, 1, 1, 1, '#8a7a60'); R(13, 1, 1, 1, '#8a7a60'); }
    },
    /* 电源线：没有插头，直接钻进墙角的铁管 */
    conduit(g, e, t, R) { R(0, 6, 9, 2, '#1a1a1a'); R(8, -14, 3, 22, '#7a7d82'); R(8, -14, 1, 22, '#9a9ea4'); R(7, 6, 5, 3, '#5a5d62'); R(7, -2, 5, 2, '#5a5d62'); },
    /* 墙上的最高分排行（手写） */
    hiboard(g, e, t, R) {
      R(1, 1, 14, 12, '#d8d0b0'); R(1, 1, 14, 2, '#a02a2a'); R(2, 1, 12, 1, '#c84a3a');
      for (let i = 0; i < 4; i++) { R(3, 5 + i * 2, 6, 1, '#4a4a5a'); R(10, 5 + i * 2, 3, 1, i === 3 ? '#b01818' : '#4a4a5a'); }
      R(9, 10, 5, 1, '#b01818'); R(9, 12, 5, 1, '#b01818');
    },
    /* 挂钟：e.s.m = 分钟（从 23:00 起） */
    clock2(g, e, t, R) {
      const m = (e.m != null ? e.m : 30) + 23 * 60, h = (m / 60) % 12, mi = m % 60;
      R(3, 1, 10, 10, '#1a1a20'); R(4, 2, 8, 8, '#e8e2cc'); R(7, 2, 2, 1, '#555');
      const cx = 7.5, cy = 6, ah = h / 12 * Math.PI * 2 - Math.PI / 2, am = mi / 60 * Math.PI * 2 - Math.PI / 2;
      LN(R, cx, cy, cx + Math.cos(ah) * 2.2, cy + Math.sin(ah) * 2.2, '#111'); LN(R, cx, cy, cx + Math.cos(am) * 3.4, cy + Math.sin(am) * 3.4, '#a01818');
    },
    changer(g, e, t, R) { R(2, -10, 12, 25, '#3a3d44'); R(3, -9, 10, 4, '#e8c040'); R(4, -8, 8, 2, '#a07010'); R(5, -3, 6, 4, '#111'); R(6, -2, 4, 1, '#4f4'); R(4, 4, 8, 3, '#222'); R(5, 9, 6, 3, '#1a1a1a'); R(6, 10, 4, 1, '#c9a35a'); },
    pinball(g, e, t, R) { R(1, -6, 14, 8, '#2a1a40'); R(2, -5, 12, 6, Math.sin(t * 4) > 0 ? '#e85aa0' : '#a03a80'); box(R, 1, 2, 14, 26, '#3a2a5a'); R(3, 4, 10, 20, '#0e1a30'); R(5, 8, 2, 2, '#ff4'); R(9, 12, 2, 2, '#4ff'); R(6, 18, 4, 1, '#e44'); R(7, 15, 2, 2, '#ddd'); R(2, 27, 2, 3, '#222'); R(12, 27, 2, 3, '#222'); },
    bag(g, e, t, R) { R(3, 6, 10, 9, '#2a4a7a'); R(4, 5, 8, 2, '#3a5a8a'); R(5, 9, 6, 4, '#1e3a62'); R(6, 4, 4, 1, '#222'); R(9, 11, 2, 1, '#c9a35a'); R(4, 13, 3, 2, '#e8e0d0'); },
    trash(g, e, t, R) { R(3, 3, 10, 12, '#4a5058'); R(2, 2, 12, 2, '#5a6068'); R(5, 1, 3, 2, '#c03030'); R(9, 0, 3, 3, '#e8e0d0'); },
    gdoor(g, e, t, R) { R(1, 0, 14, 16, '#0a1018'); R(2, 1, 5, 14, '#16243a'); R(9, 1, 5, 14, '#16243a'); R(7, 0, 2, 16, '#9aa0a8'); R(3, 2, 1, 6, 'rgba(255,255,255,.25)'); R(6, 8, 1, 3, '#c9c9c9'); R(9, 8, 1, 3, '#c9c9c9'); },
    breaker(g, e, t, R) { R(3, 1, 10, 12, '#6a6e74'); R(4, 2, 8, 10, '#5a5e64'); for (let i = 0; i < 3; i++) R(5 + i * 2, 4, 1, 3, '#2a2a2a'); R(6, 9, 4, 4, '#c8a040'); R(7, 8, 2, 2, '#8a7030'); R(7, 10, 2, 1, '#3a3020'); },
    cal(g, e, t, R) { R(3, 1, 10, 12, '#f0ece0'); R(3, 1, 10, 3, '#2a5a9a'); for (let y = 0; y < 4; y++) for (let x = 0; x < 4; x++) R(4 + x * 2, 5 + y * 2, 1, 1, '#c02020'); },
    neon(g, e, t, R) {
      R(0, 1, 32, 11, '#120a14');
      const on = Math.sin(t * 9) > -.7, pOn = Math.sin(t * 23 + Math.sin(t * 3)) > .1;
      const s = 'STAR PORT';
      for (let i = 0; i < s.length; i++) { const col = i < 4 ? (on ? '#ff5ab4' : '#5a2440') : (i === 5 && !pOn ? '#183038' : '#5af0ff'); TXT(R, 1 + i * 3.4, 4, s[i], col); }
      R(0, 12, 32, 1, '#2a1a24');
    },
    awin(g, e, t, R) { R(1, 1, 14, 12, '#2a2a30'); R(2, 2, 12, 10, '#07080e'); const k = hash(e.px, 3, 1); R(3 + ((k * 6) | 0), 7, 3, 4, ['#2a4a9a', '#9a2a3a', '#2a8a4a'][(k * 3) | 0]); R(4 + ((k * 6) | 0), 8, 1, 1, '#9ff'); R(2, 2, 12, 1, 'rgba(255,255,255,.08)'); if (e.green) R(10, 8, 3, 3, Math.sin(t * 3) > 0 ? '#3f9' : '#1a5'); },
    glassdoor(g, e, t, R) { R(2, -2, 12, 16, '#1a1d22'); R(3, -1, 10, 14, '#0a1220'); R(3, -1, 10, 1, '#2a3a50'); R(7, -1, 1, 14, '#9aa0a8'); R(5, 5, 1, 2, '#ccc'); R(9, 5, 1, 2, '#ccc'); R(4, 0, 1, 5, 'rgba(255,255,255,.18)'); },
    bike(g, e, t, R) { R(1, 8, 6, 6, '#111'); R(2, 9, 4, 4, '#2a2a2a'); R(9, 8, 6, 6, '#111'); R(10, 9, 4, 4, '#2a2a2a'); R(4, 7, 8, 1, '#c03030'); R(7, 5, 1, 4, '#c03030'); R(11, 4, 1, 4, '#888'); R(10, 4, 3, 1, '#333'); R(6, 4, 3, 1, '#222'); R(11, 5, 4, 3, '#555'); },
    dumpster(g, e, t, R) { box(R, 0, 2, 16, 13, '#2a5a3a'); R(0, 0, 16, 3, '#1e4a2e'); R(2, 6, 12, 1, '#1e4a2e'); R(3, 14, 2, 2, '#111'); R(11, 14, 2, 2, '#111'); },
    oil(g, e, t, R) { R(2, 4, 26, 8, 'rgba(10,10,14,.55)'); R(6, 6, 6, 3, 'rgba(80,60,120,.25)'); R(18, 7, 5, 2, 'rgba(40,90,100,.25)'); },
    zzz(g, e, t, R) { for (let i = 0; i < 3; i++) { const p = (t * .5 + i / 3) % 1, x = 9 + Math.sin(p * 6 + i) * 2 + p * 4, y = -14 - p * 12; const c = `rgba(220,230,255,${(1 - p) * .8})`; R(x, y, 3, 1, c); R(x + 1, y + 1, 1, 1, c); R(x, y + 2, 3, 1, c); } },
    vgrid(g, e, t, R) {   /* 幻觉：游戏厅里一闪而过的矢量网格（每 7 秒左右闪不到半秒） */
      const k = (t + e.px * .003) % 7; if (k > .4 || Math.sin(k * 40) < -.2) return;
      const c = 'rgba(90,255,160,.35)';
      for (let x = 0; x < e.w * 16; x += 16) R(x, 32, 1, 160, c);
      for (let y = 32; y < 192; y += 16) R(0, y, e.w * 16, 1, c);
    },
    register(g, e, t, R) { R(3, 2, 10, 6, '#2a2a30'); R(4, 3, 6, 2, '#3aff8a'); R(4, 6, 8, 1, '#8a8a90'); R(10, 0, 2, 3, '#555'); },
    card(g, e, t, R) { R(4, 8, 8, 5, '#d8d4c8'); R(5, 9, 5, 1, '#666'); R(5, 11, 4, 1, '#888'); R(10, 9, 1, 1, '#333'); },
    /* ---------- 游戏里 ---------- */
    ship(g, e, t, R) {
      const a = [Math.PI, -Math.PI / 2, Math.PI / 2, 0][e.dir || 0], c = Math.cos(a), s = Math.sin(a);
      const P = ([x, y]) => [8 + (x - 8) * c - (y - 8) * s, 8 + (x - 8) * s + (y - 8) * c];
      const n = P([8, 2]), l = P([3, 13]), r = P([13, 13]), m = P([8, 10]);
      const H = getEnt('hud', 'game'), col = (H && H.s.ph === 'hit' && Math.sin(t * 40) > 0) ? '#ff4060' : '#8ff4ff';
      LN(R, n[0], n[1], l[0], l[1], col); LN(R, n[0], n[1], r[0], r[1], col); LN(R, l[0], l[1], m[0], m[1], col); LN(R, r[0], r[1], m[0], m[1], col);
      if (Math.sin(t * 30) > 0) { const q = P([8, 13]); R(q[0], q[1], 1, 1, '#ffb040'); }
    },
    dot(g, e, t, R) { const p = 2.5 + Math.sin(t * 6 + e.px) * 1; POLY(R, 8, 8, p, 4, 0, '#d8ffe8'); R(8, 8, 1, 1, '#fff'); },
    vshape(g, e, t, R) {
      const k = e.k || 4, col = e.gold ? (Math.sin(t * 12) > 0 ? '#ffe060' : '#ffa020') : ({ 3: '#ff4a7a', 4: '#c060ff', 6: '#ff8a30' }[k]);
      POLY(R, 8, 8, 6, k, t * (k === 3 ? 3 : -2.2) + e.px * .01, col); POLY(R, 8, 8, 3, k, -t * 2.5, col);
    },
    exitpad(g, e, t, R) {
      const on = !e.blink || Math.sin(t * 10) > -.2, c = on ? '#4dff9a' : '#145a30';
      LN(R, 1, 1, 14, 1, c); LN(R, 1, 14, 14, 14, c); LN(R, 1, 1, 1, 14, c); LN(R, 14, 1, 14, 14, c);
      TXT(R, 1, 6, 'EXIT', c); if (e.blink) { const k = ((t * 6) | 0) % 3; R(6 + k * 2, 12, 1, 1, '#fff'); }
    },
    /* HUD：分数、最高分、命，闪过的帧和字；也画外面的显像管边框 */
    hud(g, e, t, R) {
      const W2 = 192, H2 = 192;
      R(-12, -12, W2 + 24, 12, '#141418'); R(-12, H2, W2 + 24, 12, '#141418'); R(-12, 0, 12, H2, '#141418'); R(W2, 0, 12, H2, '#141418');
      R(-2, -2, W2 + 4, 2, '#2a2a30'); R(-2, H2, W2 + 4, 2, '#2a2a30'); R(-2, 0, 2, H2, '#2a2a30'); R(W2, 0, 2, H2, '#2a2a30');
      const sc = e.sc || 0, ph = e.ph;
      TXT(R, 3, 3, pad5(sc), sc > 9000 ? (Math.sin(t * 14) > 0 ? '#ff4040' : '#ffd040') : '#ffffff', 2);
      const hiC = ph === 'spin' ? (Math.sin(t * 16) > 0 ? '#ff3030' : '#ffffff') : '#ffd040';
      TXT(R, W2 - 3 - TW('09990', 2), 3, '09990', hiC, 2); TXT(R, W2 - 3 - TW('09990', 2) - 10, 8, 'HI', hiC);
      TXT(R, W2 / 2 - TW('POLYBIUS') / 2, 1, 'POLYBIUS', '#3a8a5a');
      for (let i = 0; i < (e.li ?? 3); i++) { const x = W2 / 2 - 10 + i * 8; LN(R, x + 3, 9, x, 14, '#8ff4ff'); LN(R, x + 3, 9, x + 6, 14, '#8ff4ff'); LN(R, x, 14, x + 6, 14, '#8ff4ff'); }
      const M = SPRX._m;
      if (e.flN !== M.flN) { M.flN = e.flN; M.flT = t; }
      if (e.wdN !== M.wdN) { M.wdN = e.wdN; M.wdT = t; }
      const cx = W2 / 2, cy = 104;
      if (ph === 'ready') { const s = 'READY'; if (Math.sin(t * 8) > -.3) TXT(R, cx - TW(s, 2) / 2, cy - 5, s, '#ffd040', 2); }
      if (ph === 'over') { const s = 'GAME OVER'; R(cx - 46, cy - 10, 92, 20, '#000'); TXT(R, cx - TW(s, 2) / 2, cy - 5, s, '#ff4040', 2); }
      if (ph === 'spin') { const s = '> > > EXIT'; if (Math.sin(t * 9) > 0) TXT(R, cx - TW(s) / 2, 22, s, '#4dff9a'); TXT(R, cx - TW('DO NOT LEAVE') / 2, 182, 'DO NOT LEAVE', Math.sin(t * 5) > 0 ? '#ff4060' : '#401020'); }
      if (ph === 'rec') { R(cx - 70, cy - 22, 140, 44, '#000'); LN(R, cx - 70, cy - 22, cx + 69, cy - 22, '#ffd040'); LN(R, cx - 70, cy + 21, cx + 69, cy + 21, '#ffd040'); TXT(R, cx - TW('NEW RECORD', 2) / 2, cy - 15, 'NEW RECORD', Math.sin(t * 10) > 0 ? '#ffd040' : '#ff5a5a', 2); TXT(R, cx - TW('ENTER YOUR NAME') / 2, cy + 2, 'ENTER YOUR NAME', '#fff'); TXT(R, cx - 13, cy + 11, Math.sin(t * 6) > 0 ? '_ _ _' : '  _ _', '#8ff4ff'); }
      /* 闪过的数字帧 */
      const fa = t - M.flT;
      if (e.fl && fa >= 0 && fa < 1.25 && ((fa * 9) | 0) % 4 !== 3) {
        R(cx - 40, cy - 34, 80, 68, '#000'); POLY(R, cx, cy, 44, 4, Math.PI / 4, '#1a6a40');
        const code = CODE[e.fl - 1] || '';
        TXT(R, cx - TW(e.fl + '/5') / 2, cy - 28, e.fl + '/5', '#3a8a5a');
        TXT(R, cx - TW(code, 6) / 2, cy - 16, code, '#ffffff', 6);
      }
      /* 一闪而过的字（真正的「潜意识帧」：只有一两帧那么长） */
      const wa = t - M.wdT;
      if (e.wdN && wa >= 0 && wa < .14 && ph !== 'rec') { const s = WORDS[(e.wd || 0) % WORDS.length]; const y = 40 + ((e.wdY || 0) % 120); R(0, y - 3, W2, 16, 'rgba(255,255,255,.85)'); TXT(R, cx - TW(s, 2) / 2, y, s, '#000', 2); }
      for (let y = 16; y < H2; y += 2) R(0, y, W2, 1, 'rgba(0,0,0,.16)');
    },
    _m: { flN: null, flT: -9, wdN: null, wdT: -9 }
  };
  /* 自定义精灵入口：同时顺手把 25 键的背板密码盘排成 5×5（引擎默认 3 列；双方各自在绘制时调整） */
  const SPR2 = {};
  for (const k in SPRX) if (typeof SPRX[k] === 'function') SPR2[k] = SPRX[k];
  const svcDraw = SPR2.svc;
  SPR2.svc = (g, e, t, R) => { svcDraw(g, e, t, R); kpCols(); };
  SPR2.polycab = ((f) => (g, e, t, R) => { f(g, e, t, R); kpCols(); })(SPR2.polycab);
  /* 字母密码盘：W/A/S/D、E、I、J、M、T、X、Y、N、Z 等字母同时是引擎快捷键（移动焦点、确认、背包、静音、取消……），
     在本章这块 25 键的背板打开时，先在捕获阶段截下字母键，只当作「按下这个字母」 */
  addEventListener('keydown', e => {
    if (!W || W.ch.id !== 'polybius' || !W.keypad || !W.keypad.keys || W.keypad.keys.length !== 25 || UI.modal) return;
    if (!e.key || e.key.length !== 1 || !/[a-z]/i.test(e.key)) return;
    e.stopImmediatePropagation(); e.preventDefault();
    if (e.repeat || !iControl()) return;
    const k = e.key.toUpperCase(); sendAct('key', k === 'J' ? 'I' : k);
  }, true);
  function kpCols() {
    const K = document.getElementById('kpK'); if (!K) return;
    const want = (W && W.keypad && W.keypad.keys && W.keypad.keys.length === 25) ? 'repeat(5,1fr)' : '';
    if (K.style.gridTemplateColumns !== want) K.style.gridTemplateColumns = want;
  }

  const TILESX = {
    arc: { solid: false, paint(R, X, Y) { R(0, 0, 16, 16, '#15122a'); const cs = ['#e0408a', '#38c8e8', '#e8c838', '#7a50e0']; for (let i = 0; i < 6; i++) { const h = hash(X * 7 + i, Y * 13 + i, 5); R((h * 15) | 0, (hash(X, Y, i + 40) * 15) | 0, i % 3 ? 1 : 2, 1, cs[i % 4]); } R(0, 15, 16, 1, '#100e20'); } },
    vfloor: { solid: false, paint(R) { R(0, 0, 16, 16, '#020504'); R(0, 0, 16, 1, '#071a10'); R(0, 0, 1, 16, '#071a10'); R(0, 0, 1, 1, '#145a34'); } },
    vwall: { solid: true, paint(R, X, Y) {
      const open = (x, y) => { const r = GAME_ROWS[y]; return !!r && r[x] === '.'; };
      const u = open(X, Y - 1), d = open(X, Y + 1), l = open(X - 1, Y), r = open(X + 1, Y), C = '#2ad0ff', C2 = '#0c4a66';
      R(0, 0, 16, 16, '#000');
      const H = (y, a, b, c) => R(a, y, b - a + 1, 1, c), V = (x, a, b, c) => R(x, a, 1, b - a + 1, c);
      if (u) { H(2, l ? 2 : 0, r ? 13 : 15, C); H(4, l ? 4 : 0, r ? 11 : 15, C2); }
      if (d) { H(13, l ? 2 : 0, r ? 13 : 15, C); H(11, l ? 4 : 0, r ? 11 : 15, C2); }
      if (l) { V(2, u ? 2 : 0, d ? 13 : 15, C); V(4, u ? 4 : 0, d ? 11 : 15, C2); }
      if (r) { V(13, u ? 2 : 0, d ? 13 : 15, C); V(11, u ? 4 : 0, d ? 11 : 15, C2); }
      /* 凹角：两边都是墙、斜对角是空地 */
      if (!u && !l && open(X - 1, Y - 1)) { R(0, 2, 3, 1, C); R(2, 0, 1, 3, C); }
      if (!u && !r && open(X + 1, Y - 1)) { R(13, 2, 3, 1, C); R(13, 0, 1, 3, C); }
      if (!d && !l && open(X - 1, Y + 1)) { R(0, 13, 3, 1, C); R(2, 13, 1, 3, C); }
      if (!d && !r && open(X + 1, Y + 1)) { R(13, 13, 3, 1, C); R(13, 13, 1, 3, C); }
    } },
    hudrow: { solid: true, paint(R) { R(0, 0, 16, 16, '#000'); } }
  };

  /* ================= 章节 ================= */
  defChapter({
    id: 'polybius', n: 2,
    title: '波利比乌斯', sub: '没有厂牌的黑色街机。分数越高，画面里藏的东西越多', origin: '美国俄勒冈州　1981 年街机都市传说', color: '#0e3a26',
    thumb(g, w, h) {
      const x = w / 2 - 22, y = h - 22 - 84;
      g.fillStyle = '#020203'; g.fillRect(x, y, 44, 84); g.fillStyle = '#0d0d10'; g.fillRect(x + 3, y + 3, 38, 78);
      g.fillStyle = '#000'; g.fillRect(x + 7, y + 16, 30, 26);
      g.strokeStyle = '#59ff9e'; g.lineWidth = 1;
      for (let k = 0; k < 4; k++) { const r = 12 - k * 3, a = k * .5; g.beginPath(); for (let i = 0; i <= 4; i++) { const an = a + i * Math.PI / 2; const px = x + 22 + Math.cos(an) * r, py = y + 29 + Math.sin(an) * r; i ? g.lineTo(px, py) : g.moveTo(px, py); } g.stroke(); }
      g.fillStyle = '#111114'; g.fillRect(x + 3, y + 44, 38, 10);
      g.fillStyle = '#3a8a5a'; g.font = 'bold 7px monospace'; g.textAlign = 'center'; g.fillText('POLYBIUS', x + 22, y + 11);
      const gr = g.createRadialGradient(x + 22, y + 29, 2, x + 22, y + 29, 46); gr.addColorStop(0, 'rgba(90,255,160,.25)'); gr.addColorStop(1, 'rgba(90,255,160,0)'); g.fillStyle = gr; g.fillRect(0, 0, w, h);
    },
    amb: 'room', floor: 'wood', wall: 'plain', dark: .6, plr: 3.2,
    people: {
      me: { skin: '#f0c8a0', hair: '#6a4a2a', hs: 'messy', top: '#a8322a', top2: '#e8e0d0', bottom: '#3a4a6a', shoes: '#e8e8e8' },
      ricky: { key: 'pb-ricky', skin: '#e9d6c8', hair: '#d0a860', hs: 'messy', top: '#3a6a5a', top2: '#e8e0c8', bottom: '#4a4a5a', shoes: '#c8c8c8',
        extra(g, d, fr, G, R) { if (d === 0) { R(6, G.hT + 6, 1, 1, '#9a7080'); R(9, G.hT + 6, 1, 1, '#9a7080'); } R(4, G.tT + 2, 8, 1, '#e8e0c8'); R(4, G.tT + 4, 8, 1, '#e8e0c8'); } },
      earl: { key: 'pb-earl', skin: '#e0b890', hair: '#9a9a9a', hs: 'bald', top: '#5a4632', top2: '#d8d0c0', bottom: '#3a3a3a', shoes: '#2a1a10' },
      mib: { key: 'pb-mib', skin: '#d8d0c8', hair: '#121212', hs: 'short', top: '#121216', top2: '#f0f0f0', bottom: '#121216', shoes: '#050505', coat: true,
        extra(g, d, fr, G, R) { if (d === 0) { R(5, G.hT + 4, 6, 2, '#050507'); R(6, G.hT + 4, 1, 1, '#3a4a5a'); R(7, G.tT, 2, 4, '#0a0a0a'); } if (d === 1) R(4, G.hT + 4, 3, 2, '#050507'); } },
      mibg: { key: 'pb-mibg', skin: '#c8c8c8', hair: '#0a0a0a', hs: 'short', top: '#0a0a0e', top2: '#d0d0d0', bottom: '#0a0a0e', coat: true, ghost: true,
        extra(g, d, fr, G, R) { if (d === 0) R(5, G.hT + 4, 6, 2, '#000'); } }
    },
    faces: {
      /* 黑衣人：惨白的脸，大墨镜里映着那圈绿线；墨镜慢慢滑下来，后面没有眼睛 */
      mib(R, a, t) {
        R(0, 0, 32, 32, '#06070a');
        R(4, 24, 24, 8, '#0c0c10'); R(12, 24, 8, 8, '#f0f0f0'); R(15, 25, 2, 7, '#050505');     // 西装、白衬衫、领带
        R(9, 3, 14, 4, '#101010'); R(8, 5, 16, 3, '#101010');                                   // 梳得服帖的黑发
        R(9, 7, 14, 15, '#d9d2ca'); R(10, 22, 12, 2, '#d9d2ca'); R(20, 8, 2, 14, '#b9b2aa');      // 一张没有表情的脸
        R(14, 17, 4, 1, '#a8a098');                                                              // 鼻底
        R(12, 20, 8, 1, '#5a4a48');                                                              // 一条直线的嘴
        const dy = Math.round(Math.max(0, a - .45) * 9);
        if (dy > 0) { R(10, 11, 5, 3, '#ffffff'); R(17, 11, 5, 3, '#ffffff'); }                   // 墨镜后面：只有眼白
        R(9, 10 + dy, 6, 5, '#020203'); R(17, 10 + dy, 6, 5, '#020203'); R(15, 11 + dy, 2, 1, '#020203');
        const rr = 2 + ((t * 3) % 1) * 1.5;
        for (const ox of [12, 20]) { POLY(R, ox, 12.5 + dy, rr, 4, t * 2, '#3aff8a'); }
        R(7, 10, 2, 5, '#cfc8c0'); R(23, 10, 2, 5, '#b9b2aa');
        if (Math.sin(t * 13) > .85) R(0, (t * 40 | 0) % 32, 32, 1, 'rgba(255,255,255,.2)');
      },
      /* 屏幕里的脸：用矢量线画出来的轮廓，眼睛是两口往里转的井，嘴越张越大 */
      poly(R, a, t) {
        R(0, 0, 32, 32, '#000');
        const c = '#59ff9e', c2 = '#1a7a48';
        LN(R, 8, 4, 24, 4, c); LN(R, 8, 4, 4, 12, c); LN(R, 24, 4, 28, 12, c); LN(R, 4, 12, 6, 22, c); LN(R, 28, 12, 26, 22, c);
        LN(R, 6, 22, 12, 29, c); LN(R, 26, 22, 20, 29, c); LN(R, 12, 29, 20, 29, c);
        SPIRAL(R, 11, 13, 4 + a * 1.5, t * 2, '#ffffff', 3); SPIRAL(R, 21, 13, 4 + a * 1.5, t * 2 + .3, '#ffffff', 3);
        LN(R, 16, 15, 14, 19, c2); LN(R, 14, 19, 17, 19, c2);
        const h = 1 + Math.round(a * 6);
        for (let x = 10; x < 22; x += 2) { LN(R, x, 23, x + 1, 23 + h, c); LN(R, x + 1, 23 + h, x + 2, 23, c); }
        for (let i = 0; i < 3; i++) { const y = (hash(i, (t * 20) | 0, 3) * 32) | 0; R(0, y, 32, 1, 'rgba(90,255,160,.25)'); }
      }
    },
    endings: { unplug: '拔掉电源', tape: '样本 11', record: '新纪录', mib: '两点整' },
    items: {
      hand1: { name: '手背上的数字', desc: '用圆珠笔写在左手手背上：\n31　__　__　__　__' },
      hand2: { name: '手背上的数字', desc: '用圆珠笔写在左手手背上：\n31　15　__　__　__' },
      hand3: { name: '手背上的数字', desc: '用圆珠笔写在左手手背上，被汗洇得有点模糊：\n31　15　44　__　__' },
      hand4: { name: '手背上的数字', desc: '用圆珠笔写在左手手背上，被汗洇得有点模糊：\n31　15　44　23　__' },
      hand5: { name: '手背上的数字', desc: '五个，全了：\n31　15　44　23　15\n（背板是五排五列。）' }
    },
    notes: {
      n1: { title: '瑞奇的练习本', text: '（前半本是代数作业。后半本，字越写越乱。）\n\n第3晚　打到四千分。回家睡不着，闭眼全是绿线。\n第5晚　分数越高，画面越会「眨」一下。就一帧。好像是数字，两个两个的。\n第6晚　看清了一个：31。写在手背上，洗澡洗掉了。\n第8晚　黑西装的人站在我后面看我玩。一句话都不说。\n第9晚　纪录是 9990，名字那一栏是空的。厄尔说以前有人破过纪录，后来再也没来过。\n第？晚　别过一万。别过一万。别过一万。\n\n（最后一页只有一个名字，划掉又写上，写了一整页：凯尔。凯尔。凯尔。）' },
      n2: { title: '设备寄放协议（复写纸）', text: '甲方：（空白）\n乙方：星港游戏厅　经营者　厄尔\n\n一、甲方在乙方店内寄放街机一台，型号「POLYBIUS」。乙方不得移动、拆卸、断电。\n二、投币收入全归乙方。甲方另每月付乙方现金四百美元。\n三、甲方人员每晚 02:00 到店维护。乙方须开门，不得旁观，不得询问。\n四、本机不设厂牌。\n\n（甲方签名处没有名字，只盖着一个圆章：一圈一圈往里转的方框。）\n（页脚有一行厄尔的圆珠笔字：「四百块。别问。」）' },
      n3: { title: '图书馆的书：《古希腊的史家》', text: '（市立图书馆藏。已逾期十一天。）\n\n「……波利比乌斯（约公元前 200—前 118 年），希腊史家。他在《历史》里记载过一种用火把传信的办法：\n把字母排进一张五行五列的格子。传信的人先举起几支火把，表示第几行；再举起几支，表示这一行的第几个。\n两个数字，就是一个字母。」\n\n（书页边上，有人用铅笔描了一张 5×5 的格子，旁边写着：「先行后列。I 和 J 挤一格。」）\n（夹着一张借书条，背面是瑞奇的字：「它为什么叫这个名字？」）' },
      n4: { title: '被雨泡皱的卡片', text: '（打字机打的，抬头只有一个圆章：一圈一圈往里转的方框。）\n\n站点 7　波特兰／星港\n样本 09　T.—　第 12 晚　失眠　夜惊　→ 停止游玩\n样本 10　（空白）　打破纪录　→ 回收\n样本 11　R.—　第 9 晚　8,750 分　失眠　记忆缺失（开始）\n\n备注：服务码不变。\n　　　勿令样本破纪录（数据溢出）。\n　　　如遇断电——中止，撤收，不留痕迹。' }
    },
    legend: '「波利比乌斯」（Polybius）是街机时代最有名的都市传说之一。故事说：1981 年，美国俄勒冈州波特兰郊外的几家游戏厅里出现了一台没有厂牌的街机。它的画面是抽象的矢量图形，玩起来让人上瘾；玩过的人开始失眠、做噩梦、失忆，有的人从此再也不碰电子游戏。每到夜里，会有穿黑西装的人来打开机器「收集数据」。几周后，机器消失了，像从来没存在过。有人说那是政府的心理实验，画面里夹着「服从」「别睡」之类的潜意识讯息——这些细节在不同的版本里各不相同。\n\n这个传说可以追溯到的最早出处，是 2000 年前后一个街机资料网站上的一条条目：只有名字、年份，以及一个据说是德语、意思近似「感官删除」的厂商名「Sinneslöschen」。从那以后，各种「我小时候玩过」的回忆层出不穷，但从来没有人拿出过机柜、电路板、照片或任何当年的记录。目前看来，它查无实据。\n\n有人翻出了 1981 年波特兰当地的旧报道，认为传说也许是从这里长出来的：据报道，那一年有少年为了刷纪录在游戏厅里连续玩到病倒，也有年轻人玩街机时头痛发作被送医；同一年，联邦调查人员确实到过当地的游戏厅，调查的是街机被用来非法赌博——「穿西装的人」或许由此而来。那也正是社会上担心「电子游戏会毁掉一代人」的年代。\n\n「波利比乌斯」这个名字，属于古希腊史家波利比乌斯（约公元前 200—前 118 年）。他记载过一种把字母排进五行五列格子、用两个数字表示一个字母的火把传信法，后人称之为「波利比乌斯方阵」。传说流行起来以后，也有人用这个名字做出过真正的游戏。\n\n（本章的星港游戏厅、凯尔、瑞奇、厄尔及其家人，寄放协议与雨中的卡片，「样本」编号，画面里闪过的数字与背板上的方阵密码 LETHE（希腊神话里让人遗忘的河），破纪录会忘记自己名字的规则，以及磁带与各个结局，均为游戏虚构。）',
    start: { map: 'arcade', x: 6, y: 8, dir: 3 },
    resume: {
      cab: async S => {
        G = null; S.wear('@me'); S.norun(false); S.lights(null); applySym(S); setClock(S);
        if (LASTBAD === 'record' && S.once('hintRec')) await S.think('（……又回到了机器前面。\n看完第五个数字就往出口跑，一分都别多拿。金色的多边形也别碰。）');
        else if (LASTBAD === 'mib' && S.once('hintMib')) await S.think('（……又是这一局。时间不多了：这一局要把剩下的数字全部看完。）');
      },
      mib: async S => {
        G = null; S.wear('@me'); S.norun(false); applySym(S); setClock(S);
        mibSetup(S);
        if (DIED === 1) await S.think('（……又是车灯。\n背板在机器左边。先数第几排，再数第几个。他们进门以后，别让他们堵在身边。）');
        else if (DIED >= 2) await S.think('（31，第三排第一个：L。15：E。44：T。23：H。15：E。\n——L、E、T、H、E。快！）');
      }
    },
    async intro(S) {
      await S.card('第二夜　波利比乌斯', '1981年10月　美国俄勒冈州　波特兰郊外', '镇上的「星港」游戏厅，最近多了一台机器。\n没有厂牌，没有说明，机身漆成哑光的黑色。\n\n玩过它的孩子，开始睡不着觉。');
    },
    sprites: SPR2,
    tiles: TILESX,
    maps: {
      /* ---------------- 星港游戏厅 ---------------- */
      arcade: {
        amb: 'room', dark: .6, plr: 3.2, wall: 'plain', floor: 'arc', wallC: { face: '#2c2442', top: '#0d0b16', trim: '#16112a' },
        legend: { a: 'arc' },
        rows: [
          '####################',
          '####################',
          '#aaaaaaaaaaaaaaaaaa#',
          '#aaaaaaaaaaaaaaaaaa#',
          '#aaaaaaaaaaaaaaaaaa#',
          '#aaaaaaaaaaaaaaaaaa#',
          '#aaaaaaaaaaaaaaaaaa#',
          '#aaaaaaaaaaaaaaaaaa#',
          '#aaaaaaaaaaaaaaaaaa#',
          '#aCCCaaaaaaaaaaaaaa#',
          '#aaaaaaaaaaaaaaaaaa#',
          '#########a##########'],
        ents: [
          { id: 'odoor', x: 2, y: 1, spr: 'door', col: '#3a3048', on: async S => { if (S.f.phase === 'climax') return S.think('（没时间躲了！）'); if (S.f.phase === 'pro') return; S.sfx('open'); await S.go('office', 4, 6, 3); } },
          { id: 'clk', x: 5, y: 1, spr: 'clock2', s: { m: 178 }, on: S => S.narr('墙上的挂钟：' + clockStr(S.f.clock ?? 178) + '。' + ((S.f.frags || 0) >= 3 ? '\n秒针走一下，停一下。……停得越来越久。' : '\n秒针咔哒、咔哒地走。')) },
          { x: 7, y: 1, spr: 'hiboard', on: S => S.narr('手写的最高分排行榜：\n吃豆子的那台　87,420　J.B.\n陨石　　　　　41,950　DAN\n赛车　　　　　 2\'04"　厄尔\nPOLYBIUS　　　 9,990　———\n最后一行的名字那栏是空的。厄尔用红笔把它圈了起来。') },
          { x: 9, y: 1, spr: 'poster', col: '#c8c0a0', on: S => S.narr('一张杂志内页，用图钉钉在墙上：「电子游戏会毁掉一代人吗？」\n有人在标题旁边画了一个笑脸。') },
          { x: 13, y: 1, spr: 'poster', col: '#3a4a7a', on: S => S.narr('「本店营业至午夜 12 点。未满 16 岁请于 10 点前离店。」\n瑞奇十六岁。他已经在这儿待了一整天。') },
          { id: 'c1', x: 10, y: 2, spr: 'cab', col: '#2a4a9a', s: { k: 0 }, light: { r: 1.6, col: 'rgba(120,170,255,.16)', dy: 2 }, on: S => S.narr(S.ent('c1').s.poly ? '外星人一排一排地往下降……\n不对。屏幕里是一圈一圈往里转的绿线。你眨了眨眼，又恢复了。' : '一台太空射击。外星人一排一排地左右平移，永远在往下降。') },
          { id: 'c2', x: 11, y: 2, spr: 'cab', col: '#9a2a3a', s: { k: 1 }, light: { r: 1.6, col: 'rgba(255,120,140,.14)', dy: 2 }, on: S => S.narr('吃豆子的游戏。黄色的小嘴在迷宫里一张一合。\n去年它刚来的时候，门口排队排到了停车场。') },
          { id: 'c3', x: 12, y: 2, spr: 'cab', col: '#2a8a4a', s: { k: 2 }, light: { r: 1.6, col: 'rgba(120,255,160,.14)', dy: 2 }, on: S => S.narr('赛车游戏。塑料方向盘被磨得发亮。\n最高纪录是厄尔的——他说是他自己调的机器，不算作弊。') },
          { id: 'svc', x: 15, y: 2, spr: 'svc', on: panelUse },
          { id: 'poly', x: 16, y: 2, spr: 'polycab', light: { r: 2.4, col: 'rgba(80,255,150,.22)', dy: 2 }, on: polyUse },
          { x: 17, y: 2, spr: 'conduit', on: S => S.narr('机器背后伸出一根粗电源线，没有插头——\n它直接钻进一根拇指粗的铁管，铁管顺着墙角往下，钻进了地板。\n拔不掉。也不知道它通到哪儿去。') },
          { x: 18, y: 2, spr: 'trash', on: S => S.narr('垃圾桶里塞满了可乐罐和口香糖纸。\n最上面是一张揉成团的成绩单，数学那一栏写着 D。') },
          { id: 'i1', x: 4, y: 5, spr: 'cab', col: '#6a3a9a', s: { k: 3 }, light: { r: 1.5, col: 'rgba(200,140,255,.12)', dy: 2 }, on: S => S.narr('陨石。一艘三角形的小飞船在碎石中间打转。\n——和那台黑机器里的画面有点像。又完全不一样。') },
          { id: 'i2', x: 5, y: 5, spr: 'cab', col: '#9a6a2a', s: { k: 4 }, light: { r: 1.5, col: 'rgba(255,200,120,.12)', dy: 2 }, on: S => S.narr('打砖块。最后一块砖总是打不到。') },
          { id: 'i3', x: 6, y: 5, spr: 'cab', col: '#2a6a7a', s: { k: 0 }, light: { r: 1.5, col: 'rgba(120,220,255,.12)', dy: 2 }, on: S => S.narr(S.ent('i3').s.poly ? '屏幕里，外星人排成了一个方框，一圈一圈地往里缩。\n……你后退了一步。' : '又一台太空射击。第二个按钮是坏的，厄尔一直说要修。') },
          { id: 'i4', x: 7, y: 5, spr: 'cab', col: '#7a2a2a', s: { k: 5 }, on: S => S.narr('屏幕上贴着一张纸：「维修中」。\n纸的背面透出几个字：「别再往里投币了」。') },
          { id: 'i5', x: 8, y: 5, spr: 'cab', col: '#2a7a3a', s: { k: 1 }, light: { r: 1.5, col: 'rgba(140,255,160,.12)', dy: 2 }, on: S => S.narr('青蛙过马路。小青蛙被车撞扁的时候，会发出「噗」的一声。') },
          { id: 'i6', x: 9, y: 5, spr: 'cab', col: '#3a3a9a', s: { k: 2 }, light: { r: 1.5, col: 'rgba(160,160,255,.12)', dy: 2 }, on: S => S.narr(S.ent('i6').s.poly ? '赛道弯成了一个方框，一圈套一圈。\n车一直往里开，一直开不到头。' : '另一台赛车。座椅上的人造革裂了一道口子。') },
          { id: 'pb', x: 13, y: 5, h: 2, spr: 'pinball', on: S => S.narr('弹珠台。玻璃下面画着一个穿宇航服的女孩。\n一颗弹珠卡在右边的洞里，晃一晃，又不动了。') },
          { x: 1, y: 5, spr: 'changer', on: S => S.narr('兑币机。塞进一张一美元，哗啦啦吐出四枚二十五美分。\n厄尔总说，这台机器才是店里最赚钱的。') },
          { x: 3, y: 9, spr: 'invisible', on: S => S.narr('柜台的玻璃下面压着奖品：塑料戒指、橡皮恐龙、印着太空飞船的贴纸。\n收银机旁边插着一张便条：「两点。给他们开门。别问。——E」') },
          { x: 15, y: 9, w: 2, spr: 'bench', on: S => S.narr('长椅的人造革上，有一个坐得陷下去的印子。') },
          { id: 'ricky', x: 17, y: 9, spr: '@ricky', hidden: true, on: rickyUse },
          { id: 'bag', x: 18, y: 9, spr: 'bag', solid: false, hidden: true, on: bagUse },
          { id: 'earl', x: 3, y: 10, spr: '@earl', hidden: true },
          { id: 'zz', x: 17, y: 9, spr: 'zzz', solid: false, z: 1, hidden: true },
          { id: 'vg0', x: 0, y: 0, w: 5, h: 12, spr: 'vgrid', solid: false, z: 1, hidden: true },
          { id: 'vg1', x: 5, y: 0, w: 5, h: 12, spr: 'vgrid', solid: false, z: 1, hidden: true },
          { id: 'vg2', x: 10, y: 0, w: 5, h: 12, spr: 'vgrid', solid: false, z: 1, hidden: true },
          { id: 'vg3', x: 15, y: 0, w: 5, h: 12, spr: 'vgrid', solid: false, z: 1, hidden: true },
          { id: 'i7', x: 7, y: 8, spr: 'cab', col: '#8a2a6a', s: { k: 4 }, light: { r: 1.5, col: 'rgba(255,140,220,.12)', dy: 2 }, on: S => S.narr(S.ent('i7').s.poly ? '砖块排成了一个方框。球打进去，就再也没出来。' : '又一台打砖块。挡板左边缺了一个像素，是被人用指甲抠掉的。') },
          { id: 'i8', x: 8, y: 8, spr: 'cab', col: '#2a5a8a', s: { k: 3 }, light: { r: 1.5, col: 'rgba(140,200,255,.12)', dy: 2 }, on: S => S.narr('潜艇大战。投币口里卡着一枚加拿大硬币。') },
          { id: 'i9', x: 9, y: 8, spr: 'cab', col: '#5a7a2a', s: { k: 0 }, light: { r: 1.5, col: 'rgba(200,255,140,.12)', dy: 2 }, on: S => S.narr(S.ent('i9').s.poly ? '外星人不往下降了。它们排成一圈，绕着屏幕中间转。' : '「蜈蚣」。一条一节一节的虫子，从屏幕顶上蜿蜒着爬下来。') },
          { id: 'i10', x: 10, y: 8, spr: 'cab', col: '#9a4a2a', s: { k: 2 }, light: { r: 1.5, col: 'rgba(255,170,120,.12)', dy: 2 }, on: S => S.narr('坦克大战。两个摇杆，一个人玩不过来。\n你和瑞奇以前一人一个。') },
          { x: 18, y: 10, spr: 'vending', on: S => S.narr('可乐贩卖机。冷藏的嗡嗡声，和那台黑机器的声音一点都不像。\n——你发现自己在拿它们做比较。') },
          { x: 1, y: 10, spr: 'plant', on: S => S.narr('一盆塑料棕榈树。叶子上落满了灰，还插着一根吸管。') },
          { x: 2, y: 9, spr: 'register', solid: false, z: 1, oy: -6 },
          { id: 'hall', x: 18, y: 6, spr: '@mibg', solid: false, hidden: true, dir: 1 },
          { id: 'mib1', x: 9, y: 11, spr: '@mib', solid: false, hidden: true, dir: 3 },
          { id: 'mib2', x: 8, y: 10, spr: '@mib', solid: false, hidden: true, dir: 3 },
          { id: 'gdoor', x: 9, y: 11, spr: 'gdoor', decal: true, solid: false, touch: async S => {
            const f = S.f;
            if (f.phase === 'climax' || f.phase === 'late') { await S.think('（车就停在门口。出去就是撞上他们！）'); return S.walk('pl', 'u', 6); }
            if (f.phase === 'done') return;
            await S.go('lot', 7, 2, 0);
          } },
          { x: 6, y: 3, spr: 'invisible', light: { r: 4, col: 'rgba(120,90,200,.05)', a: .3 } }
        ],
        async enter(S, first) {
          const f = S.f;
          if (first && !f.phase) return prologue(S);
          if (f.phase === 'night') { applySym(S); setClock(S); }
        },
        step(S, x, y) {
          const h = getEnt('hall', 'arcade');
          if (h && !h.hidden && S.f.phase === 'night' && Math.abs(x - 18) + Math.abs(y - 6) <= 2) {
            return (async () => { S.sfx('whisper'); await S.alpha('hall', 0, 500); await S.think('（……刚才那儿站着一个穿黑西装的人。\n现在什么都没有。）'); })();
          }
        },
        tick(S, dt) {
          const f = S.f;
          if (f.phase === 'climax') {
            const tl = S.timerLeft;
            if (tl != null && tl < 12) { f._hb = (f._hb ?? 0) - dt; if (f._hb <= 0) { f._hb = tl < 5 ? .45 : .85; S.sfx('heart'); } }
            /* 他们走到身边时，正在按的键盘、正在看的字都会被打断 */
            if ((W.keypad || W.dlg) && mibNear(18)) interruptWait();
            proxHum(S, dt);
            return;
          }
          if (f.phase === 'night') proxHum(S, dt);
          if (S.busy || f.phase !== 'night') return;
          f._bl = (f._bl ?? 3) - dt;
          if (f._bl <= 0) { f._bl = 2.5 + Math.random() * 4; const n = [392, 523, 587, 659, 784, 880]; bleep(S, n[(Math.random() * n.length) | 0], .05, .025); }
          if ((f.frags || 0) >= 2) { f._am = (f._am ?? 25) - dt; if (f._am <= 0) { f._am = 22 + Math.random() * 18; S.fx('glitch'); hum(S, .06); if (f.frags >= 4) S.sfx('whisper'); } }
        }
      },
      /* ---------------- 后屋：厄尔的办公室 ---------------- */
      office: {
        amb: 'room', dark: .7, plr: 3, wall: 'wood', floor: 'wood', tileOpts: { woodC: '#4a3628' },
        rows: [
          '##########',
          '##########',
          '#wwwwwwww#',
          '#wwwwwwww#',
          '#wwwwwwww#',
          '#wwwwwwww#',
          '#wwwwwwww#',
          '####w#####'],
        ents: [
          { x: 3, y: 1, spr: 'cal', on: S => S.narr('1981 年 10 月的日历。每一格都用红笔写着同一个小小的「2:00」。\n今天，23 号，星期五。') },
          { x: 6, y: 1, spr: 'breaker', on: S => S.narr(['电闸箱。上面挂着一把崭新的黄铜挂锁——不是厄尔的。锁眼里塞着蜡。', '你扳了扳旁边那个没上锁的厨房电闸：后屋的灯灭了，又亮了。\n外面那台黑色的机器，连闪都没闪一下。']) },
          { x: 8, y: 2, spr: 'locker', on: S => S.narr('员工柜。你的那一格里只有一件备用 T 恤，和半包口香糖。') },
          { id: 'desk', x: 2, y: 3, spr: 'desk', on: async S => { await S.narr('厄尔的办公桌。账本、烟灰缸、一沓没拆的电费单。\n最上面压着一张复写纸。'); await S.note('n2'); if (S.once('readN2')) await S.think('（「不得断电」……四百块一个月。\n厄尔不是不知道它有问题。他是不想知道。）'); } },
          { id: 'phone', x: 3, y: 3, spr: 'phone', on: phoneUse },
          { x: 1, y: 3, spr: 'lamp', light: { r: 3, col: 'rgba(255,200,120,.16)' }, on: S => S.narr('台灯。灯罩上烫了一个焦黄的洞。') },
          { x: 8, y: 4, h: 2, spr: 'bed', col: '#5a5a42', on: S => S.narr('厄尔的行军床。枕头上有一个凹下去的印子。\n他说他只是偶尔在这儿眯一会儿。') },
          { x: 1, y: 6, spr: 'box', on: S => { S.f.sawPhoto = true; return S.narr('失物招领箱：一只手套，一副耳机，一顶棒球帽，十几枚游戏币。\n最底下有一张照片：瑞奇和你，在弹珠台前面比着胜利的手势。是夏天拍的。'); } },
          { x: 4, y: 7, spr: 'invisible', to: ['arcade', 2, 2, 0] }
        ],
        async enter(S, first) { if (first) await S.narr('后屋。烟味和旧纸板的味道。\n厄尔不在的时候，这里安静得能听见冰箱的压缩机。'); }
      },
      /* ---------------- 停车场 ---------------- */
      lot: {
        amb: 'rain', dark: .72, plr: 3, wall: 'brick', floor: 'asphalt', rain: true,
        rows: [
          '################',
          '################',
          '________________',
          '________________',
          '::::::::::::::::',
          '::::::::::::::::',
          '::::::::::::::::',
          '::::::::::::::::',
          '================',
          '::::::::::::::::'],
        ents: [
          { x: 3, y: 1, w: 2, spr: 'neon', light: { r: 3, col: 'rgba(255,90,180,.18)', dx: 16, dy: 8 }, on: S => S.narr('霓虹灯招牌：STAR PORT。\n「P」那个字母坏了，一闪，一闪。') },
          { x: 1, y: 1, spr: 'awin', on: S => S.narr('透过玻璃，能看见店里一排排机器的屏幕在黑暗里发光。') },
          { id: 'adoor', x: 7, y: 1, spr: 'glassdoor', sfx: 'open', to: ['arcade', 9, 10, 3] },
          { x: 10, y: 1, spr: 'awin', s: { green: true }, on: S => S.narr('最里面那一块屏幕，是绿色的。\n隔着雨和玻璃，你好像看见那些线在转。') },
          { x: 12, y: 1, spr: 'awin', on: S => S.narr('玻璃上贴着一张褪色的海报：「周五夜　双倍游戏币」。') },
          { x: 14, y: 2, spr: 'payphone', on: async S => { await S.narr('公用电话。你投进一枚硬币，拿起听筒。'); if ((S.f.frags || 0) >= 2) { digitBeeps(S, '4423'); await S.narr('没有拨号音。\n只有很远很远的「嘀、嘀嘀」——像一台街机，在电话线的另一头开着。'); } else await S.narr('嘟——\n你想了想，不知道该打给谁，又把听筒挂了回去。硬币没有退出来。'); } },
          { x: 2, y: 4, spr: 'streetlamp', light: { r: 3.6, col: 'rgba(255,220,150,.18)', dy: -10 }, on: S => S.narr('路灯底下的雨丝又细又密。\n十月的波特兰，雨能连着下一个礼拜。') },
          { x: 10, y: 3, spr: 'bike', on: S => S.narr('瑞奇的自行车。锁都没锁。\n车筐里积了半筐雨水。') },
          { x: 15, y: 5, spr: 'dumpster', on: S => S.narr('垃圾箱。盖子半开，里面是一摞被雨泡烂的游戏杂志。') },
          { x: 5, y: 6, w: 2, spr: 'oil', decal: true, solid: false, on: S => S.narr('一摊油渍，方方正正。\n像是有一辆车，每天夜里都停在同一个地方。') },
          { id: 'card', x: 8, y: 6, spr: 'card', solid: false, on: async S => { await S.narr('油渍旁边的水洼里，泡着一张白色的小卡片。'); await S.note('n4'); if (S.once('readN4')) await S.think('（样本十一，R……瑞奇。\n「如遇断电——中止，撤收」。……只要让它停下来，他们就会走。）'); } },
          { id: 'mibcar', x: 5, y: 6, w: 2, spr: 'car', col: '#0c0c10', hidden: true, light: { r: 3, col: 'rgba(255,240,200,.14)', dx: 32, dy: 8 } }
        ],
        async enter(S, first) { if (first) await S.narr('雨下得不大，但没完没了。\n停车场空荡荡的，只有瑞奇的自行车，和路面上一摊方方正正的油渍。'); }
      },
      /* ---------------- 屏幕里 ---------------- */
      game: {
        amb: 'drone', dark: 0, floor: 'vfloor', shimmer: false,
        legend: { X: 'vwall', H: 'hudrow' },
        rows: GAME_ROWS,
        ents: [
          { id: 'exitp', x: 10, y: 10, spr: 'exitpad', solid: false, decal: true, touch: exitTouch },
          { id: 'd1', x: 2, y: 3, spr: 'dot', solid: false, touch: collectDot },
          { id: 'd2', x: 9, y: 3, spr: 'dot', solid: false, touch: collectDot },
          { id: 'd3', x: 5, y: 9, spr: 'dot', solid: false, touch: collectDot },
          { id: 'e1', x: 1, y: 2, spr: 'vshape', solid: false, k: 3 },
          { id: 'e2', x: 10, y: 2, spr: 'vshape', solid: false, k: 4 },
          { id: 'e3', x: 1, y: 10, spr: 'vshape', solid: false, k: 6, hidden: true },
          { id: 'hud', x: 0, y: 0, w: 12, h: 12, spr: 'hud', solid: false, z: 1, s: { sc: 0, li: 3, ph: 'ready', fl: 0, flN: 0, wd: 0, wdN: 0, wdY: 0 } }
        ],
        tick(S, dt) {
          if (!G || S.busy) return;
          if (G.ph === 'spin') {
            G.score += G.rate * dt; hudSet(S, { sc: Math.floor(G.score) });
            G.tk -= dt; if (G.tk <= 0) { G.tk = .22; bleep(S, 500 + Math.min(1, (G.score - 7000) / 3000) * 900, .04, .05); }
            if (G.score > HI) { G.ph = 'rec0'; S.run(recordEnd); return; }
          }
          if (G.ph === 'play' || G.ph === 'spin') {
            G.wt -= dt;
            if (G.wt <= 0) { G.wt = 3.5 + Math.random() * 5; const h = S.ent('hud'); hudSet(S, { wd: (Math.random() * WORDS.length) | 0, wdN: (h.s.wdN || 0) + 1, wdY: (Math.random() * 120) | 0 }); S.tone('sine', 40, 40, .12, .1); }
          }
        }
      }
    }
  });

  /* ---------------- 开场：十天前的凌晨，和今晚 ---------------- */
  async function prologue(S) {
    const f = S.f;
    f.phase = 'pro'; f.clock = 178; f.frags = 0; f.sess = 0;
    S.dark(.66, 'arcade');
    await S.card('十天前', '1981年10月13日　星期二　凌晨一点五十八分', '');
    await S.narr('游戏厅早就打烊了。只有最里面那台黑色的机器还亮着——它从来不关。\n厄尔交代过：两点会有人来。让他们进来，别多问。');
    S.sfx('knock'); await S.wait(380); S.sfx('knock'); await S.wait(380); S.sfx('knock');
    await S.wait(500);
    S.place('mib1', 9, 11, 3);
    S.tone('triangle', 2637, 2637, .5, .1); S.sfx('open');
    await S.narr('玻璃门外站着两个人。黑西装，黑领带，夜里还戴着墨镜。\n你还没走到门口，门就自己开了。');
    const a = S.walk('mib1', [14, 2], 3);
    await S.wait(500); S.place('mib2', 9, 11, 3);
    await S.walk('mib2', [16, 3], 3); await a;
    S.face('mib1', 2); S.face('mib2', 3); S.face('pl', 'mib1');
    panelBeeps(S, 5); await S.wait(1400);
    await S.narr('前面那个人蹲下来，在机器左侧的铁皮背板上按了五下。\n嘀、嘀、嘀、嘀、嘀。……第一下，按在第三排最左边。');
    S.ent('svc').open = true; S.sfx('open');
    await S.narr('背板弹开了。他取出一盘磁带，换进一盘新的。\n另一个人对着屏幕上的分数，在夹板上写字。');
    S.ent('svc').open = false; S.sfx('close');
    S.face('mib2', 'pl'); await S.wait(300);
    await S.scare('face', { face: 'mib', sfx: 'sting', dur: .8 });
    await S.say('黑西装', '你玩过它吗？');
    const r = await S.ask('墨镜后面，看不见他的眼睛。', ['「没、没有。」', '「……玩过一次。」']);
    await S.say('黑西装', (r === 0 ? '很好。' : '……那就别再玩了。') + '\n别让任何人破它的纪录。');
    const b = S.walk('mib1', [9, 11], 3.2); await S.wait(300); await S.walk('mib2', [9, 10], 3.2); await b;
    S.hide('mib1'); S.hide('mib2'); S.sfx('close');
    await S.narr('门关上了。外面传来汽车发动的声音。\n雨地里，好像有一张白色的小卡片，从他们身上掉了下来。');
    /* ---- 十天后 ---- */
    await S.fade(1, 500);
    await S.card('十天后', '1981年10月23日　星期五　夜里十一点半', '瑞奇已经连着玩了十天。\n他开始睡不着觉，开始忘事。\n\n今天，他没认出你。');
    f.phase = 'night'; f.clock = 30; setClock(S);
    S.dark(null, 'arcade');
    S.place('earl', 3, 10, 3); S.place('ricky', 16, 3, 3); S.pos(6, 8, 3);
    await S.fade(0, 500);
    S.face('earl', 'pl');
    await S.say('厄尔', '我走了。两点那伙人来，开门就行，别的不用管。\n……还有，劝那小子回家。他在那台机器前面坐了一整天了。');
    await S.walk('earl', [9, 11], 3.5); S.hide('earl'); S.sfx('close');
    await S.walk('pl', [16, 4], 4);
    S.face('pl', 3); S.face('ricky', 0);
    await S.narr('瑞奇转过头。他的脸被屏幕照得发绿，眼睛下面是两块青黑色的印子。');
    await S.say('瑞奇', '……你是新来的？');
    await S.say('凯尔', '瑞奇。是我，凯尔。');
    await S.say('瑞奇', ['凯尔……对。我睡不着，凯尔。一闭眼就是那些线，绿的，一直转。', '它在画面里眨眼，两个数字、两个数字地眨……\n别过一万。纪录那一栏，没有名字。']);
    await S.walk('ricky', [17, 8], 2.4); await S.walk('ricky', [17, 9], 2.4); S.face('ricky', 1);
    S.show('bag');
    await S.think('（瑞奇说的黑西装，就是那天夜里那两个人。两点他们就会来。\n——在那之前，我要把这台机器关掉。）');
    goalNight(S);
  }

  /* 测试钩子（仅 ?debug=1） */
  if (typeof QS !== 'undefined' && QS.get('debug') === '1') window.__pb = { get G() { return G; }, get DIED() { return DIED; }, set DIED(v) { DIED = v; } };
})();
