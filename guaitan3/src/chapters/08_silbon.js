/* ================= 第八夜 · 吹哨人 ================= */
(() => {
  /* ---------- 常量 ---------- */
  const BONES = 40, INT = 1.0, TOTAL = BONES * INT;          // 他数 40 根，一秒一根
  const WHIP_BONUS = 8, AJI_BONUS = 12;                      // 鞭子、辣椒（按次序）各打乱他几根
  const WRONG_PEN = 5, ASC_PEN = 10, EARLY_DOG_PEN = 4, EARLY_AJI_PEN = 3;
  const TUNE = '53521';                                      // 外公唤狗的口哨：嗦咪嗦来哆
  const SCALE = [523, 587, 659, 698, 784, 880, 988];         // 哆来咪发嗦啦西
  const NOTE = ['哆', '来', '咪', '发', '嗦', '啦', '西'];
  let deaths = 0;                                            // 本次游玩里死过几次（不随检查点回滚，用来给重来时的提示）
  const KP = { id: -1, n: 0 };                               // 口哨密码盘：按一下响一个音
  const SIL = { t: 0, next: 9, loud: true };                 // 草原上的背景口哨

  const clampN = (v, a, b) => v < a ? a : v > b ? b : v;
  const cyc = (S, key, lines) => lines[(S.f[key] = ((S.f[key] ?? -1) + 1) % lines.length)];
  const N = t => S => S.narr(t);

  /* ---------- 地图绘制小工具 ---------- */
  function grid(w, h, c) {
    const g = [...Array(h)].map(() => Array(w).fill(c));
    const api = {
      set(x, y, ch) { if (y >= 0 && y < h && x >= 0 && x < w) g[y][x] = ch; return api; },
      rect(x0, y0, x1, y1, ch) { for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) api.set(x, y, ch); return api; },
      rows() { return g.map(r => r.join('')); }
    };
    return api;
  }
  /* 所有实体都编 id（检查点按 id 对应） */
  function ids(map, ents) { ents.forEach((e, i) => { if (!e.id) e.id = map + '_' + i; }); return ents; }

  /* ================= 声音（S.tone 合成，双方都听得到） ================= */
  /* 他的口哨：哆来咪发嗦啦西，一个音一个音往上爬，爬到顶又往下掉两级。
     'loud'：又响又亮、贴着耳朵——他其实还远；'faint'：又轻又闷、带回声——他就在身边。 */
  function whistle(S, kind, d0 = 0, vol = 1) {
    const seq = [0, 1, 2, 3, 4, 5, 6, 5, 4];
    if (kind === 'loud') {
      seq.forEach((n, i) => { const f = SCALE[n] * 2; S.tone('sine', f * .98, f, .2, .15 * vol, d0 + i * .21, 0); S.tone('triangle', f, f * 1.01, .16, .025 * vol, d0 + i * .21, 5000); });
    } else {
      seq.forEach((n, i) => {
        const f = SCALE[n] * 2;
        for (const [d, v, lp] of [[0, .035, 1300], [.42, .014, 900], [.84, .006, 700]]) S.tone('sine', f * .97, f, .3, v * vol, d0 + i * .33 + d, lp);
      });
    }
  }
  function noteTone(S, n) { const f = SCALE[clampN(n, 1, 7) - 1] * 2; S.tone('sine', f * .97, f, .26, .13, 0, 0); S.tone('triangle', f, f, .2, .02, 0, 4000); }
  /* 骨头放在地上：咔（高的脆响 + 低的闷响）；他嘴里跟着哼一个音，七个一轮往上爬 */
  function clack(S, c) {
    S.tone('square', 2300, 800, .025, .045, 0, 3600); S.tone('triangle', 320, 130, .07, .07, .01, 900);
    const f = SCALE[(c - 1 + 7) % 7]; S.tone('sine', f, f * .99, .3, .016, .08, 800);
  }
  function crack(S) { S.tone('square', 3200, 380, .035, .22, 0, 7000); S.tone('sawtooth', 1600, 90, .07, .12, .005, 4000); S.tone('triangle', 200, 60, .1, .08, .01, 600); }
  function bark(S, vol = .16, d0 = 0) { [0, .24].forEach(d => { S.tone('sawtooth', 560, 300, .09, vol, d0 + d, 1900); S.tone('square', 280, 170, .08, vol * .4, d0 + d, 900); }); }
  function whimper(S, vol = .05) { S.tone('sine', 900, 1350, .35, vol, 0, 2200); S.tone('sine', 1250, 760, .45, vol * .8, .42, 2200); }
  function cough(S) { [0, .3, .55, .95].forEach(d => { S.tone('sawtooth', 190, 85, .14, .09, d, 700); S.tone('triangle', 420, 160, .1, .03, d, 1200); }); }
  function joropo(S) { [784, 880, 784, 659, 784, 988, 880, 784, 659, 587].forEach((f, i) => S.tone('sine', f * 2, f * 2, .14, .1, i * .15, 0)); }
  function sizzle(S) { for (let i = 0; i < 9; i++) S.tone('square', 1800 + (i % 3) * 700, 600, .02, .03, i * .07 + (i % 2) * .03, 5000); }

  /* ================= 惊吓大头像 ================= */
  const FACES = {
    silbon(R, a, t) {
      const HAT = '#4a3a22', HATD = '#2b2214', SK = '#b3a88e', SK2 = '#7a6f5a', SK3 = '#5a5040';
      R(0, 0, 32, 32, '#050408');
      R(6, 26, 20, 6, '#2a241c'); R(10, 27, 12, 5, '#3a3226'); R(22, 25, 6, 7, '#6a5a3c'); R(23, 26, 2, 6, '#4a3e28');   // 破衣服、肩上的口袋带
      R(10, 8, 12, 20, SK); R(10, 8, 1, 20, SK2); R(21, 8, 1, 20, SK2);                     // 长得过分的脸
      R(10, 15, 2, 8, SK3); R(20, 15, 2, 8, SK3); R(12, 18, 1, 4, SK2); R(19, 18, 1, 4, SK2); // 凹下去的腮
      R(11, 11, 4, 4, '#000'); R(17, 11, 4, 4, '#000');                                     // 眼窝
      const tw = Math.sin(t * 19) > .6 ? 1 : 0;
      R(12 + tw, 12, 1, 1, '#e8e0a0'); R(18 + tw, 12, 1, 1, '#e8e0a0');                     // 针尖一样的瞳孔
      R(15, 15, 2, 3, SK2); R(15, 18, 1, 1, '#000'); R(16, 18, 1, 1, '#000');               // 鼻子只剩两个洞
      const k = Math.min(1, a * 1.7);
      if (k < .5) { R(14, 22, 4, 3, '#3a1a14'); R(15, 23, 2, 1, '#000'); R(13, 23, 1, 1, SK2); R(18, 23, 1, 1, SK2); }   // 嘴撮成口哨
      else { const h = 3 + Math.round((k - .5) * 9); R(13, 21, 6, h, '#2a0a08'); R(14, 22, 4, h - 2, '#000'); for (let i = 0; i < 3; i++) { R(13 + i * 2, 21, 1, 1, '#d8d0b8'); R(14 + i * 2, 20 + h, 1, 1, '#d8d0b8'); } }
      R(0, 5, 32, 3, HAT); R(0, 8, 32, 1, HATD); R(7, 0, 18, 5, HATD); R(8, 1, 16, 1, HAT);    // 破草帽
      for (let i = 0; i < 6; i++) R((i * 6 + 2) % 30, 7 + (i % 2), 2, 2, '#050408');         // 帽檐的破口
      R(1, 8, 2, 3, HAT); R(28, 8, 3, 2, HAT); R(10, 8, 12, 2, 'rgba(0,0,0,.45)');           // 帽檐阴影
    }
  };

  /* ================= 道具精灵 ================= */
  const SPRITES = {
    /* 吹哨人：pose = stand | sit（蹲着数骨头）| flinch（挨了鞭子/辣椒，缩成一团） */
    silbon(g, e, t, R) {
      const RAG = '#2a241c', RAG2 = '#3a3226', SK = '#a89e86', BN = '#ddd5bd', HAT = '#4a3a22', HATD = '#2b2214', SACK = '#7a6a48';
      const pose = e.pose || 'stand';
      if (pose === 'stand') {   // 站着：将近四格高，腿占了一半
        const y = e.fr ? -1 : 0, back = e.dir === 3;
        R(2, 13, 12, 3, 'rgba(0,0,0,.35)');
        R(6, -8 + y, 2, 22 - y, RAG); R(9, -8 + y, 2, 22 - y, RAG2); R(6, 2, 2, 1, RAG2); R(5, 14, 3, 1, SK); R(9, 14, 3, 1, SK);
        R(5, -30 + y, 6, 23, RAG); R(4, -10 + y, 1, 4, RAG); R(11, -12 + y, 1, 5, RAG2); for (let i = 0; i < 3; i++) R(6, -25 + i * 3 + y, 4, 1, '#4a4034');
        R(3, -29 + y, 2, 24, RAG2); R(3, -6 + y, 2, 3, SK); R(2, -4 + y, 1, 2, SK);
        R(10, -33 + y, 6, 12, SACK); R(11, -34 + y, 3, 1, '#5a4a30'); R(14, -36 + y, 1, 3, BN); R(13, -37 + y, 3, 1, BN); R(11, -29 + y, 2, 7, RAG2);
        R(7, -32 + y, 2, 2, SK);
        R(6, -38 + y, 4, 6, SK);
        if (!back) { R(6, -36 + y, 1, 1, '#000'); R(9, -36 + y, 1, 1, '#000'); R(7, -33 + y, 2, 1, '#3a1a14'); }
        R(1, -40 + y, 14, 2, HAT); R(0, -39 + y, 16, 1, HATD); R(5, -44 + y, 6, 4, HATD); R(2, -38 + y, 1, 1, HAT); R(13, -38 + y, 1, 2, HAT);
        return;
      }
      /* 蹲着数骨头：两条腿折起来，膝盖比帽檐还高 */
      const fl = pose === 'flinch', sh = fl ? Math.round(Math.sin(t * 40)) : 0;
      R(-1, 13, 18, 3, 'rgba(0,0,0,.35)');
      R(12, 2, 5, 12, SACK); R(13, 1, 3, 1, '#5a4a30'); R(14, -1, 1, 2, BN); R(16, 3, 1, 2, BN);
      R(1, -22, 2, 36, RAG2); R(12, -22, 2, 36, RAG); R(0, -24, 4, 3, RAG); R(11, -24, 4, 3, RAG2);   // 小腿竖着，膝盖顶到头顶上
      R(3, -20, 2, 6, RAG2); R(4, -14, 2, 6, RAG2); R(10, -20, 2, 6, RAG); R(9, -14, 2, 6, RAG);       // 大腿斜着落回胯
      R(0, 13, 3, 2, SK); R(12, 13, 3, 2, SK);
      if (fl) {
        R(5 + sh, -8, 6, 14, RAG); R(6 + sh, -13, 4, 5, SK);
        R(3 + sh, -17, 2, 10, RAG2); R(11 + sh, -17, 2, 10, RAG2); R(4 + sh, -18, 8, 2, SK);   // 双手抱头
        R(2 + sh, -19, 12, 2, HAT); R(5 + sh, -22, 6, 3, HATD);
        return;
      }
      R(5, -10, 6, 16, RAG); R(6, -16, 4, 6, SK); R(6, -14, 1, 1, '#000'); R(9, -14, 1, 1, '#000'); R(7, -11, 2, 1, '#3a1a14');
      const ph = (t / INT) % 1, lift = ph < .5 ? -Math.round(ph * 10) : -Math.round((1 - ph) * 10);
      R(4, -8, 2, 6, RAG2); R(2, -2 + lift, 3, 2, RAG2); R(0, -2 + lift, 2, 2, SK); R(-2, -3 + lift, 4, 1, BN); R(-3, -4 + lift, 1, 1, BN); R(2, -4 + lift, 1, 1, BN);
      R(2, -18, 12, 2, HAT); R(1, -17, 14, 1, HATD); R(5, -22, 6, 4, HATD); R(12, -16, 1, 2, HAT);
    },
    /* 门槛外的骨头堆：num = 已经数了几根；s.scatter = 散了一地 */
    bones(g, e, t, R) {
      const n = e.num || 0, BN = '#ddd5bd', BD = '#a8a088';
      for (let i = 0; i < n; i++) {
        let x, y;
        if (e.scatter) { x = -10 + hash(i, 3, 8) * 34; y = 2 + hash(i, 4, 8) * 14; }
        else { x = 2 + hash(i, 3, 8) * 11; y = 12 - Math.floor(i / 7) * 1.4 - hash(i, 4, 8) * 3; }
        if (hash(i, 5, 8) < .5) { R(x, y, 4, 1, BN); R(x - 1, y - 1, 1, 1, BD); R(x + 4, y - 1, 1, 1, BD); R(x - 1, y + 1, 1, 1, BD); R(x + 4, y + 1, 1, 1, BD); }
        else { R(x + 1, y - 2, 1, 4, BN); R(x, y - 3, 1, 1, BD); R(x + 2, y - 3, 1, 1, BD); R(x, y + 2, 1, 1, BD); R(x + 2, y + 2, 1, 1, BD); }
      }
    },
    /* 卡内洛：肉桂色的平原牧牛犬（侧面）；s.bark 叫、s.cower 夹着尾巴 */
    dog(g, e, t, R) {
      const M = (x, y, w, h, c) => e.dir === 2 ? R(16 - x - w, y, w, h, c) : R(x, y, w, h, c);
      const C = '#b0682e', C2 = '#d08a48', D = '#6a3a18', cw = e.cower ? 2 : 0;
      const bk = e.bark && Math.sin(t * 14) > 0 ? 1 : 0;
      M(2, 14, 12, 2, 'rgba(0,0,0,.3)');
      const st = e.fr === 1 ? 1 : e.fr === 3 ? -1 : 0;
      M(4, 10 + cw, 2, 4 - cw + st, D); M(6, 10 + cw, 2, 4 - cw - st, C); M(10, 10 + cw, 2, 4 - cw - st, D); M(12, 10 + cw, 2, 4 - cw + st, C);
      M(4, 6 + cw, 10, 5, C); M(5, 9 + cw, 8, 2, C2);
      M(1, 3 + cw - bk, 5, 5, C); M(0, 6 + cw - bk, 2, 2, C2); M(0, 6 + cw - bk, 1, 1, '#1a1010'); M(2, 4 + cw - bk, 1, 1, '#1a1010');
      if (e.cower) M(4, 5, 2, 2, D); else { M(4, 1 - bk, 2, 3, D); M(5, 0 - bk, 1, 1, D); }
      if (bk) { M(0, 8 + cw - bk, 2, 1, '#5a1a1a'); M(-1, 4, 1, 1, 'rgba(255,255,255,.6)'); M(-2, 2, 1, 1, 'rgba(255,255,255,.4)'); }
      if (e.cower) M(13, 9, 2, 3, D); else { const w = Math.sin(t * (e.bark ? 18 : 6)) > 0 ? 1 : 0; M(13, 3 + w, 2, 4, C); M(14, 2 + w, 1, 2, C2); }
      if (e.collar) M(3, 7 + cw - bk, 3, 1, '#c8a050');
    },
    /* 吊床（w=3），拉斐尔躺在里面 */
    hamaca(g, e, t, R) {
      R(0, 3, 2, 2, '#c8b080'); R(46, 3, 2, 2, '#c8b080'); R(2, 4, 4, 1, '#c8b080'); R(42, 4, 4, 1, '#c8b080');
      R(5, 5, 38, 6, '#b84a32'); R(8, 10, 32, 3, '#b84a32'); R(12, 12, 24, 2, '#9a3a26');
      for (let x = 7; x < 42; x += 6) { R(x, 5, 2, 7, '#e8c040'); R(x + 3, 6, 1, 6, '#3a6a8a'); }
      R(7, 2, 6, 5, '#b88458'); R(7, 1, 6, 2, '#120c0a'); R(8, 4, 1, 1, '#2a1a10'); R(11, 4, 1, 1, '#2a1a10');
      R(14, 4, 20, 5, '#8a2a2a'); R(18, 2, 9, 3, '#3a2a1a'); R(17, 4, 11, 1, '#2a1a0e');
      R(22, 11, 2, 5, '#b88458'); R(22, 16, 2, 1, '#9a6a44');
      R(34, 3, 8, 4, '#2a2a32'); R(40, 2, 3, 4, '#3a2a1a');
      if (!e.awake && Math.sin(t * 1.3) > 0) { R(14, -6, 3, 1, '#c8c0b0'); R(16, -5, 1, 1, '#c8c0b0'); R(14, -4, 3, 1, '#c8c0b0'); }
    },
    /* 土灶（w=2）：lit 烧着；s.chili 冒呛人的红烟 */
    fogon(g, e, t, R) {
      box(R, 0, 5, 32, 10, '#6a5440'); R(1, 6, 30, 2, '#7e6650');
      R(4, 1, 7, 6, '#6a6460'); R(21, 1, 7, 6, '#6a6460'); R(12, 0, 8, 4, '#5a5450'); R(5, 1, 3, 1, '#8a8480');
      R(9, -5, 14, 7, '#2a2420'); R(8, -6, 16, 1, '#3a3430'); R(10, -4, 3, 1, '#4a4440');
      if (e.lit) {
        const f = Math.sin(t * 13) > 0 ? 1 : 0;
        R(11, 3, 10, 3, '#c83a10'); R(12, 2 - f, 3, 2, '#ffb030'); R(16, 1 + f, 3, 3, '#ff8a20'); R(14, 3, 4, 1, '#ffe080');
        for (let i = 0; i < 3; i++) { const y = -8 - ((t * 9 + i * 7) % 18); R(14 + Math.round(Math.sin(t * 2 + i) * 2), y, 2, 2, e.chili ? 'rgba(200,70,50,.5)' : 'rgba(200,200,200,.25)'); }
        if (e.chili) for (let i = 0; i < 4; i++) { const y = -6 - ((t * 7 + i * 5) % 16); R(6 + i * 6 + Math.round(Math.sin(t * 3 + i) * 2), y, 3, 2, 'rgba(210,60,40,.45)'); }
      } else { R(11, 4, 10, 2, '#4a1a0a'); R(14, 4, 2, 1, '#8a2a10'); }
    },
    /* 墙上挂的辣椒串 */
    ristra(g, e, t, R) {
      R(6, 0, 4, 1, '#6a5a3a'); R(7, 1, 2, 13, '#8a7a4a');
      const n = e.less ? 3 : 6;
      for (let i = 0; i < n; i++) { R(4, 2 + i * 2, 3, 2, i % 2 ? '#a81a10' : '#d02a18'); R(9, 3 + i * 2, 3, 2, i % 2 ? '#d02a18' : '#a81a10'); R(5, 2 + i * 2, 1, 1, '#4a7a2a'); }
    },
    tinaja(g, e, t, R) { R(3, 13, 10, 2, 'rgba(0,0,0,.3)'); R(4, 4, 8, 10, '#a8643a'); R(3, 6, 10, 6, '#a8643a'); R(11, 6, 2, 6, '#8a4a2a'); R(5, 2, 6, 2, '#8a4a2a'); R(4, 1, 8, 1, '#6a3a1a'); R(9, -1, 5, 2, '#c8a050'); R(10, -1, 3, 1, '#e0c070'); },
    baul(g, e, t, R) {
      if (e.open) { R(1, -3, 14, 5, '#4a2e18'); R(2, -2, 12, 3, '#2a1a0e'); }
      box(R, 1, 3, 14, 12, '#5a3a20'); R(1, 6, 14, 1, '#c8a050'); R(1, 12, 14, 1, '#c8a050'); R(7, 7, 2, 3, '#d8c070');
      if (e.open) { R(2, 3, 12, 3, '#1a100a'); R(4, 3, 5, 2, '#d8d0b8'); }
    },
    /* 前门（挂在墙面那一行）：open 时是黑洞洞的门洞 */
    ldoor(g, e, t, R) {
      R(0, -3, 16, 1, '#2a1a0e'); R(0, -3, 1, 19, '#2a1a0e'); R(15, -3, 1, 19, '#2a1a0e');
      if (e.open) { R(1, -2, 14, 18, '#0a0806'); R(1, -2, 2, 18, '#3a2614'); return; }
      R(1, -2, 14, 18, '#5a3e24'); for (const x of [4, 8, 12]) R(x, -2, 1, 18, '#2a1a0e');
      R(1, 2, 14, 2, '#4a3018'); R(1, 10, 14, 2, '#4a3018'); R(11, 5, 2, 2, '#1a1008');
      if (e.locked) R(2, 6, 12, 1, '#7a5a30');
    },
    /* 木窗棂 */
    lwin(g, e, t, R) {
      box(R, 1, 1, 14, 12, '#3a2a1a'); R(2, 2, 12, 10, e.lit ? '#b08040' : '#0a0c14');
      for (const x of [4, 7, 10, 13]) R(x - 1, 2, 1, 10, '#6a4a2a');
      R(2, 12, 12, 2, '#4a3420');
    },
    altar(g, e, t, R) {
      box(R, 1, 5, 14, 10, '#6a4a2a'); R(2, 6, 12, 2, '#7e5a36');
      R(4, -9, 8, 12, '#c8a050'); R(5, -8, 6, 10, '#2a4a8a'); R(7, -7, 2, 2, '#e8d0b0'); R(6, -5, 4, 6, '#e8e4f0'); R(5, -8, 6, 1, '#e8c860');
      R(2, 1, 2, 5, '#e8e2d0'); const f = Math.sin(t * 11) > 0 ? 1 : 0; R(2, -1 + f, 2, 2, '#ffcf5a');
      R(12, 1, 2, 5, '#4a7a3a'); R(11, 0, 2, 2, '#e85a6a'); R(13, -1, 2, 2, '#f0e0e8');
    },
    cuatro(g, e, t, R) { R(3, 6, 8, 7, '#a8743a'); R(4, 5, 6, 1, '#a8743a'); R(6, 8, 2, 2, '#2a1a0a'); R(10, 1, 2, 7, '#6a4a2a'); R(11, 0, 3, 2, '#4a3018'); R(5, 12, 4, 1, '#6a4a2a'); },
    retrato(g, e, t, R) { R(3, 1, 10, 11, '#3a2a1a'); R(4, 2, 8, 9, '#c8bca0'); R(6, 4, 4, 4, '#8a8070'); R(5, 4, 6, 1, '#4a4030'); R(6, 3, 4, 1, '#4a4030'); R(5, 8, 6, 3, '#6a6050'); },
    calendario(g, e, t, R) { R(3, 1, 10, 12, '#e8e2d0'); R(3, 1, 10, 3, '#b82a2a'); R(4, 5, 8, 4, '#4a8a5a'); for (let y = 10; y < 13; y++) R(4, y, 8, 1, y % 2 ? '#b8b0a0' : '#e8e2d0'); R(7, 0, 2, 1, '#555'); },
    silla(g, e, t, R) { R(2, 9, 12, 2, '#5a3a20'); R(3, 11, 1, 4, '#5a3a20'); R(12, 11, 1, 4, '#5a3a20'); R(3, 2, 10, 7, '#7a4a24'); R(4, 3, 8, 2, '#8a5a30'); R(4, 0, 2, 3, '#5a3418'); R(8, 9, 2, 4, '#c8a050'); },
    mesa(g, e, t, R) {
      box(R, 1, 3, 30, 9, '#6a4a2a'); R(2, 4, 28, 2, '#7e5a36'); R(3, 12, 2, 4, '#4a3018'); R(27, 12, 2, 4, '#4a3018');
      R(6, -4, 5, 8, '#c8b080'); R(7, -6, 3, 2, '#e8e0c0'); const f = Math.sin(t * 9) > 0 ? 1 : 0; R(8, -8 + f, 1, 2, '#ffcf5a');
      R(18, 1, 4, 3, '#e8e2d0'); R(24, 1, 3, 3, '#c8a050');
    },
    lena(g, e, t, R) {
      const rows = e.less ? 2 : 3;
      for (let r = 0; r < rows; r++) for (let i = 0; i < 6 - r; i++) { const x = 2 + i * 5 + r * 2, y = 10 - r * 4; R(x, y, 5, 4, '#6a4a2a'); R(x + 1, y + 1, 3, 2, '#c8a070'); R(x + 2, y + 1, 1, 1, '#8a6a40'); }
      R(26, 9, 2, 5, '#4a3018'); R(24, 6, 6, 2, '#a8acb0');
    },
    perrera(g, e, t, R) { box(R, 2, 3, 12, 11, '#6a4a2a'); R(1, 0, 14, 4, '#4a3020'); R(2, -1, 12, 1, '#3a2418'); R(6, 7, 4, 7, '#0a0806'); R(12, 12, 4, 1, '#8a8a8a'); R(15, 13, 1, 1, '#8a8a8a'); R(1, 14, 3, 1, '#d8d0b8'); },
    limon(g, e, t, R) {
      R(7, 4, 2, 11, '#5a3a20'); R(5, 14, 6, 2, 'rgba(0,0,0,.3)');
      R(1, -12, 14, 17, '#2a5a2a'); R(-1, -8, 18, 10, '#2a5a2a'); R(3, -14, 10, 3, '#2a5a2a');
      for (let i = 0; i < 8; i++) R((hash(i, 2, 7) * 14) | 0, -12 + ((hash(i, 3, 7) * 14) | 0), 2, 2, '#3a7a3a');
      for (const [x, y] of [[3, -4], [11, -8], [6, 0], [13, -2], [2, -10]]) R(x, y, 2, 2, '#b8d84a');
      if (e.cut) { R(12, -1, 4, 1, '#c8b080'); R(15, -2, 1, 2, '#c8b080'); }
    },
    limonDead(g, e, t, R) { R(7, -2, 2, 17, '#6a6058'); R(3, -8, 1, 8, '#6a6058'); R(4, -2, 3, 1, '#6a6058'); R(11, -10, 1, 9, '#6a6058'); R(9, -4, 2, 1, '#6a6058'); R(5, -12, 1, 5, '#6a6058'); R(13, -12, 1, 3, '#6a6058'); R(5, 14, 6, 2, 'rgba(0,0,0,.3)'); },
    /* 萨曼树（w=3）：伞一样的大树冠 */
    saman(g, e, t, R) {
      R(14, 12, 22, 4, 'rgba(0,0,0,.3)');
      R(20, -10, 8, 26, '#4a3424'); R(17, 12, 14, 3, '#4a3424'); R(22, -10, 2, 24, '#5a4230');
      R(10, -18, 10, 2, '#4a3424'); R(28, -18, 10, 2, '#4a3424');
      R(-8, -32, 64, 16, '#1e3a1e'); R(-4, -36, 56, 6, '#1e3a1e'); R(2, -38, 44, 3, '#1e3a1e');
      for (let i = 0; i < 24; i++) R(-6 + ((hash(i, 2, 9) * 58) | 0), -36 + ((hash(i, 3, 9) * 18) | 0), 4, 2, i % 3 ? '#2a4a28' : '#163016');
      R(-8, -17, 64, 2, '#122612');
      if (e.rope) { R(18, 0, 12, 1, '#a8905a'); R(18, 4, 12, 1, '#a8905a'); }
    },
    /* 莫里切棕榈 */
    moriche(g, e, t, R) {
      R(4, 13, 9, 3, 'rgba(0,0,0,.3)');
      R(7, -12, 3, 27, '#6a5a44'); for (let y = -10; y < 14; y += 4) R(7, y, 3, 1, '#4a3e30');
      const s = Math.round(Math.sin(t * 1.4 + e.px) * 1);
      R(-4 + s, -18, 11, 2, '#2a4a2a'); R(10 + s, -18, 11, 2, '#2a4a2a'); R(-2 + s, -22, 9, 2, '#2e5230'); R(10 + s, -22, 9, 2, '#2e5230');
      R(2 + s, -26, 5, 2, '#2e5230'); R(10 + s, -26, 5, 2, '#2e5230'); R(6 + s, -27, 5, 10, '#2a4a2a'); R(7 + s, -28, 3, 2, '#3a6a3a');
      R(-5 + s, -16, 2, 2, '#2a4a2a'); R(20 + s, -16, 2, 2, '#2a4a2a'); R(9, -12, 3, 3, '#6a3a1a');
    },
    cruz(g, e, t, R) { R(4, 12, 8, 3, '#6a6460'); R(7, -6, 2, 19, '#e8e2d0'); R(4, -2, 8, 2, '#e8e2d0'); R(3, 9, 2, 3, '#e84a6a'); R(11, 9, 2, 3, '#e8c040'); R(9, 10, 1, 2, '#e8e2d0'); R(6, -6, 1, 1, '#b8b0a0'); },
    termitero(g, e, t, R) { R(3, 13, 10, 3, 'rgba(0,0,0,.3)'); R(4, 2, 8, 13, '#8a5a32'); R(5, -4, 6, 7, '#8a5a32'); R(6, -8, 4, 5, '#7a4e2a'); R(7, -10, 2, 3, '#7a4e2a'); R(5, 4, 2, 6, '#9a6a3e'); R(9, -2, 1, 8, '#6a4022'); },
    calavera(g, e, t, R) { R(4, 8, 8, 5, '#e8e2d0'); R(5, 13, 6, 2, '#d8d0bc'); R(1, 7, 3, 2, '#e8e2d0'); R(12, 7, 3, 2, '#e8e2d0'); R(0, 5, 1, 2, '#e8e2d0'); R(15, 5, 1, 2, '#e8e2d0'); R(5, 9, 2, 2, '#2a2a2a'); R(9, 9, 2, 2, '#2a2a2a'); R(7, 12, 2, 1, '#8a8478'); },
    /* 瘤牛（平原上的牛背上有个峰） */
    vaca(g, e, t, R) {
      const c = e.col || '#e8e2d0', d = shade(c, -.25);
      R(1, 14, 14, 2, 'rgba(0,0,0,.3)');
      R(2, 11, 2, 4, d); R(5, 11, 2, 4, c); R(10, 11, 2, 4, d); R(13, 11, 2, 4, c);
      R(1, 5, 14, 7, c); R(9, 3, 4, 3, c); R(3, 6, 4, 3, '#3a3026'); R(1, 10, 14, 1, d);
      const h = Math.sin(t * .8 + e.px) > .7 ? 1 : 0;
      R(13, 4 + h, 4, 5, c); R(15, 5 + h, 1, 1, '#1a1010'); R(14, 3 + h, 1, 2, '#c8b890'); R(16, 8 + h, 2, 2, d); R(0, 6, 1, 6, d);
    },
    machete(g, e, t, R) { R(6, -8, 4, 23, '#5a3a20'); R(7, -8, 1, 23, '#6a4a2a'); R(5, -9, 6, 2, '#4a2e18'); if (!e.taken) { R(10, -4, 2, 3, '#3a2416'); R(10, -1, 2, 11, '#a8acb0'); R(11, -1, 1, 10, '#d0d4d8'); } else R(10, -4, 1, 1, '#8a8a8a'); },
    mecedora(g, e, t, R) { const r = Math.round(Math.sin(t * 1.5) * (e.rock ? 1 : 0)); R(3, -2 + r, 10, 9, '#6a4a2a'); R(4, -1 + r, 8, 7, '#c8a868'); R(3, 7, 10, 4, '#6a4a2a'); R(4, 7, 8, 3, '#c8a868'); R(3, 11, 1, 3, '#5a3a20'); R(12, 11, 1, 3, '#5a3a20'); R(1, 14 + r, 14, 1, '#5a3a20'); },
    botella(g, e, t, R) { R(5, 13, 6, 2, 'rgba(0,0,0,.3)'); R(5, 5, 6, 9, '#2e4a32'); R(7, 1, 2, 4, '#2e4a32'); R(7, 0, 2, 1, '#c8a060'); R(5, 8, 6, 3, '#e8e2d0'); if (!e.empty) R(6, 11, 4, 3, 'rgba(230,220,170,.7)'); },
    collar(g, e, t, R) { const b = Math.sin(t * 3) > 0 ? 1 : 0; R(4, 9, 8, 4, '#6a3a1a'); R(5, 10, 6, 2, '#3a1a0a'); R(10, 9 + b, 2, 2, '#c8a050'); },
    poste(g, e, t, R) { R(6, -16, 4, 31, '#5a3a20'); R(7, -16, 1, 31, '#6a4a2a'); R(5, -17, 6, 2, '#4a2e18'); if (e.clip) { R(4, -8, 8, 9, '#d8d0b8'); for (let y = -6; y < 0; y += 2) R(5, y, 6, 1, '#8a8070'); R(7, -9, 2, 1, '#555'); } },
    puerta(g, e, t, R) { R(0, -4, 3, 20, '#5a3a20'); R(13, -4, 3, 20, '#5a3a20'); R(3, 0, 10, 2, '#7a5a3a'); R(3, 6, 10, 2, '#7a5a3a'); R(3, 12, 10, 2, '#7a5a3a'); }
  };

  /* ================= 瓦片 ================= */
  const TILES = {
    sav: { solid: false, paint(R, X, Y) { speck(R, '#5a5a2a', ['#6e6a32', '#4a4a22', '#7a7038'], X, Y, 20, 31); for (let i = 0; i < 4; i++) { const x = (hash(X, Y, 40 + i) * 14) | 0, y = (hash(X, Y, 50 + i) * 10) | 0 + 2; R(x, y, 1, 4, '#8a7c40'); R(x + 1, y + 1, 1, 3, '#6a6230'); } } },
    thatch: { solid: true, paint(R, X, Y) { R(0, 0, 16, 16, '#6a5a32'); for (let y = 0; y < 16; y += 3) for (let x = (y % 2) * 2; x < 16; x += 4) { R(x, y, 1, 3, '#8a7a44'); R(x + 1, y + 1, 1, 2, '#4a3e22'); } R(0, 15, 16, 1, '#3a3018'); } },
    adobe: { solid: true, paint(R, X, Y) { R(0, 0, 16, 16, '#9a7a56'); R(0, 0, 16, 2, '#4a3a22'); R(0, 14, 16, 2, '#6a5236'); if (hash(X, Y, 5) < .5) R(3, 6, 4, 1, '#8a6a48'); if (X % 4 === 0) R(0, 2, 2, 12, '#5a3a20'); } },
    doorway: { solid: false, paint(R) { R(0, 0, 16, 16, '#0e0a07'); R(0, 0, 2, 16, '#5a3a20'); R(14, 0, 2, 16, '#5a3a20'); R(0, 0, 16, 2, '#4a3a22'); } },
    clay: { solid: false, paint(R, X, Y) { speck(R, '#6a523a', ['#745a40', '#5e4834', '#7a6044'], X, Y, 14, 33); } },
    porch: { solid: false, paint(R, X, Y) { TILE.wood.paint(R, X, Y, { woodC: '#7a5a3a' }); } },
    lintel: { solid: false, paint(R) { R(0, 0, 16, 16, '#5a3e24'); for (const x of [4, 8, 12]) R(x, 0, 1, 16, '#2a1a0e'); } }
  };
  const LEG = { v: 'sav', F: 'thatch', A: 'adobe', O: 'doorway', y: 'clay', p: 'porch', D: 'lintel' };

  /* ================= 地图格子 ================= */
  function sabanaRows() {
    const G = grid(40, 16, 'v');
    G.rect(0, 0, 39, 0, 'T'); G.rect(0, 15, 39, 15, 'T');
    [1, 2, 5, 13, 14, 17, 26, 27, 33, 36].forEach(x => G.set(x, 1, 'T'));
    G.rect(0, 8, 38, 9, 'd');
    G.rect(8, 1, 9, 14, '~'); G.rect(8, 8, 9, 9, 'w');
    [[10, 3], [10, 5], [7, 11], [7, 13], [10, 13]].forEach(([x, y]) => G.set(x, y, 'e'));
    G.rect(10, 11, 18, 14, 'u'); G.rect(19, 12, 20, 14, 'u');
    G.rect(1, 2, 7, 6, 'f'); G.rect(2, 3, 6, 5, 'd'); G.set(4, 6, 'd');
    G.rect(39, 1, 39, 14, 'f'); G.set(39, 8, 'd'); G.set(39, 9, 'd');
    [[30, 3], [34, 5], [17, 4], [29, 13], [35, 12], [24, 13]].forEach(([x, y]) => G.set(x, y, 'B'));
    return G.rows();
  }
  function hatoRows() {
    const G = grid(30, 18, 'd');
    G.rect(0, 0, 29, 2, 'T'); G.rect(9, 0, 19, 1, 'F'); G.rect(9, 2, 19, 2, 'A'); G.set(14, 2, 'O');
    G.rect(0, 3, 0, 16, 'f'); G.set(0, 10, 'd'); G.rect(29, 3, 29, 16, 'f'); G.rect(0, 17, 29, 17, 'f');
    G.rect(20, 6, 28, 14, 'f'); G.rect(21, 7, 27, 13, 'u'); G.set(20, 10, 'd');
    [[2, 14], [3, 15], [27, 4], [26, 16], [12, 15], [1, 3], [5, 3], [16, 4]].forEach(([x, y]) => G.set(x, y, 'v'));
    G.set(1, 16, 'B'); G.set(28, 16, 'B');
    return G.rows();
  }
  function casaRows() {
    const G = grid(16, 14, 'y');
    G.rect(0, 0, 15, 1, '#'); G.rect(0, 2, 0, 8, '#'); G.rect(15, 2, 15, 8, '#'); G.rect(0, 8, 15, 8, '#'); G.set(8, 8, 'D');
    G.rect(0, 9, 15, 10, 'p'); G.rect(0, 11, 15, 12, 'd'); G.rect(0, 13, 15, 13, 'f'); G.set(8, 13, 'd');
    return G.rows();
  }

  /* ================= 目标 ================= */
  function prepLeft(S) {
    const f = S.f, L = [];
    if (!S.has('latigo')) L.push('柠檬枝鞭子');
    if (!S.has('aji')) L.push('辣椒串');
    if (!f.fire) L.push('给灶添柴生火');
    if (!f.tune) L.push('外公唤狗的口哨调');
    return L;
  }
  function prepGoal(S) { const L = prepLeft(S); S.goal(L.length ? '天黑前备好：' + L.join('、') + (S.coop && L.length > 1 ? '（两人可以分头：一人去草原砍柠檬枝，一人在屋里生火、翻箱子）' : '') : '都备好了——去门廊找外婆'); }
  function nightGoal(S) {
    const f = S.f, duo = S.coop ? '（一人守窗、一人守灶）' : '';
    if (!f.whip) return S.goal('照外公写的次序赶他走：先到窗边抽响柠檬鞭' + duo);
    if (!f.aji) return S.goal('第二样：把辣椒扔进灶火里' + duo);
    S.goal('最后一样：到窗边吹外公的调子，把卡内洛叫回来' + (S.coop ? '（一人念歌本，一人吹）' : ''));
  }

  /* ================= 草原：回家的路 ================= */
  async function sabanaEnter(S, first) {
    const f = S.f;
    if (f.phase === 'walk' && first) {
      S.dark(.36); S.follow('rafa', true);
      await S.narr('太阳沉进草原的那一头，把整片草都烧成了铜色。\n远处的莫里切棕榈一棵一棵立着，像插在地上的扫帚。');
      await S.say('拉斐尔', ['托马斯——你走那么快干嘛……天还没黑呢。', '舞会才刚热闹起来，外婆非让咱们天黑前回去。……老太太，信的东西多。']);
      await S.narr('拉斐尔一身酒气，帽子歪在后脑勺上。卡内洛在前头颠颠地跑，时不时回头看你们。');
      S.goal('把喝醉的拉斐尔带回外婆的牧场（往东）');
      return;
    }
    if (f.phase === 'prep') {
      S.dark(.6); S.plr(3.2); SIL.next = 5; SIL.loud = true;
      if (S.once('sab2')) {
        await S.narr('太阳已经落下去了。草原上只剩天边一道暗红的边。\n风从草尖上刮过去，沙——沙——');
        await S.think('（外婆说，西边老菜园里还有一棵柠檬树。就在小河那边，过了木桥。）');
      }
      return;
    }
    S.dark(.6);
  }
  async function sabanaStep(S, x, y) {
    const f = S.f;
    if (f.phase !== 'walk') return;
    if (x >= 11 && !f.w1) return whistle1(S);
    if (x >= 20 && f.w1 && !f.w2) return whistle2(S);
  }
  async function whistle1(S) {
    const f = S.f; f.w1 = true;
    S.face('rafa', 'pl');
    await S.say('拉斐尔', '你听这个——舞会上那个竖琴手弹的，我学会了！');
    joropo(S); await S.wait(1700);
    await S.narr('拉斐尔把手指塞进嘴里，吹得又尖又亮。\n前头的卡内洛停下来，竖起了耳朵。');
    await S.wait(900);
    whistle(S, 'loud'); await S.wait(2300);
    await S.narr('有人回了一声口哨。\n哆、来、咪、发、嗦、啦、西——一个音一个音地往上爬，爬到顶，又往下掉了两级。\n很响，很亮。就像在路边的草里。');
    S.ent('canelo_s').s.cower = true; S.bubble('canelo_s', '!', 1400);
    await S.say('拉斐尔', '哈！有人跟我对上了！……喂——！谁啊——！');
    await S.think('（路边只有齐腰的草。一个人也没有。）');
    S.ent('canelo_s').s.cower = false;
  }
  async function whistle2(S) {
    const f = S.f; f.w2 = true;
    const dog = S.ent('canelo_s');
    await S.say('拉斐尔', '再来！我就不信——', { style: 'whisper' });
    joropo(S); await S.wait(1600);
    S.amb('none'); await S.wait(900);
    whistle(S, 'faint'); await S.wait(3300);
    await S.narr('又是那个口哨。\n这一回很轻、很闷，像是从很远很远的地方飘过来的。');
    dog.s.cower = true; whimper(S, .07);
    await S.narr('卡内洛夹着尾巴，冲着那棵大萨曼树低低地呜咽。');
    S.ent('silS').alpha = 0; S.show('silS'); S.sfx('heart');
    await S.alpha('silS', .75, 700);
    await S.narr('萨曼树底下站着一个人。\n很高，很瘦，戴一顶破草帽。肩上扛着一只鼓鼓囊囊的口袋。');
    await S.alpha('silS', 0, 600);
    S.sfx('sting'); bark(S, .1);
    f.dogGone = true; dog.s.cower = false;
    await S.walk('canelo_s', [14, 10], 7); await S.walk('canelo_s', [15, 13], 7); S.hide('canelo_s');
    await S.narr('卡内洛猛地窜了出去，一头扎进了南边的棕榈沼泽里。\n怎么叫都不回来。');
    S.amb('wind');
    await S.say('拉斐尔', ['……托马斯。', '那声音……刚才那么远。', '……可是那个人，就站在那儿。'], { style: 'whisper' });
    await S.think('（声音那么远，人却那么近。）');
    S.goal('别回头——带拉斐尔回牧场（往东，到草原尽头的栅门）');
  }
  async function sabanaGate(S) {
    const f = S.f;
    if (f.phase === 'walk') {
      S.follow('rafa', false); S.hide('rafa'); S.hide('canelo_s');
      f.phase = 'home'; S.sfx('open');
      await S.go('hato', 1, 10, 2);
      return;
    }
    S.sfx('open'); await S.go('hato', 1, 10, 2);
  }
  async function sabanaWest(S) {
    await S.narr(S.f.phase === 'walk' ? '镇子在身后很远的地方。\n拉斐尔拽住你：「不回去了……走，回外婆家。」' : '往西是回镇上的路。天黑了，一个人走不回去。');
    S.pos(2, S.pl.y, 2);
  }
  async function limonUse(S) {
    const f = S.f, e = S.ent('limon');
    if (f.phase === 'walk') return S.narr('外婆家的老菜园，荒了好几年了。\n一棵柠檬树还活着，枝上挂着几个青柠檬。');
    if (S.has('latigo')) return S.narr('柠檬树。你砍过的那根枝子，断口还在往外渗汁，酸得刺鼻。');
    if (f.phase !== 'prep') return S.narr('柠檬树。');
    if (!S.has('machete')) return S.narr('柠檬树的枝子上全是刺，又硬又韧，空手掰不下来。\n（费利克斯说过，畜栏柱子上挂着一把砍刀。）');
    S.sfx('cut'); S.shake(200, 1); e.s.cut = true;
    await S.narr('你挑了一根又长又直的枝子，一刀砍下来，削掉叶子和刺。\n甩一下，「咻」的一声。');
    S.give('latigo');
    await S.think('（外公的歌本上写的：先拿柠檬枝抽。）');
    prepGoal(S);
  }
  async function collarUse(S) {
    if (S.f.phase === 'walk') return S.narr('草里有个东西。');
    S.hide('collar'); S.give('collar');
    await S.narr('沼泽边的泥里，躺着一个皮项圈。铜扣子上刻着「CANELO」。\n……挣断的。泥地上的爪印乱七八糟，一路往棕榈林深处去了。');
    await S.think('（卡内洛……你跑哪儿去了。）');
  }

  /* ================= 牧场院子 ================= */
  async function hatoEnter(S, first) {
    const f = S.f;
    S.dark(f.phase === 'home' || f.phase === 'walk' ? .42 : .58);
    if (f.phase === 'home' && first) {
      S.place('rafa_h', 2, 10, 2);
      await S.narr('外婆的牧场到了。\n茅草屋顶下面亮着一盏煤油灯，畜栏里的瘤牛甩着尾巴。');
      S.face('felix', 1);
      await S.say('费利克斯', ['哎哟——拉斐尔少爷，这是喝了多少！', '托马斯，你们的狗呢？卡内洛怎么没跟回来？']);
      await S.walk('felix', [3, 9], 4.5);
      await S.narr('老长工费利克斯架起拉斐尔的胳膊，往屋里拖。\n你把路上的事说了。口哨，一响一轻。萨曼树底下的那个人。');
      S.face('felix', 'pl');
      await S.say('费利克斯', ['……一响一轻？', '……先进屋。快去门廊找你外婆。'], { style: 'whisper' });
      S.focus(12, 6);
      await Promise.all([S.walk('felix', [14, 3], 4), S.walk('rafa_h', [13, 3], 4)]);
      await S.narr('茅草屋顶底下，门廊的灯光一晃一晃的。外婆就坐在那里。');
      S.focus(null);
      S.hide('rafa_h'); S.hide('felix');
      await S.wait(500);
      S.place('felix', 18, 10, 1);
      S.goal('去门廊找外婆（北边的屋子）');
      return;
    }
  }
  async function felixTalk(S) {
    const f = S.f; S.face('felix', 'pl');
    if (f.phase === 'home') return S.say('费利克斯', '快去找你外婆！');
    if (f.phase === 'prep') {
      if (!f.felixMach) {
        f.felixMach = true;
        await S.say('费利克斯', ['柠檬枝？……对，老辈人是这么说的。边境那边的人说，柠檬树枝抽出来的鞭子，最能吓退他。', '院里那棵三年前就旱死了。西边草原上，你外婆的老菜园里还有一棵。', '砍刀挂在畜栏边那根柱子上，拿去。……天快黑了，快去快回。']);
        return;
      }
      return S.say('费利克斯', cyc(S, '_fx', [
        ['听着近，他还远；听着远，他就在你身边。', '我年轻时在大河边上赶牛，夜里听见过一回——轻得像隔着一整条河。', '那天晚上，牛群炸了营。跟我搭伙的那个伙计……第二天就没再见着。'],
        ['他是谁？……老辈人说，很久以前，平原上有个被宠坏的少爷。', '他想吃鹿肝，逼他爹去打鹿。他爹空着手回来，他就……把亲爹杀了。', '他爷爷把他绑在树上，拿鞭子抽，往伤口里抹辣椒，又放狗咬。最后咒他：一辈子背着他爹的骨头走。'],
        ['所以他怕三样东西：鞭子、辣椒、狗。', '狗是他的克星。……卡内洛平时连美洲豹都敢追，今天吓成那样。'],
        ['拉斐尔那小子，喝了酒，还在夜里吹口哨。', '吹哨人最喜欢醉汉。听说他会趴在醉汉的肚脐眼上，把肚子里的酒一口一口吸出来。', '……我去把畜栏的门再拴一道。']
      ]));
    }
    if (f.phase === 'night' || f.phase === 'end') return S.say('费利克斯', '……');
    await S.say('费利克斯', '嗯？');
  }
  async function macheteUse(S) {
    const f = S.f, e = S.ent('machete');
    if (e.s.taken) return S.narr('柱子上只剩一颗钉子。');
    if (f.phase !== 'prep') return S.narr('畜栏的柱子上挂着一把砍刀，刀刃磨得发亮。');
    e.s.taken = true; S.give('machete');
    await S.narr('你把砍刀从钉子上摘下来。沉甸甸的，木柄被手磨得油亮。');
    prepGoal(S);
  }
  async function lenaUse(S) {
    const f = S.f, e = S.ent('lena');
    if (f.phase !== 'prep') return S.narr('码得整整齐齐的柴堆。上面压着一把斧头。');
    if (f.fire) return S.narr('柴堆。灶已经烧起来了，够烧一整夜。');
    if (S.has('lena')) return S.narr('柴堆。你已经抱了一捆了——塞进屋里的灶膛就行。');
    e.s.less = true; S.give('lena');
    await S.narr('你抱起一捆干柴。柴底下爬出来一只蝎子，你一抖手，它钻进了土里。');
    prepGoal(S);
  }
  async function perreraUse(S) {
    const f = S.f;
    if (f.phase === 'end') return S.narr('卡内洛的狗窝。它不肯进去，就趴在门槛上。');
    await S.narr('卡内洛的狗窝，空的。\n窝里垫着一件外公的旧衬衫，它每天晚上都枕着睡。');
    if (f.phase === 'prep' && S.once('perrera')) await S.think('（它是外公一手养大的。外公不在了，它就只认外公留下的那段口哨。）');
  }

  /* ================= 屋子 ================= */
  async function casaEnter(S, first) {
    const f = S.f;
    if (f.phase === 'night') return;
    S.dark(f.phase === 'home' ? .45 : .6);
    if (f.phase === 'home') return abuelaIntro(S);
  }
  async function abuelaIntro(S) {
    const f = S.f;
    S.face('abuela_p', 'pl');
    await S.narr('外婆坐在门廊的摇椅上，手里捻着一串念珠。\n她听你把路上的事说完，摇椅停了。');
    let r = await S.ask('「两声口哨。一声响，一声轻。……轻的那一声，那个人离你们多近？」', ['就在路边的萨曼树底下。', '……很远吧？声音那么远。'], '外婆');
    if (r === 1) await S.say('外婆', '声音远，人就近。孩子，这是反着的。');
    await S.say('外婆', ['是吹哨人。听着近，他还远；听着远，他就在你身边。', '他是闻着酒味跟来的。拉斐尔喝了酒，又在草原上吹口哨——他是冲着拉斐尔来的。']);
    await S.say('外婆', ['今天夜里，他会坐到咱们家门口，把口袋放下，一根一根地数骨头。数完了，天一亮，这家就要少一个人。', '你外公说过：听见了，就得把他赶走。他怕三样东西——鞭子，辣椒，狗。']);
    await S.say('外婆', ['卡内洛跑了……它只认你外公的口哨。你外公的东西都在屋里那口箱子里，他写过一些东西。', '天黑以前备好：柠檬枝的鞭子、灶上挂的辣椒，灶还得烧着——柴在院子西边。\n我老了，跑不动。……拉斐尔的命，就靠你了。']);
    f.phase = 'prep'; prepGoal(S); S.cp('prep');
  }
  async function abuelaTalk(S) {
    const f = S.f; S.face('abuela_p', 'pl');
    if (f.phase !== 'prep') return S.say('外婆', '……');
    const L = prepLeft(S);
    if (L.length) {
      const tip = [];
      if (!S.has('latigo')) tip.push(S.has('machete') ? '柠檬树在西边草原上的老菜园里，过了木桥就是。' : '柠檬枝要砍——问费利克斯借砍刀。');
      if (!f.fire) tip.push(S.has('lena') ? '把柴塞进灶膛里，炭还没灭。' : '灶得烧着。柴堆在院子西边。');
      if (!S.has('aji')) tip.push('辣椒串挂在灶台上头的墙上。');
      if (!f.tune) tip.push('你外公的歌本在屋里那口箱子里。');
      else if (!f.rafaHint) tip.push('调子看不全？问问拉斐尔，他小时候天天跟着你外公放牛。先给他喝口水，缸里有。');
      return S.say('外婆', ['还差：' + L.join('、') + '。', tip.join('\n')]);
    }
    if (!f.rafaHint) await S.say('外婆', '歌本上那段调子，你凑全了吗？……拉斐尔小时候天天听你外公吹，去问问他。先给他喝口水。');
    if (!f.poured && S.once('smell')) await S.say('外婆', '……屋里一股酒味。那孩子带回来的半瓶烧酒，还在吊床边上。', { style: 'whisper' });
    const r = await S.ask('「都备好了？」', ['备好了。', '再等等。'], '外婆');
    if (r) return;
    return nightBegin(S);
  }

  /* 屋里的东西 */
  async function fogonUse(S) {
    const f = S.f, fg = S.ent('fogon');
    if (f.phase === 'night') return ajiUse(S);
    if (f.phase === 'end') return S.narr('灶膛里的火快灭了。屋里还飘着一股辣椒味。');
    if (f.fire) return S.narr('灶膛里的火烧得正旺，噼噼啪啪地响。锅里的咖啡咕嘟咕嘟冒泡。');
    if (f.phase !== 'prep') return S.narr('土灶。灶膛里埋着下午的炭，还有一点暗红。');
    if (!S.has('lena')) return S.narr('灶膛里只剩一点暗红的炭，快灭了。\n得添柴——院子西边有柴堆。');
    S.take('lena'); f.fire = true; fg.lit = true; fg.light = { r: 3.4, col: 'rgba(255,150,60,.22)', flick: true };
    S.sfx('match'); sizzle(S);
    await S.narr('你把柴一根一根塞进灶膛，鼓起腮帮子吹。\n炭灰扑了一脸。火苗「呼」地窜了起来。');
    prepGoal(S);
  }
  async function ristraUse(S) {
    const f = S.f, e = S.ent('ristra');
    if (S.has('aji')) return S.narr('墙上的辣椒串。剩下的几个，红得发黑。');
    if (f.phase !== 'prep') return S.narr('灶台上头挂着一串晒干的小辣椒。外婆说，平原上最辣的就是这种。');
    e.s.less = true; S.give('aji');
    await S.narr('你从墙上摘下半串辣椒。光是凑近闻一闻，眼泪就下来了。');
    prepGoal(S);
  }
  async function baulUse(S) {
    const f = S.f, e = S.ent('baul');
    if (!e.open) { e.open = true; S.sfx('open'); await S.narr('外公的木箱子。一股樟脑和旧皮子的味道。\n里面有一顶旧草帽、一条皮鞭，和一本卷了边的歌本。'); }
    if (f.phase === 'walk' || f.phase === 'home') return;
    if (S.once('oldwhip')) await S.narr('你拿起那条皮鞭，一抖——皮子早就脆了，「啪」地断成了两截。\n（得用柠檬枝。）');
    if (!f.tune) { await S.note('orden'); await S.note('tune'); }
    else {   // 读过以后，挑一页看，不再连开两张
      const r = await S.ask('外公的歌本。', ['看扉页（外公记下的规矩）', '看那页泡过水的残页', '合上']);
      if (r === 0) await S.note('orden'); else if (r === 1) await S.note('tune');
    }
    if (!f.tune) { f.tune = true; prepGoal(S); if (!f.rafaHint) await S.think('（中间两个音泡烂了……拉斐尔小时候天天跟外公放牛，他也许记得。）'); }
  }
  async function tinajaUse(S) {
    const f = S.f;
    if (S.has('agua')) return S.narr('水缸里的水凉丝丝的。你手里已经有一瓢了。');
    if (f.rafaHint) return S.narr('水缸。缸沿上搁着一只葫芦瓢。');
    S.give('agua');
    await S.narr('你用葫芦瓢舀了一瓢凉水。');
  }
  async function rafaUse(S) {
    const f = S.f;
    if (f.phase === 'night') return S.narr(f.poured ? '拉斐尔在吊床里打着鼾，嘴里嘟嘟囔囔。\n……他什么都不知道。' : '拉斐尔在吊床里打着鼾。\n满屋子都是他身上的酒味。门外那个人，就是闻着这个来的。');
    if (f.phase === 'end') return S.narr('拉斐尔还在睡。');
    if (S.has('agua') && !f.rafaHint) {
      S.take('agua'); f.rafaHint = true;
      await S.narr('你把一瓢凉水凑到他嘴边。\n他咕咚咕咚喝了一半，洒了一半，眼睛睁开了一条缝。');
      await S.say('拉斐尔', ['……外公的口哨？', '……小时候放牛，他一吹，卡内洛从三里地外就往回跑……', '嗦——咪——……中间那两声，一高一低。', '高的那声，跟头一声一样高。低的那声……就比最后一声高那么一点点。', '……托马斯，我好冷。']);
      await S.narr('他翻了个身，又睡死过去了。');
      return;
    }
    if (f.rafaHint) return S.narr('拉斐尔睡死过去了，打着鼾。');
    await S.say('拉斐尔', cyc(S, '_rf', ['……别吵……我就喝了一点点……', '……外婆……别念了……', '……渴……']));
  }
  async function botellaUse(S) {
    const f = S.f, e = S.ent('botella');
    if (f.poured) return S.narr('空酒瓶。瓶口还有一股甘蔗烧酒的味道。');
    if (f.phase === 'walk' || f.phase === 'home' || f.phase === 'end') return S.narr('拉斐尔从舞会上带回来的半瓶甘蔗烧酒。');
    const r = await S.ask('拉斐尔从舞会上带回来的半瓶甘蔗烧酒。\n外婆说，他是闻着酒味来的。', ['拿到门外倒掉', '别管它']);
    if (r) return;
    f.poured = true; e.s.empty = true; S.sfx('water');
    await S.narr(f.phase === 'night' ? '你拔开瓶塞，把酒从窗棂缝里全倒了出去。\n门外的数数声顿了一下。' : '你把酒全倒进了院子的土里。\n土「滋」地吸了进去，一股辛辣的甜味。');
  }
  /* 四弦琴：照简谱拨几个音试试（只是试音，不泄露答案） */
  async function cuatroUse(S) {
    const f = S.f;
    [392, 523, 659, 784].forEach((fr, i) => S.tone('triangle', fr, fr, .5, .06, i * .03, 2400));
    if (S.once('cuatro')) await S.narr('外公的四弦琴。你拨了一下，四根弦嗡嗡地响。\n外婆说，外公弹琴弹到半夜，卡内洛就趴在他脚边睡。');
    const r = await S.ask('照着简谱拨几个音？', ['拨几个音试试', '挂回去']);
    if (r) return;
    f.kpMode = 'cuatro'; KP.id = -1;
    await S.keypad('四弦琴（简谱）　1=哆 2=来 3=咪 4=发 5=嗦 6=啦 7=西\n随便拨五个音。', ['1', '2', '3', '4', '5', '6', '7'], 5);
    f.kpMode = null;
  }

  /* ================= 夜：他坐在门口数骨头 ================= */
  async function nightBegin(S) {
    const f = S.f;
    await S.say('外婆', ['进屋吧。把门闩上。', '他数骨头的时候，不管听见什么，都别开门。']);
    await S.fade(1, 700);
    S.hide('abuela_p'); S.show('abuela_i'); S.face('abuela_i', 3); S.show('moon');
    const d = S.ent('door'); d.open = false; d.locked = true; d.solid = true;
    for (const w of ['winW', 'winE']) S.ent(w).lit = true;
    S.pos(8, 6, 0); S.dark(.84); S.plr(2.6); S.amb('night');
    f.phase = 'night'; f.whip = 0; f.aji = 0; f.cnt = 0;
    await S.card('午夜', '', '煤油灯拧到了最小。\n外婆跪在圣母像前，一颗一颗地捻念珠。\n拉斐尔在吊床里打鼾。\n\n外面的草原上，虫子一下子全不叫了。');
    await S.fade(0, 700);
    S.goal('听。');
    S.cp('night');
    await nightArrive(S, false);
  }
  async function nightArrive(S, retry) {
    const f = S.f;
    if (!retry) {
      whistle(S, 'loud'); await S.wait(2400);
      await S.narr('口哨声。哆、来、咪、发、嗦、啦、西——\n很响，很亮，像就贴在窗户外面。');
      await S.think('（听着近……他还远。）');
      await S.wait(1200);
      whistle(S, 'faint'); await S.wait(3300);
      await S.narr('又是口哨。\n这一回很轻、很闷，像隔着一整片草原。');
      await S.say('外婆', '……来了。', { style: 'whisper' });
    } else {
      whistle(S, 'faint'); await S.wait(1800);
    }
    S.sfx('thud'); S.shake(300, 1); S.tone('triangle', 110, 50, .3, .12, 0, 400);
    const sb = S.ent('silbon'); sb.s.pose = 'sit'; S.show('silbon'); S.face('silbon', 1);
    const bn = S.ent('bones'); bn.num = 0; bn.s.scatter = false; S.show('bones');
    S.focus(8, 9);
    if (!retry) await S.narr('门外「咚」的一声。\n是一只沉甸甸的口袋，放在了门槛外面。');
    clack(S, 1); await S.wait(500);
    if (!retry) {
      await S.narr('咔。\n……uno。（一。）');
      S.focus(null);
      await S.say('外婆', ['他在数。数到最后一根，天一亮，这屋里就要少一个人。', '鞭子、辣椒、狗——照你外公写的，一样一样来。'], { style: 'whisper' });
    } else {
      S.focus(null);
      const tip = deaths >= 3 ? '（鞭子在窗边抽，辣椒扔进灶里，最后在窗边吹：5 3 5 2 1。）'
        : deaths >= 2 ? '（先鞭子，再辣椒，最后才是狗。调子是 5 3 ? ? 1——第三声和第一声一样，第四声只比最后一声高一点。）'
          : '（先鞭子，再辣椒，最后才是狗。别开门，别吹往上爬的调子。）';
      await S.think(tip);
    }
    startCount(S);
  }
  function startCount(S) {
    const f = S.f;
    f.counting = true; f.cnt = 0; f.whip = 0; f.aji = 0; f.warn30 = false;
    S.ent('bones').num = 0;
    S.timer(TOTAL, '骨头 0/' + BONES, countDone, { during: true });
    nightGoal(S);
  }
  async function countDone(S) {
    const f = S.f; f.counting = false; deaths++;
    S.ent('bones').num = BONES; S.ent('bones').s.scatter = false; S.ent('silbon').s.pose = 'sit';
    clack(S, BONES);
    await S.narr('……cuarenta。（四十。）');
    S.amb('none'); await S.wait(900);
    await S.narr('门外安静了。\n骨头一根一根地装回口袋里。哗啦。哗啦。');
    S.hide('bones'); S.ent('silbon').s.pose = 'stand'; S.focus(9, 9);
    await S.narr('门外那个人站了起来。很高，比门框还高。\n他把口袋扛上肩，在门口站了很久，像是在等屋里的谁。');
    S.focus(null);
    whistle(S, 'loud'); await S.wait(2000);
    await S.narr('口哨声又响起来了。很响，很亮，就像贴着你的耳朵——');
    await S.scare('face', { face: 'silbon', dur: 1.1 });
    S.hide('silbon');
    await S.narr('……他已经走远了。');
    await S.end({ bad: true, id: 'counted', title: '数完了', text: '天亮的时候，外婆的念珠掉在了地上。\n她没有去捡。\n\n吊床里，拉斐尔还睡着，脸朝着墙。\n外婆叫了他三声。\n\n门槛外面的泥地上，有一圈浅浅的印子——\n像是有人在那里放过一只很重的口袋。' });
  }
  async function winUse(S) {
    const f = S.f;
    if (f.phase === 'night' && f.counting) {
      const r = await S.ask('木窗棂外面就是门廊。他蹲在门边，背对着这扇窗。', ['抽响柠檬鞭', '吹外公的口哨（叫卡内洛）', '从窗缝往外看', '算了']);
      if (r === 0) return whipUse(S);
      if (r === 1) return whistleUse(S);
      if (r === 2) return peek(S);
      return;
    }
    if (f.phase === 'night') return S.narr('窗外的门廊空荡荡的。');
    await S.narr('木头窗棂，一根根拇指粗的木条。外面是门廊和院子。\n外婆说：天黑以前，别在窗边吹口哨。');
  }
  async function whipUse(S) {
    const f = S.f;
    if (!S.has('latigo')) return S.narr('你手里没有鞭子。');
    crack(S); S.shake(220, 1);
    if (f.whip) { await S.narr('啪！\n他缩了缩脖子，又接着数。（鞭子已经抽过了。）'); return; }
    f.whip = 1; S.timerAdd(WHIP_BONUS);
    const sb = S.ent('silbon'), bn = S.ent('bones'); sb.s.pose = 'flinch'; bn.s.scatter = true;
    await S.narr('啪！\n柠檬枝抽在窗棂上，响得像一声枪。');
    await S.narr('门外，骨头哗啦啦散了一地。\n那个影子缩成一团，抱住了头——像很多很多年前，被人绑在树上的那个人。');
    sb.s.pose = 'sit'; bn.s.scatter = false;
    await S.think('（他又开始数了……少了好几根。他是捡起来重新数的。）');
    nightGoal(S);
  }
  async function ajiUse(S) {
    const f = S.f, fg = S.ent('fogon');
    if (!f.counting) return S.narr('灶膛里的火噼啪地响。');
    const r = await S.ask('灶膛里的炭火烧得通红。', ['把辣椒扔进火里', '算了']);
    if (r) return;
    sizzle(S); S.sfx('match'); fg.s.chili = true;
    if (!f.whip) {
      S.timerAdd(-EARLY_AJI_PEN);
      await S.narr('辣椒在火里噼啪炸开。呛人的烟顺着门缝钻出去。\n门外咳了两声——又接着数，数得更急了。');
      await S.think('（外公写的是……先抽鞭子，再抹辣椒。没有伤口，辣椒抹给谁？）');
      return;
    }
    if (f.aji) return S.narr('烟已经够呛了。他还在咳。');
    f.aji = 1; S.timerAdd(AJI_BONUS);
    const sb = S.ent('silbon'), bn = S.ent('bones'); sb.s.pose = 'flinch'; bn.s.scatter = true; cough(S);
    await S.narr('辣椒在炭火上噼啪炸开。\n辛辣的红烟贴着地，从门缝底下钻了出去——');
    await S.narr('门外，他咳了起来。撕心裂肺地咳，像有人把辣椒一把一把抹进了他背上的鞭痕里。\n骨头又撒了一地。');
    sb.s.pose = 'sit'; bn.s.scatter = false;
    nightGoal(S);
  }
  const ascending = v => v.split('').every((c, i, a) => i === 0 || +c > +a[i - 1]);
  async function whistleUse(S) {
    const f = S.f;
    f.kpMode = 'whistle'; KP.id = -1;
    const v = await S.keypad('吹口哨（简谱）　1=哆 2=来 3=咪 4=发 5=嗦 6=啦 7=西\n吹五个音。', ['1', '2', '3', '4', '5', '6', '7'], 5);
    f.kpMode = null;
    if (v == null) return;
    await S.wait(500);
    if (v === TUNE) {
      f.tuneOk = true;
      if (f.whip && f.aji) return dogCome(S);
      S.timerAdd(-EARLY_DOG_PEN); whimper(S, .05);
      const dg = S.ent('canelo_c'); S.place('canelo_c', 0, 12, 2); dg.s.cower = true; dg.alpha = .8;
      await S.narr('院子边上，一个肉桂色的影子探了探头，夹着尾巴，细细地呜咽了一声。\n卡内洛听见了。可它不敢过来。');
      S.hide('canelo_c'); dg.s.cower = false; dg.alpha = 1;
      await S.say('外婆', '狗也怕他！先让他挨鞭子、挨辣椒——他伤了、怕了，狗才敢扑上去。', { style: 'whisper' });
      return nightGoal(S);
    }
    if (ascending(v)) {
      f.asc = (f.asc || 0) + 1;
      if (f.asc >= 2) {
        whistle(S, 'faint', .2, 1.6); await S.wait(1600);
        await S.narr('门外的数数声停了。\n一模一样的调子，从门缝底下吹了进来——就在你脚边。');
        await S.scare('face', { face: 'silbon', dur: 1.1 });
        deaths++;
        return S.die('你吹了他的调子。\n他就不用再数了——他已经找到了要带走的那一个。', '你吹了他的调子');
      }
      S.timerAdd(-ASC_PEN);
      whistle(S, 'faint', .2, 1.4); await S.wait(1500);
      await S.scare('face', { face: 'silbon', dur: .9 });
      await S.narr('门外的数数声停了。\n然后，一模一样的调子，从门缝底下吹了回来——轻轻的，就贴着你的脚边。');
      await S.say('外婆', '往上爬的调子是他的！再吹一次，他就进来了！', { style: 'whisper' });
      await S.narr('……咔。他又开始数了。数得更快。');
      return;
    }
    const n = f.wrongT = (f.wrongT || 0) + 1;
    S.timerAdd(-WRONG_PEN);
    S.tone('sine', 700, 650, .5, .03, 0, 900);
    await S.narr('草原上没有动静。\n门外的数数声顿了顿，像是在听——然后数得更快了。');
    /* 逐级提示：1 次给方向（按错法），2 次指出哪几声错，3 次给前三声，4 次直接给答案 */
    let tip;
    const bad = [...v].map((c, i) => c !== TUNE[i] ? i + 1 : 0).filter(Boolean);
    if (n === 1) tip = (v[0] !== '5' || v[1] !== '3') ? '头两个音，歌本上写着：五、三。' : v[4] !== '1' ? '最后一声要落在「一」上——像太阳落进草原。' : '调子是往下落的。中间那个高的，跟头一声一样高。';
    else if (n === 2) tip = '第' + bad.map(cnum).join('、') + '声不对。' + (bad.includes(3) ? '\n第三声，跟头一声一样高。' : '') + (bad.includes(4) ? '\n第四声，只比最后一声高一点点。' : '');
    else if (n === 3) tip = '五、三、五……后面两声一声比一声低，最后落到一。';
    else tip = '嗦、咪、嗦、来、哆——五、三、五、二、一！';
    await S.say('外婆', tip, { style: 'whisper' });
  }
  async function peek(S) {
    const f = S.f;
    if (S.once('peek')) {
      await S.scare('face', { face: 'silbon', dur: .9 });
      await S.narr('门廊上蹲着一个瘦得只剩骨架的人。破草帽，赤着脚。\n一只口袋张着嘴。他从里面拿出一根白色的东西，看一看，放在地上。');
      return;
    }
    await S.narr('他还蹲在那里，一根一根地往外拿。\n门槛外的骨头，已经堆了' + (f.cnt || 0) + '根。');
  }
  async function doorUse(S) {
    const f = S.f, d = S.ent('door');
    if (f.phase !== 'night') return S.narr('敞着的木门。门框上钉着一块旧马蹄铁，开口朝上。');
    if (!f.counting) return S.narr('门闩插得好好的。');
    const r = await S.ask('门板的缝里透进一丝凉气。门外，咔……咔……', ['从门缝往外看', '拉开门闩出去', '算了']);
    if (r === 0) return peek(S);
    if (r !== 1) return;
    if (!f.doorWarn) {
      f.doorWarn = 1; S.sfx('locked');
      await S.narr('你的手刚碰到门闩，外婆一把攥住了你的手腕。\n她的手冰凉，力气大得吓人。');
      await S.say('外婆', '别开！他数骨头的时候，谁开门，他就数谁的！', { style: 'whisper' });
      return;
    }
    S.sfx('open'); d.open = true;
    await S.narr('门闩拔开了。\n门外的数数声，一下子停了。');
    await S.scare('face', { face: 'silbon', dur: 1.1 });
    deaths++;
    await S.die('一只又长又冷的手从门缝里伸进来，搭在了你的肩上。\n「……uno。」', '你开了门');
  }
  async function abuelaNight(S) {
    const f = S.f; S.face('abuela_i', 'pl');
    if (!f.counting) return S.say('外婆', '……');
    if (!f.whip) return S.say('外婆', '鞭子！先抽鞭子——到窗边去！', { style: 'whisper' });
    if (!f.aji) return S.say('外婆', '辣椒！扔进灶里！', { style: 'whisper' });
    const n = f.wrongT || 0;
    const tip = n >= 2 || deaths >= 2 ? '五、三、五、二、一。嗦咪嗦来哆。' : f.rafaHint ? '拉斐尔说的：高的那声跟头一声一样，低的那声只比最后一声高一点。' : '歌本上是五、三，最后落在一。中间那个高的，跟头一声一样高。';
    await S.say('外婆', ['快！叫卡内洛！', tip], { style: 'whisper' });
  }

  /* 狗叫了：他站起来，背着口袋走了 */
  async function dogCome(S) {
    const f = S.f;
    S.clearTimer(); f.counting = false; f.won = true;
    await S.wait(400);
    bark(S, .05); await S.wait(800);
    await S.narr('草原那头，一声狗叫。\n又一声。越来越近。');
    S.place('canelo_c', 8, 13, 3); S.focus(8, 10);
    bark(S, .1);
    await S.walk('canelo_c', [7, 11], 7);
    const dg = S.ent('canelo_c'); dg.s.bark = true; S.face('canelo_c', 2);
    bark(S, .2); S.shake(300, 1); await S.wait(500); bark(S, .22);
    await S.narr('卡内洛！\n它浑身的毛都竖着，冲着门边那个影子，叫得震天响。');
    const sb = S.ent('silbon'); sb.s.pose = 'stand'; S.face('silbon', 0); bark(S, .2);
    await S.narr('门外那个人站了起来。\n很高。比门框还高。破草帽的帽檐蹭着屋檐的茅草。');
    S.hide('bones'); bark(S, .22);
    await S.narr('他弯下腰，把地上的骨头一把一把扫回口袋里，扛上肩。');
    bark(S, .18);
    await S.walk('silbon', [15, 11], 2.4);
    whistle(S, 'loud', 0, .8);
    await S.alpha('silbon', 0, 1200);
    await S.narr('口哨声又响起来了。很响，很亮——\n……他走远了。');
    dg.s.bark = false; S.focus(null);
    await S.fade(1, 1200);
    S.ent('door').open = true; S.ent('door').locked = false; S.ent('door').solid = false;
    S.place('canelo_c', 8, 10, 3); S.ent('canelo_c').s.collar = S.has('collar');
    S.pos(8, 9, 0); S.dark(.25); S.plr(null); S.amb('wind'); f.phase = 'end';
    await S.card('天亮了', '', '鸡叫第三遍的时候，外婆的念珠才停下来。\n你拉开门闩。\n\n门槛外面的泥地上，有一圈浅浅的印子。\n卡内洛趴在印子上，守了一整夜。');
    await S.fade(0, 900);
    if (S.has('collar')) await S.narr('你把那个挣断的项圈系回卡内洛的脖子上。\n它舔了舔你的手。');
    await S.say('外婆', ['……走了。', '你外公要是知道，会高兴的。']);
    if (f.poured) {
      await S.narr('中午，拉斐尔才醒。他揉着脑袋走到门口，看见了门槛边那只空酒瓶。\n他看了很久，一句话也没说。');
      return S.end({ id: 'sober', title: '第八夜　完（最后一瓶酒）', text: '后来拉斐尔再也没碰过一口酒。\n每年那一天，他都会去镇上给卡内洛买一根最大的牛骨头。\n\n卡内洛活到了十六岁。\n它老得走不动了以后，每天晚上还是趴在门槛上。\n\n有一年雨季，我回外婆的牧场。\n半夜，草原上远远地飘来一声口哨。\n很响，很亮。\n\n——他还远。' });
    }
    await S.narr('中午，拉斐尔才醒。头疼得直哼哼，什么都不记得了。\n只记得有人往他嘴里灌凉水。');
    await S.end({ id: 'dog', title: '第八夜　完', text: '那年旱季结束以前，我回了城里。\n\n后来听外婆在电话里说，拉斐尔还是常去镇上的舞会。\n只是回来的路上，他再也没吹过口哨。\n\n卡内洛每天晚上都趴在门槛上。\n外婆说，有好几回，它半夜突然站起来，冲着黑漆漆的草原叫。\n叫一阵，又趴下。\n\n草原上，什么声音也没有。' });
  }

  /* ================= 地图 ================= */
  function MAPS() {
    return {
      /* ---------------- 草原 ---------------- */
      sabana: {
        amb: 'wind', dark: .36, plr: 3.4, legend: LEG, tileOpts: { treeC: '#26361e', grassC: '#4a4a26', fenceBase: 'dirt' },
        rows: sabanaRows(),
        ents: ids('sabana', [
          { id: 'rafa', x: 3, y: 8, spr: '@rafa', dir: 2, on: S => S.say('拉斐尔', cyc(S, '_rs', S.f.w2 ? ['……走。快走。', '别回头……托马斯，别回头。'] : ['嘿嘿……外婆家的咖啡，最解酒……', '你知道吗，舞会上那个姑娘冲我笑了三回……'])) },
          { id: 'canelo_s', x: 5, y: 8, spr: 'dog', dir: 2, solid: false, on: S => S.narr(S.f.w1 ? '卡内洛竖着耳朵，喉咙里呜呜地响。' : '卡内洛，外公养大的狗。肉桂色的毛，耳朵缺了一角——年轻时跟美洲豹打过架。') },
          { id: 'silS', x: 25, y: 5, spr: 'silbon', hidden: true, solid: false, dir: 1 },
          { id: 'saman', x: 21, y: 4, w: 3, spr: 'saman', on: S => S.narr(S.f.w2 ? '萨曼树底下空荡荡的。\n草被踩倒了一片，倒伏的方向，朝着你们来的路。' : '一棵很老的萨曼树，树冠像一把撑开的大伞。\n费利克斯说，老辈人讲过，很久以前有个人被绑在这样一棵树上。') },
          { id: 'cruz', x: 27, y: 7, spr: 'cruz', on: N('路边的小十字架，刷着白漆。脚下摆着塑料花和半截蜡烛。\n有人在这条路上出了事。你在胸口画了个十字。') },
          { id: 'limon', x: 4, y: 3, spr: 'limon', on: limonUse },
          { id: 'skull', x: 15, y: 6, spr: 'calavera', solid: false, on: N('一个牛头骨，被太阳晒得雪白。\n眼窝里住着一窝蚂蚁。') },
          { id: 'termite', x: 31, y: 10, spr: 'termitero', on: N('一人多高的白蚁堆，硬得像砖。\n傍晚的风从它身上的小孔里穿过去，呜呜地响——不是口哨。不是。') },
          { id: 'collar', x: 12, y: 10, spr: 'collar', solid: false, on: collarUse },
          ...[[11, 12], [13, 14], [14, 11], [16, 13], [18, 12], [17, 14], [12, 3], [33, 2], [36, 13], [20, 14]].map(([x, y], i) => ({ id: 'palm' + i, x, y, spr: 'moriche', on: N(i % 2 ? '莫里切棕榈。树干上一圈一圈的疤，像谁一刀一刀刻上去的。' : '莫里切棕榈。叶子在风里沙沙地响。\n平原上的人说，有棕榈的地方就有水。') })),
          { id: 'gateA', x: 39, y: 8, spr: 'invisible', touch: sabanaGate },
          { id: 'gateB', x: 39, y: 9, spr: 'invisible', touch: sabanaGate },
          { id: 'westA', x: 0, y: 8, spr: 'invisible', touch: sabanaWest },
          { id: 'westB', x: 0, y: 9, spr: 'invisible', touch: sabanaWest },
          { id: 'gpost', x: 39, y: 7, spr: 'puerta', on: N('牧场的栅门。木头上烙着外公家的牛印。') }
        ]),
        enter: sabanaEnter,
        step: sabanaStep,
        tick(S, dt) {   // 卡内洛在前头颠颠地跑
          const d = S.ent('canelo_s'); if (!d || d.hidden || S.f.dogGone || d.mv || S.busy) return;
          const ex = Math.round(d.px / TS), ey = Math.round(d.py / TS), tx = Math.min(38, S.pl.x + 2), ty = S.pl.y;
          if (Math.abs(ex - tx) + Math.abs(ey - ty) <= 1) return;
          const dir = bfsStep(curMap(), ex, ey, tx, ty, d); if (dir >= 0) startMove(d, dir, 5.5);
        }
      },
      /* ---------------- 牧场院子 ---------------- */
      hato: {
        amb: 'night', dark: .42, plr: 3.4, legend: LEG, tileOpts: { grassC: '#3a4a26', treeC: '#22341e', fenceBase: 'dirt' },
        rows: hatoRows(),
        ents: ids('hato', [
          { id: 'houseIn', x: 14, y: 2, spr: 'invisible', touch: async S => S.go('casa', 8, 12, 3) },
          { id: 'gateW', x: 0, y: 10, spr: 'invisible', touch: async S => { if (S.f.phase === 'home') { await S.narr('外婆在等你。先去门廊找她。'); return S.pos(1, 10, 2); } S.sfx('open'); await S.go('sabana', 38, 8, 1); } },
          { id: 'lena', x: 3, y: 5, w: 2, spr: 'lena', on: lenaUse },
          { id: 'perrera', x: 8, y: 6, spr: 'perrera', on: perreraUse },
          { id: 'limonD', x: 11, y: 9, spr: 'limonDead', on: N('院子里的柠檬树。三年前大旱的那一年死了。\n外公也是那一年走的。') },
          { id: 'machete', x: 19, y: 8, spr: 'machete', on: macheteUse },
          { id: 'felix', x: 18, y: 10, spr: '@felix', dir: 1, on: felixTalk },
          { id: 'rafa_h', x: 2, y: 10, spr: '@rafa', hidden: true, solid: false },
          { id: 'cow1', x: 23, y: 8, spr: 'vaca', on: N('瘤牛。背上的峰一耸一耸的。\n它们今晚不肯躺下。') },
          { id: 'cow2', x: 26, y: 10, spr: 'vaca', col: '#8a6a4a', dir: 1, on: N('一头棕色的母牛，冲着西边的草原哞了一声。') },
          { id: 'cow3', x: 24, y: 12, spr: 'vaca', col: '#d8d0c0', on: N('小牛犊挤在妈妈的肚子底下，只露出两只耳朵。') },
          { id: 'well', x: 6, y: 14, spr: 'well', on: N('水井。辘轳上的绳子被晒得发白。') },
          { id: 'saddleH', x: 16, y: 5, spr: 'silla', on: N('挂在架子上的旧马鞍。外公的。没人舍得用。') }
        ]),
        enter: hatoEnter
      },
      /* ---------------- 外婆的屋子（屋里 + 门廊） ---------------- */
      casa: {
        amb: 'room', dark: .5, plr: 3.2, wall: 'mud', legend: LEG, tileOpts: { fenceBase: 'dirt' },
        rows: casaRows(),
        ents: ids('casa', [
          /* 屋里 */
          { id: 'fogon', x: 1, y: 2, w: 2, spr: 'fogon', on: fogonUse },
          { id: 'ristra', x: 3, y: 1, spr: 'ristra', on: ristraUse },
          { id: 'cuatro', x: 5, y: 1, spr: 'cuatro', on: cuatroUse },
          { id: 'clockC', x: 7, y: 1, spr: 'wallclock', on: S => S.narr(S.f.phase === 'night' ? '墙上的钟。十二点过了。\n秒针走一下，门外就「咔」一声。' : '墙上的挂钟，走得比镇上的钟慢一刻钟。外婆从来不调。') },
          { id: 'calendar', x: 9, y: 1, spr: 'calendario', on: S => S.note('copla') },
          { id: 'altar', x: 11, y: 2, spr: 'altar', light: { r: 2.2, col: 'rgba(255,200,120,.18)', flick: true }, on: S => S.narr(S.f.phase === 'night' ? '圣母像前的蜡烛烧下去一半了。\n火苗一直往门那边歪，像是门缝里有风往里吸。' : '小小的圣母像，披着蓝斗篷。蜡烛和一束塑料花。\n外婆每天早晚在这里念一遍玫瑰经。') },
          { id: 'retrato', x: 13, y: 1, spr: 'retrato', on: N('外公年轻时的照片。戴着平原人的宽檐帽，牵着一匹马。\n脚边蹲着一条小狗——是卡内洛小时候。') },
          { id: 'hamaca', x: 3, y: 4, w: 3, spr: 'hamaca', on: rafaUse },
          { id: 'botella', x: 6, y: 5, spr: 'botella', on: botellaUse },
          { id: 'mesa', x: 8, y: 3, w: 2, spr: 'mesa', light: { r: 3, col: 'rgba(255,190,110,.16)', flick: true }, on: N('饭桌。煤油灯、一杯没喝完的咖啡、一碟玉米饼。') },
          { id: 'baul', x: 14, y: 3, spr: 'baul', on: baulUse },
          { id: 'silla', x: 14, y: 6, spr: 'silla', on: N('一副旧马鞍架在凳子上。皮子裂了口，铜马镫磨得发亮。') },
          { id: 'tinaja', x: 1, y: 6, spr: 'tinaja', on: tinajaUse },
          { id: 'abuela_i', x: 12, y: 4, spr: '@abuela', dir: 3, hidden: true, on: abuelaNight },
          /* 墙面：前门、两扇窗 */
          { id: 'door', x: 8, y: 8, spr: 'ldoor', open: true, solid: false, on: doorUse },
          { id: 'winW', x: 4, y: 8, spr: 'lwin', on: winUse },
          { id: 'winE', x: 12, y: 8, spr: 'lwin', on: winUse },
          /* 门廊 */
          { id: 'abuela_p', x: 11, y: 9, spr: '@abuela', dir: 0, on: abuelaTalk },
          { id: 'mecedora', x: 12, y: 9, spr: 'mecedora', on: N('外婆的摇椅。藤编的坐垫被坐出了一个浅浅的窝。') },
          { id: 'banco', x: 2, y: 9, spr: 'bench', on: N('门廊上的长凳。外公以前就坐在这儿，一边喝咖啡一边吹口哨唤狗。') },
          { id: 'posteW', x: 4, y: 10, spr: 'poste', on: N('撑着屋檐的木柱子。上面刻着几道横杠——是拉斐尔和你小时候量身高留下的。') },
          { id: 'posteE', x: 13, y: 10, spr: 'poste', clip: true, on: S => S.note('clip') },
          { id: 'silbon', x: 9, y: 9, spr: 'silbon', hidden: true, solid: false, dir: 1, light: { r: 1.8, col: 'rgba(150,170,210,.12)' } },
          { id: 'bones', x: 8, y: 10, spr: 'bones', hidden: true, solid: false, num: 0 },
          { id: 'canelo_c', x: 8, y: 13, spr: 'dog', hidden: true, solid: false, dir: 3 },
          { id: 'moon', x: 7, y: 10, w: 3, spr: 'invisible', hidden: true, light: { r: 3.4, a: .5, col: 'rgba(140,160,210,.07)' } },
          { id: 'casaOut', x: 8, y: 13, spr: 'invisible', touch: async S => { if (S.f.phase === 'night' || S.f.phase === 'end') return; if (S.f.phase === 'home') { await S.narr('外婆在门廊上等你。'); return S.pos(8, 12, 3); } await S.go('hato', 14, 3, 0); } }
        ]),
        enter: casaEnter
      }
    };
  }

  /* ================= 章节 ================= */
  defChapter({
    id: 'silbon', n: 8, title: '吹哨人', sub: '平原上的口哨声：听着近，他还远；听着远，他就坐在你家门口，数骨头。', origin: '委内瑞拉 / 哥伦比亚平原传说', color: '#7a4a1e',
    amb: 'wind', floor: 'dirt', wall: 'mud', dark: .4, plr: 3.4,
    people: {
      me: { key: 'tomas', skin: '#c89468', hair: '#1a1210', hs: 'short', top: '#e8e2d0', top2: '#c8c0a8', bottom: '#5a4632', shoes: '#6a5236', hat: 'straw', hatC: '#c8a868' },
      rafa: { key: 'rafa', skin: '#b88458', hair: '#120c0a', hs: 'short', top: '#8a2a2a', top2: '#5a1a1a', bottom: '#2a2a32', shoes: '#3a2a1a', hat: 'straw', hatC: '#3a2a1a' },
      abuela: { key: 'abuela', skin: '#a87a54', hair: '#d8d4ce', hs: 'bun', top: '#2a2228', top2: '#5a4e58', bottom: '#2a2228', robe: true, shoes: '#1a1414' },
      felix: { key: 'felix', skin: '#9a6a44', hair: '#bdb6ac', hs: 'short', top: '#d8d2c0', top2: '#a8a090', bottom: '#4a4a52', shoes: '#5a4630', hat: 'straw', hatC: '#b89a62' }
    },
    items: {
      machete: { name: '砍刀', desc: '畜栏柱子上摘下来的砍刀。平原上的人走到哪儿都带着它。' },
      latigo: { name: '柠檬枝鞭子', desc: '一根又长又直的柠檬树枝，削掉了叶子和刺。甩一下，「咻」的一声。' },
      aji: { name: '辣椒串', desc: '半串晒干的小辣椒，红得发黑。凑近闻一闻就流眼泪。' },
      lena: { name: '一捆干柴', desc: '院子西边柴堆上抱来的干柴。' },
      agua: { name: '一瓢凉水', desc: '葫芦瓢里的井水，凉丝丝的。拉斐尔一直嚷着渴。' },
      collar: { name: '卡内洛的项圈', desc: '挣断的皮项圈，铜扣上刻着「CANELO」。' }
    },
    notes: {
      copla: { title: '日历背面的小调', text: '（外婆让人抄在旧日历背面的一首平原小调，字歪歪扭扭的。）\n\n听见口哨贴着耳朵吹，\n别慌，他还在河那边；\n听见口哨远远地飘，\n快熄灯，他就坐在你门前。\n\n哆、来、咪、发、嗦、啦、西，\n一个音一个音往上爬；\n背上的口袋哗啦啦响，\n装的是他亲爹的骨头渣。\n\n喝醉的汉子莫唱歌，\n夜里的草原莫吹哨——\n他循着酒味走过来，\n坐在门口，一根一根地数。' },
      orden: { title: '外公的歌本·扉页', text: '（外公的字，铅笔写的，写得很用力。）\n\n我爹说的，记下来，别忘了：\n\n一、他怕三样东西：鞭子，辣椒，狗。\n　当年他爷爷就是这么罚他的——\n　绑在树上，先拿柠檬枝抽，\n　再把辣椒抹进伤口里，\n　最后放狗咬。\n　要赶他走，就照这个样子，一样一样来。\n　次序乱了，不灵。\n\n二、他坐在门口数骨头的时候，\n　别开门，别出声应他。\n\n三、唤狗的调子，千万别吹成往上爬的。\n　往上爬的，是他的调子。' },
      tune: { title: '歌本里的残页', text: '（一页被水泡过的纸，墨洇开了一大片。）\n\n唤卡内洛（口哨）\n\n　　5　　3　　▒　　▒　　1\n\n（中间两个音泡烂了，看不清。）\n\n旁边一行小字：\n「这调子是往下落的，像太阳落进草原。\n　狗听见了，就知道是我回来了。」\n\n1=哆　2=来　3=咪　4=发　5=嗦　6=啦　7=西' },
      clip: { title: '门廊柱子上的剪报', text: '（一张泛黄的旧报纸，钉在柱子上，是外公剪下来的。地方报纸上的「平原民俗」专栏。）\n\n……平原上流传最广的鬼，莫过于「吹哨人」。他极高、极瘦，戴一顶破草帽，背一只口袋，里面装着他父亲的骨头。\n\n他为何杀父，各地讲法不一：有的说是为了一副鹿内脏，有的说另有隐情。至于他会把口袋放在人家门口数骨头，也有两种讲法：一说屋里有人听见便无事，无人听见，天亮时这家便要死人；一说听见了也不算完，得把他赶走。\n\n在边境另一侧的平原上，还有人说，柠檬树枝做的鞭子最能吓退他。' }
    },
    legend: '「吹哨人」（El Silbón）是流传在委内瑞拉与哥伦比亚交界的大平原（Los Llanos）上的鬼怪传说。人们描述他极高、极瘦，有人说有六米高，戴一顶破草帽，肩上背着一只口袋，里面装着他父亲的骨头。他的口哨沿着「哆、来、咪、发、嗦、啦、西」的音阶一级一级往上爬，再往下落。平原上最出名的说法是：口哨听着近，他其实还远；听着远，他就在你身边。\n\n他的来历有好几种版本。流传最广的一种说，他是个被宠坏的年轻人，逼父亲去打鹿，想吃鹿的内脏；父亲空手而归，他就杀了父亲。他的祖父发现后，把他绑在树上鞭打，往伤口上抹辣椒，又放狗咬他，最后诅咒他永远背着父亲的骨头在平原上游荡。也有版本说他杀父另有缘由（例如为了妻子），细节各地不同。正因为这段惩罚，人们相信他怕狗、怕辣椒、怕鞭子；有一种说法认为柠檬树枝做的鞭子尤其管用，但这只在部分地方流传。\n\n关于他的禁忌和规矩也很多：据说他专找醉汉和浪荡子，有的说他会从醉汉的肚脐里把酒吸出来；据说夜里在草原上吹口哨会把他招来；据说他会把口袋放在人家门口，一根一根地数骨头——如果屋里有人听见，就平安无事，如果没人听见，天亮时这家就会有人死去。这个传说在两国的平原民谣、广播故事和影视作品里一再出现，至今仍是平原上最有名的鬼故事之一。\n\n本章的人物（托马斯、拉斐尔、外婆、费利克斯）和狗卡内洛都是虚构的。「照他挨罚的次序——鞭子、辣椒、狗——一样一样来」的驱赶办法、外公唤狗的口哨、他数满四十根骨头的计数、日历背面的小调、歌本和剪报，都是游戏为了玩法编写的，不是传说本身的内容。',
    start: { map: 'sabana', x: 3, y: 9, dir: 2 },
    faces: FACES,
    endings: { dog: '第八夜　完', sober: '最后一瓶酒（隐藏）', counted: '数完了' },
    resume: {
      prep: async S => { S.amb('room'); },
      night: async S => {
        S.hide('silbon'); S.hide('bones'); S.hide('canelo_c'); S.ent('silbon').alpha = 1;
        S.dark(.84); S.plr(2.6); S.amb('night');
        await nightArrive(S, true);
      }
    },
    async intro(S) {
      S.f.phase = 'walk';
      await S.card('第八夜　吹哨人', '1971年11月　委内瑞拉　阿普雷平原', '那年我十五岁。\n爸爸送我去外婆的牧场，帮忙赶牛过旱季。\n\n那天下午，表哥拉斐尔带我去镇上看斗鸡、跳霍罗波舞。\n回来的路上，他喝多了。\n他一路吹着口哨。\n\n平原上的老人都说——\n天黑以后，别吹口哨。');
    },
    tick(S, dt) {
      const f = S.f;
      /* 口哨密码盘：按一下，响一个音 */
      const kp = W.keypad;
      if (kp && f.kpMode) {
        if (kp.id !== KP.id) { KP.id = kp.id; KP.n = 0; }
        while (KP.n < kp.parts.length) { const n = +kp.parts[KP.n]; if (f.kpMode === 'cuatro') { const fr = SCALE[n - 1]; S.tone('triangle', fr, fr, .6, .08, 0, 2600); S.tone('sine', fr * 2, fr * 2, .3, .02, 0, 0); } else noteTone(S, n); KP.n++; }
      }
      /* 数骨头：倒计时剩多少，他就还差多少根 */
      if (f.counting && W.timer) {
        const c = clampN(BONES - Math.ceil(W.timer.left / INT), 0, BONES);
        if (c !== f.cnt) {
          if (c > (f.cnt || 0)) { clack(S, c); if (c >= BONES - 8) S.sfx('heart'); }
          f.cnt = c; S.ent('bones').num = c;
          if (c >= 30 && !f.warn30) { f.warn30 = true; S.toast('外婆：「三十了……他快数完了！」'); }
        }
        /* 鞭子、辣椒把他打乱以后，他是从头捡起来重新数的：标签写明，不让人以为停住了 */
        const lb = c === 0 && W.timer.left > TOTAL ? '骨头散了一地·他在重新捡' : '骨头 ' + c + '/' + BONES;
        if (W.timer.label !== lb) W.timer.label = lb;
      }
      /* 夜里屋里的声音：外婆捻念珠的低语、拉斐尔的鼾声 */
      if (f.phase === 'night' && W.mapId === 'casa') {
        SIL.amb = (SIL.amb ?? 3) - dt;
        if (SIL.amb <= 0) {
          SIL.amb = 4.5 + Math.random() * 3;
          if (Math.random() < .55) [0, .22, .5, .7].forEach((d, i) => S.tone('triangle', 200 + (i % 2) * 30, 180, .18, .018, d, 500));
          else { S.tone('sawtooth', 75, 52, .7, .025, 0, 260); S.tone('sawtooth', 58, 70, .5, .015, .9, 240); }
        }
      }
      /* 黄昏的草原：口哨一响一轻；轻的时候，他就在不远的棕榈后面 */
      if (W.mapId === 'sabana' && f.phase === 'prep') {
        const e = S.ent('silS');
        if (SIL.t > 0) {
          SIL.t -= dt; e.alpha = clampN(Math.min(SIL.t, 2.4 - SIL.t) * 1.4, 0, .7);
          if (SIL.t <= 0) { e.hidden = true; e.alpha = 1; }
        } else if (!S.busy) {
          SIL.next -= dt;
          if (SIL.next <= 0) {
            SIL.next = 13 + Math.random() * 8; SIL.loud = !SIL.loud;
            if (SIL.loud) { whistle(S, 'loud', 0, .7); S.bubble('pl', '!', 1800); }
            else {
              whistle(S, 'faint'); S.bubble('pl', '…', 2600);
              const spots = [[12, 2], [20, 3], [26, 6], [16, 11], [21, 12], [32, 4], [34, 11], [6, 12]];
              const p = S.pl, cand = spots.filter(([x, y]) => { const d = Math.abs(x - p.x) + Math.abs(y - p.y); return d >= 5 && d <= 9; });
              if (cand.length) { const [x, y] = cand[(Math.random() * cand.length) | 0]; S.place('silS', x, y, x < p.x ? 2 : 1); e.alpha = 0; SIL.t = 2.4; }
              if (S.once('silTip')) S.toast('口哨声很轻……外婆说：听着远，他就在身边');
            }
          }
        }
      }
    },
    thumb(g, w, h) {
      const gy = h - 22, cx = w / 2;
      g.fillStyle = '#e8d8a8'; g.beginPath(); g.arc(w - 26, 20, 9, 0, Math.PI * 2); g.fill();
      g.fillStyle = '#3a2a12'; g.fillRect(0, gy - 4, w, 4);
      g.fillStyle = '#2a1e0e'; for (let i = 0; i < 30; i++) g.fillRect((hash(i, 1, 8) * w) | 0, gy - 6 - ((hash(i, 2, 8) * 4) | 0), 1, 4);
      /* 棕榈 */
      g.fillStyle = '#120c06'; for (const px of [14, w - 18]) { g.fillRect(px, gy - 34, 2, 30); for (let i = -3; i <= 3; i++) g.fillRect(px + i * 3 - 1, gy - 36 - Math.abs(i) * -1, 3, 2); }
      /* 高瘦的人影：破草帽、肩上的口袋 */
      g.fillStyle = '#080503';
      g.fillRect(cx - 3, gy - 46, 6, 34); g.fillRect(cx - 3, gy - 12, 2, 12); g.fillRect(cx + 1, gy - 12, 2, 12);
      g.fillRect(cx - 5, gy - 44, 2, 22); g.fillRect(cx - 2, gy - 54, 4, 8); g.fillRect(cx - 11, gy - 56, 22, 2); g.fillRect(cx - 4, gy - 61, 8, 5);
      g.fillRect(cx + 3, gy - 50, 9, 14); g.fillRect(cx + 4, gy - 52, 6, 2);
      g.fillStyle = '#e8e0c8'; g.fillRect(cx + 9, gy - 55, 1, 4); g.fillRect(cx + 8, gy - 56, 3, 1);
      /* 往上爬的音符 */
      g.fillStyle = 'rgba(240,225,180,.85)';
      for (let i = 0; i < 7; i++) { const x = 8 + i * 9, y = gy - 18 - i * 5; g.fillRect(x, y, 3, 2); g.fillRect(x + 2, y - 6, 1, 6); }
    },
    sprites: SPRITES,
    tiles: TILES,
    maps: MAPS()
  });
})();
