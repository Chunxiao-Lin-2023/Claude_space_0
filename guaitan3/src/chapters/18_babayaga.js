/* ================= 第十八夜 · 芭芭雅嘎 ================= */
(() => {
  /* ---------- 调参 ---------- */
  const DOLL_T = { d1: 14, d2: 30 };   // 娃娃挑完一斗需要的秒数（只在你不在屋里时才算）
  const COOK_T = { d1: 10, d2: 26 };   // 锅要炖多久
  const D2_TIME = 95;                  // 第二天「日落」倒计时
  const CH = { vy: 6.0, vf: 9.0, catchPx: 18, startT: 2.2, creakLead: .6, biteT: .6, birch: .55, towelT: 2.4, combT: 2.6 };
  const PILES = { d1: [[5, 7], [14, 5], [12, 9], [4, 9], [18, 6]], d2: [[6, 6], [13, 7], [17, 10], [3, 4], [11, 9]] };
  const SPELL_OK = ['背 树林 面 我', '面 我 背 树林'];
  const DEAD = { d2: 0, ch: 0 };       // 本次会话里死过几次（重来时给规则小结）

  /* ---------- 小工具 ---------- */
  /* 计数写进当前检查点（S.f 会在重来时被检查点覆盖），用于逐级提示 */
  function bump(S, key) { S.f[key] = (S.f[key] || 0) + 1; if (W.cp && W.cp.f) W.cp.f[key] = (W.cp.f[key] || 0) + 1; return S.f[key]; }
  /* 非阻塞的平移动画（骑士、石臼）：tick 里推进 */
  const MOV = [];
  function glide(S, id, x0, y0, x1, y1, dur, o = {}) {
    const e = S.ent(id); if (!e) return 0;
    S.place(id, x0, y0); if (o.col) e.col = o.col; if (o.dir != null) e.dir = o.dir;
    for (let i = MOV.length - 1; i >= 0; i--) if (MOV[i].id === id) MOV.splice(i, 1);
    MOV.push({ id, x0, y0, x1, y1, t: 0, dur, hide: o.hide !== false, g: GEN });
    return dur;
  }
  /* 合成音 */
  function hooves(S, dur, vol = .06) { const n = Math.max(2, Math.floor(dur / .3)); for (let i = 0; i < n; i++) { const v = Math.max(.004, vol * Math.sin(Math.PI * (i + .5) / n)); [0, .07, .15].forEach(o => S.tone('square', 120, 60, .05, v, i * .3 + o, 520)); } }
  function whoosh(S, v = 1) { S.tone('sawtooth', 70, 34, 1.4, .09 * v, 0, 260); S.tone('sine', 50, 30, 1.2, .2 * v, .05); S.tone('triangle', 900, 300, .9, .02 * v, .1, 1400); }
  function stomp(S, n = 2) { for (let i = 0; i < n; i++) { S.tone('sine', 72, 34, .28, .32, i * .32); S.tone('square', 140, 60, .06, .05, i * .32, 400); } }
  function clap(S, n = 3) { for (let i = 0; i < n; i++) { S.tone('square', 1900, 700, .035, .12, i * .28, 5000); S.tone('triangle', 420, 200, .05, .06, i * .28, 1800); } }
  function chime(S) { S.tone('sine', 1568, 1568, .5, .05); S.tone('sine', 2093, 2093, .6, .03, .14); S.tone('sine', 2637, 2637, .5, .015, .26); }
  function ignite(S, i) { S.tone('sawtooth', 200 + i * 23, 420 + i * 30, .22, .025, i * .14, 1300); S.tone('sine', 900 + i * 40, 1400, .12, .015, i * .14 + .05); }
  function creak(S, v = 1) { S.tone('sawtooth', 260, 980, .45, .06 * v, 0, 1700); S.tone('sawtooth', 980, 420, .5, .05 * v, .45, 1500); }
  function growl(S) { S.tone('sawtooth', 84, 70, .7, .07, 0, 320); S.tone('sawtooth', 95, 76, .5, .05, .5, 320); }
  function gnaw(S) { S.tone('square', 2400, 1800, .04, .05, 0, 6000); S.tone('square', 2100, 1500, .04, .05, .09, 6000); S.tone('sine', 140, 90, .1, .1, .04); }
  function rooster(S) { S.tone('sawtooth', 560, 900, .2, .05, 0, 2400); S.tone('sawtooth', 900, 820, .45, .05, .2, 2400); S.tone('sawtooth', 820, 460, .4, .04, .65, 2000); }
  function snore(S) { S.tone('sawtooth', 68, 52, 1.1, .035, 0, 260); S.tone('sine', 150, 110, .7, .015, .3, 600); }
  const LULL = [[440, .5], [523, .5], [494, .5], [440, .5], [392, .75], [330, .25], [392, .5], [440, 1], [440, .5], [392, .5], [349, .5], [330, .5], [294, .5], [330, .5], [220, 1.2]];
  function lullaby(S, v = 1) { let t = 0; for (const [f, d] of LULL) { S.tone('triangle', f, f * .998, d * 1.05, .045 * v, t, 1700); S.tone('sine', f / 2, f / 2, d, .02 * v, t, 900); t += d * .85; } }

  /* ---------- 头骨灯 ---------- */
  const SKULLS = [[3, 2], [6, 2], [9, 2], [15, 2], [18, 2], [4, 11], [7, 11], [14, 11], [17, 11], [2, 5], [2, 8], [19, 5], [19, 8]];
  function setSkulls(S, on, seq) {
    SKULLS.forEach((p, i) => { const e = S.ent('sk' + i); if (!e || e.s.empty) return; e.off = !on; if (on && seq) ignite(S, i % 9); });
  }

  /* ---------- 光线与环境声 ---------- */
  function mood(S) {
    const a = S.f.act, m = S.map, n = !!S.f.night;
    let d = null, r = null;
    if (m === 'home') { if (a === 'pro') d = .55; else if (a === 'home') { d = .94; r = 1.5; } else { d = .9; r = 1.3; } }
    if (m === 'forest') { const L = [.86, .55, .18, .82]; d = a === 'chase' ? .94 : a === 'dawn' ? .5 : L[S.f.fl || 0]; if (a === 'chase') r = 1.1; }
    if (m === 'yard') d = a === 'chase' ? .74 : n ? .64 : .16;
    if (m === 'hut') d = n ? .72 : .3;
    S.dark(d); S.plr(r);
    if (m === 'yard') S.amb(a === 'chase' ? 'drone' : n ? 'night' : 'wind');
    if (m === 'forest') S.amb(a === 'chase' ? 'drone' : 'wind');
    if (m === 'hut') S.amb('fire');
    if (m === 'home') S.amb(a === 'pro' ? 'room' : 'wind');
    for (const id of ['hwin1', 'hwin2']) { const w = S.ent(id); if (w) w.lit = !n; }
  }

  /* ---------- 家务 ---------- */
  function setDay(S, day) {
    S.f.day = day; S.f.tk = { sw: 0, ck: 0, ws: 0, so: 0 }; S.f.cookT = 0; S.f.dollT = 0; S.f.night = false;
    PILES[day].forEach((p, i) => S.place('lt' + i, p[0], p[1])); S.hide('lt5'); S.hide('lt6');
    const pe = S.ent('pech'); pe.s.yaga = false; pe.s.pot = false; pe.s.cooked = false;
    const hp = S.ent('heap'); hp.s.kind = day === 'd1' ? 'wheat' : 'poppy'; hp.s.done = false; hp.s.doll = false; S.show('heap');
    const tr = S.ent('trough'); tr.s.water = false; tr.s.washed = false; S.ent('line').s.hung = false;
    S.take('water'); S.take('linen');
  }
  const need = S => 5 + (S.f.tk.ex || 0);   // 要扫的堆数（念错咒时小屋会多踢出一两堆）
  const allDone = S => { const t = S.f.tk; return t && t.sw >= need(S) && t.ck === 2 && t.ws === 2 && t.so === 2; };
  function undone(S) {
    const t = S.f.tk, L = [];
    if (t.sw < need(S)) L.push('院子'); if (t.ck < 2) L.push('饭'); if (t.ws < 2) L.push('衣服'); if (t.so < 2) L.push(S.f.day === 'd1' ? '麦子' : '罂粟籽');
    return L.join('、');
  }
  function tasksGoal(S) {
    const t = S.f.tk, L = [];
    const back = !S.ent('hut').s.front;
    if (back) return '小屋背过身去了——对它念摇篮曲里那句话' + (S.coop ? '（双人：一人翻笺念歌词，一人点词）' : '');
    if (t.sw < need(S)) L.push(S.has('broom') ? `扫院子（剩${need(S) - t.sw}堆）` : '扫院子');
    if (t.ck < 2) L.push(t.ck === 1 ? '等锅炖好' : '做饭');
    if (t.ws < 2) L.push(t.ws === 1 ? '晾衣服' : '洗衣服');
    if (t.so < 2) L.push(t.so === 1 ? '娃娃在挑（别进屋）' : S.f.day === 'd1' ? '挑麦子' : '挑罂粟籽');
    return (L.length ? L.join('·') : '活都干完了') + (S.coop ? '（双人：一人看《吩咐》，一人干）' : '');
  }
  const refresh = S => { if (S.f.act === 'd1' || S.f.act === 'd2') S.goal(tasksGoal(S)); };
  const isDay = S => S.f.act === 'd1' || S.f.act === 'd2';

  /* 联机时提示轮流操作 */
  function handoff(S, what) { if (S.coop) S.toast('联机：按 T（或点交换按钮）把操作交给同伴——' + what); }

  /* ---------- 娃娃 ---------- */
  async function askDoll(S) {
    if (!S.has('doll')) return S.narr('口袋里空空的——娃娃还坐在那一堆上呢。');
    if (!S.has('bread')) return S.narr('娃娃不吃东西，是不会开口的。\n桌上还有你那块面包皮。');
    chime(S);
    if (S.once('rite')) await S.narr(['你从口袋里掏出那个小木头娃娃，掰下一点面包皮，塞到她嘴边。', '「吃吧，小娃娃，吃一点，听听我的苦处。」', '娃娃的眼睛，像两只萤火虫那样，亮了。']);
    else await S.narr('你掰下一点面包皮喂她。「吃吧，小娃娃……」\n她的眼睛亮了起来。');
    const a = S.f.act, W2 = S.ent('hut'), t = S.f.tk || {};
    let L;
    if (a === 'home') { S.f.dollHome = true; L = ['别怕，瓦西丽莎。去吧。', '只要我在你口袋里，什么也伤不了你。', '路上有人骑着马从你身边过去——别跟他们说话，只管往东走。']; }
    else if (a === 'forest') L = ['往北，上坡那条。', '往东那条小道走到头，只有扫过的地，和没人收的骨头。'];
    else if (a === 'arrive') L = ['等着。天一黑，她就回来。', '她问什么，你就照实说。'];
    else if (a === 'n1' || a === 'n1b') L = ['睡吧，瓦西丽莎。', '早晨比晚上聪明。'];
    else if (isDay(S) && !W2.s.front) {
      const k = S.f.spBad || 0;
      if (k >= 3) L = ['「背朝树林，面朝我。」', '——就这么念。'];
      else if (k >= 2) L = ['你妈妈唱到「朝着那树林」的时候，点的是你哪儿？', '唱到「朝着我」的时候，又点的是哪儿？'];
      else L = ['小屋跟人一样：迎客拿脸，送客拿背。', '它现在拿背对着你。你妈妈的摇篮曲里，有让它转身的话。'];
    }
    else if (a === 'd1' && !S.f.catAway) L = ['屋里那只黑猫，是她的眼睛。它看见什么，晚上就告诉她什么。', '它饿了好些年了。锅里炖好了肉，给它捞一块。'];
    else if (isDay(S) && t.so === 0) L = a === 'd2' ? ['费工夫的活先开头：锅先坐上，我先放下。', '然后你就别回屋了——扫院子、洗衣服，都在外头。'] : ['把我放在麦堆上，你出去干别的活。', '没人看着，我才动得了。'];
    else if (isDay(S)) L = ['院门的门轴干得吱吱叫，看门的狗饿得只剩骨头，门边的白桦，风一吹就抽人眼睛。', '它们给她干了一辈子活，谁也没得过她一点好处。'];
    else if (a === 'n2') L = ['她今晚会让你问。', '问你在外面看见的。屋里的事，一个字也别问。问够了，就闭上嘴。'];
    else L = ['……', '早晨比晚上聪明。'];
    await S.say('娃娃', L, { style: 'whisper' });
  }

  /* ---------- 小屋转身的咒语（密码盘） ---------- */
  async function spell(S) {
    const kp = await S.keypad('对着小屋念：\n「小木屋，小木屋，（　）朝（　），（　）朝（　）！」\n按顺序点四个词', ['背', '面', '树林', '我', '太阳', '河'], 4, { sep: ' ' });
    if (kp == null) return;
    const h = S.ent('hut');
    if (SPELL_OK.includes(kp)) {
      stomp(S, 3); S.shake(700, 2);
      h.s.front = true; S.f.spellKnown = true;
      if (isDay(S) && S.f.act === 'd2') S.toast('小屋转过来了，门对着你蹲了下来。');
      else await S.narr('小屋「嘎吱嘎吱」地，在鸡腿上转了过来。\n门正对着你，它蹲了下来。');
      refresh(S);
      return;
    }
    const v = kp.split(' '), n = bump(S, 'spBad');
    stomp(S, 1); S.shake(300, 1);
    const t = S.f.tk, kick = t && (t.ex || 0) < 2;   // 念错的代价：鸡腿一蹬，往院子里踢出一堆土
    if (kick) { t.ex = (t.ex || 0) + 1; const sp = [[7, 6], [12, 7]][t.ex - 1]; S.place('lt' + (4 + t.ex), sp[0], sp[1]); S.sfx('thud'); }
    let why;
    if (v.includes('太阳') || v.includes('河')) why = '小屋的鸡腿挪了挪，像是没听懂：这院子里，哪来的太阳和河？';
    else if (v[0] === v[2]) why = '两头都要它拿一个样子对着……小屋原地打了个转，又转回去了。';
    else if ((v[0] === '面' && v[1] === '树林') || (v[0] === '背' && v[1] === '我') || (v[2] === '面' && v[3] === '树林') || (v[2] === '背' && v[3] === '我')) why = '小屋动也不动。\n它现在就是脸朝着树林、背朝着你的——你只是把它这会儿的样子念了一遍。';
    else why = '小屋只是抖了抖身上的木头，一动不动。';
    if (S.f.act === 'd2') { S.toast(why.split('\n').pop() + (kick ? '　鸡腿一蹬，又踢出一堆土。' : '')); if (n >= 2) S.toast('「背朝树林，面朝我。」——娃娃在口袋里小声说。'); refresh(S); return; }
    await S.narr(why + (kick ? '\n\n鸡腿不耐烦地一蹬，「噗」地往院子里踢出一大堆土——\n又多了一堆要扫。' : ''));
    refresh(S);
    if (n === 2) await S.think('……妈妈的摇篮曲。继母家纺车上，还缠着她教你的那句。\n（柴垛后面没人看见，也可以问问娃娃）');
    else if (n === 3) await S.think('摇篮曲里，唱到「朝着那树林」，妈妈点的是你的后脑勺；唱到「朝着我」，点的是你的脑门。\n后脑勺……脑门……');
    else if (n >= 4) await S.think('后脑勺是背，脑门是脸。\n「背朝树林，面朝我。」');
  }

  /* ---------- 开场 ---------- */
  async function prologue(S) {
    S.f.act = 'pro'; mood(S);
    S.give('doll', true);
    await S.narr(['秋天的晚上。屋里只点着一根蜡烛，三个姑娘守着它干活：', '大姐织花边，二姐织袜子，你坐在纺车前纺线。']);
    await S.say('继母', '我去睡了。活儿不干完，谁也别睡。', {});
    S.walk('step', [11, 2], 3).then(() => S.hide('step'));
    await S.narr('临睡前，她亲手把炉膛里最后一点炭火捅灭了。');
    await S.wait(500);
    await S.narr('蜡烛越烧越短。大姐拿起剪子，去剪烛芯——');
    await S.walk('sis1', [4, 5], 2); S.face('sis1', 3);
    S.ent('candle').off = true; S.sfx('whisper'); S.f.act = 'home'; mood(S); S.shake(200, 1);
    await S.say('大姐', '哎呀。（她一点也不慌）灭了。');
    await S.say('二姐', '炉子也灭了。家里一点火星都没有了。');
    await S.say('大姐', ['得去借火。上哪儿借呢？', '这附近，只有林子里芭芭雅嘎那儿有火。']);
    await S.say('二姐', '我不去。我的织针亮，我看得见。');
    await S.say('大姐', ['我也不去，我的花边针也亮。', '——瓦西丽莎，你去！']);
    S.bubble('pl', '!', 900);
    await S.say('继母（里屋）', '听见没有？去芭芭雅嘎那儿借火。借不来，就别回来。', { style: 'big' });
    await S.think('口袋里，妈妈留下的娃娃硌着你的腿。');
    S.goal('带上面包皮，问问娃娃，出门去林子里借火');
  }

  /* ---------- 林子（去时） ---------- */
  async function forestIn(S) {
    S.f.act = 'forest'; S.f.fl = 0; mood(S);
    await S.narr('你在林子里走了一整夜。树根绊着脚，回头一看，连来时的路都看不见了。');
    glide(S, 'rF', 14, 8, -3, 8, 1.8, { col: '#ecebe4', dir: 1 }); hooves(S, 1.8);
    await S.wait(1900);
    S.f.fl = 1; mood(S);
    await S.narr(['一个骑马的人从你身边奔了过去。', '他一身白，马是白的，马具也是白的。\n他跑过去的地方，天亮了。']);
    S.goal('穿过林子，往东走');
  }
  async function redRider(S) {
    const p = S.pl;
    glide(S, 'rF', p.x + 12, 12, p.x - 10, 12, 1.7, { col: '#b8282a', dir: 1 }); hooves(S, 1.7);
    await S.wait(1700);
    S.f.fl = 2; mood(S);
    await S.narr('又一个骑马的人奔了过去：一身红，马也是红的。\n太阳升起来了。');
  }
  async function blackRider(S) {
    const p = S.pl;
    glide(S, 'rF', p.x - 8, 3, 50, 3, 1.8, { col: '#1a1820', dir: 2 }); hooves(S, 1.8, .07);
    await S.wait(1800);
    S.f.fl = 3; mood(S);
    await S.narr(['走到天快黑的时候，第三个骑马的人从你身边奔过去：', '一身黑，马也是黑的，一直奔到前面，像是钻进了地里。\n夜来了。']);
    await S.think('前面……有亮光。');
    S.goal('往前走，去有亮光的地方');
  }

  /* ---------- 院子：到达与芭芭雅嘎回来 ---------- */
  async function arrive(S) {
    S.f.act = 'arrive'; S.f.night = true; mood(S);
    S.dark(.95);
    await S.narr('林子到这儿，忽然空了。空地上围着一圈篱笆——\n是人的骨头扎成的。');
    S.focus(9, 5);
    setSkulls(S, true, true); await S.wait(1200);
    S.dark(.64);
    await S.narr(['篱笆的每一根桩子上，都插着一个头骨。', '天一黑，那些空眼窝里，一个接一个地，亮了起来。']);
    S.focus(null);
    S.goal('在院门口等着（门上有东西）');
  }
  async function yagaArrives(S) {
    S.amb('wind'); S.shake(1600, 2); S.sfx('thud');
    await S.narr('林子忽然响了起来。树枝嘎吱嘎吱地叫，枯叶刮得满天都是。');
    whoosh(S);
    glide(S, 'yagaY', 10, 17, 12, 13, 1.1, { hide: false }); await S.wait(1200);
    await S.scare('face', { face: 'yaga', dur: 1.1 });
    await S.narr('芭芭雅嘎坐在一只大石臼里飞来了。\n她用捣杵赶着臼走，用扫帚把身后的痕迹扫掉。');
    await S.say('芭芭雅嘎', '呸，呸！一股活人的气味！谁在那儿？', { style: 'big' });
    await S.ask('她的鼻子往你这边伸过来。', ['「是我，奶奶。继母的女儿们，叫我来跟您借火。」']);
    await S.say('芭芭雅嘎', ['好。我认得她们。', '先在我这儿住着，给我干活。干得好，就给你火；', '干不好——（她咂了咂嘴，嘴里是一排铁牙）就把你吃了。']);
    S.face('yagaY', 3);
    await S.say('芭芭雅嘎', '我结实的门闩，打开！我宽大的门，敞开！', { style: 'big' });
    creak(S); S.ent('gate').open = true; S.ent('gate').solid = false;
    await S.narr('门闩上那几只手，一只一只松开了。\n锁上的那张嘴，咂了咂牙，张开了。');
    await S.fade(1, 600);
    S.hide('yagaY'); S.show('mortar'); S.ent('gate').open = false; S.ent('gate').solid = true;
    S.place('yaga', 6, 3, 0); S.f.act = 'n1in';
    await S.go('hut', 6, 6, 3, { fade: false }); await S.fade(0, 600);
    await S.say('芭芭雅嘎', ['把炉子里的东西都端上来。', '我饿了。']);
    S.goal('把炉子里的饭端给她');
  }
  async function dinner1(S) {
    await S.narr(['你从炉膛里一样一样往外端：一大锅菜汤，三只烤鹅，一整头烤猪，一笼屉饼，一罐蜂蜜酒……', '够十个人吃的。']);
    S.sfx('thud'); await S.wait(400); S.sfx('cut'); await S.wait(300); S.sfx('cut');
    await S.narr('她吃得一点不剩，连骨头都嚼碎了。\n只给你留了一口汤，一小块面包皮。');
    if (!S.has('bread')) S.give('bread');
    await S.say('芭芭雅嘎', ['明天我一早出门。', '你把院子扫干净，饭做好，衣服洗了晾上。', '再把那一斗麦子里的黑籽，一粒一粒挑干净。', '我回来，要是有一样没做——']);
    S.sfx('cut');
    await S.narr('她没说完，只是咂了咂铁牙。');
    await S.note('orders');
    S.hide('yaga'); S.ent('pech').s.yaga = true;
    await S.narr('她爬上炉炕，打起了呼噜。');
    S.f.act = 'n1';
    S.goal('到门边角落的草垫上睡下（睡前可以问问娃娃）');
    S.cp();
  }

  /* ---------- 早晨：她出门，小屋转过身去 ---------- */
  async function morning(S, day) {
    await S.fade(1, 700);
    setDay(S, day); S.f.act = 'morn';
    S.place('yaga', 6, 3, 0); S.pos(6, 6, 3);
    mood(S); await S.fade(0, 700);
    if (day === 'd1') await S.say('芭芭雅嘎', ['我出门了。活儿都记住了？', '扫院子，做饭，洗衣服，挑麦子。我回来以前，样样都得做完。']);
    else await S.say('芭芭雅嘎', ['昨天的活儿，今天照样做一遍。', '那一斗罂粟籽里掺了土——你给我一粒一粒挑出来，我要拿它榨油。', '太阳落山以前，样样都得做完。']);
    S.hide('yaga');
    await S.go('yard', 9, 6, 0);
    S.hide('mortar'); whoosh(S); glide(S, 'yagaY', 12, 4, 15, -4, 1.3); S.shake(600, 2);
    await S.wait(1000);
    glide(S, 'rY', -3, 1, 25, 1, 2.2, { col: '#ecebe4', dir: 2 }); hooves(S, 2.2);
    await S.wait(1600);
    setSkulls(S, false);
    await S.narr('她骑着石臼飞走了。篱笆外，骑白马的白衣人奔了过去——\n天亮了。头骨的眼睛，一个一个灭了。');
    stomp(S, 2); S.shake(700, 2); S.ent('hut').s.front = false;
    await S.narr('鸡腿小屋跺了两下脚，嘎吱嘎吱地转过身去——\n拿背对着你，门朝着林子。');
    if (day === 'd1') await S.think('灶、麦子、扫帚……全在那扇门后头。');
    S.f.act = day;
    S.goal(tasksGoal(S));
    handoff(S, day === 'd1' ? '一人翻笺念摇篮曲和《吩咐》，一人去干活' : '一人盯着太阳念活儿，一人跑');
  }
  function startD2(S) {
    S.f.red = false;
    S.timer(D2_TIME, '日落', d2Fail, { during: true });
    S.toast('太阳落山以前，样样都得做完！');
  }

  /* ---------- 黄昏：她回来 ---------- */
  async function dusk(S) {
    const d1 = S.f.day === 'd1';
    S.clearTimer(); S.f.act = d1 ? 'dusk1' : 'dusk2'; S.f.night = true;
    if (S.map !== 'yard') await S.go('yard', 9, 6, 0);
    mood(S); S.focus(10, 4);
    glide(S, 'rY', -3, 1, 25, 1, 2, { col: '#1a1820', dir: 2 }); hooves(S, 2, .07);
    await S.wait(1500);
    setSkulls(S, true, true);
    await S.narr('骑黑马的黑衣人从篱笆外奔了过去。\n天黑了。篱笆上的头骨，一个接一个睁开了眼睛。');
    whoosh(S); S.shake(900, 2); glide(S, 'yagaY', 12, -4, 12, 4, 1.1, { hide: false });
    await S.wait(1200);
    S.hide('yagaY'); S.show('mortar'); S.place('yagaW', 12, 5, 0); S.focus(null);
    await S.say('芭芭雅嘎', d1 ? '……都做完了？' : '又都做完了？');
    await S.walk('yagaW', [7, 6], 4); await S.walk('yagaW', [14, 8], 4); S.face('yagaW', 'pl');
    await S.narr('她把院子、锅、晾着的衣服一样一样看过去，挑不出一点毛病。\n她不太高兴。');
    if (d1) {
      await S.say('芭芭雅嘎', '猫！你今天看见什么了？', { style: 'big' });
      await S.narr('柴垛上，黑猫把那块骨头往肚子底下一藏，眯起了眼睛。');
      await S.say('黑猫', '……什么也没看见。');
    }
    if (!d1) {
      S.place('cat', 10, 6, 1);
      await S.narr('她进屋的时候，那只黑猫从柴垛后面溜了过来，蹭了蹭你的腿。');
      await S.say('黑猫', ['你给过我骨头，我也给你点东西。', '她今晚会放你走——可她会追。', '她追近了，先往身后扔这条毛巾，再扔这把梳子。'], { style: 'whisper' });
      S.give('towel', true); S.give('comb', true); S.toast('获得：毛巾、梳子');
      S.place('cat', 18, 8, 0);
    }
    S.hide('yagaW');
    S.place('yaga', 9, 4, 2);
    await S.go('hut', 6, 6, 3);
    S.focus(10, 4);
    await S.say('芭芭雅嘎', d1 ? '我忠实的仆人们，我亲爱的朋友们——把麦子磨了！' : '我忠实的仆人们，我亲爱的朋友们——把罂粟籽榨了油！', { style: 'big' });
    clap(S);
    for (const id of ['hd0', 'hd1', 'hd2']) { S.ent(id).alpha = 0; S.alpha(id, 1, 500); }
    await S.wait(700);
    await S.scare('flash', { sfx: 'whisper', dur: .6 });
    await S.narr('三双手从半空里伸了出来——只有手，没有胳膊，也没有人。');
    S.hide('heap');
    for (const id of ['hd0', 'hd1', 'hd2']) S.alpha(id, 0, 400);
    await S.narr(d1 ? '它们捧起那堆麦子，一眨眼，连麦子带手，全不见了。\n屋角传来石磨转动的声音。' : '它们捧起那堆罂粟籽，一眨眼就不见了。\n过了一会儿，桌上多了一罐黑亮黑亮的油。');
    S.focus(null); S.place('yaga', 6, 3, 0);
    if (d1) {
      await S.narr('她又吃了够十个人吃的晚饭，又只给你留了一口汤、一块面包皮。');
      S.hide('yaga'); S.ent('pech').s.yaga = true;
      await S.narr('她爬上炉炕，呼噜声又响了起来。');
      S.f.act = 'n1b';
      S.goal('到草垫上睡下（明天还有活）');
      S.cp();
    } else {
      await S.narr('她吃完了够十个人吃的晚饭，却没有上炕。\n她坐在桌边，一双眼睛盯着你。');
      S.f.act = 'n2';
      S.goal('到桌边去——她有话要问（可以先去柴垛后面问问娃娃）');
      S.cp();
    }
  }

  async function d2Fail(S) {
    S.f.act = 'd2fail'; DEAD.d2++;
    const left = undone(S);
    if (S.map !== 'yard') await S.go('yard', 9, 6, 0);
    S.f.night = true; mood(S); setSkulls(S, true, true);
    glide(S, 'rY', -3, 1, 25, 1, 1.8, { col: '#1a1820', dir: 2 }); hooves(S, 1.8, .07);
    await S.wait(1300);
    whoosh(S); glide(S, 'yagaY', 12, -4, S.pl.x + 1, S.pl.y - 1, 1, { hide: false }); await S.wait(1100);
    await S.say('芭芭雅嘎', `${left}……没做完？`, { style: 'big' });
    await S.scare('face', { face: 'yaga', dur: 1.1 });
    await S.die(`骑黑马的人过去的时候，${left}还没做完。\n\n她咂了咂铁牙：「说好了的。」`, '活没干完');
  }

  /* ---------- 第二夜：三个问题 ---------- */
  async function questions(S) {
    S.face('yaga', 'pl');
    await S.say('芭芭雅嘎', ['你怎么光瞪着眼，一句话也不说？', '想问什么，就问吧。', '不过——不是每个问题都有好下场。知道得多，老得快。']);
    const Q = { w: '「我来的路上，一个骑白马的白衣人从我身边跑过去……他是谁？」', r: '「后来，一个骑红马的红衣人……他是谁？」', b: '「到您门口的时候，一个骑黑马的黑衣人……他是谁？」', h: '「每天晚上从半空里伸出来的那三双手……是谁的？」' };
    const A = { w: ['那是我的白昼，晴朗的白天。'], r: ['那是我的红太阳。'], b: ['那是我的黑夜。'] };
    const done = new Set();
    let n = 0;
    for (;;) {
      if (n >= 3) {
        const r = await S.ask('她眯起眼：「还有吗？」', ['「没有了。」', '「还有一个——」']);
        if (r === 1) return fourthEnd(S);
        break;
      }
      const ks = ['w', 'r', 'b', 'h'].filter(k => !done.has(k));
      const opts = ks.map(k => Q[k]).concat([n ? '「……没有了。」' : '「我没什么要问的。」']);
      const i = await S.ask(n ? '她等着。' : '她把手搁在桌上，等着。', opts);
      if (i >= ks.length) break;
      const k = ks[i];
      if (k === 'h') return insideEnd(S);
      done.add(k); n++;
      await S.say('芭芭雅嘎', A[k]);
    }
    S.f.qn = n;
    if (n) await S.say('芭芭雅嘎', ['好在你只问了院子外头看见的，没问屋里的事。', '我屋里的事，谁往外带，我就吃了谁。']);
    else await S.say('芭芭雅嘎', '一个也不问？……也好。嘴紧的人，活得长。');
    await S.say('芭芭雅嘎', '现在轮到我问你了：我交代的活，你是怎么干完的？');
    const r = await S.ask('炉膛里的炭「啪」地响了一声。', ['「是我妈妈的祝福帮了我。」', '「是我自己干的。」', '「是……我口袋里的娃娃。」']);
    if (r === 1) return liarEnd(S);
    if (r === 2) return dollEnd(S);
    return blessed(S);
  }
  async function insideEnd(S) {
    await S.narr('她的手停住了。屋里一下子静得能听见炉膛里的炭响。');
    await S.say('芭芭雅嘎', ['屋里的事？', '谁把我屋里的事往外带，我就吃了谁。'], { style: 'big' });
    for (const [id, x, y] of [['hd0', S.pl.x - 1, S.pl.y], ['hd1', S.pl.x + 1, S.pl.y], ['hd2', S.pl.x, S.pl.y - 1]]) { S.place(id, x, y); S.ent(id).alpha = 0; S.alpha(id, 1, 300); }
    S.sfx('whisper'); await S.wait(600); clap(S); S.fx('black', { dur: 1.6 });
    await S.end({ id: 'inside', bad: true, title: '屋里的事', text: '那三双手是谁的，你到底知道了。\n\n第二天早上，篱笆上那根空桩子，不再空着。\n天一黑，它的两个眼窝也亮了起来。' });
  }
  async function fourthEnd(S) {
    await S.say('芭芭雅嘎', '第四个？', { style: 'big' });
    S.sfx('laugh'); S.shake(400, 2);
    await S.say('芭芭雅嘎', ['我说过：知道得多，老得快。', '你呀——就用不着等到老了。']);
    S.fx('red', { dur: 1.4 });
    await S.end({ id: 'fourth', bad: true, title: '第四个问题', text: '三个问题，她都答了。\n第四个，她没有答——她用不着答了。\n\n骨头篱笆上那根空桩子，从此不空了。' });
  }
  async function liarEnd(S) {
    await S.say('芭芭雅嘎', '你自己？一夜挑完一斗麦子，一天挑完一斗罂粟籽？');
    await S.narr('她凑过来，鼻尖差一点碰到你的鼻尖。她闻了闻。');
    await S.say('芭芭雅嘎', '撒谎的嘴。正好——我的院门上，还缺一把锁。', { style: 'big' });
    S.sfx('cut'); S.fx('red', { dur: 1.4 });
    await S.end({ id: 'liar', bad: true, title: '撒谎的嘴', text: '院门上那把锁，是一张长着尖牙的嘴。\n后来，它旁边又多了一把。\n\n从林子边走过的人，有时会听见那扇门上，有个姑娘的声音一遍一遍地说：\n「是我自己干的。是我自己干的。」' });
  }
  async function dollEnd(S) {
    await S.say('芭芭雅嘎', '娃娃？拿来我看看。');
    await S.ask('她伸出一只又干又硬的手。', ['（把娃娃交出去）']);
    S.take('doll');
    await S.narr('她捏着娃娃翻过来、翻过去，看了很久。\n娃娃的眼睛，再也没有亮。');
    await S.say('芭芭雅嘎', ['原来是你妈妈的东西。', '好。火给你——娃娃留下。篱笆上空着的那根桩子，就让她替你。']);
    await S.fade(1, 800);
    await S.card('回家', '', '她从篱笆上拔下一个头骨，插在棍子上，塞进你手里。\n那根空桩子上，插上了你的娃娃。\n\n你一个人穿过林子。\n这一回，谁也没有追你。');
    S.fx('black', { dur: 1 });
    await S.end({ id: 'doll', bad: true, title: '没有娃娃的早晨', text: '你把火带回了家。\n\n可从那天起，夜里再也没有谁在你口袋里说话。\n遇到难事，你只能对自己说一遍：\n早晨比晚上聪明。\n\n你总觉得，这一句，你自己说得不太像。' });
  }
  async function blessed(S) {
    await S.say('芭芭雅嘎', '祝福？！', { style: 'big' });
    S.shake(500, 3); S.sfx('thud');
    await S.say('芭芭雅嘎', ['原来是这样！滚，有福气的丫头，从我这儿滚出去！', '我这屋里，用不着有福气的人！']);
    await S.fade(1, 600);
    S.hide('yaga'); S.f.act = 'out';
    S.place('yagaW', 15, 3, 3);
    await S.go('yard', 13, 4, 2, { fade: false }); mood(S); await S.fade(0, 600);
    S.sfx('tear'); S.ent('sk3').s.empty = true; S.ent('sk3').off = true;
    await S.narr('她从篱笆上拔下一个头骨，插在一根棍子上。\n那两只眼睛里的火，一跳一跳的。');
    S.give('skull', true); S.toast('获得：头骨灯');
    S.show('lampY');
    S.face('yagaW', 1);
    await S.say('芭芭雅嘎', ['拿着。这就是火。说给你，就给你了。', '可篱笆上又空出来一根桩子。（她咂了咂铁牙）', '天亮以前，那根桩子上总得插上一个脑袋。那不是我定的规矩，是这片林子的。', '鸡叫以前跑出林子，就算你的。']);
    await S.walk('yagaW', [9, 5], 4); S.hide('yagaW');
    S.sfx('close');
    await S.narr('她回了屋。屋里传来磨牙的声音——\n还有石臼在地上「咚」地一顿。');
    const g = S.ent('gate'); g.open = true; g.solid = false;
    S.pos(9, 6, 0);
    S.f.act = 'chase';
    S.goal('跑！出院门，穿过林子往西（她追近了按调查键往身后扔：毛巾、梳子）');
    S.cp('chase');
    await startChase(S);
  }

  /* ---------- 追逐 ---------- */
  const CS = { on: false };   // 追逐的瞬时状态（不进存档；resume 里重置）
  const yEnt = S => S.ent(S.map === 'forest' ? 'yagaF' : 'yagaY');
  async function startChase(S) {
    if (DEAD.ch && S.once('chHint' + DEAD.ch)) await S.think(DEAD.ch >= 2 ? '跑起来（按住 Shift 或点「跑」），别停。\n她一追近，就按调查键往身后扔——先毛巾，再梳子。别往东边的岔路里钻。' : '这一回，一出院门就扔，别等她贴到背上。');
    Object.assign(CS, { on: true, g: GEN, t: 0, started: false, warned: false, creak: false, bit: false, bite: 0, fAt: null, fWarn: false, blk: null, startAt: CH.startT, birchMsg: false, told: false, dead: false, thump: 0 });
    handoff(S, '跑的人只管跑，另一个人盯着她，喊什么时候扔');
    S.speed(1); S.norun(false);
    const y = S.ent('yagaY'); S.stop('yagaY'); y.hidden = true;
    S.hide('yagaF'); S.stop('yagaF');
    S.show('thrY'); S.show('thrF');
    S.show('lampY'); S.show('lampF');
    S.toast('跑！');
  }
  function startY(S, id, x, y, spd) {
    S.place(id, x, y); S.ent(id).dir = 0;
    S.chase(id, { spd, always: true, catch: caught });
  }
  async function caught(S) {
    if (!CS.on) return;
    CS.on = false; DEAD.ch++;
    S.stop('yagaY'); S.stop('yagaF'); S.speed(1);
    await S.scare('face', { face: 'yaga', dur: 1.0 });
    const used = !S.has('towel') && !S.has('comb'), none = S.has('towel') && S.has('comb');
    await S.die('石臼「咚」地一声落在你身后。\n一只又干又硬的手，揪住了你的辫子。\n\n' + (none ? '（毛巾和梳子，一样也没扔出去。她追近时按调查键，往身后扔。）' : used ? '（东西都扔了，可你停下来的时候太多了。一直跑。）' : '（还有一样东西没扔。）'), '篱笆上的空桩子');
  }
  async function doThrow(S) {
    if (S.f.act !== 'chase' || !CS.on) return;
    if (S.map !== 'forest') { S.toast('院子里太敞，拦不住她——进了林子再扔！'); return; }
    const y = S.ent('yagaF');
    if (!y || y.hidden || !y.chase) { S.toast('她还没追进林子——先跑！'); return; }
    if (CS.blk) { S.toast('身后那道还没散——接着跑！'); return; }
    const kind = S.has('towel') ? 'towel' : S.has('comb') ? 'comb' : null;
    if (!kind) { S.toast('手里什么也没有了——跑！'); return; }
    if (!block(S, y, kind)) { S.toast('她已经到身后了——来不及了！'); return; }
    S.take(kind);
    if (kind === 'towel') { S.sfx('splash'); S.toast('你把毛巾往身后一扔——它落地就变成了一条又宽又深的河！'); }
    else { S.sfx('thud'); S.toast('你把梳子往身后一扔——地上「呼」地长出一片密密的林子！'); }
  }
  function bfsDist(m, sx, sy, bl) {
    const D = new Map(), q = [[sx, sy]]; D.set(sx + ',' + sy, 0);
    while (q.length) {
      const [x, y] = q.shift(), d = D.get(x + ',' + y); if (d > 60) continue;
      for (const [dx, dy] of DIRS) { const nx = x + dx, ny = y + dy, k = nx + ',' + ny; if (D.has(k) || (bl && bl.has(k)) || !passable(m, nx, ny, null)) continue; D.set(k, d + 1); q.push([nx, ny]); }
    }
    return D;
  }
  function block(S, y, kind) {
    const m = W.maps[S.map], p = S.pl;
    let yx = Math.round(y.px / TS), yy = Math.round(y.py / TS);
    if (Math.abs(yx - p.x) + Math.abs(yy - p.y) <= 2) return false;
    const dP = bfsDist(m, p.x, p.y), dY = bfsDist(m, yx, yy);
    const cells = new Set();
    const dPY = dY.get(p.x + ',' + p.y) ?? 999;   // 她到你的距离；比这个近的格子，都在你身后（她那一边）
    const add = (a, b) => { for (const [k, d] of dP) if (d >= a && d <= b && (dY.get(k) ?? 999) < dPY - 1) cells.add(k); };
    add(2, 3);
    if (!cells.size) return false;
    if (cells.has(yx + ',' + yy) || (dP.get(yx + ',' + yy) ?? 99) <= 4) {   // 她正站在河上：被冲回去几格
      let best = null;
      for (const [k, d] of dP) if (d >= 6 && d <= 8 && (dY.get(k) ?? 999) < dPY && (!best || dY.get(k) < best[1])) best = [k, dY.get(k)];
      if (!best) return false;
      const [bx, by] = best[0].split(',').map(Number); const c = y.chase; S.place(y.id, bx, by); y.chase = c; yx = bx; yy = by;
    }
    if (bfsDist(m, yx, yy, cells).has(p.x + ',' + p.y)) add(4, 5);
    const ch = kind === 'towel' ? '~' : 'T', list = [];
    for (const k of cells) { const [x, yv] = k.split(',').map(Number); const i = yv * m.w + x; list.push([x, yv, m.mods[i] ?? m.rows[yv][x]]); S.tile(x, yv, ch); }
    CS.blk = { list, t: kind === 'towel' ? CH.towelT : CH.combT, kind, gn: 0 };
    S.freeze(y.id, true);
    return true;
  }
  function unblock(S) {
    const b = CS.blk; if (!b) return; CS.blk = null;
    for (const [x, y, c] of b.list) S.tile(x, y, c, 'forest');
    S.freeze('yagaF', false);
    S.toast(b.kind === 'towel' ? '身后传来牛喝水的声音……河被喝干了。她又追上来了！' : '身后「咔嚓咔嚓」——她把林子啃出了一条路。又追上来了！');
  }
  function chaseTick(S, dt) {
    if (S.f.act !== 'chase' || !CS.on) return;
    if (CS.g !== GEN) { CS.on = false; return; }
    CS.t += dt;
    const p = S.pl, m = S.map;
    const te = S.ent(m === 'forest' ? 'thrF' : 'thrY'); if (te) { te.px = p.x * TS; te.py = p.y * TS; te.x = p.x; te.y = p.y; }
    if (m === 'yard') {
      const g = S.ent('gate'), dog = S.ent('dog'), bir = S.ent('birch');
      if (!CS.creak && p.y >= 11 && !g.s.oiled) { CS.creak = true; creak(S, 1.6); S.toast('门轴「吱——呀——」一声尖叫：「她跑啦！」'); if (!CS.started) CS.startAt = Math.min(CS.startAt, CS.t + CH.creakLead); }
      if (!CS.bit && !dog.s.fed && p.x >= 10 && p.x <= 12 && p.y >= 10 && p.y <= 11) { CS.bit = true; CS.bite = CH.biteT; S.pos(p.x, p.y, p.dir); growl(S); S.toast('看门狗一口咬住了你的裙角！'); }
      let spd = 1;
      if (!bir.s.ribbon && p.x >= 8 && p.x <= 10 && p.y >= 7 && p.y <= 10) { spd = CH.birch; if (!CS.birchMsg) { CS.birchMsg = true; S.tone('triangle', 3000, 900, .12, .04, 0, 5000); S.toast('白桦的枝子劈头盖脸抽过来，你睁不开眼！'); } }
      if (CS.bite > 0) { CS.bite -= dt; spd = .001; if (CS.bite <= 0) { S.pos(p.x, p.y, p.dir); spd = 1; } }   // 被咬住：原地停一下（结束时取消那一步）
      S.speed(spd);
      if (!CS.started) {
        if (!CS.warned && CS.t >= CS.startAt - .8) { CS.warned = true; S.sfx('thud'); S.shake(300, 2); S.toast('身后，小屋的门「砰」地撞开了——'); }
        if (CS.t >= CS.startAt) { CS.started = true; whoosh(S, .8); startY(S, 'yagaY', 9, 5, CH.vy); }
      }
      if (p.y >= 15 && !S.busy) S.run(toForest);
    } else if (m === 'forest') {
      S.speed(1);
      const y = S.ent('yagaF');
      if (!y.hidden && y.chase && !CS.told) { CS.told = true; S.toast('她追进林子了！按调查键（E / 空格 / A）往身后扔毛巾'); }
      if (p.x >= 33 && p.y >= 10 && !CS.dead) { CS.dead = true; S.toast('这条是扫过的死路！往回，往北！'); }
      if (CS.fAt != null && y.hidden) {
        if (!CS.fWarn && CS.t >= CS.fAt - .8) { CS.fWarn = true; whoosh(S, .7); S.toast('身后的林子里，树枝一根一根地断了——'); }
        const far = Math.abs(p.x - 46) + Math.abs(p.y - 3) >= 3;
        if (CS.t >= CS.fAt && (far || CS.t >= CS.fAt + 2.5)) startY(S, 'yagaF', 47, 3, CH.vf);
      }
      if (CS.blk) {
        CS.blk.t -= dt;
        if (CS.blk.kind === 'comb' && (CS.blk.gn -= dt) <= 0) { CS.blk.gn = .35; gnaw(S); }
        if (CS.blk.kind === 'towel' && (CS.blk.gn -= dt) <= 0) { CS.blk.gn = .7; S.tone('sine', 95, 70, .4, .05, 0, 400); }
        if (CS.blk.t <= 0) unblock(S);
      }
      if (p.x <= 1 && !S.busy) S.run(escape);
    }
    const y = yEnt(S);
    if (y && !y.hidden && y.chase) {
      const dd = Math.abs(y.px - p.px) + Math.abs(y.py - p.py);
      if ((CS.thump = (CS.thump || 0) - dt) <= 0 && !y.frozen) { CS.thump = .42; const v = clamp(1 - dd / (TS * 14), .04, 1); S.tone('sine', 62, 38, .16, .32 * v, 0); S.tone('square', 180, 90, .04, .04 * v, 0, 500); }   // 捣杵一下一下杵在地上：越近越响
      if (!S.busy && dd <= CH.catchPx) S.run(caught);
    }
  }
  async function toForest(S) {
    if (S.f.act !== 'chase' || !CS.on || S.map !== 'yard') return;
    const y = S.ent('yagaY');
    let lag;
    if (!CS.started) lag = (CS.startAt - CS.t) + 11 / CH.vy;
    else { const yx = Math.round(y.px / TS), yy = Math.round(y.py / TS); lag = (Math.abs(yx - 10.5) + Math.abs(yy - 15)) / CH.vy; }
    S.stop('yagaY'); y.hidden = true; CS.started = true;
    CS.fAt = CS.t + clamp(lag, .9, 5);
    S.speed(1);
    await S.go('forest', 45, 3, 1, { ms: 250 });
  }
  async function escape(S) {
    if (!CS.on) return;
    CS.on = false; S.stop('yagaF'); S.freeze('yagaF', false);
    if (CS.blk) unblock(S);
    S.f.act = 'dawn'; S.f.night = false; S.speed(1); S.hide('thrF'); S.hide('thrY');
    rooster(S);
    glide(S, 'rF', 12, 8, -3, 8, 1.6, { col: '#ecebe4', dir: 1 }); hooves(S, 1.6);
    await S.wait(1200); mood(S);
    await S.narr('身后，鸡叫了。\n骑白马的白衣人从你身边奔了过去——天亮了。');
    const y = S.ent('yagaF');
    if (!y.hidden) await S.narr('石臼在林子边上停住了。\n芭芭雅嘎在树影里站了一会儿，咂了咂铁牙。');
    else await S.narr('林子深处，石臼「咚」地一顿，再也没有往前。');
    await S.say('芭芭雅嘎（远远地）', '……有福气的丫头。', { style: 'whisper' });
    S.hide('yagaF');
    const L = ['风里远远地传来她的骂声——'];
    L.push(S.ent('gate').s.oiled ? '「门！你怎么不吱一声？」\n「我给你干了这么多年，你连一滴油都没给我上过。她给我上了。」' : '「门！叫得好！」\n门轴吱吱呀呀地，像是在笑。');
    L.push(S.ent('dog').s.fed ? '「狗！你怎么不咬她？」\n「你连一块烤焦的面包皮都没给过我。她给了。」' : '「狗！你怎么没把她咬住？」\n那条狗只是呜呜地叫。');
    if (S.ent('birch').s.ribbon) L.push('「白桦！你怎么不抽瞎她的眼睛？」\n「你连一根线都没给我系过。她给我系了红头绳。」');
    L.push('「猫！你怎么不把她的眼睛挠出来？」\n「你连一根骨头都没给我啃过。她给了。」');
    await S.narr(L);
    await S.fade(1, 900);
    await S.card('回家', '', '你又走了一整天。\n头骨插在棍子上，一路替你照着路。\n\n走到家门口的时候，天又黑了。\n窗户里黑洞洞的，一点光也没有。');
    S.f.act = 'home2'; S.f.night = true;
    for (const id of ['sis1', 'sis2']) S.show(id);
    S.place('step', 3, 3, 0); S.place('sis1', 2, 4, 3); S.place('sis2', 4, 4, 3);
    S.hide('thrF'); S.hide('thrY'); S.hide('lampF'); S.hide('lampY'); S.show('lampH');
    await S.go('home', 2, 2, 0, { ms: 600 });
  }

  /* ---------- 结局 ---------- */
  async function homeEnd(S) {
    S.f.act = 'end';
    await S.narr('你把头骨搁在了桌上。');
    S.ent('candle').off = true; S.ent('tskull').hidden = false; S.hide('lampH');
    await S.wait(500);
    await S.scare('face', { face: 'skull', dur: 1.2, sfx: 'sting' });
    await S.narr(['头骨的两只眼睛，直直地盯着继母和她的两个女儿。', '她们往哪儿躲，那两点火就跟到哪儿。']);
    await S.fade(1, 1400);
    let tail = '';
    if (S.f.scr) tail += '\n\n埋头骨的时候，你摸到它的后脑勺上有一道浅浅的刻痕——\n和小屋草垫边墙上那些字，是一个手笔。\n你在土堆前坐了一会儿，跟她说：早晨比晚上聪明。';
    const k = ['gate', 'dog', 'birch'].filter(id => S.ent(id).s.oiled || S.ent(id).s.fed || S.ent(id).s.ribbon).length;
    if (k === 3) tail += '\n\n后来有人说，林子深处那座院子的门，再也不叫了。';
    if (S.f.qn === 0) tail += '\n\n那天晚上，你一个问题也没有问。\n所以直到今天，你也不知道那三个骑马的人是谁。';
    else if (S.f.qn === 3) tail += '\n\n每天早上天亮的时候，你都在心里说一声：\n我的白昼。';
    lullaby(S, .8);
    await S.end({ id: 'fire', title: '借来的火', text: '她们的火，一点也点不着；你的火，整夜没灭。\n\n天亮的时候，屋里只剩下三小堆灰。\n\n你把头骨埋在院子里，锁上门，带着娃娃进城去了。\n（据说后来的事，就是另一个故事了。）' + tail });
  }

  /* ---------- 章节定义 ---------- */
  defChapter({
    id: 'babayaga', n: 18, title: '芭芭雅嘎', sub: '鸡腿上的小屋，骨头扎的篱笆。继母说：家里没火了，去林子里，跟芭芭雅嘎借一点。', origin: '斯拉夫民间传说', color: '#3a2414',
    amb: 'wind', floor: 'wood', wall: 'wood', dark: .6, plr: 3,
    thumb(g, w, h) {   // 月光下鸡腿小屋，骨头篱笆上的头骨亮着眼睛
      const P = (x, y, ww, hh, c) => { g.fillStyle = c; g.fillRect(x, y, ww, hh); };
      P(118, 8, 10, 10, '#e8e2c8'); P(120, 10, 3, 3, '#cfc8a8');
      for (let i = 0; i < 12; i++) P(i * 14, 22 + (i % 3) * 3, 12, 30, '#120e10');
      const lg = '#c89040';
      P(68, 34, 3, 14, lg); P(86, 34, 3, 14, lg); P(64, 47, 5, 2, lg); P(70, 47, 4, 2, lg); P(82, 47, 5, 2, lg); P(88, 47, 4, 2, lg);
      P(66, 31, 6, 4, '#7a5a3a'); P(84, 31, 6, 4, '#7a5a3a');
      P(58, 14, 40, 20, '#5a3e26'); for (let i = 0; i < 5; i++) P(58, 16 + i * 4, 40, 1, '#3a2818');
      for (let i = 0; i < 10; i++) P(76 - 2 - i * 2.4, 4 + i, 4 + i * 4.8, 1, '#3a2a1c');
      P(74, 22, 8, 12, '#2a1810'); P(62, 19, 6, 5, '#e8b860'); P(88, 19, 6, 5, '#e8b860');
      for (let x = 4; x < 160; x += 12) { P(x, 46, 3, 16, '#d8d0b8'); P(x - 2, 43, 7, 5, '#e4dcc4'); P(x - 1, 44, 2, 2, '#ffa030'); P(x + 2, 44, 2, 2, '#ffa030'); }
      P(0, 52, 160, 2, '#b8b098'); P(0, 57, 160, 2, '#b8b098');
      g.fillStyle = 'rgba(255,150,50,.10)'; for (let x = 6; x < 160; x += 12) { g.beginPath(); g.arc(x, 45, 7, 0, 7); g.fill(); }
    },
    endings: { fire: '借来的火', doll: '没有娃娃的早晨', liar: '撒谎的嘴', inside: '屋里的事', fourth: '第四个问题' },
    faces: {
      /* 芭芭雅嘎：乱白发、黑头巾、钩鼻子垂过嘴、深眼窝里两点黄光、一嘴铁牙 */
      yaga(R, a, t) {
        R(0, 0, 32, 32, '#0a0608');
        const hr = '#d8d4c8', hd = '#9a968a';
        for (let i = 0; i < 14; i++) { const x = 2 + i * 2, l = 6 + ((i * 7) % 9); R(x, 4 + (i % 3), 1, l + 10, i % 2 ? hr : hd); }
        R(1, 10, 3, 16, hd); R(28, 10, 3, 16, hd); R(0, 16, 2, 10, hr); R(30, 14, 2, 12, hr);
        R(5, 1, 22, 6, '#4a1414'); R(4, 5, 24, 2, '#3a0e0e'); R(6, 2, 20, 1, '#6a2020');
        const sk = '#a89a80', sd = '#8a7c64', sl = '#bcae94';
        R(7, 6, 18, 21, sk); R(6, 9, 1, 14, sd); R(25, 9, 1, 14, sd); R(9, 27, 14, 2, sk); R(12, 29, 8, 2, sk); R(14, 31, 4, 1, sk);
        R(8, 14, 3, 9, sd); R(21, 14, 3, 9, sd);
        R(9, 8, 6, 1, '#e8e4d8'); R(17, 8, 6, 1, '#e8e4d8'); R(8, 9, 2, 1, '#e8e4d8'); R(22, 9, 2, 1, '#e8e4d8');
        R(9, 10, 6, 4, '#140a06'); R(17, 10, 6, 4, '#140a06');
        const gl = a > .4 ? '#ffe870' : '#ffa020';
        R(11, 11, 2, 2, gl); R(19, 11, 2, 2, gl); R(11, 11, 1, 1, '#fff8d0'); R(19, 11, 1, 1, '#fff8d0');
        R(15, 9, 3, 10, sl); R(14, 16, 5, 4, sl); R(15, 20, 4, 3, sl); R(17, 22, 2, 2, sd); R(15, 19, 1, 1, '#2a1a10'); R(14, 18, 1, 2, sd);
        R(20, 17, 2, 2, '#6a5a40'); R(21, 16, 1, 1, '#d8d4c8');
        R(9, 13, 1, 1, sd); R(23, 13, 1, 1, sd); R(10, 22, 3, 1, sd); R(20, 22, 3, 1, sd);
        const o = Math.min(3, (a * 5) | 0);
        R(10, 23, 12, 2 + o, '#160604');
        for (let i = 0; i < 6; i++) R(10 + i * 2, 23, 1, 2 + (i % 2), '#8a8a98');
        R(20, 24 + o, 1, 3, '#a0a0b0'); R(12, 24 + o, 1, 2, '#8a8a98');
        R(11, 26 + o, 10, 1, sd);
      },
      /* 头骨灯：眼窝里两团火 */
      skull(R, a, t) {
        R(0, 0, 32, 32, '#060404');
        const b = '#e0d8c0', bd = '#b8b098';
        R(7, 3, 18, 3, b); R(5, 5, 22, 14, b); R(4, 8, 24, 9, b); R(8, 19, 16, 3, b); R(10, 22, 12, 6, bd); R(11, 28, 10, 2, bd);
        R(9, 4, 3, 1, '#f0e8d4'); R(5, 12, 1, 4, bd); R(26, 12, 1, 4, bd);
        R(7, 10, 7, 7, '#120806'); R(18, 10, 7, 7, '#120806');
        const f = Math.sin(t * 17) > 0 ? 1 : 0, big = a > .3;
        R(8, 12 - f, 5, 5 + f, '#c84010'); R(19, 12 - f, 5, 5 + f, '#c84010');
        R(9, 13 - f, 3, 3 + f, '#ff8a20'); R(20, 13 - f, 3, 3 + f, '#ff8a20');
        R(10, 14, 1, 2, big ? '#fff2a0' : '#ffd050'); R(21, 14, 1, 2, big ? '#fff2a0' : '#ffd050');
        R(9, 9 - f, 1, 2, '#ff6a10'); R(23, 9 + f, 1, 2, '#ff6a10');
        R(15, 17, 2, 4, '#120806'); R(14, 19, 1, 2, '#120806'); R(17, 19, 1, 2, '#120806');
        R(10, 22, 12, 1, '#120806'); for (let i = 0; i < 6; i++) R(11 + i * 2, 23, 1, 3, '#7a7260');
        R(20, 5, 1, 4, '#8a8270'); R(21, 8, 1, 2, '#8a8270');
      }
    },
    items: {
      doll: { name: '妈妈的娃娃', desc: '一个巴掌大的小木头娃娃，穿着褪了色的红裙子。喂她一口吃的，她就会说话——可不能让人看见。' },
      bread: { name: '面包皮', desc: '一小块又干又硬的黑面包皮。掰一点喂娃娃，她才肯开口。' },
      water: { name: '一桶水', desc: '井里打上来的水，冰得手疼。' },
      broom: { name: '扫帚', desc: '一把桦树枝扎的扫帚。她自己出门也带一把，用来扫掉身后的痕迹。' },
      linen: { name: '湿衣服', desc: '刚搓洗干净、拧过的衣服，沉甸甸的，得晾上。' },
      scrap: { name: '肉骨头', desc: '从锅里捞出来的一块带肉的骨头，还冒着热气。' },
      oil: { name: '灯油', desc: '一小罐灯油。闻着有一股蜂蜡和烟的味道。' },
      towel: { name: '毛巾', desc: '黑猫给的绣花毛巾。「她追近了，往身后扔。」' },
      comb: { name: '梳子', desc: '黑猫给的木梳子，齿又密又硬。「毛巾以后，再扔它。」' },
      skull: { name: '头骨灯', desc: '插在棍子上的头骨。两只眼窝里的火，一跳一跳，从来不灭。' }
    },
    notes: {
      mother: { title: '妈妈临终的话', text: '（你一直记得那天晚上。妈妈把你叫到床边，从被子底下摸出一个小木头娃娃。）\n\n「瓦西丽莎，我要死了。我把我的祝福，和这个娃娃，一起留给你。\n\n把她带在身上，别给任何人看。\n\n遇到难事，给她一点吃的，问问她。她会吃，会告诉你该怎么办。」\n\n（她亲了亲你的额头，就再也没有醒过来。）' },
      lullaby: { title: '妈妈的摇篮曲', text: '（纺车的线杆上，缠着妈妈的旧线。你一边纺，一边就会哼起她教你的那支歌。）\n\n小木屋，小木屋，站在鸡腿上，\n（　）朝着那树林，\n（　）朝着我，\n请个过路的进门坐，\n炉子里的火，借一个。\n\n那两个字，你怎么也想不起来了。\n只记得：唱到「朝着那树林」，妈妈总用手指点一下你的后脑勺；\n唱到「朝着我」，再点一下你的脑门。\n然后她就笑，说：「睡吧，早晨比晚上聪明。」' },
      orders: { title: '芭芭雅嘎的吩咐', text: '（她说一遍，你记一遍。她不说第二遍。）\n\n一、院子扫干净。（扫帚在屋里门边）\n二、饭做好。（锅坐上炉子之前，先去井里打水）\n三、衣服洗了，晾上。（木盆也要水；晾衣绳在院子西边）\n四、她留下的那一斗，一粒一粒挑干净。\n\n「我回来，要是有一样没做——」\n\n（她没说完。她只是咂了咂铁牙。）' },
      scratch: { title: '草垫边墙上的刻字', text: '（墙上一道一道，是指甲刻的。刻得很深，有的地方还沾着黑了的东西。最上面是一排划痕：一道，两道，三道……一共十一道。）\n\n她让你问的时候，只问院子外头看见的。\n屋里的事，一个字也别问。\n\n猫是她的眼睛。先喂饱它。\n\n门轴干了。狗饿着。白桦的枝子抽人眼睛。\n它们都没得过她一点好处。\n\n我问了那三双手。\n明天\n\n（字到这里就断了。）' }
    },
    legend: '芭芭雅嘎（Баба-яга）是斯拉夫民间故事里最有名的老巫婆。她住在密林深处一座立在鸡腿上的小木屋里，屋子会转身，要念一句「小木屋，小木屋，背朝树林，面朝我」才肯把门转过来；她出门坐一只石臼，用捣杵赶着走，用扫帚扫掉身后的痕迹；院子的篱笆是人骨头扎的，桩子上插着眼睛会发光的头骨。她吃人，可也常常是给主人公出难题、赠宝物的那个人——故事里她到底是恶是善，要看来的人怎么做。她的名字从哪里来，学者们至今说法不一。\n\n本章主要依据俄国民俗学家阿法纳西耶夫在《俄罗斯民间故事集》（1855—1863）里收录的《美丽的瓦西丽莎》：母亲临死前把一个小娃娃留给女儿，嘱咐她「给她吃一点，问问她」；继母让女儿们弄灭了家里的火，打发瓦西丽莎去芭芭雅嘎那儿借火；路上先后有白、红、黑三个骑士奔过，芭芭雅嘎说他们是「我的白昼」「我的红太阳」「我的黑夜」；她让瓦西丽莎挑麦子里的黑籽、挑罂粟籽里的土，都是娃娃趁夜替她做完的，娃娃那句「早晨比晚上聪明」也出自这里。瓦西丽莎只问了三个骑士，没敢问屋里那三双凭空出现的手——芭芭雅嘎说，问了屋里的事，她就会把她吃掉。最后，芭芭雅嘎听说是「母亲的祝福」在帮她，便把她赶了出去，给了她一个眼睛冒火的头骨当火种；头骨的火把继母和两个姐姐烧成了灰。\n\n同一部故事集里，还有一则就叫《芭芭雅嘎》的故事：继母打发姑娘去芭芭雅嘎家借针线，好心人教她给吱吱叫的院门上油、给饿狗面包、给抽人的白桦系上丝带、给猫一块肉；黑猫送她一条毛巾和一把梳子，芭芭雅嘎骑着石臼追来时，毛巾变成大河，梳子变成密林。门、狗、白桦和猫挨芭芭雅嘎骂时的那几句回嘴，也出自这里。1899年前后，画家比利宾为《美丽的瓦西丽莎》画的插图，让三个骑士和骨头篱笆成了许多人心里芭芭雅嘎的样子；穆索尔斯基的钢琴组曲《图画展览会》（1874）里也有一首《鸡腿上的小屋（芭芭雅嘎）》。\n\n（本章中：把两个故事接在一起、借火之后的追赶，以及「篱笆上空出的桩子天亮前要补上」的说法；妈妈的摇篮曲与它的歌词、点后脑勺和脑门的动作；小屋白天背过身去、要念咒才肯转回来；娃娃要「没人看着」才肯干活、黑猫是她的眼睛；第二天日落前的限时、炖锅和娃娃要先开头的安排；草垫边墙上的刻字和那个没写完的姑娘；问第四个问题、撒谎、交出娃娃三种坏结局的具体写法；以及结尾头骨后脑勺上的刻痕，都是游戏为了互动而增加的。）',
    start: { map: 'home', x: 8, y: 6, dir: 2 },
    people: {
      me: { key: 'by-me', skin: '#f2d4b8', hair: '#c89a50', hs: 'long', top: '#b8342a', top2: '#f0ece0', bottom: '#b8342a', dress: true, shoes: '#9a7a4a',
        extra(g, d, fr, G, R) { if (d === 3) { R(7, G.hT + 7, 2, 9, '#c89a50'); R(7, G.hT + 16, 2, 1, '#c02020'); } else if (d === 0) { R(4, G.tT + 1, 1, 6, '#f0ece0'); R(11, G.tT + 1, 1, 6, '#f0ece0'); R(6, G.tT + 3, 4, 1, '#e8c050'); } else { R(10, G.hT + 6, 2, 8, '#c89a50'); } } },
      step: { key: 'by-step', skin: '#e8c0a8', hair: '#3a2a20', hs: 'bun', hat: 'scarf', hatC: '#24342a', top: '#34443a', top2: '#24342a', bottom: '#34443a', dress: true, shoes: '#1a1a1a', mouth: '#6a3030' },
      sis1: { key: 'by-sis1', skin: '#f0caa8', hair: '#5a3a20', hs: 'long', top: '#6a4a7a', top2: '#e8e0d0', bottom: '#6a4a7a', dress: true, shoes: '#2a1a1a' },
      sis2: { key: 'by-sis2', skin: '#eec6a4', hair: '#7a4a28', hs: 'bob', top: '#3a5a7a', top2: '#e8e0d0', bottom: '#3a5a7a', dress: true, shoes: '#2a1a1a' },
      yaga: { key: 'by-yaga', skin: '#b8a890', hair: '#d8d4c8', hs: 'messy', hat: 'scarf', hatC: '#4a1414', top: '#4a3a30', top2: '#3a2e28', bottom: '#4a3a30', robe: true, shoes: '#2a2018', eye: '#d8a020',
        extra(g, d, fr, G, R) {
          if (d === 0) { R(7, G.hT + 3, 2, 5, '#a89878'); R(7, G.hT + 8, 2, 1, '#8a7a60'); R(9, G.hT + 7, 1, 2, '#9a9aa8'); R(2, G.hT + 3, 2, 8, '#d8d4c8'); R(12, G.hT + 3, 2, 8, '#d8d4c8'); }
          else if (d === 1) { R(1, G.hT + 4, 3, 2, '#a89878'); R(1, G.hT + 6, 1, 2, '#a89878'); R(9, G.hT + 3, 3, 8, '#d8d4c8'); }
          else if (d === 3) R(3, G.hT + 3, 10, 7, '#d8d4c8');
          R(3, G.tT + 2, 1, 6, '#3a2e28');
        } }
    },
    resume: {
      day2: async S => {
        mood(S);
        if (DEAD.d2) await S.think(DEAD.d2 >= 2 ? '锅要炖、娃娃要没人看着才肯干——这两样最费工夫，一进屋就先开头。\n然后别回屋：去扫院子、打水、洗衣服、晾上。最后再进屋收娃娃。' : '费工夫的活先开头。锅先坐上，娃娃先放下。');
        startD2(S);
      },
      chase: async S => { mood(S); S.ent('gate').open = true; S.ent('gate').solid = false; await startChase(S); }
    },
    async intro(S) {
      await S.card('第十八夜　芭芭雅嘎', '很久以前　俄罗斯　大林子边上', '妈妈临死前，把一个小木头娃娃塞进了你的手心。\n\n后来，爸爸娶了一个寡妇，她带来两个女儿。\n再后来，爸爸出远门做买卖去了。\n继母把家搬到了大林子的边上。\n\n林子深处，住着芭芭雅嘎。');
    },
    tick(S, dt) {
      for (let i = MOV.length - 1; i >= 0; i--) {
        const m = MOV[i]; if (m.g !== GEN) { MOV.splice(i, 1); continue; }
        const e = S.ent(m.id); m.t += dt; const k = Math.min(1, m.t / m.dur);
        if (e) { e.hidden = false; e.px = lerp(m.x0, m.x1, k) * TS; e.py = lerp(m.y0, m.y1, k) * TS; e.x = Math.round(e.px / TS); e.y = Math.round(e.py / TS); e.fr = ((m.t * 10) | 0) % 2 ? 1 : 3; }
        if (k >= 1) { if (e && m.hide) e.hidden = true; if (e) e.fr = 0; MOV.splice(i, 1); }
      }
      chaseTick(S, dt);
      if (!isDay(S)) return;
      const t = S.f.tk;
      if (t.ck === 1 && (S.f.cookT = (S.f.cookT || 0) + dt) >= COOK_T[S.f.day]) { t.ck = 2; S.ent('pech').s.cooked = true; S.toast('锅里咕嘟咕嘟的——饭炖好了。'); refresh(S); }
      if (t.so === 1 && S.map !== 'hut' && S.f.dollT < DOLL_T[S.f.day]) {
        S.f.dollT += dt; if (S.f.dollT >= DOLL_T[S.f.day]) S.toast('屋里沙沙地响了一阵，又停了。——挑完了。');
        const p = S.pl, near = S.map === 'yard' && Math.abs(p.x - 9) + Math.abs(p.y - 5) <= 4;   // 走近小屋，能听见里头一粒一粒拨籽的声音
        if (near && (PT.rs -= dt) <= 0) { PT.rs = .5; for (let i = 0; i < 3; i++) S.tone('triangle', 3200 + i * 300, 2600, .03, .012, i * .11, 6000); }
      }
      if (S.f.act === 'd1' && !S.f.red && (t.sw >= 5) + (t.ck === 2) + (t.ws === 2) + (t.so === 2) >= 2 && S.map === 'yard' && !S.busy) { S.f.red = true; glide(S, 'rY', 25, 1, -3, 1, 2, { col: '#b8282a', dir: 1 }); hooves(S, 2); S.toast('篱笆外，骑红马的红衣人奔了过去。太阳到了头顶。'); }
      if (S.f.act === 'd2' && S.timerLeft != null) {
        if (!S.f.red && S.timerLeft < D2_TIME / 2) { S.f.red = true; if (S.map === 'yard') glide(S, 'rY', 25, 1, -3, 1, 2, { col: '#b8282a', dir: 1 }); hooves(S, 2, .03); S.toast('红骑士过去了——太阳到了头顶。还剩一半。'); }
        if (!S.f.blk && S.timerLeft < 18) { S.f.blk = true; hooves(S, 3, .02); S.toast('远处传来马蹄声。黑骑士要来了！'); }
        const k = clamp(1 - S.timerLeft / (D2_TIME * .45), 0, 1);   // 后半段天色一点点暗下去
        if (S.map === 'yard') S.dark(.16 + .42 * k); else if (S.map === 'hut') S.dark(.3 + .3 * k);
        if (S.timerLeft < 10 && (PT.hb -= dt) <= 0) { PT.hb = S.timerLeft < 5 ? .5 : .85; S.sfx('heart'); }
      }
      if (allDone(S) && !S.busy && S.once('dusk_' + S.f.day)) S.run(dusk);
    },
    sprites: {
      /* 俄式大炉子（3×2）：白泥抹的，炉口里有火；s.pot 锅、s.yaga 她躺在炉炕上 */
      pech(g, e, t, R) {
        const c = '#d9d1c0', d = '#b8ae9a';
        R(0, -14, 48, 46, d); R(1, -13, 46, 44, c); R(1, -13, 46, 2, '#eee8da'); R(1, 27, 46, 4, d);
        R(31, -26, 12, 13, d); R(32, -25, 10, 12, c); R(32, -25, 10, 2, '#eee8da');
        R(1, 3, 46, 2, d); R(4, 16, 6, 5, '#a89e8a'); R(38, 16, 6, 5, '#a89e8a');
        R(14, 12, 20, 15, '#24160e'); R(16, 10, 16, 2, '#24160e'); R(18, 9, 12, 1, '#24160e');
        if (!e.off) { for (let i = 0; i < 6; i++) { const hh = 3 + ((Math.sin(t * 9 + i * 1.7) + 1) * 2.5) | 0; R(15 + i * 3, 26 - hh, 3, hh, i % 2 ? '#ff8a2a' : '#ffcf5a'); } }
        else { R(16, 24, 4, 2, '#4a3a32'); R(24, 25, 5, 1, '#3a2e28'); }
        if (e.pot) { R(18, 16, 12, 8, '#2a2a2c'); R(17, 15, 14, 2, '#3e3e42'); if (e.cooked) { const s = (t * 3) % 3; R(21, 12 - s, 2, 2, 'rgba(230,230,230,.5)'); R(25, 11 - s, 2, 3, 'rgba(230,230,230,.4)'); } }
        if (e.yaga) {
          R(6, -20, 28, 6, '#3a2e28'); R(6, -20, 28, 1, '#4a3e36'); R(2, -19, 5, 4, '#2a2018');
          R(34, -21, 9, 7, '#b8a890'); R(33, -23, 11, 3, '#d8d4c8'); R(43, -19, 3, 2, '#a89878'); R(36, -18, 2, 1, '#2a1a10');
          const z = (t * .8) % 2; if (z < 1.4) { R(44, -28 - z * 4, 3, 1, '#c8c8d8'); R(46, -27 - z * 4, 1, 1, '#c8c8d8'); R(44, -26 - z * 4, 3, 1, '#c8c8d8'); }
        }
      },
      /* 鸡腿小屋（3×2）：s.front 门朝你 */
      izba(g, e, t, R) {
        const bob = Math.round(Math.sin(t * 1.6) * 1.2);
        const lg = '#c89040', ld = '#9a6a28';
        for (const lx of [12, 31]) {
          R(lx - 2, 6 + bob, 8, 6, '#7a5a3a'); R(lx - 1, 5 + bob, 6, 2, '#8a6a4a');
          R(lx, 11 + bob, 4, 16 - bob, lg); R(lx + 1, 11 + bob, 1, 16 - bob, ld); for (let k = 0; k < 4; k++) R(lx, 14 + k * 3 + bob, 4, 1, ld);
          R(lx - 4, 27, 5, 2, lg); R(lx + 3, 27, 5, 2, lg); R(lx + 1, 28, 2, 3, lg); R(lx - 5, 28, 1, 1, '#3a2a1a'); R(lx + 8, 28, 1, 1, '#3a2a1a');
        }
        const by = -26 + bob, wc = '#6a4a2e';
        R(2, by, 44, 34, wc); for (let i = 0; i < 8; i++) R(2, by + 2 + i * 4, 44, 1, '#4a3220');
        R(0, by + 1, 3, 33, '#5a3e26'); R(45, by + 1, 3, 33, '#5a3e26'); for (let i = 0; i < 8; i++) { R(0, by + 2 + i * 4, 3, 1, '#7a5a3a'); R(45, by + 2 + i * 4, 3, 1, '#7a5a3a'); }
        for (let i = 0; i < 14; i++) R(21 - i * 2, by - 14 + i, 6 + i * 4, 1, i % 3 ? '#4a3a2a' : '#5e4c36');
        R(23, by - 16, 2, 3, '#3a2a1a'); R(22, by - 17, 4, 1, '#d8d0b8');
        const night = !!e.lit;
        if (e.front) {
          R(18, by + 13, 12, 21, '#3a2618'); R(19, by + 14, 10, 19, '#4a3220'); R(23, by + 14, 1, 19, '#2a1a10'); R(26, by + 23, 2, 2, '#9a8a6a');
          R(17, by + 11, 14, 2, '#8a6a4a'); R(16, by + 12, 2, 2, '#8a6a4a'); R(30, by + 12, 2, 2, '#8a6a4a');
          for (const wx of [5, 35]) { R(wx - 1, by + 7, 10, 9, '#8a6a4a'); R(wx, by + 8, 8, 7, night ? '#e8b860' : '#2a3a4a'); R(wx + 3, by + 8, 1, 7, '#5a4030'); R(wx, by + 11, 8, 1, '#5a4030'); R(wx - 2, by + 6, 12, 1, '#a08060'); }
          R(18, by + 34, 12, 2, '#5a4030');
        } else {
          R(19, by + 6, 10, 7, '#8a6a4a'); R(20, by + 7, 8, 5, night ? '#7a5a30' : '#1a1410');
          R(6, by + 22, 5, 2, '#3a4a2a'); R(36, by + 18, 6, 2, '#3a4a2a'); R(14, by + 28, 4, 1, '#3a4a2a');
        }
      },
      /* 骨头篱笆上的头骨（off=眼睛不亮；s.empty=空桩子） */
      skull(g, e, t, R) {
        R(6, -2, 4, 12, '#c8c0a8'); R(7, -2, 1, 12, '#e0d8c0');
        if (e.empty) { R(5, -4, 6, 2, '#a8a088'); R(7, -5, 2, 1, '#a8a088'); return; }
        R(3, -11, 10, 9, '#e4dcc4'); R(4, -12, 8, 1, '#e4dcc4'); R(4, -2, 8, 3, '#d4ccb4');
        const lit = !e.off, ph = Math.sin(t * 7 + e.px * .3);
        const ec = lit ? (ph > -.5 ? '#ffb040' : '#ff7020') : '#1a1410';
        R(4, -8, 3, 3, lit ? '#a03010' : '#1a1410'); R(9, -8, 3, 3, lit ? '#a03010' : '#1a1410');
        R(5, -7, 1, 2, ec); R(10, -7, 1, 2, ec);
        R(7, -4, 2, 2, '#2a2018'); R(5, -1, 6, 1, '#2a2018'); R(6, 0, 1, 1, '#2a2018'); R(9, 0, 1, 1, '#2a2018');
      },
      /* 院门（2×1）：门柱是骨头腿，门闩是手，锁是一张嘴 */
      bgate(g, e, t, R) {
        const bone = '#d8d0b8', bd = '#a8a088';
        for (const px of [0, 28]) { R(px + 1, -14, 3, 30, bone); R(px + 3, -14, 1, 30, bd); R(px, -3, 5, 3, '#e8e0c8'); R(px - 1, 13, 6, 3, bone); R(px, -16, 4, 3, '#e8e0c8'); }
        if (e.open) { R(4, -9, 3, 24, '#5a4030'); R(5, -9, 1, 24, '#3a2a1e'); R(25, -9, 3, 24, '#5a4030'); R(26, -9, 1, 24, '#3a2a1e'); return; }
        R(4, -9, 24, 24, '#5a4030'); for (let i = 0; i < 6; i++) R(4 + i * 4, -9, 1, 24, '#3a2a1e');
        const hand = (x, y) => { R(x, y, 5, 3, '#d8c8b0'); R(x + 5, y, 2, 1, '#d8c8b0'); R(x + 5, y + 2, 2, 1, '#d8c8b0'); R(x - 1, y + 1, 1, 1, '#c8b8a0'); R(x, y + 3, 5, 1, '#a89880'); };
        hand(6, -5); hand(20, -5); hand(6, 8); hand(20, 8);
        R(12, 0, 8, 6, '#6a1a1a'); R(13, 1, 6, 4, '#1a0808'); R(13, 1, 1, 2, '#f0f0e0'); R(15, 1, 1, 1, '#f0f0e0'); R(17, 1, 1, 2, '#f0f0e0'); R(14, 4, 1, 1, '#f0f0e0'); R(16, 3, 1, 2, '#f0f0e0'); R(18, 4, 1, 1, '#f0f0e0');
        if (e.oiled) { R(3, -1, 1, 2, '#e8c860'); R(28, -1, 1, 2, '#e8c860'); }
      },
      dog(g, e, t, R) {
        const c = '#5a5048', d = '#3a3028';
        R(15, 4, 1, 11, '#3a3a3a'); for (let i = 0; i < 4; i++) R(12 + i, 12 - (i % 2), 1, 1, '#6a6a6a');
        R(2, 8, 11, 5, c); R(10, 5, 5, 5, c); R(13, 7, 3, 2, d); R(15, 7, 1, 1, '#1a1a1a'); R(11, 4, 2, 2, d); R(12, 6, 1, 1, e.fed ? '#2a2a2a' : '#e8c040');
        if (!e.fed) { R(4, 9, 1, 3, d); R(6, 9, 1, 3, d); R(8, 9, 1, 3, d); }
        R(3, 13, 2, 2, c); R(10, 13, 2, 2, c);
        const w = e.fed ? Math.round(Math.sin(t * 14)) : 2; R(0, 7 + w, 3, 1, c);
      },
      /* 白桦：s.ribbon 系上了红头绳 */
      birch(g, e, t, R) {
        const sw = e.ribbon ? Math.round(Math.sin(t * 1.5)) : Math.round(Math.sin(t * 6) * 3);
        R(-10 + sw, -40, 36, 16, '#6a7a2a'); R(-6 + sw, -46, 28, 8, '#7a8a34'); R(-12 + sw, -30, 8, 14, '#5a6a24'); R(20 + sw, -30, 8, 14, '#5a6a24');
        for (let i = 0; i < 6; i++) { R(-8 + i * 6 + sw, -26, 1, 10 + (i % 3) * 3, '#4a5a20'); R(-8 + i * 6 + sw, -16 + (i % 3) * 3, 2, 1, '#8a9a3a'); }
        R(6, -34, 4, 49, '#ece8de'); R(9, -34, 1, 49, '#c8c4ba');
        for (let i = 0; i < 8; i++) R(6 + (i % 2) * 2, -30 + i * 6, 2, 1, '#2a2a2a');
        R(5, 13, 6, 2, '#4a3a2a');
        if (e.ribbon) { R(10, -14, 3, 1, '#d02828'); R(12, -13, 1, 6, '#c02020'); R(11, -13, 1, 4, '#e03030'); }
      },
      /* 黑猫 */
      cat(g, e, t, R) {
        const c = '#141218';
        R(5, 7, 7, 8, c); R(4, 2, 8, 6, c); R(4, 0, 2, 3, c); R(10, 0, 2, 3, c); R(5, 1, 1, 1, '#3a2a3a'); R(10, 1, 1, 1, '#3a2a3a');
        const bl = Math.sin(t * .9 + e.px) > .95;
        if (!bl) { R(5, 4, 2, 1, '#7ae05a'); R(9, 4, 2, 1, '#7ae05a'); R(6, 4, 1, 1, '#0a2a0a'); R(10, 4, 1, 1, '#0a2a0a'); }
        R(7, 6, 2, 1, '#3a2a30');
        const tw = Math.round(Math.sin(t * 2) * 1.5); R(12, 12 + tw, 3, 2, c); R(14, 9 + tw, 2, 4, c);
        if (e.friend) R(4, 14, 9, 1, '#2a2430');
      },
      /* 院子里的脏东西：骨头、羽毛、落叶（按位置换花样） */
      litter(g, e, t, R) {
        const h = hash(e.x | 0, e.y | 0, 18);
        R(3, 9, 10, 5, 'rgba(40,30,20,.55)');
        if (h < .33) { R(4, 10, 6, 1, '#d8d0b8'); R(3, 9, 1, 3, '#d8d0b8'); R(10, 9, 1, 3, '#d8d0b8'); R(8, 12, 4, 1, '#c8c0a8'); }
        else if (h < .66) { R(4, 9, 5, 1, '#e8e8e8'); R(5, 10, 4, 1, '#c8c8d0'); R(9, 11, 4, 1, '#2a2a30'); R(10, 12, 3, 1, '#3a3a40'); R(6, 12, 2, 1, '#d8d0b8'); }
        else { R(4, 10, 3, 2, '#a07a30'); R(8, 9, 3, 2, '#8a5a20'); R(10, 12, 3, 2, '#b89040'); R(5, 12, 2, 1, '#6a4a20'); }
      },
      /* 木盆（2×1）+ 脏衣篮 */
      trough(g, e, t, R) {
        R(1, 4, 20, 10, '#6a4a2e'); R(2, 5, 18, 2, '#8a6a4a'); R(3, 7, 16, 5, e.water ? '#3a5a6a' : '#2a1e16'); if (e.water) R(6, 8, 4, 1, '#6a8a9a');
        R(5, 13, 2, 2, '#4a3220'); R(15, 13, 2, 2, '#4a3220');
        R(22, 5, 9, 9, '#a07a40'); R(23, 4, 7, 1, '#a07a40'); if (!e.washed) { R(23, 3, 6, 3, '#9a9488'); R(25, 2, 3, 2, '#8a8478'); }
      },
      /* 晾衣绳（3×1） */
      line(g, e, t, R) {
        R(1, -12, 2, 27, '#5a4030'); R(45, -12, 2, 27, '#5a4030'); R(2, -10, 44, 1, '#c8c0a8');
        if (e.hung) { const s = Math.round(Math.sin(t * 2)); R(6, -9, 10, 14 + s, '#e8e4dc'); R(6, -9, 10, 1, '#c8c4ba'); R(19, -9, 8, 10, '#d8d0c0'); R(30, -9, 12, 13 - s, '#e8e4dc'); R(33, -6, 1, 10, '#c8c4ba'); }
      },
      woodpile(g, e, t, R) {
        R(0, 2, 16, 13, '#3a2a1a'); for (let r = 0; r < 3; r++) for (let i = 0; i < 3; i++) { const x = 1 + i * 5 + (r % 2) * 2, y = 3 + r * 4; R(x, y, 4, 4, '#8a6a42'); R(x + 1, y + 1, 2, 2, '#b8955a'); }
        R(0, -2, 16, 4, '#4a3420'); R(2, -3, 12, 1, '#5a4430');
      },
      /* 一斗：麦子 / 罂粟籽；s.done 分好了，s.doll 娃娃坐在上面 */
      heap(g, e, t, R) {
        const po = e.kind === 'poppy';
        const A = po ? '#7a8294' : '#c8a040', B = po ? '#5a6274' : '#a8822a', sp = po ? '#5a4028' : '#1a1410';
        R(1, 12, 14, 3, '#3a2a1a');
        if (!e.done) {
          R(2, 7, 12, 7, A); R(4, 4, 8, 3, A); R(6, 2, 4, 2, A); R(3, 12, 10, 2, B);
          for (let i = 0; i < 9; i++) R(3 + ((hash(i, 1, 18) * 10) | 0), 4 + ((hash(i, 2, 18) * 9) | 0), 1, 1, sp);
        } else {
          R(1, 6, 9, 8, A); R(3, 4, 5, 2, A); R(2, 12, 7, 2, B);
          R(11, 10, 4, 4, sp); R(12, 9, 2, 1, sp);
        }
        if (e.doll) { const b = Math.sin(t * 8) > 0 ? 1 : 0; R(7, -3 + b, 3, 3, '#f0d0b0'); R(6, 0 + b, 5, 5, '#b8342a'); R(7, -4 + b, 3, 1, '#c89a50'); R(7, -2 + b, 1, 1, '#1a1010'); R(9, -2 + b, 1, 1, '#1a1010'); }
      },
      broom(g, e, t, R) { R(7, -12, 2, 20, '#7a5a3a'); R(4, 6, 8, 3, '#6a4a2a'); R(3, 9, 10, 6, '#8a7a4a'); for (let i = 0; i < 5; i++) R(3 + i * 2, 10, 1, 5, '#6a5a30'); },
      jar(g, e, t, R) { R(4, 4, 8, 10, '#8a4a2a'); R(3, 7, 10, 5, '#9a5a32'); R(5, 2, 6, 2, '#6a3a20'); R(6, 1, 4, 1, '#d8c8a0'); R(5, 8, 2, 2, '#b87a4a'); },
      btable(g, e, t, R) { R(2, 10, 2, 5, '#3a2618'); R(28, 10, 2, 5, '#3a2618'); box(R, 0, 1, 32, 10, '#6a4a2e'); R(1, 2, 30, 2, '#8a6a4a'); if (e.bread) { R(20, 2, 6, 3, '#6a4020'); R(21, 2, 4, 1, '#8a5a30'); } },
      pallet(g, e, t, R) { R(0, 3, 16, 12, '#8a7a4a'); for (let i = 0; i < 6; i++) R(1 + i * 2.5, 4, 1, 10, '#a8985a'); R(1, 3, 6, 4, '#7a6a5a'); R(2, 4, 4, 2, '#9a8a7a'); },
      /* 纺车（俄式纺线杆） */
      wheel(g, e, t, R) { R(2, 10, 12, 4, '#6a4a2e'); R(3, 11, 10, 1, '#8a6a4a'); R(6, -10, 4, 21, '#7a5a3a'); R(4, -12, 8, 6, '#8a6a4a'); R(5, -11, 6, 4, '#d8d0c0'); R(6, -6, 4, 3, '#c8c0b0'); R(12, 4, 1, 7, '#c8b890'); R(11, 3, 3, 1, '#a89870'); },
      chest(g, e, t, R) { box(R, 1, 4, 14, 11, '#6a4428'); R(1, 7, 14, 1, '#3a3a3a'); R(1, 12, 14, 1, '#3a3a3a'); R(7, 6, 2, 3, '#c8a860'); R(2, 3, 12, 2, '#7a5430'); },
      /* 三个骑士（2×1，朝右画；dir=1 镜像）；col 决定颜色 */
      rider(g, e, t, R) {
        const RR = e.dir === 1 ? (x, y, w, h, c) => R(32 - x - w, y, w, h, c) : R;
        const c = e.col || '#ecebe4', d = shade(c, -.3), f = ((t * 14) | 0) % 2;
        RR(4, 1, 20, 8, c); RR(4, 1, 20, 1, shade(c, .15)); RR(22, -5, 6, 8, c); RR(26, -7, 5, 4, c); RR(30, -6, 2, 2, d); RR(25, -8, 2, 2, d);
        RR(0, 1, 5, 2, d); RR(0, 3, 3, 6, d);
        if (f) { RR(5, 9, 2, 6, d); RR(9, 9, 2, 4, d); RR(18, 9, 2, 4, d); RR(22, 9, 2, 6, d); RR(3, 14, 3, 1, d); RR(23, 14, 3, 1, d); }
        else { RR(6, 9, 2, 4, d); RR(10, 9, 2, 6, d); RR(17, 9, 2, 6, d); RR(21, 9, 2, 4, d); RR(10, 14, 3, 1, d); RR(16, 14, 3, 1, d); }
        RR(11, -10, 7, 11, c); RR(11, -10, 2, 11, d); RR(13, -15, 5, 5, '#e0c8a8'); RR(12, -16, 7, 2, c); RR(16, -13, 1, 1, '#1a1010');
        RR(18, -6, 6, 2, c);
      },
      /* 停着的石臼 */
      mortar(g, e, t, R) { R(2, 3, 12, 12, '#6a6660'); R(1, 2, 14, 3, '#8a8680'); R(3, 3, 10, 2, '#2a2826'); R(4, 7, 2, 6, '#7a7670'); R(10, -10, 2, 14, '#7a5a3a'); R(9, -11, 4, 2, '#8a6a4a'); R(2, -6, 2, 10, '#6a4a2a'); R(0, -10, 5, 5, '#8a7a4a'); },
      /* 骑在石臼里的芭芭雅嘎 */
      yagam(g, e, t, R) {
        const b = Math.round(Math.sin(t * 7) * 1.5);
        R(-6, 12 + b, 6, 3, 'rgba(120,110,90,.4)'); R(-10, 13 + b, 5, 2, 'rgba(120,110,90,.25)');
        R(0, 4 + b, 4, 1, '#6a4a2a'); R(-6, 2 + b, 7, 6, '#8a7a4a');
        R(3, -8 + b, 10, 9, '#4a3a30'); R(4, -14 + b, 8, 7, '#b8a890'); R(3, -16 + b, 10, 3, '#4a1414'); R(2, -14 + b, 2, 8, '#d8d4c8'); R(12, -14 + b, 2, 8, '#d8d4c8');
        R(7, -11 + b, 2, 4, '#a89878'); R(5, -12 + b, 1, 1, '#ffcc40'); R(10, -12 + b, 1, 1, '#ffcc40'); R(6, -8 + b, 4, 1, '#2a1a10'); R(8, -8 + b, 1, 2, '#9a9aa8');
        R(13, -18 + b, 2, 18, '#7a5a3a'); R(12, -19 + b, 4, 2, '#8a6a4a'); R(12, -6 + b, 3, 2, '#b8a890');
        R(1, 0 + b, 14, 14, '#6a6660'); R(0, -1 + b, 16, 3, '#8a8680'); R(3, 4 + b, 2, 8, '#7a7670'); R(2, 13 + b, 12, 2, '#4a4844');
      },
      /* 半空里的一双手 */
      hands(g, e, t, R) {
        const b = Math.round(Math.sin(t * 3 + e.px) * 1.5), c = '#e4d8c4', d = '#b8a890';
        const one = x => { R(x, 4 + b, 5, 5, c); R(x, 2 + b, 1, 3, c); R(x + 1, 1 + b, 1, 3, c); R(x + 2, 1 + b, 1, 3, c); R(x + 3, 2 + b, 1, 3, c); R(x + 5, 5 + b, 1, 2, c); R(x + 1, 9 + b, 3, 3, d); R(x + 1, 12 + b, 3, 1, 'rgba(180,170,150,.4)'); };
        one(1); one(9);
      },
      stump(g, e, t, R) { R(2, 5, 12, 10, '#5a4030'); R(1, 4, 14, 3, '#8a6a42'); R(3, 5, 10, 1, '#b8955a'); R(5, 8, 5, 5, '#1a120c'); R(0, 13, 4, 2, '#4a3420'); R(12, 13, 4, 2, '#4a3420'); R(10, 2, 2, 3, '#4a6a2a'); },
      mskull(g, e, t, R) { R(3, 8, 10, 6, '#3a4a2a'); R(5, 7, 7, 6, '#c8c0a8'); R(6, 9, 2, 2, '#1a1410'); R(9, 9, 2, 2, '#1a1410'); R(4, 12, 9, 2, '#4a5a30'); R(1, 13, 4, 1, '#c8c0a8'); },
      /* 墙上的指甲刻痕 */
      scratch(g, e, t, R) { for (let i = 0; i < 6; i++) R(13 - (i % 3), 2 + i * 2, 2, 1, 'rgba(200,180,150,.55)'); R(12, 1, 1, 12, 'rgba(200,180,150,.35)'); },
      /* 桌上的头骨（结尾） */
      tskull(g, e, t, R) { R(4, -6, 8, 7, '#e4dcc4'); R(5, 1, 6, 2, '#d4ccb4'); const ec = Math.sin(t * 8) > -.4 ? '#ffb040' : '#ff7020'; R(5, -4, 2, 2, ec); R(9, -4, 2, 2, ec); R(7, -1, 2, 1, '#2a2018'); }
    },
    tiles: {
      bonefence: { solid: true, paint(R, X, Y) {   // 腿骨当桩子、肋骨当横档，高高低低、发黄
        R(0, 0, 16, 16, '#1c2616'); R(0, 13, 16, 3, '#141c10');
        const b = '#d4caae', bs = '#9e9478', bh = '#ece4cc';
        for (let i = 0; i < 16; i += 2) { R(i, 5 + ((i >> 2) % 2), 2, 1, bs); R(i, 4 + ((i >> 2) % 2), 2, 1, b); R(i, 10 - ((i >> 2) % 2), 2, 1, b); }
        for (const [x, k] of [[1, 0], [9, 1]]) {
          const top = (hash(X * 2 + k, Y, 18) * 4) | 0;
          R(x + 1, top + 2, 3, 13 - top, b); R(x + 3, top + 2, 1, 13 - top, bs); R(x + 1, top + 6, 1, 4, bh);
          R(x, top, 2, 3, bh); R(x + 3, top, 2, 3, bh); R(x + 1, top + 1, 3, 1, bh); R(x + 2, top, 1, 1, bs);
          R(x, 14, 2, 2, b); R(x + 3, 14, 2, 2, b);
        }
        if (hash(X, Y, 19) < .25) { R(6, 12, 3, 1, bh); R(5, 11, 1, 1, bh); R(8, 11, 1, 1, bh); }
      } }
    },
    maps: {
      /* ---------------- 继母家 ---------------- */
      home: {
        amb: 'room', dark: .55, wall: 'wood', floor: 'wood', plr: 3,
        tileOpts: { woodC: '#5a3e28' },
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
          { id: 'hdoor', x: 2, y: 1, spr: 'door', async on(S) {
            const a = S.f.act;
            if (a === 'pro') return;
            if (a === 'home2' || a === 'end') return S.narr('门外是来时的林子。你不会再回去了。');
            if (!S.has('bread')) return S.think('娃娃得喂了才肯说话。\n桌上还有你那块面包皮。');
            if (!S.f.dollHome) return S.think('走之前，该先问问娃娃。\n到你睡的那个角落去（门边的草垫）——那儿没人看见。');
            S.sfx('open');
            await S.narr('两个姐姐把你推出了门。门在你身后「砰」地关上，门闩落了下来。');
            await S.go('forest', 1, 7, 2);
          } },
          { id: 'hwinH', x: 5, y: 1, spr: 'window', on: S => S.narr(S.f.act === 'home2' || S.f.act === 'end' ? '窗外的林子黑沉沉的。你知道林子深处有什么了。' : '窗外是黑漆漆的大林子。树梢上，一点火光也没有。') },
          { id: 'idoor', x: 11, y: 1, spr: 'door', on: S => S.narr(S.f.act === 'home2' ? '里屋的门开着。里面黑洞洞的，一股冷灰味。' : '继母的房门关着。里面传来她翻身的声音。') },
          { id: 'hpech', x: 8, y: 2, w: 3, h: 2, spr: 'pech', off: true, on: S => S.narr(S.f.act === 'home2' ? '炉膛是冷的。她们说，你走了以后，这里一次也没烧起来过。' : '炉膛是凉的。继母临睡前，亲手把最后一点炭火捅灭了。') },
          { id: 'table', x: 4, y: 4, w: 2, spr: 'btable', s: { bread: true }, async on(S) {
            const a = S.f.act;
            if (a === 'home2') return homeEnd(S);
            if (a === 'pro') return;
            if (!S.has('bread')) { S.ent('table').s.bread = false; S.give('bread'); return S.narr('你的那块面包皮还在桌角。晚饭，你只分到这个。\n你把它揣进了口袋。'); }
            await S.narr('桌上只剩一根冷掉的蜡烛头。');
          } },
          { id: 'candle', x: 4, y: 4, spr: 'candle', z: 1, oy: -7, ox: 2, solid: false, light: { r: 4, col: 'rgba(255,190,110,.2)', flick: true } },
          { id: 'tskull', x: 5, y: 4, spr: 'tskull', z: 1, solid: false, hidden: true, light: { r: 4, col: 'rgba(255,120,40,.3)', flick: true } },
          { id: 'wheel', x: 9, y: 6, spr: 'wheel', async on(S) {
            if (S.f.act === 'pro') return;
            if (S.once('lull')) await S.narr('你的纺车。线杆上，还缠着妈妈纺剩的旧线。\n你摸着那团线，不知不觉哼起了她教你的歌——');
            lullaby(S); S.f.lullRead = true;
            await S.note('lullaby');
          } },
          { id: 'chest', x: 11, y: 6, spr: 'chest', async on(S) {
            if (S.f.act === 'pro') return;
            if (S.once('chestHint')) await S.narr('你的小箱子。箱底压着一张叠得方方正正的纸——\n是你后来照着记忆，把妈妈那天晚上的话写下来的。');
            await S.note('mother');
          } },
          { id: 'pallet', x: 1, y: 6, spr: 'pallet', async on(S) {
            if (S.f.act === 'pro') return;
            if (S.f.act === 'home2' || S.f.act === 'end') return S.narr('你睡的角落。草垫还是那样，冷冰冰的。');
            await S.narr('门边的角落，你平时就睡在这儿。\n两个姐姐在桌那头说话，谁也没往这边看。');
            await askDoll(S);
          } },
          { id: 'step', x: 6, y: 3, spr: '@step', dir: 0, async on(S) {
            S.face('step', 'pl');
            if (S.f.act === 'home2') return S.say('继母', '……把那东西拿走。拿走！');
            await S.say('继母', '还站着干什么？');
          } },
          { id: 'sis1', x: 3, y: 5, spr: '@sis1', dir: 2, light: { r: .9, col: 'rgba(200,220,255,.12)' }, async on(S) {
            S.face('sis1', 'pl');
            if (S.f.act === 'home2') return S.say('大姐', '它……它在看我。');
            await S.say('大姐', '我的花边针亮着呢，用不着火。快去吧。');
          } },
          { id: 'sis2', x: 6, y: 5, spr: '@sis2', dir: 1, light: { r: .9, col: 'rgba(200,220,255,.12)' }, async on(S) {
            S.face('sis2', 'pl');
            if (S.f.act === 'home2') return S.say('二姐', '你从哪儿弄来的？……你真的去了？');
            await S.say('二姐', '（她低着头织袜子，嘴角在笑）路上小心点哟。');
          } },
          { id: 'lampH', x: 0, y: 0, hidden: true, light: { r: 4.2, col: 'rgba(255,120,40,.26)', flick: true, pl: true } }
        ],
        async enter(S, first) {
          if (first) return prologue(S);
          mood(S);
          if (S.f.act === 'home2' && S.once('home2')) {
            await S.narr('家里一片漆黑。继母和两个姐姐挤在门口。');
            await S.say('继母', '……你还知道回来？', {});
            S.bubble('step', '!', 1200);
            await S.narr('她看见了你手里的东西，往后退了一步。');
            await S.say('大姐', ['你走了以后，我们一点火也点不着。', '点着了，一拿进门就灭。']);
            await S.narr('你本想把头骨扔在门外的。可它在棍子上开口了——');
            await S.say('头骨', '别扔下我。把我带到你继母跟前。', { style: 'whisper' });
            S.goal('把火放到桌上');
          }
        }
      },

      /* ---------------- 林子 ---------------- */
      forest: {
        amb: 'wind', dark: .9, wall: 'wood', floor: 'dirt', plr: 2.6,
        tileOpts: { grassC: '#24361e', treeC: '#16281a' },
        rows: forestRows(),
        ents: [
          { id: 'fexW', x: 0, y: 7, h: 2, async touch(S) {
            if (S.f.act === 'chase') return;
            await S.think('回去？继母不会给你开门的。');
            S.pos(2, S.pl.y, 2);
          } },
          { id: 'fexE', x: 47, y: 2, h: 2, async touch(S) {
            const a = S.f.act;
            if (a === 'chase' || a === 'dawn') { S.pos(45, S.pl.y, 1); return; }
            if ((S.f.fl || 0) < 3) { await S.think('前面还长着呢。'); S.pos(45, S.pl.y, 1); return; }
            await S.go('yard', 10, 14, 3);
          } },
          { id: 'stump', x: 32, y: 8, spr: 'stump', async on(S) {
            if (S.f.act === 'chase') return;
            await S.narr('岔路口有一个空心的老树桩。蹲在它后面，路上谁也看不见你。');
            await askDoll(S);
          } },
          { id: 'mskull', x: 37, y: 14, spr: 'mskull', solid: false, decal: true, on: S => S.narr('苔藓里半埋着一个头骨。\n地上的土被扫得干干净净——像是有人拿扫帚，把来过的痕迹全扫掉了。') },
          { id: 'rF', x: 0, y: 0, w: 2, spr: 'rider', solid: false, hidden: true, z: 1 },
          { id: 'yagaF', x: 47, y: 3, spr: 'yagam', solid: false, hidden: true, z: 1 },
          { id: 'thrF', x: 0, y: 0, hidden: true, on: doThrow },
          { id: 'lampF', x: 0, y: 0, hidden: true, light: { r: 4.4, col: 'rgba(255,120,40,.22)', flick: true, pl: true } }
        ],
        async enter(S, first) {
          if (S.f.act === 'home') return forestIn(S);
          mood(S);
        },
        tick(S) {
          if (S.f.act !== 'forest' || S.busy) return;
          const p = S.pl;
          if (p.x >= 21 && p.y >= 10 && S.once('red')) S.run(redRider);
          else if (p.x >= 40 && p.y <= 4 && (S.f.fl || 0) >= 1 && S.once('black')) S.run(blackRider);
        }
      },

      /* ---------------- 骨头篱笆的院子 ---------------- */
      yard: {
        amb: 'night', dark: .64, wall: 'wood', floor: 'dirt', plr: 3,
        tileOpts: { grassC: '#2a3a22' },
        legend: { 'Y': 'bonefence' },
        rows: yardRows(),
        ents: [
          { id: 'hut', x: 8, y: 3, w: 3, h: 2, spr: 'izba', s: { front: true }, async on(S) {
            const a = S.f.act, h = S.ent('hut');
            if (a === 'arrive') return;
            if (a === 'chase' || a === 'out') return S.narr('屋里传来磨牙的声音。');
            if (a === 'n2') { S.sfx('open'); return S.go('hut', 6, 7, 3); }
            if (!h.s.front) {
              if (S.once('spIntro')) {
                await S.narr('鸡腿小屋背对着你，一动不动。\n要让它转过来，得对它念那句话。');
                if (!S.f.lullRead) { await S.think('……妈妈的摇篮曲里，就有这么一句。'); lullaby(S); S.f.lullRead = true; await S.note('lullaby'); }
              }
              return spell(S);
            }
            if (S.pl.y < 5) return S.narr('小屋的鸡腿上长着黄鳞，脚爪抠进土里。\n门在前面。');
            S.sfx('open'); await S.go('hut', 6, 7, 3);
          } },
          { id: 'mortar', x: 12, y: 4, spr: 'mortar', hidden: true, on: S => S.narr('一只石臼，比水缸还大，内壁磨得发亮。\n捣杵和扫帚斜插在里面。') },
          { id: 'well', x: 16, y: 4, spr: 'well', async on(S) {
            if (!isDay(S)) return S.narr('井口黑洞洞的。往下看，看不见水，只看见一点头骨的反光。');
            if (S.has('water')) return S.toast('桶里的水还是满的。');
            S.give('water', true); S.sfx('water');
            if (S.f.act === 'd2') S.toast('打了一桶水。'); else await S.narr('你摇着辘轳，打上来满满一桶水。冰得手疼。');
          } },
          { id: 'trough', x: 15, y: 7, w: 2, spr: 'trough', async on(S) {
            const t = S.f.tk, e = S.ent('trough');
            if (!isDay(S)) return S.narr('木盆。盆沿上搭着一件洗得发白的衣服——不知道是谁的。');
            if (t.ws === 2) return S.toast('衣服已经晾上了。');
            if (t.ws === 1) return S.toast('湿衣服在你手里——去晾衣绳那儿晾上（院子西边）。');
            if (!e.s.water) {
              if (!S.has('water')) return S.toast('木盆是空的，得先去井里打水。');
              S.take('water'); e.s.water = true; S.sfx('splash');
            }
            e.s.washed = true; t.ws = 1; S.give('linen', true); S.sfx('water');
            if (S.f.act === 'd2') S.toast('衣服搓洗干净了。去晾上！'); else await S.narr('你把篮子里的衣服倒进盆里，一件一件搓洗干净，拧干。\n有几件小得像孩子穿的。你没敢多想。');
            refresh(S);
          } },
          { id: 'line', x: 4, y: 4, w: 3, spr: 'line', async on(S) {
            const t = S.f.tk;
            if (!isDay(S)) return S.narr('晾衣绳在夜风里晃。');
            if (t.ws === 2) return S.toast('衣服在绳子上晃着。');
            if (!S.has('linen')) return S.toast(t.ws === 0 ? '还没洗呢。木盆在井那边。' : '衣服呢？');
            S.take('linen'); t.ws = 2; S.ent('line').s.hung = true; S.sfx('paper');
            S.toast('衣服晾上了。'); refresh(S);
          } },
          { id: 'woodpile', x: 17, y: 9, spr: 'woodpile', async on(S) {
            if (S.f.act === 'arrive') return S.narr('篱笆里头堆着柴。你进不去。');
            if (S.f.act === 'chase' || S.f.act === 'out') return S.narr('没工夫了！');
            if (S.f.act === 'n2') { await S.narr('柴垛后面。小屋的窗户里，她的影子一动不动。'); return askDoll(S); }
            if (S.f.act === 'd2') { S.toast('「费工夫的活先开头：锅先坐上，娃娃先放下。」'); return; }
            await S.narr('柴垛后面，院子里谁也看不见你。');
            await askDoll(S);
          } },
          { id: 'dog', x: 13, y: 10, spr: 'dog', s: { fed: false }, async on(S) {
            const e = S.ent('dog');
            if (e.s.fed) return S.narr('它冲你摇了摇尾巴——那条尾巴上没剩几根毛。');
            if (S.f.act === 'arrive') return S.narr('篱笆里头，一条狗朝你龇着牙。瘦得能数清肋骨。');
            if (!isDay(S)) { growl(S); return S.narr('看门狗朝你龇着牙，喉咙里呼噜呼噜地响。'); }
            growl(S);
            if (!S.has('bread')) return S.narr('看门狗瘦得能数清肋骨，冲你龇着牙。');
            const r = await S.ask('看门狗瘦得能数清肋骨，冲你龇着牙。', ['（掰一半面包皮给它）', '（离它远点）']);
            if (r) return;
            e.s.fed = true; S.sfx('item');
            await S.narr('它先是不信，嗅了半天，才一口叼了过去。\n吃完，它趴下来，把下巴搁在你脚边。');
          } },
          { id: 'birch', x: 7, y: 9, spr: 'birch', s: { ribbon: false }, async on(S) {
            const e = S.ent('birch');
            if (e.s.ribbon) return S.narr('白桦的枝子垂下来，轻轻晃着。红头绳在风里一飘一飘。');
            S.tone('triangle', 3000, 900, .12, .03, 0, 5000);
            if (!isDay(S)) return S.narr('门边的白桦，枝子在风里乱抽，抽得你睁不开眼。');
            const r = await S.ask('门边的白桦，枝子在风里乱抽，抽得你睁不开眼。', ['（解下辫梢上的红头绳，系在它的枝子上）', '（躲开它）']);
            if (r) return;
            e.s.ribbon = true; S.sfx('paper');
            await S.narr('你把红头绳系在最低的那根枝子上，打了个结。\n白桦慢慢地，把枝子收了回去。');
          } },
          { id: 'gate', x: 10, y: 11, w: 2, spr: 'bgate', s: { oiled: false }, async on(S) {
            const a = S.f.act, e = S.ent('gate');
            if (a === 'arrive') {
              if (!S.once('gateLook')) return S.narr('门闩是手，锁是嘴。');
              await S.narr(['院门的两根门柱，是两条人腿。', '门闩是一只只人手。锁——是一张嘴，里面一排尖牙。']);
              return yagaArrives(S);
            }
            if (isDay(S) && S.has('oil') && !e.s.oiled) {
              S.take('oil'); e.s.oiled = true; creak(S, .5);
              if (S.f.act === 'd2') S.toast('门轴上了油，不叫了。'); else await S.narr('你把灯油一点一点抹在门轴上。\n门轴「吱——」地叫了最后一声，不叫了。');
              return;
            }
            if (isDay(S)) { creak(S, .6); return S.narr(e.s.oiled ? '门轴上了油，推一推，一点声音也没有。' : '你碰了碰院门。门轴「吱呀——」一声尖叫，像是要把整片林子都叫醒。\n门轴干得发白了。'); }
            await S.narr('门闩上的那几只手，手指头动了动。');
          } },
          { id: 'stake', x: 12, y: 2, spr: 'skull', s: { empty: true }, async on(S) {
            if (S.f.act === 'arrive' || S.f.act === 'n1in') return S.narr('只有这一根桩子上是空的。');
            await S.narr('只有这一根桩子上是空的。');
            if (S.once('stakeThink')) await S.think('……空着，是在等谁？');
          } },
          { id: 'yagaW', x: 12, y: 5, spr: '@yaga', hidden: true, solid: false, on: S => S.narr('她没看你。') },
          { id: 'yagaY', x: 12, y: 4, spr: 'yagam', hidden: true, solid: false, z: 1 },
          { id: 'cat', x: 11, y: 2, spr: 'cat', hidden: true, solid: false, s: { friend: true }, on: S => S.narr('黑猫在柴垛边蜷着，眯着一只眼睛看你。它在打呼噜。') },
          { id: 'rY', x: -3, y: 1, w: 2, spr: 'rider', solid: false, hidden: true, z: 1 },
          { id: 'thrY', x: 0, y: 0, hidden: true, on: doThrow },
          { id: 'lampY', x: 0, y: 0, hidden: true, light: { r: 4.4, col: 'rgba(255,120,40,.22)', flick: true, pl: true } },
          { id: 'yexS', x: 10, y: 15, w: 2, async touch(S) {
            if (S.f.act === 'chase') return toForest(S);
            if (S.f.act === 'arrive') { await S.think('回去？回去也没有火。'); S.pos(S.pl.x, 14, 3); return; }
            S.pos(S.pl.x, 14, 3);
          } },
          ...PILES.d1.concat([[7, 6], [12, 7]]).map((p, i) => ({ id: 'lt' + i, x: p[0], y: p[1], spr: 'litter', decal: true, solid: false, hidden: true })),
          ...SKULLS.map((p, i) => ({ id: 'sk' + i, x: p[0], y: p[1], spr: 'skull', off: true, light: { r: 1.7, col: 'rgba(255,130,40,.3)', dy: -4 },
            on: S => S.narr(['头骨。空眼窝里的火，一跳一跳。', '这一个的下巴掉了半边。', '这一个小一点。比你的头还小。', '这一个的眼睛，好像跟着你转。', '桩子上缠着一缕头发，金黄色的。'][i % 5]) }))
        ],
        async enter(S, first) {
          if (S.f.act === 'forest') return arrive(S);
          mood(S);
        },
        tick(S, dt) {
          if (S.f.act === 'arrive' && !S.busy && (S.f.arrT = (S.f.arrT || 0) + dt) > 14 && S.once('arrAuto')) { S.once('gateLook'); S.run(yagaArrives); return; }
          if (!isDay(S) || !S.has('broom')) { if (isDay(S) && !S.has('broom') && !S.busy) { const p = S.pl; for (let i = 0; i < 7; i++) { const e = S.ent('lt' + i); if (!e.hidden && e.x === p.x && e.y === p.y && S.once('nobroom_' + S.f.day)) S.toast('得先拿扫帚——在屋里门边。'); } } return; }
          const p = S.pl, t = S.f.tk;
          for (let i = 0; i < 7; i++) {
            const e = S.ent('lt' + i);
            if (!e.hidden && Math.round(e.px / TS) === p.x && Math.round(e.py / TS) === p.y) { e.hidden = true; t.sw++; S.sfx('paper'); S.toast(t.sw >= need(S) ? '院子扫干净了。' : `扫掉一堆。还剩 ${need(S) - t.sw} 堆。`); refresh(S); }
          }
        }
      },

      /* ---------------- 小屋里 ---------------- */
      hut: {
        amb: 'fire', dark: .72, wall: 'wood', floor: 'darkwood', plr: 2.6,
        rows: [
          '##############',
          '##############',
          '#............#',
          '#............#',
          '#............#',
          '#............#',
          '#............#',
          '#............#',
          '######.#######'],
        ents: [
          { id: 'pech', x: 1, y: 2, w: 3, h: 2, spr: 'pech', light: { r: 4.2, col: 'rgba(255,140,60,.25)', flick: true, dx: 24, dy: 22 }, async on(S) {
            const a = S.f.act, e = S.ent('pech'), t = S.f.tk;
            if (a === 'n1in') { S.f.act = 'n1d'; return dinner1(S); }
            if (e.s.yaga) { snore(S); return S.narr('她躺在炉炕上，打着呼噜。\n一只又干又黄的脚，从破被子底下伸了出来。'); }
            if (!isDay(S)) return S.narr('炉膛里的火，从来不灭。');
            if (t.ck === 0) {
              if (!S.has('water')) return S.toast('锅里是空的——先去院子里的井打一桶水。');
              S.take('water'); t.ck = 1; S.f.cookT = 0; e.s.pot = true; S.sfx('water');
              if (a === 'd2') S.toast('锅坐上了。得炖一阵子。'); else await S.narr('你把水倒进大铁锅，切了菜和肉丢进去，把锅推进炉膛。\n得炖一阵子。');
              return refresh(S);
            }
            if (t.ck === 1) return S.toast('锅还在炖。');
            if (a === 'd1' && !S.f.catAway && !S.has('scrap')) { S.give('scrap'); return S.narr('你从锅里捞出一块带肉的骨头。\n窗台下，那只黑猫的耳朵动了一下。'); }
            S.toast('饭炖好了，在锅里焖着。');
          } },
          { id: 'btable', x: 6, y: 4, w: 2, spr: 'btable', async on(S) {
            const a = S.f.act;
            if (a === 'n2') return questions(S);
            if (a === 'n1in') return S.say('芭芭雅嘎', '炉子里！端上来！', { style: 'big' });
            await S.narr('一张黑乎乎的大桌子，桌面上全是刀痕。');
          } },
          { id: 'yaga', x: 6, y: 3, spr: '@yaga', dir: 0, hidden: true, async on(S) {
            S.face('yaga', 'pl');
            const a = S.f.act;
            if (a === 'n2') return questions(S);
            if (a === 'n1in') return S.say('芭芭雅嘎', '炉子里！端上来！', { style: 'big' });
            await S.say('芭芭雅嘎', '看什么看？');
          } },
          { id: 'heap', x: 10, y: 4, spr: 'heap', s: { kind: 'wheat' }, async on(S) {
            const a = S.f.act, e = S.ent('heap'), t = S.f.tk;
            if (!isDay(S)) return S.narr(e.s.kind === 'poppy' ? '一斗罂粟籽，里面掺满了土。' : '一斗麦子。凑近了看，里头掺满了黑籽——比麦粒还多。');
            if (t.so === 2) return S.toast('已经挑好了。');
            if (t.so === 1) return S.toast('娃娃坐在那一堆上，一动不动。有人看着，她就不动。');
            if (a === 'd1' && !S.f.catAway) {
              await S.narr('窗台下，黑猫的绿眼睛一眨不眨地盯着你的口袋。');
              return S.think('当着它的面，不能把娃娃拿出来。');
            }
            if (!S.has('bread')) return S.toast('娃娃得先喂一口——你的面包皮呢？');
            chime(S); S.take('doll'); t.so = 1; S.f.dollT = 0; e.s.doll = true;
            if (a === 'd2') S.toast('你把娃娃放在那一堆上：「吃吧，小娃娃，帮帮我。」——出去，别回头看。');
            else await S.narr(['你掰一点面包皮喂她，把她放在麦堆上：', '「吃吧，小娃娃，帮帮我。」\n娃娃的眼睛亮了亮。你出去，别回头看。']);
            refresh(S);
          } },
          { id: 'hd0', x: 9, y: 3, spr: 'hands', solid: false, hidden: true, z: 1, alpha: 0 },
          { id: 'hd1', x: 11, y: 3, spr: 'hands', solid: false, hidden: true, z: 1, alpha: 0 },
          { id: 'hd2', x: 10, y: 5, spr: 'hands', solid: false, hidden: true, z: 1, alpha: 0 },
          { id: 'hcat', x: 11, y: 2, spr: 'cat', async on(S) {
            if (S.has('scrap')) {
              S.take('scrap'); S.f.catAway = true; S.sfx('item');
              await S.narr('你把骨头放在地上。黑猫看了你好一会儿，才走过来叼住。');
              await S.narr('它叼着骨头，从门缝里溜了出去。');
              S.hide('hcat'); S.show('cat'); S.place('cat', 18, 8, 0);
              return refresh(S);
            }
            if (!isDay(S)) return S.narr('黑猫蹲在窗台下，眼睛绿莹莹的，一眨不眨地看着你。');
            await S.narr('黑猫蹲在窗台下，一眨不眨地看着你。它瘦得皮包骨头。');
          } },
          { id: 'jar', x: 12, y: 2, spr: 'jar', async on(S) {
            if (S.ent('gate').s.oiled || S.has('oil')) return S.narr('一只陶罐。里面的灯油只剩个底了。');
            if (!isDay(S)) return S.narr('一只陶罐，里面晃荡着灯油。');
            S.give('oil'); await S.narr('一只陶罐，里面是灯油。你倒了一小罐揣着。');
          } },
          { id: 'hchest', x: 12, y: 5, spr: 'chest', on: S => S.narr('一口包着铁皮的大箱子。\n你伸手要碰，箱盖缝里「咔哒」响了一声——像牙。') },
          { id: 'broom', x: 12, y: 7, spr: 'broom', async on(S) {
            if (!isDay(S)) return S.narr('一把桦树枝扎的扫帚，靠在墙角。');
            S.hide('broom'); S.give('broom'); refresh(S);
          } },
          { id: 'hpal', x: 1, y: 7, spr: 'pallet', async on(S) {
            const a = S.f.act;
            if (a === 'n1' || a === 'n1b') {
              const r = await S.ask('门边角落里的一张草垫。这是你睡的地方。', ['问问娃娃', '躺下睡觉', '（先不睡）']);
              if (r === 0) return askDoll(S);
              if (r === 1) {
                if (a === 'n1') { await S.narr('你躺下，把娃娃搂在怀里。炉炕上的呼噜声，一下一下，像磨刀。'); await morning(S, 'd1'); S.cp(); return; }
                await S.narr('你躺下的时候，手都抬不起来了。娃娃在你怀里，暖暖的。');
                await morning(S, 'd2'); S.cp('day2'); startD2(S); return;
              }
              return;
            }
            if (isDay(S)) { if (S.f.act === 'd1' && S.ent('hcat') && !S.ent('hcat').hidden) return S.narr('黑猫在看着。当着它，不能把娃娃拿出来。'); if (S.f.act === 'd2') return S.toast('没工夫睡了！'); return askDoll(S); }
            if (a === 'n2') return S.narr('她就坐在桌边。她的眼睛跟着你。\n——在这儿，不能把娃娃拿出来。');
            await S.narr('草垫。');
          } },
          { id: 'scr', x: 0, y: 6, spr: 'scratch', async on(S) {
            if (S.once('scrIntro')) await S.narr('草垫边的木墙上，有一道一道的划痕。\n凑近了看，是字。');
            S.f.scr = true;
            await S.note('scratch');
          } },
          { id: 'hwin1', x: 5, y: 1, spr: 'window', on: S => S.narr(S.f.night ? '窗外，篱笆上一圈头骨亮着。像一圈不眨眼的灯。' : '窗外是院子，再远是黑压压的林子。') },
          { id: 'hwin2', x: 9, y: 1, spr: 'window', on: S => S.narr('窗台上落满了灰，灰里有几道细细的爪印。') },
          { id: 'hexit', x: 6, y: 8, async touch(S) {
            const a = S.f.act;
            if (a === 'n1in' || a === 'n1d' || a === 'n1' || a === 'n1b') { await S.think('夜里出去？篱笆上那些眼睛都睁着呢。'); S.pos(6, 7, 3); return; }
            if (a === 'n2' && S.once('n2out')) await S.say('芭芭雅嘎', '去吧。跑不了的。我等着。');
            await S.go('yard', 9, 5, 0);
          } }
        ],
        async enter(S) {
          mood(S);
          const t = S.f.tk;
          if (isDay(S) && t && t.so === 1 && S.f.dollT >= DOLL_T[S.f.day]) {
            t.so = 2; const e = S.ent('heap'); e.s.done = true; e.s.doll = false; S.give('doll', true); chime(S);
            if (S.f.act === 'd2') S.toast('罂粟籽和土分成了两堆。娃娃回到了你的口袋里。');
            else await S.narr(['麦堆分成了两堆：一堆干干净净的金黄麦粒，一小撮黑籽。', '娃娃靠在旁边，像是累得睡着了。你把她揣回口袋。']);
            refresh(S);
          } else if (isDay(S) && t && t.so === 1 && S.f.dollT > 0 && S.once('peek_' + S.f.day)) S.toast('娃娃坐在那一堆上，一动不动——你一进门，她就停了。');
        },
        tick(S, dt) {
          const pe = S.ent('pech');
          if (pe.s.yaga) {
            PT.sn -= dt; if (PT.sn <= 0) { PT.sn = 2.6; snore(S); }
            if (S.running && !S.busy && S.once('wake_' + S.f.act)) S.run(async S2 => { S2.shake(300, 1); await S2.say('芭芭雅嘎（炉炕上）', '……谁在跑？……骨头……我的骨头……', { style: 'whisper' }); await S2.think('她翻了个身，又打起了呼噜。\n——晚上在屋里，别跑。'); });
          }
        }
      }
    }
  });
  const PT = { sn: 0, hb: 0, rs: 0 };

  /* ---------- 地图生成（定义时调用，hash 在引擎里） ---------- */
  function forestRows() {
    const FW = 48, FH = 16, g = [];
    const SEG = [[0, 7, 10, 8], [9, 3, 10, 8], [9, 3, 20, 4], [19, 3, 20, 12], [19, 11, 31, 12], [30, 5, 31, 12], [30, 5, 39, 6], [38, 2, 39, 6], [38, 2, 47, 3], [31, 11, 37, 12], [36, 11, 37, 14]];
    for (let y = 0; y < FH; y++) { const r = []; for (let x = 0; x < FW; x++) r.push(hash(x, y, 181) < .35 ? 'T' : 'P'); g.push(r); }
    const path = new Set();
    for (const [x0, y0, x1, y1] of SEG) for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) path.add(x + ',' + y);
    for (const k of path) { const [x, y] = k.split(',').map(Number); for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) { const nx = x + dx, ny = y + dy; if (nx < 0 || ny < 0 || nx >= FW || ny >= FH || path.has(nx + ',' + ny)) continue; if (g[ny][nx] === 'T' || g[ny][nx] === 'P') g[ny][nx] = hash(nx, ny, 182) < .7 ? '"' : 'B'; } }
    for (const k of path) { const [x, y] = k.split(',').map(Number); g[y][x] = 'd'; }
    for (let y = 10; y <= 13; y++) for (let x = 24; x <= 25; x++) if (g[y][x] === 'd' || g[y][x] === '"') g[y][x] = 's';
    g[8][32] = '"';
    return g.map(r => r.join(''));
  }
  function yardRows() {
    const g = [];
    for (let y = 0; y < 16; y++) { const r = []; for (let x = 0; x < 22; x++) r.push(hash(x, y, 183) < .3 ? 'T' : 'P'); g.push(r); }
    for (let x = 2; x <= 19; x++) g[1][x] = '"';
    for (let x = 2; x <= 19; x++) { g[2][x] = 'Y'; g[11][x] = 'Y'; }
    for (let y = 2; y <= 11; y++) { g[y][2] = 'Y'; g[y][19] = 'Y'; }
    for (let y = 3; y <= 10; y++) for (let x = 3; x <= 18; x++) g[y][x] = hash(x, y, 184) < .22 ? '"' : '.';
    for (let x = 4; x <= 17; x++) g[12][x] = '"';
    for (let x = 7; x <= 14; x++) g[13][x] = '"';
    for (let y = 11; y <= 15; y++) { g[y][10] = 'd'; g[y][11] = 'd'; }
    g[14][9] = '"'; g[14][12] = '"';
    return g.map(r => r.join(''));
  }
})();
