/* ================= 第十二夜 · 飞翔的荷兰人 ================= */
(() => {
  /* ---------- 地图生成小工具 ---------- */
  const G = (w, h, c) => Array.from({ length: h }, () => Array(w).fill(c));
  const F = (g, x0, y0, x1, y1, c) => { for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) g[y][x] = c; };
  const ROWS = g => g.map(r => r.join(''));

  /* 海燕号甲板：30×15，船头朝西（左），船尾朝东；左舷（北）外头留四行海面给那条船 */
  function deckRows() {
    const g = G(30, 15, '~');
    const span = { 4: 6, 5: 4, 6: 2, 7: 1, 8: 0, 9: 1, 10: 2, 11: 4, 12: 6 };
    for (const y in span) { const a = span[y]; for (let x = a; x <= 28; x++) g[y][x] = 'B'; }
    for (let y = 5; y <= 11; y++) for (let x = span[y] + 1; x <= 27; x++) g[y][x] = x >= 22 ? 'l' : 'w';
    return ROWS(g);
  }
  /* 舱下：水手舱 / 帆舱（舱梯）/ 船长室 */
  function belowRows() {
    const g = G(26, 9, '#');
    F(g, 1, 2, 24, 7, 'w');
    for (let y = 2; y <= 7; y++) { if (y !== 5) { g[y][8] = '#'; g[y][15] = '#'; } }
    return ROWS(g);
  }
  /* 开普角外海：76×16，自东向西 —— 北边是悬崖和灯塔，海里一道一道的礁石口 */
  function seaRows() {
    const g = G(76, 16, 'o');
    F(g, 0, 0, 75, 1, 'Y');
    for (let x = 0; x < 76; x++) if (hash(x, 2, 11) < .45) g[2][x] = 'Y';
    F(g, 28, 2, 36, 4, 'Y'); F(g, 30, 5, 34, 5, 'Y');   // 岬角
    F(g, 0, 15, 75, 15, '~');
    F(g, 62, 3, 63, 9, 'X');
    F(g, 54, 8, 55, 14, 'X');
    F(g, 45, 3, 46, 6, 'X'); F(g, 45, 11, 46, 14, 'X');
    F(g, 33, 6, 34, 10, 'X');
    F(g, 24, 9, 25, 14, 'X');
    F(g, 14, 3, 15, 7, 'X'); F(g, 14, 12, 15, 14, 'X');
    for (const [x, y] of [[66, 12], [58, 11], [50, 5], [40, 12], [38, 4], [29, 8], [20, 10], [10, 6], [8, 12], [69, 4], [42, 9]]) g[y][x] = 'X';
    return ROWS(g);
  }

  /* ---------- 声音（一拍一拍排：预排的 S.tone 停不下来，所以放进 BQ，章节 tick 到点才发） ---------- */
  let BQ = [];
  const bq = (after, fn) => BQ.push({ at: W.t + after, fn });
  function ding(S, ghost, vol) {
    if (ghost) { S.tone('sine', 742, 734, 2.4, vol, 0, 1500); S.tone('sine', 1109, 1100, 1.5, vol * .3, 0, 1300); S.tone('triangle', 371, 368, 2.6, vol * .45, 0, 600); }
    else { S.tone('sine', 1046, 1046, 1.8, vol); S.tone('sine', 2093, 2093, .9, vol * .28); S.tone('triangle', 523, 523, 1.4, vol * .35, 0, 1800); }
  }
  /* 船钟的敲法：两下一组，单的一下落在最后 */
  function bellTimes(n) { const ts = []; let t = 0; for (let i = 0; i < n; i++) { ts.push(t); t += i % 2 === 0 ? .42 : 1.0; } return ts; }
  function ghostBells(n, vol = .05, d0 = 0) { for (const t of bellTimes(n)) bq(d0 + t, S => ding(S, true, vol)); }
  const bellLen = n => bellTimes(n)[n - 1] + 1.2;
  function thunder(S, big) { S.fx('flash'); S.sfx('thud'); S.tone('sawtooth', 48, 28, 1.8, big ? .12 : .07, .08, 170); S.shake(500, big ? 3 : 2); }
  const creak = S => S.tone('sawtooth', 130 + Math.random() * 40, 88, .7, .014, 0, 420);
  const SHANTY = [[294, 1], [349, 1], [440, 2], [392, 1], [349, 1], [330, 2], [294, 1], [330, 1], [349, 1], [392, 1], [440, 3], [0, 3]];

  /* ---------- 状态（剧本外的计时器；重来时 reset） ---------- */
  let DEATHS = 0, SCARED = {};
  let DT = { gb: 4, sh: 0, si: 0, cr: 3 };
  const TBOAT = 140;            // 小艇从雾里漂到舷边的秒数
  const SEA = { spd: .62, torn: .55, gspd: 1.75, gap: 12, start: [70, 8] };
  const GUSTS = [3, 7, 6.5, 8, 7, 7.5, 6.5, 8, 7, 7.5];
  let ST = null;
  const newST = () => ({ gi: 0, next: GUSTS[0], ph: 0, pt: 0, hit: false, spawned: false, done: false, lt: 5, beam: 0, hb: 0 });
  const setWx = (S, o) => { const e = getEnt('wx', 'deck'); if (e) Object.assign(e.s, o); };

  /* ================= 黄昏：甲板与舱下 ================= */
  async function duskIntro(S) {
    await S.narr('海燕号在浪里一起一伏。\n天边压着一线铅灰色的云，太阳沉下去的地方，红得发紫。');
    S.face('mate', 'pl');
    await S.say('柯林斯', '杰米！别傻站着。老奈德在船头补帆，去给他搭把手。');
    S.goal('去船头找补帆匠老奈德');
  }
  async function nedTalk(S) {
    const f = S.f;
    S.face('ned', 'pl');
    if (f.phase === 'fog') return nedFog(S);
    if (f.phase === 'aboard') return S.say('老奈德', f.belling ? '他在等换班。……钟在前桅边上。' : '别看我。看他。', { style: 'whisper' });
    if (!f.ned1) {
      f.ned1 = true;
      await S.say('老奈德', '来了，小子。帮我拽着这头，别松手。');
      await S.say('老奈德', '十九天了，天天顶风。老辈人管这儿叫「风暴角」——好望角是后来改的名。名字改得了，风改不了。');
      const r = await S.ask('老奈德咬断一根线头。', ['这片海……是不是闹鬼？', '（专心拽帆布）'], '杰米');
      if (r === 0) {
        await S.say('老奈德', '汤姆那张大嘴巴。……有条荷兰船，两百多年前的。船长叫范德德肯，从东印度回阿姆斯特丹，就在这儿顶风，九个礼拜也没绕过去。');
        await S.say('老奈德', '他站在甲板上发誓：老天爷也好，魔鬼也好，就是跑到世界末日，他也要绕过这个角。\n——他的愿应了。他到今天还在绕。');
      } else await S.narr('老奈德没再说话，嘴里哼起一支老调子。针脚又密又直。');
      await S.say('老奈德', '我那个帆布包里有个本子，记着风暴角的老规矩。你识字，替我看看还认得不。');
      S.face('mate', 'pl');
      await S.say('柯林斯', '杰米！下舱去，到船长室看一眼晴雨表，回来报给我！');
      S.goal('下舱（主桅后面的舱口），到船尾的船长室看晴雨表');
      return;
    }
    const L = ['要是夜里听见有人哼歌，那是我。要是听见别的什么……就当没听见。', '帆布是船的皮。皮破了能补，命破了可补不上。', '晴雨表看了没有？大副那张脸，比天还黑。'];
    await S.say('老奈德', L[(f._nl = ((f._nl ?? -1) + 1) % L.length)]);
  }
  async function mateTalk(S) {
    const f = S.f;
    S.face('mate', 'pl');
    if (f.phase === 'dusk') {
      if (f.baro) return stormStart(S);
      if (f.ned1) return S.say('柯林斯', '还愣着？下去看晴雨表！主桅后头那个舱口。');
      return S.say('柯林斯', '去船头帮老奈德。这风再不转，前桅的帆就得换第三回了。');
    }
    if (f.phase === 'fog' || f.phase === 'aboard') return S.say('柯林斯', ['……我没事。肩膀脱了臼，奈德给我推回去了。', '那条船……别盯着它看。'], { style: 'whisper' });
    return S.say('柯林斯', '……');
  }
  async function tomTalk(S) {
    const f = S.f;
    S.face('tom', 'pl');
    if (f.phase === 'fog' || f.phase === 'aboard') return S.say('汤姆', '……它是来接人的吗？杰米，它是不是来接人的？', { style: 'whisper' });
    const L = ['三天前夜里，是我在桅顶上看见的。红灯，满帆，顶着风走。船长不信。', '你可别在甲板上吹口哨。吹口哨是叫风——这片海，风已经够多了。', '听说看见它的船，都要出事。……我是说，听说。'];
    await S.say('汤姆', L[(f._tl = ((f._tl ?? -1) + 1) % L.length)]);
  }
  async function captTalk(S) {
    const f = S.f;
    S.face('capt', 'pl');
    if (f.phase === 'dusk') return S.say('霍克船长', '十九天了。……要是明天风还不转，我就是拿桨划，也要把它划过去。');
    if (f.phase === 'done') return;
    if (f.oath === 'sworn') return S.say('霍克船长', '……是我那句话把它招来的吗？', { style: 'whisper' });
    return S.say('霍克船长', '我在这片海上跑了三十年。我一直以为，那是喝醉的水手编出来的。', { style: 'whisper' });
  }
  async function baro(S) {
    const f = S.f;
    if (f.phase === 'dusk' && f.ned1 && !f.baro) {
      await S.narr('晴雨表挂在舱壁上，铜框里的水银柱……你凑近了，看了两遍。\n二十八寸半。');
      await S.think('早上大副看的时候，还是二十九寸多。……一天掉了快一寸。');
      f.baro = true;
      S.goal('回甲板，把晴雨表的读数报给大副');
      return;
    }
    if (f.phase === 'dusk') return S.narr(f.baro ? '水银柱停在二十八寸半，像是被谁按住了。' : '船长室的晴雨表。铜框擦得锃亮，水银柱停在二十九寸上下。');
    return S.narr('水银柱慢慢爬回了二十九寸。\n可船外头，一丝风也没有。');
  }
  async function myChest(S) {
    const f = S.f;
    if (f.wrote) return S.narr('箱子里压着你写给妈妈的那封信。信封上的字歪歪扭扭：「伦敦　德特福德　造船巷七号」。');
    await S.narr('你的水手箱。一件换洗衬衫，一把小刀，一沓没用过的信纸。\n出海五个月了，你一封家书也没写过。');
    const r = await S.ask('给妈妈写封信？', ['写几句', '以后再说'], '杰米');
    if (r) return;
    f.wrote = true;
    await S.narr('你趴在箱盖上，咬着铅笔头想了半天，只写了几行：\n「妈：我很好。船上的饭不难吃。好望角的浪比教堂的尖顶还高。我会回家的。——杰米」\n你把信折好，打算明天交给大副，封进邮袋。');
  }

  /* ================= 风暴：甲板上那句话 ================= */
  async function stormStart(S) {
    const f = S.f;
    S.bubble('mate', '!', 1200);
    await S.say('柯林斯', '二十八寸半？！……全体上甲板！收上桅帆！把舱口封死！');
    f.phase = 'storm';
    setWx(S, { rain: 1 }); S.dark(.8); S.amb('rain'); thunder(S, true);
    await S.narr('话音没落，天就塌了下来。\n雨不是落下来的，是横着打过来的。浪头一个接一个翻上甲板，帆布在头顶上炸雷似的响。');
    S.face('capt', 1);
    await S.say('霍克船长', '十九天！整整十九天顶风！我霍克跑了三十年好望角，还没让哪个角把我挡在外头过——');
    await S.say('霍克船长', '就算要跑到世界末日——');
    S.bubble('ned', '!', 1500);
    const r = await S.ask('老奈德在桅杆底下拼命朝你摇头。', ['扑过去拽住船长：「别说那句话！」', '（死死抱住桅杆，不敢出声）'], '杰米');
    if (r === 0) {
      f.oath = 'stopped';
      await S.say('杰米', '船长！别说！范德德肯就是这么说的！');
      await S.narr('霍克船长瞪着你，雨水顺着帽檐往下淌。\n过了好一会儿，他咬着牙，把后半句咽了回去：「……小崽子。」');
    } else {
      f.oath = 'sworn';
      await S.say('霍克船长', '——我也要绕过去！');
      thunder(S, true);
      await S.narr('一道闪电劈在右舷外的海面上。\n老奈德在胸口画了个十字，嘴唇一个劲地哆嗦。');
    }
    S.sfx('thud'); S.shake(700, 4);
    S.place('mate', 14, 10, 0); S.ent('mate').spr = '@mateh';
    await S.narr('头顶上「咔嚓」一声——主桅上一只滑车带着断缆砸了下来，正砸在大副肩膀上。');
    await S.say('霍克船长', '杰米！去接舵！我上前头砍断那堆乱缆！往西走，贴着开普角灯塔的南边绕过去——灯塔底下全是礁石，看着白浪绕！');
    await S.say('老奈德', '小子，听好：阵风来之前，桅顶的风旗会先抖。风一到就别动舵，让船头顶住，等它过去——风一过，马上走！');
    await S.go('sea', SEA.start[0], SEA.start[1], 1);
  }

  /* ================= 海上：掌舵穿过礁石口 ================= */
  function setupSea(S) {
    ST = newST(); BQ = [];
    S.f.dmg = 0;
    S.wear('ship'); S.speed(SEA.spd); S.norun(true);
    S.stop('gship'); S.hide('gship');
    const wd = getEnt('wind', 'sea'); if (wd) wd.s.g = 0;
    W._camHold = false; S.focus(null); S.lights(null);
  }
  async function seaEnter(S, first) {
    if (S.f.phase !== 'storm') return;
    setupSea(S);
    if (first) await S.narr('你扑到舵轮上。轮辐又湿又滑，每一个浪头打过来，它都想从你手里挣出去。\n北边的悬崖上，开普角灯塔的光一圈一圈扫过海面。');
    S.goal(S.coop ? '掌舵往西穿过礁石口（双人：一人掌舵，一人盯风旗喊停）' : '掌舵往西，穿过开普角的礁石口（风旗一抖、白浪横飞时停舵）');
    if (S.coop) S.toast('双人：一人掌舵；旁观的人能早一步看见桅顶的风旗抖——喊「阵风」！');
    S.cp('storm');
  }
  async function spawnGhost(S) {
    const p = S.pl, y = clamp(p.y, 4, 13), gx = Math.min(75, p.x + SEA.gap);
    S.place('gship', gx, y, 1); const g = S.ent('gship'); g.alpha = 0;
    W._camHold = true; S.focus(gx - 3, y);
    await S.alpha('gship', 1, 900);
    ghostBells(7, .05);
    S.sfx('sting');
    await S.narr('船尾那边的雨幕里，亮起了一盏红灯。\n然后是第二盏、第三盏——一整条船的轮廓，从浪头后面浮了出来。');
    await S.think('风从西北来，迎着它的船头刮。可它的帆，是朝前鼓着的。\n……它顶着风，在追我们。那边有人在敲钟——叮叮、叮叮、叮叮、叮。七下。');
    S.focus(null); W._camHold = false;
    S.chase('gship', { spd: SEA.gspd, catch: caught });
  }
  async function gustHit(S) {
    const f = S.f; f.dmg = (f.dmg || 0) + 1;
    if (f.dmg >= 2) return dismast(S);
    S.sfx('tear'); S.shake(600, 3); S.wear('shipT'); S.speed(SEA.torn);
    await S.narr('「嘶啦——」前桅的上帆被风撕开一道大口子，像一面破旗在头顶上噼啪乱抽。\n少了一面帆，船一下子慢了。');
    await S.say('老奈德', '阵风来了就别动舵！让它过去！——再来一回，桅杆就断了！');
  }
  async function dismast(S) {
    DEATHS++;
    S.stop('gship'); S.sfx('thud'); S.shake(1200, 5); S.fx('flash');
    await S.scare('red', { sfx: 'scream', dur: .7 });
    await S.die('第二阵风正打在张满的帆上。\n主桅从中间断开，带着帆和缆绳砸进海里，船身一下子横了过来——\n下一个浪头，就从你头顶上盖了下来。', '桅杆断了');
  }
  async function caught(S) {
    DEATHS++;
    if (!SCARED.vddSea) { SCARED.vddSea = true; await S.scare('face', { face: 'vdd', dur: 1 }); }
    else await S.scare('red', { sfx: 'scream', dur: .7 });
    await S.die('红帆从海燕号的船身里穿了过去，像一阵冷风穿过一扇开着的门。\n你听见甲板上每一个人，都在同一刻停止了喊叫。\n\n……雾散的时候，海面上只剩一条船。满帆，顶着风。', '它追上来了');
  }
  async function escape(S) {
    if (!ST || ST.done) return;
    ST.done = true;
    S.stop('gship');
    const wd = getEnt('wind', 'sea'); if (wd) wd.s.g = 0;
    await S.narr('海燕号擦着最后一片白浪，冲出了礁石口。\n前头是开阔的大西洋。浪还是那么高，可底下再没有那种要把船底撕开的白沫了。');
    const g = S.ent('gship');
    if (g && !g.hidden) {
      W._camHold = true; S.focus(g.px / TS, g.py / TS);
      await S.narr('你回头看。\n那条红帆船停在礁石后面，没有追出来。它慢慢掉过头——满帆，顶着风——往东边去了。');
      await S.alpha('gship', 0, 1200);
      S.focus(null); W._camHold = false;
    }
    S.lights(null);
    S.f.phase = 'fog';
    await S.fade(1, 600);
    S.wear('@me'); S.speed(1); S.norun(false);
    await S.card('后半夜', '', '风是在三点钟停的。\n停得很怪——像有谁一刀把它切断了。\n\n浪还没平，雾就从海面上升了起来。');
    await S.go('deck', 24, 8, 2);
  }

  /* ================= 后半夜：雾里的船 ================= */
  async function fogIntro(S) {
    setWx(S, { rain: 0, fog: 1 }); S.dark(.8); S.amb('none');
    S.place('capt', 26, 8, 1); S.place('ned', 5, 9, 0);
    await S.narr('雾大得看不见船头。甲板上没有一个人说话。\n缆绳上的水一滴一滴往下掉，响得吓人。');
    S.bubble('tom', '!', 1500);
    await S.say('汤姆', '……左、左舷……', { style: 'whisper' });
    W._camHold = true; S.focus(14, 3);
    const d = S.ent('dutch'); d.alpha = 0; d.hidden = false;
    S.show('dl1'); S.show('dl2');
    await S.alpha('dutch', 1, 1800);
    S.sfx('sting');
    await S.narr('就在左舷外头，不到一链远，静静地漂着一条船。\n高高的尾楼，老式的雕花船艉，船身黑得像在海底泡过，挂满了藤壶和海草。');
    await S.narr('它的帆是红的。暗红，像干了的血。\n没有一丝风，可那些帆，鼓得满满的。');
    ghostBells(7, .06);
    await S.wait(bellLen(7) * 1000);
    await S.think('叮叮、叮叮、叮叮、叮。\n……七响。');
    const v = S.ent('vdd'); v.alpha = 0; await S.alpha('vdd', 1, 900);
    await S.narr('尾楼上站着一个人。宽檐帽，长外套，一动不动地朝这边看。');
    await S.say('霍克船长', '……谁都别出声。别跟它喊话。', { style: 'whisper' });
    S.place('gboat', 0, 3, 2); S.focus(3, 3);
    await S.narr('那条船的舷边，放下来一条小艇。\n没有桨声。小艇就那么自己，朝这边漂了过来。');
    S.focus(null); W._camHold = false;
    await S.say('老奈德', '……小子。过来。', { style: 'whisper' });
    S.goal('小艇靠上来之前：去船头找老奈德商量');
    DT.gb = 14;
    S.cp('fog');
    startBoat(S);
  }
  function startBoat(S) { S.timer(TBOAT, '小艇', boatArrive, { during: true }); }
  async function nedFog(S) {
    const f = S.f;
    if (S.has('bag')) return S.say('老奈德', '袋口我留着没缝死。等他把信放进去——记住，是他放，不是你接。', { style: 'whisper' });
    if (S.has('canvas') && S.has('lead')) return sewBag(S);
    if (!f.method) {
      f.method = true;
      await S.say('老奈德', '它来要人捎信了。小艇上会下来一个人，求你把信带回家。\n信上写的那些人……早死了一两百年了。', { style: 'whisper' });
      await S.say('老奈德', '接了，这条船就替它跑下去，永远靠不了岸。\n不接——信会自己回来。下一回风暴夜，它还来。', { style: 'whisper' });
      const r = await S.ask('老奈德死死攥着手里的帆针。', ['那怎么办？', '……就不能把它赶走吗？'], '杰米');
      if (r === 1) await S.say('老奈德', '赶？两百年了，谁赶走过它？', { style: 'whisper' });
      await S.say('老奈德', '我老爹说过一个法子。死在海里的人，只有大海送得到他们的信。\n像海葬那样：帆布缝一只袋子，底下坠上铅。让他自己把信放进去，从船舷滑下去。', { style: 'whisper' });
      await S.say('老奈德', '去舱下的帆舱抱一块备用帆布来；船头挂着测深锤，那块铅够沉。我来缝。快，趁小艇还没靠上来！', { style: 'whisper' });
      S.goal(S.coop ? '备沉信袋：帆舱的帆布＋船头的测深锤交给老奈德（双人：一人跑腿，一人翻老奈德的本子）' : '备沉信袋：舱下帆舱的帆布＋船头的测深锤，交给老奈德');
      if (S.coop) S.toast('双人：一人去拿东西，另一人翻笔记（J）——老奈德的本子里还记着后半截规矩');
      return;
    }
    const need = [!S.has('canvas') && '帆舱的备用帆布', !S.has('lead') && '船头的测深锤'].filter(Boolean).join('、');
    await S.say('老奈德', '还差' + need + '。快！', { style: 'whisper' });
  }
  async function sewBag(S) {
    S.take('canvas'); S.take('lead'); S.give('bag');
    if (W.timer && W.timer.left > 8) W.timer.left = 8;
    await S.narr('老奈德接过帆布，手指头抖得厉害，针脚却又密又直。\n他把测深锤缝进袋底。铅坠沉沉地坠着，整只袋子像一个小小的、白色的人形。');
    await S.say('老奈德', '口我留着没缝死。等他把信放进去——记住，是他放，不是你接。', { style: 'whisper' });
    S.goal('拿好沉信袋，等小艇靠上来');
  }
  async function getCanvas(S) {
    const f = S.f, e = S.ent('sroll');
    if ((f.phase === 'fog' || f.phase === 'aboard') && f.method && !S.has('canvas') && !S.has('bag') && f.phase !== 'done') {
      e.s.taken = true; S.give('canvas');
      return S.narr('你从最底下抽出一块新帆布，抱在怀里。\n厚，硬，带着桐油味。老奈德说过，海葬的时候就用这个。');
    }
    if (f.phase === 'fog' && !f.method) return S.narr('一卷一卷的备用帆布。\n……老奈德刚才那个眼神，像是有话要跟你说。');
    return S.narr('一卷一卷的备用帆布，码得整整齐齐。老奈德说，帆布是船的皮。');
  }
  async function getLead(S) {
    const f = S.f, e = S.ent('lline');
    if ((f.phase === 'fog' || f.phase === 'aboard') && f.method && !S.has('lead') && !S.has('bag') && !e.s.taken) {
      e.s.taken = true; S.give('lead');
      return S.narr('你把测深锤从绳头上解下来。七磅重的铅坠，冰得扎手，底下那个抹牛油的小窝里，还粘着几粒海底的白沙。');
    }
    if (e.s.taken) return S.narr('一大盘麻绳，绳头空空的。');
    if (f.phase === 'fog' && !f.method) return S.narr('测深锤，七磅重的铅坠。\n……船头那边，老奈德一直在朝你招手。');
    return S.narr('测深锤：一大盘麻绳，绳头拴着七磅重的铅坠。\n铅坠底下凹进去一个小窝，抹着牛油——放下海去，能粘起海底的沙子，看是什么沙就知道船到了哪儿。');
  }

  /* ---------- 小艇靠上来 ---------- */
  async function boatArrive(S) {
    S.clearTimer();
    if (S.map !== 'deck') { await S.narr('头顶的甲板上，「咚」的一声。\n……有人上船了。'); await S.go('deck', 17, 10, 3); }
    S.place('gboat', 10, 3, 2);
    S.sfx('knock'); await S.wait(450); S.sfx('knock');
    await S.narr('「咚。」小艇轻轻碰上了左舷。\n然后，有什么东西，一下一下，顺着船壳往上爬。');
    await S.fade(1, 250); S.pos(12, 6, 3); S.place('willem', 12, 5, 0); await S.fade(0, 250);
    if (!SCARED.w) { SCARED.w = true; await S.scare('face', { face: 'willem', dur: .9 }); }
    await S.narr('一个人翻过舷墙，落在甲板上，没有一点声音。\n是个年轻水手，穿着老式的短外套，浑身湿透，海水顺着袖口往下滴。他的脸白得发青，眼睛像蒙了一层盐。');
    S.f.phase = 'aboard';
    S.goal('回答舷门边那个湿透的水手');
    if (S.has('bag')) S.cp('aboard');
    await willemTalk(S);
  }
  async function willemTalk(S) {
    const f = S.f;
    S.face('willem', 'pl');
    if (f.phase === 'done') return;
    if (f.belling) {
      const r = await S.ask('威廉捧着那叠信，望着前桅边上的船钟。', ['（我这就去敲钟）', '伸手把信接过来', '摇头：我不能接'], '杰米');
      if (r === 1) return endTake(S);
      if (r === 2) return endRefuse(S);
      return S.say('威廉', '七响了……再有半个钟头，就换班。', { style: 'whisper' });
    }
    if (!f.metW) {
      f.metW = true;
      await S.say('湿透的水手', '……这是往家去的船吗？', { style: 'whisper' });
      await S.say('杰米', '……回、回伦敦。');
      await S.say('湿透的水手', '伦敦也好。到了岸上，总有人肯往阿姆斯特丹捎。\n我叫威廉。这是我们船上大伙儿的信——写给老婆的，写给娘的，写给还没见过面的孩子的。', { style: 'whisper' });
      await S.narr('他把一叠信捧到你面前。信封又黄又软，火漆上印着一条小帆船，字是你不认得的荷兰文。\n最上面那封的日期，你认得出来：1641。');
    }
    const opts = ['伸手接过来', '摇头：我不能接'];
    if (S.has('bag')) opts.push('（把帆布袋口张开）放进这里面吧');
    const r = await S.ask('「我们出来……很久了。替我们捎回去吧。」', opts, '威廉');
    if (r === 0) return endTake(S);
    if (r === 1) return endRefuse(S);
    f.belling = true;
    await S.narr('你把沉信袋的口张开，举到他面前。');
    S.bubble('willem', '…', 1500);
    await S.say('威廉', '……这是缝死人用的帆布。\n我们不是死人。我们还在值班。', { style: 'whisper' });
    ghostBells(7, .06);
    await S.say('威廉', '你听——七响了。再有半个钟头，就换班。\n等换了班，我就能把信放下了。……我等这个换班，等了好久好久。', { style: 'whisper' });
    S.goal(S.coop ? '替他们把这一班的钟敲完（双人：一人敲钟，一人对照舱梯口的船规）' : '替他们把这一班的钟敲完（前桅边上的船钟）');
    if (S.coop) S.toast('双人：一人去敲钟，另一人翻笔记（J）对照船规');
  }

  /* ---------- 船钟：替他们敲完这一班 ---------- */
  async function ringBell(S) {
    const f = S.f;
    if (f.phase === 'done') return S.narr('船钟还在轻轻地晃。');
    if (f.phase === 'aboard' && !f.belling) return S.narr('舷门边的那个水手还捧着信，在等你的答复。');
    if (f.phase === 'fog') return S.narr('你的手刚碰到钟绳，船头的老奈德就拼命朝你摇头。\n……现在敲钟，是要告诉那条船「我们在这儿」吗？');
    if (f.phase !== 'aboard') return S.narr('船钟。铜的，长了一层绿锈，钟口刻着「海燕号　1848」。\n每半个钟头，值更的人拉一回钟绳，叮叮、叮叮，两下两下地敲——闭着眼睛都不会敲错。');
    const gs = [];
    BQ = []; DT.gb = 30;   // 敲钟时那条船先别响，免得混在一起
    while (gs.length < 5) {
      const so = gs.length ? gs.map(n => '叮'.repeat(n)).join(' · ') : '（还没敲）';
      const k = await S.keypad('替他们把这一班的钟敲完（最多五组）\n已敲：' + so + '\n这一组敲几下？整班敲完了，按「停手」', ['1', '2', '3', '停手'], 1, { alias: { '0': '停手' } });
      if (k == null) { DT.gb = 6; if (gs.length) await S.narr('你松开了钟绳。钟声在雾里慢慢散了。'); return; }
      if (k === '停手') break;
      const n = +k;
      for (let i = 0; i < n; i++) { ding(S, false, .1); bq(.26, S2 => S2.tone('sine', 1046, 1040, 1.2, .025, 0, 700)); S.shake(120, 1); await S.wait(420); }
      gs.push(n);
      await S.wait(300);
    }
    DT.gb = 12;
    if (!gs.length) return;
    return judgeBells(S, gs.join(''));
  }
  async function judgeBells(S, seq) {
    const f = S.f;
    if (seq === '2222') return deliver(S);
    f.bw = (f.bw || 0) + 1;
    const sum = [...seq].reduce((a, c) => a + +c, 0), proper = /^2*1?$/.test(seq);
    await S.wait(600);
    ghostBells(7, .07);
    await S.wait(bellLen(7) * 1000);
    S.bubble('willem', '…', 1500);
    const line = seq === '2221' ? '……七响。还是七响。' : sum === 8 ? '……数是够了。可船上的钟，不是这么敲的。' : proper ? '……不是这个点。' : '……那不是钟点。那只是在敲铁。';
    await S.say('威廉', line, { style: 'whisper' });
    if (f.bw === 2) { await S.scare('static', { sfx: 'whisper', dur: .6 }); await S.narr('雾一下子压了下来，冷得刺骨。\n那条船上的红灯，好像近了一些。'); }
    const H = [null,
      seq === '2221' ? '（那条船的钟一直停在七响。……这一班，还差最后一下？）' : sum === 8 ? '（船上的钟两下一组，单的那一下才落在最后。）' : proper ? '（他们停在七响。一班敲满，是几响？）' : '（船钟不是乱敲的。舱梯口钉着的船规里，写着敲法。）',
      '（舱下舱梯口那张船规：一班从一响敲到八响，敲满八响就换班；两下一组。）',
      '（七响之后是八响。两下一组——一共四组。）',
      '（叮叮、叮叮、叮叮、叮叮：每组敲 2 下，敲四组，然后按「停手」。）'];
    await S.think(H[Math.min(f.bw, 4)]);
    S.goal(f.bw >= 3 ? '敲八响：两下一组，四组（2·2·2·2），再按「停手」' : '替他们把这一班的钟敲完（前桅边上的船钟）');
  }

  /* ================= 结局 ================= */
  const goodText = f => '第二天中午，海燕号绕过了好望角。顶了十九天的风，在一个早上转成了东南风。\n\n' +
    (f.oath === 'sworn' ? '霍克船长后来再也没跑过好望角这条线。有人问起，他只说：有些话说出口，就收不回来——除非有人替你把那一班钟敲完。\n\n' : '霍克船长那年冬天留在了家里，陪玛莎和两个女儿过了圣诞。他说，那天夜里，幸好有个小崽子拽住了他的胳膊。\n\n') +
    (f.wrote ? '七月底，三只邮袋送进了伦敦邮政总局。其中有一封，是你写给妈妈的。她把它压在壁炉台的座钟底下，一放就是很多年。\n\n' : '七月底，三只邮袋送进了伦敦邮政总局。你站在邮局门口才想起来：这一路上，你一封家书也没写。\n\n') +
    '老奈德到死都不肯讲那天夜里的事。只是每回轮到他值夜，敲完八响，他都会对着黑漆漆的海，小声说一句：\n「换班了。」';
  async function deliver(S) {
    const f = S.f; f.phase = 'done'; BQ = [];
    S.goal('');
    await S.wait(900);
    await S.narr('最后一下钟声在雾里荡开，荡得很远，很远。');
    ghostBells(8, .06);
    await S.wait(bellLen(8) * 1000);
    await S.narr('……那条船上的钟，也响了。\n叮叮、叮叮、叮叮、叮叮。八响。');
    S.bubble('willem', '…', 1600);
    await S.say('威廉', '……八响。\n换班了。', { style: 'whisper' });
    await S.narr('他的肩膀一下子松了下来，像卸下了一副扛了很久很久的担子。\n他没有把信递到你手里。他弯下腰，把那叠信一封一封，放进了帆布袋口里。');
    S.sfx('cut'); S.take('bag');
    await S.narr('老奈德把帆针塞进你手里。你缝上最后几针，把袋子推过舷墙。\n它几乎没有溅起水花。一小团白色，往下沉，往下沉，沉进了黑得发亮的海水里。');
    S.sfx('splash');
    await S.say('威廉', 'Dank je.', { style: 'whisper' });
    await S.alpha('willem', 0, 1500);
    W._camHold = true; S.focus(14, 2);
    for (const id of ['dl1', 'dl2']) { S.hide(id); S.sfx('switch'); await S.wait(700); }
    if (f.oath === 'sworn') await S.narr('尾楼上那个戴宽檐帽的人，一直望着海燕号的舵轮。望着霍克船长。\n船长张了几回嘴，终于哑着嗓子说：「……我收回。我收回那句话。」');
    await S.narr('尾楼上那个人，慢慢摘下了帽子。');
    await S.alpha('vdd', 0, 1200);
    await S.alpha('dutch', 0, 2600);
    S.hide('gboat');
    S.focus(null); W._camHold = false;
    setWx(S, { fog: 0 }); S.dark(.35); S.amb('wind');
    await S.narr('雾散了。东边的海面上，透出一线灰白。\n头顶的帆「啪」地一声鼓了起来——风回来了。');
    await S.say('霍克船长', '……东南风。全体上桅！我们回家！');
    await S.end({ id: 'deliver', title: '八响', text: goodText(f) });
  }
  async function endTake(S) {
    S.clearTimer();
    await S.narr('你伸出了手。\n信很轻，又冰又湿，像一叠刚从海底捞上来的叶子。');
    await S.say('威廉', '……谢谢。\n现在，轮到你们了。', { style: 'whisper' });
    S.sfx('scream');
    await S.scare('face', { face: 'vdd', dur: 1.1 });
    await S.fade(1, 900);
    await S.end({ bad: true, id: 'take', title: '接过来的信', text: '雾散的时候，那条红帆船不见了。\n海燕号的帆，却慢慢鼓了起来——没有风。\n你身后的舵轮，自己转了半圈。\n\n劳埃德船级社的登记簿上，海燕号那一行后面，后来添了两个字：失踪。\n\n据说从那以后，好望角外海的风暴夜里，有时能看见两条船，一前一后，满帆顶着风。' });
  }
  async function endRefuse(S) {
    S.clearTimer();
    await S.say('杰米', '……我不能接。对不起。');
    await S.say('威廉', '……没人肯接。\n两百年了，一个都没有。', { style: 'whisper' });
    S.ent('hatch').s.letters = 1; S.focus(17, 8);
    await S.narr('他把信轻轻放在舱口盖上，转身翻过了舷墙。\n小艇无声地退进雾里。红帆船上的灯，一盏一盏熄了。');
    await S.fade(1, 900);
    await S.end({ bad: true, id: 'refuse', title: '退回的信', text: '天亮以后，风还是顶风。海燕号在好望角外又挣了九天，才绕过去。\n舱口盖上那叠信，谁也不敢碰。第二天早上，它就不见了。\n\n七月底，伦敦邮政总局的分信员在海燕号的邮袋里，翻出一叠湿透的信。荷兰文，火漆上印着一条小帆船，日期是1641年。\n没有人知道它们是怎么进去的。\n\n第二年六月，好望角外海，又有船看见了一条满帆顶风的船。' });
  }

  /* ================= 精灵 ================= */
  const flipR = (R, left) => left ? R : (x, y, w, h, c) => R(16 - x - w, y, w, h, c);
  function shipSpr(R, t, left, torn) {
    const P = flipR(R, left), b = Math.round(Math.sin(t * 2.2));
    P(-18, 12, 50, 3, 'rgba(220,235,245,.3)'); P(-20, 11 + b, 5, 3, 'rgba(240,250,255,.55)');
    P(-14, 6 + b, 42, 6, '#2e1e12'); P(-17, 5 + b, 3, 3, '#2e1e12'); P(-12, 5 + b, 40, 1, '#6a4a2c'); P(-12, 9 + b, 40, 1, '#1a120a');
    P(22, 1 + b, 8, 5, '#3a2616'); P(22, 1 + b, 8, 1, '#7a5a38'); P(28, 0 + b, 2, 2, '#ffd27a');
    P(-24, 2 + b, 9, 1, '#24160c');   // 船首斜桅
    const S1 = '#b8b19c', S2 = '#8a826e';
    [[-6, 0], [6, 1], [18, 2]].forEach(([mx, k]) => {
      P(mx, -22 + b, 1, 28, '#24160c');
      if (torn && k === 0) { P(mx - 5, -17 + b, 2, 5, S1); P(mx - 1, -17 + b, 2, 3, S1); P(mx + 3, -17 + b, 2, 6, S1); }
      else { P(mx - 5, -17 + b, 11, 4, S1); P(mx - 5, -14 + b, 11, 1, S2); }
      P(mx - 6, -10 + b, 13, 5, S1); P(mx - 6, -6 + b, 13, 1, S2);
    });
    P(-20, -10 + b, 2, 9, S1); P(-18, -6 + b, 3, 5, S1);   // 三角帆
  }
  function seaPaint(R, X, Y, dark) {
    R(0, 0, 16, 16, dark ? '#0a1622' : '#0e1e2c');
    for (let i = 0; i < 3; i++) { const h = hash(X, Y, 20 + i); R((h * 12) | 0, (hash(X, Y, 30 + i) * 14) | 0, 4, 1, dark ? '#16304a' : '#1a3246'); }
    if (hash(X, Y, 9) < .14) R((hash(X, Y, 8) * 10) | 0, (hash(X, Y, 7) * 12) | 0, 5, 1, '#5a7488');
  }
  const BEARD = '#e8e8e0';

  defChapter({
    id: 'dutchman', n: 12, title: '飞翔的荷兰人', sub: '好望角的风暴夜，一条满帆顶风的红帆船放下小艇：替我们把信捎回家吧。', origin: '航海传说 · 好望角', color: '#3a1418',
    amb: 'wind', floor: 'wood', wall: 'wood', dark: .5, plr: 3.2,
    thumb(g, w, h) {
      const P = (x, y, ww, hh, c) => { g.fillStyle = c; g.fillRect(x, y, ww, hh); };
      P(0, 50, w, 18, '#0a141c'); for (let i = 0; i < 14; i++) P((hash(i, 1, 12) * w) | 0, 52 + ((hash(i, 2, 12) * 14) | 0), 6, 1, '#3a5a6a');
      P(112, 4, 2, 10, '#c8d8ff'); P(110, 13, 2, 9, '#c8d8ff'); P(112, 21, 2, 8, '#a8b8ee');
      g.fillStyle = 'rgba(255,40,30,.12)'; g.beginPath(); g.arc(70, 34, 34, 0, 7); g.fill();
      P(40, 44, 64, 8, '#0c0807'); P(36, 44, 4, 4, '#0c0807'); P(92, 34, 14, 12, '#120c0a'); P(92, 34, 14, 1, '#4a3a2a');
      for (const mx of [52, 68, 84]) { P(mx, 6, 2, 40, '#0a0606'); P(mx - 9, 10, 20, 11, '#7a1010'); P(mx - 10, 23, 22, 14, '#901414'); P(mx - 8, 24, 4, 12, '#b02424'); }
      P(103, 33, 3, 3, '#ff4a3a'); P(38, 42, 2, 2, '#ff4a3a');
      P(40, 52, 66, 2, 'rgba(200,220,230,.35)');
    },
    people: {
      me: { key: 'fd-me', skin: '#eac4a0', hair: '#6a4a2a', hs: 'short', hat: 'cap', hatC: '#2a3248', top: '#d8d4c8', top2: '#2a3248', bottom: '#6a6452', shoes: '#2a1e16',
        extra(g, d, fr, G, R) { R(4, G.tT + 2, 8, 1, '#2a3248'); R(4, G.tT + 4, 8, 1, '#2a3248'); } },
      capt: { key: 'fd-capt', skin: '#d8a888', hair: '#9a9a9a', hs: 'short', hat: 'cap', hatC: '#141a2a', top: '#1e2638', top2: '#e8e0d0', bottom: '#1e2638', coat: true, shoes: '#111',
        extra(g, d, fr, G, R) { if (d === 0) { R(5, G.hT + 5, 6, 3, '#a8a8a8'); R(6, G.tT + 2, 1, 1, '#c9a35a'); R(6, G.tT + 4, 1, 1, '#c9a35a'); } else if (d === 1) R(4, G.hT + 5, 4, 3, '#a8a8a8'); } },
      mate: { key: 'fd-mate', skin: '#e0b090', hair: '#2a1e18', hs: 'short', top: '#5a3a24', top2: '#e8e0d0', bottom: '#3a3a40', shoes: '#1a1410',
        extra(g, d, fr, G, R) { if (d === 0) { R(4, G.hT + 3, 1, 4, '#2a1e18'); R(11, G.hT + 3, 1, 4, '#2a1e18'); } } },
      mateh: { key: 'fd-mateh', skin: '#e0b090', hair: '#2a1e18', hs: 'short', top: '#5a3a24', top2: '#e8e0d0', bottom: '#3a3a40', shoes: '#1a1410',
        extra(g, d, fr, G, R) { R(4, G.hT + 1, 8, 1, '#e8e4d8'); if (d === 0) { R(4, G.hT + 3, 1, 4, '#2a1e18'); R(11, G.hT + 3, 1, 4, '#2a1e18'); R(3, G.tT, 3, 5, '#e8e4d8'); } } },
      ned: { key: 'fd-ned', skin: '#c89a78', hair: '#e8e8e0', hs: 'bald', top: '#8a7a5a', top2: '#d8d0b8', bottom: '#5a5040', shoes: '#2a2018',
        extra(g, d, fr, G, R) { if (d === 0) { R(4, G.hT + 5, 8, 3, BEARD); R(5, G.hT + 8, 6, 3, '#d8d8d0'); R(3, G.hT + 4, 1, 1, '#e0c060'); } else if (d === 1) { R(3, G.hT + 5, 5, 3, BEARD); R(4, G.hT + 8, 3, 2, '#d8d8d0'); } } },
      tom: { key: 'fd-tom', skin: '#f0c8a0', hair: '#a85a2a', hs: 'messy', top: '#8a2a24', top2: '#d8c8a8', bottom: '#5a5a4a', shoes: '#2a1e16' },
      willem: { key: 'fd-will', skin: '#9fb2ae', hair: '#1e2e26', hs: 'messy', top: '#2e3a38', top2: '#a8b0a8', bottom: '#28302e', ghost: true, eye: '#d8e0d8',
        extra(g, d, fr, G, R) { if (d === 0) { R(5, G.tT, 6, 1, '#b8beb4'); R(4, G.hT + 1, 1, 6, '#2a4a30'); R(11, G.hT, 1, 5, '#2a4a30'); R(6, G.tT + 7, 1, 2, 'rgba(160,200,220,.7)'); R(10, G.tT + 5, 1, 3, 'rgba(160,200,220,.7)'); } else R(4, G.hT + 1, 1, 6, '#2a4a30'); } },
      vdd: { key: 'fd-vdd', skin: '#cfc6b4', hair: '#2a2424', hs: 'long', top: '#1a1414', top2: '#d8d0c0', bottom: '#1a1414', coat: true, ghost: true, eye: '#ff3a2a',
        extra(g, d, fr, G, R) { R(1, G.hT - 1, 14, 2, '#0c0a0a'); R(4, G.hT - 4, 8, 3, '#100c0c'); if (d === 0) { R(4, G.tT, 8, 2, '#d8d0c0'); R(7, G.hT + 7, 2, 2, '#2a2424'); } } }
    },
    faces: {
      /* 威廉：泡发青白的脸，海草一样贴着的头发，蒙着一层盐的眼睛，张开的嘴里往外淌水 */
      willem(R, a, t) {
        R(0, 0, 32, 32, '#020406');
        R(6, 1, 20, 7, '#16241e'); R(4, 5, 4, 20, '#16241e'); R(24, 5, 4, 18, '#16241e');
        R(9, 6, 14, 20, '#8fa3a0'); R(10, 26, 12, 2, '#7a8e8c'); R(9, 6, 2, 20, '#6f8584'); R(21, 7, 2, 18, '#7a8e8c');
        R(10, 17, 2, 5, '#6a7e7c'); R(20, 17, 2, 5, '#6a7e7c');
        R(10, 11, 6, 1, '#4a5a58'); R(17, 11, 6, 1, '#4a5a58');
        R(11, 12, 4, 3, '#dfe6de'); R(18, 12, 4, 3, '#dfe6de'); R(12, 13, 2, 1, '#b4c0ba'); R(19, 13, 2, 1, '#b4c0ba');
        R(15, 15, 2, 3, '#7a8e8c');
        const mh = 2 + Math.round(a * 5);
        R(13, 21, 6, mh, '#0a1210'); R(13, 21, 6, 1, '#4a5a58'); R(15, 21 + mh, 2, 3 + ((t * 9) % 4 | 0), 'rgba(150,200,220,.8)');
        R(12, 6, 1, 10, '#22382a'); R(19, 6, 1, 13, '#22382a'); R(16, 6, 1, 5, '#22382a');
        R(21, 9, 2, 2, '#c8c4b0'); R(22, 11, 1, 1, '#a8a490'); R(10, 23, 1, 1, '#c8c4b0');
        R(7, 28, 18, 4, '#2a3634'); R(10, 27, 12, 2, '#b8beb4');
        for (let i = 0; i < 4; i++) R(8 + i * 5, ((t * 14 + i * 7) % 26) | 0, 1, 2, 'rgba(150,200,220,.5)');
      },
      /* 范德德肯：宽檐帽下塌陷的脸，眼窝里两点红光，尖胡子，慢慢张开的嘴 */
      vdd(R, a, t) {
        R(0, 0, 32, 32, '#050102');
        R(9, 0, 14, 4, '#100c0c'); R(9, 3, 14, 1, '#4a1010'); R(2, 4, 28, 2, '#0c0a0a'); R(1, 6, 4, 1, '#0c0a0a'); R(27, 6, 4, 1, '#0c0a0a');
        R(7, 7, 3, 19, '#2a2424'); R(22, 7, 3, 19, '#2a2424'); R(8, 24, 2, 3, '#2a2424'); R(22, 24, 2, 3, '#2a2424');
        const SK = '#c8c0b0', SD = '#8a8072';
        R(10, 6, 12, 5, SK); R(10, 11, 12, 6, SK); R(11, 17, 10, 3, SK); R(12, 20, 8, 2, SK); R(13, 22, 6, 1, SK);
        R(10, 6, 1, 11, '#9a9282'); R(10, 13, 2, 5, SD); R(20, 13, 2, 5, SD); R(11, 12, 2, 1, '#dcd4c4'); R(19, 12, 2, 1, '#dcd4c4');
        R(11, 9, 4, 3, '#140808'); R(17, 9, 4, 3, '#140808'); R(11, 8, 4, 1, '#6a6052'); R(17, 8, 4, 1, '#6a6052');
        const gl = .6 + Math.sin(t * 6) * .4, ec = `rgba(255,${(40 + gl * 50) | 0},30,1)`;
        R(12, 10, 2, 1, ec); R(18, 10, 2, 1, ec);
        R(15, 10, 2, 6, '#a89e8e'); R(15, 16, 2, 1, '#6a6052');
        R(12, 18, 3, 1, '#3a3030'); R(17, 18, 3, 1, '#3a3030'); R(11, 19, 1, 2, '#3a3030'); R(20, 19, 1, 2, '#3a3030');
        R(14, 19, 4, 1 + Math.round(a * 3), '#000');
        R(14, 22, 4, 3, '#3a3030'); R(15, 25, 2, 3, '#3a3030');
        R(4, 29, 24, 3, '#141010'); R(6, 26, 20, 3, '#d8d0c0'); R(8, 29, 16, 1, '#c8c0b0'); for (let x = 7; x < 26; x += 3) R(x, 27, 1, 1, '#8a8478');
      }
    },
    items: {
      canvas: { name: '备用帆布', desc: '一大块新帆布，厚，硬，带着桐油味。' },
      lead: { name: '测深锤', desc: '七磅重的铅坠，冰得扎手。底下的小窝里粘着几粒海底的白沙。' },
      bag: { name: '沉信袋', desc: '老奈德缝的帆布袋，底下坠着测深锤。袋口还留着没缝死。' }
    },
    notes: {
      orders: { title: '海燕号船规（钉在舱梯口）', text: '一、值夜的人不准在甲板上吹口哨。\n　　（要叫风，自己爬到桅顶上去吹。——大副）\n二、船钟每半个钟头敲一次。一班四个钟头，从一响敲到八响。\n　　两下一组，单的那一下落在最后。\n　　例：三响——叮叮、叮；六响——叮叮、叮叮、叮叮。\n　　敲满八响，就是换班。\n三、邮袋归大副看管，任何人不得私开。\n四、见到别的船，先报大副。不准自己打旗号，不准喊话。\n\n　　　　　　　　　　　　　　　　　　船长　霍克' },
      log: { title: '船长日志 · 海燕号　1861年6月', text: '6月3日　孟买出港第五十一天。过厄加勒斯角。风转西北，顶风。\n6月9日　顶风第十天。前桅上桅帆撕了两回，老奈德缝了一夜。\n6月12日　夜里两点，瞭望的汤姆报：西南有船，满帆，挂红灯，顶着风走。没打旗号。我拿望远镜去看，只看见雾。\n　　　　水手们在底下嘀咕，我让他们闭嘴。\n6月15日　晴雨表 29.1。\n6月18日　顶风第十九天。我跑了三十年好望角，从没被它挡过这么久。\n　　　　给玛莎的信写好了，封进邮袋，到伦敦再寄。\n　　　　……该死的风暴角。' },
      ned: { title: '补帆匠老奈德的本子（塞在帆布包里）', text: '（字歪歪扭扭，一半是画。）\n\n风暴角的规矩，我老爹教的：\n· 看见一条船满帆顶着风走——别盯着它看，别跟它喊话。\n· 它的人要是划小艇过来，求你捎信回家，别伸手接。接了，你的船就替它跑下去。\n· 也别把信往回推。推回去的信，会自己回到你的舱里。\n· 信上的人都死了一两百年了。只有大海送得到。\n· 他们不肯撒手，是因为那一班还没值完。\n　替他们把那一班的钟敲完，人就能下班了。\n\n（底下画着一口钟，钟旁边写了个「七」，又被墨水涂掉了。）' },
      tale: { title: '旧杂志剪页 · 爱丁堡某月刊　1821年5月号', text: '（老奈德箱子上那本旧杂志，有一页折了角。讲的是一位船上的乘客自称亲历的事。）\n\n……船在好望角外遇着一阵怪风。天黑以后，一条小艇从雾里划过来。艇上的人说，他们从阿姆斯特丹来，在海上漂了很久，想托我们捎几封家书。\n我们船上的老水手死活不让接。那人就哀求，一封一封念信上的名字和住址。\n有一封，是写给阿姆斯特丹某街一位太太的。我们船上一个荷兰水手说：那条街的房子九十年前就拆了，那一带早成了码头。\n那人愣了很久，说：「那……就交给教堂吧。教堂总还在。」\n我们终究没有接。小艇划回雾里去了。\n第二天早上，那几封信放在我们的舱口盖上，湿漉漉的，一封也不少。' }
    },
    legend: '「飞翔的荷兰人」（The Flying Dutchman）是帆船时代流传最广的幽灵船传说：好望角一带的风暴夜里，会出现一条满帆顶风的老式荷兰船，永远靠不了岸。水手们相信看见它是凶兆，随后船就会出事。较早的书面记载出自18世纪末——据说1790年代一本英国人写的航海见闻里，就记下了水手们讲的这条船。1821年，爱丁堡一本杂志刊出小说体的《范德德肯的家书》，加进了这个传说里最有名的细节：幽灵船放下小艇，求过往船只替他们捎信回家，而信上的收信人早已死去多年；接信的船会倒霉。\n\n船长的名字和罪名随版本而变。最常见的叫范德德肯（Vanderdecken），德语地区的版本里也有叫法尔肯堡的；有的说他对着风暴发誓「就是到世界末日也要绕过这个角」，有的说他和魔鬼掷骰子赌掉了灵魂，还有的说他亵渎神明、虐待船员。1839年的一部英国小说和1843年瓦格纳的歌剧《漂泊的荷兰人》让它家喻户晓：歌剧里船长每七年才能上岸一次，只有一个至死不渝的女人能救赎他，他的船挂着血红的帆、漆黑的桅。\n\n目击的说法很多，大多无从查证。据说1881年一艘英国军舰的航海日志里写着：凌晨四点，一条「发着奇异红光」的船从船头前方横穿过去，随即不见，事后不久船上就出了事故。常见的解释是「上现蜃景」——冷海面上方的空气会把地平线以外的船「抬」到半空，看上去像一条悬在海上的船。好望角海域本身也以风暴和巨浪闻名：据说最早绕过它的葡萄牙航海家叫它「风暴角」，是国王嫌不吉利，才改名「好望角」；荷兰东印度公司的船在这条航线上，确实损失过不少。\n\n（本章的海燕号、霍克船长、老奈德、汤姆、威廉，以及「替他们敲完八响、像海葬那样把信沉进海里」的送信办法，均为游戏虚构。船钟两下一组、八响换班是帆船时代真实的值更规矩；把死者缝进帆布、坠上重物海葬，也是真实的航海习俗。开普角灯塔于1860年点亮。）',
    endings: { deliver: '八响', refuse: '退回的信', take: '接过来的信' },
    start: { map: 'deck', x: 18, y: 9, dir: 1 },
    resume: {
      storm: async S => {
        setupSea(S);
        if (DEATHS > 1) await S.narr('（它不怕风，也不怕礁。你停一秒，它就近两格。\n只在风旗抖、白浪横飞的时候停舵；白浪一过马上走。礁石口看准了再拐，别贴着石头磨。）');
        else if (DEATHS) await S.narr('（再来一回。阵风来时停住舵，风一过马上走——它可不会停。）');
      },
      fog: async S => { BQ = []; DT.gb = 4; W._camHold = false; S.focus(null); startBoat(S); S.toast('小艇又从雾里漂过来了'); },
      aboard: async S => { BQ = []; DT.gb = 4; W._camHold = false; S.focus(null); S.toast('那个湿透的水手还在舷门边等你'); }
    },
    async intro(S) {
      DEATHS = 0; SCARED = {}; BQ = []; DT = { gb: 4, sh: 0, si: 0, cr: 3 }; ST = null; S.f.phase = 'dusk';
      await S.card('第十二夜　飞翔的荷兰人', '1861年6月18日　好望角外海', '三桅帆船「海燕号」从孟买返航伦敦。\n舱里装着茶叶、靛蓝，还有三袋寄回英国的信。\n\n你叫杰米，十六岁，见习水手，头一回出远洋。\n\n今天，是顶风的第十九天。');
    },
    tick(S, dt) {
      if (BQ.length) { const t = W.t, due = BQ.filter(q => q.at <= t); if (due.length) { BQ = BQ.filter(q => q.at > t); for (const q of due) q.fn(S); } }
      const ph = S.f.phase;
      if (ph === 'fog' || ph === 'aboard') { DT.gb -= dt; if (DT.gb <= 0) { DT.gb = 18; ghostBells(7, S.map === 'below' ? .025 : .045); } }
    },
    sprites: {
      ship(g, e, t, R) { shipSpr(R, t, e.dir !== 2, false); },
      shipT(g, e, t, R) { shipSpr(R, t, e.dir !== 2, true); },
      /* 海上的那条船：黑船身、高尾楼、满鼓的血红帆，红灯 */
      gship(g, e, t, R) {
        const P = flipR(R, e.dir !== 2), b = Math.round(Math.sin(t * 1.7));
        g.globalAlpha *= .82 + Math.sin(t * 3) * .1;
        P(-26, -34, 64, 50, 'rgba(255,40,30,.06)');
        P(-18, 6 + b, 50, 7, '#0e0a08'); P(-22, 5 + b, 4, 3, '#0e0a08'); P(24, -4 + b, 12, 10, '#140e0a'); P(24, -4 + b, 12, 1, '#3a2a1a'); P(-16, 8 + b, 40, 1, '#2a1a10');
        for (const mx of [-8, 6, 20]) { P(mx, -30 + b, 1, 36, '#0a0606'); P(mx - 7, -26 + b, 15, 8, '#6a0c0c'); P(mx - 8, -17 + b, 17, 10, '#7e1010'); P(mx - 6, -25 + b, 3, 6, '#9a2020'); P(mx - 7, -16 + b, 3, 8, '#a02424'); }
        P(34, -6 + b, 2, 2, '#ff4a3a'); P(-20, 3 + b, 2, 2, '#ff4a3a');
        P(-20, 12, 56, 2, 'rgba(255,120,100,.18)');
      },
      /* 甲板外头那条船（宽 e.w 格）：只露出帆的下半截和船身 */
      dutchbig(g, e, t, R) {
        const W2 = e.w * 16, b = Math.round(Math.sin(t * .9));
        for (const mx of [70, 170, 270]) { R(mx, -60, 3, 82 + b, '#0a0606'); R(mx - 34, -50, 70, 30, '#6a0c0c'); R(mx - 38, -16 + b, 78, 32, '#861212'); R(mx - 30, -12 + b, 12, 26, '#a81c1c'); R(mx - 16, -14 + b, 6, 28, '#9a1818'); R(mx + 14, -8 + b, 3, 18, '#3a0606'); R(mx - 38, 15 + b, 78, 2, '#4a0808'); R(mx - 39, -16 + b, 1, 32, '#c03030'); }
        g.fillStyle = 'rgba(255,60,40,.07)'; g.fillRect(e.sx - 30, e.sy - 10, W2 + 40, 64);
        R(0, 22 + b, W2, 26, '#221914'); R(0, 22 + b, W2, 1, '#5a463a'); R(0, 30 + b, W2, 1, '#3a2c22'); R(4, 19 + b, W2 - 70, 3, '#1e1612');
        R(W2 - 70, -10 + b, 70, 58, '#140e0b'); R(W2 - 70, -10 + b, 70, 2, '#3a2a1a');
        for (let i = 0; i < 4; i++) R(W2 - 62 + i * 15, 2 + b, 8, 7, Math.sin(t * 2 + i) > .2 ? '#5a1410' : '#3a0c0a');
        R(-14, 24 + b, 14, 8, '#100c0a'); R(-26, 19 + b, 14, 2, '#1e1612');
        for (let x = 30; x < W2 - 80; x += 26) { R(x, 32 + b, 8, 6, '#050302'); if (hash(x, 1, 7) < .4) R(x + 2, 34 + b, 4, 2, Math.sin(t * 3 + x) > 0 ? '#7a1a12' : '#4a0e0a'); }
        for (let i = 0; i < 46; i++) R((hash(i, 1, 9) * W2) | 0, 25 + ((hash(i, 2, 9) * 20) | 0) + b, 2, 1, i % 2 ? '#4a4a3a' : '#1e3a22');
        for (let i = 0; i < 16; i++) { const x = (hash(i, 3, 9) * W2) | 0; R(x, 46 + b, 1, 4 + ((hash(i, 4, 9) * 8) | 0), '#1e3a22'); }
        R(-14, 47, W2 + 14, 2, 'rgba(160,190,200,.22)');
      },
      gboat(g, e, t, R) {
        const b = Math.round(Math.sin(t * 2));
        R(-6, 8 + b, 28, 6, '#1a120c'); R(-9, 7 + b, 3, 3, '#1a120c'); R(-4, 7 + b, 24, 1, '#3a2a1c');
        for (const x of [0, 9]) { R(x, -2 + b, 5, 10, '#141c1a'); R(x + 1, -5 + b, 3, 3, '#7a8a86'); }
        R(19, -3 + b, 1, 10, '#2a1a10'); R(18, -4 + b, 3, 3, '#ff5a40');
      },
      /* 天气：雨 / 雾（e.s 同步给客机） */
      wxfx(g, e, t, R) {
        if (e.rain) { g.fillStyle = 'rgba(170,190,220,.4)'; const Wd = VW + 60; for (let i = 0; i < 110; i++) { const sp = 220 + hash(i, 1, 3) * 120, x = (((hash(i, 2, 3) * Wd - t * sp * .35) % Wd) + Wd) % Wd - 30, y = ((hash(i, 4, 3) * VH + t * sp) % (VH + 10)) - 5; g.fillRect(x | 0, y | 0, 1, 5); } }
        if (e.fog) { for (let i = 0; i < 7; i++) { const y = ((t * 3 + i * 31) % (VH + 40)) - 20; g.fillStyle = `rgba(170,180,186,${(.1 + (i % 3) * .03).toFixed(2)})`; g.fillRect(0, y | 0, VW, 10 + (i % 3) * 6); } g.fillStyle = 'rgba(150,160,170,.12)'; g.fillRect(0, 0, VW, VH); }
      },
      /* 阵风：1 = 预兆（只有旁观的人看得见风旗抖），2 = 白浪横飞，3 = 风到了 */
      windfx(g, e, t, R) {
        const ph = e.g || 0; if (!ph) return;
        const viewer = !iControl();
        if (ph >= 2 || viewer) { const fl = Math.sin(t * 40) > 0; R(6, -27, 1, 5, '#d8d8d8'); R(7, -27, fl ? 7 : 6, 2, '#e03020'); R(7, -25, fl ? 4 : 6, 1, '#e03020'); if (viewer && ph === 1) R(3, -31, 14, 12, 'rgba(255,80,60,.25)'); }
        if (ph >= 2) {
          const n = ph === 3 ? 70 : 26, sp = ph === 3 ? 560 : 300, Wd = VW + 80;
          g.fillStyle = ph === 3 ? 'rgba(230,240,255,.55)' : 'rgba(230,240,255,.35)';
          for (let i = 0; i < n; i++) { const x = (((hash(i, 7, 1) * Wd - t * sp) % Wd) + Wd) % Wd - 40, y = (hash(i, 8, 1) * VH) | 0; g.fillRect(x | 0, y, 8 + ((hash(i, 9, 1) * 14) | 0), 1); }
          if (ph === 3) { g.fillStyle = 'rgba(200,215,230,.1)'; g.fillRect(0, 0, VW, VH); }
        }
      },
      lthouse(g, e, t, R) { R(4, -26, 8, 40, '#d8d4c8'); R(4, -26, 2, 40, '#a8a498'); R(4, -14, 8, 3, '#a02020'); R(4, -2, 8, 3, '#a02020'); R(3, -36, 10, 10, '#2a2a2a'); R(4, -34, 8, 6, '#ffe8a0'); R(5, -38, 6, 2, '#2a2a2a'); },
      mast(g, e, t, R) {
        R(4, 11, 8, 4, '#3a2818'); R(6, -76, 4, 88, '#4a3220'); R(7, -76, 1, 88, '#6a4a30');
        for (const y of [-66, -42, -18]) { R(-12, y, 40, 2, '#3a2818'); R(-10, y + 2, 36, 3, '#b8b09a'); R(-10, y + 4, 36, 1, '#8a8270'); }
        R(0, -16, 1, 26, '#2a1e14'); R(15, -16, 1, 26, '#2a1e14'); R(3, 6, 1, 3, '#c8b890'); R(12, 6, 1, 3, '#c8b890'); R(6, -2, 4, 3, '#c9c0a0');
      },
      sbell(g, e, t, R) { R(2, -8, 2, 22, '#4a3220'); R(12, -8, 2, 22, '#4a3220'); R(1, -10, 14, 3, '#5a3e28'); R(7, -7, 2, 1, '#7a5a20'); R(5, -6, 6, 6, '#a07a2a'); R(4, 0, 8, 2, '#8a6420'); R(6, -5, 1, 4, '#d8b860'); R(7, 2, 2, 1, '#6a4a18'); R(8, 3, 1, 8, '#c8b890'); },
      swheel(g, e, t, R) { R(7, 6, 2, 9, '#3a2818'); R(3, 12, 10, 3, '#3a2818'); R(2, -9, 12, 2, '#6a4a2c'); R(2, 3, 12, 2, '#6a4a2c'); R(0, -7, 2, 10, '#6a4a2c'); R(14, -7, 2, 10, '#6a4a2c'); R(7, -7, 2, 10, '#5a3e24'); R(2, -3, 12, 2, '#5a3e24'); R(7, -12, 2, 3, '#8a6a40'); R(7, 5, 2, 2, '#8a6a40'); R(-3, -3, 3, 2, '#8a6a40'); R(16, -3, 3, 2, '#8a6a40'); R(6, -4, 4, 4, '#c9a35a'); },
      binn(g, e, t, R) { R(4, 3, 8, 12, '#4a3220'); R(3, -2, 10, 5, '#c9a35a'); R(5, -1, 6, 3, '#e8e0c0'); R(7, 0, 2, 1, '#a02020'); R(2, 0, 2, 2, '#8a2020'); R(12, 0, 2, 2, '#208a20'); },
      capst(g, e, t, R) { R(3, 4, 10, 11, '#4a3220'); R(2, 2, 12, 3, '#6a4a2c'); R(-3, 6, 22, 1, '#7a5a38'); R(7, 1, 2, 2, '#8a6a40'); },
      coop(g, e, t, R) { R(1, 2, 14, 13, '#5a4430'); R(2, 4, 12, 9, '#1a140e'); R(3, 8, 4, 3, '#d8c8a8'); R(9, 9, 4, 3, '#a8783a'); R(4, 7, 1, 1, '#c02020'); for (let x = 2; x < 15; x += 3) R(x, 4, 1, 9, '#6a5438'); },
      sgun(g, e, t, R) { R(2, 7, 12, 7, '#5a4030'); R(5, -2, 6, 12, '#2a2a2e'); R(6, -2, 2, 12, '#44444a'); R(3, 12, 3, 3, '#2a1e14'); R(10, 12, 3, 3, '#2a1e14'); R(13, 11, 3, 3, '#1a1a1a'); R(14, 9, 2, 2, '#1a1a1a'); },
      lline(g, e, t, R) { R(2, 6, 12, 8, '#a08a5a'); R(4, 8, 8, 4, '#6a5a3a'); R(5, 9, 6, 2, '#a08a5a'); if (!e.taken) { R(11, 1, 4, 8, '#6a6a72'); R(12, 2, 1, 5, '#9a9aa2'); R(12, -1, 2, 2, '#a08a5a'); } },
      shatch(g, e, t, R) { R(0, 1, 16, 14, '#4a3220'); R(1, 2, 14, 12, '#2a1a0e'); for (let x = 2; x < 15; x += 3) R(x, 2, 1, 12, '#5a3e24'); for (let y = 3; y < 14; y += 3) R(1, y, 14, 1, '#5a3e24'); if (e.letters) { R(3, 4, 10, 7, '#c8b88a'); R(4, 3, 9, 7, '#d8c89a'); R(5, 5, 6, 1, '#6a5a3a'); R(7, 7, 3, 2, '#8a2a20'); } },
      nbag(g, e, t, R) { R(4, 3, 8, 11, '#c8bfa0'); R(6, 1, 4, 3, '#a89e80'); R(5, 4, 6, 1, '#6a5a3a'); R(9, 8, 4, 5, '#a8a088'); R(10, 7, 1, 4, '#d8d8d0'); },
      sailw(g, e, t, R) { R(0, 6, 16, 8, '#d8d0b8'); R(0, 6, 16, 1, '#e8e0c8'); R(3, 9, 9, 1, '#8a8270'); R(12, 8, 3, 3, '#a8a088'); },
      gang(g, e, t, R) { R(2, 6, 12, 5, '#1a120a'); R(1, 4, 14, 2, '#7a5a38'); R(1, 11, 14, 1, '#7a5a38'); },
      hamm(g, e, t, R) { R(0, 0, 1, 5, '#6a5a3a'); R(15, 0, 1, 5, '#6a5a3a'); R(0, 4, 16, 5, '#b8b098'); R(2, 8, 12, 2, '#a8a088'); if (e.lump) R(4, 3, 8, 3, '#8a8270'); },
      schest(g, e, t, R) { R(1, 4, 14, 10, '#5a3e28'); R(1, 3, 14, 3, '#6a4a30'); R(0, 7, 1, 3, '#a08a5a'); R(15, 7, 1, 3, '#a08a5a'); R(7, 6, 2, 2, '#c9a35a'); if (e.mag) { R(4, 0, 9, 4, '#d8d0b0'); R(5, 1, 6, 1, '#8a3a2a'); } },
      sroll(g, e, t, R) { R(0, 4, 16, 5, '#d8d0b8'); R(0, 4, 2, 5, '#a8a088'); if (!e.taken) { R(0, 9, 16, 5, '#c8c0a8'); R(0, 9, 2, 5, '#a8a088'); } else R(1, 10, 14, 4, '#3a2a1a'); R(0, 0, 16, 4, '#ccc4ac'); R(0, 0, 2, 4, '#a8a088'); },
      mail(g, e, t, R) { R(1, 4, 6, 11, '#8a7a5a'); R(8, 3, 7, 12, '#7a6a4a'); R(2, 2, 4, 3, '#6a5a3a'); R(9, 1, 5, 3, '#6a5a3a'); R(3, 7, 2, 2, '#a02020'); R(10, 6, 2, 2, '#a02020'); },
      notice(g, e, t, R) { R(3, 3, 10, 11, '#d8d0b0'); for (let y = 5; y < 13; y += 2) R(4, y, 8, 1, '#6a6050'); R(7, 2, 2, 1, '#888'); },
      baro(g, e, t, R) { R(5, 0, 6, 15, '#6a4a2c'); R(6, 1, 4, 13, '#c9a35a'); R(7, 2, 2, 9, '#d8d8d8'); R(7, 7, 2, 4, '#7a7a8a'); R(5, 11, 6, 4, '#e8e0c0'); R(7, 12, 2, 1, '#2a2a2a'); },
      swin(g, e, t, R) { for (let i = 0; i < e.w; i++) { R(i * 16 + 2, 3, 12, 10, '#0a1420'); R(i * 16 + 1, 2, 14, 1, '#6a4a2c'); R(i * 16 + 7, 3, 2, 10, '#4a3220'); R(i * 16 + 2, 7, 12, 1, '#4a3220'); R(i * 16 + 3 + ((t * 8 + i * 5) % 9 | 0), 4, 1, 3, 'rgba(170,190,220,.5)'); } },
      cdesk(g, e, t, R) { R(0, 4, 32, 10, '#5a3e28'); R(0, 3, 32, 2, '#7a5a38'); R(6, -1, 11, 5, '#3a1a10'); R(7, -1, 9, 1, '#e8e0c8'); R(11, -1, 1, 5, '#2a1008'); R(20, 0, 3, 3, '#111'); R(22, -4, 1, 4, '#e8e8e0'); R(27, -3, 2, 5, '#e8e0c0'); R(27, -5 + (Math.sin(t * 9) > 0 ? 0 : 1), 2, 2, '#ffc860'); },
      ctable(g, e, t, R) { R(0, 4, 32, 10, '#4a3220'); R(2, 1, 28, 9, '#d8cca0'); R(4, 3, 9, 1, '#6a5a3a'); R(12, 4, 6, 1, '#6a5a3a'); R(17, 5, 4, 1, '#6a5a3a'); R(20, 6, 3, 2, '#a02020'); R(6, 7, 14, 1, 'rgba(60,60,140,.5)'); R(25, 2, 1, 6, '#8a8a8a'); R(27, 2, 1, 6, '#8a8a8a'); },
      cbunk(g, e, t, R) { R(0, 2, 16, 13, '#4a3220'); R(1, 5, 14, 9, '#3a4a6a'); R(2, 3, 6, 3, '#d8d0c0'); R(10, -2, 4, 4, '#c8c0a8'); R(11, -1, 2, 2, '#6a6a6a'); },
      wlamp(g, e, t, R) { R(7, -2, 2, 3, '#333'); R(5, 1, 6, 8, '#2a2016'); R(6, 2, 4, 6, e.off ? '#4a3a2a' : (Math.sin(t * 7 + e.px) > -.6 ? '#ffc060' : '#e8a040')); },
      invisible() { }
    },
    tiles: {
      water: { solid: true, paint(R, X, Y) { seaPaint(R, X, Y, true); } },
      shallow: { solid: false, paint(R, X, Y) { seaPaint(R, X, Y, false); } },
      reef: { solid: true, paint(R, X, Y) {
        seaPaint(R, X, Y, false);
        const h = hash(X, Y, 41), o = (h * 4) | 0;
        R(1 + o, 3, 11, 10, '#1c1a18'); R(2 + o, 2, 8, 3, '#34302a'); R(3 + o, 4, 4, 2, '#4a453e'); R(8 + o % 2, 9, 4, 3, '#26221e');
        for (let i = 0; i < 4; i++) { const fx = (hash(X, Y, 50 + i) * 13) | 0, fy = (hash(X, Y, 60 + i) * 14) | 0; R(fx, fy, 3 + (i % 2) * 2, 1, i % 2 ? '#e8f0f4' : '#b8ccd6'); }
      } },
      cliff: { solid: true, paint(R, X, Y) { R(0, 0, 16, 16, '#36302a'); for (let i = 0; i < 7; i++) R((hash(X, Y, i) * 13) | 0, (hash(Y, X, i) * 13) | 0, 3, 2, i % 2 ? '#4a4238' : '#221e1a'); if (Y === 0) { R(0, 0, 16, 5, '#2e3e26'); R((hash(X, Y, 9) * 12) | 0, 4, 4, 2, '#2e3e26'); } if (Y === 2) { R(0, 13, 16, 3, '#1c1a18'); R((hash(X, Y, 8) * 10) | 0, 14, 6, 1, '#c8d8e0'); } } },
      bulw: { solid: true, paint(R) { R(0, 0, 16, 16, '#2e2014'); R(0, 3, 16, 4, '#6a4a2c'); R(0, 3, 16, 1, '#8a6a44'); R(0, 7, 16, 1, '#1a120a'); R(2, 8, 2, 8, '#4a3420'); R(12, 8, 2, 8, '#4a3420'); R(0, 12, 16, 4, '#3a2818'); } }
    },
    maps: {
      /* ---------------- 海燕号甲板 ---------------- */
      deck: {
        amb: 'wind', dark: .5, plr: 3.2, floor: 'wood', tileOpts: { woodC: '#6a5238' },
        legend: { 'B': 'bulw' }, rows: deckRows(),
        ents: [
          { id: 'dutch', x: 2, y: 0, w: 24, h: 3, spr: 'dutchbig', solid: false, hidden: true, light: { r: 8, col: 'rgba(255,40,30,.10)', dx: 190, dy: 26, a: .7 } },
          { id: 'dl1', x: 3, y: 2, spr: 'invisible', hidden: true, light: { r: 3, col: 'rgba(255,50,40,.24)' } },
          { id: 'dl2', x: 23, y: 1, spr: 'invisible', hidden: true, light: { r: 3.4, col: 'rgba(255,50,40,.26)' } },
          { id: 'vdd', x: 22, y: 1, spr: '@vdd', solid: false, hidden: true, dir: 0 },
          { id: 'gboat', x: 0, y: 3, spr: 'gboat', solid: false, hidden: true, light: { r: 1.6, col: 'rgba(255,80,50,.2)', dx: 20 } },
          { id: 'fore', x: 8, y: 8, spr: 'mast', light: { r: 2.2, col: 'rgba(255,210,140,.1)', dy: 4 }, on: S => S.narr(S.f.phase === 'dusk' ? '前桅。上桅帆已经收了一半，水手们说今晚要变天。' : '前桅。破了的上桅帆还没换，帆布条在雾里一动不动地垂着。') },
          { id: 'main', x: 15, y: 8, spr: 'mast', light: { r: 2.4, col: 'rgba(255,210,140,.12)', dy: 4 }, on: S => S.narr('主桅，比两个人合抱还粗，一直伸进头顶的暗处。\n桅杆上钉着一枚马蹄铁，开口朝上——说是能兜住好运。') },
          { id: 'mizz', x: 21, y: 8, spr: 'mast', on: S => S.narr('后桅。桅脚下盘着一圈一圈的缆绳，被海水泡得发黑。') },
          { id: 'bell', x: 10, y: 5, spr: 'sbell', on: ringBell },
          { id: 'gang', x: 12, y: 4, spr: 'gang', on: S => S.narr(S.f.phase === 'dusk' ? '舷门。靠港的时候，从这里搭跳板。' : '舷门外头就是雾。雾里有一股烂海草的味道。') },
          { id: 'lline', x: 2, y: 7, spr: 'lline', on: getLead },
          { id: 'sailw', x: 5, y: 10, spr: 'sailw', on: S => S.narr('老奈德正在补的那面上桅帆，摊在甲板上。针脚又密又直，像一排小小的牙印。') },
          { id: 'nbag', x: 3, y: 9, spr: 'nbag', async on(S) { if (S.once('nbag')) await S.narr('老奈德的帆布包。里头有帆针、蜡线、一块磨针的石头，还有一个卷了边的小本子。'); await S.note('ned'); } },
          { id: 'ned', x: 5, y: 9, spr: '@ned', dir: 0, on: nedTalk },
          { id: 'sgun', x: 11, y: 11, spr: 'sgun', on: S => S.narr('号炮。平时只在进港的时候放一响。旁边码着几颗生了锈的实心弹。') },
          { id: 'capst', x: 12, y: 8, spr: 'capst', on: S => S.narr('绞盘。起锚的时候，八个人推着杆子转圈，一边转一边唱号子。') },
          { id: 'mate', x: 14, y: 6, spr: '@mate', dir: 0, on: mateTalk },
          { id: 'hatch', x: 17, y: 9, spr: 'shatch', to: ['below', 11, 3, 0] },
          { id: 'tom', x: 18, y: 7, spr: '@tom', dir: 1, on: tomTalk },
          { id: 'cask', x: 19, y: 5, spr: 'barrel', on: S => S.narr('淡水桶。桶上用粉笔写着灌水的日子——水已经开始发臭了。') },
          { id: 'coop', x: 19, y: 11, spr: 'coop', on: S => S.narr(S.f.phase === 'dusk' ? '鸡笼里三只母鸡挤成一团，一声不吭。\n厨子说，过了厄加勒斯角，它们就再没下过蛋。' : '鸡笼里的三只母鸡全都把头埋进了翅膀底下。') },
          { id: 'binn', x: 24, y: 7, spr: 'binn', on: S => S.narr(S.f.phase === 'dusk' ? '罗经柜。铜盖子底下，罗盘的指针一直在细细地抖。' : '罗盘的指针在慢慢打转。一圈，又一圈。') },
          { id: 'wheel', x: 25, y: 8, spr: 'swheel', on: S => S.narr(S.f.phase === 'dusk' ? '舵轮。霍克船长的手搭在上面，像是长在了上面。' : '舵轮。你的手心还是麻的，指头上全是轮辐磨出来的血泡。') },
          { id: 'capt', x: 26, y: 8, spr: '@capt', dir: 1, on: captTalk },
          { id: 'slamp', x: 27, y: 6, spr: 'invisible', light: { r: 3.2, col: 'rgba(255,200,120,.14)' } },
          { id: 'flamp', x: 4, y: 8, spr: 'invisible', light: { r: 2.6, col: 'rgba(255,200,120,.12)' } },
          { id: 'willem', x: 12, y: 5, spr: '@willem', hidden: true, dir: 0, light: { r: 1.4, col: 'rgba(160,210,220,.16)' }, on: willemTalk },
          { id: 'wx', x: 0, y: 0, spr: 'wxfx', solid: false, z: 1 }
        ],
        async enter(S, first) {
          const f = S.f;
          if (f.phase === 'fog' || f.phase === 'aboard') S.amb('none');
          if (first && f.phase === 'dusk') return duskIntro(S);
          if (f.phase === 'fog' && S.once('fogIntro')) return fogIntro(S);
        },
        tick(S, dt) {
          const f = S.f, p = S.pl;
          const wx = getEnt('wx', 'deck'); if (wx) { wx.px = p.px; wx.py = p.py; }
          if (f.phase === 'fog' && W.timer) { const b = getEnt('gboat', 'deck'); if (b && !b.hidden) { const k = 1 - clamp(W.timer.left / TBOAT, 0, 1); b.px = Math.round(lerp(0, 10, k) * TS); b.x = Math.round(b.px / TS); } }
          if (S.busy) return;
          DT.cr -= dt; if (DT.cr <= 0) { DT.cr = 4 + Math.random() * 5; creak(S); }
          if (f.phase === 'dusk') {   // 老奈德一边补帆一边哼的号子：走近了才听得见
            const n = getEnt('ned', 'deck'), d = Math.abs(n.px - p.px) / TS + Math.abs(n.py - p.py) / TS;
            DT.sh -= dt;
            if (DT.sh <= 0) { const [fq, len] = SHANTY[DT.si % SHANTY.length]; DT.si++; DT.sh = len * .5; if (fq && d < 7) S.tone('triangle', fq, fq, len * .48, .03 * (1 - d / 7), 0, 900); }
          }
        }
      },
      /* ---------------- 舱下 ---------------- */
      below: {
        amb: 'room', dark: .58, plr: 3, wall: 'wood', floor: 'wood', tileOpts: { woodC: '#5a4430' },
        rows: belowRows(),
        ents: [
          { id: 'ladder', x: 11, y: 2, spr: 'stairsup', solid: false, to: ['deck', 17, 10, 0] },
          { id: 'orders', x: 13, y: 1, spr: 'notice', async on(S) { await S.note('orders'); } },
          { id: 'lamp1', x: 4, y: 1, spr: 'wlamp', solid: false, light: { r: 3.2, col: 'rgba(255,190,110,.16)', dy: 16 } , on: S => S.narr('水手舱的马灯。灯罩被油烟熏得发黄，一晃一晃，把吊床的影子甩到舱壁上。') },
          { id: 'lamp2', x: 12, y: 1, spr: 'wlamp', solid: false, light: { r: 3, col: 'rgba(255,190,110,.14)', dy: 16 } , on: S => S.narr('舱梯口的马灯。灯芯剪得很短——老奈德说，船上最怕的不是水，是火。') },
          { id: 'lamp3', x: 19, y: 1, spr: 'wlamp', solid: false, light: { r: 3.4, col: 'rgba(255,190,110,.16)', dy: 16 } , on: S => S.narr('船长室的灯。玻璃罩擦得透亮，灯座用铜螺丝拧死在舱壁上。') },
          { id: 'hamm1', x: 2, y: 3, spr: 'hamm', lump: true, on: S => S.narr('汤姆的吊床。床头用红线拴着一只马蹄铁——他说，保佑不沉船。') },
          { id: 'hamm2', x: 4, y: 3, spr: 'hamm', on: S => S.narr('老奈德的吊床。补了又补，补丁比原来的帆布还多。') },
          { id: 'hamm3', x: 6, y: 3, spr: 'hamm', on: S => S.narr('你的吊床。睡了五个月，你已经能在浪里一晃一晃地睡着了。') },
          { id: 'mychest', x: 2, y: 7, spr: 'schest', on: myChest },
          { id: 'nchest', x: 5, y: 7, spr: 'schest', mag: true, async on(S) { if (S.once('mag')) await S.narr('老奈德的箱子上压着一本翻烂的旧杂志，有一页折了角。'); await S.note('tale'); } },
          { id: 'sroll', x: 10, y: 7, spr: 'sroll', on: getCanvas },
          { id: 'mail', x: 13, y: 7, spr: 'mail', on: S => S.narr(S.f.phase === 'dusk' ? '三只帆布邮袋，封口的火漆上压着皇冠。寄回英国的信，有船员的，也有孟买那边托带的。\n大副说，邮袋比茶叶金贵。' : '……老奈德说，不接的信，会自己钻进你的邮袋里来。\n你下意识地摸了摸封口的火漆。还是好好的。') },
          { id: 'ropes', x: 14, y: 3, spr: 'rope', solid: true, on: S => S.narr('一盘一盘的备用缆绳，盘得像一窝睡着的蛇。') },
          { id: 'baro', x: 17, y: 1, spr: 'baro', on: baro },
          { id: 'swin', x: 21, y: 1, w: 3, spr: 'swin', on: S => S.narr(S.f.phase === 'dusk' ? '船尾窗外，天边压着一线铅灰色的云。浪头的白沫一条一条，像谁在海上划了很多道。' : '窗外只有白。白得什么也看不见。\n……玻璃上有一个湿手印。是从外面按上来的。') },
          { id: 'log', x: 19, y: 3, w: 2, spr: 'cdesk', async on(S) { if (S.once('log')) await S.narr('船长的桌上摊着航海日志。你知道不该看……可你还是看了。'); await S.note('log'); } },
          { id: 'chart', x: 18, y: 6, w: 2, spr: 'ctable', on: S => S.narr('海图上用铅笔画着航线：从厄加勒斯角往西，绕过开普角，再往北上大西洋。\n开普角那一头，有人用红墨水圈了一圈，旁边写着两个小字：「风暴」。') },
          { id: 'bunk', x: 24, y: 3, spr: 'cbunk', on: S => S.narr('船长的床铺。床头钉着一张小小的银版照片：一个女人，两个扎辫子的小姑娘。\n照片底下写着：「玛莎、艾米、露西」。') },
          { id: 'cchair', x: 21, y: 4, spr: 'chair', on: S => S.narr('船长的椅子，腿用铁链拴在地板上，免得风浪里满舱乱滑。') }
        ]
      },
      /* ---------------- 开普角外海（掌舵） ---------------- */
      sea: {
        amb: 'rain', dark: .68, plr: 3.6, rain: true, fog: .1,
        legend: { 'Y': 'cliff', 'X': 'reef' }, rows: seaRows(),
        ents: [
          { id: 'lh', x: 32, y: 3, spr: 'lthouse', light: { r: 4, col: 'rgba(255,236,170,.16)', dy: -26 } },
          { id: 'gship', x: 75, y: 9, spr: 'gship', solid: false, hidden: true, dir: 1, light: { r: 6, col: 'rgba(255,50,30,.3)' } },
          { id: 'wind', x: 0, y: 0, spr: 'windfx', solid: false, z: 1, light: { pl: true, r: 2.2, col: 'rgba(255,210,140,.12)', dx: 30, dy: 2 } }
        ],
        enter: seaEnter,
        step(S, x, y) { if (S.f.phase === 'storm' && x <= 3) return escape(S); },
        tick(S, dt) {
          if (S.f.phase !== 'storm' || !ST || ST.done) return;
          const p = S.pl, wd = getEnt('wind', 'sea');
          if (wd) { wd.px = p.px; wd.py = p.py; }
          if (!W._camHold) S.focus(p.px / TS - 2, p.py / TS);
          ST.beam += dt * .9;
          S.lights([[32 * 16 + 8 + Math.cos(ST.beam) * 16 * 7, 3 * 16 + Math.abs(Math.sin(ST.beam)) * 16 * 6, 2.6, .55]]);
          if (S.busy) return;
          ST.lt -= dt; if (ST.lt <= 0) { ST.lt = 7 + Math.random() * 6; thunder(S, false); }
          /* 阵风：预兆 .6 秒（旁观者可见）→ 警告 1.3 秒 → 风到 1.6 秒；风到时还在动舵就算一次 */
          ST.pt += dt;
          if (ST.ph === 0) { if (ST.pt >= ST.next) { ST.ph = 1; ST.pt = 0; wd.s.g = 1; } }
          else if (ST.ph === 1) { if (ST.pt >= .6) { ST.ph = 2; ST.pt = 0; wd.s.g = 2; S.toast('阵风！停住舵！'); S.tone('sawtooth', 220, 880, 1.3, .035, 0, 900); S.tone('triangle', 330, 1250, 1.3, .02); } }
          else if (ST.ph === 2) { if (ST.pt >= 1.3) { ST.ph = 3; ST.pt = 0; ST.hit = false; wd.s.g = 3; S.tone('sawtooth', 700, 260, 1.6, .05, 0, 700); S.sfx('whisper'); S.shake(1600, 1.5); } }
          else if (ST.ph === 3) {
            if (!ST.hit && ST.pt > .12 && S.moving) { ST.hit = true; S.run(gustHit); return; }
            if (ST.pt >= 1.6) { ST.ph = 0; ST.pt = 0; wd.s.g = 0; ST.gi++; ST.next = GUSTS[ST.gi % GUSTS.length]; }
          }
          if (!ST.spawned && p.x <= 61) { ST.spawned = true; S.run(spawnGhost); return; }
          const gs = getEnt('gship', 'sea');
          if (gs && gs.chase) { const d = Math.abs(gs.px - p.px) / TS + Math.abs(gs.py - p.py) / TS; ST.hb -= dt; if (d < 8 && ST.hb <= 0) { S.sfx('heart'); ST.hb = .35 + d * .1; if (d < 5) { S.fx('red', { dur: .5 }); S.tone('sawtooth', 70, 52, .6, .05, 0, 260); } } }
        }
      }
    }
  });
})();
