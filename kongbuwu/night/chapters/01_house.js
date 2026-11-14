/* ================= 第一章 · 恐怖屋里的三个夜晚：三楼的旧箱子 / 修人偶 / 镜子游戏 =================
   恐怖屋一楼（大厅 + 僵尸复活夜）、二楼（冥婚）、三楼（堆道具的阁楼）、员工休息室和卫生间。剧情按原著改写，不照抄原文。 */
(() => {
  /* —— 共用地图（每章各自拿一份，处理函数各不相同） —— */
  const HALL_ROWS = [
    '####################',
    '####################',
    '#wwwwwww#nnnnnnnnnn#',
    '#wwwwwww#nnnnnnnnnn#',
    '#wwwwwww#nnnnnnnnnn#',
    '#wwwwwwwwnnnnnnnnnn#',
    '#wwwwwww#nnn####nnn#',
    '#wwwwwww#nnn####nnn#',
    '#wwwwwww#nnnnnnnnnn#',
    '#wwwwwww#nnnnnnnnnn#',
    '#wwwwwww#nnnnnnnnnn#',
    '####################'];
  const F2_ROWS = [
    '################',
    '################',
    '#RRRRRRRRRRRRRR#',
    '#RRRRRRRRRRRRRR#',
    '#RRRRRRRRRRRRRR#',
    '#RRRR######RRRR#',
    '#RRRR######RRRR#',
    '#RRRRRRRRRRRRRR#',
    '#RRRRRRRRRRRRRR#',
    '################'];
  const ATTIC_ROWS = [
    '##############',
    '##############',
    '#WWWWWWWWWWWW#',
    '#WWWWWWWWWWWW#',
    '#WWWWWWWWWWWW#',
    '#WWWWWWWWWWWW#',
    '#WWWWWWWWWWWW#',
    '#WWWWWWWWWWWW#',
    '##############'];
  const BATH_ROWS = [
    '############',
    '############',
    '#++++#wwwww#',
    '#++++#wwwww#',
    '#+++++wwwww#',
    '#++++#wwwww#',
    '############'];
  const L = { r: 2.2, col: 'rgba(255,190,120,.16)', flick: true };
  const ZOMB = ['它们是爸妈从旧货市场淘回来的。你给它们换过三次眼珠。', '这一只的胳膊是你十二岁那年粘上去的，胶水还看得见。', '假僵尸张着嘴。嘴里塞着一团发黄的棉花——游客扔进去的瓜子壳还在里面。'];
  const hallEnts = (o = {}) => [
    { id: 'booth', x: 2, y: 9, spr: 'booth', solid: true, on: o.booth || (async S => S.narr('售票台。抽屉里压着今天的票根：四张。\n其中两张被撕成了碎片——那两个人说“退钱”，你退了。')) },
    { id: 'fam', x: 4, y: 1, spr: 'famframe', on: o.fam || (async S => S.narr('墙上挂着一张合影。爸爸、妈妈，还有扛着塑料斧头的你。\n照片里的恐怖屋门口，排着长队。')) },
    { id: 'z1', x: 11, y: 3, spr: 'zombie', solid: true, on: async S => S.narr(ZOMB[0]) },
    { id: 'z2', x: 15, y: 4, spr: 'zombie', solid: true, on: async S => S.narr(ZOMB[1]) },
    { id: 'z3', x: 12, y: 9, spr: 'zombie', solid: true, on: async S => S.narr(ZOMB[2]) },
    { id: 'cof', x: 17, y: 9, spr: 'coffin', solid: true, on: async S => S.narr('道具棺材。盖子是你用合页改过的，从里面一推就开。\n你小时候在里面睡过午觉。') },
    { id: 'sw', x: 6, y: 1, spr: 'switch', off: true, on: o.sw || (async S => S.narr('总闸。你没开。\n电费单就压在售票台上——上个月欠的那一半还没交。')) },
    { id: 'up', x: 18, y: 2, spr: 'stairsup', solid: false, to: ['f2', 13, 2, 1] },
    { id: 'lamp', x: 1, y: 2, spr: 'candle', light: L, on: async S => S.narr('售票台旁边那根应急蜡烛，是你点的。整座楼只有这一点光。') },
    ...(o.extra || [])];
  const f2Ents = (o = {}) => [
    { id: 'down', x: 14, y: 2, spr: 'stairsdown', solid: false, to: ['hall', 17, 2, 1] },
    { id: 'up3', x: 1, y: 2, spr: 'stairsup', solid: false, to: o.up3 || ['attic', 2, 2, 2], lock: o.lock3, lockMsg: o.lockMsg3 },
    { id: 'bride', x: 7, y: 3, spr: 'bride', solid: true, on: o.bride || (async S => S.narr('冥婚场景的纸新娘。红盖头，红绣鞋。\n这是妈妈亲手糊的。她说，纸人不能画眼睛，画了就“活”了。')) },
    { id: 'cand1', x: 5, y: 3, spr: 'candles', light: { r: 1.6, col: 'rgba(255,90,60,.18)', flick: true } },
    { id: 'cand2', x: 10, y: 3, spr: 'candles', light: { r: 1.6, col: 'rgba(255,90,60,.18)', flick: true } },
    { id: 'altar', x: 8, y: 4, spr: 'altar', solid: true, on: async S => S.narr('供桌上摆着两只碗，两双筷子。碗是空的。\n你记得上个月清理的时候，碗里是满的。') },
    { id: 'cof2', x: 12, y: 8, spr: 'coffin', solid: true, on: async S => S.narr('第二口棺材。这是冥婚场景的“新郎”。\n盖子上贴着一张褪色的喜字。') },
    ...(o.extra || [])];

  /* =================== 第一夜：三楼的旧箱子 =================== */
  defChapter({
    id: 'attic', n: 1, title: '三楼的旧箱子', sub: '关门以后，一个人上三楼，翻爸妈留下的东西。', origin: '恐怖屋 · 第一章', color: '#3a2a1a',
    icon: '@me', amb: 'room', floor: 'wood', wall: 'wood', dark: .84, plr: 2.6,
    people: { me: KP.chen }, faces: KFACES,
    items: { phone: { name: '黑色手机', desc: '没有电池，没有卡。屏幕却亮过一次。' }, ragdoll: { name: '布偶', desc: '你小时候缝的第一个玩具。针脚很粗。' } },
    notes: {
      log: { title: '营业日志（爸爸的字）', text: '七月十四。客人十一位。\n小陈今天说要给僵尸换眼珠，用的是玻璃弹珠，挺像。\n\n七月十五。闭馆一天。\n有些客人不是来玩的。他们站在门口，不进来，也不走。\n我们点了蜡烛，备了白米。\n\n（后面几页被撕掉了）' },
      list: { title: '警方移交物品清单（复印件）', text: '移交人：九江市公安局西郊分局\n发现地点：郊区原康复中心（废弃）三楼\n\n1. 布偶一个（手工缝制）\n2. 手机一部（黑色，无电池，无 SIM 卡）\n\n备注：现场未发现其他个人物品。两名失踪人员下落不明。' },
      draw: { title: '小时候的图纸', text: '蜡笔画的。一座房子，门口写着“恐怖屋”，歪歪扭扭。\n房子里有很多房间，每个房间里都画了一个笑脸。\n只有最上面一间，画的是一扇门。门上涂满了红色。' } },
    start: { map: 'hall', x: 3, y: 7, dir: 3 },
    async intro(S) { await S.card('三楼的旧箱子', '九江 · 西郊新世纪乐园 · 恐怖屋　晚上十点', '最后一批游客走的时候，骂了一句“一点都不吓人”。\n今天的门票钱，刚够交一半电费。\n\n关上门，你没开灯。'); },
    maps: {
      hall: { rows: HALL_ROWS, amb: 'room',
        ents: hallEnts(),
        async enter(S, first) { if (!first) return; await S.think('再撑不下去，就真要停业转让了。\n……三楼还堆着爸妈留下的东西。有些，该收拾了。'); S.goal('上三楼，翻一翻爸妈留下的东西'); } },
      f2: { rows: F2_ROWS, wall: 'wood', amb: 'room', dark: .86,
        ents: f2Ents({ bride: async S => { const b = S.ent('bride'); if (b.st >= 1) await S.narr('盖头掀开了一角。\n下面那张纸脸上，有人画了一只眼睛。'); else await S.narr('冥婚场景的纸新娘。红盖头，红绣鞋。\n这是妈妈亲手糊的。她说，纸人不能画眼睛，画了就“活”了。'); } }),
        async enter(S, first) { if (first) await S.think('二楼是冥婚。红灯笼一个都没亮，只有两盏电子蜡烛还在闪。'); },
        step(S, x, y) { if (x <= 3 && !S.f.lift) { S.f.lift = true; S.ent('bride').st = 1; S.sfx('tear'); return S.think('身后很轻地“嚓”了一声。像纸被风掀起来。'); } } },
      attic: { rows: ATTIC_ROWS, wall: 'wood', floor: 'W', amb: 'wind', dark: .88, plr: 2.4,
        ents: [
          { id: 'down', x: 1, y: 2, spr: 'stairsdown', solid: false, to: ['f2', 2, 2, 2] },
          { id: 'cos1', x: 5, y: 2, spr: 'costume', solid: true, on: async S => S.narr(S.f.turned ? '一排旧戏服。领口空空的。\n你刚才看见的，就是它们？' : '一排挂起来的旧戏服。鬼新娘、白无常、吊死鬼……都是爸妈当年最得意的作品。') },
          { id: 'cos2', x: 9, y: 2, spr: 'costume', solid: true, on: async S => S.narr('这一排是你的。小学的时候你天天穿着它们在门口吓客人，被妈妈追着打。') },
          { id: 'mq1', x: 7, y: 4, spr: 'mannequin', solid: true, blank: true, on: async S => S.narr('一个没有脸的人偶模型。爸爸说，没有脸的最吓人——客人会自己给它想一张。') },
          { id: 'bx1', x: 3, y: 6, spr: 'box', solid: true, on: async S => { if (S.once('draw')) await S.note('draw'); else await S.narr('箱子里是你小时候的东西。蜡笔、作业本，还有一张图纸。'); } },
          { id: 'sh', x: 11, y: 3, spr: 'shelf', solid: true, on: async S => { if (S.once('log')) await S.note('log'); else await S.narr('架子上是爸爸的营业日志。后面几页被撕掉了。'); } },
          { id: 'cr', x: 10, y: 6, spr: 'crate', solid: true, on: async S => S.narr('一箱假头颅。你拆过其中一个，想看看里面是什么。是泡沫。') },
          { id: 'win', x: 7, y: 1, spr: 'window', on: async S => S.narr('窗外是乐园的摩天轮，停了很多年。\n玻璃上有你的倒影。只有你一个。') },
          { id: 'chest', x: 12, y: 7, spr: 'chest', solid: true, on: async S => {
            if (S.f.got) return S.narr('木箱已经空了。');
            const c = S.ent('chest'); c.open = true; S.sfx('open'); await S.wait(300);
            await S.narr('最里面那个木箱。\n里面只有两样东西：一个针脚粗糙的布偶，和一部黑色的手机。');
            await S.note('list'); S.give('ragdoll'); S.give('phone'); S.f.got = true;
            await S.think('布偶是我小时候缝的第一个玩具。手机……没有印象。\n爸妈为什么半夜去那所废弃的医院？没人知道。');
            S.show('doll'); S.show('bp'); await S.wait(400);
            await S.think('再撑不下去，就真要停业转让了……');
            S.sfx('phone'); S.ent('bp').lit = true; S.lights([[12 * 16 + 8, 8 * 16 + 8, 1.4, .8]]); await S.wait(500);
            await S.narr('话音刚落，那部从来没亮过的黑色手机，屏幕一闪。\n它没有电池，也没有卡。');
            await S.narr('黑色的屏幕边框里，映出了你身后——');
            await S.scare('face', { face: 'shadow', sfx: 'sting' });
            const r = await S.ask('站着一个人。', ['回头', '不回头，盯着屏幕']);
            if (r === 1) { await S.narr('屏幕里那个人抬起一只手，慢慢放到了你的肩膀上。\n你的肩膀上什么都没有。可是很沉。'); S.sfx('whisper'); await S.wait(600); }
            S.turn(3); S.f.turned = true; S.sfx('thud'); await S.narr('你猛地回头。\n是那一排旧戏服。领口空空的，下摆还在轻轻晃。');
            S.lights(null); S.ent('bp').lit = false; S.turn(0); await S.wait(500);
            S.ent('doll').st = 1; S.sfx('close');
            await S.narr('你下意识看了一眼箱子里的布偶。\n它的脸朝着你。你记得刚才拿出来的时候，它是脸朝下的。');
            S.ent('bp').lit = true; S.sfx('phone');
            const b = await S.ask('屏幕上，一行白字慢慢浮出来：\n「你是否相信，这个世界上有鬼？」', ['相信', '不相信', '……应该有吧']);
            S.f.k_believe = b; S.ent('bp').lit = false;
            await S.end({ title: '三楼的旧箱子', text: '屏幕上只剩一个图标：一扇门。\n有点眼熟——像你家恐怖屋的大门。' }); } },
          { id: 'doll', x: 12, y: 6, spr: 'ragdoll', hidden: true, on: async S => S.narr(S.ent('doll').st ? '布偶的脸朝着你。线缝的嘴，好像比刚才弯了一点。' : '布偶脸朝下趴着。') },
          { id: 'bp', x: 11, y: 7, spr: 'blackphone', hidden: true, on: async S => S.narr('黑色手机。屏幕黑着，能照出你的脸。') }],
        async enter(S, first) { if (first) { await S.narr('推开落灰的木门。三楼堆满了被淘汰的道具，大半是爸妈经营时留下的。\n你从小就在这些东西中间长大。别的孩子玩拼图的时候，你在拆人头模型。'); S.goal('找到最里面那个木箱'); } } } } });

  /* =================== 修人偶（一般难度日常任务） =================== */
  const MQ = [['hall', 4, 4, '#5a4a3a'], ['hall', 11, 6, '#3a4a5a'], ['hall', 17, 6, '#5a3a3a'], ['f2', 3, 7, '#6a1a1a'], ['f2', 12, 4, '#2a2a3a'], ['f2', 9, 8, '#4a3a2a']];
  /* 多出来的那个：每修好一个，它就换一个地方，一次比一次近 */
  const MQX = { hall: [[6, 3], [10, 8], [14, 9], [16, 3]], f2: [[2, 4], [13, 7], [6, 8], [11, 3]] };
  async function repair(S, i) {
    const e = S.ent('mq' + i); if (!e.torn) return S.narr('这一个已经补好了。');
    S.sfx('tear'); await S.wait(300); e.torn = false; S.f.n = (S.f.n || 0) + 1;
    await S.narr(['你把裂开的肩膀缝上，又往脖子的接缝处补了点血浆。', '掉了的指头粘回去了。你顺手把它的嘴角往下压了压。', '胸口破了一个洞，里面的泡沫露出来了。你塞回去，缝上。', '一只玻璃眼珠掉在地上。你找了很久，最后在它自己的口袋里找到了。', '它的假发歪了。你扶正的时候，摸到假发底下是湿的。……血浆。是血浆。', '最后一个。针脚比你平时缝得都细。'][S.f.n - 1]);
    S.goal('修好恐怖屋里所有的人偶（' + S.f.n + '/6）');
    if (S.f.n >= 3) await moveX(S);
    if (S.f.n >= 6) await finale(S); }
  async function moveX(S) {
    const m = S.map, list = MQX[m] || MQX.hall, k = Math.min(list.length - 1, (S.f.xi = (S.f.xi || 0) + 1) - 1);
    S.plr(.4); S.sfx('switch'); await S.wait(260); S.plr(null); await S.wait(120); S.plr(.4); await S.wait(200);
    if (S.ent('mqx_' + (m === 'hall' ? 'f2' : 'hall'))) S.hide('mqx_' + (m === 'hall' ? 'f2' : 'hall'));
    S.place('mqx_' + m, list[k][0], list[k][1], 0); S.plr(null);
    if (S.f.xi === 1) await S.think('手电接触不良，闪了几下。\n光再亮起来的时候，那排人偶里……好像多了一个。');
    else if (S.f.xi === 2) await S.think('又闪了一下。\n那个多出来的，换了个地方。离你近了。');
    else await S.think('手电闪了。你没敢回头数。'); }
  async function finale(S) {
    await S.wait(400); S.plr(.3); S.sfx('switch'); await S.wait(500);
    for (const [mp, , , ] of MQ) void mp;
    for (let i = 1; i <= 6; i++) { const e = S.ent('mq' + i); if (e) e.st = 2; }
    await S.narr('最后一针收线。手电灭了。\n黑暗里，你听见很多很轻的“咔”的一声——像很多颗脑袋，同时转了一下。');
    S.plr(null); S.sfx('switch'); await S.wait(300);
    for (let i = 1; i <= 6; i++) { const e = S.ent('mq' + i); if (e) e.st = 0; }
    S.hide('mqx_hall'); S.hide('mqx_f2');
    await S.narr('光回来了。人偶们都好好地站着，脸朝着它们该朝的方向。\n那个多出来的，不见了。');
    await S.think('……是我记错了。大概。');
    await S.end({ title: '修好了', text: '你退后两步看了看：比以前自己修的强。\n原来以前的维护，一直都不到位。' }); }
  const mqEnt = (i, m, x, y, col) => ({ id: 'mq' + i, x, y, spr: 'mannequin', solid: true, torn: true, col, on: async S => repair(S, i) });
  const xEnt = m => ({ id: 'mqx_' + m, x: 1, y: 1, spr: 'mannequin', solid: true, blank: true, hidden: true, col: '#1e1a1a',
    on: async S => { const n = (S.f.xs = (S.f.xs || 0) + 1); await S.narr(n === 1 ? '这一个……不在维修清单上。\n它没有脸。身上的衣服，你从来没见过。' : n === 2 ? '它身上有一股味道。不是血浆，是香烛。' : '你伸手碰了一下。是凉的。像刚从外面进来。'); } });
  defChapter({
    id: 'daily1', n: 2, title: '修人偶', sub: '一般难度：今夜凌晨之前，修补好恐怖屋里所有的人偶模型。', origin: '恐怖屋 · 日常任务', color: '#2a2a22',
    icon: '@me', amb: 'room', floor: 'wood', wall: 'wood', dark: .86, plr: 2.4,
    people: { me: KP.chen }, faces: KFACES,
    items: { bucket: { name: '人造血浆', desc: '没用完的半桶。' } },
    notes: { list: { title: '人偶维修清单', text: '一楼：大厅三个（门口、柱子旁、棺材边）\n二楼：冥婚三个（新娘左手边、供桌后、新郎棺材旁）\n\n共六个。\n——清单是你自己写的。字迹你认得。' } },
    start: { map: 'hall', x: 3, y: 8, dir: 3 },
    async intro(S) { await S.card('修人偶', '恐怖屋　晚上十一点', '为了省电，走廊灯一盏都没开。\n你提着半桶人造血浆，胳膊底下夹着手电。\n换了别人，这场面足够吓到报警。'); },
    maps: {
      hall: { rows: HALL_ROWS, amb: 'room',
        ents: hallEnts({ booth: async S => { if (S.once('list')) { S.give('bucket', true); await S.note('list'); } else await S.narr('售票台上压着你写的维修清单。六个。'); }, extra: [mqEnt(1, 'hall', ...MQ[0].slice(1)), mqEnt(2, 'hall', ...MQ[1].slice(1)), mqEnt(3, 'hall', ...MQ[2].slice(1)), xEnt('hall')] }),
        async enter(S, first) { if (first) { await S.think('先看一眼清单，再挨个补。'); S.goal('修好恐怖屋里所有的人偶（0/6）'); } } },
      f2: { rows: F2_ROWS, wall: 'wood', amb: 'room', dark: .88,
        ents: f2Ents({ lock3: () => false, lockMsg3: '三楼今晚不用去。', extra: [mqEnt(4, 'f2', ...MQ[3].slice(1)), mqEnt(5, 'f2', ...MQ[4].slice(1)), mqEnt(6, 'f2', ...MQ[5].slice(1)), xEnt('f2')] }) } } });

  /* =================== 噩梦难度：镜子游戏 =================== */
  const EV = [
    [4, async S => { S.sfx('drip'); await S.narr('水一滴一滴地落。\n窗户没关严，夜风吹在后颈上，像一双手。'); }],
    [8, async S => { S.sfx('whisper'); const r = await S.ask('耳边有人跟着你一起念。陈歌、陈歌……\n那个声音，比你慢半拍。', ['继续念', '睁眼看看是谁']); if (r === 1) return fail(S); }],
    [13, async S => { S.sfx('knock'); await S.narr('隔间的门，轻轻敲了三下。\n这间卫生间里，只有你一个人。'); }],
    [18, async S => { S.sfx('glass'); S.ent('mir').cracked = true; const r = await S.ask('镜子“咔”地响了一声。\n有人在你耳边呼吸。离得很近，节奏和你一模一样。', ['别睁眼，继续念', '睁眼']); if (r === 1) return fail(S); }],
    [23, async S => { S.ent('mir').face = 'pale'; await S.narr('你闭着眼，也知道镜子里那张脸贴到了玻璃上。\n越贴越近。'); }],
    [27, async S => { S.sfx('heart'); const r = await S.ask('一只冰凉的手指，碰了一下你的睫毛。', ['不睁眼', '……睁开']); if (r === 1) return fail(S); }]];
  async function fail(S) {
    S.clearTimer(); S.f.ritual = false; S.f.k_fail = 1; await S.fade(0, 300);
    S.ent('mir').face = 'pale'; await S.narr('你睁了一下眼。只有一下。\n镜子里的你没有闭眼。它一直在看着你。它在笑。');
    await S.scare('face', { face: 'mirror', sfx: 'scream' });
    await S.narr('一只苍白的手，从裂开的镜面里伸了出来，按住了你的肩膀。');
    S.sfx('thud'); await S.fade(1, 600);
    await S.narr('领口里的布偶动了。\n你再醒过来的时候，蜡烛已经烧完，半个小时过去了。');
    await S.fade(0, 600); S.ent('mir').face = null; S.ent('mir').blood = true;
    await S.end({ title: '你睁开了眼睛', text: '镜面上有一道裂缝。裂缝旁边，一个从里面按上去的手印。' }); }
  async function ritual(S) {
            if (!S.f.dark || !S.f.candle) return S.narr(!S.f.dark ? '镜子里的你，脸色比你想象的白。\n……先关灯。' : '还差一根蜡烛。放在你和镜子中间。');
            if (S.f.ritual) return;
            const r = await S.ask('两点四十四分。蜡烛的火苗夹在镜子和你中间，像一盏引路的灯。\n闭上眼，开始念自己的名字？', ['闭眼，开始', '再等等']); if (r) return;
            S.pos(3, 3, 3); await S.narr('你往旁边挪了半步，想把蜡烛让到正中间。\n镜子里的你，过了一会儿，才跟着挪过来。');
            await S.think('……大概是眼睛花了。\n陈歌、陈歌、陈歌……');
            S.cp('ritual'); await S.fade(.985, 900); S.goal('别睁眼，也别动'); S.toast('闭着眼：不要按方向键');
            S.f.ritual = true; S.f.rt = 0; S.f.ei = 0; S.timer(30, '闭眼', async S => success(S)); }
  async function success(S) {
    S.clearTimer(); S.f.ritual = false; await S.fade(0, 600); S.ent('mir').face = null;
    await S.narr('第三十分钟。\n你睁开眼。镜子里的你好好地站着，和你一样喘着气。');
    await S.narr('只有镜面上那道裂缝，和裂缝旁边一个从里面按上去的手印，还在。');
    await S.end({ title: '三十分钟', text: '你抱着布偶缩在窗台下面，一晚上没敢出去。\n门框边缘，多了一圈抓痕。' }); }
  defChapter({
    id: 'mirror', n: 3, title: '镜子游戏', sub: '噩梦难度：凌晨两点四十四分，关灯，点一根蜡烛，闭上眼，念自己的名字。', origin: '恐怖屋 · 日常任务', color: '#1a2230',
    icon: '@me', amb: 'room', floor: 'tile', wall: 'tile', dark: .7, plr: 2.6,
    people: { me: KP.chen }, faces: KFACES,
    items: { candle: { name: '白蜡烛', desc: '员工休息室抽屉里的。' } },
    notes: { rule: { title: '日常任务 · 噩梦', text: '你需要独自一人：凌晨两点四十四分走进浴室，关灯，面对镜子，在自己和镜子之间点一根蜡烛。\n闭上眼，心里默念自己的名字。\n\n黑暗里什么都可能发生。\n你要做的只是：不要睁眼。\n\n（不要动。它会以为你睡着了。——这一行是谁加的？）' } },
    start: { map: 'bath', x: 9, y: 3, dir: 1 },
    async intro(S) { await S.card('镜子游戏', '恐怖屋 · 员工休息室　凌晨两点四十分', '日常任务刷新了。噩梦难度那一条，一个字都没变。\n你上网搜了一下：有人玩这个游戏疯了，有人说自己被拽进了镜子。\n\n你是开鬼屋的。这种东西，正好全程录下来。'); },
    tick(S, dt) { if (!S.f.ritual || S.busy) return; if (S.moving) { S.f.ritual = false; S.run(async S => { await S.narr('你挪了一下脚。\n镜子里那个“你”，跟着挪了一下——比你快。'); await fail(S); }); return; }
      S.f.rt = (S.f.rt || 0) + dt; const ev = EV[S.f.ei || 0]; if (ev && S.f.rt >= ev[0]) { S.f.ei = (S.f.ei || 0) + 1; S.run(ev[1]); } },
    maps: {
      bath: { rows: BATH_ROWS, amb: 'room',
        ents: [
          { id: 'mir', x: 3, y: 1, spr: 'mirror', on: async S => ritual(S) },
          { id: 'cdl', x: 3, y: 2, spr: 'candle', solid: false, hidden: true, light: { r: 2, col: 'rgba(255,190,110,.22)', flick: true }, on: async S => ritual(S) },
          
          { id: 'sink', x: 2, y: 2, spr: 'sink', solid: true, on: async S => { if (!S.has('candle')) return S.narr('洗手池。水龙头没拧紧，一滴，一滴。'); if (S.f.candle) return S.narr('蜡烛在洗手池边上烧着。'); S.take('candle'); S.f.candle = true; S.show('cdl'); S.sfx('match'); await S.narr('你把蜡烛立在镜子底下，点着了。\n火苗晃了两下，往镜子那边歪。屋里没有风。'); S.goal(S.f.dark ? '面对镜子' : '关灯'); } },
          { id: 'tri', x: 1, y: 2, spr: 'tripod', solid: true, on: async S => S.narr('手机架在洗手池边，镜头同时对着你，和镜子里的你。\n红点一闪一闪。在录。') },
          { id: 'stall', x: 4, y: 3, spr: 'stall', solid: true, on: async S => S.narr('隔间的门关着。你记得你没关。') },
          { id: 'sw', x: 5, y: 3, spr: 'switch', on: async S => { if (S.f.dark) return S.narr('灯关着。'); S.f.dark = true; S.ent('sw').off = true; S.sfx('switch'); S.dark(.97); await S.narr('“啪”。\n黑暗一下子贴到了脸上。'); S.goal(S.f.candle ? '面对镜子' : '在镜子和你之间点一根蜡烛'); } },
          { id: 'drawer', x: 8, y: 2, spr: 'cabinet', solid: true, on: async S => { if (S.has('candle') || S.f.candle) return S.narr('抽屉里还有两根蜡烛。一根就够了。'); S.give('candle'); await S.narr('员工休息室的抽屉。停电的时候用的白蜡烛。'); } },
          { id: 'bed', x: 10, y: 2, spr: 'sofa', solid: true, on: async S => { if (S.once('rule')) await S.note('rule'); else await S.narr('沙发上扔着你的外套。手机刚才就放在这儿。'); } },
          { id: 'clock', x: 7, y: 1, spr: 'wallclock', on: async S => S.narr('两点四十二分。秒针走得很响。') }],
        async enter(S, first) { if (first) S.goal('两点四十四分之前：拿蜡烛、关灯、面对镜子'); } } },
    resume: { ritual: async S => { S.f.ritual = false; S.f.rt = 0; S.f.ei = 0; S.ent('mir').face = null; S.ent('mir').cracked = false; S.dark(.97); S.goal('面对镜子'); } } });
})();
