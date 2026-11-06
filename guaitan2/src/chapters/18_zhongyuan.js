/* ================= 第十八夜 · 中元·放河灯 ================= */
(() => {
  const NAME = '林德添';
  const RW = 24;                                         // 溪边地图宽
  const BASEPLR = { home: 3.8, street: 3.6, miao: 3.4, river: 3.4 };
  const MULT = [0, .6, .8, 1];                            // 灭了几盏灯，光圈就小几圈
  /* 别人家门口烧过纸的灰圈（踩上去 = 抢了人家祖宗的钱） */
  const ASH = [[11, 11], [20, 12], [6, 13], [22, 13], [11, 16], [20, 16]];
  const isAsh = (x, y) => ASH.some(([a, b]) => a === x && b === y);
  const YING = { home: 'yingH', street: 'yingS', miao: 'yingM', river: 'yingR' };
  /* 归途：田埂上提灯的队伍（行 y、速度格/秒、几个） */
  const LANES = [{ y: 15, v: 2.4, n: 4 }, { y: 12, v: -2.8, n: 3 }, { y: 9, v: 2.1, n: 4 }, { y: 6, v: -3.1, n: 3 }, { y: 3, v: 2.6, n: 4 }];
  const LANEY = new Set(LANES.map(l => l.y));
  const RET_FULL = 28, RET_FLOOR = 22;
  let DEATHS = 0, LASTLEFT = null;

  /* ---------------- 合成声音（双方都听得见） ---------------- */
  function gong(S, v = 1, d = 0) { S.tone('triangle', 330, 298, 1.7, .06 * v, d, 2600); S.tone('square', 165, 150, 1.1, .014 * v, d, 900); S.tone('sine', 523, 505, 1.2, .02 * v, d, 3400); }
  function puff(S) { S.tone('sine', 900, 160, .28, .05, 0, 1600); S.tone('sawtooth', 110, 50, .45, .02, .05, 380); }   // 「噗」——灯灭了
  function muyu(S, n = 3, v = 1) { for (let i = 0; i < n; i++) S.tone('sine', 820, 600, .08, .07 * v, i * .42, 2200); }
  function bell(S, v = 1, d = 0) { S.tone('triangle', 1760, 1700, .6, .03 * v, d, 5200); S.tone('sine', 2640, 2600, .35, .012 * v, d, 6000); }
  function heart(S, v = 1) { S.tone('sine', 62, 40, .14, .2 * v, 0, 300); S.tone('sine', 58, 38, .16, .16 * v, .22, 300); }
  function giggle(S, v = 1) { for (let i = 0; i < 4; i++) S.tone('sine', 1320 - i * 70, 1120 - i * 70, .07, .022 * v, i * .11, 4200); }
  function callTone(S, v = 1) { S.tone('sine', 233, 196, .7, .035 * v, 0, 900); S.tone('sine', 208, 156, 1.0, .035 * v, .75, 800); S.tone('triangle', 117, 98, 1.6, .01 * v, 0, 500); }   // 低低的、拖长的一声「小满——」
  function crackle(S, v = 1) { for (let i = 0; i < 7; i++) { const f = 1800 + Math.random() * 1600; S.tone('square', f, f * .6, .02, .012 * v, i * .09 + Math.random() * .05, 5000); } }
  function roar(S) { for (let i = 0; i < 5; i++) S.tone('sawtooth', 140 + i * 37, 210 + i * 30, 1.3, .012, i * .06, 900); }
  function opera(S, v = 1) {   // 一句拖腔，前后各一下板鼓
    const ns = [587, 659, 587, 523, 587, 494]; let d = .12;
    S.tone('square', 1300, 900, .04, .022 * v, 0, 3200);
    ns.forEach((f, i) => { S.tone('triangle', f, f * (i === ns.length - 1 ? .96 : 1), .34, .02 * v, d, 2400); S.tone('sine', f * 2, f * 2, .3, .004 * v, d, 4000); d += .32; });
    S.tone('square', 1300, 900, .04, .022 * v, d + .1, 3200); S.tone('square', 1300, 900, .04, .018 * v, d + .3, 3200);
  }
  function firecracker(S) { for (let i = 0; i < 22; i++) { const d = .3 + i * .07 + Math.random() * .05, f = 1600 + Math.random() * 1800; S.tone('square', f, f * .4, .03, .03, d, 4000); S.tone('sine', 140, 60, .05, .05, d, 500); } }
  function ding(S, v) { S.tone('triangle', 2093, 2060, .25, .016 * v, 0, 6000); }   // 队伍里的小铜铃
  function lap(S, v = 1) { S.tone('sine', 300, 180, .3, .03 * v, 0, 700); S.tone('sine', 260, 150, .35, .02 * v, .3, 600); }

  /* ---------------- 三盏灯：头顶一盏、两肩各一盏 ---------------- */
  const lampTag = l => '〔灯 ' + '●'.repeat(Math.max(0, l)) + '○'.repeat(3 - Math.max(0, l)) + '〕';
  function goal(S, t) { if (t != null) S.f.gt = t; S.goal((S.f.gt || '') + '　' + lampTag(S.f.lamps ?? 3)); }
  function updPlr(S) { S.plr((BASEPLR[S.map] || 3.5) * MULT[clamp(S.f.lamps ?? 3, 0, 3)]); }
  /* 「东西」：犯了忌，它就跟在你身后（每张图一个替身，进图时同步） */
  function syncYing(S) {
    const id = YING[S.map]; if (!id) return;
    const f = S.f, e = S.ent(id); if (!e) return;
    if ((f.ying || 0) > 0 && !f.kua) {
      if (e.hidden || !e.follow) { S.place(id, W.pl.x, W.pl.y); S.follow(id, true); }
      e.s.n = f.ying;
    } else { S.follow(id, false); S.hide(id); }
  }
  const WHERE = ['头顶', '右肩', '左肩'];
  async function fan(S, key, msg) {
    const f = S.f; f.lamps = (f.lamps ?? 3) - 1; f.ying = (f.ying || 0) + 1; f.kua = false;
    (f.fans = f.fans || []).push(key);
    puff(S); S.shake(300, 1.5);
    if (f.ying === 1) await S.scare('face', { face: 'ying', sfx: 'sting' });
    else { S.fx('flash'); S.sfx('whisper'); }
    if (msg) await S.narr(msg);
    S.wear('@me' + Math.max(1, f.lamps)); updPlr(S); syncYing(S);
    if (f.lamps <= 0) {
      DEATHS++; LASTLEFT = null;
      await S.narr('头顶上最后一盏灯，「噗」地灭了。\n四下里一下子黑透了。黑暗里，有好多只手，轻轻搭上了你的肩膀。');
      return S.die('三盏灯都灭了。\n那天夜里跟着你的东西，一个一个，贴了上来。', '三盏灯都灭了');
    }
    await S.narr(`${WHERE[f.lamps]}那盏灯，「噗」地灭了。\n四周一下子暗了一圈。身后……好像多了点什么。`);
    if (f.ying === 1) await S.think('阿嬷说过：人头顶一盏灯，两肩各一盏。灭光了，就招东西上身。\n还剩两盏……单子上写着：犯了忌的，进家门前要跨火盆。');
    else if (f.lamps === 1) await S.think('只剩头顶一盏了。……再错一回，就完了。');
    goal(S);
  }

  /* ================= 阿嬷家（黄昏） ================= */
  function homeLeft(S) {
    const f = S.f, a = [];
    if (!f.tYi) a.push('收衣服'); if (!f.tXiang) a.push('给公妈上香'); if (!f.tFan) a.push('给阿嬷端粥');
    return a;
  }
  function homeGoal(S) { const a = homeLeft(S); return a.length ? '天黑前：' + a.join('、') : '把厅里桌上的供品篮提去庙口普渡（出院门）'; }
  async function checkTasks(S) {
    const f = S.f;
    if (f.tYi && f.tXiang && f.tFan && !f.dark) return nightfall(S);
    goal(S, homeGoal(S));
  }
  async function nightfall(S) {
    const f = S.f; f.dark = true;
    S.dark(.7, 'home'); S.amb('night'); S.ent('win1').lit = true;
    await S.narr('天一下子黑了。\n院墙外头，家家户户门口亮起了一圈一圈的火光——都在烧纸。');
    if (!f.shirtDone) { f.shirtDone = true; S.hide('afeng'); S.ent('pen').s.wet = 0; await S.narr('院子里的阿峰不知什么时候跑去庙口了。盆里那件红背心也被他捞走了——湿着穿。'); }
    await S.say('阿嬷', ['……天黑了。', '小满，厅里的供品篮提上，去庙口吧。路上照单子来。']);
    goal(S, homeGoal(S));
  }
  async function amaTalk(S) {
    const f = S.f;
    if (!f.gotList) {
      await S.say('阿嬷', ['小满，过来坐。', '这脚不争气，扭一下就下不了床。今年送祖宗的事，要你去了。']);
      await S.say('阿嬷', ['今天七月半，鬼门开，路上走的不全是人。', '你阿公是头一年回来，认不得路。要给他烧纸，放灯照路。']);
      await S.say('阿嬷', '规矩阿嬷都写在这张单子上了。你给我一条一条记牢。');
      await S.note('list'); f.gotList = true; S.give('list', true);
      S.give('zhi'); S.give('deng');
      await S.say('阿嬷', ['纸钱拿去右边巷口烧给你阿公；三盏河灯，子时前放到溪里。', '天黑前，先把院子里的衣服收了，给公妈上炷香，灶上的粥给阿嬷端一碗来。']);
      await S.say('阿嬷', '弄完了，厅里桌上的供品篮，提去庙口普渡。');
      goal(S, homeGoal(S)); S.cp('home'); return;
    }
    if (S.has('fan')) return dinner(S);
    if (f.dark) {
      if (S.once('amaDeng')) return S.say('阿嬷', ['那盏不写名的灯？你阿公每年都放。', '我问他给谁，他就不吭声，坐在门槛上抽烟。……你阿公的木箱，在我床脚边上。']);
      return S.say('阿嬷', ['供品篮在厅里桌上。', '去吧。……放灯莫回头啊。']);
    }
    if (S.once('amaFeng')) return S.say('阿嬷', ['阿峰那孩子今晚要上孤棚，从下午就在院子里瞎忙。', '你阿公年轻时候也爬过。后来……后来就再也不肯去看了。']);
    return S.say('阿嬷', homeLeft(S).length ? '还有' + homeLeft(S).join('、') + '。天快黑了。' : '……');
  }
  async function dinner(S) {
    const f = S.f; S.take('fan');
    await S.narr('你把粥端到阿嬷床边。一碗地瓜粥，一碟菜脯蛋。');
    const c = await S.ask('筷子怎么放？', ['并排搁在碗边', '直直插在粥里，省得滑下去', '横搭在碗口上'], '');
    if (c === 1) {
      await S.say('阿嬷', '哎哟——快拔出来！筷子插在饭上，那是供死人的样子！');
      f.tFan = true;
      await fan(S, 'chop', '你手忙脚乱地把筷子拔出来。\n粥面上留着两个小洞，像两只眼睛，直直地看着房梁。');
    } else {
      await S.say('阿嬷', ['好，好。', '……你阿公以前也这样，筷子摆得齐齐整整的。']);
      f.tFan = true;
    }
    return checkTasks(S);
  }
  async function clothes(S) {
    const f = S.f, e = S.ent('yi');
    if (!f.gotList) return S.narr('竹竿上晾着阿嬷的蓝布衫、你的校服，还有一条毛巾。\n太阳落到院墙后面去了。');
    if (!f.tYi) {
      e.s.n = 0; f.tYi = true; S.sfx('item');
      await S.narr('你把竹竿上的衣服一件一件收下来：阿嬷的蓝布衫、你的校服、一条毛巾。\n都晒得硬邦邦的，带着太阳味。');
      if (e.s.red) await S.narr('阿峰那件红背心，你没敢碰。');
      if (S.once('yiThink')) await S.think('「夜里晾在外头的衣裳，会被借去穿。」\n……借给谁穿？');
      return checkTasks(S);
    }
    if (e.s.red) return S.narr('竹竿上只剩阿峰那件红背心。\n院子里一丝风也没有，它的两只袖口，却一下一下地朝你这边飘。');
    return S.narr('竹竿上空荡荡的，只剩几个木夹子。');
  }
  async function fengHome(S) {
    const f = S.f; S.face('afeng', 'pl');
    if (f.shirtDone) return S.say('阿峰', ['我先去庙口了，抢孤的队伍要集合。', '你待会儿也来看！']);
    await S.say('阿峰', ['小满！今晚我要上孤棚！', '这件是我们队的红背心，刚洗的，待会儿要穿。']);
    const c = await S.ask('「帮我晾到竹竿上去，风一吹，一会儿就干。」', ['好，帮你晾上', '天要黑了，晾屋里吧'], '阿峰');
    f.shirtDone = true; S.ent('pen').s.wet = 0;
    if (c === 0) {
      S.ent('yi').s.red = 1;
      await S.narr('你把湿背心搭上了竹竿。\n……院子里没有风。背心的两只袖子，却轻轻地抬了一下。');
      await S.say('阿峰', '谢啦！');
      await fan(S, 'shirt');
    } else {
      await S.say('阿峰', ['……阿嬷那张单子？', '行行行，晾屋里。大不了湿着穿，正好凉快。']);
    }
    await S.say('阿峰', '我先去庙口集合了！你忙完也来看！');
    await S.walk('afeng', [[9, 11], [9, 12]], 5); S.hide('afeng');
    return checkTasks(S);
  }
  async function incense(S) {
    const f = S.f, e = S.ent('gongma');
    if (f.tXiang) return S.narr('三炷香插在炉里，烟笔直地往上走。\n阿公在照片里抿着嘴，像是有话要说。');
    if (!f.gotList) return S.narr('厅里的神桌。上头供着观音，右边是林家的公妈龛，一排黑底金字的牌位。\n最边上，新摆了一张阿公的照片。');
    S.sfx('match'); e.lit = true;
    await S.narr('你点了三炷香，学阿嬷的样子，对着公妈龛拜了三拜。');
    muyu(S, 3, .5);
    await S.narr('牌位最边上，是新摆上去的阿公的照片。他穿着中山装，抿着嘴。\n去年冬天，他还坐在这张桌子边上剥花生。');
    await S.think('阿公，今年是你头一回回家。阿嬷说你认不得路……\n我给你烧纸，给你放灯。你跟着灯走。');
    f.tXiang = true; return checkTasks(S);
  }

  /* ================= 老街 · 庙口（戌时） ================= */
  async function ashStep(S) {
    const f = S.f, p = W.pl;
    let [bx, by] = p.prev || [p.x, p.y + 1];
    if (Math.abs(bx - p.x) + Math.abs(by - p.y) !== 1) { const m = curMap(); [bx, by] = [[0, 1], [0, -1], [1, 0], [-1, 0]].map(([a, b]) => [p.x + a, p.y + b]).find(([x, y]) => passable(m, x, y, p) && !isAsh(x, y)) || [p.x, p.y + 1]; }
    crackle(S, 1.2); S.pos(bx, by, p.dir);
    if (!f.ashW) {
      f.ashW = true;
      await S.narr('脚底下「嗤」的一声——你一脚踩进了人家门口烧纸的灰圈里。\n火星子溅起来，扑了你一裤腿。');
      await S.think('单子第五条：别人家门口烧的纸灰，莫踩。\n……这一脚算我没看见。往后，绕着走。');
      return;
    }
    await fan(S, 'ash', '你又踩进了一个灰圈。\n灰里的纸钱「呼」地蹿起一尺高的火苗——像有人被你踩了手，猛地抬起头来。');
  }
  async function pat(S) {
    const f = S.f; f.patDone = true;
    S.amb('none'); await S.wait(400); heart(S);
    await S.narr('你正往庙口走。身后有人——\n轻轻拍了拍你的左肩。');
    const c = await S.ask('……', ['扭过头去看', '停下来，整个人转过身去', '不理，接着走'], '');
    S.amb('market');
    if (c === 0) return fan(S, 'turn', '你一扭头——\n脸颊擦过左肩，一口气正呵在肩头的灯上。\n身后，一个人也没有。');
    if (c === 1) {
      S.turn(0);
      await S.narr('你停下脚步，连脚带肩，整个人转了过去。\n身后空无一人。只有一张金纸，被风推着，骨碌碌地往巷口那边滚。');
      S.turn(3);
      await S.think('「有人拍你，莫扭头。」——要看，就整个人转过去，肩上的灯就吹不着。');
      return;
    }
    giggle(S, .8);
    await S.narr('你没理，脚步不停。\n背后很近的地方，传来一声小孩子的笑。很轻。');
  }
  async function pudu(S) {
    const f = S.f, e = S.ent('pudu');
    if (f.ph === 'back') return S.narr('普渡坛上的供品都撤了，红布上落满了香灰。\n几截蜡烛头还在冒烟。');
    if (f.placed) return S.narr('你家的供品篮摆在红布上，夹在一排排罐头塔中间。\n每样供品上都插着一炷香，香头一明一暗，像有人凑上去，一口一口地吸。');
    if (!S.has('lan')) return S.narr('普渡坛从庙门口一直摆到戏台边。\n家家户户的供品都在上面，每样插着一炷香、一面三角小纸旗。');
    S.take('lan'); e.s.lan = 1; f.placed = true; S.sfx('item');
    await S.narr('普渡坛从庙门口一直摆到戏台边：罐头堆成塔，米粉、饼干、整只的鸡鸭，每样上面都插着一炷香、一面三角小纸旗。\n你把阿嬷的供品篮摆了上去，插上香。');
    S.show('tianP'); S.focus(17, 6); await S.wait(500);
    await S.narr('……供桌底下，红布垂下来的缝里，露出一双小小的光脚丫。\n沾着灰。脚趾头一动一动的。');
    S.hide('tianP'); S.focus(null);
    await S.narr('你蹲下去掀开桌布——底下只有几只空碗，碗底干干净净，像被舔过。');
    S.face('mg', 'pl');
    await S.say('庙公', ['林家的？你阿嬷的脚好些没有？', '供品摆上了就好。香一插，好兄弟就知道，这是请它吃的。']);
    await S.say('庙公', ['边上那尊纸扎的大士爷看见没？青面獠牙，头上顶着一尊小观音——是来管好兄弟的，谁也不许抢、不许闹。', '等普渡圆满，把大士爷一送，孤棚就开抢。']);
    goal(S, f.burned ? '回庙口孤棚那边（普渡就要圆满了）' : '去右边巷口给阿公烧纸（画圈烧）');
  }
  async function mgTalk(S) {
    const f = S.f; S.face('mg', 'pl');
    if ((f.lamps ?? 3) < 3 && !f.relit) {
      await S.say('庙公', '……小姑娘，你肩上的灯，暗了。');
      await S.narr('庙公从供桌上取了三炷香，在你肩膀上方慢慢绕了三圈，嘴里念念有词。');
      muyu(S, 3); await S.wait(900);
      f.lamps++; f.relit = true; S.wear('@me' + f.lamps); updPlr(S); bell(S);
      await S.narr(`${WHERE[f.lamps - 1]}一暖——那盏灯，又亮了。`);
      await S.say('庙公', ['只帮你点这一回。灯这东西，点着难，吹灭容易。', f.ying && !f.kua ? '还有，你后头跟着的那个，我送不走。回家进门前，跨一跨火盆。' : '剩下的路，自己当心。']);
      goal(S); return;
    }
    if (!f.placed) return S.say('庙公', ['普渡的供品摆这边。', '今晚好兄弟多，说话做事都当心点。']);
    if (f.ying && !f.kua && S.once('mgYing')) return S.say('庙公', '……你后头跟着一个。莫怕，回家进门前跨一跨火盆，它就进不了门。');
    return S.say('庙公', ['戏台上演的是《目连救母》。七月半的戏，是演给好兄弟看的。', '头排的凳子莫去坐。']);
  }
  async function burnWrong(S, k) {
    const f = S.f; f.bw = (f.bw || 0) + 1; crackle(S);
    if (k === 'closed') await S.narr('纸钱点着了，火却怎么也旺不起来，烧了半截就闷灭了。\n……圈画死了，里头的人进不来。');
    else if (k === 'none') { S.sfx('whisper'); S.fx('flash'); await S.narr('火刚点着，一阵风打着旋儿卷过来，纸灰「哗」地四散开。\n黑地里，好像有很多只手在抢。'); }
    else if (k === 'dir') await S.narr('火苗往一边倒了倒，又缩回来，绕着圈子打转。\n纸灰进进出出，找不着路。');
    else { S.sfx('whisper'); await S.narr('你把纸钱全塞进了圈里。\n圈外的黑地里，有什么东西「嘶」地吸了一口气——一阵风扑过来，把火压灭了。'); }
    S.fx('flash'); S.sfx('whisper');
    await S.narr('火光外的黑地里，伸出一只灰扑扑的手，飞快地抓走了一沓纸钱。');
    if (f.bw === 2) await S.think('单子上第八条，是怎么写的来着……（单子在档案里可以再看）');
    if (f.bw >= 3) await S.think('「画圈，留个口朝后山，圈外撒几张给没人管的。」');
    await S.narr('你用鞋底把灰抹平，又抽出一沓纸钱。');
  }
  async function burn(S) {
    const f = S.f, e = S.ent('spot');
    if (f.burned) return S.narr(f.ph === 'back' ? '圈里只剩一层白灰。风一吹，灰顺着那个口子，往后山那边飘。' : '圈里的纸钱烧得正旺，火苗一舔一舔，全往后山那边倒。\n圈外那几张，已经不见了。');
    if (!S.has('zhi')) return S.narr('路口这块空地上，有一圈一圈的旧灰印子。\n阿嬷说，林家每年都在这儿给祖宗烧纸。');
    await S.narr('路口这块空地上，有一圈一圈的旧灰印子。林家每年都在这儿烧纸。\n你蹲下来，捡了根树枝。');
    for (; ;) {
      const a = await S.ask('在地上画个圈——', ['画一个圆满的圈，不留缝', '画个圈，留一个口子', '不画圈，直接烧'], '');
      if (a !== 1) { await burnWrong(S, a === 0 ? 'closed' : 'none'); continue; }
      const b = await S.ask('口子朝哪边？', ['朝家里（西边）', '朝后山（东边）', '朝溪边（南边）', '朝庙口（北边）'], '');
      if (b !== 1) { await burnWrong(S, 'dir'); continue; }
      const c = await S.ask('纸钱……', ['全烧进圈里，一张不漏', '圈里烧，圈外也撒几张'], '');
      if (c !== 1) { await burnWrong(S, 'out'); continue; }
      break;
    }
    S.take('zhi'); e.s.fire = 1; S.sfx('match'); crackle(S);
    await S.narr('你在地上画了个圈，朝后山那边留了个口子。\n纸钱一沓一沓码进圈里，点着。火「轰」地旺了起来，火苗齐齐往东倒。');
    await S.say('你', ['阿公，钱给你烧来了。', '从后山那边进来拿……路上莫跟别人抢。']);
    await S.narr('你又抽出几张，撒在圈外。\n「这几张，给没人管的。」');
    S.show('tianB'); S.ent('tianB').alpha = 0; await S.alpha('tianB', .8, 600); giggle(S, .6);
    await S.narr('火光照不到的地方，伸出来一只小小的手。\n瘦，灰扑扑的。它捡起圈外的一张纸钱，又缩了回去。');
    await S.alpha('tianB', 0, 500);
    await S.think('……小孩子？');
    f.burned = true;
    goal(S, f.placed ? '回庙口孤棚那边（普渡就要圆满了）' : '把供品篮摆上庙口的普渡坛');
  }
  async function coin(S, id) {
    const c = await S.ask('石板缝里卡着一枚铜钱，在火光里一闪一闪。', ['捡起来', '不捡'], '');
    S.hide(id);
    if (c === 0) return fan(S, 'coin', '你弯腰捡起铜钱。冰凉冰凉的，攥了一会儿也不暖。\n摊开手——掌心里只剩一撮纸灰。');
    await S.narr('你跨了过去。\n再低头看时，石板缝里空空的，那枚铜钱已经不在了。');
  }
  async function frontBench(S) {
    const f = S.f;
    if (f.ph === 'back') return S.narr('戏散了。头排的长凳上落满了纸灰，一个脚印也没有。');
    if (f.sat) return S.narr('头排的长凳，你不敢再碰。');
    const c = await S.ask('头排的两条长凳空着，一个人也没坐，后排倒挤得满满当当。\n走了半天，腿有点酸……', ['坐下歇歇脚', '算了，站着看'], '');
    if (c === 1) return S.narr('你站在后排的人堆里看了一会儿。\n头排的凳子空了一整晚。可每回锣鼓一停，凳子就「吱呀」一声，像有人换了个坐姿。');
    f.sat = true;
    await fan(S, 'seat', '你一屁股坐了下去。\n凳子冰凉。你左右两边明明都空着，却挤得你动弹不得。');
    await S.say('后排的阿伯', '哎——头排莫坐！那是留给它们的！');
  }
  async function stage(S) {
    const f = S.f;
    if (f.ph === 'back') return S.narr('戏台上的汽灯灭了，幕布垂着。\n台角还立着一根锡杖，像是演目连的那个人忘了带走。');
    opera(S, 1);
    await S.narr('戏台上演的是《目连救母》。\n一个光头僧人拄着锡杖，在黑幕前一步一步地走；另一边，一个披头散发的女人跪在地上，伸着手讨吃的。');
    if (S.once('mulian')) await S.say('看戏的阿姨', ['目连的阿妈生前做了坏事，死了掉进饿鬼道，饭一到嘴边就变成火炭。', '目连去求佛祖。佛祖叫他七月十五办盂兰盆会，供养十方的和尚，他阿妈才吃上一口饭。', '所以七月半要普渡——让那些没人供的，也吃一顿饱的。']);
    else await S.narr('台上那个饿鬼扮相的女人，抓起一碗饭往嘴里送——锣「哐」地一响，饭变成了一团红纸火。');
  }
  async function qgStart(S) {
    const f = S.f; f.qgStart = true;
    gong(S, .8);
    await S.say('庙公', '普渡圆满——送大士爷——');
    S.focus(21, 4); S.ent('dashi').s.burn = 1; crackle(S, 1.4);
    await S.narr('几个人往纸扎的大士爷脚下堆上金纸，一把火点着。\n青面獠牙的大士爷在火里慢慢弯下了腰，头上那尊小观音，最后才烧着。');
    crackle(S); await S.wait(900);
    S.hide('dashi'); S.show('dashiAsh'); S.focus(null);
    await S.narr('火光一落，孤棚底下的人「呼啦」一下全围了上去。\n——要抢孤了。');
    goal(S, '去孤棚底下找阿峰');
  }
  async function climb(S, to, ms) {
    const ids = ['m1', 'afeng', 'm2'], from = ids.map(id => S.ent(id).oy || 0), n = Math.max(1, Math.round(ms / 60));
    for (let k = 1; k <= n; k++) { ids.forEach((id, i) => { S.ent(id).oy = Math.round(lerp(from[i], to * (1 - i * .08), k / n)); }); await S.wait(60); }
  }
  async function fengStreet(S) {
    const f = S.f;
    if (f.qgDone) { S.face('afeng', 'pl'); return S.say('阿峰', ['子时快到了，快去溪边放灯。', '放完灯莫回头啊！']); }
    if (!f.qgStart) return S.say('阿峰', ['等大士爷送走了才开抢！', '你先去忙你的。']);
    const c = await S.ask('阿峰背对着你，仰头盯着孤棚，正往手心里吐唾沫。\n四下锣鼓喧天，喊他也听不见。', ['拍拍他的肩膀', '挤到他前面去'], '');
    if (c === 0) {
      S.face('afeng', 'pl');
      await S.say('阿峰', '哎哟——！你拍我肩膀干嘛，吓死人！');
      await fan(S, 'pat', '阿峰肩上什么事也没有。\n凉意却顺着你拍他的那只手，一路爬上了你自己的肩膀——\n拍人肩，招来的东西，跟的是拍的人。');
    } else { await S.narr('你从人堆里挤到他跟前。'); S.face('afeng', 'pl'); }
    await S.say('阿峰', ['小满！你来得正好！', '待会儿锣响三声才能抢，前两声谁伸手谁倒霉——那是好兄弟先拿。']);
    await S.say('阿峰', '你在底下站着看，莫乱动！');
    S.cp('qg');
    return qgSeq(S);
  }
  async function qgSeq(S) {
    const f = S.f;
    goal(S, '锣响三声再动');
    await S.fade(1, 250); S.pos(5, 9, 3);
    [['m1', 3], ['afeng', 5], ['m2', 7]].forEach(([id, x]) => { S.place(id, x, 7, 3); S.ent(id).oy = 0; });
    S.ent('gupeng').s.flag = 1; S.hide('gui'); S.place('mg', 9, 8, 1);
    await S.fade(0, 300);
    await S.narr('人群一拥而上，把你挤到了孤棚底下。\n庙公提着一面铜锣，走到孤棚底下。\n孤棚的柱子上涂满了牛油，在火光里亮得发腻。');
    gong(S); S.shake(200, 1);
    await S.narr('「铛——」\n第一声。抢孤的汉子们往手上抹了把香灰，抱住了柱子。');
    await climb(S, -10, 700);
    gong(S); S.shake(200, 1);
    await S.narr('「铛——」\n第二声。');
    S.place('gui', 6, 9); const g = S.ent('gui');
    for (let i = 0; i <= 6; i++) { g.oy = -30 + i * 5; await S.wait(50); }
    g.oy = 0; S.sfx('thud');
    const c = await S.ask('孤棚上不知谁碰掉了一个红龟粿，骨碌碌滚到你脚边。\n四面八方好几只手都伸了过来——', ['不动，等第三声锣', '抢先捡起来'], '');
    if (c === 1) {
      S.hide('gui'); f.grabbed = true;
      await S.narr('你抢先一把抓起了红龟粿。\n那几只伸过来的手，一下全缩了回去。你这才看清——它们在火光底下，没有一只是有影子的。');
      await fan(S, 'grab');
    } else await S.narr('你没动。\n那几只手在红龟粿上方停了停，慢慢地，缩回了人堆的影子里。');
    gong(S, 1.6); gong(S, .7, .25); S.shake(600, 2.5); roar(S); firecracker(S);
    await S.narr('「铛——！」\n第三声。孤棚底下一下子炸开了锅——');
    S.hide('gui');
    await climb(S, -80, 1100);
    for (const id of ['luo1', 'luo2', 'luo3']) S.show(id);
    S.show('tianG'); S.focus(5, 4); await S.wait(300);
    await S.narr('汉子们一个踩着一个往上爬，粿、肉、米包噼里啪啦往下掉。\n孤棚顶上，那一堆供品中间——站着一个光脚的小男孩。');
    await S.wait(300);
    await S.scare('face', { face: 'tian', sfx: 'sting' });
    await S.narr('他低着头，看着底下。\n满场几百个人，他只看着你。');
    S.shake(900, 3); S.sfx('thud');
    await S.narr('孤棚「吱呀——」地晃了一下。底下的人齐声惊叫。\n再看时，棚顶上只剩阿峰，一手抱着柱子，一手扯下了那面顺风旗。');
    S.hide('tianG'); S.ent('gupeng').s.flag = 0; S.focus(null);
    await climb(S, 0, 600);
    S.place('afeng', 5, 8, 0);
    await S.say('阿峰', ['抢到了！顺风旗！今年林家走大运！']);
    if (f.grabbed) {
      await S.say('阿峰', ['……你手里攥着什么？', '锣没响三声你就捡了？快扔了！']);
      await S.narr('你摊开手。红龟粿早没了，掌心里黏着一层冷掉的香灰。');
    } else {
      S.give('gui');
      await S.say('阿峰', ['这个给你，锣响三声以后抢的，干净。', '红龟粿，吃了保平安，拿回去给阿嬷。']);
    }
    await S.say('阿峰', ['刚才孤棚晃那一下，吓死我了。', '老人说，几十年前它塌过一回……庙里有块碑，记着这事。']);
    await S.say('阿峰', ['子时快到了，你去溪边放灯吧。', '我们队还要进庙里谢神。……放完灯，莫回头啊。']);
    f.qgDone = true;
    goal(S, '子时前，去溪边放河灯（老街往南走到底）');
  }
  async function qian(S) {
    const f = S.f;
    if (f.gotQian) return S.narr('签筒里插得满满的竹签。你已经求过一支了：\n「手足同根共一字，灯前莫教姓名空。」');
    for (let i = 0; i < 6; i++) S.tone('square', 900 + Math.random() * 300, 700, .03, .02, i * .09, 3000);
    await S.narr('你跪在蒲团上，捧起签筒摇了摇。哗啦、哗啦——一支竹签跳了出来。');
    await S.narr('第四十七签。签诗写着：\n「手足同根共一字，灯前莫教姓名空。」');
    f.gotQian = true;
    await S.think('……同根，共一字？');
  }

  /* ================= 溪边 ================= */
  const KEYS = ['林', '陈', '德', '永', '昌', '添', '水', '福'];
  function showLantern(S, id, x, y) { S.place(id, x, y); S.ent(id).s.go = 1; lap(S, .8); }
  async function nameWrong(S, v) {
    const f = S.f; f.nw = (f.nw || 0) + 1; puff(S);
    await S.narr('墨迹还没干，灯芯「哧」地暗了一下。\n灯底下的水面上，浮出一张小小的脸，一晃就散了。');
    if (f.nw === 2) await S.scare('face', { face: 'tian', sfx: 'sting' });
    if (f.nw >= 4) return S.think('……林，德，添。');
    if (f.nw >= 3) return S.think('照片背面写着「阿兄同阿添」。族谱上，阿公是「德」字辈的长子……');
    const [a, b, c] = v;
    if (v === '林德水') await S.think('……这是阿公的名字。阿公的灯，已经放下去了。');
    else if (a !== '林') await S.think(a === '陈' ? '陈是阿嬷娘家的姓。他是林家的孩子。' : '他是林家的孩子……');
    else if (b === '永' || b === '昌') await S.think(b === '永' ? '「永」是爸爸那一辈的字。他和阿公是一辈的。' : '「昌」是我这一辈的字。他和阿公是一辈的。');
    else if (b !== '德') await S.think('族谱上，同一辈的兄弟，名字中间是同一个字。');
    else if (c !== '添') await S.think('最后一个字……照片背面，阿公是怎么叫他的？');
    await S.narr('你用袖子把墨迹擦了。灯纸皱了一点。');
  }
  async function release(S) {
    const f = S.f;
    if (f.ph !== 'river' || !S.has('deng')) return S.narr('溪水贴着石阶往下游淌，凉丝丝的。');
    if (!f.rel) {
      await S.narr('你蹲在最下面一级石阶上，取出阿嬷折的三盏莲花灯。');
      S.sfx('match'); showLantern(S, 'L1', 11, 21);
      await S.narr('第一盏，写着「林氏历代祖先」。\n你点着灯芯，把它轻轻推进水里。灯晃了晃，稳稳地漂走了。');
      showLantern(S, 'L2', 12, 21);
      await S.narr('第二盏，是阿嬷一笔一画写的：「林公德水」。');
      await S.think('阿公，跟着灯走。……莫走错路了。');
      await S.narr('阿公的灯一离手，就在水面上打了个转——像是回过头，看了你一眼。\n然后，才顺着水漂远了。');
      f.rel = 2;
    }
    for (; ;) {
      const c = await S.ask('第三盏灯，没有名字。\n阿嬷说，你阿公每年都放。问他给谁，他不吭声。', ['在灯上写一个名字', '不写，就这样放下去', '先等等'], '');
      if (c === 2) {
        const wh = []; if (!f.readZupu) wh.push('厅里书架上的族谱'); if (!f.readPhoto) wh.push('阿嬷床脚的旧木箱'); if (!f.readBei) wh.push('庙里的石碑'); if (!f.gotQian) wh.push('庙里的签');
        goal(S, '第三盏灯写谁的名字？' + (wh.length ? '去看看' + wh.slice(0, 2).join('、') : '翻翻档案里的族谱和照片') + '（可一人翻档案、一人写）'); return;
      }
      if (c === 1) { f.named = false; break; }
      const v = await S.keypad('卖灯阿伯递来毛笔。你蘸了墨，在灯上写下——\n（写三个字；另一个人可以在档案里翻族谱、照片和石碑）', KEYS, 3);
      if (v == null) continue;
      if (v === NAME) { f.named = true; break; }
      await nameWrong(S, v);
    }
    S.take('deng'); f.rel = 3;
    showLantern(S, 'L3', 11, 22);
    if (f.named) {
      await S.narr('你在第三盏灯上，一笔一画写下：「林德添」。');
      await S.narr('灯一沾水，灯芯「腾」地亮了，比前两盏都亮。');
      S.place('L2', 16, 21); S.ent('L2').s.go = 0; S.ent('L3').s.chase = 1;
      S.show('tianR'); S.ent('tianR').alpha = 0; await S.alpha('tianR', .85, 700);
      await S.say('', '「……阿兄——」', { style: 'whisper' });
      await S.narr('石阶边上，站着一个光脚的小男孩。\n他看了看手里的灯，又看了看你，咧开嘴笑了。');
      S.focus(15, 21);
      await S.narr('下游不远处，阿公那盏灯停在水面上，打着转——像是在等。\n他踩着水面，追着自己的灯跑了过去。');
      await S.wait(1200);
      await S.narr('两盏灯碰了一下，并排漂远了。');
      S.focus(null);
      await S.alpha('tianR', 0, 900);
    } else {
      S.ent('L3').s.spin = 1;
      await S.narr('你把那盏没写名字的灯推进水里。\n它不往下游走，就在石阶边上打转，一圈，又一圈。');
      await S.narr('过了好久，它才慢吞吞地漂开了。');
    }
    await S.say('卖灯阿伯', '放完了？起身，走。莫回头。');
    S.pos(11, 19, 3);
    for (const id of ['r1', 'r2', 'bo']) S.hide(id);
    S.dark(.86); ding(S, 1);
    await S.narr('你站起身。\n身后的溪面上，一下子亮起了好多好多灯。');
    await S.narr('前面的田埂上，也亮起来了——一串一串的白灯笼，横着从田里走过。\n提灯笼的「人」低着头，一个跟着一个，往溪边去。');
    await S.think('子时前要到家。不能撞上它们，不能跑……不能回头。');
    f.ph = 'ret';
    goal(S, '回家：等白灯笼过去再过田埂，莫回头、莫跑（一人盯灯笼喊「走」）');
    S.cp('ret');
    startReturn(S, false);
  }
  function startReturn(S, retry) {
    const f = S.f; f.ret = true; f.hits = 0; f.looked = 0; f.voice = false; f.hitLock = false;
    S.norun(true); S.dark(.86);
    LANES.forEach((L, li) => {
      for (let i = 0; i < L.n; i++) {
        const id = `q${li}_${i}`, x0 = ((i * (RW + 4) / L.n + li * 3.3 + (i % 2) * 1.6) % (RW + 4)) - 2;
        S.place(id, Math.round(x0), L.y, L.v > 0 ? 2 : 1); S.ent(id).px = x0 * TS; S.ent(id).alpha = .85;
      }
    });
    const left = retry ? Math.max(LASTLEFT ?? 0, RET_FLOOR) : RET_FULL; LASTLEFT = null;
    S.timer(left, '子时', retTimeUp, { during: true });
  }
  function stopReturn(S) {
    const f = S.f; f.ret = false; S.norun(false);
    LANES.forEach((L, li) => { for (let i = 0; i < L.n; i++) S.hide(`q${li}_${i}`); });
  }
  const retTimeUp = async S => {
    LASTLEFT = 0; DEATHS++; stopReturn(S);
    bell(S, 1.5);
    await S.narr('远远的，庙里的钟「当——」地敲了一下。\n子时到了。田埂上的白灯笼，从四面八方涌了过来。');
    await S.die('提灯的队伍从你身上穿了过去。\n等你回过神来，你已经走在队伍中间，跟着它们，一步一步往溪里去。', '子时到了');
  };
  async function laneHit(S) {
    const f = S.f; f.hits = (f.hits || 0) + 1;
    const p = W.pl; let y = p.y; if (LANEY.has(y)) y++; const x = clamp(p.x, 10, 13);
    if (f.hits === 1) {
      S.fx('flash'); S.shake(300, 2); ding(S, 1.2); S.sfx('whisper');
      S.pos(x, y, 3);
      const hg = f._hitId && S.ent(f._hitId), hl = hg && LANES.find(l => l.y === Math.round(hg.py / TS));
      if (hg && hl) hg.px += Math.sign(hl.v) * 3 * TS;
      f._grace = 1;
      await S.narr('一只冰凉的袖子擦过你的脸——\n提灯笼的那个「人」没有停，也没有看你。它的袍子底下，没有脚。');
      S.timerAdd(-3); S.toast('子时 −3 秒');
      await S.think('撞上第二回，就要跟它们走了……\n等灯笼过去，再走。');
      f.hitLock = false; return;
    }
    LASTLEFT = S.timerLeft; DEATHS++; stopReturn(S);
    await S.scare('face', { face: 'ying', sfx: 'scream' });
    await S.die('你又撞进了队伍里。\n这一回，冰凉的袖子没有擦过去——它挽住了你的胳膊。\n你跟着白灯笼，一步一步，往溪里走去。', '你走进了队伍');
  }
  async function lookBack(S) {
    const f = S.f; f.looked = (f.looked || 0) + 1;
    if (f.looked === 1) {
      S.turn(3); heart(S); S.shake(200, 1);
      await S.narr('你的脖子刚要往后转——\n后颈一凉，像有人贴着耳朵，轻轻吹了口气。');
      await S.think('「河灯放下去，莫回头。」\n……往前走。');
      S.timerAdd(-3); return;
    }
    return endLook(S);
  }
  async function voice(S) {
    const f = S.f; f.voice = true;
    if (W.timer) W.timer.during = false;   // 阿公喊你的这一段，子时的倒计时停着
    callTone(S);
    await S.say('', '「小满——」', { style: 'whisper' });
    await S.think('……是阿公的声音。从身后，溪那边传过来的。');
    await S.say('阿公', ['小满，阿公的灯……歪了，要灭了。', '你回头，帮阿公看一眼。就一眼。']);
    if (f.named) { giggle(S, .7); await S.say('', '「姐姐，莫回头。阿兄是舍不得你。」', { style: 'whisper' }); }
    const c = await S.ask('……', ['回头看一眼', '不回头，往前走'], '');
    if (c === 0) return endLook(S);
    await S.narr('你咬住嘴唇，没有回头。\n身后静了很久。然后，阿公叹了口气，就像以前坐在饭桌边上那样。');
    await S.say('阿公', '……好孩子。走吧。');
    if (W.timer) W.timer.during = true;
  }
  async function endLook(S) {
    S.clearTimer(); stopReturn(S);
    S.turn(0); S.focus(12, 21);
    S.show('akongR'); S.ent('akongR').alpha = 0; await S.alpha('akongR', .85, 600);
    await S.narr('你回过了头。');
    await S.narr('溪面上密密麻麻，全是河灯。\n每一盏灯后面，都跟着一个人，弯着腰，护着灯往下游走。');
    await S.scare('face', { face: 'akong', sfx: 'sting' });
    await S.narr('阿公就站在他那盏灯后面，溪水没到膝盖。\n他看见你回头，脚步停住了。');
    await S.say('阿公', ['……小满。', '阿公不走了。阿公陪你回家。']);
    await S.fade(1, 900);
    await S.end({ bad: true, id: 'look', title: '回头', text: '那一夜，所有的河灯都漂向了下游。只有一盏「林公德水」，在溪口打了一整夜的转。\n\n从那以后，厅里阿公的那张照片，眼睛总是望着门口。\n饭桌边上那把空椅子，夜里会自己往外挪一挪。\n\n阿嬷说：放灯，莫回头。\n你一回头，他们就舍不得走了。' });
  }
  async function finishReturn(S) {
    S.clearTimer(); stopReturn(S);
    await S.narr('你踩上了老街的石板路。\n身后的田埂上，白灯笼的队伍还在一串一串地往溪边走。……你没有回头。');
    S.f.ph = 'back';
    await S.go('street', 15, 16, 3);
  }

  /* ================= 回家 ================= */
  async function huopen(S) {
    const f = S.f;
    if (f.kua) return S.narr('火盆里的炭还红着，抹草烧出一股清苦的香。');
    await S.narr('院门外摆着一只旧铁盆，里头烧着几块炭，边上压着一把抹草。\n是阿嬷让隔壁帮忙摆的。');
    const c = await S.ask('……', ['撩起裤脚，跨过去', '绕过去'], '');
    if (c === 1) return S.narr('你绕开了火盆。');
    f.kua = true; crackle(S, 1.2);
    if (f.ying) {
      await S.narr('你一步跨过了火盆。\n火苗「呼」地往上一蹿——身后有什么东西尖叫了一声，像被火燎着了，猛地往后缩。');
      S.sfx('cry'); syncYing(S);
      await S.narr('回头的念头只闪了一下。你忍住了。\n……那股贴着后背的冷意，没有跟过来。');
    } else await S.narr('你一步跨过了火盆。\n热气扑在小腿上，暖烘烘的。');
    goal(S, '回家');
  }
  function tail(S) {
    const f = S.f; let t = '';
    if (f.ate) t += '\n\n阿峰抢来的那个红龟粿，你和阿嬷一人一半，就着热茶吃了。';
    if (f.fans && f.fans.length) t += '\n\n那年鬼月，你的肩膀一直有点凉。阿嬷说，那是灯灭过的地方，要过了七月才会暖回来。';
    return t;
  }
  async function homeEnd(S) {
    const f = S.f; f.ph = 'end';
    S.dark(.76, 'home'); S.amb('night');
    S.ent('amabed').s.empty = 1; S.place('amaS', 8, 9, 0);
    syncYing(S);
    if (f.ying && !f.kua) return endFollow(S);
    await S.narr('阿嬷拄着拐杖，站在院子里，手里提着一盏小灯笼。');
    await S.say('阿嬷', ['回来啦？', '……没回头吧？']);
    await S.say('你', '没有。');
    if (S.has('gui')) {
      S.take('gui'); f.ate = true;
      await S.say('你', '阿峰抢的红龟粿，给你的。');
      await S.say('阿嬷', '这孩子……好，好。阿嬷跟你一人一半。');
    }
    if (f.named) {
      await S.say('你', ['阿嬷，第三盏灯，我写了名字。', '林德添。阿公的弟弟。']);
      await S.narr('阿嬷愣了很久。灯笼在她手里晃了一下。');
      await S.say('阿嬷', ['……你阿公走之前那几天，人糊涂了，一直喊「阿添、阿添」。', '我问阿添是谁，他就哭。哭得像个小孩。']);
      await S.say('阿嬷', ['原来是他弟弟。', '……明年清明，阿嬷去跟族里说，把名字补上。']);
      await S.fade(1, 1200);
      return S.end({ id: 'all', title: '送走所有人', text: '那天夜里，溪口镇的河灯漂了一整夜。\n\n第二天一早，下游打鱼的阿伯说，他看见三盏灯挨在一起漂：一盏写着林氏历代祖先，一盏写着林公德水，一盏写着林德添。漂到出海口，才慢慢分开。\n\n第二年清明，族谱上那团墨的旁边，补上了一行小字：「次子德添，壬辰年中元殇，年九岁。」\n\n从那以后，林家每年七月半放四盏灯。第四盏不写名字——给那些没人放灯的。' + tail(S) });
    }
    await S.say('阿嬷', ['三盏灯都放下去了？', '好，好。你阿公有灯照路，认得回去了。']);
    await S.fade(1, 1200);
    return S.end({ id: 'blank', title: '不写名的灯', text: '三盏河灯都漂走了。没写名字的那一盏，在岸边打了很久的转，才慢慢跟上去。\n\n第二年七月半，阿嬷又折了一盏不写名字的灯。你还是不知道该给谁。\n只是每回放下去，它都要在石阶边上，打很久很久的转。\n\n' + (f.readPhoto ? '阿公本子最后那一页——「阿添，阿兄对不住你」——你后来又翻出来看过好几回。\n阿添的大名叫什么，族谱上涂掉了，谁也说不清。' : f.readZupu ? '族谱上那团被墨涂掉的名字，你一直没去问。' : '阿公床脚边的那只旧木箱，你一直没打开过。') + tail(S) });
  }
  async function endFollow(S) {
    await S.narr('阿嬷拄着拐杖站在院子里，提起灯笼朝你照了照——\n灯笼光越过你的肩膀，照见了你身后。阿嬷的脸，一下子白了。');
    await S.say('阿嬷', ['小满……火盆呢？', '你没跨火盆？']);
    await S.scare('face', { face: 'ying', sfx: 'scream' });
    await S.narr('你身后那团黑影，从你身边擦了过去。\n它慢慢地，一步一步，进了厅里。');
    await S.fade(1, 900);
    await S.end({ bad: true, id: 'follow', title: '带回家', text: '那年鬼月，家里总像多了一个人。\n\n夜里，厅里的椅子被人拖开；早上起来，锅里的粥少了一碗；晾在屋里的衣服第二天总是湿的——像有人穿着它出过门。\n\n阿嬷请庙公来念了三天经，才把它送走。\n庙公临走时说：七月半犯了忌，进门前要跨火盆。\n……单子上，明明写着的。' });
  }

  /* ================= 人物外观 ================= */
  function lampsX(n) {   // 头顶一盏、两肩各一盏：灭一盏少画一盏
    return function (g, d, fr, G, R) {
      const fl = (x, y) => { R(x - 1, y, 4, 2, 'rgba(255,190,90,.35)'); R(x, y - 1, 2, 3, '#ffcf6a'); R(x, y, 1, 1, '#fff6d0'); };
      fl(7, 0);
      if (d === 1 || d === 2) { if (n >= 2) fl(9, 8); return; }
      if (n >= 2) fl(1, 9);
      if (n >= 3) fl(13, 9);
    };
  }
  const ME = { skin: '#f2cca8', hair: '#1a1210', hs: 'long', top: '#e8e4da', top2: '#7a9ac0', bottom: '#34446a', shoes: '#e0ddd4', mouth: '#b06a5a' };
  const PEOPLE_ZY = {
    me: Object.assign({ key: 'zy-me3', extra: lampsX(3) }, ME),
    me3: Object.assign({ key: 'zy-me3', extra: lampsX(3) }, ME),
    me2: Object.assign({ key: 'zy-me2', extra: lampsX(2) }, ME),
    me1: Object.assign({ key: 'zy-me1', extra: lampsX(1) }, ME),
    ama: { key: 'zy-ama', skin: '#e2b48e', hair: '#d8d6ce', hs: 'bun', top: '#2e3e5e', top2: '#d8d4c4', bottom: '#24242c', shoes: '#1a1a1a', mouth: '#a06a5a',
      extra(g, d, fr, G, R) { if (d !== 3) { R(d === 0 ? 13 : 3, G.tT + 2, 1, 13, '#6a4a2a'); R(d === 0 ? 12 : 3, G.tT + 2, 2, 1, '#6a4a2a'); } if (d === 0) { R(5, G.hT + 3, 2, 1, '#b08a6a'); R(9, G.hT + 3, 2, 1, '#b08a6a'); } } },
    afeng: { key: 'zy-feng', skin: '#c89068', hair: '#120e0c', hs: 'short', top: '#c8302a', top2: '#c8302a', bottom: '#1a1a22', shoes: '#2a2a2a', mouth: '#8a4a3a',
      extra(g, d, fr, G, R) { R(4, G.hT + 1, 8, 1, '#f0ece0'); if (d !== 3) R(d === 1 ? 11 : 3, G.hT + 1, 2, 3, '#f0ece0'); if (d === 0) { R(3, G.tT + 1, 1, 5, '#c89068'); R(12, G.tT + 1, 1, 5, '#c89068'); R(6, G.tT + 2, 4, 2, '#f0d040'); } } },
    m1: { key: 'zy-m1', skin: '#b88058', hair: '#100c0a', hs: 'short', top: '#c8302a', top2: '#c8302a', bottom: '#1a1a22', shoes: '#2a2a2a',
      extra(g, d, fr, G, R) { R(4, G.hT + 1, 8, 1, '#f0ece0'); if (d === 0) { R(3, G.tT + 1, 1, 5, '#b88058'); R(12, G.tT + 1, 1, 5, '#b88058'); } } },
    mg: { key: 'zy-mg', skin: '#c8946a', hair: '#b8b8b0', hs: 'bald', top: '#5a4636', top2: '#3a2c20', robe: true, bottom: '#3a2c20', shoes: '#1a1a1a', mouth: '#7a4a3a',
      extra(g, d, fr, G, R) { if (d === 0) { R(5, G.tT + 1, 6, 1, '#8a2a1a'); R(5, G.tT + 2, 1, 3, '#8a2a1a'); R(10, G.tT + 2, 1, 3, '#8a2a1a'); R(6, G.hT + 6, 4, 1, '#e0e0d8'); } } },
    po: { key: 'zy-po', skin: '#d8a880', hair: '#9a9890', hs: 'bun', top: '#1e1e26', top2: '#3a3a44', bottom: '#1e1e26', shoes: '#111', mouth: '#8a5a4a' },
    kid: { key: 'zy-kid', child: true, skin: '#e8b890', hair: '#18120e', hs: 'short', top: '#f0ece0', bottom: '#3a5a8a', shoes: '#c84a3a', blush: '#e89080' },
    aunt: { key: 'zy-aunt', skin: '#e2b08a', hair: '#1a1410', hs: 'bob', top: '#7a4a6a', top2: '#e0d0d8', bottom: '#2a2a34', shoes: '#2a2020' },
    v1: { key: 'zy-v1', skin: '#c8946a', hair: '#2a2420', hs: 'short', top: '#d8d4c8', bottom: '#3a3a40', shoes: '#2a2a2a' },
    v2: { key: 'zy-v2', skin: '#e0b48e', hair: '#1a1410', hs: 'bun', top: '#5a7a6a', bottom: '#2a2a30', shoes: '#2a2020' },
    v3: { key: 'zy-v3', skin: '#c08a60', hair: '#c0c0b8', hs: 'short', top: '#4a5a7a', bottom: '#2a2a2a', shoes: '#1a1a1a' },
    bo: { key: 'zy-bo', skin: '#b8865e', hair: '#a8a8a0', hs: 'short', hat: 'straw', hatC: '#c9a35a', top: '#6a6a5a', top2: '#4a4a3e', bottom: '#2a2a28', shoes: '#3a3a30' },
    tian: { key: 'zy-tian', child: true, skin: '#c4c8c0', hair: '#141210', hs: 'messy', top: '#8a8678', top2: '#6a665a', bottom: '#5a564c', ghost: true, eye: '#050505', mouth: '#4a4a44',
      extra(g, d, fr, G, R) { if (d === 0) { R(5, G.tT + 2, 2, 2, '#6a665a'); R(10, G.tT + 4, 2, 1, '#6a665a'); R(6, G.hT + 6, 1, 1, '#7a766e'); } } },
    akong: { key: 'zy-akong', skin: '#bcc0ba', hair: '#d0d0c8', hs: 'short', top: '#3a4048', top2: '#2a3038', bottom: '#5a5e64', ghost: true, eye: '#1a1a1a', mouth: '#5a5650',
      extra(g, d, fr, G, R) { if (d === 0) { R(7, G.tT + 1, 2, 6, '#2a3038'); R(8, G.tT + 3, 1, 1, '#8a8a80'); R(8, G.tT + 5, 1, 1, '#8a8a80'); } } },
    gx: { key: 'zy-gx', skin: '#b8bcb4', hair: '#0a0a0c', hs: 'long', cover: true, top: '#d0d0c8', top2: '#b0b0a8', robe: true, ghost: true,
      extra(g, d, fr, G, R) {   // 手里提一盏白灯笼
        if (d === 3) return;
        const x = d === 0 ? 12 : 0;
        R(x + 1, G.tT + 2, 1, 3, '#2a2a2a'); R(x, G.tT + 5, 4, 6, '#f0ead8'); R(x, G.tT + 6, 4, 1, '#b8b0a0'); R(x, G.tT + 9, 4, 1, '#b8b0a0'); R(x + 1, G.tT + 7, 2, 1, '#ffe8a0');
      } },
    ying: { key: 'zy-ying', skin: '#16161e', hair: '#060608', hs: 'long', cover: true, top: '#0c0c12', top2: '#0c0c12', robe: true, ghost: true,
      extra(g, d, fr, G, R) { if (d === 0) { R(6, G.hT + 5, 1, 1, '#c8d4d4'); R(9, G.hT + 5, 1, 1, '#c8d4d4'); } } }
  };

  /* ================= 惊吓大头像 ================= */
  const FACES_ZY = {
    /* 身后的「东西」：肩上的灯正在灭，长发缝里两只白眼，一只手搭上来 */
    ying(R, a, t) {
      R(0, 0, 32, 32, '#030305');
      const gl = Math.max(0, 1 - a * 1.5); R(0, 19, 7, 7, `rgba(255,180,80,${.45 * gl})`); R(2, 20, 3, 4, `rgba(255,240,190,${.85 * gl})`);
      R(9, 2, 14, 24, '#0c0c12'); R(7, 7, 18, 25, '#0b0b10'); R(5, 14, 22, 18, '#08080c');
      for (let i = 0; i < 6; i++) R(8 + i * 3, 4 + (i % 2), 1, 22 + (i % 3) * 3, '#15151f');
      const eo = Math.round(a * 2); R(12, 13, 3, 1 + eo, '#d0dada'); R(18, 13, 3, 1 + eo, '#d0dada'); R(13, 13 + eo, 1, 1, '#000'); R(19, 13 + eo, 1, 1, '#000');
      R(14, 20, 4, 1, '#22222c');
      const hx = 19 - Math.round(a * 9);
      R(hx, 25, 12, 4, '#b4b8b8'); R(hx, 25, 12, 1, '#d0d4d4');
      for (let i = 0; i < 4; i++) R(hx - 3, 25 + i, 3 + (i % 2), 1, '#c4c8c8');
      R(hx + 2, 29, 9, 1, '#8a8e8e');
    },
    /* 孤棚顶上的孩子：灰扑扑的脸，眼睛黑得看不见底 */
    tian(R, a, t) {
      R(0, 0, 32, 32, '#160c06'); R(0, 25, 32, 7, '#3a1a0a'); for (let i = 0; i < 6; i++) R(i * 6 + ((t * 9) % 3), 27 - ((t * 7 + i * 3) % 4), 2, 2, 'rgba(255,140,50,.35)');
      R(9, 7, 14, 17, '#c4c6be'); R(10, 24, 12, 2, '#b2b4ac'); R(7, 13, 2, 4, '#b8bab2'); R(23, 13, 2, 4, '#b8bab2');
      R(8, 3, 16, 6, '#141210'); R(9, 9, 2, 3, '#141210'); R(13, 9, 3, 2, '#141210'); R(18, 9, 2, 3, '#141210'); R(21, 9, 2, 2, '#141210'); R(7, 5, 2, 6, '#141210'); R(23, 5, 2, 6, '#141210');
      R(11, 18, 3, 1, '#6a665e'); R(19, 20, 2, 2, '#7a766e'); R(15, 9, 2, 1, '#8a867e');
      const eh = 4 + Math.round(a * 2); R(11, 12, 4, eh, '#000'); R(18, 12, 4, eh, '#000'); R(12, 13, 1, 1, '#e8e8e0'); R(19, 13, 1, 1, '#e8e8e0');
      R(14, 21, 4, 1 + Math.round(a * 2), '#0a0606');
      R(5, 27, 22, 5, '#8a8678'); R(14, 27, 4, 2, '#6a665a'); R(9, 29, 2, 2, '#6a665a');
      R(4, 24, 6, 4, '#d8b040'); R(6, 25, 2, 2, '#c82a20');
    },
    /* 回头看见的阿公：灯光从底下照上来，眼睛慢慢睁开 */
    akong(R, a, t) {
      R(0, 0, 32, 32, '#04060a'); for (let i = 0; i < 4; i++) R(0, 26 + i * 2 + Math.round(Math.sin(t * 2 + i)), 32, 1, 'rgba(120,150,170,.25)');
      R(9, 6, 14, 18, '#a4a098'); R(9, 17, 14, 7, '#c4966a'); R(10, 24, 12, 1, '#a07a56');
      R(8, 4, 16, 4, '#d8d8d0'); R(8, 7, 2, 4, '#d8d8d0'); R(22, 7, 2, 4, '#d8d8d0');
      R(11, 10, 3, 1, '#7e7a70'); R(18, 10, 3, 1, '#7e7a70'); R(10, 18, 1, 3, '#8a6a4a'); R(21, 18, 1, 3, '#8a6a4a');
      if (a < .45) { R(11, 13, 4, 1, '#3a3630'); R(18, 13, 4, 1, '#3a3630'); }
      else { R(11, 12, 4, 3, '#e4e4dc'); R(18, 12, 4, 3, '#e4e4dc'); R(12, 13, 2, 1, '#8a8a8a'); R(19, 13, 2, 1, '#8a8a8a'); }
      R(13, 20, 6, 1, '#5a3a2a'); R(11, 15 + ((t * 5) % 7), 1, 2, 'rgba(200,220,230,.7)');
      R(6, 25, 20, 7, '#3a4048'); R(14, 25, 4, 3, '#2a3038'); R(15, 28, 1, 1, '#8a8a80'); R(15, 30, 1, 1, '#8a8a80');
      R(11, 28, 10, 4, '#f0a8b8'); R(13, 27, 6, 2, '#f8c8d0'); R(9, 26, 14, 1, 'rgba(255,200,120,.45)');
    }
  };

  /* ================= 自定义精灵 ================= */
  const SPR_ZY = {
    amabed(g, e, t, R) {
      box(R, 0, 0, 32, 30, '#5a3a24'); R(2, 2, 28, 26, '#e8e0cc');
      R(4, 3, 12, 6, '#f0ece0'); R(4, 8, 12, 1, '#d0ccc0');
      if (!e.empty) { R(6, 1, 8, 7, '#e2b48e'); R(6, 0, 8, 3, '#d8d6ce'); R(8, -2, 4, 2, '#d8d6ce'); R(7, 4, 2, 1, '#6a4a3a'); R(11, 4, 2, 1, '#6a4a3a'); R(9, 6, 2, 1, '#a06a5a'); }
      R(2, 9, 28, 19, '#8a3a3a'); R(2, 9, 28, 1, '#a04a4a');
      for (let i = 0; i < 6; i++) R(5 + (i % 3) * 8, 13 + ((i / 3) | 0) * 7, 3, 3, '#c86a5a');
      R(22, 14, 7, 5, '#9a4a4a'); R(23, 15, 5, 3, '#e8e4d8');
      R(0, 28, 2, 4, '#3a2416'); R(30, 28, 2, 4, '#3a2416');
    },
    chest(g, e, t, R) { box(R, 1, 4, 14, 11, '#6a4a2a'); R(1, 4, 14, 3, '#7a5a34'); R(7, 7, 2, 3, '#c8a050'); R(2, 11, 12, 1, '#5a3a22'); R(1, 2, 14, 2, '#5a3a22'); },
    gongma(g, e, t, R) {
      R(0, -22, 48, 3, '#4a140e'); R(2, -20, 44, 3, '#c8a040'); R(2, -18, 44, 20, '#5a1a12'); R(3, -17, 42, 18, '#8a2418');
      R(7, -14, 10, 14, '#3a0e0a'); R(10, -13, 4, 3, '#f0e8d8'); R(9, -10, 6, 9, '#f4f0e6'); R(11, -15, 2, 2, '#e8c040');
      R(21, -15, 18, 15, '#2a0c08'); for (let i = 0; i < 4; i++) { R(22 + i * 4, -13, 3, 12, '#141010'); R(23 + i * 4, -12, 1, 9, '#c8a040'); }
      R(40, -8, 6, 9, '#141414'); R(41, -7, 4, 6, '#b8b4a8'); R(42, -6, 2, 2, '#6a665c'); R(42, -3, 2, 2, '#3a3e48'); R(40, -9, 3, 2, '#000');
      box(R, 0, 2, 48, 13, '#6a2a1a'); R(1, 3, 46, 2, '#8a3a24'); R(2, 6, 44, 6, '#b8241c'); R(4, 8, 40, 1, '#e8c040');
      R(21, -2, 6, 4, '#8a7a4a'); R(20, -2, 8, 1, '#a89a5a');
      for (const x of [3, 43]) { R(x, -5, 2, 7, '#c82a20'); const f = Math.sin(t * 13 + x) > 0 ? 1 : 0; R(x, -8 + f, 2, 3 - f, '#ffcf5a'); }
      if (e.lit) for (let i = 0; i < 3; i++) { R(22 + i * 2, -8, 1, 6, '#8a3a2a'); R(22 + i * 2, -8, 1, 1, '#ff5a2a'); R(22 + i * 2 + Math.sin(t * 2 + i) * 1.5, -12 - ((t * 6 + i * 3) % 6), 1, 2, 'rgba(220,220,220,.4)'); }
    },
    zao(g, e, t, R) {
      box(R, 0, 2, 16, 13, '#8a5a3a'); R(1, 3, 14, 2, '#a06a48'); R(5, 9, 6, 5, '#1a0c08'); R(6, 11, 4, 2, '#c84a1a');
      R(2, -1, 12, 4, '#2a2a2a'); R(3, -2, 10, 1, '#4a4a4a');
      for (let i = 0; i < 3; i++) { const y = -4 - ((t * 10 + i * 6) % 14); R(4 + i * 3 + Math.sin(t * 2 + i), y, 2, 2, `rgba(230,230,230,${.3 - ((t * 10 + i * 6) % 14) / 50})`); }
    },
    lantai(g, e, t, R) {   // 八仙桌，桌上放着供品篮
      R(1, 12, 2, 4, '#3a2416'); R(29, 12, 2, 4, '#3a2416'); box(R, 0, 2, 32, 11, '#6b4a30'); R(1, 3, 30, 2, '#7b5a3a');
      if (e.lan !== 0) { box(R, 9, -6, 14, 9, '#a07a40'); R(11, -10, 10, 1, '#a07a40'); R(10, -9, 1, 4, '#a07a40'); R(21, -9, 1, 4, '#a07a40'); R(11, -7, 4, 3, '#c8302a'); R(16, -8, 5, 4, '#e8c040'); R(14, -9, 3, 2, '#e8e0c8'); }
    },
    yi(g, e, t, R) {   // 院子里的晾衣竿
      R(1, -14, 2, 29, '#5a4a2a'); R(61, -14, 2, 29, '#5a4a2a'); R(0, 13, 4, 2, '#3a2a1a'); R(60, 13, 4, 2, '#3a2a1a'); R(2, -13, 60, 1, '#8a7a5a');
      const w = Math.sin(t * 2) > .3 ? 1 : 0;
      if (e.n !== 0) {
        R(8, -12, 11, 9, '#3a5a8a'); R(6, -12, 2, 4 + w, '#3a5a8a'); R(19, -12, 2, 4, '#3a5a8a'); R(12, -12, 3, 1, '#2a4a7a');
        R(25, -12, 9, 11, '#e8e6dc'); R(25, -12, 9, 2, '#2a4a8a'); R(28, -10, 3, 1, '#2a4a8a');
        R(40, -12, 6, 12 + w, '#e8d0a0'); R(40, -3 + w, 6, 1, '#c8a070');
      }
      if (e.red) { const s = Math.round((Math.sin(t * 3) + 1) * 2); R(48, -12, 10, 11, '#c8302a'); R(46, -12 - s, 2, 4, '#c8302a'); R(58, -12 - s, 2, 4, '#c8302a'); R(51, -12, 4, 2, '#8a1a14'); R(49, -1, 8, 1, 'rgba(160,20,20,.6)'); R(52, 0, 1, 2 + (s % 2), 'rgba(160,190,200,.5)'); }
    },
    pen(g, e, t, R) { R(2, 7, 12, 7, '#6a7a8a'); R(2, 7, 12, 1, '#9aaab8'); R(3, 8, 10, 4, '#4a6a7a'); if (e.wet !== 0) { R(5, 8, 6, 3, '#c8302a'); R(9, 9, 3, 1, '#e8e0d8'); } },
    /* 庙门：燕尾脊、红墙、门神、两盏灯笼 */
    miaomen(g, e, t, R) {
      R(0, -2, 128, 18, '#8a2a1e'); for (let y = 0; y < 16; y += 4) R(0, y, 128, 1, '#7a2218');
      R(-6, -12, 140, 10, '#2e2422'); for (let x = -6; x < 134; x += 4) R(x, -12, 2, 10, '#3a2e2a'); R(-6, -3, 140, 1, '#1a1210');
      R(-2, -15, 132, 3, '#5a3a2a'); R(-10, -19, 10, 4, '#5a3a2a'); R(-14, -23, 6, 4, '#5a3a2a'); R(128, -19, 10, 4, '#5a3a2a'); R(136, -23, 6, 4, '#5a3a2a');
      R(56, -21, 16, 6, '#c8a040'); R(58, -20, 12, 4, '#3a1a10'); R(60, -19, 8, 1, '#e8c040'); R(60, -17, 8, 1, '#e8c040');
      R(44, -1, 40, 17, '#3a1a10'); R(46, 0, 17, 16, '#7a2a18'); R(65, 0, 17, 16, '#7a2a18'); R(63, 0, 2, 16, '#2a1008');
      for (const x of [49, 70]) { R(x, 3, 8, 10, '#c8a040'); R(x + 2, 4, 4, 3, '#e8c8a0'); R(x + 1, 8, 6, 4, '#2a5a8a'); }
      for (const x of [32, 92]) { R(x + 3, -2, 1, 3, '#2a2a2a'); R(x, 1, 7, 9, '#c8201a'); R(x + 1, 2, 5, 7, '#e83a2a'); R(x, 1, 7, 1, '#e8c040'); R(x, 9, 7, 1, '#e8c040'); R(x + 3, 10, 1, 3, '#e8c040'); }
    },
    /* 孤棚：四根抹了牛油的竹柱，顶上堆满供品，插着顺风旗 */
    gupeng(g, e, t, R) {
      for (const x of [5, 29, 49, 73]) { R(x, -44, 3, 76, '#9a8a5a'); R(x + 1, -44, 1, 76, 'rgba(255,240,200,.35)'); }
      for (let y = -30; y < 30; y += 14) { R(5, y, 71, 1, '#6a5a3a'); }
      R(0, -46, 80, 6, '#6a4a2a'); R(0, -46, 80, 1, '#8a6a3a'); R(0, -41, 80, 1, '#3a2a1a');
      R(4, -54, 12, 8, '#c8302a'); R(6, -56, 8, 2, '#d84a3a'); R(20, -56, 14, 10, '#e8d8a0'); R(22, -58, 10, 2, '#f0e4b0');
      R(38, -52, 10, 6, '#8a4a2a'); R(54, -54, 12, 8, '#d8a040'); R(68, -52, 8, 6, '#c8302a');
      for (let i = 0; i < 8; i++) R(3 + i * 10, -40, 2, 4, i % 2 ? '#e83a2a' : '#f0e0a0');
      if (e.flag !== 0) { R(40, -78, 1, 24, '#8a7a5a'); const w = Math.round(Math.sin(t * 5) * 1.5); R(41, -78, 11, 7 + w, '#e8c040'); R(43, -76, 6, 2, '#c8302a'); R(52, -77 + w, 2, 5, '#e8c040'); }
      R(0, 30, 80, 2, 'rgba(0,0,0,.35)');
    },
    denggao(g, e, t, R) {
      R(7, -60, 2, 75, '#8a7a4a'); R(3, 13, 10, 2, '#4a3a2a');
      R(1, -68, 14, 7, '#3a6a2a'); R(4, -72, 8, 4, '#4a7a34'); R(0, -64, 3, 5, '#2e5a24'); R(13, -64, 3, 5, '#2e5a24');
      R(9, -58, 6, 1, '#4a3a2a'); R(11, -57, 1, 3, '#2a2a2a');
      const b = Math.round(Math.sin(t * 1.5)); R(9 + b, -54, 6, 9, '#f0ead8'); R(9 + b, -51, 6, 1, '#c82a20'); R(10 + b, -49, 4, 2, '#ffe8a0');
      R(1, -40, 6, 8, '#c8201a'); R(2, -38, 4, 4, '#ff6a3a');
    },
    pudu(g, e, t, R) {   // 普渡坛：一长溜供桌
      R(0, 2, 160, 13, '#9a1c16'); R(0, 2, 160, 2, '#c8302a'); R(0, 6, 160, 1, '#e8c040'); R(0, 14, 160, 1, '#5a0e0a');
      for (let i = 0; i < 10; i++) R(4 + i * 16, 8, 8, 4, '#b8241c');
      if (e.empty) { for (let i = 0; i < 12; i++) R(4 + i * 13, 0, 3, 2, '#8a8478'); for (const x of [30, 90, 140]) { R(x, -3, 2, 5, '#e8e2cc'); } return; }
      for (let i = 0; i < 18; i++) {
        const x = 3 + i * 8.7 | 0, k = i % 4;
        if (k === 0) { R(x, -4, 7, 6, '#c8a040'); R(x + 1, -9, 5, 5, '#d8b050'); R(x + 2, -13, 3, 4, '#e8c060'); }
        else if (k === 1) { R(x, -3, 7, 5, '#e8e0c8'); R(x + 1, -6, 5, 3, '#d8d0b0'); }
        else if (k === 2) { R(x, -4, 3, 3, '#e8a030'); R(x + 3, -3, 3, 3, '#d86020'); R(x + 1, -6, 3, 3, '#f0c040'); }
        else { R(x, -5, 7, 7, '#c88a4a'); R(x + 5, -7, 2, 3, '#a8703a'); }
        R(x + 3, -16, 1, 7, '#8a3a2a'); if (Math.sin(t * 3 + i * 1.7) > -.3) R(x + 3, -16, 1, 1, '#ff6a2a');
        R(x + 4, -15, 3, 2, ['#e83a2a', '#e8c040', '#3a8a4a', '#f0f0e0'][i % 4]);
      }
      if (e.lan) { box(R, 92, -6, 12, 8, '#a07a40'); R(94, -9, 8, 1, '#a07a40'); R(94, -5, 4, 3, '#c8302a'); R(98, -6, 4, 4, '#e8c040'); R(97, -14, 1, 6, '#8a3a2a'); R(97, -14, 1, 1, '#ff6a2a'); }
    },
    dashi(g, e, t, R) {   // 纸扎大士爷：青面獠牙，头上一尊小观音
      if (e.burn) g.globalAlpha *= .85;
      R(0, -20, 16, 35, '#2a6a4a'); R(1, -20, 14, 2, '#e8c040'); R(2, -8, 12, 2, '#e8c040'); R(6, -18, 4, 30, '#c8302a');
      R(4, -33, 8, 12, '#2a4a9a'); R(5, -30, 2, 2, '#f0e040'); R(9, -30, 2, 2, '#f0e040'); R(6, -25, 1, 2, '#fff'); R(9, -25, 1, 2, '#fff'); R(7, -25, 2, 4, '#d82020');
      R(4, -36, 1, 3, '#e8e0c0'); R(11, -36, 1, 3, '#e8e0c0'); R(3, -39, 10, 4, '#d84a1a'); R(5, -41, 6, 2, '#e86a2a');
      R(6, -47, 4, 6, '#f0ece0'); R(7, -49, 2, 2, '#f0d8b0');
      R(14, -28, 1, 22, '#8a6a3a'); R(15, -28, 5, 10, '#e8e0c0'); R(16, -26, 3, 1, '#c82a20');
      R(1, 14, 14, 2, '#3a2a1a');
      if (e.burn) for (let i = 0; i < 9; i++) { const h = 8 + ((t * 30 + i * 7) % 14); R(i * 2 - 1, 12 - h - (i % 3) * 10, 3, h, i % 2 ? 'rgba(255,170,40,.85)' : 'rgba(255,90,20,.8)'); }
    },
    ashpile(g, e, t, R) { R(1, 9, 14, 5, '#3a3632'); R(3, 7, 10, 3, '#5a5650'); R(5, 6, 6, 2, '#7a766e'); if (Math.sin(t * 2) > .5) R(7, 8, 1, 1, '#ff6a2a'); },
    xitai(g, e, t, R) {   // 戏台
      R(-4, -22, 136, 8, '#2a1e1a'); R(-8, -24, 8, 4, '#2a1e1a'); R(128, -24, 8, 4, '#2a1e1a'); R(-4, -15, 136, 2, '#c8a040');
      R(0, -13, 128, 34, '#6a1414'); for (let x = 8; x < 128; x += 16) R(x, -12, 2, 32, '#7a1e1e'); R(36, -10, 56, 3, '#c8a040');
      R(2, -14, 5, 48, '#a02a1a'); R(121, -14, 5, 48, '#a02a1a');
      R(0, 20, 128, 9, '#8a6a40'); R(0, 20, 128, 1, '#a8885a');
      R(0, 29, 128, 19, '#4a2e18'); for (let x = 6; x < 128; x += 20) { R(x, 33, 12, 11, '#5a3a20'); R(x + 3, 36, 6, 5, '#c8a040'); }
      for (const x of [16, 112]) { R(x, -12, 1, 6, '#2a2a2a'); R(x - 3, -6, 7, 5, '#f0f0d0'); }
      if (e.empty) { R(60, 6, 1, 15, '#8a7a5a'); R(58, 4, 5, 3, '#c8a040'); return; }
      const sw = Math.round(Math.sin(t * 2) * 1.5);
      R(40 + sw, 2, 10, 18, '#d88a20'); R(41 + sw, 2, 8, 2, '#a85a10'); R(42 + sw, -6, 6, 7, '#e8c8a0'); R(43 + sw, -3, 1, 1, '#2a1a10'); R(46 + sw, -3, 1, 1, '#2a1a10');
      R(52 + sw, -10, 1, 30, '#8a7a5a'); R(50 + sw, -12, 5, 3, '#c8a040'); R(51 + sw, -9, 3, 1, '#e8c040');
      const kn = Math.round(Math.sin(t * 3) * 1);
      R(78, 10 + kn, 12, 10, '#e8e8e0'); R(79, 2 + kn, 10, 9, '#0a0a0a'); R(81, 5 + kn, 6, 5, '#e0d8d0'); R(82, 7 + kn, 1, 1, '#a01010'); R(85, 7 + kn, 1, 1, '#a01010');
      R(72, 12 - kn, 6, 2, '#e0d8d0'); R(70, 11 - kn, 2, 2, '#e0d8d0');
    },
    bench2(g, e, t, R) { R(0, 6, 48, 4, '#7a5a3a'); R(0, 4, 48, 2, '#9a7a4a'); R(2, 10, 2, 5, '#4a3420'); R(44, 10, 2, 5, '#4a3420'); R(22, 10, 3, 5, '#4a3420'); },
    jinlu(g, e, t, R) {
      R(1, -10, 14, 25, '#8a3a2a'); for (let y = -8; y < 14; y += 3) R(1, y, 14, 1, '#6a2a1e'); R(5, -18, 6, 8, '#6a2a1a'); R(4, -19, 8, 1, '#4a1a10');
      R(4, 2, 8, 7, '#1a0a06'); const f = Math.sin(t * 11) > 0 ? 1 : 0; R(5, 5 - f, 6, 3 + f, '#ff7a2a'); R(6, 6, 4, 2, '#ffd060');
      for (let i = 0; i < 3; i++) { const y = -22 - ((t * 8 + i * 5) % 14); R(6 + Math.sin(t + i) * 2, y, 3, 2, `rgba(160,150,140,${.35 - ((t * 8 + i * 5) % 14) / 45})`); }
    },
    huiquan(g, e, t, R) {   // 门口的纸灰圈
      R(4, 2, 8, 1, '#c8c0b0'); R(2, 3, 2, 1, '#c8c0b0'); R(12, 3, 2, 1, '#c8c0b0'); R(1, 4, 1, 8, '#c8c0b0'); R(14, 4, 1, 8, '#c8c0b0'); R(2, 12, 2, 1, '#c8c0b0'); R(12, 12, 2, 1, '#c8c0b0'); R(4, 13, 8, 1, '#c8c0b0');
      R(3, 5, 10, 7, '#2e2a26'); R(4, 6, 8, 5, '#3e3832'); R(5, 7, 3, 2, '#5a5650'); R(9, 8, 2, 2, '#6a665e');
      if (!e.off) { for (let i = 0; i < 5; i++) { const ph = (t * 1.3 + i * .37) % 1, x = 4 + ((i * 5 + 3) % 8); if (ph < .6) R(x, 10 - ph * 8, 1, 1, ph < .3 ? '#ffd070' : '#ff7a2a'); } R(6, 8, 2, 1, Math.sin(t * 7) > 0 ? '#ff6a1a' : '#c84a14'); R(9, 9, 1, 1, '#ff8a2a'); }
    },
    spot(g, e, t, R) {   // 林家每年烧纸的地方
      if (!e.fire) { for (let i = 0; i < 3; i++) { R(3 + i, 4 + i, 10 - i * 2, 1, 'rgba(160,150,140,.3)'); R(3 + i, 12 - i, 10 - i * 2, 1, 'rgba(160,150,140,.3)'); } R(7, 7, 2, 2, 'rgba(200,190,170,.5)'); return; }
      R(4, 2, 8, 1, '#e0d8c8'); R(2, 3, 2, 1, '#e0d8c8'); R(1, 4, 1, 8, '#e0d8c8'); R(2, 12, 2, 1, '#e0d8c8'); R(4, 13, 8, 1, '#e0d8c8'); R(12, 3, 2, 1, '#e0d8c8'); R(12, 12, 2, 1, '#e0d8c8');
      if (e.fire === 1) {
        R(4, 6, 8, 5, '#2a2420');
        for (let i = 0; i < 5; i++) { const h = 4 + ((t * 20 + i * 7) % 6); R(3 + i * 2, 11 - h, 2, h, i % 2 ? '#ffb040' : '#ff6a1a'); R(4 + i * 2 + 1, 10 - h, 1, 2, '#ffe080'); }
        R(15, 5, 2, 2, '#d8b040'); R(14, 10, 2, 1, '#d8b040');
      } else R(4, 6, 8, 5, '#6a665e');
    },
    huopen(g, e, t, R) { R(2, 9, 12, 5, '#3a3a3a'); R(1, 8, 14, 1, '#5a5a5a'); R(3, 8, 10, 2, '#1a0a06'); const f = Math.sin(t * 9) > 0 ? 1 : 0; R(4, 7 - f, 3, 2 + f, '#ff6a1a'); R(8, 6 + f, 3, 3 - f, '#ffa030'); R(5, 7, 6, 1, '#ffd060'); R(12, 10, 3, 3, '#4a7a3a'); R(13, 9, 2, 1, '#5a8a44'); },
    gui(g, e, t, R) { R(3, 13, 10, 2, '#3a6a2a'); R(4, 8, 8, 6, '#d82a2a'); R(5, 7, 6, 1, '#e84040'); R(6, 9, 4, 1, '#f06060'); R(6, 11, 4, 1, '#a81818'); },
    luo(g, e, t, R) { R(2, 10, 4, 3, '#d82a2a'); R(9, 8, 5, 4, '#e8d8a0'); R(6, 12, 3, 2, '#c8a040'); R(11, 13, 3, 1, '#8a4a2a'); },
    lstring(g, e, t, R) {   // 横过老街的一串红灯笼
      const n = e.w; for (let i = 0; i < n * 16; i += 2) R(i, -10 + Math.round(Math.sin(i / (n * 16) * Math.PI) * 4), 2, 1, '#2a1a10');
      for (let i = 0; i < n; i++) { const x = i * 16 + 5, y = -8 + Math.round(Math.sin((x + 3) / (n * 16) * Math.PI) * 4), b = Math.round(Math.sin(t * 1.6 + i)); R(x + 1, y + b, 1, 2, '#2a2a2a'); R(x - 1, y + 2 + b, 6, 6, '#c8201a'); R(x, y + 3 + b, 4, 4, '#ff5a3a'); R(x - 1, y + 2 + b, 6, 1, '#e8c040'); }
    },
    dizang(g, e, t, R) {   // 地藏王菩萨像
      box(R, 0, 4, 32, 11, '#6a2a1a'); R(2, 6, 28, 2, '#e8c040'); R(4, 9, 24, 5, '#b8241c');
      R(9, -14, 14, 18, '#c89a3a'); R(10, -13, 12, 16, '#d8aa4a'); R(12, -22, 8, 8, '#e8c8a0'); R(14, -19, 1, 1, '#3a2a1a'); R(17, -19, 1, 1, '#3a2a1a');
      R(11, -25, 10, 4, '#c8a040'); for (let i = 0; i < 5; i++) R(11 + i * 2, -27, 1, 2, '#e8c040');
      R(24, -24, 1, 28, '#8a7a5a'); R(22, -27, 5, 4, '#c8a040'); R(23, -26, 3, 2, '#2a1a10');
      R(12, -6, 4, 3, '#f0f0e8'); R(13, -5, 2, 1, '#ffffff');
      R(4, 1, 3, 3, '#8a7a4a'); R(25, 1, 3, 3, '#8a7a4a');
    },
    qiantong(g, e, t, R) { box(R, 0, 4, 16, 11, '#6a3a20'); R(5, -4, 6, 9, '#a87a3a'); R(5, -4, 6, 1, '#c89a4a'); for (let i = 0; i < 5; i++) R(6 + i, -9 + (i % 2), 1, 5, '#d8b870'); R(2, 6, 3, 2, '#c8a040'); },
    bei(g, e, t, R) { R(1, 12, 14, 3, '#5a5a56'); R(2, -14, 12, 26, '#7a7a74'); R(3, -13, 10, 24, '#8a8a84'); R(3, -16, 10, 2, '#6a6a64'); for (let i = 0; i < 6; i++) { R(4, -10 + i * 3, 3 + (i % 3) * 2, 1, '#9a2a1a'); R(9, -10 + i * 3, 2, 1, '#9a2a1a'); } R(6, 10, 4, 2, '#e8c040'); },
    gmd(g, e, t, R) {   // 光明灯
      box(R, 0, -12, 48, 27, '#5a1a12'); R(2, -10, 44, 23, '#3a0c08');
      for (let r = 0; r < 4; r++) for (let c = 0; c < 9; c++) { const x = 4 + c * 5, y = -8 + r * 5, on = !(r === 3 && c === 8) && Math.sin(t * 2 + r * 3 + c) > -.95; R(x, y, 3, 3, on ? '#ffcf6a' : '#3a2a20'); R(x, y + 3, 3, 1, '#c8a040'); }
    },
    hedeng(g, e, t, R) {   // 莲花河灯
      const b = Math.round(Math.sin(t * 2 + e.px * .07)), big = e.big;
      const c1 = ['#f0a0b0', '#f8e8e0', '#f0c060', '#e87a7a'][(e.c || 0) % 4], c2 = shade(c1, -.25);
      R(2, 11 + b, 12, 2, 'rgba(255,200,120,.25)');
      R(3, 8 + b, 10, 4, c2); R(2, 9 + b, 2, 2, c1); R(12, 9 + b, 2, 2, c1); R(4, 6 + b, 2, 3, c1); R(10, 6 + b, 2, 3, c1); R(7, 5 + b, 2, 3, c1);
      if (big) { R(5, 9 + b, 6, 2, '#f8f0e0'); R(6, 9 + b, 4, 1, '#3a2a1a'); }
      const f = Math.sin(t * 12 + e.px) > 0 ? 1 : 0; R(7, 3 + b + f, 2, 3 - f, '#ffd060'); R(7, 4 + b, 1, 1, '#fff6d0');
    }
  };
  const TILES_ZY = {
    paddy: { solid: true, paint(R, X, Y) { R(0, 0, 16, 16, '#14281e'); R(0, 0, 16, 1, '#1e3626'); for (let i = 0; i < 4; i++) { const x = 1 + i * 4 + ((Y % 2) * 2); R(x, 3, 1, 4, '#3a6a32'); R(x + 1, 2, 1, 3, '#4a7a3a'); R(x, 10, 1, 4, '#3a6a32'); R(x - 1, 9, 1, 3, '#4a7a3a'); } if (hash(X, Y, 7) < .3) R((hash(X, Y, 8) * 12) | 0, 7, 3, 1, 'rgba(150,180,190,.25)'); } },
    stepz: { solid: false, paint(R, X, Y) { R(0, 0, 16, 16, '#4a5650'); R(0, 0, 16, 3, '#6a726a'); R(0, 7, 16, 2, '#5a645e'); R(0, 13, 16, 3, '#2e3a36'); R(0, 10, 16, 2, '#3a5a44'); for (let i = 0; i < 3; i++) R((hash(X, Y, 10 + i) * 13) | 0, 4 + i * 3, 3, 1, '#565e58'); } }
  };

  /* ================= 地图里的通用实体 ================= */
  const yingEnt = id => ({ id, x: 1, y: 1, spr: '@ying', hidden: true, solid: false, alpha: .8, s: { n: 0 } });
  const ashDesc = ['人家门口烧纸的灰圈，火还没熄透，纸灰一拱一拱的。\n莫踩。', '一圈白灰，圈里压着没烧完的金纸。旁边摆着两只小碗，一碗饭，一碗清水。', '灰圈边上插着三炷香。香头一明一暗，像有人蹲在那儿抽烟。'];

  defChapter({
    id: 'zhongyuan', n: 18, title: '中元·放河灯', sub: '七月半，鬼门开。阿嬷单子上的规矩，一条也莫犯——河灯放下去，莫回头。', origin: '中国中元节习俗', color: '#2a1e3e',
    icon: '@me', iconDir: 3, iconX: 30, amb: 'night', floor: 'wood', wall: 'brick', dark: .5, plr: 3.6,
    endings: { all: '送走所有人', blank: '不写名的灯', look: '回头', follow: '带回家' },
    people: PEOPLE_ZY,
    faces: FACES_ZY,
    items: {
      list: { name: '阿嬷的单子', desc: '十条规矩，阿嬷的字歪歪扭扭。（在档案里可以再看）' },
      zhi: { name: '一沓纸钱', desc: '金纸、银纸，还有一叠给阿公的「库钱」，用红绳捆着。' },
      deng: { name: '三盏莲花河灯', desc: '阿嬷用彩纸折的。一盏写着林氏历代祖先，一盏写着林公德水，第三盏空着。' },
      fan: { name: '一碗地瓜粥', desc: '配一碟菜脯蛋，还烫手。给阿嬷的。' },
      lan: { name: '普渡供品篮', desc: '罐头、米粉、饼干、一包白米、两个红龟粿。要摆到庙口的普渡坛上。' },
      gui: { name: '红龟粿', desc: '阿峰在孤棚底下抢到的，锣响三声以后抢的。吃了保平安。' }
    },
    notes: {
      list: { title: '阿嬷的单子', text: '（阿嬷的字歪歪扭扭，有两个字写的是拼音）\n\n七月半　小满记牢\n一、天黑前收衣服，夜里晾外头会被「借」去穿。\n二、筷子莫插饭上，那是供死人的。\n三、路上的钱莫捡，是好兄弟的买路钱。\n四、莫拍人肩。人头顶、两肩各一盏灯，拍灭招东西。有人拍你，莫扭头。\n五、别人门口的纸灰莫踩。\n六、看戏莫坐头排，留给好兄弟。\n七、抢孤，锣不响三声莫伸手。\n八、给阿公烧纸：画圈，口朝后山，圈外撒几张给没人管的。\n九、河灯放下去莫回头，回家莫跑。\n十、犯了忌的，进门前跨火盆。\n\n（背面）三盏灯：一盏祖先，一盏你阿公，一盏不写名——你阿公每年都放，问他，他不说。' },
      zupu: { title: '林氏族谱（抄本）', text: '（一本线装的旧册子，书脊用麻线重新缝过）\n\n字辈：德　永　昌　盛　　世　泽　绵　长\n\n……\n第十七世　德字辈\n　长子　德水　娶陈氏，生子永福、永贵\n　次子　▇▇　殇，不入谱\n\n第十八世　永字辈\n　永福　生女昌满\n　永贵　生子昌峰\n……\n\n（「次子」底下的名字被人用墨涂掉了。墨团旁边有一道很淡的铅笔印，像是有人想补上什么，又擦掉了。）' },
      photo: { title: '阿公的旧木箱', text: '（箱底压着一张发黄的小照片，和一本记账的旧本子）\n\n照片上，两个男孩蹲在庙口的石阶上。大的十来岁，搂着一个光脚的小的。\n背面用钢笔写着：「阿兄同阿添　壬辰年中元」\n\n本子最后一页，是阿公的字，写得很乱：\n\n「又到七月半。阿添那年九岁，是我带他去看抢孤的。孤棚塌下来的时候，我松开了他的手。\n阿爸说，殇了的孩子不能上族谱，名字也莫再叫，叫了他走不了。\n四十多年，我每年放一盏灯，不敢写他的名字。他吃不到家里的饭，只能去庙口跟好兄弟抢。\n阿添，阿兄对不住你。」' },
      bei: { title: '重修孤棚记（庙里的石碑）', text: '（青石碑，字口里填着红漆，有几处已经剥落）\n\n……溪口宫中元普渡，旧有抢孤之俗，由来久矣。\n\n壬辰年中元，孤棚倾，伤者十余人，殇童一，林姓，年九岁。乡人痛之，罢抢孤十年。\n\n今重修孤棚，易其柱，固其基，复其旧俗。愿孤魂各得其所，抢者平安。\n\n　　　　　　　　　　　　甲辰年　溪口宫董事会立\n\n（碑脚下，有人供了一小碟水果糖。）' }
    },
    legend: '中元节在农历七月十五，名字来自道教的「三元」：正月十五上元天官赐福，七月十五中元地官赦罪，十月十五下元水官解厄。佛教在同一天过盂兰盆节，出自《佛说盂兰盆经》：目连的母亲死后堕入饿鬼道，饭到嘴边就化成火炭，佛陀教目连在七月十五供养十方僧众，才救出母亲。「目连救母」后来成了中元前后最常演的戏。民间则叫它「七月半」「鬼节」，是祭祖的大日子。闽台一带把整个七月叫「鬼月」，一般说七月初一开鬼门、月底关鬼门，十五前后最热闹；各地的说法和日子并不一致。\n\n闽南和台湾的中元普渡，是给没人祭祀的孤魂（客气地称「好兄弟」）办的一场宴席：家家户户把供品摆上庙口的普渡坛，每样插香；纸扎的「大士爷」（面燃大士，一般说是观音的化身）坐镇监督，普渡结束时焚化。竖「灯篙」是为了召请四方孤魂，「放水灯」是为了照引水里的亡魂上岸受供，基隆中元祭的放水灯就很有名。「抢孤」则是普渡结束后，众人攀上高高的孤棚抢夺供品，据说抢到的东西能保平安；宜兰头城、屏东恒春的抢孤最出名，头城的抢孤曾因发生意外停办多年，后来才恢复。\n\n鬼月的禁忌流传很广，各地版本不一：夜里不晾衣服，免得被「借穿」；不拍人肩膀，因为民间说人头顶和两肩各有一盏「灯」（也有说「三把火」），拍灭了就容易招阴；路上的钱不捡，那是给孤魂的「买路钱」；看戏不坐头排；筷子不插在饭上；不踩别人烧过的纸灰；放了河灯不回头；从丧事或阴气重的地方回家，进门前跨火盆、用抹草水洗手。给祖先烧纸时在地上画圈、留一个口朝着祖坟方向，圈外再撒一些给孤魂，则是华北、江淮一带常见的做法。这些都是民间信仰与习俗，并无实据，讲的大多是对亡者的敬重和对生者的叮嘱。\n\n（本章把闽南的普渡、抢孤和北方烧纸画圈等不同地方的习俗，放进了同一个虚构的小镇。溪口镇、溪口宫、林家与族谱字辈、阿添与「壬辰年孤棚倒塌」、石碑碑文、阿嬷单子里的条目组合、「灯灭三盏」与「归途的白灯笼」等规则，以及所有人物和结局，均为游戏虚构。）',
    start: { map: 'home', x: 8, y: 12, dir: 3 },
    async intro(S) {
      await S.card('第十八夜　中元·放河灯', '1997年　农历七月十五　闽南·溪口镇', '七月半，鬼门开。\n\n阿嬷说，这一夜，路上走的不全是人。\n所以规矩多：衣服要收，钱莫捡，人莫拍。\n河灯放下去，莫回头。\n\n今年，是阿公走后的头一个七月半。\n阿嬷扭了脚，下不了床。\n送祖宗的事，头一回落到了我身上。');
    },
    resume: {
      home: async S => goal(S),
      night: async S => { if (DEATHS) await S.think('（单子在档案里可以再看：钱莫捡、肩莫拍、灰莫踩、头排莫坐、锣不响三声莫伸手。）'); goal(S); },
      qg: async S => { if (DEATHS) await S.think('（锣响三声以前，什么都莫碰。）'); return qgSeq(S); },
      river: async S => goal(S),
      ret: async S => {
        if (DEATHS) await S.think('（白灯笼过去了再穿过田埂。莫跑，也莫往回转身——一直往前走。）');
        startReturn(S, true);
      },
      back: async S => { if (S.f.ying && !S.f.kua) await S.think('（单子第十条：犯了忌的，进门前跨火盆。火盆就在院门外。）'); goal(S); }
    },
    thumb(g, w, h) {   // 黑水上漂着三盏莲花灯；右边是背对着你、头顶和肩上亮着三盏小灯的女孩
      const R = (x, y, ww, hh, c) => { g.fillStyle = c; g.fillRect(x, y, ww, hh); };
      R(0, 44, w, h - 66, '#0a1220'); for (let i = 0; i < 10; i++) R((i * 29) % (w - 10), 48 + (i * 7) % 18, 10, 1, 'rgba(160,190,220,.18)');
      [[10, 50, '#f0a0b0'], [34, 56, '#f8e8e0'], [58, 50, '#f0c060']].forEach(([x, y, c]) => {
        R(x - 4, y - 6, 22, 16, 'rgba(255,190,90,.12)'); R(x, y + 4, 14, 3, c); R(x + 1, y + 1, 3, 4, c); R(x + 10, y + 1, 3, 4, c); R(x + 5, y, 4, 5, c); R(x + 6, y - 4, 2, 4, '#ffd060'); R(x - 2, y + 8, 18, 1, 'rgba(255,200,120,.3)');
      });
      for (let i = 0; i < 5; i++) R(6 + i * 14, 18 + (i % 2) * 6, 2, 3, 'rgba(240,240,220,.5)');
    },
    sprites: Object.assign({
      bigdrum(g, e, t, R) { R(2, 9, 2, 6, '#4a2a18'); R(12, 9, 2, 6, '#4a2a18'); R(1, 0, 14, 10, '#9a2a1a'); R(2, 0, 12, 2, '#e8d8b0'); R(1, 9, 14, 1, '#5a1a10'); for (let i = 0; i < 5; i++) R(2 + i * 3, 3, 1, 1, '#e8c050'); },
      feet(g, e, t, R) { const w = Math.sin(t * 4) > 0 ? 1 : 0; R(3, 12, 4, 3, '#c4c8c0'); R(9, 12 + w, 4, 3, '#c4c8c0'); R(3, 14, 4, 1, '#8a8e86'); R(9, 14 + w, 4, 1, '#8a8e86'); }
    }, SPR_ZY),
    tiles: TILES_ZY,
    maps: {
      /* ---------------- 阿嬷家（黄昏 → 天黑） ---------------- */
      home: {
        amb: 'wind', dark: .3, plr: 3.8, floor: 'wood', wall: 'wood',
        tileOpts: { woodC: '#6b4a2f' },
        rows: [
          '##################',
          '##################',
          '#wwwww#wwwwwwwwww#',
          '#wwwww#wwwwwwwwww#',
          '#wwwwwwwwwwwwwwww#',
          '#wwwww#wwwwwwwwww#',
          '#######..#########',
          '#######..#########',
          '#kkkkkkkkkkkkkkkk#',
          '#kkkkkkkkkkkkkkkk#',
          '#kkkkkkkkkkkkkkkk#',
          '#kkkkkkkkkkkkkkkk#',
          '#kkkkkkkkkkkkkkkk#',
          '########kk########'],
        ents: [
          { id: 'amabed', x: 1, y: 2, w: 2, h: 2, spr: 'amabed', on: S => S.f.ph === 'end' ? S.narr('阿嬷的床。被子掀开着，还是温的。') : amaTalk(S) },
          { id: 'chest', x: 5, y: 2, spr: 'chest', async on(S) {
            if (!S.f.gotList) return S.narr('阿公的旧木箱，就放在阿嬷床脚边上。阿嬷说，里头是阿公的东西，谁也没动过。');
            await S.note('photo'); S.f.readPhoto = true;
            if (S.once('photoThink')) await S.think('阿添……阿公的弟弟？\n每年那盏不写名的灯，是给他的。');
          } },
          { x: 3, y: 1, spr: 'window', on: S => S.narr(S.f.dark ? '窗外黑透了。隔壁屋顶上，飘过来一缕一缕烧纸的烟。' : '窗外的天红得发紫。隔壁屋顶上，已经有人在烧纸了。') },
          { x: 1, y: 5, spr: 'shelf', on: S => S.narr('床头的小柜子上摆着跌打药油、一卷膏药、阿嬷的老花镜。\n还有一个相框，扣着放的。翻过来——是阿公年轻时候的照片。') },
          { id: 'gongma', x: 11, y: 2, w: 3, spr: 'gongma', light: { r: 2, col: 'rgba(255,110,60,.16)', flick: true }, on: S => incense(S) },
          { id: 'lantai', x: 11, y: 4, w: 2, spr: 'lantai', s: { lan: 1 }, async on(S) {
            const f = S.f, e = S.ent('lantai');
            if (e.s.lan === 0) return S.narr('八仙桌上空了，只剩一圈篮子底压出来的印子。');
            if (!f.gotList) return S.narr('八仙桌上放着一篮子普渡的供品：罐头、米粉、饼干、红龟粿。');
            if (!f.dark) return S.narr('一篮子普渡的供品。\n阿嬷说，家里的事做完了，再提去庙口。');
            e.s.lan = 0; S.give('lan');
            goal(S, '把供品篮提去庙口普渡坛（出院门往右）');
          } },
          { x: 10, y: 4, spr: 'chair', on: S => S.narr('阿公的椅子。椅背上搭着他那件灰布褂子，阿嬷一直没舍得收。') },
          { x: 13, y: 4, spr: 'chair', on: S => S.narr('一把竹椅。坐上去吱呀一声。') },
          { id: 'zupu', x: 8, y: 2, spr: 'bookshelf', async on(S) {
            await S.note('zupu'); S.f.readZupu = true;
            if (S.once('zupuThink')) await S.think('「次子，殇，不入谱」……\n阿公还有个弟弟？名字被谁涂掉了？');
          } },
          { id: 'zao', x: 16, y: 2, spr: 'zao', light: { r: 1.5, col: 'rgba(255,140,60,.12)', flick: true }, async on(S) {
            const f = S.f;
            if (!f.gotList) return S.narr('灶上煨着一锅地瓜粥，咕嘟咕嘟冒着泡。');
            if (f.tFan || S.has('fan')) return S.narr('锅里的地瓜粥还温着。');
            S.give('fan');
            await S.narr('你盛了一碗地瓜粥，又夹了一碟菜脯蛋。');
            goal(S, homeGoal(S));
          } },
          { x: 14, y: 1, spr: 'wallclock', on: S => S.narr(S.f.dark ? '挂钟：七点二十。\n钟摆的声音，比平时响。' : '挂钟：六点四十。\n阿嬷说，天一黑，就莫在外头晾东西。') },
          { id: 'win1', x: 9, y: 1, spr: 'window', on: S => S.narr('厅里的窗户。窗台上摆着一排晒干的抹草。') },
          { x: 15, y: 5, spr: 'plant', on: S => S.narr('一盆抹草。阿嬷说，抹草辟邪，鬼月出门前摘两片放口袋里。') },
          { id: 'yi', x: 2, y: 8, w: 4, spr: 'yi', s: { n: 3 }, on: S => clothes(S) },
          { id: 'afeng', x: 12, y: 10, spr: '@afeng', dir: 2, on: S => fengHome(S) },
          { id: 'pen', x: 13, y: 10, spr: 'pen', s: { wet: 1 }, on: S => S.narr(S.ent('pen').s.wet === 0 ? '一只铝盆，盆底剩一点肥皂水。' : '铝盆里泡着阿峰那件红背心，肥皂沫还没冲干净。') },
          { x: 16, y: 8, spr: 'well', on: S => S.narr('院子里的老井，盖着木板。\n阿嬷说，七月里莫往井里看。') },
          { x: 1, y: 12, spr: 'plant', on: S => S.narr('一盆茉莉，开了两朵。') },
          { x: 7, y: 5, spr: 'invisible', solid: false, on: S => S.narr('通往院子的门槛。门框上贴着一张褪色的红纸。') },
          { id: 'amaS', x: 8, y: 9, spr: '@ama', hidden: true, dir: 0, light: { r: 2.2, col: 'rgba(255,170,90,.18)', flick: true }, on: S => S.say('阿嬷', '回来就好。') },
          yingEnt('yingH'),
          ...[8, 9].map(x => ({ x, y: 13, spr: 'invisible', async touch(S) {
            const f = S.f;
            if (f.ph === 'end') return S.pos(x, 12, 3);
            if (!f.gotList) { await S.say('阿嬷', '小满？进来，阿嬷有话交代。'); return S.pos(x, 12, 3); }
            if (!f.dark) { await S.think('天黑前要做完的事还没做完：' + homeLeft(S).join('、') + '。'); return S.pos(x, 12, 3); }
            if (!S.has('lan') && !S.f.placed) { await S.think('供品篮还在厅里的桌上。'); return S.pos(x, 12, 3); }
            await S.go('street', 1, 14, 2);
          } }))
        ],
        async enter(S, first) {
          const f = S.f;
          if (first) {
            f.lamps = 3; f.ph = 'dusk';
            await S.narr('溪口镇，林家老厝。\n太阳落到院墙后头去了，天边红得发紫。');
            await S.say('阿嬷', '小满——是小满回来了吧？到阿嬷房里来。');
            goal(S, '去阿嬷房里（进门往左）');
            return;
          }
          if (f.ph === 'back') return homeEnd(S);
          syncYing(S); updPlr(S);
        }
      },

      /* ---------------- 老街 · 庙口 ---------------- */
      street: {
        amb: 'market', dark: .74, plr: 3.6, floor: 'stone', wall: 'brick',
        tileOpts: { fenceBase: 'stone' },
        rows: [
          '################################',
          '################################',
          '#kkkkkkkkkkkkkkkkkkkkkkkkkkkkkk#',
          '#kkkkkkkkkkkkkkkkkkkkkkkkkkkkkk#',
          '#kkkkkkkkkkkkkkkkkkkkkkkkkkkkkk#',
          '#kkkkkkkkkkkkkkkkkkkkkkkkkkkkkk#',
          '#kkkkkkkkkkkkkkkkkkkkkkkkkkkkkk#',
          '#kkkkkkkkkkkkkkkkkkkkkkkkkkkkkk#',
          '#kkkkkkkkkkkkkkkkkkkkkkkkkkkkkk#',
          '#kkkkkkkkkkkkkkkkkkkkkkkkkkkkkk#',
          '###########kkkkkkkkkk###########',
          '###########kkkkkkkkkk###########',
          '###########kkkkkkkkkk###########',
          'kkkkkkkkkkkkkkkkkkkkkkkkkkkkkfff',
          'kkkkkkkkkkkkkkkkkkkkkkkkkkkkkfff',
          'kkkkkkkkkkkkkkkkkkkkkkkkkkkkkfff',
          '###########kkkkkkkkkk###########',
          '###########kkkkkkkkkk###########'],
        ents: [
          { x: 12, y: 1, w: 8, spr: 'miaomen', light: { r: 3, col: 'rgba(255,90,60,.14)', dy: 10 } },
          { id: 'mdoor', x: 15, y: 1, w: 2, spr: 'invisible', solid: true, on: S => S.go('miao', 7, 9, 3) },
          { id: 'gupeng', x: 3, y: 5, w: 5, h: 2, spr: 'gupeng', s: { flag: 1 }, async on(S) {
            if (S.f.ph === 'back') return S.narr('孤棚上空了，四根柱子上的牛油被人蹭得一道一道。\n顶上的顺风旗没了。');
            S.focus(5, 2); await S.wait(500);
            await S.narr('孤棚有两层楼高。四根竹柱子涂满了牛油，顶上的木台堆满了粿、肉、米包，正中插着一面黄色的顺风旗。');
            S.focus(null);
            if (S.once('gupengThink')) await S.think('柱子是新换的，底座的水泥也是新的。\n……为什么要换？');
          } },
          { x: 9, y: 3, spr: 'denggao', light: { r: 2.2, col: 'rgba(255,230,180,.14)', dy: -36 }, on: S => S.narr('灯篙。高高的竹竿顶上留着竹叶，挂着一盏白灯笼、一盏红灯笼。\n庙公说，灯篙竖得越高，招来的好兄弟越多——都是来吃普渡的。') },
          { id: 'pudu', x: 11, y: 5, w: 10, spr: 'pudu', light: { r: 4, col: 'rgba(255,140,60,.12)', flick: true }, on: S => pudu(S) },
          { id: 'tianP', x: 17, y: 5, spr: 'feet', hidden: true, solid: false, z: 1 },
          { id: 'dashi', x: 21, y: 4, spr: 'dashi', light: { r: 1.6, col: 'rgba(120,160,255,.1)' }, on: S => S.narr('纸扎的大士爷，比人还高。青脸、獠牙、红舌头，头上顶着一尊小小的白衣观音。\n他手里那面令旗上写着：「普渡」。') },
          { id: 'dashiAsh', x: 21, y: 4, spr: 'ashpile', hidden: true, decal: true, on: S => S.narr('大士爷烧剩的一堆灰。火星子还在里头一明一灭。') },
          { id: 'xitai', x: 23, y: 2, w: 8, h: 3, spr: 'xitai', light: { r: 4, col: 'rgba(255,230,180,.16)', dy: 12 }, on: S => stage(S) },
          { id: 'qp1', x: 24, y: 6, w: 3, spr: 'bench2', on: S => frontBench(S) },
          { id: 'qp2', x: 27, y: 6, w: 3, spr: 'bench2', on: S => frontBench(S) },
          { id: 'v1', x: 24, y: 8, spr: '@v1', dir: 3, on: S => S.say('后排的阿伯', ['今年的目连戏，请的是泉州来的班子。', '头排？头排莫坐。那是给它们留的。']) },
          { id: 'aunt', x: 25, y: 8, spr: '@aunt', dir: 3, on: S => stage(S) },
          { id: 'v2', x: 27, y: 8, spr: '@v2', dir: 3, on: S => S.say('看戏的阿婶', '嘘——目连要下地狱了。') },
          { id: 'v3', x: 28, y: 8, spr: '@v3', dir: 3, on: S => S.say('看戏的阿公', '这出戏，我从小看到老。每年七月半，阿母都牵我来。') },
          { x: 2, y: 9, spr: 'jinlu', light: { r: 2, col: 'rgba(255,120,40,.16)', flick: true }, on: S => S.narr('庙口的金炉，火一直没断。\n烧完的纸灰从炉口往外飘，像一群灰色的蛾子。') },
          { id: 'mg', x: 10, y: 6, spr: '@mg', dir: 0, on: S => mgTalk(S) },
          { id: 'afeng', x: 5, y: 7, spr: '@afeng', dir: 3, on: S => fengStreet(S) },
          { id: 'm1', x: 3, y: 7, spr: '@m1', dir: 3, on: S => S.say('抢孤的汉子', '锣一响就上！今年顺风旗是我们的！') },
          { id: 'm2', x: 7, y: 7, spr: '@m1', dir: 3, on: S => S.say('抢孤的汉子', '柱子上的牛油抹得真厚……') },
          { id: 'c1', x: 2, y: 7, spr: '@v2', dir: 3, on: S => S.say('看热闹的阿婶', '听说几十年前，孤棚塌过一回，砸死过人。') },
          { id: 'c2', x: 8, y: 8, spr: '@v3', dir: 3, on: S => S.say('看热闹的阿伯', '后生仔，抢的时候莫往底下的人头上踩！') },
          { id: 'c3', x: 1, y: 5, spr: '@v1', dir: 2, on: S => S.say('看热闹的人', '普渡还没完呢，急什么。') },
          { id: 'luo1', x: 4, y: 8, spr: 'luo', hidden: true, decal: true, on: S => S.narr('孤棚上掉下来的粿和米包，早被人抢光了，只剩一地碎屑。') },
          { id: 'luo2', x: 6, y: 8, spr: 'luo', hidden: true, decal: true, on: S => S.narr('地上一摊碎粿。') },
          { id: 'luo3', x: 8, y: 7, spr: 'luo', hidden: true, decal: true, on: S => S.narr('一只被踩扁的米包。') },
          { id: 'gui', x: 6, y: 9, spr: 'gui', hidden: true, solid: false },
          { id: 'tianG', x: 5, y: 6, spr: '@tian', hidden: true, solid: false, z: 1, oy: -78, alpha: .9 },
          { id: 'kid', x: 15, y: 11, spr: '@kid', dir: 0, async on(S) {
            S.face('kid', 'pl');
            if (S.once('kid1')) return S.say('小孩', ['姐姐！那边石板缝里有钱！亮晶晶的！', '我阿妈不让我捡……你捡呗？']);
            return S.say('小孩', ['我阿妈说，路上的钱是给好兄弟买路的。', '好兄弟是谁啊？他们没有钱吗？']);
          } },
          { id: 'coin1', x: 18, y: 12, spr: 'coin', on: S => coin(S, 'coin1') },
          { id: 'coin2', x: 13, y: 16, spr: 'coin', on: S => coin(S, 'coin2') },
          { id: 'coin3', x: 9, y: 9, spr: 'coin', on: S => coin(S, 'coin3') },
          { id: 'lstr', x: 11, y: 10, w: 10, spr: 'lstring', decal: false, solid: false, z: 1, light: { r: 3.2, col: 'rgba(255,90,60,.1)' } },
          ...ASH.map(([x, y], i) => ({ id: `ash${x}_${y}`, x, y, spr: 'huiquan', decal: true, solid: false, light: { r: .9, col: 'rgba(255,120,40,.12)', flick: true, a: .7 }, on: S => S.narr(S.f.ph === 'back' ? '灰圈早凉了，纸灰被风吹散了一半。' : ashDesc[i % 3]) })),
          { id: 'po', x: 7, y: 13, spr: '@po', dir: 1, async on(S) {
            S.face('po', 'pl');
            if (S.once('po1')) return S.say('阿婆', ['林家的孙女？给你阿公烧纸啊？', '圈要留个口，朝着祖坟那边，他才认得路进来拿。你阿公葬在后山吧？', '圈外头撒几张，给那些没人烧的。不然它们去抢你阿公的。']);
            return S.say('阿婆', '莫踩我这圈灰啊。踩了，就是抢我家老头子的钱。');
          } },
          { id: 'spot', x: 25, y: 14, spr: 'spot', decal: true, solid: false, off: true, light: { r: 2.2, col: 'rgba(255,140,50,.2)', flick: true }, on: S => burn(S) },
          { x: 28, y: 13, spr: 'sign', col: '#5a3a22', on: S => S.narr('木牌：后山 →\n底下用红漆补了一行小字：「林家祖坟由此上」。\n往后山的小路，夜里用竹篱笆拦起来了。') },
          { id: 'tianB', x: 26, y: 15, spr: '@tian', hidden: true, solid: false, alpha: .8 },
          { x: 2, y: 12, spr: 'door', on: S => S.narr('杂货店的门。门口的小供桌上点着两根红烛，摆着一碗白饭。') },
          { x: 6, y: 12, spr: 'door', on: S => S.narr('阿婆家的门，门上贴着「出入平安」。') },
          { x: 9, y: 12, spr: 'window', lit: true, on: S => S.narr('窗户里亮着灯，电视在放歌仔戏。') },
          { x: 4, y: 12, spr: 'window', on: S => S.narr('黑着的窗户。窗台上摆了一碗清水，一双筷子并排搁在碗边。') },
          { x: 23, y: 12, spr: 'door', on: S => S.narr('理发店。卷帘门拉下了一半，门缝里透出一点红光。') },
          { x: 25, y: 12, spr: 'window', lit: true, on: S => S.narr('窗户里一家人在吃饭，桌上多摆了一副碗筷。') },
          { x: 27, y: 12, spr: 'door', on: S => S.narr('一户人家的门。门口烧完的纸灰，被人用扫帚扫成了一个整整齐齐的圈。') },
          { id: 'huopen', x: 1, y: 14, spr: 'huopen', hidden: true, light: { r: 1.8, col: 'rgba(255,120,40,.22)', flick: true }, on: S => huopen(S) },
          yingEnt('yingS'),
          ...[13, 14, 15].map(y => ({ x: 0, y, spr: 'invisible', async touch(S) { await S.go('home', 8, 12, 3); } })),
          ...[11, 12, 13, 14, 15, 16, 17, 18, 19, 20].map(x => ({ x, y: 17, spr: 'invisible', async touch(S) {
            const f = S.f;
            if (f.ph === 'back') { await S.think('……回溪边去？\n「河灯放下去，莫回头。」'); return S.pos(x, 16, 3); }
            if (!f.qgDone) {
              const a = []; if (!f.placed) a.push('把供品摆上普渡坛'); if (!f.burned) a.push('给阿公烧纸'); if (!a.length) a.push('去孤棚底下看抢孤');
              await S.think('子时还早。先把庙口的事办完：' + a.join('、') + '。'); return S.pos(x, 16, 3);
            }
            await S.go('river', 11, 1, 0);
          } }))
        ],
        async enter(S, first) {
          const f = S.f;
          syncYing(S); updPlr(S);
          if (first) {
            f.ph = 'night';
            await S.card('戌时', '晚上七点多', '老街的路灯，今晚一盏也没开。\n\n家家户户门口摆一张小供桌，点两根红烛，地上烧着一圈纸钱。\n火光一圈接一圈，一直铺到庙口。');
            await S.narr('庙口那头锣鼓喧天，戏台上已经开唱了。\n空气里全是香灰、烧纸和卤肉的味道。');
            goal(S, '把供品篮摆上庙口的普渡坛，再去右边巷口给阿公烧纸');
            S.cp('night');
            return;
          }
          if (f.ph === 'back' && !f.backIn) {
            f.backIn = true; S.dark(.88); S.amb('night');
            for (const id of ['afeng', 'm1', 'm2', 'mg', 'kid', 'po', 'aunt', 'v1', 'v2', 'v3', 'c1', 'c2', 'c3', 'coin1', 'coin2', 'coin3', 'luo1', 'luo2', 'luo3']) S.hide(id);
            S.ent('pudu').s.empty = 1; S.ent('xitai').s.empty = 1;
            for (const [x, y] of ASH) S.ent(`ash${x}_${y}`).off = true;
            S.ent('spot').off = true; if (f.burned) S.ent('spot').s.fire = 2;
            S.show('huopen');
            await S.narr('老街上的人都散了。\n门口的纸灰都凉了，风一吹，满街打旋。戏台上的汽灯也灭了。');
            await S.narr('巷子那头，你家院门外亮着一点火光。\n——阿嬷让人在门口摆了一个火盆。');
            goal(S, f.ying && !f.kua ? '回家——进门前先跨过火盆（单子第十条）' : '回家（院门外摆着火盆）');
            S.cp('back');
          }
        },
        step(S, x, y) {
          const f = S.f;
          if (f.ph !== 'night') return;
          if (isAsh(x, y)) return ashStep(S);
          if (f.burned && !f.patDone && x >= 11 && x <= 20 && y >= 10 && y <= 12) return pat(S);
          if (f.placed && f.burned && f.patDone && !f.qgStart && y <= 9) return qgStart(S);
        },
        tick(S, dt) {
          const f = S.f; if (f.ph !== 'night' && f.ph !== 'river') return;
          f._op = (f._op ?? 2) - dt;
          if (f._op <= 0) { f._op = 6 + Math.random() * 3; const d = Math.abs(W.pl.x - 27) + Math.abs(W.pl.y - 4); opera(S, clamp(1.3 - d / 18, .15, 1) * (S.busy ? .5 : 1)); }
        }
      },

      /* ---------------- 溪口宫 ---------------- */
      miao: {
        amb: 'drone', dark: .55, plr: 3.4, floor: 'stone', wall: 'red',
        rows: [
          '################',
          '################',
          '#kkkkkkkkkkkkkk#',
          '#kkkkkkkkkkkkkk#',
          '#kkkkkkkkkkkkkk#',
          '#kkkkkkkkkkkkkk#',
          '#kkkkkkkkkkkkkk#',
          '#kkkkkkkkkkkkkk#',
          '#kkkkkkkkkkkkkk#',
          '#kkkkkkkkkkkkkk#',
          '#######..#######'],
        ents: [
          { x: 7, y: 2, w: 2, spr: 'dizang', light: { r: 2.6, col: 'rgba(255,170,80,.18)', flick: true }, on: S => S.narr('正殿供的是地藏王菩萨，一手锡杖，一手宝珠。\n「地狱不空，誓不成佛。」\n老人说，七月最后一天是他的生日，那天鬼门才关。') },
          { x: 2, y: 2, w: 3, spr: 'gmd', light: { r: 1.8, col: 'rgba(255,200,100,.14)' }, on: S => S.narr('一整面墙的光明灯，一格一盏，每盏底下贴着一张红纸，写着名字。\n阿嬷每年也给你点一盏，保佑平安。') },
          { id: 'bei', x: 13, y: 2, spr: 'bei', async on(S) {
            await S.note('bei'); S.f.readBei = true;
            if (S.once('beiThink')) await S.think('「殇童一，林姓，年九岁」……');
          } },
          { id: 'qian', x: 10, y: 3, spr: 'qiantong', on: S => qian(S) },
          { x: 8, y: 4, spr: 'cushion', solid: false, on: S => S.narr('一只磨得发亮的蒲团。') },
          { x: 5, y: 2, spr: 'candles', light: { r: 1.4, col: 'rgba(255,170,80,.14)', flick: true }, on: S => S.narr('一排红烛，烛泪淌了一桌子。') },
          { x: 12, y: 8, spr: 'bigdrum', on: S => { S.tone('sine', 110, 46, .35, .16, 0, 420); return S.narr('庙里的大鼓。你轻轻敲了一下，声音在梁上转了好几圈才散。'); } },
          { x: 3, y: 8, spr: 'incense', on: S => S.narr('一只大香炉，插满了香。烟熏得眼睛发酸。') },
          yingEnt('yingM'),
          ...[7, 8].map(x => ({ x, y: 10, spr: 'invisible', async touch(S) { await S.go('street', 15, 2, 0); } }))
        ],
        async enter(S, first) {
          syncYing(S); updPlr(S);
          if (first) await S.narr('溪口宫里很静，外头的锣鼓声像隔了一层棉被。\n香烟一层一层地压在梁下。');
        }
      },

      /* ---------------- 溪边 ---------------- */
      river: {
        amb: 'river', dark: .8, plr: 3.4, floor: 'stone', darkC: '#04060c',
        legend: { Q: 'paddy', J: 'stepz' },
        tileOpts: { treeC: '#14281a' },
        rows: [
          'TTTTTTTTTTkkkkTTTTTTTTTT',
          'TTTTTTTTTTkkkkTTTTTTTTTT',
          'QQQQQQQQQQkkkkQQQQQQQQQQ',
          'dddddddddddddddddddddddd',
          'QQQQQQQQQQkkkkQQQQQQQQQQ',
          'QQQQQQQQQQkkkkQQQQQQQQQQ',
          'dddddddddddddddddddddddd',
          'QQQQQQQQQQkkkkQQQQQQQQQQ',
          'QQQQQQQQQQkkkkQQQQQQQQQQ',
          'dddddddddddddddddddddddd',
          'QQQQQQQQQQkkkkQQQQQQQQQQ',
          'QQQQQQQQQQkkkkQQQQQQQQQQ',
          'dddddddddddddddddddddddd',
          'QQQQQQQQQQkkkkQQQQQQQQQQ',
          'QQQQQQQQQQkkkkQQQQQQQQQQ',
          'dddddddddddddddddddddddd',
          'QQQQQQQQQQkkkkQQQQQQQQQQ',
          'QQQQQQQQQkkkkkkQQQQQQQQQ',
          'kkkkkkkkkkkkkkkkkkkkkkkk',
          'kkkkkkkkkkkkkkkkkkkkkkkk',
          '~~~~~~~~~~JJJJ~~~~~~~~~~',
          '~~~~~~~~~~~~~~~~~~~~~~~~',
          '~~~~~~~~~~~~~~~~~~~~~~~~',
          '~~~~~~~~~~~~~~~~~~~~~~~~'],
        ents: [
          { id: 'fang', x: 10, y: 20, w: 4, spr: 'invisible', solid: false, on: S => release(S) },
          { id: 'bo', x: 16, y: 18, spr: '@bo', dir: 0, async on(S) {
            S.face('bo', 'pl');
            await S.say('卖灯阿伯', ['放灯啊？灯上写名字，要写全名，族谱上那种。', '水里的人认字不认脸。名字写错了，灯就漂不到他那儿。']);
            await S.say('卖灯阿伯', ['放下去，就起身走。莫回头。', '你一回头，他们就舍不得走了。']);
          } },
          { x: 17, y: 18, w: 2, spr: 'stall2', col: '#5a3a5a', light: { r: 2, col: 'rgba(255,180,120,.16)' }, on: S => S.narr('阿伯的灯摊。竹架上挂满了纸折的莲花灯，一盏两块钱。\n摊子上摆着笔墨，给人写名字。') },
          { id: 'r1', x: 6, y: 19, spr: '@v2', dir: 0, on: S => S.say('放灯的阿婶', '……阿母，你跟着灯走，莫回头啊。') },
          { id: 'r2', x: 20, y: 19, spr: '@v3', dir: 0, on: S => S.narr('一个老人蹲在岸边，把一盏灯推进水里，然后就那么蹲着，一动不动。') },
          ...[[2, 21, 0, .34], [7, 22, 1, .28], [15, 21, 2, .4], [19, 23, 3, .3], [4, 23, 1, .36], [22, 22, 0, .32]].map(([x, y, c, v], i) => ({ id: 'hd' + i, x, y, spr: 'hedeng', solid: false, decal: true, s: { c, v }, light: { r: 1.3, col: 'rgba(255,190,110,.16)' } })),
          { id: 'L1', x: 11, y: 21, spr: 'hedeng', hidden: true, solid: false, s: { c: 1, big: 1 }, light: { r: 1.8, col: 'rgba(255,200,120,.22)' } },
          { id: 'L2', x: 12, y: 21, spr: 'hedeng', hidden: true, solid: false, s: { c: 0, big: 1 }, light: { r: 1.8, col: 'rgba(255,200,120,.22)' } },
          { id: 'L3', x: 11, y: 22, spr: 'hedeng', hidden: true, solid: false, s: { c: 2, big: 1 }, light: { r: 2, col: 'rgba(255,210,140,.24)' } },
          { id: 'tianR', x: 13, y: 20, spr: '@tian', hidden: true, solid: false, dir: 0, light: { r: 1.2, col: 'rgba(200,210,220,.1)' } },
          { id: 'akongR', x: 12, y: 22, spr: '@akong', hidden: true, solid: false, dir: 3, light: { r: 1.6, col: 'rgba(255,190,120,.16)' } },
          ...LANES.flatMap((L, li) => Array.from({ length: L.n }, (_, i) => ({ id: `q${li}_${i}`, x: 0, y: L.y, spr: '@gx', hidden: true, solid: false, dir: L.v > 0 ? 2 : 1, light: { r: 1.5, col: 'rgba(230,230,200,.12)' } }))),
          yingEnt('yingR'),
          ...[10, 11, 12, 13].map(x => ({ x, y: 0, spr: 'invisible', async touch(S) {
            const f = S.f;
            if (f.ret) return finishReturn(S);
            await S.go('street', 15, 16, 3);
          } }))
        ],
        async enter(S, first) {
          const f = S.f;
          syncYing(S); updPlr(S);
          if (first) {
            f.ph = 'river';
            await S.narr('出了老街，是一大片稻田。田埂中间一条石板路，一直通到溪边。\n稻子刚抽穗，夜风一吹，沙沙地响。');
            await S.narr('溪面上，从上游漂下来一盏一盏莲花灯——红的、粉的、白的。\n石阶上蹲着几个放灯的人，谁也不说话。');
            goal(S, '到溪边最下面一级石阶上，把三盏河灯放进溪里');
            S.cp('river');
          }
        },
        step(S, x, y) {
          const f = S.f;
          if (f.ret && !f.voice && y <= 11) return voice(S);
        },
        tick(S, dt) {
          const f = S.f;
          for (let i = 0; i < 6; i++) { const e = S.ent('hd' + i); if (!e || e.hidden) continue; e.px += (e.s.v || .3) * TS * dt; if (e.px > (RW + 1) * TS) e.px = -2 * TS; }
          for (const id of ['L1', 'L2', 'L3']) {
            const e = S.ent(id); if (!e || e.hidden || !e.s.go) continue;
            if (id === 'L3' && e.s.chase) { const l2 = S.ent('L2'); if (l2 && !l2.hidden && e.px < l2.px - TS * .5) { e.px += 1.6 * TS * dt; continue; } e.s.chase = 0; if (l2) l2.s.go = 1; }
            e.px += (e.s.spin ? .12 : .45) * TS * dt;
            if (e.px > (RW + 1) * TS) { e.s.go = 0; S.hide(id); }
          }
          if (!f.ret || W.endScreen) return;
          const busy = S.busy, p = W.pl, span = (RW + 4) * TS;
          let best = 99;
          LANES.forEach((L, li) => {
            for (let i = 0; i < L.n; i++) {
              const e = S.ent(`q${li}_${i}`); if (!e || e.hidden) continue;
              if (!busy) {
                e.px += L.v * TS * dt; if (e.px > (RW + 2) * TS) e.px -= span; if (e.px < -2 * TS) e.px += span;
                e.x = Math.round(e.px / TS); e.dir = L.v > 0 ? 2 : 1;
                e.walked = (e.walked || 0) + Math.abs(L.v) * TS * dt; e.fr = stepFrame(e.walked);
                const ex = e.px / TS; e.alpha = clamp(Math.min(ex + 1.5, RW + .5 - ex) / 2, 0, 1) * .85;
              }
              const d = Math.abs(e.px - p.px) / TS + Math.abs(e.py - p.py) / TS * 1.5; if (d < best) best = d;
              if (!busy && !f.hitLock && !(f._grace > 0) && Math.abs(e.py - p.py) < 10 && Math.abs(e.px - p.px) < 11) { f.hitLock = true; f._hitId = e.id; S.run(laneHit); }
            }
          });
          if (!busy) { f._grace = (f._grace || 0) - dt; f._lg = (f._lg || 0) - dt; }
          if (!busy && !f.hitLock && p.dir === 0) {
            if (f._lg > 0) S.turn(3);   // 刚被警告过：脖子僵着，转不过去
            else { f.hitLock = true; S.run(async S => { await lookBack(S); S.f.hitLock = false; S.f._lg = 1.2; }); }
          }
          f._dg = (f._dg ?? 0) - dt; if (f._dg <= 0) { f._dg = best < 6 ? .28 + best * .1 : .7; if (best < 6) ding(S, clamp(1.1 - best / 6, .15, 1)); }
          const tl = S.timerLeft; if (tl != null && tl < 10) { f._hb = (f._hb ?? 0) - dt; if (f._hb <= 0) { f._hb = .85; heart(S, .7); } }
        }
      }
    }
  });
})();
