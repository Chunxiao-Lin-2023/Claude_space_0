/* ================= 第二夜 · テケテケ ================= */
(() => {
  /* 每张追逐图上各放一个「她」（跨图实体读档找不回，见 §7） */
  const TK = { hall2: 'tk2', hall1: 'tk1', yard: 'tky' };
  /* 能关上挡她一下的门 */
  const DOORS = { hall2: ['fd1', 'fd2'], hall1: ['fd3', 'sd1', 'sd2'] };
  const BASE = 3.2, BURST = 8.5;          // 平时 3.2 格/秒；「テケテケ」猛冲时 8.5 格/秒（走 4.2，跑 6.8）
  const DOOR_T = 3.2;                      // 她扒开一扇关着的门要几秒
  const NAVY = '#2c3654', NAVYD = '#1c2238', WHITE = '#dfe3ec', SKIN = '#e2ded8', HAIR = '#0c0a0e';

  /* ---------- 小工具 ---------- */
  function hideTk() { for (const k in TK) { const e = getEnt(TK[k], k); if (e) { e.chase = null; e.mv = null; e.hidden = true; } } }
  function tkEnt(S) { const id = TK[S.map]; return id ? getEnt(id, S.map) : null; }
  /* 追逐中进入一张新地图：存档，然后她从你来的方向追过来 */
  function arrive(S, x, y, delay) { S.f.tk = [x, y, delay]; S.cp('chase'); spawn(S); }
  function spawn(S) {
    hideTk();
    const t = S.f.tk || [0, 3, 2];
    S.f.tkX = t[0]; S.f.tkY = t[1]; S.f.tkT = t[2]; S.f.tkS = 0; S.f.tkEx = 3;
    S.f._bt = 2.6; S.f._burst = false;
    for (const d of DOORS[S.map] || []) { S.f['fdT_' + d] = DOOR_T; const e = S.ent(d); if (e) e.ox = 0; }
  }
  function startTk(S, e) {
    S.place(e.id, S.f.tkX, S.f.tkY, 0); e.alpha = .25;
    S.sfx('sting'); S.bubble(e.id, '!', 900);
    S.chase(e.id, { spd: BASE, catch: caught }); e.chase.wait = .35;
    S.f._bt = 2.4; S.f._burst = false;
  }
  function knockBack(S, e) {
    const m = curMap(), p = W.pl, d = DIRS[e.dir];
    for (let k = 4; k >= 1; k--) { const x = p.x - d[0] * k, y = p.y - d[1] * k; if (passable(m, x, y, e)) { S.place(e.id, x, y, e.dir); break; } }
    S.chase(e.id, { spd: BASE, catch: caught }); e.chase.wait = 2.6;
    S.f._burst = false; S.f._bt = 3.4;
  }
  async function caught(S, e) {
    S.f._burst = false;
    if (!S.f.asked) {
      S.f.asked = true;
      S.sfx('sting'); S.shake(400, 3);
      await S.narr('冰凉的手指，一把攥住了你的脚踝。');
      S.face(e.id, 'pl');
      await S.say('她', '……呐。', { style: 'whisper' });
      const r = await S.ask('「我的脚……在哪里？」', ['名、名神高速公路上！', '我、我不知道！', '在……在铁轨上！'], '她');
      if (r === 0) {
        await S.narr('攥着你脚踝的手，停住了。');
        await S.say('她', '名神……？', { style: 'whisper' });
        await S.say('她', '……那是，哪里……', { style: 'whisper' });
        knockBack(S, e);
        await S.narr('她松开手，歪着头，长头发在地上拖出一道湿痕。\n——趁现在！');
        S.toast('这个答案只能让她愣一下。下一次就不灵了');
        return;
      }
      await S.say('她', r === 1 ? '……不知道？' : '……铁轨上。我找过了。找了好久，好久。', { style: 'whisper' });
    }
    await S.scare('face', { spr: '@tekeF', dur: 1 });
    S.sfx('thud');
    await S.die('冰冷的手指扣住了你的脚踝。\n黑暗里，有人贴着你的耳朵，一遍一遍地问：\n「我的脚——在哪里？」', 'テケ、テケ、テケ');
  }
  /* 楼梯：追逐中她会跟下来/跟上来，但楼梯上她很慢 */
  async function stairs(S, map, x, y, dir, sx, sy, up) {
    if (S.f.phase === 'chase') { S.f.tkNext = [sx, sy, up ? 4.4 : 2.8]; hideTk(); }
    await S.go(map, x, y, dir);
  }
  /* 防火门 / 职员室拉门 */
  async function door(S, id, kind) {
    const e = S.ent(id), p = W.pl, ex = Math.round(e.px / TS), ey = Math.round(e.py / TS);
    const nm = kind === 'sd' ? '拉门' : '防火门';
    if (e.open) {
      if (e.cracked) return S.narr(kind === 'sd' ? '拉门被扯脱了轨，歪在门框里。\n再也关不上了。' : '防火门的合页被扯歪了，门板斜斜地挂着。\n再也关不上了。');
      if (p.x === ex && p.y === ey) return S.narr(`你正站在门口。\n得先走过去，再回身把${nm}关上。`);
      const t = tkEnt(S);
      if (t && !t.hidden && Math.round(t.px / TS) === ex && Math.round(t.py / TS) === ey) return S.narr('她已经爬到门口了——来不及了！');
      e.open = false; e.solid = true; S.f['fdT_' + id] = DOOR_T; S.sfx('close'); S.shake(150, 1);
      if (S.f.phase === 'chase') return;
      return S.narr(kind === 'sd' ? '你把职员室的拉门「咔啦」一声拉上了。' : '你推了一下。沉甸甸的铁门「哐」地合上了。\n回声在走廊里滚了好远。');
    }
    if (S.f.phase === 'chase') {
      const t = tkEnt(S);
      if (t && !t.hidden && Math.abs(Math.round(t.px / TS) - ex) + Math.abs(Math.round(t.py / TS) - ey) <= 2) { S.sfx('locked'); return S.narr('门那边，有手掌一下一下拍打的声音。\n……不能开！'); }
    }
    e.open = true; e.solid = false; S.sfx('open');
  }

  /* ---------- 坏结局 ---------- */
  async function bad(S, line) {
    S.amb('none');
    if (line) await S.say('她', line, { style: 'whisper' });
    S.sfx('sting'); S.shake(600, 3);
    await S.narr('她猛地抬起头。\n长头发后面，那双眼睛直直地盯着你的腰。');
    await S.say('她', 'テケ、テケ、テケ、テケ——', { style: 'big' });
    await S.scare('face', { spr: '@tekeF', dur: 1.1 });
    await S.fade(1, 900);
    S.sfx('thud'); await S.wait(900);
    S.f.ringing = false;
    await S.end({ bad: true, title: '第三天', text: '第二天早上，铲雪车在道口旁边停了下来。\n\n积雪上有两道长长的、浅浅的痕迹，从道口一直延伸到白桦二中的校门口。\n像是有人用两只手肘，一下，一下地爬过去。\n\n星期一，校报《白桦》第三学期号如期发行。\n「本校七大不可思议之一：テケテケ」那一页，署名是水野葵。\n\n读过那一页的人，都说，三天之内——' });
  }

  /* ---------- 道口：结局 ---------- */
  function ringOn(S) {
    S.f.ringing = true;
    for (const id of ['sig1', 'sig2']) { const s = S.ent(id); s.s.ring = true; s.light = { r: 3, col: 'rgba(255,40,30,.32)', flick: true, dy: -12 }; }
  }
  function finalSetup(S) {
    ringOn(S);
    for (const id of ['sig1', 'sig2']) S.ent(id).s.down = true;
    hideTk();
    S.place('tkf', 29, 6, 1); S.ent('tkf').spr = '@teke'; S.ent('tkf').alpha = 1;
    S.place('gen_y', 23, 5, 2);
    S.plr(null); S.amb('wind');
  }
  async function finale(S) {
    if (S.f.fin) return;
    S.f.fin = true;
    await S.walk('pl', [28, 6], 3); S.face('pl', 2);
    S.focus(29, 6);
    await S.narr('当、当、当、当——\n红灯一左一右地闪。栏杆已经放下来了。\n可是铁轨的两头，都看不见火车的灯。');
    await S.narr('道岔那里，两根铁轨合拢的地方，趴着一个人。\n深蓝色的旧式水手服。长长的黑头发，铺在雪上。');
    S.sfx('heart'); await S.wait(500);
    await S.say('她', '……好冷。', { style: 'whisper' });
    S.face('tkf', 'pl');
    await S.narr('她慢慢地，把脸转了过来。\n头发湿漉漉地贴在脸上，看不清她的样子。');
    const q1 = ['名神高速公路上。', '仮面の死魔。', '在铁轨上。', '（把红色的雪靴递给她）「在这儿。」'];
    const r1 = await S.ask('「我的脚……在哪里？」', S.has('boot') ? q1 : q1.slice(0, 3), '她');
    if (r1 === 0) return bad(S, '名神……那是哪里……我，从来没有去过那么远的地方……');
    if (r1 === 1) return bad(S, '……你在说什么？');
    if (r1 === 2) return bad(S, '铁轨上……我找过了。找了三十一年。没有。哪里都没有。');
    S.take('boot'); S.show('bootf'); S.sfx('item');
    await S.narr('你蹲下来，把那只红色的小雪靴，轻轻放在她面前的铁轨上。');
    await S.narr('她盯着它看了很久。\n然后伸出冻得发青的手，碰了碰靴口那一圈白色的绒毛。');
    await S.say('她', ['……妈妈买的。', '才穿了一个冬天。', '它卡在道岔里……我怎么拔，也拔不出来……'], { style: 'whisper' });
    await S.say('她', '火车的灯……好亮……', { style: 'whisper' });
    await S.narr('她把雪靴抱在怀里，抬起头来看你。');
    const r2 = await S.ask('「……你，知道我叫什么吗？」', ['テケテケ。', 'カシマさん。', '雪村千代。', '……不知道。'], '她');
    if (r2 === 0) return bad(S, 'テケテケ……テケテケ……大家，都这么叫我。');
    if (r2 === 1) return bad(S, '……那不是我。');
    if (r2 === 3) return bad(S, '……谁都，不知道。');
    await S.say('你', '雪村千代。二年三组。……美术部的。');
    S.sfx('chime');
    S.ent('tkf').spr = '@tekeFace';
    await S.narr('她的肩膀轻轻地抖了一下。\n长头发后面，露出一张十四岁女孩的脸。冻得发白，眼睛却红红的，像刚刚哭过。');
    await S.say('千代', ['……千代。', '好久……好久没有人，这么叫我了。'], { style: 'whisper' });
    await S.walk('gen_y', [27, 7], 2.4);
    S.face('gen_y', 'tkf');
    await S.say('源造', ['千代……千代同学。', '对不起。那天……是我没看见你。雪太大了。', '我要是……我要是早一点把栏杆放下来……']);
    S.face('tkf', 'gen_y');
    await S.say('千代', ['……看守的老爷爷。', '你，一直在这里吗？'], { style: 'whisper' });
    await S.say('源造', '三十一年。每天晚上，末班车开过去之前。');
    await S.say('千代', '……傻瓜。', { style: 'whisper' });
    await S.narr('她笑了一下。很小，很小的一下。');
    S.focus(null);
    await S.wait(500);
    S.amb('bus'); S.sfx('car');
    await S.narr('远处传来了汽笛声。\n铁轨的尽头，亮起了一盏灯。越来越亮，越来越亮。');
    S.fx('flash', { dur: 1.4 }); S.shake(1600, 3); S.sfx('brake');
    await S.wait(1400);
    S.hide('tkf'); S.hide('bootf');
    await S.narr('列车呼啸着从你们面前开过去。一节，又一节。\n卷起来的雪打在脸上，生疼。');
    S.amb('wind'); S.f.ringing = false;
    for (const id of ['sig1', 'sig2']) { const s = S.ent(id); s.s.ring = false; s.s.down = false; s.light = null; }
    for (let i = 0; i < 6; i++) S.show('fp' + i);
    await S.wait(600);
    await S.narr('栏杆抬起来了。警报停了。\n铁轨上，什么也没有。');
    await S.narr('只有道岔边的雪地上，留着一串小小的脚印。\n——两只脚的。\n一直走向铁路的那一头。');
    S.face('gen_y', 3);
    await S.say('源造', '……回家了啊。');
    await S.fade(1, 1400);
    await S.card('一月二十五日（星期一）', '校报《白桦》第三学期号', '「本校七大不可思议之一：テケテケ」那一页，\n最后没有登出来。\n\n那一页上，登的是一篇短短的文章，\n题目叫《雪村千代同学》。\n\n文章的最后一行写着：\n「她有名字。」');
    await S.end({ title: '第二夜　完', text: '从那以后，道口旁边的看守小屋，再也没有亮过灯。\n\n白桦二中的孩子们，还是会讲テケテケ的故事。\n只是讲到最后，总会有人小声地补上一句：\n\n「……她叫千代。」' });
  }

  /* ---------- 校舍：调查与剧情 ---------- */
  async function fdLook(S, id) {
    if (S.once('fdl')) return S.narr('防火门。平时用磁铁吸在墙上，一直敞开着。\n真要关的话，用力一推就能合上。');
    return door(S, id, 'fd');
  }
  async function takagi(S) {
    if (S.f.phase === 'chase0' || S.f.phase === 'chase') return;
    S.face('takagi', 'pl');
    if (!S.f.talked) {
      S.f.talked = true; S.f.toStaff = true;
      await S.narr('职员室里只剩高木老师一个人，戴着老花镜在改作业。\n暖炉上的水壶咕嘟咕嘟地响。');
      await S.say('高木老师', '哦，水野啊。这么晚了，还没回去？');
      await S.say('你', '老师，我想借资料室的钥匙。新闻部要查以前的校报。');
      await S.say('高木老师', '资料室？查什么？');
      await S.say('你', '……学校旁边那个道口的事故。大家都说，三十年前——');
      S.bubble('takagi', '…', 1600);
      await S.wait(600);
      await S.say('高木老师', ['……テケテケ，是吧。', '现在的孩子，管她叫这个名字啊。']);
      await S.say('高木老师', ['不是「三十年前」。是三十一年前。一九六二年，一月。第三学期刚开学没几天。', '前一年春天，我刚到这所学校，当老师的第一年。她是二年级的学生……我没教过她，只在走廊里碰见过几次。', '我只记得那年冬天特别冷。冷得道口的道岔都冻住了。']);
      await S.narr('老师摘下老花镜，用衣角擦了很久。');
      await S.say('高木老师', ['钥匙拿去吧。看完了锁好门。', '还有，六点以后玄关就锁了。走的时候去钥匙箱拿备用钥匙，出去以后从门缝塞回来就行。']);
      S.give('akey'); S.ent('keybox').s.noA = true; S.f.toldKey = true;
      await S.say('高木老师', ['……水野。', '那个孩子，是有名字的。你写的时候，别只写那个外号。']);
      S.goal('去二楼资料室，找一九六二年一月的校报');
      S.cp('key');
      return;
    }
    const l = ['一九六二年。……那年我二十三岁。', '资料柜是按昭和年份排的。……你们这一代，算得过来吧？', '雪下大了。看完了早点回去，别走铁轨。'];
    await S.say('高木老师', l[(S.f._tg = ((S.f._tg ?? -1) + 1) % 3)]);
  }
  async function keybox(S) {
    const k = S.ent('keybox');
    if (S.has('gkey')) return S.narr('钥匙箱。「玄关（备用）」那一格空了。');
    if (!S.f.toldKey) return S.narr('钥匙箱。一排排小钩子上挂着各个教室的钥匙。\n「资料室」那一格是空的——钥匙在高木老师手里。');
    S.give('gkey'); k.s.noG = true;
    await S.narr(S.f.phase === 'chase' ? '你的手抖得厉害，好几次都没够着钩子——\n抓住了！「玄关（备用）」。' : '你从钩子上取下了「玄关（备用）」的钥匙。\n高木老师说，六点以后玄关就锁了。');
    if (S.f.phase === 'chase') S.goal('从玄关逃出去！');
  }
  async function genkan(S) {
    if (S.f.phase !== 'chase') { S.pos(13, 9, 3); return S.think(S.has('akey') ? '还没查完资料呢。稿子星期一就要交了。' : '稿子还没写完。先去职员室借钥匙吧。'); }
    if (!S.has('gkey')) {
      S.pos(13, 9, 3); S.sfx('locked');
      await S.narr('玻璃门锁着！\n门上挂着牌子：「18:00以后玄关上锁」。');
      await S.think('钥匙……职员室的钥匙箱！');
      S.goal('玄关锁了——去职员室的钥匙箱拿备用钥匙！');
      return;
    }
    S.sfx('open'); hideTk(); S.take('gkey');
    await S.narr('钥匙插进锁孔，拧了两次才拧动。\n你撞开玻璃门，冲进了雪里。');
    await S.go('yard', 4, 3, 0);
  }
  function drawerTxt(n) {
    if (isNaN(n) || n < 22 || n > 64) return '没有这一格。\n最上面的抽屉是「昭和22年」——建校那一年；最下面一格是「昭和64年」。';
    if (n === 64) return '「昭和64年」的抽屉里只有薄薄的一份。\n那一年，只有七天。';
    if (n >= 58) return `「昭和${n}年」……都是不久以前的校报，新闻部的纸箱里也有。\n不是这一年。`;
    if (n === 36) return '「昭和36年」：秋天的町文化祭特辑。\n获奖名单里有一幅画，叫《雪中的道口》。作者的名字，被一颗订书钉挡住了。\n……不是这一年，但是很近了。';
    if (n === 38) return '「昭和38年」：第一页是一尊新立的小地藏的照片，就在道口旁边。\n照片底下写着：「愿她安息」。\n……晚了一年。';
    if (n === 39) return '「昭和39年」：东京奥运会特辑。全校挤在体育馆里看了黑白电视转播。\n不是这一年。';
    return `「昭和${n}年」的抽屉里塞满了泛黄的校报：运动会、修学旅行、毕业典礼……\n不是这一年。`;
  }
  async function cabinet(S) {
    const c = S.ent('cab');
    if (S.f.found) return S.narr('「昭和37年」的抽屉开着。里面的校报，你已经看过了。');
    if (S.once('cabA')) await S.narr('铁皮档案柜。一格一格的抽屉，标签上写着年份。\n柜门上贴着一张发黄的纸条：\n「整理规则：校报按昭和纪年归档。※昭和元年＝1926年」');
    const v = await S.keypad('拉开哪一年的抽屉？（昭和　年）', ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'], 2);
    if (v == null) return S.narr('你把手从抽屉把手上拿开了。');
    const n = parseInt(v, 10);
    S.sfx('open');
    if (n !== 37) {
      S.f._wrong = (S.f._wrong || 0) + 1;
      await S.narr(drawerTxt(n));
      if (S.f._wrong >= 2) await S.think('……高木老师说，是一九六二年一月。\n纸条上写着：昭和元年＝一九二六年。那么一九六二年就是……');
      return;
    }
    c.open = true; S.f.found = true;
    await S.narr('「昭和37年」。\n抽屉拉开的时候，一股陈年的纸味扑了出来。\n二月一日那一期的校报上，有一块用黑框框起来的地方。');
    await S.note('paper57');
    S.f.name = true;
    await S.narr('你把那页校报看了很久。\n「雪村千代」。\n……原来，她有名字。');
    await blackout(S);
  }
  async function blackout(S) {
    S.f.phase = 'chase0';
    S.hide('takagi');
    await S.wait(400);
    S.sfx('switch'); S.amb('none');
    for (const mp of ['archive', 'hall2', 'hall1', 'club']) S.dark(.93, mp);
    S.ent('bulb').off = true; S.plr(2.8);
    await S.narr('灯泡「啪」地一声灭了。');
    S.sfx('heart'); await S.wait(600);
    S.sfx('tick'); await S.wait(380); S.sfx('tick'); await S.wait(380); S.sfx('tick');
    await S.narr('门外的走廊上，传来一种声音。\n像是有人用手掌，一下，一下地拍打地板。');
    await S.narr('テケ、テケ、テケ、テケ——\n从左边的楼梯口，越来越近。\n……在门口，停住了。');
    S.sfx('knock'); await S.wait(500); S.sfx('knock');
    await S.wait(900);
    await S.narr('……又慢慢地，远了。');
    await S.think('今天……是第三天。');
    S.goal('离开资料室，逃出学校！');
    S.cp('found');
  }
  async function reveal(S) {
    S.f.phase = 'chase'; S.amb('none');
    const e = S.ent('tk2'); S.place('tk2', 1, 3, 2); e.alpha = 0;
    S.sfx('heart');
    await S.narr('走廊里一片漆黑。只有两头「非常口」的绿灯还亮着。');
    S.focus(4, 3);
    await S.alpha('tk2', 1, 900);
    await S.narr('左边楼梯口的绿光底下，地板上趴着一个人影。');
    await S.narr('深蓝色的旧式水手服。长长的黑头发，一直拖到地上。\n她用两只手肘，撑起了上半身——\n……腰下面，什么也没有。');
    S.sfx('tick'); await S.wait(300); S.sfx('tick');
    await S.say('她', 'テケ。', { style: 'whisper' });
    S.focus(null);
    await S.say('她', 'テケ、テケ、テケ、テケ——', { style: 'big' });
    S.amb('drone');
    S.goal('逃！往右边的楼梯跑，下楼，从玄关出去！');
    S.toast('按住 Shift 奔跑——她猛冲起来比你走路快');
    S.toast('防火门可以关上挡她一下；她上下楼梯很慢');
    arrive(S, 1, 3, .05);
  }
  /* ---------- 看守小屋 ---------- */
  async function hutDoor(S) {
    if (S.f.phase === 'chase') {
      hideTk(); S.f.phase = 'hut';
      S.sfx('knock'); await S.wait(200); S.sfx('knock');
      await S.narr('你扑到小屋门上，拼命地拍——\n门开了。一只粗糙的大手，一把把你拽了进去。');
      S.sfx('close');
      await S.go('hut', 4, 5, 3);
      return;
    }
    if (S.f.phase === 'final' && !S.f.fin) { S.sfx('open'); return S.go('hut', 4, 5, 3); }
    await S.narr('看守小屋。窗户里透出暖炉的光。');
  }
  async function hutScene(S) {
    await S.narr('小屋里很暖和。石油暖炉烧得通红。\n一个穿旧铁路制服的老人，用后背死死地顶着门。');
    S.sfx('thud'); S.shake(300, 2);
    await S.wait(500);
    S.sfx('tick'); await S.wait(400); S.sfx('tick'); await S.wait(400); S.sfx('tick');
    await S.narr('门外，テケ、テケ的声音绕着小屋转了一圈……\n慢慢地，往道口那边去了。');
    S.face('gen', 'pl');
    await S.say('老人', ['……走了。', '她不进这间屋子。三十一年了，一次也没进来过。']);
    await S.say('老人', '你是二中的学生吧。……你也听过那个故事了？');
    await S.say('你', '……三天前。');
    await S.say('老人', ['我叫源造。以前是这个道口的看守——那时候，道口还是人工放栏杆的。', '十几年前改成了自动的，这间小屋就没用了。可我每天晚上，还是会来这儿坐一坐。坐到末班车开过去。']);
    await S.say('源造', '你听见外面的警报了吧。没有火车，它也会响。每天晚上，这个时候。');
    await S.ask('「……您认识她？」', ['那天，到底发生了什么？', '她……到底是谁？'], '你');
    await S.say('源造', ['一九六二年一月十九日。傍晚五点五十分左右。雪下得比今天还大。', '那天三号道岔冻住了，我出去敲冰。……回到屋里的时候，货车的汽笛已经响了。我去拉栏杆——']);
    await S.say('源造', ['有个女学生，抄近路，沿着铁轨走回家。穿着一双红色的雪靴。', '她的一只脚，卡进了道岔的缝里。冻住的道岔，把靴子夹得死死的。', '我看见她的时候……已经来不及了。']);
    await S.narr('老人看着暖炉，很久没有说话。');
    await S.say('源造', ['……那天太冷了。她没有马上走。', '她一直在说：「脚……我的脚……拔不出来……」', '后来，孩子们传来传去，就变成了「我的脚在哪里」。']);
    S.sfx('open');
    await S.narr('老人起身，打开墙角的木箱，从一块叠得整整齐齐的白布里，捧出一样东西。');
    S.give('boot');
    await S.say('源造', ['那只雪靴，后来是我从道岔里取出来的。', '我一直没能把它还给她家里人。她家第二年春天就搬走了，不知道搬去了哪里。']);
    await S.say('源造', ['她要是问你「脚在哪里」，你就把这个给她。', '电视上、书上那些答案——什么名神高速公路——能让她愣一下。可那不是她要找的。']);
    await S.say('源造', ['还有……别叫她那个外号。テケテケ……那是孩子们给她起的。', '我连她叫什么都不知道。报纸上只写了「十四岁的女中学生」。三十一年了。']);
    if (S.f.name) {
      await S.say('你', '……雪村千代。二年三组，美术部的。\n学校的旧校报上，有她的名字。');
      S.bubble('gen', '…', 2000);
      await S.narr('老人的嘴唇动了动，没有发出声音。\n他把那个名字，在嘴里念了好几遍。');
      await S.say('源造', '……千代。千代啊。');
    }
    S.f.toldAll = true;
    S.goal('末班车之前，去道口找她');
    S.cp('hut');
  }
  async function genTalk(S) {
    S.face('gen', 'pl');
    const l = ['她要是问你「脚在哪里」，就把雪靴给她。', '别叫她那个外号。……叫她的名字。', '末班车七点四十五分。她每天晚上，都在道口等着。'];
    await S.say('源造', l[(S.f._gn = ((S.f._gn ?? -1) + 1) % 3)]);
  }

  /* 她：只有上半身。先画一个完整的人，再把胸口以上整体挪到地面，补上撑地的小臂 */
  function crawl(face) {
    return function (g, d, fr, G, R) {
      if (d === 0) { R(4, G.tT + 2, 8, 1, WHITE); R(4, G.tT, 1, 3, WHITE); R(11, G.tT, 1, 3, WHITE); R(7, G.tT + 1, 2, 3, WHITE); }
      else if (d === 3) { R(4, G.tT, 8, 3, NAVYD); R(4, G.tT + 2, 8, 1, WHITE); R(4, G.tT, 1, 2, WHITE); R(11, G.tT, 1, 2, WHITE); }
      else { R(8, G.tT, 4, 3, NAVYD); R(8, G.tT + 2, 4, 1, WHITE); R(5, G.tT + 1, 2, 3, WHITE); }
      g.save(); g.setTransform(1, 0, 0, 1, 0, 0);
      const im = g.getImageData(0, 0, 16, 14);
      g.clearRect(0, 0, 16, 24); g.putImageData(im, 0, 8);
      g.restore();
      const a1 = fr === 1 ? -1 : 0, a2 = fr === 3 ? -1 : 0;
      if (d === 0) { R(1, 18 + a1, 3, 3, NAVY); R(1, 20 + a1, 3, 1, WHITE); R(1, 21 + a1, 3, 2, SKIN); R(12, 18 + a2, 3, 3, NAVY); R(12, 20 + a2, 3, 1, WHITE); R(12, 21 + a2, 3, 2, SKIN); if (!face) { R(4, 16, 1, 5, HAIR); R(11, 16, 1, 4, HAIR); } }
      else if (d === 3) { R(1, 15 + a1, 3, 5, NAVY); R(1, 14 + a1, 3, 1, WHITE); R(1, 13 + a1, 3, 1, SKIN); R(12, 15 + a2, 3, 5, NAVY); R(12, 14 + a2, 3, 1, WHITE); R(12, 13 + a2, 3, 1, SKIN); R(5, 20, 6, 2, HAIR); }
      else { const a = fr === 1 ? -1 : fr === 3 ? 1 : 0; R(2 + a, 19, 6, 2, NAVY); R(6 + a, 19, 1, 2, WHITE); R(0 + a, 19, 2, 2, SKIN); R(0 + a, 21, 1, 1, SKIN); R(11, 17, 4, 2, HAIR); R(13, 19, 3, 2, HAIR); R(12, 18, 1, 1, '#3a3442'); }
      R(4, 21, 8, 1, '#07080e');
    };
  }
  const TEKE = { skin: SKIN, hair: HAIR, hs: 'long', top: NAVY, top2: '#e8e8e8', bottom: NAVY, shoes: '#111' };

  defChapter({
    id: 'teketeke', n: 2, title: 'テケテケ', sub: '冬夜的校舍里，有人用两只手肘撑着地，テケ、テケ、テケ地爬过来。', origin: '日本校园怪谈', color: '#26364c',
    icon: '@teke', iconX: 14, amb: 'school', floor: 'linoleum', wall: 'school', dark: .6, plr: 3.2, darkC: '#04070e',
    thumb(g, w, h) {   // 雪夜里的铁路道口
      g.fillStyle = 'rgba(210,222,236,.14)'; g.fillRect(0, h - 34, w, 12);
      g.fillStyle = '#3a3a3e'; for (let x = 2; x < w; x += 7) g.fillRect(x, h - 33, 3, 10);
      g.fillStyle = '#8d9196'; g.fillRect(0, h - 31, w, 2); g.fillRect(0, h - 25, w, 2);
      g.fillStyle = '#d8d8d0'; g.fillRect(24, 14, 3, h - 36);
      g.fillStyle = '#e8c020'; for (let i = 0; i < 12; i++) { g.fillRect(18 + i, 8 + i, 2, 2); g.fillRect(31 - i, 8 + i, 2, 2); }
      g.fillStyle = '#141414'; g.fillRect(15, 26, 21, 8);
      const gl = g.createRadialGradient(19, 30, 0, 19, 30, 14); gl.addColorStop(0, 'rgba(255,50,30,.7)'); gl.addColorStop(1, 'rgba(255,50,30,0)'); g.fillStyle = gl; g.fillRect(4, 16, 30, 30);
      g.fillStyle = '#ff3a22'; g.fillRect(17, 28, 4, 4); g.fillStyle = '#4a1010'; g.fillRect(30, 28, 4, 4);
      for (let i = 0; i < 40; i++) { g.fillStyle = `rgba(240,244,250,${.3 + hash(i, 5, 2) * .5})`; g.fillRect((hash(i, 6, 2) * w) | 0, (hash(i, 7, 2) * (h - 22)) | 0, 1, 1); }
    },
    people: {
      me: { key: 'aoi', skin: '#f1cba8', hair: '#1a1416', hs: 'bob', top: '#26304a', top2: '#e8e8f0', bottom: '#26304a', skirt: true, shoes: '#2a2420',
        extra(g, d, fr, G, R) { const c = '#a8303a'; if (d === 0) { R(4, G.tT, 8, 2, c); R(9, G.tT + 2, 2, 3, c); } else if (d === 1) { R(5, G.tT, 6, 2, c); R(8, G.tT + 2, 2, 3, c); } else R(4, G.tT, 8, 2, c); } },
      kiryu: { key: 'kiryu', skin: '#eac6a2', hair: '#141214', hs: 'short', top: '#16161c', top2: '#2a2a32', bottom: '#16161c', shoes: '#2a2420',
        extra(g, d, fr, G, R) { if (d === 0) { R(5, G.hT + 4, 2, 1, '#9aa8b8'); R(9, G.hT + 4, 2, 1, '#9aa8b8'); R(7, G.hT + 4, 2, 1, '#333'); R(7, G.tT + 1, 1, 1, '#c9a35a'); R(7, G.tT + 4, 1, 1, '#c9a35a'); } else if (d === 1) R(5, G.hT + 4, 2, 1, '#9aa8b8'); } },
      takagi: { key: 'takagi', skin: '#e2bc9a', hair: '#b8b4ae', hs: 'short', top: '#6a5040', top2: '#e8e4dc', bottom: '#3a3a40', shoes: '#2a2020',
        extra(g, d, fr, G, R) { if (d === 0) { R(5, G.hT + 4, 2, 1, '#c9a35a'); R(9, G.hT + 4, 2, 1, '#c9a35a'); R(7, G.hT + 4, 2, 1, '#c9a35a'); } else if (d === 1) R(5, G.hT + 4, 2, 1, '#c9a35a'); } },
      gen: { key: 'gen', skin: '#d6ad86', hair: '#a8a49e', hs: 'short', top: '#2a3044', top2: '#3a4258', bottom: '#2a2a30', coat: true, shoes: '#1a1616', hat: 'cap', hatC: '#232a3c',
        extra(g, d, fr, G, R) { if (d === 0) { R(7, G.hT - 1, 2, 1, '#c9a35a'); R(5, G.hT + 6, 6, 1, '#b8b4ae'); } } },
      teke: Object.assign({ key: 'teke', cover: true, extra: crawl(false) }, TEKE),
      tekeFace: Object.assign({ key: 'teke-face', eye: '#1a1214', extra: crawl(true) }, TEKE),
      tekeF: Object.assign({ key: 'teke-f', cover: true, ghost: true,
        extra(g, d, fr, G, R) { if (d === 0) { R(4, G.tT + 2, 8, 1, WHITE); R(7, G.tT + 1, 2, 3, WHITE); } } }, TEKE)
    },
    items: {
      akey: { name: '资料室钥匙', desc: '高木老师给的。钥匙牌是一块磨得发亮的小木片，上面用毛笔写着「资料室」。' },
      gkey: { name: '玄关备用钥匙', desc: '职员室钥匙箱里的。冰凉，沉甸甸的。' },
      boot: { name: '红色雪靴', desc: '一只小小的红色胶皮雪靴，靴口有一圈白色的绒毛。\n三十一年了，红色还没有褪。' }
    },
    notes: {
      memo: { title: '采访笔记（水野葵）', text: '1月20日（三）　采访：二年三组·佐藤\n・テケテケ。冬天，在学校旁边那个道口被火车……只剩上半身。\n・用两只手肘撑着地爬。「テケ、テケ、テケ」。比自行车还快！\n・追上了，就把你也……（佐藤做了个「切」的手势）\n・听过这个故事的人，三天之内，一定会遇到她。←！？\n\n1月21日（四）　采访：一年级·小野寺（篮球部）\n・她会问：「我的脚在哪里？」\n・要回答「在名神高速公路上」。「本州的表哥说的，那边都这么答。」\n・她爬楼梯很慢！手得一级一级地撑。被追的话就往楼梯跑。\n・还有，关上门能挡她一下。「她得用手扒开。」\n\n1月22日（五）\n・部长：「最好加一段『真实事件』。三十年前那个道口好像真出过事。」\n→ 去资料室查以前的校报！' },
      book: { title: '《日本学校怪谈大全》（图书室的书）', text: '第七章　没有脚的女人\n\n「カシマさん」的故事在各地都有流传，细节却很不一样：\n\n・听过这个故事的人，夜里会遇见一个没有脚的女人（也有说没有手的）。\n・她会问「你要脚吗？」——回答「要」，脚会被拿走；回答「不要」，也会被拿走。\n・她会问「我的脚在哪里？」——据说回答「在名神高速公路上」就能得救。\n・她还会问「这个故事，你是听谁说的？」——要回答「カシマさん」。有人说「カシマ」是「仮面の死魔」的意思。\n・听过之后，三天之内（也有说一个月）她就会来。唯一的办法：把这个故事讲给别人听。\n\n（书页边上，有人用铅笔写了一行小字：\n讲给别人听＝把她送到别人那里去？）' },
      paper57: { title: '校报《白桦》第84号（昭和37年2月1日）', text: '悼念　雪村千代同学\n\n本校二年三组雪村千代同学，于一月十九日傍晚放学途中，在学校旁的国铁道口不幸遭遇事故，年仅十四岁。\n\n千代同学是美术部的部员。她画的《雪中的道口》，曾在去年秋天的町文化祭上获奖。\n同班同学说，她最喜欢冬天。今年冬天，妈妈给她买了一双红色的雪靴，她高兴得逢人就给人看。\n\n学校将在道口旁立一尊地藏菩萨，以示悼念，并提醒全体同学：\n无论多晚、多赶时间，都绝对不要沿着铁轨抄近路。\n\n——二年三组全体同学' },
      log: { title: '道口看守日志（昭和37年1月19日）', text: '昭和37年1月19日（金）　雪\n\n16:30　降雪加剧。3号道岔冻结，除冰作业。\n17:20　上行旅客列车通过。正常。\n17:48　下行货物列车接近。\n17:5□\n\n（这一行写了又划掉，划掉了又写，纸都被笔尖戳破了。）\n\n（日志的最后，换了一种墨水，字迹苍老了很多，像是很多年以后补上去的：）\n\n那孩子穿着一双红色的雪靴。\n我没能放下栏杆。' }
    },
    legend: '「テケテケ」是日本流传很广的校园怪谈。传说她是一个只有上半身的女孩，用两只手肘（也有说是双手）撑着地面飞快地爬，发出「テケ、テケ」的声音，所以得了这个名字。据说她快得像汽车，追上人之后会把对方也拦腰截断；有的版本里，她手里还拿着一把镰刀。她出没的地方，多是黄昏或夜里的学校走廊、厕所，还有铁路道口。\n\n流传最广的起源故事发生在北海道（有一种说法是室兰）：冬天，一个女孩掉在铁轨上，被列车截成了两半。据说因为天太冷，伤口很快冻住了，她没有立刻死去，而是在铁轨上爬了一段。讲故事的人往往会加一句「这是真事」，但并没有能对上的报道或记录。\n\n她和更早的「カシマさん」（カシマ·レイコ）传说几乎缠在一起。那一类故事里，没有脚的女人会问「我的脚在哪里？」或者「你要脚吗？」，各地的「正确答案」都不一样：「在名神高速公路上」「仮面の死魔」，或者回答「是从カシマさん那里听来的」。还有一条几乎每个版本都有的规矩：听了这个故事的人，几天之内（三天、一周、一个月，说法不一）她就会找上门——唯一的办法，是把故事讲给别人听。也许正因为这样，这类故事在学校里传得飞快。1990年代的学校怪谈热、后来的网络论坛，以及2009年的电影《テケテケ》，又让她走出了日本。\n\n（本章中的白桦町、白桦二中、雪村千代、道口看守源造、1962年的那场事故和那只红色雪靴，都是游戏虚构；「她上下楼梯很慢」「关上门能挡她一下」是本章为玩法设计的规则。）',
    start: { map: 'club', x: 6, y: 6, dir: 3 },
    resume: {
      chase: async S => { S.amb(S.map === 'yard' ? 'wind' : 'drone'); spawn(S); if (S.map === 'yard') ringOn(S); },
      final: async S => { finalSetup(S); }
    },
    async intro(S) {
      await S.card('第二夜　テケテケ', '1993年1月22日（星期五）　北海道　某海边小镇', '三天前，为了给校报写「本校七大不可思议」，\n你第一次听说了她的故事。\n\n听过这个故事的人，三天之内，会遇见她。\n\n今天，是第三天。');
    },
    tick(S, dt) {
      if (S.f.phase !== 'chase' || W.busy || W.ended) return;
      const e = tkEnt(S); if (!e) return;
      if (S.f.tkT > 0) {   // 她正在楼梯上/门外，一级一级地爬过来
        S.f.tkT -= dt; S.f.tkS -= dt;
        if (S.f.tkS <= 0) { S.f.tkS = .42; S.sfx('tick'); }
        if (S.f.tkT <= 0) {
          const p = W.pl;
          if (Math.abs(p.x - S.f.tkX) + Math.abs(p.y - S.f.tkY) <= 2 && S.f.tkEx > 0) { S.f.tkT = .4; S.f.tkEx -= .4; return; }
          startTk(S, e);
        }
        return;
      }
      if (e.hidden || !e.chase) return;
      if (e.alpha < 1) e.alpha = Math.min(1, e.alpha + dt * 2);
      S.f._bt -= dt;   // テケテケ：一阵一阵地猛冲
      if (S.f._bt <= 0) {
        S.f._burst = !S.f._burst;
        if (S.f._burst) { e.chase.spd = BURST; S.f._bt = .8; } else { e.chase.spd = BASE; S.f._bt = 1.6 + Math.random() * .6; }
      }
      S.f._bs = (S.f._bs || 0) - dt;
      if (S.f._bs <= 0) { S.f._bs = S.f._burst ? .12 : .34; S.sfx(S.f._burst ? 'step' : 'tick'); }
      const m = curMap(), ex = Math.round(e.px / TS), ey = Math.round(e.py / TS);
      const shut = (DOORS[S.map] || []).map(id => S.ent(id)).filter(d => d && !d.open);
      for (const d of shut) {   // 关着的门：她在门边扒，过一会儿就扒开
        const dx = Math.round(d.px / TS), dy = Math.round(d.py / TS);
        if (Math.abs(ex - dx) + Math.abs(ey - dy) > 2) { d.ox = 0; continue; }
        const k = 'fdT_' + d.id; S.f[k] = (S.f[k] ?? DOOR_T) - dt;
        d.ox = Math.round(Math.sin(W.t * 47));
        S.f._kn = (S.f._kn || 0) - dt; if (S.f._kn <= 0) { S.f._kn = .45; S.sfx('knock'); }
        if (S.f[k] <= 0) { d.open = true; d.solid = false; d.cracked = true; d.ox = 0; S.sfx('thud'); S.shake(300, 2); }
      }
      if (!e.mv && shut.length && bfsStep(m, ex, ey, W.pl.x, W.pl.y, e) < 0) {   // 追不到你：先爬到最近的那扇门前
        let best = null, bd = 1e9;
        for (const d of shut) { const dx = Math.round(d.px / TS), dy = Math.round(d.py / TS), dd = Math.abs(ex - dx) + Math.abs(ey - dy); if (dd < bd) { bd = dd; best = [dx, dy]; } }
        if (best && bd > 1) { const dir = bfsStep(m, ex, ey, best[0], best[1], e); if (dir >= 0) startMove(e, dir, e.chase.spd); }
      }
    },
    sprites: {
      swin(g, e, t, R) {   // 雪夜的窗（墙面）。s.red：远处道口的红灯
        box(R, 1, 0, 14, 13, '#5a5a56'); R(2, 1, 12, 10, '#0c1422'); R(2, 8, 12, 3, '#1a2434'); R(7, 1, 1, 10, '#5a5a56'); R(2, 5, 12, 1, '#5a5a56');
        for (let i = 0; i < 6; i++) { const x = 2 + ((hash(i, 1, e.x | 0) * 12 + t * 3 * (1 + i % 3)) % 12), y = 1 + ((hash(i, 2, e.x | 0) * 10 + t * (6 + i)) % 10); R(x, y, 1, 1, '#d8e0ec'); }
        if (e.red) { const on = Math.floor(t * 2.4) % 2; R(10, 7, 1, 1, on ? '#ff3a22' : '#5a1010'); R(12, 7, 1, 1, on ? '#5a1010' : '#ff3a22'); }
        R(2, 10, 12, 1, '#c8d0dc'); R(1, 12, 14, 2, '#7a7a74');
      },
      kstove(g, e, t, R) {   // 石油暖炉 + 水壶
        R(2, 13, 12, 2, 'rgba(0,0,0,.4)');
        box(R, 3, 0, 10, 14, '#6a6c70'); R(4, 1, 2, 12, '#7e8084');
        const f = Math.sin(t * 7 + e.x) > 0 ? 0 : 1; R(5, 5, 6, 5, '#3a1a0a'); R(6, 6 + f, 4, 4 - f, '#ff8a2a'); R(7, 7, 2, 2, '#ffd27a');
        R(2, -1, 12, 2, '#4a4a4e');
        box(R, 5, -6, 6, 5, '#c8c8c4'); R(11, -4, 2, 1, '#a8a8a4'); R(7, -7, 2, 1, '#333');
        const b = (t * .8 + e.x * .3) % 1; R(8 + b * 2, -9 - b * 6, 1, 2, `rgba(230,230,230,${(1 - b) * .6})`);
      },
      wordpro(g, e, t, R) {   // 书桌 + 旧文字处理机
        box(R, 0, 2, 16, 12, '#5d4632'); R(1, 3, 14, 2, '#7a5e44');
        box(R, 2, -4, 12, 7, '#d8d4c4'); R(3, -3, 7, 4, '#1a2a1e'); R(4, -2, 5, 1, '#6ae06a'); R(4, 0, 3, 1, '#6ae06a'); R(11, -2, 2, 1, '#8a8a80');
        R(2, 3, 12, 2, '#b8b4a4'); R(9, 8, 6, 5, '#e8e0c8'); R(10, 9, 4, 1, '#8a8070');
      },
      gariban(g, e, t, R) { box(R, 1, 3, 14, 11, '#4a4a50'); R(3, 1, 10, 4, '#2a2a2e'); R(2, 6, 12, 3, '#e8e2cc'); R(4, 7, 8, 1, '#5a5a5a'); R(12, -1, 2, 4, '#7a6a4a'); },
      cabinet2(g, e, t, R) {   // 铁皮档案柜（3 格宽）
        box(R, 0, -12, 48, 27, '#7a8088'); R(1, -11, 46, 2, '#9aa0a8');
        for (let c = 0; c < 3; c++) for (let r = 0; r < 4; r++) { const x = 2 + c * 15, y = -8 + r * 5; box(R, x, y, 14, 5, '#8a9098'); R(x + 5, y + 2, 4, 1, '#3a3e44'); R(x + 2, y + 1, 3, 2, '#e8e4d0'); }
        if (e.open) { box(R, 17, 7, 14, 7, '#8a9098'); R(18, 8, 12, 4, '#d8d0b8'); R(19, 9, 10, 1, '#8a8070'); }
        R(36, -10, 9, 4, '#e8dca8');
      },
      fdoor(g, e, t, R) {   // 防火门（走廊隔断里的地面格）
        const c = '#6a7a72';
        if (e.open) { R(0, -14, 3, 29, shade(c, -.25)); R(1, -13, 1, 27, c); if (e.cracked) { R(0, -3, 3, 2, '#1a1a1a'); R(3, -14, 2, 3, '#2a2a2a'); } return; }
        box(R, 0, -14, 16, 29, c); R(2, -12, 12, 2, shade(c, .15)); R(5, -9, 6, 5, '#141a1e'); R(6, -8, 2, 2, '#3a4a54');
        R(2, 2, 12, 2, '#c8c8c0'); R(2, 2, 12, 1, '#e8e8e0'); R(1, 13, 14, 1, shade(c, -.4));
      },
      sdoor(g, e, t, R) {   // 职员室的木拉门（墙上的门洞）
        if (e.open) { R(0, -2, 16, 16, '#0a0806'); R(0, -2, 2, 16, '#5a4630'); if (e.cracked) R(12, -2, 4, 16, '#4a3a28'); return; }
        R(0, -2, 16, 16, '#6a5440'); R(1, -1, 14, 6, '#9ab0b8'); R(1, -1, 14, 1, '#c8d8e0'); R(7, -1, 2, 15, '#4a3a28'); R(1, 6, 14, 1, '#4a3a28'); R(5, 8, 1, 2, '#c9a35a'); R(10, 8, 1, 2, '#c9a35a');
      },
      gdoor(g, e, t, R) {   // 玄关的两扇玻璃门（w=2）
        R(0, -2, 32, 16, '#3a3e44'); R(1, -1, 14, 14, '#16202c'); R(17, -1, 14, 14, '#16202c'); R(2, 0, 3, 8, '#2a3a4c'); R(18, 0, 3, 8, '#2a3a4c');
        R(13, 4, 1, 4, '#b8b8b0'); R(18, 4, 1, 4, '#b8b8b0'); if (!e.open) R(14, 6, 4, 2, '#c9a35a');
      },
      keybox(g, e, t, R) { box(R, 2, 1, 12, 11, '#6a5038'); for (let i = 0; i < 6; i++) { const x = 4 + (i % 3) * 3, y = 3 + ((i / 3) | 0) * 5; R(x, y, 1, 1, '#ccc'); if (!(i === 1 && e.s.noA) && !(i === 4 && e.s.noG)) R(x, y + 1, 1, 3, '#d9b84a'); } },
      exitsign(g, e, t, R) { R(3, 2, 10, 6, '#1a6a3a'); R(4, 3, 8, 4, '#5ae08a'); R(5, 4, 2, 2, '#e8fff0'); R(8, 5, 3, 1, '#e8fff0'); },
      drag(g, e, t, R) { R(0, 6, 16, 4, 'rgba(110,130,150,.22)'); R(0, 7, 16, 1, 'rgba(180,200,220,.22)'); R(3, 10, 2, 1, 'rgba(110,130,150,.3)'); R(11, 5, 2, 1, 'rgba(110,130,150,.3)'); },
      elbows(g, e, t, R) { const c = 'rgba(70,84,106,.5)'; R(3, 3, 3, 2, c); R(10, 4, 3, 2, c); R(4, 10, 3, 2, c); R(9, 11, 3, 2, c); R(5, 6, 6, 1, 'rgba(70,84,106,.25)'); },
      redboot(g, e, t, R) { R(5, 3, 5, 8, '#b01c1c'); R(5, 3, 5, 2, '#f0ece4'); R(5, 10, 8, 3, '#b01c1c'); R(6, 4, 1, 6, '#d84040'); R(5, 13, 8, 1, '#2a1010'); },
      jizo(g, e, t, R) {   // 道口旁的小地藏
        R(3, 12, 10, 3, '#4a4a48'); R(5, 3, 6, 10, '#7a7a76'); R(5, -2, 6, 6, '#8a8a86'); R(7, 0, 1, 1, '#4a4a48'); R(9, 0, 1, 1, '#4a4a48');
        R(4, 4, 8, 4, '#b02020'); R(5, 7, 6, 1, '#801818'); R(4, -3, 8, 2, '#e8eef4'); R(5, -4, 6, 1, '#e8eef4'); R(3, 11, 4, 1, '#e8eef4');
        R(11, 12, 2, 2, '#c9a35a');
      },
      hut(g, e, t, R) {   // 道口看守小屋（w=2）
        R(-1, 13, 34, 2, 'rgba(0,0,0,.4)');
        box(R, 0, -8, 32, 23, '#5a4632'); for (let x = 3; x < 32; x += 4) R(x, -7, 1, 21, '#4a3828');
        R(-2, -18, 36, 11, '#dfe6ee'); R(-2, -9, 36, 2, '#2a2018'); R(0, -18, 32, 2, '#f4f8fc');
        R(26, -24, 3, 8, '#2a2a2a');
        R(3, -4, 11, 8, e.lit ? '#e8c878' : '#141c28'); R(8, -4, 1, 8, '#4a3828'); R(3, 0, 11, 1, '#4a3828');
        box(R, 18, -4, 10, 18, '#3a2a1c'); R(26, 4, 1, 2, '#c9a35a');
        R(17, -12, 12, 4, '#e8e4d8'); R(19, -11, 8, 1, '#444'); R(19, -9, 5, 1, '#444');
      },
      fumikiri(g, e, t, R) {   // 道口信号机：s.ring 红灯交替闪，s.down 栏杆放下
        R(7, -26, 2, 41, '#d8d8d0'); for (let y = -24; y < 14; y += 6) R(7, y, 2, 3, '#1a1a1a');
        for (let i = 0; i < 11; i++) { R(2 + i, -38 + i, 2, 2, i % 3 ? '#e8c020' : '#1a1a1a'); R(12 - i, -38 + i, 2, 2, i % 3 ? '#e8c020' : '#1a1a1a'); }
        R(0, -24, 16, 2, '#2a2a2a'); box(R, 0, -22, 6, 6, '#141414'); box(R, 10, -22, 6, 6, '#141414');
        const ph = Math.floor(t * 2.6) % 2, on = e.ring;
        R(1, -21, 4, 4, on && ph ? '#ff3a22' : '#4a1010'); R(11, -21, 4, 4, on && !ph ? '#ff3a22' : '#4a1010');
        if (on && ph) R(2, -20, 2, 1, '#ffb0a0'); if (on && !ph) R(12, -20, 2, 1, '#ffb0a0');
        if (e.down) { for (let i = 0; i < 9; i++) R(e.flip ? 10 : 4, e.flip ? 10 + i * 4 : 6 - (i + 1) * 4, 2, 4, i % 2 ? '#e8c020' : '#1a1a1a'); }   // 横跨马路（北侧的往下，南侧的往上）
        else for (let i = 0; i < 7; i++) R(e.flip ? 10 : 4, -16 + i * 4, 2, 4, i % 2 ? '#e8c020' : '#1a1a1a');
        R(4, 13, 8, 2, '#3a3a3a'); R(3, 12, 10, 1, '#e8eef4');
      },
      snowfall(g, e, t, R) {   // 屏幕空间的落雪（实体每帧挪到玩家身上）
        const sx0 = Math.round(e.px - CAM.x), sy0 = Math.round(e.py - CAM.y), Wd = VW + 40, Hd = VH + 20;
        for (let i = 0; i < 80; i++) {
          const sp = 12 + hash(i, 1, 7) * 20;
          const x = (((hash(i, 2, 7) * Wd + Math.sin(t * .7 + i) * 8 - t * 9) % Wd) + Wd) % Wd - 20;
          const y = ((hash(i, 3, 7) * Hd + t * sp) % Hd) - 10;
          const big = i % 5 === 0;
          R(x - sx0, y - sy0, big ? 2 : 1, big ? 2 : 1, i % 3 ? 'rgba(236,242,250,.8)' : 'rgba(200,212,230,.55)');
        }
      }
    },
    tiles: {
      snow: { solid: false, paint(R, X, Y) { R(0, 0, 16, 16, '#bcc6d4'); for (let i = 0; i < 8; i++) { const h = hash(X * 5 + i, Y * 9 + i, 61); R((h * 15) | 0, (hash(X, Y, i + 70) * 15) | 0, 2, 1, i % 3 ? '#d4dce8' : '#a2acbc'); } } },
      spine: { solid: true, paint(R, X, Y) { R(0, 0, 16, 16, '#bcc6d4'); const c = '#18281e'; for (let i = 0; i < 7; i++) { R(7 - i, 1 + i * 2, 2 + i * 2, 2, i % 2 ? c : '#22362a'); if (i % 2 === 0) R(7 - i, 1 + i * 2, 2 + i, 1, '#dfe6ee'); } R(7, 14, 2, 2, '#2a1c12'); } },
      track: { solid: false, paint(R, X, Y) {
        R(0, 0, 16, 16, '#4a4a4c'); for (let i = 0; i < 12; i++) R((hash(X, Y, i + 80) * 15) | 0, (hash(Y, X, i + 90) * 15) | 0, 1, 1, i % 2 ? '#5a5a5e' : '#3a3a3c');
        R(0, 2, 16, 3, '#3a2c22'); R(0, 10, 16, 3, '#3a2c22'); R(0, 2, 16, 1, '#dfe6ee'); R(0, 10, 16, 1, '#dfe6ee');
        R(3, 0, 2, 16, '#8d9196'); R(3, 0, 1, 16, '#c4c8cc'); R(11, 0, 2, 16, '#8d9196'); R(11, 0, 1, 16, '#c4c8cc');
      } },
      xing: { solid: false, paint(R, X, Y) {
        R(0, 0, 16, 16, '#4a4e56'); R(0, 4, 16, 2, '#7a808a'); R(0, 11, 16, 2, '#7a808a');
        R(3, 0, 2, 16, '#9a9ea4'); R(3, 0, 1, 16, '#c8ccd0'); R(5, 0, 1, 16, '#1a1a1c'); R(11, 0, 2, 16, '#9a9ea4'); R(11, 0, 1, 16, '#c8ccd0'); R(13, 0, 1, 16, '#1a1a1c');
      } },
      sroad: { solid: false, paint(R, X, Y) { R(0, 0, 16, 16, '#4c5058'); for (let i = 0; i < 9; i++) R((hash(X, Y, i + 40) * 15) | 0, (hash(Y, X, i + 50) * 15) | 0, 2, 1, i % 2 ? '#5a5e66' : '#9aa2ae'); R(0, Y % 2 ? 4 : 10, 16, 2, '#8a929e'); } },
      sfence: { solid: true, paint(R, X, Y) { R(0, 0, 16, 16, '#bcc6d4'); R(0, 5, 16, 2, '#4a4e55'); R(0, 10, 16, 2, '#4a4e55'); R(2, 2, 2, 13, '#5a5e66'); R(11, 2, 2, 13, '#5a5e66'); R(2, 1, 2, 1, '#eef2f8'); R(11, 1, 2, 1, '#eef2f8'); R(0, 4, 16, 1, '#dfe6ee'); } }
    },
    maps: {
      /* ---------------- 新闻部活动室（二楼） ---------------- */
      club: {
        amb: 'room', dark: .42, darkC: '#0a0806', plr: 3.4, wall: 'school', floor: 'lightwood',
        rows: [
          '############',
          '############',
          '#..........#',
          '#..........#',
          '#..........#',
          '#..........#',
          '#..........#',
          '#..........#',
          '#####.######'],
        ents: [
          { id: 'win1', x: 2, y: 1, spr: 'swin', light: { r: 2.6, col: 'rgba(120,150,210,.1)', dy: 18 }, on: S => S.narr('窗外下着雪。操场白茫茫的一片，路灯把雪照成了橘黄色。\n远处，铁路道口的红灯一闪，一闪。\n……可是这会儿，并没有火车要来。') },
          { x: 3, y: 1, spr: 'poster', col: '#e8e4d0', on: S => S.narr('墙上贴着上一期的校报。\n头版：「冬季运动会——二年三组夺得雪橇接力第一名！」照片上的你，冻得满脸通红。') },
          { id: 'board', x: 5, y: 1, spr: 'blackboard', text: true, on: S => S.narr('黑板上写着：「校报《白桦》第三学期号　截稿：1月25日（一）」\n下面是部长的字：「水野——テケテケ，两页。写得吓人一点。」') },
          { id: 'win2', x: 8, y: 1, spr: 'swin', s: { red: true }, light: { r: 2.6, col: 'rgba(120,150,210,.1)', dy: 18 }, async on(S) {
            if (S.once('track2')) {
              await S.narr('玻璃上的雾，你用手指擦开了一小块。');
              S.sfx('heart');
              await S.narr('雪地上有两行奇怪的痕迹，从铁路那边，一直延伸到校门口。\n不像脚印。一个一个圆圆的坑，一左一右——');
              return S.think('……像有人用两只手肘，一下一下地撑着往前爬。\n……是野狗吧。肯定是野狗。');
            }
            await S.narr('雪越下越大。刚才那两行痕迹，已经快被盖住了。');
          } },
          { x: 10, y: 1, spr: 'wallclock', on: S => S.narr('五点四十分。外面早就黑透了。\n北海道的一月，四点多天就黑了。') },
          { id: 'shelf1', x: 1, y: 2, spr: 'bookshelf', async on(S) { if (S.once('bookP')) await S.narr('书架上插着一本从图书室借来的书，还没还。\n书签夹在「没有脚的女人」那一章。'); await S.note('book'); } },
          { x: 4, y: 2, spr: 'gariban', on: S => S.narr('部里的油印机。滚筒上沾着干掉的油墨，一股煤油味。\n校报就是用它一张一张印出来的。') },
          { id: 'buchou', x: 5, y: 3, spr: '@kiryu', dir: 0, async on(S) {
            S.face('buchou', 'pl');
            const l = ['「真实事件」那一段，写得越像真的越好。', '……喂，你脸色不太好啊。不会真信了吧？', '我先走了。你也别弄太晚。'];
            await S.say('桐生部长', l[(S.f._kb = ((S.f._kb ?? -1) + 1) % 3)]);
          } },
          { x: 4, y: 4, w: 2, spr: 'table2', col: '#7a5a3a', on: S => S.narr('长桌上摊着排版用的方格稿纸、剪刀和胶水。\n一张草稿上画着版面：「テケテケ」四个大字，旁边空着一大块——「照片？」') },
          { id: 'desk', x: 7, y: 3, spr: 'wordpro', async on(S) {
            if (S.once('deskA')) await S.narr('你的稿子，打在部里那台旧文字处理机上。绿色的字一行一行地亮着：\n「……她没有下半身，用两只手肘撑着地，テケ、テケ、テケ地爬。听过这个故事的人，三天之内——」\n光标停在那里，一闪一闪。');
            await S.note('memo');
            if (!S.f.toStaff && S.f.introDone) S.goal('去一楼职员室，找高木老师借资料室的钥匙');
          } },
          { x: 7, y: 4, spr: 'chair', col: '#5a4a3a' },
          { id: 'stove', x: 10, y: 3, spr: 'kstove', light: { r: 4.6, col: 'rgba(255,150,70,.24)', flick: true }, on: S => S.narr('石油暖炉烧得正旺。上面坐着一只水壶，咕嘟咕嘟地响。\n你把冻僵的手凑过去烤了一会儿。') },
          { x: 1, y: 6, spr: 'box', on: S => S.narr('一纸箱的旧校报，最老的也就是五年前的。\n更老的，都锁在走廊尽头的资料室里。') },
          { x: 10, y: 7, spr: 'locker', on: S => S.narr('部里的储物柜。里面挂着一件谁忘了带走的羽绒服，还有一台坏掉的相机。') },
          { x: 2, y: 7, spr: 'plant', on: S => S.narr('一盆仙人掌。是前任部长毕业时留下的，叫「主编」。') },
          { x: 5, y: 8, spr: 'invisible', async touch(S) {
            if (S.f.phase === 'chase0' || S.f.phase === 'chase') return;
            await S.go('hall2', 3, 2, 0);
          } }
        ],
        async enter(S, first) {
          if (!first) return;
          await S.narr('窗外的雪，从中午一直下到现在。\n新闻部的石油暖炉烧得很旺，窗玻璃上全是雾。');
          S.face('buchou', 'pl');
          await S.say('桐生部长', ['水野，稿子写到哪儿了？', '「本校七大不可思议之一：テケテケ」……嗯，标题不错。']);
          await S.say('你', '就差最后一部分了。「真实事件」。\n大家都说，三十年前，学校旁边那个道口真的出过事。');
          await S.say('桐生部长', ['那就去查。资料室里有历年的校报，翻翻看，说不定能找到当年的报道。', '钥匙在职员室，高木老师那儿。他在这学校待了三十多年了，说不定还记得。']);
          await S.say('桐生部长', '对了——你是星期三第一次听说这个故事的吧？星期三、星期四、星期五……');
          S.bubble('buchou', '…', 1200);
          const r = await S.ask('「……今天，就是第三天了呢。」', ['……别说了。', '我才不信那种东西。'], '桐生部长');
          await S.say('桐生部长', r === 0 ? '哈哈，开玩笑的。瞧你那张脸——这表情要是能拍下来，放在稿子旁边正合适。' : '那就好。写鬼故事的人要是自己先怕了，可写不出好稿子。');
          await S.say('桐生部长', ['我先走了。暖炉记得关。', '雪下大了，你也早点回去——别沿着铁轨抄近路啊。']);
          S.sfx('open');
          await S.walk('buchou', [5, 7], 3.6);
          S.hide('buchou'); S.sfx('close');
          await S.narr('拉门在他身后「咔啦」一声合上。\n走廊里的脚步声越来越远，最后什么也听不见了。');
          S.f.introDone = true;
          S.goal('去一楼职员室，找高木老师借资料室的钥匙');
        }
      },
      /* ---------------- 二楼走廊 ---------------- */
      hall2: {
        amb: 'school', dark: .56, plr: 3.2, wall: 'school', floor: 'linoleum',
        rows: [
          '##############################',
          '##############################',
          '#........#..........#........#',
          '..............................',
          '#........#..........#........#',
          '##############################'],
        ents: [
          { x: 0, y: 3, spr: 'stairsdown', solid: false, touch: S => stairs(S, 'hall1', 1, 3, 2, 0, 3, false) },
          { x: 29, y: 3, spr: 'stairsdown', solid: false, touch: S => stairs(S, 'hall1', 28, 3, 1, 29, 3, false) },
          { x: 1, y: 1, spr: 'exitsign', light: { r: 2.2, col: 'rgba(80,230,140,.16)', dy: 6 }, on: S => S.narr('绿色的「非常口」指示灯。小人朝着楼梯的方向跑。') },
          { x: 28, y: 1, spr: 'exitsign', light: { r: 2.2, col: 'rgba(80,230,140,.16)', dy: 6 }, on: S => S.narr('「非常口」。灯管里有一只死掉的小飞虫。') },
          { x: 3, y: 1, spr: 'door', col: '#6a5a44', async on(S) {
            if (S.f.phase === 'chase0' || S.f.phase === 'chase') { S.sfx('locked'); return S.narr('新闻部的拉门卡住了——拉不开！'); }
            S.sfx('open'); await S.go('club', 5, 7, 3);
          } },
          { x: 6, y: 1, spr: 'window', light: { r: 2, col: 'rgba(110,130,190,.1)', dy: 18 }, on: S => S.narr('窗外是操场。秋千被雪埋了一半。') },
          { id: 'adoor', x: 12, y: 1, spr: 'door', col: '#4a4a52', async on(S) {
            if (S.f.phase === 'chase0' || S.f.phase === 'chase') { S.sfx('locked'); return S.narr('资料室的门锁上了。\n……你明明没有锁。'); }
            if (!S.has('akey')) { S.sfx('locked'); return S.narr('资料室。门上挂着一把老式的铜锁。\n钥匙在一楼职员室，高木老师那里。'); }
            S.sfx('open'); await S.go('archive', 4, 6, 3);
          } },
          { id: 'hw2', x: 15, y: 1, spr: 'window', light: { r: 2, col: 'rgba(110,130,190,.1)', dy: 18 }, async on(S) {
            if (S.has('akey') && S.once('hand')) { S.sfx('heart'); return S.narr('窗玻璃的下沿，有一个小小的手掌印。\n……在玻璃外面。\n这里是二楼。'); }
            await S.narr(S.f.phase === 'chase' ? '玻璃上的手掌印，又多了几个。' : '雪越下越大。窗外的路灯晃成了一团光。');
          } },
          { x: 17, y: 1, spr: 'door', col: '#6a5a44', async on(S) { S.sfx('locked'); await S.narr('二年三组——你们班的教室。门锁着。\n门上的小窗里，黑板上还留着今天的值日表：「值日：水野·佐藤」。'); } },
          { x: 22, y: 1, spr: 'poster', col: '#e8dca8', on: S => S.narr('「走廊上禁止奔跑！」\n下面有人用铅笔添了一行小字：「被テケテケ追的时候除外」。') },
          { x: 24, y: 1, spr: 'door', col: '#6a5a44', async on(S) { S.sfx('locked'); await S.narr('图书室已经锁门了。\n门缝底下透出一股旧书和石油暖炉的味道。'); } },
          { x: 26, y: 1, spr: 'window', light: { r: 2, col: 'rgba(110,130,190,.1)', dy: 18 }, on: S => S.narr('从这扇窗户，能看见学校后面的铁路。\n道口的红灯在雪里一闪一闪，像一只眨个不停的眼睛。') },
          { x: 6, y: 4, spr: 'sink', on: S => S.narr('走廊的洗手台。水龙头没拧紧，滴答，滴答。\n水是冰的。') },
          { x: 16, y: 4, spr: 'cabinet', col: '#a02424', on: S => S.narr('消火栓的红箱子。玻璃上贴着：「火灾时请用力按下」。') },
          { x: 27, y: 4, spr: 'plant', on: S => S.narr('一盆橡皮树，叶子上落满了粉笔灰。') },
          { x: 13, y: 4, w: 2, spr: 'bench', on: S => S.narr('走廊里的长椅。白天总有人坐在这儿吃面包。\n椅面冰凉。') },
          { id: 'fd1', x: 9, y: 3, spr: 'fdoor', open: true, solid: false, on: S => S.f.phase === 'chase' ? door(S, 'fd1', 'fd') : fdLook(S, 'fd1') },
          { id: 'fd2', x: 20, y: 3, spr: 'fdoor', open: true, solid: false, on: S => S.f.phase === 'chase' ? door(S, 'fd2', 'fd') : fdLook(S, 'fd2') },
          ...[[1, 3], [3, 3], [5, 3], [7, 3], [10, 3], [11, 2]].map(([x, y], i) => ({ id: 'dg' + i, x, y, spr: 'drag', decal: true, hidden: true })),
          { id: 'tk2', x: 1, y: 3, spr: '@teke', hidden: true, solid: false, light: { r: 1.4, col: 'rgba(150,170,220,.16)' } }
        ],
        async enter(S, first) {
          if (S.f.phase === 'chase0') return reveal(S);
          if (S.f.phase === 'chase') { S.amb('drone'); return arrive(S, ...S.f.tkNext); }
          if (first) {
            await S.narr('走廊里的日光灯嗡嗡地响，有一根一闪一闪的。\n暖气片是凉的。风把雪粒打在玻璃上，沙、沙、沙。');
            S.goal('去一楼职员室，找高木老师借资料室的钥匙（楼梯在走廊两头）');
          }
          if (S.has('akey') && !S.f.found && S.once('eerie')) {
            await S.wait(300);
            S.sfx('tick'); await S.wait(420); S.sfx('tick');
            await S.narr('……刚才，好像有什么声音。\nテケ。\n　　テケ。');
            S.dark(.9); S.sfx('switch'); await S.wait(260); S.dark(null); await S.wait(140); S.dark(.9); await S.wait(160); S.dark(null);
            for (let i = 0; i < 6; i++) S.show('dg' + i);
            await S.narr('走廊的地板上，多了一道湿漉漉的痕迹。\n从左边的楼梯口拖过来，一直拖到资料室的门口。');
            await S.think('……一定是谁拖着拖把走过去了。一定是。');
            S.goal('去资料室，找三十一年前的校报');
          }
        }
      },
      /* ---------------- 资料室 ---------------- */
      archive: {
        amb: 'room', dark: .7, plr: 3, wall: 'school', floor: 'darkwood',
        rows: [
          '##########',
          '##########',
          '#........#',
          '#........#',
          '#........#',
          '#........#',
          '#........#',
          '####.#####'],
        ents: [
          { id: 'cal', x: 5, y: 1, spr: 'poster', col: '#e8e0d0', on: S => S.narr('墙上的挂历：「平成5年（1993年）1月」。\n今年的挂历。大概是哪个老师挂上去以后，就再也没人进来翻过。') },
          { x: 6, y: 1, spr: 'window', light: { r: 2.4, col: 'rgba(120,140,200,.12)', dy: 18 }, on: S => S.narr('资料室的窗户正对着铁路。\n雪幕后面，道口的红灯一闪，一闪。') },
          { x: 7, y: 1, spr: 'portrait', on: S => S.narr('历代校长的照片排成一排。\n第三任校长的照片下面写着：「昭和35年～昭和41年」。') },
          { id: 'cab', x: 2, y: 2, w: 3, spr: 'cabinet2', on: S => cabinet(S) },
          { x: 1, y: 2, spr: 'bookshelf', on: S => S.narr('书架上是一排排毕业纪念册。\n书脊上的年份，从「昭和22年度」一直排到去年。') },
          { x: 8, y: 2, spr: 'shelf', on: S => S.narr('架子上堆着奖杯、锦旗，还有一个缺了一只耳朵的熊玩偶。\n锦旗上写着：「昭和36年度　町文化祭　美术部　优秀奖」。') },
          { x: 8, y: 5, spr: 'crate', on: S => S.narr('一箱旧的运动会用品：接力棒、红白帽子、一面卷起来的校旗。') },
          { x: 7, y: 4, spr: 'desk', on: S => S.narr('落满灰尘的书桌。桌面上用小刀刻着一行字：「昭和五十年　到此一游」。') },
          { x: 2, y: 5, spr: 'box', on: S => S.narr('纸箱上写着「废弃」。里面是几卷发黑的胶片。') },
          { id: 'bulb', x: 5, y: 4, spr: 'invisible', light: { r: 3.4, col: 'rgba(255,220,150,.14)' } },
          { x: 4, y: 7, spr: 'invisible', async touch(S) {
            if (S.f.phase === 'chase0') { await S.go('hall2', 12, 2, 0); return; }
            await S.go('hall2', 12, 2, 0);
          } }
        ],
        async enter(S, first) {
          if (!first) return;
          S.sfx('drip');
          await S.narr('资料室里一股霉味和灰尘味。\n天花板上只吊着一只灯泡，光是黄的。');
          S.goal('在档案柜里找到一九六二年一月的校报');
        }
      },
      /* ---------------- 一楼：走廊、职员室、玄关 ---------------- */
      hall1: {
        amb: 'school', dark: .56, plr: 3.2, wall: 'school', floor: 'linoleum',
        rows: [
          '##############################',
          '##############################',
          '#...................#........#',
          '..............................',
          '#...................#........#',
          '##.####.##....################',
          '#wwwwwww##xxxxxxxxx###########',
          '#wwwwwww##xxxxxxxxx###########',
          '#wwwwwww##xxxxxxxxx###########',
          '#wwwwwww##xxxxxxxxx###########',
          '#############xx###############'],
        tileOpts: { woodC: '#7a5c3c' },
        ents: [
          { x: 0, y: 3, spr: 'stairsup', solid: false, touch: S => stairs(S, 'hall2', 1, 3, 2, 0, 3, true) },
          { x: 29, y: 3, spr: 'stairsup', solid: false, touch: S => stairs(S, 'hall2', 28, 3, 1, 29, 3, true) },
          { x: 1, y: 1, spr: 'exitsign', light: { r: 2.2, col: 'rgba(80,230,140,.16)', dy: 6 }, on: S => S.narr('「非常口」。绿色的小人一直在跑，跑了好多年。') },
          { x: 28, y: 1, spr: 'exitsign', light: { r: 2.2, col: 'rgba(80,230,140,.16)', dy: 6 }, on: S => S.narr('「非常口」。下面就是上二楼的楼梯。') },
          { x: 3, y: 1, spr: 'window', light: { r: 2, col: 'rgba(110,130,190,.1)', dy: 18 }, on: S => S.narr('窗外的雪堆到了窗台那么高。') },
          { x: 8, y: 1, spr: 'window', light: { r: 2, col: 'rgba(110,130,190,.1)', dy: 18 }, on: S => S.narr('窗户外面是自行车棚。棚顶的雪压得弯弯的，随时会塌下来。') },
          { x: 11, y: 1, spr: 'poster', col: '#e8d0a0', on: S => S.narr('交通安全的海报：「道口一旦响铃，绝对不许穿越！」\n画上的小学生举着手，笑得很灿烂。') },
          { x: 14, y: 1, spr: 'window', light: { r: 2, col: 'rgba(110,130,190,.1)', dy: 18 }, on: S => S.narr('玄关前的路灯底下，雪片斜斜地飞。') },
          { x: 17, y: 1, spr: 'portrait', on: S => S.narr('首任校长的肖像。\n……他的眼睛，好像一直在往窗外看。') },
          { x: 24, y: 1, spr: 'window', light: { r: 2, col: 'rgba(110,130,190,.1)', dy: 18 }, on: S => S.narr('窗户关不严，缝里塞着报纸。冷风还是一丝一丝地钻进来。') },
          { x: 27, y: 1, spr: 'poster', col: '#d8e0e8', on: S => S.narr('「下校时间　17:00\n　18:00以后玄关上锁，请走职员室的钥匙箱借备用钥匙。」') },
          { x: 23, y: 4, spr: 'cabinet', col: '#a02424', on: S => S.narr('消火栓。红色的灯泡亮着，在地板上照出一小块红。') },
          { x: 16, y: 2, spr: 'shelf', on: S => S.narr('奖杯柜。最上面一层是一张褪色的奖状：「昭和36年度　町文化祭　绘画部门　优秀奖」。\n获奖者的名字，被一只奖杯挡住了。') },
          { id: 'fd3', x: 20, y: 3, spr: 'fdoor', open: true, solid: false, on: S => S.f.phase === 'chase' ? door(S, 'fd3', 'fd') : fdLook(S, 'fd3') },
          /* 职员室 */
          { id: 'sd1', x: 2, y: 5, spr: 'sdoor', open: true, solid: false, on: S => S.f.phase === 'chase' ? door(S, 'sd1', 'sd') : S.narr('职员室的拉门开着。里面的暖炉烘出一股热气。') },
          { id: 'sd2', x: 7, y: 5, spr: 'sdoor', open: true, solid: false, on: S => S.f.phase === 'chase' ? door(S, 'sd2', 'sd') : S.narr('职员室的另一扇门。两扇门都开着，暖气全跑了。') },
          { x: 3, y: 5, spr: 'wallclock', on: S => S.narr(S.f.phase === 'chase' ? '七点二十分。\n……什么时候过了这么久？' : '五点五十分。') },
          { id: 'keybox', x: 4, y: 5, spr: 'keybox', on: S => keybox(S) },
          { x: 5, y: 5, spr: 'poster', col: '#e8e4d8', on: S => S.narr('一月的行事表：「22日（五）大雪注意报，提前放学」「25日（一）冬季学力测验」。') },
          { x: 1, y: 6, spr: 'bookshelf', on: S => S.narr('教务资料。一本《学生指导要领》的书脊上，贴着「铁路安全」的标签。') },
          { x: 2, y: 7, spr: 'desk', on: S => S.narr('教务主任的桌子。收拾得干干净净，只有一只茶杯。') },
          { x: 2, y: 7, spr: 'phone', oy: -6, z: 1 },
          { x: 3, y: 7, spr: 'desk', on: S => S.narr('堆满了作业本的桌子。最上面那本的封面写着：「二年三组　水野葵」。') },
          { id: 'tdesk', x: 6, y: 7, spr: 'desk', on: S => S.f.phase === 'chase' ? S.narr('高木老师的桌上，茶杯里的茶还冒着热气。\n茶杯下面压着一张字条：\n「水野：我先回去了。玄关已经锁了，备用钥匙在钥匙箱里。路上小心，别走铁轨。——高木」') : S.narr('高木老师的桌子。老花镜、红笔、一摞改了一半的作业。\n桌角压着一张很旧的黑白照片，边角都卷起来了。') },
          { x: 5, y: 7, spr: 'desk', on: S => S.narr('空着的桌子。椅背上搭着一条织了一半的围巾。') },
          { id: 'takagi', x: 6, y: 8, spr: '@takagi', dir: 3, on: S => takagi(S) },
          { x: 1, y: 9, spr: 'kstove', light: { r: 4.2, col: 'rgba(255,150,70,.22)', flick: true }, on: S => S.narr('职员室的暖炉。比新闻部那台大一号，烧得通红。') },
          { x: 7, y: 9, spr: 'cabinet', on: S => S.narr('文件柜。抽屉上贴着「学籍簿」「家庭访问记录」。都锁着。') },
          /* 玄关 */
          ...[15, 16, 17, 18].map(x => ({ x, y: 6, spr: 'getabako', on: S => S.narr(['鞋柜。一格一格的，室外鞋都被穿走了。', '有一格里塞着一双湿透的运动鞋，冻得硬邦邦的。', '这一格的名牌被撕掉了。'][x % 3]) })),
          ...[15, 16, 17].map(x => ({ x, y: 8, spr: 'getabako', on: S => S.narr(x === 16 ? '你的鞋柜。你的长靴好好地放在里面——你早上就换好鞋了。' : '一年级的鞋柜。有人在格子里放了一颗糖。') })),
          { x: 10, y: 9, spr: 'box', on: S => S.narr('失物招领箱。手套、围巾、一只没人认领的室内鞋……\n最底下有一只小小的、旧旧的红色毛线手套。') },
          { x: 18, y: 9, spr: 'plant', on: S => S.narr('玄关的盆栽。叶子冻蔫了。') },
          { id: 'gdoor', x: 13, y: 10, w: 2, spr: 'gdoor', solid: false, async touch(S) { await genkan(S); }, async on(S) { await genkan(S); } },
          { id: 'tk1', x: 29, y: 3, spr: '@teke', hidden: true, solid: false, light: { r: 1.4, col: 'rgba(150,170,220,.16)' } }
        ],
        async enter(S, first) {
          if (S.f.phase === 'chase') { S.amb('drone'); await arrive(S, ...S.f.tkNext); if (S.once('h1chase')) { await S.narr('楼梯上，传来一级、一级，手掌拍在台阶上的声音。\nテケ……テケ……'); S.goal(S.has('gkey') ? '从玄关逃出去！' : '去玄关——快逃出学校！'); } return; }
          if (first) {
            await S.narr('一楼更冷。玄关的玻璃门外，雪片斜斜地飞。\n职员室的门开着，里面透出暖炉的红光。');
          }
        }
      },
      /* ---------------- 校门外 · 雪中的铁路道口 ---------------- */
      yard: {
        amb: 'wind', dark: .8, darkC: '#04070f', plr: 3.2, wall: 'concrete', floor: 'snow',
        legend: { '*': 'snow', 'Y': 'spine', 'H': 'track', 'X': 'xing', 'R': 'sroad', 'F': 'sfence' },
        rows: [
          '############YYYYYYYYYYYYYYYYYHHYYYYYYYYY',
          '############*Y**Y***Y**Y**Y**HH**Y***Y**',
          '*****************************HH*********',
          '*****************************HH*********',
          'FFFF**FFFFFF*****************HH*********',
          '*****************************HH*********',
          'RRRRRRRRRRRRRRRRRRRRRRRRRRRRRXXRRRRRRRRR',
          'RRRRRRRRRRRRRRRRRRRRRRRRRRRRRXXRRRRRRRRR',
          '*****************************HH*********',
          '*****************************HH*********',
          'YY*YY**Y*YYY**Y*YY*Y**YY*YY**HH*Y*YY*YYY',
          'YYYYYYYYYYYYYYYYYYYYYYYYYYYYYHHYYYYYYYYY'],
        ents: [
          { id: 'snowfx', x: 4, y: 2, spr: 'snowfall', z: 1, solid: false },
          { x: 3, y: 1, w: 2, spr: 'gdoor', async on(S) { S.sfx('locked'); await S.narr(S.f.phase === 'chase' ? '玻璃门在身后自己合上了。\n门里黑漆漆的走廊上，有什么东西在动。' : '玄关的玻璃门。门里的走廊，黑漆漆的。\n……不回去了。'); } },
          { x: 1, y: 1, spr: 'window', on: S => S.narr('一楼的窗户全黑了。') },
          { x: 8, y: 1, spr: 'window', lit: true, light: { r: 2, col: 'rgba(255,180,90,.16)', dy: 14 }, on: S => S.narr('职员室的窗户还亮着暖炉的光。\n窗户里没有人。') },
          { x: 10, y: 1, spr: 'window', on: S => S.narr('黑漆漆的窗户。玻璃上……有一个从里面按上去的手掌印。') },
          { id: 'lampA', x: 9, y: 5, spr: 'streetlamp', light: { r: 3.6, col: 'rgba(255,215,150,.2)', dy: 10 }, on: S => S.narr('路灯。灯罩上积着一层雪，光是橘黄色的。') },
          { id: 'lampB', x: 19, y: 5, spr: 'streetlamp', light: { r: 3.6, col: 'rgba(255,215,150,.2)', dy: 10 }, on: S => S.narr('路灯下的雪地被照得发亮。\n雪地上那两排圆圆的坑，从这里一直延伸到道口。') },
          { x: 14, y: 5, spr: 'busstop', on: S => S.narr('公交站牌：「白桦二中前」。\n最后一班车是七点零五分。已经开走了。') },
          { id: 'hut', x: 24, y: 4, w: 2, spr: 'hut', lit: true, light: { r: 3.2, col: 'rgba(255,190,110,.22)', dx: 9, dy: 0 }, on: S => hutDoor(S) },
          { id: 'sig1', x: 28, y: 5, spr: 'fumikiri', flip: true, on: S => S.narr(S.f.ringing ? '当、当、当、当——\n警报一直在响。可是铁轨上，没有火车。' : '道口的信号机。红灯熄了，栏杆抬着。') },
          { id: 'sig2', x: 31, y: 8, spr: 'fumikiri', on: S => S.narr('道口另一边的信号机。黄黑相间的栏杆上挂着冰溜子。') },
          { x: 32, y: 5, spr: 'jizo', on: S => S.narr('道口旁边的一尊小地藏。红色的围兜被雪压得湿透了。\n脚边摆着一小束干枯的花，还有一颗用纸包着的糖。\n……一直有人来供奉。') },
          { x: 34, y: 8, spr: 'sign', col: '#e8e4d8', on: S => S.narr('「止まれ　踏切注意」\n牌子被雪糊住了一半。') },
          ...[[5, 3], [6, 5], [10, 7], [13, 6], [16, 7], [20, 6], [23, 7], [26, 6]].map(([x, y]) => ({ x, y, spr: 'elbows', decal: true, on: S => S.narr('雪地上的痕迹。不是脚印。\n两排圆圆的坑，一左一右——像有人用两只手肘撑着，一下，一下地往前爬。') })),
          ...[0, 1, 2, 3, 4, 5].map(i => ({ id: 'fp' + i, x: 30, y: 5 - i, spr: 'footprints', decal: true, hidden: true, col: 'rgba(90,104,130,.6)' })),
          { id: 'bootf', x: 29, y: 6, spr: 'redboot', hidden: true, decal: true },
          { id: 'tky', x: 4, y: 2, spr: '@teke', hidden: true, solid: false, light: { r: 1.4, col: 'rgba(150,170,220,.18)' } },
          { id: 'tkf', x: 29, y: 6, spr: '@teke', hidden: true, solid: false, dir: 1, light: { r: 1.6, col: 'rgba(150,170,220,.18)' }, on: S => finale(S) },
          { id: 'gen_y', x: 23, y: 5, spr: '@gen', hidden: true, dir: 2, light: { r: 2.4, col: 'rgba(255,200,120,.18)' }, on: S => S.say('源造', '去吧。……我在这儿看着。') },
          ...[6, 7].map(y => ({ x: 0, y, spr: 'invisible', async touch(S) { S.pos(1, y, 2); await S.think(S.f.phase === 'chase' ? '那边是回学校的路——不行！\n……那边有灯！铁路边上的小屋！' : '回家的路在道口那边。'); } })),
          ...[6, 7].map(y => ({ x: 39, y, spr: 'invisible', async touch(S) { S.pos(38, y, 1); await S.think(S.f.phase === 'final' ? '……不。她还在道口那里等着。' : '家在这条路的尽头。可是她跑得比你快——'); } }))
        ],
        tick(S, dt) {
          const s = S.ent('snowfx'); if (s) { s.px = W.pl.px; s.py = W.pl.py; }
          if (S.f.ringing) { S.f._bell = (S.f._bell || 0) - dt; if (S.f._bell <= 0) { S.f._bell = .7; S.sfx('ding'); } }
        },
        step(S, x, y) { if (S.f.phase === 'final' && !S.f.fin && x >= 27) return finale(S); },
        async enter(S, first) {
          if (S.f.phase === 'chase') {
            ringOn(S); S.plr(null);
            await arrive(S, 4, 2, 2.4);
            if (S.once('ydChase')) {
              await S.narr('冷风夹着雪，一下子灌进领口。\n——当、当、当、当。\n学校后面的道口，警报响了起来。可是铁轨上，看不见火车。');
              S.goal('往有灯的地方跑——铁路边上的小屋！');
            }
            return;
          }
          if (S.f.phase === 'hut' || S.f.phase === 'final') {
            const firstFinal = S.f.phase === 'hut';
            S.f.phase = 'final'; finalSetup(S);
            if (firstFinal) {
              S.cp('final');
              await S.narr('你推开小屋的门。\n雪小了一些。道口的警报还在响，当、当、当、当。');
              await S.say('源造', '……她在那儿。');
              await S.narr('红灯一左一右地闪。\n灯光底下，铁轨中间，趴着一个小小的影子。');
              S.goal('去道口，回答她的问题');
            }
          }
        }
      },
      /* ---------------- 道口看守小屋 ---------------- */
      hut: {
        amb: 'fire', dark: .46, darkC: '#0a0604', plr: 3.4, wall: 'wood', floor: 'wood',
        rows: [
          '#########',
          '#########',
          '#wwwwwww#',
          '#wwwwwww#',
          '#wwwwwww#',
          '#wwwwwww#',
          '####w####'],
        ents: [
          { x: 2, y: 1, spr: 'swin', s: { red: true }, light: { r: 2.4, col: 'rgba(255,60,40,.12)', dy: 18 }, on: S => S.narr('窗外就是道口。红灯一闪一闪，警报当当地响。\n铁轨中间……好像有什么东西在动。') },
          { x: 4, y: 1, spr: 'poster', col: '#e8e0d0', on: S => S.narr('一本昭和三十七年的挂历，停在一月。\n十九日那一格，被红笔圈了起来。') },
          { x: 6, y: 1, spr: 'wallclock', on: S => S.narr('七点三十八分。\n「末班车是七点四十五分。」老人说，「每天都是。」') },
          { id: 'logd', x: 1, y: 2, spr: 'desk', async on(S) { if (S.once('logP')) await S.narr('桌上摊着一本发黄的工作日志。\n纸页都翻毛了，好像被人翻过几千遍。'); await S.note('log'); } },
          { x: 7, y: 2, spr: 'shelf', on: S => S.narr('架子上摆着一面卷起来的红旗、一盏老式的信号灯，和一顶褪了色的铁路制服帽。') },
          { id: 'boxb', x: 7, y: 4, spr: 'crate', on: S => S.narr(S.has('boot') || S.f.fin ? '空了的木箱。箱底垫着一块叠得整整齐齐的白布。' : '一只上了年头的木箱。') },
          { x: 3, y: 3, spr: 'kstove', light: { r: 4.4, col: 'rgba(255,140,60,.26)', flick: true }, on: S => S.narr('烧得通红的石油暖炉。\n你的手脚慢慢地，有了一点知觉。') },
          { x: 1, y: 5, spr: 'barrel', on: S => S.narr('灯油桶。桶身上用油漆写着：「国铁　白桦道口」。') },
          { id: 'gen', x: 5, y: 3, spr: '@gen', dir: 0, on: S => genTalk(S) },
          { x: 4, y: 6, spr: 'invisible', async touch(S) {
            if (!S.f.toldAll) { S.pos(4, 5, 3); return S.say('源造', '……等一下。听我把话说完。'); }
            await S.go('yard', 25, 5, 0);
          } }
        ],
        async enter(S, first) { if (first) await hutScene(S); }
      }
    }
  });
})();
