/* ================= 第六夜 · 红衣小女孩 ================= */
(() => {
  const bg = p => { if (p && p.catch) p.catch(() => { }); return p; };

  /* ---------- V8 观景窗：3×5 像素字 ---------- */
  const GLYPH = {
    '0': '111101101101111', '1': '010110010010111', '2': '111001111100111', '3': '111001111001111', '4': '101101111001001',
    '5': '111100111001111', '6': '111100111101111', '7': '111001001001001', '8': '111101111101111', '9': '111101111001111',
    'R': '110101110101101', 'E': '111100110100111', 'C': '011100100100011', 'P': '110101110100100', 'L': '100100100100111',
    'A': '010101111101101', 'Y': '101101010010010', 'S': '011100010001110', 'T': '111010010010010', 'O': '010101101101010',
    'U': '101101101101111', '-': '000000111000000', ':': '000010000010000', '.': '000000000000010', ' ': '000000000000000'
  };
  function txt(g, x, y, s, k, col) {
    g.fillStyle = col; let cx = x;
    for (const ch of s) { const b = GLYPH[ch]; if (b) for (let i = 0; i < 15; i++) if (b[i] === '1') g.fillRect(cx + (i % 3) * k, y + ((i / 3) | 0) * k, k, k); cx += 4 * k; }
  }

  /* ---------- 录像带片段 ---------- */
  const PANEL = [0, 28, 56];        // v8 地图里三个「画面」的左边界
  const CLIPS = [
    { k: 'A', tc: '15:02:31', label: '15:02　登山口・团体照', p: 0 },
    { k: 'B', tc: '15:37:08', label: '15:37　竹林石阶', p: 1 },
    { k: 'C', tc: '16:51:44', label: '16:51　凉亭', p: -1 },
    { k: 'D', tc: '17:26:15', label: '17:26　（不记得录过）', p: 2, br: 0 },
    { k: 'E', tc: '17:09:52', label: '17:09　（不记得录过）', p: 2, br: 2 },
    { k: 'F', tc: '17:41:03', label: '17:41　（不记得录过）', p: 2, br: 1 }
  ];
  const SEQ = [2, 0, 1];            // 鬼打墙：按时间码顺序 17:09 右 → 17:26 左 → 17:41 中
  const BRN = ['左边', '中间', '右边'];

  /* ---------- 逃跑：红衣小女孩在身后 ---------- */
  const RED = { shack: 'red_s', creek: 'red_c', trail: 'red_t', trailhead: 'red_h' };
  const SPAWN = { shack: [1, 2], creek: [20, 13], trail: [11, 0], trailhead: [11, 0] };
  const VOICES = ['「表哥……等等我嘛……」', '「表哥，你走太快了啦。」', '「表哥，你回头看一下嘛，一下下就好。」', '「鸡腿还很多喔……」', '「表哥，我脚好痛……」', '「你回头嘛。」'];
  async function caughtLook(S) {
    for (const k in RED) S.stop(RED[k]);
    await S.scare('face', { spr: '@redface', sfx: 'scream' });
    await S.die('你回头了。\n她就站在你身后，近得鼻尖快要碰到你的鼻尖。\n那张皱巴巴的小脸，慢慢地笑开了。\n\n「表哥，」她用小琪的声音说，「你终于看我了。」', '你回头了');
  }
  async function caughtGrab(S) {
    for (const k in RED) S.stop(RED[k]);
    await S.scare('face', { spr: '@redface' });
    await S.die('一只冰凉的小手，牵住了你的手指头。\n握得好紧。你想甩，甩不开。\n\n她拉着你，往竹林最里面走。\n你的脚，自己跟着走了。', '你被牵走了');
  }
  function fleeReset(S) {
    const id = RED[S.map]; if (!id) return;
    S.stop(id); S.hide(id); S.f._sp = 1.6; S.f._st = 0; S.f._vo = 3;
  }
  function carryQi(S, from, to) {
    const spr = S.ent(from).spr;
    S.follow(from, false); S.hide(from);
    const e = S.ent(to); e.spr = spr; S.show(to); S.follow(to, true);
  }

  /* ---------- 人物 ---------- */
  function camExtra(g, d, fr, G, R) {     // 手里的 V8
    if (d === 0) { R(5, G.tT + 3, 6, 4, '#18181c'); R(9, G.tT + 4, 3, 2, '#3a3e48'); R(6, G.tT + 4, 1, 1, '#d02020'); }
    else if (d === 1) { R(1, G.tT + 2, 6, 4, '#18181c'); R(0, G.tT + 3, 2, 2, '#4a5a6a'); R(5, G.tT + 1, 2, 1, '#2a2a30'); }
    else { R(10, G.tT + 1, 2, 5, '#18181c'); }
  }
  function leafMouth(g, d, fr, G, R) {     // 嘴里塞满草叶，眼睛空空的
    if (d === 0) { R(6, G.hT + 4, 1, 2, '#d8d4c8'); R(9, G.hT + 4, 1, 2, '#d8d4c8'); R(5, G.hT + 6, 6, 2, '#3a7a2a'); R(4, G.hT + 7, 2, 1, '#2a5a1a'); R(10, G.hT + 7, 2, 1, '#5a8a3a'); R(7, G.hT + 8, 1, 2, '#3a6a2a'); }
    else if (d === 1) { R(4, G.hT + 5, 3, 2, '#3a7a2a'); R(3, G.hT + 6, 1, 1, '#5a8a3a'); }
  }
  function redExtra(g, d, fr, G, R) {
    if (d === 0) { R(6, G.hT + 4, 1, 2, '#050303'); R(9, G.hT + 4, 1, 2, '#050303'); R(7, G.hT + 6, 2, 1, '#6a2a2a'); R(4, G.tB + 1, 8, 1, '#8a0808'); }
    else if (d === 1) { R(6, G.hT + 4, 1, 2, '#050303'); }
  }
  function oldFace(g, d, fr, G, R) {      // 放大以后的脸：不是小孩子的脸
    if (d !== 0) return;
    R(4, G.hT + 1, 8, 1, '#a89888'); R(5, G.hT + 3, 2, 1, '#9a8a7a'); R(9, G.hT + 3, 2, 1, '#9a8a7a');
    R(5, G.hT + 4, 2, 2, '#0a0404'); R(9, G.hT + 4, 2, 2, '#0a0404'); R(6, G.hT + 4, 1, 1, '#6a1010');
    R(4, G.hT + 6, 8, 1, '#4a0808'); R(4, G.hT + 5, 1, 1, '#4a0808'); R(11, G.hT + 5, 1, 1, '#4a0808');
    R(5, G.hT + 7, 1, 1, '#b0a090'); R(10, G.hT + 7, 1, 1, '#b0a090'); R(7, G.hT + 2, 2, 1, '#a89888');
  }
  /* ---------- 地图行（v8 的画面要复用步道岔路，所以先定义） ---------- */
  const TRAIL_ROWS = [
    'TTTTTTTTTTTdTTTTTTTTTTT',
    'TTTdTTTJJJJdJJJJTTTdTTT',
    'TTTdTTJJJJJdJJJJJTTdTTT',
    'TTTdTJJJJJJdJJJJJJTdTTT',
    'TTTdTJJJJJ"d"JJJJJTdTTT',
    'TTTdddddd""d""ddddddTTT',
    'TTTTTJJJ"""d"""JJJTTTTT',
    'TTTTTJJJ"""d"""JJJTTTTT',
    'TTTTTTJJJ""d""JJJTTTTTT',
    'TTTTTTTJJJJdJJJJTTTTTTT',
    'TTTTTTTJJJ"d"JJJTTTTTTT',
    'TTTTJJ"""""d"kkkkkJTTTT',
    'TTTTJ""""""d"kkkkkJTTTT',
    'TTTTJ""""""d"kkkkkJTTTT',
    'TTTTJJ"""""d"kkkkkJTTTT',
    'TTTTTJJJ"""d""JJJJJTTTT',
    'TTTTTTJJJJJdJJJJJJTTTTT',
    'TTTTTTJJJJJdJJJJJJTTTTT',
    'TTTTTTJJJJJddddJJJTTTTT',
    'TTTTTTJJJJJJJJdJJJTTTTT',
    'TTTTTTJJJJJJJJdJJJTTTTT',
    'TTTTTTJJJJJJJJdJJJTTTTT',
    'TTTTJJJddddddddJJJTTTTT',
    'TTTTJJJdJJJJJJJJJJTTTTT',
    'TTTTJJJdJJJJJJJJJJTTTTT',
    'TTTTJJJdJJJJJJJJJJTTTTT',
    'TTTTJJJdddddJJJJJJTTTTT',
    'TTTTTJJJJJJdJJJJJTTTTTT',
    'TTTTTJJJJJJdJJJJJTTTTTT',
    'TTTTTTJJJJJ^JJJJJTTTTTT',
    'TTTTTTJJJJJ^JJJJJTTTTTT',
    'TTTTTTTTTTT^TTTTTTTTTTT'];
  const V8_A = [
    'TTTTTTTTTTTTTTTTTTTT',
    'TTPTTTTTTTTTTTTTTPTT',
    'TT""""""""""""""""TT',
    'T"""kkkkkkkkkkkk"""T',
    'T"""kkkkkkkkkkkk"""T',
    'T"""kkkkkkkkkkkk"""T',
    'T""""""""""""""""""T',
    'T""""""""""""""""""T',
    'T""""dddddddddd""""T',
    'T"""dddddddddddd"""T',
    'T""dddddddddddddd""T',
    'T"dddddddddddddddd"T',
    'TTTTTTTTTTTTTTTTTTTT'];
  const V8_B = Array.from({ length: 13 }, (_, i) => i % 3 === 1 ? 'JJJJJJJJ""^""JJJJJJJ' : 'JJJJJJJJJ"^"JJJJJJJJ');
  const V8_C = TRAIL_ROWS.slice(0, 13).map(r => r.slice(1, 21));
  const V8_ROWS = V8_A.map((r, i) => r + ' '.repeat(8) + V8_B[i] + ' '.repeat(8) + V8_C[i]);
  /* 鬼打墙时，红衣小女孩会在这些格子上一闪而过 */
  const GLIMPSE = [[9, 6], [13, 7], [14, 6], [10, 4], [12, 4], [8, 7], [5, 12], [6, 14], [12, 10], [9, 12]];

  const TL = { J: 'bamboo', '^': 'steps', Q: 'steppingstone', X: 'base', U: 'mudpath' };   // 自定义瓦片字符（每张图的 legend）
  const RED_P = { skin: '#e6dcd2', hair: '#0c0808', hs: 'bob', child: true, dress: true, top: '#c81212', top2: '#7a0606', bottom: '#c81212', shoes: '#a80c0c', eye: '#050303' };

  defChapter({
    id: 'redgirl', n: 6, title: '红衣小女孩', sub: '一卷家庭登山录像带。队伍最后面，跟着一个谁也不认识的红衣小女孩。', origin: '台湾都市传说', color: '#1d3a24',
    icon: '@red', amb: 'wind', floor: 'dirt', wall: 'wood', dark: .5, plr: 3.4,
    tileOpts: { grassC: '#284a2a', treeC: '#173520' },
    people: {
      me: { key: 'rg-me', skin: '#e8c09a', hair: '#161212', hs: 'short', top: '#2f5a7a', top2: '#e8e8e8', bottom: '#3a3f52', shoes: '#e0e0e0', extra: camExtra },
      erjiu: { skin: '#d4a07a', hair: '#161212', hs: 'short', hat: 'cap', hatC: '#e8e2d0', top: '#e8e4dc', top2: '#b83030', bottom: '#8a7a5a', shoes: '#3a3a3a' },
      jiumu: { skin: '#e8c4a0', hair: '#2a1a14', hs: 'bob', hat: 'straw', hatC: '#d8c08a', top: '#d87a9a', top2: '#f0d0dc', bottom: '#4a4a6a', shoes: '#e8e0e0' },
      awei: { skin: '#d8a880', hair: '#141010', hs: 'messy', top: '#2a4a8a', top2: '#e8e8e8', bottom: '#2a4a8a', shoes: '#e8e8e8' },
      qi: { skin: '#f0caa4', hair: '#1a1010', hs: 'twin', child: true, dress: true, top: '#f0c828', top2: '#d8a810', bottom: '#f0c828', shoes: '#e05a7a' },
      qi2: { skin: '#f0caa4', hair: '#1a1010', hs: 'twin', child: true, top: '#ece4ec', top2: '#e0a0b8', bottom: '#d86a8a', skirt: true, shoes: '#e05a7a' },
      qi2leaf: { key: 'rg-qileaf', skin: '#e0c0a0', hair: '#1a1010', hs: 'twin', child: true, top: '#ece4ec', top2: '#e0a0b8', bottom: '#d86a8a', skirt: true, shoes: '#e05a7a', extra: leafMouth },
      ama: { skin: '#d8b090', hair: '#d0d0d0', hs: 'bun', top: '#4a3a5a', top2: '#6a5a7a', bottom: '#2a2a34', shoes: '#222' },
      apo: { skin: '#c49468', hair: '#9a9a9a', hs: 'bun', hat: 'straw', hatC: '#c8b070', top: '#5a7a5a', top2: '#8aa88a', apron: '#a8a8c8', bottom: '#3a3a3a', shoes: '#2a2a2a' },
      miaogong: { key: 'rg-miaogong', skin: '#c8986a', hair: '#bbbbbb', hs: 'bald', top: '#e8e4d8', top2: '#c8c4b8', bottom: '#3a3a4a', shoes: '#2a2a2a',
        extra(g, d, fr, G, R) { if (d === 0) { R(9, G.tT + 1, 6, 6, '#a88028'); R(10, G.tT + 2, 4, 4, '#e0c060'); R(11, G.tT + 3, 2, 2, '#c8a040'); } else if (d === 1) { R(1, G.tT + 1, 3, 6, '#c8a040'); } } },
      man: { skin: '#c08a5a', hair: '#1a1414', hs: 'short', hat: 'cap', hatC: '#3a5a3a', top: '#5a6a4a', top2: '#4a5a3a', bottom: '#3a3a3a', shoes: '#222' },
      red: Object.assign({ key: 'rg-red', extra: redExtra }, RED_P),
      redface: Object.assign({ key: 'rg-redface', extra: oldFace }, RED_P)
    },
    items: {
      v8: { name: 'V8 摄影机', desc: '二舅新买的 Sony 8 釐米摄影机，沉甸甸的。里面是一卷刚拆封的 P6-120 带子。\n观景窗小小的，看出去的世界是黑白的。' },
      amulet: { name: '平安符', desc: '阿嬷在土地公庙求的平安符。红色的小布袋，里面装了香灰。\n「随身带着，不要拿下来。」' },
      raincoat: { name: '小琪的黄雨衣', desc: '湿透了，冰冰的。两个口袋里塞满了嚼烂的草叶。' },
      pot: { name: '生锈的铁锅', desc: '工寮灶上的铁锅，锅耳上挂着一支大汤匙。敲起来「哐、哐」地响，跟锣差不多。' }
    },
    notes: {
      missing: { title: '寻人启事（土地公庙柱子上）', text: '纸被雨淋得皱巴巴的，用四颗图钉钉在柱子上。\n\n寻人启事\n王○○，男，七十二岁。\n民国八十年十月九日上午独自上山采竹笋，至今未归。\n身穿灰色汗衫、蓝色工作裤、黑色雨鞋，有轻微重听。\n如有见到，请通知山下黄家杂货店，必有重谢。\n\n（底下有人用原子笔补了几行，字歪歪扭扭的）\n十月十二日找到了。\n人在后山的溪沟里，离步道很远很远，大人走都要走半天。\n找到的时候他坐在石头上，嘴巴里塞满了草叶跟泥土。\n他说，有一个穿红衫的小囡仔，一直请他吃鸡腿。\n\n感谢土地公保庇。' },
      roster: { title: '登山社报名表（二舅妈的）', text: '○○登山社　三月份家庭登山\n路线：登山口 → 竹林石阶 → 凉亭 → 石碑岔路 → 山顶\n（来回约三小时，老少咸宜）\n集合：下午两点半　登山口土地公庙前\n\n1. 陈志明（领队）\n2. 林秀凤\n3. 陈家伟　16岁\n4. 陈欣琪　8岁　※会晕车，带塑胶袋\n5. 李凯翔　20岁　※负责摄影\n\n注意事项：\n· 不要脱队。走最后面的人要跟紧。\n· 天黑以前一定要下山。\n· 在山上听到有人叫你的名字，先看清楚是谁，再应。\n· 垃圾请带下山。' },
      weekly: { title: '八卦周刊撕下来的一页', text: '压在凉亭的长椅上，被雾气泡得软软的。\n\n【灵异追踪】全台疯传！家庭出游录像　惊见「红衣小女孩」\n\n一家人到中部山区登山，用 V8 录下全家出游的过程。回家播放时才发现，队伍的最后面，多了一个穿红色衣服的小女孩（也有读者说，她还戴着一顶红帽子），一路跟着他们往上走。\n全家没有一个人认识她，拍的时候，也没有人看见她。\n\n更令人发毛的是她的脸。把画面一格一格放大，那张脸一点也不像小孩子——倒像个皱着脸、表情古怪的老人。\n\n节目播出以后，各种传言越传越凶：有人说，看过这段录像的人都会倒楣；也有人说，拍到她的那一家人后来不太平静。不过，这些说法都没有人能够证实。\n\n有民俗研究者认为，这就是台湾山区自古流传的「魔神仔」——\n\n（后半页被撕掉了）' },
      logbook: { title: '工寮里的记事本', text: '被老鼠咬过的记事本。前面几页记的是工钱、竹笋的斤两、欠谁几包烟。后面——\n\n七十六年八月十四\n阿财又不见了。中午还在溪边洗脸，转个头人就没了。\n头家讲是魔神仔牵去的。\n晚上大家拿锅子、铁桶，敲了一整夜，一路喊他的名字。\n\n八月十六\n在后山竹林找到阿财。人卡在竹子中间，离地一人高，不知道怎么爬上去的。\n嘴巴里都是草，还有蚱蜢，活的。\n他讲：有一个穿红衫的小妹妹，带他去吃大餐，桌上有鸡腿有卤肉。\n\n八月二十\n庙公来收惊。庙公讲：\n魔神仔怕吵，怕锣鼓。要先敲，敲到它躲开。\n再把土地公的符放在人身上。\n然后喊他的名字——连名带姓，一定要喊全名，魂才认得路回来。\n喊小名没有用。小名，魔神仔也会叫。\n\n阿财好了以后，不肯再上山。\n他讲，下山的时候，那个小妹妹一直在后面叫他。\n他差一点就回头了。' }
    },
    legend: '「红衣小女孩」是台湾流传最广的都市传说之一。一般的说法是：1998年前后，一个家庭到中部山区（据说是台中大坑一带）登山，用当时俗称「V8」的家用摄影机录下了出游过程。后来这段录像在电视灵异节目里播出——画面中，队伍的最后面跟着一个穿红色衣服的小女孩，全家人都说不认识她，拍摄的时候也没有人注意到她。有人把画面放大，说她的脸不像小孩，倒像一个表情古怪的老人。\n\n录像播出以后，传言越滚越大：有人说看过录像的人会倒楣，有人说拍到她的那一家后来出了事。这些说法从来没有可靠的证据。也有不少人认为，她不过是同一条步道上别家登山客的孩子，因为录像画质粗糙、角度凑巧，才被看成了「鬼」。\n\n更多人把她和台湾民间的「魔神仔」连在一起。魔神仔是山林里的精怪，传说身形矮小、像个孩子，会把人——尤其是老人和小孩——引进深山。被「牵走」的人往往几天后才在溪沟、竹林，甚至高高的树上被找到，嘴里塞满草叶、泥土或虫子，却说有人请他吃了鸡腿、大餐。民间的应对办法是敲锣打鼓、放鞭炮，成群结队地喊失踪者的名字，并求土地公等神明帮忙找人；直到今天，台湾偶尔还有山区失踪事件被附会成「魔神仔牵走」。2015年起，电影《红衣小女孩》系列把这两个传说合而为一，让那段老录像又被人翻出来，看了一遍又一遍。\n\n（本章的登山家庭与人物姓名、寻人启事、工寮记事本、录像带里「时间码错乱的未来画面」以及鬼打墙的破解方法，均为游戏虚构。）',
    start: { map: 'trailhead', x: 11, y: 11, dir: 3 },
    async intro(S) {
      await S.card('第六夜　红衣小女孩', '1999年3月　台湾中部　某座郊山', '二舅新买了一台 V8，\n说这次全家去爬山，一定要从头录到尾，\n回去拷贝给每一家。\n\n那时候，谁也没想到，\n这卷带子后来会被倒回去，看那么多遍。');
    },
    resume: {
      flee_s: async S => fleeReset(S),
      flee_c: async S => fleeReset(S),
      flee_t: async S => { S.dark(.9); fleeReset(S); },
      flee_h: async S => fleeReset(S)
    },
    tick(S, dt) {
      if (W.busy || S.f.phase !== 'flee') return;
      const id = RED[S.map]; if (!id) return;
      const e = S.ent(id); if (!e) return;
      S.f._gg = (S.f._gg ?? 1.5) - dt;
      if (S.f._gg <= 0) { S.f._gg = 3.6; S.sfx('thud'); }      // 山下远远的锣声
      if (S.f._sp > 0) {
        S.f._sp -= dt;
        if (S.f._sp <= 0) { const [x, y] = SPAWN[S.map]; S.place(id, x, y, 0); e.alpha = 1; S.sfx('giggle'); S.chase(id, { spd: 2.7, wait: .5, catch: caughtGrab }); }
        return;
      }
      if (e.hidden || !e.chase) return;
      S.f._vo = (S.f._vo ?? 3) - dt;
      if (S.f._vo <= 0) { S.f._vo = 4.5 + Math.random() * 3; S.toast(VOICES[(S.f._vi = ((S.f._vi ?? -1) + 1)) % VOICES.length]); S.sfx('whisper'); }
      const p = S.pl, dx = (e.px - p.px) / TS, dy = (e.py - p.py) / TS, d = Math.hypot(dx, dy);
      const dot = dx * DIRS[p.dir][0] + dy * DIRS[p.dir][1];
      if (d < 6.5 && dot > d * .75) {
        S.f._st = (S.f._st || 0) + dt;
        if (!S.f._stw) { S.f._stw = true; S.toast('不要回头！'); S.sfx('heart'); }
        if (S.f._st > .55) { S.f._st = 0; S.stop(id); runScript(caughtLook); }
      } else { S.f._st = Math.max(0, (S.f._st || 0) - dt * 2); S.f._stw = false; }
    },
    tiles: {
      bamboo: { solid: true, paint(R, X, Y) {
        R(0, 0, 16, 16, '#14281a');
        for (let i = 0; i < 4; i++) {
          const x = (hash(X, Y, 80 + i) * 14) | 0, c = i % 2 ? '#5a8a4a' : '#466e38';
          R(x, 0, 2, 16, c); R(x + 1, 0, 1, 16, shade(c, .18)); R(x, (hash(X, Y, 90 + i) * 13) | 0, 2, 1, '#22401e');
        }
        for (let i = 0; i < 6; i++) R((hash(X, Y, 100 + i) * 13) | 0, (hash(X, Y, 110 + i) * 15) | 0, 3, 1, i % 2 ? '#6a9a4a' : '#3e6a30');
      } },
      steps: { solid: false, paint(R, X, Y) {
        speck(R, '#3d3024', ['#4a3a2a', '#33281e'], X, Y, 8, 40);
        for (let r = 0; r < 4; r++) { R(1, r * 4, 14, 3, shade('#77716a', (hash(X, Y + r, 41) - .5) * .2)); R(1, r * 4 + 3, 14, 1, '#2e2a24'); if (hash(X, Y, 42 + r) < .4) R(2 + ((hash(X, Y, 43 + r) * 9) | 0), r * 4, 3, 1, '#4a6a3a'); }
      } },
      steppingstone: { solid: false, paint(R, X, Y) { TILE.water.paint(R, X, Y); R(3, 4, 10, 8, '#6e6c64'); R(4, 3, 8, 1, '#8a887e'); R(4, 4, 6, 2, '#8a887e'); R(3, 11, 10, 1, '#3a4a58'); } },
      base: { solid: true, paint(R, X, Y) { speck(R, '#3a2e22', ['#2e241a'], X, Y, 8, 44); } },
      mudpath: { solid: false, paint(R, X, Y) { speck(R, '#1a1612', ['#221c16', '#120e0a'], X, Y, 10, 45); } }
    },
    sprites: {
      /* 土地公庙（3格宽）：红瓦燕尾、红柱、小小的土地公 */
      tdg(g, e, t, R) {
        R(-2, 10, 52, 6, '#5a544c'); R(-2, 10, 52, 1, '#7a746a');
        R(4, -6, 40, 17, '#cbbca4'); R(4, -6, 40, 1, '#a89880');
        R(6, -6, 4, 17, '#a82018'); R(38, -6, 4, 17, '#a82018'); R(7, -6, 1, 17, '#c83a2a'); R(39, -6, 1, 17, '#c83a2a');
        R(11, -4, 2, 12, '#d83a2a'); R(35, -4, 2, 12, '#d83a2a');
        R(14, -3, 20, 14, '#2a1410');
        R(21, 1, 6, 8, '#b88028'); R(22, -2, 4, 4, '#e0b890'); R(22, 1, 4, 3, '#f0eee6'); R(21, -3, 6, 1, '#2a2018'); R(20, 9, 8, 2, '#6a2a1a');
        const f = Math.sin(t * 13) > 0 ? 1 : 0;
        R(16, 5, 2, 5, '#e8e2cc'); R(30, 5, 2, 5, '#e8e2cc'); R(16, 3 + f, 2, 2 - f, '#ffcf5a'); R(30, 3 + f, 2, 2 - f, '#ffcf5a');
        R(16, -10, 16, 4, '#2a2010'); R(18, -9, 2, 2, '#d8a838'); R(23, -9, 2, 2, '#d8a838'); R(28, -9, 2, 2, '#d8a838');
        R(0, -14, 48, 6, '#9a2818'); for (let x = 1; x < 48; x += 3) R(x, -14, 1, 6, '#7a1a10');
        R(0, -8, 48, 2, '#5a120c'); R(2, -16, 44, 2, '#b83a22');
        R(-3, -17, 5, 2, '#b83a22'); R(-5, -19, 3, 2, '#b83a22'); R(46, -17, 5, 2, '#b83a22'); R(50, -19, 3, 2, '#b83a22');
        R(22, -20, 4, 4, '#d8a030'); R(23, -21, 2, 1, '#f0c050');
      },
      xianglu(g, e, t, R) {
        R(2, 11, 12, 4, '#4a3a2a'); box(R, 3, 4, 10, 8, '#7a6238'); R(2, 4, 12, 2, '#9a7e48'); R(4, 6, 8, 1, '#5a4626');
        for (let i = 0; i < 3; i++) { R(5 + i * 2, -1 - (i % 2), 1, 6, '#8a3a2a'); R(5 + i * 2, -2 - (i % 2), 1, 1, '#ff6a2a'); }
        const s = Math.sin(t * 1.6); R(7 + s, -6, 1, 3, 'rgba(220,220,220,.45)'); R(8 - s, -10, 1, 4, 'rgba(220,220,220,.3)');
      },
      jinlu(g, e, t, R) {
        box(R, 2, -2, 12, 17, '#6a2a1a'); R(3, -5, 10, 3, '#4a1a10'); R(6, -8, 4, 3, '#3a1408'); R(5, 4, 6, 5, '#140806');
        if (!e.off) { const f = Math.sin(t * 9) > 0 ? 1 : 0; R(6, 6 - f, 4, 3 + f, '#ff8a2a'); R(7, 7, 2, 2, '#ffcf5a'); }
      },
      board(g, e, t, R) {
        R(1, -6, 2, 21, '#4a3424'); R(13, -6, 2, 21, '#4a3424'); box(R, 0, -9, 16, 13, '#6a5038');
        R(2, -7, 5, 7, '#e8e0c8'); R(3, -5, 3, 1, '#7a7060'); R(3, -3, 2, 1, '#7a7060');
        R(8, -8, 6, 9, '#d8d4c4'); R(9, -6, 2, 2, '#555'); R(9, -3, 4, 1, '#7a7060'); R(9, -1, 3, 1, '#7a7060');
        R(2, 1, 4, 2, '#c8c0a8'); if (!e.read) R(10, -12 + (Math.sin(t * 4) > 0 ? 1 : 0), 2, 2, '#ffe680');
      },
      pavilion(g, e, t, R) {
        R(0, 10, 48, 6, '#77716a');
        for (const x of [3, 21, 41]) { R(x, -12, 4, 26, '#8a2a20'); R(x, -12, 1, 26, '#a83a2a'); }
        R(7, 4, 34, 3, '#7a5a3a'); R(7, 7, 34, 1, '#4a3424'); R(9, 8, 2, 5, '#4a3424'); R(37, 8, 2, 5, '#4a3424');
        R(-2, -22, 52, 10, '#2e5a40'); for (let x = 0; x < 50; x += 3) R(x - 1, -22, 1, 10, '#24483a');
        R(-2, -13, 52, 2, '#1a3426'); R(-5, -24, 6, 2, '#2e5a40'); R(47, -24, 6, 2, '#2e5a40'); R(4, -25, 40, 3, '#3a6a4a');
        R(16, -11, 16, 4, '#e8e2cc'); R(18, -10, 3, 2, '#2a2a2a'); R(23, -10, 3, 2, '#2a2a2a'); R(28, -10, 2, 2, '#2a2a2a');
      },
      stele(g, e, t, R) {
        R(2, 12, 12, 3, '#3a3832'); R(4, -9, 8, 22, '#6e6c66'); R(5, -10, 6, 1, '#6e6c66'); R(5, -9, 2, 22, '#7e7c74');
        R(7, -6, 2, 1, '#3a3a36'); R(7, -3, 2, 1, '#3a3a36'); R(7, 0, 2, 1, '#3a3a36'); R(10, 2, 2, 6, '#3e5a34'); R(4, 6, 2, 5, '#3e5a34');
        const n = e.num || 0;
        for (let i = 0; i < n; i++) { const y = -7 + i * 5; R(3, y, 10, 2, '#c81414'); R(11, y + 1, 2, 4, '#a80c0c'); R(12, y + 3, 1, 3, '#a80c0c'); }
      },
      shack(g, e, t, R) {
        R(0, -14, 80, 30, '#4e4032'); for (let x = 0; x < 80; x += 5) R(x, -14, 1, 30, '#33291f');
        R(0, 10, 80, 6, '#3a2e22');
        R(-3, -30, 86, 16, '#6e5034'); for (let x = -3; x < 83; x += 4) R(x, -30, 2, 16, '#7e6040');
        R(10, -28, 9, 6, '#9a4a2a'); R(52, -24, 12, 5, '#8a3a22'); R(30, -29, 6, 3, '#9a4a2a'); R(-3, -15, 86, 2, '#2a2018');
        R(66, -32, 12, 7, '#2a5a2a'); R(70, -26, 6, 10, '#2a5a2a'); R(-2, -26, 6, 14, '#24502a'); R(2, -14, 3, 9, '#24502a');
        box(R, 8, -8, 14, 10, '#4a3a2a'); R(9, -7, 12, 8, '#0c1216'); R(10, -6, 5, 3, '#22323a'); R(15, -2, 6, 1, '#4a3a2a');
        R(33, -10, 14, 26, '#0e0a08'); R(46, -10, 3, 26, '#6a5440'); R(47, -8, 1, 22, '#4a3a2a'); R(33, -10, 14, 1, '#2a2018');
        R(56, -6, 15, 7, '#bcb4a0'); R(58, -4, 4, 1, '#6a3a2a'); R(63, -4, 6, 1, '#6a3a2a'); R(58, -2, 9, 1, '#6a3a2a');
      },
      zao(g, e, t, R) {
        box(R, 0, -1, 16, 16, '#6a4232'); for (let y = 2; y < 15; y += 4) R(1, y, 14, 1, '#4a2a22'); R(5, 9, 6, 5, '#140c08');
        if (!e.open) { R(2, -4, 12, 5, '#2a2a2a'); R(3, -5, 10, 1, '#4a4a48'); R(4, -3, 4, 1, '#7a3a1a'); R(12, -8, 1, 5, '#8a8a88'); R(11, -9, 3, 2, '#8a8a88'); }
        else R(3, -2, 10, 2, '#120a06');
      },
      calendar(g, e, t, R) { R(4, 1, 8, 11, '#e0d8c4'); R(4, 1, 8, 3, '#b83028'); R(5, 5, 6, 1, '#555'); R(5, 7, 6, 1, '#888'); R(5, 9, 6, 1, '#888'); R(7, 0, 2, 1, '#333'); R(9, 10, 3, 2, '#c8b898'); },
      leaves(g, e, t, R) { const cs = ['#3a6a2a', '#4e7a34', '#2a4a1e', '#6a8a3a']; for (let i = 0; i < 9; i++) R((hash(e.x, e.y, i) * 13) | 0, 3 + ((hash(e.y, e.x, i + 5) * 11) | 0), 3, 1 + (i % 2), cs[i % 4]); R(9, 11, 3, 1, '#6a8a2a'); R(10, 10, 1, 1, '#2a2a1a'); },
      raincoat(g, e, t, R) { R(1, 7, 14, 8, '#5a5852'); R(2, 6, 12, 2, '#6e6c66'); R(3, 3, 10, 9, '#f0c828'); R(5, 1, 6, 3, '#d8a810'); R(3, 11, 10, 1, '#b88a08'); R(7, 5, 1, 6, '#c89810'); },
      stonegod(g, e, t, R) { R(2, 12, 12, 3, '#3a3a36'); R(4, 2, 8, 11, '#77756c'); R(5, 1, 6, 2, '#77756c'); R(5, 3, 6, 1, '#8a887e'); R(3, 6, 10, 2, '#c02020'); R(4, 13, 1, 2, '#8a3a2a'); R(11, 13, 1, 2, '#8a3a2a'); R(4, 12, 1, 1, '#ff6a2a'); },
      shoot(g, e, t, R) { R(5, 6, 6, 9, '#8a7a4a'); R(6, 3, 4, 4, '#a89a5a'); R(7, 1, 2, 3, '#c8b878'); R(5, 9, 6, 1, '#6a5a3a'); R(5, 12, 6, 1, '#6a5a3a'); },
      gourd(g, e, t, R) { R(6, 8, 4, 6, '#c8c0a8'); R(7, 6, 2, 2, '#c8c0a8'); R(5, 10, 6, 4, '#d8d0b8'); R(8, 4, 1, 2, '#6a5a3a'); },
      /* 一大片雾：盖住整个画面 */
      fogbank(g, e, t, R) {
        g.fillStyle = 'rgba(196,204,200,.62)'; g.fillRect(0, 0, VW, VH);
        for (let i = 0; i < 9; i++) { const y = ((t * 7 + i * 29) % (VH + 40)) - 20; g.fillStyle = i % 2 ? 'rgba(230,236,232,.35)' : 'rgba(160,170,168,.25)'; g.fillRect(0, y, VW, 10 + (i % 3) * 6); }
      },
      snow(g, e, t, R) { for (let y = 0; y < VH; y += 3) for (let x = 0; x < VW; x += 3) { const v = Math.random(); g.fillStyle = v < .45 ? '#d0d0cc' : v < .8 ? '#585856' : '#161616'; g.fillRect(x, y, 3, 3); } },
      /* V8 观景窗 OSD：整屏叠加 */
      osd(g, e, t, R) {
        const w = VW, h = VH, m = 12;
        g.fillStyle = e.mode === 'REC' ? 'rgba(20,30,26,.10)' : 'rgba(40,64,52,.22)'; g.fillRect(0, 0, w, h);
        g.fillStyle = 'rgba(0,0,0,.18)'; for (let y = 0; y < h; y += 3) g.fillRect(0, y, w, 1);
        if (e.mode !== 'REC') {
          const by = ((t * 41) % (h + 60)) - 30;
          for (let x = 0; x < w; x += 2) if (Math.random() < .45) { g.fillStyle = Math.random() < .5 ? 'rgba(255,255,255,.4)' : 'rgba(0,0,0,.35)'; g.fillRect(x, by + ((Math.random() * 5) | 0), 2, 1); }
          if (Math.random() < .06) { g.fillStyle = 'rgba(255,255,255,.08)'; g.fillRect(0, (Math.random() * h) | 0, w, 3); }
        }
        const c = 'rgba(240,240,236,.85)';
        g.fillStyle = c;
        g.fillRect(m, m, 14, 2); g.fillRect(m, m, 2, 10); g.fillRect(w - m - 14, m, 14, 2); g.fillRect(w - m - 2, m, 2, 10);
        g.fillRect(m, h - m - 2, 14, 2); g.fillRect(m, h - m - 10, 2, 10); g.fillRect(w - m - 14, h - m - 2, 14, 2); g.fillRect(w - m - 2, h - m - 10, 2, 10);
        const mode = e.mode || 'STOP';
        if (mode === 'REC') { if (Math.sin(t * 6) > 0) { g.fillStyle = '#e02020'; g.fillRect(m + 6, m + 6, 6, 6); } txt(g, m + 16, m + 6, 'REC', 2, c); }
        else if (mode === 'PLAY') { g.fillStyle = c; for (let i = 0; i < 5; i++) g.fillRect(m + 6 + i, m + 6 + i, 1, 10 - i * 2); txt(g, m + 16, m + 6, 'PLAY', 2, c); }
        else if (mode === 'PAUSE') { g.fillStyle = c; g.fillRect(m + 6, m + 6, 2, 10); g.fillRect(m + 10, m + 6, 2, 10); txt(g, m + 16, m + 6, 'PAUSE', 2, c); }
        else txt(g, m + 6, m + 6, 'STOP', 2, c);
        g.fillStyle = c; g.fillRect(w - m - 26, m + 6, 16, 8); g.fillRect(w - m - 10, m + 8, 2, 4); g.fillStyle = 'rgba(0,0,0,.6)'; g.fillRect(w - m - 25, m + 7, 14, 6); g.fillStyle = c; g.fillRect(w - m - 24, m + 8, e.mode === 'REC' ? 10 : 4, 4);
        txt(g, m + 6, m + 22, 'SP', 2, c);
        const tc = e.tc || '--:--:--';
        txt(g, w - m - 68, m + 20, '99-03-14', 2, c);
        txt(g, w - m - 68, m + 34, tc, 2, e.odd ? '#ff8a8a' : c);
      }
    },
    maps: {
      /* ---------------- 登山口 · 土地公庙 ---------------- */
      trailhead: {
        amb: 'wind', dark: .3, plr: 3.6, fog: .18, legend: TL,
        rows: [
          'TTTTTTTTTJJ^JJTTTTTTTTTT',
          'TTTTTTTTJJJ^JJJTTTTTTTTT',
          'TTPTTTTJJ""^""JJTTTTPTTT',
          'TT"""""""""^"""""""""BTT',
          'TTkkkkkkk""d"""""""""BBT',
          'TTkkkkkkk"ddd""""""""""T',
          'TTkkkkkkkdddddd""xxxxxxT',
          'TB"kkkkk"dddddd""xxxxxxT',
          'TB""kk""dddddddddxxxxxxT',
          'T""""""ddddddddddxxxxxxT',
          'T""""""dddddddddd:xxxxxT',
          'TT"""""dddddddddd:::::::',
          'TTT"""ddddddddd:::::::::',
          'TTTTT"""dddd::::::::::::',
          'TTTTTTTTTT::::::::::::::',
          'TTTTTTTTTT::::::::::::::'],
        ents: [
          { x: 11, y: 0, spr: 'invisible', touch: S => stepsUp(S) },
          { id: 'tdg', x: 4, y: 4, w: 3, spr: 'tdg', light: { r: 2.6, col: 'rgba(255,170,80,.2)', flick: true, dx: 24, dy: 4 }, on: S => tdgOn(S) },
          { x: 5, y: 6, spr: 'xianglu', on: S => S.narr(S.f.phase === 'flee' ? '香炉里插满了香，一大把一大把的。阿嬷一定点了很多次。' : '铜香炉被香灰埋到了一半。三支香烧得正旺，烟往山上飘。\n……风明明是往山下吹的。') },
          { id: 'jinlu', x: 2, y: 4, spr: 'jinlu', light: { r: 1.6, col: 'rgba(255,130,50,.18)', flick: true }, on: S => S.narr('烧金纸的金炉，炉口还红红的。\n旁边堆着一叠刚买的寿金，用红绳子绑着。') },
          { id: 'board', x: 8, y: 4, spr: 'board', async on(S) {
            if (S.once('board')) await S.narr('庙旁边立着一块公布栏，贴着登山社的活动通知、捡到雨伞的招领……\n最底下，一张发黄的寻人启事。');
            await S.note('missing'); S.f.readMissing = true;
          } },
          { id: 'ama', x: 3, y: 6, spr: '@ama', dir: 2, on: S => amaOn(S) },
          { x: 13, y: 3, spr: 'sign', col: '#3a5a3a', on: S => S.narr('木头告示牌：\n「○○山登山步道　往凉亭 0.8K　往山顶 2.0K」\n「请勿脱队　请于天黑前下山」\n底下有人用立可白涂了一行字：「小心魔神仔」。后面画了个笑脸。') },
          { id: 'stall', x: 18, y: 4, w: 2, spr: 'stall2', col: '#3a6a5a', on: S => apoOn(S) },
          { id: 'apo', x: 20, y: 5, spr: '@apo', dir: 1, on: S => apoOn(S) },
          { x: 18, y: 8, w: 2, spr: 'car', col: '#e4e2da', on: S => S.narr(S.f.phase === 'flee' ? '二舅的车门开着，车头灯照着石阶，照进一片白茫茫的雾里。' : '二舅的白色喜美，上礼拜才洗过。\n后座有小琪吃剩的乖乖，还有一包晕车用的塑胶袋。') },
          { x: 15, y: 9, spr: 'barrel', on: S => S.narr('铁桶改的垃圾桶，桶边写着「垃圾不落地　台湾更美丽」。') },
          { id: 'lamp_h', x: 16, y: 6, spr: 'streetlamp', off: true, light: { r: 4, col: 'rgba(255,220,150,.16)' }, on: S => S.narr(S.ent('lamp_h').off ? '停车场唯一的一盏路灯。还没亮。' : '路灯亮了。飞蛾绕着灯泡打转，一圈，又一圈。') },
          { x: 23, y: 12, spr: 'invisible', solid: true, on: S => S.narr('下山的产业道路。来的时候，二舅在这条路上晕得小琪吐了两次。') },
          { id: 'erjiu', x: 17, y: 9, spr: '@erjiu', dir: 1, on: S => erjiuOn(S) },
          { id: 'jiumu', x: 10, y: 7, spr: '@jiumu', dir: 0, on: S => jiumuOn(S) },
          { id: 'awei', x: 13, y: 6, spr: '@awei', dir: 1, on: S => aweiOn(S) },
          { id: 'qi', x: 12, y: 8, spr: '@qi', dir: 0, on: S => qiOn(S) },
          { id: 'miaogong', x: 9, y: 6, spr: '@miaogong', dir: 3, hidden: true, light: { r: 2.4, col: 'rgba(255,200,120,.16)' } },
          { id: 'man1', x: 14, y: 5, spr: '@man', dir: 3, hidden: true, light: { r: 3.2, col: 'rgba(255,240,200,.14)' } },
          { id: 'man2', x: 8, y: 8, spr: '@man', dir: 3, hidden: true, light: { r: 3.2, col: 'rgba(255,240,200,.14)' } },
          { id: 'red_h', x: 11, y: 0, spr: '@red', hidden: true, solid: false }
        ],
        async enter(S, first) {
          if (S.f.phase === 'flee') return nightEnter(S);
          if (first) await opening(S);
        },
        step(S, x, y) { if (S.f.phase === 'flee' && y >= 4) return safeEnd(S); }
      },
      /* ---------------- 山间步道：竹林、凉亭、石碑岔路 ---------------- */
      trail: {
        amb: 'wind', dark: .55, plr: 3.2, fog: .3, legend: TL,
        rows: TRAIL_ROWS,
        ents: [
          { x: 11, y: 31, spr: 'invisible', touch: S => trailDown(S) },
          { x: 3, y: 1, spr: 'invisible', touch: S => branchEnd(S, 0) },
          { x: 11, y: 0, spr: 'invisible', touch: S => branchEnd(S, 1) },
          { x: 19, y: 1, spr: 'invisible', touch: S => branchEnd(S, 2) },
          { id: 'stele', x: 12, y: 6, spr: 'stele', num: 0, on: S => steleOn(S) },
          { x: 10, y: 10, spr: 'sign', col: '#5a4024', on: S => S.narr(S.f.phase === 'search' ? '路标还是那块路标：「↑ 石碑岔路　↓ 登山口」。\n……只是箭头好像被人掰歪了，歪歪地指着竹林里面。' : '木头路标：「↑ 石碑岔路・往山顶　↓ 登山口 0.8K」') },
          { id: 'pavilion', x: 14, y: 11, w: 3, spr: 'pavilion', on: S => S.narr('「望云亭」。水泥柱子上漆着红漆，漆掉得一块一块的。\n柱子上有人用原子笔写：「阿明♥小芳 1996」，旁边又被人划掉了。') },
          { id: 'bench_t', x: 14, y: 13, w: 2, spr: 'bench', on: S => benchOn(S) },
          { id: 'mag', x: 16, y: 13, spr: 'newspaper', async on(S) {
            if (S.once('mag')) await S.narr('长椅旁边压着一本被雾气泡软的八卦周刊，翻开的那页被撕了下来。');
            await S.note('weekly');
          } },
          { x: 6, y: 12, spr: 'rail', on: S => S.narr('栏杆外面就是山谷。往下看，什么都没有——只有雾，白得像一锅煮开的米汤。') },
          { x: 7, y: 12, spr: 'rail', on: S => S.narr(S.f.phase === 'search' ? '小琪刚才就趴在这里。\n栏杆上留着两个小小的、湿湿的手印。手印朝着外面。' : '生锈的铁栏杆，摸起来湿湿凉凉的。') },
          { x: 5, y: 13, spr: 'shoot', on: S => S.narr('一支刚冒出土的竹笋，笋壳上沾着泥。\n阿婆说这季节的绿竹笋最甜。可是你看着它，总觉得像一根竖起来的手指。') },
          { x: 9, y: 21, spr: 'stonegod', on: S => S.narr('竹林边上，一块披着红布的小石头，前面插着三根烧完的香脚。\n这是「石头公」，山里的土地公。你朝它点了点头。') },
          { x: 8, y: 24, spr: 'invisible', solid: true, on: S => S.narr('有一根竹子上被人用刀刻了字：「到此一游」。\n往上一点，还有一行小小的、歪歪扭扭的字，刻得很深：「来玩」。') },
          { x: 12, y: 22, spr: 'paper', on: S => S.narr('一个被踩扁的乖乖包装袋。椰子口味的。\n……小琪就爱吃这个。可是她的那包，明明还在车上。') },
          { id: 'erjiu_t', x: 12, y: 22, spr: '@erjiu', hidden: true, on: S => groupTalk(S, 'erjiu_t') },
          { id: 'jiumu_t', x: 14, y: 22, spr: '@jiumu', hidden: true, on: S => groupTalk(S, 'jiumu_t') },
          { id: 'awei_t', x: 9, y: 22, spr: '@awei', hidden: true, on: S => groupTalk(S, 'awei_t') },
          { id: 'qi_t', x: 14, y: 20, spr: '@qi', hidden: true, on: S => groupTalk(S, 'qi_t') },
          { id: 'red_g', x: 9, y: 6, spr: '@red', hidden: true, solid: false },
          { id: 'red_t', x: 11, y: 0, spr: '@red', hidden: true, solid: false },
          { id: 'fog_t', x: 11, y: 14, spr: 'fogbank', hidden: true, solid: false, z: 3 }
        ],
        async enter(S, first) {
          if (S.f.phase === 'flee') {
            S.dark(.9); S.hide('awei_t'); S.hide('jiumu_t'); S.hide('erjiu_t'); S.hide('red_g'); fleeReset(S); S.cp('flee_t');
            if (S.once('fleeT')) await S.narr('锣声！\n山下传来锣声，一下，一下，敲得又急又响。还有很多人在喊——喊的是小琪的名字。\n\n跟着锣声走。不要回头。');
            return;
          }
          if (S.f.phase === 'start') return climbStart(S);
        },
        step(S, x, y) {
          if (S.f.phase === 'up' && y <= 15) return restScene(S);
          if (S.f.phase === 'search' && y <= 8 && S.once('junction')) return junctionFirst(S);
        },
        tick(S, dt) {
          if (S.f.phase !== 'search' || W.busy) return;
          const g = S.ent('red_g'); if (!g) return;
          if (!g.hidden) { S.f._gv = (S.f._gv || 0) - dt; if (S.f._gv <= 0) g.hidden = true; return; }
          S.f._gl = (S.f._gl ?? 7) - dt; if (S.f._gl > 0) return;
          S.f._gl = 9 + Math.random() * 7;
          const p = S.pl, c = GLIMPSE.filter(([x, y]) => { const d = Math.abs(x - p.x) + Math.abs(y - p.y); return d >= 3 && d <= 7; });
          if (!c.length) return;
          const [x, y] = c[(Math.random() * c.length) | 0];
          S.place('red_g', x, y, 0); S.face('red_g', 'pl'); g.alpha = .7; S.f._gv = 1.1; S.sfx('giggle');
        }
      },
      /* ---------------- 溪谷 ---------------- */
      creek: {
        amb: 'river', dark: .74, plr: 3.2, fog: .22, legend: TL,
        rows: [
          'TTTTTTTTTTTdTTTTTTTTTTTT',
          'TTTTTTTTTTTdTTTTTTTTTTTT',
          'TTTTTTT"""ddd""TTTTTTTTT',
          'TTTTP""""""dd"""""PTTTTT',
          'TT""K""""""dd""""""K""TT',
          'T"""""""ss"dd"sss""""""T',
          'ssssssssssssssssssssssss',
          '~~~~~~~~~~~Q~~~~~~~~~~~~',
          '~~~~~~~~~~~Q~~~~~~~~~~~~',
          '~~~~~~~~~~~Q~~~~~~~~~~~~',
          'ssssssssssssssssssssssss',
          'T""""""""""dd""""XXXXX"T',
          'TT"""""""""dd""""XXXXX"T',
          'TT"""""""""dddddddddd""T',
          'TTT""TTTT""""""""""""TTT',
          'TTTT"TTTTTTTTTTTTTTTTTTT',
          'TTTTUTTTTTTTTTTTTTTTTTTT',
          'TTTTTTTTTTTTTTTTTTTTTTTT'],
        ents: [
          { x: 11, y: 0, spr: 'invisible', touch: S => creekUp(S) },
          { id: 'raincoat', x: 9, y: 5, spr: 'raincoat', solid: false, on: S => raincoatOn(S) },
          { id: 'stonegod_c', x: 14, y: 3, spr: 'stonegod', on: S => stoneGodCreek(S) },
          { id: 'boot', x: 12, y: 10, spr: 'shoes', col: '#e05a7a', on: S => S.narr('一只粉红色的小雨鞋，卡在两块石头中间。是小琪的。\n鞋子里灌满了水。鞋尖朝着对岸。') },
          { x: 4, y: 4, spr: 'invisible', solid: true, on: S => S.narr('一块长满青苔的大石头。石头底下，有人用红漆写了一个「止」字，漆已经快掉光了。') },
          { x: 19, y: 4, spr: 'invisible', solid: true, on: S => S.narr('大石头上放着一小堆排得整整齐齐的小石子。\n一颗、两颗、三颗……像是谁在等人的时候，一个人玩的。') },
          { x: 5, y: 7, spr: 'invisible', solid: true, on: S => S.narr('溪水很急，哗啦哗啦的，冷得冒白气。\n水底下的石头长满了青苔，一个一个，圆圆的，像一排低着的头。') },
          { x: 18, y: 7, spr: 'invisible', solid: true, on: S => S.narr('水面上漂着一片叶子，绕着同一块石头打转，一圈，又一圈。') },
          { id: 'shack', x: 17, y: 12, w: 5, spr: 'shack' },
          { id: 'shackdoor', x: 19, y: 12, spr: 'invisible', solid: true, async on(S) { S.sfx('open'); await S.go('shack', 5, 6, 3); } },
          { x: 21, y: 13, spr: 'invisible', solid: false, on: S => S.narr('工寮门口的泥地上，有两排小小的脚印。\n一排是雨鞋的。另一排……是光着脚的。') },
          { x: 4, y: 16, spr: 'invisible', touch: S => forestIn(S) },
          { id: 'red_c', x: 4, y: 14, spr: '@red', dir: 0, hidden: true, on: S => redCreek(S) },
          { id: 'qi_c', x: 19, y: 13, spr: '@qi2', hidden: true, on: S => qiFollow(S) }
        ],
        async enter(S, first) {
          if (S.f.phase === 'flee') {
            fleeReset(S); S.cp('flee_c');
            if (S.once('fleeC')) await S.narr('天已经全黑了。溪水的声音大得吓人。\n……可是在水声底下，你还是听得见——身后，小小的、光着的脚，踩在石头上的声音。');
            return;
          }
          if (S.f.phase === 'search') await creekFirst(S);
        }
      },
      /* ---------------- 废弃工寮 ---------------- */
      shack: {
        amb: 'room', dark: .86, plr: 2.8, wall: 'wood', floor: 'darkwood',
        rows: [
          '############',
          '############',
          '#..........#',
          '#...d......#',
          '#.......d..#',
          '#..........#',
          '#..........#',
          '#####d######'],
        ents: [
          { x: 5, y: 7, spr: 'invisible', touch: S => shackOut(S), light: { r: 2.6, col: 'rgba(150,170,200,.12)' } },
          { x: 3, y: 1, spr: 'window', on: S => S.narr('窗户的玻璃破了一半，用报纸糊着。报纸上的日期是民国七十六年。\n破掉的那一半外面，是黑漆漆的竹林。') },
          { id: 'win2', x: 8, y: 1, spr: 'window', on: S => S.narr(S.f.phase === 'flee' ? '你不看窗户。你不看。' : '窗外的竹子贴着玻璃长，叶子刮着窗框，沙——沙——。') },
          { x: 6, y: 1, spr: 'calendar', on: S => S.narr('一本旧月历，停在民国七十六年八月。\n十四号那一格，被人用红笔圈了起来。') },
          { id: 'zao', x: 10, y: 2, spr: 'zao', on: S => zaoOn(S) },
          { x: 7, y: 4, w: 2, spr: 'table2', col: '#5a4632' },
          { id: 'book', x: 7, y: 4, spr: 'note', on: async S => { if (S.once('book')) await S.narr('桌上一本被老鼠咬过的记事本，封面上用原子笔写着「工寮　记帐」。'); await S.note('logbook'); S.f.readLog = true; } },
          { x: 9, y: 6, spr: 'gourd', on: S => S.narr('一个空的米酒瓶，瓶口插着一根干掉的蜡烛。\n瓶身上贴的红标签，被人一圈一圈抠掉了。') },
          { x: 1, y: 5, h: 2, spr: 'futon', col: '#6a6a4a', solid: false, on: S => S.narr('发霉的草席，上面有一个人躺过的凹痕。\n凹痕很小，像是一个小孩子蜷着睡出来的。') },
          { x: 4, y: 3, spr: 'shoes', col: '#b81414', on: S => S.narr('一只红色的小布鞋。很旧了，鞋面上绣的花都褪成了粉色。\n小琪穿的是粉红色的雨鞋。\n……这不是小琪的。') },
          { x: 3, y: 2, spr: 'leaves', decal: true },
          { x: 2, y: 3, spr: 'leaves', decal: true },
          { id: 'qi_s', x: 2, y: 2, spr: '@qi2leaf', dir: 3, on: S => qiShack(S) },
          { id: 'red_s', x: 1, y: 2, spr: '@red', hidden: true, solid: false }
        ],
        async enter(S, first) {
          if (S.f.phase === 'flee') { fleeReset(S); return; }
          if (first) await shackFirst(S);
        }
      },
      /* ---------------- V8 观景窗（录像带画面） ---------------- */
      v8: {
        amb: 'tv', dark: 0, legend: TL,
        rows: V8_ROWS,
        ents: [
          { id: 'osd', x: 1, y: 1, spr: 'osd', solid: false, z: 5, s: { mode: 'STOP', tc: '--:--:--' } },
          { id: 'snow', x: 1, y: 1, spr: 'snow', solid: false, z: 4, hidden: true },
          /* A：登山口团体照 */
          { x: 8, y: 4, w: 3, spr: 'tdg', solid: false },
          { x: 4, y: 3, spr: 'board', solid: false, read: true },
          { x: 14, y: 4, spr: 'xianglu', solid: false },
          { id: 'vA_ama', x: 12, y: 6, spr: '@ama', dir: 0 },
          { id: 'vA_erjiu', x: 6, y: 7, spr: '@erjiu', dir: 0 },
          { id: 'vA_jiumu', x: 7, y: 7, spr: '@jiumu', dir: 0 },
          { id: 'vA_qi', x: 8, y: 8, spr: '@qi', dir: 0 },
          { id: 'vA_awei', x: 11, y: 7, spr: '@awei', dir: 0 },
          { id: 'vA_red', x: 13, y: 7, spr: '@red', dir: 0, hidden: true },
          /* B：竹林石阶（镜头在队伍最后面往上拍） */
          { id: 'vB_qi', x: 38, y: 1, spr: '@qi', dir: 3 },
          { id: 'vB_jiumu', x: 38, y: 3, spr: '@jiumu', dir: 3 },
          { id: 'vB_erjiu', x: 38, y: 5, spr: '@erjiu', dir: 3 },
          { id: 'vB_awei', x: 38, y: 7, spr: '@awei', dir: 3 },
          { id: 'vB_red', x: 38, y: 10, spr: '@red', dir: 0, hidden: true },
          /* C：石碑岔路 */
          { id: 'vC_stele', x: 67, y: 6, spr: 'stele', num: 0 },
          { id: 'vC_qi', x: 66, y: 3, spr: '@qi', dir: 3, hidden: true },
          { id: 'vC_red', x: 66, y: 2, spr: '@red', dir: 0, hidden: true }
        ]
      }
    }
  });
  /* ================= 登山口 ================= */
  async function opening(S) {
    await S.narr('下午两点四十分。山脚下的停车场，只停了二舅那台白色喜美。\n天阴阴的。山顶已经被雾吃掉了一半。');
    S.face('erjiu', 'pl'); S.bubble('erjiu', '!', 900);
    await S.say('二舅', ['好！人都到齐了齁？', '来来来，点名！秀凤，名单！']);
    S.face('jiumu', 'pl');
    await S.say('二舅妈', ['（翻开登山社的报名表）陈志明——', '……你就站在我旁边，还要点你喔？好啦，有。林秀凤——我自己。陈家伟——']);
    S.face('awei', 'jiumu');
    await S.say('阿伟', '（拔下一边耳机）……有啦。');
    await S.say('二舅妈', '陈欣琪——');
    S.bubble('qi', '♥', 900);
    await S.say('小琪', '有！有！有！我还有带雨衣！');
    await S.say('二舅妈', '李凯翔——');
    const r = await S.ask('二舅妈从名单上抬起头看你。', ['有。', '（举起 V8）报告，已经在录了。']);
    if (r === 1) { S.face('erjiu', 'pl'); await S.say('二舅', '哈哈，好！就是要这样！我们阿凯是专业的！'); }
    S.give('v8');
    await S.say('二舅', ['阿凯，V8 你负责喔。带子是新的，P6-120，两个钟头，够你从山脚录到山顶。', '录好一点，回去要拷贝给你三姑、你小阿姨她们看。', '欸，那个按钮不要乱按喔，那个是——算了，你们年轻人比我会用。']);
    S.face('ama', 'pl');
    await S.say('阿嬷', ['恁去就好，阿嬷脚没力，在土地公这里坐，等恁落来。', '阿凯，出发以前，先来跟土地公拜一下。']);
    S.f.phase = 'start';
    S.goal('去土地公庙找阿嬷拜拜，然后帮大家录团体照');
  }

  async function amaOn(S) {
    S.face('ama', 'pl');
    if (S.f.phase === 'flee' || S.f.phase === 'safe') return;
    if (!S.has('amulet')) {
      await S.say('阿嬷', '来，香给你。跟土地公讲：今天全家要上山，请伊保庇，平平安安上去，平平安安落来。');
      S.sfx('match'); await S.wait(300);
      await S.narr('你学阿嬷的样子，双手拿着香，对着庙里那尊小小的、白胡子的土地公，拜了三拜。\n香灰掉在手背上，烫了一下。');
      S.give('amulet');
      await S.say('阿嬷', ['这个平安符，阿嬷刚刚跟土地公求的。你挂着，不要拿下来。', '山里啊，有一些……有一些不是人的囡仔。阿嬷小时候，大人都叫伊「魔神仔」。', '伊会学人讲话，会叫你的名字，会请你吃好料。你若跟伊走，就转不来了。']);
      await S.say('阿嬷', ['阿嬷给你讲三项，你给阿嬷记牢：', '第一，山里有人叫你，不要随便应。先看清楚是谁。', '第二，看到不认识的囡仔，不要跟伊走。伊给你什么，都不要吃。', '第三——落山的时候，后面不管是谁叫你，都不要回头。']);
      const r = await S.ask('阿嬷认真地看着你。', ['好，我记住了。', '阿嬷，现在都一九九九年了啦。']);
      if (r === 1) await S.say('阿嬷', '一九九九年，山还是同一座山啊。');
      S.goal('去找二舅，帮大家录团体照');
      return;
    }
    const L = [['去啦去啦，天黑以前要落来喔。'], ['记牢：有人叫，不要随便应；不认识的囡仔，不要跟伊走；落山，不要回头。'], ['恁二舅喔，每次都讲走一点点就好，每次都走到天黑。']];
    await S.say('阿嬷', L[(S.f._am = ((S.f._am ?? -1) + 1)) % L.length]);
  }

  async function tdgOn(S) {
    if (S.f.phase === 'flee' || S.f.phase === 'safe') return;
    await S.narr('小小的土地公庙，比人高不了多少。红瓦、燕尾，屋脊上顶着一颗金色的珠子。\n庙里坐着一尊白胡子的土地公，笑眯眯的，手里捧着元宝。两根小红烛一闪一闪。');
    if (S.has('amulet')) await S.think('土地公，今天拜托你了。');
    else await S.think('阿嬷叫我先来拜一下……香在阿嬷那里。');
  }

  async function erjiuOn(S) {
    S.face('erjiu', 'pl');
    if (!S.has('amulet')) return S.say('二舅', ['先去给土地公拜一下啦，阿嬷在等你。', '拜完来这里，我们在庙前面拍一张，留念一下！']);
    if (!S.f.photo) return groupPhoto(S);
  }

  async function jiumuOn(S) {
    S.face('jiumu', 'pl');
    if (S.once('roster')) await S.say('二舅妈', ['阿凯，这张名单你帮我收着，我口袋放不下了。', '登山社规定的啦，每个人都要写全名。走散了才好找人——呸呸呸，乌鸦嘴。']);
    await S.note('roster'); S.f.roster = true;
  }

  async function aweiOn(S) {
    S.face('awei', 'pl');
    const L = [
      ['（拿下一边耳机）干嘛？', '爬山有什么好录的……你要是录我，我就去跳崖喔，我讲真的。'],
      ['欸，你有看那个吗？电视上播的那个。一家人去爬山，带子里多一个红衣服的小女生。', '我们班都在传，说看过那卷带子的人都会衰小。', '……我看过了。我上礼拜数学考二十八分。你自己判断。'],
      ['小琪一直问红衣小女孩的事，我妈叫我不准再讲了。', '可是我讲真的啦，那个一定是别人家的小孩，刚好走在后面，电视台在那边乱炒。']
    ];
    await S.say('阿伟', L[(S.f._aw = ((S.f._aw ?? -1) + 1)) % L.length]);
  }

  const QF = ['表哥……后面有人在叫你。', '表哥，你不要回头喔。阿嬷说不能回头。', '……那个妹妹在哭。她说她脚好痛。', '表哥，你的手好冰。'];
  async function qiFollow(S) {
    await S.say('小琪', QF[(S.f._qf = ((S.f._qf ?? -1) + 1)) % QF.length], { style: 'whisper' });
  }
  async function qiOn(S) {
    if (S.f.phase === 'flee' || S.f.phase === 'safe') return qiFollow(S);
    S.face('qi', 'pl');
    const L = [
      ['表哥！你要把我录漂亮一点喔！'],
      ['妈妈说山上会下雨，所以我穿雨衣。', '可是现在又没下雨……好热喔。'],
      ['表哥，魔神仔是什么？', '阿伟哥哥说，魔神仔会把小孩子牵走，叫小孩子吃虫虫。', '……我才不怕咧。虫虫又不好吃。']
    ];
    const i = (S.f._qq = ((S.f._qq ?? -1) + 1)) % L.length;
    await S.say('小琪', L[i]);
    if (i === 0) await S.narr('她在镜头前面转了一圈，黄色的雨衣鼓起来，像一朵花。');
  }

  async function apoOn(S) {
    S.face('apo', 'pl');
    if (S.once('apo1')) {
      await S.say('卖笋的阿婆', ['少年仔，买绿竹笋无？今仔日透早才挖的，甜甲若梨仔。', '……要上山喔？这个时间？']);
      await S.narr('阿婆抬头看了看山顶的雾，嘴里「啧」了一声。');
      await S.say('卖笋的阿婆', ['你们城市人不知道啦。这座山，我们庄里的老人都叫伊「牵人山」。', '魔神仔会牵人。老人、囡仔，最好牵。伊变作你认识的人，或者变作一个小囡仔，牵着你的手，一直走，一直走……', '走去哪里？溪沟里、竹林里、刺仔丛里。前几年那个王伯仔，三日后才找到，嘴巴塞甲满满的草，还跟人讲伊鸡腿吃甲很饱。']);
      await S.say('卖笋的阿婆', ['若是有人被牵去，就要敲锣、敲面桶，大家一路喊伊的名字——要喊全名喔，连名带姓。', '魔神仔怕吵。也怕土地公。']);
      return;
    }
    const L = ['一斤五十。不二价。', '天黑以前要落来喔。天一暗，雾就起来了。', '庙那边那张寻人启事，是我贴的。……王伯仔是我小叔啦。'];
    await S.say('卖笋的阿婆', L[(S.f._ap = ((S.f._ap ?? -1) + 1)) % L.length]);
  }

  async function stepsUp(S) {
    const ph = S.f.phase;
    if (ph === 'flee' || ph === 'safe') return;
    if (!S.has('amulet')) { await S.say('阿嬷', '阿凯——先来跟土地公拜一下，再上去！'); return S.walk('pl', 'd', 5); }
    if (!S.f.photo) { await S.say('二舅', '欸欸欸，还没拍团体照啦！回来回来！'); return S.walk('pl', 'd', 5); }
    await S.go('trail', 11, 30, 3);
  }

  /* ---------------- V8：录像 / 倒带 ---------------- */
  async function viewer(S, fn) {
    const ret = [S.map, S.pl.x, S.pl.y, S.pl.dir];
    S.hidePlayer(true);
    await S.go('v8', 10, 6, 0);
    await fn();
    await S.go(ret[0], ret[1], ret[2], ret[3]);
    S.hidePlayer(false);
  }

  async function groupPhoto(S) {
    await S.say('二舅', ['好，都来都来！在土地公庙前面拍一张！', '阿伟，耳机拿下来！小琪，站前面！妈——你也进来啦！']);
    await viewer(S, async () => {
      const o = S.ent('osd'); S.place('osd', 1, 1); o.s = { mode: 'REC', tc: '15:02:31' };
      S.hide('vA_red'); S.hide('snow');
      await S.narr('小小的观景窗里，土地公庙前面站了一排人。\n二舅比 YA，二舅妈帮小琪把雨衣帽子拉好，阿伟只肯露半张脸，阿嬷站在后面，笑得眼睛都不见了。');
      await S.say('二舅', '来！一、二、三——');
      S.sfx('tick');
      await S.say('大家', '茄子——！');
      await S.narr('你数了一下观景窗里的人：二舅、二舅妈、阿伟、小琪、阿嬷。\n五个。加上拿 V8 的你，刚好六个。');
    });
    S.f.photo = true;
    for (const id of ['erjiu', 'jiumu', 'awei', 'qi']) S.hide(id);
    await S.narr('二舅一挥手，大家沿着石阶，一个跟一个地往上爬了。\n小琪的黄雨衣夹在一片绿竹子中间，很显眼。');
    S.goal('沿着石阶上山（V8 继续录）');
  }

  const CPOS = { 0: [[61, 5, 1], [60, 5, 0]], 1: [[66, 3, 3], [66, 2, 0]], 2: [[71, 5, 2], [72, 5, 0]] };
  async function playback(S) {
    if (!S.has('v8')) return;
    await viewer(S, async () => {
      const o = S.ent('osd');
      for (; ;) {
        S.pos(10, 6); S.place('osd', 1, 1); o.s = { mode: 'STOP', tc: '--:--:--' };
        S.hide('vA_red'); S.hide('vB_red'); S.hide('snow');
        const opts = CLIPS.map(c => c.label + (S.f['seen' + c.k] ? '' : '　●')).concat(['（停止播放）']);
        const r = await S.ask('观景窗里的画面停住了。要倒到哪一段？', opts);
        if (r >= CLIPS.length) break;
        await showClip(S, CLIPS[r]);
      }
    });
    await afterPlayback(S);
  }

  async function showClip(S, c) {
    const o = S.ent('osd');
    S.fx('static', { dur: .5 }); S.sfx('tv');
    if (c.p >= 0) { const X0 = PANEL[c.p]; S.pos(X0 + 10, 6); S.place('osd', X0 + 1, 1); }
    o.s = { mode: 'PLAY', tc: c.tc, odd: c.k >= 'D' };
    S.f['seen' + c.k] = true;
    await S.wait(400);
    if (c.k === 'A') {
      S.show('vA_red');
      await S.narr('画面晃了一下，稳住了。土地公庙前面，大家挤成一排。\n二舅比 YA，二舅妈在帮小琪拉雨衣帽子，阿伟只露半张脸，阿嬷在后面笑。');
      await S.narr('……你数了一遍。\n一、二、三、四、五。');
      S.sfx('sting'); S.bubble('vA_red', '…', 1600);
      await S.narr('——六。');
      await S.narr('阿伟旁边，站着一个穿红衣服的小女孩。比小琪还矮一点，短短的西瓜皮头。\n她没有看镜头，也没有笑。就那样直直地站着，好像本来就是这家人的一份子。');
      await S.think('拍的时候，观景窗里明明只有五个人。我数过的。');
      const r = await S.ask('要看清楚一点吗？', ['按暂停，放大她的脸', '（不要看）']);
      if (r === 0) {
        o.s = { mode: 'PAUSE', tc: c.tc };
        await S.narr('你按下暂停，一格一格往前推。画质糊成一片，可是那张脸——');
        await S.scare('face', { spr: '@redface', sfx: 'scare' });
        await S.narr('那不是小孩子的脸。\n皮肤皱巴巴的，像在水里泡了很久；两只眼睛是两个黑黑的洞；嘴角往两边扯开，像在笑，又不像在笑。\n像一个很老很老的人，硬把自己塞进了一个小孩子的身体里。');
        S.f.zoomed = true;
      }
    } else if (c.k === 'B') {
      S.show('vB_red');
      await S.narr('竹林里的石阶。你走在队伍最后面，镜头往上拍：小琪的黄雨衣、二舅妈的草帽、二舅的白帽子、阿伟的运动服，一个接一个往上爬。');
      S.sfx('heart');
      await S.narr('然后你看见了。\n阿伟后面、你前面，隔着三四个台阶——红色的衣服。');
      await S.narr('她就走在你和阿伟中间。\n可是她的脸，是朝着镜头的。她倒退着，一阶、一阶，往上走。\n一直、一直看着你。');
      await S.think('……我一路都走在最后面。我前面，明明只有阿伟。');
    } else if (c.k === 'C') {
      S.place('snow', 1, 1);
      await S.narr('凉亭。二舅在讲电视上的事，小琪趴在栏杆上朝镜头挥手——\n画面突然一阵雪花。');
      await S.narr('雪花里有声音。很小，很近，好像有人把嘴贴在麦克风上：');
      S.sfx('whisper');
      await S.say('？？？', '……来玩嘛。', { style: 'whisper' });
      S.hide('snow'); S.fx('static', { dur: .4 });
      await S.narr('雪花停了。画面里，栏杆边上已经没有人了。\n二舅妈的声音在很远的地方喊：小琪？……小琪！');
    } else {
      const [q, rr] = CPOS[c.br];
      S.place('vC_qi', q[0], q[1], q[2]); S.place('vC_red', rr[0], rr[1], rr[2]);
      S.ent('vC_stele').num = SEQ.indexOf(c.br);
      if (c.k === 'D') {
        await S.narr('天色暗了很多。是凉亭再上去的那个石碑岔路——镜头对着左边那条长满杂草的旧路。');
        await S.narr('小琪走在前面，没穿雨衣，手里抓着一把叶子。红衣小女孩牵着她的另一只手。\n走进左边那条路之前，红衣小女孩停下来，回过头，看了镜头一眼。');
        await S.think('时间码 17:26。\n……现在才五点出头。这一段，我根本没有录过。');
      } else if (c.k === 'E') {
        await S.narr('石碑岔路。小琪被牵着，走进了右边那条废弃的产业道路。\n她边走边把叶子往嘴里塞，嚼得很认真，好像在吃什么很好吃的东西。');
        S.sfx('giggle');
        await S.narr('红衣小女孩回过头来，对着镜头，竖起一根手指，放在嘴巴前面。\n嘘。');
      } else {
        await S.narr('石碑岔路。这一次，她们走的是中间那条往上的路。');
        await S.narr('画面跟着她们往前走，晃得很厉害——拍的人一直跟在后面。\n拍的人在喘，喘得很重。');
        await S.think('……那是我的喘气声。');
        S.sfx('water');
        await S.narr('最后一格画面里，路的尽头不是山顶。\n是水声。很大、很大的水声。');
      }
      S.hide('vC_qi'); S.hide('vC_red');
    }
  }

  async function afterPlayback(S) {
    if (S.f.phase !== 'search' || S.map !== 'trail') return;
    const fut = S.f.seenD || S.f.seenE || S.f.seenF;
    if (fut && !S.f.aweiUp) {
      S.f.aweiUp = true;
      S.face('awei_t', 'pl');
      await S.say('阿伟', ['你……你也看到了吧？那几段……', '17:09、17:26、17:41……现在才五点出头欸！带子怎么可能录到还没发生的事？', '而且顺序还是乱的，17:26 那段排在 17:09 前面……']);
      await S.say('阿伟', ['……不管了。带子里，她们在上面的石碑那边对不对？', '我先上去！你快点跟上来！']);
      await S.walk('awei_t', [10, 7], 6); S.face('awei_t', 2);
      S.goal('去凉亭上面的石碑岔路找小琪');
    } else if (!fut) S.goal('V8 里还有几段没看过的画面……');
  }

  async function benchOn(S) {
    if (S.f.phase === 'search') { await S.narr('你在长椅上坐下来，打开 V8 的观景窗，按下倒带。\n马达「嘰——」地转起来。'); return playback(S); }
    await S.narr('水泥长椅，坐上去冰冰的。椅脚边丢着几个烟蒂。');
  }

  /* ================= 步道 ================= */
  async function climbStart(S) {
    S.f.phase = 'up';
    const G = [['qi_t', 14, 20], ['jiumu_t', 14, 22], ['erjiu_t', 12, 22], ['awei_t', 9, 22]];
    for (const [id, x, y] of G) S.place(id, x, y, 3);
    await S.narr('石阶一进竹林，天就暗了一半。\n竹子长得又高又密，在头顶上合起来。风一吹，咿咿呀呀地响，像好多扇没关好的门。');
    await S.think('V8 继续录。走最后面的人要跟紧——名单上是这样写的。');
    const T = { qi_t: [7, 13], jiumu_t: [13, 13], erjiu_t: [10, 13], awei_t: [12, 12] };
    G.forEach(([id], i) => bg((async () => { await S.wait(i * 280); await S.walk(id, T[id], 3); S.face(id, id === 'qi_t' ? 3 : 0); })()));
    S.f.recB = true;
    S.goal('跟着大家，爬到上面的凉亭');
  }

  const GNAME = { erjiu_t: '二舅', jiumu_t: '二舅妈', awei_t: '阿伟', qi_t: '小琪' };
  async function groupTalk(S, id) {
    const ph = S.f.phase;
    if (ph === 'flee') return qiFollow(S);
    S.face(id, 'pl');
    if (ph === 'search') {
      if (id === 'awei_t' && S.f.aweiUp) return aweiJunction(S);
      if (id === 'jiumu_t') return S.say('二舅妈', S.f.aweiUp ? ['你们去……你们去。我在这里等她。', '她回来，要有人在。'] : ['带子……带子有没有录到？你坐下来，倒回去看看……']);
      if (id === 'awei_t') return S.say('阿伟', ['……我刚刚只是开玩笑的。', '我只是开玩笑的啦……']);
    }
    const L = { erjiu_t: ['跟紧喔！走最后面的人最重要！', '这片竹林喔，日本时代就有了。'], jiumu_t: ['阿凯，你走最后面，帮我看着小琪喔。'], awei_t: ['……好累。我到底为什么要来。'], qi_t: ['表哥！我走好快！', '表哥，竹子里面好像有人在笑耶。'] };
    await S.say(GNAME[id], L[id]);
  }

  async function restScene(S) {
    S.f.phase = 'rest';
    for (const [id, x, y, d] of [['erjiu_t', 10, 13, 0], ['jiumu_t', 13, 13, 0], ['awei_t', 12, 12, 1], ['qi_t', 7, 13, 3]]) S.place(id, x, y, d);
    await S.walk('pl', [11, 14], 4); S.turn(3);
    await S.narr('凉亭到了。\n「望云亭」三个字漆得红红的。栏杆外面，是一整片往下滚的雾，白得像一锅煮开的米汤。');
    await S.say('二舅', ['休息一下！喝水喝水！', '再上去一点就是石碑岔路，走中间那条，二十分钟就到山顶了。']);
    await S.say('二舅妈', '小琪！不要趴在栏杆上！');
    await S.say('小琪', ['表哥你看！都是云！', '我们在云上面耶！']);
    S.face('awei_t', 2); S.bubble('awei_t', '!', 900);
    await S.say('阿伟', ['欸，这里有人丢八卦周刊。', '「全台疯传！家庭出游录像，惊见红衣小女孩」——哈，又是这个。']);
    S.face('erjiu_t', 2);
    await S.say('二舅', ['啊这个我有看！电视有播，好几台都在播。', '一家人去爬山，回家放录像带，队伍后面多一个穿红衣服的小妹妹，全家没有人认识。', '把她的脸放大来看——跟老人一样，皱巴巴的，在那边笑。', '后来就有人在传啊，看过的人会衰，拍到的那一家也怎样怎样……', '啊都乱讲的啦！电视台就是要收视率。']);
    await S.say('二舅妈', '你在小孩子面前讲这个干嘛啦！');
    S.face('awei_t', 1);
    await S.say('阿伟', '小琪，你后面那个是谁？');
    S.face('qi_t', 0); S.bubble('qi_t', '?', 900);
    await S.say('小琪', '哪里？哪里？');
    await S.say('二舅妈', '陈家伟！你再吓她试试看！');
    S.face('erjiu_t', 'pl');
    const r = await S.ask('二舅转过来看你：「阿凯，有没有在录？」', ['有，一直在录。', '（把镜头转向小琪）']);
    if (r === 0) await S.say('二舅', '好！等一下山顶要录全景喔！');
    await S.say('小琪', ['表哥！录我！录我！', '我要跟云一起拍！']);
    S.face('qi_t', 3);
    await S.narr('她转回去，趴在栏杆上，对着雾挥手。');
    /* ---- 起雾 ---- */
    S.amb('none');
    await S.narr('就在这时候，雾上来了。');
    const fg = S.ent('fog_t'); S.place('fog_t', S.pl.x, S.pl.y); fg.alpha = 0;
    await S.alpha('fog_t', 1, 1200);
    S.dark(.68);
    await S.narr('像有人从山谷底下，把一整桶牛奶泼了上来。\n一眨眼，连两步外的二舅都只剩一个灰灰的影子。V8 的观景窗里，白茫茫一片。');
    S.sfx('giggle');
    await S.say('小琪（雾里）', ['表哥……你看，那边有一个妹妹。', '她穿红衣服耶。她说她家有好多好吃的……要请我吃鸡腿。'], { style: 'whisper' });
    await S.say('你', '小琪？不要乱跑——小琪！');
    S.hide('qi_t'); S.sfx('giggle');
    await S.wait(700);
    await S.alpha('fog_t', 0, 1600);
    S.amb('wind');
    await S.narr('雾散得跟来的时候一样快。\n栏杆边上，空荡荡的。');
    S.face('jiumu_t', 3); S.bubble('jiumu_t', '!', 1200);
    await S.say('二舅妈', '小琪？……小琪！');
    await S.say('二舅妈', '陈欣琪——！！', { style: 'big' });
    await S.narr('没有人回答。\n只有风，从竹林里一阵一阵地吹过来，竹叶沙沙沙地响，像好多小孩子凑在一起，小声地笑。');
    S.face('erjiu_t', 'pl');
    await S.say('二舅', ['……不要慌。不要慌。', '她一定是跑去哪里尿尿了。小琪！小琪！']);
    await S.narr('二舅喊了好几分钟，喊到嗓子都哑了。');
    await S.say('二舅', ['我下去！山下有人，我去叫庙公、叫阿嬷，叫大家带手电筒上来！', '秀凤你在这里不要动，她回来要有人在。阿凯、阿伟，你们在附近找——不要走远！听到没有！']);
    await S.walk('erjiu_t', [14, 19], 6); S.hide('erjiu_t');
    S.face('jiumu_t', 'pl');
    await S.say('二舅妈', ['该不会……该不会是……', '我小时候，隔壁庄有一个阿伯被牵走过，三天才找到……']);
    await S.say('阿伟', '妈！你不要乱讲啦！');
    await S.say('二舅妈', ['阿凯……你刚刚一直在录，对不对？', '带子……带子有没有录到她往哪里跑？你倒回去看看……拜托你……']);
    S.f.phase = 'search';
    S.goal('坐到凉亭的长椅上，用 V8 倒带看看');
    S.cp('search');
  }

  /* ---------------- 石碑岔路：鬼打墙 ---------------- */
  async function junctionFirst(S) {
    if (!S.f.aweiUp) { S.f.aweiUp = true; S.place('awei_t', 10, 7, 2); await S.narr('阿伟从后面追了上来，喘得说不出话。'); }
    await S.narr('石碑岔路。\n一块长满青苔的老石碑立在路边，路在这里分成三条：左边一条、中间一条、右边一条。\n三条路，都通进雾里。');
    S.face('awei_t', 'pl');
    await S.say('阿伟', ['就是这里……跟带子里一模一样。', '三条路……她们到底走哪一条？']);
    S.goal('找出小琪被带走的路（石碑岔路）');
    S.cp('loop');
  }

  async function steleOn(S) {
    const n = S.ent('stele').num || 0;
    await S.narr('一块很老的石碑，比小琪还高。正面刻着「往山顶」，旁边那一行被人凿掉了，只剩几个坑。\n' + (n ? '石碑上绑着' + ['', '一', '两'][n] + '条红布条，湿湿的，像刚从水里捞出来。' : '石碑脚下，有人排了一圈小石头，排得整整齐齐的。'));
    if (S.f.phase === 'search') { const r = await S.ask('要用 V8 倒带看看吗？', ['倒带看看', '算了']); if (r === 0) return playback(S); }
  }

  async function aweiJunction(S) {
    const r = await S.ask('阿伟抱着手臂，一直在发抖。', ['跟他一起看带子', '「你在这里等，不要乱跑。」']);
    if (r === 0) return playback(S);
    await S.say('阿伟', S.f.lp ? ['……石碑上的红布条变多了。你走对了吧？', '继续，照带子上她们走的路走。'] : ['我不会乱跑啦……', '……你快一点。天快黑了。']);
  }

  async function branchEnd(S, b) {
    const ph = S.f.phase;
    if (ph === 'flee') { await S.narr('不是这边。锣声在山下。'); return S.walk('pl', 'd', 5); }
    if (ph !== 'search') return S.walk('pl', 'd', 5);
    S.f.tries = (S.f.tries || 0) + 1;
    const old = S.f.lp || 0, ok = b === SEQ[old];
    const lp = S.f.lp = ok ? old + 1 : (b === SEQ[0] ? 1 : 0);
    if (lp >= 3) return toCreek(S);
    S.sfx('whisper');
    await S.narr('你沿着' + BRN[b] + '那条路往前走。\n雾越来越浓，竹子越来越密。走了好久好久，久到你开始怀疑，自己是不是一直在原地踏步——');
    await S.fade(1, 600);
    S.pos(11, 8, 3); S.ent('stele').num = lp;
    if (S.f.aweiUp) S.place('awei_t', 10, 7, 2);
    await S.fade(0, 600);
    let m = '……又回到了石碑前面。\n';
    if (lp > old) m += '可是石碑上，多绑了一条红布条。刚刚还没有的。\n雾好像，薄了一点点。';
    else if (lp === 0 && old > 0) m += '石碑上的红布条，一条也不见了。';
    else if (lp === 1) m += '石碑上，还是只绑着一条红布条，湿湿的，往下滴水。';
    else m += '一样的青苔，一样的三条路。';
    if (lp > old) S.sfx('chime'); else S.sfx('heart');
    await S.narr(m);
    await aweiHint(S, b);
  }

  async function aweiHint(S, b) {
    if (!S.f.aweiUp) return;
    S.face('awei_t', 'pl');
    if (S.once('hint0')) {
      await S.say('阿伟', ['……你怎么又从下面走上来？你不是往' + BRN[b] + '走了吗？', '我一直站在这里，看着你走进去……然后你就从我后面走出来了。']);
      await S.say('阿伟', ['这是……鬼打墙吧？', '我阿公讲过，魔神仔会让人在同一个地方一直绕、一直绕，绕到天黑。', '要……要照它走过的路走，才走得出去。']);
      return;
    }
    if (S.f.tries >= 3 && S.f.lp === 0 && S.once('hint1')) {
      await S.say('阿伟', ['欸，带子……带子上那三段，时间是乱的对不对？', '会不会……要照时间的顺序走？先走最早的那一段，再走下一段？']);
      return;
    }
    if (S.f.tries >= 6 && S.f.lp === 0 && S.once('hint2')) {
      await S.say('阿伟', ['照时间排：17:09、17:26、17:41。', '你再倒带看一次，看那三段里，她们各走的是哪一条路。我帮你记。', '……还有，你看石碑上的红布条。走对了，它就会多一条。']);
    }
  }

  async function toCreek(S) {
    S.sfx('chime');
    await S.narr('你沿着中间那条路往前走。\n这一次，路没有把你送回石碑前面。');
    S.sfx('water');
    await S.narr('路开始往下走——明明是往山顶的路，却越走越低。竹子变成了芒草，芒草变成了大石头。\n……然后你听到了水声。很大、很大的水声。跟录像里的一模一样。');
    await S.go('creek', 11, 1, 0);
  }

  async function trailDown(S) {
    const ph = S.f.phase;
    if (ph === 'flee') { carryQi(S, 'qi_t', 'qi'); return S.go('trailhead', 11, 1, 0); }
    if (ph === 'up') { await S.say('二舅（上面）', '阿凯——跟上来啊！走最后面的人要跟紧！'); return S.walk('pl', 'u', 5); }
    if (ph === 'search') { await S.narr('二舅已经下山叫人了。\n你得在上面找。小琪一定还在这座山上。'); return S.walk('pl', 'u', 5); }
    await S.walk('pl', 'u', 5);
  }
  /* ================= 溪谷 ================= */
  async function creekFirst(S) {
    S.f.phase = 'creek';
    await S.narr('雾在这里散开了。\n山谷底下是一条溪，溪水在石头中间翻着白沫。天已经快黑了，对岸的竹林黑压压的一片。');
    await S.say('你', '阿伟？');
    await S.narr('没有人回答。\n身后只有雾，和你刚刚走下来的那条小路。阿伟没有跟上来。\n……也许，从一开始，就只有你一个人走进来了。');
    S.goal('沿着溪边找小琪');
    S.cp('creek');
  }

  async function raincoatOn(S) {
    if (S.has('raincoat')) return;
    S.hide('raincoat'); S.give('raincoat');
    await S.narr('溪边的大石头上，挂着一件黄色的小雨衣。\n是小琪的。湿透了，冰冰的。两个口袋里塞满了嚼烂的草叶。');
    await S.think('……她把雨衣脱了。为什么？');
    S.sfx('giggle');
    const e = S.ent('red_c'); S.show('red_c'); e.alpha = 0; S.focus(4, 12);
    await S.alpha('red_c', 1, 1200);
    await S.narr('对岸。\n林子边上，站着一个穿红衣服的小女孩。\n她没有动，也没有出声。就站在那里，看着你。');
    S.focus(null);
    await S.narr('她右手边，对岸的下游，竹林里露出一角生锈的铁皮屋顶。');
    S.goal('踩着溪里的石头过溪，去对岸的工寮看看');
    S.cp('creek2');
  }

  async function stoneGodCreek(S) {
    await S.narr('溪边也有一个石头公。红布褪成了粉红色，前面的香炉，是一个生锈的铁罐头。');
    if (S.once('prayC')) {
      await S.narr('你身上没有香。你只是双手合十，低头拜了三拜。\n土地公，拜托你，帮我找到小琪。');
      S.sfx('chime');
      await S.narr('一阵风从你背后吹过来，吹过溪面，一直吹到对岸——吹向那个铁皮屋顶。\n芒草全部倒向那一边，像很多只手，指着同一个方向。');
    }
  }

  async function redCreek(S) {
    if (S.f.phase === 'flee') return;
    S.face('red_c', 'pl');
    const r = await S.ask('红衣小女孩朝你招了招手。\n她身后的林子里，有一条你刚才没看见的小路，黑漆漆的。', ['跟她走', '「小琪在哪里？」', '不要过去']);
    if (r === 0) return followBad(S);
    if (r === 1) {
      await S.narr('她不说话。\n她歪着头，伸出一只手，指了指身后那条黑漆漆的小路。然后，又朝你招了招手。');
      await S.think('……阿嬷说：看到不认识的囡仔，不要跟伊走。');
    }
    await S.narr('你往后退了一步。');
    S.sfx('giggle');
    await S.alpha('red_c', 0, 700);
    await S.narr('一眨眼，她就不见了。\n林子边上只剩那条小路。小路上铺满了落叶，落叶上有一排小小的、光着的脚印，往林子里面去。');
    S.f.redGone = true;
  }

  async function forestIn(S) {
    if (S.f.phase === 'flee') return;
    const r = await S.ask('林子里黑漆漆的。很远的地方，好像有个小孩子在笑。\n「表哥——来嘛——」', ['往里面走', '退回去']);
    if (r === 0) return followBad(S);
    await S.walk('pl', [4, 14], 5);
  }

  async function followBad(S) {
    S.place('red_c', 4, 15, 3); S.ent('red_c').alpha = 1;
    await S.narr('你朝她走过去。\n溪水好像一下子变浅了。你踩着石头过了溪，鞋子一点都没湿。');
    await S.say('红衣小女孩', '……走吧。我家有好多好吃的。', { style: 'whisper' });
    await S.narr('她牵起你的手。她的手好小，好冰。\n她带着你往林子里面走。小路一直往下、一直往下，竹子在你身后，一根一根地合起来。');
    S.amb('none'); await S.fade(1, 1500);
    await S.end({ bad: true, title: '去她家吃好料', text: '三天以后，搜救队在后山的溪沟里找到了你。\n你坐在一块大石头上，嘴巴里塞满了草叶，还有一只活的蚱蜢。\n你一直笑，跟每个人说：有一个穿红衣服的小妹妹，请你吃了好多好多鸡腿。\n\n小琪没有找到。\n\n你的 V8 掉在你脚边，电池早就没电了。\n后来有人把带子倒回去看。最后一段，是从一个很矮、很矮的角度，往上拍你的脸。\n你在笑。' });
  }

  async function creekUp(S) {
    if (S.f.phase === 'flee') { carryQi(S, 'qi_c', 'qi_t'); return S.go('trail', 11, 1, 0); }
    await S.narr('上面那条路，已经被雾吃掉了。\n你往上走了几步，脚底踩到的，又是溪边的沙子。');
    await S.walk('pl', 'd', 5);
  }

  /* ================= 工寮 ================= */
  async function shackFirst(S) {
    S.f.phase = 'shack';
    await S.narr('工寮里一股霉味，混着烂竹笋的酸味。\n铁皮屋顶破了几个洞，最后一点天光从洞里漏下来，照着满地的落叶。');
    S.sfx('whisper');
    await S.narr('角落里，有人在小声地哼歌。\n「妹妹背着洋娃娃，走到花园来看花……」');
    await S.think('小琪！');
    S.goal('到角落去看看小琪');
    S.cp('shack');
  }

  async function qiShack(S) {
    if (S.f.phase === 'flee') return qiFollow(S);
    if (!S.f.qiMet) {
      S.f.qiMet = true;
      await S.narr('小琪背对着你，蹲在角落里，一边哼歌，一边从地上捡东西往嘴里塞。');
      await S.say('你', '……小琪？');
      await S.narr('歌声停了。');
      S.face('qi_s', 0);
      await S.scare('face', { spr: '@qi2leaf', sfx: 'sting' });
      await S.narr('她转过来。\n嘴巴里塞满了草叶，绿色的汁从嘴角流下来。眼睛睁得大大的，可是好像看不见你。\n她嘴里还有东西在动。是一只蚱蜢。');
      await S.say('小琪', ['表哥，你来了。', '你要不要吃？那个妹妹给我的鸡腿。好好吃喔。'], { style: 'whisper' });
      const r = await S.ask('小琪把满手的草叶递过来。\n可是在你眼里，那确确实实是一只油亮亮、热腾腾的鸡腿。', ['（接过来）', '（一巴掌拍掉她手里的东西）']);
      if (r === 0) return eatBad(S);
      S.sfx('thud');
      await S.narr('草叶撒了一地。小琪眨了眨眼，又低下头，从地上一片一片捡起来，继续往嘴里塞。');
      await S.say('小琪', ['妹妹说，等一下要带我去她家。', '她家在很里面很里面。那里都没有大人，可以一直玩、一直玩。'], { style: 'whisper' });
      await S.think('阿嬷说过……卖笋的阿婆也说过……\n要怎么样，才能把她叫回来？');
      S.goal('想办法叫醒小琪（工寮里找找线索）');
      return;
    }
    for (; ;) {
      const r = await S.ask('小琪蹲在角落里嚼着草叶，一点反应也没有。', ['敲铁锅', '把平安符塞进她手里', '大声喊她的名字', '（先等等）']);
      if (r === 3) return;
      if (r === 0) {
        if (!S.has('pot')) { await S.narr('手边没有能敲的东西。\n……灶上好像搁着一口锅。'); continue; }
        for (let i = 0; i < 3; i++) { S.sfx('thud'); S.shake(220, 2); await S.wait(320); }
        S.f.gong = true;
        await S.narr('「哐！哐！哐！」\n铁锅的声音在铁皮屋里撞来撞去，震得耳朵嗡嗡响。\n角落的黑暗里，有什么东西「嘶」地缩了一下。小琪嚼东西的嘴，停住了。');
        continue;
      }
      if (r === 1) {
        if (S.f.fu) { await S.narr('平安符已经握在她手里了。'); continue; }
        if (!S.f.gong) { await S.narr('你把平安符塞进她手里。她的手一松，符就掉在地上。\n四周太安静了，安静得只听得见她嚼叶子的声音，还有角落里另一个很轻的呼吸声。\n……得先把「那个东西」吓开才行。'); continue; }
        S.f.fu = true; S.take('amulet');
        await S.narr('这一次，小琪的手指慢慢收紧，握住了那个小小的红布袋。\n香灰的味道，淡淡地散开。');
        continue;
      }
      if (!S.f.gong || !S.f.fu) {
        await S.narr('你喊了她一声。她连头都没抬。\n……顺序不对吗？卖笋的阿婆说过，魔神仔怕吵，也怕土地公。');
        continue;
      }
      const NAMES = ['「小琪——！」', '「琪琪——！」', '「陈欣琪——！」', '「陈家琪——！」'];
      const n = await S.ask('要喊什么？', NAMES, '你');
      if (n !== 2) {
        S.sfx('giggle');
        await S.narr('你喊了：' + NAMES[n] + '\n角落里，有人跟着你喊了一声：' + NAMES[n] + '\n是一个小女孩的声音。不是小琪。\n小琪没有反应。');
        await S.think('「喊小名没有用。小名，魔神仔也会叫。」\n……要连名带姓。');
        continue;
      }
      return wake(S);
    }
  }

  async function eatBad(S) {
    await S.narr('你接了过来。\n鸡腿热热的，油亮亮的，香得要命。你一整个下午都没吃东西了。');
    await S.narr('你咬了一口。');
    S.amb('none'); S.sfx('giggle');
    await S.narr('……好好吃。\n小琪在笑。角落里，还有另一个小女孩，也在笑。');
    await S.fade(1, 1500);
    await S.end({ bad: true, title: '好好吃', text: '搜救队找了四天。\n\n第四天傍晚，有人在后山一间废弃的工寮里，找到了两个人——一个大学生，一个小女孩。\n他们并排坐在角落里，嘴巴里塞满了草叶，一边嚼，一边笑。\n\n大人问他们这几天在做什么。\n他们说，在一个小妹妹家里吃好料。\n那个小妹妹的家，在很里面、很里面。' });
  }

  async function zaoOn(S) {
    if (S.ent('zao').open) return S.narr('灶里只剩冷掉的灰。灰上有几个小小的手指印。');
    S.ent('zao').open = true; S.give('pot');
    await S.narr('砖砌的灶上搁着一口生锈的铁锅，锅耳上挂着一支大汤匙。\n你把锅拿起来，很重。随手敲了一下——「哐」。\n角落里的哼歌声，断了一拍。');
    if (S.f.readLog) await S.think('……「魔神仔怕吵，怕锣鼓。」');
  }

  async function wake(S) {
    await S.say('你', '陈欣琪——！！', { style: 'big' });
    await S.narr('你的声音在铁皮屋里撞了好几下。');
    await S.say('你', ['陈欣琪！你给我回来！', '陈欣琪——转来哦——！']);
    S.sfx('scream'); S.shake(700, 3);
    await S.narr('角落里的黑暗尖叫了一声。不是小琪的声音——是一个又尖又细、像指甲刮铁皮的声音。');
    S.ent('qi_s').spr = '@qi2';
    await S.narr('小琪忽然弯下腰，「呕」地一声，吐出一大口东西——草叶、泥巴、嚼碎的竹叶，还有一只还在挣扎的蚱蜢。');
    S.sfx('cry');
    await S.say('小琪', ['……表哥？', '表哥……这里是哪里？我好冷……我的雨衣呢……', '那个妹妹说……她说要带我去吃鸡腿……她说她家……']);
    await S.say('你', '没事了。表哥在这里。我们回家。');
    if (S.has('raincoat')) { S.take('raincoat'); S.ent('qi_s').spr = '@qi'; await S.narr('你把湿掉的黄雨衣披在她身上。她抓着你的衣角，抓得好紧。'); }
    else await S.narr('她抓着你的衣角，抓得好紧。');
    S.sfx('giggle');
    await S.narr('就在小琪刚刚蹲的那个角落里——\n有人，笑了一声。');
    S.turn(0);
    await S.narr('你没有转过去看。\n你想起记事本上最后那一句话，想起阿嬷说的第三件事。\n\n落山的时候，后面不管是谁叫你，都不要回头。');
    S.face('qi_s', 0); S.follow('qi_s', true);
    S.f.phase = 'flee'; S.f._sp = 1.4; S.f._st = 0; S.f._vo = 3; S.f._gg = .6;
    S.goal('牵着小琪下山：一直往前走，不要回头！');
    S.cp('flee_s');
  }

  async function shackOut(S) {
    if (S.f.phase === 'flee') { carryQi(S, 'qi_s', 'qi_c'); return S.go('creek', 19, 13, 1); }
    await S.go('creek', 19, 13, 0);
  }

  /* ================= 下山 · 结局 ================= */
  async function nightEnter(S) {
    S.dark(.8); S.ent('lamp_h').off = false;
    for (const [id, x, y, d] of [['erjiu', 10, 5, 3], ['jiumu', 12, 6, 3], ['awei', 13, 5, 3], ['miaogong', 9, 6, 3], ['man1', 14, 4, 3], ['man2', 8, 8, 3], ['ama', 3, 6, 2]]) S.place(id, x, y, d);
    S.ent('erjiu').light = { r: 3, col: 'rgba(255,240,200,.14)' };
    S.hide('apo');
    fleeReset(S); S.cp('flee_h');
    if (S.once('fleeH')) await S.narr('石阶底下有光！\n手电筒的光、土地公庙的烛光——还有锣声，就在下面！');
  }

  async function safeEnd(S) {
    S.f.phase = 'safe'; S.goal('');
    S.stop('red_h'); S.hide('red_h');
    S.follow('qi', false);
    await S.walk('pl', [11, 5], 5); S.turn(0);
    S.place('qi', 11, 4, 0);
    for (let i = 0; i < 3; i++) { S.sfx('thud'); S.shake(260, 2); await S.wait(260); }
    await S.narr('「哐！哐！哐！」\n庙公把锣敲得震天响。手电筒的光一下子全照了过来。');
    S.face('miaogong', 'pl');
    await S.say('庙公', '落来啊！人落来了！');
    S.face('jiumu', 'qi'); S.bubble('jiumu', '!', 900);
    await S.say('二舅妈', '小琪——！！');
    S.place('jiumu', 12, 4, 1);
    await S.narr('二舅妈冲过来，一把把小琪抱进怀里，哭得整个人都在抖。');
    S.face('ama', 2);
    await S.say('阿嬷', ['欣琪啊——转来哦——', '陈欣琪——转来哦——']);
    await S.say('大家', '陈欣琪——转来哦——！', { style: 'big' });
    S.place('red_h', 11, 1, 0); const R = S.ent('red_h'); R.alpha = 0;
    S.focus(11, 2);
    bg(S.alpha('red_h', .9, 900));
    await S.narr('二舅妈忽然尖叫了一声，指着你身后的石阶。\n你没有回头。可是所有的手电筒，都照了过去——');
    await S.narr('石阶的最上面，雾里，站着一个小小的、红色的影子。\n她就站在那里，看着底下的一群人，看着土地公庙里那两点烛光。');
    S.sfx('thud'); S.shake(300, 2);
    await S.say('庙公', '走！不要再来了！这个囡仔有人顾！', { style: 'big' });
    S.sfx('thud'); await S.wait(300); S.sfx('thud');
    await S.narr('锣声一下一下地响。她往后退了一步，又退了一步。\n然后，她转过身，走回了雾里。');
    S.face('red_h', 3);
    await S.alpha('red_h', 0, 1400);
    S.focus(null);
    S.sfx('cry');
    await S.narr('小琪「哇」地一声哭了出来，又吐了一地的草叶。');
    S.face('awei', 'pl');
    await S.say('阿伟', ['阿凯！你跑去哪里了啦！', '我在石碑那边一转头，你就不见了！我喊了半个钟头，喊到没声音……我还以为……']);
    S.face('erjiu', 'pl');
    await S.say('二舅', ['……没事了，没事了。人回来就好。', '阿凯，谢谢你。']);
    await S.say('小琪', ['表哥……', '那个妹妹说……她说，下次还要找我玩。'], { style: 'whisper' });
    await S.narr('没有人接话。');
    S.face('ama', 'pl');
    await S.say('阿嬷', ['土地公有保庇。', '……阿凯，你那台 V8，等一下拿来给阿嬷。']);
    await S.fade(1, 1200);
    await S.card('那天晚上', '', '庙公替小琪收了惊。\n阿嬷在土地公面前跪了很久、很久。\n\n回家的车上，小琪睡着了，手里还紧紧握着那个平安符。\n二舅说，带子回去要拷贝给每一家。\n\n你说，带子你先保管。');
    const r = await S.ask('那卷 P6-120 的带子，后来——', ['交给阿嬷，在金炉里烧掉', '自己收起来，再也不看']);
    if (r === 0) return S.end({ title: '第六夜　完', text: '第二个礼拜天，阿嬷把带子丢进了土地公庙的金炉。\n塑胶烧起来有一股很呛的味道，黑烟一直往山上飘。\n\n后来，电视上又播了一次别人家的那段录像。你转台转得很快。\n\n你一直没有跟任何人说：\n带子丢进火里以前，你偷偷看了最后一次。\n最后一格，是登山口的团体照。\n二舅、二舅妈、阿伟、小琪、阿嬷。\n还有站在小琪旁边，牵着她的手的——' });
    return S.end({ title: '第六夜　完', text: '那卷带子，一直锁在你书桌最下面的抽屉里。\n你再也没有把它放进 V8。\n\n只是有几个晚上，你半夜醒过来，\n会听见抽屉里，传出很轻、很轻的声音。\n\n嘰——\n\n像有人在里面，把带子倒回去。' });
  }
})();
