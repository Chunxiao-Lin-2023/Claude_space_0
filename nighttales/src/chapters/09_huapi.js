/* ================= 第九夜 · 画皮 ================= */
(() => {
  /* ---------- 书斋小院的潜行：窗前灯光照得到的格子 ----------
     窗在 (17..19,1)。院里实心的东西：芭蕉 (16,2)(24,5)(19,4)、竹椅 (24,2)、晒书架 (21,5)。
     灯照不到的死角：窗下墙根三格、两处掩体背后（离窗远的一侧）、塌墙口落脚的那一格。
     路线：塌墙 (24,7) → (24,6) → 冲到晒书架背后 (21,6) → 冲到芭蕉背后 (19,5) → 冲到窗下 (18,2)。 */
  const YARD = (x, y) => x >= 16 && x <= 24 && y >= 2 && y <= 6;
  const YSOLID = new Set(['16,2', '24,2', '24,5', '19,4', '21,5']);
  const YSAFE = new Set(['17,2', '18,2', '19,2', '19,5', '21,6', '24,6']);
  const LIT = [];
  for (let y = 2; y <= 6; y++) for (let x = 16; x <= 24; x++) { const k = x + ',' + y; if (!YSOLID.has(k) && !YSAFE.has(k)) LIT.push(k); }
  const LITSET = new Set(LIT);
  function gazeSet(S, ph) {
    S.f.gz = ph;
    const w = S.ent('win'); if (w) { w.s.ph = ph; w.s.wf = 0; }
    LIT.forEach((k, i) => { const g = S.ent('gl' + i); if (g) g.s.g = ph; });
    if (w) w.light = { r: 2.6, dx: 24, dy: 40, col: ph === 'l' ? 'rgba(110,255,150,.2)' : ph === 'w' ? 'rgba(200,230,120,.19)' : 'rgba(255,190,110,.18)' };
    if (ph === 'p') S.f.spotT = null;
  }
  function resetGaze(S) { S.f.caught = false; S.f.gzT = 3.2; S.f.scT = 0; gazeSet(S, 'p'); }

  /* ---------- 南院的三个婆子：每局随机一个是画皮 ---------- */
  const WIDS = ['liu', 'sun', 'bai'];
  const WOM = {
    liu: { nm: '刘婆子', job: '推磨的', seat: 0, where: '石磨边', x: 3, y: 3 },
    sun: { nm: '孙婆子', job: '看灶的', seat: 2, where: '灶边', x: 13, y: 3 },
    bai: { nm: '白婆子', job: '洗菜的', seat: 1, where: '水缸边', x: 11, y: 5 }
  };
  const PART = { liu: 'sun', sun: 'bai', bai: 'liu' };   // 每个人会顺口说起的那个人
  const TESTI_OK = {
    liu: '孙婆子？闷葫芦一个。早饭就坐我斜对面，一碗粥喝得呼噜呼噜的。',
    sun: '……白婆子吃得慢。最后一个放的碗，我看着她舔干净的。',
    bai: '刘婆子吃了两碗呢，还嫌盛得少。'
  };
  const TESTI_ODD = {
    liu: '孙婆子？闷葫芦一个。端了碗就蹲到灶边去了……吃没吃，我倒没留意。',
    sun: '……白婆子。她那碗，端起来，又放下了。没看见她动筷子。',
    bai: '刘婆子话多，一早上光顾着说了。……她碗里的粥，我看是一口没少。'
  };
  const VATH = {
    liu: '指甲缝里，塞着白白的豆面。',
    sun: '手背上一道一道的皱，像叫盐水泡过——可那颜色是青的。',
    bai: '指头泡得发白，还攥着一片烂菜叶。'
  };

  /* ---------- 集市上围观的人（疯子那一段） ---------- */
  const CROWD = [['cr4', 21, 6], ['cr2', 21, 7], ['cr7', 21, 8], ['bing', 22, 8], ['cr3', 24, 8], ['cr6', 25, 8], ['cr1', 25, 7], ['cr5', 25, 6]];
  const CROWD_HOME = { cr1: [9, 7, 2], cr2: [10, 7, 1], cr3: [14, 11, 3], bing: [12, 3, 0] };

  /* ---------- 各阶段不许去的地方 ---------- */
  const WANG = ['bring', 'wife', 'market1', 'back', 'sneak', 'seek', 'hang'];
  function blockMsg(S, to) {
    const ph = S.f.ph, ok = a => a.includes(to);
    if (ph === 'road') return '（那个姑娘还一个人站在柳树底下……）';
    if (ph === 'night' || ph === 'attack') return '（门外有脚步声。哪儿也不能去。）';
    if (to === 'road' && !(ph === 'seek' && S.f.daoEast)) return ph === 'seek' ? '道士……道士会往哪里去？先去集市上问问。' : '那是出城的路。这会儿没心思出城。';
    if (ph === 'bring' && !ok(['home', 'study'])) return '得先把她安顿到书斋去。书斋在院子东北角的月洞门里。';
    if (WANG.includes(ph) && to === 'nanyuan') return '那边是二弟家的南院。这会儿没什么事要找他。';
    if (ph === 'wife' && !ok(['home', 'bedroom', 'study'])) return '（这事总瞒不住。还是先去内室，跟妻子说一声。）';
    if (ph === 'back' && to !== 'home') return '天色不早了，先回家吧。';
    if (ph === 'sneak') return '（书斋里……她到底在做什么？）';
    if (ph === 'seek' && !ok(['home', 'market', 'road'])) return '道士！得赶紧去集市找那个道士！';
    if (ph === 'hang' && S.f.hung) return '（今晚，哪儿也不去了。）';
    if (ph === 'hang' && !ok(['home', 'bedroom'])) return '天快黑了。得赶紧回内室，把拂尘挂上。';
    if (ph === 'chen' && to === 'market') return '先去南院，叫二郎去请道士。';
    if (ph === 'erlang' && !ok(['home', 'bedroom'])) return '二郎已经去请道士了。回家等着吧。';
    if (ph === 'ident' && to !== 'nanyuan') return '道士还在这里。先把那个东西找出来。';
    if (ph === 'beg' && to === 'nanyuan') return '集市……得去集市上求那个疯子。';
    if (ph === 'heart' && !ok(['home', 'bedroom'])) return '（回内室去。他还躺在那里。）';
    return null;
  }
  const exit = (to, x, y, dir, push) => async S => {
    const m = blockMsg(S, to);
    if (m) { S.sfx('locked'); await S.narr(m); const p = S.pl; if (push && p.prev && (p.prev[0] !== p.x || p.prev[1] !== p.y)) S.pos(p.prev[0], p.prev[1]); return; }
    await S.go(to, x, y, dir);
  };
  function light(S) {
    const t = {
      home: { road: .35, bring: .35, wife: .4, market1: .4, sneak: .76, seek: .82, hang: .84, chen: .45, erlang: .45, ident: .45, beg: .45, heart: .8 },
      market: { market1: .3, back: .45, seek: .62, beg: .35 },
      road: { road: .35, seek: .82 },
      bedroom: { hang: .8, heart: .82 },
      study: { sneak: .5 }
    }[S.map];
    S.dark(t && t[S.f.ph] != null ? t[S.f.ph] : null);
  }
  const cycle = (S, key, lines) => lines[(S.f[key] = ((S.f[key] ?? -1) + 1) % lines.length)];

  defChapter({
    id: 'huapi', n: 9, title: '画皮', sub: '书斋里藏着一个美人。夜里，她把自己的脸铺在床上，一笔一笔地画。', origin: '清·蒲松龄《聊斋志异》', color: '#23402f',
    icon: '@gui', amb: 'wind', floor: 'stone', wall: 'wood', dark: .5, plr: 3.4,
    people: {
      me: { skin: '#eac39c', hair: '#1e1814', hs: 'queue', top: '#3d5a78', top2: '#d8d2c0', bottom: '#2a3a50', robe: true, shoes: '#1a1a1a' },
      chen: { skin: '#f0cfae', hair: '#18120e', hs: 'bun', top: '#5a4a6a', top2: '#e0d4c0', bottom: '#3a2e44', robe: true, shoes: '#2a1a1a' },
      /* 跪着的陈氏：上半身整体往下挪，袍子下摆铺在地上 */
      chen_k: { key: 'hp-chenk', skin: '#f0cfae', hair: '#18120e', hs: 'bun', top: '#5a4a6a', top2: '#e0d4c0', bottom: '#3a2e44', robe: true, shoes: '#2a1a1a',
        extra(g, d, fr, G, R) {
          const im = g.getImageData(0, 0, 16, 17); g.clearRect(-16, 0, 48, 24); g.putImageData(im, 0, 5);
          if (d === 1) { R(3, 20, 10, 3, '#5a4a6a'); R(10, 20, 3, 3, '#463a54'); R(12, 22, 2, 1, '#2a1a1a'); }
          else { R(2, 20, 12, 3, '#5a4a6a'); R(11, 20, 3, 3, '#463a54'); R(2, 22, 12, 1, '#3a2e44'); }
        } },
      nv: { skin: '#f6dcc8', hair: '#0e0a0c', hs: 'long', top: '#d88a9a', top2: '#f4e6e0', bottom: '#b86a7a', robe: true, shoes: '#c86a7a', blush: '#f0a0a8', mouth: '#c0505a' },
      gui: { key: 'hp-gui', skin: '#4f9a72', hair: '#0c0c0a', hs: 'messy', top: '#26262a', bottom: '#1c1c20', robe: true, shoes: '#111', eye: '#1a2a10',
        extra(g, d, fr, G, R) {
          const T = '#f0ecd8', h = G.hT;
          if (d === 0) { R(5, h + 6, 6, 2, '#2a0808'); R(5, h + 6, 1, 1, T); R(7, h + 6, 1, 1, T); R(9, h + 6, 1, 1, T); R(6, h + 7, 1, 1, T); R(8, h + 7, 1, 1, T); R(10, h + 7, 1, 1, T); R(6, h + 4, 1, 1, '#ffe060'); R(9, h + 4, 1, 1, '#ffe060'); R(3, G.tT + 7, 1, 2, '#4f9a72'); R(12, G.tT + 7, 1, 2, '#4f9a72'); }
          else if (d === 1) { R(4, h + 6, 3, 2, '#2a0808'); R(4, h + 6, 1, 1, T); R(6, h + 6, 1, 1, T); R(5, h + 7, 1, 1, T); R(6, h + 4, 1, 1, '#ffe060'); }
        } },
      dao: { key: 'hp-dao', skin: '#e2b88e', hair: '#8a8680', hs: 'bun', top: '#4a5a78', top2: '#d8d0b8', bottom: '#3a4864', robe: true, shoes: '#222',
        extra(g, d, fr, G, R) { R(6, G.hT - 3, 4, 2, '#1e1e1e'); if (d === 0) { R(6, G.hT + 7, 4, 3, '#c4c0b8'); R(7, G.hT + 10, 2, 2, '#c4c0b8'); } else if (d === 1) R(4, G.hT + 6, 3, 4, '#c4c0b8'); } },
      feng: { key: 'hp-feng', skin: '#9a7a52', hair: '#3a3028', hs: 'messy', top: '#5a4a36', top2: '#3a2e22', bottom: '#4a3c2c', shoes: '#2a2018',
        extra(g, d, fr, G, R) { R(5, G.tT + 3, 2, 2, '#7a6448'); R(9, G.tT + 6, 2, 1, '#2e2418'); R(5, G.lT + 1, 2, 1, '#7a6448'); if (d === 0) R(5, G.hT + 6, 6, 2, '#4a3a2c'); else if (d === 1) R(4, G.hT + 6, 3, 2, '#4a3a2c'); } },
      erlang: { skin: '#e6be96', hair: '#1e1814', hs: 'queue', top: '#6a5a3a', top2: '#d8d0c0', bottom: '#3a3428', shoes: '#1a1a1a' },
      sao: { skin: '#efc9a6', hair: '#1a1210', hs: 'bun', top: '#7a8a5a', bottom: '#4a5a3a', skirt: true, apron: '#d8d0bc', shoes: '#2a2a2a' },
      liu: { skin: '#d8b08a', hair: '#9a948c', hs: 'bun', top: '#5a4a3a', bottom: '#3a3028', skirt: true, hat: 'scarf', hatC: '#6a5a4a', apron: '#8a8478', shoes: '#2a2018' },
      sun: { skin: '#dcb490', hair: '#8a8680', hs: 'bun', top: '#4a5060', bottom: '#30343e', skirt: true, hat: 'scarf', hatC: '#5a5e6a', shoes: '#2a2018' },
      pozi: { skin: '#ecd0b2', hair: '#a8a49c', hs: 'bun', top: '#5a4a52', bottom: '#3a3038', skirt: true, hat: 'scarf', hatC: '#6a5a62', mouth: '#a05a5a', shoes: '#2a2018' },
      yz: { skin: '#f0cca8', hair: '#1a1210', hs: 'bun', top: '#a85a6a', bottom: '#6a3a4a', skirt: true, shoes: '#3a2020' },
      bing: { skin: '#d8a880', hair: '#2a2420', hs: 'queue', top: '#8a7a5a', bottom: '#4a4030', apron: '#d8d0c0', shoes: '#1a1a1a' },
      tu: { skin: '#c89068', hair: '#1a1410', hs: 'queue', top: '#3a3a3a', bottom: '#2a2a2a', apron: '#7a5a50', shoes: '#1a1a1a' },
      suan: { skin: '#d8b490', hair: '#c0bcb4', hs: 'bun', top: '#3a3a48', robe: true, eye: '#d8d4cc', shoes: '#1a1a1a' },
      cr1: { skin: '#dab08a', hair: '#1a1410', hs: 'queue', top: '#6a6050', bottom: '#3a3428' },
      cr2: { skin: '#e8c4a0', hair: '#1a1210', hs: 'bun', top: '#7a5a4a', bottom: '#4a3a30', skirt: true },
      cr3: { skin: '#e0b890', hair: '#1a1410', hs: 'short', top: '#5a6a7a', bottom: '#3a4048', child: true },
      cr4: { skin: '#d4a882', hair: '#2a2420', hs: 'queue', top: '#4a5a4a', bottom: '#2e342e', hat: 'cap', hatC: '#2a2a2a' },
      cr5: { skin: '#e6c09c', hair: '#8a8478', hs: 'bun', top: '#6a4a5a', bottom: '#3e2e38', skirt: true, hat: 'scarf', hatC: '#5a4a52' }
    },
    /* 惊吓大头像：青脸、锯齿牙、凸出的黄眼，半边还挂着没揭干净的美人皮 */
    faces: {
      gui(R, a, t) {
        const G = '#4f9a72', GD = '#3a7a58', H = '#030303', T = '#f0ecd8', SK = 'rgba(244,222,200,.95)';
        R(0, 0, 32, 32, '#1c2a1e'); R(0, 0, 32, 4, '#26382a'); R(0, 28, 32, 4, '#121a13');
        R(3, 1, 26, 8, H); R(1, 4, 6, 24, H); R(25, 4, 6, 24, H); R(2, 0, 4, 3, H); R(14, 0, 6, 2, H); R(24, 0, 5, 3, H);
        R(6, 6, 20, 22, G); R(8, 27, 16, 3, G); R(6, 6, 3, 22, GD); R(23, 6, 3, 21, GD); R(11, 28, 10, 2, GD);
        R(5, 8, 2, 14, H); R(25, 8, 2, 12, H); R(9, 5, 2, 4, H); R(19, 5, 3, 3, H);   // 垂下来的乱发
        R(8, 9, 7, 2, '#16220e'); R(17, 9, 7, 2, '#16220e');   // 眉骨
        const blink = Math.sin(t * 7) > .96 ? 2 : 0;
        R(9, 11 + blink / 2, 5, 4 - blink, '#ffe060'); R(18, 11 + blink / 2, 5, 4 - blink, '#ffe060');
        R(11, 12, 2, 2, '#1a0800'); R(20, 12, 2, 2, '#1a0800'); R(9, 11, 1, 1, '#fff6c0'); R(18, 11, 1, 1, '#fff6c0');
        R(14, 15, 4, 3, GD); R(14, 17, 1, 1, '#16220e'); R(17, 17, 1, 1, '#16220e');
        const o = Math.round(a * 4);
        R(6, 19, 20, 5 + o, '#2a0606'); R(8, 21, 16, 2 + o, '#120202');
        for (let i = 0; i < 10; i++) { const x = 6 + i * 2; R(x, 19, 2, 1, T); R(x, 20, 1, 1 + (i % 2), T); R(x, 23 + o, 2, 1, T); R(x + 1, 22 + o - (i % 2), 1, 1 + (i % 2), T); }
        // 右边脸上还挂着一片没揭干净的美人皮：描好的细眉、胭脂、半张红唇
        R(21, 6, 7, 21, SK); R(20, 9, 1, 15, SK); R(27, 6, 1, 18, 'rgba(200,170,150,.9)');
        R(22, 10, 4, 1, '#2a3a3a'); R(23, 12, 2, 1, '#1a1214'); R(22, 16, 3, 2, '#f0a0a8'); R(21, 21, 4, 2, '#c02840');
        R(20, 26, 2, 3, SK); R(22, 27, 1, 3, SK);   // 皮的边缘耷拉下来
      }
    },
    items: {
      bao: { name: '包袱', desc: '她的包袱。轻飘飘的，不知道里面装着什么。' },
      whisk: { name: '蝇拂', desc: '道士给的拂尘。马尾毛雪白，木柄磨得发亮。' },
      silk: { name: '红绸', desc: '从陪嫁的那匹红绸上撕下来的一长条。' },
      rouge: { name: '桃花胭脂', desc: '一只小小的瓷盒，盖子上画着一枝桃花。给她买的。' }
    },
    notes: {
      gaoshi: { title: '集市墙上的告示', text: '太原县正堂　为晓谕事：\n\n近月以来，城郊屡有男子暴卒于家。门户完好，财物不失。\n死者胸腹俱被剖开，心不知所往。\n\n仵作验看：非刀非刃，似以指爪裂之。\n\n凡我士民，入夜紧闭门户，勿收留来历不明之人。\n知情者速报县衙。\n\n（告示的一角被人撕去了。剩下的半张，在风里一下一下地拍着墙。）' },
      jiashu: { title: '没寄出去的家书', text: '（陈氏的字，压在妆奁底下）\n\n娘：\n\n女儿在王家一切都好，您别挂念。\n\n只是这几日，相公夜夜宿在书斋，饭也要端过去吃。问他，只说是温书。\n\n昨日我去送茶，门闩着。隔着门，听见里头有女人在笑，又轻又细，像是怕人听见。\n\n若真是哪家大户人家逃出来的妾，叫人家寻上门来，是要吃官司的。我劝了他一回，他只说我多心。\n\n娘，我该怎么办？\n\n……这封信，女儿想了想，还是不寄了。' },
      qian: { title: '青帝庙的签', text: '（从庙前签筒里摇出来的一支竹签）\n\n第四十九签　下下\n\n画眉人自镜中来，\n粉面朱唇次第开。\n莫道春风皆好意，\n桃花原是骨头栽。\n\n解曰：色字头上一把刀。\n所求之人非人，所问之事，勿问。' },
      pijuan: { title: '人皮', text: '道士把那张人皮摊开在地上。\n\n眉毛、眼睛、手指、脚趾，一样也不缺。\n眉梢描得最细，一笔叠着一笔，像是画了很多很多遍。两颊的胭脂匀匀的，嘴唇点得红红的。\n\n只是翻过来，背面什么也没有。\n薄得能透光，像一张浸过水的宣纸。\n\n道士把它卷了起来。沙沙作响，像在卷一轴画。' }
    },
    legend: '《画皮》出自清代蒲松龄（1640–1715）的文言短篇小说集《聊斋志异》，是全书流传最广的篇目之一。故事很短：太原王生清早在路上遇见一个自称逃妾的美貌女子，把她藏进书斋；集市上的道士说他身上有邪气，他不信，心里还当道士是想借驱邪骗钱。回家后他从窗外偷看，才看见一个面色青翠、牙齿如锯的厉鬼，把人皮铺在床上用彩笔描画，画完披在身上，又成了美人。道士给的拂尘没能挡住它，厉鬼撞开房门，裂开王生的胸腹，掏走了心。\n\n后半篇的主角是王生的妻子陈氏。道士追到王生弟弟二郎的南院，仗剑立在庭中，喝一声「孽魅！偿我拂子来！」，打得画皮脱落，斩下鬼头，用葫芦收了化成的浓烟，又把人皮像画轴一样卷走；却自称道行太浅，不能起死回生，只指点陈氏去求集市上一个躺在粪土里的疯乞丐。陈氏当众被他打骂、取笑，最后咽下他递到嘴边的痰；回家哭尸时呕出一颗还在跳动的人心，落进丈夫的胸腔，用帛缠紧，王生竟活了过来。疯子究竟是谁，原文没有说破，据说多数读者把他当作某位仙人的化身。\n\n篇末「异史氏曰」点明寓意：「愚哉世人！明明妖也，而以为美。」又说：「然爱人之色而渔之，妻亦将食人之唾而甘之矣。天道好还，但愚而迷者不寤耳。可哀也夫！」好色的是丈夫，替他受辱的却是妻子——后人多把它读作对以貌取人、贪恋美色的讽刺，也常有人替陈氏的隐忍不平。「画皮」一词后来进了日常语言，指伪装得很好的恶人。这个故事屡被改编为戏曲和影视：1966年香港有鲍方导演的电影《画皮》，1992年胡金铨拍了《画皮之阴阳法王》，2008年陈嘉上导演的《画皮》和2012年乌尔善导演的续集则把它改成了爱情故事。\n\n（本章中，集市上的告示、陈氏的家书、青帝庙的签文、偷窥时的潜行玩法、南院三个婆子的辨认（每一局藏在里面的都可能是另一个）、在疯子跟前挨打不许躲、缠伤口的时限，以及集市摊贩、疯子唱的歌、那盒桃花胭脂等细节，都是游戏为了互动而增加的；主要情节依照原著。）',
    endings: { good: '心还在跳', rouge: '那盒胭脂', gone: '它走了' },
    start: { map: 'road', x: 2, y: 5, dir: 2 },
    resume: {
      sneak: async S => { resetGaze(S); S.speed(1); },
      ident: async S => { S.f.gw = WIDS[S.rand(3)]; },   // 重来时换一个婆子藏身，不能靠排除法
      heart: async S => { if (S.f.beat && !S.f.bound) { S.timer(14, '热气在散', heartFail, { during: true }); await S.narr('你一松手，热气就往外冒——快去衣箱里拿绸子！'); } }
    },
    async intro(S) {
      await S.card('第九夜　画皮', '清　山西太原', '太原有个读书人，姓王。\n一天清早，他在城外的小路上，\n遇见了一个姑娘。');
    },
    tick(S, dt) { endureTick(S, dt); heartTick(S, dt); },
    sprites: {
      pwin(g, e, t, R) {   // 糊纸的格子窗（墙面，48 宽）。ph: p 低头描画 / w 正在抬头（wf 0→2）/ l 抬头看窗
        box(R, 1, 0, 46, 12, '#4a3422');
        const lit = !e.off, ph = e.ph;
        const paper = !lit ? '#2a2620' : ph === 'l' ? '#c4d89c' : ph === 'w' ? (Math.sin(t * 12) > 0 ? '#d8e090' : '#e8c27a') : '#e8c27a';
        R(2, 1, 44, 10, paper);
        if (lit) {
          const sc = 'rgba(40,24,16,.8)', cx = 18;
          if (ph === 'l') { R(cx + 2, 1, 8, 6, sc); R(cx - 1, 7, 14, 4, sc); R(cx + 3, 3, 2, 1, '#30ff70'); R(cx + 7, 3, 2, 1, '#30ff70'); }
          else if (ph === 'w') {   // 黑影分三帧抬起来
            const f = e.wf || 0, hy = [6, 4, 2][f];
            R(cx + 1 - f, hy, 7, 5, sc); R(cx - 1, 8 - f, 14, 3 + f, sc);
            if (f === 2) { R(cx + 2, hy + 2, 1, 1, '#a0ff90'); R(cx + 6, hy + 2, 1, 1, '#a0ff90'); }
          } else {   // 伏在案上一笔一笔地描
            R(cx - 4, 6, 6, 4, sc); R(cx, 8, 13, 3, sc); R(cx + 9, 7 + (Math.sin(t * 7) > 0 ? 1 : 0), 5, 1, sc); R(cx + 13, 6 + (Math.sin(t * 7) > 0 ? 1 : 0), 1, 2, sc);
          }
        }
        for (let x = 2; x < 46; x += 4) R(x, 1, 1, 10, '#4a3422');
        R(2, 6, 44, 1, '#4a3422');
        if (e.torn) { R(23, 3, 3, 3, '#120c08'); R(24, 6, 1, 2, '#120c08'); }
      },
      glow(g, e, t, R) {   // 窗里漏到地上的灯光：离窗越远越淡；抬头前一刻发黄绿、一闪一闪
        const k = Math.max(.45, 1 - (e.d || 0) * .1);
        let c;
        if (e.g === 'l') c = `rgba(120,255,160,${(.19 * k).toFixed(3)})`;
        else if (e.g === 'w') c = Math.sin(t * 12) > 0 ? `rgba(200,230,120,${(.2 * k).toFixed(3)})` : `rgba(255,205,130,${(.1 * k).toFixed(3)})`;
        else c = `rgba(255,205,130,${(.19 * k).toFixed(3)})`;
        R(0, 0, 16, 16, c); R(7, 0, 1, 16, 'rgba(0,0,0,.12)'); R(0, 7, 16, 1, 'rgba(0,0,0,.12)');
      },
      dshade(g, e, t, R) { R(0, 0, 16, 16, 'rgba(0,0,10,.32)'); R(0, 0, 16, 2, 'rgba(0,0,10,.15)'); },   // 灯照不到的死角
      rack(g, e, t, R) {   // 晒书的木架子
        R(1, -8, 2, 22, '#5a3c24'); R(13, -8, 2, 22, '#5a3c24'); R(1, -6, 14, 1, '#6b4a2f'); R(1, 2, 14, 1, '#6b4a2f');
        R(2, -11, 5, 5, '#e8e0c8'); R(8, -11, 6, 5, '#d8d0b4'); R(4, -11, 1, 5, '#a89a7a'); R(11, -11, 1, 5, '#a89a7a');
        R(2, -2, 6, 4, '#e0d8bc'); R(9, -3, 5, 5, '#ece4cc'); R(4, -1, 3, 1, '#4a4a4a'); R(10, -1, 3, 1, '#4a4a4a');
        R(1, 13, 14, 2, 'rgba(0,0,0,.25)');
      },
      vat(g, e, t, R) { box(R, 1, 1, 14, 14, '#4a4440'); R(2, 2, 12, 3, '#1a2630'); R(3, 3, 4, 1, '#3a5060'); R(1, 8, 14, 1, '#38322e'); R(2, 13, 12, 1, '#2a2622'); },
      bajiao(g, e, t, R) {
        const s = Math.sin(t * 1.3 + e.x) > .6 ? 1 : 0;
        R(7, 0, 2, 15, '#3a5a2a'); R(4, -22 + s, 6, 9, '#3a6a32'); R(0, -14, 8, 5, '#2f5a2a'); R(8, -18 + s, 9, 6, '#2a5226');
        R(-2, -6, 9, 4, '#36622e'); R(9, -8, 9, 4, '#2f5a2a'); R(1, -13, 6, 1, '#4a7a3a'); R(9, -17 + s, 7, 1, '#4a7a3a'); R(5, -21 + s, 1, 7, '#4a7a3a');
      },
      mgate(g, e, t, R) {   // 月洞门：barred 时两扇门闩着
        R(-2, -12, 20, 4, '#3a3a42'); for (let i = 0; i < 5; i++) R(-2 + i * 4, -12, 2, 4, '#4a4a54');
        R(-1, -8, 3, 22, '#6b5a42'); R(14, -8, 3, 22, '#6b5a42'); R(2, -8, 12, 3, '#6b5a42'); R(2, -5, 2, 2, '#6b5a42'); R(12, -5, 2, 2, '#6b5a42');
        if (e.barred) { box(R, 2, -5, 12, 19, '#5a3c24'); R(7, -4, 2, 17, '#3a2616'); R(1, 3, 14, 2, '#8a6a3a'); }
      },
      doorS(g, e, t, R) {   // 内室南墙上的门（从屋里看）。open 撞开 / cracked 裂了 / ajar 门缝里漏进月光
        if (e.open) {
          R(0, 0, 16, 16, '#0a0806'); R(4, 0, 12, 16, 'rgba(140,160,210,.14)');
          R(1, 0, 3, 16, '#4a3020'); R(1, 0, 1, 16, '#2a1a10');
          if (e.cracked) { R(2, 4, 2, 1, '#120c08'); R(3, 5, 1, 4, '#120c08'); R(2, 11, 1, 3, '#120c08'); R(12, 13, 3, 1, '#6a4a2a'); R(9, 14, 2, 1, '#6a4a2a'); }
          return;
        }
        box(R, 1, 0, 14, 16, '#5a3a22'); R(7, 1, 2, 14, e.ajar ? '#9ab0d8' : '#3a2414');
        R(3, 5, 3, 4, '#d8a0a0'); R(10, 5, 3, 4, '#d8a0a0'); R(4, 6, 1, 2, '#b07070'); R(11, 6, 1, 2, '#b07070');
        R(6, 9, 1, 2, '#c8a040'); R(9, 9, 1, 2, '#c8a040');
      },
      fenglie(g, e, t, R) {   // 躺在粪土里的疯子（32×16）
        const b = Math.sin(t * 2) > 0 ? 1 : 0;
        R(10, 6, 16, 7, '#5a4a36'); R(10, 6, 16, 1, '#6a5a44'); R(14, 9, 3, 2, '#7a6448'); R(26, 8, 5, 3, '#4a3c2c'); R(30, 7, 2, 4, '#2a2018');
        R(2, 4 + b, 8, 8, '#9a7a52'); R(1, 3 + b, 7, 4, '#3a3028'); R(3, 7 + b, 1, 1, '#111'); R(4, 10 + b, 4, 2, '#4a3a2c'); R(6, 9 + b, 1, 1, '#2a1a10');
        R(8, 13, 9, 2, '#3a2a1a'); R(20, 2, 2, 5, '#7a6448'); R(20, 1, 3, 2, '#9a7a52');
      },
      colors(g, e, t, R) {   // 颜料碟子
        R(1, 8, 4, 3, '#e8e4d8'); R(2, 9, 2, 1, '#3a8a7a'); R(6, 9, 4, 3, '#e8e4d8'); R(7, 10, 2, 1, '#c02840'); R(11, 8, 4, 3, '#e8e4d8'); R(12, 9, 2, 1, '#f0ece0');
        R(3, 13, 9, 1, '#6a4a2a'); R(12, 12, 2, 3, '#111');
      },
      baoopen(g, e, t, R) {   // 摊开的包袱：没有衣裳，只有青黛、朱砂、铅粉
        R(0, 6, 16, 9, '#8a5a6a'); R(1, 7, 14, 7, '#a06a7a'); R(-1, 5, 3, 3, '#8a5a6a'); R(14, 13, 3, 3, '#8a5a6a');
        R(3, 8, 3, 3, '#2a5a6a'); R(4, 8, 1, 1, '#4a8a9a'); R(7, 8, 3, 3, '#b02030'); R(8, 8, 1, 1, '#e04050'); R(11, 8, 3, 3, '#ece8e0');
        R(3, 12, 4, 1, '#3a7a8a'); R(9, 12, 3, 1, '#d84050');
      },
      body(g, e, t, R) {   // 床上的王生。wound 伤口 / band 缠了红绸 / beat 心在跳 / steam 热气（0~4，越大越浓）
        R(4, 2, 8, 7, e.wound && !e.band ? '#c8b8a4' : '#eac39c'); R(4, 1, 8, 2, '#1e1814'); R(5, 5, 1, 1, '#2a2020'); R(9, 5, 1, 1, '#2a2020');
        if (!e.wound) { R(3, 9, 10, 18, '#5a6a8a'); R(3, 9, 10, 2, '#7a8aa8'); return; }
        R(3, 9, 10, 18, '#d8d2c4'); R(3, 9, 10, 2, '#e8e2d6');
        if (e.band) { R(3, 12, 10, 5, '#b02028'); R(3, 13, 10, 1, '#d84048'); return; }
        R(5, 12, 6, 6, '#6a1414'); R(6, 13, 4, 3, '#3a0808'); R(2, 17, 3, 9, 'rgba(110,16,16,.85)'); R(11, 19, 3, 6, 'rgba(110,16,16,.7)');
        if (e.beat) {
          const b = Math.sin(t * 8) > 0 ? 1 : 0; R(6 - b, 13 - b, 4 + b * 2, 3 + b, '#c02830');
          const n = 1 + (e.steam || 0) * 2;
          for (let i = 0; i < n; i++) { const ph = (t * (4 + i * .7) + i * 1.3) % 6; R(5 + ((i * 3) % 6) + Math.sin(t * 3 + i) * 1.5, 11 - ph * 2, 2, 2, `rgba(235,235,235,${(.45 - ph * .06).toFixed(2)})`); }
        }
      },
      dog(g, e, t, R) {
        const b = e.bark && Math.sin(t * 12) > 0 ? 1 : 0, c = '#a8803a';
        R(4, 6, 9, 5, c); R(1, 3 + b, 5, 5, c); R(0, 5 + b, 2, 2, '#8a6a2a'); R(3, 2 + b, 2, 2, '#6a4a1a'); R(2, 4 + b, 1, 1, '#111');
        if (b) R(0, 7 + b, 2, 1, '#5a1a1a');
        R(5, 11, 2, 3, '#7a5a20'); R(10, 11, 2, 3, '#7a5a20'); R(12, 9, 3, 2, '#8a6a2a'); R(13, 7, 3, 1, '#888');
      },
      doghouse(g, e, t, R) { box(R, 1, 0, 14, 14, '#6a4a2a'); R(-1, -4, 18, 5, '#4a3020'); R(5, 6, 6, 8, '#140c08'); },
      mill(g, e, t, R) { box(R, 0, 4, 16, 10, '#7a7672'); box(R, 2, 0, 12, 7, '#8f8b86'); R(7, 2, 2, 2, '#3a3836'); R(13, 1, 5, 1, '#5a3c24'); R(2, 11, 12, 1, '#e8e2cc'); },
      zao(g, e, t, R) {
        box(R, 0, 1, 16, 14, '#7a5a44'); R(2, 2, 12, 5, '#2a2a2a'); R(3, 3, 10, 3, '#4a4a48'); R(4, 9, 8, 5, '#1a0c08');
        const f = Math.sin(t * 9) > 0 ? 1 : 0; R(5, 11 + f, 6, 3 - f, '#ff8a2a'); R(7, 12, 2, 1, '#ffcf5a');
        R(7, -3 - ((t * 6) % 4), 2, 2, 'rgba(210,210,210,.35)');
      },
      bowls(g, e, t, R) {   // 三只粥碗；fb = 哪一只满满的没动过（0 左 1 中 2 右）
        SPR.table(g, e, t, R);
        for (let i = 0; i < 3; i++) {
          const x = 1 + i * 5; R(x, 3, 4, 3, '#d8d4c8'); R(x, 5, 4, 1, '#b8b4a8');
          if (e.fb === i) { R(x, 2, 4, 2, '#f0e4c0'); R(x + 1, 1, 2, 1, '#f0e4c0'); R(x + 1, 2, 2, 1, '#e0d0a0'); R(x + 3, 0, 1, 3, '#6a4a2a'); }
          else R(x + 1, 3, 2, 1, '#a8a498');
        }
      },
      shade(g, e, t, R) {   // 灶火投在地上的人影（只有人才有）
        const j = Math.sin(t * 9 + e.x * 1.7) > .2 ? 1 : 0, c = 'rgba(6,4,2,.55)';
        R(4, 14, 8, 1, c); R(3 - j, 15, 10 + j, 2, c); R(4, 17, 8 + j, 2, c); R(5, 19, 6 + j, 1, c); R(6, 20, 4, 1, c);
      },
      flies(g, e, t, R) { for (let i = 0; i < 6; i++) R(8 + Math.sin(t * 7 + i * 2) * 6, 7 + Math.cos(t * 9 + i * 1.7) * 4, 1, 1, '#0a0a0a'); },
      dung(g, e, t, R) { R(1, 7, 14, 7, '#3a2e1c'); R(3, 5, 9, 4, '#4a3a22'); R(5, 4, 4, 2, '#3e3020'); R(2, 12, 3, 1, '#5a4a2a'); },
      guilie(g, e, t, R) {   // 趴在地上的厉鬼（32×16）
        const w = Math.sin(t * 20) > 0 ? 1 : 0;
        R(2, 6, 22, 7, '#26262a'); R(23, 3 + w, 9, 9, '#4f9a72'); R(27, 1 + w, 6, 11, '#0c0c0a');
        R(23, 10 + w, 6, 2, '#2a0808'); R(23, 10 + w, 1, 1, '#f0ecd8'); R(25, 10 + w, 1, 1, '#f0ecd8'); R(24, 11 + w, 1, 1, '#f0ecd8'); R(26, 11 + w, 1, 1, '#f0ecd8');
        R(25, 6 + w, 1, 1, '#ffe060'); R(6, 12, 3, 3, '#4f9a72'); R(16, 12 - w, 3, 3, '#4f9a72');
        R(0, 8, 3, 2, '#4f9a72'); R(0, 7, 1, 1, '#f0ecd8'); R(19, 12 + w, 3, 2, '#4f9a72'); R(21, 13 + w, 1, 1, '#f0ecd8');
      },
      ghead(g, e, t, R) {   // 砍下来、滚出去的鬼头
        const r = Math.floor(t * 6) % 2;
        R(2, 6, 10, 8, '#4f9a72'); R(7 + r, 4, 7, 10, '#0c0c0a'); R(10, 13, 4, 3, '#0c0c0a');
        R(2, 11, 6, 2, '#2a0808'); R(2, 11, 1, 1, '#f0ecd8'); R(4, 11, 1, 1, '#f0ecd8'); R(6, 11, 1, 1, '#f0ecd8'); R(3, 12, 1, 1, '#f0ecd8'); R(5, 12, 1, 1, '#f0ecd8');
        R(4, 8, 2, 1, '#ffe060'); R(3, 14, 6, 1, 'rgba(0,0,0,.35)');
      },
      smoke(g, e, t, R) { for (let i = 0; i < 8; i++) { const a = t * 1.6 + i * .8; R(2 + i * 3 + Math.sin(a) * 3, 3 + Math.cos(a * 1.3) * 3 + (i % 3) * 2, 8, 6, 'rgba(60,60,66,.7)'); } },
      gourd(g, e, t, R) { R(6, 3, 4, 4, '#c8a040'); R(5, 7, 6, 7, '#c8a040'); R(6, 8, 2, 3, '#e8c870'); R(7, 1, 2, 2, '#6a4a2a'); R(5, 6, 6, 1, '#a03030'); },
      willow(g, e, t, R) {
        const s = Math.sin(t * 1.1 + e.x) * 1.5;
        R(6, -6, 4, 21, '#3a2c1e'); R(5, 12, 6, 3, '#2a2016'); R(-6, -22, 28, 8, '#3c5a34'); R(-2, -26, 20, 5, '#4a6a3e');
        for (let i = 0; i < 7; i++) R(-5 + i * 4 + s, -15, 1, 10 + (i % 3) * 4, i % 2 ? '#4f7442' : '#3c5a34');
      },
      skinv(g, e, t, R) {   // 摊在床上的人皮（竖着 16×32）；up = 被举起来抖
        const c = 'rgba(240,214,190,.93)', o = e.up ? Math.round(Math.sin(t * 18) * 1.5) : 0;
        R(5 + o, 3, 6, 6, c); R(3, 10, 10, 9, c); R(1 + o, 10, 2, 9, c); R(13 - o, 10, 2, 9, c); R(4, 19, 3, 10, c); R(9, 19, 3, 10, c);
        R(4 + o, 1, 8, 3, '#120c0c'); R(4 + o, 3, 1, 8, '#120c0c'); R(11 + o, 3, 1, 8, '#120c0c');
        if (e.paint > 0) { R(6 + o, 5, 1, 1, '#1a1214'); R(9 + o, 5, 1, 1, '#1a1214'); }
        if (e.paint > 1) { R(6 + o, 4, 2, 1, '#2a3a3a'); R(9 + o, 4, 2, 1, '#2a3a3a'); }
        if (e.paint > 2) { R(7 + o, 7, 2, 1, '#c02840'); R(5 + o, 6, 1, 1, '#f0a0a8'); R(10 + o, 6, 1, 1, '#f0a0a8'); }
        if (!e.paint) { R(6, 5, 1, 1, 'rgba(120,90,80,.5)'); R(9, 5, 1, 1, 'rgba(120,90,80,.5)'); }
      },
      skinflat(g, e, t, R) {   // 脱下来、横摊在地上的人皮（32×16）：头朝左、脸朝上，眉眼和红唇都描好了
        const c = 'rgba(240,214,190,.94)', d = 'rgba(205,175,150,.95)', H = '#120c0c';
        R(0, 3, 4, 10, H); R(1, 2, 5, 2, H); R(1, 12, 5, 2, H); R(-2, 5, 3, 6, H);   // 散开的头发
        R(3, 4, 8, 8, c); R(4, 3, 6, 1, c); R(4, 12, 6, 1, c);
        R(5, 5, 1, 2, '#2a3a3a'); R(5, 9, 1, 2, '#2a3a3a'); R(6, 5, 1, 1, '#1a1214'); R(6, 10, 1, 1, '#1a1214');
        R(7, 4, 1, 1, '#f0a0a8'); R(7, 11, 1, 1, '#f0a0a8'); R(9, 7, 1, 2, '#c02840');
        R(11, 6, 2, 4, c);
        R(13, 3, 10, 10, c); R(13, 3, 10, 1, d); R(15, 7, 6, 1, d);
        R(13, 1, 9, 2, c); R(13, 13, 9, 2, c); R(22, 0, 2, 3, c); R(22, 13, 2, 3, c);
        R(23, 4, 8, 3, c); R(23, 9, 8, 3, c); R(23, 7, 6, 2, d); R(30, 3, 2, 4, c); R(30, 9, 2, 4, c);
        R(17, 10, 3, 1, d); R(26, 5, 2, 1, d);
      },
      crow(g, e, t, R) { const h = Math.sin(t * 2 + e.x) > .7 ? 1 : 0; R(5, 6, 6, 4, '#141418'); R(4 + h, 4, 3, 3, '#141418'); R(3 + h, 5, 1, 1, '#3a3a20'); R(10, 8, 3, 2, '#141418'); R(6, 10, 1, 2, '#333'); R(9, 10, 1, 2, '#333'); }
    },
    tiles: {
      lowwall: { solid: true, paint(R, X, Y) { R(0, 0, 16, 16, '#6b5a42'); R(0, 0, 16, 5, '#3a3a42'); for (let i = 0; i < 4; i++) R(i * 4 + (Y % 2) * 2, 0, 2, 5, '#4a4a54'); R(0, 13, 16, 3, '#4e4030'); for (let i = 0; i < 4; i++) R((hash(X, Y, i) * 14) | 0, 6 + ((hash(Y, X, i) * 6) | 0), 2, 1, '#5a4a36'); } },
      rubble: { solid: false, paint(R, X, Y) { TILE.dirt.paint(R, X, Y); R(2, 3, 5, 3, '#6b5a42'); R(9, 8, 4, 3, '#5e4e38'); R(4, 10, 3, 2, '#6b5a42'); R(11, 2, 3, 2, '#4a4a54'); R(7, 5, 1, 3, '#3a5a2a'); R(13, 12, 1, 2, '#3a5a2a'); } },
      leaves: { solid: false, paint(R, X, Y) { TILE.dirt.paint(R, X, Y); for (let i = 0; i < 6; i++) { const h = hash(X, Y, 90 + i); R((h * 14) | 0, (hash(Y, X, 95 + i) * 14) | 0, 2, 1, ['#8a6a2a', '#a07a30', '#6a4a20'][i % 3]); } } }
    },
    maps: {
      /* ---------------- 城外小路（清晨） ---------------- */
      road: {
        amb: 'wind', dark: .35, plr: 4, floor: 'dirt', fog: .22, wall: 'mud',
        tileOpts: { grassC: '#2e4630', treeC: '#22382a' },
        rows: [
          'TTPTTPTTTPTTPTTTPTTPTTPTTT',
          'T""""""""""""""""""""""""T',
          'T""""""""""""""""""""""""T',
          'B""""""""""""""""""""""""T',
          'Bddddddddddddddddddddddddd',
          'Bddddddddddddddddddddddddd',
          'B""""""""""""""""""""""""T',
          'T""e""e""""ee"""e""""e"""T',
          '~~~~~~~~~~~~~~~~~~~~~~~~~~',
          '~~~~~~~~~~~~~~~~~~~~~~~~~~',
          'eeeeeeeeeeeeeeeeeeeeeeeeee'],
        ents: [
          { x: 25, y: 4, spr: 'invisible', touch: exit('home', 1, 10, 2, true) },
          { x: 25, y: 5, spr: 'invisible', touch: exit('home', 1, 10, 2, true) },
          { x: 0, y: 4, spr: 'invisible', solid: true, on: S => S.narr('来时的路。往回走是乡下，往前走才是太原城。') },
          { x: 5, y: 3, spr: 'sign', col: '#5a4a32', on: S => S.narr('路边的界碑，字叫雨水泡得发白：\n「太原城　东五里」。') },
          { id: 'willow', x: 13, y: 3, spr: 'willow', on: S => S.narr(S.f.ph === 'road' ? '一棵老柳树，柳条垂到地上，湿漉漉的，像刚洗过的头发。' : '柳树底下的泥地上，一个脚印也没有。\n……她刚才明明站在这里。') },
          { x: 19, y: 3, spr: 'stonelantern', off: true, on: S => S.narr('路边一座小小的土地龛，香炉里只剩几截烧黑的香梗。\n龛里的土地公，不知被谁把脸蒙上了一块红布。') },
          { x: 8, y: 2, spr: 'crow', on: S => S.narr('一只老鸹蹲在草里，歪着脑袋看你。\n你走近一步，它也不飞。') },
          { x: 9, y: 2, spr: 'crow' },
          { x: 3, y: 7, spr: 'invisible', solid: true, on: S => S.narr('城外的护城河。晨雾贴着水面，一动不动。\n水里漂着一只女人的绣鞋，红的。') },
          { x: 11, y: 7, spr: 'invisible', solid: true, on: S => S.narr('芦苇丛里，有什么东西窸窸窣窣地钻了过去。\n大概是只野猫。') },
          { x: 22, y: 6, spr: 'box', col: '#6a5a3a', on: S => S.narr('一只翻倒的货担，扁担断成了两截。\n担子里的东西撒了一地，挑担子的人却不见了。') },
          { id: 'dao_r', x: 6, y: 5, spr: '@dao', dir: 2, hidden: true, async on(S) { S.face('dao_r', 'pl'); if (S.f.ph === 'seek') return daoBeg(S); await S.say('道士', '回去吧。天黑了。'); } },
          { id: 'nv_r', x: 14, y: 4, spr: '@nv', dir: 1, async on(S) {
            S.face('nv_r', 'pl');
            if (S.f.ph !== 'road') return;
            await meetGirl(S);
          } }
        ],
        async enter(S, first) {
          light(S);
          if (S.f.ph === 'seek') {
            S.show('dao_r'); S.amb('wind');
            if (!S.f.nvGone) { S.place('nv_r', 13, 4, 0); S.ent('nv_r').alpha = .4; } else S.hide('nv_r');
            if (S.once('roadSeek')) { await S.narr('天已经黑透了。城外的小路上，雾又起来了。\n远远地，有个人影背着手，慢慢地往雾里走。'); S.goal('追上道士'); }
            return;
          }
          if (!first) return;
          S.f.ph = 'road';
          await S.narr('天刚蒙蒙亮。城外的小路上一个人也没有，雾气沾在衣裳上，凉凉的。');
          await S.think('赶早进城，还能在书斋里温一上午的书。');
          S.goal('沿小路往城里走');
        },
        step(S, x, y) {
          if (S.f.ph === 'road' && x >= 8 && S.once('seeGirl')) return (async () => {
            S.bubble('nv_r', '…', 1500);
            await S.narr('柳树底下站着一个姑娘，怀里抱着一个包袱。\n天还没亮透，她一个人，往哪里去？');
            await S.narr('她看见你，往柳树后面躲了躲。\n——是个十五六岁的女孩子，生得极美。');
            S.goal('上前问问那个姑娘');
          })();
          /* 追道士的路上：柳树底下又站着她。走近了，就没了 */
          if (S.f.ph === 'seek' && !S.f.nvGone && Math.abs(x - 13) <= 4) { S.f.nvGone = true; return (async () => {
            S.bubble('nv_r', '♥', 900); S.sfx('giggle');
            await S.alpha('nv_r', 0, 900);
            await S.think('……柳树底下，刚才是不是站着一个人？\n她在笑。她知道你看见了。');
          })(); }
        }
      },
      /* ---------------- 王家（前院 + 书斋小院） ---------------- */
      home: {
        amb: 'wind', dark: .4, plr: 3.4, floor: 'dirt', floor2: 'stone', wall: 'wood',
        legend: { 'H': 'lowwall', 'v': 'rubble' },
        tileOpts: { grassC: '#2a4228', treeC: '#1f3524' },
        rows: [
          '##############################',
          '##############################',
          '#....k.........H,,,,,,,,,H"""#',
          '#....k.........H,,,,,,,,,H"T"#',
          '#....k.........H,,,,,,,,,H"""#',
          '#....k.........H,,,,,,,,,H"""#',
          '#....k.........H,,,,,,,,,H"""#',
          '#....k.........HHHHkHHHHvH"""#',
          '#....k.............k......"""#',
          '#....k.............k......"""#',
          'kkkkkkkkkkkkkkkkkkkkkkkkkkkkk#',
          '#.......k................."""#',
          '#.......k................."""#',
          '#.......k....................#',
          '########k#############k#######'],
        ents: [
          { x: 0, y: 10, spr: 'invisible', touch: exit('road', 24, 5, 1, true) },
          { x: 8, y: 14, spr: 'invisible', touch: exit('market', 10, 11, 3, true) },
          { x: 22, y: 14, spr: 'invisible', touch: exit('nanyuan', 1, 8, 2, true) },
          { x: 10, y: 1, spr: 'door', col: '#5a3a22', on: exit('bedroom', 5, 7, 3) },
          { x: 7, y: 1, spr: 'window', on: S => S.narr(S.f.ph === 'heart' || S.f.ph === 'chen' ? '内室的窗。窗纸上，还溅着几点暗红。' : '内室的窗户。窗台上晒着一双纳了一半的鞋底，是妻子的针线。') },
          { x: 13, y: 1, spr: 'window', on: S => S.narr('堂屋的窗。祖宗牌位前的长明灯，从窗纸后头透出一点黄光。') },
          { x: 2, y: 3, spr: 'well', on: S => S.narr(S.f.ph === 'sneak' ? '井口黑洞洞的。往下看，水面上有一张脸——是你自己的。' : '院子里的老井。井绳磨得发亮，打上来的水冰得扎手。') },
          { x: 1, y: 7, spr: 'zao', light: { r: 2, col: 'rgba(255,140,60,.18)', flick: true }, on: S => S.narr('灶膛里的火还没熄。锅里温着一锅小米粥。') },
          { x: 3, y: 8, spr: 'vat', on: S => S.narr('一口大水缸。缸沿上落着一只蜻蜓，翅膀一动不动。') },
          { x: 12, y: 8, spr: 'basket', on: S => S.narr('一筐晒干的红枣，是岳母家捎来的。') },
          { x: 13, y: 8, spr: 'sack' },
          { x: 7, y: 12, spr: 'lantern', light: { r: 3.4, col: 'rgba(255,170,80,.2)', flick: true }, on: S => S.narr('大门边挂着的灯笼。纸上写着一个「王」字。') },
          { x: 9, y: 12, spr: 'lantern', light: { r: 3.4, col: 'rgba(255,170,80,.2)', flick: true } },
          { x: 21, y: 12, spr: 'sign', col: '#4a3a2a', on: S => S.narr('往南院去的侧门。南院住着二弟二郎一家，隔着一道墙。') },
          { x: 27, y: 8, spr: 'plant', on: S => S.narr('妻子种的一盆茉莉。开了两朵，香气淡淡的。') },
          /* 书斋小院 */
          { id: 'mgate', x: 19, y: 7, spr: 'mgate', z: 0, solid: false, async on(S) {
            if (S.ent('mgate').s.barred) { S.sfx('locked'); return S.narr('月洞门从里面闩上了。推了推，纹丝不动。\n门缝里一点声音也没有。'); }
            await S.narr('通往书斋小院的月洞门。门楣上题着两个字：「静读」。');
          } },
          { x: 24, y: 7, spr: 'invisible', solid: false, on: S => S.narr('矮墙塌了半截，碎土坯里长出几根野蒿。\n说了好几回要修，一直没修。') },
          { id: 'win', x: 17, y: 1, w: 3, spr: 'pwin', off: true, on: S => peek(S) },
          { id: 'sdoor', x: 21, y: 1, spr: 'door', col: '#4a3020', async on(S) {
            const ph = S.f.ph;
            if (ph === 'sneak') { S.sfx('locked'); return S.narr('书斋的门也关着。\n屋里点着灯，有一种细细的、沙沙的声音。像是有人在纸上写字。'); }
            if (['seek', 'hang'].includes(ph)) return S.narr('（不……不能再进那间屋子。）');
            if (['chen', 'erlang', 'ident', 'beg', 'heart'].includes(ph)) return S.narr('书斋的门大开着。屋里空荡荡的，一股说不出的腥气。\n你不想进去。');
            if (ph === 'market1' || ph === 'back') return S.narr('书斋的门掩着。她在里头睡午觉，说过不许人吵她。');
            if (ph === 'wife') return S.narr('她在里头歇着。先去内室，跟妻子把话说开吧。');
            S.sfx('open'); await S.go('study', 5, 5, 3);
          } },
          { id: 'bj1', x: 16, y: 2, spr: 'bajiao', async on(S) {
            if (S.f.rougeLost && !S.f.rougeFound && ['chen', 'erlang', 'beg', 'heart'].includes(S.f.ph)) {
              S.f.rougeFound = true; S.sfx('item');
              await S.narr('芭蕉丛底下的泥里，半埋着一只小瓷盒。\n盖子上画着一枝桃花。');
              await S.think('……苏州来的桃花胭脂。\n不是给我买的。');
              return;
            }
            await S.narr('一丛芭蕉。叶子又大又阔，风一吹，哗啦哗啦，像有人在里头翻书。');
          } },
          { id: 'bj2', x: 19, y: 4, spr: 'bajiao', on: S => S.narr(S.f.ph === 'sneak' ? '芭蕉叶子底下，窗里的灯光照不到。\n蹲在这儿，大气也不敢出。' : '又一丛芭蕉，叶子底下凉阴阴的。') },
          { id: 'rack', x: 21, y: 5, spr: 'rack', on: S => S.narr(S.f.ph === 'sneak' ? '晒书的木架子。架子后头，窗里的光照不过来。' : '晒书的木架子。架上摊着几本书，书页叫风翻得哗哗响。') },
          { x: 24, y: 5, spr: 'bajiao' },
          { x: 24, y: 2, spr: 'chair', col: '#4a3020', on: S => S.narr('廊下的竹椅。平日里你总坐在这儿读书。') },
          ...[...YSAFE].map((k, i) => { const [x, y] = k.split(',').map(Number); return { id: 'ds' + i, x, y, spr: 'dshade', decal: true, hidden: true }; }),
          ...LIT.map((k, i) => { const [x, y] = k.split(',').map(Number); return { id: 'gl' + i, x, y, spr: 'glow', decal: true, hidden: true, s: { d: Math.round(Math.hypot(x - 18, y - 1)) } }; }),
          /* 人 */
          { id: 'nv_h', x: 2, y: 10, spr: '@nv', hidden: true, on: S => S.say('姑娘', '公子家……真大。') },
          { id: 'dao_h', x: 7, y: 13, spr: '@dao', hidden: true, on: S => S.say('道士', '莫慌。它跑不远。') },
          { id: 'er_h', x: 9, y: 13, spr: '@erlang', hidden: true, on: S => S.say('二郎', '嫂嫂……') }
        ],
        async enter(S, first) {
          light(S);
          const ph = S.f.ph;
          if (ph === 'bring') {
            S.follow('nv_r', false); S.hide('nv_r');
            S.place('nv_h', 0, 10, 2); S.follow('nv_h', true);
            if (S.once('homeFirst')) {
              await S.narr('这就是王家。院子不大，收拾得干干净净。');
              await S.say('姑娘', '……怎么不见有人？', { style: 'whisper' });
              await S.say('王生', '这边是内室，内人在里头。东北角那个小院是我的书斋，平日里没人去。');
              S.goal('带她去书斋（东北角的月洞门里）');
            }
            return;
          }
          if (ph === 'back') {
            S.f.ph = 'sneak';
            S.ent('mgate').s.barred = true; S.ent('mgate').solid = true;   // solid 会同步给客机
            S.ent('win').off = false; LIT.forEach((k, i) => S.show('gl' + i)); [...YSAFE].forEach((k, i) => S.show('ds' + i)); resetGaze(S);
            light(S); S.amb('drone');
            await S.narr('太阳落下去了。院子里没有点灯。');
            await S.narr('书斋小院的月洞门，从里面闩上了。');
            await S.think('白天的时候……门从来不闩的。');
            await S.narr('隔着矮墙，书斋的窗纸亮着，有一个影子映在上面，低着头。\n沙沙，沙沙——像是在纸上画什么。');
            S.focus(18, 3); await S.wait(900); S.focus(null);
            await S.think('东边那段矮墙塌了半截。从那里……能翻进去。');
            await S.narr('（提示：轻轻地走，不要奔跑。\n沙沙声一停、窗上的光发绿，就是影子要抬头了——\n它抬头的时候，别站在灯光里。芭蕉、晒书架的背后，还有窗下的墙根，灯照不到。）');
            S.goal('从塌了的矮墙翻进去，躲着灯光摸到窗下偷看');
            S.cp('sneak');
            return;
          }
          if (ph === 'sneak') { resetGaze(S); return; }
          if (ph === 'erlang') {
            if (S.f.readJiashu || S.f.daoWait) { if (S.once('daoArrive')) await daoArrive(S); return; }
            /* 家书还没读：二郎晚一点到，给你在家里转一圈的时间 */
            S.f.daoWait = true;
            await S.think('（二郎去了有一会儿了……）');
            S.after(4000, async S => { if (S.map === 'home' && S.f.ph === 'erlang' && S.once('daoArrive')) await daoArrive(S); });
          }
        },
        step(S, x, y) {
          if (S.f.ph === 'sneak' && x === 24 && y === 7 && S.once('rubble')) return S.narr('你踩着碎土坯，翻进了书斋小院。\n脚底下「咯」地一声——你屏住了气。');
          if (S.f.ph === 'bring' && x >= 19 && y <= 8 && S.once('toStudy')) return (async () => {
            await S.say('姑娘', '这院子好静。芭蕉也好。', { style: 'whisper' });
            S.goal('推开书斋的门');
          })();
        },
        tick(S, dt) { sneakTick(S, dt); }
      },
      /* ---------------- 书斋 ---------------- */
      study: {
        amb: 'room', dark: .45, plr: 3.2, floor: 'wood', wall: 'wood',
        tileOpts: { woodC: '#5a4028' },
        rows: [
          '##########',
          '##########',
          '#........#',
          '#........#',
          '#........#',
          '#........#',
          '#####.####'],
        ents: [
          { x: 5, y: 6, spr: 'invisible', touch: exit('home', 21, 2, 0, true) },
          { x: 2, y: 1, spr: 'scroll', on: S => S.narr('墙上挂着一幅字：「书中自有颜如玉」。\n是你中秀才那年自己写的。') },
          { x: 5, y: 1, spr: 'window', on: S => S.narr('窗外是那丛芭蕉。窗纸是新糊的，薄得透光。') },
          { id: 'sbed', x: 7, y: 2, h: 2, spr: 'bed', col: '#7a6a5a', on: S => S.narr(S.f.ph === 'bring' ? '书斋里的一张窄床，平日里读书累了在这儿歪一会儿。' : '床铺得平平整整。枕头上有一股甜甜的香气，又像胭脂，又像别的什么。') },
          { x: 1, y: 2, spr: 'bookshelf', on: S => S.narr('《四书集注》《昭明文选》……还有一本《搜神记》，书脊都翻裂了。') },
          { x: 3, y: 3, spr: 'desk', on: S => S.narr('书案上的砚台干了。一张八股文写到一半，「然则」两个字后面，再没写下去。') },
          { x: 1, y: 5, spr: 'candle', light: { r: 3.4, col: 'rgba(255,170,80,.2)', flick: true } },
          { id: 'skin_s', x: 7, y: 2, h: 2, spr: 'skinv', hidden: true, solid: false, z: 1 },
          { id: 'cols_s', x: 6, y: 2, spr: 'colors', hidden: true, solid: false },
          { id: 'bao_s', x: 5, y: 2, spr: 'baoopen', hidden: true, solid: false },
          { id: 'brush_s', x: 6, y: 4, spr: 'brush', hidden: true, solid: false },
          { id: 'gui_s', x: 6, y: 3, spr: '@gui', dir: 2, hidden: true, solid: false },
          { id: 'nv_s', x: 6, y: 3, spr: '@nv', hidden: true, dir: 1, async on(S) {
            S.face('nv_s', 'pl');
            await S.say('姑娘', cycle(S, '_nvs', ['公子快去吧。夫人等着呢。', '这里很好。比那家好得多。', '公子……别跟旁人说我在这儿，好么？']));
          } }
        ],
        async enter(S, first) {
          light(S);
          if (S.f.ph !== 'bring') return;
          S.follow('nv_h', false); S.hide('nv_h');
          S.show('nv_s'); S.place('nv_s', 5, 4, 3);
          await S.walk('nv_s', [6, 3], 3);
          S.face('nv_s', 'pl');
          await S.narr('她在屋里转了一圈，伸手摸了摸床上的被褥，又摸了摸窗纸。');
          await S.say('姑娘', ['这屋子好。', '公子若是可怜我，就让我在这里躲些日子。', '只求一件——千万别让人知道。说出去，那家人找上门来，我就活不成了。']);
          const r = await S.ask('「千万别让人知道。」', ['你放心，我谁也不说。', '……我内人那里，总得说一声。'], '姑娘');
          S.f.toldWife = r === 1;
          if (r === 0) await S.say('姑娘', '公子真是好人。', { style: 'whisper' });
          else { S.bubble('nv_s', '…', 1200); await S.say('姑娘', '……夫人是正室，自然由她。只是公子要记着，我是怕人的。'); }
          S.bubble('nv_s', '♥', 1000);
          S.take('bao');
          await S.narr('她从你手里接过包袱，抱在怀里，像抱着一张叠好的衣裳。\n然后低下头笑了一笑。烛光底下，那张脸白得像新剥的菱角。');
          await S.card('数日后', '', '书斋的门总是掩着。\n你每天一早就往书斋去，夜里也不回内室。\n饭，也是端到书斋里吃的。');
          S.f.ph = 'wife';
          S.goal('回内室去（妻子在等你）');
          S.cp();
        }
      },
      /* ---------------- 内室 ---------------- */
      bedroom: {
        amb: 'room', dark: .5, plr: 3.2, floor: 'wood', wall: 'paper',
        wallC: { face: '#6a5a4a', top: '#1c1612' },
        tileOpts: { carpetC: '#5a2a2a', woodC: '#5e4430' },
        rows: [
          '###########',
          '###########',
          '#.........#',
          '#..ccc....#',
          '#..ccc....#',
          '#.........#',
          '#.........#',
          '#.........#',
          '#####.#####'],
        ents: [
          { id: 'bdoor', x: 5, y: 8, spr: 'invisible', touch: exit('home', 10, 2, 0, true) },
          { id: 'doorS', x: 5, y: 8, spr: 'doorS', solid: false, open: false, on: S => doorOn(S) },
          { id: 'whiskE', x: 5, y: 8, oy: -3, spr: 'whisk', hidden: true, z: 1, solid: false },
          { id: 'nv_b', x: 5, y: 8, spr: '@nv', hidden: true, solid: false, dir: 3, light: { r: 1.9, col: 'rgba(150,180,255,.16)' } },
          { id: 'bed2', x: 8, y: 2, h: 2, spr: 'bed', col: '#7a3a3a', on: S => bedOn(S) },
          { id: 'wbody', x: 8, y: 2, h: 2, spr: 'body', hidden: true, solid: false, z: 1, on: S => bedOn(S) },
          { id: 'vanity', x: 1, y: 2, spr: 'vanity', async on(S) {
            if (['chen', 'erlang', 'ident', 'beg', 'heart'].includes(S.f.ph)) {
              if (S.once('jiashu')) await S.narr('镜子里是一张哭肿的脸。\n妆奁底下压着一封信，是前几天写给娘的，没敢寄出去。');
              S.f.readJiashu = true;
              const n = W.ch.notes.jiashu;
              return S.note(n.title, S.f.toldWife ? n.text : n.text.replace('像是怕人听见。', '像是怕人听见。\n\n这件事，他连提都没跟我提过。'), 'jiashu');
            }
            await S.narr(S.f.ph === 'wife' ? '妻子的梳妆台。铜镜擦得锃亮，旁边一只胭脂盒，用了快一半了。' : '铜镜里映着半张屋子，黄澄澄的。');
          } },
          { id: 'chest', x: 3, y: 2, spr: 'dresser', col: '#6a3a2a', async on(S) {
            if (S.f.ph === 'heart' && S.f.beat && !S.has('silk') && !S.f.bound) { S.give('silk'); S.ent('chest').open = true; return S.narr('你一把掀开衣箱，扯出陪嫁的那匹红绸，「嘶」地撕下长长的一条。'); }
            await S.narr('陈氏陪嫁的樟木衣箱。一打开，满屋子樟脑味。\n最底下压着一匹红绸，出嫁那天剩下的。');
          } },
          { x: 5, y: 1, spr: 'window', on: S => S.narr(S.f.ph === 'hang' ? '窗外黑透了。连一声狗叫都没有。' : '窗纸上糊着一张剪纸，是一对鸳鸯。') },
          { x: 4, y: 3, w: 2, spr: 'lowtable', col: '#4a2a1a' },
          { x: 1, y: 6, spr: 'cabinet', col: '#5a3a2a', on: S => S.narr('衣柜里挂着王生的几件长衫，袖口都是妻子一针一针补过的。') },
          { id: 'lamp2', x: 9, y: 6, spr: 'candle', light: { r: 3.6, col: 'rgba(255,170,80,.22)', flick: true }, on: S => S.narr(S.f.ph === 'hang' || S.f.ph === 'night' ? '油灯的火苗缩成了黄豆大一点。' : '一盏油灯，灯芯剪得齐齐的。') },
          { id: 'chen_b', x: 3, y: 5, spr: '@chen', dir: 0, async on(S) {
            S.face('chen_b', 'pl');
            const ph = S.f.ph;
            if (ph === 'wife') return wifeTalk(S);
            if (ph === 'hang') return S.say('陈氏', S.f.hung ? '挂好了？……你今晚别出去了。' : '你手里拿的什么？……怎么脸白成这样？');
            await S.say('陈氏', cycle(S, '_cb', ['书斋里那位……你倒是上心。', '今天集市上热闹么？', '早点回来吃饭。']));
          } }
        ],
        async enter(S, first) {
          light(S);
          const ph = S.f.ph;
          if (ph === 'wife' && S.once('wifeIn')) { S.face('chen_b', 'pl'); await S.say('陈氏', '这几天，你都睡在书斋。\n……那里头的是谁？'); S.goal('跟妻子说说话'); return; }
          if (ph === 'hang') { if (S.once('hangIn')) { S.face('chen_b', 'pl'); await S.say('陈氏', '你这是怎么了？满头的汗——'); await S.say('王生', '别问！关门，关门！'); S.goal('把拂尘挂在卧室门上（站在门口，转身朝门）'); } return; }
          if (ph === 'heart' && S.once('heartIn')) {
            await S.narr('屋里还是昨夜的样子。\n他躺在床上，胸口那道口子，已经不流血了。');
            S.goal('到床前去');
          }
        }
      },
      /* ---------------- 集市 ---------------- */
      market: {
        amb: 'market', dark: .3, plr: 3.6, floor: 'stone', wall: 'brick',
        wallC: { face: '#6a5a4a', top: '#1c1814' },
        rows: [
          '############################',
          '############################',
          '#kkkkkkkkkkkkkkkkkkkkkkkkkkk',
          '#kkkkkkkkkkkkkkkkkkkkkkkkkk#',
          '#kkkkkkkkkkkkkkkkkkkkkkkkkk#',
          '#kkkkkkkkkkkkkkkkkkkkkkkkkk#',
          '#kkkkkkkkkkkkkkkkkkkkkkkkkk#',
          '#kkkkkkkkkkkkkkkkkkkkkkkkkk#',
          '#kkkkkkkkkkkkkkkkkkkkkkkkkk#',
          '#kkkkkkkkkkkkkkkkkkkkkkkkkk#',
          '#kkkkkkkkkkkkkkkkkkkkkkkkkk#',
          '#kkkkkkkkkkkkkkkkkkkkkkkkkk#',
          '##########k#################'],
        ents: [
          { x: 10, y: 12, spr: 'invisible', touch: exit('home', 8, 13, 3, true) },
          /* 东城门：出城直通城外的小路 */
          { id: 'egate', x: 27, y: 1, spr: 'door', col: '#3a2a1a', on: exit('road', 24, 5, 1) },
          { x: 25, y: 2, spr: 'sign', col: '#4a3a2a', on: S => S.narr('「东门」。出了这道门，就是城外那条小路。') },
          /* 青帝庙 */
          { id: 'miao', x: 20, y: 2, w: 2, spr: 'shrine', col: '#4a5a3a', async on(S) {
            if (S.f.fengGone) return S.narr('庙门半掩着。里面黑洞洞的，一个人也没有。\n地上只有一行赤脚印，走到神像跟前，就没了。');
            if (S.f.ph === 'seek') return S.narr('青帝庙。门锁着。\n香炉里的香，还是热的。');
            if (['hang', 'chen', 'erlang'].includes(S.f.ph)) return S.narr('「青帝庙」。道士约的就是这里。\n可庙门锁着，里面没有人。');
            await S.narr('一座小小的青帝庙。匾额上的金字剥落了，只剩「青帝」两个字还看得清。\n庙门口的香炉里插满了烧剩的香脚。');
          } },
          { x: 19, y: 2, spr: 'incense', light: { r: 1.8, col: 'rgba(255,150,80,.14)' }, async on(S) {
            if (S.once('qian')) await S.narr('香案上有一只签筒。你摇了摇，一支竹签跳了出来。');
            await S.note('qian');
          } },
          { x: 24, y: 2, spr: 'stonelantern', light: { r: 2.4, col: 'rgba(255,190,110,.16)' } },
          { x: 3, y: 1, spr: 'poster', col: '#d8ccaa', on: S => S.note('gaoshi') },
          { x: 7, y: 1, spr: 'lantern', light: { r: 2.4, col: 'rgba(255,160,80,.16)' }, on: S => S.narr('酒肆门口的灯笼，上头写着「杏花村」。字是红的，被雨淋得往下淌。') },
          /* 摊子 */
          { x: 2, y: 4, w: 2, spr: 'stall2', col: '#7a3a2a' },
          { id: 'tu', x: 3, y: 3, spr: '@tu', dir: 0, on: S => S.say('屠户', cycle(S, '_tu', ['新宰的猪，心肝都还热乎着呢！要不要来一副？', '这几日城外不太平。听说又死了一个，心叫人掏了。啧，比我下刀还利索。', '猪心？卖完了。今儿一早有个姑娘全买走了，说是给她爹补身子。']), {}) },
          { x: 2, y: 4, spr: 'invisible', solid: true, on: S => S.narr('案板上摆着一副猪下水。苍蝇嗡嗡地落了一层，屠户也懒得赶。') },
          { x: 6, y: 4, w: 2, spr: 'stall2', col: '#3a5a7a' },
          { id: 'yz', x: 7, y: 3, spr: '@yz', dir: 0, async on(S) {
            S.face('yz', 'pl');
            if (S.f.ph === 'market1' && !S.has('rouge')) {
              await S.say('胭脂娘', ['公子，给娘子挑一盒胭脂吧？这是苏州来的桃花胭脂。', '人要衣装，佛要金装。再丑的脸，抹上胭脂，也是一张好脸。']);
              const r = await S.ask('买一盒吗？', ['买（她肯定喜欢）', '不买']);
              if (r === 0) { S.give('rouge'); S.f.rouge = true; await S.say('胭脂娘', '公子好眼光。买给娘子的，还是买给……别人的？'); S.bubble('yz', '♥', 900); }
              return;
            }
            await S.say('胭脂娘', cycle(S, '_yz', ['胭脂、水粉、画眉的螺子黛——公子要什么？', '前些天有个姑娘来，把我这儿的青黛、朱砂、铅粉一样买了一大包。买这么多，是要画一整张脸不成？']));
          } },
          { x: 6, y: 4, spr: 'invisible', solid: true, on: S => S.narr('胭脂摊上一排排小瓷盒，红的、粉的、白的。\n一面铜镜立在摊子中间，照出来的人脸都是黄的。') },
          { x: 11, y: 4, w: 2, spr: 'stall2', col: '#5a6a3a' },
          { id: 'bing', x: 12, y: 3, spr: '@bing', dir: 0, on: S => S.say('卖饼的', cycle(S, '_bing', ['热烧饼，两文一个！', '看见那边那个疯子没有？成天躺在粪堆里唱歌。别理他，他打人的。', '那道士？不知道哪座山上下来的，在这儿转悠三天了，一个钱也不要，见了人就盯着看。'])) },
          { x: 11, y: 4, spr: 'invisible', solid: true, on: S => S.narr('炉子里的炭火烤得饼面焦黄，芝麻的香味一阵一阵地飘过来。') },
          { x: 15, y: 9, w: 2, spr: 'cart', on: S => S.narr('一辆独轮车，上面堆着白菜。推车的人蹲在墙根底下打盹。') },
          { x: 24, y: 10, spr: 'barrel', on: S => S.narr('一只酒坛子，泥封已经破了，一股酸味。') },
          { x: 25, y: 10, spr: 'crate' },
          { id: 'suan', x: 4, y: 8, spr: '@suan', dir: 0, async on(S) {
            S.face('suan', 'pl');
            if (S.f.ph === 'seek') {
              await S.say('算命瞎子', ['道士？……出城去了。往东，城外那条小路。', '集市东头就是东城门，从那儿出去最近。', '公子，你身上的胭脂味儿淡了。底下那股土腥气，倒是浓了。']);
              S.f.daoEast = true; S.goal('从集市东头的城门出城，去追道士'); return;
            }
            if (S.f.ph === 'beg') return S.say('算命瞎子', '娘子，那疯子在粪堆上。他要你做什么，你就做什么。别问。');
            await S.say('算命瞎子', ['这位公子，留步。', '瞎子我眼睛不中用，鼻子却灵。公子身上，好香。', '……香得过了头，就不是好事了。']);
          } },
          { x: 3, y: 8, spr: 'sign', col: '#e8e0c8', on: S => S.narr('布幡上写着：「铁口直断　不准不要钱」。\n「断」字底下，被谁添了一笔，成了「断肠」。') },
          { id: 'cr1', x: 9, y: 7, spr: '@cr1', dir: 2, on: S => S.say('路人', cycle(S, '_c1', ['城东李家的那个，你听说了吧？心没了，人还睁着眼呢。', '怪就怪在门窗都好好的，连只鸡都没丢。'])) },
          { id: 'cr2', x: 10, y: 7, spr: '@cr2', dir: 1, on: S => S.say('妇人', cycle(S, '_c2', ['我家那口子，这几天天一黑就不许出门。', '都说是狐狸精。我看狐狸可没这么狠。'])) },
          { id: 'cr3', x: 14, y: 11, spr: '@cr3', dir: 3, on: S => S.say('小孩', cycle(S, '_c3', ['疯子又在唱歌了！', '我娘说，往那疯子身上扔石头，他就会追着你咬。'])) },
          /* 疯子那一段才围过来的人 */
          { id: 'cr4', x: 13, y: 5, spr: '@cr4', hidden: true, on: S => S.say('挑夫', '……啧啧。') },
          { id: 'cr5', x: 13, y: 8, spr: '@cr5', hidden: true, on: S => S.say('老妇人', '作孽哟。') },
          { id: 'cr6', x: 18, y: 11, spr: '@cr1', hidden: true, on: S => S.say('路人', '看什么看，又不是看你。') },
          { id: 'cr7', x: 12, y: 10, spr: '@cr2', hidden: true, on: S => S.say('妇人', '……') },
          { x: 13, y: 11, spr: 'coin', on: S => S.narr('地上一枚铜钱，被人踩进了泥里。\n你没有捡。') },
          /* 粪堆和疯子 */
          { x: 23, y: 6, w: 2, spr: 'dung', decal: true },
          { x: 23, y: 6, spr: 'flies', z: 1, solid: false },
          { id: 'feng', x: 23, y: 6, w: 2, spr: 'fenglie', on: S => fengOn(S) },
          { id: 'feng_s', x: 22, y: 6, spr: '@feng', hidden: true, on: S => fengOn(S) },
          /* 道士 */
          { id: 'dao_m', x: 15, y: 6, spr: '@dao', dir: 0, async on(S) {
            S.face('dao_m', 'pl');
            if (S.f.ph === 'market1') return daoMeet(S);
            if (S.f.ph === 'seek') return daoBeg(S);
            await S.say('道士', '去吧。');
          } },
        ],
        async enter(S, first) {
          light(S);
          const ph = S.f.ph;
          if (ph === 'market1') {
            if (first) {
              await S.narr('太原城里的集市，正是热闹的时候。\n吆喝声、驴叫声、铁匠铺叮叮当当的打铁声。');
              S.goal('在集市上转转');
            }
            return;
          }
          if (ph === 'back') { S.hide('dao_m'); return; }
          if (ph === 'heart') S.hide('dao_m');
          if (ph === 'seek') {
            S.hide('dao_m');
            ['cr1', 'cr2', 'cr3', 'tu', 'yz', 'bing'].forEach(i => S.hide(i));
            if (S.once('seekIn')) { await S.narr('集市已经散了。摊子收得七七八八，满地烂菜叶。\n道士不见了。'); S.goal('打听道士的去向'); }
            return;
          }
          if (ph === 'beg') {
            S.hide('dao_m');
            if (!S.f.fengGone) ['cr1', 'cr2', 'cr3', 'tu', 'yz', 'bing'].forEach(i => S.show(i));
            if (S.once('begIn')) {
              await S.narr('集市上人来人往，跟往常一样热闹。\n没有人知道，王家昨夜死了一个人。');
              await S.narr('路东头的粪堆上，那个疯子仰面躺着，正扯着嗓子唱歌。');
              S.goal('去求那个疯子');
            }
          }
        },
        step(S, x, y) {
          if (S.f.ph === 'market1' && Math.abs(x - 15) + Math.abs(y - 6) <= 2) return daoMeet(S);
        }
      },
      /* ---------------- 南院（二郎家） ---------------- */
      nanyuan: {
        amb: 'wind', dark: .35, plr: 3.6, floor: 'dirt', wall: 'mud',
        rows: [
          '####################',
          '####################',
          '#..................#',
          '#..................#',
          '#..................#',
          '#..................#',
          '#..................#',
          '#..................#',
          '...................#',
          '#..................#',
          '#..................#',
          '####################'],
        ents: [
          { x: 0, y: 8, spr: 'invisible', touch: exit('home', 22, 13, 3, true) },
          { x: 4, y: 1, spr: 'door', col: '#5a3a22', on: S => S.narr('二郎家的堂屋。门上贴的门神，一张被风撕掉了半边。') },
          { x: 8, y: 1, spr: 'window', on: S => S.narr('窗台上晾着一排咸菜疙瘩。') },
          { x: 14, y: 1, spr: 'door', col: '#4a3020', on: S => S.narr('灶房的门。里面热气腾腾的，一股柴火味。') },
          { x: 2, y: 2, spr: 'mill', on: S => S.narr('一盘石磨。磨盘边上落着一层白白的豆面。') },
          { x: 13, y: 2, spr: 'zao', light: { r: 2.4, col: 'rgba(255,140,60,.18)', flick: true }, on: S => S.narr('院里搭的露天灶，大锅里煮着腌菜用的盐水，咕嘟咕嘟冒泡。\n灶火一跳一跳的，把院子里的人影投在地上。') },
          { x: 17, y: 2, spr: 'barrel', on: S => S.narr('腌冬菜的大缸。一层白菜一层盐，压着一块青石头。') },
          { x: 18, y: 2, spr: 'barrel' },
          { x: 17, y: 4, spr: 'doghouse', on: S => S.narr('狗窝。里头垫着干草，还有一块啃得发白的骨头。') },
          { id: 'dog', x: 16, y: 5, spr: 'dog', dir: 1, on: S => dogOn(S) },
          { id: 'vat2', x: 10, y: 5, spr: 'vat', on: S => vatOn(S) },
          { id: 'bowls', x: 6, y: 8, spr: 'bowls', col: '#6a4a30', on: S => bowlsOn(S) },
          { x: 2, y: 9, spr: 'crate', on: S => S.narr('一筐刚收的萝卜，泥还没洗。') },
          { x: 15, y: 9, spr: 'plant', on: S => S.narr('墙角一株石榴，果子已经摘光了，只剩一个裂开口子的，红籽露在外面。') },
          /* 人影：只画在人脚下（画出来的东西没有影子） */
          { id: 'sh_liu', x: 3, y: 3, spr: 'shade', decal: true, hidden: true },
          { id: 'sh_sun', x: 13, y: 3, spr: 'shade', decal: true, hidden: true },
          { id: 'sh_bai', x: 11, y: 5, spr: 'shade', decal: true, hidden: true },
          { id: 'er_n', x: 7, y: 5, spr: '@erlang', dir: 0, on: S => erOn(S) },
          { id: 'sao', x: 5, y: 2, spr: '@sao', dir: 0, on: S => saoOn(S) },
          { id: 'liu', x: 3, y: 3, spr: '@liu', dir: 1, hidden: true, on: S => womanOn(S, 'liu') },
          { id: 'sun', x: 13, y: 3, spr: '@sun', dir: 3, hidden: true, on: S => womanOn(S, 'sun') },
          { id: 'bai', x: 11, y: 5, spr: '@pozi', dir: 1, hidden: true, on: S => womanOn(S, 'bai') },
          { id: 'dao_n', x: 9, y: 9, spr: '@dao', dir: 3, hidden: true, on: S => daoIdent(S) },
          { id: 'pskin', x: 4, y: 7, w: 2, spr: 'skinflat', hidden: true, solid: false, light: { r: 1.6, col: 'rgba(220,255,220,.15)' } },
          { id: 'bao_n', x: 11, y: 6, spr: 'baoopen', hidden: true, solid: false },
          { id: 'gl_n', x: 4, y: 6, w: 2, spr: 'guilie', hidden: true, solid: false, light: { r: 1.8, col: 'rgba(110,255,150,.14)' } },
          { id: 'ghead', x: 5, y: 6, spr: 'ghead', hidden: true, solid: false },
          { id: 'smoke', x: 4, y: 5, w: 2, spr: 'smoke', hidden: true, solid: false, z: 1 },
          { id: 'gourd', x: 5, y: 7, spr: 'gourd', hidden: true, solid: false }
        ],
        async enter(S, first) {
          light(S);
          const ph = S.f.ph;
          if (ph === 'chen') {
            S.show('er_n'); S.place('er_n', 7, 5, 1);
            if (S.once('nyChen')) { await S.narr('天刚亮。南院里静悄悄的，二郎蹲在院子里劈柴。'); S.goal('跟二郎说'); }
            return;
          }
          if (ph === 'ident') {
            ['liu', 'sun', 'bai', 'dao_n'].forEach(i => S.show(i));
            S.show('er_n'); S.place('er_n', 7, 9, 3); S.ent('dog').s.bark = true;
            if (S.once('nyIdent')) {
              S.sfx('knock'); await S.narr('南院里一股酱菜的咸味。\n院子那头，大黄狗不知冲着谁，汪汪地叫个不停。');
              await S.say('二郎媳妇', ['嫂嫂……二郎都跟我说了。', '这三个婆子都是我今早从人市上领回来的，帮着腌冬菜。我、我哪分得清谁是谁……']);
              S.face('dao_n', 'pl');
              await S.say('道士', ['贫道一进门，它就把妖气收得一丝不漏。', '三个婆子，哪一个是它——娘子是个细心人，替贫道看一看。', '看准了，再来告诉我。看错了，它就跑了。']);
              S.goal('找出三个婆子里哪一个是妖怪（看仔细，再去告诉道士）');
              if (S.coop) S.toast('两个人可以分头去问、再对一对口供——向道士指认时，两人要选同一个');
            }
            return;
          }
          if (['beg', 'heart'].includes(ph)) { ['liu', 'sun', 'bai', 'dao_n', 'er_n'].forEach(i => S.hide(i)); S.ent('dog').s.bark = false; }
        },
        /* 辨认阶段：影子和粥碗跟着「这一局是谁」走（主机每帧同步，hidden 和 e.s 都会传给客机） */
        tick(S, dt) {
          const on = S.f.ph === 'ident' && WOM[S.f.gw];
          for (const w of WIDS) { const sh = S.ent('sh_' + w), e = S.ent(w); if (!sh || !e) continue; const hid = !on || w === S.f.gw || e.hidden; if (sh.hidden !== hid) sh.hidden = hid; }
          if (!on) return;
          const b = S.ent('bowls'), fb = WOM[S.f.gw].seat; if (b && b.s.fb !== fb) b.s.fb = fb;
        }
      }
    }
  });
  /* ================= 剧情：前半（王生） ================= */
  async function meetGirl(S) {
    await S.say('王生', '姑娘，天还没亮透，一个人抱着包袱，这是往哪里去？');
    S.bubble('nv_r', '…', 1200);
    await S.say('姑娘', '……公子是过路的人。问这些做什么。');
    const r = await S.ask('她咬着嘴唇，把包袱抱得更紧了。', ['我看姑娘是有难处。说说无妨。', '……是小生唐突了。'], '');
    if (r === 1) { await S.narr('你拱了拱手，正要走。'); await S.say('姑娘', '公子——', { style: 'whisper' }); await S.narr('她在背后叫住了你。声音细细的，带着哭腔。'); }
    await S.say('姑娘', ['爹娘贪图人家的钱财，把我卖进了一户富贵人家，给人做妾。', '那家的大娘子妒心重，早上骂，晚上打，拿针扎我的手指头……', '我实在受不住了，趁天没亮，逃了出来。']);
    S.face('nv_r', 'pl');
    await S.say('王生', '那你如今要往哪里去？');
    await S.say('姑娘', '逃命的人，哪有什么去处。走到哪里，算哪里罢了。');
    const r2 = await S.ask('「哪有什么去处。」', ['寒舍就在前面不远，姑娘不嫌弃，先去避一避。', '城里有座尼姑庵，可以去投靠。']);
    if (r2 === 1) {
      await S.say('姑娘', ['尼姑庵？那家人头一个就要去庵里搜。', '……公子家里，不行么？']);
      await S.narr('她抬起眼睛看着你。那双眼睛，湿漉漉的，像清早的露水。');
    }
    S.bubble('nv_r', '♥', 1000);
    await S.say('姑娘', '公子肯收留，我……我给公子磕头了。');
    await S.narr('她把包袱递给你。你替她接了过来。\n包袱轻得出奇，像里面什么也没装。');
    S.give('bao');
    S.f.ph = 'bring';
    S.follow('nv_r', true);
    S.goal('带她回家（沿小路往东进城）');
  }

  async function wifeTalk(S) {
    S.face('chen_b', 'pl');
    if (S.f.ph !== 'wife' || S.f.wifeDone) return;
    await S.say('陈氏', '书斋里那个姑娘，是哪家的？');
    await S.say('王生', ['城外路上碰见的。说是被爹娘卖给大户人家做妾，受不住正房打骂，逃出来的。', '一个弱女子，没处可去，我就……']);
    S.bubble('chen_b', '…', 1400);
    await S.say('陈氏', ['大户人家逃出来的妾？', '相公，你读的是圣贤书。私藏人家的逃妾，叫人家寻上门来，是要吃官司的。', '还是趁早送她走吧。']);
    const r = await S.ask('「还是趁早送她走吧。」', ['过几天，等她缓过来，我就送她走。', '一个弱女子，能惹出什么事？你别多心。'], '陈氏');
    S.f.dismiss = r === 1;
    if (r === 0) await S.say('陈氏', '……但愿你说话算话。');
    else { await S.say('陈氏', '我多心？'); await S.narr('她没再说什么，转过身去，拿起了针线。\n针扎进鞋底，扎得很深。'); }
    await S.say('陈氏', '你去集市上走走吧。醒醒脑子。');
    S.f.wifeDone = true; S.f.ph = 'market1';
    S.goal('去集市（从院子南边的大门出去）');
    S.cp();
  }

  async function daoMeet(S) {
    if (S.f.ph !== 'market1') return;
    S.f.ph = 'back';
    S.face('dao_m', 'pl'); S.bubble('dao_m', '!', 1000);
    await S.say('道士', '这位相公，留步。');
    await S.narr('一个道士拦在了你面前。须发花白，一双眼睛却亮得吓人，一眨不眨地盯着你的脸。');
    await S.say('道士', '相公这几日，可曾遇见过什么人？');
    await S.say('王生', '……不曾。');
    await S.say('道士', '你浑身上下邪气缠绕，还说不曾？', { style: 'big' });
    const r = await S.ask('道士盯着你。', ['没有就是没有。', '道长怕是看错了人。']);
    if (r === 1) await S.say('道士', '贫道看人，从没看错过。');
    await S.think(['明明是个美人，哪来的妖怪。', '这些游方道士，无非是借着驱邪捉鬼，骗几个钱罢了。']);
    await S.say('王生', '道长请便。小生还要买东西。');
    S.bubble('dao_m', '…', 1400);
    await S.say('道士', '糊涂啊。世上真有死到临头，还不醒悟的人！');
    await S.narr('道士叹了一口气，转身走了。');
    await S.walk('dao_m', [[20, 6], [20, 4]], 3);
    S.hide('dao_m');
    S.sfx('laugh');
    await S.narr('远处，路东头的粪堆上，有人哈哈大笑起来。');
    S.goal('天快黑了，逛一逛就回家');
    S.cp();
  }

  async function fengOn(S) {
    const ph = S.f.ph;
    if (ph === 'beg') return fengBeg(S);
    if (S.f.fengGone) return S.narr('粪堆上只剩一个人形的坑。苍蝇还在那里嗡嗡地转。');
    if (S.once('fengSong')) {
      await S.narr('一个疯子仰面躺在粪堆里，满身的泥，鼻涕拖得老长，扯着嗓子在唱：');
      await S.say('疯子', '画眉笔，画眉笔，一笔青来一笔赤——\n画得美人好颜色，揭开来，是张皮！', { style: 'whisper' });
      S.sfx('laugh');
      await S.say('疯子', '哈！公子，你胸口里那颗心还在不在？借我咬一口！');
      await S.think('……疯子。');
      return;
    }
    await S.say('疯子', cycle(S, '_fg', ['人人都爱好颜色，好颜色！哈哈哈哈！', '别靠近我，公子，你身上的胭脂味儿，熏得我想吐。', '（他翻了个身，在粪土里打起了呼噜。）']));
  }

  /* ---------------- 潜行偷窥 ---------------- */
  function sneakTick(S, dt) {
    if (S.f.ph !== 'sneak' || S.map !== 'home' || S.f.caught || W.busy) return;
    const p = S.pl, w = S.ent('win'), inYard = YARD(p.x, p.y);
    /* 跑起来，屋里的影子就听见了（S.running 在客机操作时也准确） */
    if (S.running && inYard && S.f.gz === 'p' && S.f.gzT > .3) { S.f.gzT = .3; S.bubble('win', '?', 900); S.sfx('tick'); }
    S.f.gzT -= dt;
    /* 低头描画时一直有沙沙声；声音一停，就是要抬头了 */
    if (S.f.gz === 'p' && p.x >= 14 && p.y <= 9) { S.f.scT = (S.f.scT || 0) - dt; if (S.f.scT <= 0) { S.f.scT = .7; S.sfx('paper'); } }
    if (S.f.gz === 'w' && w) { const fr = S.f.gzT > .73 ? 0 : S.f.gzT > .37 ? 1 : 2; if (w.s.wf !== fr) w.s.wf = fr; }
    if (S.f.gzT <= 0) {
      if (S.f.gz === 'p') { gazeSet(S, 'w'); S.f.gzT = 1.1; S.sfx('whisper'); S.bubble('win', '…', 1100); }
      else if (S.f.gz === 'w') { gazeSet(S, 'l'); S.f.gzT = 2; S.sfx('heart'); }
      else { gazeSet(S, 'p'); S.f.gzT = 2.0 + Math.random() * 1.4; S.f.scT = .2; }
    }
    /* 抬头时站在灯光里：先给 0.4 秒宽限（影子停住、冒个「?」），一次抬头里累计超过就被看见 */
    if (S.f.gz === 'l' && LITSET.has(p.x + ',' + p.y) && !p.hidden) {
      if (S.f.spotT == null) { S.f.spotT = .4; S.bubble('win', '?', 700); S.sfx('tick'); }
      S.f.spotT -= dt;
      if (S.f.spotT <= 0) { S.f.caught = true; S.after(0, sneakCaught); }
    }
  }
  async function sneakCaught(S) {
    if (S.f.ph !== 'sneak') return;
    S.sfx('sting');
    await S.narr('窗纸上的那个影子，忽然一动不动了。\n它正对着你。');
    await S.wait(500);
    S.ent('win').s.torn = true; S.sfx('tear');
    await S.scare('face', { spr: '@gui', dur: 1.1 });
    await S.die('窗纸「噗」地破了一个洞。\n一只青绿色的手伸了出来，冰凉冰凉的，按在你的胸口上。\n\n第二天，王家的书斋里只剩下那个姑娘。\n她坐在窗下，对着镜子，一笔一笔地描着眉毛。', '窗纸破了');
  }
  async function peek(S) {
    if (S.f.ph !== 'sneak') return S.narr(S.f.ph === 'bring' || S.f.ph === 'wife' ? '书斋的窗，新糊的窗纸，白生生的。' : '窗纸上有一个指头捅出来的小洞。\n你不敢再往里看了。');
    if (S.pl.y !== 2) return;
    S.f.ph = 'peek';
    await S.narr('你贴着墙根蹲下，用指头蘸了点唾沫，在窗纸上轻轻捅开一个小洞——');
    S.ent('win').s.torn = true;
    LIT.forEach((k, i) => S.hide('gl' + i)); [...YSAFE].forEach((k, i) => S.hide('ds' + i));
    S.amb('none');
    S.hidePlayer(true);
    await S.go('study', 5, 5, 3, { ms: 500 });
    S.dark(.55); S.focus(6, 3);
    S.show('gui_s'); S.place('gui_s', 6, 3, 2); S.show('skin_s'); S.ent('skin_s').s.paint = 0; S.show('cols_s'); S.show('bao_s'); S.hide('nv_s');
    await S.wait(600);
    await S.narr('屋里点着一盏灯。床边站着一个东西。');
    await S.narr('它的脸是青绿色的，像在水里泡了很多天的菜叶。\n嘴咧着，里面的牙一颗一颗，尖得像锯齿。');
    S.sfx('heart');
    await S.narr('床上平平地铺着一张人皮。\n有头发，有眉毛，有手指头。只是没有眼睛——眼眶那里，是两个空空的白。');
    await S.narr('床脚边，她那个包袱摊开着。\n里面没有衣裳——只有一包一包的青黛、朱砂、铅粉。');
    await S.wait(400); S.sfx('paper'); S.ent('skin_s').s.paint = 1;
    await S.narr('它拿起一支彩笔，俯下身，一笔，一笔，描那张脸上的眼睛。');
    await S.wait(400); S.sfx('paper'); S.ent('skin_s').s.paint = 2;
    await S.narr('画好了眼睛，又描眉。\n描得那样细，那样耐心，像一个对着镜子梳妆的姑娘。');
    await S.wait(400); S.sfx('paper'); S.ent('skin_s').s.paint = 3;
    await S.narr('最后，它蘸了一点朱砂，在那张脸的嘴唇上，轻轻一点。');
    await S.wait(500);
    S.show('brush_s'); S.sfx('drip');
    await S.narr('它把笔一扔。');
    S.ent('skin_s').s.up = true; S.sfx('tear'); S.shake(300, 1);
    await S.narr('双手提起那张人皮，像抖一件衣裳那样，抖了两抖——');
    await S.wait(400);
    S.sfx('whisper');
    await Promise.all([S.alpha('gui_s', 0, 900), S.alpha('skin_s', 0, 900)]);
    S.show('nv_s'); S.place('nv_s', 6, 3, 2); S.ent('nv_s').alpha = 0; await S.alpha('nv_s', 1, 900);
    await S.narr('披在了身上。');
    await S.wait(700);
    await S.narr('……站在床边的，是那个姑娘。');
    S.face('nv_s', 0);
    await S.narr('她抬手理了理鬓角，转过脸来——\n冲着窗纸上那个小洞，盈盈地笑了一笑。');
    S.sfx('heart'); await S.wait(300); S.sfx('heart');
    if (S.has('rouge')) { S.take('rouge'); S.f.rougeLost = true; await S.narr('你怀里那盒桃花胭脂掉在了地上，骨碌碌滚进了芭蕉丛里。'); }
    await S.fade(1, 400);
    S.hide('gui_s'); S.hide('skin_s'); S.hide('cols_s'); S.hide('bao_s'); S.hide('brush_s'); S.place('nv_s', 6, 3, 1); S.hide('nv_s');
    S.focus(null); S.hidePlayer(false);
    S.f.ph = 'seek'; S.ent('win').off = true;
    const mg = S.ent('mgate'); mg.s.barred = false; mg.solid = false;
    await S.go('home', 24, 8, 0, { ms: 300 });
    S.amb('wind');
    await S.narr('你不知道自己是怎么翻出那堵矮墙的。\n两条腿软得像面条，牙齿咯咯地打着架。');
    await S.think('道士……那个道士说得对！');
    S.goal('去集市找那个道士！');
    S.cp('seek');
  }

  async function daoBeg(S) {
    await S.narr('你扑通一声跪在了泥地里。');
    await S.say('王生', ['道长！道长救命！', '是小生有眼无珠……那、那东西——']);
    await S.say('道士', '贫道都知道了。');
    await S.narr('道士背着手，看着雾里很久，才开口。');
    await S.say('道士', ['这东西也可怜。苦苦寻了这么久，才找到一个替身。', '贫道……也不忍心伤它性命。']);
    await S.narr('他从背后抽出一柄拂尘，递了过来。');
    S.give('whisk');
    await S.say('道士', ['把它挂在你卧房的门上。', '明日，到青帝庙来找我。']);
    S.sfx('whisper');
    await S.alpha('dao_r', 0, 1200);
    await S.narr('一阵风过去，雾合上了。路上只剩你一个人。');
    S.f.ph = 'hang';
    S.goal('回家，把拂尘挂在卧室门上');
    S.cp();
  }

  /* 卧房的门：挂拂尘、夜里从门缝往外看，都在这里（站在门口那一格，转身朝门） */
  async function doorOn(S) {
    const ph = S.f.ph;
    if (ph === 'night') return nightPeek(S);
    if (ph === 'hang' && S.has('whisk')) return hangWhisk(S);
    if (S.f.whiskTorn) return S.narr('门板裂了一道大缝。门楣上的钉子还在，拂尘被扯得粉碎，雪白的马尾毛撒了一地。');
    if (S.f.hung) return S.narr('拂尘高高地挂在门楣上。马尾毛垂下来，白得发亮。');
    await S.narr('卧房的门。门板上贴着成亲那年的喜字，已经褪成了粉白色。');
  }
  async function hangWhisk(S) {
    S.take('whisk'); S.f.hung = true; S.show('whiskE'); S.sfx('knock');
    await S.narr('你搬来凳子，把拂尘高高地挂在了卧房的门楣上。\n马尾毛垂下来，白得发亮。');
    await S.say('陈氏', '相公，到底出了什么事？');
    await S.say('王生', ['……书斋里那个，不是人。', '我亲眼看见的。她把自己的脸……铺在床上画。']);
    S.bubble('chen_b', '!', 1000);
    await S.narr('陈氏的脸一下子白了。她什么也没再问，走过去，把门闩插上了。');
    S.goal('……天黑了');
    await S.wait(600);
    await nightAttack(S);
  }

  /* 一更：控制交给陈氏（原文「自不敢窥也，使妻窥之」） */
  async function nightAttack(S) {
    await S.fade(1, 900);
    S.ent('lamp2').light = { r: 2, col: 'rgba(255,150,70,.18)', flick: true };
    S.dark(.86); S.plr(1.7);
    S.hide('chen_b'); S.wear('@chen'); S.pos(4, 6, 3);
    S.ent('wbody').s.wound = false; S.show('wbody');
    await S.card('一更', '——现在，你是王生的妻子，陈氏', '他不敢睡在外头，缩在帐子里，\n两只眼睛直勾勾地盯着帐顶。\n\n你坐在床边，守着那盏快灭的灯。' + (S.coop ? '\n\n（双人游戏：现在把操作交给另一位玩家）' : ''));
    if (S.coop) S.toast('按 T 交换操作——后半夜，换另一个人来当陈氏');
    await S.fade(0, 900);
    await S.wait(800);
    S.sfx('step'); await S.wait(350); S.sfx('step'); await S.wait(500); S.sfx('step');
    await S.narr('门外，有细细碎碎的脚步声。\n一步，一步，走得很轻，像怕踩疼了地。');
    await S.say('王生（帐子里）', '你……你去看看。我不敢看。', { style: 'whisper' });
    S.f.ph = 'night';
    S.goal('到门边去，从门缝往外看（站在门口，转身朝门）');
  }
  async function nightPeek(S) {
    S.f.ph = 'attack';
    S.focus(5, 6);
    await S.narr('你凑到门缝边上。');
    S.ent('doorS').s.ajar = true;
    S.show('nv_b'); S.place('nv_b', 5, 8, 3); S.ent('nv_b').alpha = .55;
    await S.narr('月光底下，站着那个姑娘。');
    await S.narr('她抬头看见门上的拂尘，站住了，不敢往前。\n站了很久。牙咬得咯吱咯吱地响。');
    S.sfx('whisper');
    await S.alpha('nv_b', 0, 900);
    S.ent('doorS').s.ajar = false;
    await S.narr('她走了。');
    await S.wait(1400);
    await S.say('王生（帐子里）', '……走了？', { style: 'whisper' });
    S.sfx('step'); await S.wait(300); S.sfx('step');
    S.ent('doorS').s.ajar = true;
    S.show('nv_b'); S.place('nv_b', 5, 8, 3); S.ent('nv_b').alpha = .8;
    S.sfx('sting');
    await S.narr('过了一会儿，她又回来了。');
    await S.say('姑娘', '道士吓唬我！', { style: 'big' });
    await S.say('姑娘', '难道到了嘴边的东西，还要吐出来不成！', { style: 'big' });
    S.sfx('tear'); S.shake(500, 3);
    S.hide('whiskE'); S.f.whiskTorn = true;
    await S.narr('她一把扯下拂尘，撕得粉碎。');
    S.sfx('thud'); S.shake(700, 5); S.fx('flash');
    const d = S.ent('doorS'); d.open = true; d.cracked = true; d.s.ajar = false; S.ent('nv_b').alpha = 1;
    S.walk('pl', [3, 5], 6);
    await S.narr('门板「哐」地一声被撞开了——\n你被撞得跌坐在地上。');
    S.place('nv_b', 5, 7, 3);
    await S.walk('nv_b', [[7, 4], [7, 3]], 5);
    S.face('nv_b', 2);
    await S.narr('她看也没看你一眼，径直走到床前，爬了上去。');
    await S.fade(1, 200);
    S.sfx('tear'); await S.wait(300); S.sfx('scream'); S.shake(900, 4);
    await S.wait(1200);
    await S.narr('……');
    await S.narr('黑暗里，有一种湿漉漉的声音。\n像有人在剖一只熟透了的瓜。');
    await S.wait(900);
    S.sfx('whisper');
    await S.narr('然后，什么声音都没有了。');
    S.hide('nv_b');
    S.ent('wbody').s.wound = true;
    S.ent('lamp2').light = { r: 3, col: 'rgba(255,150,70,.2)', flick: true };
    S.dark(.8); S.plr(2.6);
    S.pos(7, 4, 2);
    await S.fade(0, 1400);
    S.sfx('cry');
    await S.narr('你哆嗦着，把灯点亮了。');
    await S.narr('他仰面躺在床上，胸口被撕开了一个大洞。\n腔子里血糊糊的，空空荡荡。\n\n——他的心，被掏走了。');
    await S.fade(1, 1200);
    S.focus(null);
    S.pos(7, 5, 3);
    S.f.ph = 'chen'; S.dark(null); S.plr(null);
    S.ent('lamp2').light = { r: 3.6, col: 'rgba(255,170,80,.22)', flick: true };
    await S.card('第二天', '', '你一夜没有合眼。\n天亮了。你擦干眼泪——\n不能就这么让他白白死了。');
    await S.fade(0, 600);
    S.amb('room');
    await S.think('那道士……相公说，那道士约他今天在青帝庙见。\n我一个妇道人家，不便去。叫二郎去请。');
    S.bubble('vanity', '…', 2600);
    await S.think('（娘那封信……还压在妆奁底下。）');
    S.goal('去南院，叫小叔子二郎去请道士');
    S.cp();
  }
  /* ================= 剧情：后半（陈氏） ================= */
  async function erOn(S) {
    S.face('er_n', 'pl');
    const ph = S.f.ph;
    if (ph === 'chen') {
      await S.say('二郎', '嫂嫂？这么早……你的脸色怎么——');
      await S.say('陈氏', ['二郎，你哥哥……没了。', '昨夜那个东西来了，把他的心……掏走了。']);
      S.bubble('er_n', '!', 1200);
      await S.narr('二郎手里的斧子「当」地掉在地上。');
      await S.say('陈氏', ['前日集市上有个道士，跟你哥哥说过他身上有邪气。', '你哥哥说，那道士约他今天在青帝庙见。你快去，把道长请来。']);
      await S.say('二郎', '我这就去！嫂嫂你先回家，哪儿也别去！');
      await S.walk('er_n', [1, 8], 5); S.hide('er_n');
      S.f.ph = 'erlang';
      S.goal('回家等二郎请道士来');
      return;
    }
    if (ph === 'ident') return S.say('二郎', cycle(S, '_er', ['嫂嫂，三个婆子都是我媳妇今早从人市领回来的。我……我一个也不认得。', '那条狗平时不叫的。今儿是怎么了。']));
    await S.say('二郎', '嫂嫂……');
  }

  async function daoArrive(S) {
    S.f.gw = S.f.gw || WIDS[S.rand(3)];   // 这一局，画皮藏在哪个婆子身上
    S.show('dao_h'); S.show('er_h'); S.place('dao_h', 8, 12, 3); S.place('er_h', 9, 12, 3);
    await S.narr('过了半晌，大门外头一阵急急的脚步声。');
    await S.walk('dao_h', [8, 11], 3); S.face('dao_h', 'pl');
    await S.say('二郎', '嫂嫂，道长来了！');
    await S.narr('道士进了院子，一句话也没问。\n他站在院子当中，慢慢地朝四面望了一圈。');
    S.face('dao_h', 3); await S.wait(500); S.face('dao_h', 2); await S.wait(500); S.face('dao_h', 1); await S.wait(500);
    S.face('dao_h', 0);
    await S.say('道士', ['我本来可怜它，不忍伤它性命。', '这孽障，竟敢如此！', '……幸好，还没走远。']);
    await S.say('道士', '南边那个院子，是谁家？');
    await S.say('二郎', '是、是小人家。');
    await S.say('道士', '它现在就在你家。');
    S.bubble('er_h', '!', 1200);
    await S.say('二郎', ['不可能！我刚从家里出来——', '……我媳妇今早从人市领了三个婆子回来，帮着腌冬菜。难道……']);
    await S.say('道士', '那便是了。走。');
    S.f.ph = 'ident';
    S.hide('dao_h'); S.hide('er_h');
    await S.go('nanyuan', 3, 8, 2);
    S.cp('ident');
  }

  async function saoOn(S) {
    S.face('sao', 'pl');
    if (S.f.ph !== 'ident') return S.say('二郎媳妇', cycle(S, '_sao', ['嫂嫂来了？屋里坐。', '嫂嫂……你要节哀。']));
    await S.say('二郎媳妇', cycle(S, '_sao2', [
      '早饭是三个婆子一起吃的，一人一碗，各吃各的。\n刘婆子坐左手，挨着磨；白婆子坐当中；孙婆子坐右手，挨着灶。',
      '刘婆子是个话匣子，一早上嘴就没停过。孙婆子不爱说话，一直蹲在灶边上。白婆子说话细声细气的，一来就去水缸边洗菜。',
      '人市的牙婆说只有两个肯来的，到门口一数，跟进来的却是三个。……我当时也没多想。',
      '那狗？平时见了生人顶多叫两声。今儿不知怎么了，叫得嗓子都哑了。']));
  }

  async function womanOn(S, who) {
    S.face(who, 'pl');
    S.f['saw_' + who] = true;
    const gw = S.f.gw, nm = WOM[who].nm;
    if (who === 'liu') {
      await S.say('刘婆子', ['哎哟，这位就是王家大娘子吧？节哀，节哀！', '老婆子一早上推了两斗豆子，早饭吃了两大碗，这会儿又饿了。人老了，就剩一张嘴了，哈哈。']);
      await S.narr('她的手又粗又大，指甲缝里塞满了白白的豆面。');
    } else if (who === 'sun') {
      await S.say('孙婆子', '……娘子。');
      await S.narr('她不爱说话，两只手被盐水泡得通红、起皱，正一下一下地往灶里添柴。');
      await S.say('孙婆子', '早饭？……吃了。一碗，吃干净了。');
    } else {
      await S.narr('她背对着你，弯着腰在水缸边洗菜。\n你叫了她一声，她过了好一会儿，才慢慢地转过身来。');
      await S.say('白婆子', ['娘子有什么吩咐？', '老婆子手脚慢，早饭也吃得慢……可也吃完了。娘子多担待。'], { style: 'whisper' });
      await S.narr('她的手湿漉漉的，攥着一把菜叶，指头泡得发白。');
    }
    /* 顺口说起另一个人：人说的都是实话；只有「那一个」真的没吃，旁人才会觉得不对劲 */
    const p = PART[who];
    await S.say(nm, p === gw ? TESTI_ODD[who] : TESTI_OK[who], who === 'bai' ? { style: 'whisper' } : {});
    if (who === gw) { S.bubble(who, '…', 900); await S.narr('她冲你笑了一笑。'); }
  }
  async function bowlsOn(S) {
    if (S.f.ph !== 'ident') return S.narr('饭桌上空空的。');
    S.f.clueBowl = true;
    const i = WOM[S.f.gw].seat;
    await S.narr('饭桌上摆着三只粗瓷碗，还没收。\n' + ['左手', '当中', '右手'][i] + '那只盛得满满的，粥面上结了一层皮，筷子都没动过。\n另外两只，舔得干干净净。');
  }
  async function dogOn(S) {
    if (S.f.ph !== 'ident') return S.narr('大黄趴在狗窝边上，懒洋洋地摇了摇尾巴。');
    S.f.clueDog = true; S.sfx('knock');
    await S.narr('大黄浑身的毛都炸了起来，夹着尾巴，冲着院子当中，一声比一声叫得凶。\n狗鼻子比人灵——它闻见的那个东西，就在这院子里。');
  }
  async function vatOn(S) {
    if (S.f.ph !== 'ident') return S.narr('一口洗菜的大水缸。水面上漂着几片菜叶。');
    S.f.clueVat = true;
    await S.narr('你往水缸里看了一眼。水面晃晃悠悠的，映着灰白的天。');
    S.sfx('sting');
    await S.narr('水底下，慢慢地浮上来一只手。\n——一只青绿色的手。' + VATH[S.f.gw]);
    await S.wait(300);
    await S.narr('你一眨眼，水面一晃，什么也没有了。');
  }

  async function daoIdent(S) {
    S.face('dao_n', 'pl');
    if (S.f.ph !== 'ident') return S.say('道士', '去吧。');
    const res = await S.vote('「娘子，是哪一个？」', ['推磨的刘婆子', '看灶的孙婆子', '洗菜的白婆子', '（我再看看）'], '道士');
    if (!res.agree) {
      await S.narr('（你们俩指的，不是同一个人。）');
      await S.say('道士', '看不准，就别说。它就等着你们说错——再看看。');
      return;
    }
    if (res.v === 3) {
      await S.say('道士', cycle(S, '_dh', ['它画得再像，也有画不到的地方。人有影子——画出来的东西，可没有。娘子看看她们脚底下。', '水比人眼老实。碗也是——人要吃饭，画出来的东西，吃不下人间的粥。']));
      return;
    }
    const who = WIDS[res.v];
    if (who !== S.f.gw) return wrongPick(S, who);
    await S.say('陈氏', '是她。' + WOM[who].job + '那个——' + WOM[who].nm + '！');
    await exorcise(S);
  }
  async function wrongPick(S, who) {
    const nm = WOM[who].nm, G = WOM[S.f.gw], e = S.ent(who);
    await S.say('陈氏', '是' + nm + '！');
    await S.walk('dao_n', [Math.round(e.px / 16), Math.round(e.py / 16) + 1], 5);
    S.sfx('cut'); S.shake(300, 2);
    await S.narr('道士的木剑朝' + nm + '劈了下去——' + nm + '「哎哟」一声，跌坐在地上，吓得直哭。');
    await S.say('道士', '……不是她！', { style: 'big' });
    S.sfx('laugh');
    S.hide(S.f.gw);
    await S.narr('院子那头，传来一声又细又尖的笑。\n' + G.where + '的' + G.nm + '已经不见了，地上只剩一件空空的灰布褂子。');
    await S.end({ bad: true, id: 'gone', title: '它走了', text: '一阵黑风卷过南院的墙头，往北去了。\n道士追了三天，空着手回来。\n\n后来，有人在百里之外的一条小路上，看见一个抱着包袱的姑娘，\n独自站在柳树底下，等着过路的读书人。' });
  }

  async function exorcise(S) {
    const gw = S.f.gw, G = WOM[gw];
    /* 原文：道士仗木剑，立庭心，呼曰：「孽魅！偿我拂子来！」 */
    await S.walk('dao_n', [9, 6], 4);
    S.face('dao_n', gw);
    S.sfx('cut'); S.fx('flash'); S.shake(500, 3);
    await S.say('道士', '孽魅！偿我拂子来！', { style: 'big' });
    S.face(gw, 'dao_n'); S.bubble(gw, '!', 1000);
    await S.narr(G.nm + '惶惶地四下一望，脸上一下子没了人色。\n她扔下手里的活计，扭头就往门口跑——');
    await Promise.all([S.walk(gw, [5, 6], 4.6), (async () => { await S.wait(250); await S.walk('dao_n', [6, 7], 5.2); })()]);
    S.face('dao_n', 3);
    S.sfx('cut'); S.fx('flash'); S.shake(500, 3);
    await S.narr('道士追上去，一剑打在她背上。她扑倒在地——');
    S.hide(gw);
    S.place('gl_n', 4, 6); S.place('pskin', 4, 7); S.focus(5, 6);
    S.sfx('tear'); S.shake(600, 2);
    await S.narr('只听「哗」地一声，一张人皮从她身上整个脱落下来。\n地上趴着的，是一个青面獠牙的厉鬼。');
    S.sfx('scream'); S.ent('dog').s.bark = true;
    await S.scare('face', { spr: '@gui', dur: .8 });
    S.sfx('laugh');
    await S.narr('它四脚抓地，在地上打着滚，嚎叫的声音，像一头待宰的猪。');
    await S.narr('道士举起木剑，一剑砍下了它的脑袋。');
    S.sfx('cut'); S.fx('red'); S.shake(500, 4);
    S.place('ghead', 5, 6); S.hide('gl_n'); S.place('smoke', 4, 5);
    S.walk('ghead', [[6, 6], [7, 6]], 5);
    await S.narr('脑袋骨碌碌滚出去老远。\n身子「噗」地化成一团浓烟，贴着地面盘成一堆，翻滚不停。');
    S.hide('ghead');
    S.place('gourd', 5, 7); S.sfx('whisper');
    await S.narr('道士拔开一只葫芦的塞子，放进烟里。\n葫芦口「飗飗」作响，像有一张嘴在吸气——眨眼之间，烟被吸得干干净净。');
    S.hide('smoke'); S.hide('gourd'); S.sfx('knock');
    S.ent('dog').s.bark = false;
    S.place('bao_n', G.x, G.y + 1);
    await S.narr(G.where + '，她扔下的东西旁边，搁着一个包袱。\n——正是那天清早，他在城外替那个姑娘抱回家的那一个。里面只剩半包青黛。');
    await S.note('pijuan');
    S.hide('pskin'); S.hide('bao_n'); S.focus(null);
    S.place('dao_n', 5, 7, 0);
    S.f.ph = 'plea';
    S.goal('……');
    await S.narr('道士把人皮和那个空包袱卷在一起，背起袋子，转身要走。');
    await S.narr('你扑通一声跪在他面前，拉住他的袍角，哭着磕头。');
    await S.say('陈氏', '道长！求您救救我家相公！求您让他活过来！');
    await S.say('道士', ['贫道法术浅薄，实在不能起死回生。', '……贫道给娘子指一个人。他或许能。', '集市上有一个疯子，常常躺在粪土里。娘子去给他磕头，求他。', '他若发起疯来羞辱娘子——娘子千万不要动气。']);
    await S.narr('二郎也认得那个疯子。他张了张嘴，什么也没说出来。');
    S.sfx('whisper');
    await S.alpha('dao_n', 0, 1000);
    await S.narr('一转眼，道士已经不见了。');
    S.f.ph = 'beg';
    S.goal('去集市，求那个疯子');
    S.cp('beg');
  }

  /* ---------------- 集市·求疯子 ---------------- */
  const FAIL = {
    back: ['没能回头', '你站起身，头也不回地走了。\n身后，疯子的笑声追了你一整条街。\n\n那天夜里，你守着丈夫的尸首，一直坐到天亮。\n那颗心，再也没有回来。'],
    curse: ['骂出了口', '「你这疯子！」\n\n疯子不笑了。他翻了个身，背对着你，在粪土里打起了呼噜。\n任你再怎么磕头，他再也没有睁开过眼睛。'],
    grab: ['棍子断了', '你一把夺过棍子，「咔」地折成两截。\n\n疯子愣了一愣，拍着大腿笑得打滚：\n「好！好泼辣的娘子！这样的娘子，还要男人做什么！」\n\n他爬起来，钻进人堆里，再也找不到了。'],
    run: ['你躲了', '棍子落下来，你缩着身子一躲再躲，最后捂着脸，从人群里挤了出去。\n\n笑声在你背后响成一片。\n那天以后，太原城里多了一个说法——\n王家的娘子，为了一个死人，在粪堆跟前磕过头。'],
    slap: ['一巴掌', '你一巴掌打开了他的手。\n\n疯子看着地上的那摊东西，叹了一口气：\n「可惜。可惜。」\n\n他站起身，晃晃悠悠地走进了青帝庙。\n庙里再也没有人出来。'],
    hesitate: ['那口痰落在了地上', '你看着那只手，怎么也张不开嘴。\n\n疯子等了一会儿，手一翻，那口痰落在了地上。\n「可惜。可惜。」\n\n他站起身，晃晃悠悠地走进了青帝庙。\n庙里再也没有人出来。']
  };
  async function fengFail(S, k) {
    S.clearTimer(); S.f.endure = null; S.wear('@chen');
    S.sfx('laugh'); S.amb('market');
    await S.die(FAIL[k][1], FAIL[k][0]);
  }
  async function fengBeg(S) {
    if (S.f.fengGone) return;
    if (S.f.endure) {   // 挨打的时候去碰他：想夺棍子
      const r = await S.ask('棍子又落了下来。', ['（不……忍着）', '（夺下他的棍子！）']);
      if (r) return fengFail(S, 'grab');
      return;
    }
    S.cp('feng');
    await S.narr('疯子还躺在粪堆里，唱着那支歌。\n你在他跟前跪了下来，用膝盖一步一步地往前挪。');
    S.hide('feng'); S.show('feng_s'); S.place('feng_s', 23, 6, 0);
    S.wear('@chen_k');
    await S.walk('pl', [23, 7], 1.4);
    S.pos(23, 7, 3);
    await S.say('疯子', '哈哈哈！美人儿爱上我啦？', { style: 'big' });
    await S.say('陈氏', '我丈夫叫妖怪掏了心……道长说，只有您能救他。求求您……');
    S.sfx('laugh');
    await S.say('疯子', ['救他？', '天底下的男人多的是，个个都能当你丈夫！', '一个贪色的东西，救他做什么？']);
    const r = await S.ask('满身的臭气熏得你睁不开眼。「救他做什么？」', ['（磕头）求求您，救救他。', '他不是贪色的人……他只是心软。', '你这疯子，怎么说话的！', '（站起来，转身就走）']);
    if (r === 2) return fengFail(S, 'curse');
    if (r === 3) return fengFail(S, 'back');
    if (r === 1) {
      S.sfx('laugh');
      await S.say('疯子', ['不贪色？哈哈哈哈！', '不贪色，怎么会把一张画皮领回家？不贪色，怎么会死？']);
      await S.narr('你张了张嘴，一个字也说不出来。');
    } else { S.sfx('thud'); await S.narr('你把额头磕在地上。粪土的臭气直往鼻子里钻。'); }
    await S.say('疯子', ['怪事，怪事！', '人死了，跑来求我让他活。我是阎王爷吗？']);
    /* 开打：集市的热闹一下子没了 */
    S.amb('none');
    S.sfx('thud'); S.shake(400, 3); S.fx('red');
    ['cr4', 'cr5', 'cr6', 'cr7'].forEach(i => S.show(i));
    const walks = CROWD.map(([id, x, y]) => S.walk(id, [x, y], 3.6));
    await S.narr('他抄起一根棍子，劈头盖脸地朝你打下来。');
    S.sfx('thud'); S.shake(400, 3);
    await S.narr('街上的人渐渐围了过来，围得像一堵墙。有人指指点点，有人捂着嘴笑。');
    await Promise.all(walks);
    CROWD.forEach(([id, x, y]) => S.place(id, x, y, x < 23 ? 2 : x > 23 ? 1 : 3));
    S.sfx('laugh'); S.bubble('cr1', '…', 1500);
    await S.say('路人', '哟，这不是王家的大娘子吗？', { style: 'whisper' });
    S.sfx('laugh'); S.bubble('cr2', '…', 1500);
    await S.say('妇人', '啧啧……为了个男人，跪在粪堆跟前。', { style: 'whisper' });
    await S.think('（忍着。别躲，别动。\n……道长说了，千万不要动气。）');
    S.f.endure = { t: .2, k: 0, n: 0, cd: 0 };
    S.goal('忍着——别动');
    S.toast('别按方向键。一躲，就是缩手了。');
    S.timer(6, '忍着', endureDone);
  }
  /* 挨打的六秒：每 0.8 秒一棍；玩家一动（S.moving，客机操作时也准确）就算缩了一下，三次就跑了 */
  function endureTick(S, dt) {
    const E = S.f.endure;
    if (!E || S.f.ph !== 'beg' || S.map !== 'market' || W.busy || W.ended) return;
    E.t -= dt; E.cd = Math.max(0, E.cd - dt);
    if (E.t <= 0) {
      E.t = .8; E.k++; S.sfx('thud'); S.shake(260, 2);
      S.bubble(CROWD[(E.k * 3) % CROWD.length][0], '…', 700);
      if (E.k % 3 === 0) S.sfx('laugh');
    }
    const p = S.pl, moved = S.moving || p.x !== 23 || p.y !== 7;
    if (!moved) return;
    S.pos(23, 7, 3);
    if (E.cd > 0) return;
    E.n++; E.cd = .7; S.sfx('thud'); S.shake(300, 3); S.sfx('laugh');
    if (E.n >= 3) { S.f.endure = null; S.clearTimer(); S.after(0, S => fengFail(S, 'run')); return; }
    S.toast(E.n === 1 ? '（你缩了一下。四周的笑声更响了。）' : '（你又往后躲了。再躲……就忍不住了。）');
  }
  async function endureDone(S) {
    if (!S.f.endure) return;
    S.f.endure = null;
    S.sfx('thud'); S.shake(300, 2);
    await S.narr('你一声不吭，忍着疼，一下一下地挨着。');
    await S.wait(400);
    S.face('feng_s', 'pl');
    await S.narr('疯子停下手，盯着你看了半天。\n然后，他「咯」地一声，咳出一大口痰，满满地捧在手心里，凑到你嘴边。');
    await S.say('疯子', '吃了它！', { style: 'big' });
    S.sfx('laugh');
    /* 原文「陈红涨于面，有难色」：犹豫太久，他就不等了 */
    S.timer(5, '', S => fengFail(S, 'hesitate'), { during: true });
    const r = await S.ask('四下里一片哄笑。你的脸涨得通红。', ['（想起道士的话……闭上眼，咽下去）', '（打掉他的手）']);
    S.clearTimer();
    if (r) return fengFail(S, 'slap');
    await S.wait(600);
    await S.narr('你闭上眼睛，硬着头皮，咽了下去。');
    S.sfx('heart');
    await S.narr('那东西滑进喉咙，硬得像一团棉絮，咯噔咯噔地往下走，\n一直沉到胸口，停在了那里。');
    S.amb('market'); S.sfx('laugh');
    await S.say('疯子', '哈哈哈！美人儿果然爱我！', { style: 'big' });
    S.wear('@chen');
    await S.narr('疯子大笑着站起来，头也不回地走了。');
    await S.walk('feng_s', [[23, 5], [23, 4], [21, 4], [21, 3]], 3);
    S.face('feng_s', 3);
    await S.alpha('feng_s', 0, 700);
    await S.narr('你追过去，追进青帝庙里——\n庙里空空荡荡。前前后后找了个遍，连个人影也没有。');
    S.f.fengGone = true;
    ['cr4', 'cr5', 'cr6', 'cr7'].forEach(i => S.hide(i));
    for (const id in CROWD_HOME) { const [x, y, d] = CROWD_HOME[id]; S.place(id, x, y, d); }
    await S.narr('围着看的人散了。你又羞又恨，一路哭着回了家。');
    S.f.ph = 'heart';
    S.goal('回家');
    S.cp();
  }

  /* ---------------- 内室·心 ---------------- */
  let hbT = 0;
  function heartTick(S, dt) {   // 热气在散：心跳越来越快，白气越冒越浓
    if (S.f.ph !== 'heart' || !S.f.beat || S.f.bound || !W.timer || S.map !== 'bedroom') return;
    const left = Math.max(0, W.timer.left), b = S.ent('wbody');
    hbT -= dt; if (hbT <= 0) { hbT = .35 + left / 14 * .6; S.sfx('heart'); }
    if (b) { const st = Math.min(4, Math.floor((1 - left / 14) * 5)); if (b.s.steam !== st) b.s.steam = st; }
  }
  async function bedOn(S) {
    const ph = S.f.ph;
    if (ph === 'night') return S.say('王生（帐子里）', '……别、别过来——哦，是你。\n你快去门口看看，外头是什么。', { style: 'whisper' });
    if (WANG.includes(ph) || ph === 'road') return S.narr(ph === 'hang' ? '你钻进帐子，把被子拉到了下巴。' : '夫妻俩的床。帐子是成亲那年新扯的，大红的颜色已经洗淡了。');
    if (ph !== 'heart') return S.narr('他还躺在那里，眼睛半睁着，像是还有话没说完。\n你不敢多看。');
    const b = S.ent('wbody');
    if (!S.f.beat) {
      await S.narr('你扑在床前，抱着他的身子，放声大哭。');
      S.sfx('cry');
      await S.narr('家里的人远远地站在门外，没有一个敢走近。');
      await S.narr('想起他是怎么把那个女人领进门的，想起集市上那一棍一棍，想起那口痰……\n你哭得喘不过气，哭得恨不能跟他一起死了。');
      await S.wait(400);
      S.sfx('thud'); S.shake(500, 2);
      await S.narr('忽然，胸口那团东西猛地往上一顶——\n你「哇」地一声，吐了出来。');
      S.sfx('splash');
      await S.narr('吐出来的东西，正好落进了他胸口那个空空的腔子里。');
      await S.wait(600);
      b.s.beat = true; S.sfx('heart'); await S.wait(500); S.sfx('heart');
      await S.narr('你愣住了。\n——那是一颗人心。\n在他的胸腔里，突突地，还在跳。');
      await S.narr('一股热气，像蒸笼里的白雾一样，从伤口里腾腾地往上冒。');
      await S.narr('你用两只手死命按住伤口——可一松手，热气就往外冒。\n顾不上了。得找东西把它缠紧！');
      S.f.beat = true; hbT = 0;
      S.goal('找东西把伤口缠紧——樟木衣箱里有绸子！');
      S.cp('heart');
      S.timer(14, '热气在散', heartFail, { during: true });
      return;
    }
    if (S.f.bound) return;
    if (!S.has('silk')) return S.narr('热气还在一丝一丝地往外冒。\n得找东西缠住——衣箱！陪嫁的那匹红绸！');
    S.clearTimer(); S.take('silk');
    S.sfx('tear');
    await S.narr('你把红绸一圈一圈，紧紧地缠在他的胸口上。');
    b.s.band = true; S.f.bound = true;
    await S.narr('热气不冒了。\n你用手摸了摸，红绸底下，有一点温温的。');
    await finale(S);
  }
  async function heartFail(S) {
    if (S.f.bound) return;
    S.ent('wbody').s.beat = false;
    await S.die('热气一缕一缕地从伤口里散尽了。\n胸腔里那颗心，跳得越来越慢，越来越慢……\n终于不动了。', '心凉了');
  }

  async function finale(S) {
    await S.fade(1, 1200);
    S.ent('lamp2').light = { r: 3, col: 'rgba(255,170,80,.22)', flick: true };
    await S.card('半夜', '', '你把灯挑亮，守在床前。\n一直守到半夜。');
    S.dark(.82);
    await S.fade(0, 900);
    await S.wait(600);
    S.sfx('heart'); await S.wait(700);
    await S.narr('被子底下，有了一丝气息。');
    await S.wait(500);
    await S.say('王生', '……水。', { style: 'whisper' });
    S.sfx('chime');
    await S.narr('天亮的时候，王生醒了过来。');
    await S.say('王生', ['我……像是做了一场好长的梦。', '只是心口，隐隐地有些疼。']);
    await S.narr('他低头看了看胸口。\n那道伤口结了一块痂，铜钱大小。\n\n——不多久，就全好了。');
    await S.fade(1, 1400);
    await S.card('异史氏曰', '', '愚哉世人！明明妖也，而以为美。\n迷哉愚人！明明忠也，而以为妄。\n\n然爱人之色而渔之，\n妻亦将食人之唾而甘之矣。\n\n天道好还，但愚而迷者不寤耳。\n可哀也夫！\n\n——《聊斋志异·画皮》');
    let tail = '后来，王生再也没有在书斋里收留过来路不明的人。';
    if (S.f.dismiss) tail += '\n「你别多心」这句话，他也再没有说过。';
    if (S.f.rougeFound) tail += '\n\n那盒从芭蕉丛里捡回来的桃花胭脂，陈氏收在妆奁最底下，\n一直没有用。';
    tail += '\n\n只是每年春天，书斋窗外那丛芭蕉抽出新叶的时候，\n陈氏总要拿一把剪子，把它们剪得干干净净。\n\n——她说，那哗啦哗啦的声音，像有人在翻一张皮。';
    await S.end({ id: S.f.rougeFound ? 'rouge' : 'good', title: '第九夜　完', text: tail });
  }
})();
