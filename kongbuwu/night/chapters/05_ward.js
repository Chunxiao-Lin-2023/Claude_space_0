/* ================= 第五章 · 第三病栋：第一病栋、洗衣间、被褥走廊、院长办公室、门、四楼、门后、三号病房 =================
   剧情按原著改写；病人和怪物一律用通用像素原型。 */
(() => {
  const SPR5 = {
    cage(g, e, t, R) { R(1, 2, 14, 13, 'rgba(20,20,20,.35)'); for (let x = 1; x <= 15; x += 3) R(x, 1, 1, 14, e.bent && x > 7 ? '#5a4a3a' : '#6a6a6e'); R(1, 1, 15, 1, '#7a7a7e'); R(1, 14, 15, 1, '#7a7a7e');
      if (e.who === 'food') { R(5, 10, 6, 3, '#b08050'); R(4, 13, 3, 1, '#6a8aaa'); } else if (e.who) { const c = { old: '#8a8a80', woman: '#7a3a5a', xu: '#4a4a5a' }[e.who]; R(5, 4, 6, 5, '#d8c0a8'); R(4, 3, 8, 2, e.who === 'old' ? '#d0d0cc' : '#1a1414'); R(4, 9, 8, 5, c); } },
    cat(g, e, t, R) { const b = e.mv ? Math.sin(t * 18) : 0; R(4, 9 + b * .5, 9, 4, '#ece8e0'); R(11, 6, 4, 4, '#ece8e0'); R(11, 5, 1, 2, '#ece8e0'); R(14, 5, 1, 2, '#ece8e0'); R(12, 7, 1, 1, '#3a7ad8'); R(14, 7, 1, 1, '#d8b03a'); R(2, 8, 2, 2, '#ece8e0'); R(5, 13, 1, 2, '#ddd'); R(10, 13, 1, 2, '#ddd'); },
    washer(g, e, t, R) { const s = e.spin ? Math.sin(t * 40) : 0; box(R, 1 + s * .6, 1, 14, 14, '#c8c8c0'); R(4 + s * .6, 4, 8, 8, '#2a3a4a'); R(6 + s * .6, 6, 4, 4, e.spin ? '#5a6a7a' : '#3a4a5a'); R(3, 2, 3, 1, '#8a8a80'); },
    quilt(g, e, t, R) { if (e.open) { R(0, 12, 16, 4, '#8a8a7a'); return; } R(-6, 2, 28, 13, '#9a9a8a'); R(-4, 3, 24, 2, '#aaa99a'); R(2, 1, 4, 3, '#9a9a8a'); R(12, 1, 4, 3, '#9a9a8a'); },
    tallshelf(g, e, t, R) { if (e.down) { R(-2, 8, 20, 6, '#5a4a3a'); R(0, 9, 4, 3, '#d8d8d0'); R(8, 9, 5, 3, '#c8c0b0'); return; } box(R, 1, -14, 14, 29, '#5a4a3a'); for (let y = -11; y < 13; y += 6) { R(2, y, 12, 1, '#3a2a1a'); R(3, y - 3, 4, 3, '#d8d8d0'); R(9, y - 3, 4, 3, '#c8c0b0'); } },
    lens(g, e, t, R) { R(6, 11, 4, 3, '#1a1a1a'); R(7, 12, 2, 1, Math.sin(t * 4) > 0 ? '#e02020' : '#3a0a0a'); },
    dummy(g, e, t, R) { const up = e.up ? -4 : 0; R(-2, 6 + up, 20, 9 - up, '#7a7a6a'); R(0, 7 + up, 16, 2, '#8a8a7a'); if (e.up) R(5, 0, 6, 6, '#7a7a6a'); },
    door3(g, e, t, R) { const gap = Math.min(10, e.gap || 0); box(R, 0, -10, 16, 25, e.red ? '#6a0a0a' : '#5a4030'); R(1, -9, 14, 23, e.red ? '#7a1010' : '#6a4a34'); if (gap) R(14 - gap, -9, gap, 23, '#050202'); if (gap > 2) { R(15 - gap, 0, 3, 3, '#2a1a10'); R(14 - gap, 2, 2, 4, '#3a2a1a'); } R(2, -2, 2, 2, '#c9a35a'); if (e.blood) { R(4, 10, 6, 5, '#5a0606'); R(6, 13, 2, 3, '#3a0404'); } },
    seal(g, e, t, R) { R(3, -6 + (e.up ? -2 : 0), 10, 3, '#e8e0c8'); R(5, -5 + (e.up ? -2 : 0), 6, 1, '#a02020'); },
    letters(g, e, t, R) { for (let i = 0; i < 4; i++) { R(2 + i * 3, 8 - i, 7, 5, '#e8e0d0'); R(2 + i * 3, 8 - i, 7, 1, '#c8a0a0'); } },
    redbed(g, e, t, R) { box(R, 1, -2, 14, 30, '#3a0606'); R(3, -1, 10, 5, '#d8c8c8'); R(2, 6, 12, 18, '#6a0a0a'); if (!e.empty) { R(5, 0, 6, 5, '#e8d0c0'); R(4, -1, 8, 2, '#1a1010'); } },
  };
  const PEOPLE = { me: KP.chen, liu: KP.liudao || KP.police, boy: Object.assign({}, KP.boy || KP.fanyu, { top: '#8a0a0a', bottom: '#5a0606' }), xu: KP.patient || KP.student };
  const BASE = { people: PEOPLE, faces: KFACES, sprites: SPR5, icon: '@me' };
  const HALL = w => ['#'.repeat(w), '#'.repeat(w), '#' + 'n'.repeat(w - 2) + '#', '#' + 'n'.repeat(w - 2) + '#', '#' + 'n'.repeat(w - 2) + '#', '#'.repeat(w)];
  const ROOMR = (w, h, c) => ['#'.repeat(w), '#'.repeat(w), ...Array(h).fill('#' + c.repeat(w - 2) + '#'), '#'.repeat(w)];
  const catEnt = (x, y) => ({ id: 'cat', x, y, spr: 'cat', solid: false, on: async S => S.narr(['白猫一只眼睛蓝，一只眼睛黄。它盯着走廊尽头，一动不动。', '白猫冲你哈了一口气。不是冲你——是冲你身后。', '白猫跳上你的肩膀，爪子抓得很紧。'][(S.f.catN = ((S.f.catN || 0) + 1) % 3)]) });
  const withCat = S => { S.follow('cat', true); };

  /* =================== 第一病栋 =================== */
  defChapter(Object.assign({}, BASE, {
    id: 'ward', n: 28, title: '精神疾病康复中心', sub: '晚上十一点。第一病栋的门锁是坏的。', origin: '第三病栋 · 第五章', color: '#1a2a2a',
    amb: 'wind', floor: 'linoleum', wall: 'school', dark: .9, plr: 2.4, items: {},
    notes: { hair: { title: '护士台的木板', text: '木板上钉着一绺一绺的头发。\n旁边写着很小的字：\n\n“一号的。二号的。三号没有。四号的。五号的……”\n\n写到一半就乱了。' } },
    start: { map: 'b1', x: 2, y: 3, dir: 2 },
    async intro(S) { await S.card('精神疾病康复中心', '第三精神疾病康复中心　晚上十一点', '刘刀的人在大门外扎了帐篷。\n“顶不住就往回跑。路上做标记。”\n\n三栋病楼品字排开。第三栋在最里面，背阴。'); },
    maps: {
      b1: { rows: HALL(22), amb: 'wind',
        ents: [
          { id: 'door', x: 1, y: 2, spr: 'door', solid: true, on: async S => { if (!S.f.n) return S.narr('门口。卡簧崩断——暴力开锁，近期的事。'); S.sfx('locked'); await S.narr('铁门被人从外面锁上了。'); await S.think('二楼的窗户没装防盗网。暂时没必要报警。'); S.goal('上二楼，从窗户出去'); S.f.locked = true; } },
          { id: 'k1', x: 9, y: 2, spr: 'cage', who: 'food', solid: true, on: async S => cages(S) }, { id: 'k2', x: 11, y: 2, spr: 'cage', who: 'food', solid: true, on: async S => cages(S) },
          { id: 'ns', x: 14, y: 2, spr: 'counter', solid: true, on: async S => { S.f.h = 1; await S.note('hair'); chk(S); } },
          { id: 'wn', x: 17, y: 1, spr: 'window', on: async S => win(S) },
          ...[4, 7, 19].map((x, i) => ({ id: 'r' + i, x, y: 1, spr: 'door', solid: true, open: true, on: async S => S.narr(['病房的门开着。床上的约束带被剪断了。', '病房的门开着。墙上用指甲刻着一个日历，最后一天被圈了起来。', '病房的门开着。床底下塞着一双拖鞋，鞋尖朝外。'][i]) })),
          { id: 'up', x: 20, y: 2, spr: 'stairsup', solid: false, touch: async S => { if (!S.f.locked) return S.narr('先看看一楼。'); await S.end({ title: '第一病栋', text: '二楼的窗口没有防盗网。你翻出去，落在了通往第二病栋的连廊上。' }); } },
          catEnt(3, 3)],
        async enter(S, first) { if (first) { withCat(S); S.goal('一楼所有房间的门都开着。护士站附近看看'); } } } } }));
  async function cages(S) { if (S.f.c) return S.narr('笼外的两碗水，水面在晃。'); S.f.c = 1; await S.narr('护士站里放着两个钢筋焊的铁笼，像狗市里的那种。\n笼子里是煮熟的鸡和鸭，肉已经发硬。笼外摆着两碗水。'); await S.think('有人在这里“养”着什么。楼里不止我一个。'); chk(S); }
  async function win(S) { if (S.f.w) return S.narr('二楼的窗口空着。'); S.f.w = 1; S.sfx('cry'); await S.narr('白猫突然对着窗户叫。你推开窗，往楼上看。'); await S.scare('face', { face: 'slender', sfx: 'sting' }); await S.narr('二楼的窗口，有一张脸正朝下看着你。两边不太对称。\n你再看的时候，没有了。'); chk(S); }
  function chk(S) { if (S.f.c && S.f.h && S.f.w && !S.f.n) { S.f.n = true; S.goal('回门口'); } }

  /* =================== 两碗水（洗衣间） =================== */
  defChapter(Object.assign({}, BASE, {
    id: 'laundry', n: 29, title: '两碗水', sub: '午夜零点半。第二病栋三楼，洗衣间。', origin: '第三病栋 · 第五章', color: '#2a2a1a',
    amb: 'room', floor: 'tile', wall: 'tile', dark: .9, plr: 2.4, items: { lens: { name: '手腕上的小镜头', desc: '刘刀给的。' } },
    notes: { xu: { title: '许童说的', text: '“王海明……他住过三号房。那是禁闭室，也叫电休克治疗室。\n通电以后，他说他看见屋子里有四个人。\n有个‘魔鬼’说可以帮他出去。他答应了。在卫生间里，对着镜子。”\n\n王海明带出去的镜鬼，王声龙肩膀上的高个子——连鬼，都不愿意待在那栋楼里。' } },
    start: { map: 'ld', x: 3, y: 4, dir: 2 },
    async intro(S) { S.give('lens', true); await S.card('两碗水', '第二病栋　午夜零点半', '越靠近第三病栋，那股臭味越浓。\n楼上有一台洗衣机自己转了起来。滚筒撞在铁皮上，一下，一下。'); },
    maps: {
      ld: { rows: ROOMR(16, 4, '+'), amb: 'room',
        ents: [
          { id: 'door', x: 2, y: 1, spr: 'door', solid: true, on: async S => S.narr(S.f.done ? '门外没有声音了。' : '洗衣间的门。') },
          { id: 'wm', x: 5, y: 2, spr: 'washer', spin: true, solid: true, on: async S => { if (!S.f.k) return S.narr('洗衣机里只有一只鞋。鞋带系着死结。'); if (S.f.barr) return S.narr('洗衣机顶在门后。'); S.f.barr = true; S.place('wm', 3, 2); S.sfx('thud'); await S.narr('你把洗衣机推到门后。'); go2(S); } },
          { id: 'q', x: 12, y: 3, spr: 'quilt', solid: true, on: async S => quilt(S) },
          { id: 'k1', x: 10, y: 3, spr: 'cage', who: 'old', solid: true, hidden: true, on: async S => talk(S, 0) },
          { id: 'k2', x: 12, y: 3, spr: 'cage', who: 'woman', solid: true, hidden: true, on: async S => talk(S, 1) },
          { id: 'k3', x: 14, y: 3, spr: 'cage', who: 'xu', solid: true, hidden: true, on: async S => talk(S, 2) },
          { id: 'sh', x: 7, y: 2, spr: 'tallshelf', solid: true, on: async S => topple(S) },
          { id: 'ln', x: 4, y: 5, spr: 'lens', hidden: true },
          { id: 'xq', x: 2, y: 2, spr: 'gh_deformed', hidden: true, solid: true, light: KGLOW }, { id: 'oa', x: 2, y: 3, spr: 'gh_onearm', hidden: true, solid: true, light: KGLOW },
          catEnt(4, 5)],
        async enter(S, first) { if (first) { withCat(S); await S.narr('霉味。墙边一床被子，盖着什么东西。'); S.goal('被子下面……'); } } } },
    resume: { fight: async S => { S.f.down = false; S.ent('sh').down = false; S.show('xq'); S.show('oa'); S.place('xq', 2, 2, 2); S.place('oa', 2, 3, 2); goPsy(S); } } }));
  async function quilt(S) {
    if (S.f.k) return; S.f.k = true; S.ent('q').open = true; S.sfx('tear'); S.hide('q'); ['k1', 'k2', 'k3'].forEach(k => S.show(k)); S.shake(300, 2);
    await S.narr('你掀开。三个铁笼，品字摆放——像这三座病栋。');
    await S.narr('笼子里是三个人。一个老人，旁若无人地吮着手指上的油。一个女人，嘴里塞着枕头套。一个头发很长的中年男人，缩在最里面发抖。');
    S.goal('先把门堵上（洗衣机）'); }
  async function talk(S, i) {
    if (!S.f.barr) return S.narr('先把门堵上。');
    if (S.f.done) { if (i !== 2) return S.narr(['老人的牙缝里有血。', '女人盯着你的手。'][i]); if (S.f.xu) return S.narr('许童缩在笼子最里面。'); S.f.xu = true; S.ent('k3').bent = true; S.sfx('locked');
      await S.narr('你用锤子把许童那只笼子的钢筋一根一根砸弯。笼子里的空间小了四分之一。'); await S.say('xu', '你不是说不强人所难吗！！我说！'); await S.note('xu'); await S.say('me', '你该吃药了。');
      return S.end({ title: '两碗水', text: '弹幕：感谢逗比小仙女的打赏／乖乖，太真实了／人气十五万' }); }
    if (S.f.asked) return S.narr('门外有人。');
    S.f.asked = true;
    const c = await S.ask('你们被关在这里多久了？', ['先拿掉女人嘴里的枕头套', '先问那个发抖的男人']); S.f.k_cage = c;
    if (c === 0) await S.narr('女人：手……手……手……\n她只会说这一个字。看见你的手，她蹬着钢筋往后缩。');
    else await S.say('xu', '你也是他！你们都是他！别以为换了张脸我就认不出来——');
    await S.narr('你注意到了：中年男人的左手上，有一个很深的咬痕，还在流血。老人的牙缝里有血。');
    S.sfx('knock'); await S.narr('洗衣间的门被人推了一下。很轻。没想到门后有台洗衣机。');
    S.show('ln'); await S.narr('你把手腕上的小镜头摘下来，摆在正对门口的地上。\n手机屏幕里，门外站着两个人。一个只有一条手臂。另一个的脸……');
    S.sfx('thud'); S.shake(500, 3); S.place('wm', 4, 3); S.show('xq'); S.show('oa');
    await S.scare('face', { face: 'slender', sfx: 'scream' }); await S.narr('洗衣机被撞倒了。');
    kCpAt(S, 'fight'); S.goal('门边那个高架子——等他们走到架子底下，推倒它（调查架子）'); goPsy(S); }
  function go2(S) { S.goal(S.f.k ? '问问笼子里的人' : '被子下面……'); }
  function goPsy(S) { const c = async S => { await S.scare('face', { face: 'slender', sfx: 'scream' }); await S.die('他歪着头看你，像在看一幅挂歪了的画。\n“只剩半边，才顺眼。”', '洗衣间'); };
    S.chase('xq', { spd: 2.6, catch: c }); S.chase('oa', { spd: 2.4, catch: c }); }
  async function topple(S) {
    if (!S.ent('xq') || S.ent('xq').hidden || S.f.done) return S.narr('一个顶到天花板的铁架子，上面堆满了床单和消毒水。');
    const near = ['xq', 'oa'].some(k => { const e = S.ent(k); return Math.abs(e.x - 7) <= 1 && e.y >= 2 && e.y <= 4; });
    if (!near) return S.narr('还不是时候。等他们走到架子底下。');
    S.f.done = true; S.stop('xq'); S.stop('oa'); S.ent('sh').down = true; S.sfx('thud'); S.shake(700, 4);
    await S.narr('你一脚踹在架子腿上。整架床单和消毒水，砸了下去。');
    await S.narr('独臂的那个，另一条胳膊也抬不起来了。畸形脸翻窗跑向了连廊。'); S.hide('xq'); S.hide('oa');
    S.goal('问问许童'); }

  /* =================== 谁在扮演医生（被褥走廊） =================== */
  const NROUTE = [[18, 3], [12, 3], [6, 3], [3, 4], [8, 4], [16, 4]];
  defChapter(Object.assign({}, BASE, {
    id: 'b3', n: 30, title: '谁在扮演医生', sub: '凌晨一点。第三病栋。', origin: '第三病栋 · 第五章', color: '#1a1a1a',
    amb: 'drone', floor: 'linoleum', wall: 'school', dark: .92, plr: 2.2, items: { nbook: { name: '护士的笔记本', desc: '沾满污渍。' } },
    notes: { nb: { title: '柜台下的笔记本', text: '笔记本上记着的病人，有一个共同点：\n他们全都已经不在人世了。\n\n最后一页：\n“三号房的那个孩子又开始发疯了。他是第一个看见‘门’的人。”' }, dm: { title: '被褥下面', text: '下面是一个假人。\n背后写着一个名字：张启思。\n\n每一个都有名字。' } },
    start: { map: 'c', x: 2, y: 3, dir: 2 },
    async intro(S) { await S.card('谁在扮演医生', '第三病栋　凌晨一点', '连廊的铁门，锁上的铁条是被人一点一点磨断的。'); },
    tick(S) { if (S.f.go && !S.busy && !S.f.got) { kPatrol('nurse', NROUTE, 1.6); const n = S.ent('nurse'), p = S.pl; if (!n.hidden && !p.hidden) { const d = DIRS[n.dir]; const dx = p.x - n.x, dy = p.y - n.y; const see = (d[0] && Math.sign(dx) === d[0] && Math.abs(dy) <= 1 && Math.abs(dx) <= 4) || (d[1] && Math.sign(dy) === d[1] && Math.abs(dx) <= 1 && Math.abs(dy) <= 3); if (see && !S.f.cool) { S.f.cool = true; S.f.k_seen = (S.f.k_seen || 0) + 1; S.run(spotted); } } } },
    maps: {
      c: { rows: HALL(22), amb: 'drone',
        ents: [
          ...[[6, 2], [9, 4], [13, 2], [16, 4]].map(([x, y], i) => ({ id: 'f' + i, x, y, spr: 'dummy', solid: true, on: async S => dummy(S, i) })),
          { id: 'ns', x: 19, y: 2, spr: 'counter', solid: true, on: async S => counter(S) },
          { id: 'nurse', x: 18, y: 3, spr: 'gh_nurse', hidden: true, solid: true, light: KGLOW },
          { id: 'out', x: 1, y: 2, spr: 'door', solid: true, on: async S => S.f.got ? S.end({ title: '谁在扮演医生', text: '“门”太久没有关上。门后的世界，和这里叠在了一起。\n就像我鬼屋厕所里的那个隔间。' }) : S.narr('来时的铁门。') },
          ...[4, 8, 12, 16].map((x, i) => ({ id: 'rm' + i, x, y: 1, spr: 'door', solid: true, on: async S => S.narr(['病房里，床头柜上放着一袋药。名字是新写的。', '病房里有人在打呼噜。床上是空的。', '门上的观察窗被人从里面糊上了报纸。', '门把手上挂着一个输液袋，里面的液体还在滴。'][i]) })),
          catEnt(3, 4)],
        async enter(S, first) { if (first) { withCat(S); await S.narr('走廊中间扔着很多被褥，一个个隆起，像坟包。'); S.goal('挑开一床被子看看'); } } } } }));
  async function dummy(S, i) {
    if (S.f.d) return S.narr(['被子下面是假人。背后写着名字。', '这一床被子下面，也有一个名字。', '被子的隆起，比刚才高了一点。', '名字被人划掉了，旁边又写了一遍。'][i]);
    S.f.d = true; S.sfx('tear'); await S.scare('glitch', { sfx: 'sting' }); await S.note('dm');
    S.sfx('heart'); await S.wait(300); S.ent('f1').up = true;
    await S.narr('你放下被子，往前走了两步。\n身后，有一床被子的隆起，比刚才高了一点。像有什么东西，在下面坐了起来。');
    await S.narr('白猫本来对你爱答不理。进了这条走廊，它主动跳上了你的肩膀，爪子抓得很紧。');
    S.show('nurse'); await S.narr('走廊尽头有一个影子。腰是弯折的，走路没有声音。它穿着护士的衣服。');
    S.goal('护士站柜台下有本笔记本。别让她看见你（别站在她面前）'); S.f.go = true; }
  async function spotted(S) {
    S.stop('nurse'); S.face('nurse', 'pl'); S.sfx('cry');
    await S.narr('她停了一下，朝你这边偏了偏头。\n白猫的毛炸了起来。');
    await S.wait(500); await S.narr('她又转了回去。'); S.after(2500, async S => { S.f.cool = false; }); }
  async function counter(S) {
    if (!S.f.go) return S.narr('护士站。药品和记录摆得整整齐齐。你搓了搓纸药袋上的名字——墨是新的。');
    if (S.f.got) return S.narr('柜台下空了。');
    const n = S.ent('nurse'); if (Math.abs(n.x - S.pl.x) + Math.abs(n.y - S.pl.y) <= 2) return S.narr('她就在旁边发药。再等等。');
    S.f.got = true; S.give('nbook'); S.sfx('paper'); await S.note('nb'); S.f.k_sneak = S.f.k_seen ? 0 : 1;
    await S.narr(S.f.k_seen ? '你一把抓起柜台下的笔记本，退进了楼道。' : '她挨个房间发药。每一袋，都放在一个假人的枕边。\n你趁她走远，翻出了柜台下那个沾满污渍的笔记本。');
    S.goal('回连廊的铁门'); }

  /* =================== 三号房的病人（院长办公室） =================== */
  defChapter(Object.assign({}, BASE, {
    id: 'dean', n: 31, title: '三号房的病人', sub: '凌晨两点。院长办公室的台灯还亮着。', origin: '第三病栋 · 第五章', color: '#2a1a0a',
    amb: 'room', floor: 'carpet', wall: 'wood', dark: .88, plr: 2.4, items: { nbook: { name: '护士的笔记本', desc: '她是来找它的。' } },
    notes: {
      l1: { title: '第一封信', text: '二十多年前，一个男人送来一个怀孕的女人，预付了钱，再也没出现。\n女人疯得很厉害，整夜对着墙说话。\n孩子在三号病房出生。' },
      l2: { title: '第二封信', text: '孩子在病栋里长到三岁。他学什么都快得吓人。\n他把吃了药的病人叫作“玩具”。\n\n有一天，他念出了一个名字：何亚军——建楼时出意外死去的工人。没有人告诉过他。' },
      l3: { title: '第三封信', text: '“陈医生，我第一次见到这样的孩子。”\n\n母亲病愈出院。那一天，孩子的支柱倒了。\n午夜，三号房的门变成了血红色。' },
      l4: { title: '第四封信', text: '“门后面有东西在走动。还有咀嚼的声音。”\n\n“方法只有一个：让那个孩子自己进去，把门关上。”' },
      photo: { title: '信封里的合影', text: '一个没有化妆的女人，和一个孩子。\n孩子的脸，是小时候的门楠。\n\n他的第三个人格。最年幼的那一个。' } },
    start: { map: 'off', x: 2, y: 5, dir: 3 },
    async intro(S) { S.give('nbook', true); await S.card('三号房的病人', '院长办公室　凌晨两点', '台灯还亮着——这里断电好几年了。\n地上散着病例单。'); },
    maps: {
      off: { rows: ROOMR(14, 4, 'c'), amb: 'room',
        ents: [
          { id: 'door', x: 2, y: 1, spr: 'door', solid: true, on: async S => S.f.won ? S.end({ title: '三号房的病人', text: '口袋里的手机在震。\n刘刀：你快看你的直播间！三十万，还在涨！' }) : S.narr(S.f.n >= 4 ? '门外有脚步声。' : '还没看完。') },
          { id: 'ds', x: 7, y: 3, spr: 'desk', solid: true, on: async S => letters(S) },
          { id: 'lmp', x: 8, y: 2, spr: 'lamp', light: { r: 2.2, col: 'rgba(255,220,150,.22)' }, on: async S => S.narr('台灯的线，没有插头。') },
          { id: 'wd', x: 11, y: 2, spr: 'wardrobe', solid: true, on: async S => S.narr(S.f.n >= 4 ? '封条从里面被顶起了一点，又落了回去。' : '里间有一个被警方封条封住的衣柜。') },
          { id: 'sl', x: 11, y: 2, spr: 'seal' },
          { id: 'lt', x: 6, y: 3, spr: 'letters' },
          { id: 'pp', x: 4, y: 4, spr: 'paper', on: async S => S.narr('病例单上的名字，有一半被红笔圈了起来。') },
          { id: 'nurse', x: 2, y: 2, spr: 'gh_nurse', hidden: true, solid: true, light: KGLOW },
          { id: 'raise', x: 1, y: 1, hidden: true, solid: false, on: async S => giveBack(S) },
          catEnt(3, 5)],
        tick(S) { const r = S.ent('raise'); if (S.f.chase && !S.f.won) { r.hidden = false; S.place('raise', S.pl.x, S.pl.y); } else r.hidden = true; },
        async enter(S, first) { if (first) { withCat(S); S.goal('抽屉里有四封信'); } } } },
    resume: { nurse: async S => { S.f.chase = true; S.f.won = false; S.show('nurse'); S.place('nurse', 2, 2, 0); goN(S); } } }));
  async function letters(S) {
    S.f.n = (S.f.n || 0) + 1; if (S.f.n > 5) return S.narr('四封信，一张合影。');
    if (S.f.n <= 4) { await S.note('l' + S.f.n); if (S.f.n < 4) return S.goal('四封信（' + S.f.n + '/4）'); }
    if (S.f.n === 4) { S.ent('sl').up = true; S.sfx('close'); await S.narr('里间那个衣柜的封条，从里面被顶起了一点，又落了回去。'); await S.think('姓陈的医生……？'); return S.goal('信封里还夹着东西'); }
    await S.note('photo');
    S.sfx('open'); S.show('nurse'); await S.narr('办公室的门被推开了。她是来找笔记本的。');
    if (!KENV.flags.sneakNurse) await S.narr('她在走廊里的时候，就看见你了。她一进门，就直直地朝你走过来。');
    kCpAt(S, 'nurse'); S.f.chase = true; S.goal('她要的是笔记本——等她走近，还给她（调查键）'); goN(S); }
  function goN(S) { S.chase('nurse', { spd: KENV.flags.sneakNurse ? 2.4 : 2.8, catch: async S => { await S.scare('face', { face: 'dean', sfx: 'scream' }); await S.die('她的腰折成了不可能的角度。\n她在笔记本最后一页，写下了一个新的名字——你的。', '院长办公室'); } }); }
  async function giveBack(S) {
    const n = S.ent('nurse'); if (Math.abs(n.x - S.pl.x) + Math.abs(n.y - S.pl.y) > 3) return S.narr('你攥着那本笔记本。等她再近一点。');
    S.f.won = true; S.stop('nurse'); S.take('nbook');
    await S.narr('你把笔记本扔了过去。'); S.sfx('cry'); await S.narr('白猫异色的眼睛闪了一下，扑到了她脸上。\n她抱着笔记本，退进了墙里。'); S.hide('nurse'); S.goal('出去'); }

  /* =================== 门 =================== */
  defChapter(Object.assign({}, BASE, {
    id: 'door', n: 32, title: '门', sub: '凌晨两点半。一楼，三号病房的门开着一条缝。', origin: '第三病栋 · 第五章', color: '#3a0a0a',
    amb: 'drone', floor: 'linoleum', wall: 'school', dark: .92, plr: 2.2, items: {}, notes: {},
    start: { map: 'f1', x: 3, y: 3, dir: 2 },
    async intro(S) { await S.card('门', '第三病栋一楼　凌晨两点半', '臭味到了刺鼻的地步。\n十号是特制的铁门，像囚室。'); },
    tick(S, dt) { if (S.f.hold && !S.f.held) { const d = S.ent('d3'); d.gap = (d.gap || 0) + dt * (S.f.hard ? 2.6 : 1.9); S.f.ht = (S.f.ht || 0) + dt; if (d.gap >= 10 && !S.busy) { S.f.held = true; S.run(async S => { S.f.k_fail = 1; d.gap = 4; await S.narr('门被撞开一掌宽，你用肩膀硬顶了回去。\n肩膀上多了几道口子。'); await calls(S); }); } else if (S.f.ht >= 12 && !S.busy) { S.f.held = true; S.run(async S => { d.gap = 0; await S.narr('门，暂时合上了。'); await calls(S); }); } }
      if (S.f.silent && !S.busy && S.moving) { S.f.silent = false; S.run(async S => { await S.narr('你挪了一步。鞋底在地上蹭出了声音。\n怪物笑了。'); S.f.k_spoke = 1; await afterSilent(S); }); } },
    maps: {
      f1: { rows: HALL(20), amb: 'drone',
        ents: [
          { id: 'd10', x: 5, y: 1, spr: 'locker', solid: true, on: async S => S.narr('十号。特制的铁门。门上的观察窗只有一指宽，里面黑漆漆的。') },
          { id: 'd3', x: 11, y: 1, spr: 'door3', solid: true, gap: 3, on: async S => door(S) },
          { id: 'push', x: 11, y: 2, hidden: true, solid: false },
          { id: 'xq', x: 17, y: 3, spr: 'gh_deformed', hidden: true, solid: true, light: KGLOW },
          { id: 'tall', x: 18, y: 2, spr: 'gh_slender', hidden: true, solid: true, light: KGLOW },
          { id: 'up', x: 18, y: 4, spr: 'stairsup', solid: false, touch: async S => { if (!S.f.run) return S.narr('……'); await S.end({ title: '门', text: '你往楼上跑。跑出十几米，低头看了一眼手机。\n在自己的直播间里，你看到了自己的后背。\n——有“人”捡起了你掉在地上的那个镜头。他是故意把你往四楼引的。' }); } },
          { id: 'kn', x: 14, y: 3, spr: 'knife', hidden: true, on: async S => S.narr('你的杀猪刀。') },
          catEnt(2, 4)],
        async enter(S, first) { if (first) { withCat(S); S.goal('三号病房的门开着一条缝'); } } } } }));
  async function door(S) {
    const d = S.ent('d3');
    if (!S.f.touch) { S.f.touch = true; await S.narr('你伸手想把它合上。推动的时候，你听见了一种熟悉的声音——和恐怖屋厕所隔间里的，一样。'); d.blood = true; await S.narr('门板在往外渗东西。像血。');
      await S.say('', '门是一面镜子。另一边，也有“人”把手按在了门上。', { style: 'big' }); S.sfx('knock'); S.shake(400, 3); d.gap = 6;
      await S.narr('半开的门后，伸出一只长满毛发的手。');
      await S.narr(KENV.flags.cage === 0 ? '你想起铁笼里那个女人，嘴里只会重复一个字：手。——原来她见过的，是这一只。' : '许童说过，王海明在这间屋子里看见了“四个人”。现在门缝里只有一只手。');
      await S.narr('你用整个后背顶住门。'); S.f.hard = !!KENV.flags.mirrorFail; S.f.hold = true; S.goal('顶住门！（一直按调查键，把门推回去）'); return; }
    if (S.f.hold && !S.f.held) { d.gap = Math.max(0, (d.gap || 0) - 1.6); S.sfx('thud'); return; }
    S.narr('门合着。门板后面，有东西在慢慢地喘气。'); }
  async function calls(S) {
    S.f.hold = false; await S.narr('你腾出一只手，拨通了高医生的电话。');
    await S.say('me', '我需要门楠。需要他身体里最年幼的那个人格。只有他能关上这扇门。');
    await S.narr('高医生：我这就开车去找他。二十分钟。不要挂电话。');
    S.sfx('locked'); await S.narr('八号病房传来锁链滑动的声音。');
    S.show('xq'); S.show('tall'); await S.scare('face', { face: 'slender', sfx: 'scream' });
    await S.narr('畸形脸回来了。他的嘴越裂越大，后背上，浮出了第二个人头。\n他身后那东西，白布的缺口里，露出好几张人脸。');
    await S.say('', '我们来玩个游戏吧。你赢了，我就放过你。你输了，就把身体给我。\n游戏的名字叫做——看谁先开口说话。', { style: 'whisper' });
    S.goal('别出声。别动。'); S.f.silent = true;
    for (const [t, txt, opts] of [[1500, '那张脸倒悬在你眼前。', ['……', '“滚开！”']], [1500, '它凑到你耳边，学着你的声音，叫了一声：陈歌。', ['……', '“谁？”']], [1500, '它用你的声音哭了起来。哭得很像。', ['……', '“别学我！”']]]) {
      await S.wait(t); if (!S.f.silent) return; const r = await S.ask(txt, opts); if (r === 1) { S.f.silent = false; S.f.k_spoke = 1; await S.narr('你喊了出来。怪物笑了。'); return afterSilent(S); } }
    if (!S.f.silent) return; S.f.silent = false;
    const r = await S.ask('它等了很久。', ['把杀猪刀扔出去——刀柄朝着自己', '继续等']);
    if (r === 0) { S.show('kn'); await S.narr('他低头去看刀的那一下，你已经把刀捡回来，架在了他脖子上。\n他先叫出了声。'); }
    else await S.narr('等到最后，它自己先不耐烦地叫了一声。');
    await afterSilent(S); }
  async function afterSilent(S) {
    if (S.f.run) return; S.f.run = true; S.sfx('glass'); await S.narr(S.f.k_spoke ? '笔仙的笔尖，戳进了它的一只眼睛——替你抢回了一步。' : '笔仙的笔尖，戳进了怪物的一只眼睛。');
    S.hide('xq'); S.hide('tall'); S.goal('往楼上跑！'); }

  /* =================== 最后一张底牌（四楼） =================== */
  defChapter(Object.assign({}, BASE, {
    id: 'candy', n: 33, title: '最后一张底牌', sub: '凌晨三点。四楼走廊中央。', origin: '第三病栋 · 第五章', color: '#2a0a14',
    amb: 'drone', floor: 'linoleum', wall: 'school', dark: .9, plr: 2.4, items: { candy: { name: '白色情人节糖果', desc: '吃掉它，张雅就会出现。' } }, notes: {},
    start: { map: 'f4', x: 10, y: 3, dir: 0 },
    async intro(S) { S.give('candy', true); await S.card('最后一张底牌', '第三病栋四楼　凌晨三点', '前面一个。后面一个。\n楼梯口，瞎了一只眼的那个也爬了上来。'); },
    tick(S, dt) { if (!S.f.go || S.busy || S.f.done) return; S.f.t = (S.f.t || 0) + dt; if (S.f.t > 2.2) { S.f.t = 0; S.run(flick); } },
    maps: {
      f4: { rows: HALL(22), amb: 'drone',
        ents: [
          { id: 't1', x: 17, y: 3, spr: 'gh_slender', solid: true, light: KGLOW }, { id: 't2', x: 3, y: 3, spr: 'gh_slender', solid: true, light: KGLOW }, { id: 't3', x: 19, y: 2, spr: 'gh_slender', solid: true, light: KGLOW },
          { id: 'zy', x: 10, y: 2, spr: 'gh_redwoman', hidden: true, light: KRED },
          { id: 'raise', x: 1, y: 1, hidden: true, solid: false, on: async S => eat(S) },
          ...[5, 9, 13, 17].map((x, i) => ({ id: 'w' + i, x, y: 1, spr: 'door', solid: true, on: async S => S.narr('门锁着。门后有指甲刮门板的声音。') }))],
        tick(S) { const r = S.ent('raise'); if (S.f.go && !S.f.done) { r.hidden = false; S.place('raise', S.pl.x, S.pl.y); } else r.hidden = true; },
        async enter(S, first) { if (!first) return; await S.narr('三个瘦长的东西，堵住了所有出口。\n手电开始一闪一闪。每暗一下，它们就近一步。'); await S.say('弹幕', ['完了完了完了', '主播快跑啊', '这不是演的吧……'], { style: 'big' });
          await S.narr('你靠着墙，从贴身的口袋里取出了那颗糖。\n这是你的最后一张底牌。'); kCpAt(S, 'ring'); S.goal('它们每次在黑暗里靠近一步。等到最近的时候，吃掉糖（调查键）'); S.f.go = true; } } },
    resume: { ring: async S => { S.f.go = true; S.f.done = false; S.f.k = 0; S.place('t1', 17, 3, 1); S.place('t2', 3, 3, 2); S.place('t3', 19, 2, 1); S.pos(10, 3, 0); } } }));
  async function flick(S) {
    S.plr(.1); S.sfx('switch'); S.f.k = (S.f.k || 0) + 1;
    for (const id of ['t1', 't2', 't3']) { const e = S.ent(id), dx = Math.sign(S.pl.x - e.x), nx = e.x + dx * (Math.abs(S.pl.x - e.x) > 1 ? 1 : 0); if (nx !== S.pl.x || e.y !== S.pl.y) S.place(id, nx, e.y, dx < 0 ? 1 : 2); }
    await S.wait(260); S.plr(null); S.sfx('heart');
    const near = ['t1', 't2', 't3'].some(id => { const e = S.ent(id); return Math.abs(e.x - S.pl.x) + Math.abs(e.y - S.pl.y) <= 1; });
    if (near && S.f.k >= 3 && S.f.warned) { S.f.done = true; await S.scare('face', { face: 'slender', sfx: 'scream' }); await S.die('白布下面的脸，一起张开了嘴。\n它们踩着你的肩膀，又长高了一点。', '四楼'); return; }
    if (near) { S.f.warned = true; await S.narr('它就在你面前了。\n下一次手电再暗——'); } }
  async function eat(S) {
    if (S.f.done) return; const near = ['t1', 't2', 't3'].map(id => S.ent(id)).some(e => Math.abs(e.x - S.pl.x) + Math.abs(e.y - S.pl.y) <= 3);
    if (!near) return S.narr('还远。糖只有一颗。');
    S.f.done = true; S.take('candy'); await S.narr('你把糖放进嘴里。\n舌尖是甜的。背后是冷的。有人从后面抱住了你。');
    S.show('zy'); S.place('zy', S.pl.x, 2, 0); await S.scare('red', { sfx: 'scream' });
    await S.narr('十几分钟后，走廊里是一边倒的虐杀。'); for (const id of ['t1', 't2', 't3']) S.hide(id);
    await S.narr('怪物被撕碎，长廊里像下起了黑色的雪。\n张雅站在雪里，黑发吞吸着它们的怨念。她身上的红衣，越来越鲜艳了。');
    await S.think('她一个二星、三星场景出来的厉鬼，在这里虐杀三星的怪物。\n只能说明——这栋楼里，还有更可怕的。');
    await S.end({ title: '最后一张底牌', text: '手机里的声音：陈歌！我找到门楠了！' }); }

  /* =================== 他一直在门里（门后的病栋） =================== */
  defChapter(Object.assign({}, BASE, {
    id: 'inside', n: 34, title: '他一直在门里', sub: '这就是门后的世界。千万不要开口说话。', origin: '门后 · 第五章', color: '#4a0000',
    amb: 'otherworld', floor: 'redfloor', wall: 'red', dark: .78, plr: 2.6, items: {},
    notes: { roster: { title: '墙上的值班表', text: '值班表上只有一个名字，从第一天排到最后一天：\n\n陈。' }, med: { title: '护士站', text: '药品摆得整整齐齐，标签是新写的。\n名字一个也不认识。' } },
    start: { map: 'rh', x: 2, y: 3, dir: 2 },
    async intro(S) { await S.card('他一直在门里', '门后', '一样的病栋。血红色。\n被褥和假人都不见了，像一直有专人在打扫。很安静。\n\n手机没有信号。直播断了。'); },
    maps: {
      rh: { rows: HALL(24).map(r => r.replace(/n/g, 'R')), amb: 'otherworld',
        ents: [
          { id: 'ns', x: 8, y: 2, spr: 'counter', solid: true, col: '#6a1a1a', on: async S => { S.f.a = 1; await S.note('med'); voice(S, 0); } },
          { id: 'rs', x: 13, y: 1, spr: 'poster', on: async S => { S.f.b = 1; await S.note('roster'); voice(S, 1); } },
          { id: 'd3', x: 21, y: 1, spr: 'door3', red: true, gap: 4, solid: true, on: async S => { if (!(S.f.a || S.f.b)) return S.narr('三号病房的门半开着。里面有呼吸声，很轻，很慢。'); await S.narr('你走进了三号病房。'); await S.end({ title: '他一直在门里', text: '三号病房里，有一张小床。' }); } },
          ...[4, 10, 16].map((x, i) => ({ id: 'dr' + i, x, y: 1, spr: 'door3', red: true, solid: true, on: async S => S.narr(['门后有人在哼歌。每一个音，都比该有的低了半度。', '门后有人在叫你的名字。用的是你妈妈的声音。', '门上贴着一张纸：请勿喧哗。'][i]) }))],
        async enter(S, first) { if (!first) return; S.sfx('chant');
          const c = await S.ask('走廊深处，有人在哼歌。调子你没听过。', ['一句话也不说，往里走', '小声喊：“张雅？”']); S.f.k_spoke = c;
          if (c === 1) { S.shake(500, 3); await S.narr('你的声音传出去很远。\n走廊两边所有的门，同时响了一下。'); await S.narr('你闭上了嘴。可已经有东西醒了。'); }
          S.goal('别出声。一间一间往里看'); } } } }));
  async function voice(S, i) {
    if (S.f['v' + i]) return; S.f['v' + i] = true;
    const r = await S.ask(i === 0 ? '身后有人轻轻拍了拍你的肩膀：“病人，该吃药了。”' : '值班表后面，有人小声问：“你是新来的医生吗？”', ['不回答', '“……不是。”']);
    if (r === 1) { S.f.k_spoke = 1; S.sfx('whisper'); S.shake(300, 2); await S.narr('那个声音笑了：“原来不是啊。”\n墙上多了一道指甲划痕。离你的脸只有一寸。'); }
    else await S.narr('你没有回头。过了很久，那只手拿开了。'); }

  /* =================== 三号病房 =================== */
  defChapter(Object.assign({}, BASE, {
    id: 'boy', n: 35, title: '三号病房', sub: '床上睡着一个男孩。和合影里一模一样。', origin: '门后 · 第五章', color: '#5a0000',
    amb: 'otherworld', floor: 'redfloor', wall: 'red', dark: .76, plr: 2.6, items: {}, notes: {},
    start: { map: 'r3', x: 4, y: 5, dir: 3 },
    async intro(S) { await S.card('三号病房', '门后', '门楠的主人格。他在这里睡了十几年。\n你还没来得及叫醒他——'); },
    maps: {
      r3: { rows: ROOMR(14, 4, 'R'), amb: 'otherworld',
        ents: [
          { id: 'bed', x: 10, y: 2, spr: 'redbed', solid: true, on: async S => wakeBoy(S) },
          { id: 'boy', x: 10, y: 3, spr: '@boy', hidden: true, solid: true },
          { id: 'dean', x: 2, y: 2, spr: 'gh_dean', hidden: true, solid: true, light: KRED },
          { id: 'zy', x: 6, y: 3, spr: 'gh_redwoman', hidden: true, light: KRED },
          { id: 'door', x: 2, y: 1, spr: 'door3', red: true, solid: true, on: async S => S.narr('门口站着一个老人。') }],
        async enter(S, first) { if (!first) return; S.sfx('knock'); S.show('dean'); await S.scare('face', { face: 'dean', sfx: 'sting' });
          await S.narr('门口站着一个老人。穿着红色的衣服。\n你的脑子里只有两个字：红衣。');
          await S.say('', '活人？……很多年没有活人进来过了。把那个孩子交给我。', { style: 'whisper' });
          kCpAt(S, 'dean'); S.goal('叫醒床上的孩子（调查床，要叫三次）'); S.f.go = true; goDean(S); } } },
    resume: { dean: async S => { S.f.go = true; S.f.w = 0; S.f.zy = false; S.show('dean'); S.place('dean', 2, 2, 2); S.hide('zy'); goDean(S); } } }));
  function goDean(S) { S.chase('dean', { spd: 2.5, catch: async S => { if (!S.f.zy) { S.f.zy = true; S.stop('dean'); S.show('zy'); S.place('zy', S.pl.x, S.pl.y, 1); await S.narr('你被摔在血红色的地面上。\n黑发从你身后涌出来，缠住了他。'); S.place('dean', 2, 3, 2); await S.wait(300); S.hide('zy'); goDean(S); return; } await S.scare('face', { face: 'dean', sfx: 'scream' }); await S.die('他的手指像铁钳一样。\n“你把魔鬼吵醒了。”', '红衣'); } }); }
  async function wakeBoy(S) {
    if (!S.f.go || S.f.done) return S.narr('床上睡着一个男孩。');
    S.f.w = (S.f.w || 0) + 1; S.sfx('blip');
    if (S.f.w < 3) return S.narr(['你推了推他。他没醒。', '你喊不出声——在这里不能开口。你只能用力摇他。他的眼皮动了一下。'][S.f.w - 1]);
    S.f.done = true; S.stop('dean'); S.ent('bed').empty = true; S.show('boy');
    await S.narr('床上的孩子睁开了眼睛。'); await S.narr('他只做了一个动作。\n老院长重重砸在地上，身上的红衣一下子暗了下去。'); S.shake(500, 3);
    S.show('zy'); S.place('zy', 3, 3, 1); await S.narr('张雅的黑发裹住了他缺失的身体。几秒钟后，他不见了。'); S.hide('dean');
    await S.narr('男孩身上，也是一件红衣。他笑着，看了你很久。');
    await S.end({ title: '三号病房', text: '“我答应过陈医生，进了门，就一直守在这里。”' }); }
})();
