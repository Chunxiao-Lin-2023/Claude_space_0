/* ================= 第十三夜 · 玛丽·赛勒斯特号 ================= */
(() => {
  /* 主题：真实与夸大。1884 年有人拿着柯南·道尔的小说来问「茶是不是热的」，你讲十二年前登船的那一天。
     玩法：登船勘验，把看见的东西编号记进勘验本（0–9），晚上在船长室里用证物编号一条一条驳倒「海怪 / 海盗 / 风浪」，
     再还原最说得通的经过（以为船要出事 → 陆地就在眼前 → 小艇拴着的缆绳断了）。
     危险：黄昏的飑——盖上前舱口，躲开甩动的主帆横杆，在小艇的缆绳绷断前回到船尾。
     幽灵只在边缘：自己摆好的热茶、自己响的风琴、舵轮边不在名单上的「第十一个人」（全是游戏虚构）。
     双人：一人在「笺」里翻《勘验本》念编号、一人按；飑里一人盯横杆喊「走」。 */
  let DIED = 0;        // 本局在飑里失败几次（只影响重来时的提示）
  let SQ = { left: null };   // 飑的倒计时：重来时取「上次剩余」与下限的较大者
  let GW = false;      // 舵轮边的人只吓一次
  const T0 = 17, TMIN = 14;   // 飑的倒计时（秒）
  /* 横杆：在主桅后面（第 22–27 列）左右甩；REST 秒停一下，WARN 秒前「嘎」一声预警，SWEEP 秒甩过去 */
  const REST = 2.6, WARN = .85, SWEEP = .5, OYA = 0, OYB = 128, OYM = 64;
  const B = { t: 0, side: 0, sw: false, p: 0, from: 0, to: 0, warned: false, hit: false, lt: 4 };
  function resetBoom(S) { Object.assign(B, { t: 0, side: 0, sw: false, p: 0, warned: false, hit: false, lt: 4 }); const b = S.ent('boom'); if (b) { b.oy = OYA; b.s.warn = false; b.s.loose = true; } }

  /* ---------------- 证物 ---------------- */
  const EVS = [
    '船长桌：天文钟、六分仪、船舶文件不见了，记事石板留着',
    '船长床下的佩剑：刃上有褐色的斑',
    '小艇不见了：艇座空着，右舷舷墙拆下一段',
    '船头吃水线上，两道长长的口子',
    '测深杆扔在甲板上：舱底积水三尺半',
    '船尾一根断了的粗缆绳，拖在水里',
    '水手舱：烟斗、油布靴、衣服都在',
    '前后舱口都掀开了；舱底酒味冲鼻，几只红橡木桶在渗，木头上没有焦痕',
    '两台水泵，有一台被拆开了',
    '缝纫机上的油瓶还直立着；风琴、衣服、玩具都在'];
  const AREAS = [['船头', [3]], ['前甲板室', [6]], ['主舱口的小艇座', [2]], ['主桅边的水泵', [4, 8]], ['船尾', [5]], ['船长室', [0, 1, 9]]];
  const has = (S, d) => !!(S.f.ev && S.f.ev[d]);
  const top9 = S => [0, 1, 2, 3, 4, 5, 6, 8, 9].every(d => has(S, d));
  const evN = S => Object.keys(S.f.ev || {}).length;
  const remAreas = S => AREAS.filter(([, l]) => l.some(d => !has(S, d))).map(([n]) => n);
  function goalUpd(S) {
    if (S.f.act !== 'inv') return;
    const n = evN(S);
    if (!top9(S)) S.goal(`勘验 ${n}/10 · 还没查完：${remAreas(S).join('、')}`);
    else if (!has(S, 7)) S.goal('勘验 9/10 · 下前舱口，看看货舱');
    else S.goal('勘验 10/10 · 回到甲板上（舱底的梯子）');
  }
  function ev(S, d) {
    S.f.ev = S.f.ev || {};
    if (S.f.ev[d]) return false;
    S.f.ev[d] = true; S.sfx('paper');
    S.toast(`勘验本 · ${d} 号：${EVS[d]}`);
    goalUpd(S);
    return true;
  }
  const BOOK = '玛丽·赛勒斯特号勘验 · 1872年12月4日\n（德沃大副的字，又快又硬）\n\n' + EVS.map((t, i) => `${i}　${t}`).join('\n')
    + '\n\n另：淡水、口粮够吃半年。厨房的炉子歪了，没做饭，积着水。罗经柜撞坏了。前帆和上桅帆吹没了，别的帆有的张着，有的收着。';

  /* ---------------- 合成音 ---------------- */
  const bell = (S, n = 2) => { for (let i = 0; i < n; i++) { S.tone('sine', 1320, 1316, 1.6, .16, i * .55, 0); S.tone('sine', 2650, 2640, .7, .05, i * .55, 0); S.tone('triangle', 660, 655, 1.2, .06, i * .55, 0); } };
  const creak = (S, v = 1) => { S.tone('sawtooth', 150, 92, .55, .05 * v, 0, 700); S.tone('triangle', 74, 56, .6, .09 * v, .04, 0); };
  const whoosh = S => { S.tone('sawtooth', 320, 60, .45, .07, 0, 900); S.tone('sine', 120, 50, .5, .12, 0, 0); };
  const clink = S => { S.tone('sine', 3300, 3200, .16, .07, 0, 0); S.tone('sine', 2480, 2470, .22, .04, .03, 0); };
  const thunder = S => { S.tone('sawtooth', 70, 32, 1.4, .14, .2, 260); S.tone('sine', 48, 30, 1.6, .2, .25, 0); };
  /* 簧风琴：方波压低通 + 高八度三角波，像一口气吹出来的 */
  const reed = (S, notes, gap = .5, vol = .05, far = false) => notes.forEach((f, i) => { S.tone('square', f, f, gap * 1.6, vol, i * gap, far ? 700 : 1500); S.tone('triangle', f * 2, f * 2, gap * 1.4, vol * .5, i * gap, 0); });
  const HYMN = [392, 392, 440, 494, 494, 440, 392, 330];

  /* ---------------- 地图生成：船体（~海水 H舷墙 p甲板） ---------------- */
  function hullRows(w, h, lo, hi) {
    const ins = (x, y) => y >= 1 && y <= h - 2 && x >= lo[y] && x <= hi[y];
    const rows = [];
    for (let y = 0; y < h; y++) {
      let s = '';
      for (let x = 0; x < w; x++) {
        if (!ins(x, y)) { s += '~'; continue; }
        let edge = false;
        for (let dy = -1; dy <= 1 && !edge; dy++) for (let dx = -1; dx <= 1; dx++) if (!ins(x + dx, y + dy)) { edge = true; break; }
        s += edge ? 'H' : 'p';
      }
      rows.push(s);
    }
    return rows;
  }
  const put = (rows, x, y, str) => { rows[y] = rows[y].slice(0, x) + str + rows[y].slice(x + str.length); };
  /* 玛丽·赛勒斯特号甲板：船头朝左，方船尾朝右 */
  const DECK = hullRows(34, 13, [0, 7, 5, 3, 2, 1, 1, 1, 2, 3, 5, 7, 0], [0, 31, 31, 31, 31, 31, 31, 31, 31, 31, 31, 31, 0]);
  /* 神恩号：船尾（船长室）朝左，船头朝右，右边的海上漂着那条船 */
  const DG = hullRows(40, 12, [0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0], [0, 19, 21, 23, 24, 25, 25, 24, 23, 21, 19, 0]);
  put(DG, 2, 2, '#######'); put(DG, 2, 3, '#######'); put(DG, 2, 4, '#WWWWW#'); put(DG, 2, 5, '#WWWWWW'); put(DG, 2, 6, '#WWWWW#'); put(DG, 2, 7, '#WWWWW#'); put(DG, 2, 8, '#######');
  put(DG, 14, 10, 'p');   // 右舷中间的跳板缺口

  /* ---------------- 惊吓大头像 ---------------- */
  const FACES = {
    oilskin(R, a, t) {   // 黄色防水帽（sou'wester）底下黑洞洞的，只有两点发白的眼睛；海水顺着帽檐往下淌，嘴越张越大
      const Y = '#c9a63a', Y2 = '#a8862a', Y3 = '#7a5e18', K = '#06080a', W = '#dcecee', WT = '#7aa4b8';
      R(0, 0, 32, 32, '#020304');
      R(4, 24, 24, 8, Y2); R(2, 27, 28, 5, Y2); R(14, 24, 4, 8, Y3); R(15, 26, 2, 1, '#2a2418'); R(15, 29, 2, 1, '#2a2418');   // 雨衣领口
      R(8, 2, 16, 3, Y); R(6, 4, 20, 4, Y); R(10, 1, 12, 1, Y2); R(9, 3, 6, 1, '#e4c860');
      R(1, 8, 30, 3, Y); R(0, 10, 32, 2, Y2); R(2, 8, 28, 1, '#e4c860');   // 宽帽檐
      R(3, 11, 5, 13, Y2); R(24, 11, 5, 13, Y2); R(4, 12, 1, 11, Y3); R(27, 12, 1, 11, Y3);   // 两边的护耳
      R(8, 11, 16, 14, K); R(9, 24, 14, 1, K);
      const op = a < .2 ? 1 : 2;
      R(11, 16, 3, op, W); R(18, 16, 3, op, W); if (op > 1) { R(12, 16, 1, 1, '#ffffff'); R(19, 16, 1, 1, '#ffffff'); }
      const mh = Math.round(a * 5);
      if (mh) { R(13, 21, 6, mh, '#000'); R(13, 20, 6, 1, '#2a3036'); R(12, 21, 1, Math.max(0, mh - 1), '#1a1e22'); R(19, 21, 1, Math.max(0, mh - 1), '#1a1e22'); }
      for (let i = 0; i < 9; i++) { const x = 2 + i * 3.4, y = 12 + ((t * 26 + i * 7) % 20); R(x, y, 1, 2, WT); }   // 帽檐上滴下来的水
      R(10, 23, 1, 3, WT); R(21, 22, 1, 4, WT);
      for (let i = 0; i < 3; i++) R(6 + i * 9, 30, 4, 1, '#3a5a4a');   // 领口挂着几缕海草
    }
  };

  defChapter({
    id: 'celeste', n: 13, title: '玛丽·赛勒斯特号', sub: '大西洋上漂着一条双桅船：帆张着，舵空转，一个人也没有。——可桌上，并没有热茶。', origin: '大西洋 · 1872年', color: '#2e4a5c',
    amb: 'wind', floor: 'wood', wall: 'wood', dark: .3, plr: 3.6,
    people: {
      me: { skin: '#e8c09a', hair: '#4a3020', hs: 'short', hat: 'cap', hatC: '#2a3248', top: '#2e3a52', top2: '#d8d0c0', bottom: '#3a3428', coat: true, shoes: '#2a1a10' },
      morehouse: { key: 'mc-mh', skin: '#e4bc98', hair: '#3a2a20', hs: 'short', hat: 'cap', hatC: '#16161e', top: '#1e2432', top2: '#e8e2d0', bottom: '#22262e', coat: true, shoes: '#111',
        extra(g, d, fr, G, R) { const c = '#3a2a20'; if (d === 0) { R(4, G.hT + 6, 8, 2, c); R(5, G.hT + 8, 6, 1, c); R(7, G.tT + 2, 1, 1, '#c9a35a'); R(7, G.tT + 5, 1, 1, '#c9a35a'); } else if (d === 1) { R(3, G.hT + 6, 5, 2, c); R(4, G.hT + 8, 3, 1, c); } } },
      deveau: { key: 'mc-dv', skin: '#dcb490', hair: '#20140e', hs: 'short', top: '#3a3226', top2: '#c8b890', bottom: '#2a2620', coat: true, shoes: '#1a120a',
        extra(g, d, fr, G, R) { const c = '#20140e'; if (d === 0) { R(4, G.hT + 5, 8, 3, c); R(5, G.hT + 8, 6, 1, c); R(6, G.hT + 6, 4, 1, '#a8705a'); } else if (d === 1) { R(3, G.hT + 5, 5, 3, c); R(4, G.hT + 8, 3, 1, c); } } },
      wright: { skin: '#ecc8a8', hair: '#a8743a', hs: 'messy', top: '#5a4a34', top2: '#d8cab0', bottom: '#3a3428', shoes: '#2a1a10' },
      helm: { skin: '#d8b088', hair: '#c8b070', hs: 'short', hat: 'cap', hatC: '#6a2a22', top: '#6a6a5a', bottom: '#3a3a30', shoes: '#2a1a10' },
      oilskin: { key: 'mc-oil', skin: '#262c32', hair: '#121518', hs: 'short', top: '#b8962e', top2: '#8a6e20', bottom: '#8a6e20', coat: true, ghost: true, eye: '#d8eaea',
        extra(g, d, fr, G, R) {
          R(2, G.hT - 1, 12, 2, '#c9a63a'); R(4, G.hT - 3, 8, 3, '#b8962e'); R(5, G.hT - 3, 3, 1, '#e4c860');
          if (d === 3) R(3, G.hT + 1, 10, 6, '#b8962e');
          else if (d === 0) { R(3, G.hT + 1, 2, 6, '#a8862a'); R(11, G.hT + 1, 2, 6, '#a8862a'); R(5, G.hT + 1, 6, 6, '#0c0f12'); R(6, G.hT + 3, 1, 1, '#d8eaea'); R(9, G.hT + 3, 1, 1, '#d8eaea'); R(4, G.tB + 1 + (fr % 2), 1, 2, '#7aa0b0'); R(11, G.tB + 2 - (fr % 2), 1, 2, '#7aa0b0'); }
          else { R(9, G.hT + 1, 3, 6, '#a8862a'); R(3, G.hT + 1, 6, 6, '#0c0f12'); R(4, G.hT + 3, 1, 1, '#d8eaea'); }
        } }
    },
    faces: FACES,
    items: {
      ropeend: { name: '一截绳头', desc: '从玛丽·赛勒斯特号船尾那根断缆上割下来的。一指多粗，磨断的那一头散开了，像一把发黑的刷子。' }
    },
    notes: {
      cornhill: { title: '《J. 哈巴库克·杰弗森的自述》（1884）', text: '（伦敦《康希尔杂志》1884年1月号，没有署作者的真名。记者折了角的那几页，大意如下：）\n\n一条叫「Marie Celeste」的船，在大西洋上被人发现时空无一人。\n两条小艇好端端地挂在吊艇架上。\n写这篇自述的人说，他是船上唯一活下来的乘客，亲眼看见了一场预谋的屠杀。\n\n记者在页边用铅笔添了几行，说是「别的报纸上也这么写」：\n· 早饭吃了一半，刀叉还摆着\n· 茶杯里的茶，还是热的\n· 厨房的锅还在炉子上\n\n（船名拼错了。你在心里一条一条地划掉。）' },
      slate: { title: '记事石板与航海日志', text: '航海日志（大副舱的桌上）\n最后一条写在11月24日：北纬36度56分，西经27度20分。风向、航速，一切如常。\n\n记事石板（船长桌上；先用粉笔记下，再誊进日志）\n11月25日\n上午5时　望见圣玛利亚岛，在东南偏东。\n上午8时　圣玛利亚岛东端，在南西南方向，距6海里。\n\n之后，什么也没写。\n\n（德沃在旁边算了算：从那儿到我们碰上她的地方，将近四百海里。这条船没人掌舵，自己走了九天。）' },
      book: { title: '德沃大副的勘验本', text: BOOK },
      court: { title: '直布罗陀海事法庭（1872年12月—1873年3月）', text: '后来的事，是从报纸和德沃的信里拼起来的：\n\n· 直布罗陀的检察长索利-弗勒德一直认定船上有人行凶：他拿船长床下那把剑上的斑说事，又说船头那两道口子是被人故意砍的。\n· 化验的结论：剑上的斑不是血。船头的口子，也有看过的人说只是船板被浪打坏的。\n· 也有人怀疑过两条船的船长串通。法庭没有找到任何证据，没有任何人被起诉。\n· 1873年3月，法庭判给神恩号的船长和船员约1700英镑救助费——只占船和货价值的一小部分，很多人觉得给少了。\n· 玛丽·赛勒斯特号后来照原计划把酒精运到了热那亚。据说卸货的时候，有九只桶是空的。\n\n船上那十个人——船长、他的妻子和两岁的女儿、两个大副、一个厨师兼管事、四个水手——再也没有人见过。' }
    },
    legend: '1872年11月7日，美国双桅船（前桅横帆、主桅纵帆，当时也叫「半横帆双桅船」）玛丽·赛勒斯特号从纽约出港，载着1701桶工业酒精，开往意大利热那亚。船上一共十个人：船长本杰明·布里格斯、他的妻子萨拉和两岁的女儿索菲娅，大副艾伯特·理查森、二副安德鲁·吉林、厨师兼管事爱德华·黑德，以及四名德国水手（福尔克特与博兹·洛伦岑兄弟、阿里安·马滕斯、戈特利布·古德沙特）。12月4日午后，加拿大双桅船神恩号（Dei Gratia，船长戴维·莫尔豪斯，装着石油开往直布罗陀）在亚速尔群岛以东发现她独自漂行。大副奥利弗·德沃和二副约翰·赖特登船：船上空无一人，唯一的小艇不见了；货舱积水约三尺半，两台水泵中有一台被拆开，一根测深杆扔在旁边；前舱口和后舱口的盖板被掀开放在甲板上；天文钟、六分仪和船舶文件不见了，航海日志和记事石板还在，石板最后一条写在11月25日上午8时，记的是望见圣玛利亚岛。淡水和口粮够吃半年，船员的衣物和私人物品都在；厨房的炉子被撞离了座子，没有做好的饭；有的帆张着，前帆和上桅帆被吹走了。据说罗经柜也被撞坏了；也有转述说，船长室里一小瓶缝纫机油还直立着。\n\n德沃带着水手伦德和安德森把船开到了直布罗陀。海事法庭的问讯从1872年12月持续到次年3月，直布罗陀检察长弗雷德里克·索利-弗勒德始终怀疑有人行凶，他提到船长床下的一把剑和船头附近的两道口子；化验认为剑上的斑不是血，船头的损伤也有人认为是自然造成的。法庭没有认定任何罪行、没有起诉任何人，只判给神恩号船长和船员约1700英镑救助费，金额之低常被解读为一种保留。玛丽·赛勒斯特号随后把货运到了热那亚，据说卸货时有九只桶是空的（有人说那是更容易渗漏的红橡木桶）。1885年，她的最后一任船长故意让她在海地附近的礁石上搁浅，企图骗保，事情败露。\n\n让她变成「幽灵船」的，是后来的故事。1884年1月，伦敦《康希尔杂志》匿名刊出小说《J. 哈巴库克·杰弗森的自述》，作者是当时还没成名的阿瑟·柯南·道尔：小说把船名写成「Marie Celeste」，说小艇都好好地挂在吊艇架上，还虚构了一位讲述屠杀的幸存乘客。很多读者把它当了真，那个拼错的船名也流传至今。更晚的转述又添了吃了一半的早饭、还冒着热气的茶、炉子上的锅、船上的猫——这些都查无实据：登船者作证说，船长室的桌上没有吃的也没有喝的，只竖着风浪天用的防滑栏架，厨房里也没有做好的饭。\n\n真正发生了什么，至今没有定论。海怪、海盗、船员叛乱都缺乏证据（值钱的东西和货都在，也没有打斗的痕迹）；两位船长串通骗取救助费的说法，同样没有任何证据。比较常被认为说得通的是「主动弃船」：船长因为某种原因——舱底的酒精蒸汽、测深时以为在漏水（或水泵出了毛病）、恶劣天气，或者天文钟的误差让他以为离岸更近——下令全体上小艇，打算暂时离开、看清楚再说，而小艇最终和大船失散。据说船上的主斜桁升降索断了一截，有人据此推测他们用它把小艇拴在大船后面。2006年，伦敦大学学院的一位化学家做过模拟实验：舱里的可燃蒸汽点着以后，会掠过一层淡蓝色的「冷」火焰，压力足以掀开舱盖，却几乎不留焦痕——这让「酒精蒸汽」一说多了几分可能，但仍只是推测。\n\n（本章中：1884年酒馆里的「你」和年轻记者是虚构的，「你」作为神恩号的水手随德沃、赖特登船也是虚构——历史上登船勘验的是德沃和赖特。莫尔豪斯、德沃、赖特、伦德、安德森都是真实人物，他们在本章里的台词和推理都是游戏虚构，不代表他们本人的说法；玛丽·赛勒斯特号上十个人的姓名取自公开史料，本章没有、也不想指控任何真实的人。舵轮边那个穿黄油布雨衣、不在任何名单上的「第十一个人」，自己摆好的热茶，自己响起来的风琴，舱底那道蓝色的火苗，黄昏的飑和甩动的横杆，证物编号和推理问答，割下的绳头，以及「夜里一个人留在船上」「茶还是热的」两个结局，都是游戏虚构。）',
    endings: { truth: '最说得通的解释', alone: '夜里一个人留在船上', legend: '茶还是热的' },
    start: { map: 'dg', x: 15, y: 5, dir: 2 },
    resume: {
      squall: async S => {
        resetBoom(S);
        if (DIED) {
          S.sfx('heart');
          await S.think(DIED === 1 ? '……再来。\n先盖前舱口。然后在主桅边上等——横杆「嘎」地一响甩过去，马上冲。'
            : '横杆一停就跑，按住奔跑键会快得多。\n主桅后面那几格里，一步也别停。');
        }
        startSquallTimer(S);
      },
      final: async S => { await finalScene(S); }
    },
    async intro(S) {
      DIED = 0; SQ = { left: null }; GW = false;
      await S.card('第十三夜　玛丽·赛勒斯特号', '1884年2月　加拿大新斯科舍　港口边的小酒馆', '有人把一本伦敦的杂志拍在你面前。\n「老伙计，你当年在神恩号上，对吧？\n……这上面写的，是真的吗？」');
      await S.say('年轻记者', ['一条船在大西洋上漂着，一个人都没有。早饭吃了一半，茶杯里的茶还是热的，小艇一条不少——', '写这篇东西的人说，他是船上唯一活下来的。伦敦那边都在传。']);
      await S.note('cornhill');
      await S.think('……茶是热的？\n不。不是这样的。');
      await S.say('你', '那天登船的人里有我。你要听，就听我说——我只说我看见的。');
      bell(S, 2);
      await S.card('十二年前', '1872年12月4日　午后一点多　亚速尔群岛以东的大西洋', '我们的船叫神恩号，装着石油，从纽约开往直布罗陀。\n舵手先看见了她：一条双桅船，帆张得乱七八糟，在风里一会儿偏左、一会儿偏右。\n\n甲板上，一个人也没有。');
    },
    tick(S, dt) {
      if (W.ended) return;
      const a = S.f.act, m = S.map;
      if (m === 'deck' && a === 'squall') return squallTick(S, dt);
      if (S.busy) return;
      if (m === 'deck' && a === 'inv') {   // 没人掌舵：舵轮时不时自己转一下，索具吱呀
        S.f._wh = (S.f._wh ?? 6) - dt;
        if (S.f._wh <= 0) { S.f._wh = 7 + Math.random() * 6; const w = S.ent('wheel'); w.s.spin = !w.s.spin; creak(S, .6); }
      }
      if (m === 'hold') { S.f._dr = (S.f._dr ?? 2) - dt; if (S.f._dr <= 0) { S.f._dr = 2.5 + Math.random() * 3; S.sfx('drip'); } }
      if (m === 'cabin' && a === 'inv') { S.f._cr = (S.f._cr ?? 5) - dt; if (S.f._cr <= 0) { S.f._cr = 8 + Math.random() * 6; creak(S, .4); } }
    },
    thumb(g, w, h) {
      const sky = g.createLinearGradient(0, 0, 0, 50); sky.addColorStop(0, '#26343e'); sky.addColorStop(1, '#5a6a72'); g.fillStyle = sky; g.fillRect(0, 0, w, 50);
      g.fillStyle = '#3a4852'; for (let i = 0; i < 5; i++) g.fillRect(((i * 37) % w) | 0, 6 + i * 6, 40 + i * 6, 3);
      g.fillStyle = '#12202a'; g.fillRect(0, 50, w, h - 50);
      g.fillStyle = '#3a5a6a'; for (let i = 0; i < 22; i++) g.fillRect((hash(i, 2, 13) * w) | 0, 54 + ((hash(i, 3, 13) * 30) | 0), 6, 1);
      g.fillStyle = '#1a120c';   // 船体：船头朝左
      for (let y = 0; y < 9; y++) g.fillRect(36 + y * 1.6 + (y < 3 ? 6 - y * 2 : 0), 52 + y, 84 - y * 3, 1);
      g.fillStyle = '#5a4228'; g.fillRect(40, 51, 82, 2);
      g.fillRect(18, 48, 26, 1); g.fillRect(14, 47, 6, 1);   // 船首斜桅
      g.fillStyle = '#2a1e14'; g.fillRect(62, 10, 2, 42); g.fillRect(96, 14, 2, 38);   // 两根桅
      g.fillRect(52, 16, 22, 1); g.fillRect(54, 28, 18, 1); g.fillRect(55, 38, 16, 1);
      g.fillStyle = '#b8b4a6';   // 前桅的横帆：上面一面吹没了，只剩布条；下面一面半张
      for (let i = 0; i < 5; i++) g.fillRect(54 + i * 4, 17, 2, 3 + (i % 3) * 2);
      g.fillRect(55, 29, 16, 8); g.fillStyle = '#12202a'; g.fillRect(63, 33, 6, 4);
      g.fillStyle = '#a8a496'; g.fillRect(98, 46, 22, 3); g.fillRect(99, 22, 1, 24);   // 主帆收着
      g.fillStyle = '#c9a63a'; g.fillRect(114, 44, 3, 5); g.fillRect(113, 43, 5, 1);   // 舵轮边一个黄色的人影
      g.fillStyle = 'rgba(220,236,238,.9)'; g.fillRect(115, 45, 1, 1);
      g.fillStyle = '#ffe8a0'; g.fillRect(140, 8, 2, 2);
    },
    sprites: {
      rainfx(g, e, t) {   // 飑：整屏斜雨（实体跟着玩家走，画的时候不看自己的位置）
        g.fillStyle = 'rgba(180,200,220,.38)';
        for (let i = 0; i < 110; i++) { const sp = 260 + hash(i, 1, 5) * 120, x = ((hash(i, 2, 5) * (VW + 80) - (t * sp * .35)) % (VW + 80) + VW + 80) % (VW + 80) - 40, y = ((hash(i, 3, 5) * VH + t * sp) % VH); g.fillRect(x | 0, y | 0, 1, 5); }
        g.fillStyle = 'rgba(200,220,235,.08)'; if (Math.sin(t * 1.7) > .93) g.fillRect(0, 0, VW, VH);
      },
      mast(g, e, t, R) {   // 桅杆：向上伸出；s.torn 前帆吹没了只剩布条；s.furl 主帆收着
        R(3, 9, 10, 6, 'rgba(0,0,0,.25)'); R(4, 6, 8, 8, '#3a2a1a'); R(6, -44, 4, 58, '#5a4430'); R(7, -44, 1, 58, '#7a5e40');
        R(-14, -34, 44, 2, '#4a3826'); R(-12, -20, 40, 2, '#4a3826');
        if (e.torn) { for (let i = 0; i < 7; i++) { const l = 4 + ((i * 5) % 7) + Math.round(Math.sin(t * 5 + i) * 2); R(-12 + i * 6, -32, 3, l, '#c8c0a8'); } R(-11, -18, 38, 9, '#c8c0a8'); R(-11, -18, 38, 1, '#e0d8c0'); R(4, -14, 10, 5, '#0e1820'); R(5, -10, 3, 2, '#c8c0a8'); }
        if (e.furl) { R(-12, -21, 40, 3, '#d0c8b0'); for (let i = 0; i < 5; i++) R(-10 + i * 9, -21, 1, 3, '#8a7a5a'); }
        R(8, -44, 1, 44, 'rgba(30,20,10,.5)');
      },
      bowsprit(g, e, t, R) { R(-26, 6, 40, 3, '#5a4228'); R(-26, 6, 40, 1, '#7a5e3a'); R(-30, 7, 4, 2, '#3a2a1a'); R(-24, 2, 1, 5, '#2a1e14'); for (let i = 0; i < 4; i++) R(-22 + i * 9, 4 - i, 9, 1, 'rgba(40,30,20,.6)'); },
      bowmark(g, e, t, R) { R(2, 11, 9, 1, '#2a1a10'); R(4, 13, 10, 1, '#2a1a10'); if (!e.read) { const k = Math.sin(t * 4) > .6; if (k) R(7, 6, 2, 2, 'rgba(255,240,200,.5)'); } },
      fhouse(g, e, t, R) {   // 前甲板室：厨房 + 水手舱；顶上散着一面主支索帆，烟囱冰凉
        R(-1, 44, 66, 4, 'rgba(0,0,0,.3)');
        box(R, 0, -6, 64, 42, '#5e4e3a'); for (let y = -4; y < 34; y += 4) R(1, y, 62, 1, '#4e4030');
        box(R, 0, 34, 64, 14, '#6a5238'); R(1, 35, 62, 2, '#7e6444');
        R(44, -14, 5, 12, '#2a2420'); R(43, -15, 7, 2, '#3a3430');
        R(4, 2, 34, 18, '#cfc6ae'); R(6, 4, 30, 2, '#e0d8c0'); R(10, 18, 22, 8, '#c4bba2'); R(28, 8, 10, 14, '#bcb398'); for (let i = 0; i < 4; i++) R(8 + i * 8, 6, 1, 12, '#a89e84');
      },
      hdoor(g, e, t, R) { box(R, 2, 1, 12, 14, '#4a3624'); R(4, 3, 8, 10, e.open ? '#08090a' : '#5a4430'); R(10, 8, 2, 2, '#c9a35a'); },
      hatch(g, e, t, R) {   // 2×2 舱口：open 黑洞洞的一架梯子；否则盖着；s.chocks 上面两个空艇座
        R(-1, -1, 34, 34, 'rgba(0,0,0,.25)'); box(R, 0, 0, 32, 32, '#4a3826');
        if (e.open) { R(3, 3, 26, 26, '#050608'); for (let i = 0; i < 5; i++) R(6, 5 + i * 5, 8, 1, '#4a3a2a'); R(5, 3, 1, 26, '#4a3a2a'); R(14, 3, 1, 26, '#4a3a2a'); R(3, 3, 26, 2, 'rgba(255,255,255,.05)'); }
        else { R(3, 3, 26, 26, '#6a5238'); for (let x = 3; x < 29; x += 6) R(x, 3, 1, 26, '#4a3a28'); R(3, 15, 26, 1, '#4a3a28'); }
        if (e.chocks) { R(2, 4, 28, 4, '#3a2a1a'); R(2, 24, 28, 4, '#3a2a1a'); R(4, 5, 24, 2, '#5a4430'); R(4, 25, 24, 2, '#5a4430'); R(0, 13, 3, 1, '#c8b890'); R(29, 18, 3, 1, '#c8b890'); }
      },
      hcover(g, e, t, R) { R(0, 4, 32, 11, '#3a2a1c'); R(1, 5, 30, 9, '#6a5238'); for (let x = 1; x < 31; x += 6) R(x, 5, 1, 9, '#4a3a28'); },
      pump(g, e, t, R) {
        R(3, 12, 10, 3, 'rgba(0,0,0,.3)'); box(R, 4, 2, 8, 12, '#4a3a2a'); R(5, 3, 6, 2, '#5a4a36');
        if (e.broken) { R(-6, 12, 6, 2, '#8a8a8a'); R(13, 13, 8, 2, '#6a4a2a'); R(16, 9, 3, 3, '#3a2a1a'); R(-3, 9, 2, 2, '#9a9a9a'); R(6, -4, 4, 6, '#2a2018'); }
        else { R(7, -4, 2, 6, '#2a2a2a'); R(1, -5, 14, 2, '#3a3a3a'); R(0, -6, 2, 2, '#5a5a5a'); }
      },
      rod(g, e, t, R) { R(-2, 8, 20, 2, '#8a7050'); R(-2, 8, 20, 1, '#a88a62'); for (let i = 0; i < 5; i++) R(i * 4, 8, 1, 2, '#2a2018'); R(-2, 10, 10, 1, 'rgba(120,170,200,.35)'); },
      boom(g, e, t, R0) {   // 主帆横杆 + 一半主帆：z:1 画在最上层；oy 是它甩到哪儿了；s.warn 抖，s.loose 帆布在甩
        const j = e.warn ? (Math.sin(t * 70) > 0 ? 1 : -1) : 0, R = (x, y, w, h, c) => R0(x + j, y, w, h, c);
        R(-8, 15, 104, 3, 'rgba(0,0,0,.28)');
        if (e.loose) { const f = Math.round(Math.sin(t * 9) * 2); R(0, 9, 92, 6 + f, 'rgba(208,200,176,.78)'); R(4, 14 + f, 84, 2, 'rgba(190,182,158,.7)'); }
        R(-10, 5, 6, 6, '#3a2a1a'); R(-6, 6, 102, 4, '#5a4228'); R(-6, 6, 102, 1, '#7a5e3a'); R(94, 5, 3, 6, '#3a2a1a');
        R(0, 2, 88, 5, '#cfc6ae'); for (let i = 0; i < 8; i++) R(4 + i * 11, 2, 1, 5, '#8a7a5a');
        if (!e.loose) { R(40, 9, 1, 8, '#8a7a5a'); R(70, 9, 1, 8, '#8a7a5a'); }
      },
      ahouse(g, e, t, R) {   // 船尾的船长室顶棚，带天窗
        R(-1, 44, 82, 4, 'rgba(0,0,0,.3)');
        box(R, 0, -6, 80, 42, '#5a4a36'); for (let y = -4; y < 34; y += 4) R(1, y, 78, 1, '#4a3e2e');
        box(R, 30, 4, 22, 16, '#3a2e22'); R(32, 6, 18, 12, '#2a3a44'); R(41, 6, 1, 12, '#3a2e22'); R(32, 11, 18, 1, '#3a2e22'); R(33, 7, 4, 2, '#5a6a74');
        box(R, 0, 34, 80, 14, '#6a5238'); R(1, 35, 78, 2, '#7e6444'); for (const x of [50, 64]) { R(x, 38, 6, 5, '#1a2028'); R(x + 1, 39, 2, 1, '#4a5a64'); }
      },
      shipbell(g, e, t, R) { R(7, -10, 2, 6, '#3a2a1a'); R(3, -11, 10, 2, '#4a3420'); R(4, -4, 8, 2, '#c9a35a'); R(3, -2, 10, 7, '#b8923a'); R(2, 5, 12, 2, '#d8b050'); R(5, -1, 2, 5, '#e8c870'); R(7, 7, 2, 2, '#6a4a1a'); R(6, 9, 4, 6, '#5a4430'); },
      lazhatch(g, e, t, R) { box(R, 0, 0, 16, 16, '#4a3826'); R(2, 2, 12, 12, '#050608'); R(4, 4, 5, 1, '#4a3a2a'); R(4, 8, 5, 1, '#4a3a2a'); R(-6, 4, 6, 10, '#6a5238'); R(-6, 4, 6, 1, '#7e6444'); },
      compan(g, e, t, R) { box(R, 1, -2, 14, 16, '#4a3624'); R(3, 0, 10, 4, '#6a5238'); R(3, 5, 10, 8, '#08090a'); R(3, 5, 10, 1, '#2a2018'); },
      binn(g, e, t, R) { box(R, 4, 3, 8, 11, '#7a5e3a'); R(3, 0, 10, 4, '#a8a8a0'); R(4, 1, 8, 2, e.broken ? '#2a3a40' : '#8ab'); if (e.broken) { R(5, 0, 2, 1, '#ddd'); R(9, 2, 2, 1, '#ddd'); R(1, 13, 2, 1, '#cfd8dc'); } },
      wheel(g, e, t, R) {   // 舵轮：s.spin 时轮辐的亮边在转
        R(6, 8, 4, 7, '#3a2a1a'); R(2, -6, 12, 2, '#5a4228'); R(2, 6, 12, 2, '#5a4228'); R(1, -4, 2, 10, '#5a4228'); R(13, -4, 2, 10, '#5a4228');
        R(7, -8, 2, 16, '#4a3420'); R(-1, 0, 18, 2, '#4a3420'); R(7, 0, 2, 2, '#c9a35a');
        const k = e.spin ? Math.floor(t * 3) % 4 : 0; const P = [[7, -8, 2, 3], [14, 0, 3, 2], [7, 6, 2, 3], [-1, 0, 3, 2]][k]; R(P[0], P[1], P[2], P[3], '#8a6e48');
      },
      halyard(g, e, t, R) { const s = Math.round(Math.sin(t * 2) * 2); R(2, 2, 6, 3, '#c8b890'); R(8, 4, 8, 2, '#b8a880'); R(16, 5 + s, 6, 2, '#a89870'); R(22, 6 + s, 3, 3, '#988860'); R(24, 9 + s, 6, 1, 'rgba(200,220,230,.4)'); },
      ladderS(g, e, t, R) { R(3, 0, 10, 2, '#8a7050'); R(4, 2, 1, 16, '#8a7050'); R(11, 2, 1, 16, '#8a7050'); for (let i = 0; i < 4; i++) R(4, 4 + i * 4, 8, 1, '#a08a60'); },
      rboat(g, e, t, R) {   // 神恩号的小艇（在水里，2 格宽）；off 时马灯不亮
        const b = Math.round(Math.sin(t * 2.2) * 1.5);
        R(0, 4 + b, 32, 11, '#2a1e14'); R(2, 5 + b, 28, 9, '#5a4028'); R(4, 7 + b, 24, 5, '#7a5a38'); R(10, 6 + b, 2, 7, '#4a3420'); R(20, 6 + b, 2, 7, '#4a3420');
        R(-6, 9 + b, 8, 1, '#8a7050'); R(30, 10 + b, 8, 1, '#8a7050');
        if (!e.off) { R(26, 3 + b, 3, 4, '#ffd070'); R(26, 2 + b, 3, 1, '#3a3a3a'); }
      },
      railgap(g, e, t, R) { R(1, 0, 14, 16, '#1b3149'); R(1, 0, 14, 2, '#2a4058'); R(0, 0, 1, 16, '#3e3022'); R(15, 0, 1, 16, '#3e3022'); R(1, -11, 14, 3, '#6a5238'); R(1, -9, 14, 1, '#4a3826'); },
      mcfar(g, e, t, R) {   // 远处的玛丽·赛勒斯特号（俯视，6×4 格）；s.lamp 船尾亮起一盏灯
        const b = Math.round(Math.sin(t * 1.3) * 1.5);
        R(6, 30 + b, 84, 6, 'rgba(0,0,0,.25)');
        for (let y = 0; y < 16; y++) { const k = Math.abs(y - 8) / 8, x0 = 4 + Math.round(k * k * 12), x1 = 90; R(x0, 18 + y + b, x1 - x0, 1, y === 0 || y === 15 ? '#1a120c' : '#5a4630'); }
        R(10, 22 + b, 78, 8, '#6e604c'); R(64, 21 + b, 18, 10, '#4a3a2a'); R(16, 21 + b, 12, 9, '#4a3a2a');
        R(-14, 25 + b, 20, 2, '#4a3826');
        R(34, -14 + b, 3, 42, '#2a1e14'); R(62, -10 + b, 3, 38, '#2a1e14');
        for (let i = 0; i < 6; i++) R(22 + i * 5, -10 + b, 3, 4 + (i % 3) * 3, '#b8b4a6');
        R(24, 2 + b, 24, 10, '#b8b4a6'); R(36, 6 + b, 8, 6, '#1b3149');
        R(64, 18 + b, 26, 3, '#a8a496');
        if (e.lamp) { R(86, 22 + b, 3, 3, '#ffe090'); R(85, 21 + b, 5, 1, 'rgba(255,230,140,.4)'); }
      },
      casks(g, e, t, R) {   // 货舱里一垛躺着的酒桶（3×2 格）
        R(0, 30, 48, 3, 'rgba(0,0,0,.35)');
        for (let r = 0; r < 4; r++) { const y = -4 + r * 8, c = r % 2 ? '#6a4a2a' : '#7a5430'; R(0, y, 48, 7, c); R(0, y, 48, 1, shade(c, .2)); R(0, y + 6, 48, 1, shade(c, -.35)); for (const x of [5, 22, 41]) R(x, y, 2, 7, '#3a3a3a'); R(14, y + 2, 4, 3, shade(c, -.25)); R(32, y + 2, 4, 3, shade(c, -.25)); }
        R(1, -6, 46, 2, '#2a1e14');
      },
      redoak(g, e, t, R) {   // 渗漏的红橡木桶（2×2 格）
        R(0, 30, 32, 3, 'rgba(0,0,0,.35)');
        for (let r = 0; r < 4; r++) { const y = -2 + r * 8, c = '#8a4a32'; R(0, y, 32, 7, c); R(0, y, 32, 1, '#a8604a'); for (const x of [4, 26]) R(x, y, 2, 7, '#3a3a3a'); R(12, y + 1, 1, 6, 'rgba(160,210,240,.35)'); }
        const d = (t * 1.4) % 1; R(12, 28 + d * 3, 1, 2, 'rgba(170,220,250,.7)'); R(8, 31, 10, 1, 'rgba(170,220,250,.35)');
      },
      pwell(g, e, t, R) { box(R, 2, 3, 12, 12, '#4a3826'); R(4, 5, 8, 8, '#06080c'); R(5, -10, 2, 15, '#6a6a6a'); R(9, -10, 2, 15, '#6a6a6a'); R(5, 8, 6, 1, 'rgba(120,170,200,.4)'); },
      saltable(g, e, t, R) {   // 船长室的桌子（2 格宽），四边竖着防滑栏架
        R(2, 12, 2, 4, '#3a2618'); R(28, 12, 2, 4, '#3a2618'); box(R, 0, 2, 32, 11, '#6a4a2e'); R(1, 3, 30, 2, '#7e5a3a');
        R(1, 2, 30, 1, '#2a1a10'); R(1, 12, 30, 1, '#2a1a10'); R(1, 2, 1, 11, '#2a1a10'); R(30, 2, 1, 11, '#2a1a10'); R(11, 2, 1, 11, '#3a2618'); R(21, 2, 1, 11, '#3a2618');
      },
      tea(g, e, t, R) {   // 「茶还是热的」——不该在那儿的一桌早饭
        for (const x of [4, 23]) { R(x, 6, 5, 4, '#e8e4dc'); R(x + 1, 6, 3, 1, '#7a4a2a'); R(x + 5, 7, 1, 2, '#e8e4dc'); for (let i = 0; i < 3; i++) { const y = 4 - ((t * 9 + i * 3 + x) % 8); R(x + 1 + (i % 2) * 2 + Math.round(Math.sin(t * 3 + i) * 1), y, 1, 2, 'rgba(240,240,240,.45)'); } }
        R(12, 5, 9, 6, '#e8e4dc'); R(14, 7, 4, 2, '#e8b830'); R(13, 6, 2, 1, '#f4f0e8'); R(20, 9, 1, 3, '#bbb');
      },
      wetprints(g, e, t, R) { const c = 'rgba(120,170,200,.45)'; R(2, 3, 3, 5, c); R(10, 9, 3, 5, c); R(18, 2, 3, 5, c); R(26, 8, 3, 5, c); },
      cot(g, e, t, R) { box(R, 1, -1, 14, 16, '#7a5a3a'); R(2, 1, 12, 12, '#e8e0d0'); R(2, 7, 12, 6, '#c88a8a'); R(2, 7, 12, 1, '#d8a0a0'); R(4, 2, 3, 4, '#d8b0a0'); R(4, 2, 3, 1, '#8a5a3a'); for (let i = 0; i < 5; i++) R(2 + i * 3, -1, 1, 16, '#5a4228'); },
      melodeon(g, e, t, R) { box(R, 0, -8, 16, 22, '#4a2a1a'); R(2, -6, 12, 6, '#d8d0c0'); for (let i = 0; i < 3; i++) R(3, -5 + i * 2, 10, 1, '#8a8478'); R(1, 2, 14, 3, '#e8e4dc'); for (let i = 0; i < 6; i++) R(2 + i * 2, 2, 1, 2, '#111'); R(3, 12, 3, 2, '#2a1a10'); R(10, 12, 3, 2, '#2a1a10'); R(1, 1, 14, 1, 'rgba(255,255,255,.18)'); },
      sewing(g, e, t, R) { box(R, 0, 4, 16, 10, '#5a3a22'); R(2, 13, 2, 3, '#3a2616'); R(12, 13, 2, 3, '#3a2616'); R(3, -1, 9, 6, '#1a1a1a'); R(4, 0, 6, 1, '#c9a35a'); R(9, 3, 1, 3, '#888'); R(2, 6, 7, 3, '#a8b8d8'); R(13, 0, 2, 5, '#6a8a3a'); R(13, -1, 2, 1, '#c9a35a'); },
      capdesk(g, e, t, R) { box(R, 0, 2, 16, 12, '#5a3a22'); R(1, 3, 14, 2, '#6e4a2e'); R(1, 0, 7, 5, '#7a5030'); R(2, 1, 5, 3, '#2a1810'); R(9, 1, 6, 4, '#2a2e30'); R(10, 2, 3, 1, '#bbb'); R(10, 3, 4, 1, '#999'); R(7, 9, 4, 1, '#c9a35a'); },
      mdesk(g, e, t, R) { box(R, 0, 2, 16, 12, '#5d4632'); R(2, 0, 11, 6, '#e8e0cc'); R(7, 0, 1, 6, '#8a7a60'); R(3, 1, 3, 1, '#555'); R(3, 3, 3, 1, '#555'); R(9, 1, 3, 1, '#aaa'); }
    },
    tiles: {
      mdeck: { solid: false, paint(R, X, Y) { TILE.wood.paint(R, X, Y, { woodC: '#74664e' }); if (hash(X, Y, 41) < .12) R(((hash(X, Y, 42) * 10) | 0) + 2, ((hash(X, Y, 43) * 10) | 0) + 2, 4, 2, 'rgba(230,230,220,.12)'); } },
      dgdeck: { solid: false, paint(R, X, Y) { TILE.wood.paint(R, X, Y, { woodC: '#806c4c' }); } },
      bulw: { solid: true, paint(R, X, Y) { R(0, 0, 16, 16, '#2e2418'); R(1, 1, 14, 14, '#5a4632'); R(2, 2, 12, 5, '#76603e'); R(2, 2, 12, 1, '#8e7650'); if ((X + Y) % 2) R(7, 10, 2, 2, '#2a2018'); } },
      bilge: { solid: false, paint(R, X, Y) { R(0, 0, 16, 16, '#241c14'); R(0, 7, 16, 1, '#18120c'); R(0, 15, 16, 1, '#18120c'); R(0, 0, 16, 16, 'rgba(40,74,96,.55)'); for (let i = 0; i < 3; i++) { const h = hash(X, Y, 50 + i); R((h * 12) | 0, ((hash(X, Y, 60 + i) * 14) | 0), 4, 1, 'rgba(150,190,210,.18)'); } } }
    },
    maps: {
      /* ---------------- 神恩号 ---------------- */
      dg: {
        amb: 'wind', dark: .24, plr: 3.6, wall: 'wood', wallC: { face: '#5e4430', trim: '#30221a', top: '#1a140f' },
        legend: { p: 'dgdeck', H: 'bulw' },
        rows: DG,
        ents: [
          { id: 'mh', x: 23, y: 5, spr: '@morehouse', dir: 2, on: S => mhTalk(S) },
          { id: 'deveau_g', x: 17, y: 7, spr: '@deveau', dir: 1, on: S => dvTalkG(S) },
          { id: 'wright_g', x: 12, y: 8, spr: '@wright', dir: 2, on: S => wrTalkG(S) },
          { id: 'helmsman', x: 10, y: 4, spr: '@helm', dir: 2, on: S => helmTalk(S) },
          { id: 'dgwheel', x: 10, y: 3, spr: 'wheel', on: S => S.narr(S.f.act === 'night' || S.f.act === 'dq' ? '舵轮绑死了。今晚我们就在这儿陪着那条船，谁也不走。' : '神恩号的舵轮，被几代人的手磨得发亮。\n舵手说，他先看见那条船的时候，还以为是谁在开玩笑。') },
          { id: 'dgmast1', x: 13, y: 6, spr: 'mast', s: { furl: true }, on: S => S.narr('前桅。帆鼓得满满的，缆绳在风里嗡嗡响。') },
          { id: 'dgmast2', x: 19, y: 5, spr: 'mast', s: { furl: true }, on: S => S.narr('主桅。桅顶上的风向旗，一直指着那条船的方向。') },
          { id: 'pet1', x: 15, y: 2, spr: 'barrel', on: S => S.narr('一桶桶石油，封得死死的。这一趟要是顺，到了直布罗陀能卖个好价钱。') },
          { id: 'pet2', x: 16, y: 2, spr: 'barrel', on: S => S.narr('石油桶上烙着纽约货栈的记号。一股刺鼻的味儿——在船上待久了，就闻不出来了。') },
          { id: 'pet3', x: 17, y: 2, spr: 'barrel', on: S => S.narr('桶盖上压着一卷备用缆绳。') },
          { id: 'pet4', x: 16, y: 8, spr: 'barrel', on: S => S.narr('这只桶有点渗，木头上一圈油印子。大副骂过两回了。') },
          { id: 'dgbell', x: 21, y: 4, spr: 'shipbell', on: async S => { bell(S, 2); await S.narr('你拽了一下船钟的绳子。\n当——当。两响。\n那条船那边，什么回音也没有。'); } },
          { id: 'dglant', x: 12, y: 3, spr: 'lantern', off: true, light: { r: 3.6, col: 'rgba(255,190,100,.16)' }, on: S => S.narr(S.ent('dglant').off ? '一盏马灯挂在索具上，还没点。' : '马灯点上了。火苗被风压得一跳一跳的。') },
          { id: 'dgboat', x: 14, y: 11, w: 2, spr: 'rboat', off: true, on: S => boatOn(S) },
          { id: 'mcfar', x: 30, y: 3, w: 6, h: 4, spr: 'mcfar', solid: false },
          /* 船长室 */
          { id: 'dgtable', x: 4, y: 5, w: 2, spr: 'table', col: '#5a3e26', on: S => S.narr(S.f.act === 'dq' || S.f.act === 'post' ? '海图桌上摊着德沃的勘验本，旁边一杯咖啡早就凉了。' : '海图桌。铅笔在海图上画了一道线：纽约——直布罗陀。线的旁边，船长用小字添了一个叉。') },
          { id: 'dglamp', x: 7, y: 4, spr: 'lamp', light: { r: 3.4, col: 'rgba(255,200,110,.18)', flick: true }, on: S => S.narr('船长室的油灯。灯罩擦得很亮。') },
          { id: 'porth', x: 5, y: 3, spr: 'window', on: S => S.narr(S.ent('porth').lit ? '舷窗外，那条黑着的船上……亮着一盏灯。\n你盯着看了很久。灯不动，也不灭。' : (S.f.act === 'dq' || S.f.act === 'night' ? '舷窗外黑沉沉的。那条船就在不远处，一盏灯也没有。' : '舷窗外是灰色的海。')) },
          { id: 'dgbunk', x: 3, y: 6, h: 2, spr: 'bed', col: '#3a4a5a', on: S => S.narr('船长的铺。毯子叠成一块豆腐干。') },
          { id: 'dgchest', x: 7, y: 7, spr: 'box', on: S => S.narr('船长的箱子，上面放着一本《圣经》和一本潮汐表。') },
          { id: 'dgwet', x: 7, y: 5, spr: 'wetprints', decal: true, solid: false, hidden: true }
        ],
        async enter(S, first) { await dgEnter(S, first); }
      },
      /* ---------------- 玛丽·赛勒斯特号：甲板 ---------------- */
      deck: {
        amb: 'wind', dark: .3, plr: 3.8, wall: 'wood',
        legend: { p: 'mdeck', H: 'bulw' },
        rows: DECK,
        ents: [
          { id: 'bowsprit', x: 0, y: 6, spr: 'bowsprit', solid: false },
          { id: 'bowcut', x: 1, y: 6, spr: 'bowmark', on: S => bowOn(S) },
          { id: 'fhouse', x: 5, y: 5, w: 4, h: 3, spr: 'fhouse', on: S => S.narr('前甲板室：前半间是厨房，后半间是水手舱。\n房顶上散着一面主支索帆，没捆，像是从哪儿扯下来随手扔的。') },
          { id: 'galley', x: 8, y: 6, spr: 'hdoor', z: 1, on: S => galleyOn(S) },
          { id: 'fcsle', x: 6, y: 7, spr: 'hdoor', z: 1, on: S => fcsleOn(S) },
          { id: 'casks', x: 10, y: 3, w: 2, spr: 'casks', on: S => S.narr('甲板上捆着的淡水桶，满的。\n你敲了敲，声音发闷——够十个人喝上半年。') },
          { id: 'foremast', x: 11, y: 6, spr: 'mast', s: { torn: true }, on: S => S.narr('前桅。前帆和上桅帆都没了，只剩几条布条在抽。\n下桅帆还张着，被风撕开了一半。') },
          { id: 'fhatch', x: 13, y: 5, w: 2, h: 2, spr: 'hatch', open: true, on: S => fhatchOn(S) },
          { id: 'hcover', x: 13, y: 8, w: 2, spr: 'hcover', decal: true, solid: false, on: S => hcoverOn(S) },
          { id: 'mhatch', x: 17, y: 5, w: 2, h: 2, spr: 'hatch', s: { chocks: true }, on: S => boatSeat(S) },
          { id: 'railgap', x: 18, y: 11, spr: 'railgap', decal: true, on: S => railOn(S) },
          { id: 'pumpA', x: 20, y: 4, spr: 'pump', on: S => S.narr('一台水泵，好好的。你压了两下，「咕噜」一声，抽上来的是清亮的海水。') },
          { id: 'pumpB', x: 20, y: 8, spr: 'pump', s: { broken: true }, on: S => pumpBOn(S) },
          { id: 'rod', x: 19, y: 9, spr: 'rod', decal: true, solid: false, on: S => rodOn(S) },
          { id: 'mainmast', x: 21, y: 6, spr: 'mast', s: { furl: true }, on: S => S.narr(S.f.act === 'squall' ? '主桅在风里呻吟。' : '主桅。主帆收着，捆得结结实实；帆的横杆用绳子绑在船尾顶棚上。\n收帆的人很仔细。') },
          { id: 'boom', x: 22, y: 2, w: 6, spr: 'boom', solid: false, z: 1, oy: OYM, s: { warn: false, loose: false } },
          { id: 'ahouse', x: 24, y: 5, w: 5, h: 3, spr: 'ahouse', on: S => S.narr('船尾的船长室。天窗上盖着帆布，压着两块木板。') },
          { id: 'compan', x: 24, y: 6, spr: 'compan', z: 1, on: S => companOn(S) },
          { id: 'binn', x: 30, y: 5, spr: 'binn', s: { broken: true }, on: S => S.narr('罗经柜被撞歪了，玻璃罩碎了。\n罗盘的指针还在抖，可它指的方向，已经没人看了。') },
          { id: 'wheel', x: 30, y: 6, spr: 'wheel', s: { spin: false }, on: S => wheelOn(S) },
          { id: 'ghost_d', x: 30, y: 7, spr: '@oilskin', solid: false, hidden: true, dir: 3 },
          { id: 'lazh', x: 30, y: 9, spr: 'lazhatch', on: S => S.narr('后舱口——存放杂物的小舱——也开着，盖板翻在一边。\n底下是成卷的绳子、备用的帆布、几桶腌肉。') },
          { id: 'halyard', x: 31, y: 8, spr: 'halyard', on: S => halyardOn(S) },
          { id: 'ladder', x: 29, y: 11, spr: 'ladderS', on: S => ladderOn(S) },
          { id: 'dgboat_d', x: 28, y: 12, w: 2, spr: 'rboat', off: true, light: { r: 3.4, col: 'rgba(255,200,110,.22)' }, on: S => S.narr('神恩号的小艇，拴在绳梯底下，在浪里一起一伏。') },
          { id: 'deveau_d', x: 28, y: 9, spr: '@deveau', dir: 3, on: S => dvTalkD(S) },
          { id: 'wright_d', x: 27, y: 10, spr: '@wright', dir: 3, on: S => S.say('赖特', '……这船上安静得我耳朵疼。') },
          { id: 'rainfx', x: 11, y: 6, spr: 'rainfx', solid: false, z: 2, hidden: true }
        ],
        async enter(S, first) { await deckEnter(S, first); },
        step(S, x, y) {
          if (S.f.act === 'squall' && x === 29 && y === 10) return reachLadder(S);
        }
      },
      /* ---------------- 船长室 / 大副舱 ---------------- */
      cabin: {
        amb: 'drone', dark: .58, plr: 3.2, wall: 'wood', wallC: { face: '#4e3a28', trim: '#2a1e14', top: '#140f0a' }, floor: 'darkwood',
        rows: [
          '####################',
          '####################',
          '#WWWWWWW#WWWWW#WWWW#',
          '#WWWWWWW#WWWWW#WWWW#',
          '#WWWWWWWWWWWWWWWWWW#',
          '#WWWWWWW#WWWWW#WWWW#',
          '#WWWWWWW#WWWWW#WWWW#',
          '#WWWWWWW#WWWWW#WWWW#',
          '####################'],
        ents: [
          { id: 'skyl', x: 4, y: 1, spr: 'window', light: { r: 4, col: 'rgba(190,200,210,.12)', dy: 30 }, on: S => S.narr('头顶的天窗盖着帆布，只从缝里漏下一点灰白的光。') },
          { id: 'cbed', x: 1, y: 2, h: 2, spr: 'bed', col: '#5a6a7a', on: S => bedOn(S) },
          { id: 'cot', x: 3, y: 2, spr: 'cot', on: S => S.narr('床边靠墙，一张围着栏杆的小床。被子叠得方方正正，枕头边上放着一个布娃娃。\n你看了一会儿，没有碰它。') },
          { id: 'melo', x: 7, y: 2, spr: 'melodeon', on: S => meloOn(S) },
          { id: 'cwar', x: 1, y: 6, spr: 'wardrobe', col: '#4a3020', on: S => S.narr('衣柜里挂着几条女式长裙，底下一双女式套鞋。\n一件孩子的小外套，袖口磨得发亮。') },
          { id: 'cdesk', x: 4, y: 7, spr: 'capdesk', on: S => deskOn(S) },
          { id: 'sew', x: 6, y: 7, spr: 'sewing', on: S => sewOn(S) },
          { id: 'table', x: 10, y: 3, w: 2, spr: 'saltable', on: S => tableOn(S) },
          { id: 'tea', x: 10, y: 3, w: 2, spr: 'tea', z: 1, solid: false, hidden: true },
          { id: 'chair1', x: 9, y: 3, spr: 'chair', col: '#4a3020', on: S => S.narr('椅子推得整整齐齐，像是吃完饭有人收拾过。') },
          { id: 'chair2', x: 12, y: 3, spr: 'chair', col: '#4a3020', on: S => S.narr(S.f.act === 'alone' ? '……' : '这把椅子比别的旧，椅面上有一圈水渍。') },
          { id: 'ghost_c', x: 12, y: 3, spr: '@oilskin', z: 1, oy: -3, solid: false, hidden: true, dir: 1 },
          { id: 'wetfp', x: 9, y: 5, w: 2, spr: 'wetprints', decal: true, solid: false, hidden: true },
          { id: 'clamp', x: 13, y: 2, spr: 'lamp', off: true, on: S => S.narr('挂灯里的油还剩一半，灯罩上一圈烟熏。灯芯是剪过的——有人打算今晚还点它。') },
          { id: 'stairs', x: 11, y: 7, spr: 'stairsup', solid: false, async touch(S) { if (S.f.act === 'alone') return; await S.go('deck', 23, 6, 1); } },
          { id: 'wright_c', x: 13, y: 6, spr: '@wright', hidden: true, dir: 1, on: S => wrTalkC(S) },
          { id: 'port', x: 16, y: 1, spr: 'window', on: S => S.narr('舷窗外，灰色的海一起一伏。远处是神恩号的帆，小得像一片指甲。') },
          { id: 'mbunk', x: 18, y: 2, h: 2, spr: 'bed', col: '#6a5a44', on: S => S.narr('大副的铺。被子掀开着，像是半夜被人叫起来的。') },
          { id: 'mdesk', x: 15, y: 7, spr: 'mdesk', on: S => mdeskOn(S) },
          { id: 'mchest', x: 18, y: 7, spr: 'box', on: S => S.narr('大副的箱子，锁着。箱盖上刻着三个字母：A.G.R.\n你用袖子擦掉了上面的盐霜。') }
        ],
        async enter(S, first) { await cabinEnter(S, first); },
        step(S, x, y) { cabinStep(S, x, y); }
      },
      /* ---------------- 货舱 ---------------- */
      hold: {
        amb: 'drone', dark: .93, plr: 2.5, wall: 'wood', wallC: { face: '#3a2a1c', trim: '#1e150e', top: '#0c0906' }, speed: .72,
        legend: { v: 'bilge' },
        rows: [
          '######################',
          '######################',
          '#vvvvvvvvvvvvvvvvvvvv#',
          '#vvvvvvvvvvvvvvvvvvvv#',
          '#vvvvvvvvvvvvvvvvvvvv#',
          '#vvvvvvvvvvvvvvvvvvvv#',
          '#vvvvvvvvvvvvvvvvvvvv#',
          '#vvvvvvvvvvvvvvvvvvvv#',
          '#vvvvvvvvvvvvvvvvvvvv#',
          '######################'],
        ents: [
          { id: 'ladder_h', x: 2, y: 2, spr: 'stairsup', solid: false, light: { r: 3.6, col: 'rgba(200,210,220,.14)', dy: 0 }, async touch(S) { await holdLadder(S); } },
          { id: 'stackA', x: 4, y: 2, w: 3, h: 2, spr: 'casks', on: S => S.narr('酒桶码得整整齐齐，一层压一层，用木楔子卡死了。\n每只桶上都烙着字：MEISSNER ACKERMAN & CO.') },
          { id: 'stackB', x: 4, y: 6, w: 3, h: 2, spr: 'casks', on: S => S.narr('你数了一排，又估了估整个舱——一千七百零一桶，货单上的数。\n封口都好好的，没人撬过。') },
          { id: 'stackC', x: 9, y: 2, w: 3, h: 2, spr: 'casks', on: S => S.narr('桶上的铁箍有点锈，摸上去冰凉。\n这一船酒精到了热那亚，是要拿去兑葡萄酒的。') },
          { id: 'stackD', x: 9, y: 6, w: 3, h: 2, spr: 'casks', on: S => S.narr('桶缝里渗出来的酒浮在积水上，泛着一层油花似的光。') },
          { id: 'stackE', x: 14, y: 2, w: 3, h: 2, spr: 'casks', on: S => S.narr(S.f._hg ? '刚才那个人影站的地方，只有一垛酒桶。\n水面上一圈一圈的涟漪，还没散。' : '这一垛后面黑洞洞的，提灯的光照不进去。') },
          { id: 'stackF', x: 14, y: 6, w: 3, h: 2, spr: 'casks', on: S => S.narr('最底下一层桶泡在水里。木头吸饱了水，颜色发黑。') },
          { id: 'pwell', x: 11, y: 4, spr: 'pwell', on: S => pwellOn(S) },
          { id: 'redoak', x: 18, y: 6, w: 2, h: 2, spr: 'redoak', on: S => redoakOn(S) },
          { id: 'hlamp', x: 20, y: 3, spr: 'lantern', light: { r: 2.6, col: 'rgba(255,190,90,.2)', flick: true }, on: S => S.narr(S.ent('hlamp').off ? '一盏挂在梁上的马灯。灯是凉的，灯罩上全是盐霜。\n……可你刚进来的时候，明明看见它亮着。' : '一盏挂在梁上的马灯，还亮着。\n谁点的？') },
          { id: 'hrope', x: 1, y: 8, spr: 'rope', on: S => S.narr('一卷泡在水里的缆绳，霉得发黑。') },
          { id: 'ghost_h', x: 16, y: 4, spr: '@oilskin', solid: false, hidden: true, dir: 1 }
        ],
        async enter(S, first) {
          if (first) {
            await S.narr('你顺着梯子下到舱底。\n冰凉的水一下子没过了小腿。黑暗里，一排排酒桶码到舱顶。\n酒味冲得人直流眼泪。');
            S.goal('在货舱里看看：积水、货、那股味儿');
          }
        },
        step(S, x, y) { return holdStep(S, x, y); }
      }
    }
  });

  /* ================= 神恩号 ================= */
  async function dgEnter(S, first) {
    const a = S.f.act;
    if (first && !a) {
      S.f.act = 'dg1';
      await S.narr('风从西边来，不算大。神恩号的帆吃饱了风，船身微微地斜着。\n船头那边，船长举着单筒望远镜，一动不动。');
      S.goal('去船头找莫尔豪斯船长');
      return;
    }
    if (a === 'night' && S.once('dgNight')) {
      await S.narr('甲板上点起了马灯。浪小了，风还在呜呜地刮。\n大伙儿都不说话，时不时往下风那边看一眼——那条船黑着，一起一伏。');
      await S.say('赖特', '船长叫你。在船长室，德沃也在。');
      S.goal('去船长室（船尾那扇门）见莫尔豪斯船长');
      S.cp();
    }
  }
  function dgNightStage(S) {
    S.place('mh', 4, 4, 0); S.place('deveau_g', 6, 6, 1); S.place('wright_g', 14, 8, 3); S.place('helmsman', 10, 4, 3);
    S.ent('dglant').off = false; S.dark(.84, 'dg'); S.plr(3);
  }
  async function mhTalk(S) {
    const a = S.f.act;
    S.face('mh', 'pl');
    if (a === 'dg1') {
      await S.say('莫尔豪斯船长', '你来得正好。年轻人眼神好，你来看。');
      await S.narr('他把单筒望远镜塞到你手里。');
      S.focus(33, 5); S.sfx('blip'); await S.wait(500);
      await S.narr(['镜筒里，一条双桅船在浪里一起一伏。', '前桅的帆破了，几条布条在抽；下桅帆还张着一半。船头一会儿偏左，一会儿偏右，像个喝醉了的人。', '舵轮边上，没有人。甲板上，没有人。\n船尾的字被浪打得发白：MARY CELESTE。']);
      S.focus(null);
      await S.say('莫尔豪斯船长', ['玛丽·赛勒斯特号。纽约港的船期表上有她——十一月初开往热那亚，比我们早走一个多礼拜。', '我们跟了她好一阵子。喊话、打旗，没人应。']);
      await S.say('莫尔豪斯船长', ['德沃，带上赖特，再带上这小子，划过去看看。', '记住：什么都别乱动，看仔细，记下来。要是船上真没人，这条船怎么处置，将来是要在法庭上说清楚的。']);
      await S.say('德沃', '是，船长。');
      S.f.act = 'dg2'; S.goal('上小艇（右舷中间的缺口）');
      return;
    }
    if (a === 'dg2') return S.say('莫尔豪斯船长', '去吧。天黑以前回来。');
    if (a === 'night' || a === 'dq') return deduction(S);
    if (a === 'post') return S.say('莫尔豪斯船长', '睡吧。明天还有明天的事。');
    await S.say('莫尔豪斯船长', '……');
  }
  async function dvTalkG(S) {
    S.face('deveau_g', 'pl');
    const a = S.f.act;
    if (a === 'dg1') return S.say('德沃', '船长在船头。他看那条船看了快半个钟头了。');
    if (a === 'dg2') return S.say('德沃', '走吧。上了那条船，眼睛放亮，嘴巴闭紧。');
    if (a === 'night' || a === 'dq') return S.say('德沃', S.f.act === 'dq' ? '勘验本在你那儿，「笺」里能翻到。一条一条来。' : '进去吧，船长等着呢。');
    await S.say('德沃', '……');
  }
  async function wrTalkG(S) {
    S.face('wright_g', 'pl');
    const L = S.f.act === 'night' || S.f.act === 'dq' ? ['今天是我这辈子最长的一天。', '你说……那十个人，现在在哪儿？'] : ['划过去二十分钟。我们轮流划。', '要是船上有死人，你别吐在甲板上，丢神恩号的脸。'];
    await S.say('赖特', L[(S.f._wg = ((S.f._wg ?? -1) + 1) % L.length)]);
  }
  async function helmTalk(S) {
    S.face('helmsman', 'pl');
    const L = S.f.act === 'night' || S.f.act === 'dq' ? ['今晚我不敢往那边看。', '老辈人说，空船是不吉利的。……我就随口一说。'] : ['我先看见的她。帆张得乱七八糟，船头一会儿左一会儿右——没人掌舵的船才这样走。', '船长说别瞎猜。可我在海上十五年，没见过这种事。'];
    await S.say('舵手', L[(S.f._hm = ((S.f._hm ?? -1) + 1) % L.length)]);
  }
  async function boatOn(S) {
    const a = S.f.act;
    if (a === 'dg1') return S.think('小艇得等船长发话。他还在船头。');
    if (a !== 'dg2') return S.narr('小艇收在舷边，桨横在座板上。');
    S.sfx('splash');
    await S.fade(1, 700);
    await S.card('', '', '德沃、赖特和你，三个人把小艇放下水。\n浪不小，我们轮流划了二十来分钟。\n\n离得越近，那条船越安静。');
    await S.go('deck', 29, 10, 3, { ms: 500 });
  }

  /* ================= 玛丽·赛勒斯特号：甲板 ================= */
  async function deckEnter(S, first) {
    const a = S.f.act;
    if (a === 'inv') { S.hide('tea'); S.hide('wetfp'); }
    if (!first || a !== 'dg2') return;
    await S.narr('你们攀着船尾的绳梯翻上甲板。\n甲板湿漉漉的。没有血，没有打斗的痕迹，没有人。\n只有风在索具里呜呜地响。');
    S.face('deveau_d', 1);
    await S.say('德沃', '有人吗——！', { style: 'big' });
    await S.wait(900); creak(S, .7); await S.wait(600);
    await S.say('赖特', '……连只老鼠都没有。');
    S.face('deveau_d', 'pl');
    await S.say('德沃', ['好。按规矩来：从船头到船尾查一遍，看见什么都记进勘验本，编上号。', '赖特，你下船长室。小子，上面归你——船头、前甲板室、主舱口的小艇座、主桅边的水泵、船尾。查完上面，再去船长室看看。', '前舱口开着，底下一股冲鼻的味儿。先别下去，等它散一散。']);
    const dv = S.ent('deveau_d'), wr = S.ent('wright_d'); dv.solid = false; wr.solid = false;
    await Promise.all([S.walk('deveau_d', [16, 3], 4), (async () => { await S.walk('wright_d', [23, 6], 4); S.hide('wright_d'); S.show('wright_c'); })()]);
    dv.solid = true; S.face('deveau_d', 0);
    S.f.act = 'inv'; S.f.ev = {};
    goalUpd(S);
    if (S.coop) S.toast('两个人：一人看着右上角的「还没查完」，一人去跑');
    S.cp();
  }
  async function dvTalkD(S) {
    S.face('deveau_d', 'pl');
    if (S.f.act !== 'inv') return S.say('德沃', '……');
    if (top9(S) && !has(S, 7)) return S.say('德沃', ['上面查完了？好。舱底的味儿散得差不多了。', '前舱口有梯子。下去看看货，看看水有多深——提灯离那些桶远一点。']);
    if (has(S, 7)) return S.say('德沃', '都记下了？那就回船——天色不对。');
    const rem = remAreas(S);
    const L = [`还有${rem.join('、')}没看。`, '一条船，十个人。没有一具尸首，没有一滴血。……这比看见血还让人心里发毛。', '别乱动东西。将来要是上了法庭，我们说的每一句话都得对得上。', '你看那帆——有的张着，有的收着，有的吹没了。像是收到一半，人就不管了。'];
    await S.say('德沃', L[(S.f._dv = ((S.f._dv ?? -1) + 1) % L.length)]);
    if (S.f._dv !== 0) await S.say('德沃', `（还有：${rem.join('、')}）`);
  }
  async function bowOn(S) {
    if (S.f.act === 'squall') return;
    if (has(S, 3)) return S.narr('那两道口子还在。浪一打上来，就看不见了。');
    await S.narr('你扒着船头的舷墙往下看。\n吃水线上面一点，船板上有两道长长的口子，一边一道——又齐又深，像是被什么刮过。');
    ev(S, 3);
    await S.think('海怪的爪子？撞上了什么东西？……还是被人砍的？\n先别下结论。记下来。');
  }
  async function galleyOn(S) {
    if (S.f.act === 'squall') return;
    await S.narr('厨房。炉子从座子上歪了出来，炉膛是冷的。\n锅碗瓢盆都洗过了，收得整整齐齐——没有做到一半的饭。');
    await S.narr('地上积着水，没过脚踝。像是有一阵浪，从门口灌了进来。');
    if (S.once('galleyThink')) await S.think('……没有吃了一半的早饭。没有炉子上的锅。');
  }
  async function fcsleOn(S) {
    if (S.f.act === 'squall') return;
    if (has(S, 6)) return S.narr('水手舱里，四个人的东西都在原处。像是他们只是上甲板换个班。');
    await S.narr('前甲板室的后半间是水手舱。四张铺位，被褥卷在一边。\n箱子都没锁：换洗衣服、针线包、油布靴……床头还插着两杆烟斗，烟丝是干的。');
    ev(S, 6);
    await S.think('水手出门不带烟斗、不穿油布靴？\n那得是多急的事。');
  }
  async function fhatchOn(S) {
    const a = S.f.act, h = S.ent('fhatch');
    if (a === 'squall') {
      if (!h.open) return;
      h.open = false; S.hide('hcover'); S.sfx('close'); S.shake(160, 1.5);
      S.toast('前舱口盖上了！——去船尾，小心横杆');
      S.goal('等横杆甩过去，冲过主桅后面 → 船尾右舷的绳梯' + (S.coop ? '（一人盯着横杆喊「走」）' : ''));
      return;
    }
    if (a !== 'inv') return S.narr('前舱口。');
    if (!top9(S)) {
      await S.narr('前舱口的盖板被掀开，扔在一边。一股冲鼻的酒味从底下涌上来，熏得眼睛发酸。');
      return S.think(`德沃说先把上面查完，等味儿散一散。\n还没查完：${remAreas(S).join('、')}。`);
    }
    await S.narr('酒味淡了一点。你提着马灯，踩上了往下的梯子。');
    await S.go('hold', 2, 3, 0);
  }
  async function hcoverOn(S) {
    if (S.f.act === 'squall') return fhatchOn(S);
    await S.narr('前舱口的盖板，翻倒在甲板上。\n你蹲下来看了看：木头上没有一点烧过的痕迹，也没裂。是被人整块掀开、放在这儿的。');
  }
  async function boatSeat(S) {
    if (S.f.act === 'squall') return;
    await S.narr('主舱口的盖板钉得好好的。上面有两个空着的艇座——平时救生小艇就倒扣在这儿，用绳子捆着。\n现在艇座是空的。捆艇的绳子不见了，不像是被扯断的。');
    if (ev(S, 2)) await S.think('小艇是被解开的。……去右舷看看，从哪儿放下去的？');
  }
  async function railOn(S) {
    if (S.f.act === 'squall') return;
    await S.narr('右舷的舷墙，有一段被拆了下来，靠在一边——放小艇的时候才会这么干。');
    const n = ev(S, 2);
    await S.think(n ? '这条小艇不是被浪卷走的。是有人把它放下去的。' : '跟主舱口那两个空艇座对上了：小艇是从这儿放下去的。');
  }
  async function pumpBOn(S) {
    if (S.f.act === 'squall') return;
    await S.narr('另一台水泵被拆开了。泵杆、皮碗、螺栓摆了一地，像是修到一半，人就走了。');
    if (ev(S, 8)) await S.think('修泵修到一半……他们是觉得船在进水？');
  }
  async function rodOn(S) {
    if (S.f.act === 'squall') return;
    await S.narr('一根测深杆，就扔在泵边上，杆上的水印还没干：三尺半。\n测深杆是放进泵井里量舱底积水用的。有人量过，然后把它一扔，再也没捡起来。');
    if (ev(S, 4)) await S.think('三尺半……多不多？下到舱底就知道了。');
  }
  async function companOn(S) {
    if (S.f.act === 'squall') { S.sfx('locked'); return S.toast('没时间了！去船尾！'); }
    S.sfx('open'); await S.go('cabin', 11, 6, 3);
  }
  async function wheelOn(S) {
    if (S.f.act === 'squall') return;
    await S.narr('舵轮没人管，跟着舵一下一下地自己转。\n你伸手按住它——掌心里一阵发麻。木头是温的，像有人刚刚还握着。');
    if (S.once('wheelThink')) await S.think('……是太阳晒的。\n今天没有太阳。');
  }
  async function halyardOn(S) {
    if (S.f.act === 'squall') return;
    if (has(S, 5)) return S.narr(S.has('ropeend') ? '断缆还拖在水里，短了一截——那一截在你衣袋里。' : '断了的缆绳还拖在水里，一下一下地拽。');
    await S.narr('船尾的舷墙外，垂着一根一指多粗的缆绳，另一头泡在水里，随着浪一下一下地拽。\n你把它拉上来——好长一截。末端是磨断的，绳股散开，像一把湿刷子。');
    ev(S, 5);
    await S.think('这么粗的绳子，拴在船尾，拖在海里……\n是拴什么用的？');
    const r = await S.ask('把磨断的那一截割下来，揣着？', ['割下来揣好', '别动它']);
    if (r === 0) { S.give('ropeend'); await S.narr('你用水手刀割下一拃长的绳头，揣进了怀里。\n它湿漉漉的，凉得像一条死鱼。'); }
  }
  async function ladderOn(S) {
    if (S.f.act === 'squall') return reachLadder(S);
    if (S.f.act === 'inv') return S.narr(has(S, 7) ? '绳梯底下是神恩号的小艇。……德沃说再四处看看就走。' : '船尾的绳梯，我们的小艇拴在下面。\n还没查完，不能走。');
  }

  /* ================= 船长室 ================= */
  const cabN = S => [0, 1, 9].filter(d => has(S, d)).length;
  async function cabinEnter(S, first) {
    if (S.f.act !== 'inv') return;
    if (first) {
      await S.narr('船长室比外面暗。天窗盖着帆布，地板湿漉漉的，一股潮气和霉味。\n左边是船长住的那间，右边是大副的小舱。');
      S.face('wright_c', 'pl');
      await S.say('赖特', ['我翻过一遍了，你自己再看看。', '……这屋里有女人和孩子的东西。我不太敢看。']);
    }
  }
  function cabinStep(S, x, y) {
    if (S.f.act !== 'inv') return;
    if (cabN(S) >= 2 && x >= 9 && x <= 13 && S.once('teaApp')) { S.show('tea'); S.show('wetfp'); clink(S); S.bubble('pl', '?', 1400); }
    if (x >= 15 && has(S, 9) && S.once('meloPlay')) { reed(S, [392, 440, 494, 392], .42, .045); S.bubble('melo', '…', 1800); S.toast('隔壁……有琴声？'); S.f._mp = true; }
  }
  async function bedOn(S) {
    if (has(S, 1)) return S.narr('那把剑放回了床底下。褐色的斑，你越看越像锈。');
    await S.narr('船长的床。被褥是潮的。\n你蹲下去往床底下看——一把带鞘的佩剑。抽出来，刃上有几块褐色的斑。');
    ev(S, 1);
    await S.think('血？……还是锈？\n剑鞘是干的，剑是插好了放回去的。');
    if (!S.ent('wright_c').hidden) await S.say('赖特', '那大概是船长的纪念品吧。我在别的船上也见过，挂着好看的。');
  }
  async function meloOn(S) {
    if (S.f._mp) await S.narr('一架小风琴，琴盖开着。琴键上落着一层盐霜——\n有几个键是干净的。像是刚有人按过。');
    else await S.narr('一架小风琴（簧风琴），摆在船长床的对面。谱架上夹着几页赞美诗。\n琴键上落着一层盐霜。');
    const r = await S.ask('按一个键？', ['按一下', '算了']);
    if (r === 0) { reed(S, [330], .9, .06); await S.narr('「呜——」\n一个音，在这间没人的屋里响了很久。'); }
  }
  async function deskOn(S) {
    if (has(S, 0)) { await S.narr('船长的桌子。空的天文钟盒子，和那块记事石板。'); return S.note('slate'); }
    await S.narr('船长的桌子。抽屉都拉开着。\n天文钟的木盒子还在，盖子开着——空的。六分仪不见了。船舶登记证、货单、航海书，统统不见了。');
    await S.narr('只有一块记事石板，压在墨水瓶底下。');
    await S.note('slate');
    ev(S, 0);
    await S.think('把天文钟和船舶文件带走……\n这是一个打算活下去、打算靠岸的人，才会做的事。');
  }
  async function sewOn(S) {
    if (has(S, 9)) return S.narr('油瓶还直直地立在缝纫机旁边。');
    await S.narr('一台缝纫机，盖子开着，针底下还压着一块没缝完的蓝布。\n旁边一小瓶缝纫机油，直直地立着——一滴都没洒。');
    ev(S, 9);
    await S.think('这条船要是翻江倒海地晃过，这瓶油早就倒了。');
  }
  async function tableOn(S) {
    const tea = S.ent('tea');
    if (S.f.act === 'alone') return;
    if (!tea.hidden) {
      S.sfx('sting'); S.f.teaSeen = true;
      await S.narr('桌上摆着两只茶杯，冒着热气。\n一盘煎蛋吃了一半，叉子还搁在盘子边上……');
      S.hide('tea'); S.hide('wetfp');
      S.face('wright_c', 'pl'); S.bubble('wright_c', '?', 1000);
      await S.say('赖特', '你看什么呢？桌上什么都没有。');
      await S.narr('你再看——防滑栏架里空空的。\n只有桌面上一圈淡淡的水印，像是刚刚有人放过一只杯子。');
      return S.think('……别想了。茶是热的，那是杂志上才有的事。\n（可那是十二年以后的杂志。）');
    }
    await S.narr('一张钉在地板上的桌子，四边的防滑栏架都竖起来了——那是风浪大的时候才用的。\n桌上什么都没有。没有饭，没有茶。');
  }
  async function mdeskOn(S) {
    await S.narr('大副的桌上摊着航海日志。最后一条写在11月24日：位置、风向、航速，一切如常。\n后面的纸，是空的。');
    if (S.once('logSlate')) await S.note('slate');
  }
  async function wrTalkC(S) {
    S.face('wright_c', 'pl');
    if (S.f.teaSeen && S.once('wrTea')) return S.say('赖特', ['……你刚才盯着那张桌子看什么？', '你脸色白得跟帆布似的。']);
    const L = ['床底下、桌子、那台缝纫机——船长家的东西都在这间。', '大副舱就一张铺、一张桌。日志在桌上。', '桌上什么都没有。没饭，没茶。……外头的人要是问起来，你可得这么说。'];
    await S.say('赖特', L[(S.f._wc = ((S.f._wc ?? -1) + 1) % L.length)]);
  }

  /* ================= 货舱 ================= */
  function holdStep(S, x, y) {
    if (x >= 9 && S.once('hg1')) { S.show('ghost_h'); S.ent('ghost_h').alpha = .5; S.sfx('heart'); S.bubble('pl', '!', 900); }
    if (x >= 13 && !S.ent('ghost_h').hidden && S.once('hg2')) {
      return (async () => {
        S.f._hg = true; S.sfx('sting'); S.ent('hlamp').off = true;
        await S.alpha('ghost_h', 0, 500);
        await S.think('……刚才那儿站着一个人。穿着黄色的油布雨衣。\n我们三个人里，没有人穿黄雨衣。');
      })();
    }
  }
  async function pwellOn(S) {
    await S.narr('泵井——两台水泵的吸管就插在这儿。你把手边的竹竿放下去：三尺半。\n跟甲板上那根测深杆的水印一样。');
    if (S.once('wellThink')) await S.think('这么大一条船，三尺半的水，两台泵抽一晚上就干了。\n那他们为什么慌成那样？');
  }
  async function redoakOn(S) {
    if (has(S, 7)) return S.narr(S.f.blue ? '红橡木桶还在渗。你再也不敢把灯凑近了。' : '最里头几只红橡木桶还在渗，酒味呛得人发晕。');
    await S.narr('最里头的几只桶颜色发红——是红橡木的，比别的桶疏松。\n桶缝里一滴一滴地往外渗酒，这一块的味儿冲得人头发晕。');
    await S.narr('你抬头看了看：头顶上，前舱口和后舱口都敞着，像是有人特意给这底下放了气。\n舱板上、桶上，没有一点焦痕。');
    ev(S, 7);
    const r = await S.ask('把提灯凑近桶缝，看清楚一点？', ['凑近', '别']);
    if (r === 0) {
      S.f.blue = true;
      for (let i = 0; i < 10; i++) { S.lights([[(19 - i * 1.8) * 16, 2.4 * 16, 3.2, .9]]); if (i === 0) { S.sfx('match'); S.tone('sawtooth', 110, 40, .9, .1, 0, 380); } await S.wait(55); }
      S.lights(null); S.shake(400, 2);
      await S.narr('「呼」——\n一层淡蓝色的火苗贴着舱顶跑了过去，像水面上的波纹，一眨眼就没了。\n什么都没烧着。连你的眉毛都没燎着。');
      await S.say('德沃（舱口上面）', '下面怎么了？！');
      await S.think('……要是那天，船长也在舱底看见了这么一下——他会怎么想？');
    }
    S.goal('回到甲板上（舱底的梯子）');
  }
  async function holdLadder(S) {
    if (S.f.act === 'inv' && has(S, 7)) return squallStart(S);
    await S.go('deck', 12, 6, 2);
  }

  /* ================= 黄昏的飑（危险段） ================= */
  async function squallStart(S) {
    S.f.act = 'squall0';
    S.dark(.9, 'deck'); S.plr(2.8); S.show('rainfx'); S.hide('deveau_d'); S.hide('wright_d');
    S.ent('dgboat_d').off = false; resetBoom(S); S.ent('boom').oy = OYM;
    await S.go('deck', 12, 6, 2, { ms: 500 });
    S.amb('rain'); S.sfx('thud'); S.shake(500, 2); thunder(S);
    await S.narr('你一从舱口探出头，脸上就挨了一巴掌似的——是雨。\n天不知什么时候黑了下来，西边压过来一大片铅灰色的云。');
    await S.say('德沃（船尾的小艇上）', ['飑来了！回小艇——快！', '先把前舱口盖上！浪要是灌进去，这条船就真沉了！']);
    S.focus(25, 6); creak(S, 1.4); await S.wait(400);
    const b = S.ent('boom'); b.s.loose = true;
    S.sfx('thud');
    await S.narr('「嘎——」主桅那边，捆横杆的绳子崩断了。');
    whoosh(S);
    for (let i = 0; i <= 10; i++) { b.oy = Math.round(OYM + (OYA - OYM) * (i / 10)); await S.wait(40); }
    S.shake(200, 2); S.sfx('thud');
    await S.narr('横杆连着半张主帆，在主桅后头左右乱甩——一下就能把人拍进海里。');
    S.focus(null);
    await S.say('德沃（船尾的小艇上）', '看准了！它刚甩过去你就冲，别在中间停！');
    S.goal('盖上前舱口 → 等横杆甩过去再冲过主桅后面 → 船尾右舷的绳梯' + (S.coop ? '（一人盯着横杆喊「走」）' : ''));
    S.f.act = 'squall'; S.f.hits = 0;
    resetBoom(S);
    S.cp('squall');
    startSquallTimer(S);
  }
  function startSquallTimer(S) {
    const t = SQ.left == null ? T0 : Math.max(SQ.left, TMIN); SQ.left = null;
    S.timer(t, '小艇的缆绳快拉不住了', loseAlone);
  }
  function inZone() { const p = W.pl; if (p.hidden) return false; const x = p.px / 16; return x > 21.3 && x < 27.7; }
  function squallTick(S, dt) {
    const r = S.ent('rainfx'); if (r) { r.px = W.pl.px; r.py = W.pl.py; }
    if (S.busy) return;
    const b = S.ent('boom'); if (!b) return;
    B.lt -= dt; if (B.lt <= 0) { B.lt = 5 + Math.random() * 5; S.fx('flash', { dur: .25 }); thunder(S); }
    B.t += dt;
    if (!B.sw) {
      if (!B.warned && B.t >= REST - WARN) { B.warned = true; b.s.warn = true; creak(S, 1.2); S.bubble('boom', '!', WARN * 1000); }
      if (B.t >= REST) { B.sw = true; B.p = 0; B.from = B.side ? OYB : OYA; B.to = B.side ? OYA : OYB; B.hit = false; whoosh(S); }
    } else {
      B.p = Math.min(1, B.p + dt / SWEEP);
      const e = B.p < .5 ? 2 * B.p * B.p : 1 - Math.pow(-2 * B.p + 2, 2) / 2;
      b.oy = Math.round(B.from + (B.to - B.from) * e);
      if (!B.hit && inZone()) { B.hit = true; S.run(hitBoom); return; }
      if (B.p >= 1) { B.sw = false; B.side = 1 - B.side; B.t = 0; B.warned = false; b.s.warn = false; S.sfx('thud'); S.shake(160, 1.5); }
    }
    if (!GW && W.pl.x >= 28) { GW = true; S.run(ghostWheel); }
  }
  async function ghostWheel(S) {
    S.show('ghost_d'); S.sfx('sting'); await S.wait(200);
    await S.scare('face', { spr: '@oilskin', dur: .8 });
    S.hide('ghost_d');
    S.toast('……舵轮边上，刚才站着一个人？');
  }
  async function hitBoom(S) {
    S.f.hits = (S.f.hits || 0) + 1;
    if (S.f.hits === 1) {
      S.sfx('thud'); S.shake(600, 4); S.fx('red');
      const y = W.pl.y === 6 ? 5 : W.pl.y; S.pos(21, y, 2);
      S.timerAdd(-3);
      await S.think('横杆擦着你的肩膀扫过去，你整个人被拍倒在甲板上——差一点就翻过舷墙了。\n（被拍回了主桅边，耽误了几秒）\n它刚甩过去就冲，别在中间停。');
      return;
    }
    DIED++; SQ.left = S.timerLeft; S.clearTimer();
    S.sfx('splash'); S.fx('flash'); S.shake(900, 5);
    await S.die('横杆结结实实地扫在你胸口上。\n你翻过舷墙，落进了黑色的海里。\n浪头把你按下去之前，你看见船尾的舵轮边上站着一个人。他没有动。', '落海');
  }
  async function reachLadder(S) {
    if (S.ent('fhatch').open) { S.sfx('locked'); S.toast('德沃：「前舱口！你还没盖前舱口！」'); return; }
    S.clearTimer(); S.f.act = 'night0';
    S.sfx('splash');
    await S.narr('你翻过舷墙，顺着绳梯往下一滑——德沃一把揪住你的领子，把你拽进了小艇。');
    await S.say('德沃', ['划！', '……好小子。']);
    await S.fade(1, 900);
    S.dark(null, 'deck'); S.hide('rainfx'); S.plr(null); S.ent('boom').s.loose = false; S.ent('boom').oy = OYM;
    await S.card('', '', '我们拼了命地划。回到神恩号上的时候，天已经黑透了。\n那条船就在下风不远的地方，黑着灯，一起一伏。\n\n她又只剩自己了。');
    S.f.act = 'night'; dgNightStage(S);
    await S.go('dg', 14, 9, 3, { ms: 500 });
  }
  async function loseAlone(S) {
    DIED++; SQ.left = 0; S.f.act = 'alone';
    S.sfx('thud'); S.shake(500, 3);
    await S.narr('「啪！」\n船尾传来一声像鞭子抽在水上的脆响——小艇的缆绳绷断了。');
    await S.say('德沃（越来越远）', ['小子——！', '抓紧了！天亮我们就回来——！']);
    await S.narr('马灯的光在浪里晃了几下，就看不见了。');
    await S.fade(1, 1200);
    S.hide('rainfx'); S.dark(.95, 'cabin'); S.plr(2.2); S.amb('none');
    await S.card('那天夜里', '', '飑过去了。风停了。\n你一个人，在一条没有人的船上。');
    S.show('tea'); S.show('wetfp');
    await S.go('cabin', 11, 6, 3, { ms: 600 });
    await S.narr('你缩在船长室里，不敢点灯。\n半夜，隔壁那架小风琴，自己响了。');
    reed(S, HYMN, .55, .05);
    await S.wait(2600);
    await S.narr('是一支赞美诗的调子。按得很慢，很仔细。\n……然后停了。');
    await S.alpha('ghost_c', .85, 1000);
    S.sfx('heart');
    await S.narr('桌边坐着一个穿黄色油布雨衣的人。帽檐底下黑洞洞的。\n桌上摆着两只茶杯，冒着热气。');
    await S.say('穿油布雨衣的人', '……茶还热着呢。坐。', { style: 'whisper' });
    await S.scare('face', { spr: '@oilskin', dur: 1 });
    await S.end({ bad: true, id: 'alone', title: '夜里一个人留在船上', text: '第二天早上，神恩号的小艇又划了过来。\n德沃在甲板上喊了很久。\n\n船长室的桌上摆着两只茶杯，一盘吃了一半的早饭。\n茶是凉的。\n\n很多年以后，有人把这条船的故事写进了杂志。\n里面说，船上一个人也没有，茶还是热的——\n\n他们只是记错了你走的时辰。' });
  }

  /* ================= 夜里：船长室的推理 ================= */
  const KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'];
  const DQ = [
    { q: '「海怪。」外面的人头一个就会这么说。\n「船头那两道口子是它的爪子印，它把人一个个拖下了海。」\n——哪一号证物，能驳倒这个说法？',
      ok: { 2: '小艇是有人拆了舷墙、解开绳子放下去的。\n海怪不会替人放艇。', 0: '天文钟、六分仪、船舶文件，全被带走了。\n被拖下海的人，没工夫收拾行李。' },
      bad: { 3: '口子正是他们拿来说海怪的证据。用它驳不倒它自己。', 1: '一把剑说明不了海里有没有东西。' }, gen: '这一样跟「被什么东西从海里拖走」不沾边。',
      dir: '想想：被拖下海的人，会先收好天文钟和文件、把小艇放下去吗？', loc: '回想主舱口那两个空艇座，和船长桌上那只空盒子。', ans: '2 号：小艇是被人放下去的。（0 号也行：天文钟和文件都被带走了。）' },
    { q: '「那就是船员造反，要么碰上了海盗。」\n「床底下那把剑，刃上的斑就是血。」\n——哪一号证物，能驳倒它？',
      ok: { 6: '水手的烟斗、靴子、衣服原封不动。\n造反的人、抢东西的人，不会把这些都留下——船上也没有一处打斗的痕迹。', 9: '船长太太的缝纫机上，那瓶油还立着；风琴、衣服、孩子的玩具全都在。\n没有人抢过，也没有人在那屋里打过架。' },
      bad: { 1: '剑就是他们的证据。……那块斑你看过，像锈，不像血。可光凭「像」不够。', 2: '小艇不见了，可能是海盗划走的，也可能是船员自己。驳不倒。', 0: '拿走天文钟和文件，海盗也干得出来。想想他们没拿走什么。' }, gen: '这一样说明不了船上有没有打过架、有没有人抢过东西。',
      dir: '海盗图钱，造反要见血。船上有没有少了值钱的？有没有乱？', loc: '想想前甲板室的水手舱，和船长室里那台缝纫机。', ans: '6 号或者 9 号：东西都在，没乱，没人抢。' },
    { q: '「那就是一场大风浪——或者水龙卷——把人从甲板上卷下去了。」\n「罗经柜撞坏了，帆吹没了，厨房里全是水。」\n——哪一号证物，能驳倒它？',
      ok: { 9: '一小瓶缝纫机油，还直直地立在那儿。\n真要有能把人卷下海的浪，船晃成那样，这瓶油早就倒了。' },
      bad: { 4: '舱底三尺半的水，说明不了甲板上有没有过把人卷走的大浪。', 6: '东西都在，说明他们走得急。可浪来了，箱子里的烟斗也不一定会丢。', 2: '小艇是被放下去的……可船长要是看见水龙卷过来，也会放艇。我要的是：船到底有没有翻江倒海地晃过。' }, gen: '这一样跟船有没有剧烈地翻腾过没关系。',
      dir: '船要是晃得能把人甩下海，屋里有什么东西一晃就会倒？', loc: '船长室里，船长太太的缝纫机。', ans: '9 号：缝纫机上那瓶油还立着。' },
    { q: '不是海怪，不是海盗，也不是浪——那就是他们自己走的。\n一个老船长，带着老婆孩子，为什么扔下一条好好的船？\n——是什么让他以为，这条船要出事了？',
      ok: { 4: '测深杆扔在甲板上——他们量过舱底的水。\n也许那一下量出来的数不对，也许是他们看错了。总之，他们以为水在涨。', 8: '一台泵拆开了：泵出了毛病，修到一半。\n泵不灵，舱底又有水——换了谁都会慌。', 7: '一船酒精。前后舱口全掀开了，像是在放气。\n要是舱底「轰」地响了一声、冒出那么冲的味儿……他怕的是爆炸。' },
      bad: { 1: '剑的事已经说过了。', 3: '口子在吃水线外头，那不会让人以为船要完。', 5: '绳子是后来的事。我问的是：一开始，他为什么慌？', 0: '石板告诉我们他在哪儿。我问的是他为什么慌。' }, gen: '这一样说明不了他为什么慌。',
      dir: '船长最怕的两件事：船进水，船着火。船上哪几样东西跟这两件事有关？', loc: '想想主桅边的两台水泵、扔在旁边的那根杆子，还有舱底那股味儿。', ans: '4 号测深杆、8 号拆开的泵、7 号舱口和酒味——哪一个都说得通。' },
    { q: '一条小划子，十个人，大西洋。\n——他凭什么觉得，坐上小艇就能活？',
      ok: { 0: '记事石板的最后一行：圣玛利亚岛的东端，在南西南，六海里。\n陆地就在眼前。划过去，用不了半天。' },
      bad: { 2: '小艇是怎么下去的，我们知道了。我问的是——他觉得能划到哪儿去。', 5: '绳子是后来的事。', 4: '那是他慌的原因。我问的是他凭什么觉得能活。' }, gen: '跟离陆地有多远有关。',
      dir: '一条小艇能去哪儿？想想他们最后一次知道自己在哪儿。', loc: '船长桌上那块记事石板，最后一行写了什么？', ans: '0 号：石板上写着，圣玛利亚岛就在六海里外。' },
    { q: '那他们为什么再也没回到船上？船好好的，就在那儿。\n——哪一号证物？',
      ok: { 5: '一根粗缆绳，一头拴在大船上，一头拴着小艇。\n他们想跟在大船后面，等看清楚了，没事就回来。' },
      bad: { 2: '小艇下去了，这我们知道。可他们为什么没再上来？', 0: '他们打算去岛上——可要是能回来，谁愿意坐小艇划六海里？' }, gen: '想想：要是他们本来就打算回来，会怎么做？',
      dir: '一个谨慎的船长弃船的时候，会拿什么把小艇和大船连在一起？', loc: '船尾，泡在水里的那一截。', ans: '5 号：船尾那根断了的缆绳。' }
  ];
  /* 答错的代价：窗外那条黑着的船，一次比一次近 */
  async function edge(S, n) {
    if (n === 1) { S.ent('porth').lit = true; S.ent('mcfar').s.lamp = true; S.sfx('sting'); await S.narr('舷窗外，那条黑着的船上，亮起了一盏灯。'); return S.say('德沃', '……那船上没人。我们亲手查过的。', { style: 'whisper' }); }
    if (n === 2) { reed(S, [392, 440, 494], .5, .03, true); await S.wait(900); return S.narr('风里飘过来几声琴音。很远，像是从水面上传过来的。\n谁也没有说话。'); }
    if (n === 3) { S.sfx('knock'); await S.wait(380); S.sfx('knock'); await S.wait(380); S.sfx('knock'); S.show('dgwet'); await S.narr('门外有人敲了三下。\n德沃拉开门——外面没人。甲板上一串湿脚印，从舷边一直走到门口。'); return; }
    S.ent('dglamp').off = true; S.sfx('switch'); await S.wait(500); S.ent('dglamp').off = false;
    await S.narr('灯芯「噗」地矮了一截，又慢慢亮了回来。');
  }
  async function dqWrong(S, i, d) {
    const Q = DQ[i];
    S.f.dqw = S.f.dqw || []; const w = S.f.dqw[i] = (S.f.dqw[i] || 0) + 1; S.f.dw = (S.f.dw || 0) + 1;
    S.sfx('bad');
    await S.say('莫尔豪斯船长', Q.bad[d] || Q.gen);
    await edge(S, S.f.dw);
    if (w >= 2) await S.say('德沃（翻着勘验本，低声）', w >= 4 ? Q.ans : w === 3 ? Q.loc : Q.dir);
  }
  async function deduction(S) {
    if (S.f.act === 'night') {
      S.f.act = 'dq'; S.f.dq = 0; S.f.dqw = []; S.f.dw = 0;
      await S.say('莫尔豪斯船长', ['坐。你们在那条船上待了一下午，德沃说你差点被横杆拍进海里。', '说吧，那条船上出了什么事？']);
      await S.say('德沃', '我把看见的都记在本子上了，一样一样编了号。');
      await S.note('book');
      await S.say('莫尔豪斯船长', ['外头的人会怎么说，我猜得到：海怪、海盗、船员造反、大风浪……', '一样一样来。你先告诉我，为什么不是这些——用本子上的号说话。']);
      S.goal('回答船长：用勘验本上的证物编号' + (S.coop ? '（一人翻「笺」里的《勘验本》念，一人按）' : '（「笺」里能翻勘验本）'));
    }
    S.face('mh', 'pl');
    while (S.f.dq < DQ.length) {
      const i = S.f.dq, Q = DQ[i];
      if (i === 3 && S.once('dqHalf')) await S.say('莫尔豪斯船长', '……好。外头那些说法，一样一样驳了。现在说说真正可能发生的。');
      const v = await S.keypad(`${Q.q}\n（证物编号 0–9，见「笺」里的《勘验本》）`, KEYS, 1);
      if (v == null) { await S.say('莫尔豪斯船长', '想好了再说。勘验本就在你手上。'); return; }
      const d = +v;
      if (Q.ok[d] != null) {
        S.sfx('select');
        await S.say('你', `${d} 号。${Q.ok[d]}`);
        if (i === 3 && d === 7 && S.f.blue) await S.think('你想起舱底那道贴着舱顶跑过去的蓝火。\n什么都没烧着——可光是看见它，就够吓死人了。');
        if (i === 3) await S.say('莫尔豪斯船长', d === 7 ? '……也说得通。不管是水还是酒气，他都以为船要完了。' : '……嗯。不管是水还是酒气，他都以为船要完了。');
        else await S.say('莫尔豪斯船长', ['……嗯。', '……对。', '……好。', null, '……对。', '……'][i] || '……');
        S.f.dq++;
      } else await dqWrong(S, i, d);
    }
    await conclusion(S);
  }
  async function conclusion(S) {
    S.f.act = 'post';
    await S.say('莫尔豪斯船长', ['那我替你说一遍，你听听对不对。', '他们以为船要出事——测出来的水不对，泵又坏了，或者舱底的酒气吓人。圣玛利亚岛就在六海里外。', '船长——日志扉页上写着他的名字，布里格斯——抱上天文钟和文件，让大家上小艇，用一根长缆绳拴在大船后头。等看清楚了，没事就回来。', '然后风来了。帆兜满了风，大船一下子蹿出去……绳子断了。']);
    await S.say('德沃', ['一条好好的船，自己往东走了九天。', '一条小艇，十个人，在大西洋上。']);
    await S.say('莫尔豪斯船长', ['这不是证明。谁也证明不了。', '可这是我能说出口的、最说得通的一个。']);
    if (S.has('ropeend')) { await S.narr('你从怀里掏出那截绳头，放在海图桌上。\n船长拿起来，用拇指捻了捻散开的那一头，很久没说话。'); }
    await S.say('莫尔豪斯船长', ['她还能开。德沃，明天一早你挑两个人，把她开到直布罗陀。', '……你留下。今天你在那条船上待得够久了。']);
    await S.say('德沃', '我带伦德和安德森去。');
    await S.fade(1, 900);
    await S.card('后来', '', '德沃他们三个人，把玛丽·赛勒斯特号开到了直布罗陀，比我们晚到一天。\n\n然后是没完没了的问话。');
    await S.note('court');
    await S.card('1884年2月', '新斯科舍　港口边的小酒馆', '炉子里的火噼啪响。\n年轻记者的笔停在本子上，等着你往下说。');
    S.f.act = 'final';
    S.cp('final');
    await finalScene(S);
  }
  async function finalScene(S) {
    await S.fade(1, 500);
    await S.say('年轻记者', ['……就这样？', '没有海怪，没有血，没有热茶——一根断了的绳子？']);
    const r = await S.ask('他把笔悬在本子上，等你开口。', ['「就这样。一根断了的绳子，和一个以为自己做得对的船长。」', '「……其实，那天茶是热的。」（给他讲他想听的）']);
    if (r === 1) return legendEnd(S);
    await S.say('你', ['就这样。', '大海从来不需要鬼。一块石板、一台坏了的泵、一根绳子，就够了。']);
    if (S.has('ropeend')) await S.narr('你从衣袋里掏出一截发黑的绳头，放在桌上。磨断的那一头，像一把散开的刷子。\n「这是我从那条船上带回来的，全部的东西。」\n记者拿起来看了很久，又轻轻放下。');
    await S.end({ id: 'truth', title: '第十三夜　完', text: '记者合上本子，有点失望。\n「这登不了头版。」\n「登不了。」你说。「可那是真的。」\n\n十二年来，你常常想起那块石板上的最后一行：\n圣玛利亚岛，南西南，六海里。\n一个船长，带着妻子和两岁的女儿，望着那座岛，\n以为自己做了最稳妥的决定。\n\n后来的人给她编了一个又一个结局。\n她真正的结局，只有那十个人知道。' });
  }
  async function legendEnd(S) {
    await S.say('你', ['……其实，那天茶是热的。', '早饭吃了一半，叉子还搁在盘子边上。小艇一条不少。', '舵轮边上，站着一个穿黄色油布雨衣的人。']);
    if (S.f.teaSeen) await S.think('（你没有全在撒谎。那天在船长室里，你确实看见过一杯冒着热气的茶。）');
    await S.say('年轻记者', ['对，对——就是这个！', '这才是读者想看的！']);
    await S.narr('他的笔越写越快。写完了，他站起来，把本子揣进怀里，冲你点点头。\n他走出门的时候，你才注意到——\n他身上穿着一件湿透了的黄色油布雨衣。');
    S.fx('glitch'); S.sfx('sting');
    await S.narr('门口的地板上，一路湿脚印。');
    await S.end({ bad: true, id: 'legend', title: '茶还是热的', text: '第二个月，那篇报道登了出来，卖得很好。\n第二年，又有人写了新的版本：船上多了一只猫，一封写了一半的信，一个幸存的人。\n\n故事越传越热。\n那十个人，越来越凉。\n\n有时候半夜，你会听见楼下有人在弹风琴。\n是一支赞美诗的调子。' });
  }
})();
