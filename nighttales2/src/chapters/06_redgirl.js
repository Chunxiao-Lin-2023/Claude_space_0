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
    S.follow(from, false); S.hide(from);
    const e = S.ent(to); e.spr = '@qi2'; S.show(to); S.follow(to, true);
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

  const RED_P = { skin: '#e6dcd2', hair: '#0c0808', hs: 'bob', child: true, dress: true, top: '#c81212', top2: '#7a0606', bottom: '#c81212', shoes: '#a80c0c', eye: '#050303' };

  defChapter({
    id: 'redgirl', n: 6, title: '红衣小女孩', sub: '一卷家庭登山录像带。队伍最后面，跟着一个谁也不认识的红衣小女孩。', origin: '台湾都市传说', color: '#1d3a24',
    icon: '@red', amb: 'wind', floor: 'dirt', wall: 'wood', dark: .5, plr: 3.4,
    tileOpts: { grassC: '#284a2a', treeC: '#173520' },
    legend: { J: 'bamboo', '^': 'steps', Q: 'steppingstone', X: 'base', U: 'mudpath' },
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
        txt(g, m + 6, h - m - 16, 'SP', 2, c);
        txt(g, w - m - 70, h - m - 30, '99-03-14', 2, c);
        txt(g, w - m - 70, h - m - 16, e.tc || '--:--:--', 2, e.odd ? '#ff8a8a' : c);
      }
    },
    maps: {
      /* ---------------- 登山口 · 土地公庙 ---------------- */
      trailhead: {
        amb: 'wind', dark: .3, plr: 3.6, fog: .18,
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
        amb: 'wind', dark: .55, plr: 3.2, fog: .3,
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
            S.dark(.9); S.plr(3); fleeReset(S); S.cp('flee_t');
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
        amb: 'river', dark: .74, plr: 3.2, fog: .22,
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
          { id: 'qi_c', x: 19, y: 13, spr: '@qi2', hidden: true }
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
        amb: 'tv', dark: 0, plr: 0,
        rows: V8_ROWS,
        ents: [
          { id: 'osd', x: 1, y: 1, spr: 'osd', solid: false, z: 5, s: { mode: 'STOP', tc: '--:--:--' } },
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
/*@FUNCS@*/
})();
