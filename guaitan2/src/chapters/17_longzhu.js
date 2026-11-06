/* ================= 第十七夜 · 延安高架龙柱 ================= */
(() => {
  /* ---------- 小工具 ---------- */
  const bx2 = (R, x, y, w, h, fill, edge) => { R(x, y, w, h, edge || shade(fill, -.45)); R(x + 1, y + 1, w - 2, h - 2, fill); };
  const cycle = (S, key, lines) => lines[(S.f[key] = ((S.f[key] ?? -1) + 1) % lines.length)];
  const helmet = c => (g, d, fr, G, R) => { R(4, G.hT - 1, 8, 3, c); R(3, G.hT + 1, 10, 1, shade(c, -.25)); if (d === 0) R(6, G.hT - 1, 3, 1, shade(c, .35)); };

  /* ---------- 合成音效（双方都听得到） ---------- */
  const hammer = (S, v = .08, d = 0) => { S.tone('sine', 74, 32, .8, v, d, 360); S.tone('square', 150, 64, .14, v * .35, d, 900); S.tone('triangle', 1180, 1090, .6, v * .12, d + .02, 3200); };
  const knock = (S, d = 0, v = .05) => { S.tone('square', 270, 210, .08, v, d, 1500); S.tone('sine', 900, 840, .35, v * .45, d, 2800); };
  const muyu = (S, d = 0, v = .045) => { S.tone('sine', 760, 690, .07, v, d, 2200); S.tone('triangle', 380, 345, .09, v * .5, d, 1200); };
  const qing = (S, v = .05) => { S.tone('sine', 1318, 1314, 1.8, v, 0, 5000); S.tone('sine', 2637, 2630, 1.2, v * .3, 0, 6000); S.tone('sine', 3951, 3940, .6, v * .12, 0, 7000); };
  const bigBell = (S, v = .065) => { S.tone('sine', 131, 130, 4, v, 0, 900); S.tone('sine', 262, 261, 3, v * .5, 0, 1600); S.tone('sine', 349, 347, 2.2, v * .3, .02, 2000); S.tone('triangle', 523, 520, 1.2, v * .15, 0, 3000); };
  const rumble = (S, v = .06, dur = 1.8) => { S.tone('sawtooth', 46, 34, dur, v, 0, 160); S.tone('sine', 31, 26, dur, v * .8, .1, 120); };
  const bubbles = (S, n = 5, v = .03) => { for (let i = 0; i < n; i++) S.tone('sine', 240 + (i * 97) % 240, 520 + (i * 61) % 300, .07, v, i * .14 + (i % 2) * .05, 1800); };

  /* ================= 基坑：九子与「喘气」 ================= */
  /* u = 老浜底（每次喘气都会淹） d = 高地（只有它「翻身」时才淹） m = 铁板（永远不淹） */
  const PIT = [
    '######################',
    '######################',
    '#mmmmmmmmmmmmmmmmmmmm#',
    '#dddmddummmmmmudddddd#',
    '#dddmdududdmdududmddd#',
    '#uudmddudddmdduddmdud#',
    '#uuumuuddddmdddddmudu#',
    '#uuumuumuuumdddddmdud#',
    '#uuumuumuuuuuuudddddd#',
    '#dddmddduuuuuuuumuudd#',
    '#dddmddddddduuuumuuuu#',
    '#dudmdmmmmddddddmuuuu#',
    '#udumdddddudddddddduu#',
    '#dudmddddududdmmmmmmd#',
    '#dddddddddudddddddddd#',
    '######################'];
  const zone = (x, y) => (PIT[y] || '')[x] || '#';
  const SONS = {
    qn: { name: '囚牛', ord: '老大', nat: '好音律', carve: '一把胡琴，琴头上蹲着一只小兽', where: '北边靠西那一只', x: 7, y: 4 },
    yz: { name: '睚眦', ord: '老二', nat: '好杀', carve: '一把刀，刀柄上咬着一张兽嘴', where: '东南角、铁板旁边那一只', x: 17, y: 12 },
    cf: { name: '嘲风', ord: '老三', nat: '好险', carve: '一角高高翘起来的飞檐，檐角尖上站着一只小兽', where: '西头、泡在老浜底里那一只', x: 2, y: 7 },
    pl: { name: '蒲牢', ord: '老四', nat: '好鸣', carve: '一口钟，钟顶上盘着钟钮', where: '北边靠东那一只', x: 14, y: 4 },
    sn: { name: '狻猊', ord: '老五', nat: '好烟火', carve: '一只三条腿的香炉，炉盖上一缕烟', where: '桩子东南、浜底里那一只', x: 13, y: 9 },
    bx: { name: '赑屃', ord: '老六', nat: '好负重', carve: '一块石碑，碑底下压着一只驮碑的兽', where: '西南角那一只', x: 2, y: 12 },
    ba: { name: '狴犴', ord: '老七', nat: '好讼', carve: '一扇钉满铁钉的牢门，门当中一个兽头', where: '东边那一只', x: 19, y: 6 },
    fx: { name: '负屃', ord: '老八', nat: '好文', carve: '一卷摊开的书，书页上密密麻麻全是字', where: '南边正中那一只', x: 10, y: 13 },
    cw: { name: '螭吻', ord: '老九', nat: '好吞水', carve: '一道屋脊，脊头上一张大嘴，正往肚里吞水', where: '桩子西边、浜底里那一只', x: 9, y: 8 }
  };
  const ORDER = ['qn', 'yz', 'cf', 'pl', 'sn', 'bx', 'ba', 'fx', 'cw'];
  const CREEK = [[1, 6], [5, 7], [9, 8], [13, 9], [17, 10], [20, 11]];
  const FULL = 240, FLOOR = 100;
  const TRACES = ['t_stone', 't_photo', 't_bell'];
  const GLOW = { r: 1, col: 'rgba(150,210,160,.10)' };   // 石兽眼睛里一点幽绿的光：远远看得见在哪
  const traceN = S => TRACES.filter(k => S.f[k]).length;
  let PH = null;   // 喘气的周期（只在主机上推进；检查点里不存，重来时重建）

  const lowDur = S => Math.max(5, 8 - (S.f.rouse || 0) * .8);
  /* kind：null 恢复原样，'S' 渗水（预警），'F' 淹没；big = 连高地一起 */
  function setWater(S, kind, big) {
    for (let y = 2; y < 15; y++) for (let x = 1; x < 21; x++) { const z = zone(x, y); if (z === 'u' || (big && z === 'd')) S.tile(x, y, kind || z, 'pit'); }
  }
  function nearestPlate(x0, y0) {
    let best = [11, 3], bd = 1e9;
    const m = W.maps.pit;
    for (let y = 2; y < 15; y++) for (let x = 1; x < 21; x++) if (zone(x, y) === 'm' && passable(m, x, y, W.pl)) { const d = Math.abs(x - x0) + Math.abs(y - y0); if (d < bd) { bd = d; best = [x, y]; } }
    return best;
  }
  function startRite(S, retry) {
    S.f.rite = true; S.f.wet = 0; S.norun(true);
    setWater(S, null, true); S.amb('drone'); S.hide('shadow');
    PH = { st: 'low', t: 0, dur: retry ? 7 : 9, big: false, grab: false, mu: 0 };
    const left = Math.max(S.f.tLeft || FULL, retry ? FLOOR : 0);
    S.timer(left, '一炷香', incenseOut, { during: true });
  }
  function toWarn(S, big) {
    const n = S.f.warnN = (S.f.warnN || 0) + 1;
    PH.st = 'warn'; PH.t = 0; PH.big = big; PH.dur = big ? 2.8 : n === 1 ? 3.4 : 2.4;
    setWater(S, 'S', big); rumble(S, big ? .085 : .05, PH.dur); bubbles(S, big ? 9 : 5); S.shake(big ? 700 : 400, big ? 2 : 1);
    S.bubble('fashi_p', '!', 1400);
    if (big) S.toast('老法师：它翻身了——快上铁板！高地也要淹！');
    else if (n === 1) S.toast(S.coop ? '老法师：冒泡了——上铁板、上高地！（双人：一个盯水喊，一个念抄本）' : '老法师：冒泡了——上铁板、上高地！');
    else if (n <= 3) S.toast('泥里咕嘟咕嘟冒泡——水要上来了');
  }
  function toFlood(S) {
    PH.st = 'flood'; PH.t = 0; PH.dur = PH.big ? 4.5 : 5;
    setWater(S, 'F', PH.big); S.sfx('splash'); S.amb('river');
    const sh = S.ent('shadow'); S.place('shadow', 1, 6, 2); sh.alpha = .6;
  }
  function toLow(S) {
    PH.st = 'low'; PH.t = 0; PH.big = false; PH.dur = lowDur(S);
    setWater(S, null, true); S.amb('drone'); S.hide('shadow');
    S.tone('sine', 90, 260, 1.4, .045, 0, 500); S.tone('triangle', 60, 140, 1.2, .03, .1, 300);   // 底下那位长长地吸了一口气
    if (S.once('recede')) S.toast('水退了——这一阵，浜底能走');
  }
  function shadowMove(S) {   // 涨水的时候，浑水底下有一条很长的影子顺着老浜游过去
    const sh = S.ent('shadow'), k = clamp(PH.t / PH.dur, 0, 1), f = k * (CREEK.length - 1), i = Math.min(CREEK.length - 2, Math.floor(f)), r = f - i;
    sh.px = Math.round((CREEK[i][0] + (CREEK[i + 1][0] - CREEK[i][0]) * r) * TS); sh.py = Math.round((CREEK[i][1] + (CREEK[i + 1][1] - CREEK[i][1]) * r) * TS);
  }
  function riteTick(S, dt) {
    if (!PH || !S.f.rite || S.f.riteDone || S.map !== 'pit' || W.ended || W.endScreen) return;
    if (PH.grab) return;
    /* 水不等人：对话、插香的时候照样喘气；只是抓脚要等对话合上（站在浜底插香，就得赶在冒泡前插完） */
    PH.t += dt; if (!S.busy) PH.idle = (PH.idle || 0) + dt;
    if (PH.idle > 45 && PH.st === 'low' && !S.busy) { PH.idle = 0; return idleHint(S); }
    /* 老法师的木鱼：平常一秒一下，水要上来时敲得又急又响 */
    PH.mu -= dt; if (PH.mu <= 0 && !S.busy) { PH.mu = PH.st === 'warn' ? .3 : 1.05; muyu(S, 0, PH.st === 'warn' ? .06 : .035); }
    if (PH.st === 'low') { if (PH.t >= PH.dur) toWarn(S, false); }
    else if (PH.st === 'warn') { if (PH.t >= PH.dur) toFlood(S); }
    else if (PH.st === 'flood') {
      shadowMove(S);
      if (!S.busy && tileName(curMap(), S.pl.x, S.pl.y) === 'flood') return grab(S);
      if (PH.t >= PH.dur) toLow(S);
    }
  }
  function idleHint(S) {
    const nx = SONS[ORDER[S.f.k || 0]], n = S.f['idle' + (S.f.k || 0)] = (S.f['idle' + (S.f.k || 0)] || 0) + 1;
    S.run(async S => {
      muyu(S, 0, .06); S.bubble('fashi_p', '…', 1500);
      await S.say('老法师', n === 1 ? '莫慌。下一个是' + nx.ord + '——抄本上找它的名字和脾气，再看石兽脚下刻的东西。' : nx.ord + '叫' + nx.name + '，' + nx.nat + '。脚下刻的东西，跟它的脾气对得上。');
    });
  }
  function grab(S) {
    PH.grab = true;
    S.run(async S => {
      S.sfx('splash'); S.shake(600, 3);
      if (S.f.wet) {
        await S.scare('face', { face: 'longF', spr: '@me', dur: 1.1 });
        PH = null;
        return S.die('浑水一下子没过了头顶。\n脚踝上那只「手」又冷又滑，长满了鳞。\n它没有用力。它只是慢慢地、慢慢地，把你往老浜底下带。', '沉进了老浜底');
      }
      S.f.wet = 1;
      await S.narr('浑水「哗」地漫上来，一下子没到了大腿。\n水底下有什么东西，又冷又滑，缠住了你的脚脖子——');
      S.sfx('heart');
      await S.narr('你死命一挣。一只胶鞋陷在泥里，被拽了下去。\n你光着一只脚，连滚带爬地扑上了铁板。');
      const [px, py] = nearestPlate(S.pl.x, S.pl.y); S.pos(px, py);
      await S.say('老法师', ['水上来的时候，脚底下要么是铁板，要么是高地。', '它只拉一回脚。下一回，就不放了。']);
      if (PH) PH.grab = false;
    });
  }
  async function incenseOut(S) {
    if (!S.f.rite || S.f.riteDone || S.map !== 'pit') return;
    PH = null;
    setWater(S, 'F', true); S.amb('river'); rumble(S, .1, 3); S.shake(1500, 3);
    await S.say('老法师', '……香，灭了。', { style: 'whisper' });
    await S.narr('最后一点香头暗了下去。\n坑底的泥水一下子全翻了上来，连脚下的铁板都在往下沉。');
    await S.scare('red', { sfx: 'thud', dur: .8 });
    await S.die('那一夜，PM109 的基坑里涨满了水。\n天亮以后水退了。坑底的泥上只留着一串脚印，一只穿鞋，一只光脚——\n一直走到桩子跟前，就没了。', '一炷香烧完了');
  }

  /* ---------- 请安 ---------- */
  const beastOn = k => async S => {
    const e = S.ent('b_' + k), s = SONS[k];
    if (e.s.done) return S.narr('石兽跟前插着一炷香，香头一明一暗。\n' + s.name + '，已经请过了。');
    if (S.f.riteDone) return S.narr('泥里露出半截石兽，脚下刻着' + s.carve + '。');
    if (S.once('beastFirst')) await S.narr('泥里露出半截石兽，长满了青苔，只看得出个兽头的模样。\n石头座子上刻着东西——每一只刻的都不一样。');
    let r;
    for (;;) {
      r = await S.ask('这一只脚下刻着' + s.carve + '。', ['插一炷香、洒一把老浜水（请它让一让）', '先翻翻抄本', '先不动它'], '');
      if (r !== 1) break;
      await S.note('jiuzi');
    }
    if (r !== 0) return;
    if (k === ORDER[S.f.k || 0]) return rightOffer(S, k);
    return wrongOffer(S, k);
  };
  async function rightOffer(S, k) {
    const e = S.ent('b_' + k), s = SONS[k];
    e.s.done = true; e.light = { r: 1.3, col: 'rgba(255,150,80,.24)', flick: true, dy: -6 };
    S.f.k = (S.f.k || 0) + 1; qing(S); if (PH) PH.idle = 0;
    await S.narr('你把香插在石兽跟前，从碗里捧起一把老浜水，洒在它头上。\n「' + s.name + '，劳驾，让一让。」');
    if (S.f.k >= 9) return finale(S);
    const nx = SONS[ORDER[S.f.k]];
    muyu(S, 0); muyu(S, .25);
    await S.say('老法师', S.f.k === 1 ? ['好。它认了。', '下一个，' + nx.ord + '。'] : '好。下一个，' + nx.ord + '。');
    S.goal('给九子请安：下一个是' + nx.ord + '（' + S.f.k + '/9）');
    S.f.tLeft = S.timerLeft; S.cp('pit');
  }
  async function wrongOffer(S, k) {
    const n = S.f.wrong = (S.f.wrong || 0) + 1; S.f.rouse = (S.f.rouse || 0) + 1;
    S.sfx('bad'); S.shake(700, 3); S.timerAdd(-12);
    await S.narr('香刚插下去，「噗」地一声灭了。\n石兽底下的泥一鼓一鼓的——坑底下那位，翻了个身。');
    const nx = SONS[ORDER[S.f.k || 0]];
    if (n === 1) await S.say('老法师', ['不对！它不认。', '快上铁板！']);
    else if (n === 2) await S.say('老法师', ['不对！上铁板！', '九子有长幼。' + nx.ord + '叫什么、好什么，抄本上都写着——再对着石兽脚下刻的东西找。']);
    else if (n === 3) await S.say('老法师', ['又错了！上铁板！', nx.ord + '是' + nx.name + '，' + nx.nat + '。找脚下刻着跟它脾气对得上的那一只。']);
    else await S.say('老法师', ['上铁板！', nx.ord + '是' + nx.name + '——' + nx.where + '，脚下刻着' + nx.carve + '。']);
    if (PH) toWarn(S, true);
  }

  /* ---------- 结局 ---------- */
  async function finale(S) {
    S.f.riteDone = true; PH = null; S.clearTimer(); setWater(S, null, true); S.amb('drone'); S.norun(false); S.hide('shadow');
    await S.wait(500);
    await S.narr('第九炷香插下去，坑底一下子静了。\n泥不冒泡了，铁板也不晃了。木鱼声停了。');
    S.focus(11, 9); rumble(S, .05, 3);
    await S.wait(900);
    S.sfx('water'); S.tone('sine', 70, 52, 3.5, .05, 0, 300); S.tone('triangle', 140, 110, 3, .02, .4, 500);
    const h = S.ent('dhead'); h.alpha = 0; await S.alpha('dhead', .92, 1800);
    await S.narr('桩子边上的泥水，慢慢鼓起来一个包。\n包破了，露出一只眼睛——比脸盆还大，金黄金黄的，当中竖着一道细缝。');
    await S.narr('然后是第二只。一对弯弯的角。一把在水里漂着的长须。\n它没有动，就那么看着你，看着桩子，看着坑沿上那一圈白晃晃的探照灯。');
    await S.say('老法师', ['它说，它在这里睡了很多很多年。', '先是一条河。后来河填了，成了马路；庙拆了，九个孩子埋在泥里，替它守着。', '现在，你们又要在它头顶上，压一根四层桥面的柱子。', '它问你：拿什么还它？']);
    for (;;) {
      const r = await S.ask('它在等你回答。', ['「给它重新修一座龙王庙。」', '「把它刻在柱子上——让它天天看着这条路。」', '「……工程等不起。我们什么也给不了。」'], '');
      if (r === 0) { await S.say('老法师', ['……庙？', '上一座庙，就是拆了，才把它们埋到这底下来的。', '这里要过高架。庙修起来，过些年，还是要拆。']); continue; }
      if (r === 2) return debtEnd(S);
      return pillarEnd(S);
    }
  }
  async function pillarEnd(S) {
    await S.say('老法师', ['……它说，好。', '它要看得见这条路。路上的车，路上的人，一年一年的。', '只要还有人看得见它，它就不算被埋了。']);
    await S.narr('那双金黄的眼睛慢慢合上了。\n水面上起了一圈涟漪，又一圈，然后什么都没有了。');
    await S.alpha('dhead', 0, 1600); S.focus(null);
    await S.fade(1, 1200);
    await S.card('凌晨四点', 'PM109', '老卞把手搭在操纵杆上，看了你一眼。\n你点了点头。');
    hammer(S, .08); S.shake(400, 2); await S.wait(700); hammer(S, .07); await S.wait(700); hammer(S, .07);
    await S.say('小沈', ['……三十二米。', '三十五。四十……', '它在往下走！它真的在往下走！']);
    await S.say('老卞', '……谢谢侬了。', { style: 'whisper' });
    const n = traceN(S);
    const tail = n >= TRACES.length
      ? '\n\n后来，阿婆搬走的时候，把那块刻着水波的门槛石带走了。\n那张龙王庙的老照片，你送去了静水庵，挂在那口铜钟旁边。'
      : '';
    await S.end({ id: 'pillar', title: '第十七夜　完', text: '一九九五年冬天，南北高架通车了。\n延安路口正当中那根柱子，比别的都粗，外面包了一层龙。\n有人数过，说是九条；也有人说，远不止九条。\n设计的人说，那是为了好看。你没跟任何人提起过那一夜。' + tail + '\n\n第二年春天，你去静水庵，小沙弥说老法师回乡下了。\n弄堂里有人传，说他「泄了天机」。你不信。\n\n只是每回开车从柱子底下过，你都会松一松油门。\n（这一夜，你找到了龙王庙留下的 ' + n + '/' + TRACES.length + ' 样东西）' });
  }
  async function debtEnd(S) {
    await S.say('老法师', '……', { style: 'whisper' });
    await S.narr('那双金黄的眼睛看了你很久。\n然后，一点声音也没有，沉下去了。');
    await S.alpha('dhead', 0, 1200); S.focus(null);
    await S.fade(1, 1200);
    hammer(S, .08); S.shake(500, 3); await S.wait(900);
    await S.narr('凌晨四点，第一锤下去，桩就走了。\n走到六十米的时候，地底下传来很闷、很长的一声——「咔」。\n像什么东西，断了。');
    await S.end({ bad: true, id: 'debt', title: '什么也没还', text: '桩打下去了。高架如期通车。\n那年冬天，弄堂里那口从来不干的老井，干了。\n\n阿婆搬家那天跟你说，她外公讲过：\n龙王没了窝，就去找记得它的人。\n\n从那以后，你天天夜里梦见水。\n梦里有一道很长很长的影子，在你床底下，慢慢地，翻了个身。' });
  }
  async function digEnd(S) {
    S.f.digging = true;
    await S.narr('你爬进驾驶室，拧了钥匙。\n柴油机「轰」地一声，排气管喷出一股黑烟。');
    S.sfx('car'); S.focus(21, 8);
    await S.say('老法师', '使不得——！');
    await S.narr('抓斗张开嘴，探进基坑，「哐」地咬进泥里。\n你往上一提——斗子里全是黑泥，黑泥里裹着半截石头兽头，青苔底下两只眼睛瞪着你。');
    rumble(S, .1, 3); S.shake(1800, 3); bubbles(S, 12, .05);
    await S.narr('坑底「咕嘟」一声。\n水从抓斗咬出来的那个洞里往上喷，又腥又冷，一下子漫过了钢板桩。\n水里有东西在动——很长，很长，比整个基坑还长。');
    await S.scare('face', { face: 'longF', spr: '@me', dur: 1.2 });
    await S.fade(1, 1000);
    await S.end({ bad: true, id: 'dig', title: '擅自开挖', text: '第二天早上，PM109 的基坑灌满了水。\n他们说，是挖穿了老河浜底下的暗流。\n\n你被人从驾驶室里拖出来的时候，嘴里全是泥。\n你一直说，你在水底下看见了一只眼睛，比抓斗还大。没有人信。\n\n后来柱子还是立起来了，换了打法，多打了好几根桩。\n可每到下雨天，你总觉得脚底下的地，在一起一伏地喘气。' });
  }

  /* ================= 工地 · 第一夜 ================= */
  async function nightOne(S) {
    await S.narr('凌晨一点。\n探照灯把工地照得惨白。围挡外面，延安路上偶尔开过一辆夜班车，车灯在铁皮上一晃就没了。');
    S.focus(20, 7);
    await S.say('老卞', '最后一锤！都站开——');
    await S.wait(400);
    hammer(S); S.shake(450, 2); await S.wait(900);
    hammer(S, .09); S.shake(600, 3); await S.wait(500);
    S.tone('triangle', 220, 330, .9, .04, 0, 1400);
    await S.narr('八吨重的锤头砸在钢管桩上。\n「咚」——桩往下一沉，又「嗡」地一声弹了回来，震得人牙根发酸。');
    bubbles(S, 7); S.ent('pitview').red = true;
    await S.narr('钢管口里往外冒水。不是清水，是红褐色的泥浆，\n一股一股往外涌，像底下有谁在喘气。');
    await S.say('小沈', '……三十一米二。跟上个月一样，一公分都没下去。');
    await S.say('王经理', '十个月了！市里天天打电话问我 PM109，我拿什么跟人家讲？');
    await S.wait(500);
    knock(S, 0); knock(S, .6); knock(S, 1.2);
    await S.wait(1500);
    await S.narr('就在这时候——钢管里传出来三声：「当。当。当。」\n像是有人在桩子里头，屈起手指，敲了敲铁皮。');
    S.focus(null);
    await S.say('老卞', '……收工。今朝不打了。小顾，侬去坑边看一眼管口。');
    S.sfx('step');
    await S.walk('bian', [9, 12], 3.2); S.face('bian', 2);
    S.place('shen', 4, 3, 0);
    S.goal('去基坑边看看那根桩（打桩机东边）');
  }
  async function pitLook(S) {
    if (S.f.night2) return S.narr('基坑底下黑沉沉的。钢管桩的管口，像一只张着的嘴。');
    if (S.f.sawPile) return S.narr(cycle(S, '_pl', ['管口里的泥浆不冒了，只剩一汪浑水，一动不动。', '你又照了一下。浑水里只有你自己的影子。……大概吧。']));
    S.f.sawPile = true;
    await S.narr('你趴在坑沿上，把手电往下照。\n基坑有三层楼深，四壁是锈红的钢板桩。坑底一汪泥水，正当中戳着那根钢管桩，管口比脸盆还大。');
    await S.narr('泥浆已经不冒了。管子里一汪浑水，手电光照下去，什么也看不见。\n你往前探了探身子——');
    S.sfx('heart'); await S.wait(700);
    await S.narr('浑水里，有什么东西，慢慢睁开了。');
    await S.scare('face', { face: 'longF', spr: '@me', dur: 1 });
    await S.narr('你往后一仰，一屁股坐在地上，手电滚出去老远。\n等你哆哆嗦嗦捡回手电再照——管子里只有一汪浑水。');
    await S.think('……是看花眼了。\n一定是看花眼了。可那是一只眼睛。金黄的，当中竖着一道缝。');
    S.goal('跟老卞说说（火桶边上）');
    S.toast('小沈和王经理也在，可以问问');
  }
  async function bianOn(S) {
    S.face('bian', 'pl');
    if (S.f.night2) return S.say('老卞', cycle(S, '_b2', ['法师在梯子边上等侬。下去当心，脚底下踩实了。', '王经理那边我盯着，四点钟以前，抓斗不会动。', '……我老娘要是还在，看见今朝这个场面，要笑我的。']));
    if (S.f.talkBian) return S.say('老卞', cycle(S, '_b1', ['天亮了去弄堂里寻阿婆，就讲是我叫侬去的。', '回去困一觉。眼睛都红了。']));
    if (!S.f.sawPile) return S.say('老卞', '先去坑边看看管口，看好了来寻我。');
    S.f.talkBian = true;
    await S.say('老卞', ['……看见啥了？', '……侬不用讲。我看侬面色就晓得。']);
    await S.narr('老卞往火桶里扔了一块木头，火星子「噼啪」窜上去，又落下来。');
    await S.say('老卞', ['我老娘活着的辰光讲过，延安路底下，老早是一条浜。', '民国初年填掉的。填浜的辰光，拆过一座小庙，叫龙王庙。', '庙门口有九只石头兽，大得很，搬不动，就跟庙基一道埋到泥里去了。', '我在这块地皮上打了十个月桩……三十一米，不多不少，回回在同一个地方弹回来。']);
    await S.say('老卞', ['弄堂里还有个阿婆没搬，她外公当年就是看龙王庙的。', '明朝一早，侬去问问她。', '……这种事体，我一个班长，不好开口的。侬年纪轻，人家不笑侬。']);
    S.goal('天亮后去西边弄堂找阿婆（工地西头）');
  }
  async function shenOn(S) {
    S.face('shen', 'pl');
    if (S.f.night2) return S.say('小沈', cycle(S, '_s2', ['我学了四年结构力学。……今天晚上我什么也不说，我就看着。', '法师说，水上来要站铁板。你记住了吧？', '要是真成了，我回去怎么写报告啊……']));
    if (S.f.talkShen) return S.say('小沈', cycle(S, '_s1', ['日志在桌上，你要看自己看。', '那三声……肯定是钢管热胀冷缩。肯定是。']));
    S.f.talkShen = true;
    await S.say('小沈', ['你也听见了吧？那三声。', '……我跟你讲讲技术上的事，你听完就不怕了。']);
    await S.say('小沈', ['这根墩子要扛四层桥面，柱子五米粗，底下要打一大群桩，挤在一个八角形的承台里头。', '桩排得太密，土挤不开，这是一条。', '还有，三十米往下，钻出来的芯子里有烂木桩、碎砖头，还有条石——老石头，上面有凿过的印子。底下原来有老房子的地基。', '所以打不下去，是正常的。……是正常的。']);
    await S.say('小沈', '可那些条石上凿的，不像是墙脚。像是……兽爪子。');
    S.goal(S.f.talkBian ? '天亮后去西边弄堂找阿婆（工地西头）' : '跟老卞说说（火桶边上）');
  }
  async function wangOn(S) {
    S.face('wang', 'pl');
    if (S.f.night2) return wangNight2(S);
    if (S.f.talkWang) return S.say('王经理', cycle(S, '_w1', ['还站着干嘛？回去睡觉！明天上午设计院来人开会。', '我不管什么龙不龙的，我只管工期！']));
    S.f.talkWang = true;
    await S.say('王经理', ['小顾是吧？你也看见了。十个月，三十一米，钱一车一车地往坑里倒。', '设计院说加桩、说换锤，换了，没用。', '我跟你讲，再打不下去，我就叫一台抓斗来，把底下挖开，看看到底是什么东西在捣乱！']);
    await S.narr('他点了一根烟，手抖了两下才点着。');
    await S.say('王经理', '……刚才那三声，你别出去乱讲。听见没有？');
  }

  /* ================= 工地 · 第二夜 ================= */
  async function nightTwo(S) {
    S.dark(.84);
    S.show('digger'); S.place('wang', 23, 13, 1); S.place('fashi_s', 22, 4, 0); S.place('bian', 9, 12, 2); S.place('shen', 5, 8, 2);
    S.ent('pitview').red = false;
    await S.narr('工地上的人都散了，只剩老卞、小沈和王经理。\n探照灯底下，人影拉得老长。');
    S.focus(21, 12);
    await S.narr('基坑南边，多了一台履带抓斗。黄漆，大铁爪子，在探照灯底下亮得刺眼。');
    S.focus(22, 5);
    await S.narr('老法师已经到了。他站在基坑北边的梯子旁边，手里捻着念珠，望着坑底，一句话也没说。');
    S.focus(null);
    S.goal('先跟抓斗旁的王经理打个招呼');
  }
  async function wangNight2(S) {
    if (S.f.wangOK) return S.say('王经理', cycle(S, '_w2', ['四点！四点钟桩还下不去，抓斗就开进去。', '……你下去当心点。我是说，别摔着。工伤要算我的。']));
    await S.say('王经理', ['你们搞什么名堂？还请个和尚来？', '我跟你讲，抓斗我已经叫来了。钥匙在这儿。', '你是机修班的，你会开。你现在就上去，给我挖开看看！']);
    const r = await S.ask('王经理把钥匙塞到你手里。', ['「等法师做完。四点钟之前，桩不下去，我自己来挖。」', '「……行，我来挖。」'], '王经理');
    if (r === 1) return digEnd(S);
    S.f.wangOK = true;
    await S.say('王经理', ['……你们一个两个都疯了。', '好！四点钟。四点钟桩还下不去，抓斗就开进去，谁也别拦着！']);
    S.goal('下基坑（北边的梯子，老法师在那儿）');
  }
  async function diggerOn(S) {
    if (!S.f.night2) return;
    const r = await S.ask('履带抓斗。驾驶室的门没锁，钥匙就在你兜里。', ['爬上去，开挖', '算了'], '');
    if (r === 0) return digEnd(S);
  }
  async function ladderOn(S) {
    if (!S.f.night2) return S.narr(S.f.sawPile ? '下坑的铁梯子用铁链锁着。\n老卞说过，夜里谁也不许一个人下去。' : '下坑的铁梯子，用一根铁链锁着。');
    if (!S.f.wangOK) return S.narr('王经理在抓斗那边瞪着你。\n……先去跟他打个招呼。');
    if (S.f.riteDone) return S.narr('坑底下静悄悄的。');
    await S.go('pit', 11, 3, 0);
  }
  async function fashiSiteOn(S) {
    S.face('fashi_s', 'pl');
    if (!S.f.wangOK) return S.say('老法师', '那位施主，好像有话要同你讲。');
    await S.say('老法师', '香和水都带了？……走吧。');
    await ladderOn(S);
  }
  async function siteExit(S) {
    if (S.f.night2) { S.pos(1, 12, 2); return S.narr('今晚走不得。法师还在坑边上等着。'); }
    if (!S.f.talkBian) { S.pos(1, 12, 2); return S.narr(S.f.sawPile ? '还没下班呢。老卞在火桶边上看着你。' : '还没收工。老卞叫你去坑边看看管口。'); }
    await S.fade(1, 600);
    await S.card('第二天', '上午十点', '你回宿舍躺了三个钟头，一闭眼就是那只眼睛。\n\n天亮以后，你往西走了两条马路，\n拐进了那条拆了一半的弄堂。');
    S.f.day = true;
    await S.go('lane', 26, 8, 1);
  }

  /* ================= 弄堂 ================= */
  async function apoOn(S) {
    S.face('apo', 'pl');
    if (S.f.fashi && !S.has('water')) return S.say('阿婆', '水要吊井里的。吊桶挂在井栏上，侬自家吊。');
    if (S.has('water')) return S.say('阿婆', cycle(S, '_a2', ['去吧。替我外公跟九个小囡讲一声：阿拉还记得伊拉。', '夜里冷，多穿一件。']));
    if (S.f.apo) return S.say('阿婆', cycle(S, '_a1', S.f.archive ? ['静水庵出了弄堂口往西，两幢新楼当中夹着的那座小庙。', '老法师眼睛不好了，地图要拿给他看。', '……替我跟他讲一声，阿婆还记得他小辰光偷龙王庙的供果。'] : ['动迁组的房间在弄堂西头，门没锁。柜子里有老地图。', '庙在哪块，地图上画着的。']));
    await S.say('阿婆', '小伙子，又是来劝我搬的？……工地上的？老卞叫侬来的？');
    await S.narr('阿婆眯起眼睛看了你半天，把收音机关了。');
    await S.say('阿婆', ['龙王庙啊。我外公就是看庙的。\n庙在浜边上，门口一排九只石兽——那是龙王的九个儿子。龙生九子，各有各的脾气。', '后来填浜修马路，庙拆了。九只石兽太重，搬不动，就地挖个坑，埋了。', '外公到死都在念叨：「九个小囡埋在泥里，替伊拉阿爸守着门。啥人要去吵它，先要跟九个小囡打招呼。」', '他还讲：庙拆了不怕，就怕没人记得。']);
    await S.say('阿婆', ['庙原来在哪块，动迁组的柜子里有张老地图，侬自家去翻。', '庙里的事体，静水庵的老法师比我清楚，他小辰光就住在庙隔壁。侬拿着地图去寻他。']);
    S.f.apo = true;
    S.goal('去动迁办翻老地图（弄堂西头的屋子）');
  }
  async function archiveOn(S) {
    if (S.f.archive) return S.note('map');
    await S.narr('一只绿漆铁皮柜，抽屉上贴着手写的标签：「户籍」「协议」「补偿」……\n最底下一层写着：「地块沿革」。');
    S.sfx('open');
    await S.note('map');
    S.f.archive = true;
    await S.think('红线拐弯的地方……正好是 PM109。\n龙王庙，就在那根桩底下。');
    S.goal('拿地图去静水庵找老法师（弄堂西口）');
  }
  async function wellOn(S) {
    if (S.has('water') || S.f.night2) return S.narr('井栏是一整块青石凿的，被井绳磨出了一道道深槽。\n井里的水离井口很近，黑幽幽的，映着一小块天。');
    if (!S.f.fashi) return S.narr('一口老井。井栏是一整块青石凿的，被井绳磨出了一道道深槽。\n阿婆说，这口井从来没干过——大旱那年，整条弄堂都靠它。');
    const r = await S.ask('吊一桶老浜水上来？', ['吊', '等一下'], '');
    if (r !== 0) return;
    S.sfx('water');
    await S.narr('你把吊桶放下去，绳子刚放了两三米就沉了。\n提上来一看，水清得发亮，凉得扎手——闻起来，有一股淡淡的河泥味。');
    S.give('water');
    await S.say('阿婆', ['这是浜底下渗上来的水。外公讲，填浜填得掉河，填不掉水。', '……去吧。']);
    S.goal('带着水回工地（弄堂东口）');
  }
  async function laneEast(S) {
    if (!S.f.fashi) { S.pos(26, 8, 1); return S.narr(S.f.apo ? '回工地？白天停工，大门锁着。\n……龙王庙的事还没问清楚。' : '工地在东边。白天停工，大门锁着。'); }
    if (!S.has('water')) { S.pos(26, 8, 1); return S.narr('法师要的那碗老浜水，还没打。\n弄堂当中那口老井。'); }
    await S.fade(1, 600);
    await S.card('当天夜里', '十一点　PM109', '九炷香揣在怀里，一碗老浜水用塑料袋扎着口。\n老法师说，子时动手。');
    S.f.night2 = true;
    await S.go('site', 1, 12, 2);
  }
  async function laneWest(S) {
    if (!S.f.apo) { S.pos(1, 8, 2); return S.narr('弄堂口通到大马路上。\n……先跟阿婆打听打听。'); }
    if (!S.f.archive) { S.pos(1, 8, 2); return S.narr('阿婆说，动迁组的柜子里有张老地图。\n拿上地图再去找法师。'); }
    if (S.once('toTemple')) await S.narr('出了弄堂口往西，两幢新盖的高楼中间，夹着一座小小的庵堂。\n门楣上写着三个字：「静水庵」。');
    await S.go('temple', 9, 11, 3);
  }

  /* ================= 静水庵 ================= */
  async function fashiOn(S) {
    S.face('fashi', 'pl');
    if (S.f.fashi) return S.say('老法师', S.has('water') ? '水打好了？那就去吧。今晚子时，我在坑边上等你。' : cycle(S, '_f1', ['老浜水在阿婆家门口那口井里。', '抄本你收好。九个孩子，从老大请到老九。', '水上来的时候，站铁板，站高地。']));
    await S.narr('老法师坐在蒲团上敲木鱼，听见脚步声也没抬头。');
    await S.say('老法师', '工地上的？……PM109 吧。这半年，来问的人不止你一个。');
    await S.narr('你把老卞的话、阿婆的话、那三声敲击和管子里的那只眼睛，一样一样讲了。\n又把那张晒图摊开在他面前。');
    S.bubble('fashi', '…', 2000);
    await S.say('老法师', ['……九只石兽。我八岁那年，看着他们拆的庙。泥一锹一锹盖上去，最后露出来的，是老九的嘴。', '底下那位不是恶东西。它就是那条浜。\n浜填了，庙拆了，就再没人记得它了。九个孩子守着它——你们的桩，一锤一锤，砸在孩子们头上。', '要它让，不能硬打。得从老大到老九，一个一个打招呼。']);
    S.f.fashi = true;
    await S.say('老法师', '这是庵里的抄本。九子的名字、排行、脾气，都在上头。');
    await S.note('jiuzi');
    S.give('xiang');
    await S.say('老法师', ['九炷香，一位一炷。还要一碗老浜水——阿婆家门口那口井，是浜底下渗上来的水。', '规矩我讲，你记着。']);
    await S.note('rules');
    await S.say('老法师', '今晚子时，我在坑边上等你。');
    S.goal('去弄堂老井打一碗水，再回工地');
  }
  async function bellOn(S) {
    S.f.t_bell = true;
    await S.narr('一口青铜钟，挂在木头钟架上。钟顶的钮铸成一只蜷着身子的小兽，张着嘴，像在叫。');
    if (S.once('bellTale')) await S.narr('钟身上铸着一行字，大半被铜绿盖住了，只认得出几个：「……龙王庙……光绪……」\n——这口钟，原来是龙王庙的。');
    const r = await S.ask('撞一下钟？', ['轻轻撞一下', '算了'], '');
    if (r !== 0) return;
    bigBell(S); S.shake(300, 1);
    await S.narr('「咚——」\n钟声又沉又长，在两幢高楼中间撞来撞去，过了好久才散。');
    if (S.once('bellFashi')) await S.say('老法师', '蒲牢好鸣。钟钮上铸的就是它，一敲，它就叫。');
  }


  /* ---------- 九子脚下刻的东西（石兽座子上的小浮雕，8×6 左右） ---------- */
  function carveIcon(R, k, x, y, c) {
    const d = shade(c, -.35);
    if (k === 'qn') { R(x + 3, y - 1, 1, 7, c); R(x + 1, y + 4, 5, 3, c); R(x + 2, y + 5, 3, 1, d); R(x + 2, y - 1, 3, 1, c); }   // 胡琴
    else if (k === 'yz') { R(x, y + 5, 3, 2, d); for (let i = 0; i < 5; i++) R(x + 2 + i, y + 4 - i, 2, 1, c); }   // 刀
    else if (k === 'cf') { R(x, y + 5, 7, 2, c); R(x + 6, y + 3, 2, 2, c); R(x + 7, y + 1, 1, 2, c); R(x + 1, y + 4, 5, 1, d); }   // 飞檐
    else if (k === 'pl') { R(x + 3, y - 1, 2, 2, c); R(x + 2, y + 1, 4, 4, c); R(x + 1, y + 4, 6, 2, c); R(x + 3, y + 6, 2, 1, d); }   // 钟
    else if (k === 'sn') { R(x + 1, y + 2, 6, 3, c); R(x + 2, y + 1, 4, 1, c); R(x + 1, y + 5, 1, 2, c); R(x + 6, y + 5, 1, 2, c); R(x + 4, y - 2, 1, 2, d); R(x + 3, y - 3, 1, 1, d); }   // 香炉
    else if (k === 'bx') { R(x + 2, y - 2, 4, 6, c); R(x + 3, y - 1, 2, 1, d); R(x, y + 4, 8, 3, d); R(x + 7, y + 4, 1, 1, c); }   // 驮碑
    else if (k === 'ba') { R(x, y - 1, 7, 8, d); for (let i = 1; i < 7; i += 2) R(x + i, y, 1, 6, c); R(x + 2, y + 2, 3, 2, c); }   // 牢门
    else if (k === 'fx') { R(x, y + 1, 3, 5, c); R(x + 4, y + 1, 3, 5, c); R(x + 3, y + 1, 1, 5, d); for (let i = 2; i < 6; i += 2) { R(x + 1, y + i, 1, 1, d); R(x + 5, y + i, 1, 1, d); } }   // 书
    else if (k === 'cw') { R(x, y + 3, 6, 2, c); R(x + 5, y + 1, 3, 3, c); R(x + 6, y + 2, 2, 1, d); R(x + 1, y + 6, 2, 1, '#6a8a9a'); R(x + 4, y + 6, 2, 1, '#6a8a9a'); }   // 屋脊吞水
  }

  defChapter({
    id: 'longzhu', n: 17, title: '延安高架龙柱', sub: '上海延安路口那根盘龙的柱子，据说当年桩怎么也打不下去。', origin: '上海都市传说', color: '#3a3226',
    amb: 'wind', floor: 'concrete', wall: 'metal', dark: .82, plr: 3.2,
    endings: { pillar: '第十七夜　完（龙柱）', dig: '擅自开挖', debt: '什么也没还' },
    /* 测试用：读写喘气周期 */
    dbg: { ph: () => PH, calm: () => { if (PH) { PH.st = 'low'; PH.t = 0; PH.dur = 999; setWater(SAPI, null, true); } } },
    thumb(g, w, h) {   // 高架桥面压在一根粗柱子上，柱子上盘着一条金色的龙
      const R = (x, y, ww, hh, c) => { g.fillStyle = c; g.fillRect(x, y, ww, hh); };
      const cx = (w / 2) | 0;
      R(0, 12, w, 9, '#4a4a4c'); R(0, 12, w, 2, '#6a6a6c'); R(0, 21, w, 2, '#2a2a2c');
      R(0, 6, w, 4, '#3a3a3c'); R(0, 6, w, 1, '#58585a');
      R(cx - 14, 23, 28, h - 45, '#6e6c66'); R(cx - 14, 23, 4, h - 45, '#86847c'); R(cx + 10, 23, 4, h - 45, '#4e4c48');
      R(cx - 20, 21, 40, 4, '#5a5854');
      const G = '#d8a838', G2 = '#8a6418';
      for (let i = 0; i < 9; i++) { const y = 28 + i * 9, x = cx - 14 + ((i % 2) ? 14 : 0); R(x, y, 14, 4, G); R(x, y + 4, 14, 1, G2); }
      R(cx + 6, 24, 9, 7, G); R(cx + 12, 22, 2, 3, G); R(cx + 8, 22, 2, 3, G); R(cx + 13, 27, 1, 1, '#2a1a08'); R(cx + 14, 30, 6, 1, G); R(cx + 15, 32, 5, 1, G2);
      R(cx - 15, 70, 3, 3, '#e8d8a0'); R(cx + 13, 52, 2, 2, '#e8d8a0');
      for (let i = 0; i < 5; i++) R(6 + i * 9, h - 26, 5, 2, 'rgba(255,220,140,.35)');
    },
    /* 惊吓大头像：浑水里抬起来的龙头。金黄的竖瞳、鹿一样的角、长须、慢慢张开的嘴 */
    faces: {
      longF(R, a) {
        const SC = '#1c3a34', SC2 = '#2a5048', SC3 = '#10241f', HN = '#c8b070', HN2 = '#8a7440', EY = '#f0b020', WH = '#d8c890', K = '#050806';
        // 角
        R(4, 0, 2, 7, HN); R(2, 1, 2, 2, HN); R(6, 2, 2, 1, HN); R(26, 0, 2, 7, HN); R(28, 1, 2, 2, HN); R(24, 2, 2, 1, HN); R(5, 0, 1, 6, HN2); R(26, 0, 1, 6, HN2);
        // 鬃
        R(1, 8, 3, 14, '#2e4a30'); R(28, 8, 3, 14, '#2e4a30'); R(0, 12, 2, 6, '#22381f'); R(30, 12, 2, 6, '#22381f');
        // 头
        R(6, 5, 20, 4, SC); R(4, 8, 24, 14, SC); R(6, 22, 20, 6, SC); R(8, 28, 16, 4, SC);
        for (let i = 0; i < 6; i++) for (let j = 0; j < 4; j++) R(6 + i * 4 + (j % 2) * 2, 7 + j * 3, 2, 1, SC2);
        R(12, 6, 8, 2, SC3); R(15, 8, 2, 6, SC3);
        // 眉骨
        R(6, 10, 8, 2, SC3); R(18, 10, 8, 2, SC3);
        // 眼睛：金黄，竖着一道细缝；a 越大越亮
        const ey = a > .2 ? EY : '#a07010';
        R(7, 12, 6, 4, ey); R(8, 11, 4, 1, ey); R(8, 16, 4, 1, ey); R(19, 12, 6, 4, ey); R(20, 11, 4, 1, ey); R(20, 16, 4, 1, ey);
        R(10, 11, 1, 6, K); R(22, 11, 1, 6, K); R(8, 12, 1, 1, '#fff4c0'); R(20, 12, 1, 1, '#fff4c0');
        // 吻部和鼻孔
        R(9, 20, 14, 4, SC2); R(11, 21, 2, 2, K); R(19, 21, 2, 2, K);
        // 嘴：慢慢张开，露出獠牙
        const mh = Math.round(a * 5);
        R(8, 25, 16, 1, SC3);
        if (mh > 0) { R(9, 26, 14, mh, '#3a0a0c'); R(10, 26, 1, 2, WH); R(21, 26, 1, 2, WH); R(13, 26, 1, 1, WH); R(18, 26, 1, 1, WH); R(10, 25 + mh, 1, 1, WH); R(21, 25 + mh, 1, 1, WH); }
        // 长须
        for (let i = 0; i < 8; i++) { R(8 - i, 22 + i, 1, 1, WH); R(23 + i, 22 + i, 1, 1, WH); }
        R(1, 29, 1, 3, WH); R(30, 29, 1, 3, WH);
        // 往下淌的泥水
        R(7, 28, 1, 3, 'rgba(120,90,60,.8)'); R(24, 27, 1, 4, 'rgba(120,90,60,.8)'); R(15, 31, 2, 1, 'rgba(120,90,60,.8)');
      }
    },
    people: {
      me: { key: 'lz-me', skin: '#e8bf98', hair: '#1a1612', hs: 'short', top: '#2e4a78', top2: '#22385c', bottom: '#2a3a5c', shoes: '#2a2a2a', extra: helmet('#e2bc22') },
      bian: { key: 'lz-bian', skin: '#c89a74', hair: '#8a8680', hs: 'short', top: '#4a5232', top2: '#3a4026', coat: true, bottom: '#2a2a2a', shoes: '#1a1a1a',
        extra(g, d, fr, G, R) { helmet('#c8402a')(g, d, fr, G, R); if (d === 0) R(5, G.hT + 7, 6, 1, '#9a8a7a'); } },
      shen: { key: 'lz-shen', skin: '#f0cca8', hair: '#1a1414', hs: 'bob', top: '#5a6a80', top2: '#e8e8e0', bottom: '#3a3a48', shoes: '#2a2420',
        extra(g, d, fr, G, R) { helmet('#e8e8e4')(g, d, fr, G, R); if (d === 0) { R(5, G.hT + 4, 2, 1, '#222'); R(9, G.hT + 4, 2, 1, '#222'); R(7, G.hT + 4, 2, 1, '#555'); R(11, G.tT + 2, 2, 5, '#d8d0b8'); } } },
      wang: { key: 'lz-wang', skin: '#e0b48e', hair: '#141210', hs: 'short', top: '#5a3a24', top2: '#3a2414', bottom: '#2a2a30', shoes: '#111',
        extra(g, d, fr, G, R) { if (d === 0) { R(4, G.tT + 3, 8, 3, '#6a4630'); R(7, G.tT, 2, 6, '#e8e4dc'); R(7, G.tT + 1, 2, 4, '#8a2a2a'); } else if (d === 1) R(3, G.tT + 3, 3, 3, '#6a4630'); } },
      apo: { key: 'lz-apo', skin: '#e2c0a0', hair: '#d8d4cc', hs: 'bun', top: '#3a3a4a', top2: '#2a2a38', bottom: '#2a2a2a', shoes: '#1a1a1a',
        extra(g, d, fr, G, R) { if (d === 0) { R(5, G.hT + 6, 1, 1, '#b89a80'); R(10, G.hT + 6, 1, 1, '#b89a80'); R(4, G.tT + 2, 8, 4, '#5a4a6a'); } } },
      fashi: { key: 'lz-fashi', skin: '#d8b490', hair: '#c8a888', hs: 'bald', top: '#6a6252', top2: '#4a4434', robe: true, shoes: '#2a2a2a',
        extra(g, d, fr, G, R) { if (d === 0) { R(5, G.hT + 3, 2, 1, '#e8e4dc'); R(9, G.hT + 3, 2, 1, '#e8e4dc'); for (let i = 0; i < 5; i++) R(5 + i, G.tT + 1 + (i % 2), 1, 1, '#5a2a1a'); R(7, G.tT + 3, 2, 3, '#a8402a'); } } }
    },
    items: {
      torch: { name: '手电筒', desc: '工地发的长手电，三节一号电池，光圈发黄。' },
      xiang: { name: '九炷香', desc: '老法师给的九炷香，拿红纸包着。一位一炷。' },
      water: { name: '一碗老浜水', desc: '弄堂老井里吊上来的水，凉得扎手，有一股淡淡的河泥味。' }
    },
    notes: {
      log: { title: 'PM109 打桩日志', text: '南北高架　PM109 墩　桩基施工日志（摘抄）\n\n二月　首根钢管桩打至 31.2 米，贯入度为零，锤击回弹。\n四月　换大吨位桩锤，仍止于 31 米上下。\n六月　钻孔取芯：30 米以下见朽木桩、碎砖、条石。条石有凿痕，疑为旧建筑基础。\n八月　夜班反映：锤击后管内冒水，水色赭红。取样送检，结论：铁锈、泥沙。\n十月　设计院意见：单柱承四层桥面，桩群过密，土体挤不开。研究对策中。\n十一月　夜班多人反映管内有敲击声，每次三下。\n\n（最后一行被人用钢笔划掉了，可还认得出来。）' },
      map: { title: '动迁组的老地图', text: '（一张折了又折的晒图纸，红笔描着一条弯弯曲曲的线。旁边夹着一页手写的说明。）\n\n本地块沿革　（动迁组整理，一九九三年）\n一、清末，此处为河浜。浜上有木桥，桥南小庙一座，俗称「龙王庙」，庙门前列石兽九只。\n二、民国三年起填浜筑路，庙随之拆除。石兽「搬运不动，就地掩埋」。\n三、此后陆续建起住宅，即今××里。\n四、按市政规划，本地块用于南北高架建设，居民动迁。\n\n红线是当年河浜的走向。\n红线拐弯的地方画着一个小方框，写着「庙」。\n小方框，正好压在晒图上标着「PM109」的那个圆圈上。' },
      jiuzi: { title: '九子抄本', text: '（静水庵的手抄本，纸页发黄，边角让虫蛀了。原文是「长曰囚牛，次曰睚眦……」，老法师在每一行旁边注了排行。）\n\n龙生九子，不成龙，各有所好：\n老大　囚牛　　好音律\n老二　睚眦　　好杀\n老三　嘲风　　好险\n老四　蒲牢　　好鸣\n老五　狻猊　　好烟火，好坐\n老六　赑屃　　好负重（又名霸下）\n老七　狴犴　　好讼\n老八　负屃　　好文\n老九　螭吻　　好吞水，好望\n\n（页边一行小字：九子名目，各家说法不一，此依庵中旧本。龙王庙前九兽，亦按此排行。）' },
      rules: { title: '法事的规矩', text: '（老法师口述，你记在烟盒纸背面。）\n\n一、九子有长幼，从老大请到老九。请错了，它们会恼，底下那位就要翻身。\n二、请一位：一炷香，一把老浜水。香插在它跟前，水洒在它头上。\n三、底下那位在喘气。泥里冒泡、木鱼敲急，水就要上来——脚底下要么是铁板，要么是高地。老浜底那一溜最低，回回先淹。它翻身的时候，连高地也淹，只有铁板靠得住。\n四、法师那炷长香烧完之前，九位要请完。\n五、请完了，它会出来。它问什么，照实答。\n\n（两个人下去的话：一个翻抄本念，一个盯着水走。）' }
    },
    legend: '【真实背景】延安高架路与南北高架路在上海市中心的延安路—成都北路交会处相交，形成一座多层的大型立交。立交正当中有一根特别粗的立柱，外面包着一层金属浮雕，盘龙环绕，人称「龙柱」，是上海高架路上唯一一根加了装饰的柱子。南北高架于1993年下半年开工、1995年底通车；按公开报道，这根柱子直径约5米、高约32米，要托起几层桥面，底下的桩长达六十多米。\n\n【流传的说法】关于它，上海流传着一个家喻户晓的说法：当年这里的桩怎么也打不下去，打下去又弹上来。后来请来一位高僧，高僧说此处是「龙脉」所在，地下有龙（也有说是龙穴、龙头），要动工须先安抚。法事之后桩果然顺利打下，柱子外面便包上了九条龙，算是给龙的交代。更进一步的版本还说，高僧泄露了天机，不久便圆寂了。这个故事九十年代就已口耳相传，2000年代以后又在网络论坛上被反复转帖，细节越传越多。\n\n【有出处的说法】参与建设的人后来在报道中给出了另一种解释：这根墩柱（编号PM109）当年确实遇到了打桩难题，前后折腾了好几个月——一来单柱承重大，一大群桩挤在一个八角形承台里，桩距太密；二来这块地上原先是一处老宅院，地下埋着旧时的木桩等老基础，情况复杂；后来靠调整工艺（如掏取部分桩的土芯、增加钢管桩、用更重的桩锤连续施打）解决，并没有请人做法事。龙形浮雕出自一位雕塑家之手。据他介绍，柱子太粗，光秃秃的既不好看，也可能让司机产生视觉上的不适，所以决定装饰；选龙是他自己的构思，取「巨龙腾飞」之意，纹样参考了古代青铜器，浮雕上的龙其实不止九条，还配有日月等图案。他说，「九龙镇龙脉」的传言是揭幕以后才有的。\n\n【查无实据】传说里的高僧是谁、出自哪座寺院、是否真的做过法事、是否不久圆寂，都没有可靠的记载；「龙脉」「龙穴」之说只见于口头和网络流传。\n\n【游戏虚构】本章中的龙王庙、庙前九只石兽及「就地掩埋」、静水庵与老法师、阿婆、老卞、小沈、王经理，管子里的红水和三声敲击，以及按「龙生九子」排行请安、地下之物「喘气涨水」的法事，全部是游戏虚构。上海确有「填浜筑路」的历史——延安东路就是1914–1916年填平洋泾浜修成的——但把龙王庙安在交会口的地下，只是借这段历史编的故事。「龙生九子」的名目和次序在明代文人笔记里就有不同说法，本章用的是较常见的一种。打桩日志里的数字参考了公开报道，其余细节为虚构。',
    start: { map: 'site', x: 10, y: 13, dir: 3 },
    async intro(S) {
      await S.card('第十七夜　延安高架龙柱', '1994年冬　上海　延安路·成都北路口', '南北高架要从这里跨过延安路。\n别的墩子都立起来了，\n只有正当中这一根——PM109——\n打了十个月，桩还是打不下去。');
    },
    resume: {
      pit: async S => {
        if (S.f.riteDone) return;
        PH = null; S.hide('shadow');
        await S.think('（泥里冒泡、木鱼敲急，水就要上来：先站上铁板或高地，老浜底那一溜最先淹。\n九子照抄本上的排行请——' + (S.f.k ? '下一个是' + SONS[ORDER[S.f.k]].ord : '从老大开始') + '。）');
        startRite(S, true);
      }
    },
    tiles: {
      pit: { solid: true, paint(R, X, Y) { R(0, 0, 16, 16, '#0a0908'); for (let i = 0; i < 4; i++) R((hash(X, Y, i) * 15) | 0, (hash(Y, X, i + 4) * 15) | 0, 1, 1, '#1a1612'); } },
      creek: { solid: false, paint(R, X, Y) { R(0, 0, 16, 16, '#221c16'); for (let i = 0; i < 7; i++) R((hash(X, Y, i + 90) * 14) | 0, (hash(Y, X, i + 95) * 15) | 0, 2, 1, i % 3 ? '#2c241c' : '#3a4038'); if (hash(X, Y, 99) < .5) R((hash(X, Y, 98) * 10) | 0, (hash(Y, X, 97) * 12) | 0, 4, 1, '#4a5650'); R(0, 0, 16, 1, '#1a1510'); } },
      seep: { solid: false, paint(R, X, Y) { R(0, 0, 16, 16, '#2c2a22'); for (let i = 0; i < 6; i++) R((hash(X, Y, i + 30) * 13) | 0, (hash(Y, X, i + 40) * 14) | 0, 3, 1, i % 2 ? '#4a5a58' : '#3a4440'); for (let i = 0; i < 3; i++) { const bx = (hash(X, Y, i + 50) * 12) | 0, by = (hash(Y, X, i + 60) * 12) | 0; R(bx, by, 2, 2, '#6a7a72'); R(bx, by, 1, 1, '#9aaaa0'); } } },
      flood: { solid: false, paint(R, X, Y) { R(0, 0, 16, 16, '#1a2a2a'); for (let i = 0; i < 4; i++) { const h = hash(X, Y, 70 + i); R((h * 11) | 0, (hash(X, Y, 80 + i) * 14) | 0, 5, 1, '#2e4646'); } R(((hash(Y, X, 9) * 12) | 0), ((hash(X, Y, 9) * 12) | 0), 2, 1, '#5a7a74'); } }
    },
    sprites: {
      slogan(g, e, t, R) { const w = e.w * 16; R(1, 2, w - 2, 11, '#c83a2a'); R(1, 2, w - 2, 1, '#e85a40'); for (let i = 0; i < 4; i++) { const x = 4 + i * ((w - 8) / 4); R(x, 5, 6, 1, '#f0e0c0'); R(x + 2, 4, 1, 6, '#f0e0c0'); R(x, 8, 6, 1, '#f0e0c0'); } },
      pier(g, e, t, R) {   // 已经立起来的墩柱：往上伸得很高，顶上一道盖梁
        R(-2, 12, 20, 4, 'rgba(0,0,0,.35)');
        R(2, -64, 12, 78, '#76746e'); R(2, -64, 3, 78, '#8e8c84'); R(11, -64, 3, 78, '#56544e');
        R(-10, -74, 36, 10, '#6a6862'); R(-10, -74, 36, 2, '#84827a'); R(-10, -66, 36, 2, '#4a4844');
        for (let y = -56; y < 10; y += 14) R(3, y, 10, 1, '#66645e');
      },
      rig(g, e, t, R) {   // 打桩机：履带底盘 + 高高的桩架 + 吊着的锤
        R(-2, 10, 36, 6, 'rgba(0,0,0,.35)');
        bx2(R, 0, 4, 32, 10, '#2a2a2a'); for (let i = 2; i < 30; i += 4) R(i, 11, 2, 2, '#4a4a4a');
        bx2(R, 4, -10, 22, 15, '#d8a020'); R(6, -8, 8, 6, '#2a3a4a'); R(7, -7, 3, 2, '#5a7a9a'); R(16, -6, 8, 2, '#a87818');
        R(26, -90, 4, 96, '#c89018'); R(27, -90, 1, 96, '#e8b030'); for (let y = -86; y < 0; y += 8) { R(24, y, 8, 1, '#a87818'); R(25, y + 1, 1, 6, '#a87818'); R(30, y + 1, 1, 6, '#a87818'); }
        R(22, -94, 14, 4, '#a87818'); R(33, -90, 1, 40, '#333');
        bx2(R, 29, -54, 10, 18, '#3a3a3e'); R(30, -52, 8, 2, '#5a5a5e');
        R(8, -12, 3, 3, '#ffe890');
      },
      pitview(g, e, t, R) {   // 基坑：钢板桩的四壁、坑底的泥水、正当中那根钢管桩
        const W2 = e.w * 16, H2 = e.h * 16;
        R(0, 0, W2, H2, '#0c0a08');
        for (let x = 0; x < W2; x += 4) { R(x, 0, 2, 10, '#4a2e1e'); R(x + 2, 0, 2, 10, '#3a2216'); }
        R(0, 0, W2, 1, '#8a6a4a'); R(0, 0, 2, H2, '#4a2e1e'); R(W2 - 2, 0, 2, H2, '#3a2216'); R(0, H2 - 2, W2, 2, '#3a2216');
        R(6, 22, W2 - 12, H2 - 30, '#1a1610'); R(10, 28, W2 - 20, H2 - 40, '#22261e');
        for (let i = 0; i < 9; i++) R(12 + ((hash(i, 3, 7) * (W2 - 30)) | 0), 30 + ((hash(i, 5, 7) * (H2 - 46)) | 0), 5, 1, '#2e3a32');
        const px = 64, py = 46;
        if (e.red) { R(px - 14, py + 6, 44, 10, 'rgba(120,40,20,.75)'); R(px - 6, py + 4, 28, 4, 'rgba(150,56,30,.8)'); }
        R(px, py - 12, 16, 22, '#5a5e64'); R(px, py - 12, 16, 3, '#8a8e94'); R(px + 3, py - 11, 10, 2, '#1a1c1e'); R(px + 12, py - 9, 3, 18, '#46494e');
        if (e.red) R(px + 3, py - 10, 10, 1, '#8a3a1e');
        R(64 + 2, -2, 2, 30, '#8a8e94'); R(64 + 10, -2, 2, 30, '#8a8e94'); for (let y = 2; y < 28; y += 5) R(64 + 2, y, 10, 1, '#6a6e74');
        R(70, -6, 12, 3, '#6a6a6a'); for (let i = 0; i < 4; i++) R(72 + i * 2, -4 + (i % 2), 1, 2, '#9a9a9a');
      },
      firebarrel(g, e, t, R) {
        bx2(R, 2, 2, 12, 13, '#4a3a30'); R(2, 6, 12, 1, '#2a2018'); R(2, 11, 12, 1, '#2a2018');
        const f = Math.sin(t * 9) * 1.5, f2 = Math.cos(t * 7) * 1.5;
        R(4, -3 + f, 3, 6, '#e86a20'); R(8, -5 + f2, 3, 8, '#f08a28'); R(6, -1, 4, 4, '#ffd060'); R(11, -1 + f, 2, 3, '#e86a20');
        R(7, -9 + f2, 1, 2, 'rgba(255,200,120,.6)');
      },
      floodlt(g, e, t, R) { R(7, -40, 2, 54, '#5a5a5a'); R(3, 12, 10, 3, '#3a3a3a'); bx2(R, 1, -48, 14, 9, '#3a3a3e'); R(2, -47, 12, 6, '#f8f4e0'); R(3, -46, 10, 2, '#ffffff'); },
      pipes(g, e, t, R) {   // 一垛钢管桩
        const W2 = e.w * 16;
        for (let j = 0; j < 3; j++) for (let i = 0; i < 4 - j; i++) { const y = 8 - j * 6, x = W2 - 4 - (j * 3); R(0 + j * 3, y, x - j * 3, 6, '#5a5e64'); R(0 + j * 3, y, x - j * 3, 1, '#8a8e94'); R(W2 - 7 - j * 3, y, 5, 6, '#1a1c1e'); R(W2 - 6 - j * 3, y + 1, 3, 4, '#2e3034'); void i; }
        R(2, 14, W2 - 4, 2, 'rgba(0,0,0,.35)');
      },
      gen(g, e, t, R) { bx2(R, 0, 3, 16, 11, '#2a5a3a'); R(2, 5, 6, 4, '#1a2a20'); R(10, 5, 4, 2, '#d8c040'); R(11, 9, 2, 2, Math.sin(t * 6) > 0 ? '#e83020' : '#5a1a10'); R(3, -2, 2, 5, '#3a3a3a'); },
      redmud(g, e, t, R) { R(1, 4, 14, 8, 'rgba(110,40,22,.55)'); R(3, 3, 9, 2, 'rgba(130,48,26,.55)'); R(6, 11, 6, 3, 'rgba(100,36,20,.5)'); },
      cal94(g, e, t, R) { R(4, 1, 8, 11, '#e8e2d0'); R(4, 1, 8, 4, '#c03028'); R(5, 6, 6, 1, '#444'); R(5, 8, 6, 1, '#888'); R(5, 10, 4, 1, '#888'); R(7, 0, 2, 1, '#555'); },
      digger(g, e, t, R) {   // 履带抓斗：黄漆，大铁爪子
        R(-2, 12, 36, 4, 'rgba(0,0,0,.35)');
        bx2(R, 0, 6, 30, 8, '#2a2a2a'); for (let i = 2; i < 28; i += 4) R(i, 11, 2, 2, '#4a4a4a');
        bx2(R, 2, -10, 20, 17, '#e0b020'); R(4, -8, 9, 8, '#2a3a4a'); R(5, -7, 4, 3, '#4a6a8a'); R(14, -4, 7, 2, '#b88818');
        R(18, -30, 4, 22, '#d8a818'); R(18, -32, 18, 4, '#d8a818'); R(33, -30, 3, 14, '#d8a818');
        R(30, -16, 10, 8, '#5a5a5a'); R(30, -8, 3, 5, '#5a5a5a'); R(37, -8, 3, 5, '#5a5a5a'); R(31, -15, 8, 1, '#7a7a7a');
      },
      /* 弄堂 */
      skm(g, e, t, R) {   // 石库门：条石门框 + 乌漆木门 + 门楣
        R(0, -4, 16, 18, '#a8a090'); R(1, -6, 14, 3, '#b8b0a0'); R(3, -3, 10, 2, '#8a8270');
        R(3, 0, 10, 14, e.boarded ? '#5a4a36' : '#1a1210'); R(7, 0, 2, 14, '#0e0a08');
        if (e.boarded) { R(2, 3, 12, 2, '#7a6446'); R(2, 9, 12, 2, '#7a6446'); } else { R(5, 6, 1, 2, '#c9a35a'); R(10, 6, 1, 2, '#c9a35a'); }
      },
      chai(g, e, t, R) { R(2, 1, 12, 12, 'rgba(240,240,236,.12)'); R(3, 2, 10, 10, 'rgba(0,0,0,0)'); const c = '#e8e4dc'; R(4, 3, 8, 1, c); R(7, 2, 1, 4, c); R(4, 6, 8, 1, c); R(5, 7, 1, 5, c); R(9, 7, 1, 5, c); R(6, 9, 3, 1, c); R(2, 2, 12, 1, 'rgba(232,228,220,.4)'); R(2, 2, 1, 11, 'rgba(232,228,220,.4)'); R(13, 2, 1, 11, 'rgba(232,228,220,.4)'); R(2, 12, 12, 1, 'rgba(232,228,220,.4)'); },
      tiger(g, e, t, R) { R(0, -2, 16, 16, '#3a2a1e'); R(1, -1, 14, 4, '#7a2a1e'); R(3, 0, 10, 2, '#e8c870'); R(2, 4, 12, 9, '#1a120c'); R(3, 9, 4, 4, '#5a4a3a'); R(9, 9, 4, 4, '#5a4a3a'); },
      tstone(g, e, t, R) { R(1, 4, 14, 9, '#6a665e'); R(1, 4, 14, 1, '#8a867c'); for (let i = 0; i < 3; i++) { R(3 + i * 4, 8, 2, 1, '#4a4842'); R(4 + i * 4, 7, 2, 1, '#4a4842'); } R(11, 10, 3, 2, '#4a4842'); },
      coalstove(g, e, t, R) { bx2(R, 3, 2, 10, 12, '#5a5650'); R(4, 3, 8, 2, '#3a3632'); R(6, 3, 4, 1, '#d86a20'); R(7, -10, 2, 12, '#4a4640'); R(7, -10, 5, 2, '#4a4640'); R(8, -14 + Math.sin(t) * 1, 1, 3, 'rgba(200,200,200,.3)'); },
      bchair(g, e, t, R) { R(3, 2, 10, 2, '#a88a4a'); R(3, 4, 1, 6, '#8a6a3a'); R(12, 4, 1, 6, '#8a6a3a'); R(3, 8, 10, 2, '#b89a5a'); R(3, 10, 1, 5, '#8a6a3a'); R(12, 10, 1, 5, '#8a6a3a'); },
      radio(g, e, t, R) { bx2(R, 2, 6, 12, 8, '#5a3a24'); R(3, 7, 5, 5, '#c8b890'); R(9, 8, 4, 1, '#c9a35a'); R(10, 2, 1, 5, '#888'); },
      clothes(g, e, t, R) { const W2 = e.w * 16; R(1, -12, 1, 26, '#5a4a3a'); R(W2 - 2, -12, 1, 26, '#5a4a3a'); R(1, -11, W2 - 2, 1, '#8a8a80'); R(8, -10, 8, 10, '#4a6a8a'); R(9, -10, 6, 1, '#6a8aaa'); R(22, -10, 6, 7, '#c8c0a8'); R(32, -10, 7, 12, '#7a3a3a'); },
      rubble(g, e, t, R) { R(0, 8, 16, 6, '#5a4a3e'); R(2, 5, 6, 4, '#7a5a46'); R(8, 4, 6, 5, '#6a6660'); R(5, 2, 3, 3, '#8a6a52'); R(11, 9, 4, 2, '#3a2e26'); R(1, 12, 3, 2, '#9a7a62'); },
      /* 静水庵 */
      shrine2(g, e, t, R) {   // 佛龛：供桌 + 坐佛（往上伸进墙里）
        R(2, -30, 28, 30, '#3a1a12'); R(4, -28, 24, 26, '#5a2a1a');
        R(12, -24, 8, 7, '#c9a35a'); R(13, -23, 6, 5, '#e0bc6a'); R(10, -17, 12, 12, '#c9a35a'); R(8, -8, 16, 4, '#b8924a'); R(14, -21, 1, 1, '#5a3a1a'); R(17, -21, 1, 1, '#5a3a1a');
        R(15, -27, 2, 3, '#e0bc6a');
        bx2(R, 0, 0, 32, 14, '#6a2a1a'); R(2, 2, 28, 2, '#9a4a2a'); R(6, 6, 20, 1, '#c9a35a');
      },
      muyu(g, e, t, R) { R(3, 6, 10, 8, '#8a3a1a'); R(4, 5, 8, 1, '#a84a22'); R(4, 9, 8, 1, '#3a1a0a'); R(12, 2, 1, 6, '#6a4a2a'); R(11, 1, 3, 2, '#8a6a3a'); },
      scrollJ(g, e, t, R) { R(2, -2, 12, 2, '#5a3a1a'); R(3, 0, 10, 14, '#d8ccaa'); R(2, 14, 12, 2, '#5a3a1a'); for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) R(4 + i * 3, 2 + j * 4, 2, 2, j % 2 ? '#6a7a6a' : '#7a6a4a'); },
      plaque(g, e, t, R) { R(2, 0, 28, 11, '#2a1a10'); R(3, 1, 26, 9, '#3a2418'); R(8, 3, 5, 5, '#c9a35a'); R(19, 3, 5, 5, '#c9a35a'); R(9, 4, 3, 1, '#3a2418'); R(20, 5, 3, 1, '#3a2418'); },
      bellframe(g, e, t, R) {   // 钟架：两根木柱一道横梁，钟顶的钮是一只小兽（蒲牢）
        R(0, -26, 3, 40, '#4a3420'); R(13, -26, 3, 40, '#4a3420'); R(-1, -28, 18, 3, '#3a2818');
        R(7, -25, 2, 3, '#3a3a3a'); R(6, -23, 4, 3, '#4a7a5a'); R(5, -22, 1, 1, '#4a7a5a'); R(10, -22, 1, 2, '#4a7a5a');
        R(4, -20, 8, 4, '#3a6a52'); R(3, -16, 10, 10, '#3a6a52'); R(2, -7, 12, 3, '#2e5a44'); R(5, -14, 1, 6, '#5a8a6a'); R(4, -12, 8, 1, '#2a4a3a'); R(4, -9, 8, 1, '#2a4a3a');
      },
      censer(g, e, t, R) {   // 三足香炉，炉盖上蹲着一只狮子样的小兽（狻猊）
        R(2, 4, 12, 7, '#4a4a3a'); R(1, 3, 14, 2, '#6a6a52'); R(3, 11, 2, 4, '#3a3a2e'); R(11, 11, 2, 4, '#3a3a2e'); R(7, 11, 2, 3, '#3a3a2e');
        R(5, -1, 6, 4, '#5a5a46'); R(6, -3, 4, 2, '#5a5a46'); R(9, -4, 2, 2, '#5a5a46'); R(7, 0, 1, 1, '#2a2a20');
        R(4, 1, 1, 1, '#8a3a2a'); R(11, 1, 1, 1, '#8a3a2a');
        for (let i = 0; i < 3; i++) R(6 + i * 2 + Math.sin(t * 2 + i) * 1, -10 - i * 3, 1, 4, 'rgba(220,220,210,.35)');
      },
      bixi(g, e, t, R) {   // 驮碑的大龟（赑屃）：只占一格，碑往上伸
        R(-4, 6, 24, 8, '#5a5a52'); R(-6, 8, 4, 4, '#5a5a52'); R(-7, 9, 2, 2, '#4a4a44'); R(-5, 9, 1, 1, '#222'); R(-2, 12, 3, 3, '#4a4a44'); R(15, 12, 3, 3, '#4a4a44');
        for (let i = 0; i < 4; i++) R(-2 + i * 5, 7, 3, 2, '#6a6a62');
        R(1, -26, 14, 33, '#6a6a64'); R(1, -26, 14, 3, '#7a7a74'); R(2, -30, 12, 5, '#6a6a64'); R(3, -32, 10, 2, '#6a6a64');
        for (let y = -20; y < 4; y += 3) R(4, y, 8, 1, '#4e4e48');
      },
      chiwen(g, e, t, R) {   // 屋脊上换下来的鸱吻（螭吻）：一张大嘴咬着屋脊
        R(0, 8, 16, 6, '#3a3e3a'); R(0, 8, 16, 1, '#5a5e5a');
        R(2, -8, 10, 16, '#4a4e48'); R(2, -10, 6, 3, '#4a4e48'); R(10, -6, 4, 3, '#4a4e48'); R(12, -10, 2, 5, '#4a4e48');
        R(3, 0, 8, 5, '#1e221e'); R(3, 0, 2, 2, '#6a6e68'); R(9, 0, 2, 2, '#6a6e68'); R(5, -6, 2, 2, '#c8b070'); R(6, -6, 1, 1, '#222');
      },
      /* 基坑 */
      pladder(g, e, t, R) { R(3, -4, 2, 20, '#8a8e94'); R(11, -4, 2, 20, '#8a8e94'); for (let y = -2; y < 16; y += 4) R(3, y, 10, 1, '#6a6e74'); },
      longxiang(g, e, t, R) { R(6, 10, 4, 4, '#6a5a3a'); R(7, -10, 1, 20, '#8a3a2a'); const lf = W.timer && W.timer.label === '一炷香' ? clamp(W.timer.left / FULL, 0, 1) : 1; R(7, -10 + Math.round((1 - lf) * 16), 1, 1, '#ff8a3a'); R(7, -13 + Math.round((1 - lf) * 16) + Math.sin(t * 2), 1, 2, 'rgba(220,220,220,.45)'); },
      stump(g, e, t, R) { R(1, 12, 14, 4, 'rgba(10,8,6,.5)'); R(4, -4, 8, 17, '#2a2018'); R(4, -4, 3, 17, '#3a2e22'); R(4, -6, 8, 3, '#4a3a2a'); R(5, -6, 2, 1, '#5a4a36'); R(4, 4, 8, 1, '#1a140e'); R(3, 11, 10, 3, '#3a2e22'); },
      ppile(g, e, t, R) {   // 打不下去的那根钢管桩
        R(-2, 10, 20, 6, 'rgba(0,0,0,.4)');
        R(0, -24, 16, 38, '#5a5e64'); R(0, -24, 4, 38, '#7a7e84'); R(12, -24, 4, 38, '#44474c');
        R(0, -26, 16, 4, '#8a8e94'); R(2, -25, 12, 2, '#121416');
        R(-2, 10, 20, 4, '#3a2e22'); R(0, 4, 16, 2, '#4a3a2a');
      },
      beast(g, e, t, R) {   // 泥里露出半截的石兽头，座子上刻着它喜欢的东西
        R(-1, 10, 18, 5, 'rgba(20,16,10,.55)');
        R(1, 2, 14, 10, '#5e6458'); R(2, 0, 12, 3, '#6e7468'); R(3, -2, 3, 3, '#6e7468'); R(10, -2, 3, 3, '#6e7468');
        R(1, 2, 14, 1, '#7e8478'); R(4, 4, 2, 2, '#2a2e26'); R(10, 4, 2, 2, '#2a2e26'); R(6, 8, 4, 2, '#3a3e34');
        R(2, 1, 3, 2, '#4a6a3a'); R(11, 7, 3, 3, '#4a6a3a'); R(1, 9, 4, 2, '#3e5a30');
        R(0, 9, 16, 7, '#4e5248'); R(1, 9, 14, 7, '#8a8e7e'); R(1, 9, 14, 1, '#a8ac9a');
        carveIcon(R, e.k, 4, 9, '#262a22');
        if (e.s.done) { R(13, -8, 1, 10, '#8a3a2a'); R(13, -9, 1, 1, '#ff9a4a'); R(13, -13 + Math.sin(t * 2 + e.px) * 1, 1, 3, 'rgba(220,220,220,.45)'); R(4, 4, 2, 2, '#c8a040'); R(10, 4, 2, 2, '#c8a040'); }
      },
      lshadow(g, e, t, R) {   // 浑水底下游过去的长影子
        for (let i = 0; i < 9; i++) { const y = Math.sin(t * 4 + i * .8) * 2; R(-i * 9, 5 + y, 10, 6 - (i > 5 ? 2 : 0), 'rgba(4,8,8,.55)'); R(-i * 9 + 2, 6 + y, 2, 1, 'rgba(160,190,170,.25)'); }
        R(8, 4, 8, 8, 'rgba(4,8,8,.6)'); R(13, 6, 2, 1, 'rgba(240,180,40,.8)');
      },
      dhead(g, e, t, R) {   // 最后浮出来的龙头（大，跨三格）
        const b = Math.sin(t * 1.5) * 1;
        R(-26, 14, 68, 6, 'rgba(160,200,190,.25)'); R(-20, 18, 56, 2, 'rgba(160,200,190,.15)');
        R(-14, -10 + b, 44, 26, '#1c3a34'); R(-18, -4 + b, 52, 18, '#1c3a34'); R(-10, -16 + b, 36, 8, '#1c3a34');
        for (let i = 0; i < 8; i++) R(-12 + i * 5, -12 + b + (i % 2) * 2, 3, 1, '#2a5048');
        R(-14, -26 + b, 3, 12, '#c8b070'); R(-18, -24 + b, 4, 2, '#c8b070'); R(27, -26 + b, 3, 12, '#c8b070'); R(30, -24 + b, 4, 2, '#c8b070');
        R(-8, -6 + b, 8, 5, '#f0b020'); R(16, -6 + b, 8, 5, '#f0b020'); R(-4, -7 + b, 1, 7, '#050806'); R(20, -7 + b, 1, 7, '#050806');
        R(-2, 6 + b, 20, 6, '#2a5048'); R(1, 7 + b, 2, 2, '#050806'); R(13, 7 + b, 2, 2, '#050806');
        for (let i = 0; i < 10; i++) { R(-4 - i * 2, 10 + b + i, 2, 1, '#d8c890'); R(20 + i * 2, 10 + b + i, 2, 1, '#d8c890'); }
      }
    },
    maps: {
      /* ---------------- 工地 ---------------- */
      site: {
        amb: 'wind', dark: .82, plr: 3.2, wall: 'metal', floor: 'concrete',
        wallC: { face: '#3a5a78', trim: '#22384c', top: '#141c24' },
        legend: { P: { t: 'pit', solid: true } },
        rows: [
          '################################',
          '################################',
          '#nnnnn#xxxxxxxxxxxxxxxxxxxxxxxx#',
          '#nnnnn#xxxxxxxxxxxxxxxxxxxxxxxx#',
          '#nnnnn#xxxxxxxxxxxxxxxxxxxxxxxx#',
          '#nnnnn#xxxxxxxxxuPPPPPPPPPxxxxx#',
          '###n###xxxxxxxxxxPPPPPPPPPxxxxx#',
          '#xxxxxxxxxxxxxxxxPPPPPPPPPuxxxx#',
          '#xxxxxxxxxxxxxxxxPPPPPPPPPuxxxx#',
          '#xddxxxxxxxxxxxxuPPPPPPPPPxxxxx#',
          '#xdxxxxxxxxxxxxxuPPPPPPPPPxxxxx#',
          '#xxxxxxxdddxxxxxuuuxxxxxxxxxxxx#',
          'xxxxxxxxdddxxxxxxxxxxxxxxxxxxxx#',
          '#xxxxxxxxdxxxxxxxxxxxxxxxxddxxx#',
          '#xxxxxxxxxxxxxxxxxxxxxxxxxdxxxx#',
          '#xxxxxxxxxxxxdddxxxxxxxxxxxxxxx#',
          '#xxxxxxxxxxxxxdxxxxxxxxxxxxxxxx#',
          '################################'],
        ents: [
          { id: 'pitview', x: 17, y: 5, w: 9, h: 6, spr: 'pitview', decal: true },
          /* 工棚 */
          { id: 'odesk', x: 2, y: 2, spr: 'desk', col: '#6a5a44', async on(S) { if (S.once('logFirst')) await S.narr('桌上摊着图纸，压着一只搪瓷缸。缸底下是小沈的打桩日志。'); await S.note('log'); } },
          { x: 1, y: 2, spr: 'cabinet', col: '#4a5a4a', on: S => S.narr('铁皮柜里塞满了图纸和安全帽。柜门上贴着一张值班表，你的名字写在「夜班」那一栏。') },
          { x: 4, y: 2, spr: 'phone', on: S => S.narr('黑色的拨盘电话。听筒上缠着一圈胶布。\n王经理说，市里的电话一天打来三回。') },
          { x: 5, y: 2, h: 2, spr: 'bed', col: '#3a4a5a', on: S => S.narr('上下铺。上铺堆着几件沾满泥浆的工作服，下铺的被子还是热的——老卞刚眯过一会儿。') },
          { x: 2, y: 1, spr: 'poster', col: '#e8dcc0', on: S => S.narr('墙上贴着一张「安全生产十大禁令」。\n第十条底下，有人用铅笔添了一行小字：「夜里不要一个人下坑」。') },
          { x: 4, y: 1, spr: 'cal94', on: S => S.narr('一九九四年的挂历，翻到十二月。\n每一天都打了个叉。叉的旁边写着同一个数字：31。') },
          { x: 1, y: 5, spr: 'cup', on: S => S.narr('一只热水瓶，一只搪瓷缸。缸上印着「先进生产者」。') },
          { id: 'shen', x: 19, y: 4, spr: '@shen', dir: 0, on: shenOn },
          /* 工地 */
          { id: 'rig', x: 14, y: 6, w: 2, spr: 'rig', light: { r: 2.4, col: 'rgba(255,230,150,.14)', dx: 10, dy: -8 }, on: S => S.narr(S.f.night2 ? '打桩机熄了火。八吨的锤头吊在半空，一动不动。' : '打桩机的柴油机还在「突突突」地响。\n八吨的锤头吊在桩架顶上，钢丝绳绷得笔直。') },
          { id: 'bian', x: 13, y: 7, spr: '@bian', dir: 2, on: bianOn },
          { id: 'pitlook', x: 17, y: 8, spr: 'invisible', solid: true, on: pitLook },
          { id: 'ladder', x: 21, y: 5, spr: 'invisible', solid: true, on: ladderOn },
          { x: 16, y: 10, spr: 'redmud', decal: true },
          { id: 'fire', x: 8, y: 13, spr: 'firebarrel', light: { r: 3.4, col: 'rgba(255,150,60,.28)', flick: true, dy: -4 }, on: S => S.narr('一只汽油桶，里面烧着碎木头。\n火苗一跳一跳的，把人的影子投在围挡上，一会儿长，一会儿短。') },
          { x: 12, y: 3, spr: 'floodlt', light: { r: 6.5, col: 'rgba(220,230,255,.15)', dy: 8 }, on: S => S.narr('探照灯的光惨白惨白的，照到哪儿，哪儿就像下了一层霜。') },
          { x: 10, y: 9, spr: 'gen', on: S => S.narr('发电机「嗡嗡」地响。红灯一闪一闪。') },
          { x: 23, y: 14, w: 3, spr: 'pipes', on: S => S.narr('一垛钢管桩，每根直径九十公分，长得一眼望不到头。\n本来都该在地底下了。') },
          { x: 27, y: 3, w: 2, spr: 'car', col: '#d8d4c4', on: S => S.narr('王经理的桑塔纳。挡风玻璃上积了一层灰，有人用手指在灰上写了个「31」。') },
          { id: 'wang', x: 26, y: 4, spr: '@wang', dir: 1, on: wangOn },
          { x: 29, y: 9, spr: 'pier', on: S => S.narr('隔壁的墩柱，早就立起来了，顶上的盖梁黑黢黢地横在夜空里。\n一根挨一根，像一排巨人的腿，等着上面架桥面。') },
          { x: 29, y: 15, spr: 'pier', on: S => S.narr('墩柱上用红漆喷着编号：PM111。') },
          { x: 1, y: 16, spr: 'pier', on: S => S.narr('墩柱上用红漆喷着编号：PM107。\n只有中间那一根，一直空着。') },
          { x: 9, y: 1, w: 4, spr: 'slogan', on: S => S.narr('围挡上刷着红底白字的标语：「文明施工　安全第一」。') },
          { x: 20, y: 1, w: 4, spr: 'slogan', on: S => S.narr('「打通南北大动脉」。\n标语底下的铁皮上，不知道谁用粉笔画了一条歪歪扭扭的龙。') },
          { x: 0, y: 12, spr: 'invisible', touch: siteExit },
          { id: 'digger', x: 21, y: 12, w: 2, spr: 'digger', hidden: true, on: diggerOn },
          { id: 'fashi_s', x: 22, y: 4, spr: '@fashi', hidden: true, on: fashiSiteOn }
        ],
        async enter(S, first) {
          if (first) { S.give('torch', true); return nightOne(S); }
          if (S.f.night2 && S.once('n2')) { await nightTwo(S); S.cp(); }
        }
      },
      /* ---------------- 弄堂 ---------------- */
      lane: {
        amb: 'wind', dark: .22, plr: 4, wall: 'brick', floor: 'stone',
        wallC: { face: '#6a5a50', trim: '#3a2e28', top: '#2a2420' },
        rows: [
          '############################',
          '############################',
          '#nnnnn#kkkkkkkkkkkkkkkkkkkk#',
          '#nnnnn#kkkkkkkkkkkkkkkkkkkk#',
          '#nnnnn#kkkkkkkkkkkkkkkkkkkk#',
          '###n###kkkkkkkkkkkkkkkkkkkk#',
          '#kkkkkkkkkkkkkkkkkkkkkkkkkk#',
          '#kkkkkkkkkkkkkkkkkkkkkkkkkk#',
          'kkkkkkkkkkkkkkkkkkkkkkkkkkkk',
          '#kkkkkkkkkkkkkkkkkkkkkkkkkk#',
          '#dddddd#ddddd##dddddd#ddddd#',
          '#dddddddddddddddddddddddddd#',
          '#dddddddddddddddddddddddddd#',
          '############################'],
        ents: [
          /* 动迁办 */
          { id: 'archive', x: 1, y: 2, spr: 'cabinet', col: '#4a6a4a', on: archiveOn },
          { id: 'odesk2', x: 3, y: 2, spr: 'desk', col: '#5a4a3a', async on(S) {
            S.f.t_photo = true;
            await S.narr('桌上压着一块玻璃板，玻璃板底下夹着一张发黄的照片。');
            await S.narr('照片上是一条窄窄的小河，河边一座矮矮的庙。庙门口一溜排着九只石兽，大的在前，小的在后。\n背面用毛笔写着：「龙王庙　民国二年摄」。');
          } },
          { x: 2, y: 1, spr: 'poster', col: '#e8e0c8', on: S => S.narr('「南北高架工程动迁公告」。\n底下用红笔写着一串门牌号，已经搬走的，一个个划掉了。只剩一个没划：阿婆家。') },
          { x: 4, y: 1, spr: 'wallclock', on: S => S.narr('墙上的挂钟停在三点十分。没人给它上弦了。') },
          { x: 5, y: 2, spr: 'chair', col: '#5a4a3a', on: S => S.narr('一把折叠椅，椅背上搭着一件印着「动迁组」的红马甲。') },
          /* 弄堂北面一排石库门 */
          { x: 9, y: 1, spr: 'tiger', on: S => S.narr('老虎灶。卖开水的铺子，门板上下了锁。\n门楣上的木招牌还在：「两分一瓶」。') },
          { x: 11, y: 1, spr: 'chai', on: S => S.narr('墙上一个白石灰刷的大圈，圈里一个「拆」字。') },
          { x: 13, y: 1, spr: 'skm', boarded: true, on: S => S.narr('石库门，乌漆门板上钉着木条。门楣上的砖雕被人撬走了一半。') },
          { id: 'tstone', x: 13, y: 2, spr: 'tstone', solid: false, on: S => { S.f.t_stone = true; return S.narr('门口垫脚的一块青石，被几代人踩得光溜溜的。\n凑近了看，石头上刻着一道道水波，水波里探出半只兽爪。\n这不是门槛石。是从哪座庙上拆下来的。'); } },
          { x: 16, y: 1, spr: 'chai', on: S => S.narr('又一个「拆」字。旁边用粉笔写着：「阿拉不走」。又被人划掉了。') },
          { id: 'apoDoor', x: 19, y: 1, spr: 'skm', on: S => S.narr('阿婆家的门。门框上贴着褪了色的春联，门缝里飘出来一股泡饭的味道。') },
          { x: 22, y: 1, spr: 'chai', on: S => S.narr('「拆」。') },
          { x: 24, y: 1, spr: 'skm', boarded: true, on: S => S.narr('这一家搬走了。门缝里塞满了广告和催缴单。') },
          { id: 'apo', x: 19, y: 3, spr: '@apo', dir: 0, on: apoOn },
          { x: 20, y: 3, spr: 'bchair', on: S => S.narr('一把竹椅，被太阳晒得发白，椅面上垫着一块棉垫。') },
          { x: 21, y: 2, spr: 'coalstove', on: S => S.narr('煤球炉子上坐着一只钢精锅，咕嘟咕嘟地煮着泡饭。') },
          { x: 18, y: 2, spr: 'radio', on: S => S.narr('一台老红灯牌收音机。阿婆关掉它之前，里头在唱沪剧。') },
          { x: 8, y: 3, w: 3, spr: 'clothes', solid: false, on: S => S.narr('两根竹竿当中拉着一根晾衣绳，挂着几件阿婆的罩衫，在风里一甩一甩的。') },
          { id: 'well', x: 14, y: 7, spr: 'well', on: wellOn },
          { x: 7, y: 10, spr: 'poster', col: '#e0d8c0', on: S => S.narr('半截墙上糊着一张通知：「本地块定于一九九四年十二月三十一日前全部腾空」。\n墙的另一半已经没了。') },
          { x: 21, y: 10, spr: 'chai', on: S => S.narr('这半截墙上也有个「拆」字。字的下半截跟着墙一起没了。') },
          { x: 3, y: 11, spr: 'rubble', on: S => S.narr('一堆碎砖烂瓦。砖缝里夹着半张奖状，名字被雨泡没了。') },
          { x: 10, y: 12, spr: 'rubble', on: S => S.narr('瓦砾堆里埋着一只搪瓷脸盆，盆底印着一对鸳鸯。') },
          { x: 18, y: 11, spr: 'rubble', on: S => S.narr('推土机推过的地方，露出一截老墙脚。墙脚的条石，跟别的砖不一样，年头老得多。') },
          { x: 24, y: 12, spr: 'rubble', on: S => S.narr('碎砖堆上，一只黄猫懒洋洋地晒太阳，看见你，「喵」了一声就钻没了。') },
          { x: 27, y: 8, spr: 'invisible', touch: laneEast },
          { x: 0, y: 8, spr: 'invisible', touch: laneWest }
        ],
        async enter(S, first) {
          if (!first) return;
          await S.narr('弄堂拆了一半。\n南边那排房子已经推平了，只剩下几截断墙，墙上白石灰刷着一个个「拆」字。');
          await S.narr('北边的石库门大多钉上了木条。只有一户的门口，摆着一把竹椅，一只煤球炉子，炉子上煮着泡饭。\n一个阿婆坐在太阳底下，收音机里咿咿呀呀地唱着沪剧。');
          S.goal('找阿婆问龙王庙的事（晒太阳的那位）');
        }
      },
      /* ---------------- 静水庵 ---------------- */
      temple: {
        amb: 'room', dark: .4, plr: 3.6, wall: 'wood', floor: 'stone',
        wallC: { face: '#7a2e22', trim: '#4a1a12', top: '#2a1410' },
        tileOpts: { grassC: '#2a3a24', treeC: '#4a5a24' },
        rows: [
          '####################',
          '####################',
          '#wwwwwwwwwwwwwwwwww#',
          '#wwwwwwwwwwwwwwwwww#',
          '#wwwwwwwwwwwwwwwwww#',
          '#kkkkkkkkkkkkkkkkkk#',
          '#kkkkkkkkkkkkkkkkkk#',
          '#kkkkkkkkkkkkkkkkkk#',
          '#kkkkkkkkkkkkkkkkkk#',
          '#kkkkkkkkkkkkkkkkTk#',
          '#kTkkkkkkkkkkkkkkTk#',
          '#kkkkkkkkkkkkkkkkkk#',
          '#########k##########'],
        ents: [
          { x: 9, y: 2, w: 2, spr: 'shrine2', on: S => S.narr('佛龛里供着一尊小小的坐佛，金漆掉了大半，露出底下的木头。\n供桌上摆着两盘橘子，一盏油灯。') },
          { x: 7, y: 2, spr: 'candle', light: { r: 2.2, col: 'rgba(255,180,90,.2)', flick: true }, on: S => S.narr('一盏长明灯，火苗只有黄豆那么大。') },
          { x: 12, y: 2, spr: 'candle', light: { r: 2.2, col: 'rgba(255,180,90,.2)', flick: true }, on: S => S.narr('灯油快见底了。') },
          { x: 9, y: 4, spr: 'cushion', decal: true, col: '#8a6a2a' },
          { id: 'fashi', x: 9, y: 4, spr: '@fashi', dir: 0, on: fashiOn },
          { x: 10, y: 4, spr: 'muyu', on: S => { muyu(S, 0, .06); return S.narr('木鱼的漆磨掉了一大块，露出亮亮的木头。\n「笃。」'); } },
          { x: 4, y: 1, spr: 'scrollJ', on: S => S.narr('一幅褪了色的画，画着九只模样各不相同的兽，有的像龙，有的像狮子，有的像龟。\n题字只剩一个「九」，别的都看不清了。') },
          { x: 14, y: 1, w: 2, spr: 'plaque', on: S => S.narr('匾上两个字：「静水」。') },
          { id: 'bell', x: 3, y: 6, spr: 'bellframe', on: bellOn },
          { x: 10, y: 7, spr: 'censer', light: { r: 1.4, col: 'rgba(255,150,80,.14)' }, on: S => S.narr('院子当中一只三条腿的铁香炉，炉盖上蹲着一只狮子模样的小兽，张着嘴吞吐香烟。\n香灰积了半炉。') },
          { x: 16, y: 6, spr: 'bixi', on: S => S.narr('一块石碑，驮在一只大石龟背上。\n龟伸着脖子，四只脚撑得死死的，像是驮了几百年，还不肯放下。') },
          { x: 15, y: 10, spr: 'chiwen', on: S => S.narr('墙根底下放着一只从屋脊上换下来的瓦兽：一张大嘴死死咬着一截屋脊，尾巴翘得老高。\n老法师说过，屋脊上的这一位，是镇火的——它好吞水。') },
          { x: 9, y: 12, spr: 'invisible', async touch(S) { await S.go('lane', 1, 8, 2); } }
        ],
        async enter(S, first) {
          if (!first) return;
          await S.narr('庵堂很小，一进院子，一间大殿。\n院子当中一只铁香炉，墙角一口铜钟，一块驮在石龟背上的碑。\n两幢高楼的影子压下来，天一下子暗了。');
          muyu(S); await S.wait(500); muyu(S);
          S.goal('找老法师（大殿里敲木鱼的那位）');
        }
      },
      /* ---------------- PM109 基坑 ---------------- */
      pit: {
        amb: 'drone', dark: .86, plr: 3.2, wall: 'metal', floor: 'mud',
        wallC: { face: '#5a3424', trim: '#3a2016', top: '#140c08' },
        legend: { u: { t: 'creek', solid: false }, S: { t: 'seep', solid: false }, F: { t: 'flood', solid: false } },
        rows: PIT,
        ents: [
          { id: 'pladder', x: 11, y: 1, spr: 'pladder', async on(S) {
            if (S.f.rite && !S.f.riteDone) return S.narr('法事做到一半，走不得。');
            await S.go('site', 21, 4, 0);
          } },
          { x: 9, y: 2, spr: 'longxiang', decal: true, light: { r: 1.2, col: 'rgba(255,140,60,.2)', flick: true } },
          { id: 'fashi_p', x: 10, y: 2, spr: '@fashi', dir: 0, light: { r: 1.8, col: 'rgba(255,170,90,.18)', flick: true }, async on(S) {
            S.face('fashi_p', 'pl');
            if (S.f.riteDone) return S.say('老法师', '阿弥陀佛。');
            const nx = SONS[ORDER[S.f.k || 0]];
            await S.say('老法师', [(S.f.k ? '请了' + S.f.k + '位了。' : '') + '下一个，' + nx.ord + '。它叫什么、好什么，抄本上看。', '泥里冒泡，就上铁板。']);
          } },
          { x: 5, y: 2, spr: 'invisible', light: { r: 4.5, col: 'rgba(200,215,255,.09)' } },
          { x: 16, y: 2, spr: 'invisible', light: { r: 4.5, col: 'rgba(200,215,255,.09)' } },
          { x: 6, y: 9, spr: 'stump', on: S => S.narr('一截朽烂的木桩，从泥里戳出来半人高，黑得像炭。\n小沈说过，三十米往下全是这种老木桩——民国时候盖房子打下去的。') },
          { x: 16, y: 7, spr: 'stump', on: S => S.narr('又一截老木桩。木头上箍着一道锈穿了的铁箍。') },
          { x: 14, y: 12, spr: 'stump', on: S => S.narr('木桩顶上，有人很多年前刻过一个字，只剩半边：「龍」。') },
          { id: 'ppile', x: 11, y: 8, spr: 'ppile', on: S => S.narr('那根打不下去的钢管桩。管口离你一臂远，里面的水一起一伏，像在呼吸。') },
          { id: 'b_qn', x: 7, y: 4, spr: 'beast', k: 'qn', light: GLOW, on: beastOn('qn') },
          { id: 'b_yz', x: 17, y: 12, spr: 'beast', k: 'yz', light: GLOW, on: beastOn('yz') },
          { id: 'b_cf', x: 2, y: 7, spr: 'beast', k: 'cf', light: GLOW, on: beastOn('cf') },
          { id: 'b_pl', x: 14, y: 4, spr: 'beast', k: 'pl', light: GLOW, on: beastOn('pl') },
          { id: 'b_sn', x: 13, y: 9, spr: 'beast', k: 'sn', light: GLOW, on: beastOn('sn') },
          { id: 'b_bx', x: 2, y: 12, spr: 'beast', k: 'bx', light: GLOW, on: beastOn('bx') },
          { id: 'b_ba', x: 19, y: 6, spr: 'beast', k: 'ba', light: GLOW, on: beastOn('ba') },
          { id: 'b_fx', x: 10, y: 13, spr: 'beast', k: 'fx', light: GLOW, on: beastOn('fx') },
          { id: 'b_cw', x: 9, y: 8, spr: 'beast', k: 'cw', light: GLOW, on: beastOn('cw') },
          { id: 'shadow', x: 1, y: 6, spr: 'lshadow', solid: false, decal: true, hidden: true },
          { id: 'dhead', x: 12, y: 10, spr: 'dhead', solid: false, hidden: true, z: 1, light: { r: 3, col: 'rgba(255,200,80,.14)' } }
        ],
        async enter(S, first) {
          if (!first) return;
          S.norun(true);
          await S.narr('铁梯子又湿又滑。你一级一级往下爬，探照灯越来越远，泥腥味越来越重。');
          await S.narr('老法师在坑顶的铁板上盘腿坐下，点上一炷很长很长的香。\n他敲了一下木鱼。');
          muyu(S, 0, .06);
          await S.narr('这才看清：坑底的泥里，东一只、西一只，露出九个长满青苔的石兽头。\n一道更低的沟从西往东斜着穿过坑底，泥水汪汪的——那就是老浜底。\n沟上横着几块铺路钢板；石兽脚边的泥，也都塌成了一个个小水坑。');
          await S.say('老法师', ['九个孩子都在这里了。从老大请起，一个一个来。', '它在喘气。泥里冒泡、木鱼敲急，水就要上来——上铁板，上高地。', '我这炷香烧完之前，要请完。去吧。']);
          S.goal('给九子请安：从老大开始（0/9）');
          if (S.coop) S.toast('两个人：一个翻「笺」里的抄本念，一个下去请安、盯着水');
          S.f.tLeft = FULL; S.cp('pit');
          startRite(S, false);
        },
        tick(S, dt) { riteTick(S, dt); }
      }
    }
  });
})();
