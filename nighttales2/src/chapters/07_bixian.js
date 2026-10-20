/* ================= 第七夜 · 笔仙 ================= */
(() => {
  /* ---------- 小工具 ---------- */
  const PEN = '#c8242a';
  const MOON = 'rgba(150,175,220,.10)';
  const FLUO = 'rgba(225,240,255,.10)';
  /* 笔在纸上「写」出一个答案：先旁白描述笔的移动，再用大字显示 */
  async function pen(S, move, ans, o = {}) {
    S.sfx('paper');
    await S.narr(move);
    if (ans) { await S.wait(o.pause || 300); await S.say('', ans, { style: 'big' }); }
    const d = S.ent(o.desk || 'rdesk'); if (d) d.s.marks = (d.s.marks || 0) + 1;
  }
  const caught = async S => {
    await S.scare('face', { spr: '@xiaoman' });
    await S.die('一只冰凉的手，轻轻搭在你的肩膀上。\n「岚岚？……」\n她凑近了，看了你很久很久。\n「……你不是岚岚。」', '她找到了你');
  };
  function resetChase(S) {
    S.stop('xm_d'); S.place('xm_d', 32, 3, 1); S.ent('xm_d').alpha = 1;
    S.pos(28, 3, 1);
    S.chase('xm_d', { spd: 2.8, catch: caught }); S.ent('xm_d').chase.wait = 1.4;
    S.ent('dlamp').off = false; S.ent('exitL').s.flick = true;
    S.dark(.93); S.amb('drone');
    S.goal('跑！去走廊那一头的值班室——那里亮着灯');
  }

  defChapter({
    id: 'bixian', n: 7, title: '笔仙', sub: '两只手背交叉，握住一支红笔。「笔仙笔仙，我是你的今生，你是我的前世……」', origin: '中国校园怪谈', color: '#1f3a2e',
    icon: '@xiaoman', amb: 'school', floor: 'linoleum', wall: 'school', dark: .3, plr: 3.4,
    people: {
      me: { key: 'bx-me', skin: '#f1c9a5', hair: '#1a1416', hs: 'short', top: '#2c5c9c', top2: '#eef0f4', bottom: '#2c5c9c', shoes: '#e8e8e8',
        extra(g, d, fr, G, R) { if (d === 0) { R(3, G.tT + 2, 1, 3, '#eef0f4'); R(12, G.tT + 2, 1, 3, '#eef0f4'); } else if (d === 1) R(7, G.tT + 1, 2, 1, '#eef0f4'); } },
      suqing: { key: 'bx-su', skin: '#f3d0b0', hair: '#2a1a14', hs: 'bob', top: '#2c5c9c', top2: '#eef0f4', bottom: '#2c5c9c', shoes: '#e8e8e8', blush: '#e8a8a0',
        extra(g, d, fr, G, R) { if (d === 0) { R(3, G.tT + 2, 1, 3, '#eef0f4'); R(12, G.tT + 2, 1, 3, '#eef0f4'); } } },
      zhou: { skin: '#e8c2a2', hair: '#1a1414', hs: 'bun', top: '#6a3a48', top2: '#d8cfc0', bottom: '#2a2a34', shoes: '#3a2a2a', coat: true },
      xiaoman: { key: 'bx-xm', skin: '#d6d2d8', hair: '#0c0a0e', hs: 'long', cover: true, top: '#34466a', top2: '#dadada', bottom: '#34466a', ghost: true,
        extra(g, d, fr, G, R) { if (d === 0) { R(4, G.tT + 3, 8, 1, '#c8c8cc'); R(6, G.tT, 4, 1, '#dadada'); } else if (d === 1) R(5, G.tT + 3, 6, 1, '#c8c8cc'); } },
      xiaomanC: { key: 'bx-xmc', skin: '#e4dcd8', hair: '#120e12', hs: 'long', top: '#34466a', top2: '#dadada', bottom: '#34466a', eye: '#2a2024', ghost: true,
        extra(g, d, fr, G, R) { if (d === 0) { R(4, G.tT + 3, 8, 1, '#c8c8cc'); R(6, G.tT, 4, 1, '#dadada'); R(7, G.hT + 6, 2, 1, '#b88a88'); } } }
    },
    items: {
      paper: { name: '白纸', desc: '从你作业本最后一页撕下来的。苏晴在上面写了「是」「否」和 0 到 9。' },
      thermos: { name: '暖壶', desc: '寝室的绿色铁皮暖壶，壶身上掉了一块漆。' },
      flash: { name: '手电筒', desc: '周老师的手电筒，光圈又白又亮，握把上缠着胶布。' },
      okey: { name: '旧楼钥匙', desc: '一串生锈的钥匙，铁圈上挂着一块小木牌：「旧楼·档案室」。' },
      card: { name: '学籍卡', desc: '林小满，女，1977年5月21日生，高二(3)班。卡片右上角盖着一个红章：「注销」。' },
      diary: { name: '小满的日记本', desc: '一本塑料封皮的日记本，封面印着一只小鹿。里面夹着一张折了四折的旧纸。' },
      match: { name: '火柴和蜡烛', desc: '半截白蜡烛，一盒红头的老式火柴。盒子上印着「安全火柴」。' },
      pen: { name: '红笔', desc: '一支红色圆珠笔。笔杆上有几道很深的牙印。……这不是你的笔。' }
    },
    notes: {
      rules: { title: '笔仙的规矩（苏晴抄的）', text: '（作业本背面，苏晴的字，写得密密麻麻）\n\n【请笔仙】\n1. 两个人，手背交叉，一起夹住一支笔（红笔最灵），笔尖立在白纸正中间。\n2. 纸上写好「是」「否」，还有 0 到 9。\n3. 两个人一起念：\n「笔仙笔仙，我是你的今生，你是我的前世。若要与我续缘，请在纸上画圈。」\n笔自己画了圈，就是来了。\n\n【禁忌】\n一、不管发生什么，都不能松手！中途松手，笔仙就回不去了，会一直留下来。\n二、不能问它是怎么死的。\n三、不能问自己什么时候死。\n四、问完一定要送它走：「笔仙笔仙，请你回去吧。」等它画了圈，两个人再一起松手。\n五、用过的纸要烧掉，笔要折断，以后谁也不能再用。\n\n（最下面歪歪扭扭补了一行：高三的学姐说，她们班有人玩完没烧纸，第二天那支笔就自己跑到她枕头底下了！！）' },
      mag: { title: '杂志剪页 ·《校园怪谈大起底》', text: '（一本卷了边的《青春故事》，苏晴用红笔在这页上画了好几个圈。）\n\n笔仙、碟仙、狐狗狸，是一家人吗？\n\n「碟仙」用的是一只倒扣的小碟子，几个人各伸一根手指按在碟底，碟子在写满字的纸上滑动，「回答」问题。\n日本的「狐狗狸さん」（狐狗狸）用一枚十元硬币，纸上画着鸟居、「是」「否」和五十音。据说请来的是狐狸、狗、狸猫一类的灵，所以写作「狐狗狸」。\n西方也有「通灵板」（Ouija），板上印着字母和 YES / NO。\n\n到了中国的校园里，这些都变成了最简单的一样：一张纸、一支笔、两个人。\n\n规矩大同小异：要念召请的话，要问「是」「否」，不能问它怎么死的，结束了一定要送走。\n\n有专家说，笔会自己动，是因为两个人的手都在不自觉地用力，谁也不觉得是自己在推——这叫「意念动作」。\n……可是，那为什么笔写出来的，总是两个人都不知道的事呢？' },
      report: { title: '情况说明（1994年12月10日）', text: '青岚中学教务处\n\n关于我校高二(3)班学生林小满同学意外身亡的情况说明\n\n1994年12月9日（星期五）晚九时许，因线路检修，全校停电。\n当晚，林小满同学于宿舍熄灯后独自返回旧教学楼，在二楼楼梯处不慎踏空跌落。因夜间无人，至次日清晨六时许，方被值日学生发现。\n\n经了解：当晚宿舍查寝时，同寝室学生周岚以为林小满在水房，代其应答「到」，致使值班老师未能及时发现其未归。\n另据同学反映，事发前，林小满曾与同学在教室内玩「笔仙」游戏。\n\n学校决定：\n一、严禁学生以任何形式玩「笔仙」「碟仙」等迷信游戏；\n二、旧教学楼自即日起夜间封闭；\n三、加强查寝制度，严禁代答。\n\n（页边，有人用铅笔写了一行很小的字：\n二楼楼梯灯坏了半个月，报修了三次。）' },
      diary: { title: '林小满的日记（最后几页）', text: '12月2日　晴\n岚岚说，她表姐教她请笔仙。要两个人，手背交叉握着笔。我说我才不信。岚岚说，那你就当陪我玩嘛。\n\n12月9日　阴\n晚自习的时候我们真的请了。笔真的会自己动！它说它是女的，说它也在这个班上过学。\n然后停电了。\n岚岚尖叫了一声，松开手就跑了。笔从我手里滚下去，在纸上拖了长长的一道。\n\n表姐说，松了手一定要送走，不然它会留下来。送的时候要叫它的名字，它才知道你在送谁。可是我们还没来得及问它叫什么……\n\n回宿舍以后我一直睡不着。我决定回来。\n\n（下面的字是歪的，像是借着烛光写的）\n现在我一个人坐在教室里。蜡烛是讲台抽屉里的。\n我叫它「笔仙」，跟它说对不起，说岚岚不是故意的，请它回家去。\n笔在纸上画了一个圈。很圆很圆。\n我把纸折起来夹在这里了，明天拿给岚岚看，让她别怕。\n\n岚岚，别怕。不怪你。\n\n楼梯好黑。我得回去了，查寝之前要回去。' }
    },
    legend: '「笔仙」是中国大陆校园里流传最广的招灵游戏之一，八九十年代起在中学生中盛行。玩法是：两个人手背交叉（也有手指相扣、手心相对的说法），一起握住一支笔，笔尖立在写着「是」「否」和数字的白纸上，念一段召请的话——最常见的版本是「笔仙笔仙，我是你的今生，你是我的前世，若要与我续缘，请在纸上画圈」。笔若自己画了圈，就说明「笔仙」来了，可以向它提问。\n\n与它相伴的是一串禁忌：中途不能松手，否则笔仙回不去，会「留下来」；不能问它是怎么死的；不能问自己什么时候死；问完一定要送走，送走时要等它画圈；用过的纸要烧掉，笔要折断或扔掉。也有说法认为笔仙是附近徘徊的亡魂，问到它的死因会让它「重演一遍」。这些规矩在各个学校的版本各不相同，大多靠学长学姐口耳相传，再添油加醋。\n\n笔仙与「碟仙」（几个人用手指按住倒扣的碟子）、日本的「狐狗狸さん」（用硬币，据说请来的是狐狸狗狸一类的灵）、西方的通灵板（Ouija）是同一类游戏。十九世纪欧美流行的「桌灵转」和「自动书写」，也被认为是它们的远亲。心理学上一般用「意念动作效应」（ideomotor effect）来解释：参与者在不知不觉中做出微小的肌肉动作，彼此都以为是对方或者「笔仙」在推动。\n\n九十年代以后，不少学校明令禁止学生玩笔仙、碟仙，校园怪谈却越传越多，后来还被拍成了电影。至于「请来的到底是谁」，从来没有统一的答案。\n\n（本章中的青岚中学、林小满与周岚的往事、旧楼的事故与送走的方法，均为游戏虚构。）',
    start: { map: 'cls', x: 9, y: 7, dir: 3 },
    resume: {
      room: async S => { },
      chase: async S => { resetChase(S); },
      final: async S => { }
    },
    async intro(S) {
      await S.card('第七夜　笔仙', '2006年12月8日　星期五　青岚中学', '晚自习的下课铃响过了。\n教学楼里的灯一层一层地灭下去。\n\n高二(3)班的教室里，只剩下你和苏晴。\n离宿舍熄灯，还有十五分钟。');
    },
    sprites: {
      bxdesk(g, e, t, R) {   // 新教学楼的课桌，可摆白纸和红笔
        R(2, 10, 1, 6, '#555'); R(13, 10, 1, 6, '#555'); box(R, 1, 3, 14, 8, '#c49a62'); R(2, 4, 12, 1, '#d6ae78');
        R(4, -2, 8, 5, '#6a6a6a'); R(5, -1, 6, 3, '#4a6a9a');
        if (e.paper) {
          R(3, 4, 10, 6, e.burn ? '#3a2a20' : '#f2eee4');
          if (!e.burn) { R(4, 5, 2, 1, '#333'); R(10, 5, 2, 1, '#333'); for (let i = 0; i < 5; i++) R(4 + i * 2, 8, 1, 1, '#555'); if (e.marks) { R(6, 6, 4, 1, PEN); R(9, 7, 1, 1, PEN); if (e.marks > 2) { R(5, 7, 3, 1, PEN); } } }
        }
        if (e.pen) { R(7, 2, 1, 6, PEN); R(7, 7, 1, 1, '#e8e8e8'); }
      },
      odesk(g, e, t, R) {   // 旧楼的木课桌（翻盖）
        R(2, 10, 2, 6, '#3a2818'); R(12, 10, 2, 6, '#3a2818'); box(R, 1, 2, 14, 9, '#6a4a2c'); R(2, 3, 12, 1, '#7d5a38'); R(2, 6, 12, 1, '#4f3620');
        R(4, -3, 8, 5, '#4a3420'); R(5, -2, 6, 2, '#5d4229');
        if (e.carve) { R(4, 4, 3, 1, '#3a2614'); R(9, 4, 2, 1, '#3a2614'); }
        if (e.open) R(3, 7, 10, 3, '#140c08');
        if (e.paper) { R(3, 3, 10, 5, '#e2d8c0'); R(4, 4, 2, 1, '#444'); R(10, 4, 2, 1, '#444'); R(6, 5, 4, 2, 'rgba(200,40,40,.7)'); }
        if (e.pen) { R(8, 1, 1, 6, PEN); }
        if (e.ash) { R(4, 4, 7, 3, '#2a2420'); R(6, 5, 2, 1, '#6a5a50'); }
      },
      bunk(g, e, t, R) {   // 铁架上下铺（2 格高）
        const c = e.col || '#5a7aa0', c2 = e.col2 || '#8a6a8a';
        R(1, -16, 2, 47, '#6a7078'); R(13, -16, 2, 47, '#6a7078');
        box(R, 1, -12, 14, 14, '#c8c4bc'); R(2, -11, 12, 4, '#ecebe6'); R(2, -6, 12, 8, c2); R(2, -6, 12, 1, shade(c2, .2));
        if (e.up) { R(5, -12, 6, 4, e.up); R(5, -9, 6, 2, '#e8c8a8'); }
        R(1, 3, 14, 2, '#6a7078');
        box(R, 1, 13, 14, 16, '#c8c4bc'); R(2, 14, 12, 5, '#ecebe6'); R(2, 19, 12, 10, c); R(2, 19, 12, 1, shade(c, .2));
        if (e.low) { R(5, 13, 6, 4, e.low); R(5, 16, 6, 2, '#e8c8a8'); R(3, 20, 10, 3, shade(c, .1)); }
        if (e.pen) { R(9, 15, 4, 1, PEN); }
        R(13, -2, 2, 2, '#4a4e55'); for (let i = 0; i < 4; i++) R(13, -10 + i * 4, 2, 1, '#8a9098');
      },
      thermos(g, e, t, R) { R(5, 1, 6, 13, '#2a7a4a'); R(5, 1, 6, 2, '#1e5a36'); R(6, 0, 4, 2, '#c8c0a8'); R(5, 12, 6, 2, '#1e5a36'); R(10, 4, 2, 6, '#1e5a36'); R(6, 6, 2, 2, '#4a9a6a'); R(8, 9, 2, 2, '#c8b080'); },
      boiler(g, e, t, R) {   // 开水器
        box(R, 1, -12, 14, 26, '#b8bcc0'); R(2, -11, 12, 3, '#d0d4d8'); R(3, -6, 10, 6, '#8a9096');
        R(4, -5, 3, 2, e.lit ? '#ff3a2a' : '#5a2020'); R(9, -5, 3, 2, e.lit ? '#5adf6a' : '#204a24');
        R(6, 4, 4, 2, '#7a7e84'); R(7, 6, 2, 3, '#7a7e84');
        if (e.run) { R(7, 9, 1, 5, 'rgba(220,235,255,.8)'); R(6, 13, 3, 1, 'rgba(220,235,255,.5)'); }
      },
      tap(g, e, t, R) {   // 一排水龙头的水池
        box(R, 0, 2, 16, 10, '#b8b8b0'); R(1, 4, 14, 6, '#7a8a8e'); R(7, 0, 2, 4, '#9aa0a6'); R(6, 0, 4, 1, '#b4bac0');
        if (e.run) { const k = (t * 8) % 2 < 1; R(7, 4, 1, 5, 'rgba(210,230,255,.85)'); R(5 + (k ? 1 : 0), 8, 5, 1, 'rgba(210,230,255,.6)'); }
        R(4, 12, 8, 3, '#9a9a92');
      },
      rack(g, e, t, R) {   // 晾衣架
        R(1, -12, 1, 27, '#8a8e94'); R(14, -12, 1, 27, '#8a8e94'); R(0, -12, 16, 1, '#a8acb2'); R(0, 14, 4, 1, '#6a6e74'); R(12, 14, 4, 1, '#6a6e74');
        const cl = e.cl || ['#d8d8d0', '#e8a0a8', '#34466a'];
        R(2, -11, 4, 10, cl[0]); R(7, -11, 3, 7, cl[1]); R(11, -11, 3, 12, cl[2]);
        if (e.old) { R(11, -8, 3, 1, '#c8c8cc'); }
      },
      keybox(g, e, t, R) { box(R, 2, 1, 12, 11, '#6a5038'); for (let i = 0; i < 4; i++) { const x = 4 + i * 2.5; R(x, 3, 1, 1, '#ccc'); if (!(i === 2 && e.taken)) R(x, 4, 1, 4, '#c9a35a'); } R(3, 10, 10, 1, '#4a3828'); },
      dtable(g, e, t, R) {   // 值班室的小桌，相框 + 台灯
        box(R, 0, 2, 16, 12, '#6a4a30'); R(1, 3, 14, 2, '#7d5a3a');
        R(2, -2, 6, 6, '#c9a35a'); R(3, -1, 4, 4, '#d8d0c0'); R(4, 0, 1, 2, '#34466a'); R(5, 0, 1, 2, '#2c5c9c');
        R(11, -2, 1, 6, '#333'); R(9, -5, 5, 3, e.off ? '#6a5a3a' : '#f0d890');
      },
      daisy(g, e, t, R) { R(7, 6, 1, 8, '#6a6a3a'); R(9, 7, 1, 7, '#6a6a3a'); R(5, 8, 1, 6, '#6a6a3a'); R(5, 12, 6, 2, '#a07a50'); for (const [x, y] of [[6, 4], [9, 5], [4, 6]]) { R(x, y, 3, 2, e.fresh ? '#f0ece0' : '#bab2a0'); R(x + 1, y, 1, 1, e.fresh ? '#e8c040' : '#8a7a40'); } },
      slogan(g, e, t, R) { R(0, 2, 64, 9, '#8a1a1a'); R(0, 2, 64, 1, '#a83030'); for (let i = 0; i < 8; i++) R(4 + i * 7.5, 5, 4, 4, i % 2 ? '#d8c060' : '#e8d070'); R(0, 10, 64, 1, '#5a1010'); },
      cardcab(g, e, t, R) {   // 学籍卡柜（很多小抽屉）
        box(R, 0, -12, 16, 27, '#5a6a5a');
        for (let r = 0; r < 6; r++) for (let c = 0; c < 2; c++) { box(R, 1 + c * 7, -11 + r * 4, 7, 4, '#6d7d6d'); R(3 + c * 7, -10 + r * 4, 3, 1, '#d8d4c8'); R(4 + c * 7, -8 + r * 4, 1, 1, '#c9a35a'); }
        if (e.open) { R(1, -3, 7, 4, '#141814'); R(-2, -2, 9, 3, '#6d7d6d'); R(-1, -3, 7, 1, '#e8e4d8'); }
      },
      chart(g, e, t, R) { R(2, 1, 12, 11, '#e2dac4'); R(2, 1, 12, 2, '#a83030'); for (let r = 0; r < 4; r++) for (let c = 0; c < 3; c++) R(3 + c * 4, 4 + r * 2, 3, 1, '#666'); if (e.mark) R(11, 10, 3, 1, PEN); },
      plate(g, e, t, R) { R(3, 0, 10, 5, '#2a2018'); R(4, 1, 8, 3, e.col || '#e8e4d8'); R(5, 2, 6, 1, '#333'); },
      exitsign(g, e, t, R) { const on = !e.flick || Math.sin(t * 23) > -.6; R(3, 1, 10, 6, '#1a4a2a'); R(4, 2, 8, 4, on ? '#5ae08a' : '#2a6a3a'); R(5, 3, 2, 2, '#e8fff0'); R(8, 4, 3, 1, '#e8fff0'); },
      cal94(g, e, t, R) { R(4, 0, 8, 12, '#e8e2d0'); R(4, 0, 8, 3, '#b02a2a'); R(6, 4, 4, 1, '#444'); for (let i = 0; i < 9; i++) R(5 + (i % 3) * 2, 6 + ((i / 3) | 0) * 2, 1, 1, '#777'); R(7, 1, 2, 1, '#eee'); },
      jiangtai(g, e, t, R) { box(R, 0, -1, 16, 15, '#6a4a2c'); R(1, 0, 14, 2, '#8a6a42'); R(2, 4, 12, 8, '#553a22'); if (e.open) R(4, 5, 8, 3, '#140c08'); R(3, -3, 4, 2, '#e8e4d8'); },
      broom(g, e, t, R) { R(3, -6, 1, 18, '#8a6a3a'); R(1, 11, 5, 4, '#b8a060'); R(9, 6, 6, 8, '#3a6aa8'); R(9, 6, 6, 1, '#5a8ac8'); R(11, 3, 1, 4, '#888'); },
      bucket(g, e, t, R) { R(4, 6, 8, 8, '#c84a3a'); R(4, 6, 8, 1, '#e86a5a'); R(4, 13, 8, 1, '#8a2a2a'); R(10, -4, 1, 11, '#8a6a3a'); R(8, 6, 5, 3, '#c8c4b8'); },
      deskpile(g, e, t, R) { box(R, 1, 4, 14, 7, '#6a4a2c'); R(2, 11, 1, 4, '#3a2818'); R(13, 11, 1, 4, '#3a2818'); box(R, 0, -4, 16, 6, '#5d4229'); R(2, -10, 1, 6, '#3a2818'); R(13, -10, 1, 6, '#3a2818'); box(R, 3, -14, 10, 4, '#4f3620'); },
      shoerack(g, e, t, R) { box(R, 0, 4, 16, 10, '#7a7e84'); R(1, 8, 14, 1, '#5a5e64'); R(2, 5, 4, 3, '#e8e8e8'); R(9, 5, 4, 3, '#c84a6a'); R(3, 10, 4, 2, '#4a4a4a'); R(9, 10, 4, 2, '#e8e8e8'); },
      bxcandle(g, e, t, R) {   // 摆在课桌上的蜡烛（画在桌面上）
        R(7, 1, 3, 6, '#e8e2cc'); R(6, 6, 5, 1, '#c8c0a8');
        if (!e.off) { const f = Math.sin(t * 15) > 0 ? 1 : 0; R(8, -2 + f, 1, 3 - f, '#ffcf5a'); R(8, -1, 1, 1, '#fff6c0'); }
      }
    },
    maps: {
      /* ---------------- 新教学楼 · 高二(3)班 ---------------- */
      cls: {
        amb: 'school', dark: .3, plr: 3.4, wall: 'school', floor: 'linoleum',
        rows: [
          '################',
          '################',
          '#..............#',
          '#..............#',
          '#..............#',
          '#..............#',
          '#..............#',
          '#..............#',
          '#..............#',
          '#..............#',
          '################'],
        ents: [
          { x: 2, y: 1, spr: 'window', light: { r: 2.6, col: MOON, dy: 10 }, on: S => S.narr(S.f.cut ? '玻璃上映出你自己的脸，白得像一张纸。\n操场那头，旧楼二楼的那一点光，还亮着。' : '窗外是空荡荡的操场。操场那头，旧教学楼黑沉沉地蹲着。\n二楼最右边的一扇窗户里，好像有一点点光。……那栋楼不是早就封了吗？') },
          { x: 5, y: 1, spr: 'blackboard', text: true, on: S => S.narr('黑板右上角写着：「距期末考试　还有 23 天」。值日生：苏晴。\n角落里有人用粉笔画过一个圆圈，圈里写着「是」「否」——被谁用手指抹掉了一半。') },
          { x: 8, y: 1, spr: 'poster', col: '#d8d0b0', on: S => S.narr('课程表。周六上午还有两节数学。\n不知道是谁在「自习」两个字旁边，画了一个吐舌头的鬼脸。') },
          { id: 'clk', x: 10, y: 1, spr: 'wallclock', on: S => S.narr(S.f.cut ? '指针停在十点整。秒针在「12」上一抖一抖的，就是走不过去。' : '九点四十七分。十点整，宿舍和教学楼一起拉闸熄灯。') },
          { x: 12, y: 1, spr: 'window', light: { r: 2.6, col: MOON, dy: 10 }, on: S => S.narr('窗户没关严，冷风从缝里一丝一丝地往里钻。\n楼下，值班的保安打着手电走过去了。') },
          { id: 'cdoor', x: 14, y: 1, spr: 'door', col: '#4a6a5a', async on(S) {
            if (S.f.cut) return S.narr('门外的走廊一片漆黑。');
            if (S.f.dared) return S.say('苏晴', '哎——别走嘛！就玩一会儿，十点之前肯定完。');
            await S.narr('教室的后门。走廊里的声控灯已经不亮了。');
          } },
          { id: 'jt', x: 5, y: 2, spr: 'jiangtai', async on(S) {
            if (S.f.dared && !S.f.gotPen) {
              S.f.gotPen = true; S.ent('jt').open = true; S.give('pen');
              await S.narr('讲台抽屉里，粉笔盒和板擦中间，躺着一支红色的圆珠笔。\n笔杆上有几道很深的牙印。……班上好像没有人用这样的笔。');
              await S.think('算了，就它吧。红笔。');
              return stepGoal(S);
            }
            await S.narr(S.f.gotPen ? '讲台抽屉里只剩粉笔头和一块板擦。' : '讲台上摆着一摞没改完的物理卷子。最上面那张，红叉打得密密麻麻。');
          } },
          { id: 'fl1', x: 4, y: 4, spr: 'invisible', light: { r: 5.5, col: FLUO } },
          { id: 'fl2', x: 10, y: 4, spr: 'invisible', light: { r: 5.5, col: FLUO } },
          { id: 'fl3', x: 4, y: 8, spr: 'invisible', light: { r: 5.5, col: FLUO } },
          { id: 'fl4', x: 10, y: 8, spr: 'invisible', light: { r: 5.5, col: FLUO } },
          ...[[2, 4], [3, 4], [6, 4], [7, 4], [11, 4], [12, 4], [2, 6], [3, 6], [11, 6], [12, 6], [2, 8], [3, 8], [6, 8], [7, 8], [11, 8], [12, 8]].map(([x, y], i) => ({ x, y, spr: 'bxdesk', on: S => S.narr([
            '桌面上贴着一张纸条：「距离高考 548 天」。', '课桌抽屉里塞满了卷子，乱得像个鸟窝。', '桌面上有人用涂改液写了个名字，又用圆规划掉了。', '这是班长的桌子。书本码得整整齐齐，连橡皮都摆正了。',
            '桌角刻着一行小字：「我想回家」。', '抽屉里有半包没吃完的干脆面。', '桌面上用圆珠笔画了一个小人，小人手里握着一支笔。', '靠窗的位置。玻璃上呵出来的雾气，还没散干净。',
            '有人在桌子上贴了一张周杰伦的贴纸。', '桌洞里黑漆漆的。你没有把手伸进去。', '空桌子。听说这个位置的人上个月转学了。', '抽屉里有一本《青春故事》，翻开在「真实校园怪谈」那一页。',
            '桌面上写着「早」字。是从课文里学来的。', '课桌底下滚着一颗玻璃弹珠。', '桌面上刻着：「笔仙是假的」。字刻得很深。', '这张桌子总是不太稳，一碰就吱呀一声。'][i]) })),
          { id: 'mydesk', x: 6, y: 6, spr: 'bxdesk', async on(S) {
            if (S.f.dared && !S.f.gotPaper) {
              S.f.gotPaper = true; S.give('paper');
              await S.narr('你从数学作业本最后一页，「嘶啦」一声，撕下一张白纸。');
              return stepGoal(S);
            }
            await S.narr('你的课桌。桌面上摊着没写完的数学卷子，最后一道大题空着。');
          } },
          { id: 'rdesk', x: 7, y: 6, spr: 'bxdesk', on: S => ritual1(S) },
          { id: 'su', x: 8, y: 6, spr: '@suqing', dir: 1, async on(S) {
            S.face('su', 'pl');
            if (S.f.cut) return;
            if (S.f.gotPen && S.f.gotPaper) return S.say('苏晴', '都准备好啦？快坐过来。');
            await S.say('苏晴', ['白纸、红笔。规矩都写在纸上了，你自己看嘛。', '……喂，你不会是怕了吧？']);
          } },
          { id: 'rulesP', x: 9, y: 6, spr: 'note', on: S => readRules(S) },
          { x: 14, y: 4, spr: 'shelf', on: S => S.narr('图书角。《读者》《意林》《青年文摘》……\n最下面一层，塞着一本被翻烂了的《校园鬼故事大全》。') },
          { x: 14, y: 9, spr: 'broom', on: S => S.narr('卫生角。扫把、簸箕，还有一个装满了粉笔灰的纸箱。') },
          { x: 1, y: 9, spr: 'bucket', on: S => S.narr('拖把桶里的水已经结了一层薄冰。') }
        ],
        async enter(S, first) {
          if (!first) return;
          await S.narr('日光灯「嗡嗡」地响。暖气早就停了，呵出来的气是白的。');
          S.face('su', 2); S.bubble('su', '!', 900);
          await S.say('苏晴', ['陈默！先别走——', '我跟你说，我从高三学姐那儿要来了一个好东西。']);
          S.face('su', 'pl');
          await S.say('苏晴', ['笔仙。', '两个人一起握着一支笔，念一段话，笔就会自己动起来，在纸上回答你的问题。', '学姐说，问什么它都知道。期末考题、谁喜欢谁……什么都知道。']);
          const r = await S.ask('「玩一次嘛，就一次。」', ['……好吧，就一次。', '那都是骗人的。'], '苏晴');
          if (r === 1) await S.say('苏晴', ['骗人的你怕什么？', '十点就熄灯了。陪我玩一次，明天早饭我请你吃肉包子。']);
          await S.say('苏晴', ['要一张白纸，还有一支红笔——学姐说红笔最灵。', '规矩我都抄下来了，放在桌上。你先看看。']);
          S.f.dared = true;
          stepGoal(S);
        }
      },
      /* ---------------- 女生宿舍 307 ---------------- */
      room: {
        amb: 'room', dark: .86, plr: 3, wall: 'school', floor: 'tile', tileOpts: { tileC: '#a8a89c' },
        rows: [
          '############',
          '############',
          '#..........#',
          '#..........#',
          '#..........#',
          '#..........#',
          '#..........#',
          '#..........#',
          '############'],
        ents: [
          { id: 'bunkA', x: 1, y: 2, h: 2, spr: 'bunk', col: '#c87a8a', col2: '#6a8a6a', s: { low: '#2a1a14', up: '#3a2418' }, on: S => talkSu(S) },
          { id: 'bunkB', x: 1, y: 5, h: 2, spr: 'bunk', col: '#5a7aa0', col2: '#a08a5a', s: { up: '#1a1414', pen: true }, async on(S) {
            const b = S.ent('bunkB');
            if (b.s.pen) {
              b.s.pen = false;
              S.sfx('sting');
              await S.narr('你的枕头上，端端正正地摆着一支红笔。\n笔杆上，有几道很深的牙印。');
              await S.think('……不可能。我明明把它丢在教室里了。\n停电的时候，它从桌上滚下去了。我听见了。');
              if (!S.has('pen')) S.give('pen');
              return;
            }
            await S.narr('你的下铺。被子还是早上叠的样子。\n上铺的大刘打着小呼噜，翻了个身，嘟囔了一句「别抄我作业」。');
          } },
          { x: 4, y: 1, spr: 'window', light: { r: 2.8, col: MOON, dy: 12 }, on: S => S.narr('窗外是操场，再过去就是旧楼。\n旧楼二楼最右边的那扇窗户里，有一点很小很小的光，一晃，一晃。\n像有人点着一根蜡烛，坐在那里。') },
          { x: 6, y: 1, spr: 'mirror', frame: '#9a9a90', on: S => S.narr(S.f.knocked ? '镜子里的寝室很暗。四张床，四团被子。\n……上铺有一团被子，好像比刚才鼓了一点。' : '门边的小镜子。镜框上贴满了大头贴。\n镜子里，你的眼睛下面有两团青黑。') },
          { x: 8, y: 1, spr: 'poster', col: '#c8a8b8', on: S => S.narr('墙上贴着一张 2006 年的年历，还有一张撕了一半的明星海报。\n年历上，明天——12月9日——被人用红笔圈了一下。不知道是谁圈的。') },
          { id: 'rdoor', x: 10, y: 1, spr: 'door', col: '#7a6a50', async on(S) {
            if (!S.f.suTalk) return S.narr('苏晴在床上哼哼。……先看看她怎么样了。');
            if (!S.has('thermos')) return S.narr('苏晴说渴。先把暖壶拿上。');
            if (!S.f.knocked) return knock(S);
            S.sfx('open');
            await S.go('dorm', 19, 2, 0);
          } },
          { x: 4, y: 4, w: 2, spr: 'table2', col: '#7a6040', async on(S) {
            if (S.once('magFound')) await S.narr('桌上摊着苏晴的杂志，用来压一碗没吃完的泡面。\n有一页被红笔画满了圈。');
            await S.note('mag');
          } },
          { id: 'th', x: 6, y: 4, spr: 'thermos', async on(S) {
            if (!S.f.suTalk) return S.narr('暖壶。拎起来轻飘飘的——空的。');
            S.hide('th'); S.give('thermos');
            await S.narr('你拎起暖壶晃了晃。空的，一滴也没有了。\n水房在走廊最那头。开水器整夜都有电。');
            S.goal('拿上暖壶，去走廊尽头的水房打开水');
          } },
          { x: 10, y: 4, spr: 'locker', on: S => S.narr('苏晴的柜子。门上贴着一张纸：「期末一定要进前十！！」') },
          { x: 10, y: 5, spr: 'locker', on: S => S.narr('你的柜子。里面有一包家里寄来的腊肉，你一直舍不得吃。') },
          { x: 10, y: 6, spr: 'locker', on: S => S.narr('小芳的柜子，锁着。柜门缝里飘出一股风油精的味道。') },
          { x: 5, y: 7, spr: 'shoerack', on: S => S.narr('四双拖鞋，摆得整整齐齐。\n……第五双是谁的？蓝色的，塑料的，鞋底磨得很薄，是很多年前的样子。\n你眨了眨眼——只有四双。') },
          { x: 8, y: 7, spr: 'bucket', on: S => S.narr('洗脸盆和水桶。盆底还剩一点水，映着窗外的月光。') }
        ],
        async enter(S, first) {
          if (!first) return;
          await S.narr('十点整，教学楼、宿舍楼一起拉了闸。\n你们是摸黑跑回宿舍的。一路上，谁都没有说话。');
          await S.wait(400);
          await S.card('凌晨', '女生宿舍　307', '苏晴发烧了。\n回来没多久，她就开始发抖，一直说冷。\n\n寝室里另外两个人睡得很沉。\n你听见走廊尽头，水房的龙头在滴水。\n滴答。滴答。');
          S.amb('room');
          await S.narr('黑暗里，苏晴在被子里翻来覆去。\n她的嘴唇在动，像是在跟谁说话。');
          S.goal('看看苏晴');
          S.cp('room');
        }
      },
      /* ---------------- 宿舍楼三楼走廊（左：值班室，右：水房） ---------------- */
      dorm: {
        amb: 'drone', dark: .9, plr: 3, wall: 'school', floor: 'linoleum', darkC: '#04060a',
        legend: { 'w': 'wood', '+': 'tile' },
        tileOpts: { tileC: '#8fa29a', woodC: '#5a4432' },
        rows: [
          '##################################',
          '##################################',
          '#wwwww#....................#+++++#',
          '#wwwwww....................++++++#',
          '#wwwww#....................#+++++#',
          '##################################'],
        ents: [
          /* 值班室 */
          { id: 'kbox', x: 2, y: 1, spr: 'keybox', on: S => S.narr(S.has('okey') ? '钥匙板上空了一个钩子。' : '墙上的钥匙板，挂着宿舍楼各个门的钥匙。\n最边上一把锈得发黑，木牌上写着「旧楼」。') },
          { x: 4, y: 1, spr: 'window', on: S => S.narr('值班室的窗户正对着操场。旧楼就在操场那一头。\n二楼的那点烛光，你从这里也看得见。') },
          { id: 'dlog', x: 1, y: 2, spr: 'desk', col: '#6a4a30', async on(S) {
            await S.narr('桌上摊着一本《宿舍值班日志》。最新一页是周老师的字，一笔一画，工工整整：\n「12月8日　22:00 熄灯，查寝，应到 186 人，实到 186 人。」');
            await S.narr('往前翻，每一年的这几天，都有一行同样的字：\n「12月9日　请假一天。周岚」\n……一直翻到六年前，她刚来学校的那一年。');
            S.f.sawLog = true;
          } },
          { id: 'dtab', x: 3, y: 2, spr: 'dtable', async on(S) {
            await S.narr('桌上立着一个旧相框。照片里，两个穿蓝白运动服的女生站在一栋楼前面，比着剪刀手。\n是旧楼。那时候它还刷着新漆。');
            await S.narr('相框背面，用圆珠笔写着：「94年5月　和小M」。\n左边那个扎辫子的女生，眉眼……有点像周老师。');
            S.f.sawPhoto = true;
          } },
          { id: 'dlamp', x: 3, y: 2, spr: 'invisible', off: true, light: { r: 3.6, col: 'rgba(255,200,120,.18)' } },
          { x: 5, y: 2, h: 2, spr: 'bed', col: '#7a8aa0', on: S => S.narr('值班老师的单人床。被子叠成了豆腐块，枕头边放着一本翻旧了的《飞鸟集》。') },
          { x: 1, y: 4, spr: 'thermos', on: S => S.narr('周老师的暖壶。摸上去是温的。') },
          { id: 'zhou', x: 3, y: 3, spr: '@zhou', dir: 2, hidden: true, on: S => S.say('周老师', S.f.phase === 'old' ? ['旧楼二楼，档案室。钥匙你拿着。', '……我去 307 看着苏晴。去吧。'] : '……') },
          { x: 6, y: 3, spr: 'invisible', solid: false, async touch(S) { if (S.f.phase === 'chase') return safeScene(S); } },
          /* 走廊 */
          { id: 'stairs', x: 7, y: 4, spr: 'stairsdown', solid: false, async touch(S) {
            if (S.f.phase === 'chase') { S.sfx('locked'); await S.narr('楼梯口的铁栅栏门锁着！'); S.pos(8, 4, 2); return; }
            if (!S.has('okey')) { S.sfx('locked'); await S.narr('楼梯口的铁栅栏门锁着。熄灯以后，谁也不许下楼。'); S.pos(8, 4, 2); return; }
            await S.narr('你用周老师给的钥匙，轻轻拧开了楼梯口的铁栅栏门。');
            await S.go('old', 2, 7, 2, { ms: 600 });
          } },
          { id: 'exitL', x: 8, y: 1, spr: 'exitsign', light: { r: 2.2, col: 'rgba(90,230,140,.12)' }, on: S => S.narr('「安全出口」的小绿人，一闪一闪地朝楼梯跑。') },
          { x: 10, y: 1, spr: 'door', col: '#7a6a50', on: S => S.narr('301。门缝底下，有人在被窝里打着手电背单词，嘀嘀咕咕的。') },
          { x: 11, y: 1, spr: 'poster', col: '#e0d8c0', on: S => S.narr('《女生宿舍管理公约》\n……七、熄灯后不得外出，不得点蜡烛，不得代人应答查寝。\n最后那一条的字，比别的条都大，还用红笔加粗过。') },
          { x: 13, y: 1, spr: 'door', col: '#7a6a50', on: S => S.narr('303。门上贴着一张「福」字，倒着贴的。') },
          { x: 16, y: 1, spr: 'door', col: '#7a6a50', on: S => S.narr(S.f.phase === 'chase' ? '你拼命拍门——里面没有一点声音。' : '305。里面的人睡得很沉。有人在说梦话：「……妈，我不想吃了。」') },
          { id: 'd307', x: 19, y: 1, spr: 'door', col: '#7a6a50', async on(S) {
            if (S.f.phase === 'chase') { S.sfx('locked'); return S.narr('门推不开！像是有人在里面用背死死地顶着。'); }
            if (S.f.phase === 'old') return S.narr('周老师在里面照看苏晴。门缝里透出一点手电的光。');
            S.sfx('open'); await S.go('room', 10, 2, 0);
          } },
          { x: 20, y: 1, spr: 'plate', on: S => S.narr('门牌：307。') },
          { x: 22, y: 1, spr: 'door', col: '#7a6a50', on: S => S.narr('309。门把手上挂着一个塑料袋，里面装着两个苹果。') },
          { x: 25, y: 1, spr: 'door', col: '#7a6a50', on: S => S.narr('311。这间寝室空着，门上的锁锈死了。\n门缝里吹出来的风，比走廊里还要冷。') },
          { id: 'exitR', x: 26, y: 1, spr: 'exitsign', light: { r: 2.2, col: 'rgba(90,230,140,.12)' }, on: S => S.narr('另一头的安全出口。灯牌里面有一只死掉的飞蛾。') },
          { x: 14, y: 4, spr: 'rack', on: S => S.narr('走廊里的晾衣架。冻得硬邦邦的秋裤、袜子、校服……') },
          { x: 21, y: 4, spr: 'rack', s: { cl: ['#c8c8c0', '#e8d8a8', '#34466a'], old: true }, on: S => S.narr('晾衣架的最边上，挂着一件蓝白色的运动服。\n不是现在的款式——领口是翻领，袖子上只有一道白杠。\n胸口用圆珠笔写着一个小小的「满」字。') },
          { x: 24, y: 2, spr: 'bucket', on: S => S.narr('不知道谁的水桶，放在走廊中间。里面的水结了冰，冰里冻着一根长头发。') },
          { x: 10, y: 4, spr: 'shoerack', on: S => S.narr('鞋架上的雨鞋，鞋尖全都朝着楼梯口。') },
          /* 水房 */
          { id: 'boiler', x: 28, y: 2, spr: 'boiler', lit: true, light: { r: 1.6, col: 'rgba(255,80,60,.12)' }, on: S => waterScene(S) },
          { id: 'tap1', x: 29, y: 2, spr: 'tap', on: S => S.narr(S.ent('tap1').s.run ? '龙头开着，你怎么拧也拧不上。' : '冰凉的水龙头，拧得很紧。') },
          { id: 'tap2', x: 30, y: 2, spr: 'tap', on: S => S.narr(S.ent('tap2').s.run ? '水是红色的——不，只是应急灯的光。……只是光。' : '水池里泡着一只没洗的饭盒。') },
          { id: 'tap3', x: 31, y: 2, spr: 'tap', on: S => S.narr(S.ent('tap3').s.run ? '水哗哗地流。水声里，好像夹着一个女孩小声哼歌的声音。' : '这个龙头一直在滴水。滴答。滴答。') },
          { id: 'wmir', x: 30, y: 1, spr: 'mirror', frame: '#8a8a84', on: S => S.narr(S.f.phase === 'water' ? '水房的镜子，镜面上有一层擦不掉的水垢。\n镜子里的你，脸是灰的。' : '镜子里，只有你一个人。……现在只有你一个人。') },
          { x: 32, y: 1, spr: 'window', light: { r: 2.2, col: MOON, dy: 10 }, on: S => S.narr('水房的窗户没有玻璃，钉着一块塑料布。塑料布一鼓一鼓的，像在呼吸。') },
          { x: 30, y: 4, spr: 'puddle', decal: true },
          { x: 32, y: 4, spr: 'broom', on: S => S.narr('拖把和簸箕。拖把头湿漉漉的，在地上拖出一道长长的水痕，一直拖到门口。') },
          { id: 'xm_d', x: 32, y: 3, spr: '@xiaoman', hidden: true, solid: false }
        ],
        async enter(S, first) {
          if (S.f.phase === 'chase') { resetChase(S); return; }
          if (!first) return;
          S.f.phase = 'water';
          await S.narr('走廊里的灯全灭了。只有两头的「安全出口」，亮着一点绿光。');
          S.focus(4, 3);
          await S.narr('值班室的门开着，台灯没亮。周老师大概查夜去了。');
          S.focus(null);
          await S.narr('另一头是水房。滴答，滴答。');
          S.goal('去走廊尽头的水房打开水');
        }
      },
      /* ---------------- 旧教学楼二楼（左上：档案室） ---------------- */
      old: {
        amb: 'wind', dark: .93, plr: 4.2, wall: 'plain', floor: 'wood', darkC: '#04050a',
        tileOpts: { woodC: '#4e3826' },
        wallC: { face: '#7a7a6a', trim: '#3a4a3a' },
        rows: [
          '##############################',
          '##############################',
          '#WWWWWWWWWW###################',
          '#WWWWWWWWWW###################',
          '#WWWWWWWWWW###################',
          '#WWWWWWWWWW###################',
          '##############################',
          '#............................#',
          '#............................#',
          '##############################'],
        ents: [
          /* 楼梯口 */
          { id: 'ostairs', x: 1, y: 8, spr: 'stairsdown', solid: false, async touch(S) {
            await S.narr(S.f.archDone ? '还不能走。' : '楼梯底下黑得像一口井。\n……周老师在宿舍看着苏晴。你得先把这件事弄清楚。');
            S.pos(2, 8, 2);
          }, on: S => S.narr('通往一楼的楼梯。扶手上的漆掉光了，露出黑色的铁。\n楼梯拐角那盏灯的灯座还在，灯泡没了。') },
          { id: 'daisy', x: 1, y: 7, spr: 'daisy', async on(S) {
            if (S.ent('daisy').s.fresh) return S.narr('一束新的小雏菊，压在那束干花上面。白白的，在月光底下几乎发亮。');
            await S.narr('楼梯口的墙角，放着一小束干掉的雏菊，用一根黑色的橡皮筋扎着。\n干花底下，还压着好几束更旧的，已经碎成了粉。');
            await S.think('……每年都有人来放一束。');
          } },
          /* 档案室门、走廊北墙 */
          { id: 'adoor', x: 5, y: 6, spr: 'door', col: '#5a4a3a', locked: true, on: S => archDoor(S) },
          { x: 3, y: 6, spr: 'plate', on: S => S.narr('门牌：「档案室」。字是用毛笔写的，墨都褪成了灰色。') },
          { x: 8, y: 6, spr: 'window', on: S => S.narr('档案室的窗户里面糊着旧报纸。报纸上的日期是 1995 年 3 月。') },
          { x: 11, y: 6, w: 4, spr: 'slogan', on: S => S.narr('墙上的红色标语：「团结　紧张　严肃　活泼」。\n「活泼」的「活」字掉了，只剩下一块浅色的印子。') },
          { x: 17, y: 6, spr: 'poster', col: '#c8b48a', on: S => S.narr('「光荣榜　1994 年秋季运动会」\n女子八百米第一名：高二(3)班　林小满。\n名字底下贴着一张一寸照片，照片已经被太阳晒得只剩一个白影子。') },
          { id: 'clsDoor', x: 20, y: 6, spr: 'door', col: '#5a4030', on: S => oldClsDoor(S) },
          { x: 21, y: 6, spr: 'plate', on: S => S.narr('门牌：「高二(3)班」。\n……和你们现在的班，是同一个名字。') },
          { x: 23, y: 6, spr: 'window', on: S => S.narr(S.f.archDone ? '窗户里面，一点烛光一晃一晃的。' : '这就是从宿舍看见的那扇窗户。\n玻璃里面，有一点很小的光，一晃，一晃。\n你贴近玻璃——光灭了。') },
          { x: 26, y: 6, spr: 'door', col: '#5a4030', on: S => { S.sfx('locked'); return S.narr('「高二(4)班」。门锁锈死了。门上用粉笔写着：「1995.9 停用」。'); } },
          { x: 28, y: 6, spr: 'window', on: S => S.narr('黑漆漆的玻璃。玻璃上有一个小小的手印，是从里面按上去的。') },
          /* 走廊南侧 */
          { x: 9, y: 8, spr: 'deskpile', on: S => S.narr('堆在走廊里的旧课桌椅，上面落满了灰。最下面那张桌子上，刻着「94届 必胜」。') },
          { x: 10, y: 8, spr: 'deskpile', on: S => S.narr('桌腿上缠着蜘蛛网。你的手电光一照，网上的灰簌簌地往下掉。') },
          { x: 16, y: 8, spr: 'bucket', on: S => S.narr('一只生锈的铁皮桶，桶底积着一层干掉的石灰。') },
          { x: 25, y: 8, spr: 'chair', col: '#4a3420', on: S => S.narr('一把椅子孤零零地摆在走廊中间，椅面朝着那间教室的门。\n像有人坐在这里，等过谁。') },
          { x: 6, y: 8, spr: 'invisible', light: { r: 2.4, col: MOON } },
          { x: 15, y: 8, spr: 'invisible', light: { r: 2.4, col: MOON } },
          { x: 24, y: 8, spr: 'invisible', light: { r: 2.4, col: MOON } },
          /* 档案室内 */
          { x: 2, y: 1, spr: 'cal94', on: S => S.narr('墙上挂着一本 1994 年的挂历。翻到十二月那一页，就再也没有人翻过。\n9 号那一格，是空白的。') },
          { x: 5, y: 1, spr: 'window', light: { r: 2.4, col: MOON, dy: 10 }, on: S => S.narr('窗外是操场，再远一点，是宿舍楼。\n三楼值班室的灯，亮着。') },
          { x: 8, y: 1, spr: 'poster', col: '#d8d0c0', on: S => S.narr('「档案重地　闲人免进」\n底下贴着一张小纸条：「学籍卡按毕业届别存放（高中学制三年）。」') },
          { id: 'cab', x: 1, y: 2, spr: 'cardcab', on: S => cabinet(S) },
          { x: 2, y: 2, spr: 'cardcab', on: S => S.narr('另一个学籍卡柜，标签是「初中部」。初中部早在九十年代末就撤了。') },
          { x: 6, y: 2, spr: 'bookshelf', on: S => S.narr('一排排牛皮纸档案盒：「教学计划」「运动会」「卫生检查」……\n灰厚得能在上面写字。') },
          { x: 7, y: 2, spr: 'bookshelf', on: S => S.narr('「1993—1994 学年　学生奖惩」\n你没有打开。') },
          { id: 'rshelf', x: 9, y: 2, spr: 'bookshelf', async on(S) {
            if (S.once('rep')) await S.narr('一个档案盒的标签被人摸得发亮，和别的都不一样：\n「1994.12　事故」。\n盒子里只有薄薄的一张纸。');
            await S.note('report'); S.f.readReport = true; archCheck(S);
          } },
          { x: 10, y: 2, spr: 'bookshelf', on: S => S.narr('「校报合订本　1995」。\n头版标题：《珍爱生命，远离迷信——我校开展「破除笔仙碟仙」主题班会》。') },
          { id: 'adesk', x: 4, y: 4, spr: 'desk', col: '#5a4030', async on(S) {
            await S.narr('管理员的桌子。桌上摊着一本《档案借阅登记簿》。');
            await S.narr('最后几页，每一年都有一条：\n「12月9日　借阅人：周岚　借阅：1994.12 事故」\n「归还：12月9日」\n……每一年，都是同一天借，同一天还。');
          } },
          { x: 5, y: 4, spr: 'chair', col: '#4a3420', on: S => S.narr('椅子上铺着一块旧坐垫，压出了一个浅浅的坑。') },
          { x: 9, y: 5, spr: 'crate', on: S => S.narr('纸箱里装着一沓沓发黄的准考证，最上面一张是 1996 年的。') },
          { x: 10, y: 5, spr: 'box', on: S => S.narr('箱子上写着「待销毁」。里面是一摞旧点名册。') },
          { id: 'zhou_o', x: 2, y: 7, spr: '@zhou', dir: 2, hidden: true, on: S => S.say('周老师', S.f.confess ? '……你先进去吧。我、我在门口站一会儿。' : '……') },
          { id: 'xm_o', x: 28, y: 7, spr: '@xiaoman', hidden: true, solid: false }
        ],
        async enter(S, first) {
          if (!first) return;
          await S.narr('你穿过操场。草叶上结了霜，踩上去沙沙地响。\n旧楼的大门用铁链锁着，侧门的锁早就坏了。');
          await S.narr('楼梯很窄，一级一级往上走。扶手冰得像铁——它本来就是铁。\n二楼。');
          S.goal('找到档案室');
          S.cp('old');
        },
        step(S, x, y) {
          if (y >= 7 && x >= 15 && !S.f.archDone && S.once('xmSeen')) return seeXm(S);
        }
      },
      /* ---------------- 旧楼 · 1994 年的高二(3)班 ---------------- */
      oldcls: {
        amb: 'night', dark: .94, plr: 4.2, wall: 'plain', floor: 'wood', darkC: '#03040a',
        tileOpts: { woodC: '#57402b' },
        wallC: { face: '#76786a', trim: '#2f4434' },
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
          '############.#'],
        ents: [
          { x: 12, y: 9, spr: 'invisible', async touch(S) { if (S.f.zhouIn) { await S.narr('周老师还在里面。你不能把她一个人留在这儿。'); S.pos(12, 8, 3); return; } await S.go('old', 20, 7, 0); } },
          { id: 'chart', x: 2, y: 1, spr: 'chart', async on(S) {
            S.ent('chart').s.mark = true; S.f.chart = true;
            await S.narr('门边的墙上，贴着一张手写的座位表，纸已经脆得发黄。');
            await S.narr('「高二(3)班座位表　1994 年秋」\n……第四排，最靠窗的两个位子：\n周岚　林小满');
            S.goal('找到第四排、靠窗的那张课桌');
          } },
          { id: 'obb', x: 5, y: 1, spr: 'blackboard', text: true, on: S => S.narr(S.f.chalk ? '黑板正中间，多了两个粉笔字：\n「岚岚」\n字写得很轻，像怕把谁吵醒。' : '黑板上的字还没擦：\n「12月9日　星期五　值日生：林小满　周岚」\n「距期末考试　还有 30 天」') },
          { x: 8, y: 1, spr: 'poster', col: '#d8c8a0', on: S => S.narr('「1995 年元旦晚会节目单」\n第五个节目：诗朗诵《致橡树》——林小满、周岚。\n这一行，被人用铅笔轻轻地圈了起来。') },
          { x: 10, y: 1, spr: 'window', light: { r: 2.8, col: MOON, dy: 12 }, on: S => S.narr('窗外，宿舍楼黑黑的一排。只有三楼值班室的灯亮着。') },
          { x: 12, y: 1, spr: 'window', light: { r: 2.8, col: MOON, dy: 12 }, on: S => S.narr('窗台上放着一个玻璃瓶，瓶里插着一枝早就干透了的腊梅。') },
          { id: 'ojt', x: 5, y: 2, spr: 'jiangtai', async on(S) {
            if (!S.f.gotMatch) {
              S.f.gotMatch = true; S.ent('ojt').open = true; S.give('match');
              await S.narr('讲台的抽屉一拉就开。\n里面有半截白蜡烛，烛泪流了一抽屉，早就凝住了；还有一盒红头的老式火柴。');
              await S.think('日记里写的……「蜡烛是讲台抽屉里的」。');
              return;
            }
            await S.narr('讲台上落着一层灰。灰上，有一道新的手指印。');
          } },
          { x: 1, y: 5, spr: 'stove', on: S => S.narr('教室里的煤炉。九十年代的冬天，每个班都靠它取暖。\n炉膛里还有半块没烧完的蜂窝煤。') },
          { x: 1, y: 8, spr: 'broom', on: S => S.narr('卫生角。簸箕里扫了一小撮灰，没来得及倒掉。') },
          ...[[2, 4], [3, 4], [6, 4], [7, 4], [10, 4], [11, 4], [2, 5], [3, 5], [6, 5], [7, 5], [10, 5], [11, 5], [2, 6], [3, 6], [6, 6], [7, 6], [10, 6], [11, 6], [2, 7], [3, 7], [6, 7], [7, 7]].map(([x, y], i) => ({ x, y, spr: 'odesk', on: S => S.narr([
            '翻盖课桌。盖子里面贴着一张「四大天王」的贴纸。', '桌盖上刻着：「1994.9.1 高二了」。', '抽屉里有一本没写名字的英语课本。', '空的。', '桌面上用小刀刻了一个「忍」字。', '桌洞里塞着一团写满了公式的草稿纸。',
            '桌面上有一圈圈墨水印，是钢笔水洒的。', '桌盖掀不开，锈住了。', '空的。', '抽屉里有一盒用了一半的「英雄」墨水。', '桌面上画了一个小人，小人在跑步，旁边写着「800米」。', '桌盖里面写着：「小满跑得最快！」',
            '桌子上落着一层灰。', '空的。', '一封没寄出去的信，信封上的邮票是八分钱的。', '课桌抽屉里有一只冬眠的瓢虫。', '桌面上用圆珠笔写着一首歌词：「……让我们荡起双桨……」', '这张桌子歪着，一条腿垫了一块砖头。',
            '桌盖上刻着「早」。……原来那时候就有人刻这个字。', '空的。', '桌面上贴着一张课程表。星期五最后一节：自习。', '有人在桌子上用铅笔写：「笔仙是真的」。下面另一个人的字：「骗人」。'][i]) })),
          { id: 'zdesk', x: 10, y: 7, spr: 'odesk', s: { carve: true }, on: S => S.narr('第四排，靠过道的位子。\n桌面上刻着两个小小的字：「岚」「满」。中间画了一颗歪歪扭扭的心。') },
          { id: 'mdesk', x: 11, y: 7, spr: 'odesk', on: S => mdesk(S) },
          { id: 'ocandle', x: 11, y: 7, spr: 'bxcandle', hidden: true, z: 1, oy: -6, light: { r: 3.4, col: 'rgba(255,170,80,.24)', flick: true } },
          { id: 'zhou_c', x: 12, y: 8, spr: '@zhou', dir: 1, hidden: true, on: S => S.say('周老师', S.f.zhouIn ? '……陈默。我们一起。' : '……') },
          { id: 'xm_c', x: 12, y: 6, spr: '@xiaomanC', hidden: true, solid: false }
        ],
        async enter(S, first) {
          if (!first) return;
          await S.narr('门轴「吱——」地一声长响。\n教室里的桌椅，还是整整齐齐的六列。好像第二天早上，还有人要来上课。');
          S.sfx('drip');
          await S.narr('……屋里有一股很淡很淡的蜡烛味。');
          S.goal('找她的座位（门边墙上好像贴着什么）');
        }
      }
    }
  });

  /* ================= 第一幕：教室里的笔仙 ================= */
  function stepGoal(S) {
    if (S.f.cut) return;
    const need = [];
    if (!S.f.gotPaper) need.push('白纸（你的课桌）');
    if (!S.f.gotPen) need.push('红笔（讲台抽屉？）');
    if (need.length) return S.goal('准备：' + need.join('、'));
    if (!S.f.readRules) return S.goal('先看一遍苏晴抄的规矩（她桌边的纸）');
    S.goal('和苏晴一起请笔仙（她的课桌）');
  }
  async function readRules(S) {
    await S.note('rules');
    if (!S.f.readRules) { S.f.readRules = true; stepGoal(S); }
  }
  const CHANT = '笔仙笔仙，我是你的今生，你是我的前世。若要与我续缘，请在纸上画圈。';
  async function ritual1(S) {
    const d = S.ent('rdesk');
    if (S.f.cut) return S.narr('白纸上拖着一道长长的红线，从「是」一直拖到了纸外面。\n笔不见了。');
    if (!S.f.dared) return S.narr('苏晴的课桌。');
    if (!(S.f.gotPaper && S.f.gotPen)) { await S.say('苏晴', '还差东西呢——白纸，红笔。'); return stepGoal(S); }
    if (!S.f.readRules) { await S.say('苏晴', '你先把规矩看一遍嘛，就在我桌边上。万一做错了……'); return; }
    if (!S.f.setup) {
      S.f.setup = true; S.take('paper'); d.s.paper = true;
      S.face('su', 1);
      await S.narr('苏晴接过白纸，用铅笔在左上角写了个「是」，右上角写了个「否」，\n底下一排，工工整整地写上 0 到 9。');
    }
    const r = await S.ask('「好了。……开始吗？」', ['开始', '再等等'], '苏晴'); if (r) return;
    S.take('pen'); d.s.pen = true;
    await S.say('苏晴', ['手背对着手背，交叉过来……用小指和无名指夹住笔。对，就这样。', '笔尖要立在纸中间。千万千万不能松手啊。']);
    S.amb('none');
    await S.narr('你们的手背贴在一起。苏晴的手冰凉冰凉的。\n日光灯嗡嗡地响。');
    await S.say('你和苏晴', CHANT);
    S.sfx('tick'); await S.wait(1200);
    await S.narr('什么也没有发生。');
    await S.say('你和苏晴', '……' + CHANT);
    S.sfx('heart'); await S.wait(900);
    await S.narr('笔尖动了一下。\n很轻，像有人在笔的另一头，轻轻地拽了一下。');
    await pen(S, '然后，它在纸上，慢慢地，画了一个圈。');
    S.bubble('su', '!', 1000);
    await S.say('苏晴', ['……来、来了！', '不是我推的！我发誓不是我推的！……你问，你快问。我的手在抖。'], { style: 'whisper' });
    S.amb('school');
    const asked = {};
    for (; ;) {
      const n = ['sex', 'year', 'cls'].filter(k => asked[k]).length;
      const O = [];
      if (!asked.sex) O.push(['sex', '「笔仙笔仙，你是男生，还是女生？」']);
      if (!asked.year) O.push(['year', '「你是哪一年的人？」']);
      if (!asked.cls) O.push(['cls', '「你以前……也在这个学校上学吗？」']);
      if (n >= 2) O.push(['name', '「你叫什么名字？」']);
      O.push(['how', '「你……是怎么死的？」'], ['mine', '「我什么时候会死？」'], ['send', '「笔仙笔仙，请你回去吧。」']);
      const k = O[await S.ask('要问什么？', O.map(o => o[1]))][0];
      if (k === 'sex') {
        asked.sex = 1;
        await pen(S, '笔尖慢慢滑到纸边的空白处，一笔，一笔地写——', '女');
        await S.say('苏晴', '……女的。', { style: 'whisper' });
      } else if (k === 'year') {
        asked.year = 1;
        await pen(S, '笔尖拖到底下那一排数字上，在几个数字之间来回地点。', '1　9　9　4');
        await S.say('苏晴', '一九九四……那不是十二年前吗？', { style: 'whisper' });
      } else if (k === 'cls') {
        asked.cls = 1;
        await pen(S, '笔尖往左上角滑过去，停在了——', '是');
        await S.say('苏晴', '哪、哪个班的？', { style: 'whisper' });
        await pen(S, '笔尖落在数字「3」上，戳了一下，又一下。', '3');
        await S.say('苏晴', '三班……跟我们一样？高二三班？', { style: 'whisper' });
        await pen(S, '笔尖又在「是」上，重重地画了一个圈。');
      } else if (k === 'how') {
        S.shake(300, 1);
        await S.say('苏晴', '你疯啦！规矩第二条——不能问它是怎么死的！');
        await S.narr('笔尖在纸上猛地一顿，划出一道深深的印子。\n你赶紧把那句话咽了回去。');
      } else if (k === 'mine') {
        await S.say('苏晴', '也不能问自己什么时候死！你想吓死我啊！');
        S.sfx('heart');
        await S.narr('笔尖已经往数字那边滑了一点点——又停住了。像是在等你们改口。');
      } else if (k === 'send') {
        await pen(S, '笔尖慢慢地，滑到了右上角——', '否');
        await S.say('苏晴', ['它、它不肯走……', '学姐说，它不肯走的时候，就再问它几个问题……问问它是谁。'], { style: 'whisper' });
      } else if (k === 'name') break;
    }
    await pen(S, '笔停了很久很久。\n然后，它开始写一个字。写得很慢，像一个刚学写字的小孩——', '小');
    await S.narr('第二个字，才写了一横——');
    return blackout(S);
  }
  async function blackout(S) {
    const d = S.ent('rdesk');
    S.sfx('switch');
    for (const id of ['fl1', 'fl2', 'fl3', 'fl4']) S.ent(id).off = true;
    S.dark(.97); S.plr(1.4); S.amb('none');
    await S.narr('啪。\n\n十点整。教学楼拉闸了。');
    S.sfx('heart'); await S.wait(500);
    S.shake(700, 2);
    await S.narr('黑暗里，笔突然动了——不是慢慢地，是猛地一拽，\n拖着你们两个人的手，往窗户那边划过去！');
    await pen(S, '笔尖死死地压在纸上，一笔划破了纸——', '别　走');
    S.sfx('whisper');
    await pen(S, '', '冷');
    S.sfx('scream');
    await S.say('苏晴', '啊——！！', { style: 'big' });
    await S.narr('苏晴松手了。\n她的椅子「哐」地翻倒在地上。');
    await S.narr('笔在你一个人的手里，还在动。\n它在纸的最边上，又写了两个字——');
    await S.say('', '本　子', { style: 'big' });
    S.sfx('thud'); d.s.pen = false;
    await S.narr('笔从你的指缝里挣了出去，在桌面上滚了几圈，「嗒」地掉进了黑暗里。');
    S.f.cut = true;
    S.ent('su').dir = 0;
    await S.say('苏晴', ['我……我松手了……', '规矩上说……中途松手，它就回不去了……它会……留下来……'], { style: 'whisper' });
    S.sfx('knock');
    await S.say('楼下的保安', '谁还在教室里？！熄灯了！都回宿舍去！');
    await S.narr('手电光从楼下扫上来，在天花板上晃了一下。\n你拽起苏晴，摸黑跑出了教室。');
    S.plr(null);
    await S.go('room', 3, 3, 1, { ms: 900 });
  }

  /* ================= 第二幕：宿舍 ================= */
  async function talkSu(S) {
    if (S.f.phase === 'old') return S.narr('苏晴睡着了。呼吸平稳了一点。\n她的被子不知道被谁掖得严严实实的。');
    if (S.f.suTalk) return S.say('苏晴', S.has('thermos') ? '……水……' : '……暖壶……桌子边上……', { style: 'whisper' });
    await S.narr('苏晴缩在被子里，牙齿咯咯地打战。\n你伸手摸了摸她的额头——烫得吓人。');
    await S.say('苏晴', '……默默……好冷啊……');
    await S.wait(400); S.sfx('whisper');
    await S.say('苏晴？', ['……岚岚，你跑什么呀……', '……我的本子……还在教室里……'], { style: 'whisper' });
    await S.think('那不是苏晴的声音。\n……岚岚？我们班没有叫岚岚的人。');
    await S.say('苏晴', '……水……我想喝口热水……');
    S.f.suTalk = true;
    S.goal('拿上暖壶（桌子旁边）');
  }
  async function knock(S) {
    S.f.knocked = true; S.amb('none');
    await S.narr('你的手刚碰到门把手——');
    for (let i = 0; i < 3; i++) { S.sfx('knock'); await S.wait(600); }
    await S.wait(500);
    await S.say('门外', ['……岚岚？', '岚岚，是你吗？开开门呀。外面好冷。'], { style: 'whisper' });
    const r = await S.ask('门外有人。', ['屏住呼吸，不出声', '「……谁？」']);
    if (r === 1) {
      await S.say('你', '……谁？');
      S.sfx('drip'); await S.wait(1200);
      await S.say('门外', '……你不是岚岚。', { style: 'whisper' });
    } else {
      S.sfx('heart'); await S.wait(900); S.sfx('heart');
      await S.narr('门外的人等了很久。门缝底下，有一道影子，一动不动。');
    }
    await S.narr('然后，是拖鞋踩在水泥地上的声音。啪嗒，啪嗒，\n往走廊那一头去了——往水房那边。');
    S.amb('room');
    await S.think('……是查夜的同学吧。一定是。');
    S.goal('去走廊尽头的水房打开水');
  }
  async function waterScene(S) {
    if (S.f.phase !== 'water') return S.narr('开水器的红灯亮着，壶里的水咕嘟咕嘟地响。');
    if (!S.has('thermos')) return S.narr('开水器。……暖壶落在寝室了。');
    const b = S.ent('boiler');
    await S.narr('你拧开开水器的龙头。');
    b.s.run = true; S.sfx('water'); await S.wait(1000); b.s.run = false;
    await S.narr('开水哗哗地灌进暖壶，白汽扑了你一脸。\n暖壶满了。你把软木塞按紧——');
    S.amb('none'); await S.wait(500);
    for (const id of ['tap3', 'tap2', 'tap1']) { S.ent(id).s.run = true; S.sfx('water'); await S.wait(450); }
    await S.narr('身后，三个水龙头，一个接一个，自己拧开了。');
    S.sfx('heart');
    await S.narr('你慢慢抬起头。\n水垢斑斑的镜子里，你的身后，站着一个人。');
    const g = S.ent('xm_d'); S.place('xm_d', 32, 3, 1); g.alpha = .6;
    await S.scare('face', { spr: '@xiaoman', dur: 1 });
    S.turn(2);
    await S.narr('蓝白色的运动服，翻领，袖子上一道白杠。\n长头发垂下来，盖住了整张脸。');
    await S.say('？？？', ['……岚岚？', '你看见岚岚了吗？她跑得好快……', '我一个人……好黑啊。'], { style: 'whisper' });
    await S.alpha('xm_d', 1, 400);
    S.sfx('sting');
    await S.narr('她朝你走过来了。\n走廊那一头——值班室的台灯，「啪」地亮了。');
    S.f.phase = 'chase';
    resetChase(S);
    S.cp('chase');
  }
  async function safeScene(S) {
    S.stop('xm_d'); S.f.phase = 'safe';
    S.show('zhou'); S.place('zhou', 3, 3, 2); S.ent('dlamp').off = false; S.ent('exitL').s.flick = false;
    S.place('xm_d', 8, 3, 1);
    S.pos(5, 3, 1); S.dark(.86);
    for (const id of ['tap1', 'tap2', 'tap3']) S.ent(id).s.run = false;
    await S.narr('你一头撞进值班室，暖壶差点脱手。');
    S.bubble('zhou', '!', 900);
    await S.say('周老师', '谁？！……陈默？半夜三更的，你跑什么？');
    S.turn(2); S.sfx('heart');
    await S.narr('你回过头。\n值班室门口，那个穿蓝白运动服的女生，就站在那里。低着头。');
    await S.narr('她没有看你。\n她在看周老师。');
    await S.say('？？？', '……岚岚。', { style: 'whisper' });
    S.face('zhou', 2);
    await S.narr('周老师打了个哆嗦，起身把门掩上了。\n「这门口怎么这么冷……」');
    await S.alpha('xm_d', 0, 900);
    S.amb('room'); S.face('zhou', 'pl'); S.turn(1);
    await S.say('周老师', '坐下。慢慢说。出什么事了？');
    const r = await S.ask('要告诉她吗？', ['把请笔仙的事全都说出来', '「……我看见鬼了。」']);
    if (r === 1) { await S.say('周老师', '……鬼？'); await S.narr('她盯着你看了一会儿。她没有笑。'); await S.say('周老师', '从头说。'); }
    await S.narr('你把晚自习以后的事，一五一十都说了：苏晴、红笔、那张纸、停电、松手……\n还有水房里那个女生。翻领的蓝白运动服，袖子上一道白杠。一直在喊「岚岚」。');
    S.sfx('glass');
    await S.narr('周老师手里的搪瓷杯，「当」地一声掉在了桌上。');
    await S.say('周老师', '……在哪间教室？');
    await S.say('你', '新楼。高二(3)班。');
    await S.say('周老师', ['三班……', '她松手了，是不是？……笔最后写了什么？']);
    await S.say('你', '……「本子」。');
    await S.narr('周老师很久没有说话。\n台灯的光照着她的侧脸，她好像一下子老了好几岁。');
    await S.say('周老师', ['……我在这所学校上过学，陈默。', '有些事……我说不出口。']);
    await S.narr('她站起来，从墙上的钥匙板上，摘下了那把锈得发黑的钥匙。');
    S.ent('kbox').s.taken = true; S.give('okey'); S.give('flash');
    await S.say('周老师', ['旧楼二楼，有一间档案室。你想知道她是谁，就去那里找。', '手电筒拿着。……我去 307 看着苏晴。', '天亮之前，得把她送走。规矩你们是知道的。']);
    const r2 = await S.ask('', ['「您不一起去吗？」', '「……好。」']);
    if (r2 === 0) { await S.say('周老师', '……我不敢。'); await S.narr('她说得很轻，轻得像不是说给你听的。'); }
    await S.alpha('zhou', 0, 600);
    S.f.phase = 'old';
    S.goal('去旧楼二楼的档案室（走廊左边的楼梯口）');
    S.cp();
  }

  /* ================= 第三幕：旧楼 ================= */
  async function seeXm(S) {
    S.place('xm_o', 28, 7, 1); S.ent('xm_o').alpha = .85; S.sfx('whisper');
    await S.narr('手电光的尽头，走廊的最那一头——站着一个人。');
    await S.wait(500);
    S.sfx('heart'); await S.alpha('xm_o', 0, 700);
    await S.narr('你眨了一下眼。\n那里只有一把椅子，椅面朝着高二(3)班的门。');
  }
  async function archDoor(S) {
    const inside = S.pl.y < 6;
    if (!inside) {
      if (S.ent('adoor').locked) {
        S.sfx('locked');
        await S.narr('档案室的门锁着。你在那串钥匙里试了一把又一把——');
        S.sfx('open'); S.ent('adoor').locked = false;
        await S.narr('「咔哒」。');
      }
      await S.fade(1, 250); S.pos(5, 5, 3); await S.fade(0, 250);
      if (S.once('archIn')) {
        await S.narr('档案室里一股霉味。月光从糊着报纸的窗户里渗进来，灰蒙蒙的。\n一排排铁柜子，一排排牛皮纸盒。');
        S.goal('找她的学籍卡（学籍卡柜），还有当年的记录');
      }
      return;
    }
    await S.fade(1, 250); S.pos(5, 7, 0); await S.fade(0, 250);
    if (S.f.archDone && !S.f.confess) await zhouConfess(S);
  }
  function archCheck(S) {
    if (S.f.archDone || !(S.f.gotCard && S.f.readReport)) return;
    S.f.archDone = true;
    S.after(300, async S => {
      S.sfx('thud');
      await S.narr('走廊那一头，「咔哒」一声。\n像是哪扇门上的锁，自己掉了下来。');
      S.goal('离开档案室，去高二(3)班');
      S.cp();
    });
  }
  async function cabinet(S) {
    const c = S.ent('cab');
    if (S.f.gotCard) return S.narr('「1996届」那一屉还拉开着。林小满的那一格，空了。');
    if (!S.f.cabOpen) {
      await S.narr('学籍卡柜。几十个小抽屉，每个上面都贴着一张发黄的标签：「19__届」。');
      const v = await S.keypad('要拉开哪一届的抽屉？（四位年份）', ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'], 4);
      if (v == null) return;
      S.sfx('open');
      const msg = {
        '1994': '「1994届」。这一届的学生，九四年夏天就毕业了。\n卡片上的照片，都穿着毕业时的白衬衫。……十二月的时候，她们已经不在学校了。',
        '1995': '「1995届」。这一届在九四年秋天读高三。\n卡片上写的都是「高三」。……不对。',
        '1997': '「1997届」。这一届九四年秋天才刚上高一，卡片上的照片都还是一张张娃娃脸。……不对。'
      }[v];
      if (v !== '1996') {
        await S.narr(msg || `「${v}届」。\n这一屉里的卡片，年份全都对不上。`);
        if (!msg) await S.think('笔仙说的是「1994」……那一年，「她」也在高二三班。\n柜子上的标签按的是毕业的年份。');
        return;
      }
      S.f.cabOpen = true; c.open = true;
      await S.narr('你拉开「1996届」那一屉。一沓沓学籍卡，按班级用橡皮筋捆着。\n「高(3)班」那一捆里，名字里带「小」字的女生，有三张。');
      await S.think('笔仙写的那个字——「小」。');
    }
    const r = await S.ask('抽出哪一张？', ['王小娟　（背面盖着蓝色的毕业章）', '林小满　（右上角盖着一个红章）', '李小雯　（背面盖着蓝色的毕业章）']);
    if (r !== 1) {
      await S.narr('照片上的女生梳着那个年代的厚刘海，笑得很开心。\n卡片背面，盖着「1996年7月　毕业」。……她后来去了很远的地方吧。\n不是她。');
      return;
    }
    S.give('card'); S.f.gotCard = true;
    await S.narr('「林小满　女　1977年5月21日生」\n「1993年9月入学　高中部(3)班」\n右上角，一个红色的章：「注销」。旁边一行钢笔字：「1994.12.10」。');
    await S.narr('照片上的女生剪着短短的头发，眼睛很亮。\n生日那一栏下面，有人用铅笔添了两个小字：「小满」。\n——是节气。她是小满那天生的。');
    await S.think('小……满。');
    archCheck(S);
  }
  async function zhouConfess(S) {
    S.f.confess = true;
    S.place('zhou_o', 2, 7, 2); S.ent('zhou_o').alpha = 1;
    await S.narr('楼梯口有人。\n手电光扫过去——是周老师。她手里攥着一束新的小雏菊。');
    await S.say('周老师', '……我还是来了。');
    S.ent('daisy').s.fresh = true;
    await S.narr('她弯下腰，把那束雏菊，放在了旧花上面。');
    await S.say('周老师', ['你都看见了吧。那张纸。', '「同寝室学生周岚，代其应答」……那个人，就是我。']);
    await S.say('周老师', ['那天晚上，我们俩在教室里请笔仙。停电了，我吓坏了，松开手就跑。', '跑回宿舍，蒙上被子。……小满一直没回来。', '查寝的老师喊「林小满」，我想，她大概在水房洗衣服吧。我就替她答了一声：「到」。']);
    await S.say('周老师', ['第二天早上，是值日的同学在这儿发现她的。就在这个楼梯上。', '十二年了。我每年都来。……可我从来不敢走进那间教室。']);
    const r = await S.ask('', ['「她在找你。她一直在喊『岚岚』。」', '「那不是你的错。灯坏了，那是意外。」']);
    if (r === 0) await S.say('周老师', '……我知道。我一直都知道。');
    else { await S.say('周老师', '……是我先松的手。'); await S.narr('她的声音在发抖。'); }
    await S.say('周老师', ['她的本子，那天以后一直没找到。', '那间教室的锁……刚才自己掉了，我听见了。', '你先进去吧。我、我在门口站一会儿。']);
    S.goal('去高二(3)班（走廊中间那扇门）');
    S.cp();
  }
  async function oldClsDoor(S) {
    if (!S.f.archDone) { S.sfx('locked'); return S.narr('门上挂着一把旧铁锁。锁眼里塞满了铁锈。\n门缝里，飘出来一股很淡的蜡烛味。'); }
    if (!S.f.confess) return S.narr('……楼梯口那边，好像有人。');
    S.sfx('open');
    await S.go('oldcls', 12, 8, 3);
  }

  /* ================= 第四幕：送她回家 ================= */
  async function mdesk(S) {
    const d = S.ent('mdesk');
    if (S.f.done) return S.narr('桌上只剩一小撮纸灰。');
    if (!S.f.diary) {
      await S.narr(S.f.chart ? '第四排，最靠窗。林小满的位子。\n桌面干干净净的，一点灰也没有，像是每天都有人擦。' : '靠窗的一张课桌。桌面干干净净的，一点灰也没有。');
      S.sfx('open'); d.s.open = true;
      await S.narr('你掀开桌盖——\n里面躺着一本塑料封皮的日记本。封面上印着一只小鹿。');
      S.give('diary'); S.f.diary = true;
      await S.note('diary');
      d.s.open = false;
      await S.narr('日记本的最后一页，夹着一张折成四折的纸。你把它展开——\n是一张请笔仙用的纸。「是」「否」，0 到 9。\n纸的正中间，用红笔画着一个圆圈。很圆，很圆。');
      await S.think('那天晚上……她已经一个人把「笔仙」送走了。\n可是，没有人来送她。');
      return zhouEnter(S);
    }
    if (!S.has('match')) {
      await S.narr('太黑了，连纸上的字都看不清。');
      await S.say('周老师', '她那天晚上……是点着蜡烛的。讲台抽屉里，说不定还有。');
      S.goal('找蜡烛（讲台抽屉）');
      return;
    }
    return finale(S);
  }
  async function zhouEnter(S) {
    S.sfx('open');
    S.place('zhou_c', 12, 8, 3); S.ent('zhou_c').alpha = 0;
    await S.alpha('zhou_c', 1, 500);
    await S.narr('身后，门轴又「吱」地响了一声。\n周老师站在门口。她看着你手里的本子，一步，一步，走了过来。');
    await S.walk('zhou_c', [9, 8], 2.5); S.face('zhou_c', 'pl');
    await S.say('周老师', '……是她的。');
    await S.narr('她接过日记本，翻到最后一页。手电光在纸上抖得厉害。');
    await S.say('', '「岚岚，别怕。不怪你。」', { style: 'big' });
    S.sfx('cry');
    await S.narr('周老师把脸埋进那本日记里。很久很久，都没有出声。');
    await S.wait(500);
    S.sfx('cut'); S.focus(5, 2);
    await S.narr('「吱——」\n黑板那边，响起了粉笔划过的声音。');
    S.f.chalk = true; S.sfx('heart');
    await S.narr('黑板正中间，慢慢地，多了两个字：\n「岚岚」');
    S.focus(null);
    await S.say('周老师', ['……她还在等。', '陈默，帮我一个忙。', '请笔仙要两个人，送也要两个人。当年我松了手。……这一次，我不松了。']);
    S.f.zhouIn = true;
    S.goal(S.has('match') ? '和周老师一起，在小满的课桌上送她走' : '先找蜡烛（讲台抽屉），再和周老师一起送她走');
    S.cp('final');
  }
  async function finale(S) {
    const d = S.ent('mdesk');
    if (!S.has('pen')) {
      S.sfx('sting');
      await S.narr('你把手伸进口袋——指尖碰到了一个细细的、硬硬的东西。\n那支红笔。笔杆上有几道很深的牙印。\n……它什么时候回到你口袋里的？');
      S.give('pen', true);
    }
    const go = await S.ask('要开始吗？', ['开始送她走', '再等一等']); if (go) return;
    S.amb('none');
    S.sfx('match'); await S.wait(400);
    S.show('ocandle'); S.ent('ocandle').off = false; d.s.paper = true; S.dark(.9);
    await S.narr('火柴「嚓」地一声亮了。你把半截蜡烛立在桌角上。\n周老师把那张旧纸摊平——她坐在了自己当年的位子上。');
    /* 1. 握笔 */
    for (; ;) {
      const r = await S.ask('怎么握笔？', ['手背交叉，两个人一起夹住笔', '手心贴着手心，把笔握在中间', '你一个人握笔，周老师按住纸']);
      if (r === 0) break;
      if (r === 1) { await S.narr('笔软绵绵地往一边倒了，像是根本没有人握着它。'); await S.say('周老师', '不对……当年我们不是这么握的。'); }
      else await S.say('周老师', '一个人不行的。……要两个人。');
    }
    d.s.pen = true;
    await S.narr('你们的手背贴在一起。周老师的手，比你的还要凉。');
    /* 2. 召请 */
    for (; ;) {
      const r = await S.ask('要念什么？', ['「' + CHANT + '」', '「碟仙碟仙，请你出来。」', '「林小满，你在吗？」']);
      if (r === 0) break;
      if (r === 1) await S.say('周老师', '……那是请碟仙的。要用碟子。');
      else { await S.narr('笔一动不动。\n烛火晃了一下，又站直了。'); await S.say('周老师', '……规矩。得照着规矩来，她才听得见。'); }
    }
    await S.say('你和周老师', CHANT);
    S.sfx('heart'); await S.wait(1000);
    await pen(S, '笔尖动了。\n它沿着那张旧纸上的红圈，又慢慢地，描了一遍。', null, { desk: 'mdesk' });
    S.place('xm_c', 12, 6, 1); S.ent('xm_c').alpha = 0; await S.alpha('xm_c', .75, 900);
    await S.narr('窗边的阴影里，站着一个穿蓝白运动服的女生。\n这一次，她的头发没有盖住脸。');
    await pen(S, '笔尖往上滑，一笔一笔地写——', '岚　岚', { desk: 'mdesk' });
    await S.say('周老师', ['……小满。是我。', '对不起。那天晚上，是我先松的手。是我跑了。', '查寝的时候，是我替你答的「到」。……要是我没有答，老师就会去找你的。']);
    await S.narr('她的手在发抖。你们交叉的手背贴在一起，你能感觉到。\n可是这一次，她没有松手。');
    await pen(S, '笔动得很慢，很慢——', '不　怪　你', { desk: 'mdesk' });
    S.sfx('cry');
    await pen(S, '笔停了一下。然后，又写了一行字——', '你们　还想问　什么', { desk: 'mdesk' });
    /* 3. 不该问的问题 */
    let cold = false;
    for (; ;) {
      const O = [];
      if (!cold) O.push(['cold', '「你……现在还冷吗？」']);
      O.push(['how', '「小满，那天晚上……你是怎么……」'], ['when', '「那……我什么时候会死？」'], ['none', '（摇摇头。什么都不问了。）']);
      const k = O[await S.ask('还要问什么吗？', O.map(o => o[1]))][0];
      if (k === 'cold') { cold = true; await pen(S, '笔尖轻轻地动了动——', '不冷了　有蜡烛', { desk: 'mdesk' }); await S.narr('周老师笑了一下。眼泪掉在了纸上。'); continue; }
      if (k === 'how' || k === 'when') return badEnd(S, k);
      break;
    }
    /* 4. 送走的话 */
    let wrong = 0;
    for (; ;) {
      const r = await S.ask('该送她走了。要说什么？', ['「笔仙笔仙，请你回去吧。」', '「你走吧！别再缠着我们了！」', '「林小满，天快亮了。……你可以回家了。」']);
      if (r === 2) break;
      wrong++;
      if (r === 0) {
        await pen(S, '笔尖慢慢地滑到了右上角——', '否', { desk: 'mdesk' });
        await S.say('周老师', '……她不知道我们在送谁。');
      } else {
        S.shake(400, 2);
        await pen(S, '笔尖狠狠地戳进纸里，一下，又一下——', '否', { desk: 'mdesk' });
        await S.say('周老师', '别、别这么凶……她不是来害人的。');
      }
      if (wrong >= 1) await S.think('日记里写过：「送的时候要叫它的名字，它才知道你在送谁。」');
    }
    await S.say('你', '林小满。天快亮了。……你可以回家了。');
    await S.say('周老师', '小满……回家吧。');
    S.sfx('chime');
    await pen(S, '笔尖停了很久。\n然后，它沿着那个旧圆圈，又画了一个圈。很圆，很圆。\n最后，轻轻地，点了一下。', null, { desk: 'mdesk' });
    /* 5. 松手 */
    for (; ;) {
      const r = await S.ask('笔停住了。', ['赶紧松手', '等笔完全停下来，两个人一起松手']);
      if (r === 1) break;
      await S.say('周老师', '别——！要一起。……这一次，要一起。');
    }
    await S.narr('你们看着对方，数了一、二、三。\n一起，慢慢地，松开了手。\n笔安安静静地躺在纸上，再也没有动。');
    d.s.pen = false;
    /* 6. 纸和笔 */
    for (; ;) {
      const r = await S.ask('纸和笔要怎么办？', ['把纸夹回日记本里，留个纪念', '把纸在蜡烛上烧掉，把笔折断']);
      if (r === 1) break;
      await S.say('周老师', ['……不行。规矩是要烧掉的。', '她那天晚上，也是这么做的。']);
    }
    S.sfx('match');
    d.s.paper = false; d.s.ash = true;
    await S.narr('纸角碰到烛火，卷起来，变黑，变成了一小撮灰。');
    S.sfx('cut'); S.take('pen');
    await S.narr('你把那支红笔用力一掰——「咔」。');
    S.f.done = true;
    /* 告别 */
    await S.alpha('xm_c', 1, 800);
    S.place('xm_c', 12, 6, 1); S.ent('xm_c').spr = '@xiaomanC';
    await S.say('林小满', '……岚岚。', { style: 'whisper' });
    S.face('zhou_c', 2);
    await S.say('周老师', '……小满。');
    await S.say('林小满', ['我在楼梯上等了好久。等天亮。', '后来天亮了，我就忘了，该怎么回去了。']);
    await S.say('林小满', ['谢谢你们来送我。', '岚岚，元旦晚会的《致橡树》……你一个人念吧。要念得大声一点哦。']);
    S.sfx('cry');
    await S.narr('周老师用手背捂着嘴，使劲地点头。');
    await S.walk('xm_c', [12, 8], 1.6);
    S.sfx('chime');
    await S.alpha('xm_c', 0, 1400);
    await S.narr('她走到门口，没有回头。\n门外的走廊里，楼梯口的方向，好像亮起了一盏灯。');
    S.face('zhou_c', 'pl');
    await S.say('周老师', '……别回头看。规矩。');
    await S.fade(1, 1400);
    await S.card('天亮了', '2006年12月9日　星期六', '苏晴的烧，天亮以前就退了。\n她说她做了一个很长的梦，\n梦见一个短头发的姐姐，替她掖了掖被角。\n\n那天下午，旧楼二楼楼梯口的那盏灯，\n被重新装上了。');
    await S.end({ title: '第七夜　完', text: '那一年的元旦晚会，周老师一个人上台，念了一首《致橡树》。\n念得很大声。\n\n从那以后，高二(3)班再也没有人请过笔仙。\n旧楼楼梯口的雏菊，每年十二月，还是会多一束。' });
  }
  async function badEnd(S, k) {
    if (k === 'how') {
      await S.say('你', '小满，那天晚上……你是怎么……');
      await S.say('周老师', '陈默！不能问——', { style: 'big' });
      S.amb('none');
      await S.narr('笔已经动了。\n它动得飞快，快得你们两个人的手都跟不上——');
      await pen(S, '一个字叠着一个字，写满了整张纸：', '楼　梯　好　黑', { desk: 'mdesk' });
    } else {
      await S.say('你', '那……我什么时候会死？');
      await S.say('周老师', '你——！', { style: 'big' });
      S.amb('none');
      await pen(S, '笔尖滑到那一排数字上，一个一个地点——', '2　0　0　6　1　2　0　9', { desk: 'mdesk' });
      S.sfx('heart');
      await S.narr('二〇〇六年，十二月九日。\n……就是今天。');
    }
    S.ent('ocandle').off = true; S.dark(.99); S.plr(.6);
    await S.narr('蜡烛灭了。\n黑暗里，有人贴在你耳边，很轻很轻地说——');
    await S.say('？？？', '……你想看吗？', { style: 'whisper' });
    await S.scare('face', { spr: '@xiaoman', dur: 1.2 });
    if (k === 'how') return S.end({ bad: true, title: '你问了不该问的问题', text: '第二天早上，值日的同学在旧楼二楼的楼梯口，发现了你们两个人。\n你们并排坐在最上面一级台阶上，手背交叉着，还紧紧地握着那支红笔，怎么也掰不开。\n\n从那以后，你一闭上眼睛，就是一段很长、很黑的楼梯。\n你一直在往下走。一直走不到头。' });
    return S.end({ bad: true, title: '你问了不该问的问题', text: '天亮的时候，周老师一个人从旧楼里走了出来。\n她说，她什么也不记得了。\n\n高二(3)班的座位表上，第四排靠窗的那个位子，从此一直空着。\n有人说，半夜的时候，那里会坐着两个人：\n一个剪着短头发——另一个，长得很像你。' });
  }
})();
