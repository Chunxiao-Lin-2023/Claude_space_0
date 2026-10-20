/* ================= 第九夜 · 鬼妻娜娜 ================= */
(() => {
  const bg = p => { if (p && p.catch) p.catch(() => { }); return p; };
  const NEED = 5;
  /* 用字符串拼地图：先铺底，再按矩形刷字符 */
  function mkRows(w, h, base, ops) {
    const g = [...Array(h)].map(() => Array(w).fill(base));
    for (const [x0, y0, x1, y1, c] of ops) for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) g[y][x] = c;
    return g.map(r => r.join(''));
  }
  /* 抱着襁褓的手臂（正面/侧面） */
  function babyArms(R, d, G, cloth, face) {
    if (d === 0) { R(4, G.tT + 2, 8, 4, cloth); R(4, G.tT + 5, 8, 1, '#b8b0a0'); R(5, G.tT + 2, 2, 2, face); }
    else if (d === 1) { R(3, G.tT + 2, 5, 4, cloth); R(3, G.tT + 2, 2, 2, face); }
  }
  function ushade(R, X, Y) { TILE.dirt.paint(R, X, Y); R(0, 0, 16, 16, 'rgba(0,0,0,.25)'); for (const y of [2, 7, 12]) R(0, y, 16, 1, 'rgba(230,170,90,.10)'); if (hash(X, Y, 3) < .2) R(4, 9, 2, 1, '#3a2c1e'); }
  const NAKP = { skin: '#c99a72', hair: '#120c0e', hs: 'long', top: '#9a3a4a', top2: '#d8b060', bottom: '#3a2a4a', skirt: true, shoes: '#b88a62', blush: '#c07a6a', mouth: '#9a2a2a' };
  const NAKG = { skin: '#b4bca8', hair: '#0c0a0c', hs: 'long', cover: true, ghost: true, dress: true, top: '#4a2430', bottom: '#4a2430' };
  /* 死了几次（不随检查点回滚，用来在重来时给更直白的提示） */
  const FAILS = { c: 0, w: 0 };
  /* 屋底下「她在听」：只在主机 tick 里用的瞬时量，不进存档 */
  const UND = { mv: 0, pd: 0, warned: false };
  const THREAD_T = 45, THREAD_PEN = 10;
  const caughtC = async S => {
    FAILS.c++;
    await S.scare('face', { spr: '@nakg', sfx: 'scream' });
    await S.die('冰凉的手臂从背后绕了上来，一圈，又一圈，像运河里的水草。\n「麦，你要去哪儿？……天黑了，我们回家。」', '她把你带回了家');
  };
  const caughtW = async S => {
    FAILS.w++;
    await S.scare('face', { spr: '@nakg', sfx: 'scream' });
    await S.die('白线还没有绕完，她就到了。\n她把脸贴在你的背上，轻轻地说：「麦，你为什么要跑？」', '圣线没能绕成');
  };
  /* 合成音：木杵舂进石臼的闷响；她哼的摇篮曲（五声音阶，越往后越慢、越低） */
  function pestle(S, v = 1) { S.tone('sine', 95, 48, .2, .32 * v, 0, 260); S.tone('triangle', 180, 120, .05, .05 * v, 0, 700); }
  function lullaby(S, slow = 1, vol = .07) {
    const N = [392, 440, 392, 330, 294, 330, 392, 330, 294, 262, 294, 330];
    N.forEach((f, i) => { const k = 1 - (slow - 1) * i / N.length * .5; S.tone('triangle', f * k, f * k * .985, .5 * slow, vol, i * .46 * slow, 1400); });
  }
  function resetNakC(S) { const e = S.ent('nak_c'); if (!e) return; S.stop('nak_c'); S.freeze('nak_c', false); e.hidden = true; e.alpha = 1; S.f._csp = 2.2; S.f._amb = false; }
  function resetThread(S) {
    S.f.thr = []; S.f.miss = 0; for (const k of ['nw', 'ne', 'se', 'sw']) { const p = S.ent('p_' + k); if (p) p.s.tied = false; }
    const r = S.ent('ring'); if (r) { r.s.n = 0; r.s.done = false; }
    const e = S.ent('nak_w'); if (e) { S.stop('nak_w'); S.place('nak_w', 12, 17, 3); e.hidden = false; e.alpha = .85; }
    S.clearTimer();
    S.timer(THREAD_T, '诵经', S => wEnter(S));
  }
  /* 诵经声停了：她跨过界石进来 */
  async function wEnter(S) {
    if (S.f.ph !== 'thread') return;
    const e = S.ent('nak_w'); e.alpha = 1; e.hidden = false;
    S.sfx('cry'); S.bubble('nak_w', '…', 1500);
    S.chase('nak_w', { spd: 2.6, catch: caughtW });
    await S.say('住持', '经念不住她了——她进来了！快绕完！', { style: 'big' });
  }
  function goalDays(S) {
    if (S.f.needWat) return S.goal('去玛哈布寺问住持（沿运河往东）');
    S.goal(`村里的一切都不对劲——四处看看（违和 ${Math.min(S.f.cn || 0, NEED)}/${NEED}）`);
  }
  /* 收集「违和」：日常里的一处处不对劲。凑够五处、并且在寺里亲眼看过真相（亡者簿或坟）才肯「看见」 */
  async function clue(S, k) {
    if (S.f.ph !== 'days' || S.f['c_' + k]) return false;
    S.f['c_' + k] = true; S.f.cn = (S.f.cn || 0) + 1;
    S.sfx('sting');
    if (S.f.cn < NEED) { S.toast('违和感 ' + S.f.cn + '/' + NEED); goalDays(S); return true; }
    if (!S.f.c_record && !S.f.c_grave) {
      S.f.needWat = true;
      await S.think(['……够多了。可我还是不信。', '那是娜。没有亲眼看见，我不信。', '宾婶说，去寺里问住持。出家人不打诳语。']);
      goalDays(S);
      return true;
    }
    S.f.needWat = false;
    await dusk(S);
    return true;
  }
  /* 惊吓大头像（32×32） */
  function wetHair(R, t) {
    const hair = '#0c0a0e', hl = '#2c3438';
    R(5, 0, 22, 32, hair); R(2, 8, 3, 24, hair); R(27, 8, 3, 24, hair); R(0, 18, 2, 14, hair); R(30, 18, 2, 14, hair);
    for (const x of [3, 6, 8, 23, 25, 28]) R(x, 6 + (x % 4) * 2, 1, 26 - (x % 4) * 2, hl);
    for (let i = 0; i < 4; i++) { const x = [4, 9, 22, 27][i], y = ((t * 18 + i * 9) % 14) | 0; R(x, 18 + y, 1, 2, '#6a8a8a'); }   // 往下滴的水
  }
  const FACES = {
    /* 鬼相的娜：湿透的头发从中间分开，灰绿的脸，没有眼白的黑眼睛；嘴唇还是嚼过槟榔的红，嘴慢慢张开 */
    nakg(R, a, t) {
      wetHair(R, t);
      const sk = '#a8b4a0', sk2 = '#7e8c7a';
      R(11, 5, 10, 2, sk); R(10, 7, 12, 15, sk); R(11, 22, 10, 3, sk); R(13, 25, 6, 2, sk); R(19, 7, 3, 16, sk2);
      R(9, 3, 7, 10, '#0c0a0e'); R(17, 3, 6, 8, '#0c0a0e'); R(15, 3, 2, 3, sk);      // 贴在脸上的湿发，盖住半边
      R(12, 13, 1, 9, '#0c0a0e'); R(20, 11, 1, 10, '#0c0a0e');
      R(13, 12, 4, 3, '#060406'); R(18, 11, 3, 3, '#060406');                       // 黑洞洞的眼睛
      R(14, 13, 1, 1, '#d8e0d0'); R(19, 12, 1, 1, '#d8e0d0');
      R(13, 15, 4, 1, '#6a7468'); R(18, 14, 3, 1, '#6a7468');
      const o = Math.round(Math.min(1, a * 1.5) * 4);
      R(13, 20, 6, 1, '#9a1a1a'); R(13, 21 + o, 6, 1, '#7a1212'); R(14, 21, 4, o, '#1a0606'); R(12, 20, 1, 1 + o, '#9a1a1a'); R(19, 20, 1, 1 + o, '#9a1a1a');
      if (a > .5) { R(14, 16, 1, 4, '#5a6a64'); R(18, 15, 1, 5, '#5a6a64'); }      // 脸上淌下来的水痕
    },
    /* 镜子边上探进来的半张脸：只有一只眼睛，一点一点挪进来 */
    nakm(R, a, t) {
      R(0, 0, 32, 32, '#2a3230'); R(1, 1, 30, 30, '#5a6a68'); R(2, 2, 6, 10, 'rgba(255,255,255,.12)');
      const x0 = Math.round(32 - Math.min(1, a * 1.8) * 16);
      R(x0, 0, 20, 32, '#0c0a0e');
      R(x0 + 3, 6, 14, 20, '#a8b4a0'); R(x0 + 3, 4, 14, 5, '#0c0a0e'); R(x0 + 3, 9, 3, 12, '#0c0a0e');
      R(x0 + 8, 13, 5, 3, '#f0f0e4'); R(x0 + 9, 13, 2, 3, '#060406'); R(x0 + 8, 12, 5, 1, '#5a6458');
      R(x0 + 8, 22, 6, 1, '#9a1a1a');
      R(x0 + 6, 17, 1, 6, '#6a7a74');
    }
  };

  defChapter({
    id: 'maenak', n: 9, title: '鬼妻娜娜', sub: '运河边的高脚屋里，妻子抱着孩子，等丈夫从战场回来。', origin: '泰国民间传说', color: '#24382c',
    icon: '@nak', amb: 'river', floor: 'dirt', wall: 'wood', dark: .6, plr: 3.2,
    faces: FACES,
    endings: { farewell: '下辈子，还做你的妻子', stay: '一家人，再也不分开', jar: '罐子沉进了运河', cross: '跨出白线' },
    people: {
      me: { skin: '#b07a52', hair: '#1a1414', hs: 'short', top: '#6a5a3a', top2: '#4a3e28', bottom: '#7a3a2a', shoes: '#8a5a3a' },
      nak: Object.assign({ key: 'mn-nak', extra(g, d, fr, G, R) { babyArms(R, d, G, '#e8e2d0', '#d8a888'); } }, NAKP),
      nak2: Object.assign({ key: 'mn-nak2' }, NAKP),
      nakg: Object.assign({ key: 'mn-nakg', extra(g, d, fr, G, R) {
        babyArms(R, d, G, '#8a9086', '#6a7268');
        if (d === 0) { R(7, G.hT + 8, 2, 3, '#0c0a0c'); R(4, G.tB - 2, 1, 4, '#7a8474'); R(11, G.tB - 2, 1, 5, '#7a8474'); }
      } }, NAKG),
      puu: { skin: '#a87a58', hair: '#d0d0d0', hs: 'bun', hat: 'straw', hatC: '#b89a5a', top: '#3a4a5a', bottom: '#2a2a3a', skirt: true, shoes: '#8a6a4a' },
      phin: { skin: '#b08060', hair: '#1a1414', hs: 'bob', top: '#6a7a5a', top2: '#4a5a3a', bottom: '#4a3a2a', skirt: true, shoes: '#8a6044' },
      tong: { skin: '#b88a62', hair: '#1a1414', hs: 'short', child: true, top: '#c8b890', bottom: '#5a3a2a', shoes: '#8a6044' },
      thim: { skin: '#9a6a44', hair: '#1a1414', hs: 'short', hat: 'straw', hatC: '#a88a4a', top: '#3a3a4a', bottom: '#2a3a5a', shoes: '#7a5434' },
      vman: { skin: '#a07048', hair: '#1a1414', hs: 'short', top: '#5a4a3a', bottom: '#3a2a2a', shoes: '#7a5434' },
      vwom: { skin: '#b88660', hair: '#1a1414', hs: 'bun', top: '#7a4a5a', bottom: '#3a3040', skirt: true, shoes: '#8a6044' },
      abbot: { key: 'mn-abbot', skin: '#a87a58', hair: '#1a1414', hs: 'bald', top: '#c8701e', top2: '#a85a14', bottom: '#c8701e', robe: true, shoes: '#9a6a48',
        extra(g, d, fr, G, R) { if (d === 0) { R(4, G.tT, 2, G.tB - G.tT, '#a85a14'); R(6, G.tT + 2, 2, 6, '#a85a14'); } } },
      novice: { key: 'mn-novice', skin: '#b88a62', hair: '#1a1414', hs: 'bald', child: true, top: '#d8822a', bottom: '#d8822a', robe: true, shoes: '#9a6a48',
        extra(g, d, fr, G, R) { if (d === 0 || d === 1) { R(12, G.tT - 4, 1, 12, '#8a6a3a'); R(11, G.tB + 1, 4, 3, '#b89a5a'); } } },
      mophi: { key: 'mn-mophi', skin: '#8a5a3a', hair: '#1a1414', hs: 'short', hat: 'scarf', hatC: '#8a1a1a', top: '#1a1a1a', top2: '#2a2a2a', bottom: '#8a1a1a', shoes: '#6a4a2a',
        extra(g, d, fr, G, R) { if (d === 0) { R(6, G.tT + 2, 4, 1, '#d8d0b0'); R(7, G.tT + 3, 2, 3, '#d8d0b0'); R(5, G.tT + 6, 6, 1, '#d8d0b0'); } } }
    },
    items: {
      lime: { name: '青柠', desc: '又小又青的青柠，皮薄汁多。舂辣椒酱少不了它。' },
      sai: { name: '圣线', desc: '一团白棉线（赛辛），在佛前念过经。老人们说，鬼魂跨不过它。' },
      kendi: { name: '小铜壶', desc: '住持递给你的小铜壶，盛着清水。泰国人做完功德要「滴水回向」（kruat nam）：一边听经，一边把水慢慢倒尽，功德便随着水流到亡者身边。' }
    },
    notes: {
      letter: { title: '托人代写的信', text: '（折了很多次的纸，是寺里小沙弥规规矩矩的笔迹）\n\n麦：\n我说一句，小师父写一句。\n\n孩子在肚子里踢我了，可有劲儿，接生婆说多半是个男孩，像你。就是这个月了。\n\n你说稻子收完就回来。稻子收完了，第二季的秧又插上了。我每天傍晚去码头看一眼，船来了一条又一条，都不是你。\n\n不要紧，我会等的。我和孩子在家里等你——不在码头了，码头风大。\n\n你的娜\n\n（信没有寄出去。纸角有一圈干了的水渍。）' },
      thim: { title: '船底的刻痕', text: '阿添的船翻扣在岸上。船底的木板上，有人用刀尖刻了几个歪歪扭扭的字，刻得很深：\n\n「麦　你的妻子已经」\n\n后面的字没有刻完。\n刀痕在最后一笔上猛地一滑，划出去老长，一直划到船沿。\n\n船板上留着几个湿漉漉的手印。手指细长，长得……不像人的手。' },
      record: { title: '玛哈布寺亡者簿（一页）', text: '雨安居前七日，夜大雨。\n\n帕卡农运河东岸，娜，年十九。\n难产。母子俱亡。\n\n依旧俗，「死时腹中带子」者不火化，即日土葬于寺后乱葬岗，以竹为记，诵经三夜。\n其夫随军未归，无人主丧。邻人宾氏代为守灵。\n\n（下面另起一行，是住持的笔迹）\n愿她放下。\n愿她等的人，早日回来。' },
      palm: { title: '藏经阁里的贝叶', text: '（几片用细绳串起的贝叶，铁笔刻字，抹了烟灰）\n\n……女子怀胎而死，母子同去，谓之「腹中带子」。爱念与怨念俱重，诸鬼中最难度化。退之之法有三：\n\n其一，圣线。僧人持诵，以白线围护。线自佛陀右手一侧之柱起，右绕而行，如日行天（自上俯视，顺转），绕尽四柱，复归佛前，系于佛手。起处错、逆绕者，线断。\n\n其二，驱鬼师摄其魂入陶罐，封以符布，沉于深水。然罐终有破时。\n\n其三——（这一条字迹很新）\n以慈心度之。为其做功德，滴水回向。她若肯放下，自去投生。' }
    },
    legend: '「帕卡农的娜娘」（Mae Nak Phra Khanong）是泰国家喻户晓的鬼故事。据说它发生在十九世纪中叶、拉玛四世在位的时候，地点是曼谷城外帕卡农运河边的一个村子。年轻的妻子娜怀着身孕，丈夫麦被征去打仗；娜在分娩时连同腹中的孩子一起死去。麦回来以后，妻子抱着孩子在家里等他，一切如常。邻居们想提醒他，有的不敢开口，有的开了口就遭了殃。直到有一天，娜在屋里舂辣椒酱，一个青柠从地板缝里掉到了高脚屋底下——她把手臂伸得老长，一直伸到地上把它捡了回去。麦这才明白，借口下楼解手，一路逃进了玛哈布寺。逃的这一段各家说法不同：有的说他躲在寺里僧人用圣线围起来的地方，有的说他钻进了一丛鬼魂害怕的艾纳香（泰语叫 naat），娜找不到他，只好在外面哭。\n\n泰国旧俗把「死的时候孩子还在肚子里」的女人叫作「tai thong klom」（ตายทั้งกลม，大意是母子囫囵着一起走），认为她们化成的鬼最凶，也最难送走，所以这样的亡者往往不火化，而是尽快土葬，并请僧人诵经。娜的故事也因此被讲得格外可怕。\n\n故事的结尾众说纷纭。流传最广的说法是：一位驱鬼师把娜的魂魄收进陶罐，沉进了运河；后来罐子被渔夫捞起、无意中打破，她又回来了，最后由一位德高望重的高僧——通常说是拉玛四世时代的颂德·多——出面，劝她放下执念，转世离去。还有说法称高僧取下了她的一块额骨做成腰扣，几经辗转，不知所终；也有版本说娜答应来世再做麦的妻子。\n\n这个传说被反复改编成戏剧、广播剧和几十部电影，1999年的《鬼妻》（Nang Nak）和2013年的喜剧《鬼妻》（Pee Mak）都轰动一时。如今曼谷帕卡农的玛哈布寺里供奉着娜娘的神龛，人们给她送去鲜艳的衣裙、化妆品和婴儿玩具，求子、求平安、求彩票号码；据说快要被征召入伍的年轻人，也会去求她保佑自己不被抽中——因为她最懂得等一个人回家有多难。也有一种说法认为，娜的原型是当地一位真实存在过的女子，但已无从查证。\n\n（本章中的邻居宾婶、渔夫阿添、摆渡的普婆婆、孩子的名字「小丹」、娜托人代写的信、罗望子树下的那坛酒、圣线「自佛陀右手一侧起、右绕四柱」的具体绕法、诵经能拦住她多久，以及倒水回向、在寺中告别、「跨出白线」等结局，均为游戏虚构或简化。）',
    start: { map: 'canal', x: 20, y: 14, dir: 2 },
    async intro(S) {
      await S.card('第九夜　鬼妻娜娜', '十九世纪中叶　暹罗　曼谷城外　帕卡农运河', '雨季之前，官府来村里征人。\n麦走的那天早上，娜挺着肚子，送他到码头。\n\n「等稻子收完，我就回来。」\n「我和孩子等你。」\n\n稻子收了两季。\n麦终于回来了。');
    },
    resume: {
      flee: async S => {
        resetNakC(S);
        if (FAILS.c === 1) await S.think('……路边有一丛艾纳香。宾婶说过，鬼闻不得那股味儿。\n真被她堵住了，就钻进去。');
        else if (FAILS.c > 1) await S.think('别跟她硬碰。她慢，我快——绕开她跑。实在不行，就钻进路边那丛艾纳香里。');
      },
      thread: async S => {
        resetThread(S);
        if (FAILS.w) { S.f.miss = Math.min(2, FAILS.w); await S.say('住持', threadHint(S, 'start')); }
      },
      final: async S => { await finalChoice(S); }
    },
    tick(S, dt) {
      if (W.busy) return;
      if (S.f.ph === 'thread' && S.map === 'wat') { S.f._ch = (S.f._ch ?? 2) - dt; if (S.f._ch <= 0) { S.f._ch = 4.5; S.sfx('chant'); } }
      if (S.f.ph === 'flee' && S.map === 'canal') { S.f._cr = (S.f._cr ?? 3) - dt; if (S.f._cr <= 0) { S.f._cr = 5 + Math.random() * 3; S.sfx('cry'); } }
    },
    tiles: {
      slat: { solid: false, paint(R, X, Y) { const b = '#7a5434'; for (let r = 0; r < 4; r++) { const h = hash(X, Y * 4 + r, 41); R(0, r * 4, 16, 4, shade(b, (h - .5) * .2)); R(0, r * 4 + 3, 16, 1, '#1a100a'); if (h < .25) R(((h * 997) | 0) % 14, r * 4 + 3, 2, 1, 'rgba(255,200,120,.25)'); } } },
      ushade: { solid: false, paint: ushade },
      post: { solid: true, paint(R, X, Y) { ushade(R, X, Y); R(4, 12, 9, 3, 'rgba(0,0,0,.4)'); R(5, 0, 6, 14, '#4a3220'); R(5, 0, 2, 14, '#5e4028'); R(10, 0, 1, 14, '#2a1a10'); R(5, 4, 6, 1, '#3a2618'); } },
      banana: { solid: true, paint(R, X, Y) {
        TILE.grass.paint(R, X, Y, { grassC: '#24331f' });
        const s = (hash(X, Y, 7) * 4) | 0;
        R(7, 9, 2, 7, '#4a5a2a'); R(1 + s, 2, 8, 4, '#3a6a2a'); R(7, 1, 8, 5, '#2f5a24'); R(0, 6, 7, 3, '#2a5020'); R(9, 6, 7, 3, '#356428');
        R(2 + s, 3, 6, 1, '#4f7f36'); R(8, 2, 6, 1, '#4f7f36'); R(3, 7, 1, 2, '#1a2a12'); R(12, 7, 1, 2, '#1a2a12'); if (hash(X, Y, 8) < .3) R(10, 10, 2, 3, '#6a5a2a');
      } },
      dockT: { solid: false, paint(R, X, Y) { R(0, 0, 16, 16, '#1b3149'); R(2, 0, 12, 16, '#5a4430'); for (let y = 0; y < 16; y += 4) R(2, y + 3, 12, 1, '#3a2a1e'); R(2, 0, 1, 16, '#4a3624'); R(13, 0, 1, 16, '#4a3624'); R(0, 6, 2, 3, '#3a2a1e'); R(14, 6, 2, 3, '#3a2a1e'); } },
      lotus: { solid: true, paint(R, X, Y) { TILE.water.paint(R, X, Y); R(1, 3, 6, 4, '#2f5a32'); R(2, 3, 2, 1, '#1b3149'); R(8, 9, 7, 5, '#2a5230'); R(10, 9, 2, 1, '#1b3149'); if (hash(X, Y, 2) < .6) { R(4, 8, 3, 3, '#d88aa0'); R(5, 7, 1, 1, '#f0b0c0'); } } },
      wwall: { solid: true, paint(R, X, Y) { R(0, 0, 16, 16, '#d8d2c2'); R(0, 0, 16, 3, '#8a2a1a'); R(0, 3, 16, 1, '#5a1a10'); R(0, 13, 16, 3, '#8a8478'); if (hash(X, Y, 5) < .3) R(3, 7, 4, 1, '#c0b8a6'); } }
    },
    sprites: {
      /* 高脚屋外观（4×2）：上一行是屋身，下一行是柱脚和屋底 */
      stilt(g, e, t, R) {
        const rf = e.col || '#6a5a3a', wd = e.wc || '#6e4a2c';
        R(0, 16, 64, 14, 'rgba(8,6,4,.62)');
        for (let i = 0; i < 5; i++) { R(2 + i * 14, 14, 3, 17, '#3a2818'); R(2 + i * 14, 14, 1, 17, '#4e3622'); }
        R(0, 12, 64, 4, '#4a3220'); R(0, 12, 64, 1, '#6a4a2c');
        R(2, -10, 60, 22, wd); for (let x = 2; x < 62; x += 6) R(x, -10, 1, 22, shade(wd, -.25)); R(2, -10, 60, 1, shade(wd, .2));
        const wl = e.lit ? '#e8b860' : '#140c08';
        R(9, -5, 11, 9, '#3a2616'); R(10, -4, 9, 7, wl); R(44, -5, 11, 9, '#3a2616'); R(45, -4, 9, 7, wl);
        if (e.lit) { R(14, -4, 1, 7, '#3a2616'); R(49, -4, 1, 7, '#3a2616'); }
        R(28, -6, 9, 18, e.lit ? '#c89048' : '#0c0806'); R(28, -6, 9, 1, '#3a2616'); R(27, -6, 1, 18, '#3a2616'); R(37, -6, 1, 18, '#3a2616');
        for (let i = 0; i < 22; i++) { const ins = Math.max(0, 11 - ((i * .55) | 0)); R(-2 + ins, -32 + i, 68 - ins * 2, 1, i % 3 === 0 ? shade(rf, -.22) : rf); }
        R(-2, -11, 68, 2, 'rgba(0,0,0,.4)');
        R(8, -37, 2, 6, '#3a2818'); R(6, -38, 2, 2, '#3a2818'); R(54, -37, 2, 6, '#3a2818'); R(56, -38, 2, 2, '#3a2818');
      },
      ladder(g, e, t, R) { R(3, -12, 2, 27, '#4a3220'); R(11, -12, 2, 27, '#4a3220'); for (let y = -9; y < 14; y += 5) R(3, y, 10, 2, '#6a4a2c'); R(2, 13, 12, 2, 'rgba(0,0,0,.3)'); },
      shutter(g, e, t, R) {
        box(R, 2, 1, 12, 11, '#3a2616');
        if (e.open) { R(3, 2, 10, 9, e.lit ? '#d8c890' : '#121a24'); R(0, 2, 3, 9, '#5a3c22'); R(13, 2, 3, 9, '#5a3c22'); if (!e.lit) R(9, 3, 2, 1, '#c8d0e0'); }
        else { R(3, 2, 10, 9, '#5a3c22'); for (let x = 4; x < 13; x += 2) R(x, 2, 1, 9, '#4a3018'); R(7, 2, 2, 9, '#3a2616'); if (e.lit) { R(3, 5, 10, 1, 'rgba(255,230,160,.7)'); R(3, 8, 10, 1, 'rgba(255,230,160,.5)'); } }
      },
      hing(g, e, t, R) {   // 墙上的佛龛
        R(1, 8, 14, 2, '#5a3a20'); R(2, 10, 2, 3, '#3a2414'); R(12, 10, 2, 3, '#3a2414');
        R(6, 1, 4, 7, '#d8a838'); R(7, -1, 2, 2, '#e0b848'); R(7, -2, 2, 1, '#f0d060'); R(5, 6, 6, 2, '#c89428');
        R(3, 6, 2, 2, '#f0f0e0'); R(11, 6, 2, 2, '#f0f0e0');
        if (e.covered) { R(4, -3, 8, 11, '#d8d0c0'); R(4, 7, 8, 1, '#b8b0a0'); }
        if (e.flowers) { R(4, 5, 8, 1, '#f4f4e8'); R(5, 4, 1, 1, '#f4f4e8'); R(10, 4, 1, 1, '#f4f4e8'); }
        else R(4, 5, 8, 1, '#8a7a5a');
      },
      stoveC(g, e, t, R) {
        R(3, 6, 10, 9, '#8a5a3a'); R(3, 6, 10, 1, '#a07050'); R(2, 1, 12, 6, '#2a2420'); R(3, 0, 10, 1, '#3a3430');
        if (!e.off) { const f = Math.sin(t * 11) > 0 ? 1 : 0; R(6, 10, 4, 3, f ? '#ff8a2a' : '#ffb040'); R(5, -3 + f, 1, 2, 'rgba(220,220,220,.35)'); R(9, -5 + f, 1, 3, 'rgba(220,220,220,.25)'); }
        else R(6, 10, 4, 3, '#1a1210');
      },
      mortar(g, e, t, R) {
        const b = e.pound ? ((Math.sin(t * 9) > 0) ? -3 : 0) : 0;
        R(3, 8, 10, 6, '#8a6a4a'); R(4, 7, 8, 2, '#a08060'); R(5, 8, 6, 2, '#3a1a10'); R(6, 8, 3, 1, '#a02818'); R(4, 14, 8, 1, '#3a2a1a');
        R(9, 0 + b, 2, 9, '#b8946a'); R(9, 0 + b, 2, 1, '#d0ac80');
        R(1, 12, 2, 2, '#7ab040'); R(13, 12, 2, 2, '#c02818');
      },
      cradle(g, e, t, R) {   // 从房梁垂下来的布摇篮
        const sw = Math.round(Math.sin(t * 1.6) * (e.rock ?? 1.5));
        R(7, -22, 1, 10, '#a08a5a'); R(6, -13, 3, 2, '#7a6a4a');
        R(3 + sw, -11, 10, 1, '#8a7a5a'); R(2 + sw, -10, 12, 7, '#c8b890'); R(3 + sw, -4, 10, 2, '#a89870'); R(2 + sw, -10, 1, 6, '#a89870');
        if (e.baby) { R(6 + sw, -9, 4, 3, '#e8e2d0'); R(6 + sw, -9, 2, 2, e.cold ? '#a8b0a8' : '#d8a888'); }
        R(3, 9, 10, 3, 'rgba(0,0,0,.28)');
      },
      mat(g, e, t, R) {
        R(0, 2, 32, 12, '#b89a5a'); for (let y = 4; y < 14; y += 3) R(0, y, 32, 1, '#a0844a'); R(2, 4, 7, 4, '#e8e0c8'); R(2, 4, 7, 1, '#f4f0e0');
        R(0, -14, 32, 26, 'rgba(230,230,220,.13)'); R(0, -14, 32, 1, 'rgba(240,240,230,.45)'); R(0, -14, 1, 27, 'rgba(240,240,230,.35)'); R(31, -14, 1, 27, 'rgba(240,240,230,.35)'); R(0, 12, 32, 1, 'rgba(240,240,230,.3)');
      },
      trunk(g, e, t, R) { box(R, 1, 4, 14, 10, '#5a3a22'); R(1, 7, 14, 1, '#3a2414'); R(7, 8, 2, 3, '#c9a35a'); R(2, 3, 12, 1, '#6a4a2c'); },
      betel(g, e, t, R) { R(2, 9, 12, 5, '#b8902a'); R(2, 9, 12, 1, '#d8b04a'); R(3, 6, 3, 3, '#c9a35a'); R(7, 6, 3, 3, '#c9a35a'); R(11, 7, 2, 2, '#c9a35a'); R(8, 7, 1, 1, '#a02818'); R(4, 11, 4, 2, '#3a6a2a'); },
      oillamp(g, e, t, R) { R(5, 11, 6, 3, '#8a6a3a'); R(6, 10, 4, 1, '#a08050'); R(10, 9, 2, 2, '#8a6a3a'); if (!e.off) { const f = Math.sin(t * 14 + e.x) > 0 ? 1 : 0; R(10, 6 + f, 2, 3 - f, '#ffcf5a'); R(10, 5 + f, 1, 1, '#ff8a2a'); } },
      bmirror(g, e, t, R) {   // 小木台上的铜镜
        box(R, 2, 8, 12, 6, '#5a3a22'); R(7, 4, 2, 5, '#3a2414');
        R(4, -4, 8, 9, '#a07a2a'); R(5, -3, 6, 7, e.face ? '#1a1418' : '#8a9a98'); R(5, -3, 2, 3, 'rgba(255,255,255,.35)');
        if (e.face) { R(6, -2, 4, 4, '#b4bca8'); R(6, -3, 4, 2, '#0c0a0c'); R(7, 0, 1, 1, '#0c0a0c'); R(9, 0, 1, 1, '#0c0a0c'); }
      },
      jar(g, e, t, R) {   // 龙纹大水缸
        R(2, 0, 12, 14, '#5a3420'); R(1, 2, 14, 10, '#6a3e24'); R(3, -2, 10, 3, '#4a2a18'); R(4, -2, 8, 2, '#0e1418');
        if (!e.off) R(5, -2, 3, 1, '#4a6a7a');
        R(3, 5, 10, 1, '#c9a35a'); R(4, 4, 2, 1, '#c9a35a'); R(9, 6, 3, 1, '#c9a35a'); R(5, 8, 6, 1, '#8a6030'); R(3, 2, 1, 8, '#7a4a2c'); R(2, 14, 12, 1, 'rgba(0,0,0,.4)');
      },
      cjar(g, e, t, R) {   // 驱鬼师的陶罐
        R(4, 5, 8, 9, '#9a5a3a'); R(3, 7, 10, 5, '#a8643e'); R(5, 3, 6, 2, '#8a4a30'); R(4, 14, 8, 1, 'rgba(0,0,0,.4)');
        if (e.locked) { R(4, 0, 8, 4, '#e8e0c8'); R(5, 1, 6, 1, '#a01818'); R(7, 2, 2, 1, '#a01818'); R(3, 4, 10, 1, '#c8302a'); }
        else R(5, 2, 6, 1, '#1a0e08');
      },
      lime(g, e, t, R) { const d = e.drop || 0; R(6, 9 + d, 4, 4, '#7ab040'); R(7, 9 + d, 2, 1, '#a8d870'); R(9, 11 + d, 1, 1, '#5a8a2a'); if (d > -6) R(6, 13, 4, 1, 'rgba(0,0,0,.35)'); },
      limebasket(g, e, t, R) { R(7, -6, 1, 4, '#a08a5a'); R(3, -2, 10, 7, '#a07a40'); R(3, -2, 10, 1, '#c09a58'); for (let x = 4; x < 13; x += 2) R(x, -1, 1, 6, '#8a6430'); if (!e.off) { R(4, -4, 3, 3, '#7ab040'); R(7, -5, 3, 3, '#86bc48'); R(10, -4, 2, 2, '#7ab040'); } },
      /* 伸长的手臂：从地板缝里垂下来（v），再贴着地面伸过去（h） */
      arm(g, e, t, R) {
        const v = e.v || 0, h = e.h || 0, C = '#949b86', D = '#565e4e', L = '#b4baa4', N = '#140f0e', top = -40;
        R(-10, top - 2, 36, 1, 'rgba(255,200,120,.45)'); R(-10, top - 1, 36, 2, '#0a0806'); R(-10, top + 1, 36, 1, 'rgba(255,200,120,.22)');
        if (v <= 0) return;
        for (const [x, l] of [[2, 6], [4, 10], [11, 8], [13, 5]]) R(x, top + 1, 1, Math.min(l, v), '#0c0a0c');
        const bot = top + v, wob = y => Math.round(Math.sin(y * .35 + t * 2) * .7);
        for (let y = top; y < bot; y++) { const w = y - top < 5 ? 4 : 3, x = 6 + wob(y); R(x, y, w, 1, C); R(x + w - 1, y, 1, 1, D); R(x, y, 1, 1, L); }
        for (let y = top + 11; y < bot - 4; y += 12) { R(5 + wob(y), y, 5, 2, D); R(6 + wob(y), y, 2, 1, L); }
        if (v > 30) R(3, 9, 10, 3, 'rgba(0,0,0,.35)');
        if (h <= 0) {
          R(5, bot, 6, 5, C); R(5, bot, 1, 5, L);
          for (const [x, l] of [[5, 6], [7, 8], [9, 8], [10, 5]]) { R(x, bot + 5, 1, l, C); R(x, bot + 5 + l, 1, 2, N); }
          return;
        }
        const y0 = bot - 1;
        R(5, y0 - 2, 6, 6, D); R(6, y0 - 1, 4, 4, C);
        for (let x = 0; x < h; x++) { const yy = y0 + Math.round(Math.sin(x * .3 + t * 3) * .5); R(8 + x, yy, 1, 3, C); R(8 + x, yy + 2, 1, 1, D); R(8 + x, yy, 1, 1, L); }
        R(8, bot + 4, h, 2, 'rgba(0,0,0,.3)');
        for (let x = 12; x < h - 4; x += 12) R(8 + x, y0 - 1, 2, 5, D);
        const hx = 8 + h;
        R(hx, y0 - 2, 5, 7, C); R(hx, y0 - 2, 5, 1, L); R(hx + 4, y0 - 2, 1, 7, D);
        if (e.grab) { R(hx + 4, y0 - 1, 4, 5, '#7ab040'); R(hx + 5, y0 - 2, 4, 1, C); R(hx + 5, y0 + 3, 4, 1, C); R(hx + 8, y0 - 1, 1, 4, C); R(hx + 9, y0, 1, 2, N); }
        else { for (const [dy, l] of [[-2, 7], [0, 9], [2, 9], [4, 6]]) { R(hx + 5, y0 + dy, l, 1, C); R(hx + 5 + l, y0 + dy, 2, 1, N); R(hx + 8, y0 + dy, 1, 1, D); } R(hx + 1, y0 + 5, 3, 2, C); }
      },
      spirit(g, e, t, R) {   // 土地神龛（屋主神的小庙）
        R(7, -2, 2, 17, '#d8d0c0'); R(4, 14, 8, 1, 'rgba(0,0,0,.4)');
        R(2, -4, 12, 2, '#c9a35a'); R(4, -12, 8, 8, '#d8b040'); R(6, -10, 4, 6, '#8a2a1a');
        R(2, -15, 12, 3, '#a8281e'); R(4, -19, 8, 4, '#a8281e'); R(7, -22, 2, 3, '#d8b040'); R(1, -17, 1, 3, '#d8b040'); R(14, -17, 1, 3, '#d8b040');
        R(3, -5, 2, 1, '#f0f0e0'); R(11, -5, 2, 1, '#f0f0e0'); R(5, -6, 1, 2, '#e85a8a'); R(10, -6, 1, 2, '#e8a030');
        if (!e.off) { const f = Math.sin(t * 13) > 0 ? 1 : 0; R(7, -8 + f, 1, 2 - f, '#ffcf5a'); }
      },
      tamarind(g, e, t, R) {
        R(6, 0, 4, 15, '#3a2a1a'); R(5, 12, 6, 3, '#2a1c12'); R(4, 14, 9, 2, 'rgba(0,0,0,.35)');
        R(-10, -26, 36, 26, '#22341c'); R(-6, -30, 28, 6, '#22341c'); R(-12, -18, 40, 14, '#26381e');
        for (let i = 0; i < 46; i++) R(-12 + ((hash(i, 1, 33) * 38) | 0), -30 + ((hash(i, 2, 33) * 28) | 0), 3, 1, i % 3 ? '#34502a' : '#1a2814');
        for (let i = 0; i < 6; i++) R(-6 + ((hash(i, 5, 33) * 26) | 0), -6 + ((hash(i, 6, 33) * 4) | 0), 1, 4, '#6a4a2a');
      },
      boatup(g, e, t, R) {   // 翻扣在岸上的小船
        R(0, 6, 32, 8, '#3a2618'); R(2, 4, 28, 3, '#4a3220'); R(4, 3, 24, 1, '#5a3c26'); R(2, 13, 28, 2, 'rgba(0,0,0,.4)');
        R(8, 8, 9, 1, '#c8b890'); R(18, 8, 4, 1, '#c8b890'); R(22, 8, 8, 1, '#a89870');
        R(9, 10, 2, 2, 'rgba(160,180,170,.5)'); R(13, 11, 2, 2, 'rgba(160,180,170,.5)');
      },
      net(g, e, t, R) { for (let i = 0; i < 6; i++) { R(2 + i * 2, 1, 1, 12, 'rgba(190,180,150,.7)'); R(2, 2 + i * 2, 12, 1, 'rgba(190,180,150,.6)'); } R(1, 0, 14, 1, '#6a4a2c'); R(5, 12, 2, 2, '#8a8a8a'); R(10, 12, 2, 2, '#8a8a8a'); },
      naat(g, e, t, R) {   // 艾纳香：灰绿的大叶子，顶上一簇簇小黄花
        const sw = Math.round(Math.sin(t * 1.3 + e.x) * .6) + (e.shake ? (Math.sin(t * 30) > 0 ? 1 : -1) : 0);
        R(1, 13, 14, 3, 'rgba(0,0,0,.35)'); R(7, 6, 2, 9, '#4a5a3a');
        R(1 + sw, 3, 14, 11, '#4e6a4a'); R(-1 + sw, 6, 6, 6, '#5a7a54'); R(11 + sw, 5, 6, 7, '#5a7a54'); R(3 + sw, -1, 10, 6, '#56744e');
        for (const [x, y] of [[1, 7], [4, 3], [10, 2], [13, 7], [6, 9], [9, 6]]) { R(x + sw, y, 3, 1, '#8aa47e'); R(x + 1 + sw, y + 1, 1, 2, '#3a5236'); }
        for (const [x, y] of [[4, -2], [8, -3], [11, -1], [2, 1]]) { R(x + sw, y, 2, 2, '#d8c040'); R(x + sw, y, 1, 1, '#f0e070'); }
      },
      straw(g, e, t, R) { R(2, 7, 12, 3, '#b89a5a'); R(5, 4, 6, 4, '#c8aa68'); R(2, 10, 12, 1, '#8a7040'); },
      loom(g, e, t, R) { R(1, -6, 2, 20, '#5a3c22'); R(29, -6, 2, 20, '#5a3c22'); R(1, -6, 30, 2, '#5a3c22'); R(3, 2, 26, 8, '#3a2a40'); for (let x = 4; x < 28; x += 2) R(x, -4, 1, 8, 'rgba(220,210,190,.5)'); R(3, 4, 26, 1, '#7a3a4a'); R(3, 7, 26, 1, '#c8a050'); },
      pounder(g, e, t, R) { R(0, 8, 28, 3, '#5a3c22'); R(14, 6, 3, 8, '#3a2618'); R(1, 2, 3, 8, '#6a4a2c'); R(0, 10, 6, 5, '#7a6a5a'); R(1, 11, 4, 2, '#2a201a'); },
      wood(g, e, t, R) { for (let i = 0; i < 4; i++) { R(1, 4 + i * 3, 14, 3, i % 2 ? '#5a3c22' : '#6a4a2c'); R(1, 4 + i * 3, 2, 3, '#8a6a4a'); R(13, 4 + i * 3, 2, 3, '#8a6a4a'); } },
      coop(g, e, t, R) { R(2, 4, 12, 10, '#a07a40'); for (let x = 3; x < 14; x += 2) R(x, 4, 1, 10, '#7a5a2a'); R(2, 3, 12, 2, '#c09a58'); R(6, 9, 3, 3, '#e8e2d0'); R(8, 8, 1, 1, '#c02818'); },
      naga(g, e, t, R) { R(3, 10, 10, 5, '#b8b0a0'); R(5, -2, 6, 12, '#3a8a5a'); R(4, -6, 8, 5, '#3a8a5a'); R(3, -8, 3, 3, '#2a6a44'); R(10, -8, 3, 3, '#2a6a44'); R(6, -4, 1, 1, '#f0d060'); R(9, -4, 1, 1, '#f0d060'); R(6, 0, 4, 8, '#d8b040'); },
      /* —— 寺 —— */
      bot(g, e, t, R) {   // 布萨堂正面（6 格宽，挂在墙面一行）
        R(2, -8, 92, 22, '#ece6d6'); R(0, 11, 96, 4, '#b8b0a0'); R(2, -8, 92, 1, '#c8c0b0');
        R(42, -4, 12, 18, '#7a1a10'); R(47, -4, 2, 18, '#d8a838'); R(42, -4, 12, 1, '#d8a838');
        for (const x of [12, 26, 64, 78]) { R(x, -2, 7, 11, '#7a1a10'); R(x + 3, -2, 1, 11, '#d8a838'); }
        R(-2, -16, 100, 8, '#c8501e'); R(-2, -16, 100, 1, '#2a6a3a'); R(-2, -9, 100, 1, '#8a2a10');
        for (let x = 0; x < 96; x += 6) R(x, -15, 1, 6, '#a83a14');
        R(10, -28, 76, 12, '#c8501e'); R(10, -28, 76, 1, '#2a6a3a'); for (let x = 12; x < 86; x += 6) R(x, -27, 1, 10, '#a83a14');
        R(36, -32, 24, 8, '#d8a838'); R(40, -30, 16, 4, '#b8882a'); R(47, -31, 2, 2, '#f0d060');
        R(-3, -20, 2, 5, '#d8a838'); R(-4, -21, 2, 2, '#d8a838'); R(97, -20, 2, 5, '#d8a838'); R(98, -21, 2, 2, '#d8a838');
        R(9, -32, 2, 5, '#d8a838'); R(85, -32, 2, 5, '#d8a838');
      },
      sima(g, e, t, R) { R(4, 13, 8, 2, '#8a8270'); R(5, 4, 6, 9, '#e0d8c0'); R(6, 2, 4, 2, '#e0d8c0'); R(7, 0, 2, 2, '#e0d8c0'); R(7, 6, 2, 4, '#c8a050'); R(9, 4, 2, 9, '#c8c0a8'); },
      bodhi(g, e, t, R) {   // 菩提树（2 格宽），树干缠着三色布
        R(13, -4, 7, 19, '#5a4632'); R(11, 12, 11, 3, '#4a3828'); R(13, 2, 7, 2, '#e8c020'); R(13, 4, 7, 2, '#c8302a'); R(13, 6, 7, 2, '#3a7ac0');
        R(-12, -40, 56, 36, '#1e3a24'); R(-6, -46, 44, 8, '#1e3a24'); R(-14, -28, 60, 16, '#22402a');
        for (let i = 0; i < 70; i++) { const x = -14 + ((hash(i, 3, 51) * 58) | 0), y = -46 + ((hash(i, 4, 51) * 40) | 0); R(x, y, 2, 2, i % 3 ? '#2f5a36' : '#152a1a'); R(x + 1, y + 2, 1, 1, '#3e6e44'); }
        R(2, -2, 2, 14, '#6a5a3a'); R(28, -1, 2, 13, '#6a5a3a');
      },
      chedi(g, e, t, R) {
        R(2, 10, 28, 5, '#d8d2c2'); R(4, 6, 24, 5, '#e8e4d8'); R(7, -8, 18, 15, '#f0ece0'); R(8, -11, 16, 4, '#f0ece0'); R(21, -8, 4, 15, '#d0cabc');
        R(12, -15, 8, 4, '#e8e4d8'); R(14, -30, 4, 15, '#d8a838'); R(15, -36, 2, 6, '#e0b848'); for (let y = -28; y < -16; y += 3) R(14, y, 4, 1, '#b8882a');
      },
      pillar(g, e, t, R) {
        R(5, -18, 6, 31, '#ece6d6'); R(9, -18, 2, 31, '#c8c0b0'); R(4, -20, 8, 3, '#d8a838'); R(3, -21, 10, 1, '#b8882a'); R(4, 12, 8, 3, '#8a2a1a');
        if (e.tied) { R(4, -8, 8, 3, '#fffff0'); R(4, -7, 8, 1, '#d8d8c8'); }
      },
      buddha(g, e, t, R) {   // 佛像（2 格宽），右手触地印
        R(3, 4, 26, 11, '#7a1a10'); R(3, 4, 26, 1, '#d8a838'); R(3, 14, 26, 1, '#d8a838');
        R(5, 1, 22, 4, '#d8a838'); for (let x = 6; x < 26; x += 4) R(x, 1, 2, 2, '#f0d060');
        R(7, -5, 18, 6, '#d8a838'); R(11, -16, 10, 12, '#e0b040'); R(11, -16, 3, 11, '#c89428'); R(12, -24, 8, 8, '#e0b040'); R(12, -24, 8, 2, '#c89428');
        R(15, -29, 2, 5, '#f0c850'); R(14, -26, 4, 2, '#e0b040'); R(13, -21, 1, 1, '#8a5a14'); R(18, -21, 1, 1, '#8a5a14');
        R(9, -6, 3, 6, '#e0b040'); R(20, -10, 3, 5, '#e0b040');
        if (e.lit) R(9, 0, 3, 1, '#fffff0');
      },
      ring(g, e, t, R) {   // 圣线：从西北柱（实体原点）起，依次连到东北、东南、西南，最后回到佛手
        const n = e.n || 0, P = [[8, -7], [7 * 16 + 8, -7], [7 * 16 + 8, 4 * 16 - 7], [8, 4 * 16 - 7]];
        const glow = 'rgba(255,255,220,.22)', c = 'rgba(250,250,236,.95)';
        const seg = (a, b) => { const [x1, y1] = P[a], [x2, y2] = P[b]; if (y1 === y2) { const x = Math.min(x1, x2), w = Math.abs(x2 - x1); R(x, y1 - 1, w, 3, glow); R(x, y1, w, 1, c); } else { const y = Math.min(y1, y2), h = Math.abs(y2 - y1); R(x1 - 1, y, 3, h, glow); R(x1, y, 1, h, c); } };
        if (n >= 2) seg(0, 1); if (n >= 3) seg(1, 2); if (n >= 4) seg(2, 3);
        if (e.done) { seg(3, 0); R(8, -9, 46, 3, glow); R(8, -8, 46, 1, c); }
      },
      hotrai(g, e, t, R) {   // 藏经阁，立在水塘里
        R(4, 2, 2, 13, '#3a2818'); R(26, 2, 2, 13, '#3a2818'); R(15, 2, 2, 13, '#3a2818');
        R(2, -12, 28, 15, '#6a3a22'); R(2, 2, 28, 2, '#4a2a18'); R(8, -8, 5, 7, '#d8a838'); R(19, -8, 5, 7, '#d8a838'); R(10, -8, 1, 7, '#8a5a14'); R(21, -8, 1, 7, '#8a5a14');
        R(-1, -20, 34, 9, '#a8401e'); R(-1, -20, 34, 1, '#2a6a3a'); R(5, -27, 22, 8, '#a8401e'); R(14, -30, 4, 4, '#d8a838'); R(-2, -23, 2, 4, '#d8a838'); R(32, -23, 2, 4, '#d8a838');
        if (!e.read) R(15, -2 + (Math.sin(t * 4) > 0 ? 1 : 0), 2, 2, '#ffe680');
      },
      mound(g, e, t, R) {
        R(1, 6, 14, 8, '#4a3828'); R(3, 4, 10, 3, '#5a4632'); R(1, 13, 14, 2, 'rgba(0,0,0,.35)'); for (let i = 0; i < 6; i++) R(2 + ((hash(i, 9, 1) * 11) | 0), 6 + ((hash(i, 8, 1) * 6) | 0), 1, 1, '#6a5640');
        R(7, -6, 2, 12, '#a8a050'); R(7, -2, 2, 1, '#7a7030'); R(7, 2, 2, 1, '#7a7030');
        R(11, 9, 2, 3, '#c8a080'); R(11, 8, 2, 1, '#d8b090'); R(2, 11, 5, 2, '#f0f0e0'); R(3, 10, 3, 1, '#f0f0e0');
      },
      stake(g, e, t, R) { R(7, 0, 2, 14, '#a8a050'); R(7, 4, 2, 1, '#7a7030'); R(6, 13, 4, 2, '#3a2c1e'); if (e.col) R(6, 2, 4, 3, e.col); },
      kuti(g, e, t, R) {   // 僧舍（3 格宽）
        R(0, 4, 48, 11, 'rgba(8,6,4,.5)'); for (const x of [2, 22, 43]) R(x, 2, 3, 13, '#3a2818');
        R(2, -12, 44, 15, '#7a5232'); for (let x = 2; x < 46; x += 6) R(x, -12, 1, 15, '#5a3a22'); R(18, -8, 10, 11, '#1a120c'); R(33, -8, 8, 6, '#d8a868');
        for (let i = 0; i < 12; i++) { const ins = Math.max(0, 6 - ((i * .5) | 0)); R(-2 + ins, -24 + i, 52 - ins * 2, 1, i % 3 ? '#4a3a2a' : '#3a2c1e'); }
      },
      lowdesk(g, e, t, R) { box(R, 1, 6, 14, 8, '#5a3a22'); R(3, 2, 10, 5, '#d8c890'); R(3, 2, 10, 1, '#8a2a1a'); R(8, 2, 1, 5, '#a89870'); if (!e.read) R(7, -3 + (Math.sin(t * 4) > 0 ? 1 : 0), 2, 2, '#ffe680'); },
      belltower(g, e, t, R) { R(2, -22, 2, 37, '#6a3a22'); R(12, -22, 2, 37, '#6a3a22'); R(0, -27, 16, 5, '#a8401e'); R(0, -27, 16, 1, '#2a6a3a'); R(5, -19, 6, 7, '#b8902a'); R(6, -20, 4, 1, '#d8b04a'); R(7, -12, 2, 2, '#8a6a1a'); R(1, 13, 14, 2, '#5a4a3a'); },
      kendi(g, e, t, R) { R(5, 6, 6, 7, '#c9a35a'); R(6, 4, 4, 2, '#b8902a'); R(7, 2, 2, 2, '#c9a35a'); R(11, 8, 3, 1, '#c9a35a'); R(5, 13, 6, 1, 'rgba(0,0,0,.3)'); R(6, 7, 2, 3, '#e8c87a'); },
      bowl(g, e, t, R) { R(4, 9, 8, 4, '#c9a35a'); R(5, 9, 6, 1, e.full ? '#9fc3d3' : '#8a6a2a'); R(5, 13, 6, 1, 'rgba(0,0,0,.3)'); }
    },
    maps: {
      /* ---------------- 运河边的村子 ---------------- */
      canal: {
        amb: 'river', dark: .52, plr: 3.4, floor: 'dirt', darkC: '#0c0810',
        legend: { b: 'banana', D: 'dockT', O: 'lotus', Y: 'wwall' },
        tileOpts: { grassC: '#2a3a22', treeC: '#16261a' },
        rows: mkRows(40, 17, '"', [
          [0, 0, 39, 1, 'T'], [0, 0, 0, 12, 'T'],
          [1, 2, 9, 8, 'd'], [12, 3, 18, 8, 'd'], [22, 3, 34, 8, 'd'],
          [10, 2, 11, 7, 'b'], [19, 2, 21, 6, 'b'], [28, 6, 28, 8, 'b'], [34, 2, 35, 7, 'b'],
          [1, 9, 39, 10, 'd'],
          [0, 12, 39, 12, 'u'], [0, 13, 39, 16, '~'],
          [36, 1, 39, 8, 'Y'], [36, 11, 39, 12, 'Y'],
          [20, 12, 20, 15, 'D'],
          [5, 14, 6, 14, 'O'], [14, 15, 15, 15, 'O'], [29, 14, 30, 15, 'O'], [33, 13, 33, 14, 'O']
        ]),
        ents: [
          { id: 'hNak', x: 2, y: 2, w: 4, h: 2, spr: 'stilt', col: '#6a5a3a', on: S => underDoor(S) },
          { id: 'ladN', x: 6, y: 3, spr: 'ladder', on: S => ladderNak(S) },
          { x: 8, y: 3, spr: 'tamarind', async on(S) {
            if (S.f.ph === 'flee') return S.narr('罗望子树的影子在地上爬。\n别看它。跑！');
            await S.narr('屋旁的老罗望子树。成亲那年，你和娜在树下埋了一坛酒，说好等孩子满月再挖出来喝。\n……树下的土，好像被人翻过，又仔细地拍平了。');
            S.f.wine = true;
          } },
          { id: 'spiritN', x: 8, y: 6, spr: 'spirit', light: { r: 1.6, col: 'rgba(255,190,110,.18)', flick: true }, async on(S) {
            if (S.f.ph === 'days') return S.narr('你家的土地神龛。供盘里的米饭和香蕉都已经发黑了，茉莉花环干成了一圈褐色。\n……这么多天，没有人来上过供。');
            await S.narr('你家的土地神龛（屋主神的小庙）。泰国人家家都有一座，请守护这块地的神灵住进去，免得它在屋里游荡。\n你合起双手，拜了一拜：谢谢你，替我守着娜。');
          } },
          { id: 'nak_o', x: 6, y: 5, spr: '@nak', dir: 0, on: S => reunion(S) },
          { id: 'hPhin', x: 13, y: 3, w: 4, h: 2, spr: 'stilt', col: '#5a5040', wc: '#6a4c30', on: S => S.narr(S.f.ph === 'days' ? '宾婶家。窗户关着，门缝底下塞着一把艾纳香的叶子，一股冲鼻的樟脑味。' : '邻居宾婶家的高脚屋。宾婶的男人阿添，是和你从小一起在运河里摸鱼长大的。') },
          { id: 'ladP', x: 17, y: 4, spr: 'ladder', async on(S) {
            const ph = S.f.ph;
            if (ph === 'days') { S.sfx('open'); return S.go('nbr', 4, 5, 3); }
            if (ph === 'flee') return S.narr('宾婶家的门闩得死死的。\n门里传出孩子压低的哭声，和大人捂住孩子嘴的声音。');
            S.sfx('locked'); await S.narr(ph === 'arrive' ? '宾婶家的门闩上了。\n……天还没黑呢。' : '门闩着。屋里没有一点声音。');
          } },
          { id: 'phin_o', x: 15, y: 7, spr: '@phin', dir: 2, hidden: false },
          { id: 'tong_o', x: 16, y: 7, spr: '@tong', dir: 1 },
          { id: 'h3', x: 23, y: 3, w: 4, h: 2, spr: 'stilt', col: '#5e5644', on: S => S.narr('卖鱼的玛伯家。窗缝里有一只眼睛，你一看过去，它就不见了。') },
          { x: 27, y: 4, spr: 'ladder', async on(S) { S.sfx('locked'); await S.narr('梯子被抽上去了一半。\n帕卡农的人家，晚上会把梯子收起来——可现在还没到晚上。'); } },
          { id: 'h4', x: 29, y: 3, w: 4, h: 2, spr: 'stilt', col: '#665a40', on: S => S.narr('老秀才家。门口挂着一串用来辟邪的红布条，是新挂的。') },
          { x: 33, y: 4, spr: 'ladder', async on(S) { S.sfx('locked'); await S.narr('门闩着。门板上用石灰画了一道符。'); } },
          { x: 9, y: 13, w: 2, spr: 'boat', on: S => S.narr('阿添的小船拴在木桩上，一漂一漂的。船舱里有半篓没卖完的鱼。') },
          { id: 'thim', x: 12, y: 11, spr: '@thim', dir: 1, on: S => thimTalk(S) },
          { id: 'tboat', x: 10, y: 12, w: 2, spr: 'boatup', hidden: true, async on(S) {
            await S.narr('阿添的船翻扣在岸上，船底朝天。船底的木板上，好像刻着什么。');
            await S.note('thim'); S.f.thimNote = true;
            if (await clue(S, 'warn')) return;
          } },
          { x: 21, y: 14, w: 2, spr: 'boat', solid: false },
          { id: 'puu', x: 21, y: 14, oy: -3, spr: '@puu', dir: 1, on: S => puuTalk(S) },
          { x: 19, y: 11, spr: 'lantern', light: { r: 3, col: 'rgba(255,170,80,.2)', flick: true }, on: S => S.narr('码头边的油灯，风一吹就直往一边倒。') },
          { x: 22, y: 11, spr: 'sign', col: '#5a4024', on: S => S.narr('木牌上写着：帕卡农渡口。往东：玛哈布寺。') },
          { id: 'naat', x: 26, y: 8, spr: 'naat', on: S => naatOn(S) },
          { id: 'v1', x: 25, y: 10, spr: '@vman', dir: 1, hidden: true, async on(S) { S.face('v1', 'pl'); S.bubble('v1', '!', 800); await S.say('村里的男人', ['……麦？你、你别过来。', '我什么也不知道！我家里还有事！']); S.face('v1', 2); } },
          { id: 'v2', x: 31, y: 7, spr: '@vwom', dir: 0, hidden: true, async on(S) { S.face('v2', 'pl'); await S.say('卖花的大姐', ['麦，你瘦了。……你在家，吃得好吗？', '（她的目光越过你的肩膀，看了一眼你家的方向，飞快地合起双手拜了拜）', '我、我得走了。']); } },
          { x: 35, y: 8, spr: 'naga', light: { r: 2.4, col: 'rgba(255,190,110,.16)' }, on: S => S.narr('寺门口的那伽（蛇神）石像，张着嘴，守着去寺里的路。') },
          { x: 35, y: 11, spr: 'naga', on: S => S.narr('另一尊那伽。石头上落满了菩提树的叶子。') },
          { x: 39, y: 9, spr: 'invisible', touch: S => toWat(S) },
          { x: 39, y: 10, spr: 'invisible', touch: S => toWat(S) },
          { id: 'nak_c', x: 4, y: 4, spr: '@nakg', hidden: true, solid: false, light: { r: 2, col: 'rgba(170,200,180,.16)' } }
        ],
        async enter(S, first) {
          const ph = S.f.ph || 'arrive';
          if (first && ph === 'arrive') return arrive(S);
          if (ph === 'days' && S.once('daysOut')) return daysOut(S);
          if (ph === 'dusk' && S.once('duskOut')) return duskVillage(S);
          if (ph === 'flee' && S.once('fleeOut')) return fleeOut(S);
        },
        step(S, x, y) {
          const ph = S.f.ph || 'arrive';
          if (ph === 'arrive') {
            if (x <= 19 && y <= 11 && S.once('phinScene')) return phinScene(S);
            if (x <= 14 && S.once('thimScene')) return thimScene(S);
            if (x <= 9 && y >= 3 && y <= 8) return reunion(S);
          }
          if (ph === 'flee') {
            if (x >= 18 && S.once('fl1')) return (async () => { S.sfx('cry'); await S.say('娜（身后）', '麦——你要去哪儿？\n孩子在哭呢，你听不见吗？', { style: 'whisper' }); })();
            if (x >= 30 && S.once('fl2')) return S.narr('前面！寺门口的那伽石像旁边，还亮着灯！');
          }
        },
        tick(S, dt) {
          if (S.f.ph !== 'flee' || W.busy) return;
          /* 她从运河里冒出来，堵在前面的路上（只一次；躲过艾纳香后不再来） */
          const n = S.ent('nak_c'), px = W.pl.x;
          if (!S.f._amb && !S.f.naat && n && !n.hidden && px >= 23 && px <= 30) {
            S.f._amb = true; S.stop('nak_c');
            S.place('nak_c', Math.min(34, px + 7), W.pl.y >= 9 && W.pl.y <= 10 ? W.pl.y : 10, 1); S.sfx('splash'); S.sfx('scream'); S.shake(400, 2); S.bubble('nak_c', '!', 1200);
            S.after(0, async S => {
              S.freeze('nak_c', true);
              await S.narr('前面的水里「哗啦」一声——\n她从运河里站了起来，浑身滴着水，挡在去寺里的路上。');
              await S.think('绕过去！……或者，路边那丛艾纳香。');
              S.freeze('nak_c', false); S.chase('nak_c', { spd: 2.6, catch: caughtC });   // 刚从水里爬出来，拖着步子，比身后追时略慢
            });
            return;
          }
          if (!(S.f._csp > 0)) return;
          S.f._csp -= dt;
          if (S.f._csp <= 0) { const [x, y] = S.f._cpos || [4, 4]; S.place('nak_c', x, y, 2); S.ent('nak_c').alpha = 1; S.sfx('whisper'); S.bubble('nak_c', '…', 1500); S.chase('nak_c', { spd: 2.8, wait: 1, catch: caughtC }); }
        }
      },
      /* ---------------- 高脚屋里 ---------------- */
      house: {
        amb: 'room', dark: .62, plr: 3, wall: 'wood', floor: 'slat',
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
          { x: 5, y: 8, spr: 'invisible', async touch(S) {
            const ph = S.f.ph;
            if (ph === 'home') { await S.narr('天已经黑透了。娜说，晚上别出门。'); return S.walk('pl', 'u', 5); }
            if (ph === 'seen' || ph === 'dinner') { await S.narr('娜就坐在那儿看着你。\n……现在出去，她会知道的。'); return S.walk('pl', 'u', 5); }
            await S.go('canal', 6, 4, 0);
          } },
          { id: 'win1', x: 3, y: 1, spr: 'shutter', open: true, lit: false, on: S => winOn(S) },
          { id: 'win2', x: 7, y: 1, spr: 'shutter', open: true, lit: false, on: S => winOn(S) },
          { id: 'hing', x: 10, y: 1, spr: 'hing', flowers: true, async on(S) {
            if (S.f.ph === 'days' || S.f.ph === 'dusk') return S.narr('家里的佛龛。佛像被一块白布从头到脚蒙住了。\n你想掀开，手伸到一半，听见身后娜轻轻地说：「别动它。」');
            await S.narr('家里的佛龛。你跪下来，合掌，额头碰了三下地板。\n……佛像前的茉莉花环是新的，可佛像的脸，像是被谁转向了墙那边。你把它轻轻转了回来。');
          } },
          { id: 'stove', x: 1, y: 2, spr: 'stoveC', light: { r: 2.4, col: 'rgba(255,140,60,.22)', flick: true }, on: S => S.narr(S.f.ph === 'days' ? '炭炉冷着。锅里的饭是昨天晚上的，一粒也没动过。' : '小炭炉里的火红红的。锅里咕嘟咕嘟煮着鱼汤，是你最爱喝的那种，放了很多香茅。') },
          { id: 'mirror', x: 5, y: 2, spr: 'bmirror', on: S => mirrorOn(S) },
          { id: 'lamp', x: 6, y: 2, spr: 'oillamp', light: { r: 3.6, col: 'rgba(255,180,90,.22)', flick: true }, on: S => S.narr('椰子油灯。火苗小小的，照不到屋角。') },
          { id: 'mortar', x: 2, y: 4, spr: 'mortar', on: S => S.narr(S.f.ph === 'lime' ? '石臼里是舂了一半的辣椒、虾酱和蒜。还差青柠。' : '陶土的石臼和木杵。娜舂的青柠辣椒酱，整条运河都有名。') },
          { id: 'cradle', x: 8, y: 3, spr: 'cradle', on: S => cradleOn(S) },
          { id: 'mat', x: 8, y: 6, w: 2, spr: 'mat', on: S => S.narr(S.f.ph === 'days' ? '蚊帐里的席子上，只有一个人躺过的印子。\n是你的。' : '铺好的席子，挂着蚊帐。枕头是新晒过的，有太阳的味道。') },
          { id: 'trunk', x: 1, y: 6, spr: 'trunk', async on(S) {
            if (S.once('letter')) await S.narr('娜陪嫁的小木箱。最上面放着一张折了很多次的纸，压在一把象牙梳子底下。');
            await S.note('letter'); S.f.letter = true;
          } },
          { id: 'betel', x: 4, y: 6, spr: 'betel', on: S => S.narr('铜槟榔盘。蒌叶、槟榔、石灰膏，一样不少。\n娜嚼了槟榔，嘴唇红红的。你走的时候，她就是这样红着嘴唇笑的。') },
          { id: 'nak_h', x: 7, y: 4, spr: '@nak', dir: 0, on: S => nakTalk(S) },
          { id: 'nak_k', x: 3, y: 4, spr: '@nak2', dir: 1, hidden: true, on: S => nakTalk(S) }
        ],
        async enter(S, first) {
          const ph = S.f.ph;
          if (ph === 'home' && S.once('homeScene')) return homeScene(S);
          if (ph === 'dusk') return limeStart(S);
          if (ph === 'seen') return dinner(S);
          if (ph === 'days' && S.once('daysIn')) await S.narr('屋里很暗。百叶窗关得严严实实，只有窗缝里漏进几道白光。\n娜抱着孩子，坐在光照不到的那个角落里。');
        }
      },
      /* ---------------- 高脚屋底下 ---------------- */
      under: {
        amb: 'night', dark: .74, plr: 2.8, floor: 'ushade',
        legend: { b: 'banana', I: 'post' },
        rows: [
          'bbbbbbbbbbbb',
          'b..........b',
          'b.I...I..I.b',
          'b..........b',
          'b.I...I..I.b',
          'b..........b',
          'b.I...I..I.b',
          'bbbbb..bbbbb'],
        ents: [
          { x: 5, y: 7, spr: 'invisible', touch: S => leaveUnder(S) },
          { x: 6, y: 7, spr: 'invisible', touch: S => leaveUnder(S) },
          { id: 'ladU', x: 5, y: 1, spr: 'ladder', async on(S) {
            const ph = S.f.ph;
            if (ph === 'lime') return S.narr('得先把青柠摘下来。');
            if (ph === 'seen') { S.sfx('open'); return S.go('house', 5, 7, 3); }
            S.sfx('open'); await S.go('house', 5, 7, 3);
          } },
          { id: 'jarU', x: 8, y: 1, spr: 'jar', async on(S) {
            if (S.f.ph === 'days' && S.once('jarHair')) { S.sfx('drip'); return S.narr('大水缸里的水黑沉沉的，有一股运河底下淤泥的味道。\n水面上漂着几根长长的黑头发，缠成一团。\n……这缸水，娜平时是拿来做饭的。'); }
            await S.narr('龙纹大水缸。你俯身往里看，水面上映出你自己的脸，和你头顶上地板的缝。');
          } },
          { x: 3, y: 5, w: 2, spr: 'loom', on: S => S.narr('娜的织布机。机上绷着一匹没织完的布，红的底子上织了一半的花。\n织到一半的地方，梭子还插在线里，落了一层灰。') },
          { x: 7, y: 6, w: 2, spr: 'pounder', on: S => S.narr('脚踏的舂米杵。你走之前，每天早上都是你踩着它，娜在旁边簸米。') },
          { x: 10, y: 6, spr: 'wood', on: S => S.narr('码得整整齐齐的柴火。最底下几根已经长了白毛。') },
          { x: 1, y: 6, spr: 'coop', on: S => S.narr(S.f.ph === 'days' || S.f.ph === 'dusk' ? '鸡笼是空的。笼底散着几根羽毛。\n宾婶说过，鸡和狗，是最先知道的。' : '鸡笼里的两只母鸡缩成一团，一声不吭。') },
          { id: 'basket', x: 9, y: 4, spr: 'limebasket', on: S => basketOn(S) },
          { id: 'gl1', x: 3, y: 2, spr: 'invisible', solid: false, off: true, light: { r: 3.4, col: 'rgba(255,190,100,.16)' } },
          { id: 'limeF', x: 3, y: 3, spr: 'lime', hidden: true, solid: false },
          { id: 'arm', x: 3, y: 3, spr: 'arm', hidden: true, solid: false, z: 1 }
        ],
        async enter(S, first) {
          if (S.f.ph === 'lime' && S.once('underLime')) { await S.narr('屋底下黑乎乎的。头顶的地板缝里漏下一线一线的油灯光，落在地上，像一道道栅栏。\n「咚、咚、咚」——娜在上面舂辣椒。'); S.ent('gl1').off = false; return; }
          if (first) await S.narr('高脚屋底下又矮又暗，柱子一根一根立着。\n雨季的时候，运河的水会一直漫到这里。');
        },
        /* 摘青柠的时候：你站着，头顶就「咚、咚」地舂；你一走动，舂杵声就停——她在听 */
        tick(S, dt) {
          if (S.f.ph !== 'lime' || W.busy) return;
          if (S.moving) {
            if (UND.mv <= 0 && !UND.warned) { UND.warned = true; S.toast('头顶的舂杵声停了。……她在听。'); }
            UND.mv = 1.1; return;
          }
          if (UND.mv > 0) { UND.mv -= dt; return; }
          UND.pd -= dt; if (UND.pd <= 0) { UND.pd = .78; pestle(S); }
        }
      },
      /* ---------------- 宾婶家 ---------------- */
      nbr: {
        amb: 'room', dark: .66, plr: 3, wall: 'wood', floor: 'slat',
        rows: [
          '##########',
          '##########',
          '#........#',
          '#........#',
          '#........#',
          '#........#',
          '####.#####'],
        ents: [
          { x: 4, y: 6, spr: 'invisible', to: ['canal', 17, 5, 0] },
          { x: 2, y: 1, spr: 'net', on: S => S.narr('墙上挂着阿添的渔网。网眼里还卡着一片干了的水草。') },
          { x: 4, y: 1, spr: 'shutter', on: S => S.narr('窗户从里面用木棍顶死了。') },
          { x: 7, y: 1, spr: 'hing', flowers: true, light: { r: 2.2, col: 'rgba(255,190,110,.18)', flick: true }, on: S => S.narr('佛龛前点着蜡烛，供着一碗白饭。\n佛像底下压着一根白棉线，一头一直拉到门框上。') },
          { x: 7, y: 2, spr: 'straw', on: S => S.narr('阿添的斗笠。帽檐还是湿的。') },
          { x: 1, y: 2, spr: 'oillamp', light: { r: 3, col: 'rgba(255,180,90,.2)', flick: true } },
          { x: 6, y: 5, w: 2, spr: 'mat', on: S => S.narr('宾婶和阿通睡的席子。席子边上放着一把砍刀。') },
          { id: 'phin_n', x: 5, y: 3, spr: '@phin', dir: 0, on: S => phinTalk(S) },
          { id: 'tong_n', x: 6, y: 3, spr: '@tong', dir: 0, on: S => tongTalk(S) }
        ],
        async enter(S, first) { if (first) await S.narr('屋里一股艾纳香烧过的樟脑味，呛得人直流眼泪。\n宾婶一看见是你，脸一下子白了。'); }
      },
      /* ---------------- 玛哈布寺 ---------------- */
      wat: {
        amb: 'night', dark: .38, plr: 3.2, wall: 'plain', floor: 'sand', wallC: { face: '#d8d2c2', trim: '#8a2a1a', top: '#1a1816' },
        tileOpts: { grassC: '#2a3a22', treeC: '#16261a' },
        rows: mkRows(24, 18, '#', [
          [1, 3, 22, 16, 's'], [11, 17, 12, 17, 's'],
          [8, 7, 15, 11, 'q'], [1, 8, 4, 11, '~'], [17, 7, 22, 11, 'd'], [11, 12, 12, 16, 'k'],
          [1, 3, 1, 4, 'T'], [22, 3, 22, 4, 'T'], [1, 14, 2, 16, 'T'], [21, 15, 22, 16, 'T']
        ]),
        ents: [
          { x: 11, y: 17, spr: 'invisible', touch: S => leaveWat(S) },
          { x: 12, y: 17, spr: 'invisible', touch: S => leaveWat(S) },
          { x: 9, y: 2, w: 6, spr: 'bot', on: S => S.narr('布萨堂（戒堂）。新出家的人在这里受戒，四周的界石圈出一块清净地。\n门关着。门缝里漏出一线金光。') },
          { x: 7, y: 3, spr: 'sima', on: S => S.narr('界石（Sima），形状像一片菩提叶。老人们说，界石圈着的地方，鬼是进不来的——至少，不能一直待着。') },
          { x: 16, y: 3, spr: 'sima', on: S => S.narr('界石底下埋着一块圆石。立寺的时候，人们把它埋下去，从此这里就是佛的地方。') },
          { x: 3, y: 4, w: 2, spr: 'bodhi', on: S => S.narr('寺里的菩提树。树干上缠着黄、红、蓝三色的布，树根边上供着几个泥娃娃和一双小小的婴儿鞋。\n是谁供的？') },
          { x: 22, y: 6, spr: 'belltower', on: S => S.narr('钟楼。天亮和天黑的时候，小沙弥会来敲钟。') },
          { x: 19, y: 4, w: 2, spr: 'chedi', on: S => S.narr('白色的佛塔。塔基四周的小龛里，放着村里人的骨灰。\n火化过的人，都在这里。') },
          { id: 'hotrai', x: 3, y: 9, w: 2, spr: 'hotrai', async on(S) {
            if (S.once('palm')) await S.narr('藏经阁建在水塘中间，免得白蚁蛀了经书。\n你踩着塘边的石头够过去，从窗口抽出一串贝叶。最上面那几片，好像常常被人翻看。');
            await S.note('palm'); S.f.palm = true; S.ent('hotrai').read = true;
          } },
          { id: 'mound', x: 20, y: 9, spr: 'mound', async on(S) {
            await S.narr('乱葬岗的角落里，有一座新坟。没有石碑，只插着一根竹竿。\n坟前放着一个小小的泥娃娃，和一串茉莉花——还是新鲜的。');
            await S.narr('竹竿上用炭写着两个字。\n你认得那两个字。你和娜成亲那天，你在婚帖上一笔一笔描过它们。');
            if (await clue(S, 'grave')) return;
          } },
          ...[[18, 8], [21, 10], [18, 10], [22, 8]].map(([x, y], i) => ({ x, y, spr: 'stake', solid: false, col: i % 2 ? '#e8e0c8' : null })),
          { x: 19, y: 13, w: 3, spr: 'kuti', on: S => S.narr('住持的僧舍。门口摆着一双磨平了的木屐。') },
          { id: 'desk', x: 16, y: 14, spr: 'lowdesk', async on(S) {
            await S.narr('僧舍门口的矮桌上，摊着寺里的亡者簿。\n风把它翻到了其中一页。');
            await S.note('record'); S.f.record = true; S.ent('desk').read = true;
            if (await clue(S, 'record')) return;
          } },
          { id: 'abbot', x: 18, y: 14, spr: '@abbot', dir: 0, on: S => abbotTalk(S) },
          { id: 'novice', x: 6, y: 13, spr: '@novice', dir: 0, async on(S) {
            S.face('novice', 'pl');
            if (S.f.ph !== 'days' && S.f.ph !== 'dusk') return;
            if (S.once('nov1')) return S.say('小沙弥', ['施主，那封信……是我替娜姐姐写的。', '她说一句，我写一句。写到「码头风大」的时候，她笑了，说你最怕冷。', '……后来她就没再来过寺里。']);
            await S.say('小沙弥', '住持说，扫地的时候不要想事情。可我总是想。');
          } },
          { id: 'buddha', x: 11, y: 7, w: 2, spr: 'buddha', light: { r: 2.8, col: 'rgba(255,200,110,.22)' }, on: S => buddhaOn(S) },
          { x: 12, y: 8, spr: 'incense', solid: false },
          { id: 'p_nw', x: 8, y: 7, spr: 'pillar', on: S => postOn(S, 'nw') },
          { id: 'p_ne', x: 15, y: 7, spr: 'pillar', on: S => postOn(S, 'ne') },
          { id: 'p_se', x: 15, y: 11, spr: 'pillar', on: S => postOn(S, 'se') },
          { id: 'p_sw', x: 8, y: 11, spr: 'pillar', on: S => postOn(S, 'sw') },
          { id: 'ring', x: 8, y: 7, spr: 'ring', solid: false, z: 1 },
          ...[[7, 6], [16, 6], [7, 12], [16, 12]].map(([x, y]) => ({ x, y, spr: 'lantern', light: { r: 2.3, col: 'rgba(255,170,80,.18)', flick: true }, on: S => S.narr('挂在柱子上的灯笼。纸上画着莲花。') })),
          { id: 'abbot_s', x: 13, y: 9, spr: '@abbot', dir: 0, hidden: true, on: S => abbotNight(S) },
          { id: 'novice_s', x: 10, y: 9, spr: '@novice', dir: 0, hidden: true },
          { id: 'bowl', x: 11, y: 9, spr: 'bowl', hidden: true, solid: false },
          { id: 'mophi', x: 11, y: 16, spr: '@mophi', dir: 3, hidden: true },
          { id: 'cjar', x: 12, y: 16, spr: 'cjar', hidden: true, solid: false },
          { id: 'vw1', x: 10, y: 16, spr: '@vman', dir: 3, hidden: true, light: { r: 2.8, col: 'rgba(255,150,60,.22)', flick: true } },
          { id: 'phin_w', x: 13, y: 16, spr: '@phin', dir: 3, hidden: true, light: { r: 2.4, col: 'rgba(255,150,60,.2)', flick: true } },
          { id: 'nak_w', x: 11, y: 16, spr: '@nakg', hidden: true, solid: false, light: { r: 2.2, col: 'rgba(170,200,180,.18)' } }
        ],
        async enter(S, first) {
          if (S.f.ph === 'flee') return threadIntro(S);
          if (first) await S.narr('玛哈布寺。白墙红顶，院子里铺着细沙，扫得一个脚印也没有。\n一进寺门，运河的水声就远了。');
        },
        tick(S, dt) {
          /* 诵经快念完的时候，她在寺门口越来越不安分 */
          if (S.f.ph !== 'thread' || W.busy || !W.timer) return;
          const n = S.ent('nak_w'); if (!n || n.hidden) return;
          n.alpha = W.timer.left < 12 ? .75 + Math.abs(Math.sin(W.t * 6)) * .25 : .85;
        }
      }
    }
  });

  /* ================= 剧情 ================= */
  const HOUSE_LIGHT = { r: 2.6, dx: 32, dy: -2, col: 'rgba(255,180,90,.2)', flick: true };

  async function arrive(S) {
    S.f.ph = 'arrive';
    const h = S.ent('hNak'); h.lit = true; h.light = HOUSE_LIGHT;
    S.ent('h4').lit = true;
    await S.narr('船靠了岸。\n夕阳沉在运河的尽头，把水面染成了铜色。岸边的高脚屋一栋挨着一栋，屋檐下已经点起了灯。');
    S.face('puu', 'pl');
    await S.say('普婆婆', ['到了，帕卡农。', '……你是麦吧？娜家的。']);
    await S.say('麦', ['是我，婆婆！仗打完了，官府放我们回家了。', '娜还好吗？孩子生了吗？是男孩还是女孩？']);
    await S.narr('普婆婆没有回答。她低着头，一下一下地摘着船桨上缠的水草。');
    await S.say('普婆婆', ['……快回家吧。', '天黑以前。']);
    S.goal('回家——娜在等你（往西，沿着河边的路走）');
  }

  async function phinScene(S) {
    S.focus(16, 7);
    S.face('phin_o', 'pl'); S.bubble('phin_o', '!', 900); S.sfx('thud');
    await S.narr('邻居宾婶正在院子里收衣服。她看见了你，手里的竹篮「啪」地掉在地上。');
    S.face('tong_o', 'pl');
    await S.say('阿通', '妈！是麦叔！娜姨家的麦叔回来了——');
    await S.say('宾婶', '闭嘴！进屋！');
    const a = bg(S.walk('tong_o', [17, 5], 5)); await S.walk('phin_o', [16, 5], 5); await a;
    S.hide('tong_o'); S.hide('phin_o'); S.sfx('close');
    await S.narr('门「砰」地一声关上了。\n门闩落下来的声音，你在路上都听得见。');
    S.focus(null);
    await S.think('……宾婶这是怎么了？');
  }

  async function thimScene(S) {
    S.face('thim', 'pl'); S.bubble('thim', '!', 900);
    await S.say('阿添', '麦？！麦，真的是你！');
    await S.say('麦', '阿添！你还在打鱼啊？我家娜她——');
    S.face('thim', 3);
    await S.say('阿添', ['麦，你听我说。你不在的这些日子，娜她……', '雨季那天晚上，雨下得好大，接生婆——']);
    S.amb('none'); S.focus(6, 5); await S.wait(700);
    await S.narr('阿添的话忽然断了。\n他的眼睛越过你的肩膀，直直地盯着运河上游——你家的方向。');
    await S.narr('你家的院子里，站着一个女人，怀里抱着一个襁褓。\n她一动不动，朝这边望着。');
    S.focus(null); S.amb('river');
    S.face('thim', 'pl');
    await S.say('阿添', ['……没、没什么。', '她……她等你很久了。快回去吧。']);
    await S.narr('阿添转身就走，差点被自己的船绳绊了一跤。');
    S.face('thim', 0);
  }
  async function thimTalk(S) {
    S.face('thim', 'pl');
    await S.say('阿添', '快回去吧，麦。……别让她等。');
    S.face('thim', 0);
  }

  async function reunion(S) {
    if (S.f.met || S.f.ph !== 'arrive') return;
    S.f.met = true;
    await S.walk('pl', [7, 5], 4); S.turn(1); S.face('nak_o', 'pl');
    await S.say('娜', '……麦？');
    await S.say('麦', '娜！');
    await S.narr('她就站在那儿，和你走的那天一模一样。\n头发长了一些，人瘦了一些，嘴唇被槟榔染得红红的。');
    await S.say('娜', ['你回来了。', '我就知道你会回来。']);
    await S.narr('你想抱她，又怕压着她怀里的孩子。');
    await S.say('娜', ['你看。是个男孩。', '我给他取名叫小丹。他生下来的时候，脸红红的，像熟透的果子。']);
    await S.narr('襁褓裹得很紧，只露出一点点小脸。孩子睡得很沉，一声也不吭。');
    await S.say('麦', '他……好安静。');
    await S.say('娜', '他乖。他知道爸爸今天回来。');
    await S.narr('你握住娜的手。\n她的手很凉，凉得像刚从运河里捞上来。');
    await S.say('娜', ['傍晚了，河边风大。', '进屋吧。我给你煮了鱼汤，放了好多香茅。']);
    S.hide('nak_o'); S.f.ph = 'home';
    S.sfx('open');
    await S.go('house', 5, 7, 3);
  }

  async function ladderNak(S) {
    const ph = S.f.ph || 'arrive';
    if (ph === 'arrive') return reunion(S);
    if (ph === 'flee') return S.narr('不能回去！');
    S.sfx('open'); await S.go('house', 5, 7, 3);
  }
  async function underDoor(S) {
    const ph = S.f.ph || 'arrive';
    if (ph === 'arrive' || ph === 'home') return S.narr('这是你的家。屋底下黑乎乎的，堆着柴火，拴着鸡。\n先上去吧，娜在等你。');
    if (ph === 'flee') return S.narr('别停下！跑！');
    await S.go('under', 5, 6, 3);
  }
  async function leaveUnder(S) {
    if (S.f.ph === 'limeS') return;
    if (S.f.ph === 'seen') {
      S.sfx('thud');
      await S.say('娜（头顶上）', '麦？……梯子在这边呀。', { style: 'whisper' });
      await S.think('她听得见。……先上去。装作什么也没看见。');
      return S.walk('pl', 'u', 5);
    }
    await S.go('canal', 3, 4, 0);
  }

  /* 艾纳香：白天是伏笔，逃跑时可以钻进去躲一次 */
  async function naatOn(S) {
    const ph = S.f.ph || 'arrive';
    if (ph !== 'flee') return S.narr('路边一丛艾纳香，叶子毛茸茸的，揉碎了有一股冲鼻的樟脑味。\n小时候宾婶说过：鬼闻不得这个味儿。');
    if (S.f.naat) return S.narr('她就在附近。这一回，不能再躲了——跑！');
    S.f.naat = true;
    const n = S.ent('nak_c');
    S.stop('nak_c'); S.hidePlayer(true); S.ent('naat').s.shake = true; S.sfx('step');
    await S.narr('你一头扎进艾纳香丛里，蜷成一团。\n樟脑味冲得你眼泪直流。你捂住嘴，一声也不敢出。');
    S.ent('naat').s.shake = false;
    if (n && !n.hidden) {
      const nx = Math.round(n.px / TS), ny = Math.round(n.py / TS);
      S.focus(nx, ny);
      S.sfx('drip'); await S.wait(500);
      await S.say('娜', '麦……？', { style: 'whisper' });
      S.bubble('nak_c', '…', 1600); await S.wait(700);
      await S.narr('她停在离你几步远的地方，鼻子一抽一抽的。\n然后，她捂住脸，往后退了一步，又一步。');
      S.sfx('cry');
      await S.say('娜', '麦，你别躲我……我什么也不做。我就是想跟你回家……', { style: 'whisper' });
      await S.alpha('nak_c', 0, 1200);
      S.focus(null);
    }
    S.hidePlayer(false);
    await S.narr('哭声往村子那头去了。\n……走了。趁现在！');
    /* 她回到你身后远处，过一会儿再追上来 */
    S.f._cpos = [Math.max(2, W.pl.x - 12), 9]; S.f._csp = 3.5;
  }

  async function homeScene(S) {
    await S.narr('屋里和你走的时候一模一样：椰子油灯，炭炉，墙上的佛龛，房梁上垂下来的摇篮。\n只是多了一股潮湿的、淡淡的水腥味。');
    S.face('nak_h', 'pl');
    await S.say('娜', ['先拜拜佛吧。谢谢佛祖把你平平安安地送回来。', '饭好了，就叫你。']);
    S.goal('在家里看看，然后和娜说说话');
  }

  async function nightScene(S) {
    S.face('nak_h', 'pl');
    await S.narr('你们坐在席子上吃饭。鱼汤很香。娜一直往你碗里夹鱼，自己一口也没吃。');
    await S.say('麦', ['东边打了一年多的仗。', '我天天想着回来。想着你，想着孩子……想着你舂的辣椒酱。']);
    await S.say('娜', '我知道。我每天都知道。');
    const r = await S.ask('娜看着你吃，笑得很安静。', ['「生孩子的时候……疼吗？」', '「你瘦了。这些日子，苦了你了。」'], '麦');
    if (r === 0) { await S.narr('娜的笑停了一下。'); await S.say('娜', ['疼。', '疼了一整夜。我一直喊你的名字。', '……后来，就不疼了。']); }
    else await S.say('娜', ['不苦。', '等人不苦。等不到，才苦。']);
    await S.fade(1, 900);
    S.ent('lamp').off = true; S.ent('stove').off = true; S.dark(.9); S.plr(2.2);
    S.place('nak_h', 8, 4, 3); S.pos(9, 7, 3);
    await S.fade(0, 900);
    await S.narr('半夜，你被一阵很轻的歌声弄醒了。');
    lullaby(S, 1.15, .06);
    await S.say('娜（低声）', '睡吧，睡吧，我的心肝……\n妈妈在这儿，守着你，守到天亮……', { style: 'whisper' });
    S.sfx('drip');
    await S.narr('她背对着你，站在摇篮边上，一下一下地晃着摇篮。\n滴答。滴答。\n有水从她的头发梢上滴下来，在地板上积了一小摊。');
    await S.think('……外面没有下雨啊。');
    S.sfx('drip'); S.bubble('nak_h', '…', 1500);
    await S.narr('她的头，慢慢地，朝你这边转了过来——\n你闭上了眼睛。\n你太累了。你告诉自己，这是在做梦。');
    await S.fade(1, 900);
    await S.card('', '第二天', '天亮的时候，你被一声哭喊惊醒。\n\n不是孩子在哭。\n是宾婶。');
    /* —— 白天 —— */
    S.f.ph = 'days';
    S.dark(.74); S.plr(null); S.dark(.3, 'canal');
    for (const w of ['win1', 'win2']) { const e = S.ent(w); e.open = false; e.lit = true; }
    S.ent('stove').off = true; S.ent('lamp').off = true; S.ent('hing').covered = true;
    const c = S.ent('cradle'); c.s.baby = true; c.s.cold = true;
    const n = S.ent('nak_h'); n.spr = '@nak2'; S.place('nak_h', 10, 4, 0);
    const h = S.ent('hNak'); h.lit = false; h.light = null; S.ent('h4').lit = false;
    for (const id of ['phin_o', 'tong_o', 'thim', 'nak_o']) S.hide(id);
    for (const id of ['tboat', 'v1', 'v2']) S.show(id);
    S.pos(7, 7, 3);
    await S.fade(0, 900);
    await S.narr('屋里很暗。娜把百叶窗都关上了，只有窗缝里漏进几道白光。\n她抱着膝盖坐在光照不到的那个角落里。小丹躺在摇篮里。');
    S.face('nak_h', 'pl');
    await S.say('娜', '外面吵什么呢……你去看看吧。我和孩子在家。');
    goalDays(S);
    S.cp('days');
  }

  async function daysOut(S) {
    await S.narr('外面的太阳白得晃眼。');
    S.focus(11, 12);
    await S.narr('运河边围过一圈人，刚刚散开。宾婶被人扶回了家，一路走一路哭。\n他们从浅水里捞上来一个人——水才没过膝盖，那个人却脸朝下漂着。\n是阿添。');
    await S.narr('阿添的船被人翻过来扣在岸上，像一口小小的棺材。\n看见你，剩下的几个人低着头，一个接一个地走开了。');
    S.focus(null);
    await S.think('阿添昨天想跟我说什么来着？\n「雨季那天晚上……接生婆……」');
    goalDays(S);
  }

  async function nakTalk(S) {
    const ph = S.f.ph, id = S.ent('nak_k').hidden ? 'nak_h' : 'nak_k';
    S.face(id, 'pl');
    if (ph === 'home') return nightScene(S);
    if (ph === 'days') {
      if (!S.f.c_day) {
        await S.say('麦', '娜，今天天好。咱们抱着小丹去寺里做功德吧？让住持给孩子念念经，在手腕上系根白线。');
        S.bubble(id, '…', 1200);
        await S.say('娜', ['……我不去。', '孩子怕光。我也怕。']);
        await S.say('麦', '那我把窗户打开，透透气——');
        S.shake(300, 2);
        await S.say('娜', '别开！', { style: 'big' });
        await S.narr('她的声音一下子尖了起来，又一下子软了下去。');
        await S.say('娜', ['……对不起。', '白天太亮了，晃得我头疼。你去吧，早点回来。']);
        await S.think('娜以前最爱晒太阳。\n每天早上，她都要抱着簸箕，坐在梯子口晒米。');
        await clue(S, 'day');
        return;
      }
      const L = ['早点回来。', '小丹睡了。别吵醒他。', '你去宾婶家了？……她跟你说什么了？', '麦，你回来了，真好。'];
      return S.say('娜', L[(S.f._nl = ((S.f._nl ?? -1) + 1) % L.length)]);
    }
    if (ph === 'lime') return S.say('娜', '青柠在屋底下的柱子上挂着。快去呀。');
    await S.say('娜', '嗯？');
  }

  async function winOn(S) {
    if (S.f.ph === 'days' || S.f.ph === 'dusk') {
      await S.narr('你的手刚碰到百叶窗——');
      return S.say('娜', '别开。', { style: 'whisper' });
    }
    await S.narr('窗外是运河。对岸的灯，一盏一盏地灭了。');
  }

  async function mirrorOn(S) {
    if (S.f.ph !== 'days' || S.f.c_mirror) return S.narr('娜的小铜镜。镜子里的你黑了，瘦了，胡子拉碴的。');
    await S.narr('娜的小铜镜，立在木台上。你凑过去，看见了自己的脸——黑了，瘦了，胡子拉碴的。');
    await S.narr('镜子里，你身后的屋角，是空的。');
    S.sfx('heart');
    await S.think('……空的？\n可娜明明就坐在那个角落里。我刚才还听见她在哼歌。');
    await S.narr('你盯着镜子，一眨也不敢眨。\n镜子的最边上，慢慢地，探进来半张脸。灰白的，湿漉漉的，头发贴在脸上——');
    S.ent('mirror').face = true;
    await S.scare('face', { face: 'nakm', dur: 1.1 });
    S.ent('mirror').face = null;
    S.turn(2);
    await S.narr('你猛地回过头。\n娜坐在角落里，好好的，冲你笑了一下。');
    S.face('nak_h', 'pl');
    await S.say('娜', '怎么了？脸色这么白。');
    await clue(S, 'mirror');
  }

  async function cradleOn(S) {
    const ph = S.f.ph;
    if (ph === 'home') return S.narr('空着的摇篮。\n娜说，孩子离不开她，从生下来就一直让她抱着。');
    if (ph === 'days' && !S.f.c_baby) {
      await S.narr('小丹躺在摇篮里，裹得严严实实的。\n你伸出手指，碰了碰他的小脸——');
      S.sfx('heart');
      await S.narr('冰的。\n像运河底下的石头一样冰。');
      await S.narr('他没有哭。从你回来到现在，他一声也没有哭过。\n摇篮自己轻轻地晃着。屋里一丝风也没有。');
      S.face('nak_h', 'pl');
      await S.say('娜', '别碰他。他睡着了。', { style: 'whisper' });
      await clue(S, 'baby');
      return;
    }
    await S.narr('摇篮一直在晃，一直在晃。\n小丹睡得很沉。');
  }

  const HINT = { baby: '你家的摇篮', mirror: '你家的镜子', day: '娜为什么白天不肯出门', neigh: '宾婶家', warn: '阿添的船', record: '寺里的亡者簿', grave: '寺后面的乱葬岗' };
  async function puuTalk(S) {
    S.face('puu', 'pl');
    const ph = S.f.ph || 'arrive';
    if (ph === 'arrive') return S.say('普婆婆', '快回家吧，孩子。天黑以前。');
    if (ph === 'flee') return S.say('普婆婆', '往寺里跑！别回头！\n——千万别回头！');
    if (ph !== 'days') return S.say('普婆婆', '天黑了。快回家……\n不。我也不知道该跟你说哪一句了。');
    if (S.once('puu1')) {
      await S.say('普婆婆', ['阿添的事……你都看见了。', '我这把年纪，什么都见过了，可我什么都不说。说了的人，就是阿添那个样子。']);
      await S.say('普婆婆', ['我只给你讲个老故事。', '老人们说，女人怀着孩子死了，孩子没生下来，娘儿俩囫囵着一起走的——叫「tai thong klom」，腹中带子。', '这样的人不能烧，得当天就埋了，请师父念三夜的经。', '那是所有的鬼里，最凶的。不是因为她恨。是因为她爱。爱得越深，越走不了。']);
    }
    if (S.f.needWat) return S.say('普婆婆', ['你心里明白，就是不肯信。', '那就去寺里吧。住持的亡者簿，寺后的乱葬岗……自己去看。']);
    const miss = Object.keys(HINT).filter(k => !S.f['c_' + k]);
    await S.say('普婆婆', ['你要是想知道，就自己去看。', '看看' + miss.slice(0, 3).map(k => HINT[k]).join('、') + '……']);
  }

  async function phinTalk(S) {
    S.face('phin_n', 'pl');
    if (S.f.ph === 'days' && !S.f.c_neigh) {
      await S.say('宾婶', ['你、你来干什么……', '……把门关上。快。']);
      await S.say('宾婶', ['阿添昨天晚上跟我说，他要去告诉你。我拦着他，我说你疯了，你不要命了。', '他说：「麦是跟我光着屁股一起在运河里长大的兄弟，我不能眼睁睁看着他……」', '今天早上，他就漂在运河里了。']);
      const r = await S.ask('宾婶捂着嘴，眼泪一直往下掉。', ['「告诉我。娜到底怎么了？」', '「……对不起。」'], '麦');
      if (r === 0) { S.amb('none'); S.bubble('phin_n', '!', 800); await S.say('宾婶', ['我不能说！', '我还有阿通！你走吧，求求你了，你走吧！']); S.amb('room'); }
      else await S.say('宾婶', '……不怪你。谁也不怪。');
      await S.narr('她犹豫了很久，压低了声音。');
      await S.say('宾婶', ['我只跟你说一句。', '雨季那天晚上，接生婆是哭着从你家跑出来的。后来，是我给娜守的灵，整整守了三夜。', '……去寺里吧。去问住持。出家人不打诳语。'], { style: 'whisper' });
      await clue(S, 'neigh');
      return;
    }
    await S.say('宾婶', S.f.ph === 'days' ? '去寺里吧，麦。……别再来我家了。' : '……走吧。');
  }
  async function tongTalk(S) {
    S.face('tong_n', 'pl');
    if (S.once('tong1')) return S.say('阿通', ['麦叔……', '娜姨晚上会到我们家窗户底下来，唱歌。唱的是哄小丹睡觉的那首。', '妈妈捂着我的嘴，不让我出声。……可是娜姨唱得真好听。']);
    await S.say('阿通', '我爸爸说，等他打到大鱼，就给小丹做一只木头小船。');
  }

  async function abbotTalk(S) {
    S.face('abbot', 'pl');
    if (S.once('ab1')) {
      await S.say('住持', ['麦，你回来了。', '这一路，辛苦了。']);
      await S.say('麦', ['师父，我想问您一件事。', '村里的人都躲着我。阿添死了。宾婶不肯说话。……我的娜，她到底怎么了？']);
      await S.narr('住持看了你很久。');
      await S.say('住持', ['麦，出家人不打诳语。', '所以你问的这件事，我不能跟你说「她很好」。', '可有些事，旁人说一百遍，也不如你自己看一眼。']);
      await S.say('住持', ['亡者簿就在门口的矮桌上。寺后面，是乱葬岗。', '藏经阁里，还有前人留下的贝叶。', '……看完了，你若还想见她，就回去吧。她等你，等得很辛苦。']);
      return;
    }
    if ((S.f.cn || 0) >= NEED) return S.say('住持', ['你都看见了。', '回去吧。若是怕了，就到寺里来。佛前有圣线，有灯。']);
    await S.say('住持', ['看过了吗？亡者簿，乱葬岗，藏经阁。', '不急。真相不会跑。']);
  }
  async function abbotNight(S) {
    S.face('abbot_s', 'pl');
    if (S.f.ph === 'thread') { await S.say('住持', '快！照贝叶上写的绕！'); if (S.f.miss) await S.say('住持', threadHint(S, (S.f.thr || []).length ? 'dir' : 'start')); return; }
    await S.say('住持', '……');
  }

  async function toWat(S) {
    const ph = S.f.ph || 'arrive';
    if (ph === 'arrive' || ph === 'home') { await S.narr('东边是玛哈布寺。\n……先回家吧，娜在等你。'); return S.walk('pl', 'l', 5); }
    if (ph === 'lime') { await S.narr('娜还在家里等着青柠。'); return S.walk('pl', 'l', 5); }
    if (ph === 'flee') { S.stop('nak_c'); S.hide('nak_c'); }
    await S.go('wat', 11, 16, 3);
  }
  async function leaveWat(S) {
    const ph = S.f.ph;
    if (ph === 'thread' || ph === 'thread0' || ph === 'final0' || ph === 'final') { await S.narr('她就在外面！'); return S.walk('pl', 'u', 5); }
    await S.go('canal', 38, 9, 1);
  }

  /* —— 凑齐五处违和：天黑了 —— */
  async function dusk(S) {
    S.f.ph = 'dusk';
    await S.think(['孩子不哭。镜子里没有她。邻居看见我就关门。阿添死了。', '亡者簿上写着她的名字。寺后面，有她的坟。', '……可那是娜。是我的娜。', '我要回家。我要亲眼看清楚。']);
    S.dark(.84, 'canal'); S.dark(.62, 'house'); S.dark(.72, 'wat');
    const h = S.ent('hNak'); h.lit = true; h.light = HOUSE_LIGHT;
    for (const id of ['v1', 'v2']) S.hide(id);
    bg(S.bells(3, 700));
    await S.narr('不知不觉，太阳已经掉进运河里了。\n寺里的钟，一声，一声。');
    S.goal('天黑了。回家去（沿运河往西）');
    if (S.map === 'house') await limeStart(S);
    else if (S.map === 'canal' && S.once('duskOut')) await duskVillage(S);
  }

  /* 黄昏的村子：家家熄灯、抽梯子，只有你家亮着 */
  async function duskVillage(S) {
    S.ent('h4').lit = false;
    S.focus(5, 4);
    await S.narr('村子里的灯，一盏一盏地灭了。\n各家各户的梯子都抽了上去，门闩落下的声音，从运河这头响到那头。');
    await S.narr('只有你家的窗户还亮着。\n窗户里，一个人影抱着孩子，慢慢地晃。');
    S.focus(null);
  }

  async function limeStart(S) {
    UND.warned = false; UND.mv = 0;
    S.f.ph = 'lime';
    S.hide('nak_h'); S.place('nak_k', 3, 4, 1);
    S.ent('mortar').s.pound = true; const c = S.ent('cradle'); c.s.baby = true;
    S.ent('lamp').off = false; S.ent('stove').off = false; S.dark(.62);
    for (const w of ['win1', 'win2']) { const e = S.ent(w); e.open = false; e.lit = false; }
    S.sfx('thud');
    await S.narr('屋里点上了灯。娜跪坐在炭炉边，一下一下地舂着辣椒。\n「咚、咚、咚。」\n摇篮里，小丹睡着。摇篮自己轻轻地晃。');
    S.face('nak_k', 'pl');
    await S.say('娜', ['回来啦？', '今天晚上给你做青柠辣椒酱，配烤鱼。……哎呀，青柠用完了。', '屋底下那根柱子上挂着一篮，你去帮我摘两个上来，好不好？']);
    S.face('nak_k', 1);
    await S.think('……屋底下。');
    S.goal('下梯子，钻到高脚屋底下，从柱子上的篮子里摘青柠');
    S.cp('lime');
  }

  async function basketOn(S) {
    if (S.f.ph === 'lime') return limeScene(S);
    await S.narr('柱子上挂着一篮青柠，又小又青。');
  }

  async function limeScene(S) {
    S.f.ph = 'limeS';
    S.give('lime');
    S.pos(9, 3, 1);
    await S.narr('你从篮子里摘了两个青柠，攥在手心里。\n头顶上，「咚、咚、咚」，娜还在舂辣椒。');
    S.amb('none'); await S.wait(500);
    await S.narr('「咚」——\n声音停了。');
    await S.wait(500);
    const L = S.ent('limeF'); L.s.drop = -40; S.place('limeF', 3, 3);
    S.focus(5, 3);
    for (let d = -40; d < 0; d += 5) { L.s.drop = d; await S.wait(28); }
    L.s.drop = 0; S.sfx('thud'); await S.wait(60); L.s.drop = -3; await S.wait(80); L.s.drop = 0;
    await S.walk('limeF', [7, 3], 2.4);
    await S.narr('一个青柠从地板缝里掉了下来，在地上弹了一下，骨碌碌地朝你滚过来，停在离你两步远的地方。');
    await S.wait(400);
    await S.narr('头顶上，有人轻轻地挪了挪身子。\n地板缝里漏下来的灯光，被什么东西挡住了。');
    const A = S.ent('arm'); A.s.v = 0; A.s.h = 0; A.s.grab = false; A.hidden = false;
    S.sfx('heart');
    for (let v = 0; v <= 48; v += 3) { A.s.v = v; await S.wait(55); }
    await S.wait(300);
    await S.narr('一只手。\n一只灰白的手，从地板缝里垂了下来。手臂细得像一截芦苇，一节，又一节，一直垂到了地上。');
    S.sfx('heart');
    for (let h = 0; h <= 56; h += 2) { A.s.h = h; await S.wait(45); }
    await S.narr('然后，它贴着地面，朝你这边伸了过来。\n越伸越长。越伸越长。');
    for (let h = 56; h <= 64; h++) { A.s.h = h; await S.wait(70); }
    S.shake(400, 1);
    await S.narr('手指在离你脚尖不到一拃的地方停住了。指甲又长又黑。\n它在地上摸索着，一下，一下……摸到了那个青柠。');
    A.s.grab = true; S.hide('limeF');
    S.fx('red'); S.sfx('sting');
    for (let h = 64; h >= 0; h -= 4) { A.s.h = h; await S.wait(22); }
    for (let v = 48; v >= 0; v -= 6) { A.s.v = v; await S.wait(22); }
    A.hidden = true; A.s.grab = false;
    await S.wait(600);
    S.sfx('thud'); await S.wait(350); S.sfx('thud'); await S.wait(350); S.sfx('thud');
    await S.narr('「咚、咚、咚。」\n头顶上，舂辣椒的声音又响了起来。好像什么也没有发生过。');
    S.focus(null);
    await S.say('娜（头顶上）', ['麦？你在下面吗？', '青柠找到了吗？……刚才我这儿也掉下去一个，不碍事，我自己捡回来了。', '快上来吧，饭要凉了。']);
    await S.think(['……', '她知道。', '她知道我在下面。她知道我看见了。']);
    S.amb('night');
    S.f.ph = 'seen';
    S.goal('爬梯子回到屋里。……装作什么也没看见');
    S.cp('seen');
  }

  async function dinner(S) {
    S.f.ph = 'dinner';
    S.hide('nak_k'); const n = S.ent('nak_h'); n.spr = '@nak2'; S.place('nak_h', 5, 4, 0);
    S.ent('mortar').s.pound = false;
    S.pos(5, 6, 3);
    await S.narr('席子上摆好了饭：糯米饭，烤鱼，一小碗刚舂好的青柠辣椒酱。\n娜坐在你对面，给你盛饭。\n她的手臂，和平常一样长。');
    await S.say('娜', '吃吧。你最爱吃的。');
    let asked = 0;
    for (; ;) {
      const opts = ['（低下头吃饭。什么也没看见。）', '「我……我下去解个手。」'];
      if (asked < 2) opts.splice(1, 0, asked ? '「娜……你看着我。」' : '「娜，你是不是……已经……」');
      const r = await S.vote('娜往你碗里夹了一块鱼。', opts, '麦');
      if (!r.agree) {
        await S.narr('你张了张嘴，又闭上了。\n心里有两个声音在吵——一个要你「' + opts[r.h].replace(/[（）「」]/g, '') + '」，一个要你「' + opts[r.g].replace(/[（）「」]/g, '') + '」。');
        await S.say('娜', '……怎么不吃了？', { style: 'whisper' });
      }
      const pick = opts[r.v];
      if (r.v === 0) return badStay(S);
      if (pick.includes('解个手')) return fleeStart(S);
      if (!asked) { asked = 1; S.bubble('nak_h', '…', 1200); await S.say('娜', ['嘘。', '……孩子刚睡着。'], { style: 'whisper' }); await S.narr('她没有抬头。灯芯「噼」地爆了一下。'); continue; }
      /* 第二次追问：她抬起了头 */
      asked = 2;
      S.ent('lamp').off = true; S.dark(.92); S.sfx('glass');
      await S.wait(500);
      n.spr = '@nakg'; S.face('nak_h', 0);
      await S.scare('face', { spr: '@nakg', sfx: 'sting', dur: .8 });
      await S.say('娜', '麦。', { style: 'big' });
      await S.say('娜', '吃饭。', { style: 'big' });
      n.spr = '@nak2'; S.ent('lamp').off = false; S.dark(.62);
      await S.narr('油灯又亮了。娜低着头，好好地坐在你对面，往你碗里夹鱼。\n你的筷子在抖。你不敢再问了。');
    }
  }

  async function badStay(S) {
    await S.narr('你低下头，扒了一口饭。\n辣椒酱很辣，辣得你眼泪一直往下掉。');
    await S.say('娜', '好吃吗？');
    await S.say('麦', '……好吃。');
    await S.say('娜', ['那就好。', '以后我天天给你做。', '我们一家人，再也不分开了。']);
    await S.fade(1, 1500);
    lullaby(S, 1.4, .05);
    return S.end({ bad: true, id: 'stay', title: '一家人，再也不分开', text: '日子一天一天地过去。麦再也没有出过门。\n\n村里人说，运河边那栋高脚屋，每天傍晚都亮着灯，能听见女人哼摇篮曲的声音。\n后来，有人壮着胆子爬上去看过一眼。\n屋里收拾得干干净净，饭菜摆在席子上。\n一家三口，整整齐齐地坐着。' });
  }

  async function fleeStart(S) {
    S.bubble('nak_h', '…', 1500);
    await S.wait(400);
    await S.say('娜', '……早点回来。', { style: 'whisper' });
    await S.say('娜', '外面黑。别走远了。');
    await S.narr('她没有抬头。你看见她握着饭勺的手，指节白得像河底的石头。\n你站起来，一步，一步，走到梯子口。');
    S.f.ph = 'flee'; S.dark(.9, 'canal'); S.dark(.8, 'wat');
    await S.go('canal', 6, 4, 0);
  }

  async function fleeOut(S) {
    S.amb('night');
    await S.narr('你的脚一沾地，就跑了起来。');
    await S.say('娜（屋里）', '……麦？', { style: 'whisper' });
    await S.think('寺……玛哈布寺！住持说过，佛前有圣线，有灯！');
    S.goal('跑！沿着运河往东，逃进玛哈布寺');
    S.cp('flee'); resetNakC(S);
  }

  /* —— 寺里：绕圣线 —— */
  async function threadIntro(S) {
    S.f.ph = 'thread0';
    S.hide('abbot'); S.hide('novice'); S.show('abbot_s'); S.show('novice_s');
    S.face('novice_s', 0);
    S.pos(11, 14, 3);
    await S.narr('你撞进寺门，扑倒在沙地上。\n佛亭四角的灯笼全亮着。住持就站在佛像前，好像早就在等你。');
    S.face('abbot_s', 'pl');
    await S.say('住持', ['麦，到这边来！到佛前来！', '她跟来了。界石能拦她一阵，拦不了多久。']);
    const n = S.ent('nak_w'); S.place('nak_w', 12, 17, 3); n.alpha = .85; n.hidden = false; S.sfx('cry');
    S.focus(12, 15);
    await S.narr('寺门外，她停住了。\n她抱着孩子站在界石外面，一步也迈不进来，只是看着你。');
    S.focus(null);
    S.give('sai');
    await S.say('住持', ['拿着，这是圣线。我念经，经声能压住她一阵。', '怎么绕，贝叶上写着——前人留下的规矩，一步也不能错。']);
    if (!S.f.palm) {
      S.face('novice_s', 'pl');
      await S.say('小沙弥', '施主，贝叶！我从藏经阁拿来了！');
      await S.note('palm'); S.f.palm = true; S.ent('hotrai').read = true;
    } else await S.think('藏经阁的贝叶……「自佛陀右手一侧之柱起，右绕而行」。');
    S.f.ph = 'thread'; S.f._ch = 1;
    S.goal('照贝叶上的规矩，用圣线绕佛亭四柱，再回佛前系在佛手上');
    resetThread(S);
    S.cp('thread');
  }

  /* 绕错的次数越多，住持说得越直白 */
  function threadHint(S, why) {
    const m = S.f.miss || 0;
    if (m >= 2) return ['从西北角那根起！', '西北，东北，东南，西南——再回佛前！'];
    if (why === 'dir') return m ? '右绕——像太阳走的方向。从天上往下看，是顺着转的！' : '反了！右绕，像太阳走的方向！';
    return m ? '是佛陀的右手！他面朝着你——他的右手，在你的左边！' : '是佛陀的右手那一边！你看他朝着哪儿坐！';
  }

  const ORD = ['nw', 'ne', 'se', 'sw'];
  async function postOn(S, k) {
    if (S.f.ph !== 'thread') return S.narr(S.ent('p_' + k).s.tied ? '柱子上缠着三圈白线。' : '佛亭的柱子刷得雪白，柱头是一朵金色的莲花。');
    const thr = S.f.thr || (S.f.thr = []);
    if (thr.includes(k)) return S.narr('这根柱子已经绕好了。');
    if (k === ORD[thr.length]) {
      thr.push(k); S.ent('p_' + k).s.tied = true; S.ent('ring').s.n = thr.length; S.sfx('tear');
      const left = 4 - thr.length;
      await S.narr(left ? `你把白线在柱子上绕了三圈，拉紧。（还剩 ${left} 根）` : '最后一根。白线在佛亭四周围成了一圈。');
      S.goal(left ? '继续右绕：下一根柱子' : '回到佛前，把线头系在佛像的手上');
      return;
    }
    const first = thr.length === 0;
    S.f.thr = []; for (const q of ORD) S.ent('p_' + q).s.tied = false; S.ent('ring').s.n = 0;
    S.sfx('cut'); S.shake(250, 1);
    await S.narr('白线「嘣」地一声断了，散了一地。');
    /* 绕错有代价：经声一乱，她就往里挪一步 */
    const n = S.ent('nak_w');
    if (W.timer) W.timer.left = Math.max(.5, W.timer.left - THREAD_PEN);
    if (n && !n.chase) { const ny = Math.max(13, Math.round(n.py / TS) - 1); S.place('nak_w', 12, ny, 3); S.sfx('cry'); S.bubble('nak_w', '…', 1000); await S.narr('住持的经声一乱。寺门那边，她往里挪了一步。'); }
    await S.say('住持（佛前）', threadHint(S, first ? 'start' : 'dir'));
    S.f.miss = (S.f.miss || 0) + 1;
    S.goal('重新绕：从佛陀右手那一侧的柱子起，右绕四柱');
  }

  async function buddhaOn(S) {
    const ph = S.f.ph;
    if (ph === 'thread') { if ((S.f.thr || []).length < 4) return S.narr('线还没有绕完。'); return threadDone(S); }
    if (ph === 'final' || ph === 'final0') return S.narr('佛像垂下的右手上，系着白线。');
    await S.narr('佛像低垂着眼睛，右手垂下来，指尖轻轻碰着地面。\n这是降魔印——佛陀在菩提树下成道的那一夜，请大地为他作证。');
  }

  async function threadDone(S) {
    S.f.ph = 'final0';
    S.stop('nak_w'); S.clearTimer(); S.take('sai');
    const r = S.ent('ring'); r.s.done = true; S.sfx('chime');
    S.ent('buddha').lit = true;
    await S.narr('你把线头系在佛像垂下的右手上。\n白线在灯下亮了起来，淡淡的，像一圈月光。');
    S.pos(11, 9, 0);
    const N = S.ent('nak_w');
    S.place('nak_w', 11, 13, 3); N.alpha = 1;
    S.focus(11, 11);
    S.sfx('scream'); S.shake(500, 2);
    await S.narr('她追到了白线跟前——像碰到了火，猛地缩了回去。');
    await S.say('娜', '麦……', { style: 'whisper' });
    await S.say('娜', '你为什么要跑？');
    await S.say('麦', ['娜……你已经死了。', '你和孩子……雨季那天晚上，就已经……']);
    S.bubble('nak_w', '…', 2000);
    await S.say('娜', '我知道。');
    await S.narr('她低下头，看着怀里的孩子。');
    await S.say('娜', ['那天晚上，雨下得好大。接生婆来不及。我疼了一整夜，一直喊你的名字。', '后来就不疼了。我抱着小丹，坐在码头上等。一条船，又一条船。', '我想，你回来的时候，家里总得有人等你。', '……我答应过你的。']);
    const o = ['「对不起。我回来晚了。」']; if (S.f.letter) o.unshift('「你在信里说，码头风大，要在家里等我……你等到了。」');
    const k = await S.ask('白线外面，她抱着孩子，等你说话。', o, '麦');
    if (S.f.letter && k === 0) {
      await S.say('娜', ['……那封信，你看到了？', '小师父写字可慢了。我说「码头风大」，他问我，为什么不能在码头等。我说，因为麦怕冷。']);
      await S.narr('她笑了一下。那个笑，和你走的那天一模一样。');
    } else await S.say('娜', '不晚。回来了，就不晚。');
    /* 驱鬼师来了 */
    S.place('vw1', 10, 15, 3); S.place('mophi', 11, 15, 3); S.place('cjar', 12, 15); S.place('phin_w', 13, 15, 3);
    S.focus(11, 13);
    S.sfx('step'); S.sfx('knock');
    await S.narr('寺门口亮起了火把。\n村里的男人们举着火把冲了进来，宾婶也在里面。走在最前面的，是一个缠着红头巾、胸口刺满符文的驱鬼师，手里捧着一只陶罐。');
    await S.say('驱鬼师', ['就是她！「腹中带子」的凶鬼，害死了阿添！', '住持，让开！我把她收进罐子里，封上符，沉到运河最深的地方去——保管她再也害不了人！']);
    S.face('nak_w', 0); S.bubble('nak_w', '!', 900);
    await S.narr('娜把孩子搂得更紧了。她没有逃，只是回过头来，看着你。');
    S.face('abbot_s', 'pl');
    await S.say('住持', ['麦，你是她的丈夫。', '这件事，该由你来说。']);
    S.f.ph = 'final';
    S.cp('final');
    await finalChoice(S);
  }

  async function finalChoice(S) {
    S.focus(11, 13);
    const q = '驱鬼师举起陶罐，等你开口。娜在白线外面看着你。';
    const opts = ['「不。让她安心地走。」', '（别过脸去）「……收了她吧。」', '（跨出白线，去抱她）'];
    let r = await S.vote(q, opts, '麦');
    if (!r.agree) {
      await S.narr('你的嘴说了一句，你的脚却往另一边挪。\n你自己也不知道，自己到底想要什么。');
      S.face('abbot_s', 'pl');
      await S.say('住持', ['麦，你心里还没有定。', '定下来再说。她等得起——她已经等了很久了。']);
      r = await S.vote(q, opts, '麦');
    }
    if (r.v === 1) return badJar(S);
    if (r.v === 2) return badCross(S);
    return goodEnd(S);
  }

  async function badCross(S) {
    await S.narr('你抬起脚，跨过了白线。');
    S.face('abbot_s', 'pl');
    await S.say('住持', '麦！回来！', { style: 'big' });
    S.pos(11, 12, 0); S.face('nak_w', 3);
    await S.narr('白线外面很冷。冷得像雨季的运河。\n娜愣了一下，然后笑了。她把孩子递给你。');
    await S.say('娜', ['你抱抱他。', '他一直在等爸爸抱。']);
    await S.narr('孩子很轻，轻得像一捧水。\n襁褓是湿的。');
    S.amb('none'); lullaby(S, 1.3, .06);
    await S.say('娜', '我们回家。', { style: 'whisper' });
    S.sfx('scream'); await S.scare('face', { spr: '@nakg', sfx: 'heart', dur: .8 });
    await S.fade(1, 1500);
    return S.end({ bad: true, id: 'cross', title: '跨出白线', text: '第二天一早，小沙弥在码头边找到了麦。\n他坐在水边，怀里抱着一团湿透的旧襁褓，脸上带着笑，已经没有气了。\n\n后来，运河边那栋高脚屋又亮起了灯。\n村里人说，傍晚路过的时候，能看见一个男人坐在梯子口，等着谁回家。' });
  }

  async function goodEnd(S) {
    await S.say('麦', ['不。', '她没有害过我。她只是……在等我。']);
    await S.say('驱鬼师', '你疯了？阿添是怎么死的，你忘了？');
    S.face('phin_w', 'pl');
    await S.say('宾婶', ['……阿添要是在这儿，他也会这么说的。', '他说过，麦和娜，是这条运河上最般配的一对。']);
    await S.narr('驱鬼师看看宾婶，又看看住持，慢慢地放下了陶罐。');
    S.face('abbot_s', 'pl');
    await S.say('住持', ['善哉。', '麦，你若真心为她，就为她和孩子做一场功德。把功德回向给她们，让她们带着上路。']);
    S.give('kendi'); S.show('bowl');
    await S.narr('住持在佛前盘腿坐下，小沙弥跟着坐下。整座寺静了下来，只有灯笼里的火苗轻轻地跳。');
    S.sfx('chant');
    await S.say('住持', 'Yathā vārivahā pūrā\nparipūrenti sāgaraṃ……', { style: 'whisper' });
    S.sfx('chant');
    await S.narr('「正如满溢的河流，终将注满大海——\n愿此功德，流到你们身边。」');
    S.take('kendi'); S.ent('bowl').full = true; S.sfx('water');
    await S.narr('你跪在白线里面，把铜壶里的清水，一点一点地倒进碗里——滴水回向。\n水声很轻，很长，像运河在夜里流。');
    const N = S.ent('nak_w'); N.spr = '@nak'; N.light = { r: 3, col: 'rgba(255,220,170,.24)' };
    S.fx('flash'); S.sfx('chime'); S.face('nak_w', 3);
    await S.narr('白线外面，娜的样子变了。\n湿透的头发干了，灰白的脸上有了血色。怀里的小丹动了动，伸出一只小手。');
    S.sfx('giggle');
    await S.say('娜', ['……原来是这样的。', '不冷了。']);
    await S.say('娜', ['小丹，看，那是爸爸。', '……跟爸爸说再见。']);
    await S.narr('她把孩子抱在臂弯里，朝佛像，朝住持，最后朝你，双手合十，深深地拜了下去。');
    await S.say('娜', '麦，下辈子……我还做你的妻子。');
    const r = await S.ask('她看着你，就像那天在码头上一样。', ['「下辈子，换我在码头等你。」', '「……好。」'], '麦');
    if (r === 0) await S.say('娜', '码头风大。……你别等太久。');
    else await S.say('娜', '嗯。');
    await S.alpha('nak_w', 0, 2600);
    await S.narr('白线外面，什么也没有了。\n只有一缕茉莉花的香味，在夜风里飘了很久。');
    S.dark(.3); S.amb('river');
    await S.bells(3, 800);
    await S.fade(1, 1400);
    const wine = S.f.wine ? '\n\n出寺以后，他在罗望子树下挖出了那坛酒。\n坛子边上，多埋了一只小小的银脚镯——是娜留给小丹满月戴的。\n他把酒倒在寺后那根竹竿前面，一半给娜，一半给小丹。' : '\n\n出寺那天，他去了一趟码头。\n运河上有风。他站了很久。';
    await S.card('', '那年雨季', '那年雨安居，麦在玛哈布寺剃度出家，\n为娜和小丹念了三个月的经。' + wine);
    await S.end({ id: 'farewell', title: '第九夜　完', text: '如今，曼谷帕卡农的玛哈布寺里供着「娜娘」的神龛。\n人们给她送去鲜艳的衣裙、胭脂和婴儿的玩具。\n\n据说，快要被征去当兵的年轻人，也会去那里求她——\n她最懂得，等一个人回家有多难。' });
  }

  async function badJar(S) {
    await S.narr('你别过了脸。');
    await S.say('麦', '……收了她吧。');
    S.amb('none');
    await S.say('娜', '……麦？', { style: 'whisper' });
    await S.narr('驱鬼师念起了咒。火把一下子全暗了下去。');
    S.sfx('chant'); S.fx('glitch'); S.shake(800, 2);
    await S.alpha('nak_w', .2, 1200);
    S.sfx('scream');
    S.ent('cjar').locked = true; S.hide('nak_w');
    await S.narr('陶罐的盖子「啪」地扣上了。驱鬼师用写满符咒的白布把罐口扎紧。\n罐子里传出一声很轻、很轻的——\n「麦。」');
    await S.fade(1, 1500);
    lullaby(S, 1.6, .04);
    return S.end({ bad: true, id: 'jar', title: '罐子沉进了运河', text: '那天夜里，人们把陶罐沉进了帕卡农运河最深的地方。\n麦一直没有回头看。\n\n很多年以后，一个渔夫的网捞起过一只破了口的陶罐。\n那天晚上，运河边又有人听见了摇篮曲。\n\n——睡吧，睡吧，我的心肝。妈妈在这儿，守着你，守到天亮。' });
  }
})();
