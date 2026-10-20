/* ================= 第十夜 · 黑眼孩子 ================= */
(() => {
  /* ---------- 地图小工具 ---------- */
  const G = (w, h, c) => Array.from({ length: h }, () => Array(w).fill(c));
  const F = (g, x0, y0, x1, y1, c) => { for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) g[y][x] = c; };
  const ROWS = g => g.map(r => r.join(''));

  /* ---------- 人物 ---------- */
  const blackEyes = (g, d, fr, G2, R) => {
    if (d === 0) { R(5, G2.hT + 3, 2, 3, '#030205'); R(9, G2.hT + 3, 2, 3, '#030205'); R(6, G2.hT + 3, 1, 1, '#26262e'); R(10, G2.hT + 3, 1, 1, '#26262e'); }
    else if (d === 1) R(5, G2.hT + 3, 2, 3, '#030205');
  };
  const KID1 = { skin: '#e6d8cc', hair: '#2a221e', hs: 'short', child: true, hat: 'hood', hatC: '#5c5e66', top: '#5c5e66', top2: '#46484e', bottom: '#34405a', shoes: '#d8d8d8' };
  const KID2 = { skin: '#eaddd2', hair: '#3a2a20', hs: 'short', child: true, hat: 'hood', hatC: '#2c3650', top: '#2c3650', top2: '#222a3e', bottom: '#3a3a40', shoes: '#2a2a2a' };

  /* ---------- 通用：坏结局 ---------- */
  const BAD_TEXT = {
    car: '第二天早上，有人在星光影院的停车场里发现了一辆蓝绿色的旅行车。\n车门都锁着，钥匙还插在点火开关上。驾驶座上没有人。\n\n仪表台上放着一张写好的电费支票。签名的后面，有人用歪歪扭扭的铅笔字添了一行：\n「谢谢您载我们。」',
    house: '他们进来的时候，脚步很轻，像是怕吵醒谁。\n他们在沙发上坐下，坐得笔直，一直看着你。一眨不眨。\n\n后来的几个星期，柳溪镇的诊所少了一个夜班护士。邻居们说，枫林路尽头那栋房子的灯每天夜里都亮着，窗帘却从来没有拉开过。\n\n有人在她家门前的台阶上，看见过两个穿连帽衫的孩子。\n他们在等下一扇门。'
  };
  async function badEnd(S, where, line) {
    S.clearTimer(); S.f.pending = null;
    if (line) await S.say('诺拉', line);
    S.amb('none'); await S.wait(700);
    await S.say('大男孩', '谢谢您，女士。', { style: 'whisper' });
    S.sfx('open'); await S.wait(600);
    await S.narr(where === 'car' ? '车门锁「咔哒」一声弹了起来。\n你明明没有去碰它。' : '门轴轻轻地响了一声。\n你明明没有去碰它。');
    S.dark(.975); S.plr(.9);
    await S.wait(500);
    await S.scare('face', { spr: '@kid1b', dur: 1.2 });
    await S.end({ bad: true, title: '请进', text: BAD_TEXT[where] });
  }

  /* ---------- 自定义精灵 ---------- */
  const SPRITES = {
    marquee(g, e, t, R) {   // 影院招牌，宽 6 格，画在墙顶上
      const w = 96;
      R(-2, -24, w + 4, 26, '#120c0c'); R(0, -22, w, 22, '#2a1a14');
      for (let x = 2; x < w; x += 4) { const on = ((x / 4 + Math.floor(t * 3)) % 3) !== 0; R(x, -23, 2, 1, on ? '#ffd27a' : '#5a4020'); R(x, 0, 2, 1, on ? '#ffd27a' : '#5a4020'); }
      R(4, -19, w - 8, 16, '#e8dcb8');
      for (const [x, y, l] of [[8, -17, 10], [20, -17, 6], [30, -17, 14], [50, -17, 8], [62, -17, 12], [78, -17, 8], [10, -10, 18], [32, -10, 6], [46, -10, 22], [72, -10, 14]]) R(x, y, l, 4, '#2a1a1a');
      R(52, -17, 3, 4, '#e8dcb8'); R(20, -24, 56, 2, '#8a1a1a');
    },
    tdoor(g, e, t, R) { box(R, 1, -2, 14, 16, '#2a2a30'); R(3, 0, 10, 12, '#141c26'); R(4, 1, 2, 8, '#2e4258'); R(11, 6, 1, 3, '#c9c9c9'); R(5, 4, 6, 3, '#e8e0c8'); R(6, 5, 4, 1, '#8a3a2a'); },
    dropbox(g, e, t, R) { R(2, 14, 12, 2, 'rgba(0,0,0,.45)'); box(R, 3, -4, 10, 18, '#2a4a7a'); R(4, -3, 8, 3, '#3a5a8a'); R(5, 0, 6, 1, '#0a0a10'); R(5, 4, 6, 5, '#e8e4d0'); R(6, 5, 4, 1, '#2a4a7a'); R(6, 7, 3, 1, '#2a4a7a'); R(7, 14, 2, 1, '#222'); },
    pump(g, e, t, R) { R(2, 14, 12, 2, 'rgba(0,0,0,.4)'); R(3, -10, 10, 25, '#5a5650'); R(4, -9, 8, 23, '#e2dccc'); R(4, -9, 8, 4, '#2a6a3a'); R(5, -3, 6, 4, '#141a12'); R(6, -2, 4, 1, e.lit ? '#9aff6a' : '#4a7a3a'); R(13, -4, 2, 10, '#222'); R(12, 5, 3, 2, '#444'); R(5, 4, 6, 1, '#a8a090'); },
    pillar(g, e, t, R) { R(5, 13, 6, 2, '#8a8a84'); R(6, -34, 4, 48, '#cfcfc8'); R(6, -34, 1, 48, '#efefe8'); R(-4, -38, 24, 5, '#d8d8d0'); R(-4, -34, 24, 1, '#a02a24'); },
    icechest(g, e, t, R) { box(R, 0, 1, 16, 14, '#dfe8ee'); R(2, 3, 12, 4, '#2a5aa8'); R(3, 4, 2, 2, '#fff'); R(6, 4, 2, 2, '#fff'); R(9, 4, 3, 2, '#fff'); R(1, 9, 14, 1, '#a8b8c4'); },
    farmhouse(g, e, t, R) {   // 宽 4 格，向上画两层楼
      const W1 = e.col || '#8a8478', Wd = shade(W1, -.38), RF = '#211a1a';
      R(-3, -44, 70, 4, RF); R(0, -50, 64, 6, RF); R(6, -54, 52, 4, RF); R(14, -57, 36, 3, RF); R(0, -44, 64, 1, '#3a3034');
      R(0, -40, 64, 55, Wd); R(1, -39, 62, 53, W1);
      for (let y = -37; y < 14; y += 4) R(1, y, 62, 1, shade(W1, -.12));
      const win = (x, y, mode) => {
        R(x, y, 10, 11, '#1a1410');
        const c = mode === 'lit' ? '#e8c878' : mode === 'tv' ? (Math.sin(t * 17) > -.2 ? '#6a8ad8' : '#2a4a98') : mode === 'dawn' ? '#9aa8b8' : '#0e1420';
        R(x + 1, y + 1, 8, 9, c); R(x + 5, y + 1, 1, 9, '#1a1410'); R(x + 1, y + 5, 8, 1, '#1a1410');
      };
      const m = e.lit ? 'lit' : e.dawn ? 'dawn' : '';
      win(6, -32, m); win(48, -32, m); win(6, -12, e.tv ? 'tv' : m); win(48, -12, m);
      R(-2, -16, 68, 3, '#3a2e28'); R(0, -13, 2, 25, '#c8c0b0'); R(62, -13, 2, 25, '#c8c0b0');
      R(26, -8, 12, 23, '#1a1410'); R(27, -7, 10, 22, e.dcol || '#4a2e1e'); R(35, 3, 1, 2, '#c9a35a');
      R(-2, 12, 68, 3, '#5a4a3a'); R(-2, 12, 68, 1, '#7a6a5a');
    },
    mailbox(g, e, t, R) { R(7, 2, 2, 13, '#4a3a2a'); R(3, -3, 10, 6, e.col || '#3a4a5a'); R(3, -3, 10, 1, shade(e.col || '#3a4a5a', .2)); if (e.flag) { R(12, -7, 1, 5, '#c02020'); R(12, -7, 2, 2, '#c02020'); } },
    doghouse(g, e, t, R) { R(1, 14, 14, 2, 'rgba(0,0,0,.35)'); box(R, 1, 2, 14, 13, '#7a3a2a'); R(-1, -1, 18, 4, '#3a2420'); R(5, 7, 6, 8, '#0a0806'); R(4, 4, 8, 1, '#e8e0d0'); },
    dog(g, e, t, R) { const w = Math.sin(t * 9) > 0 ? 1 : 0; R(3, 8, 9, 5, '#8a6a4a'); R(10, 5, 4, 5, '#8a6a4a'); R(13, 7, 2, 2, '#6a4a2a'); R(12, 6, 1, 1, '#111'); R(10, 4, 2, 2, '#5a3a24'); R(4, 12, 1, 3, '#6a4a2a'); R(10, 12, 1, 3, '#6a4a2a'); R(1, 7 + w, 2, 2, '#8a6a4a'); },
    cat(g, e, t, R) { const w = Math.sin(t * 5) > 0 ? 1 : 0; R(4, 9, 7, 4, '#2a2a2a'); R(10, 6, 4, 4, '#2a2a2a'); R(10, 5, 1, 1, '#2a2a2a'); R(13, 5, 1, 1, '#2a2a2a'); R(11, 7, 1, 1, '#d8c840'); R(13, 7, 1, 1, '#d8c840'); R(2, 7 + w, 2, 3, '#2a2a2a'); R(5, 12, 1, 2, '#2a2a2a'); R(9, 12, 1, 2, '#2a2a2a'); },
    win2(g, e, t, R) {   // 墙面窗：open 半开 / face 窗外的脸 / lit 天亮 / nailed 钉死
      box(R, 2, 1, 12, 11, '#4a3a2a');
      const gl = e.lit ? '#a8b4c0' : '#0e1726';
      R(3, 2, 10, 9, gl);
      if (e.open) { R(3, 6, 10, 5, '#020306'); R(3, 5, 10, 1, '#4a3a2a'); R(2, 10, 12, 1, '#6a5a4a'); }
      else { R(7, 2, 1, 9, '#4a3a2a'); R(3, 6, 10, 1, '#4a3a2a'); if (!e.lit) R(10, 3, 2, 1, '#c8d0e0'); }
      if (e.face) { R(4, 3, 8, 8, '#5c5e66'); R(5, 5, 6, 6, '#e0d4c8'); R(5, 6, 2, 3, '#000'); R(9, 6, 2, 3, '#000'); R(4, 3, 8, 2, '#46484e'); }
      if (e.nailed) { R(1, 4, 14, 2, '#7a5a38'); R(2, 4, 1, 1, '#bbb'); R(13, 4, 1, 1, '#bbb'); R(1, 8, 14, 2, '#7a5a38'); R(2, 8, 1, 1, '#bbb'); R(13, 8, 1, 1, '#bbb'); }
    },
    bdoor(g, e, t, R) {   // 下方墙上的前门（从屋里看）
      R(0, 0, 16, 16, '#1a120c'); box(R, 1, 0, 14, 15, e.col || '#5a3a22'); R(3, 2, 10, 4, shade(e.col || '#5a3a22', .1)); R(3, 8, 10, 4, shade(e.col || '#5a3a22', .1)); R(12, 7, 2, 2, '#c9a35a');
      if (e.chain) { R(4, 6, 1, 1, '#c8c8c8'); R(5, 7, 1, 1, '#c8c8c8'); R(6, 7, 1, 1, '#c8c8c8'); R(7, 6, 1, 1, '#c8c8c8'); R(8, 6, 2, 1, '#888'); }
    },
    backdoor(g, e, t, R) {   // 带猫洞的后门（墙面）
      const c = '#5a3a22'; box(R, 2, -2, 12, 16, c); R(4, 0, 8, 4, shade(c, .1)); R(11, 4, 2, 2, '#c9a35a');
      R(5, 7, 6, 6, '#120c08'); R(5, 7, 6, 1, '#3a2a1a');
      if (e.blocked) { R(3, 6, 10, 8, '#d8ccb0'); R(4, 8, 8, 2, '#a83a2a'); R(5, 12, 6, 1, '#b8ac90'); }
      else { const sw = Math.sin(t * 2.3) > .6 ? 1 : 0; R(6, 8 + sw, 4, 4 - sw, '#4a2e1e'); }
    },
    hearth(g, e, t, R) {   // 冷壁炉（宽 2 格），右上角是风门拉杆
      box(R, -2, -10, 36, 25, '#5a4a44'); R(-2, -12, 36, 3, '#3a2a24'); R(6, -2, 20, 16, '#120a08');
      R(8, 11, 16, 2, '#3a3634'); R(10, 9, 9, 2, '#2a1a10'); R(14, 8, 7, 2, '#3a2416');
      R(27, -8, 3, 2, '#2a2420'); R(28, e.shut ? -4 : -9, 1, 5, e.shut ? '#8a8a8a' : '#c9a35a');
    },
    tv2(g, e, t, R) {
      box(R, 0, 0, 16, 13, '#2a2a2a');
      if (e.lit) { for (let y = 2; y < 11; y++) for (let x = 2; x < 12; x++) R(x, y, 1, 1, hash(x, y, (t * 30) | 0) < .5 ? '#d8dce8' : '#4a4e5a'); }
      else R(2, 2, 10, 9, '#151a1c');
      R(13, 3, 2, 1, '#888'); R(13, 6, 2, 1, '#888'); R(4, 13, 8, 3, '#333');
    },
    phonet(g, e, t, R) {   // 小桌 + 电话 + 答录机
      box(R, 1, 4, 14, 11, '#5a3e2a'); R(2, 5, 12, 1, '#7a5a3a');
      R(2, -1, 6, 5, '#c8c0b0'); R(2, -2, 6, 1, '#a8a090'); R(3, 1, 4, 2, '#8a8478');
      R(9, 0, 6, 4, '#2a2a2a'); R(10, 1, 3, 1, '#555');
      R(13, 2, 1, 1, e.msg ? (Math.sin(t * 6) > 0 ? '#ff3030' : '#5a1010') : '#3a1a1a');
    },
    hatch(g, e, t, R) {   // 地板上的旧煤槽口
      R(1, 2, 14, 12, '#2a1e14'); R(2, 3, 12, 10, '#5a4030'); R(2, 6, 12, 1, '#3a2a1a'); R(2, 9, 12, 1, '#3a2a1a');
      if (e.open) { R(2, 3, 12, 3, '#050404'); R(2, 6, 12, 1, '#7a5a40'); }
      if (e.locked) { R(6, 7, 5, 2, '#9a9a9a'); R(10, 7, 1, 3, '#7a7a7a'); }
    },
    cocoatable(g, e, t, R) {
      SPR.table2(g, e, t, R);
      R(6, -1, 4, 4, '#e8e0d0'); R(7, -1, 2, 1, '#5a3a20'); R(10, 0, 1, 2, '#e8e0d0');
      R(20, -1, 4, 4, '#c84a3a'); R(21, -1, 2, 1, '#5a3a20'); R(24, 0, 1, 2, '#c84a3a');
      R(26, 1, 5, 4, '#4a2a5a'); R(27, 2, 3, 1, '#c9a35a');
    },
    catbowl(g, e, t, R) { R(4, 10, 8, 3, '#c84a4a'); R(5, 10, 6, 1, '#3a2a2a'); R(4, 12, 8, 1, '#8a2a2a'); },
    dogbowl(g, e, t, R) { R(4, 10, 8, 3, '#4a6a9a'); R(5, 10, 6, 1, '#6a5030'); },
    barrel2(g, e, t, R) { box(R, 3, 1, 10, 14, '#3a4a3a'); R(3, 4, 10, 1, '#2a3a2a'); R(4, 1, 8, 2, '#e8e4d0'); R(5, 0, 3, 1, '#c84a3a'); }
  };
  const TILES = {
    pline: { solid: false, paint(R, X, Y) { TILE.asphalt.paint(R, X, Y); R(7, 0, 2, 16, '#a8a8a0'); } },
    corn: { solid: true, paint(R, X, Y) { speck(R, '#2a2418', ['#352d1f', '#221c12'], X, Y, 12, 21); for (let i = 0; i < 4; i++) { const x = (i * 4 + ((hash(X, Y, i) * 3) | 0)) % 16; R(x, 3 + (i % 2) * 2, 1, 9, '#5e5232'); R(x, 2 + (i % 2) * 2, 1, 1, '#7e6e46'); if (hash(X, Y, i + 9) < .4) R(x + 1, 6, 2, 1, '#4e4428'); } } }
  };

  /* ---------- 笔记 ---------- */
  const NOTES = {
    printout: { title: '打印纸 ·「转发：停车场里的两个孩子」', text: '（几张连在一起的针式打印纸，边上还带着撕孔。页眉是一串网址，护士站的打印机把它印歪了。）\n\n「……那天晚上十点来钟，我把车停在镇上一家电影院的停车场里，开着顶灯，给网费写一张支票。\n有人敲我的车窗。两个男孩，大概十岁到十四岁之间，穿着连帽衫。\n大的那个说，他们想看电影，可是钱落在妈妈家了，问我能不能载他们回去拿。\n他说话的样子……太成熟了，太有礼貌了。我心里涌上来一股说不清的恐惧，强烈得连我自己都觉得可笑——他们只是两个孩子。\n「快点嘛，先生。我们没带枪，我们只是两个小孩。」他说，「你不说可以，我们就上不了车。」\n然后我看清了他们的眼睛。\n没有眼白，没有瞳孔。只有两团漆黑。\n我不记得自己是怎么把车开走的。」\n\n（下面是网友的回复，字小得要眯着眼看：）\n> 我在俄勒冈也碰见过。是在我家门口，说要借电话。\n> 编的吧。不过写得挺吓人。\n> 我姨妈说她让他们进过门，后来病了大半年。\n> 他们为什么非得等人同意？吸血鬼不也是这样吗？\n\n（最底下，护士站的凯西用圆珠笔补了一行：「诺拉，下夜班别一个人去停车场哦～」）' },
    letters: { title: '《柳溪信使报》· 读者来信', text: '编辑先生：\n上礼拜六夜里，两个孩子来敲我家的门，说要借电话叫他们的妈妈。我丈夫正要去开门，我一把拉住了他。我也说不清为什么。他们在门廊上站了一个多钟头，一句话也不说，最后才走。\n——沃斯堡路的一位主妇\n\n致编辑：\n我在七十号公路边的汽车旅馆值夜班。凌晨三点，有人敲前台的玻璃——两个孩子，问能不能进来暖和一下。我问他们爸妈呢，大的那个说：「您只要说可以。」\n我按了报警铃。等警长赶到，门口一个人也没有。\n——匿名\n\n编辑先生：\n你们报纸登这种东西，是在吓唬小孩。这些都是网上传来传去的故事，没有一张照片、一个真名。我活了六十年，只见过一种黑眼睛的孩子——打架打输了的那种。\n——一位老读者\n\n（编辑按：本栏只刊登读者来信，不代表本报观点。另据诊所大夫说，近来几位读者反映的头痛、流鼻血、怎么也暖和不过来，更可能是流感季提前到了。请大家多穿衣服。）' },
    diary: { title: '埃德娜的日记（夹在食谱里）', text: '11月14日\n夜里九点多，两个孩子来敲门。大的说他们妈妈的车坏在路上了，想借电话。那么冷的天，就穿一件连帽衫。\n我说了：「进来吧，孩子们。」\n\n11月15日\n醒过来是在客厅地板上，天已经亮了。可可还在桌上，一口没动。沙发上有两个坐出来的坑。\n屋里的钟全停了，都停在九点十三分。\n头疼。\n\n11月16日\n冷。暖气开到最大还是冷。巴斯特不肯进屋，趴在门廊底下哭了一宿。\n枕套上又有印子了。\n给诺拉打电话，她在上夜班。\n\n11月17日\n我想起来了。我妈妈说过：「开着的门，就是一句请进。」\n在老家的时候，太阳一落山，她就把每一扇门、每一扇窗都关上，连烟囱的风门都要拉下来。我一直以为她是怕冷。\n\n（最后一行，字歪歪扭扭，像是在很黑的地方写的：）\n它们说，被请进来过一次的屋子，以后就再也不用问了。' },
    blueprint: { title: '房屋图纸 · 枫林路　1931', text: '（一张发脆的蓝图，折痕处已经磨白了。右下角签着木匠名字的缩写「H.K.」，旁边有一行铅笔字：同样的房子盖了两栋，东边一栋，西边一栋。）\n\n【开口一览】\n客厅：南面前门一；北窗一；壁炉烟道一（设风门）。\n卧室：北窗一。\n厨房：北窗一；北面后门一。\n　　（埃德娜的铅笔字：1954年在后门下面加开了猫洞。）\n储藏间（厨房东南角）：地面煤槽口一，通地窖，已停用。\n\n共计：八处。\n\n（图纸背面，埃德娜用颤抖的字写着：\n门窗要关，烟道要关。\n猫洞、煤槽这种没人记得的口子，也是口子。\n一处都不能落下。）' }
  };

  Object.assign(SPRITES, {
    booth(g, e, t, R) { box(R, 0, -10, 16, 25, '#5a2222'); R(2, -8, 12, 8, '#141018'); R(3, -7, 3, 5, '#2a2430'); R(2, 1, 12, 2, '#c9a35a'); R(1, -12, 14, 2, '#3a1414'); R(4, 5, 8, 3, '#e8dcb8'); R(5, 6, 6, 1, '#5a2222'); }
  });

  /* ================= 一、星光影院停车场 ================= */
  function lotRows() {
    const g = G(26, 16, ':');
    F(g, 0, 0, 25, 1, '#'); F(g, 0, 2, 25, 2, '_'); F(g, 0, 11, 25, 11, '_');
    for (const x of [1, 5, 9, 13, 17, 21]) for (const y of [4, 5, 8, 9]) g[y][x] = 'v';
    F(g, 0, 13, 25, 13, '='); F(g, 0, 15, 25, 15, 'P');
    return ROWS(g);
  }
  async function lotCar(S) {
    const f = S.f;
    if (!f.paid) {
      if (S.once('printout')) {
        await S.narr('你拉开车门，探身进去。副驾驶座上扔着一沓打印纸——下班前，护士站的凯西硬塞给你的。');
        await S.note('printout');
        await S.think('……网上的鬼故事。凯西就爱看这些。');
        return S.narr('支票已经写好了，就夹在你手里。先把它投进缴费箱吧——影院门口右手边，那个蓝色的铁箱子。');
      }
      return S.narr('写好的支票还在你手里。先把它投进缴费箱——影院门口右手边，那个蓝色的铁箱子。');
    }
    return lotTalk(S);
  }
  async function lotDrop(S) {
    const f = S.f;
    if (f.paid) return S.narr('「柳溪电力公司　夜间缴费箱」\n你的信封已经躺在里面了。明天早上会有人来收。');
    f.paid = true; S.sfx('paper');
    await S.narr('「柳溪电力公司　夜间缴费箱」\n你把信封塞进投递口。「哗啦」一声，落到了箱底。\n……总算赶在过期之前了。');
    await S.wait(500);
    S.sfx('whisper');
    S.show('lk1'); S.show('lk2'); S.focus(21, 10);
    await S.narr('你转身往回走，余光扫过停车场的另一头——');
    await S.narr('最远的那盏路灯底下，站着两个孩子。\n一个高一点，一个矮一点。都穿着连帽衫，帽子拉起来，并排站着，一动不动。');
    await S.think('……刚才那里，明明没有人。');
    S.focus(null);
    await S.think('都快半夜了。谁家的孩子，这个点还在外面晃。');
    S.goal('回到车上');
    S.cp('lot');
  }
  async function lotTalk(S) {
    const f = S.f;
    S.sfx('close'); S.hidePlayer(true); S.pos(12, 8, 1); S.focus(11, 8);
    S.amb('none');
    await S.narr('你坐进驾驶座，把车门锁按了下去。\n钠灯的黄光从挡风玻璃上淌下来，把方向盘照得像一块旧铜。');
    await S.narr('你把钥匙插进锁孔。还没来得及拧——');
    S.place('lk1', 9, 8, 2); S.place('lk2', 9, 9, 3);
    S.sfx('knock'); await S.wait(350); S.sfx('knock'); S.shake(200, 1);
    await S.narr('咚、咚。\n有人在敲驾驶座的车窗。');
    await S.narr('是那两个孩子。\n大的十三四岁，小的也就十岁出头。连帽衫，牛仔裤，白球鞋——普普通通，跟镇上任何一个孩子没有两样。\n帽檐压得很低，看不清眉眼。');
    await S.narr('你把车窗摇下来一条缝。一股冷气挤了进来。');
    await S.say('大男孩', ['晚上好，女士。很抱歉打扰您。', '我们想看电影。可是我们把钱落在妈妈家里了。']);
    await S.say('大男孩', '您能载我们回去拿一下吗？很近的。拿了钱，我们就回来。');
    await S.think('他说话太……规矩了。不像这个年纪的孩子。倒像是在念一份背得滚瓜烂熟的稿子。');
    S.sfx('heart');
    await S.narr('你的心忽然跳得厉害。没有任何理由——他们只是两个孩子。\n可你后颈上的汗毛，一根一根全竖了起来。');
    let r = await S.ask('「女士？」', ['……好吧，上来吧。', '电影早就散场了。', '你们的妈妈住在哪儿？'], '诺拉');
    if (r === 0) return badEnd(S, 'car');
    if (r === 1) { await S.say('大男孩', '那我们看下一场。'); await S.narr('招牌上写得清清楚楚：今晚十点，最后一场。\n他连看都没往那边看一眼。'); }
    else { await S.say('大男孩', '不远。就在前面。'); await S.say('诺拉', '前面是哪儿？'); await S.say('大男孩', '前面。'); }
    await S.say('大男孩', ['女士，我们只是两个小孩。', '我们没带枪，也没带刀。我们什么都没有。']);
    await S.say('大男孩', '您只要说一句「可以」。您不说，我们就上不了车。');
    await S.narr('他说这句话的时候，眼睛没有看你。\n他一直盯着车门上那个小小的锁钮。');
    r = await S.ask('他在等你开口。', ['车门没锁，你们自己开吧。', '我可以帮你们给妈妈打个电话。', '（把车窗摇上去）'], '诺拉');
    if (r === 0) return badEnd(S, 'car');
    if (r === 1) {
      await S.say('大男孩', '我们不用电话。');
      await S.say('大男孩', '我们要上车。', { style: 'whisper' });
      await S.narr('他的声音一下子变硬了。像是一个大人，借用了孩子的嗓子。');
      const r2 = await S.ask('「您得让我们上车。快说呀。」', ['好，好，你们上来——', '不行。', '（一言不发，攥紧方向盘）'], '诺拉');
      if (r2 === 0) return badEnd(S, 'car');
    } else {
      S.sfx('step');
      await S.narr('你去摇车窗的把手。玻璃往上升了一半——\n一只手按在了玻璃的上沿。很小，很白，指甲缝里干干净净。');
      await S.say('小男孩', '……求求你。', { style: 'whisper' });
    }
    await S.narr('小的那个往前挪了半步，抬起头。\n帽檐底下，钠灯的光照进了他的眼睛——');
    S.ent('lk1').spr = '@kid1b'; S.ent('lk2').spr = '@kid2b';
    await S.scare('face', { spr: '@kid2b', dur: 1.1 });
    S.sfx('sting');
    await S.narr('——没有眼白。\n两只眼睛从眼角到眼角，全是黑的。黑得像两口灌满了墨水的井，钠灯照进去，一点光都没有反出来。');
    await S.narr('大的那个也抬起了头。一样的黑。');
    await S.think('跑。');
    S.sfx('car'); S.shake(500, 2);
    await S.narr('你不记得自己是怎么拧的钥匙、怎么挂的挡。轮胎在柏油上尖叫了一声，旅行车蹿了出去。');
    await S.say('大男孩', '您没法一直开下去的，女士。', { style: 'whisper' });
    await S.narr('后视镜里，那两个孩子站在钠灯底下，看着你的车开远。\n他们没有追。\n他们好像一点也不着急。');
    f.met1 = true;
    await S.fade(1, 700);
    S.hidePlayer(false); S.focus(null);
    await S.card('七十号公路', '23:41', '你开出去五六里地，手才不抖了。\n\n油表的红灯一直在闪。\n前面是公路边那家通宵加油站——\n离家还有十几里黑路，不加油，开不回去。');
    await S.go('gas', 14, 6, 3);
  }

  const MAP_LOT = {
    amb: 'night', dark: .82, plr: 2.6, wall: 'brick', floor: 'asphalt', darkC: '#0a0704',
    legend: { v: 'pline' }, rows: lotRows(),
    ents: [
      { x: 9, y: 1, w: 6, spr: 'marquee', decal: true, light: { r: 4, col: 'rgba(255,200,110,.12)', dy: -4, dx: 48 } },
      { x: 7, y: 1, spr: 'poster', col: '#8a7a5a', on: S => S.narr('「下周上映」。海报上是一栋亮着灯的乡下房子，门廊上站着两个小小的人影。\n片名被人用马克笔涂掉了一半。') },
      { x: 11, y: 1, spr: 'tdoor', on: S => S.narr('影院的玻璃门锁着。门里的爆米花机还亮着一盏小灯。\n玻璃上贴着一张手写的纸：「今日放映已结束　晚安」。') },
      { x: 12, y: 1, spr: 'tdoor', on: S => S.narr('你凑近玻璃往里看。大厅里空空荡荡，地毯上散着几颗爆米花。\n玻璃上映出你自己的脸，还有你身后黑乎乎的停车场。') },
      { x: 16, y: 1, spr: 'poster', col: '#5a6a8a', on: S => S.narr('一张褪色的老电影海报：一个女人举着蜡烛站在楼梯上。\n边角被人撕走了一块。') },
      { x: 14, y: 2, spr: 'booth', on: S => S.narr('售票亭的小窗关着。招牌上的字掉了好几个，剩下的拼起来是：\n「星光影　　今晚 10:00　最后一场」') },
      { x: 8, y: 2, spr: 'barrel2', on: S => S.narr('垃圾桶里塞满了空爆米花桶。\n最上面扔着两张电影票，十点那一场——连撕口都没撕。') },
      { id: 'drop', x: 19, y: 2, spr: 'dropbox', on: lotDrop },
      { x: 23, y: 2, spr: 'payphone', on: S => S.narr('公用电话的听筒垂在半空中，轻轻地晃。\n你把它挂了回去。挂上的那一刻，它好像比正常的听筒要凉一些。') },
      { x: 2, y: 4, w: 2, spr: 'car', col: '#5a4a3a', on: S => S.narr('一辆旧皮卡，车斗里积着雨水和落叶。\n车里没人。仪表台上的灰，厚得能写字。') },
      { x: 14, y: 5, w: 2, spr: 'car', col: '#4a1e22', on: S => S.narr('一辆暗红色的轿车。后座上放着一个儿童安全座椅，空的。\n座椅上的安全带，是扣好的。') },
      { x: 18, y: 9, w: 2, spr: 'car', col: '#6a6a70', on: S => S.narr('银色轿车的车窗上贴着「出售」，下面一串电话号码。\n有人在车窗的灰上，用手指写了两个字：「让我」。后面的字被擦掉了。') },
      { id: 'mycar', x: 10, y: 8, w: 2, spr: 'car', col: '#2e7a7a', on: lotCar },
      { x: 4, y: 6, spr: 'streetlamp', light: { r: 3.6, col: 'rgba(255,160,50,.2)', dy: 4 }, on: S => S.narr('钠灯嗡嗡地响着。灯光是那种很浓的黄，照得什么都像是旧照片里的颜色。') },
      { x: 12, y: 6, spr: 'streetlamp', light: { r: 4.2, col: 'rgba(255,160,50,.22)', dy: 18 }, on: S => S.narr('你的车就停在这盏灯底下。你特意挑的——一个人走夜路，总得停在亮一点的地方。') },
      { x: 21, y: 10, spr: 'streetlamp', light: { r: 3.4, col: 'rgba(255,160,50,.18)', dy: 2 }, on: S => S.narr('最远的这盏路灯底下，地上有两双小小的鞋印。\n只有来的方向，没有走的方向。') },
      { x: 24, y: 11, spr: 'sign', col: '#2a5a3a', on: S => S.narr('路牌：「七十号公路　枫林路 →」。\n回家还得开上二十分钟。') },
      { id: 'lk1', x: 20, y: 10, spr: '@kid1', dir: 0, hidden: true, on: S => S.narr('他们就站在那儿。看着你。') },
      { id: 'lk2', x: 22, y: 10, spr: '@kid2', dir: 0, hidden: true, on: S => S.narr('他们就站在那儿。看着你。') }
    ],
    async enter(S, first) {
      if (!first) return;
      await S.narr('十一点二十。影院最后一场早就散了，偌大的停车场只剩下零零星星几辆车。');
      await S.think('电费单明天就过期了。投进缴费箱，回家，洗澡，睡觉。');
      S.goal('把电费支票投进影院旁的缴费箱');
    }
  };

  /* ================= 二、七十号公路加油站 ================= */
  function gasRows() {
    const g = G(26, 15, 'x');
    F(g, 10, 0, 25, 0, 'P'); F(g, 10, 1, 25, 1, '"');
    F(g, 0, 0, 9, 6, '#'); F(g, 1, 2, 8, 5, 'n'); g[6][4] = 'n';
    F(g, 0, 10, 25, 10, '_'); F(g, 0, 11, 25, 13, ':'); F(g, 0, 12, 25, 12, '='); F(g, 0, 14, 25, 14, 'P');
    return ROWS(g);
  }
  async function clerkTalk(S) {
    const f = S.f;
    S.face('clerk', 'pl');
    if (f.met2) return S.say('德韦恩', '回家去吧，女士。路上别停车。谁招手都别停。');
    if (f.paid2) return S.say('德韦恩', ['二号机，加满。', '……外面要是有人跟你搭话，你就往店里走。我盯着呢。']);
    await S.say('德韦恩', '晚上好。……你脸色可不太好。加油？');
    await S.say('诺拉', '二号机，加满。……能问你个事吗？刚才有没有两个孩子来过？穿连帽衫的。');
    S.bubble('clerk', '…', 1500);
    await S.narr('德韦恩数钱的手停住了。');
    await S.say('德韦恩', ['……你也碰上了？', '他们在我这门口站了快一个钟头。就站在加油机那边，也不进来，也不走。', '我寻思着天这么冷，就推开门喊了一嗓子，让他们进来暖和暖和。']);
    await S.say('德韦恩', ['话都到嘴边了——「进来吧」。', '大的那个先开口了。他说：「先生，您得说出来。说『你们可以进来』。」', '他说得那么客气。客气得……我说不上来。']);
    const r = await S.ask('德韦恩看着窗外的黑。', ['那你说了吗？', '他们的眼睛……你看见了吗？'], '诺拉');
    if (r === 0) await S.say('德韦恩', '没有。不知道为啥，我就是把嘴闭上了。把门也关上了。我这辈子没那么怕过两个小孩。');
    else await S.say('德韦恩', '……我没敢看。我开了二十年夜班，什么醉鬼疯子都见过。可那俩孩子，我连看都不敢看一眼。');
    await S.say('德韦恩', ['我关上门以后，他们又站了一会儿，然后就沿着公路往东走了。', '……往你住的那个方向。']);
    await S.say('德韦恩', '报架上那份报纸，你翻翻读者来信那一版。这个礼拜，不止我一个人碰上。');
    f.paid2 = true; S.sfx('ding');
    S.goal('去二号加油机加油');
    S.cp('gas');
  }
  async function gasPump(S) {
    const f = S.f;
    if (f.met2) return S.narr('油箱满了。加油机的数字停在 14.20。');
    if (!f.paid2) return S.narr('加油机上贴着一张纸：「夜间请先进店付款」。\n店里的灯是亮的，收银台后面坐着一个戴棒球帽的大个子。');
    S.ent('pump2').lit = true;
    S.sfx('switch');
    await S.narr('你摘下油枪，插进油箱。\n加油机「咔嗒咔嗒」地跳着数字。汽油味混着夜里的冷气，直往鼻子里钻。');
    S.amb('none');
    await S.wait(800);
    S.show('gk1'); S.show('gk2'); S.ent('gk1').spr = '@kid1'; S.ent('gk2').spr = '@kid2';
    await S.narr('你低头盯着跳动的数字。再抬起头的时候——');
    await Promise.all([S.walk('gk1', [13, 5], 3), S.walk('gk2', [13, 6], 3)]);
    S.face('gk1', 2); S.face('gk2', 2); S.face('pl', 1);
    S.sfx('sting');
    await S.narr('他们就站在你旁边，离你不到一臂远。\n你没有听见脚步声。');
    await S.say('大男孩', '又见面了，女士。');
    await S.say('大男孩', ['我们走累了。您能载我们回家吗？', '我们住在枫林路。跟您是一条路。']);
    await S.think('……枫林路。我从来没跟任何人说过，我住在哪儿。');
    let r = await S.ask('「求您了。」', ['你们怎么知道我住哪儿？', '……上车吧，别冻着了。', '我不认识你们。离我的车远点。'], '诺拉');
    if (r === 1) return badEnd(S, 'car');
    if (r === 0) await S.say('大男孩', ['我们知道很多事。', '我们还知道，您一个人住。']);
    else await S.say('大男孩', '可是我们认识您呀。', { style: 'whisper' });
    await S.say('小男孩', ['姐姐，好冷。', '你只要说一声。说「可以进来」。说了，我们就不冷了。']);
    await S.narr('他伸出手，摸了摸你的车门把手。\n那么冷的夜里，他的手指搭在金属上，一点雾气都没有留下。');
    r = await S.ask('两个孩子都在看你。', ['（摇头，往后退一步）', '好吧——', '你们的爸爸妈妈呢？'], '诺拉');
    if (r === 1) return badEnd(S, 'car');
    if (r === 2) await S.say('大男孩', '在等我们。', { style: 'whisper' });
    S.sfx('open');
    S.show('clerk2'); S.place('clerk2', 4, 7, 3);
    await S.say('德韦恩', '嘿！那边那俩！离那位女士远点！', { style: 'big' });
    S.face('gk1', 1); S.face('gk2', 1);
    await S.narr('两个孩子同时转过头，看向店门口。\n动作一模一样，像是被同一根线牵着。');
    S.face('gk1', 2);
    await S.say('大男孩', '我们家里见，女士。', { style: 'whisper' });
    await Promise.all([S.walk('gk1', [11, 8], 2.4), S.walk('gk2', [10, 8], 2.4)]);
    await Promise.all([S.alpha('gk1', 0, 700), S.alpha('gk2', 0, 700)]);
    await S.narr('他们走进了冰柜后面的阴影里。\n你等着他们从另一头走出来。\n他们没有。');
    S.face('clerk2', 'pl');
    await S.say('德韦恩', ['你没事吧？……别在这儿站着了。', '赶紧回家。进门就把门锁上。']);
    S.hide('clerk2');
    f.met2 = true; S.ent('pump2').lit = false; S.amb('wind');
    S.goal('开车回家');
    S.cp('gas2');
  }
  async function gasCar(S) {
    if (!S.f.met2) return S.narr(S.f.paid2 ? '油还没加呢。二号加油机就在车旁边。' : '油表的红灯还在闪。先进店付钱吧。');
    S.sfx('close'); S.sfx('car');
    await S.narr('你钻进车里，锁上所有的车门。\n后视镜里，加油站的灯光越来越小。路两边的黑，一点一点合拢过来。');
    await S.fade(1, 700);
    await S.card('枫林路', '00:24', '枫林路的尽头，只有两户人家。\n西边一栋是你的。\n东边一栋，住着七十八岁的埃德娜·格雷——\n你搬来这三年，她给你送过的苹果派，比你自己做的饭还多。');
    S.f.phase = 'home';
    await S.go('farm', 7, 8, 1);
  }

  const MAP_GAS = {
    amb: 'wind', dark: .74, plr: 2.8, wall: 'plain', floor: 'concrete',
    rows: gasRows(),
    ents: [
      // 店里
      { x: 2, y: 1, spr: 'window', on: S => S.narr('店后墙的小窗外面是一片黑。玻璃上贴着一张「招夜班店员」，已经晒褪色了。') },
      { x: 4, y: 1, spr: 'wallclock', on: S => S.narr('挂钟：十一点四十五分。秒针走得很响。') },
      { x: 6, y: 1, spr: 'poster', col: '#d8d0b8', on: S => S.narr('布告栏上钉满了纸条：卖二手拖拉机的，教吉他的，寻狗的。\n角落里有一张手写的：「有谁见过两个穿连帽衫的男孩？他们问我能不能进屋。我没让。——R.」\n下面有人用别的笔写了一行：「我也见过。」') },
      { x: 8, y: 2, spr: 'fridge', light: { r: 1.6, col: 'rgba(170,210,255,.1)' }, on: S => S.narr('冷柜里摆着一排可乐和啤酒。冷柜的玻璃上，有两个小小的手印——是从外面按上去的？\n……不对，冷柜在店里面。') },
      { x: 1, y: 3, spr: 'counter', on: S => S.narr('柜台上摆着一罐牛肉干，和一个写着「捐给县医院」的零钱罐。') },
      { id: 'ctr', x: 2, y: 3, spr: 'counter', on: clerkTalk },
      { x: 3, y: 3, spr: 'counter', on: S => S.narr('收银机旁边贴着一张纸条：「夜里十二点后，只开小窗收款」。\n德韦恩今晚没开小窗。他说，他宁愿你进来。') },
      { id: 'clerk', x: 2, y: 2, spr: '@clerk', dir: 0, on: clerkTalk },
      { x: 5, y: 3, spr: 'shelf', on: S => S.narr('货架上是机油、地图、手电筒电池。\n你顺手看了一眼电池的价格，又放回去了。家里应该还有。') },
      { x: 7, y: 3, spr: 'shelf', on: S => S.narr('薯片、巧克力棒、一盒受了潮的感恩节蜡烛。') },
      { id: 'paper', x: 8, y: 5, spr: 'newspaper', async on(S) { if (S.once('letters')) await S.narr('报架上插着这个礼拜的《柳溪信使报》。你翻到读者来信那一版。'); await S.note('letters'); } },
      { x: 4, y: 2, spr: 'invisible', light: { r: 4.4, col: 'rgba(255,240,200,.1)' } },
      // 店外
      { x: 2, y: 6, spr: 'window', lit: true, light: { r: 2.4, col: 'rgba(255,230,160,.14)', dy: 22 }, on: S => S.narr('店里的灯光是暖的。隔着玻璃，能看见德韦恩的棒球帽。') },
      { x: 7, y: 6, spr: 'window', lit: true, light: { r: 2.4, col: 'rgba(255,230,160,.14)', dy: 22 }, on: S => S.narr('窗玻璃上用红漆写着：「24小时营业　咖啡五毛」。') },
      { x: 11, y: 2, spr: 'payphone', on: S => S.narr('公用电话。你想给埃德娜打个电话——她一个人住，这个点该睡了。\n……还是算了，别吵醒她。') },
      { x: 12, y: 3, spr: 'pillar' }, { x: 22, y: 3, spr: 'pillar' },
      { id: 'pump2', x: 14, y: 4, spr: 'pump', on: gasPump },
      { x: 20, y: 4, spr: 'pump', on: S => S.narr('一号加油机。油枪上挂着一块牌子：「坏了」。') },
      { id: 'gcar', x: 15, y: 5, w: 2, spr: 'car', col: '#2e7a7a', on: gasCar },
      { x: 17, y: 4, spr: 'invisible', light: { r: 6, col: 'rgba(220,240,255,.1)' } },
      { x: 11, y: 7, spr: 'icechest', on: S => S.narr('冰柜上印着「ICE」。柜门上结着一层霜。\n冰柜后面那一小块阴影，比别处都要黑。') },
      { x: 19, y: 7, spr: 'barrel2', on: S => S.narr('垃圾桶边上扔着两个没开封的热狗。还是热的。') },
      { x: 24, y: 9, spr: 'sign', col: '#2a5a3a', on: S => S.narr('「枫林路　12 →」\n过了这块牌子，就再也没有路灯了。') },
      { id: 'clerk2', x: 4, y: 7, spr: '@clerk', dir: 3, hidden: true },
      { id: 'gk1', x: 22, y: 8, spr: '@kid1', dir: 1, hidden: true, solid: false },
      { id: 'gk2', x: 23, y: 8, spr: '@kid2', dir: 1, hidden: true, solid: false }
    ],
    async enter(S, first) {
      if (!first) return;
      S.amb('wind');
      await S.narr('加油站的雨棚灯白得刺眼，像一座漂在黑暗里的小岛。\n你把车停在二号加油机旁边，熄了火。');
      S.goal('进店付油钱');
      S.cp('gas');
    }
  };

  /* ================= 三、枫林路尽头 ================= */
  function farmRows() {
    const g = G(32, 18, '"');
    F(g, 0, 0, 31, 0, 'P'); F(g, 0, 17, 31, 17, 'P');
    for (let y = 0; y < 18; y++) { g[y][0] = 'P'; g[y][31] = 'P'; }
    F(g, 3, 1, 6, 4, 'H'); F(g, 22, 1, 25, 4, 'H');
    F(g, 10, 1, 18, 8, 'Y');
    for (let y = 6; y <= 12; y++) { g[y][5] = 'd'; g[y][24] = 'd'; }
    F(g, 5, 9, 24, 9, 'd');
    F(g, 1, 11, 30, 11, 'f'); g[11][5] = 'd'; g[11][24] = 'd';
    F(g, 1, 13, 30, 15, ':'); F(g, 1, 14, 30, 14, '=');
    for (const [x, y] of [[1, 1], [2, 3], [8, 2], [20, 2], [28, 1], [29, 4], [1, 7], [29, 9], [20, 6]]) g[y][x] = 'T';
    return ROWS(g);
  }
  async function myDoor(S) {
    const f = S.f;
    if (f.phase === 'seal' || f.phase === 'home') { S.sfx('open'); return S.go('home', 12, 6, 3); }
    return S.narr('你家的门。门廊的灯亮着。');
  }
  async function ednaDoor(S) {
    const f = S.f;
    if (f.phase === 'seal' || f.phase === 'siege') return S.narr('你不会再进那扇门了。\n门上的小窗里，有两个小小的影子，一动不动地站着。');
    if (!f.msgHeard) return S.narr('埃德娜家的门廊灯坏了。客厅窗户里一闪一闪的，是电视的蓝光。\n她一向九点就睡……这么晚了，还是先回家吧。');
    S.sfx('knock'); await S.wait(400); S.sfx('knock');
    await S.narr('你敲了两下门。没有人应。\n你拧了拧门把手——门没锁。');
    S.sfx('open');
    await S.go('edna', 3, 6, 3);
  }
  async function dawnScene(S) {
    S.amb('wind');
    S.place('fk1', 8, 13, 3); S.place('fk2', 9, 13, 3);
    S.ent('fk1').spr = '@kid1b'; S.ent('fk2').spr = '@kid2b';
    await S.narr('晨雾贴着地面，一层一层地铺开。\n天边有一道灰白的缝，正一点一点地裂开。');
    S.focus(8, 12);
    await S.wait(500);
    await S.narr('路边，你家信箱的旁边，站着那两个孩子。');
    await S.narr('他们没有走过来，也没有开口。\n只是并排站着，像来的时候那样。');
    S.face('fk1', 3); S.face('fk2', 3);
    await S.wait(600);
    await S.narr('大的那个抬起头，看了你最后一眼。\n晨光里，那两只眼睛还是黑的——黑得像是把一整夜都收了进去，留在了那里。');
    await S.say('大男孩', '晚安，女士。', { style: 'whisper' });
    S.sfx('car'); S.shake(400, 1);
    await S.narr('一辆运饲料的卡车轰隆隆地从路上开过去，卷起一阵尘土。');
    await Promise.all([S.alpha('fk1', 0, 900), S.alpha('fk2', 0, 900)]);
    await S.narr('尘土落下来的时候，路边空空的。\n只有信箱上的小红旗，不知道被谁扳了起来。');
    S.ent('mybox').s.flag = true;
    S.focus(24, 7);
    S.sfx('open');
    S.show('fedna'); S.show('fdog');
    await S.narr('东边，埃德娜家的门开了。\n她裹着那条百衲被，扶着门框站在门廊上，朝你这边挥了挥手。');
    await S.narr('巴斯特从门廊底下钻了出来，摇着尾巴，绕着她的腿打转。');
    await S.say('埃德娜（远处）', '诺拉——！钟又走起来了！', { style: 'whisper' });
    S.focus(null);
    S.show('fcat'); await S.walk('fcat', [6, 7], 2.2);
    await S.narr('脚边有什么毛茸茸的东西蹭了一下。');
    await S.say('诺拉', '……胡椒？');
    await S.narr('瘦了一圈，浑身是草籽，一只耳朵上沾着泥。\n它仰着头，冲你「喵」了一声，好像在怪你：门怎么堵上了。');
    await S.wait(400);
    await S.fade(1, 1500);
    await S.card('后来', '', '你再也没见过那两个孩子。\n埃德娜的烧，在那个星期退了。她屋里的钟，一个接一个地又走了起来。\n\n只是从那以后，枫林路尽头的两户人家，\n天一黑就关好每一扇门、每一扇窗，连烟囱的风门都拉下来。\n有人敲门的时候，你会先问一句：\n「是谁？」\n\n——然后，等它自己说出来。');
    await S.end({ title: '第十夜　完', text: '十个夜晚，十个故事，到这里都讲完了。\n\n它们有的从车站来，有的从山里来，有的从镜子、电话和收音机里来。\n可是你也许已经发现了——\n它们之中的大多数，都要等着人先开口：\n应一声，回一下头，或者说一句「请进」。\n\n关灯之前，再检查一遍门锁吧。\n今晚如果有人敲门，很有礼貌地问你，能不能进来——\n\n你知道该怎么回答。' });
  }

  const MAP_FARM = {
    amb: 'wind', dark: .86, plr: 2.6, floor: 'grass', fog: .12,
    legend: { H: { t: 'grass', solid: true }, Y: 'corn', v: 'pline' }, rows: farmRows(),
    tileOpts: { grassC: '#1e2a22', treeC: '#121e16' },
    ents: [
      { id: 'mydoor', x: 5, y: 5, spr: 'invisible', solid: true, on: myDoor },
      { x: 3, y: 5, spr: 'invisible', on: S => S.narr('你家的窗户黑着。窗台上那盆天竺葵，是埃德娜去年春天送的。') },
      { x: 3, y: 5, w: 4, spr: 'farmhouse', col: '#7e8a8c', light: { r: 2.6, col: 'rgba(255,200,120,.18)', dx: 40, dy: 12 } },
      { id: 'edoor', x: 24, y: 5, spr: 'invisible', solid: true, on: ednaDoor },
      { x: 22, y: 5, spr: 'invisible', on: S => S.narr('埃德娜家客厅的窗户。电视的蓝光在窗帘后面一跳一跳的。\n可是没有声音。一点声音都没有。') },
      { id: 'ehouse', x: 22, y: 5, w: 4, spr: 'farmhouse', col: '#8e8070', dcol: '#3a2a2a', s: { tv: true } },
      { id: 'etv', x: 22, y: 4, spr: 'invisible', light: { r: 2.2, col: 'rgba(90,130,255,.2)', flick: true, dx: 14 } },
      { id: 'fcar', x: 7, y: 7, w: 2, spr: 'car', col: '#2e7a7a', on: S => S.narr(S.f.phase === 'dawn' ? '旅行车的挡风玻璃上结了一层霜。霜上有两个小小的手印。\n手印朝外。' : '你的旅行车。引擎盖还是温的，嘀嗒嘀嗒地响着。') },
      { id: 'mybox', x: 6, y: 12, spr: 'mailbox', col: '#2e5a6a', on: S => S.narr('你的信箱。「班克斯」。\n里面只有一张超市的打折传单。') },
      { x: 25, y: 12, spr: 'mailbox', col: '#6a3a3a', on: S => S.narr('埃德娜的信箱。「格雷」。\n里面塞满了三天没取的信。') },
      { x: 27, y: 6, spr: 'doghouse', on: S => S.narr(S.f.phase === 'dawn' ? '狗窝空着。巴斯特回到它主人脚边去了。' : '巴斯特的狗窝。里面没有狗。\n门廊底下的黑暗里，传来很轻很轻的呜咽声。') },
      { id: 'fdog', x: 26, y: 7, spr: 'dog', hidden: true, on: S => S.narr('巴斯特冲你摇了摇尾巴。') },
      { id: 'fcat', x: 12, y: 9, spr: 'cat', hidden: true, solid: false, on: S => S.narr('胡椒在你脚边打了个滚。') },
      { id: 'fedna', x: 24, y: 6, spr: '@ednaS', dir: 0, hidden: true, on: S => S.narr('埃德娜裹着被子，在门廊上冲你笑。脸色还是白的，可是眼睛亮了。') },
      { x: 14, y: 10, spr: 'invisible', on: S => S.narr('两家之间的这片空地，白天走过去只要一分钟。\n今天晚上，它看起来很长。') },
      { x: 10, y: 9, spr: 'invisible', on: S => S.narr('玉米早就收完了，只剩下一人多高的枯秆子。\n风一吹，整片地都在沙沙地响，像很多人在小声说话。') },
      { id: 'fk1', x: 23, y: 6, spr: '@kid1b', dir: 1, hidden: true, on: S => S.narr('他看着你。\n不要盯着他的眼睛看。') },
      { id: 'fk2', x: 25, y: 6, spr: '@kid2b', dir: 1, hidden: true, on: S => S.narr('他看着你。\n不要盯着他的眼睛看。') }
    ],
    async enter(S, first) {
      const f = S.f;
      if (f.phase === 'dawn') { S.dark(.3); S.plr(4); S.ent('ehouse').s.tv = false; S.ent('etv').hidden = true; if (S.once('dawnFarm')) await dawnScene(S); return; }
      if (f.phase === 'home' && first) {
        await S.narr('你把车停在自家门前，熄了火。\n四下里一点声音都没有。连虫子都不叫。');
        await S.narr('东边，埃德娜家的门廊灯没亮。客厅的窗户里一闪一闪的，是电视的蓝光。');
        await S.think('……这个点，她不该还醒着。');
        S.goal('先回家');
        S.cp('farm');
        return;
      }
      if (f.phase === 'seal' && S.once('fleeFarm')) {
        S.ent('ehouse').s.tv = false; S.ent('etv').hidden = true;
        S.show('fk1'); S.show('fk2');
        S.focus(24, 6);
        await S.narr('你一口气跑过两家之间的空地，一直跑到自家门廊上，才敢回头。');
        await S.narr('埃德娜家的门廊上，站着两个小小的人影。\n他们没有追出来。他们只是站在那儿，看着你家的方向。');
        S.focus(null);
        S.goal('进屋！');
        S.cp('seal');
      }
    }
  };

  /* ================= 四、自己家 ================= */
  const OPENINGS = { kwin: '厨房窗', flap: '猫洞', hatch: '煤槽口', flue: '烟道', bwin: '卧室窗' };
  const openLeft = S => Object.keys(OPENINGS).filter(k => !S.f['s_' + k]);
  const sealGoal = S => { const l = openLeft(S).length; return l ? `封住所有开着的口子（还剩 ${l} 处，对照埃德娜的图纸）` : '撑到天亮'; };
  async function sealed(S, k) {
    S.f['s_' + k] = true;
    if (S.f.phase !== 'seal') return;
    if (openLeft(S).length) { S.goal(sealGoal(S)); return; }
    await siegeStart(S);
  }
  async function phoneUse(S) {
    const f = S.f, e = S.ent('phone');
    if (f.pending === 'phone') return roundPhone(S);
    if (f.phase === 'dawn') return S.narr('你拿起听筒，拨了县医院的号码。\n电话通了。一个困得直打哈欠的接线员说：「县医院，请讲。」\n……你从来没觉得一个陌生人的声音这么好听过。');
    if (f.phase === 'seal' || f.phase === 'siege') return S.narr('你拿起听筒想报警。\n听筒里没有拨号音，只有一片沙沙声，像是很远的地方在刮风。\n……风声里，好像有两个人在小声地笑。你把它扣了回去。');
    if (f.msgHeard) return S.narr('答录机里的三条留言，你不想再听第二遍了。\n尤其是最后那一条。');
    e.s.msg = false; S.sfx('blip');
    await S.narr('你按下答录机的播放键。磁带「吱吱」地倒了一会儿。');
    await S.say('答录机', '第一条留言。晚上，九点，零五分。');
    await S.say('琳达（录音）', ['诺拉，我是琳达。明天的夜班跟你换一下，你上白班吧。', '还有——凯西那份打印纸，别再在护士站传了。那小姑娘看完一宿没敢关灯。']);
    await S.say('答录机', '第二条留言。晚上，九点，四十七分。');
    S.sfx('heart');
    await S.say('埃德娜（录音）', ['诺拉……是我，埃德娜。', '我做了一件傻事。三天前的晚上……我让他们进来了。']);
    await S.narr('录音里是一阵很长的咳嗽。');
    await S.say('埃德娜（录音）', ['要是有两个孩子去敲你的门——别开。千万别开。', '……我好冷啊，诺拉。怎么都暖和不过来。']);
    await S.say('答录机', '第三条留言。晚上，十一点，五十八分。');
    S.sfx('tv');
    await S.narr('沙沙的杂音。很长一段，什么都没有。\n然后，离话筒很近很近的地方，有人轻轻吸了一口气。');
    await S.say('孩子的声音（录音）', '……女士？您到家了吗？', { style: 'whisper' });
    await S.narr('「咔」。挂断了。');
    await S.think('十一点五十八分。那时候我还在加油站。\n……他们怎么会有我家的电话？');
    f.msgHeard = true;
    S.goal('去隔壁看看埃德娜');
    S.cp('msg');
  }
  async function frontDoor(S) {
    const f = S.f;
    if (f.pending === 'front') return roundFront(S);
    if (f.phase === 'home') {
      if (!f.msgHeard) return S.narr('答录机的红灯还在一闪一闪的。先听听留言吧。');
      S.sfx('open'); return S.go('farm', 5, 6, 0);
    }
    if (f.phase === 'dawn') {
      S.ent('fdoor').s.chain = false; S.sfx('open');
      await S.narr('你取下防盗链，拧开门锁。手还是抖的。\n门外的冷空气里，有一股青草和露水的味道。');
      return S.go('farm', 5, 6, 0);
    }
    return S.narr('门锁着，防盗链也挂上了。\n不到天亮，你不会开这扇门。');
  }
  function clockText(S) {
    const f = S.f;
    if (f.phase === 'dawn') return '座钟：六点二十一分。\n钟摆还在慢悠悠地晃，好像这一夜什么都没发生过。';
    if (f.phase === 'siege') return `座钟：${f.time || '一点'}。` + (f.round >= 4 ? '\n窗帘缝里还是黑的。离日出，还有二十多分钟。' : '\n离天亮还早。');
    if (f.phase === 'seal') return '座钟：快一点了。\n钟摆的声音今天晚上格外响。';
    return '座钟：十二点半。外婆留下来的老座钟，一天慢五分钟。';
  }

  const MAP_HOME = {
    amb: 'room', dark: .78, plr: 2.8, wall: 'paper', floor: 'wood',
    tileOpts: { carpetC: '#3e4a5a', woodC: '#5e4430' },
    rows: [
      '#########################',
      '#########################',
      '#cccccc#wwwwwwwwww#nnnnn#',
      '#cccccc#wwwwwwwwww#nnnnn#',
      '#cccccc.wwwwwwwwww.nnnnn#',
      '#cccccc#wwwwwwwwww#nnnnn#',
      '#cccccc#wwwwwwwwww#nnnnn#',
      '############w############'],
    ents: [
      // 卧室
      { id: 'bwin', x: 3, y: 1, spr: 'win2', async on(S) {
        const f = S.f, e = S.ent('bwin');
        if (f.pending === 'bwin') return roundWindow(S);
        if (e.s.nailed) return S.narr('两块木条把窗框钉得死死的。\n玻璃外面是黑的。你没有凑过去看。');
        if (S.has('hammer')) {
          S.sfx('thud'); await S.wait(250); S.sfx('thud'); await S.wait(250); S.sfx('thud');
          e.s.nailed = true; S.take('hammer');
          await S.narr('你从床底下抽出两块搁板，横着按在窗框上，一锤一锤地钉了进去。\n钉子敲进木头的声音，在空屋子里响得吓人。');
          return sealed(S, 'bwin');
        }
        await S.narr('卧室的窗户关着。可是插销早就坏了，从外面轻轻一推就能推开。\n你一直说要修，一直没修。');
        if (f.phase === 'seal') await S.think('得把它钉死。爸爸留下的那个旧工具箱……在衣柜底下。');
      } },
      { id: 'wardrobe', x: 1, y: 2, spr: 'wardrobe', col: '#5a4a3a', async on(S) {
        const f = S.f;
        if (f.phase !== 'seal' || f.gotHammer) return S.narr(f.gotHammer ? '衣柜里挂着你的几件毛衣和一件护士服。' : '衣柜里挂着你的几件毛衣和一件护士服。\n底下压着爸爸留下的旧工具箱，好几年没打开过了。');
        f.gotHammer = true; S.ent('wardrobe').open = true; S.give('hammer');
        await S.narr('你把衣柜底下的旧工具箱拖了出来。锁扣锈了，一掰就开。\n一把羊角锤，半盒钉子。');
        S.ent('wardrobe').open = false;
      } },
      { x: 5, y: 2, h: 2, spr: 'bed', col: '#6a7a9a', on: S => S.narr('床铺得整整齐齐。枕头边上放着一本没看完的小说，书签夹在第一百一十二页。') },
      { x: 6, y: 2, spr: 'lamp', off: true, on: S => S.narr('床头灯。灯罩上有一块焦黄的印子。') },
      { x: 2, y: 6, spr: 'dresser', col: '#5a4030', on: S => S.narr('五斗柜上摆着一张照片：你抱着一只黑猫，猫一脸不耐烦。\n胡椒。三天前出的门，到现在还没回来。') },
      { x: 4, y: 4, spr: 'invisible', light: { r: 3, col: 'rgba(255,210,150,.08)' } },
      // 客厅
      { id: 'hearth', x: 9, y: 2, w: 2, spr: 'hearth', async on(S) {
        const e = S.ent('hearth');
        if (e.s.shut) return S.narr('风门关着。烟道里的风声闷闷的，像有人隔着一堵墙在喘气。');
        await S.narr('壁炉是冷的。上一次生火，还是上个礼拜天。\n你伸手往烟道里一摸——风门拉杆朝上，烟道大开着。冷风「呜呜」地往下灌。');
        S.sfx('switch'); e.s.shut = true;
        await S.narr('你把拉杆扳了下来。「咣当」一声，风门合上了。');
        return sealed(S, 'flue');
      } },
      { x: 11, y: 1, spr: 'painting', col: '#3a4a5a', on: S => S.narr('墙上挂着一幅油画：枫林路的老样子，路两边还没有电线杆。\n画上有两栋一模一样的房子。是前房主留下的。') },
      { id: 'htv', x: 12, y: 2, spr: 'tv2', on: S => S.narr(S.ent('htv').lit ? '电视自己开着。满屏的雪花。' : '电视关着。黑漆漆的屏幕上，映出你身后的半个客厅。') },
      { id: 'lwin', x: 14, y: 1, spr: 'win2', on: S => S.narr(S.ent('lwin').lit ? '窗外的天，是灰白色的。' : '客厅的窗户关着，插销也是好的。\n玻璃外面黑沉沉的，只看得见你自己的倒影。') },
      { id: 'hclock', x: 16, y: 2, spr: 'clock', on: S => S.narr(clockText(S)) },
      { id: 'phone', x: 17, y: 2, spr: 'phonet', s: { msg: true }, on: phoneUse },
      { x: 12, y: 5, w: 2, spr: 'sofa', col: '#5a4a3a', on: S => S.narr('沙发上搭着一条毛毯。你很想裹着它睡过去。\n……不是今晚。') },
      { x: 9, y: 5, spr: 'armchair', col: '#6a3a3a', on: S => S.narr('扶手椅。胡椒最喜欢趴在这把椅子上，扶手被它抓得全是线头。') },
      { x: 17, y: 6, spr: 'lamp', light: { r: 3.4, col: 'rgba(255,200,130,.14)' }, on: S => S.narr('落地灯。这屋里只有它的灯泡是新换的。') },
      { id: 'fdoor', x: 12, y: 7, spr: 'bdoor', on: frontDoor },
      { x: 13, y: 4, spr: 'invisible', light: { r: 3.2, col: 'rgba(255,210,150,.07)' } },
      // 厨房
      { id: 'kwin', x: 20, y: 1, spr: 'win2', open: true, async on(S) {
        const e = S.ent('kwin');
        if (e.open) {
          S.sfx('close'); e.open = false;
          await S.narr('你把窗扇拉下来，插上了插销。\n早上煎糊了培根，开窗散味儿，出门的时候忘了关。');
          return sealed(S, 'kwin');
        }
        return S.narr(e.lit ? '窗外的玉米地是灰白色的。' : '插销插得好好的。\n窗外的玉米地黑得像一堵墙。玻璃上蒙着一层你自己呼出来的白气。');
      } },
      { id: 'bkdoor', x: 22, y: 1, spr: 'backdoor', async on(S) {
        const f = S.f, e = S.ent('bkdoor');
        if (f.pending === 'back') return roundBack(S);
        if (e.s.blocked) return S.narr('面粉袋死死地抵着猫洞。门闩也插得好好的。');
        if (S.has('flour')) {
          S.take('flour'); e.s.blocked = true; S.sfx('thud');
          await S.narr('你把面粉袋拖过来，死死地抵在猫洞上。\n……对不起，胡椒。等天亮了，我就把它挪开。');
          return sealed(S, 'flap');
        }
        await S.narr('后门的门闩插得好好的。\n可门底下那扇猫洞的小帘子，在风里一下一下地拍着。胡椒三天没回家了，你一直没舍得把它封上。');
        if (f.phase === 'seal') await S.think('猫洞也是口子。……得找个够沉的东西，把它堵死。储藏间里有一袋面粉。');
      } },
      { x: 19, y: 2, spr: 'stove', on: S => S.narr('炉子上的平底锅里，还留着早上那几片煎糊的培根。') },
      { x: 21, y: 2, spr: 'sink', on: S => S.narr('水龙头没关紧，滴答，滴答。\n你拧紧了它。屋里一下子安静得让人心慌。') },
      { x: 23, y: 2, spr: 'fridge', on: S => S.narr('冰箱门上贴着诊所的排班表，和埃德娜手写的苹果派配方。\n「肉桂多放一点。——E.G.」') },
      { x: 20, y: 4, w: 2, spr: 'table2', col: '#7a5a3a', on: S => S.narr('餐桌上摊着一堆没拆的账单。你今天总算交掉了其中一张。') },
      { x: 23, y: 4, spr: 'catbowl', on: S => S.narr('胡椒的饭碗。干干净净的，三天没人动过了。') },
      { x: 19, y: 6, spr: 'shelf', on: S => S.narr('储藏间的架子上是罐头、腌黄瓜、一筐土豆。') },
      { id: 'sack', x: 22, y: 6, spr: 'sack', async on(S) {
        const f = S.f;
        if (S.ent('bkdoor').s.blocked) return S.narr('面粉袋已经被你拖去堵猫洞了，地上留下一道白印子。');
        if (S.has('flour')) return S.narr('面粉袋就在你手上，沉得要命。');
        if (f.phase !== 'seal') return S.narr('一袋二十五磅的面粉，靠在储藏间的角落里。\n本来打算感恩节烤派用的。');
        S.give('flour'); S.hide('sack');
        await S.narr('你弯下腰，把那袋二十五磅的面粉抱了起来。\n够沉。');
      } },
      { id: 'hatch', x: 23, y: 6, spr: 'hatch', decal: true, open: true, async on(S) {
        const e = S.ent('hatch');
        if (!e.open) return S.narr('旧煤槽口的木板盖得严严实实，插销也插上了。');
        await S.narr('储藏间角落的地板上，有一块方方正正的木板。\n是旧煤槽的口子，通地窖，几十年没人用过了。木板翘起来一道缝，冷风从底下一股一股地往上灌。');
        S.sfx('close'); e.open = false; e.locked = true;
        await S.narr('你一脚把木板踩平，插上了边上那根锈得发红的插销。');
        return sealed(S, 'hatch');
      } },
      { x: 21, y: 4, spr: 'invisible', light: { r: 3, col: 'rgba(230,230,255,.06)' } }
    ],
    async enter(S, first) {
      const f = S.f;
      if (first) {
        await S.narr('屋里冷冰冰的，有一股煎糊了的培根味儿。\n你把钥匙扔在桌上，没开大灯。');
        await S.narr('电话旁边，答录机的小红灯一闪，一闪。');
        S.goal('听听电话答录机');
        return;
      }
      if (f.phase === 'seal' && S.once('sealIntro')) {
        S.ent('fdoor').s.chain = true; S.sfx('close');
        await S.narr('你反手锁上前门，挂上防盗链，背靠着门板滑坐到地上。\n心跳声大得像有人在擂鼓。');
        await S.think('埃德娜说：开着的门、开着的窗，就是一句「请进」。\n……这栋房子，一共有几个口子？');
        await S.think('图纸。照着图纸，一处一处地查。');
        if (!openLeft(S).length) return siegeStart(S);
        S.goal(sealGoal(S));
      }
    }
  };
