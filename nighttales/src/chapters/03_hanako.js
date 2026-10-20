/* ================= 第三夜 · 厕所里的花子 ================= */
(() => {
  const CN = ['零', '一', '二', '三', '四', '五', '六', '七', '八', '九', '十', '十一', '十二', '十三'];
  const HC = '#b0161c';   // 花子的红裙
  /* 捉迷藏的四个藏身处：湿脚印路线、红发绳位置、找到时的旁白 */
  const SPOTS = {
    lockC: { ht: [13, 12], path: [[11, 11], [12, 11]], hint: '发绳旁边的水痕没有往远处去，就停在这附近。', find: '你一把拉开了扫除用具柜的铁门——' },
    tobi: { ht: [3, 5], path: [[9, 11], [8, 11], [7, 11], [6, 11], [5, 11], [4, 11], [3, 10], [3, 9], [3, 8], [3, 7], [3, 6]], hint: '发绳落在仓库里。旁边的跳箱上，帆布湿了一小块。', find: '你掀开了跳箱最上面那一层——' },
    kyotaku: { ht: [20, 6], path: [[11, 11], [12, 11], [13, 11], [14, 11], [15, 11], [16, 11], [17, 10], [17, 9], [17, 8], [17, 7], [18, 6], [19, 6]], hint: '发绳落在课桌中间，正对着讲台。', find: '你蹲下身，往讲台底下一看——' },
    curtR: { ht: [27, 4], path: [[11, 11], [13, 11], [15, 11], [17, 11], [19, 11], [21, 11], [23, 11], [25, 11], [26, 10], [27, 9], [27, 8], [27, 7], [27, 6], [27, 5]], hint: '发绳就落在窗帘底下。窗帘的下摆，湿了一大片。', find: '你一把掀开了窗帘——' }
  };
  /* 追逐：每张图一个人体模型、一个跟随的美咲；[模型, 美咲, 出现格, 延迟ms] */
  const CH = { hall3: ['model3', 'misaki3', [28, 12], 0], stairs: ['modelS', 'misakiS', [8, 2], 900], hall1: ['model1', 'misaki1', [27, 3], 900], gate: ['modelG', 'misakiG', [20, 2], 1200] };
  const plrBase = S => S.plr(S.has('fl2') ? 4 : null);
  const caught = async S => {
    await S.scare('face', { spr: '@jinbo' });
    await S.die('冰凉的、软塌塌的塑料手指，扣住了你的后领。\n它把那半张没有皮肤的脸凑过来，像是在打量——你的身体，合不合它的尺寸。', '被人体模型抓住了');
  };
  function TILE_SNOW(R, X, Y) { R(0, 0, 16, 16, '#a9afba'); for (let i = 0; i < 9; i++) { const h = hash(X * 7 + i, Y * 13 + i, 31); R((h * 15) | 0, (hash(X, Y, i + 40) * 15) | 0, 2, 1, i % 3 ? '#c8ced8' : '#8e94a0'); } }
  async function readNote(S, id) { S.f['r_' + id] = true; await S.note(id); }
  function bringMisaki(S, id) {
    const p = S.pl, m = curMap(), back = [[0, -1], [1, 0], [-1, 0], [0, 1]][p.dir];
    for (const [dx, dy] of [back, [0, 1], [0, -1], [1, 0], [-1, 0]]) {
      const x = p.x + dx, y = p.y + dy;
      if (passable(m, x, y, null)) { S.place(id, x, y, p.dir); break; }
    }
    S.follow(id, true);
  }
  function spawn(S, map, c, ms) {
    S.after(ms, async S => {
      if (S.map !== map || S.f.phase !== 'chase') return;
      const p = S.pl;
      if (Math.abs(p.x - c[2][0]) + Math.abs(p.y - c[2][1]) < 3) return spawn(S, map, c, 400);
      S.place(c[0], c[2][0], c[2][1], 0); S.sfx('thud'); S.bubble(c[0], '!', 900);
      S.chase(c[0], { spd: 2.8, catch: caught });
    });
  }
  function chaseSetup(S) {
    const c = CH[S.map]; if (!c) return;
    bringMisaki(S, c[1]);
    if (S.map === 'hall3') { S.place(c[0], c[2][0], c[2][1], 2); S.chase(c[0], { spd: 2.8, catch: caught }); S.ent(c[0]).chase.wait = 2.6; S.bubble(c[0], '!', 1200); return; }
    S.stop(c[0]); S.hide(c[0]);
    spawn(S, S.map, c, c[3]);
  }
  /* 捉迷藏时调查错的地方：扣时间 */
  async function look(S, normal, seekTxt) {
    if (S.f.seek) {
      if (W.timer) W.timer.left = Math.max(1, W.timer.left - 6);
      S.sfx('giggle');
      await S.narr((seekTxt || '……不在这里。') + '\n（不知道从哪儿，传来一声轻轻的笑：「没——猜——中——」）');
      return;
    }
    await S.narr(normal);
  }
  async function spotOn(S, k, normal) {
    if (S.f.seek && S.f.hk === k) return found(S, k);
    return look(S, normal);
  }

  defChapter({
    id: 'hanako', n: 3, title: '厕所里的花子', sub: '三楼女厕所，第三间。敲三下门，问：「花子同学，你在吗？」', origin: '日本学校怪谈', color: '#1f3d3a',
    icon: '@hanako', amb: 'school', floor: 'wood', wall: 'wood', dark: .86, plr: 3.3,
    people: {
      me: { skin: '#f1c9a5', hair: '#1e1818', hs: 'short', top: '#2f4f80', top2: '#d8d8d8', bottom: '#2a2c3a', shoes: '#e8e8e8', child: true },
      misaki: { skin: '#f3d0b0', hair: '#2a1a14', hs: 'twin', top: '#e08a9a', top2: '#f4e8e8', bottom: '#3a3a5a', skirt: true, shoes: '#f0eee8', child: true },
      hanako: { key: 'hanako', skin: '#ece2d8', hair: '#121014', hs: 'bob', top: '#efebe2', top2: '#d8d2c6', bottom: HC, skirt: true, shoes: '#2a1a1a', child: true, extra(g, d, fr, G, R) { if (d === 0 || d === 3) { R(5, G.tT, 1, G.tB - G.tT + 1, HC); R(10, G.tT, 1, G.tB - G.tT + 1, HC); } else R(7, G.tT, 1, G.tB - G.tT + 1, HC); } },
      hanakoF: { key: 'hanako-f', skin: '#ece2d8', hair: '#121014', hs: 'bob', top: '#efebe2', bottom: HC, skirt: true, eye: '#000', extra(g, d, fr, G, R) { if (d === 0) { R(5, G.tT, 1, G.tB - G.tT + 1, HC); R(10, G.tT, 1, G.tB - G.tT + 1, HC); } } },
      jinbo: { key: 'jinbo', skin: '#dcc4a4', hair: '#cdb494', hs: 'bald', top: '#dcc4a4', top2: '#dcc4a4', bottom: '#cdb494', shoes: '#cdb494', extra(g, d, fr, G, R) {
        if (d === 0) { R(8, G.hT, 4, 7, '#a84444'); R(8, G.hT + 7, 3, 1, '#a84444'); R(9, G.hT + 4, 2, 2, '#f4f0e8'); R(9, G.hT + 5, 1, 1, '#200'); R(8, G.tT, 4, G.tB - G.tT + 1, '#a84444'); R(8, G.tT + 2, 3, 2, '#c86a5a'); R(9, G.tT + 5, 2, 2, '#6a2a3a'); R(12, G.tT + 1, 1, 5, '#a84444'); }
        else if (d === 1) { R(9, G.hT, 2, 6, '#a84444'); R(9, G.tT, 2, G.tB - G.tT + 1, '#a84444'); }
      } }
    },
    items: {
      pin: { name: '草莓发卡', desc: '美咲的发卡。掉在旧校舍侧门的台阶前。' },
      fl2: { name: '粉色手电筒', desc: '美咲的手电筒，贴着美少女战士的贴纸。电池快没电了。' },
      mkey: { name: '音乐室钥匙', desc: '从人体模型手里掰出来的钥匙，红色钥匙牌上写着「音乐室」。' },
      skey: { name: '楼梯铁栅栏钥匙', desc: '大太鼓肚子里找到的钥匙。冰凉冰凉的。' }
    },
    notes: {
      p1: { title: '《樱丘新闻》· 学校七大不可思议（一）', text: '（报纸社团的手抄本。纸已经发黄了，日期是昭和五十四年十月。）\n\n本校旧校舍建于昭和九年，是市里最老的木造校舍。关于它，代代流传着七个「不可思议」。本报记者冒着生命危险（？）进行了采访。\n\n其一　二宫金次郎像\n操场上背着柴火读书的金次郎像，一到半夜就会换个地方读书。\n六年级生作证：「早上它明明面朝校门，放学的时候却面朝校舍。」\n据说，它是在看着什么人。' },
      p2: { title: '《樱丘新闻》· 学校七大不可思议（二）', text: '其二　理科室的人体模型\n半边皮肤、半边肌肉的人体模型，夜里会在走廊上跑。它想要一副完整的身体，所以会追赶天黑以后还留在学校里的孩子。\n※理科的山田老师说：「胡说八道。」可是他也从来不在天黑以后进理科室。\n\n其三　音乐室的钢琴\n没有人的音乐室里，钢琴会自己响起来。弹的总是同一首曲子的开头，从来没有弹完过。' },
      p3: { title: '《樱丘新闻》· 学校七大不可思议（三）', text: '其四　会转眼睛的肖像画\n音乐室墙上的音乐家肖像，眼睛会跟着人转。\n如果有一幅画不看你——那它一定是在看别的什么东西。\n\n其五　第十三级台阶\n通往三楼的楼梯，白天数是十二级，晚上数是十三级。\n踩上第十三级的人会被带到「另一边」去，在楼梯上一直走、一直走，永远走不到头。\n破解的办法：站在第十二级上，闭上眼睛，跨过去。千万不要踩。' },
      p4: { title: '《樱丘新闻》· 学校七大不可思议（四）', text: '其六　三楼女厕所的花子\n三楼女厕所，从门口数第三间。敲三下门，问：「花子同学，你在吗？」\n就会听见一个小女孩回答：「在——」\n她留着娃娃头，穿白衬衫和红色的背带裙。有人说她会把人拖进马桶里；也有人说，她只是想找人陪她玩。\n\n其七\n（这一段被人整整齐齐地撕掉了。撕口下面，只留着一行铅笔字：）\n知道了第七个不可思议的人，会——' },
      dare: { title: '试胆指令书', text: '出题人：六年二组　大辅\n挑战者：四年二组　美咲\n\n1. 天黑以后，一个人进旧校舍。\n2. 上三楼，去女厕所。\n3. 敲第三间的门三下，问：「花子同学，你在吗？」\n4. 把这张纸夹在门缝里，明天我们去检查。\n\n做不到的话，就承认四年级全是胆小鬼！\n\n（纸的背面，是美咲圆滚滚的字：才不是胆小鬼。）' }
    },
    legend: '「厕所里的花子」（トイレの花子さん）是日本流传最广的学校怪谈。最常见的说法是：在学校三楼的女厕所，敲第三间隔间的门三下，问「花子同学，你在吗？」，门里就会传出一个小女孩的声音：「在——」。她被描述成留着娃娃头、穿白衬衫和红色背带裙的小学女生。有的版本里她只是应一声；有的版本里她会把人拖进马桶；也有人说，她只是想找人一起玩。\n\n厕所怪谈本身由来已久。据说早在战后不久——1940年代末到1950年代——岩手县等地就流传着「从里数第三间厕所会传出『第三个花子』的声音，马桶里伸出一只白手」之类的故事。那时的「花子」大多只有声音，没有固定的模样。到了1980年代，她在孩子们之间口耳相传，楼层、敲门的次数、咒语和结局，各地都不一样。\n\n1990年，民俗学者常光彻根据学生们讲的故事出版了《学校的怪谈》，此后同类童书、漫画大量涌现；1995年夏天，真人电影《学校的怪谈》和《厕所里的花子》相继上映，娃娃头、白衬衫、红裙子的形象由此固定下来。至于她是谁，说法很多：被害的女孩、病死的学生……也有一种说法，把她和战争时空袭中躲进厕所的孩子联系在一起，但都找不到可靠的出处。\n\n「学校七大不可思议」（学校の七不思議）是日本学校怪谈的固定格式：夜里换位置的二宫金次郎像、理科室的人体模型、自己响起的钢琴、眼睛会动的音乐家肖像、多出一级的楼梯……每所学校的版本都不一样。还常常有这样一条：知道全部七个的人会遭遇不幸——所以第七个，总是没有人知道。\n\n（本章中的樱丘小学、报纸社团的手抄本、花子在空袭那天玩捉迷藏的身世，以及捉迷藏的规则，都是游戏虚构。）',
    start: { map: 'gate', x: 3, y: 15, dir: 3 },
    resume: {
      seek: async S => { await startSeek(S); },
      chase: async S => { chaseSetup(S); }
    },
    async intro(S) {
      await S.card('第三夜　厕所里的花子', '1995年12月　东京都郊外　樱丘小学旧校舍', '下个月，这栋木造的旧校舍就要拆了。\n六年级的说，拆掉之前，总得有人去跟「她」打声招呼。\n\n美咲进去了。\n天黑了，她还没有出来。');
    },
    tiles: {
      snow: { solid: false, paint(R, X, Y) { TILE_SNOW(R, X, Y); } },
      step: { solid: false, paint(R, X, Y) { R(0, 0, 16, 16, '#5a4030'); R(0, 0, 16, 3, '#7a5a40'); R(0, 13, 16, 3, '#2e2016'); if (hash(X, Y, 8) < .4) R(5, 6, 4, 1, '#4a3424'); R(7 + ((hash(X, Y, 9) * 4) | 0), 4, 3, 2, '#4e3828'); } },
      sfence: { solid: true, paint(R, X, Y) { TILE_SNOW(R, X, Y); R(0, 6, 16, 2, '#4a4e55'); R(0, 11, 16, 2, '#4a4e55'); R(2, 2, 2, 13, '#5a5e66'); R(11, 2, 2, 13, '#5a5e66'); R(2, 2, 2, 1, '#c8ced8'); R(11, 2, 2, 1, '#c8ced8'); } },
      stree: { solid: true, paint(R, X, Y) { TILE_SNOW(R, X, Y); R(7, 9, 2, 6, '#2a1c12'); R(2, 1, 12, 9, '#1e2a24'); R(3, 0, 10, 2, '#2a3a32'); R(3, 1, 6, 2, '#c8ced8'); R(9, 3, 4, 1, '#c8ced8'); R(2, 6, 4, 1, '#b8bec8'); } },
      ban: { solid: true, paint(R) { R(0, 0, 16, 16, '#1e140c'); R(5, 0, 6, 16, '#4a3020'); R(6, 0, 2, 16, '#6a4a30'); R(5, 0, 6, 1, '#7a5a3a'); } }
    },
    sprites: {
      kinjiro(g, e, t, R) {   // 二宫金次郎像（石像，背柴读书）
        const s = '#6f716c', d = '#4f514c', l = '#8a8c86';
        box(R, 1, 6, 14, 9, '#55554f'); R(2, 7, 12, 1, '#6a6a64');
        R(3, -15, 10, 9, '#5e5a4a'); for (let i = 0; i < 5; i++) R(3 + i * 2, -17, 1, 11, '#4a463a');
        R(5, -8, 6, 13, s); R(5, -8, 1, 13, l); R(10, -8, 1, 13, d);
        R(5, 4, 2, 2, d); R(9, 4, 2, 2, d);
        R(6, -14, 4, 6, l); R(6, -15, 4, 2, d);
        R(4, -5, 8, 3, '#9a9c96'); R(8, -5, 1, 3, d);
        if (e.look) { R(7, -12, 1, 1, '#120c0c'); R(9, -12, 1, 1, '#120c0c'); } else R(7, -11, 3, 1, d);
      },
      hyaku(g, e, t, R) {   // 百叶箱
        R(3, 2, 1, 13, '#d8d6cc'); R(12, 2, 1, 13, '#d8d6cc');
        box(R, 1, -10, 14, 13, '#e8e6dc'); R(0, -12, 16, 2, '#c8c6bc');
        for (let y = -8; y < 2; y += 2) R(2, y, 12, 1, '#bdbbb0');
        if (e.open) R(3, -8, 10, 9, '#151515');
      },
      gate(g, e, t, R) {   // 铁校门，2 格
        R(0, -8, 32, 2, '#3a3d42'); for (let x = 1; x < 32; x += 4) R(x, -8, 2, 23, '#4a4e55');
        R(0, 6, 32, 2, '#3a3d42');
        for (let i = 0; i < 4; i++) R(11 + i * 3, 3 + (i % 2), 3, 2, '#8a8a8a');
        R(15, 5, 3, 4, '#a08a40');
      },
      chaindoor(g, e, t, R) {   // 被铁链锁住的正门，2 格
        box(R, 1, -2, 30, 16, '#4a3a2a'); R(3, 0, 12, 8, '#0e1726'); R(17, 0, 12, 8, '#0e1726'); R(15, -1, 2, 15, '#3a2a1c');
        R(4, 1, 3, 2, '#2a3a4a'); R(18, 1, 3, 2, '#2a3a4a');
        R(3, 9, 26, 2, '#8a8a8a'); R(5, 8, 2, 1, '#8a8a8a'); R(24, 11, 2, 1, '#8a8a8a'); R(14, 10, 4, 4, '#a08a40');
      },
      bike(g, e, t, R) {
        R(1, 8, 6, 6, '#222'); R(2, 9, 4, 4, '#555'); R(9, 8, 6, 6, '#222'); R(10, 9, 4, 4, '#555');
        R(4, 7, 8, 2, '#e07a9a'); R(7, 4, 2, 4, '#e07a9a'); R(9, 3, 4, 1, '#333'); R(2, 2, 3, 1, '#999');
        R(1, 3, 5, 4, '#bbb'); R(2, 4, 3, 2, '#5a6a9a'); R(9, 3, 4, 1, '#e8eef4');
      },
      plate(g, e, t, R) { R(2, 0, 12, 6, '#2a2018'); R(3, 1, 10, 4, e.col || '#e8e4d8'); R(5, 2, 6, 1, '#333'); R(5, 4, 4, 0, '#333'); },
      exitsign(g, e, t, R) { R(3, 1, 10, 6, '#1a6a3a'); R(4, 2, 8, 4, '#5ae08a'); R(5, 3, 2, 2, '#e8fff0'); R(8, 4, 3, 1, '#e8fff0'); },
      hydrant(g, e, t, R) { box(R, 2, 1, 12, 12, '#a01c1c'); R(4, 3, 8, 4, '#c83a3a'); R(7, 9, 2, 2, '#5a1010'); },
      keybox(g, e, t, R) {
        box(R, 2, 1, 12, 11, '#6a5038');
        for (let i = 0; i < 6; i++) { const x = 4 + (i % 3) * 3, y = 3 + ((i / 3) | 0) * 5; R(x, y, 1, 1, '#ccc'); if (i !== 1 && i !== 5) R(x, y + 1, 1, 3, '#d9b84a'); }
      },
      jars(g, e, t, R) {
        box(R, 0, -10, 16, 25, '#4a3a28'); R(1, -2, 14, 1, '#2a1c10'); R(1, 6, 14, 1, '#2a1c10');
        const cols = ['rgba(170,190,130,.85)', 'rgba(190,170,120,.85)', 'rgba(150,170,160,.85)'];
        for (let s = 0; s < 3; s++) for (let i = 0; i < 3; i++) { const x = 2 + i * 5, y = -9 + s * 8; R(x, y + 1, 3, 6, cols[(i + s) % 3]); R(x, y, 3, 1, '#888'); R(x + 1, y + 3, 1, 2, ['#c8a8a0', '#6a5a3a', '#e0d8c8'][(i * 2 + s) % 3]); }
      },
      upright(g, e, t, R) {   // 立式钢琴，power = 自己在弹
        SPR.piano(g, e, t, R);
        R(10, -9, 12, 4, '#e8e2cc'); R(11, -8, 10, 1, '#555'); R(11, -6, 8, 1, '#555');
        if (e.power) { const k = ((t * 5) | 0) % 9; R(3 + k * 3, 4, 2, 3, '#8a867c'); const b = (t * 1.3) % 1; R(18 + b * 6, -12 - b * 8, 1, 4, 'rgba(230,230,230,' + (1 - b) + ')'); R(18 + b * 6, -9 - b * 8, 2, 1, 'rgba(230,230,230,' + (1 - b) + ')'); }
      },
      composer(g, e, t, R) {   // 音乐家肖像：眼睛跟着玩家转（fix=固定看右下）
        box(R, 2, 0, 12, 13, '#6a5030'); R(3, 1, 10, 11, '#24201c');
        const hc = e.hc || '#e8e4dc';
        R(5, 4, 6, 6, '#d8c4a8');
        if (e.wild) { R(4, 2, 8, 3, hc); R(3, 3, 2, 6, hc); R(11, 3, 2, 6, hc); R(5, 1, 2, 1, hc); R(9, 1, 2, 1, hc); }
        else { R(4, 2, 8, 3, hc); R(3, 4, 2, 5, hc); R(11, 4, 2, 5, hc); }
        R(4, 10, 8, 2, e.col || '#2a2a3a'); R(7, 10, 2, 2, '#e8e4dc'); R(7, 9, 2, 1, '#8a5a4a');
        R(6, 6, 2, 2, '#f0ece0'); R(9, 6, 2, 2, '#f0ece0');
        let dx = 0, dy = 1;
        if (e.fix != null) { dx = 1; dy = 1; }
        else if (W && W.pl) { dx = W.pl.px < e.px ? 0 : 1; dy = W.pl.py > e.py + 24 ? 1 : 0; }
        R(6 + dx, 6 + dy, 1, 1, '#111'); R(9 + dx, 6 + dy, 1, 1, '#111');
      },
      drum(g, e, t, R) {   // 大太鼓
        R(2, 11, 2, 4, '#3a2a1a'); R(12, 11, 2, 4, '#3a2a1a');
        box(R, 1, -1, 14, 13, '#8a3020'); R(3, 1, 10, 9, '#e8dcc0'); R(3, 1, 10, 1, '#d0c4a8');
        for (let i = 0; i < 4; i++) { R(2, 1 + i * 3, 1, 1, '#c9a35a'); R(13, 1 + i * 3, 1, 1, '#c9a35a'); }
        if (e.open) R(6, 5, 4, 3, '#1a1010'); else R(7, 5, 2, 2, 'rgba(120,110,90,.6)');
      },
      gakki(g, e, t, R) {   // 乐器柜
        box(R, 0, -12, 16, 27, '#5a4030'); R(1, -11, 14, 25, '#2a3438');
        R(1, -3, 14, 1, '#5a4030'); R(1, 5, 14, 1, '#5a4030');
        for (let i = 0; i < 5; i++) R(2 + i * 3, -10, 1, 6, '#e8e2cc');
        for (let i = 0; i < 3; i++) { R(2 + i * 5, -1, 3, 3, '#c03030'); R(3 + i * 5, 0, 1, 1, '#1a1a1a'); }
        R(2, 8, 12, 3, '#a8a080'); R(7, -11, 1, 25, 'rgba(255,255,255,.08)');
      },
      stairgate(g, e, t, R) {   // 楼梯口 + 铁栅栏
        SPR.stairsup(g, e, t, R);
        if (!e.open) { R(0, -6, 16, 2, '#3a3d42'); for (let x = 1; x < 16; x += 3) R(x, -6, 1, 22, '#5a5e66'); R(6, 4, 4, 4, '#a08a40'); R(3, -3, 10, 4, '#d8c84a'); R(4, -2, 8, 1, '#222'); }
        else { R(0, -6, 2, 22, '#5a5e66'); R(14, -6, 2, 22, '#5a5e66'); }
      },
      kyotaku(g, e, t, R) {   // 讲台
        box(R, 1, -2, 14, 16, '#7a5a3a'); R(2, -1, 12, 2, '#9a7a52'); R(3, 3, 10, 9, '#6a4a2e');
        if (e.peek) { R(13, 11, 3, 3, HC); R(14, 14, 2, 1, '#eee'); }
      },
      curtainL(g, e, t, R) {   // 拖到地的长窗帘（挂在墙面上，向下垂到地板）
        R(0, 0, 16, 1, '#777');
        R(1, 1, 14, 21, e.peek ? '#33463a' : '#2a3a30'); for (let x = 3; x < 15; x += 3) R(x, 1, 1, 21, '#1e2a22');
        if (e.peek) { R(5, 9, 6, 7, '#3a5044'); R(4, 21, 3, 2, '#e8e4dc'); R(9, 21, 3, 2, '#e8e4dc'); }
      },
      lockerS(g, e, t, R) {   // 扫除用具柜
        box(R, 0, -10, 16, 25, '#6a7480'); for (let i = 0; i < 3; i++) R(4, -7 + i * 2, 8, 1, '#4a5460'); R(12, 0, 1, 3, '#ccc');
        if (e.open) { R(1, -9, 14, 23, '#0b0b0c'); R(4, -6, 1, 18, '#8a6a3a'); R(10, -4, 3, 16, '#6a6a6a'); return; }
        if (e.peek) { R(1, 13, 14, 1, '#000'); R(13, 4, 2, 4, HC); }
      },
      tobibako(g, e, t, R) {   // 跳箱
        for (let i = 0; i < 4; i++) box(R, 1, 2 + i * 3, 14, 4, '#8a6a40');
        if (e.peek) { R(1, 1, 14, 1, '#000'); box(R, 2, -3, 14, 5, '#e8e0cc'); R(1, 1, 2, 1, '#ece2d8'); }
        else box(R, 1, -2, 14, 5, '#e8e0cc');
      },
      pile(g, e, t, R) {   // 堆起来的课桌椅
        box(R, 1, 4, 14, 7, '#b08a5a'); R(2, 11, 1, 4, '#555'); R(13, 11, 1, 4, '#555');
        box(R, 0, -4, 16, 6, '#9a7a4a'); R(2, -10, 1, 6, '#555'); R(13, -10, 1, 6, '#555'); R(6, -12, 1, 8, '#555');
        box(R, 4, -14, 9, 4, '#8a6a40');
      },
      bust(g, e, t, R) { box(R, 3, 8, 10, 7, '#9a9a94'); R(5, -2, 6, 10, '#e8e4dc'); R(4, -1, 1, 5, '#d8d4cc'); R(6, 1, 1, 1, '#bbb'); R(9, 1, 1, 1, '#bbb'); R(7, 4, 2, 1, '#cfcbc2'); },
      hairtie(g, e, t, R) { R(6, 9, 4, 1, '#c01818'); R(5, 10, 1, 2, '#c01818'); R(10, 10, 1, 2, '#c01818'); R(6, 12, 4, 1, '#c01818'); R(9, 8, 2, 2, '#e03030'); },
      hairpin(g, e, t, R) { R(4, 10, 8, 1, '#c8c8d0'); R(9, 8, 4, 4, '#e8506a'); R(10, 8, 1, 1, '#4a8a3a'); R(10, 10, 1, 1, '#f8e070'); },
      uwabaki(g, e, t, R) { R(4, 8, 8, 5, '#f0eee8'); R(4, 12, 8, 1, '#c8c4bc'); R(4, 8, 3, 5, '#d03050'); R(7, 10, 4, 1, '#333'); },
      board(g, e, t, R) { box(R, 0, 1, 16, 11, '#6a4a2a'); R(1, 2, 14, 9, '#a07a50'); R(3, 3, 6, 7, '#e0d8c0'); R(4, 5, 4, 1, '#555'); R(10, 4, 4, 4, '#d8c890'); R(5, 3, 1, 1, '#c03030'); R(11, 4, 1, 1, '#3050c0'); },
      nameplate(g, e, t, R) { R(5, 9, 6, 4, '#f0eee8'); R(5, 9, 6, 1, '#3a6aa8'); R(6, 11, 4, 1, '#333'); }
    },
    maps: {
      /* ---------------- 校门与操场 ---------------- */
      gate: {
        amb: 'wind', dark: .8, plr: 3.4, wall: 'wood', floor: 'snow',
        legend: { 's': 'snow', 'F': 'sfence', 'Y': 'stree' },
        rows: [
          '########################',
          '########################',
          'FxxxxxxxxxxxxxxxxxxxxxxF',
          'FssssssssssssssssssssssF',
          'FsYssssssssssssssssssssF',
          'FsssssssssssssssssssYssF',
          'FssssssssssssssssssssssF',
          'FssssssssssssssssssssssF',
          'FssssssssssssssssssssssF',
          'FssssssssssssssssssssssF',
          'FYsssssssssssssssssssssF',
          'FsssssssssssssssssssYssF',
          'FssssssssssssssssssssssF',
          'FssssssssssssssssssssssF',
          'FFFsFFFFFFFFFFFFFFFFFFFF',
          '::::::::::::::::::::::::',
          '::::::::::::::::::::::::'],
        ents: [
          { id: 'hole', x: 3, y: 14, spr: 'invisible', solid: false, async touch(S) { if (S.f.phase === 'chase') return finale(S); }, on: S => S.narr(S.f.phase === 'chase' ? '快钻出去！' : '栅栏底下被野狗刨开了一个洞。你和美咲从一年级起就从这里钻进钻出。') },
          { x: 6, y: 15, spr: 'bike', on: S => S.narr('美咲的粉色自行车，歪在路边，车筐里积了一层雪。\n车铃上挂着她奶奶给的护身符。她说过，有这个什么都不怕。') },
          { x: 9, y: 15, spr: 'sign', col: '#c8b040', on: S => S.narr('黄色的告示牌：「旧校舍拆除工程　1996年1月8日起」\n底下有人用马克笔歪歪扭扭地加了一行：花子要搬家了。') },
          { x: 12, y: 15, spr: 'streetlamp', light: { r: 5, col: 'rgba(255,220,150,.14)', dy: -12 }, on: S => S.narr('路灯嗡嗡地响。这附近只有这一盏灯还亮着。') },
          { id: 'mainDoor', x: 10, y: 1, w: 2, spr: 'chaindoor', on: S => S.narr('正门被粗铁链缠了好几圈，挂着一把大锁。\n门玻璃上贴着一张告示：「危险　禁止入内」。') },
          { x: 3, y: 1, spr: 'window', on: S => S.narr('黑漆漆的玻璃里，映出你自己的手电光。\n还有你身后，一大片白茫茫的操场。') },
          { x: 6, y: 1, spr: 'window', on: S => S.narr('你抬头往上看。三楼最右边那扇窗户里，窗帘好像动了一下。') },
          { x: 14, y: 1, spr: 'window', on: S => S.narr('窗台上摆着一排落满灰的牵牛花盆。这是一年级的教室。') },
          { x: 17, y: 1, spr: 'window', on: S => S.narr('玻璃上结着冰花。冰花中间有一块圆圆的、被手掌擦干净的地方——\n在玻璃里面。') },
          { id: 'side', x: 20, y: 1, spr: 'door', col: '#4a3a2a', on: S => sideDoor(S) },
          { id: 'pin', x: 19, y: 2, spr: 'hairpin', solid: false, async on(S) {
            S.hide('pin'); S.give('pin');
            await S.narr('台阶前的雪地上躺着一只草莓发卡。是美咲的，她每天都戴着。\n发卡旁边，一串小小的脚印通向侧门——只有进去的，没有出来的。');
          } },
          { id: 'kinjiro', x: 7, y: 6, spr: 'kinjiro', async on(S) {
            if (S.ent('kinjiro').s.look) return S.narr(S.f.phase === 'chase' ? '金次郎像一动不动地站着。书合上了，眼睛盯着校舍的方向。' : '铜像不知什么时候换了个方向。它不再看书了——\n它把书放了下来，眼睛直直地望着校舍。');
            await S.narr('背着柴火、边走边读书的二宫金次郎像。好像全日本每所小学的操场上都有一座。\n雪落在他的书页上，他一点也不在意。');
            if (S.once('p1')) await S.narr('书页和他的手掌之间，夹着一张折成小方块的纸。');
            await readNote(S, 'p1');
          } },
          { x: 17, y: 7, spr: 'hyaku', on: S => S.narr('百叶箱。里面的温度计停在零下二度。\n温度计底下压着一张草莓糖的糖纸——是美咲最喜欢的那种。她来过这里。') },
          { id: 'modelG', x: 20, y: 2, spr: '@jinbo', hidden: true, solid: false },
          { id: 'misakiG', x: 19, y: 3, spr: '@misaki', hidden: true }
        ],
        async enter(S, first) {
          if (S.f.phase === 'chase') {
            chaseSetup(S); S.cp('chase');
            if (S.once('outside')) { S.sfx('wind'); await S.narr('冷风灌进领口。破洞就在操场那头——快跑！'); }
            return;
          }
          if (!first) return;
          await S.narr('雪停了。旧校舍黑沉沉地蹲在操场那一头，像一只睡着的大动物。');
          await S.think(['大辅他们跑得比兔子还快。「美咲还在里面」这种话，谁也不敢跟大人说。', '美咲那个笨蛋。明明最怕黑，还非要说「我才不是胆小鬼」。']);
          S.goal('钻进栅栏，去旧校舍找美咲');
        }
      },
      /* ---------------- 一楼：玄关与走廊 ---------------- */
      hall1: {
        amb: 'school', dark: .84, wall: 'wood', floor: 'wood',
        rows: [
          '############################',
          '############################',
          '#xxxxxx....................#',
          'xxxxxxx.....................',
          '#xxxxxx....................#',
          '#xxxxxx....................#',
          '#xxxxxx....................#',
          '############################'],
        ents: [
          { x: 0, y: 3, spr: 'invisible', to: ['gate', 20, 2, 0] },
          { x: 2, y: 2, spr: 'getabako', on: S => S.narr('一格一格的木头鞋柜，名牌都发黄了。\n有几格里还塞着没人领走的旧室内鞋，鞋头的颜色是按年级分的。') },
          { x: 3, y: 2, spr: 'getabako', on: S => S.narr('「六年一组」……这些人现在应该都是大人了吧。') },
          { id: 'gbM', x: 4, y: 2, spr: 'getabako', async on(S) {
            await S.narr('这一格里，整整齐齐地摆着一双红色运动鞋，鞋跟上写着「みさき」。\n她居然换了鞋。这栋楼早就没人用了，她还守着「进门要换鞋」的规矩。');
            await S.think('……那她换上的，是谁的鞋？');
          } },
          { id: 'gbH', x: 5, y: 2, spr: 'getabako', async on(S) {
            await S.narr('旁边一格贴着褪色的名牌：「三年一组　はなこ」。\n格子里空空的。室内鞋不见了。');
            S.f.sawName = true;
          } },
          { x: 2, y: 5, spr: 'getabako', on: S => S.narr('鞋柜背面贴着一张泛黄的值日表。最后一行的名字被铅笔涂黑了。') },
          { x: 3, y: 5, spr: 'getabako', on: S => S.narr('空的。') },
          { x: 4, y: 5, spr: 'getabako', on: S => S.narr('一只室内鞋倒扣在格子里，鞋底干了一圈白白的水渍。') },
          { x: 5, y: 5, spr: 'getabako', on: S => S.narr('格子深处，有人用小刀刻了一行字：もういいかい。') },
          { x: 8, y: 2, spr: 'shelf', on: S => S.narr('奖杯柜。昭和年间的运动会奖状，接力赛的锦旗。\n玻璃上落满了灰，有一小块被手指画了个笑脸。') },
          { x: 9, y: 1, spr: 'board', on: S => S.narr('公告栏。「旧校舍将于明年一月拆除，届时请勿靠近。」\n角落里还钉着一张很旧很旧的海报：「报纸社团独家调查！樱丘小学七大不可思议！」') },
          { id: 'staff', x: 11, y: 1, spr: 'door', col: '#4a3a2a', locked: true, async on(S) {
            S.sfx('locked');
            await S.narr('职员室。门锁着。\n门上的玻璃后面，墙上的钥匙箱敞着，有一个挂钩是空的——挂钩下面的标签写着「音乐室」。');
            S.f.sawKeybox = true;
          } },
          { x: 13, y: 1, spr: 'wallclock', on: S => S.narr('挂钟停在四点四十四分。\n……四，在日语里念「し」，和「死」同音。') },
          { x: 15, y: 1, spr: 'window', on: S => S.narr('窗外是操场。雪地上，你自己的脚印歪歪扭扭的。\n还有一串更大的、拖着走的脚印。……那是刚才就有的吗？') },
          { id: 'rikaDoor', x: 17, y: 1, spr: 'door', col: '#5a4030', to: ['rika', 6, 8, 3], lock: S => S.f.phase !== 'chase', lockMsg: '理科室——那东西就是从这里出来的。不能进去！' },
          { x: 18, y: 1, spr: 'plate', on: S => S.narr('门牌：「理科室」。') },
          { x: 19, y: 1, spr: 'window', on: S => S.narr(S.has('fl2') ? '理科室的窗户。窗帘没拉严，缝里黑漆漆的。' : '理科室的窗户。窗帘没拉严——缝里，有一道细细的光在一闪一闪。') },
          { x: 22, y: 1, spr: 'door', col: '#d8d0c0', locked: true, async on(S) { S.sfx('locked'); await S.narr('保健室。门把手上缠着一圈一圈的胶带。\n门里面传来滴答、滴答的水声。'); } },
          { x: 24, y: 1, spr: 'hydrant', on: S => S.narr('消防栓。红漆剥落了，露出底下锈色的铁。') },
          { x: 26, y: 1, spr: 'exitsign', light: { r: 2.4, col: 'rgba(90,230,140,.13)' }, on: S => S.narr('绿色的应急灯牌。整栋楼里唯一亮着的东西。') },
          { x: 12, y: 6, w: 2, spr: 'bench', on: S => S.narr('走廊里的长椅。被罚站的孩子以前都坐在这儿。') },
          { x: 25, y: 6, spr: 'deadplant', on: S => S.narr('枯死的盆栽。花盆上贴着「四年二组」。') },
          { x: 27, y: 3, spr: 'stairsup', solid: false, to: ['stairs', 2, 18, 2] },
          { id: 'model1', x: 27, y: 3, spr: '@jinbo', hidden: true, solid: false },
          { id: 'misaki1', x: 25, y: 3, spr: '@misaki', hidden: true }
        ],
        async enter(S, first) {
          if (S.f.phase === 'chase') { chaseSetup(S); S.cp('chase'); return; }
          if (!first) return;
          await S.narr('旧校舍里比外面还要冷。\n地板「吱呀」一声，像是有人在很远的地方叹了口气。');
          await S.say('健太', '……美咲？美——咲——！');
          S.sfx('drip'); await S.wait(700);
          await S.narr('没有人回答。只有你自己的声音，在走廊里来回撞。');
          S.goal('找美咲（她可能上楼了）');
          S.cp();
        }
      },
      /* ---------------- 理科室 ---------------- */
      rika: {
        amb: 'drone', dark: .9, wall: 'wood', floor: 'wood', tileOpts: { woodC: '#5a4a3a' },
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
          '######.#########'],
        ents: [
          { x: 6, y: 9, spr: 'invisible', to: ['hall1', 17, 2, 0] },
          { x: 4, y: 1, spr: 'blackboard', text: true, on: S => S.narr('黑板上还留着粉笔字：「人体的构造」。\n角落里有人用很小的字写着：「他想要一副完整的身体」。') },
          { x: 9, y: 1, spr: 'window', on: S => S.narr('窗玻璃上结了霜。霜花中间印着一个小小的手印。') },
          { x: 12, y: 1, spr: 'window', on: S => S.narr('窗外的雪地上，金次郎像的影子长长的，一直拖到校舍墙根。') },
          { x: 1, y: 2, spr: 'jars', on: S => S.narr('标本架。泡在药水里的青蛙、蛇，还有一个你不想知道是什么的东西。\n它在瓶子里慢慢地转了个身。') },
          { x: 2, y: 2, spr: 'jars', on: S => S.narr('最下层有一个空瓶子，标签上写着「心脏」。瓶子里的药水还在轻轻晃。') },
          { x: 4, y: 3, spr: 'desk', on: async S => { if (S.once('p2')) await S.narr('老师的讲桌。抽屉里夹着一张发黄的油印纸，和公告栏海报上是同一个报头。'); await readNote(S, 'p2'); } },
          { x: 2, y: 5, w: 2, spr: 'table2', col: '#3a3a3a', on: S => S.narr('黑色的实验台。台面上烧焦了一块，是谁的酒精灯打翻过。') },
          { x: 7, y: 5, w: 2, spr: 'table2', col: '#3a3a3a', on: S => { S.sfx('drip'); return S.narr('实验台的水龙头没拧紧，一滴一滴往下掉。'); } },
          { x: 2, y: 7, w: 2, spr: 'table2', col: '#3a3a3a', on: S => S.narr('台面上有人用圆规刻着：「理科室的人体模型，半夜会去找自己的另一半。」') },
          { x: 7, y: 7, w: 2, spr: 'table2', col: '#3a3a3a', on: S => S.narr('一个显微镜孤零零地立着。目镜上蒙着灰。') },
          { x: 14, y: 2, spr: 'bookshelf', on: S => S.narr('理科图鉴，书脊都晒褪色了。《人体》那一本不见了。') },
          { id: 'fl2', x: 11, y: 5, spr: 'flashlight', light: { r: 2.2, col: 'rgba(255,240,200,.18)', dx: 14 }, async on(S) {
            S.hide('fl2'); S.give('fl2'); plrBase(S);
            await S.narr('是美咲的粉色手电筒，还亮着，上面贴着美少女战士的贴纸。\n她来过这里。……可她为什么要把手电筒丢下？');
            await S.think('两支手电筒，总比一支亮一点。');
          } },
          { id: 'jinboR', x: 13, y: 2, spr: 'anatomy', async on(S) {
            const e = S.ent('jinboR');
            if (S.has('mkey') || S.f.gotKey) return S.narr(e.eyes ? '它在看你。\n不管你站在哪里，它都在看你。' : '人体模型。');
            await S.narr('人体模型。左半边是皮肤，右半边是红色的肌肉和内脏。\n它抬着一只手，手指弯着——手心里攥着一把钥匙，红色的钥匙牌上写着「音乐室」。');
            if (!S.f.sawKeybox) await S.think('为什么音乐室的钥匙会在这里……？');
            const r = await S.ask('把钥匙拿出来吗？', ['掰开它的手指', '……先不要']); if (r) return;
            S.sfx('cut'); await S.wait(400);
            S.f.gotKey = true; S.give('mkey');
            await S.wait(500);
            e.eyes = true; S.sfx('sting'); S.shake(300, 1);
            await S.narr('钥匙被掰出来的一瞬间，它的手指「咔」地一下合上了。\n……你没有看错吧？刚才，它的眼珠明明是朝着窗户的。');
            S.goal('去二楼的音乐室');
            S.cp();
          } }
        ],
        async enter(S, first) {
          if (S.f.phase === 'chase') return;
          if (first) await S.narr('理科室里有一股福尔马林和灰尘混在一起的味道。\n地板上，有一道细细的光在轻轻地滚——');
          if (S.f.gotKey && S.once('modelGone')) { S.hide('jinboR'); await S.narr('……人体模型的支架上，空了。'); }
        }
      },
      /* ---------------- 二楼楼梯间 + 去三楼的楼梯 ---------------- */
      stairs: {
        amb: 'drone', dark: .9, wall: 'wood', floor: 'wood', plr: 3.2,
        legend: { 'A': 'ban', 'p': 'step' },
        rows: [
          '##############',
          '##############',
          '#######...####',
          '#######ApA####',
          '#######ApA####',
          '#######ApA####',
          '#######ApA####',
          '#######ApA####',
          '#######ApA####',
          '#######ApA####',
          '#######ApA####',
          '#######ApA####',
          '#######ApA####',
          '#######ApA####',
          '#######ApA####',
          '#######ApA####',
          '########.#####',
          '#............#',
          '#............#',
          '##############'],
        ents: [
          { x: 1, y: 18, spr: 'stairsdown', solid: false, to: ['hall1', 26, 3, 1] },
          { id: 'musicDoor', x: 3, y: 16, spr: 'door', col: '#4a3a2a', async on(S) {
            if (S.f.phase === 'chase') return S.narr('没时间了！');
            if (!S.has('mkey') && !S.f.musicOpen) { S.sfx('locked'); await S.narr('音乐室的门锁着。\n门缝里，好像飘出来一点点钢琴声。……也许是错觉。'); S.goal('找音乐室的钥匙（一楼理科室的窗缝里有光）'); return; }
            if (!S.f.musicOpen) { S.f.musicOpen = true; S.take('mkey'); S.sfx('open'); await S.narr('钥匙插进锁孔，「咔哒」一声。'); }
            await S.go('music', 6, 8, 3);
          } },
          { x: 4, y: 16, spr: 'plate', on: S => S.narr('门牌：「音乐室」。') },
          { x: 6, y: 16, spr: 'poster', col: '#d8c8a0', on: S => S.narr('「年末合唱会　曲目：欢乐颂（第九）」\n海报上的日期是十五年前的十二月。') },
          { x: 11, y: 16, spr: 'window', on: S => S.narr('窗外的雪又下起来了。路灯底下，美咲的自行车只剩一个小小的粉点。') },
          { x: 12, y: 16, spr: 'exitsign', light: { r: 2.2, col: 'rgba(90,230,140,.12)' }, on: S => S.narr('应急灯一闪一闪的，嗡——嗡——') },
          { x: 12, y: 18, spr: 'box', on: S => S.narr('纸箱上写着「拆除前清理：乐谱」。里面全是发霉的五线谱。') },
          { id: 'gate3', x: 8, y: 16, spr: 'stairgate', async on(S) {
            const g = S.ent('gate3');
            if (g.open) return S.narr('铁栅栏敞开着。上面，是通往三楼的楼梯。');
            if (!S.has('skey')) {
              S.sfx('locked');
              await S.narr('通往三楼的楼梯口拦着一道铁栅栏，挂着黄色的牌子：「危险　禁止通行」。\n栅栏那边，第四级台阶上，躺着一只小小的室内鞋。');
              if (S.once('shoeSeen')) await S.think('……是美咲的。她怎么过去的？栅栏的缝，连猫都钻不过去。');
              S.goal(S.f.musicOpen ? '找打开铁栅栏的钥匙' : S.has('mkey') ? '去音乐室看看' : '找办法上三楼（隔壁的音乐室？）');
              return;
            }
            S.take('skey'); S.sfx('open'); g.open = true; g.solid = false;
            await S.narr('锁头「啪」地弹开了。铁栅栏吱吱嘎嘎地往两边退开。');
            S.goal('上三楼');
            S.cp();
          } },
          { id: 'shoe', x: 8, y: 12, spr: 'uwabaki', solid: false, async on(S) {
            S.hide('shoe'); S.f.shoe = true;
            await S.narr('一只室内鞋。鞋头是红色的——四年级的颜色。鞋舌上用马克笔写着「美咲」。\n鞋子湿透了，冰凉冰凉的，像是在水里泡过。');
          } },
          { x: 8, y: 1, spr: 'stairsup', solid: false },
          { x: 8, y: 2, spr: 'invisible', solid: false, async touch(S) { if (S.f.phase === 'chase') return; S.f.reached3 = true; await S.go('hall3', 2, 11, 2); } },
          { id: 'modelS', x: 8, y: 2, spr: '@jinbo', hidden: true, solid: false },
          { id: 'misakiS', x: 8, y: 3, spr: '@misaki', hidden: true }
        ],
        async enter(S, first) {
          if (S.f.phase === 'chase') { chaseSetup(S); S.cp('chase'); return; }
          if (first) {
            await S.narr('二楼。楼梯间里的空气是湿的，有一股旧木头发霉的味道。');
            S.goal(S.has('mkey') ? '用钥匙打开音乐室' : '在二楼找美咲');
          }
        },
        async step(S, x, y) {
          if (S.f.phase === 'chase' || S.f.reached3 || x !== 8 || S.pl.dir !== 3) return;
          if (y === 15 && S.once('count')) {
            await S.narr('你抬头往上数台阶。一、二、三……');
            await S.narr('……十一、十二、十三。');
            await S.think('十三级？大辅说过，这个楼梯明明是十二级。上礼拜扫除的时候，我还数过。');
            return;
          }
          if (y === 4) {
            S.sfx('heart');
            if (!S.f.r_p3) { await S.think('十二。……可是脚下面，还有一级。\n那一级台阶的颜色，比别的都深。'); return; }
            const r = await S.ask('第十二级。报纸上写着：站在第十二级上，闭上眼睛，跨过去。千万不要踩。', ['闭上眼睛，跨过去', '……先等等']);
            if (r) return;
            S.dark(.99); S.plr(.4);
            await S.narr('你闭上眼睛。\n脚底下，好像有什么东西在轻轻地呼吸。');
            S.sfx('whisper'); await S.wait(700);
            await S.say('？？？', '……你踩一下嘛。就一下。', { style: 'whisper' });
            await S.narr('你咬住嘴唇，用力往前一跨——');
            S.sfx('thud'); S.dark(null); plrBase(S);
            S.f.reached3 = true;
            await S.go('hall3', 2, 11, 2);
            return;
          }
          if (y === 3) return trap(S);
        }
      },
      /* ---------------- 音乐室 ---------------- */
      music: {
        amb: 'room', dark: .88, wall: 'wood', floor: 'wood', tileOpts: { woodC: '#6a4a34' },
        rows: [
          '###############',
          '###############',
          '#.............#',
          '#.............#',
          '#.............#',
          '#.............#',
          '#.............#',
          '#.............#',
          '#.............#',
          '######.########'],
        ents: [
          { x: 6, y: 9, spr: 'invisible', to: ['stairs', 3, 17, 0] },
          { id: 'cp1', x: 2, y: 1, spr: 'composer', hc: '#e8e4dc', col: '#3a2a4a', on: S => portrait(S, '巴赫', '戴着白色的卷假发，表情很严肃。') },
          { id: 'cp2', x: 4, y: 1, spr: 'composer', hc: '#f0ece4', col: '#6a2a3a', on: S => portrait(S, '莫扎特', '扎着小辫子，嘴角好像在笑。') },
          { id: 'cp3', x: 10, y: 1, spr: 'composer', hc: '#6a6a6a', wild: true, col: '#2a2a2a', s: { fix: 1 }, async on(S) {
            if (S.f.solved) return S.narr('贝多芬。所有的画像现在都和他一样，斜斜地盯着大太鼓。');
            await S.narr('贝多芬。乱蓬蓬的头发，眉头皱得紧紧的。\n……只有他不看你。他的眼珠一直斜斜地往右下角瞟着，好像在盯着屋角的什么东西。');
          } },
          { id: 'cp4', x: 12, y: 1, spr: 'composer', hc: '#4a3a2a', col: '#2a3a4a', on: S => portrait(S, '肖邦', '瘦瘦的脸，头发很整齐。') },
          { x: 7, y: 1, spr: 'blackboard', text: true, async on(S) {
            await S.narr('黑板上用粉笔抄着年末合唱要唱的谱子：\n\n《欢乐颂》\nミ ミ ファ ソ ｜ ソ ファ ミ レ ｜ ド ド レ ミ ｜ ミ ー レ レ ー\n\n旁边画了一个大大的花丸，写着「大家一起唱！」');
            S.f.score = true;
          } },
          { id: 'piano', x: 1, y: 4, w: 2, spr: 'upright', power: true, async on(S) { await pianoPuzzle(S); } },
          { x: 1, y: 2, spr: 'bust', on: S => S.narr('贝多芬的石膏像，鼻尖被谁磕掉了一块。\n石膏像的眼睛是白的，没有眼珠——可你总觉得，它刚才眨了一下。') },
          ...[[5, 5], [7, 5], [9, 5], [5, 7], [7, 7], [9, 7]].map(([x, y], i) => ({ x, y, spr: 'chair', dir: 3, col: '#6a4a2a', on: S => S.narr(['合唱用的折叠椅，排得整整齐齐。', '椅子上放着一本歌集，翻开在《故乡》那一页。', '这把椅子……是温的。', '椅背上刻着「花」字。', '椅子腿底下压着一颗草莓糖。美咲来过这里。', '空椅子。全都朝着钢琴的方向。'][i]) })),
          { id: 'drum', x: 12, y: 6, spr: 'drum', async on(S) {
            const d = S.ent('drum');
            if (S.f.gotSkey) return S.narr('鼓面上破了个口子，里面黑漆漆的。');
            if (!S.f.solved) { S.sfx('thud'); return S.narr('运动会用的大太鼓。你用手掌拍了一下，咚——\n闷闷的回声在屋子里转了好久才停。'); }
            d.open = true; S.f.gotSkey = true; S.give('skey');
            await S.narr('鼓面上多了一道口子，边缘往外翻着——像是被人从里面抓破的。\n你咬咬牙，把手伸了进去。里面又冷又湿……指尖碰到了一个硬硬的东西。');
            await S.narr('是一把钥匙。牌子上写着：「三楼楼梯口」。');
            S.goal('打开通往三楼的铁栅栏');
            S.cp();
          } },
          { id: 'gakki', x: 13, y: 2, spr: 'gakki', async on(S) {
            if (S.once('p3')) await S.narr('乐器柜。竖笛、口风琴、响板……最上面一层，夹着一张发黄的油印纸。');
            await readNote(S, 'p3');
          } }
        ],
        async enter(S, first) {
          if (!first) return;
          await S.narr('音乐室里，墙上挂着一排音乐家的画像。\n你一进门，就觉得有好几双眼睛同时转了过来。');
          await S.wait(300);
          S.focus(1, 4);
          await S.narr('……然后，钢琴响了。');
          await playTune(S, [3, 3, 4, 5, 5, 4, 3, 2, 1, 1, 2, 3], 260);
          await S.wait(400);
          S.focus(null);
          await S.narr('弹到这里，琴声就停了。\n像是有人把手从琴键上拿开，等着谁接下去。');
          S.goal('钢琴在等人接着弹下去');
        }
      },
      /* ---------------- 三楼：走廊、仓库、空教室 ---------------- */
      hall3: {
        amb: 'drone', dark: .9, wall: 'wood', floor: 'wood', plr: 3.2,
        rows: [
          '##############################',
          '##############################',
          '#lllll#########..............#',
          '#lllll#########..............#',
          '#lllll#########..............#',
          '#lllll#########..............#',
          '#lllll#########..............#',
          '#lllll#########..............#',
          '###l#############.#########.##',
          '###l#############.#########.##',
          '#WWWWWWWWWWWWWWWWWWWWWWWWWWWW#',
          '#WWWWWWWWWWWWWWWWWWWWWWWWWWWW#',
          '#WWWWWWWWWWWWWWWWWWWWWWWWWWWW#',
          '##############################',
          '##############################'],
        ents: [
          { x: 1, y: 11, spr: 'stairsdown', solid: false, async touch(S) {
            if (S.f.seek) { await S.say('花子（远处）', '不——可——以——出去哦。只能在三楼找。', { style: 'whisper' }); S.pos(2, 11, 2); return; }
            await S.go('stairs', 8, 2, 0);
          } },
          { x: 2, y: 9, spr: 'exitsign', light: { r: 2.2, col: 'rgba(90,230,140,.12)' }, on: S => S.narr('应急灯牌上的小绿人，正朝楼梯的方向跑。') },
          { x: 5, y: 9, spr: 'window', on: S => S.narr('窗玻璃上，你的倒影后面站着一个娃娃头的小影子。\n你一回头——什么也没有。') },
          { id: 'lockD', x: 7, y: 10, spr: 'lockerS', on: S => look(S, '走廊上的扫除用具柜。门上贴着「扫除当番：四年二组」。', '你猛地拉开柜门——一把秃了毛的扫帚倒了出来，「啪」地砸在地上。') },
          { x: 8, y: 9, spr: 'door', col: '#3a4a6a', on: S => { S.sfx('locked'); return S.narr('男厕所。门把手上缠着铁丝，拧不动。'); } },
          { id: 'wc', x: 10, y: 9, spr: 'door', col: '#7a3a3a', to: ['toilet', 9, 6, 3] },
          { x: 11, y: 9, spr: 'plate', col: '#e8b0b8', on: S => S.narr('红色的门牌：「女子便所」。\n牌子下面，有人用指甲刻了三道很深的划痕。') },
          { id: 'lockC', x: 12, y: 10, spr: 'lockerS', on: S => spotOn(S, 'lockC', '扫除用具柜。铁门上凹进去一块，像是被谁从里面踢过。') },
          { id: 'bboard', x: 13, y: 9, spr: 'board', async on(S) {
            if (S.once('p4')) await S.narr('走廊的布告栏上，用图钉钉着最后一张油印纸。图钉锈得和纸长在了一起。');
            await readNote(S, 'p4');
          } },
          { x: 15, y: 9, spr: 'window', on: S => S.narr('教室的窗户。玻璃里面，课桌排得整整齐齐，好像明天还要上课。') },
          { x: 18, y: 9, spr: 'nameplate', on: S => S.narr('教室门牌：「三年一组」。\n……和鞋柜上那个空格子，是同一个班。') },
          { x: 22, y: 9, spr: 'window', on: S => S.narr('窗户里黑漆漆的。讲台那边，好像有什么东西反了一下光。') },
          { x: 24, y: 9, spr: 'hydrant', on: S => S.narr('消防栓的玻璃碎了，水管不见了。') },
          { x: 27, y: 12, spr: 'deadplant', on: S => S.narr('走廊尽头的盆栽早就枯了。花盆里插着一块小木牌：「花子的朝颜」。') },
          /* 仓库 */
          { x: 3, y: 1, spr: 'window', on: S => S.narr('仓库的小窗。外面的雪地上，人体模型的影子……\n不，那只是金次郎像。……应该是。') },
          { id: 'pileS', x: 1, y: 2, spr: 'pile', on: S => look(S, '堆到天花板的旧课桌椅，桌腿上缠着蜘蛛网。', '你扒开桌椅之间的缝往里看——只有一只死掉的飞蛾。') },
          { x: 5, y: 2, spr: 'box', on: S => S.narr('纸箱上写着「学艺会　道具」。里面是一只纸糊的狐狸面具，正对着你。') },
          { id: 'tobi', x: 2, y: 4, spr: 'tobibako', on: S => spotOn(S, 'tobi', '体育课用的跳箱，一共四层。最上面那层的帆布裂了口子。') },
          { id: 'mats', x: 5, y: 5, spr: 'crate', on: S => look(S, '卷起来的体操垫，散发着一股汗和霉混在一起的味道。', '你把体操垫一卷一卷地掀开——里面什么都没有。') },
          /* 空教室 */
          { id: 'curtL', x: 16, y: 1, spr: 'curtainL', on: S => look(S, '墨绿色的长窗帘，一直拖到地上。', '你一把掀开窗帘——窗玻璃上，只有你自己吓白了的脸。') },
          { x: 19, y: 1, spr: 'window', on: S => S.narr('窗外的雪下得更大了。') },
          { x: 21, y: 1, spr: 'blackboard', text: true, on: S => S.narr('黑板上画着一张相合伞，伞下写着两个名字，都被擦掉了。\n角落里有一行粉笔字：「もういいかい？」（好了吗？）') },
          { x: 24, y: 1, spr: 'window', on: S => S.narr('三楼最右边的窗户。从外面看到的那个晃动的窗帘，就在这一间。') },
          { id: 'curtR', x: 27, y: 1, spr: 'curtainL', on: S => spotOn(S, 'curtR', '墨绿色的长窗帘。风从窗缝里钻进来，窗帘一鼓一鼓的。') },
          { id: 'cab', x: 15, y: 2, spr: 'cabinet', col: '#6a5040', on: S => look(S, '放教具的柜子。里面有一个地球仪，日本那里被磨得发白。', '你拉开柜门——地球仪「咕噜」一声滚了出来。') },
          { id: 'pileC', x: 28, y: 2, spr: 'pile', on: S => look(S, '教室后面堆着几张多余的课桌。', '你钻到课桌底下看了看。只有一团灰尘。') },
          { id: 'kyotaku', x: 21, y: 3, spr: 'kyotaku', on: S => spotOn(S, 'kyotaku', '讲台。粉笔灰积了厚厚一层，上面印着一个小小的手印。') },
          ...[16, 18, 20, 22, 24, 26].map((x, i) => ({ x, y: 5, spr: 'schooldesk', on: S => S.narr(['桌面上刻着「バカ」。', '抽屉里有一块干成石头的面包。', '桌面上有一个用铅笔描了无数遍的名字：はなこ。', '课桌的抽屉里，整整齐齐地放着一本昭和二十年的算术课本。', '这张桌子上没有灰。一点也没有。', '椅子被拉开了，好像刚刚有人站起来。'][i]) })),
          ...[19, 21, 23, 25].map((x, i) => ({ x, y: 7, spr: 'schooldesk', on: S => S.narr(['空课桌。', '桌面上画着一个小小的相合伞。', '抽屉里塞满了没交的作业。', '桌子底下有一串湿脚印……是你自己的。'][i]) })),
          /* 捉迷藏与追逐 */
          { id: 'tie', x: 0, y: 0, spr: 'hairtie', solid: false, hidden: true, on: S => S.narr('一根湿漉漉的红发绳，打着小小的蝴蝶结。\n' + (S.f.hk ? SPOTS[S.f.hk].hint : '')) },
          ...Array.from({ length: 30 }, (_, i) => ({ id: 'fp' + i, x: 0, y: 0, spr: 'footprints', decal: true, hidden: true, col: 'rgba(150,185,210,.6)' })),
          { id: 'hanakoH', x: 0, y: 0, spr: '@hanako', hidden: true, solid: false, z: 1 },
          { id: 'misaki3', x: 0, y: 0, spr: '@misaki', hidden: true },
          { id: 'model3', x: 27, y: 11, spr: '@jinbo', hidden: true, solid: false }
        ],
        async enter(S, first) {
          if (S.f.phase === 'chase') { chaseSetup(S); S.cp('chase'); return; }
          if (!first) return;
          await S.narr('三楼。这里比楼下还要冷，冷得连呼出来的气都是白的。\n走廊尽头传来滴水的声音。滴答。滴答。');
          S.focus(10, 9);
          await S.narr('女厕所的门，开着一条缝。');
          S.focus(null);
          S.goal('去三楼的女厕所');
          S.cp();
        },
        tick(S, dt) {
          if (!S.f.seek || W.busy || S.map !== 'hall3') return;
          S.f._gg = (S.f._gg ?? 3) - dt;
          if (S.f._gg > 0) return;
          const [tx, ty] = SPOTS[S.f.hk].ht, d = Math.abs(S.pl.x - tx) + Math.abs(S.pl.y - ty);
          S.sfx('giggle');
          if (d <= 4) S.toast('（很近的地方，有人在捂着嘴偷笑）');
          S.f._gg = d <= 4 ? 3 : d <= 9 ? 6 : 10;
        }
      },
      /* ---------------- 三楼女厕所 ---------------- */
      toilet: {
        amb: 'room', dark: .9, wall: 'tile', floor: 'tile', plr: 3, tileOpts: { tileC: '#9fb2a6' },
        wallC: { face: '#8fa49a', trim: '#4a5a52' },
        rows: [
          '############',
          '############',
          '#++++++++++#',
          '#++++++++++#',
          '#++++++++++#',
          '#++++++++++#',
          '#++++++++++#',
          '#########+##',
          '############'],
        ents: [
          { x: 9, y: 7, spr: 'invisible', async touch(S) { await S.go('hall3', 10, 10, 0); } },
          { x: 1, y: 1, spr: 'window', on: S => S.narr('磨砂玻璃的小窗。窗外，雪片无声无息地往下落。') },
          { id: 'st4', x: 2, y: 2, spr: 'stall', num: true, on: S => S.narr(S.f.seek ? '花子说过，她不会藏在厕所里。' : '第四间。门上的漆剥得一块一块的，门锁是坏的。\n里面的马桶盖合着。……还是不要打开了。') },
          { id: 'st3', x: 3, y: 2, spr: 'stall', num: true, on: S => stall3(S) },
          { id: 'st2', x: 4, y: 2, spr: 'stall', num: true, on: S => S.narr(S.f.seek ? '花子说过，她不会藏在厕所里。' : '第二间。门上用铅笔写满了「正」字，像是有人在数日子。') },
          { id: 'st1', x: 5, y: 2, spr: 'stall', num: true, on: S => S.narr(S.f.seek ? '花子说过，她不会藏在厕所里。' : '第一间。里面堆满了扫除用的水桶和拖把。\n离门口最近的一间。……那么从门口数，第三间是——') },
          { x: 7, y: 1, spr: 'mirror', frame: '#9a9a90', on: S => S.narr('洗手池边上的镜子。镜子里，你身后那排隔间的门全都关着。\n……第三间的门缝底下，是黑的。') },
          { x: 8, y: 2, spr: 'sink', on: S => { S.sfx('drip'); return S.narr('水龙头拧不紧，一滴，一滴。'); } },
          { x: 9, y: 2, spr: 'sink', on: S => S.narr('洗手池里放着一块小小的、用旧了的红色肥皂。') },
          { x: 10, y: 5, spr: 'lockerS', on: S => S.narr('扫除用具柜。门上贴着一张纸：「女子トイレ清扫：三年一组」。') },
          { id: 'puddle', x: 3, y: 3, spr: 'puddle', decal: true, solid: false },
          { id: 'dareP', x: 2, y: 4, spr: 'paper', async on(S) { if (S.once('dare')) await S.narr('地上躺着一张被水泡软了的纸。是大辅的字。'); await readNote(S, 'dare'); } },
          { id: 'hanakoT', x: 3, y: 2, spr: '@hanako', hidden: true, solid: false, z: 1, oy: 2, light: { r: 1.8, col: 'rgba(170,200,255,.16)' } }
        ],
        async enter(S, first) {
          if (!first) return;
          await S.narr('女厕所的瓷砖是淡绿色的，一块一块地裂着。\n四个隔间，门全都关着。从门口数过去，第三间的门底下，有一摊水正慢慢地往外渗。');
          S.goal('第三间：敲三下门');
        }
      },
      /* ---------------- 尾声：新校舍的厕所 ---------------- */
      shin: {
        amb: 'room', dark: .2, wall: 'tile', floor: 'tile', plr: 4, tileOpts: { tileC: '#dfe4e2' },
        rows: [
          '###########',
          '###########',
          '#+++++++++#',
          '#+++++++++#',
          '#+++++++++#',
          '#+++++++++#',
          '###########'],
        ents: [
          { x: 9, y: 1, spr: 'door', open: true, on: S => S.narr('门外传来上课铃声，还有孩子们乱哄哄的说话声。') },
          { x: 1, y: 1, spr: 'window', lit: true, on: S => S.narr('窗外是新的操场。樱花开了。\n金次郎像被搬到了新校门口，面朝着这扇窗户。') },
          { id: 'n3', x: 2, y: 2, spr: 'stall', num: true, col: '#e0e4ea', on: S => epilogue(S) },
          { x: 3, y: 2, spr: 'stall', num: true, col: '#e0e4ea', on: S => S.narr('第二间。崭新的门，还有一股油漆味。') },
          { x: 4, y: 2, spr: 'stall', num: true, col: '#e0e4ea', on: S => S.narr('第一间。干干净净的。') },
          { x: 5, y: 1, spr: 'mirror', frame: '#c8c8c0', on: S => S.narr('新镜子亮得能照出每一根头发。镜子里，只有你一个人。') },
          { x: 6, y: 2, spr: 'sink' }, { x: 7, y: 2, spr: 'sink' },
          { id: 'misakiN', x: 8, y: 4, spr: '@misaki', dir: 1, async on(S) { S.face('misakiN', 'pl'); await S.say('美咲', S.f.n3 ? '……走啦。我、我才没有害怕。' : '男生跑进女厕所干嘛啦！……我就是想确认一下，第三间。'); } }
        ],
        async enter(S) {
          await S.narr('四月。新校舍的三楼，女厕所。\n美咲拽着你的袖子，非要你陪她来看一眼。');
          await S.say('美咲', '……就看一眼。从门口数，第三间。');
          S.goal('第三间');
        }
      }
    }
  });

  /* ---------------- 剧情函数 ---------------- */
  async function sideDoor(S) {
    if (S.f.phase === 'chase') return S.narr('不能回去！');
    if (S.once('sideOpen')) {
      S.sfx('open');
      await S.narr(S.has('pin') ? '侧门的锁早就锈坏了，一推就开。\n你把美咲的发卡攥在手心里，跨了进去。' : '侧门的锁早就锈坏了，一推就开。\n门缝里吹出来的风，比外面的还冷。');
    }
    await S.go('hall1', 1, 3, 2);
  }
  async function portrait(S, name, desc) {
    if (S.f.solved) return S.narr(`${name}的画像。眼珠斜斜地，盯着屋角的大太鼓。`);
    await S.narr(`${name}。${desc}\n你往左走一步，他的眼珠往左转；往右走一步，又跟着往右转。`);
  }
  const NOTE = [0, 523.25, 587.33, 659.25, 698.46, 783.99, 880, 987.77];
  async function playTune(S, ns, gap) { for (const n of ns) { if (NOTE[n]) AU.tone('triangle', NOTE[n], NOTE[n], .5, .1); await S.wait(gap); } }
  async function pianoPuzzle(S) {
    if (S.f.solved) return S.narr('琴盖合上了。琴凳上，留着一个小小的、凹下去的坐痕。');
    const r = await S.ask('钢琴在等你接着弹下去。要弹吗？', ['弹', '不弹']); if (r) return;
    const v = await S.keypad('琴键上贴着褪色的数字贴纸：1=ド 2=レ 3=ミ 4=ファ 5=ソ……\n接着刚才那段，弹三个音：', ['1', '2', '3', '4', '5', '6', '7'], 3);
    if (v == null) return;
    await playTune(S, v.split('').map(Number), 300);
    if (v !== '322') {
      await S.narr('琴声在屋子里转了一圈，难听得像走了调的八音盒。\n墙上的画像，好像一起皱了皱眉头。');
      if (!S.f.score) await S.think('刚才弹的那段好耳熟……合唱会要唱的歌？黑板上好像抄着谱子。');
      return;
    }
    S.f.solved = true; S.ent('piano').power = false;
    await S.narr('你按下最后一个键。钢琴自己从头弹了起来——');
    await playTune(S, [3, 3, 4, 5, 5, 4, 3, 2, 1, 1, 2, 3, 3, 2, 2], 230);
    await S.narr('一整段《欢乐颂》，终于弹完了。\n……身后响起了噼里啪啦的掌声。很小很小的，只有一个人的掌声。');
    S.sfx('giggle');
    for (const id of ['cp1', 'cp2', 'cp3', 'cp4']) S.ent(id).s.fix = 1;
    await S.wait(400);
    await S.narr('你回过头。墙上所有的画像，眼珠都斜斜地转向了屋角——\n转向了那面大太鼓。');
    S.sfx('thud'); S.shake(300, 1);
    S.goal('看看大太鼓');
  }
  async function trap(S) {
    S.sfx('whisper'); S.dark(.99); S.plr(.5);
    await S.narr('脚底下软软地陷了一下——像是踩在了谁的手心上。');
    await S.fade(1, 600);
    S.pos(8, 15, 3); S.dark(null); plrBase(S);
    await S.fade(0, 600);
    await S.narr('……你又站在了楼梯的最底下。\n头顶上，台阶一级一级地往黑暗里伸，好像比刚才更长了。');
    S.goal(S.f.r_p3 ? '上楼（第十三级，不能踩）' : '这楼梯不对劲……音乐室的乐器柜里，那张旧报纸写过楼梯的事');
  }
  /* ---------------- 第三间 ---------------- */
  async function stall3(S) {
    const st = S.ent('st3');
    if (S.f.seek) return S.narr('花子说过，她不会藏在厕所里。');
    if (S.f.met) return S.narr('第三间的门半开着。马桶盖合着，盖子上湿了一片，是一个小小的屁股印。');
    if (!S.f.r_p4) await S.think('报纸社团的那些纸……三楼走廊的布告栏上，好像还钉着一张。');
    const r = await S.ask('第三间。门缝底下渗出来的水，冰得刺骨。', ['敲三下门', '……再等等']); if (r) return;
    S.amb('none');
    for (let i = 0; i < 3; i++) { S.sfx('knock'); await S.wait(520); }
    await S.wait(500);
    const q = await S.ask('该说什么？', ['「花子同学，你在吗？」', '「美咲！你在里面吗？」']);
    if (q === 1) {
      await S.say('你', '美咲！你在里面吗？');
      S.sfx('drip'); await S.wait(900);
      await S.narr('没有人回答。\n门里面，有个很小的声音，「咯」地笑了一下，就不响了。');
      await S.think('……规矩。肝试し要照规矩来。大辅的纸上是怎么写的？');
      S.amb('room'); return;
    }
    await S.say('你', '……花子同学，你在吗？');
    S.sfx('drip'); await S.wait(1400);
    await S.say('？？？', '……在——', { style: 'whisper' });
    S.sfx('open'); st.open = true; S.dark(.95);
    await S.wait(300);
    await S.walk('pl', 'd', 3); S.turn(3);
    await S.wait(300);
    S.show('hanakoT'); S.ent('hanakoT').alpha = 0; await S.alpha('hanakoT', 1, 900);
    S.f.met = true;
    await S.narr('门自己开了。\n马桶盖上，坐着一个留娃娃头的小女孩。白衬衫，红色的背带裙，光着的脚丫一晃一晃。\n她的裙角在滴水。');
    await S.say('花子', ['你好呀。', '你是来找那个扎两个小辫子的女孩子的吧？她说她「才不是胆小鬼」。', '……她敲门的声音，和你的一模一样。三下，轻轻的，手在抖。']);
    const r2 = await S.ask('「美咲在哪儿？」', ['把美咲还给我！', '……你是谁？']);
    if (r2 === 1) {
      await S.say('花子', ['我是花子呀。三年一组的花子。', '那天警报响了，老师说：「大家躲到厕所里去！」', '我们正在玩捉迷藏。我藏好了，一直、一直等着，等着谁来说「找到了」。', '……可是，谁也没有来。']);
      await S.narr('她低下头，用脚尖轻轻踢着水。\n滴答。滴答。');
    } else await S.say('花子', '还？她是自己来的呀。是她自己敲的门。');
    await S.say('花子', ['她陪我玩了好久。过家家、翻花绳……现在她累了，在睡觉。', '你也陪我玩一次吧。玩捉迷藏。', '我藏，你找。只能在三楼找，厕所里不算。', '在钟声响之前找到我，我就让她跟你回家。']);
    await S.say('花子', '找不到的话——你就留下来，陪我们一起玩。', { style: 'whisper' });
    await S.say('健太（你）', '……好。我会找到你的。');
    S.bubble('hanakoT', '♥', 900); S.sfx('giggle');
    await S.say('花子', '那你闭上眼睛，捂住耳朵，数到三十哦。不许偷看。');
    S.cp('seek');
    await startSeek(S);
  }
  async function startSeek(S) {
    if (S.map !== 'hall3') {
      if (S.map === 'toilet') { S.hide('hanakoT'); S.ent('st3').open = true; }
      await S.fade(1, 500);
      await S.narr('你捂住耳朵，把脸贴在冰凉的瓷砖墙上。\n一、二、三……\n\n光着的小脚丫，啪嗒、啪嗒，从你身后跑了出去。');
      S.dark(null, 'toilet');
      await S.go('hall3', 10, 10, 0);
    }
    const keys = Object.keys(SPOTS), k = keys[S.rand(keys.length)];
    S.f.hk = k;
    for (const kk of keys) S.ent(kk).s.peek = false;
    S.ent(k).s.peek = true;
    for (let i = 0; i < 30; i++) S.hide('fp' + i);
    SPOTS[k].path.forEach(([x, y], i) => S.place('fp' + i, x, y));
    S.place('tie', SPOTS[k].ht[0], SPOTS[k].ht[1]);
    S.f._gg = 4;
    await S.say('花子（远处）', 'もういいかい——？（好了吗——？）', { style: 'whisper' });
    await S.say('花子（远处）', '……もういいよ——！（好了哦——！）', { style: 'whisper' });
    S.f.seek = true;
    S.goal('在钟声响起前找到花子（湿脚印、红发绳、笑声）');
    S.timer(100, '捉迷藏', seekFail);
  }
  async function seekFail(S) {
    S.f.seek = false;
    S.amb('none');
    await S.bells(4, 700);
    await S.narr('钟声。\n……这栋楼里，明明早就没有钟了。');
    await S.wait(400);
    await S.say('花子', '时间——到——了。', { style: 'whisper' });
    S.sfx('giggle');
    await S.narr('一只湿淋淋的小手，从后面握住了你的手。\n冰的。');
    await S.scare('face', { spr: '@hanakoF' });
    S.sfx('water');
    await S.end({ bad: true, title: '你留下来陪她玩了', text: '第二天早上，大人们在三楼女厕所的第三间里，找到了美咲的另一只室内鞋。\n隔间的门从里面锁着，马桶里的水满满的，一动不动。\n\n樱丘小学的孩子们后来说，三楼的第三间里，现在住着三个人。\n敲门的时候，会有三个声音一起回答：「在——」' });
  }
  async function found(S, k) {
    S.clearTimer(); S.f.seek = false;
    S.ent(k).s.peek = false;
    S.sfx('sting');
    await S.narr(SPOTS[k].find);
    await S.scare('flash', { sfx: 'giggle', dur: .5 });
    bringMisaki(S, 'hanakoH'); S.follow('hanakoH', false); S.face('hanakoH', 'pl');
    await S.say('花子', ['……找——到——了。', '嘻嘻。被找到了。']);
    await S.say('花子', ['你知道吗？你是第一个。', '五十年了，第一个对我说「找到了」的人。']);
    await S.narr('她笑起来的样子，就是一个普通的、三年级的小女孩。');
    await S.say('花子', '约好了的。她还给你。');
    S.sfx('chime');
    bringMisaki(S, 'misaki3'); S.follow('misaki3', false); S.face('misaki3', 'pl');
    await S.narr('不知什么时候，美咲就站在你身后。浑身湿透了，光着一只脚，眼睛迷迷糊糊的。');
    await S.say('美咲', ['……健太？你怎么在这儿？', '我刚才……在跟一个女孩子玩翻花绳。她的手好凉……']);
    await S.say('你', '笨蛋！大家都吓死了！');
    await S.say('美咲', '才……才不是笨蛋。……对不起。');
    const r = await S.ask('花子歪着头看着你们。', ['「第七个不可思议，是什么？」', '「……谢谢你。」']);
    if (r === 0) await S.say('花子', ['知道了第七个的人，要留下来，陪我玩一辈子哦。', '……所以，不告诉你。']);
    else { await S.say('花子', '……嗯。'); S.bubble('hanakoH', '♥', 1200); }
    await S.wait(300);
    S.sfx('thud'); S.shake(500, 2);
    await S.narr('走廊尽头，「咚」的一声。\n像是什么很重的东西，从高处摔到了地板上。然后，是一下一下、拖着地的脚步声。');
    S.face('hanakoH', 2); S.bubble('hanakoH', '!', 900);
    await S.say('花子', ['是理科室的那个人。他一直想要一副完整的身体。', '你们快跑。别停下来，别回头。出了学校，他就追不上了。'], { style: 'whisper' });
    await S.say('花子', '……下次，再一起玩吧。', { style: 'whisper' });
    await S.alpha('hanakoH', 0, 700);
    S.place('kinjiro', 11, 9, 0); S.ent('kinjiro').s.look = true;
    S.f.phase = 'chase';
    S.amb('drone');
    S.goal('带着美咲逃出旧校舍！（侧门 → 操场 → 栅栏的破洞）');
    chaseSetup(S);
    S.cp('chase');
  }
  async function finale(S) {
    const m = S.ent('modelG'); S.stop('modelG');
    S.f.phase = 'done';
    await S.narr('你拽着美咲，从栅栏底下的破洞里一头钻了出去。');
    if (m && !m.hidden) { S.face('modelG', 0); await S.narr('回头一看——人体模型停在了操场的雪地上。\n它歪着那颗一半有皮、一半没皮的脑袋，看着你们，一动也不动。'); await S.alpha('modelG', 0, 900); }
    await S.narr('金次郎像站在操场正中间，书合着，面朝着校舍三楼的那扇窗户。\n……像是在替谁看着。');
    S.follow('misakiG', false);
    await S.say('美咲', ['……健太。那个女孩子说，她在等大家来找她。', '她说，好久好久以前，警报响的那天，大家都没有回来。']);
    await S.say('你', '……嗯。');
    await S.say('美咲', '我们下次……还是别再来了吧。');
    await S.fade(1, 1200);
    await S.card('1996年1月', '', '旧校舍拆掉了。\n推土机推倒三楼那面墙的时候，工人们说，\n听见里面有个小女孩在数数。\n\n一、二、三……\n一直数到了三十。');
    await S.go('shin', 5, 4, 3, { ms: 800 });
  }
  async function epilogue(S) {
    if (S.f.n3) return;
    S.f.n3 = true;
    await S.narr('崭新的白色隔间门。从门口数，第三间。\n门上，有人用红笔写了一行歪歪扭扭的小字：');
    await S.say('', '「下次，再一起玩吧。　はなこ」', { style: 'big' });
    await S.wait(500);
    await S.say('美咲', '……是谁写的呀。老师明明说，新校舍里没有花子的。');
    S.sfx('knock'); await S.wait(500); S.sfx('knock'); await S.wait(500); S.sfx('knock');
    await S.narr('门里面，有人轻轻地敲了三下。');
    await S.wait(600);
    S.sfx('giggle');
    await S.end({ title: '第三夜　完', text: '后来，樱丘小学的「七大不可思议」里，只剩下了六个。\n第七个，还是没有人知道。\n\n只是每年拆换隔间的门时，第三间的门背后，总能找到一根打着蝴蝶结的、湿漉漉的红发绳。' });
  }
})();
