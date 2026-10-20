/* ================= 第八夜 · 恩菲尔德闹鬼案 ================= */
(() => {
  /* 主题：真与假。录音机回放时会多出东西；相机定格的照片可以「走进去」看。
     孩子们装过，也有孩子们装不出来的。玩家要自己分清。
     双人：一人在「笺」里翻转写稿、一人拨密码锁；照片里分头看线索；给莫顿博士的结论、对约瑟夫说的最后一句，两人投票。 */
  const MUST = { face: '#a88e3e', trim: '#5a4a1e', top: '#1e1a12' };   // 芥末黄壁纸
  let DIED = 0;   // 本局被椅子抓到几次（只影响重来时的提示文字）
  /* 两种敲击用合成音区分：peg = 晾衣夹敲床头板（清脆、短、高）；wall = 墙里的（低沉、发闷，像指节叩在很厚的东西上）
     muffled：隔着天花板听（楼下厨房），整体再压低一点。knockSeq 一次排好所有音（带延迟），不阻塞对话 */
  function knockSeq(S, n, gap, kind, t0 = 0, muffled = false) {
    const lp = muffled ? .55 : 1;
    for (let i = 0; i < n; i++) {
      const t = t0 + i * gap / 1000;
      if (kind === 'peg') { S.tone('square', 1500, 900, .035, .07 * lp, t, 2600 * lp); S.tone('triangle', 820, 600, .06, .16 * lp, t, 0); }
      else { S.tone('sine', 120, 52, .24, .5 * lp, t, 0); S.tone('triangle', 82, 40, .32, .3 * lp, t + .01, 300 * lp); }
    }
  }
  const knock = async (S, n, gap, kind, muffled) => { knockSeq(S, n, gap, kind, 0, muffled); for (let i = 0; i < n; i++) { S.shake(90, kind === 'peg' ? .5 : 1.2); await S.wait(gap); } };
  const OLD = '露西（一个老人的声音）';
  /* 老人的嗓音：底下垫一层很低的「呼噜」声 */
  const growl = S => { S.tone('sawtooth', 74, 58, 1.6, .05, 0, 320); S.tone('sine', 56, 47, 1.6, .1, 0, 0); };
  const old = (S, t) => { growl(S); return S.say(OLD, t, { style: 'whisper' }); };
  const caughtChair = async S => {
    DIED++;
    await S.scare('face', { spr: '@oldman' });
    await S.die('那把椅子撞上了你的膝盖，你整个人跌坐进去。\n坐垫是温的。有一双干枯的手，从后面轻轻按住了你的肩膀。\n「……这是我的椅子。」', '你坐进了他的椅子');
  };
  const TVL = { r: 4.6, col: 'rgba(190,200,255,.17)', flick: true };   // 电视自己亮起来时的雪花光
  function chairReset(S, x = 1, y = 2) {
    const c = S.ent('gchair_l'); if (!c) return;
    S.stop('gchair_l'); S.place('gchair_l', x, y, 0); c.alpha = 1;
  }
  function chairGo(S, wait = 1.6, x, y) {
    chairReset(S, x, y);
    S.chase('gchair_l', { spd: 2.75, catch: caughtChair });
    S.ent('gchair_l').chase.wait = wait;
  }
  /* 回放：一组一页，敲击声和文字同时出来 */
  const TAPE = [
    ['014', '床垫「吱呀」一声。汤米憋着笑：「嘻……嘘——」', 2, 'peg', '嗒、嗒。——很脆，像木头敲在木头上。\n紧接着，又是一串压不住的偷笑。'],
    ['031', '苏：「汤米，别闹了！」汤米：「不是我！我手在被子里！」\n露西：「……听。它在墙里面。」', 3, 'wall', '咚、咚、咚。——闷闷的，像从墙里面传出来。\n三个孩子说话的时候，它一直没停。'],
    ['047', '光脚「啪嗒」下床，衣柜门「吱——」地开了。', 4, 'peg', '嗒嗒嗒嗒。又是那种脆响。\n然后是慌慌张张跑回床上的脚步，和汤米捂着嘴的笑。'],
    ['066', '很长的寂静。三个孩子均匀的呼吸声——都睡着了。', 7, 'wall', '咚。咚。咚。咚。咚。咚。咚。\n很慢，很有耐心。像一个老人，用指节一下一下地叩门。'],
    ['088', '还是呼吸声。然后，几乎贴着麦克风——\n一个很低、很哑的男人的声音：「……箱……子……」', 1, 'wall', '咚。\n磁带走到了头，「咔哒」一声停了。']
  ];
  /* 惊吓大头像（32×32） */
  const FACES = {
    oldman(R, a) {   // 秃顶、白眉、乳白色的瞎眼、塌下去的脸颊、越张越大的没牙的嘴
      const SK = '#d4cec2', SK2 = '#aea698', SK3 = '#7e7668', K = '#2e2a24', WH = '#eceae0', HR = '#f2f0ea', M = '#140e0a', CD = '#6a6a5e';
      R(1, 26, 30, 6, CD); R(4, 24, 24, 3, CD); R(12, 24, 8, 8, '#c8c4b6'); R(15, 26, 2, 6, CD); R(9, 27, 2, 5, '#5a5a50'); R(21, 27, 2, 5, '#5a5a50');
      R(11, 1, 10, 1, SK); R(9, 2, 14, 2, SK); R(8, 4, 16, 4, SK); R(7, 8, 18, 11, SK); R(8, 19, 16, 3, SK); R(9, 22, 14, 2, SK); R(11, 24, 10, 1, SK);
      R(12, 3, 5, 2, '#ece6da'); R(11, 5, 2, 1, '#ece6da');
      R(21, 5, 3, 16, SK2); R(20, 21, 3, 3, SK2); R(5, 11, 2, 6, SK2); R(25, 11, 2, 6, SK2); R(6, 13, 1, 2, SK3); R(25, 13, 1, 2, SK3);
      R(6, 11, 2, 6, HR); R(24, 11, 2, 6, HR); R(5, 12, 1, 4, HR); R(26, 12, 1, 4, HR);   // 只剩耳朵上方两撮白毛
      R(10, 6, 12, 1, SK3); R(11, 8, 10, 1, SK2);
      R(10, 11, 4, 1, HR); R(18, 11, 4, 1, HR); R(9, 12, 1, 1, HR); R(22, 12, 1, 1, HR);
      for (const x of [9, 17]) { R(x, 12, 6, 1, SK3); R(x, 13, 1, 4, SK3); R(x + 5, 13, 1, 3, SK2); R(x + 1, 17, 4, 1, SK3); }   // 塌下去的眼窝
      const op = a < .15 ? 1 : 3;   // 先眯着，再猛地睁开：整颗眼珠都是乳白的（白内障，瞎了）
      for (const x of [10, 18]) {
        R(x, 15 - (op >> 1) - (op > 1 ? 1 : 0), 4, op, WH); R(x, 16, 4, 1, K);
        if (op > 1) { R(x + 1, 14, 2, 1, '#b4c2cc'); R(x, 13, 1, 1, SK3); R(x + 3, 13, 1, 1, SK3); R(x + 3, 15, 1, 1, '#d8b8b0'); }
      }
      R(14, 15, 4, 1, SK3);   // 鼻梁上一道眼镜压出来的印子
      R(15, 15, 2, 5, SK2); R(14, 19, 4, 1, SK3); R(14, 20, 1, 1, K); R(17, 20, 1, 1, K);
      R(9, 17, 3, 5, SK2); R(20, 17, 3, 5, SK3); R(10, 18, 1, 3, SK3);
      const mh = 1 + Math.round(a * 5);
      R(12, 21, 8, mh, M); R(11, 22, 1, Math.max(0, mh - 1), M); R(20, 22, 1, Math.max(0, mh - 1), M); R(12, 21, 8, 1, '#7a4e4a'); R(13, 21 + mh, 6, 1, SK3);
      for (const [x, y] of [[10, 23], [13, 24], [18, 24], [21, 23], [16, 25]]) R(x, y, 1, 1, '#9a9488');
    },
    lucyv(R, a) {   // 露西：齐耳短发、苍白的脸，眼珠翻上去只剩眼白，嘴张成一个「O」——那个嗓音就是从这里出来的
      const H = '#2a1a12', HL = '#4a3226', SK = '#e0d2c8', SK2 = '#c8ae98', K = '#5a4a48', WH = '#f4f2ec', M = '#1a0e0c';
      R(1, 26, 30, 6, '#c8d8e8'); R(11, 25, 10, 3, '#e8eef4'); R(14, 26, 4, 2, '#c8d8e8');
      R(8, 2, 16, 3, H); R(6, 4, 20, 4, H); R(5, 8, 22, 15, H); R(6, 23, 4, 2, H); R(22, 23, 4, 2, H); R(10, 3, 4, 1, HL); R(7, 9, 1, 12, HL); R(24, 9, 1, 12, HL);
      R(9, 9, 14, 13, SK); R(10, 22, 12, 2, SK); R(12, 24, 8, 1, SK); R(20, 10, 2, 13, SK2);
      R(8, 7, 16, 4, H); R(10, 11, 2, 1, H); R(15, 11, 2, 1, H); R(20, 11, 2, 1, H);
      for (const x of [10, 17]) {   // 眼珠翻上去，只剩带血丝的眼白；眼睛底下发青
        R(x, 13, 5, 1, SK2); R(x, 14, 5, 3, WH); R(x, 14, 1, 1, SK2); R(x + 4, 14, 1, 1, SK2); R(x, 17, 5, 1, K); R(x + 1, 18, 3, 1, '#b8a8b0');
        R(x + 1, 16, 1, 1, '#d88a8a'); R(x + 3, 15, 1, 1, '#d88a8a');
        if (a < .2) R(x + 1, 14, 3, 1, '#4a3428');   // 眼珠只剩上沿一道边，然后整个翻上去了
      }
      R(12, 8, 1, 7, H); R(20, 9, 1, 5, H);   // 几缕头发垂到脸上
      R(15, 17, 2, 2, SK2);
      const mo = 1 + Math.round(a * 3);
      R(14, 20, 4, mo + 1, M); R(13, 21, 1, mo - 1, M); R(18, 21, 1, mo - 1, M); R(14, 20, 4, 1, '#8a4a48');
    }
  };

  defChapter({
    id: 'enfield', n: 8, title: '恩菲尔德闹鬼案', sub: '伦敦北郊的一栋公屋。墙里在敲，椅子在走，十一岁的女孩用一个老人的嗓音说话。', origin: '英国伦敦 · 1977年', color: '#6e5a1e',
    icon: '@lucyv', amb: 'room', floor: 'carpet', wall: 'paper', dark: .6, plr: 3.2,
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
    faces: FACES,
    items: {
      rec: { name: '盘式录音机', desc: '研究会的老式便携录音机，皮套上烫着编号。按下录音键时，红灯会一闪一闪。' },
      cam: { name: '相机', desc: '带电动卷片马达的单反相机，一按快门能连拍好几张。胶卷是高感光的，适合暗处。' },
      glasses: { name: '老花眼镜', desc: '一副很厚的老花眼镜，镜腿用胶布缠过。镜片上有一道细细的裂纹。' },
      watch: { name: '怀表', desc: '一块黄铜怀表，表盖内侧刻着「J. 给 J.」。指针停在三点一刻。' },
      shedkey: { name: '棚屋钥匙', desc: '一把生锈的小钥匙，系着一块硬纸片，上面用铅笔写着：棚。' },
      coin: { name: '五十便士', desc: '从哈珀太太钱包里拿的五十便士硬币。七边形的，摸起来棱角分明。' }
    },
    notes: {
      case: { title: '研究会案件摘要 · 第77-31号', text: '地点：伦敦恩菲尔德，某公屋（两层）\n住户：哈珀太太（离异），苏（13）、露西（11）、汤米（8）\n\n报告现象：\n· 夜里卧室墙内有敲击声，常成串出现。\n· 抽屉柜自己滑动；积木、弹珠乱飞，落地「是热的」。\n· 首晚到场的女警作证：一把餐椅自己滑了将近一米。\n· 露西多次被「从床上抛下来」。\n· 小报的记者和摄影师在门口蹲守。\n\n任务：协助肯特先生，录音、拍照，记录一切——包括人为的部分。\n\n（页边一行红笔字：孩子是会撒谎的。大人也是。）' },
      tape: { title: '录音带转写 · 第一盘 A面', text: '（孩子们的卧室，录音机在五斗柜上。大人们都在楼下厨房。）\n\n014　汤米憋笑「嘻……嘘——」　嗒、嗒（2下，脆）\n031　三个孩子都在说话　咚、咚、咚（3下，闷）\n047　光脚下床，衣柜门响　嗒嗒嗒嗒（4下，脆）\n066　三个人都睡着了　咚……（7下，闷，很慢）\n088　贴着麦克风的老人声「……箱……子……」　咚（1下，闷）\n\n脆的像木头敲木头；闷的像从墙里面。\n（你在底下画了一道线：哪些是孩子们弄的，哪些不是？）' },
      letter: { title: '铁皮箱里的信（没有寄出）', text: '给我的珍妮：\n\n眼睛越来越不行了。今天连你照片上的脸都看不清。\n医生说是血管的毛病，叫我别一个人住。我说我哪儿也不去，这是我们俩的房子。\n\n我还是每天坐在楼下角落那把椅子上，就是你织了椅套的那把。\n收音机三点一刻报新闻，我就听，听完就打个盹。\n\n楼上那间小卧室还是你走的时候那样。我不让人动。\n\n要是哪天我也走了，别让他们把椅子扔了。\n我会回来坐的。\n\n——约瑟夫\n\n（信纸背面，是另一个人的字：「1963年冬，房管处清理遗物。老人在楼下椅子上被发现时，已经过了三天。」）' },
      diary: { title: '露西的作文本（夹在枕头底下）', text: '我们装过。我承认。\n\n第一次真的出事的时候，抽屉柜自己走到门口把门堵住了，妈妈去叫邻居，邻居来了什么都没看见，说我们是坏孩子。\n后来警察来了，记者来了，大人们坐在楼下等一整晚，什么都不发生，他们就说要走了。\n所以汤米就敲墙，我就把勺子掰弯。他们一看见就不走了。\n\n可是有的不是我们。\n\n我被扔起来的时候是真的。我说话的时候也是真的——那个声音从我喉咙里出来，我自己都害怕。\n他说他叫约瑟夫。他说他很冷，他找不到他的眼镜。\n\n现在没有人信我们了。连真的那部分也不信了。' },
      memo: { title: '莫顿博士的备忘录', text: '关于恩菲尔德一案的初步意见：\n\n一、孩子们在隔壁房间被摄像机拍到：一个在弯勺子，一个用扫帚柄敲天花板。证据确凿。\n二、所谓「悬浮」照片是遥控快门连拍。看第二张：膝盖弯曲，脚尖绷直——这是一个跳起来的孩子，不是浮起来的孩子。\n三、所谓「老人的声音」：一个十一岁的女孩完全可以练出这种假声。肯特先生说他做过「含水试验」，可那时我不在场。\n四、媒体在门口蹲守，孩子们知道大人想看什么。\n\n结论（草稿）：一场由儿童主导、被大人和报纸放大的恶作剧。\n\n（最底下一行，字迹淡一些：……可我还没有解释那把椅子。）' }
    },
    legend: '恩菲尔德闹鬼案（Enfield Poltergeist）发生在1977年8月到1979年间，地点是伦敦北郊恩菲尔德的一栋公屋，住着一位离异的母亲和她的四个孩子。一开始是床在摇、墙里有拖着脚走路和敲击的声音；据说第一晚赶来的女警在证词里写道，她亲眼看见一把椅子在地板上自己滑了一段距离。之后是积木和弹珠在屋里飞、抽屉柜自己挪动、二女儿被「从床上抛起来」；据说还有路过的人说，隔着楼上的窗户看见书本和那个女孩悬在半空。一家小报派来了记者和摄影师，摄影师用遥控连拍拍下的「悬浮」照片，后来成了这个案子最出名的图像。\n\n英国心灵研究会的两位调查员前后在这户人家待了一年多，录下了一百多个小时的磁带。最让人发毛的是那个声音：一个十一岁的女孩喉咙里，发出一个粗哑的老人的嗓音，自称是这屋子从前的住户，说自己临死前眼睛瞎了，在楼下角落的椅子上睡着，就这么死了。据说后来确实查到，曾有一位老人在这屋子里去世。相信者认为，一个孩子不可能连续几个小时用那种嗓音说话；调查员说做过让她含满一口水再开口的试验，声音照样出来。\n\n怀疑者的理由同样有力：研究会内部就有人认为这是孩子的恶作剧——女孩们被隔壁房间的摄像机拍到弯勺子、敲东西；那张「悬浮」照片看起来就是从床垫上蹦起来的姿势；有人分析那个嗓音来自喉咙深处的「假声带」，相信者说孩子撑不了那么久，怀疑者说练一练就行，含着水也不妨碍；据说一位来访的魔术师也认为自己看穿了孩子们的小把戏。孩子们当时就承认过有时候会「装一装」，看大人能不能发现；据说其中一个女孩成年后接受采访时说，大概只有百分之二是假的。连主要调查员自己也承认孩子们作过假，但坚持另一部分无法解释。1979年以后，现象渐渐平息。\n\n这个案子此后被一再改编：英国拍过一部三集的电视剧，2016年的电影《招魂2》最有名，但情节多为虚构——据当年的调查员说，电影里那对著名的灵学夫妇只来过很短一段时间，没有参与主要的调查。真与假在这里缠成了一团，至今没有定论——也许它本来就同时是两样。\n\n（本章中的哈珀一家、肯特先生、莫顿博士、研究员主角、老约瑟夫和他的信、铁皮箱与密码、停在三点一刻的怀表、棚屋里的椅子、照片里的细节、你亲手做的含水试验，以及三种结局，都是游戏虚构；真实案件里是四个孩子，本章写成了三个。真实当事人均未使用真名。）',
    endings: { good: '我在场', bad: '一场恶作剧', drive: '赶走' },
    start: { map: 'street', x: 9, y: 7, dir: 3 },
    resume: {
      dark: async S => {
        if (S.f.act !== 'dark') return;
        if (S.map === 'living') { S.dark(.97); S.plr(1.7); chairGo(S, 2.2); }
        if (DIED) {   // 被椅子抓过：重来时想一句路线
          S.sfx('heart');
          await S.think(DIED === 1 ? '……再来一次。\n钱包在厨房台子上，电表在门厅楼梯口的墙上。从厨房穿过去，别进客厅。'
            : '它是从客厅那边过来的。\n拿到硬币就往右绕：厨房 → 门厅 → 电表。跑起来，别回头看。');
        }
      }
    },
    async intro(S) {
      DIED = 0;
      await S.card('第八夜　恩菲尔德闹鬼案', '1977年12月　英国伦敦北郊　恩菲尔德', '一排一模一样的红砖公屋，一个离了婚的母亲，三个孩子。\n报纸说，那里闹鬼。\n\n研究会派你去守一夜。\n带上录音机，带上相机——\n还有一双不会被骗的眼睛。');
    },
    tick(S, dt) {
      if (W.busy) return;
      const a = S.f.act;
      if (a === 'dark' && S.map === 'upstairs') { S.f._sc = (S.f._sc ?? 3) - dt; if (S.f._sc <= 0) { S.f._sc = 6 + Math.random() * 3; S.sfx(Math.random() < .5 ? 'knock' : 'thud'); } }
      if (a === 'chest' && S.map === 'upstairs') { S.f._bj = (S.f._bj ?? 1) - dt; if (S.f._bj <= 0) { S.f._bj = .9 + Math.random() * .8; S.sfx('thud'); S.shake(160, 1.5); } }   // 露西的床一下一下地蹦
      if (a === 'dark' && S.map === 'living') {   // 椅子越近，心跳越快
        const c = S.ent('gchair_l');
        if (c && !c.hidden && c.chase) { const d = (Math.abs(c.px - W.pl.px) + Math.abs(c.py - W.pl.py)) / 16; S.f._hb = (S.f._hb ?? 0) - dt; if (d < 6 && S.f._hb <= 0) { S.f._hb = .3 + d * .13; S.sfx('heart'); } }
      }
      if (a === 'knocks' && S.map === 'upstairs') { S.f._kk = (S.f._kk ?? 2) - dt; if (S.f._kk <= 0) { S.f._kk = 5 + Math.random() * 4; S.sfx('knock'); } }
      if ((a === 'heard' || a === 'chest') && S.map === 'living') { S.f._tv = (S.f._tv ?? 9) - dt; if (S.f._tv <= 0) { S.f._tv = 14 + Math.random() * 6; const tv = S.ent('telly'); tv.lit = !tv.lit; S.sfx(tv.lit ? 'tv' : 'switch'); } }
    },
    sprites: {
      kbed(g, e, t, R0) {   // 孩子的床：枕头上露出一个脑袋（s.empty 空床，s.peek 被子拉到眼睛，s.jump 整张床在蹦）
        const j = e.jump ? -Math.round(Math.abs(Math.sin(t * 7)) * 4) : 0, R = (x, y, w, h, f) => R0(x, y + j, w, h, f);
        if (j) R0(1, 29, 14, 2, 'rgba(0,0,0,.35)');   // 床脚离地时的影子
        const c = e.col || '#7a5a8a', bx = (x, y, w, h, f) => { R(x, y, w, h, shade(f, -.45)); R(x + 1, y + 1, w - 2, h - 2, f); };
        bx(1, -2, 14, 32, '#5a3c26'); R(2, -1, 12, 4, '#6a4a30'); R(3, 3, 10, 6, '#e6e2d6');
        if (!e.empty) { R(5, 1, 6, 6, '#f0c8a6'); R(5, 0, 6, 3, e.hair || '#4a3020'); R(4, 1, 1, 4, e.hair || '#4a3020'); R(11, 1, 1, 4, e.hair || '#4a3020'); if (!e.peek) { R(6, 4, 1, 1, '#3a2a2a'); R(9, 4, 1, 1, '#3a2a2a'); } }
        R(2, e.peek ? 5 : 9, 12, e.peek ? 24 : 20, c); R(2, e.peek ? 5 : 9, 12, 2, shade(c, .2)); R(2, 27, 12, 2, shade(c, -.25));
        if (e.peek) { R(6, 3, 1, 1, '#111'); R(9, 3, 1, 1, '#111'); }
        if (e.messy) { R(3, 12, 6, 3, shade(c, -.2)); R(9, 18, 4, 4, '#e6e2d6'); }
      },
      gchair(g, e, t, R0) {   // 老人的高背扶手椅，椅套是手织的；在「走」的时候一摇一摆，两条腿轮流抬起来
        const f = e.fr || 0, sw = f === 1 ? -1 : f === 3 ? 1 : 0;   // 客机没有 mv，用同步过来的步行帧 fr 判断
        const R = (x, y, w, h, col) => R0(x + sw, y - (sw ? 1 : 0), w, h, col);
        const c = e.col || '#5a6a42', bx = (x, y, w, h, f) => { R(x, y, w, h, shade(f, -.45)); R(x + 1, y + 1, w - 2, h - 2, f); };
        bx(2, -7, 12, 15, shade(c, -.1)); bx(0, -3, 4, 13, shade(c, -.2)); bx(12, -3, 4, 13, shade(c, -.2));
        R(5, -5, 6, 2, '#c8b890'); R(6, -2, 4, 1, '#c8b890');
        bx(2, 5, 12, 6, c); R(5, 6, 5, 3, shade(c, -.25));
        const lg = e.mud ? '#4a3420' : '#2a1a10'; R(2, 11, 2, sw < 0 ? 3 : 4, lg); R(12, 11, 2, sw > 0 ? 3 : 4, lg); if (e.mud) { R(1, 14, 4, 1, '#3a2a18'); R(11, 14, 4, 1, '#3a2a18'); }
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
            await S.say('肯特先生', ['研究会派来的年轻人？我姓肯特，在这户人家守了三个月了。', '先把话说在前头：这屋里的事，有一部分是孩子们弄的。我亲眼见过汤米拿扫帚柄捅天花板。', '可是另一部分……我活了六十多年，没见过那样的东西。']);
            const r = await S.ask('「你信吗？」', ['「我只信录下来、拍下来的东西。」', '「我……还没想好。」'], '肯特先生');
            await S.say('肯特先生', r === 0 ? '很好。那就让机器替你看。' : '老实话。比那些一进门就说「我感觉到了」的强多了。');
            S.give('rec', true); S.give('cam', true); S.sfx('item'); S.toast('获得：录音机、相机');
            await S.say('肯特先生', '录音机和相机你拿着。敲墙声相机拍不到，磁带听得见。案子摘要再看一遍。');
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
            const L = ['又一个来看热闹的？那家的孩子啊，从来就没安分过。', '……不过那天晚上，我是听见了。墙里面，咚、咚，像有人在敲棺材板。', '以前住那屋的是个老头，眼睛不好，一个人住。死的时候……算了，大晚上的。', '我家那口子说，有天下午打这儿过，隔着楼上那扇窗户，看见书在屋里飞。那小姑娘就在窗户后面——脚底下是空的。\n他现在宁可绕远路，也不走这边的人行道。'];
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
          { id: 'gchair_l', x: 1, y: 2, spr: 'gchair', hidden: true, s: { mud: true }, light: { r: 1.5, col: 'rgba(150,170,210,.14)', a: .7 } },
          { id: 'fire', x: 4, y: 2, w: 2, spr: 'gasfire', light: { r: 4.2, col: 'rgba(255,140,60,.2)', flick: true }, on: S => S.narr(S.ent('fire').off ? '煤气取暖器灭了。陶瓷片上还残留着一点橘红色，正在一格一格地暗下去。' : '投币电表供着的煤气取暖器。五片陶瓷烧得通红，屋子却怎么也暖不起来。') },
          { id: 'telly', x: 7, y: 2, spr: 'telly', async on(S) {
            const tv = S.ent('telly');
            if (tv.lit) { tv.lit = false; S.sfx('switch'); return S.narr('你关掉了电视。雪花「噗」地缩成屏幕中间一个白点，过了好一会儿才熄。'); }
            await S.narr(S.f.act === 'morning' ? '早间新闻在播罢工的消息。主持人提了一句「恩菲尔德的灵异事件」，背景里是这栋房子的照片。' : '木壳电视机，天线上缠着锡纸。\n哈珀太太说它有时候半夜自己打开，只放雪花。');
          } },
          { id: 'llamp', x: 9, y: 2, spr: 'lamp', light: { r: 3.4, col: 'rgba(255,200,110,.14)' }, on: S => S.narr(S.ent('llamp').off ? '落地灯不亮了。灯泡还是烫的。' : '落地灯的灯罩上，有一圈烤焦的黄印子。') },
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
            if (S.f.act === 'dark' && !S.has('coin')) return grabCoin(S);
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
          { x: 18, y: 9, spr: 'plant', on: S => S.narr('走廊尽头的盆栽，叶子全部朝着同一个方向歪——朝着孩子们的房门。') }
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
          { id: 'gchair_g', x: 10, y: 7, spr: 'gchair', hidden: true, s: { mud: true }, light: { r: 2.4, col: 'rgba(170,190,230,.16)' }, on: S => finale(S) },
          { id: 'oldman_g', x: 10, y: 7, oy: -4, spr: '@oldman', hidden: true, solid: false, dir: 0 },
          { id: 'lucy_g', x: 6, y: 3, spr: '@lucy', hidden: true, dir: 0, on: S => S.say('露西', S.f.act === 'night' ? '他在等。你拿着他的眼镜，对不对？' : '……') }
        ],
        async enter(S, first) { await gardenEnter(S, first); }
      }
    }
  });
  /* ---------------- 谁在哪儿：按幕次摆放人物 ---------------- */
  function stage(S) {
    const a = S.f.act, v = (id, b) => S.show(id, !!b), is = (...l) => l.includes(a);
    v('lucy_l', is('evening', 'night')); v('tommy_l', is('evening', 'morning')); v('sue_l', is('evening', 'morning'));
    v('kent_l', is('evening', 'bed', 'morning', 'night')); v('harper_l', is('arrive', 'evening', 'bed', 'morning', 'night'));
    v('kent_k', is('placed', 'knocks', 'fetched', 'heard')); v('harper_k', is('placed', 'knocks', 'fetched', 'heard'));
    v('morton_l', is('morning')); v('spoon', is('morning', 'night'));
    const inBed = is('bed', 'placed', 'knocks', 'fetched', 'heard', 'develop', 'photo', 'dark');
    const bl = S.ent('bed_l'), bt = S.ent('bed_t'), bs = S.ent('bed_s');
    bl.s.empty = !(inBed || a === 'chest'); bt.s.empty = !inBed; bs.s.empty = !inBed;
    bt.s.peek = a === 'knocks'; bl.s.messy = is('knocks', 'chest'); bl.s.jump = a === 'chest';
    v('tommy_u', a === 'chest'); v('sue_u', a === 'chest');
    v('harper_u', is('develop', 'photo')); v('kent_u', is('develop', 'photo'));
    v('camtri', is('chest', 'develop', 'photo', 'dark'));
    for (const b of ['b1', 'b2', 'b3']) v(b, is('knocks', 'fetched', 'heard', 'chest', 'develop', 'photo', 'dark'));
    v('rec_u', is('placed', 'knocks')); S.ent('rec_u').lit = true;
    if (a === 'morning' && S.ent('tommy_l').x !== 2) { S.place('tommy_l', 2, 5, 2); S.place('sue_l', 8, 5, 1); }
    if (a === 'morning') { S.place('lucy_u', 2, 5, 3); S.ent('lucy_u').oy = 0; S.ent('lucy_u').spr = '@lucy'; } else S.hide('lucy_u');
  }
  function light(S) {
    const a = S.f.act;
    S.ent('fire').off = a === 'dark'; S.ent('llamp').off = a === 'dark'; S.ent('rlamp').off = a === 'dark'; S.ent('meter').lit = a !== 'dark';
    const tv = S.ent('telly'); if (a !== 'dark' || !S.has('coin')) tv.light = null;
    const day = a === 'morning';
    if (a === 'dark') { S.dark(.97, 'living'); S.dark(.96, 'upstairs'); S.plr(1.7); }
    else { S.dark(day ? .2 : null, 'living'); S.dark(day ? .24 : null, 'upstairs'); S.dark(day ? .28 : null, 'garden'); S.plr(null); }
  }

  /* ---------------- 楼下 ---------------- */
  async function livingEnter(S, first) {
    stage(S); light(S);
    const a = S.f.act;
    if (a === 'evening' && S.once('famIntro')) return familyIntro(S);
    if (a === 'placed' && S.once('kitchenWait')) { await S.narr('厨房里，哈珀太太和肯特先生已经在餐桌边坐好了。茶壶冒着热气。'); S.goal('到厨房餐桌边坐下，一起等'); return; }
    if (a === 'dark') {
      if (S.has('coin')) { chairGo(S, 1.2, 9, 5); return; }   // 拿着硬币上了趟楼又下来：它就在客厅门口等着
      S.ent('telly').lit = false;
      if (DIED) { chairGo(S, 2.2); S.sfx('sting'); return S.think('那把椅子又在墙角了。\n……别看它。'); }
      if (S.once('chairSeen')) {
        chairReset(S); S.focus(1, 2); S.sfx('heart');
        await S.narr('黑暗里，你的手电只照得见脚下一小圈。\n客厅的墙角——那个一直空着的墙角——');
        S.sfx('sting');
        await S.narr('放着一把高背扶手椅。\n椅子腿上，沾着湿泥。');
        S.focus(null);
        await S.think('别看它。拿硬币。投进电表。');
      }
      chairGo(S, 1.6);
    }
  }
  async function familyIntro(S) {
    await S.narr('屋里很暖，暖得有点闷。煤气取暖器呼呼地响，电视开着，没有声音。\n墙纸是那种七十年代的芥末黄，印着一圈一圈褐色的花。');
    await S.say('哈珀太太', ['你就是研究会的那位？进来，进来。小心别踩着积木。', '这是苏，这是露西，那个钻在茶几底下的是汤米。都过来打招呼。']);
    S.face('tommy_l', 'pl'); S.bubble('tommy_l', '!', 900);
    await S.say('汤米', '你那个箱子里是枪吗？');
    S.face('sue_l', 'pl');
    await S.say('苏', '汤米！那是录音机，笨蛋。');
    S.face('lucy_l', 'pl');
    await S.say('露西', '……你会待一整夜吗？上一个人十点就走了。');
    await S.say('肯特先生', ['九点了，孩子们该上床了。', '年轻人，你上楼去，把录音机放在他们卧室的五斗柜上，开着录。', '然后我们大人都在楼下厨房坐着——谁也不上楼。让机器替我们听。']);
    await S.say('哈珀太太', '都听见了？上楼，刷牙，睡觉。汤米，别让我说第二遍。');
    await Promise.all(['sue_l', 'lucy_l', 'tommy_l'].map(async (id, i) => {   // 三个孩子一起跑上楼（走路时互不阻挡）
      const e = S.ent(id); e.solid = false; await S.wait(i * 220); await S.walk(id, [15, 8], 7); S.hide(id); e.solid = true;
    }));
    S.sfx('close');
    S.f.act = 'bed'; stage(S);
    S.goal('上楼（门厅右边的楼梯），把录音机放在孩子们卧室的五斗柜上');
    S.cp();
  }
  async function kitchenTable(S) {
    const a = S.f.act;
    if (a === 'placed') return waitScene(S);
    if (a === 'fetched') return playback(S);
    if (a === 'bed') return S.narr('先上楼，把录音机放好。');
    if (['heard', 'chest', 'develop', 'photo', 'morning', 'night'].includes(a)) {
      await S.narr('餐桌上摊着你连夜写的磁带转写稿，被茶杯压出了一圈印子。');
      return S.note('tape');
    }
    await S.narr('贴着塑料桌布的餐桌，桌布上印着褪色的草莓。四把椅子，有一把的腿短了一截，垫着火柴盒。');
  }
  async function waitScene(S) {
    await S.narr('你在餐桌边坐下。哈珀太太给你倒了一杯茶，浓得像泥水。');
    await S.say('肯特先生', ['规矩是这样：我们不上楼。录音机替我们听。', '要是孩子们想闹，就让他们闹。磁带不会替任何人撒谎——它只是什么都录。']);
    await S.say('哈珀太太', '……他们会闹的。尤其是汤米。');
    S.amb('none'); await S.wait(1400);
    await knock(S, 2, 240, 'peg', true); await S.wait(700);
    await S.narr('天花板上。嗒、嗒。');
    await S.say('哈珀太太', '……开始了。', { style: 'whisper' });
    await S.wait(1100); await knock(S, 3, 380, 'wall', true); await S.wait(900);
    await S.narr('这三下不一样。更沉，更闷。像是从墙里面，而不是从床上。');
    await S.say('肯特先生', '别动。坐着。');
    await S.wait(1200); await knock(S, 4, 200, 'peg', true);
    await S.narr('灯泡晃了一下。茶杯里的茶面上，一圈一圈地起了波纹。');
    await S.wait(1500);
    S.sfx('thud'); S.shake(700, 3); await S.wait(300); S.sfx('giggle');
    await S.narr('——「哗啦」！楼上像是一整箱东西被倒在了地上。\n然后，什么声音都没有了。');
    S.amb('room');
    await S.say('肯特先生', ['好。现在可以上去了。', '把录音机拿回来——先别听，回到这张桌子上再放。我要所有人都在场。']);
    S.f.act = 'knocks'; stage(S);
    S.goal('上楼看看孩子们，把录音机拿回来');
    S.cp();
  }
  async function playback(S) {
    S.take('rec'); S.show('rec_k'); const r = S.ent('rec_k'); r.lit = true;
    await S.narr('你把录音机放在餐桌正中间，倒带，按下播放。\n哈珀太太和肯特先生都把椅子往前挪了挪。');
    S.amb('none'); S.sfx('tv'); await S.wait(600);
    for (const [cnt, pre, n, kind, post] of TAPE) {
      if (cnt === '088') { S.sfx('whisper'); S.fx('static', { dur: .5 }); growl(S); }
      const gap = n > 4 ? 520 : kind === 'peg' ? 210 : 330, t0 = Date.now();
      knockSeq(S, n, gap, kind, .5);
      await S.narr(`【计数器 ${cnt}】${pre}\n\n${post}`);
      const left = 500 + n * gap - (Date.now() - t0); if (left > 0) await S.wait(left);   // 敲完了再翻下一组，两组声音不叠在一起
      if (cnt === '066') { S.sfx('heart'); await S.say('哈珀太太', '……这一段，我们在楼下根本没听见。', { style: 'whisper' }); }
      if (cnt === '088') { S.shake(400, 2); await S.say('哈珀太太', '那、那是谁的声音？', { style: 'whisper' }); }
    }
    r.lit = false; S.hide('rec_k'); S.give('rec', true); S.amb('room');
    await S.say('肯特先生', ['014 和 047——你听出来了吧。那是汤米。他那个憋着的笑，我闭着眼都认得。还有那种脆响，是硬东西敲木头，不是墙。', '这就是我们这行的难处：一盘磁带里，真的和假的录在一起，分不开。']);
    await S.think('可是 031 那一段，三个孩子都在说话，敲击一直没停。\n066 的时候，他们都睡着了——而我们在楼下，根本没听见那七下。');
    await S.say('肯特先生', '还有最后那一句……「箱子」。');
    await S.say('哈珀太太', ['箱子……', '楼梯底下的柜子里，是有一个铁皮箱。我们搬来的时候就在了，房管处说是前一个住户的，一直没人来领。', '上面挂着一把三位数的密码锁。我们谁也打不开。']);
    await S.say('肯特先生', '如果真有什么东西想告诉我们密码……它会用它自己的敲法。孩子们的那几下，不算数。');
    await S.note('tape');
    S.f.act = 'heard'; stage(S);
    S.goal('打开楼梯底下柜子里的铁皮箱（三位数密码锁）');
    S.cp();
  }
  async function cupboard(S) {
    const a = S.f.act, d = S.ent('cup_d');
    if (S.f.chestOpen) return S.narr('铁皮箱空了。箱底垫着一张发黄的报纸，1963年12月。讣告栏里，有一个名字被铅笔圈了起来。');
    if (a !== 'heard') return S.narr('楼梯底下的储物柜。门缝里飘出一股樟脑丸和旧报纸的味道。\n门把手冰凉，比屋里任何东西都凉。');
    d.open = true; S.sfx('open');
    if (S.once('chestSeen')) await S.narr('柜子里塞满了吸尘器、旧雨靴、一袋圣诞装饰……\n最里面，是一只绿漆剥落的铁皮箱。挂锁上有三个数字转轮。');
    const v = await S.keypad('铁皮箱的密码锁 · 三位数\n（磁带转写稿可以在「笺」里翻看）', ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'], 3);
    if (v == null) return;
    if (v !== '371') {
      S.sfx('locked'); S.f.codeFail = (S.f.codeFail || 0) + 1;
      if (/[24]/.test(v)) await S.narr('锁纹丝不动。\n你想起磁带里汤米憋着的笑声，和那种「嗒嗒」的脆响……那几下，也许不该算进去。');
      else await S.narr('锁纹丝不动。转轮咔咔地响，像在嘲笑你。');
      if (S.f.codeFail >= 3) await S.say('肯特先生（厨房）', ['014 和 047 是汤米——脆的那种，晾衣夹敲床头板。', '剩下的是 031、066、088。按顺序，每一组敲了几下？']);
      else if (S.f.codeFail === 2) await S.say('肯特先生（厨房）', '把转写稿再看一遍！划掉孩子们弄出来的，剩下的按顺序数——一组，一个数字。');
      return;
    }
    S.f.chestOpen = true; S.sfx('open'); await S.wait(300);
    await S.narr('「咔哒」。\n锁开了。箱盖上的锈渣簌簌地往下掉。');
    await S.narr('箱子里的东西不多：\n一副缠着胶布的老花眼镜。一块停了的黄铜怀表。一把系着硬纸片的小钥匙。\n还有一封没有寄出去的信。');
    S.give('glasses', true); S.give('watch', true); S.give('shedkey', true); S.sfx('item'); S.toast('获得：老花眼镜、怀表、棚屋钥匙');
    await S.note('letter');
    if (S.f.heardOld) await S.think('邻居太太说过：以前住这屋的是个老头，眼睛不好，一个人住。');
    await S.think('约瑟夫。三点一刻。楼下角落的那把椅子。\n……这只箱子锁了十四年。孩子们不可能打开过。');
    S.f.act = 'chest'; stage(S);
    S.amb('drone'); S.sfx('scream'); S.shake(800, 3);
    await S.say('苏（楼上）', '妈妈——！！露西！露西她——！！', { style: 'big' });
    await S.say('肯特先生', '相机！带上相机，快上去！我扶着哈珀太太！');
    S.goal('露西出事了——带着相机上楼！');
    S.cp('chest');
  }
  async function grabCoin(S) {
    S.give('coin'); S.sfx('item');
    await S.narr('你摸到了哈珀太太的手提包，翻出钱包——\n里面只剩两枚五十便士。你攥住一枚，指甲都嵌进了棱角里。');
    const c = S.ent('gchair_l'), cx = Math.round(c.px / 16), cy = Math.round(c.py / 16);
    const far = Math.abs(cx - W.pl.x) + Math.abs(cy - W.pl.y) > 5;   // 已经追到跟前的，就不挪了
    const tv = S.ent('telly'); tv.lit = true; tv.light = TVL; S.sfx('tv');
    if (far) { S.stop('gchair_l'); S.place('gchair_l', 9, 5, 2); }
    await S.narr('身后「噗」的一声——客厅的电视自己亮了。\n雪花的白光，从门口斜斜地照进厨房。');
    S.focus(far ? 9 : cx, far ? 5 : cy); S.sfx('sting');
    await S.narr(far ? '那把椅子已经不在墙角了。\n它就停在客厅通厨房的门口，面朝着你。' : '那把椅子就在你身后。\n椅子腿上的湿泥，在雪花光里亮晶晶的。');
    S.focus(null);
    S.chase('gchair_l', { spd: 2.75, catch: caughtChair }); S.ent('gchair_l').chase.wait = 1.0;
    S.goal('快！绕开椅子去门厅，把硬币投进电表（厨房下边的门出去）');
  }
  async function meterOn(S) {
    const a = S.f.act;
    if (a !== 'dark') return S.narr('投币电表。计数窗里的数字一格一格地走，走得比你想象的快。\n旁边贴着一张字条：「五十便士 ≈ 一个晚上。别忘了！！」');
    if (!S.has('coin')) return S.narr('你摸到了电表。投币口冰凉——可你手里没有硬币。\n（哈珀太太说，钱包在厨房台子上。）');
    S.take('coin'); S.stop('gchair_l'); S.ent('telly').lit = false; S.ent('telly').light = null;
    await S.narr('你把硬币塞进投币口。「当啷」一声。你拧动旋钮——');
    S.sfx('switch'); S.f.act = 'morningPre'; S.ent('meter').lit = true; S.ent('fire').off = false; S.ent('llamp').off = false; S.ent('rlamp').off = false;
    S.dark(null, 'living'); S.dark(null, 'upstairs'); S.plr(null); S.amb('room');
    await S.narr('灯亮了。煤气取暖器「噗」地一声蹿起蓝火。');
    const c = S.ent('gchair_l');
    S.focus(Math.round(c.px / 16), Math.round(c.py / 16)); S.sfx('heart');
    await S.wait(600);
    await S.alpha('gchair_l', 0, 900);
    S.focus(1, 2);
    await S.narr('你回过头。\n墙角是空的。\n地毯上，那四个方形的压痕里，是新鲜的湿泥。');
    S.focus(null);
    await S.fade(1, 900);
    await S.card('第二天上午', '', '后半夜什么也没再发生。\n天亮的时候，研究会又来了一个人——\n\n莫顿博士。研究会里最有名的怀疑派。\n她说，她是来「收拾残局」的。');
    S.f.act = 'morning'; stage(S); light(S);
    S.pos(9, 6, 1);
    await S.fade(0, 700);
    await mortonIntro(S);
  }

  /* ---------------- 楼上 ---------------- */
  async function upstairsEnter(S, first) {
    stage(S); light(S);
    const a = S.f.act;
    if (first) await S.narr('楼上比楼下冷。走廊尽头的浴室门缝里，透出一点红光——那是肯特先生临时搭的暗房。');
    if (a === 'bed' && S.once('upBed')) await S.narr('孩子们的卧室里，三张小床挤在一起。三个脑袋从被子里探出来，齐刷刷地看着你。');
    if (a === 'knocks' && S.once('upKnock')) { S.sfx('heart'); await S.narr('卧室里一片狼藉：积木撒了一地，露西的被子拖在地上。\n三个孩子都在床上。汤米的被子拉到了鼻子。'); }
    if (a === 'chest' && S.once('upLev')) {
      S.sfx('thud'); S.shake(900, 3);
      await S.narr('露西的床在跳——不是晃，是整张床一下一下地从地板上蹦起来！\n露西死死抓着床头，叫不出声。');
      await S.say('苏', '它又来了！它又来了！');
      S.goal('把相机架上门边的三脚架，对准露西的床');
    }
    if (a === 'morning' && S.once('upMorning')) await S.narr('卧室里乱糟糟的。露西一个人坐在床边，背对着门。');
  }
  async function kidsDresser(S) {
    const a = S.f.act;
    if (a === 'bed') {
      S.take('rec'); S.show('rec_u'); S.ent('rec_u').lit = true; S.sfx('switch');
      await S.narr('你把录音机放在五斗柜上，麦克风朝着那面墙，按下录音键。\n磁带「沙沙」地转了起来。');
      await S.say('苏', '你要录我们说梦话吗？');
      await S.say('汤米', '我要说一百句脏话！');
      await S.say('哈珀太太（楼下）', '汤米！');
      S.f.act = 'placed'; stage(S);
      S.goal('下楼，到厨房跟大人们一起等');
      return;
    }
    if (a === 'placed') return S.narr('录音机在转，红灯一闪一闪。\n说好了谁也不上楼的——你该下去了。');
    if (a === 'knocks') {
      S.hide('rec_u'); S.give('rec', true); S.sfx('switch');
      await S.narr('录音机还在转，计数器停在 092。你按下停止键。\n「咔」。屋里静得能听见三个孩子的呼吸。');
      S.f.act = 'fetched'; stage(S);
      S.goal('回厨房，在餐桌上回放录音');
      return;
    }
    await S.narr('五斗柜。最上面一层抽屉关不严——它「走」过太多回了。\n柜脚在地板上刮出了四道弧形的白印，一直延伸到门口。');
  }
  async function bedLucy(S) {
    const a = S.f.act;
    if (a === 'chest') {
      if (!S.ent('camtri').s.set) { S.shake(300, 2); return S.narr('床在跳！你伸手去按，被整张床弹开了。\n——相机！先把相机架起来！'); }
      return levitate(S);
    }
    if (a === 'morning') {
      if (S.once('diary')) await S.narr('露西的枕头底下，压着一本作文本。封皮上写着：「不许看」。\n……露西没有拦你。');
      S.f.diary = true;
      await S.note('diary');
      S.goal(S.f.tomConf ? '下楼回答莫顿博士' : '去客厅问问汤米，再回答莫顿博士');
      return;
    }
    if (a === 'bed' || a === 'placed') return S.say('露西', '它在墙里面。你等着听吧。');
    if (a === 'knocks') return S.say('露西', ['不是我们。', '……这次不是。']);
    if (a === 'fetched' || a === 'heard') return S.narr('露西闭着眼睛，可你知道她没睡着。她的嘴唇在动，像在数数。');
    if (['develop', 'photo', 'dark'].includes(a)) return S.narr('露西睡着了。她的手攥着被角，指节发白。\n枕头上，有一小块湿印子。');
    await S.narr('露西的床。枕头上有几根掉落的短头发。');
  }
  async function bedTommy(S) {
    const a = S.f.act;
    if (a === 'knocks') {
      S.bubble('bed_t', '…', 1200); S.sfx('giggle');
      await S.narr('汤米把被子拉到鼻子，眼睛滴溜溜地转。\n「我睡着了。」他说。');
      return S.narr('他的睡裤口袋里，鼓鼓囊囊地塞着什么东西。床头板上有一排新鲜的小凹印。');
    }
    if (a === 'bed' || a === 'placed') return S.say('汤米', '你那个机器，能录到屁吗？');
    await S.narr('汤米的床。床头板上有一排小小的凹印，像是被什么硬东西反复敲过。');
  }
  async function bedSue(S) {
    const a = S.f.act;
    if (a === 'bed' || a === 'placed') return S.say('苏', '你放心，我会看着他们的。');
    if (a === 'knocks') return S.say('苏', ['我叫汤米别闹了。他不听。', '……可是后来那几下，他真的在被子里。我看着呢。']);
    await S.narr('苏的床头贴着一张大卫·鲍伊的海报，边角卷了起来。');
  }
  async function brickOn(S) {
    await S.narr('一块积木。你捡起来——\n是温的。像刚在谁的手心里攥了很久。');
    if (S.once('brickThink')) await S.think('孩子们手里攥热的？还是……\n先别下结论。记下来：积木，温的。');
  }
  async function tripod(S) {
    const c = S.ent('camtri');
    if (S.f.act === 'chest' && !c.s.set) {
      c.s.set = true; S.sfx('switch');
      await S.narr('你把相机拧上三脚架，对准露西的床，插上快门线。\n电动马达——按住快门，它会自己一张接一张地拍。');
      S.goal('按快门！（调查露西的床）');
      return;
    }
    await S.narr(c.s.set ? '相机还对着露西的床。镜头上蒙了一层哈气。' : '一个折起来的三脚架。');
  }
  async function levitate(S) {
    S.f.act = 'lev';
    const L = S.ent('lucy_u'), B = S.ent('bed_l'), C = S.ent('camtri');
    await S.narr('你按下了快门线。');
    B.s.empty = true; B.s.jump = false; L.spr = '@lucy'; S.place('lucy_u', 1, 3, 0); L.oy = -2;
    for (let i = 0; i < 4; i++) {
      C.s.flash = true; S.fx('flash'); S.sfx('cut'); S.shake(200, 1);
      await S.wait(140); C.s.flash = false; L.oy -= 4; await S.wait(420);
    }
    await S.narr('咔嚓、咔嚓、咔嚓——\n每一次闪光，露西都在半空里，比上一次更高一点。\n她的睡裙鼓了起来，头发向上飘着。');
    S.sfx('thud'); S.shake(800, 4); L.oy = 0; S.place('lucy_u', 2, 5, 0);
    await S.narr('然后，「砰」的一声，她被摔在了地板上——就落在你脚边。');
    S.sfx('heart'); await S.wait(900);
    L.spr = '@lucyv'; S.amb('otherworld');
    await S.narr('露西慢慢坐了起来。');
    await S.scare('face', { spr: '@lucyv', dur: .9, sfx: 'sting' });
    await S.narr('眼睛睁着，可是只看得见眼白。');
    await old(S, '……这是……我的房子。');
    await S.say('苏', '露西？露西你别吓我……');
    await old(S, ['我在楼下……那把椅子上……眼睛看不见了……', '然后我就死了。我睡着了，然后我就死了。']);
    await old(S, '我叫约瑟夫。……谁拿了我的眼镜？');
    const r = await S.ask('那个嗓音在等你回答。', ['（把铁皮箱里的老花眼镜拿给她看）', '（端起床头那杯水）「含一口。别咽，也别吐。」', '「露西，是你在装吗？」']);
    if (r === 0) {
      S.f.showedGlasses = true;
      await S.narr('你把那副缠着胶布的眼镜，放到她面前。');
      await old(S, ['……就是它。就是它……', '三点一刻了吧？收音机……该报新闻了……']);
    } else if (r === 1) {   // 含水试验：真实案件里调查员做过的测试；这里两边的证据都摆出来
      S.f.water = true;
      await S.narr('床头柜上有半杯凉水。你把杯子递到她嘴边。\n她乖乖地含了一大口，两腮鼓了起来。你用手掌托住她的下巴。');
      await old(S, '……你们……总是……不信……');
      await S.narr('那个声音还在说。嘴唇几乎没动，一滴水也没漏出来。\n——可你的手掌底下，感觉得到她的喉咙在一下一下地动。');
      await old(S, '三点一刻了吧？……我要听收音机……');
      await S.narr('她把水原样吐回了杯子里。一滴没少。');
    } else {
      await old(S, '……装？……小家伙们装的时候，我在旁边看着呢。他们敲得不对。');
      await old(S, '三点一刻了吧？……我要听收音机……');
    }
    S.sfx('whisper'); await S.wait(700);
    L.spr = '@lucy'; S.amb('drone');
    await S.narr('露西身子一软。等她再睁开眼睛，又是那个十一岁的女孩了。');
    await S.say('露西', '……我又说话了吗？我刚才……说什么了？');
    S.show('harper_u'); S.show('kent_u'); S.sfx('open');
    await S.say('哈珀太太', '露西！宝贝，宝贝……');
    await S.think('三点一刻。那块怀表就揣在我口袋里。表盖我开箱以后才打开——她没有见过。');
    await S.say('肯特先生', ['你拍到了？好。好极了。', '马上去冲出来，趁我们都还记得刚才发生了什么。浴室就是暗房，药水我下午就调好了。', '记住——照片不会撒谎。可它也不会替你解释。']);
    S.hide('lucy_u'); S.f.act = 'develop'; stage(S);
    S.goal('去浴室（暗房）冲洗照片');
    S.cp();
  }
  async function lucyUp(S) {
    if (S.f.act !== 'morning') return;
    S.face('lucy_u', 'pl');
    if (S.f.diary) return S.say('露西', '你看完了。……那你现在信哪一半？');
    await S.say('露西', ['你也觉得我们是骗子吧。莫顿博士是这么说的。', '……我枕头底下有个本子。你自己看吧。我不想再说一遍了。']);
    S.goal('看看露西枕头底下的本子');
  }
  async function develop(S) {
    const a = S.f.act, T = S.ent('trays');
    if (a !== 'develop') return S.narr(T.full ? '冲洗盘里的药水已经凉了。相纸上的露西，还悬在半空。' : '两只冲洗盘，一瓶显影液，一瓶定影液。肯特先生的字条：「先显影，后定影，别开灯！」');
    await S.narr('你关上门，红色的安全灯下，一切都像泡在血里。\n胶卷进了显影罐，摇，等，倒出来，再摇。');
    S.sfx('water'); await S.wait(700);
    T.full = true;
    await S.narr('相纸在药水里，影子一点一点浮了出来——');
    await S.narr('第一张：床在跳，露西抓着床头，嘴张得很大。\n第三张：她摔在地上，枕头还在半空。\n第四张：一片模糊，只有闪光灯的反光。');
    S.sfx('sting');
    await S.narr('第二张……\n露西在半空里，离床足有两英尺。\n你盯着它看了很久。越看，越觉得这张照片里还有别的东西。');
    const r = await S.ask('拿起放大镜，凑近第二张？', ['凑近看', '先等等']);
    if (r) return;
    S.f.act = 'photo'; S.f.pc = 0;
    await S.go('photo', 4, 6, 3, { ms: 900 });
  }
  const CLUE = {
    legs: '露西在半空中，头发向上飘着，睡裙鼓了起来。\n可是——她的膝盖是弯的，脚尖绷得笔直。\n就像……就像一个刚刚从弹簧床垫上蹦起来的孩子。',
    bed: '露西的床垫上，有两个深深的凹坑，并排，各有一个脚掌那么大。\n凹坑还没来得及弹回去——闪光灯亮的前一瞬，有人在这里用力蹬了一下。',
    curtain: '窗户关着，插销插着，窗缝上还贴着胶带。\n可是窗帘整个往屋里鼓了起来，像有一阵很大的风，从玻璃里面往外——不，往里吹。',
    mirror: '衣柜的穿衣镜里，照出的是这间屋子：三张床，玩具箱，苏，半空中的露西。\n还有墙角里一把高背扶手椅。\n椅子上坐着一个秃顶的老人，手搭在扶手上，侧着脸，在看露西。'
  };
  async function clue(S, k) {
    await S.narr(CLUE[k]);
    if (k === 'mirror') {
      if (S.once('mirrorScare')) { await S.wait(300); await S.scare('face', { spr: '@oldman', dur: .8 }); }
      await S.narr('……可是照片里这间屋子的墙角，什么都没有。');
    }
    const r = await S.ask('你在笔记本上记下：', ['人为的——看起来是装的', '无法解释——看起来是真的', '说不清']);
    if (S.f['pj_' + k] == null) S.f.pc = (S.f.pc || 0) + 1;
    S.f['pj_' + k] = r;
    if (S.f.pc >= 4) S.goal('线索都记下了。从下边的相纸边缘出去');
  }
  async function photoExit(S) {
    if ((S.f.pc || 0) < 4) return S.narr('还有地方没看仔细。\n（露西、她的床、窗帘、衣柜的镜子）');
    await S.narr('你直起身。\n红光、药水的酸味、雨声，一下子全涌了回来。');
    S.f.photoDone = true;
    await S.go('upstairs', 17, 5, 0, { ms: 700 });
    await blackout(S);
  }
  async function blackout(S) {
    await S.wait(500);
    S.f.act = 'dark'; S.sfx('switch'); light(S); stage(S); S.amb('drone');
    await S.narr('「啪」。\n红灯灭了。整栋房子一下子黑透了。');
    S.sfx('scream');
    await S.say('汤米（隔壁）', '妈妈！灯！灯没了！');
    await S.say('肯特先生（走廊）', ['是电表——投币的，钱用完了！', '电表在楼下门厅！谁有五十便士？']);
    await S.say('哈珀太太', '我的钱包在厨房台子上！我得看着孩子们……你去！');
    S.sfx('thud'); await S.wait(300);
    await S.narr('楼下传来一声闷响。\n像是什么很重的东西，在地板上被拖了一下。');
    S.goal('摸黑下楼：从厨房台子上的钱包里拿五十便士，投进门厅的电表');
    S.cp('dark');
  }

  /* ---------------- 第二天：怀疑派 ---------------- */
  async function mortonIntro(S) {
    S.face('morton_l', 'pl');
    await S.say('莫顿博士', ['你就是昨晚拿录音机的那个年轻人。照片我看过了——肯特先生天不亮就冲出来拿给我。', '第二张。膝盖弯着，脚尖绷着。一个跳起来的孩子。']);
    S.face('morton_l', 1);
    await S.say('莫顿博士', '还有这个。（她指了指茶几上那把弯成钩子的汤勺）昨天下午，隔壁房间的摄像机拍到露西把它掰弯的。');
    await S.say('肯特先生', '那镜子里的人呢？还有那把椅子？');
    await S.say('莫顿博士', ['镜子里那团东西，我看像是椅背上搭着的衣服。至于椅子——昨晚停了电，谁也没看清。', '研究会要一份报告。肯特先生的意见我知道了。我想听你的——你是唯一一个全程拿着录音机和相机的人。']);
    await S.note('memo');
    if (S.f.water) {
      await S.say('莫顿博士', ['肯特先生说，你昨晚自己做了含水试验。', '你的手托着她的下巴——感觉到喉咙在动了吧？假声本来就是从喉咙里出来的，含着水也一样。', '……不过我承认，含着一口水还能连着说那么多句，我自己在家试过。做不到。']);
    }
    await S.say('莫顿博士', '先去问问孩子们。汤米在这儿，露西躲在楼上。问完了，回来告诉我你的结论。');
    S.goal('听听孩子们怎么说（客厅的汤米、楼上的露西），再回答莫顿博士');
    S.cp();
  }
  async function mortonTalk(S) {
    if (S.f.act !== 'morning') return;
    S.face('morton_l', 'pl');
    if (!(S.f.tomConf && S.f.diary)) return S.say('莫顿博士', S.f.tomConf ? '露西呢？你还没听她怎么说。她在楼上。' : '先去问问孩子们。尤其是汤米——他看我的眼神，像只偷了香肠的狗。');
    await S.say('莫顿博士', '好。你的结论是什么？报告只有一页纸，我要一句话。');
    const V = await S.vote('你的结论：', ['「全是假的。孩子们一直在骗人。」', '「全是真的。孩子们从来没装过。」', '「有真有假。我们一条一条说。」'], '莫顿博士');
    let r = V.v;
    if (!V.agree) {   // 两人意见不合
      if (V.h === 2 || V.g === 2) { await S.narr('你们俩对看了一眼——两个人，两个结论。'); await S.say('莫顿博士', '研究会派来的两个人，自己都没统一。……那就别给我一句话了。一条一条说。'); r = 2; }
      else { await S.narr('一个说全是真的，一个说全是假的。'); return S.say('莫顿博士', ['一个全信，一个全不信。', '两个人加起来，正好等于什么都没看。商量好了再来。']); }
    }
    if (r === 0) return badEnd(S);
    if (r === 1) {
      await S.say('莫顿博士', '全是真的？');
      S.face('tommy_l', 'pl');
      await S.say('汤米', '……第一下和衣柜那次，是我敲的。我都跟你说了。', { style: 'whisper' });
      await S.say('莫顿博士', ['你自己的磁带里，014 和 047，录得清清楚楚。你自己的照片里，床垫上两个脚印。', '你连自己的录音都不信，那你还录它做什么？']);
      await S.think('……她说得对。说「全是真的」，和说「全是假的」一样——都是不想再看下去了。');
      return;
    }
    const Q = [
      ['一、磁带 014 和 047 的敲击声。', ['汤米敲的', '无法解释'], 0, '汤米自己都承认了——晾衣夹，敲床头板。你要替一个八岁的孩子否认他做过的事？'],
      ['二、磁带 031 和 066 的敲击声，还有 088 那句「箱子」。', ['孩子们弄的', '无法解释'], 1, '031 那段，三个孩子都在说话，敲击声没停；066 的时候，他们都睡着了，楼下的大人一下都没听见。还有「箱子」——孩子们怎么知道楼梯底下锁着一只十四年没开过的箱子？我没说那是鬼。我是说，你解释不了。'],
      ['三、第二张照片里，露西「浮」在半空。', ['她自己跳起来的', '她真的浮起来了'], 0, '膝盖、脚尖、床垫上两个脚印——都是你在照片里亲手记下来的。'],
      ['四、镜子里的老人，和露西用那个嗓音说出的「三点一刻」。', ['露西编的', '无法解释'], 1, '铁皮箱锁了十四年，怀表停在三点一刻——在你开箱以前，这件事谁都不知道。她要怎么编？']
    ];
    const LB = ['人为的', '无法解释', '说不清'], mine = k => S.f['pj_' + k] == null ? '（没写）' : LB[S.f['pj_' + k]];
    const PRE = [null, null,   // 第三、四问前，她翻开你在照片里记的笔记
      () => S.say('莫顿博士', `（她翻着你的笔记本）照片里，「膝盖」那条你写的是「${mine('legs')}」，「床垫」写的是「${mine('bed')}」。`),
      () => S.say('莫顿博士', [`「镜子」那条，你写的是「${mine('mirror')}」。「窗帘」写的是「${mine('curtain')}」。`, '……窗帘那条，我也解释不了。窗户封着胶带，风从哪儿来？我会写进报告里。'])];
    let wrong = 0;
    for (const [qi, [q, opts, right, msg]] of Q.entries()) {
      if (PRE[qi]) await PRE[qi]();
      const a = await S.ask(q, opts, '莫顿博士');
      if (a !== right) { wrong++; await S.say('莫顿博士', msg); }
      else await S.say('莫顿博士', ['……嗯。', '……记下了。', '……好。', '……'][Q.findIndex(z => z[0] === q)]);
    }
    if (wrong) { await S.say('莫顿博士', '你自己还没想清楚。再去看看你的转写稿和照片，想清楚了再来找我。'); return; }
    await S.say('莫顿博士', ['……「部分现象，确认为儿童伪造。部分现象，目前无法解释。」', '肯特先生，你满意了？', '我是不满意的。可我不能在报告上写我自己也不相信的东西——哪一边都不能。']);
    await S.say('肯特先生', '在我们这行，这已经算是投降了。……谢谢你，博士。');
    S.hide('morton_l');
    await S.fade(1, 900);
    await S.card('当天夜里', '', '莫顿博士走了。记者也走了——\n他们说，没有新照片，就没有新闻。\n\n这栋房子，第一次这么安静。');
    S.f.act = 'night'; stage(S); light(S);
    S.place('lucy_l', 13, 8, 3); S.pos(12, 7, 2);
    await S.fade(0, 700);
    S.face('lucy_l', 'pl');
    await S.say('露西', ['他今天晚上要来。……不，他不在屋里了。他在棚屋里，跟他的椅子在一起。', '他看不见路。你拿着他的眼镜，对不对？', '我跟你一起去。我不怕他。他只是……很久没有人跟他说话了。']);
    S.follow('lucy_l', true);
    S.goal('带露西去后院的棚屋（厨房后门）');
    S.cp('night');
  }
  async function driveEnd(S, C) {   // 第三结局：赶走（坏结局，保留棚屋前的检查点）
    await S.say('你', '滚出这栋房子，别再缠着这家人！');
    S.sfx('thud'); S.shake(900, 4); S.fx('red'); C.s.glasses = true;
    await S.narr('椅子猛地往后一滑，在草地上犁出两道沟。\n栅栏那边，所有人家的狗同时叫了起来。');
    await S.say('露西', ['不是这样的！', '他不是坏人……他只是在等。你们大人只会赶人走——赶他走，赶我们走。'], { style: 'whisper' });
    S.ent('lucy_g').spr = '@lucyv'; growl(S);
    await S.scare('face', { spr: '@oldman', dur: .8 });
    await S.say(OLD, '……好。我走。', { style: 'whisper' });
    S.ent('lucy_g').spr = '@lucy';
    S.hide('gchair_g'); S.amb('wind');
    await S.narr('扶手上的眼镜和怀表还在草地上。椅子不见了。');
    await S.end({ bad: true, id: 'drive', title: '赶走', text: '那天夜里，84号的墙里第一次什么声音都没有。\n哈珀太太哭了，肯特先生在本子上写：「现象停止」。\n\n隔壁的邻居太太第二天一早来敲门，脸色发白。\n她家的墙里，响了一整夜。\n咚。……咚。很慢，很有耐心。\n\n他还是没找到路。\n只是换了一面墙。' });
  }
  async function badEnd(S) {
    await S.say('你', '全是假的。……孩子们一直在骗人。');
    await S.say('莫顿博士', ['……谢谢。这样报告就好写了。', '（她顿了一下）那把椅子——']);
    await S.say('你', '停电了。谁也没看清。');
    await S.narr('楼梯上，露西不知道什么时候站在那儿。\n她看了你一眼，什么也没说，转身上楼去了。');
    S.sfx('knock'); await S.wait(900); S.sfx('knock');
    await S.end({ bad: true, id: 'bad', title: '一场恶作剧', text: '报告登上了报纸：「鬼屋骗局：孩子们承认造假」。\n房管处以「扰乱邻里」为由，要哈珀一家搬走。露西被送去外地的姨妈家，「换个环境」。\n\n84号空了。\n新搬来的那户人家，第一个晚上就听见了墙里的敲击声。\n咚。……咚。……很慢，很有耐心。\n\n这一次，没有人再录下来。' });
  }

  /* ---------------- 人物对话 ---------------- */
  const pickL = (S, k, L) => L[(S.f[k] = ((S.f[k] ?? -1) + 1) % L.length)];
  async function harperTalk(S) {
    const a = S.f.act;
    const T = {
      evening: ['我们家这几个月……谢谢你们肯来。', '别人都说我神经病。邻居说，房管处也说。我只想有人告诉我，我的孩子们没疯。'],
      bed: ['孩子们上去了。苏会看着他们的——她是老大，什么都管。'],
      placed: ['再来点茶？……我已经不知道今晚是第几壶了。'],
      knocks: ['每天晚上都这样。我已经分不清哪一下是孩子闹的，哪一下……不是。'],
      fetched: ['快放吧。我想知道。我又怕知道。'],
      heard: ['铁皮箱就在楼梯底下的柜子里。三个转轮的密码锁。我试过孩子们的生日，试过门牌号……都不对。'],
      develop: ['露西平时连大声说话都不敢。那个声音不是她的。我是她妈，我知道。'],
      photo: ['露西平时连大声说话都不敢。那个声音不是她的。我是她妈，我知道。'],
      morning: ['莫顿博士说，报告上要是写「造假」，房管处就会让我们搬走——「扰乱邻里」。', '我不怪孩子们装过。我只怪自己，没早点让人信我们。'],
      night: ['去吧。我在这儿等着。', '替我跟他说一声……这么多年，我们一直借住在他的房子里。']
    }[a] || ['……'];
    await S.say('哈珀太太', pickL(S, '_hp', T));
  }
  async function lucyTalk(S) {
    const a = S.f.act;
    if (a === 'night') return S.say('露西', S.ent('lucy_l').follow ? '后门在厨房。……他在等。' : '走吧。');
    S.face('lucy_l', 'pl');
    await S.say('露西', pickL(S, '_lc', ['你也是来看我飞的吗？', '……我不喜欢晚上。晚上它会叫我的名字，用一个老爷爷的声音。', '汤米会捣乱的。可是有的事情不是汤米。']));
  }
  async function tommyTalk(S) {
    const a = S.f.act, id = S.map === 'living' ? 'tommy_l' : 'tommy_u';
    S.face(id, 'pl');
    if (a === 'chest') return S.say('汤米', '我、我什么都没干！这次真的不是我！你看我的手！');
    if (a === 'morning') {
      if (!S.f.tomConf) {
        await S.say('汤米', ['……好吧。是我敲的。第一次，还有衣柜那次。', '用的是这个。']);
        await S.narr('他从睡裤口袋里掏出一个木头晾衣夹，递给你。夹子的一头已经被敲得起了毛。');
        await S.say('汤米', ['敲床头板，声音跟墙里的一模一样。', '可是中间那几下不是我！苏看着呢！还有后来那几下——我那时候睡着了，我发誓。', '我就是……想让大人们别走。他们一走，它就来。']);
        S.f.tomConf = true;
        if (!S.f.diary) S.goal('再去楼上看看露西，然后回答莫顿博士'); else S.goal('回答莫顿博士');
        return;
      }
      return S.say('汤米', '你会跟那个阿姨说我是坏孩子吗？');
    }
    await S.say('汤米', pickL(S, '_tm', ['你那个箱子里是枪吗？', '我能按一下那个红按钮吗？就一下。', '我们家有鬼，你知道吗？它住在墙里。']));
  }
  async function sueTalk(S) {
    const a = S.f.act, id = S.map === 'living' ? 'sue_l' : 'sue_u';
    S.face(id, 'pl');
    if (a === 'chest') return S.say('苏', ['你看见了吧？你看见了吧！', '汤米就站在那儿，他的手在外面！']);
    if (a === 'morning') return S.say('苏', pickL(S, '_su2', ['我是老大，我该管住他们的。', '露西掰勺子的时候我看见了。我没说。我怕一说，大人们就会觉得所有的事都是假的。', '那天晚上，衣柜的镜子里……我也看见那个老爷爷了。']));
    await S.say('苏', pickL(S, '_su', ['汤米会捣乱的，你别信他。露西……露西不会。', '你们大人总是问「是不是你们干的」。从来不问「你们害不害怕」。']));
  }
  async function kentTalk(S) {
    const a = S.f.act, id = { living: S.ent('kent_k').hidden ? 'kent_l' : 'kent_k', upstairs: 'kent_u' }[S.map];
    if (id) S.face(id, 'pl');
    const T = {
      evening: ['先上楼放录音机。孩子们的卧室，五斗柜上。'],
      bed: ['去吧，把录音机放好。我在厨房等你。'],
      placed: ['坐下，喝茶。等。我们这行，一大半时间都在等。'],
      knocks: ['上去把录音机拿回来。别在孩子们面前听。'],
      fetched: ['放吧。从头放。'],
      heard: S.f.codeFail >= 3 ? ['031、066、088——没人敲的那三组。按顺序，每组几下？'] : S.f.codeFail ? ['把孩子们弄出来的那几组划掉。剩下的按顺序数——一组，一个数字。'] : ['它要是想告诉我们什么，就会用它自己的敲法。孩子们的那几下，不算数。', '你听出来没有？晾衣夹敲木头是脆的。墙里那个，是闷的。'],
      develop: ['快去冲照片。这种事，一个钟头以后连我自己都会记错。'],
      photo: ['快去冲照片。这种事，一个钟头以后连我自己都会记错。'],
      morning: ['莫顿是个好研究员。她不信，可她诚实。', '我们这行最大的敌人不是怀疑——是只想要一个答案。'],
      night: ['去吧。我年纪大了，就在屋里等你们。']
    }[a] || ['……'];
    await S.say('肯特先生', pickL(S, '_kt', T));
  }

  /* ---------------- 后院与结局 ---------------- */
  async function gardenEnter(S, first) {
    light(S);
    const a = S.f.act, sh = S.ent('shed');
    if (first && a !== 'night') await S.narr('后院很小，四周是齐胸高的木栅栏。隔壁家的后院，也是一模一样的晾衣绳，一模一样的小棚屋。');
    if (a === 'night') {
      S.place('lucy_g', 6, 3, 0); S.follow('lucy_g', true);
      sh.open = true; S.show('gchair_g'); S.ent('gchair_g').s.mud = true;
      if (S.once('nightGarden')) {
        S.focus(10, 6);
        await S.narr('棚屋的门开着。\n那把高背扶手椅自己「走」了出来，停在草地中间，面朝着房子。');
        await S.say('露西', '……他在这儿。', { style: 'whisper' });
        S.focus(null);
        S.goal('走到椅子跟前');
      }
    }
  }
  async function shedOn(S) {
    const sh = S.ent('shed'), a = S.f.act;
    if (a === 'night') return S.narr('棚屋里空了。只剩一块揉皱的帆布，和地上两道被拖出来的印子。');
    if (!S.has('shedkey')) return S.narr('棚屋的门上挂着一把生了锈的挂锁。\n门缝里，有一股旧羊毛和机油的味道。');
    if (!sh.open) {
      sh.open = true; S.sfx('open');
      await S.narr('挂锁「咔」地弹开了。一股霉味扑了出来。\n旧花盆、一辆没有轮子的童车……最里面，是一把罩着帆布的高背扶手椅。');
      await S.narr('你掀开帆布。手织的椅套，已经褪成了灰绿色。');
    }
    if (a === 'morning') return S.narr('椅子腿上沾着新鲜的湿泥。从棚屋门口到后门，草地上有两道被拖出来的印子。\n……昨晚，它在客厅里。');
    await S.narr('坐垫正中间有一个浅浅的凹痕。你把手放上去——\n是温的。');
  }
  const QS2 = [
    ['「你是约瑟夫吗？」', ['……是。约瑟夫。', '……我太太……叫我老约。']],
    ['「你为什么一直不走？」', ['……我在等她。她说她去买块肉，马上回来。', '后来……来了好多人。他们动我的椅子，睡她的床……我不让。']],
    ['「你知道你已经不在了吗？」', ['……知道。小姑娘告诉我的。用我自己的嗓子告诉我的。', '……我只是……看不清路。不知道该往哪儿走。']]
  ];
  async function finale(S) {
    if (S.f.act !== 'night') return;
    const C = S.ent('gchair_g');
    if (!S.f.placed) {
      await S.narr('你走到椅子跟前。椅子上没有人。\n可是坐垫的正中间，凹下去了一块。');
      await S.say('露西', '他看不见我们。……他的眼镜。', { style: 'whisper' });
      S.take('glasses'); C.s.glasses = true; S.sfx('item');
      await S.narr('你把那副缠着胶布的老花眼镜，轻轻放在扶手上。');
      S.take('watch'); C.s.watch = true;
      await S.narr('又把怀表放在旁边。表盖开着，指针停在三点一刻。');
      S.f.placed = true; S.f.asked = [];
      await S.narr('你蹲下来，把录音机放在草地上，按下录音键。\n红灯一闪，一闪。');
      S.cp('night');
    }
    while (S.f.asked.length < QS2.length) {
      const left = QS2.map((q, i) => i).filter(i => !S.f.asked.includes(i));
      const r = await S.ask('你对着那把空椅子问：', left.map(i => QS2[i][0]));
      const i = left[r]; S.f.asked.push(i);
      await S.say('你', QS2[i][0]);
      await S.narr('你等了十秒。草地上只有风，和远处的狗叫。');
      S.sfx('tv'); await S.wait(500);
      await S.narr('倒带。播放——\n在你的问题后面，磁带里，有一个很低、很哑的声音：');
      S.sfx('whisper');
      await S.say('磁带里的声音', QS2[i][1], { style: 'whisper' });
    }
    const V = await S.vote('最后，你想对他说：', ['「约瑟夫，现在你看得清路了。珍妮在等你。」', '「这里是她们的家了。谢谢你，让她们借住。」', '「滚出这栋房子，别再缠着这家人！」']);
    let r = V.v;
    if (!V.agree) {
      if (V.h === 2 || V.g === 2) { r = V.h === 2 ? V.g : V.h; await S.narr('一个人刚喊出半个「滚」字，另一个人一把按住了他的胳膊。\n露西回过头，看了你们一眼。'); }
      else await S.narr('你们俩想说的话不一样。……最后，是一前一后，都说出了口。');
    }
    if (r === 2) return driveEnd(S, C);
    const both = !V.agree && V.h !== 2 && V.g !== 2;
    if (both) await S.say('你', ['约瑟夫，现在你看得清路了。珍妮在等你。', '这里是她们的家了。谢谢你，让她们借住。']);
    else await S.say('你', r === 0 ? '约瑟夫，现在你看得清路了。珍妮在等你。' : '这里是她们的家了。谢谢你，让她们借住。');
    S.amb('none'); await S.wait(800);
    const O = S.ent('oldman_g'); O.spr = '@oldmang'; C.s.glasses = false;
    await S.alpha('oldman_g', .85, 1400);
    await S.narr('扶手上的眼镜不见了。\n椅子上坐着一个秃顶的老人，穿着灰色的开衫。他戴着那副眼镜，慢慢地，抬起了头。');
    await S.say('约瑟夫', '……看见了。原来你们长这个样子。', { style: 'whisper' });
    S.face('lucy_g', 'oldman_g');
    await S.say('约瑟夫', ['小姑娘。对不起，借了你的嗓子。', '他们不信你。……我知道那是什么滋味。'], { style: 'whisper' });
    await S.say('露西', '我信你。');
    await S.say('约瑟夫', '……我也信你。真的那部分，和装的那部分，都信。', { style: 'whisper' });
    S.sfx('chime');
    await S.alpha('oldman_g', 0, 1800);
    S.sfx('tick'); await S.wait(500); S.sfx('tick'); await S.wait(500); S.sfx('tick');
    await S.narr('草地上，那块怀表「嗒」地响了一声。\n秒针走了一格，两格，三格……\n然后，停在了三点十六分。');
    S.amb('night');
    await S.fade(1, 1400);
    await S.card('后来', '', '敲墙声在第二年春天，渐渐停了。\n莫顿博士的报告只有一句话，研究会里为这句话吵了很多年。\n\n那把椅子，哈珀太太让人搬回了客厅的墙角。\n谁也不坐。\n'
      + (r === 1 && !both ? '哈珀太太说，这是借来的房子、借来的角落。\n逢年过节，她会在扶手上放一杯茶，浓得像泥水。' : '露西有时候在旁边念报纸，念到三点一刻，就停下来。'));
    await S.end({ id: 'good', title: '第八夜　完', text: '你的磁带后来被存进了研究会的档案室。\n第一盘A面，计数器 088 的地方，那个嗓音还在。\n\n有人说，那是一个十一岁女孩练出来的假声。\n有人说不是。\n\n你在档案卡上，只写了三个字：\n「我在场。」' });
  }
})();
