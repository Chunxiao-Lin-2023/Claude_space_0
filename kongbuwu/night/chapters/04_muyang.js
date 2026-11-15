/* ================= 第四章 · 暮阳中学（雨夜四条支线）+ 看不见的客人 + 门楠的梦 + 三个人的房间 + 二十四个人偶 =================
   剧情按原著改写；人物一律用通用像素小人和通用怪物原型。 */
(() => {
  const SPR4 = {
    redshadow(g, e, t, R) { const a = .75 + Math.sin(t * 6) * .1, c = `rgba(150,12,18,${a})`; R(5, -2, 6, 6, c); R(4, 4, 8, 9, c); R(3, 6, 2, 7, c); R(11, 6, 2, 7, c); R(5, 13, 2, 3, c); R(9, 13, 2, 3, c); R(6, 0, 1, 1, '#ffd0d0'); R(9, 0, 1, 1, '#ffd0d0'); },
    eyewall(g, e, t, R) { for (let i = 0; i < 9; i++) { const x = 1 + (i % 3) * 5, y = -8 + ((i / 3) | 0) * 6; R(x, y, 4, 2, '#e8e0d0'); R(x + 1, y, 2, 2, i === 4 ? '#8a0a0a' : '#1a1a1a'); } },
    peephole(g, e, t, R) { R(7, -2, 2, 2, '#000'); if (e.eye) { R(6, -3, 4, 4, '#e8d8d0'); R(7, -2, 2, 2, '#8a0a0a'); } },
    rice(g, e, t, R) { for (let i = 0; i < 14; i++) R((i * 5) % 14 + 1, 10 + (i * 3) % 5, 1, 1, '#ece8dc'); },
    slippers(g, e, t, R) { const o = e.turn ? 1 : 0; R(3, 9 + o, 4, 6 - o, '#7a7a80'); R(9, 9 - o, 4, 6 + o, '#7a7a80'); R(3, 9 + o, 4, 1, '#5a5a60'); R(9, 9 - o, 4, 1, '#5a5a60'); },
    hole(g, e, t, R) { R(5, 8, 6, 4, '#050505'); R(5, 8, 6, 1, '#2a2a2a'); },
    students(g, e, t, R) { const f = !!e.face; for (let i = 0; i < 3; i++) { const x = 1 + i * 5; R(x, 2, 4, 4, f ? '#c8c4c0' : '#141414'); R(x, 1, 4, 2, '#141414'); R(x, 6, 4, 6, '#3a4a6a'); if (f) { R(x + 1, 3, 1, 1, '#000'); R(x + 2, 3, 1, 1, '#000'); } } R(0, 11, 16, 3, '#6a5040'); },
    rainfx(g, e, t, R) { },
    workbench(g, e, t, R) { box(R, 0, 3, 16, 10, '#6a4a30'); R(2, 4, 4, 3, '#d8d0c0'); R(9, 5, 5, 2, '#8a2a2a'); R(7, 2, 1, 4, '#bbb'); },
    dollrow(g, e, t, R) { const n = e.n || 0; for (let i = 0; i < Math.min(5, n); i++) { const x = 1 + i * 3; R(x, 8, 2, 5, '#3e4e6e'); R(x, 6, 2, 2, '#d8c8b0'); } },
  };
  const PEOPLE = { hm: { skin: '#e0c0a0', hair: '#1a1614', hs: 'messy', top: '#4a4a52', bottom: '#2a2a30' }, me: KP.chen, aunt: KP.aunt, li: KP.police, police: KP.police, mn: KP.mennan || KP.student, ruoyu: Object.assign({}, KP.xiaoxiao, { top: '#e8d8a0' }), uncle: KP.oldman, youth: KP.student };
  const BASE = { people: PEOPLE, faces: KFACES, sprites: SPR4, icon: '@me' };
  const SCH = [
    '############################',
    '############################',
    'xxxxxxxxxxxxxxxxxxxxxxxxxxxx',
    'xxxxxxxxxxxxxxxxxxxxxxxxxxxx',
    '"""""""""dddddddd"""""""""""',
    '"""""""""d""""""d"""""""""""',
    '"""""""""d""""""d"""""""""""',
    '"""""""""dddddddd"""""""""""',
    '""""""""""""dd""""""""""""""',
    '""""""""""""dd""""""""""""""',
    'ffffffffffff::ffffffffffffff'];
  const HALL = w => ['#'.repeat(w), '#'.repeat(w), '#' + 'n'.repeat(w - 2) + '#', '#' + 'n'.repeat(w - 2) + '#', '#' + 'n'.repeat(w - 2) + '#', '#'.repeat(w)];
  const ROOMR = (w, h, c) => ['#'.repeat(w), '#'.repeat(w), ...Array(h).fill('#' + c.repeat(w - 2) + '#'), '#'.repeat(w)];
  const school = (o = {}) => [
    { id: 'dormD', x: 4, y: 1, spr: 'door', solid: true, on: o.dorm || (async S => S.narr('宿舍楼。两层。')) },
    { id: 'teach', x: 13, y: 1, spr: 'door', solid: true, on: o.teach || (async S => S.narr('教学楼。')) },
    { id: 'offD', x: 22, y: 1, spr: 'door', solid: true, on: o.off || (async S => S.narr('办公楼。')) },
    { id: 'gate', x: 12, y: 10, solid: false, touch: o.gate || null }, { id: 'gate2', x: 13, y: 10, solid: false, touch: o.gate || null },
    { id: 'win', x: 17, y: 1, spr: 'window', lit: true, on: async S => S.narr('所有的窗都是黑的——只有这一扇亮着。\n你多看了它一眼。灯灭了。') },
    { id: 'sg', x: 7, y: 8, spr: 'sign', on: async S => S.narr('倒在地上的标牌，字被雨泡得发白：危楼，禁止入内。') },
    ...(o.extra || [])];

  /* ======== 暮阳中学六夜：慢热重写（RULES 37）========
     写法：平静（只埋一个小违和）→ 积累（声音一下一下靠近、回头发现东西变了、虚惊、停顿、旁人的反应）→ 无法否认（一两次大的）。
     声音跟着地方换：荒地是暴雨，楼里是闷着的雨，厕所是水管，关上门是几乎无声；S.dread(0–3) 是一层跟着剧情涨的低频垫音。
     目标提示写得模糊，不带计数；弹幕前面稀稀拉拉，后面才刷屏；「灵」按钮紧张度到 2 之前用不了。 */
  const SLOW = { slow: true };
  const DM_LIVE = d => ({ live: true, dmq: d });
  /* =================== 雨夜入校 =================== */
  const ROAD = (() => { const W = 34, H = 14, cx = [16, 16, 15, 14, 13, 12, 12, 12, 13, 14, 15, 16, 17, 17], rows = [];
    for (let y = 0; y < H; y++) { let s = ''; for (let x = 0; x < W; x++) { const on = x === cx[y] || x === cx[y] + 1 || (y >= 10 && x === cx[y] - 1); let ch = '"'; if (y === 0) ch = (x === 16 || x === 17) ? ':' : 'f'; else if (on) ch = 'd'; else if ((x * 7 + y * 13) % 11 === 0) ch = 'T'; else if ((x * 5 + y * 3) % 17 === 0) ch = 'P'; s += ch; } rows.push(s); }
    const house = (x0, y0, w, h) => { for (let y = y0; y < y0 + h; y++) rows[y] = rows[y].slice(0, x0) + '#'.repeat(w) + rows[y].slice(x0 + w); }; house(3, 9, 6, 3); house(24, 8, 7, 3); return rows; })();
  defChapter(Object.assign({}, BASE, SLOW, {
    id: 'muyang', n: 18, title: '雨夜入校', sub: '晚上七点多。荒地尽头，是废弃的暮阳中学。', origin: '暮阳中学 · 第四章', color: '#1a2a3a',
    amb: 'storm', floor: 'grass', wall: 'concrete', dark: .86, plr: 2.6, items: {}, notes: {
      task: { title: '暮阳中学试炼任务', text: '四条支线：\n送不走的笔仙——宿舍楼。\n厕所的第五个隔间——教学楼。\n封闭的教室——教学楼最里面。\n深井——（没有写地点）\n\n要求：存活至天亮。' },
      scrap: { title: '门缝里的纸', text: '一张发黄的纸，叠了四折。\n上面用手指蘸着泥写了一行字：\n\n暮阳中学，往前。\n别回头。\n\n泥还是软的。' } },
    start: { map: 'road', x: 17, y: 13, dir: 3 },
    async intro(S) { await S.card('雨夜入校', '暮阳中学　晚上七点多', '第一辆出租车听到地名就拒载了。\n第二辆把你放在荒地边上。你下了车，回头看见司机把你坐过的凉垫从车窗扔了出来，掉头就走。\n\n凉垫落在泥里，很快被雨泡透。'); },
    maps: {
      road: { rows: ROAD, amb: 'storm', floor: 'grass', dark: .84, storm: [10, 20], sounds: [['rainhit', 7, 15]],
        ents: [
          { id: 'h1', x: 5, y: 11, spr: 'door', solid: true, on: async S => { S.sfx('locked'); await S.narr('门上缠着生锈的铁链。锁头比你的拳头还大。'); } },
          { id: 'hw', x: 7, y: 11, spr: 'window', on: async S => { await S.narr('窗玻璃早碎了。屋里堆着烂家具和垃圾。'); await S.wait(500); await S.narr('有什么东西在垃圾里爬了过去。很多条腿。'); } },
          { id: 'h2', x: 26, y: 10, spr: 'door', solid: true, on: async S => { if (S.f.scrap) return S.narr('门缝里什么都没有了。'); S.f.scrap = 1; S.sfx('paper'); await S.narr('门缝里塞着一张纸。'); await S.note('scrap'); S.dread(1); await S.think('……附近住着人？\n可是这几栋房子，连一扇亮着的窗都没有。'); } },
          { id: 'h3', x: 28, y: 10, spr: 'window', on: async S => S.narr('窗户从里面糊了报纸。报纸上的日期，是三年前。') },
          { id: 'sg', x: 11, y: 6, spr: 'sign', on: async S => { await S.narr('几块被推倒的标牌。你把其中一块扶起来，用手电照：字被雨泡得发白，看不清了。'); await S.wait(400); await S.narr('标牌只有一面长了青苔。另一面……是干净的。'); await S.think('埋在土里的那面不长青苔，露在外面的那面长。\n除非——它最近被人翻过来过。'); } },
          { id: 'fn2', x: 15, y: 1, spr: 'sign', on: async S => S.narr('木头围栏有一段被人掰开过，断口还是新的。') },
          { id: 'fence', x: 16, y: 0, solid: false, touch: async S => { if (!S.f.lace) return S.narr('……'); await S.go('yard', 12, 9, 3); } },
          { id: 'fence2', x: 17, y: 0, solid: false, touch: async S => { if (!S.f.lace) return S.narr('……'); await S.go('yard', 13, 9, 3); } },
          { id: 'sh', x: 12, y: 9, spr: 'gh_shadow', hidden: true, alpha: .5 }],
        step(S, x, y) { const f = S.f;
          if (y <= 11 && S.once('r1')) S.run(async S => { await S.narr('土路往荒地深处延伸。雨大得听不见自己的脚步声。'); });
          if (y <= 8 && S.once('r2')) S.run(async S => { S.dark(.88); await S.narr('路越走越窄。两边的树歪歪扭扭，有几棵长到了路中间。'); await S.think('暮阳中学以前是火葬场。火葬场总得有条能走车的路。\n这条路……越走越窄。'); });
          if (y <= 5 && !f.lace) { f.lace = true; S.run(lace); }
          if (y <= 3 && f.lace && S.once('r4')) S.run(async S => { S.dark(.9); await S.narr('土路到头了。灌木后面，露出一排歪歪斜斜的木头围栏。'); S.goal('围栏有个缺口'); }); },
        async enter(S, first) { if (first) { await S.wait(600); S.goal('沿着土路往前走'); } } },
      yard: { rows: SCH, amb: 'storm', floor: 'grass', dark: .9, storm: [8, 16],
        ents: school({ teach: async S => { if (S.f.yd < 2) { S.f.yd = (S.f.yd || 0) + 1; return S.narr(S.f.yd === 1 ? '教学楼的门半开着。里面一点光都没有。' : '……你还没想好要不要进去。'); } await S.go('tb', 2, 3, 2); },
          dorm: async S => S.narr('宿舍楼。两层。楼道里黑漆漆的。\n先去别处看看。'), off: async S => S.narr('办公楼。整个学校，只有这栋楼的外墙还算完整。') }),
        async enter(S, first) { if (first) { await S.narr('围栏里零零散散立着几栋矮楼。比你想象的小得多。'); await S.wait(500); await S.narr('靠门口的是教学楼，外墙被火烧得乌黑，有几道裂缝从一楼一直爬到三楼。\n左边是两层的宿舍楼，右边是办公楼。'); S.f.yd = 0; S.goal('先在外面转一圈'); } } },
      tb: { rows: HALL(24), amb: 'hall', dark: .93, plr: 2.2, sounds: [['drip', 5, 11], ['creak', 16, 30]],
        ents: [
          { id: 'out', x: 1, y: 2, spr: 'door', solid: true, on: async S => { if (!S.f.desk) return S.narr('走廊还没走完。'); if (!S.f.back) return S.narr('……'); await S.go('yard', 13, 2, 0); S.goal('回教学楼门口'); S.f.done = true; } },
          ...[4, 8, 12, 16].map((x, i) => ({ id: 'w' + i, x, y: 1, spr: 'window', on: async S => peek(S, i) })),
          { id: 'lc', x: 21, y: 1, spr: 'door', solid: true, on: async S => lastPeek(S) },
          { id: 'ch', x: 9, y: 3, spr: 'chair', hidden: true, solid: true }],
        step(S, x, y) { if (S.f.desk && !S.f.back && x <= 9) { S.f.back = true; S.run(backTurn); } },
        async enter(S, first) { if (first) { await S.narr('墙是黑的。几年过去了，烧过的味道还在。'); await S.wait(500); S.sfx('drip'); await S.narr('雨声一下子闷了下去。像有人把门关上了。'); S.goal('看看走廊尽头'); } } } } }));
  const PEEK = ['空的。黑板上的值日表，停在三年前的某一天。', '空的。椅子全倒扣在桌面上。一把，两把……你没数下去。', '空的。', '……也是空的。你有点想笑自己。'];
  async function peek(S, i) { S.f['p' + i] = 1; if (i === 1 && S.f.back) return S.narr('倒扣在桌上的椅子，少了一把。'); await S.narr('你趴在窗户上，用手电往里照。'); await S.wait(500); await S.narr(PEEK[i]); }
  async function lastPeek(S) { if (S.f.desk) return S.narr('门上了锁。你没再往里看。');
    await S.narr('走廊最里面那间。门上贴着封条，封条被雨水泡得起了皱。'); await S.wait(600); await S.narr('你把脸贴到门上的小窗。'); await S.wait(900); S.dread(1);
    await S.narr('这一间没烧过。桌椅摆得整整齐齐。'); await S.wait(700); await S.narr('正中间那张课桌上，摊着书，还有纸和笔。\n像是……有人刚在这里上完课。'); S.f.desk = true;
    await S.think('别进去。至少，不是现在。'); S.goal('回去'); }
  async function backTurn(S) { S.sfx('creak'); await S.wait(300); await S.narr('身后，有一声很轻的「吱——」。像是椅子腿在地上拖了一下。'); S.dread(2);
    S.show('ch'); S.place('ch', 9, 3, 0); await S.wait(800); await S.narr('走廊中间，多了一把椅子。\n椅背朝着你，像是有人刚从上面站起来。'); S.goal('出去'); }
  async function lace(S) {
    S.turn(0); await S.narr('鞋带松了。你停下来，蹲下去系。'); S.sfx('step'); await S.wait(500); S.sfx('step'); await S.wait(900);
    await S.narr('身后的脚步声，多走了一步，才停。'); await S.wait(700);
    const r = await S.ask('', ['回头', '系完鞋带再说']);
    if (r === 1) { await S.wait(1200); S.sfx('breathe'); await S.narr('鞋带系完了。\n有一滴水，落在你的后颈上。不是雨——是温的。'); }
    S.show('sh'); S.place('sh', S.pl.x, S.pl.y + 2, 3); S.turn(0); await S.wait(300); S.hide('sh');
    await S.narr('你回头。'); await S.wait(600); await S.narr('雨里只有你自己的脚印。一串。'); S.dread(1); S.goal('继续往前'); }
  /* 雨夜入校的结尾：回到教学楼门口看任务、开直播 */
  { const ch = CHAPTERS.find(c => c.id === 'muyang'); const y = ch.maps.yard; const t0 = y.ents.find(e => e.id === 'teach').on;
    y.ents.find(e => e.id === 'teach').on = async S => { if (!S.f.done) return t0(S); await S.note('task'); await S.think('还没过十二点。不是「它们」最活跃的时候。\n一个一个来。'); S.dread(0); await S.end({ title: '雨夜入校', text: '你开了直播。信号很差，弹幕半天刷不出一条。' }); }; }

  /* =================== 送不走的笔仙 =================== */
  const PAPERS = ['第一张：\n我什么时候会死？', '第二张：\n我会以什么方式去死？', '第三张：\n下一个去死的会是谁？', '第四张……是空白的。'];
  defChapter(Object.assign({}, BASE, SLOW, DM_LIVE([['主播开播了', '弹幕好卡', '这宿舍好破', '信号一格', '主播今天去哪', '雨声好大'], ['笔是不是动了', '我好像听到有人笑', '主播别问死法', '四把椅子……四个人？', '后面那张床'], ['床底下！！', '快跑啊主播', '我不敢看了', '屏幕前的我已经缩成一团', '别回头别回头', '刚才那是脸吗']]), {
    id: 'pen', danmu: ['主播真玩笔仙？', '别问死法啊！！', '笔动了笔动了', '床底下是什么声音'], n: 19, title: '送不走的笔仙', sub: '宿舍楼。二楼第四间寝室。', origin: '暮阳中学 · 第四章', color: '#2a2a1a',
    amb: 'rainin', floor: 'linoleum', wall: 'school', dark: .9, plr: 2.4, items: {},
    notes: { q: { title: '椅子上的四张纸', text: '第一张：我什么时候会死？\n第二张：我会以什么方式去死？\n第三张：下一个去死的会是谁？\n第四张：（空白）\n\n纸和笔都是新的。和屋里别的东西，不是一个年代。' } },
    start: { map: 'dorm1', x: 2, y: 3, dir: 2 },
    async intro(S) { await S.card('送不走的笔仙', '暮阳中学 · 宿舍楼　晚上九点半', '宿舍楼只有两层，一共也没几个房间。\n楼道口挂着一块掉漆的铁牌。'); },
    maps: {
      dorm1: { rows: HALL(16), amb: 'rainin', dark: .9, sounds: [['drip', 6, 12]],
        ents: [
          ...[3, 6, 9].map((x, i) => ({ id: 'a' + i, x, y: 1, spr: 'door', solid: true, on: async S => S.narr(['一楼第一间。课本堆在床板上，被水泡成了一整块。', '第二间。墙角有人用粉笔画了一个圈，圈里摆着一只干掉的苹果。', '第三间。空的。床单还铺着，一角垂在地上。'][i]) })),
          { id: 'pl', x: 12, y: 1, spr: 'sign', on: async S => { await S.narr('铁牌上的字快掉光了：二楼住着女生，男生止步。'); await S.think('……抱歉。'); } },
          { id: 'up', x: 14, y: 2, spr: 'stairsup', solid: false, touch: async S => { await S.narr('楼梯踩上去，每一级都在响。'); S.sfx('creak'); await S.go('dc', 2, 3, 2); } }],
        async enter(S, first) { if (first) { await S.wait(500); S.goal('上二楼看看'); } } },
      dc: { rows: HALL(18), amb: 'rainin', dark: .9, sounds: [['drip', 7, 13], ['creak', 18, 32]],
        ents: [
          { id: 'down', x: 1, y: 2, spr: 'stairsdown', solid: false, touch: async S => S.go('dorm1', 13, 3, 1) },
          ...[3, 6, 9, 12].map((x, i) => ({ id: 'r' + i, x, y: 1, spr: 'door', solid: true, on: i === 3 ? (async S => door4(S)) : (async S => S.narr(['第一间。床板全被拆走了。', '第二间。墙上贴满了明星海报，脸全被抠掉了。', '第三间。门上用粉笔写着：别进第四间。\n粉笔字下面，又有人补了一句：她们还在。'][i])) })),
          { id: 'wn', x: 15, y: 1, spr: 'window', on: async S => { await S.narr('雨打在玻璃上。玻璃里映着你的脸。'); await S.wait(900); await S.narr('……它比你晚眨了一下眼。'); } }],
        async enter(S, first) { if (first) { await S.wait(400); await S.narr('二楼比一楼更潮。走廊尽头的窗户在风里一下一下地拍。'); S.sfx('flap'); S.goal('一间一间看'); } } },
      room: { rows: ROOMR(12, 4, 'n'), amb: 'rainin', dark: .9, plr: 2.2,
        ents: [
          { id: 'out', x: 5, y: 1, spr: 'door', solid: true, on: async S => S.narr(S.f.done ? '……' : (S.f.started ? '门推不开。外面好像有人顶着。' : '还没看完。')) },
          ...[3, 4, 6, 7].map((x, i) => ({ id: 'c' + i, x, y: 3, spr: 'chair', solid: true, on: async S => { S.f['q' + i] = 1; S.sfx('paper'); await S.narr(PAPERS[i]); if (i === 3) await S.think('四个问题，三个写了字。第四张留给谁？'); if ([0, 1, 2, 3].every(k => S.f['q' + k]) && S.once('allq')) { await S.wait(500); await S.think('纸和笔都是新的。\n……有人最近来过，在这儿等第四个人。'); S.goal('坐下来'); } } })),
          { id: 'pp', x: 5, y: 3, spr: 'paper', solid: true, on: async S => ritual(S) },
          { id: 'bed', x: 1, y: 2, spr: 'bed', solid: true, col: '#5a5a5a', on: async S => underBed(S) },
          { id: 'bed2', x: 10, y: 2, spr: 'bed', solid: true, col: '#5a5a5a', on: async S => S.narr(S.f.started ? '你立在床头的手机还在直播。屏幕的光照着凉席上那个人形的水印。' : '床上铺着一张发霉的凉席。凉席上有一个人形的水印。\n你把手机立在床头，镜头对着那四把椅子。') },
          { id: 'cand', x: 5, y: 2, spr: 'candle', light: { r: 2, col: 'rgba(255,190,110,.2)', flick: true } },
          ...[2, 4, 7, 9].map((x, i) => ({ id: 'sh' + i, x, y: 2, spr: 'gh_shadow', hidden: true, alpha: .55 }))],
        async enter(S, first) { if (first) { await S.wait(500); await S.narr('一股霉味扑过来。'); await S.narr('寝室正中间，并排摆着四把椅子。每把椅子上，都放着一张纸。\n椅子中间的地上，横着一支圆珠笔。'); S.goal('看看椅子上的纸'); } } } } }));
  async function door4(S) { if (S.f.lock) return S.go('room', 5, 5, 3); if (!S.f.l1) { S.f.l1 = 1; S.sfx('locked'); return S.narr('门上挂着一把生锈的锁。'); }
    S.f.lock = true; for (let i = 0; i < 3; i++) { S.sfx('thud'); await S.wait(380); } await S.narr('你砸了三下，锁头掉在地上。'); await S.wait(800); await S.narr('声音在空楼里传出去很远。然后，什么回应都没有。'); await S.go('room', 5, 5, 3); }
  async function ritual(S) {
    if (S.f.done) return S.narr('笔断成了两截。');
    if (![0, 1, 2, 3].every(k => S.f['q' + k])) return S.narr('笔就躺在四把椅子中间。你还没看完那几张纸。');
    if (S.f.asked) return endPen(S);
    S.f.started = true; S.sfx('close'); await S.narr('你把门关上，坐到地上。布偶塞进胸口，右手握笔，左手抓着工具锤。'); S.amb('hush'); await S.wait(1400);
    await S.narr('宿舍外面风雨交加。宿舍里面，安静得让人心慌。'); S.dread(1); await S.wait(900);
    await S.say('me', '笔仙笔仙，你是我的前世，我是你的今生。如果你要来，就在纸上画圈。'); await S.wait(2200);
    await S.narr('什么也没有发生。'); await S.wait(1300); S.sfx('drip'); await S.wait(900); await S.think('……果然只是心理作用。'); await S.wait(600);
    await S.say('me', '笔仙笔仙，你是我的前世，我是你的今生。如果你要来——'); await S.wait(700);
    S.sfx('breathe'); await S.narr('手背上，多了一股力气。\n冰凉的，像被另一只手轻轻握住。'); S.dread(2); await S.wait(1200);
    S.plr(.4); await S.wait(500); await S.scare('glitch', { sfx: 'sting' }); S.plr(null);
    await S.narr('有一瞬间，你看见了。\n三道很浅的影子，站在三个方向，每一个都伸出手，握着你掌心的这支笔。'); await S.wait(800);
    S.sfx('chalk'); await S.wait(1500); await S.narr('笔动了。你的手没动。\n笔尖压着纸，慢慢画出一个圆。红色的。'); await S.wait(600);
    const c = await S.ask('该你问了。', ['“我父母在哪里？”', '“我未来的妻子是谁？”']); S.f.k_penQ = c; await S.wait(900);
    if (c === 0) { S.sfx('creak'); await S.narr('笔抖了起来。笔杆上，裂开了一道细纹。'); await S.wait(2200); await S.narr('又过了很久，它在纸上画了第二个圈。\n……跳过了？它也不知道。'); await S.think('连它都不知道。'); }
    else { S.sfx('chalk'); await S.wait(800); await S.narr('笔写了一个「徐」字。'); await S.wait(1000); await S.narr('停了一下。\n然后在上面狠狠打了个叉，在旁边另写了一个名字。两个字。'); await S.wait(600); await S.narr('你后背凉了一下。'); }
    await S.wait(800); await kFlash(S, ['sh0', 'sh1', 'sh2', 'sh3'], { hold: 260 }); await S.narr('闪电亮起来的那一下，墙上映出了四个影子。\n屋里明明只有你一个人。'); await S.wait(900);
    await S.say('me', '笔仙笔仙，请离开。'); await S.wait(2400); await S.narr('没有回应。手背上的凉意，已经爬到了肩膀。'); await S.wait(800);
    await S.say('me', '……笔仙笔仙，请你离开。'); await S.wait(1600); S.sfx('desk'); await S.narr('身后那张床上的床单，轻轻摆了一下。'); S.dread(3); await S.wait(1200);
    S.sfx('giggle'); await S.narr('床底下，有人很小声地笑了一下。'); S.f.asked = true; S.goal('……床底下'); }
  async function underBed(S) {
    if (!S.f.asked) return S.narr('床底下黑漆漆的。你没打算看。');
    if (S.f.looked) return S.narr('床底下什么都没有。');
    S.f.looked = true; await S.narr('你趴下去。凉的地板贴着你的脸。'); await S.wait(1200); S.plr(1.2); await S.narr('手电往床底下照——'); await S.wait(700);
    await S.scare('face', { face: 'child', sfx: 'scream' }); S.plr(null);
    await S.narr('一张脸贴在床板下面，正倒着看你。\n手电一晃，它没了。'); await S.wait(600); S.goal('回到笔那里'); }
  async function endPen(S) {
    if (!S.f.looked) return S.narr('笔在纸上一直画圈。一圈，一圈。');
    S.f.done = true; await S.narr('你抓起那支笔。它在你手里抖。'); await S.wait(600); S.sfx('thud'); S.shake(300, 2);
    await S.narr('你把笔往纸上一拍。'); await S.say('me', '给你一次重新组织语言的机会。'); await S.wait(1600);
    S.sfx('creak'); await S.narr('笔杆上的裂纹，一道一道蔓延开。\n啪。笔断成了两截。'); S.amb('rainin'); S.dread(0); await S.wait(1200); await S.narr('雨声又回来了。');
    await S.end({ title: '送不走的笔仙', text: '你把镜头对准地上断成两截的笔：「各位，我玩笔仙，玩到笔都自杀了。」\n弹幕：？？？／笔：我只是一支笔／关注一下子涨了上去。' }); }

  /* =================== 厕所的第五个隔间 =================== */
  const STALL = (pre, fn) => [3, 5, 7, 9, 11, 13].map((x, i) => ({ id: pre + (i + 1), x, y: 2, spr: 'stall', solid: true, on: async S => fn(S, i + 1) }));
  const WCH = (n, o) => ({ rows: HALL(20), amb: 'hall', dark: .93, plr: 2.2, sounds: [['drip', 6, 12], ['farstep', 22, 40]], ents: [
    ...[4, 8, 12].map((x, i) => ({ id: 'cw' + n + i, x, y: 1, spr: 'window', on: async S => S.narr(o.peek[i]) })),
    { id: 'td' + n, x: 16, y: 1, spr: 'door', solid: true, on: o.wc },
    ...(o.up ? [{ id: 'up' + n, x: 18, y: 2, spr: 'stairsup', solid: false, touch: o.up }] : []),
    ...(o.down ? [{ id: 'dn' + n, x: 1, y: 2, spr: 'stairsdown', solid: false, touch: o.down }] : [])], enter: o.enter });
  defChapter(Object.assign({}, BASE, SLOW, DM_LIVE([['教学楼好黑', '主播走慢点', '这走廊好长', '信号又卡了'], ['刚才是不是有脚步声', '两个人在跑？', '第五个隔间……', '主播你躲好'], ['红色的那是什么', '眼睛！！全是眼睛', '别开门别开门', '我密恐犯了', '快跑']]), {
    id: 'wc', danmu: ['第五个隔间……', '全是眼睛我密恐犯了', '别进去啊', '红色的那是什么', '主播你躲好'], hint: S => S.f.six && !S.f.inSix && !S.f.flee ? 's6' : null, n: 20, title: '厕所的第五个隔间', sub: '教学楼。三层，每层一个厕所，每个厕所六个隔间。', origin: '暮阳中学 · 第四章', color: '#3a0a0a',
    amb: 'hall', floor: 'tile', wall: 'tile', dark: .92, plr: 2.4, items: {},
    notes: { story: { title: '支线：厕所的第五个隔间', text: '这条支线是用第一人称写的：\n\n“总有一个红影在午夜出现。\n我躲进了第五个隔间，想抓住它。\n门缝外面，有一只充血的眼珠，在看我。”\n\n——没有写是哪一层。' } },
    start: { map: 'h1', x: 2, y: 3, dir: 2 },
    async intro(S) { await S.card('厕所的第五个隔间', '教学楼　晚上十点', '支线里没写是哪一层。教学楼有三层。'); },
    maps: {
      h1: WCH(1, { peek: ['空教室。', '空教室。讲台上放着一个粉笔盒，盖子是开着的。', '空教室。'], wc: async S => S.go('w1', 2, 4, 2), up: async S => { if (!S.f.w1) return S.narr('先看看一楼的厕所。'); await S.go('h2', 17, 3, 1); },
        enter: async (S, first) => { if (first) { await S.note('story'); await S.wait(400); await S.narr('深夜里一间一间经过空教室——你很怕走着走着往里一看，里面多了什么。'); S.goal('一楼的厕所'); } } }),
      w1: { rows: ROOMR(16, 4, '+'), amb: 'pipes', dark: .9, sounds: [['drip', 3, 7], ['pipe', 12, 22]],
        ents: [{ id: 'o1', x: 1, y: 2, spr: 'door', solid: true, on: async S => { if (!S.f.w1) return S.narr('还没看完。'); await S.go('h1', 16, 2, 0); if (S.once('wave')) { await S.wait(300); await S.narr('你回头看了一眼。厕所里几个隔间的门半开半合，像有人在招手。'); } S.goal('楼上'); } },
          ...STALL('t', stall1)],
        async enter(S, first) { if (first) { await S.narr('地砖裂了，杂草从缝里钻出来。只剩一扇窗，在风里吱呀吱呀地响。'); S.goal('第五个隔间'); } } },
      h2: WCH(2, { peek: ['空教室。', '空教室。黑板上写满了「正」字。', '空教室。'], wc: async S => { kCpAt(S, 'w2'); await S.go('w2', 2, 4, 2); }, up: async S => { if (!S.f.w2) return S.narr('二楼的厕所还没看。'); await S.go('h3', 17, 3, 1); }, down: async S => S.go('h1', 17, 3, 1),
        enter: async (S, first) => { if (first) { await S.narr('二楼。窗户全被木板钉死了。'); S.dread(1); S.goal('二楼的厕所'); } } }),
      w2: { rows: ROOMR(16, 4, '+'), amb: 'hush', dark: .95, plr: 2,
        ents: [{ id: 'o2', x: 1, y: 2, spr: 'door', solid: true, on: async S => { if (!S.f.w2) return S.narr('还没看完。'); await S.go('h2', 16, 2, 0); S.goal('三楼'); } },
          { id: 'hd', x: 2, y: 3, solid: false, touch: async S => { if (S.f.run && !S.f.hid) { S.f.hid = true; S.clearTimer(); S.run(hidden2); } } },
          ...STALL('u', stall2),
          ...[[1, 4], [2, 4]].map(([x, y], i) => ({ id: 'ks' + i, x, y, spr: 'gh_shadow', hidden: true, alpha: .6 }))],
        async enter(S, first) { if (first) { await S.narr('窗户也被木板封死了。比一楼压抑得多。'); await S.wait(800); await S.narr('这里的东西，几年里都没人动过。'); S.goal('一个一个看'); } } },
      h3: WCH(3, { peek: ['空教室。', '……空教室。', '空教室。课桌上摆着一个书包，拉链开着。'], wc: async S => S.go('wc', 2, 5, 2), down: async S => S.go('h2', 2, 3, 2),
        enter: async (S, first) => { if (first) { await S.narr('三楼。雨声小得几乎听不见。'); await S.wait(500); await S.narr('厕所门上贴着一张纸：维修中。\n纸是新的。'); S.dread(2); S.goal('三楼的厕所'); } } }),
      wc: { rows: ROOMR(16, 4, '+'), amb: 'pipes', dark: .93, sounds: [['drip', 4, 8]],
        ents: [
          { id: 'out', x: 1, y: 2, spr: 'door', solid: true, on: async S => S.f.flee ? (kEpicLow(S), S.end({ title: '厕所的第五个隔间', text: '隔间里的两个孩子看着你手里的锤子，往后缩了缩。\n“……我不是冲你们。”' })) : S.narr('还没弄清楚。') },
          ...STALL('s', stall),
          { id: 'ew', x: 11, y: 2, spr: 'eyewall', hidden: true },
          { id: 'ph', x: 12, y: 2, spr: 'peephole', hidden: true },
          { id: 'kid1', x: 11, y: 3, spr: '@ruoyu', hidden: true, alpha: .7 }, { id: 'kid2', x: 10, y: 3, spr: '@ruoyu', hidden: true, alpha: .7 },
          { id: 'rs', x: 1, y: 3, spr: 'redshadow', hidden: true, solid: true, light: KRED },
          { id: 'sk', x: 14, y: 5, spr: 'sink', solid: true, on: async S => S.narr('洗手池里有一圈红色的水垢。') }],
        async enter(S, first) { if (first) { await S.narr('隔间的门全关着。'); await S.wait(700); S.sfx('drip'); await S.narr('水箱在滴水。一下，一下。'); S.goal('第五个隔间'); } } } },
    resume: { w2: async S => { S.f.run = false; S.f.hid = false; }, hide: async S => { S.hidePlayer(false); S.stop('rs'); S.hide('rs'); S.f.inSix = false; S.after(300, steps); } } }));
  async function stall1(S, i) {
    if (i <= 4) return S.narr(['第一个。门板坏了一半，里面什么都没有。', '第二个。空的。', '第三个。空的。地上有一摊干掉的水渍。', '第四个。空的。'][i - 1]);
    if (S.f['t' + i]) return S.narr('杂物。');
    if (!S.f.lk) { S.f.lk = 1; return S.narr('第五个和第六个隔间的门……锁着。\n只有里面有人的时候，隔间才会锁。'); }
    S.f['t' + i] = 1; await S.narr('你举起锤子，砸在门锁上。'); S.sfx('thud'); await S.wait(200); S.sfx('drop'); S.shake(300, 2);
    if (i === 5 && !S.f.boo) { S.f.boo = 1; await S.narr('门一开，几道黑影直接朝你扑了过来——'); await S.wait(500); await S.narr('……是拖把和扫帚。'); await S.wait(800); await S.think('……。'); }
    else await S.narr('里面塞满了拖把和水桶。');
    if (S.f.t5 && S.f.t6) { S.f.w1 = true; S.goal('不是这一层'); } }
  async function stall2(S, i) {
    if (S.f.run && !S.f.hid) return;
    if (i <= 4) { S.f['u' + i] = 1; return S.narr(['第一个。空的。', '第二个。空的。门板上写着一个日期，被人划掉了。', '第三个。空的。', '第四个。空的。'][i - 1]); }
    if (i === 6) return S.narr(S.f.w2 ? '空的。' : '第六个。门关着。');
    if (S.f.w2) return S.narr('空的。');
    if (!S.f.run) { S.f.run = true; await S.narr('你的手刚碰到第五个隔间的门——'); await S.wait(600); S.sfx('run2'); await S.wait(1000);
      await S.narr('走廊上，响起了脚步声。'); await S.wait(500); S.sfx('run2'); await S.narr('不是一个人。是两个人，并排在跑。正往这边来。'); S.dread(2);
      S.goal('躲到门后！'); S.timer(9, '脚步声', async S => { if (!S.f.hid) { S.f.hid = true; await caught2(S); } }); } }
  async function hidden2(S) { S.hidePlayer(true); S.plr(0); await S.narr('你贴着墙站到门后，关掉手电，屏住呼吸。'); await S.wait(1200); S.sfx('run2'); await S.wait(1400);
    await S.narr('脚步声停在了厕所门口。'); await S.wait(2200); S.sfx('breathe'); await S.wait(1600);
    await kFlash(S, ['ks0', 'ks1'], { hold: 300 }); await S.narr('闪电亮了一下。\n厕所地面上，多了两道影子——很短，像两个孩子。'); await S.wait(1800);
    S.sfx('farstep'); await S.narr('然后，脚步声往楼道去了。一下，一下，往楼下。'); await S.wait(1200); S.hidePlayer(false); S.plr(null); await after2(S); }
  async function caught2(S) { S.plr(.6); await S.narr('来不及了。'); await S.wait(800); await kFlash(S, ['ks0', 'ks1'], { hold: 500 }); await S.narr('门口站着两个很矮的影子。'); await S.wait(2000); await S.narr('它们看了你很久。\n然后转身，往楼下去了。'); S.plr(null); await after2(S); }
  async function after2(S) { await S.wait(800); S.sfx('open'); await S.narr('你推开第五个隔间。'); await S.wait(700); await S.narr('……空的。'); await S.think('影子很短。像两个孩子。\n可任务里说的是一道红影。'); S.f.w2 = true; S.goal('三楼'); }
  async function stall(S, i) {
    if (i < 5) return S.narr(['第一个。门板上写着一个日期。', '第二个。里面的水箱一直在响。', '第三个。门从里面插着。你敲了敲，里面也敲了敲。', '第四个。空的。地上有一双小小的鞋印。'][i - 1]);
    if (i === 5) { if (S.f.five) return S.narr('全是眼睛。'); S.f.five = true; await S.narr('你用锤头，顶开第五个隔间的门。'); await S.wait(900); S.show('ew'); S.sfx('open'); await S.scare('glitch', { sfx: 'sting' });
      await S.narr('隔板上，墙上，全是眼睛。画上去的。'); await S.wait(700); await S.narr('每一只都朝着门口。'); S.goal('第六个隔间'); return; }
    if (!S.f.five) return S.narr('第六个。门关着。');
    if (!S.f.six) { S.f.six = true; S.show('ph'); await S.narr('只有第六个隔间的隔板上有画，墙上没有。'); await S.wait(600); await S.narr('你凑近看：所有的眼睛，都是为了藏住隔板中间的一个小孔。');
      await S.think('不是有东西在第五个隔间里偷看。\n是有人躲在第六个隔间里，往第五个看。'); kCpAt(S, 'hide'); await steps(S); return; }
    if (S.f.inSix) return;
    S.clearTimer(); S.f.inSix = true; S.hidePlayer(true); S.plr(0); S.focus(10, 3); S.sfx('close');
    await S.narr('你躲进第六个隔间，把眼睛凑到小孔上。'); await S.wait(1500);
    S.show('kid1'); S.show('kid2');
    await S.narr('孔的那一边，没有充血的眼珠。\n只有两个看起来三四岁大的孩子，手拉着手，站在第五个隔间里。'); await S.wait(1200); S.sfx('hum'); await S.narr('其中一个在小声哼歌。'); await S.wait(1600);
    S.show('rs'); S.place('rs', 1, 3, 2); S.sfx('step'); S.dread(3);
    await S.narr('然后，红影进来了。它一个一个拉开隔间的门，探头进去看。');
    for (const x of [3, 5, 7, 9]) { await S.walk('rs', [x, 3], 3); S.face('rs', 3); S.sfx('open'); await S.wait(700); }
    await S.narr('第五个。'); await S.walk('rs', [11, 3], 3); S.face('rs', 3); await S.wait(1400); await S.narr('孩子们不见了。');
    await S.walk('rs', [12, 3], 2); S.face('rs', 3); await S.wait(1200); S.ent('ph').eye = true;
    await S.scare('face', { face: 'red', sfx: 'scream' });
    await S.narr('它停在了第六个门口。\n门缝里，一只充血的眼睛，正对着你的眼睛。');
    await kEpic(S, { name: '红影', sub: '厕所的第五个隔间', seal: '眼', intro: ['它每天午夜来一次。', '一扇一扇拉开隔间的门。', '它在找躲在第六个隔间里偷看的人。'], phase: '（门缝里那只眼睛，眨都不眨）', low: '红影在地上一滚，身形变得很淡，逃出了厕所。', ids: ['rs'] });
    const r = await S.ask('', ['撞开门', '屏住呼吸，不动']);
    S.ent('ph').eye = false; S.focus(null); S.plr(null); S.hidePlayer(false);
    if (r === 0) { S.sfx('thud'); S.shake(400, 3); await S.narr('门板还没完全打开，你的锤子已经出去了。\n红影在地上一滚，身形变得很淡，逃出了厕所。'); S.hide('rs'); S.f.flee = true; S.dread(1); S.goal('出去'); return; }
    S.sfx('open'); await S.narr('门开了。它已经看见你了。'); S.place('rs', 14, 3, 1); S.pos(11, 3, 1);
    S.goal('冲出去！跑到门口'); S.f.flee = true; await S.wait(400);
    S.chase('rs', { spd: 2.8, catch: async S => { await S.scare('face', { face: 'red', sfx: 'scream' }); await S.die('它把你拖进了第五个隔间。\n墙上的眼睛，又多了两只。', '第五个隔间'); } }); }
  async function steps(S) { await S.wait(500); S.sfx('farstep'); await S.wait(900); S.sfx('step'); await S.narr('脚步声上来了。这次只有一个。'); S.goal('躲进第六个隔间！'); S.timer(9, '躲', async S => { if (!S.f.inSix) { S.show('rs'); S.place('rs', 2, 3, 2); await S.narr('红影站在门口。它看见你了。'); S.chase('rs', { spd: 2.8, catch: async S => { await S.scare('face', { face: 'red', sfx: 'scream' }); await S.die('它把你拖进了第五个隔间。', '第五个隔间'); } }); } }); }

  /* =================== 唯一的目击者（数学组） =================== */
  defChapter(Object.assign({}, BASE, SLOW, DM_LIVE([['办公楼看着还挺新', '主播去哪', '这楼好安静', '我饭都凉了'], ['那个门缝里的光', '钟怎么又走了', '画册好诡异', '撬抽屉犯法吧'], ['门把手在转！！', '两个红色的小人……', '画里那个拿锤子的是你', '十点半了主播快跑']]), {
    id: 'office', danmu: ['撬抽屉犯法吧', '这画册好诡异', '两个红色的小人……', '十点半了主播快跑'], n: 21, title: '唯一的目击者', sub: '办公楼一层。', origin: '暮阳中学 · 第四章', color: '#1a1a2a',
    amb: 'hall', floor: 'linoleum', wall: 'school', dark: .9, plr: 2.4, items: {},
    notes: {
      book: { title: '桌上的画册', text: '一个卡通画册，一盒蜡笔。\n整本都在画同一个场景：黑色的房间里，关着两个红色的小人。\n\n每一页的小人都在同一个位置。只有最后几页，它们离门近了一点。' },
      notes3: { title: '教案里的三张纸条', text: '三张纸条，笔迹各不相同，内容差不多：\n\n“我知道第六个隔间里的人是你。”\n\n——范老师因为“酒后误事”被学校开除。' } },
    start: { map: 'offh', x: 2, y: 3, dir: 2 },
    async intro(S) { await S.card('唯一的目击者', '办公楼　晚上十点半', '整个学校，只有这栋楼的外墙是完整的。\n走廊比外面安静。安静得能听见自己的心跳。'); },
    maps: {
      offh: { rows: HALL(18), amb: 'hall', dark: .9, sounds: [['drip', 9, 16], ['farstep', 20, 36]],
        ents: [
          { id: 'jw', x: 4, y: 1, spr: 'door', solid: true, on: async S => S.narr('教务处。门上的玻璃碎了，里面的柜子全被人翻过。') },
          { id: 'xz', x: 8, y: 1, spr: 'door', solid: true, on: async S => { if (S.f.xz) return S.narr('门缝底下是黑的。'); S.f.xz = 1; await S.narr('校长室。门缝底下，透出一点光。'); await S.wait(800); await S.narr('你蹲下去，想从门缝往里看——'); await S.wait(1000); S.sfx('switch'); await S.narr('光灭了。'); await S.wait(900); await S.think('……这栋楼没有电。'); S.dread(1); } },
          { id: 'yw', x: 12, y: 1, spr: 'door', solid: true, on: async S => S.narr('语文组。黑板上抄着一首诗，最后一句被擦掉了。') },
          { id: 'sx', x: 15, y: 1, spr: 'door', solid: true, on: async S => { if (!S.f.xz) return S.narr('门上一块掉了色的牌子：数学组。\n牌子背面，有人用指甲划了一道又一道。'); await S.go('math', 2, 5, 2); } }],
        async enter(S, first) { if (first) { await S.wait(500); S.goal('一间一间看'); } } },
      math: { rows: ROOMR(14, 4, 'n'), amb: 'rainwin', dark: .9, sounds: [['rainhit', 8, 16]],
        ents: [
          { id: 'out', x: 1, y: 2, spr: 'door', solid: true, on: async S => { if (!S.f.flip) return S.narr(S.f.knock ? '门外……没有声音了。' : '还没翻完。'); await S.end({ title: '唯一的目击者', text: '弹幕：卧槽／所以那两个小孩是……／主播快跑吧十点半了' }); } },
          { id: 'clk', x: 3, y: 1, spr: 'wallclock', on: async S => S.narr(S.f.tick ? '钟在走。十点二十九分……三十秒。三十一秒。' : '墙上的钟停在十点二十九分。') },
          { id: 'bk', x: 5, y: 3, spr: 'desk', solid: true, on: async S => { if (S.f.flip) return S.narr('画上的蜡笔，还没干。'); if (S.f.b) return S.narr('黑房子，红小人。'); S.f.b = true; await S.note('book'); await S.think(KENV.flags.fanyu === 0 ? '和范郁送给你的那幅，几乎一模一样。' : '你想起范郁趴在井边的样子：天堂在井里。'); await S.wait(500); await S.think('如果黑房子是“家”——\n那几年前，范郁家里就已经住进了两个“人”。'); S.dread(Math.max(1, S.f._dread || 0)); await chk(S); } },
          { id: 'dk', x: 9, y: 3, spr: 'desk', solid: true, on: async S => { if (S.f.d) return S.narr('抽屉撬开了。'); S.f.d = true; S.sfx('cut'); await S.wait(300); S.sfx('cut'); await S.narr('你用锤子撬开了两侧上锁的抽屉。声音大得吓人。'); await S.wait(900); await S.note('notes3'); await S.think('躲在第六个隔间里偷看的人，是范郁的父亲。\n留着纸条，是想比对字迹找出这三个学生——可这三个人，在学校里根本找不到。'); await chk(S); } },
          { id: 'bb', x: 7, y: 1, spr: 'blackboard', on: async S => S.narr('黑板上还留着一道没写完的题。答案那一栏，画着一只眼睛。') },
          { id: 'sh', x: 12, y: 2, spr: 'bookshelf', solid: true, on: async S => S.narr('书架上的教案按年份排好。最后一本是十年前的。\n再往后的格子，是空的。') },
          { id: 'wn', x: 10, y: 1, spr: 'window', on: async S => S.narr(S.f.knock ? '窗外漆黑。玻璃上映着这间办公室——和门口站着的一个影子。\n你回头。门口什么都没有。' : '雨顺着玻璃往下淌。') }],
        async enter(S, first) { if (first) { await S.narr('数学组。几张办公桌拼在一起，桌上的东西都还在，像老师们只是下班了。'); await S.wait(600); S.goal('翻翻桌上的东西'); } } } } }));
  async function chk(S) { if (!(S.f.b && S.f.d) || S.f.flip) return;
    if (!S.f.tick) { S.f.tick = true; await S.wait(900); S.sfx('clock'); await S.wait(1100); S.sfx('clock'); await S.narr('……嗒。'); await S.wait(900); await S.narr('墙上那只停了的钟，走了一格。'); S.dread(2); }
    S.f.knock = true; await S.wait(1500); S.sfx('farstep'); await S.wait(1300); await S.narr('走廊上，有脚步声。'); await S.wait(1600); await S.narr('停在了门口。');
    await S.wait(2400); S.sfx('creak'); await S.narr('门把手，慢慢地往下转了半圈。'); await S.wait(1800); await S.narr('又松开了。'); await S.wait(1500);
    S.f.flip = true; S.sfx('paper'); await S.wait(700); await S.narr('你转身——桌上那本画册，自己翻到了新的一页。'); await S.scare('glitch', { sfx: 'sting' }); S.dread(3);
    await S.narr('一个拿着锤子的小人，站在第五个隔间门口。\n画上的蜡笔，还没干。'); S.goal('出去'); }

  /* =================== 最后一间教室 =================== */
  defChapter(Object.assign({}, BASE, SLOW, DM_LIVE([['最后一间教室！', '我表哥说的就是这个', '走廊好长啊', '有个班出车祸那个'], ['上课铃？？', '学校不是没电吗', '数一遍桌子', '那把椅子转了'], ['二十四个人！！', '都在看你', '那个阿姨是谁', '她手里有刀', '跑！！']]), {
    id: 'last', danmu: ['最后一间教室！', '有个班出车祸那个', '我表哥说的就是这个', '别碰椅子啊', '那个阿姨是谁'], n: 22, title: '最后一间教室', sub: '晚上十一点四十。教学楼尽头。', origin: '暮阳中学 · 第四章', color: '#0a1a2a',
    amb: 'hall', floor: 'linoleum', wall: 'school', dark: .92, plr: 2.4, items: {},
    notes: { desk: { title: '课桌上的刻字', text: '每一笔都用尽了全力，笔迹各不相同：\n\n“它可能藏在任何地方。抽屉里，柜子里，枕头后面。”\n“那个眼珠我很熟悉。”\n“希望这间教室的传说是真的。我愿意奉献我的一切，只求毁掉那双眼睛。”\n\n最后这一条的字迹，你见过。在范郁家，他姑姑签免责协议的时候。' },
      legend: { title: '最后一间教室的传说', text: '有个班出去郊游，大巴出了车祸。\n那个班的学生，总是还回来上课。\n\n二十四个座位。一个都没空着。' } },
    start: { map: 'cr', x: 2, y: 3, dir: 2 },
    async intro(S) { await S.card('最后一间教室', '教学楼　晚上十一点四十', '你把这间教室留到了最后。\n大火没有烧到这里。'); },
    maps: {
      cr: { rows: HALL(22), amb: 'hall', dark: .92, sounds: [['drip', 7, 13]],
        ents: [
          { id: 'cls', x: 19, y: 1, spr: 'door', solid: true, on: async S => clsDoor(S) },
          { id: 'stair', x: 1, y: 2, spr: 'stairsdown', solid: false, touch: async S => S.narr(S.f.met ? '她堵着楼梯。' : (S.f.out ? '……' : '先去尽头那间教室。')) },
          { id: 'fp', x: 14, y: 3, spr: 'footprints', hidden: true },
          { id: 'aunt', x: 3, y: 3, spr: '@aunt', hidden: true, solid: true },
          { id: 'w1', x: 7, y: 1, spr: 'window', on: async S => { if (!S.f.bell) return S.narr('窗外是操场。雨下得很密。'); await S.narr('窗外的雨里，站着一排人。都没打伞。'); await S.wait(900); await S.narr('他们都穿着校服。'); } },
          { id: 'lg', x: 11, y: 1, spr: 'poster', on: async S => S.note('legend') }],
        step(S, x) { if (x >= 13 && S.once('bell')) S.run(bell); if (S.f.out && !S.f.met && x <= 12) { S.f.met = true; S.run(aunt); } },
        tick(S) { if (S.f.chase && !S.f.won && !S.busy) { const a = S.ent('aunt'); if (a.x >= 17) S.run(lure); } },
        async enter(S, first) { if (first) { await S.wait(500); S.goal('走廊尽头'); } } },
      room: { rows: ROOMR(14, 4, 'n'), amb: 'hush', dark: .9, plr: 2.2, sounds: [['chalk', 14, 24]],
        ents: [
          { id: 'out', x: 3, y: 1, spr: 'door', solid: true, on: async S => { if (!S.f.seen) return S.narr('还没看完。'); S.f.out = true; S.amb('hall'); await S.go('cr', 19, 2, 1); S.goal('离开教学楼（楼梯在走廊另一头）'); } },
          { id: 'dk', x: 7, y: 3, spr: 'schooldesk', solid: true, on: async S => { if (S.f.d) return S.narr('刻字还在。'); await S.note('desk'); S.f.d = true; await S.wait(900); S.sfx('desk'); await S.narr('身后，有一张椅子被轻轻拖了一下。'); S.ent('ch').dir = 3; S.dread(3); S.goal('……'); } },
          { id: 'cnt', x: 11, y: 4, spr: 'schooldesk', solid: true, on: async S => { if (S.f.cn) return S.narr('二十四张。'); S.f.cn = 1; await S.narr('你数了一遍课桌。'); await S.wait(1500); await S.narr('二十四张。'); await S.wait(800); await S.narr('……再数一遍。'); await S.wait(1600); await S.narr('二十五张。'); await S.wait(1000); await S.narr('你又数了一遍。二十四张。'); } },
          { id: 'ch', x: 9, y: 4, spr: 'chair', solid: true, on: async S => students(S) },
          ...[[3, 3], [10, 3], [3, 5], [6, 5], [10, 5]].map(([x, y], i) => ({ id: 'st' + i, x, y, spr: 'students', hidden: true, solid: true })),
          { id: 'bb', x: 7, y: 1, spr: 'blackboard', on: async S => S.narr(S.f.d ? '黑板上写着：郊游，带好雨衣。\n下面多了一行字，粉笔灰还在往下掉：今天有新同学。' : '黑板上写着：郊游，带好雨衣。') }],
        async enter(S, first) { if (first) { await S.narr('桌椅摆得整整齐齐。'); await S.wait(800); await S.narr('正中间那张课桌上，摊着书，还有纸和笔。'); await S.wait(600); S.goal('看看正中间那张课桌'); } } } },
    resume: { aunt: async S => { S.f.chase = true; S.f.won = false; S.f.met = true; S.show('aunt'); S.place('aunt', 3, 3, 2); goAunt(S); } } }));
  async function bell(S) { await S.wait(400); S.sfx('bellsch'); await S.wait(1800); await S.narr('上课铃响了。'); await S.wait(1000); await S.think('……这所学校，三年前就断电了。'); S.dread(1); S.f.bell = true; await S.wait(600); S.sfx('farstep'); await S.narr('楼下传来很多双脚踩在楼梯上的声音。往这一层来。然后——停了。'); S.dread(2); }
  async function clsDoor(S) { if (S.f.out) return S.narr('门关着。门上的玻璃后面，有很多张脸。'); if (!S.f.bell) return S.narr('……');
    if (!S.f.seal) { S.f.seal = 1; await S.narr('门上的封条，是新的。'); await S.wait(700); await S.narr('你把它撕下来。纸很潮，像刚贴上去没多久。'); return; } await S.go('room', 3, 5, 3); }
  async function students(S) {
    if (!S.f.d) return S.narr('一把椅子。');
    if (S.f.seen) return S.narr('……');
    S.f.seen = true; await S.narr('那把椅子，转过来对着你了。'); await S.wait(1200); await S.narr('你伸手去扶——'); S.sfx('thud'); await S.narr('椅子倒了。');
    await S.wait(1500); for (let i = 0; i < 5; i++) S.show('st' + i);
    await S.scare('face', { face: 'child', sfx: 'sting' });
    await S.narr('教室里坐满了人。二十四个，穿着校服，低着头。'); await S.wait(1400);
    S.plr(.2); S.sfx('whisper'); await S.wait(900); for (let i = 0; i < 5; i++) S.ent('st' + i).face = true; S.plr(null);
    await S.narr('手电闪了一下。再亮起来的时候，二十四张脸，全都转向了你。'); S.goal('退出去，带上门'); }
  async function aunt(S) {
    S.show('fp'); await S.narr('走廊的地上，有一串不属于你的湿鞋印。'); await S.wait(1000); S.sfx('step'); await S.wait(600); S.show('aunt'); S.place('aunt', 3, 3, 2);
    await S.say('aunt', '没想到你真的跑到这地方来了。我是来救你的。这学校有一口死过很多人的井，井里的东西快出来了，你已经被盯上——快走。');
    await S.say('me', '好。'); S.turn(2); await S.narr('你转过身，把后背留给了她。'); await S.wait(1300);
    S.sfx('step'); await S.scare('red', { sfx: 'sting' }); await S.say('aunt', '早就知道你有问题。');
    await kEpic(S, { name: '范郁的姑姑', sub: '深井 · 最后一条支线', seal: '井', intro: ['“我哥已经疯了。”', '“从他拿着那张合照回家开始。”', '那天晚上，她九点多到的学校。'], phase: '我从没想过杀人！你根本不知道那天发生了什么！', low: '走廊尽头的教室里，二十四个人都在往门外看。', ids: ['aunt'] }); kCpAt(S, 'aunt'); S.f.chase = true; S.goal('她手里有刀。往回跑——把她引到最后那间教室门口'); goAunt(S); }
  function goAunt(S) { S.chase('aunt', { spd: 2.9, catch: async S => { await S.scare('face', { face: 'axe', sfx: 'scream' }); await S.die('你被推倒在湿漉漉的地上。\n她喘着气说：“我从没想过杀人。”', '最后一间教室门外'); } }); }
  async function lure(S) {
    if (S.f.won) return; S.f.won = true; S.stop('aunt'); S.face('aunt', 3); kEpicLow(S);
    await S.narr('你跑过教室门口。她追了上来——\n经过那扇门的时候，她突然摔倒了。'); await S.wait(900);
    await S.narr('门上的玻璃后面，二十四张脸，都在看她。\n她也看见了：那些低着头的孩子，像极了她哥哥拿回家的那张合照。'); await S.wait(800); S.dread(1);
    await S.say('aunt', '……我哥有那种癖好。被发现以后，他说有东西缠上了他，要报复他。嫂子要报警。');
    await S.say('aunt', '那天下着这么大的雨。我到的时候，他已经把嫂子塞进了井里。我把他也推了下去。他在井里骂了我一夜。');
    await S.say('me', '你说过，你自己的丈夫孩子出事以后，是范郁画了弟弟妹妹来哄你。他是真心的。');
    if (KENV.flags.fanyu === 0) await S.narr('你把范郁画给你的那张画递过去。黑房子，红色的小人，两个黑色的。\n她看了很久。手一直在抖。');
    S.dread(0); await S.end({ title: '最后一间教室', text: '“让这件事到此为止吧。”\n你关掉直播，报了警。' }); }

  /* =================== 深井 =================== */
  const HILL = [
    '"TPT""TTP"""TPT"P"T"""',
    '""""T""""P""""""""T"""',
    '"P""""dddddddd""P"""""',
    '""""dddddddddddd""""T"',
    '"T""dddddddddddd""""""',
    '""""""dddddddd""""P"""',
    '""P"""""dd"""""T""""""',
    '""""""""dd""""""""""""',
    '""""""""dd""""""""""""'];
  const PATH = [
    '"T""P"""T""dd"""P""T""',
    '""""""T"""dd""""""""P"',
    '"P""T"""""dd""T"""""""',
    '""""""""ddd"""""""T"""',
    '"T"""P""dd"""""P""""""',
    '""""""""dd""""""""""T"',
    '"""T"""dd"""T"""P"""""',
    '""P""""dd"""""""""""""',
    '"""""""dd"""""T"""""""',
    '""T""""dd""""""""P""""'];
  defChapter(Object.assign({}, BASE, SLOW, {
    id: 'well', n: 23, title: '深井', sub: '凌晨三点。暮阳中学后山。', origin: '暮阳中学 · 第四章', color: '#0a1a1a',
    amb: 'hill', floor: 'grass', wall: 'concrete', dark: .9, plr: 2.4, items: {}, notes: {},
    start: { map: 'path', x: 8, y: 9, dir: 3 },
    async intro(S) { await S.card('深井', '暮阳中学后山　凌晨三点', '一行人穿着雨衣，打着手电，在灌木里硬踩出一条路。\n“又是你。陈歌，你是不是在我们辖区装了雷达？”'); },
    maps: {
      path: { rows: PATH, amb: 'hill', floor: 'grass', dark: .9, storm: [9, 16],
        ents: [
          { id: 'li0', x: 9, y: 8, spr: '@li', solid: true, on: async S => S.say('li', '跟紧了。这山上白天都有人迷路。') },
          { id: 'top', x: 11, y: 0, solid: false, touch: async S => S.go('hill', 9, 8, 3) },
          { id: 'top2', x: 12, y: 0, solid: false, touch: async S => S.go('hill', 9, 8, 3) },
          { id: 'fig', x: 15, y: 3, spr: 'gh_shadow', hidden: true, alpha: .7 }],
        step(S, x, y) { if (y <= 6 && S.once('p1')) S.run(async S => { await S.say('police', '……她说的那个井，真在这上面？'); await S.say('li', '她只记得一个大致的范围。'); });
          if (y <= 3 && S.once('p2')) S.run(async S => { await S.wait(300); await kFlash(S, ['fig'], { hold: 260 }); await S.say('police', '那边……是不是站着个人？'); await S.wait(1200); await S.say('li', '是树。走。'); await S.wait(600); await S.think('那边没有树。'); S.dread(1); }); },
        async enter(S, first) { if (first) { await S.wait(500); S.goal('跟着警察上山'); } } },
      hill: { rows: HILL, amb: 'hill', floor: 'grass', storm: [12, 22],
        ents: [
          { id: 'li', x: 7, y: 5, spr: '@li', solid: true, on: async S => S.say('li', S.f.open ? '……都别出声。' : '挖。') },
          { id: 'p1', x: 12, y: 3, spr: '@police', solid: true, on: async S => dig(S) },
          { id: 'p2', x: 5, y: 3, spr: '@police', solid: true, on: async S => S.narr('“挖了一整夜了。”他抹了一把脸上的雨。') },
          { id: 'wl', x: 9, y: 3, spr: 'well', solid: true, hidden: true, on: async S => well(S) },
          { id: 'hands', x: 9, y: 4, spr: 'handprint', hidden: true }],
        async enter(S, first) { if (first) { await S.narr('山顶是一片被灌木盖住的空地。警察们已经开始挖了。'); S.goal('帮他们挖'); } } } } }));
  async function dig(S) { const n = S.f.dig = (S.f.dig || 0) + 1;
    if (n === 1) { for (let i = 0; i < 3; i++) { S.sfx('shovel'); await S.wait(700); } await S.narr('你接过一把铁锹。泥又湿又沉。'); await S.say('police', '这底下是空的。我踩着都觉得是空的。'); return; }
    if (n === 2) { for (let i = 0; i < 4; i++) { S.sfx('shovel'); await S.wait(650); } await S.narr('挖了很久。雨一直没停。'); await S.wait(800); S.sfx('breathe'); await S.narr('你喘气的时候，好像听见坑底下，也有人在喘气。'); await S.wait(900); await S.narr('你停下来。其他人还在挖。\n……是你听错了。'); S.dread(2); return; }
    if (S.f.stone) return S.narr('井盖就在那儿。');
    for (let i = 0; i < 2; i++) { S.sfx('shovel'); await S.wait(600); } S.sfx('stone'); await S.narr('铁锹「当」的一声，碰到了石头。'); await S.wait(800); await S.narr('是一块圆形的石盖。上面压着几块砖。'); S.f.stone = true; S.show('wl'); S.goal('井'); }
  async function well(S) {
    if (S.f.open) return S.narr('井口黑漆漆的。没有人往里照。');
    S.f.open = true; S.sfx('cut'); await S.narr('四个人一起，把井盖撬开。'); await S.wait(1000); S.amb('hush'); await S.wait(1500);
    await S.narr('井盖撬开的那一刻，雨停了。'); S.dread(3); await S.wait(2000);
    for (let i = 0; i < 3; i++) { S.sfx('knock'); await S.wait(1300); }
    await S.narr('井底传上来三下敲击声。很慢。\n像有人在下面，敲井壁。'); await S.wait(1500);
    S.show('hands'); await S.scare('glitch', { sfx: 'whisper' });
    await S.narr('井沿的青苔上，有几个手印。是从里面往外按的。'); await S.wait(1200); await S.narr('所有拿着铁锹的人都停了手。\n没有人说话。'); await S.wait(1600);
    S.dread(0); await S.end({ title: '深井', text: '天快亮的时候，雨又下了起来。\n玩家成功体验四条支线任务，并存活至天亮。暮阳中学试炼任务完成。' }); }

  /* =================== 看不见的客人 =================== */
  defChapter(Object.assign({}, BASE, {
    id: 'guest', n: 24, title: '看不见的客人', sub: '噩梦难度：你必须真的睡着。只要看到它的脸，任务就算成功。', origin: '恐怖屋 · 日常任务', color: '#1a1a14',
    amb: 'room', floor: 'wood', wall: 'wood', dark: .9, plr: 2.4,
    items: { rice: { name: '浸湿的白米', desc: '一小袋。' }, slip: { name: '穿过的拖鞋', desc: '你自己的。' } },
    notes: { task: { title: '日常任务 · 噩梦', text: '这个游戏叫做看不见的客人。\n午夜把浸湿的白米撒在房子周围，把一双穿过的拖鞋放在门外，床铺整理成有人熟睡的样子，你躺在床下。\n\n任务的关键是你必须真的睡着。\n只要看到它的脸，任务就算成功。' },
      bracelet: { title: '墙洞里的东西', text: '一串塑料手链，和一只压变形的千纸鹤。\n手链末端有三个歪歪斜斜的字：罗若雨。' },
      crane: { title: '千纸鹤里的字', text: '千纸鹤放了很久了。你把它拆开。\n沾着一小片血污的白纸上，写着九个字：\n\n第三病栋第三个房间\n\n字迹很像家里人的。没头没尾，只有一个地点。' } },
    start: { map: 'rest', x: 6, y: 4, dir: 3 },
    async intro(S) { await S.card('看不见的客人', '恐怖屋 · 员工休息室　午夜', '一楼卫生间那个隔间的门后面，有声音。你把它锁上了。\n然后，日常任务刷新了。'); S.give('rice', true); S.give('slip', true); },
    maps: {
      rest: { rows: ROOMR(12, 4, 'w'), amb: 'room',
        ents: [
          { id: 'door', x: 6, y: 1, spr: 'door', solid: true, on: async S => { if (S.f.slip) return S.narr('门外放着你的拖鞋。'); S.f.slip = true; S.take('slip'); S.show('sl'); await S.narr('你把穿过的拖鞋放在门外，鞋尖朝外。'); prep(S); } },
          { id: 'sl', x: 7, y: 2, spr: 'slippers', hidden: true },
          { id: 'rc', x: 3, y: 4, spr: 'rice', hidden: true }, { id: 'rc2', x: 8, y: 5, spr: 'rice', hidden: true }, { id: 'rc3', x: 5, y: 2, spr: 'rice', hidden: true },
          { id: 'bed', x: 9, y: 2, spr: 'bed', solid: true, col: '#6a5a7a', on: async S => bed(S) },
          { id: 'cd', x: 11, y: 2, spr: 'candle', hidden: true, light: { r: 2, col: 'rgba(255,190,110,.2)', flick: true } },
          { id: 'cab', x: 2, y: 2, spr: 'cabinet', solid: true, on: async S => { if (S.f.cd) return S.narr('抽屉里还有两根白蜡。'); S.f.cd = true; S.show('cd'); S.sfx('match'); await S.narr('你点了一根白蜡，放在床头。'); prep(S); } },
          { id: 'fl', x: 1, y: 4, spr: 'footprints', hidden: true }, { id: 'f2', x: 4, y: 4, spr: 'footprints', hidden: true }, { id: 'f3', x: 7, y: 4, spr: 'footprints', hidden: true },
          { id: 'ry', x: 8, y: 3, spr: '@ruoyu', hidden: true, alpha: .6 },
          { id: 'tbl', x: 4, y: 3, spr: 'table', solid: true, on: async S => { if (S.f.rice) return S.narr('白米撒好了。'); S.f.rice = true; S.take('rice'); for (const k of ['rc', 'rc2', 'rc3']) S.show(k); S.sfx('paper'); await S.narr('你把浸湿的白米，沿着墙根撒了一圈。'); prep(S); } },
          { id: 'tsk', x: 10, y: 5, spr: 'phone', on: async S => S.note('task') }],
        async enter(S, first) { if (first) { await S.note('task'); S.goal('撒白米、门外放拖鞋、点蜡烛、整理床铺'); } } },
      park: { rows: ['################', '################', 'xxxxxxxxxxxxxxxx', 'xxxxxxxxxxxxxxxx', 'xxxxxxxxxxxxxxxx', '################'], amb: 'drone', floor: 'concrete', dark: .92,
        ents: [
          { id: 'ry2', x: 12, y: 3, spr: '@ruoyu', hidden: true, alpha: .5 },
          { id: 'hole', x: 13, y: 1, spr: 'hole', on: async S => hole(S) }],
        async enter(S, first) { if (!first) return; S.show('ry2'); await S.narr('你跟着那道影子，一直走到地下。'); await S.walk('ry2', [13, 2], 2); await S.alpha('ry2', 0, 600); S.hide('ry2'); S.goal('墙角有一个洞'); } } } }));
  function prep(S) { if (S.f.rice && S.f.slip && S.f.cd && !S.f.ready) { S.f.ready = true; S.goal('枕头塞进被子里，钻到床下'); } }
  async function bed(S) {
    if (!S.f.ready) return S.narr('还没准备好。');
    if (S.f.under) return;
    S.f.under = true; S.sfx('paper'); await S.narr('枕头塞进被子里，鼓起来，像有人蜷着睡。\n然后你钻到了床下。');
    S.hidePlayer(true); S.plr(.8); S.focus(6, 4); S.dark(.95);
    await S.narr('任务的关键，是你必须真的睡着。\n你闭上眼，数自己的呼吸。');
    await S.fade(.9, 900); await S.wait(800); await S.fade(.5, 400);
    S.sfx('thud'); await S.narr('化妆间的面具掉在了地上。门关上的声音。');
    let peek = 0;
    S.show('fl'); S.sfx('step'); if (await S.ask('地上的白米，一粒一粒被踩开。', ['睁眼看', '继续装睡'])) { } else { peek++; await S.narr('你睁开一条缝。只看见白米上，多了一个脚印。很小。\n脚步声停了。它在等你再睡着。'); }
    S.show('f2'); S.show('f3'); S.sfx('step'); S.shake(200, 1);
    if (await S.ask('它停在了床边。\n床板压低了一点——有什么东西，坐在了你头顶的床上。', ['睁眼看', '继续装睡'])) { } else { peek++; await S.narr('床板一下子不压了。\n过了很久，才又一点一点压下来。'); }
    S.ent('sl').turn = true; S.sfx('paper');
    const r = await S.ask('门外那双拖鞋，鞋尖转向了休息室。\n床上的东西，在摆弄枕头旁边的布偶。', ['现在——睁眼', '不看']);
    if (r === 0 && peek < 2) { S.show('ry'); await S.fade(0, 300); await S.narr('你看见了。\n不是一张吓人的脸。是一个小女孩的影子。她把枕头旁边的布偶摆正，才往外走。'); S.f.k_saw = 1; }
    else { await S.fade(0, 300); await S.narr('你没敢看。\n但布偶从床上掉下来，滚到了你手边——像有人递给你的。'); }
    S.hidePlayer(false); S.plr(null); S.focus(null); S.dark(null); S.hide('ry');
    await S.narr('地上的白米被踢散了。脚印一路往外，往楼下去了。'); S.goal('跟着脚印');
    S.f.follow = true; S.ent('door').on = async S => S.go('park', 2, 3, 2); }
  async function hole(S) {
    if (S.f.h) return S.narr('洞里空了。');
    S.f.h = true; await S.narr('墙角有一个只容四根手指伸进去的洞。'); await S.note('bracelet');
    await S.think('姓罗……罗董的女儿？她成了这座乐园的守护灵。所以布偶只在乐园里有用。');
    await S.note('crane');
    await S.end({ title: '看不见的客人', text: '第三病栋。手机自带的唯一一个三星场景。\n……现在去，是送死。先留着。' }); }

  /* =================== 门楠的梦 =================== */
  defChapter(Object.assign({}, BASE, {
    id: 'dream', n: 25, title: '门楠的梦', sub: '走廊。很多一样的门。门上都没有号码。', origin: '特殊游客 · 第四章', color: '#141a14',
    amb: 'otherworld', floor: 'linoleum', wall: 'plain', dark: .9, plr: 2.2, icon: '@mn', items: {}, notes: {},
    start: { map: 'dh', x: 3, y: 3, dir: 2 },
    nodoll: true, async intro(S) { kRecallOn('dream', '梦 · 门楠的梦'); S.wear('@mn'); await S.card('门楠的梦', '（门楠说的）', '我一直做同一个梦。\n梦里有个人，离我越来越近。\n\n我不敢跑。好像一跑，他就会知道我在怕他。'); },
    tick(S, dt) { if (!S.f.go || S.busy || S.f.done) return;
      const p = S.pl; if (S.running && !S.f.run) { S.f.run = true; S.run(async S => { await S.narr('你跑了起来。\n身后的脚步声，也跑了起来。'); S.chase('fig', { spd: 6, catch: wake }); }); return; }
      const back = p.dir === 1; if (back && !S.f.back) { S.f.looks = (S.f.looks || 0) + 1; const f = S.ent('fig'), nx = Math.max(f.x, p.x - Math.max(2, 9 - S.f.looks * 2)); S.place('fig', nx, 3, 2); S.sfx('step'); if (p.x - nx <= 2) { S.f.done = true; S.run(wake); } }
      S.f.back = back; S.f.t = (S.f.t || 0) + dt; if (S.f.t > 4) { S.f.t = 0; S.sfx(Math.random() < .5 ? 'step' : 'whisper'); } },
    maps: {
      dh: { rows: HALL(40), amb: 'otherworld',
        ents: [
          ...Array.from({ length: 9 }, (_, i) => ({ id: 'd' + i, x: 4 + i * 4, y: 1, spr: 'door', solid: true, on: async S => S.narr(['门上没有号码。', '门上没有号码。门把手是温的。', '门里有人在哭。是你自己的声音。', '门上没有号码。', '门缝下面有光。你一靠近，光就灭了。', '门上没有号码。', '这扇门你刚才走过。你确定。', '门里有人在敲门。', '门上没有号码。'][i]) })),
          { id: 'end', x: 38, y: 2, spr: 'door', solid: true, on: async S => { S.f.done = true; await wake(S); } },
          { id: 'fig', x: 1, y: 3, spr: 'gh_slender', solid: true, light: KGLOW }],
        async enter(S, first) { if (first) { S.goal('往前走。别跑。（每回一次头，他就近一扇门）'); S.f.go = true; } } } } }));
  const wake = async S => { S.f.done = true; S.stop('fig'); kRecallOff(); S.f.k_looks = S.f.looks || 0;
    await S.fade(1, 500); await S.narr('……你睁开眼。'); await S.fade(.6, 400);
    await S.scare('face', { face: 'slender', sfx: 'sting' });
    await S.narr('床边站着一个人。低着头，在看你。\n他的脸……想不起来。可你知道，你认识他。');
    await S.end({ title: '门楠的梦', text: '“我小时候……曾听他们说过一个词，‘第三病栋’。我不知道那是哪。”' }); };

  /* =================== 三个人的房间（海明公寓 303） =================== */
  defChapter(Object.assign({}, BASE, {
    id: 'haiming', n: 26, title: '三个人的房间', sub: '午夜之前抵达海明公寓，找出特殊游客的病因。', origin: '海明公寓 · 第四章', color: '#1a141a',
    amb: 'room', floor: 'wood', wall: 'plain', dark: .88, plr: 2.4, items: { key: { name: '生锈的钥匙', desc: '自知力钥匙。' } },
    notes: { wall: { title: '302 隔着墙听见的', text: '303 以前住的人叫王海明。\n我听见过他屋里两个声音吵架。可那屋里，从来只住着他一个人。\n\n其中一个说：要不是怕被“红衣”发现，宁死也不跟一个垃圾共存。' } },
    start: { map: 'ap', x: 2, y: 3, dir: 2 },
    async intro(S) { await S.card('三个人的房间', '海明公寓　晚上十一点', '门楠' + (KENV.flags.mennan === 1 ? '和高医生' : '') + '在楼下等。\n任务的名字，本身就是提示。门楠算一个，梦里的人算一个。第三个……'); },
    maps: {
      ap: { rows: HALL(16), amb: 'tv',
        ents: [
          { id: 'd301', x: 4, y: 1, spr: 'door', solid: true, on: async S => { S.f.a = 1; await S.say('uncle', '带着你朋友走吧。303 死过人。出事以后，那屋再没租出去过。这地方不是谁都能住的。'); } },
          { id: 'd302', x: 8, y: 1, spr: 'door', solid: true, on: async S => { S.f.b = 1; await S.narr('302 的年轻人，隔着门缝说话。');
            await kRecall(S, 'tale', '302 隔着墙听见的', { map: 'h303p', x: 1, y: 2, focus: [6, 3] }, async S => {
              await S.narr('“303 以前住的人叫王海明。我听见过他屋里两个声音吵架。”'); S.sfx('whisper');
              S.face('hm', 2); await S.say('', '你出去！这是我的身体！', { style: 'whisper' }); S.face('hsh', 1);
              await S.say('', '要不是怕被红衣发现，我宁死也不跟一个垃圾共存。', { style: 'whisper' }); await S.scare('glitch', { sfx: 'sting' });
              await S.narr('“可那屋里，从来只住着他一个人。”'); });
            await S.think('红衣？……张雅后面写的，是“红衣厉鬼”。'); } },
          { id: 'd303', x: 12, y: 1, spr: 'door', solid: true, on: async S => { if (!S.f.b) return S.narr('303。门上的封条撕了一半。先问问邻居。'); S.sfx('open'); await S.go('r303', 10, 4, 1); } }],
        async enter(S, first) { if (first) S.goal('三楼。先问问邻居'); } },
      h303p: { rows: ROOMR(14, 4, 'w'), amb: 'none', dark: .7, ents: [{ id: 'hm', x: 5, y: 3, spr: '@hm', solid: true }, { id: 'hsh', x: 7, y: 3, spr: 'gh_twoface', light: KGLOW }, { id: 'hmr', x: 3, y: 1, spr: 'mirror' }, { id: 'hcd', x: 6, y: 2, spr: 'candle', light: { r: 1.8, col: 'rgba(255,190,110,.2)', flick: true } }] },
      r303: { rows: ROOMR(14, 4, 'w'), amb: 'none', dark: .92,
        ents: [
          { id: 'out', x: 12, y: 1, spr: 'door', solid: true, on: async S => S.narr('门楠在外面等。') },
          { id: 'mr', x: 3, y: 1, spr: 'mirror', on: async S => mirror(S) },
          { id: 'sk', x: 2, y: 2, spr: 'sink', solid: true, on: async S => S.narr('卫生间的镜子，正对着卧室。卧室没有门。') },
          { id: 'frame', x: 7, y: 2, spr: 'curtain', on: async S => S.narr(S.f.m ? '真正的门框——空的。' : '卧室的门框。门被人卸掉了。') },
          { id: 'seat', x: 10, y: 3, spr: 'chair', solid: true, on: async S => sit(S) },
          { id: 'hd', x: 3, y: 1, spr: 'handprint', hidden: true },
          { id: 'tf', x: 6, y: 3, spr: 'gh_twoface', hidden: true, solid: true, light: KGLOW },
          { id: 'ky', x: 6, y: 4, spr: 'key', hidden: true, on: async S => { S.hide('ky'); S.give('key'); await S.narr('地上留下一把生锈的钥匙。'); await S.end({ title: '三个人的房间', text: '门楠说：我……想起来一点。我是在一所医院里出生的。' }); } },
          { id: 'raise', x: 1, y: 1, hidden: true, solid: false, on: async S => redShoes(S) }],
        tick(S, dt) { const r = S.ent('raise'); r.hidden = !(S.f.chase && !S.f.won && kHas('shoes')); if (!r.hidden) S.place('raise', S.pl.x, S.pl.y);
          if (S.f.chase && !S.f.won) { if (S.pl.x >= 10) { S.f.safe = (S.f.safe || 0) + dt; if (S.f.safe > 1.5) { S.f.won = true; S.run(retreat); } } else S.f.safe = 0; } },
        async enter(S, first) { if (first) { await S.narr('303。你关了灯，坐在镜子照不到的地方。'); S.goal('坐在门口那把椅子上，等'); } } } },
    resume: { tf: async S => { S.f.won = false; S.f.chase = true; S.show('tf'); S.place('tf', 5, 3, 2); goTf(S); } } }));
  async function sit(S) {
    if (S.f.sat) return S.narr('……');
    S.f.sat = true; S.ent('mr').lag = .6; await S.fade(.9, 700); await S.wait(500); await S.fade(0, 500);
    await S.narr('半夜。'); S.goal('瞥一眼镜子'); }
  async function mirror(S) {
    if (!S.f.sat) return S.narr('镜子里照着卧室。卧室门框后面，什么都没有。');
    if (!S.f.m) { S.f.m = 1; S.sfx('whisper'); await S.scare('glitch', { sfx: 'sting' }); await S.narr('镜子里的卧室门框后面，多了一道影子。'); return S.goal('去看看真正的门框'); }
    if (S.f.m === 1) { S.f.m = 2; S.show('hd'); await S.narr('再看镜子。它离镜面近了一点。\n玻璃上，从里面按上来一只手印。');
      S.show('tf'); S.place('tf', 6, 3, 2); await S.scare('face', { face: 'slender', sfx: 'scream' });
      await S.narr('卧室门框后面，立着一道高瘦的黑影。它长着两张不同的脸。\n两张脸在互相咒骂。它们并不是一条心。');
      S.ent('mr').smile = true; await kEpic(S, { name: '两张脸的黑影', sub: '三个人的房间', seal: '镜', intro: ['王海明从“那个地方”带出来的东西。', '它一直躲在镜子里，等门楠睡着。', '——它也在怕着什么。'], phase: '（其中一张脸在喊：别把红衣引来！）', low: '钥匙在你口袋里发烫。生了锈的那一把。', ids: ['tf'] }); kCpAt(S, 'tf', 9, 4, 1); S.f.chase = true;
      S.goal(kHas('shoes') ? '它不敢离开镜子太远——退到门口去。（口袋里有张雅的舞鞋）' : '它不敢离开镜子太远——退到门口去'); goTf(S); return; }
    S.narr('镜子里只有你。'); }
  function goTf(S) { S.chase('tf', { spd: 2.9, zone: (x, y) => x <= 8, catch: async S => { await S.scare('face', { face: 'slender', sfx: 'scream' }); await S.die('两张脸同时贴了上来。\n一张在哭，一张在笑。', '303 房'); } }); }
  async function retreat(S) { S.stop('tf'); kEpicLow(S); S.ent('mr').smile = false; await S.narr('它停在了门框边，没有追出来。\n它不敢离开镜子太远。'); await S.narr('其中一张脸在喊：别把红衣引来！'); await S.alpha('tf', 0, 600); S.hide('tf'); S.show('ky'); S.goal('地上有东西'); }
  async function redShoes(S) { if (S.f.won) return; S.f.won = true; S.stop('tf'); kEpicLow(S); S.ent('mr').smile = false; await S.narr('你把那双黑红色的舞鞋举了起来。'); await S.narr('两张脸同时尖叫：别把红衣引来！\n它缩回了镜子里，镜面晃了几下，平了。'); S.hide('tf'); S.show('ky'); S.goal('地上有东西'); }

  /* =================== 二十四个人偶 =================== */
  defChapter(Object.assign({}, BASE, {
    id: 'doll24', n: 27, title: '二十四个人偶', sub: '为二十四个名字，制作出寄托残念的人偶。', origin: '恐怖屋 · 第四章', color: '#1a1a2a',
    amb: 'room', floor: 'wood', wall: 'wood', dark: .86, plr: 2.6, items: {},
    notes: { names: { title: '二十四个名字', text: '最后一间教室的点名册。\n二十四个名字，每一个你都缝在了人偶胸口。\n\n郊游那天，带好雨衣。' } },
    start: { map: 'wk', x: 6, y: 5, dir: 3 },
    async intro(S) { await S.card('二十四个人偶', '恐怖屋 · 道具间　深夜', '你用了两个晚上，做了二十四个人偶。\n今晚，是最后几个。'); },
    maps: {
      wk: { rows: ROOMR(14, 4, 'w'), amb: 'room',
        ents: [
          { id: 'wb', x: 6, y: 3, spr: 'workbench', solid: true, on: async S => sew(S) },
          { id: 'rw', x: 3, y: 2, spr: 'dollrow', n: 5, solid: true, on: async S => count(S) },
          { id: 'rw2', x: 9, y: 2, spr: 'dollrow', n: 5, solid: true, on: async S => count(S) },
          { id: 'rw3', x: 11, y: 2, spr: 'dollrow', n: 5, solid: true, on: async S => count(S) },
          { id: 'rw4', x: 1, y: 4, spr: 'dollrow', n: 5, solid: true, on: async S => count(S) },
          { id: 'ex', x: 12, y: 4, spr: 'doll', hidden: true, col: '#3e4e6e', on: async S => S.narr('这一个……胸口没有名字。') },
          { id: 'nm', x: 8, y: 5, spr: 'paper', on: async S => S.note('names') }],
        async enter(S, first) { if (first) S.goal('把最后几个缝完（工作台）'); } } } }));
  async function sew(S) {
    if (S.f.sewn) return S.narr('缝完了。二十四个。');
    S.f.sewn = true; S.sfx('tear'); await S.narr('针脚一针一针。最后一个名字缝完，你剪断了线。');
    await S.narr('做到第二十个的时候，你就想停下来数一数。现在都做完了。'); S.goal('数一数桌上的人偶'); }
  async function count(S) {
    if (!S.f.sewn) return S.narr('一排人偶，胸口缝着名字。');
    S.f.c = (S.f.c || 0) + 1;
    if (S.f.c === 1) { S.show('ex'); S.sfx('whisper'); await S.narr('你数了一遍。\n二十五个。'); return S.goal('再数一遍'); }
    if (S.f.c === 2) { S.plr(.2); await S.wait(300); S.hide('ex'); S.plr(null); await S.narr('你又数了一遍。二十四个。'); const r = await S.ask('', ['再数一遍', '不数了']); if (r === 0) { S.show('ex'); S.place('ex', S.pl.x + (S.pl.x < 12 ? 1 : -1), S.pl.y, 2); await S.scare('face', { face: 'child', sfx: 'sting' }); await S.narr('二十五个。\n多出来的那一个，就坐在你脚边。'); S.hide('ex'); }
      await S.end({ title: '二十四个人偶', text: '你没敢再数。\n第二天早上，二十四个人偶的脸，全都朝着暮阳中学的方向。' }); } }
})();
