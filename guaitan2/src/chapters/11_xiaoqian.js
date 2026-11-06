/* ================= 第十一夜 · 聂小倩 ================= */
(() => {
  /* ---------- 阶段 ----------
     a1 白天到寺、四处看 → a2 见过燕生、回屋 → n1 第一夜（窥北院、小倩、金子）→ n1g 金子在褥上
     d2 兰溪生死 → n2 夜巡东厢 → n2b 小倩自白 → d3 请燕生同住 → d3b 搬铺盖 → n3 剑匣之夜
     d4 燕生赠革囊 → dig 寺北找坟 → run0 抱骨回寺 → run 夜叉追 → ep 宁家 */
  const DIED = { n2: 0, n3: 0, run: 0 };      // 本局各段死过几次（只影响提示；新开一局清零，重来不清）
  const CH = { frz: 0, spawn: 0, slow: 0, near: 0, beat: 0, warnT: 0, snore: 0 };   // 追逐段的瞬时状态（不进存档，resume 里复位）
  const YC_SPD = 5.0, BAG_R = 2.6, FRZ_T = 2.2, WALK_K = .8;
  const POP = ['B', 'D', 'E'];                 // 三棵白杨（寺北荒坟），每局随机分配：乌巢 / 喜鹊窝 / 掉在地上的窝
  const POP_AT = { B: '北边偏西那棵', D: '东北角那棵', E: '西边坟堆中间那棵' };
  const ROLES = ['crow', 'magpie', 'fallen'];

  /* ---------- 音效（S.tone 合成，双方都听得到） ---------- */
  const bell = (S, v = .05, d = 0) => { S.tone('sine', 98, 96, 4.2, v, d, 900); S.tone('sine', 196, 193, 3, v * .5, d, 1200); S.tone('triangle', 293, 290, 2.2, v * .25, d + .02, 1500); };
  const crow = (S, n = 2, v = .035, d = 0) => { for (let i = 0; i < n; i++) S.tone('sawtooth', 760 - i * 40, 470, .2, v, d + i * .32, 1900); };
  const clink = (S, v = .05) => { S.tone('triangle', 2350, 2340, .14, v, 0); S.tone('triangle', 3120, 3100, .1, v * .6, .05); S.tone('triangle', 2350, 2340, .1, v * .4, .22); };
  const swordHum = (S, v = .06) => { S.tone('sine', 1500, 2900, .45, v, 0); S.tone('triangle', 760, 1450, .35, v * .6, .02, 3000); S.tone('sine', 2900, 2400, .7, v * .5, .45); };
  const snore = (S, v = .05) => { S.tone('sawtooth', 72, 58, 1.1, v, 0, 260); S.tone('sawtooth', 64, 80, .8, v * .7, 1.4, 260); };
  const thump = (S, v = .1) => { S.tone('sine', 92, 40, .5, v, 0); S.tone('square', 170, 60, .22, v * .45, 0, 700); };
  const hum = (S, v = .025) => [[523, 0], [587, 1], [659, 2], [587, 3.2], [523, 4], [440, 5], [523, 6.4]].forEach(([f, t]) => S.tone('triangle', f, f * .996, .7, v, t * .42, 2400));
  const knock = (S, n = 3) => { for (let i = 0; i < n; i++) S.tone('square', 140, 90, .07, .06, i * .3, 900); };

  const cycle = (S, key, lines) => lines[(S.f[key] = ((S.f[key] ?? -1) + 1) % lines.length)];
  const coopG = (S, solo, coop) => S.goal(S.coop ? coop : solo);

  /* ---------- 各张地图、各阶段的明暗 ---------- */
  function light(S) {
    const ph = S.f.ph, m = S.map;
    const T = {
      si: { a1: .3, a2: .55, d2: .12, d2b: .3, n2: .84, d3: .12, d3b: .14, d4: .18, run: .8 },
      fang: { a2: .58, n1: .62, n1g: .62, n2b: .7, d3: .2, d3b: .2, n3: .66, n3b: .66 },
      fen: { dig: .42, run0: .74 },
      jia: { ep: .22 }
    }[m];
    let v = T && T[ph] != null ? T[ph] : null;
    if (m === 'fen' && ph === 'dig') v = Math.min(.66, .42 + (S.f.wrong || 0) * .06);
    S.dark(v);
  }

  defChapter({
    id: 'xiaoqian', n: 11, title: '聂小倩', sub: '荒寺里的女子夜夜来找你。她送你金子，却求你带走她的骨头。', origin: '清·蒲松龄《聊斋志异》', color: '#2a3446',
    icon: '@qian', iconX: -4, amb: 'wind', floor: 'dirt', wall: 'red', dark: .3, plr: 3.4,
    people: {
      me: { key: 'xq-me', skin: '#eac39c', hair: '#1a1410', hs: 'bun', top: '#4e6478', top2: '#ddd8c8', bottom: '#34404e', robe: true, shoes: '#1a1a1a',
        extra(g, d, fr, G, R) { R(5, G.hT - 2, 6, 2, '#24242a'); if (d === 3) R(5, G.hT - 1, 6, 3, '#24242a'); } },   // 书生的方巾
      qian: { skin: '#f4e6e0', hair: '#0c0a0e', hs: 'long', top: '#e4e8f0', top2: '#b8c4d4', bottom: '#d0d8e6', robe: true, shoes: '#e8ecf2', blush: '#f0b8c0', mouth: '#c04858' },
      qianG: { skin: '#eef0f4', hair: '#0c0a0e', hs: 'long', top: '#dfe4ee', top2: '#b0bccc', bottom: '#c8d0de', robe: true, ghost: true, blush: '#e8c0c8', mouth: '#b04858' },
      laolao: { key: 'xq-lao', skin: '#d6b49a', hair: '#cfcac0', hs: 'bun', top: '#9a1a22', top2: '#5a0a0e', bottom: '#6a1016', robe: true, shoes: '#2a1010', eye: '#1a0a0a', mouth: '#5a2a2a',
        extra(g, d, fr, G, R) {
          R(4, G.hT - 2, 8, 2, '#dfe3e8'); R(5, G.hT - 3, 6, 1, '#b8bcc4'); for (let i = 0; i < 4; i++) R(5 + i * 2, G.hT, 1, 1, '#c8ccd4');   // 大银梳（蓬沓）
          if (d === 1) { R(10, G.tT - 1, 4, 5, '#9a1a22'); R(10, G.tT - 1, 4, 1, '#b02830'); R(1, G.tT + 5, 1, 11, '#5a4030'); }   // 驼背 + 拐杖
          else if (d === 0) R(13, G.tT + 3, 1, 13, '#5a4030');
          else if (d === 3) { R(4, G.tT - 1, 8, 3, '#b02830'); R(13, G.tT + 3, 1, 13, '#5a4030'); }
        } },
      fu: { skin: '#e8c8b0', hair: '#1a1412', hs: 'bun', top: '#5a4a6a', top2: '#d8ccd8', bottom: '#3a3048', skirt: true, shoes: '#2a2020' },
      yan: { key: 'xq-yan', skin: '#c48e64', hair: '#16110c', hs: 'messy', top: '#5a4a36', top2: '#2e2418', bottom: '#3a3024', robe: true, shoes: '#16120e',
        extra(g, d, fr, G, R) {
          R(3, G.hT + 1, 10, 1, '#7a2a1a');   // 头巾带
          if (d === 0) { R(5, G.hT + 7, 6, 3, '#16110c'); R(4, G.hT + 5, 1, 3, '#16110c'); R(11, G.hT + 5, 1, 3, '#16110c'); }
          else if (d === 1) R(3, G.hT + 6, 4, 3, '#16110c');
          else if (d === 3) { R(5, G.tT + 1, 6, 10, '#3a2a18'); R(5, G.tT + 1, 6, 1, '#6a4a28'); }   // 背上的箱箧
        } },
      lanxi: { skin: '#f0cca8', hair: '#1a1210', hs: 'bun', top: '#7a5a8a', top2: '#ece4d4', bottom: '#4a3a5a', robe: true, shoes: '#222', hat: 'cap', hatC: '#2a2a3a' },
      mu: { skin: '#e0c0a4', hair: '#b8b4ac', hs: 'bun', top: '#3a4a5a', top2: '#d8d4cc', bottom: '#2a3440', skirt: true, shoes: '#222' },
      pu: { skin: '#d4a882', hair: '#2a2420', hs: 'short', top: '#6a6050', bottom: '#3a3428', shoes: '#1a1a1a', hat: 'straw', hatC: '#a89060' },
      yao: { skin: '#f6ece8', hair: '#0a0808', hs: 'long', top: '#e8dce4', bottom: '#d8ccd8', robe: true, ghost: true },
      yecha: { key: 'xq-ycha', big: true, skin: '#2f5f6a', hair: '#b8241a', hs: 'messy', top: '#1a1a20', top2: '#3a1a14', bottom: '#24161a', shoes: '#101010', eye: '#fff27a', mouth: '#1a0404',
        extra(g, d, fr, G, R) {
          const h = G.hT, HN = '#d8d0b0', EY = '#fff8a0';
          if (d === 0) {
            R(3, h - 3, 2, 4, HN); R(11, h - 3, 2, 4, HN);
            R(5, h + 4, 2, 2, EY); R(9, h + 4, 2, 2, EY);
            R(5, h + 7, 6, 2, '#2a0404'); R(5, h + 7, 1, 2, '#f0ecd8'); R(10, h + 7, 1, 2, '#f0ecd8'); R(7, h + 8, 2, 4, '#d01818');
            R(1, G.tT + 8, 2, 4, '#2f5f6a'); R(13, G.tT + 8, 2, 4, '#2f5f6a'); R(0, G.tT + 11, 1, 2, '#e8e0c8'); R(15, G.tT + 11, 1, 2, '#e8e0c8');
          } else if (d === 1) { R(4, h - 3, 2, 4, HN); R(5, h + 4, 2, 2, EY); R(3, h + 7, 3, 1, '#2a0404'); R(2, h + 8, 2, 3, '#d01818'); R(1, G.tT + 8, 2, 4, '#2f5f6a'); }
          else if (d === 3) { R(3, h - 3, 2, 4, HN); R(11, h - 3, 2, 4, HN); }
        } }
    },
    /* 惊吓大头像 */
    faces: {
      yecha(R, a, t) {   // 青面、赤发、电目、血舌
        const S = '#2f5f6a', SD = '#1f434c', H = '#b8241a', HD = '#7a140e';
        R(0, 0, 32, 32, '#0a0c10');
        for (let i = 0; i < 8; i++) { const x = 1 + i * 4, hh = 5 + ((i * 7) % 4) + Math.round(Math.sin(t * 9 + i) * 1.5); R(x, 9 - hh, 4, hh + 2, i % 2 ? H : HD); }
        R(1, 4, 30, 6, H);
        R(5, 0, 3, 7, '#d8d0b0'); R(24, 0, 3, 7, '#d8d0b0'); R(6, 0, 1, 2, '#fff8e0'); R(25, 0, 1, 2, '#fff8e0');
        R(4, 8, 24, 22, S); R(4, 8, 3, 22, SD); R(25, 8, 3, 22, SD); R(7, 29, 18, 3, S);
        R(6, 11, 8, 3, SD); R(18, 11, 8, 3, SD);
        const fl = Math.sin(t * 30) > 0;
        R(7, 13, 7, 5, '#fff6a0'); R(18, 13, 7, 5, '#fff6a0'); R(9, 14, 3, 3, fl ? '#ffffff' : '#ffe040'); R(20, 14, 3, 3, fl ? '#ffffff' : '#ffe040');
        if (fl) { R(2, 15, 5, 1, '#e8f4ff'); R(0, 16, 2, 1, '#e8f4ff'); R(25, 15, 5, 1, '#e8f4ff'); R(30, 14, 2, 1, '#e8f4ff'); }
        R(14, 18, 4, 3, SD); R(14, 20, 1, 1, '#0a1416'); R(17, 20, 1, 1, '#0a1416');
        const o = Math.round(a * 3);
        R(7, 22, 18, 5 + o, '#2a0404');
        for (let i = 0; i < 9; i++) R(7 + i * 2, 22, 1, 2, '#f0ecd8');
        R(8, 22, 2, 5, '#f0ecd8'); R(22, 22, 2, 5, '#f0ecd8');
        const tl = 3 + Math.round(a * 8);
        R(13, 24 + o, 6, tl, '#d01818'); R(14, 24 + o, 4, tl, '#ff3a3a'); R(15, 24 + o, 1, tl, '#a00c0c');
      },
      laolao(R, a, t) {   // 姥姥：白发、大银梳、眯缝眼、咧开的黑牙嘴
        const SK = '#d6b49a', SD = '#a8846a', WR = '#4a3226';
        R(0, 0, 32, 32, '#120608');
        R(5, 1, 22, 9, '#cfcac0'); R(7, 0, 18, 3, '#e0dcd2'); R(6, 3, 20, 2, '#b8b2a6');
        R(3, 2, 26, 3, '#dfe3e8'); for (let i = 0; i < 12; i++) R(4 + i * 2, 5, 1, 3, '#c8ccd4'); R(3, 2, 26, 1, '#ffffff');
        R(6, 9, 20, 18, SK); R(6, 9, 2, 18, SD); R(24, 9, 2, 18, SD);
        R(8, 12, 6, 1, WR); R(18, 12, 6, 1, WR); R(9, 20, 3, 1, SD); R(20, 20, 3, 1, SD); R(7, 17, 2, 1, SD); R(23, 17, 2, 1, SD); R(12, 10, 8, 1, SD);
        const op = Math.sin(t * 3) > .9 ? 1 : 0;
        R(9, 14, 5, 1 + op, '#1a0a0a'); R(18, 14, 5, 1 + op, '#1a0a0a'); R(11, 14, 1, 1, '#e8d080'); R(20, 14, 1, 1, '#e8d080');
        R(15, 15, 2, 4, SD);
        const w = 8 + Math.round(a * 8), o = Math.round(a * 3);
        R(16 - w / 2, 22, w, 2 + o, '#1a0606'); for (let i = 0; i < w; i += 2) R(16 - w / 2 + i, 22, 1, 1, '#3a3020');
        R(16 - w / 2 - 1, 21, 1, 1, SD); R(16 + w / 2, 21, 1, 1, SD);
        R(4, 27, 24, 5, '#9a1a22'); R(12, 27, 8, 5, '#5a0a0e'); R(4, 27, 24, 1, '#c03038');
      }
    },
    items: {
      jin: { name: '一锭金子', desc: '黄澄澄的，压手。揣在怀里一点也焐不热，反倒越来越凉。' },
      puga: { name: '铺盖', desc: '一卷青布被褥，是从家里带出来的。母亲缝的被面，针脚很密。' },
      nang: { name: '破革囊', desc: '燕生的剑袋。皮子磨得发亮，打着三块旧补丁，闻着有一股铁锈味。他说：它扑过来时，站定别动。' },
      chu: { name: '锄头', desc: '一把旧锄头，木柄裂了一道缝，锄刃还算利。' },
      gu: { name: '小倩的骨殖', desc: '用你的青衫一层一层包着，抱在怀里，轻得像一捆柴。' },
      jiang: { name: '一瓯浆水', desc: '粗瓦瓯里盛着米浆水，不清，也不甜。' }
    },
    notes: {
      bei: { title: '院中的残碑', text: '（碑断了半截，字是前朝的）\n\n……金华城北，旧有兰若。\n「兰若」者，梵语「阿兰若」之省，\n译言「寂静处」，僧众修行之所也……\n……殿塔重修，施主某某……\n\n（下半截埋在土里。碑脚边，有人用指甲刻了两个小字，刻痕还很新：）\n\n莫宿' },
      shi: { title: '兰溪生袖里的诗笺', text: '（墨迹没干透就折起来了，字写得歪歪扭扭）\n\n荒寺秋深夜未央，\n月移竹影上空床。\n谁家小妹无人管，\n踏月来寻读书郎。\n\n——昨夜事也。她说脚冷，我替她焐着；她也替我焐脚，手凉得很。\n明日当问其姓氏。\n\n（最后一行，笔画越写越淡。）' },
      yanyu: { title: '燕生画的树（炭条草图）', text: '小倩说：「白杨之上，有乌巢者。」\n\n燕生在纸背上画了几笔：\n\n白杨——干直，皮灰白，疤像一只只眼睛；\n　　　叶背发白，没风也哗哗地响。坟边多种它。\n柳——皮黑，枝条垂着。\n槐——干扭着，皮黑褐，叶子密。\n松——针叶，四季发黑。\n\n老鸹（乌鸦）的窝：敞着口，像只大碗。\n喜鹊的窝：圆的，顶也封死，门开在侧面。\n——老鸹贼，爱蹲在别人窝上歇脚。' },
      pai: { title: '坟里的烂木牌', text: '（木头叫潮气沤黑了，字是刀刻的，很浅）\n\n聂氏女　小倩\n年十八\n\n随母寄居寺中\n秋，殁\n\n母　泣立\n\n（背面还刻着一行更小的字，像是后来添上的：）\n\n儿莫怕，娘明年来接你\n\n（她没有来。）' }
    },
    legend: '《聂小倩》出自清代蒲松龄（1640–1715）的《聊斋志异》。浙江书生宁采臣性情慷爽、自律甚严，常说「生平无二色」。他赴金华，借住城北兰若寺，寺里殿塔壮丽而蓬蒿没人，只住着一个自称秦人的燕赤霞。夜里宁从北墙石窗望见短墙外的小院中，一个衣绯、插蓬沓、驼背的老妇和一个四十来岁的妇人在月下说话，接着来了一个十七八岁的女子。那女子夜入他房中求欢，被他正色拒绝；她又把一锭黄金放在褥上，宁把金子掷到庭中，说「非义之物，污我囊橐」。女子拾金而去，叹道「此汉当是铁石」。「兰若」是梵语「阿兰若」的省称，意为寂静处，后来泛指寺院。\n\n第二天，来赴试的兰溪生和他的仆人先后暴死，足心都有锥刺般的小孔，细细出血。女子再来时说出实情：她叫聂小倩，十八岁夭亡，葬在寺旁，被妖物胁迫害人——狎昵她的人，她暗中以锥刺其足心，摄血供妖物饮用；或者以金相诱，那「金子」其实是罗刹鬼骨，留下的人会被截去心肝。她说妖物将遣夜叉来，劝宁与燕生同室，并求他把自己的朽骨带回去安葬：「但记取白杨之上，有乌巢者是也。」当夜窗外有妖物窥探，燕赤霞箱中一道白光破箧而出，折断窗上石棂，伤妖而还；燕自称剑客，临别以破革囊（剑袋）相赠，说「宝藏可远魑魅」，又说宁「犹富贵中人，非此道中人也」。宁掘出小倩遗骨，葬在自家书斋外，祭毕而返，身后有人喊「缓待同行」——是小倩。她侍奉宁母，渐能饮食，宁妻病故后嫁给宁采臣。后来她让人把革囊挂起，一夜夜叉来袭，被囊中探出的东西揪了进去，只剩清水数斗。数年后宁登进士，小倩生子。\n\n原文里驱使小倩的只称「妖物」，燕赤霞称窗外窥探者为「老魅」，并没有说那个衣绯的老妇就是妖物；后世改编多把她演成「姥姥」，有一种流行的说法把她写成千年树妖。据说最早的电影改编是1960年邵氏出品、李翰祥导演的《倩女幽魂》；1987年程小东导演、徐克监制的同名电影影响最大，长舌的树妖姥姥和燕赤霞的剑诀深入人心，此后又有多部电影和电视剧翻拍。许多改编把故事改成人鬼相恋的悲剧，原著却是一个讲信义得善报的故事：宁采臣守住的，是不贪色、不贪财和一句「毅然诺之」。\n\n（本章中，兰溪生与仆人和宁同日到寺（原文是次日）、残碑上的「莫宿」、兰溪生的诗笺、坟里的木牌、第二夜院中的金锭和池边女子、劝仆人连夜离开的支线、燕生画树和辨认白杨与乌巢的谜题、剑袋「站定才灵」的规则与夜叉追逐，以及门外假冒仆人的叫门声，都是游戏为了互动而增加或改动的；原文燕赤霞住寺南的小舍，游戏为了地图紧凑，把他的屋子放在宁的隔壁。主要情节与台词依照原著。）',
    endings: { home: '缓待同行', pu: '东厢没有再死人', jin: '非金也', meise: '足心一点凉' },
    start: { map: 'si', x: 16, y: 21, dir: 3 },
    resume: {
      n2: async S => { light(S); if (DIED.n2) await S.think(DIED.n2 === 1 ? '（院子里的东西——金子、叫你的声音、池边的女人——别捡，别理，别跟过去。）' : '（直接去东厢：沿着殿前的石路往东，过了池子东边，就是东厢的门。）'); },
      n3: async S => { light(S); CH.snore = 0; if (DIED.n3) await S.think(DIED.n3 === 1 ? '（燕生说过：他的箱子不能翻，门也不能开。躺下就好。）' : '（什么都别碰。回你的榻上躺下，不管听见谁叫门。）'); },
      chase: async S => { chaseReset(S); if (DIED.run) await S.think(DIED.run === 1 ? '（它比你快。等它扑到三四步远，就站住别动——剑袋要人站定了才灵。地上的金子别踩。）' : '（剑袋还剩几块补丁，就能定住它几回。它一被定住就赶紧走；金子绕开走。）'); chaseSpawnSoon(S); }
    },
    async intro(S) {
      for (const k in DIED) DIED[k] = 0;
      await S.card('第十一夜　聂小倩', '清　浙江金华　城北', '浙江有个书生，姓宁，名采臣。\n他常对人说：「生平无二色。」\n——这辈子，只认一个女人。\n\n那年学使来金华主持考试，\n城里的客店贵得住不起。\n他背着书箧，往城北走。');
    },
    tick(S, dt) { chaseTick(S, dt); snoreTick(S, dt); },
    thumb(g, w, h) {   // 月下寺顶、一棵挂着乌巢的白杨、一道剑光
      const s = Math.max(2, Math.floor(h / 48)), by = h - 22;
      const P = (x, y, ww, hh, c) => { g.fillStyle = c; g.fillRect(Math.round(x), Math.round(y), Math.ceil(ww), Math.ceil(hh)); };
      const mx = w * .2, my = h * .24, gr = g.createRadialGradient(mx, my, 2, mx, my, 18 * s); gr.addColorStop(0, 'rgba(230,236,255,.4)'); gr.addColorStop(1, 'rgba(230,236,255,0)'); g.fillStyle = gr; g.fillRect(0, 0, w, h);
      P(mx - 4 * s, my - 4 * s, 8 * s, 8 * s, '#e8ecf4'); P(mx - 3 * s, my - 5 * s, 6 * s, 1 * s, '#e8ecf4'); P(mx - 3 * s, my + 4 * s, 6 * s, 1 * s, '#e8ecf4');
      P(w * .06, by - 9 * s, w * .88, 9 * s, '#0b0910'); P(w * .01, by - 12 * s, w * .98, 3 * s, '#0b0910'); P(0, by - 14 * s, 3 * s, 2 * s, '#0b0910'); P(w - 3 * s, by - 14 * s, 3 * s, 2 * s, '#0b0910');
      const px = w * .84; P(px, by - 44 * s, 2 * s, 34 * s, '#cfcbbd'); P(px, by - 30 * s, 1 * s, 1 * s, '#2a2620'); P(px + s, by - 20 * s, 1 * s, 1 * s, '#2a2620');
      for (let i = 0; i < 6; i++) P(px - (3 + (i < 3 ? i : 5 - i)) * s, by - (56 - i * 4) * s, (8 + (i < 3 ? i : 5 - i) * 2) * s, 4 * s, i % 2 ? '#c8d0c0' : '#3a5a36');
      P(px - 3 * s, by - 46 * s, 8 * s, 2 * s, '#2a1e12'); P(px - 2 * s, by - 44 * s, 6 * s, 1 * s, '#1a120a');
      P(w * .64, 3, Math.max(2, s), by - 14 * s, 'rgba(230,240,255,.5)'); P(w * .64 - s, 3, 3 * s, 6 * s, 'rgba(255,255,255,.7)');
    },
    sprites: {
      halldoor(g, e, t, R) {   // 大殿朱门 + 门楣上的「兰若寺」匾
        R(0, -2, 16, 18, '#2a0808'); R(1, -1, 7, 17, '#6a1a1a'); R(8, -1, 7, 17, '#6a1a1a'); R(7, -1, 2, 17, '#2a0808');
        for (let i = 0; i < 3; i++) for (let j = 0; j < 2; j++) { R(2 + j * 3, 2 + i * 4, 1, 1, '#c8a040'); R(10 + j * 3, 2 + i * 4, 1, 1, '#c8a040'); }
        R(5, 7, 2, 2, '#8a6a30'); R(9, 7, 2, 2, '#8a6a30');
        if (e.open) { R(2, -1, 12, 17, '#0a0606'); R(4, 3, 8, 13, 'rgba(200,170,90,.07)'); }
        R(-8, -15, 32, 11, '#1a0e06'); R(-7, -14, 30, 9, '#22302a'); R(-8, -15, 32, 1, '#a88a3a'); R(-8, -5, 32, 1, '#a88a3a');
        const G = '#c8a040', GD = '#8a6a2a';   // 匾上的字：只画成三团墨迹般的金色笔触，不去拼真字
        for (let k = 0; k < 3; k++) for (let i = 0; i < 14; i++) { const h = hash(k, i, 7), x = -5 + k * 9 + ((h * 6) | 0), y = -13 + ((hash(i, k, 9) * 7) | 0); R(x, y, h > .6 ? 2 : 1, h < .3 ? 2 : 1, h > .45 ? G : GD); }
      },
      pagoda(g, e, t, R) {   // 七层砖塔（只占一格，向上画）
        const S = '#6a6660', D = '#262422', L = '#8a8680';
        R(-5, 9, 26, 7, D); R(-4, 8, 24, 2, L);
        for (let i = 0; i < 7; i++) {
          const y = 2 - i * 9, w = 16 - i * 2, x = (16 - w) / 2;
          R(x, y, w, 7, S); R(x, y, 1, 7, L); R(x + w / 2 - 1, y + 2, 2, 4, '#141210');
          R(x - 4, y - 2, w + 8, 2, D); R(x - 5, y - 3, 2, 2, D); R(x + w + 3, y - 3, 2, 2, D);
          if (i % 2 === 0) { const sw = Math.sin(t * 2 + i) > .7 ? 1 : 0; R(x - 5 + sw, y, 1, 2, '#6a5a30'); }
        }
        R(7, -72, 2, 10, '#7a6a38'); R(6, -66, 4, 1, '#7a6a38'); R(6, -70, 4, 1, '#7a6a38');
      },
      shichuang(g, e, t, R) {   // 北墙上的石窗（墙面那一行）。lit 外面有月光 / s.box 窗台上搁着燕生的箱箧 / s.broken 石棂断了 / eyes 窗外一双眼睛
        R(1, 1, 14, 12, '#3a3832'); R(2, 2, 12, 10, e.lit ? '#25304a' : '#0b0d13');
        if (e.lit) R(3, 3, 10, 8, 'rgba(160,180,220,.22)');
        if (e.eyes) { const b = Math.sin(t * 22) > -.3; if (b) { R(4, 5, 3, 2, '#fff2a0'); R(10, 5, 3, 2, '#fff2a0'); R(5, 5, 1, 1, '#ffffff'); R(11, 5, 1, 1, '#ffffff'); } }
        if (!e.broken) for (let x = 3; x < 14; x += 3) R(x, 2, 1, 10, '#5e5c54');
        else { R(3, 2, 1, 10, '#5e5c54'); R(6, 2, 1, 3, '#5e5c54'); R(6, 9, 1, 3, '#5e5c54'); R(9, 2, 1, 2, '#5e5c54'); R(12, 2, 1, 10, '#5e5c54'); R(7, 11, 2, 1, '#5e5c54'); R(9, 12, 1, 1, '#5e5c54'); }
        R(0, 12, 16, 2, '#4a4840'); R(0, 12, 16, 1, '#5e5c54');
        if (e.box) {
          R(3, 6, 10, 7, '#4a3018'); R(3, 6, 10, 1, '#6a4a28'); R(3, 9, 10, 1, '#3a2410'); R(7, 8, 2, 2, '#b89038');
          if (e.box === 'split') { R(7, 6, 2, 7, '#0a0604'); R(7, 7, 1, 5, 'rgba(230,240,255,.7)'); }
          else if (e.box === 'glow') { const b = (Math.sin(t * 9) + 1) / 2; R(3, 9, 10, 1, `rgba(220,235,255,${(.3 + b * .5).toFixed(2)})`); }
        }
      },
      ta(g, e, t, R) {   // 榻（1×2）。s.bedding 铺着被褥 / s.gold 褥上一锭金子 / s.who 'yan' 燕生睡着
        R(0, 1, 16, 30, '#3a2616'); R(1, 2, 14, 28, '#6a4a2c'); R(0, 29, 2, 3, '#2a1a10'); R(14, 29, 2, 3, '#2a1a10');
        R(2, 3, 12, 25, '#8a7a50'); for (let y = 4; y < 28; y += 2) R(2, y, 12, 1, '#7a6a44');
        if (e.bedding || e.who) { R(3, 3, 10, 4, '#d8d4c4'); R(2, 9, 12, 19, '#34445e'); R(2, 9, 12, 1, '#46587a'); for (let i = 0; i < 3; i++) R(4 + i * 4, 14 + i * 3, 2, 1, '#46587a'); }
        if (e.who === 'yan') {
          const b = Math.sin(t * 1.6) > 0 ? 1 : 0;
          R(4, 2, 8, 7, '#c48e64'); R(4, 1, 8, 3, '#16110c'); R(5, 7, 6, 2, '#16110c'); R(5, 5, 2, 1, '#2a1a10'); R(9, 5, 2, 1, '#2a1a10');
          R(2, 9 - b, 12, 19 + b, '#5a4a36'); R(2, 9 - b, 12, 1, '#6a5a44');
        }
        if (e.gold) { const s = Math.sin(t * 5) > .6; R(4, 16, 8, 4, '#c8a040'); R(3, 15, 3, 3, '#e0b850'); R(10, 15, 3, 3, '#e0b850'); R(6, 16, 4, 2, '#f0d070'); if (s) { R(11, 13, 1, 3, '#fff8d0'); R(10, 14, 3, 1, '#fff8d0'); } }
      },
      doorS(g, e, t, R) {   // 屋里看南墙上的门（最下面一行）
        if (e.open) { R(1, 0, 14, 16, '#06060a'); R(3, 0, 12, 16, e.lit ? 'rgba(255,240,200,.2)' : 'rgba(140,160,210,.12)'); R(1, 0, 2, 16, '#4a3020'); return; }
        R(1, 0, 14, 16, '#3a2414'); R(2, 1, 12, 14, '#5a3a22'); R(7, 1, 2, 14, '#3a2414');
        R(3, 3, 4, 4, '#4a2e18'); R(9, 3, 4, 4, '#4a2e18'); R(3, 9, 4, 4, '#4a2e18'); R(9, 9, 4, 4, '#4a2e18');
        R(6, 7, 1, 2, '#b89038'); R(9, 7, 1, 2, '#b89038');
        if (e.locked) R(5, 7, 6, 2, '#6a5a40');   // 门闩
      },
      gold(g, e, t, R) {   // 一锭金子（夜里会自己闪）
        const s = Math.sin(t * 4 + e.x * 1.3) > .55;
        R(4, 13, 8, 1, 'rgba(0,0,0,.35)'); R(4, 9, 8, 4, '#c8a040'); R(3, 8, 3, 3, '#e0b850'); R(10, 8, 3, 3, '#e0b850'); R(6, 9, 4, 2, '#f0d070');
        if (s) { R(11, 5, 1, 4, '#fff8d0'); R(9, 6, 5, 1, '#fff8d0'); R(5, 8, 1, 1, '#ffffff'); }
      },
      pwin2(g, e, t, R) {   // 东厢糊纸的窗。lit 点着灯 / s.sh 窗纸上映着两个影子（一个躺着，一个弯腰）
        R(1, 1, 14, 11, '#4a3422'); R(2, 2, 12, 9, e.lit ? '#e2c27a' : '#1a1a20');
        if (e.lit && e.sh) { const c = 'rgba(40,20,14,.82)', b = Math.sin(t * 2) > 0 ? 1 : 0; R(3, 8, 9, 2, c); R(3, 7, 3, 2, c); R(8, 3 + b, 3, 3, c); R(7, 5 + b, 4, 4, c); R(6, 7 + b, 2, 2, c); }
        for (let x = 2; x < 14; x += 3) R(x, 2, 1, 9, '#4a3422'); R(2, 6, 12, 1, '#4a3422');
      },
      shiti(g, e, t, R) {   // 门板上盖着白布的兰溪生（2×1，头朝左）；s.bare 脚露在外头
        R(0, 3, 32, 11, '#5a3a22'); R(0, 3, 32, 1, '#6a4a2c'); R(0, 13, 32, 1, '#3a2414');
        R(1, 4, 6, 8, '#e8dcc8'); R(1, 4, 6, 3, '#1a1210'); R(2, 8, 1, 1, '#3a2a2a'); R(5, 8, 1, 1, '#3a2a2a'); R(3, 10, 2, 1, '#b07a6a');
        R(7, 4, 21, 9, '#e8e6e0'); R(7, 4, 21, 1, '#f4f2ee'); R(10, 8, 15, 1, '#d4d2cc');
        if (e.bare) { R(28, 5, 3, 3, '#f0d6c0'); R(28, 9, 3, 3, '#f0d6c0'); R(30, 6, 1, 1, '#a01818'); R(30, 10, 1, 1, '#a01818'); R(30, 7, 1, 2, 'rgba(160,20,20,.6)'); }
        else R(27, 5, 4, 7, '#e8e6e0');
      },
      mound(g, e, t, R) {   // 坟包。s.dug：1 刚刨开又填回去 / 2 刨开了，露着骨头 / 3 空坑
        const d = e.dug || 0;
        if (d >= 2) {
          R(0, 3, 16, 12, '#2a1e12'); R(1, 4, 14, 10, '#140c06'); R(-2, 1, 5, 4, '#5a4630'); R(13, 0, 5, 5, '#5a4630');
          if (d === 2) { R(4, 6, 2, 2, '#d8d0b8'); R(6, 7, 6, 1, '#d8d0b8'); R(8, 9, 4, 1, '#c8c0a8'); R(5, 10, 1, 3, '#c8c0a8'); R(10, 11, 2, 1, '#d8d0b8'); R(3, 6, 1, 4, '#0c0a0e'); }
          return;
        }
        R(1, 6, 14, 9, d === 1 ? '#6a5236' : '#4a3a28'); R(3, 4, 10, 4, d === 1 ? '#7a6040' : '#5a4832'); R(5, 3, 6, 2, d === 1 ? '#7a6040' : '#5e4c36');
        if (!d) { R(3, 9, 2, 1, '#3a5a2a'); R(10, 7, 1, 2, '#3a5a2a'); R(12, 11, 2, 1, '#3a5a2a'); }
        R(2, 14, 12, 1, 'rgba(0,0,0,.3)');
      },
      poplar(g, e, t, R) {   // 白杨：灰白的干、「眼睛」疤、叶背翻白；s.nest crow 敞口窝 / magpie 封顶窝（s.perch 上面蹲着老鸹）/ fallen 窝掉在树根下
        const fl = Math.sin(t * 7 + e.x * 2.1);
        R(6, -34, 4, 49, '#cfcbbd'); R(6, -34, 1, 49, '#e8e4d8'); R(9, -34, 1, 49, '#a8a496');
        R(7, -22, 2, 1, '#2a2620'); R(7, -12, 2, 1, '#2a2620'); R(6, -1, 2, 1, '#2a2620'); R(8, -28, 1, 1, '#2a2620'); R(8, 6, 1, 1, '#2a2620');
        for (let i = 0; i < 10; i++) {
          const y = -66 + i * 4, ww = 4 + Math.round((i < 6 ? i : 10 - i) * 1.6), x = 8 - ww / 2;
          R(x, y, ww, 4, '#3e5e38'); if ((i + (fl > 0 ? 1 : 0)) % 2) R(x + 1, y + 1, ww - 2, 2, '#c8d2c4');
        }
        R(4, -36, 2, 1, '#cfcbbd'); R(10, -38, 3, 1, '#cfcbbd');
        if (e.nest === 'crow') {   // 敞口的大碗：宽、扁，口朝上，窝沿上探出两个黑脑袋
          R(1, -47, 14, 4, '#3a2a1a'); R(2, -43, 12, 2, '#2a1e12'); R(0, -48, 3, 1, '#4a3a22'); R(13, -48, 3, 1, '#4a3a22'); R(5, -44, 1, 2, '#4a3a22'); R(10, -44, 1, 2, '#4a3a22');
          R(3, -47, 10, 1, '#0e0a06');
          const b = Math.sin(t * 3 + 1) > 0 ? 1 : 0; R(4, -50 - b, 3, 3, '#111'); R(9, -50 + b, 3, 3, '#111'); R(3, -49 - b, 1, 1, '#6a5a20'); R(12, -49 + b, 1, 1, '#6a5a20'); R(5, -50 - b, 1, 1, '#d8d0a0');
        }
        else if (e.nest === 'magpie') {   // 圆球形封顶窝：高、圆，侧面一个黑洞；一只老鸹蹲在顶上
          R(4, -57, 8, 1, '#3a2a1a'); R(3, -56, 10, 12, '#3a2a1a'); R(2, -53, 1, 7, '#3a2a1a'); R(13, -53, 1, 7, '#3a2a1a'); R(4, -44, 8, 1, '#2a1e12');
          R(4, -55, 3, 1, '#4a3a22'); R(9, -52, 3, 1, '#4a3a22'); R(5, -48, 2, 1, '#4a3a22');
          R(10, -51, 3, 3, '#050302'); R(10, -52, 3, 1, '#5a4a30');
          if (e.perch) { const h = Math.sin(t * 2) > .6 ? 1 : 0; R(6, -61, 4, 4, '#111'); R(5 - h, -62, 2, 2, '#111'); R(4 - h, -61, 1, 1, '#6a5a20'); R(9, -59, 3, 1, '#111'); }
        }
        else if (e.nest === 'fallen') { R(9, 11, 7, 3, '#3a2a1a'); R(8, 13, 3, 1, '#4a3a22'); R(14, 10, 2, 1, '#4a3a22'); R(11, 12, 2, 1, '#0c0c10'); R(12, 10, 1, 2, '#0c0c10'); }
      },
      willow(g, e, t, R) {   // 柳树（带一个敞口的老鸹窝）
        const s = Math.sin(t * 1.1 + e.x) * 1.5;
        R(6, -12, 4, 27, '#2e2218'); R(6, -12, 1, 27, '#3a2c1e'); R(5, 12, 6, 3, '#2a2016');
        R(-6, -30, 28, 9, '#3c5a34'); R(-2, -34, 20, 5, '#4a6a3e');
        for (let i = 0; i < 7; i++) R(-5 + i * 4 + s, -22, 1, 12 + (i % 3) * 5, i % 2 ? '#4f7442' : '#3c5a34');
        R(2, -38, 10, 3, '#3a2a1a'); R(3, -35, 8, 2, '#2a1e12'); R(5, -40, 2, 2, '#111'); R(4, -39, 1, 1, '#4a4020');
      },
      huai(g, e, t, R) {   // 老槐：拧着的黑干、密不透光的冠、高处一个敞口窝
        R(6, -16, 5, 31, '#3a2a1c'); R(5, -6, 2, 6, '#3a2a1c'); R(10, -14, 2, 6, '#3a2a1c'); R(7, -10, 1, 8, '#24180e'); R(9, 0, 1, 8, '#24180e');
        R(-6, -40, 28, 22, '#1e3220'); R(-3, -44, 22, 6, '#263e28'); R(-6, -24, 6, 4, '#1a2c1c'); R(16, -26, 6, 5, '#1a2c1c');
        for (let i = 0; i < 6; i++) R((hash(e.x, i, 3) * 26 | 0) - 5, -40 + (hash(e.x, i, 4) * 18 | 0), 3, 2, '#2c4a2e');
        R(3, -46, 10, 3, '#3a2a1a'); R(4, -43, 8, 2, '#2a1e12'); R(6, -48, 2, 2, '#111'); R(9, -48, 2, 2, '#111');
      },
      song(g, e, t, R) {   // 松
        R(7, -6, 3, 21, '#3a2818');
        for (let i = 0; i < 7; i++) { const ww = 4 + i * 3; R(8 - ww / 2, -40 + i * 5, ww, 5, i % 2 ? '#15281a' : '#1c3222'); }
      },
      shanmen(g, e, t, R) {   // 山门（2 格宽，压在南墙的缺口上）。open 门开着
        R(-3, -16, 38, 5, '#2a1e18'); R(-5, -18, 42, 3, '#1a1210'); R(-6, -19, 4, 2, '#1a1210'); R(34, -19, 4, 2, '#1a1210');
        R(-2, -12, 4, 28, '#5a1a1a'); R(30, -12, 4, 28, '#5a1a1a'); R(-2, -12, 1, 28, '#7a2a2a'); R(30, -12, 1, 28, '#7a2a2a');
        if (!e.open) { R(2, -10, 13, 26, '#4a1414'); R(17, -10, 13, 26, '#4a1414'); R(15, -10, 2, 26, '#2a0808'); for (let i = 0; i < 3; i++) { R(6, -6 + i * 7, 1, 1, '#b89038'); R(24, -6 + i * 7, 1, 1, '#b89038'); } }
        else { R(2, -10, 3, 26, '#4a1414'); R(27, -10, 3, 26, '#4a1414'); }
      },
      stele(g, e, t, R) {   // 断了半截的石碑
        R(2, 10, 12, 5, '#3e3c38'); R(3, -4, 10, 15, '#6a6862'); R(3, -4, 10, 1, '#7a7872'); R(3, -5, 4, 1, '#6a6862'); R(9, -6, 4, 2, '#6a6862');
        for (let i = 0; i < 4; i++) R(5, -1 + i * 3, 6, 1, '#4a4844');
        R(4, 9, 3, 1, '#2a2826');
      },
      xue(g, e, t, R) {   // 一溜血点子
        const c = '#5a0c0c'; R(3, 4, 2, 2, c); R(9, 7, 3, 2, c); R(6, 11, 2, 2, c); R(12, 13, 1, 1, c); R(10, 8, 1, 1, '#7a1a14');
      },
      pit(g, e, t, R) {   // 宁家书斋外的新坟。s.st：0 挖好的坑 / 1 埋好了 / 2 坟前摆着一瓯浆水和木牌
        const st = e.st || 0;
        if (!st) { R(1, 3, 14, 11, '#2a1e12'); R(2, 4, 12, 9, '#140c06'); R(-1, 12, 6, 3, '#5a4630'); R(11, 0, 6, 4, '#5a4630'); return; }
        R(1, 5, 14, 10, '#6a5236'); R(3, 3, 10, 4, '#7a6040'); R(5, 2, 6, 2, '#7a6040'); R(2, 14, 12, 1, 'rgba(0,0,0,.3)');
        if (st >= 2) { R(6, -4, 4, 8, '#3a2a1a'); R(7, -3, 2, 6, '#4a3a26'); R(10, 12, 4, 3, '#8a6a4a'); R(11, 12, 2, 1, '#d8d0b8'); }
      },
      vat(g, e, t, R) { box(R, 1, 1, 14, 14, '#4a4440'); R(2, 2, 12, 3, '#1a2630'); R(3, 3, 4, 1, '#3a5060'); R(1, 8, 14, 1, '#38322e'); R(4, 0, 4, 2, '#8a6a4a'); },
      pilian(g, e, t, R) {   // 破箧而出的剑光：一道竖着的白练
        const f = Math.sin(t * 40) > 0 ? 1 : 0;
        R(6 - f, -54, 4 + f * 2, 66, 'rgba(225,238,255,.9)'); R(7, -54, 2, 66, '#ffffff'); R(3, -58, 10, 6, 'rgba(225,238,255,.5)');
      },
      xsdoor(g, e, t, R) {   // 西僧舍虚掩的破门
        R(2, -2, 12, 16, '#08070a'); R(2, -2, 5, 16, '#4a3626'); R(3, -1, 3, 14, '#5a4430'); R(6, 4, 1, 3, '#2a1e14');
        R(9, 8, 4, 1, '#3a3028'); R(10, 2, 1, 1, '#3a3028');
      },
      bundle(g, e, t, R) { R(3, 7, 10, 7, '#4e6478'); R(3, 7, 10, 1, '#5e7488'); R(7, 5, 2, 3, '#34404e'); R(6, 13, 4, 1, 'rgba(0,0,0,.3)'); }
    },
    tiles: {
      zhu: { solid: true, paint(R, X, Y) { TILE.grass.paint(R, X, Y, { grassC: '#203220' }); for (let i = 0; i < 4; i++) { const x = 1 + i * 4 + ((hash(X, Y, i) * 2) | 0); R(x, 0, 2, 16, i % 2 ? '#4a7a3a' : '#3a6a30'); R(x, (hash(X, Y, i + 9) * 12) | 0, 2, 1, '#22401c'); R(x + 2, (3 + i * 4) % 14, 3, 1, '#5a8a44'); R(x - 2, (9 + i * 3) % 14, 2, 1, '#4a7a3a'); } } },
      peng: { solid: false, paint(R, X, Y) { TILE.grass.paint(R, X, Y, { grassC: '#2a3c26' }); for (let i = 0; i < 6; i++) { const x = (hash(X, Y, 40 + i) * 15) | 0, h = 6 + ((hash(Y, X, 50 + i) * 8) | 0); R(x, 16 - h, 1, h, i % 2 ? '#5a6a38' : '#46582e'); R(x - 1, 16 - h, 1, 2, '#6a7a44'); } } },
      lotus: { solid: true, paint(R, X, Y) { TILE.water.paint(R, X, Y); R(2, 3, 6, 5, '#2a5a30'); R(3, 4, 4, 3, '#356a3a'); R(9, 9, 5, 4, '#2a5a30'); if (hash(X, Y, 7) > .4) { R(10, 6, 3, 3, '#e8a0b0'); R(11, 5, 1, 1, '#f8d0d8'); R(11, 7, 1, 1, '#f0c040'); } } },
      dq: { solid: true, paint(R, X, Y) { R(0, 0, 16, 16, '#5a5248'); R(0, 0, 16, 4, '#3a3a40'); for (let i = 0; i < 4; i++) R(i * 4 + (X % 2) * 2, 0, 2, 4, '#4a4a52'); R(0, 13, 16, 3, '#3e382e'); R(((hash(X, Y, 1) * 12) | 0), 7, 3, 1, '#4a4238'); } },
      fenG: { solid: true, paint(R, X, Y, m) { TILE.grass.paint(R, X, Y, m); R(2, 6, 12, 8, '#4a3a28'); R(4, 4, 8, 4, '#54422e'); R(6, 3, 4, 2, '#5a4832'); R(3, 13, 10, 1, 'rgba(0,0,0,.3)'); if (hash(X, Y, 3) > .5) { R(7, 0, 2, 5, '#6a6862'); R(7, 0, 2, 1, '#7a7872'); } } }
    },
    maps: {
      /* ---------------- 兰若寺（院子） ----------------
         僧舍（宁、燕两间）在西北，门 (4,4)(8,4)；大殿门 (17,5)；殿东隅修竹；七层塔 (26,6)；北墙角门 (29,1) 通寺北荒坟；
         东厢门 (29,11)；西僧舍 (2,10)(4,10)；殿前大池 (12..21,10..13)；山门在南墙缺口 (16..17,23)。 */
      si: {
        amb: 'wind', dark: .3, plr: 3.4, floor: 'dirt', wall: 'red',
        legend: { 'Z': 'zhu', 'p': 'peng', 'Y': 'lotus' },
        tileOpts: { grassC: '#2a3e28', treeC: '#1c3020' },
        rows: [
          '##################################',
          '##################################',
          '#"#########""#########ZZZ""""d"""#',
          '#"#########""#########ZZZ""""d"""#',
          '#"#########""#########ZZZ""""d"""#',
          '#p"kkkkkkkk""#########"""""""d"""#',
          '#p"kkkkkkkkkkkkkkkkk""""pp"""d"""#',
          '#p""""""""d""""kkkkk""""pp"""d"BB#',
          '######"B""d""""kkkkk""""ppdddd"""#',
          '######""""dkkkkkkkkkkkk"""d#######',
          '######""""dk~Y~~Y~Y~~~k"""d#######',
          '#"dddddddddk~~~Y~~~~~~k"""d#######',
          '#ppp""""BB"kY~~~~Y~~Y~kddddddd"""#',
          '#ppp"""""""k~~Y~~~~Y~~k"""""""ppp#',
          '#ppp"""""""kkkkkkkkkkkk"""""""ppp#',
          '#ppp""""""""ppp"kk"ppp""""""BBppp#',
          '#ppp""""""""ppp"kk"ppp"BB"""""ppp#',
          '#"""""""""""ppp"kk"ppp"""""""""""#',
          '#"""""pppppp""""kk"""pppppp""""""#',
          '#pppp"pppppp""""kk"""pppppp"ppppp#',
          '#pTpp"pppppp""""kk"""pppppp"ppppp#',
          '#pppp"pTpppp""""kk"""pppppp"pppTp#',
          '#pppp"""""""""""kk"""""""T""ppppp#',
          '################kk################'],
        ents: [
          /* 僧舍 */
          { id: 'ndoor', x: 4, y: 4, spr: 'door', col: '#5a4430', on: S => doorNing(S) },
          { x: 2, y: 4, spr: 'window', on: R0(S => S.narr('你那间僧舍的窗。窗纸破了好几个洞，风一吹，呜呜地响。')) },
          { x: 6, y: 4, spr: 'window', on: R0(S => S.narr('窗台上落着一层灰，灰上有几个小小的爪印，像是猫，又不太像。')) },
          { id: 'ydoor', x: 8, y: 4, spr: 'door', col: '#4a3626', locked: true, on: S => doorYan(S) },
          { id: 'ywin', x: 10, y: 4, spr: 'window', on: R0(S => S.narr(['n2', 'n3'].includes(S.f.ph) ? '燕生屋里黑着。鼾声隔着窗纸都听得见。' : '燕生屋子的窗，糊得严严实实，一个洞也没有。')) },
          /* 大殿、塔、竹、池 */
          { id: 'hall', x: 17, y: 5, spr: 'halldoor', on: R0(S => { seeA1(S, 'hall'); return S.narr(['a2', 'n2'].includes(S.f.ph) ? '大殿里黑洞洞的。佛像的眼睛，像是在看着门口。' : '大殿的门半掩着。门楣上一块匾：「兰若寺」。\n佛像的金漆剥了大半，供桌上积着一指厚的灰。梁上的蛛网里，挂着一只干了的蛾子。'); }) },
          { x: 15, y: 5, spr: 'window', on: R0(S => S.narr('大殿的窗棂上糊的纸早烂光了，只剩一格一格的黑洞。')) },
          { x: 19, y: 5, spr: 'window', on: R0(S => S.narr('窗洞里伸出几根蒿草。殿里头，都长草了。')) },
          { id: 'ta', x: 26, y: 6, spr: 'pagoda', on: R0(S => { seeA1(S, 'ta'); return S.narr(S.f.ph === 'n2' ? '塔顶上好像蹲着什么东西。再一看，只是一截歪了的塔刹。' : '一座七层砖塔，比大殿还高。\n塔檐下挂的铜铃早没了舌头，风过来，一声不响。'); }) },
          { id: 'zhuI', x: 23, y: 4, spr: 'invisible', solid: true, on: R0(S => { seeA1(S, 'zhu'); return S.narr('殿东角一丛修竹，竹竿有胳膊粗，叶子沙沙地响。\n竹子底下的土是湿的，一个脚印也没有。'); }) },
          { id: 'chi', x: 12, y: 10, w: 10, h: 4, spr: 'invisible', solid: true, on: R0(S => { seeA1(S, 'chi'); return S.narr(S.f.ph === 'n2' ? '池水黑得像墨。荷叶底下，有什么东西慢慢地游了过去。' : '台阶底下好大一口池子。野藕已经开花了，粉的、白的，开得没人看。\n水是黑的，看不见底。'); }) },
          { id: 'lu', x: 17, y: 8, spr: 'incense', on: R0(S => { seeA1(S, 'lu'); return S.narr('铁香炉里的香灰结成了块。灰上插着三根香，只烧了一半——\n灰是新的。可这寺里，明明没有和尚。'); }) },
          { x: 14, y: 7, spr: 'stonelantern', off: true, on: R0(S => S.narr('石灯笼里没有灯，只有一窝枯叶。')) },
          { x: 20, y: 7, spr: 'stonelantern', off: true, on: R0(S => S.narr('石灯笼的顶歪了，底座上刻着一朵莲花。')) },
          { id: 'bei', x: 8, y: 15, spr: 'stele', on: R0(async S => { seeA1(S, 'bei'); await S.note('bei'); }) },
          /* 东厢、西僧舍、角门、山门 */
          { id: 'dx', x: 29, y: 11, spr: 'door', col: '#5a3a22', on: S => dongxiang(S) },
          { id: 'dxw', x: 31, y: 11, spr: 'pwin2', on: R0(S => S.narr(S.ent('dxw').lit ? (S.ent('dxw').s.sh ? '窗纸上映着两个影子。一个躺着，一个弯着腰，凑在他脚边。' : '东厢的窗亮着灯。') : '东厢的窗黑着。')) },
          { id: 'xs1', x: 2, y: 10, spr: 'xsdoor', on: S => xiseng(S, 1) },
          { id: 'xs2', x: 4, y: 10, spr: 'xsdoor', on: S => xiseng(S, 2) },
          { id: 'jiao', x: 29, y: 1, spr: 'door', col: '#3a2e24', locked: true, on: S => jiaoOn(S) },
          { id: 'shanmen', x: 16, y: 23, w: 2, spr: 'shanmen', solid: false, touch: S => shanmenOn(S) },
          /* 人 */
          { id: 'yan', x: 16, y: 22, spr: '@yan', dir: 3, hidden: true, on: S => yanTalk(S) },
          { id: 'lanxi', x: 16, y: 22, spr: '@lanxi', dir: 3, hidden: true, on: S => S.say('兰溪生', '兄台，晚上要是闷得慌，来东厢喝两杯！') },
          { id: 'pu', x: 17, y: 22, spr: '@pu', dir: 3, hidden: true, on: S => puTalk(S) },
          { id: 'shi', x: 26, y: 13, w: 2, spr: 'shiti', hidden: true, on: S => shiOn(S) },
          /* 第二夜：院子里的诱惑 */
          { id: 'g1', x: 17, y: 6, spr: 'gold', hidden: true, light: { r: .9, col: 'rgba(255,210,110,.25)' }, on: S => lureGold(S, 'g1') },
          { id: 'g2', x: 22, y: 10, spr: 'gold', hidden: true, light: { r: .9, col: 'rgba(255,210,110,.25)' }, on: S => lureGold(S, 'g2') },
          { id: 'g3', x: 25, y: 12, spr: 'gold', hidden: true, light: { r: .9, col: 'rgba(255,210,110,.25)' }, on: S => lureGold(S, 'g3') },
          { id: 'yao', x: 22, y: 13, spr: '@yao', dir: 1, hidden: true, light: { r: 1.6, col: 'rgba(200,210,240,.12)' }, on: S => lureYao(S) },
          /* 第四天：血点子 */
          { id: 'xue1', x: 31, y: 2, spr: 'xue', decal: true, hidden: true },
          { id: 'xue2', x: 30, y: 3, spr: 'xue', decal: true, hidden: true },
          { id: 'xue3', x: 29, y: 2, spr: 'xue', decal: true, hidden: true },
          { id: 'xueI', x: 30, y: 2, spr: 'invisible', hidden: true, on: S => S.narr('血点子黑红黑红的，一路从墙根滴到角门底下。\n门缝里，还挂着一绺红头发。') },
          /* 追逐：夜叉、剑袋的光、地上的金子 */
          { id: 'yc', x: 29, y: 2, spr: '@yecha', hidden: true, solid: false },
          { id: 'bagl', x: 1, y: 1, spr: 'invisible', hidden: true, light: { r: 1.3, pl: true, col: 'rgba(210,180,120,.14)' } },
          { id: 'gd1', x: 29, y: 6, spr: 'gold', decal: true, hidden: true },
          { id: 'gd2', x: 26, y: 10, spr: 'gold', decal: true, hidden: true },
          { id: 'gd3', x: 23, y: 14, spr: 'gold', decal: true, hidden: true },
          { id: 'gd4', x: 17, y: 19, spr: 'gold', decal: true, hidden: true },
          { id: 'gd5', x: 16, y: 17, spr: 'gold', decal: true, hidden: true }
        ],
        async enter(S, first) {
          light(S);
          const ph = S.f.ph;
          if (first) {
            S.f.ph = 'a1'; light(S);
            await S.narr('城北这座旧寺，叫兰若寺。\n殿和塔都还气派，只是满院的蓬蒿长得比人还高，像很久没人走过了。');
            await S.think('东西两边的僧舍，门都虚掩着……和尚呢？');
            S.goal('四处看看，等寺里的和尚回来');
            return;
          }
          S.amb(['n2', 'run', 'a2'].includes(ph) ? 'night' : 'wind');
          if (ph === 'd2' && S.once('d2in')) { await S.narr('东厢门口围着一块门板，门板上盖着白布。\n那个挑担子的仆人跪在旁边，哭得直不起腰。'); S.goal('东厢出事了——过去看看'); }
          if (ph === 'd3' && S.once('d3in')) { await S.think('小倩说：跟燕生睡一间屋，就没事。\n……燕生正站在他屋门口。'); S.goal('请燕生让你搬过去同住'); }
          if (ph === 'd4' && S.once('d4in')) S.goal('燕生在北墙角门那儿——去找他');
          if (ph === 'run' && S.once('runIn')) {
            chaseSetup(S);
            thump(S, .08); S.shake(300, 2);
            await S.narr('你刚进角门，身后的墙头上「咚」的一声，有什么重东西落了下来。\n……又一声。');
            await S.think('别跑——抱着她，跑不起来。走稳了。\n燕生说过：它扑过来的时候，站定别动。\n（它离得近了，剑袋会发亮，「叮」地一响——那就是站住的时候。）');
            coopG(S, '往南出山门！剑袋「叮」一响就站定别动；别踩金子',
              '往南出山门！一人走，一人听剑袋「叮」就喊停；别踩金子');
            S.cp('chase');
            chaseSpawnSoon(S);
          }
        },
        step(S, x, y) {
          const ph = S.f.ph;
          if (ph === 'run') {
            const g = ['gd1', 'gd2', 'gd3', 'gd4', 'gd5'].find(k => { const e = S.ent(k); return e && !e.hidden && e.x === x && e.y === y; });
            if (g) { CH.slow = 1.3; S.speed(.3); clink(S, .05); S.toast('脚底下一沉——是金子！它粘住了你的脚！'); }
            return;
          }
          if (ph === 'n2') {
            if (y === 11 && x <= 6 && !S.f.voiceDone && S.once('xsVoice')) { S.sfx('whisper'); return S.say('西边的僧舍里', '宁相公……这边……', { style: 'whisper' }); }
            const yo = S.ent('yao');
            if (yo && !yo.hidden && Math.abs(x - 22) + Math.abs(y - 13) <= 2 && S.once('yaoTalk')) return (async () => {
              S.bubble('yao', '…', 1500); hum(S, .02);
              await S.narr('池边坐着一个白衣裳的女人，背对着你，两只脚泡在黑水里。\n她在哼一支小曲。');
              await S.say('池边的女人', '相公……我的鞋掉进水里了，帮我捞一捞……', { style: 'whisper' });
            })();
          }
        }
      },
      /* ---------------- 僧舍（两间：西边宁采臣、东边燕赤霞）＋北墙石窗外的小院 ----------------
         小院 (1..20,1..4) 走不进去，隔着短墙 (y=5) 和北墙；石窗 (5,7) 与 (16,7) 挂在北墙墙面上。 */
      fang: {
        amb: 'night', dark: .6, plr: 2.8, floor: 'darkwood', wall: 'wood',
        legend: { 'H': 'dq' },
        tileOpts: { grassC: '#24321f' },
        rows: [
          '######################',
          '#""""""""""""""""""""#',
          '#""""ddddddddddd"""""#',
          '#""""ddddddddddd"""""#',
          '#""""""""""""""""""""#',
          '#HHHHHHHHHHHHHHHHHHHH#',
          '######################',
          '######################',
          '#..........#.........#',
          '#..........#.........#',
          '#..........#.........#',
          '#..........#.........#',
          '#####.##########.#####'],
        ents: [
          /* 西屋（你的） */
          { id: 'swin', x: 5, y: 7, spr: 'shichuang', on: S => swinOn(S) },
          { id: 'bed', x: 1, y: 8, h: 2, spr: 'ta', s: { bedding: true }, on: S => bedW(S) },
          { id: 'desk', x: 8, y: 8, spr: 'desk', on: S => S.narr('一张旧书案，桌面上刻满了不知道哪个和尚的字：「南无」「南无」「南无」。') },
          { id: 'cdl', x: 9, y: 8, spr: 'candle', light: { r: 3, col: 'rgba(255,190,110,.2)', flick: true }, on: S => S.narr(S.ent('cdl').off ? '灯灭了。灯芯还冒着一缕青烟。' : '一盏油灯，灯苗一跳一跳的。') },
          { x: 10, y: 8, spr: 'box', on: S => S.narr('你的书箧。四书五经，几件换洗衣裳，还有母亲缝的一双布袜。') },
          { x: 10, y: 11, spr: 'vat', on: S => S.narr('一口小水缸。水面上浮着一层灰，映着你的脸，晃来晃去。') },
          { id: 'wdoor', x: 5, y: 12, spr: 'doorS', on: S => wdoorOn(S) },
          /* 东屋（燕生的） */
          { id: 'ewin', x: 16, y: 7, spr: 'shichuang', on: S => ewinOn(S) },
          { id: 'nta', x: 12, y: 8, h: 2, spr: 'ta', on: S => ntaOn(S) },
          { id: 'yta', x: 20, y: 8, h: 2, spr: 'ta', s: { bedding: true }, on: S => ytaOn(S) },
          { id: 'ecdl', x: 18, y: 8, spr: 'candle', off: true, light: { r: 3, col: 'rgba(255,190,110,.18)', flick: true }, on: S => S.narr('燕生的油灯。灯盏是铁的，磨得发亮。') },
          { id: 'ysack', x: 20, y: 11, spr: 'sack', on: S => ysackOn(S) },
          { id: 'edoor', x: 16, y: 12, spr: 'doorS', on: S => edoorOn(S) },
          { id: 'yanf', x: 19, y: 10, spr: '@yan', hidden: true, on: S => S.say('燕赤霞', '睡吧。它今晚不会再来了。') },
          { id: 'pl1', x: 16, y: 7, spr: 'pilian', hidden: true, z: 1 },
          /* 北院 */
          { id: 'lao', x: 8, y: 3, spr: '@laolao', dir: 2, hidden: true, solid: false },
          { id: 'fu', x: 10, y: 3, spr: '@fu', dir: 1, hidden: true, solid: false },
          { id: 'qy', x: 19, y: 2, spr: '@qian', dir: 1, hidden: true, solid: false },
          { id: 'moon', x: 10, y: 2, spr: 'invisible', hidden: true, light: { r: 6, col: 'rgba(170,190,230,.12)' } },
          { id: 'ycw', x: 16, y: 4, spr: '@yecha', hidden: true, solid: false },
          /* 屋里的她 */
          { id: 'qr', x: 5, y: 9, spr: '@qian', dir: 1, hidden: true, solid: false },
          { id: 'qg', x: 6, y: 9, spr: '@qianG', dir: 1, hidden: true, solid: false }
        ],
        async enter(S, first) {
          light(S);
          const ph = S.f.ph;
          if (ph === 'a2') return nightOne(S);
          if (ph === 'n2' && S.f.dxDone) return confession(S);
          if (ph === 'd3b') {
            S.ent('ecdl').off = true;
            if (S.pl.x < 11) S.goal(S.has('puga') ? '把铺盖搬到燕生屋里（出门往东，隔壁那扇门）' : '把榻上的铺盖卷起来');
            else S.goal('把铺盖铺到空着的那张榻上');
          }
        }
      },
      /* ---------------- 寺北荒坟 ----------------
         六棵树，每棵树下一座坟：A 柳 (4,6)、B 白杨 (9,5)、C 槐 (15,6)、D 白杨 (21,5)、E 白杨 (6,11)、F 松 (19,11)。坟在树的正下方一格。
         三棵白杨的窝每局随机：乌巢（敞口）/ 喜鹊窝（封顶，上面蹲着老鸹）/ 窝掉在树根下。 */
      fen: {
        amb: 'wind', dark: .42, plr: 3.6, floor: 'dirt',
        legend: { 'G': 'fenG' },
        tileOpts: { grassC: '#34402a', treeC: '#1e2e1c' },
        rows: [
          'PTTPTTPTTPTTPTTPTTPTTPTTPT',
          'P""""""""""""""""""""""""T',
          'T""""""""""""""""""""""""P',
          'T""""""""""""""""""""""""P',
          'P"""""""""""""""""G""""""T',
          'T"G"""""""""G""""""""""""P',
          'P"""""""""""""""""""""""GT',
          'T""""""""d"""""""""""d"""P',
          'P"""d""""d"""""d"""""d"""T',
          'T"""d""""ddddddd"""""d"""P',
          'P""Bd""""""G"""""""""d"G"T',
          'T"""d"""""""""G""""""d"""P',
          'P"""d""""""""""""""""d"""T',
          'T"""dddddddddddddddddd""BP',
          'P"G"""""""""dd"""G"""""""T',
          'T"""""""G"""dd""B"""""G""P',
          'P"""""""""""dd"""""""""""T',
          'PTPTPTPTPTPTddPTPTPTPTPTPT'],
        ents: [
          { id: 'tA', x: 4, y: 6, spr: 'willow', on: S => treeOn(S, 'A') },
          { id: 'tB', x: 9, y: 5, spr: 'poplar', on: S => treeOn(S, 'B') },
          { id: 'tC', x: 15, y: 6, spr: 'huai', on: S => treeOn(S, 'C') },
          { id: 'tD', x: 21, y: 5, spr: 'poplar', on: S => treeOn(S, 'D') },
          { id: 'tE', x: 6, y: 11, spr: 'poplar', on: S => treeOn(S, 'E') },
          { id: 'tF', x: 19, y: 11, spr: 'song', on: S => treeOn(S, 'F') },
          { id: 'mA', x: 4, y: 7, spr: 'mound', on: S => digOn(S, 'A') },
          { id: 'mB', x: 9, y: 6, spr: 'mound', on: S => digOn(S, 'B') },
          { id: 'mC', x: 15, y: 7, spr: 'mound', on: S => digOn(S, 'C') },
          { id: 'mD', x: 21, y: 6, spr: 'mound', on: S => digOn(S, 'D') },
          { id: 'mE', x: 6, y: 12, spr: 'mound', on: S => digOn(S, 'E') },
          { id: 'mF', x: 19, y: 12, spr: 'mound', on: S => digOn(S, 'F') },
          { x: 12, y: 10, spr: 'gravestone', on: S => S.narr('一块倒了的石碑，字叫青苔吃得只剩一个「之」字。') },
          { x: 17, y: 15, spr: 'invisible', solid: true, on: S => S.narr('一座没有碑的荒坟，坟头上压着一块瓦片。不知道是谁的。') },
          { x: 12, y: 17, spr: 'invisible', touch: S => fenExit(S) },
          { x: 13, y: 17, spr: 'invisible', touch: S => fenExit(S) }
        ],
        async enter(S, first) {
          if (S.f.ph === 'd4') S.f.ph = 'dig';
          light(S);
          if (S.f.qy == null) {   // 这一局：哪棵白杨上是老鸹窝
            const r = ROLES.slice(); for (let i = r.length - 1; i > 0; i--) { const j = S.rand(i + 1); [r[i], r[j]] = [r[j], r[i]]; }
            S.f.pr = r; S.f.qy = r.indexOf('crow');
          }
          POP.forEach((k, i) => { const t = S.ent('t' + k); t.s.nest = S.f.pr[i]; t.s.perch = S.f.pr[i] === 'magpie'; });
          if (S.f.ph === 'dig' && S.once('fenIn')) {
            crow(S, 2, .03, .3);
            await S.narr('角门外是一片荒坟，一座挨一座，有的连碑都没有。\n几棵树稀稀拉拉地站在坟堆中间。风一过，有一种树的叶子哗啦啦地响。');
            await S.think('白杨之上，有乌巢者……\n燕生画的那张纸，得好好对一对。');
            coopG(S, '找「白杨之上，有乌巢者」，在树下挖（对照燕生的图：J 看笺）',
              '一人看笺（J）念燕生的图，一人认树：找「白杨之上，有乌巢者」');
            S.cp('fen');
          }
        }
      },
      /* ---------------- 宁家：书斋外的野地 ---------------- */
      jia: {
        amb: 'wind', dark: .22, plr: 4, floor: 'dirt', wall: 'mud',
        tileOpts: { grassC: '#3a4a2c', fenceBase: 'grass' },
        rows: [
          '####################',
          '####################',
          'fuuuu"########"####f',
          'fuuuu"########"####f',
          'fuuuu"########"####f',
          'fuuuu""""dddddddd""f',
          'fuuuu""""d""""""d""f',
          'f""""""""d""""""d""f',
          'dddddddddddddddddddf',
          'f""""""""""""""""""f',
          'f""""""""""""""""""f',
          'ffffffffffffffffffff'],
        ents: [
          { id: 'pit', x: 3, y: 6, spr: 'pit', on: S => pitOn(S) },
          { id: 'vat2', x: 8, y: 6, spr: 'vat', on: S => vatOn(S) },
          { x: 9, y: 4, spr: 'door', col: '#5a4430', on: S => S.narr(S.f.prayed ? '（回书斋去吧。）' : '你的书斋。门上的春联褪成了白色，「耕读传家」四个字还看得清。') },
          { x: 7, y: 4, spr: 'window', on: S => S.narr('书斋的窗正对着野地。坐在窗下读书，抬头就能看见那座新坟。') },
          { x: 11, y: 4, spr: 'window', on: S => S.narr('窗台上搁着你出门前没读完的一卷书，书页叫风翻到了最后一页。') },
          { x: 16, y: 4, spr: 'door', col: '#5a3a22', on: S => S.narr('堂屋。母亲在里头念佛，木鱼一声一声地响。') },
          { x: 17, y: 4, spr: 'window', lit: true, on: S => S.narr('堂屋的窗亮着。母亲的影子映在窗纸上，一动不动。') },
          { x: 0, y: 8, spr: 'invisible', touch: async S => { await S.narr('回渡口的路。船已经走了。'); S.pos(1, 8, 2); } },
          { x: 2, y: 3, spr: 'invisible', solid: true, on: S => S.narr('书斋外的野地，长着一人高的荒草。远处是水田，有人在田里唱秧歌。') },
          { id: 'qj', x: 4, y: 8, spr: '@qian', dir: 2, hidden: true, solid: false },
          { id: 'mu', x: 16, y: 5, spr: '@mu', dir: 1, hidden: true, solid: false }
        ],
        async enter(S, first) {
          light(S);
          if (!first) return;
          await S.narr('白天的野地，风里有稻子的味道。\n书斋外面，你昨天挖好的坑，还敞着口。');
          S.goal('把她葬进书斋外的新坟（野地边上那个坑）');
        },
        step(S, x, y) {
          if (S.f.prayed && !S.f.called && x >= 7) { S.f.called = true; return callBack(S); }
        }
      }
    }
  });

  /* ======================= 通用 ======================= */
  function R0(fn) {   // 追逐时院子里的东西一律不看：不弹对话，免得把夜叉停住
    return async S => { if (S.f.ph === 'run') return S.toast('没工夫看了——往南，去山门！'); return fn(S); };
  }
  function pushBack(S) { const p = S.pl; if (p.prev && (p.prev[0] !== p.x || p.prev[1] !== p.y)) S.pos(p.prev[0], p.prev[1]); else S.pos(p.x, p.y - 1); }

  /* ======================= 第一天：到寺 ======================= */
  function seeA1(S, k) {
    if (S.f.ph !== 'a1') return;
    const s = S.f.seen = S.f.seen || {};
    if (s[k]) return; s[k] = 1;
    if (Object.keys(s).length >= 3 && !S.f.dusk) { S.f.dusk = true; S.after(700, yanArrive); }
  }
  async function yanArrive(S) {
    S.f.ph = 'a1d'; S.dark(.48);
    bell(S, .045);
    await S.narr('太阳落下去了。满院的蓬蒿一下子全变成了黑的。\n远远地，城里的钟响了。');
    S.place('yan', 16, 22, 3); S.ent('yan').light = { r: 2.6, col: 'rgba(255,180,90,.2)', flick: true };
    S.sfx('open');
    await S.narr('山门「吱呀」一声。有人提着灯笼回来了。');
    S.goal('有人回来了——上去打个招呼');
    await S.walk('yan', [8, 5], 3.2);
    S.face('yan', 3); S.ent('ydoor').locked = false; S.sfx('switch');
    await S.wait(300);
    await S.walk('yan', [9, 6], 3);
    S.face('yan', 'pl');
    S.f.ph = 'a1y';
  }
  async function yanTalk(S) {
    S.face('yan', 'pl');
    const ph = S.f.ph;
    if (ph === 'a1y') return yanMeet(S);
    if (ph === 'd2b') return yanD2(S);
    if (ph === 'd3') return yanD3(S);
    if (ph === 'd4') return yanD4(S);
    return S.say('燕赤霞', '……');
  }
  async function yanMeet(S) {
    await S.say('宁采臣', '在下宁采臣，浙江人。城里的客店住不起，想在宝刹借住几日——不知寺里的师父在哪儿？');
    await S.say('燕赤霞', ['这里没有房主。我也是借住的。', '你要是不嫌荒凉，早晚能说说话，我求之不得。']);
    await S.think('听口音，不像本地人。');
    const c = await S.ask('……', ['「兄台也是来赶考的？」', '「兄台是哪里人？」'], '宁采臣');
    if (c === 0) await S.say('燕赤霞', '考试？我不考。');
    await S.say('燕赤霞', '我姓燕，字赤霞。秦人。');
    await S.narr('他话不多，说得很实在。背上背着一只旧箱箧，一走动，箱子里就有一点细细的、像铁片擦过的声音。');
    await S.say('燕赤霞', '西边那间跟我挨着，还算干净。夜里——听见什么，都别出来。');
    await S.walk('yan', [8, 5], 3); S.face('yan', 3); S.sfx('open'); S.hide('yan');
    /* 兰溪生主仆 */
    S.place('lanxi', 16, 22, 3); S.place('pu', 17, 22, 3);
    S.focus(16, 17);
    await S.narr('山门外又进来两个人：一个穿绸衫的书生，后面跟着个挑担子的仆人。');
    S.focus(null);
    const w1 = S.walk('lanxi', [29, 12], 3.4), w2 = S.walk('pu', [28, 12], 3.2);
    await S.say('兰溪生', ['嚯，这破庙里还有人！在下兰溪人，也是来赶考的。城里贵得吓死人……', '听说这种荒寺，夜里有狐仙出来陪读书人解闷。嘿嘿——正好。']);
    await S.say('仆人', '公子，东厢收拾出来了，您早点歇着。');
    await Promise.all([w1, w2]);
    S.hide('lanxi'); S.hide('pu'); S.ent('dxw').lit = true;
    S.f.ph = 'a2'; light(S); S.amb('night');
    S.goal('天黑了，回你那间僧舍歇下（燕生隔壁）');
  }
  async function doorNing(S) {
    const ph = S.f.ph;
    if (ph === 'run') return S.toast('不能进屋——它会堵住门！');
    if (ph === 'a1y') return S.narr('一间空僧舍，北墙上开着一扇小石窗。\n（那人就站在隔壁门口。先打个招呼，再住下。）');
    if (['a1', 'a1d'].includes(ph)) { seeA1(S, 'nd'); return S.narr('一间空僧舍，比别的几间干净些。北墙上开着一扇小石窗。\n（先等这里的主人回来，打声招呼再住下。）'); }
    if (ph === 'a2' || (ph === 'n2' && S.f.dxDone) || (ph === 'd3b' && !S.has('puga') && !S.f.bedMoved)) { S.sfx('open'); return S.go('fang', 5, 11, 3); }
    if (ph === 'n2') return S.narr('（先去东厢看看那个仆人。）');
    if (ph === 'd2' || ph === 'd2b') return S.narr('（东厢出了这样的事，哪还有心思回屋。）');
    if (ph === 'd3') return S.narr('（先跟燕生把同住的事说定。）');
    return S.narr('你住的那间僧舍。' + (S.f.bedMoved ? '铺盖已经搬走了，只剩一张光板榻。' : ''));
  }
  async function doorYan(S) {
    const ph = S.f.ph;
    if (ph === 'run') return S.toast('燕生不在屋里！他在山门外等你！');
    if (ph === 'a1' || ph === 'a1d') { seeA1(S, 'yd'); return S.narr('只有这一间，门上挂着一把新锁，锃亮锃亮的。\n——有人住。'); }
    if (ph === 'a1y') return S.narr('锁已经开了。屋子的主人就站在门口看着你。');
    if (ph === 'd3b') { if (!S.has('puga')) return S.narr('（先回自己屋里，把铺盖卷过来。）'); S.sfx('open'); return S.go('fang', 16, 11, 3); }
    if (ph === 'n2') return S.narr('燕生屋里黑着。隔着门，鼾声像打雷一样。');
    if (['d4', 'dig', 'run0'].includes(ph)) return S.narr('燕生一早就进城去了。门虚掩着，北窗上的石棂断了一根。');
    return S.narr('燕生的屋子。他说过，喜欢一个人清静。');
  }
  async function xiseng(S, i) {
    const ph = S.f.ph;
    if (ph === 'run') return S.toast('那边是死路！往南——山门！');
    if (ph === 'n2') return lureVoice(S);
    if ((ph === 'd4' || ph === 'dig') && !S.f.gotChu) { S.f.gotChu = true; S.give('chu'); return S.narr('塌了半边的僧舍里，墙角斜靠着一把旧锄头。\n大概是从前种菜的和尚留下的。'); }
    seeA1(S, 'xs');
    return S.narr(i === 1 ? '西边一排僧舍，门都虚掩着。推开一看，空的，炕上落满了灰和老鼠屎。' : '这间塌了半边屋顶，能看见天。墙上还贴着半张褪了色的门神，脸叫雨水泡没了。');
  }
  async function jiaoOn(S) {
    const ph = S.f.ph;
    if (ph === 'run') return S.toast('它就是从那边来的！往南——去山门！');
    if (ph === 'd4' || ph === 'dig') { if (!S.f.gotNang) return S.narr('门闩锈死了。（先去问问燕生。）'); S.sfx('open'); return S.go('fen', 12, 16, 3); }
    seeA1(S, 'jiao');
    return S.narr(ph === 'n2' ? '角门外黑漆漆的。风从门缝里钻进来，带着一股土腥味，还有……烧纸的味道。' : '北墙上一道小角门，门闩锈死了。门缝里吹进来一股凉气，带着土腥味。');
  }
  async function dongxiang(S) {
    const ph = S.f.ph;
    if (ph === 'run') return S.toast('不能进屋——往南，去山门！');
    if (['a1', 'a1d', 'a1y'].includes(ph)) { seeA1(S, 'dx'); return S.narr('东厢房，门窗都还严实。屋里空着。'); }
    if (ph === 'a2') return S.narr('东厢里亮着灯。兰溪生在里头哼小曲，哼的是什么「月下佳人」。');
    if (ph === 'd2' || ph === 'd2b') return S.narr('东厢的门大开着。屋里一股说不出的甜腥味，像放久了的胭脂。');
    if (ph === 'n2') return dxNight(S);
    return S.narr(S.f.puSaved ? '东厢空着。那个仆人走的时候，把门仔细带上了。' : '东厢空了。门口叠着两块白布。');
  }
  async function shanmenOn(S) {
    const ph = S.f.ph;
    if (ph === 'run') return escape(S);
    const T = { a1: '进来的山门。城里的客店贵得要命，今晚就在这寺里将就吧。', a1d: '（有人回来了。先打个招呼。）', a1y: '（有人回来了。先打个招呼。）', a2: '山门外黑得什么也看不见。（回屋歇下吧。）',
      d2: '（东厢出了这样的事……总不能一走了之。）', d2b: '（等燕生回来，问问他。）', n2: '山门外黑得什么也看不见。', d3: '（答应过小倩的事，还没办。）', d3b: '（答应过小倩的事，还没办。）',
      d4: '（燕生傍晚在山门外等——可还没找到她的骨头。）', dig: '（燕生傍晚在山门外等——可还没找到她的骨头。）' };
    await S.narr(T[ph] || '（还不能走。）');
    pushBack(S);
  }

  /* ======================= 第一夜 ======================= */
  async function nightOne(S) {
    S.f.ph = 'n1'; light(S); S.amb('night');
    S.ent('cdl').off = false;
    await S.narr('屋里一张旧榻、一张书案。你点上灯，把书箧放下。');
    await S.narr('夜深了。灯芯结了个花，「噼」地响了一声。');
    await S.think('换了个地方，翻来覆去，怎么也睡不着。');
    S.sfx('whisper'); await S.wait(600);
    await S.narr('北墙那边，隐隐约约有人在说话——喁喁的，像一家子人。');
    S.goal('北墙上的石窗外，有人在说话');
    S.cp('n1');
  }
  async function swinOn(S) {
    const ph = S.f.ph;
    if (ph === 'n1' && !S.f.peeked) return peek(S);
    if (ph === 'n1' || ph === 'n1g') return S.narr('石窗外是一道短墙，墙那边的小院子空了。\n月亮照在地上，白得像一层霜。');
    if (ph === 'n2b') return S.narr('窗外黑沉沉的。');
    return S.narr('北墙上的小石窗，几根石棂，从缝里能看见短墙外的小院。白天看，院里只有一地落叶和一口枯井。');
  }
  async function peek(S) {
    S.f.peeked = true;
    S.ent('swin').lit = true; S.show('moon');
    S.place('lao', 8, 3, 2); S.place('fu', 10, 3, 1);
    S.focus(10, 4);
    await S.narr('你伏在石窗底下往外看。短墙外头是个小院子，月亮照得雪白。\n院里站着一个四十来岁的妇人；还有一个老太婆，穿一身暗红的衣裳，头上插着一把大银梳，驼着背，腰都直不起来。');
    await S.say('妇人', '小倩怎么这么久还不来？');
    await S.say('老太婆', '快来了吧。');
    await S.say('妇人', '是不是又跟姥姥闹别扭了？');
    await S.say('姥姥', '没听她说起。不过看那样子，不大痛快。');
    await S.say('妇人', '那丫头，可不能待她太好了。');
    S.place('qy', 19, 2, 1);
    await S.walk('qy', [12, 3], 2.2); S.face('qy', 1);
    await S.narr('话没说完，一个十七八岁的姑娘走进了院子。\n月光落在她脸上——好看得，叫人不敢多看。');
    S.sfx('laugh');
    await S.say('姥姥', ['背地里不说人。我俩正念叨你呢，你这小妖婢就悄没声儿地来了，连个脚步响都没有。幸好没说你坏话。', '小娘子真跟画里的人一样。老身要是个男人，魂也叫你勾了去。']);
    await S.say('小倩', '姥姥不夸我，还有谁会说我好呢。', { style: 'whisper' });
    await S.narr('老太婆凑到她耳边，说了句什么。\n然后，慢慢地转过头来——正对着你这扇石窗。');
    S.face('lao', 0); S.bubble('lao', '…', 1600); S.sfx('sting');
    await S.wait(900);
    await S.think('（你赶紧把头低下去。）\n……大概是哪家的女眷吧。人家的家事，不听了。');
    await Promise.all([S.alpha('lao', 0, 800), S.alpha('fu', 0, 800), S.alpha('qy', 0, 800)]);
    S.focus(null); S.ent('swin').lit = false; S.hide('moon');
    S.goal('回榻上躺下吧');
  }
  async function bedW(S) {
    const ph = S.f.ph, b = S.ent('bed');
    if (ph === 'n1') { if (!S.f.peeked) return S.think('（北墙那边还有人在说话……先看看是谁，不然睡不着。）'); return qianComes(S); }
    if (ph === 'n1g') return goldOnBed(S);
    if (ph === 'd3b') {
      if (S.f.bedMoved || S.has('puga')) return S.narr('光板榻。铺盖已经卷走了。');
      b.s.bedding = false; S.give('puga');
      S.goal('把铺盖搬到燕生屋里（出门往东，隔壁那扇门）');
      return;
    }
    return S.narr(b.s.bedding ? '你的榻。草席有点扎人，被面是母亲缝的。' : '光板榻。');
  }
  async function qianComes(S) {
    S.cp('n1b');
    await S.narr('你吹了灯，躺下。院子里静了，什么声音也没有了。');
    await S.fade(1, 700);
    S.ent('cdl').off = true;
    await S.wait(500);
    await S.narr('迷迷糊糊快睡着的时候——你觉得屋里多了一个人。');
    S.pos(2, 9, 2); S.place('qr', 5, 9, 1); S.ent('qr').alpha = 1;
    await S.fade(0, 900);
    S.sfx('heart');
    await S.say('宁采臣', '……谁？');
    await S.narr('是北院那个姑娘。月光从石窗漏进来，照着她半边脸。');
    await S.say('小倩', '月亮这么好，睡不着。想来……陪陪公子。');
    let c = await S.ask('她看着你。', ['「你怕人说闲话，我也怕人说。一步走错，廉耻就全没了。」', '「……你坐吧。」', '「姑娘走错屋了。」'], '宁采臣');
    if (c === 1) await tempt(S);
    else {
      await S.say('小倩', c === 0 ? '夜里，没人知道的。' : '没走错。', { style: 'whisper' });
      await S.walk('qr', [4, 9], 1.6);
      c = await S.ask('她又往前挪了一步。', ['「快走！不然，我喊隔壁的燕生了！」', '（不说话）'], '宁采臣');
      if (c === 1) await tempt(S);
    }
    await S.say('宁采臣', '快走！不然，我喊隔壁的燕生了！');
    await S.narr('她怕了，一步一步退到门口。');
    await S.walk('qr', [5, 11], 2);
    await S.wait(500);
    await S.narr('走到门口，她又站住了。转回身来——');
    await S.walk('qr', [2, 8], 2);
    S.ent('bed').s.gold = true; clink(S);
    await S.narr('她把一样东西轻轻放在你的褥子上。一句话也没说，走了。');
    await S.walk('qr', [5, 11], 2);
    await S.alpha('qr', 0, 600);
    await S.narr('褥子上，躺着一锭黄澄澄的金子。');
    S.f.ph = 'n1g';
    S.goal('褥子上多了一锭金子');
    S.cp('gold');
  }
  async function tempt(S) {   // 留她坐下：再给一次回头的机会
    await S.narr('她挨着你坐了下来。身上一股凉凉的香气，像夜里的荷花。');
    await S.narr('她的袖子滑下来一截。袖口里有个东西，又细又尖，轻轻碰了一下你的脚踝。');
    const c = await S.ask('……', ['「你袖子里是什么？」（站起来）', '（闭上眼睛）'], '宁采臣');
    if (c === 0) {
      S.sfx('sting'); S.pos(2, 10, 2);
      await S.narr('你一下子跳了起来。她的手缩回袖子里，什么也没让你看见。');
      await S.think('……我这是怎么了。');
      return;
    }
    await S.fade(1, 1200);
    await S.end({ bad: true, id: 'meise', title: '足心一点凉', text: '她的手很凉，凉得像井水。\n你闭着眼睛，觉得脚心轻轻一疼，像被蚊子叮了一口——\n然后，什么都不疼了。\n\n第二天一早，燕生推开西边那间僧舍的门。\n书生躺在褥子上，眼睛半睁着，嘴角带着笑，像在做一个很长很好的梦。\n脚心有一个小孔，细细地，渗着血。\n\n北院里，老太婆的笑声，一直响到天亮。' });
  }
  async function goldOnBed(S) {
    const b = S.ent('bed');
    if (b.s.gold) {
      clink(S, .03);
      const c = await S.ask('一锭金子，压在你的褥子上。', ['扔出去：「不义之财，脏了我的口袋！」', '收起来', '先不管它'], '宁采臣');
      if (c === 0) return throwGold(S);
      if (c === 1) { b.s.gold = false; S.give('jin'); await S.think('……沉甸甸的。先收着，明天再说。'); S.goal('睡吧'); return; }
      return S.think('先不管它……可它就压在褥子上，叫人怎么睡。');
    }
    if (S.has('jin')) {
      await S.narr('你把金子揣在怀里躺下。\n它一点也没被焐热，反倒越来越凉——凉得像攥着一截骨头。');
      const c = await S.ask('……', ['起来，把它扔出门去', '就这么睡'], '宁采臣');
      if (c === 0) return throwGold(S);
      return badGold(S);
    }
    return sleepN1(S);
  }
  async function throwGold(S) {
    S.ent('bed').s.gold = false; S.take('jin');
    await S.walk('pl', [5, 11], 4.2); S.turn(0);
    const d = S.ent('wdoor'); d.open = true; S.sfx('open');
    await S.narr('你抓起金子，拉开门，一把扔到外头的石阶上。\n金子在石头上「当啷」跳了两下。');
    clink(S, .06);
    await S.say('宁采臣', '非义之物，污我囊橐！');
    await S.wait(600);
    await S.narr('院子里静了一会儿。\n有个人影蹲下去，把金子拾了起来。');
    await S.say('门外', '……这个人，怕是铁石做的。', { style: 'whisper' });
    d.open = false; S.sfx('close');
    S.f.threw = true;
    S.goal('睡吧');
  }
  async function badGold(S) {
    await S.fade(1, 1200);
    await S.end({ bad: true, id: 'jin', title: '非金也', text: '你把金子揣在怀里，睡着了。\n梦里，金子化开了，一只冰凉的手从里面伸出来，伸进你的胸口，慢慢地摸索着……\n\n第二天，燕生推开你的门。\n褥子上的书生面色如生，胸口一点伤也没有——\n只是心肝，不知道去了哪里。\n\n褥子边上，滚着一截黑黝黝的骨头。' });
  }
  async function wdoorOn(S) {
    const ph = S.f.ph;
    if (ph === 'n1g' && (S.ent('bed').s.gold || S.has('jin'))) {
      const c = await S.ask('把那锭金子扔出门去？', ['扔出去', '算了'], '宁采臣');
      if (c === 0) return throwGold(S);
      return;
    }
    if (ph === 'n1' || ph === 'n1g') return S.narr('门闩着。夜里，哪儿也别去了。');
    if (ph === 'n2b') return;
    S.sfx('open'); return S.go('si', 4, 5, 0);
  }
  async function sleepN1(S) {
    await S.narr('你躺下来，这一回，很快就睡着了。');
    await S.fade(1, 900);
    S.f.ph = 'd2';
    S.ent('dx').open = true; S.ent('dxw').lit = false;
    S.place('shi', 26, 13); S.place('pu', 28, 13, 1);
    S.sfx('cry');
    await S.card('第二天', '', '天刚亮，东厢那边有人在哭。');
    await S.go('si', 4, 5, 0);
  }

  /* ======================= 第二天：东厢 ======================= */
  function checkD2(S) {
    if (S.f.ph !== 'd2') return;
    if (!S.f.feet) return S.goal('看看门板上的兰溪生');
    if (!S.f.puAsked) return S.goal('跟那个仆人说几句');
    S.after(400, yanReturn);
  }
  async function shiOn(S) {
    if (S.f.feet) return S.narr('白布底下，他的脸还带着笑。');
    await S.narr('门板上躺着昨天那个兰溪来的书生。脸色白里透青，嘴角却还带着笑，像做了个好梦。');
    S.ent('shi').s.bare = true; S.f.feet = true;
    await S.narr('你掀开白布的一角。\n他的脚心上有一个小孔，像是被锥子扎的，细细的血丝还在往外渗。另一只脚，也是。');
    await S.narr('他的袖口里，露出半张折起来的纸。');
    await S.note('shi');
    await S.think('「她说脚冷，替我焐脚」……\n脚心上的孔，就是那时候扎的？');
    checkD2(S);
  }
  async function puTalk(S) {
    S.face('pu', 'pl');
    const ph = S.f.ph;
    if (ph === 'd2b') return S.say('仆人', '……');
    if (ph !== 'd2') return S.say('仆人', '公子……');
    if (S.f.puAsked) return S.say('仆人', '……');
    if (!S.f.puMet) {
      S.f.puMet = true;
      await S.say('仆人', ['我家公子……昨晚还好好的……', '半夜里，我听见他屋里有个女人在笑，又细又轻……我还当是在做梦……']);
    }
    if (!S.f.feet) { await S.think('（先看看他家公子……是怎么死的。）'); return checkD2(S); }
    const c = await S.ask('他抹着眼泪看你。', ['「听我的：天黑之前就走，别在寺里过夜。」', '「去城里报官吧。」', '「人死不能复生。节哀。」'], '宁采臣');
    S.f.puAsked = true;
    if (c === 0) {
      await S.say('宁采臣', ['你家公子脚心有个锥子扎的孔，袖子里还揣着昨夜写给一个女人的诗。', '这寺里，夜里有东西。天黑之前走。路上有人叫你、给你东西，都别理。']);
      await S.say('仆人', '可……可公子的灵柩……');
      await S.say('宁采臣', '先保住你自己。回头叫家里来人抬。');
      await S.say('仆人', '……我听宁相公的。');
      S.f.puSaved = true;
    } else if (c === 1) {
      await S.say('仆人', '报官……对，对，我这就进城！');
      S.f.puGuan = true;
    } else {
      await S.narr('他点点头，又跪回门板边上，一张一张地烧纸。');
    }
    if (S.f.puSaved || S.f.puGuan) { await S.walk('pu', [16, 22], 3.6); S.hide('pu'); }
    checkD2(S);
  }
  async function yanReturn(S) {
    if (S.f.ph !== 'd2') return;
    S.f.ph = 'd2b'; light(S);
    await S.narr('一整天就这么过去了。太阳偏西的时候，山门响了一声。');
    if (S.f.puGuan) {
      S.place('pu', 16, 22, 3);
      await S.walk('pu', [28, 13], 3.4); S.face('pu', 1);
      await S.say('仆人', '衙门说……是急病。叫我自己收殓。', { style: 'whisper' });
      S.f.puGuan = false;
    }
    S.place('yan', 16, 22, 3);
    await S.walk('yan', [10, 6], 3.4);
    S.face('yan', 'pl');
    S.goal('燕生回来了——问问他');
  }
  async function yanD2(S) {
    await S.say('宁采臣', '燕兄，东厢那位兰溪的朋友，昨夜死了。脚心有个小孔，像锥子扎的。');
    await S.say('燕赤霞', ['……是魅。', '你这人，太直。夜里关好门。']);
    await S.think('鬼魅？我宁采臣行得正、坐得直，怕它什么。');
    await S.walk('yan', [8, 5], 3); S.face('yan', 3); S.sfx('close'); S.hide('yan');
    return nightTwo(S);
  }

  /* ======================= 第二夜：夜巡东厢 ======================= */
  async function nightTwo(S) {
    await S.fade(1, 700);
    S.f.ph = 'n2'; light(S); S.amb('night');
    S.hide('shi'); S.hide('pu');
    ['g1', 'g2', 'g3', 'yao'].forEach(k => S.show(k));
    S.ent('yao').dir = 1;
    S.ent('dx').open = false;
    if (S.f.puSaved) { S.ent('dxw').lit = false; S.ent('dxw').s.sh = 0; } else { S.ent('dxw').lit = true; S.ent('dxw').s.sh = 1; }
    S.pos(4, 5, 0);
    await S.fade(0, 700);
    await S.narr('天黑透了。院子里的蓬蒿沙沙地响，一只夜鸟也没有。');
    if (S.f.puSaved) await S.think('那个仆人，天黑前走了没有？\n……还是去东厢看一眼。');
    else await S.think('那个仆人一个人守在东厢。\n昨天夜里，他家公子就是在那间屋里……\n去看看他。');
    coopG(S, '去东厢看看那个仆人（院里的东西，别捡别理）', '去东厢看看那个仆人（院里的东西别捡别理，两人互相盯着）');
    S.cp('n2');
  }
  async function lureGold(S, id) {
    if (S.f.ph !== 'n2') return;
    clink(S, .03);
    await S.narr('石缝里躺着一锭金子，月光底下黄澄澄的。\n跟昨晚褥子上那锭，一模一样。');
    const c = await S.ask('……', ['不理它', '捡起来'], '宁采臣');
    S.hide(id);
    if (c === 0) return S.think('你从它旁边走过去。身后「骨碌」一声——回头看，金子不见了。');
    S.give('jin');
    await S.think('……先收着。');
  }
  async function lureVoice(S) {
    if (S.f.voiceDone) return S.narr('门缝里黑黢黢的，什么声音也没有了。');
    await S.narr('门缝里黑黢黢的。有个女人在里头轻轻地笑：\n「宁相公……进来呀，外头冷。」');
    const c = await S.ask('……', ['走开', '推门进去看看'], '宁采臣');
    if (c === 0) { S.f.voiceDone = true; return S.think('你退了一步。门缝里的笑声，停了。'); }
    S.f.voiceDone = true;
    return lureHit(S, '你推开门。黑暗里伸出一只冰凉的手，一把攥住了你的脚踝——');
  }
  async function lureYao(S) {
    if (S.f.ph !== 'n2') return;
    const c = await S.ask('她背对着你，两只脚在黑水里一荡一荡的。「帮我捞一捞……」', ['走开', '过去帮她捞'], '宁采臣');
    if (c === 0) { await S.alpha('yao', 0, 900); return S.think('你转身就走。身后，水面「哗」地响了一声——再回头，池边空了。'); }
    await S.alpha('yao', 0, 300);
    return lureHit(S, '你刚蹲下，一只湿淋淋的手就搭在了你的脚背上——');
  }
  async function lureHit(S, txt) {
    S.f.lure = (S.f.lure || 0) + 1;
    if (S.f.lure === 1) {
      S.sfx('sting'); S.shake(300, 3);
      await S.narr(txt + '\n脚心一凉，像被针尖碰了一下！');
      await S.narr('你一脚踢开，跌坐在地上。再看时，什么也没有了。');
      await S.think('……锥子？\n兰溪生脚心的那个小孔……\n（这院子里的东西，一样也不能理。再有一回，就完了。）');
      return;
    }
    DIED.n2++;
    await S.scare('face', { spr: '@laolao', dur: .9 });
    await S.die('那只手凉凉的，握住了你的脚。\n脚心一疼，像被蚊子叮了一口——然后，什么都不疼了。\n\n你迷迷糊糊地躺在地上，月亮很好。\n有人蹲在你脚边，慢慢地，喝着什么。', '足心一点凉');
  }
  async function dxNight(S) {
    if (S.f.dxDone) return S.narr('东厢黑着。什么声音也没有了。');
    S.f.dxDone = true;
    if (S.f.puSaved) {
      S.ent('dx').open = true; S.sfx('open');
      await S.narr('东厢的门一推就开了。屋里黑着，空空的。\n桌上压着一张纸，是那个仆人留的，字写得很吃力：');
      await S.narr('「宁相公：听您的，天没黑就走了。公子的灵柩，回头叫家里人来抬。您也快走吧。」');
      await S.think('……走了就好。');
    } else {
      await S.narr('窗纸上映着灯光，还有两个影子：一个躺着；一个弯着腰，凑在他脚边。');
      const c = await S.ask('……', ['拍门大喊', '一脚踹开门'], '宁采臣');
      if (c === 1) {
        S.sfx('thud'); S.ent('dx').open = true;
        await S.scare('face', { spr: '@laolao', dur: 1 });
        await S.narr('门开的一瞬间，你看见床脚边蹲着一个穿红衣裳的老太婆，头上插着一把大银梳。\n她慢慢抬起头，冲你笑了一下——灯灭了。');
      } else {
        knock(S, 4);
        await S.say('宁采臣', '喂！醒醒！');
        await S.narr('窗上的影子一缩。灯「噗」地灭了。\n你推门进去，屋里一股甜腥味，像放久了的胭脂。');
        S.ent('dx').open = true;
      }
      S.ent('dxw').lit = false; S.ent('dxw').s.sh = 0;
      await S.narr('那个仆人躺在床上，眼睛半睁着，嘴角带笑。你喊他，他不应。\n脚心上，一个小孔，正一点一点往外渗血。');
      await S.think('……晚了。');
    }
    S.goal('回自己屋里去');
  }
  async function confession(S) {
    S.f.ph = 'n2b'; light(S);
    S.ent('cdl').off = true;
    S.place('qg', 6, 9, 1); S.ent('qg').alpha = .85;
    S.pos(5, 11, 3);
    await S.narr('屋里没点灯。石窗底下，站着一个人。');
    await S.say('小倩', ['我见过的人多了，没有一个像你这样硬心肠的。你是个君子，我不敢再骗你。', '我叫小倩，姓聂。十八岁上就死了，葬在这寺旁边。死后叫一个妖物拿住，逼着我涎着脸去找人——那不是我愿意的。']);
    await S.say('小倩', ['跟我亲近的，我拿锥子偷偷扎他的脚心，人就迷糊了，我把血取去给它喝。不然就给金子——那是罗刹鬼的骨头，留下它，心肝就会被截走。', (S.f.puSaved ? '东厢的人走了，' : '东厢的人也死了，') + '寺里已经没有能杀的人。它怕是要叫夜叉来——就在明天夜里。']);
    await S.say('宁采臣', '那我怎么办？');
    await S.say('小倩', '跟燕生睡一间屋，就没事。他是个奇人，我不敢近他。');
    if (S.has('jin')) {
      await S.narr('她忽然盯住你的胸口，脸色变了。');
      await S.say('小倩', '你……你身上揣着它？快扔了！');
      const c = await S.ask('……', ['从石窗扔出去', '留着'], '宁采臣');
      if (c === 1) return badGold(S);
      S.take('jin'); clink(S, .05);
      await S.narr('你把金子从石窗缝里扔了出去。窗外「当」的一声，再没有动静。');
    }
    S.sfx('cry');
    await S.say('小倩', '我掉在这黑海里，找不到岸。要是你肯把我的骨头装起来，带回去葬在安稳的地方——就像再生了我一回。');
    await S.ask('她跪了下去。', ['「好。你葬在哪里？」', '「我答应你。……葬在哪里？」'], '宁采臣');
    await S.say('小倩', '你只要记着：白杨树上，有老鸹窝的那一棵。');
    await S.narr('说完，她出了门，「纷」地一下，散得什么也没有了。');
    await S.alpha('qg', 0, 700);
    S.f.toldTree = true;
    return dayThree(S);
  }

  /* ======================= 第三天 / 第三夜：剑匣 ======================= */
  async function dayThree(S) {
    await S.fade(1, 900);
    S.f.ph = 'd3';
    ['g1', 'g2', 'g3', 'yao', 'pu', 'shi'].forEach(k => S.hide(k));
    S.ent('dx').open = false; S.ent('dxw').lit = false;
    S.place('yan', 10, 6, 1); S.ent('yan').light = null;
    await S.card('第三天', '', S.f.puSaved ? '东厢空着。\n那个仆人昨天傍晚就走了，走之前，朝你的门口磕了一个头。' : '东厢里又抬出一个人。是那个仆人。\n脚心，一个小孔，和他家公子一模一样。');
    await S.go('si', 4, 5, 0);
  }
  async function yanD3(S) {
    await S.say('宁采臣', '燕兄，今晚……我想搬过来，跟你同住一屋。');
    await S.say('燕赤霞', '我这人性子孤，喜欢一个人清静。');
    const c = await S.ask('……', ['「那我也得搬。」（硬把铺盖往他屋里搬）', '「……那算了。」'], '宁采臣');
    if (c === 1) return S.think('（可小倩说过：只有跟燕生同住一屋，才躲得过去。再求求他。）');
    await S.narr('燕生看了你半天，叹了口气。');
    await S.say('燕赤霞', ['罢了。我知道你是个大丈夫，心里很敬重你。只是我有些心事，一时说不明白。', '有一句你记好：我的箱子包袱，千万别翻看。违了这句，对你我都没好处。']);
    await S.say('宁采臣', '记下了。');
    S.f.ph = 'd3b';
    S.goal('回你屋里卷铺盖，搬到燕生屋里');
    await S.walk('yan', [8, 5], 3); S.face('yan', 3); S.hide('yan');
  }
  async function ntaOn(S) {
    const ph = S.f.ph;
    if (ph === 'd3b') {
      if (!S.has('puga')) return S.narr('一张空榻，是燕生替你搬过来的。');
      S.take('puga'); S.ent('nta').s.bedding = true; S.f.bedMoved = true;
      return nightThree(S);
    }
    if (ph === 'n3') return yachaNight(S);
    return S.narr('你的铺盖铺在这张榻上。');
  }
  async function nightThree(S) {
    await S.narr('你把被褥铺开。窗外，天一点一点黑下来。');
    await S.fade(1, 700);
    S.f.ph = 'n3'; light(S); S.amb('night');
    S.ent('ewin').s.box = true; S.ent('yta').s.who = 'yan'; S.ent('ecdl').off = false;
    S.ent('edoor').locked = true;
    S.pos(13, 9, 2);
    await S.fade(0, 700);
    await S.narr('燕生把背上那只旧箱箧取下来，搁在北窗的窗台上，这才躺下。\n没过一会儿，他就打起鼾来，鼾声像打雷一样。');
    snore(S, .06); CH.snore = 3;
    S.goal('躺下睡吧（别碰燕生的箱子）');
    S.cp('n3');
  }
  function snoreTick(S, dt) {
    if (S.map !== 'fang' || S.f.ph !== 'n3') return;
    CH.snore -= dt; if (CH.snore <= 0) { CH.snore = 3.4; snore(S, .045); }
  }
  async function ytaOn(S) {
    const ph = S.f.ph;
    if (ph === 'n3') return S.narr('燕生睡得正香，鼾声一阵比一阵响。推了推他——他翻个身，又打起来了。');
    return S.narr('燕生的榻。被褥叠得方方正正，枕头边上放着一块磨刀石。');
  }
  async function ysackOn(S) {
    if (S.f.ph === 'n3') return S.think('燕生的包袱。……他说过，箱子包袱千万别翻看。');
    return S.narr('燕生的包袱，用粗布扎得紧紧的。');
  }
  async function edoorOn(S) {
    const ph = S.f.ph;
    if (ph === 'n3') return S.narr('门闩着。燕生睡前亲手闩上的。');
    S.sfx('open'); return S.go('si', 8, 5, 0);
  }
  async function ewinOn(S) {
    const ph = S.f.ph, w = S.ent('ewin');
    if (ph === 'n3') {
      if (!S.f.boxLook) {
        S.f.boxLook = true; w.s.box = 'glow';
        await S.narr('燕生的箱箧搁在窗台上。黑漆木头，铜搭扣。\n箱缝里，隐隐约约透出一线白光，像月光，又比月光冷。');
        return S.think('（他说过：千万别翻看。）');
      }
      w.s.box = 'glow';
      const c = await S.ask('箱缝里那一线白光，一明一暗，像在喘气。', ['不碰它', '掀开一条缝看看'], '宁采臣');
      if (c === 0) { w.s.box = true; return S.think('……还是算了。'); }
      const c2 = await S.ask('手已经搭到铜搭扣上了。箱子里「嗡」的一声，像有什么醒了过来。', ['缩回手', '掀开'], '宁采臣');
      if (c2 === 0) { w.s.box = true; return S.think('你把手缩了回来。手心全是汗。'); }
      DIED.n3++;
      w.s.box = 'split'; swordHum(S, .08); S.fx('flash'); S.show('pl1');
      await S.wait(300);
      S.hide('pl1'); w.s.broken = true; S.show('ycw'); w.eyes = true;
      await S.scare('face', { spr: '@yecha', dur: 1 });
      return S.die('箱缝里那道白光「嗤」地窜了出去，没头没脑，撞断了窗上的石棂。\n冷风灌进屋里。\n燕生跳起来的时候，已经晚了：\n窗外那双像打闪一样的眼睛，顺着断开的窗棂，爬了进来。', '两俱不利');
    }
    if (w.s.broken) return S.narr('窗上的石棂断了一根，断口齐齐的，像被刀切开的。\n窗台外面，溅着几点黑红的血。');
    return S.narr('燕生屋里的北窗，几根石棂，外面也是那个小院子。');
  }
  async function yachaNight(S) {
    S.f.ph = 'n3b';
    await S.narr('你躺下来，睁着眼睛听燕生打鼾。');
    await S.fade(1, 900); await S.wait(400);
    await S.narr('……约莫一更天的时候。');
    S.ent('ecdl').off = true;
    await S.fade(0, 700);
    const y = S.ent('ycw'); S.show('ycw'); y.alpha = 0;
    S.focus(16, 5);
    await S.alpha('ycw', .5, 900);
    await S.narr('窗外，隐隐约约有一个人影。\n很高——比院墙还高。');
    await S.alpha('ycw', 1, 400);
    S.ent('ewin').eyes = true; S.sfx('heart');
    await S.narr('它慢慢凑到窗前，往里看。两只眼睛一闪一闪，像打闪。');
    await S.scare('face', { spr: '@yecha', dur: 1 });
    S.focus(null);
    knock(S); await S.wait(500);
    await S.say('门外', S.f.puSaved ? '宁相公……开开门……我又回来了……' : '宁相公……开开门……我家公子他……', { style: 'whisper' });
    await S.think(S.f.puSaved ? '……那个仆人？他不是走了吗？' : '……那个仆人？他不是已经……');
    const c = await S.ask('门外的人还在敲。', ['去开门', '叫醒燕生', '一动不动，装睡'], '宁采臣');
    if (c === 0) {
      DIED.n3++;
      S.ent('edoor').locked = false; S.sfx('open');
      await S.scare('face', { spr: '@yecha', dur: .9 });
      return S.die('门闩刚拉开一半，门外就没有声音了。\n只有一股腥风，和一双贴在门缝上的、电一样亮的眼睛。', '门外的人');
    }
    if (c === 1) await S.say('宁采臣', '燕——');
    S.ent('ewin').s.box = 'split'; S.show('pl1'); swordHum(S, .09); S.fx('flash'); S.shake(500, 4);
    await S.narr((c === 1 ? '话没出口——' : '') + '忽然有个东西撕开箱子窜了出去，亮得像一匹白绸，「咔」地撞断了窗上的石棂，一闪就射了出去，又一下缩了回来，像闪电灭了。');
    S.hide('pl1'); S.ent('ewin').s.broken = true; S.ent('ewin').eyes = false;
    S.sfx('scream'); await S.alpha('ycw', 0, 400);
    S.ent('ewin').s.box = true;
    S.ent('yta').s.who = null; S.place('yanf', 19, 9, 1);
    await S.walk('yanf', [16, 8], 3); S.face('yanf', 3);
    await S.narr('燕生醒了。你赶紧装睡，眯着眼看他：他捧起箱子，取出一样东西对着月光闻了闻——\n白光莹莹的，二寸来长，韭菜叶那么宽。他一层一层包好，放回破箱子里。');
    await S.say('燕赤霞', '什么老魅，这么大胆子，把我的箱子都弄坏了。', { style: 'whisper' });
    S.face('yanf', 'pl');
    await S.say('宁采臣', '燕兄……刚才那是什么？');
    await S.say('燕赤霞', ['既然你看见了，也不瞒你。我，是个剑客。', '要不是窗上那根石棂挡了一下，那妖物当场就死了。不过，它也伤得不轻。']);
    const c3 = await S.ask('……', ['「能让我看看吗？」', '「……原来如此。」'], '宁采臣');
    if (c3 === 0) await S.narr('燕生很爽快地拿出来给你看——是一把小剑，荧荧的，像一片会发光的冰。');
    return dayFour(S);
  }

  /* ======================= 第四天：革囊、白杨、骨殖 ======================= */
  async function dayFour(S) {
    await S.fade(1, 900);
    S.f.ph = 'd4';
    S.hide('ycw'); S.hide('yanf'); S.ent('edoor').locked = false;
    ['xue1', 'xue2', 'xue3', 'xueI'].forEach(k => S.show(k));
    S.place('yan', 28, 4, 2);
    await S.card('第四天', '', '天亮了。打那一夜起，你更敬重燕生了。\n北墙根底下，一路滴着黑红的血点子，一直滴到角门边上。');
    await S.go('si', 8, 5, 0);
  }
  async function yanD4(S) {
    if (S.f.gotNang) return S.say('燕赤霞', '太阳落山之前，到山门外来找我。');
    await S.say('燕赤霞', '血是那东西的。它往寺北去了——那边是一片荒坟。');
    await S.say('宁采臣', '燕兄，那姑娘求我把她的骨头带回家安葬。她说：「白杨之上，有乌巢者」。');
    await S.say('燕赤霞', '白杨？我们秦地，满山都是白杨。');
    await S.narr('燕生从怀里摸出一截炭条，在一张纸背上画了几笔，递给你。');
    await S.note('yanyu');
    await S.say('燕赤霞', ['这个也给你。是我的剑袋——破是破了，揣在身上，那些东西就不敢近你。', '记着：它扑过来的时候，站稳了别动。这袋子要人站定了才灵。补丁就三块，撑不了几回。']);
    S.give('nang');
    await S.say('燕赤霞', '我进城去替你雇船。太阳落山之前，我在山门外等你。');
    const c = await S.ask('……', ['「燕兄，教我剑术吧。」', '「多谢燕兄。」'], '宁采臣');
    if (c === 0) await S.say('燕赤霞', '像你这样讲信义、性子刚直的人，本来是可以学的。只是你是富贵中人，不是我们这一路的人。');
    await S.narr('燕生走到角门前，一拳砸在锈死的门闩上。「哐」的一声，门闩开了。');
    S.sfx('thud'); S.ent('jiao').locked = false;
    S.f.gotNang = true;
    S.goal('找把锄头（西边塌了的僧舍），从北墙角门去寺北荒坟');
    await S.walk('yan', [16, 22], 3.6); S.hide('yan');
  }
  const TREE_TXT = {
    A: '一棵老柳树。树皮又黑又糙，裂成一道道深沟，枝条一直垂到坟头上。\n高处有个敞着口的大窝，枯枝搭的，像只破碗。一只老鸹蹲在窝沿上，冲你「呱」了一声。',
    C: '一棵老槐。树干拧得像绞过的绳子，皮黑褐黑褐的，叶子密得透不过光。\n高处一个敞口的窝，两只老鸹挤在里面。',
    F: '一棵松树。针叶又黑又密，树底下落满了松针。\n树上什么也没有。'
  };
  const POP_BASE = '这棵树笔直，树皮灰白，上面一个个黑疤，像睁着的眼睛。\n风不大，叶子却哗啦啦响个不停，一翻，就露出白白的叶背。\n';
  const POP_NEST = {
    crow: '树梢上搭着一个窝：枯枝堆的，敞着口，像只大碗。窝沿上探出两个黑脑袋。',
    magpie: '树梢上一个窝，圆滚滚的，顶也用枯枝封得严严实实，侧面开着个小洞。\n一只老鸹蹲在窝顶上，歪着头看你。',
    fallen: '树上光秃秃的，什么也没有。\n树根底下倒摔着一个散了架的鸟窝，几根枯枝里夹着两片黑羽毛。'
  };
  function roleOf(S, k) { const i = POP.indexOf(k); return i < 0 ? null : S.f.pr[i]; }
  async function treeOn(S, k) {   // 看树时镜头抬到树梢，窝看得见
    const t = S.ent('t' + k); S.focus(t.x, Math.max(0, t.y - 3));
    if (TREE_TXT[k]) { if (k !== 'F') crow(S, 1, .025); await S.narr(TREE_TXT[k]); }
    else { const r = roleOf(S, k); if (r === 'crow' || r === 'magpie') crow(S, 1, .025); await S.narr(POP_BASE + POP_NEST[r]); }
    S.focus(null);
  }
  const WHY = {
    A: '柳树皮是黑的，枝条垂着——这不是白杨。',
    C: '这是棵槐树。她说的是白杨。',
    F: '松树上连个窝都没有。',
    magpie: '那窝是封顶的，门开在侧面——是喜鹊窝。老鸹只是蹲在上面歇脚。',
    fallen: '窝摔在地上了。她说的是「白杨之上」。'
  };
  const BONES = ['土底下露出一副骨头——粗大的，是个男人。骷髅头上还扣着半顶烂了的方巾。', '一口薄棺材，棺盖一碰就碎了。里面的骨头缩成一团，手指骨紧紧抠着棺板。', '一副老人的骨头，牙都掉光了。骨头边上搁着一只空酒葫芦。'];
  async function digOn(S, k) {
    const m = S.ent('m' + k), d = m.s.dug || 0;
    if (d === 3) return S.narr('空坑。她已经在你怀里了。');
    if (d === 1) return S.narr('刚刨开又填回去的坟，土还是松的。……对不住了。');
    if (S.f.ph !== 'dig') return S.narr('一座没有碑的荒坟。');
    const c = await S.ask('树下的这座坟，没有碑。', ['在这里挖', '再想想'], '宁采臣');
    if (c) return;
    if (!S.has('chu')) return S.think('（空着手可刨不开。西边塌了的僧舍里，好像有把锄头。）');
    for (let i = 0; i < 3; i++) { S.sfx('thud'); S.shake(120, 1); await S.wait(380); }
    const ok = POP[S.f.qy];
    if (k === ok) return foundBones(S, k);
    S.f.wrong = (S.f.wrong || 0) + 1; m.s.dug = 1; light(S);
    S.sfx('sting'); S.shake(260, 2);
    await S.narr(BONES[(S.f.wrong - 1) % BONES.length]);
    await S.narr('你赶紧把土填回去，对着坟作了三个揖。\n天，又暗了一截。');
    if (n1st(S)) { thump(S, .06); await S.narr('怀里的剑袋「嗤」地一响——坟里冒出来的冷气，把一块补丁冲裂了。\n（剑袋只剩两块补丁了。再挖错，惊动的只会更多。）'); }
    const n = S.f.wrong, why = WHY[k] || WHY[roleOf(S, k)];
    let hint = why;
    if (n === 2) hint += '\n（白杨……燕生说，皮是灰白的，长着「眼睛」，叶背发白。这里只有三棵那样的。）';
    else if (n === 3) hint += '\n（三棵白杨：北边偏西一棵、东北角一棵、西边坟堆中间一棵。只有一棵树上的窝，是敞着口、像碗的。）';
    else if (n >= 4) hint += `\n（就是${POP_AT[ok]}——树梢上那个像碗一样的窝。）`;
    await S.think(hint);
  }
  function n1st(S) { if (S.f.bagLost) return false; S.f.bagLost = 1; return true; }
  async function foundBones(S, k) {
    const m = S.ent('m' + k);
    m.s.dug = 2;
    await S.narr('锄头碰到了一块朽木板。\n板子底下，是一副小小的骨头，蜷着，像个睡着的孩子。几缕黑头发还缠在头骨上。');
    await S.narr('骨头边上，压着一块烂了一半的木牌。');
    await S.note('pai');
    await S.say('宁采臣', '……我来接你了。');
    await S.narr('你脱下身上的青衫，把骨头一根一根捡起来，包好，抱在怀里。\n轻得像一捆柴。');
    m.s.dug = 3; S.give('gu');
    S.f.ph = 'run0'; light(S);
    crow(S, 5, .05); bell(S, .04, .8);
    S.shake(300, 2);
    await S.narr('就在这时，一大群老鸹「呼」地从白杨上炸了起来，满天乱叫。\n城里的暮钟响了。太阳沉下去了。');
    await S.say('风里', '……谁动了我的丫头？', { style: 'whisper' });
    S.norun(true); S.speed(WALK_K);
    coopG(S, '抱着她回寺里，从南边山门出去（跑不起来）', '抱着她回寺里，从南边山门出去（跑不起来；一人走，一人喊停）');
  }
  async function fenExit(S) {
    if (S.f.ph === 'run0') { S.f.ph = 'run'; return S.go('si', 29, 2, 0); }
    return S.go('si', 29, 2, 0);
  }

  /* ======================= 夜叉追逐 ======================= */
  function chaseSetup(S) {
    S.f.bag = 3 - (S.f.bagLost || 0); S.f.warned = false;
    ['gd1', 'gd2', 'gd3', 'gd4', 'gd5'].forEach(k => S.show(k));
    ['yan', 'lanxi', 'pu', 'shi', 'g1', 'g2', 'g3', 'yao', 'xueI'].forEach(k => S.hide(k));
    S.show('bagl'); S.hide('yc'); S.ent('yc').alpha = 1;
    S.norun(true); S.speed(WALK_K);
    for (const k in CH) CH[k] = 0;
  }
  function chaseReset(S) {
    S.stop('yc'); S.freeze('yc', false); S.hide('yc'); S.ent('yc').alpha = 1; S.ent('yc').light = null;
    S.norun(true); S.speed(WALK_K); S.show('bagl'); S.lights(null); light(S);
    for (const k in CH) CH[k] = 0;
  }
  function chaseSpawnSoon(S) { CH.spawn = 4.5; CH.pend = 1; }
  function chaseTick(S, dt) {
    if (S.f.ph !== 'run' || S.map !== 'si') return;
    const p = S.pl, y = S.ent('yc');
    if (CH.flash > 0) { CH.flash -= dt; if (CH.flash <= 0) S.lights(null); }
    if (CH.pend) {   // 夜叉从北墙头跳下来：只落在离玩家至少 4 步的墙根；玩家磨蹭不走，先给一句提醒
      if (S.busy) return;
      CH.spawn -= dt;
      const pt = spawnPt(S), gone = Math.abs(p.x - 29) + Math.abs(p.y - 2) >= 5;
      if (pt && (gone || CH.spawn <= 0)) { CH.pend = 0; CH.pt = pt; S.run(spawnYc); }
      else if (!pt && CH.spawn <= 0 && !CH.nag) { CH.nag = 1; S.bubble('pl', '!', 1200); S.toast('墙头上有东西在看着你——快走！'); }
      return;
    }
    if (!y || y.hidden || !y.chase) return;
    if (CH.slow > 0) { CH.slow -= dt; if (CH.slow <= 0) S.speed(WALK_K); }
    if (CH.frz > 0) {
      CH.frz -= dt;
      if (CH.frz <= 0) { S.freeze('yc', false); y.light = null; }
      else if (CH.frz < .6 && !CH.thaw) { CH.thaw = 1; y.light = { r: 1.5, flick: true, col: 'rgba(220,235,255,.3)' }; }
    }
    const yt = Math.round(y.px / TS) + ',' + Math.round(y.py / TS);
    if (yt !== CH.yt) { CH.yt = yt; const dd = Math.hypot(y.px - p.px, y.py - p.py) / TS; S.tone('sine', 74, 38, .2, Math.max(.015, .09 - dd * .008), 0, 380); }   // 夜叉的脚步：越近越重
    CH.still = S.moving ? 0 : (CH.still || 0) + dt;
    const d = Math.hypot(y.px - p.px, y.py - p.py) / TS;
    const lv = S.f.bag > 0 && CH.frz <= 0 ? (d < 3 ? 2 : d < 5 ? 1 : 0) : 0;   // 剑袋越近越亮
    if (lv !== CH.lv) { CH.lv = lv; S.ent('bagl').light = { r: [1.3, 1.9, 2.5][lv], pl: true, flick: lv > 0, col: ['rgba(210,180,120,.14)', 'rgba(235,205,135,.24)', 'rgba(255,225,150,.34)'][lv] }; }
    CH.beat -= dt; if (d < 6 && CH.beat <= 0 && CH.frz <= 0) { S.sfx('heart'); CH.beat = .3 + d * .12; }
    if (d <= BAG_R + 1.2 && S.f.bag > 0 && CH.frz <= 0 && !CH.ping) { CH.ping = 1; S.tone('triangle', 1760, 1750, .18, .05, 0); S.tone('triangle', 2640, 2630, .14, .03, .06); }   // 剑袋「叮」：现在站住！
    if (d > 4.5) CH.ping = 0;
    if (!S.busy && CH.frz <= 0 && S.f.bag > 0 && d <= BAG_R && CH.still >= .12) repel(S);
  }
  function repel(S) {
    S.f.bag--; CH.frz = FRZ_T; CH.thaw = 0; S.freeze('yc', true);
    S.ent('yc').light = { r: 1.5, col: 'rgba(220,235,255,.34)' };   // 定住：身上罩一层冷白的光，快解冻时一闪一闪
    thump(S, .12); S.shake(260, 3); S.bubble('yc', '!', 900);
    S.lights([[S.pl.px + 8, S.pl.py + 4, 3.6, .9]]); CH.flash = .3;
    S.toast(S.f.bag ? `剑袋猛地鼓了起来——它被定住了！快走！（补丁还剩 ${S.f.bag} 块）` : '最后一块补丁「嗤」地裂开了——它被定住了！快走！');
  }
  const SPAWN = [[29, 2], [31, 2], [27, 2], [32, 3], [25, 3]];
  function spawnPt(S) {
    const p = S.pl; let best = null, bd = 3;
    for (const q of SPAWN) { const dd = Math.abs(q[0] - p.x) + Math.abs(q[1] - p.y); if (dd > bd) { bd = dd; best = q; } }
    return best;
  }
  async function spawnYc(S) {
    const best = CH.pt || spawnPt(S) || SPAWN[0];
    S.place('yc', best[0], best[1], 0); S.ent('yc').alpha = 0;
    S.bubble('pl', '!', 900); thump(S, .1); S.shake(400, 3);
    await S.alpha('yc', 1, 600);
    S.sfx('scream');
    S.chase('yc', { spd: YC_SPD, catch: ycCatch, wait: .5 });
  }
  function knockBack(S) {   // 被骨头撞开：退到离玩家 4~5 步、离它原来位置最近的一格
    const m = curMap(), y = S.ent('yc'), p = S.pl, yx = Math.round(y.px / TS), yy = Math.round(y.py / TS);
    let best = null, bd = 1e9;
    for (let dx = -5; dx <= 5; dx++) for (let dy = -5; dy <= 5; dy++) {
      const x = p.x + dx, yv = p.y + dy, md = Math.abs(dx) + Math.abs(dy);
      if (md < 4 || md > 5 || !passable(m, x, yv, y)) continue;
      const dd = Math.abs(x - yx) + Math.abs(yv - yy);
      if (dd < bd) { bd = dd; best = [x, yv]; }
    }
    if (best) S.place('yc', best[0], best[1], 0);
  }
  async function ycCatch(S) {
    if (!S.f.warned) {
      S.f.warned = true;
      S.sfx('sting'); S.shake(500, 4); S.fx('flash');
      knockBack(S);
      await S.narr('一只爪子从背后扫过来——\n怀里的骨头忽然一烫，「嗡」的一声，把那东西撞出去老远！');
      await S.think('（是她在护着你……可这只能有一回。）');
      S.chase('yc', { spd: YC_SPD, catch: ycCatch, wait: .6 });
      return;
    }
    DIED.run++;
    S.lights(null);
    await S.scare('face', { spr: '@yecha', dur: 1 });
    await S.die('一只爪子从背后扣住了你的肩膀。\n怀里的青衫包「哗」地散开，骨头撒了一地。\n\n你最后听见的，是墙头上一个老太婆在笑：\n「我的丫头，谁也带不走。」', '夜叉');
  }
  async function escape(S) {
    S.stop('yc'); S.freeze('yc', false); CH.frz = 0; CH.pend = 0; S.lights(null); S.ent('yc').light = null;
    S.ent('shanmen').open = true; S.sfx('open');
    S.place('yan', 18, 22, 1); S.ent('yan').light = { r: 3, col: 'rgba(255,180,90,.22)', flick: true };
    await S.say('燕赤霞', '低头！');
    S.fx('flash'); swordHum(S, .09); S.shake(500, 4);
    await S.narr('一道白光从你头顶上掠过去，像一匹白绸抖开。\n身后一声惨叫——那东西捂着脸，翻过墙头，逃了。');
    S.sfx('scream');
    const y = S.ent('yc'); if (y && !y.hidden) await S.alpha('yc', 0, 500);
    S.norun(false); S.speed(1); S.hide('bagl');
    await S.say('燕赤霞', '船在渡口。走吧。');
    await S.narr('燕生一直把你送到河边。临上船，他看了一眼你怀里的青衫包。');
    await S.say('燕赤霞', '那只剑袋，好好收着。');
    S.f.ph = 'ep';
    await S.fade(1, 900);
    await S.card('数日后', '浙江　宁家', '你把她带回了家。\n书斋外面就是野地。\n你在那里，给她挖了一座坟。');
    await S.go('jia', 1, 8, 2);
  }

  /* ======================= 尾声：宁家 ======================= */
  async function pitOn(S) {
    const p = S.ent('pit'), st = p.s.st || 0;
    if (st === 0) {
      if (!S.has('gu')) return S.narr('挖好的坑。');
      S.take('gu'); p.s.st = 1;
      await S.narr('你把青衫包轻轻放进坑里，一捧一捧地把土盖上，\n又把那块烂木牌插在坟前。');
      await S.narr('烂木牌旁边，你另插了一块新削的木板，用墨写上：「聂氏小倩之墓」。\n她娘没能来接她。如今，有人接她回家了。');
      S.goal('舀一瓯浆水来祭她（书斋门口的水缸）');
      return;
    }
    if (st === 1) {
      if (!S.has('jiang')) return S.think('（空着手祭她，总不像样。书斋门口的水缸里，还有半缸米浆水。）');
      S.take('jiang'); p.s.st = 2;
      await S.narr('你把那瓯浆水摆在坟前，作了个揖。');
      await S.say('宁采臣', ['可怜你孤魂一个。如今葬在我书斋边上，你哭，我听得见；我唱，你也听得见。往后，再没有恶鬼能欺负你了。', '一瓯浆水，不清，也不甜——别嫌弃。']);
      await S.narr('风从野地里吹过来。坟头上的新土，簌簌地落下来一点。');
      S.f.prayed = true;
      S.goal('回书斋去吧');
      return;
    }
    return S.narr('新坟。木牌前摆着一瓯浆水。');
  }
  async function vatOn(S) {
    const st = S.ent('pit').s.st || 0;
    if (st === 1 && !S.has('jiang')) { S.give('jiang'); return S.narr('你从缸里舀了一瓯米浆水。不清，也不甜。'); }
    return S.narr('书斋门口的水缸，缸里泡着半缸米浆水，是母亲留着浆衣裳的。');
  }
  async function callBack(S) {
    await S.wait(300);
    hum(S, .02);
    await S.say('身后', '缓待同行！——等等我，一起走！');
    S.turn(1);
    const p = S.pl, qx = Math.max(1, p.x - 4);
    S.place('qj', qx, 8, 2); S.ent('qj').alpha = 0;
    await S.alpha('qj', 1, 800);
    await S.narr('你回过头。\n是小倩。');
    const adj = [[p.x - 1, p.y], [p.x, p.y + 1], [p.x, p.y - 1], [p.x + 1, p.y]].find(([x, y]) => passable(curMap(), x, y, S.ent('qj')));
    if (adj) await S.walk('qj', adj, 2.4);
    S.face('qj', 'pl');
    await S.say('小倩', ['你讲信义，我就是死十回也报答不了。', '让我跟你回去，拜见婆婆。就是做个丫头，也不后悔。']);
    await S.narr('太阳底下，你第一回把她看清楚：脸上像映着晚霞。\n白天看，比夜里还要好看。');
    await S.ask('她看着你。', ['「走吧。我带你去见我娘。」', '「……走吧。」'], '宁采臣');
    S.follow('qj', true);
    await S.walk('pl', [15, 5], 3.4);
    S.turn(2); S.place('mu', 16, 5, 1); S.sfx('open');
    await S.say('母亲', '儿啊，你可回来了……这、这位姑娘是——');
    S.follow('qj', false); S.face('qj', 2);
    await S.narr('小倩从你身后走出来，低着头，给老人家行了个礼。\n母亲看着她，半天说不出话来。');
    await S.fade(1, 1200);
    const head = '你告诉母亲，她是谁、从哪里来。\n老太太吓得不敢留她。小倩不敢住下，每天天不亮就来，烧水做饭，洗衣扫地；天黑了，再自己回野地里的坟去。\n\n她起初什么也不吃。过了半年，才慢慢能喝一点稀粥。\n后来宁的妻子病故，母亲做了主，宁采臣娶了小倩。\n\n有一夜，她叫人把燕生那只破革囊挂到门上。半夜里，一个东西像鸟一样扑下来——电一样的眼睛，血红的舌头。\n革囊「格」地一响，一下胀得有筐那么大，里面探出半截什么，把那东西揪了进去。\n囊口一合，又缩回了原样。两个人凑过去看：袋子里，只有几斗清水。\n\n又过了几年，宁采臣中了进士。小倩给他生了一个儿子。\n书斋外那座坟前，一新一旧两块木牌，一直并排立着。';
    const pu = '\n\n那年秋天，兰溪托人捎来一封信，字写得很吃力：\n「宁相公，我还活着。」';
    await S.end(S.f.puSaved ? { id: 'pu', title: '东厢没有再死人', text: head + pu } : { id: 'home', title: '缓待同行', text: head });
  }
})();
