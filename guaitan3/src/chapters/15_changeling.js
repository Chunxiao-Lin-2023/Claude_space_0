/* ================= 第十五夜 · 调换儿 ================= */
(() => {
  /* ---------- 小工具 ---------- */
  const cycle = (S, key, lines) => lines[(S.f[key] = ((S.f[key] ?? -1) + 1) % lines.length)];
  /* 计数写进当前检查点（S.f 会在重来时被检查点覆盖），用于重来后的逐级提示 */
  function bump(S, key) { S.f[key] = (S.f[key] || 0) + 1; if (W.cp && W.cp.f) W.cp.f[key] = (W.cp.f[key] || 0) + 1; }
  /* 带着小老头换地图：先把跟随的人搬过去，S.go 会把他放到玩家身边 */
  async function go2(S, map, x, y, dir) {
    const c = S.ent('chg');
    if (c && c.follow) S.moveTo('chg', map, x, y, dir);
    await S.go(map, x, y, dir);
  }
  /* ---------- 合成音 ---------- */
  const LULLABY = [[587, .5], [659, .5], [698, .9], [659, .4], [587, .5], [523, .5], [440, 1.1], [494, .5], [523, .5], [587, 1.3]];
  function hum(S, v = 1) { let t = 0; for (const [f, d] of LULLABY) { S.tone('sine', f / 2, f / 2 * .998, d * .95, .05 * v, t, 900); S.tone('triangle', f, f, d * .8, .012 * v, t, 1200); t += d * .62; } }
  const SHELL = (S, n = 3) => { for (let i = 0; i < n; i++) S.tone('sine', 2100 + i * 260, 2000 + i * 240, .08, .05, i * .13, 5000); };
  const GIGGLE = S => { for (let i = 0; i < 5; i++) S.tone('square', 520 - i * 30 + (i % 2) * 90, 480 - i * 30, .07, .03, i * .1, 1600); };
  const CROW = (S, v = 1) => { S.tone('sawtooth', 520, 880, .18, .05 * v, 0, 2200); S.tone('sawtooth', 880, 760, .5, .05 * v, .18, 2200); S.tone('sawtooth', 760, 420, .35, .04 * v, .68, 1800); };
  const PLUCK = (S, f, v = 1, d = 0) => { S.tone('triangle', f, f * .997, .9, .045 * v, d, 2600); S.tone('sine', f * 2, f * 2, .4, .012 * v, d, 3000); };
  const HARP = [392, 494, 587, 740, 587, 494, 440, 523, 659, 784, 659, 523];
  const DANCE = [587, 740, 880, 740, 659, 784, 988, 784, 587, 740, 880, 1175];
  /* ---------- 摇篮里的孩子（第五夜之后的设定） ---------- */
  const CR = ['fairyfrost', 'log', 'fairy', 'ifan', 'log'];   // 1..5 号摇篮里真正躺着的
  const CRX = [12, 14, 16, 18, 20];
  /* ---------- 地下舞厅 ---------- */
  const RING = cx => [[cx - 1, 4], [cx - 1, 3], [cx, 3], [cx + 1, 3], [cx + 1, 4], [cx + 1, 5], [cx, 5], [cx - 1, 5]];   // 顺时针
  const DANCERS = [   // 第一环一个人慢慢转；第二环一对舞伴逆着转；第三环一对转得快
    { id: 'd1', cx: 7, i: 4, dn: 1, spd: 2.0 },
    { id: 'd2', cx: 16, i: 4, dn: -1, spd: 2.3 },
    { id: 'd3', cx: 16, i: 6, dn: -1, spd: 2.3 },
    { id: 'd4', cx: 26, i: 0, dn: 1, spd: 3.0 },
    { id: 'd5', cx: 26, i: 3, dn: 1, spd: 3.0 }];
  const ESC_T = 28, TOUCH_PX = 10;
  const KP = { alias: { '1': '倒水', '2': '开口', '3': '敲蛋', '4': '撒麦', '5': '摆壳' } };
  const RITE = ['敲蛋', '摆壳', '倒水', '撒麦', '开口'];
  /* 尖耳朵 */
  const EARS = (sk) => (g, d, fr, G, R) => { if (d === 0) { R(2, G.hT + 2, 2, 1, sk); R(1, G.hT + 1, 1, 1, sk); R(12, G.hT + 2, 2, 1, sk); R(14, G.hT + 1, 1, 1, sk); } else if (d === 1) { R(9, G.hT + 2, 2, 2, sk); R(11, G.hT + 1, 1, 1, sk); } };
  /* 小老头：皱巴巴的光头、尖耳朵、蕾丝婴儿帽、拖到脚的白色婴儿袍 */
  function chgP(key, shawl) {
    const SK = '#c8b494';
    return { key, skin: SK, hair: '#e0dcd0', hs: 'bald', top: '#ece6d6', top2: '#d8d0bc', robe: true, noFeet: true, child: true, eye: '#d8a820', mouth: '#6a3a2a',
      extra(g, d, fr, G, R) {
        EARS(SK)(g, d, fr, G, R);
        R(4, G.hT - 1, 8, 2, '#f4f0e4'); R(4, G.hT - 1, 1, 4, '#f4f0e4'); if (d === 0) { R(11, G.hT - 1, 1, 4, '#f4f0e4'); R(5, G.hT + 3, 1, 1, '#a08a6a'); R(10, G.hT + 3, 1, 1, '#a08a6a'); R(6, G.hT + 7, 4, 1, '#a08a6a'); }
        if (shawl) { R(3, G.tT, 10, 3, '#9a2222'); R(3, G.tT + 3, 2, 3, '#9a2222'); R(11, G.tT + 3, 2, 3, '#7a1a1a'); R(4, G.tT, 8, 1, '#b83030'); }
      } };
  }
  /* 格温（抱着弟弟时 baby=true） */
  function gwenP(key, baby) {
    return { key, skin: '#f0caa8', hair: '#3a2418', hs: 'long', top: '#3a3448', top2: '#e8e0d0', bottom: '#8a2626', skirt: true, apron: '#d8d0bc', shoes: '#2a1a10',
      extra(g, d, fr, G, R) {
        if (d !== 3) { R(3, G.tT, 10, 2, '#5a2a2a'); }
        if (!baby) return;
        if (d === 0) { R(4, G.tT + 3, 8, 5, '#ece6d6'); R(5, G.tT + 4, 3, 3, '#f0caa8'); R(6, G.tT + 5, 1, 1, '#3a2418'); R(3, G.tT + 4, 1, 3, '#f0caa8'); R(12, G.tT + 4, 1, 3, '#f0caa8'); }
        else if (d === 1) { R(2, G.tT + 3, 6, 5, '#ece6d6'); R(2, G.tT + 4, 2, 3, '#f0caa8'); }
        else { R(4, G.tT + 2, 8, 2, '#ece6d6'); }
      } };
  }

  defChapter({
    id: 'changeling', n: 15, title: '调换儿', sub: '摇篮里的孩子不哭不笑，饿得吓人，一张脸皱得像个小老头。奶奶说：他不是伊万。', origin: '欧洲民间传说', color: '#2c3a2a',
    icon: '@chg', iconX: 38, amb: 'wind', floor: 'stone', wall: 'stone', dark: .78, plr: 3, darkC: '#04060a',
    endings: { home: '伊万回家了', blessing: '母亲的祝福', feast: '一口蜂蜜饼', name: '说出了名字', log: '一截桤木' },
    faces: {
      /* 小老头：婴儿帽底下一张活了几百年的脸，黄眼睛，咧开的嘴里一排小尖牙 */
      chg(R, a) {
        const SK = '#c8b494', SK2 = '#a8946e', SK3 = '#7a6644', CAP = '#f4f0e4', CAP2 = '#d8d0bc';
        R(3, 0, 26, 6, CAP); R(1, 4, 4, 18, CAP); R(27, 4, 4, 18, CAP); for (let i = 0; i < 7; i++) R(4 + i * 4, 5, 2, 2, CAP2);
        R(0, 10, 3, 4, SK); R(29, 10, 3, 4, SK); R(0, 8, 1, 3, SK2); R(31, 8, 1, 3, SK2);   // 尖耳朵从帽沿下钻出来
        R(5, 6, 22, 20, SK); R(7, 26, 18, 3, SK); R(10, 29, 12, 2, SK2); R(22, 7, 5, 19, SK2);
        R(8, 8, 6, 1, SK3); R(18, 8, 6, 1, SK3); R(9, 10, 4, 1, SK3); R(19, 10, 4, 1, SK3); R(6, 18, 3, 1, SK3); R(23, 18, 3, 1, SK3); R(7, 21, 2, 1, SK3); R(23, 21, 2, 1, SK3);   // 皱纹
        const o = a < .25 ? 1 : 4;   // 先眯着，然后猛地睁大
        R(8, 13 - (o >> 1), 6, o, '#f0d040'); R(18, 13 - (o >> 1), 6, o, '#f0d040'); if (o > 1) { R(10, 12, 2, 3, '#1a1008'); R(20, 12, 2, 3, '#1a1008'); } R(8, 11, 6, 1, SK3); R(18, 11, 6, 1, SK3);
        R(15, 15, 2, 4, SK2); R(14, 19, 4, 1, SK3);
        const w = 8 + Math.round(a * 6); R(16 - w, 22, w * 2, 3, '#2a1010'); R(16 - w, 21, 1, 1, SK3); R(15 + w, 21, 1, 1, SK3);
        for (let i = 0; i < w; i++) R(17 - w + i * 2, 22, 1, 2, '#eae2c8');
      },
      /* 山中夫人：银发、山楂花冠；眼睛慢慢变成两口没有眼白的黑井，笑容咧得太宽 */
      lady(R, a) {
        const SK = '#eef2ee', SK2 = '#c4ccc8', SK3 = '#9aa49e', H = '#7e8a98', H2 = '#5a6470';
        R(2, 4, 28, 28, H); R(4, 4, 1, 28, H2); R(27, 4, 1, 28, H2);
        R(4, 1, 24, 4, '#3a5a2a'); for (let i = 0; i < 7; i++) { R(4 + i * 4, 0, 3, 2, '#f4f2ea'); R(6 + i * 4, 3, 1, 1, '#c02020'); }
        R(8, 5, 16, 18, SK); R(9, 23, 14, 2, SK); R(11, 25, 10, 2, SK); R(13, 27, 6, 2, SK2); R(21, 6, 3, 17, SK2); R(8, 18, 1, 5, SK3); R(23, 18, 1, 5, SK3); R(10, 9, 5, 1, SK3); R(17, 9, 5, 1, SK3);
        R(8, 5, 2, 12, H); R(22, 5, 2, 10, H);
        const k = Math.min(1, a * 1.6);
        if (k < .5) { R(10, 12, 5, 2, '#f4f6f6'); R(17, 12, 5, 2, '#f4f6f6'); R(12, 12, 2, 2, '#2a5a3a'); R(19, 12, 2, 2, '#2a5a3a'); }
        else { R(10, 11, 5, 4, '#050608'); R(17, 11, 5, 4, '#050608'); R(11, 15, 1, 2 + Math.round(a * 3), '#050608'); R(20, 15, 1, 1 + Math.round(a * 3), '#050608'); }
        R(15, 15, 2, 4, SK2);
        const w = 3 + Math.round(a * 7); R(16 - w, 21, w * 2, 1 + Math.round(a * 2), '#3a0a14'); R(16 - w, 20, 1, 1, '#8a3a4a'); R(15 + w, 20, 1, 1, '#8a3a4a');
        if (a > .5) for (let i = 0; i < w - 1; i++) R(17 - w + i * 2, 21, 1, 1, '#f4f2ea');
      }
    },
    people: {
      me: gwenP('cg-me', false),
      meb: gwenP('cg-meb', true),
      nain: { key: 'cg-nain', skin: '#e0b898', hair: '#e0dcd4', hs: 'bun', top: '#2a2a32', top2: '#e8e0d0', bottom: '#6a1e1e', skirt: true, apron: '#c8c0b0', shoes: '#1a1210', eye: '#2a2020',
        extra(g, d, fr, G, R) { R(5, 0, 6, 2, '#141216'); R(3, 2, 10, 1, '#141216'); R(5, 1, 6, 1, '#2a2830'); R(3, G.tT, 10, 3, '#8a1a1a'); if (d === 0) R(7, G.tT + 3, 2, 2, '#8a1a1a'); } },
      chg: chgP('cg-chg', false),
      chgw: chgP('cg-chgw', true),
      lady: { key: 'cg-lady', big: true, skin: '#eef2ee', hair: '#8a96a4', hs: 'long', top: '#2a5a3a', top2: '#1a3a24', robe: true, noFeet: true, eye: '#1a2a20', mouth: '#9a4a5a',
        extra(g, d, fr, G, R) { R(4, G.hT - 1, 8, 1, '#3a5a2a'); if (d !== 3) { R(4, G.hT - 2, 1, 1, '#f4f2ea'); R(7, G.hT - 2, 1, 1, '#c02020'); R(10, G.hT - 2, 1, 1, '#f4f2ea'); } R(3, G.tT + 1, 10, 1, '#c8b860'); } },
      folk1: { key: 'cg-f1', skin: '#d8e2dc', hair: '#2a3a2a', hs: 'long', top: '#3a5a3a', robe: true, child: true, eye: '#0a1a10', extra: EARS('#d8e2dc') },
      folk2: { key: 'cg-f2', skin: '#e2e0d4', hair: '#8a7a4a', hs: 'messy', top: '#5a5a3a', bottom: '#3a3a2a', child: true, eye: '#1a1a0a', extra: EARS('#e2e0d4') },
      folk3: { key: 'cg-f3', skin: '#d4dce4', hair: '#c8ccd4', hs: 'bob', top: '#2a3a5a', dress: true, child: true, eye: '#0a0a1a', extra: EARS('#d4dce4') },
      harper: { key: 'cg-harp', skin: '#dce2e0', hair: '#eceae4', hs: 'long', top: '#4a4a5a', robe: true, eye: '#2a2a3a', extra: EARS('#dce2e0') },
      dancer: { key: 'cg-dance', skin: '#e4eef0', hair: '#c8e0dc', hs: 'long', top: '#9ac0b4', dress: true, ghost: true, eye: '#0a1a1a', extra: EARS('#e4eef0') }
    },
    items: {
      eggs: { name: '一篮鸡蛋', desc: '鸡窝里摸来的，还带着母鸡肚皮底下的热气。一共十二个。' },
      water: { name: '一罐井水', desc: '刚从井里打上来，冰得罐子外头结了一层水珠。' },
      malt: { name: '一把麦芽', desc: '去年秋天爸爸酿麦酒剩下的，闻着有股甜甜的焦香。' },
      iron: { name: '铁剪子', desc: '奶奶的裁缝剪，原先张着口挂在摇篮上头。揣在围裙兜里，沉甸甸的。山里的人怕铁。' },
      hag: { name: '带孔的石头', desc: '溪水冲出来的一块灰石头，正中间天生一个圆孔。透过孔看东西，世界好像变冷了一点。' },
      shawl: { name: '妈妈的红披肩', desc: '红毛呢的披肩，妈妈结婚那年织的。叠起来软软的一团。' },
      milk: { name: '一杯热牛奶', desc: '刚挤的牛奶，还冒着白气。' },
      baby: { name: '伊万', desc: '你的弟弟。他在你怀里呼着小小的白气，攥着你的一根手指。' }
    },
    notes: {
      bible: { title: '家用《圣经》的扉页', text: '（厚厚的威尔士文《圣经》，扉页上一行一行记着家里的大事，最早的墨迹已经发褐）\n\n格温·琼斯　生于一八五四年三月\n伊万·琼斯　生于一八六八年八月九日，礼拜天，天快亮时\n\n（下面是妈妈的字，越写越小）\n九月　他会笑了。听见我哼那支老歌，就不哭。\n十月　他认得我了。左边眉梢那颗小痣，越长越像他爸爸。\n十月廿七　夜里起风。我起来喂他，摇篮是凉的。\n\n（最后一行写得很乱，笔尖把纸都划破了）\n他不是。他不是。' },
      songbook: { title: '奶奶歌本的最后一页', text: '（歌本里夹着干了的石楠花。最后一页是奶奶用铅笔抄的，字歪歪扭扭）\n\n　　蛋壳酒——外婆教的老法子\n\n家里来了不哭不笑的孩子，\n别打它，别骂它，别把它往门外放。\n给它看一桩稀奇事——它活得再久，也没见过的事。\n\n敲蛋之前，什么都别忙。蛋黄蛋清给鸡，壳留着。\n壳要在炉石上站稳了，才好往里倒水；拿在手里倒，十只洒九只。\n麦芽撒在水面上，别撒进空壳里——空壳里的麦芽，它一眼就看穿。\n话留到最后。等它的眼睛转到锅上，再大声说：给割麦的人酿酒喽！\n\n它要是开了口，你就晓得了。\n它要是笑了，就别怕。' },
      letter: { title: '牧师留下的信', text: '琼斯太太：\n\n礼拜二我来过，您睡着，没敢惊动。\n\n山那边有一户人家，孩子病得不吃奶，瘦得只剩一把骨头。有人教他们说，那是「被换了」，要把孩子放到门外的冷夜里，「那边」的人才会把真的换回来。\n\n孩子在门外过了一夜。\n\n我写这封信，是求您记住：孩子病了，就是病了。不哭、不长、不认人，都是病，不是谁换的。请把他抱到镇上，找医生看。诊金，教会可以帮。\n\n愿主保守您和您的家。\n\n　　　　　　　　　　　教区牧师　谨上' },
      midwife: { title: '石头上的刻字', text: '（墙根一块平平的石头，上面用针尖刻满了小字，刻痕里长着青苔）\n\n我是山脚下的接生婆。\n那年他们半夜来请我，说是给一位夫人接生。\n他们给我一盒药膏，叫我抹在孩子的眼睛上。我手一滑，抹到了自己的左眼。\n左眼一看——金殿成了土洞，金杯成了枯叶。\n\n后来的人，记住：\n他们的饭，一口都不能吃。吃了，就回不去了。\n他们问你的名字，别说。\n\n带孔的石头只看得穿假东西。他们的孩子不假，只是不是我们的。\n要分辨人的孩子：山里冷，人的孩子会呼白气，一下，一下。他们的孩子，不呼气。\n\n我只看得见……\n（后面的字，被人用石头砸平了）' }
    },
    legend: '「调换儿」（changeling）是流传在欧洲许多地方的民间信仰：爱尔兰、苏格兰、威尔士、斯堪的纳维亚、德国……都有。人们相信，仙灵、精灵或山妖会偷走人类的婴儿，在摇篮里留下一个替身——有时是他们自己生病或年老的同类，有时干脆是一截被施了法的木头，过不了几天就会「死去」。传说里调换儿的样子大同小异：不哭不笑或者哭个不停，饭量大得吓人却不长个子，脸皱得像老人，眼神不像孩子。防范的办法也很相似：在摇篮上挂张开的剪刀或其他铁器，系红线，夜里不熄火，早早给孩子受洗。在威尔士，人们管仙灵叫「Tylwyth Teg」（美丽的一族），也小心翼翼地称他们为「Bendith y Mamau」（母亲们的祝福），据说这样说好话，他们就不会来找麻烦。\n\n传说里最有名的一种「揭穿」法，是在调换儿面前做一件荒唐事：用蛋壳酿酒，或者用蛋壳给割麦的人煮饭。调换儿看呆了，忍不住开口，一开口就露了馅。格林兄弟收录过一则德国故事，调换儿惊叫：「我已经老得像韦斯特森林一样了，还从没见过有人用蛋壳煮东西！」十九世纪关于威尔士、爱尔兰民间传说的记录里，也有许多类似的版本。同样流传很广的还有「仙灵的接生婆」：一位接生婆被请进仙丘，药膏误抹进自己的眼睛，从此看穿了仙灵的幻术。「不吃仙灵的食物」「不说出自己的名字」「带孔的石头能看见仙灵」，也都是英伦三岛民间传说里常见的说法。\n\n这个传说也有沉重的一面。民俗学者和历史学者普遍认为，所谓「调换儿」，很多时候是人们在没有医学解释的年代，给生病、发育迟缓或有残障的孩子找的说法。可怕的是，有些「换回来」的办法本身就是伤害：把孩子放在火边、扔进冷水、整夜放在门外。十八、十九世纪英国和爱尔兰的法庭记录里，确有孩子因此受伤甚至死去的案件；1895年爱尔兰蒂珀雷里郡还发生过一起轰动一时的命案，一位年轻妇人被丈夫当成「被换走的人」而遇害。所以，本章里只出现传说中「不伤人」的蛋壳法；任何伤害孩子的办法，都不是解法。\n\n（本章中的琼斯一家、奶奶的歌本与蛋壳酒的步骤顺序、牧师的信、小老头、山中夫人、接生婆的刻字、五只摇篮与三次机会、土廊里的舞环和「鸡叫关门」的规矩，均为游戏虚构；奶奶哼的摇篮曲是为游戏写的旋律。调换儿说的那句话，据各地蛋壳故事的说法改写。）',
    start: { map: 'cottage', x: 9, y: 8, dir: 3 },
    resume: {
      hall: async S => { await go2(S, 'hall', 10, 12, 3); },
      escape: async S => {
        S.wear('@meb'); S.norun(true); placeDancers(S); S.f.catching = false; S.f.ironUsed = false;
        const n = S.f._dEsc || 0;
        if (n === 1) await S.think('……再来。顺着舞步走，等跳舞的人转过去，再进环。');
        else if (n >= 2) { await S.think(['站在环外面那一格，是安全的。', '看清楚他们往哪边转——跟在一个人身后进去，别迎着人走。']); S.toast('提示：环外一格安全；顺着舞步、跟在舞者身后过环'); }
        escGoal(S);
        S.timer(ESC_T, '鸡叫', escTimeout, { during: true });
      }
    },
    async intro(S) {
      await S.card('第十五夜　调换儿', '1868年10月31日　威尔士北部　斯诺登山脚下', '山谷里的人说，今夜是冬天的头一夜。\n\n这一夜，死人会回来烤火，\n山丘里的门，会开到鸡叫。\n\n格温·琼斯十四岁。\n她的小弟弟伊万，已经三天没有哭过了。');
    },
    tick(S, dt) {
      if (S.map === 'cottage') cottageTick(S, dt);
      if (S.map === 'hall') hallTick(S, dt);
      if (S.map === 'tunnel') tunnelTick(S, dt);
    },
    thumb(g, w, h) {   // 炉火边的摇篮，篷子底下一双黄眼睛；窗外山坡上，仙丘的门亮着
      const F = (x, y, ww, hh, c) => { g.fillStyle = c; g.fillRect(x | 0, y | 0, ww, hh); };
      F(0, 0, w, h - 22, '#1a1612');
      F(w - 48, 3, 40, 22, '#2a2420'); F(w - 46, 5, 36, 18, '#0c1418');   // 窗
      g.fillStyle = '#1c2a1c'; g.beginPath(); g.ellipse(w - 28, 23, 14, 8, 0, Math.PI, 0); g.fill();
      F(w - 30, 17, 4, 6, '#e8ffd8'); F(w - 34, 13, 12, 10, 'rgba(200,255,200,.16)');
      F(w - 28, 5, 2, 18, '#2a2420');
      F(6, 10, 44, 40, '#4a4640'); F(12, 22, 32, 28, '#0e0806');   // 壁炉
      for (let i = 0; i < 6; i++) F(15 + i * 5, 40 - (i % 3) * 4, 4, 10 + (i % 3) * 4, i % 2 ? '#ff8a2a' : '#ffcf5a');
      const gl = g.createRadialGradient(28, 44, 4, 28, 44, 70); gl.addColorStop(0, 'rgba(255,150,60,.35)'); gl.addColorStop(1, 'rgba(255,150,60,0)'); g.fillStyle = gl; g.fillRect(0, 0, w, h);
      for (let i = 0; i < 5; i++) { F(10 + i * 8, h - 30, 6, 5, '#f4f0e4'); F(10 + i * 8, h - 30, 6, 1, '#c8c0a8'); }   // 炉石上一排蛋壳
      F(52, h - 30, 40, 4, '#3a2818'); F(54, h - 44, 36, 14, '#7a5634'); F(76, h - 56, 14, 16, '#6a4a2c'); F(78, h - 54, 10, 12, '#140c08');   // 摇篮
      F(79, h - 50, 2, 2, '#f0d040'); F(84, h - 50, 2, 2, '#f0d040');   // 一双黄眼睛
      F(56, h - 42, 20, 4, '#ece6d6');
      F(70, h - 70, 1, 12, '#6a6a6a'); F(67, h - 60, 1, 6, '#c8ccd0'); F(73, h - 60, 1, 6, '#c8ccd0');   // 张开的铁剪
    },
    sprites: {
      /* 壁炉：吊锅、火；shells = 炉石上摆着蛋壳 */
      hearth(g, e, t, R) {
        box(R, -2, -12, 36, 27, '#5a5650'); R(-2, -14, 36, 3, '#3a3632'); R(5, -4, 22, 18, '#120a08');
        for (let i = 0; i < 6; i++) { const h = 3 + (((Math.sin(t * 9 + i * 1.7) + 1) * 3) | 0); R(7 + i * 3, 13 - h, 3, h, i % 2 ? '#ff8a2a' : '#ffcf5a'); }
        R(15, -4, 2, 6, '#2a2420'); box(R, 10, 2, 12, 7, '#2a2a2c'); R(11, 3, 10, 1, '#4a4a4c');
        R(14 + Math.sin(t * 2) * 2, -2 - ((t * 5) % 6), 3, 2, 'rgba(210,210,210,.3)');
        R(-2, 14, 36, 2, '#6a6660');
        if (e.shells) { for (let i = 0; i < 6; i++) { R(1 + i * 5, 11, 4, 3, '#f4f0e4'); R(1 + i * 5, 11, 4, 1, '#c8c0a8'); if (e.brew) R(2 + i * 5, 11, 2, 1, '#c8a050'); } if (e.brew) for (let i = 0; i < 3; i++) R(4 + i * 10 + Math.sin(t * 3 + i) * 2, 6 - ((t * 6 + i * 3) % 8), 2, 2, 'rgba(230,230,230,.35)'); }
      },
      /* 摇篮：s.turned 篷子朝左（对着壁炉）；s.empty 空；s.ifan 伊万回来了；张开的铁剪挂在上头 */
      cradle(g, e, t, R) {
        const L = !!e.turned, rock = e.empty || e.ifan ? 0 : Math.round(Math.sin(t * 1.3) * .6);
        R(0, 13, 16, 2, '#3a2818'); R(1, 12 + rock, 14, 1, '#5a3a22');
        box(R, 1, 4 + rock, 14, 9, '#7a5634'); R(2, 5 + rock, 12, 2, '#ece6d6');
        const hx = L ? 1 : 9; box(R, hx, -1 + rock, 6, 8, '#6a4a2c'); R(hx + 1, rock, 4, 6, '#2a1a10');
        if (!e.empty) {
          const fx = L ? 3 : 10;
          R(fx, 3 + rock, 3, 3, e.ifan ? '#f0caa8' : '#c8b494');
          if (!e.ifan && !e.revealed) {
            const p = W.pl, ex = Math.round(e.px / TS), ey = Math.round(e.py / TS), dx = ex - p.x, dy = ey - p.y;
            const look = (p.dir === 0 && dy > 0 && Math.abs(dx) <= dy) || (p.dir === 3 && dy < 0 && Math.abs(dx) <= -dy) || (p.dir === 1 && dx < 0 && Math.abs(dy) <= -dx) || (p.dir === 2 && dx > 0 && Math.abs(dy) <= dx);
            if (!look && Math.sin(t * 1.7) > -.6) { R(fx, 4 + rock, 1, 1, '#f0d040'); R(fx + 2, 4 + rock, 1, 1, '#f0d040'); }
            else { R(fx, 4 + rock, 1, 1, '#6a5a3a'); R(fx + 2, 4 + rock, 1, 1, '#6a5a3a'); }
          }
          if (e.ifan) { R(fx, 4, 1, 1, '#3a2418'); R(fx + 2, 4, 1, 1, '#3a2418'); if (Math.sin(t * 2) > .4) R(fx + 1, 1, 1, 1, 'rgba(240,240,240,.5)'); }
        }
        if (e.iron) { R(7, -14, 1, 6, '#5a5a5a'); R(5, -8, 1, 5, '#c8ccd0'); R(9, -8, 1, 5, '#c8ccd0'); R(4, -9, 2, 2, '#8a2a2a'); R(9, -9, 2, 2, '#8a2a2a'); }
      },
      /* 威尔士碗柜：一排排盘子和铜光的小罐 */
      wdresser(g, e, t, R) {
        box(R, 0, -14, 16, 29, '#5a3a22'); R(1, -13, 14, 1, '#3a2414');
        for (let r = 0; r < 3; r++) { R(1, -10 + r * 6, 14, 1, '#3a2414'); for (let i = 0; i < 3; i++) { R(2 + i * 5, -15 + r * 6, 4, 5, '#e8e4d8'); R(3 + i * 5, -14 + r * 6, 2, 3, r === 1 ? '#3a5a8a' : '#8a3a3a'); } }
        R(2, 6, 3, 3, '#c8904a'); R(11, 6, 3, 3, '#c8904a'); R(1, 9, 14, 1, '#3a2414'); R(7, 11, 2, 1, '#c9a35a');
      },
      /* 箱床：木板围起来的床，妈妈睡着；s.awake 坐起来了 */
      boxbed(g, e, t, R) {
        box(R, 0, -12, 16, 44, '#4a3020'); R(1, -11, 14, 2, '#5a3a26'); R(2, -6, 12, 34, '#1a120c');
        R(3, -4, 10, 6, '#e8e2d6');
        if (e.awake) { R(4, -6, 8, 7, '#e2b898'); R(4, -7, 8, 3, '#5a3a24'); R(6, -3, 1, 1, '#2a1a10'); R(9, -3, 1, 1, '#2a1a10'); R(3, 2, 10, 8, '#e8e2d6'); }
        else { R(5, -3, 6, 5, '#e2b898'); R(4, -4, 8, 2, '#5a3a24'); R(6, -1, 4, 1, '#b08870'); if (Math.sin(t * 1.4) > .7) R(10, -6, 2, 2, 'rgba(220,220,220,.2)'); }
        R(2, 3, 12, 24, '#6a3a4a'); R(2, 3, 12, 2, '#8a5060'); for (let i = 0; i < 3; i++) R(3 + i * 4, 8, 2, 18, '#5a2e3c');
        R(4, 9 + (Math.sin(t * 1.2) > 0 ? 1 : 0), 8, 1, '#5a2e3c');
      },
      shawlchair(g, e, t, R) {
        box(R, 3, -6, 10, 12, '#5a3a22'); box(R, 2, 5, 12, 4, '#6a4a2c'); R(3, 9, 2, 6, '#4a2a18'); R(11, 9, 2, 6, '#4a2a18');
        if (!e.taken) { R(2, -5, 12, 8, '#9a2222'); R(2, -5, 12, 1, '#b83030'); R(3, 3, 2, 5, '#9a2222'); R(11, 3, 2, 6, '#7a1a1a'); }
      },
      chest(g, e, t, R) { box(R, 1, 3, 14, 12, '#5a3a20'); R(1, 7, 14, 1, '#3a2414'); R(2, 3, 12, 2, '#6a4a2c'); R(7, 8, 2, 3, '#c9a35a'); if (e.open) { R(1, -2, 14, 5, '#3a2414'); R(3, 1, 10, 3, '#e8e0c8'); } },
      wheel(g, e, t, R) { R(8, 4, 1, 10, '#5a3a22'); R(2, 13, 12, 2, '#4a2a18'); const a = t * .3; for (let i = 0; i < 8; i++) { const an = a + i * Math.PI / 4; R(8 + Math.cos(an) * 6, 2 + Math.sin(an) * 6, 1, 1, '#6a4a2c'); } R(7, 1, 3, 3, '#3a2414'); R(12, 8, 3, 3, '#d8d0c0'); },
      longclock(g, e, t, R) { box(R, 3, -14, 10, 29, '#4a2e1a'); R(4, -12, 8, 8, '#e8e0c8'); R(7, -9, 1, 3, '#1a1a1a'); R(8, -8, 2, 1, '#1a1a1a'); R(5, -2, 6, 12, '#2a1a10'); R(8 + Math.round(Math.sin(t * 3.14) * 2), 2, 1, 6, '#c9a35a'); R(7 + Math.round(Math.sin(t * 3.14) * 2), 7, 3, 2, '#c9a35a'); },
      henhouse(g, e, t, R) {
        R(0, 2, 32, 13, '#4a3a28'); for (let x = 2; x < 31; x += 4) R(x, 3, 1, 11, '#3a2a1a');
        R(-2, -4, 36, 7, '#2a2420'); R(-2, -4, 36, 1, '#4a4038'); R(12, 7, 8, 8, '#0e0a08');
        const b = Math.sin(t * 2.4) > .7 ? 1 : 0; R(14, 9 + b, 4, 3, '#c8a878'); R(17, 8 + b, 2, 1, '#c02020');
      },
      hen(g, e, t, R) { const b = Math.sin(t * 3 + e.px) > .6 ? 1 : 0; R(5, 8 + b, 7, 5, e.col || '#c8a878'); R(10, 6 + b, 3, 3, e.col || '#c8a878'); R(11, 5 + b, 2, 1, '#c02020'); R(13, 7 + b, 2, 1, '#e8b030'); R(4, 7 + b, 2, 3, shade(e.col || '#c8a878', -.25)); R(7, 13, 1, 2, '#c8902a'); R(10, 13, 1, 2, '#c8902a'); },
      woodpile(g, e, t, R) { for (let r = 0; r < 3; r++) for (let i = 0; i < 4; i++) { R(i * 4, 2 + r * 4, 4, 4, '#5a3c22'); R(i * 4 + 1, 3 + r * 4, 2, 2, '#9a7a4a'); } },
      cow(g, e, t, R) {
        const b = Math.sin(t * 1.1) > .8 ? 1 : 0;
        R(4, 2, 22, 9, '#e8e2d8'); R(8, 3, 6, 5, '#2a2420'); R(18, 5, 5, 4, '#2a2420'); R(26, 0 + b, 6, 7, '#e8e2d8'); R(28, 4 + b, 4, 3, '#d8a8a0'); R(27, 1 + b, 1, 1, '#1a1a1a'); R(25, -1 + b, 2, 2, '#c8c0b0');
        R(6, 11, 2, 4, '#c8c0b0'); R(10, 11, 2, 4, '#c8c0b0'); R(19, 11, 2, 4, '#c8c0b0'); R(23, 11, 2, 4, '#c8c0b0'); R(2, 3, 2, 6, '#c8c0b0'); R(14, 11, 3, 2, '#e8b0a8');
      },
      hagstone(g, e, t, R) { box(R, 4, 6, 9, 7, '#7a7a74'); R(7, 8, 3, 3, '#1a2a34'); if (!e.taken) { if (Math.sin(t * 2.2) > .5) { R(3, 5, 1, 1, '#e8f4ff'); R(13, 12, 1, 1, '#e8f4ff'); } } },
      /* 蘑菇圈（3×3 贴地） */
      mring(g, e, t, R) { for (let i = 0; i < 14; i++) { const an = i / 14 * Math.PI * 2, x = 24 + Math.cos(an) * 19, y = 24 + Math.sin(an) * 17; R(x, y + 2, 2, 2, '#d8d0b8'); R(x - 1, y, 4, 2, i % 3 ? '#c8b88a' : '#e8e0c8'); } if (Math.sin(t * 1.5) > .9) R(23, 22, 2, 2, 'rgba(200,255,200,.4)'); },
      /* 孤零零的山楂树 */
      thorn(g, e, t, R) {
        R(7, -6, 3, 21, '#2a2018'); R(4, -2, 4, 2, '#2a2018'); R(10, -8, 5, 2, '#2a2018');
        for (let i = 0; i < 9; i++) { R(-4 + (i * 7) % 24, -22 + ((i * 5) % 14), 8, 5, i % 2 ? '#1c2a1a' : '#24341e'); }
        for (let i = 0; i < 7; i++) R(-2 + (i * 5) % 20, -18 + ((i * 7) % 12), 1, 1, '#a02020');
        R(1, 8, 2, 3, '#e8e0d0'); R(12, 10, 2, 3, '#c8402a');   // 系在枝上的布条
      },
      /* 仙丘：长满草的圆土丘；s.door = 透过石孔看见的门 */
      mound(g, e, t, R) {
        R(-4, 30, 72, 4, 'rgba(0,0,0,.35)');
        for (let y = 0; y < 30; y++) { const hw = Math.sqrt(Math.max(0, 1 - Math.pow((30 - y) / 34, 2))) * 36; R(32 - hw, y, hw * 2, 1, y < 4 ? '#3a5232' : y % 7 === 0 ? '#2a3e26' : '#30482c'); }
        for (let i = 0; i < 12; i++) R(8 + i * 4, 6 + ((i * 7) % 18), 1, 2, '#4a6a3a');
        if (e.door) { const gl = .7 + Math.sin(t * 3) * .15; R(24, 8, 16, 24, '#0a120a'); R(26, 10, 12, 22, `rgba(220,255,200,${gl})`); R(28, 12, 8, 20, '#f4ffe8'); R(23, 6, 18, 2, '#5a4a2a'); R(23, 8, 1, 24, '#5a4a2a'); R(40, 8, 1, 24, '#5a4a2a'); }
      },
      maen(g, e, t, R) { box(R, 4, -14, 8, 29, '#6a6a64'); R(5, -13, 6, 2, '#8a8a82'); R(6, -6, 1, 6, '#4a4a46'); R(9, 2, 2, 4, '#3a5a2a'); },
      throne(g, e, t, R) { box(R, 2, -16, 28, 31, '#2a3a24'); R(4, -14, 24, 22, '#1a2618'); for (let i = 0; i < 8; i++) { R(2 + i * 4, -18, 2, 3, '#f4f2ea'); R(3 + i * 4, -16, 1, 1, '#c02020'); } R(4, 8, 24, 6, '#3a4a2a'); R(0, 13, 32, 2, '#1a2016'); },
      harp(g, e, t, R) { R(3, -8, 2, 22, '#c8a040'); R(3, -8, 10, 2, '#c8a040'); R(11, -8, 2, 6, '#c8a040'); R(5, -2, 8, 2, '#c8a040'); for (let i = 0; i < 4; i++) R(5 + i * 2, -6 + i, 1, 4 + (3 - i) * 2 + 4, Math.sin(t * 12 + i) > .6 ? '#ffffff' : '#c8c8b0'); R(2, 13, 6, 2, '#8a6a2a'); },
      /* 仙灵的长桌：金杯、发光的果子、蜂蜜饼 */
      feast(g, e, t, R) {
        const W2 = e.w * 16; box(R, 0, 2, W2, 12, '#3a2a1a'); R(1, 3, W2 - 2, 3, '#4a3624'); R(2, 14, 2, 2, '#2a1a10'); R(W2 - 4, 14, 2, 2, '#2a1a10');
        for (let i = 0; i < e.w * 2; i++) { const x = 3 + i * 8; if (i % 3 === 0) { R(x, -1, 4, 4, '#d8b040'); R(x + 1, -2, 2, 1, '#f0d060'); } else if (i % 3 === 1) { R(x, 0, 5, 3, '#c8803a'); R(x + 1, 0, 3, 1, '#e8a85a'); } else { const gl = Math.sin(t * 2 + i) > 0; R(x, 0, 3, 3, gl ? '#f0e0a0' : '#d0c080'); R(x + 1, -1, 1, 1, '#5a8a3a'); } }
      },
      /* 仙灵的摇篮（白桦木，挂着干花）；s.picked 被抱走 / s.log 露出木头 / s.reject 被放回去 */
      fcradle(g, e, t, R) {
        R(0, 13, 16, 2, 'rgba(0,0,0,.4)'); box(R, 1, 4, 14, 9, '#d8d4c4'); for (let x = 3; x < 14; x += 3) R(x, 5, 1, 7, '#3a3a34');
        box(R, 9, -1, 6, 8, '#c8c4b0'); R(10, 0, 4, 6, '#1a1a14'); R(2, -8, 1, 10, '#6a5a3a'); R(1, -9, 3, 2, '#d8a8c8');
        if (e.picked) return;
        R(3, 5, 9, 3, '#ece6d6');
        if (e.log) { R(5, 4, 7, 3, '#8a6a44'); R(6, 4, 5, 1, '#a8885a'); R(7, 5, 1, 1, '#3a2a1a'); R(9, 5, 1, 1, '#3a2a1a'); return; }
        R(10, 3, 3, 3, '#f0caa8'); R(10, 4, 1, 1, '#5a3a24'); R(12, 4, 1, 1, '#5a3a24');
        if (e.frost) { R(9, 3, 1, 1, '#f4ffff'); R(13, 5, 1, 1, '#f4ffff'); R(4, 5, 1, 1, '#f4ffff'); R(8, 6, 1, 1, '#e8f8ff'); }
        if (e.breath && Math.sin(t * 2.2) > .2) { R(8, 2, 2, 1, 'rgba(240,248,255,.55)'); R(7, 1, 1, 1, 'rgba(240,248,255,.35)'); }
      },
      slab(g, e, t, R) { box(R, 1, 6, 14, 9, '#5a5a52'); for (let i = 0; i < 4; i++) R(3, 8 + i * 2, 8 + (i % 2) * 2, 1, '#3a3a34'); R(2, 6, 4, 2, '#3a5a2a'); },
      shroom(g, e, t, R) { const gl = .6 + Math.sin(t * 2 + e.px) * .2; for (let i = 0; i < 3; i++) { const x = 2 + i * 5, h = 4 + (i % 2) * 3; R(x + 1, 14 - h, 1, h, '#c8d8c8'); R(x - 1, 13 - h, 5, 2, `rgba(140,230,200,${gl})`); } },
      roots(g, e, t, R) { for (let i = 0; i < 5; i++) { const x = 1 + i * 3, l = 6 + ((i * 5) % 7) + Math.round(Math.sin(t * .8 + i) * 1); R(x, 0, 1, l, '#3a2a1a'); R(x, l, 1, 1, '#5a4a2a'); } },
      wspot(g, e, t, R) { for (let i = 0; i < 5; i++) { const y = 1 + i * 3; R(13, y + 1, 1, 2, '#d8d8c8'); R(12, y, 3, 1, i % 2 ? '#e8e8d8' : '#c8d8c8'); } },
      rstone(g, e, t, R) { R(1, 12, 14, 3, 'rgba(0,0,0,.4)'); box(R, 4, -4, 8, 17, '#5a6a5e'); R(5, -3, 6, 2, '#7a8a7e'); const gl = .5 + Math.sin(t * 4 + e.px) * .3; R(6, 2, 4, 2, `rgba(160,255,210,${gl})`); for (let i = 0; i < 6; i++) { const an = t * 1.5 + i; R(8 + Math.cos(an) * 9, 6 + Math.sin(an) * 5, 1, 1, '#c8ffe8'); } }
    },
    maps: {
      /* ---------------- 琼斯家的石头农舍 ---------------- */
      cottage: {
        amb: 'fire', dark: .55, plr: 3, wall: 'stone', floor: 'stone',
        wallC: { face: '#8a857a', top: '#16140f' },
        rows: [
          '##################',
          '##################',
          '#kkkkkkkkkkkkkkkk#',
          '#kkkkkkkkkkkkkkkk#',
          '#kkkkkkkkkkkkkkkk#',
          '#kkkkkkkkkkkkkkkk#',
          '#kkkkkkkkkkkkkkkk#',
          '#kkkkkkkkkkkkkkkk#',
          '#kkkkkkkkkkkkkkkk#',
          '#kkkkkkkkkkkkkkkk#',
          '#########kk#######'],
        ents: [
          { id: 'cexitL', x: 9, y: 10, spr: 'invisible', touch: S => leaveCottage(S) },
          { id: 'cexitR', x: 10, y: 10, spr: 'invisible', touch: S => leaveCottage(S) },
          { id: 'hearth', x: 3, y: 1, w: 2, spr: 'hearth', light: { r: 4.8, col: 'rgba(255,140,60,.24)', flick: true, dy: 12 }, on: S => hearthOn(S) },
          { id: 'cradle', x: 5, y: 4, spr: 'cradle', s: { iron: true }, on: S => cradleOn(S) },
          { id: 'nainchair', x: 2, y: 3, spr: 'chair', col: '#4a2e1a' },
          { id: 'nain', x: 2, y: 3, oy: -3, spr: '@nain', dir: 2, on: S => nainOn(S) },
          { id: 'chg', x: 6, y: 5, spr: '@chg', dir: 0, hidden: true, on: S => chgOn(S) },
          { id: 'ctable', x: 9, y: 5, w: 2, spr: 'table2', col: '#5a3e28', on: S => S.narr('擦得发白的松木桌。桌上一块黑面包，用布盖着，旁边是爸爸的空碗。\n这只碗，要等过了圣诞才有人用。') },
          { id: 'bible', x: 9, y: 5, spr: 'book', col: '#2a1a14', on: async S => { if (S.once('bibleR')) await S.narr('桌上摊着家里那本大《圣经》。妈妈有空就翻开，在扉页上记几笔。'); await S.note('bible'); S.f.readBible = true; } },
          { id: 'letter', x: 10, y: 5, spr: 'paper', on: async S => { await S.note('letter'); if (S.once('letterT')) await S.think('……孩子在门外过了一夜。\n奶奶说她见过的那户人家，会不会就是……'); } },
          { id: 'bench', x: 9, y: 6, w: 2, spr: 'bench', col: '#5a3e28' },
          { id: 'dresser', x: 12, y: 2, spr: 'wdresser', on: S => S.narr('妈妈的嫁妆碗柜。一排排蓝边、红边的盘子立着，是礼拜天才舍得用的。\n最上一格摆着一只铜光的小罐，爸爸说那是外公从集上换来的。') },
          { id: 'boxbed', x: 15, y: 2, h: 2, spr: 'boxbed', on: S => bedOn(S) },
          { id: 'shawlchair', x: 14, y: 4, spr: 'shawlchair', on: S => shawlOn(S) },
          { id: 'chest', x: 1, y: 7, spr: 'chest', on: S => chestOn(S) },
          { id: 'wheel', x: 16, y: 7, spr: 'wheel', on: S => S.narr('奶奶的纺车。轮子上还缠着半截没纺完的羊毛。\n这三天，谁也没心思纺线。') },
          { id: 'clock', x: 1, y: 2, spr: 'longclock', on: S => S.narr(S.f.ph === 'dawn' ? '长钟敲了六下。天亮了。' : '靠墙的长钟，滴答，滴答。\n指针停在十一点上，好像走得比平时慢。') },
          { id: 'cwin1', x: 7, y: 1, spr: 'window', on: S => S.narr(S.f.ph === 'dawn' ? '窗外，山顶上的天发白了。' : '窗外黑得什么也看不见。\n风从山上下来，吹得窗框咯吱咯吱响，像有人在外头一下一下地推。') },
          { id: 'cwin2', x: 10, y: 1, spr: 'window', on: S => S.narr('窗台上摆着一排干了的花楸果，红得发黑。\n奶奶说，花楸挡得住「那些人」。……看来是没挡住。') },
          { id: 'basket', x: 7, y: 8, spr: 'basket', on: S => S.narr('一筐泥炭块，烧起来有股烟熏的土味。\n奶奶说，今夜炉火一夜都不能熄。') }
        ],
        async enter(S, first) {
          if (first) return cottageFirst(S);
          if (S.f.ph === 'gather' && hasAll(S) && S.once('backAll')) { await S.think('鸡蛋、井水、麦芽都齐了。'); goalGather(S); }
        }
      },
      /* ---------------- 院子与山坡 ---------------- */
      yard: {
        amb: 'wind', dark: .8, plr: 3.2, wall: 'stone', floor: 'dirt', fog: .18,
        wallC: { face: '#6a665c', top: '#121210' },
        tileOpts: { grassC: '#22321e', treeC: '#14201a', fenceBase: 'dirt' },
        rows: [
          '##########PPPPPP~PPPPPPPPPPPPPPPPP',
          '##########P"""""~"""""""""""""PPPP',
          'hddddddddddddf""~""""""""""""""""P',
          'hddddddddddddf""~""""""""""""""""P',
          'hddddddddddddf""~"""""""""""d""""P',
          'hddddddddddddf""~"""""""""""d""""P',
          'hddddddddddddf""~"""""""""""d""""P',
          'hdddddddddddddddoddddddddddddd"""P',
          'hddddddddddddf""~""""""""""""""""P',
          'hddddddddddddf""~"""""""""K""""""P',
          'hddddddddddddf""~""""""""""""""PPP',
          'hddddddddddddf""~"""""""""""""PPPP',
          'hddddddddddddf""~""""""K"""""PPPPP',
          'hddddddddddddf""~""""""""""PPPPPPP',
          'hddddddddddddf""~""""""""PPPPPPPPP',
          'hffffffffffffff"~PPPPPPPPPPPPPPPPP'],
        ents: [
          { id: 'ydoor', x: 4, y: 1, spr: 'door', col: '#3a2a1a', on: S => { S.sfx('open'); return go2(S, 'cottage', 9, 9, 3); } },
          { id: 'ywin1', x: 2, y: 1, spr: 'window', lit: true, light: { r: 2.2, col: 'rgba(255,170,90,.16)', dy: 14 }, on: S => S.narr('窗里透出炉火的光。\n奶奶的影子映在窗玻璃上，一动不动，在等你。') },
          { id: 'ywin2', x: 7, y: 1, spr: 'window', lit: true, light: { r: 2.2, col: 'rgba(255,170,90,.16)', dy: 14 }, on: S => S.narr('窗台下的墙缝里，塞着一把干了的花楸枝。') },
          { id: 'ylamp', x: 6, y: 2, spr: 'lantern', light: { r: 3, col: 'rgba(255,170,80,.2)', flick: true }, on: S => S.narr('门边挂着一盏马灯。爸爸走之前换的新灯芯，火苗稳稳的。\n灯光照得到的地方，就这么一小圈。') },
          { id: 'hens', x: 1, y: 3, w: 2, spr: 'henhouse', on: S => hensOn(S) },
          { id: 'hen1', x: 4, y: 5, spr: 'hen', on: S => S.narr('一只褐色的母鸡缩着脖子，咕咕地抱怨。\n这么晚了，谁还不睡觉。') },
          { id: 'hen2', x: 2, y: 6, spr: 'hen', col: '#e8e4d8', on: S => S.narr('白母鸡歪着脑袋，用一只眼睛看你。\n它突然扭过头，朝山那边「咯」了一声。') },
          { id: 'wood', x: 8, y: 2, spr: 'woodpile', on: S => S.narr('码得整整齐齐的泥炭和劈柴。爸爸走之前码的，够烧一整个冬天。') },
          { id: 'malt', x: 11, y: 3, spr: 'sack', on: S => maltOn(S) },
          { id: 'ybarrel', x: 12, y: 3, spr: 'barrel', on: S => S.narr('酿麦酒的木桶，空的。敲一敲，「咚」——回声在桶里转了好一会儿。') },
          { id: 'well', x: 5, y: 9, spr: 'well', on: S => wellOn(S) },
          { id: 'cow', x: 8, y: 11, w: 2, spr: 'cow', on: S => cowOn(S) },
          { id: 'cart', x: 3, y: 12, spr: 'cart', on: S => S.narr('运泥炭的小车。车辕上挂着一块马蹄铁，开口朝上，说是能兜住好运。') },
          { id: 'hag', x: 16, y: 11, spr: 'hagstone', solid: true, on: S => hagOn(S) },
          { id: 'mring', x: 19, y: 10, w: 3, h: 3, spr: 'mring', decal: true, solid: false, touch: S => ringTouch(S) },
          { id: 'thorn', x: 23, y: 2, spr: 'thorn', on: S => S.narr(S.f.ph === 'dawn' ? '山楂树上的布条，在晨风里轻轻地飘。' : '山坡上孤零零的一棵山楂树，枝子上系着一条条褪色的布条。\n奶奶说，这种树砍不得。谁砍了，谁家就要倒霉。') },
          { id: 'mound', x: 27, y: 2, w: 4, h: 2, spr: 'mound', on: S => moundOn(S) },
          { id: 'maen', x: 31, y: 8, spr: 'maen', on: S => S.narr('一块比人还高的立石，不知道立在这里多少年了。\n石头背阴的一面摸上去，是温的。') },
          { id: 'ybrook', x: 16, y: 4, spr: 'invisible', solid: true, on: S => S.narr('溪水从山上下来，又急又冷，哗哗地响。\n水底的石头被冲得圆圆的，月光都没有，它们自己却亮着一点灰白。') }
        ],
        async enter(S, first) {
          if (S.f.ph === 'dawn') return;
          if (first) {
            await S.narr('门一开，冷风就扑进怀里。\n云压得很低，看不见一颗星星。溪水对岸，山坡上那团黑黢黢的圆影子，是仙丘。');
            if (S.f.ph === 'gather') { await S.think('鸡窝在西墙根，井在院子当中，麦芽袋子靠着东边的篱笆。'); goalGather(S); }
          }
        },
        step(S, x, y) {
          if (S.f.ph === 'deal' && x === 16 && y === 7 && S.once('crossBrook')) return S.say('小老头', ['（他踩着你的脚印过溪，嘴里嘟嘟囔囔）', '流水……流水最讨厌。我们这些老东西，过一回流水，掉一层皮。'], { style: 'whisper' });
        }
      },
      /* ---------------- 仙丘之内 ---------------- */
      hall: {
        amb: 'otherworld', dark: .58, plr: 3, wall: 'mud', floor: 'dirt',
        wallC: { face: '#3a3a2a', top: '#0e100a' },
        tileOpts: { grassC: '#2a4a32' },
        rows: [
          '######################',
          '######################',
          '#dddd""ddddddddd""ddd#',
          '#ddddddddddddddddddd"#',
          '#"ddddddddddddddddddd#',
          '#ddddddddddddddddddd"#',
          '#ddddddddd""ddddddddd#',
          '#dddddddddddddddddddd#',
          '#""ddddddddddddddddd"#',
          '#dddddddddddddddddddd#',
          '#dddddddddddddddddddd#',
          '#d"dddddddddddddddd""#',
          '#dddddddddddddddddddd#',
          '##########dd##########'],
        ents: [
          { id: 'hexitL', x: 10, y: 13, spr: 'invisible', touch: S => hallExit(S) },
          { id: 'hexitR', x: 11, y: 13, spr: 'invisible', touch: S => hallExit(S) },
          { id: 'throne', x: 10, y: 2, w: 2, spr: 'throne', on: S => S.narr('山楂木的宝座，扶手上开着白花，又结着红果——花和果，在同一根枝子上。') },
          { id: 'lady', x: 10, y: 3, spr: '@lady', dir: 0, light: { r: 3.4, col: 'rgba(200,255,220,.14)' }, on: S => ladyOn(S) },
          { id: 'harp', x: 15, y: 3, spr: 'harp', on: S => S.narr('金色的竖琴。琴弦没人碰，自己在一根一根地响。') },
          { id: 'harper', x: 14, y: 3, spr: '@harper', dir: 2, on: S => S.say('弹琴的老人', cycle(S, '_hp', ['（他闭着眼睛，手指在空中拨着，琴弦就跟着响）\n……人间的姑娘，喜欢这支曲子吗？听上一百年，也不会腻。', '曲子还长着呢，还长着呢。', '你们那边，有一支摇篮曲，我年轻的时候偷听过。……调子记不全了。'])) },
          { id: 'feast', x: 3, y: 6, w: 5, spr: 'feast', on: S => feastOn(S) },
          { id: 'g1', x: 3, y: 5, spr: '@folk1', dir: 0, on: S => S.say('山里的人', cycle(S, '_g1', ['尝尝蜂蜜饼吧？是石楠花的蜜，甜到心里去。', '你身上有股烟火味。真好闻。再走近一点……', '别怕呀。我们这里，没有人会饿。'])) },
          { id: 'g2', x: 6, y: 5, spr: '@folk2', dir: 0, on: S => S.say('山里的人', cycle(S, '_g2', ['（他咯咯地笑）她不吃！她不吃！她是带着铁来的！', '去年来过一个拾柴的，吃了一颗果子，现在还在后头跳舞呢。', '鸡一叫，门就关。门一关……嘻嘻。'])) },
          { id: 'g3', x: 5, y: 7, spr: '@folk3', dir: 3, on: S => S.say('山里的人', cycle(S, '_g3', ['我们的老人家回来啦？夫人会高兴的。……也许。', '那个老东西，在你们家吃胖了没有？', '你的名字一定很好听。告诉我好不好？就告诉我一个人。'])) },
          { id: 'cr1', x: 12, y: 9, spr: 'fcradle', s: { frost: true }, on: S => cradleF(S, 0) },
          { id: 'cr2', x: 14, y: 9, spr: 'fcradle', s: { breath: true }, on: S => cradleF(S, 1) },
          { id: 'cr3', x: 16, y: 9, spr: 'fcradle', on: S => cradleF(S, 2) },
          { id: 'cr4', x: 18, y: 9, spr: 'fcradle', s: { breath: true }, on: S => cradleF(S, 3) },
          { id: 'cr5', x: 20, y: 9, spr: 'fcradle', s: { breath: true }, on: S => cradleF(S, 4) },
          { id: 'carve', x: 2, y: 11, spr: 'slab', on: async S => { await S.note('midwife'); S.f.readMid = true; if (S.once('midT')) await S.think('……人的孩子会呼白气。\n石孔只看得穿假东西。'); } },
          { id: 'sh1', x: 1, y: 4, spr: 'shroom', solid: false, light: { r: 2.2, col: 'rgba(120,230,190,.14)' } },
          { id: 'sh2', x: 20, y: 5, spr: 'shroom', solid: false, light: { r: 2.2, col: 'rgba(120,230,190,.14)' } },
          { id: 'sh3', x: 9, y: 11, spr: 'shroom', solid: false, light: { r: 2, col: 'rgba(120,230,190,.12)' } },
          { id: 'sh4', x: 16, y: 11, spr: 'shroom', solid: false, light: { r: 2.4, col: 'rgba(120,230,190,.14)' } },
          { id: 'sh5', x: 1, y: 9, spr: 'shroom', solid: false, light: { r: 2, col: 'rgba(120,230,190,.12)' } },
          { id: 'rt1', x: 4, y: 1, spr: 'roots', solid: false },
          { id: 'rt2', x: 8, y: 1, spr: 'roots', solid: false },
          { id: 'rt3', x: 13, y: 1, spr: 'roots', solid: false },
          { id: 'rt4', x: 18, y: 1, spr: 'roots', solid: false },
          { id: 'hwall', x: 6, y: 1, spr: 'invisible', solid: true, on: S => S.narr('土墙里盘着粗粗细细的树根。\n凑近了听，根须里有水流的声音——你们家的井，也许就是从这里打通的。') }
        ],
        async enter(S, first) { if (first) return hallIntro(S); },
        step(S, x, y) {
          if (S.f.ph === 'hall' && x <= 9 && y >= 4 && y <= 8 && !S.f.offered) return offerFood(S);
        }
      },
      /* ---------------- 回去的土廊 ---------------- */
      tunnel: {
        amb: 'otherworld', dark: .72, plr: 2.6, wall: 'mud', floor: 'dirt', speed: 1,
        wallC: { face: '#3a3628', top: '#0c0c08' },
        rows: [
          '####################################',
          '####################################',
          '####################################',
          '######ddd######ddd#######ddd########',
          '#ddddddddddddddddddddddddddddddddddd',
          '######ddd######ddd#######ddd########',
          '####################################',
          '####################################'],
        ents: [
          { id: 'texit', x: 35, y: 4, spr: 'invisible', touch: S => escaped(S) },
          { id: 'rs1', x: 7, y: 4, spr: 'rstone', light: { r: 2.2, col: 'rgba(140,255,200,.16)' }, on: S => S.narr('环中间一块发光的石头。跳舞的人，就是绕着它转的。') },
          { id: 'rs2', x: 16, y: 4, spr: 'rstone', light: { r: 2.2, col: 'rgba(140,255,200,.16)' }, on: S => S.narr('第二块发光的石头。舞步在这里换了方向。') },
          { id: 'rs3', x: 26, y: 4, spr: 'rstone', light: { r: 2.2, col: 'rgba(140,255,200,.16)' }, on: S => S.narr('最后一块发光的石头。他们转得更快了。') },
          { id: 'ws1', x: 5, y: 4, spr: 'wspot', decal: true, solid: false },
          { id: 'ws2', x: 14, y: 4, spr: 'wspot', decal: true, solid: false },
          { id: 'ws3', x: 24, y: 4, spr: 'wspot', decal: true, solid: false },
          { id: 'tr1', x: 3, y: 3, spr: 'roots', solid: false },
          { id: 'tr2', x: 11, y: 3, spr: 'roots', solid: false },
          { id: 'tr3', x: 21, y: 3, spr: 'roots', solid: false },
          { id: 'tr4', x: 31, y: 3, spr: 'roots', solid: false },
          ...DANCERS.map(d => ({ id: d.id, x: RING(d.cx)[d.i][0], y: RING(d.cx)[d.i][1], spr: '@dancer', solid: false, light: { r: 1.4, col: 'rgba(200,255,230,.12)' }, s: { i: d.i } }))
        ],
        async enter(S, first) { if (first) return tunnelIntro(S); }
      }
    }
  });

  /* ================= 第一幕：农舍 ================= */
  function hasAll(S) { return S.has('eggs') && S.has('water') && S.has('malt'); }
  function goalGather(S) {
    const need = [];
    if (!S.has('eggs')) need.push('鸡蛋');
    if (!S.has('water')) need.push('井水');
    if (!S.has('malt')) need.push('麦芽');
    if (need.length) S.goal('去院子里找：' + need.join('、'));
    else if (!S.ent('cradle').s.turned) S.goal('把摇篮转过来对着炉子，再到炉前「酿」蛋壳酒');
    else if ((S.f.kpMiss || 0) >= 4) S.goal('到炉前：敲蛋 → 摆壳 → 倒水 → 撒麦 → 开口');
    else if (S.f.kpMiss === 3) S.goal('到炉前：先敲蛋、再摆壳；后面三样照歌本排');
    else S.goal('到炉前，照歌本的顺序「酿」蛋壳酒（两人时：一人念歌本，一人操作）');
  }
  async function cottageFirst(S) {
    S.f.ph = 'talk';
    hum(S, .7);
    await S.narr('炉边，奶奶在哼那支老摇篮曲。哼到一半，停了。');
    await S.narr('炉火噼啪地响。泥炭烟混着奶腥味，屋里暖得发闷。\n摇篮就摆在炉边，一下，一下，自己轻轻地晃。');
    await S.think('……又是这样。没人碰它，它自己在晃。');
    S.goal('和炉边的奶奶说说话');
  }
  async function nainOn(S) {
    S.face('nain', 'pl');
    const ph = S.f.ph;
    if (ph === 'talk') {
      await S.narr('奶奶坐在炉边的椅子上，手里的毛线针停了好久了。');
      await S.say('奶奶', ['格温，你也看出来了，对不对。', '三天了。他不哭，也不笑。一顿喝下三个人的奶，喝完了，就直勾勾地盯着房梁。', '你看他那张脸——皱得像个小老头。']);
      await S.say('奶奶', ['你妈妈守了他三夜，烧得说胡话。你爸爸在南边的煤矿，要过了圣诞才回得来。', '老辈人说，这是让「母亲的祝福」换走了。', '……就是山里那些人。不能直呼他们，只能说好听的。']);
      S.f.ph = 'talk2';
      S.goal('再和奶奶说说话');
      return;
    }
    if (ph === 'talk2') {
      await S.say('格温', '那……我们怎么办？');
      await S.say('奶奶', ['山那边有人说，把它放到火铲上往炉子里伸，或者扔进河里，换孩子的就会来抢回去。', '那都是害人的话。', '我年轻的时候，见过一户人家照着做了。……被放到门外冻了一夜的，是他们自己的孩子，只是病了。']);
      await S.say('奶奶', ['我们不做那种事。不管摇篮里躺着的是谁，都不许伤他一根头发。', '有个老法子，不伤人。我外婆教的：让它看一桩它活了几百年也没见过的稀奇事，它一吃惊，就会开口。', '歌本在我的箱子里，抄在最后一页。去拿来吧。']);
      S.f.ph = 'song';
      S.goal('去奶奶的箱子里找歌本（屋子西南角）');
      S.cp();
      return;
    }
    if (ph === 'song') return S.say('奶奶', '箱子在墙角，歌本压在我的嫁衣底下。最后一页。');
    if (ph === 'gather') {
      bump(S, '_nh');
      if (hasAll(S) && !S.ent('cradle').s.turned) return S.say('奶奶', ['东西齐了？好孩子。', '把摇篮转过来，让它对着炉子。它得看得见，才会吃惊。']);
      if (hasAll(S)) return ritualHint(S, true);
      return S.say('奶奶', cycle(S, '_ng', ['鸡窝在院子西墙根，井在院子当中，麦芽在东边篱笆底下的麻袋里。', '外头冷，把披肩裹紧。……不，别拿你妈妈那条，那条留着。', '我守着它。你去吧，它不敢在我眼皮底下怎么样。']));
    }
    if (ph === 'deal') {
      if (!S.f.nainCare && S.once('nainCare')) { S.f.nainCare = true; return S.say('奶奶', ['他嘴上不饶人，到底是个老人家。', '夜里山上冷，你妈妈那条红披肩……给他裹上吧。牛棚里的牛，也还有奶。']); }
      return S.say('奶奶', cycle(S, '_nd', ['铁剪子揣好了？别拿出来。', '他们的东西，一口都别吃。', '鸡叫之前回来。奶奶在这儿守着炉子，等你们。']));
    }
    if (ph === 'reveal') return S.say('奶奶', '问问他。……问问他伊万在哪儿。');
    if (ph === 'dawn') return S.say('奶奶', '……回来了，回来了。');
    return S.say('奶奶', '……');
  }
  async function chestOn(S) {
    const c = S.ent('chest');
    if (S.f.ph === 'talk' || S.f.ph === 'talk2') return S.narr('奶奶的樟木箱子。上头搁着一只针线筐。\n……先听奶奶把话说完。');
    c.s.open = true; S.sfx('open');
    if (S.once('chestOpen')) await S.narr('箱子里一股樟脑味。奶奶的嫁衣叠得方方正正，底下压着一本磨毛了边的歌本。');
    await S.note('songbook');
    if (S.f.ph === 'song') {
      S.f.ph = 'gather';
      await S.think(['鸡蛋——鸡窝里有。井水，麦芽……都在院子里。', '还有，它得看得见。摇篮现在朝着墙呢。']);
      goalGather(S);
      S.cp();
    }
  }
  async function cradleOn(S) {
    const c = S.ent('cradle'), ph = S.f.ph;
    if (c.s.ifan) return S.narr('伊万睡着了。小拳头攥得紧紧的，嘴边一缕小小的白气，一下，一下。');
    if (c.s.empty) return S.narr('空摇篮。被褥上还留着一个小小的、凉冰冰的凹印。');
    if (S.once('cradleFirst')) {
      await S.narr('摇篮里躺着「伊万」。圆圆的襁褓，稀稀的黄头发，左边眉梢一颗小痣——什么都一样。\n可那张脸，皱得像晒干的苹果。');
      await S.narr('它闭着眼睛。\n你一转过身，后脑勺就像被什么东西盯着。');
      if (ph === 'talk' || ph === 'talk2') return;
    }
    if (ph === 'gather' && !c.s.turned) {
      const r = await S.ask('摇篮朝着墙。', ['把摇篮转过来，对着炉子', '（先不动它）']);
      if (r) return;
      c.s.turned = true; S.sfx('thud');
      await S.narr('你把摇篮转了个向。篷子底下的那张小脸，正对着炉火。\n它的眼皮，跳了一下。');
      goalGather(S);
      return;
    }
    return S.narr(cycle(S, '_cr', ['它闭着眼睛，嘴角好像往上翘了一下。', '摇篮上头挂着奶奶那把张着口的铁剪子。它睡觉的时候，总是把脸扭开，躲着那把剪子。', '你把手伸过去，摸到它的小手。\n凉的。像摸到一块河底的石头。']));
  }
  async function bedOn(S) {
    const b = S.ent('boxbed');
    if (b.s.awake) return S.say('妈妈', '格温……过来，让妈妈看看你。');
    if (S.f.ph === 'deal' && S.once('bedDeal')) {
      hum(S, .45);
      await S.narr('妈妈闭着眼睛，嘴唇一动一动，在梦里哼着那支老歌。');
      await S.say('妈妈（梦话）', ['……格温？是格温吗……', '你去……把他抱回来。妈妈给你们哼歌……'], { style: 'whisper' });
      return;
    }
    if (S.once('bedFirst')) {
      await S.narr('妈妈睡在箱床里，额头上搭着湿布，烧得两颊通红。');
      await S.say('妈妈（梦话）', ['……不是他……摇篮是凉的……', '伊万……妈妈在这儿……'], { style: 'whisper' });
      return;
    }
    return S.narr(cycle(S, '_bd', ['妈妈的呼吸又浅又急。湿布已经被她焐热了。', '她的手从被子里伸出来，在空中抓了一下，像要抱住什么。']));
  }
  async function shawlOn(S) {
    const c = S.ent('shawlchair');
    if (c.s.taken) return S.narr('一把空椅子。椅背上还留着披肩的一点暖气。');
    if (S.f.ph !== 'deal') return S.narr('妈妈的红披肩搭在椅背上。红毛呢，是妈妈结婚那年自己织的。\n她生伊万那天，就裹着它。');
    const r = await S.ask('妈妈的红披肩。……山上冷。', ['拿上披肩', '（还是留给妈妈）']);
    if (r) return;
    c.s.taken = true; S.give('shawl');
  }
  async function leaveCottage(S) {
    const ph = S.f.ph, p = S.pl;
    const back = () => { if (p.prev && (p.prev[0] !== p.x || p.prev[1] !== p.y)) S.pos(p.prev[0], p.prev[1], 3); };
    if (ph === 'talk' || ph === 'talk2' || ph === 'song') { back(); return S.think(ph === 'song' ? '奶奶让我去箱子里拿歌本。' : '……先和奶奶说说话。'); }
    if (ph === 'reveal') { back(); return S.think('（先听听小老头怎么说。）'); }
    if (ph === 'deal' && !S.has('iron')) await giveIron(S);
    if (ph === 'dawn') { back(); return; }
    S.sfx('open');
    await go2(S, 'yard', 4, 2, 0);
  }

  /* ---------- 院子里收集 ---------- */
  async function hensOn(S) {
    if (S.f.ph !== 'gather' || S.has('eggs') || S.f.usedEggs) return S.narr('鸡窝里的母鸡挤成一团，咕咕咕地，谁也不肯先睡。');
    S.give('eggs'); S.sfx('item');
    await S.narr(S.f.kpMiss ? '母鸡们气得直扑翅膀。你在草窝最里头，又摸出一窝蛋来。' : '你把手伸进鸡窝。母鸡们炸了毛，咕咕乱叫。\n草窝里一个一个摸出来，热乎乎的，一共十二个。');
    await gotItem(S);
  }
  async function wellOn(S) {
    if (S.f.ph !== 'gather' || S.has('water') || S.f.usedEggs) return S.narr('井口黑洞洞的。往下喊一声，回声隔了好久才上来——好像底下比井绳长得多。');
    S.sfx('water'); S.give('water');
    await S.narr('辘轳吱呀吱呀地转。打上来的井水冰得扎手，水面上浮着一片山楂叶子。');
    await gotItem(S);
  }
  async function maltOn(S) {
    if (S.f.ph !== 'gather' || S.has('malt') || S.f.usedEggs) return S.narr('一麻袋麦芽，袋口用草绳扎着。闻着有股甜甜的焦香。');
    S.give('malt');
    await S.narr('你解开草绳，抓了一大把麦芽揣进围裙兜里。');
    await gotItem(S);
  }
  /* 收集到第二样时：回头看见农舍窗玻璃上贴着一张皱巴巴的小脸 */
  async function gotItem(S) {
    const n = ['eggs', 'water', 'malt'].filter(i => S.has(i)).length;
    if (n === 2 && S.map === 'yard' && S.once('winFace')) {
      const w = S.ent('ywin1'); w.lit = false; w.face = true;
      S.focus(2, 2); S.sfx('sting');
      await S.narr('你下意识地回头看了一眼农舍——\n窗玻璃上，贴着一张皱巴巴的小脸。它在看你。');
      w.face = false; w.lit = true; S.focus(null);
      await S.narr('再一眨眼，窗里只有炉火，和奶奶一动不动的影子。');
      await S.think('……它不是该躺在摇篮里吗？');
    }
    goalGather(S);
  }
  async function cowOn(S) {
    if (S.f.ph !== 'deal') return S.narr('黑白花的老母牛卧在草堆上，慢慢地嚼着。\n它朝山坡那边看了一眼，鼻孔里喷出两道白气。');
    if (S.has('milk') || S.f.fed) return S.narr('老母牛舔了舔你的手。');
    const r = await S.ask('老母牛的奶胀着。小老头说，他好几天没喝过一口热的了。', ['挤一杯热奶', '（不管他）']);
    if (r) return;
    S.give('milk'); S.sfx('water');
    await S.narr('你蹲在牛肚子底下，挤了满满一杯。热奶冒着白气，在冷风里闻着格外香。');
  }
  async function hagOn(S) {
    const h = S.ent('hag');
    if (h.s.taken) return S.narr('溪水哗哗地冲着空出来的那块地方。');
    if (S.f.ph !== 'deal') return S.narr('溪水里有一块石头，在黑地里亮了一下。\n……这么冷的天，还是别下水了。');
    h.s.taken = true; S.give('hag'); S.sfx('splash');
    await S.narr('你挽起袖子，把手伸进冰冷的溪水，摸出那块石头。\n灰扑扑的，正中间天生一个圆孔，刚好能套进一根手指。');
    S.goal('去山坡上的仙丘，透过石孔看一看');
    await S.say('小老头', '就是它。透过孔去看那座山丘——别的东西都别看，看了也不舒服。', { style: 'whisper' });
  }
  async function ringTouch(S) {
    if (!S.once('ringT')) return;
    await S.narr('脚下的草里冒出一圈白蘑菇，圆得像有人拿绳子量过。');
    await S.think('奶奶说过，夜里看见蘑菇圈，千万别站进去——进去了，就会跟着跳一百年的舞。');
    const p = S.pl; if (p.prev && (p.prev[0] !== p.x || p.prev[1] !== p.y)) S.pos(p.prev[0], p.prev[1]);
  }
  async function moundOn(S) {
    const m = S.ent('mound'), ph = S.f.ph;
    if (ph === 'dawn') return S.narr('仙丘上的草沾着露水，什么门也没有。');
    if (ph !== 'deal') return S.narr('一座圆圆的小土丘，草长得比别处都绿。\n奶奶不许你靠近这里。她管它叫「他们的地方」。');
    if (!S.has('hag')) return S.say('小老头', '你看不见门的。去溪里找那块带孔的石头。', { style: 'whisper' });
    if (!m.s.door) {
      await S.narr('你举起石头，闭上一只眼，从小孔里看过去——');
      S.sfx('chime'); S.fx('flash'); m.s.door = true;
      await S.narr('土丘的正面，开着一扇门。\n门缝里漏出淡绿色的光，还有竖琴声、笑声，和杯子碰在一起的声音。');
      await S.say('小老头', ['（他在你身后，把嗓子压得低低的）', '记住我说的：一口都别吃，名字别说，铁别拿出来。鸡叫之前出来。', '……还有，进去以后，我就不是你这边的人了。'], { style: 'whisper' });
    }
    const r = await S.ask(S.f.fed || S.f.wrapped ? '门里的光，暖洋洋的。' : '门里的光，暖洋洋的。（小老头裹着单薄的婴儿袍，冻得直哆嗦）', ['走进去', '（再等等）']);
    if (r) return;
    S.goal('在仙丘里换回伊万');
    S.cp('hall');
    await go2(S, 'hall', 10, 12, 3);
  }

  /* ---------- 小老头 ---------- */
  async function chgOn(S) {
    const ph = S.f.ph;
    S.face('chg', 'pl');
    if (ph === 'deal') {
      if (S.has('milk')) {
        S.take('milk'); S.f.fed = true; S.sfx('water');
        await S.narr('你把热奶递给他。他两只手捧着杯子，咕咚咕咚喝了个精光，打了个响亮的嗝。');
        await S.say('小老头', '……三百年了。上一回有人给我热奶喝，还是在你外婆的外婆那会儿。');
        return;
      }
      if (S.has('shawl')) {
        S.take('shawl'); S.f.wrapped = true; S.ent('chg').spr = '@chgw'; S.sfx('paper');
        await S.narr('你把红披肩裹在他肩上，打了个结。他愣了一下，低下头，用鼻子去闻那块红毛呢。');
        await S.say('小老头', '……有炉火的味道。');
        return;
      }
      return S.say('小老头', cycle(S, '_cd', [!S.has('hag') ? '溪里那块带孔的石头，去捡来。没有它，你连门都找不着。' : '山丘就在坡顶上。走吧，走吧，鸡可不等人。', '冷……这身婴儿袍子，薄得跟纸一样。', '你奶奶是个好人。好几天了，她夜里都给我盖被子，明知道我不是。']));
    }
    if (ph === 'reveal') return dealTalk(S);
    if (ph === 'hall') return hallHint(S);
    return S.say('小老头', '……');
  }

  /* ---------- 蛋壳酒 ---------- */
  async function hearthOn(S) {
    const ph = S.f.ph, c = S.ent('cradle');
    if (ph === 'reveal' || ph === 'deal') return S.narr('炉石上那排蛋壳还冒着细细的热气，麦芽在水面上打着转。\n——一桩活了几百年也没见过的稀奇事。');
    if (ph !== 'gather') return S.narr(ph === 'dawn' ? '炉火烧了一整夜，还红着。炉石上那排蛋壳，被奶奶收走了。' : '炉火烧得正旺。吊锅里温着一锅燕麦粥。\n今夜是冬天的头一夜，炉火不能熄。');
    if (!hasAll(S)) { await S.think('歌本上说要鸡蛋、井水、麦芽……还缺东西。'); goalGather(S); return; }
    if (!c.s.turned) { await S.think('摇篮朝着墙——它看不见炉子。\n得先把摇篮转过来。'); goalGather(S); return; }
    const tip = S.coop ? '\n（键盘 1–5；另一位可以打开「笺」念歌本最后一页）' : '\n（键盘 1–5 也能按；歌本可以在「笺」里重看）';
    const v = await S.keypad('照歌本上的法子，在它眼前「酿」一回蛋壳酒——\n按顺序做五件事' + tip, ['倒水', '开口', '敲蛋', '撒麦', '摆壳'], 5, KP);
    if (v == null) return;
    if (v === RITE.join('')) return reveal(S);
    return ritualMiss(S, v);
  }
  function splitRite(v) { const out = []; for (let i = 0; i < v.length; i += 2) out.push(v.slice(i, i + 2)); return out; }
  async function ritualMiss(S, v) {
    const a = splitRite(v);
    S.f.kpMiss = (S.f.kpMiss || 0) + 1;
    S.ent('hearth').s.shells = a.includes('摆壳');
    SHELL(S, 2); await S.wait(300);
    GIGGLE(S); S.shake(250, 1);
    await S.narr('摇篮里，传出一声很轻很轻的「嗤」。\n像是有人憋不住笑了。');
    S.ent('hearth').s.shells = false;
    let msg;
    const iE = a.indexOf('敲蛋'), iP = a.indexOf('摆壳'), iW = a.indexOf('倒水'), iM = a.indexOf('撒麦'), iS = a.indexOf('开口');
    if (iE !== 0) msg = '壳都还没有，就先忙别的了……歌本上说：敲蛋之前，什么都别忙。';
    else if (iW < iP) msg = '水泼了一手，蛋壳东倒西歪。——壳要先在炉石上站稳了，才好倒水。';
    else if (iM < iW) msg = '麦芽落进了空壳里。它眼皮都没抬：空壳里的麦芽，一眼就看穿是假的。';
    else if (iS !== 4) msg = '话说早了。它还没看锅呢，就白说了。';
    else msg = '顺序不对。';
    await S.think(msg);
    if (a.filter((k, i) => a.indexOf(k) !== i).length) await S.think('（每件事只做一回。）');
    S.take('eggs'); S.sfx('glass');
    await ritualHint(S, false);
    if (S.f.kpMiss >= 3) { await S.say('奶奶', '蛋壳都碎了？……灶边篮子里还有一打，我留着做圣诞糕的。拿去。'); S.give('eggs'); }
    else await S.narr('十二只蛋壳全碎了，在炉石上冒着焦味。\n——得回鸡窝再摸一窝蛋来。');
    goalGather(S);
  }
  async function ritualHint(S, asked) {
    const n = Math.max(S.f.kpMiss || 0, asked ? 1 : 0);
    S.face('nain', 'pl');
    if (n >= 4) await S.say('奶奶', ['我来念，你来做。', '先敲蛋，再把壳摆上炉石，然后倒水，水上撒麦芽——', '最后，大声说。']);
    else if (n === 3) await S.say('奶奶', ['头两样是：先敲蛋，再把壳摆上炉石。', '后面三样，歌本上一句一句都写着。']);
    else if (n === 2) await S.say('奶奶', '歌本上每一句都在说先后：先什么，后什么，最后什么。别急，一句一句对着来。');
    else if (asked) await S.say('奶奶', '照着歌本最后一页，一句一句地做。它在看着呢。');
  }
  async function reveal(S) {
    const h = S.ent('hearth'), c = S.ent('cradle');
    S.f.ph = 'reveal'; S.f.usedEggs = true;
    S.take('eggs'); S.take('water'); S.take('malt');
    S.turn(3);
    SHELL(S, 3); h.s.shells = true; await S.narr('十二个鸡蛋一个一个敲开，蛋黄蛋清倒进鸡食盆。\n十二只蛋壳，在炉石上站成一排。');
    S.sfx('water'); h.s.brew = true; SHELL(S, 4);
    await S.narr('一只一只倒进井水，水面上撒了麦芽。蛋壳里冒起了细细的热气。\n……身后的摇篮，不晃了。');
    await S.say('格温', '给割麦的人酿麦酒喽！十二个割麦的人，十二只蛋壳！', { style: 'big' });
    S.amb('none'); await S.wait(1200);
    await S.say('摇篮里', '我见过橡子，还没长成橡树。\n我见过鸡蛋，还没孵成小鸡。\n活了这么多年——', { style: 'whisper' });
    S.face('pl', 'cradle');
    await S.scare('face', { spr: '@chg', dur: 1.1 });
    await S.say('摇篮里', '还从没见过拿蛋壳给割麦的人酿酒的！', { style: 'big' });
    GIGGLE(S); await S.wait(400); GIGGLE(S);
    S.amb('fire');
    await S.say('奶奶', 'Duw annwyl……（威尔士话：老天爷啊……）');
    c.s.empty = true; c.s.revealed = true;
    S.place('chg', 6, 5, 1); S.sfx('thud'); S.bubble('chg', '♥', 1200);
    await S.narr('襁褓一掀，一个只有膝盖高的小老头从摇篮里爬了出来，「咚」地跳到地上。\n他光着皱巴巴的脑袋，戴着伊万的蕾丝小帽，身上拖着伊万的婴儿袍。');
    await S.say('小老头', ['哈！哈！蛋壳！三百年了，头一回！', '……行了，别那么看着我。我又不咬人。']);
    S.goal('和小老头谈谈：伊万在哪儿？');
    S.cp();
  }
  async function dealTalk(S) {
    S.face('chg', 'pl');
    await S.say('格温', '伊万在哪儿？把他还给我们！');
    await S.say('小老头', ['你们家的娃娃在山里，好好的。吃蜂蜜，睡天鹅绒。', '可山里的事，得按山里的规矩——一个换一个。把我带回去，拿我换他。公平。']);
    await S.say('奶奶', '……你为什么会在这儿？');
    await S.say('小老头', ['老了呗。山里不养没用的老东西。拿我换一个新的、会长大的，划算。', '……你们人不也一样？我在你们的炉子边上听得多了。', '谁家的孩子病了、长不大、不会说话，就说是我们换的。那些孩子啊——多半是你们自己的。']);
    await S.say('奶奶', '……是。可怜的孩子们。');
    await S.say('小老头', ['今天是冬天的头一夜，山门开到鸡叫。去溪里找一块带孔的石头，透过孔看那座山丘，就看得见门。', '进了山：他们的东西，一口都别吃。名字，别告诉他们。铁，带着，别拿出来。鸡叫之前，出来。']);
    S.f.ph = 'deal';
    S.follow('chg', true);
    S.goal('带小老头出门：去溪边找带孔的石头，再去山坡上的仙丘');
    S.cp();
  }
  /* 出门前奶奶叫住你，给铁剪子 */
  async function giveIron(S) {
    S.face('nain', 'pl');
    await S.say('奶奶', '格温，等等！');
    S.ent('cradle').s.iron = false; S.give('iron');
    await S.narr('奶奶从摇篮上头摘下那把张着口的铁剪子，合上，塞进你的围裙兜里。\n小老头往后缩了一步。');
    await S.say('奶奶', '揣好了。别拿出来——可也别离身。');
    await S.say('小老头', '……走吧。外头风大，我这把老骨头哟。', { style: 'whisper' });
  }

  /* ================= 第二幕：仙丘 ================= */
  async function hallIntro(S) {
    S.f.ph = 'hallIn';
    const n = S.f._dHall || 0;
    await S.narr(n ? '又是那扇门。又是那片绿光，那张长桌。' : '门在身后无声地合上了。长桌上摆满了金杯和发光的果子，竖琴自己在响。\n几个只到你腰那么高的人围着桌子，一齐转过头来——他们的耳朵，是尖的。');
    if (!n) await S.narr('最里头的宝座前站着一个女人，比爸爸还高。银色的头发一直垂到地上，头上戴着一圈山楂花。');
    S.face('pl', 'lady');
    await S.say('山中夫人', '人间的孩子。你把我们的老人家带回来了。');
    if (n) await S.think('……别说名字。别吃东西。');
    const r = await S.ask('「告诉我，孩子——你叫什么名字？」', ['「我是伊万的姐姐。」', '（抿着嘴，不作声）', '「我叫格温。」'], '山中夫人');
    if (r === 2) return nameEnd(S);
    await S.say('山中夫人', r === 0 ? '伊万的姐姐。……好一个聪明的回答。' : '不肯说？聪明。也无礼。不过——我喜欢聪明人。');
    await S.say('山中夫人', ['一个换一个，这是山里的规矩。可是母亲认得自己的孩子——你是姐姐，你也试试。', '那边五只摇篮。认错了，放回去再认。三次。\n第三次还认错——你抱走什么，什么就是你的弟弟。', '……先坐下吃点东西吧。你走了那么远的路。']);
    S.bubble('chg', '…', 1200);
    await S.say('小老头', '（他扯了扯你的裙角）卡住了，就回头问我。', { style: 'whisper' });
    S.f.ph = 'hall'; S.f.wrong = 0; S.f.hintN = 0;
    S.goal('在五只摇篮里认出伊万（三次机会）——两人时：一人念「笺」里的刻字，一人去看摇篮');
    if (!S.f.readMid) await S.think('……墙根那块石头上，好像刻着字。');
  }
  async function offerFood(S) {
    S.f.offered = true;
    S.face('g1', 'pl');
    S.bubble('g1', '♥', 1200);
    await S.narr('一个尖耳朵的小人从桌边跳下来，捧着一块金黄的蜂蜜饼，踮着脚递到你嘴边。\n饼上的蜜还在往下淌，香得你肚子咕噜一声。');
    const r = await S.ask('「尝一口吧？就一口。」', ['接过来，咬一口', '「谢谢，我不饿。」']);
    if (r === 0) return feastEnd(S);
    await S.say('山里的人', '……不饿？谁会不饿呢。', { style: 'whisper' });
    S.face('g1', 0);
  }
  async function feastOn(S) {
    if (S.f.ph !== 'hall') return S.narr('长桌上的东西，看着还和刚才一样新鲜。');
    const r = await S.ask('金杯里盛着蜜酒，盘子里堆着发光的果子和蜂蜜饼。\n闻起来像夏天，像过节，像妈妈烤的面包。', ['（拿一块蜂蜜饼）', '（把手缩回来）']);
    if (r === 0) return feastEnd(S);
    await S.think('……一口都不能吃。');
  }
  async function ladyOn(S) {
    S.face('pl', 'lady');
    if (S.f.ph === 'hall') return S.say('山中夫人', cycle(S, '_ld', ['五只摇篮。三次。', '你们人总说我们偷孩子。可你看——我们从来只拿一个，还一个。', '他在你家喝了三天的奶，你弟弟在这里喝了三天的蜜。两清。山里最讲公平。']));
    return S.say('山中夫人', '去吧。');
  }
  async function hallExit(S) {
    const p = S.pl;
    if (S.f.ph === 'out') return;
    if (p.prev && (p.prev[0] !== p.x || p.prev[1] !== p.y)) S.pos(p.prev[0], p.prev[1], 3);
    return S.think('来时的门不见了。土墙严丝合缝，只长着青苔。');
  }
  /* 逐级提示：问一次给方向，第二次给具体办法，第三次以后直接给答案 */
  async function hallHint(S) {
    const n = (S.f.hintN = (S.f.hintN || 0) + 1) + (S.f.wrong || 0);
    if (n <= 1) return S.say('小老头', ['（他扯了扯你的裙角，声音细得像蚊子）', '我老眼昏花，帮不上什么。……那个接生婆，在墙根刻过字。你去看看。'], { style: 'whisper' });
    if (n === 2) return S.say('小老头', ['两样东西：带孔的石头，和白气。', '石头看得穿木头。白气……这里冷，你凑近了看它们的嘴。'], { style: 'whisper' });
    if (n === 3) return S.say('小老头', ['嘴边有白气的，只有三只。', '再用石孔把那三只挨个看一遍——是木头的，就不算。'], { style: 'whisper' });
    S.goal('认出伊万：从左数第四只摇篮');
    return S.say('小老头', '……从左边数，第四只。别告诉夫人是我说的。', { style: 'whisper' });
  }
  const CR_DESC = [
    '这个孩子和伊万一模一样：圆脸，稀稀的黄头发，左边眉梢一颗小痣。\n睫毛上、襁褓边上结着一层细细的白霜，亮晶晶的，一动也不动。',
    '和伊万一模一样，连眉梢的小痣都在。\n他的小嘴微微张着，嘴边一缕淡淡的白气，一下，一下。',
    '和伊万一模一样。\n他睡得很沉——沉得过头了。小胸脯一点起伏都没有，嘴边什么也没有。',
    '和伊万一模一样。\n他的小嘴微微张着，嘴边一缕淡淡的白气，一下，一下。小拳头攥着襁褓的一角。',
    '和伊万一模一样，连眉梢的小痣都在。\n嘴边一缕淡淡的白气，一下，一下。'];
  async function cradleF(S, i) {
    const e = S.ent('cr' + (i + 1));
    if (S.f.ph !== 'hall') return S.narr(e.s.picked ? '空了的摇篮。' : '白桦木的小摇篮。');
    if (e.s.log) return S.narr('摇篮里是一截裹着襁褓的桤木，木头上刻着一张粗糙的小脸。');
    if (e.s.reject) return S.narr('那个孩子又闭上了眼睛。……不是他。');
    await S.narr(CR_DESC[i]);
    for (;;) {
      const r = await S.ask('第 ' + (i + 1) + ' 只摇篮。', ['透过石孔看看', '抱起这个孩子', '走开']);
      if (r === 2) return;
      if (r === 0) {
        S.sfx('chime');
        if (CR[i] === 'log') { await S.narr('石孔里，襁褓裹着的根本不是孩子——\n是一截桤木，木头上刻着一张粗糙的小脸。嘴边那缕白气，是画上去的一样。'); e.s.log = true; return; }
        await S.narr(CR[i] === 'ifan' ? '石孔里看过去，还是一个孩子。真真切切的孩子，暖的。' : '石孔里看过去，还是一个孩子。真真切切的孩子。\n……接生婆说，石孔只看得穿假东西。');
        continue;
      }
      return pickCradle(S, i);
    }
  }
  async function pickCradle(S, i) {
    const e = S.ent('cr' + (i + 1)), kind = CR[i];
    if (kind === 'ifan') return rightPick(S, i);
    S.f.wrong = (S.f.wrong || 0) + 1;
    if (kind === 'log') {
      e.s.log = true;
      await S.narr('你把他抱起来——太轻了，轻得不对。\n襁褓一松，滚出来一截桤木，「咚」地掉回摇篮里。');
    } else {
      e.s.reject = true;
      await S.narr('你把他抱起来——冷得像抱着一块冰。\n他睁开眼睛：一双没有眼白的、黑漆漆的眼睛，直直地看着你。');
    }
    S.face('pl', 'lady');
    if (S.f.wrong >= 3) return logEnd(S);
    if (S.f.wrong === 1 && S.once('ladyScare')) await S.scare('face', { spr: '@lady', dur: .9 });
    else S.sfx('laugh');
    await S.say('山中夫人', S.f.wrong === 1 ? '错了。……还有两次。' : '又错了。只剩最后一次了，伊万的姐姐。', { style: S.f.wrong === 2 ? 'big' : '' });
    if (kind === 'log') await S.think('连呼吸都学得那么像……可木头骗不过石孔。抱之前，先透过石孔看一眼。');
    else await S.think('他身上一点热气都没有。接生婆说：人的孩子在冷里会呼白气。……霜不是气。');
    if (S.f.wrong === 2) await hallHint(S);
  }
  async function rightPick(S, i) {
    const e = S.ent('cr' + (i + 1));
    e.s.picked = true; S.wear('@meb'); S.give('baby', true);
    S.amb('none');
    await S.narr('你把他抱起来。\n沉甸甸的，暖的。小脸贴在你的脖子上，一口热气呵在你耳朵根上。');
    hum(S, .8);
    await S.narr('你不知不觉地哼起了妈妈那支老歌。\n他皱了皱鼻子，攥住了你的一根手指。');
    S.amb('otherworld');
    S.f.ph = 'trade';
    S.face('pl', 'lady');
    await S.say('山中夫人', '公平。');
    const c = S.ent('chg');
    S.follow('chg', false); c.solid = false;
    await S.walk('chg', [10, 4], 2.4); S.face('chg', 0);
    if (S.f.fed && S.f.wrapped) await S.say('山中夫人', ['你喂他喝了热奶，还给他裹上了你母亲的披肩。', '……我们拿走一个，还回一个，从来不欠谁。今夜，是山里欠了你。']);
    else if (S.f.wrapped) await S.say('山中夫人', '你给他裹上了你母亲的披肩。……山里记得。');
    else if (S.f.fed) await S.say('山中夫人', '你喂他喝了热奶。……山里记得。');
    else await S.say('山中夫人', '你让他冷着、饿着，走了这一路。……山里也记得。');
    S.face('chg', 3);
    await S.say('小老头', S.f.fed || S.f.wrapped ? ['姑娘……替我谢谢你奶奶。', '她夜里给我盖被子，明知道我不是。'] : ['姑娘，替我谢谢你奶奶。', '……这一路，冷是冷了点。']);
    await S.say('山中夫人', ['鸡就要叫了。鸡一叫，山门就合上。', '合上的时候还在门里的——就是山里的人了。', '回去的路上有人在跳舞。别打断他们的舞，也别被拉进去。走吧。']);
    S.f.ph = 'out';
    await S.fade(1, 500);
    await S.go('tunnel', 1, 4, 2);
  }
  /* ---------- 坏结局 ---------- */
  async function nameEnd(S) {
    bump(S, '_dHall');
    await S.say('山中夫人', '格温。', { style: 'whisper' });
    await S.narr('她把这两个字轻轻念了一遍，像把一颗石子收进口袋。');
    await S.scare('face', { spr: '@lady', dur: 1 });
    await S.end({ bad: true, id: 'name', title: '说出了名字', text: '「格温，留下来吧。」\n\n你想说不。可是你的名字，已经不是你的了。\n\n天亮的时候，奶奶在门口守着炉子，一直等到太阳出来。\n山坡上的仙丘，草沾着露水，什么门也没有。\n\n往后很多年，山谷里的人都说，冬天的头一夜，能听见山里有个姑娘在唱摇篮曲。' });
  }
  async function feastEnd(S) {
    bump(S, '_dHall');
    await S.narr('蜂蜜饼甜得出奇。\n你又咬了一口。又一口。竖琴一直在弹，弹着弹着，你就想不起来自己是来做什么的了。');
    await S.scare('face', { spr: '@lady', dur: 1 });
    await S.end({ bad: true, id: 'feast', title: '一口蜂蜜饼', text: '很多很多年以后，一个拾柴的老人在山楂树下捡到一个姑娘。\n她穿着旧式的红法兰绒裙子，说话的口音，谁也没听过。\n\n她说她叫……\n她想不起来了。\n\n她只记得，有一个小娃娃在哭。她得把他抱回家。' });
  }
  async function logEnd(S) {
    bump(S, '_dHall');
    S.sfx('laugh');
    await S.say('山中夫人', '三次了。', { style: 'big' });
    await S.narr('满屋子的人都笑了起来。竖琴弹得飞快。\n等你回过神来，你已经站在山坡上，怀里抱着一个凉冰冰的襁褓。东边的天，白了。');
    await S.end({ bad: true, id: 'log', title: '一截桤木', text: '天亮的时候，奶奶掀开襁褓——\n里面是一截桤木，木头上刻着一张粗糙的小脸。\n\n奶奶没有哭。她把木头放回摇篮里，盖好被子，坐在旁边守了一整天。\n\n往后的每个冬夜，风从山上下来的时候，奶奶都说，她听见一个小娃娃在哭。' });
  }

  /* ================= 第三幕：土廊里的舞环 ================= */
  function escGoal(S) { S.goal('鸡叫之前穿过三个舞环（在白蘑菇线上等，顺着舞步走）' + (S.coop ? '——两人时：一人盯舞步喊「走」' : '')); }
  function placeDancers(S) { for (const d of DANCERS) { const [x, y] = RING(d.cx)[d.i]; S.place(d.id, x, y, 0); S.ent(d.id).s.i = d.i; } }
  async function tunnelIntro(S) {
    S.wear('@meb'); S.norun(true);
    await S.fade(0, 500);
    await S.narr('来时是一扇门，回去却是一条长长的、往上走的土廊。\n土廊上有三个圆圆的小厅，每个厅里，都有人绕着一块发光的石头在跳舞。');
    await S.narr('他们一圈一圈地转，脚不沾地，裙摆擦过土墙，沙沙地响。\n——碰上他们，就会被拉进舞里去。');
    await S.think(['抱着伊万，跑不起来。', '每个环前头的地上，都长着一道白蘑菇。站在蘑菇线上，他们够不着。\n看准了：他们往哪边转，就跟着往哪边走。等前头那个转过去，再进去。']);
    S.f.ph = 'escape'; S.f.catching = false; S.f.ironUsed = false;
    escGoal(S);
    S.cp('escape');
    S.timer(ESC_T, '鸡叫', escTimeout, { during: true });
  }
  function tunnelTick(S, dt) {
    S.f._mt = (S.f._mt ?? 0) - dt;
    if (S.f._mt <= 0) { S.f._mi = ((S.f._mi || 0) + 1) % DANCE.length; PLUCK(S, DANCE[S.f._mi], S.f.ph === 'escape' ? .9 : .5); if (S.f._mi % 2 === 0) S.tone('sine', 92, 58, .14, .07, 0, 400); S.f._mt = .26; }
    if (S.f.ph === 'escape' && S.timerLeft != null && S.timerLeft < 8 && S.once('crowWarn')) { CROW(S, .22); S.toast('……远处，鸡叫了半声'); }
    if (S.f.ph !== 'escape' || S.busy || S.f.catching) return;
    const p = S.pl;
    for (const d of DANCERS) {
      const e = S.ent(d.id); if (!e || e.hidden) continue;
      if (!e.mv) {
        const R = RING(d.cx), ni = (e.s.i + d.dn + 8) % 8, [ex, ey] = [Math.round(e.px / TS), Math.round(e.py / TS)], [nx, ny] = R[ni];
        const dir = DIRS.findIndex(q => q[0] === nx - ex && q[1] === ny - ey);
        if (dir >= 0) { e.s.i = ni; startMove(e, dir, d.spd); } else { S.place(d.id, R[e.s.i][0], R[e.s.i][1]); }
      }
      if (Math.abs(e.px - p.px) + Math.abs(e.py - p.py) < TOUCH_PX) { S.f.catching = true; S.run(S => caught(S, d)); return; }
    }
  }
  async function caught(S, d) {
    if (S.f.ph !== 'escape') return;
    if (!S.f.ironUsed) {
      S.f.ironUsed = true;
      S.sfx('sting'); S.shake(300, 2);
      S.pos(d.cx - 2, 4, 2); S.sfx('scream');
      await S.narr('一只冰凉的手抓住你的手腕——围裙兜里的铁剪子「当」地撞了上去。\n跳舞的人尖叫着松开手，旋回了舞圈。');
      await S.think('铁剪子烫得发红。……下一回，它救不了我。');
      S.f.catching = false;
      return;
    }
    S.clearTimer();
    bump(S, '_dEsc');
    S.sfx('scare'); S.fx('flash');
    await S.die('竖琴声一下子灌满了耳朵。\n冰凉的手拉住了你，你转啊，转啊，怀里一下子空了。\n——只跳了一支舞。', '你被拉进了舞圈');
  }
  async function escTimeout(S) {
    if (S.f.ph !== 'escape') return;
    bump(S, '_dEsc');
    CROW(S, .6);
    await S.narr('远远地，一声鸡叫。');
    await S.die('土廊两头的光，同时暗了下去，像一只眼睛慢慢合上。\n竖琴还在响。跳舞的人朝你伸出了手。', '鸡叫了');
  }
  async function escaped(S) {
    if (S.f.ph !== 'escape') return;
    S.clearTimer(); S.f.ph = 'dawn';
    S.norun(false);
    await S.narr('最后一级土阶。你一头撞进冷风里——');
    await S.fade(1, 400);
    S.ent('mound').s.door = false;
    await S.go('yard', 28, 4, 0, { fade: false });
    S.dark(.42);
    await S.fade(0, 900);
    CROW(S, 1);
    await S.narr('身后，山坡上的公鸡叫了第一声。\n你回过头：仙丘上的草沾着露水，什么门也没有。');
    await S.narr('怀里，伊万张开嘴——');
    S.sfx('cry');
    await S.narr('「哇——」\n他哭了。哭得响亮极了，整个山谷都听得见。');
    await finale(S);
  }
  async function finale(S) {
    await S.fade(1, 700);
    const c = S.ent('cradle'); c.s.empty = false; c.s.ifan = true; c.s.turned = true;
    S.ent('boxbed').s.awake = true;
    S.ent('hearth').s.shells = false; S.ent('hearth').s.brew = false;
    S.wear('@me'); S.take('baby');
    await S.go('cottage', 6, 6, 3, { fade: false });
    S.dark(.42);
    await S.fade(0, 900);
    S.face('nain', 'pl');
    await S.narr('奶奶一夜没合眼，炉火一夜没熄。\n她看见你怀里的伊万，手里的毛线针「啪嗒」掉在了地上。');
    await S.say('妈妈', '……伊万？是伊万！');
    await S.narr('妈妈的烧退了。她从箱床里探出身子，把伊万搂在怀里，摸到他眉梢那颗小痣，哭得比他还响。');
    hum(S, .7);
    await S.say('奶奶', '……回来了，回来了。');
    if (S.f.fed && S.f.wrapped) {
      await S.end({ id: 'blessing', title: '第十五夜　完', text: '奶奶把那十二只蛋壳一只一只收起来，埋在了山楂树底下。\n\n从那以后，每年冬天的头一个早晨，琼斯家的门槛上都会多出一小捧榛子，用一角红毛呢包着。\n伊万长到八十岁，没生过一场冬天的病。\n\n格温长大以后，嫁到了山那边。\n谁家的孩子病了，有人说是被「换」了，她就去敲那家的门。\n她说：先抱去给医生看。\n然后坐下来，陪那家的母亲守一夜。' });
    } else {
      await S.end({ id: 'home', title: '第十五夜　完', text: '奶奶把那十二只蛋壳一只一只收起来，埋在了山楂树底下。\n\n格温长大以后，嫁到了山那边。\n谁家的孩子病了，有人说是被「换」了，她就去敲那家的门。\n她说：先抱去给医生看。\n然后坐下来，陪那家的母亲守一夜。\n\n她从来没跟人说起过那座山丘里的事。\n只是每年冬天的头一夜，她都会在门口放一杯热牛奶。' });
    }
  }

  /* ================= 每帧 ================= */
  function cottageTick(S, dt) {
    if (S.f.ph === 'dawn') return;
    S.f._ck = (S.f._ck ?? 6) - dt;
    if (S.f._ck <= 0) { S.f._ck = 9 + Math.random() * 8; if (!S.ent('cradle').s.empty) S.tone('triangle', 180, 150, .25, .025, 0, 600); }   // 摇篮吱呀
  }
  function hallTick(S, dt) {
    if (S.f.ph === 'out') return;
    S.f._ht = (S.f._ht ?? 0) - dt;
    if (S.f._ht <= 0) { S.f._hi = ((S.f._hi || 0) + 1) % HARP.length; PLUCK(S, HARP[S.f._hi], .6); S.f._ht = .52; }
  }
})();
