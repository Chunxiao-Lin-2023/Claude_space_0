/* ================= 第一夜 · 玛丽的电话 ================= */
(() => {
  /* ---------- 小工具 ---------- */
  const KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'];
  const bx2 = (R, x, y, w, h, fill, edge) => { R(x, y, w, h, edge || shade(fill, -.45)); R(x + 1, y + 1, w - 2, h - 2, fill); };
  const cycle = (S, key, lines) => lines[(S.f[key] = ((S.f[key] ?? -1) + 1) % lines.length)];
  /* 本局的死亡/坏结局记录（不随检查点回滚），重来时给提示 */
  let deathRun = 0, lastBad = null, ringT = 0, creakT = 0, stepT = 0, mbT = 0;

  /* ---------- 合成音效（双方都听得到） ---------- */
  /* 老式电话的「叮铃铃——」：两个音飞快地交替 */
  const ring = (S, v = .05) => { for (let k = 0; k < 2; k++) for (let i = 0; i < 10; i++) S.tone('triangle', i % 2 ? 1480 : 1320, i % 2 ? 1470 : 1312, .055, v, k * .75 + i * .055, 3600); };
  const beep = S => S.tone('sine', 1000, 1000, .55, .07, .05);
  const click = S => S.tone('square', 180, 90, .05, .05, 0, 1200);
  /* 踏切的「当、当、当」 */
  const kankan = (S, n = 6, v = .045, d0 = 0) => { for (let i = 0; i < n; i++) { S.tone('square', 742, 738, .24, v, d0 + i * .62, 1700); S.tone('square', 622, 618, .2, v * .55, d0 + i * .62 + .31, 1700); } };
  /* 八音盒：《玛丽有只小羊羔》。离得越近，调子越往下走 */
  const MEL = [[1318.5, 0], [1174.7, 1], [1046.5, 2], [1174.7, 3], [1318.5, 4], [1318.5, 5], [1318.5, 6], [1174.7, 8], [1174.7, 9], [1174.7, 10], [1318.5, 12], [1568, 13], [1568, 14]];
  const musicBox = (S, v = .03, k = 1, n = MEL.length, gap = .3) => MEL.slice(0, n).forEach(([f, t]) => { S.tone('triangle', f * k, f * k * .997, .55, v, t * gap, 0); S.tone('sine', f * k * 2, f * k * 2, .22, v * .3, t * gap, 0); });
  /* 电话线里的沙沙声 */
  const crackle = (S, v = .012) => { for (let i = 0; i < 6; i++) S.tone('square', 70 + i * 13, 48, .07, v, i * .11 + (i % 3) * .03, 600); };
  /* 秋千链子的「吱呀——」 */
  const creak = (S, v = .02) => { S.tone('sawtooth', 260, 390, .42, v, 0, 900); S.tone('sawtooth', 390, 250, .42, v * .8, .75, 900); };
  const dtmf = (S, s) => [...s].forEach((c, i) => { const d = +c; S.tone('sine', [941, 697, 697, 697, 770, 770, 770, 852, 852, 852][d], 0 + [941, 697, 697, 697, 770, 770, 770, 852, 852, 852][d], .09, .03, i * .12); S.tone('sine', [1336, 1209, 1336, 1477, 1209, 1336, 1477, 1209, 1336, 1477][d], [1336, 1209, 1336, 1477, 1209, 1336, 1477, 1209, 1336, 1477][d], .09, .025, i * .12); });

  /* ================= 电话报位 ================= */
  const CALLS = [
    ['我是玛丽。', '我现在，在垃圾站。'],
    ['我是玛丽。', '我现在，在烟草店的拐角。'],
    ['我是玛丽。我现在在踏切。', '……电车，一辆都没有了呢。'],
    ['我是玛丽。我现在在团地的公园。', '秋千……吱呀，吱呀。'],
    ['我是玛丽。', '我现在，在你家楼下。'],
    ['我是玛丽。', '我现在——在你家门口。'],
    ['我是玛丽。', '我现在——']
  ];
  const GAP = [35, 50, 50, 27, 45, 35];   // 第 i 通挂断后，到下一通响起的秒数（第 4 通后是下楼拿篮子，第 6 通后是最后的站位）
  const outside = S => S.map === 'court' || (S.map === 'apt' && S.pl.y >= 13);
  function arm(S, i) {   // i = 已经打来的通数
    const lab = i <= 1 ? null : i === 6 ? '☎ 最后一通' : '☎ 下一通电话';
    S.timer(GAP[i - 1], lab, ringCall, { during: i === 4 || i === 6 });
  }
  async function ringCall(S) {
    const i = S.f.call || 0;
    if (i === 4 && outside(S)) {
      if (!S.f.runWarn) {   // 第一次：楼下的公用电话响一声，再给几秒
        S.f.runWarn = true; S.ent('booth').s.rg = true; ring(S, .03);
        S.timer(7, '☎ 快回家', ringCall, { during: true });
        S.toast('院子里的公用电话响了一声——快回家！');
        S.after(1200, async S => { S.ent('booth').s.rg = false; });
        return;
      }
      return runDie(S);
    }
    const ph = S.ent('phone'); ph.s.ring = true; S.f.ringing = true; ringT = 0;
    if (S.f.unplug && S.once('unplugRing')) S.toast('……电话线明明拔掉了。');
    S.goal(i === 6 ? '电话响了——最后一通。站好，别回头' : '电话响了（客厅）');
    S.timer(i === 6 ? 4.5 : 9, null, autoPick);
  }
  async function autoPick(S) { return takeCall(S, true); }
  async function takeCall(S, machine) {
    const ph = S.ent('phone'), i = S.f.call || 0; ph.s.ring = false; S.f.ringing = false; S.clearTimer();
    if (i === 6) return finale(S, machine ? 'machine' : 'phone');
    click(S);
    if (machine) {
      ph.s.msg = true;
      await S.narr(S.f.unplug ? '铃声停了。答录机「咔哒」一声，自己转了起来——线明明是拔掉的。' : '铃声停了。答录机「咔哒」一声，自己接了起来。');
      if (S.once('mamaMsg')) await S.say('答录机', '（妈妈的声音）「您好，现在家里没有人。有事请在『哔』声之后留言。」');
      beep(S); await S.wait(700);
    } else if (i === 0) await S.say('绘里', '……喂？');
    crackle(S); musicBox(S, .02, 1 - i * .04, 5 + i, .3 + i * .02);
    await S.say(machine ? '答录机的喇叭里' : '听筒里', CALLS[i], { style: 'whisper' });
    click(S); ph.s.msg = false;
    if (!machine) await S.narr('「嘟——嘟——嘟——」');
    S.f.call = i + 1;
    await AFTER[i](S);
  }
  const AFTER = [
    async S => {   // 1 垃圾站
      await S.think(['……玛丽？', '谁啊，恶作剧吗。', '……可这个号码，今天下午才开通。']);
      S.goal('……回去睡吧。（睡不着的话，可以给妈妈的医院打个电话——号码在冰箱上）');
      arm(S, 1); S.cp('calls');
    },
    async S => {   // 2 烟草店的拐角
      await S.think(['烟草店的拐角……', '垃圾站，烟草店，再往前是踏切，过了踏切就是团地。', '……是下午我走过来的那条路。', '她在走过来。']);
      if (S.f.rumor) await S.think('烟草店的婆婆说过：被扔掉的娃娃，会一通一通地打电话回家。');
      S.goal('下一通电话之前，想想办法（阳台、墙上的电话线、房间里的纸箱……）');
      S.toast('等不及的话：坐到电话旁边，等它响');
      arm(S, 2); S.cp('calls');
    },
    async S => {   // 3 踏切
      kankan(S, 4, .016);
      await S.narr('很远很远的地方，传来「当、当、当」的声音。\n是踏切。最后一班电车，一个钟头以前就过去了。');
      if (S.f.unplug) await S.think('……电话线是拔掉的。它还是打进来了。');
      await S.think(['她过了踏切。', '下一个……就是团地了。']);
      S.goal(S.has('eye') ? '下一通电话之前，再想想：玛丽要的到底是什么？（外婆的信、冰箱上的便条）' : '下一通电话之前，把能找的都找出来（宝物盒、和室里外婆的纸箱、冰箱上的便条）');
      arm(S, 3); S.cp('calls');
    },
    async S => {   // 4 公园 → 下楼拿藤篮
      const sw = S.ent('swing'); sw.s.doll = true; sw.s.sw = true; sw.s.look = false;
      creak(S, .016);
      await S.narr('窗外，楼下的院子里，「吱呀——吱呀——」。\n是秋千。');
      await S.think(['团地的公园……就在楼下。', '……楼下。妈妈说，她把我的小藤篮扔到楼下的垃圾房了。', '那是玛丽的床。']);
      S.goal('趁她还在秋千上，下楼去垃圾房（院子东南角）拿回藤篮——下一通电话前回到家');
      S.toast('出门走玄关，走廊西头是楼梯。不去也可以——只是篮子明早就被收走了。');
      S.cp('run'); arm(S, 4);
    },
    async S => {   // 5 楼下
      const sw = S.ent('swing'); sw.s.doll = false; sw.s.sw = false; S.show('m_ent');
      S.dark(.66); S.sfx('switch');
      await S.narr('客厅的灯，「滋」地闪了一下。');
      await S.think(S.f.gotBasket ? '……楼下。差一点，就在楼下碰上她了。' : '……楼下。');
      S.goal(S.has('basket') ? '把藤篮放回玛丽原来的位置（自己房间的墙角）' : !S.f.tinOpen ? '下一通电话之前，准备好（宝物盒还没打开）' : '下一通电话之前，准备好');
      arm(S, 5); S.cp('calls');
    },
    async S => {   // 6 门口
      S.hide('m_ent'); const mc = S.ent('m_cor'); S.show('m_cor'); mc.dir = 3; mc.alpha = 1;
      S.ent('lampA').off = true; S.ent('lampB').flicker = true;
      S.focus(11, 13); await S.wait(500);
      S.sfx('knock'); await S.wait(520); S.sfx('knock'); await S.wait(520); S.sfx('knock');
      await S.narr('咚。咚。咚。\n有人在敲门。敲得很低——就在门板的最下面，像是一个只有腰那么高的人。');
      S.focus(null);
      S.dark(.9); S.plr(2.4); S.sfx('switch');
      await S.narr('屋里的灯，全灭了。');
      await S.think('……下一通，就是最后一通了。');
      if (S.f.rumor) await S.think('烟草店的婆婆说过：「听见那句话，千万别回头。」\n「也有人说，背贴着墙站，它就绕不到你后头去。」');
      if (S.f.card) await S.think('外婆的卡片上写着：「别回头看她。把手伸到背后去，把她丢掉的东西还给她。」');
      if (!S.f.tinOpen) await S.think('……玛丽的眼睛，还锁在宝物盒里。');
      else if (S.has('basket')) await S.think('藤篮还在我手里。');
      S.goal('最后一通电话之前，选好你等她的地方。千万别回头' + (S.coop ? '（联机：一人翻「笺」看外婆的卡片，一人站位）' : ''));
      S.toast('轻点方向键：只转身，不迈步');
      S.cp('final'); arm(S, 6);
    }
  ];

  /* ================= 最后一通 ================= */
  async function finale(S, how) {
    S.clearTimer(); const ph = S.ent('phone'); ph.s.ring = false; S.f.ringing = false;
    S.hide('m_cor');
    if (how === 'machine') { click(S); await S.narr('铃声停了。客厅里，答录机「咔哒」一声。'); beep(S); await S.wait(600); crackle(S); await S.say('答录机的喇叭里', CALLS[6], { style: 'whisper' }); }
    else if (how === 'phone') { click(S); crackle(S); await S.say('听筒里', CALLS[6], { style: 'whisper' }); }
    else { await S.narr('身后的客厅里，电话响了。\n响了两声，答录机「咔哒」一声接了起来。'); beep(S); await S.wait(600); crackle(S); await S.say('答录机的喇叭里', CALLS[6], { style: 'whisper' }); }
    S.amb('none'); musicBox(S, .02, .78, 7, .44);
    await S.wait(900);
    const p = S.pl, d = DIRS[p.dir], bx = p.x - d[0], by = p.y - d[1], m = W.maps[S.map];
    if (!passable(m, bx, by, W.pl)) return wallEnd(S, tileSolid(m, bx, by));
    S.sfx('heart');
    await S.say('', '「……在你身后。」', { style: 'whisper' });
    const mz = S.ent('m_apt'); S.place('m_apt', bx, by, p.dir); mz.s.eyes = 1; mz.alpha = 0;
    await S.alpha('m_apt', 1, 700);
    S.sfx('heart');
    await S.narr('后颈一凉。\n有什么东西，就站在你身后——很矮，大概只到你的腰。');
    for (let round = 0; ; round++) {
      const opts = ['回头', '不回头，一动不动']; if (S.has('eye')) opts.push('不回头，把玻璃眼珠递到身后');
      const r = await S.ask(round === 0 ? '……' : '她还在你身后。', opts);
      if (r === 0) return turnEnd(S);
      if (r === 2) return giveEye(S);
      if (round === 0) { crackle(S); await S.say('身后', '……为什么不看我？', { style: 'whisper' }); }
      else if (round === 1) { S.sfx('heart'); S.shake(300, 1); await S.narr('一只很小、很凉的手，搭上了你的肩膀。'); await S.say('身后', '看看我呀，绘里。', { style: 'whisper' }); }
      else return behindEnd(S, 'still');
    }
  }
  async function turnEnd(S) {
    lastBad = 'turn';
    await S.narr('你回过头去。');
    const p = S.pl; S.turn([3, 2, 1, 0][p.dir]);
    await S.scare('face', { face: 'merry', dur: 1.3 });
    await S.fade(1, 900);
    await S.end({ bad: true, id: 'turn', title: '回头', text: '第二天早上七点，妈妈下了夜班回家。\n门链还挂着。屋里的灯全开着。\n绘里不在。\n\n客厅里，答录机的红灯一闪一闪，磁带里多了一段很短的留言。\n是绘里的声音：\n「我是绘里。我现在……」\n\n后面的话，被沙沙的杂音盖住了。' });
  }
  async function wallEnd(S, isWall) {
    lastBad = 'wall';
    await S.say('', '「……在你身后。」', { style: 'whisper' });
    S.sfx('heart');
    await S.narr(isWall ? '你的后背死死贴着冰凉的墙。\n什么也没有碰到你。' : '你的后背死死抵着身后的柜子。\n什么也没有碰到你。');
    await S.wait(1200); crackle(S);
    await S.say(isWall ? '墙里' : '柜子后面', isWall ? '……你身后，是墙呢。' : '……你身后，没有地方呢。', { style: 'whisper' });
    ring(S, .04); await S.wait(600);
    await S.narr('电话又响了。答录机又转了起来。\n「我是玛丽。我现在，在你身后。」\n「我是玛丽。我现在，在你身后。」\n「我是玛丽……」');
    await S.narr(isWall ? '你一动不动地贴着墙，一直站到窗帘缝里透进灰白的光。' : '你一动不动地抵着柜子，一直站到窗帘缝里透进灰白的光。');
    await S.fade(1, 1200);
    await S.end({ bad: true, id: 'wall', title: '背贴着墙', text: '早上七点，妈妈回来的时候，绘里还贴着墙站着，腿已经站麻了。\n门外的走廊上，坐着一个金头发的洋娃娃。\n妈妈什么也没说，把它装进塑料袋，又拿去扔了。\n\n从那以后，每天夜里两点，家里的电话都会响一次。\n答录机里永远是同一句话。\n\n绘里睡觉的时候，总是背贴着墙。\n她再也没有让任何东西，站到过她身后。' + (S.f.calledMom ? '\n\n护士说，你半夜打过电话来。妈妈后来再也没有值过夜班。' : '') });
  }
  async function behindEnd(S, kind) {
    lastBad = kind === 'nobed' ? 'nobed' : 'behind';
    if (kind === 'still') await S.narr('你咬着牙，一直没有回头。\n那只手在你肩膀上搭了很久，很久。');
    await S.fade(1, 1200);
    await S.end({ bad: true, id: 'behind', title: '一直在身后', text: (kind === 'nobed' ? '她把眼睛装了回去。可是这个家里，没有她睡觉的地方。\n「那我就，一直待在你身后吧。」\n\n' : '') + '从那天起，绘里再也没有回过头。\n走路的时候，身后总有一串很轻很轻的脚步，和她一样快；她停下，它也停下。\n有人在背后叫她，她就转过整个身子去看——先转脚，再转肩膀，慢慢地。\n\n妈妈问她怎么了，她只是说：\n「玛丽在我后面。她在等我回头。」' });
  }
  async function giveEye(S) {
    S.take('eye');
    await S.narr('你没有回头。\n你把攥着玻璃眼珠的手，慢慢伸到背后，摊开手心。');
    await S.wait(900);
    await S.narr('一根很小、很凉的手指，从你手心里，把它拿走了。');
    S.ent('m_apt').s.eyes = 2; crackle(S);
    await S.say('身后', '……谢谢。', { style: 'whisper' });
    const r = await S.ask('', ['「对不起，玛丽。」', '「欢迎回家，玛丽。」']);
    await S.say('绘里', r === 0 ? ['对不起，玛丽。把你扔掉了。', '……欢迎回家。'] : ['欢迎回家，玛丽。', '……对不起，把你扔掉了。']);
    if (!S.f.basketSet) { crackle(S); await S.say('身后', ['……可是，我的床呢？', '没有床的话……我就一直待在你身后吧。'], { style: 'whisper' }); return behindEnd(S, 'nobed'); }
    await S.say('身后', '……我的床，还在。', { style: 'whisper' });
    await S.narr('很轻很轻的脚步声，从你身边走过去了。');
    S.focus(6, 4);
    await S.walk('m_apt', [6, 5], 2.2);
    S.place('m_apt', 6, 5, 3);   // 被挡住时兜底
    await S.alpha('m_apt', 0, 500);
    S.ent('bspot').s.doll = true; S.sfx('chime');
    musicBox(S, .03, 1, 13, .34);
    S.fx('face', { face: 'merryK', dur: 2.6 });
    await S.wait(2600);
    S.focus(null); S.dark(.45); S.plr(null);
    await S.narr('墙角那只小藤篮里，传来一声很轻很轻的——\n「晚安。」');
    await S.fade(1, 1400);
    await S.card('', '早上七点', '');
    await S.end({ id: 'home', title: '第一夜　完', text: '妈妈下了夜班回家。\n绘里的房间里，墙角摆着那只小藤篮。玛丽躺在里面，金色的卷发理得整整齐齐——两只眼睛，都是蓝的。\n\n妈妈在门口站了很久，最后只说了一句：\n「……外婆说过，她会自己找回家的。」\n\n那以后，家里的电话再也没有在半夜响过。\n每年五月十二日，绘里会做一个小小的蛋糕——给妈妈，也给玛丽。' + (S.f.bye ? '\n\n（那天在垃圾站，你跟她说了「再见」。所以她一直知道，你会等她回来。）' : '\n\n（那天在垃圾站，你连一声「再见」都没有说。她还是回来了。）') + (S.f.calledMom ? '\n\n护士跟妈妈说，你半夜打过电话来。那以后，妈妈值夜班的晚上，十一点会先往家里打一个电话——铃响两声就挂，这是你们的暗号。' : '') });
  }
  async function runDie(S) {
    deathRun++;
    S.ent('booth').s.rg = true; ring(S, .05);
    await S.narr('院子里那台公用电话，又响了起来。\n一声，两声。你没有接。');
    crackle(S);
    await S.scare('face', { face: 'merry', dur: 1.1 });
    S.ent('booth').s.rg = false;
    await S.die('可那个声音，还是贴着你的耳朵响了起来：\n「我是玛丽。我现在——在你身后。」', '没赶回家');
  }

  /* ================= 第一幕：搬家那天 ================= */
  async function tboxOn(S) {
    const b = S.ent('tbox');
    if (S.f.gotDoll) return S.narr('箱子里只剩旧挂历、断了腿的台灯，和一只停了的闹钟。');
    await S.narr('纸箱里塞着旧挂历、断了腿的台灯、一只停了的闹钟。\n最上面，坐着一个洋娃娃。');
    await S.narr('金色的卷发，蓝色天鹅绒的裙子，白花边领子。\n瓷做的脸上，左眼的位置是一个黑黑的小洞——那颗玻璃眼珠，很多年前就掉了。\n裙子里缝着一块布标：「Merry　1968　YOKOHAMA」。');
    await S.think('……玛丽。');
    b.s.doll = false; S.give('merry'); S.f.gotDoll = true;
    S.face('mama', 'pl');
    await S.say('妈妈', ['那个娃娃就别带了吧。', '外婆的东西我已经收了一整箱。新家就两间半屋子，你都要上初二了……', '而且你看她，眼睛都掉了一只。']);
    const r = await S.ask('', ['「……嗯。我拿去扔。」', '「我想留着她。」']);
    if (r === 1) { await S.say('妈妈', '你上一次抱她，是什么时候？'); await S.think('……想不起来了。'); }
    await S.say('妈妈', ['扔之前，好好跟她说声再见。外婆以前老这么说。', '垃圾站就在前面路边。我在车上等你。']);
    S.goal('把玛丽放到前面路边的垃圾站');
  }
  async function mamaOn(S) {
    S.face('mama', 'pl');
    if (!S.f.gotDoll) return S.say('妈妈', '门口那个纸箱，你看看还有没有要留的。');
    return S.say('妈妈', '垃圾站就在前面。去吧，好好道个别。');
  }
  async function gomiOn(S) {
    const g = S.ent('gomi');
    if (!S.f.gotDoll) return S.narr('街坊的垃圾站。绿色的网子底下堆着几袋垃圾，几只乌鸦在电线上等着。');
    if (S.f.dropped) return S.narr(S.f.bye ? '玛丽靠着网子坐着，脸朝着马路。' + (g.s.turn ? '\n……不对。她的脸，朝着你这边。' : '') : '网眼里钻出来一绺金色的卷发。' + (g.s.turn ? '\n……那绺头发底下，有一只蓝眼睛在看你。' : ''));
    await S.narr('绿色的网子底下堆着几袋垃圾。牌子上写着：「可燃垃圾　周一·周四」。');
    const r = await S.ask('玛丽。', ['让她坐好，跟她说再见', '把她塞进网子底下']);
    S.take('merry'); g.s.doll = true; g.s.net = r === 1; S.f.dropped = true; S.f.bye = r === 0;
    if (r === 0) { await S.narr('你让她靠着网子坐好，替她理了理卷发。'); await S.say('绘里', '……再见，玛丽。'); await S.narr('她那只蓝色的玻璃眼睛，在夕阳底下亮了一下。'); }
    else await S.narr('你掀开网子，把她塞进两只垃圾袋中间，没有再看第二眼。\n一绺金色的卷发，从网眼里钻了出来。');
    S.face('mama', 'pl');
    await S.say('妈妈', ['我先开车过去，等搬家公司的人。', '你顺着这条路往东走，过了踏切就是团地。五号栋，五楼。']);
    S.focus(7, 3);
    await S.walk('mama', [6, 2], 3); S.hide('mama'); S.sfx('close'); S.sfx('car');
    await S.walk('truck', 'r'.repeat(30), 6); S.hide('truck');
    S.focus(null);
    S.goal('走路去新家（顺着这条路往东，过了踏切就是团地）');
  }
  async function tabakoOn(S) {
    if (S.once('baaHi')) await S.say('烟草店的婆婆', ['哟，是新搬到团地去的孩子吧？', '一个人走啊。天快黑了。']);
    if (!S.f.dropped) return S.say('烟草店的婆婆', S.f.gotDoll ? '抱着个洋娃娃呢……旧了？要扔？\n扔东西的时候，记得说声谢谢。' : '……路上慢点。');
    if (S.f.rumor) return S.say('烟草店的婆婆', cycle(S, '_baa', ['最后那一通……千万别回头。', '用了好多年的东西，是有心的。', '团地那边晚上黑，走路当心。']));
    await S.say('烟草店的婆婆', ['刚才看见你在垃圾站那儿，放了个洋娃娃。', '旧东西，扔之前要好好谢谢它。用了好多年的东西，是有心的。']);
    const r = await S.ask('', ['「有心的话，会怎么样？」', '「婆婆，你信这个？」', '（点点头走开）']);
    if (r === 2) return;
    S.f.rumor = true;
    await S.say('烟草店的婆婆', ['这一带以前有个说法——被扔掉的娃娃，会自己打电话回家。', '一通一通地打，一次比一次近：「我现在在哪儿哪儿……」', '最后那一通，说的是「我现在在你身后」。', '……听见那句话，千万别回头。']);
    await S.say('烟草店的婆婆', ['也有人说，背贴着墙站，它就绕不到你后头去。', '谁知道呢。老辈人吓唬小孩的话。']);
  }
  async function trainEvent(S) {
    S.f.trainDone = true;
    const sW = S.ent('sigW'), sE = S.ent('sigE'), gW = S.ent('gateW'), gE = S.ent('gateE');
    sW.s.bl = sE.s.bl = true; kankan(S, 9, .045);
    S.focus(24, 4);
    await S.narr('「当、当、当、当——」\n踏切的警报响了。红灯一左一右地闪，黄黑相间的栏杆慢慢放了下来。');
    gW.s.dn = gE.s.dn = true;
    S.place('train', 24, -8, 0); S.sfx('car');
    await S.walk('train', 'd'.repeat(20), 11);
    S.hide('train');
    gW.s.dn = gE.s.dn = false; sW.s.bl = sE.s.bl = false;
    S.focus(null);
    await S.narr('电车开过去了。车窗里黄黄的灯一格一格地晃过去，每一格里都坐满了下班的人。');
    await S.think('以后，这条路就是回家的路了。');
  }
  async function entrOn(S) {
    if (!S.f.night) {
      await S.narr('五号栋的楼梯口贴着一张纸：「503 新住户　搬家期间多有打扰」——是妈妈的字。');
      await S.fade(1, 500);
      await S.card('', '晚上九点', '搬家公司的人走了。纸箱堆得到处都是。\n妈妈接了一个电话，放下听筒，开始换衣服。');
      S.f.night = true; S.dark(.86, 'court'); S.ent('swing').s.sw = false;
      return S.go('apt', 11, 9, 0);
    }
    if (S.f.call === 4) { S.sfx('step'); return S.go('apt', 2, 14, 2, { ms: 150 }); }
    return S.narr('五号栋的楼梯口。');
  }

  /* ================= 第二幕：新家的夜 ================= */
  const boxOn = k => async S => {
    const b = S.ent('box' + k);
    if (b.open) return S.narr(k === 'A' ? '衣服都拿出来了。箱子底还压着玛丽那件小裙子。' : k === 'B' ? '课本和漫画摞在地上。' : '空纸箱。');
    b.open = true; S.sfx('paper');
    if (k === 'A') await S.narr(['校服、毛衣、袜子……', '最底下压着一件巴掌大的蓝色天鹅绒小裙子。是玛丽的备用裙子——外婆缝的。', '你把它塞回了箱子底。']);
    if (k === 'B') { await S.narr('课本、漫画、一盒没用完的蜡笔……\n还有一个铁皮饼干盒。小学时候的宝物盒。'); S.show('tin'); await S.narr('盒盖上挂着一把四位数的小密码锁。你把它放在了地上。'); }
    if (k === 'C') { await S.narr('被子和枕头。你把被子铺在了墙边。'); S.show('futon'); }
    const n = ['A', 'B', 'C'].filter(x => S.ent('box' + x).open).length;
    S.goal(n < 3 ? '收拾自己的房间（纸箱 ' + n + '/3）' : '钻进被子，睡觉');
  };
  async function futonOn(S) {
    if (S.f.call >= 1) return S.narr('……这种时候，怎么可能睡得着。');
    const n = ['A', 'B', 'C'].filter(x => S.ent('box' + x).open).length;
    if (n < 3) return S.narr('先把纸箱收拾完吧。');
    if (S.f.slept) return;
    S.f.slept = true; S.f.call = 0;
    await S.narr('你钻进被子。新房子的天花板白得发亮，有一股油漆味。');
    await S.fade(1, 800);
    await S.card('', '深夜十一点', '迷迷糊糊快要睡着的时候——');
    S.dark(.6);
    await S.fade(0, 400);
    await ringCall(S);
  }
  async function tinOn(S) {
    const t = S.ent('tin');
    if (S.f.tinOpen) return S.narr('宝物盒里只剩一张小照片：五岁的你抱着玛丽，两个人都在笑。');
    await S.narr('铁皮饼干盒，盖子上画满了蜡笔小花。贴纸上是小学时候的字：\n「密码＝玛丽来我们家的那一天（月月日日）」');
    const v = await S.keypad('宝物盒的密码锁　·　四位（月月日日）\n联机时：一人翻「笺」里的信和单子，一人拨', KEYS, 4);
    if (v == null) return;
    if (v !== '0512') {
      S.sfx('locked');
      const n = S.f.tinTry = (S.f.tinTry || 0) + 1;
      if (W.timer && S.f.call >= 1 && S.f.call !== 4 && S.f.call !== 6) { S.timerAdd(-4); S.toast('手抖得厉害……时间又过去了一会儿'); }
      if (v === '0109') return S.narr('锁没开。\n……0109 是你自己的生日。要的是玛丽来家的那一天。');
      if (v === '1968') return S.narr('锁没开。\n1968 是布标上的年份。锁要的是「月月日日」。');
      if (n < 2) return S.narr('锁没开。\n玛丽是哪一天来我们家的？');
      if (n < 3) return S.narr('锁没开。\n' + (S.f.n_letter ? '外婆的信里写着：玛丽是妈妈过六岁生日那天来的。' : '玛丽是哪天来的……外婆应该知道。妈妈把外婆的东西收在和室的纸箱里。'));
      if (n < 4) return S.narr('锁没开。\n' + (S.f.n_form ? '妈妈的生日……茶几上那张转入届上写着。' : '妈妈的生日写在哪儿……今天办迁入手续的单子，好像放在客厅茶几上。'));
      return S.narr('锁没开。\n转入届上写着：妈妈，昭和37年5月12日生。\n月月日日——0、5、1、2。');
    }
    S.f.tinOpen = true; S.sfx('open'); t.open = true;
    await S.narr('「咔哒」。\n盒子里有一颗蓝色的玻璃眼珠、一张小照片，还有一张画着小兔子的卡片。');
    S.give('eye');
    await S.note('card'); S.f.card = true;
    await S.think('……玛丽的眼睛。');
  }
  async function phoneOn(S) {
    const ph = S.ent('phone');
    if (ph.s.ring) return takeCall(S, false);
    if (!S.f.slept) return S.narr('黑色的按键电话，旁边接着一台答录机。\n妈妈说，夜班的时候有人找，就让它录下来。');
    if (S.f.call >= 7) return;
    const r = await S.ask('电话。答录机的红灯' + (S.f.unplug ? '还亮着——线明明拔了。' : '安安静静的。'), ['给妈妈的医院打电话', '（坐在电话旁边，等它响）', '算了']);
    if (r === 0) return dialHospital(S);
    if (r === 1) {
      if (!W.timer) return;
      await S.narr(S.f.call === 4 ? '你不打算下楼了。\n你抱着膝盖坐在电话旁边，听着窗外的秋千。' : S.f.call === 6 ? '你在电话前面坐好，盯着那盏红灯。' : '你抱着膝盖坐在电话旁边，盯着它。\n挂钟的秒针，走得特别响。');
      S.timerAdd(-999);
    }
  }
  async function dialHospital(S) {
    if (S.f.unplug) return S.narr('听筒里一点声音也没有。\n……线是你自己拔掉的。');
    if (!S.f.n_memo) return S.think('医院的号码……妈妈说贴在冰箱上了。');
    const v = await S.keypad('拨号（六位）', KEYS, 6);
    if (v == null) return;
    dtmf(S, v); await S.wait(900);
    if (v !== '234510') { for (let i = 0; i < 3; i++) S.tone('sine', 400, 400, .25, .04, i * .5); return S.say('听筒里', '「您拨打的号码是空号……」'); }
    if (S.f.calledMom) return S.say('护士', '……你妈妈还在手术室。等她出来，我一定让她给你回电话，好吗？');
    S.f.calledMom = true;
    await S.say('护士', ['市立医院夜间值班室。……哦，你是她女儿？', '你妈妈刚进手术室，急诊，一时半会儿出不来。']);
    const r = await S.ask('', ['「有人一直打电话来……」', '「……没事。」']);
    if (r === 0) await S.say('护士', ['恶作剧电话？那就别接了，把电话线拔了。', '门锁好，早点睡，啊。']);
    else await S.say('护士', '那就好。门锁好，早点睡。');
  }
  async function jackOn(S) {
    const j = S.ent('jack');
    if (!S.f.slept || S.f.call < 1) return S.narr('墙上的电话插口。灰色的电话线插得好好的。');
    if (S.f.unplug) {
      if (await S.ask('插口空着。拔下来的电话线软软地垂在地上。', ['插回去', '算了']) === 1) return;
      S.f.unplug = false; j.s.unp = false; click(S); return S.narr('你把电话线插了回去。');
    }
    if (await S.ask('灰色的电话线插在墙上的插口里。', ['拔掉', '算了']) === 1) return;
    S.f.unplug = true; j.s.unp = true; click(S);
    await S.narr('「啪嗒」。你把电话线从墙上拔了下来。');
    await S.think('……这下总打不进来了吧。');
  }
  async function bspotOn(S) {
    const b = S.ent('bspot');
    if (S.f.basketSet) return S.narr('墙角的小藤篮。……空着。');
    if (S.has('basket')) {
      S.take('basket'); S.f.basketSet = true; b.s.bk = true; S.sfx('item');
      await S.narr('你把小藤篮放在墙角。\n在旧家，玛丽一直待在这样的角落里——晚上被放进篮子，听一声「晚安」。');
      S.goal(S.has('eye') ? '等下一通电话。别回头' : !S.f.tinOpen ? '下一通电话之前，打开宝物盒' : '等下一通电话。');
      return;
    }
    return S.narr('房间的这个角落空着。\n在旧家，这个位置一直放着玛丽的小藤篮。');
  }
  async function doorIn(S) {
    const c = S.f.call;
    if (c < 4) return S.narr(['门链挂着。猫眼外面是走廊的灯。', '妈妈说了，谁敲门都别开。……这么晚了，你也不想出去。']);
    if (c === 4) {
      if (S.f.gotBasket) return S.narr('篮子已经拿回来了。……不出去了。');
      const dr = S.ent('door503'); dr.open = true; S.sfx('open'); await S.fade(1, 160); S.pos(11, 14, 1); await S.fade(0, 160); dr.open = false; S.sfx('close');
      if (S.once('outCor')) S.toast('走廊西头是楼梯');
      return;
    }
    if (c === 5) return S.narr(['你把手放在门把上——', '门外的楼梯间里，有很轻很轻的脚步声。\n一级。一级。往上走。', '……你把手缩了回来。']);
    if (c === 6 && !S.f.ringing) {
      const r = await S.ask('门外有人。', ['从猫眼往外看', '打开门', '算了']);
      if (r === 2) return;
      if (r === 0) {
        await S.narr('你踮起脚，凑到猫眼上。\n走廊的灯一闪一闪……外面一个人也没有。');
        S.sfx('heart');
        return S.narr('……可门缝底下透进来的那一线灯光里，有一小块影子。\n它站得太矮了。猫眼里，看不见。');
      }
      S.turn(0); S.sfx('open');   // 开门的人一定是面朝着门的：身后是屋里
      await S.narr('你拧开门锁，拉开了门。\n门链「哐」地绷直——走廊里空荡荡的，什么都没有。');
      return finale(S, 'door');
    }
    return S.narr('门链挂着。');
  }
  async function doorOut(S) {
    const dr = S.ent('door503'); dr.open = true; S.sfx('open'); await S.fade(1, 160); S.pos(11, 12, 3); await S.fade(0, 160); dr.open = false; S.sfx('close');
    if (S.f.gotBasket && S.once('home')) S.toast('……到家了');
  }
  async function stairsDown(S) {
    if (S.f.call !== 4) { S.pos(2, 14, 2); return S.narr('……不能下去。'); }
    S.sfx('step');
    await S.go('court', 4, 2, 0, { ms: 150 });
  }
  const cageOn = k => async S => {
    const c = S.ent('cage' + k), run = S.f.call === 4;
    const miss = k !== 3 && run && !S.f.gotBasket ? '\n……不是这个。妈妈扔的是大件——黄牌子的那个。' : '';
    if (miss) { S.timerAdd(-2); S.sfx('locked'); }
    if (k === 1) return S.narr('红牌子：「可燃垃圾」。几袋垃圾，一股馊味。' + miss);
    if (k === 2) return S.narr('蓝牌子：「不燃垃圾」。空罐头、碎碗片。' + miss);
    if (!run || S.f.gotBasket) return S.narr(c.s.bk ? '黄牌子：「大件垃圾」。旧窗帘、断了脖子的台灯……' : '黄牌子：「大件垃圾」。一张缺腿的椅子，一捆旧杂志。明早收。');
    c.s.bk = false; S.give('basket'); S.f.gotBasket = true;
    const sw = S.ent('swing'); sw.s.doll = false; sw.s.sw = true; sw.s.look = false;
    S.sfx('heart');
    await S.narr('旧窗帘底下，压着一只小小的藤篮。');
    S.toast('秋千上……空了。');
    S.goal('快回家！（五号栋楼梯口 → 五楼）');
  };
  async function viewOn(S) {
    const c = S.f.call;
    if (!S.f.slept) return S.narr('五楼的风有点冷。楼下是团地的院子和小公园。\n再远一点，看得见踏切的红灯，和那条街上零零星星的路灯。');
    if (c === 1) return S.narr('远处街口，垃圾站那盏路灯还亮着。\n太远了，看不清网子底下还有没有东西。');
    if (c === 2) return S.narr('烟草店早就关门了，只有门口那台自动售货机还亮着。\n售货机的光里，好像有一个很小的影子，一晃就过去了。');
    if (c === 3) { kankan(S, 3, .014); return S.narr('踏切的红灯在闪。「当、当、当……」\n没有电车。栏杆却是放下来的。'); }
    if (c === 4) { creak(S, .02); S.sfx('heart'); return S.narr('楼下公园的秋千，在自己晃。\n秋千上坐着一个很小的东西。路灯一照，金色的头发亮了一下。'); }
    if (c === 5) {
      if (!S.once('lookDown')) return S.narr('……你不敢再往下看了。');
      await S.narr('你往下看了一眼。\n五号栋的楼门口，路灯底下，站着一个只有膝盖那么高的影子。');
      S.fx('red'); S.sfx('heart');
      return S.narr('它仰着头。\n……它在看五楼。');
    }
    return S.narr('你不敢再往外看了。');
  }

  /* ================= 画：玛丽 ================= */
  function doll(R, o, X = 0, Y = 0) {   // 16×16 格内的洋娃娃；o.dir 3 = 背影；o.eyes 2 = 两只眼睛都在；o.look = 转过头
    const r = (a, b, w, h, c) => R(X + a, Y + b, w, h, c);
    const H = '#e4be4c', H2 = '#a8822a', HL = '#fff2a8', SK = '#f7eee6', D = '#2c46a8', D2 = '#1c2e74', L = '#f4f0e6';
    r(3, 14, 10, 2, 'rgba(0,0,0,.3)');
    r(4, 9, 8, 5, D); r(3, 11, 10, 3, D); r(3, 13, 10, 1, D2); r(11, 9, 1, 5, D2);
    if (o.dir !== 3) { r(6, 9, 4, 1, L); r(7, 10, 2, 1, L); }
    r(5, 14, 2, 1, '#3a2418'); r(9, 14, 2, 1, '#3a2418');
    r(4, 2, 8, 7, H); r(3, 3, 1, 8, H); r(12, 3, 1, 8, H); r(3, 10, 2, 2, H2); r(11, 10, 2, 2, H2); r(5, 2, 3, 1, HL);
    r(4, 1, 2, 2, D); r(10, 1, 2, 2, D);
    if (o.dir === 3) { r(4, 3, 8, 7, H); r(5, 9, 6, 1, H2); r(7, 3, 2, 6, H2); r(6, 2, 4, 1, D); return; }
    const lx = o.look ? 1 : 0;
    r(5, 4, 6, 5, SK); r(5, 3, 6, 1, H);
    r(6 + lx, 5, 1, 1, o.eyes === 2 ? '#3a6ad8' : '#000'); r(9 + lx, 5, 1, 1, '#3a6ad8');
    r(5, 6, 1, 1, '#f0a6b0'); r(10, 6, 1, 1, '#f0a6b0'); r(7 + lx, 7, 2, 1, '#c22a3e');
    if (o.eyes !== 2) r(6 + lx, 6, 1, 1, 'rgba(60,10,20,.7)');
  }
  /* 32×32 惊吓大头像：金色卷发、瓷白的脸、一只蓝色玻璃眼和一个黑洞洞的眼窝；裂纹、往下淌的黑泪、慢慢咧开的小嘴 */
  function merryFace(R, a, good) {
    const H = '#e4be4c', H2 = '#a8822a', HL = '#fff2a8', SK = '#f7eee6', SK2 = '#dccfc4', SK3 = '#9a8a80', K = '#000', BL = '#3a6ad8', BL2 = '#1c3a90', D = '#2c46a8', L = '#f4f0e6';
    R(7, 1, 18, 4, H); R(5, 3, 22, 4, H); R(4, 6, 24, 6, H); R(3, 10, 5, 15, H); R(24, 10, 5, 15, H);
    R(2, 21, 5, 5, H2); R(25, 21, 5, 5, H2); R(3, 15, 2, 4, H2); R(27, 15, 2, 4, H2); R(4, 25, 3, 3, H); R(25, 25, 3, 3, H); R(3, 18, 1, 3, HL); R(28, 18, 1, 3, HL);
    R(9, 2, 6, 1, HL); R(6, 5, 3, 1, HL); R(22, 5, 3, 1, HL);
    R(4, 0, 6, 4, D); R(22, 0, 6, 4, D); R(9, 1, 2, 2, BL2); R(21, 1, 2, 2, BL2);
    R(4, 28, 24, 4, D); R(8, 26, 16, 3, L); R(10, 28, 12, 1, L); R(15, 26, 2, 1, '#c8c0b0');
    R(9, 7, 14, 1, SK); R(8, 8, 16, 12, SK); R(9, 20, 14, 2, SK); R(10, 22, 12, 2, SK); R(12, 24, 8, 1, SK);
    R(21, 9, 3, 11, SK2); R(19, 22, 3, 2, SK2);
    R(8, 7, 16, 2, H); R(8, 9, 3, 1, H); R(14, 9, 3, 1, H); R(21, 9, 3, 1, H);
    // 画面右边：蓝色玻璃眼，睫毛，高光
    R(18, 11, 5, 4, '#fff'); R(19, 11, 3, 4, BL); R(20, 12, 1, 2, BL2); R(19, 11, 1, 1, '#e8f0ff'); R(17, 10, 7, 1, '#2a1a14'); R(17, 9, 1, 1, '#2a1a14'); R(23, 9, 1, 1, '#2a1a14');
    if (good) { R(9, 11, 5, 4, '#fff'); R(10, 11, 3, 4, BL); R(11, 12, 1, 2, BL2); R(10, 11, 1, 1, '#e8f0ff'); R(8, 10, 7, 1, '#2a1a14'); }
    else {
      R(9, 10, 6, 5, K); R(8, 11, 1, 3, SK3); R(15, 11, 1, 3, SK3);
      R(8, 9, 1, 1, SK3); R(7, 8, 1, 1, SK3); R(6, 7, 1, 1, SK3); R(15, 15, 1, 2, SK3); R(16, 17, 1, 2, SK3); R(17, 19, 1, 1, SK3);
      R(11, 15, 2, 2 + Math.round(a * 7), '#2a0610'); R(12, 17, 1, Math.round(a * 6), '#4a0a16');
      if (a > .35) R(11, 12, 1, 1, '#ff3030');
    }
    R(9, 17, 3, 1, '#f0a0aa'); R(20, 17, 3, 1, '#f0a0aa');
    R(15, 17, 2, 1, SK2);
    if (good) { R(14, 20, 4, 1, '#c22a3e'); R(13, 19, 1, 1, '#c22a3e'); R(18, 19, 1, 1, '#c22a3e'); }
    else {
      const mw = 3 + Math.round(a * 6), mh = Math.round(a * 3), mx = 16 - Math.ceil(mw / 2);
      R(mx, 20, mw, 1, '#c22a3e');
      if (mh) { R(mx, 21, mw, mh, '#1a0408'); for (let i = 0; i < mw; i += 2) R(mx + i, 21, 1, 1, '#e8e0d0'); R(mx - 1, 19, 1, 1, '#c22a3e'); R(mx + mw, 19, 1, 1, '#c22a3e'); }
    }
  }

  defChapter({
    id: 'merry', n: 1, title: '玛丽的电话', sub: '搬家那天，你扔掉了旧洋娃娃玛丽。夜里电话响了：「我是玛丽，我现在在垃圾站。」', origin: '日本都市传说', color: '#2a3460',
    icon: '@merryP', iconX: 30, amb: 'room', floor: 'wood', wall: 'plain', dark: .5, plr: 3.4,
    endings: { home: '第一夜　完（欢迎回家）', turn: '回头', wall: '背贴着墙', behind: '一直在身后' },
    faces: {
      merry(R, a) { merryFace(R, a, false); },
      merryK(R, a) { merryFace(R, a, true); }
    },
    people: {
      me: { key: 'mer-me', skin: '#f2cfae', hair: '#2a1c18', hs: 'bob', top: '#c86a7a', top2: '#f0e8e0', bottom: '#3a4a6a', shoes: '#e8e4dc',
        extra(g, d, fr, G, R) { if (d === 0) { R(7, G.tT + 1, 2, 4, '#f0e8e0'); } } },
      mama: { key: 'mer-mama', skin: '#eac4a0', hair: '#241814', hs: 'bun', top: '#8a8f9e', top2: '#5a5f6e', coat: true, bottom: '#2a2a34', shoes: '#3a2a24',
        extra(g, d, fr, G, R) { if (d === 0) { R(5, G.tT + 2, 1, 1, '#c9a35a'); R(10, G.tT + 3, 2, 4, '#4a3a30'); } } },
      merryP: { key: 'mer-p', child: true, skin: '#f7eee6', hair: '#e4be4c', hs: 'long', top: '#2c46a8', top2: '#f4f0e6', dress: true, eye: '#3a6ad8', blush: '#f0a6b0', mouth: '#c22a3e', shoes: '#3a2418',
        extra(g, d, fr, G, R) { R(3, G.hT - 1, 3, 2, '#2c46a8'); R(10, G.hT - 1, 3, 2, '#2c46a8'); if (d === 0) { R(6, G.hT + 4, 1, 2, '#000'); R(2, G.hT + 6, 2, 3, '#a8822a'); R(12, G.hT + 6, 2, 3, '#a8822a'); R(6, G.tT, 4, 1, '#f4f0e6'); } } }
    },
    items: {
      merry: { name: '玛丽', desc: '金色卷发的旧洋娃娃，蓝色天鹅绒裙子。左眼只剩一个黑洞。布标：「Merry　1968　YOKOHAMA」。' },
      eye: { name: '玻璃眼珠', desc: '一颗蓝色的玻璃眼珠，在宝物盒里放了八年。握在手心里，一点也捂不热。' },
      basket: { name: '小藤篮', desc: '一只编得很细的小藤篮，里面垫着一块褪色的格子布。玛丽的床。' }
    },
    notes: {
      letter: { title: '外婆的信', text: '（夹在外婆的旧相册里。信封上写着：「给绘里，等你长大一点再看。」）\n\n绘里：\n玛丽是你妈妈六岁生日那天，外公从横滨的洋货店抱回来的。所以她和你妈妈，是同一天过生日。\n\n她的床是那只小藤篮。晚上把她放进篮子里，说一声晚安——你妈妈小时候天天这样，你小时候也是。\n\n你五岁那年发脾气，把她的一只眼睛抠了下来，自己又哭了一整晚。那颗玻璃眼珠，外婆帮你收进宝物盒了。\n\n东西旧了，总有要扔的一天。扔之前，要好好谢谢它，跟它道别。\n用了很多年的东西，是有心的。\n　　　　　　　　　　　　外婆' },
      form: { title: '转入届（复印件）', text: '转入届　　平成8年3月30日受理\n\n新住址：けやき台团地　5号栋　503室\n旧住址：本町二丁目 14-3\n\n户主　　母　　　昭和37年5月12日生\n长女　　绘里　　昭和58年1月9日生\n\n（背面是妈妈的圆珠笔字）\n新电话：3月30日下午三点开通。\n号码只告诉了医院。' },
      memo: { title: '冰箱上的便条', text: '绘里：\n\n· 市立医院（夜间值班室）　23-4510\n· 门链挂好，谁来都别开\n· 晚饭在微波炉里，热两分钟\n· 不要的东西已经扔到楼下垃圾房了\n　（旧窗帘、坏台灯、小藤篮），明早八点收\n\n　　　　　　　　　　　　妈妈' },
      card: { title: '宝物盒里的卡片', text: '（一张画着小兔子的卡片，外婆的字。）\n\n绘里：\n要是有一天，你把玛丽弄丢了，别着急——她会自己找回家的。\n\n她回来的时候，别回头看她。女孩子走了那么远的路，头发乱了，裙子也脏了，不想让你看见她狼狈的样子。\n\n把手伸到背后去，把她丢掉的东西还给她，说一声「欢迎回家」。\n然后，让她睡回自己的篮子里。\n　　　　　　　　　　　　外婆' }
    },
    legend: '「メリーさんの電話」（玛丽的电话）是日本流传很广的都市传说。最常见的版本是：一个女孩搬家时，把一个旧的外国洋娃娃「玛丽」扔掉了。当天夜里电话响起，一个小女孩的声音说：「我是玛丽，我现在在垃圾站。」挂断后电话又响：「我现在在烟草店的拐角。」「我现在在你家门口。」——一通比一通近。最后一通是：「我是玛丽。我现在，在你身后。」故事往往就停在这一句。据说它至少在昭和后期就已经在孩子们之间口耳相传，最早出自哪里，已经说不清了。\n\n各地讲法的差别，多在结尾：有的说女孩回头之后就再也没有出现；有的干脆戛然而止，把想象留给听的人；也有人想出「背贴着墙站，它就绕不到身后」的对策，于是又生出各种接下去的讲法。还有一种说法强调，玛丽本来就是女孩自己珍爱过的娃娃，是被随手丢掉的旧物回来找主人。「电话一通通报出越来越近的位置」这个结构后来被大量模仿和戏仿，在漫画、动画和网络段子里反复出现，有时反而变成了喜剧。\n\n有一种看法把它和日本「付丧神」一类的观念放在一起理解：器物用久了会有灵性，被随手丢弃会生出怨念。直到今天，日本各地仍有寺社举行「人形供养」，人们把不再留着的人偶送去，郑重道谢之后再请寺社处理。也有人把「玛丽」这个名字和昭和年代流行的外国洋娃娃联系起来，不过并没有确切的出处。\n\n（本章中的绘里和她的妈妈、外婆、烟草店的婆婆、けやき台团地、答录机、玛丽的玻璃眼珠和小藤篮、「把丢掉的东西还给她、说欢迎回家」的解法，以及「背贴着墙」「一直不回头」两个结局，全部是游戏虚构。电话报出的地点里，「垃圾站」「烟草店的拐角」「家门口」「身后」取自常见的流传版本，「踏切」「公园」「楼下」是本章为地图加上的。）',
    start: { map: 'town', x: 3, y: 2, dir: 0 },
    resume: {
      calls: async S => { arm(S, S.f.call); },
      run: async S => {
        S.ent('booth').s.rg = false;
        if (deathRun >= 2) await S.think('（最短的路：出门一直往西走到楼梯；下楼后贴着楼前的水泥地往东走到头，再往南——黄牌子的笼子就在路灯底下。别进公园，别翻红的和蓝的。按住跑步键跑。）');
        else if (deathRun) await S.think('（上次没赶回来。玄关出门 → 走廊西头的楼梯 → 院子东南角黄牌子的「大件垃圾」笼子 → 原路回来。按住跑步键能跑。）');
        arm(S, 4);
      },
      final: async S => {
        if (lastBad === 'turn') await S.think('……不能回头。');
        else if (lastBad === 'wall') await S.think('背贴着墙，她就到不了身后——可她也就回不了家。\n外婆的卡片上，是怎么说的？');
        else if (lastBad === 'behind') await S.think(S.has('eye') ? '外婆说，把她丢掉的东西还给她。' : '玛丽丢掉的东西……宝物盒里，还没打开。');
        else if (lastBad === 'nobed') await S.think(S.f.basketSet ? '她的床已经摆好了。' : '（她的藤篮这一次已经拿不回来了。想让她睡回自己的床，只能从头再来。）');
        arm(S, 6);
      }
    },
    async intro(S) {
      await S.card('第一夜　玛丽的电话', '1996年3月　日本・某地方城市', '搬家那天傍晚，\n妈妈指着门口那个纸箱说：\n「那个娃娃，就别带了吧。」');
    },
    tick(S, dt) {
      if (S.map === 'apt') {
        const ph = S.ent('phone');
        const c = S.f.call || 0;
        /* 铃声：一通比一通急、一通比一通响；离电话越远越轻 */
        if (ph && ph.s.ring && !W.ended) { ringT -= dt; if (ringT <= 0) { ringT = 2.3 - c * .12; const d = Math.abs(S.pl.x - 14) + Math.abs(S.pl.y - 5); ring(S, clamp(.06 + c * .004 - d * .0035, .018, .085)); } }
        /* 第五通（楼下）之后：楼梯间里一级一级往上的脚步 */
        else if (c === 5 && !W.ended) { stepT -= dt; if (stepT <= 0) { stepT = 2.6; S.tone('sine', 92, 52, .14, .045, 0, 300); S.tone('sine', 88, 50, .12, .03, .34, 300); } }
      }
      if (S.map === 'court') {
        const sw = S.ent('swing');
        if (sw && sw.s.sw && S.f.night) { creakT -= dt; if (creakT <= 0) { creakT = 1.6; const d = Math.abs(S.pl.x - 10) + Math.abs(S.pl.y - 5); creak(S, clamp(.03 - d * .0012, .006, .03)); } }
        /* 她坐在秋千上的时候，走近了能听见很轻的八音盒 */
        if (sw && sw.s.doll && S.f.call === 4) { mbT -= dt; if (mbT <= 0) { mbT = 4.6; const d = Math.abs(S.pl.x - 10) + Math.abs(S.pl.y - 5); if (d <= 9) musicBox(S, clamp(.022 - d * .002, .005, .022), .9, 5, .34); } }
      }
    },
    thumb(g, w, h) {   // 黑色按键电话 + 一闪一闪的答录机红灯
      const R = (x, y, ww, hh, c) => { g.fillStyle = c; g.fillRect(x, y, ww, hh); };
      R(10, 10, 30, 22, 'rgba(120,140,210,.10)'); R(24, 10, 2, 22, 'rgba(0,0,0,.2)'); R(10, 20, 30, 2, 'rgba(0,0,0,.2)');
      const x0 = 12, y0 = h - 22 - 28;
      R(x0 - 4, y0 + 30, 52, 3, 'rgba(0,0,0,.4)');
      R(x0, y0 + 12, 40, 18, '#0c0c10'); R(x0 + 2, y0 + 13, 36, 2, '#2a2a34');
      for (let i = 0; i < 3; i++) for (let j = 0; j < 4; j++) R(x0 + 13 + i * 5, y0 + 17 + j * 3, 3, 2, '#3a3a46');
      R(x0 - 2, y0 + 4, 44, 6, '#0c0c10'); R(x0 - 4, y0 + 6, 9, 9, '#0c0c10'); R(x0 + 37, y0 + 6, 9, 9, '#0c0c10'); R(x0, y0 + 4, 40, 1, '#30303c');
      for (let i = 0; i < 9; i++) R(x0 + 42 + i * 3, y0 + 20 + (i % 2) * 3, 2, 3, '#18181e');
      R(x0 + 33, y0 + 16, 3, 3, '#ff2a2a'); R(x0 + 32, y0 + 15, 5, 5, 'rgba(255,40,40,.25)');
    },
    tiles: {
      track: { solid: false, paint(R, X, Y) { TILE.asphalt.paint(R, X, Y); R(0, 0, 16, 16, 'rgba(60,54,48,.45)'); for (let y = 1; y < 16; y += 5) R(0, y, 16, 2, '#4a3a2a'); R(X % 2 ? 2 : 11, 0, 2, 16, '#9aa0a6'); R(X % 2 ? 2 : 11, 0, 1, 16, '#c4c8cc'); } },
      trackS: { solid: true, paint(R, X, Y) { R(0, 0, 16, 16, '#4a4640'); for (let i = 0; i < 14; i++) R((hash(X, Y, i) * 15) | 0, (hash(Y, X, i) * 15) | 0, 2, 1, i % 2 ? '#5e5a52' : '#383430'); for (let y = 1; y < 16; y += 5) R(0, y, 16, 2, '#3a2c20'); R(X % 2 ? 2 : 11, 0, 2, 16, '#8a9096'); R(X % 2 ? 2 : 11, 0, 1, 16, '#b4b8bc'); } }
    },
    sprites: {
      mdoll(g, e, t, R) { doll(R, e); },
      cbox(g, e, t, R) {   // 搬家纸箱
        bx2(R, 1, 3, 14, 12, '#b08a5a'); R(2, 4, 12, 2, '#c49c6a'); R(7, 3, 2, 12, '#d4c49a');
        if (e.gr) { R(3, 9, 6, 3, '#e8e0d0'); R(4, 10, 4, 1, '#5a4a3a'); }
        if (e.open) { R(2, 4, 12, 5, '#3a2a1a'); R(-1, 1, 5, 4, '#a07a4a'); R(12, 1, 5, 4, '#a07a4a'); }
        if (e.doll) doll(R, { dir: 0, eyes: 1 }, 0, -7);
      },
      truck(g, e, t, R) {   // 侧面的小搬家车（车头朝右）
        R(0, 13, 32, 3, 'rgba(0,0,0,.35)');
        bx2(R, 0, -10, 22, 22, '#e4e0d4'); R(2, -6, 18, 2, '#2a6a3a'); R(2, -2, 12, 1, '#2a6a3a');
        bx2(R, 22, -2, 10, 14, '#3a5a8a'); R(24, 0, 6, 5, '#9ab8d0'); R(30, 8, 2, 2, '#ffe890');
        R(3, 10, 6, 6, '#1a1a1a'); R(23, 10, 6, 6, '#1a1a1a'); R(5, 12, 2, 2, '#666'); R(25, 12, 2, 2, '#666');
      },
      gomi(g, e, t, R) {   // 街边的垃圾站：绿色防乌鸦网（w=2）
        R(0, 6, 32, 10, '#3a3a36');
        R(2, 6, 9, 9, '#c8c8be'); R(11, 7, 8, 8, '#b4b8ac'); R(20, 6, 10, 9, '#c4c6bc'); R(4, 8, 3, 1, '#9a9a90'); R(23, 8, 4, 1, '#9a9a90');
        if (e.doll) doll(R, { dir: e.turn ? 2 : 0, eyes: 1, look: e.turn }, 9, e.net ? 1 : -3);
        for (let x = 0; x < 32; x += 3) R(x, 5, 1, 11, 'rgba(46,130,70,.75)');
        for (let y = 5; y < 16; y += 3) R(0, y, 32, 1, 'rgba(46,130,70,.75)');
        R(29, -12, 2, 18, '#555'); bx2(R, 23, -16, 9, 7, '#e8e4d8'); R(25, -14, 5, 1, '#2a6a3a'); R(25, -12, 3, 1, '#3a3a3a');
      },
      tabako(g, e, t, R) {   // 烟草店的小窗口（墙面，w=3）
        R(0, -6, 48, 20, '#5a4a3a'); R(0, -8, 48, 4, '#a83030'); for (let i = 0; i < 6; i++) R(3 + i * 8, -7, 4, 2, '#f0e8d8');
        bx2(R, 10, -1, 28, 14, '#3a2a1e'); R(12, 1, 24, 9, '#c8a870');
        R(21, 2, 6, 5, '#e0c0a0'); R(20, 1, 8, 2, '#c8c8c8'); R(22, 0, 4, 1, '#c8c8c8'); R(22, 4, 1, 1, '#2a2a2a'); R(25, 4, 1, 1, '#2a2a2a'); R(20, 7, 8, 3, '#6a5a8a');
        for (let i = 0; i < 5; i++) R(13 + i * 5, 10, 4, 3, ['#c03030', '#e8e8e8', '#3060a0', '#e0c040', '#309060'][i]);
        R(2, 0, 6, 12, '#2a2a2e'); R(40, 0, 6, 12, '#2a2a2e');
      },
      xsig(g, e, t, R) {   // 踏切警报灯：黄黑×字牌 + 两盏红灯
        R(7, -18, 2, 33, '#e8e8e8'); for (let y = -16; y < 15; y += 6) R(7, y, 2, 3, '#1a1a1a');
        R(2, -22, 12, 2, '#e8c020'); R(2, -22, 2, 2, '#1a1a1a'); R(12, -22, 2, 2, '#1a1a1a'); R(6, -24, 4, 6, '#e8c020');
        const on = e.bl ? Math.floor(t * 3.2) % 2 : -1;
        R(1, -12, 5, 5, '#1a1a1a'); R(10, -12, 5, 5, '#1a1a1a');
        R(2, -11, 3, 3, on === 0 ? '#ff3a2a' : '#4a1010'); R(11, -11, 3, 3, on === 1 ? '#ff3a2a' : '#4a1010');
        if (on >= 0) R(on ? 9 : 0, -13, 7, 7, 'rgba(255,60,40,.25)');
      },
      xgate(g, e, t, R) {   // 栏杆（e.up = 栏杆朝上伸）
        R(5, 9, 6, 6, '#3a3a3a'); R(6, 10, 4, 4, '#e8c020');
        const L = e.dn ? 70 : 14, y0 = e.up ? (e.dn ? -62 : -6) : 8;
        for (let i = 0; i < L; i += 4) R(7, (e.up && !e.dn) ? y0 - i : y0 + i, 2, 4, (i / 4) % 2 ? '#1a1a1a' : '#e8c020');
      },
      train(g, e, t, R) {   // 从上往下看的电车（w=2，车身往上伸很长）
        bx2(R, 2, -110, 28, 126, '#b8bcc0'); R(4, -108, 24, 4, '#e8e8e8'); R(5, -100, 22, 2, '#3a7a5a');
        for (let y = -96; y < 10; y += 10) { R(2, y, 2, 6, '#ffe8a0'); R(28, y, 2, 6, '#ffe8a0'); }
        for (let y = -70; y < 10; y += 36) R(3, y, 26, 1, '#5a5e62');
        R(8, 12, 4, 3, '#ffe890'); R(20, 12, 4, 3, '#ffe890');
      },
      dsign(g, e, t, R) { R(2, 0, 12, 10, '#e8e4d8'); R(3, 1, 10, 3, '#2a6a3a'); R(4, 6, 8, 1, '#3a3a3a'); R(10, 8, 3, 1, '#3a3a3a'); R(12, 7, 1, 3, '#3a3a3a'); R(7, 10, 2, 5, '#555'); },
      entr(g, e, t, R) {   // 团地楼门：灯 + 玻璃门 + 门洞里往上的楼梯
        R(1, -2, 14, 16, '#1a1a1e'); R(2, 0, 12, 14, '#2a2c30'); for (let i = 0; i < 4; i++) R(3, 2 + i * 3, 10, 2, shade('#5a5a5e', -i * .12));
        R(4, -5, 8, 2, '#f0e8c0'); R(5, -3, 6, 1, '#a09870'); R(0, -2, 1, 16, '#6a6a6e'); R(15, -2, 1, 16, '#6a6a6e');
        R(6, 0, 4, 2, '#e8e4d8'); R(7, 0, 2, 1, '#2a6a3a');
      },
      mbox(g, e, t, R) { for (let i = 0; i < 2; i++) for (let j = 0; j < 3; j++) { bx2(R, 1 + j * 5, 1 + i * 6, 5, 6, '#7a8088'); R(2 + j * 5, 3 + i * 6, 3, 1, '#2a2c30'); } R(12, 3, 2, 1, '#e8e4d8'); },
      swing(g, e, t, R) {   // 秋千（w=2）：两根立柱、横梁、链子、晃动的坐板
        R(1, -22, 2, 37, '#a83a2a'); R(29, -22, 2, 37, '#a83a2a'); R(0, -24, 32, 3, '#c84a3a'); R(0, 13, 4, 2, '#3a3a3a'); R(28, 13, 4, 2, '#3a3a3a');
        const sw = e.sw ? Math.round(Math.sin(t * 2.4) * 3) : 0;
        R(10, -21, 1, 24, '#8a8a8a'); R(21, -21, 1, 24, '#8a8a8a');
        R(8, 3 + sw, 16, 3, '#6a4a2a'); R(8, 3 + sw, 16, 1, '#8a6a4a');
        if (e.doll) doll(R, { dir: 0, eyes: 1, look: e.look }, 8, -9 + sw);
        R(10, 15, 12, 1, 'rgba(0,0,0,.3)');
      },
      slide(g, e, t, R) { R(1, -14, 2, 29, '#5a6a8a'); R(6, -14, 2, 29, '#5a6a8a'); for (let y = -12; y < 14; y += 4) R(1, y, 7, 1, '#7a8aaa'); R(8, -12, 6, 4, '#c8b040'); R(9, -8, 6, 22, '#d8c050'); R(10, -8, 4, 22, '#e8d070'); },
      booth(g, e, t, R) {   // 电话亭
        bx2(R, 1, -14, 14, 29, '#8aa89a'); R(3, -12, 10, 24, e.rg && Math.floor(t * 6) % 2 ? '#d8f0e0' : '#a8c8c0'); R(3, -12, 10, 1, '#e8f0e8');
        R(5, -6, 6, 8, '#3a8a4a'); R(6, -5, 4, 2, '#c8d0c8'); R(6, -1, 4, 2, '#222'); R(1, -16, 14, 3, '#3a6a4a');
      },
      cage(g, e, t, R) {   // 垃圾房的铁丝笼子（颜色 = 种类）
        const c = e.col || '#6a6a6a';
        R(0, -4, 16, 19, '#2a2a2c'); R(0, -6, 16, 3, c); R(5, -6, 6, 2, '#e8e4d8');
        R(2, 2, 6, 7, '#7a7a70'); R(8, 4, 6, 6, '#6a6a60');
        if (e.bk) { R(5, 4, 8, 6, '#a07a3a'); R(6, 5, 6, 1, '#c09a5a'); R(6, 7, 6, 1, '#7a5a2a'); }
        for (let x = 0; x < 16; x += 3) R(x, -3, 1, 18, 'rgba(160,170,180,.55)'); for (let y = -3; y < 15; y += 3) R(0, y, 16, 1, 'rgba(160,170,180,.55)');
      },
      gsign(g, e, t, R) { R(7, -2, 2, 16, '#555'); bx2(R, 0, -12, 16, 11, '#e8e4d8'); R(2, -10, 3, 3, '#a83a2a'); R(6, -10, 3, 3, '#2a5a8a'); R(10, -10, 3, 3, '#a89a2a'); R(2, -5, 12, 1, '#3a3a3a'); },
      apphone(g, e, t, R) {   // 小柜子 + 黑电话 + 答录机
        bx2(R, 0, 2, 16, 13, '#6a4a30'); R(1, 3, 14, 2, '#8a6a4a');
        const j = e.ring ? (Math.floor(t * 20) % 2) : 0;
        R(1, -3, 9, 6, '#121216'); R(0 + j, -5, 11, 2, '#121216'); R(2, -2, 5, 3, '#2a2a34');
        R(10, -1, 6, 4, '#3a3a40'); R(11, 0, 3, 1, '#18181c');
        const led = e.ring || e.msg ? Math.floor(t * 4) % 2 : 1; R(14, 0, 1, 1, led ? '#ff2a2a' : '#5a1010');
        R(8, 3, 1, 3, '#555'); R(8, 6, 6, 1, '#555');
      },
      jack(g, e, t, R) { R(5, 6, 6, 6, '#e8e4dc'); R(7, 8, 2, 2, '#2a2a2a'); if (!e.unp) { R(8, 10, 1, 4, '#8a8a8a'); R(9, 13, 3, 1, '#8a8a8a'); R(12, 13, 1, 3, '#8a8a8a'); } else { R(10, 13, 4, 1, '#8a8a8a'); R(13, 14, 2, 1, '#8a8a8a'); } },
      tinbox(g, e, t, R) {   // 铁皮饼干盒
        bx2(R, 2, 7, 12, 8, '#3a5a9a'); R(3, 8, 10, 2, '#5a7aba');
        R(4, 10, 2, 2, '#e8a0b0'); R(9, 11, 2, 2, '#f0e070'); R(11, 9, 1, 1, '#e8e8e8');
        if (e.open) { R(1, 4, 14, 3, '#5a7aba'); R(4, 9, 2, 2, '#3a6ad8'); R(7, 9, 4, 3, '#e8e4d8'); } else { R(7, 12, 3, 3, '#c9a35a'); R(8, 13, 1, 1, '#4a3a1a'); }
      },
      bspot(g, e, t, R) {   // 墙角：空着的地方 / 藤篮 / 篮子里的玛丽
        if (!e.bk) { R(3, 9, 10, 1, 'rgba(255,255,255,.08)'); R(3, 14, 10, 1, 'rgba(255,255,255,.08)'); return; }
        R(2, 8, 12, 7, '#a07a3a'); R(3, 9, 10, 1, '#c09a5a'); R(3, 11, 10, 1, '#7a5a2a'); R(3, 13, 10, 1, '#c09a5a'); R(2, 6, 12, 2, '#b08a4a');
        R(3, 7, 10, 1, '#a83a3a');
        if (e.doll) { R(4, 4, 8, 5, '#e4be4c'); R(5, 5, 6, 3, '#f7eee6'); R(6, 6, 1, 1, '#3a6ad8'); R(9, 6, 1, 1, '#3a6ad8'); R(4, 7, 8, 2, '#2c46a8'); R(3, 7, 10, 1, '#a83a3a'); }
      },
      butsudan(g, e, t, R) {   // 小佛龛：外婆的照片
        bx2(R, 1, -6, 14, 21, '#2a1a12'); R(3, -4, 10, 10, '#4a2a1a'); R(5, -3, 6, 7, '#d8d0c0'); R(6, -2, 4, 3, '#c8a888'); R(6, -1, 4, 1, '#8a8a8a'); R(6, 2, 4, 2, '#e4be4c');
        R(3, 8, 10, 2, '#c9a35a'); R(4, 11, 2, 3, '#e8e4d8'); R(10, 11, 2, 3, '#e8e4d8');
      },
      view(g, e, t, R) {   // 阳台栏杆外的夜景（墙面）
        R(0, 0, 16, 14, '#0c1020'); R(0, 9, 16, 5, '#14182a');
        for (let i = 0; i < 5; i++) R((hash(e.x, i, 3) * 14) | 0, 9 + ((hash(i, e.x, 4) * 4) | 0), 1, 1, '#e8c870');
        if (e.x === 11 && Math.floor(t * 3) % 2) R(12, 8, 1, 1, '#ff3a2a');
        R(0, 6, 16, 1, '#8a8e94'); for (let x = 1; x < 16; x += 3) R(x, 6, 1, 8, '#6a6e74');
      },
      clamp(g, e, t, R) { const off = e.off || (e.flicker && Math.random() < .3); R(2, 0, 12, 3, '#3a3a3e'); R(3, 3, 10, 2, off ? '#5a5a5e' : '#e8f0f0'); },
      sdoor(g, e, t, R) {   // 团地的铁门（墙面），门牌号
        bx2(R, 2, -2, 12, 16, '#6a7078'); R(3, -1, 10, 14, '#7a8088'); if (e.open) { R(3, -1, 10, 14, '#0a0a0c'); R(3, -1, 2, 14, '#5a6068'); return; } R(11, 5, 2, 2, '#c8c8c8'); R(5, 8, 6, 1, '#4a4e54');
        R(5, 0, 6, 3, '#e8e4d8'); if (e.num === '503') R(6, 1, 4, 1, '#2a2a2a'); else R(6, 1, 3, 1, '#5a5a5a');
      },
      washer(g, e, t, R) { bx2(R, 1, 0, 14, 15, '#e0ded8'); R(4, 4, 8, 8, '#8a9aa8'); R(5, 5, 6, 6, '#aab8c4'); R(3, 1, 10, 2, '#c8c6c0'); },
      board(g, e, t, R) { R(1, 1, 14, 11, '#3a3a3e'); R(2, 2, 12, 9, '#e8e4d0'); R(3, 3, 8, 1, '#5a5a5a'); R(3, 5, 10, 1, '#5a5a5a'); R(3, 7, 6, 1, '#5a5a5a'); R(11, 7, 2, 3, '#c03030'); }
    },
    maps: {
      /* ---------------- 傍晚的街：旧家 → 垃圾站 → 烟草店 → 踏切 → 团地 ---------------- */
      town: {
        amb: 'wind', dark: .38, darkC: '#1e0c18', plr: 4, wall: 'plain', floor: 'sidewalk',
        wallC: { face: '#7a6a5e', trim: '#4a3c34', top: '#1e1816' },
        legend: { 'y': 'track', 'Y': { t: 'trackS', solid: true } },
        tileOpts: { grassC: '#2a3624', treeC: '#1e2a1c' },
        rows: [
          '########################YY##########',
          '########################YY##########',
          '________________________yy__________',
          '::::::::::::::::::::::::yy::::::::::',
          '========================yy==========',
          '::::::::::::::::::::::::yy::::::::::',
          '________________________yy__________',
          'ffffffffffffffffffffffffYYffffffffff',
          '"T""""T"""""T""""T""""""YY""T""""T""',
          'TTTTTTTTTTTTTTTTTTTTTTTTYYTTTTTTTTTT'],
        ents: [
          { x: 3, y: 1, spr: 'door', col: '#6a5038', on: S => S.narr('旧家的门。钥匙已经还给房东了。\n门框上还贴着你小学时候贴的贴纸，撕掉了一半。') },
          { x: 1, y: 1, spr: 'window', on: S => S.narr('屋里空了，窗帘也拆了。\n对面墙上，铅笔画的身高刻度一道一道往上爬：「绘里 6岁」「绘里 9岁」……\n最矮的那一道旁边写着：「玛丽」。') },
          { x: 5, y: 1, spr: 'window', on: S => S.narr('窗台上有一圈圆圆的、没晒褪色的印子。\n以前玛丽就坐在那儿，看着门口。') },
          { id: 'tbox', x: 2, y: 2, spr: 'cbox', open: true, s: { doll: true }, on: tboxOn },
          { id: 'mama', x: 5, y: 2, spr: '@mama', dir: 1, on: mamaOn },
          { id: 'truck', x: 6, y: 3, w: 2, spr: 'truck', on: S => S.narr('「搬家　小型」。车斗里绑着冰箱、洗衣机，还有外婆留下的五斗柜。') },
          { x: 8, y: 1, spr: 'board', on: S => S.narr('街坊的告示板。「三月三十一日　清扫河道」「捡到钥匙一串」。') },
          { id: 'gomi', x: 9, y: 2, w: 2, spr: 'gomi', on: gomiOn },
          { x: 11, y: 2, spr: 'streetlamp', light: { r: 3.6, dy: -14, col: 'rgba(255,190,120,.18)' }, on: S => S.narr('路灯已经亮了。几只乌鸦站在电线上，歪着头往下看。') },
          { id: 'tabako', x: 13, y: 1, w: 3, spr: 'tabako', light: { r: 2.6, dy: 12, col: 'rgba(255,200,140,.16)' }, on: tabakoOn },
          { id: 'vend', x: 16, y: 1, spr: 'vending', col: '#2a6a9a', light: { r: 2.2, dy: 4, col: 'rgba(180,220,255,.14)' }, on: S => S.narr('烟草店门口的自动售货机。热可可一百二十日元。\n你兜里只有八十日元。') },
          { x: 18, y: 1, spr: 'sign', col: '#7a6a4a', on: S => S.narr('拐角的电线杆上钉着一块牌子：「← 本町商店街」。\n烟草店就在这个拐角上。') },
          { id: 'sigW', x: 23, y: 1, spr: 'xsig', on: S => S.narr('踏切的警报灯。黄黑两色的「×」字牌底下，两盏红灯。') },
          { id: 'gateW', x: 23, y: 2, spr: 'xgate', solid: false },
          { id: 'gateE', x: 26, y: 6, spr: 'xgate', solid: false, s: { up: 1 } },
          { id: 'sigE', x: 26, y: 7, spr: 'xsig' },
          { id: 'train', x: 24, y: -8, w: 2, spr: 'train', solid: false, hidden: true },
          { x: 29, y: 2, spr: 'streetlamp', light: { r: 3.4, dy: -14, col: 'rgba(255,190,120,.16)' }, on: S => S.narr('过了踏切，路灯就稀了。') },
          { x: 32, y: 1, spr: 'dsign', on: S => S.narr('「けやき台团地　→」') }
        ],
        async enter(S, first) {
          if (!first) return;
          await S.say('妈妈', ['绘里——最后一车了！', '门口那个纸箱是要扔的。你看看，有没有要留的。']);
          S.goal('看看门口那箱要扔的东西');
        },
        step(S, x, y) {
          if (x >= 12 && !S.f.dropped) { S.pos(11, y, 1); return S.think(S.f.gotDoll ? '……先把玛丽放到垃圾站吧。' : '妈妈还在车旁边等着。门口那箱东西，还没看。'); }
          if (S.f.dropped && x >= 15 && S.once('turnDoll')) { S.ent('gomi').s.turn = true; S.sfx('heart'); S.toast('……后背凉飕飕的，像是有人在看你'); }
          if (S.f.dropped && x >= 20 && !S.f.trainDone) return trainEvent(S);
          if (x >= 35) return S.go('court', 1, clamp(y + 2, 2, 11), 2);
        }
      },
      /* ---------------- けやき台团地 · 院子 ---------------- */
      court: {
        amb: 'night', dark: .5, darkC: '#120a18', plr: 3.2, wall: 'concrete', floor: 'concrete',
        wallC: { face: '#7a7a76', trim: '#4a4a46', top: '#1a1a1c' },
        tileOpts: { grassC: '#24321f' },
        rows: [
          '############################',
          '############################',
          'xxxxxxxxxxxxxxxxxxxxxxxxxxx#',
          'xxxxxxxxxxxxxxxxxxxxxxxxxxx#',
          'xx""""""""""""""""xxxxxxxxx#',
          'xx"ssss"""""""""""xxxxxxxxx#',
          'xx"ssss"""""""""""xxxxxxxxx#',
          'xx""""""""""""""""xxxxxxxxx#',
          'xx""""""""""""""""xxxxxxxxx#',
          'xxxxxxxxxxxxxxxxxxxxxxxxxxx#',
          'xxxxxxxxxxxxxxxxxxxxxxxxxxx#',
          'xxxxxxxxxxxxxxxxxxxxxxxxxxx#',
          'BBBBBBBBBBBBBBBBBBBBBBBBBBBB'],
        ents: [
          { id: 'entr', x: 4, y: 1, spr: 'entr', light: { r: 3, dy: 4, col: 'rgba(255,230,170,.18)' }, on: entrOn },
          { x: 6, y: 1, spr: 'mbox', on: S => S.narr('一排铁皮信箱。503 的那一格上，妈妈已经用胶带贴好了名字。') },
          { x: 2, y: 1, spr: 'window', lit: true }, { x: 9, y: 1, spr: 'window' }, { x: 12, y: 1, spr: 'window', lit: true }, { x: 15, y: 1, spr: 'window' },
          { x: 18, y: 1, spr: 'window', lit: true }, { x: 22, y: 1, spr: 'window' }, { x: 25, y: 1, spr: 'window', lit: true },
          { id: 'booth', x: 20, y: 3, spr: 'booth', light: { r: 2.2, dy: -4, col: 'rgba(200,255,220,.12)' }, on: S => S.narr(S.f.gotBasket ? '电话亭。听筒挂得好好的。\n……刚才是谁打来的？' : '院子里的公用电话亭。玻璃上贴着褪色的贴纸：「110　119」。') },
          { id: 'swing', x: 10, y: 5, w: 2, spr: 'swing', s: { sw: true }, on: S => {
            const sw = S.ent('swing');
            if (sw.s.doll) return S.narr('……不。不能再靠过去了。');
            if (S.f.call === 4) return S.narr('秋千还在晃。坐板上空空的。');
            return S.narr('秋千。坐板上落了一层沙子，链子锈得发红。');
          } },
          { x: 14, y: 6, spr: 'slide', on: S => S.narr('黄色的滑梯。滑道上有人用粉笔画了一个笑脸。') },
          { x: 4, y: 8, w: 2, spr: 'bench', on: S => S.narr('长椅上落着一只小孩的手套，被人挂在了椅背上。') },
          { x: 5, y: 4, spr: 'sign', col: '#a87a3a', on: S => S.narr('「沙坑里不许带狗进来」。沙子上有一圈很小的脚印。') },
          { x: 1, y: 10, spr: 'streetlamp', light: { r: 3.6, dy: -14, col: 'rgba(255,200,130,.16)' }, on: S => S.narr('路灯的光里，飞着几只小虫。') },
          { x: 19, y: 6, spr: 'streetlamp', light: { r: 3.8, dy: -14, col: 'rgba(255,200,130,.16)' }, on: S => S.narr('这盏路灯正好照着公园和秋千。') },
          { x: 26, y: 8, spr: 'streetlamp', light: { r: 3.4, dy: -14, col: 'rgba(255,200,130,.14)' }, on: S => S.narr('路灯下面就是垃圾房。') },
          { x: 19, y: 11, spr: 'gsign', on: S => S.narr('「垃圾房」。牌子上画着三种颜色：红的放可燃，蓝的放不燃，黄的放大件。') },
          { id: 'cage1', x: 21, y: 11, spr: 'cage', col: '#a83a2a', on: cageOn(1) },
          { id: 'cage2', x: 23, y: 11, spr: 'cage', col: '#2a5a8a', on: cageOn(2) },
          { id: 'cage3', x: 25, y: 11, spr: 'cage', col: '#a89a2a', on: cageOn(3) },
          { id: 'm_ent', x: 5, y: 2, spr: 'mdoll', solid: false, hidden: true, dir: 3 }
        ],
        async enter(S, first) {
          if (first && !S.f.night) {
            await S.narr('けやき台团地。五层的灰色楼房一栋挨着一栋，阳台上晾着被子。\n院子中间有个小公园：秋千、滑梯、沙坑。');
            S.goal('去五号栋（院子北边亮着灯的楼门）');
          }
          if (S.f.call === 4 && S.once('courtRun')) S.toast('垃圾房在院子东南角');
        },
        step(S, x, y) {
          if (x <= 0) { if (!S.f.night) return S.go('town', 34, clamp(y - 2, 2, 6), 1); S.pos(1, y, 2); S.toast('……这么晚了，团地外面黑漆漆的。玛丽就是从那条路上过来的'); return; }
          const sw = S.ent('swing');
          if (S.f.call === 4 && !S.f.gotBasket && sw.s.doll && sw.s.sw && Math.abs(x - 10.5) + Math.abs(y - 5) <= 3.5) { sw.s.sw = false; sw.s.look = true; S.sfx('heart'); S.toast('秋千……停了'); }
          if (S.f.gotBasket && S.f.call === 4 && x <= 19 && S.once('boothRing')) { const b = S.ent('booth'); b.s.rg = true; ring(S, .025); S.toast('公用电话响了一声，又断了'); S.after(1500, async () => { b.s.rg = false; }); }
        }
      },
      /* ---------------- 五号栋 503 · 新家（下面一条是外走廊） ---------------- */
      apt: {
        amb: 'room', dark: .45, plr: 3.4, wall: 'plain', floor: 'wood', floor2: 'greentile',
        wallC: { face: '#c8c0b0', trim: '#7a7266', top: '#1e1c1a' },
        tileOpts: { carpetC: '#5a6a8a', woodC: '#8a6a48' },
        rows: [
          '######################',
          '######################',
          '#xxxxxxxxxxxxxxxxxxxx#',
          '###.######.######.####',
          '#cccccc#lllllll#ttttt#',
          '#cccccc#lllllll#ttttt#',
          '#cccccc.lllllll.ttttt#',
          '#cccccc#lllllll#ttttt#',
          '########lllllll#######',
          '#+++++##lllllll##,,,,#',
          '#+++++.lllllllll.,,,,#',
          '#+++++#####n#####,,,,#',
          '##########kkk#########',
          '######################',
          '#xxxxxxxxxxxxxxxxxxxx#',
          'LLLLLLLLLLLLLLLLLLLLLL'],
        ents: [
          /* 阳台 */
          { id: 'v1', x: 4, y: 1, spr: 'view', on: viewOn },
          { id: 'v2', x: 11, y: 1, spr: 'view', on: viewOn },
          { id: 'v3', x: 18, y: 1, spr: 'view', on: viewOn },
          { x: 8, y: 2, spr: 'deadplant', on: S => S.narr('上一户留下的花盆，里面的花早就枯了。') },
          { x: 14, y: 2, spr: 'box', on: S => S.narr('阳台上堆着压扁的纸箱，等着下周收废纸。') },
          /* 绘里的房间 */
          { x: 2, y: 3, spr: 'curtain', on: S => S.narr('还没来得及装窗帘杆，窗帘先用图钉按在了墙上。') },
          { x: 4, y: 3, spr: 'curtain', on: S => S.narr('窗帘缝里漏进来一线路灯的光。') },
          { x: 1, y: 4, spr: 'desk', col: '#7a5a3a', on: S => S.narr('书桌。桌面上只有一圈灰。\n新学期之前，得把它收拾出来。') },
          { x: 4, y: 4, spr: 'bookshelf', on: S => S.narr('空书架。最上面一层的木板上，有一个小小的、圆圆的印子。') },
          { id: 'bspot', x: 6, y: 4, spr: 'bspot', solid: false, on: bspotOn },
          { id: 'boxA', x: 2, y: 7, spr: 'cbox', on: boxOn('A') },
          { id: 'boxB', x: 4, y: 7, spr: 'cbox', on: boxOn('B') },
          { id: 'boxC', x: 5, y: 5, spr: 'cbox', on: boxOn('C') },
          { id: 'tin', x: 3, y: 6, spr: 'tinbox', solid: false, hidden: true, on: tinOn },
          { id: 'futon', x: 1, y: 6, h: 2, spr: 'futon', col: '#c86a7a', solid: false, hidden: true, on: futonOn },
          /* 客厅 · 厨房 */
          { id: 'fridge', x: 8, y: 4, spr: 'fridge', async on(S) { if (S.f.n_memo && S.once('fridgeMw')) await S.narr('冰箱门上贴着妈妈的便条。'); await S.note('memo'); S.f.n_memo = true; } },
          { x: 9, y: 4, spr: 'sink', on: S => S.narr('水龙头没拧紧，「嗒、嗒」地滴着水。') },
          { x: 11, y: 4, spr: 'stove', on: S => S.narr('燃气灶。妈妈留的晚饭在微波炉里，你一口也没吃。') },
          { x: 12, y: 4, spr: 'counter', on: S => S.narr('灶台边上堆着还没拆的碗碟，一只一只用报纸包着。') },
          { id: 'jack', x: 13, y: 3, spr: 'jack', on: jackOn },
          { id: 'phone', x: 14, y: 4, spr: 'apphone', on: phoneOn },
          { id: 'table', x: 10, y: 6, w: 2, spr: 'lowtable', async on(S) { if (S.once('formFirst')) await S.narr('茶几上放着今天办迁入手续的单子。'); await S.note('form'); S.f.n_form = true; } },
          { x: 14, y: 7, spr: 'tv', on: S => S.narr('电视还没接天线。黑黑的屏幕上，映出客厅模模糊糊的影子。') },
          { x: 12, y: 8, w: 2, spr: 'sofa', col: '#6a5a4a', on: S => S.narr('沙发上还蒙着搬家时的塑料布，一碰就哗啦哗啦地响。') },
          { x: 15, y: 9, spr: 'wallclock', on: S => { S.sfx('tick'); return S.narr('墙上的挂钟：' + ['九点多。', '十一点过五分。', '十一点二十。', '十一点三十五。', '十一点五十。', '十二点过五分。', '十二点二十。', '……'][S.f.slept ? Math.min(7, S.f.call + 1) : 0]); } },
          /* 浴室 · 厕所 · 玄关 */
          { x: 1, y: 9, w: 2, spr: 'bathtub', on: S => S.narr('浴缸还没放过水。浴室里一股新刷的油漆味。') },
          { x: 5, y: 9, spr: 'washer', on: S => S.narr('洗衣机。搬家工人说，管子明天再接。') },
          { x: 20, y: 9, spr: 'toilet', on: S => S.narr('厕所的小窗外面，正对着外走廊。') },
          { x: 10, y: 12, spr: 'getabako', on: S => S.narr('鞋柜上放着妈妈的备用钥匙。\n门链挂着。') },
          { id: 'door503', x: 11, y: 13, spr: 'sdoor', s: { num: '503' } },
          { id: 'fdoor', x: 11, y: 12, spr: 'invisible', solid: false, on: doorIn },
          { id: 'mama', x: 11, y: 11, spr: '@mama', dir: 3 },
          /* 和室 */
          { x: 16, y: 4, spr: 'butsudan', on: S => S.narr('小小的佛龛里，摆着外婆的照片。妈妈搬进来做的第一件事，就是把它擦干净摆好。\n照片里的外婆笑眯眯的，怀里抱着一个金头发的洋娃娃。') },
          { x: 19, y: 4, spr: 'dresser', col: '#6a4a34', on: S => S.narr('妈妈的五斗柜，外婆留下来的。最上面一层的抽屉里，是一卷一卷的毛线。') },
          { x: 20, y: 5, spr: 'closet', on: S => S.narr('押入れ。拉门里塞满了被褥，一股樟脑丸的味道。') },
          { id: 'gbox', x: 19, y: 7, spr: 'cbox', s: { gr: 1 }, async on(S) {
            if (S.once('gboxFirst')) { S.ent('gbox').open = true; S.sfx('paper'); await S.narr('纸箱上是妈妈的字：「外婆」。\n最上面是外婆的旧相册。相册里夹着一个信封：「给绘里，等你长大一点再看。」'); }
            await S.note('letter'); S.f.n_letter = true;
          } },
          /* 外走廊 */
          { x: 1, y: 14, spr: 'stairsdown', solid: false, touch: stairsDown },
          { id: 'fdoorO', x: 11, y: 14, spr: 'invisible', solid: false, on: doorOut },
          { x: 6, y: 13, spr: 'sdoor', s: { num: '502' }, on: S => S.narr('502。门牌上的名字被撕掉了，门把手上落着灰。') },
          { x: 16, y: 13, spr: 'sdoor', s: { num: '504' }, on: S => S.narr('504。门口摆着一双小孩的雨靴。……里面一点声音都没有。') },
          { x: 19, y: 13, spr: 'sdoor', s: { num: '505' }, on: S => S.narr('505。门上贴着「报纸请勿投递」。') },
          { id: 'lampA', x: 8, y: 13, spr: 'clamp', light: { r: 2.8, dy: 14, col: 'rgba(220,240,255,.12)' } },
          { id: 'lampB', x: 14, y: 13, spr: 'clamp', light: { r: 2.8, dy: 14, col: 'rgba(220,240,255,.12)' } },
          { id: 'm_cor', x: 11, y: 14, spr: 'mdoll', solid: false, hidden: true, dir: 3, light: { r: 1.3, col: 'rgba(255,230,170,.10)' } },
          { id: 'm_apt', x: 1, y: 2, spr: 'mdoll', solid: false, hidden: true }
        ],
        async enter(S, first) {
          if (!first) return;
          S.face('pl', 0);
          await S.say('妈妈', ['医院缺人，今晚我得去顶夜班。明早七点回来。', '医院的电话贴在冰箱上了。答录机也接好了——我不在的时候有人找，就让它录。', '门链挂好，谁敲门都别开。']);
          await S.say('妈妈', ['对了，不要的旧东西——旧窗帘、坏台灯，还有你那只小藤篮——我顺手扔到楼下垃圾房了，明早收。', '早点睡。']);
          await S.walk('mama', [11, 12], 3); S.sfx('open'); S.hide('mama'); await S.wait(300); S.sfx('close');
          await S.think('……小藤篮。');
          S.goal('收拾自己的房间（纸箱 0/3）');
          S.cp();
        }
      }
    }
  });
})();
