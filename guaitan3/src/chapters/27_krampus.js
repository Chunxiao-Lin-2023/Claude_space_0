/* ================= 第二十七夜 · 坎卜斯 ================= */
(() => {
  /* ---------- 可调参数 ---------- */
  const PARADE_T = 150;      // 游行到七点钟声的秒数
  const PARADE_MIN = 90;     // 重来后至少给的秒数
  const KSPD = 3.2;          // 坎卜斯追人的速度（玩家走 4.2 / 跑 6.8）
  const KFAR = 4.0;          // 落后超过 5 格时它加快到这个速度：走路的人甩不掉它，跑的人才甩得掉
  const LOSE = 8.5;          // 拉开超过这么多格，它就不追了，转头去找孩子（实测：走路时保持在 3–7 格，一路跑会拉到 9 格以上）
  const WARN = 7.5;          // 超过这个距离先警告一次
  const REGAIN = 7;          // 回到这么近，它又盯上你
  const KIDS = [27, 16];     // 菲利克斯在广场东头的位置
  /* ---------- 跨重来保留的计数（W.f 会被检查点还原） ---------- */
  let ACC_WRONG = 0, CARD_WRONG = 0, TONI_WRONG = 0, PARADE_LEFT = null, PARADE_FAILS = 0, LURE_DIED = 0, FOREST_DIED = 0;
  let L = null, JT = 0, IDT = 0, AMB = 0, CHQ = null, HB = 0;

  /* 标题卡在窄屏上只在全角空格处折行 */
  const nb = s => s.split('　').map(p => [...p].join('⁠')).join('　');

  /* ---------- 合成音 ---------- */
  function bellJ(S, v = .05, d = 0) {   // 跑铃人腰上的牛铃：几个不和谐的金属音叠在一起
    S.tone('square', 980, 940, .2, v * .45, d, 2600); S.tone('triangle', 1470, 1430, .3, v, d + .015); S.tone('triangle', 640, 610, .36, v * .7, d + .03);
  }
  function chainS(S, v = .08, d = 0) {   // 锁链
    S.tone('square', 220, 150, .07, v, d, 1400); S.tone('square', 270, 190, .06, v * .8, d + .09, 1400); S.tone('sawtooth', 130, 90, .12, v * .6, d + .18, 900);
  }
  function churchBell(S, v = .16) { S.tone('sine', 196, 194, 2.6, v); S.tone('sine', 392, 389, 2, v * .45, .01); S.tone('triangle', 588, 580, 1.4, v * .22, .02); }
  function goatBell(S, v = .06) { S.tone('triangle', 1760, 1740, .28, v); S.tone('sine', 2640, 2610, .2, v * .4, .01); }
  function goldS(S) { S.tone('sine', 1046, 1046, .5, .06); S.tone('sine', 1318, 1318, .6, .05, .12); S.tone('sine', 1568, 1568, .9, .05, .24); }

  /* ---------- 雪地瓦片 ---------- */
  const snowP = (R, X, Y) => { speck(R, '#a9b2c2', ['#bac2d0', '#99a2b4', '#c8d0dc'], X, Y, 14, 41); if (hash(X, Y, 43) < .12) R((hash(X, Y, 44) * 14) | 0, (hash(X, Y, 45) * 14) | 0, 1, 1, '#e8eef6'); };

  /* ---------- 坎卜斯（跑铃人）精灵：e.fur 毛色 e.mask 面具 e.horn 角型 e.feet 脚 e.breath 呼白气 e.scarf 围巾 e.basket 背篓 ---------- */
  function hornsF(r, kind, HC, HD, dy, side) {
    if (side) {
      if (kind === 'ram') { r(9, -13 + dy, 3, 3, HC); r(11, -11 + dy, 2, 3, HC); r(10, -8 + dy, 2, 1, HD); return; }
      if (kind === 'short') { r(7, -14 + dy, 2, 3, HC); return; }
      if (kind === 'straight') { r(7, -17 + dy, 2, 6, HC); r(7, -18 + dy, 1, 1, HD); return; }
      r(7, -15 + dy, 2, 4, HC); r(9, -18 + dy, 2, 3, HC); r(11, -20 + dy, 1, 2, HD); return;
    }
    if (kind === 'ram') { r(2, -13 + dy, 3, 3, HC); r(1, -11 + dy, 2, 4, HC); r(2, -8 + dy, 2, 1, HD); r(11, -13 + dy, 3, 3, HC); r(13, -11 + dy, 2, 4, HC); r(12, -8 + dy, 2, 1, HD); return; }
    if (kind === 'short') { r(5, -14 + dy, 2, 3, HC); r(9, -14 + dy, 2, 3, HC); return; }
    if (kind === 'straight') { r(5, -17 + dy, 2, 6, HC); r(9, -17 + dy, 2, 6, HC); r(5, -18 + dy, 1, 1, HD); r(10, -18 + dy, 1, 1, HD); return; }
    r(4, -15 + dy, 2, 4, HC); r(3, -18 + dy, 2, 3, HC); r(2, -20 + dy, 1, 2, HD); r(10, -15 + dy, 2, 4, HC); r(11, -18 + dy, 2, 3, HC); r(13, -20 + dy, 1, 2, HD);
  }
  function footF(r, x, y, kind) {
    if (kind === 'hoof') { r(x, y, 3, 2, '#181212'); r(x + 1, y, 1, 2, '#3a3030'); }
    else if (kind === 'bare') { r(x, y, 3, 2, '#d8b49a'); r(x, y + 1, 3, 1, '#b89078'); }
    else { r(x - 1, y, 4, 2, '#2a1a10'); r(x - 1, y, 4, 1, '#4a3020'); }
  }
  function krDraw(g, e, t, R) {
    const d = e.dir === 3 ? 3 : (e.dir === 1 || e.dir === 2) ? 1 : 0, M = e.dir === 2;
    const r = (x, y, w, h, c) => R(M ? 16 - x - w : x, y, w, h, c);
    const F = e.fur || '#4a3020', FD = shade(F, -.3), FL = shade(F, .2), MK = e.mask || '#7a2a1a', MD = shade(MK, -.35), HC = e.hornC || '#d8ccb0', HD = shade(HC, -.3);
    const st = e.fr === 1 ? 1 : e.fr === 3 ? -1 : 0, un = e.unmask, rev = e.rev;
    const fk = e.feet || 'boot', lf = fk === 'boot' ? 'boot' : 'hoof', rf = fk === 'boot' || fk === 'hoofboot' ? 'boot' : fk === 'hoof2' ? 'hoof' : 'bare';
    const l1 = st === 1 ? -1 : 0, l2 = st === -1 ? -1 : 0;
    if (d === 1) { r(5, 10 + l1, 3, 4, FD); r(8, 10 + l2, 3, 4, F); footF(r, 5, 14 + l1, lf); footF(r, 8, 14 + l2, rf); }
    else { r(4, 10 + l1, 3, 4, FD); r(9, 10 + l2, 3, 4, FD); footF(r, 4, 14 + l1, lf); footF(r, 9, 14 + l2, rf); }
    const spots = e.spots ? (x, y) => { if (hash(x, y, 7) < .5) r(x, y, 2, 2, '#e8dcc8'); } : null;
    if (d === 0) {
      r(3, -3, 10, 14, F); r(2, -1, 1, 10, FD); r(13, -1, 1, 10, FD); for (let i = 0; i < 5; i++) r(3 + i * 2, 10, 1, 2, FD);
      r(5, 0, 6, 6, FL); if (spots) { spots(4, 1); spots(9, 3); spots(6, 8); }
      r(3, 6, 10, 1, '#2a1a10'); for (const x of [3, 6, 9, 12]) { r(x, 7, 2, 2, '#c8a040'); r(x, 9, 2, 1, '#7a5a20'); }
      r(1, -1, 2, 8, FD); r(13, -1, 2, 8, FD);
      r(14, -6, 1, 13, '#5a3a20'); r(13, -8, 1, 3, '#6a4a2a'); r(15, -9, 1, 4, '#6a4a2a'); r(12, -7, 1, 2, '#6a4a2a');
      r(3, -12, 10, 3, F); r(3, -10, 1, 8, F); r(12, -10, 1, 8, F);
      if (un) {
        r(4, -15, 8, 4, MK); r(5, -14, 2, 1, '#120808'); r(9, -14, 2, 1, '#120808');
        r(4, -11, 8, 8, '#e8b898'); r(6, -8, 1, 1, '#2a1a10'); r(9, -8, 1, 1, '#2a1a10'); r(5, -6, 1, 1, '#e88a7a'); r(10, -6, 1, 1, '#e88a7a'); r(7, -5, 2, 1, '#8a3a2a');
        hornsF(r, e.horn, HC, HD, -4);
      } else {
        r(4, -11, 8, 8, MK); r(4, -11, 8, 1, MD);
        r(5, -9, 2, 2, '#0a0404'); r(9, -9, 2, 2, '#0a0404');
        if (rev) { r(5, -9, 1, 1, '#ffd040'); r(9, -9, 1, 1, '#ffd040'); }
        r(7, -7, 2, 2, MD); r(5, -5, 6, 2, '#0a0404'); r(5, -5, 1, 1, '#e8e0c8'); r(10, -5, 1, 1, '#e8e0c8');
        r(7, -4, 2, rev ? 7 : 4, '#c02030');
        if (e.scarf) r(4, -4, 8, 2, '#7a2a2a');
        hornsF(r, e.horn, HC, HD, 0);
      }
    } else if (d === 3) {
      r(3, -3, 10, 14, F); r(2, -1, 1, 10, FD); r(13, -1, 1, 10, FD); for (let i = 0; i < 5; i++) r(3 + i * 2, 10, 1, 2, FD);
      if (spots) { spots(4, 2); spots(9, 6); }
      r(3, 6, 10, 1, '#2a1a10'); r(3, 7, 2, 2, '#c8a040'); r(11, 7, 2, 2, '#c8a040');
      if (e.basket) { box(r, 3, -5, 10, 10, '#8a6a3a'); r(4, -2, 8, 1, '#6a4a2a'); r(4, 1, 8, 1, '#6a4a2a'); }
      r(1, -1, 2, 8, FD); r(13, -1, 2, 8, FD);
      r(3, -12, 10, 10, F); r(4, -12, 8, 1, FL);
      hornsF(r, e.horn, HC, HD, un ? -4 : 0);
    } else {
      r(4, -3, 8, 14, F); r(4, -1, 1, 10, FD); for (let i = 0; i < 4; i++) r(4 + i * 2, 10, 1, 2, FD);
      if (spots) { spots(6, 1); spots(8, 6); }
      r(4, 6, 8, 1, '#2a1a10'); r(4, 7, 2, 2, '#c8a040'); r(7, 7, 2, 2, '#c8a040');
      if (e.basket) { box(r, 11, -4, 4, 9, '#8a6a3a'); r(11, -1, 4, 1, '#6a4a2a'); }
      r(6, -1, 2, 8, FD); r(5, -5, 1, 12, '#5a3a20'); r(4, -7, 1, 3, '#6a4a2a'); r(6, -8, 1, 3, '#6a4a2a');
      r(9, -12, 4, 10, F);
      if (un) { r(5, -15, 6, 4, MK); r(4, -11, 6, 8, '#e8b898'); r(5, -8, 1, 1, '#2a1a10'); r(4, -6, 1, 1, '#e88a7a'); hornsF(r, e.horn, HC, HD, -4, true); }
      else {
        r(4, -11, 7, 8, MK); r(2, -7, 2, 3, MK); r(4, -11, 7, 1, MD);
        r(5, -9, 2, 2, '#0a0404'); if (rev) r(5, -9, 1, 1, '#ffd040');
        r(2, -5, 3, 1, '#0a0404'); r(3, -4, 1, rev ? 7 : 5, '#c02030');
        if (e.scarf) r(3, -4, 7, 2, '#7a2a2a');
        hornsF(r, e.horn, HC, HD, 0, true);
      }
    }
    if (e.ring && d !== 3 && !e.chained && Math.sin(t * 15 + (e.x || 0)) > .2) { const c = '#f8e8a0'; if (d === 0) { r(2, 8, 1, 1, c); r(13, 7, 1, 1, c); r(1, 6, 1, 1, c); r(14, 9, 1, 1, c); } else { r(3, 8, 1, 1, c); r(10, 7, 1, 1, c); r(9, 9, 1, 1, c); } }
    if (e.chained) { for (let i = 0; i < 11; i++) r(2 + i, -2 + i, 1, 1, i % 2 ? '#6a6a72' : '#b0b0b8'); r(12, 9, 1, 6, '#9a9aa2'); r(12, 15, 3, 1, '#9a9aa2'); }
    if ((e.breath || e.scarf) && d !== 3 && !e.unmask) {
      const ph = (t * .9 + (e.x || 0) * .37) % 2.4;
      if (ph < 1.2) { const a = (e.scarf ? .32 : .55) * (1 - ph / 1.2); const c = `rgba(228,234,244,${a.toFixed(2)})`; if (d === 0) r(6 - ph * 2, -4 - ph * 5, 4 + ph * 3, 2, c); else r(1 - ph * 3, -6 - ph * 4, 3 + ph * 2, 2, c); }
    }
  }

  /* ---------- 游行里的六个跑铃人 ---------- */
  const RUN = {
    k1: { look: '一个灰毛、两根直犄角的坎卜斯。', bells: '腰上挂着一圈铜铃。它扭身子的时候铃铛跟着晃，却一声没响——凑近了才看见，每个铃舌上都缠着厚厚的布条。', breath: '面具的嘴缝里，一团一团地冒着白气。', prints: '它脚边的雪地上，是两只大皮靴的印子。', who: '锯木厂的弗里茨', why: '它嘴里冒着白气，脚下是皮靴印。铃铛不响，是因为铃舌缠了布。' },
    k2: { look: '黑毛，两只卷成圈的羊角。', bells: '它一喘气，满身的铃铛就叮叮当当乱响。', breath: '脖子上缠着一条厚围巾。……围巾缝里，一丝一丝地往外冒白气。', prints: '雪地上是两只分瓣的蹄印——凑近一看，蹄印边上有刀削的木纹，是木头做的蹄子鞋。两只都是。', who: '小施密特', why: '它的铃铛一直在响，围巾缝里冒白气。两只脚都是木头蹄子鞋。' },
    k3: { look: '白毛，一对长犄角，面具涂成了暗红色。', bells: '铃铛哗啦哗啦地响。', breath: '它呼哧呼哧地喘，白气喷了你一脸，一股烧酒味。', prints: '雪地上一只蹄印，一只皮靴印。另一只木蹄鞋不知道跑丢在哪儿了。', who: '酒馆老板的侄子', why: '铃铛在响，白气喷了你一脸。一只蹄、一只靴子——不是光脚。' },
    k4: { look: '棕毛，两只短短的犄角。', bells: '它的铃铛也不响。……铃口里结了一层冰，铃舌冻住了。', breath: '面具底下冒着白气。', prints: '雪地上是两只皮靴印。', who: '邮递员韦伯', why: '铃铛是冻住了才不响。它在呼白气，脚下是皮靴印。' },
    k5: { look: '花斑毛，一对长犄角，背上背着一只大篓子。', bells: '铃铛一路叮当乱响。', breath: '面具的嘴缝里冒着白气。', prints: '雪地上是两只皮靴印。', who: '铁匠——托尼的爸爸', why: '铃铛在响，呼着白气，脚下是皮靴印。' },
    kr: { look: '暗褐色的毛，一对又长又弯的犄角，黑红色的面具，舌头一直耷拉到胸口。', bells: '它腰上的铃铛比谁都多。它转过头来看你的时候，那一大串铃铛跟着晃了一下。\n……一声也没响。铃舌上没有布，也没有冰。', breath: '这么冷的夜里，它面具的嘴缝里，什么也没有冒出来。', prints: '它脚边的雪地上：一只是分瓣的大蹄印，一只是光着的人脚印。' }
  };
  const RINGING = ['k2', 'k3', 'k5'];
  const RUNNERS = ['k1', 'k2', 'k3', 'k4', 'k5', 'kr'];
  const PARADE_SHOW = ['crowdN1', 'crowdN2', 'crowdS1', 'crowdS2', 'felix_p', 'opa_p', 'niko', 'toni_p', 'k1', 'k2', 'k3', 'k4', 'k5', 'kr', 'pk1', 'pk2', 'pk3', 'pk4', 'pk5', 'pkr', 'bmask', 'tor1', 'tor2', 'tor3', 'tor4'];
  const PARADE_HIDE = ['liesl', 'ilse', 'huber', 'wirt', 'toni', 'felix'];

  const KIDLINE = { dF: '菲利克斯：摘了胡贝尔家山羊「小雪」脖子上的铃铛，挂在自己的雪橇上。小雪跑进了林子。', dL: '莉泽尔：撕碎了伊尔泽奶奶的一张旧明信片，还说是风吹走的。', dT: '托尼：往教堂台阶上泼水，冻成滑道。马蒂亚斯老爷爷在上面摔了一跤，拐杖断成两截。他笑着跑了。' };
  const LENILINE = '莱妮：对弟弟说，愿坎卜斯今晚把他塞进篓子背走，再也不要看见他。';
  function bookText(f) {
    const m = k => (f[k] ? '【金】' : '【红】');
    return '页头是很老的花体字：\n「十二月五日，七下钟声响时，红字未清的孩子，归它的背篓。」\n\n' +
      m('dF') + KIDLINE.dF + '\n' + m('dL') + KIDLINE.dL + '\n' + m('dT') + KIDLINE.dT + '\n' +
      (f.wax ? (f.leniGold ? '【金】' : '【红】') + LENILINE : '（最后一行被一滴黑蜡封着，揭不开。）') +
      '\n\n页脚一行褐色的小字：「东西修好，话说出口，红字自会变金。」';
  }

  defChapter({
    id: 'krampus', n: 27, title: '坎卜斯', sub: '圣尼古拉之夜，跑铃的队伍里多出了一个。它满身铃铛，一声不响。', origin: '阿尔卑斯山区民间传说', color: '#3a1a16',
    amb: 'wind', floor: 'snow', floor2: 'snowpath', wall: 'plain', dark: .62, plr: 3.4,
    people: {
      me: { skin: '#f0c8a8', hair: '#c8a050', hs: 'twin', top: '#8a2a2a', top2: '#e8dcc0', coat: true, bottom: '#3a3040', shoes: '#3a2a1a', blush: '#e8a090', eye: '#2a4a7a' },
      opa: { key: 'kr-opa', skin: '#e0b090', hair: '#e8e8e8', hs: 'short', top: '#4a5a3a', top2: '#2a3a20', apron: '#7a5a3a', bottom: '#4a3a2a', shoes: '#2a1a10',
        extra(g, d, fr, G, R) { if (d === 0) { R(5, G.hT + 5, 6, 3, '#e8e8e8'); R(6, G.hT + 8, 4, 2, '#d8d8d8'); R(7, G.hT + 6, 2, 1, '#8a3a2a'); } else if (d === 1) { R(3, G.hT + 5, 4, 4, '#e8e8e8'); } } },
      felix: { skin: '#f0c8a8', hair: '#d8b060', hs: 'messy', child: true, top: '#3a6a9a', bottom: '#5a4030', shoes: '#3a2a1a', hat: 'cap', hatC: '#c03030', blush: '#e8a090' },
      liesl: { skin: '#f0c8a8', hair: '#7a4a2a', hs: 'twin', child: true, dress: true, top: '#5a3a6a', top2: '#e8e0d0', apron: '#e8e0d0', shoes: '#3a2a1a', blush: '#e8a090' },
      toni: { skin: '#e8c0a0', hair: '#2a1a14', hs: 'short', child: true, top: '#5a6a3a', bottom: '#3a3030', shoes: '#2a1a10', hat: 'cap', hatC: '#4a4a5a' },
      matthias: { key: 'kr-matthias', skin: '#e0b898', hair: '#d8d8d8', hs: 'bald', top: '#2a2a30', top2: '#e8e8e8', bottom: '#2a2a30', robe: true, shoes: '#111',
        extra(g, d, fr, G, R) { if (d === 0) { R(5, G.hT + 5, 6, 4, '#e0e0e0'); R(6, G.hT + 9, 4, 2, '#d0d0d0'); R(13, G.tT, 1, 13, '#7a5a3a'); } else if (d === 1) { R(3, G.hT + 5, 4, 5, '#e0e0e0'); R(2, G.tT, 1, 13, '#7a5a3a'); } } },
      niko: { key: 'kr-niko', skin: '#e0b898', hair: '#f0f0f0', hs: 'bald', top: '#a02020', top2: '#f0e8d0', robe: true, bottom: '#a02020', shoes: '#111',
        extra(g, d, fr, G, R) {
          const h = G.hT;
          if (d === 0) { R(4, h - 2, 8, 4, '#f0e8d0'); R(5, h - 4, 6, 2, '#f0e8d0'); R(6, h - 5, 4, 1, '#f0e8d0'); R(7, h - 4, 2, 5, '#c8a040'); R(5, h + 5, 6, 5, '#f4f4f4'); R(6, h + 10, 4, 2, '#e8e8e8'); R(7, G.tT, 2, 12, '#e8d8a0'); R(13, h - 3, 1, 21, '#c8a040'); R(12, h - 4, 2, 2, '#c8a040'); R(14, h - 3, 1, 2, '#c8a040'); }
          else if (d === 1) { R(4, h - 2, 7, 4, '#f0e8d0'); R(5, h - 4, 5, 2, '#f0e8d0'); R(3, h + 5, 4, 6, '#f4f4f4'); R(2, h - 3, 1, 21, '#c8a040'); R(1, h - 4, 2, 2, '#c8a040'); }
          else { R(4, h - 2, 8, 4, '#f0e8d0'); R(5, h - 4, 6, 2, '#f0e8d0'); R(7, G.tT, 2, 12, '#e8d8a0'); }
        } },
      ilse: { skin: '#e8c0a8', hair: '#c0c0c0', hs: 'bun', hat: 'scarf', hatC: '#3a3a5a', top: '#3a2a3a', skirt: true, bottom: '#2a2028', shoes: '#1a1010' },
      huber: { skin: '#d8a888', hair: '#5a3a2a', hs: 'bun', hat: 'scarf', hatC: '#8a3a2a', top: '#5a4a3a', apron: '#c8c0a8', skirt: true, bottom: '#3a3028', shoes: '#2a1a10' },
      wirt: { skin: '#e0a888', hair: '#4a3020', hs: 'short', top: '#e8e0d0', top2: '#3a5a2a', apron: '#3a5a2a', bottom: '#2a2a2a', shoes: '#1a1010', blush: '#d87a6a' }
    },
    faces: {
      /* 坎卜斯：黑红的木头面具、两只往外弯的白角、一对发黄光的眼睛、越伸越长的红舌头 */
      krampus(R, a, t) {
        const F = '#2a160e', F2 = '#4a2a1a', H = '#d8ccb0', HD = '#8a7a60', M = '#6a2016', MD = '#3a0e08', K = '#080303';
        R(0, 0, 32, 32, '#0a0606');
        R(3, 8, 6, 24, F); R(23, 8, 6, 24, F); R(6, 26, 20, 6, F); for (let i = 0; i < 7; i++) R(3 + i * 4, 27 + (i % 2), 2, 5, F2);
        R(7, 4, 4, 4, H); R(4, 1, 4, 4, H); R(2, 0, 3, 2, HD); R(8, 6, 2, 1, HD); R(5, 3, 1, 1, HD);
        R(21, 4, 4, 4, H); R(24, 1, 4, 4, H); R(27, 0, 3, 2, HD); R(22, 6, 2, 1, HD); R(26, 3, 1, 1, HD);
        R(8, 6, 16, 20, M); R(8, 6, 16, 2, MD); R(8, 6, 1, 20, MD); R(23, 6, 1, 20, MD);
        R(9, 10, 6, 2, MD); R(17, 10, 6, 2, MD);
        R(10, 12, 4, 3, K); R(18, 12, 4, 3, K);
        const gl = Math.sin(t * 7) > -.6 ? '#ffd040' : '#a07010'; R(11, 13, 2, 1, gl); R(19, 13, 2, 1, gl);
        R(14, 14, 4, 5, MD); R(14, 18, 1, 1, K); R(17, 18, 1, 1, K);
        const mo = Math.round(Math.min(1, a * 2) * 3);
        R(10, 20, 12, 3 + mo, K); for (let i = 0; i < 6; i++) R(10 + i * 2, 20, 1, 2, '#e8e0c8');
        const tl = 5 + Math.round(a * 7);
        R(14, 21, 4, tl, '#b01828'); R(15, 21, 2, tl, '#d02838'); R(14, 21 + tl, 4, 1, '#801018');
        R(4, 29, 4, 3, '#c8a040'); R(24, 29, 4, 3, '#c8a040');
      },
      /* 黑面具：拧着劲的角、刻出来的笑；眼洞里慢慢出现的，是你自己的眼睛 */
      bmask(R, a, t) {
        R(0, 0, 32, 32, '#050404');
        const B = '#161010', B2 = '#241a18';
        for (let i = 0; i < 6; i++) { R(6 - i, 8 - i, 3, 2, i % 2 ? '#cfc6b0' : '#a89e88'); R(23 + i, 8 - i, 3, 2, i % 2 ? '#cfc6b0' : '#a89e88'); }
        R(7, 6, 18, 22, B); R(9, 4, 14, 3, B); R(10, 28, 12, 2, B);
        for (let y = 8; y < 28; y += 3) R(8, y, 16, 1, B2);
        R(10, 12, 5, 4, '#000'); R(17, 12, 5, 4, '#000');
        if (a > .35) { R(12, 13, 2, 2, '#4a7ab0'); R(19, 13, 2, 2, '#4a7ab0'); R(12, 13, 1, 1, '#e8f0f8'); R(19, 13, 1, 1, '#e8f0f8'); }
        R(15, 17, 2, 4, B2);
        R(11, 23, 10, 1, '#000'); R(10, 22, 1, 1, '#000'); R(21, 22, 1, 1, '#000');
      }
    },
    items: {
      glocke: { name: '小雪的铃铛', desc: '一只铜铃铛，拴着一截红毛线。胡贝尔家的山羊「小雪」脖子上的。\n一晃，叮——当。' },
      streifen: { name: '四条碎卡片', desc: '一张旧明信片，被撕成了四条横条。点「笺」（J）可以再看每一条的样子。' },
      karte: { name: '拼好的明信片', desc: '「Gruß vom Krampus!（坎卜斯问候你！）」1909年。\n「十二月五日夜，跑铃的人里，有一个不是人。它满身铃铛，一声不响；冷夜里，嘴里不冒白气。脚——」\n最后一句被火烧掉了。' },
      kruecke0: { name: '断拐杖', desc: '一根山毛榉拐杖，断成了两截。断口上还沾着冰碴。' },
      kruecke: { name: '修好的拐杖', desc: '爷爷在断口上箍了一圈铜，比原来还结实。' },
      buch: { name: '金书', get desc() { return '教堂的金书，沉甸甸的。翻到最后一页：\n' + (W ? bookText(W.f) : ''); } }
    },
    notes: {
      opa: { title: '爷爷的刻刀账（最后一页）', text: '（字写得很用力，有几处把纸都划破了。）\n\n十二月五日。今年跑铃的面具都交出去了。椴木的，一张刻了九天。\n\n墙角那张黑的，不是我刻的，也不是我父亲刻的。我爷爷说，他小时候它就挂在那儿了，脸朝着墙。\n\n规矩只有三条：\n一、不许把它翻过来。\n二、不许拿出这间屋子。\n三、谁也不许戴。\n\n我爷爷说，戴上它的人，就看得见它——它也看得见你。\n到那时候，你就是它了。' },
      buch: { title: '金书·最后一页', text: '（金书是教堂的，两百多年了。每年十二月五日，圣尼古拉拿着它，念孩子们这一年里做的好事和坏事。马蒂亚斯说，这一页的红字，今天下午突然就在了，不是他写的。）\n\n' + bookText({}) },
      karte: { title: '四条碎卡片', text: '一张旧明信片，被撕成了四条横条。按莉泽尔塞给你的顺序：\n\n①　上边：两根又粗又黑的犄角根，被撕断了。\n　　中间：一张木头面具，一条红舌头耷拉到胸口。写着：「有一个不是人。」\n　　下边：腰上一圈铃铛，只露出上半个。\n\n②　上边：卡片顶上的白边，烫金字：Gruß vom Krampus!（坎卜斯问候你！）\n　　中间：两只弯弯的犄角尖。写着：「十二月五日夜，跑铃的人里，」\n　　下边：犄角往下变粗，被撕断了。\n\n③　上边：毛茸茸的腿。\n　　中间：被火烧焦了一大块。写着：「脚——」（后面烧没了）\n　　下边：卡片底下的白边，邮戳：1909。\n\n④　上边：铃铛的下半个。\n　　中间：锁链，背篓，篓口伸出两条小腿。写着：「它满身铃铛，一声不响；冷夜里，嘴里不冒白气。」\n　　下边：毛茸茸的腿。' },
      zeitung: { title: '圣器室墙上的旧剪报', text: '（玻璃框里，纸已经黄透了。是三十多年前山谷里的小报。）\n\n　　雪崩过后　教堂司事背出两个孩子\n\n本周二午后，北坡发生雪崩，正在山上放羊的两个孩子被埋。教堂司事马蒂亚斯（时年三十一岁）独自上山，徒手在雪里刨了四个钟头，先后把两个孩子背下山来：磨坊家十岁的女孩，和铁匠家八岁的小儿子。\n\n两个孩子都活了下来。司事本人的左腿被冰下的石头压碎，医生说，以后恐怕要拄拐了。\n记者问他怕不怕。他说：「怕。可那两个孩子更怕。」\n\n（剪报底下，有人用铅笔添了一行：「今年起，圣尼古拉由他来扮。」）' }
    },
    legend: '【流传的说法】坎卜斯（Krampus）是阿尔卑斯山区——奥地利、德国巴伐利亚、意大利南蒂罗尔、斯洛文尼亚等地——圣尼古拉节习俗里的「黑色同伴」。12月6日是圣尼古拉的瞻礼日，前一夜12月5日被称作「坎卜斯之夜」（Krampusnacht）。按老规矩，圣尼古拉挨家走访，给乖孩子苹果、坚果、橘子和糖；跟在他身后的坎卜斯长着山羊角、浑身黑毛、吐着长长的红舌头，身上拖着锁链、挂着大大小小的铃铛，手里拿一把桦枝，背上背着篓子或麻袋——据说最调皮的孩子会被塞进去带走。在许多画像和老贺卡上，它一只脚是分瓣的山羊蹄，一只是人脚。\n\n【有出处的说法】一般认为这个名字来自古高地德语里表示「爪子」的词。锁链常被解释为基督教会「捆住魔鬼」的象征。有民俗学者推测它源于基督教之前的冬日习俗，但历史学家多认为证据不足——相关记载要到16世纪才出现。19世纪起，印着「Gruß vom Krampus!（坎卜斯问候你！）」的坎卜斯贺卡（Krampuskarten）在奥地利一带流行；施蒂利亚等地有把桦枝刷成金色、常年挂在屋里提醒孩子的习惯。20世纪30年代初，奥地利当局一度禁止这一习俗；50年代，政府还发过题为《坎卜斯是个坏人》的小册子，担心它吓坏孩子。今天的「坎卜斯游行」（Krampuslauf）上，年轻人戴着手工雕刻的木头面具、披着兽皮、挂着沉重的牛铃在街上奔跑，吓唬围观的人。\n\n【查无实据】「游行完一数，跑铃的人多出来一个」「真的坎卜斯会混进队伍里」之类的说法，是围绕游行流传的吓人故事，查无实据。\n\n【游戏虚构】本章的小镇、莱妮一家、马蒂亚斯、托尼、莉泽尔、伊尔泽、胡贝尔太太和跑铃的人都是虚构的；金书上自己出现的红字与黑蜡、1909年的明信片和上面的诗句、旧剪报、「铃不响、不冒白气、一蹄一脚」的辨认法、黑面具的三条规矩，以及把坎卜斯引到圣尼古拉面前用锁链拴住的情节，均为游戏虚构。',
    start: { map: 'werk', x: 8, y: 6, dir: 1 },
    endings: { true: '第二十七夜　完', good: '最后一行红字', bell: '钟敲了七下', mask: '它的脸' },
    thumb(g, w, h) {   // 雪夜的屋顶、亮着的窗、一个背着篓子的坎卜斯剪影
      const gy = h - 22;
      const sk = g.createLinearGradient(0, 0, 0, gy); sk.addColorStop(0, '#0c1020'); sk.addColorStop(1, '#2a1a24'); g.fillStyle = sk; g.fillRect(0, 0, w, gy);
      g.fillStyle = '#d8dee8'; for (let i = 0; i < 40; i++) g.fillRect((hash(i, 1, 27) * w) | 0, (hash(i, 2, 27) * gy) | 0, 1, 1);
      g.fillStyle = '#141018'; for (let i = 0; i < 5; i++) { const x = i * (w / 4.5) - 6, hh = 18 + hash(i, 3, 27) * 10; g.fillRect(x, gy - hh, w / 5.5, hh); g.fillStyle = '#d0d8e4'; g.beginPath(); g.moveTo(x - 4, gy - hh); g.lineTo(x + w / 11, gy - hh - 10); g.lineTo(x + w / 5.5 + 4, gy - hh); g.fill(); g.fillStyle = '#e8b050'; g.fillRect(x + 5, gy - hh + 6, 4, 4); g.fillStyle = '#141018'; }
      g.fillStyle = '#c8d0dc'; g.fillRect(0, gy - 6, w, 28);
      const sc = 3, ox = w * .5 - 8 * sc, oy = gy - 16 * sc + 4;
      const R = (x, y, ww, hh, c) => { if (!c) return; g.fillStyle = c; g.fillRect(ox + x * sc, oy + y * sc, ww * sc, hh * sc); };
      krDraw(g, { dir: 1, fr: 0, fur: '#3a2418', mask: '#6a2016', horn: 'long', feet: 'hooffoot', basket: true, rev: true }, 0, R);
      g.fillStyle = 'rgba(255,210,90,.28)'; g.beginPath(); g.arc(w * .2, gy - 8, 9, 0, 7); g.fill();
    },
    async intro(S) {
      ACC_WRONG = 0; CARD_WRONG = 0; TONI_WRONG = 0; PARADE_LEFT = null; PARADE_FAILS = 0; LURE_DIED = 0; FOREST_DIED = 0; L = null;
      await S.card(nb('第二十七夜　坎卜斯'), nb('1966年12月5日　奥地利施蒂利亚州　山谷里的小镇'), '十二月五日，圣尼古拉节的前一夜。\n\n山里的老人说，这天晚上，圣尼古拉会拿着他的金书挨家来。\n乖孩子的靴子里，第二天早上会有苹果、核桃和橘子。\n\n跟在他身后的，是长着角的坎卜斯。\n它背着篓子，拿着桦枝，拖着锁链，浑身挂满了铃铛。');
    },
    resume: {
      tasks: async S => { },
      forest: async S => { if (FOREST_DIED) await S.think('（只跟着小小的、两瓣一对的羊蹄印走。\n一只蹄子一只光脚的那一串——别跟。）'); },
      ready: async S => { },
      parade: async S => {
        if (PARADE_FAILS) await S.think('（铃铛不响——又不是缠了布、结了冰；嘴里没有白气；一只蹄子，一只光脚。\n三样都对得上的，才是它。）');
        startParade(S, clamp(PARADE_LEFT == null ? PARADE_T : PARADE_LEFT, PARADE_MIN, PARADE_T));
      },
      lure: async S => {
        S.place('kr', 4, 17, 2); S.pos(7, 17, 2);
        if (LURE_DIED) await S.think('（走，别跑。别停下让它够着；也别甩开它——甩远了，它就去找菲利克斯。）');
        startLure(S);
      }
    },
    tick(S, dt) {
      const ph = S.f.ph;
      if (ph === 'parade' && S.timerLeft != null) PARADE_LEFT = S.timerLeft;
      if (ph === 'lure') return lureTick(S, dt);
      if (S.busy) return;
      if (ph === 'ready' && S.map === 'town' && S.pl.y >= 15) { S.f.ph = 'parade0'; S.run(paradeStart); return; }
      if (ph === 'parade' && S.map === 'town') paradeTick(S, dt);
      if (ph === 'tasks' && S.map === 'wald') forestTick(S, dt);
    },
    tiles: {
      snow: { solid: false, paint: snowP },
      snowpath: { solid: false, paint(R, X, Y) { speck(R, '#868fa0', ['#939cac', '#7a8394', '#a0a8b6'], X, Y, 14, 46); if (hash(X, Y, 47) < .3) { R(4, 3, 2, 3, '#767f90'); R(9, 10, 2, 3, '#767f90'); } } },
      spine: { solid: true, paint(R, X, Y) { snowP(R, X, Y); const c = hash(X, Y, 48) < .5 ? '#1a2e24' : '#16281f'; for (let i = 0; i < 7; i++) { R(7 - i, 1 + i * 2, 2 + i * 2, 2, i % 2 ? c : shade(c, .15)); if (i % 2 === 0) R(7 - i, 1 + i * 2, 2 + i * 2, 1, '#dfe6ee'); } R(7, 14, 2, 2, '#2a1c12'); } },
      sfence: { solid: true, paint(R, X, Y) { snowP(R, X, Y); R(0, 6, 16, 2, '#5a4430'); R(0, 11, 16, 2, '#5a4430'); R(0, 5, 16, 1, '#e8eef4'); R(2, 3, 2, 12, '#6e5438'); R(11, 3, 2, 12, '#6e5438'); R(2, 2, 2, 1, '#e8eef4'); R(11, 2, 2, 1, '#e8eef4'); } },
      icebrook: { solid: true, paint(R, X, Y) { R(0, 0, 16, 16, '#5e7e98'); R(0, 0, 16, 2, '#d8e2ec'); R(0, 14, 16, 2, '#c8d4e0'); R((hash(X, Y, 49) * 10) | 0, 6, 5, 1, '#8aa8c0'); R(((hash(X, Y, 50) * 10) | 0) + 2, 10, 4, 1, '#3a5a74'); } },
      sbush: { solid: true, paint(R, X, Y) { snowP(R, X, Y); R(1, 5, 14, 10, '#2a3426'); for (let i = 0; i < 8; i++) R((hash(X, Y, 60 + i) * 14) | 0, 5 + ((hash(Y, X, 60 + i) * 9) | 0), 2, 1, i % 2 ? '#4a3a2a' : '#1a2418'); R(2, 4, 12, 2, '#e0e6ee'); R(4, 3, 4, 1, '#e8eef4'); } }
    },
    sprites: {
      krampus: krDraw,
      goat(g, e, t, R) {
        const M = e.dir === 2, r = (x, y, w, h, c) => R(M ? 16 - x - w : x, y, w, h, c);
        const W0 = '#ece8e0', WD = '#c8c2b8', st = e.fr === 1 ? 1 : e.fr === 3 ? -1 : 0, HC = '#9a8a70';
        if (e.dir === 0 || e.dir === 3) {
          r(4, 5, 8, 6, W0); r(5, 11, 1, 4 - (st === 1 ? 1 : 0), WD); r(10, 11, 1, 4 - (st === -1 ? 1 : 0), WD); r(7, 11, 1, 4, WD); r(8, 11, 1, 4, WD);
          if (e.dir === 0) { r(5, 1, 6, 5, W0); r(6, 3, 1, 1, '#3a2a1a'); r(9, 3, 1, 1, '#3a2a1a'); r(5, -1, 1, 2, HC); r(10, -1, 1, 2, HC); r(3, 2, 2, 1, WD); r(11, 2, 2, 1, WD); r(7, 6, 2, 2, '#d8d2c8'); if (e.bell) { r(7, 8, 2, 2, '#c8a040'); r(6, 7, 4, 1, '#c03030'); } }
          else { r(5, 2, 6, 4, WD); r(5, 0, 1, 2, HC); r(10, 0, 1, 2, HC); r(7, 10, 2, 2, W0); }
        } else {
          r(4, 5, 9, 5, W0); r(4, 9, 9, 1, WD);
          r(5, 10, 1, 5 - (st === 1 ? 1 : 0), WD); r(7, 10, 1, 5, WD); r(10, 10, 1, 5 - (st === -1 ? 1 : 0), WD); r(12, 10, 1, 5, WD);
          r(1, 2, 4, 4, W0); r(3, 0, 1, 2, HC); r(4, -1, 1, 1, HC); r(2, 3, 1, 1, '#3a2a1a'); r(1, 6, 1, 2, '#d8d2c8'); r(13, 4, 1, 2, W0);
          if (e.bell) { r(4, 6, 2, 2, '#c8a040'); r(4, 5, 1, 1, '#c03030'); }
        }
      },
      prints(g, e, t, R) {   // 雪地上的脚印
        const c = 'rgba(70,82,104,.55)', k = e.kind;
        const hoof = (x, y) => { R(x, y, 2, 4, c); R(x + 3, y, 2, 4, c); };
        const bare = (x, y) => { R(x, y + 2, 3, 4, c); R(x, y, 1, 1, c); R(x + 1, y - 1, 1, 1, c); R(x + 2, y - 1, 1, 1, c); R(x + 3, y, 1, 1, c); };
        const boot = (x, y) => { R(x, y, 3, 6, c); R(x, y + 2, 3, 1, 'rgba(70,82,104,.25)'); };
        if (k === 'goat') { for (const [x, y] of [[3, 2], [9, 6], [4, 10]]) { R(x, y, 1, 2, c); R(x + 2, y, 1, 2, c); } }
        else if (k === 'fox') { for (const y of [1, 6, 11]) { R(7, y, 2, 2, c); R(6, y - 1, 1, 1, c); R(9, y - 1, 1, 1, c); } }
        else if (k === 'kr') { hoof(2, 2); bare(10, 8); }
        else if (k === 'hoof2') { hoof(2, 2); hoof(9, 8); }
        else if (k === 'hoofboot') { hoof(2, 2); boot(10, 8); }
        else { boot(3, 2); boot(10, 8); }
      },
      brunnen(g, e, t, R) {
        box(R, 0, 4, 32, 11, '#6e7078'); R(2, 5, 28, 5, '#a8c0d0'); R(4, 7, 8, 1, '#c8dae6'); R(18, 6, 6, 1, '#8aa8bc');
        R(13, -10, 6, 15, '#80828a'); R(12, -11, 8, 2, '#e8eef4'); R(14, -17, 4, 6, '#90929a'); R(14, -18, 4, 1, '#e8eef4');
        for (const x of [4, 9, 22, 27]) R(x, 15, 1, 2, '#d0e0ec'); R(0, 3, 32, 1, '#e8eef4');
      },
      snowman(g, e, t, R) { R(3, 7, 10, 8, '#e8eef4'); R(4, 1, 8, 7, '#eef2f8'); R(5, -4, 6, 6, '#f2f6fa'); R(6, -2, 1, 1, '#111'); R(9, -2, 1, 1, '#111'); R(7, -1, 3, 1, '#e07020'); R(5, -7, 6, 3, '#2a2a2a'); R(4, -4, 8, 1, '#2a2a2a'); R(7, 3, 2, 1, '#222'); R(7, 5, 2, 1, '#222'); R(0, 3, 4, 1, '#5a3a20'); R(12, 2, 4, 1, '#5a3a20'); R(4, 0, 8, 1, '#a02020'); },
      crowd(g, e, t, R) {
        const n = e.w * 2;
        for (let i = 0; i < n; i++) {
          const x = i * 8, h = hash(e.x * 7 + i, e.y, 3), kid = h < .25;
          const top = ['#5a3a2a', '#3a4a6a', '#6a2a2a', '#2a4a3a', '#4a4a52', '#7a5a3a'][(h * 6) | 0];
          const by = (kid ? 4 : 0) + (Math.sin(t * 2 + i * 1.3) > .7 ? -1 : 0);
          R(x + 1, by + 2, 6, 13 - by, top); R(x + 1, by + 2, 6, 1, shade(top, .2));
          R(x + 2, by - 3, 4, 5, '#e8c0a0'); R(x + 2, by - 4, 4, 2, ['#2a1a10', '#c8a050', '#5a3a20', '#e0e0e0'][(hash(i, e.x, 5) * 4) | 0]);
          if (h > .62) { R(x + 1, by - 5, 6, 2, ['#3a3040', '#7a2a2a', '#2a4a3a'][(hash(i, 2, 6) * 3) | 0]); }
          R(x + 3, by - 1, 1, 1, '#1a1010'); R(x + 5, by - 1, 1, 1, '#1a1010');
        }
      },
      sled(g, e, t, R) { R(1, 8, 14, 3, '#8a5a30'); R(1, 8, 14, 1, '#a8784a'); R(2, 11, 1, 2, '#5a3a20'); R(13, 11, 1, 2, '#5a3a20'); R(0, 13, 16, 1, '#4a3020'); R(0, 11, 1, 2, '#4a3020'); if (e.bell) { R(1, 7, 1, 2, '#c02020'); R(0, 9, 2, 2, '#c8a040'); } },
      heap(g, e, t, R) { R(0, 7, 16, 8, '#dfe6ee'); R(2, 4, 9, 4, '#e8eef4'); R(9, 6, 6, 2, '#e4eaf2'); R(1, 14, 14, 1, '#aab4c4'); },
      lectern(g, e, t, R) {
        R(6, 6, 4, 9, '#5a3a20'); R(3, 13, 10, 2, '#3a2414'); box(R, 1, 0, 14, 7, '#6a4a2a');
        R(2, -2, 12, 4, '#e8d8a0'); R(7, -2, 1, 4, '#a08040');
        const c = e.gold ? '#e0b030' : '#b02020'; R(3, -1, 3, 1, c); R(9, -1, 3, 1, c); R(3, 1, 2, 1, c); R(9, 1, 3, 1, c);
        if (!e.gold && !e.gone) { const a = .2 + Math.sin(t * 3) * .1; R(2, -3, 12, 1, `rgba(200,40,40,${a.toFixed(2)})`); }
        if (e.gone) { R(2, -2, 12, 4, '#6a4a2a'); }
      },
      ofen(g, e, t, R) {
        box(R, 0, -10, 16, 25, '#3a6a5a'); for (let y = -8; y < 14; y += 4) R(1, y, 14, 1, '#2a5244'); R(8, -9, 1, 23, '#2a5244');
        R(0, -12, 16, 2, '#2a4a40'); R(5, 6, 6, 5, '#1a0a04');
        for (let i = 0; i < 3; i++) { const hh = 1 + ((Math.sin(t * 10 + i * 2) + 1) * 1.5) | 0; R(6 + i * 2, 11 - hh, 1, hh, i % 2 ? '#ff8a2a' : '#ffcf5a'); }
      },
      werkbank(g, e, t, R) {
        box(R, 0, 2, 32, 11, '#7a5a3a'); R(1, 3, 30, 2, '#9a7a52'); R(2, 13, 2, 3, '#4a3020'); R(28, 13, 2, 3, '#4a3020');
        R(4, -3, 8, 6, '#d0a878'); R(5, -6, 1, 3, '#d0a878'); R(10, -6, 1, 3, '#d0a878'); R(6, -1, 1, 1, '#7a5a3a'); R(9, -1, 1, 1, '#7a5a3a'); R(7, 1, 2, 1, '#7a5a3a');
        R(16, 1, 7, 1, '#9a9aa0'); R(16, 3, 6, 1, '#9a9aa0'); R(23, 1, 2, 1, '#5a3a20'); R(22, 3, 2, 1, '#5a3a20');
        R(26, -1, 4, 4, '#c8c0a0'); R(26, -1, 4, 1, '#8a8060'); R(13, 4, 2, 1, '#e8d0a0'); R(19, 5, 3, 1, '#e8d0a0');
      },
      maskwall(g, e, t, R) {
        const cs = ['#8a3a2a', '#5a2a1a', '#a04a2a', '#6a3a2a'];
        for (let i = 0; i < 4; i++) {
          const x = 1 + i * 12, c = cs[i];
          R(x + 3, 0, 2, 1, '#888'); R(x, 2, 8, 9, c); R(x, 2, 8, 1, shade(c, -.3)); R(x + 1, 4, 2, 2, '#120808'); R(x + 5, 4, 2, 2, '#120808'); R(x + 3, 9, 2, 3, '#c02030');
          R(x, -1, 1, 4, '#d8ccb0'); R(x + 7, -1, 1, 4, '#d8ccb0'); R(x - 1, -2, 1, 2, '#b8ac90'); R(x + 8, -2, 1, 2, '#b8ac90');
        }
      },
      bmaskwall(g, e, t, R) {
        R(7, 0, 2, 1, '#888');
        if (e.gone) return;
        R(4, 2, 8, 10, '#5a4a3a'); for (let y = 3; y < 12; y += 2) R(5, y, 6, 1, '#4a3a2a'); R(2, 5, 12, 1, '#3a2a1a');
        R(4, -1, 1, 4, '#1a1414'); R(11, -1, 1, 4, '#1a1414'); R(3, -3, 1, 2, '#1a1414'); R(12, -3, 1, 2, '#1a1414');
      },
      bmask(g, e, t, R) {
        R(3, 6, 10, 8, '#141010'); R(4, 5, 8, 1, '#141010'); for (let i = 0; i < 3; i++) { R(2 - i, 5 - i * 2, 2, 2, '#d8ccb0'); R(12 + i, 5 - i * 2, 2, 2, '#d8ccb0'); }
        R(5, 8, 2, 2, '#000'); R(9, 8, 2, 2, '#000'); if (Math.sin(t * 1.7) > .93) { R(5, 8, 1, 1, '#a02020'); R(9, 8, 1, 1, '#a02020'); }
        R(5, 12, 6, 1, '#000'); R(4, 11, 1, 1, '#000'); R(11, 11, 1, 1, '#000');
      },
      furstand(g, e, t, R) { R(7, 4, 2, 11, '#5a3a20'); R(4, 14, 8, 1, '#3a2414'); R(3, -6, 10, 14, '#4a3424'); R(2, -4, 1, 10, '#3a2618'); R(13, -4, 1, 10, '#3a2618'); R(4, -12, 8, 7, '#8a3a2a'); R(5, -10, 2, 2, '#120808'); R(9, -10, 2, 2, '#120808'); R(7, -7, 2, 4, '#c02030'); R(4, -15, 1, 3, '#d8ccb0'); R(11, -15, 1, 3, '#d8ccb0'); for (const x of [4, 7, 10]) R(x, 3, 2, 2, '#c8a040'); },
      hocker(g, e, t, R) { R(3, 8, 10, 2, '#7a5a3a'); R(4, 10, 1, 5, '#5a3a20'); R(11, 10, 1, 5, '#5a3a20'); R(5, 4, 6, 4, '#d8b080'); R(4, 2, 2, 3, '#d8b080'); R(5, 8, 1, 1, '#b89060'); R(10, 8, 1, 1, '#b89060'); R(4, 1, 1, 1, '#a88050'); if (e.broken) R(13, 13, 2, 1, '#d8b080'); else R(5, 0, 1, 2, '#a88050'); },
      marterl(g, e, t, R) { R(7, 0, 2, 15, '#5a3a20'); box(R, 3, -10, 10, 10, '#7a5a3a'); R(2, -12, 12, 2, '#4a3020'); R(2, -13, 12, 1, '#e8eef4'); R(5, -8, 6, 6, '#c8a070'); R(7, -7, 2, 4, '#3a5a8a'); R(6, -8, 4, 1, '#e8e0c0'); },
      stumpbasket(g, e, t, R) { R(2, 8, 12, 7, '#5a3a20'); R(2, 7, 12, 2, '#8a6a40'); R(5, 8, 6, 1, '#6a4a2a'); box(R, 4, -3, 9, 11, '#8a6a3a'); R(5, 0, 7, 1, '#6a4a2a'); R(5, 3, 7, 1, '#6a4a2a'); R(12, 4, 3, 2, '#a02a2a'); R(12, 6, 3, 1, '#5a1a1a'); },
      pew(g, e, t, R) { const W2 = e.w * 16; R(0, 0, W2, 3, '#6a4a2a'); R(0, 6, W2, 4, '#5a3a20'); R(0, 6, W2, 1, '#7a5a3a'); for (let x = 2; x < W2; x += 14) R(x, 10, 2, 5, '#3a2414'); },
      robe(g, e, t, R) { R(7, 2, 2, 13, '#5a3a20'); R(4, 14, 8, 1, '#3a2414'); if (e.gone) { R(3, -6, 10, 1, '#3a2a1a'); return; } R(3, -6, 10, 16, '#a02020'); R(7, -6, 2, 16, '#e8d8a0'); R(5, -13, 6, 7, '#f0e8d0'); R(7, -12, 2, 4, '#c8a040'); R(6, -11, 4, 1, '#c8a040'); },
      chainhook(g, e, t, R) { R(7, 1, 2, 2, '#888'); if (e.gone) return; for (let i = 0; i < 5; i++) R(7, 3 + i * 2, 2, 2, i % 2 ? '#6a6a72' : '#a8a8b0'); R(6, 13, 4, 1, '#8a8a92'); },
      clipping(g, e, t, R) { box(R, 3, 1, 10, 11, '#5a3a20'); R(4, 2, 8, 9, '#d8ccaa'); R(5, 3, 6, 1, '#3a3020'); R(5, 5, 5, 1, '#6a6050'); R(5, 7, 6, 1, '#6a6050'); R(5, 9, 4, 1, '#6a6050'); },
      wsign(g, e, t, R) { R(2, 1, 12, 1, '#3a2a1a'); box(R, 3, 2, 10, 7, '#5a3a20'); R(6, 4, 4, 4, '#e8e0c0'); R(10, 5, 1, 2, '#e8e0c0'); R(6, 4, 4, 1, '#f8f8f0'); },
      roofcross(g, e, t, R) { R(7, -2, 2, 12, '#3a3a40'); R(4, 1, 8, 2, '#3a3a40'); R(7, -3, 2, 1, '#e8eef4'); },
      hay(g, e, t, R) { R(1, 8, 14, 7, '#b89a50'); R(2, 6, 12, 3, '#c8aa60'); for (let i = 0; i < 5; i++) R(2 + i * 3, 7, 1, 3, '#9a7a3a'); },
      spaene(g, e, t, R) { for (let i = 0; i < 6; i++) R((hash(e.x, e.y, i) * 13) | 0, (hash(e.y, e.x, i + 9) * 13) | 0, 2 + (i % 2), 1, i % 2 ? '#d8b888' : '#c8a070'); },
      fox(g, e, t, R) { R(3, 8, 9, 4, '#c8602a'); R(1, 6, 4, 4, '#c8602a'); R(1, 5, 1, 1, '#8a3a1a'); R(4, 5, 1, 1, '#8a3a1a'); R(1, 9, 2, 1, '#f0e8e0'); R(2, 7, 1, 1, '#1a1010'); R(11, 7, 4, 3, '#c8602a'); R(14, 7, 1, 2, '#f0e8e0'); R(4, 12, 1, 3, '#3a2010'); R(10, 12, 1, 3, '#3a2010'); }
    },
    maps: {
      /* ---------------- 爷爷的面具作坊 ---------------- */
      werk: {
        amb: 'fire', dark: .42, wall: 'wood', floor: 'wood', plr: 3,
        tileOpts: { woodC: '#6a4a30' },
        rows: [
          '##############',
          '##############',
          '#............#',
          '#............#',
          '#............#',
          '#............#',
          '#............#',
          '#............#',
          '#............#',
          '######.#######'],
        ents: [
          { id: 'w_exit', x: 6, y: 9, spr: 'invisible', touch: S => leaveWerk(S) },
          { id: 'maskwall', x: 2, y: 1, w: 3, spr: 'maskwall', on: S => S.narr('今年刻好的坎卜斯面具，一排挂在墙上。椴木的，上了色，犄角朝天，舌头血红。\n明天它们就要戴在镇上那几个小伙子的脸上了。') },
          { id: 'w_win', x: 6, y: 1, spr: 'window', on: S => S.narr(S.f.ph === 'parade' || S.f.ph === 'lure' ? '窗外的广场上全是人。铃声一阵一阵地涌过来。' : '窗外天快黑了。雪停了，山的影子压在镇子上。') },
          { id: 'bmw', x: 10, y: 1, spr: 'bmaskwall', on: S => bmwOn(S) },
          { id: 'ofen', x: 12, y: 2, spr: 'ofen', light: { r: 4.4, col: 'rgba(255,150,70,.24)', flick: true }, on: S => S.narr('绿瓷砖的大炉子，烧得烫手。爷爷说，椴木面具要在炉边烤足三天，才不会裂。') },
          { id: 'shelf', x: 1, y: 2, spr: 'shelf', on: async S => { await S.narr('架子上堆着刻刀、砂纸和一本油乎乎的账本。'); await S.note('opa'); } },
          { id: 'werkbank', x: 3, y: 3, w: 2, spr: 'werkbank', on: S => benchOn(S) },
          { id: 'opa', x: 5, y: 3, spr: '@opa', dir: 1, on: S => opaTalk(S) },
          { id: 'furstand', x: 11, y: 6, spr: 'furstand', on: S => S.narr('一套挂在架子上的坎卜斯行头：羊皮缝的长毛袍子，腰上一圈牛铃。\n伸手一碰，铃铛哗啦一声，吓了你一跳。') },
          { id: 'hocker', x: 9, y: 5, spr: 'hocker', on: S => hockerOn(S) },
          { id: 'felix_w', x: 3, y: 6, spr: '@felix', dir: 2 },
          { id: 'sp1', x: 4, y: 4, spr: 'spaene', decal: true }, { id: 'sp2', x: 2, y: 5, spr: 'spaene', decal: true }, { id: 'sp3', x: 8, y: 4, spr: 'spaene', decal: true }
        ],
        async enter(S, first) {
          if (first) return opening(S);
          if ((S.f.ph === 'parade' || S.f.ph === 'lure') && S.once('werkEmpty')) await S.think('……墙角那颗钉子上，空了。');
        }
      },
      /* ---------------- 小镇 ---------------- */
      town: {
        amb: 'wind', dark: .66, plr: 3.4, wall: 'plain', floor: 'snow', floor2: 'snowpath',
        wallC: { top: '#d4dbe6', face: '#b8ad98', trim: '#4a3a2a' },
        legend: { P: 'spine', f: 'sfence' },
        rows: [
          'PPPPPPPPPPPPP#######PPPPPPPPPPPP',
          'PP########PPP#######PPP#######PP',
          'PP########PPP#######PPP#######PP',
          'PP########...#######...#######PP',
          'P..............................P',
          'P..............,,..............P',
          'P.#######......,,......########P',
          'P.#######......,,......########P',
          'P.#######......,,......########P',
          'P.f.....f......,,..............P',
          'P.f.....f.....,,,,.............P',
          'P.f.....f.....,,,,.............P',
          'P.f.....f......,,..............P',
          'P.fff.fff......,,..............P',
          'P..............,,..............P',
          'P..,,,,,,,,,,,,,,,,,,,,,,,,,,..P',
          'P..,,,,,,,,,,,,,,,,,,,,,,,,,,..P',
          'P..,,,,,,,,,,,,,,,,,,,,,,,,,,..P',
          'P..,,,,,,,,,,,,,,,,,,,,,,,,,,..P',
          'P..............,,..............P',
          'PP.............,,.............PP',
          'PPP............,,............PPP',
          'PPPP...........,,...........PPPP',
          'PPPPPPPPPPPPPPP,,PPPPPPPPPPPPPPP'],
        ents: [
          /* 房子 */
          { id: 'door_ws', x: 5, y: 3, spr: 'door', col: '#5a3a22', on: S => toWerk(S) },
          { id: 'win_ws1', x: 3, y: 3, spr: 'window', lit: true, light: { r: 2, col: 'rgba(255,180,100,.14)' }, on: S => S.narr('爷爷作坊的窗户。窗台上摆着一排擦干净的靴子——等着圣尼古拉往里放东西。') },
          { id: 'win_ws2', x: 8, y: 3, spr: 'window', lit: true, light: { r: 2, col: 'rgba(255,180,100,.14)' }, on: S => S.narr('窗户里，炉火一闪一闪。') },
          { id: 'roofx', x: 16, y: 1, spr: 'roofcross', solid: false },
          { id: 'door_ch', x: 16, y: 3, spr: 'door', col: '#4a2a1a', on: S => toChurch(S) },
          { id: 'win_ch1', x: 14, y: 3, spr: 'window', lit: true, light: { r: 2, col: 'rgba(255,200,120,.12)' }, on: S => S.narr('教堂的彩色玻璃窗。里面有烛光。') },
          { id: 'win_ch2', x: 18, y: 3, spr: 'window', lit: true, light: { r: 2, col: 'rgba(255,200,120,.12)' }, on: S => S.narr('玻璃上画着一个穿红袍、戴高帽的老人，手里拿着金色的牧杖——圣尼古拉。') },
          { id: 'door_il', x: 26, y: 3, spr: 'door', col: '#3a4a5a', on: S => S.narr('伊尔泽奶奶家的门。门框上挂着一只编好的麦秆星星。') },
          { id: 'win_il1', x: 24, y: 3, spr: 'window', lit: true, light: { r: 2, col: 'rgba(255,180,100,.12)' }, on: S => S.narr('窗台空着。……原来那里放着什么东西。') },
          { id: 'win_il2', x: 28, y: 3, spr: 'window', lit: true, light: { r: 2, col: 'rgba(255,180,100,.12)' }, on: S => S.narr('窗户里点着一盏油灯。一只猫趴在灯下面，眯着眼睛看你。') },
          { id: 'door_barn', x: 5, y: 8, spr: 'door', col: '#5a4030', on: S => S.narr('胡贝尔家的羊圈门。里面的羊挤成一团，咩咩地叫。') },
          { id: 'door_gh', x: 26, y: 8, spr: 'door', col: '#5a3a22', on: S => S.narr('「金鹿」酒馆。门里头吵吵嚷嚷，全是等着看游行的大人。\n一股烤栗子和热红酒的味道。') },
          { id: 'win_gh1', x: 24, y: 8, spr: 'window', lit: true, light: { r: 2.2, col: 'rgba(255,180,100,.16)' }, on: S => S.narr('酒馆的窗户上蒙着一层哈气。') },
          { id: 'win_gh2', x: 29, y: 8, spr: 'window', lit: true, light: { r: 2.2, col: 'rgba(255,180,100,.16)' }, on: S => S.narr('窗户里，几个大人举着杯子在唱歌。') },
          { id: 'wsign', x: 28, y: 8, spr: 'wsign', solid: false, on: S => S.narr('酒馆的铁皮招牌，画着一只金色的鹿。') },
          { id: 'lamp1', x: 12, y: 5, spr: 'streetlamp', light: { r: 3.4, col: 'rgba(255,200,120,.18)' }, on: S => S.narr('路灯的玻璃罩上结了一层霜花。') },
          { id: 'lamp2', x: 19, y: 5, spr: 'streetlamp', light: { r: 3.4, col: 'rgba(255,200,120,.18)' }, on: S => S.narr('路灯底下的雪，被踩成了冰。') },
          { id: 'lamp3', x: 12, y: 13, spr: 'streetlamp', light: { r: 3.4, col: 'rgba(255,200,120,.18)' }, on: S => S.narr('灯柱上缠着一圈松枝，系着红丝带。') },
          { id: 'lamp4', x: 19, y: 13, spr: 'streetlamp', light: { r: 3.4, col: 'rgba(255,200,120,.18)' }, on: S => S.narr('灯柱上贴着一张告示：「今晚六点四十，坎卜斯游行。请看好孩子。」') },
          { id: 'brunnen', x: 15, y: 11, w: 2, spr: 'brunnen', on: S => S.narr('广场的老喷泉，早就冻住了。石柱顶上立着一个小小的石头圣人，帽子上落满了雪。') },
          { id: 'bmask', x: 17, y: 11, spr: 'bmask', hidden: true, on: S => bmaskOn(S) },
          { id: 'snowman', x: 21, y: 11, spr: 'snowman', on: S => S.narr('孩子们堆的雪人。有人用炭给它画了一对犄角。') },
          { id: 'sign_s', x: 17, y: 21, spr: 'sign', col: '#5a4024', on: S => S.narr('木牌子：↓ 林子（Wald）。\n底下有人用刀刻了一行小字：「腊月里天黑别进去。」') },
          /* 人 */
          { id: 'sled', x: 7, y: 5, spr: 'sled', s: { bell: true }, on: S => S.narr(S.ent('sled').s.bell ? '菲利克斯的木头雪橇。车头上用红毛线拴着一只铜铃铛。' : '菲利克斯的木头雪橇。车头上的红毛线空荡荡的。') },
          { id: 'felix', x: 6, y: 5, spr: '@felix', dir: 2, on: S => felixTalk(S) },
          { id: 'liesl', x: 20, y: 12, spr: '@liesl', dir: 0, on: S => lieslTalk(S) },
          { id: 'ilse', x: 27, y: 4, spr: '@ilse', dir: 0, on: S => ilseTalk(S) },
          { id: 'huber', x: 6, y: 14, spr: '@huber', dir: 3, on: S => huberTalk(S) },
          { id: 'hay', x: 3, y: 9, spr: 'hay', on: S => S.narr('一垛干草，羊啃过的地方缺了一大块。') },
          { id: 'toni', x: 5, y: 20, spr: '@toni', dir: 2, on: S => toniTalk(S) },
          { id: 'sled2', x: 6, y: 20, spr: 'sled', on: S => S.narr('托尼的雪橇，比别人的都长，滑板磨得锃亮。') },
          { id: 'heap1', x: 3, y: 21, spr: 'heap', on: S => S.narr('孩子们堆起来的雪坡。坡上被雪橇压出了一道亮晶晶的冰槽。') },
          { id: 'heap2', x: 10, y: 21, spr: 'heap', on: S => S.narr('雪堆里插着一根树枝，上面挂着一只冻硬的手套。') },
          { id: 'wirt', x: 27, y: 9, spr: '@wirt', dir: 0, on: S => wirtTalk(S) },
          /* 游行时才出现的 */
          { id: 'crowdN1', x: 1, y: 14, w: 13, spr: 'crowd', hidden: true, on: S => crowdOn(S) },
          { id: 'crowdN2', x: 18, y: 14, w: 13, spr: 'crowd', hidden: true, on: S => crowdOn(S) },
          { id: 'crowdS1', x: 1, y: 19, w: 14, spr: 'crowd', hidden: true, on: S => crowdOn(S) },
          { id: 'crowdS2', x: 17, y: 19, w: 14, spr: 'crowd', hidden: true, on: S => crowdOn(S) },
          { id: 'tor1', x: 7, y: 14, spr: 'invisible', hidden: true, light: { r: 3, col: 'rgba(255,150,60,.2)', flick: true } },
          { id: 'tor2', x: 24, y: 14, spr: 'invisible', hidden: true, light: { r: 3, col: 'rgba(255,150,60,.2)', flick: true } },
          { id: 'tor3', x: 7, y: 19, spr: 'invisible', hidden: true, light: { r: 3, col: 'rgba(255,150,60,.2)', flick: true } },
          { id: 'tor4', x: 24, y: 19, spr: 'invisible', hidden: true, light: { r: 3, col: 'rgba(255,150,60,.2)', flick: true } },
          { id: 'felix_p', x: 27, y: 16, spr: '@felix', dir: 1, hidden: true, on: S => felixTalk(S) },
          { id: 'opa_p', x: 28, y: 16, spr: '@opa', dir: 1, hidden: true, on: S => opaParade(S) },
          { id: 'niko', x: 15, y: 4, spr: '@niko', dir: 0, hidden: true, on: S => nikoTalk(S) },
          { id: 'toni_p', x: 17, y: 4, spr: '@toni', dir: 0, hidden: true, on: S => S.say('托尼', S.f.ph === 'lure' ? '快！往这边！' : ['锁链在我这儿。……好沉。', '莱妮，你认出来了就把书对着它翻开。我们在这儿等着。']) },
          { id: 'k1', x: 9, y: 16, spr: 'krampus', fur: '#6a6a6c', mask: '#8a5a3a', horn: 'straight', feet: 'boot', breath: true, hidden: true, dir: 0, on: (S, e) => runnerOn(S, e) },
          { id: 'k2', x: 12, y: 18, spr: 'krampus', fur: '#1e1a1a', mask: '#a03020', horn: 'ram', feet: 'hoof2', scarf: true, ring: true, hidden: true, dir: 0, on: (S, e) => runnerOn(S, e) },
          { id: 'k3', x: 19, y: 16, spr: 'krampus', fur: '#d8d4cc', mask: '#7a2a1a', horn: 'long', feet: 'hoofboot', breath: true, ring: true, hidden: true, dir: 0, on: (S, e) => runnerOn(S, e) },
          { id: 'k4', x: 22, y: 18, spr: 'krampus', fur: '#5a3a20', mask: '#3a2a20', horn: 'short', feet: 'boot', breath: true, hidden: true, dir: 0, on: (S, e) => runnerOn(S, e) },
          { id: 'k5', x: 25, y: 17, spr: 'krampus', fur: '#7a5a3a', spots: true, mask: '#9a2a1a', horn: 'long', feet: 'boot', breath: true, basket: true, ring: true, hidden: true, dir: 0, on: (S, e) => runnerOn(S, e) },
          { id: 'kr', x: 5, y: 17, spr: 'krampus', fur: '#3a2418', mask: '#6a2016', horn: 'long', feet: 'hooffoot', basket: true, hidden: true, dir: 0, on: (S, e) => runnerOn(S, e) },
          { id: 'pk1', x: 8, y: 16, spr: 'prints', kind: 'boot', decal: true, hidden: true },
          { id: 'pk2', x: 11, y: 18, spr: 'prints', kind: 'hoof2', decal: true, hidden: true },
          { id: 'pk3', x: 20, y: 16, spr: 'prints', kind: 'hoofboot', decal: true, hidden: true },
          { id: 'pk4', x: 23, y: 18, spr: 'prints', kind: 'boot', decal: true, hidden: true },
          { id: 'pk5', x: 26, y: 17, spr: 'prints', kind: 'boot', decal: true, hidden: true },
          { id: 'pkr', x: 6, y: 17, spr: 'prints', kind: 'kr', decal: true, hidden: true },
          /* 出口 */
          { id: 'south1', x: 15, y: 23, spr: 'invisible', touch: S => toForest(S) },
          { id: 'south2', x: 16, y: 23, spr: 'invisible', touch: S => toForest(S) }
        ]
      },
      /* ---------------- 教堂 ---------------- */
      kirche: {
        amb: 'drone', dark: .5, wall: 'plain', floor: 'stone', plr: 3,
        wallC: { top: '#1a1a1e', face: '#c8c0b0', trim: '#5a4a3a' },
        rows: [
          '###############',
          '###############',
          '#.......#.....#',
          '#.......#.....#',
          '#.......#.....#',
          '#.............#',
          '#.......#######',
          '#.......#######',
          '#.............#',
          '#.............#',
          '#.............#',
          '#.............#',
          '#######.#######'],
        ents: [
          { id: 'c_exit', x: 7, y: 12, spr: 'invisible', touch: S => leaveChurch(S) },
          { id: 'c_win1', x: 2, y: 1, spr: 'window', lit: true, on: S => S.narr('彩色玻璃窗：三个金球。传说圣尼古拉夜里往穷人家的窗户里扔了三袋金子，好让三个女儿出嫁。') },
          { id: 'c_win2', x: 6, y: 1, spr: 'window', lit: true, on: S => S.narr('彩色玻璃窗：一条船在暴风雨里，一个穿红袍的老人站在船头。') },
          { id: 'altar', x: 3, y: 2, w: 2, spr: 'altar', on: S => S.narr('祭坛上铺着白布，点着两支蜡烛。将临期的花环挂在旁边，四支蜡烛点了一支。') },
          { id: 'cand1', x: 2, y: 2, spr: 'candles', light: { r: 2.6, col: 'rgba(255,190,110,.2)', flick: true }, on: S => S.narr('蜡烛的火苗一动不动。教堂里一点风也没有。') },
          { id: 'cand2', x: 5, y: 2, spr: 'candles', light: { r: 2.6, col: 'rgba(255,190,110,.2)', flick: true }, on: S => S.narr('烛台底下积着厚厚一层蜡泪。') },
          { id: 'statue', x: 7, y: 2, spr: 'statue', on: S => S.narr('圣尼古拉的木雕像，漆都掉得差不多了。他一只手拿着书，一只手抬着，像是在念什么。') },
          { id: 'lectern', x: 4, y: 4, spr: 'lectern', on: S => lecternOn(S) },
          { id: 'matthias', x: 2, y: 4, spr: '@matthias', dir: 2, on: S => matthiasTalk(S) },
          { id: 'toni_c', x: 5, y: 6, spr: '@toni', dir: 3, hidden: true, on: S => toniChurch(S) },
          { id: 'pew1', x: 2, y: 8, w: 3, spr: 'pew', on: S => S.narr('长椅的靠背上，被孩子们用指甲刻满了名字。') },
          { id: 'pew2', x: 2, y: 10, w: 3, spr: 'pew', on: S => S.narr('长椅底下掉着一只连指手套，红的。') },
          { id: 'pew3', x: 9, y: 8, w: 3, spr: 'pew', on: S => S.narr('冰凉的长椅。') },
          { id: 'pew4', x: 9, y: 10, w: 3, spr: 'pew', on: S => S.narr('长椅上放着一本赞美诗集，翻在《平安夜》那一页。') },
          /* 圣器室 */
          { id: 'chainhook', x: 10, y: 1, spr: 'chainhook', on: S => S.narr(S.ent('chainhook').s.gone ? '墙上的铁钩空了。' : '墙上的铁钩上挂着一盘锁链，黑沉沉的，比你的胳膊还粗。\n每年游行，圣尼古拉就牵着它走在坎卜斯前头。') },
          { id: 'clip', x: 12, y: 1, spr: 'clipping', on: async S => { await S.note('zeitung'); S.f.zeitung = true; if (S.f.tFixed && !S.f.dT) await S.think('铁匠家八岁的小儿子……\n托尼说过，他爸是铁匠。'); } },
          { id: 'robe', x: 13, y: 3, spr: 'robe', on: S => S.narr(S.ent('robe').s.gone ? '衣架上空了。' : '圣尼古拉的行头：红袍子、金边，一顶高高的白帽子，帽子上绣着金十字。叠得整整齐齐。') },
          { id: 'cabinet', x: 9, y: 4, spr: 'cabinet', on: S => S.narr('圣器柜锁着。柜门上贴着一张纸：「圣尼古拉的金牧杖——马蒂亚斯拿去刷漆了」。') }
        ],
        async enter(S, first) { if (S.f.ph === 'go') return churchFirst(S); }
      },
      /* ---------------- 林子 ---------------- */
      wald: {
        amb: 'wind', dark: .74, plr: 3, floor: 'snow', floor2: 'snowpath',
        legend: { P: 'spine', B: 'sbush', i: 'icebrook' },
        rows: [
          'PPPPPPPPPPPP,,PPPPPPPPPPPP',
          'PPPPPPPPPPPP,,PPPPPPPPPPPP',
          'PPPPPPPPPPP.,,.PPPPPPPPPPP',
          'PPPPPPPPPP..,,..PPPPPPPPPP',
          'PPPPPPPPP...,,...PPPPPPPPP',
          'PPPPPPPP....,,....PPPPPPPP',
          'PPPPP,,,,,,,,,,,,,,,,,PPPP',
          'PPPPP,PPPPPPPPPPPPPPP,PPPP',
          'PPPP.,PPPPPPPPPPPPPPP,PPPP',
          'PPPP.,PPPPPPPPPPPPPPP,PPPP',
          'PPP..,PPPPPPPPPPPPPP..PPPP',
          'PPP.,,,,,,,,PPPPPP......PP',
          'PPP.,PPPPPP.PPPPP.......PP',
          'PPP.,PPPPPPPPPPPP.......PP',
          'PPP.,PPPPPPPPPPPPP.....PPP',
          'PPP.,PPPPPPPPPPPPPPPPPPPPP',
          'PP..,..PPPPPPPPPPPPPPPPPPP',
          'PP.,,...PPPPPPPPPPPPPPPPPP',
          'P..,.....BBPPPPPPPPPPPPPPP',
          'P..,,.....BPPPPPPPPPPPPPPP',
          'P.........BPPPPPPPPPPPPPPP',
          'PiiiiiiiiiiPPPPPPPPPPPPPPP',
          'PPPPPPPPPPPPPPPPPPPPPPPPPP',
          'PPPPPPPPPPPPPPPPPPPPPPPPPP'],
        ents: [
          { id: 'f_exit1', x: 12, y: 0, spr: 'invisible', touch: S => leaveForest(S) },
          { id: 'f_exit2', x: 13, y: 0, spr: 'invisible', touch: S => leaveForest(S) },
          { id: 'pg1', x: 10, y: 6, spr: 'prints', kind: 'goat', decal: true, on: S => printsOn(S, 'goat') },
          { id: 'pg2', x: 7, y: 6, spr: 'prints', kind: 'goat', decal: true, on: S => printsOn(S, 'goat') },
          { id: 'pkf1', x: 15, y: 6, spr: 'prints', kind: 'kr', decal: true, on: S => printsOn(S, 'kr') },
          { id: 'pkf2', x: 17, y: 6, spr: 'prints', kind: 'kr', decal: true, on: S => printsOn(S, 'kr') },
          { id: 'pg3', x: 4, y: 13, spr: 'prints', kind: 'goat', decal: true, on: S => printsOn(S, 'goat') },
          { id: 'pg4', x: 4, y: 16, spr: 'prints', kind: 'goat', decal: true, on: S => printsOn(S, 'goat') },
          { id: 'pf1', x: 7, y: 11, spr: 'prints', kind: 'fox', decal: true, on: S => printsOn(S, 'fox') },
          { id: 'pf2', x: 9, y: 11, spr: 'prints', kind: 'fox', decal: true, on: S => printsOn(S, 'fox') },
          { id: 'fox', x: 11, y: 12, spr: 'fox', hidden: true, solid: false },
          { id: 'stump', x: 20, y: 12, spr: 'stumpbasket', on: S => S.narr('老树桩上放着一只编得很密的背篓。篓口挂着一只小小的红童鞋。') },
          { id: 'kr_f', x: 21, y: 11, spr: 'krampus', fur: '#3a2418', mask: '#6a2016', horn: 'long', feet: 'hooffoot', basket: true, rev: true, hidden: true, solid: false, dir: 1 },
          { id: 'marterl', x: 2, y: 17, spr: 'marterl', on: S => S.narr('路边的小神龛（Marterl）。木板上画着一个被雪埋到胸口的孩子，旁边站着一个穿红袍的人，正伸手拉他。\n底下的字被风雪磨得只剩一个年份：1888。') },
          { id: 'goat', x: 8, y: 19, spr: 'goat', dir: 1, on: S => goatOn(S) },
          { id: 'w_amb', x: 12, y: 12, spr: 'invisible', light: { r: 5, col: 'rgba(140,160,210,.06)' } }
        ],
        async enter(S, first) {
          if (S.f.ph !== 'tasks') return;
          if (first) {
            await S.narr('林子里比镇上黑得多。松树上的雪一团一团地往下掉，噗、噗。\n雪地上横七竖八的，全是脚印。');
            bellJ(S, .02);
            await S.think('……远处有铃声。很远。');
          }
          S.cp('forest');
        }
      }
    }
  });

  /* ================= 剧情 ================= */
  async function opening(S) {
    S.f.ph = 'intro';
    await S.narr('爷爷的面具作坊里，炉子烧得正旺，满屋子都是椴木屑的香味。\n墙上挂着一排刚上完色的坎卜斯面具，犄角朝天，舌头血红。');
    S.bubble('felix_w', '!', 800); goatBell(S, .07);
    await S.say('菲利克斯', '叮——当！叮——当！坎卜斯来啦！');
    await S.think('弟弟举着一只铜铃铛，满屋子乱跑。\n……哪来的铃铛？声音像羊脖子上挂的那种。');
    await S.walk('felix_w', [8, 5], 5); S.face('felix_w', 0); S.face('pl', 3);
    await S.say('菲利克斯', '姐姐，给我看看你的小木羊！给我——');
    S.sfx('thud'); S.shake(200, 1); S.ent('hocker').s.broken = true;
    await S.narr('咔。\n你刻了一个礼拜的小木羊，一只犄角断在了地上。');
    await S.say('莱妮', '你烦死了！今天晚上就让坎卜斯把你塞进篓子背走吧！我再也不想看见你！', { style: 'big' });
    S.bubble('felix_w', '…', 1200);
    await S.narr('菲利克斯愣了一下。然后他攥着铃铛，一声不吭地跑了出去。');
    await S.walk('felix_w', [6, 8], 6); S.hide('felix_w'); S.sfx('close');
    S.face('opa', 2);
    await S.say('爷爷', ['……这种话，今天晚上别说。圣尼古拉念到谁的坏事，坎卜斯就把谁装进篓子，背到山后面去。', '（他朝墙角看了一眼。那里挂着一张面具，脸朝着墙，只露出光秃秃的木头背面。）\n那张不是我刻的。别碰它，别把它翻过来。']);
    await S.say('爷爷', '还有——马蒂亚斯说，他今年不演圣尼古拉了。没有圣尼古拉牵着锁链走在前头，跑铃的就是一群没人管的坎卜斯。你去教堂劝劝他。');
    S.f.ph = 'go';
    S.goal('去教堂找马蒂亚斯老爷爷（出门往右，最高的那栋）');
  }

  async function churchFirst(S) {
    S.f.ph = 'tasks0';
    await S.narr('教堂里没开灯，只有祭坛前点着几支蜡烛。\n马蒂亚斯老爷爷拄着一根木棍，站在读经台旁边，一动不动。');
    S.face('matthias', 'pl'); S.bubble('matthias', '…', 1200);
    await S.say('马蒂亚斯', '莱妮，你来得正好。过来看看这个。');
    await S.walk('pl', [4, 5], 4); S.face('pl', 3);
    await S.note('buch');
    await S.say('马蒂亚斯', ['这页红字不是我写的。下午我来擦烛台，它就在这儿了，墨还是湿的。', '我爷爷那辈人说，坎卜斯平时只是跟着圣尼古拉，替他吓唬吓唬孩子。可要是哪一年没有人牵着它的锁链——它就自己来收账。']);
    await S.think('菲利克斯，莉泽尔，托尼……\n最后一行被一滴黑蜡封着。');
    await S.say('马蒂亚斯', '账能还。页脚写着：东西修好，话说出口，红字自会变金。钟楼七点敲七下——在那之前。');
    await S.say('莱妮', '那您今年……还演圣尼古拉吗？');
    S.face('matthias', 0);
    await S.say('马蒂亚斯', ['……我这条腿，连台阶都走不稳了。托尼那孩子说得对：一个瘸老头子，扮什么圣人。', '去吧。去找那三个孩子。']);
    S.f.ph = 'tasks'; S.ent('lectern').s.gold = false;
    goalTasks(S); S.cp('tasks');
  }

  /* ---------- 还账：目标提示 ---------- */
  const KID_AT = { dF: '菲利克斯（作坊门口）', dL: '莉泽尔（雪人旁）', dT: '托尼（南边雪坡）' };
  function stepOf(S, k) {
    const f = S.f;
    if (k === 'dF') return !f.fBell ? '找作坊门口雪橇边的菲利克斯' : f.goatFollow ? '把小雪牵回胡贝尔太太的羊圈' : '去南边林子找山羊小雪（跟着小小的、两瓣一对的蹄印）';
    if (k === 'dL') return !f.lStrips ? '找雪人旁的莉泽尔' : !f.lCard ? '在爷爷的工作台上拼好四条碎卡片（「笺」里看碎片；两人时一人念、一人拼）' : '把卡片还给伊尔泽奶奶（她家门口）';
    return !f.tBroken ? '找南边雪坡上的托尼' : !f.tFixed ? '请爷爷修好断拐杖（作坊）' : '去教堂：托尼要向马蒂亚斯道歉';
  }
  function goalTasks(S) {
    const f = S.f, ks = ['dF', 'dL', 'dT'], n = ks.filter(k => f[k]).length;
    if (n === 3) return S.goal('三个孩子的账都还清了——回教堂找马蒂亚斯');
    const a = f.act && !f[f.act] ? f.act : null;
    const started = ks.filter(k => !f[k] && (k === 'dF' ? f.fBell : k === 'dL' ? f.lStrips : f.tBroken));
    const k = a || started[0];
    if (k) return S.goal(`还账 ${n}/3：${stepOf(S, k)}`);
    S.goal(`还账 ${n}/3：找${ks.filter(q => !f[q]).map(q => KID_AT[q]).join('、')}`);
  }
  async function amendDone(S, k, name) {
    S.f[k] = true; S.f.act = null; goldS(S);
    S.toast(`金书上「${name}」那一行，变成了金色`);
    if (S.once('flip')) await S.think('……远处的教堂里，好像有一页纸，轻轻地翻了一下。');
    if (S.f.dF && S.f.dL && S.f.dT) { const lc = S.ent('lectern'); if (lc) lc.s.gold = true; }
    S.dark(.66 + ['dF', 'dL', 'dT'].filter(q => S.f[q]).length * .03, 'town');   // 天一点点黑下来
    goalTasks(S); S.cp('tasks');
  }

  /* ---------- 作坊 ---------- */
  async function opaTalk(S) {
    S.face('opa', 'pl');
    const f = S.f;
    if (S.has('kruecke0')) {
      S.take('kruecke0');
      await S.say('爷爷', ['马蒂亚斯的拐杖？……山毛榉的，还是我二十年前给他做的。', '断口还算齐。给你上一圈铜箍，比原来还结实。']);
      for (let i = 0; i < 3; i++) { S.sfx('knock'); await S.wait(260); }
      S.give('kruecke'); f.tFixed = true; f.act = 'dT';
      await S.say('爷爷', ['拿去。东西好修。人心里那道口子，得托尼自己去补。', '马蒂亚斯的腿是怎么伤的……他自己从来不提。教堂圣器室的墙上，挂着一张旧报纸。']);
      S.moveTo('toni_c', 'kirche', 5, 6, 3); S.hide('toni');
      await S.think('托尼说，他先去教堂门口等着。');
      return goalTasks(S);
    }
    if (f.ph === 'go') return S.say('爷爷', '去教堂看看马蒂亚斯吧。');
    if (f.ph === 'ready') return S.say('爷爷', ['游行要开始了。我带菲利克斯去广场东头站着。', '……莱妮，别跑太快。你小时候追坎卜斯，摔掉过一颗门牙。']);
    if (S.has('streifen')) return S.say('爷爷', ['拼卡片？工作台上有浆糊。', '跟拼木头榫一个道理：看每一条的上边和下边，哪边接得上哪边。']);
    if (f.fBell && !f.goatFollow && !f.dF) return S.say('爷爷', ['林子里今天不太平。羊的蹄印小，两瓣一对。', '要是看见一串一只蹄子、一只光脚的……别跟。']);
    if (f.tFixed && !f.dT) return S.say('爷爷', '圣器室墙上那张旧报纸，你看了没有？');
    return S.say('爷爷', ['你去忙吧。七点以前回广场。', '……墙角那张面具，别碰。']);
  }
  async function benchOn(S) {
    if (S.has('streifen')) return cardPuzzle(S);
    if (S.f.lCard) return S.narr('工作台上还留着一小摊浆糊。');
    await S.narr('爷爷的工作台。一张刻了一半的面具躺在上面，眼窝刚挖出来，还没有舌头。');
  }
  async function cardPuzzle(S) {
    const v = await S.keypad('从上到下，依次按碎卡片的编号（四条各用一次）。\n（点右上角的「笺」或按 J，可以再看「四条碎卡片」）', ['1', '2', '3', '4'], 4, { cancel: true });
    if (v == null) return;
    if (v === '2143') return cardOK(S);
    if (new Set(v).size < 4) return S.think('……每一条只能用一次。');
    const n = ++CARD_WRONG;
    bellJ(S, .03); S.shake(200, 1); if (n >= 2) S.fx('red');
    let msg;
    if (v[0] !== '2') msg = '贴在最上面的那条，上边应该是卡片顶上的白边。';
    else if (v[3] !== '3') msg = '贴在最下面的那条，下边应该是卡片底下的白边，带着邮戳。';
    else msg = '中间两条：上一条的下边，要接得上下一条的上边——犄角根接犄角根，铃铛接铃铛。';
    await S.think('……对不上。' + msg + (n >= 2 ? '\n窗外好像有铃声，比刚才近了一点。' : ''));
    if (n === 2) await S.think('（一条一条看：上边是什么？下边是什么？首尾相接。）');
    if (n === 3) await S.think('（带着白边和烫金字的是②。②的下边是犄角根——哪一条的上边也是犄角根？）');
    if (n >= 4) await S.think('（②在最上面，然后是①，再是④，最后是带邮戳的③：2、1、4、3。）');
  }
  async function cardOK(S) {
    S.take('streifen'); S.give('karte'); S.f.lCard = true; S.f.cardRead = true; S.f.act = 'dL';
    S.sfx('paper');
    await S.narr('四条纸接上了。\n一个长角的东西站在雪地里，舌头耷拉到胸口，腰上一圈铃铛，背上的篓子里伸出两条小腿。');
    S.face('opa', 'pl');
    await S.say('爷爷', ['坎卜斯明信片（Krampuskarte）。我小时候，大人们过节就互相寄这个：「坎卜斯问候你！」', '……这张有年头了，1909年的。底下被火燎过。']);
    await S.think('「十二月五日夜，跑铃的人里，有一个不是人。\n它满身铃铛，一声不响；冷夜里，嘴里不冒白气。\n脚——」\n……后面烧没了。');
    S.place('liesl', 25, 4, 2);
    goalTasks(S);
  }
  async function hockerOn(S) {
    const f = S.f;
    if (f.leniGold) return S.narr('小木羊。犄角是菲利克斯帮你捡回来的，还没粘上。');
    if (f.wax) return S.narr('小木羊少了一只犄角。\n……那句话，是你自己说出口的。');
    await S.narr('你刻的小木羊，放在板凳上。少了一只犄角。');
  }
  async function bmwOn(S) {
    if (S.ent('bmw').s.gone) return S.narr('墙角的钉子上，空了。\n……它不在了。');
    await S.narr('脸朝着墙的那张面具。木头背面光秃秃的，两根皮绳磨得发亮。\n离它很近的时候，你觉得它是热的。');
    const c = await S.ask('……', ['把它翻过来看看', '别碰它']);
    if (c === 0) await S.think('手伸到一半，你又缩了回来。\n爷爷说过：不许把它翻过来。');
  }
  async function leaveWerk(S) {
    if (S.f.ph === 'intro') return;
    await S.go('town', 5, 4, 0);
  }
  async function toWerk(S) {
    if (S.f.ph === 'lure') { await S.think('不能进屋！它会去找别的孩子！'); return; }
    S.sfx('open'); await S.go('werk', 6, 8, 3);
  }

  /* ---------- 教堂 ---------- */
  async function toChurch(S) {
    if (S.f.ph === 'lure') return S.say('圣尼古拉', '别进去！把它引到台阶这儿来！');
    if (S.f.ph === 'parade') return S.say('圣尼古拉', '莱妮，现在不是进去的时候。它就在下面的广场上。');
    S.sfx('open'); await S.go('kirche', 7, 11, 3);
  }
  async function leaveChurch(S) { await S.go('town', 16, 4, 0); }
  async function lecternOn(S) {
    if (S.ent('lectern').s.gone) return S.narr('读经台上空了。金书在你怀里。');
    await S.note('金书·最后一页', bookText(S.f));
    if (S.f.dF && S.f.dL && S.f.dT && !S.f.wax) return waxReveal(S);
  }
  async function matthiasTalk(S) {
    S.face('matthias', 'pl');
    const f = S.f;
    if (f.dF && f.dL && f.dT && !f.wax) return waxReveal(S);
    if (S.has('kruecke') && !f.dT) return S.say('马蒂亚斯', ['……托尼来了？', '让他自己来说。']);
    if (S.has('kruecke0')) { await S.say('马蒂亚斯', ['我的拐杖……断成这样了。', '你爷爷是木匠。']); return S.think('（先请爷爷把拐杖修好。）'); }
    if (TONI_WRONG && !f.dT) return S.narr('马蒂亚斯老爷爷背对着你，在擦烛台。擦了一遍又一遍。');
    const left = ['dF', 'dL', 'dT'].filter(k => !f[k]).length;
    await S.say('马蒂亚斯', ['红字变金了，书会知道的。', `还剩${left}个孩子。七点以前。`]);
  }

  /* ---------- 菲利克斯 / 山羊 ---------- */
  async function felixTalk(S) {
    const f = S.f, id = f.ph === 'parade' || f.ph === 'lure' ? 'felix_p' : 'felix';
    if (f.ph === 'lure') return S.say('菲利克斯', '姐姐！快走！它在你后面！');
    S.face(id, 'pl');
    if (f.wax && !f.leniGold) return apologize(S, id);
    if (f.ph === 'parade') return S.say('菲利克斯', f.leniGold ? '姐姐，加油！' : '姐姐……那个最西头的，它一直在看我。');
    if (f.leniGold) return S.say('菲利克斯', '姐姐，小木羊的犄角我捡回来了。爷爷说能粘上。');
    if (f.dF) return S.say('菲利克斯', '胡贝尔奶奶没骂我。她说小雪认得我，以后让我帮她放羊。');
    if (!f.fBell) {
      f.act = 'dF';
      await S.say('菲利克斯', '……我不跟你说话。你想让坎卜斯把我背走。');
      await S.narr('他坐在雪地上，背对着你。雪橇的车头上，用红毛线拴着那只铜铃铛。');
      await S.say('莱妮', ['菲利克斯，那只铃铛是胡贝尔家小雪的吧？', '金书上……写着你的名字。红字。']);
      S.bubble(id, '!', 900);
      await S.say('菲利克斯', ['……我就想让我的雪橇也响嘛。', '我摘下来的时候，小雪还舔我的手。后来它就跑了，往南边林子里跑了。我不敢说。']);
      S.give('glocke'); f.fBell = true; S.ent('sled').s.bell = false; goatBell(S);
      await S.say('菲利克斯', ['你帮我找它回来，好不好？我不敢进林子。', '小雪的脚印小小的，两瓣两瓣的，像一对一对的豆子。']);
      return goalTasks(S);
    }
    await S.say('菲利克斯', f.goatFollow ? '小雪！姐姐你找到它了！快牵给胡贝尔奶奶！' : '小雪往南边林子里跑了。它的脚印小小的，两瓣一对。');
  }
  async function apologize(S, id) {
    const c = await S.ask('菲利克斯低着头，用靴子尖踢着雪。', ['「菲利克斯……那天我说的话，对不起。我收回。」', '（揉揉他的脑袋，什么也不说）', '「是你先弄坏我的小木羊的！」']);
    if (c === 0) {
      await S.say('菲利克斯', ['……真的吗？', '那坎卜斯不会把我背走了？']);
      await S.say('莱妮', '谁也不许把你背走。');
      await S.narr('菲利克斯从兜里掏出一样东西，塞进你手里。\n是小木羊的那只犄角。他一直揣着。');
      S.f.leniGold = true; goldS(S);
      S.toast('怀里的金书微微一热——最后一行，变成了金色');
      return;
    }
    if (c === 1) { S.bubble(id, '?', 900); await S.say('菲利克斯', '……姐姐？'); return S.think('（有些话，得说出口。）'); }
    S.bubble(id, '…', 1200);
    await S.say('菲利克斯', '……我知道。');
    await S.think('他的眼圈红了。\n怀里的金书，冷冰冰的。');
  }
  async function huberTalk(S) {
    S.face('huber', 'pl');
    const f = S.f;
    if (f.goatFollow) return deliverGoat(S);
    if (f.dF) return S.say('胡贝尔太太', '小雪吃饱了，在里面打呼噜呢。……替我谢谢你弟弟。');
    if (S.once('huber1')) await S.say('胡贝尔太太', ['莱妮！看见我家小雪没有？白山羊，脖子上——', '……铃铛也没了。下午就不见了。', '天一黑，林子里的东西就出来了。今晚是什么日子，你也知道。']);
    await S.say('胡贝尔太太', '山羊的蹄子是两瓣的，小小的，一对一对踩下去。往南边林子里找找吧。');
  }
  async function deliverGoat(S) {
    S.follow('goat', false); S.place('goat', 5, 11, 0); S.ent('goat').solid = true; S.f.goatFollow = false;
    goatBell(S, .07);
    await S.say('胡贝尔太太', ['小雪！我的小雪！', '……还系着铃铛呢。']);
    S.place('felix', 9, 13, 1);
    await S.narr('菲利克斯不知道什么时候跟了过来，躲在你身后，攥着你的衣角。');
    S.face('huber', 'felix');
    await S.say('菲利克斯', ['胡贝尔奶奶……铃铛是我摘的。', '对不起。']);
    await S.say('胡贝尔太太', ['……你这个小捣蛋。', '明天来帮我铲羊圈。铲干净了，就算两清。']);
    await amendDone(S, 'dF', '菲利克斯');
  }
  async function goatOn(S) {
    if (S.f.goatFollow) return S.narr('小雪跟在你后面，铃铛叮当叮当地响。');
    if (!S.has('glocke')) return S.narr('一只白山羊，角卡在荆棘丛里，冻得直哆嗦。\n你一伸手，它就往后缩。……没有铃铛，天这么黑，一松手就找不着它了。');
    S.take('glocke'); S.f.goatFollow = true; S.f.goatFound = true; S.f.act = 'dF';
    S.ent('goat').s.bell = true; goatBell(S, .08);
    await S.narr('你把铃铛系回小雪的脖子上。\n叮——当。\n它安静下来，凑过来闻了闻你的手，跟着你从荆棘里钻了出来。');
    S.follow('goat', true);
    goalTasks(S);
  }
  async function printsOn(S, k) {
    if (k === 'goat') return S.narr('小小的蹄印，两瓣一对，一对一对地往前排。\n……是山羊。');
    if (k === 'fox') return S.narr('一个一个的小爪印，排成一条直线，前面四个小肉垫。\n……不像羊。');
    S.f.sawHoof = true;
    await S.narr('一只是分瓣的大蹄印，比牛蹄子还大，陷得很深；\n另一只，是光着的人脚印。五个脚趾头清清楚楚。');
    await S.think('一只蹄子，一只光脚。\n……光着脚，在雪里。往东边去了。');
  }
  async function toForest(S) {
    const ph = S.f.ph;
    if (ph === 'go') { await S.narr('先去教堂找马蒂亚斯老爷爷吧。'); return S.walk('pl', 'u', 4); }
    if (ph === 'lure') { await S.think('不能跑开！它会去找别的孩子！'); return; }
    if (ph !== 'tasks') { await S.narr('游行就要开始了，现在不能进林子。'); return S.walk('pl', 'u', 4); }
    if (S.f.goatFollow) S.moveTo('goat', 'wald', 12, 1, 0);
    await S.go('wald', 12, 1, 0);
  }
  async function leaveForest(S) {
    if (S.f.goatFollow) S.moveTo('goat', 'town', 15, 22, 3);
    await S.go('town', 15, 22, 3);
    if (S.f.goatFollow && S.once('goatHome')) await S.think('小雪的铃铛在身后叮当叮当地响。\n……把它牵回胡贝尔太太的羊圈去。');
  }
  function forestTick(S, dt) {
    const x = S.pl.x, y = S.pl.y;
    if ((y === 6 && x >= 19) || (x >= 19 && y >= 7)) { S.run(wrongTrail); return; }
    if (y >= 11 && y <= 12 && x >= 10 && x <= 11 && !S.f.foxSeen) { S.f.foxSeen = true; S.run(foxScene); return; }
    if (S.f.goatFollow && !S.f.glimpse && x === 5 && y <= 9 && y >= 7) { S.f.glimpse = true; S.run(glimpse); return; }
    AMB -= dt;
    if (AMB <= 0) { AMB = 7 + Math.random() * 5; bellJ(S, .015); if (Math.random() < .5) chainS(S, .015, .4); }
  }
  async function wrongTrail(S) {
    const n = S.f.fw = (S.f.fw || 0) + 1;
    S.f.sawHoof = true;
    if (n === 1) {
      for (let i = 0; i < 6; i++) { bellJ(S, .05 + i * .01); await S.wait(120); }
      S.focus(20, 12);
      await S.narr('林间空地上，一截老树桩。\n树桩上放着一只编得很密的背篓，篓口挂着一只小小的红童鞋。');
      S.place('kr_f', 21, 11, 1); S.ent('kr_f').alpha = 0; S.alpha('kr_f', 1, 500); chainS(S, .1);
      await S.narr('树桩后面，有什么东西站了起来。');
      await S.scare('face', { face: 'krampus', sfx: 'scream' });
      S.hide('kr_f'); S.focus(null);
      S.pos(13, 6, 1);
      await S.think('……你都不知道自己是怎么跑回岔路口的。\n那串脚印——一只是蹄子，一只是光着的人脚。');
      await S.think('（别再往那边走了。跟着小小的、两瓣一对的羊蹄印走。）');
      return;
    }
    FOREST_DIED++;
    for (let i = 0; i < 8; i++) { bellJ(S, .08); chainS(S, .05); await S.wait(90); }
    await S.scare('red', { sfx: 'scream' });
    await S.die('铃声从四面八方围了过来。\n你看不见它，只看见雪地上，一只蹄印，一只光脚印，一直走到你跟前。', '林子里的背篓');
  }
  async function glimpse(S) {   // 牵着小雪往回走：它在树影里站了一下
    S.place('kr_f', 8, 8, 1); S.ent('kr_f').alpha = 0;
    for (let i = 0; i < 3; i++) { bellJ(S, .03 + i * .01); await S.wait(160); }
    await S.alpha('kr_f', .85, 600);
    goatBell(S, .09); S.bubble('goat', '!', 1200);
    await S.think('……东边的树影里，站着一个长角的影子。\n它没有动，也没有追。小雪的铃铛拼命地响。');
    await S.alpha('kr_f', 0, 700);
    await S.think('（别停下。把小雪牵回去。）');
  }
  async function foxScene(S) {
    S.place('fox', 11, 12, 1); S.ent('fox').alpha = 0; await S.alpha('fox', 1, 300);
    await S.narr('一只狐狸从雪窝里探出头来，看了你一眼，又缩了回去。');
    S.hide('fox');
    await S.think('是狐狸的脚印。一个一个排成一条线的那种。\n小雪的蹄印是两瓣一对的——回岔路口，往南走。');
  }

  /* ---------- 莉泽尔 / 伊尔泽 ---------- */
  async function lieslTalk(S) {
    S.face('liesl', 'pl');
    const f = S.f;
    if (f.dL) return S.say('莉泽尔', '伊尔泽奶奶给了我一块姜饼。……她说她小时候也偷过苹果。');
    if (f.lCard) return S.say('莉泽尔', '我……我陪你去跟伊尔泽奶奶说。');
    if (f.lStrips) return S.say('莉泽尔', '你爷爷那儿有浆糊吧？……你拼的时候，我不敢看。');
    f.act = 'dL';
    await S.say('莉泽尔', '干嘛？我又没干坏事。');
    await S.say('莱妮', '金书上有你的名字，红字。说你撕了伊尔泽奶奶的明信片。');
    S.bubble('liesl', '!', 900);
    await S.say('莉泽尔', ['……是她先冤枉我的！她说我偷她家的苹果——', '……好吧，我是偷了。可那是两个烂苹果！', '她就站在门口骂，整条街都听见了。我气不过，看见窗台上那张旧卡片，就……']);
    await S.narr('莉泽尔从手套里掏出几条皱巴巴的纸，塞到你手里。');
    await S.say('莉泽尔', ['我没扔，一直揣着。', '上面画的是坎卜斯……我越看越害怕。']);
    S.give('streifen'); f.lStrips = true;
    await S.note('karte');
    await S.think('得把它拼回去。爷爷的工作台上有浆糊。\n（四条横条：看每一条的上边和下边，哪两条接得上。）');
    goalTasks(S);
  }
  async function ilseTalk(S) {
    S.face('ilse', 'pl');
    const f = S.f;
    if (f.dL) return S.say('伊尔泽奶奶', '……我父亲要是还在，非得笑话我不可：跟个小丫头较什么劲。');
    if (f.lCard) return giveCard(S);
    if (S.once('ilse1')) return S.say('伊尔泽奶奶', ['莱妮啊。……你看见我窗台上那张卡片没有？我父亲留下的。', '那个莉泽尔说是风吹走的。风？风会把它撕成一条一条的？']);
    return S.say('伊尔泽奶奶', '那张卡片，是我父亲1909年寄给我母亲的。我就剩这么一张了。');
  }
  async function giveCard(S) {
    S.take('karte'); S.face('liesl', 'ilse');
    await S.narr('你把拼好的卡片递过去。莉泽尔躲在你背后，半天才挪出来。');
    await S.say('莉泽尔', ['伊尔泽奶奶……卡片是我撕的。苹果也是我偷的，两个。', '对不起。']);
    await S.say('伊尔泽奶奶', ['……', '我那天骂得也太凶了。为了两个烂苹果。']);
    await S.say('伊尔泽奶奶', ['这张卡片，是我父亲画的。他年轻的时候跑过铃。', '他说有一年游行完一数，多出来一个，谁也不认得它。第二天，山那边的村子里少了一个孩子。', '后来他每年十二月都把这几句念给我们听。……念到「脚」那一句，他总要停一下。']);
    await S.say('伊尔泽奶奶', '第三句是什么来着……我老了，想不起来了。');
    if (S.f.sawHoof) await S.think('……一只蹄子，一只光脚。\n林子里那串脚印。');
    else await S.think('「脚——」……\n（林子里的雪地上，也许有答案。）');
    await amendDone(S, 'dL', '莉泽尔');
  }

  /* ---------- 托尼 / 马蒂亚斯 ---------- */
  async function toniTalk(S) {
    S.face('toni', 'pl');
    const f = S.f;
    if (f.tBroken) return S.say('托尼', '拐杖……你爷爷是木匠，能修吧？');
    f.act = 'dT';
    await S.say('托尼', ['哟，莱妮。来坐雪橇？我这道滑道可是全镇最快的。', '……干嘛这么看着我。']);
    await S.say('莱妮', '金书上写着，你往教堂台阶上泼水，马蒂亚斯爷爷摔了一跤。红字。');
    await S.say('托尼', ['那……那是他自己走路不看脚底下！', '他一瘸一拐的，摔下去的样子……大家都笑了，又不止我一个。']);
    await S.say('托尼', ['……', '他拐杖断了。我捡回来了，藏在雪堆里。本来想偷偷修好，可我不会。', '我爸是铁匠，我不敢让他知道。']);
    f.toniDad = true; f.tBroken = true; S.give('kruecke0');
    await S.narr('托尼从雪堆里刨出一根断成两截的山毛榉拐杖，塞给你。');
    goalTasks(S);
  }
  async function toniChurch(S) {
    S.face('toni_c', 'pl');
    const f = S.f;
    if (f.dT) return S.say('托尼', f.wax ? '……' : ['台阶上的冰，我拿炉灰撒过了。', '马蒂亚斯爷爷让我替他拿锁链！']);
    if (!S.has('kruecke')) return S.say('托尼', '拐杖呢？');
    if (S.once('toniCh')) await S.say('托尼', ['……他就在那儿。我腿软。', '莱妮，我该怎么说？']);
    const know = f.zeitung && f.toniDad;
    const c = await S.ask('托尼看着你。', ['「就说对不起，你不该笑他。」', '「跟他说，你会赔他一根新拐杖。」', know ? '「告诉他：你爸爸，就是当年被他从雪里背下山的那个孩子。」' : '「……」（你也不知道马蒂亚斯的腿是怎么伤的）']);
    if (c === 2 && know) return toniOK(S);
    const n = ++TONI_WRONG;
    bellJ(S, .025);
    if (c === 0) {
      await S.say('托尼', '马……马蒂亚斯爷爷，对不起。我不该笑你。');
      await S.say('马蒂亚斯', '嗯。……拐杖放那儿吧。');
      S.face('matthias', 0);
      await S.think('他没有接拐杖，也没有看托尼。\n光说「对不起」不够——他想听的不是这个。');
    } else if (c === 1) {
      await S.say('托尼', '我……我赔你一根新拐杖！');
      await S.say('马蒂亚斯', '拐杖不要紧。');
      S.face('matthias', 0);
      await S.think('……他要的不是拐杖。');
    } else await S.think('马蒂亚斯老爷爷的腿，到底是怎么伤的？\n你也不知道。');
    if (n === 2) await S.think('（他的腿是怎么伤的？爷爷好像知道一点。教堂里也许有线索。）');
    if (n === 3) await S.think('（圣器室——教堂右边那间小屋——墙上挂着一张旧剪报。）');
    if (n >= 4) { f.zeitung = true; f.toniDad = true; await S.think('（爷爷说过：马蒂亚斯的腿，是雪崩那年救人压坏的。被救的，有铁匠家八岁的小儿子。\n托尼他爸，就是铁匠。）'); }
  }
  async function toniOK(S) {
    S.face('matthias', 'toni_c');
    await S.say('托尼', ['马蒂亚斯爷爷……', '我爸是铁匠。他小时候放羊碰上了雪崩。他跟我讲过好多遍，说有个人在雪里刨了四个钟头，把他背下山。']);
    await S.say('托尼', ['我不知道……是你。', '我笑的那条腿……是因为救他才瘸的。对不起。']);
    await S.narr('马蒂亚斯老爷爷半天没说话。\n然后他伸出手，按了按托尼的脑袋。');
    await S.say('马蒂亚斯', ['……你跟你爸小时候一个样，一着急，眉毛就拧成一个疙瘩。', '拐杖给我。……哟，还上了铜箍。']);
    S.take('kruecke');
    await S.say('马蒂亚斯', ['托尼，今天晚上你给我当助手，替我拿着锁链。', '圣尼古拉，还是我来扮。']);
    await amendDone(S, 'dT', '托尼');
    if (S.f.dF && S.f.dL && S.f.dT) return waxReveal(S);
  }
  async function waxReveal(S) {
    S.f.wax = true;
    S.sfx('whisper');
    await S.narr('读经台上，金书自己翻动了一下。\n最后一行上的那滴黑蜡，在烛光里慢慢化开，淌了下来。');
    await S.walk('pl', [4, 5], 4); S.face('pl', 3);
    await S.note('金书·最后一行', '那三行红字，都变成了金色。\n\n蜡化开以后，最后一行露了出来。红字，墨还没干：\n\n' + LENILINE);
    await S.think('……是我。');
    S.face('matthias', 'pl');
    await S.say('马蒂亚斯', ['……', '莱妮，这一行，别人替你还不了。']);
    await S.say('马蒂亚斯', ['还有一件事。这页红字不是我们写的——是它写的。它今晚已经来了，就混在跑铃的人里头。', '书你拿着。认出它来，就把书对着它翻开，它就藏不住了。']);
    S.give('buch'); S.ent('lectern').s.gone = true;
    await S.say('马蒂亚斯', ['然后把它引到我跟前来。我和托尼在教堂台阶上等着。只有它自己走到圣尼古拉面前，锁链才套得住它。', '记住：走着引，别跑。你一跑，它就不追你了，它会转头去找别的孩子。可也别让它够着你。']);
    S.hide('toni_c');
    await S.walk('matthias', [11, 4], 2);
    S.hide('matthias'); S.ent('robe').s.gone = true; S.ent('chainhook').s.gone = true;
    S.place('felix', 9, 13, 0);
    S.f.ph = 'ready';
    S.goal('准备好了，就去下面的大广场——游行从那里开始');
    await S.think('（菲利克斯在胡贝尔家的羊圈边上。\n……游行开始以前，我是不是该跟他说点什么？）');
    S.cp('ready');
  }

  /* ---------- 游行 ---------- */
  async function wirtTalk(S) {
    S.face('wirt', 'pl');
    await S.say('酒馆老板', ['今年报名跑铃的只有五个：锯木厂的弗里茨、小施密特、我那个不成器的侄子、邮递员韦伯，还有铁匠。', '五个人，六点四十从林子那条路上冲下来。你可站远点，桦枝抽在腿上，疼着呢。']);
  }
  async function crowdOn(S) { await S.narr(['看游行的人挤成一堵墙。大人把孩子扛在肩膀上。', '有个老太太在念叨：「圣尼古拉保佑……」'][S.rand(2)]); }
  async function opaParade(S) {
    S.face('opa_p', 'pl');
    await S.say('爷爷', [S.coop ? '你们俩分开看：一个凑近去看铃铛、白气和脚印，一个翻笺对卡片上那几句。三样都对上了再动手。' : '铃铛、白气、脚。三样都看清楚了再动手。', '……那张黑面具不见了。莱妮，你要是在哪儿看见它，千万别碰。']);
  }
  async function nikoTalk(S) {
    S.face('niko', 'pl');
    if (S.f.ph === 'lure') return S.say('圣尼古拉', '走着引它过来！别跑！');
    await S.say('圣尼古拉', ['认出它来，就把金书对着它翻开。', '然后走着把它引到我这儿来。别跑，也别让它够着你。']);
  }
  async function paradeStart(S) {
    S.f.ph = 'parade';
    await S.fade(1, 500);
    for (const id of PARADE_HIDE) S.hide(id);
    S.hide('opa');
    for (const id of PARADE_SHOW) S.show(id);
    S.ent('bmw').s.gone = true;
    S.pos(16, 15, 0); S.dark(.78); S.amb('market');
    await S.card('', '傍晚六点四十分', '天黑透了。全镇的人都挤在广场边上。\n林子那边，传来了铃声。');
    await S.fade(0, 600);
    for (let i = 0; i < 16; i++) { bellJ(S, .05 + i * .004); if (i % 3 === 0) chainS(S, .05); await S.wait(130); }
    S.shake(600, 2);
    await S.narr(['六个跑铃的坎卜斯从林子那条路上冲了下来。\n铃铛震得人耳朵嗡嗡响，桦枝抽在看热闹的人腿上，孩子们尖叫着笑着，往大人背后躲。', '它们在下面的大广场上停住了，呼哧呼哧地喘着气，等着圣尼古拉从教堂台阶上走下来。']);
    await S.think('……六个。酒馆老板说，今年报名跑铃的只有五个人。');
    await S.think(S.f.sawHoof ? '铃铛一声不响。嘴里不冒白气。一只蹄子，一只光脚。\n——是哪一个？（两个人的话：一个凑近看，一个翻笺对卡片。）' : '铃铛一声不响。嘴里不冒白气。\n卡片上烧掉的那一句「脚——」……是什么？');
    if (!S.f.leniGold) await S.think('（怀里的金书，最后一行还是红的。\n菲利克斯和爷爷站在广场东头。）');
    S.goal('认出不是人的那个：凑近看铃铛、呼气和脚印，再把金书对着它翻开（七点以前）');
    S.cp('parade');
    startParade(S, PARADE_T);
  }
  function startParade(S, sec) { PARADE_LEFT = sec; CHQ = null; HB = 0; S.timer(sec, '七点钟声', bellEnd, { during: true }); }
  function paradeTick(S, dt) {
    const left = S.timerLeft;
    if (left != null) {
      const q = Math.ceil(left / 30);
      if (q !== CHQ) { if (CHQ != null) churchBell(S, .07); CHQ = q; }   // 每过半分钟，钟楼敲一下
      if (left < 20) { HB -= dt; if (HB <= 0) { HB = left < 10 ? .55 : .85; S.sfx('heart'); } }
    }
    const bm = S.ent('bmask');
    if (bm && !bm.hidden && !S.f.bmWh && Math.hypot(bm.px - S.pl.px, bm.py - S.pl.py) / 16 < 3) {
      S.f.bmWh = true; S.sfx('whisper'); S.bubble('bmask', '…', 1600);
      S.run(async S => { await S.think('……喷泉的石沿上，有什么东西在小声叫你的名字。'); });
      return;
    }
    JT -= dt;
    if (JT <= 0) {
      JT = .7 + Math.random() * .5;
      let bd = 9;
      for (const id of RINGING) { const e = S.ent(id); if (!e || e.hidden) continue; const d = Math.hypot(e.px - S.pl.px, e.py - S.pl.py) / 16; if (d < bd) bd = d; }
      if (bd < 5) bellJ(S, .045 * (1 - bd / 5.5));
    }
    IDT -= dt;
    if (IDT <= 0) { IDT = 1.6 + Math.random() * 1.6; const id = RUNNERS[S.rand(RUNNERS.length)], e = S.ent(id); if (e && !e.s.unmask) e.dir = [0, 1, 2, 0][S.rand(4)]; }
  }
  async function runnerOn(S, e) {
    const R = RUN[e.id];
    if (S.f.ph === 'lure') return S.think('现在不是看它们的时候——走！');
    if (S.f.ph !== 'parade') return;
    if (e.s.unmask) return S.say(RUN[e.id].who, '嘿，又是你？我可不是你要找的那个。');
    S.face(e.id, 'pl');
    await S.narr(R.look + '\n' + R.bells);
    await S.narr(R.breath + '\n' + R.prints);
    const c = await S.ask('……', ['把金书对着它翻开', '再看看别的']);
    if (c !== 0) return;
    if (e.id === 'kr') return reveal(S);
    return accuseWrong(S, e.id);
  }
  async function accuseWrong(S, id) {
    const R = RUN[id], n = ++ACC_WRONG;
    S.timerAdd(-20);
    S.ent(id).s.unmask = true;
    S.sfx('cut'); S.shake(300, 2); S.fx('red');
    await S.say('坎卜斯', `嘿！莱妮，是我——${R.who}！……你拿本书对着我干嘛？`);
    chainS(S, .07);
    await S.narr('桦枝在你小腿上抽了一下，火辣辣的。\n广场的另一头，有一串铃铛晃了晃，一声没响。');
    await S.think('……不是它。' + R.why);
    if (n === 2) await S.think('（三样都对得上的才是它：铃铛不响，又不是缠了布、结了冰；嘴里没有白气；一只蹄子，一只光脚。）');
    if (n === 3) await S.think('（看看广场最西头，靠羊圈那边。它脚边的雪地……）');
    if (n >= 4) await S.think('（就是最西头那个：暗褐色的毛，黑红色的面具。）');
  }
  async function bellEnd(S) {
    S.f.ph = 'bell'; PARADE_FAILS++; PARADE_LEFT = 0;
    for (let i = 0; i < 7; i++) { churchBell(S); S.shake(200, 1); await S.wait(850); }
    for (const id of ['lamp1', 'lamp2', 'lamp3', 'lamp4', 'tor1', 'tor2', 'tor3', 'tor4']) S.ent(id).off = true;
    S.dark(.96);
    await S.narr('第七下钟声还在山谷里荡着，广场上所有的灯一下子全灭了。\n黑暗里，有一串铃铛，一声也没响，走到了你身边。');
    await S.scare('static', { sfx: 'scream' });
    await S.end({ bad: true, id: 'bell', title: '钟敲了七下', text: '第二天早上，广场上的雪被踩得乱七八糟。\n跑铃的人摘下面具，对着名单一个一个点——五个人，一个不少。\n没有人说得清，昨天晚上那第六个是谁。\n\n莱妮的靴子摆在窗台上，空的。\n菲利克斯每天都去教堂翻那本金书。最后一页上，他姐姐的名字底下，画着一只小小的篓子。' });
  }
  async function bmaskOn(S) {
    if (S.f.ph !== 'parade') return;
    await S.narr('喷泉的石沿上，放着一张黑色的面具。\n犄角拧着劲儿，眼洞是两个黑窟窿。……是爷爷墙上那张。它怎么会在这儿？');
    await S.say('', '戴上我。\n戴上我，你就看得见哪一个是它。', { style: 'whisper' });
    const c = await S.ask('……', ['戴上它', '别碰它']);
    if (c !== 0) return S.think('爷爷说过：谁也不许戴。');
    const c2 = await S.ask('爷爷说过：戴上它的人，就看得见它——它也看得见你。', ['戴上', '放下']);
    if (c2 !== 0) return S.think('……放下了。手指头冰得发麻。');
    S.clearTimer(); S.f.ph = 'mask'; S.hide('bmask');
    await S.fade(1, 300); S.dark(.3); await S.fade(0, 300);
    await S.narr('面具贴上来的那一下，冰得像一块雪。\n眼洞外面，整个广场都变了颜色。');
    await S.narr('五个跑铃的，面具底下是五张冻得通红的人脸。\n只有最西头那一个，面具底下……什么也没有。');
    S.face('kr', 'pl');
    await S.narr('它转过头来，看着你。\n然后，它很慢、很慢地，冲你弯了弯腰。');
    await S.scare('face', { face: 'bmask', sfx: 'scream' });
    await S.end({ bad: true, id: 'mask', title: '它的脸', text: '第二天早上，人们在喷泉边上找到了那张黑面具，脸朝下扣在雪里。\n没有人找到莱妮。\n\n爷爷把面具挂回墙上，脸朝着墙。\n从那以后，他每天晚上都要对着那块光秃秃的木头背面，坐上很久。\n\n第二年的坎卜斯游行，跑铃的队伍里多了一个。\n它比别人矮一点，戴着一张黑面具，铃铛一声不响。\n它在作坊的窗户外面，站了很久很久。' });
  }

  /* ---------- 揭穿与引它过来 ---------- */
  async function reveal(S) {
    S.clearTimer(); PARADE_LEFT = null; S.f.ph = 'reveal';
    await S.narr('你把金书对着它，翻开了。\n红字在纸上动了起来，一个字一个字地往上爬——爬成了一个名字。不是人的名字。');
    const k = S.ent('kr'); k.s.rev = true;
    for (let i = 0; i < 10; i++) { bellJ(S, .09); await S.wait(60); }
    await S.scare('face', { face: 'krampus', sfx: 'scream' });
    await S.narr('它满身的铃铛，这时候一起响了。\n你往后退了好几步。');
    S.place('kr', 4, 17, 2); S.pos(7, 17, 2);
    await S.say('圣尼古拉', ['莱妮——过来！到台阶这儿来！', '走！别跑！']);
    S.goal('把它引到教堂台阶上的圣尼古拉面前：走着引，别跑；别让它够着，也别甩开它');
    S.f.ph = 'lure';
    S.cp('lure');
    startLure(S);
  }
  function startLure(S) {
    L = { mode: 'chase', hits: 0, far: 0, grace: 0, warned: false };
    S.bubble('kr', '!', 1000); chainS(S, .08);
    S.chase('kr', { spd: KSPD, wait: .9, catch: kCatch });
  }
  function lureTick(S, dt) {
    if (!L || S.busy || S.map !== 'town') return;
    const kr = S.ent('kr'), p = S.pl, tx = Math.round(kr.px / 16), ty = Math.round(kr.py / 16);
    if (L.mode === 'done' || L.mode === 'x') return;
    if (ty <= 6 && tx >= 13 && tx <= 19) { L.mode = 'done'; S.stop('kr'); S.run(chained); return; }
    if (L.grace > 0) { L.grace -= dt; return; }   // 刚挨了一下：它照样跟着，但这一小会儿不会再抓
    const dist = Math.hypot(kr.px - p.px, kr.py - p.py) / 16;
    JT -= dt; if (JT <= 0) { JT = .5; bellJ(S, .06); }
    if (L.mode === 'chase') {
      if (kr.chase) kr.chase.spd = dist > 5 ? KFAR : KSPD;
      if (dist < .9) { kr.chase = null; S.run(kCatch); return; }
      if ((dist > WARN || (S.running && dist > 4.5)) && !L.warned) { L.warned = true; S.bubble('kr', '?', 1200); S.toast('慢一点——它快跟不上你了'); }
      if (dist < 5) L.warned = false;
      if (dist > LOSE || (S.running && dist > 6)) {   // 跑起来的人，它跟不上就不跟了
        L.far += dt;
        if (L.far > .4) {
          L.mode = 'kids'; L.far = 0; L.pause = .9; S.stop('kr'); S.bubble('kr', '…', 1500); S.bubble('felix_p', '!', 1600);
          for (let i = 0; i < 4; i++) bellJ(S, .09, i * .12);
          S.toast('它不追你了——它转身往菲利克斯那边去了！回去把它引过来！');
        }
      } else L.far = 0;
      return;
    }
    if (L.mode === 'kids') {
      if (dist <= REGAIN) { L.mode = 'chase'; S.chase('kr', { spd: KSPD, wait: .3, catch: kCatch }); S.bubble('kr', '!', 900); S.toast('它又盯上你了'); return; }
      if (Math.abs(tx - KIDS[0]) + Math.abs(ty - KIDS[1]) <= 1) { L.mode = 'x'; S.run(kidsTaken); return; }
      if (L.pause > 0) { L.pause -= dt; return; }   // 它先停一下、回头看看，再往孩子那边走
      if (!kr.mv) { const d = bfsStep(curMap(), tx, ty, KIDS[0], KIDS[1], kr); if (d >= 0) startMove(kr, d, 2.2); }
    }
  }
  async function kCatch(S) {
    if (!L || L.mode !== 'chase') return;
    if (L.grace > 0) { S.chase('kr', { spd: KSPD, catch: kCatch }); return; }
    S.stop('kr');
    L.hits++;
    if (L.hits === 1) {
      S.sfx('cut'); S.shake(400, 3); S.fx('red'); S.bubble('pl', '!', 800);
      await S.think('啪！桦枝抽在小腿上，火辣辣地疼——\n（别停下！走！）');
      L.grace = 1.3;
      S.chase('kr', { spd: KSPD, wait: .8, catch: kCatch });
      return;
    }
    L.mode = 'x'; LURE_DIED++;
    await S.scare('red', { sfx: 'scream' });
    await S.die('一只冰凉的爪子揪住了你的后领。\n篓子里很黑，很暖，有一股松脂和羊膻的味道。\n铃铛终于响了，一路响着，往山后面去。\n\n（走着引它：别停下让它够着你。）', '进了篓子');
  }
  async function kidsTaken(S) {
    S.stop('kr'); LURE_DIED++;
    await S.narr('它走到菲利克斯跟前，弯下腰，一把把他塞进了背上的篓子。');
    await S.scare('red', { sfx: 'scream' });
    await S.die('「姐姐——！」\n铃铛声一路往林子那边去了。\n\n（你甩得太远，它就不追你了。走着引，让它一直跟在后面。）', '篓子');
  }
  async function chained(S) {
    S.f.ph = 'end'; S.clearTimer();
    chainS(S, .12); S.sfx('thud'); S.shake(500, 3);
    S.face('niko', 'kr'); S.face('toni_p', 'kr');
    await S.narr('圣尼古拉往前迈了一步，把金色的牧杖往台阶上一顿。\n托尼抡起锁链——哗啦一声，套住了它的脖子。');
    S.ent('kr').s.chained = true; S.ent('kr').s.rev = false; S.face('kr', 3);
    for (let i = 0; i < 6; i++) { bellJ(S, .08 - i * .012); await S.wait(110); }
    await S.narr('它满身的铃铛一下子全哑了。\n它站在台阶底下，低着头，一动不动。');
    S.face('pl', 3);
    await S.say('圣尼古拉', '莱妮，书。');
    await S.narr('你把金书递过去。圣尼古拉翻开最后一页，借着火把的光，一行一行地念。');
    await S.say('圣尼古拉', ['菲利克斯——金的。', '莉泽尔——金的。', '托尼——金的。']);
    if (S.f.leniGold) {
      await S.say('圣尼古拉', ['莱妮——', '……金的。', '这一页上，没有你的东西了。回去吧。']);
      await S.narr('它慢慢转过身。\n圣尼古拉牵着锁链，领着它一步一步走下台阶。');
      S.face('pl', 0);
      await Promise.all([S.walk('kr', [16, 12], 1.6), S.walk('niko', [15, 11], 1.6)]);
      await Promise.all([S.alpha('kr', 0, 900), S.alpha('niko', 0, 900)]);
      await S.narr('它们穿过广场，往林子那边去了。\n铃铛一声也没有响。');
      await S.narr('跑铃的人一个一个摘下面具：弗里茨，小施密特，酒馆老板的侄子，邮递员韦伯，铁匠。\n他们你看看我，我看看你，谁也说不清刚才那第六个是从哪儿来的。');
      await S.end({ id: 'true', title: '第二十七夜　完', text: '第二天早上，菲利克斯的靴子里有两个橘子、一把核桃。\n你的靴子里也有。还有一根刷成金色的小桦枝。\n\n爷爷把它挂在了作坊的墙上，就挂在那张脸朝着墙的黑面具旁边。\n他说，挂着它，是为了让人记得。\n不是记得坎卜斯——是记得那天晚上，你们是怎么把账还清的。\n\n小木羊的犄角，是菲利克斯帮你粘回去的。粘歪了。\n你没有让他重粘。' });
      return;
    }
    await S.say('圣尼古拉', '莱妮——');
    await S.narr('圣尼古拉没有念下去。');
    S.face('kr', 'pl');
    await S.say('坎卜斯', '……明年。', { style: 'whisper' });
    await S.narr('圣尼古拉牵着锁链，领着它走下台阶，往林子那边去了。\n它走出好远，还回过头来，看了你一眼。');
    await S.end({ id: 'good', title: '最后一行红字', text: '那天晚上，三个孩子都睡在自己的床上。\n菲利克斯的靴子里，第二天有两个橘子、一把核桃。\n\n金书的最后一页，还剩一行红字。\n马蒂亚斯说，那行墨一直没有干。\n\n你一直没跟菲利克斯说那句话。\n后来的每年十二月五日，你都会在铃声里醒过来，想起它说的那两个字：\n「明年。」' });
  }
})();
