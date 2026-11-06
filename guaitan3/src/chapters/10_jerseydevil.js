/* ================= 第十夜 · 泽西恶魔（卷一收束） ================= */
(() => {
  /* ---------- S.tone 合成的关键音效（双方都听得到） ---------- */
  // 它的叫声：像女人尖叫，又像马嘶——先往上蹿，再拖着颤音往下掉，底下垫一层低吼
  function screech(S, d = 0, v = 1) {
    S.tone('sawtooth', 820, 1520, .22, .05 * v, d, 3200);
    for (let i = 0; i < 6; i++) S.tone('sawtooth', 1520 - i * 140 + (i % 2 ? 60 : -60), 1380 - i * 140, .14, .045 * v, d + .2 + i * .13, 3000);
    S.tone('square', 2300, 1150, .9, .012 * v, d + .05, 5200);
    S.tone('triangle', 190, 85, 1.1, .07 * v, d, 700);
  }
  // 翅膀：皮革一样的扑扇声（低频闷响）
  function wings(S, n = 4, d = 0, gap = .3, v = 1) {
    for (let i = 0; i < n; i++) { S.tone('triangle', 120, 42, .17, .09 * v, d + i * gap, 420); S.tone('sine', 70, 34, .22, .05 * v, d + i * gap + .02, 300); }
  }
  // 枪声：一声闷响 + 一道尖的
  function gunshot(S, d = 0, v = 1) { S.tone('square', 170, 30, .28, .13 * v, d, 900); S.tone('sawtooth', 1400, 70, .14, .06 * v, d, 2600); S.tone('triangle', 60, 30, .5, .08 * v, d + .02, 260); }
  // 冰裂：几下脆响，后面拖一声闷的
  function crack(S, d = 0) { [0, .07, .17, .3].forEach((t, i) => S.tone('triangle', 2800 - i * 420, 760, .05, .05, d + t, 5400)); S.tone('sine', 240, 80, .5, .05, d + .1, 600); }
  // 利兹妈妈的摇篮曲（游戏原创的小调，四句）
  function lullaby(S, d = 0, v = 1) {
    const N = [[392, 1], [440, .5], [392, .5], [330, 1], [294, 1], [330, .5], [392, .5], [330, 2], [294, 1], [262, .5], [294, .5], [330, 1], [392, 1], [330, .5], [294, .5], [262, 2]];
    let t = d;
    for (const [f, l] of N) { S.tone('sine', f, f, l * .55 + .25, .05 * v, t, 2400); S.tone('sine', f * 2, f * 2, l * .4, .012 * v, t, 2400); t += l * .5; }
    return t - d;
  }

  /* ---------- 共用：颜色、瓦片底 ---------- */
  const SNOWC = ['#d2dae6', '#b6becc', '#e4eaf2', '#a8b0c0'];
  function pSnow(R, X, Y) { speck(R, '#c2cad8', SNOWC, X, Y, 15, 41); if (hash(X, Y, 42) < .14) R((hash(X, Y, 43) * 11) | 0, (hash(X, Y, 44) * 13) | 0, 4, 1, '#aab2c2'); }
  function pPine(R, X, Y, c, sn) {
    pSnow(R, X, Y);
    for (let i = 0; i < 7; i++) { R(7 - i, 1 + i * 2, 2 + i * 2, 2, i % 2 ? c : shade(c, .15)); if (i % 2 === 0 && i) R(7 - i, 1 + i * 2, 2 + i, 1, sn); }
    R(7, 15, 2, 1, '#2a1c12');
  }

  /* ---------- 脚印精灵：每格一个（e.k 种类，e.dir 方向：0/3 竖走，1/2 横走） ---------- */
  function trkSpr(g, e, t, R) {
    const v = (e.dir ?? 3) === 0 || (e.dir ?? 3) === 3, j = ((e.x + e.y) & 1) ? 1 : -1;
    const P = (a, b, w, h, c) => v ? R(a, b, w, h, c) : R(b, a, h, w, c);
    const k = e.k;
    if (k === 'dev' || k === 'old' || k === 'fake') {
      const c = k === 'old' ? '#a4acbc' : '#5e6880', c2 = k === 'old' ? '#b4bccb' : '#424a60';
      const ox = k === 'fake' ? 0 : j, oy = k === 'fake' ? 0 : ((e.x * 7 + e.y * 3) % 5) - 2;
      if (e.gap) return;
      // 两瓣、圆头：像一只小马驹的蹄子从中间裂开
      P(5 + ox, 5 + oy, 2, 4, c); P(9 + ox, 5 + oy, 2, 4, c); P(5 + ox, 4 + oy, 1, 1, c2); P(10 + ox, 4 + oy, 1, 1, c2);
      P(6 + ox, 8 + oy, 1, 1, c2); P(9 + ox, 8 + oy, 1, 1, c2);
      if (k === 'fake') { P(5, 6, 2, 1, '#8a94a8'); P(9, 6, 2, 1, '#8a94a8'); P(12, 10, 2, 3, '#7a8498'); P(12, 13, 1, 1, '#7a8498'); }   // 木纹 + 旁边倒着走的小鞋印
      return;
    }
    if (k === 'deer') { const c = '#6e788c'; P(3, 2, 1, 3, c); P(5, 2, 1, 3, c); P(4, 4, 1, 1, c); P(10, 9, 1, 3, c); P(12, 9, 1, 3, c); P(11, 11, 1, 1, c); return; }
    if (k === 'boot') { const c = '#727c90'; P(2, 1, 4, 6, c); P(3, 2, 1, 1, '#4a5266'); P(4, 4, 1, 1, '#4a5266'); P(10, 8, 4, 6, c); P(11, 9, 1, 1, '#4a5266'); P(12, 11, 1, 1, '#4a5266'); P(7, 3, 2, 2, '#7a8498'); P(7, 2, 1, 1, '#7a8498'); P(8, 12, 2, 2, '#7a8498'); return; }
    if (k === 'fox') { const c = '#66708a'; P(7, 2, 2, 2, c); P(6, 1, 1, 1, c); P(9, 1, 1, 1, c); P(7, 10, 2, 2, c); P(6, 9, 1, 1, c); P(9, 9, 1, 1, c); return; }
    if (k === 'kid') { const c = '#7a8498'; P(4, 3, 2, 4, c); P(10, 9, 2, 4, c); return; }
  }

  /* ---------- 泽西恶魔精灵 ---------- */
  function devilSpr(g, e, t, R) {
    const d = e.dir ?? 0, fly = !!e.fly, sn = !!e.sniff, fr = e.fr || 0;
    const B = '#3e2c24', BD = '#241812', W1 = '#2c1c1a', W2 = '#4e2e2a', HN = '#c8b898', EY = '#ff3a1a', HF = '#0e0a08';
    const flap = fly ? Math.round(Math.sin(t * 15) * 3) : 0, hy = sn ? 4 : 0, lift = fly ? -7 : 0;
    R(1, 14, 14, 2, fly ? 'rgba(0,0,0,.22)' : 'rgba(0,0,0,.45)');
    const Q = (x, y, w, h, c) => R(x, y + lift, w, h, c);
    const a = fr === 1 ? 1 : 0, b = fr === 3 ? 1 : 0;
    if (d === 0 || d === 3) {
      if (fly) {
        for (const s of [-1, 1]) {
          const X = (x, w) => s < 0 ? x : 16 - x - w;
          Q(X(-11, 12), -9 + flap, 12, 3, W1); Q(X(-13, 3), -7 + flap, 3, 9, W2); Q(X(-8, 3), -6 + flap, 3, 8, W2); Q(X(-3, 3), -6 + flap, 3, 6, W2); Q(X(-13, 2), -11 + flap, 2, 2, W1);
        }
      } else { Q(0, -10, 3, 15, W1); Q(13, -10, 3, 15, W1); Q(0, -12, 1, 3, W1); Q(15, -12, 1, 3, W1); Q(1, -7, 1, 10, W2); Q(14, -7, 1, 10, W2); }
      Q(5, 7, 2, 5 - a, BD); Q(9, 7, 2, 5 - b, BD); Q(4, 11 - a, 3, 1, B); Q(9, 11 - b, 3, 1, B);
      Q(4, 12 - a, 3, 2, HF); Q(9, 12 - b, 3, 2, HF); Q(5, 12 - a, 1, 2, '#3a3030'); Q(10, 12 - b, 1, 2, '#3a3030');
      Q(4, -4, 8, 12, B); Q(10, -3, 2, 10, BD);
      if (d === 0) Q(6, -2, 4, 6, '#4e3a30');
      Q(12, 4, 3, 1, BD); Q(14, 2, 1, 3, BD); Q(13, 1, 3, 1, BD); Q(15, 0, 1, 2, BD);
      Q(6, -7 + hy, 4, 4, B);
      Q(5, -14 + hy, 6, 8, B); Q(6, -7 + hy, 4, 3, BD);
      if (d === 0) { Q(6, -5 + hy, 1, 1, '#000'); Q(9, -5 + hy, 1, 1, '#000'); Q(6, -11 + hy, 1, 1, EY); Q(9, -11 + hy, 1, 1, EY); }
      Q(4, -17 + hy, 1, 4, HN); Q(3, -18 + hy, 1, 2, HN); Q(11, -17 + hy, 1, 4, HN); Q(12, -18 + hy, 1, 2, HN);
    } else {
      const H = (x, y, w, h, c) => Q(d === 2 ? 16 - x - w : x, y, w, h, c);
      if (fly) { H(4, -13 + flap, 13, 3, W1); H(7, -17 + flap * 2, 3, 6, W2); H(11, -16 + flap * 2, 3, 5, W2); H(15, -15 + flap * 2, 3, 5, W2); H(16, -18 + flap * 2, 2, 3, W1); }
      else { H(7, -9, 7, 11, W1); H(8, -7, 5, 8, W2); H(12, -11, 2, 3, W1); }
      H(5, 7, 2, 5 - a, BD); H(10, 7, 2, 5 - b, BD); H(4, 12 - a, 3, 2, HF); H(10, 12 - b, 3, 2, HF);
      H(4, -4, 10, 11, B); H(5, 5, 8, 2, BD);
      H(14, 3, 3, 1, BD); H(16, 1, 1, 3, BD); H(15, 0, 2, 1, BD);
      H(3, -8 + hy, 4, 5, B);
      H(-1, -12 + hy, 8, 5, B); H(-2, -10 + hy, 3, 3, BD); H(-2, -9 + hy, 1, 1, '#000');
      H(2, -11 + hy, 1, 1, EY);
      H(5, -15 + hy, 1, 4, HN); H(6, -16 + hy, 2, 1, HN); H(8, -15 + hy, 1, 1, HN);
    }
  }

  /* ---------- 共用台词与流程状态 ---------- */
  let DEATHS = 0;   // 沼泽里死过几次（不随检查点回滚，用来给规则小结）
  const VOL1 = '十个夜晚。\n推特上只许问两个问题的小男孩；没有厂牌的街机；\n雪花屏里的木偶戏；一道会吹风的石缝——\n它们生在网上。帖子一层一层地往下盖，\n每一个回帖的人都说：「我也记得。」\n\n然后是更老的故事：\n阿彻大道上搭车的白裙姑娘，玻璃柜里的水手娃娃，\n运河小岛上挂满的娃娃，草原上数骨头的口哨，\n河边的红眼睛，还有松林里，第十三个孩子。\n\n网线和松林隔着两百年，讲的却是同一件事：\n怪谈从来不是一个人的。\n有人讲，有人信，有人回一句话——\n它就一直活着，等下一个人，在夜里接下去。';

  defChapter({
    id: 'jerseydevil', n: 10, title: '泽西恶魔', sub: '据说利兹妈妈的第十三个孩子，生下来就长出了蹄子和翅膀，尖叫着从烟囱飞进了松林。', origin: '美国新泽西州松林泥炭地传说', color: '#3c2420',
    amb: 'wind', floor: 'snow', floor2: 'needle', wall: 'wood', dark: .84, plr: 2.4,
    thumb(g, w, h) {
      const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#0c1020'); gr.addColorStop(1, '#2a3248'); g.fillStyle = gr; g.fillRect(0, 0, w, h);
      g.fillStyle = '#e8e4d0'; g.beginPath(); g.arc(w * .7, h * .28, h * .16, 0, 7); g.fill();
      g.fillStyle = '#0c1020'; g.beginPath(); g.arc(w * .7 + h * .06, h * .25, h * .14, 0, 7); g.fill();
      g.fillStyle = '#c8d0dc'; g.fillRect(0, h * .8, w, h * .2);
      g.fillStyle = '#0a1210';
      for (let i = 0; i < 9; i++) { const x = i * w / 8 - 8, th = h * (.3 + ((i * 37) % 11) / 40); g.beginPath(); g.moveTo(x, h * .82); g.lineTo(x + 10, h * .82 - th); g.lineTo(x + 20, h * .82); g.fill(); }
      // 一截砖烟囱，顶上蹲着它
      g.fillStyle = '#4a2a24'; g.fillRect(w * .44, h * .42, w * .12, h * .42); g.fillStyle = '#2a1814'; g.fillRect(w * .42, h * .4, w * .16, h * .04);
      const sc = 1.7, ox = w / 2 - 8 * sc, oy = h * .4 - 16 * sc;
      const R = (x, y, ww, hh, c) => { if (!c) return; g.fillStyle = c; g.fillRect(ox + x * sc, oy + y * sc, ww * sc, hh * sc); };
      devilSpr(g, { dir: 0, fly: true, fr: 0 }, .3, R);
      g.fillStyle = 'rgba(255,60,20,.35)'; g.fillRect(ox + 5 * sc, oy - 19 * sc, 6 * sc, 2 * sc);
    },
    /* 惊吓大头像（32×32）：长长的马脸，两只弯角，烧红的眼睛；两边的蝙蝠翅膀慢慢张开，嘴越张越大 */
    faces: {
      devil(R, a, t) {
        const B = '#3e2c24', BD = '#241812', WI = '#2c1c1a', WM = '#4e2e2a', HN = '#c8b898';
        R(0, 0, 32, 32, '#040304');
        const sp = Math.round(a * 5);
        for (const s of [0, 1]) {
          const X = (x, w) => s ? 32 - x - w : x;
          R(X(0, 9), 7 - sp, 9, 3, WI); R(X(0, 3), 10 - sp, 3, 14 + sp, WM); R(X(4, 2), 10 - sp, 2, 11 + sp, WM); R(X(7, 2), 10 - sp, 2, 7, WM);
          R(X(0, 1), 6 - sp, 1, 2, WI); R(X(3, 1), 24, 1, 2, WI);
        }
        R(9, 1, 2, 6, HN); R(8, 0, 2, 2, HN); R(7, 0, 1, 1, '#a89878'); R(21, 1, 2, 6, HN); R(22, 0, 2, 2, HN); R(24, 0, 1, 1, '#a89878');
        R(10, 5, 12, 9, B); R(11, 4, 10, 2, B); R(11, 14, 10, 6, B); R(12, 20, 8, 7, '#35261f'); R(19, 6, 3, 17, BD); R(20, 20, 1, 6, BD);
        R(8, 6, 2, 4, B); R(22, 6, 2, 4, BD);
        for (let i = 0; i < 5; i++) R(11 + i * 2, 4, 1, 2, '#2a1a14');
        R(15, 12, 2, 8, '#4a362c');
        const gl = .6 + Math.sin(t * 9) * .2;
        R(11, 8, 5, 4, `rgba(255,60,20,${.25 * gl})`); R(16, 8, 5, 4, `rgba(255,60,20,${.25 * gl})`);
        R(12, 9, 3, 2, '#ff3a1a'); R(17, 9, 3, 2, '#ff3a1a'); R(13, 9, 1, 1, '#ffd8a8'); R(18, 9, 1, 1, '#ffd8a8');
        R(13, 22, 2, 2, '#100808'); R(17, 22, 2, 2, '#100808');
        const mh = Math.round(a * 5);
        R(12, 26, 8, 1, '#100808');
        if (mh) { R(12, 26, 8, mh, '#1a0505'); R(12, 26, 1, 2, '#d8d0b8'); R(14, 26, 1, 1, '#d8d0b8'); R(17, 26, 1, 1, '#d8d0b8'); R(19, 26, 1, 2, '#d8d0b8'); R(13, 25 + mh, 1, 1, '#d8d0b8'); R(18, 25 + mh, 1, 1, '#d8d0b8'); }
      }
    },
    endings: { name: '他叫塞缪尔', nest: '第十三格', shot: '那一枪' },
    people: {
      me: { key: 'jd-me', skin: '#f2d2b2', hair: '#7a4422', hs: 'long', top: '#4a5a3a', top2: '#d8d0c0', coat: true, bottom: '#3a2e24', shoes: '#2a1c12', hat: 'scarf', hatC: '#a02a24' },
      zeke: { key: 'jd-zeke', skin: '#e2b896', hair: '#dcd8d0', hs: 'short', top: '#7a3424', top2: '#3a2a20', bottom: '#3a3a48', shoes: '#2a1c12',
        extra(g, d, fr, G, R) { if (d !== 3) { R(d === 0 ? 5 : 3, G.hT + 6, d === 0 ? 6 : 5, 3, '#e8e4dc'); R(d === 0 ? 6 : 3, G.hT + 9, 4, 1, '#e8e4dc'); } if (d === 0) { R(4, G.tT + 2, 8, 1, '#3a2a20'); R(4, G.tT + 5, 8, 1, '#3a2a20'); } } },
      wade: { key: 'jd-wade', skin: '#e6b48e', hair: '#5a3a1e', hs: 'short', hat: 'cap', hatC: '#2a2a2a', top: '#8a1c1c', top2: '#1a1a1a', bottom: '#3a3428', shoes: '#2a1c12',
        extra(g, d, fr, G, R) {
          if (d !== 3) { for (let y = G.tT + 2; y < G.tB; y += 3) R(4, y, 8, 1, '#2a1212'); R(7, G.tT, 1, G.tB - G.tT, '#2a1212'); }
          if (d === 3) { R(10, G.tT - 4, 1, 13, '#2a2a2a'); R(10, G.tT + 7, 2, 3, '#5a3a22'); } else if (d === 1) R(1, G.tT + 3, 9, 1, '#2a2a2a');
        } },
      posse: { key: 'jd-pos', skin: '#dcae8a', hair: '#3a2a1a', hs: 'short', hat: 'cap', hatC: '#4a3a2a', top: '#3a4048', top2: '#2a2a2a', coat: true, bottom: '#2a2a30', shoes: '#1a1a1a' },
      posse2: { key: 'jd-pos2', skin: '#e8c09a', hair: '#8a6a3a', hs: 'short', hat: 'cap', hatC: '#1a2a3a', top: '#5a4a2a', top2: '#2a2a2a', coat: true, bottom: '#2a2a30', shoes: '#1a1a1a' },
      boy: { key: 'jd-boy', child: true, skin: '#f0c8a0', hair: '#8a5a2a', hs: 'messy', hat: 'cap', hatC: '#6a2a2a', top: '#5a6a8a', bottom: '#4a3a2a', shoes: '#6a4a2a',
        extra(g, d, fr, G, R) { R(4, 21, 4, 3, '#8a6a3a'); R(9, 21, 4, 3, '#8a6a3a'); R(5, 22, 1, 2, '#5a4020'); R(10, 22, 1, 2, '#5a4020'); } },
      boy2: { key: 'jd-boy2', child: true, skin: '#f2d0b0', hair: '#2a1a12', hs: 'short', hat: 'cap', hatC: '#2a4a2a', top: '#8a6a3a', bottom: '#3a3a4a', shoes: '#3a2a1a' },
      mother: { key: 'jd-mom', ghost: true, skin: '#e8dcd0', hair: '#6a5a4a', hs: 'bun', hat: 'scarf', hatC: '#e8e4d8', top: '#4a4a5a', dress: true, apron: '#d8d4c8' }
    },
    items: {
      lantern: { name: '马灯', desc: '门边挂着的铁皮马灯，灯罩熏得发黄。煤油还有大半壶，够点到天亮。' },
      musket: { name: '外公的老火枪', desc: '单管的老式火枪，外公年轻时打野鸭用的。只装了一发铅弹。\n外公说：「这是给人看的，不是给它的。」' },
      quilt: { name: '百衲被', desc: '一床旧百衲被，十三格。十二格上用褪了色的线绣着一个字母和一样小东西：一只鸟，一把木勺，一棵松树……\n第十三格是空的。\n被子叠得整整齐齐，闻起来有一股雪松的味道。' }
    },
    notes: {
      papers: { title: '外公收着的剪报（1909年1月）', text: '（报纸是舅舅从镇上带回来的。外公一张一张剪下来，压在桌上的油灯底下。）\n\n1月17日　布里斯托尔：邮局局长凌晨听见一声怪叫，看见一个长翅膀的东西从河面上飞过去。\n1月18日　伯灵顿：好几户人家的屋顶上出现了蹄印。印子翻过围墙，走上房顶，到烟囱边就没了。\n1月19日　格洛斯特：一对夫妇说它在自家棚子顶上待了一个钟头，「像只鹤，长着一张马脸」。\n1月20日　西科灵斯伍德的消防队说，拿水龙头冲过它，它飞走了。哈登高地的有轨电车乘客说，它从车顶上掠了过去。\n1月21日　好几个镇的学校停了课，厂子里的工人不敢出门。据说费城动物园悬赏一万美元，要活的。\n\n另：费城某博物馆即日起展出「捉到的泽西恶魔」，门票一角。\n\n（最后这张旁边，外公用铅笔写了一行字：「捉得住才怪。」）' },
      tracks: { title: '外公的追踪口诀', text: '（外公不识几个字。这是你小时候他教你认脚印，他念，你写的。纸都磨毛了。）\n\n一、四条腿的走两行，两条腿的走一行。\n　　狐狸也走一行——可狐狸是爪子，印子前头有趾头。\n二、鹿蹄子尖，像一颗倒过来的心；马蹄子圆。\n　　它的蹄子是两瓣的，头却是圆的，跟谁的都不一样。\n三、新印子边是脆的，一碰就碎；旧印子里落了雪，边是软的。\n四、活物走路，步子有长有短。\n　　一样长、一样深的，不是走出来的，是摆出来的。\n五、印子走着走着没了，抬头看树——它上树了，要么飞了。\n　　找爪痕，比人高一头。\n\n（今天下午下过一场雪，天擦黑才停。——你自己在边上添的）' },
      bible: { title: '利兹家的旧圣经', text: '（圣经泡得发胀，书脊裂了。扉页上是一张手写的家谱，墨水已经褪成了褐色。）\n\n十二个名字，一个一个排下来。\n每个名字后面，跟着一个年份，有的还画着一个小小的十字。\n\n最后一行只写了一个字：「十三」。\n后面是空的。\n\n再往下，换了一种墨水，字写得歪歪扭扭，像是手在抖：\n\n「被子放在他该睡的地方。我等他回来。」' },
      letter: { title: '砖缝里的信', text: '（一卷发脆的纸，裹着油布，塞在烟道的砖缝里。字歪歪扭扭的，像是一个不常写字的人写的。）\n\n我说了那句话。\n那天夜里风大，屋里漏雨，十二张嘴等着吃饭。我疼得受不住，就说了。\n\n我说完就后悔了。可话已经出去了，\n就像他一样，从烟囱里出去了，追不回来。\n\n人家都说他是魔鬼。他不是。他是我的第十三个孩子。\n我一直没给他起名字。起了名字，就像承认他真的走了。\n\n现在我老了，等不到了。\n要是有一天，有人在松林里碰见他，替我告诉他：\n\n他叫塞缪尔。\n意思是，神听见了。' }
    },
    legend: '「泽西恶魔」（Jersey Devil），早年叫「利兹恶魔」（Leeds Devil），是美国新泽西州南部松林泥炭地（Pine Barrens）最出名的传说。流传最广的版本说：1735年前后，利兹角一个被人叫作「利兹妈妈」的女人怀上了第十三个孩子，她在绝望里说了一句「让魔鬼把这一个带走吧」。孩子生下来本是正常的，随即变成了长着蹄子、蝙蝠翅膀、马一样的长脑袋、头上有角、身后拖着分叉尾巴的东西，尖叫着从烟囱飞了出去，从此住进了松林。版本差异很多：有的说她是女巫，有的说是被她赶出门的牧师（或流浪人）诅咒了孩子，有的说孩子的父亲就是魔鬼；年份从十七世纪末到1780年代都有人讲；有的版本里它伤了接生婆，有的说它后来回来过，蹲在母亲的窗外。\n\n有出处的说法：研究者大多认为，「利兹恶魔」这个名字最早是一个家族背上的骂名。十八世纪初，利兹家族有一位出版历书的人，因为在历书里讲占星，和当地的贵格会闹翻，被对手骂成「魔鬼的仆人」，他家的纹章上又恰好画着双足飞龙。后来他的儿子接手历书，和费城另一位后来大名鼎鼎的印刷商打起了笔仗——对方在自己的历书里开玩笑「预言」了他的死期，等他真的去世，又说他的鬼魂还在写书。一个姓氏，就这样和「魔鬼」绑在了一起，又在松林里人们的口耳相传中长出了蹄子和翅膀。\n\n1909年1月16日到23日的一个星期，是它最出名的时候：新泽西南部和费城一带的报纸接连报道屋顶和雪地上出现了怪蹄印——翻过围墙，走上房顶，到烟囱边就没了；有人说它从有轨电车顶上掠过，有消防队说拿水龙头冲过它。据说有的学校停了课，有的厂子因为工人不敢出门开不了工，各地都组织了带枪的搜索队；常被提起的「费城动物园悬赏一万美元」，很可能也是报纸的夸张。同一时期，费城一家小博物馆展出了「捉到的泽西恶魔」，后来被揭穿是一只涂了条纹、粘上假翅膀的袋鼠。一周之后，目击几乎一下子都停了。此外还有一些流传很广、查无实据的故事：据说十九世纪初，一位海军准将在松林里的炼铁厂试炮时打中过它，炮弹从它身上穿了过去，它照样飞走了；据说拿破仑的哥哥流亡新泽西时打猎也见过它。今天，新泽西的职业冰球队就叫「新泽西魔鬼队」。\n\n（本章的露丝、齐克外公、韦德舅舅和搜索队，屋顶上的蹄印、外公的追踪口诀、做假蹄印的两个男孩，利兹老宅里的百衲被、家谱和砖缝里的信，「它闻着脚印追人」的规矩，炼铁炉里的窝，以及「塞缪尔」这个名字，均为游戏虚构。传说里利兹妈妈和第十三个孩子的名字，各家说法并不一致，游戏没有采用其中任何一种。剪报的文字按1909年报道的大意改写。）',
    start: { map: 'cabin', x: 7, y: 7, dir: 3 },
    resume: {
      pines: async S => { S.plr(S.has('lantern') ? 3.4 : null); },
      ruin: async S => { S.plr(3.4); },
      swamp: async S => { S.plr(3.4); await startSwamp(S, true); }
    },
    async intro(S) {
      DEATHS = 0; DV = null;
      await S.card('第十夜　泽西恶魔', '1909年1月21日　夜　美国新泽西州　松林泥炭地', '这个星期，整个新泽西南部都在说同一件事。\n屋顶上的蹄印。半夜的尖叫。\n学校停了课，镇上的人天一黑就闩门。\n\n松林里的人管它叫「利兹家的那个」。\n\n昨天夜里，它在我们家屋顶上，\n绕着烟囱走了一圈。');
    },
    tick(S, dt) { swampTick(S, dt); },
    sprites: {
      devil: devilSpr,
      trk: trkSpr,
      // 树干上的爪痕（实体放在树格上，从旁边调查）
      scr(g, e, t, R) { for (let i = 0; i < 3; i++) { R(5 + i * 2, -7 + i, 1, 7, '#d8c8a8'); R(6 + i * 2, -6 + i, 1, 6, '#8a6a4a'); } },
      crater(g, e, t, R) { R(2, 4, 12, 9, '#9aa2b4'); R(4, 6, 8, 5, '#7a8498'); R(5, 7, 2, 3, '#5e6880'); R(9, 7, 2, 3, '#5e6880'); R(1, 3, 14, 1, '#dce2ec'); },
      cabinx(g, e, t, R) {
        // 木屋正面：原木墙、积雪的屋顶、石头烟囱；屋顶雪上一串蹄印通到烟囱
        R(-4, -26, 104, 4, '#e4eaf2'); R(-2, -22, 100, 18, '#d2dae6'); R(-2, -5, 100, 2, '#8a94a8'); R(0, -4, 96, 1, '#2a1c14');
        for (let i = 0; i < 9; i++) R(8 + i * 8, -18 + (i % 2) * 4, 2, 2, '#5e6880');
        R(70, -42, 14, 22, '#5a5450'); R(71, -42, 12, 2, '#3a3634'); for (let y = -40; y < -22; y += 4) R(70, y, 14, 1, '#4a4440');
        R(72, -44, 10, 2, '#dce2ec'); R(73 + Math.round(Math.sin(t * 2) * 2), -50, 3, 4, 'rgba(200,200,210,.25)');
        R(74, -24, 2, 2, '#5e6880'); R(80, -26, 2, 2, '#5e6880'); R(84, -21, 2, 2, '#5e6880');
        R(0, -3, 96, 35, '#4a3424'); for (let y = -2; y < 32; y += 4) { R(0, y, 96, 1, '#2e2016'); R(0, y + 1, 96, 1, '#5a4230'); }
        R(-2, -3, 3, 35, '#3a281a'); R(95, -3, 3, 35, '#3a281a');
        const win = x => { R(x, 4, 14, 12, '#2a1c14'); R(x + 1, 5, 12, 10, e.off ? '#1a1a22' : '#e8b060'); R(x + 7, 5, 1, 10, '#2a1c14'); R(x + 1, 10, 12, 1, '#2a1c14'); R(x, 3, 14, 1, '#dce2ec'); };
        win(8); win(66);
        R(34, 2, 12, 30, '#2e1e12'); R(35, 3, 10, 29, '#5a3a22'); R(36, 6, 8, 1, '#3e2a18'); R(36, 14, 8, 1, '#3e2a18'); R(42, 17, 2, 2, '#c9a35a');
        R(28, 30, 24, 2, '#6a5a48');
      },
      gunrack(g, e, t, R) {
        R(1, 2, 14, 2, '#4a3424'); R(2, 4, 1, 9, '#3a281a'); R(13, 4, 1, 9, '#3a281a');
        if (!e.g1) { R(1, 6, 14, 1, '#2a2a2e'); R(1, 7, 14, 1, '#3a3a40'); R(11, 6, 4, 3, '#5a3a22'); }
        if (!e.g2) { R(1, 10, 14, 1, '#3a2a1a'); R(2, 11, 9, 1, '#5a4a3a'); R(10, 10, 5, 3, '#6a4a2a'); }
      },
      woodpile(g, e, t, R) { R(0, 2, 16, 12, '#3a2818'); for (let y = 0; y < 3; y++) for (let x = 0; x < 4; x++) { R(x * 4, 3 + y * 4, 4, 4, '#7a5a3a'); R(x * 4 + 1, 4 + y * 4, 2, 2, '#a07a50'); } R(0, 1, 16, 2, '#dce2ec'); R(6, 1, 2, 2, '#5e6880'); R(9, 1, 2, 2, '#5e6880'); },
      ccoop(g, e, t, R) {
        R(0, -6, 32, 21, '#5a4632'); R(-2, -10, 36, 5, '#dce2ec'); R(0, -5, 32, 1, '#3a2c1e');
        for (let x = 2; x < 30; x += 4) R(x, -4, 1, 18, '#3a2c1e');
        R(12, 4, 8, 10, '#120c08');
        const b = Math.sin(t * 6) > .6 ? 1 : 0; R(13, 9 - b, 3, 3, '#e8e0d0'); R(17, 10, 2, 2, '#c8a070'); R(14, 8 - b, 1, 1, '#c02020');
      },
      chimney(g, e, t, R) {
        // 利兹老宅剩下的砖烟囱：孤零零地戳着，砖上全是爪痕
        R(4, -46, 24, 60, '#5e3228'); R(2, -48, 28, 4, '#4a2a22'); R(2, -49, 28, 1, '#dce2ec');
        for (let y = -44; y < 12; y += 4) { R(4, y, 24, 1, '#3e2018'); for (let x = 4 + ((y / 4) & 1) * 4; x < 28; x += 8) R(x, y + 1, 1, 3, '#3e2018'); }
        R(24, -46, 4, 58, '#4a281e');
        R(8, 0, 16, 14, '#0c0606'); R(7, -1, 18, 2, '#3a2a24'); R(9, 10, 14, 4, '#1a1210');
        for (let i = 0; i < 3; i++) R(11 + i * 3, -14 + i, 1, 10, '#a08070');
        for (let i = 0; i < 3; i++) R(15 + i * 3, -36 + i, 1, 9, '#a08070');
        if (e.brick) R(19, -6, 5, 3, '#0c0606'); else R(19, -6, 5, 3, '#6e3a2e');
      },
      cradle(g, e, t, R) {
        R(1, 13, 14, 2, '#3a2416'); R(0, 12, 3, 2, '#3a2416'); R(13, 12, 3, 2, '#3a2416');
        R(2, 4, 12, 9, '#6a4a2a'); R(3, 5, 10, 6, '#2a1a10'); R(10, 0, 4, 6, '#5a3c22'); R(2, 4, 12, 1, '#8a6a42');
        if (!e.open) R(3, 5, 10, 3, '#c8d0dc');
        else { R(3, 7, 10, 4, '#0a0604'); if (!e.empty) { R(3, 6, 3, 3, '#8a3a2a'); R(6, 6, 3, 3, '#3a5a7a'); R(9, 6, 3, 3, '#c8b878'); } }
      },
      chest2(g, e, t, R) { R(1, 5, 14, 9, '#5a3a22'); R(1, 8, 14, 1, '#3a2414'); R(7, 7, 2, 3, '#8a8478'); if (e.open) { R(1, 1, 14, 4, '#4a3020'); R(2, 5, 12, 3, '#120a06'); } else R(1, 4, 14, 2, '#6a4a2a'); R(1, 3, 14, 1, '#dce2ec'); },
      wheel(g, e, t, R) { R(2, 10, 12, 4, '#5a4030'); R(3, 2, 8, 8, '#3a2818'); R(4, 3, 6, 6, '#0a0806'); R(6, 5, 2, 2, '#5a4030'); R(11, 4, 1, 8, '#5a4030'); R(2, 1, 6, 1, '#dce2ec'); },
      beam(g, e, t, R) { R(0, 6, 32, 6, '#4a3220'); R(0, 6, 32, 1, '#6a4a30'); R(0, 5, 32, 1, '#dce2ec'); R(24, 6, 8, 6, '#1a1210'); R(26, 7, 4, 2, '#3a1a10'); },
      deer(g, e, t, R) {
        const H = (x, y, w, h, c) => R(e.dir === 2 ? 16 - x - w : x, y, w, h, c), b = Math.sin(t * 18) > 0 ? 1 : 0;
        H(3, 2, 11, 6, '#8a6a4a'); H(3, 7, 10, 1, '#e8e0d0'); H(13, 2, 2, 2, '#f0ece0');
        H(4, 8, 1, 6 - b, '#6a4a32'); H(6, 8, 1, 5 + b, '#6a4a32'); H(11, 8, 1, 6 - b, '#6a4a32'); H(13, 8, 1, 5 + b, '#6a4a32');
        H(0, -4, 4, 7, '#8a6a4a'); H(-2, -2, 3, 3, '#7a5a3a'); H(0, -3, 1, 1, '#111'); H(1, -8, 1, 4, '#c8b898'); H(3, -8, 1, 4, '#c8b898'); H(0, -9, 1, 1, '#c8b898'); H(4, -9, 1, 1, '#c8b898');
      },
      fox(g, e, t, R) {
        const H = (x, y, w, h, c) => R(e.dir === 2 ? 16 - x - w : x, y, w, h, c);
        H(4, 7, 8, 4, '#b8582a'); H(4, 10, 8, 1, '#e8e0d0'); H(11, 6, 5, 3, '#c8682e'); H(14, 5, 2, 2, '#f0ece0');
        H(5, 11, 1, 3, '#2a1a10'); H(10, 11, 1, 3, '#2a1a10'); H(1, 5, 4, 4, '#c8682e'); H(0, 7, 2, 1, '#2a1a10'); H(1, 3, 1, 2, '#2a1a10'); H(4, 3, 1, 2, '#2a1a10');
        H(2, 6, 1, 1, Math.sin(t * 3) > .7 ? '#ffe080' : '#3a2a10');
        H(-2, 8, 3, 2, '#8a8478');   // 嘴里叼着的兔子
      },
      furnace(g, e, t, R) {
        // 废弃的沼铁炼铁炉：方锥形的石头炉身，正面一个拱形炉口
        R(2, -20, 44, 52, '#4e4a44'); R(8, -34, 32, 16, '#45413c'); R(12, -40, 24, 7, '#3a3632'); R(12, -41, 24, 2, '#dce2ec'); R(6, -22, 36, 2, '#dce2ec');
        for (let y = -32; y < 30; y += 5) for (let x = (y & 1) ? 4 : 8; x < 44; x += 9) R(x, y, 6, 3, '#5a564e');
        R(40, -18, 6, 50, '#3a3632');
        R(16, 12, 16, 20, '#0a0808'); R(17, 10, 14, 2, '#0a0808'); R(19, 9, 10, 1, '#0a0808');
        R(17, 27, 14, 5, '#3a2a1a'); R(18, 26, 4, 2, '#5a3a22'); R(25, 25, 4, 3, '#4a3020');   // 窝：雪松皮和松针
        if (e.quilt) { R(18, 23, 12, 6, '#8a3a2a'); R(18, 23, 4, 3, '#3a5a7a'); R(22, 26, 4, 3, '#c8b878'); R(26, 23, 4, 3, '#4a6a3a'); R(26, 26, 4, 3, '#d8d0c0'); }
        if (e.glow) R(16, 12, 16, 20, 'rgba(255,190,120,.12)');
      },
      grave(g, e, t, R) { R(4, 5, 8, 9, '#6a6864'); R(5, 4, 6, 2, '#6a6864'); R(4, 3, 8, 2, '#dce2ec'); R(3, 13, 10, 2, '#5a5854'); if (e.k) { R(7, 15, 2, 1, '#5e6880'); } },
      rwell(g, e, t, R) { R(1, 4, 14, 10, '#5a5650'); R(3, 6, 10, 6, '#0a0a0c'); R(2, 5, 12, 2, '#6a4a30'); R(1, 3, 14, 2, '#dce2ec'); }
    },
    tiles: {
      snow: { solid: false, paint: pSnow },
      snowp: { solid: false, paint(R, X, Y) { pSnow(R, X, Y); const o = hash(X, Y, 61) < .5 ? 0 : 1; R(3 + o, 2, 3, 5, '#8e98ac'); R(4 + o, 3, 1, 3, '#76809a'); R(10 - o, 9, 3, 5, '#8e98ac'); R(11 - o, 10, 1, 3, '#76809a'); } },
      needle: { solid: false, paint(R, X, Y) { speck(R, '#3e3226', ['#5a4228', '#6e4e2c', '#2e261c', '#8a6a3a'], X, Y, 24, 45); if (hash(X, Y, 46) < .5) R((hash(X, Y, 47) * 14) | 0, (hash(X, Y, 48) * 14) | 0, 2, 1, '#9aa2b2'); } },
      ice: { solid: false, paint(R, X, Y) { R(0, 0, 16, 16, '#7f9cb2'); speck(R, '#7f9cb2', ['#93aec2', '#6f8ca2', '#a8c0d2'], X, Y, 10, 49); const a = (hash(X, Y, 50) * 10) | 0, b = (hash(X, Y, 51) * 12) | 0; R(a, b, 6, 1, '#c8dcea'); R(a + 5, b + 1, 4, 1, '#c8dcea'); if (hash(X, Y, 52) < .4) R(b, a, 1, 5, '#5f7c92'); } },
      spine: { solid: true, paint(R, X, Y) { pPine(R, X, Y, '#14261c', '#c8d2de'); } },
      cedar: { solid: true, paint(R, X, Y) { pSnow(R, X, Y); const c = '#0e1c1a'; R(6, 0, 4, 15, c); R(4, 3, 8, 3, c); R(3, 7, 10, 3, c); R(2, 11, 12, 3, c); R(5, 3, 3, 1, '#c8d2de'); R(4, 7, 4, 1, '#c8d2de'); R(3, 11, 5, 1, '#c8d2de'); R(9, 8, 2, 1, '#1e3430'); R(7, 15, 2, 1, '#2a1c12'); } },
      soak: { solid: true, paint(R, X, Y) { pSnow(R, X, Y); const c = '#4e4640'; R(7, 6, 2, 10, c); R(3, 4, 5, 1, c); R(8, 3, 5, 1, c); R(4, 1, 1, 4, c); R(11, 0, 1, 4, c); R(6, 2, 1, 3, c); R(3, 3, 3, 1, '#dce2ec'); R(9, 2, 3, 1, '#dce2ec'); R(10, 15, 3, 1, '#9aa2b2'); } },
      srock: { solid: true, paint(R, X, Y) { pSnow(R, X, Y); R(2, 6, 12, 8, '#5a5854'); R(3, 5, 10, 2, '#6a6864'); R(3, 4, 10, 2, '#dce2ec'); R(2, 13, 12, 2, '#3a3836'); R(9, 8, 3, 2, '#4a4844'); } },
      rwall: { solid: true, paint(R, X, Y) { R(0, 0, 16, 16, '#3e3a36'); const o = Y % 2 ? 4 : 0; for (let i = -1; i < 3; i++) { R(o + i * 8 + 1, 4, 6, 5, shade('#625e56', (hash(X, Y, i) - .5) * .25)); R(((o + 4) % 8) + i * 8 + 1, 10, 6, 5, shade('#625e56', (hash(X, Y, i + 9) - .5) * .25)); } R(0, 0, 16, 4, '#d2dae6'); R(0, 3, 16, 1, '#aab2c2'); } },
      rubble: { solid: false, paint(R, X, Y) { speck(R, '#aeb6c4', ['#8a8478', '#6a6058', '#c4ccd8', '#5a4a3a'], X, Y, 22, 53); if (hash(X, Y, 54) < .25) { R(2, 7, 9, 2, '#5a4232'); R(2, 7, 9, 1, '#6e5440'); } if (hash(X, Y, 55) < .2) R(10, 3, 3, 2, '#6a3a2e'); } },
      sreed: { solid: true, paint(R, X, Y) { speck(R, '#4a4432', ['#6a5e40', '#3a3426'], X, Y, 10, 56); for (let i = 0; i < 7; i++) { const x = (hash(X, Y, 57 + i) * 15) | 0; R(x, 2 + (i % 3), 1, 13, i % 2 ? '#a08a5a' : '#8a7a52'); R(x, 1 + (i % 3), 1, 1, '#dce2ec'); } } },
      cwater: { solid: true, paint(R, X, Y) { R(0, 0, 16, 16, '#241a12'); for (let i = 0; i < 3; i++) R((hash(X, Y, 60 + i) * 12) | 0, (hash(X, Y, 63 + i) * 14) | 0, 4, 1, '#3a2a1c'); if (hash(X, Y, 66) < .3) R(2, 2, 3, 1, '#4a3a2a'); } }
    },
    maps: {
      /* ---------------- 外公的木屋 ---------------- */
      cabin: {
        amb: 'room', dark: .42, plr: 3, wall: 'wood', floor: 'wood', tileOpts: { woodC: '#5a3e28', rugC: '#6a2a22' },
        rows: [
          '################',
          '################',
          '#..............#',
          '#..............#',
          '#...rrrr.......#',
          '#...rrrr.......#',
          '#..............#',
          '#..............#',
          '#..............#',
          '#######.########'],
        ents: [
          { id: 'hearth', x: 6, y: 2, w: 2, spr: 'fireplace', light: { r: 4.4, col: 'rgba(255,150,60,.24)', flick: true }, on: S => S.narr(S.f.zeke ? '松木疙瘩烧得噼噼啪啪，爆出一股松油的香味。\n外公说，它是从烟囱里飞出去的。所以它到哪儿，都先找烟囱。' : '壁炉里烧着松木疙瘩，噼噼啪啪地爆着松油。\n昨天夜里，蹄声就是顺着这根烟囱传下来的：咯哒，咯哒，绕着烟囱走了一圈，又一圈。') },
          { id: 'cwin1', x: 2, y: 1, spr: 'window', light: { r: 2, col: 'rgba(160,180,230,.08)', dy: 24 }, on: S => S.narr('窗外的雪地被月亮照得发蓝。松林黑压压的，一直连到天边。\n这一带的人说，松林里走丢的东西，从来找不回来。') },
          { id: 'cwin2', x: 13, y: 1, spr: 'window', light: { r: 2, col: 'rgba(160,180,230,.08)', dy: 24 }, on: S => S.narr('窗玻璃上结了一层冰花。你哈了口气，擦出一小块——\n院子里，屋檐底下的雪地上，砸出一个坑。像是有什么很重的东西，从屋顶上跳了下来。') },
          { id: 'clock', x: 4, y: 1, spr: 'wallclock', on: S => S.narr('墙上的钟指着九点四十。\n舅舅说，他们半夜在利兹角动手。') },
          { id: 'rack', x: 11, y: 1, spr: 'gunrack', on: async S => {
            const r = S.ent('rack');
            if (!r.s.g1) return S.narr('墙上挂着两杆枪：上面是舅舅的双管猎枪，下面是外公那杆老火枪。');
            if (!r.s.g2) return S.narr('上面那根钉子空了——舅舅把猎枪摘走了。\n下面挂着外公的老火枪，枪托磨得发亮。');
            return S.narr('枪架空了。两根钉子之间，墙上留着一道浅浅的印子。');
          } },
          { id: 'lanternE', x: 9, y: 1, spr: 'lantern', light: { r: 1.6, col: 'rgba(255,190,90,.18)' }, on: async S => {
            if (S.has('lantern')) return S.narr('挂马灯的钉子空着。');
            if (!S.f.zeke) return S.narr('门边挂着一盏铁皮马灯。外公说过，天黑以后不许一个人往松林里去。');
            S.hide('lanternE'); S.give('lantern'); S.sfx('match'); S.plr(3.4);
            await S.narr('你摘下马灯，划着火柴。灯芯「噗」地亮了，铁皮灯罩一下子暖起来。');
            S.goal('跟着屋顶上下来的那串蹄印走（出门往外走）');
          } },
          { id: 'bed', x: 14, y: 2, h: 2, spr: 'bed', col: '#6a4a5a', on: S => S.narr('外公的床。床上铺着外婆缝的百衲被，九格，洗得发白。\n外婆走的那年冬天，外公说：「一床被子，能把一家人缝在一块儿。」') },
          { id: 'shelf', x: 1, y: 2, spr: 'shelf', on: S => S.narr('架子上摆着几罐红莓酱，一盒猎枪子弹，一本翻烂了的历书。\n历书封面上印着天象、潮汐，还有一句：「勤俭持家」。') },
          { id: 'rocker', x: 3, y: 3, spr: 'armchair', col: '#5a3a28', on: S => S.narr('外公的摇椅，扶手被磨得发亮。椅背上搭着一条羊毛围巾。') },
          { id: 'table', x: 9, y: 4, w: 2, spr: 'table2', col: '#5a3c24', on: S => S.narr('松木桌子。桌上压着一盏油灯，灯底下是一沓剪报。') },
          { id: 'papers', x: 9, y: 4, spr: 'newspaper', z: 1, solid: false, on: async S => { if (S.once('papers')) await S.narr('一沓剪报，边上被油灯熏黄了。'); await S.note('papers'); } },
          { id: 'berries', x: 13, y: 7, spr: 'basket', on: S => S.narr('一筐冻得硬邦邦的红莓，是去年秋天在沼地里收的。\n红莓地是赊账种的。舅舅说，再收两季，才还得清。') },
          { id: 'zeke', x: 5, y: 4, spr: '@zeke', dir: 0, on: zekeTalk },
          { id: 'wade', x: 7, y: 8, spr: '@wade', dir: 3, hidden: true },
          { id: 'cdoor', x: 7, y: 9, spr: 'invisible', touch: cabinDoor }
        ],
        async enter(S, first) {
          if (!first) { S.face('zeke', 'pl'); return; }
          S.face('zeke', 'pl');
          await S.wait(500);
          S.sfx('open'); S.amb('wind');
          S.place('wade', 7, 8, 3); S.show('wade');
          await S.walk('wade', [8, 6], 4);
          S.face('wade', 'zeke'); S.amb('room');
          await S.say('韦德舅舅', ['老头！你听说了没有？西科灵斯伍德那边，消防队拿水龙头冲它，冲完了它还飞了！', '费城动物园出了价——一万块！活的要，死的也要。']);
          await S.say('齐克外公', '那是报纸说的。');
          await S.say('韦德舅舅', ['报纸说的还能有假？学校都停课了，厂子都关门了！', '这几天夜里它都往利兹角飞。今晚我们十几个人，带上枪，半夜就在利兹家那座老宅子跟前守着。']);
          S.face('wade', 3); await S.wait(300);
          S.ent('rack').s.g1 = true; S.sfx('switch');
          await S.narr('舅舅从墙上摘下了他的双管猎枪。');
          await S.say('齐克外公', '韦德。它不吃人。');
          await S.say('韦德舅舅', '它把霍尔家的鸡都吓死了！');
          await S.say('齐克外公', '咱家的鸡，它一只也没碰。昨天夜里它就在咱房顶上。');
          await S.say('韦德舅舅', ['……那是它还没顾上。', '露丝，看好你外公。别让他出门。一万块，够把红莓地的账还三回。']);
          await S.walk('wade', [7, 8], 4);
          S.sfx('close'); S.hide('wade');
          await S.narr('门「砰」地一声关上了。屋外，舅舅的靴子踩着雪，咯吱咯吱地走远了。');
          S.face('zeke', 'pl');
          await S.say('齐克外公', '露丝。过来，坐下。');
          S.goal('和外公说话');
        }
      },
      /* ---------------- 松林（追踪） ---------------- */
      pines: {
        amb: 'wind', dark: .86, plr: 2.2, floor: 'snow', floor2: 'needle',
        legend: { 'P': 'spine', 'T': 'soak', 'K': 'srock' },
        rows: [
          'PPPTPPTPTPTTPPPP..PPPTPPPTPPPPPPPTTPPPPP',
          'PPPPPPPPPPPTPPPP..PPPPPPPPPPPPTPPPPPPPTP',
          'PTTPPPPPTPPPPPPP..PPPPPPPPTPPPPPPPPTPPPP',
          'PPTPTTPPPTTPTPTP..PPPPPPPPTTPPPPTPPPPTPP',
          'PPPPPPPPPPPPPPPP..PTTPPPPPPPPPPPPPPPPPPP',
          'TPPPPPPPPPPP..........PPPPPTPPPPPPP..PPP',
          'PPP.........,..........PPPTPP..PPPP..PPP',
          'PPP...........K........PPPPPP..PPPP..PPT',
          'PPTPPPTPPPT..........,.PTTPPT..PTPT..PPP',
          'PPPPTPTPPPPP..........PTPPPPP..PPPP..PTP',
          'TPPPTPPPPPPPPPPP..PPPPTPPPPPT..PTTP..PPP',
          'PPPPPPPPTPPPPPPP..PPPPPPPTPPT..PPPP..PPP',
          'PTPPTPPPPPPPPPPP..PPPPPTTPPPP..PPTP..PTP',
          'PPPPPPPPPPPPPPPP..PTTPPPPPPPT..PPPP..PPP',
          'PPPTTPPPPPPPPPPP..PPPTPPPPPP.........PPP',
          'PPPPPPPPPPPTPTPP..PPPPPPTPP.,.........PT',
          'TPPPPTPPPPPPTPPP..................K...PT',
          'PPPPPPPPPPPTPPPP......................PP',
          'PPPPPPPTTPPPPPPPPPPTPPPPPTP.........,.PP',
          'PPPTPPPTTTPPPPPPPPPPPPTPPPPP..........PP',
          'PPPPPPPTPPPTTPPPPPP..PPPPPPPPPPP..PPPPPP',
          'PPPPPPPPPPPTPPPPTPT..PPPPPPPPTPP..PPPPPP',
          'TPPPPPPPTTPPPTPPPPP..PPPPPPPPPTP..PPPPTP',
          'PPTPPPPPPPTPPPPPPPP..PPPPPPPPPPP..PPPPPP',
          'TPPTPTPPPPPPPPPPTPP..PPPPTPPTPPT..PPPTPP',
          'PPPPPPPPPPPPPPTPPPP..PPPPPPPTPPP..PPTPPP',
          'PPPPTPPPPPPPPPPPPTP..PPPPTTPPPPP..PTTPTP',
          'PPPPPPPPPPTPPPP..........PTPPPTP..PPPPPP',
          'PPPPT..........,..................PPPPPP',
          'PPPPP............K................PPPPTP',
          'PPTPTTPPPPPPTT..........,.PPTPPPPPPPPTPP',
          'TPPPTPPPPPPPPPP..........PPPPTPTPPPPPPPP',
          'PPPPPPPPPPPPPPPPPPP..PPPPPPPPPPPTPTPPPPP',
          'PPTPPTPPPPPPPPPPPPP..PPPPPPPPPPPTPPPPPPP',
          'PPPPPPPPPPTPPPPPTPP..PPPPPPPPPPPPTPPTPPP',
          'PPPPPPPPPPPPPPPPPPP..PPPPPPPPPPPPPTPPPPP',
          'PPPPPPTPPPPPPTTPPPT..PPPPPPPPPPPPPPPPPPP',
          'PPPPPTPPPPPP................PPPPPTPPPPPP',
          'PPPPPPPPPPP..,...............PPPPPPPPPPP',
          'PPPPPTPTPPP..................PTPPPPPPTPP',
          'PTTPPPTPPTP..................PPTPPPPPTPP',
          'PPPPPPPPPPP..................PPPTPPPPPTP',
          'PPPPPPPPPTP...............,..PPPPPPPPPPP',
          'PPPTPPTPPPPP................PPTTPPPPPTPP',
          'TPPPPPPPPPPPPTPPPPPTPPPPTPPPPPPPTPPPPPPP',
          'PTPPTPPPPPPPTPPPPPPPPPPTPPPPPPPPPPPPPPTP'],
        ents: [
          /* 院子 */
          { id: 'cabinx', x: 17, y: 39, w: 6, h: 2, spr: 'cabinx', light: { r: 2.6, col: 'rgba(255,170,80,.16)', dx: 48, dy: 26 } },
          { id: 'cdoorO', x: 19, y: 40, spr: 'invisible', solid: true, on: async S => { S.sfx('open'); await S.go('cabin', 7, 8, 3); } },
          { id: 'roof', x: 21, y: 40, spr: 'invisible', solid: true, on: S => S.narr('屋顶的雪上，一串蹄印从屋脊那头走过来，绕着烟囱转了两圈，在烟囱跟前停了很久——雪都踩实了。\n然后，到屋檐边就没了。') },
          { id: 'cwinO', x: 18, y: 40, spr: 'invisible', solid: true, on: S => S.narr('窗户里透出炉火的光。外公坐在里面，一动不动地看着火。') },
          { id: 'crater0', x: 23, y: 41, spr: 'crater', decal: true, on: S => S.narr('屋檐底下的雪地上砸出一个坑，像是有什么很重的东西从屋顶上跳了下来。\n坑边上接出一串蹄印——一个接一个，往北，进了松林。') },
          { id: 'wpile', x: 12, y: 40, spr: 'woodpile', on: S => S.narr('劈好的松木码得整整齐齐。最上面一层的雪被踩塌了一块——\n是一个圆头的、两瓣的蹄印。') },
          { id: 'ccoop', x: 25, y: 40, w: 2, spr: 'ccoop', on: S => S.narr('鸡窝里，母鸡们挤成一团，一只也不少。\n它们一声也不敢吭。') },
          ...trail('t0', 'dev', [[23, 40, 3], [23, 39, 3], [22, 38, 1], [21, 38, 1], [20, 37, 3], [20, 36, 3], [19, 35, 3], [20, 34, 3], [19, 33, 3], [19, 32, 3]]),
          /* 第一个岔口 */
          { id: 'h1L', x: 13, y: 28, solid: false, spr: 'trk', k: 'deer', dir: 1, on: S => S.narr('西边这串：两行蹄印，左右错开，一前一后。\n每个印子是两瓣尖尖的，像一颗倒过来的心。步子一样长，规规矩矩。') },
          ...trail('t1L', 'deer', [[12, 29, 1], [10, 28, 1], [9, 29, 1], [7, 28, 1]]),
          { id: 'h1U', x: 19, y: 26, solid: false, spr: 'trk', k: 'boot', dir: 3, on: S => S.narr('北边这串：一大片乱糟糟的钉靴印，四五个人；中间夹着一串狗爪印。\n雪上扔着一个烟头，一根没烧完的火柴。……是往大路那边去的。') },
          ...trail('t1U', 'boot', [[20, 25, 3], [19, 24, 3], [20, 23, 3]]),
          { id: 'h1R', x: 26, y: 29, solid: false, spr: 'trk', k: 'dev', dir: 2, on: S => S.narr('东边这串：一行蹄印，一个接一个排成一条线。\n每个印子是两瓣，头却是圆的，像小马驹的蹄子，只有茶杯口那么大。\n步子忽长忽短。有一处，隔了一丈多才又接上。') },
          ...trail('t1R', 'dev', [[28, 28, 2], [29, 29, 2], [32, 28, 2], [33, 26, 3], [32, 25, 3], [33, 23, 3], [32, 21, 3]]),
          { id: 'sc1', x: 31, y: 26, spr: 'scr', solid: true, on: S => S.narr('松树的树皮上有三道新鲜的爪痕，比你高出一头，木头茬子还是白的。\n松油顺着爪痕淌下来，还没冻住。') },
          /* 第二个岔口 */
          { id: 'h2U', x: 35, y: 13, solid: false, spr: 'trk', k: 'fox', dir: 3, on: S => S.narr('东北这串：一串小小的印子，一个接一个，排成一条笔直的线，一下都没歪。\n每个印子前头，有四个小点。') },
          ...trail('t2U', 'fox', [[36, 11, 3], [35, 9, 3], [36, 7, 3]]),
          { id: 'h2B', x: 30, y: 13, solid: false, spr: 'trk', k: 'old', dir: 3, on: S => S.narr('正北这串：又是那种圆头的两瓣蹄印，一行，步子忽长忽短。\n可印子里积了一层薄薄的雪，边是软的、塌的。你用手指一按，没有声音。') },
          ...trail('t2B', 'old', [[29, 11, 3], [30, 10, 3], [29, 8, 3]]),
          { id: 'h2L', x: 26, y: 16, solid: false, spr: 'trk', k: 'dev', dir: 1, on: S => S.narr('西边这串：圆头的两瓣蹄印，一行。\n印子的边又硬又脆，你用手指一碰，「咔」地碎成了小冰碴。印子底上，雪被踩得发亮。') },
          ...trail('t2L', 'dev', [[24, 17, 1], [23, 16, 1], [19, 16, 1], [17, 15, 3], [16, 13, 3], [17, 12, 3], [16, 10, 3]]),
          { id: 'sc2', x: 22, y: 15, spr: 'scr', solid: true, on: S => S.narr('又是三道爪痕，比人高一头。树皮被撕开了，一绺一绺地翘着。\n爪痕底下的雪上，落着几根粗硬的、黑褐色的毛。') },
          ...trail('beh', 'dev', [[25, 16, 1], [26, 17, 1], [27, 16, 1]], true),
          { id: 'ktrap', x: 28, y: 18, spr: 'invisible', decal: true, on: S => S.narr('雪里埋着一只生锈的捕兽夹，夹子合着，夹住的是一截松枝。\n夹子边上，一圈雪化过又冻上了。像是有什么东西在这儿站了很久，低头看它。') },
          /* 第三个岔口 */
          { id: 'sign3', x: 21, y: 5, spr: 'sign', col: '#5a3a22', on: S => S.narr('一块歪倒的木牌：「利兹角　三英里」。字是拿烧红的铁条烙上去的。\n木牌背面，有人用小刀刻了一行小字：「它在看着」。') },
          { id: 'h3L', x: 10, y: 6, solid: false, spr: 'trk', k: 'fake', dir: 1, on: S => S.narr('西边这串：圆头的两瓣蹄印，一行，边是脆的——是新的。\n每一步都一样长，一样深，像拿尺子量过。印子底上有一道一道细细的纹，像木头的纹路。\n旁边还有一串小鞋印，脚尖朝着你。') },
          ...trail('t3L', 'fake', [[9, 6, 1], [8, 6, 1], [7, 6, 1], [6, 6, 1], [5, 6, 1]]),
          ...trail('t3K', 'kid', [[9, 7, 1], [7, 7, 1], [5, 7, 1]]),
          { id: 'h3U', x: 17, y: 4, solid: false, spr: 'trk', k: 'dev', dir: 3, on: S => S.narr('北边这串：圆头的两瓣蹄印，一行，新的。\n步子乱得很——一步短，一步长；有一步深得像是从高处跳下来的，雪溅出去一圈。') },
          ...trail('t3U', 'dev', [[16, 3, 3], [16, 2, 3, true], [17, 1, 3]]),
          { id: 'sc3', x: 15, y: 2, spr: 'scr', solid: true, on: S => S.narr('印子到这棵松树底下就没了。树皮上三道爪痕，一直抓到你够不着的地方。\n树枝上的雪被扑掉了一大片。……往前几步，雪地上砸出一个坑，印子又接上了。') },
          { id: 'crater3', x: 17, y: 1, spr: 'crater', decal: true },
          /* 走错路会碰见的 */
          { id: 'deer1', x: 6, y: 28, spr: 'deer', dir: 2, solid: false, hidden: true },
          { id: 'pos1', x: 19, y: 21, spr: '@posse', dir: 0, solid: false, hidden: true, light: { r: 2.4, col: 'rgba(255,180,80,.18)' } },
          { id: 'pos2', x: 20, y: 20, spr: '@posse2', dir: 0, solid: false, hidden: true },
          { id: 'fox1', x: 35, y: 7, spr: 'fox', dir: 1, solid: false, hidden: true },
          { id: 'boyA', x: 4, y: 6, spr: '@boy', dir: 2, solid: false, hidden: true },
          { id: 'boyB', x: 3, y: 7, spr: '@boy2', dir: 2, solid: false, hidden: true },
          { id: 'dvp', x: 30, y: 6, spr: 'devil', dir: 0, solid: false, hidden: true, s: { fly: true } },
          ...[16, 17].map(x => ({ id: 'exN' + x, x, y: 0, spr: 'invisible', touch: toRuin }))
        ],
        async enter(S, first) {
          if (S.has('lantern')) S.plr(3.4);
          if (!first) return;
          await S.narr('屋外，雪停了。月亮从云缝里钻出来，把整片松林照得发蓝。\n冷气一下子钻进了领口。');
          await S.narr('屋檐底下的雪地上有一个坑。坑边上，一串蹄印往北，进了松林。');
          await S.think('外公的口诀……我记的那张纸，在「笺」里。');
          S.goal('跟着蹄印进松林（遇到岔路先蹲下看清楚，对照「笺」里外公的口诀）');
          if (S.coop) S.toast('两个人：一个翻「笺」念外公的口诀，一个蹲下看蹄印');
          S.cp('pines');
        },
        step(S, x, y) {
          const f = S.f, k = f.fk || 0;
          if (k === 0) {
            if (y >= 28 && y <= 29 && x <= 8) return wrong(S, 1, 'deer');
            if ((x === 19 || x === 20) && y <= 22) return wrong(S, 1, 'posse');
            if (y >= 28 && y <= 29 && x >= 28) return right(S, 1);
          }
          if (k === 1) {
            if ((x === 35 || x === 36) && y <= 9) return wrong(S, 2, 'fox');
            if ((x === 29 || x === 30) && y <= 10) return wrong(S, 2, 'old');
            if ((y === 16 || y === 17) && x <= 24) return right(S, 2);
          }
          if (k === 2 && !f.behind && (y === 16 || y === 17) && x <= 20) return behind(S);
          if (k === 2) {
            if ((y === 6 || y === 7) && x <= 6) return wrong(S, 3, 'fake');
            if ((x === 16 || x === 17) && y <= 3) return right(S, 3);
          }
          if (y >= 28 && y <= 29 && x <= 8 && k > 0 && S.once('deerBack')) return S.narr('那串两行的鹿蹄印。你已经认得它了。');
        }
      },
      /* ---------------- 利兹角：老宅废墟 ---------------- */
      ruin: {
        amb: 'wind', dark: .82, plr: 3.4, floor: 'snow', floor2: 'needle',
        legend: { 'P': 'spine', 'Q': 'rwall', 'x': 'rubble', 'e': 'sreed', '~': 'cwater', 'i': 'ice' },
        rows: [
          'PPPPPPPPPPPPPPPPPPPPPPPeeeee',
          'PPPPPPPPPPPPPPPPPPPPPPPeeeee',
          'PPPP..................Pe~~~~',
          'PPP....................e~~~~',
          'PP.....QQQxQQQQQQQQ....e~~~~',
          'PP..P..QxxxxxxxxxxQ.P..e~~~~',
          'PP.....QxxxxxxxxxxQ....e~~~~',
          'PP.....QxxxxxxxxxxQ....e~~~~',
          'PP.....Qxxxxxxxxxxx.....eeee',
          'PP.....QxxxxxxxxxxQ.....iii.',
          'PP...,.QxxxxxxxxxxQ.....iii.',
          'PP.....QxxxxxxxxxxQ.....eeee',
          'PP.....QQQQQxxQQQQQ....e~~~~',
          'PP.....................e~~~~',
          'PP.....................e~~~~',
          'PP...P...,.............e~~~~',
          'PP...............,.....e~~~~',
          'PP.....................e~~~~',
          'PPPP.................PPeeeee',
          'PPPPPPPPPPPP...PPPPPPPPeeeee'],
        ents: [
          { id: 'chim', x: 11, y: 4, w: 2, spr: 'chimney', on: chimOn },
          { id: 'rtable', x: 8, y: 6, w: 2, spr: 'table2', col: '#4a3422', on: S => S.narr('一张倒了一条腿的桌子，桌面斜搭在地上，积满了雪。') },
          { id: 'bibleE', x: 9, y: 6, spr: 'book', col: '#3a2a22', z: 1, solid: false, on: bibleOn },
          { id: 'cradle', x: 15, y: 10, spr: 'cradle', on: cradleOn },
          { id: 'rchest', x: 17, y: 5, spr: 'chest2', on: async S => {
            S.ent('rchest').open = true;
            await S.narr('一口橡木箱子，箱盖早被人撬开了。里面空空的，只有老鼠做的一个窝。');
            if (S.once('chest2')) await S.narr('箱盖内侧刻着一个字母：「L」。\n……来翻过这口箱子的人，不止一拨。他们要找的东西，不在箱子里。');
          } },
          { id: 'rwheel', x: 9, y: 10, spr: 'wheel', on: S => S.narr('一架纺车，轮子散了架，歪在雪里。\n十二个孩子的衣裳，大概都是在这架纺车上纺出来的。') },
          { id: 'rbeam', x: 13, y: 8, w: 2, spr: 'beam', on: S => S.narr('塌下来的房梁，烧焦了一头。\n松林里的人说，这座宅子后来着过一场火，是谁放的，没人说得清。') },
          { id: 'rwell', x: 4, y: 8, spr: 'rwell', on: S => S.narr('一口老井，井口盖着朽了的木板。\n你往里看了一眼。井底的冰面上，映着月亮，和你的马灯。') },
          { id: 'gr1', x: 20, y: 14, spr: 'grave', on: S => S.narr('一块没有字的小石头。\n这一带的贵格会不兴在墓碑上刻字，也不兴刻花样。') },
          { id: 'gr2', x: 21, y: 15, spr: 'grave', on: S => S.narr('又是一块。和旁边那块一样大，一样不说话。') },
          { id: 'gr3', x: 19, y: 16, spr: 'grave', k: 1, on: S => S.narr('第三块石头上落着一层雪。雪上有一个蹄印——只有一个。\n像是有谁在这儿站了一会儿，低着头。') },
          { id: 'marsh', x: 23, y: 13, spr: 'invisible', solid: true, on: S => S.narr('盐沼的芦苇冻得硬邦邦的。再往东，就是大湾。海风里有一股咸味。\n东边那条冻上的水道，冰面看着还算结实。') },
          { id: 'dv_r', x: 11, y: 1, spr: 'devil', dir: 0, solid: false, hidden: true, z: 1, ox: 8, oy: -18, s: { fly: false }, light: { r: 1, col: 'rgba(255,40,20,.25)', dy: -16 } },
          { id: 'wade_r', x: 13, y: 19, spr: '@wade', dir: 3, solid: false, hidden: true, light: { r: 2.6, col: 'rgba(255,180,80,.18)' } },
          ...[12, 13, 14].map(x => ({ id: 'exS' + x, x, y: 19, spr: 'invisible', touch: ruinSouth })),
          ...[9, 10].map(y => ({ id: 'exE' + y, x: 27, y, spr: 'invisible', touch: ruinEast }))
        ],
        async enter(S, first) {
          if (!first) return;
          await S.narr('松林在这儿到了头。前面是一片白茫茫的盐沼，再往东，能听见海浪。\n利兹角。');
          await S.narr('老宅子只剩一圈石头地基，和一根孤零零的砖烟囱，直直地戳在月亮底下。\n雪地上，那串蹄印绕着烟囱，转了一圈又一圈。');
          await S.think('它每天夜里都回来。回来找什么？');
          S.goal('在老宅里找利兹妈妈的百衲被');
          S.cp('ruin');
        }
      },
      /* ---------------- 雪松沼泽（它反过来追踪你） ---------------- */
      swamp: {
        amb: 'wind', dark: .86, plr: 3.4, floor: 'snow', floor2: 'needle', speed: .7,
        legend: { 'C': 'cedar', 'i': 'ice', '~': 'cwater', 'e': 'sreed', 'K': 'srock', 'p': 'snowp' },
        rows: [
          'CCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCC',
          'CCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCC',
          'CCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCC',
          'CCCCCCCCCCCCCCCCCCCCCCCCCiiiiC...,,,,.CCCCCCCC',
          'CCCCCCCCCCCCCCCCC........iiii....,,,,.CCCCCCCC',
          'CCCCCCCCCCCCCC,,,........iiii....,,,,.CCCCCCCC',
          'C.....CCCCCCCC,,,........iiii..CC...........CC',
          'C.....C.......,,,.....C..iiii..CC............C',
          '..........C...,,,........iiii................C',
          'C............C,,,........iiii.........K......C',
          'C.....CCCCCCCC,,,..~~~~eCiiii................C',
          'CCCCCCCCCCCCCCCCC..~~~~eCiiiiC...............C',
          'CCCCCCCCCCCCCCCCCCe~~~~CeiiiiCCCCCCC........CC',
          'CCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCC',
          'CCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCC',
          'CCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCC'],
        ents: [
          { id: 'furn', x: 40, y: 6, w: 3, h: 2, spr: 'furnace', s: {} },
          { id: 'dv', x: 1, y: 8, spr: 'devil', dir: 2, solid: false, hidden: true, z: 1, s: { fly: false, sniff: false }, light: { r: 1, col: 'rgba(255,40,20,.28)', dy: -4 } },
          { id: 'wade_s', x: 34, y: 9, spr: '@wade', dir: 2, solid: false, hidden: true, light: { r: 2.8, col: 'rgba(255,180,80,.2)' } },
          { id: 'pos1s', x: 33, y: 10, spr: '@posse', dir: 2, solid: false, hidden: true, light: { r: 2.2, col: 'rgba(255,180,80,.16)' } },
          { id: 'pos2s', x: 33, y: 8, spr: '@posse2', dir: 2, solid: false, hidden: true },
          { id: 'mom', x: 41, y: 8, spr: '@mother', dir: 0, solid: false, hidden: true, light: { r: 2.4, col: 'rgba(255,220,170,.18)' } }
        ],
        async enter(S, first) {
          if (!first) return;
          S.norun(true);
          await S.narr('雪松沼泽。白雪松长得又高又密，枝子被雪压得低低的。\n雪一下子深到了小腿肚——跑不起来，只能一步一步地拔着腿往前走。');
          S.pos(0, 8, 2);
          await S.walk('pl', [5, 8], 3);
          wings(S, 5, 0, .34, .5);
          await S.narr('身后很远的地方，翅膀扑了几下，停了。');
          await S.wait(600);
          S.sfx('whisper');
          await S.narr('然后是一种声音。很轻，一下一下的。\n像狗趴在地上，在闻什么东西。');
          S.turn(1);
          await S.narr('你回过头。马灯照着你自己的脚印——一个一个，从盐沼那边一直跟到你脚下。');
          await S.think('它在闻我的脚印。\n雪地上的每一个脚印，都是给它指的路。');
          await S.narr('松针底下没有雪。冻住的水面上，也踩不出印子。');
          S.goal('往东找它的窝——别在雪地上停；踩松针、踩冰面不留脚印（冰上别久站）');
          if (S.coop) S.toast('一个人看前面的路，一个人盯着身后');
          S.turn(2);
          S.cp('swamp');
          await startSwamp(S, false);
        },
        step(S, x, y) {
          if (S.f.ph === 'chase' && x >= 38) return reachNest(S);
        }
      }
    }
  });

  /* ================= 小工具 ================= */
  // 一串脚印实体（只做装饰，不带 on；每个都有 id）：[x, y, dir, gap?]
  function trail(pre, k, cells, hidden) {
    return cells.map(([x, y, dir, gap], i) => ({ id: pre + '_' + i, x, y, dir, spr: 'trk', k, gap: !!gap, decal: true, hidden: !!hidden }));
  }

  /* ================= 木屋 ================= */
  async function zekeTalk(S) {
    const f = S.f; S.face('zeke', 'pl');
    if (!f.zeke) {
      const r = await S.ask('外公拍了拍身边的小板凳。\n「昨天夜里，屋顶上的动静，你也听见了吧？」', ['听见了。像有人在屋顶上走。', '……我以为是风。'], '露丝');
      if (r === 1) await S.say('齐克外公', '风不会绕着烟囱走两圈。');
      await S.say('齐克外公', ['它在屋顶上站了好久，就站在烟囱跟前。', '它在找烟囱。']);
      await S.say('齐克外公', ['我奶奶跟我讲过。一百七十多年前，利兹角有个女人，大家都叫她利兹妈妈。', '她已经有了十二个孩子，家里穷得揭不开锅。怀上第十三个的时候，她说了一句气话——']);
      S.sfx('whisper');
      await S.say('齐克外公', '「让魔鬼把这一个带走吧。」', { style: 'whisper' });
      await S.say('齐克外公', ['那天夜里下着暴雨。孩子生下来，是个好好的孩子。', '可接生婆还没把他擦干净，他就变了。长出了蹄子，长出了翅膀，脑袋拉得老长，像马。', '他尖叫了一声，顺着烟囱飞了出去。从那以后，松林里就有了它。']);
      await S.say('齐克外公', ['我奶奶说，利兹妈妈后来后悔了一辈子。她给十三个孩子各缝了一格百衲被。', '第十三格，空着。她到死也没往上绣一个字。', '那床被子，就压在利兹角的老宅子里。']);
      await S.say('齐克外公', ['它一百多年来，一回一回地回利兹角。回去找什么？', '……它找它妈。']);
      const r2 = await S.ask('外公看着炉火，半天没说话。', ['舅舅他们会打死它的。', '它会伤了舅舅他们吗？'], '露丝');
      await S.say('齐克外公', r2 === 0 ? ['打不死的。打它，只会让它记住你。', '可韦德那帮人，一半是喝了酒去的。慌起来，枪口对着谁都不知道。'] : ['它不吃人。可它要是被逼急了……', '韦德那帮人，一半是喝了酒去的。慌起来，枪口对着谁都不知道。']);
      await S.say('齐克外公', ['露丝，你去。比他们先到。', '把那床被子找出来，给它送回窝里去。它拿到了，就不会再回来找了。']);
      await S.say('齐克外公', ['它的窝在哪儿？我不知道。可它的脚印知道。', '它昨天夜里刚从咱屋顶上下来。跟着它的脚印走。', '我教你认脚印的时候，你记的那张纸，还在吧？']);
      S.sfx('paper'); await S.note('tracks');
      await S.say('齐克外公', ['认准了再走。松林里的印子多着呢，鹿的、狐狸的、韦德他们的——', '还有这几天，镇上那帮想登报的小崽子做的假印子。']);
      const rk = S.ent('rack'); rk.s.g2 = true; S.give('musket');
      await S.say('齐克外公', ['拿着这个。老火枪，就一发。', '这是给人看的，不是给它的。真碰上了——别对着它开枪。', '听说一百年前，有个海军的大官在炼铁厂试炮，一炮打穿了它，它照样飞走了。']);
      await S.say('齐克外公', '马灯在门边挂着。去吧。');
      f.zeke = true;
      S.goal('拿上门边的马灯');
      return;
    }
    // 回来找外公：按当前卡在哪个岔口给提示
    const k = f.fk || 0;
    const L = !S.has('lantern') ? ['马灯在门边挂着。'] :
      k === 0 ? ['第一个岔口？先看它是几条腿走路的。', '四条腿的走两行。它是两条腿走的。'] :
      k === 1 ? ['看印子的边。新的边是脆的，旧的里头落了雪。', '狐狸的印子也是一行，可狐狸有趾头。'] :
      ['一样长、一样深的，是人摆出来的。', '找爪痕。它走过的地方，树上有爪痕。'];
    await S.say('齐克外公', L[(f._zk = ((f._zk ?? -1) + 1) % L.length)]);
  }
  async function cabinDoor(S) {
    const f = S.f;
    if (!f.zeke) { await S.say('齐克外公', '露丝，先别走。过来。'); return S.walk('pl', 'u', 5); }
    if (!S.has('lantern')) { await S.narr('外面黑得什么也看不见。\n门边挂着马灯。'); return S.walk('pl', 'u', 5); }
    S.sfx('open');
    if (S.once('leaveCabin')) await S.say('齐克外公', '露丝。……记着，别对着它开枪。');
    await S.go('pines', 19, 41, 0);
  }

  /* ================= 松林：追踪谜题 ================= */
  const BACK = { 1: [19, 29], 2: [32, 17], 3: [17, 7] };
  const HINT = {
    1: ['外公的口诀第一句：四条腿的走两行，两条腿的走一行。', '三串印子里，只有东边那一串是一行。', '往东。跟着那一行圆头的蹄印走。'],
    2: ['口诀：新印子边是脆的，旧印子里落了雪；狐狸的印子前头有趾头。', '西边那一串的边，一碰就碎。', '往西。'],
    3: ['口诀：一样长、一样深的，是摆出来的。印子没了，就抬头看树。', '北边那条道旁边的松树上，有爪痕。', '往北。']
  };
  const GOALK = { 1: '第一个岔口：对照口诀，认出它的蹄印', 2: '第二个岔口：哪一串是它刚刚踩出来的？', 3: '第三个岔口：哪一串是真的？' };
  async function wrong(S, k, kind) {
    const f = S.f, key = 'w' + k;
    f[key] = (f[key] || 0) + 1;
    if (kind === 'deer') {
      S.sfx('step'); S.place('deer1', 6, 28, 1); S.ent('deer1').alpha = 1;
      await S.scare('flash', { dur: .3 });
      await S.narr('前面的灌木里猛地窜出一个东西——\n一头白尾鹿。它一跃，白尾巴一翘，钻进了松林。');
      await S.alpha('deer1', 0, 500);
      await S.think('……只是鹿。这串是鹿的。');
    } else if (kind === 'posse') {
      S.show('pos1'); S.show('pos2'); S.place('pos1', 19, 21, 0); S.place('pos2', 20, 20, 0);
      await S.say('???', '站住！谁在那儿！', { style: 'big' });
      gunshot(S); S.shake(300, 3); await S.scare('flash', { dur: .35 });
      await S.narr('一声枪响。枪子打在你头顶的树枝上，雪「哗」地落了你一身。');
      await S.say('搜索队的人', ['……是个丫头？你是齐克老头家的外孙女吧？', '这是我们走的道，大路就在前头。这黑灯瞎火的，再往前走，让人当那东西给崩了！', '回去！']);
      await S.alpha('pos1', 0, 500); S.hide('pos2');
      await S.think('这是搜索队的靴子印。不是它的。');
    } else if (kind === 'fox') {
      S.show('fox1'); S.place('fox1', 35, 7, 0);
      await S.narr('马灯照过去，两点绿光一闪。\n一只狐狸叼着一只雪兔，站在雪地里看着你。');
      await S.alpha('fox1', 0, 700);
      await S.think('四个小点……是趾头。这是狐狸的。');
    } else if (kind === 'old') {
      await S.narr('印子绕着一棵松树转了一圈，又转了一圈，回到了原处。\n它昨天夜里就在这儿兜圈子。');
      wings(S, 4, 0, .28, .9); S.shake(600, 2);
      S.show('dvp'); S.place('dvp', 30, 5, 0); S.ent('dvp').alpha = .7;
      await S.scare('flash', { dur: .3 });
      await S.narr('头顶上，有什么东西从树梢上掠了过去。松枝上的雪落了你一头一脸。');
      S.hide('dvp');
      await S.think('这是昨天的印子——印子里落了今天下午的雪。');
    } else if (kind === 'fake') {
      S.show('boyA'); S.show('boyB'); S.place('boyA', 4, 6, 2); S.place('boyB', 3, 7, 2);
      S.sfx('scream'); await S.scare('flash', { dur: .3 });
      await S.say('男孩', ['啊啊啊——别开枪！别开枪！', '是我们！我们是镇上的！'], { style: 'big' });
      await S.narr('两个男孩从树后面滚了出来。其中一个的靴子底下，用钉子钉着两块削成蹄子形状的木头。');
      await S.say('男孩', ['我们就是想上报纸……卡姆登那边就有人这么干，把整条街都吓坏了。', '可是、可是刚才，林子里有个东西在叫，就在我们头顶上……我们不干了！']);
      await S.alpha('boyA', 0, 400); S.hide('boyB');
      await S.think('一样长、一样深——是摆出来的。');
    }
    const n = f[key];
    if (n >= 2) { const h = HINT[k][Math.min(n - 2, 2)]; await S.think(h); S.goal(n >= 4 ? HINT[k][2] : GOALK[k]); }
    else S.goal(GOALK[k]);
    await S.walk('pl', BACK[k], 5);
  }
  async function right(S, k) {
    const f = S.f; f.fk = k;
    if (k === 1) {
      await S.narr('一行，圆头，两瓣。步子忽长忽短。\n印子拐了个弯，往东北去了。');
      S.goal('跟着蹄印往北走（路边的树上也许有它留下的东西）');
    } else if (k === 2) {
      await S.narr('印子的边还是脆的。它刚从这儿过去不久。');
      S.goal('跟着新鲜的蹄印往西走');
    } else {
      S.sfx('heart');
      await S.narr('步子一短一长，深得像是从高处跳下来——没错，是它。\n印子往北，一直到一棵松树底下。');
      await S.narr('雪地上砸出一个坑，印子又接上了。往东，往海那边。\n松林外头，传来一阵咸咸的风。');
      S.goal('出松林，去利兹角（往北）');
    }
    if (S.coop) S.toast('认对了');
  }
  async function behind(S) {
    S.f.behind = true;
    wings(S, 3, 0, .3, .7);
    await S.narr('身后的松枝上，雪「扑」地落下来一大块。');
    S.turn(2);
    for (const i of [0, 1, 2]) S.show('beh_' + i);
    S.sfx('heart');
    await S.narr('你回过头。马灯照着你刚走过的路。\n你的靴子印里，多了一个蹄印。圆头的，两瓣。\n……就踩在你的脚印上。');
    await S.think('它在后面。\n我跟着它，它也跟着我。');
    S.turn(1);
  }
  async function toRuin(S) {
    if ((S.f.fk || 0) < 3) return S.walk('pl', 'd', 5);
    await S.go('ruin', 13, 18, 3);
  }

  /* ================= 利兹老宅 ================= */
  async function bibleOn(S) {
    const f = S.f;
    if (S.once('bible')) await S.narr('倒了的桌子底下压着一本旧圣经，泡得发胀。\n你把它抽出来，抖掉上面的雪。');
    await S.note('bible');
    if (!f.bible) { f.bible = true; await S.think('「他该睡的地方」……'); S.goal('「被子放在他该睡的地方」——第十三个孩子该睡在哪儿？'); }
  }
  async function chimOn(S) {
    const f = S.f, c = S.ent('chim');
    if (f.letter) return S.narr('烟道里那块砖已经被你抽出来了，砖缝里黑洞洞的。\n爪痕一道一道，一直往上，往上，抓到了烟囱口。');
    await S.narr('一根孤零零的砖烟囱。壁炉口黑洞洞的，里面落满了雪。\n你举着马灯往烟道里照——砖上全是爪痕，一道压着一道，一直往上，抓到了看不见的地方。');
    await S.narr('一百七十年前，他就是从这里出去的。');
    S.sfx('open');
    await S.narr('马灯一晃，你看见烟道里有一块砖是松的。你把它抠了出来。\n砖后面塞着一卷油布。');
    f.letter = true; c.s.brick = true;
    await S.note('letter');
    await S.think('……塞缪尔。');
  }
  async function cradleOn(S) {
    const f = S.f, c = S.ent('cradle');
    if (S.has('quilt') || f.quilt) return S.narr('空摇篮轻轻地晃着。没有风。');
    if (!f.bible) return S.narr('一只橡木摇篮，弯弯的两只脚，做工很细。比屋里别的东西都新一点，像是很少用过。\n里面空空的，只积了一层雪。');
    await S.narr('「他该睡的地方」。\n你把摇篮里的雪扫掉，敲了敲床板——咚、咚。是空的。');
    S.sfx('open'); c.open = true;
    await S.narr('床板是活的。底下垫着一层油布，油布里裹着一床叠得整整齐齐的被子。');
    S.give('quilt'); f.quilt = true; c.s.empty = true;
    await S.narr('十三格的百衲被。\n十二格上绣着字母，还有一样小东西：一只鸟，一把木勺，一棵松树……\n第十三格，是空的。');
    await devilOnChimney(S);
  }
  async function devilOnChimney(S) {
    const f = S.f;
    S.amb('none');
    await S.wait(400);
    screech(S);
    S.shake(500, 2);
    await S.narr('头顶上，有什么东西叫了一声。\n像女人在尖叫，又像马在嘶。');
    S.focus(11, 2);
    const d = S.ent('dv_r'); d.alpha = 0; d.s.fly = false; S.place('dv_r', 11, 1, 0);
    S.sfx('heart'); await S.alpha('dv_r', 1, 1400);
    await S.narr('烟囱顶上，蹲着一个东西。月亮在它身后，像一盏灯。');
    await S.narr('它有你两个高。脑袋长长的，像马，头顶上弯着两只角。\n两只蝙蝠一样的翅膀收在背后，身后拖着一条分叉的尾巴。\n它的眼睛是红的。');
    S.sfx('heart');
    await S.narr('它低下头。\n它在看你怀里的被子。');
    await S.scare('face', { face: 'devil', sfx: 'scare', dur: 1 });
    await S.wait(300);
    gunshot(S, 0, .5); gunshot(S, .5, .5);
    S.show('wade_r'); S.place('wade_r', 13, 19, 3); S.ent('wade_r').alpha = .9;
    await S.say('远处的人声', ['在那儿！烟囱上！', '开枪！开枪啊！'], { style: 'big' });
    d.s.fly = true; screech(S, 0, 1.2); wings(S, 6, 0, .26);
    await S.walk('dv_r', 'rrrrrrrrrrr', 8);
    await S.alpha('dv_r', 0, 600);
    S.focus(null);
    await S.narr('它张开翅膀，从烟囱顶上扑了下来，贴着盐沼飞了出去——往东。\n往雪松沼泽那边去了。');
    await S.say('韦德舅舅', '它往沼泽那边去了！追！都跟上！', { style: 'big' });
    S.hide('wade_r');
    S.amb('wind');
    await S.think('不能让他们先到。');
    f.devilSeen = true;
    S.goal('赶在搜索队前头：往东过盐沼的冰面，去雪松沼泽');
    S.cp('ruin2');
  }
  async function ruinSouth(S) {
    if (S.f.quilt) { await S.narr('松林那边全是晃动的马灯和人声。是舅舅他们。\n它往东飞了。'); return S.walk('pl', 'u', 5); }
    await S.go('pines', 16, 1, 0);
  }
  async function ruinEast(S) {
    if (!S.f.quilt) { await S.narr('东边是冻上的水道，过去就是雪松沼泽。\n……被子还没找到。'); return S.walk('pl', 'l', 5); }
    await S.go('swamp', 0, 8, 2);
  }

  /* ================= 沼泽：它闻着你的脚印追 ================= */
  let DV = null;
  const DSPD = 3.9;        // 它沿着脚印走的速度（格/秒）；雪里你只能走 4.2×0.7≈2.9
  function tileAt(m, x, y) { return m.mods[y * m.w + x] ?? m.rows[y][x]; }
  const printable = c => c === '.' || c === 'p';
  async function startSwamp(S, retry) {
    const f = S.f;
    S.norun(true); S.plr(3.4);
    const e = S.ent('dv'); S.stop('dv'); e.hidden = true; e.alpha = 1; e.s.fly = false; e.s.sniff = false;
    // 走进沼泽那几步留下的脚印
    const pre = [[1, 8], [2, 8], [3, 8], [4, 8], [5, 8]];
    for (const [x, y] of pre) S.tile(x, y, 'p');
    DV = { w: W, trail: pre.map(([x, y]) => [x, y, 0]), seg: 0, off: false, segT: 0, segN: 0, i: 0, st: 'wait', t: 0, last: W.pl.x + ',' + W.pl.y, adj: 0, ice: 0, iceW: false, hb: 0, n0: 0 };
    f.ph = 'chase';
    if (retry) {
      S.goal('往东找它的窝——别在雪地上停；踩松针、踩冰面不留脚印（冰上别久站）');
      if (DEATHS >= 1) await S.think(DEATHS >= 2 ? '它闻着脚印走。松针、冰面上没有脚印，它就得停下来重新找——\n可它会飞到我新脚印开头的地方。别停，一直往东。冰上站久了会裂。' : '它闻着脚印走。别在雪地上停下来。\n踩到松针上、冰面上，它就闻不着了。');
    }
  }
  function swampTick(S, dt) {
    const f = S.f;
    if (!DV || DV.w !== W || f.ph !== 'chase' || W.mapId !== 'swamp' || W.ended || W.endScreen) return;
    const m = curMap(), p = W.pl, e = getEnt('dv', 'swamp');
    // 1) 记脚印（剧本走路时也记）
    const key = p.x + ',' + p.y;
    if (DV.last !== key) {
      DV.last = key;
      if (printable(tileAt(m, p.x, p.y))) {
        if (DV.off) { DV.seg++; DV.off = false; DV.segT = 0; DV.segN = 0; }
        DV.trail.push([p.x, p.y, DV.seg]); DV.segN++;
        if (tileAt(m, p.x, p.y) === '.') S.tile(p.x, p.y, 'p');
      } else DV.off = true;
    }
    if (W.busy) return;
    DV.segT += dt;
    // 2) 冰面：站久了会裂（先警告，再落水）
    if (tileAt(m, p.x, p.y) === 'i') {
      DV.ice += dt;
      if (DV.ice > 2.4 && !DV.iceW) { DV.iceW = true; crack(S); S.shake(300, 1); S.toast('脚下的冰「咔」地响了一声——快离开冰面！'); }
      if (DV.ice > 4.6) { f.ph = 'dead'; S.run(iceDeath); return; }
    } else { DV.ice = 0; DV.iceW = false; }
    // 3) 它
    const ex = Math.round(e.px / TS), ey = Math.round(e.py / TS);
    const dist = (Math.abs(e.px - p.px) + Math.abs(e.py - p.py)) / TS;
    if (!e.hidden && DV.st !== 'fly') {
      if (dist < .75) { f.ph = 'dead'; S.run(caught); return; }
      DV.hb -= dt; if (dist < 7 && DV.hb <= 0) { S.sfx('heart'); DV.hb = .3 + dist * .16; }
    }
    DV.t += dt;
    if (DV.st === 'wait') {
      // 落地前先叫一声预警；落在你身后第 6 个脚印上（至少隔 4 格）
      if (!DV.warned && (DV.t > 1.6 || DV.trail.length >= 9)) { DV.warned = true; DV.t = 1.6; screech(S, 0, .8); wings(S, 4, .2, .28, .8); S.toast('身后——它来了！'); }
      if (DV.warned && DV.t > 2.6) {
        let j = Math.max(0, DV.trail.length - 7);
        while (j > 0 && Math.abs(DV.trail[j][0] - p.x) + Math.abs(DV.trail[j][1] - p.y) < 4) j--;
        DV.i = j; land(S, e, DV.trail[j]);
      }
      return;
    }
    if (e.mv) return;
    if (DV.st === 'follow') {
      const tr = DV.trail; let i = DV.i;
      // 你绕回头的时候，它会直接闻到更近的那一段
      for (let j = tr.length - 1; j > i + 1; j--) { if (tr[j][2] === tr[i][2] && Math.abs(tr[j][0] - ex) + Math.abs(tr[j][1] - ey) === 1) { i = j - 1; break; } }
      const nx = tr[i + 1];
      if (!nx) { DV.st = 'sniff'; DV.t = 0; e.s.sniff = true; return; }
      if (nx[2] !== tr[i][2]) { DV.i = i; DV.st = 'sniff'; DV.t = 0; e.s.sniff = true; S.sfx('whisper'); return; }
      const dx = nx[0] - ex, dy = nx[1] - ey;
      if (!dx && !dy) { DV.i = i + 1; return; }
      const d = DIRS.findIndex(q => q[0] === dx && q[1] === dy);
      if (d < 0) { DV.i = i + 1; e.px = nx[0] * TS; e.py = nx[1] * TS; e.x = nx[0]; e.y = nx[1]; return; }
      e.s.sniff = false; startMove(e, d, DSPD); DV.i = i + 1;
      return;
    }
    if (DV.st === 'sniff') {
      // 断了线：低头闻；离你只有一步还站着不动，它会听见你喘气
      if (Math.abs(ex - p.x) + Math.abs(ey - p.y) <= 1) { DV.adj += dt; if (DV.adj > 1.2) { f.ph = 'dead'; S.run(caught); return; } } else DV.adj = 0;
      const tr = DV.trail, cur = tr[DV.i], last = tr[tr.length - 1];
      if (last && cur && last[2] !== cur[2] && DV.t > 1.3 && (DV.segN >= 3 || DV.segT > 2.2)) {
        DV.st = 'fly'; DV.t = 0; e.s.fly = true; e.s.sniff = false; wings(S, 4, 0, .26, .9);
        e.hidden = true;
      } else if (last && cur && last[2] === cur[2] && DV.i < tr.length - 1) { DV.st = 'follow'; e.s.sniff = false; }
      return;
    }
    if (DV.st === 'fly' && DV.t > 1.1) {
      const tr = DV.trail, sg = tr[tr.length - 1][2];
      let g = tr.length - 1; while (g > 0 && tr[g - 1][2] === sg) g--;
      DV.i = g; land(S, e, tr[g]);
    }
  }
  function land(S, e, c) {
    e.hidden = false; e.alpha = 1; e.s.fly = false; e.s.sniff = true; e.mv = null;
    e.px = c[0] * TS; e.py = c[1] * TS; e.x = c[0]; e.y = c[1]; e.dir = 2;
    DV.st = 'follow'; DV.t = 0; DV.adj = 0;
    S.sfx('thud'); screech(S, 0, .45);
  }
  async function caught(S) {
    DEATHS++;
    const e = S.ent('dv'); e.s.sniff = false; e.s.fly = true;
    S.sfx('scream'); screech(S, 0, 1.2);
    await S.scare('face', { face: 'devil', sfx: 'scare', dur: 1 });
    await S.die('它没有扑你。它只是低下那颗长长的脑袋，凑到你脸跟前，闻了闻。\n然后，翅膀合拢过来，把马灯的光一点一点地盖住了。', '它找到了你的脚印');
  }
  async function iceDeath(S) {
    DEATHS++;
    crack(S); S.sfx('splash'); S.shake(500, 3);
    await S.scare('flash', { dur: .4 });
    await S.die('冰面在你脚下裂开了。\n雪松沼泽的水是茶色的，冷得像刀子。马灯沉下去的时候，还亮了一会儿。', '冰裂了');
  }

  /* ================= 炼铁炉：它的窝 ================= */
  async function reachNest(S) {
    const f = S.f; f.ph = 'nest';
    const e = S.ent('dv'); S.stop('dv'); e.mv = null; e.hidden = true; DV = null;
    S.norun(false);
    S.focus(41, 7);
    await S.narr('雪松林忽然到了头。\n前面的空地上，立着一座黑乎乎的石头塔，方方的，越往上越窄。');
    await S.narr('是一座炼铁炉。松林里早年炼沼铁，炉子熄了好几十年，没人再来。\n炉口底下的雪地上，全是圆头的两瓣蹄印，进进出出。');
    await S.walk('pl', [41, 8], 4); S.turn(3);
    S.ent('furn').s.glow = true;
    await S.narr('炉口里面铺着一层厚厚的雪松皮和松针。\n是窝。');
    await S.narr('窝里堆着它这些年从各处捡回来的东西：\n一只婴儿鞋，半截摇篮的弯脚，一个锡做的拨浪鼓，一块褪了色的襁褓。\n……全是给小孩用的。');
    S.focus(null);
    wings(S, 6, 0, .28);
    await S.wait(900);
    const d = S.ent('dv'); d.s.fly = true; d.alpha = 0; d.oy = -26; S.place('dv', 41, 6, 0);
    await S.alpha('dv', 1, 900); d.s.fly = false;
    S.sfx('heart');
    await S.narr('炉顶上，它落了下来。翅膀收拢，长长的脑袋垂着，红眼睛看着你。');
    // 搜索队追到了
    for (const [id, x, y] of [['wade_s', 34, 9], ['pos1s', 33, 10], ['pos2s', 33, 8]]) { S.place(id, x, y, 2); S.show(id); }
    await S.walk('wade_s', [37, 9], 4);
    await S.say('韦德舅舅', ['露丝？！你怎么在这儿——', '趴下！离它远点！'], { style: 'big' });
    d.s.fly = true; screech(S, 0, 1.1); S.shake(400, 2);
    await S.narr('它张开翅膀，冲着舅舅他们的马灯尖叫起来。\n舅舅端起了猎枪。你听见他拉开了枪栓。');
    const r = await S.ask('你怀里抱着那床被子。手边，是外公的老火枪。', ['把百衲被铺进窝里', '举起外公的火枪，对准它'], '露丝');
    if (r === 1) return shotEnd(S);
    await S.narr('你转过身，背对着舅舅的枪口，跪下来。\n把那床百衲被抖开，一格一格，铺进了窝里。');
    S.ent('furn').s.quilt = true; S.take('quilt');
    await S.say('露丝', '舅舅，别开枪。');
    await S.say('韦德舅舅', '……露丝！');
    await S.say('露丝', '它不是来吃鸡的。它是来找它妈的。');
    await S.narr('舅舅的枪口抖了一下，慢慢地，垂了下去。');
    d.s.fly = true; wings(S, 3, 0, .3, .6);
    await S.alpha('dv', 0, 400);
    S.place('dv', 41, 7, 0); d.oy = -4; d.s.fly = false; d.s.sniff = true;
    await S.alpha('dv', 1, 600);
    await S.narr('它从炉顶上落下来，落在窝边。\n它低下那颗长长的、马一样的脑袋，闻了闻被子。一格，一格，闻过去。');
    await S.narr('闻到第十三格，它停住了。');
    if (f.letter) {
      const r2 = await S.ask('空着的第十三格。你想起烟道砖缝里的那封信。', ['叫它的名字', '（什么也不说，慢慢退开）'], '露丝');
      if (r2 === 0) return nameEnd(S);
    }
    return nestEnd(S);
  }
  async function nestEnd(S) {
    await S.narr('它慢慢地蜷了起来，像一个很大很大的婴儿，躺在了那床被子上。\n翅膀合拢，把自己裹住了。');
    S.tone('sine', 330, 330, 1.6, .03); S.tone('sine', 262, 262, 2, .025, .6);
    await S.narr('那一声尖叫，再也没有响起来。\n雪又开始下了，一片一片，落在炼铁炉的石头上。');
    await S.say('韦德舅舅', '……回家吧。跟你外公说，我错了。');
    await S.fade(1, 1200);
    await S.card('卷一　终', '', VOL1);
    return S.end({ id: 'nest', title: '第十三格', text: '1909年1月的那个星期以后，泽西恶魔再也没有成群结队地被人看见。\n报纸换了别的新闻。学校复了课，厂子又开了工。费城的悬赏，没有人领到。\n舅舅把猎枪挂回墙上，再也没有摘下来过。\n\n松林里的人说，它还在。\n隔几年，就有人在雪地上看见一行圆头的两瓣蹄印，一直走到哪棵松树底下，就没了。\n可它再也没有回过利兹角。\n\n它找到了它要找的东西。\n只是那第十三格，一直空着。' });
  }
  async function nameEnd(S) {
    await S.say('露丝', '……塞缪尔。');
    await S.narr('它抬起了头。');
    await S.say('露丝', '你叫塞缪尔。她让我告诉你的。');
    S.pos(40, 9, 3);
    S.ent('mom').alpha = 0; S.place('mom', 41, 8, 3);
    await S.alpha('mom', .75, 1800);
    await S.narr('炉口的微光里，多了一个女人的影子。旧式的长裙，头上包着白头巾。\n她跪在窝边，伸出手，摸了摸那颗长长的脑袋。');
    const L = lullaby(S, 0, 1);
    await S.narr('有人在哼歌。很轻，很慢，是一支你从来没听过的摇篮曲。');
    await S.wait(Math.max(0, L * 1000 - 2200));
    await S.narr('它闭上了眼睛。\n翅膀一点一点地收拢，像一床被子，盖住了它自己。');
    await S.alpha('mom', 0, 1800);
    await S.say('韦德舅舅', '……露丝，刚才那是……');
    await S.say('露丝', '是他妈妈。');
    await S.fade(1, 1200);
    await S.card('卷一　终', '', VOL1);
    return S.end({ id: 'name', title: '他叫塞缪尔', text: '塞缪尔。意思是「神听见了」。\n利兹妈妈把这个名字写在信里，塞进烟道的砖缝，等了一百七十年，\n等一个人替她念出来。\n\n外公听完，很久没说话。最后他说：「那她总算是说出口了。」\n\n1909年1月的那个星期以后，泽西恶魔再也没有成群结队地被人看见。\n后来每年下第一场雪的晚上，外公都让你在窗台上点一盏马灯。\n松林深处，偶尔会传来一声长长的叫声。\n不像尖叫。\n像一个孩子，在应一声名字。' });
  }
  async function shotEnd(S) {
    await S.narr('你把火枪抵在肩上。手冻得发僵，准星在月光里一跳一跳。');
    await S.narr('你扣下了扳机。');
    gunshot(S, 0, 1.3); S.shake(700, 4);
    await S.scare('flash', { dur: .4 });
    screech(S, 0, 1.3);
    await S.narr('它叫了一声。\n那不是吓人的叫。是哭。');
    gunshot(S, .2, .8); gunshot(S, .6, .8); gunshot(S, 1, .8);
    await S.narr('舅舅他们一起开了枪。它从炉顶上翻下去，又挣扎着扑起来，\n歪歪斜斜地，消失在雪松林里。');
    S.hide('dv');
    await S.fade(1, 1200);
    return S.end({ bad: true, id: 'shot', title: '那一枪', text: '第二天，报上说搜索队在松林深处「击伤了那头怪物」。\n悬赏没有人领到。谁也没找到它的尸首。\n那床百衲被，后来在炼铁炉前的雪地里被人捡到，踩满了泥。\n\n从那年冬天起，每一个下雪的夜里，你家屋顶上都有蹄声。\n咯哒，咯哒，绕着烟囱，一圈，又一圈。\n\n外公说，它记住你了。\n他说，打它，只会让它记住你。' });
  }
})();
