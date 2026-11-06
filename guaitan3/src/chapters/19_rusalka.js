/* ================= 第十九夜 · 水仙女 ================= */
(() => {
  /* 本次游玩里死过几回（检查点会回滚 S.f，这里不会） */
  const DIED = { water: 0, parsley: 0 };
  const HAIR = '#3a6e4e', HAIR2 = '#24483a', SKIN = '#c4d8d0';
  /* 头上的花环：矢车菊（蓝）、雏菊（白）、黑麦穗（黄） */
  function wreath(cols) {
    return (g, d, fr, G, R) => {
      const y = G.hT - 1;
      for (let i = 0; i < 6; i++) R(3 + i * 2, y + (i === 0 || i === 5 ? 1 : 0), 2, 1, cols[i % cols.length]);
      R(4, y - 1, 1, 1, cols[1]); R(11, y - 1, 1, 1, cols[0]);
    };
  }
  /* 水仙女：绿头发一直垂到脚踝，湿透的白衬衣，光脚，往下滴水 */
  function rusExtra(g, d, fr, G, R) {
    wreath(['#4a6ad8', '#ecece0', '#c8b050'])(g, d, fr, G, R);
    if (d === 0) {
      R(3, G.tT, 1, 12, HAIR); R(12, G.tT, 1, 12, HAIR); R(2, G.tT + 4, 1, 9, HAIR2); R(13, G.tT + 5, 1, 8, HAIR2);
      R(5, G.hT + 3, 1, 5, HAIR2); R(10, G.hT + 3, 1, 6, HAIR2);
      R(6, G.hT + 4, 1, 2, '#030605'); R(9, G.hT + 4, 1, 2, '#030605');
      R(6, G.hT + 6, 4, 1, '#3a2a30');
      R(7, G.tB + 3, 1, 2, '#8ec4d0'); R(4, G.tB + 5, 1, 1, '#8ec4d0');
    } else if (d === 3) {
      R(3, G.hT + 2, 10, 17, HAIR); R(4, G.hT + 4, 1, 14, HAIR2); R(8, G.hT + 5, 1, 13, HAIR2); R(11, G.hT + 3, 1, 15, HAIR2);
    } else {
      R(8, G.hT + 2, 5, 16, HAIR); R(11, G.hT + 4, 1, 13, HAIR2);
    }
  }
  /* 穿上婚礼衬衣的阿廖娜：雪白麻布，袖口和领口绣着红罂粟 */
  function alyExtra(g, d, fr, G, R) {
    rusExtra(g, d, fr, G, R);
    if (d === 0) { R(6, G.tT, 4, 1, '#b02a2a'); R(3, G.tT + 4, 1, 2, '#b02a2a'); R(12, G.tT + 4, 1, 2, '#b02a2a'); R(5, G.tB + 1, 6, 1, '#b02a2a'); R(7, G.tT + 3, 2, 1, '#1a1a18'); }
    else if (d === 1) { R(7, G.tT + 4, 2, 2, '#b02a2a'); R(5, G.tB + 1, 5, 1, '#b02a2a'); }
  }
  /* 娜佳：一根粗辫子，系红头绳；白衬衣领口绣红花 */
  function meExtra(g, d, fr, G, R) {
    if (d === 0) { R(6, G.tT, 4, 1, '#b0302c'); R(3, G.tT + 4, 1, 1, '#b0302c'); R(12, G.tT + 4, 1, 1, '#b0302c'); }
    else if (d === 3) { R(7, G.hT + 6, 2, 9, '#7a4a22'); R(7, G.hT + 15, 2, 1, '#c0302c'); }
    else R(10, G.hT + 6, 2, 8, '#7a4a22');
  }

  const GLOW = { r: 2, col: 'rgba(150,220,190,.15)' };
  /* 标题卡在窄屏上只在全角空格处折行（词内加 WORD JOINER） */
  const nb = s => s.split('　').map(p => [...p].join('\u2060')).join('　');
  const HERBS = { 1: 'thyme', 2: 'tansy', 3: 'worm', 4: 'parsley', 5: 'mullein', 6: 'lovage', 7: 'worm2', 8: 'mint' };
  const HERB_DESC = {
    1: '第一号钉子：一把细细的、木头一样硬的小茎，顶上挂着紫色的碎花。\n凑近一闻，甜甜的，又有一点辣。',
    2: '第二号钉子：叶子深绿，像蕨菜那样一排一排地裂开；顶上一簇平平的黄花，像衣裳上的扣子。\n揉一下——苦，还冲鼻子，像药铺里的樟脑。',
    3: '第三号钉子：叶子灰白，碎碎的，像一根根小羽毛；翻过来，背面白得像落了一层霜。\n顶上垂着一串小小的黄珠子。舔一下指头——苦得舌根发麻。',
    4: '第四号钉子：叶子亮绿亮绿的，三片一簇，边上带齿。\n一股菜汤的香味。',
    5: '第五号钉子：叶子又大又厚，灰白色，毛茸茸的，像兔子的耳朵。\n闻着有一点淡淡的蜜味，一点也不苦。',
    6: '第六号钉子：大片的、发亮的深绿叶子，像芹菜，可是大得多。\n香味浓得冲脑门。',
    7: '第七号钉子：这一把晒得更干，颜色发银。叶子裂成细细的条，两面都蒙着一层白毛。\n一串低着头的小黄花球。凑近一闻——一股苦味直钻进喉咙里。',
    8: '第八号钉子：方方的茎，皱皱的叶子。\n凉凉的，像冬天的风。'
  };
  const HERB_WRONG = {
    1: '这是百里香，香香甜甜的——三一节撒在地上的就是它。',
    2: '苦是苦，可这是樟脑的冲味儿，扣子一样的黄花——是艾菊。名字里有个「艾」字，它可不是苦艾。',
    4: '欧芹！一股菜汤味儿。你要是揣着它出门……她们就该叫你「小亲亲」了。',
    5: '毛茸茸的，有股蜜味——毛蕊花，熬水治咳嗽的。灰是灰，可一点也不苦。',
    6: '欧当归。姑娘们拿它泡水洗头，好让小伙子喜欢。',
    8: '薄荷，凉飕飕的。'
  };
  const GOAL_HERB = '在前屋（左边）梁上认出两把苦艾，回来告诉外婆是几号（双人：一人念练习本，一人去看）';
  const GOAL_RYE = '穿过黑麦田，去河边找斯捷潘';
  const GOAL_MEADOW = '沿着河滩往东，走到老白桦那儿（歌声一起：往高处走，或站到苦艾木桩旁边；双人：一人听歌喊「停」，一人赶路）';
  const GOAL_BIRCH = '把斯捷潘从水里叫回来（调查白桦树上的她）';
  function villageGoal(S) {
    const f = S.f;
    if (S.has('sorochka')) return '带着苦艾和衬衣，往南穿过黑麦田，去河边找斯捷潘';
    if (f.marfaNo && f.letter) return '把阿廖娜的信拿给玛尔法婶婶看——或者直接往南，去河边找斯捷潘';
    if (f.marfaNo) return '玛尔法婶婶不肯给衬衣。问问白桦树下的姑娘们——或者直接往南，去河边找斯捷潘';
    return '往南穿过黑麦田，去河边找斯捷潘（外婆说：最好先跟玛尔法婶婶要阿廖娜的衬衣）';
  }

  /* ---------------- 合成声音 ---------------- */
  /* 水边的歌：小调，七个音，约 3.3 秒；正好填满一段「歌声」 */
  const SONG = [[659, .38], [587, .38], [523, .55], [587, .38], [659, .7], [494, .35], [440, .56]];
  const SONG_LEN = 3.3;
  function songPhrase(S, vol = .09, d0 = 0) {
    let d = d0;
    for (const [f, l] of SONG) { S.tone('sine', f, f * 1.012, l * .96, vol, d, 2400); S.tone('triangle', f / 2, f / 2, l * .96, vol * .35, d, 900); d += l; }
  }
  /* 「送水仙女」的歌：姑娘们在远处唱，大调，闷闷的 */
  const SEEOFF = [[392, .42], [440, .42], [494, .62], [440, .42], [392, .82], [330, .6], [392, .95]];
  function seeoffSong(S, vol = .045) { let d = 0; for (const [f, l] of SEEOFF) { S.tone('triangle', f, f, l * .95, vol, d, 1000); S.tone('triangle', f * 1.25, f * 1.25, l * .95, vol * .6, d + .03, 900); S.tone('sine', f / 2, f / 2, l * .95, vol * .4, d, 700); d += l; } }
  function hum(S) { S.tone('sine', 220, 233, .85, .05, 0, 600); S.tone('sine', 330, 330, .6, .025, .25, 700); }
  /* 咯咯的笑声：一串很快的高音 */
  function laughter(S, n = 14, vol = .05) { for (let i = 0; i < n; i++) { const f0 = 880 + (i % 3) * 150 + Math.random() * 90; S.tone('square', f0, f0 * 1.25, .07, vol, i * .1, 2600); } }
  function rooster(S) { S.tone('sawtooth', 480, 820, .22, .07, 0, 1600); S.tone('sawtooth', 820, 900, .5, .07, .22, 1800); S.tone('sawtooth', 900, 560, .45, .06, .72, 1400); }

  /* ---------------- 河滩：歌声把人往水里拉 ---------------- */
  const POSTS = ['post1', 'post2', 'post3', 'post4', 'post5', 'post6'];
  const PULL = .42;   // 歌声里每 0.42 秒被往水边拽一格
  function nearPost(S) {
    const p = W.pl;
    return POSTS.some(id => { const e = S.ent(id); return e && !e.hidden && Math.abs(e.x - p.x) <= 1 && Math.abs(e.y - p.y) <= 1; });
  }
  function songStart(S) {
    const f = S.f; f._ss = 'song'; f._st = SONG_LEN; f._pull = .3;
    S.speed(.55); S.plr(2.3); S.shake(200, 1);
    songPhrase(S, .05 + .06 * Math.min(1, W.pl.x / 35));   // 离老白桦越近，歌声越响
    S.place('hands', W.pl.x, 10, 3); S.ent('hands').alpha = .85;
    if ((f._songs = (f._songs || 0) + 1) <= 2) S.toast(f._songs === 1 ? '歌声——腿不听使唤了！往高处走（按住「上」），或站到木桩旁边' : '又唱起来了');
  }
  function songEnd(S) { S.speed(1); S.plr(null); const h = S.ent('hands'); if (h && !h.hidden) S.hide('hands'); }
  function meadowReset(S) {
    const f = S.f; songEnd(S); S.norun(true);
    f._ss = 'quiet'; f._st = 3.6; f._pull = PULL;
  }
  function pullStep(S) {
    const p = W.pl, m = curMap();
    if (nearPost(S)) { if (S.once('postSafe')) S.toast('抱住了木桩——歌声拽不动你'); return; }
    if (S.moving && p.dir === 3) return;   // 正在往高处走：顶得住
    if (!passable(m, p.x, p.y + 1, p)) return;
    S.pos(p.x, p.y + 1, p.dir); S.shake(120, 1); S.bubble('pl', '…', 450);
  }
  /* 歌声里，你脚下正对着的浅水里伸出几只苍白的手 */
  function handsFollow(S) { const h = S.ent('hands'); if (h && !h.hidden && h.x !== W.pl.x) S.place('hands', W.pl.x, 10, 3); }
  async function waterHit(S) {
    const f = S.f;
    if (f._ss !== 'song') {   // 安静的时候自己走进了浅水
      S.sfx('splash');
      S.pos(W.pl.x, 7, 3);
      return S.think('冰凉的河水漫过了脚脖子。\n……不能下水。人鱼周里，一步也不能下水。');
    }
    f.wet = (f.wet || 0) + 1;
    if (f.wet === 1) {
      songEnd(S); f._ss = 'quiet'; f._st = 3.4;
      await S.scare('flash', { sfx: 'splash' });
      S.pos(W.pl.x, 7, 3);
      await S.narr('冰凉的河水一下子漫到了膝盖——你猛地醒过来，连滚带爬地退回了岸上。\n歌声断了一下。');
      await S.think('再被拽下去一回，就上不来了。\n歌一起，就往高处走……或者抱住木桩。');
      return;
    }
    DIED.water++;
    songEnd(S); S.sfx('splash');
    await S.scare('face', { spr: '@rusalka', sfx: 'scream' });
    await S.die('河水没过了腰、胸口、下巴……\n水底下有好多只冰凉的手，轻轻地，挠着你的脚心。\n你最后听见的，是姑娘们的笑声。', '你走进了河里');
  }

  defChapter({
    id: 'rusalka', n: 19, title: '水仙女', sub: '人鱼周的夜里，白桦树上有个绿头发的姑娘在荡秋千。她会问你：手里拿的是苦艾，还是欧芹？', origin: '斯拉夫民间传说', color: '#1d3a32',
    icon: '@rusalka', iconX: 22, amb: 'night', floor: 'dirt', wall: 'wood', dark: .74, plr: 3.2, darkC: '#03070a',
    endings: { farewell: '送她过节', wormwood: '苦艾', parsley: '我的小亲亲' },
    people: {
      me: { key: 'r_me', skin: '#f0d2b4', hair: '#7a4a22', hs: 'long', top: '#ece6d8', top2: '#b0302c', bottom: '#8a2a24', dress: true, shoes: '#6a4a2a', extra: meExtra },
      babka: { skin: '#e0b896', hair: '#c8c8c8', hs: 'bun', hat: 'scarf', hatC: '#4a4a6a', top: '#5a4a3a', bottom: '#3a3028', skirt: true, apron: '#d8d0c0', shoes: '#2a1a10' },
      rusalka: { key: 'r_rus', skin: SKIN, hair: HAIR, hs: 'long', dress: true, top: '#d4dcd6', bottom: '#d4dcd6', shoes: SKIN, eye: '#030605', extra: rusExtra },
      alyona: { key: 'r_aly', skin: SKIN, hair: HAIR, hs: 'long', dress: true, top: '#f2eee2', top2: '#b02a2a', bottom: '#f2eee2', shoes: SKIN, eye: '#1a2a24', extra: alyExtra },
      stepan: { skin: '#e8c4a0', hair: '#6a4a2a', hs: 'messy', top: '#e0dacb', top2: '#8a2a2a', bottom: '#3a3a46', shoes: '#e8c4a0' },
      marfa: { skin: '#dcb492', hair: '#3a2a20', hs: 'bun', hat: 'scarf', hatC: '#1e1c22', top: '#2e2a30', bottom: '#26222a', skirt: true, shoes: '#1a1410' },
      galya: { key: 'r_galya', skin: '#f0cfb0', hair: '#c89a50', hs: 'long', top: '#ece6d8', top2: '#3a5aa0', bottom: '#3a5a8a', dress: true, shoes: '#5a3a22', extra: wreath(['#4a6ad8', '#ecece0', '#d8b030']) },
      oksana: { key: 'r_oksana', skin: '#ecc8a6', hair: '#2a1a12', hs: 'twin', top: '#ece6d8', top2: '#2a7a3a', bottom: '#7a2a5a', dress: true, shoes: '#5a3a22', extra: wreath(['#e8e0d0', '#d84a4a', '#4a8a3a']) }
    },
    /* 惊吓大头像：绿头发像水草一样披下来，花环，黑得没有眼白的眼睛，越咧越大的笑 */
    faces: {
      rusalka(R, a, t) {
        R(0, 0, 32, 32, '#04100c');
        R(4, 3, 24, 29, HAIR); R(2, 10, 3, 22, HAIR2); R(27, 9, 3, 23, HAIR2);
        for (let i = 0; i < 7; i++) R(5 + i * 3 + Math.sin(t * 2 + i) * .7, 6, 1, 26, i % 2 ? HAIR2 : '#4a8a62');
        R(9, 7, 14, 17, SKIN); R(10, 24, 12, 2, SKIN); R(12, 26, 8, 1, SKIN); R(20, 9, 3, 15, '#9ab4aa'); R(9, 17, 2, 6, '#a8c0b6');
        R(8, 5, 16, 4, HAIR); R(11, 9, 1, 12, HAIR2); R(20, 9, 1, 13, HAIR2); R(15, 9, 1, 4, HAIR2);
        const fl = ['#4a6ad8', '#ecece0', '#c8b050', '#4a6ad8', '#ecece0'];
        for (let i = 0; i < 9; i++) { R(5 + i * 2.6, 2 + (i === 0 || i === 8 ? 2 : i === 1 || i === 7 ? 1 : 0), 3, 3, fl[i % 5]); R(6 + i * 2.6, 3 + (i === 0 || i === 8 ? 2 : i === 1 || i === 7 ? 1 : 0), 1, 1, '#f0d040'); }
        R(12, 13, 3, 4, '#020403'); R(18, 13, 3, 4, '#020403'); R(13, 14, 1, 1, '#d8fff0'); R(19, 14, 1, 1, '#d8fff0');
        R(12, 17, 3, 1, '#8aa89a'); R(18, 17, 3, 1, '#8aa89a');
        const mh = 1 + Math.round(Math.min(1, a * 2.4) * 4);
        R(11, 21, 11, 1, '#1a0a0c'); R(10, 20, 1, 1, '#1a0a0c'); R(22, 20, 1, 1, '#1a0a0c');
        if (mh > 1) { R(12, 22, 9, mh - 1, '#14060a'); R(13, 22, 7, 1, '#e8e8dc'); }
        if (Math.sin(t * 8) > 0) R(10, 27, 1, 3, '#8ec4d0'); else R(21, 26, 1, 3, '#8ec4d0');
        R(14, 30, 1, 2, '#8ec4d0');
      }
    },
    thumb(g, w, h) {
      g.fillStyle = '#d8e4d8'; g.fillRect(w - 34, 10, 12, 12); g.fillStyle = 'rgba(216,228,216,.2)'; g.fillRect(w - 38, 6, 20, 20);
      g.fillStyle = '#1a3a48'; g.fillRect(0, h - 34, w, 12);
      for (let i = 0; i < 9; i++) { g.fillStyle = 'rgba(180,210,220,.3)'; g.fillRect((i * 37) % w, h - 30 + (i % 3) * 3, 8, 1); }
      g.fillStyle = '#e8e6dc'; g.fillRect(18, 4, 7, h - 30); g.fillStyle = '#1a1a18'; for (let i = 0; i < 8; i++) g.fillRect(18 + (i % 2) * 3, 10 + i * 8, 3, 1);
      g.fillStyle = '#c8c6bc'; g.fillRect(24, 26, w * .45, 2);
      for (let i = 0; i < 16; i++) { g.fillStyle = i % 2 ? '#2c4a28' : '#3a5a32'; g.fillRect(4 + i * 5, 2 + Math.abs(i - 6) * 2, 3, 22 + (i % 3) * 6); }
      for (let x = 0; x < w; x += 4) { g.fillStyle = (x / 4) % 2 ? '#5a5e36' : '#6e7244'; g.fillRect(x, h - 22 - 10 - ((x * 7) % 5), 2, 12); }
    },
    items: {
      polyn: { name: '苦艾', desc: '一把灰白的苦艾，叶背白得像霜。揉一揉，满手都是苦味。外婆说：人鱼周里出门，怀里不能没有它。' },
      sorochka: { name: '阿廖娜的衬衣', desc: '一件白麻布的婚礼衬衣。领口是玛尔法婶婶起的头，袖子上的红罂粟和黑白桦，是阿廖娜自己一针一针绣的。' },
      venok: { name: '花环', desc: '加莉娅替阿廖娜编的花环：矢车菊、雏菊、黑麦穗，还有几片白桦叶。' },
      cap: { name: '斯捷潘的帽子', desc: '一顶旧呢帽，帽檐湿了。斯捷潘赶集、割草、上教堂，从来不摘。' }
    },
    notes: {
      herbs: { title: '我的练习本（去年夏天，外婆教我认草）', text: '苦艾：叶子灰白，碎碎的，像一根根小羽毛；翻过来，背面白得像下了霜。花是一串低着头的小黄珠子。尝一尝——苦，苦到心里去。\n人鱼周出门，怀里要揣一把苦艾。\n\n外婆说，有两样草最容易跟它认错：\n艾菊——也苦，可那是樟脑的冲味儿。叶子深绿，像蕨菜；开扣子一样平平的黄花。名字里有个「艾」字，别上当。\n毛蕊花——叶子也是灰白的，毛茸茸，可是又大又厚，像兔子耳朵。不苦，闻着有一点蜜味。熬水治咳嗽。\n\n别的：欧芹叶子亮绿，菜汤味儿（人鱼周里千万别揣着它）。欧当归是发亮的大叶子，像芹菜，姑娘们拿它洗头。百里香开紫色碎花，三一节撒在屋里地上。薄荷凉凉的，茎是方的。' },
      rules: { title: '外婆说的人鱼周规矩', text: '三一节过后的这一个礼拜，叫「人鱼周」。河里淹死的姑娘们上岸来，坐在白桦树上荡秋千，梳她们绿色的长头发，在开花的黑麦田里跑。\n\n· 这一礼拜不下河洗澡；礼拜四不干活；夜里不进黑麦田。\n· 出门怀里揣一把苦艾。她问「苦艾还是欧芹」，就说苦艾。说欧芹，她就把你挠痒，挠到你笑断了气。\n· 她在水边唱歌，人的脚就会自己往水里走。别站着听：往高处走，或者抱住插着苦艾的木桩。\n· 她们冷，没有衣裳穿。往白桦树上挂一件衬衣、一条绣巾，她们就不去扯活人的。\n· 礼拜天，把她们送走——送到黑麦田那头，送回水里去，明年再来。' },
      letter: { title: '阿廖娜写给斯捷潘的信', text: '斯捷潘：\n\n你别笑我的字。是娜佳在教堂学堂里学了，又一个一个教给我的。\n\n那件衬衣，我绣好了。领口是妈妈起的头，袖子上的花是我自己绣的——红的是罂粟，黑的是你家门口那棵白桦。妈妈说，出嫁那天穿着自己绣的衬衣，一辈子都暖和。我想穿着它，让妈妈第一个看见。\n\n三一节那天，我们去河边扔花环吧。我的花环要是漂得远，秋天我们就成亲。\n要是沉了……沉了也不怕，我就下水去把它捞回来。\n\n　　　　　　　　　　　　——阿廖娜' },
      song: { title: '送水仙女的歌（加莉娅教的）', text: '送走了，送走了水仙女，\n送到黑麦田那一头。\n别再到我们院子里来，\n别再扯我们的衣裳。\n你回到河里去，回到水里去，\n明年人鱼周，我们再给你编花环。\n\n——傍晚，姑娘们抬着草扎的水仙女，一边唱一边走进黑麦田，把它扔下，然后一齐往村子里跑。谁也不许回头。' }
    },
    legend: '「水仙女」在东斯拉夫（俄罗斯、乌克兰、白俄罗斯）的民间叫 rusalka。和西欧长着鱼尾巴的美人鱼不同，乡下故事里的她们多半是有腿的年轻姑娘：披着长长的、湿漉漉的头发（有些地方说是绿色的，像水草），穿白衬衣或者什么也不穿，头戴花环。人们说她们是没出嫁就死去的姑娘，尤其是淹死的；也有人说是没受洗就夭折的孩子。她们平时住在河里、湖里，到了初夏就上岸来，坐在白桦和柳树的枝上荡秋千、梳头，在开花的黑麦田里奔跑；遇见的人，或者被她们挠痒挠到死，或者被歌声和笑声引进水里。\n\n她们出没的时节叫「人鱼周」（русальная неделя），在许多地方就是圣三一主日（复活节后第五十天）前后的那一周，和古老的「绿色节期」叠在一起：屋里插白桦枝、地上撒青草，姑娘们编花环扔进河里占卜婚事。这一周有许多禁忌：不下河洗澡，某些日子不干活——乌克兰一些地方把这周的礼拜四叫作「水仙女的复活节」。人们往树上挂衬衣、绣巾和线，送给「没有衣裳穿」的她们；到了周末再「送水仙女」：把草扎的人偶或扮成水仙女的姑娘送进黑麦田、丢进河里，唱着歌跑回家。据说这样的仪式在白俄罗斯和乌克兰的一些村子里一直流传到今天。\n\n最有名的护身法是苦艾。民间记录里常有这样的问答：水仙女问「你手里是什么——苦艾，还是欧芹？」答苦艾，她就骂一声「那你躲开！」跑掉；答欧芹，她就叫一声「我的心肝！」把人挠死——俄语里这两句是押韵的（полынь—сгинь，петрушка—душка）。有一种说法认为，rusalka 这个名字来自古罗马的玫瑰节（Rosalia），经由拜占庭传到斯拉夫人那里，变成了初夏纪念亡人的节日。十九世纪以后，诗人和作曲家把她写成了浪漫的悲剧人物；中文常译作《水仙女》的那部捷克歌剧（1901 年），讲的则是一个想变成人的水中精灵。\n\n（本章的村子，娜佳、阿廖娜、斯捷潘、玛尔法和外婆等人物，阿廖娜的信，梁上的八把草，河滩上插苦艾的木桩、歌声把人拽向水边的规则，以及挂上衬衣「送她过节」的结局，均为游戏虚构。）',
    start: { map: 'izba', x: 13, y: 5, dir: 3 },
    async intro(S) {
      await S.card(nb('第十九夜　水仙女'), nb('二十世纪初　波列西耶　河边的村子'), '三一节过后的这一个礼拜，叫「人鱼周」。\n黑麦开花了。\n\n河里、林子里、黑麦田里的姑娘们，\n都上岸来了。');
    },
    resume: {
      village: async S => { S.norun(false); S.speed(1); S.plr(null); },
      rye: async S => { S.norun(false); S.speed(1); S.plr(null); S.hide('rustle'); S.f._rt = 2.5; if (DIED.parsley && !S.f.met) await S.think('（她问的时候，照外婆的规矩答。）'); },
      meadow: async S => {
        meadowReset(S);
        if (DIED.water) await S.think('（歌声一起就按住「上」往高处走，或者站到插着苦艾的木桩旁边；安静下来再往右赶路。别站着听。）');
      },
      birch: async S => { S.norun(false); S.speed(1); S.plr(null); S.focus(null); }
    },
    tiles: {
      rye: { solid: true, paint(R, X, Y) {
        speck(R, '#20240f', ['#2a2e16', '#181a0b'], X, Y, 10, 41);
        for (let i = 0; i < 6; i++) {
          const x = 1 + i * 2.5 + ((hash(X, Y, 80 + i) * 2) | 0), c = i % 2 ? '#6e7244' : '#585c34';
          R(x, 3, 1, 13, c); const ey = (hash(X, Y, 90 + i) * 3) | 0;
          R(x - 1 + (i % 2), ey, 2, 4, i % 2 ? '#8e8a52' : '#78784a'); R(x, ey - 1, 1, 1, '#a8a066');
        }
        if (hash(X, Y, 99) < .1) { R(6, 8, 2, 2, '#4a6ad0'); R(6, 8, 1, 1, '#8aa0f0'); }
      } },
      izbapol: { solid: false, paint(R, X, Y) {
        TILE.wood.paint(R, X, Y, { woodC: '#6e5236' });
        for (let i = 0; i < 4; i++) { const h = hash(X, Y, 120 + i); R((h * 13) | 0, (hash(Y, X, 130 + i) * 14) | 0, 3, 1, i % 2 ? '#5a7a3a' : '#4a6a30'); }
        if (hash(X, Y, 140) < .3) R(((hash(X, Y, 141) * 12) | 0) + 2, ((hash(X, Y, 142) * 12) | 0) + 2, 1, 1, '#9a70b0');
      } }
    },
    sprites: {
      /* 俄式大炉子：刷白的砖，炉口里还有一点火 */
      pech(g, e, t, R) {
        box(R, 0, -12, 32, 44, '#d8d2c4'); R(1, -11, 30, 3, '#e8e2d4'); R(0, -12, 32, 1, '#a8a294');
        R(5, 14, 14, 12, '#3a2a1e'); R(6, 15, 12, 10, '#120a08');
        const f = Math.sin(t * 9) > 0 ? 1 : 0; R(8, 20 + f, 8, 5 - f, '#b8481a'); R(10, 21, 4, 4, '#f0a030');
        R(2, 27, 28, 3, '#b8b2a4'); R(23, -2, 6, 6, '#bab4a6'); R(24, -1, 4, 4, '#2a2420');
      },
      /* 红角：圣像、红灯盏、搭在上面的绣巾、插着的白桦枝 */
      icons(g, e, t, R) {
        R(1, 11, 14, 2, '#4a3420'); box(R, 4, 1, 8, 10, '#b89a40'); R(5, 2, 6, 8, '#3a2a20'); R(7, 3, 2, 2, '#d8b090'); R(6, 5, 4, 4, '#6a2a2a');
        R(0, 0, 3, 10, '#ece6d8'); R(13, 0, 3, 10, '#ece6d8'); R(0, 8, 3, 2, '#b0302c'); R(13, 8, 3, 2, '#b0302c');
        R(1, -4, 1, 6, '#4a6a30'); R(14, -4, 1, 6, '#4a6a30'); R(0, -3, 2, 1, '#6a9a4a'); R(14, -2, 2, 1, '#6a9a4a');
        const f = Math.sin(t * 7) > 0 ? 1 : 0; R(7, 13, 2, 2, '#a02020'); R(7, 12 - f, 2, 1 + f, '#ffb060');
      },
      /* 窗框上插着白桦枝的窗户 */
      iwin(g, e, t, R) {
        SPR.window(g, e, t, R);
        R(1, -1, 1, 12, '#3a5a2a'); R(14, -1, 1, 12, '#3a5a2a');
        for (let i = 0; i < 5; i++) { R(0, i * 2.5, 2, 1, '#5a8a3a'); R(14, 1 + i * 2.5, 2, 1, '#5a8a3a'); }
      },
      /* 梁上的草把：钉子、麻绳、草，底下的小木牌上刻着几道（几号钉子） */
      herb(g, e, t, R) {
        const k = e.k || HERBS[e.num];
        R(7, 0, 2, 2, '#2a2a2a'); R(7, 2, 2, 2, '#a08a5a');
        const sw = Math.sin(t * 1.2 + e.num) > .7 ? 1 : 0;
        const leaf = { thyme: ['#5a5040', '#6a6050'], tansy: ['#2e4a2a', '#3a5a32'], worm: ['#a8b4a8', '#c8d0c8'], worm2: ['#b8c0bc', '#d4dcd6'], parsley: ['#3a8a3a', '#58a848'], mullein: ['#98a092', '#b0b6aa'], lovage: ['#24502a', '#3e7444'], mint: ['#4a7a50', '#6a9a6a'] }[k];
        R(6, 4, 4, 2, '#8a7a50');
        if (k === 'mullein' || k === 'lovage') { R(3 + sw, 5, 10, 6, leaf[0]); R(4 + sw, 6, 4, 4, leaf[1]); R(9 + sw, 7, 3, 4, leaf[1]); }
        else { for (let i = 0; i < 5; i++) R(4 + i * 2 + sw, 5, 1, 6 + (i % 2), leaf[i % 2]); R(5 + sw, 7, 6, 3, leaf[0]); }
        if (k === 'thyme') { R(5 + sw, 10, 1, 1, '#9a70b0'); R(8 + sw, 11, 1, 1, '#a080c0'); R(10 + sw, 10, 1, 1, '#9a70b0'); }
        if (k === 'tansy') { R(4 + sw, 10, 3, 2, '#d8b020'); R(9 + sw, 10, 3, 2, '#e0c030'); }
        if (k === 'worm' || k === 'worm2') { R(5 + sw, 10, 1, 2, '#c8b860'); R(8 + sw, 11, 1, 1, '#c8b860'); R(10 + sw, 10, 1, 2, '#b8a850'); }
        R(2, 12, 12, 4, '#b89a68'); R(2, 12, 12, 1, '#d0b480');
        for (let i = 0; i < e.num; i++) R(3 + (i % 4) * 3, 13 + (i >= 4 ? 2 : 0), 2, 1, '#2a1a10');
      },
      kosa(g, e, t, R) { R(3, -14, 2, 28, '#8a6a40'); R(4, -14, 9, 2, '#9aa0a8'); R(10, -12, 3, 1, '#7a8088'); R(2, 0, 4, 1, '#6a4a2a'); },
      prjalka(g, e, t, R) { R(6, -14, 3, 24, '#8a6a40'); R(4, -14, 7, 6, '#e8e2d0'); R(5, -13, 5, 4, '#d8d0bc'); box(R, 1, 10, 14, 5, '#7a5a38'); },
      sunduk(g, e, t, R) { box(R, 0, 3, 16, 12, '#7a4a2a'); R(0, 3, 16, 2, '#9a6a3a'); R(0, 8, 16, 1, '#3a2a1a'); R(7, 7, 2, 3, '#c8a040'); for (const x of [2, 12]) R(x, 3, 2, 12, '#5a3a1a'); },
      polynD(g, e, t, R) { R(7, -6, 2, 2, '#a08a5a'); for (let i = 0; i < 4; i++) R(5 + i * 2, -4, 1, 7, i % 2 ? '#c8d0c8' : '#a8b4a8'); R(6, 2, 1, 1, '#c8b860'); },
      /* 村子当中的大白桦：挂满了衬衣、绣巾、彩带；sw = 树梢上有人在荡 */
      birch(g, e, t, R) {
        R(-8, 13, 32, 3, 'rgba(0,0,0,.3)');
        R(5, -58, 6, 74, '#e8e6dc'); R(9, -58, 2, 74, '#b8b6ac'); R(4, 8, 8, 8, '#e0ded4');
        for (let i = 0; i < 11; i++) R(5 + (i % 2) * 2, -54 + i * 6.5, 3 + (i % 3 === 0 ? 1 : 0), 1, '#1a1a18');
        R(-10, -44, 16, 1, '#c8c6bc'); R(10, -40, 16, 1, '#c8c6bc'); R(-6, -30, 12, 1, '#c8c6bc'); R(10, -24, 12, 1, '#c8c6bc');
        for (let i = 0; i < 22; i++) { const x = -18 + i * 2.3, s = Math.sin(t * 1.5 + i) * 1, top = -70 + Math.abs(i - 11) * 2.2; R(x + s, top, 2, 22 + (i % 4) * 6, ['#3a5a32', '#2c4a28', '#4a6a3a', '#24401f'][i % 4]); }
        const cs = ['#c0302c', '#ece6d8', '#3a5aa0', '#d8b030', '#ece6d8', '#2a7a3a'];
        [[-9, -43], [-4, -43], [14, -39], [19, -39], [-3, -29], [12, -23]].forEach(([x, y], i) => { const s = Math.sin(t * 2 + i) * .8; R(x + s, y, 2, 8 + (i % 3) * 3, cs[i]); });
        R(17, -23, 6, 12, '#ece6d8'); R(17, -14, 6, 2, '#b0302c'); R(17, -20, 6, 1, '#b0302c');
        R(-12, -43, 7, 9, '#e0dacb'); R(-13, -43, 9, 2, '#e0dacb');
        if (e.v) { R(-7, -33, 6, 1, '#4a6ad8'); R(-8, -32, 1, 3, '#ecece0'); R(-1, -32, 1, 3, '#d8b030'); R(-7, -29, 6, 1, '#4a6ad8'); }
        if (e.sw && W && W.ch.people) { const s = Math.sin(t * 2.6) * 4; g.drawImage(personSprite(W.ch.people.rusalka, 0, 0), e.sx + 14 + s, e.sy - 76); }
      },
      /* 斯捷潘家门口的长凳，凳上一个打开的小木匣 */
      casket(g, e, t, R) { SPR.bench(g, e, t, R); box(R, 20, -2, 9, 6, '#6a4a2a'); R(21, -4, 7, 2, '#7a5a3a'); if (!e.read) R(22, -1, 5, 2, '#e8e0c8'); },
      /* 玛尔法家的窗：点着蜡烛，窗外搭着一条绣巾（给死人的） */
      rwin(g, e, t, R) { SPR.window(g, e, t, R); R(1, 9, 14, 2, '#ece6d8'); R(1, 11, 3, 5, '#ece6d8'); R(1, 14, 3, 1, '#b0302c'); R(12, 11, 3, 5, '#ece6d8'); R(12, 14, 3, 1, '#b0302c'); const f = Math.sin(t * 11) > 0 ? 1 : 0; R(5, 6 - f, 1, 2 + f, '#ffd070'); },
      straw(g, e, t, R) { for (let i = 0; i < 9; i++) R((hash(e.x, i, 3) * 13) | 0, (hash(i, e.y, 4) * 13) | 0, 3 + (i % 3), 1, i % 2 ? '#b8a060' : '#9a8448'); R(4, 6, 2, 2, '#4a6ad8'); R(10, 9, 1, 1, '#ecece0'); R(8, 3, 3, 1, '#4a6a30'); },
      ogorod(g, e, t, R) { const c = e.col || '#3a7a34'; for (let i = 0; i < 5; i++) { const x = 1 + i * 3; R(x, 6 + (i % 2), 2, 3, c); R(x + 1, 5 + (i % 2), 1, 1, shade(c, .25)); } },
      rustle(g, e, t, R) {
        for (let i = 0; i < 5; i++) { const s = Math.sin(t * 14 + i * 1.7) * 2; R(2 + i * 3 + s, -3, 1, 6, '#a8a066'); R(1 + i * 3 + s, -5, 2, 3, '#c0b878'); }
        if (Math.sin(t * 5) > .3) { R(6, 4, 4, 8, HAIR); R(7, 6, 1, 1, '#030605'); }
      },
      hands(g, e, t, R) {
        for (const [x, ph] of [[2, 0], [7, 1.7], [11, 3.1]]) { const up = 3 + Math.sin(t * 3 + ph) * 2; R(x, 10 - up, 2, up + 3, '#b8ccc4'); R(x - 1, 9 - up, 1, 2, '#c8dcd4'); R(x + 2, 9 - up, 1, 2, '#c8dcd4'); R(x, 8 - up, 2, 1, '#c8dcd4'); }
        R(0, 12, 16, 1, 'rgba(200,230,230,.35)');
      },
      cap(g, e, t, R) { R(4, 9, 8, 3, '#3a3a3a'); R(3, 11, 10, 2, '#2a2a2a'); R(5, 8, 6, 1, '#4a4a4a'); },
      mezha(g, e, t, R) { R(2, 4, 2, 9, '#6a4a2a'); R(2, 4, 2, 1, '#8a6a40'); R(1, 2, 4, 3, '#a8b4a8'); R(2, 1, 1, 2, '#c8d0c8'); R(1, 12, 4, 1, '#2a1e12'); },
      vasil(g, e, t, R) { for (const [x, y] of [[3, 4], [9, 7], [6, 11], [12, 3]]) { R(x, y + 2, 1, 3, '#3a5a2a'); R(x - 1, y, 3, 2, '#4a6ad8'); R(x, y, 1, 1, '#8aa0f0'); } },
      /* 河滩上的木桩：桩头上捆着一把苦艾 */
      post(g, e, t, R) { R(6, -10, 4, 25, '#6a4a2a'); R(6, -10, 4, 1, '#8a6a40'); R(5, 13, 6, 2, '#3a2a18'); R(4, -8, 8, 2, '#a08a5a'); for (let i = 0; i < 4; i++) R(4 + i * 2, -12 + (i % 2), 1, 8, i % 2 ? '#c8d0c8' : '#a8b4a8'); },
      /* 河边的老白桦：一根长枝伸到水面上；who='rus' 时她坐在枝上荡；shirt = 衬衣挂上了 */
      oldbirch(g, e, t, R) {
        R(-6, 13, 26, 3, 'rgba(0,0,0,.3)');
        R(5, -50, 5, 66, '#e8e6dc'); R(9, -50, 1, 66, '#b8b6ac');
        for (let i = 0; i < 9; i++) R(5 + (i % 2) * 2, -46 + i * 7, 3, 1, '#1a1a18');
        const bob = e.who === 'rus' ? Math.sin(t * 2.2) * 2 : 0;
        R(9, -30, 14, 2, '#d8d6cc'); R(22, -29 + bob * .5, 14, 2, '#c8c6bc'); R(35, -28 + bob, 8, 1, '#b8b6ac');
        R(-14, -18, 20, 1, '#c8c6bc');
        for (let i = 0; i < 16; i++) { const x = -16 + i * 4, s = Math.sin(t * 1.3 + i) * 1.2, top = -60 + Math.abs(i - 6) * 2.5; R(x + s, top, 2, 22 + (i % 3) * 7, i % 2 ? '#3a5a32' : '#2c4a28'); }
        if (e.shirt) { const s = Math.sin(t * 1.6) * .8; R(-12 + s, -17, 10, 3, '#f2eee2'); R(-11 + s, -14, 8, 9, '#f2eee2'); R(-15 + s, -16, 3, 6, '#f2eee2'); R(-2 + s, -16, 3, 6, '#f2eee2'); R(-15 + s, -11, 3, 1, '#b02a2a'); R(-2 + s, -11, 3, 1, '#b02a2a'); R(-9 + s, -17, 4, 1, '#b02a2a'); R(-11 + s, -6, 8, 1, '#b02a2a'); }
        if (e.who === 'rus' && W && W.ch.people) { const s = Math.sin(t * 2.2) * 3; g.drawImage(personSprite(W.ch.people.rusalka, 0, 0), e.sx + 24 + s, e.sy - 42 + bob); }
      }
    },
    maps: {
      /* ---------------- 外婆的屋子 ---------------- */
      izba: {
        amb: 'room', dark: .6, plr: 3, wall: 'wood', floor: 'lightwood',
        legend: { g: 'izbapol' },
        rows: [
          '######################',
          '######################',
          '#........#ggggggggggg#',
          '#........#ggggggggggg#',
          '#.........ggggggggggg#',
          '#........#ggggggggggg#',
          '#........#ggggggggggg#',
          '####.#################'],
        ents: [
          ...[1, 2, 3, 4, 5, 6, 7, 8].map(n => ({ id: 'b' + n, x: n, y: 1, spr: 'herb', num: n, k: HERBS[n], solid: true, on: S => herbLook(S, n) })),
          { id: 'kadka', x: 1, y: 6, spr: 'barrel', on: S => S.narr('一木桶井水，上面漂着两片白桦叶。\n人鱼周里，外婆不许从河里挑水。') },
          { id: 'kosa', x: 8, y: 6, spr: 'kosa', on: S => S.narr('靠墙立着一把镰刀，刀口用布包着。\n礼拜四不许动它——那天是「水仙女的复活节」，干了活，她们会来找你算账。') },
          { id: 'polynD', x: 5, y: 7, spr: 'polynD', hidden: true, solid: false, z: 1 },
          { id: 'exitI', x: 4, y: 7, spr: 'invisible', async touch(S) {
            if (S.f.phase === 'herb') { await S.narr('外婆说过：人鱼周里，不揣苦艾不出门。'); return S.walk('pl', 'u', 5); }
            S.sfx('open'); await S.go('selo', 7, 3, 0);
          } },
          { id: 'icons', x: 10, y: 1, spr: 'icons', light: { r: 2.2, col: 'rgba(255,120,80,.18)', flick: true }, on: S => S.narr('红角里供着圣像，前面的小红灯盏一夜不灭。\n圣像上搭着一条绣巾，两边插着白桦枝——三一节的规矩，屋里要插满绿枝。') },
          { id: 'winL', x: 13, y: 1, spr: 'iwin', on: S => S.narr('窗框上插着白桦枝。窗外，月亮把黑麦田照得发白。') },
          { id: 'winR', x: 16, y: 1, spr: 'iwin', on: S => S.narr(S.f.phase === 'herb' ? '奥克萨娜刚才就是在这儿敲的窗。\n玻璃上留着两个湿湿的指印——手指头很长。' : '窗玻璃上的指印已经干了。') },
          { id: 'tbl', x: 11, y: 3, w: 2, spr: 'table', col: '#7a5a3a', async on(S) {
            if (S.once('tbl')) await S.narr('桌上摆着一块黑麦面包、一碗没动过的格瓦斯，还有你的练习本。');
            await S.note('herbs'); S.f.readHerbs = true;
            if (S.f.phase === 'herb' && S.once('herbsHint')) await S.think('梁上的草，一把一把去看——叶子什么颜色、什么味道，都得对上。');
          } },
          { id: 'pech', x: 18, y: 2, w: 2, h: 2, spr: 'pech', light: { r: 2.6, col: 'rgba(255,140,60,.2)', flick: true, dy: 20 }, on: S => S.narr('刷得雪白的大炉子，占了半间屋。\n炉炕上铺着羊皮袄——外婆烧了一整天，就躺在那上面。') },
          { id: 'babka', x: 17, y: 3, spr: '@babka', dir: 0, on: S => grandma(S) },
          { id: 'prjalka', x: 20, y: 5, spr: 'prjalka', on: S => S.narr('外婆的纺车。线轴上还缠着半截白麻线。\n人鱼周里，有人把线挂在白桦树上——给她们纺线、织衣裳。') },
          { id: 'sunduk', x: 20, y: 6, spr: 'sunduk', on: S => S.narr('你的嫁妆箱子。里面是外婆一条一条给你攒的绣巾。\n去年，阿廖娜的箱子也是这么满的。') }
        ],
        async enter(S, first) {
          if (first) return opening(S);
          if (S.f.phase !== 'herb' && S.once('izbaBack')) await S.narr('屋里一股苦艾味儿。门框上那一把，在风里轻轻地晃。');
        }
      },
      /* ---------------- 村子 ---------------- */
      selo: {
        amb: 'night', dark: .72, plr: 3.2, wall: 'wood', floor: 'dirt',
        tileOpts: { grassC: '#22341f', treeC: '#14241a' },
        rows: [
          'TTTT#######TTTTT#######TTTT#######TT',
          'TTTT#######TTTTT#######TTTT#######TT',
          'TT""#######"""""#######""""#######"T',
          'T"dddddddddddddddddddddddddddddddd"T',
          'T""""""""""""""""""""""""""""""""""T',
          'Tffffff"ffff"""""""""""""""""""""""T',
          'Tdddddd"ddddf""""""""""""""""""""""T',
          'T"""""""""""f""""""""""""""""""""""T',
          'Tdddddd"ddddf""""""""""""""""""""""T',
          'T"""""""""""f""""""""""""""""""""""T',
          'Tdddddd"ddddf""""""""""""""""""""""T',
          'Tffffffffffff""""""""""""""""""""""T',
          'T"""""""""""""""ddd""""""""""""""""T',
          'TTTB""""""""""""ddd""""""""""""BTTTT',
          'TTTTTB""""""""""ddd""""""""""BTTTTTT',
          'TTTTTTTTTTTTTT""ddd""TTTTTTTTTTTTTTT',
          'TTTTTTTTTTTTTTT"ddd"TTTTTTTTTTTTTTTT',
          'TTTTTTTTTTTTTTTTdddTTTTTTTTTTTTTTTTT',
          'TTTTTTTTTTTTTTTTdddTTTTTTTTTTTTTTTTT',
          'TTTTTTTTTTTTTTTTdddTTTTTTTTTTTTTTTTT',
          'TTTTTTTTTTTTTTTTTdTTTTTTTTTTTTTTTTTT'],
        ents: [
          { id: 'moonS', x: 18, y: 6, spr: 'invisible', solid: false, light: { r: 7, col: 'rgba(160,190,220,.05)' } },
          { id: 'doorA', x: 7, y: 2, spr: 'door', col: '#5a3a22', async on(S) { S.sfx('open'); await S.go('izba', 4, 6, 3); } },
          { id: 'winA1', x: 5, y: 2, spr: 'iwin', lit: true, light: { r: 2, col: 'rgba(255,170,90,.14)' }, on: S => S.narr('外婆家的窗。红灯盏的光从里面透出来。') },
          { id: 'winA2', x: 9, y: 2, spr: 'iwin', lit: true, light: { r: 2, col: 'rgba(255,170,90,.14)' }, on: S => S.narr('窗框上的白桦枝已经有点蔫了。三一节过去一个礼拜了。') },
          { id: 'doorB', x: 19, y: 2, spr: 'door', col: '#4a3020', open: true, on: S => S.narr('斯捷潘家的门大开着，屋里黑洞洞的。\n他爹赶集去了，要明天才回来。炕上的被子掀在一边，鞋还在门口。') },
          { id: 'winB1', x: 17, y: 2, spr: 'iwin', on: S => S.narr('黑着的窗。玻璃里映出那棵大白桦，和树梢上……什么也没有。') },
          { id: 'winB2', x: 21, y: 2, spr: 'window', on: S => S.narr('窗台上放着一个小木雕的马。斯捷潘手巧，冬天里刻了一屋子。') },
          { id: 'casket', x: 20, y: 3, w: 2, spr: 'casket', on: S => casket(S) },
          { id: 'doorC', x: 30, y: 2, spr: 'door', col: '#3a2a1a', on: S => S.narr('玛尔法婶婶家的门。门框上没有插白桦枝。') },
          { id: 'winC', x: 28, y: 2, spr: 'rwin', lit: true, light: { r: 2.2, col: 'rgba(255,190,110,.16)', flick: true }, on: S => S.narr('窗台上点着一支蜡烛，窗外搭着一条绣巾——给死人擦脸用的。\n人鱼周里，家家都这么挂。只有这一家，挂的是窗户里头。') },
          { id: 'winC2', x: 32, y: 2, spr: 'window', on: S => S.narr('窗帘拉得严严的。') },
          { id: 'marfa', x: 31, y: 3, spr: '@marfa', dir: 0, on: S => marfa(S) },
          { id: 'birchV', x: 18, y: 8, spr: 'birch', s: { v: 1 }, on: S => birchV(S) },
          { id: 'galya', x: 16, y: 9, spr: '@galya', dir: 2, on: S => galya(S) },
          { id: 'oksana', x: 20, y: 9, spr: '@oksana', dir: 1, on: S => oksana(S) },
          { id: 'well', x: 27, y: 7, spr: 'well', async on(S) {
            if (S.once('well')) { S.sfx('drip'); S.bubble('pl', '!', 900); return S.narr('井水黑得像一面镜子。你探头看了一眼——\n镜子里，你的肩膀后面，好像还有一张脸。头发绿绿的，湿湿的。'); }
            await S.narr('井里只有你自己，和一个月亮。');
          } },
          { id: 'bench2', x: 24, y: 10, w: 2, spr: 'bench', on: S => S.narr('长凳上落了一个没编完的花环。黑麦穗已经蔫了。') },
          { id: 'straw', x: 17, y: 12, spr: 'straw', decal: true, solid: false, on: S => S.narr('路上散着一地稻草和碎花——是傍晚姑娘们扎的那个草人身上掉下来的。\n它的「头发」是用黑麦秸和白桦枝编的。') },
          { id: 'bed1', x: 2, y: 6, spr: 'ogorod', decal: true, solid: false, col: '#3a8a3a', on: S => S.narr('外婆的欧芹畦。叶子亮绿亮绿的，长得正好。\n人鱼周里，外婆一根也不许摘。') },
          { id: 'bed2', x: 9, y: 8, spr: 'ogorod', decal: true, solid: false, col: '#4a6a3a', on: S => S.narr('一畦土豆苗。') },
          { id: 'bed3', x: 4, y: 10, spr: 'ogorod', decal: true, solid: false, col: '#5a7a3a', on: S => S.narr('一畦洋葱，刚冒出绿尖。') },
          { id: 'cross', x: 20, y: 15, spr: 'cross', on: S => S.narr('村口的木十字架。十字架上系着一把苦艾，已经晒干了。\n往南，就是黑麦田。') },
          { id: 'exitS', x: 17, y: 20, spr: 'invisible', async touch(S) {
            if (!S.has('sorochka') && S.once('noShirt')) await S.think('外婆说，最好给阿廖娜带一件衣裳……\n玛尔法婶婶就在她家门口站着。');
            await S.go('rozh', 10, 1, 0);
          } }
        ],
        async enter(S, first) {
          const f = S.f;
          if (f.phase === 'rye' || f.phase === 'meadow') f.phase = 'out';
          S.norun(false); S.speed(1); S.plr(null);
          if (first) await glimpse(S);
          S.goal(villageGoal(S)); S.cp('village');
        }
      },
      /* ---------------- 黑麦田 ---------------- */
      rozh: {
        amb: 'wind', dark: .86, plr: 2.8, floor: 'dirt', fog: .1,
        legend: { Y: 'rye' },
        rows: [
          'YYYYYYYYYYdYYYYYYYYYYY',
          'YYYYYYYYYYdYYYYYYYYYYY',
          'YYYYYYYYYYddYYYYYYYYYY',
          'YYYYYYYYYYYdYYYYYYYYYY',
          'YYYYYYYYYYYddddYYYYYYY',
          'YYYYYYYYYYYYYYdYYYYYYY',
          'YYYYYYYYYYYYYYdYYYYYYY',
          'YYYYYYYYYYYYYddYYYYYYY',
          'YYYYYYYYYYYYYdYYYYYYYY',
          'YYYYYYYYYdddddYYYYYYYY',
          'YYYYYYYYYdYYYYYYYYYYYY',
          'YYYYYYYYYdYYYYYYYYYYYY',
          'YYYYYYYdddYYYYYYYYYYYY',
          'YYYYYYYdYYYYYYYYYYYYYY',
          'YYYYYYYddddYYYYYYYYYYY',
          'YYYYYYYYYYdYYYYYYYYYYY',
          'YYYYYYYYYYddddYYYYYYYY',
          'YYYYYYYYYYYYYdYYYYYYYY',
          'YYYYYYYYYYYYYdYYYYYYYY',
          'YYYYYYYYYYYYYdYYYYYYYY',
          'YYYYYYYYYYYYddYYYYYYYY',
          'YYYYYYYYYYYYdYYYYYYYYY',
          'YYYYYYYYYYYYdYYYYYYYYY',
          'YYYYYYYYYYYddYYYYYYYYY',
          'YYYYYYYYYYYdYYYYYYYYYY',
          'YYYYYYYYYYYdYYYYYYYYYY',
          'YYYYYYYYYYYdYYYYYYYYYY',
          'YYYYYYYYYYYdYYYYYYYYYY'],
        ents: [
          { id: 'exitR0', x: 10, y: 0, spr: 'invisible', touch: S => S.go('selo', 17, 19, 3) },
          { id: 'exitR1', x: 11, y: 27, spr: 'invisible', touch: S => S.go('bereg', 2, 2, 0) },
          { id: 'cap', x: 14, y: 6, spr: 'cap', solid: false, async on(S) {
            S.hide('cap'); S.give('cap');
            await S.narr('田埂上掉着一顶旧呢帽。是斯捷潘的——他连上教堂都不摘。\n帽檐是湿的。');
          } },
          { id: 'vasil', x: 8, y: 12, spr: 'vasil', decal: true, solid: false, on: S => S.narr('田埂边开着几朵矢车菊，蓝得发紫。\n加莉娅说过，矢车菊是一个小伙子变的：水仙女爱上了他，他不肯跟她下河，她就把他变成了黑麦田里的一朵花。') },
          { id: 'mezha', x: 11, y: 9, spr: 'mezha', decal: true, solid: false, on: S => S.narr('两块地的地界，插着一根短短的木橛子。\n木橛子上也系着一小把苦艾。') },
          { id: 'rustle', x: 9, y: 3, spr: 'rustle', hidden: true, solid: false, z: 1 },
          { id: 'rus_r', x: 13, y: 20, spr: '@rusalka', hidden: true, solid: false, dir: 3, light: GLOW }
        ],
        async enter(S, first) {
          const f = S.f; f.phase = 'rye'; S.norun(false); S.speed(1); S.plr(null); S.f._rt = 2.5;
          if (first) {
            await S.narr('黑麦已经齐胸高了，正开着花。风一吹，花粉像一层薄雾，从田里飘起来。\n田埂窄得只容得下一个人。');
            await S.think('外婆说，夜里不进黑麦田。\n……可是斯捷潘就是从这儿过去的。');
          }
          S.goal(GOAL_RYE); S.cp('rye');
        },
        tick(S, dt) {
          const f = S.f; if (f.phase !== 'rye' || S.busy) return;
          const p = W.pl;
          if (f._rh > 0) { f._rh -= dt; if (f._rh <= 0) S.hide('rustle'); }
          if (f.met) return;
          if (p.y >= 17) { S.run(meetRus); return; }   // 田埂拐进竖直那一段（x=13, y≥17）时她出现
          if (p.y >= 9 && S.once('callName')) { S.run(async S => { S.sfx('whisper'); await S.say('（黑麦田里）', '娜佳……娜——佳……', { style: 'whisper' }); await S.think('……谁？'); }); return; }
          f._rt = (f._rt ?? 2.5) - dt;
          if (f._rt <= 0) { f._rt = 2.4 + Math.random() * 2.2; rustle(S); }
        }
      },
      /* ---------------- 河滩 · 老白桦 ---------------- */
      bereg: {
        amb: 'river', dark: .8, plr: 3, floor: 'dirt',
        legend: { Y: 'rye' },
        tileOpts: { grassC: '#203a26', treeC: '#14241a' },
        rows: bergRows(),
        ents: [
          { id: 'exitB', x: 2, y: 1, spr: 'invisible', async touch(S) {
            if (S.f.phase === 'birch' || S.f.phase === 'end') { await S.narr('斯捷潘还在水里！'); return S.pos(2, 3, 0); }
            songEnd(S); await S.go('rozh', 11, 26, 3);
          } },
          { id: 'moonB', x: 22, y: 12, spr: 'invisible', solid: false, light: { r: 9, col: 'rgba(140,180,220,.07)' } },
          { id: 'post1', x: 7, y: 6, spr: 'post', light: { r: 1.4, col: 'rgba(210,220,210,.1)' }, on: S => S.narr('一根木桩，桩头上捆着一把苦艾。\n村里人年年往河滩上插——给夜里走河边的人抱着。') },
          { id: 'post2', x: 13, y: 8, spr: 'post', light: { r: 1.4, col: 'rgba(210,220,210,.1)' }, on: S => S.narr('苦艾木桩。桩子底下的泥里，有一串光脚的脚印，一直走进水里。') },
          { id: 'post3', x: 18, y: 4, spr: 'post', light: { r: 1.4, col: 'rgba(210,220,210,.1)' }, on: S => S.narr('苦艾木桩。苦味儿冲得你直流眼泪——脑子一下子清醒了。') },
          { id: 'post4', x: 24, y: 8, spr: 'post', light: { r: 1.4, col: 'rgba(210,220,210,.1)' }, on: S => S.narr('这根木桩插得离水太近了。桩子上缠着几根长长的绿头发。') },
          { id: 'post5', x: 29, y: 5, spr: 'post', light: { r: 1.4, col: 'rgba(210,220,210,.1)' }, on: S => S.narr('苦艾木桩。上面系着一条褪了色的红头绳。') },
          { id: 'post6', x: 33, y: 6, spr: 'post', light: { r: 1.4, col: 'rgba(210,220,210,.1)' }, on: S => S.narr('最后一根木桩。再往前，就是那棵老白桦了。') },
          { id: 'oldbirch', x: 39, y: 7, spr: 'oldbirch', s: { who: 'rus' }, light: { r: 3.6, col: 'rgba(170,220,200,.12)', dx: 24, dy: -20 }, on: S => birchFinal(S) },
          { id: 'stepan', x: 41, y: 10, spr: '@stepan', dir: 3, light: { r: 1.4, col: 'rgba(170,200,235,.12)' }, on: S => stepanTalk(S) },
          { id: 'aly', x: 42, y: 8, spr: '@rusalka', hidden: true, solid: false, dir: 1, light: GLOW },
          { id: 'hands', x: 3, y: 10, spr: 'hands', hidden: true, solid: false, light: { r: 1.2, col: 'rgba(170,220,210,.12)' } },
          { id: 'reedN', x: 12, y: 9, spr: 'invisible', solid: true, on: S => S.narr('芦苇里有什么东西在动。\n……是风。是风吧。') }
        ],
        async enter(S, first) {
          const f = S.f;
          if (f.phase === 'birch' || f.phase === 'end') return;
          f.phase = 'meadow'; meadowReset(S);
          if (first) {
            await S.narr('黑麦田到头了，眼前是一大片河滩。月亮落在河里，碎成一片一片的。\n河滩上隔一段就插着一根木桩，桩头上捆着一把苦艾。');
            await S.narr('河滩的那一头，有一棵老白桦斜斜地探到水面上。\n有人在唱歌。\n脚下的草湿漉漉的，一跑就滑——只能一步一步地走。');
            await S.think((f.oksana ? '奥克萨娜说过' : '外婆说过') + '：她一唱歌，就往高处走，或者抱住插着苦艾的木桩。\n千万别站着听。');
          }
          S.goal(GOAL_MEADOW); S.cp('meadow');
        },
        tick(S, dt) {
          const f = S.f;
          if (f.phase !== 'meadow' || S.busy) return;
          const p = W.pl;
          if (p.y >= 10) { S.run(waterHit); return; }
          if (p.x >= 35 && f._ss !== 'song') { S.run(birchScene); return; }
          f._st = (f._st ?? 3.6) - dt;
          if (f._ss === 'song') { handsFollow(S); f._pull = (f._pull ?? PULL) - dt; if (f._pull <= 0) { f._pull = PULL; pullStep(S); } }
          if (f._st > 0) return;
          if (f._ss === 'quiet') { f._ss = 'warn'; f._st = .9; hum(S); S.bubble('pl', '!', 800); S.shake(250, 1); if ((f._warns = (f._warns || 0) + 1) <= 2) S.toast('（远处的歌声近了……）'); }
          else if (f._ss === 'warn') songStart(S);
          else { f._ss = 'quiet'; f._st = 2.6 + Math.random() * .9; songEnd(S); }
        }
      }
    }
  });

  /* 河滩地图：上面是黑麦田（向下凸进河滩的几段让路变窄），下面是浅水和深水 */
  function bergRows() {
    const W2 = 46, yt = x => x === 0 || x === 45 ? 99 : x <= 6 ? 1 : x <= 8 ? 2 : x <= 14 ? 4 : x <= 20 ? 2 : x === 21 ? 3 : x <= 27 ? 5 : x <= 30 ? 2 : x <= 34 ? 4 : 1;
    const rows = [];
    for (let y = 0; y < 14; y++) {
      let r = '';
      for (let x = 0; x < W2; x++) {
        if (y >= 11) { r += '~'; continue; }
        if (x === 0) { r += 'Y'; continue; }
        if (x === 45) { r += y === 10 ? '~' : 'T'; continue; }
        if (y === 10) { r += (x === 12 || x === 13 || x === 30) ? 'e' : 'o'; continue; }
        if (y === 1 && x === 2) { r += '"'; continue; }
        if (y === 9 && (x === 12 || x === 30)) { r += 'e'; continue; }
        r += y > yt(x) ? '"' : 'Y';
      }
      rows.push(r);
    }
    return rows;
  }

  /* ================= 剧情 ================= */
  async function opening(S) {
    const f = S.f; f.phase = 'herb';
    await S.narr('屋里的地上撒满了青草和百里香，窗框上、圣像边上都插着白桦枝——三一节的规矩。\n炉炕上，外婆烧了一整天，刚刚睡着。');
    S.sfx('knock'); S.bubble('winR', '!', 900); S.shake(150, 1);
    await S.wait(500); S.sfx('knock');
    await S.say('奥克萨娜（窗外）', ['娜佳！娜佳，开窗——斯捷潘不见了！', '我起夜，看见他光着脚从我家门口走过去，嘴里哼着阿廖娜的那支歌……往河边去了！我叫他，他连头都不回。', '我去叫加莉娅，我们在大白桦底下等你！']);
    S.bubble('babka', '…', 1200);
    await S.say('外婆', ['……阿廖娜的歌？', '今天是人鱼周的最后一夜。傍晚姑娘们刚把草扎的水仙女送进了黑麦田——可是阿廖娜，到今天也没人给她挂一件衣裳。']);
    await S.think('阿廖娜。去年三一节，她的花环沉了。\n她下水去捞……就再也没有上来。');
    await S.say('外婆', [
      '听我说，孩子。人鱼周里出门，怀里一定要揣一把苦艾。她会问你：手里拿的是苦艾，还是欧芹？说苦艾，她就走了。',
      '前屋梁上挂着八把草，有两把是苦艾。我起不来了……你去认，认准了回来告诉我是几号钉子。',
      '去年夏天我教你认过——你都记在练习本上了。本子在桌上。'
    ]);
    await S.note('rules');
    S.goal(GOAL_HERB);
  }

  async function herbLook(S, n) {
    S.f.looked = (S.f.looked || 0) + 1;
    await S.narr(HERB_DESC[n]);
    if (S.f.phase === 'herb' && !S.f.readHerbs && S.once('herbNB')) await S.think('哪一把是苦艾来着……练习本上记着。');
  }

  async function grandma(S) {
    const f = S.f; S.face('babka', 'pl');
    if (f.phase !== 'herb') {
      return S.say('外婆', S.has('sorochka') ? ['衬衣拿到了？好孩子。', '挂到她坐的那棵白桦上。挂上了，她就不扯活人了。'] : ['揣好苦艾。她问你，就说苦艾。', '玛尔法那只箱子……要是能让她打开就好了。']);
    }
    if (!f.readHerbs) return S.say('外婆', ['……本子。桌上的本子，你自己记的。', '照着本子，去前屋梁底下一把一把看清楚。']);
    if (!f.looked) return S.say('外婆', '你去梁底下看过了没有？一把一把看，闻一闻，再来告诉我。');
    const v = await S.keypad('外婆：「哪两颗钉子上挂的是苦艾？」\n（钉子从左往右是 1～8 号，木牌上刻着几道就是几号；按两个号码）', ['1', '2', '3', '4', '5', '6', '7', '8'], 2);
    if (v == null) return;
    const a = +v[0], b = +v[1];
    if (a === b) return S.say('外婆', '同一颗钉子上，哪来的两把？');
    const ok = x => x === 3 || x === 7;
    if (ok(a) && ok(b)) return herbSolved(S);
    f.wrong = (f.wrong || 0) + 1;
    await S.narr(`你从 ${a} 号和 ${b} 号钉子上取下草，拿到炉炕边。\n外婆闭着眼睛，一把一把地闻。`);
    const lines = [];
    for (const x of [a, b]) lines.push(ok(x) ? `${x} 号那把——是苦艾，没错。` : HERB_WRONG[x]);
    await S.say('外婆', lines);
    S.plr(Math.max(1.8, 3 - f.wrong * .3));   // 每错一次，屋里的灯盏就暗一点（认对了才恢复）
    if (f.wrong === 2 || f.wrong >= 4) { S.sfx('knock'); S.bubble('winR', '!', 900); await S.narr('窗外又响了一下。红灯盏的火苗缩成了一个小点。'); }
    if (f.wrong === 1 || f.wrong === 3) {
      S.sfx('knock'); S.bubble('winR', '!', 900); await S.wait(300);
      laughter(S, 6, .035);
      await S.scare('flash', { sfx: 'giggle', dur: .5 });
      await S.narr('窗户外头，有人用指甲轻轻地敲了两下玻璃。\n……然后是一串咯咯的笑声，一下子就远了。');
      await S.say('外婆', f.wrong === 1 ? '听见了？屋里还没挂苦艾，她们就敢来敲窗户。' : '又来了……快些，孩子。');
    }
    if (f.wrong === 2) await S.say('外婆', '两样都得对上：叶子灰白、碎得像羽毛，还得苦。灰白不苦的不是，苦而不灰的也不是。');
    else if (f.wrong === 3) await S.say('外婆', '左边四颗钉子里有一把，右边四颗里有一把。');
    else if (f.wrong >= 4) await S.say('外婆', '是三号和七号，孩子。我都闻出来了。');
    await S.narr('你把草挂回了原来的钉子上。');
  }

  async function herbSolved(S) {
    const f = S.f; f.phase = 'out'; S.plr(null);
    await S.narr('你从三号和七号钉子上取下两把灰白的草。屋里一下子满是苦味。\n红灯盏的火苗又亮了起来。');
    await S.say('外婆', ['对了，就是它。', '一把挂到门框上；一把揣在怀里，贴着心口。']);
    S.give('polyn'); S.show('polynD');
    await S.say('外婆', ['还有一件事。玛尔法把阿廖娜的婚礼衬衣锁在箱子里，一年了，谁劝都不肯拿出来。', '水仙女们冷，没有衣裳穿，才去扯活人。要是能……给阿廖娜带一件衣裳去。']);
    S.goal(villageGoal(S)); S.cp('village');
  }

  async function glimpse(S) {
    const b = S.ent('birchV');
    await S.narr('外面的月亮很亮。家家户户的窗框上都插着白桦枝，门口撒着青草。\n村子静得能听见河水的声音。');
    S.focus(18, 6); await S.wait(500);
    b.s.sw = 1; laughter(S, 5, .03);
    await S.wait(700);
    await S.narr('村子当中那棵大白桦的树梢上，有个人在荡秋千。\n长长的头发垂下来，一荡，一荡。');
    await S.narr('树底下站着加莉娅和奥克萨娜。\n她们谁也没有抬头。');
    b.s.sw = 0; S.sfx('whisper'); S.shake(150, 1);
    await S.wait(400); S.focus(null);
    await S.think('……再看的时候，树梢上什么也没有了。');
  }

  async function oksana(S) {
    S.face('oksana', 'pl'); S.f.oksana = true;
    if (S.once('oksana1')) return S.say('奥克萨娜', ['斯捷潘往南边去了——穿过黑麦田，就是河滩。', '我奶奶说，她在水边一唱歌，人的脚就不听使唤，自己往水里走。', '歌一起，就往高处走，或者抱住河滩上插着苦艾的木桩。千万别站着听！']);
    await S.say('奥克萨娜', '我们……不敢去。我们就在这儿等你回来。');
  }

  async function galya(S) {
    const f = S.f; S.face('galya', 'pl');
    if (S.once('galya1')) {
      f.galya = true;
      await S.say('加莉娅', ['娜佳！奥克萨娜都跟你说了？', '傍晚我们刚抬着草人进了黑麦田，唱着歌跑回来，谁也没敢回头。', '可是阿廖娜不会走的。你看这树上，挂满了衬衣和绣巾，没有一件是她的。']);
      await S.say('加莉娅', ['去年三一节，我们一起往河里扔花环。我的漂走了，奥克萨娜的打了个转，也漂走了。', '阿廖娜的那个……一下子就沉了。她哭着说那是斯捷潘给她采的矢车菊，非要下水去捞。水看着那么浅……']);
      await S.say('加莉娅', ['斯捷潘天天揣着阿廖娜写给他的信。今天晚上他走的时候，连信匣子都扔在他家门口的长凳上了。', '还有……我替阿廖娜编了个花环，挂在白桦树上了。见到她，就替她扔了吧。', '这是送她们的歌，你也记着。']);
      await S.note('song');
      if (!S.has('sorochka')) S.goal(villageGoal(S));
      return;
    }
    await S.say('加莉娅', f.marfaNo && !f.letter ? '玛尔法婶婶不肯？……斯捷潘家门口那封信，你念给她听听。' : '花环挂在白桦树的低枝上，你够得着。');
  }

  async function birchV(S) {
    const f = S.f, b = S.ent('birchV');
    if (f.galya && b.s.v && !S.has('venok')) {
      await S.narr('最低的那根树枝上，挂着加莉娅编的花环：矢车菊、雏菊、黑麦穗。');
      const r = await S.ask('取下花环？', ['取下来，带给阿廖娜', '先不拿']);
      if (r === 0) { b.s.v = 0; S.give('venok'); }
      return;
    }
    await S.narr('村子当中的大白桦。树枝上挂满了衬衣、绣巾、彩带和一绺一绺的白线，在风里轻轻地晃。\n都是给她们的。');
  }

  async function casket(S) {
    const f = S.f;
    if (S.once('casket')) await S.narr('长凳上扔着一个打开的小木匣。里面是一封折了又折的信，纸边都磨毛了。');
    await S.note('letter'); f.letter = true;
    await S.think('「我想穿着它，让妈妈第一个看见」……\n玛尔法婶婶得听听这个。');
    if (!S.has('sorochka')) S.goal(villageGoal(S));
  }

  async function marfa(S) {
    const f = S.f; S.face('marfa', 'pl');
    if (S.has('sorochka') || f.marfaMsg) return S.say('玛尔法', '去吧，孩子。……替我看看她。');
    if (!f.letter) {
      if (S.once('marfa1')) {
        await S.narr('玛尔法婶婶倚着自家门框站着。一年了，她每天夜里都这样站着，像在等谁回家。');
        await S.say('玛尔法', ['娜佳？这么晚了……衬衣？是你外婆让你来的吧。', '挂到树上……挂到树上，就是说我的阿廖娜成了那个东西。成了坐在树上、把人往水里拉的那个东西。', '她是受过洗的好姑娘！她只是……掉进河里了。']);
        await S.think('要是阿廖娜自己开口要，她就会给了吧……');
      } else await S.say('玛尔法', '……她是好姑娘。她不是那个东西。');
      f.marfaNo = true; S.goal(villageGoal(S));
      return;
    }
    const r = await S.ask('玛尔法婶婶攥着门框，不看你。', ['（把阿廖娜的信念给她听）', '……没什么。']);
    if (r !== 0) return;
    await S.say('玛尔法', '我不识字……你念吧。');
    await S.narr('你念到「领口是妈妈起的头」，她的手松开了门框。\n念到「我想穿着它，让妈妈第一个看见」，她蹲了下去，捂住了脸。');
    await S.narr('过了很久，她站起来，进了屋。你听见箱子上的锁「咔哒」一声。');
    S.give('sorochka'); f.marfaMsg = true;
    await S.say('玛尔法', ['拿去，挂给她。', '……再替我跟她说一句：花环沉了，不怪她。妈妈不生她的气。']);
    S.goal(villageGoal(S));
  }

  /* 黑麦田里的沙沙声：在玩家身边 2–3 格的麦子里摇一下 */
  function rustle(S) {
    const p = W.pl, m = curMap(), c = [];
    for (let dy = -3; dy <= 3; dy++) for (let dx = -3; dx <= 3; dx++) {
      const d = Math.abs(dx) + Math.abs(dy); if (d < 2 || d > 3) continue;
      const x = p.x + dx, y = p.y + dy; if (x < 0 || y < 0 || x >= m.w || y >= m.h) continue;
      if (tileName(m, x, y) === 'rye') c.push([x, y]);
    }
    if (!c.length) return;
    const [x, y] = c[(Math.random() * c.length) | 0];
    S.place('rustle', x, y); S.f._rh = 1.1;
    for (let i = 0; i < 4; i++) S.tone('sawtooth', 140 + i * 30, 90, .18, .018, i * .12, 420);   // 沙沙
    if (Math.random() < .45) laughter(S, 4, .02); else if (Math.random() < .5) S.sfx('whisper');
  }

  async function meetRus(S) {
    const f = S.f; f.met = true; S.hide('rustle');
    S.amb('none');
    const py = W.pl.y; S.face('pl', 0);
    await S.narr('黑麦忽然不响了。\n风还在吹，可是整片田一点声音也没有。');
    const sy = py <= 17 ? 20 : py === 18 ? 21 : 22, sx = sy === 20 ? 13 : 12;   // 在你前面 3 格的田埂上
    S.place('rus_r', sx, sy, 3); S.ent('rus_r').alpha = 0; S.bubble('rus_r', '!', 1200); laughter(S, 5, .03);
    await S.alpha('rus_r', 1, 900);
    await S.narr('前面的田埂上，站着一个光着脚的姑娘。\n湿透的白衬衣贴在身上，头发一直拖到地上——在月光底下，是绿的。');
    await S.walk('rus_r', [13, Math.min(20, py + 1)], 3.2);
    await S.scare('face', { spr: '@rusalka', sfx: 'giggle' });
    await S.say('绿头发的姑娘', ['娜佳，娜佳，这么晚了，你去哪儿呀？', '你手里拿的是什么——']);
    let silent = 0;
    while (true) {
      const r = await S.ask('「——是苦艾，还是欧芹？」', ['苦艾', '欧芹', '（什么也不说）'], '绿头发的姑娘');
      if (r === 0) break;
      if (r === 1) return parsleyEnd(S, false);
      if (++silent >= 2) return parsleyEnd(S, true);
      laughter(S, 4, .03); S.shake(200, 1);
      await S.narr('她又凑近了一点。冰凉的手指头，轻轻碰了一下你的胳肢窝。\n你差一点就笑出了声。');
      await S.say('绿头发的姑娘', '说呀。不说，我就当你是欧芹了。');
    }
    await S.say('绿头发的姑娘', '苦艾？——呸！那你就躲开！', { style: 'big' });
    S.sfx('scream'); S.shake(300, 2);
    await S.alpha('rus_r', 0, 500);
    await S.narr('她尖叫一声，往后一仰，钻进了黑麦里。\n黑麦哗啦啦地一路倒下去，一直倒到河边。');
    S.amb('wind');
    await S.think('……那张脸。\n我认得那张脸。');
    S.goal(GOAL_RYE);
  }

  async function parsleyEnd(S, silent) {
    DIED.parsley++;
    await S.say('绿头发的姑娘', (silent ? '不说话的，就是欧芹。——' : '欧芹？——') + '哎呀，我的小亲亲！', { style: 'big' });
    laughter(S, 16, .05); S.shake(1400, 2);
    await S.scare('face', { spr: '@rusalka', sfx: 'laugh' });
    await S.end({ bad: true, id: 'parsley', title: '我的小亲亲', text: '她冰凉的手指钻进了你的胳肢窝、你的肋骨缝。\n你笑了。停不下来。\n笑到喘不上气，笑到眼泪流进嘴里，笑到满天的星星一圈一圈地转。\n\n第二天早上，割草的人在田埂上找到你。\n你的嘴角还翘着。\n\n（外婆说过：她问的时候，要说苦艾。）' });
  }

  async function birchScene(S) {
    const f = S.f; f.phase = 'birch'; songEnd(S); S.norun(false);
    S.focus(40, 6); await S.wait(400);
    songPhrase(S, .06);
    await S.narr('河滩到头了。一棵老白桦斜斜地探到水面上。\n最低的那根树枝上坐着一个姑娘，两只脚一荡、一荡，脚尖点着水。');
    await S.narr('她的头发一直垂到水里，是绿的。');
    S.focus(41, 9); await S.wait(300);
    await S.narr('斯捷潘站在齐膝深的水里，仰着脸看她，一动不动。');
    S.focus(null);
    laughter(S, 5, .03);
    await S.say('树上的姑娘', ['你也来了，娜佳。', '你也来荡秋千吗？']);
    await S.think('……阿廖娜。');
    S.goal(GOAL_BIRCH); S.cp('birch');
  }

  async function stepanTalk(S) {
    const f = S.f;
    if (f.phase !== 'birch') return S.narr('斯捷潘站在水里，背对着你。');
    if (S.once('stepan1')) await S.say('娜佳', '斯捷潘！斯捷潘，回来！');
    await S.narr('他听不见。他仰着脸，眼睛直直地看着树枝上的她，水已经没过了膝盖。');
  }

  async function birchFinal(S) {
    const f = S.f;
    if (f.phase !== 'birch') return S.narr('一棵老白桦，斜斜地探到水面上。');
    const opts = [], acts = [];
    if (S.has('sorochka')) { opts.push('（把阿廖娜的衬衣挂上白桦枝）'); acts.push('shirt'); }
    opts.push('阿廖娜——是我，娜佳。'); acts.push('talk');
    opts.push('（把苦艾朝她扔过去）'); acts.push('throw');
    opts.push('（再等一等）'); acts.push('wait');
    const a = acts[await S.ask('她在树枝上荡着，一下，又一下。', opts)];
    if (a === 'shirt') return endFarewell(S);
    if (a === 'throw') return endWormwood(S);
    if (a === 'wait') {   // 等着不动：水一点一点漫上去（不会输，只是更急）
      const n = f.waits = (f.waits || 0) + 1;
      await S.narr(['水又漫上来一点，没过了斯捷潘的大腿。', '水到了斯捷潘的腰。他还在往前走，一小步，一小步。', '水到了斯捷潘的胸口。树枝上的她，笑得更响了。'][Math.min(2, n - 1)]);
      if (n >= 3) laughter(S, 6, .035);
      return;
    }
    if (S.once('alyTalk')) {
      await S.say('阿廖娜', ['娜佳……河底下好冷。', '我的衬衣呢？我绣了一整个冬天的那件……妈妈把它锁进箱子里了。', '没有衣裳穿，我就只好要斯捷潘了。他说过，要一辈子陪着我。']);
    } else await S.say('阿廖娜', '我冷，娜佳。');
    if (S.has('sorochka')) await S.think('衬衣……就揣在我怀里。');
    else await S.think('要是带着那件衬衣就好了……\n可是斯捷潘在水里，我一步也不能走开。');
  }

  async function endWormwood(S) {
    const f = S.f; f.phase = 'end';
    await S.narr('你把怀里那把苦艾朝她扔了过去。');
    S.sfx('scream'); S.shake(500, 3);
    S.ent('oldbirch').s.who = '';
    S.place('aly', 42, 9, 0); S.ent('aly').alpha = 1;
    await S.alpha('aly', 0, 600);
    S.sfx('splash');
    await S.narr('她尖叫起来，像被火烫着了一样，从树枝上翻了下去——扑通一声，沉进了黑水里。\n河面上只剩下一圈一圈的波纹。');
    S.bubble('stepan', '!', 900); S.face('stepan', 1);
    await S.walk('stepan', [40, 9], 3);
    await S.say('斯捷潘', ['……娜佳？我……我怎么站在水里？', '我好像梦见阿廖娜了。她在树上，叫我……']);
    if (S.has('cap')) { S.take('cap'); await S.narr('你把在黑麦田里捡到的帽子塞回他手里。他攥着帽子，浑身发抖。'); }
    rooster(S); S.dark(.55);
    await S.wait(900);
    if (f._o_alyTalk) await S.think('……她说她冷。');
    await S.end({ id: 'wormwood', title: '苦艾', text: '天亮的时候，你们回到了村子。斯捷潘病了三天，好了以后，再也不走河边那条路。\n' + (S.has('sorochka') ? '怀里那件衬衣，你到最后也没有拿出来。\n' : '') + '\n第二年人鱼周，又有人看见河边那棵老白桦上坐着一个绿头发的姑娘。\n她还是没有衣裳穿。\n她还在等。\n\n（苦艾能把她赶走。可是——外婆说过，她们是冷的。）' });
  }

  async function endFarewell(S) {
    const f = S.f; f.phase = 'end';
    S.take('sorochka');
    const b = S.ent('oldbirch'); b.s.shirt = true;
    await S.narr('你踮起脚，把衬衣挂上了最低的那根树枝。\n白麻布在夜风里慢慢展开。领口是玛尔法婶婶起的头，袖子上是红的罂粟、黑的白桦——一针一针，绣了一整个冬天。');
    b.s.who = '';
    S.place('aly', 42, 8, 1); S.ent('aly').alpha = 0; await S.alpha('aly', 1, 800);
    await S.say('阿廖娜', ['……这是我的衬衣。', '妈妈……把它拿出来了？']);
    S.ent('aly').spr = '@alyona';
    await S.narr('她把衬衣套在身上。湿透的绿头发披在雪白的麻布上。\n她低下头，看了很久很久袖子上的花。');
    await S.say('娜佳', '玛尔法婶婶让我告诉你：花环沉了，不怪你。妈妈不生你的气。');
    await S.say('阿廖娜', ['……妈妈。', '我只是想穿着它，让她看一眼。', '斯捷潘——回去吧。回去，娶一个活人家的姑娘。']);
    S.bubble('stepan', '!', 900); S.face('stepan', 1);
    await S.walk('stepan', [40, 9], 3); S.face('stepan', 2);
    await S.say('斯捷潘', ['……阿廖娜？', '阿廖娜，我……']);
    if (S.has('cap')) { S.take('cap'); await S.narr('你把在黑麦田里捡到的帽子塞回他手里。他攥着帽子，说不出话来。'); }
    const wr = S.has('venok');
    if (wr) {
      S.take('venok'); f.wreathGiven = true;
      await S.say('娜佳', '加莉娅替你编的。你说过，花环漂得远，就……');
      await S.narr('阿廖娜接过花环，戴在湿漉漉的头发上，笑了。\n这一回，是活人那样的笑。');
    }
    rooster(S); S.dark(.6); await S.wait(1600); rooster(S); await S.wait(500);
    await S.narr('远远地，村子里的公鸡叫了头一遍。\n河对岸的天，泛白了。人鱼周过去了。');
    seeoffSong(S); S.dark(.45);
    await S.say('阿廖娜', ['听——她们在唱送我的歌。', '娜佳，明年三一节，替我往河里扔一个花环吧。']);
    S.face('aly', 0);
    await S.walk('aly', [[42, 9], [42, 10]], 2);
    await S.alpha('aly', 0, 1600);
    if (wr) await S.narr('她走进水里的地方，漂起来一个花环。\n矢车菊、雏菊、黑麦穗。它没有沉，顺着水，漂得很远、很远。');
    else await S.narr('她走进水里的地方，什么也没留下。\n只有白桦树枝上，空空地晃着一根湿了的红头绳。');
    await S.end({ id: 'farewell', title: '送她过节', text: '人鱼周的最后一夜过去了。\n斯捷潘在河边一直坐到太阳出来，才跟着你回了村子。那件衬衣，第二天早上已经不在白桦树上了。\n玛尔法婶婶听说以后，什么也没说，只是把锁过衬衣的那只箱子打开了，一直开着。\n\n' + (wr ? '你看见了那个花环漂远的样子。第二年三一节，你替阿廖娜往河里扔了一个新的——它也漂得很远。' : '第二年三一节，姑娘们往河里扔花环的时候，你多编了一个。') });
  }
})();
