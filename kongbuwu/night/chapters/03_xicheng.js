/* ================= 第三章 · 红舞鞋：西城私立学院 + 恐怖屋走廊 + 地下停车场 =================
   宿舍走廊的椅子、艺术生活动中心四楼舞蹈室、办公楼的体育器材室、恐怖屋里的镜中怪物、停车场下面的楼梯。剧情按原著改写。 */
(() => {
  const SPR3 = {
    chairb(g, e, t, R) { const c = '#6a5040', d = shade(c, -.35);   // 椅子：st 0 背对你 / 1 侧过来 / 2 正对你
      if ((e.st || 0) === 0) { R(3, 1, 10, 9, c); R(4, 2, 8, 1, shade(c, .2)); R(3, 10, 10, 3, d); R(3, 13, 2, 3, d); R(11, 13, 2, 3, d); }
      else if (e.st === 1) { R(9, 1, 3, 10, c); R(3, 9, 9, 3, shade(c, .1)); R(3, 12, 2, 4, d); R(10, 12, 2, 4, d); }
      else { R(3, 2, 10, 4, d); R(3, 7, 10, 4, shade(c, .15)); R(3, 11, 2, 5, d); R(11, 11, 2, 5, d); if (e.sit) { R(5, -6, 6, 6, '#d8d0cc'); R(4, -7, 8, 4, '#120c0c'); R(5, 0, 6, 8, '#3a3a5a'); R(6, -3, 1, 1, '#000'); R(9, -3, 1, 1, '#000'); } } },
    chairg(g, e, t, R) { const c = '#6a5040', d = shade(c, -.35), sh = e.mv ? Math.sin(t * 30) : 0; R(3 + sh, 7, 10, 4, shade(c, .15)); R(3, 2, 10, 4, d); R(3, 11, 2, 5, d); R(11, 11, 2, 5, d);
      R(5 + sh, -6, 6, 6, '#d8d0cc'); R(4 + sh, -8, 8, 5, '#120c0c'); R(4 + sh, -3, 2, 8, '#120c0c'); R(5 + sh, 0, 6, 8, '#2a2a44'); R(6 + sh, -3, 1, 1, '#000'); R(9 + sh, -3, 1, 1, '#000'); R(6, -1, 4, 1, '#3a0a0a'); },
    chairx(g, e, t, R) { R(2, 11, 6, 2, '#5a4030'); R(9, 12, 5, 2, '#4a3020'); R(4, 8, 2, 4, '#6a5040'); R(11, 9, 3, 2, '#6a5040'); },
    bigmirror(g, e, t, R) { box(R, 0, -4, 16, 18, '#8a8a90'); R(1, -3, 14, 16, e.ghost ? '#2a1a20' : '#1c2430'); R(2, -2, 3, 14, 'rgba(255,255,255,.08)'); R(11, -1, 1, 12, 'rgba(255,255,255,.12)');
      if (e.ghost) { R(5, 1, 6, 6, '#e0d8d0'); R(4, -1, 8, 4, '#140c0c'); R(4, 3, 2, 9, '#140c0c'); R(10, 3, 2, 9, '#140c0c'); R(5, 7, 6, 6, '#8a0a0a'); R(6, 3, 1, 1, '#000'); R(9, 3, 1, 1, '#000'); }
      if (e.crack) { R(3, 0, 1, 4, '#ddd'); R(4, 3, 3, 1, '#ddd'); R(7, 4, 1, 5, '#ddd'); R(8, 8, 3, 1, '#ddd'); } },
    board(g, e, t, R) { R(1, 4, 14, 8, '#8a6a40'); R(1, 6, 14, 1, '#6a4a28'); R(2, 12, 2, 4, '#5a3a20'); R(12, 12, 2, 4, '#5a3a20'); R(3, 7, 10, 3, '#d8c8a0'); R(4, 8, 8, 1, '#8a1a1a'); },
    honor(g, e, t, R) { box(R, 1, 0, 14, 11, '#c9a35a'); R(2, 1, 12, 9, '#e8e0d0'); for (let i = 0; i < 5; i++) { R(3 + i * 2, 4, 1, 2, '#2a2020'); R(3 + i * 2, 6, 1, 3, '#d8b0c0'); } },
    tape(g, e, t, R) { R(0, 4, 16, 2, '#e8d040'); R(0, 9, 16, 2, '#e8d040'); R(3, 4, 2, 2, '#1a1a1a'); R(10, 9, 2, 2, '#1a1a1a'); },
    pillar(g, e, t, R) { box(R, 3, -10, 10, 25, '#6a6a6e'); R(3, 2, 10, 2, '#c8a020'); R(3, 6, 10, 2, '#1a1a1a'); },
    stairsdark(g, e, t, R) { for (let i = 0; i < 6; i++) R(1, 2 + i * 2, 14, 2, i < 3 ? shade('#5a5a60', -i * .15) : '#000'); },
  };
  const PEOPLE = { me: KP.chen, zp: KP.zhangpeng, police: KP.police, li: KP.police, driver: KP.oldman };
  const BASE = { people: PEOPLE, faces: KFACES, sprites: SPR3, icon: '@me' };
  const CAMPUS = [
    '########################',
    '########################',
    'xxxxxxxxxxxxxxxxxxxxxxxx',
    'xxxxxxxxxxxxxxxxxxxxxxxx',
    '"""dddddddddddddddddd"""',
    '"""d""""""""""""""""d"""',
    '"""d""""""""""""""""d"""',
    '"""d""""""""""""""""d"""',
    '"""dddddddddddddddddd"""',
    '""""""""""xxxx""""""""""',
    '""""""""""xxxx""""""""""',
    '""""""""""xxxx""""""""""',
    'ffffffffff::::ffffffffff'];
  const CORR = [
    '##################',
    '##################',
    '#nnnnnnnnnnnnnnnn#',
    '#nnnnnnnnnnnnnnnn#',
    '#nnnnnnnnnnnnnnnn#',
    '##################'];
  const DANCE = [
    '##################',
    '##################',
    '#llllllllllllllll#',
    '#llllllllllllllll#',
    '#llllllllllllllll#',
    '#llllllllllllllll#',
    '#llllllllllllllll#',
    '##################'];
  const STORE = [
    '############',
    '############',
    '#xxxxxxxxxx#',
    '#xxxxxxxxxx#',
    '#xxxxxxxxxx#',
    '#xxxxxxxxxx#',
    '############'];
  const MIRRORS = ['亮着的镜子里，照出了走廊，照出了张鹏——没照出你。', '这一面镜子里，有个东西贴在玻璃上，正跟着你走。', '镜面上起了一层白雾。雾里写着一个数字：0。', '镜子里那个东西，已经走到你前面去了。'];
  const campusEnts = (o = {}) => [
    { id: 'dorm', x: 4, y: 1, spr: 'door', solid: true, on: o.dorm || (async S => S.narr('宿舍楼。玻璃门上贴着一张泛黄的通知：本楼停用。')) },
    { id: 'office', x: 12, y: 1, spr: 'door', solid: true, on: o.office || (async S => S.narr('办公楼。门锁着。')) },
    { id: 'art', x: 20, y: 1, spr: 'door', solid: true, on: o.art || (async S => S.narr('艺术生活动中心。一栋孤零零的楼。')) },
    { id: 'gate', x: 11, y: 12, solid: false, touch: o.gate || null },
    { id: 'sl1', x: 9, y: 9, spr: 'streetlamp', light: { r: 2.2, col: 'rgba(200,220,255,.14)', flick: true } },
    { id: 'sg', x: 14, y: 10, spr: 'sign', on: async S => S.narr('“西城私立学院”。牌子掉了一半的字。') },
    { id: 'bn', x: 6, y: 9, spr: 'bench', solid: true, on: async S => S.narr('长椅上落满了树叶。有人在扶手上刻了一行小字：414 永远在一起。') },
    ...(o.extra || [])];

  /* =================== 第一次约会（宿舍走廊的椅子） =================== */
  defChapter(Object.assign({}, BASE, {
    id: 'date', n: 13, title: '第一次约会', sub: '凌晨一点四十。废弃的西城私立学院。', origin: '西城私立学院 · 第三章', color: '#3a1018',
    amb: 'wind', floor: 'concrete', wall: 'school', dark: .86, plr: 2.6, items: {}, notes: {
      task: { title: '张雅的好感度任务', text: '请在接受任务一小时之内，抵达西城私立学院。\n天亮之前，找到张雅的红色舞鞋。\n\n（注意！本任务存在一定危险性！）' } },
    start: { map: 'campus', x: 11, y: 11, dir: 3 },
    async intro(S) { await S.card('第一次约会', '西城私立学院　凌晨一点四十', '出租车司机说：这个点去那所废校？……行吧，祝你成功。\n对讲机里有人说话：“老刘，你也去西城私立学校啊？我这也拉了一个。”\n\n凌晨一点多，还有另一个人往这里来。'); },
    maps: {
      campus: { rows: CAMPUS, amb: 'wind', floor: 'grass',
        ents: campusEnts({
          dorm: async S => { S.sfx('open'); await S.go('dorm', 2, 3, 2); },
          art: async S => { if (!S.f.seen) return S.narr('先去宿舍楼看一眼。'); await S.think('在弄清楚之前，不招惹。……张雅是这所学校最恐怖的存在，我有她的情书，谁敢难为我？'); await S.end({ title: '第一次约会', text: '事到如今，你也只能这么安慰自己。\n艺术生活动中心的门，没锁。' }); } }),
        async enter(S, first) { if (first) { await S.note('task'); S.goal('先去宿舍楼看一眼'); } } },
      dorm: { rows: CORR, amb: 'room', dark: .9,
        ents: [
          { id: 'glass', x: 1, y: 2, spr: 'door', solid: true, on: async S => { if (!S.f.seen && S.f.rec) return S.narr('手机还架在玻璃门上，在录。'); await S.go('campus', 4, 2, 0); } },
          { id: 'ch', x: 9, y: 3, spr: 'chairb', solid: true, on: async S => S.narr(S.f.seen ? '它背对着你。一动没动。' : '走廊正中间，放着一把背对寝室门的椅子。\n不是这里的东西。') },
          { id: 'wire', x: 9, y: 1, spr: 'lamp', on: async S => S.narr('廊灯碎了。电线从天花板垂下来，打了一个结。\n像上吊。') },
          { id: 'tri', x: 2, y: 2, spr: 'tripod', solid: true, hidden: true, on: async S => replay(S) },
          ...[4, 7, 12, 15].map((x, i) => ({ id: 'dd' + i, x, y: 1, spr: 'door', solid: true, on: async S => S.narr(['411。门上贴着一张课程表，周三下午：舞蹈。', '412。门把手上缠着一根红绳。', '413。里面有人在小声数数：一，二，三，四……', '414。门缝里塞满了纸巾。'][i]) }))],
        async enter(S, first) { if (!first) return; await S.narr('走廊正中间，放着一把背对寝室门的椅子。\n廊灯碎了，电线垂下来。');
          await S.think('在弄清楚之前，不招惹。……先录一段。'); S.f.rec = true; S.show('tri'); S.sfx('blip');
          await S.narr('你把手机架在玻璃门上，录了一段。\n录完，回放。'); S.goal('看回放（调查手机）'); } } } }));
  async function replay(S) {
    if (S.f.seen) return S.narr('你不想再看第二遍。');
    const c = S.ent('ch'); S.plr(.2); S.dark(.96); S.toast('▶ 回放');
    await S.wait(500); c.st = 1; S.sfx('tear'); await S.scare('glitch', { sfx: 'sting' });
    await S.narr('录像里，椅子转过来了一点。');
    c.st = 0; S.plr(null); S.dark(null);
    await S.narr('你抬头去看真的那把椅子。\n它背对着你，一动没动。');
    S.plr(.2); S.dark(.96); c.st = 2; c.sit = true; S.sfx('heart');
    await S.narr('可录像还在往下播。\n录像里的椅子，又转过来了一点——现在，它正对着你的镜头。椅子上坐着一个人。');
    c.st = 0; c.sit = false; S.plr(null); S.dark(null); S.hide('tri'); S.f.seen = true;
    S.goal('去操场另一头的艺术生活动中心'); }

  /* =================== 不能被提及的名字（舞蹈室） =================== */
  defChapter(Object.assign({}, BASE, {
    id: 'dance', n: 14, title: '不能被提及的名字', sub: '凌晨两点。艺术生活动中心，四楼舞蹈室。', origin: '西城私立学院 · 第三章', color: '#4a0a14',
    amb: 'room', floor: 'lightwood', wall: 'plain', dark: .88, plr: 2.6, items: {},
    notes: {
      honor: { title: '荣誉墙', text: '天鹅湖 · 市级芭蕾舞团体赛冠军\n\n照片上是五个女孩，笑得很整齐。\n最右边那个人的肩膀上，搭着一只手。手的主人，不在照片里。' },
      locker: { title: '没写名字的柜子', text: '一条芭蕾舞裙，叠得整整齐齐。\n一盒手工包的糖。每一颗的包装纸上都写着一句话：\n\n“谢谢你帮我占位置。”\n“明天比赛加油。”\n“我们一直一起跳吧。”\n\n是打算送人的。一颗都没送出去。' },
      photo: { title: '柜子最里面的合影', text: '背面：祝贺 414 宿舍获得省级赛资格。\n\n荣誉墙上那张，是五个人。\n这一张，是六个女孩。' },
      past: { title: '镜子里的往事', text: '很多年前的一个假期，六个女孩在这里练舞。\n她带了一盒自己包的糖，想分给室友。只有一个人伸手，又被拦了回去。\n\n老师走后，进来一个男人。他把她叫进了办公室。\n另外的人都看见了。没有一个人站起来。\n\n后来，她从楼上掉了下去。\n男人站在剩下的女孩面前，一个一个地威胁。\n其中一个女孩，在笑。' } },
    start: { map: 'c2', x: 2, y: 3, dir: 2 },
    async intro(S) { await S.card('不能被提及的名字', '艺术生活动中心　凌晨两点', '楼里的灯全坏了。\n楼梯扶手上，有人用指甲刻了一排正字。'); },
    maps: {
      c2: { rows: CORR, amb: 'room', dark: .9,
        ents: [
          { id: 'out', x: 1, y: 2, spr: 'stairsdown', solid: false, touch: async S => S.narr('还没找到鞋。') },
          { id: 'c0', x: 8, y: 3, spr: 'chairb', solid: true, on: async S => { await S.narr('二楼走廊中间也有一把椅子。带靠背，不是这里的东西。'); S.sfx('paper'); await S.narr('你把它翻过来。椅子底下，写着一个女生的名字。'); } },
          { id: 'bd', x: 16, y: 2, spr: 'board', solid: true, on: async S => { await S.narr('三四楼之间立着木板：禁止入内。'); S.sfx('step'); await S.narr('你迈了过去。'); await S.go('dance', 2, 3, 2); } },
          { id: 'w1', x: 5, y: 1, spr: 'window', on: async S => S.narr('窗外是操场。操场正中间，站着一个人影，正抬头看这扇窗。') },
          { id: 'w2', x: 12, y: 1, spr: 'window', on: async S => S.narr('玻璃上有一个手印。在外面。这是二楼。') }],
        async enter(S, first) { if (first) S.goal('上四楼'); } },
      dance: { rows: DANCE, amb: 'room', floor: 'lightwood', dark: .86,
        ents: [
          ...[3, 6, 9, 12].map((x, i) => ({ id: 'mr' + i, x, y: 1, spr: 'bigmirror', on: async S => mirrorLook(S) })),
          { id: 'hn', x: 15, y: 1, spr: 'honor', on: async S => { S.f.c1 = 1; await S.note('honor'); clues(S); } },
          { id: 'lk', x: 16, y: 4, spr: 'locker', solid: true, on: async S => { if (!S.f.c2) { S.f.c2 = 1; await S.note('locker'); } else if (!S.f.c3) { S.f.c3 = 1; await S.note('photo'); } else await S.narr('柜子空了。'); clues(S); } },
          { id: 'ch1', x: 7, y: 5, spr: 'chairb', solid: true, on: async S => S.narr('第一把椅子。底下也有一个名字。') },
          { id: 'ch2', x: 9, y: 5, spr: 'chairb', solid: true, on: async S => S.narr('第二把。名字被人用刀划过。') },
          { id: 'ch3', x: 11, y: 5, spr: 'chairb', solid: true, on: async S => S.narr('第三把。底下的名字，你在荣誉墙上见过。') },
          { id: 'g1', x: 7, y: 5, spr: 'chairg', hidden: true, solid: true }, { id: 'g2', x: 9, y: 5, spr: 'chairg', hidden: true, solid: true }, { id: 'g3', x: 11, y: 5, spr: 'chairg', hidden: true, solid: true },
          { id: 'x1', x: 1, y: 1, spr: 'chairx', hidden: true }, { id: 'x2', x: 1, y: 1, spr: 'chairx', hidden: true }, { id: 'x3', x: 1, y: 1, spr: 'chairx', hidden: true },
          { id: 'zy', x: 8, y: 3, spr: 'gh_redwoman', hidden: true, light: KRED },
          { id: 'zp', x: 2, y: 3, spr: '@zp', hidden: true, solid: true },
          { id: 'door', x: 1, y: 1, spr: 'door', solid: true, on: async S => S.narr('门外是楼梯。') },
          { id: 'smash', x: 1, y: 6, hidden: true, solid: false, on: async S => smash(S) }],
        tick(S) { const s = S.ent('smash'); if (S.f.fight && !S.f.won) { s.hidden = false; S.place('smash', S.pl.x, S.pl.y); } else s.hidden = true; },
        async enter(S, first) { if (first) { await S.narr('舞蹈室。时间把这里忘了。\n六米长的落地镜，正中间摆着三把椅子，每一把下面都有一个名字。'); S.goal('看看荣誉墙、更衣室的柜子'); } } } },
    resume: { chairs: async S => { S.f.won = false; S.f.fight = true; S.f.sm = 0; for (const i of [1, 2, 3]) { S.hide('x' + i); S.show('g' + i); S.place('g' + i, 5 + i * 2, 5, 3); } goChairs(S); } } }));
  function clues(S) { if (S.f.c1 && S.f.c3 && !S.f.ready) { S.f.ready = true; S.goal('落地镜……'); } }
  async function mirrorLook(S) {
    if (!S.f.ready) return S.narr('落地镜照着整间屋子，也照着你。');
    if (S.f.named) return S.narr(S.f.won ? '镜子里，只剩你自己。' : '……');
    S.turn(3); await S.wait(400); S.turn(0); S.sfx('whisper'); await S.scare('glitch', { sfx: 'sting' });
    await S.narr('你抬起头。落地镜里的你，慢了半拍才抬头。');
    await S.think('荣誉墙上五个人，合影上六个。被剪掉的那一个……');
    const r = await S.ask('那个名字，是这里不能提的。', ['念出来：张雅', '不念']);
    if (r === 1) return S.narr('你闭上嘴。\n镜子里的你，嘴唇却还在动。它在替你念。');
    S.f.named = true; S.shake(500, 3); S.sfx('scream');
    await S.narr('你念出了那个名字。\n整个舞蹈室都变了。');
    for (const i of [1, 2, 3]) { S.hide('ch' + i); S.show('g' + i); }
    await S.narr('三把椅子，自己转了过来。\n有什么东西按着你的肩膀，要你坐下去。');
    kCpAt(S, 'chairs'); S.goal('椅子在追你：靠近的时候按调查键，砸碎它（0/3）'); S.f.fight = true; S.f.sm = 0; goChairs(S); }
  function goChairs(S) { const sp = [2.4, 2.2, 2.6]; [1, 2, 3].forEach(i => { if (!S.ent('g' + i).hidden) S.chase('g' + i, { spd: sp[i - 1], catch: async S => { await S.scare('face', { face: 'child', sfx: 'scream' }); await S.die('你被按在了椅子上。\n椅子底下那个名字，变成了你的。', '坐下了'); } }); }); }
  async function smash(S) {
    const near = [1, 2, 3].map(i => S.ent('g' + i)).filter(e => !e.hidden).sort((a, b) => (Math.abs(a.x - S.pl.x) + Math.abs(a.y - S.pl.y)) - (Math.abs(b.x - S.pl.x) + Math.abs(b.y - S.pl.y)))[0];
    if (!near || Math.abs(near.x - S.pl.x) + Math.abs(near.y - S.pl.y) > 2) return S.narr('椅子还离得远。等它过来。');
    const i = +near.id.slice(1); S.stop(near.id); S.hide(near.id); S.place('x' + i, near.x, near.y); S.show('x' + i); S.sfx('thud'); S.shake(300, 2);
    S.f.sm++; await S.narr(['你抓起椅背，砸在地上。木头裂了一条缝——上面那个“人”的哀求，一下子变成了怨毒。', '你抓起断掉的椅子腿抡过去。镜子里的画面有点奇葩，但你顾不上了。', '最后一把。碎片里，她们还抓着你的脚踝。'][S.f.sm - 1]);
    S.goal('砸碎追你的椅子（' + S.f.sm + '/3）');
    if (S.f.sm >= 3) { S.f.won = true; await zhangya(S); } }
  async function zhangya(S) {
    await S.narr('然后，温度降了下来。'); S.show('zy'); S.place('zy', S.pl.x, Math.max(2, S.pl.y - 1), 0);
    await S.narr('镜子里，你的背后多了一个低着头的女孩。\n染血的校服贴在身上，一眼看去，尽是猩红。');
    await S.scare('face', { face: 'red', sfx: 'sting' });
    await S.narr('她靠在了你的背上。黑发和你的头发，缠在了一起。');
    await S.note('past');
    S.sfx('heart'); await S.narr('黑发勒紧了。她想把你的每一部分，都塞进自己的身体里。');
    const c = await S.ask('你快喘不上气了。', ['“我会报警。让他被绳之以法。”', '“我看见了。我替你记着。”']); S.f.k_vow = c;
    await S.narr('那句话说出口之后，黑发不再往里收了。\n舞蹈室重归寂静。十几秒后——');
    S.show('zp'); S.place('zp', 2, 3, 2); await S.say('zp', '可算找到你了。这地方好啊，喊破喉咙也——');
    await S.narr('他踏进舞蹈室，脸上的表情换了，像换了一张脸。\n他身后，镜子里的那个东西也看见了你的背后。');
    await S.say('', '它们同时达成了共识：跑。', { style: 'big' });
    await S.walk('zp', [1, 3], 5); S.hide('zp'); await S.alpha('zy', 0, 300); S.hide('zy');
    await S.narr('靠在你背上的重量消失了。镜子里一道红影闪过，追了出去。');
    await S.end({ title: '不能被提及的名字', text: '你捡起手机，打给李队。只响了一声。\n“陈歌？张鹏又去找你了？”\n“在西城私立学院。我发现了另外一起命案。”' }); }

  /* =================== 红舞鞋（体育器材室） =================== */
  defChapter(Object.assign({}, BASE, {
    id: 'shoes', n: 15, title: '红舞鞋', sub: '凌晨四点。她指了指办公楼。', origin: '西城私立学院 · 第三章', color: '#5a0a0a',
    amb: 'wind', floor: 'concrete', wall: 'school', dark: .86, plr: 2.6,
    items: { shoes: { name: '红色舞鞋', desc: '被血染成了黑红色。' } },
    notes: { seal: { title: '门上的封条', text: '西城私立学院 · 体育器材室\n\n封条上的日期是四年前。\n可封条下沿的胶，是新的。' } },
    start: { map: 'campus', x: 20, y: 3, dir: 0 },
    async intro(S) { await S.card('红舞鞋', '西城私立学院　凌晨四点', '你给李队打了电话：四年前这所学校有个女孩坠楼。不是自杀，是被逼的。\n“陈歌，办案不是儿戏。……你等着。”\n\n你一转身。'); },
    maps: {
      campus: { rows: CAMPUS, amb: 'wind', floor: 'grass',
        ents: campusEnts({ office: async S => { if (!S.f.point) return S.narr('办公楼。门锁着。'); S.sfx('open'); await S.narr('门锁是坏的。一推就开。'); await S.go('off', 2, 3, 2); },
          extra: [{ id: 'zy', x: 20, y: 4, spr: 'gh_redwoman', hidden: true, light: KRED }] }),
        async enter(S, first) { if (!first) return; S.show('zy'); await S.scare('face', { face: 'red', sfx: 'sting' });
          await S.narr('张雅就站在你身后。\n她抬起手，指了指办公楼。'); await S.alpha('zy', 0, 500); S.hide('zy'); S.f.point = true;
          await S.think('……我只是觉得舞蹈室里太闷，出来透个气。'); S.goal('去办公楼'); } },
      off: { rows: CORR, amb: 'room', dark: .9,
        ents: [
          { id: 'out', x: 1, y: 2, spr: 'door', solid: true, on: async S => S.go('campus', 12, 2, 0) },
          { id: 'o1', x: 5, y: 1, spr: 'door', solid: true, on: async S => S.narr('教务处。门上的玻璃碎了，里面的柜子全被搬空了。') },
          { id: 'o2', x: 9, y: 1, spr: 'door', solid: true, on: async S => S.narr('校长办公室。门牌被人撬走了，留下四个螺丝眼。') },
          { id: 'sr', x: 15, y: 1, spr: 'door', solid: true, on: async S => { if (S.once('seal')) { await S.note('seal'); } S.sfx('tear'); await S.narr('你撕开封条。'); await S.go('store', 2, 5, 3); } },
          { id: 'tp', x: 15, y: 2, spr: 'tape', solid: false },
          { id: 'ft', x: 11, y: 3, spr: 'footprints', on: async S => S.narr('一串脚印，从门口一直走到器材室。\n只有进去的，没有出来的。') }],
        async enter(S, first) { if (first) S.goal('走廊尽头是体育器材室'); } },
      store: { rows: STORE, amb: 'room', dark: .92,
        ents: [
          { id: 'out', x: 2, y: 1, spr: 'door', solid: true, on: async S => S.narr(S.f.got ? '外面有警笛声。' : '还没找到鞋。') },
          { id: 'cb1', x: 5, y: 2, spr: 'cabinet', solid: true, on: async S => S.narr('柜子里是褪了色的体操垫，一卷一卷，像裹着什么东西。') },
          { id: 'cb2', x: 6, y: 2, spr: 'locker', solid: true, on: async S => S.narr('柜子被人挪开过，地上有两道拖痕。\n柜子后面，有一张单人床。') },
          { id: 'bed', x: 9, y: 2, spr: 'bed', solid: true, col: '#7a7a8a', on: async S => bed(S) },
          { id: 'bl', x: 3, y: 4, spr: 'box', solid: true, on: async S => S.narr('一箱旧排球。气早就漏光了，瘪得像一张张脸。') },
          { id: 'li', x: 2, y: 2, spr: '@li', hidden: true, solid: true },
          { id: 'pc', x: 3, y: 2, spr: '@police', hidden: true, solid: true }],
        async enter(S, first) { if (first) S.goal('翻一翻器材室'); } } } }));
  async function bed(S) {
    if (!S.f.warm) { S.f.warm = true; await S.narr('床单上有一个人形的凹陷。'); S.sfx('heart'); await S.narr('你伸手按了一下。\n是温的。'); return S.goal('床板下面……'); }
    if (S.f.got) return S.narr('床板下面空了。');
    S.f.got = true; S.sfx('open'); await S.narr('你掀开床板。\n下面藏着十几只尺码各不相同的芭蕾舞鞋。');
    await S.narr('其中一双，被血染成了黑红色。'); S.give('shoes');
    S.sfx('step'); await S.wait(300); S.sfx('step'); await S.narr('身后，“嗒”的一声。\n像舞鞋的鞋尖，点了一下地。'); S.turn(1); await S.wait(500);
    S.show('li'); S.show('pc'); S.sfx('open');
    await S.narr('门开了。是李队，还有一个年轻警察。液压钳剪开了校门。');
    await S.say('li', '……没有关于这些鞋的记录。体育用品管理员。查。');
    await S.end({ title: '红舞鞋', text: '手机震了一下：天亮之前成功找到张雅的红色舞鞋，好感度任务完成。' }); }

  /* =================== 恐怖屋走廊：镜中怪物 =================== */
  const HALLW = [
    '########################',
    '########################',
    '#nnnnnnnnnnnnnnnnnnnnnn#',
    '#nnnnnnnnnnnnnnnnnnnnnn#',
    '#nnnnnnnnnnnnnnnnnnnnnn#',
    '########################'];
  defChapter(Object.assign({}, BASE, {
    id: 'mirrorhall', n: 16, title: '镜中怪物', sub: '天快亮了。恐怖屋的走廊里，有人。', origin: '恐怖屋 · 第三章', color: '#1a1a2a',
    amb: 'room', floor: 'linoleum', wall: 'wood', dark: .92, plr: 2.4,
    items: { shoes: { name: '红色舞鞋', desc: '被血染成了黑红色。' } }, notes: {},
    start: { map: 'hall', x: 2, y: 3, dir: 2 },
    async intro(S) { S.give('shoes', true); await S.card('镜中怪物', '恐怖屋　凌晨五点', '回到恐怖屋，天还没亮。\n你走在漆黑的走廊上——你熟悉这里的每一个地方。\n\n所以你立刻知道，屋里有人。'); },
    maps: {
      hall: { rows: HALLW, amb: 'room',
        ents: [
          ...[5, 9, 13, 17].map((x, i) => ({ id: 'm' + i, x, y: 1, spr: 'bigmirror', on: async S => S.narr(MIRRORS[i]) })),
          { id: 'zp', x: 21, y: 3, spr: '@zp', solid: true, on: async S => S.narr('张鹏站在走廊尽头，一动不动。他的眼睛里没有你。') },
          { id: 'mg', x: 21, y: 2, spr: 'gh_mirrorghost', hidden: true, solid: true, light: KGLOW },
          { id: 'zy', x: 2, y: 2, spr: 'gh_redwoman', hidden: true, light: KRED },
          { id: 'raise', x: 1, y: 1, hidden: true, solid: false, on: async S => callZy(S) }],
        tick(S) { const r = S.ent('raise'); if (S.f.chase && !S.f.done) { r.hidden = false; S.place('raise', S.pl.x, S.pl.y); } else r.hidden = true; },
        step(S, x) { for (let i = 0; i < 4; i++) if (x >= [5, 9, 13, 17][i] - 1 && !S.f['m' + i]) { S.f['m' + i] = 1; S.ent('m' + i).ghost = true; S.sfx(i < 2 ? 'whisper' : 'glass'); if (i === 1) S.run(emerge); } },
        async enter(S, first) { if (first) { await S.narr('张鹏站在走廊尽头。\n他身后的每一面镜子里，都有东西在往外看。'); S.goal('往前走'); } } } },
    resume: { mirror: async S => { S.f.chase = true; S.show('mg'); S.place('mg', 21, 2, 1); S.chase('mg', { spd: 2.7, catch: mgCatch }); } } }));
  const mgCatch = async S => { await S.scare('face', { face: 'mirror', sfx: 'scream' }); await S.die('它抱住你的时候，你在它脸上看见了你自己。', '镜中怪物'); };
  async function emerge(S) {
    S.ent('m1').crack = true; await S.scare('glitch', { sfx: 'sting' });
    await S.narr('镜子里照不出你，只照得出它。\n墙上的数字归零了——它等的就是这一晚。');
    S.show('mg'); S.place('mg', 21, 2, 1); kCpAt(S, 'mirror'); S.f.chase = true;
    S.goal('它从镜子里出来了。口袋里那双舞鞋……（它靠近时按调查键）');
    S.chase('mg', { spd: 2.7, catch: mgCatch }); }
  async function callZy(S) {
    const g = S.ent('mg'); if (Math.abs(g.x - S.pl.x) + Math.abs(g.y - S.pl.y) > 4) return S.narr('你攥着那双舞鞋。等它再近一点。');
    S.f.done = true; S.stop('mg'); S.sfx('heart');
    await S.narr('你把那双黑红色的舞鞋，放在了脚边。\n背后很冷。但这一次，冷是站在你这边的。');
    S.show('zy'); S.place('zy', S.pl.x, S.pl.y - 1 >= 2 ? S.pl.y - 1 : S.pl.y + 1, 2); await S.scare('red', { sfx: 'scream' });
    await S.narr('张雅似乎对杀戮情有独钟。根本不用你开口，黑发就勒进了张鹏的身体，把镜子里的东西一点一点拽了出来。');
    S.sfx('glass'); S.hide('mg'); for (let i = 0; i < 4; i++) { S.ent('m' + i).ghost = false; S.ent('m' + i).crack = true; }
    await S.narr('它被吃掉了。');
    await S.narr('张鹏瘫在地上，尿了一裤子，被赶来的警察押上了车。\n你想问张雅镜子后面是什么——她化成影子，不见了。'); S.hide('zy'); S.hide('zp');
    await S.end({ title: '镜中怪物', text: '平安公寓的尾巴处理干净了。镜鬼也没了。\n你拆掉了员工通道上的木板。' }); }

  /* =================== 停车场下面的楼梯 =================== */
  const PARK = [
    '##################',
    '##################',
    'xxxxxxxxxxxxxxxxxx',
    'xxxxxxxxxxxxxxxxxx',
    'xxxxxxxxxxxxxxxxxx',
    'xxxxxxxxxxxxxxxxxx',
    'xxxxxxxxxxxxxxxxxx',
    '##################'];
  defChapter(Object.assign({}, BASE, {
    id: 'stairs', n: 17, title: '第七级台阶', sub: '扩建出来的，是一截往下的楼梯。', origin: '恐怖屋 · 第三章', color: '#141414',
    amb: 'drone', floor: 'concrete', wall: 'concrete', dark: .9, plr: 2.6, items: {}, notes: {},
    start: { map: 'park', x: 2, y: 4, dir: 2 },
    async intro(S) { await S.card('第七级台阶', '乐园 · 地下停车场　深夜', '你用碳素笔在僵尸复活夜旁边的地板上，圈出了一个范围。\n手机说：第一次扩建成功。\n\n扩建就扩建出一截楼梯？'); },
    maps: {
      park: { rows: PARK, amb: 'drone',
        ents: [
          { id: 'ex', x: 1, y: 3, spr: 'door', solid: false, touch: async S => { if (!S.f.back) return; await S.end({ title: '第七级台阶', text: '你关掉手电，退了出来。\n……不过整个地下都是我的了。' }); } },
          ...[[5, 3], [5, 6], [10, 3], [10, 6]].map(([x, y], i) => ({ id: 'pl' + i, x, y, spr: 'pillar', solid: true, on: async S => S.narr(['柱子上用红漆写着：B1-07。', '柱子底下有一圈烧过的纸灰。', '柱子上贴着一张停车票。日期是十二年前。', '这根柱子是凉的。凉得不像水泥。'][i]) })),
          { id: 'car', x: 7, y: 5, spr: 'car', solid: true, on: async S => S.narr('一辆落满灰的轿车。后座上坐着一个东西，你没细看。') },
          { id: 'st', x: 14, y: 4, spr: 'stairsdark', solid: true, on: async S => stair(S) },
          { id: 'sh', x: 14, y: 5, spr: '@me', hidden: true, alpha: .0 }],
        async enter(S, first) { if (first) S.goal('去看看那截楼梯'); } } } }));
  async function stair(S) {
    if (S.f.back) return S.narr('……');
    await S.narr('你用手电往下照。台阶一级一级往下。');
    for (let i = 1; i <= 7; i++) { S.sfx('tick'); await S.wait(260); }
    S.plr(.6); await S.narr('照到第七级，光就没了。\n不是被挡住——是被吃掉了。');
    S.sfx('step'); await S.wait(600); { const c = [[14, 3], [15, 4], [13, 4], [14, 5]].find(([x, y]) => x !== S.pl.x || y !== S.pl.y); const far = c && [[14, 3], [15, 4], [13, 4], [14, 5]].filter(([x, y]) => Math.abs(x - S.pl.x) + Math.abs(y - S.pl.y) >= 2)[0]; S.place('sh', ...(far || c), 1); } S.show('sh'); S.ent('sh').alpha = .35; S.ent('sh').spr = 'gh_shadow';
    await S.scare('face', { face: 'shadow', sfx: 'sting' });
    await S.narr('楼梯底下，有人往上走了一步。'); S.plr(null);
    S.f.back = true; S.goal('退出去。别跑，别回头'); S.norun(true);
    S.after(900, async S => S.chase('sh', { spd: 1.2, wander: false, catch: async S => { await S.die('它在你耳边说了一句话。你没听清，也不想听清。', '第七级台阶'); } })); }
})();
