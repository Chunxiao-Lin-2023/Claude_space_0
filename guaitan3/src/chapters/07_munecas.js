/* ================= 第七夜 · 娃娃岛 ================= */
(() => {
  /* 核心玩法：船与运河 + 娃娃的目光。
     家：托尼奥从娃娃岛带回一个娃娃，夜夜发烧，窗上有湿手印 → 爷爷给《航路》、讲岛主的事和「湖上别停、拍水三下」
     运河（坐船）：照《航路》在浮田之间找路（水葫芦会缠住竿子），路边树上的娃娃转头看你 → 特修伊洛湖：雾里她从水底追船（危险段）
     岛上：四个娃娃丢了东西。「她们丢了东西，就一直看着那个东西」——站着别动，看它们的头往哪儿转，去那里找；
     铁盒的锁按娃娃上岛的先后按（岛主本子上的年份）→ 四个都找回来，所有的头转向西北角的老柳树 → 挂上托尼奥的娃娃。
     双人：一人在「笺」里念《航路》和年份，一人撑船、按铜钮。 */
  const WS = { style: 'whisper' };
  let STILL = 0, DIED = 0, SONG_T = 0, DRIP_T = 0;
  const NSPD = 3.0;                                            // 湖里她的速度（船 4.2×0.85≈3.6 格/秒，不能「跑」）
  const GLINT = { r: 1.3, col: 'rgba(255,236,170,.32)' };
  const bx = (R, x, y, w, h, f) => { R(x, y, w, h, shade(f, -.45)); R(x + 1, y + 1, w - 2, h - 2, f); };
  const line = (R, x0, y0, x1, y1, c) => { const n = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0), 1); for (let i = 0; i <= n; i++) R(Math.round(x0 + (x1 - x0) * i / n), Math.round(y0 + (y1 - y0) * i / n), 1, 1, c); };
  const nb = s => s.split('　').map(p => [...p].join('⁠')).join('　');

  /* ---------- 合成音 ---------- */
  /* 《圣安娜夫人》（Señora Santa Ana，墨西哥人人会唱的摇篮曲）的调子，八音盒的音色 */
  const MEL = [[587, 1], [587, 1], [659, 1], [587, 1], [494, 2], [587, 1], [587, 1], [659, 1], [587, 1], [494, 2], [523, 1], [523, 1], [587, 1], [523, 1], [440, 2], [494, 1], [392, 1], [440, 1], [392, 3]];
  function song(S, vol = .05, gap = .34) {
    let t = 0;
    for (const [f, b] of MEL) { S.tone('triangle', f, f * .995, gap * b * .9, vol, t, 2600); S.tone('sine', f * 2, f * 2, gap * .4, vol * .25, t, 3000); t += gap * b; }
  }
  function creak(S, n = 1, v = .03, t0 = 0) { for (let i = 0; i < n; i++) S.tone('sawtooth', 190 - i * 9, 120 - i * 6, .13, v, t0 + i * .07 + Math.random() * .05, 900); }   // 塑料脖子转动的「咯」
  function chorus(S) { creak(S, 9, .028); S.tone('sawtooth', 160, 70, .5, .02, .1, 600); }
  function chime(S) { S.tone('sine', 784, 780, 1.2, .06, 0, 0); S.tone('sine', 1175, 1170, .9, .03, .12, 0); S.tone('sine', 1568, 1560, .6, .015, .24, 0); }
  function splash3(S) { for (let i = 0; i < 3; i++) { S.tone('triangle', 200, 60, .16, .12, i * .32, 700); } }

  /* ---------- 惊吓大头像 ---------- */
  const FACES = {
    /* 水里的小姑娘：湿透的黑发贴着脸，一只眼睛从发缝里看出来，头发上挂着一朵水葫芦花 */
    nina(R, a, t) {
      const H = '#0a0909', H2 = '#1c2224', SK = '#b8c8c0', SK2 = '#93a49c', DR = '#8ab4c0';
      R(6, 1, 20, 3, H); R(4, 3, 24, 29, H);
      R(11, 5, 10, 22, SK); R(12, 27, 8, 2, SK); R(19, 6, 2, 21, SK2); R(11, 20, 2, 6, SK2);
      for (const [x, y0, h] of [[13, 4, 18], [17, 4, 9], [20, 4, 24], [10, 4, 27]]) R(x, y0, 1, h, H);
      for (const x of [6, 9, 23, 26]) R(x, 6, 1, 24, H2);
      R(12, 11, 4, 3, '#dde4de'); R(13, 11, 2, 3, '#080404'); R(12, 10, 4, 1, '#55605c');
      if (a > .55) R(14, 12, 1, 1, '#e8f0f0');
      R(17, 12, 3, 3, '#141010');
      R(11, 17, 2, 1, '#7a8a72'); R(18, 22, 2, 1, '#7a8a72');
      R(14, 21, 4, 1, '#55657a'); R(14, 22, 4, 1 + Math.round(Math.min(1, a * 1.6) * 3), '#080606');
      R(5, 3, 4, 3, '#9a7ad8'); R(6, 4, 2, 1, '#c8b0f8'); R(6, 5, 1, 1, '#f0d040'); R(8, 6, 3, 1, '#3a6a2a');
      const k = Math.floor(t * 3) % 3; R(12 + k * 3, 27 + (k % 2), 1, 2, DR); R(16, 29 - k, 1, 2, DR); R(22, 24 + k * 2, 1, 2, DR);
    },
    /* 瓷娃娃：裂开的瓷脸，一只眼窝是空的，一只玻璃眼珠瞪着你 */
    muneca(R, a, t) {
      const P = '#efe4d6', P2 = '#d6c8b6', HR = '#c4aa62', K = '#050304';
      R(5, 2, 22, 7, HR); R(3, 5, 4, 14, HR); R(25, 5, 4, 12, HR); R(11, 2, 6, 3, '#e6d6c4'); R(20, 3, 3, 2, '#e6d6c4');
      R(7, 6, 18, 21, P); R(8, 27, 16, 2, P); R(10, 29, 12, 1, P2); R(22, 8, 3, 18, P2);
      line(R, 18, 6, 21, 12, '#5a4a40'); line(R, 21, 12, 19, 17, '#5a4a40'); line(R, 21, 12, 25, 14, '#5a4a40');
      R(9, 11, 6, 6, '#2a1c18'); R(10, 12, 4, 4, K);
      if (a > .6) R(12, 14, 1, 1, '#c8c0a0');
      const shut = (Math.sin(t * 3) > .93) && a > .3;
      R(18, 11, 6, 1, '#2a1a14'); R(18, 12, 6, 4, shut ? P2 : '#f6f6f2');
      if (!shut) { R(19, 12, 4, 4, '#3a6ab0'); R(20, 13, 2, 2, '#0a0a10'); R(19, 12, 1, 1, '#f8f8ff'); }
      R(8, 19, 3, 2, '#d89a98'); R(21, 19, 3, 2, '#d89a98');
      R(14, 23, 4, 1, '#a83030'); R(14, 24, 4, 1 + Math.round(a * 3), '#2a0808');
      R(9, 22, 1, 1, '#8a7a60'); R(23, 25, 1, 1, '#8a7a60'); R(26, 9, 1, 1, '#000'); R(27, 8, 1, 1, 'rgba(200,200,220,.5)');
    }
  };

  /* ---------- 娃娃 ---------- */
  /* 头朝哪儿看：岛上的娃娃平时低着头；船来了以后跟着玩家转；丢了东西的那四个，玩家站定一秒就转去看自己的东西；最后全都看老柳树 */
  function dollLook(e) {
    if (e.ok) return [0, .4];
    let tx, ty;
    const A = e.cn ? null : getEnt('arbol');
    const mode = A ? (A.s.mode || 'idle') : 'track';
    if (mode === 'all') { tx = 3.5; ty = 3; }
    else if (e.lx != null) { tx = e.lx; ty = e.ly; }
    else if (mode === 'idle') return [0, 1];
    else { tx = W.pl.px / 16; ty = W.pl.py / 16; if (Math.abs(tx - e.px / 16) + Math.abs(ty - e.py / 16) > 10) return [0, 1]; }
    const dx = tx - e.px / 16, dy = ty - e.py / 16, L = Math.hypot(dx, dy) || 1;
    return [dx / L, dy / L];
  }
  function drawDoll(R, x, y, o) {
    const sk = o.sk || '#ecd8c4', col = o.col || '#d8a8b8', hc = o.hc || '#d8c070', big = !!o.big, k = o.kind || '', ok = !!o.ok;
    const [lx, ly] = o.look || [0, 1];
    const back = ly < -.65 && Math.abs(lx) < .55;
    const tx = Math.abs(lx) > .45 ? Math.sign(lx) : 0;
    if (!big) {
      if (k !== 'head') R(x - 1, y + 4, 7, 5, col), R(x - 2, y + 5, 1, 3, k === 'noarm' ? null : sk), R(x + 5, y + 5, 1, 3, sk), R(x, y + 9, 2, 2, sk), R(x + 3, y + 9, 2, 2, sk);
      const hx = x + tx;
      R(hx, y, 5, 4, sk); R(hx, y - 1, 5, 2, hc);
      if (back) R(hx, y - 1, 5, 5, hc);
      else { const ex = Math.max(-1, Math.min(1, Math.round(lx * 1.2))), ey = ly > .5 ? 1 : 0; R(hx + 1 + ex, y + 1 + ey, 1, 1, '#1a1418'); R(hx + 3 + ex, y + 1 + ey, 1, 1, '#1a1418'); }
      return;
    }
    /* 大一点的（丢了东西的四个） */
    R(x - 1, y + 6, 9, 7, col); R(x - 1, y + 12, 9, 1, shade(col, -.25)); R(x + 2, y + 6, 3, 1, shade(col, .25));
    R(x - 2, y + 7, 1, 4, sk); R(x + 8, y + 7, 1, 4, sk);
    R(x + 1, y + 13, 2, 2, sk); R(x + 4, y + 13, 2, 2, sk);
    const shoe = k === 'shoe' ? '#c02424' : '#5a3a22';
    if (!(k === 'shoe' && !ok)) R(x + 1, y + 15, 2, 1, shoe);
    R(x + 4, y + 15, 2, 1, shoe);
    const hx = x + tx;
    if (k === 'hair' && !ok) { R(hx - 1, y - 1, 9, 12, hc); R(hx - 2, y + 3, 1, 7, hc); R(hx + 8, y + 2, 1, 9, hc); }
    R(hx, y, 7, 6, sk); R(hx, y - 1, 7, 2, hc); R(hx - 1, y, 1, 3, hc); R(hx + 7, y, 1, 3, hc);
    if (k === 'hat' && !ok) { R(hx + 2, y - 1, 3, 1, sk); }
    if (back) R(hx - 1, y - 1, 9, 7, hc);
    else {
      const ex = Math.max(-1, Math.min(1, Math.round(lx * 1.5))), ey = ly > .5 ? 1 : ly < -.5 ? -1 : 0;
      if (k === 'eye' && !ok) R(hx + 1, y + 2, 2, 2, '#050304'); else R(hx + 1 + ex, y + 2 + ey, 2, 2, '#1a1418');
      R(hx + 4 + ex, y + 2 + ey, 2, 2, '#1a1418');
      R(hx + 3 + ex, y + 4 + Math.max(0, ey), 1, 1, '#b04848');
    }
    if (k === 'hair' && ok) { R(hx + 5, y - 2, 3, 2, '#d02828'); R(hx + 6, y, 1, 2, '#d02828'); }
    if (k === 'hat' && ok) { R(hx - 2, y - 1, 11, 1, '#c8a860'); R(hx + 1, y - 3, 5, 2, '#d8b870'); R(hx + 1, y - 2, 5, 1, '#9a3a2a'); }
  }
  const DCOL = ['#d8a8b8', '#a8c0d8', '#e8e0c8', '#c8b090', '#b8d0a8', '#e0b8a0', '#cfc8e0', '#f0e8e0'];
  const DHC = ['#d8c070', '#4a3020', '#1a1414', '#b86a3a', '#e8e0b0', '#8a6a4a'];

  /* 丢了东西的四个娃娃：id、目标（它一直在看的东西）、物品 */
  const DOLLS = [
    { id: 'm1', t: 'mo_b', item: 'zapato', kind: 'shoe', name: '穿蓝裙子的娃娃',
      desc: '一个穿蓝裙子的布娃娃，挂在码头边的柳树上。\n右脚穿着一只小红鞋。左脚光着，脚底板上全是泥。',
      think: '……它少了一只鞋。',
      h3: '它一直歪着头，看着码头右边那片泥地。', h4: '码头右边，离水最近的那个小土堆——鞋就埋在那里。',
      fix: '你把小红鞋套在它光着的左脚上。\n鞋刚好合脚。娃娃在风里慢慢转了半圈，脚尖并在了一起。', done: '两只小红鞋，并排晃着。' },
    { id: 'm2', t: 'door_c', item: 'ojo', kind: 'eye', name: '没有眼睛的娃娃',
      desc: '小屋西边的柳树上，挂着一个瓷脸的娃娃。\n它的左眼是一个黑窟窿。右边那只玻璃眼珠，亮得像活的。',
      think: '……它少了一只眼睛。',
      h3: '它一直看着岛主的小屋。……岛主的东西，都在屋里吧。', h4: '小屋里那个上了锁的铁盒子。',
      fix: '你把玻璃眼珠按进那个黑窟窿里。「咔」的一声，正好卡住。\n两只蓝眼睛一起眨了一下。', done: '两只蓝眼睛半闭着，像要睡着了。' },
    { id: 'm3', t: 'ju_a', item: 'liston', kind: 'hair', name: '散着头发的娃娃',
      desc: '东边的柳树上，挂着一个金头发的塑料娃娃。\n头发散了一脸，被风吹得乱糟糟的，缠着几根枯草。',
      think: '……它的发带不见了。',
      h3: '它一直看着东边岸上的芦苇——偏南的那一丛。', h4: '东岸靠南、离它最近的那丛芦苇里，缠着一根红发带。',
      fix: '你把头发拢到它脑后，用红发带扎了一个蝴蝶结。\n它的脸露出来了。是一张很小、很普通的笑脸。', done: '红蝴蝶结在风里一抖一抖的。' },
    { id: 'm4', t: 'on_a', item: 'sombrero', kind: 'hat', name: '穿白衣裳的娃娃',
      desc: '西边水湾旁的柳树上，挂着一个很旧很旧的娃娃。白衣裳已经发黄了，头发掉了一半。\n它光着头，头顶被太阳晒得发白。',
      think: '……它好像原来戴着什么。',
      h3: '它一直看着西边的水——正西，不是北边，也不是南边。', h4: '正西边岸下那圈水纹。用竹竿把水里的东西勾上来。',
      fix: '你把湿透的小草帽甩了甩，扣在它头上。\n帽子有点歪。你替它扶正了。', done: '小草帽遮住了它的眼睛。它好像在打盹。' }
  ];
  /* 每组三个地方，一个是对的 */
  const SPOTS = {
    mo_a: 0, mo_b: 0, mo_c: 0, ju_a: 2, ju_b: 2, ju_c: 2, on_a: 3, on_b: 3, on_c: 3
  };
  const WRONG = {
    mo_a: '你用手扒开了湿泥。\n……只有烂掉的柳树根，和一团缠在一起的蚯蚓。',
    mo_c: '你扒开土堆。土里埋着一个娃娃的头，脸朝下。\n……不是这个。你把土盖了回去。',
    ju_b: '你拨开芦苇。里面卡着一个塑料袋，被风吹得一鼓一瘪，像在喘气。',
    ju_c: '你拨开芦苇。一只白鹭「扑」地飞了起来，吓了你一跳。\n芦苇里什么也没有。',
    on_b: '你用竹竿往水纹里捞了捞。\n……捞上来一团水葫芦，根须长长的，像头发。',
    on_c: '你用竹竿往水纹里捞了捞。竿子底下碰到了什么软的东西——\n……是一截泡烂的木头。'
  };

  const DECOR_LINES = [
    '一个塑料娃娃，金头发被太阳晒成了白色。\n风一吹，它的眼皮就一开一合，像在眨眼。',
    '只剩一个脑袋，用铁丝穿着挂在树枝上。\n脑袋里面住着一窝蜘蛛。',
    '穿着褪色的洗礼裙。裙子上长了一层薄薄的绿苔。',
    '它的一只眼睛闭着，一只睁着。\n睁着的那只，一直跟着你。',
    '娃娃的脸被雨水泡得起了皱，像一个老太太。',
    '它手里被人塞了一朵塑料花。花是新的。',
    '一个布娃娃，肚子里的棉花掉出来一半。\n棉花里有小虫子在爬。',
    '脖子上挂着一块小木牌，用记号笔写着「GRACIAS」（谢谢）。\n是来参观的游客留下的吧。',
    '一个少了胳膊的娃娃。有人用红笔在它嘴角画了一道笑。',
    '树杈上挂着一串娃娃的腿，一串一串的，像晒干的辣椒。',
    '这个娃娃比别的新一点，衣服还是干的。\n……是最近才有人挂上来的。',
    '它的头转向你的时候，发出很轻的「咯」的一声。'
  ];

  /* ---------- 地图 ---------- */
  const CANAL_ROWS = [
    'AHAHHAHHHAHHAHHHAHAHHHAHHAHDDHAHHAHA',
    'eeeVVVVVVVVVVVVVVVVVVVVVVVVooVVVVeee',
    'eVVVVVVVVVVVVVVVVVVVVVVVVVVooVVVVVVe',
    'eVVVVVVVVVVVVVVVVVVVVVVVoooooVVVVVVe',
    'eVVVVVVVVVVVVVVVVVVVVVVVoovooVVVVVVe',
    'eVVVVVVVVVVVVVVVVVVVVVVoooVVVVVVVVVe',
    'eVVVoooooooovoooooooooooooVVVVoooVVe',
    'eVVVoooooooovvoooooooovoooooooooVVVe',
    'eVVVoooVVVVVVVVVVVVVVVVVVVVVVVVVVVVe',
    'eVVVooVVVVVVVVVVVVVVVVVVVVVVVVVVVVVe',
    'eVVVoooooovoooooooVVVVVVVVVVVVVVVVVe',
    'eVVVVooooovooooooooooVVVVVVVVVVVVVVe',
    'HHHHHHHHHHHHHHooHHHHHHHHHHHHHHHHHHHH',
    'HAHHAHHHHAHHHAooAHHHHAHHHHAHHHHAHHHH',
    'HHHHooHHHHHHHHooHHHHHHHHHHHHHHHHHHHH',
    'HHHAooAHHHFFFAooAFFFHHHHHHHHHHHHHHHH',
    'HHHHooHHHHFFFHooHFFFHHHHHHHHHHHHooHH',
    'HHHAooAHHHFFFAooAFFFHHHHHHHHHHHAooAH',
    'HHHHooHHHHHHHHooHHHHHHHHHHHHHHHHooHH',
    'HHHAooAHHAHHHAooAHHAHHHAHHHAHHHAooAH',
    'HHHHooooooooooooooooooooooooHHHHooHH',
    'HHHHooooooooooooooooooooooooHHHHooHH',
    'HHHAHHAHHHHAHHHHAHHHHAHHHAooAHHAooAH',
    'HHHHHHHHHHHHHHHHHHHHHHHHHHooHHHHooHH',
    'HHHHHHHHoooooooooooovvHHHHooHHHHooHH',
    'HHHHHHHHoooooooooooovvHHHHooHHHHooHH',
    'HHHHHHHAooAHFFFFHHAHHHHHHAooAHHAooAH',
    'HHFFFHHHooHHFFFFHHHHHHHHHHooHHHHooHH',
    'HHFFFHHAvvAHHHHHHAHHHHHHHAooAHHAooAH',
    'HHHHHHHHvvHHHHHHHHHHHHHHHHooHHHHooHH',
    'DDooooooooooooooooooooooooooooooooHH',
    'DDooooooooooooooooooooooooooooooooHH',
    'HHoooooAHHHAHHAHHHAHHHAHHHAHHHAHHHHH',
    'HHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHH'
  ];
  const ISLA_ROWS = [
    '~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~',
    '~~~~~AAAA~~~~~~~~~~~~eeAAA~~~~',
    '~~~~gggggAA~eAAAAAAeggggggA~~~',
    '~~~ggggggggggggggggggggggggge~',
    '~~~gggggggdd######ddgggggggge~',
    '~~~gggggggdd######ddgggggggge~',
    '~~AgggAgggdd######ddgggAggggg~',
    '~egggggggddddddddddddgggggggg~',
    '~eggggggAggddgggggddggggAgggge',
    '~~Aggggggggddggggggddggggggggg',
    '~~ggggggggddgggggggddgggggAgge',
    '~~AgggAgggdddddddddddggggggge~',
    '~~gggggggggggddggggggggAggggg~',
    '~egggggggAgggddgggAggggggggge~',
    '~egggggggggggddggggggggggggge~',
    '~~AggggggggggddggggggAgggggge~',
    '~~~gggAggggggddggggggggggggg~~',
    '~~~~ggggggAggddgAgggggggggg~~~',
    '~~~~~eeggggggddggggggggee~~~~~',
    '~~~~~~~~~~~~~DD~~~~~~~~~~~~~~~',
    '~~~~~~~~~~~~~DD~~~~~~~~~~~~~~~',
    '~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~'
  ].map(r => r.replace(/g/g, '"'));
  /* 岛上的柳树：除了四个主角和老柳树，挑一些挂可以调查的娃娃 */
  const DECOR_AT = [[2, 6], [6, 6], [23, 6], [2, 9], [26, 10], [2, 11], [23, 12], [9, 13], [18, 13], [2, 15], [21, 15], [6, 16], [16, 17], [15, 2], [17, 2], [24, 1], [7, 1], [26, 2]];
  const DECOR = DECOR_AT.map(([x, y], i) => ({
    id: 'dd' + i, x, y, spr: 'muneca', col: DCOL[(i * 5 + 3) % DCOL.length], hc: DHC[(i * 7 + 1) % DHC.length],
    kind: i % 5 === 1 ? 'head' : i % 4 === 3 ? 'noarm' : '', hy: 1 + (i % 3) * 2, ox: (i % 3) - 1,
    on: async S => { creak(S); await S.narr(DECOR_LINES[i % DECOR_LINES.length]); }
  }));
  /* 每一棵「A」柳树生成一个 sauce 实体（树冠能伸出格子）；岛上没挂主角娃娃的树也能调查 */
  const TREE_LINES = ['柳树上挂满了娃娃，最高的那几个够不着。\n风一吹，它们一起轻轻地转。', '树干上钉着一排娃娃的手，五个手指都张着。', '树枝上挂的娃娃太多了，枝条都被压弯了。', '一棵阿韦霍特柳，又细又高。\n树皮上有人用小刀刻了一个十字。'];
  function trees(rows, dolls, busy) {
    const out = [];
    rows.forEach((r, y) => [...r].forEach((c, x) => { if (c !== 'A') return; const i = out.length; const e = { x, y, spr: 'sauce', dolls }; if (dolls && !busy.has(x + ',' + y)) e.on = S => S.narr(TREE_LINES[i % TREE_LINES.length]); out.push(e); }));
    return out;
  }
  /* 湖里的木桩：插在水葫芦里，桩顶绑着娃娃，标出能走的水道 */
  const POSTS = [[3, 8], [7, 9], [16, 9], [11, 8], [9, 5], [17, 8], [23, 8], [26, 5], [29, 2]];
  const LAGO = (x, y) => y <= 11 || (y <= 19 && (x === 14 || x === 15));

  defChapter({
    id: 'munecas', n: 7, title: '娃娃岛', sub: '霍奇米尔科的运河深处，有一座挂满了娃娃的小岛。弟弟从岛上带回来一个。', origin: '墨西哥　霍奇米尔科', color: '#2a4a3a',
    amb: 'night', floor: 'dirt', wall: 'mud', dark: .74, plr: 3.2, darkC: '#03060a',
    endings: { hang: '最后一个娃娃', both: '老人的船', take: '跟着回家的' },
    faces: FACES,
    thumb(g, w, h) {
      const gy = h - 22;
      g.fillStyle = '#0e1e1a'; g.fillRect(0, gy - 10, w, 10);
      g.fillStyle = '#1e3a30'; for (let i = 0; i < 9; i++) g.fillRect((hash(i, 3, 7) * w) | 0, gy - 8 + ((hash(i, 4, 7) * 7) | 0), 10, 1);
      g.fillStyle = '#152018'; g.fillRect(0, 4, w, 6); g.fillRect(w * .1, 8, 6, gy - 12); g.fillRect(w * .86, 6, 5, gy - 10);
      g.fillStyle = '#1e3020'; for (let i = 0; i < 14; i++) g.fillRect((hash(i, 1, 7) * w) | 0, 0, 3 + ((hash(i, 2, 7) * 6) | 0), 6);
      const D = [[.22, 18, '#d8a8b8'], [.36, 30, '#a8c0d8'], [.5, 20, '#e8e0c8'], [.64, 34, '#c8b090'], [.78, 22, '#cfc8e0']];
      D.forEach(([fx, len, c], i) => {
        const x = Math.round(w * fx), y = 9 + len;
        g.fillStyle = '#b8a888'; g.fillRect(x + 4, 9, 1, len);
        g.fillStyle = c; g.fillRect(x, y + 8, 9, 10); g.fillStyle = '#ecd8c4'; g.fillRect(x + 1, y, 7, 8); g.fillRect(x + 1, y + 18, 2, 4); g.fillRect(x + 6, y + 18, 2, 4);
        g.fillStyle = i === 2 ? '#1a1414' : '#d8c070'; g.fillRect(x, y - 1, 9, 3);
        g.fillStyle = '#1a1418'; if (i === 2) { g.fillStyle = '#050304'; g.fillRect(x + 2, y + 3, 2, 2); g.fillStyle = '#7ab8ff'; g.fillRect(x + 5, y + 3, 2, 2); } else { g.fillRect(x + 2, y + 3 + (i % 2), 1, 1); g.fillRect(x + 6, y + 3 + (i % 2), 1, 1); }
      });
      const gr = g.createRadialGradient(w * .5, 40, 2, w * .5, 40, 22); gr.addColorStop(0, 'rgba(140,190,255,.25)'); gr.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = gr; g.fillRect(0, 0, w, h);
    },
    people: {
      me: { key: 'martina', skin: '#c08a60', hair: '#1a1010', hs: 'long', top: '#3a6a8a', top2: '#e8dcc4', bottom: '#2e3040', shoes: '#3a2a20',
        extra(g, d, fr, G, R) { if (d === 0) { R(3, G.tT, 10, 2, '#b8443e'); R(4, G.tT + 2, 1, 4, '#b8443e'); R(11, G.tT + 2, 1, 5, '#e0a030'); } else if (d === 1) R(4, G.tT, 7, 2, '#b8443e'); else if (d === 3) { R(4, G.tT - 1, 8, 3, '#b8443e'); R(7, G.hT + 6, 2, G.tT - G.hT, '#1a1010'); } } },
      abuelo: { key: 'chema', skin: '#9a6644', hair: '#d4d4d4', hs: 'short', hat: 'straw', hatC: '#c8a860', top: '#e8e2d0', top2: '#c8c0a8', bottom: '#4a4a5a', shoes: '#4a3020',
        extra(g, d, fr, G, R) { if (d === 0) { R(5, G.hT + 6, 6, 1, '#e8e8e8'); R(5, G.hT + 7, 1, 1, '#e8e8e8'); R(10, G.hT + 7, 1, 1, '#e8e8e8'); } else if (d === 1) R(3, G.hT + 6, 4, 1, '#e8e8e8'); } },
      nina: { key: 'nina', skin: '#c4d0cc', hair: '#0c0a0c', hs: 'long', cover: true, child: true, ghost: true, dress: true, top: '#d8ddd2', top2: '#b8c0b8', eye: '#101010',
        extra(g, d, fr, G, R) { if (d === 0) { R(7, G.hT + 4, 1, 1, '#dde4de'); R(7, G.hT + 5, 1, 1, '#080404'); R(4, G.hT, 2, 2, '#9a7ad8'); R(5, G.hT + 1, 1, 1, '#f0d040'); R(5, G.tT + 2, 1, 4, '#8ab4c0'); R(10, G.tT + 3, 1, 5, '#8ab4c0'); } else if (d === 1) { R(4, G.hT, 2, 2, '#9a7ad8'); R(6, G.tT + 4, 1, 3, '#8ab4c0'); } else if (d === 3) { R(5, G.hT + 1, 6, G.tT - G.hT + 5, '#0c0a0c'); R(9, G.hT, 2, 2, '#9a7ad8'); } } },
      viejo: { key: 'viejo', skin: '#b8aa92', hair: '#dcdcdc', hs: 'short', hat: 'straw', hatC: '#b89a5a', top: '#d8d4c4', bottom: '#5a5040', ghost: true,
        extra(g, d, fr, G, R) { if (d === 0) { R(5, G.hT + 6, 6, 3, '#e4e4e4'); R(6, G.hT + 9, 4, 1, '#e4e4e4'); } else if (d === 1) R(3, G.hT + 6, 4, 3, '#e4e4e4'); } }
    },
    items: {
      muneca_t: { name: '托尼奥的娃娃', desc: '一个穿黄裙子的塑料娃娃，少了一只胳膊。摸上去总是凉的、潮的，像刚从水里捞上来。' },
      garrocha: { name: '竹竿', desc: '撑船用的长竹竿，一头包着铁皮。也能从岸上够到水里的东西。' },
      zapato: { name: '小红鞋', desc: '一只娃娃穿的小红鞋，塑料的，鞋带是一根红毛线。' },
      ojo: { name: '玻璃眼珠', desc: '一颗娃娃的玻璃眼珠，蓝色的。放在手心里，它好像在看你。' },
      liston: { name: '红发带', desc: '一根褪了色的红发带，缠着几根金黄的假头发。' },
      sombrero: { name: '小草帽', desc: '一顶巴掌大的小草帽，湿透了。帽檐上用红线缝过一圈。' },
      muneca_v: { name: '老人的娃娃', desc: '岛主没来得及挂上的最后一个娃娃。白裙子，裙摆补着一块蓝布，针脚很大，很认真。' }
    },
    notes: {
      ruta: { title: '爷爷的《航路》', text: '（一张发黄的纸，铅笔画的水道，旁边是爷爷的字。）\n\n给岛上送东西的路——\n\n一、出了家门口的码头，往东撑。\n　　头一个往北的口子满是水葫芦（lirio），别进。\n二、一直往东。看见挂着红裙子娃娃的大柳树，就在树底下往北拐。\n三、往北撑到头，往西。\n四、过了沉在水里的那条旧游船（「玛加丽塔号」），\n　　下一个往北的口子，就是进湖的水道。\n五、特修伊洛湖。别停。\n　　跟着湖里插的木桩走，桩子上挂着娃娃。\n　　对岸亮着灯的，就是岛。' },
      recorte: { title: '剪报（2001年4月）', text: '（爷爷用图钉把它钉在墙上。纸已经卷边了。）\n\n「娃娃岛」岛主辞世\n\n……据家人说，老人被发现时倒在岛边的水湾里。那里正是他多年来对人说起的、当年发现溺水女孩的地方。\n\n老人独居岛上约半个世纪，在岛上的树木间挂满了从垃圾堆和运河里捡来的娃娃。他曾对访客说，这些娃娃是为了让那个女孩的魂灵安心。\n\n近年来，越来越多的游客乘坐游船前往这座小岛。有人带去新的娃娃，也有人说，夜里在岛上听见过小女孩的歌声。' },
      dibujo: { title: '托尼奥的画', text: '一张蜡笔画，画在作业本的背面。\n\n一棵柳树，树上挂着四个娃娃：\n一个穿蓝裙子，光着一只脚；\n一个只有一只眼睛；\n一个头发散了一脸；\n一个光着头，穿白衣裳。\n\n四个娃娃的脑袋都歪向一边，像在看什么东西。\n\n树下的水里，画着一个小姑娘，只露出半张脸，头发上画了一朵紫色的花。\n\n底下是托尼奥歪歪扭扭的字：\n「LAS MUÑECAS DE LA NIÑA」\n（小姑娘的娃娃们）' },
      cuaderno: { title: '岛主的本子', text: '（泡过水的账本。前面记着卖菜的账，后面的字很大，歪歪扭扭。）\n\n她们丢了东西，就一直看着那个东西，\n看到有人给她们找回来为止。\n\n码头边，穿蓝裙子的：1973。一只红鞋，垃圾堆里配齐的。\n小屋西边，没眼睛的：1988。眼珠掉了，收在铁盒子里。\n东边芦苇旁，散头发的：1965。红发带，集市上买的。\n西边水湾，穿白衣裳的：1951。第一个，从水上漂来的。\n　　给她戴了顶小草帽，怕她晒。\n\n铁盒子的锁：按她们上岛的先后，一个一个按。\n\n谁也不许把娃娃带走。带走一个，她就跟着那一个走了。\n\n（最后一页）椅子上那个是给她的。等裙子补好，就挂到老柳树上去。' }
    },
    legend: '「娃娃岛」（Isla de las Muñecas）在墨西哥城南部的霍奇米尔科（Xochimilco）。这里的运河网和浮田（chinampa）可以追溯到阿兹特克时代：人们在湖里用泥土和树枝堆出一块块狭长的田，四周种上细高的阿韦霍特柳（ahuejote）固土，田与田之间就成了水道。1987年，霍奇米尔科与墨西哥城历史中心一起被列入世界遗产。如今，游客坐着漆成彩色、拱门上写着女人名字的平底游船（trajinera）游览运河；娃娃岛在特修伊洛湖（Laguna de Teshuilo）附近，从码头出发要坐好一阵船。\n\n流传最广的说法是：上世纪中叶，一位老人独自搬到这座小岛上居住。据说他在岛边的水里发现了一个溺水身亡的小女孩，不久之后，又看见一个娃娃从水上漂来。他把娃娃挂在树上，以示对女孩的敬意，好让她的魂灵安息。此后约五十年，他相信女孩的魂灵一直在岛上，便不停地挂娃娃——从垃圾堆和运河里捡，后来也用自己种的菜跟人换。据报道，老人于2001年去世，被发现时倒在水里，传说那里正是他当年发现女孩的地方。\n\n这个故事也有别的说法：有人说娃娃是为了驱赶水里的恶灵；也有人怀疑那个女孩是否真的存在过，认为那可能只是老人独居多年后的想象。老人去世后，小岛成了有名的景点，游客常带新的娃娃去挂；风吹日晒之后，娃娃们褪色、开裂、长出青苔，更显阴森。关于娃娃会转头、会睁眼、夜里会低语的说法，大多来自游客和导游的口耳相传，查无实据。本章不写出那位老人的姓名。《圣安娜夫人》（Señora Santa Ana）是墨西哥和整个西语世界流传很广的传统摇篮曲，歌里唱的是一个丢了苹果、哭个不停的小姑娘。\n\n（本章中的玛蒂娜、托尼奥、切马爷爷一家，托尼奥从岛上带走娃娃的事，爷爷的《航路》、湖里挂娃娃的木桩和「拍水三下」的规矩，岛主的本子、各个娃娃的年份和铁盒子，「娃娃丢了东西就一直看着它」的规矩，水里追船的小姑娘，以及三个结局，均为游戏虚构。）',
    start: { map: 'casa', x: 7, y: 5, dir: 1 },
    async intro(S) {
      STILL = 0; DIED = 0; SONG_T = 0; DRIP_T = 0;
      S.f.ph = 'casa'; S.f.fixed = 0;
      await S.card(nb('第七夜　娃娃岛'), nb('2002年4月　墨西哥城南　霍奇米尔科'), '霍奇米尔科的运河，是阿兹特克人留下来的。\n一块块浮田之间，水道像蛛网一样铺开。\n\n白天，这里全是彩色的游船、马里亚奇乐队、\n撑着小船卖烤玉米的人。\n天黑以后，就只剩下水，和柳树。\n\n还有那个岛。');
    },
    resume: {
      casa: async S => { walkMode(S); },
      canal: async S => { boatMode(S); },
      lago: async S => {
        boatMode(S); S.stop('nina_l'); S.hide('nina_l'); S.f.grab = 0; S.f.ph = 'lago0';
        if (DIED) { await S.think(DIED === 1 ? '……湖上不能停。绕开水葫芦，跟着木桩上的娃娃，一直往对岸亮灯的地方撑。' : '别停。别进水葫芦。被抓住一次，还能拍水；第二次就……'); }
      },
      isla: async S => { walkMode(S); },
      final: async S => { walkMode(S); SONG_T = 1; }
    },
    tiles: {
      shallow: { solid: false, paint(R, X, Y) { R(0, 0, 16, 16, '#14302a'); for (let i = 0; i < 3; i++) { const h = hash(X, Y, 60 + i); R((h * 12) | 0, (hash(X, Y, 70 + i) * 14) | 0, 3 + (i % 2), 1, i ? '#20463c' : '#2a5446'); } } },
      water: { solid: true, paint(R, X, Y) { R(0, 0, 16, 16, '#11282a'); for (let i = 0; i < 3; i++) { const h = hash(X, Y, 20 + i); R((h * 12) | 0, (hash(X, Y, 30 + i) * 14) | 0, 4, 1, '#1d3e3c'); } } },
      /* 水葫芦：薄的一片（能过，船会慢）／厚的一大片（过不去） */
      lirio: { solid: false, paint(R, X, Y) {
        R(0, 0, 16, 16, '#14302a'); R(2, 6, 3, 1, '#20463c');
        for (let i = 0; i < 4; i++) { const x = 1 + ((hash(X, Y, 80 + i) * 11) | 0), y = 1 + ((hash(Y, X, 90 + i) * 11) | 0); R(x, y + 1, 4, 2, '#2e5a24'); R(x + 1, y, 2, 4, '#2e5a24'); R(x + 1, y + 1, 2, 1, '#4e8a3a'); }
        if (hash(X, Y, 99) < .6) { const x = 3 + ((hash(X, Y, 98) * 9) | 0), y = 3 + ((hash(X, Y, 97) * 9) | 0); R(x, y, 2, 2, '#9a7ad8'); R(x + 1, y, 1, 1, '#c8b0f8'); }
      } },
      lirioV: { solid: true, paint(R, X, Y) {
        R(0, 0, 16, 16, '#2a5228');
        for (let i = 0; i < 12; i++) { const x = (hash(X, Y, 110 + i) * 13) | 0, y = (hash(Y, X, 120 + i) * 13) | 0; R(x, y, 4, 3, ['#3a6a2c', '#4a7a32', '#2e5a24'][i % 3]); R(x + 1, y, 2, 1, '#62a046'); }
        R(0, 15, 16, 1, '#1a3418');
        for (let i = 0; i < 3; i++) if (hash(X, Y, 130 + i) < .6) { const x = 2 + ((hash(X, Y, 140 + i) * 11) | 0), y = 2 + ((hash(X, Y, 150 + i) * 11) | 0); R(x, y, 2, 2, '#9a7ad8'); R(x + 1, y, 1, 1, '#d8c0ff'); R(x, y + 2, 1, 1, '#f0d040'); }
      } },
      chinampa: { solid: true, paint(R, X, Y) {
        speck(R, '#22341c', ['#2c4224', '#1a2a16', '#344c2a'], X, Y, 18, 41);
        if ((X + Y * 3) % 4 === 0) for (let i = 0; i < 3; i++) for (let j = 0; j < 2; j++) { R(2 + i * 5, 3 + j * 7, 3, 2, '#34562a'); R(3 + i * 5, 3 + j * 7, 1, 1, '#4e7a38'); }
        else if (hash(X, Y, 43) < .25) R(((hash(X, Y, 44) * 12) | 0) + 2, ((hash(X, Y, 45) * 12) | 0) + 2, 3, 2, '#3a2a1c');
      } },
      flores: { solid: true, paint(R, X, Y) {
        speck(R, '#22341c', ['#2c4224', '#1a2a16'], X, Y, 10, 46);
        for (let r = 0; r < 3; r++) for (let i = 0; i < 4; i++) { const c = ['#d84a6a', '#e8a020', '#e8e0d0', '#b04ac0'][(X + r + i) % 4]; R(1 + i * 4, 2 + r * 5, 2, 2, c); R(1 + i * 4, 4 + r * 5, 1, 1, '#3e5a2a'); }
      } },
      /* 阿韦霍特柳的树根（树干和树冠由 sauce 实体画，能伸出格子） */
      ahue: { solid: true, paint(R, X, Y, o) { speck(R, '#22341c', ['#2c4224', '#1a2a16'], X, Y, 12, 47); R(4, 12, 8, 3, '#141e10'); R(6, 11, 4, 2, '#2a2016'); } },
      ahued: { solid: true, paint(R, X, Y, o) { TILE.grass.paint(R, X, Y, o); R(4, 12, 8, 3, '#141e10'); R(6, 11, 4, 2, '#2a2016'); } },
      muelle: { solid: false, paint(R, X, Y) { R(0, 0, 16, 16, '#11282a'); R(1, 0, 14, 16, '#5a4430'); for (let y = 0; y < 16; y += 4) R(1, y + 3, 14, 1, '#3a2a1e'); R(1, 0, 1, 16, '#4a3624'); R(14, 0, 1, 16, '#4a3624'); if (hash(X, Y, 3) < .4) R(5, 6, 3, 1, '#2a1e14'); } }
    },
    sprites: {
      /* 玩家撑的小船（chalupa）：船身、站在船上的人、竹竿、船头一盏小马灯 */
      chalupa(g, e, t, R) {
        const d = e.dir, hz = d === 1 || d === 2, b = Math.sin(t * 2.2 + 1) > .2 ? 1 : 0, mv = e.fr ? 1 : 0;
        R(-4, 15, 24, 1, 'rgba(150,200,190,.16)');
        if (hz) { R(-6, 8 + b, 28, 3, '#3a2414'); R(-5, 9 + b, 26, 3, '#21140b'); }
        else { R(2, -6 + b, 12, 24, '#3a2414'); R(3, -5 + b, 10, 22, '#21140b'); }
        const P = W.ch.people && W.ch.people.me;
        if (P) g.drawImage(personSprite(P, d, 0), e.sx, e.sy - 11 + b);
        const k = mv ? Math.round(Math.sin(t * 7) * 3) : 0;
        if (hz) {
          R(-6, 11 + b, 28, 3, '#6a4428'); R(-6, 11 + b, 28, 1, '#8a5a34'); R(-7, 9 + b, 2, 4, '#6a4428'); R(21, 9 + b, 2, 4, '#6a4428'); R(-5, 14 + b, 26, 1, '#2a1a0e');
          const s = d === 2 ? -1 : 1, hx = d === 2 ? 4 : 11;
          line(R, hx, -6 + b, hx + s * (8 + k), 18, '#c8b07a');
          const lx = d === 2 ? 21 : -7; R(lx, 4 + b, 2, 4, '#3a2a1a'); R(lx, 5 + b, 2, 2, '#ffcf6a');
        } else {
          R(2, 6 + b, 12, 3, '#6a4428'); R(2, 6 + b, 12, 1, '#8a5a34'); R(1, 9 + b, 1, 8, '#6a4428'); R(14, 9 + b, 1, 8, '#6a4428'); R(2, 16 + b, 12, 3, '#6a4428');
          line(R, 13, -8 + b, 17 + k, 20, '#c8b07a');
          const ly = d === 3 ? -8 : 18; R(7, ly + b, 2, 3, '#3a2a1a'); R(7, ly + 1 + b, 2, 1, '#ffcf6a');
        }
      },
      /* 拴着的空船；带 e.viejo 时船上站着老人 */
      barca(g, e, t, R) {
        const b = Math.sin(t * 2 + e.px) > .3 ? 1 : 0;
        R(-2, 8 + b, 30, 3, '#3a2414'); R(-1, 9 + b, 28, 3, '#21140b');
        if (e.viejo) { const P = W.ch.people.viejo; g.drawImage(personSprite(P, 2, 0), e.sx + 8, e.sy - 11 + b); }
        if (e.nina) { const P = W.ch.people.nina; g.drawImage(personSprite(P, 2, 0), e.sx - 1, e.sy - 11 + b); }
        R(-2, 11 + b, 30, 3, '#5a3a22'); R(-2, 11 + b, 30, 1, '#7a5232'); R(-3, 9 + b, 2, 4, '#5a3a22'); R(27, 9 + b, 2, 4, '#5a3a22');
        if (e.viejo) line(R, 20, -6 + b, 28, 18, '#c8b07a');
        R(0, 15, 28, 1, 'rgba(150,200,190,.14)');
      },
      /* 彩色游船（trajinera），拱门上写着名字 */
      trajinera(g, e, t, R) {
        const c = e.col || '#d84a3a', b = Math.sin(t * 1.6 + e.px) > .4 ? 1 : 0;
        R(-1, 7 + b, 50, 7, '#2a3a5a'); R(0, 6 + b, 48, 2, '#3a5a8a'); R(1, 9 + b, 46, 3, '#1a1a24');
        R(3, -12 + b, 2, 19, '#e8e0d0'); R(43, -12 + b, 2, 19, '#e8e0d0');
        R(1, -16 + b, 46, 6, c); R(1, -16 + b, 46, 1, shade(c, .3)); R(1, -11 + b, 46, 1, shade(c, -.35));
        for (let i = 0; i < 7; i++) R(8 + i * 5, -14 + b, 3, 2, ['#f0e040', '#40c0e0', '#f0f0f0'][i % 3]);
        R(-1, 15, 50, 1, 'rgba(150,200,190,.14)');
      },
      /* 半沉在水里的旧游船「玛加丽塔号」 */
      hundida(g, e, t, R) {
        R(2, 6, 44, 6, '#1e2a36'); R(4, 5, 40, 2, '#2a3a4a');
        R(10, -10, 2, 17, '#a8a090'); R(36, -6, 2, 13, '#a8a090');
        R(8, -14, 32, 5, '#7a3a34'); R(8, -14, 32, 1, '#9a5a4a'); line(R, 8, -9, 40, -5, '#4a2420');
        for (let i = 0; i < 6; i++) R(13 + i * 4, -12, 2, 2, '#c8b8a0');
        R(18, 10, 10, 2, '#3a6a2c'); R(30, 9, 6, 2, '#2e5a24');
      },
      /* 浮田上的小屋 */
      casita(g, e, t, R) {
        bx(R, 1, -6, 30, 20, '#6a5a44'); R(-1, -10, 34, 5, '#3a2a1e'); R(1, -11, 30, 2, '#4a3a2a');
        R(5, 0, 7, 6, e.lit ? '#e8c070' : '#0e1620'); R(8, 0, 1, 6, '#3a2a1e'); R(20, 2, 6, 12, '#3a2414');
        if (e.lit) R(6, 1, 2, 2, '#fff0b0');
      },
      /* 运河边的圣母小神龛 */
      altarito(g, e, t, R) {
        R(6, 6, 4, 9, '#6a6a66'); bx(R, 2, -8, 12, 15, '#c8c0b0'); R(3, -10, 10, 3, '#a8a090');
        R(4, -6, 8, 11, '#1a2a4a'); R(6, -5, 4, 9, '#3a6aa8'); R(7, -4, 2, 2, '#c8a080'); R(6, -6, 4, 1, '#e8c040');
        for (const x of [1, 13]) { R(x, 11, 2, 4, '#e8e2cc'); const f = Math.sin(t * 14 + x) > 0 ? 1 : 0; R(x, 9 + f, 2, 2 - f, '#ffcf5a'); }
        R(3, 13, 3, 2, '#e88a20'); R(10, 13, 3, 2, '#d84a6a');
      },
      garza(g, e, t, R) { const b = Math.sin(t * .7) > .9 ? 1 : 0; R(7, 8, 1, 7, '#c8c0a0'); R(9, 8, 1, 7, '#c8c0a0'); R(5, 2, 7, 6, '#e8e8e4'); R(10, -4 + b, 2, 7, '#e8e8e4'); R(10, -5 + b, 4, 2, '#e8e8e4'); R(14, -4 + b, 3, 1, '#e8c040'); R(12, -5 + b, 1, 1, '#1a1a1a'); R(4, 4, 2, 3, '#c8c8c4'); },
      espanta(g, e, t, R) { const s = Math.sin(t * 1.1) * .6; R(7, -6, 2, 21, '#5a4024'); R(1 + s, -2, 14, 2, '#5a4024'); R(3, -1, 10, 9, '#8a3a3a'); R(5, -10, 6, 6, '#c8a860'); R(6, -8, 1, 1, '#1a1010'); R(9, -8, 1, 1, '#1a1010'); R(2, -12, 12, 2, '#a88a40'); R(4, -14, 8, 2, '#b89a50'); },
      /* 阿韦霍特柳：又细又高的一根「绿柱子」；岛上的树冠里挂着小娃娃 */
      sauce(g, e, t, R) {
        const sw = Math.round(Math.sin(t * .9 + e.px * .07) * .6), C1 = '#1a3a26', C2 = '#28503a', C3 = '#3a6a42';
        R(7, 2, 2, 13, '#3e2c1c'); R(7, 2, 1, 13, '#56422c');
        R(5 + sw, -24, 6, 2, C1); R(4 + sw, -22, 8, 4, C1); R(3, -18, 10, 18, C1); R(4, 0, 8, 4, C1);
        for (let i = 0; i < 5; i++) R(4 + i * 2 + (i % 2 ? sw : 0), -21 + (i % 2) * 3, 1, 22 - (i % 3) * 3, i % 2 ? C2 : C3);
        R(5 + sw, -19, 2, 7, '#3a6038'); R(9, -10, 1, 5, '#345a34');
        if (e.dolls) for (let i = 0; i < 3; i++) {
          const x = 2 + ((hash(e.px, e.py, i) * 10) | 0), y = -17 + i * 6 + ((hash(e.py, e.px, i) * 3) | 0), c = DCOL[((e.px / 16) * 3 + (e.py / 16) + i) % DCOL.length], sk = '#e4d0bc';
          R(x + 1, y - 3, 1, 3, '#9a8a6a'); R(x, y, 3, 2, sk); R(x, y - 1, 3, 1, DHC[i % DHC.length]); R(x, y + 2, 3, 3, c); R(x, y + 5, 1, 1, sk); R(x + 2, y + 5, 1, 1, sk);
        }
      },
      /* 树上挂的娃娃 */
      muneca(g, e, t, R) {
        const sw = Math.round(Math.sin(t * 1.3 + e.px * .13) * .8), hy = e.hy ?? 1;
        if (e.big) {
          const x0 = 4 + sw, y0 = (e.hy ?? -3);
          R(x0 + 3, y0 - 8, 1, 7, '#c8b890');
          drawDoll(R, x0, y0, { big: true, col: e.col, hc: e.hc, kind: e.kind, ok: e.ok, look: dollLook(e) });
          return;
        }
        const x0 = 6 + sw;
        R(x0 + 2, hy - 5, 1, 4, '#c8b890');
        drawDoll(R, x0, hy, { col: e.col, hc: e.hc, kind: e.kind, look: dollLook(e) });
      },
      /* 湖里的木桩，桩顶绑着一个娃娃 */
      poste(g, e, t, R) {
        const r = ((t * .6 + e.px * .01) % 1);
        R(4 - r * 3, 15, 8 + r * 6, 1, `rgba(150,200,190,${(.25 * (1 - r)).toFixed(2)})`);
        R(7, -2, 3, 17, '#4a3420'); R(7, -2, 1, 17, '#5e4430');
        drawDoll(R, 6, -9, { col: e.col || '#e8e0c8', hc: e.hc || '#d8c070', look: dollLook(e) });
        R(6, -4, 5, 1, '#a08a5a');
      },
      /* 水里追船的小姑娘：只露出头顶、一绺湿头发和两只手 */
      ninaw(g, e, t, R) {
        for (let i = 0; i < 2; i++) { const r = ((t * 1.2 + i * .5) % 1), w2 = 6 + r * 14; R(8 - w2 / 2, 12, w2, 1, `rgba(170,210,200,${(.35 * (1 - r)).toFixed(2)})`); }
        const b = Math.sin(t * 4) > 0 ? 1 : 0;
        R(4, 5 + b, 8, 7, '#0a0909'); R(3, 8 + b, 10, 4, '#0a0909'); R(6, 8 + b, 4, 3, '#b8c8c0'); R(7, 8 + b, 1, 3, '#0a0909');
        R(7, 9 + b, 1, 1, '#dde4de'); R(4, 4 + b, 2, 2, '#9a7ad8');
        R(1, 10 - b, 2, 2, '#b8c8c0'); R(13, 10 + b, 2, 2, '#b8c8c0');
      },
      /* 泥堆、芦苇丛、水纹：被娃娃「看」得久了会发一点光 */
      monticulo(g, e, t, R) {
        if (e.dug) { R(3, 9, 10, 5, '#1a120c'); R(2, 13, 12, 2, '#3a2a1c'); }
        else { R(3, 8, 10, 6, '#3e2e20'); R(5, 6, 6, 3, '#4a3826'); R(6, 6, 3, 1, '#5a4630'); R(2, 13, 12, 2, '#2a1e14'); }
        glint(R, e, t, 8, 7);
      },
      juncos(g, e, t, R) {
        for (let i = 0; i < 7; i++) { const x = 2 + i * 2, s = Math.round(Math.sin(t * 1.6 + i) * .7); R(x + s, -4 + (i % 3) * 2, 1, 18 - (i % 3) * 2, i % 2 ? '#7a8a4a' : '#5a6a38'); R(x + s, -5 + (i % 3) * 2, 1, 2, '#9a7a42'); }
        if (e.ribbon) { R(5, 4, 6, 1, '#c02828'); R(9, 5, 1, 3, '#c02828'); }
        glint(R, e, t, 8, 4);
      },
      onda(g, e, t, R) {
        for (let i = 0; i < 2; i++) { const r = ((t * .5 + i * .5 + e.px * .003) % 1), w2 = 4 + r * 10; R(8 - w2 / 2, 7 + i * 3, w2, 1, `rgba(170,210,200,${(.3 * (1 - r)).toFixed(2)})`); }
        R(6, 8, 4, 2, '#2e5a24');
        glint(R, e, t, 8, 8);
      },
      /* 岛主小屋的门 */
      puerta(g, e, t, R) { R(1, -2, 14, 16, '#3a2a1e'); R(2, -1, 12, 15, '#5a4430'); R(7, -1, 1, 15, '#3a2a1e'); R(11, 5, 1, 2, '#c9a35a'); R(3, -5, 10, 2, '#e8d8c0'); R(4, -5, 2, 2, '#d8a8b8'); R(10, -5, 2, 2, '#a8c0d8'); glint(R, e, t, 8, 6); },
      /* 西北角的老柳树：树干粗，挂满了娃娃 */
      arbol(g, e, t, R) {
        R(4, -4, 8, 19, '#3a2a1c'); R(5, -4, 2, 19, '#4a3826'); R(2, 12, 12, 4, '#3a2a1c'); R(0, 14, 4, 2, '#2e2216'); R(12, 14, 4, 2, '#2e2216');
        R(-2, -26, 20, 24, '#142618'); R(0, -30, 16, 6, '#142618'); for (let i = 0; i < 7; i++) R(-1 + i * 3, -27 + (i % 2) * 2, 1, 22, i % 2 ? '#1e3624' : '#28462c');
        const sw = Math.sin(t * 1.1) * .7;
        for (const [x, y, c] of [[-1, -14, '#d8a8b8'], [13, -10, '#e8e0c8'], [3, -20, '#a8c0d8'], [9, -18, '#c8b090']]) { R(x + 1, y - 3, 1, 3, '#a89a7a'); R(x + sw, y, 3, 2, '#e4d0bc'); R(x + sw, y + 2, 3, 3, c); }
        if (e.hung) { const x = 10 + sw; R(x + 2, -8, 1, 5, '#c8b890'); drawDoll(R, x, -3, { col: '#e8c838', hc: '#d8c070', kind: 'noarm', look: [0, .4] }); }
        if (e.hung2) { const x = 1 - sw; R(x + 2, -9, 1, 6, '#c8b890'); drawDoll(R, x, -3, { col: '#ece8e0', hc: '#4a3020', look: [0, .4] }); R(x, 4, 3, 2, '#3a6aa8'); }
      },
      cruz(g, e, t, R) { R(7, 2, 2, 13, '#6a5a44'); R(4, 5, 8, 2, '#6a5a44'); R(6, 13, 4, 2, '#3a2a1c'); R(5, 12, 2, 2, '#9a7ad8'); },
      farol(g, e, t, R) { R(7, -10, 2, 25, '#3a2a1a'); R(4, -14, 8, 4, '#2a2018'); R(5, -13, 6, 2, Math.random() < .04 ? '#8a6a3a' : '#ffcf6a'); },
      /* 家里：托尼奥躺在床上 */
      bedkid(g, e, t, R) {
        bx(R, 1, -2, 14, 32, '#5a3c26'); R(2, -1, 12, 4, '#6a4a30'); R(3, 3, 10, 7, '#e6e2d6');
        const b = Math.sin(t * 1.4) > 0 ? 1 : 0;
        R(5, 3, 6, 5, '#c08a60'); R(5, 2, 6, 2, '#1a1010'); R(6, 5, 1, 1, '#2a1a14'); R(9, 5, 1, 1, '#2a1a14'); R(5, 6, 1, 1, '#d86a5a'); R(10, 6, 1, 1, '#d86a5a');
        R(2, 9, 12, 20, '#b84a3a'); R(2, 9, 12, 2, '#d86a5a'); R(4, 14 + b, 8, 4, '#a03a2e'); for (let i = 0; i < 4; i++) R(3 + i * 3, 21, 2, 2, '#e8c040');
        R(11, 10, 3, 2, '#e6e2d6');
      },
      /* 窗户：外面是运河，玻璃上有小小的湿手印 */
      ventana(g, e, t, R) {
        bx(R, 1, 0, 14, 12, '#4a3a2a'); R(2, 1, 12, 10, '#0e1a22'); R(2, 7, 12, 4, '#14302a'); R(4, 8, 4, 1, '#2a5446'); R(8, 1, 1, 10, '#4a3a2a'); R(2, 5, 12, 1, '#4a3a2a');
        R(11, 2, 2, 1, '#c8d8e0');
        if (e.wet) { const c = 'rgba(190,220,230,.55)'; R(3, 2, 3, 2, c); R(3, 1, 1, 1, c); R(5, 1, 1, 1, c); R(10, 6, 2, 2, c); R(10, 5, 1, 1, c); R(4, 4, 1, 3, 'rgba(190,220,230,.35)'); R(11, 8, 1, 2, 'rgba(190,220,230,.35)'); }
      },
      recorte(g, e, t, R) { R(3, 1, 10, 11, '#d6d0be'); R(4, 2, 8, 2, '#4a4a4a'); R(4, 5, 4, 4, '#7a7a7a'); R(9, 5, 3, 1, '#888'); R(9, 7, 3, 1, '#888'); R(4, 10, 8, 1, '#888'); R(7, 0, 2, 2, '#c02828'); },
      /* 岛主小屋：桌上的本子和蜡烛、铁盒子、椅子上的娃娃、架子上的娃娃脑袋、日历 */
      mesa(g, e, t, R) {
        R(1, 12, 2, 4, '#3a2618'); R(13, 12, 2, 4, '#3a2618'); bx(R, 0, 2, 16, 11, '#6b4a30');
        R(3, 4, 7, 5, '#c8b890'); R(4, 5, 5, 1, '#6a6050'); R(4, 7, 4, 1, '#6a6050');
        R(12, 1, 2, 4, '#e8e2cc'); const f = Math.sin(t * 15) > 0 ? 1 : 0; R(12, -1 + f, 2, 2 - f, '#ffcf5a');
        if (!e.read) R(6, -2 + (Math.sin(t * 4) > 0 ? 1 : 0), 2, 2, '#ffe680');
      },
      caja(g, e, t, R) { bx(R, 2, 4, 12, 10, '#6a7078'); R(3, 5, 10, 2, '#8a9098'); if (e.open) { R(3, 1, 10, 4, '#4a5058'); R(4, 6, 8, 3, '#1a1a1e'); } else { R(6, 8, 4, 4, '#c9a35a'); R(7, 9, 2, 1, '#6a4a1a'); } },
      silla(g, e, t, R) {
        const c = '#5a3a24'; R(3, -4, 10, 10, shade(c, -.4)); R(4, -3, 8, 8, c); bx(R, 3, 6, 10, 5, shade(c, .1)); R(4, 11, 2, 4, shade(c, -.4)); R(10, 11, 2, 4, shade(c, -.4));
        if (!e.taken) { drawDoll(R, 5, -1, { col: '#ece8e0', hc: '#4a3020', look: [0, .6] }); R(4, 7, 3, 2, '#3a6aa8'); R(8, 4, 3, 1, '#c8c8c8'); }
      },
      estante(g, e, t, R) { bx(R, 0, -8, 16, 22, '#5a4030'); R(1, -1, 14, 1, '#3a2818'); R(1, 6, 14, 1, '#3a2818'); for (let i = 0; i < 3; i++) { R(2 + i * 5, -6, 4, 4, '#e4d0bc'); R(3 + i * 5, -5, 1, 1, '#1a1418'); R(4 + i * 5, -5, 1, 1, i === 1 ? '#e4d0bc' : '#1a1418'); R(2 + i * 5, -7, 4, 1, DHC[i]); } for (let i = 0; i < 4; i++) R(2 + i * 3, 2, 2, 4, DCOL[i]); },
      calendario(g, e, t, R) { R(4, 1, 8, 10, '#e8e2d0'); R(4, 1, 8, 3, '#b83a2a'); for (let y = 0; y < 3; y++) for (let x = 0; x < 3; x++) R(5 + x * 2, 5 + y * 2, 1, 1, '#6a6050'); R(9, 9, 2, 1, '#c02828'); },
      radio(g, e, t, R) { bx(R, 2, 6, 12, 8, '#7a5a3a'); R(4, 8, 5, 4, '#3a2a1e'); R(10, 8, 2, 2, '#c9a35a'); R(10, 11, 2, 1, '#c9a35a'); R(12, 0, 1, 6, '#888'); }
    },
    maps: {
      /* ---------------- 家（运河边的老房子） ---------------- */
      casa: {
        amb: 'room', dark: .55, wall: 'mud', floor: 'wood', plr: 3,
        tileOpts: { woodC: '#5a4030' },
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
          { x: 7, y: 8, spr: 'invisible', touch: S => leaveHome(S) },
          { id: 'tono', x: 2, y: 2, h: 2, spr: 'bedkid', on: S => tono(S) },
          { id: 'ventana', x: 3, y: 1, spr: 'ventana', s: { wet: true }, on: S => ventana(S) },
          { x: 12, y: 1, spr: 'ventana', on: S => S.narr('另一扇窗。外面是自家的小码头，爷爷的船在水里一晃一晃。\n运河对岸的浮田上，有一户人家还亮着灯。') },
          { id: 'recorte', x: 9, y: 1, spr: 'recorte', async on(S) { await S.note('recorte'); S.f.recorte = true; } },
          { x: 6, y: 1, spr: 'painting', col: '#2a4a6a', on: S => S.narr('瓜达卢佩圣母的画像。画框底下压着一枝干掉的万寿菊。\n奶奶走了以后，爷爷每天早上都对着她念一遍经。') },
          { id: 'abuelo', x: 12, y: 3, spr: '@abuelo', dir: 3, on: S => abuelo(S) },
          { id: 'dibujo', x: 4, y: 4, spr: 'paper', async on(S) { await S.note('dibujo'); S.f.dibujo = true; if (S.once('dibujoT')) await S.think('四个娃娃，四样丢了的东西。\n……他画这个的时候，是谁在跟他说话？'); } },
          { x: 14, y: 2, spr: 'dresser', on: S => S.narr('五斗柜上摆着妈妈和奶奶的照片。\n妈妈在城里的医院上夜班，要到天亮才回来。') },
          { x: 8, y: 5, spr: 'table', on: S => S.narr('桌上放着一碗没吃完的玉米粥，和一盒退烧药。\n药盒是空的。') },
          { x: 9, y: 5, spr: 'radio', on: S => { S.tone('sawtooth', 300, 310, .6, .008, 0, 1200); return S.narr('爷爷的收音机。他把声音拧到最小，在听凌晨的天气预报：\n「……霍奇米尔科一带，后半夜有雾……」'); } },
          { x: 1, y: 6, spr: 'basket', on: S => S.narr('一篮子从浮田上摘的生菜，明天一早要拿到码头上卖。') },
          { x: 14, y: 6, spr: 'rope', on: S => S.narr('一卷船绳。爷爷撑了五十年船，绳结打得比谁都牢。') }
        ],
        async enter(S, first) { if (first) await opening(S); }
      },
      /* ---------------- 运河与特修伊洛湖（坐船） ---------------- */
      canal: {
        amb: 'night', dark: .82, plr: 3.2, speed: .85, fog: .22,
        legend: { o: 'shallow', v: 'lirio', V: 'lirioV', H: 'chinampa', F: 'flores', A: 'ahue', D: { t: 'muelle', solid: true } },
        tileOpts: { grassC: '#22341c' },
        rows: CANAL_ROWS,
        ents: [
          ...trees(CANAL_ROWS, false, new Set()),
          { x: 1, y: 30, h: 2, spr: 'invisible', solid: true, on: S => S.narr(S.f.ph === 'canal' ? '自家的码头。窗户里，爷爷的身影在晃。\n……娃娃还在你怀里。得先把它送回去。' : '……') },
          { x: 3, y: 32, w: 3, spr: 'trajinera', col: '#d84a3a', on: S => S.narr('爷爷的游船「露佩塔号」（Lupita），是用奶奶的名字起的。\n拱门上的漆是去年才刷的，红底黄字。白天它载游客，晚上就拴在这儿睡觉。') },
          { x: 12, y: 28, w: 2, spr: 'casita', lit: true, light: { r: 3, col: 'rgba(255,190,110,.16)', dx: 16, dy: 18 }, on: S => S.narr('邻居家的窗户还亮着。里面传出很小声的电视声。') },
          { x: 20, y: 27, w: 2, spr: 'casita', on: S => S.narr('黑着灯的房子。门口晾着一排衣服，被雾打湿了，一动不动。') },
          /* 路边树上的娃娃：会转头 */
          { id: 'c1', x: 28, y: 28, spr: 'muneca', big: true, cn: true, col: '#c02828', hc: '#1a1414', hy: -2, async on(S) { creak(S); await S.narr('柳树上挂着一个穿红裙子的娃娃。\n这就是爷爷说的那棵树。……它的头正对着北边的水道。'); } },
          { id: 'c2', x: 28, y: 22, spr: 'muneca', cn: true, col: '#e8e0c8', hc: '#d8c070', on: async S => { creak(S); await S.narr('又一个娃娃。脸被晒得发白，只剩一只胳膊。\n船从它底下过去的时候，它的脑袋跟着转了半圈。'); } },
          { id: 'c3', x: 23, y: 19, spr: 'muneca', cn: true, col: '#a8c0d8', hc: '#4a3020', on: async S => { creak(S); await S.narr('一个布娃娃，用铁丝拧在树枝上。\n它的纽扣眼睛，一只看着你，一只看着湖的方向。'); } },
          { id: 'c4', x: 16, y: 19, spr: 'muneca', cn: true, col: '#d8a8b8', hc: '#b86a3a', on: async S => { creak(S); await S.narr('娃娃的嘴被人用红线缝过。线已经烂了，嘴角裂开一道缝。'); } },
          { id: 'c5', x: 13, y: 15, spr: 'muneca', cn: true, col: '#cfc8e0', hc: '#1a1414', on: async S => { creak(S); await S.narr('水道两边的柳树上，娃娃越来越多了。\n它们都朝着北边。朝着湖。'); } },
          { x: 18, y: 21, w: 3, spr: 'hundida', on: S => S.narr('一条沉了一半的旧游船。拱门上的字掉了一大半，还认得出：「MARGARITA」。\n……玛加丽塔号。爷爷说，过了它，下一个往北的口子就是湖。') },
          { x: 5, y: 13, spr: 'altarito', light: { r: 2.4, col: 'rgba(255,190,110,.2)', flick: true }, async on(S) {
            await S.narr('浮田边上的小神龛，里面供着瓜达卢佩圣母，两边的蜡烛还没灭。\n不知道是谁，每天夜里都来点。');
            await S.think(S.f.ph === 'canal' ? '圣母啊，保佑托尼奥。\n……这条水道是死的。爷爷说过，过了沉船再往北。' : '……');
          } },
          { x: 22, y: 25, spr: 'garza', on: S => S.narr('一只白鹭单脚站在浮田边上，一动不动，像一尊石膏像。\n前面的水道被水葫芦堵死了。') },
          { x: 33, y: 15, spr: 'espanta', on: S => S.narr('浮田上的稻草人，穿着一件旧红衬衫。\n它的脑袋是一个娃娃的头。……这条水道到头了，没有路。') },
          ...POSTS.map(([x, y], i) => ({ id: 'p' + i, x, y, spr: 'poste', cn: true, col: DCOL[(i * 3) % DCOL.length], hc: DHC[(i * 5) % DHC.length], light: { r: 1.3, col: 'rgba(200,220,235,.1)' },
            on: async S => { creak(S); await S.narr(['水葫芦里插着一根木桩，桩顶绑着一个娃娃。\n这就是爷爷说的路标。', '又一根木桩。桩顶的娃娃，脸朝着你。', '木桩上的娃娃，头发里也开着一朵紫色的水葫芦花。'][i % 3]); } })),
          { x: 27, y: 0, w: 2, spr: 'invisible', solid: true, light: { r: 5, col: 'rgba(255,200,120,.2)', flick: true, dy: 12 } },
          { x: 27, y: 1, w: 2, spr: 'invisible', touch: S => arrive(S) },
          { id: 'nina_l', x: 14, y: 15, spr: 'ninaw', solid: false, hidden: true, light: { r: 1.6, col: 'rgba(170,210,200,.14)' } }
        ],
        async enter(S, first) { if (first) await canalStart(S); },
        step(S, x, y) { return canalStep(S, x, y); },
        tick(S, dt) { canalTick(S, dt); }
      },
      /* ---------------- 娃娃岛 ---------------- */
      isla: {
        amb: 'wind', dark: .8, plr: 3.2, floor: 'dirt', wall: 'wood', wallC: { top: '#1a140f', face: '#5a4430', trim: '#30221a' }, fog: .12,
        legend: { A: 'ahued', D: 'muelle' },
        tileOpts: { grassC: '#22341c' },
        rows: ISLA_ROWS,
        ents: [
          ...trees(ISLA_ROWS, true, new Set(['10,17', '8,8', '24,8', '6,11', ...DECOR_AT.map(p => p.join(','))])),
          { x: 11, y: 19, w: 2, spr: 'barca', on: S => S.narr(S.f.fixed >= 4 ? '你的船。……还有一件事没做完。' : '你的小船，拴在码头的木桩上。\n还不能走。托尼奥的娃娃还没挂回去。') },
          { x: 15, y: 18, spr: 'farol', light: { r: 3.4, col: 'rgba(255,190,110,.2)', flick: true, dy: -10 }, on: S => S.narr('码头上的马灯。灯罩里的煤油还剩小半瓶。\n……岛主去世一年了，是谁一直在给它添油？') },
          { id: 'door_c', x: 14, y: 6, spr: 'puerta', async on(S) { S.sfx('open'); await S.go('choza', 5, 5, 3); } },
          { x: 16, y: 6, spr: 'window', lit: true, light: { r: 3.2, col: 'rgba(255,180,90,.2)', flick: true, dy: 10 }, on: S => S.narr('小屋的窗户透出一点烛光。窗台上摆了一排娃娃的脑袋，脸都朝外。\n……屋里有人点着蜡烛？') },
          { x: 12, y: 6, spr: 'invisible', solid: true, on: S => S.narr('木板钉的墙上，钉满了娃娃。有的只剩一只手，有的只剩一条腿。\n门框上写着几个褪色的字：「NO TOCAR」（别碰）。') },
          { id: 'arbol', x: 3, y: 3, spr: 'arbol', s: { mode: 'idle' }, on: S => arbol(S) },
          { x: 5, y: 2, spr: 'cruz', on: S => S.narr('一个小小的木十字架，没有名字。\n底下放着一颗糖、一只小木马，和一朵已经干掉的水葫芦花。') },
          ...DOLLS.map((D, i) => ({ id: D.id, spr: 'muneca', big: true, kind: D.kind, on: S => dollOn(S, i),
            ...[{ x: 10, y: 17, col: '#3a6ab0', hc: '#4a3020' }, { x: 8, y: 8, col: '#e8d8c8', hc: '#c4aa62' }, { x: 24, y: 8, col: '#d8a8b8', hc: '#e0c860' }, { x: 6, y: 11, col: '#ece4d0', hc: '#8a7a6a' }][i] })),
          ...DECOR,
          /* 三个泥堆、三丛芦苇、三圈水纹：每组只有一个是对的 */
          { id: 'mo_a', x: 6, y: 17, spr: 'monticulo', solid: true, on: S => spot(S, 'mo_a') },
          { id: 'mo_b', x: 17, y: 18, spr: 'monticulo', solid: true, on: S => spot(S, 'mo_b') },
          { id: 'mo_c', x: 10, y: 14, spr: 'monticulo', solid: true, on: S => spot(S, 'mo_c') },
          { id: 'ju_a', x: 28, y: 13, spr: 'juncos', solid: true, s: { ribbon: true }, on: S => spot(S, 'ju_a') },
          { id: 'ju_b', x: 29, y: 8, spr: 'juncos', solid: true, on: S => spot(S, 'ju_b') },
          { id: 'ju_c', x: 28, y: 4, spr: 'juncos', solid: true, on: S => spot(S, 'ju_c') },
          { id: 'on_a', x: 1, y: 12, spr: 'onda', solid: true, on: S => spot(S, 'on_a') },
          { id: 'on_b', x: 2, y: 5, spr: 'onda', solid: true, on: S => spot(S, 'on_b') },
          { id: 'on_c', x: 4, y: 18, spr: 'onda', solid: true, on: S => spot(S, 'on_c') },
          /* 结局用 */
          { id: 'nina', x: 2, y: 4, spr: '@nina', solid: false, hidden: true, dir: 2, light: { r: 2, col: 'rgba(170,210,200,.16)' } },
          { id: 'barca_v', x: 0, y: 6, w: 2, spr: 'barca', viejo: true, solid: false, hidden: true, light: { r: 2.2, col: 'rgba(255,210,150,.14)' } },
          { id: 'doll_x', x: 14, y: 8, spr: 'muneca', solid: false, hidden: true, big: true, col: '#e8d8c8', hc: '#c4aa62', hy: 2, kind: 'eye' }
        ],
        async enter(S, first) { if (first) return islaStart(S); return islaBack(S); },
        tick(S, dt) { gazeTick(S, dt); if (S.f.fixed >= 4 && !S.busy) { SONG_T -= dt; if (SONG_T <= 0) { SONG_T = 11; song(S, .035); } } }
      },
      /* ---------------- 岛主的小屋 ---------------- */
      choza: {
        amb: 'room', dark: .62, plr: 3, wall: 'wood', floor: 'wood', tileOpts: { woodC: '#4a3626' },
        rows: [
          '############',
          '############',
          '#..........#',
          '#..........#',
          '#..........#',
          '#..........#',
          '#####.######'],
        ents: [
          { x: 5, y: 6, spr: 'invisible', async touch(S) { await S.go('isla', 14, 7, 0); } },
          { x: 3, y: 1, spr: 'window', on: S => S.narr('窗外就是柳树。树枝上挂着的娃娃，正好对着这扇窗。') },
          { x: 6, y: 1, spr: 'painting', col: '#2a4a6a', on: S => S.narr('一张瓜达卢佩圣母的画，四个角都被烟熏黑了。\n画框上挂着一串念珠，和一个娃娃的小手。') },
          { x: 9, y: 1, spr: 'calendario', on: S => S.narr('墙上的日历停在2001年4月。\n有一天被红笔圈了起来，旁边写着：「裙子」。') },
          { x: 1, y: 2, h: 2, spr: 'bed', col: '#6a5a4a', on: S => S.narr('一张木板床，毯子叠得整整齐齐，像主人只是出门去了。\n枕头边放着一个手电筒，电池早就没电了。') },
          { id: 'mesa', x: 5, y: 3, spr: 'mesa', light: { r: 3.4, col: 'rgba(255,180,90,.2)', flick: true }, on: S => mesa(S) },
          { id: 'caja', x: 10, y: 2, spr: 'caja', on: S => caja(S) },
          { id: 'silla', x: 8, y: 4, spr: 'silla', on: S => silla(S) },
          { x: 10, y: 4, spr: 'estante', on: S => S.narr('架子上一排娃娃的脑袋，按大小排得整整齐齐。\n有一个的眼珠还会动——你一抬头，它就「咕噜」转了过来。') },
          { x: 2, y: 5, spr: 'radio', on: S => S.narr('一台旧收音机，天线用铁丝接过。\n调频旋钮停在一个放老歌的台上。') }
        ],
        async enter(S, first) { if (first) await S.narr('屋里一股霉味和煤油味。\n桌上的蜡烛点着。……蜡烛是新的。'); }
      }
    }
  });

  /* ================= 剧情 ================= */
  function boatMode(S) { S.wear('chalupa'); S.norun(true); S.speed(1); }
  function walkMode(S) { S.wear('@me'); S.norun(false); S.speed(1); }

  async function opening(S) {
    await S.narr('运河边的老房子。窗户外面就是水，水上浮着一层月光。\n屋里只点着一盏小灯。');
    await S.say('托尼奥', '……好冷……她说那边好冷……', WS);
    S.face('abuelo', 'pl');
    await S.say('切马爷爷', ['又在说梦话了。烧还是退不下去。', '玛蒂娜，你过来。看看那扇窗户。']);
    S.face('abuelo', 3);
    S.f.ph = 'casa';
    S.goal('看看托尼奥床边的窗户，再问问爷爷');
    S.cp('casa');
  }

  async function ventana(S) {
    if (S.once('ventana1')) {
      await S.narr('托尼奥床头的窗户。玻璃上印着几个小小的手印。\n是小孩的手。从外面按上去的。还湿着，一滴一滴往下淌。');
      S.sfx('drip');
      await S.think('窗户外面……就是运河。\n那里没有地方能站人。');
      if (!S.f.abuelo) S.goal('问问爷爷是怎么回事');
      return;
    }
    await S.narr('手印还在。你用袖子擦了一下——\n擦不掉。手印是印在玻璃外面的。');
  }

  async function abuelo(S) {
    S.face('abuelo', 'pl');
    if (S.f.abuelo >= 2) {
      if (!S.has('muneca_t')) return S.say('切马爷爷', '娃娃在托尼奥手里攥着呢。去拿过来——轻点，别吵醒他。');
      return S.say('切马爷爷', ['湖上起雾的时候别停。跟着桩子上的娃娃走，别进水葫芦。', '要是有东西抓住船帮，就拿竿子拍水，拍三下。……只灵一次。', '去吧，孩子。圣母保佑你。']);
    }
    if (S.f.abuelo === 1) return abueloTask(S);
    S.f.abuelo = 1;
    await S.say('切马爷爷', ['上礼拜天，学校带孩子们去坐船，去了那个岛——现在城里人都爱去那儿拍照。这孩子从岛上带回来一个娃娃，塞在书包里，谁也没告诉。', '从那天晚上起，他就发烧。每天夜里，窗户上都有那个。']);
    await S.say('切马爷爷', ['那个岛的主人，我认识。我年轻的时候撑船，常给他捎点煤油、玉米饼、旧报纸。他一个人在岛上住了五十年。', '他说，他刚上岛那几年，在岛边的水湾里捞起过一个小姑娘。淹死的。没人知道是谁家的孩子。', '过了几天，一个娃娃从同一个地方漂了过来。他把它挂在树上，跟她说：给你的，你别怕了。', '那以后，他夜里老听见她在岛上走、在水边唱歌，就一个接一个地挂娃娃。从垃圾堆里捡，从水里捞，后来拿自己种的菜跟人换。挂满了一整个岛。']);
    const r = await S.ask('爷爷望着窗外的水。', ['……他后来呢？', '那都是传说吧？']);
    if (r === 0) await S.say('切马爷爷', ['去年春天，人家发现他倒在水里。据说，就在他当年捞起小姑娘的那个水湾。', '……也有人说是心脏不好。一个八十岁的老头子，掉进水里，谁知道呢。']);
    else await S.say('切马爷爷', ['传说？也许吧。有人说那个小姑娘根本不存在，是他一个人住久了，自己想出来的。也有人说，他挂娃娃是为了挡住水里的坏东西。', '……可窗户上的手印，不是传说。']);
    await S.say('切马爷爷', '那个娃娃是她的。得有人送回去。');
    S.goal(S.has('muneca_t') ? '再跟爷爷说话：该怎么把娃娃送回去' : '从托尼奥手里拿过那个娃娃，再跟爷爷说话');
  }
  async function abueloTask(S) {
    S.f.abuelo = 2;
    await S.say('切马爷爷', ['得有人把它送回岛上，亲手挂回树上。', '我这把老腰，上礼拜在码头上摔了一跤，竿子都撑不动了。你妈在城里上夜班，天亮才回来。', '你十二岁就跟着我撑船。这条水路，你闭着眼睛也能走一半。另一半——']);
    await S.narr('爷爷从五斗柜的抽屉里摸出一张折了好几折的纸。');
    await S.note('ruta'); S.f.ruta = true;
    await S.say('切马爷爷', ['湖上起雾的时候，千万别停，一直往前撑。跟着湖里插的木桩走——他在桩子上也挂了娃娃，给自己认路的。水葫芦别进，缠住竿子就走不动了。', '要是……要是有什么东西抓住了船帮，就拿竿子拍水，拍三下。他说过，拍水能把她吓回去。', '可只灵一次。']);
    if (S.coop) S.toast('两人：一个人在「笺」里看《航路》念给撑船的人听');
    S.goal(S.has('muneca_t') ? '去门口的码头，撑船去娃娃岛' : '从托尼奥手里拿过那个娃娃，撑船去娃娃岛');
  }

  async function tono(S) {
    if (S.has('muneca_t')) {
      if (S.f.tono2) return S.say('托尼奥', '……姐姐，你别不理她。', WS);
      S.f.tono2 = true;
      return S.say('托尼奥', ['……她说，她在岛上等你。', '她说，你会帮她的娃娃们把东西找回来。'], WS);
    }
    await S.narr('托尼奥的脸烧得通红，嘴唇却是青的。\n他睁开眼睛，看了你很久，才认出你来。');
    await S.say('托尼奥', ['姐姐……', '我不是偷的。是她让我带的。', '她在岛上一直跟着我们。别人都看不见她，就我看得见。她浑身湿漉漉的，头发上挂着一朵紫色的花。', '她说岛上好冷。老爷爷不在了，娃娃们都坏了，丢了东西，没人管她们了。', '她说她想跟我回家……所以我就把她的娃娃带回来了。她就能跟着娃娃来。'], WS);
    await S.narr('他从被子底下摸出一个小娃娃，塞进你手里。\n……凉的。湿的。像刚从水里捞上来。');
    S.give('muneca_t');
    await S.say('托尼奥', '姐姐，你别把她挂回去，好不好？她一个人在那儿……好可怜。', WS);
    await S.think('窗户上的水，还在往下淌。');
    if (S.f.abuelo >= 2) S.goal('去门口的码头，撑船去娃娃岛');
    else if (S.f.abuelo) S.goal('再跟爷爷说话：该怎么把娃娃送回去');
    else S.goal('问问爷爷该怎么办');
  }

  async function leaveHome(S) {
    if (!(S.f.abuelo >= 2) || !S.has('muneca_t')) {
      S.sfx('locked');
      await S.think(!S.f.abuelo ? '……先问问爷爷，到底是怎么回事。' : !S.has('muneca_t') ? '娃娃还在托尼奥手里。' : '……先问问爷爷，去岛上的路怎么走。');
      return S.walk('pl', 'u', 4);
    }
    await S.narr('门外就是自家的小码头。雾已经从水面上升起来了。\n你解开船绳，跳上了爷爷的小船（chalupa）。');
    S.f.ph = 'canal';
    boatMode(S);
    await S.go('canal', 3, 30, 2);
  }

  /* ---------------- 运河 ---------------- */
  async function canalStart(S) {
    await S.narr('竹竿插进水里，船慢慢地动了。\n两岸的浮田黑沉沉的，阿韦霍特柳一棵挨一棵，又细又高，像一排站着的人。');
    await S.think('往东。头一个满是水葫芦的口子别进。');
    S.goal('照着《航路》撑船去娃娃岛（笺里能看）');
    if (S.coop) S.toast('两人：一个人看笺里的《航路》，一个人撑船');
    S.cp('canal');
  }
  const DEADS = { v1: (x, y) => y <= 25 && x >= 19 && x <= 21 && y >= 24, v0: (x, y) => x <= 5 && y <= 15, v4: (x, y) => x >= 32 && y <= 17 };
  function canalStep(S, x, y) {
    const n = tileName(curMap(), x, y);
    S.speed(n === 'lirio' ? .45 : 1);
    if (n === 'lirio' && S.f.ph === 'canal' && S.once('lirio1')) S.toast('水葫芦缠住了竿子，船一下子慢了下来');
    if (S.f.ph === 'canal' && x >= 26 && x <= 27 && y <= 27) S.f.v3 = true;
    if (S.f.ph === 'canal') {
      for (const k in DEADS) if (DEADS[k](x, y) && S.once('dead_' + k)) return deadEnd(S, k);
      if (x >= 24 && y >= 30 && S.once('c1see')) return c1See(S);
      if (x >= 14 && x <= 15 && y === 16) return lagoCP(S);
    }
    if (S.f.ph === 'lago0' && y <= 11) return lagoStart(S);
  }
  async function deadEnd(S, k) {
    const n = S.f.dead = (S.f.dead || 0) + 1;
    S.sfx('drip');
    await S.think(k === 'v1' ? '水葫芦把水道堵死了。……爷爷说，满是水葫芦的那个口子别进。' : k === 'v0' ? '死路。……过了沉船，是「下一个」往北的口子。' : '到头了。这条水道，前面没有挂娃娃的树。');
    if (n === 2) S.goal('往东撑，在挂红裙子娃娃的柳树下往北拐');
    if (n >= 3) { S.goal('红裙子娃娃的树下往北 → 到头往西 → 过沉船后往北进湖'); S.toast('路线已写进目标'); }
  }
  async function c1See(S) {
    creak(S); await S.wait(300); creak(S, 1, .035);
    await S.think('前面那棵柳树上挂着一个穿红裙子的娃娃。\n……船往前走，它的头也跟着转。');
  }
  async function lagoCP(S) {
    S.f.ph = 'lago0';
    await S.narr('水道两边的柳树上，娃娃越来越密了。\n雾里，前面传来小女孩的歌声——');
    song(S, .05);
    await S.say('', '「Señora Santa Ana, ¿por qué llora la niña?……」\n（圣安娜夫人，小姑娘为什么哭？）', WS);
    await S.think('前面就是特修伊洛湖了。\n湖上别停。跟着木桩上的娃娃。');
    S.goal('穿过湖到对岸亮灯的码头：别停，绕开水葫芦，跟着木桩');
    if (S.coop) S.toast('两人：一个人盯着雾里的木桩报方向，一个人撑船');
    S.cp('lago');
  }
  async function lagoStart(S) {
    S.f.ph = 'lago'; S.f.grab = S.f.grab || 0;
    S.sfx('splash'); S.shake(300, 2);
    S.place('nina_l', 14, 17, 3); S.ent('nina_l').alpha = 0; S.alpha('nina_l', 1, 700); S.bubble('nina_l', '!', 1000);
    S.amb('none'); S.plr(2.8);
    await S.narr('歌声停了。\n身后的水道里，「哗啦」一声。');
    await S.think('别停——撑！');
    S.chase('nina_l', { spd: NSPD, wait: 1, catch: grab, zone: LAGO });
    DRIP_T = .5;
  }
  /* 她身后 6 格左右的水面（离入口更近的一边） */
  function behind(S, n) {
    const m = curMap(), P = W.pl, bfs = (sx, sy) => { const d = new Map([[sx + ',' + sy, 0]]), q = [[sx, sy]]; while (q.length) { const [x, y] = q.shift(), k = d.get(x + ',' + y); for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const nx = x + dx, ny = y + dy, kk = nx + ',' + ny; if (d.has(kk) || tileSolid(m, nx, ny) || !LAGO(nx, ny)) continue; d.set(kk, k + 1); q.push([nx, ny]); } } return d; };
    const dp = bfs(P.x, P.y), de = bfs(14, 16), mine = de.get(P.x + ',' + P.y) ?? 99;
    let best = null, bs = 1e9;
    for (const [k, v] of dp) { if (v < n - 1 || v > n + 1) continue; const e2 = de.get(k) ?? 99; if (e2 >= mine) continue; const sc = Math.abs(v - n) * 3 + e2; if (sc < bs) { bs = sc; best = k; } }
    if (!best) for (const [k, v] of dp) if (v >= 3 && (!best || v > dp.get(best))) best = k;
    return best ? best.split(',').map(Number) : [14, 15];
  }
  async function grab(S) {
    S.f.grab = (S.f.grab || 0) + 1;
    if (S.f.grab >= 2) {
      DIED++;
      await S.scare('face', { spr: '@nina', sfx: 'scream' });
      return S.die('那只小手又抓住了船帮。\n这一次，竿子拍在水上，什么也没有发生。\n船慢慢地歪了过去——\n湖水漫上来的时候，你听见有人贴着你的耳朵在唱歌。', '湖底的歌');
    }
    S.sfx('splash'); await S.scare('flash', { sfx: 'sting' }); S.shake(700, 3);
    await S.narr('一只冰凉的小手搭上了船帮。\n船猛地往一边歪——');
    await S.keypad('拍水！拍三下！\n（点按钮，或按数字 1）', ['拍水'], 3, { cancel: false, alias: { 1: '拍水', 2: '拍水', 3: '拍水' } });
    splash3(S);
    for (let i = 0; i < 3; i++) { S.sfx('splash'); S.shake(160, 2); await S.wait(200); }
    const [bx2, by2] = behind(S, 6);
    S.place('nina_l', bx2, by2, 3); S.ent('nina_l').alpha = 0;
    await S.narr('那只手缩回了黑水里。\n……爷爷说过，只灵一次。');
    S.alpha('nina_l', 1, 900);
    S.chase('nina_l', { spd: NSPD, wait: 1.4, catch: grab, zone: LAGO });
  }
  function canalTick(S, dt) {
    if (S.busy) return;
    const p = W.pl;
    if (S.f.ph === 'canal' && !S.f.v3) { S.f.navT = (S.f.navT || 0) + dt; if (S.f.navT > 120 && S.once('navHint')) { S.goal('往东撑，在挂红裙子娃娃的柳树下往北拐'); S.toast('爷爷的话：一直往东，红裙子娃娃的树下往北'); } }
    if ((S.f.ph === 'canal' && p.y <= 21 && p.x <= 22) || S.f.ph === 'lago0') {
      SONG_T -= dt;
      if (SONG_T <= 0) { SONG_T = 10; const d = Math.abs(p.x - 14) + Math.abs(p.y - 12); song(S, Math.max(.012, .04 - d * .0016)); }
    }
    if (S.f.ph === 'lago') {
      const e = S.ent('nina_l'); if (!e || e.hidden) return;
      const d = Math.abs(e.px - p.px) / 16 + Math.abs(e.py - p.py) / 16;
      DRIP_T -= dt;
      if (DRIP_T <= 0) { DRIP_T = Math.max(.35, Math.min(2.2, d / 4)); S.sfx('drip'); if (d < 4) S.tone('sine', 90, 70, .2, .06, 0, 300); }
    }
  }
  async function arrive(S) {
    S.stop('nina_l'); S.hide('nina_l');
    S.f.ph = 'isla';
    walkMode(S); S.plr(null);
    await S.go('isla', 13, 19, 3);
  }

  /* ---------------- 岛上 ---------------- */
  async function islaStart(S) {
    S.give('garrocha', true);
    await S.narr('船头碰上了木头码头。\n岛上一点声音也没有。没有虫叫，没有蛙鸣。');
    S.focus(13, 12); await S.wait(500);
    await S.narr('柳树上挂满了东西。一开始，你以为是果子。');
    await S.narr('是娃娃。\n几百个娃娃。挂在树枝上，钉在树干上，绑在篱笆上。没有头的，没有手的，没有衣服的。被太阳晒白的，被雨泡烂的。\n它们全都低着头。');
    chorus(S); S.ent('arbol').s.mode = 'track'; S.shake(400, 1);
    await S.wait(700);
    await S.narr('……「咯」。\n所有的头，一起转了过来。');
    S.focus(null);
    await S.think('……爷爷，你没说过它们会动。');
    S.toast('获得：竹竿（能从岸上够到水里的东西）');
    islaGoal(S);
    S.cp('isla');
  }
  async function islaBack(S) {
    if (S.f.boxOpen && S.once('exitScare')) {
      S.show('doll_x'); S.ent('doll_x').alpha = 1;
      await S.narr('你推开门——');
      await S.scare('face', { spr: '@nina', face: 'muneca', sfx: 'scare' });
      await S.narr('门前的地上，坐着一个没有眼睛的瓷娃娃，仰着脸看你。\n刚才进门的时候，这里什么也没有。');
      await S.alpha('doll_x', 0, 600);
      await S.think('……它在等它的眼睛。');
    }
  }
  function islaGoal(S) {
    if ((S.f.fixed || 0) >= 4) return S.goal('把托尼奥的娃娃挂到西北角的老柳树上');
    if (!S.f.cuaderno) return S.goal('上岛看看，找到岛主的小屋');
    S.goal(`找回娃娃们丢的东西（${S.f.fixed || 0}/4）：站定不动，看它们在看哪儿`);
  }
  function gazeTick(S, dt) {
    if (S.busy || W.ended || !S.ent('arbol') || S.ent('arbol').s.mode === 'idle') { STILL = 0; return; }
    STILL = S.moving ? 0 : STILL + dt;
    const p = W.pl;
    for (const D of DOLLS) {
      const e = S.ent(D.id), tg = S.ent(D.t); if (!e || !tg) continue;
      const ex = Math.round(e.px / 16), ey = Math.round(e.py / 16);
      const near = !e.s.ok && Math.abs(p.x - ex) + Math.abs(p.y - ey) <= 8;
      const look = near && STILL > 1;
      if (look && e.s.lx == null) { e.s.lx = Math.round(tg.px / 16); e.s.ly = Math.round(tg.py / 16); creak(S, 1, .035); if (Math.abs(p.x - ex) + Math.abs(p.y - ey) <= 6) S.bubble(D.id, '…', 900); }
      else if (!look && e.s.lx != null) { delete e.s.lx; delete e.s.ly; }
      const gl = !e.s.ok && ((near && STILL > 2.5) || !!tg.s.hint);
      if (!!tg.s.gl !== gl) { tg.s.gl = gl; tg.light = gl ? GLINT : null; }
    }
  }
  function glint(R, e, t, cx, cy) {
    if (!e.gl) return;
    const b = (Math.sin(t * 5) + 1) / 2;
    R(cx - 1, cy - 1, 2, 2, '#fff6c0'); if (b > .4) { R(cx - 1, cy - 4, 2, 8, 'rgba(255,240,180,.6)'); R(cx - 4, cy - 1, 8, 2, 'rgba(255,240,180,.6)'); }
  }
  async function dollOn(S, i) {
    const D = DOLLS[i], e = S.ent(D.id), tg = S.ent(D.t);
    if (e.s.ok) return S.narr(D.done);
    creak(S);
    if (S.has(D.item)) {
      S.take(D.item); e.s.ok = true; delete e.s.lx; delete e.s.ly; tg.s.gl = false; tg.s.hint = false; tg.light = null;
      chime(S);
      if (S.f.dim) { S.f.dim = Math.max(0, S.f.dim - 2); S.plr(S.f.dim ? 3.2 - .45 * S.f.dim : null); }
      await S.narr(D.fix);
      S.f.fixed = (S.f.fixed || 0) + 1;
      if (S.f.fixed >= 4) return allFixed(S);
      if (S.f.fixed === 1) await S.think('……它的头不转了。\n找回了东西，它就不用再盯着看了。');
      islaGoal(S);
      return;
    }
    const h = S.f['h' + i] = (S.f['h' + i] || 0) + 1;
    if (h === 1) { await S.narr(D.desc); await S.think(D.think); return; }
    if (h === 2) { await S.narr(D.desc.split('\n')[0] + '\n……你一停下来，它的头就慢慢地转了过去。'); await S.think('站着别动，看它在看哪儿。'); return; }
    if (h === 3) return S.think(D.h3);
    tg.s.hint = true;
    await S.think(D.h4);
  }
  async function spot(S, id) {
    const e = S.ent(id), di = SPOTS[id], D = DOLLS[di];
    if (e.s.done) return S.narr(id.startsWith('mo') ? '一个被你扒开的小土坑。' : id.startsWith('ju') ? '被你拨乱的芦苇。' : '水纹慢慢平了。');
    if (id.startsWith('on') && !S.has('garrocha')) return S.narr('水里有一圈一圈的水纹。手够不着。');
    if (D.t === id) {
      e.s.done = true; e.s.gl = false; e.s.hint = false; e.light = null;
      if (id.startsWith('mo')) { e.s.dug = true; await S.narr('你用手扒开湿泥。指尖碰到了一个小小的、硬硬的东西——\n是一只娃娃的小红鞋。鞋带还系着，是一根红毛线。'); }
      else if (id.startsWith('ju')) { e.s.ribbon = false; await S.narr('你拨开芦苇。一根红发带缠在芦苇秆上，打了好几个死结，像是被谁故意系上去的。\n你一个结一个结地解开了。'); }
      else { S.sfx('splash'); await S.narr('你把竹竿伸进水纹中间，轻轻一挑——\n竿头挂上来一顶巴掌大的小草帽，湿淋淋的，帽檐上缝着一圈红线。'); }
      S.give(D.item);
      S.goal(`把${itemName(D.item)}还给${D.name}`);
      return;
    }
    S.f['w' + di] = (S.f['w' + di] || 0) + 1;
    if (id.startsWith('mo')) e.s.dug = true;
    e.s.done = true;
    await S.narr(WRONG[id]);
    /* 选错的代价：岛上的雾浓一层（光圈缩小），所有娃娃一起转过头来；找回一样东西才亮回来 */
    S.f.dim = (S.f.dim || 0) + 1; S.plr(Math.max(1.8, 3.2 - .45 * S.f.dim));
    chorus(S); S.shake(250, 1);
    if (S.f['w' + di] === 1) { S.sfx('giggle'); await S.think('……身后的树上，好像有谁「嘻」地笑了一声。\n雾一下子浓了。'); }
    else await S.think(`不是这里。雾又浓了。\n……${D.name}，到底在看哪儿？站在它附近别动，看它的头。`);
  }
  async function mesa(S) {
    const first = !S.f.cuaderno;
    await S.note('cuaderno'); S.f.cuaderno = true; S.ent('mesa').read = true;
    if (first) {
      await S.think('「她们丢了东西，就会一直看着那个东西。」\n……刚才上岛的时候，那几个娃娃一直歪着头。');
      islaGoal(S);
    }
  }
  async function caja(S) {
    const e = S.ent('caja');
    if (e.open) return S.narr('铁盒子空了。只剩那张老照片。');
    await S.narr('一个铁皮饼干盒，上面挂着一把旧铜锁。\n锁上有四个铜钮，每个钮上刻着一个小小的娃娃。');
    const keys = ['蓝裙子', '没眼睛', '散头发', '白衣裳'];
    if (S.coop && S.once('boxCoop')) S.toast('两人：一个人翻笺里的本子念年份，一个人按铜钮');
    const v = await S.keypad('四个铜钮：按她们上岛的先后，一个一个按\n（键盘 1 蓝裙子　2 没眼睛　3 散头发　4 白衣裳）', keys, 4, { sep: '·', alias: { 1: '蓝裙子', 2: '没眼睛', 3: '散头发', 4: '白衣裳' } });
    if (v == null) return;
    if (v === '白衣裳·散头发·蓝裙子·没眼睛') {
      e.open = true; S.f.boxOpen = true; S.sfx('open'); chime(S);
      S.give('ojo');
      await S.narr('「咔嗒」。锁开了。\n盒子里垫着一块手帕，手帕上躺着一颗蓝色的玻璃眼珠。');
      await S.narr('眼珠底下压着一张老照片：岛上只有一棵小柳树，树上挂着一个穿白衣裳、戴草帽的娃娃。\n照片背面写着：「1951。第一个。」');
      return;
    }
    const n = S.f.boxWrong = (S.f.boxWrong || 0) + 1;
    S.sfx('locked');
    if (n === 1) { S.sfx('giggle'); await S.scare('flash', { sfx: 'sting' }); await S.narr('铜钮「啪」地全弹了回来。\n窗外的树上，有一个娃娃在笑。'); }
    else await S.narr('铜钮「啪」地全弹了回来。');
    if (n === 2) await S.think(S.f.cuaderno ? '本子上，每个娃娃都写着年份。……按年份从早到晚。' : '桌上那个本子，也许写着什么。');
    else if (n === 3) await S.think('1951 年那个最早——穿白衣裳的，是第一个。然后是 1965……');
    else if (n >= 4) await S.think('白衣裳（1951）、散头发（1965）、蓝裙子（1973）、没眼睛（1988）。');
  }
  async function silla(S) {
    const e = S.ent('silla');
    if (e.s.taken) return S.narr('一把空椅子。椅面上放着一卷蓝线和一根针。');
    await S.narr('椅子上坐着一个娃娃。白裙子，裙摆上补了一块蓝布，针脚又大又歪，很认真。\n针还别在布上，线头没剪。');
    if (!S.f.cuaderno) return S.think('……这个娃娃，好像是特意放在这儿的。');
    await S.think('「椅子上那个是给她的。等我把裙子补好，就挂到老柳树上去。」\n……他没来得及。');
    const r = await S.ask('要带上它吗？', ['把它带上，替他挂到老柳树上', '别动它']);
    if (r !== 0) return;
    e.s.taken = true; S.give('muneca_v');
    await S.narr('你咬断了线头，把针别回线卷上。\n娃娃很轻。');
  }
  async function allFixed(S) {
    await S.narr('最后一个娃娃安静了下来。');
    await S.wait(500);
    chorus(S); S.ent('arbol').s.mode = 'all'; S.shake(500, 1);
    if (S.f.dim) { S.f.dim = 0; S.plr(null); }
    await S.narr('「咯、咯、咯……」\n岛上所有的娃娃，一起把头转向了同一个地方——');
    S.focus(4, 4); song(S, .05); await S.wait(900);
    await S.narr('西北角，那棵最老的柳树。');
    S.focus(null);
    await S.think('……她在那儿等着。');
    S.goal('把托尼奥的娃娃挂到西北角的老柳树上');
    SONG_T = 11;
    S.cp('final');
  }
  async function arbol(S) {
    if ((S.f.fixed || 0) < 4) {
      await S.narr('岛上最老的一棵柳树，树皮裂得像老人的手。\n树根底下的水湾，黑得发亮，一点波纹也没有。');
      return S.think(S.f.cuaderno ? '……就是这里。他捞起她的地方。\n也是他倒下的地方。' : '……这里好安静。');
    }
    return finale(S);
  }
  async function finale(S) {
    await S.narr('你走到老柳树底下。水湾里的水一动不动。');
    song(S, .06);
    S.place('nina', 2, 4, 2); S.ent('nina').alpha = 0; await S.alpha('nina', 1, 1200);
    await S.narr('水面上站着一个小姑娘。\n浑身湿透，头发贴在脸上，头发里别着一朵紫色的水葫芦花。\n她没有看你。她在看你手里的娃娃。');
    await S.say('小姑娘', '「Señora Santa Ana, ¿por qué llora la niña?」\n（圣安娜夫人，小姑娘为什么哭？）', WS);
    await S.think('托尼奥说：「你别把她挂回去，好不好？她一个人在那儿，好可怜。」');
    if (S.coop) S.toast('两个人商量好再选');
    const r = await S.ask('托尼奥的娃娃在你手里，凉凉的。', ['把娃娃挂到柳树上', '把娃娃抱回船上（托尼奥说，她想跟他回家）']);
    if (r === 1) return takeEnding(S);
    S.take('muneca_t'); S.ent('arbol').s.hung = true; chime(S);
    await S.narr('你踮起脚，把托尼奥的娃娃挂上了最低的那根树枝。\n黄裙子在风里转了半圈，停住了，脸朝着水湾。');
    await S.say('小姑娘', '「……Por una manzana que se le ha perdido.」\n（……因为她丢了一个苹果。）', WS);
    await S.narr('小姑娘伸出手，碰了碰娃娃光着的小脚。\n然后，她第一次抬起头，看了你一眼。');
    if (S.has('muneca_v')) return bothEnding(S);
    await S.alpha('nina', 0, 1600);
    const chair = S.f.cuaderno ? '\n\n只是你一直会想起，小屋里那把椅子上，还坐着一个补了一半裙子的娃娃。\n它没能挂上老柳树。' : '';
    await S.end({ id: 'hang', title: '最后一个娃娃', text: '你把托尼奥的娃娃挂上了老柳树。\n小姑娘看了它很久，然后转过身，走进了雾里。\n\n回去的路上，雾散了。湖里的木桩一根一根从船边滑过去，桩顶的娃娃都低着头，像睡着了。\n\n天亮的时候，托尼奥的烧退了。\n他说他梦见一个小姑娘坐在柳树底下，给一排娃娃梳头。\n「她说谢谢。」他说，「她说，她不冷了。」\n\n窗户上的手印，再也没有出现过。' + chair });
  }
  async function bothEnding(S) {
    S.take('muneca_v'); S.ent('arbol').s.hung2 = true; chime(S);
    await S.narr('你想起怀里还有一个娃娃——老人没来得及挂上的那个。\n你把它挂在托尼奥的娃娃旁边。补着蓝布的白裙子，和黄裙子，挨在一起。');
    S.place('barca_v', 0, 7); S.ent('barca_v').alpha = 0; S.ent('barca_v').dir = 2;
    S.tone('sine', 220, 218, 2.5, .03, 0, 0);
    await S.alpha('barca_v', 1, 1400);
    const b = S.ent('barca_v');
    for (let i = 0; i < 20; i++) { b.py -= 1.6; await S.wait(40); }
    await S.narr('雾里慢慢漂过来一条小船。\n撑船的是一个戴草帽的老人。他的衣服是干的，胡子是白的，脸上全是笑纹。');
    await S.say('老人', ['……裙子补好了？', '谢谢你，孩子。'], WS);
    await S.narr('小姑娘转过身，踩着水，一步一步走到船边。老人把她抱了上去。');
    S.hide('nina'); b.s.nina = true; b.nina = true;
    await S.narr('老人朝你点了点头，把竹竿往水里一撑。');
    for (let i = 0; i < 30; i++) { b.py -= 1.2; b.alpha = Math.max(0, 1 - i / 30); await S.wait(50); }
    S.hide('barca_v');
    await S.end({ id: 'both', title: '老人的船', text: '小船驶进了雾里。歌声跟着它，越来越远。\n岛上的娃娃一个接一个地低下了头。\n\n回去的路上，湖面上没有雾，也没有手。\n天亮的时候，托尼奥的烧退了。他说他梦见一个老爷爷撑着船，船上坐着一个戴草帽的小姑娘。\n「他们说，要去看一个苹果园。」\n\n第二年春天，来岛上的游客说，那棵老柳树上并排挂着两个娃娃：一个穿补过的白裙子，一个穿黄裙子、少了一只胳膊。\n它们的头，总是朝着湖那边——雾起来的地方。' });
  }
  async function takeEnding(S) {
    await S.narr('你把娃娃抱在怀里，转身往码头走。\n小姑娘没有拦你。');
    S.ent('arbol').s.mode = 'track'; chorus(S);
    await S.narr('身后，岛上所有的头，一起转了过来。\n看着你。');
    await S.scare('face', { spr: '@nina', sfx: 'scream' });
    await S.end({ bad: true, id: 'take', title: '跟着回家的', text: '你把娃娃抱回了船上。\n小姑娘一直站在水湾里看着你，直到雾把她遮住。\n\n回去的路上，船越来越沉。\n你回头看了一眼——船尾的水里，搭着一只白白的小手。\n\n托尼奥的烧第二天就退了。\n他每天傍晚都坐在码头上，对着水说话，说得很开心。\n\n一个月以后，你们家码头边的柳树上，挂上了第一个娃娃。\n没有人知道是谁挂的。\n\n（「谁也不许把娃娃带走。带走一个，她就跟着那一个走了。」）' });
  }
})();
