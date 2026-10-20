/* ================= 第四夜 · 湘西赶尸 ================= */
(() => {
  /* ---------- 小工具 ---------- */
  const NOOKS = [4, 5, 12, 13, 21, 22];
  const NOOK = (x, y) => y === 2 && NOOKS.includes(x);                 // 山壁上的石窝
  const HALL = (x, y) => (y >= 6 && y <= 12 && x >= 1 && x <= 24) || (y >= 2 && y <= 4 && x >= 8 && x <= 12) || (x === 11 && y === 5);   // 夜里她能走到的地方：堂屋 + 师傅房
  const cycle = (S, key, lines) => lines[(S.f[key] = ((S.f[key] ?? -1) + 1) % lines.length)];
  const XSB = '#c9c6b2';
  /* 喜神：斗笠、黄符、袍子盖脚，侧面双臂平伸 */
  function xsP(key, robe, o = {}) {
    return Object.assign({
      key, skin: XSB, hair: '#141012', hs: o.long ? 'long' : 'short', top: robe, top2: shade(robe, -.3), robe: true, shoes: '#141210', eye: o.eye || '#3a3a34',
      extra(g, d, fr, G, R) {
        const h = G.hT;
        if (!o.nohat) { R(0, h + 1, 16, 1, '#6a5634'); R(1, h, 14, 1, '#8a7448'); R(3, h - 1, 10, 1, '#a08856'); R(5, h - 2, 6, 1, '#b09a66'); R(7, h - 3, 2, 1, '#c0aa76'); }
        if (o.long && d !== 3) { if (d === 0) { R(3, h + 2, 1, 9, '#141012'); R(12, h + 2, 1, 9, '#141012'); } else R(10, h + 2, 2, 9, '#141012'); }
        if (d === 0) {
          if (!o.nofu) { R(6, h + 2, 4, 8, '#e6c64a'); R(6, h + 2, 4, 1, '#c8a83a'); R(7, h + 3, 2, 1, '#b02020'); R(7, h + 5, 2, 3, '#b02020'); R(6, h + 9, 4, 1, '#c8a83a'); }
          else { R(6, h + 4, 1, 1, '#6a6a60'); R(9, h + 4, 1, 1, '#6a6a60'); R(6, h + 1, 4, 1, 'rgba(176,32,32,.6)'); }
          R(3, G.tT + 1, 1, 2, XSB); R(12, G.tT + 1, 1, 2, XSB);
        } else if (d === 1) {
          if (!o.nofu) { R(3, h + 2, 2, 8, '#e6c64a'); R(3, h + 4, 1, 3, '#b02020'); }
          R(1, G.tT + 2, 7, 2, robe); R(0, G.tT + 2, 1, 2, XSB);
        }
        if (o.lock && d === 0) { R(7, G.tT + 1, 2, 1, '#b02020'); R(7, G.tT + 2, 2, 2, '#c8ccd0'); }
      }
    }, o.P || {});
  }
  const TURBAN = (c) => (g, d, fr, G, R) => { R(3, G.hT - 1, 10, 3, c); R(4, G.hT - 2, 8, 1, shade(c, .18)); if (d === 0) R(4, G.hT + 1, 8, 1, shade(c, -.2)); if (d === 1) R(10, G.hT + 1, 3, 2, shade(c, -.2)); };

  defChapter({
    id: 'ganshi', n: 4, title: '湘西赶尸', sub: '夜半的山路上响起阴锣。客店的大门终年不关，门后靠墙，站着戴斗笠的「喜神」。', origin: '中国湘西民间传说', color: '#3a3020',
    icon: '@xs1', amb: 'wind', floor: 'dirt', wall: 'stone', dark: .8, plr: 3, darkC: '#04080a',
    people: {
      me: { key: 'gs-me', skin: '#e2b48a', hair: '#1a1410', hs: 'short', top: '#3e5266', top2: '#2a3644', bottom: '#2e2c2a', shoes: '#9a8656', extra: TURBAN('#1e1c22') },
      salt: { key: 'gs-salt', skin: '#b88a62', hair: '#8a867e', hs: 'short', top: '#5a5446', top2: '#3a362c', bottom: '#3a3630', shoes: '#9a8656', extra: TURBAN('#d8d2c0') },
      teng: { key: 'gs-teng', skin: '#c49a74', hair: '#6a665e', hs: 'short', top: '#2c3a48', top2: '#1c242e', robe: true, shoes: '#9a8656', eye: '#1a1210',
        extra(g, d, fr, G, R) { TURBAN('#141216')(g, d, fr, G, R); if (d === 0) { R(5, G.hT + 6, 6, 2, '#7a766e'); R(6, G.hT + 8, 4, 1, '#7a766e'); } else if (d === 1) R(4, G.hT + 6, 3, 2, '#7a766e'); } },
      yao: { key: 'gs-yao', skin: '#e0b088', hair: '#18120e', hs: 'short', top: '#6a5a3a', top2: '#4a3e28', bottom: '#3a3428', shoes: '#9a8656', child: true, extra: TURBAN('#2a2a3a') },
      yan: { key: 'gs-yan', skin: '#e6c09a', hair: '#1a1210', hs: 'bun', top: '#5a3a4a', top2: '#2a1a24', bottom: '#3a2a34', skirt: true, apron: '#3a3a5a', shoes: '#2a1a1a', mouth: '#a05050',
        extra(g, d, fr, G, R) { if (d === 0) R(10, G.hT - 2, 3, 1, '#d8dce0'); else if (d === 1) R(10, G.hT - 1, 3, 1, '#d8dce0'); } },
      tian: { key: 'gs-tian', skin: '#c89870', hair: '#c8c4bc', hs: 'bald', top: '#3a3a3a', top2: '#262626', robe: true, shoes: '#1a1a1a',
        extra(g, d, fr, G, R) { if (d === 0) { R(5, G.hT + 7, 6, 2, '#d8d4cc'); R(11, G.tT + 2, 1, 4, '#5a3a20'); R(10, G.tT + 1, 2, 1, '#3a2a1a'); } else if (d === 1) { R(2, G.hT + 6, 3, 1, '#5a3a20'); R(1, G.hT + 5, 1, 1, '#ff8a3a'); } } },
      mom: { key: 'gs-mom', skin: '#d8b08a', hair: '#5a5450', hs: 'bun', top: '#2a3a5a', top2: '#1a2440', bottom: '#1e2a40', skirt: true, apron: '#4a3a5a', shoes: '#1a1a1a', hat: 'scarf', hatC: '#1e1c22',
        extra(g, d, fr, G, R) { if (d === 0) { R(3, G.tT + 3, 1, 3, '#d8dce0'); R(12, G.tT + 3, 1, 3, '#d8dce0'); } } },
      xs1: xsP('gs-xs1', '#3a3a44'),
      xs2: xsP('gs-xs2', '#3e3830'),
      xs3: xsP('gs-xs3', '#4a4a52', { long: true }),
      xs3n: xsP('gs-xs3n', '#4a4a52', { long: true, nofu: true }),
      xs3up: { key: 'gs-xs3up', skin: '#d4d0c0', hair: '#0e0a0c', hs: 'long', top: '#4a4a52', robe: true, eye: '#f4f2ea', mouth: '#3a1a1a',
        extra(g, d, fr, G, R) { if (d === 0) { R(5, G.hT + 1, 6, 1, '#b02020'); R(6, G.hT + 4, 1, 2, '#f4f2ea'); R(9, G.hT + 4, 1, 2, '#f4f2ea'); R(7, G.tT + 1, 2, 1, '#b02020'); } } }
    },
    items: {
      huodan: { name: '货担', desc: '一根扁担两只箩筐：针头线脑、洋火、雪花膏、几包洋糖，还有给寨子里女人捎的绣花样子。' },
      lingluo: { name: '阴锣和铜铃', desc: '滕师傅的家伙什。铜锣边上磕了好几个豁口，铜铃的舌头用红线缠过。拿在手里，凉得像井水。' },
      fuzhi: { name: '黄表纸和符笔', desc: '一沓裁好的黄表纸，一支秃了尖的狼毫。笔杆上被手汗磨出了一圈亮。' },
      zhudie: { name: '空朱砂碟', desc: '巴掌大的粗瓷碟，碟底积着一层干了的红。' },
      yudie: { name: '盛着檐水的碟', desc: '朱砂碟里盛了半碟檐下接的雨水。端着走，一滴也不敢洒。' },
      zhusha: { name: '朱砂', desc: '祠堂香案上讨来的一小包辰砂，红得发紫。纸包上还沾着一点香灰。' },
      yinsuo: { name: '银锁', desc: '一把小小的长命锁，拴着褪了色的红绳。正面錾着「长命百岁」，背面刻着「滕门秀姑」。' }
    },
    notes: {
      lugui: { title: '路边的木牌', text: '（山道边钉着一块木牌，墨字被雨水淋得发灰）\n\n过往客商须知\n\n一、夜半闻锣声，即是「喜神」过路。\n二、速避道旁，面朝山壁，勿回头，勿出声。\n三、勿挡其道，勿与招呼，勿以灯火照其面。\n四、家犬须拴牢，莫使吠叫。\n五、赶尸先生夜行昼宿，鸡鸣即歇。沿途客店，例不闭门。\n\n　　　　　　　　　　　　本乡乡公所　示\n\n（木牌底下，有人用小刀刻了一行歪字：莫回头，回头它就记得你了。）' },
      zhangbu: { title: '赶尸匠的账簿', text: '（蓝布面的小账簿，油渍斑斑，摊在桌上）\n\n封皮里头，用毛笔工工整整写着：\n\n三赶——砍头的，绞死的，站笼站死的。\n三不赶——病死的，投河吊颈的，雷打火烧的。\n\n（底下一行小字：赶的是死于非命、魂还拘在身上的；不赶的，魂早散了，赶也赶不动。）\n\n民国二十四年　八月\n一　龙某　男　卅二　辰州　斩　送凤凰　收大洋八块\n二　向某　男　四十　沅陵　绞　送泸溪　收大洋六块\n三　吴氏　女　十六　辰州　——　送麻阳\n\n（第三行没写怎么死的，也没写收了多少钱。「吴」字描了又描，墨都洇开了。）' },
      koujue: { title: '赶尸口诀', text: '（师傅包袱里的小本子，封皮上写着「滕氏行脚　传徒不传外」）\n\n阴锣开道，阳铃引魂。\n锣在前，叫活人让路；铃在后，叫喜神跟上。\n\n一锣一铃——喜神起身。\n铃铃锣——喜神随行。\n锣锣——喜神转身。\n铃、锣、铃、铃——喜神住脚，面壁立定。\n\n符落，喜神不认铃，循生人之气而行。\n此时铃锣只镇得一炷香。\n\n补符法：黄表纸，辰砂，调无根水。\n无根水者，不沾地之水，檐下所接雨水是也。\n切莫用井水——井水自地底出，有根，拴魂。\n\n符头须书喜神名姓。\n名不真，符不灵。\n\n（最后一页被茶水泡过，只剩半句：……病死者，万不可……）' },
      baozhi: { title: '包烟叶的旧报纸', text: '（义庄桌上，一张包过烟叶的旧报纸，皱成一团）\n\n……「湘西赶尸」之说，外间传得神乎其神，谓死者额贴黄符，随铃声一跳一跃，夜行百里而归故土。\n\n记者此番沿沅水上行，留心访查，所闻各有不同。\n或谓并非死尸自行，乃赶尸人将尸身负于背上，罩以宽大寿衣，戴大斗笠，远望之，一人便如两人；\n或谓以两根竹竿将尸身架起，二人前后抬行，竹竿颤动，望之如跳；\n更有人言，运回者不过遗骨，所谓「赶尸」，不过吓退闲人之术。\n\n然湘西山高路险，棺木难行，客死异乡者又多，乡人宁信其有。记者询之店家，店家只答：「先生莫问，夜里莫出门便是。」\n\n——本报特约通讯员\n\n（报纸的另一半被撕去包了烟叶。剩下的边角上，有一圈黄黄的茶渍。）' }
    },
    legend: '「湘西赶尸」是流传在湖南西部沅水流域（沅陵、辰溪、泸溪、溆浦一带）的民间传说。据说客死他乡的人，可以由「赶尸匠」作法，让尸体自己一跳一跳地走回家乡入土。赶尸匠把尸体叫作「喜神」，夜行昼宿：天黑才上路，前头有人敲「阴锣」、摇铃，通知沿途的人回避、拴狗；鸡叫之前必须赶到专门接待他们的客店歇脚。传说这种客店的大门终年不关，喜神白天就靠墙站在门板后头。尸体额头贴着朱砂画的「辰州符」，头戴斗笠或罩着黑布。\n\n关于什么人能赶，流传最广的是「三赶三不赶」：据说砍头的、受绞刑的、站笼站死的可以赶——死于非命，魂魄被法术拘在身上；病死的、投河上吊的、雷打火烧的不赶。起源也有几种说法：一种上溯到蚩尤，说他率兵作战，为把阵亡的将士带回故乡，命军师作法驱尸；更多的说法把它和「辰州符」「祝由」这类湘西巫术连在一起。辰州（今沅陵）一带出产朱砂，所以朱砂又叫「辰砂」。据说沈从文写湘西的散文里，也提到过辰州符与赶尸这类传闻。\n\n历来也有很多人怀疑。常见的解释是：尸体并非自己走，而是赶尸人把尸体背在背上，宽大的寿衣和斗笠遮住了背尸的人；或者两人用竹竿把尸体架起来抬着走，竹竿一颤一颤，远看就像在跳；也有人说实际运回去的只是遗骨，「赶尸」的种种禁忌，不过是吓退外人的障眼法。湘西山高路险、棺木难运、雇人抬棺价钱高昂，夜里走又能避开人群——这些现实的缘由，被认为是这门行当（如果它真的存在过）的土壤。到了1980年代，香港电影把它改造成穿清朝官服、伸直双臂蹦跳的「僵尸」，那已经是另一个故事了。\n\n（本章中的晏家老店、滕师傅与秀姑父女、石满仓、赶尸口诀里铃与锣的节奏、「无根水」调朱砂的补符法、祠堂讨朱砂、义庄里喊名字的声音，均为游戏虚构；寨口一人喊魂、一人应「回来了」的情节，据湘西等地的「叫魂」习俗改编。）',
    start: { map: 'shanlu', x: 1, y: 3, dir: 2 },
    resume: {
      gong: async S => { S.amb('none'); S.f._gt = 0; },
      stalk: async S => { resetXs(S); },
      fu: async S => { S.norun(false); S.timer(300, '一炷香', incenseOut); },
      zk: async S => { S.norun(false); }
    },
    async intro(S) {
      S.give('huodan', true);
      await S.card('第四夜　湘西赶尸', '民国二十四年秋　湘西　沅水上游', '货郎石满仓挑着担子，\n在沅水边的山路上，多走了一程。\n\n天黑透了。\n离前头的客店，还有五里路。');
    },
    tick(S, dt) {
      const m = curMap();
      for (const e of m.ents) if (e.s && e.s.hop) e.oy = e.mv ? -Math.round(Math.abs(Math.sin(RT * 11)) * 3) : 0;
      if (S.map === 'shanlu') gongTick(S, dt);
      if (S.map === 'kedian') stalkTick(S, dt);
      if (S.map === 'zhaikou') zkTick(S, dt);
    },
    sprites: {
      youdeng(g, e, t, R) {   // 桐油灯：灯台 + 油碟
        R(7, 3, 2, 11, '#4a3420'); R(4, 13, 8, 2, '#3a2818'); R(3, 2, 10, 2, '#6a5a44'); R(4, 1, 8, 1, '#2a2010');
        if (!e.off) { const f = Math.sin(t * 15 + e.x) > 0 ? 1 : 0; R(7, -3 + f, 2, 4 - f, '#ffb040'); R(7, -1, 2, 2, '#ffe090'); R(8, -4 + f, 1, 1, '#ff7a20'); }
        else { R(7, 0, 2, 1, '#333'); R(8, -3 - ((t * 4) % 4), 1, 2, 'rgba(200,200,200,.3)'); }
      },
      fu(g, e, t, R) { R(3, 5, 9, 9, '#e6c64a'); R(4, 6, 7, 1, '#c8a83a'); R(7, 7, 2, 5, '#b02020'); R(5, 9, 6, 1, '#b02020'); R(3, 13, 9, 1, '#a88a2a'); R(11, 5, 1, 3, 'rgba(0,0,0,.25)'); },
      menban(g, e, t, R) { box(R, 3, -12, 10, 26, '#5a3a22'); R(4, -10, 8, 10, '#6a4a2e'); R(4, 2, 8, 10, '#6a4a2e'); R(7, -2, 2, 2, '#c9a35a'); R(3, 14, 10, 1, 'rgba(0,0,0,.4)'); },
      huotang(g, e, t, R) {   // 火塘（2×1）和吊锅
        box(R, 0, 3, 32, 12, '#5a5248'); R(2, 5, 28, 8, '#1a1210');
        for (let i = 0; i < 6; i++) { const h = 2 + (((Math.sin(t * 9 + i * 1.9) + 1) * 2.5) | 0); R(5 + i * 4, 12 - h, 3, h, i % 2 ? '#ff8a2a' : '#ffcf5a'); }
        R(15, -16, 2, 10, '#2a2420'); box(R, 10, -7, 12, 9, '#2a2a2c'); R(11, -6, 10, 1, '#4a4a4c');
        R(14 + Math.sin(t * 2) * 2, -12 - ((t * 5) % 6), 3, 2, 'rgba(210,210,210,.3)');
      },
      baofu(g, e, t, R) {   // 蓝布包袱 + 铜锣
        if (e.open) { R(1, 8, 14, 7, '#2a3a5a'); R(3, 9, 4, 3, '#e6c64a'); R(9, 10, 4, 3, '#d8d0c0'); return; }
        box(R, 2, 4, 12, 11, '#2a3a5a'); R(6, 2, 4, 3, '#2a3a5a'); R(5, 1, 2, 2, '#1e2a40'); R(9, 1, 2, 2, '#1e2a40');
        R(9, 8, 6, 6, '#a87a3a'); R(10, 9, 4, 4, '#c8963a'); R(11, 10, 2, 2, '#7a5222');
      },
      tengbed(g, e, t, R) {   // 床（竖 1×2）；sick = 有人躺着
        box(R, 1, -2, 14, 32, '#4a3020'); R(2, -1, 12, 3, '#5a3a24'); R(3, 2, 10, 6, '#d8d2c0');
        if (e.sick) { R(5, 2, 6, 5, '#c49a74'); R(4, 1, 8, 2, '#141216'); R(6, 4, 1, 1, '#1a1210'); R(9, 4, 1, 1, '#1a1210'); R(6, 6, 4, 1, '#7a766e'); if (Math.sin(t * 2) > .6) R(10, -3, 2, 2, 'rgba(220,220,220,.25)'); }
        R(2, 9, 12, 19, e.col || '#3a4a5a'); R(2, 9, 12, 2, shade(e.col || '#3a4a5a', .2)); if (e.sick) R(4, 11 + (Math.sin(t * 1.5) > 0 ? 1 : 0), 8, 1, '#2e3c4a');
      },
      huodanS(g, e, t, R) { R(0, 4, 16, 1, '#8a6a3a'); for (const x of [1, 9]) { box(R, x, 6, 6, 8, '#a07a40'); R(x + 1, 7, 4, 1, '#c09a58'); R(x + 2, 3, 1, 3, '#6a4a2a'); } R(10, 8, 3, 2, '#e8e0d0'); R(3, 8, 2, 2, '#c02828'); },
      guan(g, e, t, R) {   // 棺材（竖 1×2）
        R(1, 29, 14, 3, 'rgba(0,0,0,.4)'); box(R, 1, 0, 14, 30, '#2a1a14'); R(2, 1, 12, 5, '#3a241a'); R(2, 1, 12, 1, '#4a3022');
        R(6, 10, 4, 5, '#c8b8a0'); R(7, 11, 2, 1, '#2a1a14'); R(7, 13, 2, 1, '#2a1a14');
        if (e.open) R(3, 7, 10, 20, '#0a0606');
      },
      yangang(g, e, t, R) {   // 檐下接雨的大瓦缸
        box(R, 1, 2, 14, 13, '#5a4a3e'); R(2, 3, 12, 3, '#2a3a4a'); R(3, 4, 4, 1, '#4a6070'); R(1, 9, 14, 1, '#4a3c32');
        const k = (t * 22) % 18; R(7, -6 + k, 1, 2, 'rgba(170,190,220,.7)'); R(9, -6 + ((k + 9) % 18), 1, 2, 'rgba(170,190,220,.5)');
        if (k < 3) R(5, 3, 6, 1, 'rgba(200,220,235,.5)');
      },
      coop(g, e, t, R) {   // 鸡笼，里头一只大公鸡
        box(R, 0, 2, 16, 13, '#6a5030'); for (let x = 2; x < 15; x += 3) R(x, 3, 1, 11, '#3a2a18');
        const b = Math.sin(t * 3) > .8 ? 1 : 0; R(5, 7 + b, 6, 4, '#c87a2a'); R(10, 5 + b, 2, 2, '#c02020'); R(11, 7 + b, 2, 1, '#e8b030'); R(4, 6 + b, 2, 3, '#2a4a2a'); R(10, 7 + b, 1, 1, '#111');
      },
      woodpile(g, e, t, R) { for (let r = 0; r < 3; r++) for (let i = 0; i < 4; i++) { R(i * 4, 2 + r * 4, 4, 4, '#5a3c22'); R(i * 4 + 1, 3 + r * 4, 2, 2, '#9a7a4a'); } },
      vat(g, e, t, R) { box(R, 1, 1, 14, 14, '#4a4440'); R(2, 2, 12, 3, '#1a2630'); R(3, 3, 4, 1, '#3a5060'); R(1, 8, 14, 1, '#38322e'); },
      zao(g, e, t, R) {
        box(R, 0, 1, 16, 14, '#7a5a44'); R(2, 2, 12, 5, '#2a2a2a'); R(3, 3, 10, 3, '#4a4a48'); R(4, 9, 8, 5, '#1a0c08');
        if (!e.off) { const f = Math.sin(t * 9) > 0 ? 1 : 0; R(5, 11 + f, 6, 3 - f, '#ff8a2a'); R(7, 12, 2, 1, '#ffcf5a'); }
      },
      paiwei(g, e, t, R) { for (let i = 0; i < 3; i++) { const x = 1 + i * 5, h = i === 1 ? 12 : 9; R(x, 13 - h, 4, h, '#1a1210'); R(x + 1, 14 - h, 2, h - 2, '#c9a35a'); R(x, 13, 4, 1, '#6a3a1a'); } },
      bian(g, e, t, R) { box(R, -4, 2, 24, 9, '#2a1a10'); R(-3, 3, 22, 7, e.col || '#6a1a14'); for (let i = 0; i < 4; i++) R(-1 + i * 5, 5, 3, 3, '#c9a35a'); },
      crow(g, e, t, R) { const h = Math.sin(t * 2 + e.x) > .7 ? 1 : 0; R(5, 6, 6, 4, '#141418'); R(4 + h, 4, 3, 3, '#141418'); R(3 + h, 5, 1, 1, '#3a3a20'); R(10, 8, 3, 2, '#141418'); R(6, 10, 1, 2, '#333'); R(9, 10, 1, 2, '#333'); },
      dog(g, e, t, R) {
        const b = e.bark && Math.sin(t * 12) > 0 ? 1 : 0, c = '#a8803a';
        R(4, 6, 9, 5, c); R(1, 3 + b, 5, 5, c); R(0, 5 + b, 2, 2, '#8a6a2a'); R(3, 2 + b, 2, 2, '#6a4a1a'); R(2, 4 + b, 1, 1, '#111');
        R(5, 11, 2, 3, '#7a5a20'); R(10, 11, 2, 3, '#7a5a20'); R(12, 9, 3, 2, '#8a6a2a'); R(13, 7, 3, 1, '#888');
      },
      zhaimen(g, e, t, R) {   // 寨门：横跨大路的木门楼（竖跨 4 格）
        R(5, -8, 6, 72, '#2a1a10'); R(6, -6, 4, 68, '#4a3020'); R(2, -12, 12, 6, '#1a1410'); R(1, -14, 14, 2, '#2a2420');
        R(2, 56, 12, 6, '#1a1410'); R(4, 10, 8, 3, '#7a1a14'); R(4, 38, 8, 3, '#7a1a14');
        box(R, 3, 18, 10, 14, '#6a1a14'); R(5, 21, 6, 8, '#c9a35a'); R(7, 23, 2, 4, '#6a1a14');
      },
      qiao(g, e, t, R) {   // 风雨桥：两排柱子和瓦檐（3×4）
        for (const x of [0, 22, 44]) { R(x + 1, -6, 3, 22, '#3a2416'); R(x + 1, 42, 3, 22, '#3a2416'); }
        R(-3, -12, 54, 7, '#22262a'); R(-3, -12, 54, 1, '#3a4046'); for (let i = 0; i < 9; i++) R(-2 + i * 6, -11, 3, 5, '#2c3238');
        R(-3, 58, 54, 6, '#22262a'); R(-3, 63, 54, 1, '#141618');
      },
      diaojiao(g, e, t, R) {   // 吊脚楼（2×1）
        R(2, 6, 2, 10, '#2a1a10'); R(28, 6, 2, 10, '#2a1a10'); R(15, 6, 2, 10, '#2a1a10');
        box(R, 0, -14, 32, 21, '#4a3424'); for (let x = 2; x < 31; x += 4) R(x, -13, 1, 19, '#3a2618');
        R(-4, -24, 40, 4, '#1c1e22'); R(-2, -20, 36, 6, '#262a30'); R(-4, -20, 4, 2, '#1c1e22'); R(32, -20, 4, 2, '#1c1e22');
        R(10, -9, 8, 7, e.lit ? '#e8b060' : '#120c08'); R(13, -9, 1, 7, '#3a2618'); R(10, -6, 8, 1, '#3a2618');
        R(-2, 4, 36, 2, '#3a2416');
      },
      zhaofan(g, e, t, R) {   // 坟头插的招魂幡
        R(2, 8, 12, 7, '#3a3226'); R(4, 6, 8, 3, '#4a4030');
        R(7, -18, 1, 26, '#6a5a3a'); const s = Math.sin(t * 2.2) * 1.5;
        R(8, -17, 4, 3, '#d8d2c0'); R(8 + s, -14, 3, 10, '#d8d2c0'); R(9 + s, -4, 2, 4, '#c8c2b0');
      }
    },
    maps: {
      /* ---------------- 沅水边的山路 ---------------- */
      shanlu: {
        amb: 'wind', dark: .82, plr: 3, wall: 'stone', floor: 'dirt', fog: .25,
        wallC: { face: '#4a4842', top: '#121412' },
        tileOpts: { grassC: '#24342a' },
        rows: [
          '##############################',
          '##############################',
          '####dd######dd#######dd#######',
          'dddddddddddddddddddddddddddddd',
          'dddddddddddddddddddddddddddddd',
          '""""""""""""""""""""""""""""""',
          'eee"""ee""""eeee"""ee"""""eeee',
          '~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~',
          '~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~'],
        ents: [
          { x: 0, y: 3, spr: 'invisible', solid: true, on: S => S.narr('来时的路，黑得像一口井。\n夜里不走回头路——这是跑山的人都知道的。') },
          { x: 0, y: 4, spr: 'invisible', solid: true, on: S => S.narr('来时的路，黑得像一口井。') },
          { x: 29, y: 3, spr: 'invisible', touch: exit('kedian', 12, 12, 3) },
          { x: 29, y: 4, spr: 'invisible', touch: exit('kedian', 12, 12, 3) },
          ...NOOKS.map(x => ({ x, y: 1, spr: 'invisible', solid: true, on: S => S.narr(S.f.ph === 'road' ? '山壁上凿出来的一个石窝，刚好容一个人侧身站进去。\n石头被熏得黑黑的，不知多少过路人在这里躲过什么。' : '石头冰凉，渗着水。\n额头贴上去，能听见山肚子里滴答滴答的水声。') })),
          { id: 'lugui', x: 9, y: 5, spr: 'sign', col: '#5a4a32', on: S => S.note('lugui') },
          { x: 17, y: 5, spr: 'stonelantern', off: true, on: S => S.narr('路边一座小小的土地龛，龛里的土地公缺了半边脸。\n香炉里插着三根烧过的香，香头还是红的。\n——刚才有人从这里过去了。') },
          { x: 26, y: 5, spr: 'zhaofan', on: S => S.narr('一座没有碑的小坟，坟头插着一根招魂幡。\n白纸条让雨打得耷拉着，风一吹，又一下一下地往路这边飘。') },
          { x: 2, y: 5, spr: 'crow', on: S => S.narr('一只老鸹蹲在草里，脑袋缩在翅膀底下。\n你走近了，它也不飞。') },
          { x: 7, y: 6, spr: 'invisible', solid: true, on: S => S.narr('芦苇底下就是沅水。水声闷闷的，像有人在水底下翻身。') },
          { x: 19, y: 6, spr: 'invisible', solid: true, on: S => S.narr('河面上起了雾。对岸的山，只剩一道比天更黑的影子。') },
          { x: 22, y: 7, w: 2, spr: 'boat', on: S => S.narr('一条乌篷船拴在岸边，船头挂着一盏没点的灯。\n船舱里铺着草席，草席上有一个人形的、湿漉漉的印子。') },
          /* 赶尸队 */
          { id: 'yao_s', x: -1, y: 3, spr: '@yao', dir: 2, hidden: true, solid: false },
          { id: 'teng_s', x: -2, y: 3, spr: '@teng', dir: 2, hidden: true, solid: false },
          { id: 'xs1_s', x: -3, y: 3, spr: '@xs1', dir: 2, hidden: true, solid: false, s: { hop: 1 } },
          { id: 'xs2_s', x: -4, y: 3, spr: '@xs2', dir: 2, hidden: true, solid: false, s: { hop: 1 } },
          { id: 'xs3_s', x: -5, y: 3, spr: '@xs3', dir: 2, hidden: true, solid: false, s: { hop: 1 } }
        ],
        async enter(S, first) {
          if (!first) return;
          S.f.ph = 'road';
          await S.narr('货担两头的箩筐吱呀吱呀地响。\n担头挑着的马灯，只照得见脚下三步路。');
          await S.think(['再走五里就是晏家老店。', '跑了十年山路，什么都见过……就是没赶上过「那个」。']);
          S.goal('沿山路往东走，去晏家老店歇脚');
        },
        step(S, x, y) {
          if (S.f.ph === 'road' && x >= 14) return startGong(S);
          if (S.f.ph === 'gong' && NOOK(x, y)) return passScene(S);
        }
      },
      /* ---------------- 晏家老店 ---------------- */
      kedian: {
        amb: 'fire', dark: .62, plr: 3, wall: 'wood', floor: 'wood', rain: false,
        wallC: { face: '#5a4230', top: '#140f0b' },
        tileOpts: { woodC: '#5e4430' },
        rows: [
          '##########################',
          '##########################',
          '#dddddd#WWWWW#WWWWW#######',
          '#dddddd#WWWWW#WWWWW#######',
          '#dddddd#WWWWW#WWWWW#######',
          '###d#######W#####W########',
          '#wwwwwwwwwwwwwwwwwwwwwwww#',
          '#wwwwwwwwwwwwwwwwwwwwwwww#',
          '#wwwwwwwwwwwwwwwwwwwwwwww#',
          '#wwwwwwwwwwwwwwwwwwwwwwwww',
          '#wwwwwwwwwwwwwwwwwwwwwwww#',
          '#wwwwwwwwwwwwwwwwwwwwwwww#',
          '#wwwwwwwwwwwwwwwwwwwwwwww#',
          '############kk############'],
        ents: [
          { x: 12, y: 13, spr: 'invisible', touch: exit('yizhuang', 9, 10, 3) },
          { x: 13, y: 13, spr: 'invisible', touch: exit('yizhuang', 10, 10, 3) },
          { x: 25, y: 9, spr: 'invisible', touch: exit('houyuan', 1, 5, 2) },
          /* 大门与喜神 */
          { x: 11, y: 12, spr: 'menban', on: S => S.narr('大门的门板朝里敞着，用一块石头抵住。\n门轴上积了厚厚一层灰——这扇门，怕是好些年没关过了。') },
          { x: 14, y: 12, spr: 'menban', on: S => S.narr('另一扇门板。门背后贴着一张褪了色的门神，门神的眼睛被人用朱砂点过。') },
          { id: 'xs1_k', x: 8, y: 12, spr: '@xs1', dir: 0, hidden: true, s: { hop: 1 }, on: S => xsLook(S, 1) },
          { id: 'xs2_k', x: 9, y: 12, spr: '@xs2', dir: 0, hidden: true, s: { hop: 1 }, on: S => xsLook(S, 2) },
          { id: 'xs3_k', x: 10, y: 12, spr: '@xs3', dir: 0, hidden: true, s: { hop: 1 }, on: S => xs3On(S) },
          { id: 'deng', x: 9, y: 11, spr: 'youdeng', light: { r: 2.6, col: 'rgba(255,160,70,.22)', flick: true }, on: S => dengOn(S) },
          { id: 'fu_d', x: 11, y: 11, spr: 'fu', decal: true, hidden: true, on: S => fuRead(S) },
          /* 堂屋 */
          { id: 'huotang', x: 11, y: 8, w: 2, spr: 'huotang', light: { r: 4.6, col: 'rgba(255,140,60,.24)', flick: true }, on: S => S.narr(S.f.ph === 'stalk' || S.f.ph === 'fu' ? '火塘里的火只剩一层红灰。吊锅底下「滋」的一声，是屋顶漏下来的雨。' : '火塘里烧着几块青杠柴，吊锅里咕嘟咕嘟煮着腊肉和萝卜。\n火光一跳一跳的，把屋里的影子都拉得老长。') },
          { x: 4, y: 9, spr: 'table', col: '#5a3e28' },
          { x: 4, y: 9, spr: 'cup', full: true, on: S => S.narr(S.f.ph === 'inn' ? '盐客的酒碗，碗里的苞谷烧还剩一个底。' : '酒碗翻倒了。酒顺着桌缝滴到地上，嗒、嗒、嗒。') },
          { id: 'salt', x: 3, y: 9, spr: '@salt', dir: 2, on: S => saltOn(S) },
          { x: 15, y: 9, w: 2, spr: 'table2', col: '#5a3e28' },
          { id: 'book', x: 16, y: 9, spr: 'book', col: '#2a3a5a', async on(S) { if (S.once('book')) await S.narr('滕师傅搁在桌上的一本蓝布面小账簿。\n翻开的那一页，压着一根铜烟杆。'); await S.note('zhangbu'); S.f.readBook = true; } },
          { x: 20, y: 7, spr: 'counter', col: '#6a4a30', on: S => S.narr('柜台上搁着一只算盘、一摞粗瓷碗，还有一块写着「喜神免问」的小木牌。') },
          { x: 21, y: 7, spr: 'counter', col: '#6a4a30' },
          { x: 22, y: 7, spr: 'counter', col: '#6a4a30', on: S => S.narr('柜台底下塞着几坛苞谷烧，封口的红纸上写着「庚午年」。') },
          { id: 'yan', x: 21, y: 6, spr: '@yan', dir: 0, on: S => yanOn(S) },
          { x: 22, y: 5, spr: 'shelf', on: S => S.narr('架子上一排陶罐：盐、糖、茶油、辣子……\n最边上一只小罐子贴着红纸，写着「香」。') },
          { x: 24, y: 6, spr: 'barrel', on: S => S.narr('一桶桐油。客店里点的灯，用的都是它。') },
          { x: 5, y: 5, spr: 'scroll', on: S => S.narr('墙上贴着一张红纸，墨字写得端端正正：\n「本店专接喜神　大门四季不闭」') },
          { x: 23, y: 5, spr: 'window', on: S => S.narr(S.f.ph === 'inn' ? '窗外是镇子的石板街。雨点子打在窗纸上，噼噼啪啪。' : '窗纸上有一个指头大的洞。\n洞外面，黑漆漆的，好像有一只眼睛刚刚挪开。') },
          { x: 1, y: 7, spr: 'lantern', off: true, on: S => S.narr('一盏没点的灯笼，上头写着「晏」字。') },
          /* 灶房 */
          { x: 2, y: 2, spr: 'zao', light: { r: 2, col: 'rgba(255,140,60,.16)', flick: true }, on: S => S.narr('灶膛里埋着火种。锅里温着一锅米汤，给赶夜路的人准备的。') },
          { x: 5, y: 2, spr: 'vat', on: S => S.narr('水缸里的水是井里挑来的，冰得扎手。\n水面上浮着一只瓢，慢慢地打着转。') },
          { x: 6, y: 4, spr: 'basket', on: S => S.narr('一筐糯米。老板娘说，糯米是辟邪的——喜神怕它。\n「怕不怕的，不晓得。反正撒了，心里踏实。」') },
          { x: 1, y: 4, spr: 'sack', on: S => S.narr('一袋石灰。拿来铺在喜神脚下吸潮气的。') },
          /* 滕师傅房 */
          { id: 'tengbed', x: 12, y: 2, h: 2, spr: 'tengbed', on: S => tengBedOn(S) },
          { id: 'baofu', x: 8, y: 2, spr: 'baofu', on: S => baofuOn(S) },
          { x: 8, y: 4, spr: 'candle', light: { r: 2.4, col: 'rgba(255,170,80,.2)', flick: true }, on: S => S.narr('一截白蜡烛，烧得歪歪斜斜。蜡油淌了一桌子。') },
          { x: 9, y: 1, spr: 'window', on: S => S.narr('窗外是后山。雨声里夹着沅水的声音，一阵大，一阵小。') },
          { x: 10, y: 4, spr: 'shoes', col: '#9a8656', on: S => S.narr('一双草鞋，鞋底磨穿了，用麻绳扎了又扎。\n赶尸的人，一年要走烂几十双草鞋。') },
          /* 自己的客房 */
          { id: 'mybed', x: 18, y: 2, h: 2, spr: 'bed', col: '#4a5a3a', on: S => bedOn(S) },
          { x: 14, y: 2, spr: 'huodanS', on: S => S.narr('你的货担。箩筐里的雪花膏、洋火、绣花样子，一样不少。\n——这些东西，明天还要挑到麻阳去卖。') },
          { x: 16, y: 1, spr: 'window', on: S => S.narr(S.f.ph === 'inn' ? '窗外黑沉沉的。远处的山上，有一点鬼火似的光，一闪就没了。' : '窗外，雨小了些。') },
          /* 人 */
          { id: 'teng_k', x: 11, y: 11, spr: '@teng', dir: 3, hidden: true, on: S => S.say('滕师傅', cycle(S, '_tk', ['后生，早些歇着。', '……莫怕。喜神比活人老实。']))}
        ],
        async enter(S, first) {
          light(S);
          if (S.f.ph === 'follow') return arriveInn(S);
          if (S.f.ph === 'fu' && S.once('backFu')) await S.think('她还面朝墙站着。……那炷香，烧到哪儿了？');
        }
      },
      /* ---------------- 后院与柴房 ---------------- */
      houyuan: {
        amb: 'rain', dark: .8, plr: 3, wall: 'wood', floor: 'dirt', rain: true,
        wallC: { face: '#4e3a2a', top: '#120e0a' },
        tileOpts: { fenceBase: 'dirt', woodC: '#4a3826' },
        rows: [
          '##################',
          '##################',
          '#dddddddddd#WWWWW#',
          '#dddddddddd#WWWWW#',
          '#dddddddddd#WWWWW#',
          'ddddddddddd##W####',
          '#dddddddddddddddd#',
          '#dddddddddddddddd#',
          '#dddddddddddddddd#',
          'ffffffffffffffffff'],
        ents: [
          { x: 0, y: 5, spr: 'invisible', touch: exit('kedian', 24, 9, 1) },
          { id: 'yangang', x: 2, y: 2, spr: 'yangang', on: S => yangangOn(S) },
          { id: 'well', x: 6, y: 7, spr: 'well', on: S => wellOn(S) },
          { x: 8, y: 2, spr: 'coop', on: S => S.narr(S.f.ph === 'fu' ? '大公鸡缩在笼子角上，一动不动。\n鸡一叫，天就亮了。……它怎么还不叫？' : '鸡笼里关着一只大红公鸡，冠子红得发紫。\n老板娘说，赶尸的客人最看重它——鸡一叫，喜神就得歇了。') },
          { x: 10, y: 2, spr: 'barrel', on: S => S.narr('一桶泡着的糯米，泡得发白。') },
          { x: 4, y: 1, spr: 'invisible', solid: true, on: S => S.narr('屋檐的瓦缝里，雨水一串一串地往下滴。\n这水还没落地，就叫缸接住了。') },
          { x: 5, y: 4, spr: 'puddle', decal: true },
          { x: 9, y: 6, spr: 'puddle', decal: true },
          { x: 12, y: 7, spr: 'puddle', decal: true },
          { x: 14, y: 8, spr: 'invisible', solid: true, on: S => S.narr('篱笆外头是一片菜地，再往外，是黑压压的后山。\n山上有一条小路，通到沅水边的码头。') },
          { x: 14, y: 5, spr: 'lantern', light: { r: 2.4, col: 'rgba(255,160,80,.2)', flick: true }, on: S => S.narr('柴房门口挂着一盏灯笼，被雨打湿了半边，光是黄里透红的。') },
          /* 柴房 */
          { x: 12, y: 2, spr: 'woodpile', on: S => S.narr('码得整整齐齐的柴火。最上面一层，劈口还是新的。') },
          { x: 13, y: 2, spr: 'woodpile' },
          { x: 16, y: 3, h: 2, spr: 'futon', col: '#8a7a4a', on: S => S.narr('稻草上铺着一床旧被子，是幺儿睡觉的地方。\n枕头底下压着一只竹蜻蜓。') },
          { id: 'yao_h', x: 15, y: 3, spr: '@yao', dir: 0, on: S => yaoOn(S) }
        ],
        async enter(S, first) {
          light(S);
          const y = S.ent('yao_h');
          if (S.f.ph === 'fu' || S.f.ph === 'stalk') { S.place('yao_h', 16, 2, 0); if (S.once('yaoHide')) { S.bubble('yao_h', '…', 1500); await S.narr('柴房最里头，草堆窸窸窣窣地动了一下。'); } }
          else if (y) S.place('yao_h', 15, 3, 0);
          if (first && S.f.ph === 'inn') await S.narr('后院里下着小雨。屋檐底下一溜滴水声，滴滴答答，像有人在数数。');
        }
      },
      /* ---------------- 镇上的祠堂与义庄 ---------------- */
      yizhuang: {
        amb: 'drone', dark: .84, plr: 3, wall: 'stone', floor: 'stone',
        wallC: { face: '#4a4842', top: '#121210' },
        tileOpts: { grassC: '#22302a', treeC: '#16241c' },
        rows: [
          '########################',
          '########################',
          '#kkkkkkkk#ddddddddddddd#',
          '#kkkkkkkk#ddddddddddddd#',
          '#kkkkkkkk#ddddddddddddd#',
          '#kkkkkkkk#ddddddddddddd#',
          '####kk##########dd######',
          '#""kkkk"""""""""dd"""""#',
          '#kkkkkkkkkkkkkkkkkkkkkk#',
          '#"T""""""kk""""""""""T"#',
          '#""""""""kk""""""""""""#',
          '#########kk#############'],
        ents: [
          { x: 9, y: 11, spr: 'invisible', touch: exit('kedian', 12, 12, 3) },
          { x: 10, y: 11, spr: 'invisible', touch: exit('kedian', 13, 12, 3) },
          /* 祠堂 */
          { id: 'xiangan', x: 3, y: 2, w: 2, spr: 'altar', on: S => xianganOn(S) },
          { x: 3, y: 1, spr: 'paiwei', on: S => S.narr('一排一排的祖宗牌位，黑底金字。\n最上面那块，字已经看不清了。') },
          { x: 4, y: 1, spr: 'paiwei' },
          { x: 2, y: 2, spr: 'candles', light: { r: 2.4, col: 'rgba(255,170,80,.2)', flick: true }, on: S => S.narr('长明烛。烛泪在烛台底下积成一座小山。') },
          { x: 5, y: 2, spr: 'incense', on: S => S.narr('香炉里插着三炷香，烟直直地往上走，走到梁底下，散了。') },
          { x: 3, y: 4, spr: 'cushion', col: '#6a3a2a', on: S => S.narr('一只磨得发亮的蒲团。不知多少人在这里磕过头。') },
          { x: 7, y: 1, spr: 'scroll', on: S => S.narr('墙上挂着一幅中堂，写着四个大字：「慎终追远」。') },
          { x: 2, y: 6, spr: 'bian', col: '#5a1a14', on: S => S.narr('祠堂门楣上的匾：「向氏宗祠」。\n匾底下挂着一串红布条，是族里新添了丁挂上去的。') },
          /* 义庄 */
          { id: 'g1', x: 11, y: 2, h: 2, spr: 'guan', on: S => guanOn(S, 0) },
          { id: 'g2', x: 13, y: 2, h: 2, spr: 'guan', on: S => guanOn(S, 1) },
          { id: 'g3', x: 19, y: 2, h: 2, spr: 'guan', on: S => guanOn(S, 2) },
          { id: 'g4', x: 21, y: 2, h: 2, spr: 'guan', on: S => guanOn(S, 3) },
          { x: 16, y: 2, spr: 'youdeng', light: { r: 2.6, col: 'rgba(255,150,70,.2)', flick: true }, on: S => S.narr('义庄里的长明灯。灯油快见底了，火苗缩成一粒豆。') },
          { x: 12, y: 5, spr: 'chair', col: '#4a3020' },
          { id: 'tian', x: 12, y: 5, oy: -3, spr: '@tian', dir: 0, on: S => tianOn(S) },
          { x: 13, y: 5, spr: 'table', col: '#4a3020' },
          { id: 'paper', x: 13, y: 5, spr: 'newspaper', on: S => S.note('baozhi') },
          { x: 21, y: 5, spr: 'sack', on: S => S.narr('一袋石灰，一袋锯末。还有一卷草席。') },
          { x: 18, y: 6, spr: 'bian', col: '#2a2a2a', on: S => S.narr('门楣上一块黑匾：「义庄」。\n客死在外、没人来领的人，都先停在这里。') },
          /* 院子 */
          { x: 7, y: 9, spr: 'stonelantern', light: { r: 2, col: 'rgba(255,190,110,.14)' }, on: S => S.narr('院子里的石灯。灯龛里塞着一团湿透的纸钱。') },
          { x: 19, y: 9, spr: 'crow', on: S => S.narr('一只老鸹落在院墙根下，正啄着什么。\n见你过来，它不慌不忙地，叼着那东西跳开了。') },
          { x: 15, y: 10, spr: 'invisible', solid: false, on: S => S.narr('青石板缝里长着的车前草，被雨打得趴在地上。') }
        ],
        async enter(S, first) {
          if (first) {
            await S.narr('沿着石板街一直走到头，就是镇上的祠堂。\n祠堂隔壁，一间矮房子的门开着，门里亮着一盏灯。');
            S.goal('去义庄找守祠的田老伯，讨一点朱砂');
          }
        },
        step(S, x, y) {
          if (S.f.ph === 'fu' && x >= 10 && y <= 5 && S.once('voice')) return voiceScene(S);
        }
      },
      /* ---------------- 麻阳·寨口 ---------------- */
      zhaikou: {
        amb: 'night', dark: .8, plr: 3, floor: 'dirt', fog: .2,
        tileOpts: { grassC: '#22342a' },
        rows: [
          'PPPPPPPPPPPPP~~~PPPPPPPPPPPPPP',
          'P"""""""""""e~~~e"""""""""""PP',
          'P""""""""""""~~~""""""""""""PP',
          'P"""""""""""e~~~e""""""""kkkkP',
          'dddddddddddddWWWddddddddddkkkk',
          'dddddddddddddWWWddddddddddkkkk',
          'P"""""""""""e~~~e""""""""kkkkP',
          'P""""""""""""~~~""""""""""""PP',
          'P"""""""""""e~~~e"""""""""""PP',
          'PPPPPPPPPPPPP~~~PPPPPPPPPPPPPP'],
        ents: [
          { x: 0, y: 4, spr: 'invisible', solid: true, on: S => S.narr('来时的山路。晏家老店，在三十里外的雾里。') },
          { x: 0, y: 5, spr: 'invisible', solid: true, on: S => S.narr('来时的山路。') },
          { x: 13, y: 3, w: 3, spr: 'qiao', z: 1, solid: false },
          { x: 14, y: 4, spr: 'invisible', solid: false, on: S => S.narr('风雨桥的桥板被人踩得发亮。\n桥下的溪水很急，哗哗地，一路流到沅水里去。') },
          { x: 24, y: 3, spr: 'zhaimen', z: 1, solid: false },
          { x: 24, y: 3, spr: 'invisible', solid: true, on: S => S.narr('寨门的柱子上贴着一副旧对联，只剩下联：「出门平安归」。') },
          { x: 24, y: 6, spr: 'invisible', solid: true, on: S => S.narr('寨门柱子底下，摆着一只碗，碗里是供着的糯米饭。') },
          { x: 26, y: 2, w: 2, spr: 'diaojiao', lit: true, light: { r: 2.4, dx: 14, dy: -4, col: 'rgba(255,170,90,.16)' }, on: S => S.narr('吊脚楼的窗里点着灯。窗纸上有个影子，一直站着，一直站着。') },
          { x: 26, y: 7, w: 2, spr: 'diaojiao', on: S => S.narr('黑着灯的吊脚楼。屋檐下挂着一串干辣椒，和一双没穿过的绣花鞋。') },
          { x: 8, y: 3, spr: 'stonelantern', off: true, on: S => S.narr('路边的土地庙。有人在庙前摆了一碗清水、三个糍粑。') },
          { x: 10, y: 6, spr: 'sign', col: '#4a3a2a', on: S => S.narr('指路碑：「左走麻阳，右走凤凰」。\n碑底下压着一块红布，红布上写着：「弓开弦断，箭射妖魔；童子莫哭，夜里莫怕」。') },
          { id: 'dog', x: 21, y: 7, spr: 'dog', dir: 1, on: S => S.narr('一条拴在桩子上的黄狗，趴着，耳朵贴着脑袋。\n它不叫，只是一直盯着你身后。') },
          { id: 'mom', x: 26, y: 4, spr: '@mom', dir: 1, hidden: true, light: { r: 3, col: 'rgba(255,180,90,.2)', flick: true }, on: S => S.say('妇人', '……') },
          { id: 'teng_z', x: 1, y: 4, spr: '@teng', dir: 2, on: S => S.say('滕师傅', cycle(S, '_tz', ['你在前头敲锣。我……跟得上。', '过了桥，就是麻阳寨子了。'])) },
          { id: 'xs3_z', x: 2, y: 5, spr: '@xs3', dir: 2, s: { hop: 1 }, on: S => raiseOn(S) }
        ],
        async enter(S, first) {
          if (!first) return;
          S.f.ph = 'home';
          await S.narr('第二天夜里，雨停了。\n滕师傅把另外两位喜神托付给晏家老店，只领着秀姑，往麻阳走。');
          S.face('teng_z', 'pl');
          await S.say('滕师傅', ['我这身子，摇铃都摇不稳了。', '后生，锣和铃你拿着。叫她起身，再叫她跟上——口诀你都晓得。']);
          await S.narr('（提示：口诀在「档案」里能重看。）');
          S.goal('用锣和铃叫秀姑起身、随行');
        },
        step(S, x, y) {
          if (S.f.ph === 'walk' && x === 14 && S.once('bridge')) return S.narr('走到风雨桥正当中，身后的跳步声忽然停了一下。\n桥下的水声，好像有人在喊什么。\n……又跟上来了。');
          if (S.f.ph === 'walk' && x >= 19 && S.once('dogw')) { S.ent('dog').s.bark = false; S.sfx('cry'); return S.narr('拴在桩子上的黄狗呜咽了一声，夹着尾巴钻进了窝里。'); }
          if (S.f.ph === 'walk' && x >= 22) return finale(S);
        }
      }
    }
  });

  /* ================= 出口与光照 ================= */
  function blockMsg(S, to) {
    const ph = S.f.ph;
    if (S.map === 'shanlu' && ph === 'gong') return '锣声就在身后！先让路——躲进山壁上的石窝里！';
    if (to === 'yizhuang') {
      if (ph === 'inn') return '夜里出门？……滕师傅说了，鸡叫之前，莫出店门。';
      if (ph === 'stalk') return '（不行……她就在堂屋里转。得先把她镇住——铃和锣在滕师傅房里。）';
    }
    return null;
  }
  function exit(to, x, y, dir) {
    return async S => {
      const m = blockMsg(S, to);
      if (m) { S.sfx('locked'); await S.narr(m); const p = S.pl; if (p.prev && (p.prev[0] !== p.x || p.prev[1] !== p.y)) S.pos(p.prev[0], p.prev[1]); return; }
      await S.go(to, x, y, dir);
    };
  }
  function light(S) {
    const t = { kedian: { inn: .62, stalk: .88, fu: .82, dawn: .66 }, houyuan: { inn: .8, stalk: .88, fu: .86 } }[S.map];
    S.dark(t && t[S.f.ph] != null ? t[S.f.ph] : null);
  }
  function snap(e) { if (e && e.mv) { e.px = e.mv.tx * TS; e.py = e.mv.ty * TS; e.x = e.mv.tx; e.y = e.mv.ty; e.mv = null; } }
  const sound = async (S, v) => { for (const ch of (v || '')) { S.sfx(ch === '铃' ? 'bell' : 'thud'); await S.wait(380); } };

  /* ================= 第一幕：山路让道 ================= */
  const TEAM = ['yao_s', 'teng_s', 'xs1_s', 'xs2_s', 'xs3_s'];
  async function startGong(S) {
    S.f.ph = 'gong'; S.f._gt = 0; S.f._gc = 0;
    TEAM.forEach(id => S.show(id));
    S.amb('none');
    await S.wait(400); S.sfx('thud'); await S.wait(900); S.sfx('bell'); await S.wait(500); S.sfx('thud');
    await S.narr('身后……很远很远的地方，「哐」地一声。\n是锣。');
    S.sfx('bell');
    await S.narr('锣声后头，跟着一串细细的铃铛。叮——铃——叮——铃——\n一下一下，不紧不慢，正朝这边来。');
    await S.think(['夜半闻锣……', '是喜神过路！']);
    S.goal('按规矩让路：躲进山壁上的石窝，面朝山壁');
    S.cp('gong');
    if (NOOK(S.pl.x, S.pl.y)) await passScene(S);
  }
  function gongTick(S, dt) {
    if (S.f.ph !== 'gong' || W.busy) return;
    S.f._gt -= dt;
    if (S.f._gt <= 0) { S.f._gc = (S.f._gc + 1) % 3; S.sfx(S.f._gc === 0 ? 'thud' : 'bell'); S.f._gt = .62; }
    const p = S.pl;
    for (const id of TEAM) { const e = S.ent(id); if (!e.mv && Math.round(e.px / TS) < 28) startMove(e, 2, 1.7); }
    let hit = p.y >= 3 && TEAM.some(id => { const e = S.ent(id); return Math.abs(Math.round(e.px / TS) - p.x) + Math.abs(Math.round(e.py / TS) - p.y) <= 1; });
    if (Math.round(S.ent('yao_s').px / TS) >= 27) hit = true;
    if (hit) { S.f.ph = 'gongX'; S.after(0, blockedDie); }
  }
  async function blockedDie(S) {
    if (S.f.ph !== 'gongX') return;
    S.sfx('sting');
    await S.narr('锣声停了。铃声也停了。\n你就站在路当中，马灯明晃晃地照着。');
    await S.scare('face', { spr: '@xs3up', dur: 1 });
    await S.die('斗笠底下那张脸，离你只有一寸。\n一股冰凉的、河底淤泥的气味，扑在你脸上。\n——挡了喜神的道，是要替它走完这一程的。', '你挡了喜神的道');
  }
  async function passScene(S) {
    S.f.ph = 'pass'; const p = S.pl;
    S.turn(3);
    TEAM.forEach(id => snap(S.ent(id)));
    await S.narr('你一头钻进石窝，脸贴着冰凉的山壁。\n马灯往怀里一揣，火苗缩成了一粒豆。');
    S.plr(1.5);
    const want = { yao_s: p.x + 4, teng_s: p.x, xs1_s: p.x - 1, xs2_s: p.x - 2, xs3_s: p.x - 3 };
    S.sfx('thud');
    await Promise.all(TEAM.map(id => { const e = S.ent(id); const n = Math.max(0, want[id] - Math.round(e.px / TS)); return S.walk(id, 'r'.repeat(n), 2.6); }));
    S.sfx('bell');
    await S.narr('铃声，就在你背后停住了。');
    await S.narr('有人在你身后站着。不止一个。\n一股说不出的气味——香灰、桐油，还有河水底下的那种腥。');
    S.sfx('heart'); await S.wait(500); S.sfx('heart');
    const r = await S.ask('后脑勺凉飕飕的，像有人对着它吹气。', ['回头看一眼', '（脸贴着山壁，一动不动）']);
    if (r === 0) {
      S.f.looked = true; S.turn(0);
      await S.scare('face', { spr: '@xs3', dur: .8 });
      await S.narr('三个戴斗笠的人，一个挨一个，直挺挺地站在路当中，额头上都贴着一张黄纸。\n最后那一个……斗笠底下垂着长长的头发。黄纸被风掀起一角，底下的眼睛，是睁着的。');
      await S.say('？？？', '莫看！转过去！', { style: 'big' });
      S.turn(3);
      await S.narr('你猛地把脸转回山壁，心口咚咚地撞。');
    } else {
      await S.narr('你闭上眼睛，数自己的心跳。\n一、二、三……数到十七，身后有人「嗯」了一声。');
    }
    S.face('teng_s', 'pl');
    await S.say('？？？', '……后生，懂规矩。可以转过来了。');
    S.turn(0); S.plr(null); S.amb('wind');
    await S.narr('说话的是个干瘦的老人，包着黑头帕，手里一只铜铃。\n前头站着个半大孩子，提着一面铜锣。');
    await S.say('赶尸匠', ['莫怕。我姓滕，辰州来的，送几位喜神回乡。', '前头那个是我徒弟，叫幺儿。']);
    S.face('yao_s', 'pl');
    await S.say('幺儿', r === 0 ? '叫你莫回头的嘛！木牌上写着的。回了头，它就记得你了。' : '大哥，你躲得好快！好多人听见锣声腿就软了，站在路当中动不得。');
    if (r === 0) await S.say('滕师傅', '幺儿，少说两句。……后生，莫往心里去。');
    await S.say('滕师傅', ['看你挑着担子，也是往晏家老店去的？', '前头还有三里路。天要落雨了——喜神淋不得雨，符一湿就不灵。一起走吧。']);
    await S.narr('他说着，弯下腰咳了一阵。咳完了，抬手抹了一把脸——手背上全是汗。');
    S.sfx('thud'); await S.wait(300); S.sfx('bell');
    await Promise.all(TEAM.map(id => S.walk(id, 'rrrrr', 2.4)));
    await Promise.all(TEAM.map(id => S.alpha(id, 0, 700)));
    S.f.ph = 'follow';
    S.goal('跟着赶尸队，往东去晏家老店');
    S.cp();
  }

  /* ================= 第二幕：晏家老店 ================= */
  async function arriveInn(S) {
    S.f.ph = 'inn';
    ['xs1_k', 'xs2_k', 'xs3_k', 'teng_k'].forEach(id => S.show(id));
    S.plr(null);
    await S.narr('晏家老店的两扇大门敞着，门里的火塘烧得正旺。\n门板后头的墙根下，三位喜神已经靠墙立好了，斗笠压得低低的。');
    S.face('yan', 'pl');
    await S.say('老板娘', ['哟，滕师傅前脚进门，后脚又来一个。', '石货郎！你这是跟喜神一路来的？胆子见长啊。']);
    await S.say('石满仓', '路上碰见的。晏嫂，还有空铺没有？');
    await S.say('老板娘', '东头那间给你。滕师傅住西头。夜里起来，莫走错了门。');
    S.face('teng_k', 'pl');
    await S.narr('滕师傅把一盏桐油灯点上，搁在喜神脚跟前，又挨个按了按它们额头上的符。');
    await S.say('滕师傅', ['后生，你记着。', '这店里的大门一年到头不关，是给喜神留的。今夜也莫去关它。', '这盏灯，一夜都莫吹。', '夜里不管听见什么——有人喊你的名字，莫应。']);
    await S.narr('他说完，身子晃了一晃，扶住了门板。');
    await S.say('老板娘', '滕师傅！你这脸烧得跟炭似的——快去躺着！');
    await S.say('滕师傅', '……幺儿在后院柴房里。不碍事，睡一觉就好。');
    await S.walk('teng_k', [11, 5], 2.2); await S.walk('teng_k', [11, 4], 2.2);
    S.hide('teng_k'); S.ent('tengbed').s.sick = true;
    await S.narr('西头的屋里，传来一阵压低了的咳嗽。\n火塘里的柴「啪」地爆了一下。');
    S.goal('在店里歇歇脚，然后回东头的客房睡觉');
    S.cp();
  }
  async function xsLook(S, i) {
    const ph = S.f.ph;
    if (ph !== 'inn') return S.narr(i === 3 ? '她面朝墙站着。' : '它还靠墙立着，一动不动。额头上的符贴得牢牢的，被门缝里的风吹得簌簌地抖。');
    const T = [
      '第一位喜神。个子高大，斗笠压到鼻梁。符底下露出一截下巴，青灰青灰的。\n脖子上缠着一圈白布，缠得严严实实。',
      '第二位矮一些。脖子歪向一边，怎么也正不过来。\n袍子底下，两只脚尖并得齐齐的，像是从来没沾过地。',
      '第三位个子最小，斗笠底下垂着长长的头发。\n她的袍子下摆是湿的。一路走来，别人身上都干了——只有她，像刚从水里出来。'];
    if (i === 3) S.f.sawWet = true;
    await S.narr(T[i - 1]);
    if (S.once('xsLook')) await S.think('……莫看太久。莫看它们的脸。');
  }
  async function saltOn(S) {
    S.face('salt', 'pl');
    if (S.f.ph !== 'inn') return S.narr('盐客趴在桌上睡死了，酒气冲天，怎么推也推不醒。\n他的手里，还紧紧攥着一把糯米。');
    if (S.once('saltInn')) {
      await S.say('盐客', ['货郎，坐。喝一碗？', '我挑盐走这条路，走了三十年。赶尸的，碰见过不下二十回。']);
      await S.say('盐客', ['你晓得那些喜神为什么都戴斗笠、罩长袍？', '有人说啊，那根本不是死人自己在走——是赶尸的把死人背在背上，袍子一罩，斗笠一扣，远远看着，就是一个人在跳。', '还有人说，是两个人拿竹竿把死人架起来，一前一后抬着，竹竿一颤一颤的，看着就像在蹦。']);
      await S.say('盐客', ['也有人说，一路运回去的不过是一副骨头。那些锣啊、铃啊，不许看、不许问的规矩，都是吓唬人的，好叫人躲远些，莫来看穿。', '……我是不信那些的。']);
      await S.say('盐客', '可我也从来不回头。');
      return;
    }
    return S.say('盐客', cycle(S, '_si', ['湘西这地方，山高水险，抬口棺材走不了几里。雇人抬，一里路一块大洋，哪个抬得起？', '客死在外头的人，总要回家的嘛。', '晏家这店，大门几十年没关过。连贼都不敢进来偷。']));
  }
  async function yanOn(S) {
    S.face('yan', 'pl');
    if (S.once('yanInn')) {
      await S.say('老板娘', ['饿了吧？锅里有腊肉萝卜，自己舀。', '我这店，专接赶尸的客。大门一年到头不关——关了，喜神进不来，只好在门外头站一夜。门外有露水，符要湿的。']);
      await S.say('老板娘', ['喜神进了店，就站在门板后头，靠墙。白天不见光，不挪窝；天一黑，跟着铃走。', '你夜里起夜，莫往门板后头看。……也莫回头。']);
      return;
    }
    return S.say('老板娘', cycle(S, '_yn', ['东头那间是你的。被子刚晒过——晒了三天，三天都下雨。', '滕师傅是老主顾了。每年秋天来一回，今年来得最晚。', '镇上祠堂有个田老伯，守义庄的。滕师傅画符的朱砂，都是在他那里配的。']));
  }
  async function dengOn(S) {
    const ph = S.f.ph;
    if (ph === 'stalk' || ph === 'fu') {
      const r = await S.ask('喜神脚跟前的长明灯，火苗一跳一跳的。\n……灯一灭，屋里就全黑了。黑了，她是不是就找不着我了？', ['吹灭它', '（滕师傅说过，一夜都莫吹）']);
      if (r === 0) return blowLamp(S);
      return S.narr('你把伸出去的手，缩了回来。');
    }
    return S.narr('一盏桐油灯，搁在喜神脚跟前。灯芯剪得短短的，火苗只有黄豆大。\n滕师傅说，这盏灯，一夜都莫吹。');
  }
  async function blowLamp(S) {
    S.clearTimer();
    S.ent('deng').off = true; S.sfx('whisper');
    S.dark(.97); S.plr(.6);
    await S.narr('「噗。」');
    await S.wait(800);
    await S.narr('黑透了。\n门板后头，「咚」，又一声。\n……「咚」。');
    await S.narr('不是一个。是三个。');
    await S.scare('face', { spr: '@xs3up', dur: 1.1 });
    await S.end({ bad: true, title: '灯灭了', text: '第二天早上，晏家老店的大门照旧敞着。\n\n门板后头的墙根下，靠墙立着四个人。\n三个戴着斗笠，额头上贴着黄符。\n第四个包着头帕，肩上还搭着一根扁担。\n\n老板娘拿糯米撒了一地，哭着去后院喊幺儿。\n——幺儿说，师傅的账簿上，多了一行字。' });
  }
  async function bedOn(S) {
    if (S.f.ph !== 'inn') return S.narr(S.f.ph === 'stalk' ? '被窝还是热的。可你不敢再躺回去了。' : '一张硬板床，被子有股桐油味。');
    const r = await S.ask('一张硬板床，被子有股桐油和霉味。\n躺下歇了？', ['躺下睡觉', '再等等']);
    if (r) return;
    await nightFalls(S);
  }
  async function tengBedOn(S) {
    const ph = S.f.ph;
    if (!S.ent('tengbed').s.sick) return S.narr('一张空床。被子叠得方方正正。');
    if (ph === 'inn') {
      if (S.once('tengInn')) {
        await S.narr('滕师傅缩在被子里，额头上搭着一块湿布。');
        await S.say('滕师傅', ['……后生？', '这一趟走了十九天。辰州到这里，四百多里山路。', '赶尸这行，夜里走，白天歇。锣在前头，叫活人让路；铃在后头，叫喜神跟上。', '「喜神」是好听的叫法。说到底……都是回不了家的人。']);
        return;
      }
      return S.say('滕师傅', cycle(S, '_tb', ['……睡吧。鸡叫了，就没事了。', '咳、咳……莫管我。', '那三位，都是好人家的孩子。']));
    }
    S.bubble('tengbed', '…', 1400);
    return S.say('滕师傅（梦话）', cycle(S, '_tm', ['……秀姑……莫往水边去……水凉……', '爹在这里……爹摇铃，你就跟上……', '名字……我不敢写……']), { style: 'whisper' });
  }
  async function baofuOn(S) {
    const b = S.ent('baofu');
    if (S.f.ph === 'inn') return S.narr('滕师傅的蓝布包袱，鼓鼓囊囊，上头搁着一面铜锣。\n别人的东西，不好乱动。');
    if (S.f.ph === 'stalk' && !S.has('lingluo')) {
      b.open = true; S.sfx('paper');
      S.give('lingluo'); S.give('fuzhi', true); S.give('zhudie', true);
      await S.narr('你哆嗦着解开包袱：一面铜锣，一只铜铃，一沓黄表纸，一支符笔，一只空了的朱砂碟。\n最底下，压着一个小本子。');
      await S.note('koujue');
      S.toast('获得：黄表纸和符笔、空朱砂碟');
      await S.say('滕师傅（梦话）', '……铃……锣……铃……', { style: 'whisper' });
      const x = S.ent('xs3_k'); S.stop('xs3_k'); snap(x); S.place('xs3_k', 20, 10, 1);
      S.sfx('thud');
      await S.narr('堂屋那头，「咚」……「咚」……跳步声往柜台那边去了。');
      await S.narr('（提示：铃和锣到手了。走到她跟前，照口诀摇铃敲锣。）');
      S.goal('用铃和锣叫她住脚、面壁立定（口诀在小本子上）');
      S.cp('stalk');
      return;
    }
    return S.narr('包袱摊开着。除了几件换洗衣裳和一双新草鞋，什么也不剩了。\n新草鞋很小，是女人的尺码。');
  }

  /* ================= 第三幕：三更，符落 ================= */
  async function nightFalls(S) {
    await S.fade(1, 900);
    S.hidePlayer(true);
    await S.card('三更', '', '雨下大了。\n石满仓迷迷糊糊地，听见风从敞着的大门里灌进来，\n呜——呜——\n像有人站在门口，吹一支没有孔的笛子。');
    S.f.ph = 'stalk';
    const x = S.ent('xs3_k'); x.spr = '@xs3n'; S.place('xs3_k', 10, 11, 0);
    S.show('fu_d'); S.hide('yan');
    S.ent('huotang').light = { r: 2.4, col: 'rgba(255,110,50,.16)', flick: true };
    light(S); S.plr(2.4); S.amb('wind'); S.norun(true);
    S.pos(17, 4, 0); S.hidePlayer(false);
    await S.fade(0, 900);
    S.sfx('thud'); await S.wait(900); S.sfx('thud'); await S.wait(900); S.sfx('thud');
    await S.narr('咚。\n……咚。\n……咚。');
    await S.narr('不是雨声。是有什么东西，在堂屋里，一下一下地跳。');
    await S.think(['……喜神？', '喜神不是要听着铃才会动吗？']);
    S.focus(10, 10); await S.wait(700);
    await S.narr('火塘的余光里，门板后头只剩下两个斗笠。\n第三个站在堂屋当中，脑袋一歪一歪的，像在闻什么。\n地上，躺着一张黄纸。');
    S.focus(null);
    await S.think(['符……掉了。', '铃和锣！铃和锣在滕师傅房里！']);
    await S.narr('（提示：她看不见，循着活人的气息走。不能跑；离她远些，站着不动、屏住气，她就闻不着。）');
    S.goal('屏住气，去西头滕师傅房里拿铃和锣');
    S.cp('stalk');
  }
  function resetXs(S) { S.stop('xs3_k'); snap(S.ent('xs3_k')); S.f.ringing = false; S.f._rq = false; S.f._cool = 0; S.f._still = 0; S.norun(true); S.plr(2.4); light(S); }
  function stalkTick(S, dt) {
    if (S.f.ph !== 'stalk' || W.busy || S.f.ringing) return;
    const x = S.ent('xs3_k'); if (!x || x.hidden) return;
    const p = S.pl, ex = Math.round(x.px / TS), ey = Math.round(x.py / TS), d = Math.abs(ex - p.x) + Math.abs(ey - p.y);
    S.f._still = p.mv ? 0 : (S.f._still || 0) + dt;
    if (S.f._cool > 0) { S.f._cool -= dt; return; }
    if (S.has('lingluo') && d <= 2 && !S.f._rq) { S.f._rq = true; S.stop('xs3_k'); S.after(0, ringScene); return; }
    const inZ = HALL(p.x, p.y), smell = S.f._still > 1.2 ? 1 : 3;
    if (x.chase) { if (d > 6 || !inZ || (S.f._still > 1.6 && d > 1)) { S.stop('xs3_k'); S.bubble('xs3_k', '?', 900); } return; }
    if (inZ && d <= smell) { S.sfx('sting'); S.bubble('xs3_k', '!', 900); S.chase('xs3_k', { spd: 2.6, zone: HALL, catch: stalkCaught }); return; }
    S.f._wt = (S.f._wt ?? 1) - dt;
    if (S.f._wt <= 0 && !x.mv) {
      S.f._wt = .8 + Math.random() * .9;
      let dir = (Math.random() * 4) | 0;
      if (Math.random() < .35) dir = Math.abs(p.x - ex) > Math.abs(p.y - ey) ? (p.x < ex ? 1 : 2) : (p.y < ey ? 3 : 0);
      const nx = ex + DIRS[dir][0], ny = ey + DIRS[dir][1];
      if (HALL(nx, ny) && passable(curMap(), nx, ny, x)) { startMove(x, dir, 1.4); S.sfx('thud'); }
    }
  }
  async function stalkCaught(S) {
    await S.scare('face', { spr: '@xs3up', dur: 1.1 });
    await S.die('她找到你了。\n两只冰凉的手搭上你的肩膀，一股河底淤泥的腥气，灌进你的鼻子里。\n你想喊，却像被水堵住了嘴。', '她循着你的气息来了');
  }
  async function ringScene(S) {
    if (S.f.ph !== 'stalk' || S.f.ringing) return;
    S.f.ringing = true; S.stop('xs3_k');
    const x = S.ent('xs3_k'); snap(x);
    S.face('xs3_k', 'pl'); S.face('pl', 'xs3_k');
    S.sfx('heart');
    await S.narr('她就在你跟前。斗笠底下垂着湿漉漉的长头发，一股河水的腥气。\n你攥紧了铃，手心里全是汗。');
    const v = await S.keypad('摇铃、敲锣——叫她住脚，面壁立定', ['铃', '锣'], 4, { cancel: false });
    await sound(S, v);
    if (v === '铃锣铃铃') return stopXs(S);
    if (!S.f.ringMiss) {
      S.f.ringMiss = true;
      S.shake(300, 2);
      await S.narr('她猛地一顿——歪着头，像是在听。\n然后，朝你这边，又跳了一步。');
      await S.think('不对……节奏不对！口诀……小本子上的口诀！');
      S.f.ringing = false; S.f._rq = false; S.f._cool = 2.5;
      return;
    }
    return stalkCaught(S);
  }
  async function stopXs(S) {
    await S.narr('铃——锣——铃——铃——');
    await S.narr('她停住了。\n过了好一会儿，才慢慢地、慢慢地转过身去，一跳，一跳，跳到北墙根底下。');
    await S.walk('xs3_k', [5, 6], 1.6); S.face('xs3_k', 3);
    S.sfx('chime'); S.norun(false); S.plr(null);
    S.f.ph = 'fu'; S.f.ringing = false; light(S);
    await S.narr('她面朝着墙，立定了，一动不动。');
    await S.think(['口诀上说……符落了，铃锣只镇得一炷香。', '得赶在香烧完之前，把符补上。']);
    fuGoal(S);
    S.timer(300, '一炷香', incenseOut);
    S.cp('fu');
  }
  async function incenseOut(S) {
    if (S.f.ph !== 'fu') return;
    await S.narr('不知哪里，那炷香的最后一点红光，灭了。');
    S.sfx('thud'); await S.wait(500);
    await S.scare('face', { spr: '@xs3up', dur: 1 });
    await S.die('身后，「咚」的一声。\n冰凉的、湿漉漉的手指，搭上了你的后颈。\n——她又醒了。', '香烧完了');
  }
  async function fuRead(S) {
    if (S.f.ph === 'stalk' && !S.has('lingluo')) return S.narr('那张掉下来的符，就在她脚边……现在不敢去捡。');
    await S.narr('你捡起那张掉落的符。朱砂画的符文被雨气洇开了，红一道一道往下淌。\n符头上，写着三个小字：\n\n「吴　氏　女」');
    await S.think('吴氏……账簿上写的也是吴氏。\n可口诀说——名不真，符不灵。');
    S.f.fuRead = true; S.hide('fu_d');
  }
  async function xs3On(S) {
    const ph = S.f.ph;
    if (ph === 'inn') return xsLook(S, 3);
    if (ph === 'stalk') { if (S.has('lingluo') && !S.f.ringing && !(S.f._cool > 0)) { S.f._rq = true; return ringScene(S); } return S.narr('（不……不能碰她。）'); }
    if (ph === 'fu') return redraw(S);
    return S.narr('她面朝着墙。额头上的新符黄澄澄的，一笔一画都清清楚楚。');
  }

  /* ================= 补符 ================= */
  function fuGoal(S) {
    const need = [];
    if (!S.has('zhusha')) need.push('朱砂（镇上祠堂）');
    if (!S.has('yudie')) need.push('无根水');
    S.goal(need.length ? '一炷香内补好符：还缺' + need.join('、') : '回堂屋给她补符（符头要写真名姓）');
  }
  async function yangangOn(S) {
    if (S.f.ph !== 'fu') return S.narr('屋檐底下一口大瓦缸，接的是从瓦缝里滴下来的雨水。\n老板娘说，这水不沾地，拿来泡茶，是甜的。');
    if (S.has('yudie')) return S.narr('碟子里已经盛着水了。');
    if (!S.has('zhudie')) return S.narr('得拿个东西来盛。');
    S.take('zhudie'); S.give('yudie'); S.f.water = 'rain'; S.sfx('water');
    await S.narr('你把朱砂碟伸到屋檐底下，接了半碟正往下滴的雨水。\n还没落地的水——无根水。');
    fuGoal(S); S.cp('fu');
  }
  async function wellOn(S) {
    if (S.f.ph !== 'fu') return S.narr('后院的老井。井口盖着半块石板，井绳湿漉漉的。\n往下看，黑洞洞的，只听见底下咕咚、咕咚，像有人在喝水。');
    if (!S.has('zhudie')) return S.narr('井水冰凉。水面上漂着一片什么东西，白白的，像一块布。');
    const r = await S.ask('井里的水，打上来就能用。舀一碟？', ['舀一碟井水', '（等等……）']);
    if (r === 1) { await S.think('口诀说……井水自地底出，有根，拴魂。切莫用井水。'); return; }
    S.take('zhudie'); S.give('yudie'); S.f.water = 'well'; S.sfx('water');
    await S.narr('你放下吊桶，打上来半桶井水，舀了一碟。\n水面上映着你的脸，白得吓人。');
    fuGoal(S);
  }
  async function yaoOn(S) {
    S.face('yao_h', 'pl');
    const ph = S.f.ph;
    if (ph === 'inn') {
      if (S.once('yaoInn')) {
        await S.say('幺儿', ['大哥！你也睡不着？', '我跟师傅学了两年了。师傅说我胆子大，是吃这碗饭的料。']);
        await S.say('幺儿', ['赶喜神，夜里走，白天歇。鸡一叫就得找店住下，喜神白天见不得光。', '路上碰见人，我就敲锣，叫人家让路、拴狗。师傅摇铃，喜神听着铃声走。', '额头上那张是辰州符，朱砂画的。朱砂就是辰砂——我们辰州出的。']);
        await S.say('幺儿', ['你晓得「三赶三不赶」吧？', '砍头的、绞死的、站笼站死的，赶。', '病死的、投河吊颈的、雷打火烧的，不赶。']);
        await S.say('石满仓', '为啥？');
        await S.say('幺儿', ['师傅说，死于非命的，魂还拘在身上，舍不得走，铃一摇就跟着。', '病死的，魂早散了。投河的，魂跟着水走了，追都追不回来。']);
        await S.say('幺儿', '……可这一趟那个「吴氏」，账簿上没写是怎么死的。我问师傅，师傅就骂我。');
        return;
      }
      return S.say('幺儿', cycle(S, '_yi', ['大哥你去睡吧，我还要给鸡添食。', '你说……喜神会不会做梦？', '师傅烧得厉害。明天要是走不动，可怎么办。']));
    }
    if (ph === 'stalk') return S.say('幺儿', '（缩在草堆里，捂着嘴）大哥……她、她醒了……我不敢……', { style: 'whisper' });
    if (ph === 'fu' && !S.f.gotLock) {
      S.f.gotLock = true;
      S.bubble('yao_h', '!', 900);
      await S.say('幺儿', ['大哥……你把她镇住了？', '我……我看见她醒了，我就跑了。我对不起师傅。']);
      await S.say('石满仓', '幺儿，符上写的是「吴氏」，可写「吴氏」，符贴不住。她到底叫什么？');
      await S.say('幺儿', ['……我不晓得。师傅不让问。', '可是……她起身的时候，领口里掉出来这个。我捡了，还没敢给师傅。']);
      S.give('yinsuo');
      await S.narr('一把小小的银锁，红绳都褪成了粉色。\n正面錾着「长命百岁」。翻过来，背面刻着四个小字：\n\n「滕门秀姑」');
      await S.say('幺儿', ['滕……师傅也姓滕。', '师傅夜里说胡话，一直在喊「秀姑」。']);
      fuGoal(S); S.cp('fu');
      return;
    }
    return S.say('幺儿', cycle(S, '_yf', ['大哥，快去吧……香要烧完了。', '我、我在这儿给你守着后门。']));
  }
  async function voiceScene(S) {
    S.amb('none');
    await S.narr('义庄里停着四口棺材。长明灯的火苗，忽然往一边倒了倒。');
    await S.wait(600); S.sfx('whisper');
    await S.say('？？？', '……满仓。', { style: 'whisper' });
    await S.narr('声音是从最里头那口棺材里传出来的。\n很轻，很软，像隔着一层水。');
    S.sfx('whisper');
    await S.say('？？？', '满仓哥……是我呀。你应我一声嘛。', { style: 'whisper' });
    const r = await S.ask('它在喊你的名字。', ['「哎——」（应一声）', '「……谁？」', '（咬住嘴唇，不出声）']);
    if (r < 2) return answered(S, r);
    S.sfx('heart'); await S.wait(800);
    await S.narr('你咬着嘴唇，一声也不出。\n过了好一会儿，棺材里轻轻地、失望地，叹了一口气。');
    S.amb('drone');
    await S.think('「有人喊你的名字，莫应。」——滕师傅的话。');
  }
  async function answered(S, r) {
    S.clearTimer();
    await S.say('石满仓', r === 0 ? '哎——' : '……谁？');
    await S.wait(500);
    S.ent('g4').open = true; S.sfx('open');
    await S.narr('最里头那口棺材的盖子，「吱——」地，挪开了一条缝。');
    await S.say('？？？', '……应了就好。', { style: 'whisper' });
    await S.scare('face', { spr: '@xs3up', dur: 1.1 });
    await S.end({ bad: true, title: '应了一声', text: '天亮以后，田老伯在义庄门口捡到一只朱砂碟。\n\n晏家老店里，那位喜神面朝墙站着，额头上什么也没有。\n她的身边，靠墙多立了一个人，包着头帕，脸朝着墙。\n\n后来，沅水边跑山的人都说：\n夜里有人喊你，千万莫应。\n应了一声，就要陪它走一程。' });
  }
  async function guanOn(S, i) {
    const T = [
      '一口薄皮棺材，盖子上用粉笔写着：「无名氏　六月十二　沅水边捞起」。',
      '棺材头上贴着一张纸：「寄存　候家属来领」。\n纸已经黄透了，没有人来领。',
      '这口棺材是空的，盖子斜搁着，里头铺着一层石灰。\n石灰上，有一个人躺过的印子。',
      S.ent('g4').open ? '盖子挪开了一条缝。缝里黑漆漆的。' : '最里头这口，盖子钉得死死的。\n你把耳朵凑过去——里面，好像有水声。'];
    await S.narr(T[i]);
  }
  async function tianOn(S) {
    S.face('tian', 'pl');
    if (S.f.tianOk) return S.say('田老伯', cycle(S, '_ti', ['钥匙用完了搁在香案上。快去，香不等人。', '回去的路上，莫回头。', '滕老倌……唉。']));
    if (S.once('tianWake')) { S.bubble('tian', '?', 1000); await S.narr('老人坐在椅子上打盹，烟杆还叼在嘴里。你推了推，他一下子睁开了眼。'); }
    await S.say('田老伯', ['……哪个？大半夜的，跑到义庄来？', '晏家店里的？赶尸的那个滕老倌，是住你们那里？']);
    await S.say('石满仓', '老伯！喜神的符掉了，师傅烧得说胡话——我要一点朱砂补符！');
    S.bubble('tian', '!', 900);
    await S.say('田老伯', ['符掉了？！', '……莫慌。铃锣镇得住一炷香，你还来得及。']);
    await S.say('田老伯', ['我年轻时也给赶尸的打过下手。说出来你莫笑——我抬过竹竿。', '有的喜神是自己走的，有的……是人抬的。哪个是哪个，赶尸的不说，我也不问。', '可有一样是真的：画符的时候，符头要写喜神的真名姓。名字写错了，符就贴不住。']);
    await S.say('田老伯', ['朱砂在隔壁祠堂的香案上，红漆匣子里。钥匙你拿去。', '用无根水调——檐下接的雨水。莫用井水。']);
    S.f.tianOk = true;
    S.goal('去隔壁祠堂的香案上取朱砂');
  }
  async function xianganOn(S) {
    if (S.f.ph !== 'fu') return S.narr('香案上供着祖宗牌位，香炉里的灰积得满满的。');
    if (S.has('zhusha')) return S.narr('红漆匣子盖得好好的。你又冲牌位作了个揖。');
    if (!S.f.tianOk) return S.narr('香案上摆着一只红漆小匣子，挂着一把小铜锁。\n匣子缝里，透出一点暗红色的粉末。\n——没有守祠人的话，不好动祖宗的东西。隔壁义庄里，好像有人。');
    S.give('zhusha');
    await S.narr('钥匙「咔」地拧开了匣子。里头满满一匣辰砂，红得发紫。\n你冲着牌位作了三个揖，包了一小包。');
    fuGoal(S); S.cp('fu');
  }
  async function redraw(S) {
    if (!S.has('zhusha') || !S.has('yudie')) {
      const miss = [];
      if (!S.has('zhusha')) miss.push('朱砂碟是空的——朱砂得去镇上讨。老板娘说过，祠堂守义庄的田老伯那儿有。');
      if (!S.has('yudie')) miss.push('朱砂要用水调开。口诀说，要「无根水」……');
      await S.narr('她面朝着墙，后脑勺上的头发还在往下滴水。');
      return S.narr(miss.join('\n'));
    }
    await S.narr('你把朱砂抖进碟子，用符笔慢慢调开。红得发紫，像一碟血。');
    if (S.f.water === 'well') {
      S.take('yudie'); S.give('zhudie', true); S.f.water = null; S.sfx('drip');
      await S.narr('笔尖一落下去，朱砂就沉了底，怎么也化不开——像碟子底下有什么东西拽着它。');
      await S.think('井水……口诀说，井水自地底出，有根，拴魂。\n得用檐下接的雨水。');
      fuGoal(S); return;
    }
    const r = await S.ask('符头上，要写喜神的名姓。写什么？', ['吴氏', '秀姑', '滕秀姑']);
    S.sfx('paper');
    if (r !== 2) {
      await S.narr(`你一笔一笔写下「${['吴氏', '秀姑'][r]}」，把符贴上她的额头。`);
      await S.wait(500); S.sfx('whisper');
      await S.narr('符在她额头上停了一停，像被一口气吹着，轻飘飘地，又落了下来。');
      await S.think(r === 0 ? '名不真，符不灵……她不是吴氏？' : '光有名字不行……口诀说的是「名姓」。她姓什么？');
      if (!S.has('yinsuo')) await S.think('幺儿一直跟着师傅……他也许知道。他在后院柴房里。');
      return;
    }
    await fuDone(S);
  }

  /* ================= 天亮：滕师傅的秘密 ================= */
  async function fuDone(S) {
    S.clearTimer();
    await S.narr('你屏住气，一笔一笔，在符头上写下三个字：\n\n「滕　秀　姑」');
    S.ent('xs3_k').spr = '@xs3'; S.sfx('chime'); S.fx('flash');
    await S.narr('符一贴上，就牢牢地吸在了她的额头上。\n她的肩膀，像是松了一口气似的，慢慢地塌了下去。');
    S.f.ph = 'dawn'; S.norun(false); S.plr(null); light(S);
    S.ent('huotang').light = { r: 4.6, col: 'rgba(255,140,60,.24)', flick: true };
    await S.wait(600);
    S.place('teng_k', 11, 6, 0); S.show('teng_k');
    S.sfx('step');
    await S.narr('身后有人咳了一声。');
    S.face('pl', 'teng_k');
    await S.say('滕师傅', '……你写的是「滕秀姑」。');
    if (S.has('yinsuo')) { S.take('yinsuo'); await S.narr('你把那把银锁递过去。他接在手里，攥着，攥了很久。'); }
    await S.say('滕师傅', ['她不姓吴。吴，是她娘的姓。', '她是我闺女。']);
    await S.narr('火塘里的柴塌下去一块，火星子飞起来，又灭了。');
    await S.say('滕师傅', ['十四岁那年，她娘做主，把她许给了辰州一家开染坊的。我常年在外头跑，一年见不着她一回。', '今年六月，沅水发大水。她从染坊后头的码头上……跳下去了。', '十七岁。']);
    await S.say('滕师傅', ['投河的，不赶。三赶三不赶，祖师爷传下来的规矩。魂随水去了，铃摇不醒，符镇不住。', '这话，我教幺儿教了一百遍。', '……可我去收她的时候，就摇了一下铃。']);
    await S.say('滕师傅', '她站起来了。');
    await S.narr('他的声音哑得不成样子。');
    await S.say('滕师傅', ['不是我赶她。是她自己要回家。', '账簿上，我写了「吴氏」。我不敢写「滕」。写上了……就是真的了。就是我滕某人的闺女，真的没了。', '名不真，符不灵。风一吹，就掉了。……吓着你了，后生。']);
    const r = await S.ask('「吓着你了，后生。」', ['「师傅，送她回去吧。我跟你走一趟。」', '「……她一路，都是自己跟着走的？」']);
    if (r === 1) await S.say('滕师傅', ['一步一步，四百多里。', '我摇铃，她就跟着。我停下，她就站着等我。……跟她小时候一个样。']);
    await S.say('滕师傅', ['她娘在麻阳。我捎了信去，说秀姑……要回来了。', '我这身子，怕是走不到了。后生，明天夜里，你替我敲锣，把她送到寨门口。']);
    await S.say('石满仓', '我跟你去。麻阳，我本来就要去的。');
    S.sfx('bell'); await S.wait(300);
    await S.narr('后院里，那只大公鸡扯着嗓子，叫了头一遍。');
    await S.fade(1, 1200);
    await S.card('第二天夜里', '', '天亮了，又黑了。雨停了。\n\n石满仓把货担寄在晏家老店，\n提着铜锣，\n往麻阳去。');
    await S.go('zhaikou', 3, 4, 2);
  }

  /* ================= 终幕：寨口 ================= */
  async function raiseOn(S) {
    if (S.f.ph !== 'home') return S.narr('她跟在你身后，一跳，一跳。斗笠上的露水，一滴一滴落下来。');
    S.face('pl', 'xs3_z');
    if (!S.f.risen) {
      const v = await S.keypad('叫喜神起身（铃／锣）', ['铃', '锣'], 2);
      if (v == null) return;
      await sound(S, v);
      if (v !== '锣铃') { await S.narr('她一动不动。\n……口诀上，「起身」是怎么敲的？'); return; }
      S.f.risen = true; S.face('xs3_z', 'pl'); S.bubble('xs3_z', '…', 1000);
      await S.narr('锣一声，铃一声。\n她的斗笠轻轻抬了一抬——站直了。');
    }
    const v2 = await S.keypad('叫喜神跟上（铃／锣）', ['铃', '锣'], 3);
    if (v2 == null) return;
    await sound(S, v2);
    if (v2 !== '铃铃锣') { await S.narr('她原地跳了一下，又站住了。\n……不对。「随行」，是铃在前，还是锣在前？'); return; }
    S.f.ph = 'walk';
    S.follow('xs3_z', true);
    await S.narr('铃、铃、锣——\n她跟上来了。一跳，一跳，脚尖不沾泥。');
    await S.say('滕师傅', '……走吧。我在后头慢慢跟着。');
    S.hide('teng_z');
    S.goal('敲着锣，领秀姑过风雨桥，送到寨门口');
    S.cp('zk');
  }
  function zkTick(S, dt) {
    if (S.f.ph !== 'walk' || W.busy) return;
    S.f._zt = (S.f._zt || 0) - dt;
    if (S.f._zt <= 0 && S.pl.mv) { S.f._zc = ((S.f._zc || 0) + 1) % 3; S.sfx(S.f._zc ? 'bell' : 'thud'); S.f._zt = .7; }
  }
  async function finale(S) {
    S.f.ph = 'end';
    S.follow('xs3_z', false);
    S.place('mom', 26, 4, 1); S.ent('mom').alpha = 0;
    S.focus(24, 4);
    await S.alpha('mom', 1, 900);
    await S.narr('寨门底下，站着一个人，手里提着一盏灯笼。');
    await S.narr('是个上了年纪的妇人，包着青头帕，腰上系着围裙。\n她不知在这里站了多久了，裤脚全叫露水打湿了。');
    S.place('teng_z', 18, 4, 2);
    await S.walk('teng_z', [20, 4], 1.6);
    await S.say('妇人', '……是秀姑么？');
    await S.say('滕师傅', '……是。我把她领回来了。');
    await S.walk('xs3_z', [25, 5], 1.4); S.face('xs3_z', 3); S.face('mom', 0);
    await S.narr('妇人提着灯笼，走到喜神跟前。\n她没有哭。她抬起手，把那顶湿透的斗笠，轻轻地扶正了。');
    await S.say('妇人', ['秀姑，娘在这里。', '到屋了。']);
    S.face('teng_z', 'pl');
    await S.say('滕师傅', ['寨子里的老规矩……', '离家的人回来，要有人在寨门口喊她，要有人替她应。应了，魂才认得路，才肯进屋。', '……后生。我喉咙发不出声了。你替她应一声。']);
    for (;;) {
      S.sfx('whisper');
      await S.say('妇人', '秀姑——回来了没有——', { style: 'big' });
      const r = await S.ask('「秀姑——回来了没有——」', ['「回来了——」', '（不出声）']);
      if (r === 0) break;
      await S.narr('风从寨门底下穿过去。没有人应。');
      await S.say('滕师傅', '喊的是她，不是你。替她应，不碍事。');
    }
    await S.say('石满仓', '回来了——', { style: 'big' });
    await S.say('妇人', '秀姑——到屋了没有——', { style: 'big' });
    await S.say('石满仓', '到屋了——', { style: 'big' });
    S.sfx('chime');
    S.ent('xs3_z').spr = '@xs3n';
    await S.narr('喜神额头上的黄符，轻轻地，自己飘落了下来。');
    await S.narr('她的身子慢慢软了下去，靠在了娘的肩膀上。\n像一个走了很远很远的路、终于可以睡一觉的孩子。');
    await S.alpha('xs3_z', .25, 1600);
    await S.say('滕师傅', '……秀姑。爹送你到屋了。', { style: 'whisper' });
    await S.fade(1, 1400);
    await S.card('后来', '', '秀姑埋在了麻阳寨子的后山上，朝着沅水的那一面。\n\n滕师傅没有再回辰州。\n他把铜铃和铜锣交给了幺儿，\n在寨子里住了下来。一个秋天，又一个秋天。');
    await S.end({ title: '第四夜　完', text: '第二年秋天，石满仓又挑着货担，走那条沅水边的山路。\n\n夜半，身后响起了锣声。他照老规矩躲进石窝里，面朝山壁。\n锣声后头，跟着一串铃——\n摇得有些乱，有些急，是个半大孩子的手。\n\n他没有回头。\n只在心里，替那些回家的人，轻轻地应了一声：\n「回来了。」' });
  }
})();
