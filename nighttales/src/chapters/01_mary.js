/* ================= 第一夜 · 血腥玛丽 ================= */
(() => {
  /* 每张有镜子的地图：[镜子id, 玛丽id, 出生格(镜子斜下方，不挡盖镜子的位置), 默认倒计时秒] */
  const MIR = { bath: ['bmirror', 'mary_b', [3, 4], 3], hall: ['hmirror', 'mary_h', [8, 3], 4], bedroom: ['vanity', 'mary_r', [2, 4], 4] };
  const MARYLIGHT = { r: 1.5, col: 'rgba(170,190,230,.2)', a: .55 };   // 她在黑暗里自带一圈惨白的光
  const KEYS = ['我', '玛', '血', '相', '沃', '王', '信', '丽', '腥', '你', '斯', '女'];
  const ANSWER = '玛丽沃斯我相信你';
  let tk = 0, hb = 0, dr = 0, lookT = 0;   // 主机本地的音效节拍（不进存档）

  const caught = async S => {
    await S.scare('face', { spr: '@mary' });
    await S.die('冰冷的手指扣住了你的肩膀，把你往镜子里拖。\n镜子另一边，没有声音，也没有光。', '你被拖进了镜子');
  };
  /* 进入地图时把玛丽收回镜子里；剩余倒计时按地图记住，出入门不重置 */
  function resetMary(S) {
    const c = MIR[S.map]; if (!c) return;
    const m = S.ent(c[1]); if (!m) return;
    S.stop(c[1]); S.place(c[1], c[2][0], c[2][1], 0); m.hidden = true; m.alpha = 1; m.solid = false;
    const mir = S.ent(c[0]); if (mir && !mir.covered) mir.face = null;
    const k = '_sp_' + S.map;
    if (S.f[k] == null) S.f[k] = c[3];
    else if (S.f[k] <= 0) S.f[k] = 1.2;   // 她已经出来过：回来时她来得更快
  }
  /* 在门口存检查点（玩家看不出瞬移），重来时不会站在玛丽脚下 */
  function cpAt(S, name, x, y, dir) {
    const p = S.pl, o = [p.x, p.y, p.dir];
    if (x != null) S.pos(x, y, dir ?? p.dir);
    S.cp(name);
    if (x != null) S.pos(o[0], o[1], o[2]);
  }
  function huntGoal(S) {
    const diary = S.f.phrase && !S.f.gotDiary;
    if (S.f.final) return S.goal(diary ? '回浴室——先找到柜子里的日记' : '回浴室');
    const m = S.f.cov_hall ? '盖住卧室的梳妆镜' : S.f.cov_bedroom ? '盖住走廊的镜子' : '盖住走廊和卧室的镜子';
    S.goal(diary ? m + '；去浴室柜里找日记' : m);
  }
  async function cover(S, key) {
    const c = MIR[key];
    const it = ['sheet', 'towel1', 'towel2'].find(i => S.has(i));
    if (!it) { await S.narr('得找个东西把它盖上——毛巾、床单，什么都行！'); return; }
    S.take(it); S.sfx('tear');
    const mir = S.ent(c[0]); mir.covered = it === 'sheet' ? '#e09ab0' : '#e8e2d6'; mir.face = null;
    if (key === 'bedroom') mir.s.lily = false;
    const mary = S.ent(c[1]);
    if (mary && !mary.hidden) { S.stop(c[1]); S.sfx('scream'); S.shake(500, 2); await S.alpha(c[1], 0, 500); }
    S.f['cov_' + key] = true;
    await S.narr(`你把${it === 'sheet' ? '床单' : '毛巾'}死死蒙在了镜子上。\n镜面后面，有什么东西撞了一下，然后安静了。`);
    S.after(2000, async S => { S.sfx('knock'); await S.wait(320); S.sfx('knock'); });   // 布后面又敲了两下
    if (S.f.cov_hall && S.f.cov_bedroom && !S.f.final) {
      S.f.final = true; await S.wait(500); S.sfx('knock'); await S.wait(350); S.sfx('knock'); await S.wait(350); S.sfx('knock');
      await S.narr('整栋房子忽然安静了。\n……浴室那边，传来一下一下敲玻璃的声音。');
    }
    huntGoal(S);
    if (key === 'hall') cpAt(S, 'hunt', 12, 3, 1); else cpAt(S, 'hunt', 10, 2, 0);
  }
  /* 双人时两人一起决定（不一致则由操作者拍板），单人时就是普通选择 */
  async function choose(S, q, opts, who) {
    if (!S.coop) return S.ask(q, opts, who);
    const r = await S.vote(q, opts, who);
    if (!r.agree) await S.narr('你们俩的意见不一样。\n……最后，还是站在镜子前的那个人做了决定。');
    return r.v;
  }

  defChapter({
    id: 'mary', n: 1, title: '血腥玛丽', sub: '午夜，浴室，一支蜡烛，对着镜子叫三遍她的名字。', origin: '英美都市传说', color: '#5a1a22',
    icon: '@mary', amb: 'room', floor: 'wood', dark: .7, plr: 3.2,
    people: {
      me: { skin: '#f1c9a5', hair: '#7a4a2a', hs: 'twin', top: '#6a8ac0', top2: '#e8e8f0', bottom: '#6a8ac0', shoes: '#e8e0d0' },
      lily: { skin: '#f3d0b0', hair: '#d8b860', hs: 'long', top: '#e09ab0', bottom: '#e09ab0', shoes: '#f0e0e0' },
      kathy: { skin: '#c99a78', hair: '#1e1a1a', hs: 'bob', top: '#7aa07a', bottom: '#7aa07a', shoes: '#e0e0e0' },
      grandma: { skin: '#e8c4a8', hair: '#c8c8c8', hs: 'bun', top: '#6a4a5a', bottom: '#4a3a44', skirt: true, shoes: '#3a2a2a' },
      mary: { key: 'mary-ghost', skin: '#cfc8d0', hair: '#120a0c', hs: 'long', cover: true, redEye: true, top: '#d8d0c8', ghost: true, extra(g, d, fr, G, R) { if (d === 0) { R(5, G.tT + 1, 1, 4, '#7a0a0a'); R(9, G.tT + 2, 1, 6, '#7a0a0a'); R(7, G.tB + 1, 1, 3, '#7a0a0a'); } } }
    },
    /* 惊吓大头像（32×32）：长发中分、惨白的脸、一道从额角斜到下巴的长疤、血泪、针尖似的红瞳孔、越张越大的嘴 */
    faces: {
      mary(R, a) {
        const H = '#1c1014', HL = '#4a3642', SK = '#e6ded8', SK2 = '#c4b8b2', SK3 = '#8e7f7b', K = '#3c1a1e', WH = '#f8f4ee', B = '#a00c14', BD = '#5a0408', M = '#140204';
        // 长发：大轮廓一直垂到画面底部，带几缕发亮的发丝
        R(10, 0, 12, 2, H); R(7, 2, 18, 3, H); R(5, 5, 22, 27, H); R(3, 13, 26, 19, H);
        R(8, 4, 1, 28, HL); R(23, 4, 1, 28, HL); R(5, 14, 1, 18, HL); R(26, 14, 1, 18, HL); R(13, 1, 2, 1, HL); R(17, 1, 2, 1, HL);
        // 瓜子脸 + 右侧阴影
        R(14, 5, 4, 1, SK); R(13, 6, 6, 1, SK); R(11, 7, 10, 1, SK); R(9, 8, 14, 12, SK); R(10, 20, 12, 3, SK); R(11, 23, 10, 2, SK); R(12, 25, 8, 1, SK); R(13, 26, 6, 1, SK);
        R(20, 8, 2, 13, SK2); R(19, 21, 2, 3, SK2); R(17, 24, 2, 2, SK2);
        // 中分，发丝垂在两颊，一缕压过额头
        R(9, 7, 2, 4, H); R(21, 7, 2, 4, H); R(9, 11, 1, 13, H); R(22, 11, 1, 13, H); R(15, 4, 2, 2, HL); R(13, 5, 1, 3, H); R(12, 7, 1, 3, H);
        // 眼睛：深眼窝、大眼白、针尖似的红瞳孔（先眯着，再猛地睁开）
        const w = a < .18 ? 1 : 3;
        R(10, 11, 5, 5, K); R(17, 11, 4, 5, K);
        R(11, 13 - (w >> 1), 3, w, WH); R(18, 13 - (w >> 1), 3, w, WH);
        R(12, 13, 1, 1, '#ff1010'); R(19, 13, 1, 1, '#ff1010');
        // 血泪
        R(12, 16, 1, 4 + Math.round(a * 4), B); R(19, 16, 1, 3 + Math.round(a * 3), B); R(11, 16, 1, 2, B);
        // 一道带缝线的长疤，从右额角一直划到下巴
        for (let y = 7; y < 26; y++) R(y < 16 ? 21 : 20, y, 1, 1, BD);
        for (const y of [9, 13, 17, 21]) R(y < 16 ? 20 : 19, y, 3, 1, '#2a0204');
        R(15, 17, 2, 1, SK3); R(14, 18, 1, 1, SK3); R(17, 18, 1, 1, SK3);
        // 嘴：越张越大
        const mh = 2 + Math.round(a * 3);
        R(13, 20, 6, mh, M); R(12, 21, 1, mh - 1, M); R(19, 21, 1, mh - 1, M);
        R(13, 20, 6, 1, '#d8cfc0'); R(15, 20, 1, 1, M); R(13, 20 + mh, 6, 1, BD); R(18, 21 + mh, 1, 3, B);
      },
      skull(R, a) {   // 倒退上楼时，小手镜里闪过的骷髅
        const F = '#8a6a2a', F2 = '#c9a35a', B = '#e8e2cc', B2 = '#b8b09a';
        R(9, 1, 14, 1, F); R(7, 2, 18, 2, F); R(6, 4, 20, 20, F); R(7, 24, 18, 2, F); R(9, 26, 14, 1, F); R(14, 27, 4, 5, F); R(15, 27, 1, 5, F2);
        R(8, 4, 16, 20, '#121a1e'); R(9, 3, 14, 1, '#121a1e'); R(9, 24, 14, 1, '#121a1e');
        R(8, 4, 16, 1, F2);
        const s = Math.round(a * 2);
        R(11, 6 - s, 10, 9, B); R(10, 8 - s, 12, 6, B); R(19, 7 - s, 2, 8, B2);
        R(12, 15 - s, 8, 4, B); R(13, 19 - s, 6, 2, B2);
        R(11, 10 - s, 4, 4, '#050505'); R(17, 10 - s, 4, 4, '#050505'); R(12, 11 - s, 1, 1, '#ff3030'); R(18, 11 - s, 1, 1, '#ff3030');
        R(15, 14 - s, 2, 2, '#050505');
        R(13, 17 - s, 6, 1, '#050505'); for (let i = 0; i < 4; i++) R(13 + i * 2, 16 - s, 1, 3, '#3a3428');
        R(10, 13 - s, 1, 2, B2); R(21, 13 - s, 1, 2, B2);
      }
    },
    items: {
      candle: { name: '白蜡烛', desc: '厨房抽屉里拿的普通白蜡烛。' },
      matches: { name: '火柴', desc: '壁炉台上的火柴，盒子里还剩三根。' },
      handmirror: { name: '小手镜', desc: '莉莉梳妆台抽屉里的带柄小镜子，背面镶着褪色的珐琅花。' },
      towel1: { name: '浴巾', desc: '厚厚的浴巾，可以用来盖住镜子。' },
      towel2: { name: '浴巾', desc: '另一条浴巾。' },
      sheet: { name: '粉色床单', desc: '从莉莉床上扯下来的床单。' }
    },
    notes: {
      rules: { title: '召唤血腥玛丽的规则', text: '（莉莉的字，写在作业本背面）\n\n1. 必须是午夜十二点整。\n2. 只能一个人进去。\n3. 关掉所有的灯，只点一根蜡烛。\n4. 看着镜子里自己的眼睛，念三遍：血腥玛丽。\n5. 不管看见什么，都不许跑！\n\n（下面是凯西歪歪扭扭的补充：\n如果她真的出来了，就赶快把镜子盖上！！！\n还有千万别回头！！）' },
      clip: { title: '旧剪报 ·《枫溪日报》1953年12月', text: '昨夜一辆载有三名高中生的轿车在结冰的枫溪桥上打滑，冲破护栏翻入河中。三人均被路过的卡车司机救起。\n\n其中十六岁的玛丽·沃斯小姐面部被碎玻璃严重割伤，目前仍在县医院治疗。院方表示，她将留下永久性的疤痕……\n\n（剪报背面，有人用铅笔写了一行小字：可怜的玛丽。）' },
      card: { title: '旧万圣节明信片', text: '明信片上画着一个穿白睡裙的姑娘，一手举着蜡烛，一手拿着小镜子，倒退着走上楼梯。镜子里浮现出一个陌生男人的脸。\n\n印刷的小字写着：\n「万圣节之夜，倒退上楼，可在镜中窥见你未来的丈夫。若镜中出现的是一具骷髅——」\n\n后半句被人用墨水涂掉了。' },
      card2: { title: '另一张万圣节明信片', text: '和楼下那张一模一样。这一张，没有被涂掉：\n\n「……若镜中出现的是一具骷髅——\n便是死神先你的新郎一步，来接你了。」\n\n背面用圆珠笔写着一行娟秀的小字：\n「1953年万圣节。我在镜子里看见它了。\n我谁也没告诉。——M.W.」' },
      yearbook: { title: '《枫溪中学校刊》1953年春季号', text: '合唱团的合影。第二排左起第三个女孩笑得眼睛弯弯的，照片底下印着：\n玛丽·沃斯（十年级）——「她一开口，整个音乐教室都亮了。」\n\n她旁边站着一个扎两根辫子的小个子女孩，被人用钢笔圈了起来，旁边写着一行小字：\n小艾琳——唱高音的时候像一只小麻雀。\n\n是玛丽的字。' },
      diary: { title: '撕下的日记页', text: '1954年3月2日\n\n他们又来了。十二点，在我窗户底下，一遍一遍地喊：\n血腥玛丽，血腥玛丽，血腥玛丽。\n\n妈妈把家里所有的镜子都收起来了，她以为我不知道为什么。\n\n我不想再听见那个名字。我有自己的名字。\n\n我只想要一个人——就一个人——对我说：\n玛丽，我相信你。我相信你还是原来的你。' }
    },
    legend: '血腥玛丽（Bloody Mary）是英语世界最出名的「镜子召唤」游戏。常见的玩法是：关灯的浴室里点一根蜡烛，对着镜子念三遍（也有念十三遍、边念边转圈的）她的名字，镜中便会出现一个满脸是血的女人——她也许会抓伤你，把你拖进镜子，或者只是尖叫。\n\n它的前身是更古老的镜子占卜。十八、十九世纪的英美乡间流行在万圣节夜里举着蜡烛、倒退着走上楼梯，在镜中窥见未来丈夫的脸；若看见的是骷髅，就意味着出嫁前会死去。二十世纪初的万圣节明信片上常画着这一幕。\n\n至于「玛丽」是谁，说法很多：有人说是迫害新教徒、一生求子不得的英格兰女王玛丽一世（于是有了对着镜子说「我偷了你的孩子」的玩法）；有人说是被处死的女巫；也有人说是车祸毁容的女孩。民俗学家珍妮特·兰格卢瓦在1970年代记录过美国孩子的一个版本，咒语是「玛丽·沃斯，我相信你」。如今它主要流传在孩子们的过夜派对上，是一场测试胆量的小小成人礼。\n\n（本章中玛丽·沃斯的身世、枫溪镇和奶奶艾琳均为游戏虚构。）',
    start: { map: 'bedroom', x: 5, y: 6, dir: 3 },
    resume: { hunt: async S => { for (const k in MIR) delete S.f['_sp_' + k]; resetMary(S); } },
    async intro(S) {
      await S.card('第一夜　血腥玛丽', '1994年10月31日　美国俄亥俄州　枫溪镇', '万圣节的过夜派对，总得来点刺激的。\n莉莉说，她奶奶家二楼那间浴室，\n是全镇最适合召唤玛丽的地方。');
    },
    tick(S, dt) {
      if (S.map === 'hall' && !S.f.ritual && !W.busy) { tk += dt; if (tk >= 1) { tk = 0; S.sfx('tick'); } }   // 午夜前走廊里一直有钟摆声
      if (S.f.phase !== 'hunt' || W.busy) return;
      const c = MIR[S.map]; if (!c) return;
      const mir = S.ent(c[0]), mary = S.ent(c[1]);
      if (mir.covered || (S.map === 'bath' && S.f.final)) return;
      const k = '_sp_' + S.map;
      if (mary.hidden) {
        S.f[k] = (S.f[k] ?? c[3]) - dt;
        if (S.f[k] < 1.5) { hb -= dt; if (hb <= 0) { hb = .6; S.sfx('heart'); } }
        if (S.f[k] <= 0) {
          mary.hidden = false; mary.alpha = .05; mir.face = 'pale'; S.sfx('whisper'); S.bubble(c[1], '…', 1500);
          if (S.map === 'hall' && S.f._lookHall !== S.f._vh) { S.f._lookHall = S.f._vh; S.focus(7, 2); lookT = .6; }   // 镜头一闪，指一下镜子的方向
        }
      } else if (!mary.chase) {
        mary.alpha = Math.min(1, mary.alpha + dt * .6);
        if (mary.alpha > .5 && mir.face === 'pale') mir.face = 'red';
        dr -= dt; if (dr <= 0) { dr = .5; S.sfx('drip'); }
        if (mary.alpha >= 1) { mir.face = null; S.sfx('sting'); S.chase(c[1], { spd: S.f.ran ? 3.2 : 2.9, catch: caught }); }
      } else { hb -= dt; if (hb <= 0) { hb = .8; S.sfx('heart'); } }
      if (lookT > 0) { lookT -= dt; if (lookT <= 0) S.focus(null); }
    },
    sprites: {
      candle(g, e, t, R) {   // 本章的蜡烛：仪式后火苗变蓝
        R(6, 7, 4, 7, '#e8e2cc'); R(6, 7, 1, 7, '#f6f0dc'); R(5, 13, 6, 2, '#8a7a5a');
        if (e.off) { R(7, 6, 2, 1, '#333'); return; }
        const f = Math.sin(t * 17 + e.x) > 0 ? 0 : 1;
        R(7, 3 + f, 2, 4 - f, e.blue ? '#5a8cff' : '#ffcf5a'); R(7, 5, 2, 2, e.blue ? '#d8ecff' : '#fff2b0'); R(8, 2 + f, 1, 1, e.blue ? '#2a44ff' : '#ff8a2a');
      },
      vanity(g, e, t, R) {   // 梳妆镜：布的颜色跟着盖上去的东西；镜子里能显出莉莉的倒影和玛丽的脸
        box(R, 1, -10, 14, 12, '#8a6a2a');
        if (e.covered) { const c = typeof e.covered === 'string' ? e.covered : '#d8d4ca'; R(1, -11, 14, 14, c); R(1, 1, 14, 2, shade(c, -.2)); R(4, -11, 1, 13, shade(c, -.1)); R(10, -11, 1, 13, shade(c, -.1)); }
        else {
          R(3, -8, 10, 8, '#4b5c6b'); R(4, -7, 2, 5, '#93a5b5');
          if (e.lily) { const sw = Math.sin(t * 2) > .6 ? 1 : 0; R(8, -7, 3, 1, '#d8b860'); R(8, -6, 3, 2, '#e8c8a8'); R(7, -6, 1, 4, '#d8b860'); R(11, -6, 1, 4, '#d8b860'); R(8, -4, 3, 4, '#e09ab0'); R(6 - sw, -5, 2, 1, '#e8c8a8'); }
          if (e.face) { const red = e.face === 'red'; R(6, -7, 4, 6, red ? '#a43030' : '#d5d0c8'); R(5, -8, 6, 2, '#151010'); R(5, -6, 1, 5, '#151010'); R(10, -6, 1, 5, '#151010'); R(7, -5, 1, 1, red ? '#ff3030' : '#111'); R(9, -5, 1, 1, red ? '#ff3030' : '#111'); }
        }
        box(R, 0, 2, 16, 12, '#6b4a30'); R(7, 6, 2, 1, '#c9a35a');
      },
      sbag(g, e, t, R) {   // 睡袋；e.kathy = 凯西缩在里面发抖
        const c = e.col || '#7aa07a'; R(1, 1, 14, 30, '#d8d2c2'); R(2, 2, 12, 6, '#eeeae0'); R(1, 9, 14, 22, c); R(1, 9, 14, 2, shade(c, .2));
        if (e.kathy) { const j = Math.sin(t * 38) > 0 ? 1 : 0; R(1 + j, 5, 14, 23, shade(c, -.45)); R(2 + j, 6, 12, 21, shade(c, .18)); R(3 + j, 7, 10, 3, shade(c, .4)); R(4 + j, 14, 8, 1, shade(c, -.3)); R(5 + j, 2, 6, 4, '#1e1a1a'); R(6 + j, 5, 4, 1, '#c99a78'); R(7 + j, 5, 1, 1, '#151010'); }
      },
      footprints(g, e, t, R) {   // 湿漉漉的光脚印（脚掌 + 脚趾）
        const c = e.col || 'rgba(90,120,150,.75)';
        const foot = (x, y, m) => { R(x, y, 1, 1, c); R(x + 2, y, 1, 1, c); R(x + (m ? 1 : 0), y + 2, 3, 1, c); R(x, y + 3, 4, 1, c); R(x + (m ? 0 : 1), y + 4, 3, 1, c); R(x + 1, y + 5, 2, 2, c); };
        foot(3, 2, 0); foot(9, 7, 1);
      },
      towelbar(g, e, t, R) { R(2, 5, 12, 1, '#b0b4b8'); R(2, 4, 1, 3, '#888'); R(13, 4, 1, 3, '#888'); },
      boardwin(g, e, t, R) { box(R, 4, 1, 8, 9, '#4a3a2a'); R(5, 2, 6, 7, '#0e1726'); R(3, 3, 10, 2, '#7a5a40'); R(3, 6, 10, 2, '#6a4a34'); R(4, 3, 1, 1, '#aaa'); R(11, 6, 1, 1, '#aaa'); },
      frames(g, e, t, R) { for (let i = 0; i < 3; i++) { box(R, 1 + i * 5, 2 + (i % 2), 4, 6, '#6a5030'); R(2 + i * 5, 3 + (i % 2), 2, 4, ['#8a8478', '#9a9488', '#7a7468'][i]); } },
      pbucket(g, e, t, R) { box(R, 3, 6, 10, 9, '#d8701a'); R(4, 7, 8, 1, '#f09a3a'); R(5, 9, 2, 2, '#2a1408'); R(9, 9, 2, 2, '#2a1408'); R(6, 12, 4, 1, '#2a1408'); R(3, 3, 10, 1, '#333'); },
      shutter(g, e, t, R) { box(R, 2, -10, 12, 25, '#5a6a5a'); for (let i = 0; i < 7; i++) R(3, -8 + i * 3, 10, 1, '#3a4a3a'); R(4, 4, 2, 1, '#c8c0a8'); R(7, 4, 1, 1, '#c8c0a8'); R(9, 4, 3, 1, '#c8c0a8'); R(5, 7, 5, 1, '#c8c0a8'); if (e.blood) { R(6, 5, 1, 6, '#6a0a0a'); R(10, 5, 1, 4, '#6a0a0a'); } },
      dressform(g, e, t, R) { R(7, 8, 2, 6, '#3a2a1a'); R(4, 13, 8, 2, '#3a2a1a'); R(4, -6, 8, 15, '#d8d0c0'); R(3, 2, 10, 7, '#d0c8b8'); R(5, -8, 6, 3, '#c8b8a0'); R(7, -11, 2, 3, '#3a2a1a'); if (e.turned) { R(7, -11, 2, 3, '#6a0a0a'); R(6, -6, 1, 1, '#151010'); R(9, -6, 1, 1, '#151010'); } },
      mirrorstack(g, e, t, R) { const j = e.rattle && Math.sin(t * 45) > .3 ? 1 : 0; box(R, 0 + j, -6, 9, 20, '#cfc8b8'); box(R, 5, -10, 11, 24, '#e0dacb'); R(5, 12, 2, 2, '#c9a35a'); R(13, -10, 2, 2, '#c9a35a'); R(8, -4, 6, 1, shade('#e0dacb', -.15)); R(2 + j, 0, 5, 1, shade('#cfc8b8', -.15)); },
      trunk(g, e, t, R) { box(R, 0, 3, 16, 11, '#5a3a24'); R(1, 4, 14, 2, '#6a4a30'); R(0, 7, 16, 1, '#3a2414'); R(7, 7, 2, 3, '#c9a35a'); R(2, 3, 1, 11, '#3a2414'); R(13, 3, 1, 11, '#3a2414'); },
      musicbox(g, e, t, R) { box(R, 1, 5, 14, 10, '#6a5032'); box(R, 4, 0, 8, 6, '#8a2a3a'); R(5, 1, 6, 1, '#c9a35a'); R(12, 2, 2, 1, '#c9a35a'); if (e.open) { R(4, -4, 8, 4, '#d8c8a0'); R(7, -3, 2, 2, '#e8e0f0'); } },
      roundwin(g, e, t, R) { R(4, 2, 8, 9, '#2a2016'); R(3, 4, 10, 5, '#2a2016'); R(5, 3, 6, 7, '#0e1726'); R(4, 5, 8, 3, '#0e1726'); R(7, 3, 2, 7, '#2a2016'); R(4, 6, 8, 1, '#2a2016'); R(5, 4, 1, 1, '#8a9ab0'); },
      web(g, e, t, R) { const c = 'rgba(210,210,215,.28)'; R(0, 0, 7, 1, c); R(0, 0, 1, 7, c); for (let i = 1; i < 6; i++) R(i, i, 1, 1, c); R(0, 4, 4, 1, c); R(4, 0, 1, 4, c); }
    },
    tiles: {
      atstair: { solid: false, paint(R, X, Y) { R(0, 0, 16, 16, '#1e140c'); R(2, 0, 12, 16, '#4a3424'); for (let i = 0; i < 2; i++) { R(2, i * 8, 12, 2, '#6e5038'); R(2, i * 8 + 7, 12, 1, '#20160e'); } if (hash(X, Y, 3) < .5) R(5, 4, 3, 1, '#3a281a'); } }
    },
    maps: {
      /* ---------------- 莉莉的卧室 ---------------- */
      bedroom: {
        amb: 'room', dark: .62, wall: 'paper', floor: 'wood',
        rows: [
          '############',
          '############',
          '#..........#',
          '#..........#',
          '#..rrrr....#',
          '#..rrrr....#',
          '#..........#',
          '#..........#',
          '#..........#',
          '############'],
        ents: [
          { id: 'vanity', x: 1, y: 2, spr: 'vanity', async on(S) {
            const v = S.ent('vanity');
            if (S.f.phase === 'hunt' && !v.covered) return cover(S, 'bedroom');
            if (v.covered) return S.narr('梳妆镜被粉色床单蒙得严严实实。\n床单底下，偶尔有一点点鼓起来，又瘪下去。');
            if (S.has('handmirror') || S.f.ritual) return S.narr('莉莉的梳妆镜。镜框上贴满了亮晶晶的贴纸。\n镜子里，你身后的房间看起来比实际要深一点。');
            await S.narr('莉莉的梳妆镜。镜框上贴满了亮晶晶的贴纸。\n抽屉半开着，里面躺着一面带柄的小手镜，背面镶着褪色的珐琅花。');
            const r = await S.ask(S.f._o_cardRead ? '你想起明信片上那个举着小镜子、倒退上楼的姑娘。' : '拿上小手镜吗？', ['拿着', '放回去']);
            if (r === 0) { S.give('handmirror'); await S.narr('你把小手镜揣进了睡衣口袋。镜面朝里。'); }
          } },
          { id: 'wardrobe', x: 3, y: 2, spr: 'wardrobe', on: S => S.narr(S.f.phase === 'hunt' ? '衣柜门留着一条缝。\n……你没敢凑过去看。' : '衣柜里塞满了莉莉的衣服，还有一顶尖尖的女巫帽——她今晚本来要扮女巫的。') },
          { id: 'bwin', x: 5, y: 1, spr: 'window', on: S => S.narr(S.ent('bwin').face ? '窗外有一张白白的脸，正贴着玻璃往里看——\n……这里是二楼。' : S.f.phase === 'hunt' ? '窗外的雨停了。玻璃上留着一个圆圆的印子，像是有人把额头贴在上面。\n……这里是二楼。' : '窗外下着小雨。整条街的南瓜灯不知什么时候都灭了。') },
          { x: 7, y: 1, spr: 'poster', col: '#d8b860', on: S => S.narr('墙上贴着新出的《狮子王》海报，边角用胶带粘了好几回。') },
          { id: 'bed', x: 8, y: 2, h: 2, spr: 'bed', col: '#e09ab0', async on(S) {
            if (S.f.phase === 'hunt' && !S.f.gotSheet) { S.f.gotSheet = true; S.ent('bed').col = '#e8e2d6'; S.give('sheet'); return S.narr('你一把扯下了莉莉的床单。\n床垫上还留着她躺过的凹痕。'); }
            await S.narr(S.f.gotSheet ? '光秃秃的床垫。' : S.f.phase === 'hunt' ? '莉莉的床。被子掀开着，好像她只是起来上了趟厕所。' : '莉莉的床。粉色的床单上有股洗衣粉的香味。');
          } },
          { x: 10, y: 1, spr: 'door', to: ['hall', 3, 2, 0] },
          { id: 'blamp', x: 10, y: 7, spr: 'lamp', light: { r: 4.6, col: 'rgba(255,190,110,.16)' }, on: S => S.narr(S.ent('blamp').off ? '你把开关按了好几下。\n台灯不亮了。灯泡是凉的，像是从来没亮过。' : '小台灯，灯罩上画着一圈星星。') },
          { x: 2, y: 6, h: 2, spr: 'futon', col: '#6a8ac0', on: S => S.narr(S.f.phase === 'hunt' ? '你的睡袋。\n……你现在一点也不想钻进去。' : '你的睡袋。还带着体温。') },
          { id: 'kbag', x: 8, y: 6, h: 2, spr: 'sbag', col: '#7aa07a', on: S => kathyBag(S) },
          { x: 4, y: 7, spr: 'pbucket', on: S => S.narr('南瓜桶里的糖被挑得只剩甘草糖了。\n凯西说，甘草糖是留给鬼吃的。') },
          { x: 6, y: 7, spr: 'flashlight', on: S => S.narr('一支手电筒。电池被莉莉抠掉了——\n她说：「这样才吓人。」') },
          { id: 'brush', x: 2, y: 3, spr: 'brush', hidden: true, solid: false, on: S => S.narr('莉莉的梳子掉在梳妆台前。梳齿上缠着几根长长的、黑色的头发。\n……莉莉是金头发。') },
          { id: 'lily', x: 4, y: 4, spr: '@lily', dir: 0, on: S => lilyTalk(S) },
          { id: 'kathy', x: 6, y: 5, spr: '@kathy', dir: 1, on: S => kathyTalk(S) },
          { x: 7, y: 4, spr: 'note', on: S => S.note('rules') },
          { id: 'mary_r', x: 2, y: 4, spr: '@mary', hidden: true, solid: false, light: MARYLIGHT }
        ],
        async enter(S, first) {
          if (S.f.phase === 'hunt') {
            resetMary(S);
            if (S.once('bedHunt')) {
              S.ent('bwin').face = true; S.after(6000, async S => { S.ent('bwin').face = false; });
              await S.narr('卧室里的台灯灭了。\n凯西的睡袋鼓成一团，在角落里发抖。');
            }
            if (!S.ent('vanity').covered) { S.sfx('heart'); await S.narr('梳妆镜里……有什么东西在动。'); }
            return;
          }
          if (!first) return;
          await S.say('莉莉', '好啦，故事讲完了。现在来点真的。');
          S.face('kathy', 'lily');
          await S.say('凯西', '……真的什么？');
          await S.say('莉莉', ['血腥玛丽。', '午夜十二点，一个人进浴室，关掉灯，点一根蜡烛，看着镜子念三遍她的名字。', '然后她就会从镜子里出来。有人说她会抓花你的脸，也有人说，她会把你拖进镜子里。']);
          await S.say('凯西', '我、我不玩！');
          S.face('lily', 'pl'); S.bubble('lily', '♥', 900);
          const r = await S.ask('「艾米，你敢不敢？」', ['……我敢。', '你自己怎么不去？'], '莉莉');
          if (r === 1) await S.say('莉莉', '我上回去过啦，什么都没看见。这次轮到你。');
          /* 睡衣派对上的「版本之争」 */
          await S.say('凯西', ['等等！你们都弄错了。', '我哥说，要念十三遍才行，还得边念边转圈！', '而且我哥说，玛丽以前真的住在这个镇上……就住在这条街上。']);
          S.face('lily', 'kathy');
          await S.say('莉莉', ['你哥上回还说学校地下室养着鳄鱼呢。', '那是小孩子玩的。真正的玛丽是英国的一个女王，烧死过好多好多人。', '她一辈子都想要个孩子，可就是生不出来。你要是对着镜子说「我偷了你的孩子」，她就会出来找你要。']);
          await S.say('凯西', '才不是！她是个女巫，被人吊死在枫溪桥边上那棵大树上！');
          await S.say('莉莉', '枫溪桥边上只有一个加油站。');
          await S.say('凯西', '那是后来才盖的！');
          S.face('lily', 'pl'); S.face('kathy', 'pl');
          const v = await S.ask('「艾米，你听过的是哪个版本？」', ['要念十三遍，还得转圈。', '是那个女王。「我偷了你的孩子」。', '她是被吊死的女巫。'], '凯西');
          S.f.ver = ['spin', 'queen', 'witch'][v];
          if (v === 0) { await S.say('凯西', '看吧！我哥从来不骗人。'); await S.say('莉莉', '……行吧，你要是想转，就转。反正转晕了别怪我。'); }
          else if (v === 1) { await S.say('莉莉', '对吧！她找不到自己的孩子，就到镜子里去找别人家的。'); await S.say('凯西', '……我今晚不想听这个。'); }
          else { await S.say('凯西', '就是嘛！她们说，女巫死了以后，就住进了镜子里。'); await S.say('莉莉', '那她干嘛要住我奶奶家的镜子？'); await S.say('凯西', '……我怎么知道！'); }
          await S.say('莉莉', ['不管是谁，规矩都一样。', '蜡烛在楼下厨房的抽屉里，火柴在壁炉台上。小声点，奶奶在楼下摇椅上睡着呢。', '走廊里那座老钟一敲十二下，你就进浴室。']);
          S.f.dared = true;
          S.goal('去楼下拿蜡烛和火柴');
        }
      },
      /* ---------------- 二楼走廊 ---------------- */
      hall: {
        amb: 'drone', dark: .78, wall: 'paper', floor: 'darkwood', plr: 3,
        rows: [
          '################',
          '################',
          '...............#',
          '...............#',
          '#..............#',
          '################'],
        ents: [
          { x: 0, y: 2, spr: 'stairsup', solid: false, touch: S => atticStairs(S) },
          { x: 0, y: 3, spr: 'stairsdown', solid: false, to: ['down', 1, 2, 2] },
          { x: 1, y: 4, spr: 'plant', on: S => S.narr('一盆龟背竹。叶子上落了一层灰。') },
          { x: 3, y: 1, spr: 'door', to: ['bedroom', 10, 2, 0] },
          { id: 'portrait', x: 5, y: 1, spr: 'portrait', on: S => S.narr(S.f.phase === 'hunt' ? '画像里的老人……眼睛好像在跟着你转。\n眼珠是红的。' : '一幅很老的画像，画的是一个穿西装的老人。\n画框背面贴着一张小标签：「沃斯先生，1949」。') },
          { id: 'hmirror', x: 7, y: 1, spr: 'mirror', frame: '#6a5a3a', async on(S) {
            if (S.f.phase === 'hunt' && !S.ent('hmirror').covered) return cover(S, 'hall');
            if (S.ent('hmirror').covered) return S.narr('毛巾下面的镜子，一动不动。');
            await S.narr('走廊里的穿衣镜。镜子里的走廊尽头是一团黑。\n……镜子里的那座钟，指针好像比外面快了一点。');
          } },
          { id: 'hwin', x: 9, y: 1, spr: 'window', on: S => S.narr(S.f.phase === 'hunt' ? '窗玻璃上全是水汽。\n有人在上面，用手指写了一个字母：M。' : '走廊的窗户对着后院。雨把玻璃糊成了一片。') },
          { id: 'clock', x: 10, y: 2, spr: 'clock', on: S => S.narr(S.f.phase === 'hunt' ? '钟摆停了。指针停在十二点零三分。\n整条走廊安静得能听见你自己的心跳。' : S.f.midnight ? '十二点整。钟摆还在慢慢地晃。\n嘀嗒。嘀嗒。' : '一座老式落地钟，比你还高。指针指着十一点五十二分。\n嘀嗒。嘀嗒。') },
          { x: 11, y: 1, spr: 'frames', on: S => S.narr('一排全家福。最早的一张写着「1962 · 搬家」：\n年轻的奶奶抱着一个婴儿，站在这栋房子门口，笑得有点勉强。') },
          { id: 'linen', x: 12, y: 2, spr: 'linen', async on(S) {
            if (S.f.phase !== 'hunt') return S.narr('放毛巾和床单的柜子。\n……现在拿毛巾干嘛？');
            if (S.f.gotTowels) return S.narr('柜子里只剩几块擦脚布了。');
            S.f.gotTowels = true; S.ent('linen').open = true; S.give('towel1', true); S.give('towel2', true); S.sfx('item');
            S.toast('获得：浴巾 ×2');
            await S.narr('你拉开柜门，抱出了两条厚浴巾。');
          } },
          { x: 13, y: 4, spr: 'shoes', col: '#c8a8b8', on: S => S.narr(S.f.phase === 'hunt' ? '奶奶的毛绒拖鞋。\n……鞋尖原来是朝着浴室的吗？' : '奶奶的毛绒拖鞋，整整齐齐摆在走廊上。') },
          { x: 14, y: 1, spr: 'door', to: ['bath', 5, 6, 3], lock: S => S.f.midnight, lockMsg: '莉莉说，要等钟敲十二下。' },
          ...[[13, 2], [12, 3], [11, 3], [10, 3], [9, 3], [7, 3], [6, 3], [5, 2], [4, 2], [3, 2]].map(([x, y], i) => ({ id: 'fp' + i, x, y, spr: 'footprints', decal: true, hidden: true })),
          { id: 'mary_h', x: 8, y: 3, spr: '@mary', hidden: true, solid: false, light: MARYLIGHT }
        ],
        async enter(S, first) {
          S.f._vh = (S.f._vh || 0) + 1;
          if (S.f.phase === 'hunt') {
            resetMary(S);
            if (S.once('fpSeen')) { await S.narr('走廊的地板上有一串湿漉漉的脚印，从浴室一直延伸到卧室门口。\n……是光着的脚。'); huntGoal(S); }
            return;
          }
          if (first) await S.narr('走廊里黑漆漆的。尽头那座老钟在走：\n嘀嗒，嘀嗒。');
        },
        step(S, x) { if (x >= 4 && S.has('candle') && S.has('matches') && !S.f.midnight) return midnight(S); }
      },
      /* ---------------- 浴室 ---------------- */
      bath: {
        amb: 'room', dark: .3, wall: 'tile', floor: 'tile', plr: 3,
        legend: { '+': 'tile' },
        rows: [
          '##########',
          '##########',
          '#++++++++#',
          '#++++++++#',
          '#++++++++#',
          '#++++++++#',
          '#++++++++#',
          '#####+####'],
        ents: [
          { x: 5, y: 7, spr: 'invisible', touch: S => leaveBath(S) },
          { x: 1, y: 2, spr: 'toilet', on: S => S.narr(S.f.phase === 'hunt' ? '马桶盖盖着。\n……你不想掀开。' : '马桶盖上铺着一块毛线垫，是奶奶织的。') },
          { id: 'switch', x: 2, y: 1, spr: 'switch', async on(S) {
            if (S.f.ritual) { S.sfx('switch'); await S.wait(200); S.sfx('switch'); return S.narr('咔哒、咔哒。\n灯怎么也不亮了。'); }
            S.f.dark = !S.f.dark; S.sfx('switch'); S.ent('switch').off = S.f.dark;
            S.dark(S.f.dark ? .95 : null); S.plr(S.f.dark ? (S.f.lit ? 2.7 : 1.1) : null);
            if (S.f.dark && !S.f.lit) await S.narr('黑透了。只有门缝下透进来一线走廊的光。');
          } },
          { x: 3, y: 1, spr: 'boardwin', on: S => S.narr('浴室的小窗被两块木板钉死了。\n钉子是新的，木板却很旧。') },
          { id: 'bmirror', x: 4, y: 1, h: 2, spr: 'mirror', frame: '#a8a8a0', on: S => mirrorBath(S) },
          { x: 4, y: 2, spr: 'sink' },
          { id: 'candle', x: 5, y: 2, spr: 'candle', hidden: true, light: { r: 3.2, col: 'rgba(255,170,80,.22)', flick: true } },
          { x: 6, y: 1, spr: 'towelbar', on: S => S.narr('毛巾架上空空的。\n奶奶把浴巾都收进走廊的柜子里了。') },
          { x: 7, y: 2, w: 2, spr: 'bathtub', on: S => S.narr(S.f.phase === 'hunt' ? '浴缸里积着一层浅浅的水。水面上漂着几根长长的黑头发。' : '老式的铸铁浴缸，边上的漆掉了好几块。\n排水口那儿有一圈怎么也擦不掉的褐色印子。') },
          { id: 'cab', x: 8, y: 5, spr: 'cabinet', col: '#d8d0bc', async on(S) {
            if (S.f.phase === 'hunt' && !S.f.gotDiary) {
              S.f.gotDiary = true;
              await S.narr('你跪下来，使劲去抠柜子最底下那张纸——\n这一次，它一下子就松开了。像是有人在另一边，轻轻推了一把。');
              await S.note('diary');
              huntGoal(S);
              return;
            }
            if (S.f.gotDiary) return S.narr('洗漱柜。牙膏、梳子、奶奶的假牙杯。\n最底下空出了一道干净的印子。');
            await S.narr('洗漱柜。牙膏、梳子、奶奶的假牙杯。\n最底下好像压着一张纸，卡住了，怎么也抽不出来。');
          } },
          { x: 1, y: 6, spr: 'basket', on: S => S.narr('脏衣篓。最上面是莉莉的粉色睡袜。') },
          { id: 'mary_b', x: 3, y: 4, spr: '@mary', hidden: true, solid: false, light: MARYLIGHT },
          { id: 'lily_b', x: 5, y: 3, spr: '@lily', hidden: true, dir: 0 },
          { id: 'kathy_b', x: 5, y: 6, spr: '@kathy', hidden: true, dir: 3 },
          { id: 'grandma_b', x: 5, y: 7, spr: '@grandma', hidden: true, dir: 3 }
        ],
        async enter(S, first) {
          if (S.f.final) return stageFinal(S);
          if (S.f.phase === 'hunt') { resetMary(S); S.sfx('heart'); if (S.once('bathHunt')) await S.narr('蓝色的烛火还在洗手池边上烧着。\n镜子里，莉莉在拼命拍打玻璃。'); return; }
          if (first) await S.narr('浴室的瓷砖冰凉冰凉的。镜子上蒙着一层薄薄的水汽。');
        }
      },
      /* ---------------- 楼下客厅 ---------------- */
      down: {
        amb: 'fire', dark: .8, wall: 'wood', floor: 'wood', plr: 3,
        legend: { 'z': 'checker' },
        rows: [
          '##################',
          '##################',
          '.ccccccc..zzzzzzz#',
          '#ccccccc..zzzzzzz#',
          '#ccccccc..zzzzzzz#',
          '#ccccccc..zzzzzzz#',
          '#........zzzzzzzz#',
          '#................#',
          '######.###########'],
        tileOpts: { carpetC: '#4a2a2a' },
        ents: [
          { x: 0, y: 2, spr: 'stairsup', solid: false, to: ['hall', 1, 3, 2] },
          { x: 1, y: 1, spr: 'curtain', on: S => S.narr('厚窗帘拉得严严实实。') },
          { id: 'dmirror', x: 3, y: 1, ox: 8, spr: 'mirror', covered: '#141014' },
          { id: 'fire', x: 3, y: 2, w: 2, spr: 'fireplace', light: { r: 4.6, col: 'rgba(255,140,60,.25)', flick: true }, async on(S) {
            if (S.f.phase === 'hunt') return S.narr('炭火快熄了。你抬头看了一眼壁炉上方——\n黑布还好好地蒙在镜子上。整栋房子里，只有这里让你觉得安全。');
            if (!S.f.gotMatches) {
              S.f.gotMatches = true; S.give('matches');
              await S.narr('壁炉里的火快熄了。壁炉台上放着一盒火柴，你把它揣进了口袋。');
              return S.narr('你抬起头。壁炉上方挂着一面大镜子，被一块黑布严严实实地蒙着。\n……为什么要把镜子蒙起来？');
            }
            await S.narr('炭火发出轻轻的噼啪声。\n壁炉上方那面镜子，还蒙着黑布。');
          } },
          { x: 5, y: 1, spr: 'wallclock', on: S => S.narr(S.f.phase === 'hunt' ? '挂钟也停了。\n十二点零三分。' : '客厅的挂钟。十一点五十分——比楼上那座慢了两分钟。') },
          { x: 6, y: 2, spr: 'tv', power: 'static', light: { r: 1.6, col: 'rgba(120,160,255,.12)' }, on: S => S.narr(S.f.phase === 'hunt' ? '电视还开着。雪花里，好像有一张脸，一闪就没了。' : '电视开着，没有声音。屏幕上只有雪花。') },
          { id: 'shelf', x: 7, y: 2, spr: 'bookshelf', async on(S) {
            if (S.once('clip')) await S.narr('书架上夹着一本旧剪贴簿。有一页贴着一张泛黄的剪报。');
            await S.note('clip');
          } },
          { x: 8, y: 1, spr: 'poster', col: '#e8e0d0', on: S => S.narr('挂历翻到十月。31号那一格，奶奶用红笔写着：\n「莉莉来住 ♥」') },
          { id: 'bridgepic', x: 9, y: 1, spr: 'painting', col: '#4a5a6a', on: S => S.narr(S.f.phase === 'hunt' ? '画里的桥栏杆上……多了一个缺口。\n画框底下的墙纸，湿了一片。' : '一幅水彩画：冬天的枫溪桥。画得很用心，落款是一个小小的「E.」。') },
          { x: 2, y: 4, w: 2, spr: 'lowtable' },
          { x: 3, y: 4, spr: 'paper', async on(S) { S.f._o_cardRead = true; await S.note('card'); } },
          { x: 5, y: 4, spr: 'armchair', col: '#5a3a3a' },
          { id: 'grandma', x: 5, y: 4, oy: -3, spr: '@grandma', dir: 0, async on(S) {
            if (S.f.phase === 'hunt') return grandmaStory(S);
            S.bubble('grandma', '…', 1500);
            await S.narr('奶奶在摇椅里睡着了，膝盖上还搭着没织完的毛线。');
            await S.say('奶奶（梦话）', '……别叫她的名字……把镜子……盖上……', { style: 'whisper' });
            S.f.heard = true;
          } },
          { x: 1, y: 6, w: 2, spr: 'sofa', col: '#4a3a5a', on: S => S.narr('沙发上堆着三个人的外套，还有一个南瓜灯。\n灯里的蜡烛早就灭了。') },
          { id: 'drawer', x: 10, y: 2, spr: 'counter', async on(S) {
            if (!S.f.gotCandle) { S.f.gotCandle = true; S.give('candle'); return S.narr('抽屉里躺着几根白蜡烛。你拿了一根。'); }
            await S.narr('剩下的蜡烛，还有一卷胶带。');
          } },
          { x: 11, y: 2, spr: 'counter' },
          { x: 12, y: 2, spr: 'stove', on: S => S.narr('炉子上的水壶还温着。奶奶睡前给自己泡了杯茶。') },
          { x: 13, y: 2, spr: 'sink', on: S => S.narr('水池里泡着一只茶杯。\n水龙头没拧紧，一滴，一滴。') },
          { x: 14, y: 2, spr: 'counter' },
          { x: 16, y: 2, spr: 'fridge', on: S => S.narr('冰箱门上贴着莉莉画的南瓜，和一张购物清单：牛奶、鸡蛋、新镜子(?)。') },
          { x: 12, y: 5, w: 2, spr: 'table2', col: '#7a5a3a', on: S => S.narr('餐桌上已经摆好了明天早饭的盘子。\n一、二、三、四。') },
          { x: 16, y: 5, spr: 'phone', on: S => S.narr(S.f.phase === 'hunt' ? '你拿起听筒。\n没有拨号音。很远很远的地方，有个女孩在小声地数数。\n……你把听筒放了回去。' : '黑色的转盘电话。\n凯西说，要是待会儿吓坏了，就打电话叫她哥来接。') },
          { x: 15, y: 7, spr: 'lamp', light: { r: 3.5, col: 'rgba(255,190,110,.12)' } },
          { x: 6, y: 8, spr: 'invisible', solid: true, on: S => S.narr('前门从里面反锁了，钥匙不在锁上。\n门外，雨声越来越大。') }
        ],
        async enter(S, first) {
          if (S.f.phase === 'hunt') { S.ent('grandma').dir = 0; if (S.once('grandmaWake')) { S.bubble('grandma', '!', 1500); await S.say('奶奶', '……孩子？是你吗？过来，过来让奶奶看看。'); } return; }
          if (first) await S.narr('楼下很暗，只有壁炉里的一点余火。\n奶奶在摇椅上打着轻轻的呼噜。');
        },
        step(S) { if (S.has('candle') && S.has('matches') && !S.f.midnight && S.once('bothItems')) { S.goal('回到二楼走廊，等午夜'); } }
      },
      /* ---------------- 阁楼（玛丽一家留下的东西） ---------------- */
      attic: {
        amb: 'wind', dark: .86, wall: 'wood', floor: 'darkwood', plr: 2.8,
        legend: { 'S': 'atstair', 'W': 'darkwood' },
        rows: [
          '############',
          '############',
          '#WWWWWWWWWW#',
          '#WWWWWWWWWW#',
          '#WWWWWWWWWW#',
          '#WWWWWWWWWW#',
          '#WWWWWWWWWW#',
          '#####S######',
          '#####S######',
          '#####S######',
          '#####S######',
          '############'],
        ents: [
          { x: 5, y: 10, spr: 'invisible', touch: async S => { await S.go('hall', 1, 2, 2); } },
          { x: 1, y: 2, spr: 'web', decal: true }, { x: 10, y: 2, spr: 'web', decal: true, ox: 10 },
          { id: 'roundwin', x: 6, y: 1, spr: 'roundwin', on: S => S.narr('阁楼的圆窗正对着街。\n当年她卧室的窗户，就在这扇圆窗的正下方。\n那些孩子，大概就站在对面那盏路灯底下。') },
          { id: 'shutter', x: 1, y: 3, spr: 'shutter', on: S => S.narr(S.f.phase === 'hunt' ? '百叶窗的刻痕里，渗出了暗红色的水。\n一个字母，一个字母地往下淌。' : '一扇拆下来的旧百叶窗，靠在墙角。\n翻过来——外侧被小刀刻满了字母：\nBLOODY MARY。BLOODY MARY。BLOODY MARY。\n刻痕一道比一道深。') },
          { id: 'mstack', x: 9, y: 2, w: 2, spr: 'mirrorstack', async on(S) {
            if (S.f.phase === 'hunt') return S.narr('布底下，镜子在一下一下地磕碰。\n……你没敢碰它。');
            await S.narr(S.f.gotDiary ? '「妈妈把家里所有的镜子都收起来了。」\n——原来都收在这里。' : '十几面大大小小的镜子，背面朝外靠在一起，每一面都用布包得严严实实。\n……谁会把这么多镜子藏到阁楼上？');
            if (!S.once('peek')) return;
            const r = await S.ask('掀开一角看看？', ['掀开一角', '算了']);
            if (r) return;
            S.sfx('tear');
            await S.narr('镜子里，一排一模一样的你，一起看着你。');
            S.sfx('whisper');
            await S.narr('……最里面那个你，慢了半拍才眨眼。\n你飞快地把布放了下来。');
          } },
          { id: 'trunk', x: 3, y: 5, spr: 'trunk', async on(S) {
            if (S.once('trunk')) await S.narr('一只旧皮箱，铜扣上刻着 M.W.。\n上一户人家搬走的时候，把它留在了阁楼上。\n最上面压着一本校刊，翻到了合唱团那一页。');
            await S.note('yearbook');
          } },
          { id: 'dform', x: 8, y: 5, spr: 'dressform', on: S => S.narr(S.ent('dform').s.turned ? '人台的「脸」转过来了，正对着楼梯口。\n……它原来是朝着墙的。' : '裁缝用的人台，套着一条发黄的白睡裙，脸朝着墙。\n跟明信片上那个姑娘穿的，一模一样。') },
          { id: 'mbox', x: 10, y: 5, spr: 'musicbox', async on(S) {
            if (S.f.phase === 'hunt') return S.narr('八音盒的发条早就松了。\n可刚才在楼下，你好像听见它响过。');
            S.ent('mbox').open = true;
            await S.narr('一只红漆八音盒。你拧了两圈发条——');
            [330, 294, 262, 294, 330, 330, 330, 294, 294].forEach((f, i) => S.tone('triangle', f, f, .32, .09, i * .36));
            await S.wait(3400);
            S.ent('mbox').open = false;
            await S.narr('是《玛丽有只小羊羔》。\n转到一半，它自己停了。');
          } },
          { x: 1, y: 6, spr: 'box', on: S => S.narr('一箱圣诞彩灯，缠成了一团。') },
          { x: 2, y: 6, spr: 'crate', on: S => S.narr('一摞旧报纸。最上面一张的日期是1954年3月4日。\n讣告栏被人剪掉了。') },
          { x: 10, y: 6, spr: 'chair', col: '#4a3a2a', on: S => S.narr('一把断了腿的小椅子。椅背上刻着一个歪歪扭扭的「M」。') }
        ],
        async enter(S, first) {
          if (S.f._back) return;
          if (S.f.phase === 'hunt') {
            S.ent('mstack').s.rattle = true; S.ent('dform').s.turned = true; S.ent('shutter').blood = true;
            if (S.once('atticHunt')) await S.narr('阁楼里，那箱镜子在一下一下地磕碰。\n……那个人台，转过来了。');
            return;
          }
          if (first) await S.narr('阁楼又矮又闷，到处是灰。\n雨点打在屋顶上，像有很多人在上面走。');
        }
      }
    }
  });

  /* ---------------- 卧室对话 ---------------- */
  async function lilyTalk(S) {
    S.face('lily', 'pl');
    if (!S.f.dared) return;
    if (S.f.midnight) return S.say('莉莉', '快去呀！钟都敲完了！');
    const lines = ['规则写在那张纸上了，自己看。', '怕啦？钟敲十二下之前都还来得及反悔哦。', '我奶奶睡觉可沉了，打雷都不醒。', '奶奶把家里的镜子全换过了。就楼上浴室那面，她说什么也不让换。'];
    const i = (S.f._ly = ((S.f._ly ?? -1) + 1) % lines.length);
    await S.say('莉莉', lines[i]);
    if (i !== 1) return;
    const r = await S.ask('', ['才不怕。', '……要不，我不去了。']);
    if (r === 1) return regret(S);
    await S.say('莉莉', '这才对嘛。');
  }
  async function kathyTalk(S) {
    S.face('kathy', 'pl');
    if (!S.f.dared) return;
    if (S.f.midnight) return S.say('凯西', '……我不看。我捂着眼睛给你数。');
    const extra = { spin: '十三遍……转圈……我上回数到七就晕了。', queen: '女王才不会住在俄亥俄呢。……对吧？', witch: '女巫怕盐。我口袋里装了一小包，分你一半？' }[S.f.ver];
    const lines = ['我哥说，玛丽以前真的住在这个镇上。就住在这条街上。', '你要是看见她了，千万别回头！', '……我们能不能就讲讲鬼故事算了。'].concat(extra ? [extra] : []);
    await S.say('凯西', lines[(S.f._ky = ((S.f._ky ?? -1) + 1) % lines.length)]);
  }
  async function kathyBag(S) {
    if (!S.ent('kbag').s.kathy) return S.narr('凯西的睡袋，拉链拉到了最顶上。');
    S.bubble('kbag', '…', 900);
    if (!S.ent('vanity').covered) return S.say('凯西（睡袋里）', '镜、镜子！别站在梳妆台前面——它就是从那里出来的！');
    if (S.once('kathyStory')) {
      await S.say('凯西（睡袋里）', ['我看见了……你去浴室以后，莉莉坐在梳妆台前面梳头，说要等你回来吓你一跳。', '然后镜子里……镜子里的那个莉莉，没有跟着她动。', '它伸出手，抓住莉莉的头发，把她拉了进去。就像……就像把人拉进水里一样。']);
      await S.say('凯西（睡袋里）', ['艾米……莉莉还能回来吗？', '……莉莉的奶奶！楼下的镜子全蒙着布，她肯定知道什么！']);
      return;
    }
    return S.say('凯西（睡袋里）', '我不敢出去。你……你小心点。');
  }
  /* 分支①「反悔」：午夜前说不去了，莉莉自己去 */
  async function regret(S) {
    await S.say('莉莉', ['……真没劲。', '那我自己去。你们俩就在这儿等着，听我叫。']);
    S.face('kathy', 'lily');
    await S.say('凯西', '莉莉，别……');
    S.f.regret = true;
    await S.walk('lily', [10, 2], 3.5);
    S.sfx('open'); S.hide('lily'); await S.wait(300); S.sfx('close');
    await S.narr('你坐回睡袋上。凯西把那支没有电池的手电筒抱在怀里。');
    await S.wait(900);
    await S.narr('走廊尽头，钟响了。');
    await S.bells(6, 420); await S.wait(250); await S.bells(6, 420);
    S.amb('none');
    await S.wait(1500);
    await S.narr('……很安静。');
    await S.wait(1600);
    S.sfx('scream'); S.shake(700, 3); await S.scare('red');
    await S.say('凯西', '莉莉？……莉莉！！');
    await S.narr('你们冲进浴室的时候，蜡烛还在烧。火苗是蓝色的。\n镜子上有一个小小的手印——印在玻璃的里面。');
    await S.end({ bad: true, title: '替身', text: '莉莉再也没有回来。\n\n很多年以后，你还会梦见那个晚上：你说「我不去了」，\n钟敲到第十二下，镜子里有人轻轻地笑了一声——\n「那就换一个人来。」' });
  }

  /* ---------------- 午夜 ---------------- */
  async function midnight(S) {
    S.f.midnight = true;
    await S.wait(300); S.focus(10, 2);
    await S.narr('走廊尽头，那座老钟响了。');
    await S.bells(6, 520); await S.wait(300); await S.bells(6, 520);
    await S.narr('……十二下。');
    S.focus(null);
    S.sfx('open');
    if (S.coop) {
      await S.say('莉莉（门缝里）', ['（小声）到点啦！', '规则说只能一个人进去——另一个人留在浴室门口，给你数数！']);
      S.toast('双人：规则说只能一个人进去——商量好谁进浴室，按 T 交接操作');
    } else await S.say('莉莉（门缝里）', '（小声）到点啦！快去！我们给你计时！');
    S.goal('进浴室：关灯，点蜡烛，对着镜子念三遍');
    S.cp();
  }

  /* ---------------- 阁楼楼梯 / 倒退上楼的隐藏占卜 ---------------- */
  async function atticStairs(S) {
    if (!S.f.midnight && !S.f.backDone && S.has('handmirror') && S.has('candle') && S.has('matches')) {
      const r = await S.ask('通往阁楼的楼梯又窄又陡。\n你口袋里有蜡烛、火柴，还有那面小手镜。', ['直接上去', '（像明信片上那样）举着小镜子，倒退着上楼']);
      if (r === 1) return backStairs(S);
    }
    await S.go('attic', 5, 9, 3);
  }
  /* 倒退着走一级台阶：人朝下（面向镜头）往上退 */
  async function backStep(S) {
    const p = S.pl;
    await new Promise(res => { startMove(p, 3, 1.4, res); p.dir = 0; });   // 引擎的 S.walk 会把朝向改成行走方向，这里直接用 startMove 再扳回朝下
    p.fr = 0; S.pos(p.x, p.y, 0); S.sfx('step'); S.tone('sine', 120, 70, .35, .05, 0, 400);
  }
  async function backStairs(S) {
    S.f.backDone = true; S.f._back = true;
    await S.go('attic', 5, 10, 0);
    S.dark(.97); S.plr(1.3); S.amb('none');
    S.sfx('match'); await S.wait(400);
    await S.narr('你划着火柴点亮蜡烛，背对着楼梯站好。\n小镜子举在肩膀上——镜子里，是你身后黑洞洞的楼梯口。');
    await backStep(S); await S.narr('一级。');
    await backStep(S); await S.narr('两级。\n镜子里的楼梯，一级一级地往下退。');
    await backStep(S);
    await S.narr('烛火在镜子里拉得很长。\n镜子的边上……好像有什么东西，一闪就不见了。');
    await backStep(S); await S.wait(700);
    await S.scare('face', { face: 'skull', dur: 1.1, sfx: 'sting' });
    await S.narr('镜子里，你的肩膀后面——\n一张没有皮肉的脸，正贴着你的脸颊，和你一起往镜子里看。');
    S.turn(3); S.sfx('thud');
    await S.narr('你猛地回头。\n身后什么也没有。只有灰尘，和一屋子蒙着布的旧东西。');
    S.dark(null); S.plr(null); S.amb('wind'); S.f._back = false; S.f._v_attic = true;
    await S.narr('你吹灭了蜡烛。脚边的地板缝里，夹着一张和楼下一模一样的明信片。\n这一张，没有被涂掉。');
    await S.note('card2');
  }

  /* ---------------- 楼下：奶奶的往事 ---------------- */
  async function grandmaStory(S) {
    S.face('grandma', 'pl');
    if (S.f.phrase) {
      await S.say('奶奶', S.f.gotDiary ? ['去吧，孩子。把莉莉带回来。', '还有……替我跟她说声对不起。她以前叫我「小艾琳」。'] : ['那页日记……在楼上浴室的柜子底下。', '叫她的时候，叫她的全名。不是他们给她起的那个。']);
      return;
    }
    await S.say('奶奶', '你们……叫了她的名字，是不是？莉莉呢？');
    await S.say('奶奶', ['玛丽比我高一个年级。我们一起在合唱团唱歌，她总护着我，叫我「小艾琳」。', '一九五三年冬天，她坐的车翻进了枫溪，脸被玻璃划得不成样子。', '那以后，镇上的孩子管她叫「血腥玛丽」。他们半夜跑到她家窗户底下，对着玻璃一遍遍地喊她，拿她取乐。', '……我也去过一次。只有一次。她在窗帘后面，看见我了。', '第二年春天，她死在自己家的浴室里——就是楼上那一间。后来，我们家买下了这栋房子。']);
    const v = { spin: '什么念十三遍、转圈圈', queen: '什么偷孩子的女王', witch: '什么吊死的女巫' }[S.f.ver] || '什么女王、女巫';
    await S.say('奶奶', [`孩子们总爱瞎编，${v}……`, '她不是女王，也不是女巫。她就是个普通的姑娘，脸上多了一道疤。']);
    await S.say('奶奶', ['她要的从来不是吓人，孩子。', '她出事以后，一直想听一句话。一句很简单的话。', '……我知道是哪一句。可四十年了，我始终没说出口。', '我每天晚上都把楼下的镜子蒙起来。我怕她问我。']);
    await S.say('奶奶', ['她最后那几个月写了日记。我们搬进来那年，在楼上浴室的柜子底下找到过一页。我没敢扔，又塞回去了。', '叫她的时候，叫她的全名。不是他们给她起的那个外号。']);
    S.f.phrase = true;
    huntGoal(S);
    S.cp('hunt');
  }

  /* ---------------- 浴室：仪式 ---------------- */
  async function mirrorBath(S) {
    const mir = S.ent('bmirror');
    if (S.f.final) return finale(S);
    if (S.f.phase === 'hunt') { await S.narr('镜子里——是莉莉！她在里面拼命地拍打玻璃，可你什么也听不见。\n你不能把这面镜子盖上。'); return; }
    if (!S.f.dark) return S.narr('镜子里的你穿着睡衣，脸有点白。\n规则说，要先把灯关掉。');
    if (!S.f.lit) {
      if (!(S.has('candle') && S.has('matches'))) return S.narr('太黑了，什么也看不清。\n得先点上蜡烛。');
      const r = await S.ask('点燃蜡烛吗？', ['点燃', '再等等']); if (r) return;
      S.sfx('match'); await S.wait(500);
      S.f.lit = true; S.show('candle'); S.plr(2.7); S.take('candle');
      await S.narr('火柴「嚓」地一声亮了。你把蜡烛立在洗手池边上。\n烛光在镜子里摇晃，镜子里的浴室，比真的浴室要暗一些。\n……现在，念她的名字。');
      return;
    }
    if (!S.f.halfway) {
      const r = await S.ask('烛光在镜子里一跳一跳的。要开始吗？', ['开始', '再等一会儿']); if (r) return;
      S.amb('none');
      await S.narr('你盯着镜子里自己的眼睛，深吸了一口气——');
      await S.say('你', '血腥玛丽。', { style: 'big' });
      S.sfx('drip'); await S.wait(1100);
      await S.narr('什么也没发生。水龙头滴下了一滴水。');
      await S.say('你', '……血腥玛丽。', { style: 'big' });
      S.sfx('whisper'); await S.wait(800);
      await S.narr('镜子里的你，眨了一下眼睛。\n……可你明明记得，自己没有眨眼。');
      const vl = { spin: '你想起凯西说的：要转圈，念十三遍。\n你没有动。可镜子里的你，慢慢地，转过了半边身子。', queen: '镜子深处，有个女人很轻很轻地问：\n「……是你偷了我的孩子吗？」', witch: '镜子边上结出了一圈白霜。\n你闻到一股焦糊味，像是烧过的木头……又像是烧过的绳子。' }[S.f.ver];
      if (vl) { S.sfx('whisper'); await S.narr(vl); }
      await S.narr('身后……浴缸那边，「哗啦」响了一声水。');
      const lb = await S.ask('（凯西说过，千万别回头。）', ['回头看', '盯住镜子里自己的眼睛']);
      if (lb === 0) {
        S.f.lookedBack = true; S.turn(0); await S.wait(500);
        await S.narr('浴缸里什么都没有。水面平平的。');
        S.turn(3); S.sfx('sting'); S.fx('red');
        await S.narr('你转回来——\n镜子里的你，还背对着你。');
        await S.wait(600);
        await S.narr('……然后，它慢慢地转了回来，冲你笑了一下。');
      } else await S.narr('你没有回头。\n镜子里的你，也没有。');
      S.f.halfway = true;
    } else {
      const r = await S.ask('镜子里的你一直站在那儿，等着你。', ['念第三遍', '再等一会儿']); if (r) return;
      S.amb('none');
    }
    if (S.coop) { await S.narr('门外，有人用气声小声数着：「一……二……」'); await S.wait(3000); }
    const replay = store.get('done', []).includes('mary');
    const opts = ['念', '不念了'];
    if (replay) opts.push('（照凯西说的）转着圈，一直念到十三遍');
    const r2 = await choose(S, '还要念第三遍吗？', opts);
    if (r2 === 1) { S.amb('room'); await S.narr('你的手抖得厉害。再缓一缓……就缓一会儿。\n镜子里的你，没有跟着你发抖。'); return; }
    S.f.halfway = false;
    if (r2 === 2) {
      await S.narr('你闭上眼睛，一边转圈，一边念：');
      for (let i = 3; i <= 13; i++) { S.turn([0, 1, 3, 2][i % 4]); S.sfx('whisper'); await S.wait(260); }
      S.turn(3);
      await S.say('镜子', '……十三遍。从来没有人念完过。', { style: 'whisper' });
    } else await S.say('你', '血腥……玛丽。', { style: 'big' });
    S.dark(.985); S.plr(.8);
    await S.wait(1600);
    await S.say('镜子', '……血腥……玛丽。', { style: 'whisper' });   // 镜子的回声
    await S.narr('烛火忽然朝着镜子的方向，整个倒了过去。');
    await S.wait(400);
    mir.face = 'red';
    await S.scare('face', { spr: '@mary', dur: 1.1 });
    await S.scare('red', { dur: .9 });
    S.fx('blood'); S.hide('candle');
    await S.wait(900);
    await setHunt(S);
    S.show('candle');
    await S.narr('黑暗里，蜡烛「噗」地一声自己燃了起来。\n火苗是蓝色的。');
    S.goal('镜子里有东西要出来了——快离开浴室！');
    S.f._sp_bath = S.f.lookedBack ? 1.6 : 2.5; resetMary(S);
    cpAt(S, 'hunt', 5, 6, 3);
  }
  /* 仪式完成后：莉莉被拖进镜子，整栋房子变样 */
  async function setHunt(S) {
    S.sfx('scream');
    await S.say('凯西（远处）', '啊啊啊——莉莉！！莉莉！！');
    S.ent('bmirror').face = null;
    S.f.phase = 'hunt'; S.f.ritual = true;
    S.hide('lily'); S.hide('kathy'); S.ent('kbag').s.kathy = true; S.ent('kbag').col = '#4e6e4e';
    S.show('brush'); S.ent('bed').col = '#e09ab0';
    S.ent('blamp').off = true; S.dark(.88, 'bedroom'); S.ent('vanity').s.lily = true;
    S.ent('portrait').eyes = true;
    for (let i = 0; i < 10; i++) S.show('fp' + i);
    const c = S.ent('candle'); c.s.blue = true; c.off = false; c.light = { r: 3, col: 'rgba(80,120,255,.4)', flick: true };
    S.dark(.93, 'bath'); if (S.map === 'bath') S.plr(2.8); S.amb('drone');
  }
  /* 分支②「跑了」：念到第二遍就逃出浴室——镜子里的你替你念完第三遍 */
  async function leaveBath(S) {
    if (!S.f.halfway || S.f.ritual) return S.go('hall', 14, 2, 0);
    S.f.halfway = false; S.f.ran = true;
    S.dark(null, 'bath'); S.plr(null);
    await S.go('hall', 14, 2, 0);
    S.sfx('close'); S.shake(300, 2);
    await S.narr('你冲出浴室。背后的门「砰」地一声，自己关上了。');
    S.amb('none'); await S.wait(900);
    await S.say('门后（你的声音）', '……血腥……玛丽。', { style: 'whisper' });
    await S.narr('那是你的声音。\n镜子里的那个你，替你念完了第三遍。');
    await S.scare('face', { spr: '@mary', dur: 1 });
    await S.scare('red', { dur: .8 });
    await setHunt(S);
    S.show('candle');
    await S.narr('规则第五条：不管看见什么，都不许跑。\n……你跑了。');
    S.once('fpSeen');
    await S.narr('走廊的地板上，一串湿漉漉的光脚印，从浴室一直延伸到卧室门口。');
    resetMary(S);
    huntGoal(S);
    cpAt(S, 'hunt', 12, 3, 1);
  }

  /* ---------------- 结局 ---------------- */
  function stageFinal(S) {
    const mir = S.ent('bmirror'), m = S.ent('mary_b'), l = S.ent('lily_b');
    S.stop('mary_b'); S.place('mary_b', 4, 3, 0); m.alpha = .55; m.solid = true; m.on = finale;   // 「镜中人」站在玻璃前，面朝玩家
    S.place('lily_b', 5, 3, 0); l.alpha = .35;   // 镜中的莉莉：淡淡的倒影，脸朝外
    mir.face = null; S.dark(.95); S.plr(2.6);
    if (S.once('finalBath')) return S.narr('镜子前面……站着一个人。\n烛光穿过她的身体，照在镜子上。');
  }
  async function finale(S) {
    const mir = S.ent('bmirror');
    if (S.once('finaleSeen')) {
      await S.narr('镜子里没有你的倒影。\n只有一个披着长发的女人，和她身后的——莉莉。');
      await S.say('莉莉（镜中）', '艾米！救我！这里好冷……她一直在哭，一直在哭……');
    } else await S.narr('长发的女人一动不动地站着，等你开口。');
    const canSay = S.f.gotDiary || S.f.phrase;
    const opts = [];
    if (canSay) opts.push('对着镜子，说出她一直想听的那句话');
    opts.push('把镜子盖上，不管她');
    opts.push('（我还不知道该怎么做……先离开）');
    const pick = opts[await choose(S, S.coop ? '（和同伴商量好了吗？）你要怎么做？' : '你要怎么做？', opts)];
    if (pick.startsWith('（')) {
      await S.narr(S.f.heard ? '奶奶刚才说梦话的时候，提到过镜子……\n也许她知道些什么。' : '楼下的奶奶……客厅那面镜子为什么一直蒙着黑布？\n也许她知道些什么。');
      S.goal(S.f.phrase ? '去浴室柜里找日记' : '去楼下问问奶奶');
      return;
    }
    if (pick.startsWith('把镜子')) {
      S.sfx('tear'); mir.covered = '#e8e2d6'; await S.alpha('mary_b', 0, 400); S.hide('lily_b');
      await S.narr('你扯下浴帘，闭上眼睛，死死地按在镜面上。\n敲打声持续了一整夜，直到天亮才停下。');
      return S.end({ bad: true, title: '镜子再也没有掀开过', text: '莉莉的照片后来印在了寻人启事上，贴满了枫溪镇的电线杆。\n\n有人说，在镇上某些老房子的镜子里，偶尔还能看见两个女孩并排站着。\n一个在哭，一个在拍打玻璃。' });
    }
    const ans = await S.keypad('对着镜子，说出她一直想听的那句话（8 个字）', KEYS, 8);
    if (ans == null) { await S.narr('话到嘴边，你又咽了回去。'); return; }
    if (ans !== ANSWER) {
      S.f.wrong = (S.f.wrong || 0) + 1;
      S.ent('candle').off = true; S.sfx('glass'); S.shake(800, 4);
      await S.scare('glitch', { dur: .8 });
      const why = ans.includes('血腥') ? '「血腥」两个字刚出口，镜子就剧烈地震了起来。\n——那是他们给她起的外号。她最恨的，就是这个名字。'
        : ans.includes('女王') ? '镜子里的女人歪了歪头，好像听不懂你在说什么。\n她不是什么女王。'
        : !ans.includes('沃斯') ? '她没有反应。好像你叫的，根本不是她。'
        : '她抬起头看了你一眼，又慢慢低了下去。\n……不是这一句。';
      await S.narr(why);
      if (S.f.wrong >= 2) {
        await S.scare('face', { spr: '@mary', dur: 1.1 });
        return S.end({ bad: true, title: '镜子里的第三个人', text: '你又一次叫错了。\n镜子里的女人慢慢抬起头，长发后面，是一双再也不肯相信任何人的眼睛。\n\n第二天早上，奶奶在浴室里只找到一支烧完的蓝蜡烛。\n镜子里，并排站着三个人。' });
      }
      await S.wait(700);
      S.ent('candle').off = false; S.sfx('match');
      await S.narr('蜡烛「噗」地又亮了。\n镜子在发抖。你只剩一次机会了。');
      await S.think(S.f.phrase ? '奶奶说，要叫她的全名。不是那个外号。' : '她想听的那句话……会不会写在哪儿？');
      return;
    }
    await S.say('你', '玛丽·沃斯……我相信你。');
    S.sfx('chime'); mir.face = 'pale';
    await S.alpha('mary_b', .25, 1200);
    await S.narr('镜子前的女人停住了。\n长发慢慢分开，露出一张年轻的、哭花了的脸。半边脸颊上，是一道很长很长的疤。');
    await S.say('玛丽', '……你说什么？', { style: 'whisper' });
    await S.say('你', '我相信你。你不是怪物。你只是……一直没有人听你说话。');
    if (S.f.phrase) {
      await S.say('你', ['还有……楼下的奶奶。', '她说，那年冬天站在你窗户底下的人里，也有她。', '她说——对不起。']);
      await S.say('玛丽', '……小艾琳？', { style: 'whisper' });
      await S.narr('她笑了一下。很轻，像是很久没笑过，忘了该怎么笑。');
      await S.say('玛丽', '她还记得我。', { style: 'whisper' });
    }
    await S.narr('她低下头，很久很久。\n然后，她转过身，轻轻地把镜子里的莉莉往外推了一把。');
    S.sfx('glass'); S.fx('flash'); S.shake(600, 3);
    mir.face = null; mir.cracked = true;
    const c = S.ent('candle'); c.s.blue = false; c.light = { r: 3.4, col: 'rgba(255,170,80,.22)', flick: true };
    S.dark(.85); S.amb('room');
    await S.alpha('lily_b', 1, 500);
    await S.walk('lily_b', [5, 4], 2.4);
    S.face('lily_b', 'pl');
    await S.alpha('mary_b', 0, 1500);
    await S.say('莉莉', '……她一直在哭。她说，她已经四十年没有照过镜子了。');
    /* 尾声：凯西冲进来，奶奶站在门口 */
    S.sfx('open'); S.place('kathy_b', 5, 6, 3);
    await S.say('凯西', '莉莉！！');
    await S.walk('kathy_b', [5, 5], 5);
    S.bubble('kathy_b', '♥', 1600); S.bubble('lily_b', '♥', 1600);
    await S.narr('凯西扑过去，一把抱住了莉莉。两个人哭成了一团。');
    S.place('grandma_b', 5, 7, 3);
    await S.narr('楼梯吱呀作响。奶奶拄着拐杖，站在浴室门口。\n她看着那面裂开的镜子，看了很久。');
    await S.say('奶奶', '……玛丽。');
    await S.wait(700); S.sfx('chime');
    await S.say('镜子（裂缝里）', '……谢谢。', { style: 'whisper' });
    await S.fade(1, 1200);
    await S.card('第二天早上', '', '奶奶把楼上所有的镜子都换成了新的。\n只有浴室里那面裂开的，她留了下来，\n在镜框上贴了一张小纸条：\n\n「玛丽，我们相信你。」' + (S.f.ran ? '\n\n……只是每次你路过那面镜子，\n总觉得镜子里有人在看你。\n她记得那个逃跑的人。' : ''));
    await S.end({ title: '第一夜　完', text: '后来，枫溪镇的孩子们再在镜子前喊她的名字，什么也没有发生。\n\n……大概吧。' });
  }
})();
