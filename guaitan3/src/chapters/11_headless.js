/* ================= 第十一夜 · 无头骑士 ================= */
(() => {
  /* ---------- 地图生成小工具 ---------- */
  const G = (w, h, c) => Array.from({ length: h }, () => Array(w).fill(c));
  const F = (g, x0, y0, x1, y1, c) => { for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) if (g[y] && x >= 0 && x < g[y].length) g[y][x] = c; };
  const ROWS = g => g.map(r => r.join(''));
  /* 沿折线挖一条两格宽的路：点 (x,y) 覆盖 x..x+1, y..y+1 */
  const carve = (g, pts, c = 'd') => { for (let i = 0; i < pts.length - 1; i++) { const [x1, y1] = pts[i], [x2, y2] = pts[i + 1]; F(g, Math.min(x1, x2), Math.min(y1, y2), Math.max(x1, x2) + 1, Math.max(y1, y2) + 1, c); } };

  /* 睡谷的夜路：180×22，自西向东 —— 范·塔赛尔家院门 / 少校树 / 威利沼泽 / 坡顶 / 岔口一（上坡回汉斯家，下坡去教堂）/ 老墓地 / 教堂桥 / 老荷兰教堂 */
  const RW = 180, RH = 22, BR = 151;   // BR：教堂桥第一块桥板的 x
  function roadRows() {
    const g = G(RW, RH, 'G');
    for (let y = 0; y < RH; y++) for (let x = 0; x < RW; x++) { const h = hash(x, y, 11); if (h < .42) g[y][x] = h < .22 ? 'P' : 'T'; }
    F(g, 12, 4, 22, 9, 'G'); F(g, 48, 2, 62, 8, 'G'); F(g, 48, 13, 62, 19, 'G');   // 少校树下、坡顶上没有树
    carve(g, [[0, 10], [74, 10], [74, 6], [96, 6]]);         // 主路
    carve(g, [[96, 6], [96, 3], [127, 3]]);                 // 上坡：回汉斯家
    carve(g, [[128, 3], [128, 16]], 'u');                   // 汉斯家门口往下的泥泞小道
    carve(g, [[96, 6], [96, 16], [BR - 1, 16]]);            // 下坡：去教堂
    F(g, 112, 16, 116, 17, 'u');
    g[10][0] = 'f'; g[11][0] = 'f';
    F(g, 130, 1, 130, 6, 'f');                              // 汉斯家的院墙
    // 威利沼泽：小溪 + 几根木头搭的桥
    for (let y = 1; y < RH - 1; y++) for (let x = 31; x <= 33; x++) g[y][x] = (y === 10 || y === 11) ? 'Q' : '~';
    for (const x of [29, 30, 34, 35]) for (let y = 2; y < RH - 2; y++) if (y < 9 || y > 12) g[y][x] = 'e';
    F(g, 28, 10, 30, 11, 'u'); F(g, 34, 10, 35, 11, 'u');
    // 老墓地（溪这边，教堂围墙外）
    F(g, 134, 8, 147, 15, 'f'); F(g, 135, 9, 146, 14, '"'); F(g, 136, 15, 137, 15, 'd'); F(g, 144, 15, 145, 15, 'd');
    // 教堂溪 + 教堂桥
    for (let y = 0; y < RH; y++) for (let x = BR; x <= BR + 2; x++) g[y][x] = (y === 16 || y === 17) ? 'Q' : '~';
    for (const x of [BR - 2, BR - 1, BR + 3, BR + 4]) for (let y = 1; y < RH - 1; y++) if (y < 15 || y > 18) g[y][x] = 'e';
    // 桥那头：石板路通到教堂门口
    F(g, 160, 2, 176, 9, 'G');
    carve(g, [[BR + 3, 16], [168, 16], [168, 10]], 'k');
    return ROWS(g);
  }
  /* 范·塔赛尔家的院子：28×16 */
  function yardRows() {
    const g = G(28, 16, '"');
    F(g, 0, 0, 27, 0, 'T'); F(g, 0, 15, 27, 15, 'T'); F(g, 0, 0, 0, 15, 'T'); F(g, 27, 0, 27, 15, 'T');
    F(g, 2, 0, 11, 1, '#');             // 正屋
    F(g, 18, 3, 26, 6, '#');            // 谷仓
    F(g, 1, 8, 8, 10, '#');             // 马厩
    F(g, 15, 8, 25, 14, 'f'); F(g, 16, 9, 24, 13, 'v'); g[11][15] = 'v';   // 南瓜地
    F(g, 6, 2, 7, 14, 'd'); F(g, 8, 13, 14, 14, 'd'); F(g, 13, 15, 14, 15, 'd'); F(g, 4, 11, 7, 12, 'd'); F(g, 8, 7, 22, 7, 'd');
    return ROWS(g);
  }

  /* ---------- 跨重来的本地状态（只在主机推进） ---------- */
  let DEATHS = 0;            // 被追上几次（死亡次数，决定逐级提示）
  let camHold = false;       // 剧情演出时暂停镜头前瞻
  const HO = { p: 0, k: 0, h: 0, hk: 0 };   // 马蹄声节拍
  const CH = { trail: [], slipT: 0, wobT: 0, wobbled: false, lastTile: '' };
  const MUS = { t: 0, i: 0 };
  const resetChase = () => { CH.trail = []; CH.slipT = 0; CH.wobT = 0; CH.wobbled = false; CH.lastTile = ''; };

  const CLUES = [['c_stem', '南瓜地里那截还湿着的断茬'], ['c_stall', '马厩里「恶魔」那个空隔间'], ['c_whisper', '谷仓里压着嗓子的笑声'], ['c_seeds', '屋门口那几粒湿漉漉的南瓜子']];
  const clueN = S => CLUES.filter(([k]) => S.f[k]).length;
  const HSPD = 6.2;          // 黑森骑兵的基本速度（格/秒）；火药小跑 5.46、狂奔 8.84
  const setSpd = (S, v) => { if (Math.abs((S.pl.speed || 1) - v) > .01) S.speed(v); };
  const riding = S => S.f.ride;

  /* ---------- 合成音：口哨、夜鹰、赞美诗、钟、马嘶 ---------- */
  const OLD100 = [[392, .55], [392, .42], [370, .42], [330, .42], [294, .55], [392, .42], [440, .42], [494, .8]];
  async function psalm(S, n, shaky) {
    for (let i = 0; i < n; i++) { const [f, d] = OLD100[i]; S.tone('square', f, shaky ? f * .94 : f, d * .9, shaky ? .022 : .04, 0, 1100); await S.wait(d * 1000); }
  }
  const whippoorwill = S => { S.tone('sine', 1700, 2100, .14, .03, 0); S.tone('sine', 1500, 1450, .1, .025, .2); S.tone('sine', 1900, 2600, .22, .035, .34); };
  const neigh = S => { S.tone('sawtooth', 520, 940, .22, .045, 0, 2200); S.tone('sawtooth', 940, 420, .55, .04, .22, 1800); };
  const snort = (S, v = .05) => S.tone('sawtooth', 130, 60, .3, v, 0, 420);
  const bell = (S, d = 0) => { S.tone('sine', 196, 196, 2.6, .12, d); S.tone('sine', 494, 490, 1.8, .05, d); S.tone('triangle', 392, 392, 1.2, .04, d); };
  /* 范·塔赛尔家的吉格舞曲：主机每一拍排一个音（不会提前排一长串停不下来） */
  const JIG = [[587, 1], [740, 1], [880, 1], [740, 1], [587, 1], [440, 1], [494, 1], [587, 1], [740, 1], [659, 2], [0, 1], [659, 1], [740, 1], [784, 1], [740, 1], [659, 1], [587, 1], [494, 1], [440, 1], [494, 1], [587, 2], [0, 1]];

  /* ---------- 精灵：火药 + 伊卡博德（侧面，基准朝左） ---------- */
  function gunpowder(R0, e, t, flip, saddle) {
    const R = (x, y, w, h, c) => R0(flip ? 16 - x - w : x, y, w, h, c);
    const fr = e.fr || 0, run = fr !== 0;
    const C = '#7a4a2a', D = '#4e2e1a', L = '#9a6a42', M = '#8a3e1e', BU = '#6a7a2a';
    R(-6, 14, 28, 2, 'rgba(0,0,0,.35)');
    const legs = fr === 1 ? [[-3, 9, 2, 5], [-1, 9, 2, 5], [14, 9, 2, 5], [16, 9, 2, 5]] : fr === 3 ? [[1, 9, 2, 6], [3, 9, 2, 6], [10, 9, 2, 6], [12, 9, 2, 6]] : [[0, 9, 2, 6], [2, 9, 2, 6], [11, 9, 2, 6], [13, 9, 2, 6]];
    legs.forEach(([x, y, w, h], i) => { R(x, y, w, h, i % 2 ? D : C); R(x, y + h - 1, w, 1, '#1a120c'); });
    const by = fr === 1 ? -1 : 0;
    R(-1, 3 + by, 17, 6, C); R(0, 8 + by, 15, 1, D); R(1, 3 + by, 12, 1, L); R(2, 4 + by, 1, 3, D); R(5, 4 + by, 1, 3, D);   // 瘦得能数肋条
    R(16, 3 + by, 2, 6, M); R(17, 8 + by, 2, 3, M); R(16, 5 + by, 1, 1, BU); R(17, 9 + by, 1, 1, BU);   // 尾巴（粘着苍耳）
    R(-4, 0 + by, 4, 6, C); R(-3, 3 + by, 2, 2, L); R(-4, 0 + by, 1, 2, D);   // 往下塌的母羊脖子
    R(-10, -3 + by, 7, 5, C); R(-11, -1 + by, 2, 3, D); R(-11, 1 + by, 1, 1, '#1a120c');   // 锤子似的大脑袋
    R(-5, -5 + by, 1, 2, C); R(-7, -2 + by, 1, 1, '#ecebe2');   // 耳朵、没有瞳仁的白眼
    R(-3, -2 + by, 3, 2, M); R(-1, 0 + by, 2, 4, M); R(-2, -1 + by, 1, 1, BU); R(0, 2 + by, 1, 1, BU);
    if (saddle) { R(4, 1 + by, 7, 3, '#3a2010'); R(4, 1 + by, 7, 1, '#6a4a2a'); R(7, 4 + by, 1, 4, '#8a8a84'); R(6, 8 + by, 3, 1, '#8a8a84'); }
    const ry = by + (fr === 3 ? -1 : 0);
    R(5, 1 + ry, 2, 7, '#3a3428'); R(4, 7 + ry, 3, 1, '#1a1410');   // 长腿耷拉着
    R(5, -10 + ry, 5, 11, '#22202a'); R(9, -9 + ry, 1, 9, '#141218');
    const fl = run ? ((t * 14 | 0) % 2) : 0; R(10, -4 + ry, 3 + fl, 3, '#22202a'); R(12 + fl, -2 + ry, 2, 2, '#22202a');   // 外套后摆飘起来
    R(2, -7 + ry, 4, 2, '#22202a'); R(1, -6 + ry, 1, 2, '#22202a'); R(0, -5 + ry, 2, 1, '#ecd4bc');   // 胳膊肘支棱得像蚂蚱腿
    R(-6, -3 + by, 6, 1, '#5a3a20');
    R(5, -16 + ry, 5, 6, '#ecd4bc'); R(4, -14 + ry, 1, 2, '#ecd4bc'); R(3, -13 + ry, 1, 1, '#ecd4bc');
    R(6, -16 + ry, 4, 1, '#4a3420'); R(9, -16 + ry, 1, 3, '#4a3420'); R(9, -13 + ry, 1, 2, '#d8b498'); R(6, -14 + ry, 1, 1, '#2e4a2e');
    R(5, -18 + ry, 5, 2, '#2a2420'); R(4, -16 + ry, 7, 1, '#2a2420');
  }
  function staminaBar(R) {
    if (W.mapId !== 'road') return;
    const h = getEnt('hud', 'road'); if (!h || !h.s.on) return;
    const st = clamp((h.s.st ?? 100) / 100, 0, 1);
    R(1, -26, 14, 4, '#0a0a0a'); R(2, -25, 12, 2, '#2a2420');
    R(2, -25, Math.round(12 * st), 2, h.s.w ? (Math.sin(RT * 12) > 0 ? '#e04030' : '#701810') : st > .45 ? '#d8c070' : '#e07030');
  }
  /* 黑森骑兵（侧面，基准朝左）：e.hd 朝向，e.rev 露出没有头，e.rise 站在马镫上，e.nohead 脑袋扔出去了 */
  function hessian(R0, e, t) {
    const flip = (e.hd || 1) === 2;
    const R = (x, y, w, h, c) => R0(flip ? 16 - x - w : x, y, w, h, c);
    const fr = e.fr || 0, run = fr !== 0, K = '#0d0c10', K2 = '#1c1a22', K3 = '#2c2a36';
    R(-10, 14, 34, 2, 'rgba(0,0,0,.45)');
    const legs = fr === 1 ? [[-6, 8, 3, 6], [-3, 8, 3, 6], [16, 8, 3, 6], [19, 8, 3, 6]] : fr === 3 ? [[-1, 8, 3, 8], [2, 8, 3, 8], [12, 8, 3, 8], [15, 8, 3, 8]] : [[-3, 8, 3, 8], [0, 8, 3, 8], [13, 8, 3, 8], [16, 8, 3, 8]];
    for (const [x, y, w, h] of legs) { R(x, y, w, h, K2); R(x, y + h - 1, w, 1, '#000'); }
    const by = fr === 1 ? -1 : 0;
    R(-4, 1 + by, 23, 8, K); R(-3, 1 + by, 20, 1, K3);
    R(19, 0 + by, 3, 9, K2); R(21, 6 + by, 2, 6, K2);
    R(-9, -4 + by, 6, 9, K); R(-15, -7 + by, 8, 5, K); R(-16, -5 + by, 2, 3, K2);
    R(-8, -9 + by, 1, 3, K); R(-12, -6 + by, 1, 1, '#ff4a1a');
    R(-6, -7 + by, 4, 3, K3); R(-4, -4 + by, 3, 5, K3);
    const ry = by + (e.rise ? -4 : 0);
    R(2, 2 + ry, 3, 7, '#141418');
    R(0, -16 + ry, 11, 18, '#08080c'); R(2, -14 + ry, 1, 15, K3); R(7, -13 + ry, 1, 14, K3);
    const fl = run ? ((t * 12 | 0) % 3) : 0; R(11, -14 + ry, 4 + fl, 12, '#08080c'); R(14 + fl, -10 + ry, 2, 6, '#08080c');
    if (!e.rev) { R(2, -23 + ry, 7, 7, '#0a0a10'); R(3, -22 + ry, 5, 1, K3); }   // 兜帽鼓鼓的，像是里面有个脑袋
    else { R(0, -18 + ry, 11, 2, K2); R(2, -19 + ry, 7, 1, '#16161e'); R(4, -19 + ry, 3, 1, '#3a0c0c'); }   // 领子上面，空的
    if (e.rev && !e.nohead) {
      const hx = e.rise ? -1 : -3, hy = e.rise ? -30 + ry : -5 + by, gl = .55 + Math.sin(t * 7) * .25;
      if (e.rise) R(0, -27 + ry, 2, 11, '#08080c');
      R(hx, hy, 6, 5, '#6e3c14'); R(hx + 1, hy - 1, 4, 1, '#6e3c14'); R(hx + 2, hy - 2, 1, 1, '#2a3a14');
      R(hx + 1, hy + 1, 1, 1, `rgba(255,200,80,${gl.toFixed(2)})`); R(hx + 4, hy + 1, 1, 1, `rgba(255,200,80,${gl.toFixed(2)})`); R(hx + 1, hy + 3, 4, 1, `rgba(255,170,60,${(gl * .8).toFixed(2)})`);
    }
  }
  /* 马厩里的马（正面）：col 毛色 mane 鬃色 ewe 母羊脖子 ham 锤子头 eyeL/eyeR('w'没瞳仁 'c'白翳) burrM/burrT 苍耳 braid 编辫子 */
  function stallHorse(R, e, t) {
    const C = e.col || '#7a4a2a', D = shade(C, -.35), L = shade(C, .2), M = e.mane || shade(C, -.2), BU = '#7a8a32';
    R(1, 14, 14, 2, 'rgba(0,0,0,.35)');
    R(4, 8, 2, 7, D); R(10, 8, 2, 7, D); R(4, 14, 2, 1, '#14100c'); R(10, 14, 2, 1, '#14100c');
    R(3, 0, 10, 9, C); R(3, 0, 1, 9, D); R(12, 0, 1, 9, D); R(5, 1, 6, 1, L);
    if (e.ewe) { R(6, -4, 4, 5, C); R(5, -1, 1, 2, D); R(10, -1, 1, 2, D); } else R(5, -5, 6, 6, C);
    const big = e.ham, hx = big ? 3 : 4, hw = big ? 10 : 8, hy = big ? -14 : -12, hh = big ? 10 : 8;
    const nod = Math.sin(t * 1.3 + e.px * .1) > .92 ? 1 : 0;
    R(hx, hy + nod, hw, hh, C); R(hx + 1, hy + hh - 3 + nod, hw - 2, 3, D); R(hx + 2, hy + hh - 2 + nod, 1, 1, '#100c0a'); R(hx + hw - 3, hy + hh - 2 + nod, 1, 1, '#100c0a');
    R(hx, hy - 2 + nod, 2, 2, C); R(hx + hw - 2, hy - 2 + nod, 2, 2, C);
    const eye = c => c === 'w' ? '#ecebe2' : c === 'c' ? '#9ea2a0' : '#120c0a';
    R(hx + 1, hy + 3 + nod, 2, 1, eye(e.eyeL)); R(hx + hw - 3, hy + 3 + nod, 2, 1, eye(e.eyeR));
    if (!e.eyeL) R(hx + 1, hy + 3 + nod, 1, 1, '#e8e0d0'); if (!e.eyeR) R(hx + hw - 3, hy + 3 + nod, 1, 1, '#e8e0d0');
    if (e.braid) { for (let i = 0; i < 4; i++) R(7 + (i % 2), hy - 1 + i * 2 + nod, 2, 1, M); }
    else { R(6, hy - 2 + nod, 4, 3, M); R(5, hy + nod, 1, 2, M); }
    if (e.burrM) { R(6, hy - 1 + nod, 1, 1, BU); R(9, hy + nod, 1, 1, BU); R(5, hy + 1 + nod, 1, 1, BU); }
    R(13, 2, 2, 8, M); R(14, 9, 1, 3, M); if (e.burrT) { R(13, 4, 1, 1, BU); R(14, 8, 1, 1, BU); }
  }

  /* ---------- 小工具 ---------- */
  async function narrAt(S, x, y, txt) { camHold = true; S.focus(x, y); await S.narr(txt); }
  function camFree(S) { camHold = false; S.focus(null); }
  async function fly(S, id, x1, y1, ms, arc = 18) {
    const e = S.ent(id), x0 = e.px, y0 = e.py, n = Math.max(1, Math.round(ms / 30));
    for (let i = 1; i <= n; i++) { const k = i / n; e.px = lerp(x0, x1 * TS, k); e.py = lerp(y0, y1 * TS, k) - Math.sin(k * Math.PI) * arc; await S.wait(30); }
    e.x = x1; e.y = y1;
  }
  async function stall(S, msg, ms) {   // 火药惊了，站住一下：他照样追（剧本期间不抓人，结束后才判定）
    const h = getEnt('hessian', 'road'); if (h && h.chase) h.chase.always = true;
    neigh(S); S.bubble('pl', '!', ms); S.toast(msg);
    await S.wait(ms);
    if (h && h.chase) h.chase.always = false;
  }

  /* ================= 舞会：范·塔赛尔家 ================= */
  const TALES = ['t_doffue', 't_brouwer', 't_brom'];
  const talesN = S => TALES.filter(k => S.f[k]).length;
  function talesGoal(S) { if (!S.f.tales) S.goal('听壁炉边的鬼故事（' + talesN(S) + '/3）'); }
  async function afterTale(S) {
    talesGoal(S);
    if (talesN(S) < 3 || S.f.tales) return;
    S.f.tales = true;
    if (!S.ent('h_brom').hidden) {
      S.face('h_brom', 'pl');
      await S.say('布罗姆', ['好啦，我先走一步。', '路上小心啊，先生。今晚没有月亮——', '说不定，他正缺个脑袋呢。']);
      S.sfx('laugh');
      await S.walk('h_brom', [11, 10], 4); S.hide('h_brom');
      await S.walk('h_g1', [11, 10], 4); S.hide('h_g1');
      await S.walk('h_g2', [11, 10], 4); S.hide('h_g2');
      S.show('h_seeds');
      await S.narr('布罗姆那帮人推推搡搡地出了门。门关上之前，你听见他们在外头憋不住地笑。');
    }
    await S.narr('你从兜里掏出那本卷了角的赞美诗歌本，在空白页上，把刚才听来的一条一条记了下来。');
    await S.note('fireside');
    S.goal('客人们要散了——和凯特琳单独说几句话');
  }
  async function doffueTale(S) {
    S.face('h_doffue', 'pl');
    if (S.f.t_doffue) return S.say('杜夫·马特林', S.f.tales ? '回去吧，先生。走大路，别磨蹭。他天亮前得赶回墓地，你可别挡他的道。' : '那个豁口？是真的！不信你问老布劳尔——算了，别问他。');
    await S.say('杜夫·马特林', [
      '先生来得正好，正说到那个骑马的。',
      '打仗那年秋天——我也在那场仗里。一颗枪子儿冲我飞过来，我拿剑一挡，「叮」！弹开了。',
      '（老布劳尔在旁边哼了一声：「你那把剑上的豁口，一年比一年大。」）',
      '咳。总之，那一仗里，有个黑森骑兵——英国人花钱雇来的德意志兵——叫炮弹削掉了脑袋。',
      '人是邻居们抬回来的，脑袋一直没找着。牧师不让他进教堂的围墙，就埋在溪这边的老墓地里。',
      '打那以后，他每天夜里骑马出去，去战场上找他的脑袋。',
      '天亮以前，他得赶回墓地。你夜里听见山坳里一阵风似的马蹄声——那是他回晚了，正往回赶。']);
    S.f.t_doffue = true; await afterTale(S);
  }
  async function brouwerTale(S) {
    S.face('h_brouwer', 'pl');
    if (S.f.t_brouwer) return S.say('老布劳尔', '过了桥，别回头。……我就说这一句。');
    await S.say('老布劳尔', [
      '我年轻的时候，可是一个鬼都不信的。',
      '那天夜里我从睡谷回来，在路上撞见了他。他不说话，伸手一拽，就把我拽上了他的马屁股。',
      '我们一路跑啊——翻山，过沼泽，钻灌木丛——一直跑到教堂桥上。',
      '到了桥上，我回头看了一眼。',
      '……就那一眼。他一下子变成了一副骷髅，把我往溪里一扔，「轰」地一声雷，从树梢上跳走了。',
      '先生，我这辈子就记住了一件事：过了桥，别回头。']);
    S.f.t_brouwer = true; await afterTale(S);
  }
  async function bromTale(S) {
    S.face('h_brom', 'pl');
    if (S.f.t_brom) return S.say('布罗姆', '怎么，先生，腿软啦？要不要我送您回去？（他那帮人一起笑起来）');
    await S.say('布罗姆', [
      '老布劳尔那算什么！',
      '有天夜里我从邻村回来，那个黑森兵追上我了。我说：咱俩赛一程，赌一碗潘趣酒！',
      '我们从威利沼泽那边一路往下坡跑，往教堂跑——「恶魔」把他那匹鬼马甩得老远老远！',
      '眼看我就赢了，到了教堂桥头，他的马一惊——「呼」地一下，化成一团火，没了。',
      '那碗潘趣酒，他还欠着我呢。']);
    const r = await S.ask('布罗姆冲你扬了扬下巴：「先生书念得多，您说，他是不是过不了那座桥？」', ['书上说，邪祟渡不过流水。', '（干笑两声，不接话）'], '伊卡博德');
    if (r === 0) { S.f.bookish = true; await S.say('布罗姆', ['流水？哈！', '那您可得骑快点，先生。火药那把老骨头——能不能跑到有流水的地方，难说。']); }
    else await S.say('布罗姆', '（他咧嘴一笑，拍了拍你的肩膀，拍得你一个趔趄。）');
    S.f.t_brom = true; await afterTale(S);
  }
  async function katTalk(S) {
    const f = S.f; S.face('h_kat', 'pl');
    if (f.kat) return S.say('凯特琳', '……路上小心，先生。');
    if (!f.tales) {
      const L = ['先生，您的歌本又卷角了。', '我爹说您教书很用心。……布罗姆说您瘦得像根晾衣竿。我可没这么说。', '去壁炉那边听故事吧。您不是最爱听这些吗？'];
      return S.say('凯特琳', L[(f._kl = ((f._kl ?? -1) + 1) % L.length)]);
    }
    await S.narr('客人们一拨一拨地走了。你磨磨蹭蹭地留到最后——按这一带的规矩，这正是一个求婚的人，该说几句体己话的时候。');
    await S.say('伊卡博德', '凯特琳，我……');
    await S.say('凯特琳', ['先生，今晚谢谢您来。', '您跳得真好。布罗姆一整晚，脸都是黑的。']);
    const r = await S.ask('……布罗姆一整晚，脸都是黑的。', ['凯特琳，我是认真的。', '……原来你是想让他着急。'], '伊卡博德');
    if (r === 0) await S.say('凯特琳', ['先生。', '天不早了。路上黑，您早点回去吧。']);
    else await S.say('凯特琳', ['（她低头笑了一下，没有否认。）', '您是个聪明人，先生。路上小心。']);
    await S.narr('你说不清刚才到底发生了什么。\n你只知道，你像一只偷鸡没偷着的狐狸，灰溜溜地从屋里溜了出来——一点也不像刚刚向一位小姐表白过心意的人。');
    f.kat = true;
    for (const id of ['h_d1', 'h_d2', 'h_d3', 'h_d4']) S.hide(id);
    S.goal('去马厩牵上火药，骑马回家');
  }

  /* ================= 马厩：认出火药 ================= */
  const HORSES = {
    s_a: { d: '一匹高大的黑马，膘肥体壮，鬃毛梳得油亮。脖子又粗又直，两只眼睛黑亮黑亮的。\n马槽上刻着一个大大的「V」——是范·塔赛尔老爷自己的马。', why: '火药可没这么体面。汉斯纸条上的四样毛病，这匹一样都不沾。' },
    s_e: { d: '一匹年轻的枣红马，瘦。脖子往下塌着，像母羊的脖子；脑袋又方又大，活像一把锤子。鬃毛和尾巴乱糟糟的，粘满了苍耳。\n它冲你眨了眨眼——两只眼睛都亮晶晶的，黑眼仁儿清清楚楚。', why: '脖子、脑袋、苍耳都对上了——可汉斯说，火药有一只眼睛没有瞳仁。这匹两只眼睛都好好的。' },
    s_gp: { d: '一匹老得掉了牙的锈红色马，瘦得能数清肋条。脖子往下塌，脑袋大得像一把锤子。鬃毛和尾巴纠成一团，里面全是苍耳。\n它斜过脑袋看你：一只眼睛白蒙蒙的，没有瞳仁，像个鬼；另一只眼睛里，闪着一点不怀好意的光。' },
    s_d: { d: '一匹锈红色的马，脑袋又方又大。灯一照，它一只眼睛白蒙蒙的，没有瞳仁。\n可它的脖子又直又挺，鬃毛编成了一条一条的小辫子，尾巴梳得干干净净，一根草都没有。\n它隔间边上的木桩上，挂着汉斯那副礼拜天才舍得用的马鞍。', why: '白眼和锤子脑袋倒是对上了，可火药的脖子是塌的，鬃毛尾巴乱得粘满苍耳——这匹编着小辫子。\n鞍子大概是长工随手挂错了地方。' },
    s_b: { d: '一匹灰白的老母马，耷拉着下嘴唇打瞌睡。尾巴上粘着几个苍耳，鬃毛倒剪得短短的。\n它慢慢睁开眼——两只眼睛都蒙着一层白翳，老得看不清东西了。', why: '火药只有一只眼睛是白的，脖子塌、脑袋像锤子——这匹老母马都不沾边。' }
  };
  async function inspectHorse(S, e) {
    const f = S.f, id = e.id, H = HORSES[id];
    if (f.gp) return S.narr('马打了个响鼻。');
    if (!S.has('lantern')) { snort(S, .03); return S.narr('黑乎乎的一大团，只听得见它喷鼻子、倒蹄子。\n这么黑，什么毛病也看不出来——门口挂着一盏马灯。'); }
    await S.narr(H.d);
    const r = await S.ask('是火药吗？', ['不是，再看看别的', '就是它——牵出来'], '伊卡博德');
    if (r === 0) return;
    if (id === 's_gp') return pickGunpowder(S);
    // 牵错了：马扬蹄子，按错法给提示；错得越多提示越具体
    f.wp = (f.wp || 0) + 1;
    neigh(S); S.sfx('thud'); S.shake(400, 3);
    await S.narr('你刚去解缰绳，它猛地扬起前蹄——蹄子擦着你的帽檐过去，「砰」地踹在隔板上。');
    if (f.wp === 1) { S.sfx('laugh'); await S.narr('院子那头，谷仓里传来一阵哄笑。'); }
    await S.think(H.why);
    if (f.wp === 2) await S.think('汉斯的纸条上写了四样毛病（按 J 能在档案里重看）。四样全对上的，才是火药。');
    else if (f.wp === 3) await S.think('母羊脖子、锤子脑袋、一只没有瞳仁的白眼、鬃毛尾巴全是苍耳——一匹一匹对过去。');
    else if (f.wp >= 4) { S.bubble('s_gp', '!', 2500); await S.think('……左边数第四个隔间，那匹瘦得能数清肋条的老马。'); }
  }
  async function pickGunpowder(S) {
    const f = S.f;
    if (!S.has('saddle')) { f.gpFound = true; S.goal('找到汉斯那副礼拜天的马鞍'); return S.think('就是它。火药。\n……可是鞍子呢？汉斯那副礼拜天的马鞍——你骑来的时候，长工把它卸下来挂到哪儿去了？'); }
    f.gp = true;
    await S.narr('火药翻着那只白眼瞅你，好像早就认出你来了，就是懒得搭理。');
    await S.narr('你把汉斯的礼拜天马鞍搭上它的背，勒紧肚带。\n肚带上那个快磨断的扣眼，「吱」地响了一声。你假装没听见。');
    S.sfx('close'); S.take('lantern'); S.ent('s_lant').off = false;
    await S.fade(1, 400);
    S.f.ride = true; S.f.hf = 2; S.wear('rideR'); S.plr(null);
    await S.go('yard', 4, 11, 0);
    await S.narr('你把马灯挂回门口，爬上了火药的背。\n火药长长地叹了口气，像是在说：又是你。');
    S.goal('骑出院门，回汉斯家');
  }

  /* ================= 夜路 ================= */
  async function rideIntro(S) {
    await S.narr('你骑着火药出了范·塔赛尔家的院门。\n正是半夜里最邪门的那个钟点。');
    await S.narr('火药走得慢吞吞的，你也懒得催它。你的心沉得像一块秤砣。\n远远的山脚下，哈得孙河黑沉沉的，河心泊着一条单桅船，桅灯一点。');
    whippoorwill(S);
    await S.narr('树林里，夜鹰叫了一声：「威普——普尔——威尔！」\n很远的农场上，一只公鸡迷迷糊糊地打了声鸣——还不到时候呢。');
    S.goal('骑马回汉斯家（一直往东）');
  }
  async function tulipTree(S) {
    await narrAt(S, 17, 8, '路中间那棵大郁金香树，像个巨人似的立在黑地里。树枝又粗又怪，扭得能当别的树的树干。\n据说当年就是在这棵树底下，抓住过一个英国少校。打那以后，大家都叫它「少校树」。');
    await S.narr('你吹起了口哨，给自己壮胆。');
    for (const [a, b, d] of [[988, 1175, .16], [1175, 1319, .16], [1319, 988, .3]]) { S.tone('sine', a, b, d, .035, 0); await S.wait(d * 1000 + 40); }
    await S.wait(500);
    S.tone('sine', 700, 520, .5, .02, 0, 900);
    await S.narr('……有人回了你一声口哨。');
    await S.think('是风。只是风，从枯树枝里穿过去。');
    S.tone('sawtooth', 90, 70, 1.2, .03, 0, 380);
    await S.narr('树上「吱——呀——」一声长长的呻吟，你的牙齿开始打架。\n……是两根大树枝，在风里互相磨。');
    await S.narr('树当中挂着一个白乎乎的东西。你勒住马，死死盯着它看——\n是雷劈过的地方，树皮剥掉了，露出白森森的木头。');
    camFree(S);
  }
  async function swamp(S) {
    const f = S.f, p = S.pl;
    await S.walk('pl', [29, p.y], 3);
    await narrAt(S, 33, 11, '路往下一沉，就是威利沼泽。一条小溪从沼泽里穿过去，上面横着几根粗木头，算是桥。\n这一带的人都说，那几根木头底下，不干净。');
    snort(S);
    const r = await S.ask('还差几步就到桥头，火药忽然站住了，打了个响鼻。', ['夹马肚子，踢它一脚', '扯一扯缰绳，哄哄它'], '伊卡博德');
    if (r === 0) { S.shake(300, 2); await S.narr('它往旁边一窜，差点把你甩进荆棘丛里，然后四蹄一并，死死钉在桥头。'); }
    else await S.narr('它不吃这一套，脖子一拧，四蹄死死钉在桥头。');
    S.sfx('splash');
    await S.narr('就在这时，溪边「啪嗒」一声——有什么东西踩了一脚水。');
    const h = S.ent('hessian'); h.s.hd = 1; h.s.rev = false; h.alpha = 0; S.place('hessian', 37, 13, 1); h.alpha = 0;
    await S.alpha('hessian', .92, 1200);
    await S.narr('桥那头，小溪边的树影里，立着一个东西。\n又黑、又大、奇形怪状，一动不动，像一个蹲着的巨人，随时要扑过来。');
    await S.say('伊卡博德', '你……你是谁？');
    await S.wait(900);
    await S.narr('没有回答。');
    await S.say('伊卡博德', '你是谁？！', { style: 'big' });
    await S.narr('还是没有回答。');
    await S.narr('你狠狠捶了火药两下，闭上眼睛，扯着嗓子唱起了赞美诗——');
    await psalm(S, 4, false);
    S.sfx('thud');
    await fly(S, 'hessian', 36, 11, 500, 10);
    h.s.hd = 1;
    await S.narr('那个黑影动了。它一窜、一跳，一下子落在了路中间。\n是个骑马的人。个子高得吓人，裹着一件大斗篷，骑着一匹又高又壮的黑马。');
    await S.narr('他不说话，也不过来。就在路边上，等着。');
    camFree(S);
    await S.walk('pl', [35, 10], 3);
    S.show('r_block');
    f.ph = 'escort';
    await S.narr('火药一哆嗦，自己过了桥。\n那个骑马的不声不响，跟了上来——走在火药瞎眼的那一边。');
    S.goal('继续往前骑……别停下');
  }
  async function reveal(S) {
    const f = S.f, h = S.ent('hessian');
    await narrAt(S, Math.round(h.px / TS), 10, '路往上一抬，爬上一道坡。坡顶上没有树，天光淡淡地照下来——\n你身边那个骑马的，一下子被衬了出来。');
    await S.narr('高得吓人。斗篷裹得严严实实。\n斗篷的领子上面——');
    h.s.rev = true; h.light = { r: 1.5, col: 'rgba(255,140,40,.14)', dx: -2, dy: -2 };
    S.sfx('sting');
    await S.scare('face', { face: 'hessian', dur: 1.3, shake: 4 });
    await S.narr('什么也没有。\n他没有头。那颗本该长在他肩膀上的脑袋，搁在他身前的马鞍头上。');
    await S.narr('你疯了似的捶打火药。火药像是挨了一鞭子，一声长嘶，撒开四蹄狂奔起来——');
    neigh(S);
    camFree(S);
    S.place('hessian', Math.max(44, S.pl.x - 5), 11, 2); h.s.hd = 2;
    f.ph = 'chase'; f.st = 100; f.wind = false; f.grazed = false; f.slip = 0;
    resetChase();
    S.goal('逃到教堂桥——他过不了桥！');
    S.cp('chase');
    S.toast('按住跑步键＝策马狂奔（耗气力）；松开＝小跑回气');
    if (S.coop) S.toast('联机：旁观的人看得清岔路口的路牌——替骑马的人指路');
    startChase(S, .9);
  }
  function startChase(S, wait) {
    const h = S.ent('hessian'); h.hidden = false; h.alpha = 1;
    S.chase('hessian', { spd: HSPD, catch: graze });
    h.chase.wait = wait;
    const hud = S.ent('hud'); hud.s = { on: 1, st: 100, w: 0 };
  }
  /* 被追上：第一次擦着后脖颈过去（警告），第二次才死 */
  async function graze(S) {
    const f = S.f;
    if (!f.grazed) {
      f.grazed = true;
      S.sfx('scare'); S.shake(500, 3); S.fx('red'); neigh(S);
      await S.narr('一股冷风擦着你的后脖颈刮过去——\n火药一声惨叫，猛地往前一窜，把那团黑影甩开了几步。');
      placeBack(S);
      f.st = Math.max(f.st, 60); f.wind = false;
      await S.think('不能停，不能慢。下一回，他就不会擦过去了。');
      return startChase(S, .6);
    }
    DEATHS++;
    await S.scare('red', { sfx: 'scream', dur: .8 });
    await S.die('那个没有头的骑手俯下身来，斗篷像一面黑旗，把你整个儿罩住了。\n你最后听见的，是火药一声长嘶。', '他追上来了');
  }
  function placeBack(S) {
    const p = S.pl, m = curMap(), tr = CH.trail;
    for (let i = tr.length - 1; i >= 0; i--) {
      const [x, y] = tr[i]; if (Math.abs(x - p.x) + Math.abs(y - p.y) >= 7 && passable(m, x, y, null)) { S.place('hessian', x, y); return; }
    }
    for (const [dx, dy] of [[-7, 0], [-7, 1], [-7, -1], [-6, 0], [0, -7], [0, 7]]) if (passable(m, p.x + dx, p.y + dy, null)) { S.place('hessian', p.x + dx, p.y + dy); return; }
  }
  async function cross(S) {
    const f = S.f, h = S.ent('hessian'), p = S.pl;
    f.ph = 'cross'; S.stop('hessian');
    S.place('hessian', BR - 2, p.y, 2); h.s.hd = 2;
    S.ent('hud').s = { on: 0 };
    S.lights(null);
    await S.narr('火药的蹄子踏上桥板——「咚、咚、咚」，空空地响了三声。');
    S.show('r_fire'); S.fx('flash'); S.shake(500, 2); S.sfx('thud'); S.tone('sawtooth', 70, 30, 1, .06, 0, 500);
    await S.narr('身后一声马嘶，跟着「呼」地一团火光，把你的影子一下子甩到了前面的路上。');
    S.hide('r_fire'); S.hide('hessian');
    await S.narr('然后，什么声音都没有了。');
    f.ph = 'nolook';
    S.turn(2);
    S.goal('别回头。骑到教堂门口');
    S.cp('nolook');
    await S.think('老布劳尔说：过了桥，别回头。');
  }
  async function lookWarn(S) {
    S.f.warnLook = true;
    await S.narr('你的脖子刚扭过去一半——\n眼角里，桥头那边，好像还有一点火光。');
    await S.think('布罗姆说，他化成一团火，没了。……要是没有呢？');
    S.turn(2);
    await S.narr('你硬生生把脑袋扭了回来，死死盯着火药的两只耳朵。');
    S.toast('再回头，就真的看见了');
  }
  async function lookBack(S) {
    const f = S.f, p = S.pl, h = S.ent('hessian');
    f.ph = 'end';
    S.turn(1);
    S.place('hessian', BR - 2, Math.min(17, Math.max(16, p.y)), 2); h.s.hd = 2; h.s.rise = false; h.alpha = 1;
    camHold = true; S.focus((BR - 2 + p.x) / 2, (h.py / TS + p.y) / 2);
    await S.narr('你回过头去。\n桥那头，那个没有头的骑手还在。他没有化成火。');
    h.s.rise = true; snort(S, .07);
    await S.narr('他在马镫上站了起来，举起鞍头上那颗脑袋——');
    h.s.nohead = true;
    const hd = S.ent('r_head'); S.place('r_head', BR - 2, h.y - 2); hd.hidden = false;
    S.sfx('whisper');
    await fly(S, 'r_head', p.x, p.y, 700, 26);
    S.hide('r_head');
    await S.scare('face', { face: 'head', dur: 1.1, shake: 6, sfx: 'scream' });
    await S.fade(1, 700);
    camFree(S);
    await S.card('第二天早上', '', '火药自己回了汉斯家。没有鞍子，嚼着门口的青草。\n\n大家顺着蹄印找过去：汉斯那副礼拜天的马鞍，被踩进了路边的烂泥里；\n教堂桥下，溪水最急的地方，漂着伊卡博德先生的帽子。\n\n帽子旁边，有一个摔得稀烂的南瓜。');
    await S.end({ bad: true, id: 'lookback', title: '回头看', text: '伊卡博德·克兰先生再也没有回来过。\n汉斯把他留下的那本巫术书和解梦书，一起扔进了炉子里。\n\n老人们说，他是被那个骑马的带走了。\n每次有人说起这件事，布罗姆就笑——\n尤其是有人说到南瓜的时候。\n\n（重来时，会回到教堂桥上。）' });
  }
  async function finale(S) {
    const f = S.f;
    f.ph = 'door'; S.turn(3);
    await S.narr('教堂的石阶就在眼前。门上的铁环，在檐灯底下冷冷地亮着。\n身后，桥那头，有马在刨蹄子。');
    const found = CLUES.filter(([k]) => f[k]);
    if (found.length >= 3) {
      await S.think('你想起了' + found.map(c => c[1]).join('、') + '。');
      if (S.coop) S.toast('联机：两个人商量好再选');
      const r = await S.ask('……那笑声，你在舞会上听了一整晚。', ['推门进教堂，不回头', '转过身去，喊他的名字'], '伊卡博德');
      if (r === 1) return pumpkinEnd(S);
    }
    return goodEnd(S);
  }
  async function goodEnd(S) {
    const f = S.f, n = clueN(S);
    f.ph = 'end';
    S.sfx('knock'); await S.wait(400); S.sfx('knock');
    await S.narr('你几乎是从马背上滚下来的，扑到门前，抓住那个冰凉的铁环。');
    bell(S); await S.wait(600);
    await S.narr('教堂的钟「当」地敲了一下。一点钟。');
    for (let i = 0; i < 6; i++) { S.tone('sine', 95, 45, .1, .07 * (1 - i / 7), i * .35, 500); }
    await S.narr('身后，马蹄声往山坳里去了。越来越远，越来越轻——\n他得赶在天亮以前，回到溪那边的老墓地去。');
    await S.fade(1, 900);
    await S.card('第二天早上', '', '你在教堂的台阶上坐到天亮，然后牵着火药，一步一步走回了威利沼泽。\n\n路上的蹄印，深得像是烙上去的。\n它们追着火药的蹄印，一直追到教堂桥头——\n\n然后就没有了。桥这边，一个也没有。');
    let extra = '';
    if (n >= 3) extra = '\n\n你有时候会想：那天夜里，要是在教堂门口转过身去，喊一声布罗姆的名字，会怎么样？';
    else if (n >= 1) extra = '\n\n只是有一件事，你一直没想通：' + CLUES.filter(([k]) => f[k]).map(c => c[1]).join('、') + '……\n要是那天夜里多留心一点就好了。';
    await S.end({ id: 'bridge', title: '第十一夜　完', text: '没过几天，伊卡博德·克兰先生离开了睡谷。\n有人说他去了纽约，学了法律，后来还当上了法官。\n\n睡谷的老人们讲起那个骑马的，现在会多讲一句：\n「那个教书先生，是过了桥的。他没回头。」' + extra });
  }
  async function pumpkinEnd(S) {
    const f = S.f, p = S.pl, h = S.ent('hessian');
    f.ph = 'end';
    S.turn(1);
    S.place('hessian', BR - 2, 16, 2); h.s.hd = 2; h.s.rise = true; h.alpha = 1;
    camHold = true; S.focus((BR + p.x) / 2, 13);
    await S.narr('你转过身。\n桥那头，那个没有头的骑手勒着马，在马镫上站了起来，正举起鞍头上那颗脑袋——');
    await S.say('伊卡博德', '布罗姆！布罗姆·范·布伦特！', { style: 'big' });
    await S.wait(500);
    await S.narr('他的手，顿了一下。\n然后那颗脑袋还是飞了过来——你一缩脖子。');
    h.s.nohead = true;
    const sx = p.x === 168 ? 169 : 168;
    S.place('r_head', BR - 2, 14); S.ent('r_head').hidden = false;
    await fly(S, 'r_head', sx, 9, 800, 30);
    S.hide('r_head'); S.place('r_smash', sx, 10); S.sfx('splash'); S.shake(300, 2);
    await S.narr('「啪」！\n那颗脑袋砸在教堂的石阶上，摔得稀烂。橙色的瓤溅了一地，还有一股甜丝丝的生南瓜味儿。');
    await S.narr('……是个南瓜。');
    S.sfx('laugh');
    await S.narr('桥那头爆出一阵大笑。\n那笑声，你在舞会上听了一整晚。');
    h.s.rise = false; h.s.hd = 1; S.face('hessian', 1);
    await S.walk('hessian', [BR - 12, 16], 7);
    await S.alpha('hessian', 0, 500);
    await S.fade(1, 900);
    camFree(S);
    await S.card('第二天早上', '', '布罗姆在铁匠铺门口跟人吹牛，说他昨晚早早就回家睡了，一觉睡到大天亮。\n「恶魔」好端端地拴在他家马厩里，四个蹄子干干净净，一点泥都没有。\n\n可你在教堂桥头，看见了那串蹄印。\n又大又深，像是烙进路面里的。它们没有往布罗姆家去——\n它们拐进了溪这边的老墓地，停在一座没有名字的坟前面。');
    await S.end({ id: 'pumpkin', title: '第十一夜　完　·　南瓜', text: '睡谷的人后来分成了两派。\n一派说：那天夜里追伊卡博德的就是布罗姆，那颗脑袋就是个南瓜——他自己都看见了。\n另一派说：南瓜是布罗姆扔的不假，可桥头那串蹄印，不是「恶魔」的。\n\n你一直没说你信哪一派。\n你只是从那以后，再也没在半夜里吹过口哨。\n\n（隐藏结局）' });
  }

  /* ---------- 夜路上每帧：镜头、马速、气力、马蹄声、追逐 ---------- */
  function roadTick(S, dt) {
    const f = S.f, p = S.pl, m = curMap();
    if (!f.ride) return;
    if (!camHold && f.ph !== 'end') S.focus(p.px / TS + (f.hf === 1 ? -3 : 3), p.py / TS);
    const ph = f.ph, h = getEnt('hessian', 'road'), hud = getEnt('hud', 'road');
    if (ph !== 'chase') { S.norun(true); setSpd(S, ph === 'nolook' ? 1 : 1.15); }
    // 火药的马蹄
    if (S.moving) { HO.p -= dt; if (HO.p <= 0) { const run = S.running; HO.p = run ? .12 : .2; HO.k ^= 1; S.tone('triangle', HO.k ? 190 : 160, 80, .05, run ? .05 : .035, 0, 800); if (ph === 'escort') S.tone('sine', 105, 50, .08, .045, .07, 450); } }
    if (ph === 'escort' && h) {   // 他不远不近地跟着：你快他快，你慢他慢，你停他也停
      const tx = p.px - 1.6 * TS, ty = (p.y === 10 ? 11 : 10) * TS, v = 8 * TS * dt;
      const dx = clamp(tx - h.px, -v, v), dy = clamp(ty - h.py, -v * .6, v * .6);
      h.px += dx; h.py += dy; h.x = Math.round(h.px / TS); h.y = Math.round(h.py / TS); h.dir = 2; h.s.hd = 2;
      if (Math.abs(dx) > .05) { h.walked = (h.walked || 0) + Math.abs(dx); h.fr = stepFrame(h.walked); } else h.fr = 0;
    }
    if (ph !== 'chase') return;
    // 气力：狂奔掉，小跑和停下回；掉光了就跑不动，回到 40 才能再跑
    const run = S.running, mov = S.moving;
    f.st = clamp(f.st + (run ? -18 : mov ? 10 : 14) * dt, 0, 100);
    if (f.st <= 0 && !f.wind) { f.wind = true; S.toast('火药喘不上气了！先小跑一阵……'); snort(S); }
    if (f.wind && f.st >= 40) f.wind = false;
    S.norun(!!f.wind);
    let sp = f.wind ? 1.05 : 1.3;
    if (tileName(m, p.x, p.y) === 'mud') sp *= .6;
    if (CH.wobT > 0) { CH.wobT -= dt; sp *= .5; }
    setSpd(S, sp);
    if (hud) { const st = Math.round(f.st), w = f.wind ? 1 : 0; if (hud.s.st !== st || hud.s.w !== w || !hud.s.on) hud.s = { on: 1, st, w }; }
    // 足迹（被擦过之后，把他放回你身后）
    const k = p.x + ',' + p.y; if (k !== CH.lastTile) { CH.lastTile = k; CH.trail.push([p.x, p.y]); if (CH.trail.length > 40) CH.trail.shift(); }
    // 他：离得远了就追得更快（不让你把他甩出视野），踩进泥里一样慢
    let gap = 99;
    if (h && !h.hidden) {
      gap = (Math.abs(h.px - p.px) + Math.abs(h.py - p.py)) / TS;
      if (h.chase) { let hs = gap > 9 ? 7.6 : HSPD - (DEATHS >= 4 ? .5 : 0); if (tileName(m, Math.round(h.px / TS), Math.round(h.py / TS)) === 'mud') hs *= .6; h.chase.spd = hs; }
      if (h.dir === 1 || h.dir === 2) h.s.hd = h.dir;
      if (h.mv) { HO.h -= dt; if (HO.h <= 0) { HO.h = .11; HO.hk = (HO.hk + 1) % 5; if (HO.hk !== 4) { const v = .12 * clamp(1 - gap / 16, .12, 1); S.tone('sine', 92, 42, .1, v, 0, 520); S.tone('triangle', 150, 70, .04, v * .4, 0, 700); } } }
    }
    // 肚带断了：鞍子往下滑的 1.6 秒里别狂奔
    if (!f.slip && p.x >= 124) { f.slip = 1; CH.slipT = 1.6; S.sfx('tear'); S.bubble('pl', '!', 1600); S.toast('肚带断了！鞍子在往下滑——松开快跑，稳住！'); }
    if (f.slip === 1) {
      CH.slipT -= dt;
      if (run && !CH.wobbled && CH.slipT < 1.45) { CH.wobbled = true; CH.wobT = .8; S.shake(300, 2); S.toast('你差点从马背上翻下去！'); }
      if (CH.slipT <= 0) {
        f.slip = 2; f.bare = true; S.take('saddle');
        const [sx, sy] = CH.trail.length > 2 ? CH.trail[CH.trail.length - 3] : [p.x - 2, p.y];
        S.place('r_saddle', sx, sy); S.sfx('thud'); S.toast('鞍子掉了——顾不上了！');
      }
    }
    // 岔口与路上的事
    if (!f.t_up && p.y <= 5 && p.x >= 96 && p.x <= 129) { f.t_up = true; S.toast('（这是回汉斯家的路……可回家的路上，没有桥！）'); }
    if (!f.t_gate && p.y <= 4 && p.x >= 124) { f.t_gate = true; S.run(s => stall(s, '火药一头扎到汉斯家门口——门闩着！只能顺着泥道往下跑！', 1700)); return; }
    if (!f.t_gy && p.y <= 14 && p.x >= 135 && p.x <= 146) { f.t_gy = true; S.run(s => stall(s, '老墓地！火药被一座没名字的坟惊得直往后退——', 450)); return; }
    if (!f.t_riv && p.x >= 136) { f.t_riv = true; S.amb('river'); S.toast('前面有水声。'); }
  }

  defChapter({
    id: 'headless', n: 11, title: '无头骑士', sub: '睡谷的夜路上，有人一声不吭地跟着你的马。他的头，搁在马鞍上。', origin: '美国 · 华盛顿·欧文《睡谷传奇》', color: '#2e2416',
    amb: 'night', floor: 'wood', wall: 'wood', dark: .8, plr: 3,
    endings: { bridge: '过了桥', pumpkin: '南瓜', lookback: '回头看' },
    thumb(g, w, h) {
      const P = (c, x, y, ww, hh) => { g.fillStyle = c; g.fillRect(x, y, ww, hh); };
      g.fillStyle = 'rgba(220,214,190,.16)'; g.beginPath(); g.arc(118, 24, 20, 0, 7); g.fill();
      g.fillStyle = '#e6e0c8'; g.beginPath(); g.arc(118, 24, 11, 0, 7); g.fill();
      P('#0c0a0c', 0, 58, 160, 10); for (let x = 6; x < 160; x += 16) P('#0c0a0c', x, 54, 3, 6);
      const K = '#050406';
      P(K, 52, 38, 34, 12); P(K, 82, 26, 8, 16); P(K, 86, 20, 12, 8); P(K, 96, 23, 3, 4);   // 黑马（扬起前蹄）
      P(K, 84, 46, 4, 10); P(K, 90, 42, 4, 8); P(K, 54, 48, 4, 12); P(K, 62, 48, 4, 10); P(K, 42, 36, 12, 4); P(K, 38, 39, 6, 10);
      P(K, 60, 14, 15, 26); P(K, 74, 18, 10, 12); P(K, 50, 20, 12, 14);   // 斗篷
      P('#1a1820', 61, 12, 13, 3);   // 领子上面空空的
      P(K, 73, 4, 4, 12);            // 举起来的胳膊
      P('#c8701a', 70, -2 + 6, 11, 8); P('#e08a2a', 72, 5, 7, 1); P('#ffe080', 72, 7, 2, 2); P('#ffe080', 77, 7, 2, 2); P('#ffd060', 73, 10, 5, 1);
    },
    people: {
      me: { key: 'hl-me', skin: '#ecd4bc', hair: '#4a3420', hs: 'short', top: '#22202a', top2: '#e8e4d8', bottom: '#3a3428', shoes: '#1a1410', coat: true,
        extra(g, d, fr, G, R) { if (d === 0) { R(3, G.hT + 3, 1, 2, '#e0c4a8'); R(12, G.hT + 3, 1, 2, '#e0c4a8'); R(7, G.hT + 5, 2, 1, '#dcbca0'); } else if (d === 1) { R(3, G.hT + 4, 2, 1, '#ecd4bc'); R(9, G.hT + 3, 1, 2, '#d8b498'); } } },
      katrina: { key: 'hl-kat', skin: '#f4d8c6', hair: '#e2bc66', hs: 'bun', top: '#8a2a34', top2: '#f4ecd8', bottom: '#6a2a3a', dress: true, apron: '#efe6d2', blush: '#f0a0a0', shoes: '#3a2a20' },
      brom: { key: 'hl-brom', skin: '#d8a880', hair: '#2a1a10', hs: 'messy', hat: 'cap', hatC: '#6a4a2a', top: '#5a3a24', top2: '#d8c8a8', bottom: '#2e2a30', shoes: '#1a1410',
        extra(g, d, fr, G, R) { if (d === 0) { R(11, G.hT - 2, 3, 2, '#c8742a'); R(13, G.hT, 1, 3, '#e8e0d0'); } else if (d === 1) { R(10, G.hT - 1, 4, 2, '#c8742a'); R(13, G.hT + 1, 1, 2, '#e8e0d0'); } else { R(6, G.hT - 2, 4, 2, '#c8742a'); } } },
      baltus: { skin: '#eac2a2', hair: '#e2e2da', hs: 'short', top: '#3e4e3a', top2: '#e8e0d0', bottom: '#4a3a2a', shoes: '#2a2018', blush: '#e89a8a' },
      doffue: { skin: '#dcb08c', hair: '#b8b8b0', hs: 'bald', top: '#5a4a3a', top2: '#d8d0c0', bottom: '#3a3028', shoes: '#2a2018', hat: 'cap', hatC: '#3a3a3a' },
      brouwer: { skin: '#e2bc9c', hair: '#f0f0ea', hs: 'short', top: '#4a4a5a', top2: '#d8d8d0', bottom: '#2e2e36', shoes: '#1a1a1a', coat: true },
      fiddler: { key: 'hl-fid', skin: '#e0b894', hair: '#a8a8a8', hs: 'short', top: '#6a2a2a', top2: '#e8e0d0', bottom: '#2a2a30', shoes: '#1a1410',
        extra(g, d, fr, G, R) { if (d === 0) { R(9, G.tT + 1, 3, 4, '#8a4a1a'); R(10, G.tT + 2, 1, 2, '#2a1a0a'); R(2, G.tT + 3 + (fr ? 1 : 0), 8, 1, '#d8c8a0'); } } },
      dm1: { skin: '#e8c0a0', hair: '#6a4a2a', hs: 'short', top: '#2e4a6a', top2: '#e0d8c8', bottom: '#2a2a30', shoes: '#1a1410' },
      dw1: { skin: '#f0d0bc', hair: '#8a5a2a', hs: 'bun', top: '#3a6a4a', bottom: '#3a5a40', dress: true, apron: '#e8e0cc', shoes: '#2a2018' },
      dm2: { skin: '#dcb490', hair: '#2a2020', hs: 'short', top: '#6a5a2a', top2: '#e0d8c8', bottom: '#30302a', shoes: '#1a1410' },
      dw2: { skin: '#f2d4c0', hair: '#c8a060', hs: 'bun', top: '#7a3a6a', bottom: '#5a2a50', dress: true, shoes: '#2a2018' },
      gang1: { skin: '#d8b090', hair: '#3a2a1a', hs: 'messy', top: '#4a5a3a', bottom: '#2a2a2a', shoes: '#1a1410' },
      gang2: { skin: '#e0b898', hair: '#7a4a20', hs: 'short', top: '#5a3a3a', bottom: '#2a2a30', hat: 'cap', hatC: '#3a2a1a', shoes: '#1a1410' }
    },
    faces: {
      /* 没有头的骑手：高领斗篷上面空空的，月亮在领口上方；他手里拎着一颗发着光的脑袋 */
      hessian(R, a, t) {
        R(0, 0, 32, 32, '#06070c'); R(0, 0, 32, 16, '#0c1020');
        R(21, 2, 7, 7, '#cfd4d6'); R(22, 1, 5, 1, '#cfd4d6'); R(22, 9, 5, 1, '#cfd4d6'); R(23, 3, 2, 2, '#b4bcc0');
        R(0, 18, 32, 14, '#0a0a10'); R(2, 16, 28, 4, '#0a0a10'); R(5, 13, 22, 6, '#16161e'); R(8, 14, 16, 4, '#020203');
        R(11, 14, 10, 1, '#3a0c0c'); R(13, 15, 6, 1, '#240606');
        for (let i = 0; i < 5; i++) R(4 + i * 6, 20, 1, 12, '#18181f');
        const gl = .6 + Math.sin(t * 9) * .2 + a * .3;
        R(1, 21, 11, 9, '#7a4012'); R(2, 20, 9, 1, '#7a4012'); R(5, 19, 2, 2, '#2a3a14'); R(4, 21, 1, 9, '#5a2e0c'); R(8, 21, 1, 9, '#5a2e0c');
        const E = `rgba(255,214,110,${clamp(gl, 0, 1).toFixed(2)})`;
        R(3, 23, 2, 2, E); R(8, 23, 2, 2, E); R(3, 27, 6, 1 + Math.round(a * 2), E); R(5, 27, 1, 1, '#7a4012');
        R(2, 29, 9, 3, '#141016');
      },
      /* 扔过来的那颗脑袋：越来越近，嘴越张越大 */
      head(R, a, t) {
        R(0, 0, 32, 32, '#000');
        const gl = .7 + Math.sin(t * 13) * .2;
        R(4, 5, 24, 22, '#9a4e16'); R(6, 4, 20, 1, '#9a4e16'); R(6, 27, 20, 1, '#9a4e16'); R(10, 4, 1, 24, '#7a3a0e'); R(21, 4, 1, 24, '#7a3a0e'); R(15, 4, 2, 24, '#8a4410');
        R(14, 0, 4, 5, '#3a4a1a'); R(17, 1, 3, 1, '#3a4a1a');
        const E = `rgba(255,220,110,${gl.toFixed(2)})`;
        R(7, 10, 6, 2, E); R(8, 12, 4, 2, E); R(9, 14, 2, 1, E); R(19, 10, 6, 2, E); R(20, 12, 4, 2, E); R(21, 14, 2, 1, E);
        const mh = 3 + Math.round(a * 5);
        R(7, 19, 18, mh, E); R(10, 19, 2, 2, '#9a4e16'); R(15, 19, 2, 2, '#9a4e16'); R(20, 19, 2, 2, '#9a4e16'); R(12, 19 + mh - 2, 2, 2, '#9a4e16'); R(18, 19 + mh - 2, 2, 2, '#9a4e16');
      }
    },
    items: {
      lantern: { name: '马灯', desc: '马厩门口挂的煤油马灯。灯罩熏得发黑。' },
      saddle: { name: '汉斯的礼拜天马鞍', desc: '汉斯·范·里帕的宝贝，只有礼拜天上教堂才舍得用。肚带上有个扣眼快磨断了。' }
    },
    notes: {
      fireside: { title: '炉边听来的（记在赞美诗歌本的空白页上）', text: '· 杜夫·马特林：黑森骑兵，打仗时叫炮弹削掉了脑袋。埋在溪这边的老墓地——牧师不让他进教堂的围墙。\n　每夜骑马去战场找脑袋；天亮前得赶回墓地。\n\n· 老布劳尔：被他拽上马背，翻山过沼泽，一直跑到教堂桥上。在桥上回头看了一眼——他变成骷髅，把人扔进溪里，打着雷从树梢上跳走了。\n　「过了桥，别回头。」\n\n· 布罗姆：跟他赛马赌一碗潘趣酒。从威利沼泽往下坡跑，往教堂跑。到了教堂桥头，他化成一团火，没了。\n\n所以：他过不了教堂桥。\n回家的路：过了威利沼泽，岔口上坡是汉斯家，下坡是教堂。\n（下坡路上，左手边就是老墓地。）' },
      hans: { title: '汉斯·范·里帕塞给你的纸条', text: '先生：\n马借给你，鞍子也借给你。鞍子是我礼拜天上教堂用的，弄脏了我可饶不了你。\n肚带上有个扣眼快磨断了，我还没来得及修，别跑太快。\n\n火药老了，可脾气还在。夜里别认错了马——它好认：\n一、脖子往下塌，跟母羊似的；\n二、脑袋大，方得像把锤子；\n三、一只眼睛没有瞳仁，白蒙蒙的，看着吓人；\n四、鬃毛和尾巴从来不梳，打着结，粘满了苍耳。\n\n——汉斯' },
      bible: { title: '范·塔赛尔家大圣经的扉页', text: '（扉页和衬页上，几代人用不同的墨水记着家里和村里的大事。）\n\n1764　巴尔图斯·范·塔赛尔与妻成婚。\n1772　谷仓失火，邻里帮忙，十日重建。\n1776　秋。山那边打了一仗，炮声响了一整天。\n　　　一个黑森骑兵死在路边，头叫炮弹打没了。邻里把他抬回来。\n　　　牧师说他不是本教区的人，不许入教堂的围墙。葬在溪西老墓地。\n　　　头始终没找着。\n1777　凯特琳出生。\n1779　冬。有人说夜里在山坳里听见马蹄声，往溪边去了。\n\n（最后一行是新添的，墨迹还亮：）\n1790　秋。缝被子聚会。请了学堂的克兰先生。' },
      mather: { title: '《新英格兰巫术史》·你折了角的那一页', text: '「……有灵异者，夜行于野，或骑或步，其形可怖。乡人言之凿凿，未可尽斥为妄。\n　古老相传：邪祟不能渡过流动的活水。逃者若能越过溪涧上的桥，追者便止步于彼岸。」\n\n（页边是你自己的小字：）\n布罗姆说的教堂桥——底下就是教堂溪。\n活水。\n\n（再往下，又添了一行，字抖得厉害：）\n可是，过了桥以后呢？' }
    },
    legend: '《睡谷传奇》出自华盛顿·欧文1820年出版的《见闻札记》，托名一位已故的荷兰裔老学究迪德里希·尼克博克留下的遗稿。故事设在大约1790年，哈得孙河东岸、塔里敦附近一道叫「睡谷」的山坳：从康涅狄格来的教书先生伊卡博德·克兰瘦高、迷信、爱唱赞美诗，追求富农范·塔赛尔的独生女凯特琳；他的情敌是村里的好汉布罗姆·范·布伦特，外号「骨头布罗姆」。范·塔赛尔家的聚会散了以后，伊卡博德骑着借来的老马「火药」回家，在威利沼泽边遇见一个一声不吭的骑手，坡顶上才看清他没有头，脑袋搁在马鞍前。伊卡博德被一路追到教堂桥，回头时，那人举起脑袋朝他扔来。第二天，人们只找到他的帽子、被踩坏的马鞍，和一个摔碎的南瓜。欧文没有说破：此后每当有人提起南瓜，布罗姆总是心照不宣地笑。游戏里「布罗姆的恶作剧」和「真的有鬼」两种读法，都来自这个留白。\n\n无头骑士不是欧文的发明。爱尔兰传说里有「杜拉汉」，夹着自己的头骑黑马在夜里报丧；德国和苏格兰的民间故事里也常见无头骑手和夜行的鬼骑队。据说欧文熟悉德国民间故事集，书里就有类似的情节。「邪祟渡不过流水」也是欧洲很古老的说法：1791年的一首苏格兰叙事诗《汤姆·奥桑特》里，女巫们追着醉汉的马，追到桥心就再也追不过去，只扯掉了马尾巴。原作里黑森兵「埋在教堂墓地」「过不了教堂桥」，两条规矩其实并不那么讲理——传说本来就是这样。\n\n睡谷确有其地，在纽约州威彻斯特县；原名北塔里敦的村子在1996年改名「睡谷」。老荷兰教堂建于17世纪末，至今还在，旁边就是老墓地；欧文本人也葬在附近的睡谷公墓。黑森兵是美国独立战争中英国雇来的德意志诸邦军队，1776年秋天这一带确实打过仗，但「被炮弹削掉脑袋的黑森骑兵」查无实据，属于传说。原作里抓获英国少校的那棵大郁金香树，据说真实存在过，欧文写作的时候它已经倒了。\n\n后来的改编数不清：1949年的动画、1999年的电影、好几部电视剧；每年万圣节，睡谷都会办「无头骑士」的游行和夜间活动，那颗南瓜脑袋也成了万圣节最出名的形象之一。\n\n（本章人物都出自欧文原作，老布劳尔、杜夫·马特林原作里也是在聚会上讲故事的人；他们说的话、老墓地在溪这边而教堂在桥那边的地理、马厩里认马、汉斯的纸条、范·塔赛尔家圣经扉页、「过了桥别回头」的规矩、南瓜地与谷仓里的线索、几个结局里的蹄印，均为游戏虚构或改写。）',
    start: { map: 'hall', x: 11, y: 8, dir: 3 },
    resume: {
      chase: async S => {
        const f = S.f; camHold = false; resetChase();
        f.st = 100; f.wind = false; f.grazed = false;
        S.place('hessian', 50, 11, 2); const h = S.ent('hessian'); h.s.hd = 2; h.s.rev = true; h.light = { r: 1.5, col: 'rgba(255,140,40,.14)', dx: -2, dy: -2 };
        S.amb('night');
        if (DEATHS >= 2) for (const id of ['r_sign1', 'r_sign2']) S.ent(id).s.lit = true;
        if (DEATHS >= 3) { const L = []; for (const [x, y] of [[96, 13], [96, 15], [104, 16], [120, 16], [134, 16], [142, 16], [148, 16]]) L.push([x * TS + 8, y * TS + 8, 1.3, .55]); S.lights(L); }
        else S.lights(null);
        const tips = ['跑一阵，缓一阵：火药喘不上气就跑不动了。他过不了教堂桥。', '布罗姆说：从沼泽往下坡跑，往教堂跑。老布劳尔说：听着水声走。', '第一个岔口往下（南），别上坡回汉斯家；第二个岔口别进老墓地，直走过桥。'];
        await S.think(tips[Math.min(DEATHS, 3) - 1] || tips[0]);
        if (DEATHS >= 4) await S.think('（火药好像缓过劲来了，跑得比刚才稳。）');
        startChase(S, .9);
      },
      nolook: async S => {
        camHold = false; S.stop('hessian'); S.hide('hessian'); S.lights(null); S.amb('river'); S.turn(2);
        await S.think('别回头。骑到教堂门口。');
      }
    },
    async intro(S) {
      DEATHS = 0; camHold = false; resetChase();
      await S.card('第十一夜　无头骑士', '1790年秋　纽约州　睡谷', '哈得孙河东岸，塔里敦往北两英里，有一道叫「睡谷」的山坳。\n荷兰人的老村子，老磨坊，老教堂。\n这里的人说，连空气里都有一股叫人做梦的东西。\n\n你叫伊卡博德·克兰，村里学堂的教书先生。\n今晚，范·塔赛尔家办缝被子聚会，全谷的人都来了。\n你向房东汉斯借了他的老马「火药」，穿上了最好的那件黑外套。\n\n凯特琳也在。');
    },
    tick(S, dt) {
      const f = S.f, p = S.pl;
      if (f.ride) {
        if (p.dir === 1 || p.dir === 2) f.hf = p.dir;
        const want = 'ride' + (f.hf === 1 ? 'L' : 'R') + (f.bare ? 'b' : '');
        if (p.spr !== want) S.wear(want);
      }
    },
    sprites: {
      rideR(g, e, t, R) { gunpowder(R, e, t, true, true); staminaBar(R); },
      rideL(g, e, t, R) { gunpowder(R, e, t, false, true); staminaBar(R); },
      rideRb(g, e, t, R) { gunpowder(R, e, t, true, false); staminaBar(R); },
      rideLb(g, e, t, R) { gunpowder(R, e, t, false, false); staminaBar(R); },
      hess(g, e, t, R) { hessian(R, e, t); },
      shorse(g, e, t, R) { stallHorse(R, e, t); },
      head(g, e, t, R) { const gl = .7 + Math.sin(t * 13) * .2; R(3, 3, 10, 9, '#9a4e16'); R(4, 2, 8, 1, '#9a4e16'); R(7, 0, 2, 3, '#3a4a1a'); R(5, 5, 2, 2, `rgba(255,220,110,${gl.toFixed(2)})`); R(9, 5, 2, 2, `rgba(255,220,110,${gl.toFixed(2)})`); R(5, 9, 6, 1, `rgba(255,200,90,${gl.toFixed(2)})`); },
      smash(g, e, t, R) { const O = '#c8701a', O2 = '#e8a040'; R(2, 8, 5, 3, O); R(9, 9, 4, 3, O); R(6, 12, 4, 2, O2); R(1, 13, 3, 1, O2); R(12, 6, 2, 2, O); for (let i = 0; i < 7; i++) R(3 + i * 2, 11 + (i % 3), 1, 1, '#f0e0a8'); R(7, 6, 2, 3, '#3a4a1a'); },
      fireglow(g, e, t, R) { for (let i = 0; i < 6; i++) { const hh = 6 + ((Math.sin(t * 17 + i * 1.9) + 1) * 6) | 0; R(1 + i * 2.5, 14 - hh, 3, hh, i % 2 ? 'rgba(255,170,40,.9)' : 'rgba(255,90,20,.85)'); } R(0, 13, 16, 3, 'rgba(255,220,120,.8)'); },
      fsaddle(g, e, t, R) { R(2, 9, 12, 4, '#3a2010'); R(3, 8, 10, 2, '#5a3a20'); R(4, 13, 8, 1, '#2a1408'); R(13, 11, 3, 1, '#8a8a84'); R(15, 10, 1, 3, '#8a8a84'); R(1, 12, 3, 1, 'rgba(30,22,16,.7)'); },
      log(g, e, t, R) { R(-1, 6, 18, 8, '#2e2014'); R(0, 7, 16, 6, '#4a3420'); R(0, 8, 16, 1, '#5a4430'); R(14, 6, 3, 8, '#7a6040'); R(15, 8, 1, 4, '#5a4430'); R(3, 2, 2, 5, '#3a2a1a'); R(1, 1, 3, 2, '#3a2a1a'); R(9, 4, 1, 3, '#3a2a1a'); },
      post(g, e, t, R) {
        R(7, -10, 2, 25, '#4a3420'); R(0, -14, 16, 6, '#6a5038'); R(0, -6, 16, 6, '#6a5038'); R(0, -14, 16, 1, '#7a6048'); R(0, -6, 16, 1, '#7a6048');
        const see = e.lit || !iControl(), I = '#1a120a';
        if (!see) { R(3, -12, 9, 2, '#4a3828'); R(3, -4, 9, 2, '#4a3828'); return; }
        if (e.kind === 1) {   // 上：房子（汉斯家） 下：十字（教堂）
          R(2, -12, 1, 3, I); R(1, -11, 3, 1, I); R(6, -12, 5, 3, I); R(7, -13, 3, 1, I); R(8, -11, 1, 2, '#6a5038');
          R(2, -4, 1, 3, I); R(1, -2, 3, 1, I); R(8, -5, 1, 5, I); R(6, -4, 5, 1, I);
        } else {               // 上：墓碑（老墓地） 右：十字（教堂桥）
          R(2, -12, 1, 3, I); R(1, -11, 3, 1, I); R(7, -13, 4, 4, I); R(8, -12, 2, 1, '#6a5038');
          R(12, -4, 3, 1, I); R(13, -5, 1, 3, I); R(5, -5, 1, 5, I); R(3, -4, 5, 1, I);
        }
      },
      hgate(g, e, t, R) { R(-1, -6, 4, 37, '#3a2a1a'); R(13, -6, 4, 37, '#3a2a1a'); for (let y = -2; y < 30; y += 6) R(2, y, 12, 2, '#5a4430'); R(3, 8, 10, 3, '#2a1a10'); R(7, 9, 2, 1, '#8a8a84'); },
      tulip(g, e, t, R) {
        const B = '#241a12', B2 = '#3a2c1e', B3 = '#2e2218';
        R(18, 6, 14, 42, B); R(20, 8, 3, 38, B2); R(27, 12, 2, 30, B3); R(10, 44, 30, 4, B); R(14, 42, 6, 3, B);
        R(4, -4, 16, 5, B); R(0, -14, 6, 12, B); R(30, -8, 16, 5, B); R(42, -22, 5, 16, B); R(14, -26, 5, 24, B); R(24, -34, 5, 30, B); R(6, -32, 10, 4, B); R(28, -38, 14, 4, B); R(-4, -16, 6, 3, B); R(44, -26, 6, 3, B);
        R(22, 18, 4, 10, '#d8d2c0'); R(23, 20, 2, 6, '#f2eee2');
        for (let i = 0; i < 22; i++) R((hash(i, 1, 7) * 52 | 0) - 4, (hash(i, 2, 7) * 40 | 0) - 40, 3, 2, i % 2 ? '#1c2418' : '#2a2a1a');
      },
      church(g, e, t, R) {
        const S1 = '#5c5850', S2 = '#46423c', RF = '#1a1618';
        R(8, 16, 128, 64, S2); R(10, 18, 124, 62, S1);
        for (let y = 22; y < 78; y += 6) for (let x = 12 + ((y / 6) % 2) * 6; x < 132; x += 12) R(x, y, 9, 1, S2);
        R(0, 6, 144, 12, RF); R(14, -4, 116, 12, RF); R(0, 16, 144, 2, '#2a2628');
        R(60, -26, 24, 24, '#3a3632'); R(64, -22, 16, 10, '#0a0a0c'); R(69, -19, 6, 6, '#7a6a3a'); R(66, -40, 12, 14, RF); R(70, -50, 4, 10, RF); R(71, -56, 2, 6, '#5a5650');
        for (const x of [22, 44, 94, 116]) { R(x, 30, 10, 20, '#2a2830'); R(x + 1, 31, 8, 18, '#1a1e2a'); R(x + 2, 28, 6, 2, '#2a2830'); R(x + 4, 31, 1, 18, '#2a2830'); }
        R(62, 50, 20, 30, '#2a1a10'); R(64, 52, 16, 28, '#4a2e18'); R(66, 48, 12, 3, '#2a1a10'); R(71, 52, 1, 28, '#2a1a10'); R(74, 66, 2, 2, '#c8b878');
        R(86, 50, 4, 6, '#3a3020'); R(87, 51, 2, 4, '#ffd88a');
      },
      stalldiv(g, e, t, R) { R(5, -12, 6, 28, '#3a2614'); R(6, -12, 4, 28, '#5a3e24'); R(6, -6, 4, 1, '#3a2614'); R(6, 4, 4, 1, '#3a2614'); R(4, -14, 8, 3, '#2a1a0c');
        if (e.full) { R(1, -4, 14, 9, '#3a2010'); R(2, -5, 12, 2, '#6a4a2a'); R(3, -2, 10, 1, '#5a3a20'); R(7, 5, 2, 5, '#8a8a84'); R(6, 10, 4, 1, '#8a8a84'); R(12, 1, 2, 6, '#4a2e18'); R(12, 3, 2, 1, '#c8c0a8'); } },
      stallempty(g, e, t, R) { R(1, 10, 14, 5, '#8a7a40'); for (let i = 0; i < 9; i++) R(1 + (hash(i, 3, 5) * 13 | 0), 9 + (hash(i, 4, 5) * 5 | 0), 2, 1, '#b8a058'); R(3, -10, 10, 6, '#3a2614'); R(4, -9, 8, 4, '#c8b888'); R(5, -8, 6, 1, '#3a2614'); R(6, -6, 4, 1, '#3a2614'); R(12, 0, 1, 9, '#6a5030'); R(11, 8, 3, 1, '#6a5030'); R(2, 3, 5, 3, '#4a3a20'); },
      lpost(g, e, t, R) { R(7, -10, 2, 25, '#4a3420'); R(5, -12, 6, 2, '#3a2614'); if (!e.off) { R(4, -9, 8, 9, '#3a3a38'); R(5, -8, 6, 7, '#f0b050'); R(6, -6, 4, 3, '#fff0b0'); } else R(5, -9, 1, 4, '#6a6a66'); },
      hay(g, e, t, R) { R(0, 2, 32, 13, '#9a8440'); R(1, 1, 30, 3, '#c8a850'); for (let i = 0; i < 16; i++) R((hash(i, 1, 9) * 30) | 0, 3 + (hash(i, 2, 9) * 11 | 0), 3, 1, i % 2 ? '#7a6a30' : '#d8b860'); },
      feast(g, e, t, R) {
        const c = '#6b4a30'; R(0, 2, 64, 11, '#4a3020'); R(1, 3, 62, 9, c); R(1, 3, 62, 2, shade(c, .15)); R(2, 12, 2, 4, '#3a2414'); R(60, 12, 2, 4, '#3a2414'); R(1, 6, 62, 4, '#e8e0cc'); R(1, 9, 62, 1, '#c8c0a8');
        R(4, 0, 10, 5, '#a8682a'); R(5, 1, 8, 3, '#e09a3a'); R(6, 1, 2, 1, '#f0c060');
        R(17, -1, 9, 6, '#c8a070'); R(18, 0, 7, 4, '#a85a2a'); R(19, 1, 2, 1, '#e8c890');
        for (const x of [29, 33, 31]) { R(x, x === 31 ? -1 : 1, 4, 3, '#a86a30'); R(x + 1, x === 31 ? 0 : 2, 2, 1, '#5a3a1a'); }
        R(41, -2, 11, 6, '#b05a4a'); R(42, -1, 9, 2, '#e8a090'); R(51, 0, 4, 2, '#f0e8d8');
        R(56, 0, 7, 5, '#d8d4c8'); R(57, 0, 5, 1, '#fffaf0');
        R(27, -6, 1, 6, '#efe6c8'); R(27, -8, 1, 2, Math.sin(t * 9) > 0 ? '#ffd060' : '#ffb040'); R(39, -6, 1, 6, '#efe6c8'); R(39, -8, 1, 2, Math.sin(t * 8 + 1) > 0 ? '#ffd060' : '#ffb040');
      },
      quilt(g, e, t, R) { R(0, 2, 48, 13, '#4a3020'); R(2, 4, 44, 9, '#e8dcc0'); const P = ['#a83a3a', '#3a6a8a', '#d8b850', '#5a8a4a', '#8a4a7a']; for (let i = 0; i < 11; i++) for (let j = 0; j < 2; j++) if ((i + j) % 3 !== 2) R(3 + i * 4, 5 + j * 4, 3, 3, P[(i * 2 + j) % P.length]); R(1, 14, 2, 2, '#3a2414'); R(45, 14, 2, 2, '#3a2414'); R(30, 3, 1, 2, '#c8c8c8'); },
      wheel(g, e, t, R) { const a = t * .6; R(2, 10, 12, 3, '#5a3a20'); R(3, 13, 2, 3, '#4a2e18'); R(11, 13, 2, 3, '#4a2e18'); R(7, -4, 2, 15, '#4a2e18'); for (let i = 0; i < 8; i++) { const k = a + i * Math.PI / 4; R(8 + Math.cos(k) * 6, 1 + Math.sin(k) * 6, 1, 1, '#7a5a3a'); } R(7, 0, 2, 2, '#3a2414'); R(12, -6, 2, 6, '#d8ccb0'); },
      lectern(g, e, t, R) { R(5, 3, 6, 12, '#4a2e18'); R(3, 14, 10, 2, '#3a2414'); R(1, -1, 14, 5, '#3a2414'); R(2, -2, 5, 4, '#e8e0c8'); R(9, -2, 5, 4, '#e8e0c8'); R(7, -2, 2, 5, '#5a1a10'); R(3, -1, 3, 1, '#a8a090'); R(10, -1, 3, 1, '#a8a090'); },
      seat(g, e, t, R) { R(0, 4, 32, 9, '#5a3a24'); R(0, 4, 32, 2, '#7a5a3a'); R(1, 13, 2, 3, '#3a2414'); R(29, 13, 2, 3, '#3a2414'); R(18, 1, 8, 4, '#2a3a2a'); R(18, 1, 8, 1, '#4a5a4a'); R(25, 1, 1, 2, '#e8e0c8'); R(5, 2, 7, 3, '#8a2a2a'); },
      seeds(g, e, t, R) { for (const [x, y] of [[4, 8], [7, 10], [10, 7], [9, 12], [5, 12]]) { R(x, y, 2, 1, '#efe2b0'); R(x, y + 1, 1, 1, '#d8c890'); } R(6, 9, 4, 1, '#d88a2a'); R(8, 11, 3, 1, '#c8781a'); },
      pumpkin(g, e, t, R) { R(2, 13, 12, 2, 'rgba(0,0,0,.3)'); R(2, 6, 12, 8, '#b8641a'); R(3, 5, 10, 1, '#b8641a'); R(3, 14, 10, 1, '#8a4810'); R(5, 6, 1, 8, '#8a4810'); R(10, 6, 1, 8, '#8a4810'); R(4, 7, 1, 2, '#d8843a'); R(7, 2, 2, 4, '#3a4a1a'); R(9, 3, 3, 1, '#4a5a2a'); },
      stem(g, e, t, R) { R(1, 9, 14, 2, '#3a4a1a'); R(2, 8, 3, 1, '#4a6a2a'); R(10, 11, 4, 2, '#4a6a2a'); R(6, 6, 3, 4, '#4a5a2a'); R(6, 5, 3, 1, '#d8e8a0'); R(7, 5, 1, 1, '#f0f8d0'); R(4, 12, 8, 2, 'rgba(60,40,20,.6)'); },
      crack(g, e, t, R) { const gl = .35 + Math.sin(t * 3) * .15; R(7, 1, 1, 4, '#1a1008'); R(8, 4, 1, 4, '#1a1008'); R(7, 8, 1, 5, '#1a1008'); R(7, 2, 1, 10, `rgba(255,200,100,${gl.toFixed(2)})`); },
      haycart(g, e, t, R) { R(0, 4, 32, 7, '#5a3a20'); R(1, -4, 30, 9, '#a89048'); R(2, -5, 26, 2, '#c8a858'); for (let i = 0; i < 8; i++) R(2 + i * 3.5, -3 + (i % 3), 3, 1, '#7a6a30'); R(4, 9, 7, 7, '#3a2414'); R(6, 11, 3, 3, '#5a3a20'); R(22, 9, 7, 7, '#3a2414'); R(24, 11, 3, 3, '#5a3a20'); },
      scarecrow(g, e, t, R) { const s = Math.round(Math.sin(t * 1.4) * .6); R(7, -4, 2, 19, '#4a3420'); R(1, -1, 14, 2, '#4a3420'); R(3, -2 + s, 10, 9, '#3a3a5a'); R(1, -1 + s, 3, 6, '#3a3a5a'); R(12, -1 + s, 3, 6, '#3a3a5a'); R(1, 5 + s, 2, 2, '#c8a858'); R(13, 5 + s, 2, 2, '#c8a858'); R(4, -10, 8, 8, '#8a6a3a'); R(5, -11, 6, 1, '#8a6a3a'); R(5, -8, 2, 2, '#1a120a'); R(9, -8, 2, 2, '#1a120a'); R(5, -5, 6, 1, '#1a120a'); R(3, -12, 10, 2, '#4a3a20'); }
    },
    tiles: {
      plank: { solid: false, paint(R, X, Y) { R(0, 0, 16, 16, '#3a2a1a'); for (let x = 0; x < 16; x += 4) { R(x, 0, 3, 16, shade('#6a5034', (hash(X * 4 + x, Y, 3) - .5) * .3)); R(x + 3, 0, 1, 16, '#1e140c'); } R(0, 0, 16, 1, '#2a1c10'); R(0, 15, 16, 1, '#2a1c10'); } },
      vine: { solid: false, paint(R, X, Y) { speck(R, '#3a2e1e', ['#4a3a26', '#2e2418'], X, Y, 14, 31); for (let i = 0; i < 3; i++) { const x = (hash(X, Y, i + 40) * 12) | 0, y = (hash(X, Y, i + 50) * 12) | 0; R(x, y, 4, 2, '#2e4a22'); R(x + 1, y - 1, 2, 1, '#3e5a2a'); } } }
    },
    tileOpts: { grassC: '#232e20', treeC: '#16221a' },
    maps: {
      /* ---------------- 范·塔赛尔家的客厅：缝被子聚会 ---------------- */
      hall: {
        amb: 'fire', dark: .38, plr: 4, wall: 'wood', floor: 'wood', tileOpts: { woodC: '#6a4a2e', rugC: '#6a2e2a' },
        rows: [
          '########################',
          '########################',
          '#wwwwwwwwwwwwwwwwwwwwww#',
          '#wwwwwwwwwwwwwwwwwwwwww#',
          '#wwwwwwwwwwwwwwwwwwwwww#',
          '#wwwwwrrrrrrrrrrrwwwwww#',
          '#wwwwwrrrrrrrrrrrwwwwww#',
          '#wwwwwrrrrrrrrrrrwwwwww#',
          '#wwwwwwwwwwwwwwwwwwwwww#',
          '#wwwwwwwwwwwwwwwwwwwwww#',
          '#wwwwwwwwwwwwwwwwwwwwww#',
          '###########w############'],
        ents: [
          { id: 'h_fire', x: 2, y: 2, w: 2, spr: 'fireplace', light: { r: 5, col: 'rgba(255,140,60,.24)', flick: true }, on: S => S.narr('炉膛里烧着一整段苹果木，噼啪作响。\n火光把老人们的影子投在墙上，拉得老长，像一群弓着背的骑手。') },
          { id: 'h_doffue', x: 1, y: 3, spr: '@doffue', dir: 2, on: doffueTale },
          { id: 'h_brouwer', x: 4, y: 3, spr: '@brouwer', dir: 1, on: brouwerTale },
          { id: 'h_brom', x: 3, y: 5, spr: '@brom', dir: 3, on: bromTale },
          { id: 'h_g1', x: 2, y: 6, spr: '@gang1', dir: 3, on: S => S.narr('布罗姆的跟班。他瞅着你，憋着笑，憋得脸都红了。') },
          { id: 'h_g2', x: 4, y: 6, spr: '@gang2', dir: 3, on: S => S.narr('另一个跟班，帽子歪戴着。他凑到同伴耳边说了句什么，两个人一起「噗」地笑出了声。') },
          { id: 'h_win1', x: 6, y: 1, spr: 'window', on: S => S.narr('窗外黑得像锅底。\n远处的哈得孙河上有一点灯，是一条夜航的单桅船。') },
          { id: 'h_portrait', x: 9, y: 1, spr: 'portrait', on: S => S.narr('范·塔赛尔家的老太爷，从画框里板着脸看你。\n他看起来不太赞成你今晚吃第三块南瓜派。') },
          { id: 'h_win2', x: 12, y: 1, spr: 'window', on: S => S.narr('玻璃上蒙着一层哈气。有人在上面画了一个小人，骑着马，脑袋画得特别大。') },
          { id: 'h_win3', x: 17, y: 1, spr: 'window', on: S => S.narr('窗外是范·塔赛尔家的果园和麦垛。\n要是娶了凯特琳，这些……你赶紧把这个念头掐了。') },
          { id: 'h_feast', x: 7, y: 3, w: 4, spr: 'feast', async on(S) {
            await S.narr('满满一桌：油炸甜甜圈、荷兰油饼、脆麻花、姜饼、蜂蜜蛋糕；苹果派、桃子派、南瓜派；一片片火腿和熏牛肉；蜜饯李子、桃子、梨；一大碗牛奶和奶油……');
            await S.think('你在心里把桌上的每一样都换算了一遍：要是娶了凯特琳，这些就都是——\n……咳。');
          } },
          { id: 'h_fiddler', x: 14, y: 3, spr: '@fiddler', dir: 0, on: S => S.say('老琴师', S.f.kat ? '（他在擦琴。）路上黑，先生。听见什么，都别回头。' : '（他一边拉，一边冲你挤挤眼。）先生，再来一支？') },
          { id: 'h_clock', x: 22, y: 2, spr: 'clock', on: S => S.narr('高脚座钟。指针快到十二点了。\n钟摆每晃一下，炉子里的火就好像暗了一点。') },
          { id: 'h_mbook', x: 19, y: 2, w: 2, spr: 'seat', async on(S) { if (S.once('mb')) await S.narr('窗台下的长凳上，放着你那本《新英格兰巫术史》——你走到哪儿都揣着它。\n凯特琳刚才问你能不能借她看看，你没舍得。'); await S.note('mather'); } },
          { id: 'h_kat', x: 12, y: 6, spr: '@katrina', dir: 0, on: katTalk },
          { id: 'h_baltus', x: 18, y: 4, spr: '@baltus', dir: 0, async on(S) {
            const L = ['吃，先生，吃！别客气，自己动手。', ['乌鸦岩那边那条黑沟里，有个穿白衣裳的女人。', '冬天起风暴前，她就在沟里叫——叫得人心里发毛。她是冻死在雪里的。'], '布罗姆那小子，骑马是一把好手。就是嘴欠。', '（他抽着烟斗，眯着眼睛看了你一会儿，又看了看凯特琳，没说话。）'];
            await S.say('巴尔图斯·范·塔赛尔', L[(S.f._bl = ((S.f._bl ?? -1) + 1) % L.length)]);
          } },
          { id: 'h_d1', x: 8, y: 6, spr: '@dm1', dir: 2, on: S => S.narr('一对年轻人跳得正欢，鞋跟把地板踩得咚咚响。') },
          { id: 'h_d2', x: 9, y: 6, spr: '@dw1', dir: 1, on: S => S.narr('她的裙子转起来，像一朵倒扣的花。') },
          { id: 'h_d3', x: 14, y: 7, spr: '@dm2', dir: 2, on: S => S.narr('他跳得满头大汗，还在跟着琴声吹口哨。') },
          { id: 'h_d4', x: 15, y: 7, spr: '@dw2', dir: 1, on: S => S.narr('她冲你笑了笑：「先生，刚才那支，您跳得可真卖力。」') },
          { id: 'h_quilt', x: 17, y: 9, w: 3, spr: 'quilt', on: S => S.narr('缝了一半的百衲被绷在木架上。下午的时候，全谷的太太们围着它缝了一下午，嘴也没闲着。\n被角上绣着一行字：1790年秋。') },
          { id: 'h_wheel', x: 21, y: 9, spr: 'wheel', on: S => S.narr('纺车。轮子自己还在慢慢地转——大概是谁跳舞的时候碰了一下。') },
          { id: 'h_bible', x: 2, y: 9, spr: 'lectern', async on(S) { if (S.once('bb')) await S.narr('架子上摊着范·塔赛尔家的大圣经，比你的歌本厚十倍。扉页上密密麻麻写满了字。'); await S.note('bible'); } },
          { id: 'h_seeds', x: 10, y: 10, spr: 'seeds', decal: true, solid: false, hidden: true, on(S) { S.f.c_seeds = true; return S.narr('门边的地板上，有几粒南瓜子。湿漉漉的，还连着几丝橙色的瓤。\n布罗姆他们刚才就是从这儿出去的。'); } },
          { id: 'h_exit', x: 11, y: 11, spr: 'invisible', async touch(S) {
            const f = S.f;
            if (!f.tales) { await S.narr('故事还没听完呢。这么好的机会，你舍不得走。'); return S.walk('pl', 'u', 5); }
            if (!f.kat) { await S.narr('你还没跟凯特琳说上话。今晚不说，就再也没机会了。'); return S.walk('pl', 'u', 5); }
            await S.go('yard', 6, 2, 0);
          } }
        ],
        async enter(S, first) {
          if (!first) return;
          await S.narr('小提琴拉得正欢。老琴师一边拉，一边跟着拍子点头，点得帽子都快掉了。');
          await S.narr('你刚跟凯特琳跳完一支。你跳舞的时候，浑身上下没有一根骨头是闲着的——满屋子的人都看见了。');
          await S.think('她冲你笑了。冲你，不是冲布罗姆。');
          S.face('h_kat', 'pl');
          await S.say('凯特琳', '先生，您歇一会儿吧。壁炉那边，老人们又要讲故事了。');
          talesGoal(S);
          if (S.coop) S.toast('联机：两个人可以分头去听壁炉边的三个故事');
        },
        tick(S, dt) {
          if (S.f.kat) return;
          MUS.t -= dt; if (MUS.t > 0) return;
          const [fq, n] = JIG[MUS.i % JIG.length], b = .17;
          if (fq) S.tone('sawtooth', fq, fq, n * b * .9, .016, 0, 1700);
          if (MUS.i % 3 === 0) S.tone('triangle', MUS.i % 6 ? 110 : 147, MUS.i % 6 ? 110 : 147, b * 1.6, .03, 0, 600);
          MUS.t = n * b; MUS.i++;
          if (MUS.i % 3 === 0) for (const id of ['h_d1', 'h_d2', 'h_d3', 'h_d4']) { const e = getEnt(id, 'hall'); if (e && !e.hidden) { e.dir = e.dir === 1 ? 2 : 1; e.oy = e.oy ? 0 : -1; } }
        }
      },
      /* ---------------- 范·塔赛尔家的院子 ---------------- */
      yard: {
        amb: 'night', dark: .8, plr: 3, wall: 'wood', floor: 'dirt',
        legend: { 'v': 'vine' },
        rows: yardRows(),
        ents: [
          { id: 'y_door', x: 6, y: 1, spr: 'door', col: '#4a2e18', lock: S => !S.f.ride, lockMsg: '你已经骑在马上了。屋里的灯一盏一盏地灭了，别回去了。', to: ['hall', 11, 10, 3] },
          { id: 'y_win1', x: 3, y: 1, spr: 'window', lit: true, light: { r: 2.4, col: 'rgba(255,200,120,.18)', dy: 22 }, on: S => S.narr('窗户里，凯特琳正在收拾桌子。\n她没往外看。') },
          { id: 'y_win2', x: 9, y: 1, spr: 'window', lit: true, light: { r: 2.4, col: 'rgba(255,200,120,.18)', dy: 22 }, on: S => S.narr('老琴师坐在炉边擦他的琴。屋里一下子安静得吓人。') },
          { id: 'y_well', x: 11, y: 5, spr: 'well', on: S => S.narr('井。你往下看了一眼，黑洞洞的，什么也看不见。\n井里「咚」地落下一滴水，回声过了很久才传上来。') },
          { id: 'y_cart', x: 8, y: 5, w: 2, spr: 'haycart', on: S => S.narr('一车干草，等着明天进谷仓。车辙里积着雨水，映着一点灯光。') },
          { id: 'y_sdoor', x: 4, y: 10, spr: 'door', col: '#5a3a20', lock: S => !S.f.ride, lockMsg: '火药说什么也不肯再进马厩了。', to: ['stable', 7, 7, 3] },
          { id: 'y_bdoor', x: 22, y: 6, spr: 'door', col: '#5a2a1a', on: S => { S.sfx('locked'); return S.narr('谷仓的门从里面闩上了。\n里头有人在笑，笑得压着嗓子。'); } },
          { id: 'y_bwin', x: 20, y: 6, spr: 'window', lit: true, light: { r: 2, col: 'rgba(255,190,110,.16)', dy: 22 }, on: S => S.narr('谷仓的小窗户上糊着油纸，看不清里面。\n影子晃来晃去，好像有好几个人，围着一个圆滚滚的东西。') },
          { id: 'y_crack', x: 25, y: 6, spr: 'crack', async on(S) {
            if (S.f.c_whisper) return S.narr('板缝里漏出一线灯光。里头的人已经不说话了。');
            await S.narr('谷仓的木板墙上裂了一道缝，漏出一线灯光。你把耳朵凑了上去——');
            await S.say('谷仓里的声音', ['……布罗姆呢？', '早走了。骑着「恶魔」走的，怀里还揣着个——', '嘘！你小点声！', '……他说了，今晚要请那位先生「看场戏」。'], { style: 'whisper' });
            S.sfx('laugh');
            await S.narr('里头爆出一阵憋不住的笑，跟着是「啪」的一巴掌，又安静了。');
            S.f.c_whisper = true;
          } },
          { id: 'y_scare', x: 17, y: 10, spr: 'scarecrow', on: S => S.narr('南瓜地里的稻草人，穿着一件旧军装。\n它的脑袋是一个干瘪的老南瓜，眼睛和嘴是用刀剜出来的，在风里一晃一晃，像是在点头。') },
          { id: 'y_p1', x: 19, y: 10, spr: 'pumpkin', on: S => S.narr('一个大南瓜，圆滚滚的，敲上去「咚咚」响。') },
          { id: 'y_p2', x: 22, y: 9, spr: 'pumpkin', on: S => S.narr('南瓜上被人用指甲划了一张笑脸。') },
          { id: 'y_p3', x: 23, y: 12, spr: 'pumpkin', on: S => S.narr('这个南瓜都快烂了，底下爬满了潮虫。') },
          { id: 'y_p4', x: 17, y: 12, spr: 'pumpkin', on: S => S.narr('范·塔赛尔家的南瓜，是全谷最大的。今年也不例外。') },
          { id: 'y_stem', x: 20, y: 12, spr: 'stem', async on(S) {
            await S.narr('南瓜地正当中，空出了一块。\n藤上留着一截断茬——断口齐齐的，是刀割的，还湿着。');
            await S.think('这块地方……原来应该长着全地里最大的那个南瓜。\n谁大半夜的来割南瓜？');
            S.f.c_stem = true;
          } },
          { id: 'y_gate1', x: 13, y: 15, spr: 'invisible', touch: S => yardGate(S) },
          { id: 'y_gate2', x: 14, y: 15, spr: 'invisible', touch: S => yardGate(S) },
          { id: 'y_lamp', x: 13, y: 14, spr: 'invisible', light: { r: 2.2, col: 'rgba(180,200,255,.06)' } }
        ],
        async enter(S, first) {
          if (!first) return;
          await S.narr('冷风一下子灌进了领口。门在身后关上，琴声和笑声都被关在了里头。\n马厩在左手边。谷仓那边还亮着灯。');
        },
        tick(S, dt) {
          if (S.f.ride) { S.norun(true); setSpd(S, 1.15); if (S.moving) { HO.p -= dt; if (HO.p <= 0) { HO.p = .2; HO.k ^= 1; S.tone('triangle', HO.k ? 190 : 160, 80, .05, .035, 0, 800); } } }
          if (!S.f.c_whisper) { MUS.t -= dt; if (MUS.t <= 0) { MUS.t = 8 + Math.random() * 5; S.sfx('laugh'); } }
        }
      },
      /* ---------------- 马厩 ---------------- */
      stable: {
        amb: 'room', dark: .92, plr: 1.1, wall: 'wood', floor: 'dirt',
        rows: [
          '################',
          '################',
          '#..............#',
          '#..............#',
          '#..............#',
          '#..............#',
          '#..............#',
          '#..............#',
          '#######.########'],
        ents: [
          { id: 's_a', x: 1, y: 2, spr: 'shorse', col: '#1e1c22', mane: '#0e0c10', on: inspectHorse },
          { id: 's_div2', x: 2, y: 2, spr: 'stalldiv', on: S => S.narr('隔板上钉着一块小木牌：「范·塔赛尔」。') },
          { id: 's_dd', x: 3, y: 2, spr: 'stallempty', async on(S) {
            await S.narr('这个隔间是空的。木牌上刻着两个字：「恶魔」——布罗姆那匹黑马。');
            await S.narr('缰绳挂在栏杆上，是解开的，不是挣断的。马槽里的燕麦还剩一半。');
            await S.think('布罗姆刚才不是说，他先「走一步」吗？\n……他走得可真急。');
            S.f.c_stall = true;
          } },
          { id: 's_div4', x: 4, y: 2, spr: 'stalldiv', on: S => S.narr('隔板上全是马啃出来的牙印。') },
          { id: 's_e', x: 5, y: 2, spr: 'shorse', col: '#8a4a2a', mane: '#6a2e16', ewe: true, ham: true, burrM: true, burrT: true, on: inspectHorse },
          { id: 's_div6', x: 6, y: 2, spr: 'stalldiv', on: S => S.narr('隔板上挂着一把马刷，刷毛里缠着锈红色的马毛。') },
          { id: 's_gp', x: 7, y: 2, spr: 'shorse', col: '#7a4a2a', mane: '#8a3e1e', ewe: true, ham: true, eyeL: 'w', burrM: true, burrT: true, on: inspectHorse },
          { id: 's_div8', x: 8, y: 2, spr: 'stalldiv', on: S => S.narr('一根光秃秃的木桩。') },
          { id: 's_d', x: 9, y: 2, spr: 'shorse', col: '#8a4426', mane: '#6a2e16', ham: true, eyeR: 'w', braid: true, on: inspectHorse },
          { id: 's_peg', x: 10, y: 2, spr: 'stalldiv', full: true, async on(S) {
            const e = S.ent('s_peg');
            if (!e.full) return S.narr('木桩上空了。汉斯的鞍子在你手里。');
            await S.narr('锈红马隔间边的木桩上，挂着一副马鞍——汉斯·范·里帕那副礼拜天才舍得用的宝贝。\n大概是长工卸下来，随手挂在了这儿。');
            await S.narr('肚带上那个扣眼，磨得只剩薄薄的一层皮了。');
            e.full = false; S.give('saddle');
            if (S.f.gpFound) S.goal('给火药备上鞍子');
          } },
          { id: 's_b', x: 11, y: 2, spr: 'shorse', col: '#a8a49c', mane: '#d8d4cc', eyeL: 'c', eyeR: 'c', burrT: true, on: inspectHorse },
          { id: 's_div12', x: 12, y: 2, spr: 'stalldiv', on: S => S.narr('隔板后面堆着干草。') },
          { id: 's_hay', x: 13, y: 2, w: 2, spr: 'hay', on: S => S.narr('干草堆。里头窸窸窣窣的——是老鼠，还是别的什么。') },
          { id: 's_lant', x: 8, y: 7, spr: 'lpost', light: { r: 2.6, col: 'rgba(255,190,90,.2)', dy: -6 }, async on(S) {
            const e = S.ent('s_lant');
            if (e.off) return S.narr('挂马灯的木柱子。');
            e.off = true; S.give('lantern'); S.plr(3.4); S.sfx('match');
            await S.narr('你把马灯从钩子上摘下来，提在手里。\n灯光一晃，一排马脑袋齐刷刷地转过来，眼睛里映着一点一点的光。');
            S.goal('认出火药（汉斯的纸条：按 J 能重看）');
          } },
          { id: 's_bucket', x: 1, y: 6, spr: 'barrel', on: S => S.narr('一桶水。水面上浮着几根草。') },
          { id: 's_sack', x: 14, y: 5, spr: 'sack', on: S => S.narr('一袋燕麦。袋口被老鼠咬了个洞。') },
          { id: 's_crate', x: 14, y: 6, spr: 'crate', on: S => S.narr('装马具的木箱。里头乱七八糟的，有铁掌、钉子，还有一顶不知道谁落下的旧皮帽，帽檐上缝着一条狐狸尾巴。') },
          { id: 's_exit', x: 7, y: 8, spr: 'invisible', async touch(S) { if (S.has('lantern')) { S.take('lantern', true); S.ent('s_lant').off = false; S.plr(null); S.toast('你把马灯挂回了门口'); } await S.go('yard', 4, 11, 0); } }
        ],
        async enter(S, first) {
          S.plr(S.has('lantern') ? 3.4 : null);
          if (!first) return;
          await S.narr('马厩里一股干草和马汗的味儿。黑得伸手不见五指，一排马在黑暗里喷着鼻子。\n客人们的马都拴在这儿，长工把它们挤得满满当当。');
          await S.think('汉斯借马给你的时候，往你兜里塞了一张纸条……');
          await S.note('hans');
          S.goal('提上门口的马灯，认出火药');
          if (S.coop) S.toast('联机：一个人按 J 翻汉斯的纸条念，一个人提灯看马');
        }
      },
      /* ---------------- 睡谷的夜路 ---------------- */
      road: {
        amb: 'night', dark: .86, plr: 2.8, wall: 'wood', floor: 'dirt', fog: .12,
        legend: { 'G': { t: 'grass', solid: true }, 'Q': 'plank' },
        rows: roadRows(),
        ents: [
          { id: 'hud', x: 0, y: 0, spr: 'invisible', solid: false },
          { id: 'r_vgate', x: 0, y: 10, h: 2, spr: 'hgate', on: S => S.narr('范·塔赛尔家的院门。门里的灯，一盏一盏地灭了。') },
          { id: 'r_vlamp', x: 1, y: 9, spr: 'invisible', light: { r: 3, col: 'rgba(255,190,110,.12)' } },
          { id: 'r_tulip', x: 16, y: 6, w: 3, h: 3, spr: 'tulip', on: S => S.narr('少校树。树皮上那块被雷劈白了的地方，在黑地里像一只睁着的眼睛。') },
          { id: 'r_moon1', x: 17, y: 10, spr: 'invisible', light: { r: 3.4, col: 'rgba(170,190,230,.06)' } },
          { id: 'r_moon2', x: 32, y: 10, spr: 'invisible', light: { r: 3, col: 'rgba(170,190,230,.05)' } },
          { id: 'r_moon3', x: 55, y: 10, spr: 'invisible', light: { r: 4.4, col: 'rgba(180,200,240,.08)' } },
          { id: 'r_block', x: 34, y: 10, h: 2, spr: 'invisible', solid: true, hidden: true, bump: S => S.narr('身后的桥头，那团黑影就在那儿。\n你连掉转马头的胆子都没有。') },
          { id: 'hessian', x: 37, y: 13, spr: 'hess', solid: false, hidden: true, s: { hd: 1 } },
          { id: 'r_log1', x: 64, y: 10, spr: 'log', on: S => S.narr('一棵倒在路上的老树。') },
          { id: 'r_log2', x: 85, y: 7, spr: 'log', on: S => S.narr('一棵倒在路上的老树。') },
          { id: 'r_log3', x: 97, y: 12, spr: 'log', on: S => S.narr('一棵倒在路上的老树。') },
          { id: 'r_sign1', x: 98, y: 7, spr: 'post', kind: 1, light: { r: 1.6, col: 'rgba(170,190,230,.08)' }, on: S => S.narr('岔路口的路牌。往上，是回汉斯家的坡路；往下，是去老荷兰教堂的路。') },
          { id: 'r_log4', x: 106, y: 17, spr: 'log', on: S => S.narr('一棵倒在路上的老树。') },
          { id: 'r_log5', x: 121, y: 16, spr: 'log', on: S => S.narr('一棵倒在路上的老树。') },
          { id: 'r_hgate', x: 130, y: 3, h: 2, spr: 'hgate', on: S => S.narr('汉斯家的院门。门闩着，里头的狗一声都不叫。') },
          { id: 'r_sign2', x: 133, y: 15, spr: 'post', kind: 2, light: { r: 1.6, col: 'rgba(170,190,230,.08)' }, on: S => S.narr('路牌。往上是老墓地；往前，过了溪，就是教堂。') },
          { id: 'r_log6', x: 140, y: 17, spr: 'log', on: S => S.narr('一棵倒在路上的老树。') },
          ...[[136, 11], [138, 13], [139, 9], [142, 12], [144, 10], [146, 12], [137, 9]].map(([x, y], i) => ({ id: 'r_gs' + i, x, y, spr: 'gravestone', on: S => S.narr('一块歪歪斜斜的老墓碑，字早就磨平了。') })),
          { id: 'r_hgrave', x: 141, y: 10, spr: 'cross', on: S => S.narr('一座没有名字的坟。木十字上拴着一截缰绳，被什么东西扯得笔直。') },
          { id: 'r_fire', x: BR - 2, y: 16, h: 2, spr: 'fireglow', solid: false, hidden: true, light: { r: 4, col: 'rgba(255,120,30,.3)' } },
          { id: 'r_saddle', x: 0, y: 0, spr: 'fsaddle', solid: false, hidden: true, on: S => S.narr('汉斯的礼拜天马鞍，被踩进了泥里。') },
          { id: 'r_head', x: 0, y: 0, spr: 'head', solid: false, hidden: true, z: 1, light: { r: 1.2, col: 'rgba(255,160,50,.2)' } },
          { id: 'r_smash', x: 0, y: 0, spr: 'smash', solid: false, decal: true, hidden: true },
          { id: 'r_church', x: 164, y: 5, w: 9, h: 5, spr: 'church', on: S => S.narr('老荷兰教堂。石头墙，尖顶上挂着一口钟。') },
          { id: 'r_clamp', x: 169, y: 9, spr: 'invisible', light: { r: 3.2, col: 'rgba(255,210,140,.18)' } },
          { id: 'r_moon4', x: 160, y: 16, spr: 'invisible', light: { r: 3, col: 'rgba(170,190,230,.06)' } }
        ],
        async enter(S, first) {
          if (!first) return;
          S.f.ph = 'ride';
          S.cp('road');
        },
        step(S, x, y) {
          const f = S.f;
          if (f.ph === 'ride') {
            if (x >= 4 && S.once('r_intro')) return rideIntro(S);
            if (x >= 13 && S.once('r_tree')) return tulipTree(S);
            if (x >= 26 && S.once('r_swamp')) return swamp(S);
            return;
          }
          if (f.ph === 'escort') {
            if (x >= 44 && S.once('r_e1')) return S.think('你走慢，他也走慢。你一停，他也停。\n他就这么不远不近地，跟着。');
            if (x >= 50 && S.once('r_e2')) return (async () => { await S.narr('你想再唱两句赞美诗。'); await psalm(S, 2, true); await S.narr('舌头像粘在了上膛上，一个音也出不来了。'); })();
            if (x >= 55) return reveal(S);
            return;
          }
          if (f.ph === 'chase') { if (x >= BR) return cross(S); return; }
          if (f.ph === 'nolook') {
            if (x >= 156 && !f.v1) { f.v1 = true; return S.say('', '「伊卡博德——」\n身后，有人轻轻叫你的名字。是凯特琳的声音。', { style: 'whisper' }); }
            if (x >= 162 && !f.v2) { f.v2 = true; return (async () => { for (let i = 0; i < 3; i++) S.tone('sine', 90, 45, .12, .06, i * .5, 500); snort(S, .04); await S.narr('桥那头，有马在刨蹄子。一下，一下，又一下。\n它在等你回头。'); })(); }
            if (x >= 168 && y <= 14 && !f.v3) { f.v3 = true; return S.say('', '「先生——您的帽子掉了。」\n这回，是布罗姆的声音。', { style: 'whisper' }); }
            if (x >= 168 && y <= 10) return finale(S);
          }
        },
        tick(S, dt) {
          roadTick(S, dt);
          const f = S.f;
          if (f.ph === 'nolook' && !S.busy && !W.ended && S.pl.dir === 1) S.run(f.warnLook ? lookBack : lookWarn);
        }
      }
    }
  });

  function yardGate(S) {
    if (!S.f.ride) return (async () => { await S.narr('走回去？汉斯家离这儿三英里，路上要过威利沼泽。\n还是骑马吧——火药在马厩里。'); await S.walk('pl', 'u', 5); })();
    return S.go('road', 2, 10, 2);
  }
})();
