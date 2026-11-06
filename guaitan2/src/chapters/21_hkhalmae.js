/* ================= 第二十一夜 · 香港奶奶（卷三开篇） ================= */
(() => {
  /* 会话内计数（不进存档）：死过 / 坏结局过几次 → 重来时逐级给提示 */
  let FAILS = 0;
  const DIED = { phone: 0, win: 0, hide: 0 };
  const RING = { t: 0, n: 0, lit: 0, gap: true };   // 教务室电话的铃声（只在主机上跑）
  let lastSec = -1;

  /* ---------- 合成音效（双方都听得到） ---------- */
  const bell = (S, v = .07) => { S.tone('sine', 2900, 2760, .16, v); S.tone('sine', 3480, 3300, .12, v * .7, .07); };
  const meow = (S, v = .06) => { S.tone('sawtooth', 460, 820, .2, v, 0, 1500); S.tone('sawtooth', 820, 400, .5, v, .2, 1300); };
  const kitten = S => { S.tone('triangle', 900, 1300, .12, .05, 0, 3000); S.tone('triangle', 1300, 1000, .22, .05, .12, 3000); };
  const purr = S => { for (let i = 0; i < 4; i++) S.tone('sawtooth', 36, 44, .22, .09, i * .26, 260); };
  const sniff = S => { for (let i = 0; i < 3; i++) S.tone('sawtooth', 1800, 1500, .05, .025, i * .13, 5000); };
  const ring = S => { for (let i = 0; i < 8; i++) { const f = i % 2 ? 1180 : 960; S.tone('triangle', f, f, .045, .07, i * .055, 4200); } };
  const heart = S => { S.tone('sine', 62, 40, .12, .2); S.tone('sine', 56, 38, .12, .16, .18); };
  const chime = S => { [329.6, 261.6, 293.7, 196, 196, 293.7, 329.6, 261.6].forEach((f, i) => S.tone('sine', f, f, 1.1, .09, i * .6 + (i >= 4 ? .5 : 0))); };
  const ding = S => { S.tone('sine', 784, 784, .6, .09); S.tone('sine', 622, 622, .9, .09, .45); };

  /* ---------- 小工具 ---------- */
  function adjTo(S, id) {   // 走到玩家旁边的一格
    const m = curMap(), e = S.ent(id), p = W.pl, ex = Math.round(e.px / TS), ey = Math.round(e.py / TS);
    const c = [[p.x + 1, p.y], [p.x - 1, p.y], [p.x, p.y + 1], [p.x, p.y - 1]].filter(([x, y]) => passable(m, x, y, e));
    c.sort((a, b) => (Math.abs(a[0] - ex) + Math.abs(a[1] - ey)) - (Math.abs(b[0] - ex) + Math.abs(b[1] - ey)));
    return c[0] || [ex, ey];
  }
  const KIDS = ['minho', 'eunju', 'jihun', 'hyejin'];
  const talked = S => KIDS.filter(k => S.f['k_' + k]).length;
  function dutyLeft(S) {
    const l = [];
    if (!S.f.board) l.push('擦黑板');
    if (!(S.f.w1 && S.f.w2)) l.push('关窗');
    if (!S.f.bag) l.push('收拾课桌');
    return l;
  }
  async function classCheck(S) {
    const left = dutyLeft(S);
    if (!left.length && !S.f.kidsGone) await kidsLeave(S);
    if (S.f.kidsGone) S.goal(S.has('attend') ? '把出勤簿送到教务室（出门往右）' : '去讲台拿出勤簿，送到教务室');
    else S.goal('值日：' + left.join('、') + (talked(S) < 4 ? '　（也听听同学们在说什么）' : ''));
  }
  /* 没聊过的同学，走的时候也会在走廊里丢下最要紧的一句 */
  const LATE = {
    minho: ['敏浩', '喂，朴秀妍！记住——跟她说话，每句话最后都得加上「香港」！还有，她一百米只要十秒，跑不掉的！'],
    eunju: ['恩珠', '秀妍……她要看你的手，就手心朝上给她看，别让她看见指甲。还有，厕所第四间，千万别躲。'],
    jihun: ['智勋', '秀妍！我的时刻表在金老师抽屉里，帮我拿回来！……我爸说，她坐的就是下午去香港的那班。'],
    hyejin: ['惠珍', '朴秀妍，电话响不满四声不许接，窗外有人叫你也不许开窗。班长说的。']
  };
  async function kidsLeave(S) {
    S.f.kidsGone = true;
    S.face('hyejin', 'pl');
    await S.say('惠珍', ['好了，值日生做完了，大家回家！', '朴秀妍，讲台上的出勤簿别忘了送到教务室。']);
    S.sfx('open');
    await Promise.all(KIDS.map((k, i) => S.walk(k, [16, 2], 3.6 + i * .3)));
    KIDS.forEach(k => S.hide(k));
    for (const k of KIDS) if (!S.f['k_' + k]) { S.f['k_' + k] = 'late'; await S.say(LATE[k][0] + '（走廊里）', LATE[k][1]); }
    S.sfx('close');
    await S.narr('拉门「哐啷」一声合上。楼梯上一串脚步声，越来越远。\n教室里只剩下你一个人。');
  }

  /* ---------- 教务室：电话 ---------- */
  function startRing(S) {
    S.f.ringing = true; RING.t = 1.2; RING.n = 0; RING.gap = true; S.f.rn = 0;
    S.goal('电话响了……接电话（别忘了班长的话）');
    if (S.coop) S.toast('联机：一个人数铃声，另一个人去接');
  }
  async function earlyPick(S) {
    S.f.early = (S.f.early || 0) + 1;
    S.f.ringing = false; S.ent('phone').s.rg = false;
    S.sfx('switch');
    if (S.f.early >= 2) return phoneDie(S);
    await S.narr('「喂……？」');
    S.amb('none'); purr(S);
    await S.narr('听筒里没有人说话。\n只有一种很低、很低的声音——呼噜、呼噜。像是有什么东西，正把脸贴在听筒的另一头。');
    S.sfx('whisper');
    await S.say('听筒里', '……香港。', { style: 'whisper' });
    S.sfx('close'); S.shake(300, 2);
    await S.narr('你「啪」地一声把听筒扣了回去。');
    S.amb('school');
    await S.think('刚才……它响了几声？\n惠珍说过，响不满四声，不许接。');
    S.f.ringing = true; RING.n = 0; RING.gap = true; RING.t = 3; S.f.rn = 0;
    S.goal('电话又要响了……这次数清楚，响满四声再接');
  }
  async function phoneDie(S) {
    DIED.phone++;
    await S.narr('「喂——」');
    purr(S); S.amb('none');
    await S.scare('static', { sfx: 'whisper', dur: .8 });
    await S.die('听筒里，呼噜、呼噜的声音越来越响。\n像是有一只很大很大的猫，正趴在你的耳朵边上。\n「……找到你了。香港。」', '没响满四声');
  }
  async function momCall(S) {
    S.f.ringing = false; S.ent('phone').s.rg = false; S.f.called = true;
    S.sfx('switch');
    await S.narr('四声。\n你等第四声响完，才把听筒拿起来。');
    await S.say('妈妈（电话里）', ['喂？是秀妍吗？妈妈呀。', '妈妈在市场，今天收摊晚，八点多才能到家。钥匙在门口的牛奶箱里。', '……听说孩子们都在传什么，香港奶奶？别怕，那都是瞎编的。', '天黑了就别在学校磨蹭了。走大路，从天桥那边回来。路上别跟不认识的人说话，啊？']);
    await S.say('你', '嗯……知道了。');
    S.sfx('close');
    await S.narr('「咔嗒」。\n听筒放回去的一瞬间，教务室里静得能听见挂钟走。');
    await broadcast(S);
  }
  async function broadcast(S) {
    S.ent('speakerO').s.talk = true;
    ding(S); await S.wait(1200);
    await S.say('广播', '……放学时间已经过了。还在校内的同学，请马上离校。', { style: 'whisper' });
    S.sfx('tv'); S.ent('speakerO').s.talk = false;
    await S.wait(500);
    S.sfx('whisper');
    await S.narr('广播「滋啦」响了一声，像是没关好。\n杂音里，有一个很老、很老的声音，跟着念了一句：\n「……香港。」');
    S.fx('flash');
    await S.narr('窗外最后一点红，熄了。');
    setDusk(S);
    S.goal('下楼回家（楼梯在走廊右头）');
    S.cp('dusk');
  }
  function setDusk(S) {
    S.f.dusk = true;
    S.dark(.78, 'hall'); S.dark(.72, 'office');
    for (const id of ['hwin1', 'hwin2', 'hwin3', 'hwin4']) { const w = S.ent(id); w.s.night = true; w.light = { r: 2.4, col: 'rgba(90,110,170,.1)', dy: 20 }; }
    const o = S.ent('owin'); o.s.night = true; o.light = { r: 3, col: 'rgba(90,110,170,.1)', dy: 20 };
    S.amb('school');
  }

  /* ---------- 走廊：窗外的奶奶 ---------- */
  async function tapWin(S) {
    S.f.tapped = true;
    const w = S.ent('hwin3');
    S.sfx('knock'); await S.wait(350); S.sfx('knock');
    await S.narr('笃、笃。\n身边的窗户上，有人在敲玻璃。');
    w.s.shadow = true; heart(S);
    S.turn(3);
    await S.narr('窗玻璃外面，贴着一团影子。\n灰白的头发挽成一个髻。髻的两边，竖着两个尖尖的东西。');
    bell(S, .05);
    await S.say('窗外', ['秀妍啊——', '是奶奶呀。外面冷，开开窗，让奶奶进去暖和暖和。', '奶奶给你带辣炒年糕了。多给一勺。'], { style: 'whisper' });
    for (;;) {
      const r = await S.ask('……', ['（打开窗户）', '（不出声，往后退）', '（拉上窗帘）']);
      if (r === 0) {
        if (!S.f.winWarn) { S.f.winWarn = true; heart(S); await S.think('手已经摸到了窗户的插销——\n……等等。\n这里是三楼。'); continue; }
        return winDie(S);
      }
      if (r === 2) { w.s.curtain = true; S.sfx('close'); await S.narr('你一把拉上窗帘。\n帘子另一面，那团影子的手，慢慢地顺着玻璃往下滑。'); }
      else { S.sfx('step'); await S.narr('你屏住呼吸，一步一步往后退，直到后背贴上了墙。'); }
      break;
    }
    await S.say('窗外', '……乖孩子。', { style: 'whisper' });
    await S.narr('影子在玻璃上停了很久。\n然后，它往下一缩，不见了。\n……三楼的窗外，没有可以往下爬的地方。');
    w.s.shadow = false;
    S.cp('hide');
    await appear(S, false);
  }
  async function winDie(S) {
    DIED.win++;
    S.sfx('open'); S.ent('hwin3').open = true;
    await S.narr('插销「咔」地一声拨开了。\n冷风灌进来——还有一股，很浓很浓的猫的味道。');
    meow(S, .1);
    await S.scare('face', { face: 'halmaeCat', dur: 1 });
    await S.die('三楼的窗台上，蹲着一个白头发的老奶奶。\n她笑眯眯地说：「乖孩子。」', '窗外的奶奶');
  }

  /* ---------- 走廊：躲进厕所隔间（危险段） ---------- */
  async function appear(S, again) {
    const h = S.ent('halmaeH');
    S.f.hunt = true; S.f.hid = false;
    S.dark(.9); S.plr(2.6); S.amb('none'); S.norun(false);
    S.ent('st4').open = true;
    S.place('halmaeH', 26, 3, 1); h.alpha = 0; h.spr = '@halmae1';
    bell(S); await S.wait(450); bell(S);
    await S.narr(again ? '楼梯下面，又响起了那串铃铛声——' : '头顶的日光灯「啪」地灭了。\n叮铃……叮铃……楼梯下面，传来一串小铃铛的声音。一级，一级，往上走。');
    meow(S);
    await S.alpha('halmaeH', 1, 650);
    if (again && DIED.hide >= 2) await S.think('别往楼梯跑，也别愣着——\n往左跑，厕所在走廊左边的下面。第一到第三间都行。第四间不行！');
    else if (again) await S.think('厕所！第一到第三间，随便哪一间——\n第四间不行。');
    else await S.think('是她。楼梯被堵住了……\n躲起来！教室的门都锁了——厕所！');
    S.goal('躲进女厕所的隔间！（第四间不行）');
    S.bubble('halmaeH', '!', 900);
    S.chase('halmaeH', { spd: 3.2, wait: again ? 1.1 : .8, catch: caughtHall });
  }
  async function caughtHall(S) {
    DIED.hide++;
    S.sfx('sting');
    await S.scare('face', { face: 'halmaeCat', dur: 1 });
    await S.die('一只长着弯指甲的手，轻轻搭上了你的肩膀。\n耳边有人笑眯眯地问：「这么晚了，去哪儿呀？」', '被她找到了');
  }
  const STALL = [
    '第一间。门板上有人用铅笔写着：「敏浩是笨蛋」。',
    '第二间。门闩松了，要使劲往上抬才插得上。',
    '第三间。门底下塞着一卷用完的卫生纸芯。',
    '第四间。门上贴着一张纸：「故障」。\n门缝里黑黑的，有一股潮湿的味道。'
  ];
  async function hideStall(S, n) {
    if (!S.f.hunt) return S.narr(STALL[n - 1]);
    if (n === 4 && !S.f.st4w) {
      S.f.st4w = true;
      const r = await S.ask('第四间的门半开着，里面黑洞洞的，像是在等你进去。\n（恩珠说过：第四间，躲了也没用。）', ['还是躲进第四间', '换一间']);
      if (r === 1) return;
    }
    const st = S.ent('st' + n), h = S.ent('halmaeH');
    S.stop('halmaeH'); S.f.hunt = false;
    st.open = false; S.sfx('close');
    S.hidePlayer(true); S.pos(7 + n, 7, 0);
    await S.narr('你钻进隔间，反手插上门闩，踩着马桶边蹲了下去。\n门板底下，有一道细细的缝。');
    bell(S); await S.wait(500);
    await S.walk('halmaeH', [7, 6], 2.6);
    await S.walk('halmaeH', [7, 8], 2);
    for (let i = 1; i <= 4; i++) {
      await S.walk('halmaeH', [7 + i, 8], 1.8);
      S.face('halmaeH', 3); sniff(S); await S.wait(650);
      if (i === n && n === 4) return st4Die(S);
      if (i === n) {
        st.s.feet = true; heart(S); await S.wait(500); heart(S);
        await S.narr('门缝底下，停着一双白色的胶鞋。\n一动不动。');
        purr(S);
        const r = await S.ask('门外，一个很轻很轻的声音：\n「……里面，有人吗？」', ['（捂住嘴，一点声音也不出）', '「没、没有人……」', '「没有人……香港。」']);
        if (r === 1) return stallDie(S);
        if (r === 2) {
          await S.narr('门外静了一下。\n然后，传来一声很轻的、像是被逗笑了的鼻息。');
          await S.say('门外', '……乖。奶奶找的，不在这儿。', { style: 'whisper' });
        } else {
          heart(S); await S.wait(800); heart(S);
          await S.narr('你捂着嘴，连自己的心跳都嫌太响。\n过了很久很久——那双白胶鞋，挪开了。');
        }
        st.s.feet = false;
      } else if (i === 4) {
        S.sfx('open');
        await S.narr('「嘎吱——」\n第四间的门被拉开了。她在里面闻了很久，很久。');
      }
    }
    await S.say('门外', ['天黑了……', '回家的小孩，奶奶在路上等。'], { style: 'whisper' });
    await S.walk('halmaeH', [7, 6], 2.4);
    await S.walk('halmaeH', [25, 3], 3);
    bell(S);
    await S.alpha('halmaeH', 0, 900);
    S.hidePlayer(false); S.pos(7 + n, 8, 0);
    S.f.hid = true; S.plr(null); S.dark(.86); S.amb('school');
    await S.narr('铃铛声顺着楼梯，一级一级，往下去了。\n你在隔间里又蹲了好久，腿都麻了，才敢拔开门闩。');
    await S.think('她说……在路上等。\n可是不回家，又能去哪儿呢。');
    S.goal('下楼，回家（楼梯在走廊右头）');
  }
  async function stallDie(S) {
    DIED.hide++;
    await S.narr('话一出口，你就知道错了。\n门外的呼噜声，停了。');
    S.sfx('open');
    await S.scare('face', { face: 'halmaeCat', dur: 1 });
    await S.die('「找到了。」\n门闩自己弹开了。\n……她说话的时候，最后没有加上那两个字。你也没有。', '有人吗');
  }
  async function st4Die(S) {
    DIED.hide++;
    S.sfx('open');
    await S.narr('门缝底下的那双白胶鞋，停在了你的门前。\n第四间的门，根本插不上门闩。');
    await S.scare('face', { face: 'halmaeCat', dur: 1 });
    await S.die('门「嘎吱」一声，被拉开了。\n恩珠说得对——第四间，躲了也没用。', '第四间');
  }

  /* ---------- 天桥底下：问答 ---------- */
  const goalTxt = S => '回答她的问题（每句最后加「香港」）　答错：' + '●'.repeat(S.f.strikes || 0) + '○'.repeat(3 - (S.f.strikes || 0));
  function setStage(S, st) { const h = S.ent('halmaeS'); h.spr = '@halmae' + st; S.f.stage = st; }
  async function encounter(S, retry) {
    const f = S.f;
    if (!retry) S.cp('qa');
    f.met = true; f.ph = 'qa'; f.strikes = 0; f.qi = 0; f.qt = 45;
    S.amb('none'); setStage(S, 0);
    if (!retry) {
      S.focus(37, 3);
      await S.narr('天桥的台阶底下，坐着一个老奶奶。\n白头发在脑后挽成一个髻，白色的短上衣，深蓝的长裙子。脚边放着一个红布包袱。');
      bell(S);
      await S.narr('她腰上挂着一只小铜铃。\n风一吹，「叮铃」一声。');
      S.focus(null);
      await S.say('老奶奶', '……小朋友。', { style: 'whisper' });
      await S.walk('halmaeS', adjTo(S, 'halmaeS'), 1.6);
    } else {
      await S.walk('halmaeS', adjTo(S, 'halmaeS'), 3.2);
      await S.narr('路灯底下，她还歪着头站在那里。\n像是从来没有走开过。');
      if (FAILS >= 2) await S.think('（往西南。下午两点二十起飞，飞三个半钟头，是首尔的五点五十——香港的钟慢一小时：四点五十。\n地图上 10.5 厘米，一厘米两百公里：两千一百公里。）');
      else if (FAILS >= 1) await S.think('（每句末尾加「香港」。手心朝上。\n方向看地图，时间看时刻表、别忘了时差，距离用比例尺——想清楚再答。）');
    }
    S.face('halmaeS', 'pl'); S.face('pl', 'halmaeS');
    if (f.cat) { const p = W.pl, m = curMap(), c = [[p.x - 1, p.y], [p.x, p.y + 1], [p.x, p.y - 1], [p.x + 1, p.y]].find(([x, y]) => passable(m, x, y, S.ent('nabi'))); if (c) S.place('nabi', c[0], c[1], 2); }
    if (S.coop) S.toast('联机：一个人按 J 翻「笺」找答案念给同伴，另一个人回答');
    S.goal(goalTxt(S));
    await runQA(S);
  }
  const QS = [qWhere, qHands, qDir, qTime, qDist, qLast];
  async function runQA(S) {
    while (S.f.qi < QS.length) {
      const r = await QS[S.f.qi](S);
      if (r === 'end') return;
      if (r === true) { S.f.qi++; S.f.qt = 45; await afterQ(S, S.f.qi); }
    }
  }
  /* 每答对一题，她的脸就更像猫一点 */
  async function afterQ(S, qi) {
    if (qi === 1) { await S.narr('她笑了。眼睛眯成了两条缝。'); return; }
    if (qi === 2) {
      setStage(S, 1); S.sfx('whisper');
      await S.narr('她低头看了看你摊开的手心，点了点头。\n再抬起头的时候——白发髻的两边，多出来两个尖尖的东西。\n像耳朵。');
      return;
    }
    if (qi === 3) {
      setStage(S, 2);
      await S.scare('face', { face: 'halmae', dur: 1.1, sfx: 'sting' });
      await S.narr('她把脸凑到路灯底下。\n左边半张，是满是皱纹的老奶奶的脸。右边半张，长满了灰白的短毛——\n一只黄色的眼睛，瞳孔细得像一根针。');
      return;
    }
    if (qi === 4) { meow(S, .04); await S.narr('她的嘴边，慢慢钻出了几根白白的胡须。\n她自己好像一点也没有察觉。'); return; }
    if (qi === 5) {
      setStage(S, 3);
      await S.narr('现在，她整张脸都是猫的了。\n可那双黄眼睛里……好像有一点点湿。');
    }
  }
  async function strike(S, her, hint1, hint2) {
    S.clearTimer();
    S.f.strikes = (S.f.strikes || 0) + 1;
    const k = S.f.strikes;
    if (k >= 3) { await badEnd(S); return 'end'; }
    S.ent('halmaeS').s.claw = k;
    if (k === 1) {
      S.sfx('sting'); S.shake(300, 2);
      if (her) await S.say('老奶奶', her, { style: 'whisper' });
      await S.narr('她的手从袖子里伸了出来。\n指甲又长又弯，在路灯底下闪了一下。');
      await S.say('老奶奶', '……奶奶再问一遍哦。', { style: 'whisper' });
    } else {
      if (her) await S.say('老奶奶', her, { style: 'whisper' });
      await S.scare('face', { face: 'halmae', dur: 1, sfx: 'scare' });
      await S.narr('她弯下腰，那半张猫脸几乎贴到了你的鼻尖。\n指甲轻轻地，搭在了你的肩膀上。');
      await S.say('老奶奶', '最后一次了哦。', { style: 'whisper' });
    }
    const h = k >= 2 && hint2 ? hint2 : hint1;
    if (h) await S.think(h);
    S.f.qt = 40;
    S.goal(goalTxt(S));
    return false;
  }
  const KEND = '（每句话最后，都要说「香港」。）';
  async function askKey(S, prompt, keys, len, alias) {
    if (S.timerLeft == null) S.timer(S.f.qt || 45, '她在数', onTimeout, { during: true });
    for (;;) {
      const v = await S.keypad(prompt, keys, len, { sep: '|', alias });
      if (v != null) { S.clearTimer(); return v.split('|'); }
      await S.say('老奶奶', '……嗯？奶奶等着呢。', { style: 'whisper' });
    }
  }
  async function onTimeout(S) {
    S.f.qt = 40;
    const r = await strike(S, '……奶奶数完了哦。', '（来不及了……先想好再开口。按 J 可以翻笔记。）', '（来不及了……笔记里都有，按 J 翻一翻。）');
    if (r === 'end') return;
    await runQA(S);
  }
  async function qWhere(S) {
    const opts = ['回家。', '回家……香港。', '（低着头，不说话）'];
    if (!S.f.ran) opts.push('（转身往学校跑）');
    const r = await S.ask('「这么晚了，小朋友，去哪儿呀？」', opts, '老奶奶');
    if (r === 1) { await S.say('老奶奶', '……乖。'); return true; }
    if (r === 3) {
      S.f.ran = true; S.turn(1); S.sfx('step');
      await S.narr('你转身就往学校的方向跑——');
      const p = W.pl, m = curMap(), h = S.ent('halmaeS');
      if (passable(m, p.x - 1, p.y, h)) S.place('halmaeS', p.x - 1, p.y, 2);
      bell(S); S.shake(300, 2);
      await S.narr('才跑出两步，铃铛声就在前面响了。\n她站在你面前，连气都没喘。');
      await S.say('老奶奶', '一百米，奶奶只要十秒哦。', { style: 'whisper' });
      S.face('pl', 'halmaeS'); S.face('halmaeS', 'pl');
      return false;
    }
    if (r === 0) return strike(S, '……回家？', '（敏浩说过——跟她说话，每句话最后都要加上「香港」。）');
    return strike(S, '……不理奶奶？', '（不说话也不行……要回答她，最后加上「香港」。）');
  }
  async function qHands(S) {
    const r = await S.ask('「来，让奶奶看看你的手。」', ['（把手背伸给她）……给您看，香港。', '（手心朝上，摊开）……给您看。', '（手心朝上，摊开）……给您看，香港。', '（把手藏到身后）'], '老奶奶');
    if (r === 2) return true;
    if (r === 0) return strike(S, '……指甲，好干净啊。', '（恩珠说过：别让她看见指甲——手心朝上。）');
    if (r === 1) return strike(S, '……然后呢？', KEND);
    return strike(S, '……藏什么呀？', '（藏起来也没用。恩珠是怎么给我看的——手心朝上。）');
  }
  const DIRK = ['东', '南', '西', '北', '香港'], DIGK = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0', '香港'];
  const ALD = { E: '东', S: '南', W: '西', N: '北', H: '香港' }, ALN = { H: '香港' };
  async function qDir(S) {
    const a = await askKey(S, '「香港……往哪边走啊？」\n（按两个方向，最后按「香港」）', DIRK, 3, ALD);
    if (a[2] !== '香港') return strike(S, '……句尾呢？', KEND);
    const d = a[0] + a[1];
    if (d === '西南' || d === '南西') { await S.say('老奶奶', '西南边啊……'); return true; }
    if (d === '东北' || d === '北东') return strike(S, '……那边？那边是江原道的山呀。', '（社会科附图：上北下南、左西右东——香港在地图的哪一角？）', '（香港在地图的左下角。左是西，下是南。）');
    return strike(S, '……是这边吗？奶奶怎么觉得不对呢。', '（社会科附图上，香港在首尔的哪一边？）', '（香港在地图的左下角。左是西，下是南。）');
  }
  async function qTime(S) {
    const a = await askKey(S, '「奶奶坐的是下午那班飞机……\n到了香港，是香港的几点几分呀？」\n（按四位数，例如 09:30 按 0930；最后按「香港」）', DIGK, 5, ALN);
    if (a[4] !== '香港' || a.slice(0, 4).includes('香港')) return strike(S, '……句尾呢？', KEND);
    const t = a.slice(0, 4).join('');
    if (t === '1650') { await S.say('老奶奶', '四点五十……天还亮着呢。'); return true; }
    const H2 = '（下午那班 14:20 起飞，飞 3 小时 30 分，是首尔的 17:50。香港的钟比首尔慢一小时……）';
    if (t === '1750') return strike(S, '……那是这儿的钟呀。', '（香港用东经 120° 的时间，首尔用 135°——差了一小时。）', '（17:50 是首尔的钟。香港的钟，要往回拨一小时。）');
    if (t === '1850') return strike(S, '……钟，是往前拨，还是往回拨呀？', '（社会科附图：越往西，钟越慢。）', '（香港在西边，钟要往回拨一小时。）');
    if (t === '1420') return strike(S, '那是飞机起飞的时候。奶奶问的是，到的时候。', '（起飞 14:20，还要飞三个半钟头……）', H2);
    if (t === '1010' || t === '1350' || t === '1250') return strike(S, '……奶奶坐的，是下午那班。', '（时刻表上去香港的有两班——下午的是哪一班？）', H2);
    return strike(S, '……不对呀。', '（时刻表：下午去香港那班几点起飞、飞多久？到了还要换成香港的钟。）', H2);
  }
  async function qDist(S) {
    const a = await askKey(S, '「香港……离这儿有多远呀？」\n（几公里？按四位数，最后按「香港」）', DIGK, 5, ALN);
    if (a[4] !== '香港' || a.slice(0, 4).includes('香港')) return strike(S, '……句尾呢？', KEND);
    const t = a.slice(0, 4).join('');
    if (t === '2100') { await S.say('老奶奶', '两千一百公里……'); return true; }
    const H2 = '（地图上首尔到香港 10.5 厘米。1 厘米是 200 公里——10.5 × 200……）';
    if (t === '1050') return strike(S, '……那么近吗？', '（比例尺：1 厘米是 200 公里，不是 100。）', H2);
    if (t === '1200') return strike(S, '那是去东京的路吧。', '（6 厘米那条线是东京。香港那条是多少厘米？）', H2);
    return strike(S, '……奶奶走了好久了，没那么……', '（社会科附图上那条铅笔线，再乘上比例尺。）', H2);
  }
  async function qLast(S) {
    const opts = ['去得成。坐下午两点二十那班，往西南飞两千一百公里，香港的四点五十就到了……香港。', '……去不成了。奶奶，您已经……'];
    if (S.f.cat) opts.push('（抱起娜比）……奶奶，娜比一直在校门口等您。我们回家吧，香港。');
    await S.say('老奶奶', ['……奶奶要去看儿子。他在香港的码头上干活，好几年没回来了。', '那天，奶奶坐上了飞机……后来，就怎么也走不到了。']);
    const r = await S.ask('「小朋友……奶奶，还去得成香港吗？」', opts, '老奶奶');
    if (r === 0) { await endHK(S); return 'end'; }
    if (r === 2) { await endHome(S); return 'end'; }
    return strike(S, '……奶奶不爱听这个。', '（她只想知道路……要好好回答她，最后加上「香港」。）');
  }

  /* ---------- 结局 ---------- */
  async function badEnd(S) {
    FAILS++;
    S.clearTimer(); S.f.ph = 'bad';
    setStage(S, 3);
    await S.say('老奶奶', '……第三次了呀。', { style: 'whisper' });
    meow(S, .1);
    await S.scare('face', { face: 'halmaeCat', dur: 1.1 });
    S.amb('none');
    await S.fade(1, 900);
    bell(S); await S.wait(800); bell(S, .04);
    await S.end({ bad: true, id: 'claw', title: '答错了第三次', text: '第二天早上，扫马路的大叔在天桥的台阶上捡到一个红布包袱。\n包袱里包着一只小小的红书包。\n\n那年夏天，新林洞的孩子们又多了一条规矩：\n天桥底下的奶奶问你话，要想好了再答。' });
  }
  async function endHK(S) {
    S.f.ph = 'after'; S.f.done = 'hk'; S.clearTimer();
    await S.narr('她跟着你的话，一个字一个字地念：');
    await S.say('老奶奶', ['……下午两点二十。往西南。', '两千一百公里。香港的钟……四点五十。'], { style: 'whisper' });
    await S.narr('她慢慢点了点头。毛茸茸的脸上，那双黄眼睛弯了起来。');
    await S.say('老奶奶', ['那么远啊。', '奶奶腿脚慢，得走好久好久呢。', '……谢谢你啊，小朋友。香港。']);
    S.give('candy');
    await S.narr('她从包袱里摸出一颗用纸包着的薄荷糖，放进你的手心。\n——手心朝上的那只手。');
    S.goal('');
    bell(S);
    await S.walk('halmaeS', [33, 7], 1.6);
    await S.walk('halmaeS', [27, 7], 1.6);
    bell(S, .04);
    await S.alpha('halmaeS', 0, 1500);
    await S.narr('铃铛声顺着马路，往西南边去了。\n越来越轻，越来越轻。');
    S.amb('night');
    S.goal('回家（天桥那边，蓝色的铁门）');
  }
  async function endHome(S) {
    S.f.ph = 'after'; S.f.done = 'home'; S.clearTimer();
    const h = S.ent('halmaeS');
    S.follow('nabi', false);
    await S.narr('你蹲下去，把娜比抱了起来。它瘦得只剩一把骨头，轻轻的。');
    kitten(S);
    await S.narr('娜比冲着她，「喵」地叫了一声。');
    await S.say('老奶奶', '……娜比？', { style: 'whisper' });
    setStage(S, 2); await S.wait(500); setStage(S, 1); await S.wait(500); setStage(S, 0);
    await S.narr('她脸上的毛，一点一点地褪了下去。\n胡须没了，尖耳朵没了。那双黄眼睛，变回了老人家浑浊的、湿湿的眼睛。');
    S.hide('nabi'); h.spr = '@halmaeC';
    await S.say('尹奶奶', ['娜比啊……你怎么瘦成这样了。', '奶奶不是说了吗，下个月就回来……', '……奶奶这是走了多远的路啊。']);
    await S.narr('她把腰上那只小铜铃解下来，系回了娜比空着的项圈上。\n「叮铃」。');
    bell(S, .05);
    await S.say('尹奶奶', ['香港……不去了。儿子在那边好好的，就行了。', '奶奶回家。']);
    await S.say('尹奶奶', ['……你是五年级的秀妍吧？以前总来买年糕，非要多放鱼饼的那个。', '快回家吧。天黑了，你妈妈该着急了。']);
    S.goal('');
    await S.walk('halmaeS', [40, 4], 1.4);
    await S.walk('halmaeS', [42, 4], 1.4);
    bell(S, .04);
    await S.alpha('halmaeS', 0, 1600);
    await S.narr('她抱着娜比，顺着坡上的路，慢慢地走远了。\n那一片的房子，有一扇窗户，好像亮了一下。');
    S.amb('night');
    S.goal('回家（蓝色的铁门）');
  }
  async function homeGate(S) {
    if (!S.f.done) return S.narr('你家的蓝色铁门。\n……可是天桥底下，还坐着那个人。');
    S.sfx('open');
    await S.narr('你从牛奶箱里摸出钥匙，推开蓝色的铁门。');
    await S.fade(1, 900);
    await S.card('晚上八点四十分', '', '家里黑着。你打开灯，坐在电话旁边。\n\n电话响了。\n一声。两声。三声。\n\n四声。');
    if (S.f.done === 'home') {
      await S.card('第二天早上', '1989年6月24日（星期六）', '校门口那辆盖着蓝塑料布的年糕摊，被人收拾得干干净净。\n塑料布叠得方方正正，压在车把上。\n\n娜比再也没有在校门口出现过。\n\n恩珠说，昨天晚上她路过坡上那条巷子，\n听见有一户人家的院子里，铃铛一直在响。');
      return S.end({ id: 'home', title: '第二十一夜　完（回家的路）', text: '那年暑假一过，关于香港奶奶的传闻，就像退潮一样没人再提了。\n\n只有秀妍知道——\n她没有去香港。\n她回家了。' });
    }
    await S.card('第二天早上', '1989年6月24日（星期六）', '电话是妈妈打来的。她说市场里人太多，又晚了半个钟头。\n\n秀妍没有告诉任何人天桥底下的事。\n那颗薄荷糖，她一直没舍得吃。\n糖纸上歪歪扭扭地写着两个字：「谢谢」。');
    await S.end({ id: 'hk', title: '第二十一夜　完', text: '那年暑假一过，关于香港奶奶的传闻，就像退潮一样没人再提了。\n\n很多年以后，秀妍第一次坐飞机去香港。\n飞机往西南飞了三个多钟头。降落之前，她把手表往回拨了一个小时。\n\n窗外的海边，好像有一个白头发的老奶奶，正慢慢地走。' + (S.f.cartRead ? '' : '\n\n（校门口那辆盖着蓝塑料布的年糕摊，你还没有仔细看过。）') });
  }

  /* ---------- 人物 ---------- */
  const HB = '#e6e2d8', CATC = '#7a7670';
  function hmX(st, hold) {
    return (g, d, fr, G, R) => {
      const h = G.hT, nv = '#262c48', nv2 = '#1a1f36', sh = '#f0eee6';
      if (d === 0 || d === 3) { R(3, G.tB - 1, 10, 22 - G.tB, nv); R(11, G.tB - 1, 2, 22 - G.tB, nv2); R(5, 22, 2, 1, sh); R(9, 22, 2, 1, sh); }
      else { R(4, G.tB - 1, 9, 22 - G.tB, nv); R(5, 22, 3, 1, sh); }
      if (d === 0) { R(7, G.tT + 1, 1, 3, '#a02a3a'); R(8, G.tT + 2, 1, 3, '#a02a3a'); }   // 短上衣的飘带
      if (!hold && d !== 3) R(d === 0 ? 10 : 6, G.tB - 2, 1, 1, '#e0b840');                // 腰上的小铜铃
      if (hold) {   // 怀里抱着娜比
        if (d === 0) { R(4, G.tT + 2, 8, 4, CATC); R(4, G.tT + 1, 2, 1, CATC); R(10, G.tT + 1, 2, 1, CATC); R(6, G.tT + 3, 1, 1, '#e8c030'); R(9, G.tT + 3, 1, 1, '#e8c030'); R(5, G.tT + 5, 6, 1, '#5a5650'); }
        else if (d === 1) { R(1, G.tT + 2, 6, 4, CATC); R(1, G.tT + 1, 2, 1, CATC); }
      }
      if (st >= 1) {
        if (d === 0 || d === 3) { R(4, h - 2, 2, 2, HB); R(10, h - 2, 2, 2, HB); R(4, h - 3, 1, 1, HB); R(11, h - 3, 1, 1, HB); if (d === 0) { R(5, h - 1, 1, 1, '#d89aa0'); R(10, h - 1, 1, 1, '#d89aa0'); } }
        else { R(6, h - 2, 2, 2, HB); R(6, h - 3, 1, 1, HB); }
        if (d === 0) { R(6, h + 4, 1, 2, '#e8c030'); R(9, h + 4, 1, 2, '#e8c030'); }
        else if (d === 1) R(5, h + 4, 1, 2, '#e8c030');
      }
      if (st >= 2) {
        if (d === 0) { R(6, h + 5, 1, 1, '#140c08'); R(9, h + 5, 1, 1, '#140c08'); R(1, h + 5, 3, 1, '#f2eee6'); R(12, h + 5, 3, 1, '#f2eee6'); R(2, h + 6, 2, 1, '#d8d4cc'); R(12, h + 6, 2, 1, '#d8d4cc'); R(7, h + 5, 2, 1, '#c86a78'); }
        else if (d === 1) { R(5, h + 5, 1, 1, '#140c08'); R(1, h + 5, 3, 1, '#f2eee6'); R(4, h + 5, 1, 1, '#c86a78'); }
        if (d !== 3 && !hold) { R(2, G.tB - 1, 1, 2, '#f4f0e6'); if (d === 0) R(13, G.tB - 1, 1, 2, '#f4f0e6'); }   // 弯指甲
      }
      if (st >= 3 && d === 0) { R(4, h + 2, 1, 5, '#a8a298'); R(11, h + 2, 1, 5, '#a8a298'); R(5, h + 1, 6, 1, '#b8b2a6'); R(6, h + 6, 4, 1, '#3a1a1a'); R(6, h + 7, 1, 1, '#fff'); R(9, h + 7, 1, 1, '#fff'); }
    };
  }
  const HM = (st, hold) => ({ key: 'hk-halmae' + st + (hold ? 'c' : ''), skin: st >= 3 ? '#cfc6b6' : '#e2c4a4', hair: HB, hs: 'bun', top: '#efe9dc', top2: '#efe9dc', bottom: '#262c48', shoes: '#f0eee6', eye: '#2a1a14', extra: hmX(st, hold) });
  const PEOPLE = {
    me: { key: 'hk-suyeon', skin: '#f1c9a5', hair: '#1e1618', hs: 'bob', top: '#f4f1e8', top2: '#d04050', bottom: '#2a3a6a', skirt: true, shoes: '#e8e4dc', child: true,
      extra(g, d, fr, G, R) { if (d === 3) { R(4, G.tT, 8, 6, '#c03838'); R(4, G.tT, 8, 1, '#7a1a1a'); } else if (d === 1) R(10, G.tT, 3, 5, '#c03838'); else R(5, G.tT + 2, 2, 1, '#e8e8e8'); } },
    teacher: { key: 'hk-kim', skin: '#ecc8a6', hair: '#3a2418', hs: 'short', top: '#8a5a6a', top2: '#f0e8e0', bottom: '#4a3a40', skirt: true, shoes: '#2a2020',
      extra(g, d, fr, G, R) { if (d === 0) { R(3, G.hT, 1, 5, '#3a2418'); R(12, G.hT, 1, 5, '#3a2418'); R(5, G.hT - 1, 6, 1, '#3a2418'); } } },
    minho: { key: 'hk-minho', skin: '#dcac84', hair: '#141010', hs: 'messy', top: '#3a7ac0', top2: '#e8e8e8', bottom: '#3a3a4a', shoes: '#e0e0e0', child: true,
      extra(g, d, fr, G, R) { if (d !== 3) { R(4, G.tT + 2, 8, 1, '#e8e8e8'); R(4, G.tT + 5, 8, 1, '#e8e8e8'); } } },
    eunju: { key: 'hk-eunju', skin: '#f3d0b0', hair: '#2a1a14', hs: 'twin', top: '#e8a0b8', top2: '#f8e8ec', bottom: '#8a5a7a', skirt: true, shoes: '#f0e0e0', child: true,
      extra(g, d, fr, G, R) { const a = G.tB - G.tT - 1; R(3, G.tT + a, 1, 1, '#e8a0b8'); R(12, G.tT + a, 1, 1, '#c88098'); } },   // 手缩在袖子里
    jihun: { key: 'hk-jihun', skin: '#eec4a0', hair: '#1a1414', hs: 'short', top: '#5a7a4a', top2: '#e8e8e0', bottom: '#2a2a3a', shoes: '#5a4a3a', child: true,
      extra(g, d, fr, G, R) { if (d === 0) { R(5, G.hT + 4, 2, 1, '#8a9aa8'); R(9, G.hT + 4, 2, 1, '#8a9aa8'); R(7, G.hT + 4, 2, 1, '#3a3a3a'); } else if (d === 1) R(5, G.hT + 4, 2, 1, '#8a9aa8'); } },
    hyejin: { key: 'hk-hyejin', skin: '#f1cba8', hair: '#1a1414', hs: 'bob', top: '#f0f0f0', top2: '#2a3a6a', bottom: '#2a3a6a', skirt: true, shoes: '#e8e8e8', child: true,
      extra(g, d, fr, G, R) { if (d === 0) { R(3, G.hT + 1, 10, 1, '#c03040'); R(3, G.tT + 2, 1, 2, '#e8c030'); } else if (d === 1) R(7, G.tT + 2, 3, 2, '#e8c030'); } },   // 发箍、班长袖标
    halmae0: HM(0), halmae1: HM(1), halmae2: HM(2), halmae3: HM(3), halmaeC: HM(0, true)
  };

  /* ---------- 惊吓大头像（32×32） ---------- */
  const FACES = {
    halmae(R, a, t) {   // 半人半猫：左半张是老奶奶，右半张是猫
      const sk = '#e2c4a4', sk2 = '#c8a888', wr = '#a88a6e', hb = '#ebe7de', hb2 = '#c8c4ba', fur = '#d6d0c4', fur2 = '#8e887c';
      R(12, 0, 8, 3, hb); R(11, 1, 10, 2, hb2); R(13, 1, 6, 1, '#fff');
      R(8, 3, 14, 5, hb); R(7, 4, 2, 8, hb); R(9, 3, 3, 1, hb2); R(6, 7, 1, 6, hb2);
      R(21, 0, 2, 2, fur); R(20, 2, 4, 2, fur); R(20, 4, 5, 4, fur); R(21, 3, 2, 3, '#d4909a');   // 猫耳从白发里竖出来
      R(9, 8, 7, 18, sk); R(10, 26, 6, 2, sk); R(8, 10, 1, 13, sk2);
      R(16, 7, 8, 19, fur); R(24, 9, 2, 14, fur); R(16, 26, 6, 2, fur); R(26, 12, 1, 8, fur);
      for (let y = 8; y < 26; y += 3) R(16 + (y % 2), y, 1, 1, sk);
      R(19, 8, 4, 1, fur2); R(18, 10, 5, 1, fur2); R(24, 11, 2, 1, fur2); R(23, 23, 3, 1, fur2); R(17, 25, 3, 1, fur2);
      R(10, 14, 4, 2, '#f2ece2'); R(11, 14, 2, 2, '#2a1a14'); R(9, 13, 6, 1, wr); R(9, 17, 5, 1, wr); R(9, 18, 4, 1, sk2);   // 人的眼睛，眼角的皱纹
      R(10, 20, 1, 4, wr); R(13, 24, 3, 1, '#7a4a40'); R(11, 11, 3, 1, wr);
      R(18, 12, 6, 5, '#e8c030'); R(18, 12, 6, 1, '#b08a20'); R(19, 13, 1, 1, '#fff4c0');                                // 猫眼，竖瞳越来越细
      const pw = a > .5 ? 1 : 2; R(21 - (pw > 1 ? 1 : 0), 12, pw, 5, '#120806');
      if (a > .7) R(18, 17, 6, 1, 'rgba(232,192,48,.35)');
      R(15, 19, 3, 2, '#d0707a'); R(16, 21, 1, 2, '#5a2a2a'); R(16, 23, 6, 1, '#3a1a1a'); R(20, 24, 1, 2 + (a > .6 ? 1 : 0), '#f6f2e8');
      R(23, 20, 9, 1, '#f4f0e8'); R(23, 22, 9, 1, '#f4f0e8'); R(22, 24, 8, 1, '#e8e4dc');
      R(9, 28, 14, 4, '#efe9dc'); R(15, 28, 2, 4, '#a02a3a');
    },
    halmaeCat(R, a, t) {   // 整张脸都是猫：张开的嘴、獠牙，头顶还留着那个白发髻
      const fur = '#d0c9bc', fur2 = '#8a8478', hb = '#ebe7de';
      R(12, 0, 8, 3, hb); R(11, 1, 10, 2, '#c8c4ba');
      R(5, 1, 3, 3, fur); R(4, 3, 6, 4, fur); R(6, 3, 2, 3, '#d4909a');
      R(24, 1, 3, 3, fur); R(22, 3, 6, 4, fur); R(24, 3, 2, 3, '#d4909a');
      R(5, 6, 22, 20, fur); R(3, 10, 2, 12, fur); R(27, 10, 2, 12, fur); R(7, 26, 18, 3, fur);
      R(10, 7, 12, 1, fur2); R(9, 9, 3, 1, fur2); R(20, 9, 3, 1, fur2); R(15, 6, 2, 4, fur2); R(4, 15, 2, 1, fur2); R(26, 15, 2, 1, fur2);
      R(7, 12, 7, 5, '#f0c828'); R(18, 12, 7, 5, '#f0c828'); R(7, 12, 7, 1, '#b08a20'); R(18, 12, 7, 1, '#b08a20');
      const pw = a > .4 ? 1 : 2; R(10, 12, pw, 5, '#0e0604'); R(21, 12, pw, 5, '#0e0604');
      R(8, 13, 1, 1, '#fff6c8'); R(19, 13, 1, 1, '#fff6c8');
      R(14, 18, 4, 2, '#d0707a'); R(15, 20, 2, 1, '#5a2a2a');
      const o = 2 + Math.round(Math.min(1, a * 1.5) * 5);
      R(11, 21, 10, o, '#2a0606'); R(10, 21, 1, Math.max(1, o - 1), '#4a1010'); R(21, 21, 1, Math.max(1, o - 1), '#4a1010');
      R(12, 21, 1, 3, '#f6f2e8'); R(19, 21, 1, 3, '#f6f2e8'); R(13, 19 + o, 1, 2, '#f0ece2'); R(18, 19 + o, 1, 2, '#f0ece2');
      if (o > 4) R(13, 20 + o - 1, 6, 1, '#a04050');
      R(0, 19, 9, 1, '#f4f0e8'); R(0, 21, 10, 1, '#f4f0e8'); R(23, 19, 9, 1, '#f4f0e8'); R(22, 21, 10, 1, '#f4f0e8');
      R(9, 29, 14, 3, '#efe9dc'); R(15, 29, 2, 3, '#a02a3a');
    }
  };

  /* ---------- 自定义道具 ---------- */
  const SPR21 = {
    kboard(g, e, t, R) {   // 黑板 + 上方的太极旗；text：今天的字和角落里的粉笔画
      SPR.blackboard(g, e, t, R);
      R(3, -9, 10, 7, '#f2efe6'); R(3, -9, 10, 1, '#c8c4b8');
      R(7, -8, 2, 1, '#c8303a'); R(6, -7, 4, 1, '#c8303a'); R(6, -6, 4, 1, '#2a4a9a'); R(7, -5, 2, 1, '#2a4a9a');
      R(4, -8, 1, 1, '#222'); R(11, -8, 1, 1, '#222'); R(4, -4, 1, 1, '#222'); R(11, -4, 1, 1, '#222');
      if (e.text) { const c = 'rgba(224,228,216,.75)'; R(16, 3, 1, 2, c); R(20, 3, 1, 2, c); R(16, 5, 5, 4, 'rgba(224,228,216,.35)'); R(17, 6, 1, 1, '#e8d050'); R(19, 6, 1, 1, '#e8d050'); R(14, 7, 2, 1, c); R(21, 7, 2, 1, c); }
    },
    swin(g, e, t, R) {   // 教室窗户（墙面）。open：开着，窗帘飘；face：对面楼顶上，一闪而过蹲着的影子
      R(1, 0, 14, 13, '#6a6a60');
      const sky = e.s.night ? ['#1e2240', '#2e3050'] : ['#e8783a', '#f0b060'];
      R(2, 1, 12, 6, sky[0]); R(2, 7, 12, 4, sky[1]); R(2, 9, 12, 2, e.s.night ? '#141420' : '#5a2a22');
      R(2, 8, 5, 1, e.s.night ? '#141420' : '#6a3428'); R(9, 7, 5, 2, e.s.night ? '#141420' : '#6a3428');
      if (e.face) { R(10, 4, 3, 3, '#140c0e'); R(10, 3, 1, 1, '#140c0e'); R(12, 3, 1, 1, '#140c0e'); R(9, 6, 5, 2, '#140c0e'); R(11, 5, 1, 1, '#f0c828'); }
      R(7, 1, 1, 11, '#6a6a60'); R(2, 6, 12, 1, '#6a6a60');
      if (e.open) { R(8, 1, 6, 11, 'rgba(255,220,180,.22)'); const s = Math.round(Math.sin(t * 3 + e.x) * 1.5); R(11 + s, 0, 3, 13, '#e8e2c8'); R(12 + s, 0, 1, 13, '#d0c8a8'); }
      R(1, 12, 14, 2, '#8a8a80');
    },
    hwin(g, e, t, R) {   // 走廊窗户（墙面）。night：夜色；shadow：贴在玻璃上的人影；curtain：拉上了窗帘
      R(1, 0, 14, 13, '#5a5e58');
      R(2, 1, 12, 10, e.s.night ? '#141a2a' : '#c87a48'); R(2, 7, 12, 4, e.s.night ? '#0c1018' : '#8a4a30');
      if (e.s.night) { R(4, 3, 1, 1, '#c8d0e0'); R(11, 2, 1, 1, '#8a90a0'); }
      if (e.s.shadow) { const c = 'rgba(14,10,14,.9)'; R(5, 2, 6, 2, c); R(6, 1, 4, 1, c); R(5, 0, 1, 2, c); R(10, 0, 1, 2, c); R(4, 4, 8, 7, c); R(3, 6, 2, 3, c); R(11, 6, 2, 3, c); R(6, 3, 1, 1, '#f0c828'); R(9, 3, 1, 1, '#f0c828'); R(2, 8, 2, 1, '#e8e4dc'); }
      R(7, 1, 1, 10, '#5a5e58'); R(2, 6, 12, 1, '#5a5e58');
      if (e.s.curtain) { R(2, 0, 12, 12, '#c8c2a8'); for (let x = 3; x < 14; x += 3) R(x, 0, 1, 12, '#a8a288'); }
      if (e.open) R(8, 1, 6, 10, '#05060a');
      R(1, 11, 14, 2, '#7a7e78');
    },
    speaker(g, e, t, R) {   // 墙上的广播喇叭
      box(R, 4, 0, 8, 7, '#8a8070'); R(5, 1, 6, 5, '#3a3630'); for (let y = 2; y < 6; y += 2) R(5, y, 6, 1, '#5a5448');
      if (e.s.talk && Math.sin(t * 20) > 0) R(12, 2, 2, 1, '#e8e0a0');
    },
    phonedesk(g, e, t, R) {   // 小桌 + 黑色拨盘电话；rg：正在响
      box(R, 1, 2, 14, 12, '#6a5038'); R(2, 3, 12, 2, '#8a6a4a');
      const s = e.s.rg ? Math.round(Math.sin(t * 60)) : 0;
      R(4 + s, -3, 8, 5, '#1a1a1a'); R(5 + s, -2, 6, 3, '#2e2e2e'); R(6 + s, -1, 4, 1, '#d8d4c8');
      R(3 + s, -5, 10, 2, '#141414'); R(3 + s, -6, 2, 2, '#141414'); R(11 + s, -6, 2, 2, '#141414');
      if (e.s.rg) { R(1, -8, 1, 2, '#f0e0a0'); R(14, -8, 1, 2, '#f0e0a0'); }
    },
    kyotak(g, e, t, R) {   // 讲台（2 格宽）
      box(R, 0, 0, 32, 14, '#6a4a30'); R(1, 1, 30, 2, '#8a6a48'); R(12, 5, 8, 6, '#5a3a24');
      if (!e.s.book) { R(3, -2, 9, 4, '#2a5a3a'); R(4, -1, 7, 1, '#e8e4d8'); }
      if (!e.s.note) { R(21, -2, 7, 5, '#e8e0c8'); R(22, -1, 5, 1, '#8a8070'); R(22, 1, 3, 1, '#c03030'); }
    },
    tcart(g, e, t, R) {   // 盖着蓝塑料布的年糕摊（2 格宽）
      R(3, 10, 5, 5, '#2a2420'); R(24, 10, 5, 5, '#2a2420'); R(4, 11, 3, 3, '#5a5450'); R(25, 11, 3, 3, '#5a5450');
      box(R, 0, 0, 32, 11, '#6a6a70');
      R(-1, -6, 34, 9, '#2a5a9a'); R(-1, -6, 34, 1, '#4a7aba'); R(5, -6, 1, 9, '#e8e0c8'); R(26, -6, 1, 9, '#e8e0c8');
      for (let x = 2; x < 30; x += 7) R(x, -4, 3, 1, '#1e4a80');
      R(10, 1, 12, 7, '#d8c8a0'); R(11, 2, 10, 1, '#3a2a20'); R(11, 4, 7, 1, '#3a2a20'); R(11, 6, 8, 1, '#3a2a20');
      R(30, -2, 4, 2, '#4a3a2a');
    },
    nabi(g, e, t, R) {   // 灰色虎斑猫娜比（会跟着走）
      const fl = e.dir === 2, F = (x, y, w, h, c) => R(fl ? 16 - x - w : x, y, w, h, c), c = '#7a7670', d = '#4e4a46', l = '#a8a49c';
      R(3, 14, 10, 2, 'rgba(0,0,0,.35)');
      if (e.fr) {   // 走路
        const k = e.fr === 1 ? 1 : 0;
        F(3, 8, 9, 4, c); F(4, 8, 1, 4, d); F(7, 8, 1, 4, d); F(10, 8, 1, 3, d);
        F(2, 5, 4, 4, c); F(2, 4, 1, 1, c); F(5, 4, 1, 1, c); F(3, 6, 1, 1, '#e8c030');
        F(3 + k, 12, 1, 3, d); F(5 - k, 12, 1, 3, c); F(9 + k, 12, 1, 3, d); F(11 - k, 12, 1, 3, c);
        F(12, 6, 1, 3, c); F(13, 5, 1, 2, c); F(4, 9, 2, 1, '#c03030');
      } else {      // 坐着，尾巴绕在脚边
        F(5, 8, 6, 6, c); F(6, 9, 1, 4, d); F(9, 9, 1, 4, d); F(6, 12, 4, 2, l);
        F(5, 3, 6, 5, c); F(5, 2, 1, 1, c); F(10, 2, 1, 1, c); F(6, 3, 1, 1, '#d89aa0'); F(9, 3, 1, 1, '#d89aa0');
        F(6, 5, 1, 1, '#e8c030'); F(9, 5, 1, 1, '#e8c030'); F(7, 6, 2, 1, '#d8a0a0');
        F(6, 8, 4, 1, '#c03030'); F(8, 9, 1, 1, '#c8a060');
        F(11, 12, 3, 2, c); F(13, 11, 1, 2, d);
      }
    },
    overpass(g, e, t, R) {   // 天桥的台阶（3 格宽），往上伸进黑暗里
      R(0, -60, 48, 8, '#4a4a48'); R(0, -52, 48, 2, '#2a2a28');
      for (let i = 0; i < 10; i++) { const y = 10 - i * 6; R(6, y, 36, 5, shade('#8a8880', -i * .06)); R(6, y, 36, 1, shade('#a8a6a0', -i * .06)); }
      R(3, -52, 3, 66, '#3a5a3a'); R(42, -52, 3, 66, '#3a5a3a'); R(3, -52, 3, 1, '#5a7a5a'); R(42, -52, 3, 1, '#5a7a5a');
      for (let y = -48; y < 12; y += 8) { R(4, y, 1, 4, '#2a4a2a'); R(43, y, 1, 4, '#2a4a2a'); }
      R(14, -40, 20, 6, '#e8e4d0'); R(16, -38, 16, 1, '#3a3a3a'); R(16, -36, 10, 1, '#3a3a3a');
    },
    gatepost(g, e, t, R) {   // 校门的水泥门柱 + 校牌
      R(2, -16, 12, 31, '#b0aca0'); R(2, -16, 12, 2, '#c8c4b8'); R(12, -14, 2, 29, '#8a867c');
      if (e.s.plate) { R(4, -10, 8, 18, '#e8e4d4'); R(4, -10, 8, 1, '#8a867c'); for (let y = -7; y < 7; y += 3) R(6, y, 4, 1, '#2a2a2a'); }
    },
    shop(g, e, t, R) {   // 店门脸（墙面，w=2）：s.k = 'stat' 文具店 / 'rice' 米店
      const W2 = 32, stat = e.s.k === 'stat', col = stat ? '#c03030' : '#3a6a3a';
      R(0, -6, W2, 6, col); R(0, -6, W2, 1, shade(col, .25));
      for (let i = 0; i < 4; i++) R(3 + i * 7, -4, 4, 2, '#f0ead8');
      R(0, 0, W2, 14, '#8a8a86'); for (let y = 1; y < (stat ? 8 : 14); y += 2) R(0, y, W2, 1, '#74746f');
      if (stat) { R(0, 8, W2, 6, '#1a1a20'); R(3, 9, 4, 4, '#e8c040'); R(9, 10, 3, 3, '#5a8ae0'); R(14, 9, 2, 4, '#e86a8a'); R(19, 9, 5, 2, '#7ac06a'); R(26, 10, 3, 3, '#e8e4d8'); }
    },
    gacha(g, e, t, R) {   // 文具店门口的扭蛋机
      box(R, 3, -6, 10, 10, '#c83030'); R(4, -5, 8, 6, 'rgba(200,220,235,.6)');
      R(5, -3, 2, 2, '#e8d040'); R(8, -2, 2, 2, '#5aa0e0'); R(6, -1, 2, 2, '#e86a8a');
      box(R, 3, 4, 10, 10, '#a02020'); R(7, 6, 2, 2, '#d8d8d8'); R(6, 10, 4, 2, '#1a1a1a');
    },
    bluegate(g, e, t, R) {   // 家门口的蓝色铁门（墙面）
      box(R, 1, -3, 14, 17, '#2a5aa0'); for (let x = 3; x < 14; x += 2) R(x, -2, 1, 15, '#1e4680'); R(1, 4, 14, 1, '#1e4680');
      R(11, 5, 2, 2, '#c9a35a'); R(-1, -8, 5, 4, '#e8e4d0'); R(0, -7, 3, 1, '#333');
    },
    bundle(g, e, t, R) {   // 红布包袱
      R(3, 13, 10, 2, 'rgba(0,0,0,.35)'); R(3, 6, 10, 8, '#b02a2a'); R(4, 5, 8, 1, '#c03a30'); R(6, 3, 4, 3, '#c84030'); R(5, 2, 2, 2, '#c84030'); R(9, 2, 2, 2, '#c84030');
      R(4, 9, 8, 1, '#e0b040'); R(6, 11, 1, 1, '#e0b040'); R(10, 7, 1, 1, '#e0b040');
    },
    pbooth(g, e, t, R) {   // 橘色的公用电话亭
      R(1, 13, 14, 2, 'rgba(0,0,0,.4)'); box(R, 1, -16, 14, 30, '#d8782a'); R(2, -12, 12, 24, 'rgba(210,230,240,.5)');
      R(2, -16, 12, 4, '#f0e8d0'); R(4, -15, 8, 2, '#2a5a9a'); R(6, -6, 4, 6, '#9a9a90'); R(7, -8, 2, 2, '#5a5a50');
      if (e.s.rg) R(3, -18, 10, 1, '#f0e0a0');
    },
    radiowin(g, e, t, R) {   // 亮着灯的窗户，窗台上有台收音机
      box(R, 2, 1, 12, 10, '#4a3a2a'); R(3, 2, 10, 8, '#d9c27a'); R(7, 2, 1, 8, '#4a3a2a'); R(3, 5, 10, 1, '#4a3a2a');
      R(3, 2, 3, 8, '#c8a868'); R(4, 9, 7, 3, '#5a3a2a'); R(5, 10, 2, 1, '#e8c060'); R(9, 10, 1, 1, '#c03030');
    },
    kstall(g, e, t, R) {   // 厕所隔间门；feet：门缝底下停着一双白胶鞋
      SPR.stall(g, e, t, R);
      if (e.s.feet) { R(4, 15, 3, 1, '#f0eee6'); R(9, 15, 3, 1, '#f0eee6'); R(3, 15, 1, 1, '#1a1f36'); R(12, 15, 1, 1, '#1a1f36'); }
    }
  };

  defChapter({
    id: 'hkhalmae', n: 21, title: '香港奶奶', sub: '1989 年的首尔，放学路上有个半人半猫的老奶奶，会拦住孩子问路：「香港怎么走？」', origin: '韩国 1980 年代末校园怪谈', color: '#5a3a24',
    icon: '@halmae2', iconX: 40, amb: 'school', floor: 'lightwood', wall: 'school', dark: .5, plr: 3.2,
    endings: { hk: '往西南，两千一百公里', home: '回家的路', claw: '答错了第三次' },
    thumb(g, w, h) {   // 半人半猫的大头像 + 一架往西南飞的小纸飞机
      const s = Math.max(2, Math.floor(h / 44)), ox = Math.round(w / 2 - 34 * s), oy = Math.round((h - 22) / 2 - 16 * s);
      const gr = g.createRadialGradient(ox + 16 * s, oy + 16 * s, 2, ox + 16 * s, oy + 16 * s, 24 * s); gr.addColorStop(0, 'rgba(240,200,60,.3)'); gr.addColorStop(1, 'rgba(240,200,60,0)'); g.fillStyle = gr; g.fillRect(0, 0, w, h);
      FACES.halmae((x, y, ww, hh, c) => { g.fillStyle = c; g.fillRect(ox + x * s, oy + y * s, ww * s, hh * s); }, .8, 0);
      const px = Math.round(w * .78), py = Math.round(h * .16), q = Math.max(1, s / 2);
      g.fillStyle = '#f0ece0'; for (let i = 0; i < 6; i++) g.fillRect(px - i * q, py + i * q, (6 - i) * q * 2, q);
      g.fillStyle = 'rgba(240,236,224,.35)'; for (let i = 1; i < 8; i++) g.fillRect(px + i * 3 * q, py - i * 2 * q, q, q);
    },
    people: PEOPLE,
    faces: FACES,
    sprites: SPR21,
    items: {
      attend: { name: '出勤簿', desc: '绿色硬壳的出勤簿。封面上贴着「五年三班　班主任　金」。\n今天全班四十八人，全勤。' },
      atlas: { name: '社会科附图', desc: '五年级的社会科附图。翻得最旧的是第 12 页「我们的邻居——亚洲」。（按 J 可以翻看笔记里的地图）' },
      milk: { name: '一盒牛奶', desc: '中午发的学校牛奶，三角形的纸盒。你没喝，一直塞在课桌里。还凉着。' },
      timetable: { name: '智勋爸爸的时刻表', desc: '一本巴掌大的航班时刻表，封面上印着一架飞机。（按 J 可以翻看笔记）' },
      candy: { name: '薄荷糖', desc: '一颗用白纸包着的薄荷糖。是天桥底下的老奶奶给的。\n糖纸上歪歪扭扭地写着两个字：「谢谢」。' }
    },
    notes: {
      rumor: { title: '被没收的纸条', text: '【香港奶奶】看完传给五个人！不传的话今晚她来找你\n\n· 她坐飞机去香港，飞机掉下来了。她抱着的猫也死了。猫把半条命分给了她——所以她现在一半是人，一半是猫。\n· 天黑以后，她在放学路上等小孩。一百米只要十秒，跑不掉。\n· 她会问你话：「去哪儿呀？」「让奶奶看看手。」然后问香港怎么走——往哪边、飞机几点到、有多远。\n· 答错三次，就……\n· 跟她说话，每句话最后都要说「香港」！\n· 别让她看见指甲。\n· 电话响不满四声，不要接。有人在窗外叫你，不要开窗。\n· 厕所第四间，躲了也没用。\n\n（纸角有金老师的红笔字：「传播谣言。敏浩，放学后到教务室。」）' },
      atlas: { title: '社会科附图 · 第 12 页「我们的邻居——亚洲」', text: '（地图右上角画着指北针：上北、下南、左西、右东）\n\n比例尺　1 : 20,000,000\n（地图上 1 厘米 = 实际 200 公里）\n\n首尔在地图的右上方，半岛的中间。东京在右边，隔着海。\n香港在左下方，大陆南边的海岸上，旁边是澳门。\n\n上星期社会课用尺子量的铅笔线：\n　首尔 —— 东京　6 厘米　（老师批：1200 公里　○）\n　首尔 —— 香港　10.5 厘米　（还没算）\n\n页边的小栏「时区」：\n　首尔用东经 135° 的时间，香港用东经 120° 的时间。\n　经度每差 15°，钟就差一小时。越往西，钟越慢。' },
      timetable: { title: '金浦国际机场 · 国际线出发时刻表（1989 年夏季）', text: '去哪儿　　　　起飞　　大约飞多久　　班期\n东京（成田）　09:30　　2 小时 05 分　　每天\n香港（启德）　10:10　　3 小时 40 分　　一三五\n台北　　　　　11:40　　2 小时 20 分　　每天\n大阪　　　　　13:00　　1 小时 40 分　　每天\n香港（启德）　14:20　　3 小时 30 分　　每天\n曼谷　　　　　15:40　　5 小时 30 分　　二四六\n\n※ 起飞、到达时间，都按当地的钟。\n\n（背面是智勋的铅笔字：「爸爸说，下午那班去香港的飞机上发橘子汁。」）' },
      cart: { title: '年糕摊上的纸板', text: '（塑料布底下压着一块硬纸板，毛笔字被雨水洇过好几回）\n\n　暂停营业\n\n　去香港看儿子。坐下午的飞机。\n　下个月回来。\n　回来了，年糕给孩子们多盛一勺。\n　　　　　　　　　　　　　尹\n\n（日期写着：1987 年 5 月）\n\n（纸板背面，挤满了小孩子的铅笔字：「奶奶快回来」「奶奶我们等你」「娜比我们会喂的」……）' }
    },
    legend: '「香港奶奶鬼」（홍콩할매귀신）是 1980 年代末韩国小学生之间流传最广的校园怪谈之一。最常见的说法是：一位老奶奶抱着心爱的猫坐飞机去香港，飞机失事，她和猫的魂魄合在了一起，变成一半是人、一半是猫的鬼，回到韩国，在放学路上专找小孩；也有版本说，是猫把自己的半条命分给了她。据说她一百米只要十秒左右，还能一下跳出好几米，所以「跑是跑不掉的」。\n\n孩子们同时传着一整套「保命规矩」：天黑以后别在外面；跟她说话，每句话的末尾都要加上「香港」；别让她看见指甲（伸手时要手心朝上）；电话响不满四声不要接；窗外有老奶奶叫你，不要应、不要开窗；躲进厕所第四间也没用。规矩因学校、因地区而不同，常常互相矛盾——这正是口耳相传的怪谈的样子。\n\n据报道，1989 年 6 月，MBC 电视台的新闻节目报道过首尔一些国民学校里的「香港奶奶」恐慌：有的教室里孩子们一听说她「在隔壁班吃小孩」，便哭喊成一片，不少孩子天一黑就不敢出门。事后人们给出的解释各种各样：那几年香港电影（尤其是鬼怪片）在韩国大受欢迎；八十年代几起空难的新闻，让「坐飞机出事」成了连孩子都熟悉的恐惧；拐卖儿童的报道很多；还有一种说法认为，是大人们有意讲这个故事，好让孩子天黑前回家。和日本的裂口女一样，她也是「拦住你问话、答错就完蛋」的放学路怪谈。\n\n（本章中的朴秀妍、金老师和五年三班的同学、尹奶奶和她的年糕摊、猫娜比，以及「往哪边走、几点到、有多远」这几道题、时刻表上的航班、社会科附图的页面、纸条与广播的内容，均为游戏虚构。世上并没有真实的「香港奶奶」，也没有哪位真实的老人与这个传说有关；本章只是借一个虚构的老奶奶，写孩子们口中的那个她。）',
    start: { map: 'class', x: 8, y: 8, dir: 3 },
    resume: {
      phone: async S => { S.amb('school'); RING.t = 1.4; RING.n = 0; RING.gap = true; S.f.rn = 0; S.f.ringing = true; S.ent('phone').s.rg = false; if (DIED.phone) await S.think('（这一次，一声一声地数清楚——响满四声，再接。）'); },
      dusk: async S => { S.amb('school'); S.norun(false); if (DIED.win) await S.think('（三楼的窗外，不可能站着人。不管她说什么，都别开窗。）'); },
      hide: async S => { S.norun(false); S.hidePlayer(false); S.stop('halmaeH'); await appear(S, true); },
      street: async S => { S.amb('night'); S.norun(false); },
      qa: async S => { S.norun(false); await encounter(S, true); }
    },
    async intro(S) {
      FAILS = 0; for (const k in DIED) DIED[k] = 0;
      await S.card('卷三', '', '往南，往西，往更远的地方去。\n\n这一卷的十个夜晚，\n在别人的语言里，在别人的街巷里。\n\n可是天黑以后，\n每一个地方的大人，都会对孩子说同一句话：\n——早点回家。');
      await S.card('第二十一夜　香港奶奶', '1989年6月23日（星期五）　韩国首尔　冠岳区', '那年六月，首尔的国民学校里，\n孩子们都在传同一个奶奶。\n\n她一半是人，一半是猫。\n天黑以后，她坐在放学的路上，\n拦住你，问路。');
    },
    tick(S, dt) {   // 问答时她在数数：最后十秒，每秒一下
      if (S.f.ph === 'qa' && S.timerLeft != null) {
        const s = Math.ceil(S.timerLeft);
        if (s !== lastSec) { lastSec = s; if (s <= 10) S.tone('square', 1300, 1300, .025, .04, 0, 3000); else if (s % 10 === 0) bell(S, .03); }
      } else lastSec = -1;
    },
    maps: {
      /* ---------------- 五年三班教室（三楼，黄昏） ---------------- */
      class: {
        amb: 'school', dark: .34, darkC: '#1a0a06', plr: 3.4, wall: 'school', floor: 'lightwood',
        rows: [
          '##################',
          '##################',
          '#................#',
          '#................#',
          '#................#',
          '#................#',
          '#................#',
          '#................#',
          '#................#',
          '#................#',
          '#................#',
          '##################'],
        ents: [
          { id: 'cdoor', x: 16, y: 1, spr: 'sliding', async on(S) {
            if (!S.f.kidsGone) { const l = dutyLeft(S); S.sfx('locked'); return S.narr('值日还没做完：' + l.join('、') + '。\n金老师说了，做完才能走。'); }
            if (!S.has('attend') && !S.f.book) { S.sfx('locked'); return S.think('讲台上的出勤簿……得送到教务室金老师桌上。'); }
            S.sfx('open'); await S.go('hall', 3, 2, 0);
          } },
          { id: 'motto', x: 1, y: 1, spr: 'poster', col: '#e8e0c8', on: S => S.narr('教室后墙上挂着班训，金老师写的毛笔字：「正直」。\n下面贴着上个月的「拾金不昧」光荣榜，智勋的名字排第一。') },
          { id: 'win1', x: 3, y: 1, spr: 'swin', open: true, light: { r: 5, col: 'rgba(255,140,60,.24)', dy: 22 }, async on(S) {
            const e = S.ent('win1');
            if (e.open) { e.open = false; S.f.w1 = true; S.sfx('close'); await S.narr('你踮起脚，把窗户推上，扣好插销。\n楼下的操场上，有人在喊谁的名字，喊了好几遍。'); return classCheck(S); }
            await S.narr(S.f.kidsGone ? '玻璃上映着你自己，还有身后一排排空着的课桌。' : '窗外，冠岳山的影子越拉越长。');
          } },
          { id: 'win2', x: 5, y: 1, spr: 'swin', open: true, light: { r: 5, col: 'rgba(255,140,60,.24)', dy: 22 }, async on(S) {
            const e = S.ent('win2');
            if (e.open) {
              e.open = false; S.f.w2 = true;
              await S.narr('伸手去拉窗户的时候，你看了一眼对面那栋楼的屋顶。');
              e.face = true; S.sfx('heart'); S.shake(200, 1); bell(S, .03);
              await S.wait(450); e.face = false;
              S.sfx('close');
              await S.narr('……屋顶的水塔旁边，好像蹲着一个人。\n很小的一团。头上有两个尖尖的东西。');
              await S.think('再看的时候，什么也没有了。\n……是猫吧。一定是猫。');
              return classCheck(S);
            }
            await S.narr('对面楼的屋顶空空的。水塔的影子，像一个人蹲着。');
          } },
          { id: 'board', x: 8, y: 1, spr: 'kboard', text: true, async on(S) {
            const e = S.ent('board');
            if (e.text) {
              await S.narr('黑板上还留着今天的日期：「6月23日（金）　值日：朴秀妍」。\n右下角，不知道谁用粉笔画了一个老奶奶——头上两只猫耳朵，旁边写着：「香港」。');
              e.text = false; S.f.board = true; S.sfx('paper');
              await S.narr('你踮着脚，一下一下地擦。粉笔灰在夕阳里慢慢地飘。\n黑板上方，太极旗静静地挂着。');
              return classCheck(S);
            }
            await S.narr('黑板擦得干干净净。');
          } },
          { id: 'duty', x: 11, y: 1, spr: 'poster', col: '#d8e0e8', on: S => S.narr('值日表。这个星期的值日生一栏写着：「朴秀妍」。\n下面一行小字：擦黑板、关窗、出勤簿送教务室。') },
          { id: 'clock', x: 13, y: 1, spr: 'wallclock', on: S => S.narr(S.f.kidsGone ? '六点四十分。太阳快下山了。' : '六点二十分。教职员会议，大概还要开很久。') },
          { id: 'kyotak', x: 7, y: 3, w: 2, spr: 'kyotak', solid: false },
          { id: 'kyL', x: 7, y: 3, spr: 'invisible', solid: true, async on(S) {
            if (S.has('attend') || S.f.book) return S.narr('讲台上空了。只剩一盒粉笔和一个黑板擦。');
            if (!S.f.kidsGone) return S.narr('出勤簿压在讲台上。做完值日再送过去。');
            S.give('attend'); S.ent('kyotak').s.book = true;
            await S.narr('你把出勤簿夹在胳膊底下。绿色的硬壳，摸上去凉凉的。');
            return classCheck(S);
          } },
          { id: 'kyR', x: 8, y: 3, spr: 'invisible', solid: true, async on(S) {
            S.ent('kyotak').s.note = true;
            if (S.once('rumorP')) await S.narr('讲台上压着一张折成小方块的纸。是金老师下午在课上没收的。');
            return S.note('rumor');
          } },
          { id: 'teacher', x: 8, y: 2, spr: '@teacher', dir: 0 },
          ...[2, 3, 5, 6, 10, 11, 13, 14].flatMap(x => [5, 7, 9].filter(y => !(x === 5 && y === 7)).map(y => ({ x, y, spr: 'schooldesk', on: S => S.narr(x === 13 && y === 7 ? '智勋的课桌。桌面上贴着一张飞机的贴纸，「大」字缺了一角。' : x === 10 && y === 5 ? '敏浩的课桌。抽屉里塞着一本卷了边的漫画，封面是一个举着拳头的机器人。' : ['课桌里塞着忘带回家的算术练习本。', '桌面上用铅笔画着一个小小的猫，又被橡皮擦得一团黑。', '椅子没推进去，歪在过道上。'][(x + y) % 3]) }))),
          { id: 'mydesk', x: 5, y: 7, spr: 'schooldesk', async on(S) {
            if (S.f.bag) return S.narr('你的课桌。抽屉已经空了。');
            S.f.bag = true; S.give('atlas'); S.give('milk');
            await S.narr('你的课桌。抽屉里塞着社会科附图，还有中午发的一盒牛奶——你没喝，忘在里面了。');
            await S.note('atlas');
            await S.think('下星期社会课要交作业：量出首尔到亚洲各个城市有多远，再算算时差。\n……香港那一条，还没算。');
            return classCheck(S);
          } },
          ...[2, 3, 4, 5, 6].map(x => ({ x, y: 10, spr: 'shelf', on: S => S.narr(['后面的置物柜。有人的跳绳没卷好，耷拉在外面。', '格子里放着一只竖笛，笛孔上贴着胶布。', '贴着「朴秀妍」名牌的格子。空的——书包在你背上。', '恩珠的格子里叠着一副白手套。她这几天好像一直不肯把手露出来。', '一盆牵牛花，是自然课上种的。还没开。'][x - 2]) })),
          { id: 'locker', x: 15, y: 10, spr: 'locker', on: S => S.narr(S.once('lk') ? '扫除用具柜。扫帚、拖把、铁皮水桶。\n柜子底下，有人放了一小碟猫粮。' : '扫除用具柜。那一小碟猫粮，好像少了一点。') },
          { id: 'minho', x: 10, y: 6, spr: '@minho', dir: 0, async on(S) {
            S.face('minho', 'pl');
            if (S.f.k_minho) return S.say('敏浩', '记住啊，「香港」！每句话最后都要说！……我才不怕呢，香港。');
            S.f.k_minho = true;
            await S.say('敏浩', ['嘿，朴秀妍，你今天值日？那你得天黑才能回家了——', '「香港奶奶」听说过没？她坐飞机去香港，飞机掉下来了。她抱着的猫也死了，猫的魂跟她粘到了一块儿。', '所以她现在一半是人，一半是猫，专门在放学路上等小孩。', '跑是跑不掉的。一百米她只要十秒！比运动会跑第一的六年级还快！', '她会问你话。记住——跟她说话，每句话最后都要加上「香港」。不加就完蛋，香港。']);
            await S.say('敏浩', '我表哥在新林洞那边上学，他说他们班有人真碰见了！……好像是。');
            return classCheck(S);
          } },
          { id: 'eunju', x: 3, y: 8, spr: '@eunju', dir: 2, async on(S) {
            S.face('eunju', 'pl');
            if (S.f.k_eunju) return S.say('恩珠', '……尹奶奶最疼我们了。她才不会变成那样。');
            S.f.k_eunju = true;
            await S.say('恩珠', ['……秀妍，你别听敏浩瞎说。', '（她把两只手缩在袖子里）……可是我奶奶也说，那个奶奶会叫你把手伸出来给她看。', '要是让她看见指甲，就会被吃掉。所以要这样——', '（她把手心朝上，摊开给你看）手心朝上，指甲就藏起来了。', '还有……躲进厕所的话，第四间是没用的。她会一间一间地闻。']);
            await S.say('恩珠', ['……以前在校门口卖辣炒年糕的尹奶奶，你还记得吗？', '她去香港看儿子，就再也没回来。大家都在说……', '不对。尹奶奶才不是那样的。']);
            return classCheck(S);
          } },
          { id: 'jihun', x: 14, y: 8, spr: '@jihun', dir: 1, async on(S) {
            S.face('jihun', 'pl');
            if (S.f.k_jihun) return S.say('智勋', S.has('timetable') ? '谢啦！明天还我就行。' : '时刻表在金老师的抽屉里！拜托拜托。');
            S.f.k_jihun = true;
            await S.say('智勋', ['秀妍，帮个忙！我爸的航班时刻表——我今天带来给大家看，被金老师没收了。', '我爸在金浦机场上班。上面写着每天几点有飞机去哪儿，东京啦、香港啦、曼谷啦。', '老师放进她抽屉了。你等会儿去教务室，顺便帮我拿回来呗？明天还我。']);
            await S.say('智勋', '……对了。我爸说，那个奶奶坐的，就是下午去香港的那班。他说那天……算了，他不让我说。');
            return classCheck(S);
          } },
          { id: 'hyejin', x: 8, y: 5, spr: '@hyejin', dir: 0, async on(S) {
            S.face('hyejin', 'pl');
            if (S.f.k_hyejin) return S.say('惠珍', '纸条就在讲台上。看完了别传啊。');
            S.f.k_hyejin = true;
            await S.say('惠珍', ['朴秀妍，值日认真点。黑板擦干净，窗户关好。', '敏浩上课传的纸条被金老师没收了，就压在讲台上。全是吓唬人的。', '……不过我妈说，最近晚上家里电话响，响不满四声别接。窗外有人叫你，也别开窗。', '这不是迷信。这是安全常识。']);
            return classCheck(S);
          } }
        ],
        async enter(S, first) {
          if (!first) return;
          chime(S);
          await S.narr('放学的钟声早就响过了。\n夕阳从窗户斜照进来，把半间教室染成了橘红色。');
          await S.say('金老师', ['都别闹了，听我说。', '最近孩子们之间在传一个什么「香港奶奶」。没有那种东西。谁再在课上传纸条，就跟敏浩一样，留下来写检讨。']);
          S.bubble('minho', '…', 1000);
          await S.say('金老师', ['不过，天黑以前都给我回家。路上别跟不认识的人说话。', '今天的值日生是朴秀妍吧？擦黑板、关窗。出勤簿我放讲台上了，做完了送到教务室我桌上。', '老师去开教职员会议。……你们几个，也别磨蹭太久。']);
          S.sfx('open');
          await S.walk('teacher', [16, 2], 4);
          S.hide('teacher'); S.sfx('close');
          await S.say('敏浩', '老师走啦！喂，朴秀妍，你知道吗——');
          S.goal('值日：擦黑板、关窗、收拾课桌　（也听听同学们在说什么）');
          S.cp('start');
        }
      },
      /* ---------------- 三楼走廊与女厕所 ---------------- */
      hall: {
        amb: 'school', dark: .6, plr: 3.2, wall: 'school', floor: 'linoleum',
        rows: [
          '############################',
          '############################',
          '#nnnnnnnnnnnnnnnnnnnnnnnnnn#',
          '#nnnnnnnnnnnnnnnnnnnnnnnnnn#',
          '#nnnnnnnnnnnnnnnnnnnnnnnnnn#',
          '######++####################',
          '######++####################',
          '#++++++++++++###############',
          '#++++++++++++###############',
          '#++++++++++++###############',
          '#++++++++++++###############',
          '############################'],
        ents: [
          { id: 'hcdoor', x: 3, y: 1, spr: 'sliding', async on(S) {
            if (S.f.called) { S.sfx('locked'); return S.narr('五年三班的门锁上了。门上的小玻璃里，一排排课桌黑乎乎的。'); }
            S.sfx('open'); await S.go('class', 16, 2, 0);
          } },
          { id: 'hwin1', x: 6, y: 1, spr: 'hwin', light: { r: 3, col: 'rgba(255,150,80,.14)', dy: 20 }, on: S => S.narr(S.f.dusk ? '窗外黑透了。远处的公寓楼，一格一格地亮着灯。' : '窗外，操场上最后几个孩子拖着书包往校门口走。') },
          { id: 'd52', x: 9, y: 1, spr: 'sliding', async on(S) { S.sfx('locked'); await S.narr('五年二班。门锁着，门上的小玻璃黑黑的。'); } },
          { id: 'hwin2', x: 12, y: 1, spr: 'hwin', light: { r: 3, col: 'rgba(255,150,80,.14)', dy: 20 }, on: S => S.narr(S.f.dusk ? '玻璃上映着走廊的日光灯，一闪一闪。' : '远处冠岳山的山脊上，只剩一道红边。') },
          { id: 'odoor', x: 15, y: 1, spr: 'door', col: '#6a4a30', async on(S) {
            if (S.f.called) { S.sfx('locked'); return S.narr('教务室的门，从里面锁上了。\n……里面明明一个人也没有。'); }
            S.sfx('open'); await S.go('office', 7, 8, 3);
          } },
          { id: 'hnotice', x: 17, y: 1, spr: 'poster', col: '#e0d8c0', on: S => S.narr('布告栏。「走廊上不许奔跑」「节约用水」。\n最底下新贴了一张油印的通知：「近日有不实传闻流传，请各位同学不要相信，放学后按时回家。」') },
          { id: 'hwin3', x: 19, y: 1, spr: 'hwin', light: { r: 3, col: 'rgba(255,150,80,.14)', dy: 20 }, on: S => S.narr(S.f.tapped ? '窗外什么也没有。玻璃上，留着一个模模糊糊的手印——手心朝外。' : S.f.dusk ? '窗外黑漆漆的。这里是三楼。' : '窗台上落着一层粉笔灰。') },
          { id: 'hwin4', x: 22, y: 1, spr: 'hwin', light: { r: 3, col: 'rgba(255,150,80,.14)', dy: 20 }, on: S => S.narr('楼下的校门口，有一盏路灯。灯底下停着一辆盖着蓝塑料布的小推车。') },
          { id: 'speakerH', x: 24, y: 1, spr: 'speaker', on: S => S.narr('走廊上的广播喇叭。早上的升旗仪式，就是从这里放国歌的。') },
          ...[2, 3, 4].map(y => ({ id: 'sd' + y, x: 26, y, spr: 'stairsdown', solid: false, async touch(S) {
            if (!S.f.called) { S.pos(25, y, 1); return S.think(S.f.book ? '……教务室的电话，好像在响？' : '出勤簿还没送到教务室呢。金老师明天会生气的。'); }
            if (S.f.hunt) { S.pos(25, y, 1); return S.think('楼梯底下，铃铛声还在响……\n不能往下走！'); }
            if (!S.f.hid) return;
            await S.go('street', 2, 2, 0);
          } })),
          { id: 'wsign', x: 5, y: 6, spr: 'poster', col: '#e8a0a8', on: S => S.narr('女厕所。门口的牌子上画着一个穿裙子的小人。') },
          { id: 'mirror1', x: 2, y: 6, spr: 'mirror', on: S => S.narr(S.f.dusk ? '镜子里的走廊口，黑洞洞的。你不敢多看。' : '镜子里是你自己，额头上沾着一点粉笔灰。') },
          { id: 'mirror2', x: 3, y: 6, spr: 'mirror', on: S => S.narr('镜子的角落有一道裂纹。有人在裂纹旁边用口红画了一只猫。') },
          { x: 2, y: 7, spr: 'sink', solid: true, on: S => S.narr('水龙头没拧紧，一滴，一滴。') },
          { x: 3, y: 7, spr: 'sink', solid: true, on: S => S.narr('洗手池里泡着一块用剩的肥皂，软软的。') },
          ...[1, 2, 3, 4].map(n => ({ id: 'st' + n, x: 7 + n, y: 7, spr: 'kstall', solid: true, num: n === 4, on: S => hideStall(S, n) })),
          { x: 12, y: 10, spr: 'box', on: S => S.narr('拖把桶。桶底的水是灰的。') },
          { id: 'halmaeH', x: 26, y: 3, spr: '@halmae1', solid: false, hidden: true }
        ],
        step(S, x, y) {
          if (S.f.called && !S.f.tapped && x >= 17 && x <= 22 && y >= 2 && y <= 4) return tapWin(S);
        },
        async enter(S, first) {
          if (!first) return;
          await S.narr('走廊上一个人也没有。\n夕阳从窗户斜进来，地上一格一格的，像一排橘红色的方块。');
          S.goal('把出勤簿送到教务室（往右，挂着「教务室」牌子的门）');
        }
      },
      /* ---------------- 教务室 ---------------- */
      office: {
        amb: 'school', dark: .52, plr: 3.2, wall: 'plain', floor: 'linoleum',
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
          '#######..#######'],
        ents: [
          { id: 'owin', x: 3, y: 1, spr: 'hwin', light: { r: 3, col: 'rgba(255,150,80,.16)', dy: 20 }, on: S => S.narr(S.f.dusk ? '窗外黑透了。玻璃上映出一排空着的办公桌。' : '窗外的天，从橘红慢慢变成了灰紫。') },
          { x: 6, y: 1, spr: 'poster', col: '#f0ece0', on: S => S.narr('黑板上写着这个月的日程：「6月25日　纪念活动」「期末考试」「暑假作业发放」。\n角落里有人添了一行小字：「香港奶奶 → 已辟谣」。') },
          { x: 9, y: 1, spr: 'wallclock', on: S => S.narr(S.f.dusk ? '七点四十分。' : '七点十分。会议室那边，传来很远的说话声。') },
          { id: 'speakerO', x: 11, y: 1, spr: 'speaker', on: S => S.narr('广播喇叭。底下的开关贴着一张纸条：「放学广播　18:00 / 19:30」。') },
          { x: 13, y: 1, spr: 'poster', col: '#c8d8c0', on: S => S.narr('玻璃框里是去年秋季运动会的合影。全校的孩子挤在操场上，一个个都眯着眼睛笑。\n照片角落里，校门口的年糕摊旁边，站着一个白头发的老奶奶，脚边蹲着一只猫。') },
          { x: 1, y: 2, spr: 'bookshelf', on: S => S.narr('书架上排着一本本学籍簿，书脊上写着年级和班级。') },
          { x: 14, y: 2, spr: 'cabinet', on: S => S.narr('铁皮文件柜。最上面一层贴着「失物」，塞满了没人认领的雨伞和饭盒。') },
          ...[[2, 4], [4, 4], [2, 6], [3, 6], [4, 6], [9, 4], [10, 4], [11, 4], [9, 6], [10, 6], [11, 6]].map(([x, y]) => ({ x, y, spr: 'desk', col: '#6a5a48', on: S => S.narr(['办公桌。玻璃板底下压着课程表和几张孩子画的画。', '办公桌上摞着一沓没改完的作文本。最上面一本写着：「我的梦想是当飞行员」。', '桌上的茶杯里，茶叶都泡沉了。'][(x + y) % 3]) })),
          { id: 'kdesk', x: 3, y: 4, spr: 'desk', col: '#6a5a48', async on(S) {
            if (S.has('attend')) {
              S.take('attend'); S.f.book = true; S.sfx('paper');
              await S.narr('你把出勤簿放到金老师的桌上，摆正。\n玻璃板底下压着全班的合影。照片里你站在第二排，咧着嘴，缺了一颗门牙。');
            }
            if (!S.f.book) return S.narr('金老师的办公桌。出勤簿还在你手上……不对，还在教室的讲台上。');
            if (!S.f.tt) {
              S.f.tt = true; S.give('timetable');
              await S.narr('最上面的抽屉没锁。里面放着没收来的弹珠、小镜子、漫画——还有一本巴掌大的航班时刻表。');
              await S.note('timetable');
              await S.think('智勋爸爸的时刻表。……帮他拿回去吧，明天还他。');
              if (!S.f.called) { S.cp('phone'); startRing(S); }
              return;
            }
            await S.narr('金老师的办公桌。茶杯底下压着一张小纸条：「秀妍家　母亲在新林市场，晚归」。');
          } },
          { id: 'phone', x: 13, y: 4, spr: 'phonedesk', async on(S) {
            if (!S.f.ringing) return S.narr(S.f.called ? '黑色的拨盘电话。听筒还是温的。' : '黑色的拨盘电话。拨盘上的数字，磨得发白。');
            if (RING.gap) return S.narr('铃声停了。听筒里只有「嘟——」的长音。\n……过一会儿，大概还会再打来。');
            if (RING.n >= 4) return momCall(S);
            return earlyPick(S);
          } },
          { x: 13, y: 7, spr: 'stove', on: S => S.narr('煤气炉上坐着一只铝壶，壶嘴还冒着一丝丝热气。') },
          { x: 2, y: 8, spr: 'box', on: S => S.narr('「失物招领」的纸箱。里面有一只小小的猫项圈，铃铛的位置空着。') },
          { x: 10, y: 8, w: 2, spr: 'sofa', col: '#5a3a3a', on: S => S.narr('待客用的旧沙发，扶手上的皮都磨破了。') },
          ...[7, 8].map(x => ({ x, y: 9, spr: 'invisible', async touch(S) {
            if (S.f.ringing) { S.pos(x, 8, 3); return S.think('电话还在响……'); }
            S.sfx('close'); await S.go('hall', 15, 2, 0);
          } }))
        ],
        tick(S, dt) {   // 电话铃：一声一声地响；响到第九声没人接就断，过一会儿再打来
          const ph = S.ent('phone'); if (!ph) return;
          if (RING.lit > 0) { RING.lit -= dt; if (RING.lit <= 0) ph.s.rg = false; }
          if (!S.f.ringing || S.busy) return;
          RING.t -= dt; if (RING.t > 0) return;
          if (RING.n >= 9) { RING.n = 0; S.f.rn = 0; RING.gap = true; RING.t = 3.5; return; }
          RING.gap = false; RING.n++; S.f.rn = RING.n; RING.t = 1.9; ring(S); ph.s.rg = true; RING.lit = .7;
          S.bubble('phone', '♪', 800);
        },
        async enter(S, first) {
          if (!first) return;
          await S.narr('教务室里没有人。老师们都去开会了。\n一排排办公桌上亮着几盏台灯，铝壶在煤气炉上「咝咝」地响。');
          S.goal('把出勤簿放到金老师的桌上（第一排中间那张）');
        }
      },
      /* ---------------- 校门外的回家路（夜） ---------------- */
      street: {
        amb: 'night', dark: .86, plr: 2.9, wall: 'concrete', floor: 'concrete', fog: .1,
        rows: [
          '############################################',
          '############################################',
          'dddddddd#__________________________________#',
          'dddddddd#__________________________________#',
          'dddddddd.::::::::::::::::::::::::::::::::::#',
          'dddddddd.::::::::::::::::::::::::::::::::::#',
          'dddddddd#__________________________________#',
          'dddddddd#__________________________________#',
          'TTTTTTTTffffffffffffffffffffffffffffffffffff',
          'TTTTTTTTffffffffffffffffffffffffffffffffffff'],
        tileOpts: { fenceBase: 'sidewalk' },
        ents: [
          { id: 'schdoor', x: 2, y: 1, spr: 'door', col: '#5a5a58', on: S => S.narr('教学楼的大门。门在你身后「咔嗒」一声锁上了。') },
          { x: 5, y: 1, spr: 'window', on: S => S.narr('一楼的窗户全黑着。') },
          { x: 5, y: 6, spr: 'statue', solid: true, on: S => S.narr('操场边上看书的少女铜像。\n高年级的说，半夜十二点她会翻一页书。') },
          { id: 'gp1', x: 8, y: 3, spr: 'gatepost', s: { plate: true }, on: S => S.narr('水泥门柱上挂着校牌：「新月国民学校」。') },
          { id: 'gp2', x: 8, y: 6, spr: 'gatepost' },
          { id: 'cart', x: 10, y: 2, w: 2, spr: 'tcart', async on(S) {
            const first = !S.f.cartRead; S.f.cartRead = true;
            if (first) await S.narr('校门口停着一辆小推车，盖着褪了色的蓝塑料布，绳子捆得紧紧的。\n……是以前卖辣炒年糕的尹奶奶的摊子。');
            await S.note('cart');
            if (first) await S.think('1987 年……都两年了。\n「下个月回来」。');
          } },
          { id: 'nabi', x: 12, y: 3, spr: 'nabi', solid: false, dir: 1, async on(S) {
            if (S.f.cat) return S.narr('娜比蹭了蹭你的小腿。它的项圈上挂着一块小木牌，挂铃铛的那个小环，空着。');
            if (S.has('milk')) {
              S.take('milk'); S.f.cat = true; kitten(S);
              await S.narr('你蹲下来，撕开牛奶盒，倒在年糕摊的铁皮盖子里。\n那只猫犹豫了一下，凑过来，舔得「吧嗒吧嗒」响。');
              await S.narr('它的项圈上挂着一块小木牌：「娜比（나비）　年糕摊　尹」。\n挂铃铛的那个小环，空着。');
              await S.think('娜比……是尹奶奶的猫。\n她走了以后，它一直守在这儿吗？');
              S.follow('nabi', true);
              S.toast('娜比跟在你后面');
              return;
            }
            kitten(S);
            await S.narr('一只灰色的虎斑猫，缩在年糕摊旁边。瘦得能看见骨头。\n它冲你「喵」了一声，又把头埋回了前爪里。\n……它好像饿了。');
          } },
          { id: 'shop1', x: 13, y: 1, w: 2, spr: 'shop', s: { k: 'stat' }, on: S => S.narr('学校对面的文具店。卷帘门拉下了一大半，缝里透出一点电视的光。\n门口贴着手写的纸：「扭蛋 50 원」「棒冰到货」。') },
          { x: 15, y: 2, spr: 'gacha', on: S => S.narr('文具店门口的扭蛋机。转一下五十块钱。\n里面那颗没人抽到的大扭蛋，透明的壳里面装着一只塑料的小猫。') },
          { id: 'lampA', x: 18, y: 2, spr: 'streetlamp', solid: true, light: { r: 3.6, col: 'rgba(255,225,150,.2)', dy: 10 } },
          { x: 17, y: 1, spr: 'window', on: S => S.narr('二楼的窗户里，有人在看电视。笑声一阵一阵的。') },
          { x: 20, y: 1, spr: 'poster', col: '#e8c040', on: S => S.narr('墙上的宣传画：「小心火烛」。画上的小孩举着一只红色的水桶。') },
          { x: 23, y: 1, spr: 'window', lit: true, light: { r: 1.8, col: 'rgba(255,210,130,.15)' }, on: S => S.narr('窗户里飘出大酱汤的味道。有个妈妈在喊：「吃饭啦——」') },
          { id: 'booth', x: 23, y: 7, spr: 'pbooth', light: { r: 2.4, col: 'rgba(230,240,255,.16)', dy: -4 }, on: S => S.narr(S.f.boothRang ? '公用电话。听筒挂得好好的。\n刚才那三声……没响满四声，就停了。' : '橘色的公用电话亭。投币口上贴着「20 원」。') },
          { id: 'rshop', x: 26, y: 1, w: 2, spr: 'shop', s: { k: 'rice' }, on: S => S.narr('米店。卷帘门上用粉笔写着：「今天提前关门」。') },
          { id: 'lampB', x: 29, y: 7, spr: 'streetlamp', solid: true, light: { r: 3.4, col: 'rgba(255,225,150,.18)', dy: 10 } },
          { id: 'radio', x: 31, y: 1, spr: 'radiowin', light: { r: 1.8, col: 'rgba(255,210,130,.15)' }, async on(S) {
            await S.narr('窗台上的收音机开着。播音员的声音一本正经：');
            await S.say('收音机', ['……最近，首尔冠岳区、铜雀区一带的一些国民学校里，流传着关于所谓「香港奶奶」的传闻。', '不少学生因此不敢独自上下学，有的学校里甚至出现了学生集体哭闹的情况。', '教育部门呼吁家长：不要让孩子听信谣言，同时也请尽量接送孩子……'], { style: 'whisper' });
            await S.narr('收音机「滋」地响了一声，换成了一首老歌。');
          } },
          { x: 30, y: 7, spr: 'sack', on: S => S.narr('路边堆着几袋垃圾。有一袋被什么东西抓破了，菜叶子撒了一地。') },
          { id: 'lampC', x: 34, y: 2, spr: 'streetlamp', solid: true, light: { r: 3.6, col: 'rgba(255,225,150,.22)', dy: 10 } },
          { id: 'overpass', x: 36, y: 2, w: 3, spr: 'overpass', on: S => S.narr('天桥的台阶，一级一级地伸进黑暗里。\n过了天桥，再往坡上走一段，就是你家。') },
          { id: 'bundle', x: 38, y: 3, spr: 'bundle', solid: false, on: S => S.narr('一个红布包袱，结打得紧紧的。') },
          { id: 'halmaeS', x: 37, y: 3, spr: '@halmae0', solid: false, dir: 1, on: S => S.narr(S.f.done ? '……' : '她低着头，像是在打盹。') },
          { id: 'hgate', x: 41, y: 1, spr: 'bluegate', on: S => homeGate(S) },
          { x: 15, y: 6, spr: 'puddle', decal: true }, { x: 27, y: 3, spr: 'puddle', decal: true }, { x: 33, y: 6, spr: 'puddle', decal: true }
        ],
        step(S, x, y) {
          if (!S.f.met && !S.f.boothRang && x >= 21) {
            S.f.boothRang = true; S.ent('booth').s.rg = true;
            return (async () => { for (let i = 0; i < 3; i++) { ring(S); await S.wait(1300); } S.ent('booth').s.rg = false; await S.narr('路边的公用电话，响了三声。\n……就停了。'); })();
          }
          if (!S.f.met && !S.f.seen && x >= 26) {
            S.f.seen = true;
            return (async () => { S.focus(37, 3); bell(S, .03); await S.think('……天桥底下，好像坐着一个人。'); S.focus(null); await S.think('回家的路，只有这一条。\n……低着头，走过去就好了。'); })();
          }
          if (!S.f.met && x >= 31) return encounter(S, false);
        },
        async enter(S, first) {
          if (!first) return;
          await S.narr('校门外，路灯一盏一盏地亮着。\n马路上一辆车也没有。远处的公寓楼，窗户一格一格地亮。');
          S.goal('回家（过了天桥，坡上的蓝色铁门）');
          S.cp('street');
        }
      }
    }
  });
})();
