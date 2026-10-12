/* ================= 第十夜 · 哭泣的女人 ================= */
(() => {
  const bg = p => { if (p && p.catch) p.catch(() => { }); return p; };
  /* 哭泣的女人：正面有泪痕和水渍；背面湿透的黑发透过面纱垂下来，往下滴水 */
  function lloExtra(g, d, fr, G, R) {
    if (d === 0) { R(5, G.tT + 2, 1, 5, '#a8b8c4'); R(10, G.tT + 3, 1, 6, '#a8b8c4'); R(7, G.tB + 1, 1, 3, '#9aaebc'); }
    else if (d === 3) { R(5, G.hT + 1, 6, G.tT - G.hT + 5, '#18141c'); R(4, G.hT + 3, 1, 6, '#2a2630'); R(11, G.hT + 3, 1, 6, '#2a2630'); R(6, G.tT + 6, 1, 3, '#18141c'); R(9, G.tT + 7, 1, 2, '#18141c'); R(7, G.tB + 2, 1, 2, '#7a90a4'); R(10, G.tB, 1, 4, '#c0c4cc'); }
    else { R(9, G.hT + 3, 3, G.tT - G.hT + 4, '#18141c'); R(10, G.tT + 6, 1, 2, '#7a90a4'); }
  }
  const GLOW = { r: 2.2, col: 'rgba(170,200,235,.16)' };
  const caught = async S => {
    await S.scare('face', { spr: '@llorona', sfx: 'scream' });
    await S.die('一双冰凉的、湿透的手从背后抱住了你。\n「Por fin……mis hijos……」（终于……我的孩子们……）\n河水漫过了头顶。一点也不冷。', '她找到了「她的孩子」');
  };
  function ghostOff(S, id) { const e = S.ent(id); if (!e) return; S.stop(id); e.hidden = true; e.alpha = 1; }
  /* 玉米地：错路尽头的水洼 [触发格] -> [水洼x, 水洼y, 退回的岔路口] */
  const TRAPS = { '6,8': [6, 10, [10, 5], 1], '14,16': [14, 18, [10, 13], 2], '6,24': [6, 26, [10, 21], 3] };
  /* 逃跑时：拐过弯，错路尽头的水洼里会冒出她来 [水洼x, 水洼y, 编号] */
  const AMBUSH = { '14,21': [6, 26, 3], '6,18': [14, 18, 2], '14,10': [6, 10, 1] };
  const FORKS = {
    '10,5': ['路在这里分成了两条。\n哭声好像从四面八方一起传过来，分不清是哪一边。', '……右边那条路上，撒着几片橘黄色的花瓣。', '右边的路上有花瓣。'],
    '10,13': ['又是一个岔路口。\n左边的玉米地里，哭声很响——响得像有人就贴在你耳朵边上哭。\n右边……几乎什么也听不见。', '花瓣没有了。迭戈手里那把花，大概已经撒完了。\n楚伊大叔说过：哭声近，她就远；哭声远——', '左边哭声很近。右边，静得什么也听不见。'],
    '10,21': ['第三个岔路口。\n这一次，右边的哭声大得连玉米叶子都在抖。\n左边静悄悄的，静得能听见水洼里一滴一滴落水的声音。', '……哭声近，她就远。\n听不见的地方，才是她在的地方。', '右边哭声震耳。左边，只有滴水声。']
  };

  defChapter({
    id: 'llorona', n: 10, title: '哭泣的女人', sub: '亡灵节之夜，河边有个女人一直在哭：「哎呀，我的孩子们！」', origin: '墨西哥民间传说', color: '#1d3a4c',
    icon: '@llorona', amb: 'night', floor: 'dirt', wall: 'mud', dark: .74, plr: 3.4,
    people: {
      me: { skin: '#c98f62', hair: '#1a1010', hs: 'twin', child: true, dress: true, top: '#b8443e', top2: '#ecdcb4', bottom: '#b8443e', shoes: '#4a3020' },
      diego: { skin: '#c48a5c', hair: '#1a1010', hs: 'messy', child: true, top: '#e8e2d0', top2: '#c8c0a8', bottom: '#3a4a6a', shoes: '#5a3a22' },
      abuela: { skin: '#a87050', hair: '#c8c8c8', hs: 'bun', hat: 'scarf', hatC: '#3a3a5a', top: '#4a2a3a', bottom: '#2a2028', skirt: true, shoes: '#2a1a10' },
      llorona: { key: 'llorona', skin: '#d8d8dc', hair: '#0e0a0c', hs: 'long', cover: true, ghost: true, dress: true, top: '#e8e6e0', hat: 'veil', hatC: '#f2f0ea',
        extra: lloExtra },
      llorona_big: { key: 'llorona-big', big: true, skin: '#d8d8dc', hair: '#0e0a0c', hs: 'long', cover: true, ghost: true, dress: true, top: '#e8e6e0', hat: 'veil', hatC: '#f2f0ea',
        extra: lloExtra },
      maria: { skin: '#c8a088', hair: '#1a1010', hs: 'long', ghost: true, dress: true, top: '#f2f0ea', eye: '#2a1a1a' },
      nico: { skin: '#dcd8e0', hair: '#2a2028', hs: 'short', child: true, ghost: true, top: '#e8ecf4' },
      rosita: { skin: '#dcd8e0', hair: '#2a2028', hs: 'twin', child: true, ghost: true, dress: true, top: '#f2e8f0' },
      padre: { skin: '#d8b090', hair: '#4a4448', hs: 'short', top: '#18161c', top2: '#f0f0f0', bottom: '#18161c', robe: true, shoes: '#111' },
      ines: { skin: '#9a6a4a', hair: '#e0e0e0', hs: 'bun', hat: 'scarf', hatC: '#18161a', top: '#1e1c24', bottom: '#1e1c24', skirt: true, shoes: '#111' },
      tona: { skin: '#b07a52', hair: '#2a1a14', hs: 'bun', top: '#d86a8a', top2: '#f0e0e8', apron: '#f0e8d8', bottom: '#4a3a6a', skirt: true, shoes: '#3a2a1a' },
      beto: { skin: '#b88058', hair: '#1a1010', hs: 'short', child: true, hat: 'straw', top: '#6a8a5a', bottom: '#5a4a3a', shoes: '#4a3020' },
      carmen: { skin: '#b07a52', hair: '#1a1010', hs: 'long', hat: 'scarf', hatC: '#7a3a5a', top: '#3a5a8a', bottom: '#2a2a3a', skirt: true },
      ramiro: { skin: '#9a6644', hair: '#2a2020', hs: 'short', hat: 'straw', hatC: '#b89a5a', top: '#e8e2d0', bottom: '#e8e2d0', shoes: '#5a3a22' },
      chuy: { key: 'chuy', skin: '#a06a48', hair: '#3a2a20', hs: 'short', hat: 'straw', hatC: '#c8a860', top: '#e8e2d0', bottom: '#d8d2c0', shoes: '#6a4a2a',
        extra(g, d, fr, G, R) { if (d === 0) { R(3, G.tT + 3, 7, 5, '#a0662a'); R(5, G.tT + 4, 2, 2, '#2a1a10'); R(9, G.tT + 2, 5, 1, '#6a4020'); } else if (d === 1) { R(3, G.tT + 3, 5, 5, '#a0662a'); R(1, G.tT + 1, 3, 1, '#6a4020'); } } }
    },
    items: {
      vela: { name: '蜡烛', desc: '祖母从祭坛上拿给你的白蜡烛。「有光的地方，她不敢来。」' },
      trompo: { name: '迭戈的陀螺', desc: '一只上了红漆的木陀螺，绳子缠得整整齐齐。迭戈拿它跟贝托换了一张白纸。' },
      calavera: { name: '糖骷髅', desc: '一个糖做的小骷髅，额头上用粉红色的糖霜歪歪扭扭写着：DIEGO。' },
      huarache: { name: '小凉鞋', desc: '迭戈的一只皮编凉鞋（huarache），沾满了泥。' },
      velas: { name: '两支白蜡烛', desc: '祖母从家里祭坛上拿来的。一支给男孩，一支给女孩。' },
      flores: { name: '万寿菊', desc: '一大把橘黄色的万寿菊（cempasúchil）。据说亡灵是闻着它的香味找到回家的路的。' },
      pan: { name: '亡灵面包', desc: '圆圆的亡灵面包（pan de muerto），上面交叉的面条是骨头，中间的圆疙瘩是眼泪。' }
    },
    notes: {
      dibujo: { title: '迭戈的画', text: '一张从作业本上撕下来的纸，蜡笔画的。\n\n左边是一条蓝色的河，河上漂着一只小船，船上点着一根蜡烛。\n右边是一个穿白裙子的女人，脸上画了好多好多眼泪，一直流到地上。\n她旁边是两个小人，一个高一点，一个矮一点，都在笑。\n\n底下是迭戈歪歪扭扭的大写字母，有两个还写反了：\n「PARA LOS NIÑOS DE LA SEÑORA」\n（给那位太太的孩子们）' },
      sermon: { title: '托马斯神父的讲道稿（亡灵节）', text: '……我在神学院读过一部将近四百年前的书。那是方济各会的萨阿贡修士，请阿兹特克的老人们一句一句口述，用纳瓦特尔语记下来的。\n\n书里说，西班牙人的船还没有靠岸，特诺奇蒂特兰的人就已经看见了八个凶兆。\n第六个凶兆是这样的：夜里，常常听见一个女人在哭，一边哭一边喊——\n「我的孩子们，我们就要永远地走了！」\n「我的孩子们，我该把你们带到哪里去？」\n\n有人说，那是西瓦科亚特尔，蛇女神，生孩子的母亲们的守护者，她在为将要来临的一切哭泣。\n也有人说，那就是我们今天说的「哭泣的女人」。\n\n（这一整段被划掉了。旁边用铅笔写着：）\n不要在讲坛上讲这个，主教不会喜欢。\n可是她已经哭了四百年了。总该有一个人，为她念一句经。' },
      foto: { title: '一张老照片（背面）', text: '照片已经发黄发脆了。一个穿白衣裳的年轻女人坐在河边的石头上，怀里搂着两个孩子：男孩七八岁，女孩还很小。\n女人没有看镜头。她在看河。\n\n照片背面是褪了色的墨水字：\n「María, con Nicolás y Rosita.\n Río abajo, 1887.」\n（玛丽亚，和尼古拉斯、罗西塔。摄于河下游，1887年。）\n\n下面另有一行新一些的字，是神父的笔迹：\n「无人认领。村里人说，这就是她。愿天主怜悯。」' },
      carta: { title: '给巴勃罗的信', text: '我的巴勃罗：\n\n又是一年了。今年的万寿菊开得特别好，我挑了最黄的给你。你最爱吃的南瓜糖也做了，就是糖放多了，你别嫌甜。\n\n大家都说，是那个女人把你带走的。说你那天晚上去河边捞你的小木船，她把你当成了她自己的孩子。\n三十一年了，我恨了她三十一年。\n\n可是今年，我老是想起她的哭声。\n我也那样哭过。在河边，一整夜。\n\n孩子，要是你在那边碰见她的孩子们，就带他们一块儿回来吧。\n咱们家的花瓣路很长，够三个孩子走。\n\n——妈妈' }
    },
    legend: '「哭泣的女人」（La Llorona）是墨西哥流传最广的鬼魂传说。最常见的版本是：美丽的玛丽亚嫁给了有钱的男人，丈夫变了心、离她而去，她在绝望和愤怒中把两个孩子淹死在河里，清醒过来后自己也投了河。她死后被挡在另一个世界的门外，除非找回自己的孩子；于是她穿着白衣、蒙着面纱，永远在河边和水边游荡，哭喊着「¡Ay, mis hijos!」（哎呀，我的孩子们！），把夜里在水边逗留的孩子当成自己的孩子带走。\n\n它的源头众说纷纭。一般认为这个故事成形于殖民时期的墨西哥；也有人把它追溯得更早——十六世纪方济各会修士萨阿贡主持编写的《佛罗伦萨手抄本》，记载了西班牙人到来之前的八个凶兆，其中第六个，就是夜里有个女人哭喊着为她的孩子们哀叹。有学者把她和阿兹特克的母神西瓦科亚特尔（Cihuacóatl）联系起来；另一种流行的说法，则把她和科尔特斯的翻译兼情人玛琳切（La Malinche）混为一谈，让她成了为混血的墨西哥哭泣的母亲。\n\n这个传说遍布整个拉丁美洲和美国西南部，各地版本不同：有的说她本是被丈夫害死的女子，有的说面纱底下是一张马脸或者骷髅；据说有些地方还流传「哭声听着近，她反而远；听着远，她就在身边」的规矩——这条规矩也常被安在委内瑞拉的「口哨鬼」（El Silbón）身上。不管哪个版本，它最实在的用处，都是让孩子们天黑以后离河边、水渠和湖泊远一点。同名民歌《La Llorona》被无数歌手翻唱，从1933年起，她也一次又一次地出现在电影里。\n\n（本章的村庄、人物、1887年的老照片、玛丽亚的孩子尼古拉斯与罗西塔的名字，以及为他们摆祭坛而让哭声停止的结局，均为游戏虚构。）',
    start: { map: 'casa', x: 9, y: 4, dir: 1 },
    async intro(S) {
      await S.card('第十夜　哭泣的女人', '1952年11月1日　墨西哥米却肯州　河边的村子', '亡灵节的晚上，村里所有的蜡烛都点起来了。\n万寿菊的花瓣从每家门口一直铺到墓园，\n好让回家的死人认得路。\n\n祖母说，只有一个人，\n是永远也找不到路的。');
    },
    resume: {
      flee_r: async S => { S.place('llo_r', 12, 16, 3); S.ent('llo_r').alpha = 1; S.chase('llo_r', { spd: 2.8, wait: 1.4, catch: caught }); },
      flee_m: async S => { ghostOff(S, 'llo_m'); ghostOff(S, 'llo_m2'); S.f._mspawn = 1.6; },
      flee_p: async S => { ghostOff(S, 'llo_p'); S.f._pspawn = 1.3; }
    },
    tick(S, dt) {
      if (W.busy) return;
      const ph = S.f.phase;
      if (ph === 'flee') { S.f._bell = (S.f._bell ?? 1) - dt; if (S.f._bell <= 0) { S.f._bell = 3.4; S.sfx('bell'); } }
      if ((ph === 'milpa' || ph === 'river') && (S.map === 'milpa' || S.map === 'rio')) { S.f._cry = (S.f._cry ?? 3) - dt; if (S.f._cry <= 0) { S.f._cry = 5 + Math.random() * 3; S.sfx('cry'); } }
      if (ph === 'final' && S.map === 'pueblo') { S.f._cry = (S.f._cry ?? 4) - dt; if (S.f._cry <= 0) { S.f._cry = 8; S.sfx('cry'); S.bubble('llo_p', '…', 1600); } }
    },
    tiles: {
      petalos: { solid: false, paint(R, X, Y, o) { TILE.dirt.paint(R, X, Y, o); for (let i = 0; i < 11; i++) { const h = hash(X, Y, 90 + i); R((h * 15) | 0, (hash(Y, X, 95 + i) * 15) | 0, 2, 1 + (i % 2), ['#e8820e', '#f6a623', '#d8601a', '#ffc040'][i % 4]); } } },
      maiz: { solid: true, paint(R, X, Y) {
        speck(R, '#2a2117', ['#33291c', '#221a12'], X, Y, 10, 31);
        for (let i = 0; i < 5; i++) { const x = 1 + i * 3 + ((hash(X, Y, 40 + i) * 2) | 0), c = i % 2 ? '#8a7648' : '#6e5c36'; R(x, 0, 1, 16, c); const ly = (hash(X, Y, 50 + i) * 10) | 0; R(x - 2, ly + 2, 2, 1, '#9a8452'); R(x + 1, ly + 6, 3, 1, '#7a6640'); R(x - 1, ly + 10, 1, 2, '#5a4a2c'); }
        if (hash(X, Y, 60) < .3) R(((hash(X, Y, 61) * 12) | 0) + 2, 4, 2, 3, '#c8a050');
      } },
      agave: { solid: true, paint(R, X, Y, o) { TILE.dirt.paint(R, X, Y, o); R(7, 2, 2, 12, '#4a7a6a'); R(4, 5, 2, 9, '#3e6c5c'); R(10, 5, 2, 9, '#3e6c5c'); R(2, 9, 3, 5, '#365e50'); R(11, 9, 3, 5, '#365e50'); R(7, 2, 1, 2, '#8ab0a0'); R(3, 13, 10, 2, '#2a4a3e'); } },
      muelle: { solid: false, paint(R, X, Y) { R(0, 0, 16, 16, '#1b3149'); R(1, 0, 14, 16, '#5a4430'); for (let y = 0; y < 16; y += 4) R(1, y + 3, 14, 1, '#3a2a1e'); R(1, 0, 1, 16, '#4a3624'); R(14, 0, 1, 16, '#4a3624'); if (hash(X, Y, 3) < .4) R(5, 6, 3, 1, '#2a1e14'); } },
      tapia: { solid: true, paint(R, X, Y) { R(0, 0, 16, 16, '#5e4636'); R(0, 2, 16, 10, '#7a5a42'); R(0, 2, 16, 2, '#8e6c50'); R(0, 7, 16, 1, '#5e4636'); R((X % 2) * 8, 3, 1, 4, '#5e4636'); R(((X + 1) % 2) * 8 + 4, 8, 1, 4, '#5e4636'); R(0, 13, 16, 3, '#2e241c'); } }
    },
    sprites: {
      picado(g, e, t, R) {
        const W2 = e.w * 16, cols = ['#e8508a', '#f0a020', '#9a60d8', '#30b0a0', '#f0e040', '#e84040'];
        R(0, 1, W2, 1, '#2a2020');
        for (let i = 0; i * 7 < W2 - 5; i++) { const sw = Math.sin(t * 2.2 + i * .8) > .6 ? 1 : 0, c = cols[i % 6], x = i * 7 + 1; R(x, 2 + sw, 6, 6, c); R(x + 2, 4 + sw, 2, 2, 'rgba(20,10,20,.7)'); R(x, 8 + sw, 1, 1, c); R(x + 2, 8 + sw, 2, 1, c); R(x + 5, 8 + sw, 1, 1, c); }
      },
      fuente(g, e, t, R) { box(R, 0, 2, 32, 13, '#6e6a62'); R(2, 4, 28, 8, '#20394a'); const s = ((t * 6) % 20) | 0; R(5 + s, 7, 3, 1, '#4a7488'); R(22 - s / 2, 9, 2, 1, '#4a7488'); R(13, -5, 6, 11, '#7a766e'); R(11, -7, 10, 3, '#8a867e'); R(15, -3, 2, 2, '#5a8aa0'); R(14, 6, 4, 1, '#f6a623'); },
      fogata(g, e, t, R) { R(2, 11, 12, 4, '#3e3834'); R(3, 10, 3, 2, '#5a524c'); R(10, 10, 3, 2, '#5a524c'); R(4, 9, 8, 2, '#3a2416'); for (let i = 0; i < 4; i++) { const h = 3 + ((Math.sin(t * 10 + i * 1.9) + 1) * 2.5) | 0; R(4 + i * 2, 10 - h, 2, h, i % 2 ? '#ff8a2a' : '#ffcf5a'); } R(7, 3 + (Math.sin(t * 7) > 0 ? 1 : 0), 1, 2, 'rgba(255,220,150,.7)'); },
      calavera(g, e, t, R) { const b = Math.sin(t * 4) > 0 ? 1 : 0; R(5, 5 + b, 6, 6, '#f0ece0'); R(4, 6 + b, 8, 4, '#f0ece0'); R(5, 7 + b, 2, 2, '#e84a8a'); R(9, 7 + b, 2, 2, '#30a0d0'); R(7, 10 + b, 2, 1, '#f0a020'); R(6, 11 + b, 4, 2, '#e8e2d0'); R(6, 12 + b, 1, 1, '#c8c0b0'); R(9, 12 + b, 1, 1, '#c8c0b0'); },
      barquito(g, e, t, R) { const b = Math.sin(t * 2) > 0 ? 1 : 0; R(3, 10 + b, 10, 2, '#e8e4d8'); R(4, 12 + b, 8, 1, '#b8b4a8'); R(7, 5 + b, 1, 5, '#d8d4c8'); R(8, 5 + b, 3, 4, '#f0ece0'); R(5, 8 + b, 2, 2, '#e8e2cc'); if (!e.off) { const f = Math.sin(t * 15) > 0 ? 1 : 0; R(5, 6 + b + f, 1, 2 - f, '#ffcf5a'); R(5, 5 + b, 1, 1, '#ff8a2a'); } R(2, 13, 12, 1, 'rgba(255,200,120,.25)'); },
      petals(g, e, t, R) { const cs = ['#e8820e', '#f6a623', '#d8601a']; for (let i = 0; i < 6; i++) R((hash(e.x, e.y, i) * 13) | 0, (hash(e.y, e.x, i + 7) * 13) | 0, 2, 2, cs[i % 3]); },
      espantapajaros(g, e, t, R) { R(7, -6, 2, 21, '#5a4024'); R(1, -2, 14, 2, '#5a4024'); R(3, -1, 10, 9, '#6a5a8a'); R(3, -1, 10, 1, '#4a3a6a'); R(5, -10, 6, 6, '#c8a860'); R(6, -8, 1, 1, '#1a1010'); R(9, -8, 1, 1, '#1a1010'); R(2, -12, 12, 2, '#a88a40'); R(4, -14, 8, 2, '#b89a50'); R(1, 0, 2, 3, '#c8a860'); R(13, 0, 2, 3, '#c8a860'); },
      atril(g, e, t, R) { R(7, 4, 2, 10, '#4a3020'); R(4, 13, 8, 2, '#3a2418'); box(R, 2, -1, 12, 6, '#5a3a24'); R(4, 0, 8, 3, '#e8e0c8'); R(5, 1, 5, 1, '#6a6050'); if (!e.read) R(7, -5 + (Math.sin(t * 4) > 0 ? 1 : 0), 2, 2, '#ffe680'); },
      cantaro(g, e, t, R) { R(4, 6, 8, 8, '#8a4a2e'); R(3, 7, 10, 6, '#a0583a'); R(5, 3, 6, 3, '#8a4a30'); R(6, 2, 4, 1, '#6a3420'); R(5, 8, 3, 2, '#c07050'); R(4, 14, 8, 1, '#3a2014'); },
      altarcito(g, e, t, R) {
        box(R, 1, 5, 14, 9, '#6a4a30'); R(2, 13, 2, 3, '#4a3020'); R(12, 13, 2, 3, '#4a3020');
        R(1, 5, 14, 3, '#e8508a'); for (let i = 0; i < 5; i++) R(2 + i * 3, 8, 1, 1, '#e8508a');
        if (e.fl) { R(1, 2, 4, 4, '#f0a020'); R(11, 2, 4, 4, '#f0a020'); R(2, 3, 2, 2, '#ffc040'); R(12, 3, 2, 2, '#ffc040'); R(5, 4, 6, 1, '#e8820e'); }
        if (e.pan) { R(5, 1, 6, 4, '#c0803a'); R(6, 0, 4, 1, '#d8a050'); R(7, 2, 2, 1, '#8a5a20'); }
        if (e.nom) R(5, 9, 6, 3, '#e8e0c8');
        if (e.v) { for (const x of [2, 13]) { R(x, -2, 2, 7, '#e8e2cc'); const f = Math.sin(t * 15 + x) > 0 ? 1 : 0; R(x, -5 + f, 2, 3 - f, '#ffcf5a'); } }
      },
      campanario(g, e, t, R) { R(3, -18, 10, 20, '#7a6450'); R(3, -18, 10, 2, '#8e7660'); R(5, -14, 6, 8, '#120c0a'); R(6, -12, 4, 4, '#b8903a'); R(7, -8, 2, 1, '#8a6a2a'); R(7, -26, 2, 8, '#4a3a2a'); R(5, -23, 6, 2, '#4a3a2a'); },
      pila(g, e, t, R) { R(6, 8, 4, 7, '#8a867e'); R(4, 14, 8, 1, '#5a5650'); box(R, 2, 3, 12, 6, '#9a968e'); R(3, 4, 10, 3, '#2e4a5a'); R(5, 5, 2, 1, '#6a90a4'); },
      cuerda(g, e, t, R) { const s = Math.sin(t * 1.3) * .8; R(7 + s, -26, 2, 36, '#a08a5a'); R(6 + s, 9, 4, 4, '#8a7040'); R(7 + s, 13, 2, 2, '#6a5430'); },
      cruzvieja(g, e, t, R) { R(7, -4, 2, 18, '#5a4024'); R(3, -1, 10, 2, '#5a4024'); R(6, 12, 4, 3, '#3a2a18'); R(4, 1, 3, 3, '#e8508a'); R(9, 2, 3, 2, '#f0a020'); }
    },
    maps: {
      /* ---------------- 家 ---------------- */
      casa: {
        amb: 'room', dark: .58, wall: 'mud', floor: 'dirt', plr: 3,
        rows: [
          '##############',
          '##############',
          '#............#',
          '#............#',
          '#............#',
          '#............#',
          '#............#',
          '#............#',
          '######.#######'],
        ents: [
          { x: 6, y: 8, spr: 'invisible', async touch(S) {
            if (S.f.phase === 'wake') { S.sfx('locked'); await S.narr('得先叫醒奶奶！'); await S.walk('pl', 'u', 5); return; }
            await S.go('pueblo', 27, 3, 0);
          } },
          { x: 2, y: 1, spr: 'window', on: S => S.narr('窗外是一片橘黄色的烛光。\n全村的人都醒着，在等他们的死人回家。') },
          { x: 9, y: 1, spr: 'painting', col: '#2a5a4a', on: S => S.narr('瓜达卢佩圣母的画像，四个角都被烟熏黄了。\n她低着头，双手合十，好像也在等什么人。') },
          { id: 'ofrenda', x: 5, y: 2, w: 2, spr: 'ofrenda', light: { r: 4.6, col: 'rgba(255,160,70,.24)', flick: true }, async on(S) {
            const ph = S.f.phase;
            if (ph === 'wake') return S.narr('祭坛上的万寿菊少了一大把，奶奶剪彩纸剩下的那张白纸也不见了。\n……还少了一根蜡烛。');
            if (ph === 'final') return S.narr('妈妈的照片在烛光里笑着。\n「你们俩都回来了，」她好像在说，「那就好。」');
            await S.narr('家里的祭坛（ofrenda）。最上面是外公和妈妈的照片，下面一层一层摆着蜡烛、万寿菊、亡灵面包、一杯水、一小碟盐，和两个糖做的小骷髅。\n妈妈的照片前面放着一个剥好的橘子。');
          } },
          { x: 12, y: 2, spr: 'cantaro', on: S => S.narr('陶水罐。奶奶说，祭坛上一定要放一杯水——死人走了那么远的路，一定渴坏了。') },
          { x: 1, y: 7, spr: 'basket', on: S => S.narr(S.f.phase === 'wake' ? '篮子里的万寿菊，被抓走了一大把。地上掉着几片花瓣，一直掉到门口。' : '一篮子剩下的万寿菊（cempasúchil），香得发苦。') },
          { id: 'petate_d', x: 2, y: 4, h: 2, spr: 'futon', col: '#b08a4a', solid: false, async on(S) {
            if (S.f.phase === 'wake' || S.f.phase === 'search') {
              if (S.once('dibujo')) await S.narr('迭戈的草席是空的，摸上去已经凉了。\n枕头底下压着一张纸。');
              await S.note('dibujo'); S.f.dibujo = true;
              return S.think('「给那位太太的孩子们」……\n迭戈，你到底去哪儿了？');
            }
            await S.narr('迭戈的草席（petate）。枕头边上放着他的木头小马。');
          } },
          { id: 'petate_l', x: 11, y: 5, h: 2, spr: 'futon', col: '#a07a3a', solid: false, on: S => S.narr('你的草席。还带着一点体温。') },
          { id: 'abuela', x: 5, y: 3, spr: '@abuela', dir: 3, async on(S) {
            S.face('abuela', 'pl');
            if (S.f.phase === 'wake') return wakeAbuela(S);
            if (S.f.phase === 'search') return S.say('祖母', ['去墓园找伊内斯，去教堂找神父——叫大人们一起找！', '……不许去河边。听见没有？']);
          } },
          { id: 'diego_h', x: 7, y: 4, spr: '@diego', dir: 3, on: S => S.say('迭戈', '奶奶，再讲一个嘛。') }
        ],
        async enter(S, first) {
          if (S.f.phase === 'final' && S.once('homeFinal')) return S.narr('家里空荡荡的。祭坛上的蜡烛还在烧，屋子里全是万寿菊的味道。');
          if (!first) return;
          await opening(S);
        }
      },
      /* ---------------- 村子 · 广场 · 墓园 ---------------- */
      pueblo: {
        amb: 'night', dark: .76, plr: 3.4, wall: 'mud', floor: 'dirt',
        legend: { p: 'petalos', v: 'agave', a: 'tapia' },
        tileOpts: { grassC: '#24331f', treeC: '#16241a' },
        rows: [
          'TTTTTTTTTTTTT########TTTTTTTTTTT',
          'TTTTTTTTTTTTT########TTT#######T',
          'Taaaaaaaaaaad########ddd#######T',
          'Ta"""""""""addddpddddddddddpdddT',
          'Ta"""""""""adkkkpkkkkkkddddpdvvT',
          'Ta"""""""""adkkkpkkkkkkddddpddvT',
          'Ta"""""""""adkkkpkkkkkkddddpdddT',
          'Ta"""pppppppppppppppppppppppddvT',
          'Ta"""""""""adkkkpkkkkkkddddddddT',
          'Ta"""""""""adkkkpkkkkkkdddddddvT',
          'Ta"""""""""adkkkpkkkkkkddddddvvT',
          'Ta"""""""""adkkkpkkkkkkvdddddddT',
          'Taaaaaaaaaaaddddpdddddd########T',
          'TTddddddddddddddpdddddd########T',
          'TTvvddvddvvddvddddddddddddddddvT',
          'TTTTTTTTTTTTTTvdddvvTTTTTTTTTTTT',
          'TTTTTTTTTTTTTTvdddvTTTTTTTTTTTTT',
          'TTTTTTTTTTTTTTTdddTTTTTTTTTTTTTT',
          'TTTTTTTTTTTTTTvdddTTTTTTTTTTTTTT',
          'TTTTTTTTTTTTTTTdddvTTTTTTTTTTTTT',
          'TTTTTTTTTTTTTTvdddTTTTTTTTTTTTTT',
          'TTTTTTTTTTTTTTTdddvTTTTTTTTTTTTT',
          'TTTTTTTTTTTTTTTdddTTTTTTTTTTTTTT',
          'TTTTTTTTTTTTTTTTdTTTTTTTTTTTTTTT'],
        ents: [
          /* 房子与教堂 */
          { x: 27, y: 2, spr: 'door', col: '#3a5a7a', async on(S) { S.sfx('open'); await S.go('casa', 6, 7, 3); } },
          { x: 25, y: 2, spr: 'window', lit: true, light: { r: 2, col: 'rgba(255,190,110,.14)' }, on: S => S.narr('你家的窗户。窗台上也点着一排小蜡烛。') },
          { x: 29, y: 2, spr: 'window', lit: true, light: { r: 2, col: 'rgba(255,190,110,.14)' }, on: S => S.narr('窗户里，祭坛的烛光一闪一闪。') },
          { x: 16, y: 1, spr: 'campanario', decal: false, solid: false },
          { x: 16, y: 2, spr: 'door', col: '#4a2a1a', async on(S) { S.sfx('open'); await S.go('iglesia', 8, 9, 3); } },
          { x: 14, y: 2, spr: 'lantern', light: { r: 3, col: 'rgba(255,170,80,.2)', flick: true }, on: S => S.narr('教堂门口挂着的铁皮灯笼。') },
          { x: 19, y: 2, spr: 'lantern', light: { r: 3, col: 'rgba(255,170,80,.2)', flick: true }, on: S => S.narr('灯笼里的火苗被风吹得直往一边倒。') },
          { x: 13, y: 2, spr: 'window', on: S => S.narr('教堂的彩色玻璃窗。里面有烛光，有人影在动。') },
          { x: 24, y: 13, spr: 'window', lit: true, light: { r: 2, col: 'rgba(255,190,110,.12)' }, on: S => S.narr('杂货铺的窗户。柜台上的收音机开着，在放一首很老的歌。') },
          { x: 26, y: 13, spr: 'door', col: '#5a3a22', on: S => S.narr('杂货铺关着门。门把手上系着一个小小的黑蝴蝶结——这家刚办过丧事。') },
          { x: 29, y: 13, spr: 'window', on: S => S.narr('黑着的窗户。玻璃上映出你身后的烛光……还有你自己的脸。') },
          /* 广场 */
          { x: 13, y: 4, w: 10, spr: 'picado', z: 1, solid: false },
          { x: 13, y: 10, w: 10, spr: 'picado', z: 1, solid: false },
          { id: 'stall', x: 20, y: 5, w: 2, spr: 'stall2', col: '#c84a6a', light: { r: 2.6, col: 'rgba(255,180,90,.18)', flick: true }, on: S => tona(S) },
          { id: 'tona', x: 22, y: 5, spr: '@tona', dir: 1, on: S => tona(S) },
          { id: 'fuente', x: 18, y: 9, w: 2, spr: 'fuente', on: S => S.narr(S.f.phase === 'final' ? '水面上漂着几片花瓣，和两支蜡烛的倒影。\n水很静。' : '广场中间的水池。水面上漂着几片花瓣，还有蜡烛的倒影。\n你下意识地离水远了一点。') },
          { x: 20, y: 10, w: 2, spr: 'bench', on: S => S.narr('长椅上有人落下了一顶草帽，帽檐里插着一朵万寿菊。') },
          { id: 'beto', x: 14, y: 9, spr: '@beto', dir: 0, on: S => beto(S) },
          /* 墓园 */
          { x: 11, y: 6, spr: 'marigold', z: 1 }, { x: 11, y: 8, spr: 'marigold', z: 1 },
          { x: 10, y: 3, spr: 'cross', on: S => S.narr('墓园的大十字架。上面挂满了万寿菊编的花环，橘黄色的，在烛光里像一团团小火。') },
          { id: 'g_abuelo', x: 3, y: 4, spr: 'gravestone', flowers: true, on: S => S.narr('外公的坟。他打了一辈子鱼，一辈子都在这条河上。\n奶奶说，外公从来不怕那个女人：「她要找的是孩子，不是我这样的老骨头。」') },
          { id: 'g_mama', x: 5, y: 4, spr: 'gravestone', flowers: true, async on(S) {
            await S.narr('妈妈的坟。坟上铺满了万寿菊——是奶奶下午铺的。\n墓碑上刻着：ESPERANZA MORALES　1921–1950。');
            await S.think('妈妈，帮我找到迭戈。\n……今天晚上你不是要回家吗？那就顺路，帮我看着他。');
          } },
          { x: 9, y: 4, spr: 'gravestone', flowers: true, on: S => S.narr('墓碑上的名字已经被雨水冲得看不清了。可是坟前也有人摆了一碗新做的玉米粽子（tamales）。') },
          { id: 'ramiro', x: 9, y: 5, spr: '@ramiro', dir: 3, async on(S) {
            await S.narr('拉米罗大叔背对着你，跟坟里的人小声说着话，没有理你。');
            await S.say('拉米罗大叔', ['……今年玉米收得不错，爸。猪也卖了个好价钱。', '小的那个会走路了。明年带他来给你看。'], { style: 'whisper' });
          } },
          { x: 3, y: 10, spr: 'gravestone', flowers: true, on: S => S.narr('卡门家爸爸的坟。坟上放着一瓶龙舌兰酒，瓶口还没开。') },
          { id: 'carmen', x: 4, y: 10, spr: '@carmen', dir: 1, on: S => carmen(S) },
          { id: 'g_pablo', x: 8, y: 10, spr: 'gravestone', flowers: true, async on(S) {
            await S.narr('一座很小的坟。墓碑上刻着：PABLO REYES　1914–1921。\n坟前摆着南瓜糖、一只小木船，和一封信。');
            if (S.f.ines) await S.note('carta');
          } },
          { id: 'ines', x: 7, y: 10, spr: '@ines', dir: 2, on: S => ines(S) },
          ...[[3, 5], [5, 5], [9, 3], [2, 10], [9, 10], [6, 9]].map(([x, y]) => ({ x, y, spr: 'candles', solid: false, light: { r: 2.1, col: 'rgba(255,170,80,.2)', flick: true } })),
          /* 花瓣路边的蜡烛 */
          ...[[15, 3], [17, 3], [12, 6], [12, 8], [26, 4], [28, 5], [14, 12], [18, 12], [14, 14], [18, 14]].map(([x, y]) => ({ x, y, spr: 'candle', solid: false, light: { r: 2.3, col: 'rgba(255,170,80,.2)', flick: true } })),
          /* 村口 */
          { id: 'fogata', x: 20, y: 13, spr: 'fogata', light: { r: 4, col: 'rgba(255,140,60,.25)', flick: true }, on: S => S.narr('一小堆篝火。火上架着一只铁皮壶，煮着加了肉桂的咖啡（café de olla）。') },
          { id: 'chuy', x: 19, y: 13, spr: '@chuy', dir: 0, on: S => chuy(S) },
          { x: 17, y: 17, spr: 'sign', col: '#5a4024', on: S => S.narr('木牌子上写着：AL RÍO ↓（往河边）。\n底下有人用炭笔添了一行小字：「晚上别去。」') },
          ...[[16, 16], [15, 18], [16, 20]].map(([x, y], i) => ({ id: 'fp' + i, x, y, spr: 'footprints', decal: true, hidden: true, col: 'rgba(30,20,12,.55)' })),
          { id: 'calavera', x: 16, y: 19, spr: 'calavera', hidden: true, solid: false, async on(S) {
            S.hide('calavera'); S.give('calavera'); S.f.skull = true;
            await S.narr('路中间掉着一个糖骷髅。额头上用粉红色的糖霜歪歪扭扭地写着：DIEGO。\n旁边的泥地上，有一串小小的脚印，一直往南，往玉米地里去了。');
            await S.think('迭戈……真的去河边了。');
            S.goal(S.f.chuy ? '穿过玉米地，去河边找迭戈' : '村口的楚伊大叔一直坐在那里——问问他');
          } },
          { id: 'sur', x: 16, y: 23, spr: 'invisible', async touch(S) {
            const ph = S.f.phase;
            if (ph === 'final' || ph === 'safe') { await S.narr('你再也不想走那条路了。'); return S.walk('pl', 'u', 5); }
            if (ph === 'flee') { await S.narr('不能回去！钟声在北边！'); return S.walk('pl', 'u', 6); }
            if (ph === 'search' && !(S.f.skull && S.f.chuy)) {
              await S.narr(S.f.skull ? '黑漆漆的玉米地。\n……楚伊大叔一直坐在村口，他好像有话要跟你说。' : '南边是去河边的路，要穿过一大片玉米地。\n祖母说过，晚上不许去河边。先在村子里找找迭戈吧。');
              return S.walk('pl', 'u', 5);
            }
            if (ph === 'search' && S.once('leave')) await S.think('奶奶说不许去河边。\n……可是等大人们找过来，就来不及了。');
            await S.go('milpa', 10, 1, 0);
          } },
          /* 后来出场的人 */
          { id: 'abuela_p', x: 17, y: 12, spr: '@abuela', hidden: true, dir: 0, on: S => abuelaFinal(S) },
          { id: 'padre_p', x: 19, y: 12, spr: '@padre', hidden: true, dir: 0, async on(S) {
            S.face('padre_p', 'pl');
            if (!S.f.photo) return S.say('托马斯神父', ['名字……教堂后屋的柜子里，有一张很老的照片。', '村里人都说，那就是她，和她的两个孩子。照片背面写着字。']);
            await S.say('托马斯神父', '写上他们的名字吧。一个人只要还有人叫得出他的名字，就没有真正走丢。');
          } },
          { id: 'diego_p', x: 16, y: 22, spr: '@diego', hidden: true, dir: 3, async on(S) {
            S.face('diego_p', 'pl');
            if (S.has('trompo') && !S.f.trompoGift) {
              S.take('trompo'); S.f.trompoGift = true;
              await S.say('迭戈', ['我的陀螺！贝托还给我了？', '……那，把它也放到祭坛上吧。给那个男孩。']);
              return;
            }
            await S.say('迭戈', '姐姐，快一点……她一直在那儿看着我们。');
          } },
          { id: 'altarcito', x: 16, y: 14, spr: 'altarcito', hidden: true, on: S => altarcito(S) },
          { id: 'llo_p', x: 16, y: 22, spr: '@llorona', hidden: true, solid: false, light: GLOW },
          { id: 'maria_p', x: 16, y: 16, spr: '@maria', hidden: true, solid: false, dir: 3, light: { r: 2.4, col: 'rgba(230,220,200,.18)' } },
          { id: 'nico', x: 15, y: 22, spr: '@nico', hidden: true, solid: false, dir: 3, light: { r: 1.6, col: 'rgba(255,220,160,.2)' } },
          { id: 'rosita', x: 17, y: 22, spr: '@rosita', hidden: true, solid: false, dir: 3, light: { r: 1.6, col: 'rgba(255,220,160,.2)' } }
        ],
        async enter(S, first) {
          if (S.f.phase === 'flee') {
            ghostOff(S, 'llo_p'); S.f._pspawn = 1.3; S.cp('flee_p');
            if (S.once('bellsP')) await S.narr('钟声！就在前面——村子的烛光就在前面！');
            return;
          }
          if (first) {
            await S.narr('整个村子都醒着。\n家家门口点着蜡烛，橘黄色的花瓣路从你家门口一直铺到墓园。远处有人在弹吉他，有人在笑，也有人在小声地哭。');
            await S.think('迭戈会去哪儿呢？\n奶奶说去墓园找伊内斯奶奶，去教堂找神父……');
          }
        },
        step(S, x, y) {
          if (S.f.phase === 'flee' && y <= 15) return safe(S);
          if (S.f.phase === 'final' && y >= 16) return (async () => {
            S.face('abuela_p', 'pl');
            await S.say('祖母', '露西娅！别过去！');
            await S.walk('pl', [16, 15], 5);
          })();
        },
        tick(S, dt) {
          if (S.f.phase !== 'flee' || W.busy || !(S.f._pspawn > 0)) return;
          S.f._pspawn -= dt;
          if (S.f._pspawn <= 0) { S.place('llo_p', 16, 23, 3); S.ent('llo_p').alpha = 1; S.sfx('cry'); S.chase('llo_p', { spd: 2.9, catch: caught, zone: (x, y) => y >= 16 }); }
        }
      },
      /* ---------------- 教堂 ---------------- */
      iglesia: {
        amb: 'room', dark: .66, wall: 'plain', floor: 'stone', plr: 3,
        rows: [
          '################',
          '################',
          '#kkkkkkkkkk#kkk#',
          '#kkkkkkrrkk#kkk#',
          '#kkkkkkrrkkkkkk#',
          '#kkkkkkrrkk#kkk#',
          '#kkkkkkrrkk#kkk#',
          '#kkkkkkrrkk#kkk#',
          '#kkkkkkrrkk#kkk#',
          '#kkkkkkrrkk#kkk#',
          '#######kk#######'],
        tileOpts: { rugC: '#6a1e22' },
        ents: [
          { x: 7, y: 10, spr: 'invisible', to: ['pueblo', 16, 3, 0] },
          { x: 8, y: 10, spr: 'invisible', to: ['pueblo', 16, 3, 0] },
          { x: 7, y: 2, w: 2, spr: 'altar', on: S => S.narr('祭坛上铺着白布，白布上又铺了一层万寿菊。\n今天晚上，连天主的桌子上都摆着给死人的面包。') },
          { x: 8, y: 1, spr: 'cross' },
          ...[[6, 2], [9, 2]].map(([x, y]) => ({ x, y, spr: 'candles', light: { r: 3, col: 'rgba(255,170,80,.22)', flick: true }, on: S => S.narr('一排一排的蜡烛。每一支，都是给一个人点的。') })),
          { x: 1, y: 2, spr: 'statue', light: { r: 2.4, col: 'rgba(255,180,100,.15)', flick: true }, on: S => S.narr('圣母像脚下堆满了万寿菊，还有一小把还愿用的银片（milagros）：小手、小脚、小小的心……\n还有一个银做的小孩。') },
          { x: 4, y: 1, spr: 'painting', col: '#2a4a6a', on: S => S.narr('一幅很旧的油画：炼狱里的灵魂伸着手，等着人间的人为他们祈祷。') },
          { x: 2, y: 1, spr: 'window', on: S => S.narr('窗外黑沉沉的。从这里看不见河，可是能听见。') },
          { x: 2, y: 5, w: 2, spr: 'bench', on: S => S.narr('长椅上放着一条没人认领的黑色披肩。') },
          { x: 2, y: 7, w: 2, spr: 'bench' },
          { x: 9, y: 5, w: 2, spr: 'bench' },
          { x: 9, y: 7, w: 2, spr: 'bench', on: S => S.narr('椅背上刻着一个名字，和一个小小的十字。') },
          { id: 'atril', x: 10, y: 3, spr: 'atril', on: S => S.note('sermon') },
          { x: 6, y: 9, spr: 'pila', on: S => S.narr('圣水池。水面一动不动，映出你身后的门。\n……你盯着它看了很久，确认里面只有你自己。') },
          { id: 'padre', x: 8, y: 3, spr: '@padre', dir: 0, on: S => padre(S) },
          /* 后屋 */
          { id: 'archivo', x: 13, y: 2, spr: 'cabinet', col: '#4a3424', async on(S) {
            if (S.once('archivo')) await S.narr('柜子里塞满了发霉的出生登记簿和死亡登记簿。\n最上面一本里夹着一张老照片。');
            await S.note('foto'); S.f.photo = true;
            if (S.f.phase === 'final') S.goal('回到村口，把名字写在祭坛上');
          } },
          { x: 14, y: 5, spr: 'cuerda', on: S => S.narr(S.f.bell ? '钟绳从房梁上垂下来。神父说，等找到你们，他就拉它。' : '钟绳从房梁上垂下来，一直垂到地上。轻轻地晃着，可是屋里没有风。') },
          { x: 12, y: 8, spr: 'shelf', on: S => S.narr('架子上放着圣餐用的酒、备用的蜡烛，还有一个装满了旧照片的饼干盒。\n没人认领的照片，最后都到了这里。') }
        ],
        async enter(S, first) {
          if (first) await S.narr('教堂里比外面安静得多。几十支蜡烛在圣母像前烧着，蜡油流了一地。');
        }
      },
      /* ---------------- 玉米地 ---------------- */
      milpa: {
        amb: 'wind', dark: .92, plr: 2.7, floor: 'dirt', fog: .12,
        legend: { M: 'maiz', v: 'agave' },
        rows: [
          'MMMMMMMMMdddMMMMMMMMM',
          'MMMMMMMMdvdddMMMMMMMM',
          'MMMMMMMMdddvdMMMMMMMM',
          'MMMMMMMMMMdMMMMMMMMMM',
          'MMMMMMMMMMdMMMMMMMMMM',
          'MMMMMMdddddddddMMMMMM',
          'MMMMMMdMMMMMMMdMMMMMM',
          'MMMMMMdMMMMMMMdMMMMMM',
          'MMMMMMdMMMMMMMdMMMMMM',
          'MMMMMMdMMMMMMMdMMMMMM',
          'MMMMMMoMMMdddddMMMMMM',
          'MMMMMMMMMMdMMMMMMMMMM',
          'MMMMMMMMMMdMMMMMMMMMM',
          'MMMMMMdddddddddMMMMMM',
          'MMMMMMdMMMMMMMdMMMMMM',
          'MMMMMMdMMMMMMMdMMMMMM',
          'MMMMMMdMMMMMMMdMMMMMM',
          'MMMMMMdMMMMMMMdMMMMMM',
          'MMMMMMdddddMMMoMMMMMM',
          'MMMMMMMMMMdMMMMMMMMMM',
          'MMMMMMMMMMdMMMMMMMMMM',
          'MMMMMMdddddddddMMMMMM',
          'MMMMMMdMMMMMMMdMMMMMM',
          'MMMMMMdMMMMMMMdMMMMMM',
          'MMMMMMdMMMMMMMdMMMMMM',
          'MMMMMMdMMMMMMMdMMMMMM',
          'MMMMMMoMMMdddddMMMMMM',
          'MMMMMMMMMddvMMMMMMMMM',
          'MMMMMMMMMvddMMMMMMMMM',
          'MMMMMMMMMMdMMMMMMMMMM'],
        ents: [
          { x: 10, y: 0, spr: 'invisible', async touch(S) {
            if (S.f.phase === 'flee') {
              S.follow('diego_m', false); S.hide('diego_m');
              S.show('diego_p'); S.follow('diego_p', true);
              return S.go('pueblo', 16, 22, 3);
            }
            await S.go('pueblo', 16, 22, 3);
          } },
          { x: 10, y: 29, spr: 'invisible', async touch(S) {
            if (S.f.phase === 'flee') { await S.narr('不能回去！'); return S.walk('pl', 'u', 6); }
            await S.go('rio', 12, 1, 0);
          } },
          { x: 8, y: 2, spr: 'cruzvieja', on: S => S.narr('路边插着一个小小的木十字架，上面挂着褪了色的纸花。\n没有名字。这样的十字架，在河边的路上有很多。') },
          { x: 12, y: 1, spr: 'espantapajaros', on: S => S.narr('稻草人戴着一顶破草帽，两只纽扣眼睛。\n它的脸，朝着河的方向。') },
          ...[[11, 5], [13, 5], [14, 6], [14, 8], [13, 10]].map(([x, y]) => ({ x, y, spr: 'petals', decal: true })),
          ...[[10, 3], [14, 7]].map(([x, y]) => ({ x, y, spr: 'footprints', decal: true, col: 'rgba(30,20,12,.5)' })),
          { id: 'huarache', x: 10, y: 19, spr: 'shoes', col: '#7a5432', async on(S) {
            S.hide('huarache'); S.give('huarache');
            await S.narr('路中间躺着一只小小的皮凉鞋。是迭戈的。\n另一只不在这儿。他光着一只脚，还在往前走。');
            await S.think('……走对了。迭戈就是从这里过去的。');
          } },
          { id: 'llo_m', x: 10, y: 29, spr: '@llorona', hidden: true, solid: false, light: GLOW },
          { id: 'llo_m2', x: 6, y: 10, spr: '@llorona', hidden: true, solid: false, light: GLOW },
          { id: 'diego_m', x: 10, y: 28, spr: '@diego', hidden: true, dir: 3 }
        ],
        async enter(S, first) {
          if (S.f.phase === 'flee') {
            ghostOff(S, 'llo_m'); ghostOff(S, 'llo_m2'); S.f._mspawn = 1.6; S.cp('flee_m');
            if (S.once('fleeM')) await S.narr('北边，远远地，传来了教堂的钟声。\n跟着钟声跑——别回头！');
            return;
          }
          if (S.f.phase === 'search') {
            S.f.phase = 'milpa';
            await S.narr('玉米已经收过了，只剩下一人多高的干秸秆。风一吹，沙沙地响，像好多好多人凑在一起小声说话。\n蜡烛的光，只照得到你脚边。');
            S.sfx('cry');
            await S.narr('……然后，你听见了。\n很远的地方，一个女人在哭。');
            S.goal('穿过玉米地，到河边去（注意听哭声）');
            S.cp('milpa');
          }
        },
        step(S, x, y) {
          const k = x + ',' + y, ph = S.f.phase;
          const tr = TRAPS[k];
          if (tr && ph === 'milpa') return trapIn(S, tr);
          const am = AMBUSH[k];
          if (am && ph === 'flee' && !S.f['amb' + am[2]]) {
            S.f['amb' + am[2]] = true;
            S.place('llo_m2', am[0], am[1], 3); S.ent('llo_m2').alpha = 1; S.sfx('splash'); S.bubble('llo_m2', '!', 900);
            S.chase('llo_m2', { spd: 2.6, wait: .6, catch: caught });
            return;
          }
          const fk = FORKS[k];
          if (fk && ph === 'milpa') return (async () => {
            if (S.once('fork' + k)) { await S.narr(fk[0]); await S.think(fk[1]); }
            else await S.narr(fk[2]);
          })();
        },
        tick(S, dt) {
          if (S.f.phase !== 'flee' || W.busy || !(S.f._mspawn > 0)) return;
          S.f._mspawn -= dt;
          if (S.f._mspawn <= 0) { S.place('llo_m', 10, 29, 3); S.ent('llo_m').alpha = 1; S.sfx('cry'); S.chase('llo_m', { spd: 2.7, catch: caught }); }
        }
      },
      /* ---------------- 河边 ---------------- */
      rio: {
        amb: 'river', dark: .8, plr: 2.8, floor: 'mud',
        legend: { D: 'muelle', v: 'agave' },
        tileOpts: { treeC: '#14221a' },
        rows: [
          'TTTTTTTTTTTTdTTTTTTTTTTTTT',
          'TTTTddvdddddddddddvdddTTTT',
          'TTTTdvdddvdddddvddddvdTTTT',
          'TTuuuuuuuuuuuuuuuuuuuuuuTT',
          'TuuKuuuuuuuuuuuuuKuuuuuuuT',
          'TuuuuuuuKuuuuuuuuuuuuuKuuT',
          'TuuuKuuuuuuuuuuuuuuuuuuuuT',
          'eeeeeuuueeeeDeeeuueeDeeeee',
          'eeeooooooeeoDoooooooDooeee',
          'eoooooooooooDoooooooDooooe',
          'eeooooooooooDoooooooDoooee',
          '~~~~~~~~~~~~D~~~~~~~D~~~~~',
          '~~~~~~~~~~~~D~~~~~~~D~~~~~',
          '~~~~~~~~~~~~D~~~~~~~~~~~~~',
          '~~~~~~~~~~~~D~~~~~~~~~~~~~',
          '~~~~~~~~~~~~D~~~~~~~~~~~~~',
          '~~~~~~~~~~~~~~~~~~~~~~~~~~',
          '~~~~~~~~~~~~~~~~~~~~~~~~~~'],
        ents: [
          { x: 12, y: 0, spr: 'invisible', async touch(S) {
            if (S.f.phase === 'river') { await S.narr('迭戈还在码头上！'); return S.walk('pl', 'd', 5); }
            if (S.f.phase === 'flee') {
              S.follow('diego_r', false); S.hide('diego_r');
              S.show('diego_m'); S.follow('diego_m', true);
            }
            await S.go('milpa', 10, 28, 3);
          } },
          { x: 12, y: 16, spr: 'invisible', light: { r: 6, col: 'rgba(120,150,210,.1)' } },
          { id: 'barquito', x: 14, y: 11, spr: 'barquito', light: { r: 1.8, col: 'rgba(255,190,110,.22)', flick: true }, on: S => S.narr('迭戈的纸船，在黑水上一漂一漂的。船上立着半截蜡烛，还没灭。\n船舱里放着几片万寿菊花瓣。') },
          { x: 15, y: 9, w: 2, spr: 'boat', on: S => S.narr('一条翻扣过来的旧独木舟。\n……船底下，有什么东西在一下、一下，轻轻地敲着船板。') },
          { x: 5, y: 4, spr: 'cruzvieja', on: S => S.narr('岸边插着一个小木十字架，没有名字。\n底下有人放了一颗糖，还有一只小小的、手编的草鞋。') },
          { x: 8, y: 5, spr: 'invisible', solid: true, on: S => S.narr('一块被磨得很光滑的大石头。白天，女人们在这里洗衣服、唱歌。\n石头缝里卡着一缕长长的黑头发。') },
          { x: 9, y: 8, spr: 'invisible', solid: true, on: S => S.narr('芦苇丛里有什么东西在动。\n……是风。是风吧。') },
          { x: 20, y: 13, spr: 'invisible', solid: true, on: S => S.narr('老木桥断在了这里。去年雨季，河水把它冲走了一半。\n断口下面，水黑得看不见底。') },
          { id: 'diego_r', x: 12, y: 13, spr: '@diego', dir: 0, light: { r: 1.5, col: 'rgba(170,200,235,.14)' }, on: S => S.narr('迭戈背对着你，一动不动。') },
          { id: 'llo_r', x: 12, y: 16, spr: '@llorona_big', hidden: true, solid: false, dir: 3, light: { r: 3, col: 'rgba(170,200,235,.2)' } }
        ],
        async enter(S, first) {
          if (S.f.phase === 'milpa') {
            S.f.phase = 'river'; S.cp('river');
            await S.narr('玉米地到头了。\n河面很宽，黑得像一块铺开的布。月亮掉在水里，碎成一片一片的。');
            S.sfx('cry');
            await S.narr('哭声就在附近。很近，很近。');
            S.focus(12, 13); await S.wait(700);
            await S.narr('码头的尽头站着一个小小的身影。');
            S.focus(null);
            await S.think('迭戈！');
            S.goal('到码头上去，把迭戈带回来');
          }
        },
        step(S, x, y) { if (S.f.phase === 'river' && x === 12 && y >= 9) return rescue(S); }
      }
    }
  });

  /* ================= 剧情 ================= */
  async function opening(S) {
    await S.narr('屋里点着十几支蜡烛。\n祭坛上摆着外公和妈妈的照片、一碗黄澄澄的万寿菊、新烤的亡灵面包，还有两个糖做的小骷髅。');
    await S.say('祖母', ['好了。你外公爱喝咖啡，给他倒上一杯；你妈妈爱吃橘子，给她剥一个。', '花瓣路从墓园一直铺到咱们家门口。蜡烛点得这么亮，他们走多远都认得回家的路。']);
    S.face('diego_h', 'abuela');
    await S.say('迭戈', '奶奶，妈妈今天晚上真的会回来吗？');
    S.face('abuela', 'diego_h');
    await S.say('祖母', '会的，mijo（我的小乖乖）。她会坐在这儿，闻闻面包的香味，看看你又长高了没有。');
    await S.say('迭戈', '那……那个哭的女人呢？她今天晚上也会回来吗？');
    S.bubble('abuela', '!', 900);
    await S.say('祖母', '……谁跟你说的？');
    await S.say('迭戈', '贝托说的。他说她今天晚上会在河边哭，哭一整夜。');
    S.face('abuela', 0);
    await S.narr('祖母叹了口气，在祭坛前的小板凳上坐了下来。\n烛光在她脸上的皱纹里一跳一跳的。');
    await S.say('祖母', [
      '很久很久以前，河下游住着一个叫玛丽亚的姑娘。她是方圆几十里最漂亮的姑娘——漂亮到连她自己都知道。',
      '后来，一个骑着白马的有钱人娶了她。他们生了两个孩子，一个男孩，一个女孩。',
      '可是男人的心就像河水，流着流着就变了。他回家的日子越来越少，后来，就再也不回来了。他娶了一位跟他一样有钱的太太。',
      '有一天傍晚，玛丽亚带着两个孩子在河边，看见那个男人的马车从桥上过去。他看见了孩子们——然后把脸转了过去。'
    ]);
    const r = await S.ask('祖母的声音越来越低。', ['……后来呢？', '（捂住迭戈的耳朵）']);
    if (r === 1) { S.face('abuela', 'pl'); await S.say('祖母', '别捂，让他听。今天晚上，他该听。'); S.face('abuela', 0); }
    await S.say('祖母', [
      '玛丽亚心里有个东西，碎了。她……她把两个孩子按进了河里。',
      '等她清醒过来，河水已经把孩子们冲走了。她沿着河岸跑啊、喊啊，喊了一整夜。第二天早上，人们在下游找到了她。',
      '她死了以后，去敲另一个世界的门。守门的人问她：「你的孩子们呢？」她答不上来。门就没有开。',
      '所以她回来了。穿着她下葬时的白裙子，蒙着面纱，一条河一条河地找，一个水洼一个水洼地找。一边找，一边哭——'
    ]);
    S.amb('none'); S.sfx('cry');
    await S.say('祖母', '¡Ay, mis hijos!\n（哎呀，我的孩子们！）', { style: 'big' });
    S.amb('room');
    await S.say('祖母', '她找不到自己的孩子，就把夜里在水边乱跑的孩子当成自己的，抱起来，带回河里去。');
    await S.say('迭戈', '……她的孩子叫什么名字？');
    await S.say('祖母', '没人记得了。');
    await S.say('迭戈', ['那他们没有祭坛。', '没有照片，没有蜡烛，也没有人写他们的名字……今天晚上，他们怎么找到回家的路呢？']);
    await S.narr('祖母没有回答。');
    S.face('abuela', 'pl');
    await S.say('祖母', ['睡吧，两个都去睡。', '记住：今天晚上谁也不许出门，更不许去河边。', '就算听见有人叫你们的名字也不许去——哪怕那个声音……像妈妈。']);
    await S.think('迭戈一直盯着祭坛上那张白纸。那是奶奶剪彩纸剩下的。');
    await S.fade(1, 900);
    S.hide('diego_h'); S.face('abuela', 3); S.pos(11, 5, 1);
    await S.card('', '深夜', '……\n\n你是被一阵冷风吹醒的。');
    await S.fade(0, 700);
    S.f.phase = 'wake';
    S.bubble('abuela', '…', 2000);
    await S.narr('屋门开着一道缝。风从门缝里钻进来，祭坛上的蜡烛全都朝一边歪着。\n奶奶坐在祭坛前的板凳上，打着瞌睡。');
    await S.think('……迭戈的草席是空的。');
    S.goal('迭戈不见了——看看他的草席，叫醒奶奶');
  }

  async function wakeAbuela(S) {
    S.bubble('abuela', '!', 900);
    await S.say('祖母', '……嗯？露西娅？怎么了？');
    await S.say('露西娅', '奶奶，迭戈不见了！门开着——');
    await S.narr('祖母一下子站了起来，又捂着膝盖跌坐回去。');
    await S.say('祖母', ['Virgen santa（圣母啊）……这条腿，偏偏是今天。', '他拿了花，拿了纸……这孩子，这傻孩子……', '露西娅，你听好：去墓园找伊内斯，去教堂找托马斯神父，叫大人们一起找！今天晚上村里到处是人，总有人看见他。']);
    S.give('vela');
    await S.say('祖母', ['拿着这根蜡烛。亡灵节的晚上，有光的地方，她不敢来。', '……还有，你自己不许去河边。听见没有？不许去！']);
    S.f.phase = 'search';
    S.goal('在村子里找迭戈：墓园、广场、教堂');
    S.cp('search');
  }

  async function tona(S) {
    S.face('tona', 'pl');
    if (S.f.phase === 'final') {
      if (S.f.gotPan) return S.say('托尼娅', '快去吧。面包凉了，死人就不爱吃了。');
      S.f.gotPan = true; S.give('pan');
      await S.say('托尼娅', ['亡灵面包？给那两个孩子？', '……拿去，拿最大的那个。上面交叉的面条是骨头，中间那个圆疙瘩，是眼泪。']);
      return;
    }
    if (S.once('tona1')) {
      await S.say('托尼娅', ['露西娅！这么晚还在外面跑？买个糖骷髅吗——……迭戈？', '他傍晚来过。拿两个铜板买了一个糖骷髅，非要我在额头上写他的名字。', '我跟他说，写自己的名字是给自己吃的，写别人的名字是送给死人的。他想了半天，说：那我先写我的，回头再学写别人的。']);
      await S.say('托尼娅', ['哭泣的女人？我外婆说，她就是玛琳切——当年给科尔特斯当翻译的那个印第安女人。', '她跟西班牙人生了孩子，又被西班牙人扔下。所以她哭的不是两个孩子，是我们所有人——所有混了血、不知道该管谁叫爹娘的墨西哥孩子。', '……我外婆讲故事，总是讲得很大。']);
      return;
    }
    await S.say('托尼娅', ['没看见迭戈往哪边去。广场上人太多了。', '问问贝托吧，他俩下午一直凑在一块儿。'][S.f.ines ? 0 : 1]);
  }

  async function beto(S) {
    S.face('beto', 'pl');
    if (S.f.phase === 'final') return S.say('贝托', '你……你真的看见她了？她的脸……是马脸吗？');
    if (S.once('beto1')) {
      await S.say('贝托', ['露西娅！你看，迭戈的陀螺！', '他拿陀螺跟我换了一张纸——白的那种，叠船最好。', '然后他问我河在哪边。我说南边，穿过玉米地就是。他说他要先去墓园，问伊内斯奶奶一件事。']);
      await S.say('贝托', ['我哥说，那个女人面纱底下根本不是人脸，是一张马脸！长长的，白白的……也有人说是个骷髅。', '反正谁看见谁就完了。她要是喊你，你就得跑，不能回头。']);
      await S.say('贝托', '……陀螺你帮我还给他吧。我其实不想换的。');
      S.give('trompo');
      if (!S.f.ines) S.goal('去墓园问问伊内斯奶奶');
      return;
    }
    await S.say('贝托', '迭戈说要去墓园，找伊内斯奶奶。');
  }

  async function carmen(S) {
    S.face('carmen', 'pl');
    if (S.once('carmen1')) {
      await S.say('卡门', ['嘘——小声点，我在陪我爸说话呢。', '迭戈？没看见……我一直对着这块石头。']);
      await S.say('卡门', ['那个女人？我小时候，我妈就拿她吓唬我：你再半夜去河边玩水，她就来抱你。', '她的手指头又长又凉，像河底的石头。被她抱过的孩子，衣服再也晒不干。', '后来我当了妈，也拿她吓唬我的孩子。……人就是这样，把自己怕过的东西，一代一代地传下去。']);
      return;
    }
    S.face('carmen', 1);
    await S.say('卡门', '……爸，今年的龙舌兰是好的，你慢慢喝。', { style: 'whisper' });
  }

  async function ines(S) {
    S.face('ines', 'pl');
    if (S.f.phase === 'final') {
      if (S.f.gotFlores) return S.say('伊内斯奶奶', '快去吧，孩子。');
      S.f.gotFlores = true; S.give('flores');
      await S.say('伊内斯奶奶', ['万寿菊？拿我的。', '巴勃罗今年不缺花。他会愿意分给他们的——他从小就爱把东西分给别的孩子。']);
      return;
    }
    if (S.f.ines) return S.say('伊内斯奶奶', '快去找你弟弟。……可是别去河边。别像我一样，在河边等一辈子。');
    await S.say('伊内斯奶奶', '露西娅……你弟弟？');
    await S.say('伊内斯奶奶', ['他来过。天刚黑那会儿，蹲在这儿，看我给巴勃罗摆花。', '他问我：那个女人的孩子，也埋在这里吗？我说没有，没人知道他们埋在哪儿，河把他们带走了。', '他又问：那他们回家的路上，有花瓣吗？']);
    await S.narr('伊内斯奶奶沉默了很久。');
    await S.say('伊内斯奶奶', '……我没答上来。他就抓了一把我的花，往南边去了。往村口那边。');
    await S.say('露西娅', '南边……那是去河边的路！');
    S.bubble('ines', '!', 900);
    await S.say('伊内斯奶奶', ['孩子，三十一年前，我的巴勃罗也是这样一个晚上，去的河边。', '她穿白衣裳，头发是湿的，一直往下滴水，走路脚不沾地。', '她不是什么女神，也不是什么玛琳切——她就是一个女人。每个河边的村子，都说她是自己村里的人。也许，都是真的。']);
    await S.say('伊内斯奶奶', '你识字吧？我眼睛不行了……替我把这封信，念给巴勃罗听。');
    await S.note('carta');
    S.f.ines = true;
    for (let i = 0; i < 3; i++) S.show('fp' + i);
    S.show('calavera');
    S.goal('迭戈往南边村口去了——去看看');
  }

  async function chuy(S) {
    S.face('chuy', 'pl');
    if (S.f.phase === 'final') return S.say('楚伊大叔', '（他拨了一下琴弦，又按住了。）\n……今天晚上，我不唱那首歌了。');
    if (!S.f.chuy) {
      S.f.chuy = true;
      await S.say('楚伊大叔', ['嗝……谁？哦，是露西娅。来，坐，烤烤火。', S.f.ines ? '你弟弟？……我好像是看见个小影子往路那头去了。我还以为是自己喝多了。' : '你弟弟？我一直坐在这儿……也许打了个盹。']);
      await S.narr('楚伊大叔拨了拨吉他，哑着嗓子唱了一句：\n「¡Ay de mí, Llorona, Llorona……」\n（唉，我的哭泣的女人啊……）');
      await S.say('楚伊大叔', ['你知道她的规矩吗？大人们都不跟你们小孩说这个。', '她的哭声——要是听着很近，就在你耳朵边上，那她其实还远着呢，在河那头。', '要是听着很远，远得几乎听不见了……', '……那就别往那边走。她就在你身边。']);
      await S.say('楚伊大叔', ['还有：她只走有水的地方——河、水渠、水洼。', '花瓣路她是不走的。那是给死人回家的路，不是给她的。']);
      if (!S.f.ines) return;
    } else if (S.f.chuy2 || !S.f.ines) return S.say('楚伊大叔', '记住：哭声近，她远；哭声远，她就在你身边。');
    S.f.chuy2 = true;
    await S.say('楚伊大叔', ['南边那条路，穿过玉米地就到河边。男人们都往下游大桥那边找去了——可是小孩子，走的都是玉米地里的小路。', '……你要是非去不可，回来的时候别回头。听着钟声，沿着花瓣和蜡烛走。']);
    S.goal(S.f.skull ? '穿过玉米地，去河边找迭戈' : '去村口南边的路上看看');
  }

  async function padre(S) {
    S.face('padre', 'pl');
    if (S.f.bell) return S.say('托马斯神父', '男人们已经往下游去了。你回家等着，听见没有？……要是迷了路，就听钟声。');
    await S.say('托马斯神父', '露西娅？这么晚了……迭戈不见了？');
    await S.say('托马斯神父', ['他今天下午来过。问我：那个哭泣女人的孩子们，亡灵节也能回家吗？', '我说，只有天主知道。他又问：要是没有人给他们点蜡烛呢？', '……我没有回答。我不知道该怎么回答一个六岁的孩子。']);
    await S.say('托马斯神父', ['说起来，后屋柜子里有一张很老的照片。村里人都说，那就是她，和她的两个孩子。', '我留着它，也不知道是为了什么。']);
    await S.say('托马斯神父', '我这就去叫男人们沿河往下游找。你回广场等着——');
    const r = await S.ask('神父已经抓起了披风。', ['（点点头）', '要是我先找到他呢？']);
    if (r === 1) await S.say('托马斯神父', ['……你这孩子。', '那就沿着花瓣路回来。我会敲钟，一直敲，敲到你们都回家为止。听着钟声走，就不会迷路。']);
    else await S.say('托马斯神父', '好孩子。我会敲钟召集大家。不管你在哪儿，听见钟声，就往钟声那边走。');
    S.f.bell = true;
    await S.walk('padre', [7, 9], 3.4);
    S.sfx('open'); S.hide('padre');
    await S.narr('神父的脚步声跑远了。\n过了一会儿，外面响起了男人们的吆喝声，和一盏盏马灯晃动的光。');
  }

  /* 玉米地里走错路 */
  async function trapIn(S, tr) {
    const [px, py, back, n] = tr;
    if (S.f['trap' + n]) {
      S.sfx('drip');
      await S.narr('前面那个水洼里，还漂着那片白纱。\n……你不敢再往前走一步了。');
      return S.walk('pl', back, 7);
    }
    S.f['trap' + n] = true;
    S.place('llo_m2', px, py, 3); const g = S.ent('llo_m2'); g.alpha = 0;
    S.sfx('water');
    await S.narr('前面是一个水洼。路到头了。\n水面上……浮着一片白纱。');
    await S.alpha('llo_m2', 1, 700);
    await S.scare('face', { spr: '@llorona' });
    await S.say('哭泣的女人', '¡Ay, mis hijos……!', { style: 'whisper' });
    ghostOff(S, 'llo_m2');
    await S.walk('pl', back, 7);
    await S.narr('你连滚带爬地跑回了岔路口。心跳得像要从嗓子眼里蹦出来。');
    await S.think('那边……是听不见哭声的那一边。\n楚伊大叔说过，听不见哭声，她就在身边。');
  }

  /* 河边：救迭戈 */
  async function rescue(S) {
    S.f.phase = 'rescue';
    await S.say('露西娅', '迭戈！！');
    await S.narr('迭戈站在码头的最边上，背对着你，一动不动。他的一只脚是光着的。');
    await S.walk('pl', [12, 12], 3);
    await S.say('迭戈', ['……姐姐，你听。', '是妈妈。她在叫我。她说她找了我好久好久。'], { style: 'whisper' });
    S.amb('none');
    if (S.has('vela')) { S.take('vela'); S.plr(2.4); }
    await S.narr('一阵冷风贴着水面吹过来。你手里的蜡烛「噗」地灭了。\n……哭声也停了。\n四周忽然静得可怕——连河水都好像不流了。');
    await S.think('楚伊大叔说过……听不见哭声的时候——');
    S.sfx('water'); S.place('llo_r', 12, 16, 0); S.ent('llo_r').alpha = 0;
    await S.alpha('llo_r', 1, 1600);
    await S.narr('迭戈面前的水面鼓了起来。\n先是一片白纱，然后是湿透的长头发，然后是一个女人的肩膀。她从水里慢慢地站起来，像从一面黑镜子里走出来。');
    await S.say('哭泣的女人', 'Mijo……ven con tu mamá……\n（孩子……到妈妈这儿来……）', { style: 'whisper' });
    S.bubble('diego_r', '…', 1200);
    await S.scare('face', { spr: '@llorona', sfx: 'scream' });
    await S.say('哭泣的女人', '¡Ay, mis hijos!\n（哎呀，我的孩子们！）', { style: 'big' });
    const r = await S.ask('迭戈朝水里迈出了一步——', ['抓住迭戈的手，往回跑！', '「迭戈！她不是妈妈！」', '（她在哭……）走过去，看看她的脸'], '露西娅');
    if (r === 2) return badRiver(S);
    if (r === 1) {
      await S.say('露西娅', ['迭戈！她不是妈妈！', '妈妈的照片在奶奶的祭坛上！妈妈今天晚上在家里等我们——在家里！']);
      S.sfx('scream'); S.shake(600, 3);
      await S.narr('女人发出一声尖叫，像河上的冰一下子裂开。');
    }
    await S.narr('你一把攥住迭戈冰凉的小手，把他往后一拽。');
    S.face('diego_r', 'pl');
    await S.say('迭戈', '……姐姐？我怎么……我的船……');
    await S.say('露西娅', '别回头！跑！');
    S.f.phase = 'flee'; S.f._bell = .4;
    S.follow('diego_r', true); S.turn(3); S.amb('river');
    S.goal('跑！沿原路穿过玉米地回村子——跟着钟声走');
    S.cp('flee_r');
    S.chase('llo_r', { spd: 2.8, wait: 1.5, catch: caught });
  }

  async function badRiver(S) {
    await S.narr('你松开了迭戈的肩膀，从他身边走了过去。\n码头的木板在脚下吱呀吱呀地响。');
    await S.narr('女人抬起头。湿透的面纱底下，是一张年轻的脸，眼睛哭得通红。\n她看着你，就像看着一件找了很久很久的东西。');
    await S.say('哭泣的女人', '¿Rosita……?', { style: 'whisper' });
    S.amb('none');
    await S.narr('她向你伸出手。\n水没过了你的脚踝、膝盖、胸口。一点也不冷。');
    await S.fade(1, 1500);
    await S.end({ bad: true, title: '河水一点也不冷', text: '第二天早上，人们在下游的芦苇丛里找到了迭戈。他睡着了，手里攥着一只湿透的纸船。\n\n露西娅没有回来。\n\n后来，村里的孩子们说，有些晚上，河边的哭声变成了两个：一个是女人的，一个是小女孩的。\n她们一起喊着同一个名字。' });
  }

  /* 逃回烛光里 */
  async function safe(S) {
    S.f.phase = 'safe';
    S.stop('llo_p'); S.hide('llo_p');
    S.follow('diego_p', false);
    S.f._bell = 99; S.plr(null);
    const dw = bg(S.walk('diego_p', [17, 13], 6)); await S.walk('pl', [16, 13], 6); await dw;
    S.face('diego_p', 0);
    await S.narr('你冲进了烛光里。膝盖一软，和迭戈一起摔在了花瓣上。');
    S.turn(0);
    S.place('llo_p', 16, 16, 3); const L = S.ent('llo_p'); L.alpha = .2;
    S.focus(16, 15);
    await S.alpha('llo_p', .9, 900);
    await S.narr('白衣的女人停在了烛光的边上。\n她伸出手，指尖一碰到光，就像碰到了火，猛地缩了回去。');
    await S.say('哭泣的女人', '¡Ay……mis hijos……!\n（哎呀……我的孩子们……！）', { style: 'whisper' });
    bg(S.bells(3, 600));
    S.place('abuela_p', 17, 12, 0); S.place('padre_p', 19, 12, 0); S.place('ines', 15, 12, 0); S.face('chuy', 1);
    S.hide('abuela'); S.hide('padre');
    await S.say('祖母', ['¡Mis niños!（我的孩子们！）', '……谢天谢地，谢谢圣母……']);
    await S.think('奶奶也在喊「我的孩子们」。\n……可那是完全不一样的声音。');
    await S.say('托马斯神父', 'Dios mío（我的天主）……她不进来。她进不来。');
    await S.say('楚伊大叔', '花瓣，蜡烛……我说过的。她只能待在黑的地方，有水的地方。');
    S.face('diego_p', 0);
    await S.say('迭戈', ['姐姐……她还在哭。', '我本来想……给她的孩子们放一只点着蜡烛的船，让他们顺着河找回来。可是船漂走了。', '她找了那么久……她的孩子们，一定也在找她。可是没有人给他们点蜡烛，他们看不见路。']);
    await S.narr('谁也没有说话。');
    S.face('ines', 'pl');
    await S.say('伊内斯奶奶', ['这孩子说得对。', '三十一年了，我一直恨她。', '可是要是我的巴勃罗也在那边，也找不着路……我会希望有个人，给他点一根蜡烛。']);
    await S.say('祖母', ['……好吧。', '就在这儿，在花瓣路的尽头，给那两个孩子摆一个小祭坛。让他们看得见。']);
    S.show('altarcito');
    await S.narr('楚伊大叔把他坐的木凳搬了过来，放在花瓣路的尽头。\n可是凳子上，还什么都没有。');
    S.focus(null);
    S.f.phase = 'final'; S.f._cry = 5;
    S.goal('为那两个孩子摆祭坛：蜡烛、万寿菊、亡灵面包，和他们的名字');
    S.cp('final');
  }

  async function abuelaFinal(S) {
    S.face('abuela_p', 'pl');
    if (!S.f.gotVelas) {
      S.f.gotVelas = true; S.give('velas');
      await S.say('祖母', ['蜡烛，我从咱们家的祭坛上拿了两支。', '你妈妈不会介意的。她最心疼孩子了——谁家的孩子都心疼。']);
      return;
    }
    const miss = [];
    if (!S.has('flores') && !S.f.altarDone) miss.push('万寿菊——伊内斯手里还有一大把');
    if (!S.has('pan') && !S.f.altarDone) miss.push('亡灵面包——广场上托尼娅的摊子');
    if (!S.f.photo) miss.push('名字——神父也许知道');
    await S.say('祖母', miss.length ? ['还缺：', miss.join('；\n') + '。'] : ['都齐了。去吧，孩子。把它们摆上。']);
  }

  async function altarcito(S) {
    if (S.f.phase !== 'final') return;
    const need = [['velas', '蜡烛'], ['flores', '万寿菊'], ['pan', '亡灵面包']].filter(([k]) => !S.has(k)).map(([, n]) => n);
    if (need.length) return S.narr('一张空空的木凳子。\n还缺：' + need.join('、') + '。');
    if (!S.f.photo) {
      await S.narr('蜡烛、花、面包，都齐了。\n最后一样是名字。可是……你不知道他们叫什么。');
      S.goal('打听那两个孩子的名字（神父说过，教堂后屋有一张老照片）');
      return;
    }
    const r = await S.ask('在纸上写下他们的名字：', ['尼古拉斯　和　罗西塔', '巴勃罗　和　埃斯佩兰莎', '玛丽亚　和　迭戈', '（再想想）'], '露西娅');
    if (r === 3) return;
    if (r !== 0) {
      S.sfx('match'); await S.wait(400);
      await S.narr('你写下了名字，划着了火柴。\n蜡烛的火苗晃了一下，就灭了。\n……不对。这不是他们的名字。');
      return;
    }
    return finale(S);
  }

  async function finale(S) {
    S.f.altarDone = true;
    await S.walk('pl', [16, 13], 4); S.turn(0);
    S.take('velas'); S.take('flores'); S.take('pan');
    const A = S.ent('altarcito');
    A.s = { fl: 1 }; await S.wait(300); A.s = { fl: 1, pan: 1 };
    await S.narr('你把万寿菊铺在凳子上，中间摆上亡灵面包，两头各立一支蜡烛。');
    A.s = { fl: 1, pan: 1, nom: 1 };
    await S.narr('然后，你用炭条在一张白纸上，一笔一笔地写下：\n\nNICOLÁS　　ROSITA');
    if (S.f.trompoGift) await S.say('迭戈', '还有这个。给尼古拉斯。男孩子都喜欢陀螺。');
    S.sfx('match'); await S.wait(500);
    A.s = { fl: 1, pan: 1, nom: 1, v: 1 }; A.light = { r: 3.6, col: 'rgba(255,170,80,.26)', flick: true };
    await S.narr('火柴「嚓」地一声。两支蜡烛亮了。');
    await S.say('迭戈', '等一下！');
    await S.walk('diego_p', [17, 15], 4);
    for (let y = 15; y <= 22; y++) { S.tile(16, y, 'p'); if (y === 15 || y === 17 || y === 22) S.sfx('blip'); await S.wait(110); }
    await S.say('迭戈', '剩下的花瓣，我都撒到路上了。这样，他们就知道该往哪儿走了。');
    await S.walk('diego_p', [17, 13], 4);
    S.face('diego_p', 0);
    S.focus(16, 18); S.amb('none');
    await S.narr('风停了。\n两支蜡烛的火苗，一起朝南边——朝着河的方向——弯了下去。');
    await S.wait(700);
    for (const id of ['nico', 'rosita']) { S.ent(id).alpha = 0; S.show(id); }
    S.place('nico', 15, 22, 3); S.place('rosita', 17, 22, 3); S.ent('nico').alpha = 0; S.ent('rosita').alpha = 0;
    bg(S.alpha('nico', .8, 1200)); await S.alpha('rosita', .8, 1200);
    await S.narr('路的尽头，黑暗里，亮起了两点很小很小的光。');
    const a = bg(S.walk('nico', [15, 15], 1.8)); await S.walk('rosita', [17, 15], 1.8); await a;
    S.focus(16, 15);
    await S.narr('两个小小的影子踩着花瓣，从白衣女人的身边走了过去。\n她没有看见他们。她一直望着村子里的烛光，望着那张小小的祭坛——好像只要望得够久，那些光就会变成她的孩子。');
    S.face('nico', 3); S.face('rosita', 3);
    await S.wait(600);
    await S.narr('两个孩子站在祭坛前，看着纸上的名字，看了很久。\n然后，小女孩转过身来。');
    S.face('nico', 0); S.face('rosita', 0);
    await S.say('罗西塔', '……¿Mamá?\n（妈妈？）', { style: 'whisper' });
    S.bubble('llo_p', '!', 1400);
    await S.narr('哭声，停了。');
    const m = S.ent('maria_p'); m.alpha = 0; S.show('maria_p'); S.place('maria_p', 16, 16, 3); m.alpha = 0;
    bg(S.alpha('llo_p', 0, 1400)); await S.alpha('maria_p', 1, 1400);
    await S.narr('她慢慢地，掀开了面纱。');
    await S.say('玛丽亚', 'Nicolás……Rosita……', { style: 'whisper' });
    const b = bg(S.walk('nico', [15, 16], 1.6)); await S.walk('rosita', [17, 16], 1.6); await b;
    S.face('nico', 2); S.face('rosita', 1);
    S.sfx('chime');
    await S.narr('她跪了下来，把两个孩子一起搂进了怀里。\n这么多年了，她的白裙子第一次，没有在滴水。');
    bg(S.alpha('nico', 0, 2600)); bg(S.alpha('rosita', 0, 2600)); await S.alpha('maria_p', 0, 2600);
    S.amb('night');
    await S.narr('然后，他们一起慢慢地淡了下去，像蜡烛熄灭以后的那缕烟，散进了夜里。\n\n河边、玉米地、整条河，都安静了下来。只剩下蟋蟀在叫。');
    S.focus(null);
    S.face('diego_p', 'pl');
    await S.say('迭戈', '姐姐……她不哭了。');
    S.face('ines', 0);
    await S.say('伊内斯奶奶', '……巴勃罗，你看见了吗。你也回家吧。', { style: 'whisper' });
    await S.say('托马斯神父', 'Descansen en paz.\n（愿他们安息。）');
    S.face('abuela_p', 'pl');
    await S.say('祖母', ['也许那不是原谅。只是终于有人记得他们了。', '……走吧，孩子们，回家。你们的妈妈还在家里等着呢。']);
    await S.fade(1, 1400);
    await S.card('1952年11月2日　清晨', '', '那一年，河边的哭声第一次停了。\n\n第二年亡灵节，花瓣路的尽头多了一张小小的祭坛，\n朝着河的方向。上面没有照片，\n只有两个名字，和两支蜡烛。\n\n后来，蜡烛越来越多——\n给所有没有人记得名字的人。');
    await S.end({ title: '第十夜　完', text: '有人说，哭泣的女人后来又出现在别的河边、别的国家、别的故事里。\n这世上的河那么多，她大概不止一个。\n\n……十个夜晚，讲到这里就讲完了。\n吹熄蜡烛之前，替故事里那些找不到路的人，也留一盏灯吧。' });
  }
})();
