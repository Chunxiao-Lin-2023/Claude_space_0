/* ================= 第三十夜 · 灯塔（卷三与全书收束） ================= */
(() => {
  const DAWN = 85;                                  // 风暴夜：守到天亮的秒数
  const CALM = 75;                                  // 风停以后：他们出门前的秒数
  const PD = 20, CD = 34;                           // 压力 / 发条从满到底的秒数
  const EVT = [12, 30, 52];                         // 风暴夜事件（开始后第几秒）：罗里梦游、灯廊门、罗里又起来
  const RSPD = [1.05, 1.4];                         // 罗里梦游的速度（格/秒）
  const RS = { storm: null, calm: null };           // 死亡/坏结局时剩下的秒数（不进存档，重来时用）
  const FL = { on: false, gust: 3, horn: false };   // 透镜闪光、阵风等瞬时状态
  let RP = [];                                      // 罗里梦游的路线
  const LENS = [6 * 16 + 8, 4 * 16 - 6];

  const VOL3 = '十个夜晚。\n布拉格的阁楼里，嘴里含着一张字条的泥人；\n爱丁堡地底下，堆满了玩具的小屋；\n雷纳姆的楼梯上，一个穿棕色锦缎裙子的女人；\n加利西亚的夜路上，跟在身后的一排烛光；\n热沃当的山林，溪边的琴声，跑铃队伍里多出来的那一个；\n昆士兰的荒原上，你追它就退的一团光；\n帝王谷的台阶底下，三千多年没有开过的门——\n最后，是大西洋里的一座灯塔。\n\n这一卷的夜，总有人留下来，守着点什么：\n一张字条，一个名字，一支蜡烛，一条规矩。\n\n后来的人讲起这些夜晚，讲的总是走出去的那几个。\n很少有人讲，那些留下来、把灯点上的。';
  const FIN = '三十个夜晚，三卷。\n\n从网上一层一层盖起来的帖子，\n到美洲的公路、河岸和松林；\n从欧洲的海、森林和雪山，\n到布拉格的阁楼、爱丁堡的地底；\n从澳洲内陆一闪一闪的光，\n到埃及帝王谷的石阶——\n最后，走到大西洋边上，一座灯塔。\n\n加上前两部，一共九十个夜晚。\n九十个夜晚以前，你在一面镜子前，点着了一支蜡烛。\n\n按百物语的老规矩，讲完一个故事，吹灭一盏灯；\n讲完最后一个，最后一盏也要吹灭——\n据说到了那时候，才会有真东西来。\n\n所以，最后这一盏，我们不吹了。\n它在海上，从日落亮到日出。\n两闪，三十秒，再两闪。\n\n两个人，同看一盏灯。\n天亮之前，它一直亮着。';

  /* ---------------- 小工具 ---------------- */
  const dist = (S, x, y) => Math.abs(S.pl.x - x) + Math.abs(S.pl.y - y);
  function handoff(S) { if (S.coop) S.toast('换个人来吧——按 T（或点交换按钮）把操作交给同伴'); }
  const put = (S, id, x, y, d, spr) => { S.place(id, x, y, d); if (spr) S.ent(id).spr = spr; };
  const hideAll = (S, ...ids) => ids.forEach(i => S.hide(i));
  function bunks(S, r, a) { S.ent('bunk_r').s.occ = r ? 1 : 0; S.ent('bunk_a').s.occ = a ? 1 : 0; }
  function coats(S, n) { S.ent('hooks').s.n = n; }

  /* 每次进图：按阶段设定光照与环境声 */
  function mood(S) {
    const f = S.f, ph = f.ph, m = S.map;
    let dark = null, plr = null, amb = null;
    if (m === 'isle') {
      if (f.look) { dark = f.look === 2 ? .5 : .3; amb = f.look === 2 ? 'none' : 'wind'; }
      else if (ph === 'arrive') { dark = .3; amb = 'wind'; }
      else if (ph === 'out') { dark = .5; amb = 'none'; }
      else if (ph === 'morning') { dark = .06; amb = 'wind'; }
    }
    if (m === 'house') {
      const night = ph === 'night1' || ph === 'storm';
      dark = night ? .86 : ph === 'morning' || ph === 'log' ? .35 : ph === 'tour' || ph === 'lamp' ? .5 : .58;
      plr = night ? 2.6 : null;
      amb = ph === 'storm' ? 'rain' : ph === 'calm' ? 'none' : ph === 'day2' || ph === 'day3' ? 'wind' : night ? 'night' : 'room';
    }
    if (m === 'tower') { dark = f.lit ? .72 : .8; amb = ph === 'storm' ? 'rain' : ph === 'calm' ? 'none' : 'wind'; }
    S.dark(dark); S.plr(plr); if (amb) S.amb(amb);
  }
  /* 透镜的光：风暴夜随压力变暗 */
  function lensLight(S) {
    const e = S.ent('lens'); if (!e) return;
    if (!S.f.lit) { e.light = null; return; }
    const p = S.f.ph === 'storm' ? Math.max(.12, S.f.P) : 1;
    e.light = { r: 2 + 4.6 * p, col: 'rgba(255,236,190,.22)', flick: p < .35, dy: -8 };
  }
  /* 合成音效 */
  const horn = (S, v = .07) => { S.tone('sawtooth', 92, 86, 2.4, v, 0, 380); S.tone('sawtooth', 138, 130, 2.4, v * .6, .05, 420); };
  const rumble = (S, v = .1) => { S.tone('sine', 46, 30, 3.2, v, 0, 200); S.tone('triangle', 60, 38, 2.8, v * .7, .2, 260); };
  const tick2 = S => { S.tone('square', 1800, 1800, .02, .03, 0, 3500); S.tone('square', 1500, 1500, .02, .025, .5, 3500); };

  /* ================= 第一天：上岛 ================= */
  async function arrival(S) {
    S.f.ph = 'arrive'; mood(S);
    S.focus(24, 20);
    await S.narr('补给船在东码头靠了不到一刻钟。\n卸下你的木箱、两袋面粉和三桶煤油，就掉头走了。');
    S.sfx('splash'); S.alpha('boat', 0, 2400);
    await S.narr('浪一下一下拍着混凝土台阶。\n船在灰色的海上越变越小，最后成了一个点。');
    S.focus(null);
    await S.walk('rory_i', [24, 18], 3); S.face('rory_i', 'pl');
    await S.say('罗里', '你就是新来的替班？卡勒姆？……我是罗里，第二看守。');
    await S.say('罗里', ['补给船两个礼拜来一趟，天不好就不来。', '从今天起，这岛上就咱们三个人了。']);
    await S.say('罗里', '走吧，安格斯在上面等着。路陡，跟着铁轨走。');
    S.goal('沿着铁轨往上走，跟上罗里');
    await S.walk('rory_i', [16, 13], 3.4); S.face('rory_i', 1);
    S.f.rWait = true;
  }
  /* 路边的小礼拜堂：老规矩 */
  async function chapelTalk(S) {
    S.f.chapel = true;
    S.face('rory_i', 'pl');
    await S.say('罗里', '（他朝路边一间矮矮的石头小屋扬了扬下巴）圣弗兰南的礼拜堂。几百年前就在这儿了。咱们看守管它叫「狗窝」——小得只够一个人跪进去。');
    await S.say('罗里', ['我是刘易斯人。我爷爷那辈，夏天会划船上这片岛来捡鸟蛋、剪羊毛。', '他们有老规矩：爬到岛顶，先把帽子摘了，顺着太阳转一圈，谢这地方让你平平安安上来。', '在岛上不叫它的名字。不说「弗兰南」，只说「那片地方」。']);
    const r = await S.ask('罗里看着你，像在等着看你怎么做。', ['（摘下帽子，顺着太阳转一圈）', '（笑了笑，没动）']);
    if (r === 0) {
      S.f.custom = true;
      for (const d of [3, 2, 0, 1, 3]) { S.turn(d); await S.wait(260); }
      await S.say('罗里', '（他也摘了帽子）……好。我爷爷会喜欢你的。');
    } else await S.say('罗里', '也对，都什么年月了。（他自己摘下帽子，顺着太阳转了一圈，又戴上）');
    await S.say('罗里', '走吧。');
    await S.walk('rory_i', [15, 10], 3.5); S.hide('rory_i');
    S.goal('进灯塔：院子里，北边那扇门');
  }
  /* 回头一瞥：往西码头去的小路上，站着一个穿雨衣的人 */
  async function glimpse(S) {
    S.f.glimpse = true;
    const g = S.ent('ghost_i'); S.place('ghost_i', 5, 13, 1); g.alpha = 0;
    S.alpha('ghost_i', .85, 700);
    S.focus(6, 13);
    await S.narr('你下意识地回头，往西边看了一眼。\n通往西码头的小路尽头，站着一个人。');
    S.sfx('whisper');
    await S.narr('一件油布雨衣，帽兜拉得很低，一动不动地对着海。');
    await S.alpha('ghost_i', 0, 900);
    S.focus(null);
    await S.think('……罗里？不对，罗里刚进了院子。');
  }

  /* ================= 第一天：灯塔里 ================= */
  async function meetAngus(S) {
    S.f.ph = 'tour';
    put(S, 'angus_h', 4, 3, 0, '@angus'); put(S, 'rory_h', 6, 3, 1, '@rory');
    mood(S);
    await S.say('安格斯', '（桌边一个灰胡子的男人站了起来）卡勒姆。我是安格斯，首席看守。');
    await S.say('安格斯', ['在这座岛上，规矩只有三条。', '灯从日落亮到日出，一分钟也不许灭。', '灯塔任何时候不许没人——三个人，永远不许同时出门。', '天气、风向、点灯熄灯的时辰，天天记日志。白天先写在石板上，晚上誊进本子。']);
    await S.note('duty');
    await S.say('罗里', '（小声）他讲规矩的时候，你最好别笑。');
    await S.say('安格斯', '日落是三点三十五分，还有一个钟头。上灯室，我教你点灯。');
    S.goal('上灯室（办公室东头的楼梯）');
    S.cp();
  }
  async function towerTour(S) {
    put(S, 'angus_t', 3, 6, 2, '@angus'); S.hide('angus_h');
    await S.narr('灯室是一只玻璃罩子，罩在塔顶上。\n正中间立着透镜：一人多高，一圈一圈的玻璃棱，像一只巨大的蜂巢。');
    await S.say('安格斯', ['它转起来，海上的船看一眼就知道这是哪座灯塔。', '每座灯塔闪法都不一样，这叫灯质。闪错了，船就会认错，认错了，就会撞上礁石。']);
    await S.say('安格斯', '先出去看看，你要守的是个什么地方。');
    S.f.look = 1;
    await towerView(S, async () => {
      S.focus(24, 18);
      await S.narr('灯廊上风很大。整座岛在脚底下摊开，像一块被海啃过的绿毯子。\n往东，是你下船的东码头。');
      S.focus(4, 14);
      await S.narr('往西，悬崖底下是西码头：一台吊杆，一只装吊绳的木箱，一圈铁栏杆。');
      await S.say('安格斯', ['西码头离海面一百多英尺。', '可这儿的海不讲道理。西边就是整个大西洋，中间什么也挡不住。']);
      await S.narr('风从西南来，很轻。\n海面一道一道地起伏，像在睡觉。');
    });
    S.f.wind1 = true;
    S.f.ph = 'lamp';
    await S.say('安格斯', '好。规程你看过了。日落前把灯点上——我看着，不帮手。');
    S.goal('点灯：照「值班规程」的五步来（两人时：一人看「笺」念步骤，一人操作）');
    handoff(S);
    S.cp();
  }
  /* 从灯廊上往下看：借岛上的地图拍一个远景 */
  async function towerView(S, body) {
    const back = [S.pl.x, S.pl.y, S.pl.dir];
    S.sfx('open');
    await S.fade(1, 400);
    S.hidePlayer(true);
    await S.go('isle', 18, 9, 0, { fade: false });
    await S.fade(0, 500);
    await body();
    await S.fade(1, 400);
    S.focus(null); S.hidePlayer(false); S.f.look = 0;
    await S.go('tower', back[0], back[1], back[2], { fade: false });
    S.sfx('close');
    await S.fade(0, 400);
  }

  /* ---------- 点灯 ---------- */
  function lampHint(S) {
    const f = S.f;
    if (!f.bl) return '先把遮光帘拉起来。白天拉着它，是怕太阳光被透镜聚起来，把灯芯烧了。';
    if (f.mantle) return '纱罩烧坏了。墙角的备件柜里有新的，换上再说。';
    if (!f.pre) return '预热。酒精在那个小铜壶里，倒进燃烧器底下的预热碗，点着。';
    if (f.preL > 0) return '等。沙漏没漏完，燃烧器就不够热，煤油变不成汽。';
    if ((f.pu || 0) < 3) return '打气。压力表打到红线。';
    if (!f.lit) return '开阀，点纱罩。';
    if (!f.rot) {
      const n = f.gErr || 0;
      if (n >= 4) return '六十。转一圈，六十秒。';
      if (n >= 3) return '两组牛眼，每组之间要隔三十秒……那转一圈呢？';
      if (n >= 2) return '四块牛眼，两两一组，背对背。透镜转一圈，海上的人看见几组？';
      return '上发条，按灯质定转速。灯质在规程最底下；透镜是什么样的，去看它的铭牌。';
    }
    return '好了。';
  }
  /* 出过两次错以后，目标提示直接写下一步 */
  function lampGoal(S) {
    const f = S.f; if ((f.lErr || 0) + (f.gErr || 0) < 2 || f.ph !== 'lamp') return;
    const g = f.mantle ? '去备件柜换一只新纱罩' : !f.bl ? '拉起遮光帘（灯笼窗）' : !f.pre ? '点着预热碗（小铜壶）' : f.preL > 0 ? '等沙漏漏完' : (f.pu || 0) < 3 ? `打气到红线（${f.pu || 0}/3）` : !f.lit ? '开阀点火（透镜）' : '上发条、设转速（钟表机构）';
    S.goal('点灯：' + g);
  }
  async function lampFail(S, text, scold) {
    S.f.lErr = (S.f.lErr || 0) + 1;
    await S.narr(text);
    S.face('angus_t', 'pl');
    await S.say('安格斯', scold);
    if (S.f.lErr >= 2) await S.say('安格斯', '（他叹了口气）……' + lampHint(S));
    lampGoal(S);
  }
  async function useBlinds(S) {
    const f = S.f;
    if (f.ph === 'lamp' && !f.bl) {
      f.bl = 1; S.ent('blinds').open = true; S.sfx('tear');
      await S.narr('你把遮光帘一幅一幅卷上去。\n灰白的天光和海一下子涌进了灯室。');
      if (f.rot) return lampDone(S);
      return lampGoal(S);
    }
    if (f.ph === 'storm') return S.narr('玻璃外面一片漆黑。雨水一层一层地往下淌，闪电亮的那一下，能看见浪头白得吓人。');
    if (f.ph === 'calm') return S.narr('玻璃外面的海，平得发亮。平得不对劲。');
    await S.narr(S.ent('blinds').open ? '灯笼窗。一圈菱形的玻璃，擦得一个指印也没有。' : '遮光帘放下来了，像给灯室拉上了一圈白布帐子。');
  }
  async function useSpirit(S) {
    const f = S.f;
    if (f.ph === 'lamp' && !f.lit) {
      if (!f.pre) {
        f.pre = 1; f.preL = 8; S.sfx('match');
        S.tone('triangle', 330, 330, .4, .03, 0, 2000);
        await S.narr('你往预热碗里倒了一小杯酒精，划着火柴。\n一圈淡蓝色的火苗贴着碗沿烧了起来，舔着燃烧器的铜管。');
        await S.narr('旁边的小沙漏翻了过来，沙子开始往下漏。');
        return lampGoal(S);
      }
      return S.narr(f.preL > 0 ? '沙漏还在漏。蓝火苗一抖一抖的。' : '沙子漏完了。燃烧器的铜管烫手。');
    }
    await S.narr('一只小铜壶，装着预热用的酒精，旁边立着一只小沙漏。');
  }
  async function usePump(S) {
    const f = S.f;
    if (f.ph === 'storm') {
      f.P = 1; S.ent('pump').s.p = 1; S.sfx('switch'); lensLight(S);
      S.tone('sine', 220, 320, .25, .04, 0, 1200);
      return S.toast('压力回到了红线');
    }
    if (f.ph === 'lamp' && !f.lit) {
      if ((f.pu || 0) >= 3) return S.narr('指针已经顶在红线上了。再打，油箱就要叫了。');
      f.pu = (f.pu || 0) + 1; S.ent('pump').s.p = f.pu / 3; S.sfx('switch');
      S.tone('sine', 180 + f.pu * 60, 260 + f.pu * 60, .25, .04, 0, 1200);
      S.toast(f.pu >= 3 ? '指针到了红线' : `压力表的指针往上跳了一格（${f.pu}/3）`);
      return lampGoal(S);
    }
    await S.narr('油箱的打气筒，上面一只圆圆的压力表，红线画在三分之二的地方。');
  }
  async function useLens(S) {
    const f = S.f;
    if (f.ph === 'lamp' && !f.lit) {
      if (f.mantle) return S.narr('纱罩被火燎了个窟窿，软塌塌地挂在燃烧器上。\n得先换一只新的——备件柜里有。');
      if (!f.pre) {
        S.fx('flash'); S.sfx('scare'); S.shake(400, 2);
        S.tone('sawtooth', 120, 60, .5, .06, 0, 600);
        f.mantle = 1; f.pu = 0; S.ent('pump').s.p = 0;
        await lampFail(S, '你拧开油阀，凑上火柴——\n生油直接喷了出来，「轰」地窜起一团黄火！', '（他一把拍上阀门）没预热！铜管是凉的，煤油变不成汽，喷出来的就是一壶生油！');
        await S.narr('火灭了。纱罩被燎出一个窟窿，油箱里的气也放光了。');
        return lampGoal(S);
      }
      if (f.preL > 0) return lampFail(S, '火苗是黄的，冒着黑烟，噗噗地跳，把纱罩熏黑了一块。', '（他拧上阀门）急什么。沙漏还没漏完。');
      if ((f.pu || 0) < 3) return lampFail(S, '火苗「嘶」地窜了一下，又缩了回去。', '压力不够。打气。');
      f.lit = 1; S.sfx('match'); S.sfx('chime');
      S.tone('sine', 523, 523, 1.2, .03, 0, 3000);
      lensLight(S); mood(S); S.ent('lens').s.lit = 1;
      await S.narr('纱罩「噗」地亮了。\n白光一下子灌满了透镜，每一圈玻璃棱都亮了起来，亮得你睁不开眼。');
      S.goal('上发条，按灯质设定透镜的转速（钟表机构）');
      return;
    }
    if (f.ph === 'storm') return S.narr(f.P < .35 ? '火苗缩得发红，透镜暗了一大半——快打气！' : '透镜在转。火苗被风声压着，一下一下地抖。');
    if (f.lit && !f.rot) { f.plate = true; return S.narr('透镜亮着，还没转。\n底座上钉着一块铜铭牌：「四块牛眼透镜，两两成组，两组背对背。」'); }
    if (f.lit) return S.narr('透镜在转。每转半圈，两道白光就从玻璃棱里扫出去，扫过整片海。');
    await S.narr('透镜底座上钉着一块铜铭牌：\n「四块牛眼透镜，两两成组，两组背对背。」');
    S.f.plate = true;
  }
  async function useClock(S) {
    const f = S.f;
    if (f.ph === 'storm') {
      f.C = 1; S.ent('clock').s.c = 1; S.sfx('switch'); tick2(S);
      return S.toast('重锤摇回了顶上');
    }
    if (f.ph === 'lamp' && !f.rot) {
      if (!f.lit) return S.narr('灯还没点着，先别放制动。');
      if (!f.wound) { f.wound = 1; S.ent('clock').s.c = 1; S.sfx('switch'); tick2(S); await S.narr('你摇着曲柄，把重锤一点一点摇到了顶上。'); }
      const v = await S.keypad('调速器：透镜转一圈，要多少秒？\n（本站灯质：白光两闪，每 30 秒一组）' + (f.plate ? '\n（铭牌：四块牛眼，两两成组，两组背对背）' : ''), ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'], 2);
      if (v == null) return;
      if (v === '60') {
        f.rot = 1; S.ent('lens').s.rot = 1; S.sfx('chime'); tick2(S);
        await S.narr('你松开制动。\n钟表机构「咔嗒」一声，透镜慢慢地转了起来。');
        await S.narr('两道白光从玻璃棱里扫了出去。\n三十秒以后，又是两道。');
        if (!f.bl) {
          S.face('angus_t', 'pl');
          await S.say('安格斯', '帘子！帘子还没拉起来——灯是亮了，可外头一点也看不见！');
          S.goal('拉起遮光帘');
          return;
        }
        return lampDone(S);
      }
      f.gErr = (f.gErr || 0) + 1;
      S.sfx('bad');
      const n = +v;
      let say;
      if (n === 30) say = '停。两闪……十五秒，又是两闪。那是十五秒一组——别的灯塔才这么闪。你忘了，透镜上有两组牛眼。';
      else if (n === 15) say = '太快了，七秒多就是一组，像个发了疯的灯。';
      else if (n === 120 || n > 60) say = '慢了。那样海上的人要等一分钟才看见一组。';
      else say = '闪法不对。船会认错的。';
      await S.narr('透镜转了起来……你数着闪光，和规程上写的对不上。');
      S.face('angus_t', 'pl');
      await S.say('安格斯', say);
      if (f.gErr >= 2) await S.say('安格斯', lampHint(S));
      return lampGoal(S);
    }
    if (f.rot) return S.narr('钟表机构滴答滴答地走着。重锤顺着塔心的管子，一寸一寸往下沉。');
    await S.narr('钟表机构：一排铜齿轮，一只调速器，一根垂进塔心的铁链，吊着重锤。');
  }
  async function lampDone(S) {
    const f = S.f;
    f.ph = 'night1';
    S.face('angus_t', 'pl');
    await S.say('安格斯', ['三点三十五分。灯亮了。', '（他看着透镜转了一圈，点了点头）记下来：日落，点灯。']);
    await S.fade(1, 800);
    hideAll(S, 'angus_t', 'angus_h', 'rory_h'); bunks(S, 1, 1);
    await S.card('夜里十点', '第一班', '安格斯和罗里睡下了。\n整座灯塔只剩下钟表机构的滴答声，和透镜转动时很轻很轻的嗡嗡声。');
    await S.go('house', 11, 3, 3, { ms: 600 });
    S.goal('把今天的日志写上（办公室的写字台）');
    handoff(S);
    S.cp();
  }

  /* ================= 第一夜：日志 ================= */
  async function writeLog1(S) {
    const f = S.f;
    await S.narr('你翻开日志本，蘸了蘸墨水。');
    const a = await S.ask('12 月 13 日。风向、风力——', ['西南风，微风', '西北偏北，大风', '东风，无风']);
    const b = await S.ask('海况——', ['平静', '浪很高']);
    await S.ask('点灯——', ['日落 15:35 点灯。一切正常。']);
    f.log1ok = a === 0 && b === 0;
    if (!f.log1ok && f.wind1) await S.think('……不对。下午在灯廊上，风是从西南来的，很轻，海也是平的。\n你把那一行划掉，重写了一遍。');
    f.log1 = true;
    S.sfx('paper');
    await S.narr('你合上日志本。\n本子底下，压着一张纸。');
    await S.narr('你刚才坐下的时候，它还不在这儿。');
    f.f1 = true;
    await S.note('flog1');
    await S.think('西北偏北，大风？……今晚连一丝风都没有。');
    await S.think('「首席看守脾气很坏。」「临时看守在哭。」\n临时看守——替班的。说的是我？');
    S.ent('hooks').s.wet = 1; S.sfx('drip');
    await S.narr('厨房那边传来「嗒」的一声。\n又一声。像是水，一滴一滴落在石板地上。');
    S.goal('去厨房看看那滴水声；然后去睡觉（你的铺位在卧室最左边）');
  }

  /* ================= 第二天 ================= */
  async function day2(S) {
    await S.fade(1, 700);
    S.f.ph = 'day2'; bunks(S, 0, 0); S.ent('hooks').s.wet = 0;
    put(S, 'angus_h', 4, 3, 0, '@angus'); put(S, 'rory_h', 6, 3, 1, '@rory');
    S.ent('baro').s.lo = 1;
    await S.card('12 月 14 日', '', '早上起来，天是铅灰色的。\n办公室里的气压计，一夜之间掉下去一大截。');
    await S.go('house', 4, 5, 3, { ms: 600 });
    S.sfx('thud');
    await S.say('安格斯', '（他把一张纸拍在桌上）这是谁写的？');
    const r = await S.ask('', ['「不是我。昨晚在日志底下看见的。」', '「……你先看看上面写的什么。」']);
    if (r === 1) await S.say('安格斯', '我看了。「首席看守脾气很坏。」——你倒是挺会挑字眼。');
    await S.narr('罗里凑过来看了一眼，脸色一下子变了。\n纸的背面，昨晚还空着的地方，多了几行字。墨水还没干透。');
    S.f.f2 = true;
    await S.note('flog2');
    await S.say('罗里', ['「12 月 12 日」「12 月 13 日」……写的是 1900 年那三个人。', '可那年的日志只记到 13 号，档案就在柜子里，我看过——里头没有这些话。']);
    await S.say('罗里', '谁编的？编了还不够，还要替他们写哭、写祈祷。人都不在了，还要被人替他们说话。');
    await S.say('安格斯', ['够了。（他把纸折起来）我收进柜子里，这件事到此为止。', '气压掉得厉害，今晚有大风。我守上半夜，两点叫你。']);
    await S.fade(1, 800);
    for (const id of ['kwin', 'owin']) S.ent(id).s.storm = 1;
    S.ent('blinds').s.storm = 1; S.ent('fdoor').s.storm = 1;
    S.sfx('thud'); S.shake(500, 2);
    await S.card('下午', '风暴', '天黑得比昨天还早。\n风是从西北压过来的。雨点横着打在窗户上，像有人在外面一把一把地撒石子。\n灯塔在风里嗡嗡地响，像一口被人敲着的钟。');
    return stormNight(S);
  }

  /* ================= 风暴夜（危险段） ================= */
  async function stormNight(S) {
    S.f.ph = 'storm';
    hideAll(S, 'angus_h', 'rory_h'); bunks(S, 1, 0);
    S.f.lit = 1; S.f.rot = 1; S.f.bl = 1; S.ent('blinds').open = true;
    S.ent('lens').s.lit = 1; S.ent('lens').s.rot = 1;
    put(S, 'angus_t', 4, 6, 2, '@angus');
    await S.card('凌晨两点', '', '安格斯守完上半夜，把你摇醒了。\n你摸黑爬上灯室的时候，整座塔都在风里发抖。');
    await S.go('tower', 5, 6, 3, { ms: 600 });
    lensLight(S);
    await S.say('安格斯', ['压力表、发条，两样都别让它掉到底。', '压力掉得快，十几秒就得打一回气；发条慢一点，可也别忘了摇。', '灯廊的门插好了，别去碰它。']);
    await S.say('安格斯', '还有——罗里睡觉不老实。他要是起来乱走，把他弄回床上去。');
    await S.walk('angus_t', [2, 7], 4); S.hide('angus_t');
    bunks(S, 1, 1);
    await S.narr('他下楼去了。\n灯室里只剩下你、透镜，和外面没完没了的风。');
    S.goal('守住灯，熬到天亮：打气（压力表）、摇发条（钟表机构），罗里起来就下楼拦住他');
    if (S.coop) S.toast('两人时：一人盯着压力表和发条、听楼下的动静报信，一人操作');
    S.cp('storm');
    startStorm(S, DAWN);
  }
  function startStorm(S, D) {
    const f = S.f;
    Object.assign(f, { P: 1, C: 1, sE: 0, ev: 0, rory: 0, rw: 0, lw: 0, gd: 0, gw: 0, rCoat: 0, sD: D, sDead: 0, lowP: 0, lowC: 0 });
    FL.horn = false;
    S.ent('pump').s.p = 1; S.ent('clock').s.c = 1; S.ent('gdoor').open = false;
    lensLight(S);
    S.timer(D, '天亮', stormDawn);
  }
  /* 每帧推进风暴夜（主机，非剧本时） */
  function stormTick(S, dt) {
    const f = S.f;
    f.sE += dt; f.P -= dt / PD; f.C -= dt / CD;
    if (f.gd > 0) { f.gd -= dt; f.P -= dt / 8; }
    const pe = S.ent('pump'), ce = S.ent('clock');
    if (Math.abs((pe.s.p || 0) - f.P) > .04) { pe.s.p = Math.max(0, f.P); lensLight(S); }
    if (Math.abs((ce.s.c || 0) - f.C) > .04) ce.s.c = Math.max(0, f.C);
    /* 低了给一句提示（每次掉下去提醒一回） */
    if (f.P < .3 && !f.lowP) { f.lowP = 1; S.toast(S.map === 'tower' ? '火苗发红了——压力不够了！' : '楼上的光暗下去了——压力不够了！'); }
    if (f.P > .5) f.lowP = 0;
    if (f.C < .25 && !f.lowC) { f.lowC = 1; S.toast(S.map === 'tower' ? '重锤快沉到底了——摇发条！' : '楼上的滴答声慢下来了——发条快走完了！'); }
    if (f.C > .5) f.lowC = 0;
    /* 阵风 */
    FL.gust -= dt;
    if (FL.gust <= 0) { FL.gust = 4 + Math.random() * 4; S.shake(300, 1); S.sfx('thud'); }
    /* 有船经过，拉了雾笛（那页纸上写过） */
    if (!FL.horn && f.sE > 42) { FL.horn = true; horn(S); S.toast('远处……雾笛。有船经过。'); }
    /* 灯廊的门被撞开以前，先哐哐地响一阵（预警） */
    if (f.ev === 1 && !f.gw && S.map === 'tower' && f.sE >= EVT[1] - 1.5 && EVT[1] <= f.sD - 8) { f.gw = 1; S.sfx('knock'); S.tone('square', 90, 70, .15, .05, .35, 500); S.toast('灯廊的门在门框里哐哐地响……'); }
    /* 事件 */
    if (f.ev < EVT.length && f.sE >= EVT[f.ev]) {
      const k = f.ev;
      if (EVT[k] > f.sD - 8) f.ev++;                          // 重来时剩下的时间不够，就跳过
      else if (k === 1) { if (S.map === 'tower' && f.gw) { f.ev++; S.run(galleryBurst); } else if (S.map === 'tower') { f.gw = 1; S.sfx('knock'); S.toast('灯廊的门在门框里哐哐地响……'); f.sE = EVT[1] - 1.2; } }   // 灯廊的门只在灯室里发生
      else { f.ev++; roryUp(S, k === 0 ? 0 : 1); }
    }
    if (f.rory === 1) roryTick(S, dt);
    if (f.sDead) return;
    if (f.P <= 0 || f.C <= 0) {
      if (!f.lw) { f.lw = 1; f.P = Math.max(f.P, .4); f.C = Math.max(f.C, .4); S.run(nearOut); }
      else { f.sDead = 1; S.run(lampOut); }
    }
  }
  /* 罗里梦游 */
  function bfsPath(m, sx, sy, tx, ty, who) {
    const key = (x, y) => x + ',' + y, prev = { [key(sx, sy)]: null }, q = [[sx, sy]];
    while (q.length) {
      const [x, y] = q.shift(); if (x === tx && y === ty) break;
      for (const [dx, dy] of [[0, -1], [-1, 0], [1, 0], [0, 1]]) {
        const nx = x + dx, ny = y + dy, k = key(nx, ny);
        if (k in prev) continue;
        if (!(nx === tx && ny === ty) && (tileSolid(m, nx, ny) || m.ents.some(e => e !== who && !e.hidden && e.solid && nx >= Math.round(e.px / TS) && nx < Math.round(e.px / TS) + e.w && ny >= Math.round(e.py / TS) && ny < Math.round(e.py / TS) + e.h))) continue;
        prev[k] = [x, y]; q.push([nx, ny]);
      }
    }
    const out = []; let c = [tx, ty]; if (!(key(tx, ty) in prev)) return [[sx, sy]];
    while (c) { out.unshift(c); c = prev[key(c[0], c[1])]; }
    return out;
  }
  function roryUp(S, k) {
    const f = S.f, m = W.maps.house, e = getEnt('rory_h', 'house');
    S.ent('bunk_r').s.occ = 0;
    e.spr = '@rory'; S.place('rory_h', 12, 7, 1);
    RP = bfsPath(m, 12, 7, 2, 2, e);
    Object.assign(f, { rory: 1, rp: 0, rs: RSPD[k], rCoat: 0 });
    S.sfx('step');
    S.toast(S.map === 'house' ? '罗里从铺位上坐起来了。他光着脚，往外走——' : '楼下……有脚步声。是卧室那边。');
    S.tone('sine', 300, 280, .6, .02, 0, 900);
  }
  function roryTick(S, dt) {
    const f = S.f, e = getEnt('rory_h', 'house'), N = RP.length;
    const inH = S.map === 'house';
    const cx = Math.round(e.px / TS), cy = Math.round(e.py / TS);
    let ci = RP.findIndex(p => p[0] === cx && p[1] === cy); if (ci < 0) ci = 0;
    const nxt = RP[Math.min(N - 1, ci + 1)];
    const blocked = inH && W.pl.x === nxt[0] && W.pl.y === nxt[1];
    if (!blocked) f.rp += dt * f.rs; else f.rp = Math.min(f.rp, ci + .95);
    const idx = Math.min(N - 1, Math.floor(f.rp));
    if (inH) {
      if (!e.mv && ci < idx && !blocked) { const d = DIRS.findIndex(q => q[0] === nxt[0] - cx && q[1] === nxt[1] - cy); if (d >= 0) startMove(e, d, f.rs * 1.8); }
    } else if (ci !== idx) { S.place('rory_h', RP[idx][0], RP[idx][1], 1); }
    if (!f.rCoat && idx >= N - 2) { f.rCoat = 1; e.spr = '@roryO'; coats(S, 2); }
    if (idx === N - 1 && !e.mv && ci === N - 1) {
      f.rory = 2;
      if (!f.rw) { f.rw = 1; S.run(roryWarn); }
      else { f.sDead = 1; S.run(roryOut); }
    }
  }
  function roryBack(S) {
    const e = S.ent('rory_h'); e.mv = null; S.hide('rory_h'); e.spr = '@rory';
    S.ent('bunk_r').s.occ = 1; coats(S, 3); S.f.rory = 0;
  }
  async function stopRory(S) {
    const f = S.f;
    if (f.rory !== 1) return;
    f.rory = 0;
    S.face('rory_h', 'pl');
    if (S.once('roryStop')) {
      await S.narr('罗里光着脚站在那儿，眼睛半睁着，像在听什么。');
      await S.say('罗里', '……有人在码头上喊我。喊我下去帮把手。', { style: 'whisper' });
      await S.say('你', '罗里。没有人。回去睡觉。');
      await S.narr('你把他领回铺位。他一沾枕头，就又睡着了。');
    } else {
      await S.say('罗里', '……他们在下面等着。三个人……少一个。', { style: 'whisper' });
      await S.narr('你攥着他的胳膊，把他拖回了铺位。');
    }
    roryBack(S);
    S.toast('快回灯室！');
  }
  async function roryWarn(S) {
    const down = S.map === 'house';
    S.sfx('switch'); S.sfx('open'); S.shake(400, 2);
    if (down) {
      S.ent('fdoor').open = true;
      await S.narr('罗里拔开了门闩。前门「哐」地被风撞开，雨横着扫了进来——');
      await S.say('安格斯', '罗里！你给我回来！', { style: 'big' });
      await S.narr('安格斯光着脚从卧室冲出来，一把拽住了他的后领。');
      S.ent('fdoor').open = false;
    } else {
      await S.narr('楼下「哐」的一声——是前门！风一下子灌进了屋子。');
      await S.say('安格斯（楼下）', '罗里！你给我回来！', { style: 'big' });
      await S.narr('一阵拉扯声。门又「砰」地关上了。');
    }
    S.sfx('close');
    await S.say(down ? '安格斯' : '安格斯（楼梯口）', ['他都走到门口了，雨衣都穿上了！', '你守你的灯——可也给我长着耳朵！楼下一有脚步声，就下来！']);
    roryBack(S);
    S.f.P = Math.max(.1, S.f.P - .2);
    S.toast('罗里起来的时候，楼下会有脚步声——赶在他走到前门之前下去拦住他');
  }
  async function roryOut(S) {
    RS.storm = S.timerLeft;
    S.sfx('switch'); S.sfx('open'); S.amb('wind'); S.shake(600, 3);
    await S.narr('楼下传来门闩拔开的声音。\n风「呼」地灌进了屋子，一直灌上楼梯。');
    await S.die('罗里穿着雨衣，推开门，走进了风里。\n第二天早上，你们只在院门口找到了他的一只水靴。\n\n（罗里起床时楼下会有脚步声。先把压力和发条补满，再下楼，赶在他走到前门之前拦住他。）', '你没能拦住他');
  }
  async function nearOut(S) {
    S.fx('red'); S.sfx('heart'); S.shake(300, 2);
    await S.narr(S.map === 'tower' ? '火苗缩成了一点蓝——你扑过去，拼命打气、摇曲柄……' : '楼上的光一下子暗了——你三步并作两步冲上去，拼命打气、摇曲柄……');
    await S.narr('火苗抖了两下，又亮了起来。');
    S.toast('差一点就灭了！下次不会这么走运');
    lensLight(S);
  }
  async function lampOut(S) {
    RS.storm = S.timerLeft;
    S.f.lit = 0; lensLight(S); S.ent('lens').s.lit = 0; S.sfx('whisper');
    await S.narr('火苗缩成一点蓝，抖了两下，灭了。');
    await S.die('灯灭了。\n那一夜，一艘路过的汽船在航海日志上记了一笔：弗兰南的灯没有亮。\n\n（压力十几秒就会掉到底，发条慢一些。守在灯边，轮着补；下楼之前先补满。）', '灯灭了');
  }
  /* 灯廊的门被风撞开（大头像惊吓） */
  async function galleryBurst(S) {
    const b = S.ent('blinds');
    S.fx('flash'); S.sfx('thud');
    b.s.ghost = 1;
    await S.narr('一道闪电。\n灯笼窗外的灯廊上，贴着玻璃，站着一个人。');
    await S.scare('face', { spr: '@oil', face: 'oil', dur: 1.1, sfx: 'sting' });
    b.s.ghost = 0;
    S.ent('gdoor').open = true; S.sfx('open'); S.shake(600, 3);
    S.f.gd = 7;
    await S.narr('灯廊的门「哐」地被撞开了！\n风卷着雨灌进灯室，火苗被吹得往一边倒——');
    S.toast('关上灯廊的门！');
  }
  async function useGdoor(S) {
    const f = S.f;
    if (f.ph === 'storm') {
      if (f.gd > 0) { f.gd = 0; S.ent('gdoor').open = false; S.sfx('close'); return S.narr('你顶着风，把门推了回去，插上了插销。\n门外什么也没有。只有雨。'); }
      return S.narr('插销插得死死的。门板在风里一下一下地顶着你的手心。');
    }
    if (f.ph === 'calm') {
      if (f.saw) return S.narr('西边那道白线，又近了。');
      return calmView(S);
    }
    if (f.ph === 'dusk') return S.narr('谁也别出去。');
    if (f.ph === 'tour') return S.narr('安格斯在等你。');
    await S.narr('通往灯廊的铁门。外面一圈窄窄的铁栏杆，风大的时候，人站在上面得抓牢。');
  }
  async function stormDawn(S) {
    const f = S.f;
    f.ph = 'dawn'; f.gd = 0; RS.storm = null;
    if (f.rory) roryBack(S);
    S.ent('gdoor').open = false; S.f.P = 1; S.f.C = 1; lensLight(S);
    if (S.map !== 'tower') await S.go('tower', 5, 6, 3);
    await S.narr('不知什么时候，窗外的黑，变成了灰。\n风还在刮，可已经刮不动什么了。');
    put(S, 'angus_t', 2, 7, 3, '@angus');
    await S.walk('angus_t', [4, 6], 3); S.face('angus_t', 'pl');
    await S.say('安格斯', '（他看了看压力表，又看了看你）……一夜没灭。');
    await S.say('安格斯', '睡去吧。');
    S.hide('angus_t');
    await S.fade(1, 900);
    for (const id of ['kwin', 'owin']) S.ent(id).s.storm = 0;
    S.ent('blinds').s.storm = 0; S.ent('fdoor').s.storm = 0;
    f.lit = 0; f.rot = 0; S.ent('lens').s.lit = 0; S.ent('lens').s.rot = 0; lensLight(S);
    f.ph = 'day3'; bunks(S, 0, 0);
    put(S, 'angus_h', 2, 4, 2, '@angus'); put(S, 'rory_h', 5, 4, 1, '@rory'); S.show('meal');
    await S.card('12 月 15 日', '', '你睡了不到三个钟头。\n醒来的时候，风已经小了，只剩下灰蒙蒙的雨。\n厨房里飘来煎土豆的味道。');
    await S.go('house', 11, 7, 3, { ms: 600 });
    await S.think('……那张纸。安格斯说收进了柜子里。');
    S.goal('中午：去厨房吃饭（办公室的柜子里，收着那张纸）');
    handoff(S);
    S.cp();
  }

  /* ================= 第三天：风停了 ================= */
  async function dinner(S) {
    const f = S.f;
    if (!f.f3) {
      await S.say('罗里', '（他从柜子里把那张纸拿了过来，摊在桌上）你们看最后一行。');
      f.f3 = true; await S.note('flog3');
    }
    await S.narr('三个人围着桌子吃饭。谁也没提那张纸。');
    await S.say('罗里', '西码头的绳箱，盖子让风掀了。我早上从窗户看见的，绳子拖在外头。');
    await S.say('安格斯', '吃完饭去捆上。绳子要是让海卷走了，补给船来了也没法吊货。');
    await S.wait(600);
    S.amb('none');
    await S.narr('就在这时候，风停了。');
    await S.narr('不是小下去——是一下子停了。\n雨也停了。屋里静得能听见炉子里的煤块「噼」地裂开。');
    S.ent('wclock').s.stop = 1;
    await S.narr('墙上的钟「嗒」地响了一声。\n就不走了。');
    await S.say('罗里', '……一点。下午一点。', { style: 'whisper' });
    await S.narr('安格斯看了看那张纸，又看了看窗外。\n他站起来的时候，椅子在石板地上刮出很长的一声。');
    await S.say('安格斯', ['正好。趁风停了。', '罗里，穿上雨衣，跟我走。卡勒姆，你守灯。', '两个人去，一个人留下——规矩上说得过去。']);
    put(S, 'angus_h', 2, 2, 0, '@angusO'); put(S, 'rory_h', 4, 2, 1, '@roryO'); coats(S, 1);
    for (const id of ['kwin', 'owin']) S.ent(id).s.calm = 1;
    S.ent('blinds').s.calm = 1;
    await S.say('安格斯', '给我一分钟，系个鞋带。');
    await S.think('不能让他们去。\n可安格斯不会因为一句「我害怕」就不去。我得拿出能说服他的东西。');
    f.ph = 'calm';
    S.goal('拦住他们：找出能说服安格斯的证据，再去跟他说（两人时：一人去找，一人对着「笺」念档案）');
    S.cp('calm');
    startCalm(S, CALM);
  }
  function startCalm(S, T) { S.timer(T, '出门', leaveOut); }
  /* 从灯廊上看西边的海 */
  async function calmView(S) {
    S.f.look = 2;
    await towerView(S, async () => {
      S.focus(3, 16);
      S.show('swell');
      rumble(S, .05);
      await S.narr('你推开灯廊的门。\n没有风。一丝也没有。海面平得发亮，像一块灰色的铁板。');
      await S.narr('西码头底下，海水在往后退。\n礁石一块一块露了出来，湿淋淋的，挂着海草。');
      await S.narr('再往西，天和海接在一起的地方，有一道白线。\n很长，很直，从北边一直拉到南边。');
      await S.narr('它在动。\n它比西码头的平台还高。');
      S.hide('swell');
    });
    S.f.saw = true;
    await S.think('风停了，涌没停。\n那不是平静——是海在往回吸气。');
  }
  /* 和安格斯理论：三个回合 */
  const EVI = [
    ['flog', '那页日志'],
    ['duty', '值班规程'],
    ['rep', '1900 年的调查报告'],
    ['saw', '灯廊上看见的西边的海'],
    ['coat', '钩子上剩下的那件雨衣']
  ];
  const DQ = [
    { ask: '（安格斯举起那张纸）「下午一点，风暴停了，海面平静。」——你自己看外头，跟它写的一模一样。它说没事了。', ok: 'rep',
      win: async S => {
        await S.say('你', ['三十二年前的日志，只记到 13 号。', '14、15 号只在石板上记了几笔。最后一条是 15 号早上九点：灯擦净了，油加满了，帘子拉上了。', '这张纸上 12 号、13 号、15 号的话，档案里一个字都没有。']);
        await S.say('罗里', '是后来的人编的。连没有 14 号这一点，都编得跟那个传说一模一样。');
        await S.say('安格斯', '……那它为什么跟今天对得上？');
        await S.say('你', '所以它才不能信。它想让你今天下午一点出门。');
      },
      miss: { flog: '我说的就是它。', duty: '规程上可没写不许下码头。', saw: '先别扯海。说这张纸。', coat: '雨衣？先说这张纸。' },
      hint: ['这张纸说它是 1900 年的日志。那年真正的日志记到哪天？', '办公室柜子里有那年的调查报告——日志记到 13 号。拿报告跟他说。', '拿那份 1900 年的调查报告！'] },
    { ask: '（他把纸扔在桌上）好，纸是假的。可绳箱在一百一十英尺高的平台上，风都停了，浪还能打上去不成？', ok: 'saw',
      win: async S => {
        await S.say('你', ['风停了，涌没停。', '我刚在灯廊上看见了：西码头底下的海在往后退，礁石都露出来了。西边一整道白线，比码头的平台还高。']);
        await S.say('罗里', '（他的脸白了）……我爹那辈人讲过。大浪来以前，海先往回退。');
        await S.narr('安格斯走到窗前，往西看了很久。');
      },
      miss: { flog: '那张纸已经说清楚了，是假的。', duty: '规程管不了浪。', rep: '那是三十二年前的浪。今天呢？', coat: '雨衣跟浪有什么关系？' },
      hint: ['他问的是今天的海。你看过今天的海吗？', '上灯室，推开灯廊的门，往西码头那边看一眼。', '说你在灯廊上看见的——西边那道白线！'] },
    { ask: '（他回过身，声音低下来）那我更得去。绳箱要紧。罗里跟我，你守灯。两个人去，一个人留下——规程上写的是「不许三个人同时出门」。', ok: 'coat',
      win: async S => {
        await S.say('你', ['三十二年前，也是两套雨衣不见了。第三套还挂在钩子上。', '查案的人说，第三个人是只穿着衬衫出的门。']);
        await S.say('你', '你们在码头上喊一声「下来帮把手」——我会不去吗？');
        await S.narr('屋里静了很久。\n钩子上，只挂着你那一件雨衣。');
      },
      miss: { flog: '……别再提那张纸。', duty: '规程我比你熟。两个人去，一个人守，合规矩。', rep: '报告是报告。今天是今天。', saw: '我知道海不对劲。所以要快。' },
      hint: ['他说两个人去、一个人留下。三十二年前，留下的那一个呢？', '看看前门边上的挂钩——钩子上还剩几件雨衣。', '钩子上那件雨衣！跟他说三十二年前的第三件雨衣！'] }
  ];
  const evHave = (S, k) => k === 'flog' ? !!(S.f.f1 || S.f.f2 || S.f.f3) : k === 'duty' ? true : k === 'rep' ? !!S.f.rep : k === 'saw' ? !!S.f.saw : !!S.f.coats;
  async function debate(S) {
    const f = S.f;
    S.face('angus_h', 'pl');
    if (!f.dq && S.once('debIn')) await S.say('安格斯', '（他蹲在门口系鞋带，头也不抬）有话快说。');
    f.dq = f.dq || 0;
    while (f.dq < DQ.length) {
      const q = DQ[f.dq], have = EVI.filter(([k]) => evHave(S, k));
      const opts = have.map(v => '（拿出：' + v[1] + '）').concat(['（……我再去找找）']);
      const r = await S.ask(q.ask, opts, '安格斯');
      if (r === opts.length - 1) {
        const n = f['dh' + f.dq] || 0;
        await S.say('罗里', '（小声）' + q.hint[Math.min(1, n)]);
        return;
      }
      const k = have[r][0];
      if (k === q.ok) { await q.win(S); f.dq = (f.dq || 0) + 1; continue; }
      f.dw = (f.dw || 0) + 1; f['dh' + f.dq] = (f['dh' + f.dq] || 0) + 1;
      S.sfx('bad');
      await S.say('安格斯', q.miss[k] || '这算什么。');
      if (f.dw >= 4) return leaveOut(S);
      S.timerAdd(-8);
      await S.narr('他系好了一只鞋，又去系另一只。');
      const hk = Math.min(2, f['dh' + f.dq] - 1);
      if (hk < 2 || evHave(S, q.ok)) await S.say('罗里', '（小声）' + q.hint[hk]);
      else await S.say('罗里', '（小声）' + q.hint[1]);
    }
    return stayIn(S);
  }

  /* ---------- 坏结局：他们出门了 ---------- */
  async function leaveOut(S) {
    RS.calm = S.timerLeft ?? 0; S.clearTimer();
    S.f.ph = 'out';
    S.face('angus_h', 3);
    await S.say('安格斯', '好了。（他拉开门）守好灯。我们一会儿就回来。');
    S.ent('fdoor').open = true; S.sfx('open');
    await S.wait(500);
    hideAll(S, 'angus_h', 'rory_h');
    S.ent('fdoor').open = false; S.sfx('close');
    await S.narr('门在他们身后关上了。\n屋里一下子安静得吓人。');
    const r = await S.ask('钩子上，只剩你那一件雨衣。', ['（追出去——来不及穿雨衣了）', '（守在灯塔里）']);
    return r === 0 ? jettyEnd(S) : coatEnd(S);
  }
  async function jettyEnd(S) {
    await S.narr('你连雨衣都没顾上穿，拉开门就冲了出去。');
    put(S, 'angus_i', 4, 14, 3, '@angusO'); put(S, 'rory_i', 5, 13, 3, '@roryO');
    await S.go('isle', 13, 8, 0);
    await S.walk('pl', [7, 12], 6.2);
    await S.say('你', '安格斯！罗里！回来！', { style: 'big' });
    S.face('rory_i', 'pl');
    await S.narr('他们在西码头上回过头。\n罗里冲你挥了挥手，像是在说：快来帮把手。');
    await S.walk('pl', [5, 14], 5);
    await S.narr('你跑下最后几级台阶。\n三个人，站在了西码头上。');
    await S.narr('身后的山顶上，灯塔里一个人也没有了。');
    S.amb('none'); rumble(S, .12);
    await S.wait(900);
    await S.narr('海，往后退了。\n码头底下的礁石一块一块露出来，冒着白沫。退得那么远，那么快——');
    put(S, 'ghost_i', 2, 15, 0, '@oil'); S.ent('ghost_i').alpha = .9;
    await S.narr('码头的栏杆边上，站着第四个人。\n一件油布雨衣，背对着你们，面朝大海。');
    await S.narr('它慢慢地转过身来。');
    await S.scare('face', { spr: '@oil', face: 'oil', dur: 1.2, sfx: 'scream' });
    S.fx('flash'); S.shake(1600, 4); S.sfx('splash'); S.sfx('water');
    await S.fade(1, 300);
    await S.wait(1200);
    await S.card('十一天后', '', '补给船靠上东码头的时候，旗杆上没有旗。\n码头上没有摆出空箱子，也没有人下来接船。\n\n院门和屋门都关着。厨房的钟停在一点。\n这一回，桌上的饭真的一口也没动，一把椅子翻在地上。\n\n钩子上挂着一件雨衣。\n日志摊在桌上，最后一行写着：\n「下午一点。风暴停了，海面平静。神在一切之上。」\n那不是你们三个人里任何一个人的字。');
    await S.end({ id: 'jetty', bad: true, title: '码头', text: '三个人，一起出了门。\n\n很多年以后，又有人在书上读到一页「日志」。\n这一回，上面多了三个看守。\n\n没有人知道是谁写的。\n就像没有人知道，是谁替三十二年前的那三个人写的。' });
  }
  async function coatEnd(S) {
    await S.narr('你没有动。\n规矩是：灯塔任何时候不许没人。');
    await S.wait(1500);
    S.sfx('whisper');
    await S.say('（远处，西码头那边）', '卡勒姆——！下来帮把手！', { style: 'whisper' });
    await S.ask('是罗里的声音。……是罗里的声音吗？', ['（攥着门把手，不去）']);
    S.amb('none'); rumble(S, .12);
    await S.wait(1200);
    S.shake(1400, 3); S.sfx('splash');
    await S.narr('西边远远地传来一声闷响。\n整座岛都抖了一下。');
    await S.narr('然后，什么声音也没有了。');
    await S.fade(1, 900);
    await S.card('三点三十五分', '', '日落的时候，你一个人上了灯室。\n拉帘，预热，打气，开阀，放制动。\n灯亮了。两闪，三十秒，再两闪。\n\n他们没有回来。');
    await S.end({ id: 'coat', bad: true, title: '第三件雨衣', text: '你照规矩守住了灯。\n第二天、第三天、第十一天，你都把它点亮了。\n\n补给船来的时候，你一个人站在码头上等船。\n钩子上挂着一件雨衣。\n\n规矩上说，灯塔任何时候不许没人。\n规矩上没说，留下来的那个人，往后的夜里要怎么熬。' });
  }

  /* ---------- 好结局：三个人都留下 ---------- */
  async function stayIn(S) {
    const f = S.f;
    S.clearTimer(); RS.calm = null;
    await S.narr('安格斯的手搭在门闩上，搭了很久。');
    await S.narr('然后他慢慢地把雨衣脱下来，挂回了钩子上。\n罗里也脱了。');
    put(S, 'angus_h', 4, 3, 0, '@angus'); put(S, 'rory_h', 6, 3, 1, '@rory'); coats(S, 3);
    await S.say('安格斯', '绳箱没了，就没了。补给船来了，大不了一桶一桶往上扛。');
    await S.say('罗里', '（他长长地出了一口气，冲你咧了咧嘴，手还在抖）');
    await S.fade(1, 900);
    f.ph = 'dusk';
    hideAll(S, 'angus_h', 'rory_h');
    put(S, 'angus_t', 3, 6, 2, '@angus'); put(S, 'rory_t', 9, 6, 1, '@rory');
    S.ent('blinds').open = false; S.ent('blinds').s.calm = 1;
    await S.card('下午三点三十五分', '日落', '三个人一起上了灯室。\n外面还是一丝风也没有。西边的白线，已经看不见了——天黑了。');
    await S.go('tower', 5, 6, 3, { ms: 600 });
    S.goal('点灯（三个人都在灯室里）');
    S.cp();
  }
  async function lightTogether(S) {
    const f = S.f;
    S.sfx('tear'); S.ent('blinds').open = true; await S.wait(300);
    S.sfx('match'); await S.wait(300); S.sfx('switch'); await S.wait(200); S.sfx('switch');
    f.lit = 1; f.rot = 1; f.bl = 1; S.ent('lens').s.lit = 1; S.ent('lens').s.rot = 1; lensLight(S); mood(S);
    S.sfx('chime'); tick2(S);
    await S.narr('拉帘，预热，打气，开阀，放制动。\n这一回，你的手一点也没抖。灯亮了。');
    await S.wait(900);
    S.face('rory_t', 1);
    await S.say('罗里', '……你们听。', { style: 'whisper' });
    rumble(S, .1); await S.wait(600); rumble(S, .12);
    await S.narr('西边，很远的地方，有一种声音。\n不像风，也不像雷。像整个大西洋在往回吸一口气。');
    const b = S.ent('blinds'); b.s.ghost = 2; S.sfx('knock');
    await S.narr('灯廊上，玻璃外面，站着一个穿雨衣的人。\n它抬起一只手，朝西码头的方向，招了招。');
    S.sfx('knock'); await S.wait(400); S.sfx('knock');
    await S.say('安格斯', '（它在敲玻璃）……谁也别动。', { style: 'whisper' });
    await S.wait(1200);
    S.fx('flash'); S.shake(2000, 4); S.sfx('splash'); S.sfx('thud'); rumble(S, .16);
    await S.narr('浪来了。');
    S.sfx('water');
    await S.narr('一堵白墙从西边的悬崖底下直立起来，比码头高，比崖顶还高。\n它「轰」地一声扑上崖顶，碎成漫天的白雾，像雨一样泼在灯室的玻璃上。');
    b.s.ghost = 0;
    await S.wait(900);
    await S.narr('等水雾散开，灯廊上什么也没有了。\n透镜还在转。两闪，三十秒，再两闪。');
    await S.say('罗里', '（他的声音在发抖）……要是我们在下面——');
    await S.say('安格斯', '我们不在下面。');
    await S.fade(1, 1000);
    f.ph = 'morning';
    hideAll(S, 'angus_t', 'rory_t');
    /* 第二天早上的西码头：和 1900 年调查报告里写的一样 */
    S.ent('rbox').s.broken = 1; S.place('bigstone', 2, 14); S.show('scar');
    for (const [x, y] of [[3, 16], [4, 16]]) S.tile(x, y, 'J', 'isle');
    for (const [x, y] of [[4, 10], [5, 10], [4, 11], [5, 11], [6, 11]]) S.tile(x, y, 'Y', 'isle');
    put(S, 'angus_i', 5, 15, 1, '@angus'); put(S, 'rory_i', 7, 11, 1, '@rory');
    S.ent('flag').s.flag = 1;
    await S.card('12 月 16 日', '', '风暴过去了。\n天亮的时候，海平得像一面镜子。\n安格斯把旗升了起来，三个人一起往西码头走。');
    await S.go('isle', 13, 8, 0, { ms: 700 });
    S.goal('去西码头看看（安格斯在那儿）');
    handoff(S);
    S.cp();
  }
  async function morningTalk(S) {
    const f = S.f, n = ['rbox', 'rails', 'bigstone', 'turf'].filter(k => f['m_' + k]).length;
    S.face('angus_i', 'pl');
    if (n < 2) return S.say('安格斯', '你自己看吧。看仔细了。');
    await S.say('安格斯', ['一百一十英尺高的箱子，砸成了劈柴。', '那块石头少说一吨重，挪了一个身子。', '崖顶两百英尺的草皮，让水掀掉了。']);
    await S.say('安格斯', '三十二年前，上岛查案的人，看见的就是这个。');
    await S.narr('罗里摘下帽子，朝着海站了一会儿。');
    if (f.custom) await S.narr('你也摘下了帽子。');
    await S.say('安格斯', '回去吧。昨天的日志还没写。');
    f.ph = 'log';
    S.hide('meal'); S.ent('wclock').s.stop = 0;
    put(S, 'angus_h', 4, 3, 0, '@angus'); put(S, 'rory_h', 6, 3, 1, '@rory');
    hideAll(S, 'angus_i', 'rory_i');
    S.goal('回办公室，把 12 月 15 日的日志写上');
  }
  async function writeTrue(S) {
    const f = S.f;
    await S.narr('厨房的挂钟又嘀嗒嘀嗒地走起来了——安格斯一早给它上了弦。\n你翻开日志本，蘸了蘸墨水。');
    if (f.log1ok) await S.narr('13 号那一页，你写的「西南风，微风」旁边，多了安格斯的一个签名。');
    await S.ask('12 月 15 日——', ['「中午风停。午后有大涌，自西来。」']);
    await S.ask('', ['「西码头绳箱被毁，栏杆扭曲，崖顶草皮被掀。」']);
    await S.ask('', ['「日落 15:35 点灯。三人均在站内。」']);
    S.sfx('paper');
    await S.narr('你又看了一眼那张来历不明的纸。');
    const r = await S.ask('那张纸——', ['（夹进档案，在背面写上：「来历不明，档案中无此记录」）', '（扔进厨房的炉子里）']);
    f.burn = r === 1;
    if (r === 1) { S.sfx('match'); await S.narr('纸在炉子里卷了一下，就没了。'); }
    else await S.narr('你把它和那份发黄的调查报告夹在了一起。');
    return finale(S);
  }
  async function finale(S) {
    const f = S.f;
    await S.fade(1, 1400);
    await S.card('卷三　终', '', VOL3);
    await S.card('百物语·叁　终', '', FIN);
    await S.end({ id: 'light', title: '第三十夜　完', text: '十一天后，补给船来了。\n旗杆上升着旗，码头上摆着空箱子，三个人站在台阶上等船。\n\n安格斯在交接本上写：西码头绳箱被毁，请补发吊绳。\n别的，他一个字也没多写。'
      + (f.log1ok ? '\n\n交接本底下压着这几天的日志。13 号那一页，是你第一晚写的：西南风，微风，海面平静。一个字也不用改。' : '')
      + (f.custom ? '\n\n罗里说，下回上岛，还得先摘帽子，顺着太阳转一圈。\n「这地方不是咱们的，」他说，「咱们只是来点灯的。」' : '')
      + (f.burn ? '\n\n那张纸烧掉了。可你记得最后一行写的是什么——也记得，那不是真的。' : '\n\n那张纸夹进了档案。后来翻到它的人，只会先看见背面你的那行字。') });
  }

  /* ================= 章节定义 ================= */
  defChapter({
    id: 'flannan', n: 30, title: '灯塔', sub: '大西洋上的孤岛灯塔。规矩说，三个看守永远不许同时出门。1900 年冬天，他们一起不见了。', origin: '苏格兰 · 1900 年真实事件', color: '#1c2c3c',
    amb: 'wind', floor: 'grass', wall: 'stone', dark: .3, plr: 3.2,
    thumb(g, w, h) {   // 夜海上的孤岛灯塔：两道光，礁石，浪
      const P = (x, y, ww, hh, c) => { g.fillStyle = c; g.fillRect(x, y, ww, hh); };
      g.fillStyle = 'rgba(255,240,190,.16)';
      g.beginPath(); g.moveTo(96, 20); g.lineTo(0, 4); g.lineTo(0, 30); g.fill();
      g.beginPath(); g.moveTo(96, 20); g.lineTo(160, 10); g.lineTo(160, 26); g.fill();
      P(0, 58, 160, 32, '#0c1622');
      for (let i = 0; i < 9; i++) P((i * 23 + 7) % 160, 62 + (i % 4) * 5, 10, 1, '#2c4a62');
      g.fillStyle = '#1a1c1e'; g.beginPath(); g.moveTo(58, 68); g.lineTo(70, 46); g.lineTo(122, 42); g.lineTo(140, 68); g.fill();
      g.fillStyle = '#26402a'; g.beginPath(); g.moveTo(70, 46); g.lineTo(122, 42); g.lineTo(118, 48); g.lineTo(74, 50); g.fill();
      P(78, 40, 26, 8, '#d8d4c8'); P(78, 39, 26, 1, '#8a8a8a'); P(84, 43, 3, 4, '#ffd27a');
      P(92, 22, 9, 22, '#ecebe4'); P(99, 22, 2, 22, '#c4c2ba'); P(90, 20, 13, 2, '#2a2a2a');
      P(92, 15, 9, 5, '#ffe9a8'); P(93, 15, 1, 5, '#2a2a2a'); P(96, 15, 1, 5, '#2a2a2a'); P(99, 15, 1, 5, '#2a2a2a');
      P(91, 12, 11, 3, '#3a3a3a'); P(95, 10, 3, 2, '#3a3a3a');
      P(56, 66, 90, 2, '#e8eef2'); P(60, 69, 30, 1, '#9ab0c0'); P(118, 69, 22, 1, '#9ab0c0');
    },
    people: {
      me: { key: 'fl-me', skin: '#f0c8a0', hair: '#6a4a2a', hs: 'short', top: '#1e2a44', top2: '#d8d4c8', bottom: '#1a2238', shoes: '#111', hat: 'cap', hatC: '#1a2238',
        extra(g, d, fr, G, R) { if (d === 0) { R(7, G.tT + 2, 1, 1, '#c9a35a'); R(7, G.tT + 4, 1, 1, '#c9a35a'); R(6, G.hT - 1, 4, 1, '#c9a35a'); } } },
      angus: { key: 'fl-angus', skin: '#e0b090', hair: '#b8b4ac', hs: 'short', top: '#1e2a44', top2: '#d8d4c8', bottom: '#1a2238', shoes: '#111', hat: 'cap', hatC: '#1a2238',
        extra(g, d, fr, G, R) { if (d === 0) { R(5, G.hT + 5, 6, 3, '#cfcac0'); R(6, G.hT + 8, 4, 1, '#cfcac0'); R(7, G.tT + 2, 1, 1, '#c9a35a'); R(6, G.hT - 1, 4, 1, '#c9a35a'); } else if (d === 1) R(4, G.hT + 5, 4, 3, '#cfcac0'); } },
      angusO: { key: 'fl-angusO', skin: '#e0b090', hair: '#b8b4ac', hs: 'short', top: '#b8962e', top2: '#8a6e1e', bottom: '#2a2a2a', shoes: '#111', coat: true, hat: 'straw', hatC: '#a8862a',
        extra(g, d, fr, G, R) { if (d === 0) { R(5, G.hT + 5, 6, 3, '#cfcac0'); R(6, G.hT + 8, 4, 1, '#cfcac0'); } } },
      rory: { key: 'fl-rory', skin: '#f2c8a4', hair: '#8a3a1a', hs: 'messy', top: '#2e3a30', top2: '#3e4a40', bottom: '#2a2a2e', shoes: '#1a1410',
        extra(g, d, fr, G, R) { if (d === 0) { for (let y = G.tT + 2; y < G.tB; y += 2) R(5, y, 6, 1, '#3a4a3c'); R(5, G.hT + 6, 1, 1, '#d89a7a'); } } },
      roryO: { key: 'fl-roryO', skin: '#f2c8a4', hair: '#8a3a1a', hs: 'messy', top: '#b8962e', top2: '#8a6e1e', bottom: '#2a2a2e', shoes: '#1a1410', coat: true, hat: 'straw', hatC: '#a8862a',
        extra(g, d, fr, G, R) { } },
      /* 雨衣里的空影子（游戏虚构） */
      oil: { key: 'fl-oil', skin: '#04060a', hair: '#04060a', hs: 'short', top: '#8a7428', top2: '#5a4a18', bottom: '#8a7428', shoes: '#04060a', coat: true, hat: 'hood', hatC: '#7a6420', ghost: true, eye: '#04060a',
        extra(g, d, fr, G, R) { if (d === 0) { R(4, G.hT, 8, 8, '#04060a'); R(6, G.hT + 4, 1, 1, '#9ab8c8'); R(9, G.hT + 4, 1, 1, '#9ab8c8'); } R(3, G.tT + 3, 1, 2, '#8ab0c8'); R(12, G.tT + 6, 1, 2, '#8ab0c8'); R(7, G.tB + 1, 1, 2, '#8ab0c8'); } }
    },
    /* 惊吓大头像：帽兜里是空的，海水从里面往外淌 */
    faces: {
      oil(R, a, t) {
        R(0, 0, 32, 32, '#06080c');
        const oc = '#a8882c', od = '#6e5816', ol = '#d8b850';
        R(5, 3, 22, 3, od); R(3, 6, 26, 6, oc); R(2, 12, 28, 20, oc); R(1, 18, 3, 14, od); R(28, 18, 3, 14, od);
        R(6, 4, 8, 1, ol); R(4, 7, 3, 8, ol); R(25, 8, 2, 6, od); R(8, 26, 16, 6, od); R(15, 26, 2, 6, '#3a2e0c');
        R(7, 8, 18, 18, '#020305'); R(8, 7, 16, 1, '#020305'); R(9, 26, 14, 2, '#020305');
        const gl = a > .4 ? '#d8f0ff' : '#5a7a8a';
        R(12, 15, 1, 1, gl); R(19, 15, 1, 1, gl);
        if (a > .5) { const o = Math.min(4, ((a - .5) * 14) | 0); R(13, 20, 6, 1 + o, '#0c2a30'); R(14, 21, 4, o, '#1a4a50'); }
        for (let i = 0; i < 7; i++) { const x = 6 + i * 3.2, y = 5 + ((t * 30 + i * 9) % 26); R(x, y, 1, 2, 'rgba(160,200,220,.75)'); }
        for (let i = 0; i < 4; i++) { const y = 22 + ((t * 18 + i * 5) % 10); R(13 + i * 2, y, 1, 2, 'rgba(120,180,190,.8)'); }
      }
    },
    endings: { light: '灯下的三个人', jetty: '码头', coat: '第三件雨衣' },
    items: {},
    notes: {
      duty: { title: '值班规程（摘抄）', text: '北方灯塔委员会　弗兰南群岛灯塔\n\n一、灯从日落点到日出，不得熄灭。\n二、灯塔任何时候不得无人。三名看守不得同时离站。\n三、天气、风向、点灯与熄灯时刻，每日记入日志；白天先记在石板上，晚间誊入日志。\n\n【点灯】日落前完成：\n1. 拉起灯笼窗的遮光帘。\n2. 预热碗里注入酒精并点燃——看沙漏，沙子漏完再开阀。\n3. 油箱打气，压力到红线（三下）。\n4. 开油阀，点燃纱罩。\n5. 上满发条，按灯质设定透镜转速，松开制动。\n\n本站灯质：白光两闪，每 30 秒一组。' },
      report: { title: '1900 年的调查报告（抄件）', text: '（发黄的打字纸。人名只写职务。）\n\n12 月 26 日中午，补给船到岛。旗杆上没有旗，码头上没有人。院门、屋门都关着，床没收拾，钟停了。三名看守都不在。灯已擦净加满油，厨房收拾得很干净。\n\n出门穿的雨衣少了两套，第三套还挂在钩子上——查案的人推断，第三个人是只穿着衬衫出的门。\n\n日志记到 12 月 13 日。此后记在石板上，最后一条是 15 日上午 9 点：灯已擦净，油壶已满，遮光帘已拉上。\n\n西码头：海拔约 110 英尺处的绳箱被砸开，铁栏杆扭弯，一块一吨多重的石头挪了位；200 英尺以上的崖顶，草皮被掀掉。\n\n结论：三人 15 日午饭后下到西码头固定绳箱，被意外的巨浪卷走。按规定，灯塔任何时候不得无人。\n（另：15 日午夜前后，一艘过路汽船看见此灯未亮。）' },
      flog1: { title: '那页日志（一）', text: '（不是你的字。墨水还没干透。）\n\n12 月 12 日。西北偏北大风。海面暴怒。从没见过这样的风暴。浪很高，撕扯着灯塔。一切井井有条。首席看守脾气很坏。\n\n夜里。风暴还在刮，风向未变。困在屋里，出不去。有船经过，拉了雾笛，能看见船舱里的灯。首席看守很安静。临时看守在哭。' },
      flog2: { title: '那页日志（二）', text: '（不是你的字。昨晚还空着的地方，多了几行。）\n\n12 月 12 日。西北偏北大风。海面暴怒。从没见过这样的风暴。浪很高，撕扯着灯塔。一切井井有条。首席看守脾气很坏。\n\n夜里。风暴还在刮，风向未变。困在屋里，出不去。有船经过，拉了雾笛，能看见船舱里的灯。首席看守很安静。临时看守在哭。\n\n12 月 13 日。风暴刮了一整夜。风转西偏北。首席看守很安静。临时看守在祈祷。\n\n中午，灰色的天光。我、首席看守和临时看守一起祈祷。' },
      flog3: { title: '那页日志（三）', text: '（不是你的字。最底下，又多了一行。现在才中午。）\n\n12 月 12 日。西北偏北大风。海面暴怒。从没见过这样的风暴……首席看守脾气很坏。\n夜里。……临时看守在哭。\n\n12 月 13 日。风暴刮了一整夜。……临时看守在祈祷。\n中午，灰色的天光。我、首席看守和临时看守一起祈祷。\n\n（没有 14 日。）\n\n12 月 15 日。下午一点。风暴停了，海面平静。神在一切之上。' }
    },
    legend: '弗兰南群岛（Flannan Isles）在苏格兰外赫布里底群岛刘易斯岛以西约二十英里，七座小岛常年无人居住，水手们叫它们「七猎人」。最大的一座叫大岛（Eilean Mòr），岛上有一间据说供奉圣弗兰南的小礼拜堂遗迹，小得后来的灯塔看守管它叫「狗窝」。十八世纪初，一位记述西部群岛风俗的作者写道：刘易斯人每年夏天上岛捡鸟蛋、取羊毛，爬上岛顶时要脱帽、顺着太阳转一圈致谢；在岛上不能用平常的名字称呼这片岛，只能叫它「那片地方」，不少平常的词也要换一个说法。岛上的灯塔 1895 年动工，1899 年 12 月 7 日第一次点亮，灯质是白光两闪、每 30 秒一组，直到今天。\n\n1900 年 12 月 15 日午夜前后，一艘从美国驶往利斯的汽船经过附近，看见弗兰南的灯没有亮，但直到靠岸才报告。补给船因为天气耽搁，12 月 26 日中午才到岛上：旗杆上没有旗，码头上没有摆出空箱子，也没有人来接船。替班看守上岸后发现院门和屋门都关着，床没有收拾，钟停了，三名看守都不见了；灯已擦净加满油，随时可以点燃，厨房收拾得很干净；两套出门穿的雨衣和水靴不见了，第三套还在。日志记到 13 日，此后的记录写在石板上，最后一条是 15 日上午 9 点。几天后上岛调查的负责人在西码头发现了风暴的痕迹：海拔约 110 英尺处装吊绳的箱子被砸开，铁栏杆扭弯，一块一吨多重的石头被挪了位，200 英尺以上的崖顶草皮被掀掉。他的结论是：三人在 15 日午饭后下到西码头固定器材，被一个意外的巨浪卷走；他还推断其中一人是只穿着衬衫出门的，并指出按规定灯塔任何时候都不应无人看守。三人从此再也没有找到。（本章不写他们的名字。）\n\n这件事后来被一再加工。1912 年，一位英国诗人写了叙事诗《弗兰南岛》，诗里的搜寻者看见桌上摆着一口没动的饭、一把翻倒的椅子——当年的报告里并没有这些。再往后，通俗读物和杂志里流传起一份「日志」：12 日到 15 日写着前所未见的大风暴，说首席看守脾气暴躁、临时看守在哭、三人一起祈祷，最后一条是「下午一点，风暴停了，海面平静，神在一切之上」。后来有研究者查对档案，认为原始记录里根本没有这些话，是后人编造的。各种猜测也一直没断过：海怪、外国间谍、被过路的船带走、「七猎人的幽灵船」、有人失足而其他人下去救、看守之间起了冲突……如今多数人倾向于巨浪的解释：西码头有一道狭窄的岩沟，涌浪灌进去时会突然猛烈地冲上来。灯塔在 1971 年改为自动运行，岛上从此不再有人值守。\n\n（本章中的「你」、安格斯、罗里，以及 1932 年冬天的那三天，均为游戏虚构，不对应任何真实人物；1900 年的三名看守在游戏中不出现，也不使用他们的名字。会自己续写的那页「日志」、雨衣里的空影子、罗里的梦游、风暴夜灯廊上的人影、15 日下午的涌浪与 16 日早上的景象，都是游戏虚构；那页「日志」的文字依据流传的伪造版本改写，用来对照真实的档案；它在 1932 年的灯塔里「自己写出来」，也是虚构——这份伪造「日志」最早出现在什么时候、出自谁手，至今说法不一。点灯的五个步骤参考了那个年代灯塔常用的煤油汽化灯，做了简化；「四块牛眼两两成组、转一圈六十秒」是为谜题设定的结构，真实透镜的构造不一定如此，灯质「两闪、每 30 秒」是真实的。）',
    start: { map: 'isle', x: 24, y: 19, dir: 3 },
    resume: {
      storm: async S => {
        roryBack(S); lensLight(S);
        const D = Math.max(RS.storm != null ? Math.round(RS.storm) : DAWN, 50);
        await S.narr(D < DAWN ? '风还在刮。离天亮，又近了一点。' : '风还在刮。');
        await S.think('压力十几秒就掉到底，发条慢一点——轮着补。\n楼下一有脚步声，先补满，再下去拦住罗里。');
        startStorm(S, D);
      },
      calm: async S => {
        const T = Math.max(RS.calm != null ? Math.round(RS.calm) : CALM, 45);
        await S.narr('安格斯蹲在门口，系着鞋带。');
        await S.think('三十二年前的档案，今天的海，钩子上的雨衣。\n一样一样摆到他面前。');
        startCalm(S, T);
      }
    },
    async intro(S) {
      await S.card('第三十夜　灯塔', '1932 年 12 月 13 日　苏格兰　外赫布里底群岛', '刘易斯岛往西二十多英里，大西洋里散着七座没人住的小岛。\n水手们叫它们「七猎人」。\n最大的那座岛上，有一座灯塔。\n\n三十二年前的冬天，这座灯塔的三个看守，一起不见了。');
    },
    tick(S, dt) {
      const f = S.f;
      /* 预热沙漏 */
      if (f.pre && f.preL > 0) { f.preL -= dt; const sp = S.ent('spirit'); const v = Math.max(0, f.preL / 8); if (Math.abs((sp.s.sand ?? 1) - v) > .05) sp.s.sand = v; if (f.preL <= 0) { sp.s.sand = 0; S.toast('沙子漏完了'); } }
      /* 透镜闪光：两闪，每 30 秒一组（只在灯室里加亮） */
      if (S.map === 'tower' && f.rot && f.lit) {
        const p = W.t % 30, on = p < .3 || (p > 1.0 && p < 1.3);
        if (on !== FL.on) { FL.on = on; S.lights(on ? [[LENS[0], LENS[1], 7.5, 1]] : null); S.ent('lens').s.fl = on ? 1 : 0; if (on) S.tone('sine', 110, 108, .3, .018, 0, 500); }
      } else if (FL.on) { FL.on = false; S.lights(null); }
      /* 钟表机构的滴答：风暴夜发条越少走得越慢；在楼下只听得见一点点 */
      if (f.rot && f.lit && (S.map === 'tower' || (f.ph === 'storm' && S.map === 'house'))) {
        const c = f.ph === 'storm' ? Math.max(0, f.C) : 1;
        FL.tk = (FL.tk ?? .5) - dt;
        if (FL.tk <= 0) { FL.tk = .55 + (1 - c) * 1.3; FL.tt = !FL.tt; const v = S.map === 'tower' ? .022 : .007; S.tone('square', FL.tt ? 1900 : 1600, FL.tt ? 1900 : 1600, .02, v, 0, 3500); }
      }
      if (W.ended) return;
      if (f.ph === 'storm' && W.timer && !S.busy) stormTick(S, dt);
      /* 岛上：走近罗里 / 回头一瞥（用 tick 检查，避免踩格事件被吞） */
      if (S.map === 'isle' && !S.busy && f.ph === 'arrive') {
        if (f.rWait && !f.chapel && dist(S, 16, 13) <= 2) S.run(chapelTalk);
        else if (f.chapel && !f.glimpse && S.pl.y <= 11 && S.pl.x >= 13 && S.pl.x <= 17) S.run(glimpse);
      }
    },
    tiles: {
      dyke: { solid: true, paint(R, X, Y) { TILE.grass.paint(R, X, Y, { grassC: '#34482c' }); R(0, 3, 16, 11, '#5c5a52'); for (let i = 0; i < 3; i++) R(i * 5 + (Y % 2) * 2, 4 + (i % 2) * 5, 5, 4, shade('#6e6b62', (hash(X, Y, i) - .5) * .3)); R(0, 3, 16, 1, '#7a776c'); R(0, 13, 16, 1, '#3a3832'); } },
      track: { solid: false, paint(R, X, Y) { speck(R, '#4a3e30', ['#56483a', '#3e3428'], X, Y, 14, 31); R(0, 3, 16, 2, '#5a4430'); R(0, 11, 16, 2, '#5a4430'); R(4, 0, 2, 16, '#7a7a80'); R(10, 0, 2, 16, '#7a7a80'); R(4, 0, 1, 16, '#a0a0a8'); R(10, 0, 1, 16, '#a0a0a8'); } },
      surf: { solid: true, paint(R, X, Y) { TILE.water.paint(R, X, Y); for (let i = 0; i < 4; i++) { const h = hash(X, Y, 90 + i); R((h * 11) | 0, (hash(X, Y, 95 + i) * 14) | 0, 5, 1, '#c8d8e0'); R(((h * 11) | 0) + 1, ((hash(X, Y, 95 + i) * 14) | 0) + 1, 3, 1, '#7a98aa'); } } },
      railing: { solid: true, paint(R, X, Y) { TILE.concrete.paint(R, X, Y); R(0, 5, 16, 2, '#3a3e44'); R(0, 10, 16, 1, '#3a3e44'); R(2, 3, 2, 12, '#2e3236'); R(12, 3, 2, 12, '#2e3236'); R(0, 5, 16, 1, '#6a7078'); } },
      railbent: { solid: true, paint(R, X, Y) { TILE.concrete.paint(R, X, Y); R(0, 5, 5, 2, '#3a3e44'); R(5, 7, 4, 2, '#3a3e44'); R(9, 10, 7, 2, '#3a3e44'); R(2, 3, 2, 12, '#2e3236'); R(13, 9, 2, 6, '#2e3236'); R(12, 7, 3, 2, '#2e3236'); R(1, 14, 5, 1, '#8a3a1a'); } },
      turf: { solid: false, paint(R, X, Y) { speck(R, '#3a2e22', ['#4a3a2a', '#2a2018'], X, Y, 16, 33); R((hash(X, Y, 1) * 8) | 0, 3, 6, 3, '#2c4428'); R(((hash(X, Y, 2) * 8) | 0) + 4, 10, 5, 2, '#34502e'); R(2, 13, 3, 1, '#6a7a7a'); } }
    },
    sprites: {
      /* ---- 岛上 ---- */
      ltower(g, e, t, R) {
        const lit = e.lit;
        R(8, -70, 16, 84, '#e8e6de'); R(20, -70, 4, 84, '#c4c2b8'); R(8, -70, 1, 84, '#f6f4ee');
        R(7, -2, 18, 2, '#9a988e'); R(12, -40, 4, 6, '#2a3038'); R(12, -20, 4, 6, '#2a3038');
        R(5, -74, 22, 4, '#2a2a2c'); R(4, -73, 24, 1, '#5a5a5c');
        R(9, -86, 14, 12, lit ? '#ffe9a8' : '#3a4450'); for (let x = 11; x < 23; x += 4) R(x, -86, 1, 12, '#2a2a2c');
        R(8, -90, 16, 4, '#2c2c2e'); R(13, -93, 6, 3, '#2c2c2e'); R(15, -95, 2, 2, '#c9a35a');
        if (lit) { const p = t % 30, on = p < .3 || (p > 1 && p < 1.3); if (on) { g.fillStyle = 'rgba(255,240,190,.22)'; g.beginPath(); g.moveTo(e.sx + 16, e.sy - 80); g.lineTo(e.sx - 160, e.sy - 120); g.lineTo(e.sx - 160, e.sy - 40); g.fill(); g.beginPath(); g.moveTo(e.sx + 16, e.sy - 80); g.lineTo(e.sx + 200, e.sy - 110); g.lineTo(e.sx + 200, e.sy - 50); g.fill(); } }
      },
      hdoor(g, e, t, R) { box(R, 3, 0, 10, 15, '#2a3a4a'); R(4, 1, 8, 2, '#3a4e60'); R(10, 8, 1, 2, '#c9a35a'); R(2, -1, 12, 1, '#c8c4b8'); },
      chapel(g, e, t, R) {
        R(1, -6, 30, 20, '#5a5650'); for (let y = -6; y < 14; y += 4) for (let x = 1 + ((y / 4) & 1) * 3; x < 31; x += 6) R(x, y, 5, 3, shade('#6a665e', (hash(x, y, 4) - .5) * .25));
        R(0, -9, 32, 4, '#3e4a36'); R(2, -11, 28, 3, '#4a5640');
        R(13, 4, 6, 10, '#0c0c0e'); R(12, 3, 8, 1, '#7a766c');
      },
      crane(g, e, t, R) { R(6, -4, 4, 18, '#3a3e44'); R(5, 12, 6, 3, '#2a2e32'); R(8, -6, 20, 2, '#4a4e54'); R(26, -6, 1, 14, '#6a6a6a'); R(25, 7, 3, 2, '#5a5a5a'); R(9, -4, 8, 1, '#2a2e32'); },
      rbox(g, e, t, R) {
        if (e.broken) { R(1, 9, 6, 2, '#6a4a2a'); R(8, 11, 7, 2, '#5a3e22'); R(3, 4, 2, 6, '#6a4a2a'); R(11, 3, 2, 7, '#7a5a34'); R(0, 13, 16, 1, '#8a7a5a'); R(5, 6, 6, 1, '#b8a070'); R(9, 7, 1, 6, '#b8a070'); return; }
        box(R, 1, 3, 14, 11, '#6a4a2a'); R(2, 4, 12, 2, e.open ? '#2a1a10' : '#7a5a34'); R(2, 8, 12, 1, '#4a3420'); R(7, 9, 2, 2, '#9a9a9a');
        if (e.open) { R(12, 1, 3, 4, '#7a5a34'); R(4, 5, 8, 1, '#b8a070'); R(13, 10, 3, 1, '#b8a070'); }
      },
      bigstone(g, e, t, R) { R(1, 4, 14, 10, '#5a5852'); R(2, 3, 11, 2, '#6c6a62'); R(3, 5, 5, 3, '#7a776e'); R(1, 13, 14, 2, '#3a3834'); },
      scar(g, e, t, R) { R(2, 5, 12, 8, '#2a2e2c'); R(3, 6, 10, 6, '#3a3e3a'); R(4, 8, 3, 1, '#1a1e1c'); },
      flagpole(g, e, t, R) { R(7, -28, 2, 42, '#9a9a9a'); R(5, 12, 6, 3, '#4a4a4a'); if (e.flag) { const w = Math.sin(t * 4) > 0 ? 1 : 0; R(9, -28, 10, 7, '#2a3a8a'); R(9, -25, 10, 1, '#e8e8e8'); R(13 + w, -28, 1, 7, '#e8e8e8'); } },
      reliefboat(g, e, t, R) { const b = Math.sin(t * 2) * 1.2; R(0, 4 + b, 32, 9, '#3a2a22'); R(2, 3 + b, 28, 2, '#e8e4d8'); R(4, 6 + b, 24, 1, '#5a4a3a'); R(12, -6 + b, 10, 9, '#d8d4c8'); R(14, -4 + b, 3, 3, '#2a3a4a'); R(18, -4 + b, 3, 3, '#2a3a4a'); R(16, -12 + b, 2, 6, '#2a2a2a'); },
      sign(g, e, t, R) { R(7, 2, 2, 12, '#5a4430'); R(1, -2, 14, 7, '#e8e4d8'); R(2, -1, 12, 1, '#2a3a8a'); R(3, 1, 10, 1, '#4a4a4a'); R(3, 3, 7, 1, '#4a4a4a'); },
      swell(g, e, t, R) { const x = ((t * 6) % 30) - 30; R(x, 2, 160, 3, 'rgba(230,240,245,.8)'); R(x, 5, 160, 2, 'rgba(150,180,200,.6)'); },
      /* ---- 屋里 ---- */
      fdoor(g, e, t, R) {
        if (e.open) { R(2, -2, 12, 17, '#0a0e14'); R(2, -2, 2, 17, '#2a3a4a'); R(4, 6, 10, 9, e.storm ? 'rgba(120,140,170,.5)' : 'rgba(150,160,170,.35)'); return; }
        box(R, 2, -2, 12, 17, '#2a3a4a'); R(4, -1, 8, 3, '#3a4e60'); R(4, 4, 8, 4, '#33475a'); R(4, 9, 8, 4, '#33475a'); R(11, 6, 2, 2, '#c9a35a'); R(3, 0, 1, 2, '#888'); R(3, 9, 1, 2, '#888');
      },
      hooks(g, e, t, R) {
        R(0, 1, 16, 2, '#4a3420'); for (const x of [2, 7, 12]) R(x, 3, 1, 2, '#c9a35a');
        const n = e.n ?? 3;
        for (let i = 0; i < n; i++) { const x = [0, 5, 10][i]; R(x, 4, 5, 11, '#b8962e'); R(x + 1, 4, 3, 2, '#8a6e1e'); R(x + 4, 5, 1, 10, '#8a6e1e'); R(x + 1, 13, 3, 1, '#d8b850'); }
        if (e.wet && n > 1) { R(6, 15, 3, 1, '#4a6a7a'); const y = 15 + ((t * 8) % 4); R(7, y, 1, 1, '#9ab8c8'); }
      },
      slate(g, e, t, R) { box(R, 2, 1, 12, 9, '#4a3420'); R(3, 2, 10, 7, '#2a2e30'); R(4, 3, 7, 1, '#b8bcb8'); R(4, 5, 5, 1, '#b8bcb8'); R(4, 7, 8, 1, '#9a9e9a'); },
      baro(g, e, t, R) { R(6, 0, 4, 12, '#5a3c22'); R(4, 2, 8, 8, '#e8e2cc'); R(5, 3, 6, 6, '#d8d0b8'); if (e.lo) { R(7, 6, 1, 1, '#1a1a1a'); R(6, 7, 1, 1, '#1a1a1a'); R(5, 8, 1, 1, '#1a1a1a'); } else { R(7, 4, 1, 3, '#1a1a1a'); } R(10, 5, 1, 1, '#c03030'); },
      swin(g, e, t, R) {
        box(R, 2, 1, 12, 10, '#3a3a3a');
        let c = '#7a8a94'; if (e.storm) c = '#141c26'; else if (e.calm) c = '#8a9098';
        R(3, 2, 10, 8, c); R(7, 2, 1, 8, '#3a3a3a'); R(3, 5, 10, 1, '#3a3a3a');
        if (e.storm) { for (let i = 0; i < 5; i++) { const y = 2 + ((t * 20 + i * 7) % 8); R(3 + i * 2, y, 1, 2, '#6a8098'); } if ((t * 7 | 0) % 23 === 0) R(3, 2, 10, 8, '#c8d4e8'); }
        if (e.calm) { R(3, 8, 10, 1, '#b8c0c8'); }
      },
      bunk(g, e, t, R) { box(R, 1, -2, 14, 32, '#4a3420'); R(2, -1, 12, 4, '#5a4430'); R(3, 3, 10, 5, '#e6e2d6'); R(2, 9, 12, 19, '#3a4a6a'); R(2, 9, 12, 2, '#4a5a7a'); if (e.occ) { R(5, 3, 6, 5, '#e8c0a0'); R(5, 3, 6, 2, e.col || '#8a3a1a'); R(3, 9, 10, 8, '#465676'); } },
      range(g, e, t, R) {   // 铸铁灶：上面一把铁壶，炉门里透着火光
        box(R, 1, 1, 14, 13, '#26262a'); R(2, 2, 12, 2, '#3a3a40'); R(4, 7, 8, 5, '#121214'); R(5, 8, 6, 3, (t * 3 | 0) % 2 ? '#c8501a' : '#e0702a'); R(5, 11, 6, 1, '#6a2a10');
        R(9, -9, 2, 10, '#2e2e32'); R(3, -3, 6, 5, '#4a4a50'); R(4, -4, 4, 1, '#5a5a60'); R(9, -2, 2, 1, '#4a4a50'); R(1, 14, 14, 1, '#0e0e10');
      },
      meal(g, e, t, R) { for (const x of [3, 19]) { R(x, 4, 10, 6, '#e8e4d8'); R(x + 2, 5, 6, 3, '#c8a050'); R(x + 3, 6, 2, 1, '#8a5a2a'); } R(14, 2, 4, 6, '#c8c0a8'); R(15, 1, 2, 1, '#e8e8e8'); },
      /* ---- 灯室 ---- */
      blinds(g, e, t, R) {
        const W2 = e.w * 16;
        R(0, 0, W2, 14, '#2a2c30');
        for (let i = 0; i < e.w; i++) {
          const x = i * 16 + 1;
          if (!e.open) { R(x, 1, 14, 12, '#d8d2bc'); R(x, 4, 14, 1, '#c4bea8'); R(x, 8, 14, 1, '#c4bea8'); continue; }
          let c = '#6a7a88'; if (e.storm) c = '#0c121a'; else if (e.calm) c = '#3a4450';
          R(x, 1, 14, 12, c); R(x + 6, 1, 1, 12, '#2a2c30'); R(x, 6, 14, 1, '#2a2c30');
          if (e.storm) { for (let k = 0; k < 3; k++) { const y = 1 + ((t * 24 + i * 5 + k * 4) % 12); R(x + 2 + k * 4, y, 1, 2, '#5a7090'); } }
          if (e.calm && !e.storm) R(x, 10, 14, 1, '#5a6470');
        }
        if (e.storm && (t * 5 | 0) % 31 === 0) R(1, 1, W2 - 2, 12, 'rgba(220,230,255,.6)');
        if (e.ghost) {   // 贴在玻璃外面的雨衣人影
          const x = e.ghost === 2 ? 2 * 16 + 3 : 6 * 16 + 3;
          R(x, 1, 10, 12, '#5a4a18'); R(x + 1, 1, 8, 2, '#7a6420'); R(x + 2, 3, 6, 6, '#04060a'); R(x + 3, 5, 1, 1, '#9ab8c8'); R(x + 6, 5, 1, 1, '#9ab8c8');
          if (e.ghost === 2) { const k = Math.sin(t * 5) > 0 ? 0 : 2; R(x - 3, 2 + k, 3, 2, '#5a4a18'); }
        }
      },
      gdoor(g, e, t, R) {
        if (e.open) { R(2, -1, 12, 16, '#06080c'); R(2, -1, 2, 16, '#4a5058'); for (let i = 0; i < 4; i++) { const y = (t * 30 + i * 5) % 14; R(5 + i * 2, y, 1, 2, '#6a8098'); } return; }
        box(R, 2, -1, 12, 16, '#4a5058'); R(4, 1, 8, 5, '#3a4048'); R(4, 8, 8, 5, '#3a4048'); R(11, 6, 2, 2, '#b8b8b8'); R(3, 2, 1, 2, '#888');
      },
      lens(g, e, t, R) {   // 一人多高的透镜：铜框、一圈圈玻璃棱，转起来时牛眼从左往右扫过
        R(-2, 10, 20, 6, '#5a4a2a'); R(-3, 14, 22, 2, '#3a2e1a'); R(-1, 9, 18, 2, '#c9a35a');
        R(-4, -26, 24, 3, '#c9a35a'); R(-4, 6, 24, 3, '#c9a35a'); R(-5, -23, 2, 29, '#a8822a'); R(19, -23, 2, 29, '#a8822a');
        const lit = e.lit, base = lit ? '#fffaf0' : '#a8c0c8';
        R(-3, -23, 22, 29, lit ? '#e8dcb0' : '#5e7480');
        for (let y = -22; y < 6; y += 3) R(-3, y, 22, 1, lit ? '#fffbe8' : '#8aa4b0');
        const ph = e.rot ? (t * 2.2) % 30 : 9;
        for (const o of [0, 15]) { const bx = -3 + ((ph + o) % 30) - 4; if (bx > -5 && bx < 18) { R(Math.max(-3, bx), -14, Math.min(6, 19 - bx), 9, base); R(Math.max(-3, bx + 1), -12, 3, 5, lit ? '#ffffff' : '#d0e0e8'); } }
        if (lit) { R(5, -11, 6, 6, '#fff6c0'); R(6, -10, 4, 4, '#ffffff'); }
        if (e.fl) { R(-14, -16, 44, 12, 'rgba(255,255,230,.5)'); R(-8, -13, 32, 6, 'rgba(255,255,255,.8)'); }
      },
      pump(g, e, t, R) {
        box(R, 2, 3, 12, 11, '#6a2a22'); R(3, 4, 10, 2, '#8a3a2e'); R(7, -6, 2, 10, '#5a5a5a'); R(4, -7, 8, 2, '#3a3a3a');
        /* 压力表：一根竖着的刻度条，红线在三分之二 */
        R(10, -5, 6, 18, '#1a1a1c'); R(11, -4, 4, 16, '#e8e2cc');
        const p = Math.max(0, Math.min(1, e.p || 0)), hgt = Math.round(p * 15);
        R(12, 11 - hgt + 1, 2, hgt, p < .3 ? '#e04030' : '#3a6a3a'); R(10, 1, 6, 1, '#c03030');
        if (p < .3 && (t * 4 | 0) % 2) R(10, -5, 6, 1, '#ff4030');
      },
      clock(g, e, t, R) {
        box(R, 1, -4, 14, 18, '#3a3a40'); R(2, -3, 12, 8, '#4a4a52');
        for (const [x, y, r] of [[5, 0, 3], [10, 1, 2]]) { R(x - r, y - r, r * 2, r * 2, '#c9a35a'); R(x - 1, y - 1, 2, 2, '#6a5020'); }
        const c = Math.max(0, Math.min(1, e.c || 0)), wy = 12 - Math.round(c * 13);
        R(12, -4, 1, wy + 4, '#999'); R(10, wy, 5, 4, '#2a2a2a'); R(11, wy + 1, 3, 1, '#5a5a5a'); R(3, 7, 6, 5, '#e8e2cc'); R(5, 9, 2, 1, '#1a1a1a');
        if (c < .25) R(10, wy + 4, 5, 1, (t * 4 | 0) % 2 ? '#ff4030' : '#2a2a2a');
      },
      spirit(g, e, t, R) {
        R(2, 8, 8, 6, '#b87a3a'); R(3, 7, 6, 2, '#d89a5a'); R(4, 4, 4, 3, '#b87a3a'); R(5, 2, 2, 2, '#8a5a2a');
        R(10, 4, 5, 1, '#c9a35a'); R(10, 13, 5, 1, '#c9a35a'); R(11, 5, 3, 3, 'rgba(200,220,230,.5)'); R(11, 10, 3, 3, 'rgba(200,220,230,.5)');
        const s = e.sand ?? 1; const top = Math.round(3 * s);
        if (top > 0) R(11, 8 - top, 3, top, '#d8c088'); R(11, 13 - (3 - top), 3, 3 - top, '#d8c088');
        if (s > 0 && s < 1) R(12, 8, 1, 2, '#d8c088');
      }
    },
    maps: {
      /* ---------------- 大岛 ---------------- */
      isle: {
        amb: 'wind', dark: .3, wall: 'stone', floor: 'grass', plr: 3.2,
        wallC: { top: '#4a4e56', face: '#d8d4c8', trim: '#b8962e' },
        tileOpts: { grassC: '#34482c' },
        legend: { Q: 'dyke', j: 'track', F: 'surf', I: 'railing', J: 'railbent', Y: 'turf' },
        rows: [
          '~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~',
          '~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~',
          '~~~~~~~~~~FFFFFFFFFFFFFF~~~~~~~~',
          '~~~~~~~~FFFKKKKKKKKKKKKFFF~~~~~~',
          '~~~~~~FFFKK""""""""""""KKFFF~~~~',
          '~~~~~FFKK"QQQQQQQQQQQQ"""KKFF~~~',
          '~~~~FFK"""Q##########Q"""""KFF~~',
          '~~~FFK""""Q##########Q""""""KFF~',
          '~~~FK"""""QxxxxxxxxxxQ"""""""KF~',
          '~~FFK"""""QxxxxxxxxxxQ"""""""KFF',
          '~~FK""""""QQQQQxQQQQQQ""""""""KF',
          '~~FK"""""""""""j""""""""""""""KF',
          '~FFK""dddddddddj""""""""""""""KF',
          '~Fxxxxd""""""""j""""""""""""""KF',
          '~Fxxxx"""""""""j"""""""""""""KFF',
          '~Fxxxx"""""""""jjjjjjjjjj""""KF~',
          '~FIIII""""""""""""""""""j"""KFF~',
          '~FFFFFK""""""""""""""""xjxxKFF~~',
          '~~~~~FFKK""""""""""""""xxxxFF~~~',
          '~~~~~~FFFKKK""""""""""KxxxxF~~~~',
          '~~~~~~~~FFFFKKKKKKKKKKFxxxxF~~~~',
          '~~~~~~~~~~~FFFFFFFFFFFFFFFFF~~~~',
          '~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~'],
        ents: [
          { id: 'ltower', x: 18, y: 7, w: 2, spr: 'ltower', solid: true, on: S => S.narr(S.f.ph === 'morning' ? '灯塔白得发亮。昨晚它一直亮着。' : '白色的塔身，七十多英尺高。塔顶那圈玻璃里，就是灯。') },
          { id: 'hdoor', x: 13, y: 7, spr: 'hdoor', async on(S) {
            const ph = S.f.ph;
            if (ph === 'arrive' && !S.f.chapel) return S.narr('门闩着。钥匙在罗里身上——他还在后面的小路上等你。');
            if (ph === 'morning') return S.narr('先去西码头看看。安格斯在那儿等着。');
            if (ph === 'out') return;
            S.sfx('open');
            if (ph === 'arrive') { await S.go('house', 2, 2, 0); return meetAngus(S); }
            await S.go('house', 2, 2, 0);
          } },
          { id: 'xwin1', x: 11, y: 7, spr: 'window', on: S => S.narr('厨房的窗户。窗台上摆着一排擦干净的油灯罩。') },
          { id: 'xwin2', x: 16, y: 7, spr: 'window', on: S => S.narr('办公室的窗户。从这儿能看见一张写字台。') },
          { id: 'flag', x: 12, y: 8, spr: 'flagpole', on: S => S.narr(S.ent('flag').s.flag ? '旗升起来了。船从海上看见旗，就知道岛上平安。' : '旗杆。补给船来的那天要升旗——船上的人看见旗，就知道岛上平安。') },
          { id: 'sign', x: 26, y: 16, spr: 'sign', on: S => S.narr('「北方灯塔委员会　弗兰南群岛灯塔　东码头」\n铁牌子让海风啃得斑斑点点。') },
          { id: 'boat', x: 24, y: 21, w: 2, spr: 'reliefboat', solid: false, on: S => S.narr('补给船。两个礼拜后才会再来。') },
          { id: 'chapel', x: 17, y: 12, w: 2, spr: 'chapel', on: async S => {
            if (S.f.ph === 'morning') return S.narr('小礼拜堂还好好地趴在那儿。几百年的风暴，它都熬过来了。');
            await S.narr('圣弗兰南的小礼拜堂。干垒的石墙，草皮的屋顶，一扇只容一个人弯腰进去的门。\n里面很黑，有一股湿土和海盐的味道。');
          } },
          { id: 'rory_i', x: 24, y: 17, spr: '@rory', dir: 0, async on(S) {
            S.face('rory_i', 'pl');
            if (S.f.ph === 'arrive') return S.f.rWait ? chapelTalk(S) : S.say('罗里', '跟着铁轨走。');
            if (S.f.ph === 'morning') return S.say('罗里', '（他望着崖顶那一片被掀掉的草皮，半天没说话）');
          } },
          { id: 'angus_i', x: 5, y: 15, spr: '@angus', dir: 1, hidden: true, async on(S) { if (S.f.ph === 'morning') return morningTalk(S); } },
          { id: 'ghost_i', x: 5, y: 13, spr: '@oil', dir: 1, hidden: true, solid: false },
          { id: 'swell', x: 0, y: 17, spr: 'swell', hidden: true, solid: false, decal: true },
          { id: 'crane', x: 2, y: 13, spr: 'crane', on: S => S.narr(S.f.ph === 'morning' ? '吊杆歪了。底座的螺栓，有两根被扯断了。' : '吊杆。补给船靠西码头的时候，就用它把货一箱一箱吊上来。') },
          { id: 'rbox', x: 4, y: 13, spr: 'rbox', async on(S) {
            if (S.f.ph === 'morning') { S.f.m_rbox = true; return S.narr('装吊绳的木箱，砸成了一地劈柴。\n绳子一圈一圈缠在礁石上，像被谁使劲拧过。\n这里离海面，有一百一十英尺。'); }
            await S.narr('一只装吊绳和滑轮的木箱，用铁箍钉在平台上。');
          } },
          { id: 'bigstone', x: 3, y: 15, spr: 'bigstone', async on(S) {
            if (S.f.ph === 'morning') { S.f.m_bigstone = true; return S.narr('一块一吨多重的石头，被挪了一个身子。\n它原来趴着的地方，留下一个光秃秃的印子。'); }
            await S.narr('一块大石头，压着栏杆的底座。');
          } },
          { id: 'scar', x: 3, y: 15, spr: 'scar', hidden: true, decal: true, solid: false },
          { id: 'rails', x: 3, y: 16, spr: 'invisible', async on(S) {
            if (S.f.ph === 'morning') { S.f.m_rails = true; return S.narr('铁栏杆被扭成了麻花，有一段往里折了过来。\n人的手，掰不弯这个。'); }
            await S.narr('一圈铁栏杆。栏杆外面，就是一百多英尺下的海。');
          } },
          { id: 'turf', x: 5, y: 11, spr: 'invisible', async on(S) {
            if (S.f.ph === 'morning') { S.f.m_turf = true; return S.narr('崖顶的草皮被整片掀掉了，露出底下黑色的泥。\n这里离海面，有两百多英尺。'); }
            await S.narr('崖顶的草被海风压得贴着地长。');
          } }
        ],
        async enter(S, first) {
          mood(S);
          if (first) return arrival(S);
        }
      },
      /* ---------------- 看守的屋子 ---------------- */
      house: {
        amb: 'room', dark: .55, wall: 'plain', floor: 'stone', floor2: 'wood', plr: 3,
        rows: [
          '##################',
          '##################',
          '#.......#,,,,,,,,#',
          '#.......#,,,,,,,,#',
          '#.......,,,,,,,,,#',
          '#.......#,,,,,,,,#',
          '#.......###,######',
          '#.......#,,,,,,,,#',
          '#.......#,,,,,,,,#',
          '##################'],
        ents: [
          { id: 'fdoor', x: 2, y: 1, spr: 'fdoor', async on(S) {
            const ph = S.f.ph;
            if (ph === 'morning') { S.sfx('open'); return S.go('isle', 13, 8, 0); }
            if (ph === 'storm') return S.narr('门在风里一下一下地顶着门闩，像外面有人在推。');
            if (ph === 'calm') return S.narr('安格斯蹲在门口，堵着门。');
            if (ph === 'night1') return S.narr('门闩插着。外面黑得像墨。');
            if (ph === 'log') return S.narr('先把日志写了。');
            await S.narr('前门。今天就别出去了——灯要紧。');
          } },
          { id: 'hooks', x: 3, y: 1, spr: 'hooks', s: { n: 3 }, async on(S) {
            const f = S.f, n = S.ent('hooks').s.n;
            if (f.ph === 'calm') { f.coats = true; return S.narr('三只挂钩。安格斯和罗里把他们的雨衣穿走了。\n钩子上，只剩你那一件。'); }
            if (f.ph === 'night1' && S.ent('hooks').s.wet) { await S.narr('三件油布雨衣。\n中间那件在往下滴水，地上积了一小摊。帽兜里还兜着一点海水，咸的。'); return S.think('今晚，谁也没出过门。'); }
            if (f.ph === 'storm' && n < 3) return S.narr('罗里的雨衣不见了！');
            await S.narr('三只挂钩，三件油布雨衣，三双水靴。\n下码头才穿它们。');
          } },
          { id: 'kwin', x: 5, y: 1, spr: 'swin', on: S => S.narr(S.ent('kwin').s.storm ? '窗外一片漆黑。雨水在玻璃上横着淌。' : S.ent('kwin').s.calm ? '窗外的海平得发亮。一只鸟也没有。' : '厨房的窗户朝着院子。院墙外面，就是海。') },
          { id: 'wclock', x: 6, y: 1, spr: 'wallclock', on: S => S.narr(S.ent('wclock').s.stop ? '钟停在一点。谁也没去给它上弦。' : '厨房的挂钟，嘀嗒嘀嗒地走。') },
          { id: 'stove', x: 7, y: 2, spr: 'range', light: { r: 2.2, col: 'rgba(255,140,60,.18)', flick: true }, on: S => S.narr(S.f.ph === 'storm' ? '炉子封着火，炉膛里一点暗红。' : '铸铁的炉子，又做饭，又取暖。炉子上坐着一把大铁壶。') },
          { id: 'table', x: 3, y: 4, w: 2, spr: 'table2', col: '#6a4a30', on: S => S.narr('厨房的饭桌。桌面被擦得发白，三把椅子。') },
          { id: 'meal', x: 3, y: 4, w: 2, spr: 'meal', z: 1, solid: false, hidden: true, async on(S) {
            if (S.f.ph === 'day3') return dinner(S);
            await S.narr('饭吃了一半。谁也没心思再吃了。');
          } },
          { id: 'chairA', x: 2, y: 4, spr: 'chair', col: '#5a3c26', on: S => S.narr('安格斯的椅子。') },
          { id: 'chairB', x: 5, y: 4, spr: 'chair', col: '#5a3c26', on: S => S.narr('罗里的椅子，椅背上搭着一条围巾。') },
          { id: 'dresser', x: 1, y: 7, spr: 'dresser', col: '#5a4030', on: S => S.narr('碗柜。蓝边的盘子立成一排，每只都扣着放，防浪大的时候震下来。') },
          { id: 'coal', x: 6, y: 8, spr: 'box', on: S => S.narr('煤箱。补给船每趟都要扛上来半吨煤。') },
          { id: 'angus_h', x: 4, y: 3, spr: '@angus', dir: 0, hidden: true, async on(S) {
            const ph = S.f.ph; S.face('angus_h', 'pl');
            if (ph === 'tour') return S.say('安格斯', '上灯室。日落前得点上。');
            if (ph === 'day3') return S.say('安格斯', '坐下吃饭。');
            if (ph === 'calm') return debate(S);
            if (ph === 'log') return S.say('安格斯', '日志写了没有？');
          } },
          { id: 'rory_h', x: 6, y: 3, spr: '@rory', dir: 1, hidden: true, async on(S) {
            const ph = S.f.ph;
            if (ph === 'storm') return stopRory(S);
            S.face('rory_h', 'pl');
            if (ph === 'tour' || ph === 'lamp') {
              if (S.once('roryTell')) {
                await S.say('罗里', '（压低声音）你知道这座灯塔的事吧？1900 年……');
                await S.say('安格斯', ph === 'tour' ? '罗里。' : '（楼上）罗里！', { style: ph === 'tour' ? '' : 'whisper' });
                return S.say('罗里', '……档案在办公室的柜子里。你自己看。');
              }
              return S.say('罗里', '办公室柜子里。别当着他的面看。');
            }
            if (ph === 'day3') return S.say('罗里', '吃吧。今天的土豆没煎糊。');
            if (ph === 'calm') return S.say('罗里', '（小声）我不想去。可他是首席。');
            if (ph === 'log') return S.say('罗里', '这一页，你来写。');
          } },
          /* 办公室 */
          { id: 'slate', x: 10, y: 1, spr: 'slate', on: S => S.narr(S.f.ph === 'day3' || S.f.ph === 'calm' ? '石板上是安格斯的粉笔字：「15 日。上午九点。风西北转北，减弱。灯已擦净。」' : '石板。白天先把天气记在这上面，晚上再誊进日志本。') },
          { id: 'baro', x: 12, y: 1, spr: 'baro', on: S => S.narr(S.ent('baro').s.lo ? '气压计的指针掉到了「暴风雨」那一格。' : '气压计。指针停在「晴」和「多变」之间。') },
          { id: 'owin', x: 14, y: 1, spr: 'swin', on: S => S.narr(S.f.ph === 'night1' ? '外面黑得像墨。灯塔的光一下一下扫过海面——两闪，过一会儿，又是两闪。\n海很平。一丝风也没有。' : S.ent('owin').s.storm ? '玻璃在窗框里嗡嗡地抖。' : '窗外是院墙和灰色的海。') },
          { id: 'desk', x: 11, y: 2, spr: 'desk', async on(S) {
            const ph = S.f.ph;
            if (ph === 'night1' && !S.f.log1) return writeLog1(S);
            if (ph === 'log') return writeTrue(S);
            if (ph === 'night1') return S.note('flog1');
            await S.narr('写字台上摊着日志本，一行一行，都是看守们工工整整的字。');
          } },
          { id: 'cab', x: 15, y: 2, spr: 'cabinet', col: '#4a3a2a', async on(S) {
            const f = S.f, ph = f.ph;
            const pick = async ids => { const names = ids.map(i => ({ report: '1900 年的调查报告', flog2: '那张纸', flog3: '那张纸' })[i]); const r = ids.length > 1 ? await S.ask('柜子里——', names) : 0; if (ids[r] === 'report') f.rep = true; if (ids[r] === 'flog3') f.f3 = true; return S.note(ids[r]); };
            if (ph === 'day3' || ph === 'calm' || ph === 'log' || ph === 'morning') {
              if (!f.f3 && S.once('f3see')) { await S.narr('那张纸夹在档案上面。\n你把它抽出来——最底下，又多了一行。'); f.f3 = true; return S.note('flog3'); }
              return pick(['report', 'flog3']);
            }
            if (f.f2) return pick(['report', 'flog2']);
            if (S.once('repSee')) await S.narr('柜子最底层，一个硬纸夹子，上面写着「1900 年 12 月」。');
            return pick(['report']);
          } },
          { id: 'stairs', x: 16, y: 2, spr: 'stairsup', solid: false, async touch(S) {
            const ph = S.f.ph;
            if (ph === 'arrive' || ph === 'night1' || ph === 'day3' || ph === 'log') { S.pos(16, 3, 0); return S.narr(ph === 'night1' ? '灯在楼上转着，用不着你。该写日志，然后睡觉。' : ph === 'day3' ? '先吃饭吧。' : ph === 'log' ? '先把日志写了。' : '楼梯通往灯室。'); }
            await S.go('tower', 2, 7, 2);
          } },
          /* 卧室 */
          { id: 'bunk_me', x: 10, y: 7, h: 2, spr: 'bunk', async on(S) {
            if (S.f.ph === 'night1') { if (!S.f.log1) return S.narr('日志还没写。'); return day2(S); }
            if (S.f.ph === 'storm') return S.narr('不能睡。灯在楼上。');
            await S.narr('你的铺位。被子叠得方方正正——安格斯的规矩。');
          } },
          { id: 'bunk_r', x: 13, y: 7, h: 2, spr: 'bunk', col: '#8a3a1a', on: S => S.narr(S.ent('bunk_r').s.occ ? '罗里睡得很沉，嘴里嘟囔着听不清的盖尔语。' : '罗里的铺位。枕头底下压着一本翻烂了的圣经。') },
          { id: 'bunk_a', x: 16, y: 7, h: 2, spr: 'bunk', col: '#b8b4ac', on: S => S.narr(S.ent('bunk_a').s.occ ? '安格斯睡觉也皱着眉头。' : '安格斯的铺位。床头钉着一张褪了色的照片：一个女人，两个孩子。') }
        ],
        async enter(S, first) { mood(S); }
      },
      /* ---------------- 灯室 ---------------- */
      tower: {
        amb: 'wind', dark: .8, wall: 'plain', floor: 'metal', plr: 2.6,
        rows: [
          '#############',
          '#############',
          '#...........#',
          '#...........#',
          '#...........#',
          '#...........#',
          '#...........#',
          '#...........#',
          '#############'],
        ents: [
          { id: 'blinds', x: 2, y: 1, w: 9, spr: 'blinds', on: useBlinds },
          { id: 'gdoor', x: 11, y: 1, spr: 'gdoor', on: useGdoor },
          { id: 'lens', x: 6, y: 4, spr: 'lens', on: async S => { if (S.f.ph === 'dusk') return lightTogether(S); return useLens(S); } },
          { id: 'clock', x: 6, y: 6, spr: 'clock', s: { c: 0 }, on: useClock },
          { id: 'pump', x: 9, y: 4, spr: 'pump', s: { p: 0 }, on: usePump },
          { id: 'spirit', x: 3, y: 4, spr: 'spirit', s: { sand: 1 }, on: useSpirit },
          { id: 'oil', x: 10, y: 7, spr: 'barrel', col: '#6a2a22', on: S => S.narr('煤油桶。一夜要烧掉小半桶。') },
          { id: 'mantles', x: 1, y: 2, spr: 'cabinet', col: '#4a4a52', async on(S) {
            if (S.f.mantle) { S.f.mantle = 0; S.sfx('item'); await S.narr('你从备件柜里取出一只新纱罩，小心翼翼地套在燃烧器上。\n这东西一碰就碎——安格斯在旁边看着，没出声。'); return lampGoal(S); }
            await S.narr('备件柜：纱罩、灯芯剪、擦玻璃的麂皮，叠得整整齐齐。');
          } },
          { id: 'tstairs', x: 1, y: 7, spr: 'stairsdown', solid: false, async touch(S) {
            const ph = S.f.ph;
            if (ph === 'tour' || ph === 'lamp' || ph === 'dusk') { S.pos(2, 7, 2); return S.narr(ph === 'dusk' ? '谁也别下去。' : '灯还没点上。'); }
            await S.go('house', 16, 3, 1);
          } },
          { id: 'angus_t', x: 3, y: 6, spr: '@angus', dir: 2, hidden: true, async on(S) {
            S.face('angus_t', 'pl');
            if (S.f.ph === 'lamp') return S.say('安格斯', lampHint(S));
            if (S.f.ph === 'dusk') return S.say('安格斯', '点灯吧。');
          } },
          { id: 'rory_t', x: 9, y: 6, spr: '@rory', dir: 1, hidden: true, on: S => S.say('罗里', '（他一直盯着西边的窗户）') }
        ],
        async enter(S, first) {
          mood(S); lensLight(S);
          if (S.f.ph === 'tour' && S.once('towerTour')) return towerTour(S);
        }
      }
    }
  });
})();
