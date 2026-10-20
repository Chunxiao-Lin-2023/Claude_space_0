/* ================= 第五夜 · 朝内81号 ================= */
(() => {
  /* ---------- 小工具 ---------- */
  const FONT = { '0': '111101101101111', '1': '010110010010111', '2': '111001111100111', '3': '111001111001111', '4': '101101111001001', '5': '111100111001111', '6': '111100111101111', '7': '111001001001001', '8': '111101111101111', '9': '111101111001111' };
  function digits(R, x, y, s, col) { [...s].forEach((ch, i) => { const b = FONT[ch]; if (!b) return; for (let k = 0; k < 15; k++) if (b[k] === '1') R(x + i * 4 + (k % 3), y + ((k / 3) | 0), 1, 1, col); }); }
  const bx2 = (R, x, y, w, h, fill, edge) => { R(x, y, w, h, edge || shade(fill, -.45)); R(x + 1, y + 1, w - 2, h - 2, fill); };
  const cycle = (S, key, lines) => lines[(S.f[key] = ((S.f[key] ?? -1) + 1) % lines.length)];
  const sms = (S, text) => { S.sfx('phone'); return S.say('短信 · 大刘', text); };
  const GREEN = { face: '#3e5646', trim: '#22332a', top: '#111814', pat: 'paper' };
  const ATTIC_T = 150;
  const KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'];
  /* 合成音效（双方都听得到）：夜班车报站的「叮咚」、邮政自行车的车铃 */
  const busChime = (S, v = .05) => { S.tone('sine', 988, 980, .4, v, 0, 2400); S.tone('sine', 784, 776, .8, v, .34, 2400); S.tone('triangle', 494, 490, .8, v * .4, .34, 1200); };
  const bikeBell = (S, v = .045, d0 = 0) => { for (let i = 0; i < 2; i++) for (let j = 0; j < 4; j++) { S.tone('triangle', 2360, 2320, .16, v, d0 + i * .36 + j * .05, 0); S.tone('sine', 3540, 3500, .1, v * .5, d0 + i * .36 + j * .05, 0); } };
  /* 两人各投一票（单人时就是普通选择）；意见不一致时写出来，再由操作者拍板 */
  async function choose(S, q, opts, who, short) {
    if (S.coop) S.toast('联机：这一下，两个人各投一票');
    const r = await S.vote(q, opts, who);
    if (!r.agree) await S.narr('你们俩一个想「' + (short || opts)[r.h] + '」，一个想「' + (short || opts)[r.g] + '」。\n僵了一下——最后，还是攥着信的那只手做了主。');
    return r.v;
  }
  /* 她留下的痕迹（可选调查，结局里统计） */
  const TRACES = ['t_mail', 't_cal', 't_shoes', 't_rwin', 'r_beam', 't_book', 't_bench'];
  const traceN = S => TRACES.filter(k => S.f[k]).length;
  /* 大爷挪到院门口等你（玩家出院子之前调用，免得在眼前瞬移） */
  function yeToGate(S) { if (S.f.solved && !S.f.gotReply && !S.f.yeGate) { S.f.yeGate = true; S.place('ye', 15, 3, 3); } }

  /* ================= 胡同：夜班车 ================= */
  async function busEvent(S) {
    S.f.busSeen = true;
    await S.narr('你正要往豁口里钻，身后的大街上，传来一阵发动机的声音。');
    S.focus(16, 4);
    const bus = S.ent('bus'); S.place('bus', -4, 5, 2); bus.open = false; bus.s.face = false;
    S.sfx('car');
    await S.walk('bus', 'r'.repeat(22), 7);
    S.sfx('brake'); S.shake(250, 1);
    await S.wait(500);
    bus.open = true; S.sfx('open'); busChime(S);
    await S.narr('「叮——咚——」\n是一辆夜班车。车厢里亮着黄澄澄的灯，一排一排的座位全空着。\n它在81号门口的站牌底下停住，前门「哗」地打开了。');
    await S.wait(1300);
    await S.narr('……没有人下车。');
    await S.wait(900);
    await S.narr('也没有人上车。车门就那么开着，像是在等谁。');
    await S.wait(1400);
    bus.open = false; S.sfx('close');
    await S.wait(300);
    bus.s.face = true; S.sfx('car');
    await S.walk('bus', 'r'.repeat(14), 7);
    S.hide('bus'); bus.s.face = false;
    S.focus(null);
    S.face('liu', 'pl');
    await S.say('大刘', ['……你、你看见了吧？', '帖子里说的就是这个。夜班车每回到这站都停，开门，没人下。', '司机？我哪看得清司机。']);
    await S.think('车开走的时候，最后一扇车窗里，好像有一张白白的脸贴着玻璃。\n……大概是看错了。');
    S.goal('进楼里看看');
  }
  async function gapOn(S) {
    if (!S.f.talked) return S.narr('围墙塌了一个豁口，黑洞洞的。');
    if (!S.f.busSeen) { await busEvent(S); await S.narr('你深吸一口气，猫着腰钻进了豁口。'); return S.go('hall', 10, 9, 3); }
    if (S.f.gotReply && !S.f.done) {
      if (S.once('gapYard')) await S.narr('天边已经有点发灰了。\n你攥紧那封信，又一次钻进了豁口——这回没进楼，顺着西楼和围墙中间那条窄道，一直绕到了后院。');
      return S.go('yard', 1, 3, 2);
    }
    if (S.once('gapIn')) await S.narr('你猫着腰，从豁口钻了进去。\n砖茬子刮住了外套，「嗤啦」一声。');
    await S.go('hall', 10, 9, 3);
  }

  /* ================= 看车的大爷 ================= */
  async function yeOn(S) {
    S.face('ye', 'pl');
    if (S.f.gotReply) return S.say('看车大爷', cycle(S, '_ye2', ['后院那棵槐树……去吧，天快亮了。', '我老了，那院子，我是不敢再进了。', '……替我跟她说一声，对不住。']));
    if (S.f.solved) return yeLetter(S);
    if (S.once('yeHi')) await S.say('看车大爷', ['小伙子，大半夜的，跟这儿转悠啥呢？', '……又是来看「鬼楼」的吧。这两年，隔三差五就有你们这样的。']);
    for (;;) {
      const r = await S.ask('你问大爷：', ['「大爷，这楼真闹鬼？」', '「门口那车，怎么停了没人下？」', '「您在这儿看车多少年了？」', '（没事了）'], '看车大爷');
      if (r === 3) { await S.say('看车大爷', '进去当心点儿。那楼梯，踩重了要塌。'); return; }
      if (r === 0) {
        S.f.yeGhost = true;
        await S.say('看车大爷', ['闹鬼？我在这条街上活了七十多年，没见过鬼。', '说法倒是听了一箩筐。有说是国民党的大官跑台湾，太太在东楼上吊死了；也有说不是太太，是姨太太。', '有说文革那会儿，一帮红卫兵占了这楼，住了没几天，自个儿跑了——说是半夜听见女人哭。', '还有说九几年要拆，隔壁工地仨工人喝多了，把墙打穿了钻进去，再没出来，这楼就不拆了。要我说，嫌工钱少跑了呗。', '还有说地下室有条地道，一直通到大山子；打雷下雨的晚上，楼里有女人喊……', '一个人一个说法，越传越邪乎。你们年轻人，就爱听这个。']);
      } else if (r === 1) {
        await S.say('看车大爷', ['这儿有站，规矩是到站就停，有没有人都停。', '大半夜的，谁在这儿下？', '……不过也是怪。我在这儿看了这么些年，那车门一开，我老觉着——', '有人下来了。']);
      } else {
        S.f.knowNum = true;
        await S.say('看车大爷', ['看车？才几年。退休以前，我是送信的。这一片儿的信，我送了三十多年。', '那会儿这院儿里可热闹了，十几户人家，晾的衣裳从这头挂到那头。', '门牌也换过。六五年区里统一整门牌，这儿原先是六十九号，后来才改叫八十一。', '……你问这个干嘛？']);
      }
    }
  }
  async function yeLetter(S) {
    await S.say('看车大爷', ['出来啦？……你这脸色可不大好。', '你朋友说，你在楼上找东西。找着啥了？']);
    await S.say('你', ['一捆信。是一个叫「阿婉」的人写的，一封也没寄出去。', '最后一封说……「你若回来，信就寄老地方，朝阳门内大街六十九号」。']);
    S.bubble('ye', '…', 2000);
    await S.narr('大爷半天没说话。他摘下帽子，在手里转了两圈，又戴上了。');
    await S.say('看车大爷', ['阿婉……婉姐。', '我十九岁开始送信，这条街归我。西楼二层中间那间，住着一个女的，原先是楼下诊所的护士。诊所关了，她没走，就在这儿住下了。', '每天我一进院子，她就站在后院那棵槐树底下，问我一句：「有我的信吗？」', '天天问。问了十几年。我天天说：「没有。」', '后来，我都不敢从后院走了。']);
    await S.say('看车大爷', ['七二年冬天，她病了，没熬过去。', '八八年，那边能通信了。有一天，我的邮包里多了一封信——从香港转过来的，信封上写着：「北平朝阳门内大街六十九号　阿婉收」。', '可那会儿，哪还有六十九号？门牌早换了。新的六十九号是人家别的院子，人家说没这个人。', '我知道她是谁。可我能把信送给谁呢？退，又退不回去。']);
    await S.narr('大爷从棉袄里怀掏出一个信封。信封发黄了，边角磨得起了毛，封口还好好地粘着。');
    S.give('reply');
    await S.say('看车大爷', ['二十一年了。我没拆过，我没那个资格拆。', '你说，这封信，该送到哪儿去？']);
    await S.think('……后院。那棵槐树底下。');
    await S.say('看车大爷', '天快亮了。去吧。');
    S.f.gotReply = true;
    S.goal('天亮之前，把信送到后院的槐树底下');
    S.cp();
  }

  /* ================= 二楼：脚步声 ================= */
  async function takePole(S) {
    S.hide('pole'); S.give('hook');
    await S.narr('墙角立着一根晾衣服用的长竹竿，顶上绑了个铁钩子。\n你把它拿了起来——够得着天花板。');
    if (S.f.stepsDone) return;
    S.f.steps = true;
    S.cp('steps');
    await stepsBegin(S);
  }
  async function stepsBegin(S, retry) {
    await S.wait(retry ? 300 : 700);
    S.sfx('step'); await S.wait(520); S.sfx('step'); await S.wait(520); S.sfx('step');
    if (retry) await S.narr('嗒。嗒。嗒。——脚步声又从楼梯底下上来了。\n（衣柜在西边那两间屋里。跑起来地板会响，她会走得更快。）');
    else {
      await S.narr('楼梯那边，响起了脚步声。\n嗒。嗒。嗒。——是软底布鞋踩在木楼梯上的声音，很轻，不紧不慢。');
      await S.think('大刘？……不对。大刘那双大球鞋，上个楼跟打雷似的。\n……大爷说过，这楼梯踩重了要塌。可这个人，踩得一点声儿都快没有了。');
    }
    S.goal('有人上楼了——快找个衣柜躲起来！（别跑，地板会响）');
    S.timer(10, '脚步', stepsArrive);
  }
  async function stepsArrive(S) {
    if (S.f.stepsDone || S.pl.hidden || S.map !== 'floor2') return;
    const g = S.ent('wan_c'); S.place('wan_c', 1, 8, 2); g.alpha = 1;
    S.sfx('sting'); S.shake(300, 2);
    S.chase('wan_c', { spd: 2.7, catch: caughtSteps });
    await S.narr('楼梯口站着一个穿旗袍的女人。\n她慢慢地，把脸转向了你。');
    S.goal('躲进衣柜！');
  }
  /* 脚步声逼近时奔跑：木地板吱呀作响，脚步声加快（计时双倍流逝）。S.running 对客机操作也准确 */
  function stepsTick(S, dt) {
    if (!S.f.steps || S.f.stepsDone || W.busy || !W.timer || W.timer.label !== '脚步' || !S.running) return;
    W.timer.left -= dt;
    if (S.once('creak')) { S.sfx('thud'); S.toast('脚底下的地板「吱呀」一声——楼梯上的脚步，快了！'); }
  }
  async function caughtSteps(S) {
    await S.scare('face', { spr: '@wanF' });
    await S.die('一只冰凉的手，轻轻搭上了你的肩膀。\n耳朵边上，有人很小声地问：「……有我的信吗？」', '你被她看见了');
  }
  async function hideIn(S, id) {
    S.clearTimer();
    S.stop('wan_c');
    S.sfx('close');
    S.hidePlayer(true);
    const g = S.ent('wan_c');
    if (g.hidden) { S.place('wan_c', 1, 8, 2); g.alpha = 1; }
    S.dark(.9); S.plr(.6);
    await S.narr('你钻进衣柜，轻轻把柜门带上。\n樟脑味呛得眼睛发酸。你屏住气，从门缝里往外看——');
    S.sfx('step');
    const dx = id === 'wardA' ? 3 : 8;   // 这间屋的门 / 窗所在的列
    S.focus(dx, 6);
    await S.walk('wan_c', [dx, 7], 1.6);
    S.face('wan_c', 3); S.sfx('heart');
    await S.narr('脚步声在这间屋的门口停住了。\n门缝太窄，你只看得见一角蓝布衣襟。衣襟底下……没有脚。');
    await S.wait(1000);
    S.focus(dx, 4);
    await S.walk('wan_c', [dx, 4], 1.6);
    S.face('wan_c', 1); S.sfx('heart');
    await S.narr('她走进屋来，离衣柜只有两步远。\n隔着一层木板，你听见她的呼吸——不，你什么也没听见。她不呼吸。');
    await S.wait(1200); S.sfx('heart');
    await S.say('？？？', '……有我的信吗？', { style: 'whisper' });
    await S.wait(900);
    await S.walk('wan_c', [dx, 2], 1.6);
    S.face('wan_c', 3);
    await S.narr('她走到窗户跟前，站住了。\n脸贴着玻璃，一动也不动，朝着院门的方向望。');
    await S.wait(1500);
    await S.narr('望了很久，很久。');
    S.sfx('whisper');
    await S.alpha('wan_c', 0, 1400);
    S.ent(id === 'wardA' ? 'winA' : 'winB').s.fog = true;
    await S.wait(600);
    S.dark(null); S.plr(null); S.focus(null);
    S.hidePlayer(false); S.sfx('open');
    S.f.stepsDone = true;
    await S.narr('窗户跟前，什么都没有了。\n你在衣柜里又蹲了很久，才敢推开柜门。');
    await S.think('她在等什么？……等一个人？');
    S.goal('用钩杆拉下阁楼的梯子（走廊东头）');
    S.cp();
  }
  const wardOn = id => async S => {
    if (S.f.steps && !S.f.stepsDone) return hideIn(S, id);
    if (id === 'wardB') return S.narr('一只老式的大衣柜，柜门上镶的镜子早就没了。\n里面挂着一件阴丹士林蓝的旗袍。料子洗得发白，领口的盘扣一颗不少。');
    return S.narr('一只掉了漆的大衣柜，柜门关不严。\n里面塞着几件旧棉袄，一股樟脑丸的味儿。');
  };

  /* ================= 阁楼：拼起来的故事 ================= */
  /* 阁楼里待久了会「魔怔」：隐藏的倒计时，只靠旁白提醒；离开阁楼时暂停，再上来至少还有 45 秒 */
  function startAttic(S) { if (S.f.solved) return; S.timer(Math.max(45, S.f.atticLeft || ATTIC_T), null, atticBad); }
  function pauseAttic(S) { if (W.timer && !S.f.solved) S.f.atticLeft = W.timer.left; S.clearTimer(); }
  /* 魔怔的进度看得见：光圈从 2.6 格慢慢缩到 1.7 格，阁楼越来越暗（量化成小台阶，免得每帧都同步） */
  function atticDim(S) {
    if (S.f.solved || !W.timer) return;
    const k = clamp(1 - W.timer.left / ATTIC_T, 0, 1), r = Math.round((2.6 - .9 * k) * 10) / 10, d = Math.round((.92 + .05 * k) * 100) / 100;
    if (W.plr !== r) S.plr(r);
    if (W.mapDark.attic !== d) S.dark(d);
  }
  function atticTick(S) {
    if (S.f.solved || !W.timer || W.busy) return;
    atticDim(S);
    if (W.timer.left < 75 && S.once('aw1')) S.after(0, async S => {
      S.sfx('whisper');
      await S.think('……你打了个长长的哈欠。\n奇怪，刚才还紧张得手心冒汗，现在却觉得这上头挺安静的，安静得想坐下来歇一会儿。');
      await sms(S, '你还在阁楼上？？我听人说那上头待久了人会发懵，赶紧找完赶紧下来！');
    });
    if (W.timer.left < 32 && S.once('aw2')) S.after(0, async S => {
      const w = S.ent('wan_a'); w.alpha = 0; S.show('wan_a'); await S.alpha('wan_a', .22, 900);
      S.sfx('heart');
      await S.narr('圆窗那边的月光里，好像多了一道很淡很淡的影子。\n你揉了揉眼睛。眼皮沉得像灌了铅。');
      S.goal('别在阁楼上待太久——快把故事对上，或者先下去透口气');
    });
  }
  async function atticDown(S) {
    pauseAttic(S);
    S.hide('wan_a'); S.plr(null); S.dark(null);
    if (S.f.solved && !S.f.gotReply) {   // 解开以后不必再摸黑穿过三层楼：可以一口气出去
      const r = await S.ask('大刘说，看车的大爷在找你。', ['一口气下楼，出去找大爷', '先在楼里再看看']);
      if (r === 0) {
        await S.narr('你攥着那捆信，一口气下了两层楼，穿过大厅，从豁口钻了出去。\n楼梯在你身后吱呀吱呀地响，你没敢回头。');
        yeToGate(S);
        return S.go('hutong', 3, 2, 0);
      }
    }
    if (!S.f.solved && S.once('atticOut')) await S.narr('一下到走廊，脑子立刻清醒了不少。\n……刚才在上头，你差点就坐下了。');
    await S.go('floor2', 13, 7, 1);
  }
  async function atticBad(S) {
    if (S.map !== 'attic' || S.f.solved) return;
    S.amb('none'); S.plr(1.4);
    await S.narr('你忽然觉得很累。\n灰尘在月光里慢慢地飘，像在下雪。');
    await S.think('……再坐一会儿吧。就一会儿。\n反正，也不知道要等的人什么时候来。');
    const w = S.ent('wan_a'); w.alpha = 0; S.show('wan_a');
    await S.alpha('wan_a', .85, 1400);
    await S.narr('圆窗跟前，不知什么时候多了一个人。\n她侧着身子，两只胳膊肘撑在窗台上，朝大街的方向望。');
    await S.say('？？？', '你也在等人吗？', { style: 'whisper' });
    S.sfx('heart');
    await S.narr('你张了张嘴，想说「不是」。\n可你还是挪到了窗台边上，在她旁边，也撑起了胳膊肘。');
    await S.fade(1, 1500);
    await S.end({ bad: true, id: 'window', title: '阁楼的圆窗', text: '大刘在胡同口等到天亮，你始终没有出来。\n\n后来，论坛上那个帖子底下多了一条回复：\n「夜里从朝内大街往上看，阁楼那扇小圆窗里，有时候能看见两个人影，\n并排撑着窗台，朝门口的站牌望。」' });
  }
  async function trunkOn(S) {
    const t = S.ent('trunk');
    if (t.open) return S.narr('箱子已经空了。箱底垫着一张发脆的旧报纸，日期是民国三十七年。');
    await S.narr('一只樟木箱子，挂着一把老式的转轮铜锁。\n锁面上刻着两个小字：「来时」。');
    const v = await S.keypad('四位数的转轮锁　·　「来时」', KEYS, 4);
    if (v == null) return;
    if (v !== '1948') {
      S.sfx('locked');
      const n = S.f.lockTry = (S.f.lockTry || 0) + 1;   // 逐级提示
      if (!S.f.r_photo) return S.narr(n < 2 ? '锁纹丝不动。\n「来时」……得先知道，箱子的主人是哪一年来的。' : '锁纹丝不动。\n这屋里的东西，是西楼二层中间那间屋的主人留下的。\n……那屋的五斗柜，最底下一层抽屉好像卡住了，你还没拉开过。');
      if (n < 2) return S.narr('锁纹丝不动。\n「来时」……箱子的主人，是哪一年来北平的？');
      if (n < 3) return S.narr('锁纹丝不动。\n照片背面写着「民国三十七年春，初来北平」。\n民国元年是1912年……');
      return S.narr('锁纹丝不动。\n你掰着手指头算：民国元年是1912年，二年是1913年……\n三十七年，就是1912再加三十六。');
    }
    S.sfx('open'); t.open = true;
    await S.narr('「咔哒」一声，锁开了。\n箱子里是一捆用红头绳扎着的信。信封上写的都是同一个名字，一封也没贴邮票。');
    S.give('letters', true); S.toast('获得：一捆信');
    S.f.r_letters = true;
    await S.note('letters');
    S.goal(S.f.solved ? '出去找看车的大爷' : '把找到的东西摊在旧书桌上，对一对');
  }
  async function deskOn(S) {
    if (S.f.solved) return S.narr('桌上摊着帖子、剪报、照片和那捆信。\n现在你知道，哪一个故事是假的了。');
    const need = [['r_post', '大刘的帖子（在「笺」里）'], ['r_clip', '旧剪报（一楼大厅，糊着报纸的那面墙）'], ['r_photo', '老照片（二楼中间那屋，五斗柜的抽屉）'], ['r_letters', '箱子里的东西（阁楼西头那只上锁的樟木箱）']].filter(([k]) => !S.f[k]).map(a => '· ' + a[1]);
    if (need.length) return S.narr('一张旧书桌，桌面落满了灰。\n关于这栋楼，有好几种说法。要是把它们摆在一起看……\n\n还缺：\n' + need.join('\n'));
    if (S.once('deskLay')) await S.narr('你用袖子在桌上擦出一块干净地方，把帖子、剪报、照片和那捆信，一样一样摊开。\n四样东西，讲的像是四个不同的故事。');
    /* 答错有代价：在阁楼里越想越乱，隐藏的「魔怔」时间少 20 秒；连错两次给出明确的方向 */
    const wrong = async (S, msg) => {
      const n = S.f.deskWrong = (S.f.deskWrong || 0) + 1;
      if (W.timer) W.timer.left = Math.max(20, W.timer.left - 20);
      atticDim(S); S.sfx('heart');
      await S.narr(msg + (n === 1 ? '\n\n……你使劲揉了揉太阳穴。越想越乱，眼皮也越来越沉。' : ''));
      if (n >= 2) await S.think('别瞎猜了。\n门口那块新门牌底下，压着一块旧的。大厅墙上，还糊着一张六五年的通知。\n帖子里，有一样东西在那一年根本还不存在。');
    };
    const q1 = await S.ask('其中有一个说法，是后来的人编出来的。是哪一个？', [
      '帖子：49年太太在「81号」自缢',
      '剪报：教会产业，开过诊所',
      '照片：48年阿婉来到六十九号',
      '（再想想）']);
    if (q1 === 3) return;
    if (q1 === 1) return wrong(S, '剪报上的说法有档案可查，照片背面也写着「诊所门前」。\n这一条对得上。');
    if (q1 === 2) return wrong(S, '照片是她自己留下的，信封上的地址也是六十九号，日子一天不差。\n这一条，也对得上。');
    const q2 = await S.ask('帖子里，哪一处是不可能的？', [
      '那一年，这里还不叫「81号」',
      '49年的北平不可能有军官',
      '网上的帖子没一句真话']);
    if (q2 === 1) return wrong(S, '……这么说太武断了。\n帖子里一定有一样东西，在那一年根本不可能存在。');
    if (q2 === 2) return wrong(S, '网上的东西不全是假的。\n得找出一个实实在在的破绽。');
    S.f.solved = true; S.clearTimer(); S.f.atticLeft = 0;
    S.plr(null); S.dark(null);
    if (!S.ent('wan_a').hidden) S.alpha('wan_a', 0, 800);
    S.sfx('chime');
    await S.narr('帖子说，1949年，有个邮差往「朝内81号」送过一封信。\n可那一年，这里还叫六十九号。「81」这块牌子，要再过十几年才钉上去。');
    await S.narr('写帖子的人，是照着今天门口的门牌，编出了六十年前的故事。');
    await S.think('楼里确实住过一个女人。她确实在等。\n可她等的不是一根绳子——是一封信。');
    await S.narr('房梁上那道发亮的印子，你又看了一眼。\n登记簿上写着：阁楼是各家晾东西的地方。那是几十年的晾衣绳，一天一天磨出来的。');
    await S.narr('你把那捆信重新扎好。\n最底下那封的末尾写着：「你若回来，信就寄老地方。」');
    await S.think('……那个人，回信了吗？');
    await S.wait(500);
    await sms(S, '哎，看车那大爷一直在打听你。他说他以前是送信的，有样东西，想交给「楼里的人」。\n……楼里还有啥人啊？？你快出来吧。');
    S.goal('出去找看车的大爷');
    S.cp();
  }

  async function hatchOn(S) {
    const h = S.ent('hatch');
    if (S.f.steps && !S.f.stepsDone) return S.narr('现在没工夫管这个——脚步声越来越近了！');
    if (!h.open) {
      if (!S.has('hook')) {
        await S.narr('走廊尽头的天花板上，有一块方方正正的木盖板，四边包着铁皮，中间吊着一个铁环。\n是阁楼口。太高了，伸手够不着。');
        if (!S.f.stepsDone) S.goal('找根够得着天花板的东西（看看几间屋子）');
        return;
      }
      await S.narr('你举起钩杆，勾住盖板上的铁环，使劲往下一拽——');
      S.sfx('thud'); S.shake(400, 2); h.open = true;
      await S.narr('一架木梯子「哗啦」一声滑了下来，扬起一大片灰。\n灰落下来以后，梯子顶上那个方洞，黑得像一口井。');
    }
    if (S.f.solved && S.f.gotReply) return S.narr('阁楼上已经没有要找的东西了。');
    S.sfx('step');
    await S.go('attic', 12, 5, 3);
  }
  async function treeOn(S) {
    if (S.f.gotReply && !S.f.done) return S.narr('她就站在树底下，离你只有几步远。');
    if (S.f.done) return S.narr('枝杈上冒出了几粒针尖大的绿芽。');
    await S.narr('一棵老槐树，树皮裂得像龟壳，枝杈上一片叶子也没有。\n齐腰高的地方，树皮磨得光溜溜的——像是有人常年靠着它站着，朝院门那边张望。');
  }

  /* ================= 后院：结局 ================= */
  async function finale(S) {
    S.face('wan_y', 'pl');
    if (S.once('finSeen')) await S.narr('她穿着一件洗得发白的阴丹士林蓝旗袍，头发在脑后挽了个髻。\n她没有看你。她在看你身后——院门的方向。');
    await S.say('？？？', '……有我的信吗？', { style: 'whisper' });
    const r = await choose(S, '她在问你。', ['「有。」（把信递给她）', '「……没有。」', '（说不出话，往后退）'], '', ['把信给她', '说没有', '往后退']);
    if (r === 2) { await S.narr('你往后退了一步。\n她没有追过来，只是又转回头，朝院门那边望着。'); return; }
    if (r === 1) return noMail(S);
    S.take('reply');
    await S.narr('你把信递了过去。\n她低头看着信封上的字，看了很久。手指在「六十九号」那几个字上，来来回回地摸。');
    await S.narr('封口「嘶」地一声开了。');
    await S.note('reply');
    S.sfx('cry');
    await S.wait(800);
    await S.say('阿婉', ['……他还活着呀。', '那就好。']);
    await S.say('阿婉', ['四十年了，他也该有个家了。', '我就是想知道，他到底到没到那边。路上冷不冷。']);
    await S.narr('她把信折好，贴着胸口放进了衣襟里。\n然后，她第一次转过脸来，看着你。是一张很年轻、很干净的脸。');
    await S.say('阿婉', ['谢谢你。', '也替我谢谢那个送信的小伙子。', '他天天跑一趟，天天说「没有」，说得那么难为情，好像是他欠了我什么。']);
    bikeBell(S, .02);
    await S.narr('院墙外头，很远很远的地方，「叮铃——叮铃——」响了两声车铃。');
    S.sfx('chime');
    S.dark(.55); S.ent('tree').s.bud = true;
    await S.narr('天边透出了一点灰白。\n槐树光秃秃的枝杈上，不知什么时候，冒出了几粒针尖大的绿芽。');
    await S.walk('wan_y', [14, 7], 1.4);
    await S.alpha('wan_y', 0, 1600);
    S.f.done = true;
    await S.fade(1, 1200);
    await S.card('天亮了', '', '你从豁口钻出来的时候，\n大刘靠在路灯杆底下，睡着了。');
    S.goal('');
    S.dark(.15, 'hutong');
    S.place('liu', 11, 3, 2); S.ent('liu').s.sleep = true; S.place('ye', 20, 3, 0);
    await S.go('hutong', 14, 3, 2, { fade: false });
    S.amb('wind');
    await S.fade(0, 1000);
    await dawnBus(S);
  }
  async function dawnBus(S) {
    S.focus(16, 4); S.bubble('liu', '…', 6000);
    await S.narr('朝内大街上，头班车开过来了。\n看车的大爷已经站在站牌底下了，两只手揣在袖筒里。');
    const bus = S.ent('bus'); S.place('bus', -4, 5, 2); bus.open = false; bus.s.face = false;
    S.sfx('car');
    await S.walk('bus', 'r'.repeat(22), 7);
    S.sfx('brake');
    await S.wait(400);
    bus.open = true; S.sfx('open'); busChime(S, .04);
    await S.narr('它在81号门口停下，开了门。\n还是没有人下车。');
    const w = S.ent('wan_h'); S.place('wan_h', 14, 2, 2); w.alpha = 0;
    await S.alpha('wan_h', .55, 900);
    await S.walk('wan_h', [[18, 2], [18, 4]], 2.2);
    S.face('wan_h', 0);
    await S.alpha('wan_h', 0, 700);
    await S.wait(500);
    bus.open = false; S.sfx('close');
    await S.narr('车门关上之前，你好像看见一角蓝布衣襟，轻轻一闪，进了车门。');
    S.sfx('car');
    await S.walk('bus', 'r'.repeat(14), 7);
    S.hide('bus');
    S.face('ye', 2); S.bubble('ye', '…', 2600);
    await S.narr('站牌底下，大爷朝着车开走的方向，把帽子摘了下来，\n站了好一会儿，才又戴上。');
    S.focus(null);
    await S.wait(600);
    S.ent('liu').s.sleep = false; S.face('liu', 'pl'); S.bubble('liu', '!', 900);
    await S.say('大刘', ['……嗯？天亮了？你出来啦？', '拍着啥了没？给我看看！']);
    await S.think('你看了一眼相机。里面一张照片也没有。\n……也好。');
    await S.fade(1, 1400);
    const n = traceN(S);
    const tail = n >= TRACES.length ? '\n\n第二年春天，你又去过一次后院。\n槐树长满了叶子。树干上那块磨得发亮的树皮，已经慢慢长回去了。' : '';
    await S.end({ id: 'deliver', title: '第五夜　完', text: '几年以后，那两栋楼修好了，刷了新漆，挂上了新门牌。\n论坛上的帖子沉了下去，再也没有人顶。\n\n只有看车的大爷，每天早上头班车进站的时候，\n会抬起头，朝车窗里看一眼。' + tail + '\n\n（这一夜，你找到了她留下的 ' + n + '/' + TRACES.length + ' 处痕迹。）' });
  }
  /* 第三结局：像当年的邮差一样，说「没有」 */
  async function noMail(S) {
    await S.narr('「……没有。」\n话一出口，你自己都愣了一下。');
    await S.wait(700);
    await S.say('？？？', '……哦。', { style: 'whisper' });
    await S.narr('她点了点头，像是早就知道。\n没有生气，也没有哭。她只是又转回头，朝院门那边望着。\n就像过去那十几年里的每一天一样。');
    S.sfx('heart');
    await S.think('兜里那封信，忽然沉得像一块砖。');
    await S.fade(1, 1500);
    await S.end({ bad: true, id: 'nomail', title: '没有', text: '天亮以后，你把那封信塞回了大爷的棉袄兜里。\n大爷没说话，接过去，又揣了很多年。\n\n后来，你常常梦见那个后院。\n梦里她站在槐树底下，问你：「有我的信吗？」\n你每一次都说：「没有。」\n说得那么难为情，好像是你欠了她什么。' });
  }

  defChapter({
    id: 'chaonei81', n: 5, title: '朝内81号', sub: '北京朝阳门内，两栋没人住的洋楼。夜班车每晚都在门口停一下，没有人下车。', origin: '北京网络都市传说', color: '#5a2a26',
    icon: '@wan', amb: 'wind', floor: 'wood', wall: 'paper', dark: .86, plr: 3.1,
    tileOpts: { woodC: '#5e2e24' },
    endings: { deliver: '第五夜　完（信送到了）', nomail: '没有', window: '阁楼的圆窗' },
    /* 惊吓大头像（32×32）：挽着髻的黑发、青白的脸、两个深黑的眼窝里各一点不对称的白瞳、
       往下淌的暗色泪痕、阴丹士林蓝的高立领和白盘扣；嘴随 a 慢慢张开（「有我的信吗」） */
    faces: {
      wanF(R, a) {
        const H = '#0a080c', HL = '#2a2632', SK = '#c8d0d4', SK2 = '#a2aeb4', SK3 = '#7c888e', K = '#000', BL = '#22406a', BL2 = '#2e5280', WH = '#e8e4dc';
        // 发髻 + 头发外轮廓
        R(12, 0, 8, 4, H); R(13, 0, 6, 1, HL); R(8, 3, 16, 5, H); R(6, 6, 20, 4, H); R(6, 9, 3, 14, H); R(23, 9, 3, 14, H);
        R(11, 2, 1, 2, HL); R(20, 2, 1, 2, HL); R(7, 10, 1, 12, HL);
        // 肩膀和高立领旗袍
        R(3, 27, 26, 5, BL); R(2, 29, 28, 3, BL); R(10, 24, 12, 5, BL2); R(10, 24, 12, 1, WH); R(15, 25, 2, 4, '#1a3256');
        R(19, 27, 3, 1, WH); R(20, 28, 1, 2, WH); R(6, 28, 1, 4, '#1a3256');
        // 瓜子脸 + 右侧阴影
        R(12, 6, 8, 1, SK); R(10, 7, 12, 1, SK); R(9, 8, 14, 12, SK); R(10, 20, 12, 2, SK); R(11, 22, 10, 1, SK); R(13, 23, 6, 1, SK);
        R(20, 8, 2, 12, SK2); R(19, 20, 2, 2, SK2); R(17, 22, 2, 1, SK2);
        // 中分发际，两缕散下来的头发，一缕斜着划过左眼
        R(15, 5, 2, 3, H); R(10, 7, 2, 2, H); R(20, 7, 2, 2, H); R(9, 9, 1, 13, H); R(22, 9, 1, 12, H);
        R(12, 8, 1, 2, H); R(11, 10, 1, 3, H);
        // 眼窝：两个深黑的洞；先空着，然后各亮起一点不对称的白瞳
        R(11, 11, 5, 5, K); R(17, 11, 4, 5, K); R(10, 12, 1, 3, SK3); R(21, 12, 1, 3, SK3);
        if (a > .25) { R(13, 13, 1, 1, '#e8f0ff'); R(18, 14, 1, 1, '#e8f0ff'); }
        // 泪痕
        R(13, 16, 1, 2 + Math.round(a * 4), '#2a2e36'); R(19, 16, 1, 3 + Math.round(a * 3), '#2a2e36');
        // 鼻影
        R(15, 17, 2, 1, SK3); R(16, 18, 1, 1, SK2);
        // 嘴：慢慢张开
        const mh = 1 + Math.round(a * 3);
        R(14, 20, 4, 1, '#5a3a44'); R(14, 21, 4, mh, '#1a0a10'); R(13, 21, 1, Math.max(1, mh - 1), '#1a0a10'); R(18, 21, 1, Math.max(1, mh - 1), '#1a0a10');
      }
    },
    people: {
      me: { key: 'c81-me', skin: '#efc6a0', hair: '#1e1a18', hs: 'messy', top: '#4a5a3a', top2: '#2a3424', bottom: '#2c3650', shoes: '#d8d6cc',
        extra(g, d, fr, G, R) { if (d === 0) { R(5, G.tT, 1, 5, '#151515'); R(9, G.tT + 4, 3, 3, '#202022'); R(10, G.tT + 5, 1, 1, '#7a8a9a'); } else if (d === 1) R(5, G.tT + 4, 3, 3, '#202022'); } },
      liu: { key: 'c81-liu', skin: '#e8bc96', hair: '#141210', hs: 'short', top: '#a8382a', top2: '#7a281e', bottom: '#2a2a30', shoes: '#e8e8e8',
        extra(g, d, fr, G, R) { if (d === 0) { R(5, G.hT + 4, 2, 1, '#333'); R(9, G.hT + 4, 2, 1, '#333'); R(7, G.hT + 4, 2, 1, '#333'); } } },
      ye: { key: 'c81-ye', skin: '#d8ac86', hair: '#a8a6a0', hs: 'short', top: '#2c3c58', top2: '#1e2a40', bottom: '#2a2e38', shoes: '#1a1a1a', hat: 'cap', hatC: '#3a3a36',
        extra(g, d, fr, G, R) { if (d === 0) { R(6, G.tT + 2, 1, 1, '#c9a35a'); R(6, G.tT + 5, 1, 1, '#c9a35a'); R(5, G.hT + 6, 6, 1, shade('#d8ac86', -.15)); } } },
      wan: { key: 'c81-wan', skin: '#e4dcd6', hair: '#121014', hs: 'bun', top: '#2e5280', top2: '#e8e4dc', robe: true, ghost: true, eye: '#2a2a34', shoes: '#111',
        extra(g, d, fr, G, R) { if (d === 0) { R(6, G.tT - 1, 4, 1, '#2e5280'); R(9, G.tT + 1, 1, 1, '#e8e4dc'); R(10, G.tT + 2, 1, 1, '#e8e4dc'); } } },
      wanF: { key: 'c81-wanF', skin: '#c8d0d4', hair: '#0a080c', hs: 'bun', top: '#22406a', robe: true, ghost: true, eye: '#000', mouth: '#2a1218',
        extra(g, d, fr, G, R) { if (d === 0) { R(6, G.hT + 4, 1, 3, '#000'); R(9, G.hT + 4, 1, 3, '#000'); R(4, G.hT + 3, 1, 5, '#0a080c'); } } }
    },
    items: {
      camera: { name: '数码相机', desc: '大刘借你的卡片机。电池只剩一格。' },
      hook: { name: '钩杆', desc: '晾衣服用的长竹竿，头上绑着一个铁钩子。够得着天花板。' },
      letters: { name: '一捆信', desc: '用红头绳扎着的一捆信，信封上都写着「沈先生收」。没有一封贴了邮票。' },
      reply: { name: '发黄的信', desc: '看车大爷揣了二十一年的信。收信人：北平朝阳门内大街六十九号　阿婉。封口没拆过。' }
    },
    notes: {
      post: { title: '大刘打印的帖子', text: '（论坛上的转帖，大刘用单位的打印机打出来的，折了两折）\n\n【转】北京四大鬼宅之首——朝内81号\n\n1949年，解放军进城前夕，住在朝内81号东楼的一位国民党高级军官，丢下太太，一个人仓皇逃去了台湾。\n太太在楼里苦等丈夫回来接她，终于绝望，在阁楼的房梁上吊死了。\n当年给她送信的老邮差还记得，信封上清清楚楚写着「朝内81号」。\n\n从此每到夜里，就有人看见一个穿旗袍的女人在楼里走来走去。打雷下雨的晚上，还能听见她喊。\n前几年有施工队进去，一个工人进了地下室，再也没出来。\n还有人说，夜班车到这一站总要停一下，开门，却没有人下车……\n\n——回复：楼主胆儿真大\n——回复：不对吧，我听说是姨太太，不是正房\n——回复：我同学去过，回来发了一礼拜烧\n——回复：明明是文革那会儿的事，红卫兵进去都吓跑了\n——回复：假的吧，我家就住边上，啥也没有\n——回复：别去！那是危房！！' },
      notice: { title: '围墙上的告示', text: '朝阳门内大街81号院　情况说明\n\n本院两栋楼房建于二十世纪初，原系宗教团体产业，现经鉴定为危险房屋，随时有坍塌可能。\n近来网上流传本院「闹鬼」等种种说法，均无事实根据，望广大市民不信谣、不传谣。\n严禁任何人翻越围墙进入院内，后果自负。\n\n（落款的公章被雨水泡得只剩一个红圈。\n告示底下，有人用圆珠笔歪歪扭扭地添了一行：「越辟谣越说明有事」。）' },
      clip: { title: '糊在墙上的旧报纸', text: '（大杂院的年代，有人拿旧报纸糊墙挡风。一层盖着一层，像树的年轮。）\n\n最底下一层，黄得像隔夜的茶：\n「……本诊所即日起于朝阳门内大街六十九号西楼开诊，由教会修女主持，内外各科，贫苦者酌减诊金……　民国三十五年」\n\n中间一层是一张街道的油印通知，边角卷着：\n「……本年起全区门牌统一整顿编号。原朝阳门内大街六十九号，自即日起改编为八十一号。望各户互相转告，以免信件投递有误……　一九六五年」\n\n最上面一层，是一张印着样板戏剧照的挂历纸。' },
      photo: { title: '抽屉里的老照片', text: '一张巴掌大的黑白照片，四边切成了花边。\n\n照片上是个二十出头的姑娘，穿着护士的白褂子，站在一扇铁门跟前笑。门柱上钉着一块搪瓷门牌，看得清是「六十九」。\n她身边原本还站着一个人，被剪刀剪掉了，只剩一只搭在她肩膀上的手。\n\n背面用钢笔写着：\n「民国三十七年春，初来北平。摄于诊所门前。　阿婉」' },
      letters: { title: '一捆没寄出去的信', text: '（每一封的信封上都写着：「沈先生收」。没有地址，没有邮票。）\n\n一九四九年二月\n你走那天说，到了那边就来信。我天天去问送信的。\n\n一九五〇年冬\n诊所关了，修女们都走了。我没走。我在这儿住着，你回来，才找得着我。\n\n一九六五年夏\n街道上来人，把门口的牌子换了，说如今这里叫八十一号。我跟他们说不行，换了，信就找不着了。他们笑我。\n\n一九七一年冬\n咳得厉害。今年的信，大概是最后一封。\n院子里那棵槐树，是我刚来那年春天咱俩种的，如今比房檐还高了。\n你若回来，信就寄老地方：朝阳门内大街六十九号。\n我在这儿。' },
      reply: { title: '从香港转来的信', text: '阿婉：\n\n这封信托香港的朋友转寄，不知道你还能不能收到。\n\n那年到了那边，信寄不出去，人也回不来。一晃四十年。\n我每年春天都想，院子里那棵槐树，该有房檐高了吧。\n\n后来我成了家，有两个孩子。对不住你。\n我只想知道你过得好不好。\n\n若你已经不在那里了，就请拆信的人，替我在那棵槐树底下站一会儿。\n\n一九八八年三月　沈' }
    },
    legend: '朝内81号是北京东城区朝阳门内大街上的一座院子，院里东西两栋灰砖洋楼，地上三层，带地下室和阁楼，屋顶是法式的「蒙萨」双折顶。一般的说法是始建于1910年前后，但最初是谁盖的、做什么用，说法一直不一：有报道说是美国天主教本笃会出资修建，也有人说是京汉铁路一位法国经理的住宅。据说二三十年代这里办过教外国传教士、外交官学中文的学校；1946年，比利时天主教奥斯定修女会在楼里开过一间「普德诊所」，一直开到北平解放。此后楼房先后归一些机关单位使用；据说文革时红卫兵短暂占用过，之后就长期空置、年久失修。1994年前后产权交给了天主教团体，2009年前后被列为文物保护单位。\n\n大约从2000年代中期开始，有人翻墙进去探险拍照，「朝内81号」的鬼宅之名在论坛上越传越广，被排进「北京四大鬼宅」。流传最广的版本是：1949年，一位国民党军官逃往台湾，丢下的太太（也有说是姨太太、情人）在东楼里上吊自尽，此后打雷下雨的夜里，楼里会传出女人的尖叫。别的版本还有：文革时红卫兵占了这楼，住了没几天就被吓跑了；九十年代末，隔壁工地三个喝了酒的工人打穿墙钻进去，再也没出来，楼也因此没拆成；还有一个英国神父在楼里失踪，人们顺着地下室找到一条地道，一直通到大山子。细节在一次次转帖中不断增减。2014年，以它为原型的恐怖电影《京城81号》上映，又让这个名字热闹了一阵。\n\n这些说法都没有任何证据。产权方公开表示：没有任何记录显示有国民党军官在这里住过，院子里没有发生过命案，「鬼宅」之名纯属虚构；民俗学者也认为，这些故事和这座院落真实的历史并没有关系。人们看到的「阴森」，只是一座年久失修、长期没人住的老楼。大约2017年起，两栋楼修缮后对外出租。所谓「鬼宅」，更像是人们把对老房子、对旧时代的想象，一层一层糊在了它的墙上。\n\n（本章中护士阿婉、沈先生、看车的大爷、他们的书信与那封迟到的回信、「大杂院」年代的住户，以及阁楼「待久了会魔怔」的规矩，全部是游戏虚构，与这座建筑真实的历史和使用者无关。「门牌由69号改为81号」是本章为了谜题设定的前提——网上偶尔能看到类似的说法，但我们没有在可靠的公开报道里找到出处，请只当故事看；门口那辆「停站却没人下车」的夜班车，也是本章编的，不是流传的版本。修女开过诊所、军官太太的传说及其辟谣，取自公开报道。）',
    start: { map: 'hutong', x: 8, y: 3, dir: 2 },
    resume: {
      steps: async S => { if (S.f.stepsDone) return; S.stop('wan_c'); S.hide('wan_c'); S.hidePlayer(false); S.dark(null); S.plr(null); S.focus(null); await stepsBegin(S, true); },
      attic: async S => { if (S.map === 'attic') startAttic(S); }
    },
    async intro(S) {
      await S.card('第五夜　朝内81号', '2009年11月　北京　朝阳门内大街', '论坛上说，北京有四大鬼宅，\n朝内81号排第一。\n\n大刘说，今晚就去拍。\n拍着了，帖子能火。');
    },
    sprites: {
      bus(g, e, t, R) {   // 横着的夜班车，车头朝右，实体格子是车头所在的那一格
        R(-50, 10, 66, 4, 'rgba(0,0,0,.35)');
        bx2(R, -50, -16, 66, 28, '#c8c2a8'); R(-49, 4, 64, 3, '#a83a2a'); R(-49, 7, 64, 4, '#8a8470');
        for (let i = 0; i < 6; i++) { R(-46 + i * 9, -12, 7, 10, '#e8c870'); R(-46 + i * 9, -12, 7, 1, '#f8e8a0'); }
        if (e.face) { R(-44, -10, 4, 5, '#e4e0dc'); R(-44, -10, 4, 1, '#121014'); R(-43, -8, 1, 1, '#222'); }
        if (e.open) R(6, -12, 8, 21, '#2a2410'); else { R(6, -12, 8, 21, '#9a9480'); R(9, -12, 1, 21, '#6a6450'); }
        R(14, -10, 2, 6, '#e8e8d0'); R(14, 6, 2, 3, '#ffe890'); R(-50, 6, 2, 3, '#c02020');
        R(-36, 9, 8, 6, '#1a1a1a'); R(0, 9, 8, 6, '#1a1a1a'); R(-34, 11, 4, 2, '#555'); R(2, 11, 4, 2, '#555');
        digits(R, -18, -15, '81', '#5a5440');
      },
      gate(g, e, t, R) {   // 院门：两扇铁门（墙面，w=2）
        R(0, -6, 32, 20, '#141416'); R(0, -8, 32, 3, '#3a3a3e');
        for (let x = 2; x < 31; x += 3) R(x, -5, 1, 19, '#4a4c50');
        R(1, -1, 30, 1, '#4a4c50'); R(1, 7, 30, 1, '#4a4c50'); R(15, -6, 2, 20, '#2a2c30');
        R(13, 2, 6, 3, '#6a5a3a'); R(14, 5, 4, 3, '#8a7a4a');
      },
      plate(g, e, t, R) { R(3, 3, 10, 7, '#e8e4d8'); R(4, 4, 8, 5, '#2a4a8a'); digits(R, 5, 4, '81', '#e8e4d8'); R(3, 10, 10, 1, '#6a6a60'); },
      gap(g, e, t, R) {   // 围墙上塌开的豁口（墙面）
        R(2, 2, 12, 12, '#0a0a0c'); R(1, 0, 4, 3, '#4a4a4c'); R(10, -1, 5, 4, '#4a4a4c'); R(0, 4, 3, 3, '#3a3a3c'); R(13, 6, 3, 3, '#3a3a3c');
        R(3, 13, 3, 3, '#5a5a5c'); R(9, 14, 4, 2, '#5a5a5c'); R(6, 15, 2, 1, '#6a6a6c');
        R(4, 5, 1, 6, '#1e2a1a'); R(11, 4, 1, 7, '#1e2a1a');
      },
      bike(g, e, t, R) { const c = e.col || '#2a2a2a'; R(1, 8, 6, 6, c); R(2, 9, 4, 4, 'rgba(0,0,0,0)'); R(9, 8, 6, 6, c); R(4, 7, 9, 1, c); R(6, 4, 1, 4, c); R(5, 3, 3, 1, '#111'); R(12, 4, 1, 4, c); R(11, 3, 3, 1, '#888'); R(2, 10, 4, 2, '#3a3a3a'); R(10, 10, 4, 2, '#3a3a3a'); },
      stool(g, e, t, R) { R(3, 8, 10, 3, '#6a4a2a'); R(4, 11, 1, 4, '#4a3018'); R(11, 11, 1, 4, '#4a3018'); },
      mailboxes(g, e, t, R) {   // 墙上一排信报箱
        for (let i = 0; i < 2; i++) for (let j = 0; j < 3; j++) { bx2(R, 1 + j * 5, 1 + i * 6, 5, 6, '#4a5a4a'); R(2 + j * 5, 2 + i * 6, 3, 1, '#1a1e1a'); }
        R(12, 8, 2, 2, '#a82a22');
      },
      paperwall(g, e, t, R) { R(1, 0, 14, 13, '#b8ae8e'); R(2, 1, 12, 5, '#a89a76'); R(3, 2, 8, 1, '#5a5446'); R(3, 4, 6, 1, '#5a5446'); R(2, 7, 12, 5, '#c8bea0'); R(3, 8, 9, 1, '#6a6050'); R(3, 10, 5, 1, '#6a6050'); R(11, 0, 4, 3, '#8a7a5a'); R(1, 11, 3, 2, '#7a6a4a'); },
      medcab(g, e, t, R) { bx2(R, 1, -12, 14, 27, '#d8d4c4'); R(3, -10, 10, 9, '#3a4a50'); R(3, 1, 10, 9, '#3a4a50'); R(4, -9, 2, 4, '#7a5a3a'); R(8, -8, 2, 3, '#4a6a7a'); R(5, 3, 2, 5, '#9aa8a0'); R(9, 4, 2, 4, '#6a3a3a'); R(6, -3, 4, 1, '#a82a22'); R(7, -4, 2, 3, '#a82a22'); },
      clinicsign(g, e, t, R) { R(1, 8, 14, 6, '#5a4a32'); R(2, 9, 12, 4, '#7a6446'); R(3, 10, 3, 2, '#8a2a20'); R(8, 10, 2, 2, '#6a3a28'); R(0, 13, 3, 2, '#3a2a1a'); },
      woodcross(g, e, t, R) { R(7, 1, 2, 11, '#4a3420'); R(4, 4, 8, 2, '#4a3420'); R(8, 1, 1, 11, '#5a442c'); },
      win81(g, e, t, R) {   // 洋楼的长窗（墙面）
        bx2(R, 3, -1, 10, 15, '#4a3a2a');
        R(4, 0, 8, 13, e.lit ? '#9aa8b8' : '#0c1420'); R(7, 0, 2, 13, '#4a3a2a'); R(4, 6, 8, 1, '#4a3a2a');
        R(5, 1, 1, 4, '#3a4a5e'); R(10, 7, 1, 4, '#3a4a5e');
        if (e.broken) { R(9, 1, 3, 4, '#05080c'); R(10, 5, 1, 1, '#05080c'); }
        if (e.boarded) { for (const [y, c] of [[1, '#5e4a32'], [5, '#4e3c28'], [9, '#5a4630']]) { R(2, y, 12, 3, c); R(2, y, 12, 1, shade(c, .2)); R(3, y + 1, 1, 1, '#2a2420'); R(12, y + 1, 1, 1, '#2a2420'); } R(5, 4, 3, 1, '#c8bea0'); }
        if (e.fog) { R(4, 2, 3, 5, 'rgba(220,226,232,.55)'); R(9, 2, 3, 5, 'rgba(220,226,232,.55)'); R(5, 4, 2, 2, 'rgba(240,244,248,.7)'); R(10, 4, 2, 2, 'rgba(240,244,248,.7)'); }
      },
      nianhua(g, e, t, R) { R(3, 1, 10, 12, '#d8c8a0'); R(4, 2, 8, 6, '#c84a3a'); R(6, 3, 4, 4, '#e8c060'); R(5, 9, 6, 1, '#7a3a2a'); R(5, 11, 4, 1, '#7a3a2a'); },
      calendar(g, e, t, R) { R(4, 1, 8, 11, '#e8e2d0'); R(4, 1, 8, 4, '#b8302a'); digits(R, 5, 6, '71', '#3a3a3a'); R(7, 0, 2, 1, '#555'); },
      coalstove(g, e, t, R) { bx2(R, 3, 2, 10, 12, '#5a5650'); R(4, 3, 8, 2, '#3a3632'); R(6, 3, 4, 1, '#1a1814'); R(7, -10, 2, 12, '#4a4640'); R(7, -10, 5, 2, '#4a4640'); },
      coal(g, e, t, R) { for (let i = 0; i < 3; i++) for (let j = 0; j < 3 - (i > 1 ? 1 : 0); j++) { R(1 + j * 5, 10 - i * 4, 5, 4, '#2a2a2a'); R(2 + j * 5, 11 - i * 4, 1, 1, '#555'); R(4 + j * 5, 12 - i * 4, 1, 1, '#555'); } },
      sewing(g, e, t, R) { bx2(R, 0, 4, 16, 9, '#5a3a24'); R(2, 13, 1, 3, '#222'); R(13, 13, 1, 3, '#222'); R(3, -2, 9, 4, '#1a1a1a'); R(3, 0, 2, 5, '#1a1a1a'); R(10, -2, 2, 6, '#1a1a1a'); R(5, -1, 4, 1, '#c9a35a'); },
      hookpole(g, e, t, R) { R(10, -22, 2, 36, '#a8905a'); R(10, -22, 1, 36, '#c8b07a'); R(9, -26, 1, 5, '#555'); R(10, -27, 3, 1, '#555'); R(12, -26, 1, 2, '#555'); },
      hatch(g, e, t, R) {   // 天花板上的阁楼口（画成地上的一块影子 + 放下来的梯子）
        R(1, 1, 14, 14, 'rgba(0,0,0,.35)'); R(1, 1, 14, 1, '#2a1a10'); R(1, 14, 14, 1, '#2a1a10');
        if (e.open) { R(3, -18, 2, 32, '#7a6444'); R(11, -18, 2, 32, '#7a6444'); for (let y = -16; y < 14; y += 5) R(3, y, 10, 1, '#8a7454'); }
      },
      shoes2(g, e, t, R) { R(4, 9, 3, 5, '#141414'); R(9, 9, 3, 5, '#141414'); R(4, 9, 3, 1, '#2a2a3a'); R(9, 9, 3, 1, '#2a2a3a'); R(5, 11, 1, 1, '#6a2a3a'); R(10, 11, 1, 1, '#6a2a3a'); },
      trunk(g, e, t, R) { bx2(R, 0, 2, 16, 12, '#7a4a28'); R(1, 6, 14, 1, '#5a3418'); R(0, 2, 16, 2, '#8a5a34'); if (e.open) { R(1, -6, 14, 8, '#5a3418'); R(2, 3, 12, 3, '#1a0e08'); } else { R(6, 6, 4, 4, '#c9a35a'); R(7, 7, 2, 2, '#7a5a1a'); } },
      roundwin(g, e, t, R) {   // 阁楼山墙上的小圆窗
        R(3, 1, 10, 10, '#3a2a1a'); R(2, 3, 12, 6, '#3a2a1a'); R(4, 2, 8, 8, '#2a3a52'); R(3, 4, 10, 4, '#2a3a52');
        R(7, 2, 2, 8, '#3a2a1a'); R(3, 5, 10, 2, '#3a2a1a'); R(5, 3, 2, 2, '#a8b8d0'); R(9, 7, 2, 1, '#6a7a90');
      },
      beamrope(g, e, t, R) { R(-4, -18, 24, 4, '#3a2618'); R(-4, -18, 24, 1, '#5a4028'); R(7, -14, 2, 2, '#c8b890'); R(7, -12, 1, 9, '#6a5a3a'); R(8, -11, 1, 6, '#5a4a2a'); R(6, -4, 3, 2, '#5a4a2a'); },
      dustbox(g, e, t, R) { bx2(R, 1, 3, 14, 12, '#6a5a44'); R(1, 6, 14, 1, '#4a3c2c'); R(2, 3, 12, 1, '#8a7a64'); R(3, 9, 6, 1, '#4a3c2c'); },
      birdcage(g, e, t, R) { R(7, -4, 2, 3, '#555'); R(4, -1, 8, 2, '#6a5a3a'); for (let x = 4; x < 13; x += 2) R(x, 1, 1, 11, '#6a5a3a'); R(4, 12, 9, 2, '#5a4a2a'); },
      huai(g, e, t, R) {   // 枯槐树：只占一格，向上伸出去很高
        const c = '#3a2e24', d = '#2a2018';
        R(5, -6, 7, 21, c); R(6, -6, 2, 21, '#4a3c30'); R(4, 13, 9, 2, d);
        R(3, -14, 3, 9, c); R(1, -20, 3, 7, c); R(-3, -24, 5, 2, c); R(11, -16, 3, 11, c); R(13, -24, 3, 9, c); R(16, -28, 4, 2, c); R(7, -26, 3, 20, c); R(5, -32, 3, 7, c); R(9, -34, 2, 9, c);
        R(-6, -18, 9, 2, d); R(14, -12, 8, 2, d); R(2, -28, 3, 2, d); R(18, -22, 4, 2, d);
        R(6, 2, 4, 3, '#4e4236');
        if (e.bud) { const gcol = '#7ac06a'; [[-3, -25], [2, -21], [16, -29], [10, -35], [5, -33], [20, -23], [-5, -19], [21, -13], [13, -25], [1, -29]].forEach(([x, y]) => R(x, y, 1, 1, gcol)); }
      },
      clothes(g, e, t, R) { R(1, -10, 1, 24, '#5a4a3a'); R(46, -10, 1, 24, '#5a4a3a'); R(1, -9, 46, 1, '#8a8a80'); R(14, -8, 8, 9, '#4a6a8a'); R(15, -8, 6, 1, '#6a8aaa'); R(30, -8, 6, 6, '#b8b0a0'); },
      hole(g, e, t, R) { R(1, 1, 14, 14, '#050302'); R(1, 1, 14, 1, '#5a4430'); R(1, 14, 14, 1, '#5a4430'); R(3, 2, 2, 12, '#6a5438'); R(11, 2, 2, 12, '#6a5438'); for (let y = 4; y < 14; y += 4) R(3, y, 10, 1, '#7a6444'); },
      coldfire(g, e, t, R) { bx2(R, -2, -10, 36, 25, '#5a5450'); R(-2, -12, 36, 3, '#3a3430'); R(6, -2, 20, 16, '#2a1e18'); for (let i = 0; i < 5; i++) for (let j = 0; j < 4; j++) R(7 + i * 4, -1 + j * 4, 3, 3, (i + j) % 2 ? '#6a3a2a' : '#5a3020'); R(4, -9, 24, 2, '#1a1410'); },
      bench2(g, e, t, R) { R(1, 6, 14, 3, '#6a6660'); R(1, 6, 14, 1, '#8a8680'); R(2, 9, 2, 5, '#5a5650'); R(12, 9, 2, 5, '#5a5650'); }
    },
    maps: {
      /* ---------------- 朝内大街 · 81号院墙外 ---------------- */
      hutong: {
        amb: 'wind', dark: .72, plr: 3.2, wall: 'brick', floor: 'sidewalk',
        wallC: { face: '#5c5a58', trim: '#34322f', top: '#1a1918' },
        tileOpts: { treeC: '#1c2a1e', grassC: '#26301f' },
        rows: [
          '############################',
          '############################',
          '____________________________',
          '____________________________',
          '::::::::::::::::::::::::::::',
          '============================',
          '::::::::::::::::::::::::::::',
          '____________________________',
          'hhhThhhhhhhhhThhhhhhhhhhThhh',
          'hhhhhhhhhhhhhhhhhhhhhhhhhhhh'],
        ents: [
          { id: 'gap', x: 3, y: 1, spr: 'gap', on: gapOn },
          { x: 1, y: 1, spr: 'poster', col: '#8a8678', on: S => S.narr('墙上用白灰刷着一个大大的「拆」字，又被人用红漆打了个叉。\n底下有人用粉笔写：「到此一游」。') },
          { id: 'notice', x: 7, y: 1, spr: 'poster', col: '#d8d0b8', async on(S) { await S.note('notice'); } },
          { x: 10, y: 2, spr: 'streetlamp', light: { r: 4.4, dy: -14, col: 'rgba(255,200,120,.2)' }, on: S => S.narr('路灯的光是橘黄色的，照得院墙上的爬山虎像一张张晒干的手。') },
          { id: 'gateE', x: 13, y: 1, w: 2, spr: 'gate', on: S => S.narr('院子的正门。两扇铁门之间缠着一圈手腕粗的铁链，挂着一把大锁。\n锁眼让铁锈糊死了，不知道多少年没人开过。\n隔着铁栏杆往里看：荒草，两栋黑乎乎的楼，没有一扇窗户亮着。') },
          { id: 'plate', x: 15, y: 1, spr: 'plate', async on(S) {
            if (S.once('plate')) { await S.narr('门柱上钉着一块蓝底白字的门牌：「朝阳门内大街　81」。'); return S.narr('凑近了看，这块门牌底下还压着一块更老的搪瓷牌，露出来一角。\n上面的字只剩半个——像是个「9」。'); }
            await S.narr('「朝阳门内大街　81」。\n底下那块旧牌子上的「…9」，被新牌子压住了大半。');
          } },
          { x: 19, y: 3, spr: 'busstop', on: S => S.narr('公交站牌。铁皮锈得起了泡，站名那一栏只看得清两个字：「朝内」。\n夜班车那一行写着：「末班　无定时」。') },
          { x: 22, y: 2, spr: 'streetlamp', flicker: true, light: { r: 3.6, dy: -14, col: 'rgba(255,200,120,.16)' }, on: S => S.narr('这盏路灯一闪一闪的，像是随时要灭。') },
          { x: 23, y: 2, spr: 'bike', on: S => S.narr('一辆二八自行车，车筐里塞着一沓发黄的报纸。') },
          { id: 'pbike', x: 24, y: 2, spr: 'bike', col: '#3a2a2a', async on(S) {
            await S.narr('一辆墨绿色的老自行车，车把上挂着一个军绿色的帆布包，包上印着褪了色的四个字：「人民邮政」。\n车铃是老式的转铃，铜皮磨得发白。');
            if (await S.ask('按一下车铃？', ['按', '算了']) === 1) return;
            bikeBell(S);
            await S.narr('「叮铃——叮铃——」\n铃声在空荡荡的大街上传出去老远。');
            if (!S.f.gotReply && S.once('bellYe')) { S.face('ye', 'pl'); await S.say('看车大爷', ['哎——别瞎按！那是我的车。', '……这铃铛，三十多年了，还这么响。']); }
          } },
          { x: 26, y: 2, spr: 'sign', col: '#3a5a3a', on: S => S.narr('「存车处　一次两毛」。\n牌子底下，看车的大爷摆了个小马扎，一个铝饭盒，一台收音机。') },
          { x: 26, y: 3, spr: 'stool' },
          { x: 16, y: 7, spr: 'streetlamp', off: true, on: S => S.narr('这一盏早就不亮了。灯罩里积着厚厚一层死飞蛾。') },
          { x: 5, y: 7, spr: 'sign', col: '#6a3a2a', on: S => S.narr('街对面一家小饭馆，卷帘门拉得严严实实。\n门上的招牌写着：「卤煮　炒肝」。') },
          { id: 'liu', x: 11, y: 3, spr: '@liu', dir: 1, async on(S) {
            S.face('liu', 'pl');
            if (S.f.done) return;
            if (S.f.gotReply) return S.say('大刘', cycle(S, '_lr', ['大爷给你啥了？……一封信？给谁的？', '我不进去啊，说好了，我放风。', '你脸色怎么跟纸似的……']));
            if (S.f.solved) return S.say('大刘', '大爷在院门口等你呢，说有东西要给你！');
            await S.say('大刘', cycle(S, '_ll', ['我在这儿给你放风，有动静我给你发短信。', '记得多拍几张！特别是阁楼，帖子里说的就是阁楼。', '你看那车……算了，你快去快回吧。']));
          } },
          { id: 'ye', x: 25, y: 3, spr: '@ye', dir: 1, on: yeOn },
          { id: 'bus', x: -4, y: 5, spr: 'bus', solid: false, hidden: true },
          { id: 'wan_h', x: 14, y: 2, spr: '@wan', solid: false, hidden: true, light: { r: 1.4, col: 'rgba(160,190,255,.14)' } }
        ],
        async enter(S, first) {
          if (first) {
            S.give('camera', true);
            await S.say('大刘', ['就这儿。朝内81号。', '看见那两栋楼没？民国时候的洋楼，二十多年没人住了。网上都说，北京四大鬼宅，这儿排头一个。']);
            await S.say('大刘', '帖子我给你打印出来了，你先瞅瞅。');
            await S.note('post'); S.f.r_post = true;
            const r = await S.ask('大刘把相机塞到你手里。', ['「你不一块儿进去？」', '「行，我去去就回。」'], '大刘');
            if (r === 0) await S.say('大刘', ['我？我、我得有人在外头放风啊！万一有人来查呢？', '……再说了，我这人八字轻。']);
            await S.say('大刘', ['帖子说出事的是东楼。东楼的门早让砖头砌死了，西楼还能进，阁楼也是通的。', '正门锁死了。西头围墙塌了个豁口，大伙儿都从那儿钻。', '那边存车处的大爷，在这条街上住了一辈子，你要害怕，可以先跟他打听打听。']);
            S.f.talked = true;
            S.goal('从西头围墙的豁口钻进院子');
            return;
          }
          if (S.f.solved && !S.f.gotReply && S.once('backOut')) {
            S.face('liu', 'pl'); S.bubble('liu', '!', 1000);
            await S.say('大刘', ['你可算出来了！里头那么大动静，我还以为你……', '看车的大爷找你半天了。你看——他就在院门口站着呢，站了快一个钟头了，一步都没往里迈。']);
          }
        }
      },
      /* ---------------- 西楼 · 一楼大厅 ---------------- */
      hall: {
        amb: 'drone', dark: .88, plr: 3, wall: 'paper', floor: 'wood',
        wallC: GREEN,
        rows: [
          '##############',
          '##############',
          '#............#',
          '#............#',
          '#............#',
          '#............#',
          '#............#',
          '#............#',
          '#............#',
          '#............#',
          '##########.###'],
        ents: [
          { x: 1, y: 2, spr: 'stairsup', solid: false, async touch(S) { await S.go('floor2', 2, 7, 2); } },
          { x: 2, y: 1, spr: 'win81', lit: true, light: { r: 2.6, dy: 20, col: 'rgba(140,170,220,.12)' }, on: S => S.narr('窗玻璃上糊着一层灰，月亮在灰后面，像一块化开的猪油。') },
          { x: 4, y: 2, w: 2, spr: 'coldfire', on: S => S.narr('西式的壁炉，炉口拿砖头砌死了，砖缝里塞着烟头和糖纸。\n大杂院那些年，这儿大概砌过一个灶台。壁炉台上还留着一圈一圈烧黑的锅底印。') },
          { id: 'clipW', x: 7, y: 1, spr: 'paperwall', async on(S) {
            if (S.once('clipFirst')) await S.narr('这面墙上糊着好几层旧报纸。最外面那层翘起来了，露出底下更黄的一层。');
            await S.note('clip'); S.f.r_clip = true;
          } },
          { id: 'mailbox', x: 9, y: 1, spr: 'mailboxes', on: S => (S.f.t_mail = true, S.narr('墙上钉着一排铁皮信报箱，户主的名字都锈没了。\n只有最边上那一个，用红漆写着一个字：「婉」。\n你掀开盖子——里面空空的，只有一层细细的灰。\n盖子的合页，倒是磨得比别的都亮。')) },
          { x: 11, y: 1, spr: 'win81', broken: true, lit: true, light: { r: 2.4, dy: 20, col: 'rgba(140,170,220,.1)' }, on: S => S.narr('这扇窗破了一块，夜风从破洞里灌进来，呜呜地响。') },
          { id: 'backdoor', x: 12, y: 1, spr: 'door', col: '#3a2a1e', async on(S) { S.sfx('open'); await S.go('yard', 3, 2, 0); } },
          { x: 13, y: 1, spr: 'woodcross', on: S => S.narr('门框边上钉着一个小小的木头十字架，漆都掉光了。\n听说这楼以前是教会的产业，楼下还开过诊所。') },
          { x: 12, y: 5, spr: 'medcab', on: S => S.narr('一只玻璃门的白漆柜子，柜门上用红漆画着一个十字。\n里面立着几个空药瓶，标签上的外文早就看不清了。') },
          { x: 3, y: 6, spr: 'clinicsign', solid: false, on: S => S.narr('一块倒在地上的木牌，红漆写着几个字，只认得出一个「诊」。') },
          { x: 7, y: 5, spr: 'chair', col: '#4a3020', on: S => S.narr('一把断了腿的椅子，歪在那儿，像是有人刚刚从上面站起来。') },
          { x: 8, y: 5, spr: 'table', col: '#4a3424', on: S => S.narr('桌面上落满了灰。有人用手指在灰上写了一行字：「我来过　2007.8」。') },
          { x: 1, y: 8, spr: 'crate', on: S => S.narr('一只木箱子，里面全是碎砖头。') },
          { x: 1, y: 9, spr: 'box', on: S => S.narr('纸箱上印着「红星二锅头」。里面是一摞八十年代的《大众电影》，封面让耗子啃了。') },
          { x: 6, y: 8, spr: 'stain', decal: true, col: 'rgba(30,24,20,.6)' },
          { x: 10, y: 7, spr: 'footprints', decal: true, col: 'rgba(200,190,170,.22)' },
          { x: 9, y: 5, spr: 'footprints', decal: true, col: 'rgba(200,190,170,.22)' },
          { x: 10, y: 10, spr: 'invisible', async touch(S) { yeToGate(S); await S.go('hutong', 3, 2, 0); } }
        ],
        async enter(S, first) {
          if (!first) return;
          await S.narr('穿过前院齐腰的荒草，楼门是虚掩着的。\n一股潮乎乎的霉味儿迎面扑过来，混着老鼠屎和烂木头的味道。');
          await S.narr('地板是暗红色的，漆皮翘着。墙刷着半截绿漆，像医院走廊。\n灰上有好几串脚印，大大小小，都是来探险的人留下的。');
          S.goal('上二楼看看（西北角的楼梯）');
        }
      },
      /* ---------------- 西楼 · 二楼走廊与卧室 ---------------- */
      floor2: {
        amb: 'drone', dark: .9, plr: 2.9, wall: 'paper', floor: 'wood',
        wallC: GREEN,
        rows: [
          '################',
          '################',
          '#....#....#....#',
          '#....#....#....#',
          '#....#....#....#',
          '#....#....#....#',
          '###.####.####.##',
          '#..............#',
          '#..............#',
          '################'],
        ents: [
          { x: 1, y: 7, spr: 'stairsdown', solid: false, async touch(S) {
            if (S.f.steps && !S.f.stepsDone) { S.sfx('heart'); await S.narr('不行！脚步声就是从楼梯底下上来的！'); S.pos(2, 7, 2); return; }
            await S.go('hall', 2, 2, 0);
          } },
          /* 西屋：大杂院年代的一户人家 */
          { id: 'wardA', x: 1, y: 2, spr: 'wardrobe', col: '#4a3424', on: wardOn('wardA') },
          { x: 2, y: 1, spr: 'nianhua', on: S => S.narr('墙上贴着一张年画，胖娃娃抱着大鲤鱼。\n娃娃的脸让人用圆珠笔画了两撇胡子。') },
          { id: 'winA', x: 3, y: 1, spr: 'win81', lit: true, light: { r: 2.4, dy: 20, col: 'rgba(140,170,220,.1)' }, on: S => S.ent('winA').s.fog ? S.narr('玻璃上蒙着一层白白的哈气。\n哈气中间，有两个手掌按出来的印子，正对着院门。') : S.narr('窗外是前院的荒草，再往外是院墙和大街。\n大刘的红羽绒服在路灯底下，小得像一颗枸杞。') },
          { x: 4, y: 2, h: 2, spr: 'bed', col: '#6a5a48', on: S => S.narr('一张木板床，褥子烂成了一绺一绺的。\n枕头边上压着一本1983年的《新华字典》。') },
          { x: 1, y: 5, spr: 'coalstove', on: S => S.narr('一个铁皮的煤球炉子，烟筒歪着伸向窗户。\n炉膛里还有半块没烧完的蜂窝煤。') },
          /* 中屋：阿婉的屋子 */
          { id: 'wardB', x: 6, y: 2, spr: 'wardrobe', col: '#5a3a28', on: wardOn('wardB') },
          { id: 'dresser', x: 7, y: 2, spr: 'dresser', col: '#5a3a28', async on(S) {
            if (S.once('photoFirst')) await S.narr('五斗柜的抽屉都被人翻过了，只有最底下那一层卡住了。\n你使劲一拽——抽屉里滑出一张照片。');
            await S.note('photo'); S.f.r_photo = true;
          } },
          { id: 'winB', x: 8, y: 1, spr: 'win81', lit: true, light: { r: 2.4, dy: 20, col: 'rgba(140,170,220,.1)' }, on: S => S.ent('winB').s.fog ? S.narr('玻璃上蒙着一层白白的哈气。\n哈气中间，有两个手掌按出来的印子，正对着院门。') : S.narr('从这扇窗户往下看，正好看得见院门，和门外的公交站牌。') },
          { x: 9, y: 2, h: 2, spr: 'bed', col: '#7a8a9a', on: S => S.narr('铁架子床，床单是白的，叠得方方正正——在这么一间破屋子里，干净得叫人发毛。') },
          { x: 9, y: 5, spr: 'cup', on: S => S.narr('一只搪瓷缸子，印着一朵红牡丹。缸底干了一圈茶垢。') },
          /* 东屋：堆杂物的 */
          { x: 11, y: 2, spr: 'dustbox', on: S => S.narr('一摞落满灰的纸箱子。最上面那只写着：「劳保用品　手套」。') },
          { x: 12, y: 1, spr: 'win81', broken: true, boarded: true, on: S => S.narr('窗户上钉着几块木板，木板缝里塞着旧报纸。\n钉子是从屋里往外钉的。') },
          { x: 11, y: 4, spr: 'sewing', on: S => S.narr('一台蝴蝶牌缝纫机，踏板上的铁锈红得像血。') },
          { x: 14, y: 5, spr: 'coal', on: S => S.narr('一垛蜂窝煤，码得整整齐齐。总有人打算在这儿过冬的。') },
          { id: 'pole', x: 14, y: 2, spr: 'hookpole', on: takePole },
          /* 走廊 */
          { x: 6, y: 6, spr: 'poster', col: '#c8c0a0', on: S => S.narr('墙上贴着一张「防火公约」，落款是「六十九号院居民小组」。\n「六十九」三个字让人用钢笔描过好几遍。') },
          { id: 'calendar', x: 11, y: 6, spr: 'calendar', on: S => { S.f.t_cal = true; return S.narr('一本1971年的挂历，停在了十一月。\n十一月的某一天，被人用红笔圈了一个圈，旁边写着两个字：「来信？」\n字写得歪歪扭扭的，像是写字的人，手已经没什么力气了。'); } },
          { x: 5, y: 8, spr: 'puddle', decal: true },
          { id: 'shoes', x: 10, y: 8, spr: 'shoes2', on: S => (S.f.t_shoes = true, S.narr(S.f.stepsDone ? '那双黑布鞋还在原地。\n……鞋尖，现在冲着中间那间屋的窗户。' : '走廊正中间，并排摆着一双女式的黑布鞋，鞋口绣着小小的红花。\n鞋尖朝着楼梯口，像在等谁上楼。')) },
          { id: 'hatch', x: 14, y: 7, spr: 'hatch', solid: false, on: hatchOn },
          { id: 'wan_c', x: 1, y: 8, spr: '@wan', solid: false, hidden: true, light: { r: 1.6, col: 'rgba(150,180,255,.14)' } }
        ],
        async enter(S, first) {
          if (!first) return;
          await S.narr('楼梯一踩一声「吱呀」，像是有人在你脚底下叹气。\n二楼的走廊又窄又长，三间屋子的门全敞着。');
          await sms(S, '到哪儿了？帖子说吊死的那个在阁楼，你找找阁楼在哪儿。\n还有，我刚才好像看见二楼有个窗户亮了一下，你开手电了？');
          await S.think('……我没开手电。');
          S.goal('在二楼找找看。帖子里说的阁楼，入口在哪儿？');
        },
        tick(S, dt) { stepsTick(S, dt); }
      },
      /* ---------------- 阁楼 ---------------- */
      attic: {
        amb: 'night', dark: .92, plr: 2.6, wall: 'wood', floor: 'darkwood',
        rows: [
          '##############',
          '##############',
          '#WWWWWWWWWWWW#',
          '#WWWWWWWWWWWW#',
          '#WWWWWWWWWWWW#',
          '#WWWWWWWWWWWW#',
          '#WWWWWWWWWWWW#',
          '##############'],
        ents: [
          { x: 12, y: 6, spr: 'hole', solid: false, touch: atticDown },
          { id: 'rwin', x: 6, y: 1, spr: 'roundwin', light: { r: 3.4, dy: 26, col: 'rgba(150,175,230,.18)' }, on: S => (S.f.t_rwin = true, S.narr('山墙上开着一扇小圆窗，玻璃裂成了好几瓣。\n从这儿正好能望见朝内大街，和81号门口那块站牌。\n窗台上有两道浅浅的凹痕，像是有人常年把胳膊肘撑在这里。')) },
          { id: 'trunk', x: 2, y: 2, spr: 'trunk', on: trunkOn },
          { id: 'desk', x: 9, y: 2, spr: 'desk', col: '#4a3424', on: deskOn },
          { id: 'beam', x: 4, y: 4, spr: 'beamrope', solid: false, async on(S) {
            S.f.r_beam = true;
            await S.narr('一根粗房梁横在头顶上，垂下来半截发黑的麻绳。\n绳子勒过的地方，木头磨得发亮。');
            await S.think('帖子里说的……就是这根梁？');
            await S.narr('你举着手机往东照了照。\n第二根、第三根、第四根房梁上，都有一模一样发亮的印子，一根挨着一根。');
          } },
          { id: 'book', x: 11, y: 3, spr: 'book', col: '#3a4a3a', on: S => (S.f.t_book = true, S.narr('一本受潮的硬皮登记簿，压在一摞旧报纸底下。\n「一九五三年　朝阳门内大街六十九号院　住户登记」\n「西楼二层中间：婉（护士），独居。」\n「阁楼：各户公用，晾晒衣物，不得堆放易燃杂物。」')) },
          { x: 1, y: 5, spr: 'dustbox', on: S => S.narr('一只纸箱，里面是一摞冬天用的棉门帘，硬得像纸壳。') },
          { x: 3, y: 6, spr: 'chair', col: '#3a2a1a', on: S => S.narr('一把竹椅，椅面上落的灰中间，有一块干净的圆印子——像是不久前还有人坐过。') },
          { x: 5, y: 2, spr: 'birdcage', on: S => S.narr('一只空鸟笼。笼门开着，食槽里还有几粒干小米。') },
          { x: 8, y: 6, spr: 'doll', col: '#c8b8a0', on: S => S.narr('一个布娃娃，一只眼睛的扣子掉了。\n它坐的位置，正好对着那扇圆窗。') },
          { x: 12, y: 2, spr: 'sack', on: S => S.narr('一袋发了霉的棉絮。') },
          { id: 'wan_a', x: 6, y: 2, spr: '@wan', dir: 3, solid: false, hidden: true, light: { r: 1.4, col: 'rgba(150,180,255,.12)' } }
        ],
        async enter(S, first) {
          if (first) {
            await S.narr('阁楼很矮，你得猫着腰才不会撞到房梁。\n空气又干又冷，月光从一扇小圆窗里漏进来，照见满地的灰。');
            await S.narr('奇怪的是，一上来，楼下那些吱吱呀呀的声音全都听不见了。\n安静得能听见自己的心跳。');
            S.goal('阁楼：查清楚这栋楼的故事');
          }
          if (!S.f.solved) { startAttic(S); S.cp('attic'); }
        },
        tick(S) { atticTick(S); }
      },
      /* ---------------- 后院 ---------------- */
      yard: {
        amb: 'wind', dark: .84, plr: 3, wall: 'brick', floor: 'dirt',
        wallC: { face: '#565452', trim: '#32302e', top: '#181716' },
        tileOpts: { grassC: '#2a3020' },
        rows: [
          '##################',
          '##################',
          '#dddd""dddddddd""#',
          'dddd"""dddddddd""#',
          '#dd""dddddddddddd#',
          '#ddddddddddddd""d#',
          '#d"ddddddddddd"""#',
          '#""ddddddddddddd"#',
          '#"""ddddddddddddB#',
          '#BB"dddddddddd"BB#',
          '##################'],
        ents: [
          { x: 3, y: 1, spr: 'door', col: '#3a2a1e', async on(S) { S.sfx('open'); await S.go('hall', 12, 2, 0); } },
          { x: 0, y: 3, spr: 'invisible', async touch(S) { yeToGate(S); await S.go('hutong', 3, 2, 0); } },   // 西楼和围墙之间的窄道，通回豁口
          { x: 7, y: 1, spr: 'win81', on: S => S.narr('一楼的后窗。里面黑洞洞的。') },
          { x: 11, y: 1, spr: 'win81', on: S => S.narr('窗台上摆着一个空酒瓶，瓶口插着一朵塑料花，早褪成了白色。') },
          { x: 14, y: 1, spr: 'win81', broken: true, on: S => S.narr('东楼的窗户。窗框里探出来一根枯藤，在风里一点一点的。\n帖子里说，出事的是东楼。可东楼的楼门，早让砖头砌死了，谁也进不去。') },
          { id: 'tree', x: 9, y: 5, spr: 'huai', on: treeOn },
          { x: 12, y: 3, w: 3, spr: 'clothes', solid: false, on: S => S.narr('两根铁杆子之间拉着一根晾衣绳，上面挂着一件蓝布衫，风一吹，袖子一摆一摆的。\n……这院子里，谁还在晾衣服？') },
          { x: 2, y: 8, spr: 'bike', col: '#4a3a2a', on: S => S.narr('一辆只剩一个轱辘的自行车，链条锈成了一整根铁棍。') },
          { id: 'bench', x: 6, y: 8, spr: 'bench2', on: S => { S.f.t_bench = true; return S.narr('一块青石板搭的长凳，正对着槐树。\n石板上让人刻了一道一道的划痕，五道一捆，五道一捆——像是在数日子。\n你数了数，没数完。'); } },
          { x: 15, y: 7, spr: 'coal', on: S => S.narr('煤球垛子塌了一半，长满了青苔。') },
          { x: 16, y: 2, spr: 'deadplant', on: S => S.narr('一个破瓦盆，里面的花早就死了，只剩几根干棍。') },
          { id: 'wan_y', x: 9, y: 7, spr: '@wan', dir: 0, hidden: true, light: { r: 1.8, col: 'rgba(170,195,255,.16)' }, on: finale }
        ],
        async enter(S, first) {
          if (S.f.gotReply && !S.f.done) {
            S.show('wan_y'); S.ent('wan_y').alpha = 1; S.dark(.86);
            if (S.once('yardMeet')) {
              S.sfx('heart'); S.focus(9, 6);
              await S.narr('风停了。');
              await S.narr('槐树底下，站着一个人。');
              S.focus(null);
            }
            return;
          }
          if (first) {
            await S.narr('后院比前院还荒。正中间一棵老槐树，枝杈光秃秃的，伸得比楼还高。\n风从树杈中间穿过去，像有人在很远的地方吹口哨。');
            /* 惊鸿一瞥：给结局埋伏笔 */
            const w = S.ent('wan_y'); w.alpha = 0; S.focus(9, 6); S.sfx('whisper');
            await S.alpha('wan_y', .32, 700);
            await S.wait(900);
            S.sfx('heart');
            await S.alpha('wan_y', 0, 220);
            S.focus(null);
            await S.think('……槐树底下，刚才是不是站着个人？\n一眨眼，什么都没有了。');
          }
        }
      }
    }
  });
})();
