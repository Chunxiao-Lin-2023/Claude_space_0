/* ================= 第三十夜 · 红岛空城（全书收束章） ================= */
(() => {
  const clampN = (v, a, b) => v < a ? a : v > b ? b : v;
  const cyc = (S, key, lines) => lines[(S.f[key] = ((S.f[key] ?? -1) + 1) % lines.length)];
  let DEATHS = 0;            // 沙暴里死过几次（跨检查点保留，用来给重来提示）
  const SF = {};             // 主机上的声音计时（不进存档）
  const USPD = 2.3;          // 蹄子声的主人走得比人慢，可你一停，她就到了

  /* ---------------- 合成音效（双方都听得到） ---------------- */
  function hoof(S, v) { S.tone('square', 230, 120, .05, v, 0, 900); S.tone('triangle', 900, 300, .03, v * .5, 0, 2400); S.tone('square', 200, 110, .05, v * .8, .17, 900); S.tone('triangle', 820, 280, .03, v * .4, .17, 2400); }
  function scratch(S, v = .045) { for (let i = 0; i < 6; i++) S.tone('sawtooth', 2200 + Math.random() * 900, 1500, .045, v, i * .075, 4200); }
  function piping(S, v) {   // 风笛似的长音（haban）垫底，上面一支高高低低的小调
    S.tone('sawtooth', 147, 147, 2.8, v * .45, 0, 650); S.tone('sawtooth', 221, 221, 2.8, v * .3, 0, 750);
    [587, 659, 698, 659, 587, 523, 587, 698, 659].forEach((f, i) => S.tone('square', f, f * 1.006, .27, v * .55, .1 + i * .29, 1500));
  }
  function bleat(S, v) { [520, 470, 545, 480, 505, 460].forEach((f, i) => S.tone('sawtooth', f, f * .9, .085, v, i * .08, 1700)); }
  function waves(S, v) { S.tone('sine', 72, 38, 2.4, v, 0); S.tone('triangle', 190, 80, 2, v * .4, .15, 420); S.tone('sine', 110, 55, 1.6, v * .5, .9); }
  function windHowl(S, v) { S.tone('sine', 300, 540, 1.6, v, 0, 900); S.tone('sine', 540, 250, 1.9, v * .8, 1.4, 900); }
  function sigh(S) { S.tone('sine', 220, 150, 2.4, .05, 0, 700); S.tone('sine', 330, 220, 2.6, .03, .2, 900); }
  function chime(S) { S.tone('sine', 523, 523, 1.4, .04); S.tone('sine', 784, 784, 1.6, .03, .12); S.tone('sine', 1047, 1047, 1.8, .02, .24, 3000); }
  function sob(S) { S.tone('triangle', 420, 330, .35, .03, 0, 1400); S.tone('triangle', 400, 300, .45, .025, .5, 1400); }
  function carDoor(S) { S.tone('square', 90, 60, .12, .08, 0, 600); S.tone('triangle', 300, 120, .08, .05, .02, 1500); }

  /* ---------------- 记号 ---------------- */
  /* 五个路口（进村时按顺序经过）。真记号的箭头一律指回车子那边 */
  const J = { 1: { x: 36, y: 15 }, 2: { x: 28, y: 15 }, 3: { x: 28, y: 22 }, 4: { x: 19, y: 14 }, 5: { x: 10, y: 14 } };
  const MARKS = [
    { id: 'mk1', x: 36, y: 14, s: { d: 2, n: 1 } },
    { id: 'mk2', x: 28, y: 14, s: { d: 2, n: 2 } },
    { id: 'mk3', x: 27, y: 21, s: { d: 3, n: 3 } },
    { id: 'mk4', x: 18, y: 13, s: { d: 0, n: 4 } },
    { id: 'mk5', x: 11, y: 13, s: { d: 2, n: 5 } },
    /* 沙暴里多出来的：照着学的，学反了 */
    { id: 'fk1', x: 37, y: 14, s: { d: 0, n: 1, mir: 1 } },
    { id: 'fk2', x: 27, y: 14, s: { d: 1, n: 2, mir: 1 } },
    { id: 'fk3', x: 29, y: 21, s: { d: 2, n: 3, mir: 1 } },
    { id: 'fk3b', x: 26, y: 21, s: { d: 1, n: 3, mir: 1 } },
    { id: 'fk4', x: 20, y: 13, s: { d: 2, n: 4, mir: 1 } },
    { id: 'fk5', x: 9, y: 13, s: { d: 3, n: 5, mir: 1 } },
    { id: 'fk3c', x: 30, y: 21, s: { d: 0, n: 3, mir: 1 } }   // 走过之后才「长」出来的
  ];
  const FORGED = ['fk1', 'fk2', 'fk3', 'fk3b', 'fk4', 'fk5'];
  const DEADS = [[35, 20], [36, 20], [37, 20], [25, 15], [33, 22], [23, 14], [10, 10], [4, 14]];
  const DIRW = ['下（南）', '左（西）', '右（东）', '上（北）'];
  const NORM = { 1: '一个「1」，头上那一小撇朝左，写得端端正正。', 2: '一个「2」，写得端端正正。', 3: '一个「3」，两个弯朝右鼓，写得端端正正。', 4: '一个「4」，小三角在左、竖笔在右，写得端端正正。', 5: '一个「5」，肚子朝右鼓，写得端端正正。' };
  const MIRR = { 1: '一个「1」——可它头上那一小撇，是朝右撇的。', 2: '一个「2」——可它的弯钩朝左鼓，底下那一横往左甩了出去。', 3: '一个「3」——可它的两个弯，是朝左鼓出来的。', 4: '一个「4」——可它的竖笔在左边，小三角挂在右边。', 5: '一个「5」——可它的肚子朝左鼓。' };
  /* 3×5 像素数字（镜像时左右翻转） */
  const DIG = { 1: ['010', '110', '010', '010', '111'], 2: ['111', '001', '111', '100', '111'], 3: ['111', '001', '111', '001', '111'], 4: ['101', '101', '111', '001', '001'], 5: ['111', '100', '111', '001', '111'] };
  function arrow(R, d, ox, oy, c) {
    const A = (x, y, w, h) => R(ox + x, oy + y, w, h, c);
    if (d === 2) { A(0, 3, 6, 2); A(5, 1, 1, 6); A(6, 2, 1, 4); A(7, 3, 1, 2); }
    else if (d === 1) { A(2, 3, 6, 2); A(2, 1, 1, 6); A(1, 2, 1, 4); A(0, 3, 1, 2); }
    else if (d === 3) { A(3, 2, 2, 6); A(1, 2, 6, 1); A(2, 1, 4, 1); A(3, 0, 2, 1); }
    else { A(3, 0, 2, 6); A(1, 5, 6, 1); A(2, 6, 4, 1); A(3, 7, 2, 1); }
  }
  async function markOn(S, e) {
    const s = e.s;
    if (s.er) return S.narr('这里原来是你画的记号——现在被刮花了。\n墙皮上只剩一片乱糟糟的黄印子，像被很多根指甲来回抓过，看不出箭头朝哪边。');
    await S.narr('黄色的蜡笔箭头，指向' + DIRW[s.d] + '。\n箭头旁边写着' + (s.mir ? MIRR[s.n] : NORM[s.n]));
    if (s.mir && (S.f.hit || DEATHS) && S.f.ph === 'storm') await S.say('玛雅姆', '……反的。不是我们画的。', { style: 'whisper' });
  }

  /* ---------------- 壁龛（风塔大宅） ---------------- */
  const WIND = '\n头顶就是风塔，风从塔顶四面的开口灌下来，呜——呜——';
  const NICHE = {
    n1: { x: 19, y: 7, wm: [20, 7], k: 'luban', why: '这间屋子顶上是平的，没有风塔。赛义夫说，头顶有风。',
      desc: '一个尖拱形的壁龛，抹着白灰。\n里面有一只小陶香炉，炉底积着几颗没烧完的小颗粒，黄白色，半透明，闻着清清甜甜的。\n伸手往里一摸——里壁上刻着一道一道的竖痕。\n这间屋子的屋顶是平的，听不见风塔的风声。' },
    n2: { x: 2, y: 1, wm: [3, 1], k: 'oud', why: '这是沉香木片，不是外婆礼拜五熏的乳香。',
      desc: '壁龛里有一只铜香炉，炉里几片烧黑了的木片，黑褐色，油亮亮的。香味又浓又沉，还混着一点茉莉的甜。\n伸手往里一摸——里壁上刻着一道一道的竖痕。' + WIND },
    n3: { x: 5, y: 1, wm: [4, 1], k: 'luban', why: '里面光溜溜的，没有刻痕。',
      desc: '壁龛里有一只缺了口的陶香炉，炉底几颗黄白色、半透明的小颗粒，闻着清清甜甜的。\n伸手往里一摸——里壁很光滑，什么也没刻。' + WIND },
    n4: { x: 10, y: 1, ok: 1, k: 'luban',
      desc: '壁龛里有一只小陶香炉，炉底积着几颗黄白色、半透明的小颗粒，清清甜甜的味道还没散。\n伸手往里一摸——里壁上刻满了一道一道的竖痕，密密麻麻，从下往上，一直刻到你够不着的地方。' + WIND },
    n5: { x: 13, y: 1, wm: [12, 1], k: 'sand', why: '这里面什么味道都没有。',
      desc: '壁龛里只有一小堆从风塔上漏下来的细沙，凑近了闻，什么味道也没有。\n伸手往里一摸——里壁上刻着一道一道的竖痕。' + WIND },
    n6: { x: 18, y: 1, wm: [19, 1], k: 'oud', why: '沉香，不是乳香；里面也没有刻痕。',
      desc: '壁龛里放着一只小铜盘，盘里几片黑褐色的木片，香味又浓又沉。\n伸手往里一摸——里壁光光的，什么也没刻。' + WIND }
  };
  const HINT = [
    '风塔底下、外婆的香味、里面的刻痕——三样都得对上才行。',
    '外婆礼拜五熏的是乳香。你包里那包就是——看看它长什么样，再去一个一个比。',
    '在北边那三间有风塔的屋子里找：炉里是乳香渣，伸手还摸得到刻痕的那一个。',
    '正北那间屋子，靠左边的那个壁龛。'
  ];

  /* ---------------- 人物 ---------------- */
  const UMM = { skin: '#eadfd2', hair: '#0a0808', hs: 'long', hat: 'scarf', hatC: '#0c0a10', top: '#0e0c12', top2: '#3a2440', robe: true, noFeet: true, eye: '#120606', mouth: '#9a2a34' };
  function ummExtra(g, d, fr, G, R) {
    R(5, 21, 2, 2, '#4a3a2a'); R(9, 21, 2, 2, '#4a3a2a'); R(5, 23, 2, 1, '#2a2018'); R(9, 23, 2, 1, '#2a2018');   // 袍子底下露出来的蹄子
    if (d === 0) { R(3, G.tB - 2, 2, 1, '#e0b040'); R(11, G.tB - 2, 2, 1, '#e0b040'); R(3, G.tB - 1, 1, 2, '#f0d070'); R(7, G.hT + 3, 1, 1, '#0a0606'); R(9, G.hT + 3, 1, 1, '#0a0606'); }
    else if (d === 1) { R(2, G.tB - 2, 2, 1, '#e0b040'); R(1, G.tB - 1, 1, 3, '#f0d070'); R(0, G.tB + 1, 1, 1, '#f0d070'); }
    if (d !== 3) R(4, G.tT + 1, 1, 6, '#3a2440');
  }

  defChapter({
    id: 'jazirat', n: 30, title: '红岛空城', sub: '沙暴夜里的空村子。墙上的记号，有些不是你画的。', origin: '阿联酋 · 拉斯海马', color: '#6e3c22',
    icon: '@umm', iconX: 26, amb: 'wind', floor: 'sand', wall: 'stone', dark: .55, plr: 3.6,
    thumb(g, w, h) {
      const base = h - 22;
      g.fillStyle = 'rgba(220,150,80,.16)'; g.fillRect(0, base - 60, w, 26);
      g.fillStyle = '#efd9a8'; g.fillRect(w * .1, 10, 9, 9); g.fillStyle = shade('#6e3c22', -.5); g.fillRect(w * .1 + 3, 9, 8, 8);
      g.fillStyle = '#1c120c'; g.fillRect(0, base - 16, w, 16);
      for (const x of [w * .06, w * .2, w * .34]) { g.fillRect(x, base - 40, 13, 26); g.fillStyle = '#3a2618'; for (let i = 0; i < 3; i++) g.fillRect(x + 2 + i * 4, base - 37, 2, 12); g.fillStyle = '#1c120c'; g.fillRect(x - 1, base - 42, 15, 3); }
      g.fillRect(w * .5, base - 52, 6, 38); g.fillRect(w * .5 - 2, base - 40, 10, 3); g.fillRect(w * .5 + 1, base - 56, 4, 4);
      g.fillStyle = '#9c8462'; g.fillRect(4, base - 12, w * .5, 10);
      const c = '#f4d040', R = (x, y, ww, hh) => { g.fillStyle = c; g.fillRect(x, y, ww, hh); };
      const ox = 10, oy = base - 11;   // 墙上一个黄箭头 + 一个反写的 3
      R(ox, oy + 3, 9, 2); R(ox + 7, oy + 1, 1, 6); R(ox + 8, oy + 2, 1, 4); R(ox + 9, oy + 3, 1, 2);
      const d3 = DIG[3]; for (let y = 0; y < 5; y++) for (let x = 0; x < 3; x++) if (d3[y][2 - x] === '1') R(ox + 14 + x * 2, oy + y * 2 - 1, 2, 2);
      for (let i = 0; i < 40; i++) { g.fillStyle = `rgba(220,170,110,${.15 + hash(i, 9, 30) * .3})`; g.fillRect((hash(i, 1, 30) * w) | 0, (hash(i, 2, 30) * base) | 0, 4 + (hash(i, 3, 30) * 5 | 0), 1); }
    },
    endings: { dawn: '日出时回到车上', wedding: '沙夜的喜事', take: '带走的东西' },
    people: {
      me: { skin: '#f0cfaa', hair: '#1a1414', hs: 'bob', top: '#c8b48a', top2: '#a8946a', bottom: '#3a4a6a', shoes: '#e8e8e8' },
      mary: { key: 'jz-mary', skin: '#c89a72', hair: '#120e0e', hs: 'long', hat: 'scarf', hatC: '#16141a', top: '#1a181e', top2: '#2c2832', robe: true, shoes: '#2a2420',
        extra(g, d, fr, G, R) { if (d !== 3) { R(5, G.tB, 1, 1, '#9a7a4a'); R(10, G.tB, 1, 1, '#9a7a4a'); } } },
      saif: { key: 'jz-saif', skin: '#c8946a', hair: '#1a1414', hs: 'short', top: '#f2f0e8', top2: '#d8d6cc', robe: true, shoes: '#6a5a44',
        extra(g, d, fr, G, R) { if (d !== 3) { R(6, G.tT + 2, 1, 6, '#e0ddd2'); R(5, G.tB + 2, 6, 1, '#c8b890'); } } },
      umm: Object.assign({ key: 'jz-umm', extra: ummExtra }, UMM)
    },
    faces: {
      umm(R, a, t) {   // 乌姆·杜瓦伊斯：黑头巾里一张极美的脸，眼线浓黑——然后眼睛烧红，金色的镰刃从下面扫过来
        R(0, 0, 32, 32, '#060408'); R(3, 0, 26, 32, '#0e0b12'); R(5, 2, 22, 2, '#17121c');
        R(10, 7, 12, 17, '#e8dccf'); R(11, 6, 10, 1, '#e8dccf'); R(11, 24, 10, 2, '#dacdbf'); R(12, 26, 8, 1, '#cdbfb0');
        R(10, 8, 1, 15, '#c9bbab'); R(21, 8, 1, 15, '#c9bbab');
        R(9, 4, 14, 4, '#0e0b12'); R(9, 8, 1, 9, '#0e0b12'); R(22, 8, 1, 9, '#0e0b12'); R(15, 4, 2, 1, '#e0b040');
        R(12, 11, 3, 1, '#1a1010'); R(17, 11, 3, 1, '#1a1010');
        R(11, 13, 5, 2, '#0a0606'); R(16, 13, 5, 2, '#0a0606'); R(10, 14, 1, 1, '#0a0606'); R(21, 14, 1, 1, '#0a0606');
        const bl = Math.sin(t * 6) > .94;
        if (a < .45) { if (!bl) { R(12, 13, 3, 1, '#f4efe8'); R(17, 13, 3, 1, '#f4efe8'); R(13, 13, 1, 1, '#2a1a10'); R(18, 13, 1, 1, '#2a1a10'); } }
        else { R(12, 13, 3, 2, '#ff2a1a'); R(17, 13, 3, 2, '#ff2a1a'); R(13, 13, 1, 1, '#ffd0a0'); R(18, 13, 1, 1, '#ffd0a0'); }
        R(15, 16, 2, 3, '#d4c6b6'); R(14, 18, 1, 1, '#e0b040');
        const w = 4 + Math.floor(a * 7), x0 = 16 - Math.floor(w / 2);
        R(x0, 21, w, 1, '#8a2430');
        if (a > .55) { R(x0 - 1, 20, 1, 1, '#8a2430'); R(x0 + w, 20, 1, 1, '#8a2430'); R(x0 + 1, 22, w - 2, 1, '#2a0808'); }
        if (a > .3) { const sx = Math.floor(31 - a * 30); for (let i = 0; i < 10; i++) R(sx + i, 31 - Math.round(Math.sin(i / 9 * Math.PI) * 7), 2, 1, i % 2 ? '#f6d878' : '#c8962c'); }
      },
      goat(R, a, t) {   // 门里的「客人」：一张黑山羊的脸，瞳孔是一道横缝
        R(0, 0, 32, 32, '#060404');
        R(6, 1, 4, 2, '#6a5c48'); R(4, 3, 3, 7, '#6a5c48'); R(3, 9, 2, 2, '#6a5c48'); R(22, 1, 4, 2, '#6a5c48'); R(25, 3, 3, 7, '#6a5c48'); R(27, 9, 2, 2, '#6a5c48');
        R(9, 5, 14, 17, '#161214'); R(10, 22, 12, 5, '#161214'); R(11, 27, 10, 3, '#100d0e'); R(13, 30, 6, 2, '#100d0e');
        R(3, 10, 7, 3, '#161214'); R(22, 10, 7, 3, '#161214'); R(4, 11, 4, 1, '#3a2a2a'); R(24, 11, 4, 1, '#3a2a2a');
        const ec = a > .5 ? '#ff6a20' : '#d8b020';
        R(10, 11, 5, 3, ec); R(17, 11, 5, 3, ec); R(10, 12, 5, 1, '#050404'); R(17, 12, 5, 1, '#050404');
        R(12, 24, 2, 1, '#3a3030'); R(18, 24, 2, 1, '#3a3030');
        const o = Math.min(3, Math.floor(a * 5)); R(13, 27, 6, 1 + o, '#2a1010');
      }
    },
    items: {
      crayon: { name: '黄色记号蜡笔', desc: '玛雅姆爸爸工具箱里的蜡笔，工地上用来在水泥上做记号的。黄得发亮，手电一照还会反光。' },
      torch: { name: '手电筒', desc: '一支旧手电，光圈不大。' },
      luban: { name: '一包乳香', desc: '外婆放在车里的小纸包。乳香（luban）是乳香树的树脂，一颗颗黄白色、半透明，像粗砂糖；烧起来是清清甜甜的味道。' },
      pearl: { name: '红布包着的珍珠', desc: '一颗不算大的珍珠，不太圆，手电一照，泛着一层淡淡的粉。包它的红布已经褪成了砖色。' },
      cap: { name: '赛义夫的帽子', desc: '一顶蓝色棒球帽，帽檐上用马克笔写着他的名字：SAIF。' }
    },
    notes: {
      sms: { title: '玛雅姆的手机 · 收件箱', text: '（诺基亚的小屏幕，一条一条往下翻。）\n\n法赫德 21:52\n姐对不起 我们在红岛 赛义夫不见了\n\n法赫德 21:55\n我们就是想拍个视频 阿卜杜拉在院子里吹了口哨 然后清真寺后面就有人吹那种婚礼上的曲子 还有羊叫 那里根本没有羊\n\n法赫德 21:58\n我们跑出来了 赛义夫没跟上 他手机打不通 求你先别告诉你爸\n\n赛义夫 22:03\n姐 我在一个有风塔的大房子里 外面有东西在走 嗒 嗒 像蹄子\n\n赛义夫 22:04\n我拿了一个东西 我不该拿的' },
      yadda: { title: '加油站小票背面 · 外婆的嘱咐', text: '（玛雅姆一边开车一边打电话，让你照着外婆的话记下来。字歪歪扭扭的。）\n\n· 进门说一声 Bismillah（奉真主之名），出门也说。\n· 夜里别吹口哨。\n· 听见吹奏和羊叫，那是它们在办喜事。别凑过去，别进门；人家请你喝咖啡，也别喝。\n· 闻到很浓很浓的香——沉香、茉莉——又听见「嗒、嗒」的蹄子声，那是乌姆·杜瓦伊斯（Umm al-Duwais）。别看她的脸，别停下，往家的方向走。\n· 它们学人做事，可总学反：鞋穿反，字也写反。\n· 拿了它们家里的东西，要还到原处，说一声「打扰了」。\n· 起了沙暴，别信眼睛，信耳朵：海在西边，家在东边。\n\n（最底下又补了一行：）我礼拜五早上熏屋子用的乳香，给你们放了一包在车里，带上。' },
      sign: { title: '村口的说明牌', text: '（市政府立的铁牌子，漆剥了一半。阿拉伯文和英文。）\n\n红岛（Al Jazirat Al Hamra）\n\n这里曾是阿拉伯湾沿岸一座以采珠和捕鱼为生的村镇。房屋用海里采来的珊瑚石和海滩上的岩石层层垒成，梁是红树木，屋顶铺着棕榈叶席。二十世纪初的英国档案记载，这里约有五百户人家。\n\n二十世纪三十年代以后，日本的养殖珍珠兴起，又赶上世界经济萧条，海湾的采珠业一落千丈。石油时代到来后，居民在 1968 年至 1971 年间陆续迁往新的城镇，旧村从此空置。\n\n村中保存有堡垒、瞭望塔、清真寺、集市与风塔大宅。\n请勿攀爬墙体，请勿带走任何物品。\n\n（牌子下角，有人用小刀刻了一行小字：晚上别来。）' },
      letter: { title: '箱子里的信（1968年）', text: '（信纸对折了好几次，边角被虫蛀了。阿拉伯文，玛雅姆一句一句念给你听。）\n\n我的儿子：\n\n明天一早，车就来接我们去新的地方了。那边有电，有自来水，你妹妹们高兴得一晚上没睡。\n\n你在科威特的油田，信里说今年冬天一定回来。我怕你回来，看见门锁着，找不到家。\n\n你父亲最后一季出海，捞上来这颗珠子。他说不卖，留着给你娶媳妇。我把它放回你屋里了——就是你小时候数日子的那个壁龛。他每回出海，你就在里面刻一道，一道一道，刻满了一整面。\n\n家里的「住户」，我烧了香，跟它们打过招呼了。它们会替我们看着这个家，看着这颗珠子，等你回来。\n\n要是你回不来，就让它留在那儿。谁也别动它。\n\n——你的母亲' }
    },
    legend: '红岛（Al Jazirat Al Hamra，阿拉伯语意为「红色的岛」）在阿联酋拉斯海马酋长国的海边，原本是一座以采珠和捕鱼为生的村镇，据研究可能建于十七世纪前后。二十世纪初英国人洛里默（J. G. Lorimer）编的海湾地名辞典里记载，这里约有五百户人家，以扎卜（Za\'ab）部落为主。房屋用海里采来的珊瑚石和海滩上的岩石层层垒成，梁是红树木，屋顶铺棕榈叶席；村里有堡垒、瞭望塔、清真寺、集市，以及带风塔（barjeel）的大宅。二十世纪三十年代以后，日本养殖珍珠兴起，加上世界经济萧条，海湾的天然采珠业迅速衰落；石油时代来临后，居民在 1968 年到 1971 年间陆续迁往新的城镇，旧村就此空置，几十年里基本保持原样。如今它是受保护的文化遗址，已被列入联合国教科文组织的《世界遗产预备名单》，近年也做了修缮，并在夜里举办过集市一类的活动。\n\n因为整村一下子搬空，红岛很早就有了「鬼城」的名声。网上流传的说法里，有人说那些空房子里住着精灵（Jinn），夜里能听见吹奏声、羊叫、有人说话——这些都查无实据，当地人和文物工作者也常常强调：这里是祖辈的家，不是「鬼屋」，人们离开只是为了更好的日子。\n\n精灵（Jinn）在伊斯兰信仰里不是民间传说那么简单：《古兰经》里有整整一章叫《精灵》（第72章），并说精灵是由「无烟的火焰」造成的（第55章）。很多穆斯林相信它们和人一样有自己的生活与信仰，与人共存于世。民间还有许多相关的习俗和说法，例如进出房屋时念「奉真主之名」（Bismillah）、夜里不吹口哨、别从荒废的屋子里拿走东西等，各地各家不尽相同。乌姆·杜瓦伊斯（Umm al-Duwais）则是阿联酋和海湾一带的民间故事：她在夜里化作一个香气袭人（常说是沉香、茉莉）的美丽女子，引诱夜游的男人，再显出原形——有的说她一只手是镰刀，有的说她的金镯子会变成利刃，也有的说她的腿是驴蹄或羊蹄，藏在长袍底下。老人常拿她告诫年轻人夜里别在外头乱跑。\n\n（本章的苏晴、玛雅姆、赛义夫和他们的经历，风塔大宅里的壁龛、那颗珍珠和 1968 年的那封信，「它们学人总学反」的记号规矩，以及沙暴之夜清真寺后面的那场喜事，均为游戏虚构。）',
    start: { map: 'road', x: 11, y: 8, dir: 2 },
    async intro(S) {
      await S.card('第三十夜　红岛空城', '2008年1月　阿联酋 拉斯海马　海边的旧村', '拉斯海马的海边，有一座空了四十年的村子。\n\n珊瑚石垒的墙，红树木搭的梁。\n风塔还立着，清真寺的宣礼塔也还立着。\n采珠的人家，在石油来了以后的那几年里，陆续搬走了。\n\n本地人管它叫「红岛」。\n也有人说，房子空了，不等于没人住。');
    },
    resume: {
      pearl: async S => { S.goal('放回珍珠：风塔下·外婆的香·刻痕'); },
      storm: async S => {
        S.norun(true); S.amb('wind'); SF.hf = 1; SF.pf = 0;
        if (DEATHS) await S.think('（数字反着写的，不是我们画的；记号被刮花了，就背着海浪声往东走。\n蹄子声近了——别停下。）');
        if (DEATHS >= 2) S.toast('回程：东 → 南 → 东 → 北 → 东 → 东');
      }
    },
    tick(S, dt) { tickAll(S, dt); },
    tiles: {
      ghaf: { solid: true, paint(R, X, Y) {   // 沙地上的矮灌木（加夫树丛）
        speck(R, '#8c7a58', ['#9a8763', '#7d6c4d'], X, Y, 16, 8);
        R(2, 6, 12, 7, '#3a3a22'); R(4, 4, 8, 3, '#4a4a2a'); R(3, 7, 4, 2, '#56562e'); R(9, 8, 4, 2, '#56562e'); R(2, 12, 12, 2, '#5e5038');
      } },
      yard: { solid: true, paint(R, X, Y) { speck(R, '#5a4a34', ['#66553c', '#4d3f2c'], X, Y, 14, 31); if (hash(X, Y, 4) < .2) R(4, 6, 3, 2, '#4a3d2a'); } },
      hasir: { solid: false, paint(R, X, Y) {   // 棕榈叶编的席子
        R(0, 0, 16, 16, '#a08a5a'); for (let y = 0; y < 16; y += 2) R(0, y, 16, 1, (y / 2 + X + Y) % 2 ? '#b09a68' : '#94804e');
        for (let x = 0; x < 16; x += 4) R(x, 0, 1, 16, 'rgba(70,50,20,.22)'); R(0, 15, 16, 1, '#7a6a44');
      } }
    },
    sprites: {
      mark(g, e, t, R) {   // 墙上的黄蜡笔记号：箭头 + 数字（mir=镜像），er=被刮花
        const c = '#f4d040';
        if (e.er) { for (let i = 0; i < 7; i++) R(2 + ((hash(e.x, i, 3) * 10) | 0), 2 + ((hash(i, e.y, 3) * 9) | 0), 3 + ((hash(i, i, 3) * 4) | 0), 1, i % 2 ? 'rgba(244,208,64,.55)' : 'rgba(200,170,60,.4)'); for (let i = 0; i < 4; i++) R(3 + i * 3, 2, 1, 9, 'rgba(40,30,20,.45)'); return; }
        arrow(R, e.d, 1, 3, c);
        const dg = DIG[e.n] || DIG[1];
        for (let y = 0; y < 5; y++) for (let x = 0; x < 3; x++) if (dg[y][e.mir ? 2 - x : x] === '1') R(11 + x, 3 + y, 1, 1, c);
        if ((t * 2 + e.x) % 3 < .15) R(0, 0, 16, 13, 'rgba(255,230,120,.06)');
      },
      taqa(g, e, t, R) {   // 墙上的尖拱壁龛
        R(3, 2, 10, 11, '#d8ccb4'); R(4, 3, 8, 10, '#2a2016'); R(5, 2, 6, 1, '#2a2016'); R(6, 1, 4, 1, '#2a2016'); R(7, 0, 2, 1, '#d8ccb4');
        R(3, 12, 10, 1, '#b8ac94');
        if (e.k === 'luban' || e.k === 'oud') { R(6, 9, 4, 3, e.k === 'oud' ? '#8a6a3a' : '#9a6a44'); R(5, 8, 6, 1, e.k === 'oud' ? '#a8844a' : '#b07a52'); if (e.k === 'luban') { R(6, 7, 1, 1, '#f0e0b0'); R(8, 7, 1, 1, '#f4e8c0'); } else { R(6, 7, 2, 1, '#3a2414'); R(8, 6, 1, 2, '#2a1a0e'); } }
        else if (e.k === 'sand') { R(5, 10, 6, 2, '#9a8763'); R(6, 9, 3, 1, '#9a8763'); }
        if (e.pearl) { R(6, 8, 4, 2, '#a83a2a'); R(7, 7, 2, 1, '#f4ece8'); }
      },
      barjeel(g, e, t, R) {   // 风塔：方塔身，四面竖着通风槽
        R(1, -26, 14, 30, '#a8916c'); R(1, -26, 2, 30, '#bca480'); R(13, -26, 2, 30, '#86704f');
        for (let i = 0; i < 3; i++) R(4 + i * 3, -22, 2, 14, '#2a2016');
        R(0, -29, 16, 3, '#bca480'); for (let i = 0; i < 4; i++) R(i * 4, -31, 2, 2, '#bca480');
        R(1, 2, 14, 2, 'rgba(0,0,0,.25)');
      },
      minaret(g, e, t, R) {   // 清真寺的小宣礼塔
        R(4, -30, 8, 34, '#b8a07a'); R(4, -30, 2, 34, '#ccb48c'); R(10, -30, 2, 34, '#957e5c');
        R(2, -22, 12, 2, '#ccb48c'); R(3, -20, 10, 1, '#7a6648'); R(6, -34, 4, 4, '#ccb48c'); R(7, -36, 2, 2, '#ccb48c');
        R(7, -14, 2, 4, '#2a2016');
      },
      burj(g, e, t, R) {   // 圆形瞭望塔的塔顶（画在墙顶上）
        R(2, -12, 44, 26, '#9c8462'); R(2, -12, 4, 26, '#b49a74'); R(40, -12, 6, 26, '#7a6648');
        for (let i = 0; i < 6; i++) R(3 + i * 7, -16, 5, 4, '#b49a74');
        for (let i = 0; i < 3; i++) R(10 + i * 12, -4, 2, 6, '#2a2016');
      },
      mdoor(g, e, t, R) {   // 清真寺的尖拱门
        R(2, 0, 12, 14, '#b8a07a'); R(4, 2, 8, 12, '#1a140e'); R(5, 1, 6, 1, '#1a140e'); R(6, 0, 4, 1, '#1a140e'); R(3, 13, 10, 1, '#7a6648');
      },
      palm(g, e, t, R) {   // 椰枣树；dead = 枯死
        const tr = e.dead ? '#6a5a46' : '#7a6248';
        R(7, -20, 2, 34, tr); for (let i = 0; i < 6; i++) R(6, -18 + i * 5, 4, 1, shade(tr, -.25));
        if (e.dead) { R(3, -22, 5, 1, '#5a4a38'); R(9, -23, 5, 1, '#5a4a38'); R(5, -24, 2, 2, '#5a4a38'); return; }
        const sw = Math.sin(t * 1.3 + e.x) > .3 ? 1 : 0, c = '#2e4a2a', c2 = '#3c5e34';
        R(-6 + sw, -24, 12, 2, c); R(10 + sw, -24, 12, 2, c); R(-4 + sw, -22, 4, 3, c2); R(16 + sw, -22, 4, 3, c2); R(1, -28, 14, 4, c2); R(4, -31, 8, 3, c); R(-2 + sw, -20, 4, 2, c); R(14 + sw, -20, 4, 2, c);
        R(6, -21, 4, 3, '#8a4a20');
      },
      car4(g, e, t, R) {   // 一辆老陆地巡洋舰（侧面，车头朝左）
        R(0, 4, 32, 9, '#d8d2c2'); R(0, 4, 32, 1, '#ece8dc'); R(4, -3, 22, 8, '#d8d2c2'); R(5, -2, 9, 5, '#26303a'); R(15, -2, 10, 5, '#26303a');
        R(0, 9, 32, 1, '#a49c8a'); R(0, 5, 2, 3, e.hz ? ((t * 2) % 1 < .5 ? '#ffb030' : '#7a5a2a') : '#c8c0a0'); R(30, 5, 2, 3, e.hz ? ((t * 2) % 1 < .5 ? '#ff7020' : '#6a2a1a') : '#8a3a2a');
        R(3, 11, 7, 5, '#141414'); R(22, 11, 7, 5, '#141414'); R(5, 13, 3, 1, '#5a5a5a'); R(24, 13, 3, 1, '#5a5a5a');
        if (e.sand) { R(0, 3, 32, 2, '#c8a870'); R(4, -4, 22, 2, '#c8a870'); R(5, 0, 9, 3, 'rgba(200,168,112,.75)'); R(15, 0, 10, 3, 'rgba(200,168,112,.75)'); }
        if (e.arrow) { R(6, 0, 6, 1, '#4a3a28'); R(6, -1, 1, 3, '#4a3a28'); R(5, 0, 1, 1, '#4a3a28'); R(7, 2, 5, 1, '#5a4a34'); }
      },
      storm(g, e, t, R) {   // 沙暴：整屏斜飞的沙（跟着玩家画，客机按自己画面画）
        const k = e.k ?? 1;
        g.fillStyle = `rgba(150,105,55,${.14 * k})`; g.fillRect(0, 0, VW, VH);
        const n = (90 * k) | 0;
        for (let i = 0; i < n; i++) {
          const sp = 140 + hash(i, 1, 3) * 200, L = VW + 60;
          const x = (((hash(i, 2, 3) * L + t * sp) % L) + L) % L - 30, y = (((hash(i, 3, 3) * VH + t * sp * .3) % VH) + VH) % VH;
          g.fillStyle = `rgba(214,172,112,${(.22 + hash(i, 4, 3) * .4) * k})`; g.fillRect(x | 0, y | 0, 3 + (hash(i, 5, 3) * 7 | 0), 1);
        }
        for (let i = 0; i < 5; i++) { const y = ((t * 30 + i * 53) % (VH + 40)) - 20; g.fillStyle = `rgba(170,120,70,${.08 * k})`; g.fillRect(0, y | 0, VW, 10 + i * 3); }
      },
      surf(g, e, t, R) {   // 海浪：屏幕左边（西边）一阵一阵的白沫，离海越近越清楚
        const k = clampN(1 - (W.pl.x - 4) / 34, 0, 1), ph = (t / 3.6) % 1, a = (Math.sin(ph * Math.PI * 2) * .5 + .5) * k;
        if (a < .03) return;
        for (let i = 0; i < 8; i++) { const y = (VH * (i + .5) / 8 + Math.sin(t * .8 + i) * 6) | 0, w = (6 + a * 16 + Math.sin(t * 2 + i * 1.7) * 4) | 0; g.fillStyle = `rgba(230,240,245,${(.25 * a).toFixed(2)})`; g.fillRect(0, y, w, 2); g.fillRect(w, y + 2, 4, 1); }
      },
      dustwall(g, e, t, R) {   // 从海上推过来的沙墙（瞭望塔上看见的）
        for (let i = 0; i < 9; i++) { const y = -220 + i * 52, wob = Math.sin(t * .8 + i) * 6; R(-40 + wob, y, 70, 60, i % 2 ? 'rgba(120,80,40,.85)' : 'rgba(150,100,55,.8)'); R(26 + wob, y + 10, 14, 36, 'rgba(170,120,70,.55)'); }
      },
      goat(g, e, t, R) {   // 黑山羊
        const c = '#151214', ch = Math.sin(t * 5) > .6 ? 1 : 0;
        R(2, 6, 10, 6, c); R(10, 3, 5, 5, c); R(11, 1, 1, 3, '#6a5c48'); R(13, 1, 1, 3, '#6a5c48'); R(12, 4, 2, 1, '#d8b020'); R(12, 4, 1, 1, '#050404');
        R(14, 7 + ch, 1, 2, c); R(3, 12, 2, 3, c); R(9, 12, 2, 3, c); R(1, 7, 2, 2, c);
      },
      hoofp(g, e, t, R) { for (let i = 0; i < 4; i++) { const x = 2 + ((hash(e.x, e.y, i) * 10) | 0), y = 2 + ((hash(e.y, e.x, i) * 10) | 0); R(x, y, 1, 2, 'rgba(40,28,18,.6)'); R(x + 2, y, 1, 2, 'rgba(40,28,18,.6)'); } },
      arish(g, e, t, R) { R(0, 2, 16, 12, '#6a5a3a'); for (let x = 0; x < 16; x += 2) R(x, 1 + (x % 4 ? 1 : 0), 1, 13, '#8a7448'); R(0, 6, 16, 1, '#4a3a22'); R(0, 10, 16, 1, '#4a3a22'); },
      mandoos(g, e, t, R) {   // 镶铜钉的木箱（mandoos）
        box(R, 1, 3, 14, 11, '#5a3418'); R(1, 3, 14, 3, e.open ? '#1a0e06' : '#6e4220');
        for (let i = 0; i < 5; i++) { R(2 + i * 3, 7, 1, 1, '#e0b040'); R(2 + i * 3, 11, 1, 1, '#e0b040'); }
        R(7, 6, 2, 3, '#c89a30');
        if (e.open) { R(1, -3, 14, 6, '#6e4220'); R(2, -2, 12, 1, '#e0b040'); R(5, 4, 6, 2, '#e8dcc0'); }
      },
      dallah(g, e, t, R) { R(5, 6, 6, 7, '#c89a40'); R(6, 4, 4, 2, '#d8aa50'); R(7, 2, 2, 2, '#e0b860'); R(11, 6, 3, 1, '#c89a40'); R(13, 4, 1, 3, '#c89a40'); R(3, 7, 2, 4, '#a07828'); R(4, 13, 8, 1, 'rgba(0,0,0,.3)'); },
      shaft(g, e, t, R) {   // 风塔底下：地上一方亮一点的沙，沙粒从上面簌簌地落
        R(1, 1, 14, 14, 'rgba(190,170,130,.25)'); R(1, 1, 14, 1, 'rgba(0,0,0,.2)');
        for (let i = 0; i < 6; i++) { const y = ((t * 22 + i * 9) % 18) - 2; R(2 + ((i * 5) % 12), y | 0, 1, 2, 'rgba(220,200,150,.6)'); }
      },
      cushion2(g, e, t, R) { R(1, 6, 14, 8, '#7a2a24'); R(1, 6, 14, 2, '#9a3a2c'); R(2, 9, 12, 1, '#c8a040'); },
      jar(g, e, t, R) { R(4, 4, 8, 10, '#8a5a34'); R(3, 6, 10, 6, '#9a6a3e'); R(5, 2, 6, 2, '#6a4024'); R(5, 7, 2, 3, '#b07a4a'); R(4, 14, 8, 1, 'rgba(0,0,0,.3)'); },
      cap(g, e, t, R) { R(4, 9, 7, 3, '#2a4a8a'); R(9, 11, 4, 1, '#1e3a6a'); R(6, 9, 3, 1, '#e8e8e8'); },
      newtown(g, e, t, R) {   // 公路对面新村的房子和灯
        R(0, -6, 48, 20, '#141018'); for (let i = 0; i < 6; i++) if (hash(i, e.y, 5) < .6) R(3 + i * 7, -1 + (i % 2) * 5, 3, 3, '#d8b860');
        R(36, -26, 4, 22, '#141018'); R(35, -28, 6, 2, '#141018'); R(37, -31, 2, 3, '#58d878');
      },
      shopfront(g, e, t, R) { R(1, 0, 14, 13, '#3a2a1a'); R(2, 1, 12, 11, '#1a120a'); R(1, 0, 14, 2, '#6a5034'); R(3, 9, 10, 2, '#5a4430'); },
      lamp2(g, e, t, R) { R(7, -4, 2, 3, '#333'); box(R, 4, -1, 8, 9, '#e8a050'); R(5, 1, 6, 5, '#ffd27a'); }
    },
    maps: {
      /* ---------------- 公路边 ---------------- */
      road: {
        amb: 'wind', dark: .5, plr: 3.4, wall: 'stone', wallC: { top: '#3e3022', face: '#9c8462', trim: '#5e4a34' }, darkC: '#06070e', floor: 'sand',
        legend: { G: 'ghaf', s: 'sand' },
        rows: [
          '##GGGGGGGGGGGGGGGG::|:GGGG',
          '##GGGGGGGGGGGGGGGG::|:GGGG',
          '##sssssssGssssssss::|:GGGG',
          '##ssGsssssssssssss::|:GGGG',
          '##ssssssssssssssss::|:GGGG',
          '##ssssssssssssssss::|:GGGG',
          'ssssssssssssssssss::|:GGGG',
          'ssssssssssssssssss::|:GGGG',
          'ssssssssssssssssss::|:GGGG',
          '##ssssssssssssssss::|:GGGG',
          '##sGssssssssssssss::|:GGGG',
          '##sssGssssssssssss::|:GGGG',
          '##sssssssssssssGss::|:GGGG',
          '##GGGGGGGGGGGGGGGG::|:GGGG',
          '##GGGGGGGGGGGGGGGG::|:GGGG'],
        ents: [
          ...[6, 7, 8].map(y => ({ x: 0, y, spr: 'invisible', touch: S => toVillage(S) })),
          { id: 'car', x: 13, y: 7, w: 2, spr: 'car4', s: { hz: 1 }, on: S => carOn(S) },
          { id: 'haz', x: 13, y: 7, w: 2, spr: 'invisible', solid: false, light: { r: 2.4, col: 'rgba(255,160,50,.2)', flick: true } },
          { x: 5, y: 5, spr: 'sign', col: '#6a5a3a', async on(S) { if (S.once('sign')) await S.narr('一块铁皮说明牌，歪歪地插在沙里。'); await S.note('sign'); } },
          { x: 23, y: 3, w: 3, spr: 'newtown', on: S => S.narr('公路对面是新村。一排排水泥房子，窗户里亮着灯。\n清真寺宣礼塔的塔尖上，亮着一圈小小的绿灯。\n四十多年前，红岛的人家，就是搬到了这样的地方。') },
          { x: 23, y: 10, w: 3, spr: 'newtown', on: S => S.narr('新村的房子。有一家的院子里停着皮卡，车斗里绑着一只骆驼草编的篮子。') },
          { x: 19, y: 7, spr: 'invisible', solid: false, on: S => S.narr('公路。一辆大货车轰隆隆地开过去，车灯扫过沙地，又走远了。\n往北是哈伊马角城，往南是迪拜。') },
          { x: 8, y: 3, spr: 'palm', on: S => S.narr('一棵孤零零的椰枣树，叶子被风吹得哗啦哗啦响。') },
          { x: 3, y: 9, spr: 'palm', s: { dead: 1 }, on: S => S.narr('一棵枯死的椰枣树，只剩光秃秃的树干。') },
          { x: 1, y: 5, spr: 'invisible', on: S => S.narr('村子外面的老墙，珊瑚石垒的，石头里还嵌着细小的贝壳。\n一块一块，都是当年从海里采上来的。') },
          { x: 1, y: 9, spr: 'invisible', on: S => S.narr('老墙塌下来的一角。墙根底下，沙子被风推成了一道小小的坡。') },
          { id: 'maryR', x: 12, y: 8, spr: '@mary', dir: 1, solid: false, on: S => maryTalk(S) },
          { id: 'saifR', x: 12, y: 9, spr: '@saif', solid: false, hidden: true },
          { id: 'stormR', x: 11, y: 8, spr: 'storm', solid: false, hidden: true, z: 9, light: { pl: true, r: 2.6, col: 'rgba(170,115,60,.22)' } }
        ],
        async enter(S, first) { if (first) return opening(S); }
      },
      /* ---------------- 老村（红岛） ---------------- */
      village: {
        amb: 'wind', dark: .55, plr: 3.6, wall: 'stone', wallC: { top: '#463626', face: '#9c8462', trim: '#5e4a34' }, darkC: '#06070e', floor: 'sand',
        legend: { Y: 'yard', s: 'sand' },
        rows: [
          '~~~~########################################',
          '~~~~########################################',
          '~~~~########################################',
          '~~~~###########YYYYY########################',
          '~~~~###########YYYYY###########YYY#YY##YYY##',
          '~~~~###########################YYY#YY##YYY##',
          '~~~~####ssssss#################YYY#YY##YYY##',
          '~~~~#########s#################YYY##########',
          '~~~~#########sddddddddd#####################',
          '~~~~###YY####sddddddddd#####################',
          '~~~~###YY#s###ddddddddd#####################',
          '~~~~###YY#s########s########################',
          '~~~~######s########s########################',
          '~~~~######s########s########################',
          '~~~~oossssssssssssssssss####################',
          '~~~~######s########s#####sssssssssssssssssss',
          '~~~~######s########s########s#######s#######',
          '~~~~##YYY#s########s##YYYY##s#YYYY##s#######',
          '~~~~##YYY#s########s##YYYY##s#YYYY##s##YYY##',
          '~~~~##YYY#s#YYYYY##s##YYYY##s#YYYY#ddd#YYY##',
          '~~~~##YYY#s#YYYYY##s########s######ddd#YYY##',
          '~~~~######s#YYYYY##s########s##########YYY##',
          '~~~~######s########sssssssssssssss##########',
          '~~~~######s#################################',
          '~~~~######s#############YYYY################',
          '~~~~######ssssss#####YY#YYYY##YYYYY#########',
          '~~~~#################YY#YYYY##YYYYY#########',
          '~~~~########################################'],
        ents: [
          { x: 43, y: 15, spr: 'invisible', touch: S => gateOut(S) },
          ...fpEnts(),
          ...MARKS.map(m => ({ id: m.id, x: m.x, y: m.y, spr: 'mark', hidden: true, s: Object.assign({}, m.s), light: { r: .8, col: 'rgba(255,220,90,.10)', dy: 6 }, on: (S, e) => markOn(S, e) })),
          /* 瞭望塔 */
          { x: 39, y: 11, w: 3, spr: 'burj' },
          { x: 40, y: 14, spr: 'door', col: '#6a4a2a', open: true, on: S => towerOn(S) },
          { x: 42, y: 14, spr: 'invisible', on: S => S.narr('瞭望塔的墙上开着一条条窄窄的射击孔。\n当年，塔上的人就是从这里看着海，看着沙漠里的水井。') },
          /* 堡垒 */
          { x: 31, y: 14, spr: 'door', col: '#4a3a2a', locked: true, on: S => S.narr('堡垒的大门。门上新装了一道铁栅栏，挂着一把大锁和一块牌子：\n「修缮中　禁止入内」') },
          { x: 33, y: 14, spr: 'window', on: S => S.narr('堡垒高处的小窗，黑洞洞的。风从窗洞里穿过去，发出低低的「呜」声。') },
          { x: 29, y: 14, spr: 'invisible', on: S => S.narr('墙上一块块珊瑚石，表面全是细细的孔，像风干了的海绵。\n有一块石头里嵌着半个海螺壳。') },
          /* 集市 */
          { x: 31, y: 21, spr: 'shopfront', on: S => S.narr('集市的铺面，一间挨一间，每间只有一张床那么大。\n木头柜台早就朽了，墙上还留着钉过秤杆的钉子。') },
          { x: 32, y: 21, spr: 'shopfront', on: S => S.narr('铺子里堆着一层沙。沙里半埋着一只缺了嘴的陶罐。\n当年，珠商就坐在这样的铺子里，用一套铜筛子给珍珠分大小。') },
          { x: 33, y: 21, spr: 'shopfront', on: S => S.narr('最里面那间铺子的门框上，有人用炭画了一条小船，船上站着几个小人。\n画得很笨，像是小孩子画的。') },
          /* 羊圈和井 */
          { x: 35, y: 18, spr: 'arish' }, { x: 37, y: 18, spr: 'arish' },
          { id: 'goat', x: 35, y: 20, spr: 'goat', on: S => goatOn(S) },
          { id: 'hoofG', x: 35, y: 20, spr: 'hoofp', decal: true, hidden: true, on: S => S.narr('羊圈的沙地上，一圈小小的蹄印。\n只进来，没有出去。') },
          { x: 37, y: 20, spr: 'well', on: S => S.narr(S.f.ph === 'storm' ? '一口老井。风灌进井口，发出「嗡——」的长音，像有人在底下吹气。' : '一口老井，井口用几块珊瑚石围着。往下照，照不到底，只闻到一股咸腥味。\n瞭望塔守着的，就是村里的这几口井。') },
          /* 清真寺 */
          { x: 20, y: 4, spr: 'minaret' },
          { x: 17, y: 7, spr: 'mdoor', on: S => mosqueOn(S) },
          { x: 15, y: 7, spr: 'window', on: S => S.narr('清真寺的窗户，窗洞是尖拱形的，没有玻璃。\n月光照进去，在地上铺了一块白。') },
          { x: 20, y: 7, spr: 'window', on: S => S.narr('窗台上落着几根羽毛。鸽子在宣礼塔里做了窝。') },
          { x: 21, y: 10, spr: 'dallah', on: S => S.narr('空场边上扔着一只铜咖啡壶（dallah），壶嘴瘪了。\n壶身是热的。') },
          /* 清真寺后面的房子 */
          { id: 'bdoor', x: 10, y: 5, spr: 'door', col: '#6a5040', on: S => badDoorOn(S) },
          { id: 'blamp', x: 11, y: 5, spr: 'lamp2', hidden: true, light: { r: 2.6, col: 'rgba(255,180,90,.26)', flick: true } },
          { x: 10, y: 6, spr: 'hoofp', decal: true },
          { x: 8, y: 5, spr: 'window', on: S => S.narr(S.f.ph === 'storm' ? '窗缝里透出暖黄的灯光，还有人影晃来晃去，像在转着圈跳舞。' : '一扇小窗，木板钉死了。木板缝里黑漆漆的。') },
          /* 海墙的豁口 */
          { x: 4, y: 14, spr: 'invisible', solid: false, on: S => S.narr(S.f.ph === 'storm' ? '海墙的豁口。浪就在脚边，「哗——」地扑上来，又退回去。\n这里是村子的最西边。车，在完全相反的方向。' : '海墙塌开的一个豁口。浪一层一层地涌上来，舔着脚边的石头。\n月光底下，海是黑的，远处有一盏渔船的灯。') },
          /* 风塔大宅 */
          { x: 12, y: 17, spr: 'barjeel' }, { x: 14, y: 16, spr: 'barjeel' }, { x: 16, y: 17, spr: 'barjeel' },
          { id: 'blink', x: 14, y: 16, spr: 'invisible', solid: false, light: { r: 1.3, col: 'rgba(230,240,255,.34)', flick: true } },
          { id: 'bayd', x: 14, y: 24, spr: 'door', col: '#6a4a2a', open: true, on: S => baytDoor(S) },
          { x: 12, y: 24, spr: 'window', on: S => S.narr('大宅的窗户上嵌着木雕的格栅，花纹是一个套一个的八角星。') },
          { x: 16, y: 24, spr: 'invisible', on: S => S.narr('大宅的墙比别家的都高，墙面上还留着一点当年刷的白灰。') },
          { id: 'cap', x: 10, y: 20, spr: 'cap', on: S => capOn(S) },
          /* 别的墙 */
          { x: 13, y: 13, spr: 'invisible', on: S => S.narr('墙上有人用红喷漆写了个名字和年份：「2006」。\n玛雅姆皱了皱眉，没说话。') },
          { x: 16, y: 13, spr: 'window', on: S => S.narr('窗里是一间小屋，地上散着几块碎了的瓦片。墙角立着一把扫帚，扫帚头早烂没了。') },
          { x: 22, y: 21, spr: 'window', on: S => S.narr('木格窗。格子里卡着一只褪色的塑料拖鞋。') },
          { x: 24, y: 21, spr: 'door', col: '#5a4030', on: S => S.narr('一扇关着的木门，门上钉着一排排铁钉，门环是一只铁圈，被人的手磨得发亮。\n门缝底下压着一块褪色的门帘布。') },
          { x: 22, y: 13, spr: 'door', col: '#5a4232', on: S => S.narr('一扇木门，被沙子埋住了下半截，推不开。') },
          { x: 35, y: 14, spr: 'invisible', on: S => S.narr('墙根底下长着一丛骆驼刺，被风吹得贴在地上。') },
          /* 院子里的树（看得见，走不进去） */
          { x: 13, y: 20, spr: 'palm', s: { dead: 1 } }, { x: 23, y: 18, spr: 'palm' }, { x: 7, y: 18, spr: 'palm' }, { x: 40, y: 19, spr: 'palm' },
          { x: 25, y: 25, spr: 'palm' }, { x: 32, y: 6, spr: 'palm' }, { x: 32, y: 18, spr: 'palm', s: { dead: 1 } }, { x: 17, y: 4, spr: 'palm' },
          /* 人 */
          { id: 'maryV', x: 42, y: 15, spr: '@mary', solid: false, hidden: true, on: S => maryTalk(S) },
          { id: 'saifV', x: 14, y: 25, spr: '@saif', solid: false, hidden: true, on: S => S.say('赛义夫', '……姐，我好像听见妈妈在叫我。', { style: 'whisper' }) },
          { id: 'umm', x: 12, y: 25, spr: '@umm', solid: false, hidden: true, light: { r: 1.5, col: 'rgba(170,120,210,.18)' } },
          /* 画面效果 */
          { id: 'storm', x: 14, y: 25, spr: 'storm', solid: false, hidden: true, z: 9, light: { pl: true, r: 2.4, col: 'rgba(170,115,60,.22)' } },
          { id: 'surf', x: 14, y: 25, spr: 'surf', solid: false, hidden: true, z: 8 },
          { id: 'dust', x: 3, y: 13, spr: 'dustwall', solid: false, hidden: true, z: 7 }
        ],
        async enter(S, first) { if (first) return villageIntro(S); },
        step(S, x, y) { return villageStep(S, x, y); }
      },
      /* ---------------- 风塔大宅 ---------------- */
      bayt: {
        amb: 'wind', dark: .62, plr: 3.2, wall: 'plain', wallC: { top: '#3a2e22', face: '#b8a688', trim: '#7a6a50' }, darkC: '#08070a', floor: 'hasir',
        legend: { a: 'hasir' },
        tileOpts: { rugC: '#6a2a24' },
        rows: [
          '#######################',
          '#######################',
          '#aaaaaa#aaaaaaa#aaaaaa#',
          '#aaaaaa#aaaaaaa#aaaaaa#',
          '#aaaaaa#aaaaaaa#aaaaaa#',
          '#aaaaaa#aaaaaaa#aaaaaa#',
          '######a####a####a######',
          '######ddddddddddd######',
          '#aaaa#ddddddddddd#rrrr#',
          '#aaaa#ddddddddddd#rrrr#',
          '#aaaaadddddddddddrrrrr#',
          '#aaaa#ddddddddddd#rrrr#',
          '#aaaa#ddddddddddd#rrrr#',
          '###########d###########',
          '###########d###########',
          '#######################'],
        ents: [
          { x: 11, y: 14, spr: 'invisible', touch: S => baytExit(S) },
          ...Object.keys(NICHE).map(id => ({ id, x: NICHE[id].x, y: NICHE[id].y, spr: 'taqa', s: { k: NICHE[id].k }, on: S => niche(S, id) })),
          { id: 'wm', x: 3, y: 1, spr: 'mark', hidden: true, s: { d: 1, n: 3, mir: 1 }, light: { r: .8, col: 'rgba(255,220,90,.10)', dy: 6 }, on: (S, e) => markOn(S, e) },
          { x: 3, y: 3, spr: 'shaft', decal: true, on: S => shaftOn(S, '西北') },
          { x: 11, y: 3, spr: 'shaft', decal: true, on: S => shaftOn(S, '正北') },
          { x: 18, y: 3, spr: 'shaft', decal: true, on: S => shaftOn(S, '东北') },
          { x: 11, y: 9, spr: 'palm', s: { dead: 1 }, on: S => S.narr('院子当中一棵枯死的椰枣树。树干上缠着一圈褪色的布条，打了好几个结。\n树底下的沙地上，有一串运动鞋的鞋印，绕着树转了一圈，又往东北角的屋子去了。') },
          { id: 'mandoos', x: 21, y: 8, spr: 'mandoos', on: S => mandoosOn(S) },
          { x: 18, y: 8, spr: 'dallah', on: S => S.narr('会客厅（majlis）的角落里摆着一只铜咖啡壶，旁边一摞没有把的小杯子，一个套一个。\n客人喝够了，就把杯子轻轻晃一晃——意思是「谢谢，不要了」。') },
          { x: 18, y: 12, spr: 'cushion2', on: S => S.narr('沿墙摆着的靠垫，红布面早就褪了色，一碰就冒出一股灰。') },
          { x: 19, y: 12, spr: 'cushion2' }, { x: 20, y: 12, spr: 'cushion2' },
          { x: 1, y: 9, spr: 'jar', on: S => S.narr('储藏间里一口大陶缸，以前装椰枣或者淡水。缸底干得裂了口。') },
          { x: 1, y: 11, spr: 'jar', on: S => S.narr('另一口陶缸，缸口压着一块木板。木板底下，是一窝早就干掉的蜂巢。') },
          { x: 3, y: 12, spr: 'rope', on: S => S.narr('一盘粗粗的棕榈纤维绳，一头拴着一块打了孔的石头。\n采珠的人下海时，就是靠这样一块石头坠着往下沉。') },
          { x: 2, y: 7, spr: 'invisible', on: S => S.narr('储藏间的墙上钉着几根木橛子，挂过东西的地方，墙皮颜色浅一块。') },
          { x: 8, y: 6, spr: 'window', on: S => S.narr('屋子朝院子开着窗，窗格是木雕的。风从格子里钻过去，嘶嘶地响。') },
          { x: 14, y: 6, spr: 'window', on: S => S.narr('窗格里卡着一根干枯的红树枝。') },
          { x: 15, y: 11, spr: 'invisible', on: S => S.narr('院子的地上铺过一层碎贝壳，踩上去咔嚓咔嚓地响。') },
          { id: 'saifB', x: 20, y: 4, spr: '@saif', dir: 1, on: S => saifTalk(S) },
          { id: 'maryB', x: 11, y: 13, spr: '@mary', solid: false, hidden: true, on: S => maryTalk(S) }
        ],
        async enter(S, first) { if (first) return baytEnter(S); }
      }
    }
  });

  /* ================= 小工具 ================= */
  function spineCells() {
    const c = [];
    for (let x = 42; x >= 28; x--) c.push([x, 15]);
    for (let y = 16; y <= 22; y++) c.push([28, y]);
    for (let x = 27; x >= 19; x--) c.push([x, 22]);
    for (let y = 21; y >= 14; y--) c.push([19, y]);
    for (let x = 18; x >= 10; x--) c.push([x, 14]);
    for (let y = 15; y <= 25; y++) c.push([10, y]);
    for (let x = 11; x <= 14; x++) c.push([x, 25]);
    return c;
  }
  function fpEnts() {
    const fp = spineCells().filter((_, i) => i % 2 === 0).concat([[19, 12], [18, 10], [16, 9], [20, 9]]);
    return fp.map(([x, y], i) => ({ id: 'fp' + i, x, y, spr: 'footprints', decal: true, col: 'rgba(40,28,18,.5)' }));
  }
  function freeSpot(S, list) {
    const m = curMap();
    for (const [x, y] of list) if (!(S.pl.x === x && S.pl.y === y) && passable(m, x, y, null)) return [x, y];
    return list[0];
  }
  /* 赛义夫跟着玛雅姆走（踩她上一步站过的格子） */
  const SFOL = { k: null, p: null };
  function saifTick(S) {
    if (!S.f.saifF) return;
    const sid = S.map === 'village' ? 'saifV' : S.map === 'road' ? 'saifR' : null, mid = S.map === 'village' ? 'maryV' : 'maryR';
    if (!sid) return;
    const s = S.ent(sid), m = S.ent(mid); if (!s || !m || s.hidden || s.mv) return;
    const mx = Math.round(m.px / TS), my = Math.round(m.py / TS), sx = Math.round(s.px / TS), sy = Math.round(s.py / TS), key = mx + ',' + my;
    if (SFOL.k !== key) { SFOL.p = SFOL.k; SFOL.k = key; }
    if (Math.abs(mx - sx) + Math.abs(my - sy) <= 1) return;
    let tx = mx, ty = my; if (SFOL.p) [tx, ty] = SFOL.p.split(',').map(Number);
    if (tx === sx && ty === sy) return;
    const mp = curMap(); let d = DIRS.findIndex(dd => dd[0] === tx - sx && dd[1] === ty - sy);
    if (d < 0) d = bfsStep(mp, sx, sy, tx, ty, s);
    if (d < 0) { s.px = tx * TS; s.py = ty * TS; s.x = tx; s.y = ty; return; }
    startMove(s, d, RUN_SPD * 1.2);
  }
  function tickAll(S, dt) {
    const f = S.f, p = S.pl, map = S.map;
    SF.dt = (SF.dt || 0) - dt;
    if (map === 'village') {
      const st = S.ent('storm'); if (st && !st.hidden) { st.px = p.px; st.py = p.py; }
      const sf = S.ent('surf'); if (sf && !sf.hidden) { sf.px = p.px; sf.py = p.py; }
      SF.wv = (SF.wv ?? 1.5) - dt;
      if (SF.wv <= 0) { SF.wv = 3.4 + Math.random() * .8; const k = clampN(1 - (p.x - 4) / 34, 0, 1); waves(S, (f.ph === 'storm' ? .02 : .012) + .07 * k * k); }
      if (f.ph === 'in' || f.ph === 'storm') {
        SF.pp = (SF.pp ?? 3) - dt;
        if (SF.pp <= 0) {
          const d = Math.abs(p.x - 10) + Math.abs(p.y - 6);
          SF.pp = f.ph === 'storm' ? 5 : 9 + Math.random() * 4;
          const v = f.ph === 'storm' ? clampN(.075 - d * .0028, .006, .075) : clampN(.028 - d * .0011, .003, .028);
          piping(S, v); if (Math.random() < (f.ph === 'storm' ? .6 : .35)) bleat(S, v * .9);
        }
      }
      if (f.ua) {
        const u = S.ent('umm');
        if (u && !u.hidden) {
          const d = (Math.abs(u.px - p.px) + Math.abs(u.py - p.py)) / TS;
          SF.hf = (SF.hf ?? 1) - dt;
          if (SF.hf <= 0) { SF.hf = clampN(.32 + d * .085, .4, 1.5); hoof(S, clampN(.12 - d * .008, .016, .11)); }
          SF.pf = (SF.pf || 0) - dt;
          if (d <= 5 && SF.pf <= 0) { SF.pf = 10; S.toast('……好香。沉香，茉莉。蹄子声就在后面。'); }
        }
      }
    } else if (map === 'road') {
      const st = S.ent('stormR'); if (st && !st.hidden) { st.px = p.px; st.py = p.py; }
    } else if (map === 'bayt') {
      SF.bw = (SF.bw ?? 2) - dt;
      if (SF.bw <= 0) { SF.bw = f.ph === 'leave' ? 3 : 6 + Math.random() * 3; windHowl(S, f.ph === 'leave' ? .045 : .022); }
    }
    saifTick(S);
  }

  /* ================= 公路边：出发 ================= */
  async function opening(S) {
    S.f.ph = 'road';
    await S.narr('晚上十点十分。\n公路边的路灯，到这里就断了。');
    await S.narr('公路西边，一大片黑黢黢的矮房子趴在海边。\n月光底下，几座方方的风塔和一根细细的宣礼塔，像插在沙子里的几根骨头。');
    S.face('maryR', 'pl');
    await S.say('玛雅姆', ['……嗯，外婆，我们到了。', '我知道。我都记住了。……好。挂了。']);
    await S.say('玛雅姆', ['法赫德他们已经跑到公路上，被他表哥接走了。', '赛义夫还在里面。手机打不通。', '爸在阿布扎比出差，妈要是知道了……苏晴，对不起，大半夜把你拖出来。']);
    const r = await S.ask('玛雅姆的手在抖。', ['说什么呢。走吧。', '……要不要先报警？'], '苏晴');
    if (r === 1) await S.say('玛雅姆', ['报了。他们说沙暴要来了，搜救队得等风小一点。', '等风小了……就太晚了。']);
    await S.say('玛雅姆', '你先看看他发的短信。');
    await S.note('sms');
    await S.say('玛雅姆', ['里面的巷子跟迷宫一样，白天都会走错。', '每到一个路口，我们就在墙上画个箭头，指着车子这边。旁边再写个数字——第几个路口。', '回来的时候，倒着数就行。']);
    S.give('crayon');
    await S.say('苏晴', '在古迹上乱画……');
    await S.say('玛雅姆', ['蜡笔，擦得掉的。', '……明天我自己去跟管理处道歉。']);
    S.give('torch', true); S.give('luban', true);
    await S.narr('她又从手套箱里摸出一支手电、一个小纸包，连同一张加油站的小票，一起塞给你。\n小票背面，是刚才她一边开车、一边让你照着记下来的——外婆的嘱咐。');
    await S.note('yadda');
    await S.say('玛雅姆', '车的双闪我开着。……走吧。村口在西边。');
    S.f.ph = 'road2';
    S.follow('maryR', true);
    S.goal('进村找赛义夫（每个路口画记号）');
  }
  async function maryTalk(S) {
    const ph = S.f.ph, nw = S.f.nw || 0;
    if (ph === 'road' || ph === 'road2') return S.say('玛雅姆', cyc(S, '_m0', ['村口在西边，墙上那个豁口。', '每个路口画一个记号。箭头指着车子。']));
    if (ph === 'in') return S.say('玛雅姆', S.f.cap ? '那座有三座风塔的大宅……他一定在里面。' : (S.f.nc || 0) < 5 ? '跟着鞋印走。到了路口，画记号。' : '鞋印还在往前……');
    if (ph === 'bayt') { if (!S.f.saif) return S.say('玛雅姆', '东北角那间屋子，有声音。'); return S.say('玛雅姆', HINT[Math.min(nw, 3)]); }
    if (ph === 'leave') return S.say('玛雅姆', '走吧。门在南边。');
    if (ph === 'storm') return S.say('玛雅姆', ['数字反着写的，不是我们画的。', '记号被刮花了，就背着海浪声，往东走。', '别停下。'], { style: 'whisper' });
    if (ph === 'out') return S.say('玛雅姆', '车！快上车！');
    return S.say('玛雅姆', '……回家吧。');
  }
  async function carOn(S) {
    const ph = S.f.ph;
    if (ph === 'out') return endGood(S);
    if (ph === 'dawn') return S.narr('车上落满了沙。');
    return S.narr(cyc(S, '_car', ['玛雅姆爸爸的旧陆地巡洋舰。收音机还开着：\n「……气象中心提醒，今夜西北风增强，拉斯海马沿海可能出现沙尘暴，能见度将降至五百米以下……」', '双闪一下一下地亮着，把四周的沙地照成橘黄色。\n回来的时候，就找这个光。']));
  }
  async function toVillage(S) {
    const ph = S.f.ph;
    if (ph === 'out' || ph === 'dawn') { await S.narr('……不回去了。'); return S.walk('pl', 'r', 4); }
    if (ph !== 'road2') return;
    S.follow('maryR', false); S.hide('maryR'); S.show('maryV'); S.follow('maryV', true);
    await S.go('village', 42, 15, 1);
  }

  /* ================= 老村：进去 ================= */
  async function villageIntro(S) {
    S.f.ph = 'in';
    await S.narr('村口的墙塌开了一个豁口。跨进去，风声一下子小了，像被关在了门外。');
    await S.say('玛雅姆', 'Bismillah.', { style: 'whisper' });
    await S.narr('玛雅姆在豁口里站了一下，低声念了一句，才跟上来。');
    await S.narr('巷子很窄，两个人并排都走不开。两边的墙是一块一块珊瑚石垒起来的，月光一照，白得发青。\n沙地上有几串运动鞋的鞋印，乱糟糟的，往村子深处去了。');
    goalA(S); S.cp('in');
  }
  function goalA(S) {
    if (S.f.cap) return S.goal('进前面那座风塔大宅');
    if ((S.f.nc || 0) < 5) return S.goal(`跟着鞋印找赛义夫（记号 ${S.f.nc || 0}/5）`);
    S.goal('跟着鞋印找赛义夫');
  }
  async function carve(S, k) {
    S.f['c' + k] = 1; S.f.nc = (S.f.nc || 0) + 1;
    const m = MARKS[k - 1];
    await S.walk('pl', [m.x, m.y + 1], 4.2); S.turn(3);
    scratch(S); await S.wait(450); S.show(m.id);
    if (k === 1) {
      await S.narr('路口。你拔开蜡笔帽，在墙上画了一个箭头，指着来时的方向，又在旁边写了一个「1」。\n蜡笔是荧光的，手电一照，黄得发亮。');
      await S.say('玛雅姆', '好。下一个路口写「2」。');
    } else if (k === 5) {
      await S.narr('第五个路口。箭头指着来路，旁边一个端端正正的「5」。');
      await S.say('玛雅姆', '……回去的时候，倒着数：五、四、三、二、一。', { style: 'whisper' });
    } else S.toast(`路口：画下记号「${k}」，箭头指回来路`);
    goalA(S);
  }
  async function towerOn(S) {
    if (S.f.ph !== 'in') return S.narr('瞭望塔的门在风里砰砰地撞。这种风，爬上去会被吹下来的。');
    if (S.f.tower) return S.narr('瞭望塔。上面风太大了，看过一眼就够了。');
    await S.narr('圆圆的瞭望塔，木门半开着。里面一道窄窄的石阶，绕着塔心往上转。');
    const r = await S.ask('爬上去看看？', ['上去看看', '算了']);
    if (r) return;
    S.f.tower = 1;
    await S.fade(1, 500);
    S.dark(.1); S.show('dust'); S.focus(17, 8);
    await S.fade(0, 500);
    await S.narr('塔顶的风很大。整座村子在月光底下铺开，一个个四方的院子挨挤在一起，巷子在中间弯弯绕绕。\n西边是清真寺，宣礼塔细细的一根。');
    S.focus(14, 19);
    await S.narr('西南边，有一座大宅比别的房子都高，屋顶上竖着三座风塔。\n中间那座风塔的开口里，有一点白光，一闪……一闪……');
    await S.say('玛雅姆', '手机的光！是赛义夫！');
    S.focus(6, 13); windHowl(S, .04);
    await S.narr('再往西，就是海。\n海面上压着一堵黄褐色的墙，从左到右，一眼望不到头。它在动——慢慢地，朝岸上推过来。');
    await S.say('玛雅姆', '沙暴……提前了。快下去！');
    await S.fade(1, 500); S.focus(null); S.dark(null); S.hide('dust'); await S.fade(0, 500);
  }
  async function goatOn(S) {
    if (S.f.goat) return;
    S.f.goat = 1;
    await S.narr('一只黑山羊站在塌了半边的羊圈里，嘴里嚼着什么，一动不动地看着你。\n它的眼睛是黄的，瞳孔是横着的一道扁缝。');
    bleat(S, .05);
    await S.say('玛雅姆', ['……这里四十年没人住了。', '谁会在这儿养羊？'], { style: 'whisper' });
    await S.alpha('goat', 0, 900);
    S.show('hoofG');
    await S.narr('你眨了一下眼睛。\n羊圈里空空的。沙地上只剩一圈小小的蹄印。');
  }
  async function mosqueOn(S) {
    if (S.f.ph === 'storm') return S.narr('清真寺的门。沙子在门槛前打着旋。\n你们没有进去，只是从门前走过。');
    await S.narr('清真寺的门开着一道缝。门里很暗，能看见一面一面的白墙，和墙上朝着麦加方向——这里差不多是正西——的壁龛。');
    if (S.once('mosque')) {
      await S.say('玛雅姆', ['这里是清真寺。人搬走了，它也还是。', '我们别穿着鞋进去。在门口站一下就好。']);
      await S.narr('玛雅姆在门槛外站了一会儿，嘴唇轻轻动了几下，然后转过身来。');
    }
  }
  async function badDoorOn(S) {
    if (S.f.ph === 'storm') return badHouse(S);
    await S.narr('清真寺后面一扇旧木门，门板被海风吹得发白，关得死死的。\n门前的沙地上，一圈一圈的小蹄印，挤得密密麻麻。');
    piping(S, .025);
    await S.think('……门里，好像有人在很轻很轻地吹着曲子。');
  }
  async function capOn(S) {
    S.hide('cap'); S.give('cap'); S.f.cap = 1;
    await S.narr('沙地上扔着一顶蓝色的棒球帽。帽檐上用马克笔写着：SAIF。');
    await S.say('玛雅姆', ['是他的！', '……前面那座有风塔的大宅。']);
    goalA(S);
  }
  async function baytDoor(S) {
    const ph = S.f.ph;
    if (ph === 'storm') return S.narr('大宅的门在风里一开一合。东西已经还回去了——别再进去打扰。');
    if (ph !== 'in') return;
    if (!S.f.cap) await S.narr('大宅的木门半掩着。门槛上落着一层沙，沙上有半个运动鞋印。');
    await S.narr('门里黑洞洞的。一阵风从风塔里灌下来，呜——');
    await S.say('玛雅姆', 'Bismillah.', { style: 'whisper' });
    S.f.ph = 'bayt';
    S.follow('maryV', false); S.hide('maryV'); S.show('maryB'); S.follow('maryB', true);
    await S.go('bayt', 11, 13, 3);
  }

  /* ================= 风塔大宅 ================= */
  async function baytEnter(S) {
    S.hide('blink');
    await S.narr('门里是一个四方的院子，当中立着一棵枯死的椰枣树。\n北边一排三间屋子，屋顶上各竖着一座风塔。风从塔顶灌下来，在屋子里呜呜地打转。');
    await S.say('玛雅姆', '赛义夫？……赛义夫！');
    sob(S); await S.wait(700);
    await S.narr('东北角那间屋子里，有人吸了一下鼻子。');
    S.goal('找到赛义夫（东北角的屋子）');
  }
  async function saifTalk(S) {
    S.face('saifB', 'pl');
    if (!S.f.saif) return saifFirst(S);
    if (S.has('pearl')) return S.say('赛义夫', cyc(S, '_sf', ['头顶有风……有外婆熏屋子的那个味道……里面刻着好多道道……', '我从那间屋子跑出来，就钻到这儿来了。', '……对不起。我不该拿的。']));
    return S.say('赛义夫', '……我们回家吧。');
  }
  async function saifFirst(S) {
    S.f.saif = 1;
    await S.narr('赛义夫缩在墙角，两只胳膊抱着膝盖，白袍子上全是沙。手机攥在手里，屏幕早黑了。');
    S.follow('maryB', false);
    await S.walk('maryB', freeSpot(S, [[20, 5], [21, 5], [19, 5], [21, 3]]), 5); S.face('maryB', 'saifB');
    await S.say('玛雅姆', '你这个笨蛋……！');
    await S.say('赛义夫', ['姐……', '我们就想拍个视频。阿卜杜拉说，在院子里吹口哨，它们就会出来。', '然后……清真寺后面就有人吹曲子，像婚礼上吹的那种。还有羊叫。', '手机屏幕上全是雪花。他们俩先跑了，我没跟上。']);
    await S.say('赛义夫', ['我躲进这个房子，在墙上的洞里摸到一个红布包。我想拿出去给他们看，证明我们真来过。', '然后外面就有「嗒、嗒」的声音，绕着房子走。', '有个女人在门口叫我的名字，用妈妈的声音。……可是妈妈根本不知道我在这儿。', '好香。香得我头疼。']);
    await S.say('玛雅姆', '东西呢？拿出来。');
    S.give('pearl');
    await S.narr('赛义夫从袍子里掏出一个红布小包，打开——是一颗珍珠。不太圆，手电一照，泛着一层淡淡的粉。');
    await S.say('玛雅姆', ['外婆说了，拿了它们家里的东西，要还到原处。', '你从哪个洞里拿的？']);
    await S.say('赛义夫', ['我不记得了……好黑……我就记得三件事。', '头顶有风，呜——呜——地往下灌。', '洞里有股味道，跟外婆礼拜五早上熏屋子的一样。', '我手伸进去，摸到里面刻着一道一道的，好多好多道，像在数数。']);
    await S.say('玛雅姆', '苏晴，你去放。我看着他。');
    S.goal('放回珍珠：风塔下·外婆的香·刻痕');
    if (S.coop) S.toast('双人：一人翻笔记和口袋对照，一人去看壁龛');
    S.cp('pearl');
  }
  async function shaftOn(S, which) {
    await S.narr(which + '那间屋子的正中，地上落着一方细沙。\n抬头看——屋顶上就是风塔的塔身，四面开着长长的口子，风从上面直灌下来，呜——呜——\n这样的屋子，夏天最凉快。');
  }
  async function mandoosOn(S) {
    const e = S.ent('mandoos');
    if (!e.open) {
      e.open = true; S.sfx('open');
      await S.narr('一只镶满铜钉的木箱（mandoos），从前是放嫁妆和贵重东西的。\n箱盖没锁。里面空空的，只在箱底压着一封折了好几折的信。');
      await S.narr('信是阿拉伯文写的。玛雅姆凑过来，借着手电的光，一句一句念给你听。');
    }
    S.f.letter = 1;
    await S.note('letter');
  }
  async function niche(S, id) {
    const e = S.ent(id), d = NICHE[id];
    if (e.s.pearl) return S.narr('红布包安安静静地躺在壁龛最里面，正好挨着那一面刻痕。');
    await S.narr(d.desc);
    if (!S.has('pearl')) return;
    const r = await S.ask('把珍珠放进这个壁龛？', ['放进去', '再看看']);
    if (r) return;
    return d.ok ? placeRight(S, e) : placeWrong(S, id);
  }
  async function placeWrong(S, id) {
    const d = NICHE[id], nw = S.f.nw = (S.f.nw || 0) + 1;
    S.take('pearl');
    await S.narr('你把红布包轻轻放进去。');
    S.tone('sine', 300, 120, .6, .05, 0, 800); await S.wait(500);
    await S.scare(nw === 1 ? 'flash' : 'static', { sfx: 'sting', dur: .6 });
    S.give('pearl', true);
    await S.narr('……「啪」的一声，红布包从壁龛里掉了出来，落在你脚边。\n像是被谁从里面推了出来。');
    if (!S.f.wm) {
      S.f.wm = 1; S.place('wm', d.wm[0], d.wm[1]); scratch(S, .04);
      await S.narr('壁龛旁边的墙上，「嚓、嚓」响了两声。\n手电照过去——那里多了一道黄色的记号：一个箭头，旁边写着一个「3」。\n可那个 3 的两个弯，是朝左鼓出来的。');
      await S.say('玛雅姆', ['……它们在学我们画记号。', '外婆说的——学人，总学反。'], { style: 'whisper' });
    }
    hoof(S, .04);
    await S.say('玛雅姆', d.why + '\n' + HINT[Math.min(nw - 1, 3)]);
  }
  async function placeRight(S, e) {
    S.take('pearl'); e.s.pearl = true;
    await S.narr('你把红布包放进壁龛最里面，正好挨着那一面密密麻麻的刻痕。');
    sigh(S);
    await S.narr('风塔里的风声，停了一拍。\n然后又呜呜地响起来——低低的，慢慢的，像谁长长地出了一口气。');
    if (S.f.letter) {
      const r = await S.ask('……这颗珠子，是那位母亲留给儿子的。', ['就让它留在这儿', '带走它——替她交给她儿子的后人']);
      if (r === 1) return badTake(S, e);
    }
    const r2 = await S.ask('该说点什么。', ['「打扰了。我们这就走。」', '（什么也不说）'], '苏晴');
    if (r2 === 0) { S.f.sorry = 1; chime(S); await S.narr('你的声音在空屋子里，轻轻地荡开了。'); }
    S.f.ph = 'leave';
    windHowl(S, .05);
    await S.narr('外面，风声变了。\n不再是呜呜的，而是一整片「沙——」的响声，像有一整座沙丘，正从海那边推过来。');
    S.face('maryB', 'pl');
    await S.say('玛雅姆', ['沙暴到了。', '……我们得走。']);
    await S.say('赛义夫', '不能在这儿等到天亮吗？');
    await S.say('玛雅姆', ['这是人家的家。东西还了，就别赖在人家家里。', '车就在村口。跟紧我。']);
    S.goal('离开大宅（南边的门）');
  }
  async function badTake(S, e) {
    e.s.pearl = false; S.give('pearl', true);
    await S.narr('你把红布包又攥回了手心。\n风塔里的风声，一下子停了。');
    await S.wait(600); S.sfx('sting');
    await S.narr('……停得干干净净。整座房子静得像一口井。\n墙上，「嚓、嚓、嚓」，有什么东西在一笔一笔地画着。');
    await S.fade(1, 900);
    return S.end({ bad: true, id: 'take', title: '带走的东西', text: '那一夜你们是怎么回到车上的，后来谁也说不清了。\n天亮的时候，沙暴停了。你们坐在车里，三个人的鞋里都灌满了沙。\n\n你托人找了一年，也没找到那位母亲的后人。\n那颗珍珠锁在你的抽屉里，一天比一天暗，最后暗成了一颗灰扑扑的小石子。\n\n从那以后，每到起风的夜里，你窗外就有「嗒、嗒」的声音，\n还有人用很好听的调子，在楼下轻轻地吹着曲子。\n\n它们在等。\n等东西回到原处。' });
  }
  async function baytExit(S) {
    if (S.f.ph === 'leave') return stormStart(S);
    await S.say('玛雅姆', S.f.saif ? '东西还没还回去。不能走。' : '赛义夫还没找到！');
    await S.walk('pl', 'u', 4);
  }

  /* ================= 沙暴 ================= */
  async function stormStart(S) {
    const f = S.f;
    f.ph = 'storm'; f.hit = 0; f.ua = 0; f.trail = [];
    S.dark(.9, 'village'); S.plr(1.5); S.norun(true); S.speed(.85);
    for (const e of W.maps.village.ents) if (/^fp/.test(e.id || '')) e.hidden = true;
    S.hide('cap'); S.hide('blink'); S.hide('goat');
    FORGED.forEach(id => S.show(id)); S.ent('mk5').s.er = true;
    S.show('storm'); S.show('surf'); S.show('blamp'); S.ent('bdoor').open = true;
    S.follow('maryB', false); S.hide('maryB'); S.hide('saifB');
    S.show('maryV'); S.follow('maryV', true); S.show('saifV'); f.saifF = 1; SFOL.k = SFOL.p = null;
    S.place('umm', 12, 25); S.hide('umm');
    SF.hf = 1; SF.pf = 0; SF.pp = 1.5;
    S.amb('wind');
    await S.go('village', 14, 25, 0, { ms: 500 });
    S.place('saifV', 13, 25);
    await S.narr('门一推开，风就像一堵墙一样撞了过来。\n沙子打在脸上，生疼。手电的光只照得到脚下一小圈，再往外，全是翻滚的黄。');
    await S.narr('鞋印早就没了。来时的巷子，一条也认不出来。');
    S.face('maryV', 'pl');
    await S.say('玛雅姆', ['听好。只认我们自己画的记号。', '我们写的数字是正的。外婆说它们学人，总学反——反着写的，不是我们画的。', '要是一个记号也认不出来，就听海。海在西边，车在东边。']);
    await S.say('赛义夫', '……姐，我听见羊叫了。', { style: 'whisper' });
    await S.say('玛雅姆', '别听那个。走。');
    S.goal('顺着记号回车上（反写的数字是假的）');
    if (S.coop) S.toast('双人：一人走路，一人读记号、听蹄子声');
    S.cp('storm');
  }
  function villageStep(S, x, y) {
    const f = S.f;
    if (f.ph === 'in') { for (const k in J) if (J[k].x === x && J[k].y === y && !f['c' + k]) return carve(S, +k); return; }
    if (f.ph !== 'storm') return;
    const tr = f.trail || (f.trail = []); tr.push([x, y]); if (tr.length > 40) tr.shift();
    for (const k in J) if (J[k].x === x && J[k].y === y && !f['v' + k]) return stormJ(S, +k);
    if (x === 28 && y === 18 && f.v3 && !f.fake3c) { f.fake3c = 1; S.show('fk3c'); scratch(S, .03); S.toast('身后的墙上，传来「嚓、嚓」的刮擦声。'); return; }
    if (x === 10 && y === 6) return badHouse(S);
    if (x >= 14 && x <= 22 && y >= 8 && y <= 10 && !f.sq) { f.sq = 1; return squareStorm(S); }
    if (DEADS.some(([a, b]) => a === x && b === y) && SF.dt <= 0) { SF.dt = 3; S.toast('死胡同！'); }
  }
  const JTXT = {
    5: '路口。\n墙上有一个记号，旁边还有一片被刮花了的黄印子。\n风从左边——西边——灌过来，裹着海浪声：哗……哗……',
    4: '路口。墙上有两个记号。\n北边很远的地方，有人在吹曲子，一高一低，像在办喜事。',
    3: '路口。墙上有三个记号。',
    2: '路口。墙上有两个记号。',
    1: '路口。墙上有两个记号。\n东边的沙幕里，好像有一点橘黄色的光，一闪，一闪。'
  };
  async function stormJ(S, k) {
    S.f['v' + k] = 1;
    await S.narr(JTXT[k]);
    if (k === 5 && !S.f.ua) return wakeUmm(S);
  }
  async function wakeUmm(S) {
    await S.narr('……身后，巷子深处。\n「嗒。」\n「嗒。」\n像蹄子，一下一下，敲在石头上。');
    hoof(S, .05);
    S.place('umm', 12, 25, 1); S.ent('umm').alpha = 1; S.f.ua = 1; SF.hf = .8;
    S.chase('umm', { spd: USPD, catch: caughtU });
    await S.say('玛雅姆', '别回头。……走。', { style: 'whisper' });
  }
  async function caughtU(S) {
    if (!S.f.hit) {
      S.f.hit = 1;
      await S.scare('face', { spr: '@umm', face: 'umm', sfx: 'scream' });
      await S.narr('香味一下子糊在脸上，甜得发苦。\n一道金光贴着你的脖子划过去——玛雅姆死死拽住你的胳膊，把你拖开了。');
      const tr = S.f.trail || [], p = S.pl; let pos = null;
      for (let i = tr.length - 1; i >= 0; i--) if (Math.abs(tr[i][0] - p.x) + Math.abs(tr[i][1] - p.y) >= 7) { pos = tr[i]; break; }
      if (!pos) pos = Math.abs(p.x - 12) + Math.abs(p.y - 25) >= 7 ? [12, 25] : [36, 15];
      S.place('umm', pos[0], pos[1]);
      await S.say('玛雅姆', '别停！它就跟在后面——', { style: 'whisper' });
      S.chase('umm', { spd: USPD, catch: caughtU });
      S.toast('再被追上，就逃不掉了');
      return;
    }
    await S.scare('face', { spr: '@umm', face: 'umm', sfx: 'scream' });
    DEATHS++;
    return S.die('沉香和茉莉的味道一下子灌满了鼻子。\n蹄子声停在你身后，近得能听见呼吸。\n一只戴满金镯子的手，轻轻搭上了你的肩膀——', '蹄子声停了');
  }
  async function squareStorm(S) {
    await S.narr('一片空场。清真寺在沙里只剩一个黑影，宣礼塔细细的一根。\n左手边的巷子尽头，有一点暖黄的灯光，一晃一晃。吹奏声和羊叫，就是从那边来的。');
    await S.say('玛雅姆', '……外婆说了，别凑过去。', { style: 'whisper' });
  }
  async function badHouse(S) {
    await S.narr('门开着。门里亮着暖黄的灯，铜咖啡壶在炭火上咕嘟咕嘟地响，乳香和小豆蔻的味道一阵阵飘出来。\n吹奏声就是从这里传出来的。还有拍手声、笑声，羊在院子里咩咩地叫。');
    await S.say('门里', '外面风大，孩子们，进来坐坐吧。喝杯咖啡，等天亮。', { style: 'whisper' });
    await S.say('玛雅姆', '……别进去。', { style: 'whisper' });
    const r = await S.ask('门里很暖和。', ['进去躲一躲', '退回去']);
    if (r === 0) return badWedding(S);
    await S.narr('你往后退了一步。\n门里的笑声停了一下，又接着响了起来，像什么也没发生过。');
    if (S.pl.x === 10 && S.pl.y === 6) await S.walk('pl', 'r', 4);
  }
  async function badWedding(S) {
    S.stop('umm'); S.hide('umm'); S.f.ua = 0;
    await S.narr('你跨过了门槛。\n风声一下子没了。屋里暖烘烘的，灯火通明，地上铺着红地毯，炭火上的铜咖啡壶嘶嘶地冒着热气。');
    await S.narr('满屋子都是人。男人的袍子雪白，女人的金首饰叮叮当当。吹奏的人鼓着腮帮子，拍手的人笑弯了眼睛。\n每个人都在笑。每个人的脚，都藏在长袍底下。');
    await S.narr('一个老人把一小杯咖啡递到你手里，杯子烫得刚刚好。\n「喝吧，孩子。喝了，就是我们的客人了。」');
    await S.narr('身后，玛雅姆在喊你的名字。声音隔着门，越来越远，越来越远——');
    await S.scare('face', { face: 'goat', sfx: 'scream' });
    await S.fade(1, 900);
    return S.end({ bad: true, id: 'wedding', title: '沙夜的喜事', text: '天亮以后，玛雅姆和赛义夫被搜救队在村口找到。\n他们说，你只是在清真寺后面那座老房子门口，停了一下。\n\n搜救队把那座房子翻了个遍。屋顶早塌了一半，地上积着厚厚的沙。\n沙上没有人的脚印。\n只有一圈一圈的小蹄印，挨挨挤挤，像跳过一整夜的舞。\n\n角落里放着一只小小的咖啡杯。\n杯底，还是温的。' });
  }
  async function gateOut(S) {
    const ph = S.f.ph;
    if (ph === 'in' || ph === 'bayt') { await S.say('玛雅姆', '赛义夫还在里面。'); return S.walk('pl', 'l', 4); }
    if (ph === 'storm') return reachGate(S);
  }
  async function reachGate(S) {
    S.stop('umm'); S.hide('umm'); S.f.ua = 0; S.f.ph = 'out';
    S.hide('storm'); S.hide('surf');
    S.follow('maryV', false); S.hide('maryV'); S.hide('saifV');
    S.show('maryR'); S.follow('maryR', true); S.show('saifR'); SFOL.k = SFOL.p = null;
    S.show('stormR'); S.dark(.86, 'road'); S.plr(1.9);
    await S.go('road', 1, 7, 2);
    S.place('saifR', 0, 7);
    await S.narr('豁口外面，风更大了。\n可是那一点橘黄色的光，就在前面——一闪，一闪。是车的双闪。');
    await S.say('玛雅姆', '车！快！');
    S.goal('上车');
  }

  /* ================= 天亮 ================= */
  const VOL3 = '十个夜晚。\n放学路上问路的猫脸奶奶，府衙里夜夜诉冤的两姐妹；\n夜里离了身子、飞出去的头，从屋顶缝里探下来的长舌；\n裹着白布一路蹦来的人，养在瓶子里的小鬼；\n门上那句「明天再来」，日落后不许进的古堡，垫高了的床脚——\n还有沙暴里，被学反了的记号。\n\n这一卷的夜，总是在等天亮。\n结要解开，瓶子要送回去，香油要放回原处，珍珠要还进壁龛；\n该回河里的回河里，该回身子里的回身子里。\n\n东西各归各位，人各回各家——\n天，才会亮。';
  const FIN = '三十个夜晚，三卷。\n\n从日本的雪夜、旧隧道和井边，\n到中国的古寺、河灯和子夜的集市；\n从韩国的山路和学校，\n到东南亚雨季里的高脚屋和坟场；\n从南亚的门板、日落后的古堡，\n到非洲河边垫高了床脚的小屋——\n最后，走到阿拉伯湾的风塔底下。\n\n每个地方的人，都给黑夜立了规矩。\n规矩各不相同，说的却总是那几句：\n别回头，别应声，别拿走不属于你的东西；\n天亮之前，回家。\n\n按百物语的老规矩，讲完一个故事，就吹灭一支蜡烛。\n今晚，又灭了三十支。\n\n剩下的，下回再讲。\n——别回头。你身后那一支，还亮着。';
  async function endGood(S) {
    const f = S.f;
    carDoor(S);
    await S.fade(1, 700);
    S.hide('stormR');
    await S.card('', '', '你们挤进车里，锁上了车门。\n沙子打在玻璃上，沙沙，沙沙，像有很多根指甲在外面轻轻地挠。\n赛义夫缩在后座，玛雅姆攥着方向盘，谁也不说话。');
    hoof(S, .04);
    await S.card('', '', '后半夜，「嗒、嗒」的声音绕着车子走了一圈。\n又一圈。\n第三圈走到一半，停了。\n\n一股很浓很浓的香味，从车门缝里渗进来，又慢慢地散了。');
    S.tone('sine', 294, 294, 3, .025, 0, 1200); S.tone('sine', 392, 392, 2.4, .018, 1.2, 1200);
    await S.card('', '', '不知过了多久，风小了。\n公路对面，新村清真寺的宣礼塔上亮着一圈绿灯，晨礼的宣礼声远远地飘过来，一个长长的音，接着又一个。\n玛雅姆跟着，很轻很轻地念了一句。\n赛义夫靠在她肩上，睡着了。');
    f.ph = 'dawn';
    S.dark(.06, 'road'); S.plr(null); S.speed(1); S.norun(false); S.amb('none');
    S.hide('haz'); const car = S.ent('car'); car.s.hz = 0; car.s.sand = 1; car.s.arrow = 1;
    S.follow('maryR', false); f.saifF = 0;
    S.place('maryR', 15, 8, 1); S.place('saifR', 16, 8, 1);
    await S.go('road', 12, 8, 2, { ms: 1100 });
    chime(S);
    await S.narr('早上七点，太阳从东边哈杰尔山的山脊后面升了起来。\n沙暴过去了。天像洗过一样，蓝得发白。');
    await S.narr('公路西边，老村子静静地趴在海边。风塔、宣礼塔、塌了半边的墙，都镀上了一层淡淡的金色。\n昨晚的沙子，把巷口的墙脚埋高了一截。');
    S.face('pl', 3);
    await S.narr('车身上落满了沙。驾驶座那边的车窗上，有人用手指在沙上画了一个箭头，指着公路。\n箭头底下，还有一行弯弯绕绕的阿拉伯字。');
    S.face('maryR', 1);
    await S.say('玛雅姆', '……字是反着写的。');
    await S.narr('她伸手把后视镜扳过来，对着那行字。\n镜子里，字是正的。');
    await S.say('玛雅姆', '「Ma\'a as-salama」……一路平安。');
    if (f.sorry) await S.think('……昨晚在壁龛前，你说过一声「打扰了」。');
    await S.say('赛义夫', '……我们回家吧。');
    await S.say('玛雅姆', '嗯。回家。');
    await S.fade(1, 1400);
    await S.card('卷三　终', '', VOL3);
    await S.card('百物语·贰　终', '', FIN);
    return S.end({ id: 'dawn', title: '第三十夜　完', text: '后来，赛义夫被禁足了一整个寒假。法赫德和阿卜杜拉被各自的爸爸领着，去管理处道了歉。\n玛雅姆真的去了，带着一块湿抹布，把墙上那五个黄箭头一个一个擦掉了。\n她说，有一个箭头怎么也擦不掉——数字是反着写的。\n她就没再擦。\n\n' + (f.letter ? '外婆说，她小时候认识风塔大宅那一家。那个去科威特的儿子，听说一直没有回来。\n那颗珍珠，大概还在风塔底下那个刻满道道的壁龛里，等着他。\n\n' : '') + '再有人问她，红岛到底闹不闹鬼，玛雅姆就说：\n「那是别人的家。路过的时候，打声招呼。」' });
  }
})();
