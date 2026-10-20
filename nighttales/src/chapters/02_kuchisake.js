/* ================= 第二夜 · 裂口女 ================= */
(() => {
  const LAMPS = [6, 14, 22, 30];                       // 小巷大路上的路灯（x），她会「出现在前面的路灯下」
  const MOUTHS = [10, 18, 26, 34];                     // 通往房子后面小胡同的口子（x）
  const SEGS = [[1, 13, [10]], [15, 29, [18, 26]], [31, 40, [34]]];   // 后巷被啤酒箱隔成三段：两头是死路，中间一段有两个口子
  const ROAD = (x, y) => y >= 6 && y <= 9;             // 她只走大路（含两侧人行道），不拐进小胡同
  let leanX = 0;                                       // 她把身子探进了哪个胡同口（0 = 没有）
  const ZONE = (x, y) => ROAD(x, y) || (leanX > 0 && x === leanX && y === 5);
  const KIDS = ['miho', 'kenta', 'koba', 'sanae'];
  /* 追逐的临时状态（只在主机上跑，不进存档；开始追逐 / 读档时重置） */
  const CS = { tp: 0, pend: null, drop: 0, snd: 0, hb: 0, leanT: 0, nextLean: 6 };
  function resetChase(tp) { Object.assign(CS, { tp, pend: null, drop: 0, snd: 0, hb: 0, leanT: 0, nextLean: 6 }); leanX = 0; }

  /* ---------- 小工具 ---------- */
  function adjTo(S, id) {   // 她走到玩家旁边的一格
    const m = curMap(), e = S.ent(id), p = W.pl, ex = Math.round(e.px / TS), ey = Math.round(e.py / TS);
    const c = [[p.x + 1, p.y], [p.x - 1, p.y], [p.x, p.y + 1], [p.x, p.y - 1]].filter(([x, y]) => passable(m, x, y, e));
    c.sort((a, b) => (Math.abs(a[0] - ex) + Math.abs(a[1] - ey)) - (Math.abs(b[0] - ex) + Math.abs(b[1] - ey)));
    return c[0] || [ex, ey];
  }
  function dutyLeft(S) {
    const l = [];
    if (!S.f.board) l.push('擦黑板');
    if (!(S.f.w1 && S.f.w2)) l.push('关窗');
    if (!S.f.journal) l.push('写学级日志');
    return l;
  }
  const talked = S => KIDS.filter(k => S.f['k_' + k]).length;
  async function classCheck(S) {
    if (!S.f.kidsGone && talked(S) >= 3) await kidsLeave(S);
    const left = dutyLeft(S);
    if (!left.length && S.f.kidsGone && !S.f.duty) return dusk(S);
    if (S.f.duty) return;
    const n = 3 - talked(S);
    if (S.f.kidsGone) S.goal('值日：' + left.join('、'));
    else if (!left.length) S.goal('和还没聊过的同学说说话（还剩 ' + n + ' 人）');
    else S.goal('和同学们聊聊（还剩 ' + n + ' 人）；值日：' + left.join('、'));
  }
  /* 没聊过的那个同学，走的时候也会丢下一句最要紧的话 */
  const LATE = {
    miho: ['美穗', '……由纪。路上要是有人问你漂不漂亮，千万别说「漂亮」哦。'],
    kenta: ['健太', '喂由纪！她跑一百米只要六秒，跑是跑不过的！咔嚓！'],
    koba: ['小林', '补充一点：碰上她，就念三遍「发蜡」。还有，她只会顺着大路追。'],
    sanae: ['早苗', '由纪，记住：就说「还行吧」。还有，她爱吃鳖甲糖。']
  };
  async function kidsLeave(S) {
    S.f.kidsGone = true;
    S.face('sanae', 'pl');
    await S.say('早苗', ['好啦好啦，都别说了。大家去操场排队！', '由纪，值日认真做哦。学级日志别忘了写。']);
    S.face('miho', 'pl');
    await S.say('美穗', '……由纪，你快点来哦。我们等你。');
    S.sfx('open');
    await Promise.all(KIDS.map((k, i) => S.walk(k, [1, 2], 3.6 + i * .3)));
    KIDS.forEach(k => S.hide(k));
    for (const k of KIDS) if (!S.f['k_' + k]) { S.f['k_' + k] = 'late'; await S.say(LATE[k][0] + '（走廊里）', LATE[k][1]); }
    S.sfx('close');
    await S.narr('拉门「咔啦」一声关上了。走廊里的脚步声和笑声越来越远。\n教室里只剩下你一个人。');
  }
  async function dusk(S) {
    S.f.duty = true;
    S.sfx('close'); await S.wait(400);
    S.dark(.62); S.amb('wind');
    for (const id of ['win1', 'win2']) { S.ent(id).s.dusk = true; S.ent(id).light = { r: 4, col: 'rgba(120,90,150,.14)', dy: 20 }; }
    S.ent('board').s.ghost = true;   // 擦干净的黑板，角落里多出一行很淡的字
    await S.narr('你把学级日志放回讲台上，抬起头。\n窗外的红色不知什么时候褪掉了，天变成了青紫色。');
    await S.narr('操场上空空荡荡的。\n……队伍已经走了。');
    await S.think('不是说好了等我的吗……山本老师呢？老师说去打电话，到现在也没回来。');
    S.goal('去职员室找山本老师');
  }
  /* 她的剪刀：放在她身上那一格，画在她手边 */
  function showSci(S, id) {
    const sid = id === 'onna' ? 'sci' : 'sci_h', o = S.ent(id);
    S.place(sid, Math.round(o.px / TS), Math.round(o.py / TS)); S.ent(sid).alpha = 1;
  }
  /* 关键问答：联机时两人各选一次；选得不一样，她就歪着头再问一遍（第二次以操作者为准） */
  async function askHer(S, q, opts) {
    let r = await S.vote(q, opts, '女人');
    if (r.agree) return r.v;
    S.sfx('whisper');
    await S.narr('你们两个同时开了口——说出来的，却不是同一句话。\n她慢慢地，把头歪向一边。');
    await S.say('女人', '……到底，是哪一句呢？', { style: 'whisper' });
    r = await S.vote(q, opts, '女人');
    return r.v;
  }
  /* 她弯下腰，把脸凑过来（短暂换成放大的精灵） */
  async function leanIn(S, id, ms) {
    const o = S.ent(id), old = o.spr;
    o.spr = old === '@onna2' ? '@onna2Big' : '@onnaBig'; S.sfx('heart'); S.shake(250, 1);
    await S.wait(ms || 700);
    o.spr = old;
  }

  /* ---------- 坏结局 ---------- */
  async function badPretty(S, id, lead) {
    await S.say('女人', lead || '……是吗。那就好。', { style: 'whisper' });
    await S.say('女人', '那么——让你也变得，跟我一样漂亮吧。');
    S.amb('none'); S.focus(Math.round(S.ent(id).px / TS), Math.round(S.ent(id).py / TS));
    showSci(S, id);
    await S.scare('face', { face: 'sci', sfx: 'cut', dur: .9 });
    await S.fade(1, 900);
    S.sfx('cut'); await S.wait(500); S.sfx('cut');
    await S.wait(1200);
    await S.end({ bad: true, title: '和她一样漂亮', text: '第二天早上，有人在路灯底下捡到了一顶黄色的小帽子。\n\n那年夏天，岐阜的孩子们之间又多了一个新的传闻：\n裂口女其实是两个人。一个高的，一个矮的。\n矮的那个，也戴着一只大大的白口罩。' });
  }
  async function badUgly(S, id) {
    await S.narr('她歪了歪头，很慢很慢地。\n风衣口袋里，传来金属碰在一起的声音。');
    await S.say('女人', '……不漂亮？', { style: 'whisper' });
    showSci(S, id || 'onna');
    await S.scare('face', { face: 'sci', sfx: 'cut', dur: .9 });
    S.amb('none');
    await S.fade(1, 700);
    S.sfx('cut'); await S.wait(300); S.sfx('cut');
    await S.wait(1200);
    await S.end({ bad: true, title: '咔嚓', text: '雨下了一整夜。\n\n早上，送报的少年在小巷的水洼里看见一只湿透的小书包。\n书包的带子，被齐齐地剪断了。' });
  }
  async function maskOff(S, id, slit) {
    await S.narr('她慢慢地，慢慢地，把手伸到耳后，摘下了口罩。');
    S.ent(id).spr = slit; S.sfx('tear');
    await S.scare('face', { face: 'onna2', dur: 1.1 });
    showSci(S, id); S.sfx('cut');
    await S.narr('风衣的袖口里，滑出来一把大剪刀。\n刀刃上挂着雨珠，「咔嚓」，开合了一下。');
    await S.say('女人', '这样——也漂亮吗？', { style: 'big' });
  }

  /* ---------- 小巷：相遇与追逐 ---------- */
  async function meet(S) {
    S.f.phase = 'meet';
    S.amb('none'); S.sfx('heart');
    S.ent('lamp1').flicker = true;
    await S.narr('前面那盏路灯，忽明忽暗地闪了几下。');
    S.place('onna', 14, 7, 1); S.ent('onna').alpha = 0;
    S.focus(14, 7);
    await S.alpha('onna', 1, 1200);
    await S.narr('灯下站着一个女人。\n米色的长风衣，湿漉漉的长头发。脸上戴着一只大得出奇的白口罩，遮住了半张脸。');
    S.focus(null);
    await S.think('……别看她。低着头，假装没看见，走过去就好了。');
    await S.walk('onna', adjTo(S, 'onna'), 2.2);
    S.face('onna', 'pl'); S.face('pl', 'onna');
    S.sfx('whisper');
    await leanIn(S, 'onna', 800);
    await S.say('女人', '……呐。', { style: 'whisper' });
    if (S.coop) { await S.narr('（她在等你回答。两个人小声商量一下——两个人都要选，选得不一样，她会再问一遍。）'); await S.wait(1500); }
    let ran = false;
    for (;;) {
      const opts = ['漂……漂亮。', '不漂亮！', '还……还行吧。'];
      if (!ran) opts.push('（转身就跑）');
      const r = await askHer(S, '「我……漂亮吗？」', opts);
      if (r === 3) {
        ran = true; const p = W.pl, d = p.dir; S.turn((d === 1 ? 2 : d === 2 ? 1 : d === 0 ? 3 : 0));
        S.sfx('step');
        await S.narr('你转身就跑——');
        const fx = p.x + DIRS[p.dir][0], fy = p.y + DIRS[p.dir][1];
        if (passable(curMap(), fx, fy, S.ent('onna'))) S.place('onna', fx, fy);
        S.face('onna', 'pl'); S.sfx('sting'); S.shake(300, 2);
        await S.narr('才迈出一步，一件湿淋淋的风衣就挡在了你面前。');
        await S.say('女人', '一百米，我只要六秒哦。', { style: 'whisper' });
        continue;
      }
      if (r === 1) return badUgly(S, 'onna');
      if (r === 0) {
        await maskOff(S, 'onna', '@onna2');
        const r2 = await askHer(S, '……', ['漂、漂亮……', '（尖叫）', '还……还、还行吧……']);
        if (r2 !== 2) { if (r2 === 1) { S.sfx('scream'); await S.narr('你的尖叫声被雨声吞掉了。她伸出手，轻轻捂住了你的嘴。'); } return badPretty(S, 'onna'); }
      }
      break;
    }
    S.f.okMeet = true;
    await S.narr('她愣住了。');
    await S.say('女人', '还行……？', { style: 'whisper' });
    await S.narr('她歪着头，一动不动，像是在算一道怎么也算不出来的算术题。');
    { const o = S.ent('onna'), ox = Math.round(o.px / TS), m = curMap();
      if (W.pl.x <= ox && passable(m, ox + 1, 7, W.pl)) { S.pos(ox + 1, 7, 2); S.sfx('step'); await S.narr('你屏住呼吸，从她湿淋淋的风衣边上挤了过去。\n她的头，跟着你慢慢地转。'); }
      else S.turn(2); }
    S.hide('sci'); if (S.ent('onna').spr !== '@onna') S.ent('onna').spr = '@onna';
    await S.think('就是现在——跑！去派出所！巷子尽头，亮着红灯的地方！');
    S.focus(18, 5); S.ent('ml1').s.blink = true;
    await S.think('她只会顺着大路追……\n要是被她追上，就钻进房子中间那种小胡同！');
    S.focus(null); S.ent('ml1').s.blink = false;
    S.f.phase = 'chase'; S.f._frz = 1.1; S.f.pomUsed = false; S.f.tpN = 0; S.f._alT = 0;
    resetChase(.6);
    S.amb('rain'); S.sfx('heart');
    S.goal('跑！去红灯派出所（可钻小胡同）');
    if (S.coop) S.toast('观看的人：点击画面，给同伴标出小胡同口');
    S.cp('chase');
  }
  function chaseOpts(extra) { return Object.assign({ spd: 3.1, zone: ZONE, catch: caught }, extra || {}); }
  function startChase(S) {
    const o = S.ent('onna'), ox = Math.round(o.px / TS), oy = Math.round(o.py / TS);
    if (!ROAD(ox, oy)) S.place('onna', ox, 7);
    S.sfx('sting'); S.bubble('onna', '!', 800);
    S.chase('onna', chaseOpts());
  }
  function knockBack(S, wait) {
    const p = W.pl, m = curMap(), o = S.ent('onna');
    let x = Math.max(1, p.x - 4);
    while (x > 1 && !passable(m, x, 7, o)) x--;
    leanX = 0; CS.pend = null; CS.drop = 0; CS.tp = Math.max(CS.tp, 2); S.f._alT = 0; CS.nextLean = 6;
    S.place('onna', x, 7, 2); o.alpha = 1;
    S.chase('onna', chaseOpts({ wait }));
  }
  async function caught(S) {
    S.sfx('sting'); S.shake(300, 2);
    if (S.has('candy')) {
      S.take('candy'); S.f.threw = true;
      await S.narr('冰凉的手指碰到了你的衣领——\n你想也没想，把口袋里的鳖甲糖扔了出去！');
      knockBack(S, 3.5); S.sfx('drip');
      await S.narr('糖块「嗒」地一声落进水洼。\n她猛地转过身，蹲下去，在雨水里摸索起来。');
      return;
    }
    if (!S.f.pomUsed) {
      const r = await S.ask('她冰凉的手抓住了你的书包带——', ['发蜡！发蜡！发蜡！', '（闭上眼睛）']);
      if (r === 0) {
        S.f.pomUsed = true;
        await S.say('你', '发蜡！发蜡！发蜡！', { style: 'big' });
        knockBack(S, 2.5);
        await S.narr('她像被烫着一样缩回了手，捂住口罩，往后退了好几步。\n……可她只是退开了，没有走。');
        return;
      }
    }
    await S.scare('face', { face: S.ent('onna').spr === '@onna2' ? 'onna2' : 'onna', dur: 1 });
    S.sfx('cut');
    await S.die('雨声里，有人贴着你的耳朵，轻轻地问：\n「呐——我，漂亮吗？」', '你被追上了');
  }
  /* 后巷里：她够不着你，就把你拽出来（死路里待太久 / 站在她探身的胡同口） */
  function grab(S, o, text) {
    leanX = 0; o.chase = null; o.mv = null; S.place('onna', Math.round(o.px / TS), Math.round(o.py / TS));
    S.after(0, async S => { S.sfx('sting'); S.shake(400, 3); await S.narr(text); await caught(S); });
  }
  /* 她出现在前面的路灯下（预警之后） */
  function appear(S, o, L) {
    S.f.tpN = (S.f.tpN || 0) + 1; CS.tp = 4;
    S.place('onna', L, 7, 1); o.alpha = .35; o.chase.wait = 1.2;
    if (S.f.tpN === 2) { o.py = 4.6 * TS; CS.drop = .35; S.sfx('thud'); }   // 第二次：从屋檐上跳下来（「能跳三米高」）
    S.sfx('sting'); S.bubble('onna', '…', 900);
    if (S.f.tpN === 1) S.after(0, S => S.think('她……在前面！\n拐进旁边的小胡同！'));
  }
  /* 按距离给声音：远处是湿漉漉的高跟鞋声，近了是剪刀开合，心跳越来越快 */
  function chaseSound(S, dt, d) {
    CS.snd -= dt; CS.hb -= dt;
    if (d < 3.5) { if (CS.snd <= 0) { S.sfx('cut'); CS.snd = .7; } }
    else if (d < 6) { if (CS.snd <= 0) { S.tone('triangle', 1900, 1100, .04, .1, 0, 3200); S.tone('sine', 260, 150, .07, .12, .02); CS.snd = 1.2; } }
    if (d < 10 && CS.hb <= 0) { S.sfx('heart'); CS.hb = .45 + d * .16; }
  }
  /* 玩家在后巷：她在大路上守着离你最近的那个胡同口；待久了会探身进来 */
  function alleyGuard(S, o, dt, ox, oy) {
    const p = W.pl; CS.pend = null;
    const seg = SEGS.find(s => p.x >= s[0] && p.x <= s[1]), ms = seg ? seg[2] : MOUTHS;
    let m = ms.reduce((a, b) => Math.abs(b - p.x) < Math.abs(a - p.x) ? b : a);
    if (p.y === 4 && MOUTHS.includes(p.x)) m = p.x;
    o.chase.wait = Math.max(o.chase.wait || 0, .2);   // 引擎的追逐先停一停，由这里带她走
    S.f._alT = (S.f._alT || 0) + dt;
    if (o.mv || o.chase.wait > .2) return;
    if (leanX) {
      CS.leanT -= dt;
      if (p.x === leanX && p.y === 4) return grab(S, o, '她把上半身探进胡同口，一把攥住了你的帽子——');
      if (CS.leanT <= 0 || leanX !== m) { leanX = 0; startMove(o, 0, 3.1); }
      return;
    }
    if (ox !== m || oy !== 6) { const d = bfsStep(curMap(), ox, oy, m, 6, o); if (d >= 0) startMove(o, d, 3.1); return; }
    o.dir = 3;
    if (ms.length === 1 && S.f._alT >= 10) return grab(S, o, '这条胡同是死路。\n胡同口那边，一只细细长长的手伸了进来，摸到了你的书包——');
    if (S.f._alT >= CS.nextLean) {
      CS.nextLean = S.f._alT + 5; CS.leanT = 1.6; leanX = m;
      S.sfx('cut'); S.bubble('onna', '…', 1200); startMove(o, 3, 2.6);
    }
  }
  async function enterKoban(S) {
    S.stop('onna'); S.hide('onna'); S.f.phase = 'safe'; leanX = 0; CS.pend = null;
    S.sfx('open');
    await S.go('koban', 4, 6, 3);
  }
  async function gotSmell(S) {
    S.f.smell = true;
    await S.think('……这个味道。是发蜡。\n小林说过，给她做手术的医生头上就抹着发蜡——她最怕这个味道。');
  }

  /* ---------- 家门口：最后的对峙 ---------- */
  async function finalMeet(S) {
    S.f.met = true;
    S.amb('none'); S.sfx('heart');
    S.focus(15, 3);
    await S.narr('你一步一步往家门口走。\n她慢慢地转过身来。');
    S.face('onna_h', 0);
    S.focus(null);
    await S.walk('onna_h', adjTo(S, 'onna_h'), 2.2);
    S.face('onna_h', 'pl'); S.face('pl', 'onna_h');
    await S.say('女人', '……又见面了呢。', { style: 'whisper' });
    await S.say('女人', '刚才的问题，你还没有好好回答我。');
    if (S.coop) { await S.narr('（这一次，好好商量。）'); await S.wait(1200); }
    const used = {};
    for (;;) {
      const opts = [], keys = [];
      const add = (k, t) => { keys.push(k); opts.push(t); };
      add('pretty', '漂亮。');
      if (!used.ok) add('ok', '还……还行吧。');
      if (S.has('candy') && !used.candy) add('candy', '（把鳖甲糖递给她）');
      if (used.candy && S.f.okMeet) add('rev', '（反问她）阿姨，你觉得自己漂亮吗？');
      add('pom', used.pom ? '发……发蜡……发蜡！' : '发蜡！发蜡！发蜡！');
      if (used.pom && S.f.smell) add('cop', '（回头大喊：巡查先生——！）');
      const k = keys[await askHer(S, '「呐——我，漂亮吗？」', opts)];
      if (k === 'pretty') { await maskOff(S, 'onna_h', '@onna2'); await S.ask('……', ['漂……漂亮……', '（说不出话来）'], '女人'); return badPretty(S, 'onna_h'); }
      if (k === 'ok') {
        used.ok = true;
        await S.say('女人', '还行？', { style: 'whisper' });
        await S.narr('她在口罩后面轻轻地笑了一声。');
        await S.say('女人', '同一句话，对我说第二次——就不灵了哦。');
        S.sfx('step');
        continue;
      }
      if (k === 'candy') {
        used.candy = true; S.take('candy'); S.f.gave = true;
        await S.narr('你把攥得发软的鳖甲糖递了过去。\n她接过来，隔着口罩闻了闻。');
        await S.say('女人', '……甜的。', { style: 'whisper' });
        await S.narr('她把糖攥在手心里，攥了很久。');
        await S.say('女人', '谢谢。可是——你还没有回答我。');
        continue;
      }
      if (k === 'pom') {
        if (used.pom) { await S.say('你', '发……发蜡……发蜡！'); await S.narr('你的声音抖得不成样子。'); return badPretty(S, 'onna_h', '……说过了呀。小孩子的把戏，第二次就更不灵了哦。'); }
        used.pom = true;
        await S.say('你', '发蜡！发蜡！发蜡！', { style: 'big' });
        S.shake(400, 2);
        await S.narr('她的肩膀猛地一缩，抬手挡住了脸。\n——可她没有走。她从指缝里看着你。');
        await S.say('女人', '……小孩子的把戏。', { style: 'whisper' });
        await leanIn(S, 'onna_h', 900);
        await S.narr('她弯下腰，口罩几乎贴到了你的帽檐上。');
        await S.think(S.f.smell ? '光喊没用……得是真的发蜡味。\n——巡查先生！他的头发上就有！' : '光喊没用……得是真的发蜡味才行。\n可是，上哪儿去找真的发蜡……');
        continue;
      }
      if (k === 'rev') return revEnd(S);
      break;
    }
    await S.narr('你猛地回过头，用尽全身的力气大喊：');
    await S.say('你', '巡查先生——！！', { style: 'big' });
    S.sfx('step');
    await S.say('大野巡查', '喂——！由纪？怎么了？喊什么呢？');
    await S.walk('cop_h', adjTo(S, 'cop_h'), 5);
    S.face('cop_h', 'pl');
    await S.narr('大野巡查小跑过来，一把摘下帽子，甩了甩上面的雨水。\n路灯底下，他那一头梳得油光锃亮的头发闪闪发亮。\n甜腻腻的发蜡味，一下子在雨里散开了。');
    S.sfx('scream'); S.fx('flash'); S.shake(700, 3);
    await S.narr('女人发出一声又尖又细的惨叫，像指甲刮过黑板。');
    await S.say('女人', '这个味道……那个医生……！', { style: 'big' });
    await S.alpha('onna_h', 0, 700);
    S.ent('lamp_h').flicker = false; S.amb('rain');
    await S.narr('风衣的下摆在路灯下一闪。\n等你再眨眼，灯下只剩下斜斜的雨丝。');
    await S.say('大野巡查', '……刚才是不是有什么东西跑过去了？好大一阵风。');
    if (S.f.gave) await S.narr('路灯下的水洼里，漂着一张揉皱的鳖甲糖包装纸。');
    await S.say('大野巡查', ['……算了。快进屋吧。替我跟你妈妈问声好。', '明天开始，放学可千万别再一个人走了。']);
    S.f.won = true;
    S.goal('回家');
  }
  /* 隐藏结局：反问她（流传的说法里，反问会让她困惑） */
  async function revEnd(S) {
    await S.narr('你攥紧了书包带，抬起头，看着口罩上面那双眼睛。');
    await S.say('你', '……阿姨，你觉得自己漂亮吗？');
    S.amb('none'); await S.wait(1200);
    await S.narr('雨声忽然变得很远。\n她一动不动地站着，站了很久，很久。');
    await S.narr('她慢慢地，把口罩拉了下来。');
    S.ent('onna_h').spr = '@onna2'; S.sfx('tear');
    await S.narr('裂开的嘴角在路灯底下，像一道很旧、很旧的伤疤。\n她没有笑。');
    await S.say('女人', '……以前，是很漂亮的。', { style: 'whisper' });
    await S.say('女人', '大家都这么说。');
    S.ent('onna_h').spr = '@onna';
    await S.narr('她重新戴好口罩，把那块鳖甲糖攥在手心里，转过身，走进了雨里。\n高跟鞋的声音，一下，一下，越来越远。');
    await S.alpha('onna_h', 0, 1200);
    S.ent('lamp_h').flicker = false; S.amb('rain');
    S.f.rev = true;
    S.sfx('step');
    await S.say('大野巡查', '由纪？怎么还站在雨里？……跟谁说话呢？');
    await S.walk('cop_h', adjTo(S, 'cop_h'), 4);
    S.face('cop_h', 'pl');
    await S.say('大野巡查', ['……路灯底下，没人啊。', '快进屋吧。替我跟你妈妈问声好。']);
    S.f.won = true;
    S.goal('回家');
  }

  /* ---------- 家里：结尾 ---------- */
  function noteCount() {
    try { const got = store.get('notes', []), ks = Object.keys(W.ch.notes); return '（本章笔记：' + ks.filter(k => got.includes(W.ch.id + ':' + k)).length + ' / ' + ks.length + '）'; } catch (e) { return ''; }
  }
  async function ending(S) {
    const g = S.ent('gdoor');
    await S.narr('玄关的拉门上镶着磨砂玻璃。\n门外的路灯，在玻璃上投下一团模模糊糊的光。');
    S.amb('none'); S.sfx('heart'); await S.wait(700);
    g.s.shadow = true;
    await S.narr('光里面，慢慢浮出一个人影。\n长长的头发。长长的风衣。');
    await S.wait(500); S.sfx('whisper'); g.s.wave = true;
    await S.narr(S.f.rev ? '人影抬起一只手——\n隔着玻璃，朝你轻轻地挥了挥。\n……像是在说再见。' : '人影抬起一只手——\n隔着玻璃，朝你轻轻地挥了挥。');
    await S.say('妈妈（客厅里）', '由纪？站在玄关干什么呢？饭要凉啦。');
    g.s.shadow = false; g.s.wave = false;
    S.amb('tv');
    await S.narr('你再看的时候，玻璃上只剩下路灯的光。');
    await S.fade(1, 1200);
    if (S.f.rev) {
      await S.card('第二天早上', '1979年6月23日（星期六）', '山本老师照常来上课。\n他说那天打完电话回到教室，你已经走了。\n\n由纪的课桌抽屉里，多了一张鳖甲糖的油纸。\n叠得整整齐齐，上面用口红写着一行小字：\n\n「谢谢你问我。」');
      return S.end({ title: '第二夜　完（另一个回答）', text: '那年夏天，暑假一开始，关于她的传闻就像退潮一样消失了。\n\n后来由纪长大了，每次听见有人说起裂口女，\n总会想起路灯底下那句很轻很轻的话——\n「以前，是很漂亮的。」\n\n' + noteCount() });
    }
    await S.card('第二天早上', '1979年6月23日（星期六）', '山本老师照常来上课。\n他说那天打完电话回到教室，你已经走了。\n\n由纪的课桌抽屉里，多了一只白色的口罩。\n叠得整整齐齐，' + (S.f.gave || S.f.threw ? '还带着一点点鳖甲糖的甜味。' : '还带着一点雨水的潮气。') + '\n口罩里面，用口红写着一行小字：\n\n「下次，要好好回答哦。」');
    await S.end({ title: '第二夜　完', text: '那年夏天，暑假一开始，关于她的传闻就像退潮一样消失了。\n\n只是每到梅雨季的黄昏，走过路灯底下的时候，\n由纪还是会下意识地，把嘴闭得紧紧的。\n\n' + noteCount() });
  }

  /* ---------- 她的大头像（惊吓特写，32×32） ---------- */
  function faceBase(R, a, t) {
    const hair = '#1a1214', hl = '#3a2e34', skin = '#ece0d6', sk2 = '#cdbdb2';
    // 长发：一直垂到画面底下，带几缕湿发的反光（不然在黑底上看不见）
    R(6, 1, 20, 31, hair); R(4, 6, 2, 26, hair); R(26, 6, 2, 26, hair); R(2, 14, 2, 18, hair); R(28, 14, 2, 18, hair);
    for (const x of [3, 5, 7, 24, 26, 28]) R(x, 10 + (x % 3) * 2, 1, 22 - (x % 3) * 2, hl);
    R(9, 2, 14, 1, hl); R(7, 3, 2, 1, hl); R(23, 3, 2, 1, hl);
    // 瘦长的脸
    R(11, 6, 10, 1, skin); R(10, 7, 12, 1, skin); R(9, 8, 14, 14, skin); R(10, 22, 12, 3, skin); R(11, 25, 10, 2, skin); R(13, 27, 6, 1, skin);
    R(21, 8, 2, 14, sk2); R(20, 22, 2, 3, sk2);
    // 刘海：中间分开，几缕垂到眼睛上
    R(8, 4, 16, 4, hair); R(9, 8, 2, 4, hair); R(13, 8, 1, 2, hair); R(18, 8, 2, 2, hair); R(21, 8, 2, 5, hair); R(15, 5, 2, 3, skin);
    // 眼睛：睁得很大，瞳孔只有一点点；越到后面越布满血丝
    R(10, 12, 5, 3, '#f6f2ea'); R(17, 12, 5, 3, '#f6f2ea');
    R(12, 13, 1, 1, '#120606'); R(19, 13, 1, 1, '#120606');
    R(10, 11, 5, 1, '#6a5052'); R(17, 11, 5, 1, '#6a5052');
    R(10, 15, 5, 1, '#c4a8a0'); R(17, 15, 5, 1, '#c4a8a0');
    if (a > .45) { R(10, 13, 1, 1, '#b83838'); R(21, 13, 1, 1, '#b83838'); R(11, 14, 1, 1, '#c86060'); R(20, 14, 1, 1, '#c86060'); R(14, 13, 1, 1, '#c86060'); R(17, 13, 1, 1, '#c86060'); }
  }
  const FACES = {
    onna(R, a, t) {   // 戴口罩：大得出奇的白口罩、长发、盯着你的眼睛，口罩边上渗出一点红
      faceBase(R, a, t);
      R(6, 17, 20, 10, '#f3f2eb'); R(7, 16, 18, 1, '#f3f2eb'); R(8, 27, 16, 1, '#f3f2eb');
      R(6, 20, 20, 1, '#d8d6cc'); R(6, 23, 20, 1, '#d8d6cc'); R(25, 17, 1, 10, '#c8c6bc');
      R(3, 18, 3, 1, '#e4e2da'); R(26, 18, 3, 1, '#e4e2da');                      // 挂耳的带子
      const k = Math.min(1, .25 + a);                                               // 口罩两边，慢慢渗出来的红
      R(7, 22, 1, 1, '#c84050'); R(24, 22, 1, 1, '#c84050');
      R(7, 23, 1, Math.round(1 + k * 4), '#a0141e'); R(24, 23, 1, Math.round(1 + k * 4), '#a0141e');
      if (k > .7) { R(8, 22, 1, 2, '#b02030'); R(23, 22, 1, 2, '#b02030'); }
    },
    onna2(R, a, t) {  // 摘下口罩：嘴从左耳裂到右耳，越张越大
      faceBase(R, a, t);
      const o = 1 + Math.round(Math.min(1, a * 1.6) * 4), lip = '#6a0a12', in_ = '#2a0206';
      R(5, 16, 2, 1, lip); R(6, 17, 2, 1, lip); R(7, 18, 2, 1, lip); R(8, 19, 3, 1, lip); R(25, 16, 2, 1, lip); R(24, 17, 2, 1, lip); R(23, 18, 2, 1, lip); R(21, 19, 3, 1, lip);
      R(9, 20, 14, o, in_); R(8, 20, 1, Math.max(1, o - 1), lip); R(23, 20, 1, Math.max(1, o - 1), lip);
      for (let i = 0; i < 6; i++) { R(10 + i * 2, 20, 1, 1, '#efe6d2'); R(10 + i * 2, 19 + o, 1, 1, '#d8ccb4'); }
      R(9, 20 + o, 14, 1, lip);
      R(6, 18, 1, 2 + Math.round(a * 5), '#8a0c14'); R(25, 18, 1, 2 + Math.round(a * 4), '#8a0c14');
      R(10, 15, 5, 1, '#c03030'); R(17, 15, 5, 1, '#c03030');
    },
    sci(R, a, t) {    // 大剪刀，刀刃一点点合上
      const tip = 3 + a * 9, st = '#d4d8de', ed = '#7a8088';
      for (let s = 0; s <= 1.0001; s += .05) {
        const yl = 22 - s * 19, xl = 16 + (tip - 16) * s, xr = 16 + (32 - tip - 16) * s;
        R(xl - 1, yl, 3, 1, st); R(xl + 1, yl, 1, 1, ed); R(xr - 1, yl, 3, 1, st); R(xr - 2, yl, 1, 1, ed);
      }
      R(15, 21, 3, 3, '#3a3a40'); R(16, 22, 1, 1, '#e8e8e8');
      R(8, 24, 7, 7, '#a01818'); R(10, 26, 3, 3, '#000'); R(18, 24, 7, 7, '#a01818'); R(20, 26, 3, 3, '#000');
      R(13, 23, 2, 2, '#a01818'); R(18, 23, 2, 2, '#a01818');
      if (Math.sin(t * 20) > .3) R(Math.round(16 + (tip - 16) * .6), 10, 2, 1, '#fff');
      R(4, 3, 1, 1, '#8a0c14'); R(27, 5, 1, 2, '#8a0c14');
    }
  };
  /* 她：比戴帽子的由纪高出一截——头顶的乱发、风衣下摆再长一点 */
  function tallOnna(d, R) {
    const hair = '#0e0a0c', top = '#c8b48a', dk = shade(top, -.22);
    if (d === 0 || d === 3) { R(4, 0, 8, 2, hair); R(3, 1, 1, 2, hair); R(12, 1, 1, 2, hair); R(3, 20, 10, 1, top); R(11, 20, 2, 1, dk); }
    else { R(5, 0, 6, 2, hair); R(4, 20, 8, 1, top); R(10, 20, 2, 1, dk); }
  }
  const ONNA = { key: 'onna', skin: '#e6d8cc', hair: '#0e0a0c', hs: 'long', top: '#c8b48a', top2: '#a8946a', coat: true, bottom: '#2a2424', shoes: '#7a1a1a', mask: true, eye: '#140c0e',
    extra(g, d, fr, G, R) { tallOnna(d, R); } };
  const ONNA2 = { key: 'onna-slit', skin: '#e6d8cc', hair: '#0e0a0c', hs: 'long', top: '#c8b48a', top2: '#a8946a', coat: true, bottom: '#2a2424', shoes: '#7a1a1a', slit: true, eye: '#140c0e',
    extra(g, d, fr, G, R) { tallOnna(d, R); if (d === 0) { R(4, G.hT + 5, 1, 1, '#8a1018'); R(11, G.hT + 5, 1, 1, '#8a1018'); } } };

  defChapter({
    id: 'kuchisake', n: 2, title: '裂口女', sub: '梅雨季的黄昏，路灯下戴口罩的女人拦住放学的孩子：「我漂亮吗？」', origin: '日本都市传说', color: '#6a3a2a',
    icon: '@onna', amb: 'wind', floor: 'lightwood', wall: 'school', dark: .7, plr: 3.2,
    people: {
      me: { key: 'yuki', skin: '#f1c9a5', hair: '#1e1618', hs: 'bob', top: '#f2efe6', top2: '#c84a4a', bottom: '#a83838', skirt: true, shoes: '#e8e0d0', child: true,
        extra(g, d, fr, G, R) { if (d === 3) { R(4, G.tT, 8, 6, '#a01818'); R(4, G.tT, 8, 1, '#6a0c0c'); } else if (d === 1) R(10, G.tT, 3, 5, '#a01818'); } },
      me2: { key: 'yuki-hat', skin: '#f1c9a5', hair: '#1e1618', hs: 'bob', top: '#f2efe6', top2: '#c84a4a', bottom: '#a83838', skirt: true, shoes: '#3a3030', child: true, hat: 'cap', hatC: '#e8c030',
        extra(g, d, fr, G, R) { if (d === 3) { R(4, G.tT, 8, 6, '#a01818'); R(4, G.tT, 8, 1, '#6a0c0c'); } else if (d === 1) R(10, G.tT, 3, 5, '#a01818'); } },
      onna: ONNA,
      onna2: ONNA2,
      onnaBig: Object.assign({}, ONNA, { big: true, key: 'onna-big' }),       // 她弯腰凑过来的一瞬间
      onna2Big: Object.assign({}, ONNA2, { big: true, key: 'onna-slit-big' }),
      teacher: { skin: '#e8c4a0', hair: '#2a2420', hs: 'short', top: '#5a5a60', top2: '#e8e8e8', bottom: '#3a3a40', shoes: '#2a2020' },
      miho: { skin: '#f3d0b0', hair: '#2a1a14', hs: 'twin', top: '#e8a0b0', top2: '#f8e8ec', bottom: '#e8a0b0', skirt: true, shoes: '#f0e0e0', child: true },
      kenta: { skin: '#d8a880', hair: '#141010', hs: 'messy', top: '#3a6ab0', top2: '#e8e8e8', bottom: '#2a2a3a', shoes: '#e0e0e0', child: true },
      koba: { key: 'koba', skin: '#f0caa8', hair: '#1a1414', hs: 'short', top: '#7a8a6a', top2: '#e8e8e0', bottom: '#3a3a3a', shoes: '#5a4a3a', child: true,
        extra(g, d, fr, G, R) { if (d === 0) { R(5, G.hT + 4, 2, 1, '#8a9aa8'); R(9, G.hT + 4, 2, 1, '#8a9aa8'); R(7, G.hT + 4, 2, 1, '#3a3a3a'); } else if (d === 1) R(5, G.hT + 4, 2, 1, '#8a9aa8'); } },
      sanae: { skin: '#f1cba8', hair: '#1a1414', hs: 'bob', top: '#f0f0f0', top2: '#2a3a6a', bottom: '#2a3a6a', skirt: true, shoes: '#e8e8e8', child: true },
      obaa: { skin: '#e2bc9c', hair: '#c8c4c0', hs: 'bun', top: '#6a5a4a', bottom: '#4a3a34', skirt: true, apron: '#3a4a6a', shoes: '#2a2a2a' },
      cop: { skin: '#e2b896', hair: '#141010', hs: 'short', top: '#2a3550', top2: '#d8d8d0', bottom: '#2a3550', shoes: '#141414', hat: 'cap', hatC: '#232c44' },
      mom: { skin: '#f0c8a8', hair: '#2a1a14', hs: 'bun', top: '#c89a6a', bottom: '#5a4a3a', skirt: true, apron: '#e8e2d6', shoes: '#c8b8a8' }
    },
    faces: FACES,
    items: {
      yen1: { name: '十元硬币', desc: '健太找了一下午的那枚十元硬币。明天还他。' },
      yen2: { name: '十元硬币', desc: '从电话亭退币口里掉出来的。不知道是谁忘了拿。' },
      candy: { name: '鳖甲糖', desc: '琥珀色的小糖块，用油纸包着，插着一根小竹签。二十日元。\n同学们说，扔给她，她就会去捡。' }
    },
    notes: {
      renraku: { title: '五年二班 · 联络网', text: '【五年二班　紧急联络网】\n有事时，按箭头一家传一家。接到电话的人，请马上往下传。\n\n山本老师 → 早苗家 → 小林家 → 健太家\n　　　　 → 美穗家 → ……\n\n……最下面一格：\n\n佐藤（由纪）　☎ 6-3958\n（这一行被红笔划掉了，旁边用铅笔补了一行小字：）\n　　　　　　　 ☎ 6-4172　※五月搬家，新号码\n\n（不知道谁在划掉的旧号码旁边，画了一个小小的、戴口罩的笑脸。）' },
      notice: { title: '学级通信 · 致家长（6月21日）', text: '各位家长：\n\n近日，市内及周边地区的儿童之间流传着关于「可疑女性」的传闻，有部分儿童因此不敢独自上学、放学。\n\n为保障儿童安全，本校自 6 月 22 日（周五）起实行「集团下校」：\n一、按居住地区编队，由教师护送至各区域路口；\n二、请家长尽可能到路口迎接；\n三、请教育孩子不要与陌生人交谈，也不要随意传播不实的传闻。\n\n××市立第二小学　校长\n\n（通知的一角，有人用铅笔画了一个戴口罩的小人。）' },
      rumor: { title: '被没收的纸条', text: '【口裂け女的真面目】　看完传给下一个人！\n\n1. 她是三姐妹里最小的。大姐做整形失败，二姐出了车祸，小妹看见姐姐们的脸，就自己拿剪刀……（这条被划掉了）\n2. 她是整形失败的。给她做手术的医生头上抹着发蜡。\n3. 她跑一百米只要六秒，能跳三米高。\n4. 她住在岐阜的山里。不对，是名古屋。不对，是你家附近。\n5. 看到这张纸的人，三天内要传给五个人，不然今天晚上她就会来问你。\n\n（纸角有老师的红笔字：放学后来职员室。）' },
      mag: { title: '周刊杂志的一页（被雨打湿了）', text: '《周刊话题》六月号\n\n席卷全国！小学生之间的「裂口女」恐慌\n\n今年年初，岐阜县的孩子们之间开始流传一个奇怪的故事。短短几个月，「她」已经北上青森、南下鹿儿岛。各地小学纷纷实行集团下校，有的地方警察还派出了巡逻车。\n\n「她」究竟是谁？有人说是整形失败的女人，有人说是从医院跑出来的病人，还有人说是三姐妹之一。本刊记者走访了多位小学生，得到的「目击情报」竟然没有两条是一样的——\n\n「她穿红色的风衣！」「不对，是白色的！」「她骑摩托车！」「她会飞！」\n\n（剩下的字被雨水泡开了，看不清。）' },
      police: { title: '电线杆上的告示', text: '【注　意】\n\n近来本辖区内接到多起关于「可疑女性」的报告：\n身穿长风衣，佩戴大型口罩，傍晚时分在小学附近出没，向儿童搭话。\n\n· 请勿单独行走\n· 遇到可疑人员请大声呼救，并尽快前往附近的派出所\n· 如有线索，请联系本署\n\n○○警察署\n\n（告示下面，不知是谁用红蜡笔歪歪扭扭地加了一行：\n她　跑　得　很　快）' },
      log: { title: '派出所 · 受理记录', text: '受理记录（大野）\n\n6月19日 16:15　家长来电，孩子不敢上学。已劝慰。\n6月20日 17:02　报称有女子在路灯下站立良久。到场时无人。地上有鳖甲糖包装纸一张。\n6月21日 18:30　报称同上，同一盏路灯。到场时无人。\n\n6月22日 15:40　小学生三名报称，在神社后面看见「裂口女」。到场查看：药店老板娘，花粉症，戴口罩。已说明。\n6月22日 16:30　儿童报称，小巷路灯下站着戴口罩的女人。到场时无人。\n6月22日 17:50　同上（另一名儿童）。到场时无人。地上有水迹，像是有人站了很久。\n6月22日 18:40　小学五年级女生一名，浑身湿透，报称在小巷遭「裂口女」追赶。到场查看：\n\n（后面还没有写。）' },
      clip: { title: '柜台边的旧剪报', text: '《美浓新闻》　一月×日　专栏「街角闲话」\n\n最近，郡里的孩子们之间流传着一个奇怪的故事。\n\n据说去年年底，本巢郡乡下的一位老太太夜里去院子里的茅厕，看见厕所旁边的暗处站着一个女人。女人的嘴，一直裂到耳朵根。老太太吓得腿软，回屋躺了三天。\n\n这件事不知怎么传到了孩子们的耳朵里，又变成了「放学路上会被戴口罩的女人拦住」。\n\n笔者小时候也听过类似的故事：雨夜里，狐狸变成女人……人心里的害怕，大概几百年都没变过。\n\n（剪报发黄了。阿婆在旁边用圆珠笔写着：「孙子说这个是真的」。）' },
      sisters: { title: '泡烂的小报（后巷）', text: '（一张被雨泡得发软的油印小报，是高年级学生自己印的。）\n\n【独家！裂口女的秘密】\n\n· 她们是三姐妹！大姐整形失败，二姐出了车祸，最小的妹妹因为太害怕，自己用剪刀把嘴……三个人现在都戴着口罩。\n· 她能一下子跳上三米高的屋顶，所以躲在屋檐上也没用。\n· 有人看见她骑着摩托车追小学生！还有人说她会跳上公交车的车顶。\n· 隔壁班的说：她是很久很久以前一个武士的老婆，因为太漂亮，被吃醋的丈夫……（字被泡开了）\n\n（最下面一行，用红笔描了好几遍：「她　不　会　拐　弯」）' }
    },
    legend: '裂口女（口裂け女）是日本战后流传最广的都市传说之一。她戴着大口罩、穿长风衣，在放学路上拦住孩子问：「我漂亮吗？」答「漂亮」，她就摘下口罩，露出一直裂到耳根的嘴，再问「这样也漂亮吗？」；答「不漂亮」，便会被她手里的剪刀（也有说是镰刀、菜刀）所伤。\n\n嘴裂到耳根的女人，在江户时代的怪谈里就出现过：比如雨夜里被人招呼共撑一把伞的女子，一回头嘴裂到耳根，原来是狐狸所变；也有吉原游女回眸露出裂嘴的故事。不过不少研究者认为，1979 年的那一场是独立兴起的新传说。据说最早的「目击」发生在 1978 年末的岐阜县乡下——一位老妇人夜里在院子的茅厕边看见了她；一般认为 1979 年 1 月《岐阜日日新闻》的一篇专栏最早在报上提到这个「孩子们之间的传闻」。春天起周刊杂志接连报道，到了六月，传闻已经北到青森、南到鹿儿岛。许多学校组织集团下校、家长接送，一些地方警察加强了巡逻，还真有人扮成她的样子上街而被逮捕。暑假一开始，热潮便迅速退去。\n\n她的「设定」几乎都是孩子们在口耳相传中一点点添上去的：整形手术失败（据说那个医生头上抹着发蜡，所以念三遍「发蜡」她就会逃走）、三姐妹、爱吃鳖甲糖、百米只要六秒、回答「普通」或「还行」她会愣住……有一种说法认为，补习班把不同学区的孩子聚到一起，成了传闻跨区扩散的通道。后来她又随着网络传到韩国等地，衍生出戴红口罩、不会拐弯之类的版本，也多次被拍成电影。在英语世界流传很广的「她原是平安（或江户）时代武士之妻，因不贞被丈夫割开了嘴」的起源，在日本早期的资料里找不到出处，一般认为是后来海外的改编；另外也有说法认为，反问她「你觉得自己漂亮吗」，会让她困惑得答不上来。\n\n（本章中的由纪、山本老师和同学们、驮菓子屋阿婆、大野巡查，以及学校通知、联络网、警方告示、《美浓新闻》剪报、杂志、小报与派出所记录的具体内容均为游戏虚构；「她只走大路」「会出现在前方路灯下」「守在胡同口」是本章为玩法设计的规则。）',
    start: { map: 'class', x: 8, y: 9, dir: 3 },
    resume: {
      chase: async S => {   // 死亡重来：她退到你身后四格，歪着头站一会儿，给你起步的时间
        const o = S.ent('onna'), p = W.pl, m = curMap(); S.stop('onna'); S.hide('sci'); resetChase(1.5);
        let x = Math.max(1, p.x - 4); while (x > 1 && !passable(m, x, 7, o)) x--;
        S.place('onna', x, 7, 2); o.spr = '@onna'; o.alpha = 0; S.f._frz = 2.0; S.f._alT = 0;
        S.amb('rain'); S.sfx('heart');
        await S.alpha('onna', 1, 600);
        await S.narr('她还歪着头站在雨里，一动不动……\n像是还在算那道算不出来的算术题。');
      },
      final: async S => {
        S.amb('rain');
        if (!S.f.smell) await S.think('大野巡查就站在身后。\n路灯底下，他那一头头发油光光的……');
      }
    },
    async intro(S) {
      await S.card('第二夜　裂口女', '1979年6月22日　日本岐阜县', '梅雨季。\n这个月，全校的孩子都在说同一个人——\n一个戴着大口罩的女人。\n\n她会在放学路上拦住你，问一个问题。');
    },
    sprites: {
      swin(g, e, t, R) {   // 教室窗户（墙面）。open：开着，窗帘飘
        R(1, 0, 14, 13, '#6a6a60');
        const sky = e.dusk ? ['#2a2440', '#4a3a5a'] : ['#e8803a', '#f0b868'];
        R(2, 1, 12, 6, sky[0]); R(2, 7, 12, 4, sky[1]); R(2, 9, 12, 2, e.dusk ? '#1a1420' : '#5a2a22');
        R(7, 1, 1, 11, '#6a6a60'); R(2, 6, 12, 1, '#6a6a60');
        if (e.open) { R(8, 1, 6, 11, 'rgba(255,220,180,.25)'); const s = Math.round(Math.sin(t * 3 + e.x) * 1.5); R(11 + s, 0, 3, 13, '#e8e2c8'); R(12 + s, 0, 1, 13, '#d0c8a8'); }
        if (e.face) { R(9, 1, 4, 3, '#140c0e'); R(8, 4, 6, 8, '#1a1214'); R(9, 4, 4, 1, '#e8e6de'); R(7, 2, 1, 9, '#140c0e'); R(14, 2, 1, 9, '#140c0e'); }   // 窗帘后面，一闪而过的高个子
        R(1, 12, 14, 2, '#8a8a80');
      },
      cboard(g, e, t, R) {   // 黑板：text 整版粉笔字；ghost 只在角落浮着一行很淡的字
        SPR.blackboard(g, e, t, R);
        if (!e.text && e.ghost) { R(13, 9, 8, 1, 'rgba(220,226,214,.6)'); R(14, 8, 1, 1, 'rgba(220,226,214,.5)'); R(17, 8, 2, 1, 'rgba(220,226,214,.45)'); R(20, 8, 1, 1, 'rgba(220,226,214,.4)'); }
      },
      clocker(g, e, t, R) {   // 扫除用具柜；eye：门缝里的一只眼睛
        SPR.locker(g, e, t, R);
        if (e.eye) { R(5, -4, 5, 3, '#0a0608'); R(5, -3, 5, 1, '#ece6dc'); R(7, -3, 1, 1, '#1a0606'); R(5, -3, 1, 1, '#c86060'); }
      },
      mlamp(g, e, t, R) {   // 胡同口旁边墙上的小门灯
        R(2, 1, 1, 6, '#3a3632'); R(2, 1, 4, 1, '#3a3632');
        const on = e.blink ? Math.sin(t * 14) > 0 : true;
        R(4, 2, 4, 4, on ? '#ffd890' : '#6a5a3a'); R(4, 6, 4, 1, '#5a4a30'); R(5, 3, 1, 1, on ? '#fff4d0' : '#8a7a5a');
        R(1, 9, 6, 1, '#4a4038'); R(2, 10, 1, 4, '#4a4038'); R(5, 10, 1, 4, '#4a4038');   // 墙根靠着的旧自行车（剪影）
        R(0, 11, 3, 3, 'rgba(20,18,16,.8)'); R(5, 11, 3, 3, 'rgba(20,18,16,.8)');
      },
      bigsci(g, e, t, R) {   // 她手里的大剪刀（画在她身上那一格的手边）
        const st = '#d6dade', ed = '#7a8088';
        for (let i = 0; i < 7; i++) { R(11 + i * .6, i, 1, 1, st); R(16 - i * .6, i, 1, 1, st); }
        R(13, 6, 2, 1, ed);
        R(11, 7, 3, 3, '#a01818'); R(12, 8, 1, 1, '#000'); R(14, 7, 3, 3, '#a01818'); R(15, 8, 1, 1, '#000');
        if (Math.sin(t * 9) > .6) R(16, 0, 1, 1, '#fff');
      },
      hatrack(g, e, t, R) {   // 派出所的衣帽架：挂着警帽和雨衣
        R(7, -12, 2, 26, '#5a4030'); R(4, 13, 8, 2, '#4a3424'); R(5, -12, 6, 1, '#6a4a34');
        R(4, -17, 8, 4, '#232c44'); R(3, -13, 10, 1, '#141414'); R(7, -16, 2, 1, '#c9a35a'); R(5, -17, 6, 1, '#34405e');
        R(9, -10, 5, 13, '#2a3550'); R(9, -10, 1, 13, '#3a4870'); R(12, 1, 2, 2, 'rgba(160,190,220,.5)');
      },
      genkanS(g, e, t, R) {   // 家里玄关的磨砂玻璃拉门（从屋里看，w=2）；shadow：玻璃上浮出长发的人影，wave：抬手
        box(R, 1, 0, 30, 15, '#4a3a2a');
        R(3, 1, 12, 13, '#d8cf9e'); R(17, 1, 12, 13, '#d8cf9e'); R(15, 1, 2, 13, '#4a3a2a');
        R(3, 1, 12, 3, '#e6deb0'); R(17, 1, 12, 3, '#e6deb0');
        for (let y = 5; y < 14; y += 4) { R(3, y, 12, 1, '#6a5a42'); R(17, y, 12, 1, '#6a5a42'); }
        if (e.shadow) {
          const c = 'rgba(28,20,26,.78)', c2 = 'rgba(28,20,26,.5)';
          R(7, 1, 5, 4, c); R(6, 2, 7, 9, c2); R(6, 5, 1, 7, c); R(12, 5, 1, 7, c);      // 头、垂下来的长发（左边那扇玻璃，不被由纪挡住）
          R(7, 5, 5, 9, c);                                                            // 风衣
          const up = e.wave ? Math.round((Math.sin(t * 5) + 1) * 1.5) : 0;
          R(4, 3 - up, 2, 7, c); R(3 - (up > 1 ? 1 : 0), 2 - up, 2, 2, c);              // 抬起来的手，慢慢地挥
        }
        R(14, 7, 1, 2, '#c9a35a'); R(17, 7, 1, 2, '#c9a35a');
      },
      booth(g, e, t, R) {   // 电话亭
        R(1, 13, 14, 2, 'rgba(0,0,0,.4)');
        box(R, 1, -16, 14, 30, '#c8c8c0'); R(2, -12, 12, 24, 'rgba(190,225,210,.55)');
        R(2, -16, 12, 4, '#f0ead0'); R(4, -15, 8, 2, '#c03030');
        R(6, -6, 4, 6, '#e0c040'); R(7, -8, 2, 2, '#a89030'); R(12, -2, 1, 4, '#888');
        R(2, -12, 1, 24, 'rgba(255,255,255,.4)');
      },
      denchu(g, e, t, R) {   // 电线杆 + 告示
        R(6, -30, 4, 45, '#6a6660'); R(6, -30, 1, 45, '#7e7a72'); R(1, -28, 14, 2, '#4a4844'); R(3, -26, 1, 2, '#ccc'); R(12, -26, 1, 2, '#ccc');
        R(5, -20, 6, 7, '#2a5a8a'); R(6, -18, 4, 1, '#ddd'); R(6, -16, 3, 1, '#ddd');
        R(4, -8, 8, 10, '#e8e4d0'); R(5, -6, 6, 1, '#a33'); R(5, -4, 6, 1, '#555'); R(5, -2, 4, 1, '#555'); R(5, 0, 5, 1, '#c33');
        R(4, 13, 8, 2, '#3a3832');
      },
      shutter(g, e, t, R) {   // 拉下的卷帘门（墙面）+ 招牌
        R(0, 0, 16, 14, '#8a8a86'); for (let y = 1; y < 14; y += 2) R(0, y, 16, 1, '#74746f'); R(0, 12, 16, 2, '#55554f');
        const c = e.col || '#2a4a7a'; R(0, -6, 16, 6, c); R(0, -6, 16, 1, shade(c, .2)); for (let i = 0; i < 3; i++) R(3 + i * 4, -4, 2, 2, '#e8e4d8');
      },
      dagashi(g, e, t, R) {   // 驮菓子屋的柜台 + 糖罐
        const W2 = (e.w || 1) * 16;
        box(R, 0, 2, W2, 12, '#7a5a3a'); R(1, 3, W2 - 2, 2, '#9a7a52');
        const cs = ['#d8a030', '#e86a8a', '#7ac06a', '#e8d070', '#8a6ad0', '#e88a40'];
        for (let i = 0; i < W2 / 8 - 1; i++) { const x = 2 + i * 8; R(x, -5, 6, 8, 'rgba(200,220,230,.55)'); R(x + 1, -2, 4, 4, cs[i % cs.length]); R(x, -6, 6, 1, '#c03030'); R(x + 1, -4, 1, 2, 'rgba(255,255,255,.6)'); }
      },
      kobanf(g, e, t, R) {   // 派出所门脸（w=3，墙面）
        R(0, -8, 48, 22, '#d8d4c8'); R(0, -8, 48, 2, '#a8a498'); R(0, 12, 48, 2, '#8a867c');
        R(16, -2, 16, 16, '#5a5a58'); R(17, -1, 14, 15, '#e8f2ee'); R(24, -1, 1, 15, '#7a7a78'); R(18, 0, 3, 6, '#fff');
        R(3, 0, 10, 8, '#e8f2ee'); R(35, 0, 10, 8, '#e8f2ee'); R(3, 4, 10, 1, '#7a7a78'); R(35, 4, 10, 1, '#7a7a78');
        const on = Math.sin(t * 2.2) > -.7; R(21, -14, 6, 6, on ? '#ff2a2a' : '#9a1a1a'); R(22, -15, 4, 1, on ? '#ff6a6a' : '#7a1a1a'); R(22, -13, 2, 2, on ? '#ffb0b0' : '#b02a2a'); R(23, -8, 2, 2, '#555');
        R(6, -6, 36, 3, '#2a3550');
      },
      pinkphone(g, e, t, R) {   // 走廊的粉红色公用电话。off：听筒垂下来
        box(R, 3, 5, 10, 10, '#6a4a30'); R(4, 6, 8, 1, '#8a6a48');
        box(R, 4, 0, 8, 6, '#e88aa8'); R(5, 2, 6, 2, '#c87090'); R(9, 1, 2, 1, '#ffd0e0');
        if (e.off) { const s = Math.round(Math.sin(t * 2.4) * 1.5); R(12, 2, 1, 8, '#2a2a2a'); R(12 + s, 9, 1, 3, '#2a2a2a'); R(11 + s, 11, 3, 4, '#e88aa8'); }
        else R(4, -1, 8, 2, '#e88aa8');
      },
      kasa(g, e, t, R) {   // 伞架
        R(4, -5, 1, 13, '#a02828'); R(4, -6, 2, 1, '#a02828'); R(7, -8, 1, 15, '#2a3a6a'); R(7, -9, 2, 1, '#2a3a6a'); R(10, -4, 1, 12, '#c8a030'); R(10, -5, 2, 1, '#c8a030'); R(12, -6, 1, 13, '#1a1a1a');
        box(R, 2, 6, 12, 9, '#5a5a60'); R(3, 7, 10, 1, '#7a7a80');
      },
      genkan(g, e, t, R) {   // 家门：磨砂玻璃拉门（墙面）
        box(R, 1, -2, 14, 16, '#4a3a2a');
        R(2, -1, 12, 14, e.lit ? '#e2cf94' : '#3a3a40'); R(7, -1, 2, 14, '#4a3a2a');
        for (let y = 2; y < 13; y += 4) R(2, y, 12, 1, '#6a5a42');
        R(5, 6, 1, 2, '#c9a35a'); R(10, 6, 1, 2, '#c9a35a');
        R(-1, -6, 4, 3, '#e8e2d0'); R(0, -5, 2, 1, '#333');
      },
      mask(g, e, t, R) { R(4, 8, 8, 5, '#ecebe4'); R(4, 10, 8, 1, '#c8c6bc'); R(3, 9, 1, 2, '#ddd'); R(12, 9, 1, 2, '#ddd'); R(2, 12, 12, 2, 'rgba(110,140,160,.35)'); },
      kyotaku(g, e, t, R) {   // 讲台（2 格宽）
        box(R, 0, 0, 32, 14, '#6a4a30'); R(1, 1, 30, 2, '#8a6a48'); R(12, 5, 8, 6, '#5a3a24');
        R(3, -2, 8, 4, '#3a5a8a'); R(4, -1, 6, 1, '#e8e4d8');
        if (!e.read2) { R(21, -2, 7, 5, '#e8e0c8'); R(22, -1, 5, 1, '#8a8070'); R(22, 1, 3, 1, '#c03030'); }
      }
    },
    maps: {
      /* ---------------- 五年二班教室（放学后） ---------------- */
      class: {
        amb: 'wind', dark: .38, darkC: '#1a0a06', plr: 3.4, wall: 'school', floor: 'lightwood',
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
          '#..............#',
          '#..............#',
          '################'],
        ents: [
          { id: 'cdoor', x: 1, y: 1, spr: 'sliding', async on(S) {
            if (!S.f.duty) { const l = dutyLeft(S); S.sfx('locked'); return S.narr(l.length ? '值日还没做完呢：' + l.join('、') + '。\n不做完的话，明天早苗又要在班会上点名了。' : '同学们还没走……再跟 ' + (3 - talked(S)) + ' 个人说说话吧。'); }
            S.sfx('open'); await S.go('hall', 3, 2, 0);
          } },
          { id: 'win1', x: 3, y: 1, spr: 'swin', open: true, light: { r: 5, col: 'rgba(255,140,60,.26)', dy: 22 }, async on(S) {
            const e = S.ent('win1');
            if (e.open) { e.open = false; S.f.w1 = true; S.sfx('close'); await S.narr('你踮起脚，把窗户拉上，扣好了月牙锁。\n操场上传来排队的口哨声。'); return classCheck(S); }
            await S.narr(S.f.duty ? '玻璃上映出你自己的脸，还有你身后空荡荡的教室。' : '窗外，远处的山被夕阳烧成了暗红色。');
          } },
          { id: 'board', x: 7, y: 1, spr: 'cboard', text: true, async on(S) {
            const e = S.ent('board');
            if (S.f.duty) return S.narr(S.once('boardAgain') ? '黑板明明擦干净了。\n可角落里，浮着一行很淡很淡的粉笔字——\n「わたし、きれい？」\n……刚才，明明没有的。' : '你不敢再看那个角落。');
            if (e.text) {
              await S.narr('黑板上还留着今天的字：「6月22日（金）　值日：佐藤」。\n角落里，不知道谁用粉笔画了一个戴大口罩的女人，嘴角一直画到了耳朵。');
              e.text = false; S.f.board = true; S.sfx('paper');
              await S.narr('你用黑板擦一下一下地擦着。粉笔灰在夕阳里慢慢地飘。');
              return classCheck(S);
            }
            await S.narr('黑板擦得干干净净。');
          } },
          { x: 10, y: 1, spr: 'wallclock', on: S => S.narr(S.f.duty ? '五点二十分。\n秒针走得特别响。' : '四点五十分。离天黑还早——你这么告诉自己。') },
          { id: 'win2', x: 12, y: 1, spr: 'swin', open: true, light: { r: 5, col: 'rgba(255,140,60,.26)', dy: 22 }, async on(S) {
            const e = S.ent('win2');
            if (e.open) {
              e.open = false; S.f.w2 = true;
              await S.narr('窗帘被风吹得鼓起来，像一个人站在那里。');
              e.face = true; S.fx('flash'); S.sfx('heart'); S.shake(200, 1);
              await S.wait(300); e.face = false;
              S.sfx('close');
              await S.narr('……你一把拉开窗帘。\n后面什么也没有。只有操场，和操场边上那盏刚亮起来的路灯。');
              await S.think('刚才……窗帘后面，是不是有个很高很高的人？');
              await S.narr('你把窗户关上了。');
              return classCheck(S);
            }
            await S.narr(S.f.duty ? '校门口那盏路灯亮了。灯下没有人。……应该没有人。' : '风里有一股潮湿的泥土味。梅雨又要来了。');
          } },
          { id: 'renraku', x: 14, y: 1, spr: 'poster', col: '#e8e4d0', async on(S) {
            const first = !S.f.num; S.f.num = true;
            await S.note('renraku');
            if (first) await S.think('上个月刚搬的家。新号码……还没背熟。\n（联络网记在笔记里了，可以随时翻看。）');
          } },
          { id: 'kyotaku', x: 7, y: 3, w: 2, spr: 'kyotaku' },
          { id: 'kyR', x: 8, y: 3, spr: 'invisible', solid: true, async on(S) {
            S.ent('kyotaku').s.read2 = true;
            if (S.once('rumorP')) await S.narr('讲台上压着一张折成小方块的纸。是山本老师上午在课上没收的。');
            return S.note('rumor');
          } },
          { id: 'kyL', x: 7, y: 3, spr: 'invisible', solid: true, async on(S) {
            if (S.f.journal) return S.narr('学级日志。你写的那一行字，墨水已经干了。');
            await S.narr('学级日志。前面几页是别的值日生写的：\n「6月19日　小林：健太说在校门口看见了裂口女，结果是戴口罩的保健室老师。」\n「6月20日　早苗：今天很多人是爸爸妈妈来接的。」');
            await S.ask('今天写点什么呢？', ['「今天开始集团下校。大家一起回家。」', '「健太又在走廊上跑了。」', '「明天也是晴天就好了。」']);
            S.f.journal = true; S.sfx('paper');
            await S.narr('你一笔一画地写完，在「值日生」那一栏签上了自己的名字。');
            return classCheck(S);
          } },
          { id: 'teacher', x: 7, y: 2, spr: '@teacher', dir: 0 },
          ...[2, 3, 5, 6, 9, 10, 12, 13].flatMap(x => [5, 7].map(y => ({ x, y, spr: 'schooldesk', on: S => S.narr(x === 5 && y === 7 ? '你的座位。桌面上刻着一个小小的猫。是上一届的学长刻的。' : x === 10 && y === 7 ? '健太的桌子。抽屉里塞满了画着奥特曼的卡片。' : ['课桌里塞着忘带回家的算术本。', '椅子没推进去，歪在过道上。', '桌面上用铅笔写着「口裂け女」，又被橡皮擦得一团黑。'][(x + y) % 3]) }))),
          { id: 'coin', x: 10, y: 8, spr: 'coin', touch: S => S.ent('coin').on(S), async on(S) {
            S.hide('coin'); S.give('yen1');
            await S.narr('健太的座位底下，躺着一枚十元硬币。\n……是他找了一下午的那一枚吧。');
            await S.think('明天还给他。');
          } },
          ...[1, 2, 3, 4, 5].map(x => ({ x, y: 10, spr: 'shelf', on: S => S.narr(['书包柜。大家的书包都背走了，只剩下一只忘带的室内鞋。', '格子里放着谁的竖笛。', '贴着「佐藤」名牌的格子。空的——书包在你背上。', '美穗的格子里放着一只叠好的白口罩。她妈妈说最近要戴着。', '一盆牵牛花，是理科课上种的。还没开。'][x - 1]) })),
          { id: 'locker', x: 14, y: 10, spr: 'clocker', async on(S) {
            if (S.once('lk1')) return S.narr('扫除用具柜。扫帚、拖把、水桶。\n柜门关不严，留着一条细细的黑缝。');
            if (S.once('lk2')) {
              await S.narr('你又看了一眼那条黑缝。');
              S.ent('locker').s.eye = true; S.sfx('heart'); S.shake(200, 1);
              await S.narr('……缝里，有一只眼睛。\n正往外看着你。');
              S.ent('locker').s.eye = false;
              await S.wait(300);
              S.sfx('open');
              return S.narr('你一把拉开柜门——\n扫帚、拖把、水桶。还有一股湿抹布的味道。\n……什么也没有。');
            }
            await S.narr('扫除用具柜。你不想再拉开它了。');
          } },
          { id: 'miho', x: 4, y: 6, spr: '@miho', dir: 0, async on(S) {
            S.face('miho', 'pl');
            if (S.f.k_miho) return S.say('美穗', '……我妈妈说，那都是骗小孩的。可是她这几天都给我戴口罩。');
            S.f.k_miho = true;
            await S.say('美穗', ['……由纪，你今天值日？那你一个人回家吗？', '我表姐说，她穿着长长的风衣，脸上戴着那种很大很大的白口罩。', '她会在路灯底下拦住你，问：「我漂亮吗？」', '要是你说「漂亮」，她就把口罩摘下来……嘴一直裂到这里。（美穗用手指在自己脸颊上划了一道）', '然后再问你一遍：「这样，也漂亮吗？」']);
            await S.say('美穗', '……我不想听了。我想快点跟大家一起回家。');
            return classCheck(S);
          } },
          { id: 'kenta', x: 10, y: 6, spr: '@kenta', dir: 0, async on(S) {
            S.face('kenta', 'pl');
            if (S.f.k_kenta) return S.say('健太', S.has('yen1') ? '……喂，你是不是捡到我的十块钱了？算了算了，明天再说。' : '我的十块钱到底掉哪儿了啊……那可是我买汽水的钱。');
            S.f.k_kenta = true;
            await S.say('健太', ['嘿嘿，怕了吧？跟你说，要是你回答「不漂亮」——', '（他把两根手指在嘴边一开一合）咔嚓。', '跑也没用。她跑一百米只要六秒！比运动会上跑第一名的六年级还快一倍！']);
            await S.say('健太', ['……不过我才不怕呢。我要是碰上她，就骑自行车甩掉她。', '对了，谁看见我的十块钱了？午饭以后就找不着了。']);
            return classCheck(S);
          } },
          { id: 'koba', x: 13, y: 8, spr: '@koba', dir: 1, async on(S) {
            S.face('koba', 'pl');
            if (S.f.k_koba) return S.say('小林', '资料不全的说法，我是不会乱讲的。……三姐妹那个，你就当没听过。');
            S.f.k_koba = true;
            await S.say('小林', ['根据我的调查——', '她以前是个漂亮的大姐姐，去做整形手术，结果医生的手一抖，把她的嘴割坏了。', '那个医生的头上，抹着厚厚的发蜡。所以她最怕发蜡的味道。', '碰上她，就连着说三遍「发蜡、发蜡、发蜡」，她就会捂着脸逃走。']);
            await S.say('小林', ['还有人说，她不会拐弯，只会顺着大路追。所以要往小胡同里跑。', '另外还有一种说法，她们是三姐妹，最小的那个……算了。资料不全，不能乱讲。']);
            return classCheck(S);
          } },
          { id: 'sanae', x: 2, y: 8, spr: '@sanae', dir: 2, async on(S) {
            S.face('sanae', 'pl');
            if (S.f.k_sanae) return S.say('早苗', '你还站着干嘛？先擦黑板呀。');
            S.f.k_sanae = true;
            await S.say('早苗', ['你们别老吓唬人了。', '……不过万一真碰上了，记住两件事。', '第一，她喜欢吃鳖甲糖。扔一块给她，她会蹲下去捡，你就有时间跑。', '第二，别说「漂亮」，也别说「不漂亮」。就说「还行吧」，或者「普通」。', '她会愣住，想不明白是什么意思。趁那一会儿，赶紧跑。']);
            await S.say('早苗', '我名古屋的表姐教我的。灵不灵我可不知道。');
            return classCheck(S);
          } }
        ],
        async enter(S, first) {
          if (!first) return;
          await S.narr('放学的铃声响过很久了。\n夕阳从窗户斜照进来，把半间教室染成了橘红色。');
          await S.say('山本老师', ['都坐好，书包先别急着背。', '最近市里有些……不太好的传闻。说是傍晚有个戴口罩的女人，在小学附近转悠，跟小孩搭话。', '学校决定，从今天开始实行集团下校。同一个方向的同学排成一队，老师送你们到路口。']);
          S.bubble('kenta', '!', 1000);
          await S.say('健太', '是裂口女！老师，是裂口女对吧！');
          S.bubble('miho', '…', 1200);
          await S.say('山本老师', ['安静。没有什么裂口女。', '是「可疑的人」。可疑的人不管戴不戴口罩，都离远一点。记住了吗？', '十分钟以后操场集合。今天的值日生，做完值日再下来。……今天谁值日？']);
          await S.say('早苗', '佐藤同学！');
          S.face('teacher', 'pl');
          await S.say('山本老师', ['佐藤，黑板、窗户、学级日志。做完了到操场找队伍，千万别一个人走。', '老师去职员室打个电话，马上回来。']);
          S.sfx('open');
          await S.walk('teacher', [1, 2], 4);
          S.hide('teacher'); S.sfx('close');
          await S.say('健太', '老师走了！喂喂，由纪，你知道吗——');
          S.goal('和同学们聊聊（至少 3 人）；做值日：擦黑板、关窗、写学级日志');
        }
      },
      /* ---------------- 走廊与玄关 ---------------- */
      hall: {
        amb: 'wind', dark: .74, plr: 3.2, wall: 'school', floor: 'linoleum',
        rows: [
          '######################',
          '######################',
          '#nnnnnnnnnnnnnnnnnnnn#',
          '#nnnnnnnnnnnnnnnnnnnn#',
          '#########nnnn#########',
          '#########nnnn#########',
          '#xxxxxxxxxxxxxxxxxxxx#',
          '#xxxxxxxxxxxxxxxxxxxx#',
          '#xxxxxxxxxxxxxxxxxxxx#',
          '#########xxxx#########'],
        ents: [
          { x: 3, y: 1, spr: 'sliding', to: ['class', 1, 2, 0] },
          { x: 6, y: 1, spr: 'window', light: { r: 3, col: 'rgba(110,120,190,.12)', dy: 20 }, on: S => S.narr('窗外的操场空空的。单杠的影子拖得老长。') },
          { x: 8, y: 1, spr: 'poster', col: '#e8dca8', on: S => S.narr('「走廊上不许奔跑！」\n下面写着健太的名字，被人画了三个大叉。') },
          { x: 10, y: 1, spr: 'window', light: { r: 3, col: 'rgba(110,120,190,.12)', dy: 20 }, async on(S) {
            if (S.once('gateFig')) { S.sfx('heart'); await S.narr('校门口的路灯下，好像站着一个人。\n穿着长长的风衣，一动不动，正朝这边看。'); await S.wait(500); return S.narr('……你揉了揉眼睛。\n灯下什么也没有。'); }
            await S.narr('校门口的路灯亮着。灯下什么也没有。');
          } },
          { x: 13, y: 1, spr: 'window', light: { r: 3, col: 'rgba(110,120,190,.12)', dy: 20 }, on: S => S.narr('玻璃上落了几点雨。') },
          { x: 16, y: 1, spr: 'door', locked: true, async on(S) {
            S.sfx('knock'); await S.wait(300); S.sfx('knock');
            await S.narr('「老师？山本老师？」\n职员室的门锁着。门上的玻璃黑乎乎的，里面一盏灯也没开。');
            await S.think('……老师不是说，去打电话了吗？');
          } },
          { id: 'hphone', x: 19, y: 2, spr: 'pinkphone', off: true, async on(S) {
            await S.narr('职员室门口那台粉红色的电话。\n听筒从机身上垂下来，悬在半空，一晃，一晃。');
            S.sfx('tick');
            await S.narr('你把听筒拿到耳边。\n「嘟——嘟——嘟——」只有忙音。');
            if (S.once('hph')) { await S.wait(500); S.sfx('whisper'); await S.narr('……忙音中间，好像夹着一声很轻很轻的笑。'); }
            S.ent('hphone').off = false; S.sfx('close');
            await S.narr('你把听筒挂了回去。');
            if (!S.f.shoes) S.goal('去玄关换鞋，自己回家');
          } },
          { id: 'notice', x: 15, y: 5, spr: 'poster', col: '#dcd4b8', on: S => S.note('notice') },
          ...[2, 3, 4, 6, 7].map(x => ({ x, y: 6, spr: 'getabako', on: S => S.narr(['鞋柜。一格一格的，室外鞋都被穿走了。', '有一格里塞着一双湿透的运动鞋。', '这一格的名牌被撕掉了。'][x % 3]) })),
          { id: 'mybox', x: 5, y: 6, spr: 'getabako', async on(S) {
            if (S.f.shoes) return S.narr('你的鞋柜。室内鞋整整齐齐地放在里面。');
            S.f.shoes = true; S.wear('@me2'); S.sfx('item');
            await S.narr('你换上室外鞋，戴好黄色的小帽子。\n帽檐上用油性笔写着：五年二班　佐藤由纪。');
            S.goal('回家（出了校门，穿过商店街）');
          } },
          { x: 18, y: 6, spr: 'kasa', on: S => S.narr('伞架。你早上带来的那把红伞，被健太借走了，到现在也没还。\n……只好淋雨回家了。') },
          ...[9, 10, 11, 12].map(x => ({ x, y: 9, spr: 'invisible', async touch(S) {
            if (!S.f.shoes) { S.pos(x, 8, 3); return S.narr('还穿着室内鞋呢。……先去鞋柜换鞋。'); }
            await S.go('street', 1, 5, 2);
          } }))
        ],
        async enter(S, first) {
          if (!first) return;
          await S.narr('走廊上一个人也没有。\n远远地，只有职员室门口那台电话，听筒垂在半空，一晃，一晃。');
          S.goal('去职员室找山本老师');
        }
      },
      /* ---------------- 商店街（暮色） ---------------- */
      street: {
        amb: 'rain', dark: .72, plr: 3.2, wall: 'wood', floor: 'asphalt', rain: true,
        rows: [
          '##############################',
          '###wwwww######################',
          '###wwwww######################',
          '______________________________',
          '::::::::::::::::::::::::::::::',
          '==============================',
          '::::::::::::::::::::::::::::::',
          '______________________________',
          'ffffffffffffhhhhhhhhffffffffff'],
        tileOpts: { fenceBase: 'sidewalk' },
        ents: [
          { x: 3, y: 1, spr: 'shelf' },
          { x: 7, y: 1, spr: 'shelf' },
          { x: 3, y: 2, spr: 'box', on: S => S.narr('纸箱里装满了弹珠汽水的空瓶。\n后面的货架上摆着面子牌、纸气球、一排排的小零食，全都是十元、二十元的东西。') },
          { x: 7, y: 2, spr: 'sack', on: S => S.narr('一麻袋炒豆子。\n货架上挂着一串抽奖纸签，头奖是一只塑料的超合金机器人。') },
          { id: 'obaa', x: 5, y: 1, spr: '@obaa', dir: 0, light: { r: 3.8, col: 'rgba(255,200,120,.22)', dy: 4 }, on: S => obaaTalk(S) },
          { id: 'counter', x: 4, y: 2, w: 3, spr: 'dagashi', on: S => obaaTalk(S) },
          { id: 'clip', x: 2, y: 2, spr: 'poster', col: '#d8cfa8', async on(S) { if (S.once('clipP')) await S.narr('店门口的柱子上，用图钉钉着一张发黄的剪报。'); await S.note('clip'); } },
          { x: 10, y: 3, spr: 'vending', col: '#c83030', light: { r: 1.6, col: 'rgba(220,240,255,.15)' }, on: S => S.narr('自动售货机。可乐五十日元。\n灯管嗡嗡地响。你摸了摸口袋。') },
          { x: 11, y: 2, spr: 'shutter', col: '#8a2a2a', on: S => S.narr('肉店的卷帘门已经拉下来了。门上贴着：「本日休业」。') },
          { x: 12, y: 2, spr: 'shutter', col: '#8a2a2a' },
          { x: 14, y: 2, spr: 'window', lit: true, light: { r: 1.8, col: 'rgba(255,210,130,.15)' }, on: S => S.narr('书店还亮着灯。门口的杂志架上，好几本周刊的封面都印着同一个大字标题：「口裂け女」。') },
          { x: 15, y: 2, spr: 'shutter', col: '#2a4a7a' },
          { x: 17, y: 2, spr: 'shutter', col: '#3a6a3a', on: S => S.narr('蔬菜店。卷帘门上用粉笔写着：「这几天傍晚五点关门」。') },
          { x: 18, y: 2, spr: 'shutter', col: '#3a6a3a' },
          { x: 20, y: 2, spr: 'window', on: S => S.narr('二楼的窗户黑着。窗帘后面，好像有人往下看了一眼。') },
          { x: 22, y: 2, spr: 'shutter', col: '#6a5a2a' },
          { x: 23, y: 2, spr: 'shutter', col: '#6a5a2a', on: S => S.narr('钟表店。卷帘门的缝里，一齐传出来几十只钟的「嘀嗒」声。') },
          { x: 26, y: 2, spr: 'poster', col: '#d8b880', on: S => S.narr('夏日祭的海报：「七月十四日　盆舞大会」。\n海报上跳舞的女人们都戴着斗笠，看不见脸。') },
          { id: 'lampA', x: 13, y: 3, spr: 'streetlamp', light: { r: 3.4, col: 'rgba(255,225,150,.18)', dy: 10 } },
          { id: 'lampB', x: 24, y: 7, spr: 'streetlamp', light: { r: 3.4, col: 'rgba(255,225,150,.18)', dy: 10 } },
          { x: 4, y: 7, w: 2, spr: 'bench', on: S => S.narr('公交站的长椅。椅面湿了。') },
          { id: 'mag', x: 8, y: 7, spr: 'newspaper', async on(S) { if (S.once('magP')) await S.narr('公交站边上的水洼里，泡着一本被雨打湿的周刊，正好翻在某一页。'); await S.note('mag'); } },
          { id: 'pole', x: 12, y: 7, spr: 'denchu', on: S => S.note('police') },
          { id: 'booth', x: 18, y: 7, spr: 'booth', light: { r: 2.6, col: 'rgba(230,255,235,.2)', dy: -4 }, on: S => booth(S) },
          { x: 21, y: 6, spr: 'puddle', decal: true }, { x: 8, y: 4, spr: 'puddle', decal: true }, { x: 27, y: 7, spr: 'puddle', decal: true },
          ...[3, 4, 5, 6, 7].map(y => ({ x: 0, y, spr: 'invisible', to: ['hall', 10, 8, 3] })),
          ...[3, 4, 5, 6, 7].map(y => ({ x: 29, y, spr: 'invisible', async touch(S) {
            if (!S.f.called) { S.pos(28, y, 1); return S.think('天快黑了……先给家里打个电话吧。让妈妈来路口接我。\n电话亭就在那边。'); }
            await S.go('alley', 1, 7, 2);
          } }))
        ],
        async enter(S, first) {
          if (!first) return;
          await S.narr('校门外的商店街。一半的店已经拉下了卷帘门。\n天边还剩一点红，细细的雨丝飘下来了。');
          S.goal('给家里打个电话（电话亭）');
        }
      },
      /* ---------------- 回家的小巷（夜，雨） ---------------- */
      alley: {
        amb: 'rain', dark: .9, plr: 2.7, wall: 'concrete', floor: 'asphalt', rain: true, fog: .15,
        rows: [
          '##########################################',
          '##########################################',
          '#dddddddddddddddddddddddddddddddddddddddd#',
          '#dddddddddddddddddddddddddddddddddddddddd#',
          '##########k#######k#######k#######k#######',
          '##########k#######k#######k#######k#######',
          '________________________________________LL',
          '::::::::::::::::::::::::::::::::::::::::LL',
          '::::::::::::::::::::::::::::::::::::::::LL',
          '________________________________________LL',
          'ffffffffhhhhhhhhffffffffhhhhhhhhffffffffff',
          'TT"T"TT"T"TTT"T"TT"T"TTT"T"TT"T"TT"T"TT"TT'],
        tileOpts: { fenceBase: 'sidewalk' },
        ents: [
          ...LAMPS.map((x, i) => ({ id: 'lamp' + i, x, y: 6, spr: 'streetlamp', light: { r: 3.4, col: 'rgba(255,225,150,.2)', dy: 12 }, on: S => S.narr(['路灯底下，雨丝一根一根地亮。', '这盏灯一闪一闪的，像在眨眼。', '灯罩里积着一层死掉的小飞虫。', '电线杆上贴着「痴汉注意」的旧告示。'][i]) })),
          ...[2, 8, 16, 24, 28, 32].map((x, i) => ({ x, y: 5, spr: 'window', lit: i % 2 === 0, light: i % 2 === 0 ? { r: 1.6, col: 'rgba(255,200,120,.14)' } : null, on: S => S.narr(i % 2 === 0 ? '人家的窗户亮着灯，里面传出电视的声音。……可是没有一个人往外看。' : '黑着的窗户。纱窗破了一个洞。') })),
          /* 每个胡同口旁边一盏小门灯，靠着一辆旧自行车——好认 */
          ...MOUTHS.map((x, i) => ({ id: 'ml' + i, x: x + 1, y: 5, spr: 'mlamp', light: { r: 1.5, col: 'rgba(255,190,110,.24)', dx: 6, dy: 8 }, on: S => S.narr('胡同口旁边的小门灯。墙根靠着一辆生了锈的自行车。\n胡同很窄，大人得侧着身子才挤得进去。') })),
          ...[5, 33].map(x => ({ x, y: 1, spr: 'window', on: S => S.narr('后墙上的小窗，关得死死的。') })),
          { x: 20, y: 1, spr: 'window', lit: true, light: { r: 1.8, col: 'rgba(255,200,120,.12)', dy: 16 }, on: S => S.narr('后墙上的小窗透出一点昏黄的光。\n里面有人在洗碗，碗碰着碗，叮叮当当的。') },
          /* 后巷：啤酒箱把它隔成三段——10 号口和 34 号口后面是死路，18 和 26 之间可以绕过去 */
          ...[[4, 2, 'plant'], [14, 2, 'crate'], [14, 3, 'crate'], [21, 3, 'barrel'], [24, 2, 'crate'], [29, 2, 'plant'], [30, 2, 'crate'], [30, 3, 'barrel'], [37, 2, 'crate']].map(([x, y, spr]) => ({ x, y, spr, on: S => S.narr({ plant: '谁家放在后门口的盆栽，叶子被雨打得一颤一颤的。', crate: '一摞啤酒箱，堆得比你还高，把胡同堵死了。空瓶子在雨里叮叮地响。', barrel: '接雨水的木桶，满了，水从边上漫出来。挪不动。' }[spr]) })),
          ...[[7, 3], [22, 2], [31, 3], [12, 8], [26, 7], [35, 9]].map(([x, y]) => ({ x, y, spr: 'puddle', decal: true })),
          { id: 'sisters', x: 16, y: 2, spr: 'newspaper', async on(S) { if (S.once('sisP')) await S.narr('墙根底下贴着一张被雨泡软了的小报。'); await S.note('sisters'); } },
          { x: 8, y: 8, spr: 'mask', solid: false, async on(S) { await S.narr('水洼里泡着一只白色的口罩。\n系带断了一边。'); await S.think('……是谁掉的？'); } },
          { id: 'koban', x: 37, y: 5, w: 3, spr: 'kobanf', light: { r: 4.4, col: 'rgba(255,50,40,.34)', dx: 24, dy: 28 }, async on(S) {
            if (S.f.phase === 'chase') return enterKoban(S);
            await S.narr('派出所。门口的红灯在雨里一亮一亮的。');
          } },
          { id: 'onna', x: 14, y: 7, spr: '@onna', hidden: true, solid: false, dir: 1 },
          { id: 'sci', x: 14, y: 7, spr: 'bigsci', hidden: true, solid: false, z: 1 },
          ...[6, 7, 8, 9].map(y => ({ x: 0, y, spr: 'invisible', async touch(S) {
            if (S.f.phase === 'chase') { S.pos(1, y, 2); return S.think('不能回去！派出所就在前面——巷子尽头的红灯！'); }
            await S.go('street', 28, 5, 1);
          } }))
        ],
        async enter(S, first) {
          if (!first) return;
          await S.narr('天完全黑了。\n雨越下越大，打在铁皮屋檐上噼噼啪啪地响。');
          await S.think('穿过这条巷子，再拐个弯就到家了。\n巷子尽头有派出所，亮着红灯……没事的。');
          S.goal('回家：穿过这条巷子');
          S.cp('alley');
        },
        step(S, x, y) {
          if (!S.f.phase && y <= 5) { S.pos(x, 6, 0); return S.think('房子后面的小胡同黑漆漆的，又窄又湿。……还是走大路吧。'); }
          if (!S.f.phase && x >= 11) return meet(S);
          if (S.f.phase === 'chase' && x >= 37 && y >= 6) return enterKoban(S);   // 跑到派出所门前，哪一行都算：撞开玻璃门
        },
        tick(S, dt) {
          if (S.f.phase !== 'chase' || W.busy || W.ended) return;
          const o = S.ent('onna'); if (!o || o.hidden) return;
          const p = W.pl, vis = VW / TS / 2, off = Math.max(1, Math.min(4, vis - 3));
          S.focus(p.px / TS + off, 6.5);   // 镜头前置：看得见前面的路灯（手机竖屏也一样）
          if (CS.drop > 0) { CS.drop = Math.max(0, CS.drop - dt); o.py = (7 - 2.4 * CS.drop / .35) * TS; }
          if (o.alpha < 1) o.alpha = Math.min(1, o.alpha + dt * (o.chase && o.chase.wait > 0 ? .55 : 2.5));
          if (S.f._frz > 0) { S.f._frz -= dt; if (S.f._frz <= 0) startChase(S); return; }
          if (!o.chase) return;
          const ox = Math.round(o.px / TS), oy = Math.round(o.py / TS);
          chaseSound(S, dt, Math.hypot(o.px - p.px, o.py - p.py) / TS);
          if (p.y <= 4) return alleyGuard(S, o, dt, ox, oy);   // 你在后巷：她守胡同口
          S.f._alT = 0; CS.nextLean = 6; leanX = 0;
          /* 你在大路上、她落在后面 → 先让前面某盏路灯闪 0.8 秒（心跳预警），她再「出现」在灯下。整段最多两次 */
          CS.tp -= dt;
          if (CS.pend) { if ((CS.pend.t -= dt) <= 0) { const L = CS.pend.L; CS.pend = null; appear(S, o, L); } return; }
          if (CS.tp > 0 || (S.f.tpN || 0) >= 2 || p.y < 6 || ox >= p.x - 1) return;
          const maxD = vis + off - 1, minD = Math.min(8, Math.floor(maxD));   // 只在看得见的范围里；中间至少隔着一个胡同口
          const L = LAMPS.find(l => l - p.x >= minD && l - p.x <= maxD && MOUTHS.some(m => m > p.x && m < l));
          if (L == null) return;
          CS.pend = { L, t: .8 };
          LAMPS.forEach((l, i) => { const e = S.ent('lamp' + i); e.flicker = l === L; e.light = Object.assign({}, e.def.light, { flick: l === L }); });
          S.sfx('heart');
        }
      },
      /* ---------------- 派出所 ---------------- */
      koban: {
        amb: 'rain', dark: .22, plr: 3.4, wall: 'plain', floor: 'concrete',
        rows: [
          '##########',
          '##########',
          '#........#',
          '#........#',
          '#........#',
          '#........#',
          '#........#',
          '##########'],
        ents: [
          { x: 2, y: 1, spr: 'painting', col: '#6a8a6a', on: S => S.narr('辖区地图。小学、商店街、你家那条街，都用红笔圈着。\n红圈旁边写着日期，一个比一个近。') },
          { x: 7, y: 1, spr: 'poster', col: '#e8e0c8', on: S => S.narr('通缉令。照片上的男人一脸凶相。\n……比起那个女人，他看起来反倒像个普通人。') },
          { x: 5, y: 1, spr: 'wallclock', on: S => S.narr('六点四十分。') },
          { x: 8, y: 1, spr: 'window', async on(S) {
            await S.narr('窗玻璃上全是雨水。外面的巷子，什么也看不清。');
            if (S.f.smell) return;
            await S.narr('玻璃上齐脸高的地方，有一块油乎乎的印子，像是有人常对着它抹头发。\n你凑近闻了闻——一股甜腻腻的味道。');
            await gotSmell(S);
          } },
          { x: 8, y: 3, spr: 'hatrack', async on(S) {
            await S.narr('衣帽架上挂着大野巡查的警帽和雨衣，帽檐还在往下滴水。');
            if (S.f.smell) return S.narr('帽子里面那一圈油亮亮的印子。……是发蜡。');
            await S.narr('帽子里面，一圈油亮亮的印子。\n你凑近闻了闻——一股甜腻腻的味道。');
            await gotSmell(S);
          } },
          { x: 1, y: 2, spr: 'shelf', on: S => S.narr('文件架。最上面一格的文件夹上写着：「可疑者情报　6月」。很厚。') },
          { x: 3, y: 3, spr: 'desk', async on(S) { if (S.once('logP')) await S.narr('桌上摊着一本受理记录。大野巡查正写到一半。'); await S.note('log'); } },
          { id: 'cdesk', x: 4, y: 3, spr: 'desk', on: S => copTalk(S) },
          { x: 5, y: 3, spr: 'desk', col: '#4a4a50', on: S => S.narr('黑色的电话。大野巡查刚才用它往你家打过。') },
          { x: 5, y: 3, spr: 'phone', oy: -6, z: 1 },
          { id: 'cop', x: 4, y: 2, spr: '@cop', dir: 0, on: S => copTalk(S) },
          { x: 6, y: 5, w: 2, spr: 'bench', on: S => S.narr('来访者坐的长椅。你刚才就坐在这里，椅子上留着一摊水印。') },
          { x: 4, y: 7, spr: 'invisible', solid: true, on: S => S.narr('玻璃门外，雨下得正大。\n……你不想一个人出去。') }
        ],
        async enter(S, first) {
          if (!first) return;
          S.amb('rain');
          await S.narr('你撞开了派出所的玻璃门。\n日光灯白得刺眼。');
          S.bubble('cop', '!', 1000);
          await S.say('？？？', '哇！……吓我一跳。小朋友，怎么了？浑身都湿透了。');
          await S.say('你', ['外、外面……有个戴口罩的女人……', '她问我漂不漂亮……然后追我……跑得好快……']);
          S.bubble('cop', '…', 1400);
          await S.say('大野巡查', ['……又来了。', '你是今天第四个了。下午有个小学生说在神社后面看见她，结果是隔壁药店的老板娘，花粉症。', '好啦好啦，先坐下。喝口麦茶。']);
          await S.narr('大野巡查给你倒了一杯麦茶，探头往门外看了一眼。\n雨幕里，巷子空空荡荡的。');
          await S.say('大野巡查', '……什么也没有嘛。你家电话多少？我打给你妈妈。');
          S.sfx('phone'); await S.wait(1100); S.sfx('phone'); await S.wait(1100);
          await S.say('大野巡查', ['……没人接啊。', '这样吧，等我把这份记录写完，送你回去。']);
          await S.narr('他摘下帽子挂到衣帽架上。头发梳得油光锃亮，在日光灯下反着光。');
          await S.say('大野巡查', ['我跟你说啊，听说昨天兵库那边，真有个女的扮成她的样子，揣着菜刀在街上晃，被抓起来了。', '所以啊，比起什么妖怪，更该小心的是人。']);
          S.goal('等大野巡查写完记录（和他说话就出发）');
        }
      },
      /* ---------------- 家门口 ---------------- */
      homest: {
        amb: 'rain', dark: .88, plr: 2.8, wall: 'wood', floor: 'asphalt', rain: true,
        rows: [
          '######################',
          '######################',
          '######################',
          '______________________',
          '::::::::::::::::::::::',
          '::::::::::::::::::::::',
          '______________________',
          'hhhhhhhffffffffhhhhhhh',
          'T"TT"T""TT"T"T"T""T"TT'],
        tileOpts: { fenceBase: 'sidewalk' },
        ents: [
          ...[3, 6, 9].map(x => ({ x, y: 2, spr: 'window', on: S => S.narr('邻居家的窗户。今晚家家户户都早早拉上了窗帘。') })),
          { x: 11, y: 2, spr: 'shutter', col: '#4a4a4a', on: S => S.narr('邻居家的车库。') },
          { x: 14, y: 2, spr: 'window', lit: true, light: { r: 2, col: 'rgba(255,200,120,.18)' }, on: S => S.narr('你家客厅的窗户亮着。里面传出电视的声音。') },
          { id: 'hdoor', x: 15, y: 2, spr: 'genkan', lit: true, light: { r: 2, col: 'rgba(255,210,140,.18)' }, async on(S) {
            if (!S.f.won) return S.narr('门就在眼前。\n可是那个女人，就站在门口的路灯下面。');
            S.sfx('open'); await S.go('house', 11, 5, 3);
          } },
          { x: 17, y: 2, spr: 'window', lit: true, light: { r: 2, col: 'rgba(255,200,120,.18)' }, on: S => S.narr('厨房的窗户。有炸东西的香味。') },
          { id: 'lamp_h', x: 13, y: 3, spr: 'streetlamp', light: { r: 3.6, col: 'rgba(255,225,150,.22)', dy: 12 }, on: S => S.narr('你家门口的路灯。灯泡上爬着一只湿漉漉的蛾子。') },
          { x: 6, y: 5, spr: 'puddle', decal: true }, { x: 17, y: 4, spr: 'puddle', decal: true },
          { id: 'cop_h', x: 0, y: 5, spr: '@cop', dir: 2, async on(S) {
            S.face('cop_h', 'pl');
            if (S.f.won) return S.say('大野巡查', '快进屋吧，别着凉了。');
            if (!S.f.smell) {
              await S.narr('大野巡查摘下帽子，甩了甩上面的雨水，又用手把头发往后抹了抹。\n一股甜腻腻的味道，顺着雨飘了过来。');
              await gotSmell(S);
            }
            await S.say('大野巡查', '怎么了？去吧，我就在这儿看着呢。');
          } },
          { id: 'onna_h', x: 15, y: 3, spr: '@onna', hidden: true, solid: false, dir: 3 },
          { id: 'sci_h', x: 15, y: 3, spr: 'bigsci', hidden: true, solid: false, z: 1 }
        ],
        async enter(S, first) {
          if (!first) return;
          S.f.phase = 'home';
          await Promise.all([S.walk('pl', [6, 4], 3), S.walk('cop_h', [5, 5], 3)]);
          S.face('cop_h', 'pl');
          await S.say('大野巡查', '是这条街吧？哪个是你家？');
          await S.say('你', '那个……门口亮着灯的。');
          S.ent('lamp_h').flicker = true; S.sfx('heart');
          await S.wait(600);
          S.ent('onna_h').alpha = 0; S.focus(15, 3);
          await S.alpha('onna_h', 1, 1200);
          await S.narr('路灯下面，站着一个穿长风衣的女人。\n她背对着你们，正对着你家的大门。');
          S.focus(null);
          await S.say('你', '巡、巡查先生……那里……');
          S.face('cop_h', 2);
          await S.say('大野巡查', ['嗯？哪儿？', '……什么也没有啊。是路灯在闪吧。明天我让电力公司来修。']);
          S.bubble('pl', '…', 1400);
          await S.think('他……看不见她？');
          S.face('cop_h', 'pl');
          await S.say('大野巡查', '去吧，我就在这儿看着你进门。快去，你妈妈该等急了。');
          S.goal('回家（她就站在家门口）');
          S.cp('final');
        },
        step(S, x) { if (S.f.phase === 'home' && !S.f.met && x >= 9) return finalMeet(S); }
      },
      /* ---------------- 家里 ---------------- */
      house: {
        amb: 'tv', dark: .4, plr: 3.4, wall: 'paper', floor: 'wood',
        rows: [
          '##############',
          '##############',
          '#tttttttt#www#',
          '#tttttttt#www#',
          '#tttttttt.www#',
          '#tttttttt#xxx#',
          '##############'],
        ents: [
          { x: 2, y: 1, spr: 'curtain', on: S => S.narr('窗帘拉得严严实实。') },
          { x: 5, y: 1, spr: 'poster', col: '#e8e4d8', on: S => S.narr('挂历翻在六月。二十二日那一格，妈妈用红笔写着：「由纪　集团下校开始」。') },
          { x: 7, y: 1, spr: 'wallclock', on: S => S.narr('七点十五分。') },
          { id: 'tv', x: 1, y: 2, spr: 'tv', power: true, light: { r: 2.4, col: 'rgba(140,180,255,.16)' }, async on(S) {
            if (S.f.tv) return S.narr('新闻已经换成了棒球转播。巨人队又输了。');
            S.f.tv = true;
            await S.say('电视', ['……近来，一则关于「裂口女」的传闻，以岐阜县为起点，在全国的小学生之间迅速扩散。', '各地陆续出现孩子们结伴放学、家长到校门口接送的情况，部分地区的警方也加强了巡逻……', '……专家指出，这只是孩子们之间口耳相传的谣言。请家长们不必过度担心……']);
            await S.narr('播音员的身后，是一张小学生画的画：\n一个戴着白口罩、穿着长风衣的女人，站在路灯底下。');
            await S.wait(500);
            S.sfx('phone');
            await S.narr('玄关那台黑色的电话，「叮铃——」响了一声。\n只响了一声，就不响了。');
            S.bubble('mom', '?', 1200);
            await S.say('妈妈', '……这么晚了，谁呀？由纪，帮妈妈接一下。');
            S.goal('接电话（玄关的黑色电话）');
          } },
          { x: 3, y: 3, w: 2, spr: 'lowtable', on: S => S.narr('矮桌上摆着你的碗筷，还有一盘炸肉饼。') },
          { x: 2, y: 3, spr: 'cushion', col: '#7a4a6a' },
          { id: 'mom', x: 6, y: 3, spr: '@mom', dir: 1, async on(S) {
            S.face('mom', 'pl');
            const l = ['换好衣服就来吃饭。今天做了你爱吃的炸肉饼。', '爸爸今天加班，要晚点回来。', '以后放学一定要跟大家一起走，听见没有？'];
            await S.say('妈妈', l[(S.f._mm = ((S.f._mm ?? -1) + 1) % 3)]);
          } },
          { x: 8, y: 2, spr: 'shelf', on: S => S.narr('佛龛旁边的柜子。上面摆着奶奶的照片，和一小碟供着的点心。') },
          { x: 10, y: 2, spr: 'sink' }, { x: 11, y: 2, spr: 'stove' }, { x: 12, y: 2, spr: 'fridge', on: S => S.narr('冰箱上用磁铁贴着学校发的那张通知。「集团下校」四个字被妈妈用红笔圈了起来。') },
          { id: 'hphone2', x: 12, y: 4, spr: 'phone', async on(S) {
            if (!S.f.tv || S.f.call2) return S.narr(S.f.call2 ? '黑色的拨盘电话。\n你不想再碰它了。' : '黑色的拨盘电话。\n你拿起听筒，里面是正常的拨号音。……它看起来什么毛病也没有。');
            S.f.call2 = true;
            S.sfx('tick');
            await S.narr('你拿起听筒。\n「……喂？」');
            S.amb('rain');
            await S.narr('听筒里没有人说话。\n只有雨声。很大很大的雨声——像是打电话的人，就站在外面的雨里。');
            await S.wait(600); S.sfx('whisper');
            await S.say('听筒里', S.f.rev ? '……糖，很甜哦。' : '……你还没有好好回答我。', { style: 'whisper' });
            S.sfx('close'); S.amb('tv');
            await S.narr('「咔嚓」。\n电话挂断了。');
            await S.narr('你下意识地摸了摸口袋。');
            if (S.has('yen2')) { S.take('yen2'); S.toast('失去：电话亭里多出来的十元硬币'); await S.narr('电话亭里多出来的那枚十元硬币，不见了。\n口袋里只剩下健太的那一枚，冰凉冰凉的。'); }
            else await S.narr('口袋里空空的。\n买糖的二十块里，有一枚是电话亭退币口里多出来的……\n那块糖，说到底，是用谁的钱买的呢？');
            S.goal('……睡觉前，再从玄关往外看一眼');
          } },
          { x: 10, y: 5, spr: 'shoes', col: '#3a3030', decal: true },
          { id: 'gdoor', x: 10, y: 6, w: 2, spr: 'genkanS', solid: true, light: { r: 1.8, col: 'rgba(255,225,150,.16)', dy: 4 }, async on(S) {
            if (!S.f.tv) return S.narr('玄关的门已经锁好了。磨砂玻璃外面，路灯的光一晃一晃的。\n妈妈在客厅里喊你：「由纪，快来看，电视上正说这事儿呢。」');
            if (!S.f.call2) return S.narr('玄关的电话刚才响了一声。\n……先去接一下吧。');
            return ending(S);
          } }
        ],
        async enter(S, first) {
          if (!first) return;
          await S.narr('「我回来了……」');
          await S.walk('mom', [10, 4], 4);
          S.face('mom', 'pl');
          await S.say('妈妈', ['由纪！怎么这么晚！浑身都湿透了……', '刚才派出所的大野先生在门口跟我说了。说你在路上被吓着了？']);
          await S.say('你', '妈妈……我在商店街给家里打过电话的，一直没人接……');
          S.bubble('mom', '?', 1200);
          await S.say('妈妈', ['电话？没响啊。妈妈一晚上都在家，电话一次也没响过。', '你是不是拨错号码了？']);
          await S.say('你', '六、四、一、七、二……');
          await S.say('妈妈', '……对呀，是这个号。');
          await S.narr('你和妈妈一起看向玄关那台黑色的电话。\n它安安静静地蹲在那里。');
          await S.say('妈妈', ['……肯定是电话局的线路出毛病了。下雨天常有的事。', '快去把湿衣服换了。电视上正说这事儿呢——什么裂口女，都是小孩子瞎传的谣言。']);
          await S.walk('mom', [6, 3], 4); S.face('mom', 1);
          S.goal('看看电视新闻');
        }
      }
    }
  });

  /* ---------- 大野巡查 ---------- */
  async function copTalk(S) {
    S.face('cop', 'pl');
    const r = await S.ask('「记录写完了。走吧，我送你回家。」', ['走吧。', '再等一下。'], '大野巡查');
    if (r) return S.say('大野巡查', '不急不急。把麦茶喝完。');
    await S.narr('大野巡查从衣帽架上取下帽子，对着窗玻璃正了正帽檐，把那一头油亮的头发压在了帽子底下。');
    await S.fade(1, 600);
    await S.card('', '', '大野巡查撑着伞，打着手电，走在你旁边。\n雨小了一些。\n他一路上都在讲他老家的事，讲得很大声。');
    await S.go('homest', 1, 4, 2);
  }

  /* ---------- 驮菓子屋阿婆 ---------- */
  async function obaaLore(S) {   // 传说的起源：买糖那次顺口讲；不买糖，第二次来也会讲
    if (!S.once('obaaLore')) return;
    await S.say('阿婆', ['……说起来，我小时候，我奶奶也讲过差不多的故事。', '说是从前江户城里，下雨的晚上，有个男人看见路边的姑娘没带伞，好心叫她一起打。姑娘一回头——嘴一直裂到耳朵根。', '那是狐狸变的。……人啊，几百年了，怕的东西都差不多。']);
    await S.say('阿婆', ['这回的事，听说最早是从本巢那边的乡下传出来的。', '有个老太太晚上去院子里的茅厕，看见角落里站着一个女人……后来就越传越远，越传越像真的了。', '报纸上还登过呢。喏，柱子上那张剪报，我孙子非要贴的。']);
  }
  async function obaaTalk(S) {
    S.face('obaa', 0);
    const first = S.once('obaa1');
    if (first) {
      await S.say('阿婆', ['哎哟，是由纪啊。今天怎么一个人？', '集团下校？哦……就是那个，裂口女。']);
      await S.narr('阿婆眯起眼睛笑了。');
      await S.say('阿婆', ['这半年啊，我这儿的鳖甲糖，卖得比过去十年加起来还多。孩子们都说，她爱吃这个。', '谁编出来的呢……不过糖倒是真好吃。']);
    }
    if (S.has('candy') || S.f.threw || S.f.gave) {
      await obaaLore(S);
      return S.say('阿婆', '糖揣好了？天黑了，快回家吧。路上别跟不认识的人说话。');
    }
    const n = (S.has('yen1') ? 1 : 0) + (S.has('yen2') ? 1 : 0);
    if (n < 2) {
      if (n === 1) await S.say('阿婆', ['鳖甲糖二十块一块。十块钱……还差十块哦。', '电话亭的退币口那儿，常有人忘拿零钱。去摸摸看？']);
      else await S.say('阿婆', '鳖甲糖二十块一块。……你身上没带钱吧？快回家吧，天要黑了。');
      if (!first) await obaaLore(S);
      return;
    }
    const r = await S.ask('「鳖甲糖，二十块一块。要吗？」', ['买一块。', '不用了。'], '阿婆');
    if (r) { await S.say('阿婆', '好好好。路上小心。'); if (!first) await obaaLore(S); return; }
    S.take('yen1'); S.take('yen2'); S.give('candy');
    await S.narr('阿婆从玻璃罐里夹出一块琥珀色的鳖甲糖，用油纸包好，塞进你手心。');
    await S.say('阿婆', '拿好了。……要是真碰上了，就扔得远远的。');
    await obaaLore(S);
    S.goal(S.f.called ? '回家（往右走，穿过那条小巷）' : '给家里打个电话（电话亭）');
  }

  /* ---------- 电话亭 ---------- */
  async function booth(S) {
    if (S.f.called) return S.narr('电话亭的玻璃上全是雾气。\n有人用手指在上面画过一个笑脸——嘴巴画得很长很长。');
    if (S.f.eaten) {   // 拨旧号码被「吞掉」的那枚硬币，再来摸，才从退币口里掉出来
      S.give(S.f.eaten, true); S.f.eaten = null; S.sfx('ding');
      await S.narr('你按了按退币杆。\n……「咔啦」。硬币掉了出来。冰凉冰凉的，湿漉漉的，像是在雨水里泡过很久。');
      return S.think('刚才那个号码……是搬家以前的旧号码。\n……那边接电话的，到底是谁？');
    }
    const coin = S.has('yen1') ? 'yen1' : S.has('yen2') ? 'yen2' : null;
    if (!coin) { await S.narr('黄色的公用电话。要投十元硬币。\n你摸了摸口袋——空空的。'); return S.think('……健太说他丢了十块钱。会不会掉在教室里了？'); }
    if (!S.f.num) return S.narr('家里的号码……上个月刚搬的家，你还没背熟。\n教室墙上的联络网上写着。');
    const r = await S.ask('给家里打个电话吗？', ['打', '算了']); if (r) return;
    S.sfx('ding');
    await S.narr('你把十元硬币塞进投币口，「当啷」一声。');
    const num = await S.keypad('拨号（五位数）', ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'], 5);
    if (num == null) { await S.narr('你挂上了听筒。硬币从退币口滚了出来。'); return; }
    if (num === '63958') {   // 搬家前的旧号码：陷阱，也是伏笔
      S.sfx('phone'); await S.wait(1200);
      S.amb('none');
      await S.narr('嘟——\n……「咔」。接通了。');
      await S.narr('听筒那头没有人说话。\n只有呼吸声。湿漉漉的，很慢，很近——近得像是贴着你的耳朵。');
      S.sfx('whisper');
      await S.say('听筒里', '……呐。', { style: 'whisper' });
      S.sfx('close'); S.amb('rain');
      await S.narr('你「啪」地挂上了听筒。\n……硬币没有退出来。');
      S.take(coin); S.f.eaten = coin;
      return S.think('拨错了……那是搬家以前的旧号码。\n联络网上，旧号码被划掉了的。');
    }
    if (num !== '64172') {
      S.sfx('tick');
      await S.say('听筒里', '您拨打的号码是空号。请查对后再拨。');
      return S.narr('硬币「咔啦」一声退了回来。\n（家里的号码，联络网上写着——可以在笔记里翻看。）');
    }
    for (let i = 0; i < 3; i++) { S.sfx('phone'); await S.wait(1200); }
    await S.narr('嘟——嘟——\n响了八声，十声。没有人接。');
    await S.think('妈妈出去买东西了吗……');
    S.sfx('ding');
    await S.narr('你挂上听筒。「咔啦」，硬币从退币口滚了回来——\n……滚出来的，是两枚。');
    S.give('yen1', true); S.give('yen2');
    S.f.called = true;
    await S.think('另一枚，大概是谁忘在里面的吧。');
    if (!S.has('candy')) { await S.think('二十块……正好够在阿婆那儿买一块鳖甲糖。'); S.goal('回家（往右，穿过小巷）——或者先买块鳖甲糖'); }
    else S.goal('回家（往右走，穿过那条小巷）');
  }
})();
