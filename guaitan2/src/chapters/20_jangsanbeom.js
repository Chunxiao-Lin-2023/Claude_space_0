/* ================= 第二十夜 · 长山虎（卷二收束） ================= */
(() => {
  /* ---------- 它只会学听过的话：本章所有「假的声音」都是下面这些句子，一字不差 ---------- */
  const M1 = '门锁好，早点睡。';                                  // 妈妈傍晚出门时
  const M2 = '在宇，冰箱里有小菜，热一热，跟秀雅一起吃。';           // 妈妈傍晚出门时
  const MC = '秀雅呀——出来一下，妈妈要走了。';                     // 妈妈傍晚出门时朝里屋喊
  const L1 = '哥！你看，我画的外婆！';                               // 秀雅在房间里
  const L2 = '哥，外面好像有流水声。';                               // 秀雅倒完厨余进门时
  const L4 = '哥——开门！是我，秀雅！外面好冷！';                    // 秀雅被关在后门外时
  const L3 = '妈妈什么时候回来呀？';                                 // 秀雅在房间里
  const ME = '秀雅，咱们约个暗号吧。';                               // 你自己说的
  /* 暗号：问题由你写，答案由秀雅写——答案从来没有被说出口 */
  const ANGO = [
    { q: '我们在外婆家的秘密基地在哪儿？', a: '外婆衣柜最下面那一层', say: '……外婆衣柜最下面那一层。上次捉迷藏，你找了我一个钟头。' },
    { q: '去年冬天，哥哥踩断了我的什么？', a: '蓝色的蜡笔', say: '……蓝色的蜡笔。你还赖是我自己踩断的。' },
    { q: '秀雅最讨厌吃什么？', a: '黄瓜', say: '……黄瓜。哥，我想回家。' }
  ];
  const SLOTS = [[4, 7], [12, 10], [19, 7]], SLOTN = ['左边', '水潭前面', '右边'];
  let lastDeath = null;   // 跨重来保留：死过一次，重来时给一句规则小结
  /* 暗号存在秀雅书桌实体的 e.s 上：会同步给客机，客机的「囊」「笺」里也看得到 */
  function angoK() { try { const e = W && W.maps && W.maps.house && W.maps.house.ents.find(z => z.id === 'desk'); if (e && e.s && e.s.ango != null) return e.s.ango; } catch (err) { } return W && W.f && W.f.ango != null ? W.f.ango : null; }

  /* ---------- 地图小工具 ---------- */
  function grid(w, h, c) {
    const g = [...Array(h)].map(() => Array(w).fill(c));
    const api = {
      set(x, y, ch) { if (y >= 0 && y < h && x >= 0 && x < w) g[y][x] = ch; return api; },
      rect(x0, y0, x1, y1, ch) { for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) api.set(x, y, ch); return api; },
      rows() { return g.map(r => r.join('')); }
    };
    return api;
  }
  const N = t => S => S.narr(t);

  /* ---------- 合成音：铃铛、电话、手机震动、它的喘气 ---------- */
  function bell(S, v = .05, d = 0) { S.tone('sine', 2093, 2093, .7, v, d); S.tone('sine', 3136, 3136, .45, v * .5, d + .01); S.tone('sine', 4699, 4699, .25, v * .22, d + .02); }
  function ring(S) { for (let i = 0; i < 2; i++) for (let k = 0; k < 10; k++) S.tone('square', k % 2 ? 1046 : 1318, k % 2 ? 1046 : 1318, .045, .022, i * 1.1 + k * .05, 2600); }
  function buzz(S) { for (let i = 0; i < 3; i++) S.tone('sawtooth', 118, 112, .32, .05, i * .55, 320); }
  function breath(S, v = .05) { S.tone('sawtooth', 96, 62, .7, v, 0, 260); S.tone('triangle', 180, 120, .6, v * .5, .08, 500); }

  /* ================= 画面 ================= */
  const PEOPLE = {
    me: { skin: '#f0cfa8', hair: '#1a1416', hs: 'messy', top: '#2c3e5c', top2: '#e8e8e8', bottom: '#23283a', shoes: '#e8e8e8' },
    suah: { child: true, skin: '#f6d7b8', hair: '#2a1c18', hs: 'twin', top: '#f2b8c6', top2: '#ffffff', bottom: '#f2b8c6', shoes: '#f6a8b8', blush: true },
    mom: { skin: '#eccaa4', hair: '#2a1c18', hs: 'bob', top: '#7a6650', top2: '#e8e0d0', bottom: '#2a2a30', coat: true, shoes: '#3a3030' },
    cop: { skin: '#e8c8a0', hair: '#141414', hs: 'short', top: '#2a3a5a', top2: '#c8d0e0', bottom: '#1a2238', hat: 'cap', hatC: '#1a2a4a', shoes: '#111' }
  };
  const ITEMS = {
    light: { name: '手电筒', desc: '外婆家的老手电筒，要拍两下才亮。光圈发黄。' },
    band: { name: '兔子创可贴', desc: '储藏间急救箱里翻出来的，粉色，印着小兔子。秀雅一定喜欢。' },
    slipper: { name: '秀雅的拖鞋', desc: '粉色的小拖鞋，左脚。鞋面上沾着湿泥，还缠着一根白色的长毛。' },
    cell: { name: '手机', desc: '你的手机。电量还剩两格。' },
    banchan: { name: '小菜和米饭', desc: '炒鱼饼、豆芽、半碗冷米饭。热一热就能吃。' },
    diary: { name: '暗号纸条', get desc() { const k = angoK(), a = k != null ? ANGO[k] : null; return a ? '秀雅撕给你的半张画纸。\n问：「' + a.q + '」\n答：' + a.a + '\n（只能写，不能说出口。）' : '秀雅撕给你的半张画纸，写着你们俩的暗号。'; } }
  };
  const NOTES = {
    post: { title: '论坛帖子：长山那边真的有「那个」吗', text: '【匿名】住海云台的进来说说。\n小时候外婆不让我傍晚上长山，说山上有「长山범」——白色的，毛很长，四条腿着地跑，比人还快。\n它不咬人。它学人说话。\n\n↳ 回复1：我舅舅说，他在登山路上听见我外婆叫他的名字。我外婆那时候已经走了三年了。\n↳ 回复2：我听过的版本是，它的叫声像瀑布，哗哗的，引人往水边走。\n↳ 回复3：又是这种帖子。野猫叫春吧。\n↳ 回复4：……我家就在长山脚下。昨晚，有人在门外用我女儿的声音叫我开门。\n　　我女儿当时就躺在我旁边。\n↳ 回复5：楼上别吓人。\n↳ 回复6（楼主）：楼上那位，后来呢？\n\n（回复4 再也没有回来过。）' },
    grandma: { title: '外婆的记事本', text: '（外婆的字歪歪扭扭，有韩文，也有汉字。这一页折了个角。）\n\n长山的老人说：山里有个白毛的东西。它不咬人，它叫人。\n用你娘的声音叫，用你孩子的声音叫。\n\n它学得像极了。可它只会学它听过的话——听过一句，就学一句，一个字也不改。\n夜里有自家人在门外叫，先别应。问一件只有自家人知道的事。\n暗号写在纸上，莫说出口。说出口的话，它都听得见。\n\n听见没有水的地方有流水声，就关窗。\n长山的瀑布，离这儿要走半个钟头。\n\n——秀雅房间的窗户，插销坏了。等我出院，叫在宇修。' },
    diary: {
      title: '秀雅的画本',
      get text() {
        const k = angoK(), a = k != null ? ANGO[k] : null;
        return '（秀雅的画本。一页画着外婆躺在病床上，旁边写着「外婆快点好」。一页画着哥哥，头发画成了一只刺猬。）\n\n最新的一页，用铅笔写着：\n「我和哥哥的暗号。不能说出来，只能写！」\n\n' + (a ? '问：「' + a.q + '」\n答：' + a.a + '\n\n（答案是秀雅用手挡着写的。写完，她把这半张撕下来塞给了你。）' : '（暗号那半张，在另一个人手里。让他念给你听。）') + '\n\n「嘘——！」';
      }
    },
    board: { title: '登山口的告示板', text: '【长山登山路　安全须知】\n· 日落后至日出前，请勿进入登山路。\n· 夜间迷路请留在原地，拨打 119。\n· 请勿在溪谷、瀑布附近逗留。\n\n（底下贴着一张褪了色的寻狗启事：白色珍岛犬，三岁，在登山口附近走失。\n手写的一行：「它是听见我叫它，才往山上跑的。可我那天根本没出门。」）\n\n（告示板的角落，有人用马克笔写了一行小字：\n「夜里在山上听见家里人叫你，别应。」）' }
  };

  /* ---------- 惊吓大头像：一大片湿漉漉的白毛，当中一张学着人样的灰脸，黑眼睛，嘴慢慢张开喊「哥」 ---------- */
  const FACES = {
    beom(R, a, t) {
      const W1 = '#ece9e1', W2 = '#cfcbc1', W3 = '#a9a49a', SK = '#9a948c', SK2 = '#7a746e';
      R(0, 0, 32, 32, '#040406');
      R(1, 0, 30, 32, W1);
      for (let i = 0; i < 15; i++) { const x = 1 + ((i * 7) % 29), y = (i * 5) % 9; R(x, y, 1, 20 + (i % 4) * 3, i % 3 ? W2 : W3); }
      R(9, 8, 14, 18, SK); R(10, 7, 12, 1, SK); R(10, 26, 12, 2, SK2); R(9, 8, 1, 18, SK2); R(22, 8, 1, 18, SK2);   // 太窄、太长的灰脸
      R(8, 6, 3, 14, W1); R(21, 6, 3, 14, W1); R(12, 5, 8, 4, W1);   // 白毛从两边压到脸上
      for (let i = 0; i < 5; i++) R(10 + i * 3, 6, 1, 6 + (i % 2) * 5, W2);
      const bl = Math.sin(t * 9) > .93 ? 1 : 0;
      R(11, 13, 4, 3 - bl, '#050505'); R(18, 13, 4, 3 - bl, '#050505');   // 全黑的眼睛
      if (!bl) { R(12, 13, 1, 1, '#ffffff'); R(19, 13, 1, 1, '#ffffff'); }
      R(15, 17, 2, 3, SK2);
      const k = Math.min(1, a * 1.5);
      if (k < .35) { R(12, 22, 8, 1, '#3a1012'); R(11, 21, 1, 1, '#3a1012'); R(20, 21, 1, 1, '#3a1012'); }   // 先学人笑
      else {
        const h = 2 + Math.round((k - .35) * 8);
        R(12, 21, 8, h, '#4a0e12'); R(13, 22, 6, h - 1, '#120204');
        for (let i = 0; i < 5; i++) { R(13 + i, 21, 1, 1, '#e8e2d4'); R(13 + i, 21 + h - 1, 1, 1, '#d8d2c4'); }   // 一圈细小的牙
      }
      R(0, 26, 32, 6, W1); for (let i = 0; i < 8; i++) R(i * 4 + 1, 25, 2, 7, W2);
      R(3, 20, 3, 1, 'rgba(120,150,170,.6)'); R(26, 18, 2, 1, 'rgba(120,150,170,.6)');   // 水珠
    }
  };

  /* ---------- 道具精灵 ---------- */
  const SPRITES = {
    beom(g, e, t, R) {   // 四脚着地的一团白毛（客机读 e.fr 判断在走）
      const b = e.fr ? 1 : 0, fl = e.dir === 2;
      const X = x => fl ? 16 - x : x, RX = (x, y, w, h, c) => R(fl ? 16 - x - w : x, y, w, h, c);
      void X;
      RX(-4, 13, 24, 3, 'rgba(0,0,0,.35)');
      RX(-3, 2 - b, 21, 11, '#e6e3db'); RX(-4, 4 - b, 23, 7, '#e6e3db'); RX(-2, 0 - b, 14, 3, '#d8d4ca');
      for (let i = 0; i < 9; i++) RX(-3 + i * 2 + (i % 2), 6 - b + (i % 3), 1, 7 + (i % 2), i % 2 ? '#c4bfb4' : '#d6d2c8');
      RX(-3, 12, 2, 3 + b, '#cfcbc1'); RX(3, 12, 2, 3 - b, '#cfcbc1'); RX(10, 12, 2, 3 - b, '#cfcbc1'); RX(15, 12, 2, 3 + b, '#cfcbc1');
      if (e.dir !== 3) { RX(-5, 3 - b, 6, 7, '#8e887f'); RX(-4, 5 - b, 2, 2, '#050505'); RX(-1, 5 - b, 2, 2, '#050505'); RX(-3, 8 - b, 3, 1, '#3a1012'); RX(-6, 1 - b, 8, 3, '#e6e3db'); }
    },
    beomS(g, e, t, R) {   // 瀑布顶上站起来的高影子
      const s = Math.round(Math.sin(t * 1.3));
      R(2, -30, 12, 45, 'rgba(232,228,220,.9)'); R(0, -22, 16, 30, 'rgba(232,228,220,.85)');
      for (let i = 0; i < 7; i++) R(1 + i * 2, -18 + (i % 3) * 3, 1, 32 + s, 'rgba(190,186,178,.9)');
      R(5, -27, 6, 7, '#8e887f'); R(6, -25, 1, 2, '#050505'); R(9, -25, 1, 2, '#050505');
    },
    kphone(g, e, t, R) {   // 墙上的座机
      box(R, 4, 1, 8, 11, '#d8d0bc'); R(5, 2, 6, 3, '#b8ae98'); R(3, 2, 2, 8, '#c8bea8'); R(3, 2, 2, 1, '#e8e0cc');
      for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) R(6 + i * 2, 6 + j * 2, 1, 1, '#5a5448');
      R(4, 11, 1, 4, '#3a3a3a'); if (e.off) { R(3, 12, 3, 4, '#c8bea8'); }
    },
    pc(g, e, t, R) {   // 书桌 + 大屁股显示器
      box(R, 0, 4, 16, 11, '#6a5038'); R(1, 5, 14, 2, '#7e6448');
      box(R, 2, -9, 12, 11, '#d8d4c8'); R(3, -8, 10, 8, e.power ? '#3a5a8a' : '#151a1c');
      if (e.power) { R(4, -7, 6, 1, '#c8d8f0'); for (let y = -5; y < -1; y += 2) R(4, y, 3 + ((y * 7) & 3), 1, '#9ab0d0'); }
      R(6, 2, 4, 2, '#b8b4a8'); R(3, 9, 9, 2, '#e8e4d8');
    },
    kdoor(g, e, t, R) {   // 下墙上的铁皮门（从屋里看）
      R(0, 0, 16, 16, '#2a2622');
      if (e.open) { R(2, 2, 12, 14, '#05070a'); R(2, 2, 2, 14, '#5a4a3a'); R(5, 10, 6, 1, 'rgba(160,180,200,.25)'); return; }
      if (e.chain) { box(R, 2, 1, 9, 15, '#6a4a32'); R(11, 1, 3, 15, '#05070a'); R(11, 4, 3, 7, '#d8d4ca'); R(12, 6, 1, 1, '#050505'); R(8, 7, 5, 1, '#c8c8c8'); return; }
      box(R, 2, 1, 12, 15, '#6a4a32'); R(3, 2, 10, 1, '#7e5c40'); R(11, 8, 2, 2, '#c9a35a'); R(7, 4, 2, 2, '#1a1410'); R(7, 4, 1, 1, '#8a9aa8');
      R(3, 7, 4, 1, '#9a9a9a'); R(6, 7, 1, 3, '#9a9a9a');
    },
    kwin(g, e, t, R) {   // 秀雅房间的窗：插销坏了，关不严
      box(R, 1, 0, 14, 12, '#5a4632');
      R(2, 1, 12, 10, '#0a1220');
      R(2, 7, 4, 4, '#101a14'); R(5, 5, 4, 6, '#0e1812'); R(9, 6, 5, 5, '#101a14');   // 长山的影子
      R(11, 2, 1, 1, '#c8d0e0');
      if (e.s.fur) { R(3, 3, 9, 8, '#d8d4ca'); R(5, 5, 2, 2, '#050505'); R(9, 5, 2, 2, '#050505'); }
      R(7, 1, 1, 10, '#5a4632');
      const sw = e.open ? Math.round(Math.sin(t * 2.2) * 2) : 0;
      if (e.s.cur) { R(2, 1, 12, 10, '#c89aa8'); for (let x = 3; x < 14; x += 3) R(x, 1, 1, 10, '#a87a8a'); }
      else { R(2 + sw, 1, 3, 10, '#c89aa8'); R(11 - sw, 1, 3, 10, '#c89aa8'); }
    },
    kbed(g, e, t, R) {   // 小床（1×2）：full = 秀雅在睡，open = 被子掀开
      const c = '#e8a8b8';
      box(R, 1, -2, 14, 32, '#8a6a4a'); R(2, -1, 12, 4, '#9a7a5a'); R(3, 3, 10, 6, '#f4f0e6');
      if (e.full) {
        R(5, 2, 6, 6, '#2a1c18'); R(6, 4, 4, 4, '#f6d7b8'); R(7, 6, 1, 1, '#3a2a2a'); R(9, 6, 1, 1, '#3a2a2a');
        R(2, 8, 12, 21, c); R(2, 8, 12, 2, shade(c, .2)); R(3, 12, 10, 3, shade(c, -.08)); R(12, 14, 2, 2, '#e8c040');
      } else if (e.open) { R(2, 18, 12, 11, c); R(2, 18, 12, 2, shade(c, .2)); R(3, 10, 10, 7, '#f0ece2'); R(4, 11, 3, 2, '#e6e0d4'); }
      else { R(2, 10, 12, 19, c); R(2, 10, 12, 2, shade(c, .2)); }
    },
    nlamp(g, e, t, R) { R(5, 3, 6, 6, '#f8d8e0'); R(6, 4, 3, 4, '#fff4f8'); R(9, 3, 2, 2, '#e8b8c8'); R(7, 9, 2, 2, '#c8c0c0'); },
    rabbit(g, e, t, R) { R(5, 6, 6, 8, '#f0ece4'); R(5, 0, 2, 7, '#f0ece4'); R(9, 0, 2, 7, '#f0ece4'); R(6, 1, 1, 4, '#f2b8c6'); R(10, 1, 1, 4, '#f2b8c6'); R(6, 8, 1, 1, '#222'); R(9, 8, 1, 1, '#222'); R(4, 13, 8, 2, '#d8d2c6'); },
    onggi(g, e, t, R) {   // 酱缸
      R(0, 12, 16, 3, 'rgba(0,0,0,.3)');
      R(1, 4, 8, 10, '#5a3a24'); R(2, 3, 6, 2, '#6a4a30'); R(2, 2, 6, 1, '#3a2418'); R(2, 6, 2, 5, '#7a5236');
      R(9, 7, 6, 7, '#5a3a24'); R(10, 6, 4, 2, '#6a4a30'); R(10, 5, 4, 1, '#3a2418');
    },
    kit(g, e, t, R) {   // 墙边的旧柜子，上面一个急救箱
      box(R, 0, 2, 16, 13, '#6a5038'); R(1, 8, 14, 1, '#4a3420'); R(7, 10, 2, 1, '#c9a35a');
      box(R, 3, -4, 10, 7, '#f0ece4'); R(7, -3, 2, 5, '#c83030'); R(5, -1, 6, 1, '#c83030');
    },
    calendar(g, e, t, R) { box(R, 3, 0, 10, 12, '#f0ece4'); R(3, 0, 10, 3, '#c83030'); for (let i = 0; i < 4; i++) for (let j = 0; j < 3; j++) R(4 + i * 2, 4 + j * 2, 1, 1, '#6a6a6a'); R(10, 8, 1, 1, '#c83030'); },
    frame(g, e, t, R) { box(R, 2, 1, 12, 10, '#6a4a2a'); R(3, 2, 10, 8, '#c8bca4'); R(4, 5, 2, 4, '#4a3a2a'); R(7, 4, 2, 5, '#5a4a3a'); R(10, 6, 2, 3, '#e8a8b8'); R(4, 3, 2, 2, '#e8c8a0'); R(7, 3, 2, 1, '#e8c8a0'); },
    slipper(g, e, t, R) { R(4, 8, 8, 5, '#f2a8b8'); R(5, 7, 6, 2, '#f8c8d4'); R(5, 12, 6, 1, '#c87888'); R(11, 6, 3, 1, '#e6e3db'); R(12, 5, 2, 1, '#e6e3db'); },
    dog(g, e, t, R) {   // 狗窝 + 缩着的珍岛犬
      box(R, 0, -2, 16, 15, '#7a5a3a'); R(-1, -4, 18, 3, '#5a3a24'); R(4, 3, 8, 10, '#1a120c');
      const sh = e.s.quiet ? 0 : (Math.sin(t * 30) > 0 ? 1 : 0);
      R(5 + sh, 7, 6, 6, '#e8e2d6'); R(6 + sh, 6, 1, 2, '#e8e2d6'); R(9 + sh, 6, 1, 2, '#e8e2d6'); R(6 + sh, 9, 1, 1, '#222'); R(9 + sh, 9, 1, 1, '#222'); R(7 + sh, 11, 2, 1, '#3a3030');
    },
    keiji(g, e, t, R) { R(2, -2, 2, 17, '#4a3826'); R(12, -2, 2, 17, '#4a3826'); box(R, 0, -10, 16, 11, '#3a5a3a'); R(-1, -12, 18, 2, '#2a3a2a'); R(2, -8, 6, 7, '#e8e2d0'); R(9, -8, 5, 5, '#e8d8a0'); R(3, -6, 4, 1, '#666'); R(10, -6, 3, 1, '#a33'); R(10, -4, 3, 1, '#666'); },
    tsign(g, e, t, R) { R(7, -4, 2, 18, '#5a4630'); box(R, 0, -12, 16, 9, '#6a5236'); R(2, -10, 9, 1, '#e8e0c8'); R(2, -7, 6, 1, '#e8e0c8'); R(12, -10, 2, 4, '#e8e0c8'); R(11, -9, 4, 1, '#e8e0c8'); },
    cctv(g, e, t, R) { R(7, -20, 2, 35, '#5a5d62'); R(4, 13, 8, 2, '#3a3d42'); box(R, 8, -20, 7, 4, '#d8d8d8'); R(13, -19, 1, 1, (t * 2 | 0) % 2 ? '#ff3030' : '#601010'); box(R, 2, -10, 12, 6, '#f0d040'); R(3, -8, 10, 1, '#222'); },
    doltap(g, e, t, R) {   // 石塔
      R(2, 12, 12, 3, 'rgba(0,0,0,.3)');
      R(2, 10, 12, 4, '#6a6660'); R(3, 7, 10, 4, '#7a766e'); R(4, 4, 8, 4, '#6e6a62'); R(5, 1, 6, 4, '#8a867e'); R(6, -2, 4, 4, '#7a766e'); R(7, -4, 2, 3, '#8e8a82');
      R(3, 8, 3, 1, '#5a5650'); R(9, 5, 2, 1, '#5a5650');
    },
    tie(g, e, t, R) { const b = Math.sin(t * 4) > 0 ? 1 : 0; R(5, 6 + b, 6, 3, '#f06a8a'); R(7, 5 + b, 2, 5, '#f06a8a'); R(7, 6 + b, 2, 3, '#ffd0dc'); if (!e.read) R(7, 1 + b, 2, 2, '#ffe680'); },
    brock(g, e, t, R) {   // 水潭边的大石头
      R(-4, 12, 24, 4, 'rgba(0,0,0,.4)');
      R(-4, -2, 24, 15, '#4a4844'); R(-2, -5, 18, 4, '#5a5852'); R(0, -7, 12, 3, '#62605a'); R(-3, 0, 6, 4, '#5e5c56'); R(10, 2, 8, 3, '#55534d');
      R(-4, 11, 24, 2, '#33312e'); R(2, 4, 1, 6, '#3a3834'); R(12, -3, 1, 5, '#3a3834');
      R(-2, -4, 4, 1, '#3a5a3a'); R(14, -1, 3, 1, '#3a5a3a');
      if (e.s.hand) { R(16, 6, 4, 3, e.s.hand === 'red' ? '#e89a8a' : '#d8d6d0'); if (e.s.band) R(18, 6, 2, 1, '#f2a8c0'); }
    },
    waterfall(g, e, t, R) {   // w=4, h=4：从崖顶挂下来的白水
      const w = e.w * 16;
      R(4, 0, w - 8, 60, 'rgba(200,214,224,.55)');
      for (let i = 0; i < 10; i++) { const x = 5 + ((i * 5) % (w - 10)), off = ((t * 90 + i * 23) % 60) | 0; R(x, off - 10, 2, 14, 'rgba(240,246,250,.75)'); R(x + 1, (off + 30) % 60 - 6, 1, 10, 'rgba(230,240,246,.6)'); }
      for (let i = 0; i < 8; i++) { const s = Math.sin(t * 6 + i) * 2; R(i * 8 - 2 + s, 56, 8, 4, 'rgba(230,238,244,.55)'); }
    },
    pcar(g, e, t, R) {   // 警车（侧面，w=3）
      R(1, 13, 46, 2, 'rgba(0,0,0,.4)'); box(R, 0, -2, 48, 15, '#e8e8ea'); R(8, -8, 28, 7, '#e8e8ea'); R(10, -7, 11, 5, '#2a3440'); R(23, -7, 11, 5, '#2a3440');
      R(0, 4, 48, 3, '#1a3a8a'); R(16, -11, 12, 3, '#202020');
      const ph = (t * 4 | 0) % 2; R(16, -11, 6, 3, ph ? '#ff3030' : '#601010'); R(22, -11, 6, 3, ph ? '#203060' : '#3070ff');
      R(6, 10, 8, 5, '#1a1a1a'); R(34, 10, 8, 5, '#1a1a1a'); R(8, 11, 4, 3, '#777'); R(36, 11, 4, 3, '#777');
    }
  };

  /* ---------- 瓦片：黄色油纸地板（장판）、瓦屋顶、崖壁 ---------- */
  const TILES = {
    jangpan: { solid: false, paint(R, X, Y) { R(0, 0, 16, 16, '#c8a25a'); R(0, 15, 16, 1, '#a8843e'); R(15, 0, 1, 16, '#b8944c'); if (hash(X, Y, 41) < .3) R(((hash(X, Y, 42) * 10) | 0) + 2, ((hash(X, Y, 43) * 10) | 0) + 3, 4, 1, '#b8924a'); } },
    roof: { solid: true, paint(R, X, Y) { R(0, 0, 16, 16, '#3a3e48'); for (let y = 0; y < 16; y += 4) { R(0, y + 3, 16, 1, '#262a32'); for (let x = (y / 4 % 2) * 2; x < 16; x += 4) R(x, y, 1, 3, '#4c5260'); } } },
    cliff: { solid: true, paint(R, X, Y) { R(0, 0, 16, 16, '#2a2a2c'); for (let i = 0; i < 5; i++) { const h = hash(X, Y, 50 + i); R((h * 13) | 0, (hash(X, Y, 60 + i) * 13) | 0, 3 + (i % 2), 2, i % 2 ? '#3a3a3c' : '#1c1c1e'); } if (hash(X, Y, 70) < .3) R(2, 12, 6, 2, '#2c3e2c'); } }
  };

  /* ================= 剧本 ================= */
  const learnLeft = S => [!S.f.readPost && '电脑上的帖子', !S.f.readNote && '外婆房间里的记事本'].filter(Boolean);
  function learnGoal(S) {
    const L = learnLeft(S);
    if (L.length) return S.goal('看看：' + L.join('、'));
    S.f.ph = 'ango'; S.goal('跟秀雅约一个暗号（写在纸上，不说出口）');
  }
  async function caught(S, kind, msg, title) {
    lastDeath = kind; S.clearTimer(); S.stop('beom'); S.norun(false); S.amb('none');
    await S.scare('face', { spr: '@beom', face: 'beom', dur: 1.1 });
    await S.die(msg, title);
  }

  /* ---------- 傍晚：妈妈出门 ---------- */
  async function houseEnter(S, first) {
    const f = S.f;
    if (first) {
      S.face('mom', 3); S.give('cell', true);
      await S.narr('长山脚下，外婆家。\n傍晚六点多，天已经黑得差不多了。后窗外面，整座山黑沉沉地压在屋顶上。');
      S.face('mom', 'pl');
      await S.say('妈妈', ['在宇，妈妈得回医院了。外婆夜里离不开人。', M2]);
      await S.say('妈妈', '……外婆今天醒了一会儿，一直拉着我的手说「窗户」「窗户」。也不知道想说什么。');
      S.face('mom', 3);
      await S.say('妈妈', MC);
      await S.say('秀雅（里屋）', '……我在画画！妈妈拜拜——！');
      await S.narr('妈妈叹了口气，弯腰穿鞋。');
      S.face('mom', 'pl');
      await S.say('妈妈', [M1, '明天一早我就回来。']);
      S.sfx('open'); await S.walk('mom', [15, 14], 3); S.hide('mom'); S.sfx('close');
      await S.narr('铁门「咣」地合上了。\n妈妈的脚步声沿着巷子，一下一下地远了。');
      f.ph = 'eve'; S.goal('去看看秀雅（右上的房间）');
    }
  }
  async function suahTalk(S) {
    const f = S.f; S.face('suah', 'pl');
    if (f.ph === 'eve') {
      await S.narr('秀雅趴在书桌上，蜡笔涂得满手都是。她举起画本，转过来给你看——');
      await S.say('秀雅', L1);
      await S.narr('画上是一个躺在床上的老奶奶，旁边画了一个很大很大的太阳。');
      await S.think('（她房间的窗户开着一条缝。窗外就是黑漆漆的长山。）');
      await S.say('秀雅', ['外婆说，晚上要关这扇窗……可是插销坏了，关不上。', L3]);
      await S.say('你', '明天早上。……饿了吧？哥给你热饭。');
      f.ph = 'food'; S.goal('热一下冰箱里的小菜（厨房在左下）');
      return;
    }
    if (f.ph === 'food') return S.say('秀雅', ['哥，我饿了——', '冰箱里有炒鱼饼！我要吃炒鱼饼！'][(f._sf = ((f._sf ?? -1) + 1) % 2)]);
    if (f.ph === 'trash') return;
    if (f.ph === 'learn') {
      const L = learnLeft(S);
      if (!f.readPost) return S.say('秀雅', ['电脑上那个帖子，我只看了一半就不敢看了。', '……哥，你帮我看看后面写的什么。']);
      return S.say('秀雅', L.length ? '外婆房间的抽屉里有本记事本。外婆老在上面写字，还不让我看。' : '……哥？');
    }
    if (f.ph === 'ango') return angoScene(S);
    if (f.ph === 'tobed') return bedtime(S);
    await S.say('秀雅', '……');
  }
  async function fridgeUse(S) {
    const f = S.f;
    if (f.ph === 'food' && !S.has('banchan') && !f.ate) { S.give('banchan', true); S.sfx('open'); await S.narr('冰箱里塞满了保鲜盒：泡菜、炒鱼饼、豆芽、煎蛋卷……\n冰箱门上用磁铁吸着一张便签：「医院 703 病房」。\n你把炒鱼饼和米饭拿了出来。'); return S.goal('在灶台上热一热'); }
    await S.narr(f.ph === 'door' || f.ph === 'call2' ? '冰箱嗡嗡地响。\n在这么安静的夜里，连这个声音都让人发毛。' : '冰箱门上吸着一张便签：「医院 703 病房」，是妈妈的字。\n底下还有一张秀雅画的冰箱贴：一只很胖的猫。');
  }
  async function stoveUse(S) {
    const f = S.f;
    if (f.ph === 'food' && S.has('banchan')) return dinner(S);
    await S.narr('煤气灶。锅底还留着一点妈妈早上煮的大酱汤，已经凉了。');
  }
  async function dinner(S) {
    const f = S.f;
    S.take('banchan'); S.sfx('switch');
    await S.narr('你把米饭和炒鱼饼热好，端到客厅的小饭桌上。\n「秀雅——吃饭了！」');
    await S.fade(1, 500);
    S.place('suah', 12, 9, 0); S.pos(13, 11, 3); S.ent('tv').power = true;
    await S.fade(0, 500);
    await S.narr('秀雅吃得很香，腮帮子鼓鼓的。电视开着，声音调得很小。');
    await S.say('秀雅', ['哥，我去倒厨余！外婆说，吃完饭要马上倒，不然招猫。']);
    await S.narr('她端起厨余桶，「噔噔噔」跑进厨房，从后门出去了。');
    await S.walk('suah', [3, 14], 4); S.hide('suah'); S.sfx('close');
    f.ate = true; f.ph = 'trash';
    await S.wait(900);
    S.sfx('knock'); await S.wait(260); S.sfx('knock'); await S.wait(260); S.sfx('knock');
    await S.say('后门外', L4);
    await S.think('（后门是自动锁。她又把自己关在外面了。）');
    S.goal('秀雅在后门外叫门——去给她开门');
  }
  async function trashBack(S) {
    const f = S.f;
    S.sfx('open'); S.ent('bdoor').open = true;
    await S.narr('你拉开后门。冷风一下子灌了进来。\n秀雅抱着空桶钻进来，鼻尖冻得通红。');
    S.place('suah', 4, 14, 3); S.ent('bdoor').open = false; S.sfx('close');
    S.face('suah', 'pl');
    await S.say('秀雅', L2);
    S.amb('river');
    await S.narr('你也听见了。\n哗——哗——像是很远的地方，有一道瀑布。\n隔壁家的狗叫了两声，忽然不叫了。');
    await S.wait(400); S.amb('night');
    await S.say('秀雅', ['……哥，长山上真的有会学人说话的东西吗？', '我在电脑上看到一个帖子。说它是白色的，毛很长……', '外婆好像也知道。外婆的记事本上写着呢。']);
    await S.walk('suah', [12, 9], 4); S.face('suah', 0);
    f.ph = 'learn'; learnGoal(S);
  }
  async function pcUse(S) {
    const f = S.f;
    if (f.ph === 'eve' || f.ph === 'food') return S.narr('外婆家的旧电脑，开机要等好几分钟。\n屏幕上还开着秀雅的游戏网站。');
    S.ent('pc').power = true;
    await S.narr('旧电脑的屏幕还亮着。秀雅没关的网页上，是一个本地论坛的帖子。');
    await S.note('post');
    if (!f.readPost) { f.readPost = true; await S.think('（「我女儿当时就躺在我旁边」……）'); }
    if (f.ph === 'learn') learnGoal(S);
  }
  async function dresserUse(S) {
    const f = S.f;
    if (f.ph === 'eve' || f.ph === 'food') return S.narr('外婆的五斗柜。最上面那层抽屉里，放着外婆的老花镜和一本记事本。\n……乱翻外婆的东西不太好。');
    await S.narr('你拉开外婆五斗柜最上面的抽屉。老花镜底下压着一本磨破了角的记事本。');
    await S.note('grandma');
    if (!f.readNote) { f.readNote = true; await S.think('（插销坏了……外婆在医院里一直说的「窗户」，是这个？）'); }
    if (f.ph === 'learn') learnGoal(S);
  }
  async function angoScene(S) {
    const f = S.f;
    await S.say('你', ME);
    await S.say('秀雅', '暗号？');
    await S.narr('你把外婆记事本上那几行讲给她听。\n讲到「暗号写在纸上，莫说出口」，秀雅自己用两只手捂住了嘴。');
    const r = await S.ask('秀雅撕下一页画纸，让你出题。写哪个问题？', ANGO.map(a => '「' + a.q + '」'));
    f.ango = r; S.ent('desk').s.ango = r;
    await S.narr('你把问题写在纸上，推给她。\n秀雅歪着头想了想，用手挡着，一笔一画地在下面写了答案。');
    S.sfx('cut');
    await S.say('秀雅', '……嘶！');
    await S.narr('她用小剪刀把那页纸剪成两半，剪刀尖在食指上划了一道小口子，冒出一颗血珠。');
    f.cut = true;
    await S.say('秀雅', ['没事，不疼。', '这半张给哥。……不准念出来哦！']);
    S.give('diary', true); S.toast('获得：暗号纸条');
    await S.note('diary');
    await S.say('秀雅', '……哥，我困了。');
    await S.walk('suah', [18, 3], 3); S.face('suah', 0);
    f.ph = 'tobed';
    await S.think('（她的手指还在渗血。储藏间里好像有个急救箱。）');
    S.goal('哄秀雅睡觉（她回房间了）');
  }
  async function kitUse(S) {
    const f = S.f;
    if (f.cut && !f.bandage && !S.has('band')) { S.sfx('open'); S.give('band'); return S.narr('你打开急救箱。红药水、纱布、一盒粉色的创可贴——上面印着小兔子。\n外婆大概是专门给秀雅买的。'); }
    await S.narr('旧柜子上放着一个白色的急救箱，上面贴着外婆写的字：「药」。');
  }
  async function bedtime(S) {
    const f = S.f;
    if (S.has('band') && !f.bandage) {
      S.take('band'); f.bandage = true; S.sfx('paper');
      await S.narr('你把兔子创可贴贴在她的食指上。');
      await S.say('秀雅', '……兔子！嘿嘿。');
    }
    await S.narr('秀雅钻进被窝，把外婆给的小铃铛套在手腕上，晃了晃。');
    bell(S, .05);
    await S.say('秀雅', ['外婆说，戴着铃铛睡觉，就不做噩梦。', '哥，你睡沙发吗？……别关客厅的灯。']);
    S.hide('suah'); S.ent('kbed').full = true;
    f.ph = 'sleep'; S.goal('去客厅的沙发上躺一会儿');
  }
  async function winUse(S) {
    const f = S.f, w = S.ent('kwin');
    if (f.ph === 'gone') return S.narr('窗户开着一条缝。窗台上……有几根湿漉漉的白毛。');
    if (!w.s.cur && (f.ph === 'sleep' || f.ph === 'tobed')) { w.s.cur = true; S.sfx('paper'); return S.narr('你使劲推了推窗户——插销是坏的，窗户总是自己滑开一条缝。\n你只好把窗帘拉严了。'); }
    await S.narr('窗户的插销断了半截，窗子关不严，总留着一条缝。\n缝外面，长山的影子黑沉沉的，林子沙沙地响。');
  }

  /* ---------- 夜里：门外的秀雅 ---------- */
  function setNight(S) {
    S.dark(.74, 'house'); S.plr(2.9); S.amb('night');
    S.ent('tv').power = 'static'; S.ent('lamp').off = false; S.hide('suah'); S.hide('mom');
    S.ent('clock').num = 11;
  }
  async function sofaUse(S) {
    const f = S.f;
    if (f.ph !== 'sleep') return S.narr(f.ph === 'door' || f.ph === 'call2' ? '沙发上还留着你躺过的坑。' : '外婆家的旧沙发，弹簧有点硌人。');
    const r = await S.ask('在沙发上躺一会儿？', ['躺下', '再等等']); if (r) return;
    await S.narr('你和衣躺在沙发上。客厅的灯开着，电视的雪花屏嗞嗞地响。\n不知道什么时候，你睡着了。');
    await S.fade(1, 900);
    setNight(S); S.pos(11, 11, 1);
    await S.card('夜里十一点四十七分', '', '……');
    await S.fade(0, 700);
    f.ph = 'door'; f.checked = false;
    S.goal('有人在叫门——先去看看秀雅的房间');
    S.cp('night');
    await nightStart(S);
  }
  async function nightStart(S) {
    S.amb('river');
    await S.narr('哗——哗——\n你被一阵水声吵醒了。');
    await S.think('（……哪来的水声？）');
    await S.wait(400); S.sfx('knock'); await S.wait(420); S.sfx('knock'); await S.wait(300); S.sfx('knock');
    breath(S, .03);
    await S.say('大门外', L4, { style: 'whisper' });
    if (lastDeath === 'door') { lastDeath = null; await S.think('（不管它用谁的声音……都不能开门。）'); }
    S.goal('有人在大门外叫门——先去看看秀雅的房间');
  }
  async function bedUse(S) {
    const f = S.f, b = S.ent('kbed');
    if (f.ph === 'door') {
      if (!f.checked) {
        f.checked = true;
        await S.narr('你推开秀雅的房门。\n她蜷在被子里，睡得正香。手腕上的小铃铛露在被子外面。');
        bell(S, .025);
        await S.think('（她在这儿。）');
        S.sfx('knock'); await S.wait(300); S.sfx('knock');
        await S.say('大门外', L4, { style: 'whisper' });
        await S.think('（……这句话，是她傍晚在后门外喊的。一字不差。）');
        S.goal('秀雅就在房间里。那大门外面的，是谁？（去大门）');
        return;
      }
      return S.narr('秀雅睡得很熟。你不想吵醒她。');
    }
    if (f.ph === 'call2') return S.narr('秀雅翻了个身。铃铛在被子里轻轻响了一下。');
    if (f.ph === 'gone') {
      if (!f.sawGone) {
        f.sawGone = true;
        await S.narr('被子掀开了，褥子上还是温的。\n秀雅的拖鞋不见了。手腕上的铃铛也不见了。');
        S.sfx('heart'); await S.narr('……窗缝外面，有一团白色的东西，一闪就不见了。'); S.ent('kwin').s.fur = false;
        await S.think('（后门……！）');
      }
      else await S.narr('空空的小床。枕头边，那只布兔子歪倒在一边。');
      return S.goal(S.has('light') ? '后门开着——去找秀雅' : '后门开着——拿上手电筒（玄关的鞋柜），去找秀雅');
    }
    if (b.full && S.has('band') && !f.bandage && f.ph === 'sleep') { S.take('band'); f.bandage = true; S.sfx('paper'); return S.narr('秀雅已经睡着了。你轻轻拉出她的手，把兔子创可贴贴在她食指上。\n她咂了咂嘴，没醒。'); }
    if (b.full) return S.narr('秀雅睡着了，小脸埋在被子里。');
    await S.narr('秀雅的小床，铺着粉色的被子。');
  }
  async function frontDoor(S) {
    const f = S.f;
    if (f.ph === 'door') {
      if (!f.checked) return S.narr('你的手刚碰到门锁——\n……等等。先去看一眼秀雅。');
      return doorScene(S);
    }
    if (f.ph === 'eve' || f.ph === 'food') return S.narr('妈妈刚从这里出去。猫眼外面，院子里的感应灯闪了两下，灭了。');
    if (f.ph === 'gone') return S.narr('秀雅是从后门出去的。');
    await S.narr('大门锁着，门链也挂上了。');
  }
  async function doorScene(S) {
    const f = S.f; let loops = 0;
    for (;;) {
      const opts = ['从猫眼往外看一眼', '问：「……你是谁？」'];
      if (S.has('diary')) opts.push('问纸条上的暗号');
      opts.push('开门', '（捂住嘴，一声不出）');
      const k = opts[await S.ask('大门外：「' + L4 + '」', opts)];
      if (++loops === 3) await S.think('（外婆的本子上写着：先别应。）');
      if (k === '从猫眼往外看一眼') {
        if (f.peep) { await S.narr('你不敢再看第二眼。'); continue; }
        f.peep = true;
        await S.narr('你屏住气，凑到猫眼上。\n院子里的感应灯没亮。外面黑乎乎的——');
        S.amb('river'); await S.wait(500);
        await S.scare('face', { spr: '@beom', face: 'beom', dur: 1 });
        await S.narr('——不是黑。\n是白。\n一大片白色的、湿漉漉的长毛，贴满了整个猫眼。');
        await S.think('（它……就趴在门上。）');
        continue;
      }
      if (k === '问：「……你是谁？」') {
        f.spoke = true;
        await S.say('你', '……你是谁？');
        await S.wait(500);
        await S.say('大门外', '……你是谁？', { style: 'whisper' });
        await S.narr('是你自己的声音。\n连那一下发抖的停顿，都学去了。');
        await S.say('大门外', L4, { style: 'whisper' });
        continue;
      }
      if (k === '问纸条上的暗号') {
        f.spoke = true;
        const a = ANGO[f.ango ?? 0];
        await S.say('你', '「' + a.q + '」');
        await S.wait(600);
        await S.say('大门外', '「' + a.q + '」', { style: 'whisper' });
        await S.narr('门外的声音，把你的问题原样还了回来。\n然后，是很长很长的安静。');
        await S.think('（它答不上来。它只会学。）');
        continue;
      }
      if (k === '开门') {
        f.doorTry = (f.doorTry || 0) + 1;
        if (f.doorTry >= 2) return caught(S, 'door', '门开了一条缝。\n缝里不是秀雅。\n是一大片白色的、湿漉漉的长毛——还有长毛里，一张学着人笑的脸。', '你开了门');
        S.sfx('open'); S.ent('fdoor').s.chain = true;
        await S.narr('你拧开了门锁——');
        S.fx('flash'); S.shake(400, 2); breath(S, .06);
        await S.narr('门开了一条缝，被门链拽住了。\n缝里，慢慢伸进来一缕又湿又冷的白毛，像水草。');
        S.sfx('thud'); S.ent('fdoor').s.chain = false;
        await S.narr('你用整个身子把门撞上，插上了锁。手抖得半天插不进去。');
        await S.think('（……不能开门。不管它用谁的声音。）');
        continue;
      }
      break;
    }
    await S.narr('你捂住嘴，背靠着门，一点声音都不敢出。');
    await S.wait(900);
    await S.say('大门外', L3, { style: 'whisper' });
    await S.think('（「妈妈什么时候回来呀」……秀雅傍晚在房间里问过我。）');
    await S.wait(1000);
    await S.say('大门外', M1, { style: 'whisper' });
    await S.narr('是妈妈的声音。\n一模一样，连那一点疲惫的鼻音都一模一样。');
    await S.think('（这句话……是妈妈傍晚出门时说的。）');
    S.amb('night');
    await S.narr('水声，一点一点地远了。');
    f.ph = 'call2';
    await S.wait(900); ring(S);
    await S.narr('墙上的电话响了。');
    S.goal('接电话（客厅墙上）');
  }
  async function phoneUse(S) {
    const f = S.f;
    if (f.ph === 'call2') return call2(S);
    if (f.ph === 'gone') { await S.narr('你抓起听筒，拨了 112。'); await S.wait(500); S.amb('river'); await S.narr('……听筒里没有忙音。\n只有哗哗的水声。'); S.amb('wind'); return S.think('（不能等了。）'); }
    await S.narr('墙上的老座机，听筒上缠着一圈透明胶带。旁边贴着一张纸：「在宇妈妈 010-」，后面的数字被水渍晕开了。');
  }
  async function call2(S) {
    const f = S.f;
    S.ent('phone').off = true; S.face('pl', 3);
    await S.say('妈妈（电话）', ['喂？在宇？……这么晚还没睡？', '外婆刚才醒了，抓着我的手说「窗户……长山……」，我心里发慌，就打个电话。秀雅睡了吧？']);
    const r = await S.ask('……是妈妈吗？', ['「妈，我小时候的外号叫什么？」', '「……嗯，睡了。」']);
    if (r === 0) { await S.say('妈妈（电话）', '……刺猬头啊。你头发一洗就炸。问这个干嘛？'); await S.think('（是妈妈。这句话，门外那个东西没听过。）'); }
    await S.narr('……就在这时，厨房那边，后门外面，有人在喊。');
    await S.say('后门外', MC, { style: 'whisper' });
    await S.narr('是妈妈的声音。\n可妈妈，正在电话里跟你说话。');
    await S.think('（这句……是妈妈傍晚出门时，朝秀雅房间喊的那一句。一字不差。）');
    S.sfx('open'); await S.wait(400);
    await S.narr('咔哒。\n后门开了。');
    bell(S, .03, .3);
    await S.narr('……叮铃。');
    await S.say('妈妈（电话）', ['在宇？你那边什么声音？', '在宇！！']);
    await S.narr('你扔下了听筒。');
    f.ph = 'gone'; S.ent('phone').off = true;
    const b = S.ent('kbed'); b.full = false; b.open = true;
    S.ent('bdoor').open = true; S.ent('kwin').s.fur = true; S.amb('wind');
    S.goal('秀雅！——去她的房间看看');
  }
  async function shoeUse(S) {
    const f = S.f;
    if (f.ph === 'gone' && !S.has('light')) { S.sfx('open'); S.give('light'); S.plr(3.6); await S.narr('鞋柜最上层有一把旧手电筒。你拍了两下，它才「啪」地亮起来，光圈发黄。'); return S.goal('后门开着——去找秀雅'); }
    await S.narr('玄关的鞋柜。秀雅的粉色小运动鞋摆得整整齐齐。' + (f.ph === 'gone' ? '\n……她是穿着拖鞋出去的。' : ''));
  }
  async function backDoor(S) {
    const f = S.f;
    if (f.ph === 'trash') return trashBack(S);
    if (f.ph === 'gone') {
      if (!S.has('light')) return S.narr('后门大开着，外面黑得伸手不见五指。\n……玄关的鞋柜里，好像有一把手电筒。');
      const r = await S.ask('后门外，冷风呼呼地往里灌。出去找秀雅？', ['出去', '再准备一下']); if (r) return;
      S.sfx('open');
      return S.go('alley', 3, 6, 0);
    }
    if (f.ph === 'door' || f.ph === 'call2') return S.narr('后门锁着。门外很安静。\n……安静得连虫子都不叫了。');
    await S.narr('厨房的后门，通到屋后的小巷。门是自动锁，一关上从外面就打不开。');
  }

  /* ---------- 巷子 ---------- */
  async function alleyEnter(S, first) {
    const f = S.f;
    if (f.ph === 'gone') {
      f.ph = 'out';
      S.plr(3.6);
      await S.narr('后门外是一条窄窄的水泥巷子。路灯一闪一闪的。\n巷子东头往上，就是长山的登山口。');
      S.amb('river'); await S.wait(300);
      await S.narr('山那边，传来哗哗的水声。');
      S.amb('night');
      S.goal('找秀雅（巷子东头，往长山登山口）');
      S.cp('out');
    }
  }
  async function slipperUse(S) {
    const f = S.f;
    S.hide('slipper'); S.give('slipper'); f.slipper = true;
    await S.narr('巷子当中，扔着一只粉色的小拖鞋。左脚。\n鞋面湿漉漉的，上面缠着一根很长很长的白毛。');
    if (!f.sawA) await beomCross(S);
  }
  async function beomCross(S) {
    const f = S.f; f.sawA = true;
    await S.wait(300);
    const b = S.ent('beomA'); b.alpha = 0; S.place('beomA', 22, 4, 3);
    await S.alpha('beomA', 1, 500); S.sfx('heart');
    await S.narr('你抬起头——\n登山口的石阶上，有一团白色的东西，四脚着地，正往山上去。');
    await S.walk('beomA', [22, 0], 5.5); S.hide('beomA');
    await S.narr('很快。快得不像狗。');
    await S.think('（秀雅……就是被那个东西……）');
    S.goal('追上去——长山登山口（巷子东头的石阶）');
  }
  async function toTrail(S) {
    const f = S.f;
    if (f.ph === 'dawn') return S.pos(21, 2, 0);
    const r = await S.ask('黑漆漆的石阶一直通到山上。半夜进山？', ['进山（去找秀雅）', '再看看']);
    if (r) return S.pos(21, 2, 0);
    await S.go('trail', 15, 26, 3);
  }
  async function southEnd(S) {
    await S.narr('往下是大马路，路口的便利店也关门了。\n……铃铛声不在那边。山那边，水声一直在响。');
    S.pos(15, 14, 3);
  }

  /* ---------- 山路：辨声 ---------- */
  let bellT = 0, mimicT = 0, mimicI = 0;
  async function trailEnter(S, first) {
    const f = S.f;
    if (first) {
      f.ph = 'trail';
      await S.narr('长山的登山路。\n两边的松树一棵挨着一棵，手电筒的光照出去三四米，就被黑暗吃掉了。');
      await S.narr('……叮铃。\n很远，很轻。是铃铛。');
      bell(S, .02);
      S.goal('往上走，找秀雅（听铃铛）');
      S.cp('trail');
    }
  }
  async function f1Voices(S) {
    const f = S.f; f.f1heard = true;
    await S.narr('路在这里分成了两条。左边一条，右边一条，都往上去。\n两边都是黑漆漆的林子。');
    await S.wait(500);
    await S.say('右边的林子里', L1, { style: 'whisper' });
    await S.wait(500);
    bell(S, .04);
    await S.say('左边的林子里', '哥……你在哪儿……我的鞋掉了一只，脚好冷……', { style: 'whisper' });
    await S.narr('两边都是秀雅的声音。');
    S.goal('岔路：两边都是秀雅的声音——哪一边是真的？');
  }
  async function wrongF1(S) {
    const f = S.f;
    const n = f.wrongT = (f.wrongT || 0) + 1;
    S.amb('river');
    await S.narr('你往右边的林子里走了几步。');
    await S.say('前面的树丛里', L1, { style: 'whisper' });
    if (n >= 2) return caught(S, 'trail', '树丛里的「秀雅」朝你伸出手。\n你握住的，是一把又冷又湿的长毛。', '你跟错了声音');
    S.fx('flash'); S.sfx('sting'); S.shake(400, 2); breath(S, .06);
    await S.narr('又是那一句。一字不差。\n树丛里，有一团白色的东西，正慢慢地直起身子。');
    await S.narr('你连滚带爬地退回了岔路口。');
    S.pos(17, 20, 1); S.amb('night');
    await S.think(['（「哥！你看，我画的外婆！」……这句话，秀雅傍晚在房间里说过。）', '（它只会学听过的话。……还有，秀雅手腕上戴着铃铛。）']);
    S.goal('回到岔路口，往有铃铛声的那边走');
  }
  async function f1Ok(S) {
    const f = S.f; f.f1ok = true;
    bell(S, .045);
    await S.narr('……叮铃。\n铃铛声近了一点。');
    S.goal('继续往上走（听铃铛）');
    S.cp('f2');
  }
  async function tieUse(S) {
    S.ent('tie').read = true;
    await S.narr('路边的树枝上挂着一根粉色的发圈。\n是秀雅的。她扎头发用的。');
  }
  async function f2Scene(S) {
    const f = S.f; f.f2 = true;
    buzz(S);
    await S.narr('口袋里的手机震了起来。屏幕上亮着两个字：「妈妈」。');
    await S.say('妈妈（手机）', ['在宇！我打车回来了，家里一个人都没有！后门大开着——', '你在哪儿？你是不是进山了？']);
    await S.say('你', '……妈，秀雅被那个东西引到山上去了。我听见铃铛了，就在前面。');
    await S.say('妈妈（手机）', ['我已经报警了，警察马上到登山口。', '在宇，你听妈妈说：山上不管谁叫你，都别应。妈妈在家，妈妈哪儿也没去。']);
    S.amb('river');
    await S.narr('……就在这时，右手边的林子里，有人叫你。');
    await S.say('右边的林子里', M2, { style: 'whisper' });
    await S.narr('是妈妈的声音。\n可妈妈，正在你的手机里。');
    await S.say('妈妈（手机）', '在宇？在宇，你还在吗？……喂？');
    await S.narr('手机里忽然灌满了哗哗的水声。信号断了。');
    bell(S, .03, .4);
    S.goal('别管右边的声音——往上走（铃铛在上面）');
  }
  async function momTempt(S) {
    const f = S.f;
    S.amb('river');
    await S.say('林子深处', M2, { style: 'whisper' });
    const r = await S.ask('妈妈的声音，就在前面的黑暗里。', ['跟着妈妈的声音走', '站住']);
    if (r === 0) return badMom(S);
    await S.think('（「冰箱里有小菜」……这是傍晚出门时，妈妈在门口说的。一字不差。）');
    S.pos(16, 11, 1); S.amb('night');
  }
  async function badMom(S) {
    lastDeath = 'mom';
    await S.narr('你跟着妈妈的声音，走进了没有路的林子。\n水声越来越大。「' + M2 + '」「' + M2 + '」');
    await S.narr('一遍，又一遍。一个字都没变。');
    await S.scare('face', { spr: '@beom', face: 'beom', dur: 1.1 });
    S.fx('red');
    return S.end({ bad: true, id: 'mom', title: '妈妈的声音', text: '第二天早上，搜救队在瀑布边找到了秀雅。\n她冻得说不出话，只是一直哭。\n她说，后半夜，她一直听见哥哥在山上喊她的名字。\n「秀雅——」\n一遍，又一遍。\n\n可你，再也没有从山上下来。\n\n（那个声音，是从你身上学去的。）' });
  }
  function chaseOn(S) {
    S.norun(true);
    S.chase('beom', { spd: CH_SPD, wait: .8, catch: async S => caught(S, 'chase', '「' + L2 + '」\n声音就在你耳朵后面。\n一只又湿又冷的东西，搭上了你的肩膀。', '它追上你了') });
  }
  const CH_SPD = 3.2;
  async function startChase(S, again) {
    const f = S.f;
    f.chaseOn = true; mimicT = 2.5; mimicI = 0;
    S.stop('beom'); S.place('beom', 19, 11, 1); S.ent('beom').alpha = 1;
    if (!again) {
      S.amb('river'); breath(S, .07);
      await S.narr('身后，右边的林子「哗啦」一声分开了。');
      await S.scare('face', { spr: '@beom', face: 'beom', dur: 1 });
      await S.narr('白色的长毛。四条腿。一张学着人样的灰脸。\n它冲着你张开嘴，用秀雅的声音喊：「' + L4 + '」');
      await S.think('（石阶太陡太滑，根本跑不起来。……别停，别回头！）');
    } else {
      S.amb('river');
      if (lastDeath === 'chase') { lastDeath = null; await S.think('（别停，别回头。到了岔路口，往有铃铛声的那边走。）'); }
    }
    S.goal('它追上来了！别停——顺着铃铛声往上走');
    chaseOn(S);
  }
  async function enterChase(S) {
    S.cp('chase');
    await startChase(S, false);
  }
  async function toFalls(S) {
    const f = S.f;
    S.stop('beom'); S.hide('beom'); S.norun(false); f.chaseOn = false;
    await S.go('falls', 11, 16, 3);
  }

  /* ---------- 瀑布：三个秀雅 ---------- */
  async function fallsEnter(S, first) {
    const f = S.f;
    if (!first) return;
    f.ph = 'falls'; f.qn = 0; f.ansSaid = false;
    const idx = [0, 1, 2].sort(() => Math.random() - .5);
    ['sReal', 'sEcho', 'sCopy'].forEach((id, i) => { const [x, y] = SLOTS[idx[i]]; S.place(id, x, y, 0); });
    f.realSlot = idx[0];
    S.amb('river');
    await S.narr('林子到了尽头。\n长山瀑布从黑漆漆的崖壁上挂下来，哗哗的水声灌满了耳朵。\n水潭边，雾很浓。');
    await S.wait(400);
    S.focus(12, 4);
    await S.narr('长山瀑布。');
    breath(S, .035);
    await S.say('雾里', ['哥！我在这儿！', '哥！我在这儿！', '哥！我在这儿！'], { style: 'whisper' });
    S.focus(null);
    await S.narr('水潭边有三块大石头。每一块后面，都有一个秀雅的声音。\n三声一模一样，被瀑布声搅在一起，分不清是哪一边先喊的。');
    S.goal('三块石头后面都是秀雅——问暗号分辨（联机：一人念纸条，一人去问）');
    S.cp('falls');
  }
  function slotOf(S, id) { const e = S.ent(id); for (let i = 0; i < 3; i++) if (Math.round(e.px / TS) === SLOTS[i][0] && Math.round(e.py / TS) === SLOTS[i][1]) return i; return 0; }
  async function fallsHint(S) {
    const f = S.f, n = f.qn;
    if (n === 2) await S.think('（它只会学听过的话，一个字也不改。……哪一句，是它不可能听过的？）');
    else if (n === 3) await S.think('（暗号的答案，从来没人说出口过。最先答出来的那一个，才是没偷听过的人。）');
    else if (n >= 4) await S.think('（' + SLOTN[f.realSlot] + '那块石头。……秀雅在那儿。）');
  }
  async function rockUse(S, e) {
    const f = S.f, role = e.id === 'sReal' ? 'real' : e.id === 'sEcho' ? 'echo' : 'copy';
    if (f.ph !== 'falls') return S.narr('湿漉漉的大石头。石头后面，什么都没有了。');
    const a = ANGO[f.ango ?? 0];
    const opts = ['问纸条上的暗号', '叫她的名字', '让她把手伸出来', '拉住她的手，带她走', '算了'];
    const r = await S.ask('石头后面，有人在小声地哭。', opts);
    if (r === 4) return;
    if (r === 0) {
      f.qn++;
      await S.say('你', '「' + a.q + '」');
      await S.wait(600);
      if (role === 'real') {
        await S.say('石头后面', a.say, { style: 'whisper' });
        bell(S, .045);
        await S.narr('……还有一声很轻的「叮」。');
        if (!f.ansSaid) f.ansSaid = 'real';
      } else if (role === 'echo') {
        await S.say('石头后面', '「' + a.q + '」', { style: 'whisper' });
        await S.narr('它把你的问题，原封不动地还了回来。一个字都没改。');
      } else if (f.ansSaid) {
        await S.say('石头后面', a.say, { style: 'whisper' });
        await S.narr('一字不差，连停顿都一样。\n可是，没有铃铛声。只有哗哗的水声。');
      } else {
        await S.say('石头后面', L2, { style: 'whisper' });
        await S.narr('……「外面好像有流水声」。\n这句话，秀雅傍晚在后门口说过。一字不差。');
      }
      return fallsHint(S);
    }
    if (r === 1) {
      await S.say('你', '秀雅！');
      await S.say('石头后面', '哥！我在这儿！', { style: 'whisper' });
      await S.narr('另外两块石头后面，也同时喊了起来——「哥！我在这儿！」\n三个声音，一模一样。');
      return;
    }
    if (r === 2) {
      await S.say('你', '……把手伸出来，给哥看看。');
      await S.think('（秀雅最爱听的那个故事——老虎扮成妈妈敲门，兄妹俩让它把手从门缝里伸进来。）');
      if (role === 'real') {
        e.s.hand = 'red'; e.s.band = !!f.bandage;
        await S.narr('石头边上，慢慢伸出来一只小手。' + (f.bandage ? '冻得通红，在发抖。\n食指上，贴着一张粉色的兔子创可贴。' : '\n雾太浓了，看不清颜色。'));
        if (f.bandage) await S.think('（……是我贴的。）');
      } else {
        e.s.hand = 'pale';
        await S.narr('石头边上，慢慢伸出来一只小手。\n雾太浓了，看不清颜色。' + (f.bandage ? '\n……手指上，干干净净的。' : ''));
      }
      if (!f.bandage && S.once('handHint')) await S.think('（三只手，在雾里看起来一模一样。……还是得靠暗号。）');
      return;
    }
    const c = await S.ask('确定是她吗？', ['拉住她的手', '再想想']);
    if (c) return;
    if (role === 'real') return goodEnd(S, e);
    return badFake(S, role);
  }
  async function badFake(S, role) {
    lastDeath = 'fake';
    await S.narr('你绕到石头后面，抓住了那只手。');
    await S.narr('很小。很凉。\n凉得……像刚从水里捞出来。');
    await S.say('', role === 'echo' ? ME : L2, { style: 'whisper' });
    if (role === 'echo') await S.narr('……是你自己的声音。');
    await S.scare('face', { spr: '@beom', face: 'beom', dur: 1.1 });
    S.fx('red');
    return S.end({ bad: true, id: 'fake', title: '牵错了手', text: '你牵着那只冰凉的小手，一步一步走下山。\n她一路都没说话。你问她冷不冷，她就小声地说：\n「……冷不冷。」\n\n天亮的时候，搜救队在瀑布边找到了一只粉色的拖鞋，和一个小小的铃铛。\n\n而你牵回家的那个「秀雅」，\n每天夜里都站在那扇关不严的窗户边，\n学着外面的声音说话。' });
  }
  async function goodEnd(S, e) {
    const f = S.f;
    f.ph = 'saved';
    const ex = Math.round(e.px / TS), ey = Math.round(e.py / TS);
    await S.narr('你绕到石头后面，一把抓住了那只手。\n冻得冰凉，小小的，在发抖。');
    const p = S.pl, spot = [[ex, ey - 1], [ex - 1, ey], [ex + 1, ey], [ex, ey + 1]].find(([x, y]) => !(x === p.x && y === p.y)) || [ex, ey - 1];
    S.place('suahF', spot[0], spot[1], 0); S.face('suahF', 'pl');
    bell(S, .05);
    await S.say('秀雅', ['哥……！', '我听见妈妈叫我出来……说她要走了……我就追出来了……', '后来，妈妈的声音……变成了我的声音……']);
    if (f.bandage) await S.narr('她的食指上，还贴着那张兔子创可贴。');
    if (S.has('slipper')) { S.take('slipper'); f.shoe = true; await S.narr('你把那只粉色的小拖鞋给她套上。她光着的那只脚，冻得像块冰。'); }
    await S.say('你', ['没事了。哥在。', '……别回头。跟紧我。']);
    S.amb('river');
    await S.wait(500);
    await S.say('石头后面', ME, { style: 'whisper' });
    await S.narr('……是你的声音。');
    await S.say('另一块石头后面', M1, { style: 'whisper' });
    const b = S.ent('beomS'); b.alpha = 0; S.show('beomS');
    await S.alpha('beomS', .9, 1200); breath(S, .05);
    await S.narr('瀑布顶上，雾里，有一个白色的、很高很高的影子，慢慢地站了起来。');
    await S.narr('你没有回头。\n你背起秀雅，一步一步往山下走。\n身后的声音一直跟着——妈妈的，秀雅的，你自己的。\n然后，一点一点地，被哗哗的水声吞掉了。');
    await S.fade(1, 1200);
    S.hide('beomS');
    await S.card('凌晨五点四十分', '', '天边发白的时候，你看见了登山口的手电筒光。\n还有警车的灯，一闪一闪。');
    f.ph = 'dawn';
    ['mom', 'cop', 'pcar', 'suahD'].forEach(id => S.show(id + 'A'));
    S.dark(.42, 'alley'); S.plr(3);
    await S.go('alley', 21, 3, 0, { ms: 900 });
    await dawn(S);
  }
  const VOL2 = '十个夜晚。\n兰若寺里推开的金子，河边不能应的名字，路上不能捡的红纸包；\n封门村的唱腔，林投树下的肉粽，拍立得里多出来的那个人；\n打不下去的桩，河灯背后不能回的头，子夜开张、不许开口的集市——\n还有长山上，学人说话的白影子。\n\n它们都在叫你。\n用金子叫，用红包叫，用唱腔、用纸钱，用你最想听见的那个声音叫。\n应一声，就算答应了。\n\n可这些夜里，也总有人被好好地送回了家。\n分清该应的和不该应的——才走得出这一卷。';
  async function dawn(S) {
    const f = S.f;
    S.face('momA', 3);
    await S.say('妈妈', '秀雅！在宇！！');
    await S.walk('momA', [21, 4], 5);
    await S.narr('妈妈跌跌撞撞地跑上石阶，一把把你们两个都搂进怀里。\n她身上全是夜里的寒气，手抖得厉害。');
    await S.say('妈妈', '……在宇。你小时候外号叫什么？');
    await S.say('你', '……刺猬头。');
    await S.narr('妈妈「哇」地一声哭了出来。\n秀雅也跟着哭。你也是。');
    await S.say('警察', '人找到了！两个孩子都在！', { style: 'whisper' });
    await S.narr('天亮了。\n长山上，鸟开始叫。\n再也没有水声了。');
    await S.fade(1, 1400);
    await S.card('卷二　终', '', VOL2);
    return S.end({ id: 'home', title: '第二十夜　完', text: '外婆出院那天，我修好了秀雅房间那扇窗的插销。\n外婆摸着插销，笑了：「我在医院里一直想说的，就是这个。」\n\n从那以后，我们家多了一条规矩：\n夜里有人叫门，先问暗号。暗号写在纸上，不说出口。' + (f.bandage ? '\n\n那张兔子创可贴，秀雅一直夹在画本里。' : '') + '\n\n长山上，后来还有人说，夜里在瀑布边，听见一个小女孩在喊：\n「哥——你在哪儿——」\n用的是秀雅十岁时的声音。' });
  }

  /* ================= 地图 ================= */
  function houseRows() {
    return [
      '######################',
      '######################',
      '#jjjjjj#WWWWW#jjjjjjj#',
      '#jjjjjj#WWWWW#jjjjjjj#',
      '#jjjjjj#WWWWW#jjjjjjj#',
      '#jjjjjj#WWWWW#jjjjjjj#',
      '###j#####W#######j####',
      '#nnnnnn#lllllllllllll#',
      '#nnnnnn#lllllllllllll#',
      '#nnnnnn#lllllllllllll#',
      '#nnnnnnllllllllllllll#',
      '#nnnnnn#lllllllllllll#',
      '#nnnnnn#lllllllllllll#',
      '#nnnnnn#lllllllllllll#',
      '#nnnnnn#llllllxxxllll#',
      '######################'
    ];
  }
  function alleyRows() {
    const G = grid(30, 18, 'P');
    G.rect(0, 1, 9, 5, '#');
    G.rect(10, 1, 18, 4, '"'); G.rect(10, 5, 18, 5, 'f');
    G.rect(19, 1, 25, 5, '"'); G.rect(21, 0, 22, 5, 'k');
    G.rect(0, 6, 27, 9, 'x');
    G.rect(0, 10, 12, 17, 'Q'); G.rect(18, 10, 29, 17, 'Q'); G.rect(13, 10, 17, 17, 'x');
    G.set(11, 2, 'T'); G.set(17, 1, 'T'); G.set(25, 1, 'T'); G.set(19, 1, 'B'); G.set(24, 2, 'B');
    return G.rows();
  }
  function trailRows() {
    const G = grid(32, 28, 'P');
    for (let y = 0; y < 28; y++) for (let x = 0; x < 32; x++) if (hash(x, y, 7) < .22) G.set(x, y, 'T');
    G.rect(15, 21, 16, 27, 'd');
    G.rect(8, 19, 23, 20, 'd');
    G.rect(8, 11, 9, 18, 'd'); G.rect(8, 13, 9, 14, 'k');
    G.rect(22, 14, 23, 18, 'd');
    G.rect(8, 11, 16, 12, 'd');
    G.rect(15, 7, 16, 10, 'd'); G.rect(15, 7, 16, 8, 'k');
    G.rect(17, 11, 26, 12, 'd');
    G.rect(8, 6, 24, 6, 'd');   // 第三个岔路：单行道，钻进左边的死胡同，它就堵在你和出口之间
    G.rect(23, 0, 24, 5, 'k');
    G.set(11, 20, 'K'); G.set(20, 19, 'K'); G.set(25, 11, 'K');
    return G.rows();
  }
  function fallsRows() {
    const G = grid(24, 18, 'P');
    for (let y = 0; y < 18; y++) for (let x = 0; x < 24; x++) if (hash(x, y, 9) < .25) G.set(x, y, 'T');
    G.rect(0, 0, 23, 2, 'Y');
    G.rect(2, 3, 21, 15, 'd');
    G.rect(7, 3, 16, 8, 'o'); G.rect(8, 3, 15, 6, '~');
    G.rect(11, 16, 12, 17, 'd');
    for (const [x, y] of [[3, 13], [7, 14], [17, 14], [20, 12]]) G.set(x, y, 'K');
    G.set(2, 3, 'K'); G.set(21, 4, 'K'); G.set(2, 15, 'T'); G.set(21, 15, 'T');
    return G.rows();
  }

  function MAPS() {
    return {
      house: {
        amb: 'night', dark: .35, plr: 3, floor: 'lightwood', wall: 'paper', legend: { j: 'jangpan' },
        rows: houseRows(),
        ents: [
          { id: 'mom', x: 15, y: 13, spr: '@mom', dir: 3, on: S => S.say('妈妈', M1) },
          /* 外婆的房间 */
          { id: 'wardrobe', x: 1, y: 2, spr: 'wardrobe', on: N('外婆的大衣柜。最下面那一层是秀雅的「秘密基地」——她捉迷藏总躲在那儿，以为没人知道。') },
          { id: 'dresser', x: 3, y: 2, spr: 'dresser', on: dresserUse },
          { id: 'gpic', x: 5, y: 1, spr: 'portrait', on: N('外公的黑白照片。外公年轻时在长山上砍过柴。\n妈妈说，外公从来不让人夜里在院子里喊名字。') },
          { id: 'gfuton', x: 5, y: 3, h: 2, spr: 'futon', col: '#6a4a6a', on: N('外婆的被褥还铺在地上，枕头边放着一串念珠。\n被子叠得整整齐齐，像是在等她回来。') },
          /* 储藏间 */
          { id: 'shelfS', x: 8, y: 2, spr: 'shelf', on: N('架子上堆着腌菜坛子的盖子、旧报纸、几瓶自家酿的梅子酒。') },
          { id: 'kit', x: 10, y: 2, spr: 'kit', on: kitUse },
          { id: 'boxS', x: 12, y: 2, spr: 'box', on: N('一箱过冬的蜂窝煤。箱子上写着：「防潮」。') },
          { id: 'jarsS', x: 12, y: 4, spr: 'onggi', on: N('两口小酱缸，盖子上压着石头。凑近能闻到大酱的味道。') },
          /* 秀雅的房间 */
          { id: 'desk', x: 15, y: 2, spr: 'desk', on: S => S.narr(S.f.ph === 'gone' ? '书桌上摊着画本。那根挂铃铛的红绳不见了。' : '秀雅的书桌。画本、蜡笔、一把小剪刀。\n墙上贴满了她画的画：外婆、妈妈、一个刺猬头的哥哥。') },
          { id: 'suah', x: 15, y: 3, spr: '@suah', dir: 3, on: suahTalk },
          { id: 'kwin', x: 17, y: 1, spr: 'kwin', open: true, on: winUse },
          { id: 'kbed', x: 19, y: 2, h: 2, spr: 'kbed', on: bedUse },
          { id: 'nlamp', x: 14, y: 2, spr: 'nlamp', solid: false, decal: true, light: { r: 2.2, col: 'rgba(255,170,200,.12)' }, on: N('插在墙上的小夜灯，粉色的月亮形状。秀雅怕黑。') },
          { id: 'rabbit', x: 20, y: 5, spr: 'rabbit', on: N('一只洗得发白的布兔子。一只耳朵缝过。') },
          /* 客厅 */
          { id: 'clock', x: 11, y: 6, spr: 'wallclock', num: 6, on: S => S.narr(S.f.ph === 'door' || S.f.ph === 'call2' || S.f.ph === 'gone' ? '挂钟：十一点五十分。\n秒针一下、一下地走。' : '挂钟：傍晚六点二十。') },
          { id: 'phone', x: 14, y: 6, spr: 'kphone', on: phoneUse },
          { id: 'cal', x: 16, y: 6, spr: 'calendar', on: N('二〇一三年十月的挂历。十五号那天被红笔圈起来，写着：「外婆住院」。') },
          { id: 'frame', x: 19, y: 6, spr: 'frame', on: N('全家福。外婆坐在当中，秀雅坐在她腿上，你站在后面，头发翘得像刺猬。') },
          { id: 'tv', x: 10, y: 7, spr: 'tv', on: S => S.narr(S.ent('tv').power === 'static' ? '电视早就没节目了，只剩一屏雪花，嗞嗞地响。' : '电视里在播晚间新闻，声音开得很小。') },
          { id: 'pc', x: 20, y: 7, spr: 'pc', on: pcUse },
          { id: 'table', x: 12, y: 10, w: 2, spr: 'lowtable', on: S => S.narr(S.f.ate ? '小饭桌上还剩半碗米饭。秀雅把炒鱼饼全挑走了。' : '客厅当中的小饭桌，腿有点晃。') },
          { id: 'sofa', x: 9, y: 12, w: 2, spr: 'sofa', col: '#4a5a6a', on: sofaUse },
          { id: 'lamp', x: 20, y: 11, spr: 'lamp', light: { r: 4, col: 'rgba(255,200,120,.12)' }, on: N('落地灯。灯罩上有一块烤焦的印子。') },
          { id: 'shoes', x: 13, y: 14, spr: 'getabako', on: shoeUse },
          { id: 'fdoor', x: 15, y: 15, spr: 'kdoor', on: frontDoor },
          /* 厨房 */
          { id: 'fridge', x: 1, y: 7, spr: 'fridge', on: fridgeUse },
          { id: 'sink', x: 5, y: 7, spr: 'sink', on: S => S.narr(S.f.ph === 'door' ? '水龙头关得好好的，一滴水也没有。\n可那哗哗的水声，一直没停。' : '水槽里泡着两只碗。水龙头有点漏，滴答、滴答。') },
          { id: 'stove', x: 6, y: 7, spr: 'stove', on: stoveUse },
          { id: 'jars', x: 1, y: 13, spr: 'onggi', on: N('外婆腌的泡菜坛子。秋天一到，外婆就念叨着要腌过冬的泡菜了。') },
          { id: 'bdoor', x: 3, y: 15, spr: 'kdoor', on: backDoor }
        ],
        enter: houseEnter,
        tick(S, dt) {
          const f = S.f; if (f.ph !== 'trash' || S.busy) return;
          f._kn = (f._kn || 0) + dt;
          if (f._kn > 7) { f._kn = 0; S.sfx('knock'); S.toast('后门外：「' + L4 + '」'); }
        }
      },
      alley: {
        amb: 'night', dark: .84, plr: 3.6, floor: 'concrete', wall: 'concrete', legend: { Q: 'roof' }, fog: .12,
        tileOpts: { grassC: '#24361f', treeC: '#16281a', fenceBase: 'grass' },
        rows: alleyRows(),
        ents: [
          { id: 'bdoorA', x: 3, y: 5, spr: 'door', on: S => S.narr(S.f.ph === 'dawn' ? '外婆家的后门。' : '外婆家的后门，大敞着。\n……秀雅还在外面。不能回去。') },
          { id: 'fdoorA', x: 7, y: 5, spr: 'door', on: N('外婆家的大门。\n门把手上，挂着几缕湿漉漉的白毛。') },
          { id: 'slipper', x: 11, y: 7, spr: 'slipper', solid: false, on: slipperUse },
          { id: 'dog', x: 14, y: 5, spr: 'dog', on: S => S.narr(S.f.ph === 'dawn' ? '隔壁的珍岛犬从狗窝里探出头，冲你摇了摇尾巴。' : '隔壁家的珍岛犬缩在狗窝最里面，夹着尾巴，冲着山的方向发抖。\n它连叫都不敢叫。') },
          { id: 'lamp1', x: 5, y: 9, spr: 'streetlamp', flicker: true, light: { r: 3.2, flick: true, col: 'rgba(255,230,160,.1)' }, on: N('路灯一闪一闪的。灯罩里积了一层死虫子。') },
          { id: 'lamp2', x: 19, y: 9, spr: 'streetlamp', light: { r: 3.2, col: 'rgba(255,230,160,.1)' }, on: N('路灯杆上贴着补习班的小广告，被雨泡得发白。') },
          { id: 'vend', x: 25, y: 9, spr: 'vending', col: '#2a6a9a', light: { r: 2.4, col: 'rgba(160,200,255,.12)' }, on: N('自动贩卖机。灯光惨白。\n最下面一排的玉米须茶卖光了。') },
          { id: 'cctv', x: 19, y: 5, spr: 'cctv', on: N('「防范 CCTV 二十四小时录像中」。\n镜头对着登山口。红灯一闪、一闪。') },
          { id: 'tsign', x: 20, y: 4, spr: 'tsign', on: N('木牌：「长山登山路　→　长山瀑布 1.1km」。') },
          { id: 'board', x: 24, y: 4, spr: 'keiji', on: S => S.note('board') },
          { id: 'beomA', x: 22, y: 4, spr: 'beom', hidden: true, solid: false },
          { id: 'toTrail', x: 21, y: 0, w: 2, solid: false, touch: toTrail },
          { id: 'south', x: 13, y: 17, w: 5, solid: false, touch: southEnd },
          { id: 'pcarA', x: 23, y: 8, w: 3, spr: 'pcar', hidden: true, light: { r: 4, flick: true, col: 'rgba(255,60,60,.16)' }, on: N('警车的灯一闪一闪，把整条巷子照得一会儿红、一会儿蓝。') },
          { id: 'copA', x: 24, y: 6, spr: '@cop', dir: 1, hidden: true, on: S => S.say('警察', '孩子没事吧？……这山，夜里是真不该上。') },
          { id: 'momA', x: 21, y: 6, spr: '@mom', dir: 3, hidden: true, on: S => S.say('妈妈', '……回家吧。外婆还等着咱们呢。') },
          { id: 'suahDA', x: 22, y: 3, spr: '@suah', dir: 0, hidden: true, on: S => S.say('秀雅', '哥……今晚，我能跟你睡吗？') }
        ],
        enter: alleyEnter,
        step(S, x, y) { if (S.f.ph === 'out' && !S.f.sawA && y <= 7 && x >= 18 && x <= 24) return beomCross(S); }
      },
      trail: {
        amb: 'night', dark: .9, plr: 3.6, floor: 'dirt', fog: .22,
        tileOpts: { grassC: '#1e2e1c', treeC: '#132416' },
        rows: trailRows(),
        ents: [
          { id: 'tsignT', x: 17, y: 25, spr: 'tsign', on: N('「长山瀑布 0.9km ↑」\n木牌底下，有人用石头压着一束干了的野菊花。') },
          { id: 'doltap', x: 14, y: 21, spr: 'doltap', on: async S => { await S.narr('路边垒着一座小石塔。来往的人一人放一块石头，许一个愿。'); if (!S.f.f1ok) { await S.think('（……再听一遍。）'); await f1Voices(S); } } },
          { id: 'tie', x: 9, y: 16, spr: 'tie', solid: false, on: tieUse },
          { id: 'doltap2', x: 14, y: 9, spr: 'doltap', on: N('又一座石塔。最上面那块石头，是湿的。') },
          { id: 'tie2', x: 21, y: 6, spr: 'tie', solid: false, on: N('另一根粉色的发圈，挂在右边的树枝上。……她往这边走了。') },
          { id: 'beom', x: 21, y: 11, spr: 'beom', hidden: true, solid: false },
          { id: 'toFalls', x: 23, y: 0, w: 2, solid: false, touch: toFalls }
        ],
        enter: trailEnter,
        step(S, x, y) {
          const f = S.f;
          if (y === 20 && (x === 15 || x === 16) && !f.f1heard) return f1Voices(S);
          if (y === 16 && (x === 22 || x === 23) && !f.f1ok) return wrongF1(S);
          if (y === 15 && (x === 8 || x === 9) && !f.f1ok) return f1Ok(S);
          if (y === 12 && (x === 15 || x === 16) && f.f1ok && !f.f2) return f2Scene(S);
          if (x === 20 && (y === 11 || y === 12) && !f.chaseOn) return momTempt(S);
          if (y === 9 && (x === 15 || x === 16) && f.f2 && !f.chaseOn) return enterChase(S);
        },
        tick(S, dt) {
          const f = S.f, p = S.pl; if (S.busy) return;
          bellT -= dt;
          const atF1 = !f.f1ok && f.f1heard && p.y >= 17 && p.y <= 21 && p.x >= 10;
          if (atF1 && bellT <= 0) { bellT = 4.5; bell(S, .022); S.toast('叮铃……（铃铛声，从左边传来）'); }
          if (atF1) {   // 在岔路口愣住：20 秒给方向，40 秒点明
            f._lin = (f._lin || 0) + dt;
            if (f._lin > 20 && S.once('lin1')) S.run(async S => S.think(['（右边那句「' + L1 + '」……秀雅傍晚在房间里说过。一字不差。）', '（它只会学听过的话。秀雅不会在半夜的山上，喊我去看她的画。）']));
            if (f._lin > 40 && S.once('lin2')) S.run(async S => S.think('（左边。说鞋掉了的那个声音……还有铃铛。是左边。）'));
          }
          if (f.chaseOn) {
            const nearF3 = p.y <= 7 && p.x >= 12 && p.x <= 19;
            mimicT -= dt;
            if (mimicT <= 0 && !nearF3) { mimicT = 5; S.toast('身后：「' + [L4, ME, M1, L2][mimicI++ % 4] + '」'); breath(S, .03); }
            if (nearF3 && bellT <= 0) { bellT = 3; bell(S, .04); S.toast('叮铃——（铃铛声，从右边传来）'); }
          }
        }
      },
      falls: {
        amb: 'river', dark: .86, plr: 3.4, floor: 'dirt', fog: .34, legend: { Y: 'cliff' },
        tileOpts: { grassC: '#1e2e1c', treeC: '#132416' },
        rows: fallsRows(),
        ents: [
          { id: 'waterfall', x: 10, y: 0, w: 4, h: 4, spr: 'waterfall', solid: false, decal: true, light: { r: 3, dx: 32, dy: 40, a: .5 }, on: N('长山瀑布。水从黑漆漆的崖顶上挂下来，砸进潭里，雾一阵一阵地扑到脸上。') },
          { id: 'sReal', light: { r: 1.8, a: .4 }, x: 4, y: 7, spr: 'brock', on: rockUse },
          { id: 'sEcho', light: { r: 1.8, a: .4 }, x: 12, y: 10, spr: 'brock', on: rockUse },
          { id: 'sCopy', light: { r: 1.8, a: .4 }, x: 19, y: 7, spr: 'brock', on: rockUse },
          { id: 'suahF', x: 4, y: 6, spr: '@suah', hidden: true, on: S => S.say('秀雅', '哥……我们回家吧。') },
          { id: 'beomS', x: 12, y: 2, spr: 'beomS', hidden: true, solid: false, z: 1 }
        ],
        enter: fallsEnter,
        tick(S, dt) {
          const f = S.f; if (f.ph !== 'falls' || S.busy) return;
          const e = S.ent('sReal'), p = S.pl, d = Math.abs(Math.round(e.px / TS) - p.x) + Math.abs(Math.round(e.py / TS) - p.y);
          if (d <= 2 && !S.moving) { f._still = (f._still || 0) + dt; if (f._still > 1.4) { f._still = -2.5; bell(S, .018); if (S.once('stillBell')) S.toast('……叮。（站着别动，好像能听见铃铛）'); } }
          else f._still = 0;
        }
      }
    };
  }

  defChapter({
    id: 'jangsanbeom', n: 20, title: '长山虎', sub: '门外是妹妹的声音。可妹妹，就睡在房间里。', origin: '韩国网络都市传说', color: '#2a3a4a',
    amb: 'night', floor: 'lightwood', wall: 'paper', dark: .6, plr: 3.2,
    people: PEOPLE, items: ITEMS, notes: NOTES, faces: FACES, sprites: SPRITES, tiles: TILES,
    endings: { home: '第二十夜　完', mom: '妈妈的声音', fake: '牵错了手' },
    legend: '「장산범」（长山虎，也译作长山范）是 2010 年代初开始在韩国网络社区流传的都市传说。长山是釜山海云台区的一座山，海拔六百多米，山脚下就是住宅区。据说山里有一种通体白色长毛的东西，四肢着地，跑得比人快；它不直接伤人，而是模仿人的声音——尤其是家人的声音——把人引进山里。另一种常见的说法是，它的叫声像瀑布或沙沙的风声。\n\n帖子里最常被转述的一幕是：深夜有人在门外用家里某个人的声音叫门，而那个人，此刻就在屋里。名字里的「범」是韩语里对老虎的旧称，有人因此把它和更古老的民间故事联系起来——比如《日月兄妹》（해와 달이 된 오누이）里，老虎吃掉了母亲，扮成母亲去敲兄妹俩的门；孩子们让它把手伸进门缝，摸到的却是一只粗糙的、长着毛的手。2017 年，这个传说还被改编成了电影。\n\n查无实据：没有任何可靠的记录证明长山有这样的动物。网上的「目击」大多来自匿名帖子，细节在一次次转述里越来越多；也有人认为，那只是山谷里的回声、野生动物的叫声，和夜里人自己的害怕。\n\n游戏虚构：在宇、秀雅一家和外婆家，外婆的记事本，论坛帖子的具体内容，「它只会一字不差地重复听过的话」「暗号要写下来、不能说出口」的规矩，以及瀑布边的三块石头，都是本章为了游戏编写的。',
    start: { map: 'house', x: 14, y: 11, dir: 0 },
    async intro(S) { await S.card('第二十夜　长山虎', '2013年10月　韩国釜山　海云台区', '外婆住院的第三天。\n妈妈白天守在医院，傍晚回来一趟，又匆匆赶回去。\n\n外婆家就在长山脚下。后窗一开，就是山。\n小时候外婆总说：天黑以后，山里有人叫你，别应。'); },
    thumb(g, w, h) {   // 夜里的长山、一道白瀑布，前面趴着一团白毛，灰脸上两只黑眼睛
      const R = (x, y, ww, hh, c) => { g.fillStyle = c; g.fillRect(x, y, ww, hh); };
      const by = h - 22;
      for (let i = 0; i < 16; i++) R(i * 10, by - 34 - Math.round(Math.abs(Math.sin(i * .7)) * 22), 10, 60, '#121c22');
      for (let i = 0; i < 20; i++) R(i * 8, by - 18 - (i * 37 % 9), 8, 20, '#0c1418');
      R(22, by - 60, 22, 8, '#1a2228'); R(26, by - 54, 10, 44, 'rgba(210,224,232,.7)'); R(28, by - 54, 3, 44, '#f0f6fa'); R(33, by - 50, 2, 40, '#dce8ee'); R(20, by - 12, 24, 4, 'rgba(220,232,240,.6)');
      const x0 = 72, y0 = by - 50;
      R(x0 - 2, y0 + 4, 54, 46, '#e8e5dd'); R(x0 + 4, y0, 42, 6, '#e8e5dd'); R(x0 - 8, y0 + 26, 66, 24, '#e8e5dd');   // 一大团垂到地上的白毛
      for (let i = 0; i < 18; i++) R(x0 - 6 + i * 4 + (i % 2), y0 + 6 + (i % 3) * 4, 2, 44 - (i % 3) * 4, i % 2 ? '#c8c3b8' : '#d8d4ca');
      R(x0 + 15, y0 + 8, 18, 30, '#8e887f'); R(x0 + 15, y0 + 8, 2, 30, '#7a746e'); R(x0 + 31, y0 + 8, 2, 30, '#7a746e');   // 又窄又长的灰脸
      R(x0 + 12, y0 + 4, 24, 7, '#e8e5dd'); R(x0 + 13, y0 + 8, 3, 20, '#e8e5dd'); R(x0 + 32, y0 + 8, 3, 20, '#e8e5dd');
      for (let i = 0; i < 4; i++) R(x0 + 17 + i * 4, y0 + 8, 1, 6 + (i % 2) * 6, '#d8d4ca');
      R(x0 + 17, y0 + 17, 5, 5, '#050505'); R(x0 + 26, y0 + 17, 5, 5, '#050505'); R(x0 + 18, y0 + 17, 1, 1, '#ffffff'); R(x0 + 27, y0 + 17, 1, 1, '#ffffff');
      R(x0 + 20, y0 + 28, 8, 7, '#4a0e12'); R(x0 + 21, y0 + 29, 6, 5, '#120204'); for (let i = 0; i < 4; i++) R(x0 + 21 + i * 2, y0 + 28, 1, 1, '#e8e2d4');   // 张着嘴喊「哥——」
      R(x0 - 10, by - 6, 10, 4, '#d8d4ca'); R(x0 + 50, by - 6, 10, 4, '#d8d4ca');
      R(x0 - 6, by - 4, 74, 4, 'rgba(0,0,0,.4)');
    },
    resume: {
      night: async S => { setNight(S); await nightStart(S); },
      out: async S => { S.goal(S.has('slipper') ? '追上去——长山登山口（巷子东头的石阶）' : '找秀雅（巷子东头，往长山登山口）'); },
      trail: async S => { if (lastDeath === 'trail') { lastDeath = null; await S.think('（听铃铛。它学得再像，也没有铃铛。……还有那些一字不差的话。）'); } S.goal('往上走，找秀雅（听铃铛）'); },
      f2: async S => { if (lastDeath === 'mom') { lastDeath = null; await S.think('（妈妈在家里，在手机里。……林子里那个「妈妈」，只会说她傍晚说过的话。）'); } S.goal('继续往上走（听铃铛）'); },
      chase: async S => { await startChase(S, true); },
      falls: async S => { if (lastDeath === 'fake') { lastDeath = null; await S.think('（它只会学听过的话。……最先答出暗号的那一个，才是秀雅。）'); } S.goal('三块石头后面都是秀雅——问暗号分辨（联机：一人念纸条，一人去问）'); }
    },
    maps: MAPS()
  });
})();
