/* ================= 第十七夜 · 魔王 ================= */
(() => {
  /* ---------- 地图生成小工具 ---------- */
  const G = (w, h, c) => Array.from({ length: h }, () => Array(w).fill(c));
  const F = (g, x0, y0, x1, y1, c) => { for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) g[y][x] = c; };
  const ROWS = g => g.map(r => r.join(''));
  const woods = (g, x0, y0, x1, y1, s) => { for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) g[y][x] = hash(x, y, s) < .8 ? 'T' : 'P'; };

  /* 农舍：屋里（左上）+ 院子（右边、下边） 26×12 */
  const FARM = [
    'PPP###########PPPPPPPPPPPP',
    'PPP###########PPPPPPPPPPPP',
    'PPP#wwwwwwwww#PPP"""""""PP',
    'PPP#wwwwwwwww#P""""""""""P',
    'PPP#wwwwwwwww#P""""""""""P',
    'PPP#wwwwwwwww#P""ddddddddd',
    'PPP#wwwwwwwww#P""d""""""PP',
    'PPP#####w#####P""d""""""PP',
    'PPP#####w#####"""d""""""PP',
    'PPPP""""ddddddddd"""""""PP',
    'PPPP""""""""""""""""""""PP',
    'PPPPPPPPPPPPPPPPPPPPPPPPPP'];

  /* 赤杨林 46×30：西边进 → 第一个岔路口(10,15)：上=沼泽 / 东=山毛榉坡 / 下=沼泽 */
  function forestRows() {
    const g = G(46, 30, 'T');
    woods(g, 0, 0, 45, 29, 7);
    for (let y = 4; y <= 22; y++) for (let x = 16; x <= 45; x++) g[y][x] = hash(x, y, 9) < .72 ? 'Q' : 'T';
    for (let x = 1; x <= 10; x++) g[15][x] = 'd';
    g[14][3] = '"';
    // 上：雾里的沼泽
    for (let y = 7; y <= 14; y++) g[y][10] = 'd';
    F(g, 6, 2, 14, 6, 'u');
    // 下：鬼火的沼泽
    for (let y = 16; y <= 24; y++) g[y][10] = 'd';
    F(g, 6, 25, 14, 28, 'u');
    for (const [x0, y0, x1, y1] of [[6, 2, 14, 6], [6, 25, 14, 28]]) for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) { const h = hash(x, y, 31); if (x === 10) continue; g[y][x] = h < .22 ? 'e' : h < .36 ? 'o' : 'u'; }
    // 东：山毛榉坡（枯叶）
    for (let x = 11; x <= 18; x++) g[15][x] = 'd';
    for (let y = 10; y <= 15; y++) g[y][18] = 'v';
    for (let x = 18; x <= 31; x++) g[10][x] = 'v';
    F(g, 23, 9, 25, 9, 'v'); g[8][24] = 'v';
    for (let y = 10; y <= 17; y++) g[y][31] = 'v';
    for (let x = 31; x <= 45; x++) g[17][x] = 'v';
    return ROWS(g);
  }
  /* 萨勒河 64×22：西边进 → 第二个岔路口(8,9)：上=老渡口 / 东=河滩 / 下=石桥 → 河东大路 → 城门 */
  function riverRows() {
    const g = G(64, 22, 'T');
    woods(g, 0, 0, 63, 21, 12);
    for (let x = 1; x <= 8; x++) g[9][x] = 'd';
    for (let y = 3; y <= 8; y++) g[y][8] = 'd';
    for (let x = 8; x <= 13; x++) g[3][x] = 'd';
    F(g, 14, 1, 17, 5, 'M');
    for (let x = 9; x <= 13; x++) g[9][x] = 'd';
    F(g, 14, 7, 17, 11, 'u'); g[7][17] = 'e'; g[11][16] = 'e'; g[8][17] = 'o';
    for (let y = 10; y <= 16; y++) g[y][8] = 'd';
    for (let x = 8; x <= 17; x++) g[16][x] = 'd';
    F(g, 15, 15, 17, 17, 'd'); g[14][15] = '"'; g[18][15] = '"';
    for (let y = 0; y < 22; y++) for (let x = 18; x <= 20; x++) g[y][x] = '~';
    F(g, 18, 15, 20, 17, 'Z');
    F(g, 21, 15, 60, 17, 'd');
    for (let x = 21; x <= 60; x++) { g[14][x] = 'G'; g[18][x] = 'G'; }
    for (let y = 0; y < 22; y++) for (let x = 61; x <= 63; x++) g[y][x] = '#';
    return ROWS(g);
  }
  const TOWN = [
    '########################',
    '########################',
    'kkkkkkkkkkkkkkkkkkkkkkkk',
    'kkkkkkkkkkkkkkkkkkkkkkkk',
    'kkkkkkkkkkkkkkkkkkkkkkkk',
    'kkkkkkkkkkkkkkkkkkkkkkkk',
    'kkkkkkkkkkkkkkkkkkkkkkkk',
    'kkkkkkkkkkkkkkkkkkkkkkkk',
    'kkkkkkkkkkkkkkkkkkkkkkkk',
    '########################',
    '########################'];

  /* ---------- 常量与小工具 ---------- */
  const AWL = '卢卡斯醒着', AW_MAX = 60, KID_AT = 35;
  const DAU = ['d1', 'd2', 'd3'], DSPD = [6.8, 6.6, 6.4];
  const DIED = { sleep: 0, gallop: 0 };   // 本次游玩里死过几回（检查点会回滚 S.f，这里不会）
  const riding = S => S.pl.spr === 'ride';
  const settle = () => new Promise(r => { let n = 0; const c = () => (!W || !W.pl.mv || ++n > 90) ? r() : setTimeout(c, 16); c(); });
  const atFork = S => { const p = S.pl; return S.map === 'forest' && p.x === 10 && p.y === 15 ? 1 : S.map === 'river' && p.x === 8 && p.y === 9 ? 2 : 0; };
  function rideOn(S) { S.wear('ride'); S.speed(1.15); S.norun(false); }
  function startAwake(S) { S.timer(Math.max(S.f.awake ?? AW_MAX, 30), AWL, fellAsleep); }
  function saveAwake(S) { if (S.timerLeft != null) S.f.awake = Math.max(25, Math.round(S.timerLeft)); }

  /* ---------- 合成声音 ---------- */
  function erlSong(S, vol = .06) {   // 魔王的小调：甜、高、大调，像哄孩子
    const N = [[784, .32], [880, .32], [988, .5], [880, .32], [784, .32], [659, .7]]; let d = 0;
    for (const [f, l] of N) { S.tone('sine', f, f, l * .95, vol, d, 2200); S.tone('sine', f * 2, f * 2, l * .6, vol * .25, d, 3000); d += l; }
  }
  function lullaby(S, vol = .07) {   // 女儿们的摇篮曲（也是父亲差点哼出来的那支）
    const N = [[659, .45], [523, .45], [659, .45], [523, .45], [587, .3], [523, .3], [494, .3], [440, .9]]; let d = 0;
    for (const [f, l] of N) { S.tone('triangle', f, f, l * .9, vol, d, 1400); d += l; }
  }
  function hooves(S, run) {   // 三连音的马蹄（舒伯特那架钢琴的味道）
    const g = run ? .085 : .12, v = run ? .16 : .12;
    S.tone('triangle', 78, 48, .06, v, 0, 520); S.tone('triangle', 72, 46, .05, v * .75, g, 520); S.tone('triangle', 84, 50, .07, v * 1.1, g * 2, 520);
  }
  function grip(S) { S.tone('sawtooth', 61, 58, 1.6, .09, 0, 500); S.tone('sawtooth', 65, 63, 1.6, .08, 0, 500); S.tone('sine', 1760, 1700, 1.2, .03, .1, 4000); }
  function townBell(S, n) { for (let i = 0; i < n; i++) { S.tone('sine', 392, 390, 2.2, .1, i * 1.4, 1800); S.tone('sine', 784, 780, 1.4, .04, i * 1.4, 2400); S.tone('sine', 196, 196, 2.6, .05, i * 1.4, 900); } }

  /* ---------- 骑马的人与马（侧面朝左；朝右镜像） ---------- */
  const HC = { body: '#3b2a1e', dark: '#24180f', light: '#5a4230', mane: '#140e0a', hoof: '#0b0806' };
  function horseSide(R, fr, t, rider, kid) {
    const step = fr === 1 ? 1 : fr === 3 ? -1 : 0;
    const lg = (x, y, h) => { R(x, y, 2, h, HC.dark); R(x, y + h, 2, 1, HC.hoof); };
    if (step === 1) { lg(-1, 9, 5); lg(5, 9, 6); lg(12, 9, 6); lg(17, 9, 5); }
    else if (step === -1) { lg(2, 9, 6); lg(3, 9, 5); lg(14, 9, 5); lg(15, 9, 6); }
    else { lg(1, 9, 6); lg(4, 9, 6); lg(13, 9, 6); lg(16, 9, 6); }
    const sw = Math.round(Math.sin(t * 5) * (step ? 1 : .5));
    R(18, 1, 2, 3, HC.mane); R(19 + sw, 3, 2, 8, HC.mane);
    R(1, 0, 16, 1, HC.body); R(0, 1, 18, 7, HC.body); R(1, 8, 16, 1, HC.dark); R(3, 1, 10, 1, HC.light);
    R(-3, -4, 5, 6, HC.body); R(-2, -6, 4, 3, HC.body);
    R(-7, -7, 6, 4, HC.body); R(-8, -5, 3, 3, HC.dark); R(-3, -9, 2, 2, HC.body); R(-5, -6, 1, 1, '#000'); R(-8, -4, 1, 1, '#000');
    R(-1, -7, 2, 8, HC.mane); R(1, -3, 1, 4, HC.mane);
    R(6, -1, 8, 4, '#6a2a24'); R(6, 2, 8, 1, '#4a1a18');
    if (!rider) return;
    R(9, 1, 3, 5, '#2e2a26'); R(9, 6, 3, 4, '#1a1410'); R(8, 9, 4, 1, '#6a6a6a');
    R(7, -11, 7, 11, '#3e3a46'); R(12, -11, 2, 11, '#2c2834');
    R(8, -17, 5, 6, '#e2b890'); R(11, -17, 2, 4, '#3a2a1e'); R(8, -15, 1, 1, '#1a1214');
    R(6, -19, 9, 2, '#1a1614'); R(8, -21, 5, 2, '#1a1614');
    // 孩子：裹在斗篷里，搂在父亲胸前
    const droop = kid >= 1 ? 2 : 0;
    R(2, -10, 6, 8, '#7a6a4a'); R(3, -6, 4, 1, '#5e5038');
    R(2, -14 + droop, 4, 4, '#f2d6c0'); R(2, -15 + droop, 4, 2, '#d8b468'); R(2, -12 + droop, 1, 1, '#e0867a');
    if (kid >= 2) R(2, -13 + droop, 2, 1, '#b08070'); else R(2, -13 + droop, 1, 1, '#2a2020');
    R(4, -8, 5, 2, '#3e3a46'); R(3, -8, 1, 2, '#e2b890');
    // 马灯挂在鞍前
    R(5, 0, 1, 1, '#3a3020'); R(4, 1, 3, 3, '#e8c060'); R(4, 1, 3, 1, '#2a2010');
  }
  function rideSprite(R, dir, fr, t, kid) {
    if (dir === 1 || dir === 2) { const M = dir === 2 ? (x, y, w, h, c) => R(16 - x - w, y, w, h, c) : R; horseSide(M, fr, t, true, kid); return; }
    const step = fr === 1 ? 1 : fr === 3 ? -1 : 0;
    if (dir === 0) {
      R(5, 8, 2, 8 - (step === 1 ? 1 : 0), HC.dark); R(9, 8, 2, 8 - (step === -1 ? 1 : 0), HC.dark);
      R(4, 1, 8, 8, HC.body); R(2, -3, 2, 7, '#2e2a26'); R(12, -3, 2, 7, '#2e2a26'); R(2, 3, 2, 3, '#1a1410'); R(12, 3, 2, 3, '#1a1410');
      R(4, -13, 8, 10, '#3e3a46'); R(5, -19, 6, 6, '#e2b890'); R(6, -17, 1, 1, '#1a1214'); R(9, -17, 1, 1, '#1a1214');
      R(3, -21, 10, 2, '#1a1614'); R(5, -23, 6, 2, '#1a1614');
      const droop = kid >= 1 ? 1 : 0;
      R(5, -11, 6, 7, '#7a6a4a'); R(6, -14 + droop, 4, 4, '#f2d6c0'); R(6, -15 + droop, 4, 1, '#d8b468');
      if (kid >= 2) R(6, -12 + droop, 4, 1, '#b08070'); else { R(6, -12 + droop, 1, 1, '#2a2020'); R(9, -12 + droop, 1, 1, '#2a2020'); }
      R(6, -3, 4, 8, HC.body); R(6, 3, 4, 3, HC.dark); R(6, -5, 1, 2, HC.body); R(9, -5, 1, 2, HC.body); R(7, -2, 2, 4, '#d8ccb8'); R(6, -1, 1, 1, '#000'); R(9, -1, 1, 1, '#000');
      R(7, 5, 2, 2, '#e8c060');
    } else {
      R(4, 9, 2, 7 - (step === 1 ? 1 : 0), HC.dark); R(10, 9, 2, 7 - (step === -1 ? 1 : 0), HC.dark);
      R(3, 0, 10, 9, HC.body); R(4, 0, 8, 1, HC.light); R(7, 2, 2, 10, HC.mane);
      R(2, -3, 2, 7, '#2e2a26'); R(12, -3, 2, 7, '#2e2a26');
      R(4, -12, 8, 11, '#3e3a46'); R(5, -18, 6, 6, '#3a2a1e'); R(3, -20, 10, 2, '#1a1614'); R(5, -22, 6, 2, '#1a1614');
      R(3, -14, 3, 3, '#d8b468');
    }
  }

  /* ---------- 剧本：和孩子说话（犯困时头顶出现「!」） ---------- */
  const TALKS = [
    [['马丁', '卢卡斯，布劳恩今天吃了几把燕麦？'], ['卢卡斯', '……三把。我偷偷多给了它一把。别告诉婆婆。']],
    [['马丁', '数马蹄给爸爸听。'], ['卢卡斯', '一、二、三……一、二、三……\n爸爸，它跑起来，跟歌里一个样。']],
    [['马丁', '睁开眼睛，看着爸爸。'], ['卢卡斯', '……你的胡子上结霜了。白白的。像老头。']],
    [['马丁', '还记得去年集上那个糖人吗？'], ['卢卡斯', '是只公鸡。我先把鸡冠吃了……它就不神气了。']],
    [['马丁', '冷不冷？'], ['卢卡斯', '烫。……爸爸的手好凉，放在我脸上，再放一会儿。']],
    [['马丁', '给爸爸唱那首割麦子的歌。'], ['卢卡斯', '镰刀……镰刀磨得亮……\n（他哼了两句，跑了调，自己笑了一下。）']],
    [['马丁', '到了城里，爸爸给你买个新木马。'], ['卢卡斯', '要白的……不。不要白的。\n白的像那些姐姐。']]
  ];
  async function talkKid(S) {
    const f = S.f, n = atFork(S);
    if (n && f['f' + n + 'd']) {
      await S.say('马丁', '再说一遍，卢卡斯。每条路上，你都看见了什么？');
      await describe(S, n);
    } else if (!f.talked) {
      f.talked = true;
      const c = await S.ask('卢卡斯的头一点一点地往下沉，眼皮快粘在一起了。', ['问他问题，逗他说话', '给他哼支摇篮曲，让他舒服点']);
      if (c === 1) {
        lullaby(S, .06);
        await S.narr('你低声哼起了那支摇篮曲。「睡吧，睡吧，好孩子……」');
        await S.say('卢卡斯', '……爸爸，那边的姐姐们……也在唱这个……', { style: 'whisper' });
        S.timerAdd(-8); S.toast('卢卡斯更困了（-8 秒）');
        await S.think('——格蕾特婆婆说过：别让他睡着。摇篮曲是哄孩子睡觉的。');
        f.talked = false;
        return;
      }
      await S.say('马丁', '卢卡斯，别睡。跟爸爸说话——布劳恩是什么颜色的？');
      await S.say('卢卡斯', '……栗子色。鼻子上有一块白。');
    } else {
      const T = TALKS[(f.ti = ((f.ti ?? -1) + 1) % TALKS.length)];
      for (const [who, line] of T) await S.say(who, line);
      if (S.has('toy') && f.ti === 2) await S.say('卢卡斯', '木马在我怀里……它也怕。我抱着它。');
    }
    const left = S.timerLeft;
    if (left != null) { S.timerAdd(Math.max(0, Math.min(30, AW_MAX - left))); S.toast('卢卡斯醒过来一点了'); }
  }
  async function fellAsleep(S) {
    if (W.ended) return;
    DIED.sleep++;
    lullaby(S, .08);
    await S.narr('卢卡斯的头慢慢垂了下去，靠在你的胳膊弯里。\n你叫他。他不应。');
    await S.say('', '『……睡吧，睡吧……』', { style: 'whisper' });
    await S.die('雾里有好几个声音在轻轻地唱，唱的是摇篮曲。\n你低下头——斗篷里那张烧得通红的小脸，在笑。', '他睡着了');
  }

  /* ---------- 岔路口 ---------- */
  const FORK = {
    1: {
      x: 10, y: 15, ok: 'E',
      d: {
        N: '左边——往上那条路上，站着一个好高好高的人。\n戴着王冠，身后拖着长长的尾巴……他在雾里朝我招手。',
        E: '正前面那条路上，有人贴着我的耳朵说悄悄话……沙沙的，听不清。\n他说要跟我玩最好玩的游戏。',
        S: '右边——往下那条路上，有一盏黄黄的灯，一晃一晃的。\n有个人提着它，站在那儿等我。'
      },
      sum: '左（上）：戴王冠的人 ／ 前：悄悄话 ／ 右（下）：提灯的人'
    },
    2: {
      x: 8, y: 9, ok: 'S',
      d: {
        N: '左边——往上……好亮，像铺了一地金子。\n他说那是他妈妈的金衣裳，都给我穿。',
        E: '正前面，岸边开着好多花，紫紫的，一大片一大片……我想去摘。',
        S: '右边——往下……是魔王的女儿们。\n白白的、灰灰的，在那黑地方，一边跳舞一边看着我。'
      },
      sum: '左（上）：金衣裳 ／ 前：岸边的花 ／ 右（下）：魔王的女儿们'
    }
  };
  async function describe(S, n) {
    const D = FORK[n].d;
    await S.say('卢卡斯', [D.N, D.E, D.S]);
    S.toast(FORK[n].sum);
    S.goal('岔路口：选一条路（J 翻笺对照路条和歌；站在路口按调查键再问卢卡斯）　双人：一人翻笺，一人骑马');
  }
  async function forkArrive(S, n) {
    const f = S.f, P = FORK[n];
    await settle(); S.pos(P.x, P.y, 2);
    if (n === 1) {
      await S.narr('路在这里分成了三股。\n雾浓得化不开，马灯照出去两步，就被吞掉了。');
      await S.say('卢卡斯', '爸爸，你没看见魔王吗？\n戴着王冠、拖着长尾巴的那个……');
      const c = await S.ask('卢卡斯死死揪住你的衣襟。', ['「孩子，那是一缕雾。」', '「爸爸看不见。你告诉我，他在哪儿？」']);
      if (c === 0) { f.deny = (f.deny || 0) + 1; await S.say('卢卡斯', '……嗯。'); await S.narr('他把脸埋进斗篷，不说话了。\n过了好一会儿，才用很小很小的声音，一条路一条路地说给你听。'); }
      else await S.say('卢卡斯', '你看不见……可是我看得见。爸爸，我告诉你。');
    } else {
      erlSong(S, .05);
      await S.say('', '『好孩子，你肯跟我走吗？\n我的女儿们会好好服侍你。\n她们夜里领着轮舞，摇着你、跳着、唱着，哄你睡。』', { style: 'whisper' });
      await S.think('……那是卢卡斯的嘴在动。可那不是他的声音。');
      await S.say('卢卡斯', '爸爸，爸爸，你没看见吗？\n魔王的女儿们，就在那黑地方！');
      const c = await S.ask('河上的风，一阵比一阵冷。', ['「孩子，我看得清清楚楚：那是几棵老柳树，灰扑扑的。」', '「我看不见。她们在哪边？爸爸听你的。」']);
      if (c === 0) { f.deny = (f.deny || 0) + 1; await S.say('卢卡斯', '……'); await S.narr('他不说话了，可是小手一直从斗篷里伸出来，一条路一条路地指给你看。'); }
      else await S.say('卢卡斯', '我告诉你。你别放开我。');
    }
    await describe(S, n);
    f['f' + n + 'd'] = true;
  }
  const WRONG = {
    '1N': async S => {
      S.dark(.97); S.sfx('whisper'); erlSong(S, .07);
      await S.narr('你拨转马头，往左边那条路走了十几步。\n雾一下子浓得像牛奶，马灯只剩下一团黄晕。');
      await S.narr('布劳恩的蹄子「噗嗤」一声，陷进了烂泥里。是沼泽。');
      await S.say('', '『好孩子，来呀，跟我走！\n我陪你玩最好玩的游戏。』', { style: 'whisper' });
      await S.think('……卢卡斯在说话。用一种不是他的声音。');
    },
    '1S': async S => {
      S.dark(.95);
      await S.narr('右边的雾里，果然亮着一点黄光，一晃，一晃。\n你一夹马肚子追过去——它不远不近，总在前面三步。');
      if (S.once('wispface')) await S.scare('face', { face: 'daughter', sfx: 'giggle', dur: .8 });
      await S.narr('灯灭了。\n布劳恩的前蹄一脚踩空，冰凉的泥水一直漫进你的靴筒。');
      lullaby(S, .05);
      await S.say('卢卡斯', '……姐姐的灯灭了。她说下回再来接我。', { style: 'whisper' });
    },
    '2N': async S => {
      S.dark(.9); S.sfx('water');
      await S.narr('左边的路一直通到水边。月亮从云缝里漏下来，河面铺了一层碎金子。');
      await S.say('', '『我母亲有好多金线织的衣裳……\n都给你，都给你穿。』', { style: 'whisper' });
      S.sfx('splash');
      await S.narr('布劳恩刚踩进去一步，水就没到了它的胸口。\n它尖叫着往后退，差点把你们俩掀进河里。');
    },
    '2E': async S => {
      S.dark(.92);
      await S.narr('岸边果然开着一大片淡紫色的花。\n十一月的夜里还开着的花——秋水仙。');
      await S.say('', '『岸边开着那么多花，花花绿绿的……\n来呀，摘一朵。』', { style: 'whisper' });
      await S.narr('马蹄一踩下去，就拔不出来了。\n烂泥咕嘟咕嘟地往上冒泡，像底下有什么在喘气。');
    }
  };
  const HINT = {
    1: [
      '……又回到了这里。卢卡斯说的那三样东西，到底是什么？',
      '格蕾特婆婆的路条上写着：林子里走高处、走干的地方。\n卢卡斯看见的东西，在我眼里，会是什么样子？',
      '那首歌。歌里的父亲每一回都告诉了孩子那是什么——雾、风、柳树。\n拿歌对一对婆婆的路条。（按 J 翻笺）',
      '「戴王冠的人」是雾，雾浓的地方是沼泽；「提灯的人」是鬼火，也在沼泽里。\n「悄悄话」是风吹枯叶——枯叶在山毛榉坡上。往正前面走。'
    ],
    2: [
      '……又回到了这里。这一回，他说的是什么？',
      '婆婆说过：过河只走石桥。……桥头有什么？',
      '歌里的父亲说：「那是几棵老柳树，灰扑扑的。」\n婆婆的路条上，柳树长在哪儿？（按 J 翻笺）',
      '「金衣裳」是月光底下的深水，「岸边的花」是秋水仙的烂泥滩。\n「魔王的女儿们」是老柳树——桥头那两棵。往右边（往下）走。'
    ]
  };
  async function wrongTurn(S, n, dir) {
    const f = S.f, P = FORK[n], k = f['w' + n] = (f['w' + n] || 0) + 1;
    await settle();
    await WRONG[n + dir](S);
    const left = S.timerLeft;
    if (left != null) { const cut = Math.min(15, Math.max(0, left - 8)); S.timerAdd(-cut); if (cut > 0) S.toast('卢卡斯更困了（-' + Math.round(cut) + ' 秒）'); }
    await S.fade(1, 450); S.pos(P.x, P.y, 2); S.dark(null); await S.fade(0, 450);
    await S.narr('等你把布劳恩拽出来，雾又合拢了。\n你又站在了那个岔路口。');
    await S.think(HINT[n][Math.min(k, 4) - 1]);
  }
  async function rightF1(S) {
    const f = S.f; f.stage = 'slope';
    await settle();
    S.sfx('step');
    await S.narr('马蹄底下「沙沙」地响起来。是枯叶。\n路往上走了——你们在爬坡。雾薄了一点，两边是灰白的山毛榉，树皮光得像骨头。');
    S.goal('顺着枯叶，翻过山毛榉坡，下到河边');
    saveAwake(S); S.cp('slope');
  }
  async function belief2(S) {
    const f = S.f; f.b2 = true;
    await settle();
    S.sfx('whisper');
    await S.say('卢卡斯', '爸爸，爸爸，你没听见吗？\n魔王在小声地答应我东西……');
    const c = await S.ask('风从坡顶上刮下来，满地的枯叶都在响。', ['「别怕，安静点。那是风吹枯叶，沙沙的。」', '「他答应你什么？说给爸爸听。」']);
    if (c === 0) {
      f.deny = (f.deny || 0) + 1;
      await S.say('卢卡斯', '……嗯。');
      await S.narr('卢卡斯不说话了。\n枯叶在马蹄底下沙沙地响，响了一路，像有人一直跟在后面小声说话。');
    } else {
      f.lure = true;
      await S.say('卢卡斯', ['他说，河岸边开着好多花，花花绿绿的，都给我摘。', '他说他妈妈有好多金子做的衣裳，都给我穿。']);
      await S.say('马丁', '那些咱们都不要。花，爸爸明年春天给你种；衣裳，让你奶奶给你缝。');
      await S.say('卢卡斯', '……嗯。爸爸，你攥着我的手。');
    }
  }
  async function bridge(S) {
    const f = S.f; f.stage = 'bridge';
    await settle(); S.pos(14, 16, 2);
    await S.narr('马蹄声变了——脚下是石头。\n石桥。桥头两棵老柳树，枝条一直垂到地上，在风里一荡，一荡。');
    S.clearTimer();
    await S.walk('pl', [21, 16], 5);
    lullaby(S, .07);
    for (const id of DAU) { const e = S.ent(id); e.alpha = 0; e.hidden = false; }
    S.sfx('giggle');
    await Promise.all(DAU.map(id => S.alpha(id, .78, 700)));
    S.face('pl', 1);
    await S.say('卢卡斯', '爸爸！她们出来了！她们从树里走出来了！', { style: 'big' });
    await S.narr('你回过头——柳枝底下，有几团灰白的影子，慢慢地直起了身子。\n……是雾吗？是柳树吗？');
    await S.narr('卢卡斯吓得一下子醒透了，两只小手死死揪住你的衣襟。');
    S.face('pl', 2);
    S.goal('一路往东，骑到城门！（按住奔跑键催马；路上的雾团就是魔王——换一条道躲开）');
    f.stage = 'gallop'; f.hits = 0; f.nb1 = f.nb2 = false;
    S.cp('gallop');
    startChase(S, 1.0);
  }
  function startChase(S, wait) {
    DAU.forEach((id, i) => {
      S.chase(id, { spd: DSPD[i], always: true, zone: (x, y) => x >= 13, catch: caught });
      S.ent(id).chase.wait = wait + i * .15;
    });
  }
  function stopChase(S) { for (const id of DAU) S.stop(id); }
  async function caught(S) {
    DIED.gallop++; stopChase(S); S.focus(null);
    await S.scare('face', { face: 'daughter', sfx: 'scream', dur: .9 });
    await S.die('白影子从两边合拢过来。\n冰凉的手指头，一根一根地，掰你搂着孩子的胳膊……', '她们追上来了');
  }
  async function hitFog(S, e) {
    const f = S.f; f.hits = (f.hits || 0) + 1;
    S.alpha(e.id, 0, 400);
    if (f.hits >= 2) {
      DIED.gallop++; stopChase(S); S.focus(null);
      grip(S);
      await S.scare('face', { face: 'erl', sfx: 'scream', dur: 1 });
      await S.die('你又一头撞进了那团雾里。\n雾里伸出一只手，慢慢地，把卢卡斯从你怀里抱了过去。', '魔王动手了');
      return;
    }
    S.sfx('scream'); S.shake(600, 4); grip(S);
    S.toast('布劳恩一声长嘶，人立起来！——再撞上一回，他就要动手了');
    await S.wait(900);
  }
  async function grab(S) {
    const f = S.f; f.grabbed = true;
    for (const id of DAU) { const e = S.ent(id); if (e.chase) e.chase.wait = 999; }
    await settle();
    S.dark(.95); grip(S);
    await S.say('', '『我爱你，你这漂亮的模样叫我动心。\n你要是不肯——我就要动手了。』', { style: 'whisper' });
    await S.say('卢卡斯', '爸爸，爸爸，他抓住我了！\n魔王把我弄疼了！', { style: 'big' });
    const k = S.ent('erlp'); S.place('erlp', S.pl.x - 1, S.pl.y, 2); k.alpha = 0; await S.alpha('erlp', .7, 300);
    await S.scare('face', { face: 'erl', sfx: 'scream', dur: 1 });
    if ((f.deny || 0) < 2) await S.think('你看见了。\n就那么一下——一个很高的人，戴着王冠，一只雾做的手搭在卢卡斯的肩膀上。');
    else await S.think('你什么也没看见。\n只有一团雾，贴着马屁股，怎么也甩不掉。');
    await S.say('卢卡斯', '好疼……爸爸，你松一松……\n你也拽我，他也拽我，好疼！');
    const c = await S.ask('他在你怀里拼命地挣，烫得像一块炭。', ['抱紧他，一下也不松', '松开一点，别弄疼他']);
    if (c === 1) return letGo(S);
    await S.narr('你把他按在胸口，按得死死的，按得他哭出了声。\n哭吧。哭出声来就好。哭出声来，就是醒着的。');
    await S.alpha('erlp', 0, 500);
    S.dark(null);
    await S.narr('父亲心里发寒，催马飞奔——\n城墙的黑影子，就在前面了。');
    for (const id of DAU) { const e = S.ent(id); if (e.chase) e.chase.wait = .3; }
  }
  async function letGo(S) {
    stopChase(S); S.focus(null);
    await S.narr('你的手松了一松。\n只松了一下。');
    await S.narr('臂弯里，一下子轻了。');
    S.hide('erlp'); for (const id of DAU) S.hide(id);
    lullaby(S, .06);
    await S.end({ bad: true, id: 'letgo', title: '松开的手', text: '斗篷还在你怀里，热乎乎的。里面是空的。\n雾里有很多人在笑，笑声越来越远，像一场散了的轮舞。\n\n格蕾特婆婆说过三件事。第三件是：不管他怎么哭、怎么喊疼，手别松。\n\n歌里那位父亲，什么都没看见，可他一直到最后，都抱着他的孩子。' });
  }
  async function atGate(S) {
    const f = S.f; f.stage = 'gate';
    stopChase(S); S.focus(null);
    await settle();
    await S.narr('城墙！\n你勒住马回头看——白影子们停在了最后一棵柳树底下，不再往前了。');
    await Promise.all(DAU.map(id => S.alpha(id, 0, 900)));
    S.sfx('knock'); await S.wait(300); S.sfx('knock'); await S.wait(300); S.sfx('knock');
    await S.say('马丁', '开门！开门！孩子病了，要找韦伯医生！');
    await S.say('守夜人', '……这都几点了！等着！');
    S.sfx('open');
    await S.go('town', 1, 5, 2);
  }
  async function finale(S) {
    const f = S.f;
    if (f.doneDoor) return;
    await S.narr('你抱着卢卡斯，一步一步走上台阶，拉响了门铃。');
    S.sfx('bell'); await S.wait(500); S.sfx('bell'); await S.wait(500); S.sfx('bell');
    await S.narr('门里面没有动静。\n你又拉了三下。楼上有一扇窗，亮起了一点烛光。');
    await S.say('卢卡斯', '爸爸……', { style: 'whisper' });
    await S.say('卢卡斯', '你看见他了吗？\n魔王。你看见他了吗？', { style: 'whisper' });
    const c = await S.ask('他的声音很轻很轻，轻得像一片叶子落在斗篷上。', ['「没有什么魔王，孩子。那是雾。」', '「……看见了。」']);
    f.doneDoor = true;
    if (c === 0 && (f.deny || 0) >= 2) return poemEnd(S);
    return goodEnd(S, c === 0);
  }
  async function poemEnd(S) {
    await S.narr('卢卡斯没有再说话。');
    S.sfx('open');
    await S.narr('门开了。韦伯医生举着蜡烛，看了看你，又看了看你怀里。\n他伸出手，在孩子的额头上放了很久，很久。');
    await S.end({ bad: true, id: 'poem', title: '照着歌里的样子', text: '父亲心里发寒，催马飞奔，\n臂弯里抱着呻吟的孩子；\n好不容易赶到了院门——\n他怀里的孩子，已经死了。\n\n一路上你说的都没有错：那是雾，那是风，那是柳树。\n你只是一次也没有问他：在哪儿？\n\n（格蕾特婆婆说：他说看见什么，你别跟他说「没有」。）' });
  }
  async function goodEnd(S, fib) {
    const f = S.f;
    if (fib) await S.say('卢卡斯', '……你骗人。你刚才明明看见了。', { style: 'whisper' });
    else await S.say('卢卡斯', '……我就知道。', { style: 'whisper' });
    S.sfx('open');
    S.ent('ddoor').open = true; S.place('doc', 16, 1, 0);
    await S.say('韦伯医生', '快，快进来！把他放到炉子边上——拿凉水来！');
    await S.card('天快亮的时候', '', '韦伯医生用凉水和柳树皮粉守了一夜。\n天快亮的时候，卢卡斯出了一身大汗，烧退了。\n\n他睁开眼睛，第一句话是：「爸爸，你看见魔王了吗？」\n你说：「看见了。是你指给我看的。」');
    const extra = [];
    if (S.has('toy')) extra.push('他怀里还抱着那只小木马。木马的一只耳朵，被他啃秃了。');
    if (!(f.deny || 0)) extra.push('很多年以后，卢卡斯跟人讲起这一夜，总要说：我爸爸是看得见魔王的。');
    await S.end({ id: 'saved', title: '天亮了', text: '歌里那位父亲，一路上说的都对：那是雾，那是风，那是柳树。\n这一夜，你也知道那是雾。\n你只是多问了一句：它在哪儿？\n\n' + (extra.length ? extra.join('\n') + '\n\n' : '') + '——孩子活着到了城里。这是歌里没有的那一节。' });
  }

  /* ---------- 农舍：格蕾特婆婆 ---------- */
  function prepGoal(S) {
    const f = S.f;
    if (!f.rules) return S.goal('和格蕾特婆婆说话');
    if (!f.carry) { const need = []; if (!S.has('lantern')) need.push('墙上的马灯'); if (!S.has('cloak')) need.push('箱子里的斗篷'); return S.goal(need.length ? '收拾上路：拿上' + need.join('和') + '，再抱起卢卡斯' : '用斗篷裹上卢卡斯，把他抱起来'); }
    if (!S.has('lantern')) return S.goal('别忘了墙上的马灯，然后去院子里骑上布劳恩');
    if (!riding(S)) S.goal('去院子里，骑上布劳恩');
  }
  async function greteTalk(S) {
    const f = S.f;
    S.face('grete', 'pl');
    if (!f.rules) {
      await S.say('格蕾特', ['烧了两天两夜了。柳树皮熬的水灌下去三碗，一点没退。', '得去城里找韦伯医生。现在就走——等到天亮，就来不及了。']);
      await S.say('马丁', '林子里雾这么大……');
      await S.say('格蕾特', ['路我找人给你写下来了。你认字，照着走。', '还有三件事，你给我记住。']);
      await S.say('格蕾特', ['第一，别让他睡着。烧糊涂的孩子在赤杨林里睡过去，就叫不回来了。', '第二，他说看见什么，你别跟他说「没有」。你说没有，他就自己一个人去看了。', '第三——不管他怎么哭、怎么闹、怎么喊疼，手别松。']);
      f.rules = true;
      await S.note('route');
      prepGoal(S);
      return;
    }
    const L = [
      '别让他睡着。别跟他说「没有」。手别松。……三件事，记住了？',
      '马灯挂在墙上，斗篷在箱子里。快去。',
      '那首歌？哼，魏玛来的城里人写的。我们这儿的老人管那东西叫精灵王，不叫什么赤杨王。',
      '路条上写着呢：雾浓的地方是沼泽，跟着枯叶走，过河只走石桥。',
      '他要是说看见了什么，你就问他在哪儿。孩子的眼睛，有时候比大人的亮。'
    ];
    await S.say('格蕾特', L[(f._gl = ((f._gl ?? -1) + 1) % L.length)]);
  }
  async function lukaBed(S) {
    const f = S.f, e = S.ent('luka');
    if (f.carry) return S.narr('床上还留着一个小小的凹印，枕头是湿的。');
    if (!f.rules) { await S.say('卢卡斯', '……爸爸……那首歌……再念一遍……', { style: 'whisper' }); return S.narr('他烧得满脸通红，眼睛半睁着，不知道在看哪儿。\n格蕾特婆婆在一旁直叹气。'); }
    if (!S.has('cloak')) return S.narr('外面冷得能冻掉耳朵。\n得先找件厚斗篷，把他裹严实了。');
    S.take('cloak'); f.carry = true; e.s.empty = true; S.wear('@meK');
    await S.narr('你用斗篷把卢卡斯裹起来，连头一起，只露出一张烧得通红的小脸。\n他轻得像一捆干柴。');
    await S.say('卢卡斯', '爸爸……我们去哪儿？');
    await S.say('马丁', '去城里。找医生。');
    await S.say('卢卡斯', '……路上有魔王吗？');
    await S.think('……');
    await S.say('格蕾特', '去吧。记住我说的三件事。');
    prepGoal(S);
  }
  async function horseOn(S) {
    const f = S.f;
    if (riding(S)) return;
    if (!f.carry) return S.narr('布劳恩打了个响鼻，蹄子刨着地，好像知道今夜要出门。\n……先去把卢卡斯抱出来。');
    if (!S.has('lantern')) return S.narr('没有灯，林子里一步也走不了。\n马灯挂在屋里的墙上。');
    await S.fade(1, 400);
    S.hide('horse'); S.pos(19, 4, 2); rideOn(S);
    const d = S.ent('hdoor'); d.open = false; d.solid = true;
    await S.fade(0, 400);
    S.sfx('open');
    await S.narr('你把卢卡斯搂在胸前，用斗篷的下摆把他和你捆在一起，翻身上马。\n布劳恩喷出一团白气。');
    S.goal('骑马出村，往东进赤杨林（按住奔跑键可以催马）');
  }

  defChapter({
    id: 'erlkonig', n: 17, title: '魔王', sub: '「爸爸，你没看见魔王吗？」夜里，父亲抱着发烧的孩子骑马穿过赤杨林。孩子看得见的，你看不见。', origin: '歌德叙事诗（1782）', color: '#2a3442',
    amb: 'wind', floor: 'dirt', wall: 'wood', dark: .82, plr: 2.6, darkC: '#03050a',
    endings: { saved: '天亮了', poem: '照着歌里的样子', letgo: '松开的手' },
    faces: {
      erl(R, a, t) {
        const fog = '#6e7a74', fog2 = '#8a968f';
        for (let i = 0; i < 6; i++) { const x = 3 + i * 1 + (i > 2 ? 18 : 0); R(x + Math.sin(t * 2 + i) * .8, 8, 2, 24, i % 2 ? fog : fog2); }
        R(9, 22, 14, 10, fog2); for (let i = 0; i < 5; i++) R(9 + i * 3, 26 + (i % 2) * 2, 2, 6, fog);
        R(9, 7, 14, 17, '#c6cec6'); R(10, 6, 12, 1, '#c6cec6'); R(9, 15, 2, 6, '#98a29a'); R(21, 15, 2, 6, '#98a29a'); R(14, 13, 4, 7, '#d4dcd4');
        R(8, 3, 16, 3, '#2e2618'); R(8, 0, 2, 4, '#2e2618'); R(12, 1, 2, 3, '#2e2618'); R(15, -1, 2, 5, '#2e2618'); R(18, 1, 2, 3, '#2e2618'); R(22, 0, 2, 4, '#2e2618');
        R(10, 1, 1, 2, '#6a2a1a'); R(17, 0, 1, 2, '#6a2a1a'); R(21, 2, 1, 1, '#6a2a1a');
        R(11, 11, 4, 5, '#070907'); R(18, 11, 4, 5, '#070907'); R(12, 12, 1, 1, '#e8f0d8'); R(19, 12, 1, 1, '#e8f0d8');
        R(12, 20, 8, 1, '#3a2a2a'); if (a > .2) R(13, 21, 6, Math.min(5, 1 + a * 6), '#0a0606');
        for (let i = 0; i < 4; i++) R(0, 6 + i * 7 + Math.sin(t * 3 + i) * 2, 32, 1, 'rgba(200,210,214,.25)');
      },
      daughter(R, a, t) {
        const hair = '#d8e2dc';
        R(6, 2, 20, 30, hair); R(4, 10, 3, 22, hair); R(25, 10, 3, 22, hair);
        R(10, 7, 12, 16, '#eef4f0'); R(11, 6, 10, 2, hair);
        R(12, 12, 3, 4, '#0a1010'); R(18, 12, 3, 4, '#0a1010');
        const o = a > .3 ? 4 : 2; R(14, 18, 4, o, '#1a0a10');
        R(6, 3, 3, 2, '#7a8a6a'); R(23, 4, 3, 2, '#7a8a6a'); R(8, 1, 2, 3, '#6a7a5a'); R(21, 1, 2, 3, '#6a7a5a');
        R(10, 23, 12, 9, '#e4ece8');
      }
    },
    people: {
      me: { key: 'erl-me', skin: '#e2b890', hair: '#3a2a1e', hs: 'short', top: '#3e3a46', top2: '#d8d0c0', bottom: '#4a3a2a', coat: true, shoes: '#1a1410',
        extra(g, d, fr, G, R) { R(2, G.hT - 1, 12, 2, '#1a1614'); R(4, G.hT - 3, 8, 2, '#1a1614'); } },
      meK: { key: 'erl-meK', skin: '#e2b890', hair: '#3a2a1e', hs: 'short', top: '#3e3a46', top2: '#d8d0c0', bottom: '#4a3a2a', coat: true, shoes: '#1a1410',
        extra(g, d, fr, G, R) {
          R(2, G.hT - 1, 12, 2, '#1a1614'); R(4, G.hT - 3, 8, 2, '#1a1614');
          if (d === 0) { R(4, G.tT + 1, 8, 6, '#7a6a4a'); R(5, G.tT - 2, 5, 4, '#f2d6c0'); R(5, G.tT - 3, 5, 2, '#d8b468'); R(6, G.tT, 1, 1, '#2a2020'); }
          else if (d === 3) { R(9, G.hT + 5, 4, 3, '#d8b468'); R(10, G.tT, 4, 5, '#7a6a4a'); }
          else { R(2, G.tT + 1, 6, 6, '#7a6a4a'); R(2, G.tT - 2, 4, 4, '#f2d6c0'); R(2, G.tT - 3, 4, 2, '#d8b468'); }
        } },
      grete: { skin: '#e0b898', hair: '#d8d4cc', hs: 'bun', top: '#3a3a3a', top2: '#cfc8b4', bottom: '#5a2a22', skirt: true, apron: '#cfc8b4', shoes: '#1a1210', hat: 'scarf', hatC: '#4a4a5a' },
      doc: { skin: '#ecc8a8', hair: '#e8e4dc', hs: 'queue', top: '#1e1e26', top2: '#e8e4dc', bottom: '#1e1e26', coat: true, shoes: '#0e0e10' },
      watch: { skin: '#d8b090', hair: '#4a3a2a', top: '#5a4a2a', top2: '#3a3020', bottom: '#3a3226', coat: true, hat: 'cap', hatC: '#2a2a2a' },
      daughter: { skin: '#e4ece8', hair: '#c8d4cc', hs: 'long', top: '#dfe6e2', dress: true, ghost: true, eye: '#0a1210' },
      erlp: { key: 'erl-king', big: true, skin: '#c8d0c8', hair: '#8a948e', hs: 'long', top: '#5a6460', top2: '#4a5450', robe: true, noFeet: true, ghost: true, eye: '#050806',
        extra(g, d, fr, G, R) { R(4, G.hT - 2, 8, 2, '#2e2618'); R(4, G.hT - 4, 1, 2, '#2e2618'); R(7, G.hT - 5, 2, 3, '#2e2618'); R(11, G.hT - 4, 1, 2, '#2e2618'); } }
    },
    items: {
      lantern: { name: '马灯', desc: '铁皮马灯，玻璃罩子熏黑了一半。灯油只够一夜。' },
      cloak: { name: '羊毛斗篷', desc: '你父亲留下来的厚斗篷，羊毛扎手，可是挡风。' },
      toy: { name: '小木马', desc: '卢卡斯的木马，你去年冬天给他削的。一只耳朵被他啃秃了。' }
    },
    notes: {
      route: { title: '格蕾特婆婆的路条', text: '（从账本上撕下来的一页，字歪歪扭扭，是格蕾特婆婆找人代写的。）\n\n去城里，夜里认路：\n一、出村过石十字，进赤杨林。\n二、雾天里，林子低处全是沼泽，雾就是从那儿冒出来的——哪边雾浓，哪边就是沼泽。沼泽里夜里有鬼火，黄澄澄一点，像有人提着灯，别跟。\n三、走高处。山毛榉坡上是干的，满地枯叶，风一吹沙沙响。顺着枯叶走。\n四、下了坡到河边，只走石桥。桥头有两棵老柳树，白天看着灰扑扑的。\n　河滩上开着秋水仙，看着平，底下是烂泥，陷马。\n　老渡口早废了。月亮照得河面发亮的那一段，水最深。\n五、过了桥一直往东，就是城门。' },
      song: { title: '歌单《魔王》', text: '（粗纸印的歌单，边上被卢卡斯画满了小马。抬头印着：「新歌一首，魏玛来的」。）\n\n这样晚了，是谁在夜风里骑行？是那位父亲，怀里抱着他的孩子。\n\n「孩子，为什么把脸藏起来，这样怕？」\n「爸爸，你没看见魔王吗？戴着王冠，拖着长尾巴？」\n「孩子，那是一缕雾。」\n\n「好孩子，来呀，跟我走！我陪你玩最好玩的游戏；\n岸边开着好多花花绿绿的花，我母亲有好多金线衣裳。」\n\n「爸爸，爸爸，你没听见吗？魔王在小声答应我什么？」\n「别怕，安静，孩子；那是风吹着枯叶沙沙响。」\n\n「好孩子，你肯跟我走吗？我的女儿们会好好服侍你；\n她们夜里领着轮舞，摇着你、跳着、唱着，哄你睡。」\n\n「爸爸，爸爸，你没看见吗？魔王的女儿们，就在那黑地方！」\n「孩子，孩子，我看得清清楚楚：那是几棵老柳树，灰扑扑的。」\n\n「我爱你，你漂亮的模样叫我动心；你要是不肯，我就动手了。」\n「爸爸，爸爸，他抓住我了！魔王把我弄疼了！」\n\n父亲心里发寒，催马飞奔，臂弯里抱着呻吟的孩子；\n好不容易赶到了院门——他怀里的孩子，已经死了。' },
      oluf: { title: '林中神龛的木牌', text: '（山毛榉坡上的小神龛，圣母像脚下钉着一块木牌，字是烙上去的，快被雨水磨平了。）\n\n愿过林的人平安。\n\n老辈人讲：从前有个骑士叫奥卢夫，夜里骑马去请喝喜酒的客人。林子边上，精灵王的女儿们正在跳轮舞。\n领头的那个拉住他的缰绳：「奥卢夫，下马来，跟我跳一支。」\n「明天我就成亲了，不能跳。」\n她许他金马刺，许他月光漂白的丝衬衫，他都不要。\n她就在他心口上，轻轻按了一下。\n奥卢夫骑回了家，脸白得像蜡。第二天早上，新娘掀开红盖头——\n\n夜里过林子：有人请你跳舞，别答应；有人许你东西，别要。' },
      draw: { title: '卢卡斯的画', text: '（钉在床头墙上的一张画。炭条画的，满纸都是黑手印。）\n\n画上有一匹马，马上有两个人，一大一小。\n旁边有一个很高很高的人，头上戴着尖尖的王冠，身后拖着一条长长的尾巴，一直拖到纸边上。\n右下角是几个手拉着手的小人，画得歪歪扭扭，像几棵树。\n\n背面是你写的字：「卢卡斯画的。画得好。」\n下面还有一行他自己写的，字母一个大一个小：\n「爸爸看不见他。」' }
    },
    legend: '《魔王》（Erlkönig）是歌德1782年写的叙事谣曲，最初是他的歌唱剧《渔家女》开场时，女主角一边干活一边唱的一首歌。全诗八节，只有四个声音：叙述者、父亲、孩子、魔王。孩子三次说看见、听见了魔王，父亲三次给出平常的解释——雾、风吹枯叶、老柳树；最后一节，父亲赶到院子，怀里的孩子已经死了。诗本身是公有领域，本作里的中文为自译。\n\n「魔王」这个词有一段曲折的来历。通常的说法是：赫尔德在1778—1779年出版的《民歌集》里，把丹麦民谣《奥卢夫先生》（精灵王的女儿请骑士跳舞，他不肯，被她夺了性命）译成德文《魔王的女儿》，把丹麦语里的「精灵王」译成了 Erlkönig，字面上成了「赤杨之王」——一般认为这是误译。歌德沿用了这个词，魔王的女儿们、夜里的轮舞，都来自这一支传统。\n\n1815年，十八岁的舒伯特把它谱成艺术歌曲（后来作为他的作品第1号出版）：一个歌手要唱四个角色，钢琴不停的三连音像马蹄，孩子那三声「我的父亲」一次比一次高；魔王的段落却用甜美的大调。另有一种流传很广的说法，说歌德是在耶拿附近听说一个农夫连夜抱着病孩骑马求医，才写下这首诗——这个说法没有找到可靠的出处，只能算查无实据。\n\n游戏虚构：父亲马丁、孩子卢卡斯、格蕾特婆婆、韦伯医生和1790年这个夜晚；赤杨林的岔路、路条和「雾即沼泽、枯叶即高地、柳树即桥头」的认路法；奥卢夫故事被写在神龛木牌上；以及孩子活着到了城里的结局——那是歌里没有的一节。',
    start: { map: 'farm', x: 7, y: 3, dir: 1 },
    async intro(S) {
      await S.card('第十七夜　魔王', '1790年11月　图林根　萨勒河边的小村', '这样晚了，是谁在夜风里骑行？\n是那位父亲，怀里抱着他的孩子。\n\n——去年秋天赶集，卢卡斯缠着你买下一张歌单，非要你念给他听，一遍，又一遍。\n\n今夜，他烧得滚烫，嘴里一直念叨着那首歌。');
    },
    resume: {
      async ride(S) { rideOn(S); if (DIED.sleep) await S.think('（别让卢卡斯睡着：时间见底、头顶出现「!」的时候，按调查键跟他说话。）'); startAwake(S); },
      async slope(S) { rideOn(S); if (DIED.sleep) await S.think('（别让卢卡斯睡着：时间见底、头顶出现「!」的时候，按调查键跟他说话。）'); startAwake(S); },
      async river(S) { rideOn(S); if (DIED.sleep) await S.think('（别让卢卡斯睡着：时间见底、头顶出现「!」的时候，按调查键跟他说话。）'); startAwake(S); },
      async gallop(S) {
        rideOn(S); S.clearTimer(); S.dark(null);
        const P = [[15, 16], [16, 15], [16, 17]];
        DAU.forEach((id, i) => { S.place(id, P[i][0], P[i][1], 2); S.ent(id).alpha = .78; });
        S.hide('erlp'); S.hide('nb1'); S.hide('nb2');
        if (DIED.gallop) await S.think('（按住奔跑键催马，一刻也别停；路上的雾团就是魔王——提前换一条道躲开。）');
        startChase(S, 1.0);
      }
    },
    thumb(g, w, h) {
      g.fillStyle = '#d8dcc8'; g.fillRect(126, 10, 10, 10); g.fillStyle = '#1a2230'; g.fillRect(129, 9, 9, 10);
      for (let i = 0; i < 7; i++) { g.fillStyle = `rgba(180,192,204,${.07 + (i % 3) * .03})`; g.fillRect(0, 34 + i * 6, w, 3 + (i % 2) * 2); }
      g.fillStyle = 'rgba(200,210,214,.22)'; g.fillRect(22, 18, 10, 50); g.fillRect(18, 26, 18, 30); g.fillRect(30, 60, 30, 5);
      g.fillStyle = 'rgba(30,30,24,.9)'; g.fillRect(20, 14, 14, 3); g.fillRect(20, 10, 2, 4); g.fillRect(26, 9, 2, 5); g.fillRect(32, 10, 2, 4);
      g.fillStyle = '#0a0c0e'; g.fillRect(24, 22, 2, 2); g.fillRect(29, 22, 2, 2);
      for (let x = 0; x < w; x += 9) { g.fillStyle = '#0c1014'; g.fillRect(x, 50 + ((x * 7) % 9), 7, 20); }
      const R2 = (x, y, ww, hh, c) => { g.fillStyle = c; g.fillRect(82 + x * 2, 44 + y * 2, ww * 2, hh * 2); };
      horseSide(R2, 1, 0, true, 0);
    },
    sprites: {
      ride(g, e, t, R) {
        const tl = (W && W.timer && W.timer.label === AWL) ? W.timer.left : 99;
        rideSprite(R, e.dir, e.fr, t, tl <= 15 ? 2 : tl <= KID_AT ? 1 : 0);
      },
      horse(g, e, t, R) { const M = e.dir === 2 ? (x, y, w, h, c) => R(16 - x - w, y, w, h, c) : R; horseSide(M, 0, t, false, 0); },
      kidbed(g, e, t, R) {
        box(R, 1, -2, 14, 32, '#5a3c26'); R(2, -1, 12, 4, '#6a4a30'); R(3, 3, 10, 6, '#e6e2d6');
        if (!e.empty) { R(5, 2, 6, 6, '#f2d0bc'); R(5, 1, 6, 2, '#d8b468'); R(5, 5, 1, 1, '#e0867a'); R(10, 5, 1, 1, '#e0867a'); R(6, 4, 1, 1, '#3a2a2a'); R(9, 4, 1, 1, '#3a2a2a'); R(2, 9, 12, 20, '#7a5a4a'); R(4, 12, 8, 6, '#8a6a5a'); R(2, 9, 12, 2, '#9a7a6a'); }
        else { R(2, 20, 12, 9, '#7a5a4a'); R(2, 17, 12, 4, '#9a7a6a'); R(4, 10, 8, 6, '#d8d2c4'); }
      },
      walllamp(g, e, t, R) { R(7, 3, 2, 3, '#2a2018'); R(5, 5, 6, 1, '#3a2a18'); R(5, 6, 6, 7, '#8a6a30'); R(6, 7, 4, 5, '#ffd870'); R(6, 13, 4, 1, '#3a2a18'); },
      toyhorse(g, e, t, R) { R(2, 14, 12, 1, '#7a4a20'); R(4, 8, 8, 3, '#a8763a'); R(3, 5, 3, 4, '#a8763a'); R(5, 5, 1, 3, '#3a2414'); R(2, 6, 1, 2, '#a8763a'); R(4, 11, 1, 3, '#8a5a2a'); R(10, 11, 1, 3, '#8a5a2a'); R(12, 8, 2, 1, '#3a2414'); R(3, 6, 1, 1, '#1a1010'); },
      kiddraw(g, e, t, R) { R(3, 3, 10, 9, '#e8e0cc'); R(4, 8, 5, 2, '#2a2420'); R(5, 10, 1, 1, '#2a2420'); R(8, 10, 1, 1, '#2a2420'); R(6, 6, 1, 2, '#2a2420'); R(10, 4, 1, 6, '#2a2420'); R(9, 3, 3, 1, '#2a2420'); R(11, 9, 2, 1, '#2a2420'); R(4, 11, 1, 1, '#2a2420'); R(12, 11, 1, 1, '#2a2420'); },
      stable(g, e, t, R) { R(0, -6, 64, 22, '#2e2218'); for (let i = 0; i < 8; i++) R(i * 8, -6, 1, 22, '#22180f'); R(-3, -16, 70, 10, '#4a3424'); for (let i = 0; i < 9; i++) R(-3 + i * 8, -16, 1, 10, '#3a2618'); R(-3, -7, 70, 1, '#24180e'); R(0, -6, 2, 22, '#5a4028'); R(62, -6, 2, 22, '#5a4028'); },
      hayrack(g, e, t, R) { R(1, 4, 14, 10, '#5a4428'); R(2, 2, 12, 5, '#b89a50'); R(3, 1, 3, 2, '#c8aa60'); R(9, 1, 4, 2, '#a88a40'); for (let i = 0; i < 4; i++) R(2 + i * 4, 6, 1, 8, '#3a2a18'); },
      stool(g, e, t, R) { R(4, 9, 8, 2, '#6a4a30'); R(5, 11, 1, 4, '#4a3020'); R(10, 11, 1, 4, '#4a3020'); R(6, 5, 4, 4, '#d8d0c0'); R(7, 6, 2, 1, '#6a4a2a'); R(7 + Math.sin(t * 2), 1, 1, 3, 'rgba(230,230,230,.35)'); },
      signpost(g, e, t, R) { R(7, -6, 2, 22, '#5a4430'); R(1, -6, 12, 5, '#7a6040'); R(13, -5, 2, 3, '#7a6040'); R(3, -4, 7, 1, '#2a2018'); },
      willow(g, e, t, R) {
        R(6, 2, 4, 14, '#3a3228'); R(5, 12, 6, 4, '#2e281e');
        R(-4, -24, 24, 7, '#5a6a54');
        for (let i = 0; i < 10; i++) { const x = -5 + i * 2.6 + Math.sin(t * 1.4 + i) * 1.2; R(x, -20 + (i % 3), 2, 24 - (i % 4) * 3, i % 3 === 0 ? '#7a887a' : i % 3 === 1 ? '#5f6e5c' : '#8a968a'); }
      },
      nebel(g, e, t, R) {
        for (let k = 0; k < 6; k++) R(3 + Math.sin(t * 2 + k) * 2, -30 + k * 7, 10, 10, 'rgba(214,222,228,.2)');
        R(5, -28, 6, 42, 'rgba(232,238,242,.2)');
        R(4, -33, 1, 3, 'rgba(240,240,236,.45)'); R(7, -35, 2, 4, 'rgba(240,240,236,.45)'); R(11, -33, 1, 3, 'rgba(240,240,236,.45)'); R(4, -31, 8, 1, 'rgba(240,240,236,.35)');
        R(6, -25, 1, 1, 'rgba(8,10,12,.6)'); R(9, -25, 1, 1, 'rgba(8,10,12,.6)');
        R(10, 8, 14 + Math.sin(t * 3) * 3, 3, 'rgba(214,222,228,.16)'); R(18, 10, 10, 2, 'rgba(214,222,228,.1)');
      },
      crocus(g, e, t, R) { for (let i = 0; i < 6; i++) { const x = (hash(e.x || 0, i, 3) * 13) | 0, y = (hash(i, e.y || 0, 4) * 11) | 0; R(x + 1, y + 2, 1, 3, '#4a6a3a'); R(x, y, 3, 2, i % 2 ? '#b898d8' : '#9a7ac0'); R(x + 1, y, 1, 1, '#e8d878'); } },
      bildstock(g, e, t, R) { R(7, 0, 2, 16, '#5a4a3a'); R(3, -12, 10, 12, '#4a3a2a'); R(2, -14, 12, 2, '#2a2018'); R(4, -16, 8, 2, '#2a2018'); R(5, -10, 6, 8, '#120e0a'); R(7, -9, 2, 6, '#c8c0d8'); R(7, -10, 2, 1, '#d8c060'); R(4, 2, 8, 4, '#7a6a52'); R(5, 3, 6, 1, '#4a3a2a'); },
      cgate(g, e, t, R) {
        R(-10, -40, 44, 104, '#4c4a46'); for (let y = -40; y < 64; y += 6) R(-10, y, 44, 1, '#3a3834');
        R(-12, -46, 48, 8, '#3a3632'); for (let i = 0; i < 6; i++) R(-12 + i * 9, -52, 5, 6, '#3a3632');
        R(-2, 0, 20, 48, '#0a0806'); R(0, 4, 16, 44, '#3a2a1a'); R(7, 4, 2, 44, '#2a1c10'); R(-2, -2, 20, 3, '#2e2c28');
        R(-8, -14, 4, 6, '#ffd060');
      },
      gatein(g, e, t, R) { R(0, -24, 10, 72, '#4c4a46'); R(0, 0, 6, 44, '#0a0806'); R(1, 2, 4, 40, '#3a2a1a'); },
      bellpull(g, e, t, R) { R(7, 0, 1, 6, '#8a7a50'); R(5, 6, 6, 5, '#c8a040'); R(6, 7, 2, 2, '#e8c860'); R(7, 11, 2, 1, '#6a5020'); },
      brass(g, e, t, R) { R(3, 4, 10, 6, '#b89040'); R(4, 5, 8, 4, '#d8b050'); R(5, 6, 6, 1, '#6a5020'); R(5, 8, 4, 1, '#6a5020'); }
    },
    tiles: {
      leaves: { solid: false, paint(R, X, Y) { speck(R, '#4e341c', ['#7a4e22', '#8e5e28', '#3e2814', '#a06a2e', '#6a4420'], X, Y, 30, 21); } },
      beech: { solid: true, paint(R, X, Y) { speck(R, '#4e341c', ['#7a4e22', '#3e2814'], X, Y, 10, 22); R(6, 4, 4, 12, '#9a9890'); R(7, 4, 1, 12, '#b8b6ae'); R(1, 0, 14, 8, '#6a4a26'); R(2, -1, 10, 3, '#7e5a2c'); R(3, 2, 4, 2, '#8e6a34'); R(10, 5, 4, 2, '#5a3a1e'); } },
      bridge: { solid: false, paint(R, X, Y) { R(0, 0, 16, 16, '#5c5850'); for (let i = 0; i < 4; i++) R(((Y % 2) * 4 + i * 8) % 16, 1, 7, 6, '#6a665c'); for (let i = 0; i < 2; i++) R(((Y % 2) * 4 + 4 + i * 8) % 16, 9, 7, 6, '#6a665c'); if (Y === 15) { R(0, 0, 16, 3, '#7a766a'); R(0, 3, 16, 1, '#3a3832'); } if (Y === 17) { R(0, 13, 16, 3, '#7a766a'); R(0, 12, 16, 1, '#3a3832'); } } },
      moonwater: { solid: true, paint(R, X, Y) { R(0, 0, 16, 16, '#1b3149'); for (let i = 0; i < 4; i++) { const h = hash(X, Y, 80 + i); R((h * 12) | 0, (hash(X, Y, 90 + i) * 14) | 0, 4, 1, i % 2 ? '#d8b860' : '#f0d888'); } } }
    },
    tick(S, dt) {
      const f = S.f, p = S.pl, ride = riding(S), mid = S.map;
      const lamp = getEnt('lamp_' + mid, mid); if (lamp) lamp.hidden = !ride;
      if (ride && S.moving) { W._hb = (W._hb || 0) - dt; if (W._hb <= 0) { const run = S.running; W._hb = run ? .36 : .52; hooves(S, run); } } else W._hb = 0;
      const aw = !!(W.timer && W.timer.label === AWL), tl = aw ? W.timer.left : 99;
      const kid = getEnt('kid_' + mid, mid);
      if (kid) {
        let want = ride && aw && (tl <= KID_AT || !!atFork(S));
        if (want) { const tx = p.x + DIRS[p.dir][0], ty = p.y + DIRS[p.dir][1]; if (entsAt(curMap(), tx, ty, e => e !== kid && typeof e.on === 'function').length) want = false; }
        if (want) { kid.hidden = false; kid.px = p.x * TS; kid.py = p.y * TS; kid.x = p.x; kid.y = p.y; } else kid.hidden = true;
      }
      if (aw && !S.busy) {
        if (tl <= KID_AT && !W._kw) { W._kw = true; S.toast('卢卡斯的头一点一点的——按调查键，跟他说说话'); }
        if (tl > KID_AT + 2) W._kw = false;
        if (tl <= 15) { W._hbt = (W._hbt || 0) - dt; if (W._hbt <= 0) { W._hbt = 1.3; S.sfx('heart'); } }
      }
    },
    maps: {
      /* ---------------- 农舍 ---------------- */
      farm: {
        amb: 'wind', dark: .7, plr: 2.8, wall: 'wood', floor: 'wood', tileOpts: { woodC: '#5a4028', grassC: '#26321f' },
        rows: FARM,
        ents: [
          { id: 'lamp_farm', x: 0, y: 0, spr: 'invisible', hidden: true, light: { pl: true, r: 2.8, col: 'rgba(255,200,110,.16)' } },
          { id: 'fire', x: 7, y: 1, w: 2, spr: 'fireplace', light: { r: 4.6, col: 'rgba(255,140,60,.22)', flick: true }, on: S => S.narr('炉膛里的火快熄了。你添了两块劈柴，火苗舔上来，屋里亮了一点。\n墙上的影子跟着火一起跳。') },
          { id: 'win', x: 11, y: 1, spr: 'window', on: S => S.narr('窗外什么也看不见。雾贴在玻璃上，像有人在外面哈了一口气。') },
          { id: 'drawing', x: 5, y: 1, spr: 'kiddraw', solid: false, async on(S) { if (S.once('drawi')) await S.narr('床头的墙上，钉着一张卢卡斯的画。'); await S.note('draw'); } },
          { id: 'lanternw', x: 10, y: 1, spr: 'walllamp', light: { r: 1.6, col: 'rgba(255,210,120,.18)' }, async on(S) {
            S.give('lantern'); S.hide('lanternw');
            await S.narr('你从钉子上摘下马灯，晃了晃——灯油还有大半。');
            prepGoal(S);
          } },
          { id: 'luka', x: 4, y: 2, h: 2, spr: 'kidbed', on: lukaBed },
          { id: 'grete', x: 5, y: 4, spr: '@grete', dir: 3, on: greteTalk },
          { id: 'tea', x: 6, y: 2, spr: 'stool', on: S => S.narr('小凳上搁着半碗柳树皮熬的水，苦得发涩。\n格蕾特婆婆说，老辈人发烧，都喝这个。') },
          { id: 'table', x: 9, y: 4, spr: 'table', async on(S) { if (S.once('songi')) await S.narr('桌上压着那张歌单。卢卡斯这两天，非要你一遍一遍地念给他听。'); await S.note('song'); } },
          { id: 'sheet', x: 9, y: 4, spr: 'paper', z: 1, oy: -5, solid: false },
          { id: 'chair', x: 10, y: 4, spr: 'chair', on: S => S.narr('你在这把椅子上坐了两夜，没合过眼。') },
          { id: 'chest', x: 12, y: 3, spr: 'box', async on(S) {
            if (S.has('cloak') || S.f.carry) return S.narr('箱子里只剩几件旧衣裳，一股樟脑味。');
            S.give('cloak');
            await S.narr('箱子底下压着你父亲留下的那件羊毛斗篷。又厚又沉，扎手，可是挡风。');
            prepGoal(S);
          } },
          { id: 'toy', x: 7, y: 5, spr: 'toyhorse', solid: false, async on(S) {
            S.give('toy'); S.hide('toy');
            await S.narr('地上躺着卢卡斯的小木马。去年冬天你给他削的，一只耳朵被他啃秃了。\n你把它揣进了怀里。');
          } },
          { id: 'hdoor', x: 8, y: 8, spr: 'door', open: true, solid: false, on: S => S.narr(riding(S) ? '马进不了屋。' : '屋门敞着。外面的风从门口往里灌，冷得刺骨。') },
          // 院子
          { id: 'stable', x: 18, y: 2, w: 4, spr: 'stable', solid: false },
          { id: 'horse', x: 19, y: 3, spr: 'horse', dir: 1, on: horseOn },
          { id: 'hay', x: 21, y: 3, spr: 'hayrack', on: S => S.narr('草料架上的干草，是你们俩八月里一起晒的。卢卡斯在草堆里打滚，扎了一身的草屑。') },
          { id: 'well', x: 16, y: 7, spr: 'well', on: S => S.narr('井口结了一圈薄冰。你往下看——黑洞洞的水面上，有一团白白的雾。') },
          { id: 'post', x: 23, y: 4, spr: 'signpost', on: S => S.narr('村口的路牌：往东——赤杨林，再往东——城里。\n白天骑马，大半天的路。') },
          { id: 'cart', x: 15, y: 8, spr: 'crate', on: S => S.narr('劈好的柴火码在墙根底下，够烧一冬。') }
        ],
        async enter(S, first) {
          if (!first) return;
          S.face('grete', 'pl');
          await S.say('卢卡斯', '……爸爸……魔王……', { style: 'whisper' });
          await S.narr('炉火快熄了。床上的卢卡斯烧得满脸通红，嘴里还在念叨那首歌。\n格蕾特婆婆在床边守着，朝你招了招手。');
          S.goal('和格蕾特婆婆说话');
        },
        tick(S, dt) {
          const p = S.pl; if (S.busy) return;
          if (p.x >= 25 && p.y === 5) {
            if (riding(S)) return S.run(async S => { S.sfx('step'); await S.go('forest', 1, 15, 2); });
            return S.run(async S => { await S.narr(S.f.carry ? '走着去城里？抱着孩子，天亮也走不到。\n骑上布劳恩。' : '还没收拾好呢。卢卡斯还在床上。'); await S.walk('pl', 'l', 5); });
          }
        }
      },
      /* ---------------- 赤杨林 ---------------- */
      forest: {
        amb: 'wind', dark: .9, plr: 1.9, fog: .5, floor: 'dirt', tileOpts: { treeC: '#18241a', grassC: '#1e2a1c' },
        legend: { 'v': 'leaves', 'Q': 'beech' },
        rows: forestRows(),
        ents: [
          { id: 'lamp_forest', x: 0, y: 0, spr: 'invisible', hidden: true, light: { pl: true, r: 2.6, col: 'rgba(255,200,110,.15)' } },
          { id: 'kid_forest', x: 0, y: 0, spr: 'invisible', hidden: true, on: talkKid },
          { id: 'scross', x: 3, y: 14, spr: 'cross', on: S => S.narr('村口的石十字。底座上放着一束干了的矢车菊。\n过了这儿，就是赤杨林。') },
          { id: 'shrine', x: 24, y: 8, spr: 'bildstock', async on(S) { if (S.once('shri')) await S.narr('坡上的路边，立着一座小神龛。圣母像的脸被雨水冲得只剩一个轮廓。'); await S.note('oluf'); } },
          { id: 'stump', x: 33, y: 16, spr: 'invisible', on: S => S.narr('一截老树桩，上面长满了白蘑菇，在马灯底下亮莹莹的。') },
          { id: 'owl', x: 38, y: 16, spr: 'invisible', async on(S) { S.tone('sine', 420, 380, .4, .06, 0, 1200); S.tone('sine', 400, 360, .6, .05, .5, 1200); await S.narr('树上有一只猫头鹰，「呜——呜——」叫了两声。\n卢卡斯在你怀里抖了一下。'); } }
        ],
        async enter(S, first) {
          if (!first) return;
          S.f.stage = 'f1';
          await S.narr('赤杨林。白天你从这儿走过一百回，闭着眼都认得路。\n可今夜的雾，把一切都吃掉了。马灯只照得见马头前面两步。');
          await S.say('卢卡斯', '……爸爸。');
          await S.say('马丁', '爸爸在。别睡，跟爸爸说话。');
          S.goal('穿过赤杨林（卢卡斯犯困、头顶出现「!」时，按调查键跟他说话）');
          S.f.awake = AW_MAX; S.cp('ride');
          startAwake(S);
        },
        tick(S, dt) {
          const f = S.f, p = S.pl; if (S.busy || W.ended) return;
          if (f.stage === 'f1') {
            if (!f.f1d) { if (p.x >= 10) return S.run(S => forkArrive(S, 1)); return; }
            if (p.x === 10 && p.y <= 10) return S.run(S => wrongTurn(S, 1, 'N'));
            if (p.x === 10 && p.y >= 20) return S.run(S => wrongTurn(S, 1, 'S'));
            if (p.y === 15 && p.x >= 13) return S.run(rightF1);
            return;
          }
          if (f.stage === 'slope') {
            if (!f.b2 && p.y === 10 && p.x >= 22) return S.run(belief2);
            if (p.x >= 44 && p.y === 17) return S.run(async S => { saveAwake(S); await S.go('river', 1, 9, 2); });
          }
        }
      },
      /* ---------------- 萨勒河 ---------------- */
      river: {
        amb: 'river', dark: .86, plr: 2.1, fog: .38, floor: 'dirt', wall: 'stone', tileOpts: { treeC: '#1a2620', grassC: '#1e2a22' },
        legend: { 'Z': 'bridge', 'M': 'moonwater', 'G': { t: 'grass', solid: true } },
        rows: riverRows(),
        ents: [
          { id: 'lamp_river', x: 0, y: 0, spr: 'invisible', hidden: true, light: { pl: true, r: 2.6, col: 'rgba(255,200,110,.15)' } },
          { id: 'kid_river', x: 0, y: 0, spr: 'invisible', hidden: true, on: talkKid },
          { id: 'fallen', x: 7, y: 8, spr: 'signpost', on: S => S.narr('一根歪倒的路牌杆。牌子被风刮掉了，不知道落在哪个泥坑里。') },
          ...[[14, 8], [15, 9], [16, 10], [15, 7], [14, 10], [16, 8]].map(([x, y], i) => ({ id: 'cro' + i, x, y, spr: 'crocus', decal: true, solid: false })),
          { id: 'wil1', x: 15, y: 14, spr: 'willow', on: S => S.narr('一棵老柳树。树干裂开了一道大口子，里面黑洞洞的，能藏下一个人。') },
          { id: 'wil2', x: 15, y: 18, spr: 'willow', on: S => S.narr('另一棵老柳树，枝条垂进了河里。风一吹，像有人在水边梳头。') },
          ...[[24, 14], [29, 18], [35, 14], [41, 18], [47, 14], [53, 18], [57, 14]].map(([x, y], i) => ({ id: 'rw' + i, x, y, spr: 'willow' })),
          { id: 'd1', x: 15, y: 16, spr: '@daughter', dir: 2, solid: false, hidden: true, alpha: .78, light: { r: 1.2, col: 'rgba(210,225,230,.14)' } },
          { id: 'd2', x: 16, y: 15, spr: '@daughter', dir: 2, solid: false, hidden: true, alpha: .78, light: { r: 1.2, col: 'rgba(210,225,230,.14)' } },
          { id: 'd3', x: 16, y: 17, spr: '@daughter', dir: 2, solid: false, hidden: true, alpha: .78, light: { r: 1.2, col: 'rgba(210,225,230,.14)' } },
          { id: 'nb1', x: 36, y: 16, spr: 'nebel', solid: false, hidden: true, light: { r: 1.8, col: 'rgba(210,220,230,.12)' } },
          { id: 'nb2', x: 47, y: 16, spr: 'nebel', solid: false, hidden: true, light: { r: 1.8, col: 'rgba(210,220,230,.12)' } },
          { id: 'erlp', x: 50, y: 16, spr: '@erlp', dir: 2, solid: false, hidden: true },
          { id: 'cgate', x: 61, y: 14, spr: 'cgate', solid: false }
        ],
        async enter(S, first) {
          if (!first) return;
          const f = S.f; f.stage = 'f2';
          await S.narr('林子到头了。坡底下传来哗哗的水声——萨勒河。\n雾从河面上一层一层地漫上来。');
          S.goal('找到过河的路');
          S.cp('river');
        },
        tick(S, dt) {
          const f = S.f, p = S.pl;
          if (f.stage === 'gallop') {
            if (!W.camFocus || Math.abs(W.camFocus[0] - (p.px / TS + 4)) > .01) S.focus(p.px / TS + 4, 16);
            if (S.busy || W.ended) return;
            const lane = Math.round(p.py / TS);
            for (const [k, sx, at] of [['nb1', 27, 36], ['nb2', 38, 47]]) {
              const e = S.ent(k);
              if (!f[k] && p.x >= sx) { f[k] = true; S.place(k, at, lane, 1); e.alpha = 0; S.alpha(k, 1, 500); S.sfx('whisper'); S.toast('「爸爸！他在前面！站在路当中！」'); }
              if (!e.hidden && e.alpha > .3) {
                if (Math.abs(e.px - p.px) < 12 && Math.abs(e.py - p.py) < 10) return S.run(S => hitFog(S, e));
                if (p.px > e.px + 28) e.hidden = true;
              }
            }
            if (!f.grabbed && p.x >= 50) return S.run(grab);
            if (p.x >= 58) return S.run(atGate);
            return;
          }
          if (S.busy || W.ended) return;
          if (f.stage === 'f2') {
            if (!f.f2d) { if (p.x >= 8) return S.run(S => forkArrive(S, 2)); return; }
            if (p.x === 8 && p.y <= 6) return S.run(S => wrongTurn(S, 2, 'N'));
            if (p.y === 9 && p.x >= 11) return S.run(S => wrongTurn(S, 2, 'E'));
            if (p.x === 8 && p.y >= 12) return S.run(async S => { f.stage = 'bridgeway'; await settle(); await S.narr('你往右边那条路拐下去。\n雾里，渐渐显出两团灰白的、垂着头发的影子。'); S.goal('往前，过石桥'); });
            return;
          }
          if (f.stage === 'bridgeway' && p.y === 16 && p.x >= 13) return S.run(bridge);
        }
      },
      /* ---------------- 城里 ---------------- */
      town: {
        amb: 'night', dark: .72, plr: 2.6, wall: 'stone', floor: 'stone',
        rows: TOWN,
        ents: [
          { id: 'gatein', x: 0, y: 4, spr: 'gatein', solid: false },
          { id: 'watch', x: 2, y: 3, spr: '@watch', dir: 0, light: { r: 2.4, col: 'rgba(255,200,110,.18)' }, async on(S) {
            const L = ['韦伯医生就在前面，门口挂铜铃的那家。快去！', '马我替你牵着。去吧去吧。', '……林子里碰见什么了？你这脸色。'];
            await S.say('守夜人', L[(S.f._wt = ((S.f._wt ?? -1) + 1) % L.length)]);
          } },
          { id: 'horse2', x: 2, y: 6, spr: 'horse', dir: 2, on: S => S.narr('布劳恩浑身冒着热气，脖子上的汗结成了白霜。\n你拍了拍它。好马。') },
          { id: 'tl1', x: 6, y: 1, spr: 'walllamp', light: { r: 2.6, col: 'rgba(255,200,110,.16)' } },
          { id: 'w1', x: 4, y: 1, spr: 'window', on: S => S.narr('窗户黑着。整条街都睡了。') },
          { id: 'w2', x: 9, y: 1, spr: 'window', on: S => S.narr('窗台上摆着一盆冻蔫了的天竺葵。') },
          { id: 'w3', x: 12, y: 1, spr: 'window', on: S => S.narr('窗户里有人翻了个身，床板吱呀响了一声。') },
          { id: 'brass', x: 15, y: 1, spr: 'brass', solid: false, on: S => S.narr('门边钉着一块铜牌：\n「J. 韦伯　医师　夜间急诊请拉铃」') },
          { id: 'ddoor', x: 16, y: 1, spr: 'door', on: finale },
          { id: 'bell', x: 17, y: 1, spr: 'bellpull', solid: false, on: finale },
          { id: 'dwin', x: 18, y: 1, spr: 'window', lit: true, light: { r: 2.2, col: 'rgba(255,210,130,.16)' }, on: S => S.narr('楼上的窗户里亮着一点烛光。') },
          { id: 'tl2', x: 20, y: 1, spr: 'walllamp', light: { r: 2.6, col: 'rgba(255,200,110,.16)' } },
          { id: 'doc', x: 16, y: 1, spr: '@doc', dir: 0, hidden: true },
          { id: 'twell', x: 10, y: 6, spr: 'well', on: S => S.narr('广场上的水井。井沿上刻着一行字，是几十年前闹瘟疫那年刻的：「愿主怜悯」。') }
        ],
        async enter(S, first) {
          if (!first) return;
          S.wear('@meK'); S.speed(1); S.focus(null);
          await S.narr('城门在你身后吱呀一声关上了。石板路上结了一层薄霜。');
          townBell(S, 3);
          await S.narr('钟楼上敲了三下。');
          S.face('watch', 'pl');
          await S.say('守夜人', ['孩子病了？韦伯医生就住在前面，门口挂铜铃的那家。', '……你脸白得跟纸一样。林子里碰见什么了？']);
          await S.think('……雾。风。柳树。');
          S.goal('抱着卢卡斯，去拉韦伯医生家门口的铜铃');
        }
      }
    }
  });
})();
