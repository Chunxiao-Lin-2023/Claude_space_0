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
    bus.open = true; S.sfx('open');
    await S.narr('是一辆夜班车。车厢里亮着黄澄澄的灯，一排一排的座位全空着。\n它在81号门口的站牌底下停住，前门「哗」地打开了。');
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
    if (S.f.gotReply && !S.f.done) await S.narr('天边已经有点发灰了。\n你攥紧那封信，又一次钻进了豁口。');
    else if (S.once('gapIn')) await S.narr('你猫着腰，从豁口钻了进去。\n砖茬子刮住了外套，「嗤啦」一声。');
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
        await S.say('看车大爷', ['闹鬼？我在这条街上活了六十多年，没见过鬼。', '说法倒是听了一箩筐。有说是国民党的大官跑台湾，太太在楼上吊死了；', '有说前几年施工队进去修，地下室挖出个什么，有个小工第二天就没影了——要我说，嫌工钱少跑了呗。', '还有说地底下有条地道，通到哪儿哪儿的。你们年轻人，就爱听这个。']);
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
    await S.say('看车大爷', ['阿婉……婉姐。', '我十九岁开始送信，这条街归我。西楼二层东头那间，住着一个女的，原先是楼下诊所的护士。诊所关了，她没走，就在这儿住下了。', '每天我一进院子，她就站在后院那棵槐树底下，问我一句：「有我的信吗？」', '天天问。问了十几年。我天天说：「没有。」', '后来，我都不敢从后院走了。']);
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
  async function stepsBegin(S) {
    await S.wait(700);
    S.sfx('step'); await S.wait(520); S.sfx('step'); await S.wait(520); S.sfx('step');
    await S.narr('楼梯那边，响起了脚步声。\n嗒。嗒。嗒。——是硬鞋跟踩在木楼梯上的声音，不紧不慢。');
    await S.think('大刘？……不对。大刘穿的是球鞋。');
    S.goal('有人上楼了——快找个衣柜躲起来！');
    S.timer(10, '脚步', stepsArrive);
  }
  async function stepsArrive(S) {
    if (S.f.stepsDone || S.pl.hidden || S.map !== 'floor2') return;
    const g = S.ent('wan_c'); S.place('wan_c', 1, 8, 2); g.alpha = 1;
    S.sfx('sting');
    S.chase('wan_c', { spd: 2.7, catch: caughtSteps });
    await S.narr('楼梯口站着一个穿旗袍的女人。\n她慢慢地，把脸转向了你。');
    S.goal('躲进衣柜！');
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
    await S.narr('脚步声在这间屋的门口停住了。\n门缝太窄，你只看得见一角蓝布衣襟，和一只黑色的布鞋尖。');
    await S.wait(1000);
    S.focus(dx, 4);
    await S.walk('wan_c', [dx, 4], 1.6);
    S.face('wan_c', id === 'wardA' ? 1 : 1); S.sfx('heart');
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
  function atticTick(S) {
    if (S.f.solved || !W.timer || W.busy) return;
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
    S.hide('wan_a');
    if (!S.f.solved && S.once('atticOut')) await S.narr('一下到走廊，脑子立刻清醒了不少。\n……刚才在上头，你差点就坐下了。');
    await S.go('floor2', 13, 7, 1);
  }
  async function atticBad(S) {
    if (S.map !== 'attic' || S.f.solved) return;
    S.amb('none');
    await S.narr('你忽然觉得很累。\n灰尘在月光里慢慢地飘，像在下雪。');
    await S.think('……再坐一会儿吧。就一会儿。\n反正，也不知道要等的人什么时候来。');
    const w = S.ent('wan_a'); w.alpha = 0; S.show('wan_a');
    await S.alpha('wan_a', .85, 1400);
    await S.narr('圆窗跟前，不知什么时候多了一个人。\n她侧着身子，两只胳膊肘撑在窗台上，朝大街的方向望。');
    await S.say('？？？', '你也在等人吗？', { style: 'whisper' });
    S.sfx('heart');
    await S.narr('你张了张嘴，想说「不是」。\n可你还是挪到了窗台边上，在她旁边，也撑起了胳膊肘。');
    await S.fade(1, 1500);
    await S.end({ bad: true, title: '阁楼的圆窗', text: '大刘在胡同口等到天亮，你始终没有出来。\n\n后来，论坛上那个帖子底下多了一条回复：\n「夜里从朝内大街往上看，阁楼那扇小圆窗里，有时候能看见两个人影，\n并排撑着窗台，朝门口的站牌望。」' });
  }
  async function trunkOn(S) {
    const t = S.ent('trunk');
    if (t.open) return S.narr('箱子已经空了。箱底垫着一张发脆的旧报纸，日期是民国三十七年。');
    await S.narr('一只樟木箱子，挂着一把老式的转轮铜锁。\n锁面上刻着两个小字：「来时」。');
    const v = await S.keypad('四位数的转轮锁　·　「来时」', KEYS, 4);
    if (v == null) return;
    if (v !== '1948') {
      S.sfx('locked');
      if (!S.f.r_photo) return S.narr('锁纹丝不动。\n「来时」……得先知道，箱子的主人是哪一年来的。');
      return S.narr('锁纹丝不动。\n照片背面写着「民国三十七年」。民国元年是1912年……');
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
    const need = [['r_post', '大刘的帖子'], ['r_clip', '楼下的旧剪报'], ['r_photo', '那张老照片'], ['r_letters', '箱子里的东西']].filter(([k]) => !S.f[k]).map(a => a[1]);
    if (need.length) return S.narr('一张旧书桌，桌面落满了灰。\n关于这栋楼，有好几种说法。要是把它们摆在一起看……\n\n还缺：' + need.join('、') + '。');
    if (S.once('deskLay')) await S.narr('你用袖子在桌上擦出一块干净地方，把帖子、剪报、照片和那捆信，一样一样摊开。\n四样东西，讲的像是四个不同的故事。');
    const q1 = await S.ask('其中有一个说法，是后来的人编出来的。是哪一个？', [
      '帖子：1949年，军官出逃，太太在「81号」楼上自缢',
      '剪报：楼是教会的产业，后来开过一间小诊所',
      '照片：1948年春，护士阿婉住进了六十九号',
      '（再想想）']);
    if (q1 === 3) return;
    if (q1 === 1) return S.narr('剪报上的说法有档案可查，照片背面也写着「诊所门前」。\n这一条对得上。');
    if (q1 === 2) return S.narr('照片是她自己留下的，信封上的地址也是六十九号，日子一天不差。\n这一条，也对得上。');
    const q2 = await S.ask('帖子里，哪一处是不可能的？', [
      '那一年这里的门牌还是「六十九号」，「81号」是1965年以后才有的',
      '1949年的北平，不可能有军官',
      '网上的帖子，本来就没一句真话']);
    if (q2 === 1) return S.narr('……这么说太武断了。\n帖子里一定有一样东西，在那一年根本不可能存在。');
    if (q2 === 2) return S.narr('网上的东西不全是假的。\n得找出一个实实在在的破绽。');
    S.f.solved = true; S.clearTimer(); S.f.atticLeft = 0;
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
    if (!h.down) {
      if (!S.has('hook')) {
        await S.narr('走廊尽头的天花板上，有一块方方正正的木盖板，四边包着铁皮，中间吊着一个铁环。\n是阁楼口。太高了，伸手够不着。');
        if (!S.f.stepsDone) S.goal('找根够得着天花板的东西（看看几间屋子）');
        return;
      }
      await S.narr('你举起钩杆，勾住盖板上的铁环，使劲往下一拽——');
      S.sfx('thud'); S.shake(400, 2); h.down = true;
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
    const r = await S.ask('她在问你。', ['「有。」（把信递给她）', '（说不出话，往后退）']);
    if (r === 1) { await S.narr('你往后退了一步。\n她没有追过来，只是又转回头，朝院门那边望着。'); return; }
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
    S.sfx('chime');
    S.dark(.55); S.ent('tree').s.bud = true;
    await S.narr('天边透出了一点灰白。\n槐树光秃秃的枝杈上，不知什么时候，冒出了几粒针尖大的绿芽。');
    await S.walk('wan_y', [14, 7], 1.4);
    await S.alpha('wan_y', 0, 1600);
    S.f.done = true;
    await S.fade(1, 1200);
    await S.card('天亮了', '', '你从豁口钻出来的时候，\n大刘靠在路灯杆底下，睡着了。');
    S.dark(.15, 'hutong');
    S.place('liu', 11, 3, 2); S.ent('liu').s.sleep = true; S.place('ye', 25, 3, 1);
    await S.go('hutong', 14, 3, 2, { fade: false });
    S.amb('wind');
    await S.fade(0, 1000);
    await dawnBus(S);
  }
  async function dawnBus(S) {
    S.focus(16, 4);
    await S.narr('朝内大街上，头班车开过来了。');
    const bus = S.ent('bus'); S.place('bus', -4, 5, 2); bus.open = false; bus.s.face = false;
    S.sfx('car');
    await S.walk('bus', 'r'.repeat(22), 7);
    S.sfx('brake');
    await S.wait(400);
    bus.open = true; S.sfx('open');
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
    S.hide('bus'); S.focus(null);
    await S.wait(600);
    S.ent('liu').s.sleep = false; S.face('liu', 'pl');
    await S.say('大刘', ['……嗯？天亮了？你出来啦？', '拍着啥了没？给我看看！']);
    await S.think('你看了一眼相机。里面一张照片也没有。\n……也好。');
    await S.fade(1, 1400);
    await S.end({ title: '第五夜　完', text: '几年以后，那两栋楼修好了，刷了新漆，挂上了新门牌。\n论坛上的帖子沉了下去，再也没有人顶。\n\n只有看车的大爷，每天早上头班车进站的时候，\n会抬起头，朝车窗里看一眼。' });
  }

  defChapter({
    id: 'chaonei81', n: 5, title: '朝内81号', sub: '北京朝阳门内，两栋没人住的洋楼。夜班车每晚都在门口停一下，没有人下车。', origin: '北京网络都市传说', color: '#5a2a26',
    icon: '@wan', amb: 'wind', floor: 'wood', wall: 'paper', dark: .86, plr: 3.1,
    tileOpts: { woodC: '#5e2e24' },
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
      post: { title: '大刘打印的帖子', text: '（论坛上的转帖，大刘用单位的打印机打出来的，折了两折）\n\n【转】北京四大鬼宅之首——朝内81号\n\n1949年，解放军进城前夕，住在朝内81号的一位国民党高级军官，丢下太太，一个人仓皇逃去了台湾。\n太太在楼里苦等丈夫回来接她，终于绝望，在阁楼的房梁上吊死了。\n当年给她送信的老邮差还记得，信封上清清楚楚写着「朝内81号」。\n\n从此每到夜里，就有人看见一个穿旗袍的女人在楼里走来走去。\n前几年有施工队进去，一个工人进了地下室，再也没出来。\n还有人说，夜班车到这一站总要停一下，开门，却没有人下车……\n\n——回复：楼主胆儿真大\n——回复：我同学去过，回来发了一礼拜烧\n——回复：假的吧，我家就住边上，啥也没有\n——回复：别去！那是危房！！' },
      notice: { title: '围墙上的告示', text: '朝阳门内大街81号院　情况说明\n\n本院两栋楼房建于二十世纪初，原系宗教团体产业，现经鉴定为危险房屋，随时有坍塌可能。\n近来网上流传本院「闹鬼」等种种说法，均无事实根据，望广大市民不信谣、不传谣。\n严禁任何人翻越围墙进入院内，后果自负。\n\n（落款的公章被雨水泡得只剩一个红圈。\n告示底下，有人用圆珠笔歪歪扭扭地添了一行：「越辟谣越说明有事」。）' },
      clip: { title: '糊在墙上的旧报纸', text: '（大杂院的年代，有人拿旧报纸糊墙挡风。一层盖着一层，像树的年轮。）\n\n最底下一层，黄得像隔夜的茶：\n「……本诊所即日起于朝阳门内大街六十九号西楼开诊，由教会修女主持，内外各科，贫苦者酌减诊金……」\n\n中间一层是一张街道的油印通知，边角卷着：\n「……本年起全区门牌统一整顿编号。原朝阳门内大街六十九号，自即日起改编为八十一号。望各户互相转告，以免信件投递有误……　一九六五年」\n\n最上面一层，是一张印着样板戏剧照的挂历纸。' },
      photo: { title: '抽屉里的老照片', text: '一张巴掌大的黑白照片，四边切成了花边。\n\n照片上是个二十出头的姑娘，穿着护士的白褂子，站在一扇铁门跟前笑。门柱上钉着一块搪瓷门牌，看得清是「六十九」。\n她身边原本还站着一个人，被剪刀剪掉了，只剩一只搭在她肩膀上的手。\n\n背面用钢笔写着：\n「民国三十七年春，初来北平。摄于诊所门前。　阿婉」' },
      letters: { title: '一捆没寄出去的信', text: '（每一封的信封上都写着：「沈先生收」。没有地址，没有邮票。）\n\n一九四九年二月\n你走那天说，到了那边就来信。我天天去问送信的。\n\n一九五六年冬\n诊所关了，修女们都走了。我没走。我在这儿住着，你回来，才找得着我。\n\n一九六五年夏\n街道上来人，把门口的牌子换了，说如今这里叫八十一号。我跟他们说不行，换了，信就找不着了。他们笑我。\n\n一九七一年冬\n咳得厉害。今年的信，大概是最后一封。\n院子里那棵槐树，是你走那年春天咱俩种的，如今比房檐还高了。\n你若回来，信就寄老地方：朝阳门内大街六十九号。\n我在这儿。' },
      reply: { title: '从香港转来的信', text: '阿婉：\n\n这封信托香港的朋友转寄，不知道你还能不能收到。\n\n那年到了那边，信寄不出去，人也回不来。一晃四十年。\n我每年春天都想，院子里那棵槐树，该有房檐高了吧。\n\n后来我成了家，有两个孩子。对不住你。\n我只想知道你过得好不好。\n\n若你已经不在那里了，就请拆信的人，替我在那棵槐树底下站一会儿。\n\n一九八八年三月　沈' }
    },
    legend: '朝内81号是北京东城区朝阳门内大街上的一座院子，院里有两栋三层的灰砖洋楼，带地下室，样式混合了西洋和中式的做法。关于它建于哪一年、最初是谁的产业，公开报道说法不一：有的说建于1910年前后，和美国教会开办的语言学校有关；也有根据档案的报道说，是二十年代初由一位法国工程师设计建造的私人产业。比较一致的说法是：四十年代后期楼里开过一间由修女主持的小诊所，也设过天主教的教堂；1949年以后这里成了住着许多户人家的大杂院；1965年整顿门牌时，原来的「69号」改编成了「81号」；后来产权归北京的天主教团体所有，楼房被鉴定为危房，长期空置。\n\n大约从2000年代中期开始，有人翻墙进去探险拍照，「朝内81号」的鬼宅之名在网络论坛上越传越广，被列为「北京四大鬼宅」之首。流传最广的版本是：1949年前后，一位国民党军官逃往台湾，丢下的太太在楼里自缢身亡，此后夜里常有人看见穿旗袍的女人。另外还有「施工队工人在楼里失踪」「楼下有地道通往别处」「夜班车到站总要停一下，却没有人下车」等等说法，细节在一次次转帖中不断增减。2014年，以它为原型的恐怖电影上映，又让这个名字热闹了一阵。\n\n这些说法都没有任何证据。产权方和多家媒体都公开澄清过：院子里没有发生过命案，也没有闹鬼一说；人们看到的「荒凉阴森」，只是一座年久失修、长期无人居住的老楼。2016年前后，两栋楼经过整修，后来对外出租。所谓「鬼宅」，更像是人们把对老房子、对旧时代的想象，一层一层糊在了它的墙上。\n\n（本章中护士阿婉、沈先生、看车的大爷、他们的书信与那封迟到的回信，以及阁楼「待久了会魔怔」的规矩，全部是游戏虚构的情节，与这座建筑的真实住户无关；楼里「开过诊所」「门牌由69号改为81号」等背景取自公开报道。门口的公交站与「没人下车」的夜班车，是流传版本中的说法。）',
    start: { map: 'hutong', x: 8, y: 3, dir: 2 },
    resume: {
      steps: async S => { if (S.f.stepsDone) return; S.stop('wan_c'); S.hide('wan_c'); S.hidePlayer(false); S.dark(null); S.plr(null); S.focus(null); await stepsBegin(S); },
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
        if (e.fog) { R(4, 2, 3, 5, 'rgba(220,226,232,.55)'); R(9, 2, 3, 5, 'rgba(220,226,232,.55)'); R(5, 4, 2, 2, 'rgba(240,244,248,.7)'); R(10, 4, 2, 2, 'rgba(240,244,248,.7)'); }
      },
      nianhua(g, e, t, R) { R(3, 1, 10, 12, '#d8c8a0'); R(4, 2, 8, 6, '#c84a3a'); R(6, 3, 4, 4, '#e8c060'); R(5, 9, 6, 1, '#7a3a2a'); R(5, 11, 4, 1, '#7a3a2a'); },
      calendar(g, e, t, R) { R(4, 1, 8, 11, '#e8e2d0'); R(4, 1, 8, 4, '#b8302a'); digits(R, 5, 6, '80', '#3a3a3a'); R(7, 0, 2, 1, '#555'); },
      coalstove(g, e, t, R) { bx2(R, 3, 2, 10, 12, '#5a5650'); R(4, 3, 8, 2, '#3a3632'); R(6, 3, 4, 1, '#1a1814'); R(7, -10, 2, 12, '#4a4640'); R(7, -10, 5, 2, '#4a4640'); },
      coal(g, e, t, R) { for (let i = 0; i < 3; i++) for (let j = 0; j < 3 - (i > 1 ? 1 : 0); j++) { R(1 + j * 5, 10 - i * 4, 5, 4, '#2a2a2a'); R(2 + j * 5, 11 - i * 4, 1, 1, '#555'); R(4 + j * 5, 12 - i * 4, 1, 1, '#555'); } },
      sewing(g, e, t, R) { bx2(R, 0, 4, 16, 9, '#5a3a24'); R(2, 13, 1, 3, '#222'); R(13, 13, 1, 3, '#222'); R(3, -2, 9, 4, '#1a1a1a'); R(3, 0, 2, 5, '#1a1a1a'); R(10, -2, 2, 6, '#1a1a1a'); R(5, -1, 4, 1, '#c9a35a'); },
      hookpole(g, e, t, R) { R(10, -22, 2, 36, '#a8905a'); R(10, -22, 1, 36, '#c8b07a'); R(9, -26, 1, 5, '#555'); R(10, -27, 3, 1, '#555'); R(12, -26, 1, 2, '#555'); },
      hatch(g, e, t, R) {   // 天花板上的阁楼口（画成地上的一块影子 + 放下来的梯子）
        R(1, 1, 14, 14, 'rgba(0,0,0,.35)'); R(1, 1, 14, 1, '#2a1a10'); R(1, 14, 14, 1, '#2a1a10');
        if (e.down) { R(3, -18, 2, 32, '#7a6444'); R(11, -18, 2, 32, '#7a6444'); for (let y = -16; y < 14; y += 5) R(3, y, 10, 1, '#8a7454'); }
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
          { x: 24, y: 2, spr: 'bike', col: '#3a2a2a', on: S => S.narr('车把上挂着一个军绿色的帆布包，包上印着褪了色的四个字：「人民邮政」。') },
          { x: 26, y: 2, spr: 'sign', col: '#3a5a3a', on: S => S.narr('「存车处　一次两毛」。\n牌子底下，看车的大爷摆了个小马扎，一个铝饭盒，一台收音机。') },
          { x: 26, y: 3, spr: 'stool' },
          { x: 16, y: 7, spr: 'streetlamp', off: true, on: S => S.narr('这一盏早就不亮了。灯罩里积着厚厚一层死飞蛾。') },
          { x: 5, y: 7, spr: 'sign', col: '#6a3a2a', on: S => S.narr('街对面一家小饭馆，卷帘门拉得严严实实。\n门上的招牌写着：「卤煮　炒肝」。') },
          { id: 'liu', x: 11, y: 3, spr: '@liu', dir: 1, async on(S) {
            S.face('liu', 'pl');
            if (S.f.done) return;
            if (S.f.gotReply) return S.say('大刘', cycle(S, '_lr', ['大爷给你啥了？……一封信？给谁的？', '我不进去啊，说好了，我放风。', '你脸色怎么跟纸似的……']));
            if (S.f.solved) return S.say('大刘', '大爷在存车处那边等你呢，说有东西要给你！');
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
            await S.say('大刘', ['正门锁死了。西头围墙塌了个豁口，大伙儿都从那儿钻。', '那边存车处的大爷，在这条街上住了一辈子，你要害怕，可以先跟他打听打听。']);
            S.f.talked = true;
            S.goal('从西头围墙的豁口钻进院子');
            return;
          }
          if (S.f.solved && !S.f.gotReply && S.once('backOut')) {
            S.face('liu', 'pl'); S.bubble('liu', '!', 1000);
            await S.say('大刘', ['你可算出来了！里头那么大动静，我还以为你……', '看车的大爷找你半天了，就在存车处那边。']);
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
          { x: 9, y: 1, spr: 'mailboxes', on: S => S.narr('墙上钉着一排铁皮信报箱，户主的名字都锈没了。\n只有最边上那一个，用红漆写着一个字：「婉」。\n你掀开盖子——里面空空的，只有一层细细的灰。') },
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
          { x: 10, y: 10, spr: 'invisible', async touch(S) { await S.go('hutong', 3, 2, 0); } }
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
          /* 东屋：大杂院年代的一户人家 */
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
          /* 西屋：堆杂物的 */
          { x: 11, y: 2, spr: 'dustbox', on: S => S.narr('一摞落满灰的纸箱子。最上面那只写着：「劳保用品　手套」。') },
          { x: 12, y: 1, spr: 'win81', broken: true, on: S => S.narr('窗户上钉着几块木板，木板缝里塞着旧报纸。') },
          { x: 11, y: 4, spr: 'sewing', on: S => S.narr('一台蝴蝶牌缝纫机，踏板上的铁锈红得像血。') },
          { x: 14, y: 5, spr: 'coal', on: S => S.narr('一垛蜂窝煤，码得整整齐齐。总有人打算在这儿过冬的。') },
          { id: 'pole', x: 14, y: 2, spr: 'hookpole', on: takePole },
          /* 走廊 */
          { x: 6, y: 6, spr: 'poster', col: '#c8c0a0', on: S => S.narr('墙上贴着一张「防火公约」，落款是「六十九号院居民小组」。\n「六十九」三个字让人用钢笔描过好几遍。') },
          { x: 11, y: 6, spr: 'calendar', on: S => S.narr('一本1980年的挂历，停在了十一月。\n十一月的某一天，被人用红笔圈了一个圈，旁边写着两个字：「来信？」') },
          { x: 5, y: 8, spr: 'puddle', decal: true },
          { id: 'shoes', x: 10, y: 8, spr: 'shoes2', on: S => S.narr(S.f.stepsDone ? '那双黑布鞋还在原地。\n……鞋尖，现在冲着中间那间屋的窗户。' : '走廊正中间，并排摆着一双女式的黑布鞋，鞋口绣着小小的红花。\n鞋尖朝着楼梯口，像在等谁上楼。') },
          { id: 'hatch', x: 14, y: 7, spr: 'hatch', solid: false, on: hatchOn },
          { id: 'wan_c', x: 1, y: 8, spr: '@wan', solid: false, hidden: true, light: { r: 1.6, col: 'rgba(150,180,255,.14)' } }
        ],
        async enter(S, first) {
          if (!first) return;
          await S.narr('楼梯一踩一声「吱呀」，像是有人在你脚底下叹气。\n二楼的走廊又窄又长，三间屋子的门全敞着。');
          await sms(S, '到哪儿了？帖子说吊死的那个在阁楼，你找找阁楼在哪儿。\n还有，我刚才好像看见二楼有个窗户亮了一下，你开手电了？');
          await S.think('……我没开手电。');
          S.goal('在二楼找找看。帖子里说的阁楼，入口在哪儿？');
        }
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
          { id: 'rwin', x: 6, y: 1, spr: 'roundwin', light: { r: 3.4, dy: 26, col: 'rgba(150,175,230,.18)' }, on: S => S.narr('山墙上开着一扇小圆窗，玻璃裂成了好几瓣。\n从这儿正好能望见朝内大街，和81号门口那块站牌。\n窗台上有两道浅浅的凹痕，像是有人常年把胳膊肘撑在这里。') },
          { id: 'trunk', x: 2, y: 2, spr: 'trunk', on: trunkOn },
          { id: 'desk', x: 9, y: 2, spr: 'desk', col: '#4a3424', on: deskOn },
          { id: 'beam', x: 4, y: 4, spr: 'beamrope', solid: false, async on(S) {
            S.f.r_beam = true;
            await S.narr('一根粗房梁横在头顶上，垂下来半截发黑的麻绳。\n绳子勒过的地方，木头磨得发亮。');
            await S.think('帖子里说的……就是这根梁？');
            await S.narr('你举着手机往东照了照。\n第二根、第三根、第四根房梁上，都有一模一样发亮的印子，一根挨着一根。');
          } },
          { id: 'book', x: 11, y: 3, spr: 'book', col: '#3a4a3a', on: S => S.narr('一本受潮的硬皮登记簿，压在一摞旧报纸底下。\n「一九五三年　朝阳门内大街六十九号院　住户登记」\n「西楼二层中间：婉（护士），独居。」\n「阁楼：各户公用，晾晒衣物，不得堆放易燃杂物。」') },
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
          '#ddd"""dddddddd""#',
          '#dd""dddddddddddd#',
          '#ddddddddddddd""d#',
          '#d"ddddddddddd"""#',
          '#""ddddddddddddd"#',
          '#"""ddddddddddddB#',
          '#BB"dddddddddd"BB#',
          '##################'],
        ents: [
          { x: 3, y: 1, spr: 'door', col: '#3a2a1e', async on(S) { S.sfx('open'); await S.go('hall', 12, 2, 0); } },
          { x: 7, y: 1, spr: 'win81', on: S => S.narr('一楼的后窗。里面黑洞洞的。') },
          { x: 11, y: 1, spr: 'win81', on: S => S.narr('窗台上摆着一个空酒瓶，瓶口插着一朵塑料花，早褪成了白色。') },
          { x: 14, y: 1, spr: 'win81', broken: true, on: S => S.narr('东楼的窗户。窗框里探出来一根枯藤，在风里一点一点的。') },
          { id: 'tree', x: 9, y: 5, spr: 'huai', on: treeOn },
          { x: 12, y: 3, w: 3, spr: 'clothes', solid: false, on: S => S.narr('两根铁杆子之间拉着一根晾衣绳，上面挂着一件蓝布衫，风一吹，袖子一摆一摆的。\n……这院子里，谁还在晾衣服？') },
          { x: 2, y: 8, spr: 'bike', col: '#4a3a2a', on: S => S.narr('一辆只剩一个轱辘的自行车，链条锈成了一整根铁棍。') },
          { x: 6, y: 8, spr: 'bench2', on: S => S.narr('一块青石板搭的长凳，正对着槐树。\n石板上让人刻了一道一道的划痕。你数了数，没数完。') },
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
          if (first) await S.narr('后院比前院还荒。正中间一棵老槐树，枝杈光秃秃的，伸得比楼还高。\n风从树杈中间穿过去，像有人在很远的地方吹口哨。');
        }
      }
    }
  });
})();
