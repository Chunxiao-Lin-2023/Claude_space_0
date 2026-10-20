/* ================= 第五夜 · 朝内81号 ================= */
(() => {
  /* ---------- 小工具 ---------- */
  const FONT = { '0': '111101101101111', '1': '010110010010111', '2': '111001111100111', '3': '111001111001111', '4': '101101111001001', '5': '111100111001111', '6': '111100111101111', '7': '111001001001001', '8': '111101111101111', '9': '111101111001111' };
  function digits(R, x, y, s, col) { [...s].forEach((ch, i) => { const b = FONT[ch]; if (!b) return; for (let k = 0; k < 15; k++) if (b[k] === '1') R(x + i * 4 + (k % 3), y + ((k / 3) | 0), 1, 1, col); }); }
  const cycle = (S, key, lines) => lines[(S.f[key] = ((S.f[key] ?? -1) + 1) % lines.length)];
  const sms = (S, text) => { S.sfx('phone'); return S.say('短信 · 大刘', text); };
  const GREEN = { face: '#3e5646', trim: '#22332a', top: '#111814', pat: 'paper' };
  const ATTIC_T = 150;
  const KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'];

  /* ================= 胡同：夜班车 ================= */
  async function busEvent(S) {
    S.f.busSeen = true;
    await S.narr('你正要往豁口里钻，身后的大街上，传来一阵发动机的声音。');
    S.focus(19, 3);
    const bus = S.ent('bus'); S.place('bus', -4, 4, 2); bus.open = false; bus.s.face = false;
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
    S.goal('从西边围墙的豁口钻进院子');
  }
  async function gapOn(S) {
    if (!S.f.talked) return S.narr('围墙塌了一个豁口，黑洞洞的。');
    if (!S.f.busSeen) return busEvent(S);
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
    S.dark(.93); S.plr(.6);
    await S.narr('你钻进衣柜，轻轻把柜门带上。\n樟脑味呛得眼睛发酸。你屏住气，从门缝里往外看——');
    S.sfx('step');
    if (id === 'wardB') {
      S.focus(9, 7);
      await S.walk('wan_c', [11, 8], 1.6);
      S.face('wan_c', 3); S.sfx('heart');
      await S.narr('她在这间屋的门口停住了。\n门缝太窄，你只看得见一角蓝布衣襟，和一只黑色的鞋尖。');
      await S.wait(1200); S.sfx('heart');
      await S.say('？？？', '……有我的信吗？', { style: 'whisper' });
      await S.wait(800);
      await S.walk('wan_c', [3, 8], 1.6);
      S.focus(4, 4);
      await S.walk('wan_c', [4, 2], 1.6);
    } else {
      S.focus(3, 5);
      await S.walk('wan_c', [3, 7], 1.6);
      await S.walk('wan_c', [2, 3], 1.6);
      S.face('wan_c', 1); S.sfx('heart');
      await S.narr('她走进屋来，在衣柜跟前站住了。\n隔着一层木板，你听见她的呼吸——不，你什么也没听见。她不呼吸。');
      await S.wait(1300); S.sfx('heart');
      await S.say('？？？', '……有我的信吗？', { style: 'whisper' });
      await S.wait(900);
      await S.walk('wan_c', [4, 2], 1.6);
    }
    S.face('wan_c', 3);
    await S.narr('她走到窗户跟前，站住了。\n脸贴着玻璃，一动也不动，朝着院门的方向望。');
    await S.wait(1500);
    await S.narr('望了很久，很久。');
    S.sfx('whisper');
    await S.alpha('wan_c', 0, 1400);
    S.ent('winA').s.fog = true;
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
    if (id === 'wardA') return S.narr('一只老式的大衣柜，柜门上镶的镜子早就没了。\n里面挂着一件阴丹士林蓝的旗袍。料子洗得发白，领口的盘扣一颗不少。');
    return S.narr('一只掉了漆的大衣柜，柜门关不严。\n里面塞着几件旧棉袄，一股樟脑丸的味儿。');
  };

  /* ================= 阁楼：拼起来的故事 ================= */
  function startAttic(S) { S.timer(S.f.atticLeft || ATTIC_T, '阁楼', atticBad); }
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
    await S.walk('wan_y', [8, 8], 1.4);
    await S.alpha('wan_y', 0, 1600);
    S.f.done = true;
    await S.fade(1, 1200);
    await S.card('天亮了', '', '你从豁口钻出来的时候，\n大刘靠在路灯杆底下，睡着了。');
    S.dark(.15, 'hutong');
    S.hide('ye'); S.place('liu', 7, 3, 0);
    await S.go('hutong', 20, 2, 0, { fade: false });
    S.amb('wind');
    await S.fade(0, 1000);
    await dawnBus(S);
  }
  async function dawnBus(S) {
    S.focus(19, 3);
    await S.narr('朝内大街上，头班车开过来了。');
    const bus = S.ent('bus'); S.place('bus', -4, 4, 2); bus.open = false; bus.s.face = false;
    S.sfx('car');
    await S.walk('bus', 'r'.repeat(22), 7);
    S.sfx('brake');
    await S.wait(400);
    bus.open = true; S.sfx('open');
    await S.narr('它在81号门口停下，开了门。\n还是没有人下车。');
    const w = S.ent('wan_h'); S.place('wan_h', 13, 2, 0); w.alpha = 0;
    await S.alpha('wan_h', .55, 900);
    await S.walk('wan_h', [[13, 3], [20, 3]], 2.2);
    S.face('wan_h', 0);
    await S.alpha('wan_h', 0, 700);
    await S.wait(500);
    bus.open = false; S.sfx('close');
    await S.narr('车门关上之前，你好像看见一角蓝布衣襟，轻轻一闪，进了车门。');
    S.sfx('car');
    await S.walk('bus', 'r'.repeat(14), 7);
    S.hide('bus'); S.focus(null);
    await S.wait(600);
    await S.say('大刘', ['……嗯？天亮了？你出来啦？', '拍着啥了没？给我看看！']);
    await S.think('你看了一眼相机。里面一张照片也没有。\n……也好。');
    await S.fade(1, 1400);
    await S.end({ title: '第五夜　完', text: '几年以后，那两栋楼修好了，刷了新漆，挂上了新门牌。\n论坛上的帖子沉了下去，再也没有人顶。\n\n只有看车的大爷，每天早上头班车进站的时候，\n会抬起头，朝车窗里看一眼。' });
  }

  /*@@CHAPTER@@*/
})();
