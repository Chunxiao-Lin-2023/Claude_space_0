/* ================= 第八夜 · 贝尔女巫 ================= */
(() => {
  /* ---------------- 常量与小工具 ---------------- */
  const HPMAX = 3;
  const FIRE = { r: 5, col: 'rgba(255,140,60,.26)', flick: true };
  const FIRE_LOW = { r: 2.6, col: 'rgba(255,110,40,.22)', flick: true };
  const FIRE_BLUE = { r: 5, col: 'rgba(90,130,255,.32)', flick: true };
  const WISP = { r: 4.2, col: 'rgba(90,140,255,.24)', flick: true };
  const ANSWER = '9174';

  const TRAIL = [[4, 6], [4, 8], [7, 9], [9, 10], [10, 12], [11, 14]];   // 逃出山洞时蓝火落下的光点

  /* 它说话：默认低语 */
  const K = (S, t, o) => S.say('它', t, Object.assign({ style: 'whisper' }, o || {}));
  /* 它唱歌：又高又甜的合成旋律（双方都听得到）。[音高(半音, 0=C5), 拍数] */
  const TUNES = {
    title: [[-5, 1], [0, 1], [0, 1], [2, 1], [4, 2], [2, 1], [0, 1], [4, 1], [7, 3]],            // 当我能读清我的名分
    stanne: [[-5, 1], [-8, 1], [-3, 1], [-5, 1], [0, 1], [0, 1], [-1, 1], [0, 3]],                // 千古保障（St. Anne 开头）
    martyr: [[-3, 1], [0, 1], [-1, 1], [-3, 1], [-4, 1], [-3, 2], [-8, 1], [-3, 3]],              // 哀哉我主流血（小调）
    brandy: [[0, .5], [4, .5], [7, .5], [4, .5], [7, .5], [12, 1], [11, .5], [7, .5], [4, .5], [5, .5], [2, .5], [7, 1.5]]   // 给我摇过来一点白兰地
  };
  function sing(S, name, o = {}) {
    const beat = o.beat || .34, vol = o.vol || .045; let tt = 0;
    for (const [n, b] of TUNES[name]) {
      const f = 523.25 * Math.pow(2, n / 12), d = b * beat;
      S.tone(o.type || 'triangle', f, f * (o.slide || 1.003), d * .95, vol, tt, o.lp || 2600);
      if (!o.drunk) S.tone('sine', f * 2, f * 2, d * .9, vol * .25, tt + .01, 3000);   // 一点泛音，像女孩的假声
      else S.tone('square', f * .5 * (1 + (Math.random() - .5) * .04), f * .49, d * .8, vol * .35, tt, 900);
      tt += d;
    }
    return tt;
  }
  /* 双人时两人一起决定；意见不合时由操作者拍板——它听得见你脑子里的两个声音 */
  async function choose(S, q, opts, who) {
    if (!S.coop) return S.ask(q, opts, who);
    const r = await S.vote(q, opts, who);
    if (!r.agree) { S.sfx('whisper'); await K(S, ['……嘻。你脑子里有两个声音在吵架呢，肯塔基小子。', '一个说「' + opts[r.h].replace(/[「」（）]/g, '') + '」，一个说「' + opts[r.g].replace(/[「」（）]/g, '') + '」。我都听见了。']); }
    return r.v;
  }
  async function knocks(S, n, gap = 300) { for (let i = 0; i < n; i++) { S.sfx('knock'); await S.wait(gap); } }
  async function gnaw(S, n = 6) { for (let i = 0; i < n; i++) { S.sfx('tick'); await S.wait(160 + (i % 3) * 70); } }
  function hpShow(S) { const h = Math.max(0, S.f.hp ?? HPMAX); S.toast('体力 ' + '●'.repeat(h) + '○'.repeat(HPMAX - h)); }
  async function hurt(S, msg) {
    S.f.hp = (S.f.hp ?? HPMAX) - 1;
    S.sfx('thud'); S.shake(450, 3); S.fx('red'); hpShow(S);
    if (msg) await S.narr(msg);
    if (S.f.hp <= 0) {
      await S.die('那双看不见的手，一直没有松开。\n\n天亮的时候，贝尔太太发现壁炉边的铺盖空着，被子叠得整整齐齐，\n像是从来没有人睡过。', '你没能熬过那一夜');
      return true;
    }
    return false;
  }

  /* ---------------- 人物 ---------------- */
  const PEOPLE = {
    me: { key: 'bw-me', skin: '#f0c8a0', hair: '#8a5a2a', hs: 'messy', top: '#6a4a30', top2: '#d8d0b8', bottom: '#3a3a44', shoes: '#2a1a10', hat: 'cap', hatC: '#4a3a2a',
      extra(g, d, fr, G, R) { if (d === 0) { R(4, G.tT + 2, 1, 4, '#5a3c24'); R(11, G.tT + 2, 1, 4, '#5a3c24'); } } },
    bell: { key: 'bw-bell', skin: '#e4bc9c', hair: '#dcdcd4', hs: 'short', top: '#34303c', top2: '#e8e4d8', bottom: '#2a2a30', coat: true, shoes: '#1a1410',
      extra(g, d, fr, G, R) { if (d === 0) { R(4, G.hT + 4, 1, 3, '#dcdcd4'); R(11, G.hT + 4, 1, 3, '#dcdcd4'); R(6, G.hT + 1, 4, 1, '#c8a488'); } else if (d === 1) R(10, G.hT + 4, 1, 3, '#dcdcd4'); } },
    mrs: { key: 'bw-mrs', skin: '#f0cdb0', hair: '#8a7a6a', hs: 'bun', top: '#5a4a6a', top2: '#e8e2d6', bottom: '#5a4a6a', dress: true, apron: '#d8d0c0', shoes: '#2a1a1a',
      extra(g, d, fr, G, R) { R(4, G.hT - 1, 8, 2, '#ece8dc'); if (d === 0) { R(3, G.hT + 1, 1, 3, '#ece8dc'); R(12, G.hT + 1, 1, 3, '#ece8dc'); } } },
    anne: { skin: '#f4d4b8', hair: '#6a4026', hs: 'long', top: '#6a8ab0', top2: '#e8e4dc', bottom: '#6a8ab0', dress: true, shoes: '#3a2a2a' },
    anneS: { key: 'bw-anneS', skin: '#f4d4b8', hair: '#6a4026', hs: 'long', top: '#6a8ab0', top2: '#e8e4dc', bottom: '#6a8ab0', dress: true, shoes: '#3a2a2a',
      extra(g, d, fr, G, R) { if (d === 0) { R(5, G.hT + 5, 2, 2, '#e07a7a'); } } },
    dan: { skin: '#eac4a0', hair: '#3a2a1a', hs: 'short', top: '#4a5a3a', top2: '#e8e0d0', bottom: '#3a3028', shoes: '#1a1410' },
    stone: { key: 'bw-stone', skin: '#e0b898', hair: '#9a9a98', hs: 'short', top: '#1e1c22', top2: '#e8e8e8', bottom: '#1e1c22', coat: true, shoes: '#0e0c0c',
      extra(g, d, fr, G, R) { R(2, G.hT - 1, 12, 1, '#141216'); R(4, G.hT - 3, 8, 3, '#141216'); if (d === 0) R(7, G.tT, 2, 2, '#e8e8e8'); } },
    tom: { skin: '#eec8a4', hair: '#5a3a1e', hs: 'short', top: '#7a5a3a', top2: '#c8b890', bottom: '#4a4038', shoes: '#2a1a10', hat: 'cap', hatC: '#3a2a1a' },
    kate: { skin: '#c8c4cc', hair: '#141018', hs: 'long', cover: true, redEye: true, top: '#1a1620', ghost: true, hat: 'hood', hatC: '#0e0c12' },
    blackdog: { key: 'bw-dogface', skin: '#0e0c10', hair: '#0e0c10', hs: 'bald', top: '#0e0c10', bottom: '#0e0c10', eye: '#ff3030', redEye: true,
      extra(g, d, fr, G, R) { R(4, G.hT - 6, 2, 7, '#0e0c10'); R(10, G.hT - 6, 2, 7, '#0e0c10'); R(5, G.hT - 5, 1, 4, '#3a1a1a'); R(10, G.hT - 5, 1, 4, '#3a1a1a'); if (d === 0) { R(6, G.hT + 6, 4, 1, '#e8e2d6'); R(7, G.hT + 6, 1, 1, '#0e0c10'); } } }
  };

  /* ---------------- 惊吓大头像（32×32） ---------------- */
  const FACES = {
    kate(R, a, t) {   // 凯特：黑兜帽、垂下来的湿黑发、灰白的窄脸、两点红光，嘴在唱歌，越张越圆
      const H = '#0b090e', HD = '#231c2b', HL = '#3a3046', SK = '#cdc8d0', SK2 = '#a29dab', SK3 = '#6e6878';
      R(10, 0, 12, 2, HD); R(6, 2, 20, 3, HD); R(4, 5, 24, 27, HD); R(2, 15, 28, 17, HD);
      R(5, 6, 1, 26, HL); R(26, 6, 1, 26, HL); R(9, 1, 3, 1, HL);
      R(8, 5, 16, 27, H); R(7, 10, 18, 22, H);
      R(12, 7, 8, 2, SK); R(10, 9, 12, 13, SK); R(11, 22, 10, 3, SK); R(12, 25, 8, 2, SK); R(14, 27, 4, 1, SK);
      R(19, 9, 3, 13, SK2); R(18, 22, 3, 3, SK2); R(16, 25, 3, 2, SK2);
      R(10, 7, 3, 21, H); R(13, 7, 2, 6, H); R(20, 7, 2, 18, H); R(16, 7, 2, 3, H); R(12, 13, 1, 9, H);
      R(13, 12, 4, 4, '#1c0c10'); R(18, 12, 3, 4, '#1c0c10');
      if (Math.sin(t * 4) < .95) { R(14, 13, 2, 2, '#ff2a2a'); R(19, 13, 1, 2, '#ff2a2a'); R(14, 13, 1, 1, '#ffb0a0'); }
      R(13, 17, 1, 3, SK3); R(19, 17, 1, 3, SK3); R(16, 16, 1, 2, SK3);
      const o = 1 + Math.round(Math.min(1, a * 1.4) * 4);
      R(14, 21, 5, o, '#1a0408'); R(15, 20, 3, 1, SK3); R(13, 21, 1, Math.max(1, o - 1), SK3); R(19, 21, 1, Math.max(1, o - 1), SK3);
      for (const x of [8, 11, 21, 24]) R(x, 27 + (x % 3), 1, 5, SK2);   // 从黑暗里伸出来的细长手指
    },
    blackdog(R, a, t) {   // 黑狗：比黑暗还黑的大脑袋，兔子一样竖着的长耳朵，红眼，一嘴白牙
      const B = '#070609', B2 = '#17131b', E = '#ff2020';
      R(6, 0, 4, 13, B); R(22, 0, 4, 13, B); R(7, 2, 2, 9, '#40141a'); R(23, 2, 2, 9, '#40141a');
      R(6, 9, 20, 3, B); R(4, 12, 24, 12, B); R(2, 15, 28, 8, B);
      for (let i = 0; i < 9; i++) R(2 + i * 3, 22 + (i % 2) * 2, 2, 3, B);
      R(9, 17, 14, 11, B2); R(13, 17, 6, 2, '#2c2430'); R(15, 18, 2, 1, '#000');
      const e = 2 + Math.round(a * 2);
      R(8, 14, 5, e, E); R(19, 14, 5, e, E); R(9, 14, 1, 1, '#ffd8c8'); R(20, 14, 1, 1, '#ffd8c8');
      const o = 2 + Math.round(Math.min(1, a * 1.5) * 5);
      R(10, 23, 12, o, '#3a0508');
      for (let i = 0; i < 6; i++) { R(10 + i * 2, 23, 1, 2 + (i % 2), '#ece6d8'); R(10 + i * 2 + 1, 21 + o, 1, 2, '#d8d0bc'); }
      if (Math.sin(t * 30) > 0) R(12, 23 + o, 1, 3, '#c8d0dc');   // 口水
    }
  };

  /* ---------------- 物品 ---------------- */
  const ITEMS = {
    coin: { name: '银币', desc: '娘缝在你外套左边衬里里的一枚西班牙银币。她说，不到要命的时候，不许拿出来。' },
    hymnal: { name: '赞美诗抄本', desc: '斯通兄弟抄的会众诗歌。纸边被翻得起了毛。' },
    lantern: { name: '马灯', desc: '汤姆塞给你的马灯。灯油不多了，火苗老是往一边歪。' },
    vial: { name: '小玻璃瓶', desc: '拇指大的小瓶子，里面的东西黑乎乎的，一晃就冒雾。' },
    pebble: { name: '白石子', desc: '山洞泉眼边捡的一块白石子，被水磨得溜圆，里面有一圈一圈的纹路，跟回声石上的一模一样。\n揣在兜里，老是凉的。' }
  };

  /* ---------------- 笔记 ---------------- */
  const NOTES = {
    log: { title: '斯通兄弟的记录', text: '（麻线订的小本子。开头的字很工整，越往后越潦草。）\n\n1817年夏　老贝尔在玉米地边看见一只狗身兔头的怪东西，开枪没打中。\n同年秋　夜里敲墙、抓门、像老鼠啃床柱。点上灯就停，吹了灯又来。\n1818年　被子夜里被扯下床。小女儿常挨耳光，头发被揪着往上提。\n\n后来是喘气、咂嘴、耳语——然后它开口说话了。会唱赞美诗，会背圣经。有个礼拜天，我和十三里外的弟兄各讲各的道，当晚它把两篇道一字不差地学了出来，连嗓音都一样。\n\n它说自己是什么？\n「一个灵，从前快乐，被人惊扰了。」\n「林子里一座坟里的人，有人把我的一颗牙弄丢了。」（我们找过那座坟，什么也没有。）\n「老凯特——邻村那个老婆子的巫物。」（她只是个孤老太太。从那以后，大家都管它叫凯特。）\n它还带来过「一家人」：黑狗、算术、西波克里菲、耶路撒冷。那夜满屋酒气，吵到天亮。\n\n它对贝尔太太最好，对老贝尔最坏。我问它为什么。它不说。' },
    diary: { title: '安妮的日记页', text: '1820年11月\n\n今天又挨了两下。左边脸，右边脸。\n妈妈拿凉毛巾给我敷。丹尼尔气得端着枪满屋子转——可他朝哪儿开枪呢？\n\n它每天晚上都说同一句话：\n「安妮，别嫁给丹尼尔。求求你，别嫁给他。」\n我问它为什么。它说：「你跟他不会幸福的。」然后它就哭，哭得像个小孩。\n\n一个打我耳光的东西，凭什么替我担心？\n\n可是有一件事我谁也没告诉：\n只有在我说「我要嫁给他」的那些晚上，它才打得最狠。\n\n爸爸的病一天比一天重。他的脸会自己抽，舌头肿得咽不下饭。它在他床边唱歌。\n——上帝啊，让这个冬天快点过去吧。' },
    doctor: { title: '医生的便条', text: '贝尔先生：\n\n面部抽搐，舌头肿胀，吞咽困难。病因未明。\n\n给您留了一瓶药（棕色瓶子，软木塞上缠着红线）。每晚睡前一匙，不可多服。\n放在卧室的药柜里。\n\n若屋里出现别的瓶子、别的药，切不可乱服。\n\n——县里的医生　十二月十日\n\n（便条背面，不知是谁，用铅笔写了一行歪歪扭扭的小字：\n「一匙不够，老头子。」）' },
    hymns: { title: '会众诗歌（斯通兄弟手抄）', text: '红河会堂常唱的几首，号数照会堂墙上的诗歌板。\n\n第12首　奇异恩典\n奇异的恩典，何等甜美，竟救了我这可怜人。\n\n第37首　我岂是十字架的精兵\n我岂是十字架的精兵、羔羊的跟随者？\n\n第58首　当我能读清我的名分\n当我能读清我的名分，在天上有我的华屋，\n我便向一切恐惧告别，擦干我流泪的眼。\n\n第74首　哀哉，我主流血\n哀哉，我主是否流血？我的君王是否受死？\n他是否把神圣的头，献给我这样的虫豸？\n\n第91首　千古保障\n神啊，你是我们千古的帮助、将来的盼望。\n（第五段）光阴好像长河奔流，把它的儿女都带走；\n他们飞去，被人遗忘，如同梦在天亮时消散。\n\n（页边小字：91首第五段，我妻子下葬那天唱的。凯特也爱唱这一段。）' }
  };

  const LEGEND = '贝尔女巫（Bell Witch）是美国田纳西州最有名的鬼怪传说。据说从1817年起，住在红河边亚当斯一带的农场主贝尔一家，开始被一个看不见的东西缠上：先是老贝尔在玉米地边看见一只狗身兔头的怪兽，开枪却什么也没打中；接着夜里有敲墙、抓挠、像老鼠啃床柱的声音，被子被扯下床，孩子们挨看不见的耳光，尤其是家里的小女儿。后来它学会了喘气、咂嘴、耳语，最后能完整地说话——它唱赞美诗，背圣经，据说还能把同一天在两处相隔十几英里的教堂里讲的两篇道一字不差地复述出来。\n\n它对自己的来历说法极多：一个被惊扰的灵；林中一座被挖开的旧坟里的人；邻村一位老妇人的「巫物」（人们于是叫它「凯特」）；它还带来过一个名叫黑狗、算术、西波克里菲、耶路撒冷的「家族」；它还谎称泉边的石头下埋着金子，让贝尔家的儿子们白挖了一场。它对贝尔太太格外温柔，在她生病时从空中给她掉下榛子和葡萄；对老贝尔却极尽折磨——面部抽搐、舌头肿胀、鞋子被扯下脚。它还一再哀求小女儿不要嫁给她的未婚夫，她最终解除了婚约。1820年12月，老贝尔陷入昏睡后去世，家人在药柜里发现一个来历不明的小瓶，「它」宣称是自己喂他喝下的；据说瓶中之物抹在猫舌上，猫当场死去，瓶子扔进火里，冒起一道蓝色的火焰。葬礼上，它高声唱起一支饮酒小调。\n\n传说里，一位后来名满天下的将军也曾带人前来「会会」女巫，马车在平地上莫名卡住，直到林中一个声音放他们走；他带来的「驱巫人」当晚被打得狼狈而逃。1821年，它说自己要离开，七年后再回来——据说1828年它果真回来过，在贝尔家一个儿子床边谈了许多夜，又许诺一百零七年后再来，但那一年什么也没有发生。昔日贝尔家地界内红河边的山洞，后来被称作「贝尔女巫洞」，成了游客的去处，流传着「从洞里带走石头会倒霉」之类的说法。\n\n今天流传的版本大多出自1894年一位当地报人出版的书，其中收录了一份据称由贝尔家的儿子在1840年代写下的回忆，真伪一直有争议；所谓将军来访，也找不到当时的记录。怀疑者提出过种种解释：有人恶作剧（矛头常指向小女儿后来的丈夫、一位教书先生）、腹语、邻里的土地与官司纠纷、乃至投毒。它也影响了后来许多恐怖电影与小说。\n\n（本章中的伊莱、安妮、汤姆、丹尼尔、斯通兄弟，日记、医生便条、斯通兄弟的记录与抄本，赞美诗的号数，山洞中的回声石与谜题、黑狗的追逐、白石子与另外两个结局，以及具体对话，均为游戏虚构；赞美诗词句为十八世纪公版诗歌的自译。）';

  /* ---------------- 自定义精灵 ---------------- */
  const SPRITES = {
    hearth(g, e, t, R) {   // 石砌壁炉（2 格宽），s.low 小火 s.off 熄火 s.blue 蓝火
      box(R, -2, -12, 36, 27, '#5d5650');
      for (let r = 0; r < 5; r++) for (let c = 0; c < 5; c++) R(-1 + c * 7 + (r % 2) * 3, -11 + r * 5, 6, 4, shade('#6e665e', (hash(c, r, 3) - .5) * .25));
      R(-3, -14, 38, 3, '#3a2a1e'); R(-3, -11, 38, 1, '#22180f');
      R(6, -2, 20, 16, '#120a08'); R(8, 12, 16, 2, '#2a1a14');
      R(15, -2, 1, 6, '#2a2a2a'); R(12, 4, 8, 5, '#1c1c1e'); R(13, 5, 6, 1, '#3a3a3c');
      if (e.off) { R(10, 12, 3, 1, '#4a1a0c'); R(17, 12, 2, 1, '#5a2410'); return; }
      const lo = e.low ? .35 : 1, blue = !!e.blue;
      for (let i = 0; i < 5; i++) { const h = Math.max(1, ((3 + (Math.sin(t * 9 + i * 1.7) + 1) * 3) * lo) | 0); R(8 + i * 3, 13 - h, 3, h, blue ? (i % 2 ? '#3a6aff' : '#9ac0ff') : (i % 2 ? '#ff8a2a' : '#ffcf5a')); }
      R(9, 12, 14, 1, '#3a2014');
    },
    pallet(g, e, t, R) {   // 地铺（竖 2 格）；full=有人睡
      R(1, 2, 14, 28, '#7a6a4e'); R(2, 3, 12, 6, '#d8d0bc');
      const q = e.covered ? null : '#7a3a3a';
      if (q) { R(1, 10, 14, 20, q); for (let i = 0; i < 4; i++) R(1, 12 + i * 5, 14, 1, '#9a5a4a'); R(3, 10, 4, 20, '#6a4a6a'); R(9, 10, 3, 20, '#5a6a4a'); }
      if (e.full) { R(5, 4, 6, 5, '#f0c8a0'); R(5, 3, 6, 2, '#8a5a2a'); }
    },
    bellbed(g, e, t, R) {   // 竖床 2 格，full=有人躺着；s.hair 发色
      const c = e.col || '#5a6a8a';
      box(R, 1, -2, 14, 32, '#4a3220'); R(2, -1, 12, 4, '#5a3c26'); R(3, 3, 10, 6, '#e6e2d6');
      R(2, 10, 12, 19, c); for (let i = 0; i < 4; i++) R(2, 12 + i * 4, 12, 1, shade(c, .15)); R(2, 27, 12, 2, shade(c, -.25));
      if (e.full) { R(5, 4, 6, 5, e.skin || '#e4bc9c'); R(5, 3, 6, 2, e.hair || '#dcdcd4'); R(6, 6, 1, 1, '#2a1a14'); R(9, 6, 1, 1, '#2a1a14'); R(4, 10, 8, 3, shade(c, .2)); }
    },
    cabdoor(g, e, t, R) {   // 木屋外门（挂在原木墙上）
      if (e.open) { R(3, -2, 10, 17, '#0a0806'); R(3, 4, 10, 11, 'rgba(255,170,80,.35)'); return; }
      box(R, 3, -2, 10, 17, '#4a3220'); for (let x = 5; x < 12; x += 3) R(x, -1, 1, 15, '#3a2616'); R(4, 3, 8, 1, '#5a4030'); R(4, 9, 8, 1, '#5a4030');
      R(10, 5, 2, 1, '#a08a6a'); R(11, 2, 1, 4, '#c8b890');
    },
    cabwin(g, e, t, R) {   // 木屋小窗（原木墙上），lit=亮灯
      box(R, 3, 2, 10, 9, '#3a2616'); R(4, 3, 8, 7, e.lit ? '#e8b060' : '#0e1726'); R(7, 3, 2, 7, '#3a2616'); R(4, 6, 8, 1, '#3a2616');
      R(1, 2, 2, 9, '#4a3220'); R(13, 2, 2, 9, '#4a3220');
    },
    rifle(g, e, t, R) { R(2, 3, 2, 3, '#6a4a2a'); R(12, 3, 2, 3, '#6a4a2a'); R(0, 5, 16, 1, '#3a3a3c'); R(1, 6, 15, 1, '#2a2a2c'); R(10, 6, 6, 3, '#6a4220'); R(12, 8, 4, 2, '#5a3618'); },
    spinwheel(g, e, t, R) {
      const a = t * (e.spin ? 4 : 0);
      R(2, 12, 12, 2, '#5a3c22'); R(3, 9, 2, 4, '#5a3c22'); R(11, 6, 2, 7, '#5a3c22');
      R(3, -4, 10, 1, '#7a5a38'); R(3, 5, 10, 1, '#7a5a38'); R(2, -3, 1, 8, '#7a5a38'); R(13, -3, 1, 8, '#7a5a38');
      for (let i = 0; i < 4; i++) { const k = a + i * Math.PI / 4; R(8 + Math.cos(k) * 4 - .5, .5 + Math.sin(k) * 4, 1, 1, '#a08060'); }
      R(7, 0, 2, 2, '#3a2616'); R(12, 2, 2, 3, '#e8e0c8');
    },
    churn(g, e, t, R) { box(R, 4, 2, 8, 13, '#7a5a38'); R(4, 5, 8, 1, '#3a3a3a'); R(4, 11, 8, 1, '#3a3a3a'); R(7, -4, 2, 7, '#a08a6a'); R(5, 1, 6, 2, '#5a4028'); },
    bucket(g, e, t, R) { box(R, 4, 6, 8, 8, '#7a6a52'); R(5, 7, 6, 2, e.full ? '#6a8aa0' : '#3a3024'); R(4, 9, 8, 1, '#4a4a4a'); R(5, 3, 6, 1, '#5a5a5a'); R(4, 4, 1, 3, '#5a5a5a'); R(11, 4, 1, 3, '#5a5a5a'); if (e.s.hat) { R(5, 5, 7, 2, '#2a2420'); R(6, 4, 5, 1, '#2a2420'); } },
    nuts(g, e, t, R) { for (let i = 0; i < 9; i++) R(3 + ((hash(i, 1, 8) * 10) | 0), 6 + ((hash(i, 2, 8) * 6) | 0), 2, 2, i % 3 ? '#8a5a2a' : '#a8743a'); R(10, 5, 3, 3, '#5a2a5a'); R(11, 7, 3, 3, '#6a3a6a'); },
    vial(g, e, t, R) { R(7, 4, 2, 2, '#8a6a4a'); R(6, 6, 4, 7, 'rgba(160,180,190,.7)'); R(7, 8, 2, 5, '#1a1418'); R(7, 2 + Math.sin(t * 3), 1, 2, 'rgba(180,180,200,.4)'); },
    bible(g, e, t, R) { box(R, 1, 3, 14, 11, '#5a3a24'); R(3, 1, 10, 4, '#2a1a14'); R(3, 1, 10, 1, '#c9a35a'); R(7, 2, 2, 2, '#c9a35a'); R(4, 5, 8, 1, '#e8e0c8'); },
    pebble(g, e, t, R) { R(5, 9, 7, 5, '#d8d6cc'); R(4, 10, 9, 3, '#d8d6cc'); R(6, 10, 5, 3, '#ecebe4'); R(7, 11, 3, 1, '#9aa0aa'); R(8, 10, 1, 3, '#9aa0aa'); if (Math.sin(t * 2.3) > .7) R(10, 9, 1, 1, '#ffffff'); },
    stovep(g, e, t, R) {   // 会堂的铁炉子，烟管通到房顶
      R(6, -14, 3, 16, '#2a2a2c'); R(5, -14, 5, 1, '#3a3a3c');
      box(R, 2, 2, 12, 11, '#2c2a2a'); R(3, 3, 10, 1, '#44403e'); R(3, 13, 2, 2, '#1a1818'); R(11, 13, 2, 2, '#1a1818');
      R(5, 6, 6, 5, '#140c08'); const k = (Math.sin(t * 8) + 1) / 2; R(6, 8, 4, 3, k > .5 ? '#ff8a2a' : '#e86a1a'); R(7, 9, 2, 2, '#ffd060');
    },
    cat(g, e, t, R) {
      if (e.s.dead) { R(3, 10, 10, 3, '#8a7a6a'); R(2, 9, 3, 3, '#8a7a6a'); R(12, 12, 3, 1, '#8a7a6a'); return; }
      const b = Math.sin(t * 2) > .9 ? 1 : 0;
      R(5, 7, 7, 7, '#8a7a6a'); R(6, 8, 3, 3, '#c8b898'); R(4, 3, 6, 5, '#8a7a6a'); R(4, 2, 1, 2, '#8a7a6a'); R(9, 2, 1, 2, '#8a7a6a');
      R(5, 5, 1, 1 - b, '#e0d040'); R(8, 5, 1, 1 - b, '#e0d040'); R(11, 12, 4, 1, '#8a7a6a'); R(14, 9, 1, 3, '#8a7a6a');
    },
    beast(g, e, t, R) {   // 狗身兔头的黑东西，朝向随 dir
      const fl = e.dir === 2, F = (x, y, w, h, c) => R(fl ? 16 - x - w : x, y, w, h, c);
      const k = e.mv ? Math.sin(t * 18) : 0;
      F(0, 13, 16, 2, 'rgba(0,0,0,.35)');
      F(4, 6, 10, 5, '#0c0a0e'); F(5, 5, 8, 1, '#141218');
      F(4 + (k > 0 ? 1 : 0), 11, 2, 3, '#0c0a0e'); F(11 - (k > 0 ? 1 : 0), 11, 2, 3, '#0c0a0e');
      F(13, 4, 2, 2, '#0c0a0e'); F(14, 3, 1, 2, '#0c0a0e');
      F(0, 4, 5, 5, '#0c0a0e'); F(1, -3, 1, 7, '#0c0a0e'); F(3, -2, 1, 6, '#0c0a0e'); F(1, -2, 1, 3, '#3a1a1a');
      F(1, 5, 1, 1, '#ff3030'); F(0, 7, 2, 1, '#e8e2d6');
    },
    wispdot(g, e, t, R) { const y = Math.sin(t * 4 + e.px) * 1.5, a = .55 + Math.sin(t * 9 + e.py) * .25; R(6, 6 + y, 4, 4, `rgba(90,140,255,${a * .5})`); R(7, 7 + y, 2, 2, `rgba(200,220,255,${a})`); },
    wisp(g, e, t, R) {
      const y = Math.sin(t * 3) * 2, a = .6 + Math.sin(t * 11) * .2;
      R(5, 2 + y, 6, 6, `rgba(90,140,255,${a * .5})`); R(6, 3 + y, 4, 4, `rgba(150,190,255,${a})`); R(7, 4 + y, 2, 2, '#e8f0ff'); R(7, y, 2, 2, `rgba(120,170,255,${a * .6})`);
    },
    pulpit(g, e, t, R) { box(R, 1, -2, 14, 16, '#5a3c22'); R(0, -4, 16, 3, '#6a4a2c'); R(3, -6, 10, 2, '#e8e0c8'); R(7, -6, 2, 2, '#8a2a2a'); R(4, 3, 8, 6, '#4a3018'); R(7, 4, 2, 4, '#c9a35a'); R(6, 5, 4, 1, '#c9a35a'); },
    hymnboard(g, e, t, R) { box(R, 2, 0, 12, 13, '#4a3018'); for (let i = 0; i < 4; i++) { R(4, 2 + i * 3, 8, 2, '#1a1410'); R(5, 2 + i * 3, 2, 2, '#e8e0c8'); R(8, 2 + i * 3, 2, 2, '#e8e0c8'); } },
    woodpile(g, e, t, R) { for (let r = 0; r < 3; r++) for (let c = 0; c < 4 - r; c++) { R(1 + c * 4 + r * 2, 10 - r * 4, 4, 4, '#6a4a2a'); R(2 + c * 4 + r * 2, 11 - r * 4, 2, 2, '#b8946a'); } R(11, 0, 1, 9, '#7a5a38'); R(9, 0, 4, 2, '#8a8a8a'); },
    echo(g, e, t, R) {   // 墙上的回声石（墙面）
      R(2, 1, 12, 12, '#6a665e'); R(3, 2, 10, 10, '#7a766c');
      const lit = e.lit;
      for (let i = 0; i < 4; i++) { const c = lit ? '#9ac0ff' : '#4a4640'; R(7 - i, 6 - i, 2 + i * 2, 1, c); R(7 - i, 7 + i, 2 + i * 2, 1, c); R(6 - i, 6 - i, 1, 2 + i * 2, c); R(9 + i, 6 - i, 1, 2 + i * 2, c); }
    },
    bigrock(g, e, t, R) { R(-2, 13, 20, 3, '#2a2018'); box(R, 0, 0, 16, 14, '#5a5650'); R(2, 1, 10, 3, '#6e6a62'); R(3, 2, 4, 1, '#807a70'); R(10, 9, 4, 3, '#4a4640'); R(-3, 12, 4, 3, '#3a2c20'); R(15, 11, 3, 3, '#3a2c20'); },
    mound(g, e, t, R) {
      if (e.open) { R(1, 1, 14, 14, '#2a1e14'); R(2, 2, 12, 12, '#0e0a08'); R(3, 9, 10, 4, '#3a2a1c'); R(4, 9, 8, 1, '#5a4430'); return; }
      R(1, 3, 14, 11, '#3a2c1e'); R(2, 4, 12, 3, '#4a3a28'); R(4, 9, 3, 1, '#2a1e14'); R(10, 7, 2, 1, '#2a1e14'); R(3, 2, 2, 1, '#d8dce4'); R(11, 3, 2, 1, '#d8dce4');
    },
    shovel(g, e, t, R) { R(7, -6, 2, 14, '#6a4a2a'); R(5, 7, 6, 6, '#7a7a7a'); R(6, 12, 4, 2, '#5a5a5a'); },
    smoke(g, e, t, R) { const k = e.s.k || 0; for (let i = 0; i < 9; i++) { const a = i * .7 + t * 2, r = 2 + k * 5; R(6 + Math.cos(a) * r, 4 + Math.sin(a) * r * .7 - k * 4, 4 + k * 2, 3 + k * 2, `rgba(200,200,205,${.7 - k * .5})`); } R(6, 5 - k * 4, 4, 4, `rgba(230,230,235,${.8 - k * .6})`); },
    lanternp(g, e, t, R) { R(7, 1, 2, 2, '#3a3a3a'); box(R, 5, 3, 6, 9, '#3a3a3a'); R(6, 4, 4, 7, e.off ? '#3a3020' : '#ffd070'); R(4, 12, 8, 2, '#2a2a2a'); },
    signpost(g, e, t, R) { R(7, -10, 2, 25, '#5a4028'); box(R, 0, -10, 14, 5, '#7a5a38'); R(12, -10, 3, 5, '#7a5a38'); R(2, -8, 8, 1, '#3a2616'); box(R, 2, -3, 14, 5, '#7a5a38'); R(0, -3, 3, 5, '#7a5a38'); R(5, -1, 8, 1, '#3a2616'); },
    trough(g, e, t, R) { box(R, 0, 6, 32, 8, '#5a4028'); R(2, 7, 28, 3, '#8aa0b4'); R(3, 7, 26, 1, '#c8d4e0'); R(2, 13, 2, 3, '#3a2616'); R(28, 13, 2, 3, '#3a2616'); },
    barndoor(g, e, t, R) { box(R, 0, -4, 16, 19, '#4a2418'); R(1, -3, 14, 17, '#5a2e22'); R(1, -3, 14, 1, '#3a1810'); for (let x = 3; x < 15; x += 4) R(x, -3, 1, 17, '#3a1810'); R(1, 5, 14, 1, '#7a4a32'); R(2, -2, 12, 14, 'rgba(0,0,0,0)'); R(1, -3, 1, 17, '#7a4a32'); R(7, 4, 2, 3, '#8a8a8a'); },
    stoneg(g, e, t, R) { R(4, 4, 8, 10, '#5a5a58'); R(5, 3, 6, 2, '#5a5a58'); R(5, 5, 6, 8, '#6a6a68'); R(6, 7, 4, 1, '#4a4a48'); R(3, 13, 10, 2, '#3a3a38'); R(5, 3, 3, 1, '#d8dce4'); }
  };

  /* ---------------- 自定义瓦片 ---------------- */
  const TILES = {
    snow: { solid: false, paint(R, X, Y) {
      TILE.grass.paint(R, X, Y, { grassC: '#3a4232' });
      for (let i = 0; i < 5; i++) { const x = (hash(X, Y, 70 + i) * 12) | 0, y = (hash(Y, X, 80 + i) * 13) | 0, w = 3 + ((hash(X, Y, 90 + i) * 4) | 0); R(x, y, w, 1, 'rgba(200,210,224,.75)'); R(x + 1, y + 1, w - 1, 1, 'rgba(170,182,200,.55)'); }
      R(((hash(X, Y, 5) * 8) | 0) + 2, ((hash(X, Y, 6) * 8) | 0) + 3, 5, 2, 'rgba(210,218,230,.6)');
    } },
    logw: { solid: true, paint(R, X, Y) {
      R(0, 0, 16, 16, '#4a3420');
      for (let r = 0; r < 4; r++) { R(0, r * 4, 16, 3, shade('#6b4c30', (hash(X, Y * 4 + r, 2) - .5) * .2)); R(0, r * 4, 16, 1, '#7a5a3a'); R(0, r * 4 + 3, 16, 1, '#a89a7e'); }
      if (X % 3 === 0) R(14, 0, 2, 16, '#3a2616');
    } },
    roof: { solid: true, paint(R, X, Y) {
      R(0, 0, 16, 16, '#2e2826');
      for (let r = 0; r < 4; r++) { const o = (r + Y) % 2 ? 0 : 4; for (let c = -1; c < 3; c++) R(o + c * 8, r * 4, 7, 3, shade('#3e3634', (hash(X + c, Y * 4 + r, 4) - .5) * .25)); }
      for (let i = 0; i < 5; i++) if (hash(X, Y, 10 + i) < .55) R((hash(X, Y, 20 + i) * 13) | 0, (hash(X, Y, 30 + i) * 14) | 0, 3, 1, '#c8d0dc');
    } },
    barnw: { solid: true, paint(R, X, Y) {
      R(0, 0, 16, 16, '#5a2e22'); for (let x = 0; x < 16; x += 4) R(x, 0, 1, 16, '#3a1810');
      R(0, 14, 16, 2, '#2a140c');
    } },
    barnroof: { solid: true, paint(R, X, Y) {
      R(0, 0, 16, 16, '#2a2422'); for (let r = 0; r < 16; r += 3) R(0, r, 16, 1, '#1a1614');
      for (let i = 0; i < 4; i++) if (hash(X, Y, 40 + i) < .6) R((hash(X, Y, 50 + i) * 12) | 0, (hash(X, Y, 60 + i) * 14) | 0, 4, 1, '#c8d0dc');
    } },
    corn: { solid: true, paint(R, X, Y) {
      TILE.dirt.paint(R, X, Y);
      R(0, 12, 16, 4, '#2e2418');
      for (let i = 0; i < 4; i++) {
        const x = 1 + i * 4 + ((hash(X, Y, i) * 2) | 0), top = ((hash(X, Y, i + 7) * 4) | 0), c = i % 2 ? '#9a8a5a' : '#7e6e44';
        R(x, top, 1, 16 - top, c); R(x, top, 1, 1, '#b8a470');
        R(x - 3, top + 4 + (i % 3), 3, 1, c); R(x - 3, top + 5 + (i % 3), 1, 2, c);
        R(x + 1, top + 8 - (i % 2), 3, 1, '#6a5a36'); R(x + 3, top + 9 - (i % 2), 1, 2, '#6a5a36');
        if (hash(X, Y, i + 3) < .35) R(x + 1, top + 5, 1, 3, '#c8a860');
      }
    } },
    crack: { solid: true, paint(R, X, Y) {
      R(0, 0, 16, 16, '#3a3834'); R(2, 1, 12, 14, '#4c4944'); R(4, 3, 4, 3, '#5a5650'); R(9, 8, 4, 4, '#55524b');
      R(7, 0, 1, 16, '#141210'); R(8, 4, 1, 6, '#141210'); R(6, 10, 1, 6, '#141210');
    } }
  };

  /* ---------------- 木屋布景：按剧情阶段摆人 ---------------- */
  const HOUSE_NPC = ['bell', 'mrs', 'anne', 'dan', 'stone', 'tom_h'];
  function stage(S) {
    const ph = S.f.ph, bA = S.ent('bedA'), bB = S.ent('bedB'), fire = S.ent('hearth');
    for (const id of HOUSE_NPC) S.hide(id);
    S.ent('mrs').spr = '@mrs'; S.ent('anne').spr = '@anne';
    bA.full = false; bB.full = false;
    const night = ['evening', 'night1', 'night1b', 'night1c'].includes(ph);
    if (ph === 'arrive' || ph === 'supper') {
      S.place('bell', 3, 8, 2); S.place('mrs', 6, 8, 1); S.place('anne', 4, 7, 0); S.place('dan', 5, 7, 0); S.place('stone', 4, 4, 0);
    } else if (night || ['day2', 'stone', 'missing', 'collapse'].includes(ph)) {
      bA.full = true; S.place('mrs', 13, 3, 1);
      if (night) bB.full = true;
      if (ph === 'day2' || ph === 'stone') { S.place('anne', 9, 9, 3); S.ent('anne').spr = '@anneS'; }
      if (ph === 'collapse') { S.place('tom_h', 14, 4, 1); S.place('anne', 7, 9, 3); S.ent('anne').spr = '@anneS'; }
    } else if (ph === 'spring') {
      S.place('mrs', 6, 8, 1); S.place('anne', 4, 7, 0); S.place('tom_h', 5, 7, 0); S.place('stone', 3, 8, 2);
    }
    if (ph !== 'arrive' && ph !== 'supper') S.hide('nuts');
    if (ph !== 'evening') S.ent('lampH').off = true;
    S.show('catH', ph === 'collapse' || ph === 'burnt');
    fire.s.low = night; fire.light = night ? Object.assign({}, FIRE_LOW) : Object.assign({}, FIRE);
    if (fire.s.blue) fire.light = Object.assign({}, FIRE_BLUE);
    S.ent('wheel').s.spin = (ph === 'day2' || ph === 'stone');
    if (ph === 'evening') { S.dark(.8); S.plr(2.6); } else if (night) { S.dark(.88); S.plr(2); } else if (ph === 'day2' || ph === 'stone' || ph === 'collapse') { S.dark(.42); S.plr(null); } else { S.dark(null); S.plr(null); }
  }

  /* ---------------- 第一夜：晚饭 ---------------- */
  async function supper(S) {
    S.f.ph = 'supper';
    await S.narr('门一开，一股热气扑在脸上：松木烟、玉米饼、熏肉。\n壁炉里的火烧得正旺。一屋子人围着桌子，齐刷刷地抬起头来看你。');
    S.face('mrs', 'pl');
    await S.say('贝尔太太', ['你就是伊莱吧？肯塔基来的那个孩子。快进来，快把门关上。', '汤姆说你走了三天的路。先坐下吃饭，别的什么都别管。']);
    await S.walk('pl', [7, 9], 4); S.face('pl', 1);
    S.face('bell', 'pl');
    await S.say('老贝尔', '坐吧，孩子。……屋里是暖和的。');
    await S.narr('他的半边脸忽然抽了一下，像有根看不见的线在扯。\n他用手按住了，装作什么也没发生。');
    S.face('dan', 'pl');
    await S.say('丹尼尔', '别那么紧张，伊莱。这屋里的「客人」，你待两天就习惯了。');
    S.face('stone', 'dan');
    await S.say('斯通兄弟', '丹尼尔，别拿它说笑。');
    await knocks(S, 3, 380);
    await S.narr('你刚把一块玉米饼掰开——\n咚。咚。咚。墙板里，有什么东西敲了三下。');
    S.sfx('tear'); await S.wait(300); await gnaw(S, 7);
    await S.narr('接着是抓挠声，然后是啃木头：咯吱，咯吱。\n就在你脚边的地板底下。\n\n桌边没有一个人抬头。贝尔太太往你盘子里添了一勺豆子。');
    await S.say('贝尔太太', '吃吧，孩子。它每天晚上都来。');
    S.ent('hearth').s.low = true; S.sfx('whisper');
    await S.narr('炉火矮了一下。\n屋里响起一声很长的、湿漉漉的喘气——然后是「啧」的一声，像有人舔了舔嘴唇。');
    S.ent('hearth').s.low = false;
    await K(S, '晚上好啊，斯通兄弟。');
    await S.say('斯通兄弟', '晚上好，凯特。');
    await K(S, ['还有个新来的。肯塔基洛根县的小子，走了三天的路，左脚的鞋底磨穿了。', '你娘把一枚银币缝在你外套左边的衬里里了，对不对？她说，不到要命的时候，不许拿出来。']);
    S.bubble('pl', '!', 1200); S.sfx('heart');
    await S.think('……这件事，你谁也没告诉过。');
    const r = await S.ask('你攥紧了外套的衣角。', ['「……你是谁？」', '（不吭声）']);
    if (r === 0) await S.say('伊莱', '你……你是谁？');
    else await K(S, '不说话？那我替你问——「你是谁呀？」');
    await K(S, ['我是一个灵。我从前很快乐，可是被人惊扰了，现在不快乐。', '……不对，不对。我是林子里一座坟里的人。有人把我的一颗牙弄丢了，我回来找。']);
    S.sfx('laugh');
    await K(S, '骗你的！我是老凯特——邻村那个老婆子养的巫物！', { style: '' });
    S.face('stone', 'pl');
    await S.say('斯通兄弟', ['它每天晚上说的都不一样。「凯特」是大家后来叫开的，它自己倒挺喜欢。', '你听好，伊莱。前天礼拜天，我在山这边讲道，十三里外，浸信会的弟兄也在讲道。同一个钟点。']);
    S.sfx('chant');
    await S.say('它（学着斯通兄弟的嗓音）', '「……务要谨守、儆醒，因为你们的仇敌魔鬼，如同吼叫的狮子，遍地游行，寻找可吞吃的人……」');
    await S.say('它（换了个粗嗓门）', '「……我们若认自己的罪，神是信实的，是公义的，必要赦免我们的罪……」');
    await S.say('斯通兄弟', '一字不差。连我讲到一半咳嗽的那一声，它都学了。');
    await S.wait(400);
    sing(S, 'title');
    await K(S, '「当我能读清我的名分，在天上有我的华屋……我便向一切恐惧告别，擦干我流泪的眼……」', { style: 'think' });
    await S.narr('它唱起歌来。声音又高又甜，像唱诗班里最小的那个女孩。\n满屋子的人都不动了。连炉火都不跳了。');
    await S.wait(600);
    S.sfx('sting');
    await K(S, '……老贝尔。', { style: 'big' });
    S.bubble('bell', '…', 1500);
    await K(S, ['你今天吃饭了没有？', '吃不下吧。舌头肿得像块木头。', '我说过的：我会一直缠着你，缠到你进坟为止。']);
    S.sfx('thud'); S.shake(300, 2); S.bubble('bell', '!', 1000);
    await S.narr('「啪！」\n老贝尔的脑袋猛地往旁边一歪，像挨了一记耳光。');
    S.face('mrs', 3);
    await S.say('贝尔太太', '凯特！', { style: 'big' });
    await K(S, ['好，好。贝尔太太说不打，就不打。', '贝尔太太是世上最好的女人。']);
    S.show('nuts'); for (let i = 0; i < 4; i++) { S.sfx('drip'); await S.wait(140); }
    await S.narr('房梁上噼里啪啦掉下来一把榛子，滚了一桌子——\n一颗一颗，都剥好了壳。里头还混着几粒紫葡萄。');
    await K(S, '给你的，贝尔太太。你前些天咳嗽了。');
    await K(S, '……安妮。');
    S.bubble('anne', '…', 1500);
    await K(S, ['别嫁给丹尼尔。', '求求你。别嫁给他。']);
    S.sfx('cry');
    await S.narr('那声音在哭。哭得像个小孩子。');
    S.face('dan', 3);
    await S.say('丹尼尔', '你给我出来！有本事就出来！', { style: 'big' });
    S.sfx('laugh'); S.show('dan');
    await S.narr('丹尼尔的帽子从凳子上飞了起来，在房梁底下转了三圈，「扑通」一声，掉进了门边的水桶里。');
    S.ent('bucket').s.hat = true;
    await S.wait(500);
    await S.narr('然后，就再也没有声音了。');
    await S.say('斯通兄弟', '……今晚算是安静的。');
    await S.fade(1, 600);
    S.hide('dan'); S.hide('stone');
    await S.fade(0, 600);
    await S.narr('丹尼尔从水桶里捞出湿漉漉的帽子，一句话没说，走了。\n斯通兄弟临走前，在门口拍了拍你的肩膀。');
    await S.say('斯通兄弟', ['伊莱，明天来会堂找我一趟。往西走，顺着大路就到。', '有些事，在这屋里说不方便。……它什么都听得见。不过在会堂里，它至少不唱歌。']);
    S.face('mrs', 'pl');
    await S.say('贝尔太太', ['伊莱，我在壁炉边给你铺好了铺盖。', '夜里要是有动静，你记住三件事——', '一，床底下有东西啃，别去看。', '二，被子要是被扯，别跟它抢。你越抢，它越来劲。', '三……要是喘不上气了，别求它——你越求，它越高兴。', '问它点什么。问什么都行。它就爱有人跟它搭话。']);
    S.f.rules = true; S.f.ph = 'evening'; S.f.hp = HPMAX;
    stage(S);
    S.goal('睡前四处看看，再去壁炉边的铺盖睡下（规矩：别看 · 别抢 · 别求它，问它）');
    S.toast('三条规矩写在了左上角的目标里');
    S.cp();
  }

  /* 鲸油灯：点上，敲墙声就停；可它不喜欢亮 */
  async function lampUse(S) {
    const l = S.ent('lampH');
    if (S.f.ph !== 'evening') return S.narr('一盏鲸油灯。灯罩被熏黑了。\n汤姆说，灯一点上，敲墙声就停；一吹灭，又来。');
    if (!l.off) return S.narr('灯苗稳稳地立着。屋里安静得能听见炉灰塌下去的声音。');
    if (S.once('lampLit')) {
      await S.narr('一盏鲸油灯。汤姆说过：灯一点上，敲墙声就停。');
      if (await S.ask('要点上吗？', ['（划根火柴，点上）', '（算了）'])) return;
    }
    S.sfx('match'); l.off = false; S.f.lampOn = true;
    await S.narr('灯芯「噗」地着了。暖黄的光铺开，墙板里的声音一下子全停了。');
    S.after(9000, async S => {
      const l = S.ent('lampH'); if (S.f.ph !== 'evening' || l.off) return;
      S.sfx('whisper'); await S.wait(300);
      l.off = true; S.f.lampOn = false; S.sfx('knock'); S.shake(250, 1);
      await K(S, '……太亮了。吹了吧。');
      await S.narr('灯灭了。灯芯上还冒着一缕青烟——像是有人凑过去，轻轻吹了一口气。');
      await knocks(S, 3, 260);
    });
  }

  /* ---------------- 第一夜：夜里 ---------------- */
  async function sleepNight(S) {
    if (S.f.ph !== 'evening') return S.narr(S.f.ph === 'night1b' || S.f.ph === 'night1c' ? '现在哪还睡得着。' : '你的铺盖。叠得方方正正。');
    if (await S.ask('要躺下吗？\n（床底下有东西啃，别看；被子被扯，别抢；喘不上气，别求它——问它。）', ['躺下', '再四处看看'])) return;
    const pal = S.ent('pallet');
    if (!S.ent('lampH').off) { S.ent('lampH').off = true; await S.narr('你吹熄了鲸油灯。'); }
    S.f.ph = 'night1'; stage(S); S.dark(.94); S.plr(1.2);
    S.hidePlayer(true); pal.full = true; S.focus(1, 9);
    S.amb('drone');
    await S.narr('你钻进铺盖。被子有一股晒过的稻草味。\n炉火一点一点矮下去，屋里只剩下炭火的红光。');
    await S.fade(1, 700); await S.wait(500); await S.fade(0, 500);
    /* 一：啃床板 */
    await gnaw(S, 8);
    await S.narr('咯吱。咯吱。咯吱。\n……就在你身子底下。隔着一层草垫，它在啃地板。');
    let r = await S.ask('床底下的东西在啃。', ['（掀开铺盖，看看底下）', '（闭上眼，别管它）']);
    if (r === 0) {
      await S.scare('face', { spr: '@kate', dur: .9 });
      if (await hurt(S, '底下什么也没有。\n可就在你掀开铺盖的那一瞬间，有什么东西贴着你的脸，吹了一口冰凉的气。')) return;
    } else await S.narr('你把眼睛闭得紧紧的。\n啃了一会儿，停了。');
    await S.wait(500);
    /* 二：扯被子 */
    S.sfx('tear');
    await S.narr('被子的一角，慢慢地，往下滑。\n一寸，又一寸。');
    r = await S.ask('被子在往下走。', ['（死死拽住被子）', '（松手）']);
    if (r === 0) {
      pal.covered = true; S.sfx('tear');
      if (await hurt(S, '你拽得越紧，那头扯得越狠——被子「呼」地从你手里飞了出去，像一面帆，卷上了房梁。\n冷风灌进来。紧接着，「啪」的一声，你脸上挨了一下。')) return;
      pal.covered = false;
      await S.narr('过了好一会儿，被子才从房梁上慢慢飘下来，盖回了你身上。');
    } else {
      pal.covered = true;
      await S.narr('被子滑到了地上。你冻得缩成一团，一动不动。');
      await S.wait(600); pal.covered = false;
      await S.narr('过了一会儿，被子又被轻轻地盖了回来。\n有什么东西，替你掖了掖被角。');
      await K(S, '……乖。');
    }
    await S.wait(500);
    /* 三：掐脖子 */
    S.sfx('heart'); S.shake(600, 1);
    await S.narr('一双看不见的手，按在了你的喉咙上。\n很凉。很慢。一点一点收紧。');
    const opts = ['「求求你……放开我……」', '（拼命挣扎）', '「……你为什么恨老贝尔？」'];
    for (;;) {
      r = await S.ask('喘不上气了——', opts);
      if (r === 2) break;
      const msg = r === 0 ? '你越是求它，那双手收得越紧。\n……贝尔太太说过的：别求它。' :'你踢开了铺盖，指甲抠进自己的脖子——什么也抓不住。\n那双手纹丝不动。';
      if (await hurt(S, msg)) return;
    }
    await S.narr('喉咙上的手，停住了。');
    await S.wait(500);
    await K(S, ['……你问我？', '他知道为什么。', '你去问他。问他北卡罗来纳的事。', '……睡吧，肯塔基小子。今天晚上，不是你。']);
    await S.narr('那双手松开了。你大口大口地喘气，眼泪呛了出来。');
    await S.wait(700);
    S.sfx('scream'); S.shake(400, 2);
    await S.say('安妮（里屋）', '不要——！放开我！', { style: 'big' });
    pal.full = false; S.hidePlayer(false); S.focus(null); S.pos(2, 9, 2); S.dark(.88); S.plr(2);
    S.f.ph = 'night1b';
    S.goal('去安妮的房间（右边那扇门）');
  }

  async function anneNight(S) {
    S.f.ph = 'night1c';
    S.sfx('open'); S.pos(19, 3, 2);
    const an = S.ent('anne');
    S.ent('bedB').full = false; S.place('anne', 20, 3, 1); an.spr = '@anneS'; an.oy = 0;
    await S.narr('安妮坐在床上，两只手护着脸。\n左边脸颊上，一个通红的巴掌印。');
    S.sfx('thud'); S.shake(300, 2); S.bubble('anne', '!', 900);
    await S.narr('「啪！」又是一下。');
    for (let i = 0; i < 3; i++) { an.oy = -3 - i * 2; S.sfx('tear'); await S.wait(260); an.oy = -1 - i * 2; await S.wait(160); }
    an.oy = -8;
    await S.narr('她的头发被一把揪了起来——整个人被一点一点往上提，脚尖都离了床。');
    const r = await S.ask('', ['（扑过去，按住她的肩膀）', '「住手！」']);
    if (r === 0) await S.narr('你扑过去按住她。她头顶上方，有一股力气在和你较劲，冰凉的，像攥着一把井水。');
    else await S.say('伊莱', '住手！', { style: 'big' });
    await K(S, ['安妮。', '别嫁给他。']);
    await S.say('安妮', '我不嫁了！我不嫁了！你放开我！', { style: 'big' });
    an.oy = 0; S.sfx('thud');
    await S.narr('头发松开了。她跌回床上，扑在你胳膊上，抖得像一片叶子。');
    await K(S, '……你说的。我听见了。');
    await S.say('安妮', ['……明天我还会说要嫁给他的。', '它知道。它每天晚上都知道。']);
    await S.wait(500);
    S.sfx('thud'); await S.wait(250); S.sfx('thud');
    await S.narr('隔壁传来两声闷响，像有人把什么东西摔在了墙上。');
    await S.say('贝尔太太（隔壁）', '伊莱！伊莱，你过来帮帮我！');
    S.goal('去老贝尔的房间（左边那扇门）');
  }

  async function bellNight(S) {
    S.sfx('open'); S.pos(13, 4, 1);
    S.ent('bedA').full = false;
    S.place('bell', 12, 4, 2);
    await S.narr('老贝尔坐在床沿上，正弯着腰穿鞋。');
    S.sfx('thud');
    await S.narr('鞋子从他脚上被一只一只拽了下来，「砰」「砰」两声，扔到了墙角。\n他又穿。又被拽掉。');
    await S.narr('他的脸抽得厉害，舌头肿得合不上嘴。贝尔太太扶着他，一遍一遍地念主祷文。');
    sing(S, 'stanne', { beat: .42, vol: .035 });
    await K(S, '「……光阴好像长河奔流，把它的儿女都带走……」', { style: 'think' });
    await S.narr('它在床边轻轻地唱。唱得很好听。\n调子很老，很慢，像是在给谁送葬。');
    S.face('bell', 'pl');
    await S.narr('老贝尔一把抓住了你的手腕。他的手烫得吓人。');
    await S.say('老贝尔', ['孩子……它跟你说了什么？', '北卡罗来纳……？', '……别问。什么都别问。'], { style: 'whisper' });
    await S.fade(1, 900);
    S.hide('bell'); S.ent('bedA').full = true;
    await S.card('十二月十八日　早晨', '', '天亮了。\n屋子里所有的东西都在原处，\n只有老贝尔的那双鞋，\n整整齐齐地摆在大门口，鞋尖朝外。');
    S.f.ph = 'day2'; stage(S); S.amb('fire');
    S.pos(2, 9, 2);
    await S.fade(0, 700);
    S.face('anne', 'pl');
    await S.say('安妮', ['早，伊莱。……昨晚谢谢你。', '妈让我告诉你：斯通兄弟在会堂等你。出门往西，顺着大路走。']);
    S.goal('去西边的会堂找斯通兄弟');
    S.cp();
  }

  /* ---------------- 农场 ---------------- */
  function farmMood(S) {
    const ph = S.f.ph;
    const dusk = ph === 'arrive', day = ph === 'day2' || ph === 'stone';
    S.dark(day ? .3 : dusk ? .62 : .84); S.plr(S.has('lantern') && !day ? 3.4 : null);
    for (const id of ['cw1', 'cw2']) S.ent(id).lit = !day;
    S.amb(day ? 'wind' : 'night');
  }
  async function beastSight(S) {
    S.f.beast = true;
    await S.narr('你抬手正要敲门——\n身后的玉米地里，「沙」地响了一下。');
    S.focus(14, 10); S.show('beast'); S.place('beast', 14, 10, 1); S.sfx('sting');
    await S.wait(400);
    await S.narr('枯黄的玉米秆中间，蹲着一只黑东西。\n狗的身子。兔子的脑袋。两只长耳朵直直地竖着。');
    S.bubble('beast', '…', 1200);
    await S.narr('它看着你。眼睛是红的。');
    await S.walk('beast', [17, 10], 5);
    await S.alpha('beast', 0, 500);
    S.focus(null);
    await S.think('（……兔子？不对。兔子不会那样看人。\n　汤姆说的那只「怪东西」——就是它？）');
  }
  async function tomFarm(S) {
    S.face('tom_f', 'pl');
    const ph = S.f.ph;
    if (ph === 'arrive') {
      if (S.f.tomMet) return S.say('汤姆', '进屋吧。我娘做了玉米饼。');
      S.f.tomMet = true;
      await S.say('汤姆', ['你就是肯塔基来的伊莱？我是汤姆，老贝尔的儿子。', '镇上的人跟你说过了吧——方圆十里，没人肯来我们家干活。']);
      const r = await S.ask('他把斧子往木墩上一剁。', ['「听说你们家……闹鬼？」', '（点点头）']);
      if (r === 0) await S.say('伊莱', '听说你们家……闹鬼？');
      await S.say('汤姆', ['不是鬼。……我们也不知道是什么。', '三年前，我爹在这片玉米地边上看见过一只怪东西，开了一枪，什么也没打着。从那以后，就开始了。', '……不管夜里听见什么，别一个人出门。']);
      S.goal('去木屋，见贝尔一家');
      return;
    }
    if (ph === 'day2' || ph === 'stone') return S.say('汤姆', ['我爹今天连粥都咽不下了。', '会堂往西走，顺着大路。快去快回。']);
    if (ph === 'missing') return S.say('汤姆', '顺着小路往南，一直走到河边！快！');
    await S.say('汤姆', '……');
  }
  async function missingScene(S) {
    S.f.ph = 'missing';
    farmMood(S);
    await S.narr('你回到农场的时候，天已经黑透了。\n木屋的窗户亮着，可院子里有个人影，提着马灯，来来回回地走。');
    S.place('tom_f', 4, 7, 1);
    await S.walk('tom_f', [2, 7], 5); S.face('tom_f', 'pl');
    await S.say('汤姆', ['伊莱！你路上看见安妮没有？', '她下午跟丹尼尔去了河边。丹尼尔非说那个山洞里根本没有什么女巫，要带她去看个明白，让她别再信那些鬼话。', '天都黑了，还没回来。', '我得守着我爹——他今天一口水都咽不下去了。']);
    S.give('lantern');
    await S.say('汤姆', ['拿着马灯。顺着小路往南，一直走到河边，崖底下那个洞就是。', '……伊莱。它要是跟你说话，你就回它。别不理它。它最恨没人理它。']);
    farmMood(S);
    S.goal('去南边河边的山洞找安妮');
    S.cp();
  }

  /* ---------------- 会堂：斯通兄弟 ---------------- */
  async function stoneTalk(S) {
    S.face('stone_c', 'pl');
    if (S.f.ph !== 'day2') {
      if (S.f.ph === 'stone') return S.say('斯通兄弟', '天快黑了。回去吧——别走河边。');
      return S.say('斯通兄弟', '愿主与你同在，孩子。');
    }
    if (S.once('stoneHi')) {
      await S.say('斯通兄弟', ['你来了。坐吧。', '昨晚它找你了？……看你脖子上的印子就知道了。']);
    }
    const topics = [
      ['「它是从什么时候开始的？」', async () => {
        await S.say('斯通兄弟', ['三年前的夏天。先是玉米地边那只狗身兔头的东西——汤姆说，你来的那天傍晚也看见了？', '然后是敲墙、啃床柱、扯被子，再后来是喘气、咂嘴。然后，有一天晚上，它开口了。', '我都记在本子上了——桌上那本，你自己翻。']);
      }],
      ['「真有人来降伏过它吗？」', async () => {
        await S.say('斯通兄弟', ['有。前年，据说一位将军——打过大仗、整个田纳西都知道他名字的那位——带着人马和几辆大车，专门来会会它。', '车走到农场外头那条路上，平平的地，轮子忽然就不转了。几匹马怎么抽都拉不动。', '将军骂了一句，说准是那个女巫在捣鬼。林子里就有个声音说：「将军，可以走了。今晚我再来看你。」', '车轮子自己就转起来了。']);
        await S.say('斯通兄弟', ['那天晚上，他带来一个自称会捉女巫的人。腰里别着手枪，说枪里装的是银弹。', '……那人后来是被一路扇着耳光、揪着鼻子，从屋里撵出去的。', '据说将军第二天一早就走了，说他宁可再去打一仗，也不想再跟贝尔家的女巫过一夜。', '——这些都是听人说的，我没亲眼看见。一件事传到第三个人嘴里，就长出腿来了。']);
      }],
      ['「它为什么恨老贝尔？」', async () => {
        await S.say('斯通兄弟', ['它从来不说。', '有人说，老贝尔年轻时在北卡罗来纳做过什么亏心事。也有人说，他跟一个邻居为一桩买卖闹过纠纷，会堂还为这事把他除了名——这倒是真的，簿子上记着。', '可这些，够得上让一个东西夜夜去掐一个老人的脖子吗？', '……孩子，有时候，恨是不要理由的。']);
      }],
      ['「河边那个山洞是怎么回事？」', async () => {
        await S.say('斯通兄弟', ['往南，红河拐弯的地方，崖底下有个山洞。夏天孩子们爱去那儿乘凉。', '它说过，泉眼边那块大石头底下埋着一罐金子。贝尔家几个儿子挖了整整一天，挖出一个大坑——什么也没有。它在旁边笑了一整夜。', '还有一回，一个孩子在洞里卡住了，灯也灭了。都说是它点了一盏灯，把孩子领了出来。', '它会害人，也会救人。……这是我最想不通的地方。', '对了——那个洞里的东西，一块石头也别往外带。老辈人都这么说。']);
      }]
    ];
    for (;;) {
      const left = topics.filter((t, i) => !S.f['tp' + i]);
      if (!left.length) break;
      const r = await S.ask('想问斯通兄弟什么？（还有 ' + left.length + ' 件想问的）', left.map(t => t[0]).concat(['（先不问了）']));
      if (r === left.length) { S.goal('和斯通兄弟谈谈（还有 ' + left.length + ' 件想问的）'); return; }
      S.f['tp' + topics.indexOf(left[r])] = true;
      await left[r][1]();
    }
    await S.say('斯通兄弟', ['等等。拿着这个。', '会堂的赞美诗，我抄了一份。它爱唱歌，唱的都是这本子里的。', '要是哪天它拿歌来考你……你就知道该翻哪儿了。']);
    S.give('hymnal');
    await S.note('hymns');
    await S.say('斯通兄弟', '天快黑了。回去吧——别走河边。');
    S.f.ph = 'stone';
    S.goal('回贝尔家农场（会堂门出去往东）');
    S.cp();
  }

  /* ---------------- 山洞 ---------------- */
  async function lanternOut(S) {
    S.sfx('whisper');
    await S.narr('一阵风从洞的深处吹过来。\n马灯的火苗往一边一倒——灭了。');
    S.plr(1.05); S.amb('drone');
    await S.wait(600);
    await K(S, ['想要光吗，肯塔基小子？', '我给你唱两句。你告诉我，我唱的是哪两首——号数连起来说。', '说对了，我就给你点一盏灯。']);
    await S.narr('黑暗里，它唱了起来。先是一首——');
    await singTwo(S);
    await K(S, '去墙上那块会学人说话的石头跟前，回答我。');
    S.f.asked = true;
    S.goal('在回声石前回答它：两首赞美诗的号数（先唱的在前）');
  }
  async function singTwo(S) {
    sing(S, 'stanne', { beat: .4 });
    await K(S, '「……把它的儿女都带走；他们飞去，被人遗忘……」', { style: 'think' });
    await S.narr('然后是另一首——');
    sing(S, 'martyr', { beat: .4 });
    await K(S, '「……他是否把神圣的头，献给我这样的虫豸？」', { style: 'think' });
  }
  /* 回声石把一串号数学回来：先是你的声音，隔一会儿，远远地又一遍 */
  function echoTones(S, v) {
    [...v].forEach((c, i) => { const f = 392 * Math.pow(2, (+c) / 12); S.tone('sine', f, f, .22, .05, i * .26, 1800); S.tone('sine', f, f * .99, .3, .02, 1.3 + i * .3, 700); S.tone('sine', f, f * .98, .34, .009, 2.6 + i * .34, 450); });
  }
  async function echoRock(S) {
    const e = S.ent('echo');
    if (S.f.ph !== 'cave' || !S.f.asked) return S.narr(e.lit ? '石壁上的螺纹还微微泛着蓝光。' : '一块被水磨得发亮的石壁，上面有人刻了一圈一圈的螺纹。\n你小声说一句话，它要隔好一会儿，才学给你听。');
    const c = await S.ask('回声石前。它在等你的回答。', ['回答它（两首赞美诗的号数）', '「……再唱一遍。」', '（先不答）']);
    if (c === 2) return;
    if (c === 1) {
      S.sfx('laugh'); await K(S, '记性真差。好吧——仔细听。');
      await singTwo(S);
      await S.narr('回声石把最后一个字学了好几遍，一遍比一遍远。');
      return;
    }
    const v = await S.keypad('它在等你的回答。（两首赞美诗的号数，先唱的在前）', ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'], 4);
    if (v == null) return;
    S.sfx('whisper'); echoTones(S, v); await S.wait(300);
    await S.narr('「' + v + '……」\n石壁过了好一会儿，才把你的声音学了一遍。又过了一会儿，远远地，又一遍。');
    if (v !== ANSWER) {
      S.sfx('laugh');
      const n = S.f.echoWrong = (S.f.echoWrong || 0) + 1;
      if (n === 1) {
        await K(S, ['不对，不对。', '斯通那老头给你的本子，你是拿来垫鞋底的吗？']);
        S.toast('提示：按 J 打开档案，重读《会众诗歌》');
      } else if (n === 2) {
        await K(S, ['还是不对。', '先唱的那首，斯通那老头的老婆下葬那天，会堂里唱过。他在本子边上写着呢。']);
      } else if (n === 3) {
        await K(S, ['唉。第一首是九十一，记住了？', '第二首……「虫豸」。你自己找。']);
      } else {
        await K(S, '九十一，七十四。笨孩子。');
      }
      return;
    }
    S.sfx('chime'); e.lit = true;
    await K(S, '……好孩子。');
    S.f.ph = 'lit';
    S.show('wisp'); S.place('wisp', 8, 8);
    await S.alpha('wisp', 1, 500);
    S.plr(1.7);
    await S.narr('黑暗里亮起一团蓝幽幽的火，有拳头那么大，不烫，也不冒烟。\n它在你面前晃了晃，往洞的左边飘去。');
    await S.walk('wisp', [4, 6], 3.2);
    S.sfx('thud'); S.shake(300, 1);
    S.tile(4, 5, '.');
    await S.narr('蓝光贴着石壁一照，你这才看清——那里有一道窄缝，刚好容一个人侧着身子挤过去。\n缝的另一头，有人在小声地哭。');
    await S.walk('wisp', [4, 4], 3);
    S.goal('跟着蓝光，挤过石缝找安妮');
    S.cp('lit');
  }
  async function anneCave(S) {
    S.face('anne_c', 'pl');
    if (S.f.ph === 'flee') return S.say('安妮', '它来了——快跑！');
    if (S.f.ph !== 'lit') return;
    await S.narr('安妮蜷在最里头，一只脚卡在两块石头中间，裙子上全是泥。');
    await S.say('安妮', ['伊莱……？真的是你？', '我听见奶奶在里头唱歌……我奶奶死了六年了。我就跟着走……然后灯就灭了。', '我的脚拔不出来。']);
    const r = await S.ask('', ['（扶住她，慢慢往外拔）', '（去搬那块石头）']);
    if (r === 1) await S.narr('你咬着牙去推那块石头。它像长在地上一样，纹丝不动。');
    else await S.narr('你扶着她的腿往外拔。她疼得直抽气，脚还是卡得死死的。');
    await K(S, '左脚。往左拧，傻姑娘。');
    S.sfx('thud');
    await S.narr('安妮照着做了。「咔」的一声，脚出来了。');
    await S.say('安妮', '……谢谢你，凯特。', { style: 'whisper' });
    await K(S, ['别谢我。', '安妮——别嫁给他。']);
    await S.narr('安妮没有回答。');
    await S.wait(500);
    S.sfx('sting');
    S.show('dog'); S.place('dog', 19, 5, 1); S.ent('dog').alpha = 1;
    await S.narr('洞的另一头，传来一声低低的吠叫。\n像狗。又不像。');
    await K(S, ['……黑狗回来了。', '那是我们家的老大。我管不住它。', '跑吧。顺着我的光跑。'], { style: '' });
    S.sfx('chime');
    await S.alpha('wisp', 0, 400);
    trail(S);
    await S.narr('蓝火「噗」地散开，变成一串豆粒大的光点，一路落下去——\n落进来时的那条石缝，一直落到洞口。');
    S.f.ph = 'flee';
    S.follow('anne_c', true);
    S.amb('drone');
    S.goal('带安妮逃出山洞！顺着蓝色的光点跑（洞口在南边）');
    S.cp('cave');
    startDog(S, .6);
  }
  function trail(S, on = true) { TRAIL.forEach((p, i) => S.show('tr' + i, on)); }
  function startDog(S, wait) {
    dogT = 0;
    S.chase('dog', { spd: 3.0, zone: (x, y) => y <= 15, wait: wait || 0, catch: dogCatch });
  }
  async function dogCatch(S) {
    S.stop('dog');
    await S.scare('face', { spr: '@blackdog', dur: 1 });
    await S.die('一团比黑暗还黑的东西扑在了你背上。\n你最后听见的，是安妮的尖叫，和一个很近很近的声音：\n「……我说过的，我管不住它。」', '你被黑狗扑倒了');
  }
  async function caveEscape(S) {
    S.stop('dog'); S.follow('anne_c', false); trail(S, false);
    S.amb('river');
    await S.narr('你们跌跌撞撞地冲出洞口，摔在河滩冻硬的泥地上。');
    await S.alpha('dog', 0, 600);
    await K(S, '……黑狗，回来。');
    await S.narr('身后的黑暗里，那东西停住了。\n然后，一点一点地，退了回去。');
    S.place('anne_c', 10, 16, 2); S.place('dan_c', 13, 16, 1); S.face('pl', 1);
    await S.say('丹尼尔', ['安妮！', '……我在洞口等了你们一个时辰。我的脚……我进不去……']);
    await S.narr('安妮看着他，看了很久，没有说话。\n然后她转过头，望着漆黑的洞口。');
    await S.say('安妮', '……它刚才救了我，丹尼尔。', { style: 'whisper' });
    await S.fade(1, 900);
    S.hide('anne_c'); S.hide('dan_c'); S.hide('wisp');
    await S.card('十二月十九日　清晨', '', '你们回到农舍的时候，已经是后半夜了。\n\n鸡还没叫，贝尔太太就把所有人都叫醒了。\n老贝尔躺在床上，怎么叫，也叫不醒。');
    S.f.ph = 'collapse';
    S.take('lantern');
    await S.go('house', 2, 9, 2, { ms: 700 });
  }

  /* ---------------- 药瓶 ---------------- */
  async function vialScene(S) {
    S.f.vialSeen = true;
    S.show('vialE');
    await S.narr('药柜里，医生留下的那只棕色瓶子不见了。\n原来的位置上，立着一个拇指大的小玻璃瓶。');
    await S.narr('瓶子里装着大半瓶黑乎乎的东西，像烟灰泡在水里。\n你拿起来轻轻一晃，它就往上冒雾。');
    S.hide('vialE'); S.give('vial', true);
    S.face('tom_h', 'pl');
    await S.say('汤姆', '这是什么东西？谁放的？');
    S.sfx('laugh');
    await K(S, '是我放的。', { style: 'big' });
    await K(S, ['我昨天晚上给他喂了一大口。', '这下，他好不了了。']);
    S.face('mrs', 3);
    await S.say('贝尔太太', '……主啊。', { style: 'whisper' });
    await S.say('汤姆', '伊莱，你说怎么办？');
    const r = await choose(S, '汤姆和贝尔太太都看着你手里的小瓶子。', ['「拿炉边那只猫试试。」', '「扔进火里。」', '「……我先尝一点，看看是不是药。」']);
    if (r === 2) return badEnd(S);
    if (r === 0) {
      await S.say('汤姆', '……好。');
      S.hide('tom_h');
      await S.fade(1, 600); await S.wait(700);
      S.ent('catH').s.dead = true;
      await S.fade(0, 600);
      S.place('tom_h', 14, 4, 1);
      await S.narr('汤姆回来的时候，脸是白的。');
      await S.say('汤姆', ['我拿麦秆蘸了一点，抹在炉边那只花猫的舌头上。', '它跳了一下，打了个滚……', '……就再也没动过。']);
      await S.say('伊莱', '烧了它。');
    }
    S.take('vial');
    S.f.ph = 'burnt';
    S.sfx('open'); await S.walk('pl', [13, 4], 5);
    S.pos(3, 3, 3);
    await S.narr(r === 0 ? '你冲到壁炉前。花猫还躺在炉边，身子已经硬了。\n你把瓶子扔进了火里。' : '你冲到壁炉前，把瓶子扔进了火里。');
    S.sfx('glass'); S.shake(500, 3); S.fx('flash');
    S.tone('sawtooth', 900, 120, 1.4, .06, 0, 1600); S.tone('sine', 1800, 2400, 1.1, .03, .1, 4000);   // 蓝火蹿上烟囱的「呼——」
    const fire = S.ent('hearth'); fire.s.blue = true; fire.light = Object.assign({}, FIRE_BLUE);
    await S.narr('「砰」的一声，瓶子炸了。\n一股蓝色的火苗蹿上了烟囱，噼噼啪啪，烧了好久好久。');
    await K(S, '……晚了。', { style: '' });
    await S.wait(500);
    await S.fade(1, 1000);
    fire.s.blue = false;
    if (r === 1) {
      S.ent('catH').s.dead = true;
      await S.card('十二月十九日　夜里', '', '后来汤姆跟你说了一件事。\n\n你攥着瓶子从他身边挤过去的时候，\n他用麦秆从瓶口偷偷蘸走了一滴，\n抹在了炉边那只花猫的舌头上。\n\n猫跳了一下，打了个滚，\n就再也没动过。');
    }
    await S.card('十二月二十日　清晨', '', '老贝尔再也没有醒过来。\n\n他咽气的时候，屋子里很安静。\n然后，那个声音唱起歌来——\n唱得那么高兴，一直唱到天亮。');
    S.f.ph = 'funeral';
    S.amb('wind');
    await S.go('grave', 7, 10, 3, { ms: 800 });
  }
  async function badEnd(S) {
    await S.say('伊莱', '……医生的药没了。也许这个就是药呢？总得有人先试试。');
    await S.narr('你拔开软木塞。\n一股甜丝丝的味道，像烧焦的蜂蜜。');
    S.face('mrs', 'pl');
    await S.say('贝尔太太', '伊莱，别——', { style: 'big' });
    await S.narr('你抿了一小口。');
    S.sfx('sting'); S.dark(.95); S.plr(1.2); S.fx('red');
    await S.wait(900);
    await S.narr('舌头先是麻，然后是胀。\n你想说话，可嘴里像含着一块木头。');
    S.sfx('heart');
    await K(S, ['……你看，肯塔基小子。', '现在你知道，老贝尔这三年，每天晚上是什么滋味了。']);
    S.sfx('laugh');
    await S.end({ bad: true, id: 'spoon', title: '一匙不够', text: '那年冬天，红河边的人说，贝尔家一连死了两个人：\n一个是老贝尔，\n一个是从肯塔基来帮工的小伙子。\n\n下葬那天，林子里有人唱歌，唱的是一支酒馆里的小调。\n\n开春以后，洛根县你娘的家里收到一个小布包，\n里面是一枚西班牙银币。\n是谁寄的，没有人知道。' });
  }

  /* ---------------- 葬礼 ---------------- */
  async function funeralScene(S) {
    S.f.buried = true;
    S.ent('pit').open = false;
    await S.narr('冻土太硬，挖墓的人刨了整整一个上午。\n来送葬的人站满了山坡，比贝尔家这些年见过的客人都多。');
    await S.say('斯通兄弟', ['主啊，我们把我们的弟兄交还给你。', '尘归于尘，土归于土。愿他在你那里，得着这世上没有给过他的安息。']);
    for (let i = 0; i < 3; i++) { S.sfx('thud'); await S.wait(420); }
    await S.narr('铁锹铲起冻土，一锹一锹落在棺材盖上。\n咚。咚。咚。');
    await S.wait(500);
    S.sfx('laugh'); S.shake(400, 1);
    sing(S, 'brandy', { beat: .3, vol: .055, type: 'square', lp: 1800, slide: 1.02, drunk: true });
    await K(S, '「给我摇过来一点白兰地哟——摇呀，摇呀，摇——」', { style: 'big' });
    await S.narr('一个又尖又亮的声音，在坟头上方唱了起来。\n是酒馆里醉汉们唱的那种小调。');
    sing(S, 'brandy', { beat: .27, vol: .06, type: 'square', lp: 2000, slide: 1.03, drunk: true });
    await K(S, ['「给我摇过来一点白兰地哟——」', '「……我要好好地快活快活！」'], { style: 'big' });
    S.bubble('anne_g', '!', 1200); S.bubble('stone_g', '…', 1500);
    await S.narr('安妮捂住了耳朵。斯通兄弟提高了嗓门，一遍一遍地念着祷文，可怎么也盖不过那歌声。');
    await S.narr('那歌声一直跟着送葬的人走下山坡，走进屋里，\n唱到很晚很晚。');
    S.goal('和送葬的人说说话；然后下山回家');
    S.cp();
  }
  async function anneGrave(S) {
    S.face('anne_g', 'pl');
    if (S.f.anneAsk) return S.say('安妮', '开春以后，我会告诉他的。');
    S.f.anneAsk = true;
    await S.say('安妮', ['伊莱。', '那天在洞里，它说「别嫁给他」的时候……我第一次觉得，它不是在吓唬我。']);
    const r = await choose(S, '「你说，我该不该嫁给丹尼尔？」',['「嫁不嫁，是你自己的事。不是它的。」', '「……也许它说得对。」', '「我不知道。」']);
    if (r === 0) await S.say('安妮', ['……你是第一个这么跟我说的人。', '可我还是不想再听它哭了。']);
    else if (r === 1) await S.say('安妮', '连你也这么觉得。');
    else await S.say('安妮', '我也不知道。');
    await S.say('安妮', '开春以后，我会告诉他的。');
  }

  /* ---------------- 春天：告别 ---------------- */
  async function finale(S) {
    S.f.ph = 'spring_end';
    S.goal('春天的最后一顿晚饭');
    await S.narr('晚饭。和你来的第一天一样：玉米饼，熏肉，一屋子人。\n只少了一个。');
    await S.wait(500);
    await knocks(S, 3, 500);
    await S.narr('墙板里，轻轻地敲了三下。');
    await K(S, ['……我要走了。', '七年以后，我再回来。']);
    S.face('mrs', 3);
    await S.say('贝尔太太', '凯特……');
    await K(S, '贝尔太太，你要保重。你是世上最好的女人。');
    await K(S, '肯塔基小子。');
    S.bubble('pl', '?', 1000);
    await K(S, '猜了一冬天了。你说——我到底是什么？');
    const r = await choose(S, '满屋子的人都在等你的回答。', ['「林子里那座坟里的人。」', '「老凯特的巫物。」', '「一个被惊扰了的灵。」', '「……我不知道。也许谁都不知道。」']);
    if (r === 0) { S.sfx('laugh'); await K(S, '那颗牙？早就找着了。在你枕头底下。'); }
    else if (r === 1) { S.sfx('laugh'); await K(S, '老凯特？她连自己家的鸡都管不住。'); }
    else if (r === 2) await K(S, '那是我头一天晚上骗你们的。你们一直记着。');
    else { await S.wait(700); await K(S, ['……', '这是你这一冬天，说过的最聪明的一句话。']); }
    let kept = false;
    if (S.has('pebble')) {
      S.sfx('sting');
      await K(S, ['还有一件事。', '你兜里那块白石子，是我家的。']);
      await S.think('（石子在兜里，忽然凉得扎手。）');
      const k = await choose(S, '它在等。', ['（把石子放在炉台上）「……还给你。」', '「我捡的，就是我的。」']);
      if (k === 0) { S.take('pebble'); S.sfx('chime'); await S.narr('你把石子放在炉台上。一眨眼的工夫，它就不见了。'); await K(S, '……好孩子。'); }
      else { kept = true; S.sfx('laugh'); await K(S, ['好啊。', '那你就带着它吧，肯塔基小子。带回家去。']); }
    }
    if (!kept) {
      await K(S, ['你娘的银币，别老缝在衣服里了。', '寄回去吧。洛根县今年冬天冷，她的柴火不够。']);
      await S.think('（……你从来没跟任何人提过娘的柴火。）');
    }
    await S.wait(600);
    S.sfx('thud'); S.shake(500, 2);
    await S.narr('烟囱里「咕咚」一声。\n有个圆滚滚的东西顺着烟道滚了下来——像一颗炮弹。');
    const sm = S.ent('smoke'); sm.s.k = 0; S.show('smoke'); S.ent('smoke').alpha = 1;
    S.sfx('glass'); S.fx('flash');
    await S.narr('它落进炉膛，「噗」地炸开，\n变成一大团灰白的烟，在屋子里慢慢散开。');
    for (let i = 1; i <= 10; i++) { sm.s.k = i / 10; await S.wait(90); }
    await S.alpha('smoke', 0, 900);
    await S.narr('烟散了。\n屋里很静。静得能听见炉火噼啪响。');
    S.face('anne', 'pl');
    await S.say('安妮', '……它走了？');
    S.face('stone', 'pl');
    await S.say('斯通兄弟', '它说，七年。');
    await S.fade(1, 1400);
    const tail = '一八二八年，那个声音果然回来过一次。\n它在贝尔家一个儿子的床边，絮絮叨叨地说了好几个晚上。\n临走时，它说一百零七年以后，还会再来。到了那一年，什么也没有来。\n\n安妮后来嫁给了镇上一位教书先生。\n很多年以后，有人说那个声音从头到尾都是他弄出来的；\n也有人说是邻居，是腹语，是一场官司，是一瓶药。\n没有一种说法，能解释所有的事。\n\n';
    if (kept) return S.end({ id: 'pebble', title: '洞里的石子', text: tail + '至于伊莱——开春那天他就回了肯塔基，兜里揣着那块白石子。\n\n那年夏天，洛根县他家的玉米地边上，有人看见一只黑东西：\n狗的身子，兔子的脑袋。\n\n从那以后，每天夜里，墙板里都会轻轻地敲三下。' });
    await S.end({ id: 'spring', title: '第八夜　完', text: tail + '红河拐弯处的那个山洞，如今每年都有人提着灯进去。\n据说，从洞里带走一块石头的人，都会倒霉。\n\n至于伊莱——开春那天他就回了肯塔基。\n那枚银币，他寄回了家。' });
  }

  /* ================= 地图 ================= */
  const MAPS = {};
  let houseKn = 6, dogT = 0;

  /* ---------------- 贝尔家农场 ---------------- */
  MAPS.farm = {
    amb: 'night', dark: .62, plr: 3, wall: 'wood', floor: 'dirt',
    legend: { 'Y': 'roof', 'V': 'barnroof', 'H': 'logw', 'J': 'barnw', 'Q': 'corn', 'S': 'snow' },
    tileOpts: { grassC: '#3a4232' },
    rows: [
      'PPPPPPPPPPPPPPPPPPPPPPPPPPPP',
      'P""S"""""""""""S""""""""""SP',
      'P"YYYYYYY""""""VVVVVVVV""""P',
      'P"YYYYYYY""""""VVVVVVVV""S"P',
      'P"HHHHHHH""""""JJJJJJJJ""""P',
      'P""""d""""""""""""d""""""""P',
      'P""""d""""""""""""d"""S""""P',
      'dddddddddddddddddddddddddddd',
      'P""S"d"""ffffffffffff""""""P',
      'P""""d"""QQQQQQQQQQQQ""""""P',
      'P"S""d"""dddddddddddd"""S""P',
      'P""""d"""QQQQQQQQQQQQ""""""P',
      'P""""d"""QQQQQQQQQQQQ""""""P',
      'P""""d"""QQQQQQQQQQQQ""""""P',
      'P""S"d"""""""""""""""""""""P',
      'P""""d""""""""""""""""""S""P',
      'PPPPPdPPPPPPPPPPPPPPPPPPPPPP'],
    ents: [
      { id: 'cabdoor', x: 5, y: 4, spr: 'cabdoor', async on(S) {
        if (S.f.ph === 'arrive' && !S.f.beast) await beastSight(S);
        if (S.f.ph === 'missing') return S.narr('安妮还没找着。屋里有贝尔太太守着——你得去河边！');
        S.sfx('open'); await S.go('house', 11, 10, 3);
      } },
      { id: 'cw1', x: 3, y: 4, spr: 'cabwin', lit: true, light: { r: 1.6, col: 'rgba(255,170,80,.14)', dy: 10 }, on: S => S.narr(S.ent('cw1').lit ? '木屋的小窗透出炉火的光。窗纸上，有人影晃过去。' : '木屋的小窗。白天看，窗纸上糊着一层烟灰。') },
      { id: 'cw2', x: 7, y: 4, spr: 'cabwin', lit: true, light: { r: 1.6, col: 'rgba(255,170,80,.14)', dy: 10 }, on: S => S.narr('另一扇小窗。窗台上积着雪，雪上有一串小小的爪印——从窗台这头，走到那头，就没有了。') },
      { id: 'barnd', x: 18, y: 4, spr: 'barndoor', on: S => S.narr('谷仓的大门。里头堆着今年的烟叶和玉米，一股甜丝丝的霉味。\n门闩上挂着一串晒干的辣椒——汤姆说是他娘挂的，「辟邪」。') },
      { id: 'cat', x: 19, y: 5, spr: 'cat', on: S => S.narr('谷仓的花猫，蹲在门口舔爪子。\n它忽然停下来，盯着你身后的空地，尾巴一下一下地甩。') },
      { x: 10, y: 5, spr: 'well', on: S => S.narr('一口石砌的井。井绳冻得硬邦邦的。\n往下看，水面上浮着一层薄冰，冰面映着你的脸——还有你肩膀后面一小块黑。') },
      { x: 12, y: 5, spr: 'woodpile', on: S => S.narr('劈好的柴火码得整整齐齐。斧头还插在木墩上，斧柄上缠着一圈红布条。') },
      { id: 'tom_f', x: 13, y: 6, spr: '@tom', dir: 1, on: S => tomFarm(S) },
      { x: 20, y: 6, w: 2, spr: 'trough', on: S => S.narr('牲口的水槽，结了一层冰。冰上有一道一道的划痕，像有什么东西用指甲抠过。') },
      { x: 1, y: 6, spr: 'signpost', on: S => S.narr('路牌，字是用烧红的铁条烫上去的：\n←　红河会堂　　　　河边　↓\n→　贝尔家墓地') },
      { x: 9, y: 8, spr: 'invisible', solid: true, on: S => S.narr('玉米早就收过了，只剩下一地枯秆，风一吹，沙沙地响。\n三年前，老贝尔就是在这片地边上，看见了那只东西。') },
      { id: 'beast', x: 14, y: 10, spr: 'beast', hidden: true, solid: false, light: { r: .9, col: 'rgba(255,40,40,.12)' } },
      { id: 'xW', x: 0, y: 7, spr: 'invisible', async touch(S) {
        const ph = S.f.ph;
        if (ph === 'day2' || ph === 'stone') return S.go('church', 7, 9, 3);
        S.pos(1, 7, 2);
        if (ph === 'arrive') return S.narr('那是你来时的路。……先去木屋见过主人家吧。');
        if (ph === 'missing') return S.narr('会堂在西边——可安妮在南边的河边！');
        await S.narr('天黑了。汤姆说过，夜里别一个人出门。');
      } },
      { id: 'xE', x: 27, y: 7, spr: 'invisible', async touch(S) {
        const ph = S.f.ph;
        if (ph === 'day2' || ph === 'stone') return S.go('grave', 7, 10, 3);
        S.pos(26, 7, 1);
        await S.narr(ph === 'missing' ? '那边是墓地。安妮不会去那儿。河边——往南！' : '那边是贝尔家的墓地。黑灯瞎火的，还是别去了。');
      } },
      { id: 'xS', x: 5, y: 16, spr: 'invisible', async touch(S) {
        if (S.f.ph === 'missing') return S.go('cave', 2, 17, 2);
        S.pos(5, 15, 3);
        await S.narr('往南是河边。冬天的红河又急又冷。\n……没事最好别往那边去。');
      } }
    ],
    async enter(S, first) {
      farmMood(S);
      const ph = S.f.ph;
      if (ph === 'arrive') {
        S.place('tom_f', 13, 6, 1);
        if (first) {
          await S.narr('一路上下着零星的雪。\n红河边的这座农场比你想的要大：一栋原木屋，一座谷仓，一大片收完了的玉米地。');
          await S.narr('谷仓边上有个年轻人在劈柴。木屋的烟囱冒着烟。');
          S.goal('去木屋，见贝尔一家');
        }
        return;
      }
      if (ph === 'stone') return missingScene(S);
      if (ph === 'day2' && S.once('farmDay')) { S.place('tom_f', 13, 6, 1); await S.narr('白天的农场看起来一点也不吓人。\n雪地上只有鸡爪印、马蹄印，还有一串说不清是什么的小脚印，绕着木屋走了一圈。'); }
      if (ph === 'missing') farmMood(S);
    }
  };

  /* ---------------- 木屋 ---------------- */
  MAPS.house = {
    amb: 'fire', dark: .58, plr: 3, wall: 'wood', floor: 'wood',
    tileOpts: { woodC: '#5e4228', rugC: '#6a3a2a', carpetC: '#4a3a46' },
    rows: [
      '#######################',
      '#######################',
      '#.........#ccccc#ccccc#',
      '#.........#ccccc#ccccc#',
      '#.........#ccccc#ccccc#',
      '#.........#############',
      '#.........#############',
      '#..rrrr...............#',
      '#..rrrr...............#',
      '#..rrrr...............#',
      '#.....................#',
      '###########.###########'],
    ents: [
      /* 正厅 */
      { id: 'hearth', x: 2, y: 2, w: 2, spr: 'hearth', light: FIRE, async on(S) {
        const ph = S.f.ph;
        if (ph === 'evening' || ph.startsWith('night')) return S.narr('炭火只剩一层暗红。\n烟囱里呜呜地响——是风。……应该是风。');
        if (ph === 'collapse') return S.narr('炉火烧得很旺。可屋里谁也不觉得暖和。');
        await S.narr(S.once('hearthLook') ? '石头垒的大壁炉，烟熏得黢黑。铁钩上挂着一口锅，炖着豆子。\n炉台上摆着一排干辣椒，还有一只给孩子们烤玉米的长柄铁夹。' : '炉火噼噼啪啪地响。');
      } },
      { id: 'smoke', x: 2, y: 2, spr: 'smoke', hidden: true, solid: false, z: 1, ox: 8, oy: 4 },
      { x: 5, y: 1, spr: 'window', on: S => S.narr(S.f.ph === 'day2' || S.f.ph === 'stone' || S.f.ph === 'collapse' ? '窗外是白茫茫的雪地，一直铺到玉米地那头。' : '窗外黑漆漆的。玻璃上结了霜花，霜花中间，不知被谁用手指划开了一道口子。') },
      { x: 7, y: 1, spr: 'rifle', on: S => S.narr('墙上挂着老贝尔的长枪。\n三年前，他就是用这把枪，朝玉米地里那只东西开了一枪。\n枪托上刻着一行小字：北卡罗来纳，1790。') },
      { x: 8, y: 2, spr: 'cabinet', col: '#5a3c24', on: S => S.narr('碗柜。几只锡盘，一摞粗陶碗，还有一只缺了口的蓝花茶壶——贝尔太太的嫁妆。') },
      { x: 9, y: 2, spr: 'barrel', on: S => S.narr('一桶玉米面。桶盖上压着一块石头。\n汤姆说，不压着的话，第二天早上面粉会撒得满屋都是，地上全是小手印。') },
      { id: 'desk', x: 9, y: 4, spr: 'desk', col: '#5a3c24', async on(S) {
        await S.narr('小桌上摆着贝尔家的大圣经。扉页上一行一行记着家里人的生日，最后一行墨迹还很新。');
        if (S.f.ph === 'evening' && S.once('bibleK')) {
          await K(S, '「……我们若认自己的罪，神是信实的……」');
          await S.narr('它在你背后念。念得比斯通兄弟还熟。');
        }
      } },
      { id: 'bibleS', x: 9, y: 4, spr: 'bible', z: 1, oy: -7, solid: false },
      { id: 'table', x: 4, y: 8, w: 2, spr: 'table2', col: '#6b4a30', on: S => S.narr(S.f.ph === 'spring' || S.f.ph === 'spring_end' ? '饭桌。老贝尔的位子空着，谁也没有去坐。' : '一张厚木板钉成的饭桌。桌角有一道新鲜的划痕——三道，像爪子挠的。') },
      { id: 'nuts', x: 4, y: 8, spr: 'nuts', z: 1, oy: -6, solid: false, hidden: true },
      { id: 'pallet', x: 1, y: 9, h: 2, spr: 'pallet', on: S => sleepNight(S) },
      { id: 'wheel', x: 9, y: 8, spr: 'spinwheel', on: S => S.narr(S.ent('wheel').s.spin ? '纺车吱呀吱呀地转。安妮纺得很慢，线老是断。' : '贝尔太太的纺车。线轴上还缠着半截没纺完的羊毛。') },
      { id: 'bucket', x: 10, y: 10, spr: 'bucket', full: true, on: S => S.narr(S.ent('bucket').s.hat ? '水桶里漂着丹尼尔的帽子。他走的时候忘了捞。' : '一桶井水，水面结了一层薄冰。') },
      { x: 13, y: 8, spr: 'churn', on: S => S.narr('黄油搅桶。贝尔太太说，这阵子黄油怎么也打不出来——「它」不让。') },
      { x: 16, y: 7, spr: 'sack', on: S => S.narr('几袋玉米种子，口袋扎得紧紧的。袋子上用炭写着：明年春天。') },
      { x: 17, y: 7, spr: 'crate', on: S => S.narr('一箱烟叶，是要拉到克拉克斯维尔去卖的。今年的价钱不好。') },
      { x: 21, y: 7, spr: 'stairsup', solid: true, on: S => S.narr('上阁楼的梯子。阁楼里挂满了熏烟叶。\n汤姆说，孩子们原来都睡在阁楼上，后来没人敢上去睡了。') },
      { id: 'lampH', x: 20, y: 10, spr: 'lamp', off: true, light: { r: 3.6, col: 'rgba(255,200,120,.2)', flick: true }, on: S => lampUse(S) },
      { id: 'catH', x: 4, y: 3, spr: 'cat', hidden: true, solid: false, on: S => S.narr(S.ent('catH').s.dead ? '炉边的花猫。身子已经硬了，舌头露在外面，是黑的。' : '一只花猫蜷在炉边打盹。\n它忽然睁开眼，盯着里屋那扇门，喉咙里呜呜地响。') },
      { id: 'doorA', x: 13, y: 6, spr: 'door', col: '#4a3220', async on(S) {
        const ph = S.f.ph;
        if (ph === 'night1b') return S.narr('尖叫声是从右边那间——安妮的房间传出来的！');
        if (ph === 'night1c') return bellNight(S);
        S.sfx('open'); S.pos(13, 4, 3);
        if (ph === 'collapse' && S.once('bedAcol')) {
          S.face('mrs', 'pl');
          await S.narr('老贝尔仰面躺着，眼睛半睁半闭。\n呼吸又浅又慢，像隔着一层水。');
          await S.say('贝尔太太', ['伊莱，你回来了……安妮呢？……好，好。', '他的药不见了。医生留的那瓶药，昨天晚上还在的。', '药柜里多了一个小瓶子，我从来没见过。你帮我看看。']);
          S.goal('查看药柜');
        }
      } },
      { id: 'doorB', x: 19, y: 6, spr: 'door', col: '#4a3220', async on(S) {
        if (S.f.ph === 'night1b') return anneNight(S);
        S.sfx('open'); S.pos(19, 4, 3);
      } },
      /* 老贝尔夫妇的卧室 */
      { id: 'exitA', x: 13, y: 5, spr: 'invisible', solid: true, on: S => { S.sfx('close'); S.pos(13, 7, 0); } },
      { id: 'bedA', x: 11, y: 2, h: 2, spr: 'bellbed', col: '#5a6a8a', async on(S) {
        const ph = S.f.ph;
        if (!S.ent('bedA').full) return S.narr('老贝尔夫妇的床。床头的木板上，有几道深深的指甲印。');
        if (ph === 'collapse' || ph === 'burnt') return S.narr('他的手搁在被子外面，凉得像井水。\n嘴唇动了动，可什么声音也没有。');
        if (ph === 'day2' || ph === 'stone') {
          if (S.once('bellDay')) { await S.narr('老贝尔醒着，眼睛直直地望着房梁。'); await S.say('老贝尔', ['……它昨晚跟你说了北卡罗来纳的事？', '那是三十年前的事了。三十年了……', '孩子，你记着：人做的事，不会因为搬了家，就跟着搬没了。'], { style: 'whisper' }); return; }
          return S.narr('他闭上了眼睛。脸颊还在一下一下地抽。');
        }
        await S.narr('老贝尔睡着了。眉头锁得紧紧的，嘴里含含糊糊地念着什么。\n你凑近了听——是一个女人的名字。');
      } },
      { x: 13, y: 1, spr: 'window', on: S => S.narr('卧室的小窗。窗框上钉着一块马蹄铁，开口朝上。') },
      { id: 'cupA', x: 15, y: 2, spr: 'cabinet', col: '#4a3020', async on(S) {
        if (S.f.ph === 'collapse' && !S.f.vialSeen) return vialScene(S);
        if (S.once('docHint')) await S.narr('药柜里有几包草药、一卷绷带。最上一格压着一张便条。');
        await S.note('doctor');
      } },
      { id: 'vialE', x: 15, y: 2, spr: 'vial', z: 1, oy: -9, hidden: true, solid: false },
      /* 安妮的房间 */
      { id: 'exitB', x: 19, y: 5, spr: 'invisible', solid: true, on: S => { S.sfx('close'); S.pos(19, 7, 0); } },
      { id: 'bedB', x: 20, y: 2, h: 2, spr: 'bellbed', col: '#8a5a6a', skin: '#f4d4b8', hair: '#6a4026', async on(S) {
        if (S.ent('bedB').full) return S.narr('安妮蜷在被子里，被子拉过了头顶。\n被面在一起一伏，她没有睡着。');
        await S.narr('安妮的床。枕头底下露出一把剪刀的柄——听说压在枕头底下，能剪断噩梦。');
      } },
      { id: 'dresserB', x: 17, y: 2, spr: 'dresser', col: '#6a4a34', async on(S) {
        if (S.once('diaryHint')) await S.narr('五斗柜上摆着一把木梳，梳齿断了好几根。\n抽屉没关严，露出一本小本子的一角。');
        await S.note('diary');
      } },
      { x: 19, y: 1, spr: 'window', on: S => S.narr('安妮房间的窗户，从里面用木条钉死了。') },
      { x: 21, y: 4, spr: 'doll', col: '#d8c8b0', on: S => S.narr('一只布娃娃，脸是用炭笔画的。\n不知道是谁，把它的两只眼睛都涂黑了。') },
      /* 人 */
      { id: 'bell', x: 3, y: 8, spr: '@bell', dir: 2, on: S => S.narr('老贝尔低着头，一口一口地嚼着，嚼了很久也咽不下去。') },
      { id: 'mrs', x: 6, y: 8, spr: '@mrs', dir: 1, async on(S) {
        S.face('mrs', 'pl');
        const ph = S.f.ph;
        if (ph === 'evening') return S.say('贝尔太太', ['记住那三件事，孩子：别看，别抢，别求它——问它。', '……我守着他。你睡吧。']);
        if (ph === 'day2' || ph === 'stone') return S.say('贝尔太太', '斯通兄弟是个好人。它也敬他三分。去吧。');
        if (ph === 'missing') return S.say('贝尔太太', '安妮……伊莱，求你了，把她找回来。');
        if (ph === 'collapse') return S.say('贝尔太太', S.f.vialSeen ? '……' : '药柜。伊莱，你看看那个小瓶子。');
        await S.say('贝尔太太', '……');
      } },
      { id: 'anne', x: 4, y: 7, spr: '@anne', dir: 0, async on(S) {
        S.face('anne', 'pl');
        const ph = S.f.ph;
        if (ph === 'day2' || ph === 'stone') return S.say('安妮', ['丹尼尔说，他今天要带我去河边走走。', '他说，等我看清楚了，那里什么都没有，我就不会再怕了。']);
        if (ph === 'collapse') return S.say('安妮', '……爸爸会好起来的，对吧？');
        await S.say('安妮', '……');
      } },
      { id: 'dan', x: 5, y: 7, spr: '@dan', dir: 0, on: S => S.say('丹尼尔', '……') },
      { id: 'stone', x: 4, y: 4, spr: '@stone', dir: 0, on: S => S.say('斯通兄弟', '……') },
      { id: 'tom_h', x: 14, y: 4, spr: '@tom', dir: 1, hidden: true, async on(S) {
        S.face('tom_h', 'pl');
        await S.say('汤姆', S.f.vialSeen ? '……' : '娘说药柜里有个怪瓶子。你去看看。');
      } },
      { id: 'xHouse', x: 11, y: 11, spr: 'invisible', async touch(S) {
        const ph = S.f.ph;
        if (ph === 'evening' || ph.startsWith('night')) { S.pos(11, 10, 3); return S.narr('贝尔太太说过，夜里别出门。'); }
        if (ph === 'collapse' || ph === 'burnt') { S.pos(11, 10, 3); return S.narr('老贝尔……现在不能走开。'); }
        await S.go('farm', 5, 5, 0);
      } }
    ],
    async enter(S, first) {
      stage(S);
      const ph = S.f.ph;
      if (ph === 'arrive') return supper(S);
      if (ph === 'collapse' && S.once('collapseIn')) {
        await S.narr('屋里挤满了人，可是没有一个人说话。\n里屋传来贝尔太太压得很低的哭声。');
        S.goal('去老贝尔的房间（左边那扇门）');
        S.cp();
      }
      if (ph === 'missing' && S.once('missIn')) await S.narr('屋里只有贝尔太太守在里屋。她听见门响，探出头来，眼睛是红的。');
      if (ph === 'spring') return finale(S);
    },
    tick(S, dt) {
      if (S.f.ph !== 'evening' || W.busy || !S.ent('lampH').off) return;   // 灯点着的时候，它不出声
      houseKn -= dt;
      if (houseKn <= 0) { houseKn = 6 + Math.random() * 6; S.sfx(['knock', 'tick', 'tear', 'whisper'][S.rand(4)]); }
    }
  };

  /* ---------------- 红河会堂 ---------------- */
  MAPS.church = {
    amb: 'room', dark: .4, plr: 3.2, wall: 'wood', floor: 'wood',
    tileOpts: { woodC: '#6a4e32' },
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
      '#######..#######'],
    ents: [
      { x: 7, y: 1, spr: 'cross', on: S => S.narr('一个粗木钉成的十字架。底下的墙板被烟熏得发黄。') },
      { x: 3, y: 1, spr: 'window', lit: true, on: S => S.narr('窗外是光秃秃的橡树林。树枝上落满了乌鸦，一只也不叫。') },
      { x: 12, y: 1, spr: 'window', lit: true, on: S => S.narr('窗台上摆着一只空的锡烛台。') },
      { id: 'hboard', x: 10, y: 1, spr: 'hymnboard', on: S => S.narr('墙上的诗歌板，挂着上礼拜天唱过的几首的号数：12、58、91。\n斯通兄弟说，那本手抄的诗歌本子，号数都是照这块板子编的。') },
      { id: 'pulpit', x: 7, y: 3, spr: 'pulpit', on: S => S.narr('讲台上摊着一本圣经，翻在《彼得前书》第五章。\n「务要谨守，儆醒。」这一行底下画了一道线。') },
      { id: 'stone_c', x: 9, y: 3, spr: '@stone', dir: 0, on: S => stoneTalk(S) },
      { id: 'stove', x: 10, y: 3, spr: 'stovep', solid: true, light: { r: 3, col: 'rgba(255,150,70,.18)', flick: true }, on: S => S.narr('一只铁皮炉子，烟管一直通到房顶。炉膛里的柴火噼啪响。\n会堂里最暖和的，就是这一小块地方。') },
      { id: 'sdesk', x: 2, y: 3, spr: 'desk', col: '#5a3c24', async on(S) {
        if (S.once('logHint')) await S.narr('桌上有一本用麻线订起来的小本子。封皮上写着：「关于贝尔家之事。」');
        await S.note('log');
      } },
      { x: 2, y: 3, spr: 'book', col: '#3a2a1a', z: 1, oy: -8, solid: false },
      { x: 13, y: 3, spr: 'candles', light: { r: 2.4, col: 'rgba(255,190,110,.14)' }, on: S => S.narr('几根牛油蜡烛。斯通兄弟说，它在会堂里从来不出声。\n「也许它也有不敢进的地方。也许它只是懒得来。」') },
      ...[[2, 6], [4, 6], [9, 6], [11, 6], [2, 8], [4, 8], [9, 8], [11, 8]].map(([x, y]) => ({ x, y, w: 2, spr: 'bench', on: S => S.narr('长条凳，被一代一代的裤子磨得发亮。') })),
      { id: 'xChurch', x: 7, y: 10, w: 2, spr: 'invisible', async touch(S) {
        if (S.f.ph === 'day2') { S.pos(7, 9, 3); return S.narr(S.f.tp0 || S.f.tp1 || S.f.tp2 || S.f.tp3 ? '斯通兄弟在讲台边朝你招手：「等等，孩子，还有样东西要给你。」' : '斯通兄弟让你来，肯定有话要说。先跟他聊聊。'); }
        await S.go('farm', 1, 7, 2);
      } }
    ],
    async enter(S, first) {
      if (first) {
        await S.narr('会堂是一间原木搭的大屋子，比贝尔家的木屋冷得多。\n一排排长条凳，一座讲台。斯通兄弟站在讲台和铁炉子中间，正往炉膛里添柴。');
        S.goal('和斯通兄弟谈谈');
      }
    }
  };

  /* ---------------- 河边的山洞 ---------------- */
  MAPS.cave = {
    amb: 'river', dark: .94, plr: 3.2, wall: 'stone', floor: 'dirt', floor2: 'sand',
    legend: { 'X': 'crack' },
    rows: [
      '########################',
      '########################',
      '##.....#################',
      '##.....#################',
      '##.....######....oo.####',
      '####X########.......####',
      '###...#######..###..####',
      '###...#######..###..####',
      '###.............##..####',
      '###.............##..####',
      '#########..#######..####',
      '#########..#######..####',
      '#########............###',
      '#########............###',
      '###########..###########',
      '###########..###########',
      ',,,,,,,,,,,..,,,,,,,,,,,',
      ',,,,,,,,,,,,,,,,,,,,,,,,',
      '~~~~~~~~~~~~~~~~~~~~~~~~',
      '~~~~~~~~~~~~~~~~~~~~~~~~'],
    ents: [
      { id: 'echo', x: 8, y: 7, spr: 'echo', on: S => echoRock(S) },
      { id: 'brock', x: 15, y: 4, spr: 'bigrock', on: S => S.narr('泉眼边一块大石头。石头底下被人挖了一个大坑，坑边的土早就冻硬了。\n——就是这里。它说过底下埋着一罐金子。') },
      { x: 18, y: 5, spr: 'invisible', solid: false, on: S => S.narr('一眼小泉，冬天也不冻。水冷得扎手。\n你喝了一口。水里有一股铁锈味。') },
      { id: 'pebble', x: 17, y: 5, spr: 'pebble', solid: false, async on(S) {
        await S.narr('泉眼边的浅水里，躺着一块白石子，被水磨得溜圆。\n石子里面有一圈一圈的纹路——跟回声石上刻的，一模一样。');
        if (S.f.ph === 'flee') return S.narr('……现在可不是捡石头的时候！');
        const r = await choose(S, '要带走吗？', ['（揣进兜里）', '（放回水里）']);
        if (r === 1) return S.narr(S.f.tp3 ? '你想起斯通兄弟的话，把它放回了水里。\n水面上，好像有谁轻轻「嗯」了一声。' : '你把它放回了水里。');
        S.hide('pebble'); S.give('pebble');
        await S.narr('石子在你兜里，凉得像一小块冰。');
      } },
      { x: 6, y: 9, spr: 'puddle', decal: true },
      { x: 12, y: 13, spr: 'footprints', decal: true, col: 'rgba(60,40,30,.7)' },
      { x: 10, y: 12, spr: 'footprints', decal: true, col: 'rgba(60,40,30,.7)' },
      { x: 3, y: 9, spr: 'invisible', solid: false, on: S => S.narr('岩壁上有人用小刀刻了几个名字的缩写，最早的一个，刻于1809年。') },
      { id: 'alamp', x: 5, y: 2, spr: 'lanternp', off: true, solid: false, on: S => S.narr('安妮的提灯，倒在地上，灯油流了一地。') },
      { id: 'dan_c', x: 13, y: 13, spr: '@dan', dir: 0, async on(S) {
        S.face('dan_c', 'pl');
        if (S.f.ph !== 'cave') return S.say('丹尼尔', '……');
        if (S.f.danTalk) return S.say('丹尼尔', '往左上走！那边洞越来越窄……快去！');
        S.f.danTalk = true;
        await S.say('丹尼尔', ['伊莱！谢天谢地……', '我脚扭了。我们进来没多远，安妮就说听见里面有人唱歌，像她奶奶的声音。', '她往里走，我在后面追，一脚踩进了石缝……', '我本来是想带她来看看，这里什么都没有的。']);
        await S.say('丹尼尔', '你快去！往左上走，那边洞越来越窄。');
        S.goal('往山洞深处找安妮');
      } },
      { id: 'anne_c', x: 2, y: 2, spr: '@anneS', dir: 0, on: S => anneCave(S) },
      { id: 'wisp', x: 8, y: 8, spr: 'wisp', hidden: true, solid: false, z: 1, light: WISP },
      ...TRAIL.map(([x, y], i) => ({ id: 'tr' + i, x, y, spr: 'wispdot', hidden: true, solid: false, light: { r: 1.4, a: .7, col: 'rgba(90,140,255,.2)' } })),
      { id: 'dog', x: 19, y: 5, spr: 'beast', hidden: true, solid: false, light: { r: .8, col: 'rgba(255,40,40,.14)' } },
      { x: 4, y: 17, spr: 'invisible', solid: false, light: { r: 4.5, a: .55, col: 'rgba(110,130,190,.07)' } },
      { x: 18, y: 17, spr: 'invisible', solid: false, light: { r: 4.5, a: .55, col: 'rgba(110,130,190,.07)' } },
      { x: 11, y: 15, spr: 'invisible', solid: false, light: { r: 2.4, a: .35 } },
      { id: 'xCave', x: 0, y: 16, h: 2, spr: 'invisible', async touch(S) {
        S.pos(1, 17, 2);
        await S.narr(S.f.ph === 'flee' ? '往洞口跑！' : '安妮还在里面。你不能就这么回去。');
      } }
    ],
    async enter(S, first) {
      if (S.f.ph === 'missing') {
        S.f.ph = 'cave';
        await S.narr('河水在黑暗里哗哗地响。\n崖壁底下，山洞的口子张着，像一张没有牙的嘴。');
        await S.narr('洞口的泥地上，有两串脚印走了进去。\n一串大，一串小。');
        S.goal('进山洞找安妮');
      }
    },
    step(S, x, y) {
      if (S.f.ph === 'cave' && !S.f.asked && y <= 9) return lanternOut(S);
      if (S.f.ph === 'flee' && y >= 16) return caveEscape(S);
    },
    tick(S, dt) {   // 黑狗越近，低吼越响、越密；贴到身后三格以内，地面跟着发抖
      if (S.f.ph !== 'flee' || W.busy) return;
      const d = S.ent('dog'); if (!d || d.hidden) return;
      const dist = Math.abs(d.px - S.pl.px) / 16 + Math.abs(d.py - S.pl.py) / 16;
      dogT -= dt; if (dogT > 0) return;
      const k = Math.max(0, 1 - dist / 16);
      dogT = .35 + (1 - k) * 1.1;
      S.tone('sawtooth', 68 + k * 30, 48, .3 + k * .15, .02 + k * .1, 0, 260 + k * 300);
      if (k > .5) S.tone('square', 140, 90, .08, .03 * k, .18, 500);   // 爪子刨地
      if (dist < 3.5) S.shake(160, 1);
    }
  };

  /* ---------------- 贝尔家墓地 ---------------- */
  MAPS.grave = {
    amb: 'wind', dark: .5, plr: 3.2, floor: 'dirt',
    legend: { 'S': 'snow' },
    tileOpts: { grassC: '#3a4232' },
    rows: [
      'PPPPPPPPPPPPPPPP',
      'P""S""""""""S""P',
      'P"ffffffffffff"P',
      'P"f"S""""""""f"P',
      'P"f""""""""""f"P',
      'P"f""""""S"""f"P',
      'P"f""""""""""f"P',
      'P"fffff""fffff"P',
      'P""S""""""""""SP',
      'P""""""""""""""P',
      'P"S""""""""""""P',
      'PPPPPPP""PPPPPPP'],
    ents: [
      { x: 4, y: 3, spr: 'stoneg', on: S => S.narr('一块很小的墓碑，只刻着一个字：「婴」。\n贝尔家刚搬来红河的那年冬天。') },
      { x: 6, y: 3, spr: 'gravestone', on: S => S.narr('一块没刻字的石头。汤姆说，是早年在这片地里干活的人。名字谁也记不得了。') },
      { x: 11, y: 3, spr: 'cross', on: S => S.narr('木头十字架，被风雨磨得发白。上面挂着一个冻硬的花环。') },
      { id: 'pit', x: 8, y: 4, spr: 'mound', open: true, hidden: true, decal: true, on: S => S.narr(S.ent('pit').open ? '新挖的墓坑。冻土翻在两边，黑黢黢的。' : '新垒起来的坟。土还是湿的，上面盖了一层薄雪。') },
      { id: 'shovel', x: 10, y: 4, spr: 'shovel', hidden: true, solid: false },
      { id: 'stone_g', x: 8, y: 3, spr: '@stone', dir: 0, hidden: true, on: S => S.say('斯通兄弟', S.f.buried ? ['我讲了三十年的道。', '今天是头一回，有人在我的祷告上面唱歌。'] : '……') },
      { id: 'mrs_g', x: 7, y: 5, spr: '@mrs', dir: 3, hidden: true, on: S => S.say('贝尔太太', S.f.buried ? ['它对我那么好……', '可它恨他。孩子，你说，一个东西怎么能同时这样？'] : '……') },
      { id: 'anne_g', x: 9, y: 5, spr: '@anne', dir: 3, hidden: true, on: S => anneGrave(S) },
      { id: 'tom_g', x: 10, y: 5, spr: '@tom', dir: 3, hidden: true, on: S => S.say('汤姆', S.f.buried ? '开春了，我得把玉米种下去。……日子总得过。' : '……') },
      { id: 'dan_g', x: 5, y: 6, spr: '@dan', dir: 2, hidden: true, on: S => S.say('丹尼尔', S.f.buried ? '安妮这两天都不怎么跟我说话。……是因为那个洞吗？' : '……') },
      { id: 'xGrave', x: 7, y: 11, w: 2, spr: 'invisible', async touch(S) {
        const ph = S.f.ph;
        if (ph === 'funeral') {
          if (!S.f.buried) { S.pos(7, 10, 3); return S.narr('葬礼还没结束。'); }
          await S.fade(1, 1200);
          await S.card('一八二一年　春', '', '那个冬天总算过去了。\n\n红河化了冻，玉米地里冒出了新芽。\n那个声音还在，可是一天比一天少说话。\n\n复活节后的那个礼拜一，安妮退回了丹尼尔的戒指。');
          S.f.ph = 'spring'; S.amb('fire');
          return S.go('house', 7, 9, 1, { ms: 800 });
        }
        await S.go('farm', 26, 7, 1);
      } }
    ],
    async enter(S, first) {
      if (S.f.ph === 'funeral') {
        for (const id of ['pit', 'shovel', 'stone_g', 'mrs_g', 'anne_g', 'tom_g', 'dan_g']) S.show(id);
        S.ent('pit').open = true;
        await S.narr('贝尔家的墓地在农场东边的小山坡上。\n雪停了。风很硬。');
        S.goal('到墓前去');
        return;
      }
      if (first) await S.narr('农场东边的小山坡。木栅栏围着几座旧坟。\n风从红河那边吹过来，吹得栅栏呜呜地响。');
    },
    step(S, x, y) { if (S.f.ph === 'funeral' && !S.f.buried && y <= 7) return funeralScene(S); }
  };

  /* ================= 章节定义 ================= */
  defChapter({
    id: 'bellwitch', n: 8, title: '贝尔女巫', sub: '它敲墙，扯被子，唱赞美诗。它说它要缠着老贝尔，一直缠到他进坟。', origin: '美国田纳西州民间传说 · 1817—1821', color: '#24304a',
    icon: '@kate', amb: 'fire', floor: 'wood', wall: 'wood', dark: .6, plr: 3.2,
    people: PEOPLE, faces: FACES, items: ITEMS, notes: NOTES, legend: LEGEND,
    endings: { spring: '七年之约', pebble: '洞里的石子', spoon: '一匙不够' },
    sprites: SPRITES, tiles: TILES, maps: MAPS,
    start: { map: 'farm', x: 1, y: 7, dir: 2 },
    resume: {
      lit: async S => { S.plr(1.7); S.amb('drone'); },
      cave: async S => {
        S.amb('drone'); S.plr(1.7); trail(S); S.hide('wisp');
        S.stop('dog'); S.place('dog', 19, 5, 1); S.ent('dog').alpha = 1;
        S.place('anne_c', S.pl.x, S.pl.y); S.follow('anne_c', true);
        S.goal('带安妮逃出山洞！顺着蓝色的光点跑（洞口在南边）');
        await S.narr('洞的另一头，又传来那声低低的吠叫。\n蓝色的光点还亮着，一路通向洞口。');
        startDog(S, 1.0);
      }
    },
    async intro(S) {
      S.f.ph = 'arrive'; S.f.hp = HPMAX;
      await S.card('第八夜　贝尔女巫', '1820年12月17日　美国田纳西州　红河畔', '你叫伊莱，十七岁，从肯塔基来。\n\n今年冬天，红河边的贝尔家要找个帮工，\n工钱比别家多给一倍。\n\n镇上的人说，方圆十里，\n没有人肯在那栋木屋里过夜。');
      S.give('coin', true);
    }
  });
})();
