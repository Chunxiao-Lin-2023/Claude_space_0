/* ================= 第一夜 · 血腥玛丽 ================= */
(() => {
  const MIR = { bath: ['bmirror', 'mary_b', [3, 3], 3], hall: ['hmirror', 'mary_h', [7, 2], 4], bedroom: ['vanity', 'mary_r', [1, 3], 4] };
  const caught = async S => {
    await S.scare('face', { spr: '@mary' });
    await S.die('冰冷的手指扣住了你的肩膀，把你往镜子里拖。\n镜子另一边，没有声音，也没有光。', '你被拖进了镜子');
  };
  function resetMary(S) {
    const c = MIR[S.map]; if (!c) return;
    const m = S.ent(c[1]); if (!m) return;
    S.stop(c[1]); m.hidden = true; m.alpha = 1; S.place(c[1], c[2][0], c[2][1], 0); m.hidden = true;
    S.f._sp = c[3];
  }
  async function cover(S, key) {
    const c = MIR[key];
    const it = ['sheet', 'towel1', 'towel2'].find(i => S.has(i));
    if (!it) { await S.narr('得找个东西把它盖上——毛巾、床单，什么都行！'); return; }
    S.take(it); S.sfx('tear');
    const mir = S.ent(c[0]); mir.covered = it === 'sheet' ? '#e09ab0' : '#e8e2d6';
    const mary = S.ent(c[1]);
    if (mary && !mary.hidden) { S.stop(c[1]); S.sfx('scream'); S.shake(500, 2); await S.alpha(c[1], 0, 500); }
    S.f['cov_' + key] = true;
    await S.narr(`你把${it === 'sheet' ? '床单' : '毛巾'}死死蒙在了镜子上。\n镜面后面，有什么东西撞了一下，然后安静了。`);
    if (S.f.cov_hall && S.f.cov_bedroom && !S.f.final) {
      S.f.final = true; await S.wait(500); S.sfx('knock'); await S.wait(350); S.sfx('knock'); await S.wait(350); S.sfx('knock');
      await S.narr('整栋房子忽然安静了。\n……浴室那边，传来一下一下敲玻璃的声音。');
      S.goal('回浴室');
    } else S.goal(S.f.cov_hall ? '盖住卧室的梳妆镜' : S.f.cov_bedroom ? '盖住走廊的镜子' : '盖住走廊和卧室的镜子');
    S.cp('hunt');
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
    items: {
      candle: { name: '白蜡烛', desc: '厨房抽屉里拿的普通白蜡烛。' },
      matches: { name: '火柴', desc: '壁炉台上的火柴，盒子里还剩三根。' },
      towel1: { name: '浴巾', desc: '厚厚的浴巾，可以用来盖住镜子。' },
      towel2: { name: '浴巾', desc: '另一条浴巾。' },
      sheet: { name: '粉色床单', desc: '从莉莉床上扯下来的床单。' }
    },
    notes: {
      rules: { title: '召唤血腥玛丽的规则', text: '（莉莉的字，写在作业本背面）\n\n1. 必须是午夜十二点整。\n2. 只能一个人进去。\n3. 关掉所有的灯，只点一根蜡烛。\n4. 看着镜子里自己的眼睛，念三遍：血腥玛丽。\n5. 不管看见什么，都不许跑！\n\n（下面是凯西歪歪扭扭的补充：\n如果她真的出来了，就赶快把镜子盖上！！！）' },
      clip: { title: '旧剪报 ·《枫溪日报》1963年12月', text: '昨夜一辆载有三名高中生的轿车在结冰的枫溪桥上打滑，冲破护栏翻入河中。三人均被路过的卡车司机救起。\n\n其中十六岁的玛丽·沃斯小姐面部被碎玻璃严重割伤，目前仍在县医院治疗。院方表示，她将留下永久性的疤痕……\n\n（剪报背面，有人用铅笔写了一行小字：可怜的玛丽。）' },
      card: { title: '旧万圣节明信片', text: '明信片上画着一个穿白睡裙的姑娘，一手举着蜡烛，一手拿着小镜子，倒退着走上楼梯。镜子里浮现出一个陌生男人的脸。\n\n印刷的小字写着：\n「万圣节之夜，倒退上楼，可在镜中窥见你未来的丈夫。若镜中出现的是一具骷髅——」\n\n后半句被人用墨水涂掉了。' },
      diary: { title: '撕下的日记页', text: '1964年3月2日\n\n他们又来了。十二点，在我窗户底下，一遍一遍地喊：\n血腥玛丽，血腥玛丽，血腥玛丽。\n\n妈妈把家里所有的镜子都收起来了，她以为我不知道为什么。\n\n我只想要一个人——就一个人——对我说：\n玛丽，我相信你。我相信你还是原来的你。' }
    },
    legend: '血腥玛丽（Bloody Mary）是英语世界最出名的「镜子召唤」游戏。常见的玩法是：关灯的浴室里点一根蜡烛，对着镜子念三遍（也有念十三遍、边念边转圈的）她的名字，镜中便会出现一个满脸是血的女人——她也许会抓伤你，把你拖进镜子，或者只是尖叫。\n\n它的前身是更古老的镜子占卜。十八、十九世纪的英美乡间流行在万圣节夜里举着蜡烛、倒退着走上楼梯，在镜中窥见未来丈夫的脸；若看见的是骷髅，就意味着出嫁前会死去。二十世纪初的万圣节明信片上常画着这一幕。\n\n至于「玛丽」是谁，说法很多：迫害新教徒的英格兰女王玛丽一世、被处死的女巫、车祸毁容的女孩……民俗学家珍妮特·兰格卢瓦在1970年代记录过美国孩子的一个版本，咒语是「玛丽·威尔斯，我相信你」。如今它主要流传在孩子们的过夜派对上，是一场测试胆量的小小成人礼。\n\n（本章中玛丽·沃斯的身世为游戏虚构。）',
    start: { map: 'bedroom', x: 5, y: 6, dir: 3 },
    resume: { hunt: async S => { resetMary(S); } },
    async intro(S) {
      await S.card('第一夜　血腥玛丽', '1994年10月31日　美国俄亥俄州　枫溪镇', '万圣节的过夜派对，总得来点刺激的。\n莉莉说，她奶奶家二楼那间浴室，\n是全镇最适合召唤玛丽的地方。');
    },
    tick(S, dt) {
      if (S.f.phase !== 'hunt' || W.busy) return;
      const c = MIR[S.map]; if (!c) return;
      const mir = S.ent(c[0]), mary = S.ent(c[1]);
      if (mir.covered || (S.map === 'bath' && S.f.final)) return;
      if (mary.hidden) { S.f._sp = (S.f._sp ?? c[3]) - dt; if (S.f._sp <= 0) { mary.hidden = false; mary.alpha = .05; S.sfx('whisper'); S.bubble(c[1], '…', 1500); } }
      else if (!mary.chase) { mary.alpha = Math.min(1, mary.alpha + dt * .6); if (mary.alpha >= 1) { S.sfx('sting'); S.chase(c[1], { spd: 2.9, catch: caught }); } }
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
            if (S.f.phase === 'hunt' && !S.ent('vanity').covered) return cover(S, 'bedroom');
            if (S.ent('vanity').covered) return S.narr('梳妆镜被床单蒙得严严实实。');
            await S.narr('莉莉的梳妆镜。镜框上贴满了亮晶晶的贴纸。\n镜子里，你身后的房间看起来比实际要深一点。');
          } },
          { id: 'wardrobe', x: 3, y: 2, spr: 'wardrobe', on: S => S.narr('衣柜里塞满了莉莉的衣服，还有一顶女巫帽。') },
          { x: 5, y: 1, spr: 'window', on: S => S.narr('窗外下着小雨。整条街的南瓜灯不知什么时候都灭了。') },
          { id: 'bed', x: 8, y: 2, h: 2, spr: 'bed', col: '#e09ab0', async on(S) {
            if (S.f.phase === 'hunt' && !S.f.gotSheet) { S.f.gotSheet = true; S.ent('bed').col = '#e8e2d6'; S.give('sheet'); return S.narr('你一把扯下了莉莉的床单。'); }
            await S.narr(S.f.gotSheet ? '光秃秃的床垫。' : '莉莉的床。粉色的床单上有股洗衣粉的香味。');
          } },
          { x: 10, y: 1, spr: 'door', to: ['hall', 3, 2, 0] },
          { x: 10, y: 7, spr: 'lamp', light: { r: 4.6, col: 'rgba(255,190,110,.16)' } },
          { x: 2, y: 6, h: 2, spr: 'futon', col: '#6a8ac0', on: S => S.narr('你的睡袋。还带着体温。') },
          { x: 8, y: 6, h: 2, spr: 'futon', col: '#7aa07a', on: S => S.narr('凯西的睡袋，拉链拉到了最顶上。') },
          { id: 'brush', x: 2, y: 3, spr: 'brush', hidden: true, solid: false, on: S => S.narr('莉莉的梳子掉在梳妆台前。梳齿上缠着几根长长的、黑色的头发。\n……莉莉是金头发。') },
          { id: 'lily', x: 4, y: 4, spr: '@lily', dir: 0, async on(S) {
            S.face('lily', 'pl');
            if (!S.f.dared) return;
            const lines = ['规则写在那张纸上了，自己看。', '怕啦？钟敲十二下之前都还来得及反悔哦。', '我奶奶睡觉可沉了，打雷都不醒。'];
            await S.say('莉莉', lines[(S.f._ly = ((S.f._ly ?? -1) + 1) % 3)]);
          } },
          { id: 'kathy', x: 6, y: 5, spr: '@kathy', dir: 1, async on(S) {
            S.face('kathy', 'pl');
            if (S.f.phase === 'hunt') {
              if (!S.ent('vanity').covered) { await S.say('凯西', '镜、镜子！别站在梳妆台前面——它就是从那里出来的！'); return; }
              if (S.once('kathyStory')) {
                await S.say('凯西', ['我看见了……你去浴室以后，莉莉坐在梳妆台前面梳头，说要等你回来吓你一跳。', '然后镜子里……镜子里的那个莉莉，没有跟着她动。', '它伸出手，抓住莉莉的头发，把她拉了进去。就像……就像把人拉进水里一样。']);
                await S.say('凯西', '艾米……莉莉还能回来吗？');
                return;
              }
              return S.say('凯西', '我不敢出去。你……你小心点。');
            }
            const lines = ['我听我哥说，玛丽以前真的住在这个镇上。', '你要是看见她了，千万别回头！', '……我们能不能就讲讲鬼故事算了。'];
            await S.say('凯西', lines[(S.f._ky = ((S.f._ky ?? -1) + 1) % 3)]);
          } },
          { x: 7, y: 4, spr: 'note', on: S => S.note('rules') },
          { id: 'mary_r', x: 1, y: 3, spr: '@mary', hidden: true, solid: false }
        ],
        async enter(S, first) {
          if (S.f.phase === 'hunt') { resetMary(S); if (!S.ent('vanity').covered) { S.sfx('heart'); await S.narr('梳妆镜里……有什么东西在动。'); } return; }
          if (!first) return;
          await S.say('莉莉', '好啦，故事讲完了。现在来点真的。');
          S.face('kathy', 'lily');
          await S.say('凯西', '……真的什么？');
          await S.say('莉莉', ['血腥玛丽。', '午夜十二点，一个人进浴室，关掉灯，点一根蜡烛，看着镜子念三遍她的名字。', '然后她就会从镜子里出来。有人说她会抓花你的脸，也有人说，她会把你拖进镜子里。']);
          await S.say('凯西', '我、我不玩！');
          S.face('lily', 'pl'); S.bubble('lily', '♥', 900);
          const r = await S.ask('「艾米，你敢不敢？」', ['……我敢。', '你自己怎么不去？'], '莉莉');
          if (r === 1) await S.say('莉莉', '我上回去过啦，什么都没看见。这次轮到你。');
          await S.say('莉莉', ['蜡烛在楼下厨房的抽屉里，火柴在壁炉台上。小声点，奶奶在楼下摇椅上睡着呢。', '走廊里那座老钟一敲十二下，你就进浴室。']);
          S.f.dared = true;
          S.goal('去楼下拿蜡烛和火柴');
        }
      },
      /* ---------------- 二楼走廊 ---------------- */
      hall: {
        amb: 'drone', dark: .86, wall: 'paper', floor: 'darkwood', plr: 3,
        rows: [
          '################',
          '################',
          '#..............#',
          '...............#',
          '#..............#',
          '################'],
        ents: [
          { x: 0, y: 3, spr: 'stairsdown', solid: false, to: ['down', 1, 2, 2] },
          { x: 3, y: 1, spr: 'door', to: ['bedroom', 10, 2, 0] },
          { x: 1, y: 2, spr: 'plant' },
          { x: 5, y: 1, spr: 'portrait', on: S => S.narr(S.f.phase === 'hunt' ? '画像里的老人……眼睛好像在跟着你转。' : '一幅很老的画像，画的是一个穿西装的老人。') },
          { id: 'hmirror', x: 7, y: 1, spr: 'mirror', frame: '#6a5a3a', async on(S) {
            if (S.f.phase === 'hunt' && !S.ent('hmirror').covered) return cover(S, 'hall');
            if (S.ent('hmirror').covered) return S.narr('毛巾下面的镜子，一动不动。');
            await S.narr('走廊里的穿衣镜。烛光不够，镜子里的走廊尽头是一团黑。');
          } },
          { id: 'clock', x: 10, y: 2, spr: 'clock', on: S => S.narr(S.f.phase === 'hunt' ? '钟摆停了。指针停在十二点零三分。' : S.f.midnight ? '十二点整。钟摆还在慢慢地晃。' : '一座老式落地钟。指针指着十一点五十二分。') },
          { id: 'linen', x: 12, y: 2, spr: 'linen', async on(S) {
            if (S.f.phase !== 'hunt') return S.narr('放毛巾和床单的柜子。\n……现在拿毛巾干嘛？');
            if (S.f.gotTowels) return S.narr('柜子里只剩几块擦脚布了。');
            S.f.gotTowels = true; S.ent('linen').open = true; S.give('towel1', true); S.give('towel2', true); S.sfx('item');
            S.toast('获得：浴巾 ×2');
            await S.narr('你拉开柜门，抱出了两条厚浴巾。');
          } },
          { x: 14, y: 1, spr: 'door', to: ['bath', 4, 5, 3], lock: S => S.f.midnight, lockMsg: '莉莉说，要等钟敲十二下。' },
          ...[[13, 3], [11, 3], [9, 3], [7, 3], [5, 2], [4, 2]].map(([x, y], i) => ({ id: 'fp' + i, x, y, spr: 'footprints', decal: true, hidden: true, col: 'rgba(140,165,190,.55)' })),
          { id: 'mary_h', x: 7, y: 2, spr: '@mary', hidden: true, solid: false }
        ],
        async enter(S, first) {
          if (S.f.phase === 'hunt') {
            resetMary(S);
            if (S.once('fpSeen')) { await S.narr('走廊的地板上有一串湿漉漉的脚印，从浴室一直延伸到卧室门口。\n……是光着的脚。'); S.goal('盖住走廊和卧室的镜子'); }
            return;
          }
          if (S.has('candle') && S.has('matches') && !S.f.midnight) {
            S.f.midnight = true;
            await S.wait(400); S.focus(10, 2);
            await S.narr('走廊尽头，那座老钟响了。');
            await S.bells(6, 520); await S.wait(300); await S.bells(6, 520);
            await S.narr('……十二下。');
            S.focus(null);
            S.sfx('open');
            await S.say('莉莉（门缝里）', '（小声）到点啦！快去！我们给你计时！');
            S.goal('一个人进浴室');
            S.cp();
          }
        }
      },
      /* ---------------- 浴室 ---------------- */
      bath: {
        amb: 'room', dark: .3, wall: 'tile', floor: 'tile', plr: 3,
        legend: { '+': 'tile' },
        rows: [
          '########',
          '########',
          '#++++++#',
          '#++++++#',
          '#++++++#',
          '#++++++#',
          '####+###'],
        ents: [
          { x: 4, y: 6, spr: 'invisible', to: ['hall', 14, 2, 0] },
          { x: 1, y: 2, spr: 'toilet' },
          { id: 'switch', x: 2, y: 1, spr: 'switch', async on(S) {
            if (S.f.ritual) { S.sfx('switch'); await S.wait(200); S.sfx('switch'); return S.narr('咔哒、咔哒。\n灯怎么也不亮了。'); }
            S.f.dark = !S.f.dark; S.sfx('switch'); S.ent('switch').off = S.f.dark;
            S.dark(S.f.dark ? .95 : null); S.plr(S.f.dark ? (S.f.lit ? 2.7 : 1.1) : null);
            if (S.f.dark && !S.f.lit) await S.narr('黑透了。只有门缝下透进来一线走廊的光。');
          } },
          { id: 'bmirror', x: 3, y: 1, h: 2, spr: 'mirror', frame: '#a8a8a0', on: S => mirrorBath(S) },
          { x: 3, y: 2, spr: 'sink' },
          { id: 'candle', x: 4, y: 2, spr: 'candle', hidden: true, light: { r: 3.2, col: 'rgba(255,170,80,.22)', flick: true } },
          { x: 5, y: 2, w: 2, spr: 'bathtub', on: S => S.narr(S.f.phase === 'hunt' ? '浴缸里积着一层浅浅的水。水面上漂着几根长头发。' : '老式的铸铁浴缸，边上的漆掉了好几块。') },
          { id: 'cab', x: 6, y: 5, spr: 'cabinet', col: '#d8d0bc', async on(S) {
            if (S.f.phase === 'hunt' && S.once('diary')) { await S.narr('柜子最底下压着一张发黄的纸，像是从日记本上撕下来的。'); return S.note('diary'); }
            await S.narr('洗漱柜。牙膏、梳子、奶奶的假牙杯。');
          } },
          { id: 'mary_b', x: 3, y: 3, spr: '@mary', hidden: true, solid: false },
          { id: 'lily_b', x: 4, y: 4, spr: '@lily', hidden: true, dir: 3 }
        ],
        async enter(S, first) {
          if (S.f.final) { resetMary(S); S.ent('bmirror').face = 'red'; S.dark(.95); S.plr(2.6); return; }
          if (S.f.phase === 'hunt') { resetMary(S); S.sfx('heart'); return; }
          if (first) await S.narr('浴室的瓷砖冰凉冰凉的。镜子上蒙着一层薄薄的水汽。');
          S.goal('关灯，点蜡烛，对着镜子念三遍');
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
          { id: 'dmirror', x: 3, y: 1, ox: 8, spr: 'mirror', covered: '#141014', on: S => S.narr(S.f.phase === 'hunt' ? '黑布还好好地蒙在上面。整栋房子里，只有这里让你觉得安全。' : '壁炉上方挂着一面大镜子，被一块黑布严严实实地蒙着。\n……为什么要把镜子蒙起来？') },
          { id: 'fire', x: 3, y: 2, w: 2, spr: 'fireplace', light: { r: 4.6, col: 'rgba(255,140,60,.25)', flick: true }, async on(S) {
            if (!S.has('matches') && !S.f.gotMatches) { S.f.gotMatches = true; S.give('matches'); return S.narr('壁炉里的火快熄了。壁炉台上放着一盒火柴，你把它揣进了口袋。'); }
            await S.narr('炭火发出轻轻的噼啪声。');
          } },
          { x: 5, y: 1, spr: 'wallclock' },
          { x: 6, y: 2, spr: 'tv', power: 'static', light: { r: 1.6, col: 'rgba(120,160,255,.12)' }, async on(S) { await S.narr('电视开着，没有声音。屏幕上只有雪花。'); } },
          { id: 'shelf', x: 7, y: 2, spr: 'bookshelf', async on(S) {
            if (S.once('clip')) await S.narr('书架上夹着一本旧剪贴簿。有一页贴着一张泛黄的剪报。');
            await S.note('clip');
          } },
          { x: 2, y: 4, w: 2, spr: 'lowtable' },
          { x: 3, y: 4, spr: 'paper', on: S => S.note('card') },
          { x: 5, y: 4, spr: 'armchair', col: '#5a3a3a' },
          { id: 'grandma', x: 5, y: 4, oy: -3, spr: '@grandma', dir: 0, async on(S) {
            if (S.f.phase === 'hunt') return grandmaStory(S);
            S.bubble('grandma', '…', 1500);
            await S.narr('奶奶在摇椅里睡着了，膝盖上还搭着没织完的毛线。');
            await S.say('奶奶（梦话）', '……别叫她的名字……把镜子……盖上……', { style: 'whisper' });
            S.f.heard = true;
          } },
          { x: 1, y: 6, w: 2, spr: 'sofa', col: '#4a3a5a' },
          { id: 'drawer', x: 10, y: 2, spr: 'counter', async on(S) {
            if (!S.f.gotCandle) { S.f.gotCandle = true; S.give('candle'); return S.narr('抽屉里躺着几根白蜡烛。你拿了一根。'); }
            await S.narr('剩下的蜡烛，还有一卷胶带。');
          } },
          { x: 11, y: 2, spr: 'counter' }, { x: 12, y: 2, spr: 'stove' }, { x: 13, y: 2, spr: 'sink' }, { x: 14, y: 2, spr: 'counter' },
          { x: 16, y: 2, spr: 'fridge', on: S => S.narr('冰箱门上贴着莉莉画的南瓜，和一张购物清单：牛奶、鸡蛋、新镜子(?)。') },
          { x: 12, y: 5, w: 2, spr: 'table2', col: '#7a5a3a' },
          { x: 15, y: 7, spr: 'lamp', light: { r: 3.5, col: 'rgba(255,190,110,.12)' } },
          { x: 6, y: 8, spr: 'invisible', solid: true, on: S => S.narr('前门从里面反锁了，钥匙不在锁上。\n门外，雨声越来越大。') }
        ],
        async enter(S, first) {
          if (S.f.phase === 'hunt') { S.ent('grandma').dir = 0; if (S.once('grandmaWake')) { S.bubble('grandma', '!', 1500); await S.say('奶奶', '……孩子？是你吗？过来，过来让奶奶看看。'); } return; }
          if (first) await S.narr('楼下很暗，只有壁炉里的一点余火。\n奶奶在摇椅上打着轻轻的呼噜。');
        },
        step(S) { if (S.has('candle') && S.has('matches') && !S.f.midnight && S.once('bothItems')) { S.goal('回到二楼走廊，等午夜'); } }
      }
    }
  });

  async function grandmaStory(S) {
    S.face('grandma', 'pl');
    if (S.f.phrase) { await S.say('奶奶', '去吧，孩子。把莉莉带回来。替我……跟她说声对不起。'); return; }
    await S.say('奶奶', '你们……叫了她的名字，是不是？莉莉呢？');
    await S.say('奶奶', ['玛丽·沃斯是我中学同学。一九六三年冬天，她坐的车翻进了枫溪，脸被玻璃划得不成样子。', '那以后，镇上的孩子管她叫「血腥玛丽」。他们半夜跑到她家窗户底下，对着玻璃一遍遍地喊她，拿她取乐。', '……我也去过一次。只有一次。', '第二年春天，她死在自己家的浴室里——就是楼上那一间。很多年以后，我们家买下了这栋房子。']);
    await S.say('奶奶', ['她要的从来不是吓人，孩子。', '她只是想有一个人，对她说一句——「玛丽，我相信你。」相信她还是原来那个女孩。', '四十年了，我每天晚上都把楼下的镜子蒙起来。我一直没有勇气，对她说这句话。']);
    S.f.phrase = true;
    S.goal(S.f.final ? '回浴室' : '盖住走廊和卧室的镜子');
    S.cp('hunt');
  }

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
      await S.narr('火柴「嚓」地一声亮了。你把蜡烛立在洗手池边上。\n烛光在镜子里摇晃，镜子里的浴室，比真的浴室要暗一些。');
      S.goal('对着镜子念三遍她的名字');
      return;
    }
    const r = await S.ask('烛光在镜子里一跳一跳的。要开始吗？', ['开始', '再等一会儿']); if (r) return;
    S.amb('none');
    await S.narr('你盯着镜子里自己的眼睛，深吸了一口气——');
    await S.say('你', '血腥玛丽。', { style: 'big' });
    S.sfx('drip'); await S.wait(1100);
    await S.narr('什么也没发生。水龙头滴下了一滴水。');
    await S.say('你', '……血腥玛丽。', { style: 'big' });
    S.sfx('whisper'); await S.wait(800);
    await S.narr('镜子里的你，眨了一下眼睛。\n……可你明明记得，自己没有眨眼。');
    const r2 = await S.ask('还要念第三遍吗？', ['念', '不念了']);
    if (r2) { S.amb('room'); await S.narr('你的手抖得厉害。再缓一缓……就缓一会儿。'); return; }
    await S.say('你', '血腥……玛丽。', { style: 'big' });
    S.dark(.985); S.plr(.8);
    await S.wait(1600);
    await S.narr('烛火忽然朝着镜子的方向，整个倒了过去。');
    await S.wait(400);
    mir.face = 'red';
    await S.scare('face', { spr: '@mary', dur: 1.1 });
    S.fx('blood'); S.hide('candle');
    await S.wait(900);
    S.sfx('scream');
    await S.say('凯西（远处）', '啊啊啊——莉莉！！莉莉！！');
    mir.face = null;
    S.f.phase = 'hunt'; S.f.ritual = true;
    S.hide('lily'); S.place('kathy', 10, 8, 1); S.show('brush'); S.ent('bed').col = '#e09ab0';
    for (let i = 0; i < 6; i++) S.show('fp' + i);
    await S.wait(500);
    S.show('candle'); S.ent('candle').light = { r: 3, col: 'rgba(80,120,255,.25)', flick: true };
    S.dark(.93); S.plr(2.8); S.amb('drone');
    await S.narr('黑暗里，蜡烛「噗」地一声自己燃了起来。\n火苗是蓝色的。');
    S.goal('镜子里有东西要出来了——快离开浴室！');
    resetMary(S); S.f._sp = 2.5;
    S.cp('hunt');
  }

  async function finale(S) {
    const mir = S.ent('bmirror');
    await S.narr('镜子里没有你的倒影。\n只有一个披着长发的女人，和她身后的——莉莉。');
    await S.say('莉莉（镜中）', '艾米！救我！这里好冷……她一直在哭，一直在哭……');
    const opts = ['用毛巾把镜子盖上'];
    if (S.f.phrase) opts.unshift('「玛丽·沃斯，我相信你。」');
    else opts.push('（我还不知道该怎么做……先离开）');
    const r = await S.ask('你要怎么做？', opts);
    const pick = opts[r];
    if (pick.startsWith('（')) { await S.narr('奶奶刚才说梦话的时候，提到过镜子……\n也许她知道些什么。'); S.goal('去楼下问问奶奶'); return; }
    if (pick.startsWith('用毛巾')) {
      S.sfx('tear'); mir.covered = '#e8e2d6';
      await S.narr('你闭上眼睛，把毛巾死死地按在镜面上。\n敲打声持续了一整夜，直到天亮才停下。');
      return S.end({ bad: true, title: '镜子再也没有掀开过', text: '莉莉的照片后来印在了寻人启事上，贴满了枫溪镇的电线杆。\n\n有人说，在镇上某些老房子的镜子里，偶尔还能看见两个女孩并排站着。\n一个在哭，一个在拍打玻璃。' });
    }
    await S.say('你', '玛丽·沃斯……我相信你。');
    S.sfx('chime'); mir.face = 'pale';
    await S.narr('镜子里的女人停住了。\n长发后面，露出一张年轻的、哭花了的脸。半边脸颊上，是一道很长很长的疤。');
    await S.say('玛丽', '……你说什么？', { style: 'whisper' });
    await S.say('你', '我相信你。你不是怪物。你只是……一直没有人听你说话。');
    await S.narr('她低下头，很久很久。\n然后，她轻轻地，把莉莉往外推了一把。');
    S.sfx('glass'); S.fx('flash'); S.shake(600, 3);
    mir.face = null; mir.cracked = true; S.show('lily_b'); S.ent('candle').light = { r: 3.4, col: 'rgba(255,170,80,.22)', flick: true };
    S.dark(.85); S.amb('room');
    await S.wait(700);
    S.face('lily_b', 'pl');
    await S.say('莉莉', '……她一直在哭。她说，她已经四十年没有照过镜子了。');
    await S.narr('镜子从中间裂开了一道缝。\n裂缝里，好像有人很轻很轻地说了一声——谢谢。');
    await S.fade(1, 1200);
    await S.card('第二天早上', '', '奶奶把楼上所有的镜子都换成了新的。\n只有浴室里那面裂开的，她留了下来，\n在镜框上贴了一张小纸条：\n\n「玛丽，我们相信你。」');
    await S.end({ title: '第一夜　完', text: '后来，枫溪镇的孩子们再在镜子前喊她的名字，什么也没有发生。\n\n……大概吧。' });
  }
})();
