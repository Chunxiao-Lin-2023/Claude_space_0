/* ================= 第八夜 · 恩菲尔德闹鬼案 ================= */
(() => {
  /* 主题：真与假。录音机回放时会多出东西；相机定格的照片可以「走进去」看。
     孩子们装过，也有孩子们装不出来的。玩家要自己分清。
     双人分工：卧室里一人架相机、一人看着露西；停电时一人摸硬币、一人去电表；棚屋前一人问话、一人按录音键。 */
  const MUST = { face: '#a88e3e', trim: '#5a4a1e', top: '#1e1a12' };   // 芥末黄壁纸
  const knock = async (S, n, gap = 240) => { for (let i = 0; i < n; i++) { S.sfx('knock'); S.shake(90, 1); await S.wait(gap); } };
  const OLD = '露西（一个老人的声音）';
  const old = (S, t) => S.say(OLD, t, { style: 'whisper' });
  const caughtChair = async S => {
    await S.scare('face', { spr: '@oldman' });
    await S.die('那把椅子撞上了你的膝盖，你整个人跌坐进去。\n坐垫是温的。有一双干枯的手，从后面轻轻按住了你的肩膀。\n「……这是我的椅子。」', '你坐进了他的椅子');
  };
  function chairReset(S) {
    const c = S.ent('gchair_l'); if (!c) return;
    S.stop('gchair_l'); S.place('gchair_l', 1, 2, 0); c.alpha = 1;
  }
  function chairGo(S, wait = 1.6) {
    chairReset(S);
    S.chase('gchair_l', { spd: 2.75, catch: caughtChair });
    S.ent('gchair_l').chase.wait = wait;
  }
  /* 回放：一组一组地念出来 */
  const TAPE = [
    ['014', '床垫「吱呀」一声。汤米憋着笑：「嘻……嘘——」', 2, '咚、咚。', '紧接着，又是一串压不住的偷笑。'],
    ['031', '苏压低声音：「汤米，别闹了！」\n汤米：「不是我！我手在被子里！」\n露西：「……听。它在墙里面。」', 3, '咚、咚、咚。', '三个孩子说话的时候，敲击声一直没停。'],
    ['047', '光脚踩在地板上的「啪嗒」声，衣柜门「吱——」地开了。', 4, '咚咚咚咚。', '然后是一阵慌慌张张跑回床上的脚步，和汤米捂着嘴的笑声。'],
    ['066', '很长的一段寂静。三个孩子均匀的呼吸声——都睡着了。', 7, '咚。咚。咚。咚。咚。咚。咚。', '敲得很慢，很有耐心。像一个老人，用指节一下一下地叩门。'],
    ['088', '还是呼吸声。然后，非常近，几乎贴着麦克风——\n一个很低、很哑的男人的声音：「……箱……子……」', 1, '咚。', '磁带走到了头，「咔哒」一声停了。']
  ];

  defChapter({
    id: 'enfield', n: 8, title: '恩菲尔德闹鬼案', sub: '伦敦北郊的一栋公屋。墙里在敲，椅子在走，十一岁的女孩用一个老人的嗓音说话。', origin: '英国伦敦 · 1977年', color: '#6e5a1e',
    icon: '@lucy', amb: 'room', floor: 'carpet', wall: 'paper', dark: .6, plr: 3.2,
    people: {
      me: { key: 'en-me', skin: '#f0c8a0', hair: '#6a4a2a', hs: 'messy', top: '#7a5a36', top2: '#d8c8a0', bottom: '#3a3a52', coat: true, shoes: '#2a1a10',
        extra(g, d, fr, G, R) { if (d === 0) { R(5, G.tT + 1, 1, 5, '#1a1a1a'); R(8, G.tT + 4, 4, 3, '#1a1a1a'); R(9, G.tT + 5, 2, 1, '#8ab'); } else if (d === 1) R(4, G.tT + 4, 3, 3, '#1a1a1a'); } },
      kent: { key: 'en-kent', skin: '#e8c4a8', hair: '#c8c4bc', hs: 'short', top: '#5e5440', top2: '#e8e2d0', bottom: '#3a3530', coat: true, shoes: '#2a1a10',
        extra(g, d, fr, G, R) { if (d === 0) { R(6, G.hT + 6, 4, 1, '#c8c4bc'); R(5, G.hT + 4, 2, 1, '#2a2a2a'); R(9, G.hT + 4, 2, 1, '#2a2a2a'); } else if (d === 1) R(4, G.hT + 6, 3, 1, '#c8c4bc'); } },
      harper: { skin: '#ecc8b0', hair: '#5a3a24', hs: 'bob', top: '#8a6a7a', top2: '#e8dcc8', bottom: '#5a4a3a', skirt: true, shoes: '#3a2a2a' },
      sue: { skin: '#f0caa8', hair: '#7a4c2a', hs: 'long', child: true, dress: true, top: '#e0a8b4', top2: '#f0e0e4', shoes: '#e8e0d0' },
      lucy: { skin: '#f0c8a6', hair: '#3a2418', hs: 'bob', child: true, dress: true, top: '#c8d8e8', top2: '#e8eef4', shoes: '#e8e0d0' },
      lucyv: { skin: '#e0c0a6', hair: '#3a2418', hs: 'bob', child: true, dress: true, top: '#c8d8e8', top2: '#e8eef4', shoes: '#e8e0d0', eye: '#e8e4dc' },
      tommy: { key: 'en-tom', skin: '#f2cca8', hair: '#9a7040', hs: 'messy', child: true, top: '#6a8ac8', bottom: '#6a8ac8', shoes: '#c8c0b0',
        extra(g, d, fr, G, R) { if (d !== 1) { R(4, G.tT + 2, 8, 1, '#e8e8f0'); R(4, G.tT + 5, 8, 1, '#e8e8f0'); } else { R(5, G.tT + 2, 6, 1, '#e8e8f0'); R(5, G.tT + 5, 6, 1, '#e8e8f0'); } } },
      morton: { key: 'en-mor', skin: '#ecd0b8', hair: '#7a6a5a', hs: 'bun', top: '#55565e', top2: '#e8e8e8', bottom: '#45464e', skirt: true, coat: true, shoes: '#1a1a1a',
        extra(g, d, fr, G, R) { if (d === 0) { R(5, G.hT + 4, 2, 1, '#1a1a1a'); R(9, G.hT + 4, 2, 1, '#1a1a1a'); R(7, G.hT + 4, 2, 1, '#1a1a1a'); } else if (d === 1) R(4, G.hT + 4, 3, 1, '#1a1a1a'); } },
      reporter: { key: 'en-rep', skin: '#e8c0a0', hair: '#3a2a20', hs: 'short', hat: 'cap', hatC: '#3a3a40', top: '#4a4038', bottom: '#2a2a30', coat: true,
        extra(g, d, fr, G, R) { if (d === 0) { R(5, G.hT + 4, 6, 4, '#1a1a1a'); R(7, G.hT + 5, 2, 2, '#8ab'); R(9, G.hT + 2, 2, 2, '#e8e8e8'); } } },
      neighbor: { skin: '#e8c4b0', hair: '#c8a080', hs: 'short', hat: 'scarf', hatC: '#c86a8a', top: '#6a7a5a', bottom: '#4a4a3a', skirt: true, coat: true, shoes: '#2a2a2a' },
      oldman: { key: 'en-old', skin: '#d8d4cc', hair: '#e8e8e4', hs: 'bald', top: '#7a7a6e', top2: '#c8c4b8', bottom: '#4a4a48', ghost: true, eye: '#c8c8c8',
        extra(g, d, fr, G, R) { if (d === 0) { R(4, G.hT + 1, 1, 3, '#e8e8e4'); R(11, G.hT + 1, 1, 3, '#e8e8e4'); R(6, G.hT + 7, 4, 1, '#a8a49c'); R(7, G.tT + 2, 1, 1, '#4a4a40'); R(7, G.tT + 5, 1, 1, '#4a4a40'); } } },
      oldmang: { key: 'en-old2', skin: '#e0dcd4', hair: '#e8e8e4', hs: 'bald', top: '#7a7a6e', top2: '#c8c4b8', bottom: '#4a4a48', ghost: true,
        extra(g, d, fr, G, R) { if (d === 0) { R(4, G.hT + 1, 1, 3, '#e8e8e4'); R(11, G.hT + 1, 1, 3, '#e8e8e4'); R(5, G.hT + 4, 2, 2, '#3a3a3a'); R(9, G.hT + 4, 2, 2, '#3a3a3a'); R(7, G.hT + 4, 2, 1, '#3a3a3a'); R(6, G.hT + 7, 4, 1, '#a8a49c'); } } }
    },
    items: {
      rec: { name: '盘式录音机', desc: '研究会的老式便携录音机，皮套上烫着编号。按下录音键时，红灯会一闪一闪。' },
      cam: { name: '相机', desc: '带电动卷片马达的单反相机，一按快门能连拍好几张。胶卷是高感光的，适合暗处。' },
      glasses: { name: '老花眼镜', desc: '一副很厚的老花眼镜，镜腿用胶布缠过。镜片上有一道细细的裂纹。' },
      watch: { name: '怀表', desc: '一块黄铜怀表，表盖内侧刻着「J. 给 J.」。指针停在三点一刻。' },
      shedkey: { name: '棚屋钥匙', desc: '一把生锈的小钥匙，系着一块硬纸片，上面用铅笔写着：棚。' },
      coin: { name: '五十便士', desc: '从哈珀太太钱包里拿的五十便士硬币。七边形的，摸起来棱角分明。' }
    },
    notes: {
      case: { title: '研究会案件摘要 · 第77-31号', text: '地点：伦敦恩菲尔德，某公屋（两层，三室）\n住户：哈珀太太（离异），女儿苏（13）、露西（11），儿子汤米（8）\n\n报告现象：\n· 夜里卧室墙内有敲击声，常成串出现。\n· 抽屉柜自行滑动；积木、弹珠在房间里飞，落地时据说「是热的」。\n· 首晚到场的女警在证词中写道：她看见一把餐椅在地板上自己滑了将近一米。\n· 次女露西多次被「从床上抛下来」。\n\n媒体：一家小报已派记者和摄影师蹲守。\n\n建议：派一名年轻研究员协助肯特先生，带录音与摄影设备，记录一切——\n包括可能是人为的部分。\n\n（页边有一行红笔字：别忘了，孩子是会撒谎的。大人也是。）' },
      tape: { title: '录音带转写 · 第一盘 A面', text: '（地点：孩子们的卧室，录音机放在五斗柜上。大人们都在楼下厨房。）\n\n014　床垫吱呀。汤米憋笑「嘻……嘘——」\n　　　咚、咚。（2下）又是一串偷笑。\n\n031　苏：「汤米，别闹了！」\n　　　汤米：「不是我！我手在被子里！」\n　　　露西：「……听。它在墙里面。」\n　　　咚、咚、咚。（3下）三个人说话时一直在敲。\n\n047　光脚下床。衣柜门吱呀。\n　　　咚咚咚咚。（4下）跑回床上的脚步，汤米捂嘴笑。\n\n066　长时间寂静。三个孩子均匀的呼吸声。\n　　　咚……（7下，很慢）\n\n088　呼吸声。贴着麦克风，一个很低很哑的男声：\n　　　「……箱……子……」\n　　　咚。（1下）\n\n（你在底下画了一道线：哪些是孩子们弄的，哪些不是？）' },
      letter: { title: '铁皮箱里的信（没有寄出）', text: '给我的珍妮：\n\n眼睛越来越不行了。今天连你照片上的脸都看不清。\n医生说是血管的毛病，叫我别一个人住。我说我哪儿也不去，这是我们俩的房子。\n\n我还是每天坐在楼下角落那把椅子上，就是你织了椅套的那把。\n收音机三点一刻报新闻，我就听，听完就打个盹。\n\n楼上那间小卧室还是你走的时候那样。我不让人动。\n\n要是哪天我也走了，别让他们把椅子扔了。\n我会回来坐的。\n\n——约瑟夫\n\n（信纸背面，是另一个人的字：「1963年冬，房管处清理遗物。老人在楼下椅子上被发现时，已经过了三天。」）' },
      diary: { title: '露西的作文本（夹在枕头底下）', text: '我们装过。我承认。\n\n第一次真的出事的时候，抽屉柜自己走到门口把门堵住了，妈妈去叫邻居，邻居来了什么都没看见，说我们是坏孩子。\n后来警察来了，记者来了，大人们坐在楼下等一整晚，什么都不发生，他们就说要走了。\n所以汤米就敲墙，我就把勺子掰弯。他们一看见就不走了。\n\n可是有的不是我们。\n\n我被扔起来的时候是真的。我说话的时候也是真的——那个声音从我喉咙里出来，我自己都害怕。\n他说他叫约瑟夫。他说他很冷，他找不到他的眼镜。\n\n现在没有人信我们了。连真的那部分也不信了。' },
      memo: { title: '莫顿博士的备忘录', text: '关于恩菲尔德一案的初步意见：\n\n一、孩子们在隔壁房间被摄像机拍到：一个在弯勺子，一个用扫帚柄敲天花板。证据确凿。\n二、所谓「悬浮」照片是遥控快门连拍。看第二张：膝盖弯曲，脚尖绷直——这是一个跳起来的孩子，不是浮起来的孩子。\n三、所谓「老人的声音」：一个十一岁的女孩完全可以练出这种假声。肯特先生说他做过「含水试验」，可那时我不在场。\n四、媒体在门口蹲守，孩子们知道大人想看什么。\n\n结论（草稿）：一场由儿童主导、被大人和报纸放大的恶作剧。\n\n（最底下一行，字迹淡一些：……可我还没有解释那把椅子。）' }
    },
    legend: '恩菲尔德闹鬼案（Enfield Poltergeist）发生在1977年8月到1979年间，地点是伦敦北郊恩菲尔德的一栋公屋，住着一位离异的母亲和她的四个孩子。一开始是床在摇、墙里有拖着脚走路和敲击的声音；据说第一晚赶来的女警在证词里写道，她亲眼看见一把椅子在地板上自己滑了一段距离。之后是积木和弹珠在屋里飞、抽屉柜自己挪动、二女儿被「从床上抛起来」。一家小报派来了记者和摄影师，摄影师用遥控连拍拍下的「悬浮」照片，后来成了这个案子最出名的图像。\n\n英国心灵研究会的两位调查员前后在这户人家待了一年多，录下了几百个小时的磁带。最让人发毛的是那个声音：一个十一岁的女孩喉咙里，发出一个粗哑的老人的嗓音，自称是这屋子从前的住户，说自己在楼下角落的椅子上失明、死去。据说后来确实查到，曾有一位老人在这屋子里去世。相信者认为一个孩子不可能连续几个小时用那种嗓音说话，也有调查员说做过让她含着水说话的试验。\n\n怀疑者的理由同样有力：研究会内部就有人认为这是孩子的恶作剧——女孩们被隔壁房间的摄像机拍到弯勺子、敲墙；那张「悬浮」照片看起来就是从床垫上跳起来的姿势；那个声音可以是练出来的假声。孩子们当时就承认过有时候会「装一装」，看大人能不能发现；据说其中一个女孩成年后接受采访时说，大概只有百分之二是假的。连主要调查员自己也承认孩子们作过假，但坚持另一部分无法解释。1979年以后，现象渐渐平息。\n\n这个案子此后被一再改编，其中最有名的是2016年的电影《招魂2》，情节多为虚构。真与假在这里缠成了一团，至今没有定论——也许它本来就同时是两样。\n\n（本章中的哈珀一家、肯特先生、莫顿博士、研究员主角、老约瑟夫和他的信、铁皮箱与密码、停在三点一刻的怀表、棚屋里的椅子，以及让老人安心离开的结局，都是游戏虚构。真实当事人均未使用真名。）',
    start: { map: 'street', x: 9, y: 7, dir: 3 },
    resume: {
      dark: async S => {
        if (S.f.act !== 'dark') return;
        if (S.map === 'living') { S.dark(.97); S.plr(1.7); chairGo(S, 2.2); }
      }
    },
    async intro(S) {
      await S.card('第八夜　恩菲尔德闹鬼案', '1977年12月　英国伦敦北郊　恩菲尔德', '一排一模一样的红砖公屋，一个离了婚的母亲，三个孩子。\n报纸说，那里闹鬼。\n\n研究会派你去守一夜。\n带上录音机，带上相机——\n还有一双不会被骗的眼睛。');
    },
    tick(S, dt) {
      if (W.busy) return;
      const a = S.f.act;
      if (a === 'dark' && S.map === 'upstairs') { S.f._sc = (S.f._sc ?? 3) - dt; if (S.f._sc <= 0) { S.f._sc = 6 + Math.random() * 3; S.sfx(Math.random() < .5 ? 'knock' : 'thud'); } }
      if (a === 'knocks' && S.map === 'upstairs') { S.f._kk = (S.f._kk ?? 2) - dt; if (S.f._kk <= 0) { S.f._kk = 5 + Math.random() * 4; S.sfx('knock'); } }
      if ((a === 'heard' || a === 'chest') && S.map === 'living') { S.f._tv = (S.f._tv ?? 9) - dt; if (S.f._tv <= 0) { S.f._tv = 14 + Math.random() * 6; const tv = S.ent('telly'); tv.lit = !tv.lit; S.sfx(tv.lit ? 'tv' : 'switch'); } }
    },
    sprites: {
      kbed(g, e, t, R) {   // 孩子的床：枕头上露出一个脑袋（s.empty 空床，s.peek 被子拉到眼睛）
        const c = e.col || '#7a5a8a', bx = (x, y, w, h, f) => { R(x, y, w, h, shade(f, -.45)); R(x + 1, y + 1, w - 2, h - 2, f); };
        bx(1, -2, 14, 32, '#5a3c26'); R(2, -1, 12, 4, '#6a4a30'); R(3, 3, 10, 6, '#e6e2d6');
        if (!e.empty) { R(5, 1, 6, 6, '#f0c8a6'); R(5, 0, 6, 3, e.hair || '#4a3020'); R(4, 1, 1, 4, e.hair || '#4a3020'); R(11, 1, 1, 4, e.hair || '#4a3020'); if (!e.peek) { R(6, 4, 1, 1, '#3a2a2a'); R(9, 4, 1, 1, '#3a2a2a'); } }
        R(2, e.peek ? 5 : 9, 12, e.peek ? 24 : 20, c); R(2, e.peek ? 5 : 9, 12, 2, shade(c, .2)); R(2, 27, 12, 2, shade(c, -.25));
        if (e.peek) { R(6, 3, 1, 1, '#111'); R(9, 3, 1, 1, '#111'); }
        if (e.messy) { R(3, 12, 6, 3, shade(c, -.2)); R(9, 18, 4, 4, '#e6e2d6'); }
      },
      gchair(g, e, t, R) {   // 老人的高背扶手椅，椅套是手织的
        const c = e.col || '#5a6a42', bx = (x, y, w, h, f) => { R(x, y, w, h, shade(f, -.45)); R(x + 1, y + 1, w - 2, h - 2, f); };
        bx(2, -7, 12, 15, shade(c, -.1)); bx(0, -3, 4, 13, shade(c, -.2)); bx(12, -3, 4, 13, shade(c, -.2));
        R(5, -5, 6, 2, '#c8b890'); R(6, -2, 4, 1, '#c8b890');
        bx(2, 5, 12, 6, c); R(5, 6, 5, 3, shade(c, -.25));
        const lg = e.mud ? '#4a3420' : '#2a1a10'; R(2, 11, 2, 4, lg); R(12, 11, 2, 4, lg); if (e.mud) { R(1, 14, 4, 1, '#3a2a18'); R(11, 14, 4, 1, '#3a2a18'); }
        if (e.glasses) { R(5, 6, 2, 1, '#3a3a3a'); R(8, 6, 2, 1, '#3a3a3a'); R(7, 6, 1, 1, '#3a3a3a'); }
        if (e.watch) { R(10, 8, 2, 2, '#c9a35a'); R(10, 7, 1, 1, '#c9a35a'); }
      },
      telly(g, e, t, R) {
        const bx = (x, y, w, h, f) => { R(x, y, w, h, shade(f, -.45)); R(x + 1, y + 1, w - 2, h - 2, f); };
        R(2, 11, 1, 4, '#2a1a10'); R(13, 11, 1, 4, '#2a1a10'); bx(0, -2, 16, 14, '#6a4a2a');
        if (e.lit) { for (let y = 0; y < 8; y++) for (let x = 2; x < 12; x++) R(x, y, 1, 1, hash(x, y, (t * 30) | 0) < .5 ? '#d8d8d8' : '#4a4a4a'); }
        else { R(2, 0, 10, 8, '#16201e'); R(3, 1, 3, 1, '#2a3a38'); }
        R(13, 0, 2, 2, '#c9a35a'); R(13, 4, 2, 2, '#c9a35a'); R(7, -6, 1, 4, '#888'); R(9, -7, 1, 5, '#888');
      },
      gasfire(g, e, t, R) {   // 1970年代的煤气取暖器，镶在旧壁炉口里
        const bx = (x, y, w, h, f) => { R(x, y, w, h, shade(f, -.45)); R(x + 1, y + 1, w - 2, h - 2, f); };
        bx(-2, -8, 36, 23, '#8a7a62'); R(-2, -10, 36, 3, '#5a4a38'); bx(6, -2, 20, 15, '#3a3430');
        for (let i = 0; i < 5; i++) { const on = !e.off, f = on ? (Math.sin(t * 6 + i) > .2 ? '#ff9a3a' : '#ff6a2a') : '#5a4a40'; R(8 + i * 4, 0, 3, 9, f); if (on) R(8 + i * 4, 1, 3, 1, '#ffd08a'); }
        R(7, 11, 18, 1, '#c9a35a'); R(28, 2, 2, 2, '#c9a35a');
      },
      meter(g, e, t, R) {   // 投币电表（墙面）
        const bx = (x, y, w, h, f) => { R(x, y, w, h, shade(f, -.45)); R(x + 1, y + 1, w - 2, h - 2, f); };
        bx(3, -1, 10, 13, '#6a6a64'); R(5, 1, 6, 3, '#d8d4c0'); for (let i = 0; i < 3; i++) R(6 + i * 2, 2, 1, 1, '#222');
        R(6, 6, 4, 1, '#111'); R(7, 5, 2, 1, '#888'); R(10, 9, 1, 1, e.lit ? '#3c3' : (Math.sin(t * 5) > 0 ? '#e22' : '#511'));
      },
      cupdoor(g, e, t, R) {   // 楼梯底下的储物柜门
        const bx = (x, y, w, h, f) => { R(x, y, w, h, shade(f, -.45)); R(x + 1, y + 1, w - 2, h - 2, f); };
        bx(0, -6, 16, 21, '#7a5a3a'); R(0, -6, 8, 2, '#4a3220'); R(8, -4, 8, 2, '#4a3220');
        if (e.open) { R(2, -2, 12, 16, '#0a0806'); R(4, 9, 8, 4, '#6a7a6a'); R(4, 8, 8, 1, '#5a6a5a'); }
        else { R(3, -1, 10, 13, '#8a6a46'); R(11, 5, 2, 2, '#c9a35a'); }
      },
      recorder(g, e, t, R) {   // 盘式录音机（放在家具上，z:1 + oy）
        R(3, 8, 10, 6, '#151517'); R(4, 9, 8, 4, '#2a2a2e'); const sp = e.lit ? t * 6 : 0;
        for (const cx of [5, 9]) { R(cx, 9, 2, 2, '#c8c8c8'); R(cx + ((Math.sin(sp + cx) > 0) ? 1 : 0), 10, 1, 1, '#555'); }
        R(4, 13, 8, 1, '#888'); if (e.lit && Math.sin(t * 6) > 0) R(12, 8, 1, 1, '#ff3030');
      },
      camtri(g, e, t, R) {   // 三脚架上的相机；s.set 架好，s.flash 闪光
        if (!e.set) { R(5, -4, 2, 18, '#2a2a2a'); R(8, -3, 2, 17, '#3a3a3a'); R(4, -6, 7, 3, '#1a1a1a'); return; }
        R(3, 6, 1, 9, '#333'); R(12, 6, 1, 9, '#333'); R(7, 6, 2, 9, '#2a2a2a');
        R(3, -1, 10, 7, '#1a1a1a'); R(6, 0, 4, 4, '#4a4a4a'); R(7, 1, 2, 2, '#8ab'); R(10, -3, 3, 2, e.flash ? '#fff' : '#bbb');
      },
      brick(g, e, t, R) { const c = e.col || '#c03030'; R(5, 9, 6, 4, c); R(6, 8, 1, 1, c); R(9, 8, 1, 1, c); R(5, 12, 6, 1, shade(c, -.3)); },
      dents(g, e, t, R) { const c = 'rgba(20,10,5,.35)'; R(2, 3, 3, 2, c); R(11, 3, 3, 2, c); R(2, 12, 3, 2, c); R(11, 12, 3, 2, c); R(5, 6, 6, 4, 'rgba(255,240,200,.05)'); },
      wardm(g, e, t, R) {   // 一扇门是穿衣镜的衣柜；s.ghost 镜子里坐着一个老人
        const bx = (x, y, w, h, f) => { R(x, y, w, h, shade(f, -.45)); R(x + 1, y + 1, w - 2, h - 2, f); };
        bx(0, -12, 16, 27, '#6a4a2a'); R(7, -11, 1, 25, '#3a2414'); R(5, 0, 1, 3, '#c9a35a');
        R(9, -10, 6, 21, '#6a7a86'); R(10, -9, 2, 9, '#9aaab6'); R(9, 0, 1, 1, '#c9a35a');
        if (e.ghost) { R(10, -1, 4, 5, '#4a5a3a'); R(11, -6, 2, 2, '#d8d4cc'); R(10, -4, 4, 4, '#8a8a80'); R(11, -6, 1, 1, '#eee'); }
      },
      curtain2(g, e, t, R) {   // 窗帘；s.blown 往屋里飘起来
        R(1, 0, 14, 1, '#6a5a2a');
        if (e.blown) { R(1, 1, 5, 8, '#c8a040'); R(2, 9, 5, 6, '#b89030'); R(3, 15, 6, 4, '#c8a040'); R(10, 1, 5, 7, '#c8a040'); R(9, 8, 5, 6, '#b89030'); R(8, 14, 5, 5, '#c8a040'); return; }
        R(1, 1, 5, 12, '#c8a040'); R(10, 1, 5, 12, '#c8a040'); R(3, 1, 1, 12, '#a88030'); R(12, 1, 1, 12, '#a88030');
      },
      pillowf(g, e, t, R) { R(2, 4, 12, 7, '#9a968a'); R(3, 5, 10, 5, '#e6e2d6'); R(4, 5, 4, 1, '#f6f2ea'); },
      trays(g, e, t, R) {   // 架在浴缸上的冲洗盘
        R(-1, 3, 18, 3, '#6a5038'); R(0, 5, 7, 6, '#1e1e1e'); R(1, 6, 5, 4, '#4a5a4a'); R(9, 5, 7, 6, '#2a2a2a'); R(10, 6, 5, 4, '#5a5a4a');
        R(12, -3, 2, 6, '#3a2a1a'); R(14, -1, 2, 4, '#5a3a1a'); if (e.full) R(2, 7, 3, 2, '#d8d4c8');
      },
      redlamp(g, e, t, R) { R(5, 2, 6, 7, '#2a2a2a'); R(6, 3, 4, 5, e.off ? '#3a0a0a' : '#ff2a1a'); R(7, 0, 2, 2, '#444'); },
      shed(g, e, t, R) {   // 2×2 的花园棚屋，门朝下
        R(-2, -12, 36, 7, '#2e2218'); R(0, -6, 32, 38, '#3a2a1c'); R(1, -5, 30, 36, '#6a5038');
        for (let x = 4; x < 32; x += 5) R(x, -5, 1, 36, '#5a4230');
        R(3, 0, 7, 6, '#1a2230'); R(6, 0, 1, 6, '#3a2a1c');
        if (e.open) { R(12, 12, 12, 20, '#0a0806'); R(12, 12, 2, 20, '#4a3826'); }
        else { R(12, 12, 12, 20, '#5a4430'); R(13, 13, 10, 18, '#6a5038'); R(21, 20, 2, 3, '#9a9a9a'); R(21, 19, 2, 1, '#bbb'); }
      },
      wline(g, e, t, R) {   // 晾衣绳
        R(0, -14, 2, 29, '#5a5a58'); R(62, -14, 2, 29, '#5a5a58'); R(0, -12, 64, 1, '#c8c8c0');
        const s = Math.sin(t * 1.5) > .3 ? 1 : 0;
        R(8, -11, 6, 8 + s, '#c84a4a'); R(20, -11, 8, 6, '#e8e2d6'); R(34, -11, 6, 9 + s, '#4a6aa0'); R(46, -11, 7, 7, '#e8d070');
      },
      coathooks(g, e, t, R) { R(1, 2, 14, 2, '#3a2618'); R(3, 4, 1, 2, '#c9a35a'); R(11, 4, 1, 2, '#c9a35a'); R(2, 5, 4, 9, '#8a3a2a'); R(10, 5, 4, 8, '#3a4a6a'); R(10, 13, 4, 1, '#2a3a5a'); },
      spoonb(g, e, t, R) { R(3, 10, 6, 1, '#cfcfcf'); R(9, 9, 1, 1, '#cfcfcf'); R(10, 7, 1, 2, '#cfcfcf'); R(10, 5, 3, 3, '#e8e8e8'); R(11, 6, 1, 1, '#aaa'); }
    },
    tiles: {
      lino70: { solid: false, paint(R, X, Y) { const a = (X + Y) % 2 ? '#c8b070' : '#a8986a'; R(0, 0, 16, 16, a); R(0, 0, 16, 1, shade(a, -.2)); R(0, 0, 1, 16, shade(a, -.2)); R(6, 6, 4, 4, shade(a, .12)); } },
      shag: { solid: false, paint(R, X, Y) { speck(R, '#6a4a22', ['#7a5628', '#5a3e1c', '#86622e'], X, Y, 26, 41); } },
      shagO: { solid: false, paint(R, X, Y) { speck(R, '#8a5a2a', ['#9a6a32', '#7a4e24', '#a8783a'], X, Y, 26, 43); } }
    },
    maps: {
      /* ---------------- 门前的街 ---------------- */
      street: {
        amb: 'rain', dark: .74, plr: 3.4, wall: 'brick', rain: true, floor: 'asphalt',
        tileOpts: { grassC: '#26361f' },
        rows: [
          '####################',
          '####################',
          'h""""h"""_""h""""""h',
          'h""""h"""_""h""""""h',
          'fffffffff_ffffffffff',
          '____________________',
          '::::::::::::::::::::',
          '====================',
          '::::::::::::::::::::',
          '____________________',
          'hhhhhhhhhhhhhhhhhhhh'],
        ents: [
          { x: 2, y: 1, spr: 'window', lit: true, on: S => S.narr('隔壁的窗户。电视的蓝光一跳一跳，窗帘后面有个人影一直站着，在朝这边看。') },
          { x: 3, y: 1, spr: 'door', col: '#6a2a22', on: S => S.narr('邻居家的红门。门缝底下塞着一张叠起来的报纸，头版是这条街。') },
          { x: 7, y: 1, spr: 'window', lit: true, on: S => S.narr('哈珀家楼下的窗户。窗帘没拉严，你看见芥末黄的壁纸，和一角褪了色的沙发。') },
          { id: 'fdoor', x: 9, y: 1, spr: 'door', col: '#2a4a6a', async on(S) {
            if (S.f.act === 'arrive') { S.sfx('locked'); return S.narr('蓝色的前门，门牌上钉着一个歪了的「84」。\n肯特先生还在门口等你。'); }
            S.sfx('open'); await S.go('living', 13, 9, 3);
          } },
          { x: 11, y: 1, spr: 'window', on: S => S.narr('楼上孩子们卧室的窗户，黑着。\n有一瞬间，窗帘好像从里面被人撩开了一条缝。') },
          { x: 16, y: 1, spr: 'window', lit: true, on: S => S.narr('另一边的邻居。收音机在放《波西米亚狂想曲》，开得很响，像是故意的。') },
          { x: 8, y: 3, spr: 'barrel', on: S => S.narr('铁皮垃圾桶，盖子被人用砖头压住了。\n「是记者翻我们垃圾。」——你后来才知道这句话是什么意思。') },
          { x: 10, y: 2, spr: 'cup', full: true, on: S => S.narr('门口放着两个空牛奶瓶，里面卷着一张字条：「明天只要一品脱。谢谢。」') },
          { x: 3, y: 8, w: 2, spr: 'car', col: '#d8d2c0', on: S => S.narr('研究会借来的旧货车，后座堆满了磁带盒和三脚架。\n雨刮器上夹着一张罚单。') },
          { x: 14, y: 6, w: 2, spr: 'car', col: '#7a2a22', on: S => S.narr('报社的车。仪表盘上丢着一卷用完的胶卷和半包烟。') },
          { x: 4, y: 9, spr: 'streetlamp', light: { r: 3.6, col: 'rgba(255,200,120,.16)', dy: -18 }, on: S => S.narr('路灯在雨里嗡嗡响。') },
          { x: 16, y: 9, spr: 'streetlamp', flicker: true, light: { r: 3.2, col: 'rgba(255,200,120,.12)', dy: -18 }, on: S => S.narr('这一盏一直在闪。整条街只有它在闪，正对着84号。') },
          { id: 'kent_s', x: 10, y: 5, spr: '@kent', dir: 0, async on(S) {
            S.face('kent_s', 'pl');
            if (S.f.act !== 'arrive') return S.say('肯特先生', ['进去吧，别让哈珀太太等。', '记住：先怀疑，再记录，最后才下结论。']);
            await S.say('肯特先生', ['你就是研究会派来的年轻人？好，好。我姓肯特。', '我在这户人家守了三个月了。你看我这双眼睛——熬的。']);
            await S.say('肯特先生', ['我先把话说在前头。这屋子里发生的事，有一部分是孩子们弄的。我亲眼见过汤米拿扫帚柄捅天花板。', '可是另一部分……', '……我活了六十多年，没见过那样的东西。']);
            const r = await S.ask('「你信吗？」', ['「我只信录下来、拍下来的东西。」', '「我……还没想好。」'], '肯特先生');
            await S.say('肯特先生', r === 0 ? '很好。那就让机器替你看。' : '老实话。比那些一进门就说「我感觉到了」的强多了。');
            S.give('rec', true); S.give('cam', true); S.sfx('item'); S.toast('获得：录音机、相机');
            await S.say('肯特先生', ['录音机和相机，你拿着。卧室里的敲墙声，相机拍不到，可磁带听得见。', '这是研究会的案子摘要，路上看过了吧？再看一遍也好。']);
            await S.note('case');
            await S.say('肯特先生', '走吧。门牌84号。');
            S.f.act = 'evening'; S.goal('进屋（蓝色的前门）');
          } },
          { id: 'reporter', x: 14, y: 5, spr: '@reporter', dir: 1, async on(S) {
            S.face('reporter', 'pl');
            const L = ['研究会的？今晚有戏看吗？我们主编说，再拍不到东西就撤人了。', '小姑娘飞起来那张，你要是拍到了，卖给我。价钱好商量。', '你说我们是在记录，还是在给他们出题？……别这么看我，我就随口一说。'];
            await S.say('记者', L[(S.f._rp = ((S.f._rp ?? -1) + 1) % L.length)]);
          } },
          { id: 'neighbor', x: 6, y: 5, spr: '@neighbor', dir: 2, async on(S) {
            S.face('neighbor', 'pl');
            const L = ['又一个来看热闹的？那家的孩子啊，从来就没安分过。', '……不过那天晚上，我是听见了。墙里面，咚、咚，像有人在敲棺材板。', '以前住那屋的是个老头，眼睛不好，一个人住。死的时候……算了，大晚上的。'];
            await S.say('邻居太太', L[(S.f._nb = ((S.f._nb ?? -1) + 1) % L.length)]);
            if (S.f._nb === 2) S.f.heardOld = true;
          } }
        ],
        async enter(S, first) {
          if (!first) return;
          await S.narr('雨不大，可是冷。一整排红砖公屋，每家的门都长得一样。\n只有84号门口，停着报社的车。');
          S.goal('去跟门口的肯特先生打招呼');
          S.f.act = 'arrive';
        }
      },
      /* ---------------- 楼下：客厅 / 厨房 / 门厅 ---------------- */
      living: {
        amb: 'room', dark: .55, plr: 3.2, wall: 'paper', wallC: MUST, floor: 'carpet',
        legend: { 'c': 'shag', 'n': 'lino70' },
        rows: [
          '##################',
          '##################',
          '#ccccccccc#nnnnnn#',
          '#ccccccccc#nnnnnn#',
          '#ccccccccc#nnnnnn#',
          '#ccccccccc.nnnnnn#',
          '#ccccccccc###n####',
          '#ccccccccc.wwwwww#',
          '#ccccccccc#wwwwww#',
          '#ccccccccc#wwwwww#',
          '#############w####'],
        ents: [
          { x: 2, y: 1, spr: 'curtain', on: S => S.narr(S.f.act === 'morning' ? '窗帘拉开了。外面是灰蒙蒙的上午，记者的车还停在原地。' : '窗帘拉得严严实实——哈珀太太说，记者会拿长焦镜头往里拍。') },
          { id: 'dents', x: 1, y: 2, spr: 'dents', decal: true, solid: false, async on(S) {
            if (S.f.act === 'dark') return S.narr('那把椅子原本「不在」的地方。');
            await S.narr('墙角是空的。地毯上有四个深深的方形压痕——这里曾经长年摆着一把很重的椅子。\n压痕中间那块地毯，颜色比周围浅一点，好像一直被什么东西挡着光。');
            if (S.f.act !== 'arrive' && S.f.act !== 'evening') await S.think('孩子们都不肯在这个角落玩。汤米说，「那是爷爷坐的地方」。可这家里没有爷爷。');
          } },
          { id: 'gchair_l', x: 1, y: 2, spr: 'gchair', hidden: true, s: { mud: true } },
          { id: 'fire', x: 4, y: 2, w: 2, spr: 'gasfire', light: { r: 4.2, col: 'rgba(255,140,60,.2)', flick: true }, on: S => S.narr(S.ent('fire').off ? '煤气取暖器灭了。陶瓷片上还残留着一点橘红色，正在一格一格地暗下去。' : '投币电表供着的煤气取暖器。五片陶瓷烧得通红，屋子却怎么也暖不起来。') },
          { id: 'telly', x: 7, y: 2, spr: 'telly', async on(S) {
            const tv = S.ent('telly');
            if (tv.lit) { tv.lit = false; S.sfx('switch'); return S.narr('你关掉了电视。雪花「噗」地缩成屏幕中间一个白点，过了好一会儿才熄。'); }
            await S.narr(S.f.act === 'morning' ? '早间新闻在播罢工的消息。主持人提了一句「恩菲尔德的灵异事件」，背景里是这栋房子的照片。' : '木壳电视机，天线上缠着锡纸。\n哈珀太太说它有时候半夜自己打开，只放雪花。');
          } },
          { x: 9, y: 2, spr: 'lamp', light: { r: 3.4, col: 'rgba(255,200,110,.14)' }, on: S => S.narr('落地灯的灯罩上，有一圈烤焦的黄印子。') },
          { x: 4, y: 5, w: 2, spr: 'lowtable', col: '#5a3a1e', on: S => S.narr(S.f.act === 'morning' ? '茶几上摆着一把弯成钩子的汤勺。莫顿博士在旁边压了一张纸条：「证物一」。' : '茶几上散着几本漫画、半杯凉了的茶、一盒积木。') },
          { id: 'spoon', x: 5, y: 5, spr: 'spoonb', z: 1, oy: -5, hidden: true, solid: false },
          { id: 'harper_l', x: 3, y: 8, oy: -4, spr: '@harper', dir: 0, on: S => harperTalk(S) },
          { x: 3, y: 8, w: 2, spr: 'sofa', col: '#8a6a2a', on: S => S.narr('芥末黄的灯芯绒沙发，一边的扶手被猫抓烂了——他们家没有猫。') },
          { x: 7, y: 9, spr: 'dresser', col: '#5a3a22', on: S => S.narr('五斗柜上摆着全家福：哈珀太太和三个孩子，在海边。\n照片里少了一个人的位置被剪掉了，剪口很整齐。') },
          { x: 1, y: 9, spr: 'plant', on: S => S.narr('一盆蔫了的吊兰。泥土是湿的，可叶子一直在黄。') },
          { id: 'lucy_l', x: 6, y: 4, spr: '@lucy', dir: 0, on: S => lucyTalk(S) },
          { id: 'tommy_l', x: 2, y: 5, spr: '@tommy', dir: 2, on: S => tommyTalk(S) },
          { id: 'sue_l', x: 8, y: 5, spr: '@sue', dir: 1, on: S => sueTalk(S) },
          { id: 'kent_l', x: 7, y: 7, spr: '@kent', dir: 1, hidden: true, on: S => kentTalk(S) },
          { id: 'morton_l', x: 5, y: 7, spr: '@morton', dir: 3, hidden: true, on: S => mortonTalk(S) },
          /* 厨房 */
          { id: 'kcount', x: 11, y: 2, spr: 'counter', col: '#c8b880', async on(S) {
            if (S.f.act === 'dark' && !S.has('coin')) { S.give('coin'); S.sfx('item'); S.goal('把五十便士投进门厅的电表'); return S.narr('你摸到了哈珀太太的手提包，翻出钱包——\n里面只剩两枚五十便士。你攥住一枚，指甲都嵌进了棱角里。'); }
            await S.narr('台面上放着哈珀太太的手提包，还有一摞没拆的账单。最上面那张是红色的：电费催缴。');
          } },
          { x: 12, y: 2, spr: 'sink', on: S => S.narr('水龙头没拧紧，一滴，一滴。水槽里泡着一摞茶杯——来的人太多了，杯子不够用。') },
          { x: 13, y: 2, spr: 'stove', on: S => S.narr('炉子上的水壶还是温的。这一家人今晚大概烧了十几壶茶。') },
          { x: 13, y: 1, spr: 'window', on: S => S.narr('厨房窗户对着后院。黑暗里，能看见晾衣绳和一个小棚屋的轮廓。') },
          { id: 'bdoor', x: 15, y: 1, spr: 'door', col: '#4a5a3a', async on(S) {
            if (S.f.act === 'dark') { S.sfx('locked'); return S.narr('现在不是去后院的时候！'); }
            if (['arrive', 'evening', 'bed', 'placed', 'knocks', 'fetched'].includes(S.f.act)) return S.narr('后门上了两道插销。哈珀太太说，晚上谁也别出去。');
            if (S.f.act === 'night' && S.ent('lucy_l').follow) { S.follow('lucy_l', false); S.hide('lucy_l'); }
            S.sfx('open'); await S.go('garden', 6, 2, 0);
          } },
          { x: 16, y: 2, spr: 'fridge', on: S => S.narr('冰箱门上贴着汤米的蜡笔画：一栋房子，一个火柴人坐在椅子上，眼睛涂成了两个黑洞。\n画的角落写着：「爷爷」。') },
          { id: 'ktable', x: 12, y: 4, w: 2, spr: 'table2', col: '#d8d0b8', on: S => kitchenTable(S) },
          { id: 'rec_k', x: 12, y: 4, spr: 'recorder', z: 1, oy: -7, ox: 8, hidden: true, solid: false },
          { id: 'harper_k', x: 14, y: 4, spr: '@harper', dir: 1, hidden: true, on: S => harperTalk(S) },
          { id: 'kent_k', x: 11, y: 4, spr: '@kent', dir: 2, hidden: true, on: S => kentTalk(S) },
          /* 门厅 */
          { id: 'meter', x: 12, y: 6, spr: 'meter', lit: true, on: S => meterOn(S) },
          { x: 15, y: 6, spr: 'coathooks', on: S => S.narr('衣帽钩上挂着三个孩子的外套，还有一件男式大衣——哈珀太太说是她前夫的，一直没扔。') },
          { x: 11, y: 9, spr: 'phone', on: S => S.narr(S.f.act === 'morning' ? '电话线被拔掉了。哈珀太太说，一早上响了四十多次，全是报社。' : '电话机。听筒上贴着一张纸，写着肯特先生家的号码和「随时打」。') },
          { x: 16, y: 7, spr: 'stairsup', solid: false, async touch(S) { await S.go('upstairs', 2, 8, 2); } },
          { id: 'cup_d', x: 16, y: 9, spr: 'cupdoor', on: S => cupboard(S) },
          { x: 13, y: 10, spr: 'invisible', async touch(S) {
            if (S.f.act === 'dark') { S.sfx('locked'); await S.narr('前门的锁在黑暗里摸不着——而且你不能丢下他们！'); await S.walk('pl', 'u', 6); return; }
            await S.narr('门外，记者的闪光灯闪了一下。\n今晚的事还没完，你不能走。'); await S.walk('pl', 'u', 6);
          } }
        ],
        async enter(S, first) { await livingEnter(S, first); }
      },
      /* ---------------- 楼上：孩子们的卧室 / 哈珀太太的卧室 / 浴室（暗房） ---------------- */
      upstairs: {
        amb: 'room', dark: .66, plr: 3, wall: 'paper', wallC: MUST, floor: 'linoleum',
        legend: { 'c': 'shagO' }, tileOpts: { tileC: '#b8c4b0' },
        rows: [
          '####################',
          '####################',
          '#ccccccc#cccccc#+++#',
          '#ccccccc#cccccc#+++#',
          '#ccccccc#cccccc#+++#',
          '#ccccccc#cccccc#+++#',
          '#ccccccc#cccccc#+++#',
          '####.######.#####+##',
          '#nnnnnnnnnnnnnnnnnn#',
          '#nnnnnnnnnnnnnnnnnn#',
          '####################'],
        ents: [
          /* 孩子们的卧室 */
          { id: 'bed_l', x: 1, y: 2, h: 2, spr: 'kbed', col: '#c86a8a', s: { hair: '#3a2418', empty: true }, on: S => bedLucy(S) },
          { id: 'bed_t', x: 3, y: 2, h: 2, spr: 'kbed', col: '#4a6aa0', s: { hair: '#9a7040', empty: true }, on: S => bedTommy(S) },
          { id: 'bed_s', x: 5, y: 2, h: 2, spr: 'kbed', col: '#7aa07a', s: { hair: '#7a4c2a', empty: true }, on: S => bedSue(S) },
          { x: 4, y: 1, spr: 'window', on: S => S.narr(S.f.act === 'morning' ? '窗外是一排排一模一样的后院。晾衣绳、煤棚，一只湿透的猫。' : '窗户插销插得死死的，窗缝还用胶带封过——露西说，晚上会有风「从里面」往外吹。') },
          { id: 'wardm', x: 7, y: 2, spr: 'wardm', async on(S) {
            if (S.f.act === 'photo' || S.f.photoDone) return S.narr('衣柜的镜门。镜子里只有你自己，和你身后的房间。\n……你还是忍不住数了一遍：一、二、三张床。墙角没有椅子。');
            await S.narr('衣柜的一扇门是穿衣镜。哈珀太太说，抽屉柜就是从这里「走」到门口去的。\n镜子边上的木头有新刮的痕迹。');
          } },
          { id: 'kdress', x: 7, y: 5, spr: 'dresser', col: '#6a4a2a', on: S => kidsDresser(S) },
          { id: 'rec_u', x: 7, y: 5, spr: 'recorder', z: 1, oy: -7, hidden: true, solid: false },
          { x: 1, y: 6, spr: 'box', on: S => S.narr('玩具箱。积木、弹珠、一个掉了眼睛的布熊。\n箱盖内侧，有人用蜡笔写了一行歪歪扭扭的字：「别动我的东西」。不是孩子的笔迹。') },
          { id: 'b1', x: 3, y: 5, spr: 'brick', decal: true, hidden: true, col: '#c03030', on: S => brickOn(S) },
          { id: 'b2', x: 6, y: 6, spr: 'brick', decal: true, hidden: true, col: '#e8c030', on: S => brickOn(S) },
          { id: 'b3', x: 2, y: 4, spr: 'brick', decal: true, hidden: true, col: '#3060c0', on: S => brickOn(S) },
          { id: 'camtri', x: 2, y: 6, spr: 'camtri', hidden: true, on: S => tripod(S) },
          { id: 'lucy_u', x: 1, y: 3, spr: '@lucy', z: 1, hidden: true, solid: false, dir: 0, on: S => lucyUp(S) },
          { id: 'tommy_u', x: 3, y: 4, spr: '@tommy', hidden: true, dir: 1, on: S => tommyTalk(S) },
          { id: 'sue_u', x: 5, y: 5, spr: '@sue', hidden: true, dir: 1, on: S => sueTalk(S) },
          { id: 'harper_u', x: 5, y: 4, spr: '@harper', hidden: true, dir: 1, on: S => harperTalk(S) },
          { id: 'kent_u', x: 6, y: 6, spr: '@kent', hidden: true, dir: 1, on: S => kentTalk(S) },
          /* 哈珀太太的卧室 */
          { x: 10, y: 2, h: 2, spr: 'bed', col: '#7a5a6a', on: S => S.narr('哈珀太太的床，枕头只有一边有凹痕。\n她说她现在大多睡在楼下沙发上——「离孩子们近一点，又不用听那面墙」。') },
          { x: 11, y: 2, h: 2, spr: 'bed', col: '#7a5a6a', on: S => S.narr('另一半床铺得平平整整，像是很久没人睡过了。') },
          { x: 12, y: 1, spr: 'window', on: S => S.narr('从这扇窗能看见街。记者的车里，烟头的红点亮了一下，又暗了。') },
          { x: 13, y: 2, spr: 'vanity', on: S => S.narr('梳妆台上压着一张社会福利的表格，填了一半。\n「家庭成员」那一栏，她写了四个名字，又划掉了一个。') },
          { x: 14, y: 5, spr: 'wardrobe', col: '#5a3a22', on: S => S.narr('衣柜门关不严，用一把椅子顶着。') },
          { x: 9, y: 5, spr: 'newspaper', on: S => S.narr('一份小报，头版大字：「鬼屋里的女孩飞起来了！」\n配图是一张模糊的照片，被人用圆珠笔在女孩脸上划了好几道。') },
          /* 浴室 = 暗房 */
          { x: 16, y: 2, w: 2, spr: 'bathtub', on: S => S.narr('浴缸上横架着一块木板，权当暗房的工作台。\n缸底积着一层显影液染出来的褐色水渍。') },
          { x: 18, y: 2, spr: 'toilet', on: S => S.narr('马桶水箱的盖子被搬走了。肯特先生说，有一回，它自己从墙上「跳」了下来。') },
          { x: 18, y: 4, spr: 'sink', on: S => S.narr('洗手池里泡着几个量杯。镜子被一张黑卡纸蒙着——冲洗照片时不能透光。') },
          { id: 'rlamp', x: 17, y: 1, spr: 'redlamp', light: { r: 2.6, col: 'rgba(255,30,20,.32)' }, on: S => S.narr(S.ent('rlamp').off ? '安全灯灭了。' : '暗房的红色安全灯。在这种光下，血和水看起来一样。') },
          { id: 'trays', x: 16, y: 4, spr: 'trays', on: S => develop(S) },
          /* 走廊 */
          { x: 1, y: 8, spr: 'stairsdown', solid: false, async touch(S) { await S.go('living', 15, 7, 1); } },
          { x: 7, y: 7, spr: 'painting', col: '#4a5a6a', on: S => S.narr('一幅印刷的海景画，挂歪了。你扶正它，转身再看——又歪了。') },
          { x: 14, y: 7, spr: 'painting', col: '#6a5a3a', on: S => S.narr('一张褪色的结婚照。新郎那一半，被一张明信片挡住了。') },
          { x: 9, y: 9, spr: 'basket', on: S => S.narr('洗衣篮。最上面是一条尿湿了又洗过的床单——汤米这个月第三次了。') },
          { x: 18, y: 9, spr: 'plant', on: S => S.narr('楼梯口的盆栽，叶子全部朝着同一个方向歪——朝着孩子们的房门。') }
        ],
        async enter(S, first) { await upstairsEnter(S, first); }
      },
      /* ---------------- 照片里（第二张，定格的那一秒） ---------------- */
      photo: {
        amb: 'none', dark: .36, darkC: '#4a2e12', plr: 6, wall: 'paper', wallC: { face: '#8a7a52', trim: '#4a3e22', top: '#1a140c' }, floor: 'carpet',
        legend: { 'c': 'shagO' }, shimmer: false,
        rows: [
          '#########',
          '#########',
          '#ccccccc#',
          '#ccccccc#',
          '#ccccccc#',
          '#ccccccc#',
          '#ccccccc#',
          '#########'],
        ents: [
          { id: 'lucy_p', x: 2, y: 3, spr: '@lucy', z: 1, oy: -12, solid: false, dir: 2, on: S => clue(S, 'legs') },
          { id: 'bedP_l', x: 1, y: 2, h: 2, spr: 'kbed', col: '#c86a8a', s: { empty: true, messy: true }, on: S => clue(S, 'bed') },
          { id: 'bedP_t', x: 3, y: 2, h: 2, spr: 'kbed', col: '#4a6aa0', s: { hair: '#9a7040', peek: true }, on: S => S.narr('汤米。被子拉到鼻子，只露出一双眼睛——瞪得溜圆，在看半空中的姐姐。\n他的两只手都在被子外面，紧紧攥着被角。这一张里，他什么也没干。') },
          { id: 'bedP_s', x: 5, y: 2, h: 2, spr: 'kbed', col: '#7aa07a', s: { empty: true }, on: S => S.narr('苏的床是空的，被子掀在地上。') },
          { x: 4, y: 1, spr: 'window' },
          { id: 'curtP', x: 4, y: 1, spr: 'curtain2', z: 1, s: { blown: true }, on: S => clue(S, 'curtain') },
          { id: 'wardP', x: 7, y: 2, spr: 'wardm', s: { ghost: true }, on: S => clue(S, 'mirror') },
          { x: 7, y: 5, spr: 'dresser', col: '#6a4a2a', on: S => S.narr('五斗柜上的录音机，红灯定格在「亮」的那一瞬。') },
          { x: 7, y: 5, spr: 'recorder', z: 1, oy: -7, solid: false, lit: true },
          { x: 1, y: 6, spr: 'box', on: S => S.narr('玩具箱的盖子弹开了一半。一颗弹珠停在半空，离箱口两寸。') },
          { id: 'sue_p', x: 5, y: 4, spr: '@sue', dir: 1, on: S => S.narr('苏。她双手捂着嘴，眼睛看的不是露西，而是衣柜的方向。\n你从来没想过——她在看什么？') },
          { x: 3, y: 4, spr: 'pillowf', z: 1, oy: -13, solid: false },
          { x: 5, y: 3, spr: 'brick', z: 1, oy: -10, solid: false, col: '#e8c030' },
          { x: 2, y: 5, spr: 'brick', z: 1, oy: -6, solid: false, col: '#c03030' },
          { id: 'edge', x: 4, y: 7, spr: 'invisible', solid: true, on: S => photoExit(S) }
        ],
        async enter(S, first) {
          S.fx('static', { dur: .6 }); S.sfx('tv');
          if (first) {
            await S.narr('你把放大镜凑近第二张照片——\n红光、药水的气味、雨声，一下子都远了。');
            await S.narr('你「站」在了那一秒钟里。\n闪光灯把一切都冻住了：飞起来的枕头，半空中的积木，还有露西。\n没有声音。连你自己的心跳都听不见。');
            S.goal('在照片里找线索：露西、她的床、窗帘、衣柜镜子（看完从下边的相纸边缘出去）');
          }
        }
      },
      /* ---------------- 后院 ---------------- */
      garden: {
        amb: 'night', dark: .8, plr: 3.2, wall: 'brick', floor: 'grass',
        tileOpts: { grassC: '#22301c' },
        rows: [
          '##############',
          '##############',
          'f"""""k""""""f',
          'f"""""k""""""f',
          'f"""""k""""""f',
          'f"""""kkkkk""f',
          'f""""""""""""f',
          'f""""""""""""f',
          'fBB"""""""""Bf',
          'ffffffffffffff'],
        ents: [
          { x: 6, y: 1, spr: 'door', col: '#4a5a3a', async on(S) {
            if (S.f.act === 'night') { S.sfx('locked'); return S.narr('露西拉住了你的袖子。「他就在这儿。别走。」'); }
            S.sfx('open'); await S.go('living', 15, 2, 0);
          } },
          { x: 9, y: 1, spr: 'window', lit: true, on: S => S.narr('厨房的窗户。里面亮着灯，哈珀太太的影子在水槽前一动不动。') },
          { x: 12, y: 2, spr: 'barrel', on: S => S.narr('煤桶。里面没有煤，只有一摞湿透的旧报纸——全是关于这栋房子的。') },
          { x: 1, y: 6, w: 4, spr: 'wline', solid: false, z: 1, on: S => S.narr('晾衣绳上的衣服在夜里也没收。哈珀太太说，收了第二天早上也会挂回去。') },
          { id: 'shed', x: 9, y: 3, w: 2, h: 2, spr: 'shed', on: S => shedOn(S) },
          { id: 'gchair_g', x: 10, y: 7, spr: 'gchair', hidden: true, s: { mud: true }, on: S => finale(S) },
          { id: 'oldman_g', x: 10, y: 7, oy: -4, spr: '@oldman', hidden: true, solid: false, dir: 0 },
          { id: 'lucy_g', x: 6, y: 3, spr: '@lucy', hidden: true, dir: 0, on: S => S.say('露西', S.f.act === 'night' ? '他在等。你拿着他的眼镜，对不对？' : '……') }
        ],
        async enter(S, first) { await gardenEnter(S, first); }
      }
    }
  });
  /*@@FUNCS@@*/
})();
