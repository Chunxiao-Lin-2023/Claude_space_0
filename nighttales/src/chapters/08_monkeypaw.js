/* ================= 第八夜 · 猴爪 ================= */
(() => {
  /* 第四幕以后的深夜阶段 */
  const ACT4 = ['night', 'fetch', 'wait', 'matches', 'candle', 'flee', 'door', 'wish3', 'after', 'lost'];
  const DOORT = 50;                                   // 摸黑找猴爪的秒数
  const PAWS = [[2, 4], [6, 5], [8, 5], [8, 3]];      // 猴爪被踢到的位置
  const GROPE = [
    [2, 5, '你摸到一只拖鞋。是她的，里面还留着一点体温。'],
    [5, 5, '冰凉的瓷烛台。蜡油已经凝住了。'],
    [6, 3, '一团软软的东西——是她的披肩。'],
    [1, 4, '床底下……只有灰。']
  ];
  const FIRE = { r: 5, col: 'rgba(255,140,60,.26)', flick: true };
  const is4 = S => ACT4.includes(S.f.act);

  /* 每次进图：按剧情阶段设定光照与环境声 */
  function mood(S) {
    const a = S.f.act, m = S.map, n4 = is4(S);
    let dark = null, plr = null;
    if (m === 'parlor') { if (n4) { dark = .95; plr = 1.5; } else if (S.f.day) dark = .32; }
    if (m === 'hall') { if (S.f.day) S.ent('hcandle').off = true; if (n4) { dark = a === 'after' ? .88 : .95; plr = a === 'flee' ? 1.1 : 1.5; } else if (S.f.day) dark = .28; S.ent('kwin').lit = !!S.f.day; }
    if (m === 'bedroom') { if (a === 'door' || a === 'wish3') { dark = .97; plr = 1.25; } else if (n4) { dark = .9; plr = 1.6; } }
    if (m === 'garden') { if (S.f.day) dark = .42; }
    S.dark(dark); S.plr(plr);
    if (n4 && m !== 'garden') S.amb(a === 'after' ? 'wind' : 'drone');
  }

  /* ---------------- 第一幕：猴爪从火里抢出来 ---------------- */
  async function pawRescued(S, how) {
    S.clearTimer(); S.hide('fpaw'); S.give('paw', true); S.sfx('item');
    if (how === 'tongs') await S.narr('你低呼一声，抄起火钳扑过去，把它从炭火里夹了出来。\n爪尖的毛焦了一撮，冒出一股难闻的气味。');
    else await S.narr('你来不及多想，直接把手伸进了炉膛——\n猴爪被你抓了出来。手背上烫起了一个亮晶晶的水泡。');
    S.toast('获得：猴爪');
    await S.say('莫里斯', '让它烧了才好。');
    await S.say('你', '你要是不要了，莫里斯，就给我吧。');
    await S.say('莫里斯', ['我不给。我已经把它扔进火里了。', '你要是非留着不可，往后出了什么事，别怪到我头上。', '听我的——像个明白人那样，把它扔回火里去。']);
    const r = await S.ask('炉火噼啪作响。', ['（摇摇头，把猴爪攥得更紧）', '（犹豫着，看了看炉火）']);
    if (r === 1) { await S.say('赫伯特', '别呀，爸爸！好不容易才救出来的。'); await S.narr('你的手在炉口停了一停，又缩了回来。'); }
    await S.say('你', '……那，怎么许愿？');
    await S.say('莫里斯', ['用右手把它举起来，大声说出你的愿望。', '……不过我警告过你了。后果自负。']);
    await S.say('怀特太太', '听着跟《一千零一夜》似的。（她起身去摆晚饭的刀叉）你干脆替我许四双手得了。');
    await S.narr('你笑着从口袋里掏出猴爪，作势要往上举。三个人都笑了起来——');
    S.face('morris', 'pl');
    await S.narr('军士长却一把抓住了你的胳膊。他脸上一点笑意也没有。');
    await S.say('莫里斯', '要许，就许点明智的。');
    await S.fade(1, 700);
    await S.narr('晚饭桌上，猴爪被忘在了一边。\n饭后，三个人又听他讲了第二段、第三段印度奇遇，一直讲到他快赶不上末班火车。');
    S.hide('morris'); S.f.act = 'farewell';
    S.place('morris_h', 6, 2, 0);
    await S.go('hall', 6, 3, 3, { ms: 500 });
    await S.say('莫里斯', '好了，我得走了。谢谢你们的晚饭，太太。');
    S.ent('fdoor').open = true; S.sfx('open'); S.amb('wind');
    S.face('morris_h', 3);
    await S.narr('他在门口站住了，回头看了你一眼，像是还有什么话要说。');
    S.face('morris_h', 0);
    await S.say('莫里斯', '怀特……');
    await S.say('莫里斯', '……没什么。晚安。');
    await S.alpha('morris_h', 0, 700);
    S.ent('fdoor').open = false; S.sfx('close'); S.amb('room');
    await S.narr('门关上了。风声里，他的脚步沿着泥泞的小路，渐渐听不见了。');
    S.f.act = 'wish1';
    S.goal('回客厅');
    S.cp();
  }

  /* ---------------- 第二幕：第一个愿望 ---------------- */
  async function firstWish(S) {
    S.face('herb', 'pl');
    let opts = ['「当皇帝？」', '「说真的……我想要的好像都有了。」', '「还是算了。」（把猴爪收起来）'];
    for (;;) {
      const pick = opts[await S.ask('你把猴爪拿在手里翻来覆去地看。许点什么呢？', opts)];
      if (pick.startsWith('「当')) {
        await S.say('赫伯特', '好啊！到时候妈妈见了你也得行屈膝礼。');
        await S.say('怀特太太', '我？做梦去吧。');
        opts = opts.filter(o => o !== pick); continue;
      }
      if (pick.includes('都有了')) {
        await S.say('赫伯特', ['要是能把房子的钱还清，你就心满意足了，对吧？', '那就许两百英镑吧——刚好够。']);
      } else {
        await S.narr('你刚要把它揣回兜里，赫伯特一把抓住了你的手腕。');
        await S.say('赫伯特', ['别扫兴嘛，爸爸！', '就许两百英镑——刚好够把房子的钱还清。（他笑着把你的右手举了起来）']);
      }
      break;
    }
    await S.narr('你为自己居然有点当真而难为情，讪讪地把猴爪举了起来。');
    await S.walk('herb', [10, 3], 4); S.face('herb', 3);
    await S.narr('赫伯特板起一张庄严的脸，在钢琴前坐下，还偷偷冲母亲眨了眨眼——');
    S.sfx('chime'); await S.wait(500); S.sfx('chime'); await S.wait(500); S.sfx('bell');
    await S.narr('他重重地按下几个和弦。');
    await S.ask('右手举起猴爪，大声说出来。', ['「我希望得到两百英镑。」']);
    await S.say('你', '我希望得到两百英镑。', { style: 'big' });
    S.sfx('thud'); S.sfx('sting'); S.shake(600, 3); S.fx('glitch');
    await S.narr('钢琴「轰」地砸出一声巨响，把你的话吞了下去。\n你自己也打了个哆嗦，失声叫了出来。');
    S.take('paw');
    S.face('herb', 'pl'); S.bubble('herb', '!', 1200); S.bubble('wife', '!', 1200);
    await S.say('你', ['它动了！', '我许愿的时候，它在我手里扭了一下——像条蛇一样。']);
    await S.walk('herb', [6, 6], 4); S.show('tpaw');
    await S.narr('赫伯特把掉在地毯上的猴爪捡起来，搁在了棋桌上。');
    await S.say('赫伯特', '……可钱在哪儿呢？我是没看见。我打赌，这辈子也看不见。');
    await S.say('怀特太太', '准是你看花眼了，老头子。');
    await S.say('你', '没事，没伤着谁。可还是……吓了我一跳。');
    await S.narr('三个人又在炉火边坐下。你把烟斗抽完了。\n外面的风比任何时候都大。楼上有扇门「砰」地撞了一下，你吓得一哆嗦。');
    await S.narr('一种说不出的、沉甸甸的安静罩住了这间屋子，一直到老两口起身去睡觉。');
    await S.say('赫伯特', ['我敢说，那笔钱会装在一个大口袋里，就放在你们床正中间。', '衣柜顶上还会蹲着个什么吓人的东西，盯着你把这笔不义之财揣进兜里。']);
    await S.say('赫伯特', '晚安，爸爸。我再坐一会儿。');
    await S.walk('herb', [5, 3], 4); S.face('herb', 3);
    S.f.act = 'bed1';
    S.goal('上楼睡觉');
    S.cp();
  }

  /* 赫伯特独自坐在炉火前（玩家不在场的一幕） */
  async function herbertFire(S) {
    S.f.act = 'herbfire';
    await S.fade(1, 700);
    S.ent('plamp').off = true;
    S.hidePlayer(true);
    const fire = S.ent('fire'); fire.s.low = true; fire.light = { r: 2.4, col: 'rgba(255,100,40,.3)', flick: true };
    S.hide('wife'); S.place('herb', 5, 3, 3);
    await S.go('parlor', 4, 6, 3, { fade: false });
    S.dark(.9); S.plr(0); S.focus(5, 3); S.amb('fire');
    await S.fade(0, 900);
    await S.narr('（楼下，客厅里。）\n赫伯特一个人坐在快要熄灭的炉火前。');
    await S.narr('他盯着炭火出神。暗红的余烬里，浮出一张又一张脸。');
    await S.narr('最后浮出来的那一张，丑恶得叫人心惊——活脱脱是一只猴子的脸。\n他愣愣地看着它。');
    await S.scare('face', { spr: '@monkey', dur: 1.1, sfx: 'sting' });
    await S.narr('那张脸越来越清楚。\n他不自在地笑了一声，伸手去摸桌上的水杯，想把水泼过去——');
    S.sfx('heart');
    await S.narr('手指碰到的，却是那只猴爪。');
    await S.narr('他打了个寒颤，在外套上使劲擦了擦手，起身上楼睡觉去了。');
    await S.fade(1, 900);
    fire.s.low = false; fire.light = Object.assign({}, FIRE);
    S.hide('herb'); S.hide('tpaw'); S.ent('plamp').off = true;
    S.hidePlayer(false); S.focus(null); S.dark(null); S.plr(null);
    await S.card('第二天早上', '', '冬日的阳光斜斜地照在早餐桌上。\n昨夜的那点害怕，在白天看来，简直有点可笑。');
    S.f.day = true; S.f.act = 'morning';
    await S.go('hall', 10, 5, 3, { ms: 700 });
  }

  /* ---------------- 第三幕：送别 / 来客 ---------------- */
  async function seeOff(S) {
    S.face('herb_h', 'pl');
    const r = await S.ask('赫伯特戴上帽子，回头冲你咧嘴一笑。', ['「路上小心。」', '「……今天早点回来。」', '（冲他挥挥手）']);
    if (r === 0) await S.say('赫伯特', '小心什么？小心天上掉钱砸着我？');
    else if (r === 1) await S.say('赫伯特', '放心吧，我还得回来分钱呢！');
    else await S.narr('他也冲你挥了挥手。');
    S.ent('fdoor').open = true; S.sfx('open'); S.amb('wind');
    S.face('herb_h', 3);
    await S.narr('门外是清冷的冬日早晨。\n他沿着那条泥泞的小路走了，一路吹着口哨。');
    await S.alpha('herb_h', 0, 800);
    await S.wait(600);
    await S.narr('你在门口站了好一会儿，才发觉自己连外套都没穿。');
    S.ent('fdoor').open = false; S.sfx('close');
    await S.fade(1, 800);
    S.hide('wife_h'); S.hide('kpaw'); S.hide('wife');
    await S.card('下午', '', '晚饭时，怀特太太还在念叨赫伯特早上那些玩笑话。\n邮差送来了一张裁缝的账单。\n她顺口说起，有些退伍的军人呢，就是爱喝两杯。');
    S.f.act = 'stranger';
    S.show('wife_w'); S.ent('wife_w').spr = '@wifeA';
    await S.go('parlor', 6, 4, 3);
  }

  async function news(S) {
    await S.narr('来客在扶手椅上坐下了。他盯着地毯，局促不安，迟迟不开口。');
    await S.narr('怀特太太为屋里的凌乱、为你身上那件沾着泥点的园艺外套道了歉。他心不在焉地听着。');
    await S.say('来客', '我……我是受人之托来的。（他弯下腰，从裤腿上捻掉一根线头）我是从「毛与梅金斯」公司来的。');
    S.face('wife', 'stranger'); S.bubble('wife', '!', 1200);
    await S.say('怀特太太', '出什么事了？是不是赫伯特出事了？出什么事了？你说呀！');
    await S.ask('你按住她的手。', ['「好了，好了，孩子他妈。」']);
    await S.say('你', ['坐下，别乱猜。', '……先生，您带来的，不是坏消息吧？']);
    await S.say('来客', '我很抱歉——');
    await S.say('怀特太太', '他受伤了？');
    await S.narr('来客低下头，算是默认了。');
    await S.say('来客', '伤得很重。不过……他已经不疼了。');
    await S.say('怀特太太', '噢，感谢上帝！感谢——');
    await S.narr('她的话戛然而止。\n那句「安慰」背后的意思，一点一点渗进了她的脑子。');
    await S.narr('她在客人躲闪的脸上，看见了自己最怕的那件事。\n她屏住呼吸，转过脸来看你，把一只发抖的手放在了你的手上。');
    await S.wait(800);
    await S.narr('屋里静了很久。');
    await S.say('来客', '他被……卷进了机器里。', { style: 'whisper' });
    await S.say('你', '卷进了机器里……是。');
    await S.narr('你呆呆地望着窗外，把妻子的手握在自己手里，攥得紧紧的——\n就像四十年前，你们刚恋爱的时候那样。');
    await S.say('你', '他是我们剩下的唯一一个孩子了。这……太难了。');
    S.face('stranger', 3);
    await S.narr('来客咳嗽了一声，站起身来，慢慢走到窗前。');
    await S.say('来客', ['公司让我向二位转达最深切的同情。', '请您理解，我只是个雇员，只是奉命行事。']);
    await S.narr('没有人回答。老太太脸色煞白，眼睛直勾勾的，连呼吸声都听不见了。');
    S.face('stranger', 0);
    await S.say('来客', ['我还要说明一点：毛与梅金斯公司对此不承担任何责任。他们不承认负有任何义务。', '不过，考虑到令郎生前的工作表现，公司愿意送上一笔款项，作为补偿。']);
    await S.narr('你松开了妻子的手，站了起来，惊恐地瞪着来客。');
    await S.ask('你干裂的嘴唇动了动。', ['「……多少？」']);
    await S.wait(500);
    await S.say('来客', '两百英镑。');
    S.sfx('scream'); S.shake(500, 2);
    await S.narr('你听不见妻子的尖叫。\n你只是淡淡地笑了一下，像个瞎子那样，朝前伸出了双手——');
    await S.fade(1, 600); S.sfx('thud');
    await S.narr('然后，一头栽倒在地板上，不省人事。');
    S.f.dead = true;
    S.hide('stranger'); S.hide('wife');
    await S.card('葬礼', '两英里外，新修的大墓地', '一切都发生得太快了，快得叫人回不过神来。\n下葬那天，下着冷雨。');
    S.f.act = 'funeral'; S.f.day = true;
    await S.go('cem', 5, 6, 3, { ms: 800 });
  }

  /* 第四幕之前的布景 */
  function setNight(S) {
    for (const id of ['wife', 'herb', 'morris', 'stranger', 'tpaw', 'wife_w', 'wife_h', 'herb_h', 'kpaw', 'morris_h']) S.hide(id);
    S.ent('fire').off = true; S.ent('plamp').off = true; S.ent('hcandle').off = true;
    S.show('mpaw');
    S.place('wife_b', 6, 2, 3); S.ent('wife_b').spr = '@wifeB';
    S.ent('bcandle').off = true; S.ent('bwin').open = false;
  }

  /* ---------------- 第四幕：第二个愿望 ---------------- */
  async function nightWake(S) {
    await S.narr('你被一阵压低的哭声弄醒了。\n床的另一边是空的。');
    S.focus(6, 2);
    await S.narr('黑暗里，妻子站在窗前，哭得浑身发抖。');
    await S.say('你', '回床上来吧。你会着凉的。');
    await S.say('怀特太太', '我的儿子比我更冷。', { style: 'whisper' });
    S.focus(null);
    await S.narr('哭声渐渐低了下去。床是暖的，你的眼皮沉得睁不开。\n你迷迷糊糊地，又睡了过去——');
    await S.fade(1, 700); await S.wait(900);
    await S.fade(0, 150); S.shake(500, 3); S.sfx('sting');
    await S.say('怀特太太', '猴爪！', { style: 'big' });
    await S.walk('wife_b', [3, 3], 4); S.face('wife_b', 'pl');
    await S.say('你', '在哪儿？怎么了？出什么事了？');
    await S.say('怀特太太', '我要它。你没把它扔掉吧？');
    await S.say('你', '在客厅里，壁炉上头的架子上。你要它干什么？');
    await S.narr('她又哭又笑，弯下腰，在你脸上亲了一下。');
    await S.say('怀特太太', ['我刚刚才想起来……我怎么早没想到？你怎么也没想到？', '还有两个愿望！我们才许了一个。']);
    await S.say('你', '那一个还不够吗？');
    await S.say('怀特太太', ['不够！我们再许一个。', '快下楼去把它拿来，许愿让我们的孩子活过来！']);
    await S.ask('你的四肢直打颤。', ['「老天爷，你疯了！」']);
    await S.say('怀特太太', '去拿来！快去拿来许愿——噢，我的孩子，我的孩子！');
    await S.say('你', '回床上去吧。你根本不知道自己在说什么。');
    await S.say('怀特太太', '第一个愿望实现了。为什么第二个就不行？');
    const r = await S.ask('……', ['「那只是个巧合。」', '（说不出话来）']);
    if (r === 0) await S.say('你', '那只是个巧合……');
    else await S.narr('你张了张嘴，什么也没说出来。');
    await S.say('怀特太太', '去拿来许愿！');
    await S.narr('你转过身看着她。你的声音在发抖。');
    await S.say('你', ['他已经死了十天了。而且他——我本来不想告诉你的——', '我只能靠他身上的衣服，才认出那是他。', '那时候你都不敢去看他。现在呢？']);
    await S.think('你记得那件外套。\n外套最上面那颗纽扣，是她去年冬天一针一线缝上去的。');
    await S.say('怀特太太', ['把他带回来！', '你以为我会怕我自己一手带大的孩子吗？']);
    S.ent('bcandle').off = false; S.sfx('match');
    await S.narr('她划了一根火柴，点亮了五斗柜上的蜡烛头。\n烛火只有指甲盖那么大。');
    await S.narr('你在黑暗里，走下楼去。');
    S.f.act = 'fetch';
    S.goal('摸黑下楼，去客厅的壁炉架上拿猴爪');
    S.cp();
  }

  async function secondWish(S) {
    S.place('wife_b', 4, 3, 0);
    await S.narr('连妻子的脸，在烛光里也好像变了样。\n白得发青，带着一种迫不及待的神情，透着说不出的古怪。你忽然有点怕她。');
    await S.say('怀特太太', '许愿！', { style: 'big' });
    let r = await S.ask('猴爪在你手里冰凉冰凉的。', ['「这太傻了，这是作孽……」', '（举起右手）']);
    if (r === 0) { await S.say('怀特太太', '许！', { style: 'big' }); await S.ask('……', ['（举起右手）']); }
    await S.say('你', '我希望我的儿子活过来。', { style: 'big' });
    S.take('paw'); S.sfx('thud'); S.place('paw2', 3, 5);
    await S.narr('猴爪掉在了地上。\n你惊恐地盯着它，浑身发抖，跌坐进椅子里。');
    await S.walk('wife_b', [6, 2], 3); S.face('wife_b', 3);
    S.ent('bwin').open = true; S.ent('bwin').light = { r: 1.8, col: 'rgba(120,140,200,.10)' };
    await S.narr('妻子的眼睛烧得发亮。她走到窗前，拉起了百叶窗。');
    await S.narr('你一直坐着，直到寒气透进了骨头。\n偶尔，你抬头看一眼窗前她那个一动不动的背影。');
    await S.narr('蜡烛头已经烧到了瓷烛台的边沿以下，在天花板和墙上投下一跳一跳的影子。');
    await S.wait(900);
    S.ent('bcandle').off = true; S.sfx('whisper'); mood(S); S.dark(.93);
    await S.narr('最后，它猛地跳了一下——灭了。');
    await S.narr('什么也没有发生。\n你心里涌起一阵说不出的轻松：那东西不灵了。');
    S.f.act = 'wait';
    S.goal('回床上躺下');
    S.cp();
  }

  async function lieDown(S) {
    S.hide('wife_b');
    await S.narr('你摸回床上。过了一两分钟，妻子也一声不响、木然地躺到了你身边。');
    await S.narr('你们谁也不说话，只是静静地躺着，听着楼下座钟的滴答声。');
    S.sfx('tick'); await S.wait(700); S.sfx('tick'); await S.wait(700); S.sfx('tick');
    await S.narr('楼梯「嘎吱」响了一下。\n一只耗子吱吱叫着，从墙里窜了过去。');
    await S.narr('黑暗压得人透不过气。\n你躺了好一阵，终于鼓足了勇气——');
    S.f.act = 'matches';
    S.goal('拿上火柴，下楼去厨房拿根蜡烛');
  }

  async function knockAtFoot(S) {
    S.plr(1.7); S.sfx('match');
    await S.narr('你划着一根火柴，摸下楼梯。\n刚走到楼梯脚下，火柴灭了。你停下来，想再划一根——');
    S.plr(.9); S.amb('none');
    await S.wait(700);
    S.sfx('knock');
    await S.narr('就在这时，前门上响起了一下敲门声。\n那么轻，那么鬼祟，几乎听不见。');
    S.take('matches'); S.show('spill'); S.sfx('drip');
    await S.narr('火柴从你手里掉了下去，撒了一地。');
    await S.wait(1100);
    S.sfx('knock'); S.focus(6, 2);
    await S.narr('你一动不动，连气都不敢喘——\n直到敲门声又响了一下。');
    S.focus(null);
    S.f.act = 'flee'; S.f._fk = 2;
    S.goal('逃回卧室！');
    S.amb('drone');
  }

  async function wifeRuns(S) {
    S.sfx('close');
    await S.walk('pl', [5, 3], 5);
    S.sfx('knock'); S.sfx('knock'); S.shake(300, 2);
    await S.narr('你逃回房间，关上了门。\n第三下敲门声，响彻了整座房子。');
    S.place('wife_b', 2, 4, 2);
    await S.say('怀特太太', '那是什么？');
    await S.say('你', '耗子。是只耗子。刚才在楼梯上，从我脚边跑过去了。');
    await S.narr('她在黑暗里坐直了身子，竖起耳朵听着。');
    S.sfx('knock'); await S.wait(250); S.sfx('knock'); await S.wait(250); S.sfx('knock'); S.shake(500, 3);
    await S.narr('一阵响亮的敲门声，在整座房子里回荡。');
    await S.say('怀特太太', '是赫伯特！是赫伯特！', { style: 'big' });
    await S.walk('wife_b', [4, 4], 5);
    await S.ask('她朝门口跑去。', ['（一把抓住她的胳膊）']);
    S.face('wife_b', 'pl');
    await S.say('你', '你要干什么？', { style: 'whisper' });
    await S.say('怀特太太', ['是我的孩子！是赫伯特！', '我都忘了，墓地有两英里远……你抓着我干什么？放开我！我得去开门！']);
    await S.say('你', '看在上帝的份上，别让它进来！');
    await S.say('怀特太太', ['你怕你自己的儿子！', '放开我！——我来了，赫伯特，我来了！']);
    S.sfx('knock'); S.sfx('knock');
    await S.narr('她猛地一挣，挣脱了你的手，冲出了房间。');
    S.f.pawSpot = Math.floor(Math.random() * PAWS.length);
    const [px, py] = PAWS[S.f.pawSpot];
    await S.walk('wife_b', [4, 5], 6); S.hide('wife_b');
    S.place('paw2', px, py); S.sfx('drip');
    await S.narr('黑暗里，她的脚踢到了什么东西——\n它在地板上「嗒」地一声滑了出去，不知滑到了哪儿。');
    for (let i = 0; i < GROPE.length; i++) S.show('g' + i);
    S.f.act = 'door'; mood(S);
    await S.narr('楼下传来门链被拉开的哗啦声。\n然后是底下那道门闩，被一点一点、生硬地，从插槽里拔出来——');
    await S.think('猴爪。猴爪掉在地上了。');
    S.goal('在黑暗里摸到猴爪——赶在她打开门之前！');
    S.cp('door');
    startDoor(S);
  }
  function startDoor(S) { S.f._st = 0; S.f._kn = 0; S.timer(DOORT, '门闩', lostEnd); }

  /* ---------------- 第五幕：第三个愿望 ---------------- */
  async function foundPaw(S) {
    S.clearTimer(); S.f.act = 'wish3'; S.hide('paw2');
    await S.narr('你的手指碰到了一样东西：干瘪，粗糙，长着稀稀拉拉的毛。');
    S.sfx('knock'); S.shake(300, 2);
    await S.narr('楼下，椅子在地板上「吱——」地拖了过去。\n她踩上椅子，够着了最上面那道门闩。');
    const r = await S.ask('你把它举了起来。', ['「我希望他回去——回到他该待的地方，安息吧。」', '「我希望他……像从前那样，完完整整地回来！」']);
    if (r === 1) return badWish(S);
    await S.narr('你用尽最后一口气，疯了似的，低声说出了第三个，也是最后一个愿望。');
    S.amb('none'); await S.wait(900);
    await S.narr('敲门声戛然而止。\n可它的回声还在房子里荡着，就好像从来没有停过。');
    S.sfx('open'); await S.wait(500);
    await S.narr('你听见椅子被拖开，门被拉开了。');
    S.amb('wind');
    await S.narr('一股冷风，顺着楼梯灌了上来。');
    S.sfx('cry');
    await S.narr('然后是妻子的哭声——\n长长的、响亮的、绝望透顶的哭声。');
    S.f.act = 'after'; mood(S);
    for (let i = 0; i < GROPE.length; i++) S.hide('g' + i);
    S.ent('fdoor').open = true; S.ent('fdoor').light = { r: 2.2, col: 'rgba(120,140,190,.10)' };
    S.place('wife_h', 5, 2, 2); S.ent('wife_h').spr = '@wifeB';
    S.ent('gate').open = true;
    S.goal('下楼，到她身边去');
    S.cp();
  }

  async function badWish(S) {
    await S.say('你', '我希望他……像从前那样，完完整整地回来！', { style: 'whisper' });
    S.sfx('sting');
    await S.narr('猴爪在你掌心里扭了一下。\n像一条蛇。');
    S.amb('none'); await S.wait(900);
    await S.narr('敲门声停了。');
    await S.wait(1200);
    S.sfx('open');
    await S.narr('楼下，最后一道门闩被拔开了。门开了。');
    await S.say('怀特太太（楼下）', '赫伯特！噢，赫伯特——', { style: 'whisper' });
    await S.narr('她的声音里，是一种你从来没有听过的狂喜。\n然后，那声音一点一点地——变了。');
    S.sfx('whisper'); S.fx('red');
    await S.end({ bad: true, title: '完完整整', text: '苦行僧说过：谁要是插手命运，谁就会后悔。\n\n你许下的每一个愿望，都实现了。\n一字不差。' });
  }

  async function lostEnd(S) {
    S.f.act = 'lost';
    S.amb('none'); S.sfx('knock'); await S.wait(400);
    await S.narr('楼下，最上面那道门闩「咔」地一声，拔开了。');
    S.sfx('open'); await S.wait(600); S.amb('wind');
    await S.narr('门开了。\n风灌进门厅，一直灌上楼梯。敲门声，停了。');
    await S.wait(1300);
    await S.say('怀特太太（楼下）', '……赫伯特？', { style: 'whisper' });
    await S.narr('很长、很长的一段寂静。');
    await S.wait(900);
    S.sfx('scream'); S.shake(800, 3); S.fx('red');
    await S.narr('然后，她叫了起来。');
    await S.end({ bad: true, title: '门开了', text: '你始终没有摸到那只猴爪。\n\n那天夜里楼下发生的事，你从来没有对任何人说起过。\n你只记得，她的叫声停下来以后，\n房子里静得能听见雨水从屋檐上滴落的声音。' });
  }

  async function finale(S) {
    S.f.act = 'end';
    S.focus(8, 7);
    await S.narr('你跑过她身边，一直跑到院门口。');
    await S.narr('对面那盏路灯一明一灭，照着一条空荡荡的、静悄悄的路。');
    await S.wait(900);
    await S.narr('什么也没有。\n只有风，和被雨水泡烂了的路。');
    await S.fade(1, 1400);
    await S.end({ title: '第八夜　完', text: '身后，她还在哭。\n\n你低下头，才发现自己手里还攥着那只猴爪。\n三个愿望，都许完了。\n它再也不会动了。' });
  }

  /* ---------------- 章节定义 ---------------- */
  defChapter({
    id: 'monkeypaw', n: 8, title: '猴爪', sub: '三个人，每人三个愿望。苦行僧要让世人知道：命运不容插手。', origin: '英国短篇小说 · 1902', color: '#3a2a18',
    icon: '@monkey', amb: 'fire', floor: 'wood', wall: 'paper', dark: .7, plr: 3,
    people: {
      me: { key: 'mp-me', skin: '#e8c4a8', hair: '#cfcac0', hs: 'short', top: '#5a4632', top2: '#e8e4d8', bottom: '#3a3530', shoes: '#1a1410',
        extra(g, d, fr, G, R) { if (d === 0) R(6, G.hT + 6, 4, 1, '#cfcac0'); else if (d === 1) R(4, G.hT + 6, 3, 1, '#cfcac0'); } },
      wife: { skin: '#ecc8b0', hair: '#dcd8d0', hs: 'bun', top: '#5a3a4a', top2: '#e8e2d6', bottom: '#5a3a4a', dress: true, shoes: '#2a1a1a' },
      wifeA: { skin: '#ecc8b0', hair: '#dcd8d0', hs: 'bun', top: '#5a3a4a', top2: '#e8e2d6', bottom: '#5a3a4a', dress: true, shoes: '#2a1a1a', apron: '#e8e2d6' },
      wifeB: { skin: '#e4c4ae', hair: '#dcd8d0', hs: 'bun', top: '#1e1a20', top2: '#3a3438', bottom: '#1e1a20', dress: true, shoes: '#111' },
      herb: { skin: '#f0c8a0', hair: '#6a4426', hs: 'short', top: '#7a6a4e', top2: '#e8e4d8', bottom: '#4a4038', shoes: '#2a1a10' },
      herbC: { skin: '#f0c8a0', hair: '#6a4426', hs: 'short', top: '#7a6a4e', top2: '#e8e4d8', bottom: '#4a4038', shoes: '#2a1a10', hat: 'cap', hatC: '#4a4036' },
      morris: { key: 'mp-morris', skin: '#d8906a', hair: '#4a2e1a', hs: 'short', top: '#a82a22', top2: '#d8b860', bottom: '#1e2438', shoes: '#111',
        extra(g, d, fr, G, R) { if (d === 0) { R(5, G.hT + 6, 6, 1, '#4a2e1a'); R(7, G.tT + 2, 1, 1, '#e8c860'); R(7, G.tT + 4, 1, 1, '#e8c860'); R(4, G.tB - 1, 8, 1, '#e8e2d0'); } else if (d === 1) R(3, G.hT + 6, 4, 1, '#4a2e1a'); } },
      stranger: { key: 'mp-stranger', skin: '#e8d0b8', hair: '#2a2420', hs: 'short', top: '#1c1c22', top2: '#e8e8e8', bottom: '#1c1c22', coat: true, shoes: '#0a0a0a',
        extra(g, d, fr, G, R) { const h = '#0c0c10'; R(5, 0, 6, 3, h); R(5, 2, 6, 1, '#4a4450'); R(3, 3, 10, 1, h); } },
      monkey: { key: 'mp-monkey', skin: '#6a4a30', hair: '#2e2014', hs: 'messy', top: '#2e2014', bottom: '#2e2014', eye: '#2e2014',
        extra(g, d, fr, G, R) { if (d === 0) { R(5, G.hT + 4, 6, 3, '#a07a52'); R(5, G.hT + 3, 2, 1, '#ffcc33'); R(9, G.hT + 3, 2, 1, '#ffcc33'); R(6, G.hT + 6, 4, 1, '#1a0606'); R(1, G.hT + 2, 3, 3, '#a07a52'); R(12, G.hT + 2, 3, 3, '#a07a52'); R(5, G.hT + 2, 6, 1, '#1a1008'); } } }
    },
    items: {
      paw: { name: '猴爪', desc: '一只干瘪的小爪子，缩成一团，毛快掉光了。拿在手里，比看上去要沉。' },
      whisky: { name: '威士忌', desc: '餐具柜里那瓶留着待客的威士忌。' },
      matches: { name: '火柴', desc: '五斗柜上的一盒火柴。' }
    },
    notes: {
      postcard: { title: '莫里斯寄来的明信片', text: '（正面印着一座爬满藤蔓的古庙，庙檐上蹲着几只猴子。邮戳是三年前的。）\n\n亲爱的怀特：\n这边热得叫人发昏。这里的人不管碰上什么事，都说一句「这是命」。从前我笑他们，现在不笑了。\n\n等我退伍回来，有样东西要给你看看——\n不，还是不给你看了。就当我没说。\n\n替我问候太太，还有你家那个小鬼。\n\n——莫里斯' },
      mortgage: { title: '房贷还款单', text: '金链花别墅\n\n本期还款已收讫。\n尚欠本金：贰佰英镑整。\n\n（背面是你的铅笔字：\n再熬两年就清了。\n清了那天，给孩子他妈换一架新缝纫机，\n给赫伯特买辆像样的自行车。）' },
      letter: { title: '毛与梅金斯公司来函', text: '致 怀特先生、怀特太太：\n\n本公司谨就令郎赫伯特·怀特先生在本厂发生的不幸事故，表示深切的遗憾。\n\n本公司特此声明：对该事故不承担任何责任，亦不承认负有任何义务。\n\n然鉴于令郎在职期间勤勉尽责，董事会决定，向二位致送抚恤金：\n\n贰佰英镑整。\n\n（信纸的折痕里有一圈干了的水渍，像是有人在这张纸上哭过，又用袖子擦掉了。）' },
      sketch: { title: '赫伯特画的漫画', text: '（一张从账本上撕下来的纸，铅笔画。）\n\n左边：一个灰胡子老头，骑着棋盘上的国王，举着拐杖往敌阵里冲。底下写着：「爸爸的战术」。\n\n右边：一只红彤彤的大龙虾，穿着军装，端着酒杯。底下写着：「军士长，第三杯」。\n\n最下面一角，铅笔涂得又黑又重：一张猴子的脸，五官挤在一团火焰里。\n旁边一行小字——\n「炉子里看见的。睡不着。」' }
    },
    legend: '《猴爪》（The Monkey\'s Paw）是英国作家W·W·雅各布斯（1863–1943）的短篇小说，1902年9月首刊于美国的《哈珀月刊》，同年收入他的短篇集《驳船上的女人》。雅各布斯平生以写码头、水手和驳船船夫的幽默故事闻名，偏偏是这篇阴冷的小说，成了他流传最广的作品。\n\n故事很短：一个印度苦行僧在猴爪上施了咒，要让世人明白命运不容插手——三个人可以凭它各许三个愿望，每一个愿望都会实现，却以最残酷的方式。怀特一家许下的两百英镑，变成了儿子的抚恤金；第二个愿望让死者归来；第三个愿望把它送了回去。原著从头到尾没有让门外的东西露面，读者只听见敲门声——这种「不写」，后来常被当作恐怖小说留白的范本。\n\n小说发表的第二年（1903年）就被改编成独幕剧，在伦敦干草市场剧院上演；此后有多次电影改编（据说最早的一部是1915年的英国默片，如今已经失传），还有数不清的广播剧、电视剧和戏仿。斯蒂芬·金在《宠物坟场》里引用过它，《辛普森一家》的万圣节特辑也拿它开过玩笑。「小心你许下的愿望」——三个愿望、字面兑现、代价惨重——从此成了恐怖与奇幻故事里一个固定的母题。\n\n（本章中：棋局的选项、莫里斯的明信片、房贷单、公司来信的原文、赫伯特的漫画、为赫伯特送行和莫里斯临别欲言又止的一幕、墓地的场景、猴爪在黑暗中被踢走后的限时摸索、两个坏结局，以及结尾手中的猴爪，都是游戏为了互动而增加的；主要情节、人物与对话内容依照原著，文字为重新创作。）',
    start: { map: 'parlor', x: 4, y: 6, dir: 2 },
    resume: {
      door: async S => {
        S.hide('wife_b');
        S.place('paw2', ...PAWS[S.f.pawSpot || 0]);
        for (let i = 0; i < GROPE.length; i++) S.show('g' + i);
        mood(S);
        S.sfx('knock');
        await S.narr('敲门声。一下，又一下。\n楼下，门闩在插槽里吱吱作响。');
        startDoor(S);
      }
    },
    async intro(S) {
      await S.card('第八夜　猴爪', '二十世纪初　英格兰　金链花别墅', '外面又冷又湿。\n离城很远的这条路上，只租出去了两栋房子。\n今晚，有一位从印度回来的老朋友要来做客。');
    },
    tick(S, dt) {
      if (S.f.act !== 'door' || !W.timer || W.busy) return;
      const k = 1 - W.timer.left / DOORT;
      S.f._kn = (S.f._kn || 0) - dt;
      if (S.f._kn <= 0) { S.sfx('knock'); if (k > .45) S.shake(220, 1 + k * 2); S.f._kn = 2.6 - k * 2; }
      const stages = [[.12, '「门闩！」她在楼下喊，「下来帮帮我！上面那道我够不着！」'], [.32, '敲门声一下比一下急，整扇门都在门框里发抖。'], [.52, '楼下传来拖椅子的声音——她要踩着椅子去够最上面那道门闩。'], [.72, '「我来了，赫伯特！我来了！」'], [.88, '门闩在插槽里吱吱作响，一点一点地松动了……']];
      const i = S.f._st || 0;
      if (i < stages.length && k >= stages[i][0]) { S.f._st = i + 1; S.toast(stages[i][1]); }
    },
    sprites: {
      hearth(g, e, t, R) {
        box(R, -2, -10, 36, 25, '#5a4a44'); R(-2, -12, 36, 3, '#3a2a24'); R(6, -2, 20, 16, '#120a08'); R(8, 12, 16, 2, '#2a1a14');
        if (e.off) { R(10, 12, 3, 1, '#4a1a0c'); R(17, 12, 2, 1, '#5a2410'); R(21, 13, 2, 1, '#3a160a'); return; }
        const lo = e.low ? .35 : 1;
        for (let i = 0; i < 5; i++) { const h = Math.max(1, ((3 + (Math.sin(t * 9 + i * 1.7) + 1) * 3) * lo) | 0); R(8 + i * 3, 13 - h, 3, h, i % 2 ? '#ff8a2a' : '#ffcf5a'); }
      },
      irons(g, e, t, R) { R(4, 13, 8, 2, '#2a2a2a'); R(7, -3, 2, 16, '#3a3a3a'); R(5, -6, 1, 19, '#555'); R(10, -5, 1, 18, '#6a6a6a'); R(12, -5, 1, 18, '#6a6a6a'); R(11, 11, 2, 2, '#6a6a6a'); R(4, -8, 3, 2, '#c9a35a'); R(9, -7, 5, 2, '#c9a35a'); },
      chesstable(g, e, t, R) { R(7, 10, 2, 5, '#3a2618'); R(4, 14, 8, 1, '#2a1a10'); box(R, 0, 1, 16, 10, '#5a3c26'); for (let i = 0; i < 4; i++) for (let j = 0; j < 3; j++) R(2 + i * 3, 2 + j * 3, 3, 3, (i + j) % 2 ? '#2a2020' : '#d8d0bc'); R(4, -1, 1, 4, '#eee'); R(11, 0, 1, 3, '#111'); R(8, 1, 1, 2, '#111'); },
      frontdoor(g, e, t, R) {
        const c = '#4a2e1a';
        if (e.open) { R(1, -4, 14, 18, '#0a0c12'); R(1, -4, 2, 18, shade(c, -.2)); R(3, 4, 10, 10, 'rgba(70,80,110,.45)'); return; }
        box(R, 1, -4, 14, 18, c); R(4, -3, 8, 2, '#2a3a4a'); R(3, 0, 10, 5, shade(c, .1)); R(3, 7, 10, 5, shade(c, .1)); R(12, 5, 2, 2, '#c9a35a');
        R(2, -2, 1, 4, '#8a8a8a'); R(1, -1, 3, 1, '#b0b0b0'); R(2, 9, 1, 4, '#8a8a8a'); R(1, 10, 3, 1, '#b0b0b0');
        R(11, 1, 1, 1, '#bbb'); R(12, 2, 1, 1, '#bbb'); R(11, 3, 1, 1, '#bbb');
      },
      hooks(g, e, t, R) { R(1, 2, 14, 2, '#3a2618'); R(3, 4, 1, 2, '#c9a35a'); R(8, 4, 1, 2, '#c9a35a'); R(12, 4, 1, 2, '#c9a35a'); R(2, 5, 4, 8, '#3a3632'); if (e.coat) { R(11, 5, 3, 9, '#8a3a2a'); R(11, 7, 3, 1, '#c8b890'); R(11, 10, 3, 1, '#c8b890'); } },
      gate(g, e, t, R) { R(0, 3, 2, 12, '#7a5a3c'); R(14, 3, 2, 12, '#7a5a3c'); if (e.open) { R(2, 4, 2, 10, '#6a5038'); R(3, 6, 1, 7, '#5a4430'); } else { R(2, 6, 12, 2, '#6a5038'); R(2, 11, 12, 2, '#6a5038'); R(4, 6, 1, 7, '#5a4430'); R(8, 6, 1, 7, '#5a4430'); R(11, 6, 1, 7, '#5a4430'); } },
      laburnum(g, e, t, R) { R(6, 2, 4, 13, '#3a2a1a'); R(5, 13, 6, 2, '#2a1e12'); R(1, -14, 14, 4, '#2a1e14'); R(3, -18, 10, 5, '#2a1e14'); R(0, -10, 2, 10, '#2a1e14'); R(14, -10, 2, 9, '#2a1e14'); for (let i = 0; i < 6; i++) R(2 + i * 2.4, -10, 1, 4 + (i % 3) * 3, '#3a2c1c'); R(4, -6, 1, 2, '#6a5a2a'); R(11, -4, 1, 2, '#6a5a2a'); },
      bwindow(g, e, t, R) { box(R, 2, 1, 12, 10, '#4a3a2a'); if (e.open) { R(3, 2, 10, 8, '#0c1422'); R(10, 3, 2, 1, '#9aa4b8'); R(3, 2, 10, 1, '#b8a888'); } else { R(3, 2, 10, 8, '#a89878'); for (let y = 3; y < 10; y += 2) R(3, y, 10, 1, '#988868'); R(7, 9, 2, 1, '#5a4a3a'); } },
      mound(g, e, t, R) { R(1, 3, 14, 11, '#3a2c1e'); R(2, 4, 12, 3, '#4a3a28'); R(4, 9, 3, 1, '#2a1e14'); R(10, 7, 2, 1, '#2a1e14'); },
      paw2(g, e, t, R) { R(5, 7, 6, 4, '#7a5e40'); R(4, 10, 2, 4, '#7a5e40'); R(7, 11, 1, 4, '#7a5e40'); R(10, 10, 2, 4, '#7a5e40'); R(10, 5, 2, 3, '#5a4028'); R(6, 8, 3, 1, '#9a7a56'); }
    },
    maps: {
      /* ---------------- 客厅 ---------------- */
      parlor: {
        amb: 'fire', dark: .7, wall: 'paper', floor: 'wood', plr: 3,
        tileOpts: { rugC: '#6a3424' },
        rows: [
          '#############',
          '#############',
          '#...........#',
          '#...........#',
          '#..rrrrr....#',
          '#..rrrrr....#',
          '#...........#',
          '#...........#',
          '#############'],
        ents: [
          { id: 'pdoor', x: 1, y: 1, spr: 'door', async on(S) {
            const a = S.f.act;
            if (a === 'morris') return S.narr('军士长还在炉火边等着呢。');
            if (a === 'fire') return S.narr('猴爪还在火里！');
            if (a === 'wish1') { S.face('herb', 'pl'); return S.say('赫伯特', '别急着走嘛，爸爸！还没许愿呢。'); }
            S.sfx('open'); await S.go('hall', 2, 5, 3);
          } },
          { x: 3, y: 1, spr: 'painting', col: '#2a3a4a', on: S => S.narr(S.f.dead ? '那幅帆船画。赫伯特小时候总问，画里的船要开到哪儿去。' : '一幅褪了色的帆船画，挂得有点歪。你一直说要把它扶正。') },
          { id: 'fire', x: 5, y: 2, w: 2, spr: 'hearth', light: FIRE, async on(S) {
            const a = S.f.act;
            if (a === 'fire') return S.narr('猴爪在炭火里蜷成一团，毛已经开始卷曲——\n火钳！火钳就在旁边！');
            if (a === 'fetch' && !S.has('paw')) {
              S.hide('mpaw'); S.give('paw', true); S.sfx('item');
              await S.narr('你的手摸到了壁炉架。\n那东西还在原处。');
              await S.narr('一阵恐惧猛地攫住了你：\n这个还没说出口的愿望，会不会在你逃出这间屋子之前，就把你那残缺不全的儿子带到你面前？');
              S.dark(.985); S.plr(1.1); S.sfx('heart');
              await S.narr('你屏住呼吸，转过身——\n你发现自己找不着门在哪儿了。');
              S.goal('摸回卧室去');
              return;
            }
            if (is4(S)) return S.narr('炉膛里只剩一堆冷灰。');
            if (a === 'bed1') return S.narr('炉火小了下去。赫伯特往里添了一块炭。');
            if (!S.ent('mpaw').hidden) return S.narr('壁炉架上，那只猴爪蜷在座钟旁边。');
            await S.narr('炉火烧得很旺。外面越冷，这间小屋就越像一个暖烘烘的壳。');
          } },
          { id: 'mpaw', x: 6, y: 2, spr: 'paw', hidden: true, z: 1, oy: -24, ox: -4 },
          { id: 'fpaw', x: 5, y: 2, spr: 'paw', hidden: true, z: 1, ox: 8, oy: -1 },
          { id: 'irons', x: 7, y: 2, spr: 'irons', async on(S) {
            if (S.f.act === 'fire') return pawRescued(S, 'tongs');
            await S.narr(is4(S) ? '你摸到了火钳冰凉的铁柄。' : '一套铜把手的火钳、火铲和拨火棍。');
          } },
          { id: 'pwin', x: 9, y: 1, spr: 'window', async on(S) {
            const a = S.f.act;
            if (a === 'stranger') {
              if (S.f.saw) return S.narr('那个人已经推开院门，走上了小路。');
              await S.narr('窗外，一个男人在你家院门口来回踱步。\n穿得很讲究，头上一顶崭新锃亮的丝绒礼帽。');
              await S.narr('他在门口停了三次，三次都走开了。\n第四次，他站住了，一只手搭在门上——然后，像是忽然下定了决心，推开门，走上了小路。');
              S.ent('wife_w').spr = '@wife';
              await S.narr('怀特太太慌忙解下围裙，塞到了椅垫底下。');
              await S.say('怀特太太', '会不会……跟那两百英镑有关？', { style: 'whisper' });
              S.f.saw = true; S.goal('去前门');
              return;
            }
            if (S.f.day) return S.narr('窗外是冬天惨白的太阳。院子里的泥地，冻得硬邦邦的。');
            await S.narr(is4(S) ? '百叶窗后面，什么也看不见。' : '百叶窗拉下来了。风把雨点一阵一阵地摔在玻璃上。');
          } },
          { id: 'piano', x: 10, y: 2, w: 2, spr: 'piano', async on(S) {
            if (is4(S)) { if (S.once('sketchHint')) await S.narr('琴盖上落了一层薄灰。谱架上还夹着一张纸。'); return S.note('sketch'); }
            await S.narr('一架旧立式钢琴。赫伯特只会弹几个和弦，却总爱弹得震天响。');
          } },
          { x: 3, y: 3, spr: 'armchair', col: '#5a4a3a' },
          { id: 'wife', x: 3, y: 3, oy: -3, spr: '@wife', dir: 0, async on(S) {
            S.face('wife', 'pl');
            const a = S.f.act;
            if (a === 'door1') return S.say('怀特太太', '快去开门吧，老头子，别让客人在雨里站着。');
            if (a === 'morris') return S.say('怀特太太', '（小声）先给人家倒杯酒呀。');
            if (a === 'wish1') return S.say('怀特太太', '许吧，许吧。给我许四双手，正好忙得过来。');
            if (a === 'bed1') return S.say('怀特太太', '睡吧，老头子。明天一早还得给赫伯特做早饭。');
            await S.say('怀特太太', '（她低头织着毛线，没有说话）');
          } },
          { id: 'wife_w', x: 8, y: 2, spr: '@wifeA', dir: 3, hidden: true, async on(S) {
            S.face('wife_w', 'pl');
            if (!S.f.saw) return S.say('怀特太太', '老头子，你来看。外面有个人，在咱们家门口转来转去的。');
            await S.say('怀特太太', '去开门呀。');
          } },
          { x: 8, y: 3, spr: 'armchair', col: '#4a3a4a' },
          { id: 'morris', x: 8, y: 3, oy: -3, spr: '@morris', dir: 1, hidden: true, async on(S) {
            S.face('morris', 'pl');
            if (S.f.act === 'fire') return S.say('莫里斯', '让它烧了吧。');
            if (S.f.act !== 'morris') return;
            if (!S.has('whisky')) return S.say('莫里斯', '这天气，啧。先来点暖身子的再说吧，怀特。');
            return morrisTale(S);
          } },
          { id: 'stranger', x: 8, y: 3, oy: -3, spr: '@stranger', dir: 1, hidden: true, on: S => S.narr('他不敢看你的眼睛。') },
          { id: 'chess', x: 5, y: 6, spr: 'chesstable', on: S => S.narr(is4(S) ? '棋子还摆在那天晚上的位置。你的国王，被将死在棋盘中央。' : '那盘棋还摆着。你的国王四面楚歌。') },
          { id: 'tpaw', x: 5, y: 6, spr: 'paw', hidden: true, z: 1, oy: -8 },
          { id: 'herb', x: 6, y: 6, spr: '@herb', dir: 1, async on(S) {
            S.face('herb', 'pl');
            const a = S.f.act;
            if (a === 'door1') return S.say('赫伯特', '他来了，爸爸。还不快去开门？');
            if (a === 'morris') return S.say('赫伯特', '（小声）让他讲讲猴爪的事！');
            if (a === 'fire') return S.say('赫伯特', '爸爸！火钳！');
            if (a === 'wish1') return firstWish(S);
            if (a === 'bed1') return S.say('赫伯特', '晚安，爸爸。替我留意一下衣柜顶上。');
          } },
          { id: 'cab', x: 11, y: 4, spr: 'cabinet', col: '#5a3a26', async on(S) {
            if (S.f.act === 'morris' && !S.has('whisky')) { S.give('whisky'); return S.narr('你从餐具柜里取出那瓶待客的威士忌，还有一只擦得锃亮的玻璃杯。'); }
            await S.narr(is4(S) ? '餐具柜里，那瓶威士忌还剩小半瓶。没有人再碰过它。' : '餐具柜。最好的那套茶具，一年只拿出来两次。');
          } },
          { id: 'desk', x: 11, y: 6, spr: 'desk', async on(S) {
            if (S.f.dead) {
              if (S.once('letterHint')) { await S.narr('写字台上压着一封信。信封上印着「毛与梅金斯」。'); return S.note('letter'); }
              return S.note(['letter', 'mortgage'][await S.ask('写字台上，两张纸叠在一起。', ['公司的来信', '那张还款单'])]);
            }
            if (S.once('mortHint')) await S.narr('写字台的抽屉里夹着一张还款单。');
            await S.note('mortgage');
          } },
          { id: 'plamp', x: 1, y: 6, spr: 'lamp', light: { r: 3.4, col: 'rgba(255,190,110,.14)' }, on: S => S.narr('油灯。灯罩被熏黄了一圈。') }
        ],
        async enter(S, first) {
          const a = S.f.act;
          if (a === 'herbfire' || a === 'news' || a === 'farewell') return;
          mood(S);
          if (first) return chessScene(S);
          if (a === 'wish1' && S.once('wish1in')) {
            await S.say('赫伯特', '要是那猴爪的故事，跟他讲的其他故事一样靠不住，咱们可发不了什么财。');
            await S.say('怀特太太', '你给他钱了没有，老头子？');
            await S.say('你', '一点小意思。他不肯要，我硬塞给他的。临走他又劝我把它扔了。');
            await S.say('赫伯特', ['那怎么行！咱们要发财、要出名、要过好日子了！', '爸爸，先许个当皇帝吧，那样你就再也不用怕老婆了。']);
            await S.narr('怀特太太抄起沙发上的椅套去打他，赫伯特笑着绕着棋桌逃开了。');
            S.goal('和赫伯特商量，许个什么愿');
          }
          if (a === 'stranger' && S.once('strangerIn')) {
            S.face('wife_w', 'pl');
            await S.say('怀特太太', '老头子……你来看。外面有个人。');
            S.face('wife_w', 3);
            S.goal('看看窗外');
          }
          if (a === 'fetch' && !S.has('paw') && S.once('fetchIn')) await S.narr('客厅里冷得像个地窖。\n你顺着墙，一点一点往壁炉那边摸。');
        }
      },
      /* ---------------- 门厅与厨房 ---------------- */
      hall: {
        amb: 'room', dark: .82, wall: 'paper', floor: 'darkwood', plr: 3,
        tileOpts: { tileC: '#b8b0a0' },
        rows: [
          '##############',
          '##############',
          '#.......+++++#',
          '........+++++#',
          '#.......+++++#',
          '#.......+++++#',
          '##.###########'],
        ents: [
          { id: 'stairs', x: 0, y: 3, spr: 'stairsup', solid: false, async touch(S) {
            const a = S.f.act;
            if (a === 'bed1') return herbertFire(S);
            if (a === 'flee' || a === 'after' || (a === 'fetch' && S.has('paw'))) return S.go('bedroom', 4, 5, 3);
            S.pos(1, 3, 2);
            if (a === 'fetch') return S.narr('猴爪在客厅的壁炉架上。');
            if (a === 'candle') return S.narr('蜡烛在厨房里。');
            await S.narr(S.f.day ? '楼上是卧室。大白天的，上去做什么。' : '楼上是卧室。还不到睡觉的时候。');
          } },
          { id: 'toparlor', x: 2, y: 6, spr: 'invisible', async touch(S) {
            if (S.f.act === 'flee') { S.pos(2, 5, 3); return S.narr('不——回楼上去！回卧室去！'); }
            await S.go('parlor', 1, 2, 0);
          } },
          { id: 'hooks', x: 2, y: 1, spr: 'hooks', coat: true, on: S => S.narr(is4(S) ? '他那条红格子围巾还挂在钩子上。\n没有人去动它。' : '门厅的衣帽钩。你的旧大衣，还有赫伯特那条红格子围巾。') },
          { id: 'hclock', x: 4, y: 2, spr: 'clock', on: S => S.narr(is4(S) ? '钟摆在黑暗里一下一下地走。\n你忽然想：从墓地走到这儿，要走多久？' : '门厅里的老座钟。走得比镇上的钟慢五分钟，谁也懒得去拨。') },
          { id: 'fdoor', x: 6, y: 1, spr: 'frontdoor', async on(S) {
            const a = S.f.act;
            if (a === 'door1') return morrisArrives(S);
            if (a === 'stranger') { S.sfx('open'); return S.go('garden', 6, 2, 0); }
            if (a === 'after') return S.go('garden', 6, 2, 0);
            if (a === 'seeoff') return S.narr('和赫伯特道个别吧。');
            if (a === 'flee') { S.sfx('knock'); S.shake(300, 2); return S.narr('门板在你手掌底下震了一下。\n你的手僵在门闩上，怎么也不敢去拔。'); }
            if (is4(S)) return S.narr('门上了两道闩，还挂着链子。\n上面那道门闩，她踮着脚也够不着。');
            if (S.f.day) return S.narr('前门。门外那条小路，一下雨就成了泥塘。');
            await S.narr('门已经闩上了。外面风声呜呜的，雨点一阵一阵地打在门板上。');
          } },
          { id: 'morris_h', x: 6, y: 2, spr: '@morris', dir: 0, hidden: true },
          { id: 'htable', x: 4, y: 5, spr: 'table', col: '#5a3c26', async on(S) {
            if (S.once('postHint')) await S.narr('门厅的小桌上，压着一张旧明信片。');
            await S.note('postcard');
          } },
          { id: 'hcandle', x: 4, y: 5, spr: 'candle', z: 1, oy: -11, light: { r: 3, col: 'rgba(255,170,80,.18)', flick: true } },
          { id: 'spill', x: 1, y: 3, spr: 'match', hidden: true, decal: true },
          { id: 'kwin', x: 10, y: 1, spr: 'window', on: S => S.narr(S.f.day ? '冬天的太阳，又白又冷，照在厨房的砖地上。' : '厨房的窗玻璃上全是雨水。') },
          { id: 'sideb', x: 8, y: 2, spr: 'dresser', col: '#6a4a30', on: S => S.narr(!S.ent('kpaw').hidden ? '那只脏兮兮、干瘪瘪的小爪子，被随手扔在餐具柜上。\n看得出，谁也没把它当回事。' : is4(S) ? '餐具柜。你摸到了一摞冰凉的盘子。' : '餐具柜。几只蓝边的盘子立在架子上。') },
          { id: 'kpaw', x: 8, y: 2, spr: 'paw', hidden: true, z: 1, oy: -12 },
          { x: 9, y: 2, spr: 'counter', on: S => S.narr(S.f.act === 'flee' || S.f.act === 'candle' ? '蜡烛盒就在抽屉里——可你已经顾不上了。' : '案板上放着半条面包，还有一把黄油刀。') },
          { x: 11, y: 2, spr: 'stove', on: S => S.narr(is4(S) ? '炉子冷了。' : '炉子上坐着一壶水，咕嘟咕嘟地响。') },
          { x: 12, y: 2, spr: 'sink', on: S => S.narr('水龙头在滴水。滴答，滴答。') },
          { id: 'ktable', x: 9, y: 4, w: 2, spr: 'table2', col: '#7a5a3a', on: S => S.narr(S.f.act === 'morning' || S.f.act === 'seeoff' ? '早餐桌。煎蛋、面包、一壶浓茶。' : '厨房的餐桌。桌角有一道赫伯特小时候用小刀刻的印子。') },
          { id: 'wife_h', x: 11, y: 4, spr: '@wifeA', dir: 1, hidden: true, async on(S) {
            S.face('wife_h', 'pl');
            if (S.f.act === 'after') return S.narr('她跪在门口，手还抓着门闩。\n她没有看你。');
            if (S.f.act === 'seeoff') return S.say('怀特太太', '去送送他吧。');
            await S.say('怀特太太', ['我看当兵的都一个样。咱俩居然会听那种胡话！', '这年头哪还有许愿成真的事？就算真有，两百英镑又能害着你什么，老头子？']);
          } },
          { id: 'herb_h', x: 9, y: 3, spr: '@herbC', dir: 0, hidden: true, async on(S) {
            S.face('herb_h', 'pl');
            if (S.f.act === 'seeoff') return seeOff(S);
            await S.say('赫伯特', '说不定，钱会从天上掉下来，正好砸在他脑袋上。');
            await S.say('你', '莫里斯说过，事情会发生得自然而然。你要是愿意，大可以当它是巧合。');
            await S.say('赫伯特', ['好吧。那在我回来之前，可别把钱动了。', '我怕它把你变成个又小气又贪财的老头，到时候我们只好跟你断绝关系。']);
            await S.narr('怀特太太笑出了声。赫伯特抓起帽子，往门口走去。');
            await S.walk('herb_h', [6, 2], 3.5); S.face('herb_h', 0);
            await S.say('怀特太太', '去送送他吧，老头子。');
            S.f.act = 'seeoff';
            S.goal('送赫伯特出门');
          } }
        ],
        async enter(S, first) {
          const a = S.f.act;
          if (a === 'farewell' || a === 'herbfire') return;
          mood(S);
          if (a === 'door1' && S.once('hallIn')) await S.narr('门厅里冷飕飕的。前门外，有人在门垫上使劲跺着脚上的泥。');
          if (a === 'morning' && S.once('morningIn')) {
            S.show('wife_h'); S.show('herb_h'); S.show('kpaw');
            await S.narr('屋里有一种结实的、过日子的气息——昨天夜里可没有。');
            S.goal('吃早饭');
            S.cp();
          }
          if (a === 'candle') return knockAtFoot(S);
          if (a === 'after' && S.once('afterIn')) { S.sfx('cry'); await S.narr('前门大开着。冷风裹着雨丝扑进门厅。\n她跪在门口，哭得说不出话来。'); S.goal('到门外去看看'); }
        },
        tick(S, dt) {
          if (S.f.act !== 'flee' || W.busy) return;
          S.f._fk = (S.f._fk ?? 2) - dt;
          if (S.f._fk <= 0) { S.sfx('knock'); S.f._fk = 2.4; }
        }
      },
      /* ---------------- 卧室 ---------------- */
      bedroom: {
        amb: 'room', dark: .85, wall: 'paper', floor: 'wood', plr: 2.4,
        rows: [
          '##########',
          '##########',
          '#........#',
          '#........#',
          '#........#',
          '#........#',
          '####.#####'],
        ents: [
          { id: 'bdown', x: 4, y: 6, spr: 'stairsdown', solid: false, async touch(S) {
            const a = S.f.act;
            if ((a === 'fetch' && !S.has('paw')) || a === 'candle' || a === 'after') return S.go('hall', 1, 3, 2);
            S.pos(4, 5, 3);
            if (a === 'door') return S.toast('下去也拦不住她。猴爪——猴爪掉在这屋里了！');
            if (a === 'matches') return S.narr('黑灯瞎火的，得先把五斗柜上的火柴拿上。');
            await S.narr('你坐着，一动不动。');
          } },
          { id: 'bed', x: 1, y: 2, h: 2, spr: 'bed', col: '#7a6a5a', async on(S) {
            const a = S.f.act;
            if (a === 'wait') return lieDown(S);
            if (a === 'door') return S.toast('被子还是乱的，冰凉冰凉。');
            await S.narr(a === 'night' || a === 'fetch' ? '被窝里还留着一点暖气。' : '床。你一点也不困。');
          } },
          { id: 'bdresser', x: 3, y: 2, spr: 'dresser', col: '#5a3c26', async on(S) {
            const a = S.f.act;
            if (a === 'matches') { S.give('matches'); S.f.act = 'candle'; S.goal('下楼去厨房拿根蜡烛'); return S.narr('你在五斗柜上摸到了那盒火柴。'); }
            if (a === 'door') return S.toast('五斗柜。烛台倒了，蜡烛头早灭了。');
            await S.narr('五斗柜上放着她的祈祷书，书页被翻得卷了边。\n里面夹着一绺用丝线扎起来的、浅黄色的头发。');
          } },
          { id: 'bcandle', x: 3, y: 2, spr: 'candle', z: 1, oy: -10, off: true, light: { r: 2.8, col: 'rgba(255,170,80,.2)', flick: true } },
          { id: 'bwin', x: 6, y: 1, spr: 'bwindow', async on(S) {
            if (S.f.act === 'door') return S.toast('窗外黑沉沉的。路灯的光够不到这里。');
            await S.narr(S.ent('bwin').open ? '百叶窗拉起来了。窗外黑沉沉的，远处路口有一盏路灯。\n路上什么也没有。' : '百叶窗拉着。');
          } },
          { id: 'wardrobe', x: 8, y: 2, spr: 'wardrobe', on: S => S.f.act === 'door' ? S.toast('衣柜。不在这儿。') : S.narr('衣柜。最底下一格，放着赫伯特小时候的衣服。她一件也没舍得扔。') },
          { id: 'bchair', x: 7, y: 4, spr: 'chair', on: S => S.f.act === 'door' ? S.toast('椅子腿。不是。') : S.narr('一把硬木椅子。') },
          { id: 'wife_b', x: 6, y: 2, spr: '@wifeB', dir: 3, hidden: true, async on(S) {
            if (S.f.act === 'fetch') { S.face('wife_b', 'pl'); return S.say('怀特太太', '快去！快去呀！'); }
            if (S.f.act === 'wait') return S.narr('她站在窗前，一动不动，望着外面那条路。');
          } },
          { id: 'paw2', x: 3, y: 5, spr: 'paw2', solid: false, hidden: true,
            touch: async S => { if (S.f.act === 'door') return foundPaw(S); },
            async on(S) {
              if (S.f.act === 'door') return foundPaw(S);
              await S.narr('猴爪躺在地板上。你不敢去碰它。');
            } },
          ...GROPE.map(([x, y, t], i) => ({ id: 'g' + i, x, y, spr: 'invisible', solid: false, hidden: true, on: S => S.toast(t), touch: S => { if (S.f.act === 'door') S.toast(t); } }))
        ],
        async enter(S, first) {
          const a = S.f.act;
          mood(S);
          if (a === 'night' && first) return nightWake(S);
          if (a === 'fetch' && S.has('paw')) return secondWish(S);
          if (a === 'flee') return wifeRuns(S);
        }
      },
      /* ---------------- 院子与大路 ---------------- */
      garden: {
        amb: 'wind', dark: .82, rain: true, plr: 3, wall: 'brick',
        tileOpts: { grassC: '#26361f', treeC: '#16241a' },
        rows: [
          '#############',
          '#############',
          '"B""""d"""""B',
          '""""""d""""""',
          '""""""d""""""',
          'ffffffuffffff',
          'uuuuuuuuuuuuu',
          'uuuuuuuuuuuuu',
          '"""""""""""""',
          'TTPTTTTTTPTTT'],
        ents: [
          { id: 'gdoor', x: 6, y: 1, spr: 'frontdoor', light: { r: 1.8, col: 'rgba(255,190,120,.12)', dy: 18 }, async on(S) {
            if (S.f.act === 'after') return S.narr('她还跪在门里。……你得先去院门外看一眼。');
            if (S.f.act === 'stranger') return S.narr('先把客人请进来再说。');
            S.sfx('open'); await S.go('hall', 6, 2, 0);
          } },
          { x: 3, y: 1, spr: 'window', lit: true, on: S => S.narr('客厅的窗户。百叶窗后面透出一点暖黄的光。') },
          { x: 9, y: 1, spr: 'window', on: S => S.narr('厨房的窗户，黑着。') },
          { id: 'gate', x: 6, y: 5, spr: 'gate', solid: false, on: S => S.narr('院门。门闩上锈了，一推就吱呀吱呀地响。') },
          { x: 3, y: 3, spr: 'laburnum', on: S => S.narr('门前那棵金链花树。\n冬天里光秃秃的，枝条垂下来，像一把收起来的伞。别墅就是因它得名的。') },
          { x: 9, y: 4, spr: 'laburnum', on: S => S.narr('另一棵金链花树。夏天开花的时候，满树都是黄澄澄的，像挂了一串串金链子。') },
          { id: 'slamp', x: 8, y: 8, spr: 'streetlamp', flicker: true, light: { r: 2.6, col: 'rgba(255,220,140,.14)', flick: true }, on: S => S.narr('路对面的路灯。灯光昏黄，一明一灭。') },
          { id: 'stranger_g', x: 6, y: 4, spr: '@stranger', dir: 3, hidden: true, async on(S) {
            S.face('stranger_g', 'pl');
            await S.say('陌生人', '请问……这里是怀特先生府上吗？');
            await S.say('你', '我就是。请进，请进。');
            await S.narr('他打量着你，又打量着你身上那件沾着泥点的旧园艺外套，欲言又止。');
            S.f.act = 'news'; S.hide('stranger_g');
            S.hide('wife_w'); S.show('wife'); S.ent('wife').spr = '@wife'; S.ent('wife').dir = 0; S.show('stranger');
            await S.go('parlor', 7, 4, 3);
            await news(S);
          } }
        ],
        async enter(S) {
          mood(S);
          if (S.f.act === 'stranger' && S.once('gardenStranger')) {
            S.show('stranger_g'); S.ent('gate').open = true;
            await S.narr('那个人已经走进了院子，站在小路上。\n他手里捏着礼帽的帽檐，转来转去。');
            S.goal('迎上去');
          }
          if (S.f.act === 'after' && S.once('gardenAfter')) { S.amb('wind'); S.goal('到院门外去'); }
        },
        step(S, x, y) { if (S.f.act === 'after' && y >= 6) return finale(S); }
      },
      /* ---------------- 墓地 ---------------- */
      cem: {
        amb: 'rain', dark: .45, rain: true, fog: .16, plr: 3,
        tileOpts: { grassC: '#2a3626' },
        rows: [
          'PPPPPPPPPPPP',
          'P""""""""""P',
          'P""""""""""P',
          'P""""""""""P',
          'P""""""""""P',
          'P""""""""""P',
          'P""""""""""P',
          'PPPPP"PPPPPP'],
        ents: [
          { x: 2, y: 2, spr: 'gravestone', on: S => S.narr('一块老墓碑，名字被青苔吃掉了一半。') },
          { x: 4, y: 2, spr: 'gravestone', on: S => S.narr('「爱妻 玛莎」。底下的年份，你算了算——她死的时候，比你现在还年轻。') },
          { x: 9, y: 2, spr: 'gravestone', on: S => S.narr('这块碑是新的。墓地也是新的。一切都是新的，新得叫人心里发空。') },
          { x: 2, y: 5, spr: 'cross', on: S => S.narr('一个石头十字架，被雨水冲得发黑。') },
          { x: 9, y: 5, spr: 'statue', on: S => S.narr('一尊石头天使，低着头，翅膀上积着雨水。') },
          { id: 'hgrave', x: 6, y: 2, spr: 'gravestone', flowers: true, on: S => S.narr('新立的墓碑，字刻得很深：\n\n　　赫伯特·怀特\n\n石屑还没扫干净。碑前的花，被雨打得抬不起头。') },
          { x: 6, y: 3, spr: 'mound', decal: true },
          { id: 'wife_c', x: 7, y: 3, spr: '@wifeB', dir: 1, async on(S) {
            S.face('wife_c', 'pl');
            if (S.f.cemTalk) return S.narr('她挽着你的胳膊，一句话也不说。');
            await S.say('你', '……走吧。雨下大了。');
            await S.say('怀特太太', ['这儿离家，有两英里。', '他一个人在这儿……会冷的。']);
            await S.narr('她没有动。过了很久很久，她才让你挽住她的胳膊，转过身来。');
            S.f.cemTalk = true; S.follow('wife_c', true);
            S.goal('回家');
          } },
          { id: 'cgate', x: 5, y: 7, spr: 'invisible', async touch(S) {
            if (!S.f.cemTalk) { S.pos(5, 6, 3); return S.narr('她还站在墓前。你不能把她一个人留在这儿。'); }
            await S.fade(1, 900);
            S.hide('wife_c');
            await S.card('大约一个星期以后', '', '老两口回到了那座浸在阴影和沉默里的房子。\n起初他们还在等，等着再发生点什么——\n一件能让这份重担轻一点的事。\n\n可是什么也没有发生。\n日子长得叫人熬不过去。\n他们很少说话，因为已经没有什么可说的了。');
            S.f.day = false; S.f.act = 'night';
            setNight(S);
            await S.go('bedroom', 2, 3, 1, { ms: 900 });
          } }
        ],
        async enter(S, first) {
          if (first) { await S.narr('冷雨落在新翻的泥土上。\n牧师已经走了，挖墓的人在远处等着。'); S.goal('到她身边去'); }
        }
      }
    }
  });

  /* ---------------- 第一幕各段 ---------------- */
  async function chessScene(S) {
    await S.narr('外面又冷又湿。\n金链花别墅的小客厅里，百叶窗拉得严严实实，炉火烧得正旺。');
    await S.narr('你在和儿子赫伯特下棋。\n怀特太太坐在炉边织着毛线，一头白发被火光映成了淡金色。');
    await S.think('你对下棋自有一套见解——一套相当大胆的见解。');
    const r = await S.ask('你的国王孤零零地站在棋盘中央。下一步？', ['让国王再往前冲一格。', '把马调回来护驾。', '用后去吃他的车！']);
    if (r === 0) { await S.say('怀特太太', '你又把国王往外推了，老头子。我坐在这儿都替它捏把汗。'); await S.say('赫伯特', '随他去吧，妈妈。这是爸爸的「战术」。'); }
    else if (r === 1) await S.say('赫伯特', '护驾？（他笑着摇摇头）晚了一步，爸爸。');
    else { await S.say('赫伯特', '谢谢。'); await S.narr('他毫不客气地用一个小兵，吃掉了你的后。'); }
    await S.narr('赫伯特盯着棋盘，手指在桌沿上轻轻敲着。\n你忽然看出来了——一个要命的漏洞。可惜已经晚了。');
    const r2 = await S.ask('得想个办法，别让他也看出来。', ['「听听外头这风！」', '（不动声色，在心里祈祷）']);
    if (r2 === 0) { await S.say('你', '听听外头这风！'); await S.say('赫伯特', '我听着呢。'); await S.narr('他头也不抬，冷冷地打量着棋盘，伸出了手。'); }
    else await S.narr('你装作在看炉火。赫伯特慢悠悠地伸出了手。');
    await S.say('赫伯特', '将军。');
    await S.say('你', '……我看他今晚是不会来了。');
    await S.say('赫伯特', '将死。');
    await S.narr('你的国王四面楚歌，无路可走。\n不管刚才怎么走，结局好像早就摆在那儿了。');
    await S.say('你', ['住这么偏的地方，就这点最要命！', '天底下所有又脏又烂、鸟不拉屎的地方里，就数这儿最糟。门口的小路是个泥塘，大路成了一条河。', '我真不知道那些人是怎么想的。大概是这条路上只租出去两栋房子，他们就觉得修不修都无所谓！']);
    await S.say('怀特太太', '算啦，亲爱的。下一盘说不定你就赢了。');
    await S.narr('你猛地抬起头，正好撞见母子俩交换了一个心照不宣的眼神。\n那句话咽回了肚子里。你藏在稀疏的灰胡子后面，讪讪地笑了。');
    await S.wait(500);
    S.sfx('close'); S.bubble('herb', '!', 1200);
    await S.narr('院门「哐」地撞上了。\n沉重的脚步声，踩着泥水，朝前门走来。');
    await S.say('赫伯特', '他来了。');
    S.f.act = 'door1';
    S.goal('去门厅，给客人开门');
  }

  async function morrisArrives(S) {
    await S.walk('pl', [6, 3], 4); S.turn(3);
    S.ent('fdoor').open = true; S.sfx('open'); S.amb('wind');
    S.place('morris_h', 6, 2, 0); S.ent('morris_h').alpha = 1;
    await S.narr('门一开，风裹着雨点扑进了门厅。\n门口站着一个高大魁梧的男人，眼睛又小又亮，脸膛红得像炉子里的炭。');
    await S.say('你', '快进来，快进来！这一路可够你受的。');
    await S.say('莫里斯', '哈，怀特！比起孟加拉的雨季，这点雨算什么。……不过你们门口那条路，倒真是要人命。');
    await S.say('你', '可不是嘛！我跟你说，那条路——');
    S.ent('fdoor').open = false; S.sfx('close');
    S.hide('morris_h'); S.show('morris');
    S.f.act = 'morris';
    await S.go('parlor', 8, 4, 3, { ms: 600 });
    await S.narr('你把他让进客厅：「这位是莫里斯军士长。」\n军士长跟大家一一握了手，在炉边的扶手椅上坐下，满足地看着你拿出酒瓶和杯子。');
    S.goal('从餐具柜里拿威士忌，给军士长倒一杯');
    S.cp();
  }

  async function morrisTale(S) {
    S.take('whisky'); S.sfx('drip');
    await S.narr('你给他斟上酒，又把一小壶铜水壶搁到了炉边。');
    await S.narr('第三杯下肚，他的眼睛更亮了。\n他开始讲那些遥远的事：荒野里的奇景，惊心动魄的战功，战争、瘟疫，还有各种各样奇怪的人。');
    await S.say('你', '（对妻子）二十一年了。他走的时候，还是仓库里一个瘦巴巴的毛头小子。瞧瞧他现在。');
    await S.say('怀特太太', '看着倒是一点也没吃亏。');
    await S.say('你', '我也想去印度看看。哪怕就转一圈呢。');
    await S.say('莫里斯', '还是待在这儿好。');
    await S.narr('他放下空杯子，轻轻叹了口气，又摇了摇头。');
    await S.say('你', '我就想看看那些古庙、苦行僧、变戏法的……对了，莫里斯，那天你跟我提过一个什么猴爪，是怎么回事来着？');
    await S.say('莫里斯', '没什么。（他赶紧说）一点不值一提的小事。');
    S.bubble('wife', '?', 1200);
    await S.say('怀特太太', '猴爪？');
    await S.say('莫里斯', '……嗯，大概可以说是……一种魔法吧。');
    await S.narr('三个听众不约而同地往前凑了凑。\n军士长心不在焉地把空杯子举到嘴边，又放下了。你替他斟满。');
    await S.say('莫里斯', '你们瞧。');
    await S.narr('他在口袋里摸索了一阵，掏出一样东西：\n一只干瘪的小爪子，像是风干的，缩成一团，毛都快掉光了。');
    await S.narr('怀特太太嫌恶地往后一缩。赫伯特却接了过去，翻来覆去地看。');
    await S.say('你', '这东西有什么特别的？');
    await S.say('莫里斯', ['一个老苦行僧在它上面下了咒。那是个很圣洁的人。', '他想让世人明白：命运支配着人的一生，谁要是插手，谁就会遭殃。', '他施的咒是这样的：三个不同的人，每人可以凭它许三个愿望。']);
    await S.narr('他的语气太郑重了。屋里刚有人笑出声来，就觉得那笑声有点刺耳。');
    await S.say('赫伯特', '那您自己怎么不许三个呢，长官？');
    await S.narr('军士长看了他一眼——中年人看见毛躁的年轻人时，往往就是这种眼神。');
    await S.say('莫里斯', '我许过了。', { style: 'whisper' });
    await S.narr('他那张斑斑驳驳的红脸，一下子白了。');
    await S.say('怀特太太', '那……三个愿望，真的都实现了？');
    await S.say('莫里斯', '实现了。');
    S.sfx('glass');
    await S.narr('杯子在他的牙齿上，轻轻磕了一下。');
    await S.say('怀特太太', '还有别人许过吗？');
    await S.say('莫里斯', ['第一个人许满了三个。前两个是什么，我不知道。', '第三个……是求死。', '这东西，就是这么到我手里的。']);
    await S.narr('他的声音沉得吓人。一屋子人都不说话了。');
    await S.say('你', '既然你的三个愿望都许过了，它对你也没什么用了。那你还留着它干什么？');
    await S.say('莫里斯', ['一时糊涂吧。', '我也想过把它卖掉。可我又不想再让它去害人——它已经害得够多了。', '再说，也没人肯买。有人当它是个童话；就算有那么一两个信的，也要先试试灵不灵，再谈价钱。']);
    await S.say('你', '要是你还能再许三个，你还会许吗？');
    await S.say('莫里斯', '……我不知道。我不知道。');
    await S.narr('他捏着那只爪子，在指间晃了晃——');
    S.show('fpaw'); S.sfx('sting'); S.shake(300, 2); S.bubble('herb', '!', 1200); S.bubble('wife', '!', 1200);
    await S.narr('突然，把它扔进了炉火里！');
    S.f.act = 'fire';
    S.goal('快！用火钳把它从火里夹出来！');
    S.timer(12, '火', S2 => pawRescued(S2, 'hand'));
  }
})();
