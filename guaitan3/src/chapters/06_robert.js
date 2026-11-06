/* ================= 第六夜 · 罗伯特娃娃 ================= */
(() => {
  /* ---------------- 常量 ---------------- */
  const W_ = '#f2efe6', NAVY = '#2a3450', RED = '#a83030', CLOTH = '#d6c6a4', HAIR = '#4a3426', KK = '#050505', LION = '#d8a040', MANE = '#a86a20';
  /* 闸刀从左到右：修复间｜总闸｜展厅｜走廊；正确顺序：总闸 → 展厅（最远）→ 走廊 → 修复间（最近） */
  const LVNAME = ['修复间', '总闸', '展厅', '走廊'], ORDER = [1, 2, 3, 0];
  const STARE = 2.6;                  // 盯着他超过这么多秒就算失礼
  let stareT = 0, lurchT = 0, lastTile = '', deaths = 0, robHold = false, lookAway = 0, ringT = 0, nearT = 0, trail = [], seenT = 0;

  /* ---------------- 通用 ---------------- */
  function goalText(S) {
    const f = S.f;
    if (!f.readList) return '看看值班桌上的夜班清单';
    if (f.phase === 'dark') return '按标签上的顺序合上电闸（背对他，他会走；盯太久，他会生气）';
    if (!f.mailGot) return '把值班桌上邮件筐里今天的信带去展厅';
    if (!f.mailRead) return '去展厅：先跟罗伯特打招呼，再把今天的信读给他听';
    if (!f.photoDone) {
      if (S.has('lion')) return '回展厅，把小狮子放回罗伯特怀里';
      if (!f.lionBack && f.lionKnown) return '去炮台走廊尽头的修复间，把小狮子取回来';
      if (!f.lionBack && f.noCnt > 0) return '他不愿意拍照——找找原因（仔细看看他，读读墙上的信）';
      return '给罗伯特拍状况照：先打招呼，再问他，等他回答';
    }
    if (!f.archived) return '回值班室，把状况照存进电脑';
    if (!f.called) return '接电话';
    if (!f.posted) return S.has('stamp') ? '把信投进堡垒大门外的邮筒' : '去礼品店的明信片架拿一张邮票，再把信投进大门外的邮筒';
    return '回展厅，跟罗伯特说晚安';
  }
  function regoal(S) { S.goal(goalText(S)); }
  function setMood(S) { const c = S.ent('rcase'); if (c) c.s.mood = S.f.rude > 0 ? 1 : (S.f.lionBack ? 2 : 0); }
  function addRude(S) { S.f.rude = (S.f.rude || 0) + 1; setMood(S); }
  function knockTone(S, v = .07) { S.tone('triangle', 1700, 900, .05, v); S.tone('triangle', 1650, 880, .05, v, .16); }
  function stepTone(S, v) { S.tone('triangle', 1300, 760, .035, v); }
  /* 音乐盒：「划呀划呀划小船」（Row, Row, Row Your Boat，公有领域）开头两句 */
  const MB = [[523, 0], [523, .45], [523, .9], [587, 1.2], [659, 1.35], [659, 2.1], [587, 2.4], [659, 2.7], [698, 3.0], [784, 3.3]];
  function musicBox(S, vol = .05, n = MB.length) { for (let i = 0; i < n; i++) { const [f0, d] = MB[i]; S.tone('sine', f0 * 2, f0 * 2, .55, vol, d * .9); S.tone('triangle', f0 * 4, f0 * 4, .12, vol * .35, d * .9); } }
  function ringTone(S) { for (let i = 0; i < 2; i++) { S.tone('sine', 440, 440, .8, .045, i * 1.0); S.tone('sine', 480, 480, .8, .045, i * 1.0); } }
  /* 玩家面朝 (wx,wy)（世界像素中心）且在 maxd 格以内 */
  function seesPx(S, wx, wy, maxd = 7) {
    const p = S.pl, v = DIRS[p.dir], dx = (wx - (p.px + 8)) / 16, dy = (wy - (p.py + 8)) / 16;
    const fw = dx * v[0] + dy * v[1], lat = Math.abs(dx * v[1] - dy * v[0]);
    return fw > .3 && lat <= fw + .5 && Math.abs(dx) + Math.abs(dy) <= maxd;
  }
  const seesEnt = (S, d, m) => seesPx(S, d.px + d.w * 8, d.py + 8, m);
  /* 停电时调查走廊里的东西只弹小提示，不开对话框（他在你读字的时候也会走） */
  const dk = (fn, t) => async S => S.f.phase === 'dark' ? S.toast(t || '（黑漆漆的，看不清。……先去合电闸！）') : fn(S);

  /* ---------------- 值班室 ---------------- */
  async function handover(S) {
    const f = S.f;
    S.focus(7, 4);
    await S.say('黛布', ['你就是林夏？艺术学院那个暑期生？\n……嗯，你那些游客速写我见过，画得不错。', '原来的夜班卡尔，上礼拜辞职了。手腕摔断了。', '别问我是怎么摔的。']);
    await S.think('（……）');
    await S.say('黛布', ['夜班不难。清单在桌上：读信、拍照、巡一圈，天亮交班。', '就一件事。', '他。罗伯特。', '进他的屋，先打招呼。要给他拍照，先问他。走的时候，说声晚安。', '我没开玩笑。墙上那几百封信，都是没把这当回事的人寄回来的。']);
    const r = await S.ask('黛布从老花镜上方看着你。', ['「好，我记住了。」', '「……对着一个娃娃说晚安？」']);
    if (r === 1) await S.say('黛布', '他不喜欢别人叫他娃娃。\n……你最好也别。');
    else await S.say('黛布', '好孩子。');
    S.give('keys', true); S.give('camera', true); S.give('flash', true); S.sfx('item'); S.toast('获得：钥匙串、相机、手电');
    await S.say('黛布', '钥匙、相机、手电。我走了。\n……祝你今晚安静。');
    S.focus(null);
    await S.walk('deb', [[7, 7], [7, 8]], 3.2);
    S.sfx('close'); S.hide('deb');
    await S.think(S.coop ? '（墙上的钟：十点整。整座炮台，只剩我们两个人。\n……还有他。）' : '（墙上的钟：十点整。整座炮台，只剩我一个人。\n……还有他。）');
    f.handover = true; regoal(S);
  }
  async function clipUse(S) {
    const f = S.f;
    await S.note('夜班清单（10月29日）', '□ 把今天的来信读给罗伯特听，钉到墙上\n　（信在桌上的邮件筐里）\n□ 零点前给罗伯特拍一张「状况照」，存进电脑\n　（保险公司每晚要一张）\n　　——先问他！！！（黛布）\n□ 巡视炮台走廊、修复间\n□ 早上 6:00 交班\n\n※ 门禁、警报：别碰。');
    if (!f.readList) { f.readList = true; await S.think('（「先问他」，三个感叹号。……好吧。）'); regoal(S); S.cp('tasks'); }
  }
  async function mailUse(S) {
    const f = S.f;
    if (!f.mailGot) {
      f.mailGot = true; S.give('mail'); S.ent('mailb').s.empty = true;
      await S.narr('铁丝邮件筐里躺着三封信。信封上的收件人都一样：\n「罗伯特 收　东马泰洛堡博物馆」。');
      await S.think('（有一封的邮票是英国的。还有一封，是用蜡笔写的地址。）');
      return regoal(S);
    }
    await S.narr('空了的邮件筐。筐底粘着一张旧邮票，印着一只鹈鹕。');
  }
  async function phoneUse(S) {
    const f = S.f, ph = S.ent('dphone');
    if (f.ringing) return callScene(S);
    if (!f.vm) {
      f.vm = true; ph.s.msg = false;
      S.sfx('switch'); S.tone('sine', 1000, 1000, .35, .06);
      await S.narr('答录机上的红灯一闪一闪：一条新留言。21:41。\n你按下播放键。');
      await S.say('答录机', ['……喂？你好……是博物馆吗？我知道已经关门了。', '我叫宋晴，从上海来的。上礼拜，我来看过罗伯特。', '我没问他，就凑过去跟他自拍。还跟朋友说……「这娃娃也太丑了吧」。', '那以后，我的手机摔碎了，钱包丢了，行李也……', '我想写信给他道歉。可我不知道……怎么写才算数。', '……对不起，打扰了。'], { style: 'whisper' });
      S.tone('sine', 1000, 1000, .3, .05);
      return S.think('（……墙上那几百封信。又多一个。）');
    }
    if (f.called) return S.narr('电话。听筒还是温的。');
    await S.narr('黑色的老式电话，接着一台答录机。\n留言已经听过了。');
  }
  async function cctvUse(S) {
    const f = S.f, cv = S.ent('cctv');
    if (f.photoDone && !f.archived) return archive(S);
    if (f.archived) return S.narr('屏幕右下角，展厅那一格里，他抱着小狮子。\n电脑桌面上，是你刚存的那张照片。');
    await S.narr('值班桌上的电脑，旁边是监控屏幕，分成四格：大门、礼品店、炮台走廊、展厅。\n展厅那一格里，他坐在柜子里，脸正对着镜头。');
    if (S.once('cctvTurn')) {
      S.sfx('tick'); await S.wait(500);
      cv.s.turn = true;
      await S.narr('你低头翻了一下清单。再抬头——\n他的脸，转向了展厅的门口。');
      return S.think('（……画面延迟吧。肯定是。）');
    }
    if (f.rude > 0) await S.think('（画面上，他的嘴角好像往下撇着。……是信号不好。）');
  }
  async function archive(S) {
    const f = S.f;
    await S.narr('你把相机连上电脑，导出照片，命名为「罗伯特_状况_1029」。');
    await S.note('状况照 #1029', '（照片）\n他坐在藤椅上，抱着小狮子。水手帽有点歪，头微微偏向镜头。\n射灯照在两颗鞋扣眼睛上，亮晶晶的。\n\n状况：布面完好，无新增破损。\n备注：右鞋鞋底有灰尘（？）\n拍摄：林夏　23:56');
    f.archived = true; f.ringing = true; ringT = 0; S.ent('dphone').s.ring = true;
    ringTone(S);
    await S.narr('……电话响了。\n凌晨一点十分。');
    regoal(S); S.cp('call');
  }
  async function callScene(S) {
    const f = S.f;
    f.ringing = false; S.ent('dphone').s.ring = false; S.sfx('switch');
    const intro = f.vm ? ['喂？……啊，有人接！太好了。', '我是宋晴。傍晚给你们留过言的。'] : ['喂？……啊，有人接！太好了。', '我叫宋晴，从上海来的。上礼拜，我来看过罗伯特。', '我没问他，就凑过去跟他自拍，还跟朋友说「这娃娃也太丑了吧」。\n那以后，手机摔了，钱包丢了，行李也丢了……'];
    f.vm = true; S.ent('dphone').s.msg = false;
    await S.say('宋晴', intro);
    await S.say('宋晴', ['我在医院。去机场的路上，在酒店楼梯上踩空了，脚踝骨裂，右手也扭了。航班改到了后天。', '你可能觉得我疯了。', '我想今晚就把信寄出去，可我写不了字。', '你能……替我写吗？我说，你写。写好了帮我寄给他。', '听说一定要贴上邮票、正经寄到博物馆，他才收。']);
    let r = await S.ask('电话那头，她在等你回答。', ['「好。你说，我写。」', '「……抱歉，这种事我帮不了你。」']);
    if (r === 1) {
      r = await S.ask('她不说话了。听筒里只有医院走廊的广播声。', ['「……算了。你说吧，我写。」', '「对不起。」（挂上电话）']);
      if (r === 1) return endUnsent(S);
    }
    f.called = true;
    if (S.coop) S.toast('双人：一人去展厅念墙上的信，一人落笔');
    await S.narr('你抽出一张博物馆的信纸。宋晴在电话那头，一句一句地想。');
    await compose(S);
  }
  /* 写信：每一句按墙上那些信的规矩来；写错了划掉重写 */
  const LINES = [
    { q: '宋晴：「开头……怎么称呼他？」', o: ['亲爱的罗伯特：', '致那个娃娃：', '敬启者：'], a: 0,
      h: ['（墙上那几百封信，开头都叫他的名字。……他不喜欢别人叫他娃娃。）', '（老兵那封、全家福那封，开头都是「亲爱的罗伯特」。）', '（就写「亲爱的罗伯特：」。）'] },
    { q: '宋晴：「然后……要写我做错了什么吗？写出来好丢人。」', o: ['如果我有什么冒犯的地方，请你原谅。', '上礼拜，我没问你就给你拍了照，还笑你丑。', '我知道这些都是巧合，但还是写一封吧。'], a: 1,
      h: ['（墙上的信，每一封都把自己做错了什么写得清清楚楚。含含糊糊的，不算道歉。）', '（老兵写的是「没打招呼就直接按了快门」。她做错的是什么？）', '（照实写：上礼拜没问就拍了照，还笑他丑。）'] },
    { q: '宋晴：「那张照片……其实我还留着。怎么办？」', o: ['那张照片我已经删了，朋友圈也删了。', '那张照片拍得挺好，我会留作纪念。', '下次来，我一定给你拍张更好看的。'], a: 0,
      h: ['（没问就拍的照片，是从他那里拿走的东西。得还回去。）', '（「下次再拍」——他还没答应呢。「留作纪念」——那就是不还。）', '（删掉它。删了，再写进信里。）'] },
    { q: '宋晴：「最后……要不要写，请他别再缠着我了？」', o: ['请你别再缠着我了。', '你要是原谅我，就让我的脚快点好起来。', '对不起。祝你和小狮子晚安。——宋晴'], a: 2,
      h: ['（信是来道歉的，不是来讲条件的。）', '（那封全家福的信，结尾是怎么写的？）', '（「对不起。祝你和小狮子晚安。」——就这么写。）'] }
  ];
  async function compose(S) {
    const f = S.f, out = []; f.crossed = 0;
    for (let i = 0; i < LINES.length; i++) {
      const L = LINES[i]; let miss = 0;
      for (;;) {
        const r = await S.ask(L.q, L.o.map(t => '写：「' + t + '」'));
        if (r === L.a) { out.push(L.o[r]); break; }
        f.crossed++; S.sfx('tear'); out.push('　（划掉：' + L.o[r] + '）');
        await S.narr('你写到一半，停住了笔。……把这一行划掉了。');
        await S.think(L.h[Math.min(miss, 2)]); miss++;
      }
      if (i === 2) await S.say('宋晴', '……等一下。\n……删了。真的删了。朋友圈也删了。');
    }
    await S.note('宋晴的信（你的字迹）', out.join('\n\n') + '\n\n　　　　　　　　（林夏代笔　10月30日凌晨）');
    await S.narr('你把信从头念了一遍。电话那头，宋晴很久没有说话。\n然后她小声说：「……就这样。谢谢你。」');
    await S.narr('你把信折好，装进博物馆的信封，在封面上写：\n「罗伯特 收　东马泰洛堡博物馆　佛罗里达州 基韦斯特」');
    S.give('letter');
    await S.think(f.crossed ? `（信纸上划掉了${f.crossed}行。……他应该看得出来，她是认真想过的。）` : '（一行都没划。……写得比我自己的信还认真。）');
    regoal(S); S.cp('letter');
  }
  async function rackUse(S) {
    const f = S.f;
    if (f.called && S.has('letter') && !S.has('stamp') && !f.posted) {
      S.give('stamp');
      await S.narr('明信片架最下面一格，是一本邮票。你撕下一张，贴在信封右上角。');
      await S.narr('你在收银机旁边留下一块钱硬币，和一张便利贴：\n「夜班 林夏　邮票一张」。');
      return regoal(S);
    }
    await S.narr('旋转明信片架。日落码头、海明威故居的六趾猫、天蓝色的平房……\n最显眼的一格，全是罗伯特。印着「拍照前请先问他」。');
  }

  /* ---------------- 展厅：打招呼 / 说再见 ---------------- */
  async function forgotGreet(S) {
    const f = S.f;
    if (!f.needGreet || f.fgVisit) return;
    f.fgVisit = true;
    if (!f.fgWarned) {
      f.fgWarned = true; S.sfx('tick');
      return S.think('（……后颈有点凉。好像有谁在等你开口。）\n（黛布说过：进他的屋，先打招呼。）');
    }
    addRude(S); knockTone(S, .05);
    await S.narr('柜子那边，玻璃「叩」地响了一下。\n……你又忘了跟他打招呼。');
  }
  const hg = fn => async S => { if (S.f.needGreet && !S.f.fgVisit) await forgotGreet(S); return fn(S); };
  async function greet(S) {
    const f = S.f;
    const r = await S.ask('他坐在玻璃柜里，黑纽扣眼睛对着你。', ['「晚上好，罗伯特。」', '「嗨，小娃娃。」', '（什么也不说，先看看）']);
    if (r === 2) { await S.narr('你只是看着他。\n他也看着你。'); return false; }
    f.needGreet = false; f.greeted = true;
    if (r === 0) {
      await S.say('林夏', f.posted ? '罗伯特，我回来了。' : '晚上好，罗伯特。');
      S.tone('sine', 1046, 1046, .5, .022, .2); S.tone('sine', 1318, 1318, .6, .02, .55);   // 柜子里极轻的两个音乐盒音
      if (S.once('greet1')) await S.think('（……对着一个娃娃打招呼。说出口了，倒也没那么奇怪。）');
      return true;
    }
    await S.say('林夏', '嗨，小娃娃。');
    addRude(S); const c = S.ent('rcase'); c.s.flk = true; S.sfx('switch'); await S.wait(260); c.s.flk = false;
    await S.narr('柜顶的射灯「嗞」地闪了一下。');
    await S.think('（……黛布说过，他不喜欢别人叫他娃娃。）');
    return true;
  }
  async function farewell(S) {
    const f = S.f;
    if (f.needGreet || f.byeVisit) return;
    f.byeVisit = true;
    if ((f.byeN || 0) >= 2) { f.byeN++; return S.toast('（你已经习惯了：回头说一声「一会儿见，罗伯特」）'); }
    const r = await S.ask('（要离开展厅了。）', ['回头：「我一会儿就回来，罗伯特。」', '（直接走）']);
    if (r === 0) { f.byeN = (f.byeN || 0) + 1; return S.say('林夏', '我一会儿就回来，罗伯特。'); }
    addRude(S); knockTone(S, .05);
    await S.narr('身后，玻璃「叩」地响了一下。');
    if (S.once('byeMiss')) await S.think('（……黛布说过，走的时候要说一声。）');
  }

  /* ---------------- 展厅：玻璃柜 ---------------- */
  async function caseUse(S) {
    const f = S.f;
    if (f.needGreet && !(await greet(S))) return;
    const opts = [], acts = [];
    if (S.has('mail') && !f.mailRead) { opts.push('把今天的信读给他听'); acts.push(readMail); }
    if (S.has('lion')) { opts.push('把小狮子放回他怀里'); acts.push(returnLion); }
    if (f.readList && !f.photoDone) { opts.push('给他拍状况照'); acts.push(photoSession); }
    if (f.posted) { opts.push('「晚安，罗伯特。」'); acts.push(goodnight); }
    opts.push('仔细看看他'); acts.push(lookAt);
    opts.push('敲敲玻璃'); acts.push(knock);
    opts.push('走开'); acts.push(null);
    const r = await S.ask(f.lionBack ? '他抱着小狮子，坐在藤椅上。' : '他坐在藤椅上，两只手在胸前虚虚地拢着。', opts);
    if (acts[r]) await acts[r](S);
  }
  async function lookAt(S) {
    const f = S.f, c = S.ent('rcase');
    await S.narr('一个旧布娃娃，差不多一米高。白色水手服洗得发黄，水手帽歪着。\n布做的脸上，画的五官褪了色，裂着细纹。眼睛是两颗黑色的鞋扣。');
    if (f.lionBack) await S.narr('他抱着那只小狮子。\n……说不上来为什么，他看起来比刚才高兴。');
    else if (f.noCnt > 0) { c.s.card = true; f.lionKnown = true; await S.narr('他怀里是空的。柜子角落立着一张手写小卡片：\n「小狮子送修中，暂存修复间（炮台走廊尽头）。——M」'); regoal(S); }
    else await S.narr('他两只手在胸前虚虚地拢着，像是本来抱着什么东西。\n……怀里是空的。');
    if (c.s.dust) await S.narr('他小皮鞋的鞋底，沾着一层灰。\n和炮台走廊地上的灰，一个颜色。');
    if (f.rude > 0) await S.think('（他的嘴角……比刚进门的时候，往下撇了一点。）');
  }
  async function knock(S) {
    const f = S.f, c = S.ent('rcase');
    knockTone(S); addRude(S);
    c.s.flk = true; await S.wait(300); c.s.flk = false;
    await S.narr('「叩、叩。」\n玻璃很凉。……柜顶的射灯闪了一下。');
    if (S.once('knock1')) await S.think('（墙上那封全家福的信——那个孩子，也敲了他的玻璃。）');
  }
  async function readMail(S) {
    const f = S.f;
    await S.narr('你拆开今天的三封信，一封一封念给他听。');
    await S.note('今天的来信（三封）', '①「罗伯特你好！我叫诺亚，7岁。我画了你的狮子。妈妈说你会喜欢。」\n　（附一张蜡笔画：一只黄色的、咧着嘴笑的狮子）\n\n②「亲爱的罗伯特：我们从伦敦来，那天在你面前开了些不太礼貌的玩笑。回家以后，我丈夫的护照丢了。我们郑重道歉。」\n\n③「罗伯特：上个月我给你拍了照。我问过你了，你歪了歪头。照片很好看。谢谢你。——一个护士」');
    f.mailRead = true; S.take('mail'); S.ent('lw6').s.more = true; S.ent('lw11').s.more = true;
    await S.narr('念完，你把三封信钉在墙上空着的地方。\n空地方已经不太好找了。');
    if (f.rude === 0) await S.think('（念到那张狮子蜡笔画的时候，他好像……往前倾了一点。）');
    regoal(S); S.cp('mail');
  }
  async function returnLion(S) {
    const f = S.f, c = S.ent('rcase');
    S.sfx('open');
    await S.narr('你用钥匙打开柜门。一股旧布料和樟脑丸的味道。\n他的手硬邦邦的，冰凉。你把小狮子塞进他臂弯里。');
    S.take('lion'); f.lionBack = true; c.s.lion = true; c.s.card = false; setMood(S);
    S.sfx('close'); musicBox(S, .03, 5);
    await S.narr('柜门「咔哒」锁上的时候，你好像听见了一小段音乐盒的声音。\n很短。像谁在哼歌。');
    regoal(S); S.cp('lion');
    if (!f.photoDone && f.readList && (await S.ask('要现在给他拍状况照吗？', ['拿出相机', '等一下'])) === 0) await photoSession(S);
  }
  async function consentSign(S) {
    const f = S.f, c = S.ent('rcase');
    await S.narr('你屏住呼吸，看着他。');
    await S.wait(700);
    if (f.mailRead && f.lionBack) {
      c.s.tilt = true; S.sfx('tick');
      await S.narr('……他的头，往你这边歪了一点点。\n很轻。像是点了点头。');
      S.tone('square', 2400, 2400, .05, .03); S.tone('square', 2400, 2400, .05, .03, .13);
      await S.narr('相机「嘀嘀」两声，对上了焦。');
      return 'yes';
    }
    c.s.flk = true; S.sfx('switch');
    for (let i = 0; i < 3; i++) S.tone('square', 1500, 1300, .14, .03, i * .32);
    await S.wait(380); c.s.flk = false;
    await S.narr('柜顶的射灯「嗞」地闪了一下。\n镜头来回伸缩，「嘀——嘀——嘀——」，怎么也对不上焦。');
    f.noCnt = (f.noCnt || 0) + 1;
    await noHint(S);
    return 'no';
  }
  async function noHint(S) {
    const f = S.f, c = S.ent('rcase'), n = f.noCnt;
    await S.think('（这是「不」。……那封粉色信纸的信里写过。）');
    if (!f.mailRead) await S.think('（清单上的第一件事还没做——今天的信，还没读给他听。）');
    else if (S.has('lion')) await S.think('（小狮子还在你手里。……先把它还给他。）');
    else if (!f.lionBack) {
      if (n <= 1) await S.think('（为什么？……他两只手虚虚地拢在胸前，怀里是空的。\n墙上那封全家福的信里，他一直抱着一只小狮子。）');
      else { c.s.card = true; f.lionKnown = true; await S.narr('你这才注意到，柜子角落立着一张手写小卡片：\n「小狮子送修中，暂存修复间（炮台走廊尽头）。——M」'); }
      if (n >= 3) await S.think('（去走廊尽头的修复间，把小狮子拿回来。）');
    }
    regoal(S);
  }
  async function photoSession(S) {
    const st = { asked: false, waited: false, ans: null };
    S.cp('photoTry');   // 拍坏了，从柜子前重来
    if (S.coop && S.once('coopPhoto')) S.toast('双人：一人去翻墙上的信、念规矩，一人在柜子前操作');
    await S.narr('你打开相机，对准玻璃柜。');
    for (;;) {
      const q = st.ans === 'no' ? '取景框里一片模糊。' : st.ans === 'yes' ? '取景框里，他的头微微歪向你。' : '取景框里，是他的脸。';
      const r = await S.ask(q, ['问他：「罗伯特，我可以给你拍张照吗？」', '看着他，等一等', '按下快门', '放下相机']);
      if (r === 0) {
        if (st.asked) { await S.narr('你已经问过了。'); continue; }
        st.asked = true; await S.say('林夏', '罗伯特，我可以给你拍张照吗？'); continue;
      }
      if (r === 1) {
        if (!st.asked) { await S.narr('他看着你。你看着他。\n……你好像还什么都没问。'); continue; }
        if (st.waited) { await S.narr(st.ans === 'yes' ? '他的头还歪着，像在等你按快门。' : '镜头还在来回伸缩。他没有改主意。'); continue; }
        st.waited = true; st.ans = await consentSign(S); continue;
      }
      if (r === 2) {
        if (st.ans === 'yes') return shoot(S);
        const c2 = await S.ask(!st.asked ? '你把手指搭在快门上。他的黑纽扣眼睛，正对着镜头。' : !st.waited ? '你把手指搭在快门上。……他还没回答你。' : '取景框里一片模糊。……硬拍吗？', ['按下去', '算了，先放下']);
        if (c2 === 1) continue;
        if (st.ans === 'no') return endRefused(S);
        return endNoAsk(S, st.asked);
      }
      return;
    }
  }
  function shutter(S) { S.tone('square', 3000, 400, .04, .08); S.tone('triangle', 220, 120, .06, .08, .05); S.fx('flash', { dur: .35 }); }
  async function shoot(S) {
    const f = S.f, c = S.ent('rcase');
    shutter(S); await S.wait(400);
    await S.narr('咔嚓。');
    f.photoDone = true; c.s.tilt = false;
    const r = await S.ask('照片存进了相机。他的头，又慢慢摆正了。', ['「谢谢你，罗伯特。」', '（收起相机）']);
    if (r === 0) await S.say('林夏', '谢谢你，罗伯特。');
    else { addRude(S); await S.think('（……粉色信纸那封信里说过，拍完要说谢谢。）'); }
    regoal(S); S.cp('photo');
  }
  async function goodnight(S) {
    const f = S.f, c = S.ent('rcase');
    await S.say('林夏', '晚安，罗伯特。');
    c.s.tilt = true; musicBox(S, .04);
    await S.narr('你关掉展厅的灯。射灯最后亮着的那一秒，\n你看见他抱着小狮子，头微微歪着。');
    c.s.off = true; S.dark(.9);
    await S.fade(1, 1200);
    await S.card('早上 6:00', '', '天亮了。机场那边，第一班飞机从跑道上起飞，震得炮台的窗玻璃嗡嗡响。\n\n黛布推门进来，看了一眼监控，又看了一眼你。\n「……你跟他说晚安了？」\n「说了。」\n她点点头，什么也没问。');
    if (!f.rude) return S.end({ id: 'smile', title: '第六夜　完　·　他笑了', text: '黛布在电脑前站了很久。\n「你过来看。」\n\n是你昨晚拍的状况照。他抱着小狮子，头微微歪向镜头。嘴角……往上翘着。\n「这么多年，」黛布说，「我没见他笑过。」\n\n你把照片放大。柜子的玻璃上，映出拍照的人——你。\n还有你身后，一个高高瘦瘦、穿着沾满颜料的罩衫的男人。他低头看着柜子里的娃娃，像在看一个老朋友。\n\n存档的时候，你把文件名改成了：「罗伯特和他的画家」。\n\n三天后，宋晴的信寄到了。黛布把它钉在了全家福那封信的旁边。\n\n（隐藏结局：整晚没有失礼一次。）' });
    return S.end({ id: 'win', title: '第六夜　完', text: '三天后，一封贴着邮票的信寄到了博物馆。\n信封上写着：罗伯特 收。' + (f.crossed ? `信纸上有${f.crossed}行被划掉了，` : '信纸干干净净，') + '字迹是你的，落款是宋晴。\n黛布把它钉在了墙上，就在那封全家福的旁边。\n\n又过了一个礼拜，宋晴寄来一张明信片。她的脚好了，丢的行李也找到了。\n明信片背面只有一行字：\n「替我谢谢他。也谢谢你。」\n\n后来你又值了好几个夜班。每次进展厅，你都先说一声：「晚上好，罗伯特。」\n' + (f.rude ? '\n（这一晚，你失礼了' + f.rude + '次。他记得，但他原谅了你。）' : '') });
  }

  /* ---------------- 坏结局 ---------------- */
  async function endNoAsk(S, asked) {
    shutter(S); await S.wait(300);
    await S.scare('face', { face: 'robert', dur: 1 });
    return S.end({ id: 'noask', bad: true, title: asked ? '没等他回答' : '没问就拍了', text: '闪光灯亮起的那一瞬间，你看见他的黑纽扣眼睛，好像动了一下。\n\n第二天，相机的存储卡坏了。那张照片，是一片漆黑。\n第三天，你骑车下班，前轮卡进了排水沟。手腕打了石膏。\n第五天，你坐在床上，用左手，歪歪扭扭地写一封信。\n「亲爱的罗伯特：对不起……」\n\n' + (asked ? '（你问了，可你没等他回答。问完要看着他，等一等。）' : '（规矩：先打招呼，再问他，然后——等他回答。）') });
  }
  async function endRefused(S) {
    shutter(S); await S.wait(300);
    const c = S.ent('rcase'); c.s.flk = true;
    await S.scare('face', { face: 'robert', dur: 1 });
    return S.end({ id: 'refused', bad: true, title: '他说了「不」', text: '取景框里一片模糊。你还是按下了快门。\n\n照片导进电脑：柜子里是空的。只有一把小小的藤椅。\n你抬头看监控。屏幕上，他好好地坐在柜子里，脸正对着镜头。\n\n那天以后，你再也没有值过夜班。\n你的相机，每次开机都对不上焦。\n\n（相机对不上焦、射灯闪一下，就是「不」。先弄清楚他为什么不愿意。）' });
  }
  async function endUnsent(S) {
    S.sfx('switch'); S.tone('sine', 480, 480, .5, .04); S.tone('sine', 620, 620, .5, .04);
    await S.narr('听筒里传来忙音。嘟——嘟——嘟——');
    return S.end({ id: 'unsent', bad: true, title: '没有寄出的信', text: '天亮交班的时候，你没跟黛布提这通电话。\n\n后来，墙上又多了几十封信。你一封一封地找过，没有一封署名「宋晴」。\n\n有时候值夜班，你会想起她。不知道她的脚好了没有，行李找到了没有。\n每次你去展厅打招呼，他都背对着门口坐着。\n\n（宋晴想说的话，总得有人替她寄出去。）' });
  }

  /* ---------------- 修复间：小狮子与停电 ---------------- */
  function blackout(S) {
    S.dark(.96, 'corridor'); S.plr(2.2); S.amb('none');
    for (const id of ['sc1', 'sc2', 'sc3', 'wlamp']) S.ent(id).s.off = true;
    for (let i = 0; i < 4; i++) { const l = S.ent('lv' + i); l.s.up = false; l.s.half = false; }
    S.f.lvN = 0; S.ent('rcase').s.empty = true; S.ent('rcase').s.off = true;
  }
  function chaseOpts(S, retry) {
    const t = S.f.darkTone ?? 1;
    return { spd: [2.65, 2.8, 3.1][t] - Math.min(.3, deaths * .1), catch: robCatch, always: true, wait: retry ? 1.6 : [1.3, .9, .5][t] };
  }
  function startDark(S, retry) {
    blackout(S);
    S.place('robW', 12, 5); S.face('robW', 'pl');
    stareT = 0; lurchT = 0; robHold = false; lastTile = ''; trail = []; nearT = 0; seenT = 0;
    S.chase('robW', chaseOpts(S, retry));
  }
  /* 被手电照住过的他，你一移开视线，就退回暗处（离你 7 格以外的门口附近） */
  const BACK = [[13, 4], [13, 5], [14, 3], [12, 4], [15, 6], [11, 5], [14, 5], [16, 4], [16, 5], [12, 3]];
  function retreat(S) {
    const p = S.pl, ds = q => Math.abs(q[0] - p.x) + Math.abs(q[1] - p.y), m = curMap();
    let c = BACK.filter(q => ds(q) >= 7 && passable(m, q[0], q[1], S.ent('robW')));
    if (!c.length) c = BACK.slice().sort((a, b) => ds(b) - ds(a)).slice(0, 2);
    const q = c[S.rand(c.length)];
    S.stop('robW'); S.place('robW', q[0], q[1]); S.face('robW', 'pl'); S.chase('robW', Object.assign(chaseOpts(S), { wait: .25 }));
    lastTile = q[0] + ',' + q[1]; trail = [];
    if (!S.f.toldBack) { S.f.toldBack = true; S.toast('……他退回暗处去了。被你看见，他就不敢往前走'); }
  }
  async function wbenchUse(S) {
    const f = S.f;
    if (f.lionGot && f.phase === 'dark') return S.toast('（小狮子在你怀里。……电闸！）');
    if (f.lionGot) return S.narr('工作台上铺着白布。镊子、针线、一盏放大镜台灯。\n白布上有一个小狮子形状的凹印。');
    await S.narr('工作台上铺着一块白布。\n小狮子躺在上面，肚子上新缝了几针，鬃毛梳得整整齐齐。旁边压着一张字条：「修好了。——M」');
    S.ent('wbench').s.lion = false; S.give('lion'); f.lionGot = true;
    await S.think('（……走吧，带你回家。）');
    S.sfx('thud'); S.shake(400, 2); blackout(S);
    await S.narr('「啪」。\n所有的灯同时灭了。');
    await S.think('（跳闸了？……手电，手电。）');
    for (let i = 0; i < 6; i++) stepTone(S, .02 + i * .006);
    await S.wait(900);
    await S.narr('走廊那头传来「嗒、嗒、嗒」的声音。\n很轻，很小。像小孩子的硬底皮鞋，踩在砖地上。');
    S.place('robW', 12, 5); S.face('robW', 'pl'); S.focus(12, 5); S.sfx('sting'); musicBox(S, .03, 5);
    await S.narr('手电光圈的边上，站着一个小小的白色身影。\n水手帽。两只手在胸前虚虚地拢着。……怀里是空的。');
    S.focus(null);
    const r = await S.ask('他不动。黑纽扣眼睛，对着你怀里的小狮子。', ['「罗伯特……对不起，吓到你了。我修好电闸，就把它还给你。」', '（不理他，转身去找电闸）', '「别过来！」']);
    f.darkTone = r;
    if (r === 0) await S.narr('他站着没动。\n……好像在听。');
    else if (r === 1) await S.narr('你转过身。\n身后，「嗒」。');
    else { addRude(S); await S.narr('你的声音在拱顶里撞来撞去。\n他歪了歪头。射灯早就灭了，可他的鞋扣眼睛，亮了一下。'); }
    await S.think('（规矩……背对他，他就会走过来。\n可是一直盯着人看——也很没礼貌。）');
    if (S.coop) S.toast('双人：另一位帮忙盯着身后，点屏幕标出他的位置');
    f.phase = 'dark'; regoal(S); S.cp('dark');
    startDark(S, false);
  }
  async function robCatch(S) {
    deaths++;
    S.stop('robW'); S.sfx('giggle'); S.tone('sine', 1046, 523, .6, .05);
    await S.scare('face', { face: 'robertA', dur: 1 });
    return S.die('一只小小的、硬邦邦的布手，拽住了你的衣角。\n手电掉在地上，滚了两圈。\n\n（背对他，他就会走过来。\n合一下闸刀，回头看他一眼——但别盯太久——再回去合下一下。）', '他追上你了');
  }
  function trip(S) {
    const f = S.f;
    for (let i = 0; i < 4; i++) { const l = S.ent('lv' + i); l.s.up = false; l.s.half = false; }
    f.lvN = 0; f.wrongLv = (f.wrongLv || 0) + 1;
    S.fx('flash', { dur: .25 }); S.sfx('glass'); S.shake(300, 2); S.tone('sawtooth', 160, 40, .35, .07);
    const H = ['「啪」——又跳了！所有闸刀弹回原位。（标签：先合总闸，再从最远的一路往回合）', '又跳了！（离这只箱子最远的一路……是展厅。）', '又跳了！（顺序：总闸 → 展厅 → 走廊 → 修复间）'];
    S.toast(H[Math.min(f.wrongLv - 1, 2)]);
  }
  async function powerOn(S) {
    const f = S.f, d = S.ent('robW');
    const lx = Math.round(d.px / 16), ly = Math.round(d.py / 16);
    S.stop('robW'); S.hide('robW');
    f.phase = 'lit'; deaths = 0;
    S.dark(null, 'corridor'); S.plr(null); S.amb('room');
    for (const id of ['sc1', 'sc2', 'sc3', 'wlamp']) S.ent(id).s.off = false;
    const c = S.ent('rcase'); c.s.empty = false; c.s.off = false; c.s.dust = true; c.s.pose = 1;
    S.tone('sawtooth', 60, 60, 1.4, .03); S.sfx('switch');
    const tr = trail.length ? trail : [[lx, ly]];
    for (let i = 0; i < 6; i++) { const q = tr[tr.length - 1 - i]; if (q) { S.place('fp' + i, q[0], q[1]); S.ent('fp' + i).dir = (i % 2) * 3; } else S.hide('fp' + i); }
    await S.narr('最后一根闸刀「咔哒」合上。\n铁皮箱里「嗡」地一声，日光灯一根接一根亮了起来。');
    await S.narr('身后什么都没有。\n只有地上那层灰里，留着一串小小的鞋印——一直走到离你不远的地方，停住了。');
    await S.think('（……他回去了？）');
    regoal(S); S.cp('lit');
  }
  function leverUse(i) {
    return async S => {
      const f = S.f, l = S.ent('lv' + i);
      if (f.phase !== 'dark') return S.narr(l.s.up ? `「${LVNAME[i]}」的闸刀合着。铁皮箱里嗡嗡地响。` : `「${LVNAME[i]}」的闸刀。`);
      if (l.s.up) return S.toast(`「${LVNAME[i]}」已经合上了`);
      if (!f.readLabel && S.once('lvHint')) S.toast('（闸刀旁边贴着一张标签——上面写着顺序）');
      S.sfx('switch'); S.tone('square', 90, 60, .12, .07);
      if (!l.s.half) { l.s.half = true; S.toast(`「${LVNAME[i]}」锈住了——再推一下`); await S.wait(170); return; }
      l.s.half = false; l.s.up = true; await S.wait(120);
      if (i !== ORDER[f.lvN || 0]) return trip(S);
      f.lvN = (f.lvN || 0) + 1;
      if (f.lvN >= 4) return powerOn(S);
      S.toast(`「${LVNAME[i]}」合上了（${f.lvN}/4）`);
    };
  }
  async function labelUse(S) {
    const f = S.f; f.readLabel = true;
    robHold = true;   // 读标签的时候，时间仿佛停住了
    try {
      await S.note('配电箱上的标签', '配电箱（1962年装）\n\n闸刀从左到右：\n修复间｜总闸｜展厅｜走廊\n\n跳闸以后：\n一、先合总闸。\n二、分闸从离这只箱子最远的那一路开始，\n　　一路一路往回合。\n※线路老了，顺序错了会再跳。\n\n——维修 H.（后半张被机油糊住了）');
    } finally { robHold = false; }
  }

  /* ---------------- 院子：邮筒 ---------------- */
  async function mailboxUse(S) {
    const f = S.f;
    if (f.posted) return S.narr('邮筒。最早一次收信：早上 8:30。\n宋晴的信就躺在里面。');
    if (!S.has('letter')) return S.narr('蓝色的邮筒，漆皮被海风吹得起了泡。\n「最早一次收信：早上 8:30」。');
    if (!S.has('stamp')) return S.narr('……还没贴邮票。\n宋晴说过，一定要贴上邮票、正经寄到博物馆，他才收。（礼品店的明信片架上有邮票。）');
    S.take('letter'); S.take('stamp'); f.posted = true; S.sfx('thud');
    await S.narr('你拉开投信口，把信塞了进去。\n「咚」。信落到了邮筒底。');
    await S.think('（三天以后，它会绕一圈，回到这座炮台。\n回到他的墙上。）');
    const g = S.ent('gunR');
    S.focus(15, 2); await S.wait(500);
    g.s.face = true; musicBox(S, .035, 5);
    await S.narr('你回头看了一眼堡垒。\n墙上的炮眼黑漆漆的。其中一个里面，有一个小小的、白色的影子。\n水手帽。');
    await S.wait(500);
    g.s.tilt = true; await S.wait(700);
    await S.narr('它歪了歪头。\n然后，不见了。');
    g.s.face = false; g.s.tilt = false; S.focus(null);
    await S.think('（那后面……是展厅。）');
    regoal(S); S.cp('posted');
  }

  /* ---------------- 展厅墙上的零散信件 ---------------- */
  const SNIPS = [
    '「亲爱的罗伯特：对不起，我女儿说你眨了眼睛，我说她瞎说。回家以后她发烧了三天。」', '「罗伯特：我不该说你是查基的原型。（虽然网上都这么说。）」',
    '「Robert, I am so sorry. ——来自加拿大」（底下画着一片枫叶，和一个哭脸。）', '「对不起，我拍完照没说谢谢。我的车钥匙找了一个礼拜。」',
    '一张褪了色的宝丽来：一个男人站在柜子前比着大拇指。背面写着：「对不起。别再让我抽到罚单了。」', '「罗伯特：我们结婚了！谢谢你那天歪了歪头答应我们拍合照。」',
    '「我从小就怕你。现在我四十岁了，还是怕。对不起。」', '一封德文信。看不懂。最后一行写着 Entschuldigung，后面跟着三个感叹号。'
  ];
  const snip = k => hg(async S => S.narr('墙上贴满了信，一层压着一层。你抽出一封：\n' + SNIPS[k]));

  defChapter({
    id: 'robert', n: 6, title: '罗伯特娃娃', sub: '一个穿水手服的旧娃娃，住在博物馆的玻璃柜里。给他拍照之前，记得先问他。', origin: '美国佛罗里达州基韦斯特', color: '#2c3448',
    endings: { win: '第六夜　完', smile: '他笑了（隐藏）', noask: '没问就拍了', refused: '他说了「不」', unsent: '没有寄出的信' },
    icon: '@robertL', amb: 'room', floor: 'stone', wall: 'brick', dark: .45, plr: 3.2,
    people: {
      me: { skin: '#f0c8a0', hair: '#1a1414', hs: 'bun', top: '#2a3a5a', top2: '#d8d4c8', bottom: '#6a5a44', shoes: '#3a3030' },
      deb: { key: 'rb-deb', skin: '#ecc6a8', hair: '#b8b4ac', hs: 'bob', top: '#6a5a7a', top2: '#e0dccc', bottom: '#3a3a44', shoes: '#2a2020', coat: true,
        extra(g, d, fr, G, R) { if (d === 0) { R(5, G.hT + 4, 3, 1, '#222'); R(8, G.hT + 4, 3, 1, '#222'); } else if (d === 1) R(4, G.hT + 4, 3, 1, '#222'); } },
      robert: { key: 'rb-doll', child: true, skin: CLOTH, hair: HAIR, hs: 'short', top: W_, top2: NAVY, bottom: W_, shoes: '#2a1a14', eye: KK, mouth: '#7a3030',
        extra(g, d, fr, G, R) { sailor(R, d, G, false); } },
      robertL: { key: 'rb-dollL', child: true, skin: CLOTH, hair: HAIR, hs: 'short', top: W_, top2: NAVY, bottom: W_, shoes: '#2a1a14', eye: KK, mouth: '#7a3030',
        extra(g, d, fr, G, R) { sailor(R, d, G, true); } }
    },
    faces: {
      /* 罗伯特：歪着的水手帽、裂纹布脸、两颗反光的鞋扣眼睛、慢慢翘起来的嘴角、怀里的小狮子 */
      robert(R, a, t) { robFace(R, a, t, false); },
      /* 停电时的罗伯特：怀里空着，鞋扣眼睛里一点红光，嘴裂开 */
      robertA(R, a, t) { robFace(R, a, t, true); }
    },
    items: {
      keys: { name: '钥匙串', desc: '黛布的钥匙串，沉甸甸的。有一把小铜钥匙，标签上写着「R」。' },
      camera: { name: '相机', desc: '博物馆的旧数码相机，专门用来拍「状况照」。镜头盖上贴着一张便利贴：「先问他」。' },
      flash: { name: '手电', desc: '黄色的塑料手电，电池不太足。' },
      mail: { name: '今天的信', desc: '三封寄给罗伯特的信。按规矩，要先读给他听，再钉到墙上。' },
      lion: { name: '小狮子', desc: '一只旧旧的玩具小狮子，鬃毛刚梳过，肚子上新缝了几针。是罗伯特的。' },
      letter: { name: '宋晴的信', desc: '你替宋晴写的道歉信，装在博物馆的信封里。收件人：罗伯特。' },
      stamp: { name: '邮票', desc: '一张贴在信封上的邮票。' }
    },
    notes: {
      l1: { title: '墙上的信 ①（2003年，打字机打的）', text: '亲爱的罗伯特：\n\n我是那个穿迷彩夹克、对着你的脸直接按快门的老头子。没打招呼，也没问你。我以为这些都是编给游客听的故事。\n\n回家路上，我的卡车爆了两个胎。第二个礼拜，我从梯子上摔下来，手腕断了。\n\n我老婆说，进别人的屋要先打招呼，叫人家的名字。这是我妈从小教我的，我却忘了。\n\n对不起，罗伯特。下次我会先说「你好」，再问你。\n\n　　　　　　　　　　一个俄亥俄来的老兵' },
      l2: { title: '墙上的信 ②（2011年，粉色信纸）', text: '罗伯特：\n\n对不起对不起对不起！！\n我问了「能拍吗」，可我没等你回答就按了。照片洗出来，整张都是黑的。第二天我的手机掉进了马桶。\n\n后来博物馆的阿姨告诉我：问完要等。\n你愿意的时候，头会朝人这边歪一点点。\n你不愿意的时候，相机怎么也对不上焦，柜顶的灯会闪一下。\n\n还有，拍完要说谢谢。我也没说。\n这次我说：谢谢你，罗伯特。\n\n　　　　　　　　　　艾米（16岁）' },
      l3: { title: '墙上的信 ③（2016年，夹着一张全家福）', text: '亲爱的罗伯特先生：\n\n那天我儿子叫你「丑娃娃」，还用手指敲你的玻璃。我在旁边笑。回酒店的路上，租来的车在跨海大桥上抛了锚。\n\n儿子哭着说要给你写信。他画了你，还画了你怀里那只小狮子。他说，你一直抱着它，它一定是你最好的朋友。\n\n我们不该笑你，也不该敲你的玻璃。\n对不起。祝你和小狮子晚安。\n\n　　　　　　　　　　佐治亚州的一家人' },
      bio: { title: '展签：罗伯特（约1904年）', text: '德国制造的布偶，身高约一米，身穿水手服。\n\n二十世纪初，他来到基韦斯特伊顿街的一户人家，成了一个小男孩的玩具。男孩把他当成最好的朋友。闯了祸，就说：「是罗伯特干的！」\n\n男孩长大后成了画家，在巴黎学过画，娶了一位钢琴家。他一辈子没让罗伯特离开身边：娃娃有自己的房间，在顶楼的塔楼里。路过的孩子说，看见他在塔楼的窗户之间走来走去。\n\n画家去世二十年后，罗伯特被捐赠给本馆。\n\n※ 给罗伯特拍照前，请礼貌地征得他的同意。' }
    },
    legend: '罗伯特娃娃（Robert the Doll）是美国佛罗里达州基韦斯特最有名的「闹鬼」娃娃：约一米高，穿白色水手服，怀里抱着一只玩具狮子。一般的说法是，它是二十世纪初德国施泰夫（Steiff）公司的产品，约1904年来到基韦斯特伊顿街一户人家，成了一个男孩的玩具。男孩和娃娃同名，家里人便叫他的中间名「吉恩」；据说他闯了祸总说「是罗伯特干的」。男孩后来成了画家，在巴黎学画时结识了一位钢琴家，婚后回到基韦斯特的老宅，一直把娃娃留在身边。\n\n流传最广的故事都发生在那栋房子里：娃娃有自己的塔楼房间；路过的学生和邻居说看见它在窗户之间换位置；家人听见阁楼有小脚步声和笑声；还有人说它的表情会变。有一个版本把娃娃的「诅咒」归到家中一位来自巴哈马的女佣身上，说她懂巫术——这种说法没有任何依据，带着对加勒比移民及其信仰的偏见，一般认为是后人附会。画家1974年去世后，房子几经易手；1994年，娃娃被捐给基韦斯特的东马泰洛堡博物馆——一座南北战争时期的砖砌炮台，就在机场旁边。\n\n到了博物馆，罗伯特的传说多了一条「规矩」：给他拍照前要礼貌地问他，否则会倒霉（车坏、骨折、丢工作的故事都有）。他的展柜周围贴满了来自世界各地的道歉信，许多是寄到博物馆、请工作人员转交的。有人说他同意时会微微歪头，不同意时相机会出故障；也常有人说电影里的杀人娃娃「查基」受他启发——这些都是口耳相传，查无实据。\n\n游戏虚构：主角林夏、馆员黛布、修复师 M、游客宋晴，以及所有信件、留言和电话内容都是虚构的；「夜班状况照」「小狮子送修」「跳闸与合闸顺序」「盯着他太久他会生气」「信必须贴邮票寄来」等情节均为游戏设定。真实的博物馆有自己的开放时间与展品保管规定。',
    start: { map: 'office', x: 7, y: 6, dir: 3 },
    resume: {
      tasks: async S => regoal(S), mail: async S => regoal(S), photoTry: async S => regoal(S), lion: async S => regoal(S), photo: async S => regoal(S),
      letter: async S => regoal(S), posted: async S => regoal(S), lit: async S => regoal(S), call: async S => { ringT = 0; regoal(S); },
      dark: async S => {
        regoal(S); blackout(S);
        S.place('robW', 12, 5); S.face('robW', 'pl');
        if (deaths === 1) await S.think('（规矩：背对他，他就会走过来；盯着他太久，他会生气。\n合一下闸刀，回头看他一眼——别盯太久——再合下一下。）');
        else if (deaths >= 2) await S.think(S.f.readLabel ? '（标签上写着：先合总闸，再从离箱子最远的一路往回合。\n……总闸、展厅、走廊、修复间。）' : '（先读一读闸刀旁边的标签。读的时候，他好像也会停下来等你。）');
        startDark(S, true);
      }
    },
    async intro(S) {
      deaths = 0;
      await S.card('第六夜　罗伯特娃娃', '2019年10月29日　晚上 9:58　美国佛罗里达州 基韦斯特　东马泰洛堡博物馆', '一座南北战争时期的砖砌炮台，\n如今是一家小小的博物馆。\n\n最里面那间展厅，住着一个穿水手服的娃娃。\n他的墙上，贴满了寄给他的道歉信。');
    },
    tick(S, dt) {
      const f = S.f;
      /* 停电：背对他时他会走；盯得太久，他会生气 */
      if (f.phase === 'dark' && S.map === 'corridor') {
        const d = S.ent('robW');
        if (d && !d.hidden && d.chase) {
          if (robHold) { if (!S.isFrozen('robW')) { if (d.mv) { S.stop('robW'); S.chase('robW', Object.assign(chaseOpts(S), { wait: 0 })); } S.freeze('robW', true); } }
          else if (lurchT > 0) { lurchT -= dt; if (S.isFrozen('robW')) S.freeze('robW', false); }
          else {
            const look = seesEnt(S, d, 7);
            const dd = Math.abs(d.px - S.pl.px) / 16 + Math.abs(d.py - S.pl.py) / 16;
            if (look) seenT += dt;
            else { if (seenT >= .45 && dd <= 5.5) retreat(S); seenT = 0; }
            if (look) {
              if (!S.isFrozen('robW')) { if (d.mv) { S.stop('robW'); S.chase('robW', Object.assign(chaseOpts(S), { wait: 0 })); } S.freeze('robW', true); }
              stareT += dt;
              if (stareT > STARE && !S.busy) {
                stareT = 0; f.stareN = (f.stareN || 0) + 1; S.sfx('giggle');
                if (f.stareN === 1) S.toast('他歪了歪头……一直盯着人看，很没礼貌');
                else { addRude(S); lurchT = .75; S.toast('盯得太久了——一眨眼，他近了'); }
              }
            } else { if (S.isFrozen('robW')) S.freeze('robW', false); stareT = Math.max(0, stareT - dt * 1.5); }
          }
          const tk = Math.round(d.px / 16) + ',' + Math.round(d.py / 16);
          nearT -= dt;
          if (tk !== lastTile) {
            lastTile = tk; trail.push([Math.round(d.px / 16), Math.round(d.py / 16)]); if (trail.length > 6) trail.shift();
            const dist = Math.abs(d.px - S.pl.px) / 16 + Math.abs(d.py - S.pl.py) / 16; stepTone(S, clamp(.1 - dist * .008, .02, .1));
            /* 声音没有方向：他走到 3 格以内时，头顶冒「!」、心跳（画面补方向） */
            if (dist <= 3.2 && nearT <= 0) { nearT = 1.4; S.bubble('pl', '!', 700); S.sfx('heart'); }
          }
        }
      }
      /* 展厅：没人看着的时候，他会换个姿势 */
      if (S.map === 'hall' && f.phase !== 'dark' && !S.busy) {
        const c = S.ent('rcase');
        if (!seesEnt(S, c, 9)) {
          lookAway += dt;
          if (lookAway > 5 && !f._mv) { f._mv = true; c.s.pose = (c.s.pose + 1 + S.rand(2)) % 3; knockTone(S, .025); }
        } else {
          lookAway = 0;
          if (f._mv && !f._mvSeen) { f._mvSeen = true; if (!f._mvTold) { f._mvTold = true; S.toast('……他的姿势，好像跟刚才不一样了'); } }
        }
      }
      if (f.ringing && S.map === 'office' && !S.busy) { ringT -= dt; if (ringT <= 0) { ringT = 4; ringTone(S); } }
    },
    sprites: {
      /* 展厅的玻璃柜（2 格宽，向上伸进墙里）：empty / lion / pose 0正 1扭头 2手贴玻璃 / mood 0平 1撇嘴 2微笑 / tilt 歪头 / dust / card / flk 射灯闪 / off 关灯 */
      rcase(g, e, t, R) {
        /* 柜子整体加高：娃娃的脸画在调查提示「!」的上方（提示气泡在实体顶边往上 2–11 像素） */
        const lit = !e.flk && !e.off, Q = (x, y, w, h, c) => R(x, y - 9, w, h, c), SU = '#e4ddcb', OL = '#1a120c';
        box(R, 1, 1, 30, 15, '#4a3020'); R(2, 2, 28, 2, '#5e3e28'); R(3, 9, 26, 1, '#3a2416'); R(14, 6, 4, 1, '#c9a35a'); R(3, 13, 26, 1, '#3a2416');
        R(2, -29, 28, 30, lit ? '#3a2e30' : '#18141a');
        R(12, -33, 8, 3, '#2a2a2a'); R(13, -30, 6, 1, lit ? '#fff4c0' : '#444');
        if (lit) R(8, -29, 16, 30, 'rgba(255,236,180,.06)');
        Q(9, -6, 14, 9, '#8a6a3a'); Q(10, -14, 12, 9, '#7a5a30');
        for (let i = 0; i < 4; i++) Q(11 + i * 3, -13, 1, 7, '#6a4a24');
        Q(9, 2, 14, 1, '#6a4a24');
        if (!e.empty) {
          const tx = e.tilt ? 1 : 0, pose = e.pose || 0;
          Q(11, -6, 12, 9, OL); Q(11 + tx, -13, 10, 8, OL);
          Q(12, 2, 3, 3, SU); Q(17, 2, 3, 3, SU); Q(12, 4, 3, 2, '#2a1a14'); Q(17, 4, 3, 2, '#2a1a14');
          if (e.dust) { Q(12, 5, 3, 1, '#9a948a'); Q(17, 5, 3, 1, '#9a948a'); }
          Q(12, -5, 8, 8, SU); Q(12, -5, 8, 2, NAVY); Q(12, -3, 1, 1, NAVY); Q(19, -3, 1, 1, NAVY); Q(15, -3, 2, 1, RED); Q(18, -4, 1, 7, '#c8c0ac');
          Q(10, -4, 2, 6, SU);
          if (pose === 2) { Q(21, -11, 2, 7, SU); Q(21, -12, 2, 1, CLOTH); Q(23, -12, 1, 2, 'rgba(255,255,255,.25)'); } else Q(20, -4, 2, 6, SU);
          if (e.lion) { Q(12, -3, 5, 5, MANE); Q(14, -2, 6, 4, LION); Q(13, -2, 1, 1, KK); Q(19, 1, 2, 1, MANE); }
          Q(12 + tx, -12, 8, 7, CLOTH); Q(19 + tx, -11, 1, 5, '#b8a888');
          Q(12 + tx, -12, 8, 1, HAIR); Q(11 + tx, -11, 1, 3, HAIR);
          Q(14 + tx, -9, 1, 1, '#8a7a60'); Q(17 + tx, -7, 1, 1, '#8a7a60');
          if (pose === 1) { Q(12 + tx, -10, 2, 2, KK); Q(15 + tx, -10, 2, 2, KK); }
          else { Q(13 + tx, -10, 2, 2, KK); Q(17 + tx, -10, 2, 2, KK); if (lit) { Q(13 + tx, -10, 1, 1, '#9aa'); Q(17 + tx, -10, 1, 1, '#9aa'); } }
          const mx = (pose === 1 ? 13 : 15) + tx;
          if (e.mood === 1) { Q(mx - 1, -7, 4, 1, '#6a2a2a'); Q(mx - 1, -6, 1, 1, '#6a2a2a'); Q(mx + 2, -6, 1, 1, '#6a2a2a'); }
          else if (e.mood === 2) { Q(mx - 1, -7, 1, 1, '#7a3030'); Q(mx, -6, 2, 1, '#7a3030'); Q(mx + 2, -7, 1, 1, '#7a3030'); }
          else Q(mx, -7, 2, 1, '#7a3030');
          const hx = e.tilt ? 2 : 0;
          Q(10 + hx, -16, 12, 1, OL); Q(11 + hx, -15, 10, 3, SU); Q(10 + hx, -13, 12, 1, SU); Q(11 + hx, -13, 10, 1, NAVY); Q(20 + hx, -13, 1, 3, NAVY);
        }
        if (e.card) { Q(24, -1, 5, 4, '#ece6d4'); Q(25, 0, 3, 1, '#555'); Q(25, 1, 2, 1, '#555'); }
        R(1, -30, 30, 1, '#2a1a10'); R(1, -30, 1, 31, '#2a1a10'); R(30, -30, 1, 31, '#2a1a10'); R(1, 0, 30, 1, '#2a1a10'); R(16, -29, 1, 29, 'rgba(40,26,16,.45)');
        R(3, -28, 1, 26, 'rgba(255,255,255,.16)'); R(5, -28, 1, 10, 'rgba(255,255,255,.09)'); R(26, -20, 1, 16, 'rgba(255,255,255,.09)');
        R(2, -29, 28, 30, 'rgba(160,190,210,.06)');
      },
      /* 墙上的信：key = 可收集的那封（带图钉、未读闪光），more = 新钉上去的 */
      letters(g, e, t, R) {
        const C = ['#e8e2cc', '#f0e8d8', '#e8d8e4', '#d8e4e8', '#f4ecc0', '#e0d0b8'];
        for (let i = 0; i < 9; i++) { const h = hash(e.x, i, 5), h2 = hash(e.x, i, 9); const x = (h * 12) | 0, y = 1 + ((h2 * 11) | 0); R(x, y, 4, 4 + (i % 2), C[i % 6]); R(x + 1, y + 1, 2, 1, '#8a8070'); if (i % 3 === 0) R(x + 1, y, 1, 1, '#a83030'); }
        if (e.more) { R(2, 11, 5, 4, '#f4f0e4'); R(3, 12, 3, 1, '#c8a040'); R(9, 10, 5, 4, '#e8f0f4'); R(10, 11, 3, 1, '#6a7a8a'); R(4, 10, 1, 1, '#c02020'); R(11, 9, 1, 1, '#c02020'); }
        if (e.key) { R(4, 3, 8, 9, '#f6f0de'); R(5, 5, 6, 1, '#6a6050'); R(5, 7, 5, 1, '#6a6050'); R(5, 9, 6, 1, '#6a6050'); R(7, 2, 2, 2, '#c02020'); if (!e.read) { const b = Math.sin(t * 4) > 0 ? 1 : 0; R(7, -2 + b, 2, 2, '#ffe680'); } }
      },
      plaque(g, e, t, R) { box(R, 2, 3, 12, 9, '#8a7030'); R(3, 4, 10, 7, '#c0a050'); R(4, 5, 8, 1, '#6a5020'); R(4, 7, 6, 1, '#6a5020'); R(4, 9, 7, 1, '#6a5020'); if (!e.read) { const b = Math.sin(t * 4) > 0 ? 1 : 0; R(7, -1 + b, 2, 2, '#ffe680'); } },
      oldphoto(g, e, t, R) { box(R, 2, 1, 12, 12, '#5a3a20'); R(3, 2, 10, 10, '#c8b08a'); R(3, 2, 10, 2, '#b49a74'); R(5, 4, 3, 3, '#e8d8c0'); R(5, 4, 3, 1, '#4a3a2a'); R(5, 7, 3, 4, '#4a3a2a'); R(9, 6, 3, 1, '#f4efe4'); R(9, 7, 3, 2, '#e0d4bc'); R(9, 9, 3, 2, '#f4efe4'); R(10, 7, 1, 1, '#222'); },
      mailslot(g, e, t, R) { R(7, 6, 2, 9, '#4a3020'); R(5, 14, 6, 1, '#3a2416'); box(R, 3, -3, 10, 10, '#7a5030'); R(4, -4, 8, 1, '#8a6040'); R(5, 0, 6, 1, '#1a0e08'); R(6, 3, 4, 2, '#c9a35a'); },
      lectern(g, e, t, R) { R(7, 5, 2, 9, '#4a3020'); R(4, 13, 8, 2, '#3a2416'); box(R, 2, 0, 12, 6, '#5a3a24'); R(3, 0, 5, 5, '#ece4cc'); R(8, 0, 5, 5, '#e4dcc4'); R(4, 1, 3, 1, '#7a7060'); R(9, 2, 3, 1, '#7a7060'); R(10, -3, 1, 4, '#222'); },
      yline(g, e, t, R) { R(0, 6, 16, 2, 'rgba(200,170,40,.65)'); },
      /* 值班桌：k = cctv / phone / clip / mail */
      dsk(g, e, t, R) {
        box(R, 0, 1, 16, 13, '#5d4632'); R(1, 2, 14, 2, '#73583e'); R(2, 8, 12, 1, '#4a3828');
        if (e.k === 'cctv') {
          box(R, 1, -10, 14, 11, '#1a1a1c'); const sc = (x, y, w, h) => R(x, y, w, h, '#5a6a6a');
          sc(2, -9, 6, 4); sc(9, -9, 5, 4); sc(2, -4, 6, 4); sc(9, -4, 5, 4);
          R(3, -8, 4, 1, '#7a8a8a'); R(10, -7, 3, 1, '#7a8a8a'); R(3, -2, 4, 1, '#4a5a5a');
          R(10, -3, 3, 3, '#3a4a4a'); if (!e.empty) { R(e.turn ? 10 : 11, -3, 1, 1, '#e8e8e0'); R(11, -2, 1, 1, '#c8c8c0'); }
          if (Math.sin(t * 7) > .95) R(2, -9 + ((t * 13) % 8 | 0), 12, 1, 'rgba(255,255,255,.15)');
          R(6, 1, 4, 1, '#333');
        } else if (e.k === 'phone') {
          const j = e.ring && Math.sin(t * 40) > 0 ? -1 : 0;
          R(2, 0, 6, 3, '#1e1e1e'); R(2, -1 + j, 6, 1, '#111'); R(1, -1 + j, 1, 2, '#111'); R(8, -1 + j, 1, 2, '#111');
          R(9, 0, 6, 3, '#3a3a3a'); R(10, 1, 3, 1, '#222'); R(13, 0, 1, 1, e.msg && Math.sin(t * 5) > 0 ? '#ff3030' : '#4a1010');
        } else if (e.k === 'clip') {
          R(4, -2, 8, 6, '#a8804a'); R(5, -1, 6, 4, '#f2eee0'); R(6, 0, 4, 1, '#888'); R(6, 2, 3, 1, '#888'); R(6, -3, 4, 2, '#aaa');
          if (!e.read) { const b = Math.sin(t * 4) > 0 ? 1 : 0; R(7, -7 + b, 2, 2, '#ffe680'); }
        } else if (e.k === 'mail') {
          R(3, -1, 10, 4, '#7a7a7a'); R(4, 0, 8, 2, '#3a3a3a');
          if (!e.empty) { R(4, -2, 8, 2, '#e8e2cc'); R(5, -3, 7, 2, '#f0e8d8'); R(6, -4, 6, 2, '#f4ecc0'); R(10, -4, 2, 1, '#c84040'); }
        }
      },
      replicas(g, e, t, R) { box(R, 0, -8, 16, 22, '#6a5038'); R(1, 2, 14, 1, '#3a2818'); for (let i = 0; i < 3; i++) { const x = 1 + i * 5; R(x, -6, 4, 1, W_); R(x, -5, 4, 1, NAVY); R(x, -4, 4, 3, CLOTH); R(x + 1, -3, 1, 1, KK); R(x + 2, -3, 1, 1, KK); R(x, -1, 4, 3, W_); } for (let i = 0; i < 3; i++) R(2 + i * 5, 5, 3, 4, ['#e8e0d0', '#2a3450', '#c84040'][i]); },
      till(g, e, t, R) { box(R, 0, 1, 16, 13, '#6a4a30'); R(1, 2, 14, 2, '#7a5a3a'); box(R, 3, -5, 10, 7, '#3a3a3a'); R(4, -4, 8, 2, '#5a8a6a'); for (let i = 0; i < 3; i++) R(4 + i * 3, -1, 2, 1, '#888'); },
      rack(g, e, t, R) { R(7, -10, 2, 24, '#555'); R(4, 13, 8, 2, '#444'); const C = ['#d8a8a8', '#a8c8d8', '#e8d8a0', '#f2efe6']; for (let i = 0; i < 4; i++) { R(2, -9 + i * 5, 5, 4, C[i]); R(9, -8 + i * 5, 5, 4, C[(i + 2) % 4]); } R(3, 6, 3, 2, NAVY); R(10, 7, 3, 2, '#c84040'); },
      cooler(g, e, t, R) { R(5, -9, 6, 7, 'rgba(150,200,240,.8)'); R(6, -10, 4, 1, '#3a6aa8'); box(R, 3, -2, 10, 16, '#e0e0d8'); R(6, 2, 4, 2, '#3a6aa8'); },
      board(g, e, t, R) { box(R, 1, 1, 14, 11, '#8a6a42'); R(2, 2, 12, 9, '#b08a5a'); R(3, 3, 4, 4, '#f2efe6'); R(8, 3, 5, 3, '#e8d8a0'); R(4, 8, 5, 2, '#d8a8a8'); R(10, 7, 3, 3, '#a8c8d8'); R(5, 3, 1, 1, '#c02020'); R(10, 3, 1, 1, '#2040c0'); },
      ffposter(g, e, t, R) { R(3, 0, 10, 13, '#4a2a5a'); R(4, 1, 8, 4, '#e8a030'); R(5, 2, 2, 2, '#4a2a5a'); R(9, 2, 2, 2, '#4a2a5a'); R(4, 7, 8, 1, '#f2efe6'); R(4, 9, 6, 1, '#e8a030'); R(4, 11, 7, 1, '#30a0a0'); },
      hanger(g, e, t, R) { R(7, -10, 2, 25, '#4a3020'); R(4, 13, 8, 2, '#3a2416'); R(3, -10, 10, 1, '#4a3020'); R(2, -9, 4, 9, '#3a5a3a'); R(10, -9, 3, 6, '#c8b070'); },
      cannon(g, e, t, R) { box(R, 4, 6, 24, 7, '#4a3020'); R(5, 9, 6, 6, '#2a1a10'); R(21, 9, 6, 6, '#2a1a10'); R(7, 11, 2, 2, '#5a4a3a'); R(23, 11, 2, 2, '#5a4a3a'); R(3, 1, 25, 6, '#2a2a2e'); R(0, 0, 4, 8, '#1c1c20'); R(1, 2, 2, 4, '#050505'); R(6, 2, 18, 1, '#4a4a52'); R(26, 2, 4, 4, '#2a2a2e'); },
      helmet(g, e, t, R) { box(R, 4, 5, 8, 10, '#5a5048'); R(3, -7, 10, 10, '#b07a3a'); R(4, -8, 8, 1, '#c88a4a'); R(5, -4, 6, 5, '#7a5a2a'); R(6, -3, 4, 3, '#1a2a3a'); R(6, -3, 1, 1, '#8ab'); R(2, 2, 12, 2, '#8a5a2a'); },
      cigar(g, e, t, R) { box(R, 0, 3, 16, 11, '#6a4a30'); R(1, 4, 14, 2, '#7a5a3a'); R(2, 1, 6, 3, '#7a5a2a'); R(3, 2, 4, 1, '#5a3a1a'); for (let i = 0; i < 3; i++) R(9 + i * 2, 1, 1, 3, '#8a5a2a'); R(12, 0, 3, 2, '#c8a060'); },
      sconce(g, e, t, R) { R(7, 6, 2, 5, '#3a3a3a'); R(5, 10, 6, 1, '#2a2a2a'); R(6, 2, 4, 4, e.off ? '#4a4438' : '#ffe8a0'); R(5, 1, 6, 1, '#3a3a3a'); },
      slit(g, e, t, R) { R(6, 2, 4, 10, '#0a0e18'); R(7, 3, 2, 8, '#2a3a5a'); R(7, 4, 1, 2, '#8aa0c8'); R(5, 1, 6, 1, '#8a6a5a'); R(5, 12, 6, 1, '#8a6a5a'); },
      /* 闸刀（挂墙）：up 合上 / half 推到一半 */
      lever(g, e, t, R) {
        box(R, 1, 0, 14, 15, '#5a6068'); R(2, 1, 12, 1, '#7a8088'); R(7, 3, 2, 9, '#151515');
        const y = e.up ? 2 : e.half ? 6 : 10; R(6, y, 4, 3, '#2a2a2a');
        if (e.main) { for (let x = 1; x < 15; x += 4) { R(x, 0, 2, 1, '#e8c020'); R(x + 2, 0, 2, 1, '#151515'); } R(2, y - 1, 12, 3, '#151515'); R(3, y - 1, 3, 2, '#c03030'); R(10, y - 1, 3, 2, '#c03030'); }
        else { R(4, y, 8, 2, '#c03030'); R(4, y, 8, 1, '#e05050'); }
        R(3, 12, 10, 2, '#e8e2cc'); R(4, 12, 1 + (e.x % 4) * 2, 1, '#555');
        if (e.up) R(12, 2, 1, 1, '#40ff60'); else R(12, 2, 1, 1, '#3a1010');
      },
      elabel(g, e, t, R) { R(3, 2, 10, 10, '#e8e2cc'); R(4, 4, 8, 1, '#555'); R(4, 6, 6, 1, '#555'); R(4, 8, 7, 1, '#555'); R(8, 7, 4, 4, 'rgba(60,40,20,.45)'); R(7, 1, 2, 2, '#888'); if (!e.read) { const b = Math.sin(t * 4) > 0 ? 1 : 0; R(7, -3 + b, 2, 2, '#ffe680'); } },
      wbench(g, e, t, R) {
        box(R, 0, 2, 32, 12, '#7a5a3a'); R(2, 4, 2, 10, '#5a3a24'); R(28, 4, 2, 10, '#5a3a24');
        R(2, 0, 28, 4, '#ecece4'); R(3, 1, 26, 1, '#d8d8d0');
        R(4, -1, 3, 2, '#c84040'); R(5, -2, 1, 1, '#ddd'); R(24, 0, 4, 1, '#aaa'); R(26, -1, 1, 1, '#aaa');
        if (e.lion) { R(13, -4, 5, 5, MANE); R(15, -3, 7, 4, LION); R(14, -3, 1, 1, KK); R(21, 0, 3, 1, MANE); R(16, -1, 1, 2, '#c84040'); }
        else { R(13, 0, 9, 2, '#d0d0c8'); }
      },
      worklamp(g, e, t, R) { R(7, -4, 2, 18, '#333'); R(4, 13, 8, 2, '#2a2a2a'); R(2, -8, 9, 4, '#555'); R(3, -5, 7, 1, e.off ? '#4a4a3a' : '#fff4c0'); },
      /* 炮眼（堡垒外墙）：face = 里面站着一个小小的白影，tilt = 歪头 */
      gunport(g, e, t, R) {
        R(3, 2, 10, 1, '#9a8a7a'); R(3, 12, 10, 1, '#9a8a7a'); R(3, 2, 1, 11, '#8a7a6a'); R(12, 2, 1, 11, '#8a7a6a');
        R(4, 3, 8, 9, '#04050a');
        if (e.face) { const tx = e.tilt ? 1 : 0; R(5 + tx, 5, 6, 1, W_); R(5, 6, 6, 1, NAVY); R(6 + tx, 7, 4, 3, CLOTH); R(7 + tx, 8, 1, 1, KK); R(9 + tx, 8, 1, 1, KK); R(5, 10, 6, 2, W_); }
      },
      mailbox(g, e, t, R) { R(4, 9, 2, 6, '#1a1a1a'); R(10, 9, 2, 6, '#1a1a1a'); box(R, 2, -4, 12, 14, '#2a4a8a'); R(3, -5, 10, 1, '#2a4a8a'); R(4, -6, 8, 1, '#2a4a8a'); R(4, 0, 8, 2, '#152540'); R(5, 0, 6, 1, '#050810'); R(5, 4, 6, 3, '#e8e8e8'); R(6, 5, 4, 1, '#2a4a8a'); },
      rooster(g, e, t, R) { const p = Math.sin(t * 2.3) > .7 ? 2 : 0; R(5, 8, 7, 5, '#c8742a'); R(6, 9, 5, 2, '#a85a1a'); R(11, 4, 3, 6, '#1a4a3a'); R(12, 3, 2, 2, '#2a6a4a'); R(3, 4 + p, 3, 4, '#c8742a'); R(3, 3 + p, 2, 1, '#d02020'); R(2, 5 + p, 1, 1, '#e8c040'); R(3, 7 + p, 1, 2, '#d02020'); R(3, 5 + p, 1, 1, '#111'); R(7, 13, 1, 3, '#e8c040'); R(9, 13, 1, 3, '#e8c040'); },
      catbench(g, e, t, R) { R(1, 9, 2, 6, '#333'); R(13, 9, 2, 6, '#333'); box(R, 0, 5, 16, 5, '#7a5a3a'); R(0, 2, 16, 3, '#6a4a2a'); const b = Math.sin(t * 1.5) > 0 ? 1 : 0; R(4, 2 - b, 8, 4 + b, '#c8a060'); R(5, 3, 2, 1, '#a8804a'); R(8, 3, 2, 1, '#a8804a'); R(10, 1 - b, 2, 2, '#c8a060'); R(11, 0 - b, 1, 1, '#c8a060'); R(3, 4, 2, 2, '#c8a060'); R(2, 5, 2, 1, '#e8d8b0'); },
      fsign(g, e, t, R) { box(R, 1, 3, 14, 8, '#2a3a2a'); R(2, 4, 12, 1, '#c8b070'); R(3, 6, 10, 1, '#e8e0c8'); R(3, 8, 7, 1, '#e8e0c8'); }
    },
    tiles: {
      palm: { solid: true, paint(R, X, Y) { R(0, 0, 16, 16, '#22381f'); R(1, 13, 14, 3, '#1a2c18'); R(7, 5, 2, 10, '#7a5a3a'); R(7, 8, 2, 1, '#5a3a24'); R(7, 11, 2, 1, '#5a3a24'); R(2, 1, 12, 2, '#2a6a3a'); R(0, 3, 5, 2, '#2a6a3a'); R(11, 3, 5, 2, '#2a6a3a'); R(4, 0, 8, 1, '#3a8a4a'); R(1, 5, 3, 1, '#1e5a2e'); R(12, 5, 3, 1, '#1e5a2e'); R(7, 3, 2, 2, '#5a4a2a'); } }
    },
    maps: {
      /* ---------------- 值班室兼礼品店 ---------------- */
      office: {
        amb: 'room', dark: .42, wall: 'brick', floor: 'wood', plr: 3.2,
        rows: [
          '###############',
          '###############',
          '#.............#',
          '#.............#',
          '#.............#',
          '#.............#',
          '#.............#',
          '#.............#',
          '#######.#######'],
        ents: [
          { id: 'board', x: 2, y: 1, spr: 'board', on: S => S.narr('员工公告栏：\n「万圣节周末延长开放。」「请勿把咖啡放在展柜上！」\n「寄给罗伯特的信，每周一统一归档。——黛布」') },
          { id: 'oclock', x: 5, y: 1, spr: 'wallclock', on: S => { const f = S.f; S.narr(f.posted ? '一点五十。秒针走得很响。' : f.called ? '一点十几分。' : f.photoDone ? '快到零点了。' : f.phase === 'lit' ? '十一点四十。' : '十点过一点。秒针「咔、咔」地走。'); } },
          { id: 'poster', x: 8, y: 1, spr: 'ffposter', on: S => S.narr('「幻想节」游行海报。紫色、金色、绿色。\n上个周末刚过完，杜瓦尔街的石缝里还能捡到亮片。') },
          { id: 'hdoor', x: 12, y: 1, spr: 'door', col: '#5a3a2a', to: ['hall', 5, 8, 3] },
          { id: 'cctv', x: 1, y: 2, spr: 'dsk', s: { k: 'cctv' }, light: { r: 1.8, col: 'rgba(150,180,200,.12)' }, on: cctvUse },
          { id: 'dphone', x: 2, y: 2, spr: 'dsk', s: { k: 'phone', msg: true }, on: phoneUse },
          { id: 'clip', x: 3, y: 2, spr: 'dsk', s: { k: 'clip' }, on: clipUse },
          { id: 'mailb', x: 4, y: 2, spr: 'dsk', s: { k: 'mail' }, on: mailUse },
          { id: 'rep', x: 8, y: 2, spr: 'replicas', on: S => S.narr('礼品店的货架。一排小号的罗伯特玩偶，穿着一模一样的水手服，\n价签上写着：「24.99美元——买之前，也问问他？」') },
          { id: 'books', x: 9, y: 2, spr: 'shelf', on: S => S.narr('《基韦斯特鬼故事》《沉船与打捞者》《炮台的一百五十年》。\n还有一本儿童绘本：《罗伯特想交个朋友》。') },
          { id: 'cooler', x: 10, y: 2, spr: 'cooler', on: S => S.narr('饮水机。咕嘟一声，冒上来一个气泡。') },
          { id: 'lamp', x: 13, y: 2, spr: 'lamp', light: { r: 3, col: 'rgba(255,210,140,.14)', dy: -2 }, on: S => S.narr('落地灯。灯罩上积着一层薄灰。') },
          { id: 'till', x: 9, y: 5, spr: 'till', on: S => S.narr('收银机锁着。旁边一个小牌子：「所有收入用于藏品保护」。') },
          { id: 'cnt', x: 10, y: 5, spr: 'counter', col: '#6a4a30', on: S => S.narr('柜台上放着一叠宣传单：「东马泰洛堡：炮台、艺术与罗伯特」。') },
          { id: 'rack', x: 12, y: 5, spr: 'rack', on: rackUse },
          { id: 'hang', x: 13, y: 6, spr: 'hanger', on: S => S.narr('衣帽架上挂着一件绿色雨衣。口袋里鼓鼓的——是一包没开封的猫粮。') },
          { id: 'lost', x: 1, y: 7, spr: 'box', on: S => S.narr('失物招领箱。墨镜、一只童鞋、三把伞……\n还有一部屏幕碎成蛛网的手机。标签上写着：「在罗伯特展厅门口捡到」。') },
          { id: 'deb', x: 7, y: 4, spr: '@deb', dir: 0, on: S => S.say('黛布', '清单在桌上。……还有，记住我说的。') },
          { x: 7, y: 8, spr: 'invisible', to: ['yard', 9, 2, 0] }
        ],
        async enter(S, first) {
          if (first) return handover(S);
        }
      },
      /* ---------------- 罗伯特的展厅 ---------------- */
      hall: {
        amb: 'room', dark: .62, wall: 'brick', floor: 'stone', plr: 3,
        rows: [
          '################',
          '################',
          '#..............#',
          '#..............#',
          '#..............#',
          '#..............#',
          '#..............#',
          '#..............#',
          '#..............#',
          '#####.##########'],
        ents: [
          { id: 'lw1', x: 1, y: 1, spr: 'letters', on: snip(0) },
          { id: 'l1', x: 2, y: 1, spr: 'letters', key: true, on: hg(S => S.note('l1')) },
          { id: 'ophoto', x: 3, y: 1, spr: 'oldphoto', on: hg(async S => {
            if (S.f.photoBack) return S.narr('伊顿街，约1906年。小男孩和他的罗伯特。\n背面那行铅笔字：「是罗伯特干的！」');
            await S.narr('一张泛黄的老照片。一个穿水手服的小男孩，坐在门廊的台阶上。\n他身边，是一个和他差不多高、也穿着水手服的娃娃。');
            await S.narr('照片底下的小字：「伊顿街，约1906年」。\n两个人笑得一模一样。');
            S.f.photoBack = true;
            await S.narr('相框有点歪。你扶正它的时候，看见背面露出一角，用铅笔写着一行孩子的字：\n「是罗伯特干的！」');
            await S.think('（……那个小男孩，后来成了画家。他一辈子都把罗伯特留在身边。）');
          }) },
          { id: 'lw4', x: 4, y: 1, spr: 'letters', on: snip(1) },
          { id: 'l2', x: 5, y: 1, spr: 'letters', key: true, on: hg(S => S.note('l2')) },
          { id: 'lw6', x: 6, y: 1, spr: 'letters', on: snip(2) },
          { id: 'lw9', x: 9, y: 1, spr: 'letters', on: snip(3) },
          { id: 'l3', x: 10, y: 1, spr: 'letters', key: true, on: hg(S => S.note('l3')) },
          { id: 'lw11', x: 11, y: 1, spr: 'letters', on: snip(4) },
          { id: 'plaque', x: 12, y: 1, spr: 'plaque', on: hg(S => S.note('bio')) },
          { id: 'lw13', x: 13, y: 1, spr: 'letters', on: snip(5) },
          { id: 'cdoor', x: 14, y: 1, spr: 'door', col: '#4a3020', async on(S) { await farewell(S); S.sfx('open'); await S.go('corridor', 2, 2, 0); } },
          { id: 'rcase', x: 7, y: 2, w: 2, spr: 'rcase', s: { pose: 0, mood: 0 }, light: { r: 2.6, col: 'rgba(255,232,170,.16)', dy: -14 }, on: caseUse },
          { x: 7, y: 4, spr: 'yline', decal: true, solid: false },
          { x: 8, y: 4, spr: 'yline', decal: true, solid: false },
          { id: 'mslot', x: 10, y: 4, spr: 'mailslot', on: hg(S => S.narr('一只木头信箱，投信口磨得发亮。上面刻着：「TO ROBERT」。\n参观的人把信投在这里，博物馆每周一开箱。')) },
          { id: 'bench1', x: 2, y: 6, w: 2, spr: 'bench', on: hg(S => S.narr('长椅。椅背上有人用指甲刻了一行小字：「他眨眼了」。')) },
          { id: 'bench2', x: 11, y: 7, w: 2, spr: 'bench', on: hg(S => S.narr('长椅。坐在这里，正好和柜子里的他平视。\n你没有坐。')) },
          { id: 'vbook', x: 13, y: 4, spr: 'lectern', on: hg(async S => { await S.narr('留言簿。最新的一页：\n「他好可爱！！」「他瞪我了」「我问了，他同意了 :)」「为什么我的相机突然没电了？？？」'); }) },
          { x: 5, y: 9, spr: 'invisible', solid: false, async touch(S) { await farewell(S); await S.go('office', 12, 2, 0); } }
        ],
        async enter(S, first) {
          const f = S.f;
          f.needGreet = true; f.greeted = false; f.fgVisit = false; f.hallSteps = 0; f.byeVisit = false; f._mv = false; f._mvSeen = false; lookAway = 0;
          setMood(S);
          if (first) {
            S.focus(7, 3);
            await S.narr('展厅很小。四面是红砖拱顶，射灯只照着正中间的玻璃柜。\n柜子四周的墙上，从地面一直到拱顶，密密麻麻贴满了信。');
            S.focus(null);
            await S.think('（……这就是他。）');
            return regoal(S);
          }
          const c = S.ent('rcase');
          if (c.s.dust && S.once('backLit')) {
            await S.narr('他坐在柜子里，和刚才一模一样。\n……只是头转向了走廊那扇门。');
            return;
          }
          if (S.rand(2)) c.s.pose = (c.s.pose + 1) % 3;
        },
        step(S, x, y) {
          const f = S.f;
          if (!f.needGreet || f.fgVisit || (x >= 6 && x <= 9 && y <= 4)) return;   // 站到柜子跟前不算
          if (++f.hallSteps >= 11) return forgotGreet(S);
        }
      },
      /* ---------------- 炮台走廊 + 修复间 ---------------- */
      corridor: {
        amb: 'room', dark: .55, wall: 'brick', floor: 'stone', plr: 3,
        rows: [
          '##########################',
          '##########################',
          '#...............#........#',
          '#...............#........#',
          '#........................#',
          '#........................#',
          '#...............#........#',
          '##########################'],
        ents: [
          { id: 'cdoorH', x: 2, y: 1, spr: 'door', col: '#4a3020', async on(S) {
            if (S.f.phase === 'dark') return S.toast('（电闸在修复间。先把灯弄亮。）');
            S.sfx('open'); await S.go('hall', 14, 2, 0);
          } },
          { id: 'sc1', x: 4, y: 1, spr: 'sconce', light: { r: 2.6, col: 'rgba(255,220,150,.14)' }, on: dk(S => S.narr(S.ent('sc1').s.off ? '壁灯灭着。' : '仿煤油灯样式的壁灯，灯泡嗡嗡地响。'), '（壁灯灭着）') },
          { id: 'slit1', x: 7, y: 1, spr: 'slit', light: { r: 1.4, col: 'rgba(140,170,230,.10)' }, on: dk(S => S.narr('射击孔。外面是夜里的跑道灯，一明一灭。\n一百五十年前，这里架的是炮。')) },
          { id: 'sc2', x: 10, y: 1, spr: 'sconce', light: { r: 2.6, col: 'rgba(255,220,150,.14)' }, on: dk(S => S.narr(S.ent('sc2').s.off ? '壁灯灭着。' : '壁灯。灯罩里有一只死飞蛾。'), '（壁灯灭着）') },
          { id: 'sc3', x: 14, y: 1, spr: 'sconce', light: { r: 2.6, col: 'rgba(255,220,150,.14)' }, on: dk(S => S.narr(S.ent('sc3').s.off ? '壁灯灭着。' : '壁灯。砖墙上有人用粉笔写了个日期：1862。'), '（壁灯灭着）') },
          { id: 'cannon', x: 5, y: 2, w: 2, spr: 'cannon', on: dk(S => S.narr('一门生锈的前装炮。说明牌：「本炮台建于南北战争期间，从未开过一炮。」')) },
          { id: 'helmet', x: 12, y: 2, spr: 'helmet', on: dk(S => S.narr('铜制潜水头盔。基韦斯特的「打捞者」们，戴着它下海捞沉船上的货。\n圆窗玻璃里，映出你的脸。……只有你的脸。')) },
          { id: 'cigar', x: 4, y: 6, spr: 'cigar', on: dk(S => S.narr('雪茄工人的长凳。一百年前，这座岛上有上百家雪茄作坊。\n凳面上还留着烟叶的味道。')) },
          { id: 'crate', x: 13, y: 6, spr: 'crate', on: dk(S => S.narr('木箱上印着「易碎　展品　请勿倒置」。')) },
          { id: 'cbench', x: 8, y: 6, w: 2, spr: 'bench', on: dk(S => S.narr('给游客歇脚的长椅。')) },
          /* 修复间 */
          { id: 'supply', x: 17, y: 2, spr: 'shelf', on: dk(S => S.narr('修复材料：无酸纸、棉签、蒸馏水，一卷一卷的亚麻线。\n一个小抽屉上贴着标签：「R 的纽扣（备用）」。')) },
          ...[0, 1, 2, 3].map(i => ({ id: 'lv' + i, x: 19 + i, y: 1, spr: 'lever', main: i === 1, s: { up: true }, on: leverUse(i) })),
          { id: 'elabel', x: 23, y: 1, spr: 'elabel', on: labelUse },
          { id: 'wlamp', x: 24, y: 2, spr: 'worklamp', light: { r: 2.4, col: 'rgba(255,240,200,.16)' }, on: dk(S => S.narr('放大镜台灯。灯罩里的放大镜，照出一小圈亮光。')) },
          { id: 'wbench', x: 23, y: 4, w: 2, spr: 'wbench', s: { lion: true }, on: wbenchUse },
          { id: 'wbox', x: 17, y: 6, spr: 'box', on: dk(S => S.narr('纸箱上写着：「待修：雪茄盒×3，渔网×1」。')) },
          ...[0, 1, 2, 3, 4, 5].map(i => ({ id: 'fp' + i, x: 1, y: 2, spr: 'footprints', col: 'rgba(170,160,140,' + (.6 - i * .07).toFixed(2) + ')', decal: true, hidden: true, solid: false })),
          { id: 'robW', x: 12, y: 5, spr: '@robert', hidden: true, solid: false, light: { r: 1.3, col: 'rgba(225,225,255,.14)' } }
        ],
        async enter(S, first) {
          if (first) {
            await S.narr('炮台走廊。拱顶很低，砖缝里渗着潮气。\n两边陈列着生锈的炮、铜潜水头盔、雪茄工人的长凳。尽头的门后，是修复间。');
          }
        },
        step(S, x, y) {
          if (x >= 17 && S.f.phase !== 'dark' && S.once('wroom')) return S.think('（修复间。墙上有个老配电箱，旁边贴着一张标签。工作台上……是那只小狮子吗？）');
        }
      },
      /* ---------------- 堡垒外的院子 ---------------- */
      yard: {
        amb: 'night', dark: .7, wall: 'brick', floor: 'stone', plr: 3.2,
        legend: { 'Y': 'palm' },
        rows: [
          '####################',
          '####################',
          'kkkkkkkkkkkkkkkkkkkk',
          '"Y""""""kkk"""""""Y"',
          '""""""""kkk"""""""""',
          '"""Y""""kkk"""""Y"""',
          '""""""""kkk"""""""""',
          '____________________',
          '::::::::::::::::::::',
          '::::::::::::::::::::',
          'ffffffffffffffffffff'],
        ents: [
          { id: 'gunL', x: 4, y: 1, spr: 'gunport', on: S => S.narr('炮眼。黑漆漆的。里面是炮台走廊。') },
          { id: 'gate', x: 9, y: 1, spr: 'door', col: '#3a2a1a', to: ['office', 7, 7, 3] },
          { id: 'fsign', x: 12, y: 1, spr: 'fsign', on: S => S.narr('铜牌：「东马泰洛堡　1862」。\n底下一行小字：「基韦斯特艺术与历史学会」。') },
          { id: 'gunR', x: 15, y: 1, spr: 'gunport', on: S => S.narr(S.f.posted ? '黑漆漆的炮眼。……里面什么也没有。' : '炮眼。黑漆漆的。后面是展厅。') },
          { id: 'lampY', x: 7, y: 6, spr: 'streetlamp', light: { r: 3.6, col: 'rgba(255,200,120,.16)', dy: -8 }, on: S => S.narr('路灯底下飞着一团小虫。') },
          { id: 'mailbox', x: 11, y: 6, spr: 'mailbox', on: mailboxUse },
          { id: 'rooster', x: 4, y: 4, spr: 'rooster', on: S => S.narr('一只公鸡，脖子上的羽毛油亮亮的。\n基韦斯特满街都是这种野鸡。它歪着头看了你一眼——你忍不住想，这是不是同意的意思。') },
          { id: 'cat', x: 14, y: 4, spr: 'catbench', on: S => S.narr('长椅上蜷着一只橘猫。你数了数它的前爪：六个脚趾。\n它眯着眼，没理你。') }
        ],
        async enter(S, first) {
          if (first) {
            await S.narr('堡垒外面，夜风里有海水的咸味。\n马路对面是机场的铁丝网，跑道灯一闪一闪。');
          }
        }
      }
    }
  });

  /* ---------------- 人物 / 大头像的绘制 ---------------- */
  function sailor(R, d, G, lion) {
    const h = G.hT;
    R(4, h - 2, 8, 2, W_); R(3, h - 1, 10, 1, W_); R(4, h, 8, 1, NAVY);
    if (d === 3) { R(4, G.tT, 8, 3, NAVY); R(5, G.tT + 1, 6, 1, W_); R(9, h, 1, 3, NAVY); return; }
    if (d === 0) {
      R(4, G.tT, 8, 1, NAVY); R(4, G.tT + 1, 2, 1, NAVY); R(10, G.tT + 1, 2, 1, NAVY); R(7, G.tT + 1, 2, 1, RED);
      R(5, h + 3, 1, 1, '#8a7a60');
      if (lion) { R(5, G.tT + 2, 3, 3, MANE); R(7, G.tT + 2, 4, 2, LION); R(6, G.tT + 3, 1, 1, KK); }
    } else { R(5, G.tT, 5, 1, NAVY); R(8, h, 1, 2, NAVY); if (lion) { R(3, G.tT + 2, 3, 3, LION); R(3, G.tT + 1, 2, 2, MANE); } }
  }
  function robFace(R, a, t, angry) {
    const SK = '#d2c2a0', SK2 = '#b4a482', CR = '#8a7458';
    R(0, 0, 32, 32, '#0a0808');
    R(5, 26, 22, 6, W_); R(4, 27, 24, 2, NAVY); R(6, 29, 20, 1, W_); R(14, 27, 4, 3, RED);
    if (!angry) { R(20, 25, 9, 7, MANE); R(22, 26, 7, 6, LION); R(23, 28, 1, 1, KK); R(26, 28, 1, 1, KK); R(24, 30, 2, 1, '#6a3a1a'); }
    R(6, 8, 20, 18, SK); R(5, 10, 22, 13, SK); R(8, 25, 16, 2, SK2); R(24, 10, 2, 14, SK2);
    R(5, 8, 3, 7, HAIR); R(24, 8, 3, 6, HAIR); R(7, 7, 18, 2, HAIR);
    for (let i = 0; i < 6; i++) R(9 + i, 11 + (i % 2), 1, 1, CR);
    R(21, 16, 1, 4, CR); R(22, 19, 1, 3, CR); R(8, 20, 1, 3, CR);
    if (angry) { for (let i = 0; i < 9; i++) R(14 + i, 9 + i, 1, 1, CR); R(6, 15, 4, 1, CR); }
    const sh = (a * 3) | 0, ex = angry ? 0 : Math.min(1, sh);
    R(9, 13, 6, 6, KK); R(18, 13, 6, 6, KK);
    R(10 + ex, 14, 2, 2, '#e8e8e8'); R(19 + ex, 14, 2, 2, '#e8e8e8');
    R(10, 18, 4, 1, '#2a2a2a'); R(19, 18, 4, 1, '#2a2a2a');
    if (angry) { R(12, 16, 1, 1, '#ff2020'); R(21, 16, 1, 1, '#ff2020'); R(8, 11, 7, 1, KK); R(17, 11, 7, 1, KK); }
    R(15, 19, 2, 2, SK2);
    if (angry) { const op = Math.min(4, (a * 7) | 0); R(11, 22, 10, 1 + op, '#1a0505'); R(11, 22, 10, 1, '#6a2a2a'); for (let x = 12; x < 21; x += 2) R(x, 22 + op, 1, 1, '#d8d0b8'); }
    else { const up = a > .45 ? 1 : 0; R(13, 22, 6, 1, '#6a2a2a'); R(12, 22 - up, 1, 1, '#6a2a2a'); R(19, 22 - up, 1, 1, '#6a2a2a'); if (a > .7) { R(11, 21, 1, 1, '#6a2a2a'); R(20, 21, 1, 1, '#6a2a2a'); } }
    const tl = angry ? 2 : 0;
    R(5, 1 + tl, 22, 5, W_); R(3, 5 + tl, 26, 2, W_); R(5, 4 + tl, 22, 2, NAVY); R(25, 4 + tl, 2, 6, NAVY); R(6, 1 + tl, 20, 1, '#fffcf2');
  }
})();
