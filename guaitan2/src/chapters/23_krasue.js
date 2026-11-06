/* ================= 第二十三夜 · 飞头 ================= */
(() => {
  /* 用字符串拼地图：先铺底，再按矩形刷字符 */
  function mkRows(w, h, base, ops) {
    const g = [...Array(h)].map(() => Array(w).fill(base));
    for (const [x0, y0, x1, y1, c] of ops) for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) g[y][x] = c;
    return g.map(r => r.join(''));
  }
  const zset = rows => { const s = new Set(); rows.forEach((r, y) => [...r].forEach((c, x) => { if (c === 'Z') s.add(x + ',' + y); })); return s; };

  /* ---- 夜里找身子：时间与追逐参数 ---- */
  const T_FULL = 240, T_FLOOR = 150, T_FLOOR_F = 120, PEN = 35;
  const FAILS = { c: 0, t: 0, s: 0 };          // 死了几次（不随检查点回滚，重来时给更直白的提示）
  let LEFT = null;                        // 死的时候还剩几秒（重来时不把时间回满）
  let NIGHT_SEEN = false;                 // 夜里第一次出门的镜头只放一次
  const HEAD = { st: 'patrol', t: 0, wp: 0, hum: 0, noise: null, warned: false };   // 飞头状态（只在主机 tick 里用）
  const G = { st: 'idle', t: 0, warn: 0, grace: 0, hold: 0, hum: 0, hb: 0 };          // 谷仓里「等她回来」

  const WP = {
    village: [[14, 5], [20, 5], [24, 7], [24, 12], [21, 16], [16, 16], [13, 13], [11, 9], [9, 4], [11, 5]],
    field: [[10, 12], [16, 11], [24, 9], [30, 9], [31, 15], [26, 16], [18, 19], [11, 17], [7, 13]]
  };

  /* ---- 合成音 ---- */
  function hum(S, v) { S.tone('sine', 1180, 1262, .9, v, 0, 2600); S.tone('sine', 1196, 1140, .9, v * .55, .06, 2600); }   // 细细的「咿——」
  function screech(S) { S.tone('sawtooth', 880, 1900, .32, .11, 0, 3200); S.tone('square', 1750, 560, .5, .05, .22, 2200); }
  function anklet(S, v = 1) { S.tone('triangle', 3120, 3060, .12, .05 * v, 0, 7000); S.tone('triangle', 3740, 3700, .1, .035 * v, .08, 7000); }
  function rooster(S) { S.tone('sawtooth', 520, 780, .18, .06, 0, 2200); S.tone('sawtooth', 780, 920, .45, .06, .2, 2200); S.tone('sawtooth', 920, 560, .55, .05, .66, 1900); }
  function howl(S) { S.tone('sine', 420, 660, .6, .07, 0, 1400); S.tone('sine', 660, 360, 1.1, .06, .6, 1400); }
  function babyCry(S) { for (let i = 0; i < 3; i++) S.tone('triangle', 540, 680, .26, .035, i * .38, 2400); }

  /* ---- 飞头的移动（直线飘，不管墙；mapId 给出时不肯钻进铺刺的地方） ---- */
  const SAFE = { village: null, field: null };
  function isSafe(map, x, y) {
    if (map === 'village' && x >= 16 && x <= 21 && y >= 8 && y <= 12) return true;   // 通嫂家的刺篱笆里头
    const s = SAFE[map]; return !!(s && s.has(x + ',' + y));
  }
  function fly(e, tx, ty, spd, dt, map) {
    const dx = tx * 16 - e.px, dy = ty * 16 - e.py, L = Math.hypot(dx, dy), st = spd * 16 * dt;
    if (L <= st) { e.px = tx * 16; e.py = ty * 16; }
    else {
      const nx = e.px + dx / L * st, ny = e.py + dy / L * st;
      if (map && isSafe(map, Math.round(nx / 16), Math.round(ny / 16)) && !isSafe(map, Math.round(e.px / 16), Math.round(e.py / 16))) return 'blocked';
      e.px = nx; e.py = ny;
    }
    if (Math.abs(dx) > 2) e.dir = dx < 0 ? 1 : 2;
    e.x = Math.round(e.px / 16); e.y = Math.round(e.py / 16);
    return L <= st;
  }
  async function flyTo(S, id, tx, ty, spd) { const e = S.ent(id); for (let i = 0; i < 500; i++) { if (fly(e, tx, ty, spd, 1 / 30) === true) break; await S.wait(33); } }
  const headOf = S => S.map === 'village' ? S.ent('kv') : S.map === 'field' ? S.ent('kf') : null;
  const nearestWp = (L, e) => { let b = 0, bd = 1e9; L.forEach((w, i) => { const d = Math.hypot(w[0] * 16 - e.px, w[1] * 16 - e.py); if (d < bd) { bd = d; b = i; } }); return b; };
  function placeFar(S) {
    const e = headOf(S); if (!e) return;
    const L = WP[S.map], P = S.pl; let b = 0, bd = -1;
    L.forEach((w, i) => { const d = Math.hypot(w[0] * 16 - P.px, w[1] * 16 - P.py); if (d > bd) { bd = d; b = i; } });
    e.px = L[b][0] * 16; e.py = L[b][1] * 16; e.x = L[b][0]; e.y = L[b][1]; e.hidden = false; e.alpha = 1; e.s.mad = false;
    HEAD.wp = (b + 1) % L.length; HEAD.st = 'patrol'; HEAD.t = 0; HEAD.noise = null;
  }
  function resetHead(S) { HEAD.st = 'patrol'; HEAD.t = 0; HEAD.noise = null; HEAD.hum = 1; for (const id of ['kv', 'kf']) { const e = S.ent(id); if (e) { e.s.mad = false; e.hidden = false; } } placeFar(S); }

  /* 每帧：夜里飞头巡游、发现、追 */
  function nightTick(S, dt) {
    if (S.busy) return;
    const e = headOf(S); if (!e || e.hidden || e.s.park) return;
    const P = S.pl, map = S.map, L = WP[map];
    const d = Math.hypot(e.px - P.px, e.py - P.py) / 16;
    const safe = P.hidden || isSafe(map, Math.round(P.px / 16), Math.round(P.py / 16));
    HEAD.hum -= dt; if (HEAD.hum <= 0) { HEAD.hum = 2.4; const v = .1 * (1 - d / 13); if (v > .006) hum(S, v); }
    HEAD.t += dt;
    switch (HEAD.st) {
      case 'patrol': { const w = L[HEAD.wp % L.length]; if (fly(e, w[0], w[1], 1.7, dt) === true) HEAD.wp = (HEAD.wp + 1) % L.length; break; }
      case 'noise': { if (fly(e, HEAD.noise[0], HEAD.noise[1], 2.6, dt, map)) { HEAD.st = 'hover'; HEAD.t = 0; } break; }
      case 'hover': if (HEAD.t > 2.2) { HEAD.st = 'patrol'; HEAD.wp = nearestWp(L, e); } break;
      case 'alert': if (HEAD.t > .85) { HEAD.st = 'chase'; HEAD.t = 0; } break;
      case 'chase': {
        const r = fly(e, P.px / 16, P.py / 16, 3.7, dt, map);
        if (r === 'blocked' || safe || d > 7.5 || HEAD.t > 7) {
          HEAD.st = 'lost'; HEAD.t = 0; e.s.mad = false;
          if (safe && d < 5) { S.bubble(e.id, '…', 1400); S.tone('sine', 900, 500, .5, .05, 0, 1800); }
        }
        break;
      }
      case 'lost': if (HEAD.t > 1.8) { HEAD.st = 'patrol'; HEAD.wp = nearestWp(L, e); } break;
    }
    nudge(S);
    if (safe) { if (!P.hidden && S.once('safeTip')) S.toast('站在刺枝上——她不敢钻过来'); return; }
    if ((HEAD.st === 'chase' || HEAD.st === 'alert') && d < .7) { S.run(caught); return; }
    if (HEAD.st === 'patrol' || HEAD.st === 'noise' || HEAD.st === 'hover') {
      if (d < 1.6 || (S.moving && d < 3.2) || (S.running && d < 4.6)) {
        HEAD.st = 'alert'; HEAD.t = 0; e.s.mad = true; S.bubble(e.id, '!', 900); screech(S); S.fx('red'); S.shake(300, 1);
        if (!HEAD.warned) { HEAD.warned = true; S.toast('她发现你了！快跑远，或者站到铺着刺枝的地上！'); }
      }
    }
  }
  /* 卡住了：按剩下的时间逐级给提示（只弹小字，不打断） */
  function nudge(S) {
    const L = S.timerLeft, f = S.f; if (L == null) return;
    if (L < 185 && !f.l_LA && !f.l_LD) { if (S.once('nd1')) S.toast('提示：村子北边、西北边，有几家晾着没收的衣服'); }
    else if (L < 135 && !f._v_field) { if (S.once('nd2')) S.toast('提示：衣服上的印子都是从北边来的——去田里（村子北头）'); }
    else if (L < 100 && f._v_field && !f.l_sc) { if (S.once('nd3')) S.toast('提示：田当中的稻草人身上，也挂着一件衣服'); }
    else if (L < 60) { if (S.once('nd4')) S.toast('提示：田东头，坎家的谷仓'); }
  }
  function noise(S) { HEAD.noise = [S.pl.x, S.pl.y]; if (HEAD.st !== 'chase' && HEAD.st !== 'alert') { HEAD.st = 'noise'; HEAD.t = 0; } }

  async function caught(S) {
    if (HEAD.st === 'dead') return; HEAD.st = 'dead';
    LEFT = S.timerLeft; FAILS.c++;
    S.clearTimer();
    await S.scare('face', { face: 'krasue', sfx: 'scream' });
    await S.die('绿光一下子扑到了你脸上。\n冰凉的长头发缠上来，一圈，又一圈。底下那道湿漉漉的、发着光的长影，贴上了你的胸口。\n你最后听见的，是一声很轻很轻的叹气。', '她找到你了');
  }
  async function dawnFail(S) {
    LEFT = 0; FAILS.t++; HEAD.st = 'dead';
    rooster(S);
    await S.narr('远处，第一声鸡叫。');
    await S.die('天边泛白的时候，一团绿光从你头顶掠过，往田里去了。\n它回到了自己的身子里。明天夜里，它还会再来。\n通嫂家屋底下的刺枝，还能挡几夜呢？', '鸡叫了');
  }
  function startDawn(S, sec) { S.timer(sec, '离天亮', dawnFail, { during: true }); }

  /* ---- 线索提示：外婆（夜里在通嫂家）和找错地方后的自言自语 ---- */
  const HINTS = [
    ['顺着晾在外面的衣服找。印子从哪头抹过来，它就是从哪头来的。', '干干净净的那几家，它没去过。'],
    ['村里衣服上的印子，都是从北边抹过来的——它是从田里来的。', '田当中有个稻草人，你去看看它身上那件衣裳。'],
    ['它的身子怕狗、怕猪、怕太阳，得藏在有门、关得严的地方。草垛、四面透风的棚子，都藏不住。', '……坎家的阿芬，这阵子太阳一落山，就往哪儿跑？'],
    ['田的东头，坎家的谷仓。', '去吧。不管看见什么，先别慌。']
  ];
  const THINK = [
    '……不能瞎翻。外婆说过，先看晾着的衣服——印子从哪头抹过来，它就是从哪头来的。',
    '村里的印子都是从北边来的……它是从田里飞过来的。田里那个稻草人身上，也晾着件衣服。',
    '身子得藏在有门、关得严、太阳照不进的地方。田东边……坎婶说，阿芬天天傍晚往自家谷仓跑。',
    '是谷仓。田东头，坎家的谷仓！'
  ];
  async function missHint(S) { const lv = Math.min(3, (S.f.miss || 1) - 1); S.f.hint = Math.max(S.f.hint || 0, lv); await S.think(THINK[lv]); }

  const SEARCH = {
    shedV: ['村头的空牛棚', '你钻进牛棚，扒开发霉的稻草——一窝老鼠吱吱叫着四散逃开。\n没有。'],
    underF: ['阿芬家的屋底下', '你趴在阿芬家屋底下，摸过织布机、竹篮、腌鱼的坛子……\n没有。只有一只癞蛤蟆，鼓着眼睛看你。'],
    hay: ['草垛', '你把手伸进草垛里，一把一把地往外掏。草屑扎得脖子发痒。\n没有。'],
    barn2: ['本伯家的谷仓', '你拔下木销钻进去，在谷堆里摸了一圈……\n没有。只有几只老鼠吱吱地逃开。'],
    shedC: ['甘蔗棚', '甘蔗棚四面透风，月光照得一清二楚。棚里只有几把锄头和一堆干甘蔗叶。\n没有。']
  };
  async function search(S, k) {
    const [place, txt] = SEARCH[k];
    if (S.f['s_' + k]) return S.narr(place + '，已经找过了。');
    const r = await S.ask(`要钻进${place}翻一翻吗？（会弄出响动，也耽误工夫）`, ['翻', '不翻']);
    if (r) return;
    S.f['s_' + k] = true;
    S.sfx('thud'); S.shake(250, 1);
    await S.narr(txt);
    S.timerAdd(-PEN); S.toast(`耽误了工夫（离天亮少了 ${PEN} 秒）`);
    noise(S);
    S.f.miss = (S.f.miss || 0) + 1;
    await missHint(S);
    S.toast('响动把绿光引过来了——快离开这儿！');
  }

  /* ---- 惊吓大头像（32×32） ---- */
  const HAIR = '#060404';
  function trail(R, x0, y0, n, t, a = 1) {   // 脸底下那道「发光的长影」：只画成一缕缕发光的东西
    for (let i = 0; i < n; i++) {
      const sw = Math.round(Math.sin(t * 3 + i * .45) * 1.2), w = Math.max(1, 6 - (i >> 2));
      R(x0 - (w >> 1) + sw, y0 + i, w, 1, i % 2 ? `rgba(200,70,64,${.5 * a})` : `rgba(120,255,150,${.4 * a})`);
      if (i % 3 === 0) R(x0 + sw + 3, y0 + i, 1, 2, `rgba(150,255,170,${.3 * a})`);
    }
  }
  const FACES = {
    /* 正脸：绿光里的女人头，湿发贴脸，红嘴一点点张开；下巴底下垂着发光的长影 */
    krasue(R, a, t) {
      R(0, 0, 32, 32, '#020604');
      R(3, 0, 26, 26, 'rgba(90,255,140,.08)'); R(6, 2, 20, 20, 'rgba(110,255,150,.1)');
      R(7, 0, 18, 6, HAIR); R(5, 3, 4, 24, HAIR); R(23, 3, 4, 24, HAIR); R(3, 10, 2, 20, HAIR); R(27, 10, 2, 20, HAIR); R(1, 18, 2, 12, HAIR); R(29, 18, 2, 12, HAIR);
      for (const x of [4, 6, 25, 28]) R(x, 8 + (x % 3) * 3, 1, 18, '#1c2a20');
      R(10, 5, 12, 15, '#c4d2ba'); R(11, 20, 10, 2, '#c4d2ba'); R(13, 22, 6, 1, '#aebca4'); R(19, 6, 3, 14, '#a4b29a');
      R(10, 5, 12, 3, HAIR); R(10, 8, 2, 8, HAIR); R(15, 5, 1, 6, HAIR); R(21, 8, 1, 9, HAIR);
      R(12, 10, 3, 2, '#eef4e6'); R(17, 10, 3, 2, '#eef4e6'); R(13, 10, 1, 2, '#080808'); R(18, 10, 1, 2, '#080808');
      R(14, 10, 1, 1, '#7aff9a'); R(19, 10, 1, 1, '#7aff9a'); R(12, 12, 3, 1, '#7c8c76'); R(17, 12, 3, 1, '#7c8c76');
      const o = Math.round(Math.min(1, a * 1.4) * 3);
      R(13, 16, 6, 1, '#8a1010'); R(14, 17, 4, o, '#1a0404'); R(13, 17 + o, 6, 1, '#760c0c'); R(11, 17, 2, 1, '#5e0e0e'); R(19, 18 + o, 2, 1, '#5e0e0e');
      trail(R, 16, 23, 9, t, .6 + a * .4);
    },
    /* 窗缝外：木板缝里先是绿光，然后头发，然后一只眼睛 */
    krasue2(R, a, t) {
      R(0, 0, 32, 32, '#140c08');
      const k = Math.min(1, a * 1.6), y0 = Math.round(26 - k * 18);
      R(6, 0, 20, 32, '#06100a'); R(6, 0, 20, 32, `rgba(110,255,150,${.12 + k * .12})`);
      R(8, y0, 16, 7, HAIR); R(7, y0 + 3, 3, 14, HAIR); R(22, y0 + 3, 3, 14, HAIR);
      R(10, y0 + 4, 12, 12, '#c4d2ba'); R(10, y0 + 4, 12, 3, HAIR); R(10, y0 + 7, 2, 7, HAIR); R(20, y0 + 7, 2, 8, HAIR);
      R(12, y0 + 9, 3, 2, '#eef4e6'); R(17, y0 + 9, 3, 2, '#eef4e6'); R(13, y0 + 9, 1, 2, '#080808'); R(18, y0 + 9, 1, 2, '#080808');
      R(13, y0 + 14, 6, 1, '#8a1010');
      trail(R, 16, y0 + 17, 12, t, .7);
      R(0, 0, 7, 32, '#4a3220'); R(25, 0, 7, 32, '#4a3220'); R(5, 0, 2, 32, '#2a1a10'); R(25, 0, 2, 32, '#2a1a10');   // 两扇窗板夹着
      for (let y = 3; y < 32; y += 7) { R(0, y, 7, 1, '#3a2616'); R(25, y, 7, 1, '#3a2616'); }
    }
  };

  /* ---- 常用小画 ---- */
  function bramble(R, X, Y, k, col) {   // 一团刺枝：交错的枝条加尖刺
    for (let i = 0; i < k; i++) {
      const h = hash(X, Y, i + 40), x = (h * 14) | 0, y = (hash(Y, X, i + 41) * 14) | 0, L = 5 + ((hash(X + i, Y, 42) * 6) | 0);
      const c = i % 2 ? col : shade(col, -.25);
      if (i % 3) { R(x - 2, y, L, 1, c); R(x, y - 1, 1, 1, '#d8c8a0'); R(x + 3, y + 1, 1, 1, '#d8c8a0'); }
      else { R(x, y - 2, 1, L, c); R(x - 1, y, 1, 1, '#d8c8a0'); R(x + 1, y + 3, 1, 1, '#d8c8a0'); }
    }
  }
  function ground(R, X, Y) { TILE.dirt.paint(R, X, Y); }
  const FON = { skin: '#dcc2a2', hair: '#100a0c', hs: 'long', top: '#ece6d8', top2: '#d4ccbc', bottom: '#2a5a5a', skirt: true, shoes: '#dcc2a2', mouth: '#b02424' };
  const ankletP = (R, d, G) => { if (d === 0 || d === 3) { R(5, G.lB, 2, 1, '#e8e8f0'); R(9, G.lB, 2, 1, '#e8e8f0'); } else R(6, G.lB, 3, 1, '#e8e8f0'); };
  const hem = (R, d, G) => { if (d !== 3) R(3, G.tB + 2, 10, 1, '#c8a040'); };   // 筒裙的金边

  defChapter({
    id: 'krasue', n: 23, title: '飞头', sub: '夜里，一颗女人的头拖着发光的长影飞出来，找血。她的身子，就藏在村里。', origin: '泰国 / 东南亚民间传说', color: '#1f3a28',
    amb: 'night', floor: 'dirt', wall: 'wood', dark: .4, plr: 4,
    faces: FACES,
    endings: { home: '回家的路', thorn: '刺篱笆', seen: '她看见你了' },
    people: {
      me: { skin: '#c08a5e', hair: '#141010', hs: 'short', top: '#e4e0d4', top2: '#c8c4b8', bottom: '#2a3a5a', shoes: '#4a3a2a' },
      yai: { key: 'kr-yai', skin: '#a8784e', hair: '#cac8c0', hs: 'short', top: '#ece8dc', top2: '#d6d0c0', bottom: '#4a3858', skirt: true, shoes: '#6a4a2a', mouth: '#8a2a1a',
        extra(g, d, fr, G, R) { if (d === 0) { R(4, G.tT + 1, 8, 1, '#7a5a8a'); R(10, G.tT + 2, 2, 4, '#7a5a8a'); } } },   // 斜挎的布巾
      fonU: Object.assign({ key: 'kr-fonu', extra(g, d, fr, G, R) {
        ankletP(R, d, G); hem(R, d, G);
        R(d === 1 ? 2 : 13, 1, 1, G.tT + 2, '#5a3a22');   // 撑着一把旧油纸伞
        R(0, 0, 16, 1, '#a04a34'); R(0, 1, 16, 1, '#8a3a2a'); R(0, 2, 1, 1, '#8a3a2a'); R(15, 2, 1, 1, '#8a3a2a');
      } }, FON),
      fon: Object.assign({ key: 'kr-fon', extra(g, d, fr, G, R) { ankletP(R, d, G); hem(R, d, G); } }, FON),
      fonC: Object.assign({ key: 'kr-fonc', extra(g, d, fr, G, R) {   // 裹着外婆的白布
        ankletP(R, d, G); R(2, G.tT, 12, G.tB - G.tT + 3, '#f2f0e6'); R(2, G.tT, 12, 1, '#ffffff'); if (d === 0) { R(6, G.tT + 1, 1, 8, '#d8d4c8'); R(10, G.tT + 2, 1, 7, '#d8d4c8'); }
      } }, FON),
      kham: { key: 'kr-kham', skin: '#b08060', hair: '#1a1414', hs: 'bun', top: '#7a4a5a', top2: '#5a3444', bottom: '#3a3040', skirt: true, shoes: '#8a6044',
        extra(g, d, fr, G, R) { if (d === 3 || d === 0) { R(1, G.tT + 2, 3, 6, '#c8c0b0'); R(12, G.tT + 2, 3, 6, '#8a7aa0'); } } },   // 抱着收下来的衣服
      ben: { key: 'kr-ben', skin: '#9a6a44', hair: '#d8d8d0', hs: 'bald', top: '#5a6a7a', top2: '#4a5a6a', bottom: '#3a3a4a', shoes: '#6a4a2a',
        extra(g, d, fr, G, R) { R(4, G.tB - 1, 8, 2, '#a83a3a'); R(5, G.tB - 1, 1, 2, '#e0d0b0'); R(8, G.tB - 1, 1, 2, '#e0d0b0'); if (d === 0) { R(11, G.hT + 6, 3, 1, '#d8d0b8'); R(14, G.hT + 5, 1, 1, '#ff8a3a'); } } },   // 腰上的格子水布、嘴里的土烟卷
      tong: { key: 'kr-tong', skin: '#a07048', hair: '#1a1414', hs: 'short', top: '#3a4a3a', top2: '#2a3a2a', bottom: '#2a2a3a', shoes: '#6a4a2a',
        extra(g, d, fr, G, R) { if (d === 1 || d === 0) { R(1, G.tT + 4, 1, 6, '#8a8a90'); R(1, G.tT + 9, 2, 2, '#5a3a22'); } } }   // 砍刀
    },
    items: {
      thornb: { name: '刺竹枝', desc: '一捆刚砍下来的刺竹枝，节上全是倒钩一样的硬刺。拿的时候得捏着光滑的那一头。' },
      yao: { name: '草药包', desc: '外婆熬好晾干的草药，用芭蕉叶包着，说是补血的。' },
      thornb2: { name: '一捆刺枝', desc: '外婆塞给你的刺枝。用它在身子四周围一圈，头就回不去了。' },
      cloth: { name: '白布', desc: '外婆接生时包孩子用的白布，洗得发软，有一股太阳晒过的味道。' },
      betel: { name: '槟榔盒', desc: '蓝婆床底下的小铜盒，盖子上錾着花，里头还有几片干透了的槟榔。拿在手里，凉得出奇。' }
    },
    notes: {
      yai: { title: '外婆的接生簿', text: '（一本翻卷了边的旧账本。前面记着谁家几月几日生了孩子、男孩女孩；后面夹着外婆自己记的几条）\n\n· 产妇「躺火」，炭火要烧足日子。屋底下铺满刺枝，一处也不能漏。\n· 胞衣装罐，埋得深，上面压刺。\n· 夜里不晾衣服。田那边亮绿光的晚上，不出门。\n\n（再往后翻，是十八年前的一页）\n坎家，阿芬，四月，女孩。脐带绕颈一圈，哭得晚，后来哭得很响。\n\n（旁边，后来添的小字）\n蓝婆走那年，是小芬端的水。\n……唉。' },
      lam: { title: '墙上的炭字', text: '（蓝婆屋里的土墙上，用木炭写着几行字。字写得很大、很用力，像是不常写字的人写的）\n\n我不是自己要的\n是我娘给我的\n她走的时候喂了我一口\n\n我一辈子没有嫁人\n天黑就关门\n刺枝铺了一圈又一圈\n\n我走的时候\n千万别有人来\n\n（最下面一行，字小了很多）\n小芬来了。小芬给我端了水。\n别来。' },
      fon: { title: '阿芬的练习本', text: '（草席边上的一个小学练习本，最后几页）\n\n三月九日\n又在谷仓里醒来。嘴里是腥的，脚底全是泥。\n\n三月二十日\n梦见自己飞在田上面，很轻，很饿。底下每一户人家的灯，我都认得。\n\n四月十六日\n从通嫂家门口走过，闻见那个味道，口水止不住地往下流。我用冷水洗了很久的脸。\n\n蓝婆走的那晚，往我嘴里塞了一口她嚼过的槟榔。她说：给你，都给你。对不起。我那时才十岁。\n\n今天\n我把自己关进谷仓，门从里面系上了。我不想去通嫂家。\n要是有人找到这儿——别让我回去。\n（这一行被划掉了。下面又写了一行，字歪歪扭扭的）\n让我回去吧。我想看见早上。' }
    },
    legend: '「กระสือ」（Krasue，常译作飞头鬼）是泰国最有名的鬼怪之一，柬埔寨（叫 Ap）、老挝、马来半岛也有很相近的说法。流传最广的样子是：一颗女人的头，在夜里离开身子飞出去，脖子底下拖着心肺肠子（本作只画成一道发光的长影）；乡下人说，夜里在田野上飘忽不定的鬼火，就是她。白天，她和普通女人一样，只是常被说成脸色苍白、怕晒、贪睡。\n\n民间的说法里，她夜里找血和生肉吃，最爱刚生过孩子的人家——旧时泰国妇女产后要在屋里「躺火」（อยู่ไฟ，靠炭火烘烤休养一段日子），家里人会在高脚屋底下铺满带刺的枝条，据说她拖着的内脏一钻就会被刺挂住；晾在外面过夜的衣服，第二天会留下血印，是她飞过时拿来擦了嘴，所以老人叮嘱天黑前收衣服。她的身子留在暗处，若被人藏起、挪走或围住，头在天亮前回不去，她就会死。至于这份诅咒从哪来，说法很多：有的说是老飞头临死时，谁接了她嘴里的唾沫或吃食，谁就继承了她；有一种来历故事说，她原是一位高棉公主，被处火刑时用了黑巫术，只有头和内脏逃了出去——这些都查无实据。她还有一个男性的同类「กระหัง」（Krahang），据说拿两只簸箕当翅膀飞。\n\n飞头从 1970 年代起就不断被拍成泰国电影，2019 年的《แสงกระสือ》（英文名 Inhuman Kiss）把她拍成一个悲伤的少女，还被选送参加奥斯卡国际影片的评选。在东南亚的乡村，飞头至今是孩子们夜里最怕听的故事，也是大人吓唬孩子「别在外面晾衣服」「天黑早点回家」的说辞。\n\n（本章的班农莱村、阿派、外婆、阿芬、坎婶、本伯、通哥通嫂、蓝婆都是虚构的；「顺着衣服上的印子找她从哪来」、身子必须藏在「有门、关得严」的地方、田里的谷仓、蓝婆墙上的字、白布、槟榔盒，以及三个结局，均为游戏虚构或简化。）',
    start: { map: 'village', x: 19, y: 25, dir: 3 },
    thumb(g, w, h) {   // 夜里的田、糖棕树的剪影、一颗拖着长影的绿光人头、近处的刺枝
      const R = (x, y, ww, hh, c) => { g.fillStyle = c; g.fillRect(x, y, ww, hh); };
      R(0, h - 40, w, 18, '#08100a');
      for (const x of [14, 136]) { R(x, h - 72, 2, 34, '#040705'); R(x - 7, h - 78, 16, 6, '#040705'); R(x - 4, h - 81, 10, 3, '#040705'); R(x - 9, h - 75, 3, 3, '#040705'); R(x + 8, h - 75, 3, 3, '#040705'); }
      const cx = 86, cy = 26;
      R(cx - 24, cy - 18, 48, 44, 'rgba(110,255,150,.06)'); R(cx - 16, cy - 12, 32, 32, 'rgba(110,255,150,.09)'); R(cx - 10, cy - 8, 20, 20, 'rgba(140,255,170,.12)');
      R(cx - 7, cy - 9, 14, 6, HAIR); R(cx - 9, cy - 5, 3, 16, HAIR); R(cx + 6, cy - 5, 3, 16, HAIR); R(cx + 9, cy - 3, 6, 2, HAIR); R(cx + 13, cy - 1, 5, 2, HAIR);
      R(cx - 6, cy - 4, 12, 12, '#c4d2ba'); R(cx - 6, cy - 4, 12, 3, HAIR); R(cx - 6, cy - 1, 2, 6, HAIR);
      R(cx - 4, cy + 1, 3, 1, '#080808'); R(cx + 1, cy + 1, 3, 1, '#080808'); R(cx - 3, cy + 1, 1, 1, '#7aff9a'); R(cx + 2, cy + 1, 1, 1, '#7aff9a');
      R(cx - 2, cy + 5, 4, 1, '#9a1414');
      for (let i = 0; i < 30; i++) { const sw = Math.round(Math.sin(i * .5) * 2), ww = Math.max(1, 5 - (i >> 3)); R(cx - (ww >> 1) + sw, cy + 9 + i, ww, 1, i % 2 ? 'rgba(200,70,64,.55)' : 'rgba(120,255,150,.45)'); }
      for (let x = -2; x < w; x += 5) { const y = h - 25 - ((x * 7) % 4); R(x, y, 7, 1, '#2a1a10'); R(x + 2, y - 1, 1, 1, '#c8b890'); R(x + 5, y + 1, 1, 1, '#c8b890'); }
    },
    async intro(S) {
      FAILS.c = FAILS.t = FAILS.s = 0; LEFT = null; NIGHT_SEEN = false; HEAD.warned = false;
      await S.card('第二十三夜　飞头', '1983年4月　泰国东北部　伊桑高原上的一个村子', '四月是一年里最热的时候。稻子早收完了，田里只剩下晒裂的土。泼水节刚过，学校放了假，妈妈把我送上了回乡下的长途车。\n\n外婆是村里的接生婆。\n村里一半的人，都是她亲手接到这个世上来的。');
    },
    resume: {
      night: async S => {
        resetHead(S);
        const t = LEFT == null ? T_FULL : Math.max(LEFT, T_FLOOR); LEFT = null;
        startDawn(S, Math.min(T_FULL, t));
        await deathTip(S);
      },
      field: async S => {
        resetHead(S);
        const base = S.f.tf || T_FULL, t = LEFT == null ? base : Math.min(base, Math.max(LEFT, T_FLOOR_F)); LEFT = null;
        startDawn(S, t);
        await deathTip(S);
      },
      body: async S => {
        resetG(S); S.f.ph = 'body';
        if (FAILS.s) await S.think(['……她闻得见血腥味。我手上有伤。', '躲进米缸后面，米味能盖住我。躲好了，就一下也别动。']);
        else await S.think('……阿芬还在那儿坐着。我得拿个主意。');
      }
    },
    tick(S, dt) {
      const ph = S.f.ph;
      if (ph === 'night') nightTick(S, dt);
      else if (ph === 'wait0' || ph === 'wait') granTick(S, dt);
    },
    tiles: {
      thornX: { solid: true, paint(R, X, Y) { ground(R, X, Y); R(0, 11, 16, 4, 'rgba(0,0,0,.3)'); R(0, 3, 16, 10, '#3a2a18'); bramble(R, X, Y, 9, '#6a4a2a'); R(0, 3, 16, 1, '#4e3822'); } },
      thornZ: { solid: false, paint(R, X, Y) { ground(R, X, Y); R(0, 0, 16, 16, 'rgba(40,24,10,.25)'); bramble(R, X, Y, 7, '#a8946c'); R(0, 0, 16, 1, 'rgba(230,220,190,.18)'); R(0, 15, 16, 1, 'rgba(0,0,0,.3)'); } },
      bamboo: { solid: true, paint(R, X, Y) {
        TILE.grass.paint(R, X, Y, { grassC: '#2a3320' });
        for (let i = 0; i < 5; i++) { const x = 1 + ((hash(X, Y, i + 5) * 13) | 0); R(x, 0, 2, 16, i % 2 ? '#5a7a3a' : '#4a6a30'); R(x, 4 + i, 2, 1, '#2a3a1a'); R(x, 11 - i, 2, 1, '#2a3a1a'); R(x + 2, 6 + i, 2, 1, '#c8c0a0'); R(x - 1, 9 - i, 1, 1, '#c8c0a0'); }
        R(0, 0, 16, 3, 'rgba(30,50,24,.7)');
      } },
      banana: { solid: true, paint(R, X, Y) {
        TILE.grass.paint(R, X, Y, { grassC: '#2a3320' });
        const s = (hash(X, Y, 7) * 4) | 0;
        R(7, 9, 2, 7, '#4a5a2a'); R(1 + s, 2, 8, 4, '#3a6a2a'); R(7, 1, 8, 5, '#2f5a24'); R(0, 6, 7, 3, '#2a5020'); R(9, 6, 7, 3, '#356428');
        R(2 + s, 3, 6, 1, '#4f7f36'); R(8, 2, 6, 1, '#4f7f36'); if (hash(X, Y, 8) < .4) R(11, 8, 4, 2, '#6a5a2a');
      } },
      paddy: { solid: false, paint(R, X, Y) {
        R(0, 0, 16, 16, '#4a3c28'); for (let i = 0; i < 6; i++) R(((hash(X, Y, i) * 15) | 0), ((hash(Y, X, i) * 15) | 0), 3, 1, '#3a2e1e');
        for (let y = 2; y < 16; y += 5) for (let x = (Y % 2) * 2 + 1; x < 16; x += 4) { R(x, y, 1, 2, '#7a6a40'); R(x + 1, y, 1, 1, '#8a7a4a'); }
        if (hash(X, Y, 9) < .2) { R(2, 8, 6, 1, '#2a2014'); R(7, 9, 4, 1, '#2a2014'); }   // 晒裂的缝
      } },
      cane: { solid: true, paint(R, X, Y) {
        R(0, 0, 16, 16, '#24301a');
        for (let i = 0; i < 6; i++) { const x = (i * 3 + ((hash(X, Y, i) * 2) | 0)) % 16; R(x, 0, 1, 16, i % 2 ? '#6a7a3a' : '#5a6a30'); R(x, 5 + i, 1, 1, '#3a4220'); R(x - 1, (i * 5) % 14, 3, 1, '#4a6a2a'); }
      } },
      heap: { solid: true, paint(R, X, Y) { R(0, 0, 16, 16, '#3a2a1c'); R(1, 3, 14, 13, '#b8a670'); R(3, 1, 10, 3, '#c8b680'); for (let i = 0; i < 9; i++) R(((hash(X, Y, i) * 13) | 0) + 1, ((hash(Y, X, i) * 11) | 0) + 3, 1, 1, '#d8c890'); R(1, 14, 14, 2, '#8a7a4a'); } }
    },
    sprites: {
      /* 高脚屋（4×2）：上一行是屋身，下一行是柱脚和屋底 */
      stilt(g, e, t, R) {
        const rf = e.col || '#5a4a30', wd = e.wc || '#6a4a2c';
        R(0, 16, 64, 15, 'rgba(8,6,4,.6)');
        for (let i = 0; i < 5; i++) { R(2 + i * 14, 14, 3, 17, '#3a2818'); R(2 + i * 14, 14, 1, 17, '#4e3622'); }
        if (e.thorny) for (let i = 0; i < 6; i++) { R(4 + i * 10, 26 + (i % 2), 9, 1, '#7a5a3a'); R(6 + i * 10, 25, 1, 1, '#d8c8a0'); R(9 + i * 10, 27 + (i % 2), 1, 1, '#d8c8a0'); }
        R(0, 12, 64, 4, '#4a3220'); R(0, 12, 64, 1, '#6a4a2c');
        R(2, -10, 60, 22, wd); for (let x = 2; x < 62; x += 6) R(x, -10, 1, 22, shade(wd, -.25)); R(2, -10, 60, 1, shade(wd, .2));
        const wl = e.lit === 'fire' ? '#d8663a' : e.lit ? '#e0b060' : '#120c08';
        R(9, -5, 11, 9, '#3a2616'); R(10, -4, 9, 7, wl); R(44, -5, 11, 9, '#3a2616'); R(45, -4, 9, 7, wl);
        if (e.lit) { R(14, -4, 1, 7, '#3a2616'); R(49, -4, 1, 7, '#3a2616'); }
        if (e.lit === 'fire') { const f = Math.sin(t * 7) > 0 ? .5 : .3; R(4, 13, 56, 2, `rgba(255,110,50,${f})`); }   // 地板缝里漏下来的炭火光
        R(28, -6, 9, 18, '#1a100a'); R(27, -6, 1, 18, '#3a2616'); R(37, -6, 1, 18, '#3a2616');
        for (let i = 0; i < 22; i++) { const ins = Math.max(0, 11 - ((i * .55) | 0)); R(-2 + ins, -32 + i, 68 - ins * 2, 1, i % 3 === 0 ? shade(rf, -.22) : rf); }
        R(-2, -11, 68, 2, 'rgba(0,0,0,.4)');
        R(8, -37, 2, 6, '#3a2818'); R(6, -38, 2, 2, '#3a2818'); R(54, -37, 2, 6, '#3a2818'); R(56, -38, 2, 2, '#3a2818');
      },
      ladder(g, e, t, R) { R(3, -12, 2, 27, '#4a3220'); R(11, -12, 2, 27, '#4a3220'); for (let y = -9; y < 14; y += 5) R(3, y, 10, 2, '#6a4a2c'); R(2, 13, 12, 2, 'rgba(0,0,0,.3)'); },
      /* 晾衣绳（3 格宽）：夜里被擦过嘴的那件有一道深色的印子 */
      line(g, e, t, R) {
        R(1, -12, 2, 26, '#5a4028'); R(45, -12, 2, 26, '#5a4028'); R(0, 13, 4, 2, 'rgba(0,0,0,.3)'); R(44, 13, 4, 2, 'rgba(0,0,0,.3)');
        R(2, -10, 44, 1, '#b8ae98');
        const C = e.cols || ['#8a3a4a', '#d8d0c0', '#3a5a7a'], sw = Math.round(Math.sin(t * 1.4 + e.px * .1));
        const G = [[5, 9, 14], [19, 10, 10], [33, 9, 12]];
        G.forEach(([x, w, h], i) => {
          const c = C[i], xx = x + (i === 1 ? -sw : sw);
          R(xx, -10, w, h, c); R(xx, -10, w, 1, shade(c, .2)); R(xx + w - 1, -9, 1, h - 1, shade(c, -.25));
          if (i === 0) for (let y = -6; y < h - 10; y += 3) R(xx, y, w, 1, shade(c, -.18));
          if (i === 1) { R(xx - 2, -9, 2, 4, c); R(xx + w, -9, 2, 4, c); R(xx + 4, -9, 2, 2, shade(c, -.2)); }
          if (i === 2) { for (let k = 0; k < w; k += 3) R(xx + k, -10, 1, h, shade(c, -.2)); R(xx, -5, w, 1, shade(c, .15)); }
          if (e.blood && (e.sk ?? 0) === i) { for (let k = 0; k < 8; k++) R(xx + (e.rev ? w - 2 - k : k), -7 + (k >> 1), 2, k < 5 ? 2 : 1, k < 5 ? 'rgba(86,18,12,.9)' : 'rgba(86,18,12,.55)'); }
        });
      },
      /* 屋檐下的空当：地上几点深色的印子；铺上之后是一堆刺枝 */
      gap(g, e, t, R) {
        if (e.done) {
          R(1, 9, 14, 6, 'rgba(0,0,0,.3)'); for (let i = 0; i < 6; i++) { R(1 + i * 2, 6 + (i % 3), 10, 1, i % 2 ? '#7a5a3a' : '#5a3e22'); R(3 + i * 2, 5 + (i % 3), 1, 1, '#d8c8a0'); R(8 + i, 8 + (i % 2), 1, 1, '#d8c8a0'); }
          if (e.glint) { const a = .35 + Math.sin(t * 2 + e.px) * .15; R(4, 4, 1, 6, `rgba(120,255,150,${a})`); R(9, 6, 1, 5, `rgba(210,80,70,${a})`); R(12, 5, 1, 4, `rgba(120,255,150,${a})`); }   // 刺上挂着的几缕发光的丝
          return;
        }
        R(4, 8, 3, 2, '#3a1a12'); R(9, 11, 2, 2, '#3a1a12'); R(7, 5, 2, 1, '#3a1a12');
        if (Math.sin(t * 3 + e.px) > .3) R(7, 1, 2, 2, 'rgba(255,200,120,.55)');
      },
      thornpile(g, e, t, R) { R(0, 11, 16, 4, 'rgba(0,0,0,.35)'); for (let i = 0; i < 7; i++) { R(0, 4 + i, 16, 1, i % 2 ? '#6a7a3a' : '#5a5a30'); R(2 + i * 2, 3 + i, 1, 1, '#d8c8a0'); R(12 - i, 5 + i, 1, 1, '#d8c8a0'); } },
      cowshed(g, e, t, R) {
        R(0, 16, 48, 15, 'rgba(0,0,0,.35)');
        for (const x of [2, 22, 43]) { R(x, -2, 3, 31, '#4a3420'); R(x, -2, 1, 31, '#5e4428'); }
        R(4, 18, 40, 10, 'rgba(10,8,6,.55)'); R(6, 22, 12, 4, '#7a6a40'); R(26, 24, 10, 3, '#6a5a38');
        for (let i = 0; i < 12; i++) { const ins = Math.max(0, 6 - (i >> 1)); R(-2 + ins, -14 + i, 52 - ins * 2, 1, i % 3 ? '#8a7a4a' : '#6a5a34'); }
        R(-2, -2, 52, 2, 'rgba(0,0,0,.35)');
      },
      tamarind(g, e, t, R) {
        R(6, 0, 4, 15, '#3a2a1a'); R(5, 12, 6, 3, '#2a1c12'); R(4, 14, 9, 2, 'rgba(0,0,0,.35)');
        R(-10, -26, 36, 26, '#22341c'); R(-6, -30, 28, 6, '#22341c'); R(-12, -18, 40, 14, '#26381e');
        for (let i = 0; i < 46; i++) R(-12 + ((hash(i, 1, 33) * 38) | 0), -30 + ((hash(i, 2, 33) * 28) | 0), 3, 1, i % 3 ? '#34502a' : '#1a2814');
        for (let i = 0; i < 6; i++) R(-6 + ((hash(i, 5, 33) * 26) | 0), -6 + ((hash(i, 6, 33) * 4) | 0), 1, 4, '#6a4a2a');
      },
      palm(g, e, t, R) {   // 糖棕树：又高又直，顶上一团扇形叶子
        R(7, -40, 3, 55, '#3a2c1e'); R(7, -40, 1, 55, '#4e3c28'); for (let y = -36; y < 12; y += 6) R(7, y, 3, 1, '#2a1e14'); R(4, 13, 9, 2, 'rgba(0,0,0,.35)');
        const c = '#24361e', c2 = '#30482a';
        R(-4, -52, 26, 12, c); R(-8, -48, 6, 8, c); R(19, -48, 6, 8, c); R(0, -56, 18, 4, c); R(-10, -44, 4, 3, c); R(23, -44, 4, 3, c);
        for (let i = 0; i < 9; i++) R(-6 + i * 3, -54 + (i % 2) * 2, 1, 10, c2);
        R(4, -42, 3, 3, '#4a3a22'); R(10, -41, 3, 3, '#4a3a22');
      },
      spirit(g, e, t, R) {   // 土地神龛（屋主神的小庙）
        R(7, -2, 2, 17, '#d8d0c0'); R(4, 14, 8, 1, 'rgba(0,0,0,.4)');
        R(2, -4, 12, 2, '#c9a35a'); R(4, -12, 8, 8, '#d8b040'); R(6, -10, 4, 6, '#8a2a1a');
        R(2, -15, 12, 3, '#a8281e'); R(4, -19, 8, 4, '#a8281e'); R(7, -22, 2, 3, '#d8b040');
        R(3, -5, 2, 1, '#f0f0e0'); R(11, -5, 2, 1, '#f0f0e0'); R(5, -6, 1, 2, '#e85a8a'); R(10, -6, 1, 2, '#e8a030');
        if (!e.off) { const f = Math.sin(t * 13) > 0 ? 1 : 0; R(7, -8 + f, 1, 2 - f, '#ffcf5a'); }
      },
      coop(g, e, t, R) { R(2, 4, 12, 10, '#a07a40'); for (let x = 3; x < 14; x += 2) R(x, 4, 1, 10, '#7a5a2a'); R(2, 3, 12, 2, '#c09a58'); if (!e.open) { R(6, 9, 3, 3, '#e8e2d0'); R(8, 8, 1, 1, '#c02818'); } else { R(4, 8, 6, 6, '#1a120a'); for (let i = 0; i < 5; i++) R(((hash(i, 2, 7) * 16) | 0), 13 + (i % 3), 2, 1, '#e8e2d0'); } },
      bare(g, e, t, R) { const c = 'rgba(30,20,12,.55)'; R(3, 3, 3, 4, c); R(4, 2, 1, 1, c); R(10, 9, 3, 4, c); R(11, 8, 1, 1, c); },   // 赤脚印
      hut(g, e, t, R) {   // 蓝婆的旧屋：茅草顶塌了一半
        R(0, 14, 48, 17, 'rgba(0,0,0,.4)');
        R(2, -6, 44, 22, '#5a4a36'); for (let x = 2; x < 46; x += 5) R(x, -6, 1, 22, '#4a3a28');
        R(19, 2, 10, 14, '#0a0806'); R(29, 3, 2, 13, '#4a3a28');   // 歪着的门板
        R(6, 0, 7, 6, '#0a0806'); R(36, 0, 7, 6, '#0a0806');
        for (let i = 0; i < 14; i++) { const ins = Math.max(0, 7 - (i >> 1)); const L = 52 - ins * 2; R(-2 + ins, -20 + i, i > 6 ? L * .55 : L, 1, i % 3 ? '#6a5a3a' : '#54462c'); }
        R(28, -12, 18, 8, '#0a0806'); R(30, -14, 2, 4, '#5a4a30'); R(38, -13, 2, 4, '#5a4a30');   // 塌掉的那半边
        for (let i = 0; i < 10; i++) R(-2 + i * 5, 26 + (i % 2), 6, 1, '#9a9078');   // 一圈枯成灰白的刺枝
      },
      barn(g, e, t, R) {   // 田里的小谷仓：四根木桩架着，木板墙钉得严严实实
        R(0, 18, 32, 13, 'rgba(0,0,0,.5)'); for (const x of [2, 13, 26]) { R(x, 14, 3, 17, '#3a2818'); R(x, 14, 1, 17, '#4e3622'); }
        R(0, 12, 32, 3, '#4a3220');
        R(1, -10, 30, 22, '#6e5034'); for (let x = 1; x < 31; x += 4) R(x, -10, 1, 22, '#4e3622');
        R(12, -2, 8, 14, e.open ? '#060404' : '#5a3e26'); R(11, -2, 1, 14, '#3a2616'); R(20, -2, 1, 14, '#3a2616');
        if (e.latch) { R(9, 3, 14, 2, '#8a6a40'); R(9, 3, 14, 1, '#a8885a'); }   // 门外插着木销
        else if (!e.open) { R(15, 4, 2, 2, '#b8a878'); R(16, 6, 1, 3, '#b8a878'); }   // 门缝里露出一截草绳
        for (let i = 0; i < 18; i++) { const ins = Math.max(0, 14 - i); R(-3 + ins, -28 + i, 38 - ins * 2, 1, i % 3 ? '#7a6a40' : '#5e5030'); }
        R(14, 22, 4, 6, '#4a3220'); R(14, 24, 4, 1, '#6a4a2c');   // 木梯
      },
      hay(g, e, t, R) { R(0, 22, 32, 9, 'rgba(0,0,0,.35)'); R(2, 4, 28, 26, '#8a7440'); R(5, -2, 22, 8, '#9a8448'); R(10, -6, 12, 5, '#a48e50'); for (let i = 0; i < 24; i++) R(((hash(i, 3, 9) * 28) | 0) + 2, ((hash(i, 4, 9) * 30) | 0) - 4, 3, 1, i % 2 ? '#b8a060' : '#6a5a30'); R(15, -10, 2, 6, '#5a4028'); },
      caneshed(g, e, t, R) { R(0, 18, 32, 13, 'rgba(0,0,0,.3)'); for (const x of [1, 28]) R(x, -4, 3, 33, '#4a3420'); R(4, 20, 18, 4, '#6a7a3a'); R(22, 24, 4, 2, '#8a8a90'); R(22, 18, 1, 8, '#5a3a22'); for (let i = 0; i < 9; i++) R(-2 + (8 - i), -12 + i, 36 - (8 - i) * 2, 1, i % 3 ? '#7a6a3a' : '#5a4e2a'); },
      /* 稻草人：套着一件旧衬衫，夜里左袖上一道印子 */
      scare(g, e, t, R) {
        R(7, -12, 2, 27, '#5a4028'); R(1, -6, 14, 2, '#5a4028'); R(5, 13, 6, 2, 'rgba(0,0,0,.35)');
        R(5, -18, 6, 6, '#b8a060'); R(4, -19, 8, 2, '#6a5a30'); R(6, -16, 1, 1, '#2a1a10'); R(9, -16, 1, 1, '#2a1a10');
        R(3, -7, 10, 10, '#6a7a8a'); R(0, -7, 4, 4, '#6a7a8a'); R(12, -7, 4, 4, '#6a7a8a'); R(7, -7, 1, 10, '#4a5a6a');
        if (e.blood) for (let k = 0; k < 6; k++) R(12 - k, -6 + (k >> 1), 2, k < 4 ? 2 : 1, k < 4 ? 'rgba(86,18,12,.9)' : 'rgba(86,18,12,.5)');
      },
      /* 飞头：长头发、白脸、红嘴，底下拖着一道发光的长影 */
      head(g, e, t, R) {
        const b = Math.round(Math.sin(t * 2.3 + e.px * .05) * 1.5), y0 = -16 + b, mad = e.mad;
        R(4, 13, 8, 2, 'rgba(0,0,0,.3)');
        for (let i = 0; i < 16; i++) { const w = Math.max(1, 5 - (i >> 2)), sw = Math.round(Math.sin(t * 3 + i * .5)); R(8 - (w >> 1) + sw, y0 + 11 + i, w, 1, i % 2 ? 'rgba(210,70,64,.5)' : 'rgba(120,255,150,.42)'); }
        R(0, y0 - 3, 16, 16, mad ? 'rgba(255,120,110,.1)' : 'rgba(120,255,150,.1)');
        const fl = e.dir === 2 ? -1 : 1, sw2 = Math.round(Math.sin(t * 4) * 1);
        R(3, y0, 10, 4, HAIR); R(2, y0 + 2, 2, 10, HAIR); R(12, y0 + 2, 2, 10, HAIR);
        R(fl > 0 ? 13 : -2, y0 + 1 + sw2, 5, 2, HAIR); R(fl > 0 ? 15 : -4, y0 + 3 - sw2, 4, 2, HAIR);   // 往后飘的头发
        R(4, y0 + 3, 8, 7, '#c8d4be'); R(5, y0 + 10, 6, 1, '#b8c4ae'); R(4, y0 + 3, 8, 2, HAIR); R(4, y0 + 5, 1, 4, HAIR);
        R(5, y0 + 6, 2, 1, '#080808'); R(9, y0 + 6, 2, 1, '#080808');
        R(6, y0 + 6, 1, 1, mad ? '#ff5a4a' : '#7aff9a'); R(10, y0 + 6, 1, 1, mad ? '#ff5a4a' : '#7aff9a');
        R(6, y0 + 8, 4, 1, '#8a1010'); if (mad) R(7, y0 + 9, 2, 1, '#2a0606');
      },
      /* 草席上坐着的身子（肩膀以上什么也没有）；盖白布、围刺枝 */
      body(g, e, t, R) {
        R(-3, 8, 22, 8, '#8a7a4a'); for (let y = 10; y < 16; y += 2) R(-3, y, 22, 1, '#76683c');
        R(3, 8, 10, 5, '#2a5a5a'); R(3, 12, 10, 1, '#c8a040'); R(4, 13, 2, 1, '#e8e8f0'); R(10, 13, 2, 1, '#e8e8f0');
        R(4, 1, 8, 8, '#e6e0d2'); R(3, 3, 2, 6, '#e6e0d2'); R(11, 3, 2, 6, '#e6e0d2'); R(4, 8, 2, 1, '#dcc2a2'); R(10, 8, 2, 1, '#dcc2a2');
        R(4, 0, 8, 2, '#d4ccbc'); R(6, 0, 4, 1, '#1a1212');
        if (!e.cov && !e.join) R(6, -1, 4, 1, 'rgba(120,255,150,.25)');
        if (e.join) { const a = Math.min(.6, e.join * .3); R(2, -6, 12, 10, `rgba(140,255,170,${a})`); }
        if (e.cov) { R(2, -1, 12, 11, '#f0eee4'); R(2, -1, 12, 1, '#ffffff'); R(5, 1, 1, 8, '#d8d4c8'); R(10, 2, 1, 7, '#d8d4c8'); R(6, -1, 4, 2, '#1a1212'); }
        if (e.ring) for (let i = 0; i < 14; i++) { const a = i / 14 * Math.PI * 2, x = 8 + Math.cos(a) * 14, y = 6 + Math.sin(a) * 9; R(x - 3, y, 6, 1, '#6a4a2a'); R(x - 1, y - 1, 1, 1, '#d8c8a0'); R(x + 2, y + 1, 1, 1, '#d8c8a0'); }
      },
      rjar(g, e, t, R) { R(1, 13, 14, 2, 'rgba(0,0,0,.4)'); R(2, 0, 12, 14, '#5a3420'); R(1, 2, 14, 10, '#6a3e24'); R(3, -2, 10, 3, '#4a2a18'); R(4, -2, 8, 1, '#0e0c0a'); R(3, 5, 10, 1, '#8a6030'); R(3, 2, 1, 8, '#7a4a2c'); },
      crack(g, e, t, R) { R(7, 0, 1, 12, 'rgba(200,215,255,.55)'); R(8, 3, 1, 6, 'rgba(200,215,255,.35)'); },
      gdoor(g, e, t, R) { R(1, 0, 14, 16, '#2a1c12'); R(1, 0, 14, 1, '#4a3420'); R(3, 2, 10, 13, 'rgba(160,180,220,.08)'); },
      /* —— 外婆家 —— */
      hing(g, e, t, R) {   // 墙上的佛龛
        R(1, 8, 14, 2, '#5a3a20'); R(2, 10, 2, 3, '#3a2414'); R(12, 10, 2, 3, '#3a2414');
        R(6, 1, 4, 7, '#d8a838'); R(7, -1, 2, 2, '#e0b848'); R(7, -2, 2, 1, '#f0d060'); R(5, 6, 6, 2, '#c89428');
        R(3, 6, 2, 2, '#f0f0e0'); R(11, 6, 2, 2, '#f0f0e0'); R(4, 5, 8, 1, '#f4f4e8');
      },
      twin(g, e, t, R) {   // 木板窗；夜里缝里透进绿光
        R(2, 1, 12, 11, '#3a2616');
        const gl = e.glow ? (Math.sin(t * 2) * .15 + .45) : 0;
        R(3, 2, 10, 9, '#5a3c22'); for (let x = 4; x < 13; x += 2) R(x, 2, 1, 9, '#4a3018');
        R(7, 2, 2, 9, gl ? `rgba(120,255,150,${gl})` : '#1a1008');
        if (e.face) { R(7, 4, 2, 2, '#c4d2ba'); R(7, 3, 2, 1, HAIR); }
      },
      herbs(g, e, t, R) { R(2, 1, 12, 1, '#5a3a22'); for (let i = 0; i < 4; i++) { R(3 + i * 3, 2, 1, 3, '#8a7a4a'); R(2 + i * 3, 5, 3, 5, i % 2 ? '#5a6a3a' : '#7a6a3a'); } },
      net(g, e, t, R) {   // 蚊帐罩着的席子
        R(0, 2, 32, 12, '#b89a5a'); for (let y = 4; y < 14; y += 3) R(0, y, 32, 1, '#a0844a'); R(2, 4, 7, 4, '#e8e0c8');
        R(0, -14, 32, 26, 'rgba(230,230,220,.13)'); R(0, -14, 32, 1, 'rgba(240,240,230,.45)'); R(0, -14, 1, 27, 'rgba(240,240,230,.35)'); R(31, -14, 1, 27, 'rgba(240,240,230,.35)');
      },
      mat(g, e, t, R) { R(0, 2, 32, 12, '#b89a5a'); for (let y = 4; y < 14; y += 3) R(0, y, 32, 1, '#a0844a'); R(2, 4, 7, 4, '#e8e0c8'); R(2, 4, 7, 1, '#f4f0e0'); R(12, 6, 16, 6, '#6a5a8a'); R(12, 6, 16, 1, '#7a6a9a'); },
      kit(g, e, t, R) {   // 接生用的竹篮：剪子、白布、草药
        R(2, 6, 12, 8, '#a07a40'); for (let x = 3; x < 14; x += 2) R(x, 6, 1, 8, '#7a5a2a'); R(2, 5, 12, 2, '#c09a58');
        R(4, 2, 6, 4, '#f0eee4'); R(10, 3, 3, 3, '#5a7a3a'); R(6, 1, 1, 3, '#a8a8b0'); R(8, 1, 1, 3, '#a8a8b0');
      },
      lowdesk(g, e, t, R) { box(R, 1, 6, 14, 8, '#5a3a22'); R(3, 2, 10, 5, '#c8b890'); R(3, 2, 10, 1, '#6a3a2a'); R(8, 2, 1, 5, '#a89870'); if (!e.read) R(7, -3 + (Math.sin(t * 4) > 0 ? 1 : 0), 2, 2, '#ffe680'); },
      oillamp(g, e, t, R) { R(5, 11, 6, 3, '#8a6a3a'); R(6, 10, 4, 1, '#a08050'); R(10, 9, 2, 2, '#8a6a3a'); if (!e.off) { const f = Math.sin(t * 14 + e.px) > 0 ? 1 : 0; R(10, 6 + f, 2, 3 - f, '#ffcf5a'); R(10, 5 + f, 1, 1, '#ff8a2a'); } },
      wjar(g, e, t, R) { R(2, 0, 12, 14, '#5a3420'); R(1, 2, 14, 10, '#6a3e24'); R(3, -2, 10, 3, '#4a2a18'); R(4, -2, 8, 2, '#0e1418'); R(5, -2, 3, 1, '#4a6a7a'); R(3, 5, 10, 1, '#c9a35a'); R(2, 14, 12, 1, 'rgba(0,0,0,.4)'); },
      stoveC(g, e, t, R) {
        R(3, 6, 10, 9, '#8a5a3a'); R(3, 6, 10, 1, '#a07050'); R(2, 1, 12, 6, '#2a2420'); R(3, 0, 10, 1, '#3a3430');
        if (!e.off) { const f = Math.sin(t * 11) > 0 ? 1 : 0; R(6, 10, 4, 3, f ? '#ff8a2a' : '#ffb040'); } else R(6, 10, 4, 3, '#1a1210');
      },
      tray(g, e, t, R) { R(1, 6, 14, 8, '#7a5a34'); R(2, 7, 12, 6, '#8a6a40'); R(3, 7, 5, 4, '#e8e2cc'); R(9, 8, 4, 3, '#c89040'); R(9, 8, 4, 1, '#d8a050'); R(4, 11, 3, 1, '#5a8a3a'); }
    },
    maps: {
      /* ---------------- 村子 ---------------- */
      village: {
        amb: 'night', dark: .4, plr: 4.2, floor: 'grass', darkC: '#160a06',
        legend: { b: 'banana', J: 'bamboo', X: 'thornX', Z: 'thornZ' },
        tileOpts: { grassC: '#3a3a22', treeC: '#1a2a16' },
        rows: (() => { const r = mkRows(40, 28, '"', [
          [0, 0, 39, 1, 'T'], [0, 0, 0, 27, 'T'], [39, 0, 39, 27, 'T'], [0, 27, 39, 27, 'T'],
          [8, 0, 9, 15, 'd'], [1, 14, 38, 15, 'd'], [19, 15, 20, 27, 'd'], [27, 6, 28, 14, 'd'], [31, 15, 32, 20, 'd'],
          [15, 7, 22, 13, 'X'], [16, 8, 21, 12, 'd'], [18, 13, 19, 13, 'd'],
          [35, 3, 38, 12, 'J'], [34, 5, 34, 10, 'J'],
          [16, 18, 17, 20, 'b'], [23, 2, 24, 3, 'b'], [36, 22, 38, 25, 'b'], [1, 2, 2, 3, 'b'],
          [2, 23, 6, 25, 'o'], [3, 24, 5, 24, '~'],
          [14, 2, 15, 3, 'Z'], [25, 11, 26, 12, 'Z'], [29, 20, 32, 20, 'Z'], [11, 16, 12, 17, 'Z']
        ]); SAFE.village = zset(r); return r; })(),
        ents: [
          { id: 'hTong', x: 17, y: 8, w: 4, h: 2, spr: 'stilt', col: '#5a4a30', lit: 'fire', thorny: true, light: { r: 2.6, col: 'rgba(255,120,60,.18)', dy: 30 }, on: S => tongHouse(S) },
          { id: 'gap1', x: 17, y: 10, spr: 'gap', decal: true, solid: false, on: (S, e) => gapOn(S, e) },
          { id: 'gap2', x: 19, y: 10, spr: 'gap', decal: true, solid: false, on: (S, e) => gapOn(S, e) },
          { id: 'gap3', x: 20, y: 10, spr: 'gap', decal: true, solid: false, on: (S, e) => gapOn(S, e) },
          { id: 'yai_d', x: 16, y: 11, spr: '@yai', dir: 2, on: S => yaiDusk(S) },
          { id: 'yai_n', x: 21, y: 11, spr: '@yai', dir: 1, hidden: true, on: S => yaiNight(S) },
          { id: 'tong', x: 34, y: 13, spr: '@tong', dir: 2, on: S => tongTalk(S) },
          { id: 'tpile', x: 35, y: 13, spr: 'thornpile', on: S => S.narr('一堆刚砍下来的刺竹枝，青皮上全是倒钩一样的硬刺。\n光是看着，手心就发麻。') },
          { id: 'hFon', x: 26, y: 4, w: 4, h: 2, spr: 'stilt', col: '#6a5232', on: S => fonHouse(S) },
          { id: 'ladF', x: 30, y: 5, spr: 'ladder', solid: false, on: S => fonLadder(S) },
          { id: 'LC', x: 24, y: 8, w: 3, spr: 'line', cols: ['#4a6a3a', '#e0dccc', '#7a3a3a'], on: S => lineOn(S, 'LC') },
          { id: 'kham', x: 25, y: 9, spr: '@kham', dir: 0, on: S => khamTalk(S) },
          { id: 'hBen', x: 2, y: 17, w: 4, h: 2, spr: 'stilt', col: '#4e4232', lit: true, on: S => S.narr(S.f.ph === 'night' ? '本伯家。门窗都关得死死的，门口横着一排刺枝。' : '本伯家。屋檐下挂着一串晒干的辣椒。') },
          { id: 'ben', x: 6, y: 18, spr: '@ben', dir: 2, on: S => benTalk(S) },
          { id: 'LB', x: 3, y: 9, w: 3, spr: 'line', cols: ['#6a4a7a', '#c8c0a8', '#8a6a3a'], on: S => lineOn(S, 'LB') },
          { id: 'shedV', x: 3, y: 5, w: 3, h: 2, spr: 'cowshed', on: S => S.f.ph === 'night' ? search(S, 'shedV') : S.narr('村头的空牛棚。牛去年卖掉了，棚里只剩一堆发霉的稻草。') },
          { id: 'well', x: 5, y: 12, spr: 'well', on: S => S.narr('村里的老井。井绳磨得发亮，井水又凉又甜。\n井沿上，搁着一只湿漉漉的水桶。') },
          { id: 'tam1', x: 3, y: 12, spr: 'tamarind', on: S => S.narr('井边的老罗望子树，树荫浓得化不开。\n小时候，你和阿芬在这底下捡过酸角。') },
          { id: 'fon', x: 6, y: 12, spr: '@fonU', dir: 1, on: S => fonTalk(S) },
          { id: 'LA', x: 11, y: 4, w: 3, spr: 'line', cols: ['#8a3a4a', '#d8d0c0', '#3a5a7a'], sk: 0, on: S => lineOn(S, 'LA') },
          { id: 'LD', x: 12, y: 9, w: 3, spr: 'line', cols: ['#5a6a8a', '#e4e0d0', '#6a5a3a'], sk: 1, rev: true, on: S => lineOn(S, 'LD') },
          { id: 'hYai', x: 29, y: 18, w: 4, h: 2, spr: 'stilt', col: '#6a5636', lit: true, thorny: true, on: S => S.narr('外婆家。高脚屋底下密密地铺着一层刺枝，是外婆自己铺的。') },
          { id: 'ladY', x: 33, y: 19, spr: 'ladder', solid: false, on: S => S.go('yaihome', 6, 8, 3) },
          { id: 'spirit', x: 35, y: 19, spr: 'spirit', light: { r: 1.4, col: 'rgba(255,190,110,.16)', flick: true }, on: S => S.narr(S.f.ph === 'night' ? '外婆家的土地神龛。香早就烧完了，只剩一点红红的香头。\n你在心里拜了拜。' : '外婆家门口的土地神龛，供着一杯红水、一串茉莉花。\n外婆每天早上都来换花。') },
          { id: 'tam2', x: 36, y: 17, spr: 'tamarind', on: S => S.narr('外婆家门口的罗望子树。') },
          { id: 'hA', x: 10, y: 20, w: 4, h: 2, spr: 'stilt', col: '#4e4030', on: S => S.narr('这家人去县里给儿子办出家，一走好几天。门上挂着锁。') },
          { id: 'hB', x: 23, y: 20, w: 4, h: 2, spr: 'stilt', col: '#5a4632', on: S => S.narr('邻居家，黑着灯。屋底下拴着的狗缩成一团，一声也不叫。') },
          { id: 'coop', x: 14, y: 17, spr: 'coop', on: S => S.narr(S.f.ph === 'night' ? '鸡笼的门被撞开了。一地鸡毛，一只鸡也没剩下。\n笼底下的土，是湿的。' : '鸡笼里的鸡挤成一团，一声不吭。天还没黑透呢。') },
          { x: 17, y: 2, spr: 'palm', on: S => S.narr('糖棕树。树顶上挂着接糖水的竹筒。') },
          { x: 34, y: 16, spr: 'palm', on: S => S.narr('糖棕树又高又直，像一根插在地里的旗杆。') },
          { x: 6, y: 21, spr: 'palm', on: S => S.narr('糖棕树底下落着几颗熟透的果子，被蚂蚁围住了。') },
          { x: 22, y: 24, spr: 'busstop', on: S => S.narr('长途车的站牌。去城里的车，明天早上才有。') },
          { id: 'fpV1', x: 8, y: 3, spr: 'bare', decal: true, solid: false, hidden: true, on: S => fpVillage(S) },
          { id: 'fpV2', x: 9, y: 7, spr: 'bare', decal: true, solid: false, hidden: true, on: S => fpVillage(S) },
          { id: 'exN1', x: 8, y: 0, spr: 'invisible', solid: false, touch: S => toField(S) },
          { id: 'exN2', x: 9, y: 0, spr: 'invisible', solid: false, touch: S => toField(S) },
          { id: 'exS1', x: 19, y: 27, spr: 'invisible', solid: false, touch: S => toTown(S) },
          { id: 'exS2', x: 20, y: 27, spr: 'invisible', solid: false, touch: S => toTown(S) },
          { id: 'kv', x: 14, y: 5, spr: 'head', solid: false, hidden: true, z: 1, light: { r: 2.6, col: 'rgba(110,255,150,.28)', dy: -6 } }
        ],
        async enter(S, first) {
          if (first) return duskArrive(S);
          if (S.f.ph === 'night') return nightVillage(S);
        }
      },
      /* ---------------- 外婆家 ---------------- */
      yaihome: {
        amb: 'room', dark: .5, plr: 3.4, floor: 'lightwood', wall: 'wood', darkC: '#0a0604',
        rows: ['##############', '##############', '#............#', '#............#', '#............#', '#............#', '#............#', '#............#', '#............#', '######..######'],
        ents: [
          { id: 'hing', x: 6, y: 1, spr: 'hing', light: { r: 1.6, col: 'rgba(255,200,110,.14)' }, on: S => S.narr('墙上的佛龛，供着一尊小小的金佛，两朵白茉莉。\n外婆说，夜里有什么事，就念「布陀」。') },
          { id: 'twin', x: 10, y: 1, spr: 'twin', on: S => winOn(S) },
          { id: 'herbs', x: 3, y: 1, spr: 'herbs', on: S => S.narr('房梁上倒挂着一束束晒干的草药：姜黄、香茅、苦楝叶……\n整间屋子都是外婆身上的那股味儿。') },
          { id: 'net', x: 2, y: 3, w: 2, spr: 'net', on: S => S.narr(S.f.ph === 'night' ? '外婆的蚊帐空着。' : '外婆的席子，罩着一顶洗得发白的蚊帐。') },
          { id: 'mat', x: 9, y: 3, w: 2, spr: 'mat', on: S => matOn(S) },
          { id: 'kit', x: 12, y: 3, spr: 'kit', on: S => S.narr('外婆接生用的竹篮：一把磨得雪亮的剪子，一叠洗得发软的白布，一包草药，一卷白线。\n四十年，就是这一篮子。') },
          { id: 'book', x: 4, y: 6, spr: 'lowdesk', on: S => S.note('yai') },
          { id: 'lamp', x: 7, y: 3, spr: 'oillamp', light: { r: 3.2, col: 'rgba(255,180,90,.22)', flick: true }, on: S => S.narr('一盏小油灯，火苗一跳一跳的。') },
          { id: 'jarW', x: 12, y: 7, spr: 'wjar', on: S => S.narr('装雨水的大陶缸。舀一瓢喝下去，凉到心里。') },
          { id: 'stove', x: 2, y: 7, spr: 'stoveC', on: S => S.narr('泥炉子上温着一锅糯米饭。') },
          { id: 'tray', x: 7, y: 6, spr: 'tray', solid: false, decal: true, hidden: true, on: S => S.narr('糯米饭、烤鱼、一碗辣辣的青木瓜。') },
          { id: 'yai_h', x: 5, y: 5, spr: '@yai', dir: 0, hidden: true, on: S => yaiHome(S) },
          { id: 'exY1', x: 6, y: 9, spr: 'invisible', solid: false, touch: S => leaveYai(S) },
          { id: 'exY2', x: 7, y: 9, spr: 'invisible', solid: false, touch: S => leaveYai(S) }
        ],
        async enter(S, first) {
          const ph = S.f.ph;
          if (ph === 'home') return dinner(S);
          if (first && (ph === 'dusk' || ph === 'task' || ph === 'med')) await S.narr('外婆家。屋里静悄悄的，灶上温着一锅糯米饭。\n外婆还在通嫂家呢。');
        }
      },
      /* ---------------- 田 ---------------- */
      field: {
        amb: 'wind', dark: .86, plr: 2.8, floor: 'dirt', darkC: '#040a12',
        legend: { y: 'paddy', a: 'cane', Z: 'thornZ' },
        tileOpts: { grassC: '#2a3020', treeC: '#121e12' },
        rows: (() => { const r = mkRows(36, 24, 'y', [
          [0, 0, 35, 1, 'T'], [0, 0, 0, 23, 'T'], [35, 0, 35, 23, 'T'], [0, 23, 35, 23, 'T'],
          [8, 4, 9, 23, 'd'], [2, 10, 33, 10, 'd'], [4, 6, 9, 6, 'd'], [26, 10, 27, 15, 'd'], [26, 14, 30, 14, 'd'],
          [22, 2, 33, 7, 'a'],
          [13, 19, 17, 21, 'o'], [14, 20, 16, 20, '~'],
          [1, 2, 2, 6, 'B'], [6, 2, 7, 3, 'B'],
          [11, 7, 12, 8, 'Z'], [20, 13, 21, 14, 'Z'], [23, 18, 24, 19, 'Z'], [5, 8, 6, 9, 'Z']
        ]); SAFE.field = zset(r); return r; })(),
        ents: [
          { id: 'hut', x: 3, y: 3, w: 3, h: 2, spr: 'hut', on: S => hutOn(S) },
          { id: 'fpF1', x: 8, y: 19, spr: 'bare', decal: true, solid: false, on: S => fpField(S, 0) },
          { id: 'fpF2', x: 9, y: 13, spr: 'bare', decal: true, solid: false, on: S => fpField(S, 0) },
          { id: 'fpF3', x: 8, y: 8, spr: 'bare', decal: true, solid: false, on: S => fpField(S, 0) },
          { id: 'fpF4', x: 6, y: 6, spr: 'bare', decal: true, solid: false, on: S => fpField(S, 0) },
          { id: 'fpF5', x: 11, y: 10, spr: 'bare', decal: true, solid: false, on: S => fpField(S, 1) },
          { id: 'scare', x: 18, y: 16, spr: 'scare', on: S => scareOn(S) },
          { id: 'hay', x: 12, y: 13, w: 2, h: 2, spr: 'hay', on: S => search(S, 'hay') },
          { id: 'shedC', x: 19, y: 5, w: 2, h: 2, spr: 'caneshed', on: S => search(S, 'shedC') },
          { id: 'barn', x: 28, y: 12, w: 2, h: 2, spr: 'barn', on: S => barnOn(S) },
          { id: 'barn2', x: 4, y: 17, w: 2, h: 2, spr: 'barn', latch: true, on: S => barn2On(S) },
          { x: 3, y: 14, spr: 'palm', on: S => S.narr('田埂上一棵孤零零的糖棕树。') },
          { x: 31, y: 18, spr: 'palm', on: S => S.narr('糖棕树的影子，在月光里长长地躺在田上。') },
          { x: 15, y: 7, spr: 'palm', on: S => S.narr('糖棕树。树顶上有什么东西扑棱了一下——是只夜鸟。') },
          { id: 'exF1', x: 8, y: 23, spr: 'invisible', solid: false, touch: S => S.go('village', 8, 1, 0) },
          { id: 'exF2', x: 9, y: 23, spr: 'invisible', solid: false, touch: S => S.go('village', 9, 1, 0) },
          { id: 'kf', x: 24, y: 9, spr: 'head', solid: false, hidden: true, z: 1, light: { r: 2.6, col: 'rgba(110,255,150,.28)', dy: -6 } }
        ],
        async enter(S, first) { if (S.f.ph === 'night') return fieldEnter(S, first); }
      },
      /* ---------------- 谷仓里 ---------------- */
      granary: {
        amb: 'drone', dark: .82, plr: 2.4, floor: 'darkwood', wall: 'wood', darkC: '#040303',
        legend: { H: 'heap' },
        rows: ['############', '############', '#HH......HH#', '#H........H#', '#..........#', '#..........#', '#..........#', '#..........#', '############'],
        ents: [
          { id: 'crack', x: 8, y: 1, spr: 'crack', light: { r: 1.8, col: 'rgba(170,190,255,.12)', dy: 26 }, on: S => S.narr('木板墙上一道细缝，漏进来一线月光。') },
          { id: 'body', x: 6, y: 3, spr: 'body', on: S => bodyOn(S) },
          { id: 'fonbook', x: 7, y: 4, spr: 'book', col: '#3a5a7a', on: S => { S.f.readFon = true; return S.note('fon'); } },
          { id: 'rjar', x: 1, y: 5, spr: 'rjar', on: S => jarOn(S) },
          { id: 'rjar2', x: 1, y: 6, spr: 'rjar', on: S => jarOn(S) },
          { x: 10, y: 5, spr: 'sack', on: S => S.narr('装满稻谷的麻袋，摞得齐齐整整。') },
          { x: 10, y: 6, spr: 'sack', on: S => S.narr('麻袋上用炭写着一个「坎」字。') },
          { id: 'exG1', x: 5, y: 7, spr: 'gdoor', decal: true, solid: false, touch: S => leaveGran(S) },
          { id: 'exG2', x: 6, y: 7, spr: 'gdoor', decal: true, solid: false, touch: S => leaveGran(S) },
          { id: 'kg', x: 6, y: 7, spr: 'head', solid: false, hidden: true, z: 1, light: { r: 2.4, col: 'rgba(110,255,150,.3)', dy: -6 } },
          { id: 'fonA', x: 6, y: 4, spr: '@fonC', dir: 0, hidden: true, on: S => S.say('阿芬', '……') },
          { id: 'yai_g', x: 6, y: 6, spr: '@yai', dir: 3, hidden: true }
        ],
        async enter(S, first) {
          if (S.f.ph !== 'body0' || !first) return;
          await S.narr('谷仓里又黑又闷，一股陈米和土腥混在一起的味道。\n一线月光从板缝里漏进来，照在米堆前面那张草席上。');
          anklet(S, .8);
          await S.narr('……叮。\n很轻的一声，像是铃铛。');
          S.goal('看看草席上的……');
        }
      }
    }
  });

  /* ================= 黄昏 ================= */
  async function duskArrive(S) {
    S.f.ph = 'dusk';
    await S.narr('长途车在村口停了一下，又突突地开走了，扬起一路红土。\n太阳贴在田那边的糖棕树梢上，天边红得像要烧起来。');
    await S.think('外婆家在村子东南角。……不过这个钟点，她多半又被谁家叫去接生了。');
    S.goal('去村子中间、围着刺篱笆的通嫂家找外婆');
  }
  function goalTask(S) { S.goal(`把刺枝塞进通嫂家屋檐底下的三处空当（${S.f.gaps || 0}/3）` + (S.coop ? '——两人分头找地上的深色印子' : '')); }

  async function yaiDusk(S) {
    S.face('yai_d', 'pl');
    const ph = S.f.ph;
    if (ph === 'dusk') {
      await S.say('外婆', ['哎哟，派！长这么高了。', '我还说你明天才到呢。来，让外婆看看……瘦了。城里的饭不养人。']);
      babyCry(S);
      await S.say('外婆', ['听见没有？通嫂下午生了，是个男孩。母子都好，在屋里「躺火」呢。', '你来得正好，外婆的腰弯不下去了。']);
      S.give('thornb');
      await S.say('外婆', ['这捆刺竹枝，你帮我塞到屋檐底下去。', '那三处空当，正对着产妇睡的地方。地板缝里漏下去的东西，最招……', '……最招野狗。铺严实了，一处也不能漏。']);
      S.f.ph = 'task'; goalTask(S);
      return;
    }
    if (ph === 'task' && (S.f.gaps || 0) >= 3) {
      await S.say('外婆', ['好孩子。手扎破了？吹吹就好。', '再帮外婆跑一趟——这包药，送给坎家的阿芬。她在西边井上打水。']);
      S.give('yao');
      await S.say('外婆', ['那孩子这阵子脸白得像张纸，我熬了点补血的草药。', '送完就回家，饭在锅里。外婆收拾好就回去。']);
      S.f.ph = 'med'; S.goal('把草药送给井边的阿芬（村子西边）');
      return;
    }
    if (ph === 'task') return S.say('外婆', '屋檐底下，三处空当。看见地上那几点深色的印子没有？就那儿。');
    if (ph === 'med') return S.say('外婆', '药送去了没有？阿芬在西边井上。');
    await S.say('外婆', '回家去吧，外婆一会儿就到。');
  }
  async function gapOn(S, e) {
    if (e.s.done) return S.narr('刺枝塞得严严实实，尖刺朝外。');
    if (S.f.ph !== 'task') return S.narr('屋檐底下的地上，有几点深色的印子，已经渗进土里了。\n头顶的地板缝里，漏下来一点炭火的红光。');
    S.sfx('cut'); e.s.done = true; S.f.gaps = (S.f.gaps || 0) + 1;
    if (S.f.gaps === 1) await S.narr('你把刺枝塞进空当。一根刺扎进了手指头。\n血珠冒出来，你赶紧把手指含进嘴里——又咸又腥。');
    else S.toast(`铺好了 ${S.f.gaps}/3`);
    if (S.f.gaps >= 3) { S.take('thornb'); await S.think('……好了，三处都铺上了。屋子底下密得连只猫都钻不进去。'); S.goal('回去跟外婆说一声'); }
    else goalTask(S);
  }
  async function tongHouse(S) {
    if (S.f.ph === 'night') { babyCry(S); return S.narr('屋里有婴儿细细的哭声，炭火的红光从地板缝里漏下来。\n屋檐底下的刺枝上，挂着几缕湿漉漉的、发着微光的丝。'); }
    await S.narr('通嫂家。地板缝里透出炭火的红光，一股草药和烟熏的味道。\n屋里，婴儿哼哼唧唧地哭了两声，又睡了。');
  }
  async function tongTalk(S) {
    S.face('tong', 'pl');
    if (S.once('tong1')) return S.say('通哥', ['接生婆家的？这刺竹扎手，你离远点。', '我老婆在屋里躺火呢，要烤足日子。屋底下我铺了三层刺，你外婆还嫌不够。', '……老人说得对。那东西，闻着血就来了。']);
    await S.say('通哥', '再砍两捆，今晚门口也围上。');
  }
  async function khamTalk(S) {
    S.face('kham', 'pl');
    if (S.once('kham1')) {
      await S.say('坎婶', ['派回来啦？去看过外婆没有？', '……你看看这几家，跑去县里给儿子剃头出家，一走三天，衣服晾在外头也没人收。']);
      await S.say('坎婶', ['天黑以后，衣服可不能晾在外头。', '第二天一早收回来，上头一道一道的——那东西半夜飞过，拿你的衣服擦嘴。']);
      await S.say('坎婶', ['我们家阿芬也不知道又上哪儿去了。这孩子最近怪得很：白天睡，太阳一落山就往田里的谷仓跑，说是去看老鼠夹子。', '谷仓的钥匙都找不着了。睡起觉来跟死了一样，推都推不醒。']);
      return;
    }
    await S.say('坎婶', S.f.ph === 'home' ? '阿芬回家了？……回了就好。' : '天黑前把衣服收了。记住啦。');
  }
  async function benTalk(S) {
    S.face('ben', 'pl');
    if (S.f.benHeard) return S.say('本伯', '天黑了就回家。小孩子，别在外头晃。');
    if (S.once('ben0')) await S.say('本伯', ['哟，接生婆家的小子。坐，坐。']);
    const r = await S.ask('本伯吧嗒吧嗒地抽着土烟卷。', ['「本伯，田那边夜里真有绿光？」', '「我就路过。」'], '派');
    if (r) return S.say('本伯', '路过好，路过好。天黑前回家。');
    S.f.benHeard = true;
    await S.say('本伯', ['有。一团绿莹莹的光，飘在田上面，飘一会儿，停一会儿，像在找东西。', '我小时候，邻村闹过一回。据说有人在竹林里找着一具没有头的身子，大家拿刺把它围了一圈。']);
    await S.say('本伯', ['后半夜，那颗头回来了，进不去，就绕着那圈刺叫，叫得满村的狗都不敢出声。', '叫到鸡叫……就掉进水塘里了。头回不去身子，天一亮，就活不成。']);
    await S.say('本伯', ['蓝婆活着的时候，田那边也亮。她死了以后，静了七八年。', '……去年，又亮起来了。']);
    const r2 = await S.ask('本伯把烟头按灭在地上。', ['「蓝婆是谁？」', '（不问了）'], '派');
    if (r2) return;
    await S.say('本伯', ['田边上一个孤老婆子。一辈子没嫁人，天一黑就关门，屋子周围铺满了刺。', '她死的时候，全村没人敢去。只有一个小丫头，给她端过一碗水。', '老人说，那东西是要传的。谁接了她最后一口吃的，谁就……', '算了算了，不说了。']);
  }
  async function fonTalk(S) {
    S.face('fon', 'pl');
    const ph = S.f.ph;
    if (ph !== 'med') {
      if (S.once('fon0')) {
        await S.narr('井边，一个女孩正在打水。太阳都快落了，她还站在罗望子树的影子里，撑着一把旧油纸伞。');
        anklet(S);
        return S.say('阿芬', ['……派？是派吧！', '你回来啦。外婆在通嫂家呢，快去吧。']);
      }
      return S.say('阿芬', '快去呀，外婆等着呢。');
    }
    S.take('yao');
    await S.narr('阿芬接过药包，低头闻了闻。\n她比小时候高了，也瘦了很多。长袖衣服一直扣到手腕，脸白得没有一点血色——只有嘴唇，红得有点扎眼。');
    await S.say('阿芬', ['替我谢谢外婆。', '……你还记得吗？小时候你掉进村口的水塘，是我把你拽上来的。你哭了一路，鼻涕都抹在我袖子上。']);
    const r = await S.ask('她歪着头看你。', ['「明明是你推我下去的。」', '「记得。……谢谢你。」'], '派');
    await S.say('阿芬', r ? '……傻子，谢什么。' : '我才没有！');
    await S.narr('她笑了。笑到一半，忽然停住了。\n她盯着你的手。');
    await S.say('阿芬', '你的手……流血了。', { style: 'whisper' });
    S.sfx('heart'); anklet(S, .6);
    await S.narr('是刚才铺刺枝的时候扎的。一点点血，已经快干了。\n阿芬往后退了一步，又退了一步，用手背死死捂住了嘴。');
    await S.say('阿芬', ['……没、没什么。我闻不得血腥味。', '派，今天晚上别出门，好吗？', '不管听见什么、看见什么，都别出门。']);
    const r2 = await S.ask('她的声音在发抖。', ['「为什么？」', '「……好。」'], '派');
    await S.say('阿芬', r2 ? '说好了。' : ['田里有东西。', '……你就当我胡说吧。']);
    await S.narr('她拎起水桶，快步走了。银脚链叮铃叮铃地响，一直响到看不见她。');
    anklet(S, .5);
    S.hide('fon');
    S.f.ph = 'home';
    S.goal('回外婆家（村子东南角，门口有土地神龛）');
  }
  async function fonHouse(S) {
    if (S.f.ph === 'night') return search(S, 'underF');
    await S.narr('坎婶和阿芬住的高脚屋。屋底下搁着一架织布机，几只竹篮，几个腌鱼的坛子。');
  }
  async function fonLadder(S) {
    if (S.f.ph === 'night') {
      if (S.once('peekF')) {
        await S.narr('你顺着梯子爬上去两级，从门缝里往里看。\n蚊帐垂着。蚊帐里的席子上……没有人。');
        S.f.fonEmpty = true;
        return S.think(['阿芬不在家。', '……她说今晚别出门。她自己呢？']);
      }
      return S.narr('阿芬的蚊帐空着。');
    }
    await S.narr(S.f.ph === 'home' ? '阿芬家。窗里没点灯。' : '阿芬家的梯子。');
  }
  async function lineOn(S, k) {
    const night = S.f.ph === 'night';
    if (!night) return S.narr(k === 'LC' ? '隔壁家没收的衣服，在晚风里晃荡。坎婶自家的早就收进去了。' : '没人收的衣服，在晚风里晃荡。这家人去县里给儿子办出家了。');
    S.f['l_' + k] = true;
    const T = {
      LA: '一条花筒裙上，有一道深褐色的印子——从北头抹过来，往南拖，越拖越淡。\n北边……是去田里的路。',
      LD: '晾着的一件白衬衫，被抹了一道：从西北角抹过来，往东南拖——朝着通嫂家。',
      LB: '衣服都干干净净的，在夜风里轻轻晃。\n它没从这边过。',
      LC: '阿芬家隔壁晾的衣服，干干净净。\n它没往这边来。'
    };
    S.sfx(k === 'LA' || k === 'LD' ? 'sting' : 'paper');
    await S.narr(T[k]);
    if (S.f.l_LA && S.f.l_LD && S.once('lineSum')) { await S.think('两道印子连起来……它是从北边的田里飞进村，一路飘到通嫂家的。'); S.goal('它从北边的田里来——去田里（村子北头的土路）'); }
  }
  async function fpVillage(S) {
    if (S.f.ph !== 'night') return;
    await S.narr('土路上一串赤脚印，小小的，很浅，像是走路的人没什么分量。\n往北去了——田那边。');
  }
  async function toField(S) {
    if (S.f.ph !== 'night') { await S.narr('往北是去田里的土路。\n太阳快落山了……先办正事。'); return S.walk('pl', 'd', 5); }
    await S.go('field', S.pl.x === 9 ? 9 : 8, 22, 3);
  }
  async function toTown(S) {
    await S.narr(S.f.ph === 'night' ? '往南是去镇上的大路，黑得看不见头。\n……外婆还在通嫂家守着。我不能走。' : '往南是去镇上的大路。回城的车，明天早上才有。');
    return S.walk('pl', 'u', 5);
  }

  /* ================= 外婆家：晚饭、半夜 ================= */
  async function dinner(S) {
    S.f.ph = 'dinner';
    S.hide('yai_d');
    S.place('yai_h', 6, 5, 0); S.show('tray');
    await S.narr('外婆已经回来了，正往席子上摆饭：一笸箩糯米饭，一碟烤鱼，一碗辣辣的青木瓜。\n油灯「噗」地跳了一下。');
    S.face('yai_h', 'pl');
    await S.say('外婆', ['坐，吃饭。', '……阿芬那孩子，药收下了？']);
    await S.say('派', '收下了。她让我晚上别出门。');
    await S.narr('外婆夹菜的手停了一下。');
    await S.say('外婆', '……那就听她的。');
    const asked = {};
    for (; ;) {
      const opts = [], keys = [];
      if (!asked.th) { opts.push('「外婆，为什么屋底下要铺刺？」'); keys.push('th'); }
      if (!asked.cl) { opts.push('「通嫂的孩子，起名字了吗？」'); keys.push('cl'); }
      if (!asked.gl) { opts.push('「田那边的绿光，到底是什么？」'); keys.push('gl'); }
      opts.push('（低头吃饭）'); keys.push('eat');
      const k = keys[await S.ask('外婆往你碗里夹了一块鱼。', opts, '派')];
      if (k === 'eat') break;
      asked[k] = true;
      if (k === 'th') await S.say('外婆', ['生完孩子，女人身上的血要流好些天，从地板缝里漏下去，就招东西。', '刺枝密密地铺在底下，那东西拖在下面的那一串……钻不过刺，一钻就挂住。']);
      if (k === 'cl') await S.say('外婆', ['还没呢。满月那天，请寺里的师父起。', '外婆接过的孩子，个个都记得。你生下来的时候，脸憋得发紫，外婆倒提着你拍了三下屁股，你才哭出来。', '阿芬也是。哭得晚，后来哭得最响。']);
      if (k === 'gl') {
        await S.say('外婆', ['……老人管它叫「กระสือ」。飞头。', '白天，它跟你我一样，是个人。到了夜里，它的头会离开身子，飞出去找血吃，身子就留在暗处，等它回来。', '飘在天上的那团绿光，就是它。']);
        const r = await S.ask('外婆说得很平静，像在说明天要下雨。', ['「真的假的……」', '（不说话）'], '派');
        await S.say('外婆', r ? '……吃饭吧。' : ['外婆接生四十年，什么都见过。', '吃饭。']);
      }
    }
    await S.say('外婆', ['今晚外婆在家。半夜要是听见什么，你别出声，也别开窗。', '吃完了，就去睡吧。']);
    S.hide('tray'); S.place('yai_h', 3, 5, 0);
    S.f.ph = 'sleep';
    S.goal('去自己的席子上睡觉（外婆的接生簿就在矮桌上）');
    S.cp('sleep');
  }
  async function yaiHome(S) {
    S.face('yai_h', 'pl');
    if (S.f.ph === 'sleep') return S.say('外婆', '早点睡。……那本簿子，想看就看吧，都是些老规矩。');
    await S.say('外婆', '……');
  }
  async function matOn(S) {
    if (S.f.ph !== 'sleep') return S.narr(S.f.ph === 'night' ? '你的席子。被子还是掀开的样子。' : '外婆给你铺好的席子，还有一床晒过太阳的薄被。');
    S.f.ph = 'sleep2';
    await S.narr('你躺下来。薄被有太阳的味道。\n窗外的虫子叫成一片，叫着叫着，就远了。');
    await S.fade(1, 900);
    S.ent('lamp').off = true; S.dark(.84); S.amb('night');
    nightSetup(S);
    S.pos(9, 4, 3); S.place('yai_h', 8, 5, 2);
    await S.wait(700);
    await S.fade(0, 900);
    await S.narr('不知道睡了多久。\n远处有狗在叫——叫了两声，忽然变成了一声哀哀的长嚎。');
    howl(S);
    await S.wait(900);
    S.amb('none');
    await S.narr('然后，整个村子一点声音也没有了。\n连虫子都不叫了。');
    S.ent('twin').s.glow = 1;
    await S.narr('木板窗的缝里，透进来一线绿莹莹的光。');
    S.face('yai_h', 'pl');
    await S.say('外婆', ['派，醒醒。别出声。', '……过来，从窗缝往外看。慢慢地。'], { style: 'whisper' });
    S.f.ph = 'win';
    S.goal('到窗边，从窗缝往外看');
  }
  function nightSetup(S) {
    S.dark(.86, 'village'); S.dark(.86, 'field'); S.plr(2.8);
    for (const id of ['kham', 'ben', 'fon', 'tong', 'yai_d']) S.hide(id);
    for (const id of ['LA', 'LD', 'scare']) S.ent(id).blood = true;
    S.show('fpV1'); S.show('fpV2');
    S.ent('coop').open = true;
    for (const id of ['gap1', 'gap2', 'gap3']) S.ent(id).s.glint = true;
    S.ent('hBen').lit = false; S.ent('hYai').lit = false;
  }
  async function winOn(S) {
    const ph = S.f.ph;
    if (ph === 'win') return windowScene(S);
    if (ph === 'night') return S.narr('窗缝外面，村子黑沉沉的。远处，一点绿光飘过去了。');
    await S.narr('木板窗。推开一条缝，能看见通嫂家的屋顶，和远处的糖棕树。');
  }
  async function windowScene(S) {
    S.f.ph = 'night0';
    await S.narr('你把眼睛贴到窗缝上。\n通嫂家的屋顶上方，飘着一团绿莹莹的光。');
    await S.narr('光的中间，是一颗女人的头。\n长头发散在身后，像泡在水里一样慢慢地飘。脸底下垂着一道发光的长影，一直拖到篱笆上，一抽，一抽。');
    S.sfx('heart'); hum(S, .12);
    await S.narr('它朝屋子底下一钻——');
    screech(S);
    S.ent('twin').face = true;
    await S.scare('face', { face: 'krasue2', sfx: 'sting', dur: 1 });
    S.ent('twin').face = null;
    await S.narr('「嘶」的一声，它猛地弹了回来，在半空里抖个不停。\n刺枝底下，好像有什么东西被挂住了，又被扯了出去。');
    S.face('yai_h', 'pl');
    await S.say('外婆', ['是它。刺枝挡得了一时，挡不了一夜。外婆得去通嫂家守着，产妇和孩子离不开人。', '你听好：它的头在外面，身子就藏在附近，天亮前一定得回去。找到它的身子。'], { style: 'whisper' });
    await S.say('外婆', ['它飞过晾在外头的衣服，会拿衣服擦嘴。印子从哪头抹过来，它就是从哪头来的。', '它的身子怕狗、怕猪、怕太阳，总藏在有门、关得严、太阳照不进的地方。', '别让它看见你。绿光过来，就站着别动，或者站到铺了刺枝的地上——它不敢钻。'], { style: 'whisper' });
    S.give('thornb2');
    await S.say('外婆', '这捆刺枝你拿着。用刺把身子围一圈，头就回不去了；天一亮，它就……', { style: 'whisper' });
    S.give('cloth');
    await S.say('外婆', ['……这块白布，也拿着。我接生的时候，包孩子用的。', '你自己看着办吧。外婆老了，心软了。'], { style: 'whisper' });
    await S.walk('yai_h', [6, 8], 3.4);
    S.hide('yai_h'); S.show('yai_n'); S.amb('wind');
    await S.narr('外婆摸黑下了梯子。\n你听见她的脚步声，一步一步，往通嫂家去了。');
    S.f.ph = 'night';
    S.goal('天亮前找到它的身子：先去看晾在外面的衣服' + (S.coop ? '（联机：一人盯绿光，一人找）' : ''));
    S.toast(S.coop ? '联机：观看的一方盯着绿光，点击画面给同伴标出它在哪儿' : '绿光靠近时站住别动，或者站到铺着刺枝的地上');
    startDawn(S, T_FULL);
    S.cp('night');
  }
  async function leaveYai(S) {
    const ph = S.f.ph;
    if (ph === 'sleep' || ph === 'sleep2' || ph === 'win' || ph === 'night0' || ph === 'dinner') { await S.think(ph === 'sleep' ? '外婆说，吃完饭就别出去了。' : '……先听外婆的。'); return S.walk('pl', 'u', 5); }
    await S.go('village', 33, 20, 0);
  }

  /* ================= 夜：村子与田 ================= */
  async function deathTip(S) {
    if (FAILS.t && S.once('tipT')) { S.f.hint = Math.max(S.f.hint || 0, 1); await S.think(['天亮得比我想的快。', '别乱翻。先看晾着的衣服，弄清它从哪儿来；田里的稻草人身上也挂着衣服。']); }
    else if (FAILS.c === 1) await S.think(['绿光一靠近，就站住别动——它要贴得很近才看得见站着的人。', '来不及了就往铺着刺枝的地上跑。跑的时候它更容易发现我。']);
    else if (FAILS.c > 1) await S.think('盯着绿光走：它往这边飘，我就站到刺枝上等它过去。');
  }
  async function nightVillage(S) {
    S.amb('wind');
    if (!NIGHT_SEEN) {
      NIGHT_SEEN = true;
      const e = S.ent('kv'); S.place('kv', 23, 9); e.alpha = 1;
      S.focus(20, 10);
      hum(S, .09);
      await flyTo(S, 'kv', 23, 13, 1.8);
      await flyTo(S, 'kv', 15, 14, 1.8);
      await S.narr('绿光绕着通嫂家的刺篱笆，一圈，又一圈。\n每绕到屋子底下，就停一停，往里探一探。');
      S.focus(null);
      await S.think(['外婆说，顺着晾在外头的衣服找。', '……别让它看见我。']);
    }
    placeFar(S);
  }
  async function fieldEnter(S, first) {
    S.amb('wind');
    placeFar(S);
    if (!first) return;
    await S.narr('田里比村子里还黑。晒裂的土在脚底下咔咔地响。\n远处，糖棕树的影子底下，一点绿光飘了过去。');
    await S.think('田这么大……先找找它留下的痕迹。');
    S.goal('在田里找它的身子：看脚印，看稻草人身上的衣服');
    S.f.tf = Math.round(S.timerLeft || T_FULL);
    S.cp('field');
  }
  async function yaiNight(S) {
    S.face('yai_n', 'pl');
    if (S.once('yaiN1')) await S.say('外婆', ['你怎么跑这儿来了！', '……刺篱笆里头它进不来。喘口气再走。'], { style: 'whisper' });
    const lv = Math.min(3, Math.max(S.f.hint || 0, S.f.miss || 0));
    await S.say('外婆', HINTS[lv], { style: 'whisper' });
    S.f.hint = Math.min(3, lv + 1);
  }
  async function fpField(S, k) {
    if (k === 0) return S.narr('一串赤脚印，小小的，很浅。\n顺着田埂往北，拐向西边那间塌了一半的茅草屋。');
    await S.narr('赤脚印从茅草屋那边过来，往东走了几步……\n到了这儿，干田上全是牛蹄印，再也看不清了。');
  }
  async function hutOn(S) {
    if (S.once('hut1')) {
      await S.narr('蓝婆的旧屋。茅草顶塌了一半，门板歪在一边。\n屋子四周铺过一圈刺枝，早就枯成了灰白色，一碰就碎。');
      await S.narr('屋里一眼就能看完：一张竹床，一口破缸，土墙上有字。\n地上的灰里，有一串新鲜的赤脚印——小小的，很浅。');
      await S.narr('脚印走到竹床前，在那儿跪过。灰上有两个膝盖压出来的浅坑。\n然后，脚印出了门，往东去了。');
      await S.note('lam');
      const r = await S.ask('竹床底下，有一个落满灰的小铜盒——装槟榔的。', ['拿上', '别碰'], '派');
      if (r === 0) { S.give('betel'); await S.think('……凉得像块冰。说不定，这才是一切的源头。'); }
      else await S.think('……还是别碰她的东西。');
      S.goal('脚印往东去了——去田的东边找');
      return;
    }
    if (!S.has('betel') && !S.f.betelNo) {
      const r = await S.ask('蓝婆的竹床底下，那个小铜盒还在。', ['拿上', '算了'], '派');
      if (r === 0) { S.give('betel'); return; }
      S.f.betelNo = true; return;
    }
    await S.narr('蓝婆的屋子。墙上的炭字在黑暗里看不清了。\n脚印往东去了。');
  }
  async function scareOn(S) {
    if (S.f.ph !== 'night') return S.narr('稻草人。');
    S.f.l_sc = true;
    S.sfx('sting');
    await S.narr('稻草人身上套着一件旧衬衫。\n左边袖子上，一道深褐色的印子——从东边那头抹过来，往西拖，越拖越淡。');
    await S.think('它是从田的东边飞过来的。');
    S.goal('它从田的东边来——找有门、关得严、照不进太阳的地方');
  }
  async function barn2On(S) {
    if (S.once('barn2a')) await S.narr('一座小谷仓，架在木桩上，木板墙钉得严严实实。门板上用炭写着一个「本」字——是本伯家的。\n门是从外面用一根木销插上的。');
    return search(S, 'barn2');
  }
  async function barnOn(S) {
    if (S.once('barn1')) await S.narr('一座小谷仓，架在四根木桩上，离地半人高。木板墙钉得严严实实，一丝缝也不透。\n门板上用炭写着一个「坎」字——是坎家的谷仓。');
    const r = await S.ask('谷仓的门虚掩着，里头用一根草绳系住了。', ['解开草绳，进去', '先不进'], '派');
    if (r) return;
    S.clearTimer();
    S.f.ph = 'body0';
    S.ent('kf').hidden = true;
    S.ent('barn').open = true;
    S.sfx('open');
    await S.go('granary', 6, 6, 3);
  }

  /* ================= 谷仓 ================= */
  function resetG(S) {
    Object.assign(G, { st: 'idle', t: 0, warn: 0, grace: 0, hold: 0, hum: 0, hb: 0 });
    const e = S.ent('kg'); if (e) { e.hidden = true; e.alpha = 1; e.s.mad = false; }
    const b = S.ent('body'); if (b) { b.s.cov = false; b.s.ring = false; b.s.join = 0; b.hidden = false; }
    S.hidePlayer(false);
  }
  async function bodyOn(S) {
    const ph = S.f.ph;
    if (ph === 'body0') {
      await S.narr('米堆前铺着一张草席。席子上，背靠着米袋，坐着一个人。\n筒裙的颜色在月光里看不清，可那道金边，我傍晚刚见过。');
      await S.narr('她坐得端端正正，两只手搁在膝盖上，像在等人。\n……肩膀上面，什么也没有。');
      S.sfx('heart');
      await S.wait(500);
      anklet(S, .7);
      await S.narr('脚踝上，一圈细细的银脚链。风从门缝里钻进来，铃铛轻轻地响了一下。\n叮。');
      await S.think(['阿芬。', '傍晚她跟我说「今晚别出门」。……她不是在吓唬我。她是在求我。']);
      S.f.ph = 'body';
      S.goal('拿主意：用刺枝围住她，还是盖好白布、让她回来');
      S.cp('body');
      return choose(S);
    }
    if (ph === 'body') return choose(S);
    if (ph === 'wait0' || ph === 'wait') return S.think('她就要回来了。快躲起来——米缸后面。');
    if (ph === 'thorn') return;
  }
  async function choose(S) {
    const r = await S.ask('阿芬端端正正地坐着，等着。', ['用刺枝把她围起来（她就回不来了）', '用白布替她盖好，躲开，让她回来', '（再想想）'], '派');
    if (r === 2) return;
    if (r === 0) return thornPath(S);
    return coverPath(S);
  }
  async function coverPath(S) {
    S.take('cloth');
    S.ent('body').s.cov = true;
    S.sfx('paper');
    await S.narr('你把外婆的白布抖开，轻轻搭在她肩上，一直盖到膝盖。\n领口那儿，你留了一道空。');
    await S.think(['……冷吧。', '快回来吧，阿芬。天快亮了。']);
    Object.assign(G, { st: 'idle', t: 0, warn: 0, grace: 0, hold: 0 });
    S.f.ph = 'wait0';
    S.goal('躲到米缸后面（调查米缸），然后一动也别动');
    if (S.coop) S.toast('联机：操作的人躲好之后别碰方向键，另一个人盯着绿光');
  }
  async function jarOn(S) {
    const ph = S.f.ph;
    if (ph === 'wait0' || ph === 'wait') {
      if (S.pl.hidden) return S.think('别动。别出声。');
      S.hidePlayer(true); S.f.hid = true;
      await S.narr('你缩进米缸和墙之间的黑影里，抱住膝盖。\n陈米的味道扑过来，盖住了你手上那点血腥味。心跳得那么响，像是整个谷仓都听得见。');
      S.goal('别动。一下也别动。');
      return;
    }
    await S.narr('两口半人高的米缸，缸口盖着木板。米缸和墙之间，有一道窄窄的黑影。');
  }
  async function leaveGran(S) {
    const ph = S.f.ph;
    if (ph === 'end') return;
    await S.think(ph === 'wait0' || ph === 'wait' ? '……她就要回来了。现在出去，会迎面撞上她。' : '……不能丢下她就这么走了。');
    return S.walk('pl', 'u', 5);
  }
  /* 每帧：她回到谷仓、找自己的身子；你躲在暗处，一动不能动 */
  function granTick(S, dt) {
    if (S.map !== 'granary' || S.busy || G.st === 'seen' || G.st === 'done') return;
    const e = S.ent('kg'), P = S.pl;
    if (S.f.ph === 'wait0') {
      G.t += dt;
      if ((P.hidden && G.t > 1.5) || G.t > 14) {
        S.f.ph = 'wait'; G.st = 'enter'; G.t = 0;
        e.px = 6 * 16; e.py = 7 * 16; e.x = 6; e.y = 7; e.hidden = false; e.alpha = 0; e.dir = 0;
        S.sfx('open'); hum(S, .08);
      }
      return;
    }
    G.t += dt;
    G.hum -= dt; if (G.hum <= 0) { G.hum = 1.7; hum(S, .055); }
    const d = Math.hypot(e.px - P.px, e.py - P.py) / 16, moved = S.moving;
    if (P.hidden && moved) S.hidePlayer(false);
    if (G.grace > 0) G.grace -= dt;
    if (e.alpha > .5) {
      if (!P.hidden && d < 2.2) return seen(S);
      if (!P.hidden && moved && G.grace <= 0) {
        if (G.warn === 0) { G.warn = 1; G.grace = 2.8; G.hold = 2.8; S.bubble('kg', '?', 1600); S.sfx('heart'); S.toast('她停住了……躲回米缸后面，别动！'); }
        else return seen(S);
      }
    }
    if (G.hold > 0) { G.hold -= dt; return; }
    switch (G.st) {
      case 'enter': e.alpha = Math.min(1, e.alpha + dt * 1.1); if (e.alpha >= 1) { G.st = 'in'; G.t = 0; } break;
      case 'in': if (fly(e, 6, 5, 1.1, dt) === true) { G.st = 'sniff'; G.t = 0; } break;
      case 'sniff':
        if (P.hidden) fly(e, 3.7, 5, .7, dt); else fly(e, P.px / 16, P.py / 16, .9, dt);   // 没躲好：她循着血腥味朝你飘过来
        G.hb -= dt; if (G.hb <= 0) { G.hb = .7; S.sfx('heart'); }
        if (G.t > 2.6) { G.st = 'turn'; G.t = 0; }
        break;
      case 'turn': if (G.t > 1.2) { G.st = 'back'; G.t = 0; } break;
      case 'back': if (fly(e, 6, 2.6, 1, dt) === true) { G.st = 'join'; G.t = 0; anklet(S, .6); } break;
      case 'join': { const b = S.ent('body'); b.s.join = G.t; e.alpha = Math.max(0, 1 - G.t / 2); if (G.t > 2.1) { G.st = 'done'; S.run(dawnGood); } break; }
    }
  }
  function seen(S) { if (G.st === 'seen') return; G.st = 'seen'; S.run(seenEnd); }
  async function seenEnd(S) {
    FAILS.s++;
    S.hidePlayer(false);
    const e = S.ent('kg'); e.s.mad = true; e.alpha = 1;
    S.bubble('kg', '!', 1200); screech(S);
    await S.narr('绿光猛地转了过来。\n她看见你了——蹲在她的身子旁边，在她最不想被人看见的时候。');
    await S.scare('face', { face: 'krasue', sfx: 'scream' });
    await S.end({ bad: true, id: 'seen', title: '她看见你了', text: '她认出了你，又好像没有认出。\n那双眼睛里，只剩下饿。\n\n第二天早上，坎婶在谷仓里找到了阿芬，好好地睡在草席上，身上盖着一块白布。\n接生婆家那个从城里来的孩子，村里人找了三天。\n\n田那边的绿光，后来又亮了很多年。' });
  }
  async function thornPath(S) {
    S.f.ph = 'thorn';
    S.take('thornb2');
    S.ent('body').s.ring = true;
    S.sfx('cut');
    await S.narr('你把刺枝一根一根插在草席四周，尖刺朝外，围成一个圈。\n手又被扎破了。你没有管它。');
    await S.wait(500);
    hum(S, .1);
    await S.narr('门缝外面，绿光来了。');
    const e = S.ent('kg'); S.place('kg', 6, 7); e.alpha = 1;
    await flyTo(S, 'kg', 6, 5, 1.4);
    await S.narr('她在刺圈外面停住了。\n头发垂下来，底下那道发光的长影一抽一抽地，往刺圈里探——');
    screech(S); S.shake(500, 2);
    await flyTo(S, 'kg', 6, 6, 3);
    await S.narr('「嘶」的一声，又缩了回去。');
    await flyTo(S, 'kg', 3, 4, 1.4); await flyTo(S, 'kg', 9, 4, 1.4); await flyTo(S, 'kg', 6, 5.5, 1.4);
    S.face('pl', 'kg');
    e.s.mad = true;
    await S.scare('face', { face: 'krasue', sfx: 'scream', dur: .8 });
    e.s.mad = false;
    await S.say('', ['派……', '是你吗，派……'], { style: 'whisper' });
    await S.say('阿芬', ['让我回去……', '天快亮了。我不去通嫂家了，我谁家也不去了……', '让我回去吧。我想看见早上。'], { style: 'whisper' });
    const r = await S.ask('绿光在刺圈外面一圈一圈地转。门缝里的天色，一点一点地变白了。', ['把刺枝拔掉', '不动。等天亮。'], '派');
    if (r === 0) {
      S.ent('body').s.ring = false; S.sfx('cut');
      await S.narr('你跪下来，一根一根地拔掉刺枝。手上全是血口子。\n你背过身去，不看她。');
      await flyTo(S, 'kg', 6, 2.6, 1);
      for (let i = 0; i <= 10; i++) { S.ent('body').s.join = i / 5; e.alpha = 1 - i / 10; await S.wait(120); }
      S.f.how = 'saw';
      return dawnGood(S);
    }
    await S.narr('你坐在刺圈外面，一动不动。\n她绕啊，绕啊。声音越来越小，越来越哑。');
    rooster(S);
    await S.wait(900);
    for (let i = 10; i >= 0; i--) { e.alpha = i / 10; await S.wait(140); }
    e.hidden = true;
    await S.narr('鸡叫第三遍的时候，绿光灭了。');
    await S.end({ bad: true, id: 'thorn', title: '刺篱笆', text: '天亮以后，坎婶在谷仓里找到了阿芬。村里人说，她是在睡梦里走的，走得很安静。\n外婆替她擦了身子，换上一条干净的筒裙，一句话也没有说。\n\n通嫂的孩子满月那天，全村都去喝了酒。只有外婆没去。\n她坐在家门口，把那块没用上的白布，叠了又叠。\n\n从那以后，田那边再也没有亮过绿光。' });
  }
  async function dawnGood(S) {
    S.f.ph = 'end';
    S.ent('kg').hidden = true;
    const saw = S.f.how === 'saw';
    S.fx('flash'); anklet(S, 1);
    await S.wait(400);
    S.hide('body'); S.place('fonA', 6, 3, 0); S.ent('fonA').solid = true;
    if (!saw) await S.narr('绿光沉了下去，落在白布的领口上。\n一阵很轻很轻的声音，像有人长长地叹了一口气。\n然后，谷仓里黑了。');
    else await S.narr('绿光落了下去。\n一阵很轻很轻的声音，像有人长长地叹了一口气。');
    await S.wait(700);
    rooster(S);
    S.dark(.5);
    await S.narr('不知过了多久，远处传来第一声鸡叫。\n门缝里，透进来一线灰白的光。');
    S.hidePlayer(false);
    S.face('fonA', 'pl');
    await S.say('阿芬', ['……嗯……', '……派？'], { style: 'whisper' });
    await S.narr('阿芬裹着那块白布坐着，愣愣地看着你。\n她伸手摸了摸自己的脖子，手一直在抖。');
    await S.say('阿芬', '你……都看见了？');
    const r = await S.ask('晨光一点点爬进谷仓。', ['「我什么也没看见。」', '「看见了。……没事了。」'], '派');
    if (r === 0) await S.say('阿芬', ['……骗人。', '你从小就不会撒谎，一撒谎耳朵就红。']);
    else { await S.say('阿芬', '……没事了？'); await S.narr('她把脸埋进白布里，肩膀一抽一抽的，没有声音。'); }
    S.place('yai_g', 6, 6, 3);
    await S.narr('谷仓的门被推开了。外婆站在晨光里，喘着气，头发都乱了。');
    await S.say('外婆', ['……都在呢。都在就好。', '十八年前，也是这样一个四月的早上，外婆把你接到这世上来，阿芬。', '……外婆早该来的。回家吧，孩子们，外婆给你们煮粥。']);
    let text = (saw ? '你是看着她回去的。这件事，你一辈子也没跟人提过。\n\n' : '') + '后来，阿芬每天晚上都睡在外婆家。\n外婆在她的席子四周铺一圈刺枝——不是为了把她挡在外面，是为了把她留在里面。\n天亮的时候，阿芬总是第一个醒，坐在门口，等太阳出来。\n\n通嫂的孩子满月那天，全村都去喝了酒。阿芬也去了，坐得离产房远远的，笑得很好看。';
    if (S.f.readFon) text += '\n\n那个练习本，后来阿芬自己烧掉了。烧之前，她把最后一行撕下来，夹进了外婆的接生簿里：\n「我想看见早上。」';
    if (S.has('betel')) text += '\n\n那个槟榔盒，外婆带去了寺里。师父们念了三天经，把它沉进了寺后的深水塘。\n那年雨季以后，田那边再也没有亮过绿光。';
    else text += '\n\n只是每到旱季，田那边偶尔还会亮起一点绿光，飘一会儿，停一会儿。\n外婆说，那是有人在回家的路上。';
    await S.end({ id: 'home', title: '回家的路', text });
  }
})();
