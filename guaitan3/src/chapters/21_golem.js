/* ================= 第二十一夜 · 布拉格的魔像 ================= */
(() => {
  /* 主题：字母。泥人额上写着 אמת（emet，真理），抹去头一个字母 aleph 就成了 מת（met，死）。
     希伯来文从右往左读——「头一个字母」在最右边。
     双人：一人按 J 翻字母板念数、一人拨锁；climax 一人盯拉比的呼唤、一人在梯子上伸手。 */

  /* ---------- 地图生成小工具 ---------- */
  const G = (w, h, c) => Array.from({ length: h }, () => Array(w).fill(c));
  const F = (g, x0, y0, x1, y1, c) => { for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) g[y][x] = c; };
  const ROWS = g => g.map(r => r.join(''));
  /* 犹太城街巷 42×19：西头拉比家(3,5) → 墓园墙外的直巷(y=6) / 院子底下弯弯绕绕的小巷 → 东头会堂前的广场 */
  const ALLEY = [[7, 9], [7, 11], [10, 11], [10, 14], [13, 14], [13, 11], [16, 11], [16, 14], [19, 14], [19, 10], [22, 10], [22, 13], [26, 13]];
  function lanesRows() {
    const g = G(42, 19, '#');
    F(g, 13, 2, 24, 4, '"'); F(g, 13, 5, 24, 5, 'Y'); g[3][18] = 'T'; g[2][23] = 'T';   // 墓园里的接骨木
    F(g, 2, 6, 28, 6, 'k'); F(g, 2, 6, 7, 9, 'k'); F(g, 27, 6, 28, 9, 'k'); F(g, 27, 10, 40, 16, 'k');
    for (let i = 0; i < ALLEY.length - 1; i++) { const [x0, y0] = ALLEY[i], [x1, y1] = ALLEY[i + 1]; F(g, Math.min(x0, x1), Math.min(y0, y1), Math.max(x0, x1), Math.max(y0, y1), ','); }
    F(g, 19, 8, 19, 9, ',');    // 莉芙卡家门口的死胡同
    F(g, 10, 15, 10, 16, ',');  // 堆木桶的死胡同
    return ROWS(g);
  }
  const HOUSE = [
    '######################',
    '######################',
    '#WWWWWW#wwwwww#kkkkkk#',
    '#WWWWWW#wwwwww#kkkkkk#',
    '#WWWWWW#wwwwww#kkkkkk#',
    '#WWWWWW#wwwwww#kkkkkk#',
    '#WWWWWWWwwwwwwwkkkkkk#',
    '#WWWWWW#wwwwww#kkkkkk#',
    '#WWWWWW#wwwwww#kkkkkk#',
    '#WWWWWW#wwwwww#kkkkkk#',
    '##########w###########',
    '######################'];
  const SHUL = [
    '####################',
    '####################',
    '#kkkkkkkkkkkkkkkkkk#',
    '#kkkkkkkkkkkkkkkkkk#',
    '#kkkkkkkkkkkkkkkkkk#',
    '#kkkkkkkkkkkkkkkkkk#',
    '#kkkkkkkkkkkkkkkkkk#',
    '#kkkkkkkkkkkkkkkkkk#',
    '#kkkkkkkkkkkkkkkkkk#',
    '#kkkkkkkkkkkkkkkkkk#',
    '#kkkkkkkkkkkkkkkkkk#',
    '#########kk#########',
    '#########kk#########',
    '####################'];
  const ATTIC = [
    '################',
    '################',
    '#WWWWWWWWWWWWWW#',
    '#WWWWWWWWWWWWWW#',
    '#WWWWWWWWWWWWWW#',
    '#WWWWWWWWWWWWWW#',
    '#WWWWWWWWWWWWWW#',
    '################'];
  /* 厨房漫水：从水缸前一圈一圈往外淌，最后漫过门槛 */
  const FLOOD = (() => {
    const cells = [];
    for (let y = 3; y <= 9; y++) for (let x = 15; x <= 20; x++) cells.push([x, y]);
    cells.push([14, 6], [13, 6], [12, 6], [13, 5], [13, 7]);
    const R = [];
    for (const [x, y] of cells) { const d = Math.abs(x - 17) + Math.abs(y - 3); (R[d] = R[d] || []).push([x, y]); }
    return R.filter(Boolean);
  })();

  /* ---------- 常量与小工具 ---------- */
  const RX = 37, RY = 10;                       // 铁梯磴底下那一格
  const CH = { v0: 4.6, inc: 1.2, max: 10.5 };  // 巷子里的追逐：起步慢、拐弯慢、直路上越跑越快
  const CL = { v0: 2.8, inc: .6, max: 5.2 };    // 广场上
  const SPAWN_WAIT = .6;
  const DIG = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'];
  const DIED = { chase: 0, rungs: 0, em: 0, et: 0, last: '' };   // 本次游玩里死过几回（检查点会回滚 S.f，这里不会）
  let RC = { t: 9, fz: 0, n: 0, adj: 0, was: false, told: false };   // 拉比呼唤的节奏（只在主机上跑）
  const near = (a, b) => Math.hypot(a.px - b.px, a.py - b.py) < 14;     // 一格以内算追上
  const cell = e => [Math.round(e.px / TS), Math.round(e.py / TS)];

  /* ---------- 字母 ---------- */
  const GL5 = {   // 5×5，脸和缩略图用
    a: ['X...X', '.X..X', '..X..', 'X..X.', 'X...X'],   // א aleph
    m: ['XXXX.', '.X..X', '.X..X', 'X...X', 'XX.XX'],   // מ mem
    t: ['XXXXX', '.X..X', '.X..X', '.X..X', 'XX..X']    // ת tav
  };
  const GL3 = { a: ['X.X', '.X.', 'XX.', 'X.X'], m: ['XX.', '.XX', 'X.X', 'XXX'], t: ['XXX', '.XX', '.XX', 'X.X'] };
  function glyph(R, set, k, x, y, s, col) { set[k].forEach((row, j) => { for (let i = 0; i < row.length; i++) if (row[i] === 'X') R(x + i * s, y + j * s, s, s, col); }); }
  /* 额上的字：希伯来文从右往左，所以画面上从左到右是 ת מ א */
  const SLOTS = ['t', 'm', 'a'];

  /* ---------- 合成声音 ---------- */
  function golemStep(S, v) { S.tone('sine', 64, 38, .2, v, 0, 260); S.tone('triangle', 120, 60, .06, v * .4, 0, 600); }
  function pound(S) { S.tone('sine', 52, 30, .45, .24, 0, 240); S.tone('square', 700, 160, .06, .05, 0, 2400); S.tone('triangle', 90, 40, .3, .12, .02, 400); }
  function shutterKnock(S, v, d = 0) { for (let i = 0; i < 3; i++) { S.tone('triangle', 540, 300, .05, v, d + i * .22, 1800); S.tone('sine', 180, 120, .06, v * .6, d + i * .22, 600); } }
  function chant(S, v = .045) {   // 会众低声的念诵：慢、低、几个声部叠在一起
    const N = [[294, .7], [349, .7], [330, .5], [294, .9], [262, .6], [294, 1.2]]; let d = 0;
    for (const [f, l] of N) { S.tone('triangle', f, f, l * .95, v, d, 900); S.tone('sine', f / 2, f / 2, l, v * .7, d, 600); S.tone('triangle', f * .749, f * .749, l * .9, v * .35, d + .05, 700); d += l; }
  }
  function rabbiCall(S, n) { const v = Math.max(.04, .1 - n * .014); S.tone('sawtooth', 196, 175, .3, v, 0, 1000); S.tone('sawtooth', 220, 160, .5, v, .34, 900); S.tone('sine', 98, 86, .8, v * .6, 0, 500); }
  function crumbleSnd(S) { for (let i = 0; i < 7; i++) S.tone('square', 220 - i * 20, 60, .08, .05, i * .09, 700); S.tone('sine', 80, 30, 1.2, .14, 0, 300); }
  function smear(S) { S.tone('triangle', 260, 140, .25, .07, 0, 1200); }
  function pourSnd(S) { S.tone('sine', 700, 340, .35, .025, 0, 1500); S.tone('sine', 520, 300, .3, .02, .3, 1400); }
  function clink(S) { S.tone('square', 1200, 900, .04, .04, 0, 3000); S.tone('square', 1100, 850, .04, .03, .18, 3000); }

  /* ---------- 泥人 ---------- */
  const CL_ = { b: '#8a6a4a', d: '#6a4e34', l: '#a8865e', k: '#3a2618' };
  function letters3(RR, x, y, gone) {
    SLOTS.forEach((k, i) => { const lx = x + i * 4; if (k === gone) { RR(lx, y + 1, 3, 2, CL_.l); return; } glyph(RR, GL3, k, lx, y, 1, CL_.k); });
  }
  function golemSpr(g, e, t, R) {
    const C = CL_, cr = e.crumble || 0;
    if (cr >= 1) { R(-5, 9, 26, 7, C.d); R(-3, 7, 22, 5, C.b); R(1, 5, 12, 4, C.b); R(3, 6, 3, 1, C.k); R(9, 7, 4, 1, C.k); R(-4, 14, 4, 2, C.d); R(17, 13, 4, 3, C.d); return; }
    const sq = 1 - cr * .65, Y = y => Math.round(16 - (16 - y) * sq);
    const RR = (x, y, w, h, c) => { const y0 = Y(y), y1 = Y(y + h); R(x, y0, w, Math.max(1, y1 - y0), c); };
    const step = e.fr === 1 ? 1 : e.fr === 3 ? -1 : 0, d = e.dir, hx = e.listen ? 1 : 0;
    if (d === 1 || d === 2) {
      const M = d === 2 ? (x, y, w, h, c) => RR(16 - x - w, y, w, h, c) : RR;
      if (step === 0) { M(4, 4, 7, 12, C.d); M(3, 14, 8, 2, C.k); }
      else { M(1 + (step > 0 ? 0 : 6), 4, 6, 12, C.d); M(8 - (step > 0 ? 0 : 6), 4, 6, 11, C.d); M(0, 14, 7, 2, C.k); M(9, 13, 7, 2, C.k); }
      M(1, -10, 15, 15, C.b); M(12, -9, 4, 13, C.d); M(1, -10, 15, 2, C.l); M(1, 2, 15, 2, '#4a3a26');
      M(5 + step * 2, -8, 5, 14, C.d); M(4 + step * 2, 5, 6, 4, C.d);
      M(2 - hx, -24 + hx, 12, 14, C.b); M(10, -23, 4, 12, C.d); M(2, -24, 12, 2, C.l); M(1 - hx, -19, 1, 4, C.b);
      M(3 - hx, -21, 5, 1, C.k); M(3 - hx, -17 + hx, 3, 2, '#140a06'); if (e.wild) M(3 - hx, -17 + hx, 1, 1, '#e89a40');
      M(2 - hx, -13, 4, 1, C.k);
    } else {
      RR(1, 4, 6, 12 - (step === 1 ? 1 : 0), C.d); RR(9, 4, 6, 12 - (step === -1 ? 1 : 0), C.d);
      RR(0, 14 - (step === 1 ? 1 : 0), 7, 2, C.k); RR(9, 14 - (step === -1 ? 1 : 0), 7, 2, C.k);
      RR(-2, -10, 20, 15, C.b); RR(14, -9, 4, 13, C.d); RR(-2, -10, 20, 2, C.l); RR(-1, 2, 18, 2, '#4a3a26');
      if (d === 3 && e.pour) {   // 举着水桶往缸里倒
        RR(-5, -26, 4, 18, C.b); RR(17, -26, 4, 18, C.d); RR(-3, -34, 22, 8, '#5a4030'); RR(-3, -34, 22, 2, '#7a5a40'); RR(4, -27 + Math.round(Math.sin(t * 6)), 8, 3, '#3d6476');
      } else {
        const a1 = step === 1 ? 1 : 0, a2 = step === -1 ? 1 : 0;
        RR(-6, -9 + a1, 4, 14, C.b); RR(-7, 4 + a1, 5, 4, C.d); RR(18, -9 + a2, 4, 14, C.d); RR(18, 4 + a2, 5, 4, C.d);
      }
      RR(1 + hx, -24, 14, 14, C.b); RR(13 + hx, -23, 2, 12, C.d); RR(1 + hx, -24, 14, 2, C.l);
      if (d === 0) {
        letters3(RR, 3 + hx, -22, e.gone);
        RR(4 + hx, -16 - hx, 3, 3, '#140a06'); RR(10 + hx, -16, 3, 3, '#140a06');
        if (e.wild) { RR(5 + hx, -15 - hx, 1, 1, '#e89a40'); RR(11 + hx, -15, 1, 1, '#e89a40'); }
        RR(8 + hx, -15, 1, 3, C.l); RR(5 + hx, -12, 7, 1, C.k);
        if (!e.gone || e.gone === 'm' || e.gone === 't') RR(9 + hx, -12, 2, 1, '#e8dcc0');   // 嘴角露出一点字条
      } else { RR(4 + hx, -20, 1, 4, C.d); RR(9 + hx, -18, 1, 5, C.d); RR(6 + hx, -14, 4, 1, C.d); }
    }
    if (cr > 0) for (let i = 0; i < 7; i++) R(-6 + i * 4 + ((i * 5) % 3), 12 + (i % 3), 3, 2, i % 2 ? C.d : C.b);
  }

  /* ---------- 惊吓大头像 ---------- */
  function golemFace(R, a, t, gone) {
    const b = '#8a6a4a', d = '#6a4e34', l = '#a8865e', k = '#24140a';
    R(0, 0, 32, 32, '#0a0604');
    R(4, 3, 24, 29, b); R(6, 2, 20, 1, b); R(3, 6, 1, 26, d); R(28, 6, 1, 26, d);
    R(4, 3, 24, 2, l); R(24, 5, 4, 27, d);
    for (const [x, y, w] of [[6, 12, 3], [22, 21, 3], [7, 28, 4], [20, 10, 2], [11, 30, 5]]) R(x, y, w, 1, d);
    SLOTS.forEach((ch, i) => { const x = 6 + i * 7; if (ch === gone) { R(x, 5, 5, 5, l); R(x + 1, 7, 3, 1, '#b8946a'); return; } glyph(R, GL5, ch, x, 5, 1, k); });
    R(5, 11, 22, 2, d);
    R(8, 13, 5, 5, '#120804'); R(19, 13, 5, 5, '#120804');
    if (!gone) { const gl = .55 + Math.sin(t * 6) * .3; R(10, 15, 1, 1, `rgba(240,160,64,${gl})`); R(21, 15, 1, 1, `rgba(240,160,64,${gl})`); }
    else { R(9, 14, 3, 1, '#2a1a10'); R(20, 14, 3, 1, '#2a1a10'); }
    R(15, 14, 2, 8, l); R(14, 21, 4, 1, d);
    const o = Math.min(3, Math.floor(a * 6));
    R(9, 25, 14, 1 + o, '#140a06');
    if (!gone) { R(17, 24 + (o >> 1), 4, 3, '#e8dcc0'); R(18, 25 + (o >> 1), 2, 1, '#8a7a60'); }
    R(24, 3, 1, 4, k); R(25, 7, 1, 3, k); R(6, 20, 1, 3, k);
    if (gone) { R(10, 18, 1, 7, 'rgba(110,140,160,.7)'); R(21, 18, 1, 5, 'rgba(110,140,160,.6)'); }
  }

  /* ---------- 剧本：犹太城（开场） ---------- */
  async function rivkaTalk(S) {
    const f = S.f;
    S.face('rivka', 'pl');
    if (!f.rivka) {
      f.rivka = true;
      await S.say('莉芙卡', ['雅各！今天约瑟勒又帮我把水桶提回家了。它一只手就拎两桶，一滴都没洒。', '它在小巷里拐弯可慢了，得一手扶着墙，像头老牛。可到了墓园墙外那条直巷上，它跑起来，马车都追不上。', '它不会说话。可是它每回从墓园墙外走过，都要捡一块小石子，放在墙头上。']);
      await S.say('莉芙卡', '妈妈说，人们去看死去的亲人，就在墓碑上放一块石子。约瑟勒是看大人这么做，学的。……它知道为什么吗？');
      await S.say('莉芙卡', '它今天给了我一块，圆圆的，像个鸡蛋。给你吧——你替我谢谢它。');
      S.give('pebble');
      return;
    }
    const L = ['妈妈叫我回去了，要点安息日的蜡烛了。', '安息日平安，雅各！', '约瑟勒的手好凉。像井里的水。'];
    await S.say('莉芙卡', L[(f._rv = ((f._rv ?? -1) + 1) % L.length)]);
  }
  async function homeDoor(S) {
    const f = S.f;
    if (f.stage === 'walk') { S.sfx('open'); return S.go('house', 10, 9, 3); }
    return S.narr('拉比家的门板被砸成了两半，门框歪在一边。');
  }
  async function shulDoor(S) {
    const f = S.f;
    if (f.stage === 'walk') { chant(S, .03); return S.narr('会堂的门虚掩着，里面已经有人在低声念诗篇了。\n门楣上刻着葡萄藤，一串一串的。\n——先把面包送回家。'); }
    if (f.stage === 'chase') return;
    return S.narr('门里，所有人都还站着，等拉比回去。');
  }
  async function rungsDesc(S) {
    if (S.once('rungs1')) return S.narr('会堂外墙上钉着一排铁梯磴，一级一级，一直通到房檐底下阁楼的小门。\n阁楼里放着用旧了的经卷和祈祷书——写过圣名的纸，旧了、破了也不能扔，要收在那儿。');
    return S.narr('铁梯磴被雨水锈得发红，摸上去冰凉。');
  }

  /* ---------- 剧本：拉比家 ---------- */
  function goalHome(S) {
    const f = S.f;
    if (!f.rules) return S.goal('看看桌上拉比留的字条');
    const need = [];
    if (!f.challah) need.push('把哈拉面包摆上桌、盖好');
    if (!f.cup) need.push(S.has('cloth') ? '用布擦净祝福的杯子' : '擦净祝福的杯子（擦布在厨房的陶罐架上）');
    if (need.length) S.goal('照拉比的嘱咐：' + need.join('，') + '（都在桌上）');
  }
  async function tableUse(S) {
    const f = S.f, e = S.ent('table');
    if (!f.rules) { e.s.readn = true; f.rules = true; await S.note('rules'); goalHome(S); return; }
    if (!f.challah) {
      S.take('challah'); e.s.challah = true;
      await S.narr('你把两条编得鼓鼓的哈拉面包并排摆在桌上——安息日的桌上，面包总是两条。\n再盖上那块绣着金线的盖布。');
      e.s.cover = true; f.challah = true; goalHome(S);
      return checkReady(S);
    }
    if (!f.cup) {
      if (!S.has('cloth')) { await S.narr('拉比的银杯倒扣在桌角，杯沿上落了一层薄灰。\n干净的擦布……在厨房的陶罐架上。'); return; }
      S.take('cloth'); e.s.cup = true; f.cup = true;
      await S.narr('你把拉比的银杯擦得锃亮，杯口朝上，摆在他的位子前。\n今晚，他要举着它，念祝福的话。');
      goalHome(S);
      return checkReady(S);
    }
    await S.narr('两根蜡烛立在烛台上，面包盖着，杯子擦净了。\n安息日的桌子摆好了——只等日落。');
  }
  async function checkReady(S) {
    const f = S.f;
    if (f.rules && f.challah && f.cup && f.stage === 'home') await sunset(S);
  }
  async function sunset(S) {
    const f = S.f;
    await S.wait(400);
    shutterKnock(S, .07); shutterKnock(S, .05, 1.6);
    await S.card('', '', '窗外的日头一点一点沉下去。\n\n邻居家的窗子里，亮起了安息日的烛光。\n远远地，会堂的执事挨家挨户敲着窗板，叫人上会堂去。\n\n拉比没有回来。');
    S.dark(.68); S.ent('hwin').s.dusk = 2;
    await S.think('拉比说日落前回来，取下约瑟勒嘴里的字条。\n……他从来没有忘过。');
    f.stage = 'flood'; f.fl = 0;
    S.ent('wbarrel').s.over = true;
    S.sfx('water');
    await S.narr('厨房里的水声变了。\n不是倒进缸里的声音——是水哗哗地淌在地上的声音。');
    S.goal('厨房里出事了——去看看约瑟勒');
  }
  async function hgolemUse(S) {
    const f = S.f;
    if (f.stage === 'flood') return goWild(S);
    if (f.stage !== 'home') return;
    if (!f.saw) {
      f.saw = true;
      await S.narr('约瑟勒站在水缸前，一桶一桶地往里倒水。\n它比门框还高，进厨房得低着头。灰褐色的泥被手指一下一下抹平过，还看得见指纹。');
      await S.narr('它的额头上，刻着三个字母：אמת\n——emet，真理。');
      await S.think('拉比说，它嘴里还含着一张字条，上面写着……那个名。我从来没敢看。');
      return;
    }
    const L = ['「约瑟勒，歇一歇吧。」\n……它听不见。它只听得见拉比的声音。', '它身上有一股河边的泥腥味，湿湿凉凉的。', '它拎水桶的手很大，指缝里还嵌着沙粒。捏它的泥，是从伏尔塔瓦河岸上挖来的。'];
    await S.narr(L[(f._gl = ((f._gl ?? -1) + 1) % L.length)]);
  }
  async function goWild(S) {
    const f = S.f, g = S.ent('hgolem');
    await S.say('雅各', '约瑟勒！够了！水都漫到门口了——停下！');
    await S.narr('它没有停。\n水桶举起来，倒下去。举起来，倒下去。');
    await S.say('雅各', '约瑟勒！', { style: 'big' });
    g.s.pour = false; S.face('hgolem', 'pl'); g.s.wild = true;
    await S.wait(500);
    await S.scare('face', { face: 'golem', sfx: 'sting', dur: 1 });
    pound(S); S.shake(500, 3); f.smashed = true;
    await S.narr('它转过身来。\n额头上那三个字母——אמת——在暮色里湿漉漉地发亮。眼窝深处，有一点火星似的光。');
    await S.narr('它把水桶往墙上一抡。陶罐、铜锅，稀里哗啦碎了一地。');
    f.saw = true;
    await S.walk('pl', [12, 6], 6.5);
    const d = S.ent('kdoor'); d.hidden = false; d.solid = true;
    S.place('hgolem', 15, 6, 1);
    S.sfx('close'); S.sfx('locked');
    await S.narr('你连滚带爬地退出厨房，砰地关上门，插上了门闩。\n门板后面，「咚」的一声闷响。');
    f.stage = 'barred';
    S.goal('拉比的字条说：书房的箱子里有札记——打开箱子的锁（锁上的数，是它额头上那个字的数）');
    if (S.coop) S.toast('联机：一个人按 J 翻字母板念数，一个人拨锁');
    S.cp('lock');
  }
  const LOCKHINT = [
    '（字母和数……拉比讲过。每一个希伯来字母，同时也是一个数。）',
    '（书房墙上那块给孩子念字母的木板——每个字母底下，都用粉笔写着它的数。按 J 可以翻笺。）',
    '（אמת：aleph 是 1，mem 是 40，tav 是 400。加起来——441。）'
  ];
  async function chestUse(S) {
    const f = S.f, e = S.ent('rchest');
    if (f.book) return S.note('book');
    if (f.stage !== 'barred') return S.narr('拉比的书箱。铜锁上有三个转盘。\n拉比说过：箱子里的东西，不到万不得已，别打开。');
    const v = await S.keypad('铜锁上有三个转盘，每个刻着 0 到 9。\n锁上的数，就是它额头上那个字的数。', DIG, 3);
    if (v == null) return;
    if (v === '441') {
      e.s.open = true; S.sfx('open');
      await S.narr('「咔」的一声，锁开了。\n箱子里垫着一块旧丝绒，上面放着一本薄薄的手抄本。');
      f.book = true;
      await S.note('book');
      return breakout(S);
    }
    const k = f.wrong = (f.wrong || 0) + 1;
    S.sfx('locked'); pound(S); S.shake(300, 2);
    await S.narr('锁没开。\n厨房那边又「咚」地砸了一下，门闩跳了跳。');
    if (v === '440') return S.think('……440。那是 מת 的数——met，死。\n少算了一个字母。');
    if (v === '414' || v === '144') return S.think('……数字是这几个，可顺序不对。\n锁上的数，要照念出来的样子拨：四百四十一。');
    if (v === '702') return S.think('……702？那是 שבת\u200E——安息日——的数。不是它额头上那个字。');
    if (k >= 2) await S.think(LOCKHINT[Math.min(k, 4) - 2]);
    if (k >= 4 && !f.alef) { f.alef = true; await S.note('alefbet'); }
  }
  async function breakout(S) {
    await S.think('拉比在会堂。只有拉比的声音，它才听得见——');
    pound(S); S.shake(700, 5); S.sfx('glass');
    const d = S.ent('kdoor'); d.hidden = true; d.solid = false;
    S.place('hgolem', 13, 6, 1);
    await S.narr('「咔嚓」——厨房的门板从当中裂开，门闩飞了出去。\n约瑟勒低着头，从门洞里挤了出来。');
    await S.go('lanes', 7, 8, 0);
    await chaseStart(S);
  }
  async function exitHouse(S) {
    const f = S.f;
    if (f.stage === 'home') await S.think('拉比交代过的事还没做完。（看看桌上的字条）');
    else if (f.stage === 'flood') await S.think('厨房里哗哗的水声……先去看看约瑟勒。');
    else if (!f.book) await S.think('跑去会堂找拉比？……它要是把门砸开追出来，我连怎么对付它都不知道。\n拉比的字条说过，箱子里有札记。');
    else return;
    await S.walk('pl', 'u', 5);
  }

  /* ---------- 危险一：巷子里的追逐 ---------- */
  function momentum(S, g, C) {   // 每迈出新的一步：同一个方向越走越快，一拐弯就慢下来
    const mv = g.mv; if (!mv || mv === g._mv) return;
    g._mv = mv; const d = g.dir;
    g._run = d === g._ld ? (g._run || 0) + 1 : 0; g._ld = d;
    mv.spd = Math.min(C.max, C.v0 + g._run * C.inc);
    const dist = Math.hypot(g.px - S.pl.px, g.py - S.pl.py) / TS;
    golemStep(S, clamp(.22 - dist * .012, .03, .22));
  }
  async function chaseStart(S) {
    const f = S.f; f.stage = 'chase'; f.hits = 0;
    S.hide('rivka'); S.dark(.7); S.amb('night'); candles(S);
    S.goal('跑！去会堂找拉比（按住奔跑键。它在直路上越跑越快——钻弯弯绕绕的小巷）');
    S.cp('chase');
    if (!DIED.chase) await S.think('直巷——它在直路上跑得比马车还快。\n小巷！院子右下角那条，一路拐着弯，能通到会堂前的广场！');
    chaseGo(S);
  }
  function candles(S) {   // 日落了：各家窗子里亮起安息日的烛光
    for (const id of ['hwin1', 'adoor3', 'swin1', 'swin2']) S.ent(id).light = { r: 1.6, col: 'rgba(255,200,120,.16)', flick: true };
  }
  function chaseGo(S) {
    const g = S.ent('golem');
    g.s.wild = true; g.s.listen = false; g.s.gone = ''; g._run = 0; g._ld = -1; g._mv = null;
    pound(S); S.shake(400, 3);
    S.toast('身后，拉比家的门板「轰」地炸开了——');
    S.place('golem', 3, 5, 0);
    S.chase('golem', { spd: CH.v0, catch: chaseHit });
    g.chase.wait = SPAWN_WAIT;
  }
  function knockAway(S, g, n) {   // 把玩家往远离泥人的方向推开几格（能走才推）
    const p = S.pl, m = curMap(); let best = null, bd = -1;
    for (let d = 0; d < 4; d++) {
      let x = p.x, y = p.y, k = 0;
      while (k < n && passable(m, x + DIRS[d][0], y + DIRS[d][1], p)) { x += DIRS[d][0]; y += DIRS[d][1]; k++; }
      const dd = Math.hypot(x * TS - g.px, y * TS - g.py);
      if (k && dd > bd) { bd = dd; best = [x, y, d]; }
    }
    if (best) S.pos(best[0], best[1], best[2]);
  }
  async function chaseHit(S) {
    const f = S.f, g = S.ent('golem');
    S.stop('golem');
    f.hits = (f.hits || 0) + 1;
    if (f.hits >= 2) {
      DIED.chase++;
      await S.scare('face', { face: 'golem', sfx: 'scream', dur: .9 });
      await S.die('泥做的手从背后攥住了你。\n又湿又凉，像从河底伸上来的。\n\n（它起步慢、拐弯更慢，可在直路上会越跑越快。）', '它追上了你');
      return;
    }
    pound(S); S.shake(600, 4); S.fx('red');
    knockAway(S, g, 1);
    S.toast('它一巴掌把你扫倒在地——你连滚带爬地站了起来！再被追上，就完了');
    g._run = 0; g._ld = -1; g._mv = null;
    S.chase('golem', { spd: CH.v0, catch: chaseHit });
    g.chase.wait = .5;
  }
  async function reachShul(S) {
    const f = S.f, g = S.ent('golem');
    f.stage = 'atshul'; S.stop('golem');
    const [gx, gy] = cell(g);
    if (gy <= 11 && Math.abs(gx - 32) <= 3) S.place('golem', 30, 13, 2);
    S.face('pl', 3);
    await S.narr('你一把推开会堂的门——');
    g.s.listen = true; chant(S, .05);
    await S.narr('身后那沉重的脚步声，停了。\n你回过头：约瑟勒站在广场当中，歪着头，像是在听会堂里的念诵。');
    await S.think('「它从不进会堂。」……札记里是这么写的。');
    S.sfx('open');
    await S.go('shul', 9, 10, 3);
  }

  /* ---------- 剧本：会堂 ---------- */
  async function rabbiTalk(S) {
    const f = S.f;
    if (S.map === 'attic') return atticRabbi(S);   // 阁楼里的拉比是从会堂一路跟来的同一个人
    if (f.stage === 'shulgo') return S.say('勒夫拉比', '走吧。出了会堂的门再跑。');
    if (f.stage === 'rungs') return S.say('勒夫拉比', S.f.climb ? '别动，等它过来。我一叫它，你就伸手。' : '去铁梯那边——会堂外墙的右手边。上了梯子就别动！');
    if (f.stage !== 'shul') return;
    S.face('rabbi', 'pl'); f.sing = false;   // 合成的念诵排好了就停不下来：一开口就不再起新的一段
    await S.say('雅各', '拉比！约瑟勒——它疯了！它砸了厨房，砸开门，一路追着我跑到这儿……', { style: 'whisper' });
    await S.narr('拉比的脸一下子白了。他抬头看了一眼高处的窄窗——外面的天，只剩一线亮。');
    await S.say('勒夫拉比', '……我忘了。今天心里想着别的事，竟把它忘了。');
    await S.say('勒夫拉比', '门德尔！告诉大家，先等一等。安息日的诗篇，谁也别起头。');
    await S.narr('门德尔愣了一下，随即点点头，一排一排地走过去低声传话。\n念诵声停了下来。会堂里静得能听见烛芯「噼」地响了一声。');
    const c = await S.ask('拉比看着你：「札记，你看过了？」', ['「看过了。抹去它额上头一个字母——aleph。」', '「看过了……可它额上的字，到底该抹哪一个？」']);
    await S.say('勒夫拉比', c === 1 ? '我写得清清楚楚：真理的头一个字母。别的一个也不许碰。' : '对。别的一个也不许碰。');
    await S.say('勒夫拉比', ['我老了，够不着它的额头。会堂外墙上有一排铁梯磴，你爬上去。', '它认得我的声音。我一叫它，它就会回过头来看我——就那一下，你伸手。', '它看着你的时候，千万别伸手。可也别等得太久。']);
    f.stage = 'shulgo';
    S.follow('rabbi', true);
    S.goal('和拉比一起走出会堂');
  }
  async function goClimax(S) {
    const f = S.f; f.stage = 'out';
    S.norun(false);
    S.follow('rabbi', false);
    S.moveTo('rabbi', 'lanes', 34, 11, 0);
    S.ent('rabbi').solid = true;
    await S.go('lanes', 32, 10, 0);
    S.dark(.8);
    S.place('golem', 29, 15, 2);
    const g = S.ent('golem'); g.s.wild = true; g.s.listen = false; g.s.gone = '';
    pound(S);
    await S.narr('外面的天已经暗成了深蓝色。\n约瑟勒在广场上，一下一下地砸着那辆板车。');
    await S.say('勒夫拉比', ['我在这儿叫它。你去铁梯那边——会堂外墙的右手边。', '上了梯子，就别动。']);
    f.stage = 'rungs';
    S.goal('爬上会堂右边的铁梯磴；拉比一叫、它回头的那一下，按调查键抹字');
    if (S.coop) S.toast('联机：一个人盯着拉比和它的头，一个人在梯子上——喊「现在」！');
    S.cp('rungs');
    startRungs(S);
  }

  /* ---------- 危险二：铁梯磴 ---------- */
  function startRungs(S) {
    const g = S.ent('golem'), f = S.f;
    S.place('golem', 29, 15, 2);
    g.s.wild = true; g.s.listen = false; g.s.gone = ''; g.s.crumble = 0; g._run = 0; g._ld = -1; g._mv = null;
    f.climb = false; f.hits2 = 0; S.wear('@me');
    RC = { t: 3, fz: 0, n: 0, adj: 0, was: false, told: RC.told };
    S.chase('golem', { spd: CL.v0, catch: S => rungHit(S, 'ground') });
    g.chase.wait = 1.0;
  }
  function callGolem(S, ladder) {
    const g = S.ent('golem');
    rabbiCall(S, RC.n); S.bubble('rabbi', '!', 900);
    S.freeze('golem', true); S.face('golem', 'rabbi'); g.s.listen = true; S.bubble('golem', '?', ladder ? 2200 : 1500);
    RC.fz = ladder ? 2.2 : 1.5; if (ladder) RC.n++;
    RC.t = 99;
    if (!RC.told) { RC.told = true; S.toast('「约瑟勒！」——拉比一喊，它就停下来，回过头去看他'); }
    else if (ladder && S.coop) S.toast('它回头了——现在！');
  }
  function rungsTick(S, dt) {
    const f = S.f, p = S.pl, g = S.ent('golem');
    if (!g || g.hidden) return;
    if (g.chase) momentum(S, g, CL);
    if (f.climb && g.mv && g.mv.tx === p.x && g.mv.ty === p.y) { const mv = g.mv; g.mv = null; g.px = mv.fx * TS; g.py = mv.fy * TS; g.x = mv.fx; g.y = mv.fy; g._run = 0; if (g.chase) g.chase.wait = .25; }   // 爬在梯子上时，它只能走到梯子底下
    if (S.busy || W.ended) return;
    if (f.climb && (S.moving || p.x !== RX || p.y !== RY)) { f.climb = false; S.wear('@me'); }
    if (S.isFrozen('golem')) {
      RC.fz -= dt;
      if (RC.fz <= 0) { S.freeze('golem', false); g.s.listen = false; RC.t = 3.4; RC.adj = 0; RC.was = false; }   // 漏过一次：下一次它一转回来，拉比照样会抢着再叫
      return;
    }
    if (!g.chase) return;
    if (!f.climb && near(g, p)) { g.chase = null; return S.run(S => rungHit(S, 'ground')); }
    const [gx, gy] = cell(g), adj = !g.mv && Math.abs(gx - p.x) + Math.abs(gy - p.y) === 1;
    if (f.climb && adj) {
      S.face('golem', 'pl');
      if (!RC.was) { RC.was = true; RC.t = Math.min(RC.t, [.7, 1.0, 1.4, 1.9][Math.min(RC.n, 3)]); S.bubble('golem', '!', 900); }
      RC.adj += dt;
      if (RC.adj > 1.6) { g.chase = null; return S.run(S => rungHit(S, 'swipe')); }
    } else { RC.was = false; RC.adj = 0; }
    RC.t -= dt;
    if (RC.t <= 0) callGolem(S, f.climb && adj);
  }
  async function rungsUse(S) {
    const f = S.f, p = S.pl;
    if (f.stage !== 'rungs') return rungsDesc(S);
    if (!f.climb) {
      f.climb = true; S.wear('climb'); clink(S);
      S.toast(S.once('climb1') ? '你攀着铁梯磴爬了上去——等它走到梯子底下。（一走动就会爬下来）' : '你又爬上了铁梯磴');
      return;
    }
    const g = S.ent('golem'), [gx, gy] = cell(g);
    if (Math.abs(gx - p.x) + Math.abs(gy - p.y) > 1) { S.toast('它离梯子还远，够不着它的额头……等它过来'); return; }
    if (!S.isFrozen('golem')) return rungHit(S, 'grab');
    return eraseLetter(S);
  }
  const HITMSG = {
    ground: '它的手扫过来，把你掀翻在地！——再被它碰到，就完了。拉比叫它的时候，它会停下',
    swipe: '你在梯子上等得太久，它抬手把你从梯子上扯了下来！——别等它先动手',
    grab: '你伸手的那一刻，它正看着你！泥手攥住你的手腕，把你甩了出去——等拉比叫它、它回头的时候再伸手'
  };
  async function rungHit(S, kind) {
    const f = S.f, g = S.ent('golem');
    S.stop('golem'); S.freeze('golem', false); g.s.listen = false;
    f.climb = false; S.wear('@me');
    f.hits2 = (f.hits2 || 0) + 1;
    if (f.hits2 >= 2) {
      DIED.rungs++; DIED.last = 'rungs';
      await S.scare('face', { face: 'golem', sfx: 'scream', dur: .9 });
      await S.die(kind === 'ground' ? '它没有再给你爬起来的机会。\n泥做的手，又湿又凉，一点一点地收紧。' : '你从梯子上摔了下来。\n它弯下腰，额头上那三个字母离你只有一拃远——אמת。\n真理。', '泥做的手');
      return;
    }
    pound(S); S.shake(600, 4); S.fx('red');
    if (kind === 'ground') knockAway(S, g, 3); else S.pos(34, 13, 2);
    S.toast(HITMSG[kind]);
    g._run = 0; g._ld = -1; g._mv = null;
    S.chase('golem', { spd: CL.v0, catch: S => rungHit(S, 'ground') });
    g.chase.wait = 1.3; RC.t = 2.6; RC.adj = 0; RC.was = false;
  }
  async function eraseLetter(S) {
    const v = await S.keypad('约瑟勒的额头就在你手边。湿泥上刻着那个字：אמת\n抹去哪一个字母？（点按字母；键盘用方向键选、回车确认）', ['ת', 'מ', 'א'], 1);
    if (v == null) { S.toast('你的手停在了半空……'); return; }
    smear(S);
    if (v === 'א') return goodErase(S);
    S.ent('golem').s.gone = v === 'מ' ? 'm' : 't';
    return v === 'מ' ? etDeath(S) : emEnd(S);
  }
  async function goodErase(S) {
    const f = S.f, g = S.ent('golem');
    f.stage = 'after'; S.stop('golem'); RC.t = 99;
    g.s.gone = 'a';
    await S.narr('你把拇指按在最右边那个字母上，用力一抹。\naleph 没了。湿泥上只剩下两个字母——מת。\nmet。死。');
    g.s.listen = false; g.s.wild = false;
    crumbleSnd(S);
    for (let i = 1; i <= 10; i++) { g.s.crumble = i / 10; if (i % 3 === 0) S.shake(200, 2); await S.wait(110); }
    f.climb = false; S.wear('@me');
    await S.narr('它没有倒下，是一点一点矮下去的。\n像一捧被雨淋透的土，慢慢地、慢慢地，塌成了一堆泥。');
    const [gx, gy] = cell(g), m = curMap(), r = S.ent('rabbi'), [rx, ry] = cell(r);
    let tgt = null, bd = 1e9;
    for (const [dx, dy] of DIRS) { const x = gx + dx, y = gy + dy; if (!passable(m, x, y, r) && !(x === rx && y === ry)) continue; const dd = Math.abs(x - rx) + Math.abs(y - ry); if (dd < bd) { bd = dd; tgt = [x, y]; } }
    if (tgt) await S.walk('rabbi', tgt, 2.4);
    S.face('rabbi', 'golem');
    await S.narr('拉比慢慢走过来，在那堆泥跟前跪下，从泥里摸出一张卷得很小、湿透了的字条。\n他没有打开它，也没有给你看，用手帕包好，收进了怀里。');
    await S.say('勒夫拉比', ['是我的错。', '安息日里，连仆人、连牲口都要歇息。我却让它一直干活，干到天黑。']);
    await S.say('勒夫拉比', ['写过圣名的纸，旧了、破了也不能扔，要收进会堂阁楼上的经卷库里，好好安放。', '可它不是纸。……雅各，你说，把它放到哪儿去？']);
    const c = await S.ask('暮色里，那堆泥还冒着一点湿气。', ['「抬上会堂的阁楼，和那些用旧了的经卷放在一起。」', '「送回伏尔塔瓦河边。泥是从那儿来的，就还给河。」']);
    if (c === 1) return riverEnd(S);
    await S.say('勒夫拉比', '……好。让它跟那些经页一起歇着。');
    await S.card('', '', '门德尔叫来了几个人。\n你们用一块旧帘子兜着那堆泥，拴上绳子，顺着铁梯磴，一级一级地吊上了阁楼。\n\n会堂里的人都还站着，等着。');
    S.hide('golem');
    S.moveTo('rabbi', 'attic', 10, 5, 1);
    await S.go('attic', 7, 6, 3);
  }
  async function etDeath(S) {
    DIED.et++; DIED.last = 'et';
    const g = S.ent('golem');
    await S.narr('你抹去了中间那个字母。\n湿泥上剩下两个字母，中间空着一道指痕——את。');
    await S.say('勒夫拉比', '不对——那不是 met！', { style: 'big' });
    S.freeze('golem', false); g.s.listen = false;
    await S.scare('face', { face: 'golem', sfx: 'scream', dur: 1 });
    await S.die('它没有停下来。\n泥手攥住了你的脚踝，把你从梯子上拖了下去。\n\n（札记里写着：真理的头一个字母，叫 aleph。别的字母，一个也不能碰。）', '错了一个字母');
  }
  async function emEnd(S) {
    DIED.em++; DIED.last = 'em';
    const f = S.f, g = S.ent('golem');
    f.stage = 'em'; S.stop('golem'); S.freeze('golem', false); RC.t = 99;
    f.climb = false;
    await S.narr('你抹去了最左边那个字母。\n——「头一个」。你是从左往右数的。');
    g.s.wild = false; g.s.listen = false;
    await S.narr('约瑟勒不动了。\n可它没有塌下去。它慢慢地低下头，看着自己的两只手，好像第一次看见它们。');
    await S.scare('face', { face: 'golemEm', sfx: 'sting', dur: 1.1 });
    await S.say('勒夫拉比', ['……אמ', 'em——母亲。也可以念作 im——「如果」。', '雅各……希伯来文，是从右往左读的。']);
    S.wear('@me');
    await S.walk('golem', [27, 13], 2.2);
    await S.alpha('golem', 0, 900);
    await S.end({ bad: true, id: 'em', title: '如果', text: '它从你们身边走过去，没有再看拉比一眼。\n一步，一步，走进了通向河边的小巷。\n\n那天晚上，安息日来了。会堂里的人等了很久，才念起那篇诗篇。\n\n后来有人说，伏尔塔瓦河起雾的晚上，河岸上会站着一个很高的影子，低着头，像是在等谁。\n它不是活的，也不是死的。它只是一个「如果」。' + (S.has('pebble') ? '\n\n你手心里还攥着莉芙卡的那块圆石子，攥得发烫。你没能把它还给约瑟勒。' : '') + '\n\n（希伯来文从右往左读。真理的头一个字母，在最右边。）' });
  }
  async function riverEnd(S) {
    await S.say('勒夫拉比', '……从泥里来，回到泥里去。好。');
    await S.card('', '', '门德尔叫来了几个人，用一块旧帘子兜着那堆泥，抬到了河边。\n\n伏尔塔瓦河的水黑沉沉的。拉比低声念了几句什么，你没有听清。\n泥一捧一捧地落进水里，转眼就散开了。看不出哪一捧曾经是一只手，哪一捧曾经是额头。');
    S.hide('golem');
    await S.end({ id: 'river', title: '还给河的泥', text: '那天晚上，会堂里的安息日诗篇念了两遍。\n\n可是后来，城里的人还是一代一代地说：老新会堂的阁楼上，躺着一个泥人。\n有人爬上去看过，说只看见灰尘和旧经页——「那是拉比把它藏得好。」\n\n你从来没有纠正过他们。\n传说比你记得的那一晚，更愿意让它留下来。\n\n那张写着圣名的字条，拉比再也没有拿出来过。' + (S.has('pebble') ? '\n\n莉芙卡给你的那块圆石子，你一直揣在兜里。' : '') });
  }

  /* ---------- 剧本：阁楼 ---------- */
  async function clayUse(S) {
    const f = S.f, e = S.ent('clay');
    if (S.has('pebble') && !f.stone) {
      const c = await S.ask('那堆泥静静地躺在旧经页中间，还看得出一点人的形状。\n你摸到兜里那块圆圆的小石子。', ['把莉芙卡的石子放在它胸口上', '先不放']);
      if (c === 0) {
        S.take('pebble'); f.stone = true; e.s.stone = true;
        await S.narr('你把石子轻轻放在它胸口的位置上。\n就像人们放在墓碑上的那样。就像它自己，一次一次放在墓园墙头上的那样。');
      }
      return;
    }
    await S.narr(f.stone ? '石子还在它胸口上。' : '泥已经凉透了。额头那块地方，还留着你的拇指印，和两个字母：מת');
  }
  async function pagesUse(S) {
    const f = S.f;
    if (!f.cover) {
      const c = await S.ask('一摞一摞的旧经页、散了线的祈祷书，有的被虫蛀了，有的被烛火燎过一角。\n上面写过圣名，就不能扔。', ['捧几页，轻轻盖在约瑟勒身上', '不动它们']);
      if (c === 0) { f.cover = true; S.ent('clay').s.cover = true; await S.narr('你捧起几页，一页一页抚平，盖在它身上。\n纸很轻，几乎没有重量。'); }
      return;
    }
    await S.narr('写过圣名的纸，在这里被好好地安放着，像人一样。');
  }
  async function atticRabbi(S) {
    const f = S.f;
    S.face('rabbi', 'pl');
    if (!f.cover) await S.narr('拉比从旁边那摞旧经页里捧起几页，轻轻盖在它身上。');
    await S.say('勒夫拉比', ['好了。让它歇着吧。', '那张字条，安息日过了，我也不放回去了。', '从今往后，谁也不许上这个阁楼。']);
    await S.narr('你们顺着铁梯磴下来的时候，天已经全黑了。');
    await S.card('', '', '会堂里，所有人都还站着，等着。\n\n拉比回到约柜旁边的位子上，领着大家，念起了那篇安息日的诗篇。\n念完一遍，他停了一会儿——\n又从头念了一遍。');
    const extra = [];
    if (f.stone) extra.push('阁楼上，那块圆圆的小石子还放在它胸口上。\n莉芙卡后来问你：约瑟勒知道为什么要放石子吗？你说：它学会了。');
    if (f.cover) extra.push('盖在它身上的那几页旧经页，是你一页一页亲手抚平的。');
    await S.end({ id: 'attic', title: '阁楼上的安息', text: '后来，老新会堂里一直这样念：星期五晚上，安息日的诗篇，念两遍。\n有人问为什么，老人们就说：那一晚，拉比念之前出去过一趟。\n\n阁楼的小门再也没有打开过。\n据说约瑟勒还躺在那里，和那些写过圣名的旧纸页在一起，\n等着该醒的那一天——或者永远不醒。\n\n' + (extra.length ? extra.join('\n') + '\n\n' : '') + '——安息日平安。' });
  }

  /* ---------- 人物 ---------- */
  const man = (key, top, beard, hair) => ({ key, skin: '#e2bc98', hair: hair || '#3a2a1e', hs: 'short', top, top2: '#d8d0bc', bottom: '#1e1a18', coat: true, shoes: '#141010',
    extra(g, d, fr, G, R) { R(4, G.hT - 1, 8, 2, '#141216'); if (d === 0) { R(5, G.hT + 5, 6, 3, beard); R(6, G.hT + 8, 4, 1, beard); } else if (d === 1) R(4, G.hT + 5, 3, 3, beard); } });

  defChapter({
    id: 'golem', n: 21, title: '布拉格的魔像', sub: '星期五的黄昏，拉比忘了取下泥人嘴里的字条。它额上写着「真理」——去掉一个字母，就是「死」。', origin: '布拉格犹太社区传说', color: '#4a3424',
    amb: 'wind', floor: 'stone', wall: 'plain', dark: .5, plr: 3.2, darkC: '#06040a',
    endings: { attic: '阁楼上的安息', river: '还给河的泥', em: '如果' },
    faces: {
      golem(R, a, t) { golemFace(R, a, t, ''); },
      golemEm(R, a, t) { golemFace(R, a, t, 't'); }
    },
    people: {
      me: { key: 'gol-me', skin: '#ecc6a2', hair: '#3a2616', hs: 'short', top: '#3a3328', top2: '#d8d0bc', bottom: '#2a2620', coat: true, shoes: '#1a1410',
        extra(g, d, fr, G, R) { R(4, G.hT - 1, 8, 2, '#16141a'); R(5, G.hT - 2, 6, 1, '#16141a'); if (d !== 3) { R(5, G.tB + 1, 1, 3, '#ece6d4'); R(10, G.tB + 1, 1, 3, '#ece6d4'); } } },
      rabbi: { key: 'gol-rabbi', skin: '#e2bc98', hair: '#e8e4dc', hs: 'short', top: '#16141a', top2: '#e8e4dc', bottom: '#16141a', robe: true, shoes: '#0c0a0c',
        extra(g, d, fr, G, R) {
          R(3, G.hT - 2, 10, 3, '#0e0c10'); R(4, G.hT - 3, 8, 1, '#0e0c10');
          if (d === 0) { R(5, G.hT + 5, 6, 5, '#ece8e0'); R(6, G.hT + 10, 4, 3, '#ece8e0'); R(7, G.hT + 13, 2, 1, '#d8d4cc'); }
          else if (d === 1) { R(3, G.hT + 5, 4, 6, '#ece8e0'); R(4, G.hT + 11, 2, 2, '#ece8e0'); }
        } },
      mendel: man('gol-men', '#4a3a2a', '#9a948a', '#8a8478'),
      c1: man('gol-c1', '#2a2a32', '#3a2a1e'), c2: man('gol-c2', '#3a2e26', '#c8c4bc', '#c8c4bc'), c3: man('gol-c3', '#26242a', '#5a3a22'), c4: man('gol-c4', '#34302a', '#8a7a6a'),
      rivka: { key: 'gol-rv', skin: '#f0cca8', hair: '#6a3a1e', hs: 'twin', top: '#7a4a3a', top2: '#e8dcc0', bottom: '#5a3a2a', dress: true, child: true, apron: '#d8ccb0', shoes: '#2a1a10' }
    },
    items: {
      challah: { name: '哈拉面包', desc: '两条编成辫子的白面包，刷了蛋液，烤得金黄。安息日的桌上，面包总是两条。' },
      cloth: { name: '擦布', desc: '一块叠得方方正正的白布，洗得发硬。' },
      pebble: { name: '圆石子', desc: '一块圆圆的小石子，像个鸡蛋，被河水磨得很光。莉芙卡说，是约瑟勒捡的。' }
    },
    notes: {
      rules: { title: '拉比留在桌上的字条', text: '雅各：\n\n我先去会堂。\n日落之前我回来，照例取下约瑟勒口中的字条。安息日里，它也要歇着——「你的仆婢、你的牲畜……无论何工都不可做」，泥做的仆人也一样。\n\n它只听我的声音。你叫它，它听不见。\n\n若是我回来晚了，它有什么不对——别碰它，也别想着去拔那张字条。书房的箱子里有我的札记。箱上的锁，你认得：就是它额上那个字的数。\n\n面包摆好、盖好。杯子擦净。\n\n——勒夫' },
      alefbet: { title: '书房墙上的字母板', text: '（钉在书房墙上的一块木板，是给拉比的小孙子们念字母用的。底下用粉笔写着每个字母的数。）\n\n希伯来文从右往左写，从右往左读。\n每一个字母，同时也是一个数：\n\naleph א‎＝1　bet ב‎＝2　gimel ג‎＝3　dalet ד‎＝4\nhe ה‎＝5　vav ו‎＝6　zayin ז‎＝7　chet ח‎＝8\ntet ט‎＝9　yod י‎＝10　kaf כ‎＝20　lamed ל‎＝30\nmem מ‎＝40　nun נ‎＝50　samekh ס‎＝60　ayin ע‎＝70\npe פ‎＝80　tsadi צ‎＝90　qof ק‎＝100　resh ר‎＝200\nshin ש‎＝300　tav ת‎＝400\n\n板子右下角，孩子用炭条歪歪扭扭地写了一个词：שבת‎（安息日）。' },
      book: { title: '拉比的札记', text: '（一本薄薄的手抄本，用希伯来文写成。下面是你读得懂的几段。）\n\n……取伏尔塔瓦河岸的泥，在夜里，按着书上的次序，捏成一个人形。我们三个人绕着它走了七圈。\n\n名，放在它口中，它便有了气息；真理，写在它额上，它便站了起来。\n它额上的字是 אמת‎——emet，真理。\n\n真理的头一个字母是 aleph。抹去这一个，剩下的便是 מת‎——met，死。它就重新是泥了。\n别的字母，一个也不能碰。少了别的字母，它就成了别的东西。\n\n它身子重，起步慢，拐弯更慢；可一旦在直路上奔起来，快过奔马。\n它从不进会堂。它认得我的声音：我叫它的名字，它总会回过头来看我。\n\n每个安息日前，取出口中的名；安息日过了，再放回去。书写、擦抹，都是安息日里不做的事。' },
      order: { title: '执事的单子', text: '（夹在会堂门边小经台上的一张纸，执事门德尔的字。）\n\n星期五　日落前\n一、敲窗板，叫各家上会堂。\n二、点会堂里的灯和蜡烛；施舍箱日落前收好。\n三、迎接安息日：念几篇诗篇。\n四、诗篇第九十二篇《安息日的诗歌》——「称谢耶和华，歌颂至高者的名，本为美事」。\n　　这一篇念完，安息日就迎进来了。\n五、晚祷。\n\n——拉比没到位子上之前，别起头。' }
    },
    legend: '魔像（golem）一词，在希伯来文里有「未成形之物」的意思，《诗篇》第139篇里就用过它。《塔木德》记载过一位拉比造了一个人，另一位拉比跟它说话，它不回答，于是被说「你是用尘土做的，回到尘土里去」。后来，按照《创造之书》一类的神秘传统用字母和圣名让泥土站起来的故事，在中欧犹太社区里流传了好几百年。据流传的说法，额上写 emet（真理）、抹去 aleph 便成了 met（死）的情节，在十七世纪的记述里就已出现，常和波兰海乌姆的以利亚拉比连在一起。\n\n犹大·勒夫·本·比撒列（约1520—1609），人称「马哈拉尔」，是十六世纪布拉格真实存在的大学者，以《塔木德》注释和哲学著作闻名，他的墓至今在布拉格老犹太墓园，来访的人在墓碑上放石子、塞写着心愿的小纸条。可是在他本人和同时代人的文字里，找不到他造过魔像的记载——把魔像和他连在一起，是十八、十九世纪以后的事。十九世纪中叶布拉格出版的犹太故事集让这个传说广为人知；1909年出版的一本自称根据古抄本整理的《马哈拉尔奇迹录》，一般认为是近代的文学创作，它把魔像写成保护社区、对抗「血祭诽谤」（一种针对犹太人的恶毒谣言，在欧洲历史上酿成过许多惨剧）的守护者。\n\n最出名的一幕：某个星期五，拉比忘了在安息日前取下魔像口中的圣名，魔像失控；拉比从会堂里冲出来，赶在安息日真正开始之前让它变回了泥。传说用这件事解释老新会堂的一个习惯——据说那里星期五晚上的安息日诗篇（第92篇）要念两遍。老新会堂建于十三世纪后半叶，是欧洲至今仍在使用的最古老的犹太会堂之一；外墙上的铁梯磴通向不对外开放的阁楼。据说魔像的泥身就收在阁楼里；二十世纪有人爬上去看过，据说只看到灰尘和旧经页——查无实据。阁楼收存旧经卷的做法（geniza：写有圣名的旧纸不能随意丢弃）是真实的犹太传统。二十世纪初，一部德语小说和一部默片让「布拉格魔像」传遍世界。\n\n本章力求尊重犹太文化与信仰：文中的诗篇和经文句子为意译；安息日两条面包、祝福的杯子、门柱圣卷、安息日不书写也不擦抹、仆人和牲畜也要歇息、在墓碑上放石子、墓碑上刻手（祭司家族）或水壶（利未人）等细节，都来自真实的习俗。游戏虚构：学生雅各、执事门德尔、莉芙卡和那个星期五；拉比把札记锁在用字母数（gematria）作密码的书箱里；魔像「直路越跑越快、拐弯慢」「从不进会堂」「在墓园墙头放石子」；铁梯磴上抹字的过程、抹错字母的两种结果，以及把泥送回河边的结局。',
    start: { map: 'lanes', x: 33, y: 12, dir: 1 },
    async intro(S) {
      await S.card('第二十一夜　布拉格的魔像', '十六世纪末　布拉格犹太城　一个星期五的下午', '勒夫拉比用伏尔塔瓦河岸的泥，捏了一个人。\n\n它比门框还高，不会说话，力气大得能扛起一车柴。\n它替犹太城挑水、劈柴、守夜。孩子们叫它约瑟勒。\n\n每个星期五，日落以前，拉比都会从它嘴里取出那张写着圣名的字条。\n安息日里，连泥做的仆人，也要歇息。');
    },
    resume: {
      async lock(S) { S.goal('拉比的字条说：书房的箱子里有札记——打开箱子的锁（锁上的数，是它额头上那个字的数）'); },
      async chase(S) {
        S.hide('rivka'); S.dark(.7); S.wear('@me');
        if (DIED.chase) await S.think(DIED.chase === 1 ? '（它起步慢、拐弯更慢，可在直路上会越跑越快。别走墓园墙外那条直巷——从院子右下角钻进小巷，一路拐着弯跑。）' : '（院子右下角进小巷，按住奔跑键一直拐弯；出了巷子就是会堂前的广场，门在广场上边。）');
        chaseGo(S);
      },
      async rungs(S) {
        S.wear('@me'); S.dark(.8);
        const T = {
          em: '（希伯来文从右往左读。真理的头一个字母，在最右边。）',
          et: '（札记里写着：头一个字母叫 aleph。字母板上画过它的样子——按 J 翻笺看看。）',
          rungs: '（上了梯子就别动。等它走到梯子底下，拉比一叫、它一回头看拉比，就按调查键。它盯着你的时候别伸手，也别等太久。）'
        };
        if (DIED.last) await S.think(T[DIED.last]);
        startRungs(S);
      }
    },
    thumb(g, w, h) {
      const P = (x, y, ww, hh, c) => { g.fillStyle = c; g.fillRect(x, y, ww, hh); };
      // 老新会堂锯齿形的砖山墙
      const steps = [[96, 34, 54, 34], [102, 26, 42, 8], [108, 18, 30, 8], [114, 11, 18, 7]];
      for (const [x, y, ww, hh] of steps) P(x, y, ww, hh, '#6a3a2a');
      for (let y = 14; y < 68; y += 4) P(96, y, 54, 1, 'rgba(30,14,10,.45)');
      P(108, 42, 6, 16, '#24120c'); P(122, 40, 6, 18, '#24120c'); P(136, 42, 6, 16, '#24120c'); P(109, 40, 4, 2, '#24120c'); P(123, 38, 4, 2, '#24120c'); P(137, 40, 4, 2, '#24120c');
      for (let i = 0; i < 6; i++) P(146, 62 - i * 7, 6, 1, '#1a1a1e');
      // 泥人
      const C = CL_;
      P(26, 40, 30, 28, C.b); P(50, 42, 6, 26, C.d); P(20, 42, 7, 22, C.b); P(55, 42, 7, 22, C.d);
      P(29, 14, 24, 26, C.b); P(48, 16, 5, 24, C.d); P(29, 14, 24, 3, C.l);
      SLOTS.forEach((k, i) => glyph(P, GL5, k, 31 + i * 7, 18, 1, '#ffb050'));
      P(33, 27, 5, 4, '#120804'); P(44, 27, 5, 4, '#120804'); P(35, 28, 1, 1, '#e89a40'); P(46, 28, 1, 1, '#e89a40');
      P(35, 35, 12, 1, '#2a180c'); P(41, 34, 3, 3, '#e8dcc0');
      P(0, 68, w, 22, '#14100c');
    },
    sprites: {
      golem: golemSpr,
      climb(g, e, t, R) {
        const P = W.ch.people.me;
        g.drawImage(personSprite(P, 3, (Math.floor(t * 2) % 2) ? 0 : 0), e.sx, e.sy - 8 - 13);
        R(2, -11, 2, 2, '#ecc6a2'); R(12, -12, 2, 2, '#ecc6a2');
      },
      stable(g, e, t, R) {
        R(0, 2, 32, 12, '#4a3420'); R(1, 14, 2, 2, '#2a1c10'); R(29, 14, 2, 2, '#2a1c10');
        R(-1, 0, 34, 11, '#ece6d6'); R(-1, 10, 34, 2, '#d0c8b4');
        for (const x of [3, 8]) { R(x, -2, 3, 1, '#b8903a'); R(x + 1, -9, 1, 7, '#c8a048'); R(x, -10, 3, 1, '#b8903a'); R(x + 1, -15, 1, 5, '#f0ead8'); }
        if (e.challah) {
          if (e.cover) { R(14, -1, 13, 7, '#2a3a6a'); R(15, 0, 11, 1, '#c8a048'); R(15, 4, 11, 1, '#c8a048'); R(19, 1, 3, 2, '#e8d8a0'); }
          else { R(14, 0, 12, 3, '#c88a40'); R(14, 3, 12, 3, '#b87a34'); }
        }
        if (e.cup) { R(28, -5, 3, 4, '#d0d0d8'); R(29, -1, 1, 2, '#a8a8b0'); R(28, 1, 3, 1, '#a8a8b0'); }
        else R(28, 0, 3, 2, '#7a7a80');
        if (!e.readn) { R(4, 4, 6, 4, '#f4ecd8'); R(5, 5, 4, 1, '#8a7a60'); }
      },
      wbarrel(g, e, t, R) {
        R(1, -4, 14, 20, '#5a3e26'); R(1, -4, 14, 2, '#3a2818'); R(1, 3, 14, 1, '#2a1c10'); R(1, 10, 14, 1, '#2a1c10'); R(2, -3, 12, 2, '#2a4a5a');
        if (e.over) { R(0, -3, 2, 9 + Math.round(Math.sin(t * 8) * 2), '#3d6476'); R(14, -3, 2, 11, '#3d6476'); R(2, -3, 12, 1, '#5a8a9a'); }
      },
      sidedoor(g, e, t, R) {
        R(2, -8, 12, 24, '#5a3e26'); for (let i = 0; i < 3; i++) R(4 + i * 4, -8, 1, 24, '#3e2a18'); R(1, 2, 14, 3, '#2a1c10');
        const c = e.crack || 0;
        if (c > 0) { R(6, -6, 1, 8, '#120a06'); R(7, 1, 1, 6, '#120a06'); }
        if (c > 1) { R(10, -4, 1, 10, '#120a06'); R(9, 5, 1, 5, '#120a06'); }
        if (c > 2) { R(3, 8, 6, 1, '#120a06'); R(8, 10, 5, 1, '#120a06'); }
      },
      rchest(g, e, t, R) {
        box(R, 1, 4, 14, 11, '#5a3420'); R(1, 1, 14, 4, '#6a4028'); R(1, 4, 14, 1, '#2a180c'); R(2, 6, 12, 1, '#7a5030');
        if (e.open) { R(2, -5, 12, 6, '#4a2a18'); R(3, -4, 10, 4, '#2a180c'); R(4, 1, 8, 3, '#e8dcc0'); }
        else { R(6, 6, 4, 5, '#c8a048'); R(7, 7, 1, 1, '#5a4010'); R(8, 8, 1, 1, '#5a4010'); R(7, 9, 1, 1, '#5a4010'); }
      },
      alefbet(g, e, t, R) { R(1, 1, 14, 12, '#5a4028'); R(2, 2, 12, 10, '#2e3a2e'); for (let r = 0; r < 4; r++) for (let c = 0; c < 5; c++) R(12 - c * 2, 3 + r * 2, 1, 1, '#e8e4d8'); R(3, 10, 4, 1, '#b8b0a0'); },
      hwin(g, e, t, R) { const sky = ['#d89a5a', '#c0704a', '#3a3456'][e.dusk || 0]; R(2, 2, 12, 11, '#3a2818'); R(3, 3, 10, 9, sky); R(8, 3, 1, 9, '#3a2818'); R(3, 7, 10, 1, '#3a2818'); if ((e.dusk || 0) < 2) R(4, 9, 3, 2, '#f0c070'); },
      mezuzah(g, e, t, R) { R(6, 1, 3, 9, '#b8903a'); R(6, 1, 3, 1, '#e0c060'); R(7, 4, 1, 2, '#6a5020'); },
      gable(g, e, t, R) {
        const B = '#6a3a2a', D = '#4a2418';
        R(-4, 2, 200, 30, '#1c1a20'); for (let x = -4; x < 196; x += 6) R(x, 4, 3, 26, '#24222a');   // 后面陡峭的屋顶
        const L = [[0, 78, 192, 34], [14, 64, 164, 14], [30, 50, 132, 14], [48, 37, 96, 13], [66, 25, 60, 12], [82, 14, 28, 11]];
        for (const [x, y, w, h] of L) { R(x, y, w, h, B); R(x, y, w, 2, '#8a5a40'); R(x - 2, y, 2, 3, '#8a5a40'); R(x + w, y, 2, 3, '#8a5a40'); for (let yy = y + 4; yy < y + h; yy += 4) R(x, yy, w, 1, D); }
        for (const x of [40, 89, 138]) { R(x, 80, 14, 28, '#2a140e'); R(x + 3, 76, 8, 4, '#2a140e'); R(x + 5, 74, 4, 2, '#2a140e'); }
        R(90, 40, 12, 12, '#2a140e'); R(92, 42, 8, 8, '#3a2a40');
        R(0, 108, 192, 4, '#3a2018');
      },
      shuldoor(g, e, t, R) {
        R(1, -10, 14, 26, '#4a4038'); R(3, -8, 10, 24, '#1e140c'); R(4, -6, 8, 22, '#3a2616'); R(7, -6, 2, 22, '#2a1a0e');
        R(3, -14, 10, 4, '#5a5048'); R(5, -16, 6, 2, '#5a5048'); R(7, -17, 2, 1, '#5a5048');
        for (let i = 0; i < 4; i++) R(4 + i * 2, -13 + (i % 2), 1, 1, '#5a7a4a');
        R(11, 6, 1, 2, '#c8a048');
      },
      rungs(g, e, t, R) {
        for (let y = 12; y > -64; y -= 8) { R(4, y, 8, 1, '#2a2a30'); R(4, y, 1, 3, '#1a1a20'); R(11, y, 1, 3, '#1a1a20'); R(5, y - 1, 6, 1, '#5a4a44'); }
        R(3, -80, 10, 14, '#2a1a10'); R(4, -79, 8, 12, '#3a2618'); R(10, -73, 1, 1, '#8a7040');
      },
      hearth(g, e, t, R) { R(0, -10, 16, 26, '#6a3a2a'); for (let y = -8; y < 16; y += 4) R(0, y, 16, 1, '#4a2418'); R(3, 2, 10, 10, '#1a0c08'); R(4, 3, 8, 2, '#3a1a10'); R(5, 9, 6, 3, '#e86a2a'); R(6, 10, 4, 1, '#ffb050'); R(4, 6, 8, 3, '#2a2a2e'); R(5, 5, 6, 1, '#3a3a40'); R(2, -14, 12, 4, '#5a3020'); },
      potshelf(g, e, t, R) { R(1, -12, 14, 28, '#4a3020'); R(2, -11, 12, 26, '#2a1c12'); for (const y of [-4, 5, 14]) R(1, y, 14, 2, '#5a3a24'); R(3, -9, 4, 5, '#9a5a36'); R(8, -8, 5, 4, '#b87a3a'); R(3, 0, 5, 5, '#c08a50'); R(9, 1, 4, 4, '#7a5a3a'); R(3, 10, 10, 4, e.cloth === false ? '#2a1c12' : '#e8e2d0'); },
      sefarim(g, e, t, R) { R(1, -14, 14, 30, '#3a2618'); R(2, -13, 12, 28, '#1e140c'); const C = ['#4a2a1a', '#3a2214', '#5a3a22', '#2e1e14', '#6a4428']; for (const y of [-12, -3, 6]) { for (let i = 0; i < 6; i++) { R(2 + i * 2, y, 2, 8, C[(i + y + 20) % 5]); R(2 + i * 2, y + 2, 2, 1, '#b8903a'); } R(1, y + 8, 14, 1, '#4a3020'); } },
      walllamp(g, e, t, R) { R(7, 3, 2, 3, '#2a2018'); R(5, 5, 6, 1, '#3a2a18'); R(5, 6, 6, 7, '#8a6a30'); R(6, 7, 4, 5, '#ffd870'); R(6, 13, 4, 1, '#3a2a18'); },
      matzevah(g, e, t, R) {
        const n = 2 + ((e.x * 7 + e.y * 3) % 2);
        for (let i = 0; i < n; i++) {
          const x = 1 + i * 6 - (i % 2), lean = ((hash(e.x, e.y, i) * 3) | 0) - 1, hg = 9 + ((hash(e.x, i, 2) * 6) | 0), c = hash(i, e.y, 5) < .5 ? '#8a8478' : '#6e6a60';
          R(x + lean, 14 - hg, 5, hg, c); R(x + lean + 1, 13 - hg, 3, 1, c); R(x + lean + 1, 16 - hg, 3, 1, '#4a463e'); R(x + lean + 1, 18 - hg, 2, 1, '#4a463e');
        }
      },
      ark(g, e, t, R) {
        R(2, -14, 28, 30, '#5a544a'); R(4, -18, 24, 4, '#6a645a'); R(8, -22, 16, 4, '#6a645a'); R(14, -25, 4, 3, '#6a645a');
        R(6, -10, 20, 24, '#5a1a1e'); R(6, -10, 20, 2, '#c8a048'); R(6, 12, 20, 2, '#c8a048'); R(15, -8, 2, 20, '#7a2a2a');
        R(10, -4, 4, 4, '#c8a048'); R(18, -4, 4, 4, '#c8a048');
        R(15, -30, 2, 6, '#3a3028'); R(13, -24, 6, 3, '#c8a048'); R(14, -23, 4, 1, '#ff6a3a');
      },
      bimah(g, e, t, R) {
        R(0, -4, 32, 36, '#4a4238'); R(1, -3, 30, 34, '#5e564a');
        for (let i = 0; i <= 8; i++) { R(i * 4, -14, 1, 20, '#1a1a1e'); R(i * 4 - 1, -16, 3, 2, '#1a1a1e'); }
        R(0, -6, 32, 1, '#1a1a1e'); R(0, 4, 32, 1, '#1a1a1e');
        R(10, 8, 12, 8, '#5a3a22'); R(10, 8, 12, 2, '#7a5a3a');
      },
      pillar(g, e, t, R) { R(4, -34, 8, 50, '#7a746a'); R(4, -34, 2, 50, '#8a847a'); R(10, -34, 2, 50, '#5a564e'); R(2, 12, 12, 4, '#6a645a'); R(2, -36, 12, 3, '#6a645a'); R(-4, -44, 4, 2, '#6a645a'); R(16, -44, 4, 2, '#6a645a'); R(0, -40, 3, 2, '#6a645a'); R(13, -40, 3, 2, '#6a645a'); },
      rseat(g, e, t, R) { R(2, -12, 12, 18, '#6a645a'); R(3, -11, 10, 16, '#5a544a'); R(1, 4, 14, 6, '#6a645a'); R(2, 10, 2, 6, '#4a463e'); R(12, 10, 2, 6, '#4a463e'); },
      gwin(g, e, t, R) { R(5, 0, 6, 14, '#3a362e'); R(6, 3, 4, 10, '#26324a'); R(7, 1, 2, 2, '#26324a'); R(7, 6, 1, 1, '#4a5a7a'); },
      amud(g, e, t, R) { R(5, 4, 6, 12, '#5a3a22'); R(2, 0, 12, 5, '#6a4a2a'); R(3, 1, 10, 2, '#e8dcc0'); },
      tzbox(g, e, t, R) { R(4, 4, 8, 9, '#5a4a30'); R(5, 5, 6, 1, '#1a1410'); R(5, 13, 6, 3, '#3a2a18'); },
      pages(g, e, t, R) {
        for (let i = 0; i < 5; i++) { const y = 12 - i * 3, x = ((hash(e.x, e.y, i) * 4) | 0); R(x + 1, y, 12, 3, i % 2 ? '#c8b890' : '#d8ccaa'); R(x + 2, y + 1, 9, 1, '#8a7a5a'); }
        R(4, -4, 8, 3, '#6a4a30'); R(5, -3, 6, 1, '#c8b890');
      },
      beam(g, e, t, R) { R(5, -30, 6, 46, '#3a2a1e'); R(5, -30, 2, 46, '#4a3626'); R(-8, -32, 32, 4, '#2e2218'); },
      claybody(g, e, t, R) {
        R(-2, 4, 34, 10, '#6a4e34'); R(0, 2, 30, 8, '#8a6a4a'); R(24, 1, 8, 9, '#8a6a4a'); R(25, 3, 2, 2, '#4a3422'); R(29, 3, 2, 2, '#4a3422');
        R(4, 9, 10, 3, '#7a5a3e'); R(16, 9, 8, 3, '#7a5a3e');
        if (e.cover) { R(4, 0, 18, 6, '#d8ccaa'); R(5, 1, 14, 1, '#8a7a5a'); R(6, 3, 12, 1, '#8a7a5a'); }
        if (e.stone) { R(13, 1, 4, 3, '#a8a49a'); R(14, 1, 2, 1, '#c8c4ba'); }
      },
      roundwin(g, e, t, R) { R(3, 2, 10, 10, '#2a2018'); R(4, 3, 8, 8, '#1e2440'); R(4, 8, 8, 3, '#141822'); R(6, 6, 4, 2, '#141822'); R(7, 5, 1, 1, '#141822'); R(6, 7, 1, 1, '#ffd870'); R(9, 7, 1, 1, '#ffd870'); }
    },
    tiles: {
      lowwall: { solid: true, paint(R, X, Y) { R(0, 0, 16, 16, '#2c3a26'); R(0, 6, 16, 10, '#6a645a'); R(0, 6, 16, 2, '#8a847a'); for (let i = 0; i < 3; i++) R((X * 5 + i * 6) % 16, 9 + (i % 2) * 3, 4, 1, '#4a463e'); if (hash(X, Y, 3) < .75) R(2 + ((hash(X, Y, 4) * 10) | 0), 4, 2, 2, '#9a9488'); if (hash(X, Y, 6) < .5) R(9 + ((hash(X, Y, 7) * 5) | 0), 5, 2, 1, '#aaa498'); } }
    },
    tick(S, dt) { },
    maps: {
      /* ---------------- 犹太城街巷 ---------------- */
      lanes: {
        amb: 'wind', dark: .45, plr: 3.4, wall: 'plain', floor: 'stone', floor2: 'dirt', legend: { 'Y': 'lowwall' },
        tileOpts: { grassC: '#24321f', treeC: '#1e2c1c' },
        rows: lanesRows(),
        ents: [
          { id: 'gable', x: 29, y: 2, w: 12, h: 7, spr: 'gable', decal: true, solid: false },
          { id: 'hdoor', x: 3, y: 5, spr: 'door', on: homeDoor },
          { id: 'hwin1', x: 6, y: 5, spr: 'window', lit: true, on: S => S.narr('拉比家的窗子。窗台上晾着一块洗干净的桌布。') },
          { id: 'hmez', x: 4, y: 5, spr: 'mezuzah', solid: true, on: S => S.narr('门框右边，钉着门柱圣卷的小铜盒。\n你每回进门，都照例用指尖碰一碰它。') },
          { id: 'nwin', x: 11, y: 5, spr: 'window', lit: true, light: { r: 1.8, col: 'rgba(255,200,120,.14)' }, async on(S) {
            if (S.f.stage !== 'walk') return S.narr('窗子里，安息日的两支蜡烛已经点上了。窗板关得严严实实。');
            const L = [['邻居大婶', ['雅各，面包取回来啦？快日落了。', '你们家拉比一早就去会堂了，说是要跟执事商量什么事。']], ['邻居大婶', ['那泥人刚才从这儿过，扛着两捆柴。……我到现在看着它，心里还是发毛。', '每个星期五太阳一落，拉比取下它嘴里的字条，它就像块石头一样，在你们家墙角一坐，一动不动，坐到安息日过完。']], ['邻居大婶', '快回去吧，别让拉比的面包凉了。']];
            const [w, t] = L[(S.f._nw = ((S.f._nw ?? -1) + 1) % L.length)]; await S.say(w, t);
          } },
          { id: 'cw1', x: 16, y: 5, spr: 'invisible', on: S => S.narr('矮墙那边是老墓园。墓碑挤得一块挨一块，有的歪着，有的叠着——地方不够，只能一层一层往上埋。\n墙头上，整整齐齐排着一溜小石子。') },
          { id: 'cw2', x: 21, y: 5, spr: 'invisible', on: S => S.narr('墓碑上刻的都是希伯来字。有的刻着一双手，那是祭司家族的；有的刻着一只水壶，那是利未人。\n接骨木的叶子落了一地。') },
          ...[[13, 2], [15, 2], [16, 3], [17, 2], [19, 3], [20, 2], [21, 4], [22, 2], [24, 3], [13, 4], [15, 4], [17, 4], [19, 2], [23, 4], [14, 3], [20, 4], [22, 3], [24, 2]].map(([x, y], i) => ({ id: 'mz' + i, x, y, spr: 'matzevah' })),
          { id: 'adoor1', x: 8, y: 10, spr: 'door', on: S => S.narr('门关着。门框右边钉着门柱圣卷的小盒子。\n屋里有人在摆安息日的桌子，碗碟叮当地响。') },
          { id: 'adoor2', x: 15, y: 10, spr: 'door', on: S => S.narr('门缝里飘出一股炖菜的香味——安息日的热菜，已经封进炉膛里焖着了。') },
          { id: 'adoor3', x: 21, y: 9, spr: 'window', lit: true, on: S => S.narr('小窗里，一个女人正低头点着两支蜡烛，然后用双手遮住了眼睛。') },
          { id: 'rdoor', x: 19, y: 7, spr: 'door', on: S => S.narr('莉芙卡家的门。门板上用粉笔画着一只歪歪扭扭的小鸟。') },
          { id: 'rivka', x: 19, y: 8, spr: '@rivka', dir: 0, on: rivkaTalk },
          { id: 'barrels', x: 10, y: 16, spr: 'barrel', on: S => S.narr('死胡同。几只空酒桶堆在墙根下，过不去。') },
          { id: 'sdoor', x: 32, y: 9, spr: 'shuldoor', on: shulDoor },
          { id: 'swin1', x: 30, y: 9, spr: 'gwin', on: S => S.narr('会堂的窗子又窄又高，像一道裂缝。里面透出一点烛光。') },
          { id: 'swin2', x: 39, y: 9, spr: 'gwin', on: S => S.narr('窄窗。会堂的墙很厚，比外面的街还低几级台阶。') },
          { id: 'slamp', x: 34, y: 9, spr: 'walllamp', light: { r: 2.8, col: 'rgba(255,200,110,.16)' }, on: S => S.narr('门边挂着一盏油灯。执事日落前就把它点上了。') },
          { id: 'rungs', x: 37, y: 9, spr: 'rungs', on: rungsUse },
          { id: 'well', x: 35, y: 14, spr: 'well', on: S => S.narr('广场上的井。今天下午，约瑟勒在这儿一趟一趟地打水，把半条街的水缸都灌满了。') },
          { id: 'cart', x: 28, y: 16, spr: 'cart', on: S => S.narr(S.f.stage === 'walk' ? '一辆卖菜的板车，车上的东西早收光了。日落前，谁也不做买卖了。' : '板车被砸散了架，轮子滚到了墙根底下。') },
          { id: 'golem', x: 3, y: 5, spr: 'golem', hidden: true, s: { wild: true }, on: S => S.toast(S.f.stage === 'chase' ? '别停下来——跑！' : S.f.climb ? '从梯子上按调查键伸手——等拉比叫它的时候' : '它太高了，够不着它的额头。得站高一点') }
        ],
        async enter(S, first) {
          if (!first) return;
          const f = S.f; f.stage = 'walk';
          S.give('challah', true);
          await S.narr('太阳已经斜到屋顶后面去了。\n犹太城的小巷挤挤挨挨，石板路上湿漉漉的——各家都在泼水扫地，准备过安息日。');
          await S.think('面包房的面包取回来了。得赶在日落前送回拉比家，摆上桌。\n墓园墙外那条直巷最近；拉比家院子底下还有一条弯弯绕绕的小巷，也通到这儿。');
          S.goal('把哈拉面包送回拉比家（街巷最西头）');
        },
        tick(S, dt) {
          const f = S.f, p = S.pl;
          if (f.stage === 'walk') { W._lc = (W._lc ?? 2) - dt; if (W._lc <= 0) { W._lc = 9; if (p.x >= 26) chant(S, .02); } return; }
          if (f.stage === 'chase') {
            const g = S.ent('golem');
            if (g.chase) momentum(S, g, CH);
            W._bc = (W._bc ?? 1.5) - dt;
            if (W._bc <= 0) { W._bc = 5; const d = Math.hypot(p.x - 32, p.y - 10); chant(S, clamp(.055 - d * .0015, .012, .055)); }   // 会堂的念诵：越近越响
            if (S.busy || W.ended) return;
            if (g.chase && !g.hidden && near(g, p)) { g.chase = null; return S.run(chaseHit); }
            if (p.x === 32 && p.y === 10) return S.run(reachShul);
            return;
          }
          if (f.stage === 'rungs') return rungsTick(S, dt);
        }
      },
      /* ---------------- 拉比家 ---------------- */
      house: {
        amb: 'room', dark: .5, plr: 3, wall: 'plain', floor: 'wood', tileOpts: { woodC: '#5a4030' },
        rows: HOUSE,
        ents: [
          { id: 'swin', x: 3, y: 1, spr: 'window', on: S => S.narr('书房的窗子朝着后院。一棵老梨树，叶子快掉光了。') },
          { id: 'alefbet', x: 5, y: 1, spr: 'alefbet', async on(S) { S.f.alef = true; if (S.once('alef')) await S.narr('墙上钉着一块字母板，是拉比给小孙子们念字母用的。'); await S.note('alefbet'); } },
          { id: 'shelf1', x: 1, y: 2, spr: 'sefarim', on: S => S.narr('满满一架手抄的书。有几本的书脊上，是拉比自己写的书名。') },
          { id: 'shelf2', x: 6, y: 2, spr: 'sefarim', on: S => S.narr('《塔木德》一册一册排着，书页边上密密麻麻全是批注。') },
          { id: 'desk', x: 3, y: 4, w: 2, spr: 'desk', on: S => S.narr('拉比的书桌。墨水还没干，一张写了一半的纸上，满是你看不懂的小字。\n笔搁在一边——他走得很急。') },
          { id: 'rchest', x: 2, y: 8, spr: 'rchest', on: chestUse },
          { id: 'hwin', x: 11, y: 1, spr: 'hwin', s: { dusk: 1 }, on: S => S.narr(S.f.stage === 'home' ? '窗外的天开始发黄了。离日落不远了。' : '天快黑了。对面窗子里，安息日的蜡烛一点一点亮了起来。') },
          { id: 'books', x: 8, y: 2, spr: 'sefarim', on: S => S.narr('祈祷书和《诗篇》。安息日用的那本，已经被拉比放在桌角上了。') },
          { id: 'table', x: 10, y: 4, w: 2, spr: 'stable', on: tableUse },
          { id: 'chair', x: 12, y: 4, spr: 'chair', dir: 1, on: S => S.narr('拉比的椅子。每个安息日的晚上，他坐在这里，举起祝福的杯子。') },
          { id: 'mezuzah', x: 11, y: 10, spr: 'mezuzah', on: S => S.narr('门框右边钉着门柱圣卷的小铜盒，里面卷着一张写有《申命记》经文的羊皮纸。\n「听啊，以色列……」你出门进门，都照例用指尖碰一碰它。') },
          { id: 'fdoor', x: 10, y: 10, spr: 'invisible', touch: exitHouse },
          { id: 'wbarrel', x: 17, y: 2, spr: 'wbarrel', on: S => S.narr(S.f.stage === 'home' ? '大水缸已经满了，水面晃来晃去。约瑟勒还在往里倒。' : '水从缸沿上哗哗地往外淌。') },
          { id: 'stove', x: 19, y: 2, spr: 'hearth', light: { r: 1.6, col: 'rgba(255,120,50,.14)', flick: true }, on: S => S.narr('炉膛里焖着安息日的热菜。火在日落前就封好了——安息日里不生火，也不添柴。') },
          { id: 'pots', x: 15, y: 2, spr: 'potshelf', async on(S) {
            const f = S.f;
            if (f.smashed) return S.narr('陶罐和铜锅碎了一地，泡在水里。');
            if (f.stage === 'home' && !f.cup && !S.has('cloth')) { S.give('cloth'); S.ent('pots').s.cloth = false; await S.narr('架子上摆着陶罐和铜锅，擦得锃亮。你从最上层抽了一块叠好的白布。'); if (f.rules) goalHome(S); return; }
            await S.narr('架子上摆着陶罐和铜锅，擦得锃亮。');
          } },
          { id: 'wood', x: 20, y: 8, spr: 'crate', on: S => S.narr('劈好的柴码得整整齐齐，是约瑟勒今天上午劈的。') },
          { id: 'hgolem', x: 17, y: 3, spr: 'golem', dir: 3, s: { pour: true }, on: hgolemUse },
          { id: 'kdoor', x: 14, y: 6, spr: 'sidedoor', hidden: true, async on(S) { S.f.saw = true; await S.narr('门板在你手底下一震一震的。\n从门缝里看出去：它就在门后。额头上那个字——אמת——湿漉漉地发亮。'); } }
        ],
        async enter(S, first) {
          if (!first) return;
          const f = S.f; f.stage = 'home';
          await S.narr('屋里静悄悄的。厨房那边传来哗、哗的水声——是约瑟勒在打水。');
          goalHome(S);
          S.cp('home');
        },
        tick(S, dt) {
          const f = S.f;
          if (f.stage === 'home') { W._wt = (W._wt ?? 1) - dt; if (W._wt <= 0) { W._wt = 3.2; pourSnd(S); } }
          if ((f.stage === 'flood' || f.stage === 'barred') && (f.fl || 0) < FLOOD.length) {
            W._ft = (W._ft ?? .7) - dt;
            if (W._ft <= 0) { W._ft = .7; for (const [x, y] of FLOOD[f.fl]) S.tile(x, y, 'o'); f.fl = (f.fl || 0) + 1; if (f.stage === 'flood') S.sfx('drip'); }
          }
          if (f.stage === 'barred' && !f.book && !S.busy) {
            W._pt = (W._pt ?? 3) - dt;
            if (W._pt <= 0) { W._pt = 4 + Math.random() * 2.5; pound(S); S.shake(260, 2); const d = S.ent('kdoor'); d.s.crack = Math.min(3, (d.s.crack || 0) + 1); }
          }
        }
      },
      /* ---------------- 老新会堂 ---------------- */
      shul: {
        amb: 'room', dark: .55, plr: 3, wall: 'stone', floor: 'stone',
        rows: SHUL,
        ents: [
          { id: 'ark', x: 9, y: 1, w: 2, spr: 'ark', light: { r: 2.4, col: 'rgba(255,120,60,.16)', flick: true }, on: S => S.narr('约柜。深红色的丝绒帘子后面，收着《托拉》经卷。\n帘子前面挂着一盏长明灯，日日夜夜都不熄。') },
          { id: 'rseat', x: 12, y: 2, spr: 'rseat', on: S => S.narr('拉比的位子，挨着约柜。石头的，靠背很高。') },
          { id: 'gw1', x: 4, y: 1, spr: 'gwin', on: S => S.narr('窗子又窄又高，像一道裂缝。外面的天已经是深蓝色了。') },
          { id: 'gw2', x: 15, y: 1, spr: 'gwin', on: S => S.narr('墙被几百年的烛烟熏得发黑。') },
          { id: 'cand1', x: 6, y: 2, spr: 'candles', light: { r: 3, col: 'rgba(255,190,100,.18)', flick: true }, on: S => S.narr('一排蜡烛，是执事日落前点上的。安息日里，谁也不去碰它们。') },
          { id: 'cand2', x: 14, y: 2, spr: 'candles', light: { r: 3, col: 'rgba(255,190,100,.18)', flick: true }, on: S => S.narr('烛光一晃一晃的，照着拱顶上的肋拱。') },
          { id: 'bimah', x: 9, y: 5, w: 2, h: 2, spr: 'bimah', on: S => S.narr('诵经台在大厅正中，四周围着一圈铁栅栏，栅栏顶上是尖尖的哥特式花纹。\n安息日早上，经卷就在这里展开诵读。') },
          { id: 'pil1', x: 7, y: 6, spr: 'pillar', on: S => S.narr('两根八角形的石柱，撑着头顶的拱顶。从柱头上伸出去的肋拱，每一格都是五条——\n据说是为了不让拱顶上出现十字的形状。') },
          { id: 'pil2', x: 12, y: 6, spr: 'pillar', on: S => S.narr('石柱冰凉。它已经在这里站了三百多年。') },
          { id: 'amud', x: 13, y: 10, spr: 'amud', async on(S) { await S.note('order'); } },
          { id: 'tzbox', x: 7, y: 10, spr: 'tzbox', on: S => S.narr('门边的施舍箱。日落以前，最后一个进门的人往里投了一枚硬币。\n安息日里，谁也不碰钱。') },
          { id: 'mendel', x: 11, y: 10, spr: '@mendel', dir: 1, async on(S) {
            const f = S.f, L = f.stage === 'shul' ? ['拉比在前面，约柜旁边。快去！', '会堂里别跑——跑着来是好事，进了门就得走。'] : ['大家都等着呢。……去吧，雅各。', '诗篇我替拉比留着。没有人会起头的。'];
            await S.say('门德尔', L[(f._md = ((f._md ?? -1) + 1) % L.length)]);
          } },
          { id: 'rabbi', x: 12, y: 3, spr: '@rabbi', dir: 0, on: rabbiTalk },
          ...[[3, 3, 'c1', 2], [3, 6, 'c2', 2], [3, 9, 'c3', 2], [16, 3, 'c4', 1], [16, 6, 'c1', 1], [16, 9, 'c2', 1], [5, 8, 'c4', 3], [14, 8, 'c3', 3]].map(([x, y, p, d], i) => ({ id: 'cg' + i, x, y, spr: '@' + p, dir: d, async on(S) {
            const L = S.f.sing ? ['他闭着眼睛，身子一前一后地轻轻摇着，嘴里念念有词。', '他朝你点了点头，没有停下念诵。', '一个老人看了看你湿透的裤脚，皱了皱眉。'] : ['大家都在等。没有人说话。', '「……出什么事了？」有人小声问。', '一个老人望着门口，手指在祈祷书上一下一下地敲。'];
            await S.narr(L[i % L.length]);
          } }))
        ],
        async enter(S, first) {
          if (!first) return;
          const f = S.f; f.stage = 'shul'; f.sing = true; W._ch = 6;
          S.norun(true);
          await S.narr('会堂里比外面低几级台阶，凉气扑在脸上。\n烛光一排一排的。男人们站在各自的位子前，低声念着迎接安息日的诗篇。');
          S.face('mendel', 'pl');
          await S.say('门德尔', ['雅各？跑着来会堂是好事，可你这脸色——出什么事了？', '……约瑟勒？', '拉比在前面，约柜旁边。快去——大家马上就要念安息日的诗篇了。']);
          S.goal('穿过会堂，去约柜旁边找拉比（会堂里只能走，不能跑）');
        },
        tick(S, dt) {
          const f = S.f, p = S.pl;
          if (f.sing) { W._ch = (W._ch ?? 6) - dt; if (W._ch <= 0) { W._ch = 6.5; chant(S, .045); } }
          if (S.busy || W.ended) return;
          if (p.y >= 12) {
            if (f.stage === 'shulgo') return S.run(goClimax);
            if (f.stage === 'shul') return S.run(async S => { await S.think('不能走——拉比还在里面。只有他的声音，约瑟勒才听得见。'); await S.walk('pl', 'u', 4); });
          }
        }
      },
      /* ---------------- 会堂阁楼 ---------------- */
      attic: {
        amb: 'wind', dark: .72, plr: 2.6, wall: 'wood', floor: 'darkwood',
        rows: ATTIC,
        ents: [
          { id: 'roundwin', x: 8, y: 1, spr: 'roundwin', light: { r: 2, col: 'rgba(120,140,200,.12)' }, on: S => S.narr('小圆窗外，是犹太城挤在一起的屋顶，再远一点是河。\n河那边的山上，城堡的窗子一扇一扇亮了起来。') },
          { id: 'pg1', x: 2, y: 2, spr: 'pages', on: pagesUse },
          { id: 'pg2', x: 3, y: 2, spr: 'pages', on: pagesUse },
          { id: 'pg3', x: 13, y: 2, spr: 'pages', on: pagesUse },
          { id: 'pg4', x: 12, y: 2, spr: 'pages', on: pagesUse },
          { id: 'pg5', x: 2, y: 6, spr: 'pages', on: pagesUse },
          { id: 'beam1', x: 4, y: 4, spr: 'beam', on: S => S.narr('黑黢黢的房梁，上面落满了灰。手一摸，一道白印子。') },
          { id: 'beam2', x: 12, y: 5, spr: 'beam', on: S => S.narr('房梁上刻着几个字母，刀痕很旧了。不知道是哪一辈人刻的。') },
          { id: 'clay', x: 6, y: 3, w: 2, spr: 'claybody', on: clayUse },
          { id: 'hatch', x: 7, y: 7, spr: 'invisible' }
        ],
        async enter(S, first) {
          if (!first) return;
          S.face('rabbi', 'pl');
          await S.narr('阁楼又低又黑，一股旧纸和灰尘的味道。\n你们把那堆泥放在一摞一摞的旧经页中间。');
          S.goal('把约瑟勒安放好，然后和拉比说话');
        }
      }
    }
  });
})();
