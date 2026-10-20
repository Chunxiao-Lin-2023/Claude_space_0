/* ================= 第六夜 · 375路末班车 ================= */
(() => {
  /* ---------- 小工具 ---------- */
  const FONT = { '0': '111101101101111', '1': '010110010010111', '2': '111001111100111', '3': '111001111001111', '4': '101101111001001', '5': '111100111001111', '6': '111100111101111', '7': '111001001001001', '8': '111101111101111', '9': '111101111001111' };
  function digits(R, x, y, s, col) { [...s].forEach((ch, i) => { const b = FONT[ch]; if (!b) return; for (let k = 0; k < 15; k++) if (b[k] === '1') R(x + i * 4 + (k % 3), y + ((k / 3) | 0), 1, 1, col); }); }
  const mod = (a, n) => ((a % n) + n) % n;
  const bx2 = (R, x, y, w, h, fill, edge) => { R(x, y, w, h, edge || shade(fill, -.45)); R(x + 1, y + 1, w - 2, h - 2, fill); };
  /* 风掀起的袍子下摆：喇叭口朝外翻，里子露出来，底下什么都没有 */
  const hemUp = c => (g, d, fr, G, R) => {
    const lin = shade(c, -.55), hi = shade(c, .25);
    g.clearRect(0, 14, 16, 10);
    R(4, 13, 8, 1, c);
    R(3, 14, 10, 1, c); R(5, 14, 6, 1, lin);
    R(1, 15, 4, 1, c); R(11, 15, 4, 1, c); R(5, 15, 6, 1, '#07070a');
    R(0, 16, 3, 1, c); R(13, 16, 3, 1, c); R(0, 16, 1, 1, hi); R(15, 16, 1, 1, hi);
    R(0, 17, 1, 1, c); R(15, 17, 1, 1, c);
    R(6, 19, 1, 1, 'rgba(200,190,160,.55)'); R(9, 21, 1, 1, 'rgba(200,190,160,.45)');
  };

  /* 车厢：座位、行驶感 */
  let BUSPH = 0, stare = 0, stareWarn = false, flickT = 1, stDark = false, camOn = false, turnStage = 0, whispT = 0;
  let nearT = 0, heartT = 0;   // 夜路：鬼靠近时的声音冷却
  const V = 112, LPB = [0, 192, 96, 288];
  const TOP = [4, 5, 6, 7, 8, 9, 10, 13, 14, 15, 16, 17, 18], BOT = [4, 5, 6, 7, 8, 9, 15, 16, 17, 18];
  const SEATS = new Set([...TOP.map(x => x + ',2'), ...BOT.map(x => x + ',5'), '11,5', '1,2', '1,3', '1,4', '1,5']);
  const seatAt = (x, y) => SEATS.has(x + ',' + y);
  const WINS = [...Array(18)].map((_, i) => i + 1).concat([20, 22]);
  const clues = S => ['breath', 'coins', 'robe'].filter(k => S.f['c_' + k]).length;

  /* 夜路：路灯 */
  const LAMPS = [['l1', 3, 3], ['l2', 11, 3], ['l3', 19, 3], ['l4', 27, 3], ['l7', 37, 2]];
  const LIT_R2 = 2.4 * 2.4;
  const lampLit = (lx, ly, x, y) => y >= 3 && y <= 5 && (x - lx) ** 2 + (y - ly) ** 2 <= LIT_R2;   // 画面上的光斑和判定用同一个公式
  function lit(x, y) {
    for (const [id, lx, ly] of LAMPS) { const e = getEnt(id, 'road'); if (!e || e.off) continue; if (lampLit(lx, ly, x, y)) return true; }
    return false;
  }
  /* 亮处的同步光源：每个亮格一个小光洞，拼起来正好是判定为「亮」的那片地 */
  function roadLights(S) {
    const out = [];
    for (const [id, lx, ly] of LAMPS) {
      const e = getEnt(id, 'road'); if (!e || e.off) continue;
      for (let y = 3; y <= 5; y++) for (let x = lx - 3; x <= lx + 3; x++) if (lampLit(lx, ly, x, y)) out.push([x * TS + 8, y * TS + 8, .95, .9]);
    }
    S.lights(out);
  }
  /* 引擎的追逐寻路在平局时总是先横着走，从马路对面包抄的鬼永远贴着马路走、上不了人行道。
     这里由章节 tick 自己挪鬼（chase.wait 压住引擎那一步），chase 仍保留，用来判定抓人 */
  const GHOST_CHASE = spd => ({ spd: spd || 3.0, wait: 1, zone: (x, y) => !lit(x, y), catch: caughtRoad });
  function hunt(S, g) {
    const m = curMap(), p = S.pl, gx = Math.round(g.px / TS), gy = Math.round(g.py / TS);
    const dx = p.x - gx, dy = p.y - gy, vert = dy ? (dy > 0 ? 0 : 3) : -1, hor = dx ? (dx > 0 ? 2 : 1) : -1;
    const order = Math.abs(dy) >= Math.abs(dx) || g.id === 'ghost2' ? [vert, hor] : [hor, vert];   // 前头那个先抢到你那一行
    for (const d of order) {
      if (d < 0) continue;
      const nx = gx + DIRS[d][0], ny = gy + DIRS[d][1], isP = nx === p.x && ny === p.y;
      if (isP || (passable(m, nx, ny, g) && !lit(nx, ny))) { startMove(g, d, g.chase.spd); return; }
    }
    const d = bfsStep(m, gx, gy, p.x, p.y, g); if (d >= 0) startMove(g, d, g.chase.spd);
  }
  function lurk(S, g) {   // 玩家站在灯下：鬼不进光，只在你身后的黑处候着（不会抢到你前头堵路）
    const m = curMap(), p = S.pl, gx = Math.round(g.px / TS), gy = Math.round(g.py / TS);
    let best = null, bd = 1e9;
    for (let y = 3; y <= 8; y++) for (let x = p.x - 4; x <= p.x - 1; x++) {
      if (lit(x, y) || !passable(m, x, y, g)) continue;
      const d = (x - p.x) ** 2 + (y - p.y) ** 2; if (d < bd) { bd = d; best = [x, y]; }
    }
    if (!best || (best[0] === gx && best[1] === gy)) { g.dir = gx < p.x ? 2 : gx > p.x ? 1 : 3; return; }
    const d = bfsStep(m, gx, gy, best[0], best[1], g); if (d >= 0) startMove(g, d, 2.4);
  }
  /* 前头那个：在黑路尽头的马路边上守着；你进了黑处它就斜着包抄过来，你回到灯下它就退回去 */
  const HOME2 = [21, 8];
  function lurk2(S, g) {
    const m = curMap(), gx = Math.round(g.px / TS), gy = Math.round(g.py / TS);
    if (gx === HOME2[0] && gy === HOME2[1]) { g.dir = S.pl.x < gx ? 1 : 2; return; }
    const d = bfsStep(m, gx, gy, HOME2[0], HOME2[1], g); if (d >= 0) startMove(g, d, 2.2);
  }

  function nearTile(x, y, who) {
    const m = curMap();
    for (const [dx, dy] of [[-1, 0], [1, 0], [0, 1], [0, -1]]) if (passable(m, x + dx, y + dy, who)) return [x + dx, y + dy];
    return null;
  }

  /* ---------- 死亡 ---------- */
  async function caughtStare(S) {
    stare = 0;
    await S.scare('face', { spr: '@midUp' });
    await S.die('你盯着后排看得太久了。\n中间那个人，慢慢地，把头抬了起来——\n原来他一直都知道，你在看他。', '你看得太久了');
  }
  async function caughtLift(S, standing) {
    stare = 0; S.clearTimer();
    await S.scare('face', { spr: '@midUp' });
    if (standing) return S.die('你还杵在过道里，没来得及坐下。\n后排中间那个人，已经把头抬起来了——\n满车的人，他头一个瞧见的，就是你。', '你没坐下');
    await S.die('你没忍住，回了头。\n中间那个人，已经把头抬起来了。那张脸青里透灰，眼珠子是白的。\n他冲着你，慢慢地咧开了嘴。', '你回头了');
  }
  async function caughtRoad(S) {
    await S.scare('face', { spr: '@qingA' });
    await S.die('一只冰凉的手，搭上了你的肩膀。\n你听见身后「嗤」的一声——是车门打开的声音。\n末班车，等的就是你。', '你被它追上了');
  }
  async function tooClose(S) {
    if (S.f.closeWarn) {
      await S.scare('face', { spr: '@midUp' });
      return S.die('你离后排太近了。\n冷气顺着裤腿往上爬，一直爬到心口窝。\n中间那个人的脑袋，「咔」地一声，转了过来。', '你靠得太近了');
    }
    S.f.closeWarn = true; S.sfx('heart'); S.shake(300, 1); S.bubble('robeA', '…', 1500);
    await S.narr('越往后走，越冷。脚底下那层白霜，咯吱一响。\n冷得不像在车里——倒像一脚踩进了腊月的河。');
    await S.say('老太太', ['（压着嗓子）回来！你给我回来！', '再往后——就回不来了！'], { style: 'whisper' });
    await S.walk('pl', [7, 3], 5); S.turn(2);
  }
  /* 第一次盯后排盯久了：先给一次明明白白的警告 */
  async function stareWarnScript(S) {
    stare = 0; S.sfx('heart'); S.shake(200, 1); S.bubble('mid', '…', 1500);
    await S.think('后脖颈子一凉……\n别一直盯着后排看。');
    S.turn(2); S.focus(null); camOn = false;
    S.toast('盯着后排看久了会出事——转过身去');
  }

  /* ---------- 圆明园站 ---------- */
  async function grannyStop(S) {
    S.face('granny_s', 'pl');
    if (S.f.busHere) return S.say('老太太', '愣着干嘛？上车呀！');
    const n = S.f._gs = (S.f._gs || 0) + 1;
    if (n === 1) { await S.say('老太太', ['也等末班儿啊？', '甭着急。这车啊，就没准点儿过。有时候早，有时候晚，有时候……干脆就不来。']); return; }
    if (n === 2) {
      await S.say('老太太', ['小伙子，兜里有零钱没有？', '末班车那售票员，嘴可厉害。拿大票儿上车，她能数落你一道儿。']);
      if (!S.f.gotChange) S.goal('把十块钱破开（问问烤白薯摊）');
      return;
    }
    await S.say('老太太', ['我闺女家就在香山脚底下。这么晚了，本来不该出门……', '冷吧？跺跺脚。明儿就来暖气了，今儿个最难熬。', '你们年轻人呐，加班加到这么晚，图个啥。'][(n - 3) % 3]);
  }
  async function vendorOn(S) {
    S.face('vendor', 'pl');
    if (S.f.gotChange) {
      await S.say('卖白薯的大爷', ['这白薯是密云拉来的，甜着呢。', '快回去吧，别在风口上戳着。', '……末班车啊，坐上了就别东张西望的。'][(S.f._vd = ((S.f._vd ?? -1) + 1) % 3)]);
      return;
    }
    await S.say('卖白薯的大爷', '烤白薯——热乎的嘞！小伙子，来一块儿？就剩俩了，便宜给你。');
    const r = await S.ask('买一块烤白薯吗？', ['来一块儿（掏出那张大团结）', '不了，大爷']);
    if (r) { await S.say('卖白薯的大爷', '得，那您自个儿冻着吧。'); return; }
    S.take('bill');
    await S.say('卖白薯的大爷', ['嚯，大团结！我这一晚上统共也没开几回张……', '等着啊，我给你找。一块五一块儿，找你八块五——你数数，毛票儿多，别嫌沉。']);
    S.give('yam'); S.give('change', true); S.f.gotChange = true; S.toast('获得：零钱');
    await S.narr('白薯烫手，焦皮儿裂着口子，里头的瓤儿跟蜜似的往外淌糖稀。\n你攥着一把毛票，心里总算踏实了。');
    await S.say('卖白薯的大爷', ['等末班儿呢？……这条道儿啊，夜里少坐。', '前些年这一片儿……嗐，大晚上的，不说那个。', '我也收摊儿了。你自个儿留点儿神。']);
    S.ent('cart').s.out = true; S.ent('cart').light = { r: 1.6, dx: 22, dy: 2, col: 'rgba(255,120,50,.12)', flick: true };
    await busArrive(S);
  }
  async function busArrive(S) {
    if (S.f.busHere) return;
    const p = S.pl;
    if (p.y >= 5 && p.y <= 7) { const m = curMap(); let t = null; for (let d = 0; d < 12 && !t; d++) for (const y of [8, 9]) for (const x of [p.x - d, p.x + d]) if (!t && passable(m, x, y, p)) t = [x, y]; if (t) S.pos(t[0], t[1], 3); }
    await S.wait(700); S.sfx('car');
    await S.narr('路那头，两盏车灯晃晃悠悠地亮了过来。');
    S.place('bus', -9, 7, 2);
    await S.walk('bus', 'rrrrrrrrrrrrrrrr', 8);
    S.sfx('brake'); S.shake(300, 1);
    S.ent('bus').open = true; S.sfx('open');
    S.f.busHere = true;
    await S.narr('是末班车。车身上刷着白漆的自编号：4127。\n前门「哗啦」一声开了。车里的灯黄澄澄的，看着就暖和。');
    S.ent('granny_s').oy = 0;
    await S.say('老太太', '可算来了！上车上车，冻死个人了。');
    await S.alpha('granny_s', 0, 600);
    S.goal('上车');
  }

  /* ---------- 车上 ---------- */
  async function boardEvent(S) {
    S.f.phase = 'stop2';
    await S.narr('你挑了个座儿坐下。塑料座面冰得人一激灵。');
    await S.wait(500);
    S.f.moving = false; S.sfx('brake'); S.shake(500, 2);
    await S.narr('车猛地一刹，停住了。');
    await S.say('司机', '嘿——这儿哪有站啊？');
    await S.narr('车窗外黑咕隆咚的，没有站牌，也没有路灯。\n路边上……好像有人在招手。');
    await S.say('售票员', '让上吧师傅。这么冷的天儿，搁这荒郊野地里，怪可怜见儿的。');
    await S.say('司机', '……得嘞，就您心眼儿好。');
    S.ent('mdoor').open = true; S.sfx('open'); S.amb('wind');
    S.show('dust');
    await S.wait(700);
    for (const [id, x] of [['robeA', 12], ['mid', 13], ['robeB', 14]]) { const e = S.ent(id); S.place(id, x, 5, 3); e.alpha = 0; }
    S.alpha('robeA', 1, 900); S.alpha('mid', 1, 900); await S.alpha('robeB', 1, 900);
    S.focus(12, 4);
    await S.narr('上来三个人。');
    await S.narr('两边那两个，穿着一身黑青的长袍马褂，戴着瓜皮帽，脑后头拖着根辫子。\n脸白得……像糊窗户的高丽纸。');
    await S.narr('中间那个低着头，让他俩一边一个架着胳膊。脚底下拖拖拉拉的，没一点儿声音。');
    S.face('conductor', 'robeA');
    await S.say('售票员', ['哟，拍戏的吧？颐和园那边儿的剧组？', '这大半夜还拍呢，够辛苦的。买票啊——三位上哪儿？']);
    await S.wait(600);
    await S.narr('没人答话。\n左边那个慢慢抬起一只手，往售票员手心里搁了几个钱。叮、叮、叮。');
    S.sfx('ding');
    await S.say('售票员', '……嘿，得。演员都这样，入戏。');
    S.focus(null);
    await Promise.all([['robeA', 1, 2, 0], ['mid', 1, 3, 250], ['robeB', 1, 4, 500]].map(async ([id, x, y, d]) => { await S.wait(d); await S.walk(id, [x, y], 3); }));
    for (const [id, x, y] of [['robeA', 1, 2], ['mid', 1, 3], ['robeB', 1, 4]]) S.place(id, x, y, 2);
    S.ent('mdoor').open = false; S.sfx('close'); S.amb('bus');
    S.f.moving = true;
    for (const x of [1, 2, 3]) S.ent('w' + x).s.fog = false;
    S.bubble('granny', '!', 1400);
    S.show('frost');
    await S.narr('车又开了起来。\n老太太一直盯着那三个人走过的地方——盯着地板。她的手死死攥着布兜子。');
    await S.think('……拍戏的？这大半夜，荒郊野地的，哪儿来的剧组？');
    S.face('granny', 'pl'); S.bubble('granny', '!', 1200);
    await S.say('老太太', ['（她一把拽住你的袖子，压低了嗓子）……坐着，别往后瞧。', '那仨人……你别招他们。也甭一个劲儿地盯着人家瞅。'], { style: 'whisper' });
    S.once('grRide');
    S.f.phase = 'ride'; stare = 0;
    S.goal('四处看看（别盯着后排看，也别往后排去）');
    if (S.coop) S.toast('联机提示：观看的一方能看见后排漫过来的寒气——瞧见了，就喊对方转身');
    S.cp('ride');
  }

  async function winOn(S, x) {
    const w = S.ent('w' + x);
    if (S.f.phase !== 'ride') return S.narr(['车窗上结着一层白哈气。外头是圆明园的围墙，黑乎乎的，一眼望不到头。', '你拿手指头在哈气上画了个圈。圈里头，路灯一盏一盏往后跑。'][x % 2]);
    if (!S.f.c_breath) {
      S.f.c_breath = true; w.s.wiped = true;
      await S.narr('你朝车窗哈了口气，拿袄袖子擦出一小块。\n外头黑得什么都看不见，玻璃上倒映出车厢里的人：你、老太太、售票员……');
      S.sfx('heart');
      await S.narr('满车的玻璃都蒙着一层白哈气。\n只有最后一排——那三个人跟前的玻璃，干干净净，一丝哈气都没有。');
      await S.think('大冷的天儿，人坐着就得喘气。喘气，玻璃上就有哈气。\n……除非，他们不喘气。');
      return progress(S);
    }
    await S.narr(['你擦出来的那一小块，又慢慢蒙上了一层白。', '窗外的路灯越来越稀了。这条道儿，你走过不下一百回，今儿却一点儿也认不出来。'][x % 2]);
  }
  async function condOn(S) {
    S.face('conductor', 'pl');
    if (S.f.phase !== 'ride') { await S.say('售票员', ['车上就这么几位，随便儿坐。', '末班儿了，到站我喊你，甭睡过站。'][(S.f._cd = ((S.f._cd ?? -1) + 1) % 2)]); return; }
    if (!S.f.c_coins) {
      S.f.c_coins = true;
      await S.say('售票员', ['小伙子，你瞧瞧，这剧组也真够讲究的。', '给的钱都是道具。']);
      await S.narr('她摊开手。手心里三枚大钱，方孔，黄里透着绿，边上长着一圈铜锈。\n正面四个字：咸丰重宝。背面一个「当十」。');
      await S.say('售票员', '这大钱做得跟真的似的。……就是凉，我攥了这半天了，还冰手。');
      S.shake(400, 2); S.sfx('ding');
      await S.narr('车一颠，一枚大钱从她指头缝里蹦出来，骨碌碌滚到了你脚底下。\n你捡起来递给她。');
      await S.say('售票员', '哎——算了算了，送你了，留着玩儿吧。反正也不是真钱。');
      const r = await S.ask('她摆摆手，没接。', ['那我留着玩儿吧', '不要，您收着'], '小王');
      if (!r) {
        S.give('coin'); S.f.coinKept = true;
        await S.think('铜子儿攥在手里，凉得扎手。\n凉得……像是刚从水里捞上来的。');
      } else {
        S.f.coinRefused = true;
        await S.say('售票员', '嗐，你这孩子，还挺讲究。（她把那枚大钱跟另外俩搁一块儿，攥回了手心）');
        await S.think('碰过它的那几根手指头，凉了半天也没缓过来。\n凉得……像是刚从水里捞上来的。');
      }
      return progress(S);
    }
    await S.say('售票员', ['（她低头搓了搓手）这车里怎么越开越冷了……暖风又坏了吧。', '有票儿的出示一下儿……嗐，就这么几位，喊给谁听呢。'][(S.f._cd = ((S.f._cd ?? -1) + 1) % 2)]);
  }
  async function poleOn(S) {
    if (S.f.phase !== 'ride') return S.narr('车厢中间的扶杆，冰凉冰凉的，上头缠着一圈黑胶布。\n站在这儿，正好能瞧见最后一排。');
    if (S.f.c_robe) return S.narr('你攥着扶杆，不敢再往后看了。');
    S.f.c_robe = true;
    S.turn(1); S.focus(4, 3);
    await S.narr('你攥着扶杆，装作看窗外，拿眼角往后排瞟了一眼。');
    S.shake(300, 2);
    await S.narr('车一颠，满车人都跟着晃。\n后排那两个人，纹丝不动。');
    await S.narr('长袍一直垂到地上，盖得严严实实——\n看不见脚。');
    S.bubble('mid', '…', 1400); S.sfx('whisper');
    await S.narr('中间那个人的脑袋耷拉着，随着车一下一下地点头。\n他的手从袖口里露出来一截，指甲盖是青黑色的。');
    await S.narr('……鼻子里，忽然钻进来一股味儿。\n像夏天的水坑，底下沤烂了的水草。');
    S.focus(null); S.turn(2);
    await S.think('别看了。别再看了。');
    return progress(S);
  }
  async function grannyBus(S) {
    S.face('granny', 'pl');
    if (S.f.turning) return S.say('老太太', '（她死死盯着自己的鞋尖）别说话！坐下！脸冲前头！', { style: 'whisper' });
    if (S.has('yam')) {   // 白薯什么时候都能给，不给也不会再追着问
      const r = await S.ask('兜里的烤白薯还温乎着。', ['给她，暖暖手', '（先跟她说话）']);
      if (!r) {
        S.take('yam'); S.f.yamGiven = true;
        await S.say('老太太', ['哟，烤白薯！……这孩子。', '（她没吃，就那么捧在手心里捂着）倍儿热乎。还是你们年轻人火力壮。']);
        return;
      }
    }
    if (S.f.phase !== 'ride') { await S.say('老太太', ['坐呀，站着干嘛，这车晃悠。', '明儿就来暖气了，今儿个最难熬。'][(S.f._gb = ((S.f._gb ?? -1) + 1) % 2)]); return; }
    if (S.once('grRide')) await S.say('老太太', ['（她一把拽住你的袖子，压低了嗓子）……坐着，别往后瞧。', '那仨人……你别招他们。'], { style: 'whisper' });
    const hint = !S.f.c_breath ? '……窗户。您呐，瞧瞧窗户上的哈气。' : !S.f.c_coins ? '售票员手里攥着的那几个钱，你瞅见没有？' : !S.f.c_robe ? '扶杆那儿能看见后排……就瞟一眼，别多瞅。' : !S.f.c_dust ? '……中门那块儿地上，让风刮进来一层土。你低头看看。' : '……沉住气。到地方我叫你。';
    await S.say('老太太', hint, { style: 'whisper' });
  }
  async function dustOn(S) {
    if (S.f.phase !== 'ride' && S.f.phase !== 'wind') return S.narr('中门口让风刮进来一层浮土，薄薄的，一踩一个印儿。');
    if (S.f.c_dust) return S.narr('浮土上就两行鞋印儿：你的，售票员的。\n剩下那块儿，平平整整，跟没人走过一样。');
    S.f.c_dust = true; S.sfx('heart');
    await S.narr('中门口让风刮进来一层浮土，薄薄的，一踩一个印儿。\n你蹲下来看。');
    await S.think('这是我的……这是售票员的，她那双棉鞋，后跟儿磨偏了。\n那仨人是从这儿上来的，打这儿一直走到最后一排——');
    await S.think('他们走过去的地方，干干净净。\n一个脚印儿都没有。');
  }

  async function progress(S) {
    if (S.f.turning || S.f.phase !== 'ride') return;
    const n = clues(S);
    if (!S.f.turnDone) { if (n >= 2) return headTurn(S); S.goal('四处看看（别盯着后排看，也别往后排去）'); return; }
    if (n >= 3) return windEvent(S);
    S.goal('还有哪儿不对劲……（车窗 / 售票员 / 扶杆）');
  }
  async function headTurn(S) {
    S.f.turning = true; S.f.seated = false; stare = 0; turnStage = 0; whispT = 0;
    S.f.closeWarn = false; S.f.stareWarned = false;   // 每个检查点都重新给一次警告
    S.cp('turn');
    await S.wait(600);
    S.sfx('whisper'); S.shake(300, 1);
    await S.narr('后排传来很轻的一声：咔。\n……像是有人，在一点一点地，抬脖子。');
    S.bubble('mid', '…', 2600);
    await S.say('老太太', '（压着嗓子）坐下！脸冲前头！甭管听见什么——别回头！', { style: 'whisper' });
    const p = S.pl;
    if (seatAt(p.x, p.y) && p.x >= 4) { S.f.seated = true; S.turn(2); S.toast('你坐稳了，脸冲前头——别再往左转'); }
    S.goal('快坐到座位上，脸冲前头，别往后看！');
    S.timer(6, '他在抬头', liftCheck);
  }
  async function liftCheck(S) {
    const p = S.pl;
    S.ent('mid').spr = '@midUp';
    if (!(seatAt(p.x, p.y) && p.x >= 4)) return caughtLift(S, true);
    if (p.dir === 1) return caughtLift(S);   // 坐下时已经自动脸冲前头；朝左只可能是坐下以后自己转过去的
    S.sfx('heart'); S.dark(.82);
    await S.wait(700);
    await S.narr('你盯着前挡风玻璃，一动也不敢动。\n后脖颈子上凉飕飕的——像有人贴着你的后脑勺，在看。');
    await S.wait(700); S.sfx('heart');
    await S.narr('过了很久，很久。\n那股凉气，才一点一点退了回去。');
    S.ent('mid').spr = '@mid'; S.dark(null);
    S.f.turning = false; S.f.turnDone = true;
    await S.say('老太太', '……好孩子。', { style: 'whisper' });
    return progress(S);
  }
  async function windEvent(S) {
    S.f.phase = 'wind';
    await S.wait(600);
    S.f.moving = false; S.sfx('brake'); S.shake(400, 2);
    await S.narr('车又停了。窗外一闪而过一块站牌——站上一个人也没有。');
    await S.say('司机', '有下的没有？……没有啊？没有我可走了啊。');
    S.focus(3, 3);
    S.ent('mdoor').open = true; S.sfx('open'); S.amb('wind');
    await S.narr('车门「哗」地一开，一股子寒风卷着土灌了进来——');
    /* 风把两边那俩人吹得一歪：上下错开，放大，让玩家真能看清空荡荡的袍子底下 */
    S.place('robeA', 2, 2, 2); S.place('robeB', 2, 5, 2);
    S.ent('robeA').spr = '@qingAWbig'; S.ent('robeB').spr = '@qingBWbig';
    S.dark(.35); S.fx('flash'); S.sfx('sting'); S.shake(500, 3);
    await S.wait(1500);
    await S.narr('后排那两个人的长袍下摆，让风「呼」地掀了起来。\n袍子底下——');
    S.dark(.97); await S.wait(700);
    S.place('robeA', 1, 2, 2); S.place('robeB', 1, 4, 2);
    S.ent('robeA').spr = '@qingA'; S.ent('robeB').spr = '@qingB'; S.dark(null);
    await S.narr('灯闪了一下。再看时，袍子又好好地垂在地上了。\n……你看清了吗？你什么都没看清。你只觉得，那底下好像是空的。');
    S.ent('mdoor').open = false; S.sfx('close'); S.amb('bus'); S.focus(null); S.f.moving = true;
    await S.wait(500);
    S.cp('accuse');
    return accuse(S);
  }
  async function accuse(S) {
    S.f.phase = 'accuse'; S.goal('');
    S.ent('mid').spr = '@mid';
    await S.wait(400);
    S.bubble('granny', '!', 1500); S.sfx('thud'); S.shake(300, 2);
    await S.say('老太太', '哎哟！我钱包呢？！', { style: 'big' });
    const p = S.pl, t = nearTile(p.x, p.y, S.ent('granny'));
    if (t) await S.walk('granny', t, 4);
    S.face('granny', 'pl'); S.face('pl', 'granny');
    await S.say('老太太', ['刚才还在兜里揣着呢！就你！就你刚才往我跟前凑来着！', '好你个小兔崽子，瞅着人模狗样儿的，偷到老太太头上来了！']);
    S.face('conductor', 'granny');
    await S.say('售票员', '大妈，大妈您消消气儿，有话好好说……');
    const r = await S.ask('「掏出来！」老太太一把揪住了你的袄领子。', ['我没偷！您别血口喷人！', '大妈，您……您是不是搁别处了？'], '小王');
    await S.say('小王', r ? '大妈，您再翻翻，是不是搁别处了？' : '我没偷！不信您搜！');
    await S.say('老太太', ['搜？到派出所让警察搜！', '师傅，停车！我要上派出所！这小子我今儿个非拽去不可！']);
    await S.say('司机', '（叹了口气）大妈，这都几点了……要下您赶紧下，我这儿还得收车呢。');
    S.shake(200, 1);
    await S.narr('她攥着你手腕子的手，冰凉，抖得厉害。\n可她的眼睛没在看你——她一下一下地，直往后排瞟。');
    const r2 = await S.ask('老太太死拽着你往车门那儿拖。', ['……下就下！上派出所说清楚！', '（甩开她）我凭什么下车？我没偷就是没偷！'], '小王');
    if (r2 === 1) return badEnd(S);
    await S.say('小王', '……下就下！上派出所说清楚！我还怕你不成！');
    await S.say('老太太', '走！');
    S.ent('mdoor').open = true; S.sfx('open'); S.amb('wind');
    await S.say('售票员', '（嘟囔）真是的，大半夜的……');
    await S.narr('老太太连拖带拽，把你拉下了车。');
    S.sfx('close');
    await S.go('road', 8, 4, 1);
  }
  async function badEnd(S) {
    S.sfx('tear');
    await S.say('小王', '我凭什么下车！我没偷就是没偷！');
    await S.narr('你一把甩开了她的手。\n老太太踉跄了一下，愣愣地看着你，看了好半天。');
    await S.say('老太太', '……傻孩子。', { style: 'whisper' });
    S.ent('mdoor').open = true; S.sfx('open');
    await S.alpha('granny', 0, 800);
    S.ent('mdoor').open = false; S.sfx('close');
    await S.say('售票员', '嘿，这老太太，什么人呐……坐吧坐吧小伙子，甭理她。');
    await S.narr('车又开了起来。\n你坐回座位上，心里还窝着火。窗外的路灯，一盏，一盏，往后跑。');
    await S.wait(600); S.dark(.9); S.sfx('whisper');
    await S.narr('……不对。\n去香山，过了颐和园就该往西拐。\n车没拐。');
    await S.say('小王', '师傅？师傅，这是上哪儿啊——');
    await S.narr('司机没回头。售票员也没回头。\n她攥着那几个铜子儿，坐得笔直笔直的，跟后排那两位一模一样。');
    S.ent('mid').spr = '@midUp';
    await S.narr('路灯没了。窗外黑得像灌满了水。\n身后，有人轻轻地，拍了拍你的肩膀。');
    await S.scare('face', { spr: '@midUp' });
    return S.end({ bad: true, title: '末班车没有到站', text: '第二天，有人在路边捡到一张车票，撕口整整齐齐：到香山，两毛。\n\n那趟车后来开到了哪儿，人人都知道了。\n只是没有人说得清，车上原本该有几个人。' });
  }

  /* ---------- 夜路 ---------- */
  async function busBack(S) {
    S.sfx('car');
    await S.narr('身后，又响起了发动机的声音。');
    const b = S.ent('rbus'); S.f.busLeave = false;
    b.s.ghost = true; b.open = false; b.light = { r: 3, dx: 64, dy: 0, col: 'rgba(120,200,160,.10)' };
    S.place('rbus', -9, 5, 2); S.focus(5, 5);
    await S.walk('rbus', 'rrrrrrrrr', 8);
    S.sfx('brake'); S.shake(300, 1);
    await S.narr('那辆末班车……又开回来了。\n它就停在你们身后。车里的灯，一盏也没亮。');
    b.open = true; S.sfx('open');
    await S.wait(700);
    const g = S.ent('ghost'); S.place('ghost', 7, 4, 2); g.alpha = 0;
    await S.alpha('ghost', 1, 900);
    S.sfx('sting');
    S.focus(null);
    await S.say('老太太', ['别回头！走！', '挨着路灯走！那东西……不敢上亮地儿！', '站在灯底下，它就不动——黑地儿里，跑！']);
    /* 前头那盏灯永久熄灭：l2 到 l4 之间变成一段十来格的长黑路 */
    await S.wait(400);
    S.f.l3dead = true; S.ent('l3').off = true; S.ent('l3').flicker = false; S.ent('pool3').off = true; roadLights(S);
    S.sfx('switch'); S.shake(150, 1);
    S.focus(19, 4);
    await S.narr('啪——\n前头那盏一闪一闪的路灯，灭了。');
    const g2 = S.ent('ghost2'); S.place('ghost2', HOME2[0], HOME2[1], 1); g2.alpha = 0;
    await S.alpha('ghost2', 1, 700);
    await S.narr('黑地儿的那一头，马路牙子底下……也站着一个。');
    S.focus(null);
    await S.say('老太太', '……甭停！一口气儿跑过去！', { style: 'whisper' });
    S.goal('沿着路灯走到派出所（暗处要跑：按住 Shift / 点「跑」）');
    S.cp('chase');
    S.chase('ghost', GHOST_CHASE()); S.chase('ghost2', GHOST_CHASE(2.8));
  }

  defChapter({
    id: 'bus375', n: 6, title: '375路末班车', sub: '深夜，从圆明园开往香山的末班车，在没有站的地方停了下来。', origin: '中国大陆网络都市传说', color: '#1a2536',
    icon: '@qingA', amb: 'wind', floor: 'asphalt', wall: 'bus', dark: .78, plr: 2.6,
    people: {
      me: { skin: '#efc8a2', hair: '#1e1a18', hs: 'short', top: '#4c5536', top2: '#3a4028', coat: true, bottom: '#2a2c38', shoes: '#2a2420' },
      granny: { skin: '#e4c2a4', hair: '#c8c4be', hs: 'bun', top: '#2e3a58', top2: '#222a40', bottom: '#1f2128', shoes: '#141212' },
      vendor: { skin: '#c49a76', hair: '#3a3430', hs: 'short', hat: 'cap', hatC: '#3e4a58', top: '#3c3a36', coat: true, apron: '#5a4a3a', bottom: '#2a2826', shoes: '#1a1816' },
      driver: { skin: '#d9b08c', hair: '#222', hs: 'short', hat: 'cap', hatC: '#2f3a4a', top: '#3a4a5c', bottom: '#2a2f3a' },
      cond: { key: 'b375-cond', skin: '#f0cfb0', hair: '#1a1414', hs: 'bob', top: '#3d5577', top2: '#d8d8d0', bottom: '#2c3444', shoes: '#1a1a1a', extra(g, d, fr, G, R) { if (d === 0) { R(3, G.tT + 3, 1, 2, '#b02a2a'); R(9, G.tT + 1, 1, 5, '#5a3a22'); R(9, G.tT + 5, 3, 3, '#5a3a22'); } } },
      qingA: { skin: '#dcd9cf', hair: '#0c0a0a', hs: 'queue', hat: 'qing', hatC: '#16141a', top: '#242a3c', top2: '#14161f', bottom: '#242a3c', robe: true, noFeet: true, eye: '#060506' },
      qingB: { skin: '#d8d6cc', hair: '#0c0a0a', hs: 'queue', hat: 'qing', hatC: '#16141a', top: '#2c2430', top2: '#18121c', bottom: '#2c2430', robe: true, noFeet: true, eye: '#060506' },
      qingAW: { key: 'b375-qaw', skin: '#dcd9cf', hair: '#0c0a0a', hs: 'queue', hat: 'qing', hatC: '#16141a', top: '#242a3c', top2: '#14161f', robe: true, noFeet: true, eye: '#060506', extra: hemUp('#242a3c') },
      qingBW: { key: 'b375-qbw', skin: '#d8d6cc', hair: '#0c0a0a', hs: 'queue', hat: 'qing', hatC: '#16141a', top: '#2c2430', top2: '#18121c', robe: true, noFeet: true, eye: '#060506', extra: hemUp('#2c2430') },
      qingAWbig: { key: 'b375-qawb', big: true, skin: '#dcd9cf', hair: '#0c0a0a', hs: 'queue', hat: 'qing', hatC: '#16141a', top: '#242a3c', top2: '#14161f', robe: true, noFeet: true, eye: '#060506', extra: hemUp('#242a3c') },
      qingBWbig: { key: 'b375-qbwb', big: true, skin: '#d8d6cc', hair: '#0c0a0a', hs: 'queue', hat: 'qing', hatC: '#16141a', top: '#2c2430', top2: '#18121c', robe: true, noFeet: true, eye: '#060506', extra: hemUp('#2c2430') },
      /* 抬头抬到一半：下巴从头发里探出来，露出半截眼白 */
      midHalf: { key: 'b375-midhalf', skin: '#a2a994', hair: '#121010', hs: 'queue', cover: true, hat: 'qing', hatC: '#1a1816', top: '#4a463e', top2: '#2e2c26', bottom: '#4a463e', robe: true, noFeet: true, extra(g, d, fr, G, R) { if (d === 0) { R(4, G.hT + 6, 8, 2, '#a2a994'); R(5, G.hT + 5, 2, 1, '#eef0e4'); R(9, G.hT + 5, 2, 1, '#eef0e4'); R(6, G.hT + 7, 4, 1, '#3a2020'); } else if (d === 1) { R(4, G.hT + 5, 3, 2, '#a2a994'); R(4, G.hT + 4, 2, 1, '#eef0e4'); } } },
      mid: { skin: '#9ea692', hair: '#121010', hs: 'queue', cover: true, hat: 'qing', hatC: '#1a1816', top: '#4a463e', top2: '#2e2c26', bottom: '#4a463e', robe: true, noFeet: true },
      midUp: { key: 'b375-midup', skin: '#a6ad98', hair: '#121010', hs: 'queue', hat: 'qing', hatC: '#1a1816', top: '#4a463e', top2: '#2e2c26', bottom: '#4a463e', robe: true, noFeet: true, eye: '#eef0e4', mouth: '#1a0808', extra(g, d, fr, G, R) { if (d === 0) { R(5, G.hT + 3, 2, 1, '#5a6252'); R(9, G.hT + 3, 2, 1, '#5a6252'); R(6, G.hT + 7, 4, 1, '#1a0808'); } } },
      cop: { skin: '#e0b896', hair: '#1c1818', hs: 'short', hat: 'cap', hatC: '#55603a', top: '#5a6640', top2: '#a02020', bottom: '#4a5434', shoes: '#1a1a1a' }
    },
    items: {
      bill: { name: '大团结', desc: '一张十块钱的票子，叠得方方正正。这个月剩下的饭钱都在这儿了。' },
      change: { name: '零钱', desc: '一把皱巴巴的毛票和钢镚儿，带着烤白薯的焦糊味儿。' },
      yam: { name: '烤白薯', desc: '焦皮儿流着糖稀，隔着报纸都烫手。' },
      ticket: { name: '车票', desc: '末班车的车票，两毛。售票员撕的豁口整整齐齐。' },
      coin: { name: '铜子儿', desc: '一枚「咸丰重宝」当十大钱，方孔，黄里透绿，长着铜锈。攥了半天，还是冰的。' },
      logcopy: { name: '笔录复印件', desc: '刘民警临走塞给你的几张复印纸，字迹发灰，带着一股子油墨味儿。' }
    },
    notes: {
      ruins: { title: '栅栏上的告示', text: '（铁栅栏上钉着一块白铁皮，红漆刷的字掉了一半）\n\n圆明园遗址\n\n咸丰十年（1860年），英法联军攻入北京，劫掠并焚毁此园。\n遗址范围内严禁攀爬、挖掘、取土。\n夜间闭园，严禁翻越围墙。\n\n（底下有人拿粉笔歪歪扭扭地添了一行：天黑以后别往里瞅。）' },
      sched: { title: '站牌', text: '375\n圆明园 —— 香山\n\n圆明园 · 颐和园 · 北宫门 · …… · 香山\n\n首车　5:30\n末车　23:00\n\n（站牌背面，有人拿圆珠笔描了好几遍：\n末班车别坐。）' },
      ticket: { title: '车票', text: '一张薄薄的纸车票，也就半个巴掌大，印着淡红色的底纹。\n\n北京市公共汽车　车票\n票价　贰角\n№ 0371142\n\n边上让售票员撕了个豁口。\n背面印着一行小字：此票当次有效，请妥为保存，以备查验。' },
      log: { title: '值班记录', text: '1995年11月14日（星期二）　晴　大风\n\n21:10　某胡同居民报自行车被盗，已登记。\n22:35　巡逻一圈，无异常。\n\n（下一行还空着。钢笔就搁在本子上，笔帽没扣。）' },
      log2: { title: '值班记录（复印件）', text: '1995年11月14日（星期二）　晴　大风\n\n21:10　某胡同居民报自行车被盗，已登记。\n22:35　巡逻一圈，无异常。\n23:41　一老年妇女携一男青年来所，称在末班公共汽车上见到「穿清朝衣服、没有脚的人」，要求派人追车。\n　　　经询问，二人情绪激动，所述情况无法核实。已做笔录。电话联系公交调度：该车尚未回场。已劝返。\n\n（最后一行字迹不一样，像是第二天一早补上的）\n11月15日 06:20　调度来电：末班车仍未回场，司机、售票员下落不明。' },
      paper: { title: '晚报（一角）', text: '本报讯　昨日深夜，一辆末班公共汽车在运营途中失去联系，至今未回场。车上司机、售票员下落不明，有关部门正在全力寻找。\n\n据了解，该车于当晚二十三时许从始发站发车，沿途……\n\n（报纸剩下的半截不知让谁撕走了。这一角上，压着一圈茶缸子的黄印儿。）' },
      granny: { title: '老太太的纸条', text: '（烟盒纸背面，铅笔字，一笔一划的）\n\n小伙子：\n那块白薯，我揣到天亮也没舍得吃。\n热乎气儿一直到派出所都没散。\n\n我这辈子见过两回那样的人。头一回我没敢吭声。\n这一回，好歹拽下来一个。\n\n以后别坐末班车了。\n冬天出门，多穿点儿。' },
      bbs: { title: '多年以后·某论坛帖子（2003）', text: '【灵异】绝对真事！！北京330路末班车（转）\n\n楼主：我同学他二舅就在那趟车上，亲口说的。\n那年冬天，330路末班车从圆明园开出来，半道上来仨穿清朝衣服的。车上有个老太太，是退休的老法医，一眼就看出来那仨不是活人，硬说一个小伙子偷她钱包，把他拽下了车……\n第二天车没了。后来在密云水库捞上来，车里三具尸体都泡烂了，油箱里全是血！！！\n不信的可以去查，当年报纸都登了。\n\n2楼：卧槽，半夜看完不敢上厕所了\n3楼：我听的版本是375路，水库也不是密云\n4楼：老太太明明是老刑警，楼主别乱改\n5楼：那仨人是劫匪架着个死人，什么鬼不鬼的\n……\n\n47楼：查过了，那年根本没这条新闻。' }
    },
    legend: '「375路末班车」是中国大陆流传最广的网络都市传说之一（也有330路、331路等说法）。最常见的版本是这样的：1995年11月14日深夜，一辆从圆明园开往香山的末班公交车上，只有司机、女售票员、一位老太太和一个小伙子。车在没有站的地方停下，上来三个穿清朝衣服、脸色惨白的人——两个人架着中间一个低着头的。售票员以为是附近拍古装戏的演员。不久，老太太忽然一口咬定小伙子偷了她的钱包，硬把他拽下了车。下车后她才说：那三个人没有脚，风一吹，袍子底下是空的。第二天，这辆末班车连同司机、售票员一起失踪；据说后来在很远的一座水库里找到了车，车里有三具已经腐烂的尸体，油箱里装的不是油，而是血。\n\n据说这个故事从1990年代末到2000年代，在BBS、论坛和口耳相传中扩散开来，又经博客、贴吧、视频一遍遍转述，细节越传越具体：精确的日期、线路号、站名、「油箱里的血」、圆明园与清朝装束的联系……有的版本说车是在密云水库找到的，有一种说法把老太太讲成了退休的老法医或老刑警，以此解释她为什么能看穿；还有更「写实」的版本把三个乘客讲成了劫匪和一具尸体。至于圆明园与清朝装束，常被讲述者附会到1860年圆明园被焚毁的历史上。\n\n需要明确的是：没有任何官方记录或新闻档案能证实这件事——既查不到相关的公交事故记录，也找不到当年的新闻报道。它是网络时代流传的都市传说。它的「真实感」，恰恰来自那些看似可以核查的具体时间、地点、线路，以及「我同学的亲戚就在那趟车上」式的亲历叙述。本章不对任何具体线路、日期的真实性作出判断。\n\n（本章中小王与老太太的性格和对话、卖烤白薯的大爷、车辆自编号4127、「咸丰重宝」大钱、车窗上的哈气、门口浮土上的脚印、中间那人抬头、末班车在夜路上折返、派出所的笔录与值班记录、广播与晚报的内容、民警来访的情节、老太太的纸条以及那篇论坛帖子，均为游戏虚构，不对应任何真实的单位或个人。）',
    start: { map: 'stop', x: 8, y: 8, dir: 2 },
    resume: {
      ride: async S => { stare = 0; stareWarn = false; stDark = false; camOn = false; },
      turn: async S => { stare = 0; stareWarn = false; stDark = false; camOn = false; S.ent('mid').spr = '@mid'; S.dark(null); await headTurn(S); },
      accuse: async S => { stare = 0; await accuse(S); },
      road: async S => { S.f.busLeave = false; S.hide('rbus'); S.hide('ghost'); S.hide('ghost2'); roadLights(S); },
      chase: async S => {
        roadLights(S); nearT = heartT = 0;
        S.place('ghost', 7, 4, 2); S.ent('ghost').alpha = 1; S.place('ghost2', HOME2[0], HOME2[1], 1); S.ent('ghost2').alpha = 1;
        S.follow('granny_r', true); S.chase('ghost', GHOST_CHASE()); S.chase('ghost2', GHOST_CHASE(2.8));
      }
    },
    async intro(S) {
      S.give('bill', true);
      BUSPH = 0; stare = 0; stareWarn = false;
      await S.card('第六夜　375路末班车', '1995年11月14日　深夜　北京　圆明园', '明天才来暖气。\n这是北京入冬以来最冷的一个晚上。\n\n小王在单位加完班，\n要赶最后一趟车，回香山脚下的家。');
    },
    faces: {
      /* 中间那个：瓜皮帽、青灰的脸、全白的眼珠、咧到耳根的黑嘴 */
      midUp(R, a, t) {
        R(0, 0, 32, 32, '#040405');
        R(4, 3, 24, 7, '#16140f'); R(6, 1, 20, 3, '#1c1a14'); R(15, 0, 3, 2, '#7a1010'); R(4, 9, 24, 1, '#2a2620');
        R(6, 10, 20, 18, '#8d9682'); R(5, 12, 1, 12, '#7b8470'); R(26, 12, 1, 12, '#7b8470'); R(8, 27, 16, 2, '#7b8470'); R(10, 29, 12, 2, '#6a7262');
        R(6, 10, 3, 14, '#121010'); R(23, 10, 3, 14, '#121010'); R(9, 10, 2, 5, '#121010'); R(21, 10, 2, 4, '#121010');   // 披下来的乱发
        R(10, 15, 5, 3, '#5a6252'); R(18, 15, 5, 3, '#5a6252');                    // 眼窝
        R(11, 16, 3, 2, '#f2f4e6'); R(19, 16, 3, 2, '#f2f4e6');                    // 白眼珠
        const o = Math.min(3, (a * 6) | 0);
        R(9, 22, 14, 1, '#1a0808'); R(8, 21, 2, 1, '#1a0808'); R(22, 21, 2, 1, '#1a0808'); R(7, 20, 1, 1, '#1a0808'); R(24, 20, 1, 1, '#1a0808');
        if (o) { R(10, 23, 12, o, '#0a0202'); for (let i = 0; i < 6; i++) R(10 + i * 2, 23, 1, 1, '#c8c4b0'); }
        R(14, 19, 1, 1, '#4a5244'); R(17, 19, 1, 1, '#4a5244');
        R(12, 11, 1, 1, '#5a6252'); R(20, 12, 1, 2, '#5a6252');
      },
      /* 两边那个：糊窗户纸一样白的脸、黑洞洞的眼、瓜皮帽和辫子 */
      qingA(R, a, t) {
        R(0, 0, 32, 32, '#030305');
        R(5, 2, 22, 8, '#121016'); R(8, 0, 16, 3, '#18161c'); R(15, 0, 3, 2, '#2a2a40'); R(5, 9, 22, 1, '#24222a');
        R(7, 10, 18, 17, '#e4e1d6'); R(6, 12, 1, 11, '#cfccc0'); R(25, 12, 1, 11, '#cfccc0'); R(9, 27, 14, 2, '#cfccc0');
        R(7, 10, 18, 2, '#bdbab0');                                           // 剃光的脑门
        R(9, 14, 5, 5, '#050406'); R(18, 14, 5, 5, '#050406');               // 两个黑窟窿
        if (Math.sin(t * 7) > .6) { R(11, 16, 1, 1, '#8a0a0a'); R(20, 16, 1, 1, '#8a0a0a'); }
        R(15, 19, 2, 3, '#c8c5b8');
        R(12, 24, 8, 1, '#6a6a70'); R(11, 23, 1, 1, '#6a6a70'); R(20, 23, 1, 1, '#6a6a70');
        R(26, 18, 3, 14, '#0c0a0a'); R(27, 30, 2, 2, '#2a1818');            // 辫子从肩头垂下来
        R(5, 29, 22, 3, '#242a3c'); R(14, 29, 4, 3, '#14161f');
      }
    },
    sprites: {
      /* 路灯底下的光斑：逐格按 lampLit 涂，边缘一道亮线；亮暗交界处时不时有黑雾往里探 */
      pool(g, e, t, R) {
        if (e.off) return;
        const lx = e.x, ly = e.ly ?? 3;
        const on = (x, y) => lampLit(lx, ly, x, y);
        for (let y = 3; y <= 5; y++) for (let x = lx - 3; x <= lx + 3; x++) {
          if (!on(x, y)) continue;
          const X = (x - lx) * 16, Y = (y - e.y) * 16;
          R(X, Y, 16, 16, 'rgba(255,205,120,.16)');
          const ed = 'rgba(255,226,160,.42)';
          if (!on(x - 1, y)) R(X, Y, 1, 16, ed); if (!on(x + 1, y)) R(X + 15, Y, 1, 16, ed);
          if (!on(x, y + 1)) R(X, Y + 15, 16, 1, ed);
          for (const [dx, dy, sd] of [[-1, 0, 0], [1, 0, 1], [0, 1, 2]]) {
            if (on(x + dx, y + dy) || (dy && y + dy > 8)) continue;
            const ph = (t * .45 + hash(x, y, 30 + sd)) % 1; if (ph > .35) continue;
            const k = Math.sin(ph / .35 * Math.PI), len = (k * 7) | 0, c = 'rgba(4,3,8,.75)', o = 3 + ((hash(x, y, 40 + sd) * 8) | 0);
            if (sd === 0) { R(X, Y + o, len, 2, c); R(X + len, Y + o + 1, 2, 1, c); }
            else if (sd === 1) { R(X + 16 - len, Y + o, len, 2, c); R(X + 14 - len, Y + o + 1, 2, 1, c); }
            else { R(X + o, Y + 16 - len, 2, len, c); R(X + o + 1, Y + 14 - len, 1, 2, c); }
          }
        }
      },
      /* 中门口刮进来的浮土：只有两行鞋印（小王的、售票员的），往后排去的那一溜儿平平整整 */
      dust(g, e, t, R) {
        R(0, 0, 32, 32, 'rgba(150,132,100,.32)');
        for (let i = 0; i < 26; i++) R((hash(i, 1, 61) * 31) | 0, (hash(i, 2, 61) * 31) | 0, 1, 1, 'rgba(190,170,130,.5)');
        const pr = (x, y) => { R(x, y, 3, 4, 'rgba(40,32,24,.6)'); R(x, y + 5, 3, 2, 'rgba(40,32,24,.6)'); };
        pr(26, 26); pr(20, 22); pr(25, 16); pr(19, 12);   // 一行往前门那边去
        pr(4, 28); pr(9, 24);                             // 售票员的，拐向她的座儿
        R(0, 6, 32, 6, 'rgba(178,160,122,.18)');          // 那仨人走过的地方：反倒更平、更亮
      },
      /* 最后一排跟前的霜：淡蓝，几缕白气往上飘 */
      frost(g, e, t, R) {
        R(0, 0, 32, 64, 'rgba(170,205,255,.16)');
        for (let i = 0; i < 30; i++) R((hash(i, 3, 71) * 31) | 0, (hash(i, 4, 71) * 63) | 0, 1 + ((hash(i, 5, 71) * 2) | 0), 1, 'rgba(225,240,255,.55)');
        for (let i = 0; i < 3; i++) { const k = (t * .6 + i / 3) % 1, x = 5 + i * 10 + Math.sin(t * 2 + i) * 2; R(x, 56 - k * 60, 2, 2, `rgba(235,245,255,${(.5 * (1 - k)).toFixed(2)})`); }
      },
      /* 联机：只有「观看的一方」看得见的寒气——操作者盯后排盯得越久，白雾越往前漫 */
      chill(g, e, t, R) {
        if (typeof iControl === 'function' && iControl()) return;
        const st = (e.st || 0) / 10; if (st <= 0) return;
        const reach = Math.min(1, st / 5), len = 16 + reach * 200, a = .18 + reach * .4;
        for (let i = 0; i < 8; i++) {   // 一缕一缕贴着地往前爬的白气：弯弯曲曲，越往前越淡
          const y0 = 2 + i * 8, l = len * (.55 + hash(i, 7, 81) * .45) + Math.sin(t * 2.3 + i * 1.7) * 8;
          for (let k = 0; k < l; k += 3) {
            const y = y0 + Math.sin(k * .07 + t * 2 + i * 1.3) * 3, f = 1 - k / l, w = 2 + (Math.sin(k * .2 + i) > .3 ? 1 : 0);
            R(k, y, 4, w, `rgba(215,232,255,${(a * f).toFixed(2)})`);
          }
        }
        if (st > 2.4) R(0, 0, 40, 64, `rgba(200,225,255,${(.1 + reach * .18).toFixed(2)})`);
      },
      moon(g, e, t, R) { R(5, 3, 7, 9, '#d8d4c0'); R(4, 4, 9, 7, '#d8d4c0'); R(6, 4, 3, 2, '#c4c0ac'); R(9, 8, 2, 2, '#c4c0ac'); },
      yamcart(g, e, t, R) {
        R(1, 11, 30, 3, 'rgba(0,0,0,.4)');
        R(3, 10, 6, 6, '#111'); R(5, 12, 2, 2, '#555'); R(23, 10, 6, 6, '#111'); R(25, 12, 2, 2, '#555');
        bx2(R, 0, 5, 32, 6, '#4a3a2a');
        bx2(R, 13, -7, 15, 13, '#3c3c3e'); R(14, -6, 2, 11, '#56565a');
        R(12, -9, 17, 3, '#2a2a2c');
        const f = Math.sin(t * 11) > 0;
        R(17, -1, 7, 4, e.out ? '#4a1a10' : (f ? '#ff7a2a' : '#ffb050'));
        R(14, -11, 5, 2, '#7a3c22'); R(20, -11, 5, 2, '#8a4628'); R(17, -12, 4, 1, '#6a3420');
        R(27, -17, 2, 8, '#2a2a2a');
        if (!e.out) { const k = (t * 6) % 6; R(27 + Math.sin(t * 2) * 1.5, -19 - k, 2, 2, 'rgba(210,210,210,.25)'); }
        R(2, 1, 8, 4, '#7a6a4a'); R(5, -1, 2, 2, '#5a5040');
      },
      bus(g, e, t, R) {
        const gh = e.ghost, body = gh ? '#8c8c7c' : '#d6cdb0', band = gh ? '#4a2020' : '#a22c26';
        R(2, 12, 124, 4, 'rgba(0,0,0,.45)');
        R(0, -11, 128, 24, '#141210');
        R(1, -10, 126, 22, body); R(1, -10, 126, 2, shade(body, .15));
        R(1, 6, 126, 3, band);
        for (let i = 0; i < 9; i++) { const x = 4 + i * 12; R(x, -7, 10, 9, gh ? '#0e1614' : '#d8c27a'); R(x, -7, 10, 1, '#3a3426'); if (!gh) R(x + 1, -6, 2, 7, '#e8d898'); }
        if (gh) { for (const x of [8, 20, 32]) { R(x, -5, 3, 3, '#d8d6cc'); R(x, -6, 3, 1, '#16141a'); } }
        R(118, -8, 8, 11, gh ? '#0e1614' : '#b8c8c8');
        R(94, -6, 13, 7, '#e8e4d0'); digits(R, 95, -5, '375', '#a02020');
        digits(R, 70, 1, '4127', gh ? '#d8d6cc' : '#f4f0e0');
        const door = (x, open) => { if (open) { R(x, -8, 12, 20, '#0a0a08'); R(x + 1, 9, 10, 3, '#3a3a34'); } else { R(x, -8, 12, 20, '#3a3a30'); R(x + 1, -7, 4, 17, gh ? '#1a2220' : '#5a6a6a'); R(x + 7, -7, 4, 17, gh ? '#1a2220' : '#5a6a6a'); } };
        door(52, e.mid); door(104, e.open);
        R(14, 10, 14, 6, '#111'); R(18, 12, 6, 3, '#444'); R(86, 10, 14, 6, '#111'); R(90, 12, 6, 3, '#444');
        R(125, 3, 3, 3, gh ? '#4a5a50' : '#ffeeaa'); R(0, 3, 2, 3, gh ? '#3a1010' : '#c01818');
      },
      buswin(g, e, t, R) {
        R(1, 3, 14, 8, '#0b1620');
        if (e.x === 22) { R(1, 3, 14, 8, '#101c26'); return; }
        const ph = (typeof isHost === 'function' && !isHost()) ? t * V : BUSPH;
        const x0 = e.px;
        for (const b of [LPB[0], LPB[1]]) {
          const sx = mod(b - ph, 384) - 16;
          const d = sx - x0;
          if (d > -10 && d < 16) { const a = 1 - Math.abs(d - 3) / 13; R(Math.max(1, d), 3, Math.min(6, 15 - Math.max(1, d)), 8, `rgba(255,214,150,${(.55 * Math.max(0, a)).toFixed(2)})`); }
        }
        if (e.fog) { R(1, 3, 14, 8, 'rgba(190,200,210,.32)'); R(3, 9, 1, 2, 'rgba(220,230,240,.4)'); R(11, 8, 1, 3, 'rgba(220,230,240,.4)'); }
        if (e.wiped) { R(4, 4, 7, 5, '#0b1620'); }
        R(7, 3, 1, 8, '#1c2a33');
      },
      busdoor(g, e, t, R) {
        R(0, 0, 32, 16, '#1a1f24'); R(1, 1, 30, 8, '#2a2f34');
        if (e.open) { R(2, 1, 28, 7, '#050608'); R(2, 8, 28, 2, '#3a3e42'); return; }
        R(2, 1, 13, 7, '#41586a'); R(17, 1, 13, 7, '#41586a'); R(3, 2, 4, 5, '#5a7486'); R(18, 2, 4, 5, '#5a7486'); R(15, 1, 2, 7, '#1a1f24');
      },
      plate(g, e, t, R) { R(0, 2, 16, 9, '#5a5e62'); R(0, 3, 16, 7, '#9aa0a6'); digits(R, 1, 4, '4127', '#222'); },
      busnotice(g, e, t, R) { R(2, 2, 12, 10, '#e8e4d6'); R(3, 3, 10, 2, '#b02a2a'); R(3, 6, 10, 1, '#555'); R(3, 8, 7, 1, '#555'); R(3, 10, 9, 1, '#555'); },
      psign(g, e, t, R) { R(4, -8, 8, 22, '#2a2a2a'); R(5, -7, 6, 20, '#ecebe2'); for (let i = 0; i < 3; i++) { R(6, -5 + i * 6, 4, 1, '#222'); R(7, -4 + i * 6, 2, 3, '#222'); } },
      polamp(g, e, t, R) { R(7, -6, 2, 4, '#333'); R(4, -2, 8, 8, '#2a2a2a'); R(5, -1, 6, 6, e.off ? '#5a2020' : '#ff4a3a'); R(6, 0, 2, 2, '#ffc0b0'); },
      wallmap(g, e, t, R) { R(1, 1, 14, 11, '#3a3020'); R(2, 2, 12, 9, '#d8d0b4'); R(3, 5, 10, 1, '#c84a3a'); R(8, 2, 1, 9, '#c84a3a'); R(4, 3, 3, 2, '#8ab08a'); R(10, 7, 3, 2, '#7a9ac0'); R(5, 8, 1, 1, '#c02020'); },
      banner(g, e, t, R) { R(0, 3, 32, 9, '#7a1814'); R(1, 4, 30, 7, '#a8231e'); for (let i = 0; i < 5; i++) { R(4 + i * 5, 5, 3, 1, '#f0dca0'); R(5 + i * 5, 6, 1, 3, '#f0dca0'); R(4 + i * 5, 8, 3, 1, '#f0dca0'); } },
      calendar(g, e, t, R) { R(4, 1, 8, 11, '#f0ece0'); R(4, 1, 8, 3, '#b02a2a'); for (let y = 5; y < 11; y += 2) R(5, y, 6, 1, '#999'); R(9, 7, 2, 1, '#c02020'); },
      coalstove(g, e, t, R) {
        R(7, -22, 2, 24, '#3a3a3a'); R(7, -22, 9, 2, '#3a3a3a');
        bx2(R, 3, 2, 10, 13, '#3a3a3a'); R(4, 3, 8, 2, '#555');
        const f = Math.sin(t * 9) > 0; R(6, 9, 4, 3, f ? '#ff6a2a' : '#ff9a4a');
        R(4, -1, 7, 4, '#6a7a8a'); R(10, -2, 2, 2, '#6a7a8a');
        R(7, -4 - ((t * 5) % 4), 1, 1, 'rgba(220,220,220,.4)');
      },
      thermos(g, e, t, R) { R(5, 1, 6, 13, '#b03030'); R(5, 1, 6, 2, '#999'); R(6, 0, 4, 1, '#5a3a22'); R(6, 6, 4, 3, '#e8c040'); R(7, 7, 2, 1, '#3a8a3a'); R(5, 13, 6, 1, '#333'); },
      radio(g, e, t, R) {
        bx2(R, 0, 4, 16, 11, '#5a4030');
        bx2(R, 2, -2, 12, 8, '#6a4a2a'); R(3, -1, 5, 6, '#3a2a1a'); for (let y = 0; y < 5; y += 2) R(3, y - 1, 5, 1, '#5a4030');
        R(9, 0, 4, 1, e.power ? '#ffe08a' : '#c8b88a'); R(10, 3, 2, 2, '#222'); R(13, -8, 1, 7, '#aaa');
      },
      pdesk(g, e, t, R) {
        bx2(R, 0, 1, 32, 13, '#5a4a32'); R(1, 2, 30, 2, '#6e5c40');
        R(3, -1, 8, 5, '#1a1a1a'); R(4, -2, 6, 1, '#1a1a1a'); R(6, 0, 3, 2, '#555');
        R(14, 1, 8, 6, '#e8e4d8'); R(15, 3, 6, 1, '#888'); R(15, 5, 4, 1, '#888');
        R(25, -1, 4, 5, '#e8e8e8'); R(26, 0, 2, 1, '#c02020'); R(29, 0, 1, 3, '#e8e8e8');
      },
      radiator(g, e, t, R) { for (let i = 0; i < 6; i++) R(1 + i * 2.5, 2, 2, 12, '#c8c4b8'); R(0, 4, 16, 1, '#a8a498'); R(0, 12, 16, 1, '#a8a498'); }
    },
    tiles: {
      ruinsky: {
        solid: true, paint(R, X, Y) {
          R(0, 0, 16, 16, Y === 0 ? '#161d30' : '#1a2236'); if (Y === 1) R(0, 8, 16, 8, '#202a42');   // 天比废墟亮，剪影才看得出来
          for (let i = 0; i < 2; i++) if (hash(X, Y, 90 + i) < .3) R((hash(X, Y, 95 + i) * 15) | 0, (hash(Y, X, 97 + i) * 12) | 0, 1, 1, '#7a82a0');
          const sil = '#020306', h = hash(X, 0, 91), px = 3 + ((h * 20) | 0) % 7, pw = 4 + (h < .2 ? 2 : 0);
          const arch = X % 7 === 3;
          if (Y === 1) {
            R(0, 11, 16, 5, sil); R((hash(X, 1, 92) * 10) | 0, 8, 6, 3, sil); R((hash(X, 1, 96) * 12) | 0, 9, 3, 2, sil);
            if (h < .5 || arch) { R(arch ? 1 : px, 0, arch ? 4 : pw, 11, sil); if (arch) R(11, 0, 4, 11, sil); }
          } else {
            if (arch) { R(1, 9, 4, 7, sil); R(11, 9, 4, 7, sil); R(1, 7, 14, 3, sil); R(3, 6, 10, 1, sil); R(6, 5, 4, 1, sil); }
            else if (h < .5) { const top = 5 + ((hash(X, 0, 93) * 8) | 0); R(px, top, pw, 16 - top, sil); R(px - 1, top, pw + 2, 2, sil); if (hash(X, 0, 94) < .4) R(px + 1, top - 2, 2, 2, sil); }
          }
        }
      },
      nightsky: {
        solid: true, paint(R, X, Y) {
          R(0, 0, 16, 16, '#090b14');
          if (hash(X, Y, 81) < .3) R((hash(X, Y, 82) * 15) | 0, (hash(X, Y, 83) * 8) | 0, 1, 1, '#454a60');
          const hgt = 9 + Math.sin(X * .45) * 3 + hash(X, 0, 84) * 2;
          R(0, hgt | 0, 16, 16 - (hgt | 0), '#0e1218');
        }
      }
    },
    maps: {
      /* ---------------- 圆明园站 ---------------- */
      stop: {
        amb: 'wind', dark: .8, plr: 2.4, wall: 'concrete', floor: 'asphalt',
        legend: { 'Q': 'ruinsky' },
        tileOpts: { treeC: '#0f1c14', grassC: '#1a261a' },
        rows: [
          'QQQQQQQQQQQQQQQQQQQQQQQQ',
          'QQQQQQQQQQQQQQQQQQQQQQQQ',
          '"T""TT"""T""T"""TT""T"""',
          'ffffffffffffffffffffffff',
          '________________________',
          '::::::::::::::::::::::::',
          '========================',
          '::::::::::::::::::::::::',
          '________________________',
          '________________________',
          'hhhhhhhhhhhhhhhhhhhhhhhh'],
        ents: [
          { id: 'moon', x: 20, y: 0, spr: 'moon', light: { r: 4, dx: -40, dy: 14, col: 'rgba(190,200,255,.14)' } },
          { id: 'poster', x: 9, y: 3, spr: 'poster', col: '#cfc9b6', on: S => S.note('ruins') },
          { id: 'arch', x: 10, y: 3, spr: 'invisible', light: { r: 2.6, dy: -26, col: 'rgba(170,185,235,.10)' }, on: S => S.narr('隔着铁栅栏往里看——大水法的残拱，就剩几根石头架子戳在那儿。\n月亮从石头窟窿里透过来，白惨惨的。') },
          { id: 'lampC', x: 4, y: 4, spr: 'streetlamp', flicker: true, light: { r: 3, col: 'rgba(255,220,150,.10)', flick: true }, on: S => S.narr('马路对过儿的路灯一闪一闪的，灯泡里头吱吱啦啦地响。\n灯光照不到的地方，就是圆明园的围墙。') },
          { id: 'lampD', x: 20, y: 4, spr: 'streetlamp', off: true, light: { r: 3 }, on: S => S.narr('这盏路灯早就不亮了。灯罩让谁拿弹弓打了个窟窿。') },
          { id: 'lampA', x: 4, y: 8, spr: 'streetlamp', light: { r: 4.4, col: 'rgba(255,214,140,.16)' }, on: S => S.narr('路灯杆子上贴满了小广告：治牙、配钥匙、祖传老中医。\n灯底下，几只冻僵了的蛾子还在扑腾。') },
          { id: 'lampB', x: 22, y: 8, spr: 'streetlamp', light: { r: 4, col: 'rgba(255,214,140,.14)' }, on: S => S.narr('灯光被风吹得直晃——不对，是灯杆子在晃。这风，真够劲儿。') },
          { id: 'sign', x: 15, y: 8, spr: 'busstop', async on(S) {
            await S.note('sched');
            if (!S.f.gotChange && S.once('needChange')) { await S.think('……兜里就剩一张大团结了。\n末班车的售票员，准找不开。'); S.goal('把十块钱破开（问问烤白薯摊）'); }
          } },
          { id: 'granny_s', x: 17, y: 9, oy: -3, spr: '@granny', dir: 0, on: grannyStop },   // 排在长椅前头：坐在椅子上也能找她说话
          { x: 16, y: 9, w: 2, spr: 'bench', decal: true, solid: true, on: S => S.narr('站牌底下的长条木椅子，凉得能把人粘住。') },
          { id: 'cart', x: 18, y: 8, w: 2, spr: 'yamcart', light: { r: 3, dx: 22, dy: 2, col: 'rgba(255,140,60,.24)', flick: true }, on: S => S.narr(S.ent('cart').s.out ? '炉子封上了，桶沿儿上还留着一点儿余温。' : '汽油桶改的烤炉，炉膛里的炭火红彤彤的。\n桶沿儿上码着两块白薯，焦皮儿都流糖了。') },
          { id: 'vendor', x: 20, y: 8, spr: '@vendor', dir: 1, on: vendorOn },
          { x: 1, y: 9, spr: 'payphone', on: S => S.narr('公用电话。投币口让人塞了一团口香糖。\n拎起听筒——只有嘟、嘟、嘟的忙音。') },
          { x: 10, y: 9, spr: 'barrel', on: S => S.narr('铁皮垃圾桶，桶沿儿结了一圈冰碴儿。里头扔着半截白薯皮。') },
          { x: 5, y: 9, spr: 'sign', col: '#8a8470', on: S => S.narr('街道的通知，糨子还没干透：\n「接上级通知，本市自十一月十五日起正式供暖。」\n……就差一天。') },
          { id: 'bus', x: -9, y: 7, w: 8, spr: 'bus', hidden: true, light: { r: 4.8, dx: 64, dy: 0, col: 'rgba(255,220,150,.16)' }, async on(S) {
            if (!S.f.busHere) return;
            await S.narr('你踩着踏板上了车。车里比外头暖和不了多少。');
            await S.go('bus', 21, 5, 3);
          } }
        ],
        async enter(S, first) {
          if (!first) return;
          await S.narr('风从圆明园那边刮过来，带着一股子冻土和枯苇子的味儿。\n马路对过儿，黑黢黢的废墟趴在夜里。断了半截的石头柱子，像一排没牙的嘴。');
          await S.think('十点五十二。末班车十一点……可千万别是已经过去了。');
          S.goal('等末班车（先看看站牌）');
        }
      },
      /* ---------------- 末班车车厢 ---------------- */
      bus: {
        amb: 'bus', dark: .6, plr: 2.4, wall: 'bus', floor: 'busfloor',
        rows: [
          '########################',
          '########################',
          '#bbbbbbbbbbbbbbbbbbbbbb#',
          '#bbbbbbbbbbbbbbbbbbbbbb#',
          '#bbbbbbbbbbbbbbbbbbbbbb#',
          '#bbbbbbbbbbbbbbbbbbbbbb#',
          '########################'],
        ents: [
          ...WINS.map(x => ({ id: 'w' + x, x, y: 1, spr: 'buswin', s: { fog: true }, on: x === 22 || x <= 3 ? undefined : S => winOn(S, x) })),
          { id: 'notice', x: 19, y: 1, spr: 'busnotice', on: S => S.narr('车厢里贴着几张告示：「老弱病残孕专座」「请勿与司机交谈」「严禁携带易燃易爆物品」。\n最底下一张褪了色的小纸条：「末班车，过站不候」。') },
          { id: 'plate', x: 21, y: 1, spr: 'plate', on: S => S.narr('前门边上钉着块铁牌子：\n××车队　自编号 4127\n字都让油泥糊得发黑了。') },
          ...TOP.map(x => ({ x, y: 2, spr: 'busseat', decal: true, solid: false, col: '#2f4a66' })),
          ...BOT.map(x => ({ x, y: 5, spr: 'busseat', decal: true, solid: false, col: '#2f4a66' })),
          { x: 11, y: 5, spr: 'busseat', decal: true, solid: false, col: '#5a3a2a' },
          ...[2, 3, 4, 5].map(y => ({ x: 1, y, spr: 'busseat', decal: true, solid: false, col: '#2a3a4c' })),
          { id: 'cl1', x: 19, y: 3, light: { r: 4.6, col: 'rgba(255,220,150,.12)' } },
          { id: 'cl2', x: 12, y: 3, light: { r: 4.6, col: 'rgba(255,220,150,.12)' } },
          { id: 'cl3', x: 6, y: 3, light: { r: 4, col: 'rgba(255,220,150,.08)' } },
          { id: 'cl4', x: 2, y: 3, light: { r: 2.4, col: 'rgba(170,200,255,.08)', flick: true } },
          ...[0, 1, 2, 3].map(k => ({ id: 'lp' + k, x: 0, y: k < 2 ? 2 : 5, light: { r: 2.4, col: 'rgba(255,214,150,.20)', dy: k < 2 ? 2 : 12 } })),
          { id: 'paperB', x: 5, y: 3, spr: 'paper', decal: true, on: S => S.narr('地上散着几张撕剩下的票根儿，让人踩得黑乎乎的。') },
          { id: 'dust', x: 12, y: 4, w: 2, h: 1, spr: 'dust', decal: true, hidden: true, on: dustOn },
          { id: 'frost', x: 2, y: 2, w: 2, h: 4, spr: 'frost', decal: true, hidden: true },
          { id: 'chill', x: 1, y: 2, spr: 'chill', z: 1, solid: false },
          { id: 'pole', x: 7, y: 4, spr: 'pole', solid: false, on: poleOn },
          { id: 'mdoor', x: 12, y: 6, w: 2, spr: 'busdoor', on: S => S.narr('中门关得严严实实，门缝里还是嗖嗖地往里钻风。') },
          { id: 'fdoor', x: 20, y: 6, w: 2, spr: 'busdoor', on: S => S.narr(S.f.phase === 'ride' ? '前门关着。司机没有要开的意思。' : '前门关着。车已经开起来了。') },
          { id: 'driver', x: 22, y: 2, spr: '@driver', dir: 2, async on(S) {
            if (S.f.phase !== 'ride') return S.say('司机', '坐稳喽——末班车，不等人。');
            await S.say('司机', ['……今儿这道儿邪性，路灯坏了一溜儿。', '后头那几位，到站言语一声儿啊——……嘿，问你们呢。', '（他从后视镜里瞅了一眼，又赶紧把眼神儿挪开了）开你的车，别管闲事儿。'][(S.f._dr = ((S.f._dr ?? -1) + 1) % 3)]);
          } },
          { id: 'conductor', x: 11, y: 5, spr: '@cond', dir: 3, on: condOn },
          { id: 'granny', x: 16, y: 5, spr: '@granny', dir: 3, on: grannyBus },
          { id: 'robeA', x: 1, y: 2, spr: '@qingA', dir: 2, hidden: true, on: S => S.narr('……') },
          { id: 'mid', x: 1, y: 3, spr: '@mid', dir: 2, hidden: true, on: S => S.narr('……') },
          { id: 'robeB', x: 1, y: 4, spr: '@qingB', dir: 2, hidden: true, on: S => S.narr('……') }
        ],
        async enter(S, first) {
          if (!first) return;
          S.f.phase = 'board'; S.f.moving = true;
          await S.say('售票员', ['有票儿的出示一下儿，没票儿的买票儿啦——劳驾往里走走！', '小伙子，上哪儿？']);
          await S.say('小王', '香山。');
          await S.say('售票员', '两毛。');
          await S.narr('你从那把毛票里抽出两张一毛的递过去。售票员「嚓」地撕下一张票，往你手里一塞。');
          S.give('ticket'); await S.note('ticket');
          await S.say('司机', '坐稳喽——末班车，不等人。');
          S.face('granny', 'pl');
          await S.say('老太太', '小伙子，找地儿坐呀，站着干嘛，这车晃悠。');
          S.goal('找个座儿坐下');
        },
        step(S, x, y) {
          if (S.f.phase === 'board' && seatAt(x, y)) {
            if (x <= 1) return (async () => { await S.narr('最后一排的灯坏了，黑咕隆咚的，还漏风。\n……还是往前坐吧。'); await S.walk('pl', [5, 3], 5); })();
            return boardEvent(S);
          }
          if (S.f.turning) {   // 抬头倒计时：一坐上座位就自动脸冲前头；坐下以后自己再往左转，才算回头
            if (seatAt(x, y) && x >= 4) {
              if (!S.f.seated) { S.f.seated = true; S.turn(2); S.bubble('pl', '…', 800); S.toast('你坐下了，脸冲前头——别再往左转'); return S.wait(450); }
            } else S.f.seated = false;
          }
          if ((S.f.phase === 'ride') && x <= 3) return tooClose(S);
        },
        tick(S, dt) {
          if (S.f.moving !== false) { BUSPH += dt * V; if (!W.busy && Math.random() < dt * .12) S.shake(220, 1); }
          for (let k = 0; k < 4; k++) { const e = S.ent('lp' + k); if (e) e.px = mod(LPB[k] - BUSPH, 384) - 16; }
          const p = S.pl, ch = S.ent('chill');
          /* 抬头倒计时：画面和声音跟着一步步变 */
          if (S.f.turning && W.timer && !W.busy) {
            const left = W.timer.left;
            if (turnStage < 1 && left <= 4) { turnStage = 1; S.ent('mid').spr = '@midHalf'; S.sfx('tick'); S.bubble('mid', '…', 1200); }
            if (turnStage < 2 && left <= 2) { turnStage = 2; S.sfx('tick'); S.shake(150, 1); S.dark(.75); }
            if (S.f.seated && p.dir !== 1 && (whispT -= dt) <= 0) { whispT = 2.2; S.sfx('whisper'); }
          }
          const busy = W.busy || S.f.phase !== 'ride' || S.f.turning;
          if (busy) stare = 0;
          else if (p.dir === 1 && p.x <= 13) {
            /* 朝后排看：镜头往后排拉，「盯着看」就真的是在看 */
            camOn = true; S.focus(Math.min((p.x + 1) / 2, p.x), 3);
            stare += dt * (S.moving ? .35 : 1);
            if (!S.f.stareWarned) { if (stare > 2) { S.f.stareWarned = true; stare = 0; S.after(0, stareWarnScript); } }
            else {
              if (stare > 2.4 && !stareWarn) { stareWarn = true; S.sfx('heart'); S.bubble('mid', '…', 1500); S.toast('后排……又在看你了'); }
              if (stare > 5) { stare = -99; S.after(0, caughtStare); }
            }
          } else {
            if (camOn) { camOn = false; S.focus(null); }
            stare = Math.max(0, stare - dt * 1.5); if (stare === 0) stareWarn = false;
          }
          /* 越盯越暗；给观看的一方同步寒气 */
          const sv = Math.max(0, stare);
          if (sv > 0 && !busy) { stDark = true; S.dark(Math.min(.9, .6 + sv * .06)); }
          else if (stDark) { stDark = false; if (!S.f.turning) S.dark(null); }
          if (ch) { const v = Math.round(sv * 10); if ((ch.s.st || 0) !== v) ch.s.st = v; }
        }
      },
      /* ---------------- 夜路 ---------------- */
      road: {
        amb: 'wind', dark: .9, plr: 1.2, wall: 'concrete', floor: 'asphalt',
        legend: { 'G': 'nightsky' },
        tileOpts: { treeC: '#0f1a12', grassC: '#18221a' },
        rows: [
          'GGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGG#######',
          'TTPTTTPTTTTPTTTPTTTTPTTTTPTTTTPTT#######',
          'hhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhh#######',
          '________________________________________',
          '________________________________________',
          '::::::::::::::::::::::::::::::::::::::::',
          '========================================',
          '::::::::::::::::::::::::::::::::::::::::',
          '""""""""""""""""""""""""""""""""""""""""',
          'TTTPTTTTPTTTTTPTTTTPTTTTPTTTTTPTTTTPTTTT'],
        ents: [
          ...LAMPS.map(([id, x, y], i) => ({ id: 'pool' + (i + 1), x, y: 3, ly: y, spr: 'pool', decal: true, solid: false })),
          ...LAMPS.slice(0, 4).map(([id, x, y]) => ({ id, x, y, spr: 'streetlamp', flicker: id === 'l3', light: { r: 2.6, a: .5, col: 'rgba(255,214,140,.18)' }, on: S => S.narr(id === 'l3' ? (S.f.l3dead ? '灯泡黑着。凑近了，能闻见一股子焦糊味儿。' : '这盏灯一会儿亮一会儿灭，灯丝儿嗞嗞地响。') : '路灯底下一圈昏黄的光，边儿上齐齐整整的。\n光圈外头，什么都看不见。') })),
          { id: 'l7', x: 37, y: 2, spr: 'polamp', light: { r: 2.6, a: .5, col: 'rgba(255,90,70,.18)' }, on: S => S.narr('门口挂着一盏红灯。在这黑地里，比什么都亲。') },
          { x: 34, y: 2, spr: 'window', lit: true, on: S => S.narr('窗户里亮着灯。有人。') },
          { x: 38, y: 2, spr: 'window', lit: true, on: S => S.narr('窗台上搁着个搪瓷缸子。') },
          { id: 'psign', x: 35, y: 2, spr: 'psign', on: S => S.narr('白底黑字的竖牌子：××派出所。') },
          { id: 'pdoor', x: 36, y: 2, spr: 'door', col: '#4a5a4a', async on(S) {
            for (const id of ['ghost', 'ghost2']) { const g = S.ent(id); if (g) { S.stop(id); g.hidden = true; } }
            S.sfx('open'); S.lights(null);
            await S.go('police', 6, 7, 3);
          } },
          { x: 30, y: 3, spr: 'sign', col: '#2a4a6a', on: S => S.narr('路牌让风刮歪了：前方二百米，派出所。') },
          { id: 'rbus', x: 0, y: 5, w: 8, spr: 'bus', open: true, light: { r: 4.4, dx: 64, dy: 0, col: 'rgba(255,220,150,.14)' } },
          { id: 'granny_r', x: 7, y: 4, spr: '@granny', dir: 2, async on(S) {
            S.face('granny_r', 'pl');
            await S.say('老太太', S.ent('ghost').hidden ? '往前走，过了这片林子就是派出所。' : ['别回头！挨着灯走！', '黑地儿里别停！跑！'][(S.f._gr = ((S.f._gr ?? -1) + 1) % 2)]);
          } },
          { id: 'ghost', x: 7, y: 4, spr: '@qingA', hidden: true, solid: false, light: { r: 1.3, col: 'rgba(190,215,255,.10)' } },
          { id: 'ghost2', x: 22, y: 8, spr: '@qingB', hidden: true, solid: false, light: { r: 1.3, col: 'rgba(190,215,255,.10)' } }
        ],
        async enter(S, first) {
          if (!first) return;
          S.f.busLeave = true;
          await S.narr('车门在身后「嗤」地关上了。\n末班车晃晃悠悠地开走了，两盏红尾灯越来越小。');
          S.face('granny_r', 'pl');
          await S.narr('老太太还死死攥着你的手腕子。等车开远了，她才一下子松开，腿一软，差点儿坐在马路牙子上。');
          await S.say('小王', '大妈！您到底什么意思？我真没偷您钱包！');
          await S.say('老太太', ['我知道你没偷。', '钱包好好儿在我怀里揣着呢。']);
          await S.say('小王', '那您——');
          await S.say('老太太', '你没瞅见？');
          await S.wait(500); S.sfx('whisper');
          await S.say('老太太', ['那仨人……没有脚。', '车门一开，风一吹，袍子底下——是空的！']);
          await S.think('……原来不是看花了眼。');
          await S.say('老太太', ['中间那个，早就没气儿了。让那俩一边一个架着……', '我活了七十多年，什么没见过。我要是不这么闹，能把你拽下来吗？']);
          if (S.f.yamGiven) await S.say('老太太', '（她从怀里掏出那块白薯，还温乎着）……你这孩子心眼儿好。我总不能眼瞅着你跟他们走。');
          await S.say('小王', '……那车上还有司机跟售票员呢！');
          await S.say('老太太', '所以得上派出所！往前，过了这片林子就是。走！');
          S.follow('granny_r', true);
          S.goal('跟老太太去派出所（沿着路往东走）');
          S.cp('road');
        },
        step(S, x, y) { if (x >= 10 && S.once('busBack')) return busBack(S); },
        tick(S, dt) {
          if (S.f.busLeave) { const b = S.ent('rbus'); b.px += dt * 7 * TS; b.x = Math.round(b.px / TS); if (b.px > 41 * TS) { S.f.busLeave = false; b.hidden = true; } }
          flickT -= dt;
          if (!S.f.l3dead && flickT <= 0) { const l = S.ent('l3'); if (l) { l.off = !l.off; S.ent('pool3').off = l.off; flickT = l.off ? .6 + Math.random() * .6 : 1.4 + Math.random() * 1.2; } }
          const lk = LAMPS.map(([id]) => S.ent(id).off ? 0 : 1).join('');
          if (W._rlk !== lk || !W.extraLights) { W._rlk = lk; roadLights(S); }
          const p = S.pl, pl = lit(p.x, p.y);
          let dmin = 99, gDark = false;
          for (const [id, lk2] of [['ghost', lurk], ['ghost2', lurk2]]) {
            const g = S.ent(id); if (!g || !g.chase || g.hidden) continue;
            g.chase.wait = 1;
            if (!W.busy && !g.mv) {
              if (pl) { g._react = .15; lk2(S, g); }
              else if ((g._react = (g._react ?? 0) - dt) <= 0) hunt(S, g);
            }
            const d = Math.abs(g.px / TS - p.px / TS) + Math.abs(g.py / TS - p.py / TS);
            if (d < dmin) { dmin = d; gDark = !lit(Math.round(g.px / TS), Math.round(g.py / TS)); }
          }
          /* 声音：鬼在黑处离你越近，耳边的动静越急；第一次踏进一段黑路，远处传来一声车门的「嗤」 */
          if (dmin < 99 && !W.busy) {
            nearT -= dt; heartT -= dt;
            if (gDark && dmin < 3 && heartT <= 0) { heartT = .6; S.sfx('heart'); S.shake(120, 1); }
            else if (gDark && dmin < 5 && nearT <= 0) { nearT = 1.2; S.sfx('whisper'); }
            if (!pl) { const seg = p.x < 10 ? 'a' : p.x < 25 ? 'b' : 'c'; if (S.once('dk_' + seg)) S.sfx('open'); }
          }
        }
      },
      /* ---------------- 派出所 ---------------- */
      police: {
        amb: 'fire', dark: .5, plr: 3, wall: 'plain', floor: 'linoleum', wallC: { face: '#a9aa98', trim: '#3d5e45' },
        rows: [
          '##############',
          '##############',
          '#nnnnnnnnnnnn#',
          '#nnnnnnnnnnnn#',
          '#nnnnnnnnnnnn#',
          '#nnnnnnnnnnnn#',
          '#nnnnnnnnnnnn#',
          '#nnnnnnnnnnnn#',
          '######n#######'],
        ents: [
          { x: 2, y: 1, w: 2, spr: 'banner', on: S => S.narr('墙上一条红布横幅，白字儿：为人民服务。\n边角让炉子熏黄了。') },
          { x: 5, y: 1, spr: 'wallmap', on: S => S.narr('海淀区的地图，玻璃镜框里压着。\n你找到了圆明园，又顺着那条公交线往西找香山——\n地图上，那一段路边上用红铅笔打了好几个小叉。没写是什么。') },
          { x: 8, y: 1, spr: 'calendar', on: S => S.narr('挂历翻在十一月。十四号那天让人用圆珠笔圈了个圈，旁边写着：「供暖」，又划掉了，改成十五。') },
          { x: 10, y: 1, spr: 'wallclock', on: S => S.narr('十一点四十一。秒针一下一下地走。\n你从没觉得秒针的声音这么好听。') },
          { x: 11, y: 1, spr: 'window', on: S => S.narr('窗外黑漆漆的。你没敢多看。') },
          { id: 'cop', x: 6, y: 2, spr: '@cop', dir: 0, on: S => statement(S) },
          { id: 'pdesk', x: 5, y: 3, w: 2, spr: 'pdesk', on: S => statement(S) },
          { id: 'ledger', x: 9, y: 3, spr: 'desk', col: '#5a4a32', async on(S) { if (S.once('ledger')) await S.narr('小桌上摊着值班记录本。民警的字跟狗刨的似的。'); await S.note('log'); } },
          { id: 'stove', x: 11, y: 4, spr: 'coalstove', light: { r: 3.4, col: 'rgba(255,130,60,.2)', flick: true }, on: S => S.narr('蜂窝煤炉子，铁壶在上头咕嘟咕嘟地响。\n你把手伸过去烤——手指头半天才缓过来。') },
          { x: 12, y: 2, spr: 'thermos', on: S => S.narr('印着牡丹花的铁皮暖壶。值班的长夜，全靠它了。') },
          { id: 'granny_p', x: 3, y: 5, oy: -3, spr: '@granny', dir: 0, async on(S) {
            S.face('granny_p', 'pl');
            if (S.f.statement) return S.say('老太太', '……孩子，你先回吧。我在这儿烤烤火，等天亮再走。我这把老骨头，可不敢再走夜路了。');
            await S.say('老太太', ['跟他说！把你瞧见的都跟他说！', '窗户上的哈气、那几个大钱、袍子底下……你都瞧见了，一样一样跟他说！', '车号、那仨人哪儿上来的——你都记着呢吧？'][(S.f._gp = ((S.f._gp ?? -1) + 1) % 3)]);
          } },
          { x: 2, y: 5, w: 2, spr: 'bench', decal: true, solid: true, on: S => S.narr('靠墙的长条凳，磨得锃亮。') },   // 老太太排在前头，长凳当地面画
          { id: 'bulb', x: 6, y: 4, light: { r: 5.5, col: 'rgba(255,230,170,.10)' } },
          { id: 'pexit', x: 6, y: 8, spr: 'invisible', solid: false, async touch(S) {
            if (!S.f.statement) { await S.narr('笔录还没做完。民警抬头瞪了你一眼。'); await S.walk('pl', [6, 7], 5); S.turn(3); return; }
            await nightEnd(S);
          } }
        ],
        async enter(S, first) {
          if (!first) return;
          S.ent('cop').dir = 0;
          await S.narr('派出所里生着个煤球炉子，屋里一股子烟味儿。\n值班的民警趴在桌上，睡得正香。');
          S.bubble('cop', '…', 1200);
          await S.say('老太太', '同志！同志！醒醒！出人命啦！', { style: 'big' });
          S.bubble('cop', '!', 900);
          await S.say('民警', '嚯……！大妈，您这一嗓子……什么事儿，您慢慢说。');
          await S.say('老太太', ['末班车！三七五的末班车上，有仨人，穿着清朝的衣裳——', '没脚！他们没脚！风一吹，袍子底下是空的！', '车上还有司机跟售票员呐！你们快派人去追呀！']);
          await S.say('民警', ['清朝的……？', '大妈，颐和园那边儿这礼拜有个剧组，拍辫子戏的，天天折腾到后半夜。您老是看岔了吧？']);
          await S.say('老太太', '我七十三了！我眼睛还没花呢！');
          S.face('cop', 'pl');
          const r = await S.ask('民警转过脸来看你：「你呢？你也看见了？」', ['……看见了。袍子底下，是空的。', '我……我没看清。可那车上肯定不对劲。'], '小王');
          await S.say('民警', r ? '没看清你就跟着瞎跑……' : '……');
          await S.say('民警', '（叹了口气）得，来都来了。过来，我给你们做个笔录。');
          S.f.policeIntro = true;
          S.goal('找民警做笔录');
        }
      },
      /* ---------------- 小王家 ---------------- */
      home: {
        amb: 'room', dark: .55, plr: 3, wall: 'plain', floor: 'concrete', wallC: { face: '#bdb6a2', trim: '#6a5a44' },
        rows: [
          '############',
          '############',
          '#xxxxxxxxxx#',
          '#xxxxxxxxxx#',
          '#xxxxxxxxxx#',
          '#xxxxxxxxxx#',
          '#xxxxxxxxxx#',
          '############'],
        ents: [
          { id: 'bed', x: 1, y: 2, h: 2, spr: 'bed', col: '#4a5a7a', async on(S) {
            if (!(S.f.radio && S.f.paperRead)) return S.narr('躺不住。一闭眼，就是那三张煞白的脸。');
            if (S.f.visit) return S.narr('被窝冰凉。');
            return visit(S);
          } },
          { x: 3, y: 1, spr: 'window', on: S => S.narr('窗外是筒子楼的院子。天擦黑了，各家各户都亮了灯，楼道里一股子熬白菜的味儿。') },
          { x: 5, y: 1, spr: 'calendar', on: S => S.narr('挂历翻在十一月。十四号那一格，你什么也没写。') },
          { id: 'door_h', x: 9, y: 1, spr: 'door', on: S => S.narr('筒子楼的木门，门框上贴着去年的春联，红纸都褪成粉的了。') },
          { id: 'desk_h', x: 6, y: 2, spr: 'desk', on: S => S.narr(S.has('coin') ? '抽屉里……搁着那枚大钱。\n你把它扔进去以后，就再没敢拉开过。' : '书桌上摊着单位的图纸，一个字也看不进去。\n手指头搁在桌面上，还是凉的。') },
          { id: 'radio', x: 7, y: 2, spr: 'radio', async on(S) {
            S.ent('radio').power = true; S.sfx('tv');
            await S.narr('你拧开收音机。咝咝啦啦一阵杂音，然后是播音员字正腔圆的声音——');
            await S.say('收音机', ['……下面播送本市新闻。', '昨天深夜，一辆末班公共汽车在运营途中失去联系，至今未回场。车上的司机和售票员下落不明。', '有关部门正在组织力量全力寻找。请知情群众提供线索……']);
            S.ent('radio').power = false;
            await S.think('……昨天夜里。\n是那趟车。');
            S.f.radio = true; homeGoal(S);
          } },
          { x: 10, y: 2, spr: 'thermos', on: S => S.narr('暖壶里的水早凉了。') },
          { id: 'paperH', x: 8, y: 2, spr: 'newspaper', async on(S) {
            if (S.once('paperH')) await S.narr('门缝底下塞进来半张晚报，是对门儿王大妈看完了给你的。');
            await S.note('paper');
            S.f.paperRead = true; homeGoal(S);
          } },
          { x: 10, y: 4, spr: 'radiator', on: S => S.narr('暖气片烫手。屋里暖烘烘的。\n可你还是觉得冷，冷气是从骨头缝里往外冒的。') },
          { x: 4, y: 4, w: 2, spr: 'table2', col: '#6a4a30', on: S => S.narr('饭桌上扣着一个碗，碗底下是早上没吃完的馒头。') },
          { x: 1, y: 6, spr: 'sink', on: S => S.narr('脸盆架上的搪瓷盆，盆底印着一对鸳鸯。') },
          { x: 10, y: 6, spr: 'lamp', light: { r: 4.4, col: 'rgba(255,200,130,.16)' } },
          { id: 'cop_h', x: 9, y: 2, spr: '@cop', dir: 0, hidden: true }
        ],
        async enter(S, first) {
          if (!first) return;
          await S.narr('醒来的时候，窗外已经黑透了。\n楼道里有人在剁白菜，收音机里放着京剧——就好像昨天晚上的事儿，从来没发生过。');
          S.goal('听听收音机，看看报纸');
        }
      }
    }
  });

  function homeGoal(S) { S.goal(S.f.radio && S.f.paperRead ? '躺下歇会儿吧' : !S.f.radio ? '听听收音机' : '看看门口的报纸'); }

  async function statement(S) {
    S.face('cop', 'pl');
    if (!S.f.policeIntro) return;
    if (S.f.statement) { await S.say('民警', ['回吧回吧，有信儿我们找你。', '（他打了个哈欠，又往炉子里添了块煤）'][(S.f._cp = ((S.f._cp ?? -1) + 1) % 2)]); return; }
    if (S.once('stmtStart')) await S.say('民警', '叫什么？……小王是吧。行，我问，你答。');
    if (!S.f.q1) {
      /* 对证：车上收集的线索在这儿派上用场。要说出两条站得住的 */
      const OPTS = [['breath', '车窗上，就他们跟前没哈气'], ['coins', '给的钱是咸丰年间的大钱'], ['robe', '袍子底下看不见脚'], ['clothes', '他们穿着清朝的衣裳']];
      if (S.f.c_dust) OPTS.splice(3, 0, ['dust', '门口的浮土上，没有他们的脚印']);
      const got = S.f.q1got = S.f.q1got || [];
      if (!got.length) await S.say('民警', '圆明园，二十三点，末班……嗯。我先问你——');
      while (got.length < 2) {
        const a = await S.ask(got.length ? '「还有呢？光凭这一条，我可没法往上写。」' : '「穿清朝衣裳的多了，你凭什么说他们不是人？」', OPTS.map(o => o[1]), '民警');
        const k = OPTS[a][0];
        if (k === 'clothes') { await S.say('民警', ['穿戏服的多了。颐和园那剧组，一水儿的长袍马褂。', '……想好了再说。']); if (S.once('q1hint')) await S.say('老太太', '（在一边儿直跺脚）你在车上不是瞧见了吗！窗户、钱、袍子底下——', { style: 'whisper' }); return; }
        if (got.includes(k)) { await S.say('民警', '这条你说过了。'); continue; }
        got.push(k);
        if (k === 'breath') await S.say('民警', ['……没哈气？', '（他下意识地朝窗户玻璃哈了口气，白了一片）……接着说。']);
        else if (k === 'robe') await S.say('民警', '（笔尖儿顿了一下）看不见脚……行，我记上。');
        else if (k === 'dust') { await S.say('民警', '……一个都没有？'); await S.say('老太太', '没有！我也瞧见了！'); }
        else if (k === 'coins') {
          if (S.has('coin')) {
            S.take('coin'); S.f.coinGiven = true; S.sfx('ding');
            await S.narr('你把那枚大钱掏出来，搁在他桌上。');
            await S.say('民警', ['（他捏起来翻过来掉过去地看，拿指头肚儿摸了摸）', '……这么凉。', '这东西我先收着，算证物。']);
          } else await S.say('民警', ['大钱呢？……没拿？', '空口无凭啊。……得，我先记上一笔。']);
        }
      }
      S.f.q1 = true;
      await S.say('民警', '……行。这两条我都记上了。往下问。');
    }
    if (!S.f.q2) {
      await S.say('民警', '车号呢？前门边上铁牌子上有，四位数的自编号。');
      const v = await S.keypad('车辆自编号（四位）', ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'], 4);
      if (v !== '4127') {
        if (v == null) { await S.say('民警', '想不起来？想起来再说。'); return; }
        S.f.q2fail = (S.f.q2fail || 0) + 1;
        await S.say('民警', '这号……我怎么觉着不对呢。你再想想。');
        if (S.f.q2fail >= 2) await S.say('老太太', '四一二七！我瞅得真真儿的，前门边儿上那铁牌子！车身上也刷着呢！');
        return;
      }
      S.f.q2 = true;
      await S.say('民警', '四一二七……记上了。');
    }
    if (!S.f.q3) {
      const a = await S.ask('「那三个人，在哪儿上的车？」', ['圆明园站，跟我一块儿上的。', '半道儿上——没站的地方，路边招手上来的。', '他们一直就在车上。'], '民警');
      if (a !== 1) { await S.say('老太太', '不对不对！是半道儿上！车停在黑地儿里，他们自个儿招手上来的！'); return; }
      S.f.q3 = true;
    }
    await S.narr('民警写完最后一行，把笔一撂，拿起了桌上的电话。');
    S.sfx('phone'); await S.wait(900);
    await S.say('民警', ['喂？调度吗？我这儿是派出所。问一下，末班儿那趟，四一二七，回场了没有？', '……还没回？', '……嗯，嗯。行，回来了给我们来个电话。']);
    await S.say('民警', ['调度说车还没回场。兴许是司机直接开回家了——这事儿常有。', '行了，笔录我收着了。这么晚了，你们回吧。真有什么事儿，我们找你们。']);
    S.face('granny_p', 'pl');
    await S.say('老太太', '……孩子，你先回吧。我在这儿烤烤火，等天亮再走。');
    S.f.statement = true;
    S.goal('回家（出门在下面）');
    S.cp();
  }

  async function nightEnd(S) {
    await S.fade(1, 800);
    await S.card('第二天　傍晚', '1995年11月15日', '暖气来了。\n\n小王一路跑回家，连衣服都没脱，\n蒙着被子，一觉睡到了天黑。');
    await S.go('home', 3, 4, 0);
  }

  async function visit(S) {
    S.f.visit = true;
    await S.narr('你和衣躺下，盯着天花板。');
    await S.fade(1, 900);
    await S.card('三天以后', '1995年11月18日　晚上', '');
    S.pos(7, 4, 3);
    await S.fade(0, 600);
    S.sfx('knock'); await S.wait(400); S.sfx('knock'); await S.wait(400); S.sfx('knock');
    await S.narr('有人敲门。');
    S.ent('door_h').open = true; S.sfx('open'); S.hide('paperH');
    S.show('cop_h'); S.face('cop_h', 'pl'); S.face('pl', 'cop_h');
    await S.say('民警', ['……还记得我吧？那天晚上值班儿的，姓刘。', '车，找着了。']);
    const r = await S.ask('「在哪儿？」', ['在哪儿找着的？', '……人呢？'], '小王');
    await S.say('民警', r ? '……你先听我说完。' : '你先听我说完。');
    await S.say('民警', ['在一百多里地外头，一个水库里。打捞队折腾了一整天才拽上来。', '司机、售票员……都在车上。']);
    await S.narr('他顿了一下，从兜里摸出根烟，没点，在手指头间来回捻。');
    await S.say('民警', ['车上还有三个。', '……三具尸首。烂得都没人形儿了。法医说，少说也死了有些日子了。', '可你们那天晚上，是跟他们一块儿坐的车。']);
    await S.say('民警', ['还有个事儿，你听了就忘了吧。', '那车的油箱里，一滴油都没有。']);
    S.sfx('drip'); await S.wait(900);
    await S.say('民警', '灌满了的，是血。', { style: 'whisper' });
    await S.narr('暖气片「当」地响了一声。\n谁也没说话。');
    await S.say('民警', ['一辆车，油箱里没有油，是怎么开出去一百多里地的？', '……我干了十年民警，头一回不知道这笔录该怎么写。']);
    if (S.f.coinGiven) await S.say('民警', ['还有你交给我那枚大钱。', '我锁在办公桌抽屉里了。第二天一早拉开——', '……就剩一小摊水。腥的。']);
    await S.say('民警', ['那老太太托我给你带句话。', '她说：「以后啊，别坐末班车了。」']);
    if (S.f.yamGiven) {
      await S.say('民警', ['对了，她还让我捎个东西。', '她说，那块白薯她揣到天亮都没舍得吃。']);
      await S.narr('他从兜里摸出一张叠成小方块儿的烟盒纸，递给你。');
      await S.note('granny');
    }
    await S.say('小王', '……她怎么就看出来了？我跟她坐了一道儿，我什么都没瞧出来。');
    await S.say('民警', '我也问她了。她就说了一句——');
    await S.say('民警（学着老太太的口气）', '「大冷的天儿，车门口全是土。那仨人上车，地上连一个脚印儿都没留下。」');
    if (S.f.c_dust) { await S.say('小王', '……我也瞧见了。'); await S.narr('民警看了你一眼，没说话。'); }
    await S.say('民警', ['这个你留着吧。笔录跟值班记录的复印件。', '……按说不该给你。可我总觉着，这事儿得有个人记着。']);
    S.give('logcopy'); await S.note('log2');
    await S.narr('民警走了。楼道里的脚步声越来越远。');
    S.hide('cop_h'); S.ent('door_h').open = false; S.sfx('close');
    await S.wait(500);
    const coin = S.has('coin') || S.f.coinGiven;
    if (S.has('coin')) {
      await S.narr('你拉开抽屉。那枚大钱还在里头。');
      S.sfx('drip');
      await S.narr('「咸丰重宝」。\n抽屉里干干爽爽的，它却是湿的。\n凑近了闻——一股子水底下烂水草的腥味儿。');
    } else if (S.f.coinGiven) {
      await S.narr('你坐在床沿上，半天没动。\n……书桌抽屉里，「嗒」地响了一声。');
      S.sfx('drip'); await S.wait(600);
      await S.narr('你拉开抽屉。\n那枚大钱，就躺在里头。湿漉漉的，方孔里还挂着一根水草。');
      S.give('coin');
    } else {
      await S.narr('你和衣躺下，迷迷糊糊地睡着了。');
      S.dark(.85); S.sfx('car'); await S.wait(800);
      await S.narr('梦里，一辆公交车贴着楼底下开过去，车里的灯黄澄澄的。\n一只手从车窗里伸出来，手心里攥着三枚大钱。');
      await S.say('售票员', '小伙子——你的钱掉了。', { style: 'whisper' });
      S.sfx('ding');
    }
    await S.wait(400);
    await S.narr('多年以后，你在网上看见一篇帖子。');
    await S.note('bbs');
    await S.fade(1, 1200);
    await S.end({ title: '第六夜　完', text: (coin ? '后来，小王用报纸把那枚大钱包好，扔进了昆明湖。\n' : '后来，小王每回听见钢镚儿掉在地上的声音，都要愣上半天。\n') + '他再也没有坐过末班车。\n\n只是每年入冬，头一场大风刮起来的夜里，\n他都会梦见一辆亮着灯的公交车，\n停在没有站牌的路边，车门开着。\n售票员探出头来，冲他招手：\n\n「小伙子，上来吧——就等你一个了。」' });
  }
})();
