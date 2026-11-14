/* ================= 第二章 · 平安公寓（午夜逃杀试炼）+ 恐怖屋三楼的三个夜晚 =================
   平安公寓：院子、一楼、二楼（208 在老爷子隔壁）、烧过的三楼、后山树林、护林员木屋。
   恐怖屋：新解锁的「午夜逃杀」三楼（布偶的房间 / 深水 / 张鹏）。剧情按原著改写。 */
(() => {
  const SPR2 = {
    wheelchair(g, e, t, R) { R(3, 10, 10, 2, '#3a3a3a'); R(2, 6, 2, 8, '#555'); R(12, 6, 2, 8, '#555'); box(R, 4, 2, 8, 9, '#4a4a52'); R(1, 11, 4, 4, '#222'); R(11, 11, 4, 4, '#222'); if (e.sit) { R(5, -4, 6, 6, '#e0c0a0'); R(5, -5, 6, 2, '#d8d8d4'); R(4, 2, 8, 6, '#6a6a60'); } },
    brickwall(g, e, t, R) { box(R, 0, -8, 16, 23, '#6a5a50'); for (let y = -7; y < 14; y += 3) for (let x = (y % 2 ? 0 : 3); x < 16; x += 6) R(x, y, 5, 2, '#8a7464'); if (!e.open) { R(-1, -9, 18, 25, '#5a5048'); R(1, -6, 2, 20, '#4a4038'); R(13, -6, 2, 20, '#4a4038'); } else { R(4, -2, 8, 12, '#100c0a'); R(6, 4, 4, 2, '#cfc3b8'); R(5, 6, 2, 3, '#cfc3b8'); } },
    clothes(g, e, t, R) { R(1, 8, 14, 7, '#6a4a5a'); R(3, 6, 6, 4, '#8a6a4a'); R(8, 5, 6, 5, '#c8a8b0'); R(2, 12, 5, 3, '#3a3a48'); R(10, 11, 4, 3, '#5a4030'); },
    axe(g, e, t, R) { R(7, 2, 2, 12, '#6a4a2a'); R(4, 1, 6, 4, '#9aa0a8'); R(4, 1, 2, 4, '#c8ccd2'); },
    shadowdoor(g, e, t, R) { R(2, 13, 12, 2, 'rgba(0,0,0,.85)'); R(4, 12, 3, 1, 'rgba(0,0,0,.7)'); R(9, 12, 3, 1, 'rgba(0,0,0,.7)'); },
    pinkphone(g, e, t, R) { R(5, 6, 6, 9, '#e07aa0'); R(6, 7, 4, 6, e.lit ? '#d8e8f0' : '#1a1a22'); },
    tub(g, e, t, R) { box(R, 0, 2, 32, 13, '#e8e6e0'); R(2, 4, 28, 9, e.full ? '#3a5a6a' : '#d8d4cc'); if (e.full) R(4, 6, 10, 1, '#6a8a9a'); R(28, 1, 2, 3, '#aab'); },
    dolls4(g, e, t, R) { for (let i = 0; i < 4; i++) { const x = 1 + i * 4, c = ['#c8b8a0', '#b8a890', '#d8c8b0', '#a89880'][i]; R(x, 8, 3, 6, c); R(x, 5, 3, 3, shade(c, .15)); R(x + 1, 6, 1, 1, '#222'); } },
  };
  const PEOPLE = { me: KP.chen, wangqi: KP.wangqi, landlord: KP.landlord, tattoo: KP.tattoo, fat: KP.fat, woman: KP.woman, oldman: KP.oldman, police: KP.police, zp: KP.zhangpeng, xiao: KP.xiaoxiao,
    me2: Object.assign({}, KP.chen, { top: '#e8e4dc', top2: '#a01818', coat: true, hair: '#d8d0c8', hs: 'bald' }) };
  const BASE = { people: PEOPLE, faces: KFACES, sprites: SPR2, icon: '@me' };

  /* —— 平安公寓地图 —— */
  const YARD = [
    '##########""""""""',
    '##########""""""""',
    '""dddddddd""""T"""',
    '""dddddddddddd""""',
    '"""""dddddddddd"""',
    '""""""dddddddd""""',
    '""""""dd""""dd""""',
    '"T""""dd""""dd""T"',
    '""""""dd""""""""""',
    '""""""dd""""""""""',
    'ffffff::ffffffffff'];
  const F1 = [
    '##################',
    '##################',
    '#xxxxxxxxxxxxxxxx#',
    '#xxxxxxxxxxxxxxxx#',
    '#xxxxxxxxxxxxxxxx#',
    '##################'];
  const F2 = [
    '####################',
    '####################',
    '#xxxxxxxxxxxxxxxxxx#',
    '#xxxxxxxxxxxxxxxxxx#',
    '#xxxxxxxxxxxxxxxxxx#',
    '####################'];
  const ROOM = [
    '############',
    '############',
    '#wwwwwwwwww#',
    '#wwwwwwwwww#',
    '#wwwwwwwwww#',
    '#wwwwwwwwww#',
    '############'];
  const F3 = [
    '######################',
    '######################',
    '#xxxxxxxxxxxxxxxxxxxx#',
    '#xxxxxxxxxxxxxxxxxxxx#',
    '#xxxx####xxxxxx####xx#',
    '#xxxxxxxxxxxxxxxxxxxx#',
    '######################'];
  const WOODS = [
    '"TPT"TPTT"TPT"TPTTPT""',
    '"T"""P"""T""P"""T"""""',
    '""dd"""T""""dddd""PT""',
    '"Tddd""""T"ddddd"T""P"',
    '""Pddd"P"""dd"""""T"""',
    '"""ddddd"""dd""P""""T"',
    '"T""""dddd"dd"""""P"""',
    '""P""""ddddddd"T""""""',
    '"""T""""""ddd""""P"T""',
    '"P"""T""""ddd"""""""""',
    '"""""""P""ddd""T""P"""',
    '::::::::::::::::::::::'];
  const HUT = [
    '##########',
    '##########',
    '#WWWWWWWW#',
    '#WWWWWWWW#',
    '#WWWWWWWW#',
    '#WWWWWWWW#',
    '##########'];
  const DIM = { r: 1.8, col: 'rgba(255,220,160,.12)', flick: true };
  const f2Doors = (o = {}) => [
    { id: 'down', x: 1, y: 2, spr: 'stairsdown', solid: false, to: ['f1', 15, 2, 1] },
    { id: 'up', x: 18, y: 2, spr: 'stairsup', solid: false, to: o.up || ['f3', 2, 2, 2], lock: o.upLock, lockMsg: '三楼不能上去。至少现在不能。' },
    { id: 'd201', x: 3, y: 1, spr: 'door', solid: true, on: async S => S.narr('201。门缝里塞着一张寻人启事，已经被踩了几个脚印。') },
    { id: 'd203', x: 6, y: 1, spr: 'door', solid: true, open: !!o.d203, on: o.d203 || (async S => S.narr('203。没人住。门把手上落满了灰。')) },
    { id: 'd205', x: 9, y: 1, spr: 'door', solid: true, on: async S => S.narr('205。里面传来很轻的咳嗽声。……这层不是只有你一个房客吗？') },
    { id: 'd207', x: 12, y: 1, spr: 'door', solid: true, on: o.d207 || (async S => S.narr('207。老爷子的房间。电视的声音开得很大，放的全是广告。')) },
    { id: 'd208', x: 15, y: 1, spr: 'door', solid: true, on: o.d208 || (async S => S.go('r208', 6, 5, 3)) },
    { id: 'lamp2', x: 10, y: 1, spr: 'lamp', light: DIM },
    ...(o.extra || [])];
  const r208 = (o = {}) => [
    { id: 'out', x: 6, y: 1, spr: 'door', solid: true, on: o.out || (async S => S.go('f2', 15, 2, 0)) },
    { id: 'bed', x: 2, y: 2, spr: 'bed', solid: true, col: '#6a6a7a', on: o.bed || (async S => S.narr('床单是潮的。枕头上有一根长头发，不是你的。')) },
    { id: 'desk', x: 9, y: 2, spr: 'desk', solid: true, on: o.desk || (async S => S.narr('一张掉漆的书桌。抽屉里垫着五年前的报纸。')) },
    { id: 'win', x: 10, y: 1, spr: 'window', on: o.win || (async S => S.narr('窗外是院子和水房。再远一点，是黑漆漆的后山。')) },
    { id: 'wall', x: 1, y: 4, spr: 'stain', on: o.wall || (async S => S.narr('隔壁就是 207。墙很薄，能听见轮椅的轮子在地板上碾过去。')) },
    { id: 'lmp', x: 8, y: 1, spr: 'lamp', light: o.dark ? null : DIM },
    ...(o.extra || [])];

  /* =================== 平安公寓（入住） =================== */
  defChapter(Object.assign({}, BASE, {
    id: 'trial', n: 4, title: '平安公寓', sub: '午夜逃杀试炼：按时抵达任务场地，在这里住一晚。', origin: '平安公寓 · 第二章', color: '#2a3a2a',
    amb: 'wind', floor: 'concrete', wall: 'plain', dark: .62, plr: 2.6,
    items: {}, notes: {
      poster: { title: '寻人启事', text: '寻人启事\n\n照片上的女人二十五六岁，扎着马尾，笑得有点拘谨。\n“于某月某日晚在西郊一带失踪，身穿浅色外套……”\n\n联系人：王先生\n住址：平安公寓（原富安公寓）\n\n纸是新的。胶水还没干透。' },
      tv: { title: '手机上搜到的旧闻', text: '……富安公寓火灾致一家四口遇难。\n消防部门称，现场有多个起火点。\n警方表示，现场发现第五人的痕迹，正在全力追查。\n\n（评论区：那楼现在还有人住？）' } },
    start: { map: 'yard', x: 7, y: 9, dir: 3 },
    async intro(S) { await S.card('平安公寓', '西郊 · 从前叫富安公寓　晚上七点', '手机说：午夜逃杀的试炼任务，一小时内必须抵达任务场地。\n地图上的终点，是一栋三层的老公寓。\n\n院子里的草，长得比铁门还高。'); },
    maps: {
      yard: { rows: YARD, amb: 'wind', floor: 'grass',
        ents: [
          { id: 'ps', x: 5, y: 9, spr: 'poster', solid: true, on: async S => { S.f.look = (S.f.look || 0) | 1; await S.note('poster'); await S.think('联系人住址……就是这栋楼。'); } },
          { id: 'bd', x: 4, y: 1, spr: 'door', solid: true, on: async S => { if (!(S.f.look & 2)) { S.f.look |= 2; S.sfx('locked'); await S.narr('大门很破。锁倒是挺新的——最近有人换过。\n门没锁。'); } S.sfx('open'); await S.go('f1', 2, 2, 0); } },
          { id: 'sk', x: 15, y: 3, spr: 'sink', solid: true, on: async S => { S.f.look = (S.f.look || 0) | 4; S.sfx('drip'); await S.narr('水房。水龙头没拧紧，一滴，一滴。\n地上却没有积水——像是每天都有人来擦。'); } },
          { id: 'wh', x: 12, y: 2, spr: 'crate', solid: true, on: async S => S.narr('仓库门口堆着几个破木箱。箱子上的封条，写着五年前的日期。') },
          { id: 'w1', x: 2, y: 1, spr: 'window', on: async S => S.narr('一楼的窗户。窗帘拉开了一条缝，又飞快地合上了。') },
          { id: 'w2', x: 7, y: 1, spr: 'window', lit: true, on: async S => S.narr('二楼有一扇窗亮着，窗前坐着一个人影，一动不动。') }],
        async enter(S, first) { if (first) S.goal('进楼，问问能不能住一晚'); } },
      f1: { rows: F1, amb: 'room',
        ents: [
          { id: 'out', x: 2, y: 1, spr: 'door', solid: true, on: async S => S.f.met ? S.narr('房东说过：午夜以后别出门。') : S.go('yard', 4, 2, 0) },
          { id: 'd101', x: 6, y: 1, spr: 'door', solid: true, on: async S => S.narr('101。门里很安静。安静得像有人贴着门站着。') },
          { id: 'd103', x: 10, y: 1, spr: 'door', solid: true, on: async S => S.narr('103。门上贴着一张褪色的福字，倒着贴的。') },
          { id: 'up', x: 15, y: 2, spr: 'stairsup', solid: false, to: ['f2', 1, 3, 2], lock: S => S.f.paid, lockMsg: '先跟房东把房钱说清楚。' },
          { id: 'll', x: 16, y: 2, spr: '@landlord', hidden: true, solid: true, on: async S => S.say('landlord', '二楼随便挑。一楼三楼不能住。') },
          { id: 'wq', x: 13, y: 3, spr: '@wangqi', hidden: true, solid: true },
          { id: 'pp', x: 12, y: 4, spr: 'paper', hidden: true, on: async S => S.narr('一张寻人启事。照片上的女人在笑。') },
          { id: 'lmp', x: 8, y: 1, spr: 'lamp', light: DIM }],
        async enter(S, first) {
          if (!first) return;
          await S.say('me', '有人吗？住一晚多少钱？');
          S.ent('d103').open = true; S.sfx('open'); await S.wait(500); S.ent('d103').open = false; S.sfx('close');
          await S.narr('一楼一扇门开了半指宽，又关上了。');
          S.show('ll'); S.show('wq'); S.sfx('step'); await S.walk('ll', [14, 2], 2.2);
          await S.narr('楼梯上下来一个跛脚的男人，上下打量你，像要把你看穿。');
          await S.say('landlord', '住一晚？行。身份证我看下，上二楼交钱。');
          await S.narr('楼梯中间站着一个瘦削的中年人，抱着一沓寻人启事。眼珠浑浊，像没有焦点。');
          await S.say('landlord', '王琦！我说过你女朋友不在这里。再死缠烂打，别怪我不客气！');
          S.shake(300, 2); S.sfx('thud'); S.show('pp');
          await S.narr('他被一把推到墙上，启事散了一地。\n他没还手，蹲下去一张一张捡，像一具会动的空壳。');
          const c = await S.ask('有一张，正好落在你脚边。', ['帮他捡起来', '从旁边绕过去']);
          if (c === 0) { S.f.k_helpWq = 1; S.hide('pp'); S.face('wq', 'pl'); await S.say('wangqi', '……谢谢。'); await S.narr('这是他第一次开口。声音很哑。'); }
          await S.walk('wq', [2, 3], 3); S.hide('wq');
          await S.say('landlord', '五十一晚。二楼随便挑，一楼三楼不能住。午夜以后别出门。');
          const q = await S.ask('', ['三楼为什么不能住？', '……好。']);
          if (q === 0) await S.say('landlord', '你问题怎么那么多？不能住就是不能住！');
          await S.walk('ll', [15, 2], 2.2); S.hide('ll'); S.f.met = false; S.f.paid = true;
          S.goal('上二楼，住进 208'); } },
      f2: { rows: F2, amb: 'tv',
        ents: f2Doors({ upLock: () => false,
          d207: async S => { if (S.once('old')) { S.ent('d207').open = true; S.show('oldm'); S.sfx('open'); await S.narr('207 的门开着。屋里，一个老人背对着门坐在轮椅上。'); S.sfx('close'); S.ent('d207').open = false; S.hide('oldm'); S.sfx('close'); await S.narr('门“嘭”地关了。\n你的房间是 208——就在他隔壁。'); } else await S.narr('207。电视的声音开得很大。'); },
          extra: [{ id: 'oldm', x: 12, y: 2, spr: 'wheelchair', sit: true, hidden: true }] }),
        async enter(S, first) { if (first) S.goal('208 在走廊最里面'); } },
      r208: { rows: ROOM, floor: 'wood', amb: 'tv', dark: .7,
        ents: r208({ out: async S => {
          if (!S.f.noise) return S.narr('先把包放下。');
          S.sfx('open'); S.show('llx'); S.ent('out').open = true;
          await S.scare('flash', { sfx: 'sting' });
          await S.narr('你拉开门——\n房东就站在你门外。不知道站了多久。');
          await S.say('landlord', '……给你送暖瓶。');
          S.hide('llx'); S.ent('out').open = false; S.sfx('close');
          await S.think('假如他就是那个“精神病患者”，我今晚要和他做一夜邻居。');
          await S.end({ title: '入住', text: '暖瓶放在门口。你没碰。\n隔壁的电视，一整夜都在放广告。' }); },
          bed: async S => { if (S.f.noise) return S.narr('隔壁吵成这样，谁睡得着。'); S.f.noise = true; S.sfx('glass'); S.shake(200, 1);
            await S.narr('你刚坐下，隔壁传来碗摔碎的声音。\n接着是房东的咒骂，夹着几句外地方言。');
            S.amb('tv'); await S.narr('然后电视的音量被调到最大。放的全是广告。'); S.goal('出去看看'); },
          desk: async S => S.note('tv'),
          extra: [{ id: 'llx', x: 6, y: 2, spr: '@landlord', hidden: true, solid: true }] }),
        async enter(S, first) { if (first) { await S.narr('208。一张床，一张桌子，一扇对着后山的窗。\n五十块一晚，你没还价。'); S.goal('在床边坐一会儿'); } } } } }));

  /* =================== 贴寻人启事的人 =================== */
  defChapter(Object.assign({}, BASE, {
    id: 'wangqi', n: 5, title: '贴寻人启事的人', sub: '晚上八点。走廊里，有人在往空房间的门缝里塞纸。', origin: '平安公寓 · 第二章', color: '#2a2a3a',
    amb: 'tv', floor: 'concrete', wall: 'plain', dark: .7, plr: 2.6,
    items: {}, notes: {
      fuan: { title: '五年前的富安公寓', text: '王琦说的：\n\n那屋里住着一家四口。父亲、母亲、一个女儿、一个小儿子。\n那天晚上，有人敲了三下门。没有人去开，门自己开了。\n\n一夜之间，全没了。\n出了事，才改的名字：富安改成了平安。' },
      news: { title: '旧案（网上能查到的）', text: '火灾现场有多个起火点。\n四具尸体。\n现场有第五个人的痕迹——没找到人。\n\n唯一的亲属，是轮椅上那位老人。他也是火灾以后最大的受益人。' },
      ear: { title: '隔墙听见的', text: '房东骂人的时候，夹着外地方言。\n老人的公寓，为什么让一个外地人管着？\n那只碗，摔得太是时候了。' },
      sms: { title: '王琦的手机', text: '发件人：她\n时间：昨天凌晨 2:00\n\n救我\n\n往上翻，每一条都是凌晨发来的。每一条都只有这两个字。' } },
    start: { map: 'f2', x: 15, y: 2, dir: 0 },
    async intro(S) { await S.card('贴寻人启事的人', '平安公寓 · 二楼　晚上八点', '房东说午夜以后别出门。\n现在才八点。'); },
    maps: {
      f2: { rows: F2, amb: 'tv',
        ents: f2Doors({ upLock: () => false, extra: [
          { id: 'wq', x: 7, y: 2, spr: '@wangqi', solid: true, dir: 3, on: async S => {
            if (S.f.wq) return S.say('wangqi', '……');
            S.f.wq = true; S.face('wq', 'pl');
            await S.say('wangqi', KENV.flags.helpWq ? '你人不错，听我一句：别在这过夜。钱重要还是命重要？' : '……新来的？别在这过夜。');
            await S.say('wangqi', '这楼以前叫富安公寓。五年前，这层楼上住着一家四口。');
            S.sfx('knock'); await S.wait(300); S.sfx('knock'); await S.wait(300); S.sfx('knock');
            await S.note('fuan');
            await S.say('wangqi', '我未婚妻就是在这附近失踪的。每天午夜以后，我都会收到她发来的短信。只有两个字。');
            S.sfx('phone'); await S.note('sms');
            await S.say('wangqi', '一觉醒来，她的东西还会出现在我床上。……我知道你把我当疯子。');
            await S.walk('wq', [2, 3], 2.6); S.hide('wq'); S.show('tt'); S.goal('楼梯口有人在抽烟'); } },
          { id: 'tt', x: 2, y: 2, spr: '@tattoo', hidden: true, solid: true, on: async S => {
            if (S.f.tt) return S.say('tattoo', '回屋去。');
            S.f.tt = true; S.face('tt', 'pl');
            await S.say('tattoo', '新来的，离那个贴纸的远点。这世上哪有鬼？最多是有人装鬼。回屋去。');
            await S.narr('他夹烟的左手抬起来，手背上纹着一朵牡丹。');
            await S.think('两个人里，肯定有一个在撒谎。');
            S.hide('tt'); S.sfx('step'); S.goal('回 208，把今晚看到的东西过一遍'); } }] }),
        async enter(S, first) { if (first) { S.sfx('paper'); await S.narr('走廊里有窸窸窣窣的声音。\n有人正往没人住的空房间门缝里，一张一张地塞纸。'); S.goal('看看是谁'); } } },
      r208: { rows: ROOM, floor: 'wood', amb: 'tv', dark: .72,
        ents: r208({
          desk: async S => { S.f.c1 = 1; await S.note('news'); clue(S); },
          wall: async S => { S.f.c2 = 1; await S.note('ear'); clue(S); },
          win: async S => { S.f.c3 = 1; await S.narr('窗外，院子里的水房亮着一盏灯。\n这么晚了，有人在里面拖地。'); clue(S); },
          bed: async S => {
            if (!S.f.ready) return S.narr('还睡不着。脑子里乱得很。');
            S.ent('lmp').light = null; S.dark(.94); S.sfx('switch');
            await S.narr('你关了灯。');
            S.sfx('tear'); await S.wait(500); S.sfx('step'); await S.wait(400); S.sfx('step');
            await S.narr('楼上传来拖东西的声音。一下，一下，从走廊这头拖到那头。\n三楼不让住人。');
            const g = await S.ask('你觉得，谁最可疑？', ['房东。他鸠占鹊巢，挟持了老人', '王琦。他的故事太完整了', '现在下结论太早']);
            S.f.k_guess = g;
            await S.end({ title: '贴寻人启事的人', text: ['方言、电视、门外偷听。', '短信、失踪、热情得过分。', '需要证据。'][g] + '\n拖东西的声音，一直到两点才停。' }); } }),
        async enter(S, first) { if (first) S.goal('查一查：桌上的电脑、薄薄的墙、窗外'); } } } }));
  function clue(S) { const n = (S.f.c1 || 0) + (S.f.c2 || 0) + (S.f.c3 || 0); if (n >= 2 && !S.f.ready) { S.f.ready = true; S.goal('关灯，躺下'); } }

  /* =================== 凶宅直播 =================== */
  defChapter(Object.assign({}, BASE, {
    id: 'live', n: 6, title: '凶宅直播', sub: '晚上十点。直播开着，房间里只有你一个人。', origin: '平安公寓 · 第二章', color: '#3a2a2a',
    amb: 'room', floor: 'wood', wall: 'plain', dark: .7, plr: 2.6,
    items: { hammer: { name: '工具锤', desc: '从恐怖屋带来的。' }, knife: { name: '水果刀', desc: '口袋里的。抽了几次，顺手了。' } },
    notes: { dm: { title: '弹幕', text: '有没有吊大的知道这直播间播什么？\n喂妖妖灵吗，我发现一个野生的精神病\n好好的墙皮被刮坏了，心疼公寓老板一秒\n现实版狼人杀啊，有请预言家发言\n我怀疑真凶是轮椅上的老人' } },
    start: { map: 'r208', x: 6, y: 4, dir: 3 },
    async intro(S) { await S.card('凶宅直播', '208　晚上十点', '标题：夜宿凶宅！亲身探秘！为你掀开这世界不为人知的一幕！\n\n在线人数：四十。'); S.give('hammer', true); },
    maps: {
      r208: { rows: ROOM, floor: 'wood', amb: 'room', dark: .74,
        ents: r208({
          wall: async S => { if (S.f.w) return S.narr('熏黑的砖。这面墙烧过。'); S.f.w = 1; S.sfx('cut'); await S.narr('你用工具锤刮掉一层墙皮。\n下面露出来的砖，是熏黑的。'); await S.note('dm'); await S.think('……你们的关注点能不能别那么刁钻。'); await next(S); },
          desk: async S => { if (S.f.k) return S.narr('桌上的手机还在直播。'); S.f.k = 1; S.give('knife'); await S.narr('你把水果刀放进口袋，练了几次抽刀。'); await next(S); },
          out: async S => {
            if (!S.f.gone) return S.narr(S.f.sh ? '门缝下面……' : '还不到出门的时候。');
            S.sfx('paper'); await S.narr('出门之前，你从头上拔了一根头发，轻轻塞进锁眼里。\n回来的时候，它要是不在了——');
            await S.end({ title: '凶宅直播', text: '在线人数：一千二。\n有人在弹幕里问：主播，你回去还敢睡吗？' }); },
          extra: [{ id: 'sh', x: 6, y: 2, spr: 'shadowdoor', hidden: true, on: async S => S.narr('门缝下面，那道影子……') }] }),
        async enter(S, first) { if (first) S.goal('直播开着：刮开墙皮、把刀揣好'); } } } }));
  async function next(S) {
    if (!(S.f.w && S.f.k) || S.f.sh) return; S.f.sh = true;
    await S.wait(500); S.plr(.3); S.sfx('tv'); S.show('sh'); await S.wait(300); S.plr(null);
    await S.say('弹幕', ['主播你身后！！！', '门缝下面！', '我截图了你们看'], { style: 'big' });
    await S.narr('弹幕突然刷成一片。\n直播画面里，你身后那扇门的门缝下面，有一道影子，停住了。');
    const r = await S.ask('', ['回头', '不回头，盯着手机屏幕']);
    if (r === 1) { await S.narr('屏幕里，那道影子一点一点变长。像有人蹲了下来——\n从门缝底下往里看。'); S.sfx('heart'); await S.wait(500); }
    S.turn(3); S.hide('sh'); S.sfx('step'); await S.wait(300); S.sfx('step');
    await S.narr('你回头。门缝下面什么都没有。\n走廊里的脚步声，往楼上去了。');
    S.f.gone = true; S.goal('出门前，留个记号'); }

  /* =================== 三楼 =================== */
  const PILE = ['一把烧变形的椅子底下，压着一个布偶。', '一卷发霉的地毯里，裹着第二个。', '一个破纸箱，里面只有第三个布偶，坐得端端正正。', '最后一个在墙角。它的脸朝着墙。'];
  const CARD = ['发霉的棉絮里有一张卡片，字里行间全是爱意。', '也是一张卡片。同样的话，同样的笔迹。', '第三张卡片。写卡片的人很用心，一笔一画。'];
  defChapter(Object.assign({}, BASE, {
    id: 'f3', n: 7, title: '三楼', sub: '凌晨一点。三楼不让住人。', origin: '平安公寓 · 第二章', color: '#2a2020',
    amb: 'wind', floor: 'concrete', wall: 'plain', dark: .9, plr: 2.4,
    items: { dolls: { name: '四个布偶', desc: '同一个厂家，五年前的款。' } },
    notes: { scraps: { title: '第四个布偶', text: '没有卡片。\n棉絮里塞满了撕碎的纸条。\n\n每一张上，只有三个字：\n\n去死吧！\n\n（弹幕：这字迹和卡片不是一个人的）' } },
    start: { map: 'r208', x: 6, y: 3, dir: 3 },
    async intro(S) { await S.card('三楼', '平安公寓　凌晨一点', '拖东西的声音停了。\n你等了半个小时，楼里一点动静都没有。'); },
    maps: {
      r208: { rows: ROOM, floor: 'wood', amb: 'room', dark: .9, ents: r208({ dark: true }), async enter(S, first) { if (first) S.goal('上三楼'); } },
      f2: { rows: F2, amb: 'none', dark: .9, ents: f2Doors({ d207: async S => S.narr('207 里没有电视的声音了。'), d208: async S => S.go('r208', 6, 5, 3) }) },
      f1: { rows: F1, amb: 'none', dark: .92,
        ents: [
          { id: 'out', x: 2, y: 1, spr: 'door', solid: true, on: async S => { if (!S.f.done) return S.narr('大门锁着。'); S.sfx('locked'); await S.narr('防盗门从里面锁死了。钥匙在房东身上。'); await S.end({ title: '三楼', text: '你给鹤山发了两个字：报警。\n然后蹲在黑暗里，听着楼梯上的脚步声，一下一下，往二楼来。' }); } },
          { id: 'up', x: 15, y: 2, spr: 'stairsup', solid: false, to: ['f2', 1, 3, 2] }] },
      f3: { rows: F3, amb: 'wind', dark: .92, plr: 2.2,
        ents: [
          { id: 'down', x: 1, y: 2, spr: 'stairsdown', solid: false, to: ['f2', 17, 2, 1] },
          ...[[6, 2], [11, 5], [15, 2], [19, 5]].map(([x, y], i) => ({ id: 'p' + i, x, y, spr: ['crate', 'sack', 'box', 'box'][i], solid: true, on: async S => pile(S, i) })),
          { id: 'hd', x: 9, y: 1, spr: 'door', solid: true, open: true, on: async S => hide(S) },
          { id: 'bw', x: 20, y: 1, spr: 'brickwall', solid: true, on: async S => S.narr(S.f.seen ? '墙里那个人，还在里面。' : '走廊尽头堆着杂物，后面挂着一块布帘。\n布帘后面的墙，颜色比别处新。') },
          { id: 'll', x: 2, y: 3, spr: '@landlord', hidden: true, solid: true },
          { id: 'tt', x: 2, y: 2, spr: '@tattoo', hidden: true, solid: true },
          { id: 'wm', x: 3, y: 3, spr: '@woman', hidden: true, solid: true },
          { id: 'ft', x: 3, y: 2, spr: '@fat', hidden: true, solid: true },
          { id: 'snd', x: 1, y: 1, spr: 'lamp', light: null },
          { id: 'st1', x: 13, y: 3, spr: 'stain' }, { id: 'st2', x: 4, y: 5, spr: 'footprints' }],
        async enter(S, first) { if (first) { await S.narr('三楼没翻修过。到处是烧过的痕迹。\n杂物和垃圾堆到没地方下脚。'); S.goal('翻翻这些垃圾'); } } } },
    resume: { hide: async S => { S.hidePlayer(false); ['ll', 'tt', 'wm', 'ft'].forEach(k => { S.stop(k); S.hide(k); }); S.ent('snd').light = null; S.f.alarm = false; S.after(400, alarm); } } }));
  async function pile(S, i) {
    if (S.f['p' + i]) return S.narr('翻过了。');
    S.f['p' + i] = 1; S.f.n = (S.f.n || 0) + 1; S.sfx('paper'); await S.narr(PILE[i]);
    if (S.f.n < 4) await S.narr(CARD[S.f.n - 1]); else { await S.note('scraps'); S.give('dolls'); await S.narr('四个布偶，出自同一个厂家，五年前的款。\n房子、家具都烧没了，它们是怎么躲过去的？'); }
    S.goal('翻翻这些垃圾（' + S.f.n + '/4）');
    if (S.f.n >= 4) { kCpAt(S, 'hide'); await alarm(S); } }
  async function alarm(S) {
    S.f.alarm = true; S.ent('snd').light = { r: 3, col: 'rgba(255,240,200,.35)' }; S.sfx('switch'); S.shake(200, 1);
    await S.narr('楼梯拐角的声控灯，突然亮了。\n有好几个人的脚步声，正往三楼来。');
    S.goal('躲起来！（左边那间开着门的屋子）'); S.timer(7, '躲', async S => { if (!S.pl.hidden) await seen(S); }); }
  async function hide(S) {
    if (!S.f.alarm) return S.narr('一间空屋。门半开着，门后有一块能藏人的地方。');
    S.clearTimer(); S.hidePlayer(true); S.ent('hd').open = false; S.sfx('close'); S.plr(0);
    await S.narr('你躲进门后，屏住呼吸，从门缝往外看。');
    S.show('ll'); S.show('tt'); S.place('ll', 2, 3, 2); S.place('tt', 2, 2, 2); S.focus(12, 3); S.sfx('step');
    await Promise.all([S.walk('ll', [14, 3], 3), S.walk('tt', [14, 2], 3)]);
    S.place('wm', 17, 3, 1); S.place('ft', 19, 2, 1); S.show('wm'); S.show('ft'); S.ent('wm').alpha = 0; S.ent('ft').alpha = 0; await Promise.all([S.alpha('wm', 1, 500), S.alpha('ft', 1, 500)]);
    await S.say('landlord', '必须赶紧把那东西弄出去。最近来的外人越来越多。');
    await S.say('tattoo', '叫上其他人，今夜就给它挖出来，埋到后山去。');
    await S.say('woman', '这事大家人人有份，谁也跑不了。干活吧。');
    await S.narr('矮胖的那个抓着铁钎，手在抖。\n他掀开走廊尽头杂物堆后面的布帘——墙是新砌的。');
    S.face('ft', 2); S.sfx('cut'); await S.wait(400); S.sfx('cut'); S.ent('bw').open = true; S.focus(20, 2);
    await S.scare('glitch', { sfx: 'sting' });
    await S.narr('墙里，是一个人。');
    S.f.seen = true; S.ent('snd').light = null;
    await S.narr('房东和纹身男抬着麻袋下了楼，说是去“后山老地方”。\n另外两个，也跟着走了。');
    for (const k of ['ll', 'tt', 'wm', 'ft']) S.hide(k);
    S.focus(null); S.plr(null); S.hidePlayer(false); S.ent('hd').open = true;
    await S.narr('脚步声远了。');
    S.f.done = true; S.goal('下楼，离开这栋楼'); }
  async function seen(S) {
    S.f.k_seen = 1; S.f.alarm = false; S.ent('snd').light = null;
    S.sfx('paper'); await S.narr('你往后退的时候，踩到了一个布偶。');
    S.show('tt'); S.place('tt', 2, 2, 2); await S.say('tattoo', '谁？！');
    S.goal('跑！从楼梯下去'); S.f.done = true;
    S.chase('tt', { spd: 2.9, catch: kCaught('axe', '一只左手从背后捂住了你的嘴。\n手背上，纹着一朵牡丹。', '被纹身男抓住了') }); }

  /* =================== 午夜逃杀 =================== */
  defChapter(Object.assign({}, BASE, {
    id: 'escape', n: 8, title: '午夜逃杀', sub: '凌晨两点。回 208，从窗户下去。', origin: '平安公寓 · 第二章', color: '#3a1a1a',
    amb: 'none', floor: 'concrete', wall: 'plain', dark: .9, plr: 2.4, items: {}, notes: {},
    start: { map: 'f1', x: 3, y: 2, dir: 2 },
    async intro(S) { await S.card('午夜逃杀', '平安公寓　凌晨两点', '大门锁死了。\n只能回 208，把床单捆在窗框上，从二楼下去。'); },
    maps: {
      f1: { rows: F1, amb: 'none', dark: .92,
        ents: [{ id: 'out', x: 2, y: 1, spr: 'door', solid: true, on: async S => { S.sfx('locked'); await S.narr('锁死了。'); } },
          { id: 'up', x: 15, y: 2, spr: 'stairsup', solid: false, to: ['f2', 1, 3, 2] }],
        async enter(S, first) { if (first) S.goal('上二楼，回 208'); } },
      f2: { rows: F2, amb: 'none', dark: .9,
        ents: f2Doors({ upLock: () => false,
          d208: async S => {
            if (S.f.door) return S.narr('门板那一边……');
            S.f.door = true; S.focus(15, 2);
            await S.narr('你摸出钥匙，借着屏幕的微光对准锁孔——');
            S.sfx('heart'); await S.scare('flash', { sfx: 'sting' });
            await S.narr('锁眼里那根头发，被顶进去了。\n有人进过你的房间。或者说，现在就在里面。');
            S.sfx('whisper'); await S.narr('门板那一边，有人也屏住了呼吸。');
            S.focus(null); S.norun(true); S.goal('一点声音都别出：退到走廊另一头'); },
          d203: async S => { if (!S.f.chase) return S.narr('203。门没锁，虚掩着。'); S.sfx('open'); await S.go('r203', 6, 5, 3); },
          extra: [{ id: 'll', x: 15, y: 2, spr: '@landlord', hidden: true, solid: true }, { id: 'tt', x: 14, y: 2, spr: '@tattoo', hidden: true, solid: true }] }),
        step(S, x, y) { if (S.f.door && !S.f.chase && x <= 7) S.run(burst); } },
      r203: { rows: ROOM, floor: 'wood', amb: 'none', dark: .9,
        ents: [
          { id: 'out', x: 6, y: 1, spr: 'door', solid: true, on: async S => S.narr('外面有人在找你。') },
          { id: 'win', x: 3, y: 1, spr: 'window', on: async S => {
            S.sfx('glass'); await S.narr('你撞开窗户，踩着一楼的防盗网往下跳。');
            S.sfx('thud'); S.shake(300, 2); await S.go('yard', 10, 4, 0);
            await S.narr('一把菜刀擦着你的肩膀飞过去，钉在地上。');
            S.show('ft'); S.show('wm'); S.place('ft', 4, 2, 0); S.place('wm', 5, 2, 0);
            await S.narr('胖子和那个女人举着修灌木的铁剪，从楼门口冲出来。');
            kCpAt(S, 'yard'); S.goal('翻出铁门，往后山跑！');
            S.chase('ft', { spd: 2.7, catch: kCaught('axe', '铁剪合上的声音，比你想的还要轻。', '被追上了') }); S.chase('wm', { spd: 2.6, catch: kCaught('axe', '她抓住了你的后领。“跑什么？”', '被追上了') }); } },
          { id: 'bd', x: 2, y: 3, spr: 'bed', solid: true, col: '#5a5a6a', on: async S => S.narr('203 的床上，铺着一张发黄的塑料布。') }] },
      yard: { rows: YARD, amb: 'wind', floor: 'grass', dark: .82,
        ents: [{ id: 'bd', x: 4, y: 1, spr: 'door', solid: true, on: async S => S.narr('回去？') },
          { id: 'kf', x: 7, y: 4, spr: 'knife' },
          { id: 'ft', x: 4, y: 2, spr: '@fat', hidden: true, solid: true }, { id: 'wm', x: 5, y: 2, spr: '@woman', hidden: true, solid: true },
          { id: 'gate', x: 6, y: 10, spr: 'sparkle', solid: false, touch: async S => leaveYard(S) }, { id: 'gate2', x: 7, y: 10, solid: false, touch: async S => leaveYard(S) }] },
      woods: { rows: WOODS, amb: 'night', floor: 'grass', dark: .9, plr: 2.2,
        ents: [
          { id: 'wq', x: 15, y: 6, spr: '@wangqi', hidden: true, solid: true, light: { r: 2.6, col: 'rgba(255,240,200,.28)' } },
          { id: 'bush', x: 10, y: 6, spr: 'plant', solid: false },
          { id: 'hut', x: 13, y: 1, spr: 'door', solid: true, on: async S => { S.sfx('open'); await S.narr('一间木屋，像护林员住的。门没锁。'); await S.end({ title: '午夜逃杀', text: '衣服被树杈挂烂了。直播黑屏了一个多小时，满屏都在刷问号。\n你推开了木屋的门。' }); } },
          { id: 'sign', x: 4, y: 9, spr: 'sign', on: async S => S.narr('护林防火，人人有责。牌子被刀砍过。') }],
        step(S, x, y) { if (y <= 7 && !S.f.wq) { S.f.wq = true; S.run(lamp); } },
        async enter(S, first) { if (first) { await S.narr('跑了十五分钟，身后的手电光才消失。'); S.goal('往山上走'); } } } },
    resume: {
      corridor: async S => { S.f.chase = true; S.norun(false); S.show('ll'); S.show('tt'); S.place('ll', 15, 2, 1); S.place('tt', 14, 2, 1); goChase(S); },
      yard: async S => { S.show('ft'); S.show('wm'); S.place('ft', 4, 2, 0); S.place('wm', 5, 2, 0); S.chase('ft', { spd: 2.7, catch: kCaught('axe', '铁剪合上的声音，比你想的还要轻。', '被追上了') }); S.chase('wm', { spd: 2.6, catch: kCaught('axe', '她抓住了你的后领。', '被追上了') }); } } }));
  async function burst(S) {
    S.f.chase = true; S.norun(false); S.sfx('open'); S.ent('d208').open = true; S.show('ll'); S.show('tt');
    await S.scare('red', { sfx: 'scream' });
    await S.narr('208 的门被推开。\n房东和纹身男提着钢钎和菜刀冲了出来。');
    kCpAt(S, 'corridor'); S.goal('203 的门虚掩着——进去，跳窗！'); goChase(S); }
  function goChase(S) { S.chase('tt', { spd: 3.0, catch: kCaught('axe', '菜刀落下来的时候，你听见他在笑。', '被追上了') }); S.chase('ll', { spd: 2.6, catch: kCaught('axe', '钢钎捅进了墙里，离你的脸只有一指。下一下，没有偏。', '被追上了') }); }
  async function leaveYard(S) { if (!S.ent('ft') || S.ent('ft').hidden) return; S.stop('ft'); S.stop('wm'); S.hide('ft'); S.hide('wm'); await S.go('woods', 3, 11, 3); }
  async function lamp(S) {
    S.show('wq'); S.sfx('step'); await S.narr('有一束很浅的光扫过来。');
    const r = await S.ask('', ['趴进灌木里，别动', '握紧工具锤']);
    if (r === 1) await S.narr('你握紧了锤柄。光停在你身前两步远的地方，又移开了。');
    else await S.narr('你趴进灌木。光从你背上扫过去，停了一下。');
    await S.say('wangqi', '……是我看错了？不可能啊。');
    S.face('wq', 1); await S.wait(300); S.face('wq', 2); await S.wait(300);
    await S.walk('wq', [20, 4], 2.4); S.hide('wq');
    await S.narr('他拿着手电在原地转了几圈，走了。'); S.goal('前面有一间木屋'); }

  /* =================== 真凶（木屋） =================== */
  defChapter(Object.assign({}, BASE, {
    id: 'hut', n: 9, title: '真凶', sub: '凌晨三点。后山护林员的木屋。', origin: '平安公寓 · 第二章', color: '#2a1a1a',
    amb: 'night', floor: 'darkwood', wall: 'wood', dark: .88, plr: 2.4,
    items: { pinkphone: { name: '桃红色的手机', desc: '发件箱里，每一条都是“救我”。' } },
    notes: {
      cl: { title: '床底下的衣服', text: '大部分是女人的衣服，从来没洗过。\n有一件上面的泥还没干透——像这一两天还有人穿过。\n\n尺码，和墙里那个人对得上。' },
      love: { title: '皱巴巴的纸条', text: '我爱你\n我爱你\n我爱你\n\n和五年前布偶里的卡片，是一样的话。一样的笔迹。' },
      out: { title: '发件箱', text: '凌晨 2:00　救我\n凌晨 2:00　救我\n凌晨 2:00　救我\n……\n\n收件人：王琦。\n用死者的手机，每天夜里给自己发短信。然后一觉醒来，什么都不记得。' } },
    start: { map: 'hut', x: 4, y: 5, dir: 3 },
    async intro(S) { await S.card('真凶', '后山 · 木屋　凌晨三点', '一股怪味。\n生活用品堆得像垃圾场。'); },
    maps: {
      hut: { rows: HUT, amb: 'night', floor: 'darkwood',
        ents: [
          { id: 'door', x: 4, y: 1, spr: 'door', solid: true, on: async S => { if (!S.f.chase) return S.narr('门外是黑漆漆的林子。'); if (!S.f.froze) return S.narr('他堵在门口。'); S.sfx('open'); await S.go('woods', 13, 4, 0); } },
          { id: 'bed', x: 1, y: 2, spr: 'bed', solid: true, col: '#5a4a3a', on: async S => { if (S.once('cl')) { await S.note('cl'); clue2(S); } else S.narr('床底下塞满了衣服。'); } },
          { id: 'cl', x: 7, y: 4, spr: 'clothes', solid: true, on: async S => { if (S.once('love')) { await S.note('love'); clue2(S); } else S.narr('那堆衣服的口袋，你都翻过了。'); } },
          { id: 'tb', x: 7, y: 2, spr: 'table', solid: true, on: async S => S.narr('桌上有半碗泡面，还温着。') },
          { id: 'st', x: 2, y: 5, spr: 'stove', solid: true, on: async S => S.narr('炉子里的灰，是新的。烧的是纸。') },
          { id: 'ph', x: 6, y: 5, spr: 'pinkphone', hidden: true, on: async S => phone(S) },
          { id: 'xiao', x: 3, y: 3, spr: '@xiao', hidden: true, alpha: .7 },
          { id: 'wq', x: 4, y: 2, spr: '@wangqi', hidden: true, solid: true, on: async S => showPhone(S) },
          { id: 'ax', x: 5, y: 2, spr: 'axe', hidden: true },
          { id: 'raise', x: 1, y: 1, hidden: true, solid: false, on: async S => { const z = S.ent('wq'); if (Math.abs(z.x - S.pl.x) + Math.abs(z.y - S.pl.y) <= 4) await showPhone(S); else await S.narr('你攥紧了那部手机。等他再近一点。'); } }],
        tick(S) { const r = S.ent('raise'); if (S.f.chase && !S.f.froze) { r.hidden = false; S.place('raise', S.pl.x, S.pl.y); } else r.hidden = true; },
        async enter(S, first) { if (first) S.goal('翻一翻这间屋子'); } },
      woods: { rows: WOODS, amb: 'night', floor: 'grass', dark: .9, plr: 2.2,
        ents: [
          { id: 'hut', x: 13, y: 1, spr: 'door', solid: true, on: async S => S.narr('不能回去。') },
          { id: 'wq2', x: 13, y: 2, spr: '@wangqi', hidden: true, solid: true },
          { id: 'car', x: 9, y: 11, spr: 'car', solid: false, light: { r: 3.2, col: 'rgba(80,120,255,.28)', flick: true }, touch: async S => road(S) },
          { id: 'car2', x: 11, y: 11, solid: false, touch: async S => road(S) }, { id: 'car3', x: 12, y: 11, solid: false, touch: async S => road(S) }],
        async enter(S, first) { if (first) { S.goal('一直往山下跑，跑到有路的地方'); S.show('wq2'); S.place('wq2', 13, 2, 0); S.after(700, async S => { S.chase('wq2', { spd: 2.9, catch: axeCatch }); await S.narr('身后，门被撞开了。'); }); } } } },
    resume: { axe: async S => { S.f.froze = false; S.f.chase = true; S.show('wq'); S.place('wq', 4, 2, 0); S.show('ax'); S.chase('wq', { spd: 2.7, catch: axeCatch }); } } }));
  const axeCatch = async S => { await S.scare('face', { face: 'axe', sfx: 'scream' }); await S.die('斧头砍在门框上的声音，你只听见了一半。', '真凶'); };
  function clue2(S) { if (S.f._o_cl && S.f._o_love && !S.f.ph) { S.f.ph = true; S.show('ph'); S.sfx('thud'); S.toast('衣服里掉出来一样东西'); S.goal('衣服里掉出来一部手机'); } }
  async function phone(S) {
    if (S.f.got) return; S.f.got = true; S.hide('ph'); S.give('pinkphone');
    await S.narr('一部桃红色外壳的手机。屏幕停在编辑短信的页面。'); await S.note('out');
    await S.think('贴寻人启事的那个人，找的是被他自己砌进墙里的人。');
    S.ent('ph').lit = false; S.show('xiao'); S.sfx('whisper');
    await S.narr('手机屏幕暗下去。\n黑色的屏幕上，映出你身后站着一个小女孩，七八岁。');
    await S.scare('face', { face: 'child', sfx: 'sting' });
    await S.narr('她抬起手，指了指你的背后。'); S.hide('xiao');
    S.show('wq'); S.show('ax'); S.sfx('open'); S.turn(3);
    await S.narr('你转身。王琦提着一把斧头，堵在门口。');
    await S.say('wangqi', '毕竟……是我亲手把她砌进墙里的。我不想这样的。你知道吗？我也不想这样的。');
    if (KENV.flags.guess === 1) await S.think('猜对了。但我宁愿是猜错了。');
    S.f.chase = true; kCpAt(S, 'axe'); S.goal('他堵着门。等他走近，把手机举到他眼前（按调查键）');
    S.chase('wq', { spd: 2.7, catch: axeCatch });
    S.after(2500, async S => { if (!S.f.froze) { S.show('xiao'); await S.narr('屋角那个小女孩又出现了。\n她指了指你手里的手机，又指了指他。'); S.hide('xiao'); } }); }
  async function showPhone(S) {
    if (!S.f.chase || S.f.froze) return;
    S.stop('wq'); S.f.froze = true; S.ent('ph').lit = true;
    await S.narr('你把那部桃红色的手机举到他眼前。\n屏幕亮着：凌晨两点，救我。');
    await S.say('wangqi', '……她发的。她又发了。她在哪儿？她在哪儿……');
    await S.narr('斧头垂了下去。他盯着屏幕，嘴唇一直在动。\n门口空出来了。');
    S.place('wq', 6, 3, 0); S.goal('跑！出门'); }
  async function road(S) {
    if (S.f.end) return; S.f.end = true; S.stop('wq2'); S.hide('wq2');
    await S.narr('一刻没停，一直跑到看见水泥路。\n警灯。');
    await S.say('me', '是我报的警！我抓住了五年前灭门案的凶手！');
    await S.end({ title: '真凶', text: '王琦当场落网。\n他被押上警车的时候，还在问：她在哪儿？' }); }

  /* =================== 恐怖屋 · 午夜逃杀三楼 =================== */
  const WS = [
    '######################',
    '######################',
    '#xxxxx#xxxxxxxx#+++++#',
    '#xxxxx#xxxxxxxx#+++++#',
    '#xx#xxxxx###xxxx+++++#',
    '#xx#xxxxx###xxx#+++++#',
    '#xx######xxxxxx#######',
    '#xxxxxxxxxxx##xxxxxxx#',
    '#xxxxxxxxxxx##xxxxxxx#',
    '######################'];
  const wsEnts = (o = {}) => [
    { id: 'gate', x: 2, y: 1, spr: 'door', solid: true, on: o.gate || (async S => S.narr('员工通道。') ) },
    { id: 'innr', x: 20, y: 6, spr: 'door', solid: true, on: o.innr || (async S => S.narr('三楼最里面的房间。门关着。')) },
    { id: 'mir', x: 18, y: 1, spr: 'mirror', on: o.mir || (async S => S.narr('浴室的镜子。镜面上有一道新的裂痕。')) },
    { id: 'tub', x: 17, y: 3, spr: 'tub', solid: true, w: 2, full: !!o.full, on: o.tub || (async S => S.narr('浴缸。白瓷，冰凉。')) },
    { id: 'b1', x: 9, y: 2, spr: 'crate', solid: true }, { id: 'b2', x: 4, y: 8, spr: 'sack', solid: true },
    { id: 'k1', x: 13, y: 2, spr: 'stain' }, { id: 'k2', x: 8, y: 7, spr: 'handprint' }, { id: 'k3', x: 18, y: 8, spr: 'footprints' },
    { id: 'lm', x: 11, y: 1, spr: 'lamp', light: { r: 1.6, col: 'rgba(255,60,40,.14)', flick: true } },
    ...(o.extra || [])];

  /* —— 布偶的房间（午夜逃杀开张那天晚上） —— */
  defChapter(Object.assign({}, BASE, {
    id: 'dolls', n: 10, title: '亡者的执念', sub: '学生们走了。三楼最里面那间屋子，门关着。', origin: '恐怖屋 · 午夜逃杀', color: '#2a1a2a',
    amb: 'room', floor: 'concrete', wall: 'plain', dark: .88, plr: 2.4, items: {}, notes: {},
    start: { map: 'ws', x: 2, y: 2, dir: 0 },
    async intro(S) { await S.card('亡者的执念', '恐怖屋 · 午夜逃杀　傍晚', '鹤山问：里面那个小孩是谁演的？就是一直跟在猴子后面那个。\n\n你的员工，只有徐婉一个。'); },
    maps: {
      ws: { rows: WS, amb: 'room',
        ents: wsEnts({ innr: async S => {
          S.sfx('open'); S.ent('innr').open = true; S.show('d4'); S.focus(20, 7);
          await S.narr('房间正中央，并排坐着四个布偶——你从平安公寓带回来的那四个。\n你记得，你把它们锁在了二楼的柜子里。');
          S.sfx('phone'); await S.narr('手机震了一下。\n「亡者的执念尚未放下。完成它们的心愿，它们方才能为你所用。」');
          const c = await S.ask('它们想要什么？', ['把王琦的寻人启事贴在这个房间里', '把寻人启事烧掉']);
          S.f.k_notice = c;
          if (c === 0) await S.narr('你把那张纸贴在墙上。照片下面，你用红笔写了四个字：已经归案。\n最小的那个布偶，往你这边歪了一下。');
          else { S.sfx('match'); await S.narr('纸烧成灰的时候，四个布偶一动不动。\n过了很久，最小的那个，往你这边歪了一下。'); }
          S.show('xiao'); S.place('xiao', S.pl.x - 1, S.pl.y, 2); await S.wait(500);
          await S.narr('一个小小的影子拽了拽你的衣角。'); S.hide('xiao');
          await S.narr('你低头，什么都没有。'); await S.say('me', '小家伙，别乱跑，小心被人踩到。');
          await S.end({ title: '亡者的执念', text: '第二天早上，三楼的垃圾被人收拾得干干净净。\n午夜逃杀的样子，一点都没变。' }); },
          extra: [{ id: 'd4', x: 19, y: 7, spr: 'dolls4', hidden: true }, { id: 'xiao', x: 1, y: 1, spr: '@xiao', hidden: true, alpha: .65 },
            { id: 'ft', x: 6, y: 5, spr: 'footprints', on: async S => S.narr('一串很小的脚印。光着脚的，往最里面去了。') }] }),
        async enter(S, first) { if (first) S.goal('去三楼最里面那间屋子'); } } } }));

  /* —— 深水 —— */
  const DOORS = [
    '##############################',
    '##############################',
    '#oooooooooooooooooooooooooooo#',
    '#oooooooooooooooooooooooooooo#',
    '##############################'];
  defChapter(Object.assign({}, BASE, {
    id: 'water', n: 11, title: '深水', sub: '噩梦难度：把浴缸放满，整个人沉进去，屏住呼吸六十秒。', origin: '恐怖屋 · 日常任务', color: '#1a2a3a',
    amb: 'room', floor: 'concrete', wall: 'plain', dark: .9, plr: 2.4,
    items: { ragdoll: { name: '布偶', desc: '爸妈留下的。' } },
    notes: { task: { title: '日常任务 · 噩梦', text: '深夜的浴室总会发出奇怪的声音，想知道原因的话，就按照我说的去做吧。\n\n这个游戏叫做“深水”：把浴缸放满，整个人沉进去，屏住呼吸六十秒。\n它可以跨越生死，让你见到亡故之人。' }, wall: { title: '墙上的数字', text: '从镜子游戏那晚开始，就有什么东西跟着你。\n你用笔在墙上记过一个数字。\n它每晚都在变小。' } },
    start: { map: 'ws', x: 2, y: 2, dir: 0 },
    async intro(S) { await S.card('深水', '恐怖屋 · 午夜逃杀　凌晨一点十分', '你被一种声音弄醒了。\n三楼。有人在切东西。一下，一下。'); S.give('ragdoll', true); },
    maps: {
      ws: { rows: WS, amb: 'room',
        ents: wsEnts({
          mir: async S => { if (S.f.m) return S.narr('镜子里的你，这一次跟着你转过头了。慢了一点。'); S.f.m = true; S.sfx('glass');
            await S.narr('午夜逃杀的浴室里，那面镜子上有一道新的裂痕。'); S.turn(1); await S.wait(300);
            await S.scare('glitch', { sfx: 'sting' }); await S.narr('你转头。\n镜子里的你，没有跟着转过来。'); await S.note('wall'); await S.note('task'); S.goal('把布偶挂在门后，把四个小布偶摆在浴缸四周，放水'); },
          tub: async S => {
            if (!S.f.m) return S.narr('浴缸。白瓷，冰凉。');
            if (!S.f.doll) return S.narr('先把爸妈留下的布偶挂在门后。');
            if (!S.f.small) { S.f.small = true; S.sfx('paper'); return S.narr('四个小布偶，一边一个，摆在浴缸四周。脸都朝着水面。'); }
            if (!S.ent('tub').full) { S.ent('tub').full = true; S.sfx('water'); await S.narr('你把水龙头拧到最大。\n水放满的时候，镜子里的你，正低头看着浴缸。'); return S.goal('沉进去'); }
            const r = await S.ask('一分钟。熬过这一分钟。' + (KENV.flags.mirrorFail ? '\n镜子游戏那晚，你睁过一次眼。它记得你的脸。' : ''), ['沉下去', '再等等']); if (r) return;
            S.sfx('splash'); await S.fade(1, 700); kCpAt(S, 'dive'); await dive(S); },
          gate: async S => { if (S.f.doll) return S.narr('布偶挂在门后，正对着浴室。'); if (!S.f.m) return S.narr('员工通道。'); S.f.doll = true; S.take('ragdoll'); await S.narr('你把门反锁，把父母留下的布偶挂在门后。'); } }),
        async enter(S, first) { if (first) S.goal('去浴室看看'); } },
      doors: { rows: DOORS, amb: 'river', floor: 'shallow', wall: 'plain', dark: .8, plr: 2.6,
        ents: [
          ...[4, 8, 12, 16, 20, 24].map((x, i) => ({ id: 'dr' + i, x, y: 1, spr: 'door', solid: true, on: async S => S.narr(['门上没有门牌。门把手是湿的。', '门里有人在哭。你一靠近，哭声就停了。', '这扇门，和你家恐怖屋的大门一模一样。', '门缝里漏出一点光。是红色的。', '门上挂着一个布偶。针脚很粗。', '门里有人在敲门。从里面。'][i]) })),
          { id: 'last', x: 28, y: 1, spr: 'door', solid: true, open: true, on: async S => lastDoor(S) },
          { id: 'mg', x: 2, y: 3, spr: 'gh_mirrorghost', hidden: true, solid: true, light: KGLOW }],
        step(S, x, y) { if (x <= 1 && S.f.dive && !S.f.out) S.run(async S => surface(S, 1)); else if (x >= 6 && S.f.mgArm) { S.f.mgArm = false; S.run(mgSpawn); } } } },
    resume: { dive: async S => { S.f.mgArm = false; S.ent('tub').full = true; S.f.doll = S.f.small = S.f.m = true; await dive(S); } } }));
  async function dive(S) {
    S.f.dive = true; S.f.out = false; await S.go('doors', 2, 2, 2, { fade: false }); S.norun(true); S.speed(.75); await S.fade(0, 900);
    await S.narr('水很冷。耳朵里只剩下自己的心跳。\n第三十秒，你在水底睁开了眼。');
    await S.narr('浴缸底不是白瓷。是一条很长的走廊，两边全是门。\n最远的那一扇，开着一条缝。');
    S.goal('走到最远的那扇门（别回头，往回走就是浮上去）'); S.sfx('heart');
    S.timer(KENV.flags.mirrorFail ? 22 : 28, null, async S => { if (!S.f.out) await surface(S, 2); });
    S.f.mgArm = true; }
  async function mgSpawn(S) { S.show('mg'); S.place('mg', 1, 2, 2); S.chase('mg', { spd: KENV.flags.mirrorFail ? 3.0 : 2.6, catch: async S => { await S.scare('face', { face: 'mirror', sfx: 'scream' }); await S.die('镜子里的那个“你”，从后面抱住了你。\n它比水还冷。', '深水'); } }); await S.narr('身后的水，动了一下。'); }
  async function lastDoor(S) {
    if (S.f.out) return; S.f.out = true; S.clearTimer(); S.stop('mg'); S.hide('mg');
    await S.narr('你把眼睛贴到门缝上。\n门里是一间空屋子。你最想见的人，没有出现。');
    await S.think('……这至少说明一件事：爸妈没有死。');
    S.sfx('heart'); await S.narr('第五十秒，一只手按住了你的后脑。\n是它逼着你，多撑了那几秒。');
    await S.fade(1, 600); S.norun(false); S.speed(1);
    await S.end({ title: '深水', text: '你在水中闭气六十二秒。\n爬出浴缸的时候，四个小布偶全都倒向镜子那一边。' }); }
  async function surface(S, why) {
    if (S.f.out) return; S.f.out = true; S.clearTimer(); S.stop('mg'); S.hide('mg'); S.f.k_fail = 1;
    await S.fade(1, 400); S.norun(false); S.speed(1);
    await S.narr(why === 1 ? '你往回走了一步——\n整个人从水里弹了起来，呛得说不出话。' : '肺像要炸开。你憋不住了。');
    await S.narr('你翻出浴缸的时候，镜子碎了一地。\n布偶挡在你和镜子中间。');
    await S.end({ title: '深水（勉强完成）', text: '门后那条走廊，你只走了一半。' }); }

  /* —— 有人要杀我（张鹏） —— */
  const ZROUTE = [[3, 7], [10, 7], [10, 3], [14, 3], [14, 8], [19, 8], [14, 7], [5, 5], [3, 3]];
  defChapter(Object.assign({}, BASE, {
    id: 'zhangpeng', n: 12, title: '有人要杀我', sub: '凌晨一点。张鹏撬开了员工通道的木板，进了午夜逃杀。', origin: '恐怖屋 · 第二章', color: '#2a1414',
    amb: 'room', floor: 'concrete', wall: 'plain', dark: .92, plr: 2.2,
    items: {}, notes: { rule: { title: '你的地盘', text: '你穿着碎颅医生的制服，戴着人皮面具，提着锤子。\n鬼屋里地形复杂，又没开灯。\n\n从他背后靠近，吓他。\n别让他看见你的正脸——他手里有刀。' } },
    start: { map: 'ws', x: 2, y: 2, dir: 0 },
    async intro(S) { S.wear('@me2'); await S.card('有人要杀我', '恐怖屋 · 午夜逃杀　凌晨一点', '监控里，一个人翻过了护栏。\n他举着刀冲进员工休息室——床上是一个人偶。\n\n然后，他进了午夜逃杀。'); },
    tick(S, dt) { if (!S.f.go || S.busy || S.f.done) return; kPatrol('zp', ZROUTE, S.f.slow ? 2.0 : 2.4); },
    maps: {
      ws: { rows: WS, amb: 'room',
        ents: wsEnts({ extra: [
          { id: 'zp', x: 3, y: 7, spr: '@zp', solid: true, light: { r: 2.4, col: 'rgba(255,240,200,.22)' }, on: async S => scareZ(S) },
          { id: 'd4', x: 3, y: 4, spr: 'dolls4', hidden: true },
          { id: 'mg', x: 18, y: 2, spr: 'gh_mirrorghost', hidden: true, light: KGLOW }] }),
        async enter(S, first) { if (!first) return; await S.note('rule');
          if (KENV.flags.notice === 0) { S.f.slow = true; S.show('d4'); await S.narr('走廊尽头，四个布偶并排坐在楼道口——那张写着“已经归案”的寻人启事，还贴在它们头顶。'); }
          S.goal('从背后吓他（0/3）'); kCpAt(S, 'hunt'); S.f.go = true; } } },
    resume: { hunt: async S => { S.f.go = true; S.f.n = 0; S.stop('zp'); S.place('zp', 3, 7, 2); S.ent('zp')._pr = 0; S.goal('从背后吓他（0/3）'); } } }));
  async function scareZ(S) {
    if (S.f.done) return; const z = S.ent('zp'), p = S.pl, d = DIRS[z.dir], toP = [Math.sign(p.x - z.x), Math.sign(p.y - z.y)];
    const facing = !window.__kBehind && ((d[0] && d[0] === toP[0]) || (d[1] && d[1] === toP[1]));   // __kBehind：测试用，视作从背后
    if (facing) {
      S.stop('zp'); await S.narr('他转过身。手电光正好打在你的面具上。');
      await S.say('zp', '装神弄鬼！');
      S.chase('zp', { spd: 2.8, catch: async S => { await S.scare('face', { face: 'axe', sfx: 'scream' }); await S.die('刀子捅进来的时候，面具挡了一下。只挡了一下。', '被张鹏发现了'); } });
      S.goal('被他看见了！先躲开，等他找不到你');
      S.after(5000, async S => { if (S.ent('zp').chase) { S.stop('zp'); await S.narr('他追了几步，拐进黑暗里，找不到来时的路了。'); S.goal('从背后吓他（' + (S.f.n || 0) + '/3）'); } });
      return; }
    S.stop('zp'); S.f.n = (S.f.n || 0) + 1; S.sfx('thud'); S.shake(300, 2);
    await S.narr(['锤子砸在他身边的墙上。\n“不好意思，砸歪了。我本来是准备砸碎你肩胛骨的。”', '你从他背后的黑暗里伸出一只手，拍了拍他的肩膀。\n他尖叫了一声，刀掉在了地上，又捡起来。', '你贴着他的后颈，用很轻的声音说：\n“我是一个没有感情的杀手。”'][S.f.n - 1]);
    await S.say('zp', ['谁？！出来！', '求求你……放我走吧！', '啊啊啊——'][S.f.n - 1]);
    { const z = S.ent('zp'), k = ((z._pr || 0) + 3) % ZROUTE.length; S.place('zp', ...ZROUTE[k]); z._pr = (k + 1) % ZROUTE.length; }
    S.goal('从背后吓他（' + S.f.n + '/3）');
    if (S.f.n >= 3) await finaleZ(S); }
  async function finaleZ(S) {
    S.f.done = true; S.stop('zp'); S.place('zp', 16, 4, 2);
    await S.narr('他像没头苍蝇一样乱撞，一头扎进了浴室。');
    S.sfx('cut'); await S.wait(300); S.sfx('cut'); await S.narr('那种切东西的声音，又响了。');
    S.show('mg'); S.focus(17, 3); await S.scare('face', { face: 'mirror', sfx: 'scream' });
    await S.narr('一道黑影从镜子里窜出来，把张鹏拖了进去。'); S.hide('zp'); S.hide('mg'); S.sfx('glass');
    await S.narr('你砸掉门锁——里面只剩一地碎镜子，和开着的窗。'); S.focus(null);
    await S.end({ title: '有人要杀我', text: '“小陈！你没受伤吧！床单上这血——”\n“不是我的。”\n\n他带着镜子里的那个东西，一起跑了。墙上的数字，又小了一个。' }); }
})();
