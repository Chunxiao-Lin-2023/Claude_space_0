/* ================= the late world: side stories, more wild events and bounties, four late 秘境, three small games for
   the great techniques, the branch choices, the quiet scenes between fights, and what the ending remembers =================
   Side stories (支线, listed on the 回忆录 page with where to go next):
     弟弟   秦昊 comes to 天庭 to measure himself against you (天庭 after it is founded); later, his bone gone, he is lost
            (天庭, after 第十三卷). At the 界海 he stands with you against the three emperors — and burns his life.
     重瞳   石毅 in 仙域古城, then beside you on the 帝落古战场. In the depths of the 界海, when you die, he is the first to
            burn his blood to buy you time.
     不老泉 云曦 on 九天之巅 one night; then the old spring in 百断山. Her water keeps 天庭's 药园 green.
     盒子   where the 烂木盒子 came from: 小七 (天庭), 蛄祖 (after 第十四卷), and the river of time (帝落古战场).
     王长生 if you let him go at the 天门, or fought him there, he is waiting in 仙域古城 (after 第十二卷).
   The quiet scenes (歇脚) sit inside the chapters 17–32; the small games: 逆活八世 (翻牌), 他化自在 (挡追兵),
   独断万古 (节奏). The ending looks back at what you chose (see finaleEchoes). */

/* ---------- three small games ---------- */
Object.assign(MINI, {
  memory: { title: '逆活八世', hint: '翻开两张，一样的就留下。<b>把八世都对上</b>——翻错太多次，前世就散了。',
    init(o) { const L = (o.faces || ['🔨', '🛡️', '🥣', '🌳', '🤱', '🧱', '🪑', '⚔️']).slice(0, 8); return { c: shuffle([...L, ...L]), open: [], got: [], miss: 0, lim: o.miss || 10 }; },
    tap(M, i) { if (typeof i !== 'number' || M.got.includes(i) || M.open.includes(i)) return; if (M.open.length >= 2) M.open = []; M.open.push(i); sfx('click');
      if (M.open.length === 2) { const [a, b] = M.open; if (M.c[a] === M.c[b]) { M.got.push(a, b); M.open = []; sfx('level'); if (M.got.length === M.c.length) return { end: true, score: M.miss <= 3 ? 3 : M.miss <= 6 ? 2 : 1 }; } else { M.miss++; if (M.miss > M.lim) return { end: false, score: 0 }; } } },
    html(M) { return `<div class="mgrid" style="grid-template-columns:repeat(4,1fr);width:248px">${M.c.map((f, i) => { const up = M.got.includes(i) || M.open.includes(i); return `<button class="cell ${M.got.includes(i) ? 'on' : ''}" onclick="miniTap(${i})">${up ? f : ''}</button>`; }).join('')}</div>
        <div class="mmsg">对上 ${M.got.length / 2}/8 · 翻错 <span class="${M.miss > M.lim * 0.7 ? 'bad' : ''}">${M.miss}/${M.lim}</span></div>`; } },
  clones: { title: '他化自在', hint: '追兵从三路来。<b>哪一路亮起 ⚠，就点哪一路</b>——让那一路的你挡住它。',
    init: o => ({ n: o.n || 8, need: o.need || 6, i: 0, hits: 0, lane: rint(0, 2), T: o.T || 1500 }),
    next(M, ok, msg) { M.hits += ok; M.last = msg; M.lastOk = ok; sfx(ok ? 'hit' : 'miss'); M.i++; M.t0 = now(); M.lane = rint(0, 2); M._dirty = 1; if (M.i >= M.n) return { end: M.hits >= M.need, score: M.hits >= M.n ? 3 : 2 }; },
    tap(M, a) { if (typeof a !== 'number') return; return this.next(M, a === M.lane, a === M.lane ? '挡住了！' : '挡错了一路'); },
    check(M) { if (now() - M.t0 > M.T * Math.max(0.6, 1 - M.i * 0.05)) return this.next(M, false, '慢了——追兵冲过去了'); },
    html(M) { return `<div class="mstack">${Array.from({ length: M.n }, (_, i) => `<span class="${i < M.i ? 'ok' : ''}">${i < M.i ? '👥' : '·'}</span>`).join('')}</div>
        <div class="mgrid" style="grid-template-columns:repeat(3,1fr);width:240px">${[0, 1, 2].map(i => `<button class="cell ${i === M.lane ? 'on' : ''}" onclick="miniTap(${i})">${i === M.lane ? '⚠' : '👤'}</button>`).join('')}</div>
        <div class="mmsg ${M.lastOk ? 'ok' : ''}">${M.last || ''}　挡住 ${M.hits}/${M.need}</div>`; } },
  rhythm: { title: '独断万古', hint: '光走到<b>金色的节点</b>上时点“斩”。走两遍，一共十下。',
    init: o => ({ notes: o.notes || [16, 33, 51, 69, 86], passes: o.passes || 2, p: 0, hit: [], hits: 0, need: o.need || 7, D: o.D || 3600 }),
    pos(M) { return clamp((now() - M.t0) / M.D * 100, 0, 100); },
    tap(M) { const x = this.pos(M); let best = -1, bd = 99; M.notes.forEach((n, i) => { if (!M.hit.includes(i) && Math.abs(n - x) < bd) { bd = Math.abs(n - x); best = i; } });
      if (best >= 0 && bd <= 5.5) { M.hit.push(best); M.hits++; M.last = '斩！'; M.lastOk = true; sfx('hit'); } else { M.last = '空了'; M.lastOk = false; sfx('miss'); } },
    check(M) { if (now() - M.t0 >= M.D) { M.p++; M.hit = []; M.t0 = now(); if (M.p >= M.passes) return { end: M.hits >= M.need, score: M.hits >= M.notes.length * M.passes - 1 ? 3 : 2 }; return 0; } },
    tick(M, D) { const e = D.querySelector('.rmark'); if (e) e.style.left = this.pos(M) + '%'; },
    html(M) { return `<div class="mbar">${M.notes.map((n, i) => `<div class="rnote ${M.hit.includes(i) ? 'ok' : ''}" style="left:${n}%"></div>`).join('')}<div class="rmark" style="left:${this.pos(M)}%"></div></div>
        <div class="mmsg ${M.lastOk ? 'ok' : ''}">${M.last || ''}　第 ${Math.min(M.p + 1, M.passes)}/${M.passes} 遍 · 斩中 ${M.hits}/${M.need}</div><button class="mbtn" onclick="miniTap()">⚔️ 斩！</button>`; } },
});

/* ---------- partners for the late world, and characters ---------- */
Object.assign(ALLY_NPC, {
  a_qinhao: { name: '秦昊', icon: '🧒', mul: { hp: 2.2, atk: 1.6, def: 1.3 }, sk: [{ n: '轮回宝术', dmg: 1.2, mag: 1, st: { k: 'stun', t: 1, p: 0.25 }, w: 3 }, { n: '仙骨之光', dmg: 0.8, aoe: 1, mag: 1, w: 2 }] },
});
Object.assign(MOBS, {
  wangcs: { name: '王长生', lv: 70, boss: 1, mul: { hp: 7.4, atk: 1.75, def: 1.85 }, sk: [{ n: '平乱诀', dmg: 1.05, aoe: 1, mag: 1, st: { k: 'weak', t: 2, v: 0.25, p: 0.5 }, w: 2 }, { n: '长生掌', dmg: 1.5, w: 3 }, { n: '断子绝孙', dmg: 2.3, w: 1, charge: 1 }], loot: [['baoyao', 4]], p2: '王长生的脸上一点表情都没有：“我连儿子都能杀。你算什么？”', d: '王家家主。为了一家人进仙域，亲手杀了六个儿子。' },
  hsyu: { mech: 'summon', summonId: 'yuzu9', name: '黑水狱主', lv: 63, boss: 1, mul: { hp: 6.0, atk: 1.65, def: 1.7 }, sk: [{ n: '黑水灌顶', dmg: 1.0, aoe: 1, mag: 1, w: 2 }, { n: '狱主之鞭', dmg: 1.45, w: 3 }, { n: '百年刑', dmg: 2.2, w: 1, charge: 1 }], loot: [['baoyao', 3]], p2: '狱主敲响了牢门：“来人！把他给我锁回去！”', d: '黑水天牢最深处的狱主。你在他手底下熬过一百年。' },
  ysying: { name: '帝城旧影', lv: 67, boss: 1, weak: { bone: 1 }, mul: { hp: 6.9, atk: 1.7, def: 1.7 }, sk: [{ n: '守城枪阵', dmg: 1.0, aoe: 1, w: 2 }, { n: '旧日一枪', dmg: 1.5, w: 3 }, { n: '城破之时', dmg: 2.2, w: 1, charge: 1 }], loot: [['baoyao', 3]], p2: '旧影的枪尖上亮起了七种颜色——它认出了七王的血！', d: '原始帝城地宫里，一个守城人留下的影子。城里的人都跑了，它没跑。' },
  dlmu: { mech: 'pride', name: '帝陵守墓人', lv: 81, boss: 1, mul: { hp: 7.6, atk: 1.9, def: 2 }, sk: [{ n: '帝陵封土', dmg: 1.05, aoe: 1, w: 2 }, { n: '守墓铲', dmg: 1.5, w: 3 }, { n: '葬帝', dmg: 2.4, w: 1, charge: 1 }], loot: [['baoyao', 4]], p2: '守墓人把铲子插进土里：“这一铲下去，埋过一位帝。”', d: '帝落时代的守墓人。帝都死了，他还在守。' },
  jhsizhu: { mech: 'tide', name: '死世界之主', lv: 85, boss: 1, weak: { lei: 1 }, mul: { hp: 7.2, atk: 1.85, def: 2 }, sk: [{ n: '枯叶之海', dmg: 1.05, aoe: 1, mag: 1, w: 2 }, { n: '死寂', dmg: 1.5, w: 3 }, { n: '世界凋零', dmg: 2.5, w: 1, charge: 1 }], loot: [['baoyao', 5]], p2: '整片枯叶世界都卷了起来，朝你压下来！', d: '界海里一片死掉的世界，最后变成的东西。' },
});
Object.assign(RELICS, {
  r_wangcs: { n: '平乱诀残页', from: 'wangcs', i: '📜', d: '攻击 +10%，防御 +6%。', b: { atkP: 0.1, defP: 0.06 } },
  r_hsyu: { n: '黑水狱钥', from: 'hsyu', i: '🗝️', d: '气血 +12%，符力 +8%。', b: { hpP: 0.12, mpP: 0.08 } },
  r_ysying: { n: '七色枪缨', from: 'ysying', i: '🎏', d: '攻击 +8%，暴击 +5%。', b: { atkP: 0.08, crit: 0.05 } },
  r_dlmu: { n: '守墓铲', from: 'dlmu', i: '⚱️', d: '防御 +14%，气血 +8%。', b: { defP: 0.14, hpP: 0.08 } },
  r_jhsizhu: { n: '世界的最后一点绿', from: 'jhsizhu', i: '🍀', d: '全属性 +8%，造成伤害的 3% 回复气血。', b: { hpP: 0.08, atkP: 0.08, defP: 0.08, mpP: 0.08, leech: 0.03 } },
});

/* ---------- four late 秘境 ---------- */
Object.assign(DUNGEONS, {
  heishui: { name: '黑水天牢深处', lv: 62, loc: 'yy_jail', rooms: [
    { name: '下层牢道', text: '牢道往下走，水越来越黑，越来越冷。墙上刻满了“正”字——一笔一天。', mobs: ['yuzu9', 'yuzu9'] },
    { name: '水牢', text: '一间灌满黑水的牢房，水面上漂着一只破碗。你认得这只碗——你用过一百年。', event: 'cell' },
    { name: '狱底', text: '狱底坐着一个人，手里攥着一串钥匙。他抬头看见你，愣了一下：“……一百年了，你还敢回来？”', mobs: ['hsyu'], boss: 1, epic: { name: '黑水狱主', sub: '你在他手底下熬过一百年', seal: '黑水', intro: ['他的鞭子还是那一根。', '你已经不是那个人了。'], phase: '狱主敲响了牢门，更多的狱卒涌了进来！', end: ['你把那串钥匙扔进了黑水里。', '牢里所有的锁，同时开了。'] } }] },
  yuanshidg: { name: '原始帝城地宫', lv: 66, loc: 'xy_yuanshi', rooms: [
    { name: '地宫甬道', text: '帝城的地底下还有一座城，比上面那座更老。甬道里站着残魂，枪尖全朝着城外。', mobs: ['ysmo', 'ysmo'] },
    { name: '七王壁', text: '一面墙上画着七个人，站成一排，背对着画外的人，面朝一片黑。墙角有人用指甲刻了一行字。', event: 'mural7' },
    { name: '地宫深处', text: '地宫最深处站着一个影子，手里一杆旧枪。城里的人都跑了，它没跑——跑不动了，就一直站着。', mobs: ['ysying'], boss: 1, epic: { name: '帝城旧影', sub: '城里的人都跑了，它没跑', seal: '帝城', intro: ['它守着一座空城。', '它不知道，城早就空了。'], phase: '旧影的枪尖亮起了七种颜色——它认出了你身上的血！', end: ['旧影放下了枪。', '它冲你行了一个守城人的礼，散了。'] } }] },
  diling: { name: '帝落帝陵', lv: 80, loc: 'dl_age', rooms: [
    { name: '陵道', text: '陵道两边立着帝落时代的兵，石头的。你走过去，石头的眼睛跟着你转。', mobs: ['diluobing', 'shiguang'] },
    { name: '帝棺', text: '一口很大很大的棺材，棺盖半开着，里面是空的。棺材边上放着一碗饭，还是热的。', event: 'coffin' },
    { name: '帝陵深处', text: '一个扛着铲子的老人从土里站起来，拍了拍身上的灰：“又一个来挖帝坟的？”', mobs: ['dlmu'], boss: 1, epic: { name: '帝陵守墓人', sub: '帝都死了，他还在守', seal: '帝陵', intro: ['他守了一个时代的坟。'], phase: '守墓人把铲子插进土里：“这一铲下去，埋过一位帝。”', end: ['守墓人坐了下来。', '“……你不是来挖坟的。”他说，“你是来上香的。”'] } }] },
  jhsi: { name: '界海死世界', lv: 85, loc: 'jh_deep', rooms: [
    { name: '枯叶边缘', text: '你踩上一片界海里的枯叶。叶子很大，大得像一整个世界——它本来就是一个世界。', mobs: ['jieling', 'jieling'] },
    { name: '死去的城', text: '枯叶上有一座城，城里没有人，可每一扇窗户里都点着灯。', event: 'deadworld' },
    { name: '世界之心', text: '叶子的正中间，枯掉的世界缩成了一团，慢慢地站了起来。它没有脸，可你知道它在看你。', mobs: ['jhsizhu'], boss: 1, epic: { name: '死世界之主', sub: '一整个死掉的世界', seal: '枯叶', intro: ['这个世界死了很久。', '它还不知道。'], phase: '整片枯叶世界都卷了起来，朝你压下来！', end: ['枯叶世界停了下来。', '叶子正中间，冒出了一点很小很小的绿。'] } }] },
});
const DG_EV2 = {
  cell: async () => { const c = await dlgChoose([{ t: '（把那只碗捞起来，带走）' }, { t: '（在墙上补一个“正”字，走了）' }], '那只破碗在黑水上一转一转。');
    if (c === 0) { logLine('你把碗擦干净，揣进了怀里。一百年，它装过的都是黑水。以后，让它装点别的。', 'enc'); give('baoyao', 2); C.story.f.bowl = 1; } else { logLine('你补完最后一笔，墙上的“正”字刚好凑满一百年。你笑了一下。', 'enc'); gainExp(BAL.expNext(C.lv) * 0.15); } },
  mural7: async () => { const c = await dlgChoose([{ t: '凑近去看那行字' }, { t: '冲七个背影鞠一躬' }], '七个背影，面朝一片黑。');
    if (c === 0) { logLine('那行字刻得很深：“我们走了以后，会有人接着站。”字的下面，有人用另一种笔迹补了一句：“接着了。”——你认出来，是小七的字。', 'enc'); gainExp(BAL.expNext(C.lv) * 0.15); } else { logLine('你鞠完躬抬起头，觉得最边上那个背影，好像点了一下头。', 'enc'); give('baoyao', 2); } },
  coffin: async () => { const c = await dlgChoose([{ t: '（端起那碗饭，吃了）' }, { t: '（在棺材前上一炷香）' }], '饭还是热的。');
    if (c === 0) { logLine('饭很香。吃完，你听见棺材里有人笑了一声：“……能吃，是好事。”——像孟天正的声音。', 'enc'); fullHeal(); refresh(); } else { logLine('香烟飘进棺材里，绕了一圈，又飘了出来，往时光长河下游去了。', 'enc'); give('baoyao', 2); gainExp(BAL.expNext(C.lv) * 0.1); } },
  deadworld: async () => { const c = await dlgChoose([{ t: '（一盏一盏把灯吹灭，让它们歇着）' }, { t: '（不碰，让灯一直亮着）' }], '每一扇窗户里，都点着一盏灯。');
    if (c === 0) { logLine('最后一盏灯灭的时候，你听见整座城叹了一口气。很轻，像放下了什么。', 'enc'); gainExp(BAL.expNext(C.lv) * 0.15); } else { logLine('你走的时候回头看了一眼：灯还亮着。在这么黑的海上，它们是唯一亮着的东西。', 'enc'); give('baoyao', 2); } },
};
PLACES.yy_jail.dungeon = 'heishui'; PLACES.xy_yuanshi.dungeon = 'yuanshidg'; PLACES.dl_age.dungeon = 'diling'; PLACES.jh_deep.dungeon = 'jhsi';

/* ---------- bounties in the late world ---------- */
BOUNTY_FROM.push({ npc: 'guzu', open: () => !!C.story.f.yyTree, areas: ['yiyu'] }, { npc: 'qiwanghou', open: () => !!C.story.f.tiantingDone, areas: ['jiutian', 'jiehai'] });
BOUNTY_FROM.find(b => b.npc === 'qidaolin').areas.push('xianyu', 'diluo');

/* ---------- side stories and late wild events ---------- */
const F_ = k => !!C.story.f[k];
const SIDEQ = [
  { id: 'qh', n: '弟弟', st: () => C.story.f.qinhao || 0, max: 2, open: () => F_('tiantingDone'), loc: s => s === 0 || F_('v13end') ? 'jt_court' : null, hint: s => s === 0 ? '天庭来了一个跟你长得有点像的少年。（天庭）' : !F_('v13end') ? '秦昊还在天庭，等你从帝落回来。' : '秦昊没了那块骨头。去天庭看看他。（天庭）', done: '秦昊会在界海边上等你。' },
  { id: 'sy', n: '重瞳', st: () => C.story.f.shiyiQ || 0, max: 2, open: () => F_('xwhyDone') && F_('shiyiDuel'), loc: s => s === 0 ? 'xy_city' : F_('dlAge') ? 'dl_age' : null, hint: s => s === 0 ? '石毅在仙域古城。（仙域古城）' : !F_('dlAge') ? '石毅说，他也想去时光长河上游看看。' : '石毅在帝落古战场等你。（帝落古战场）', done: '“我的血，你要用，随时拿去。”' },
  { id: 'yx', n: '不老泉', st: () => C.story.f.yunxiQ || 0, max: 2, open: () => F_('tiantingDone'), loc: s => s === 0 ? 'jt_peak' : 'bd_spring', hint: s => s === 0 ? '有人在九天之巅看夜色。（九天之巅，夜里）' : '云曦在百断山的不老泉等你。（不老泉）', done: '不老泉的水，养着天庭的药园。' },
  { id: 'box', n: '烂木盒子', st: () => C.story.f.boxQ || 0, max: 3, open: () => F_('tiantingDone'), loc: s => s === 0 ? 'jt_court' : s === 1 ? (F_('v14end') ? 'yy_guzu' : null) : 'dl_age', hint: s => s === 0 ? '小七好像有话要说——关于那只盒子。（天庭）' : s === 1 ? (F_('v14end') ? '蛄祖也许认得这只盒子。（蛄祖洞）' : '等异域平了，去问问蛄祖。') : '时光长河里，也许能看见做盒子的人。（帝落古战场）', done: '它的来历，你知道了。打开它的时候，在最后。' },
  { id: 'wang', n: '王长生', st: () => C.story.f.wangEnd ? 1 : 0, max: 1, open: () => !!C.story.f.wang, loc: () => F_('v12end') ? 'xy_city' : null, hint: () => F_('v12end') ? '王家进了仙域。账，该算了。（仙域古城）' : '王家进了仙域。等你走出造化之门，再去算账。', done: '王家的账，算完了。' },
];
function sideHtml() { const L = SIDEQ.filter(q => q.open()); if (!L.length) return '';
  return `<div class="card"><h4>支线 <span class="dim" style="font-size:.8rem">· <a href="#" onclick="event.preventDefault();recapShow(true)">📜 前情提要</a></span></h4><div class="list">${L.map(q => { const s = q.st(), done = s >= q.max;
    return `<div class="li"><span class="ic">${done ? '✔' : '❖'}</span><div class="t"><b>${q.n}</b> <span class="pill">${s}/${q.max}</span><small>${done ? q.done : q.hint(s)}</small></div></div>`; }).join('')}</div></div>`; }
const recapBtnHtml = () => C.story.q >= 3 ? `<div class="card"><button class="sb" onclick="recapShow(true)">📜 前情提要</button> <span class="dim" style="font-size:.8rem">讲到哪儿了？</span></div>` : '';

EVENTS.push(
  /* 弟弟 */
  { id: 'qh1', loc: 'jt_court', title: '弟弟', when: () => F_('tiantingDone'), scene: async () => {
    await nar('天庭的柱子下面，站着一个少年。他长得有点像你——像你爹年轻的时候。他看你的眼神，跟当年上界那些人一模一样：从上往下。');
    await say('秦昊', '你就是石昊？（他抬了抬下巴）我叫秦昊。不老山长大的。……他们说，你是我哥。');
    await me('……你是爹娘后来生的那个？');
    await say('秦昊', '他们说我是为了你生的。说我天生带着仙骨，以后要替你挡灾。（他冷笑了一声）我不信。我要看看，你到底凭什么。');
    const r = await startBattle({ rivals: [{ name: '秦昊', lv: Math.max(60, C.lv - 2), gear: 1.15, sk: ['lunhui', 'zhizun', 'sn'], icon: '🧒' }], title: '天庭 · 秦昊', noLose: true, flee: false, noPet: true });
    await nar(r && r.win ? '秦昊躺在地上，胸口那块骨头亮得发烫。他盯着天看了很久。' : '你没还手，让他打了三招。第四招，他自己停了。');
    const c = await choose(['别光靠那块骨头。让血流遍全身。', '（伸手把他拉起来）', '……爹娘还好吗？']);
    if (c === 0) { await say('秦昊', '……（他甩开你的手）用不着你教。'); C.story.f.qhAdvice = 1; await nar('可他走之前，回头看了一眼你的手——那只手上，什么骨头都没有。'); }
    else if (c === 1) await say('秦昊', '（他愣了一下，没甩开）……下回，我会赢的。');
    else await say('秦昊', '（他别过脸去）……娘天天念你。念得我耳朵起茧。');
    C.story.f.qinhao = 1; gainExp(BAL.expNext(C.lv) * 0.25); } },
  { id: 'qh2', loc: 'jt_court', title: '没了骨头的人', when: () => F_('v13end') && C.story.f.qinhao === 1, scene: async () => {
    await nar('秦昊坐在天庭最边上的台阶上，一个人。他胸口那块骨头，没了——有人从他身上把它夺走了。他的气息，弱得像一个刚入门的弟子。');
    await say('秦昊', '（他没抬头）……你小时候，也被人挖过骨头吧？疼吗？');
    await me('疼。');
    await say('秦昊', '那你是怎么……又站起来的？');
    await me('（你把村前空地上那块石锁扛了过来——你从下界带上来的）天天举。');
    const ms = await miniGame('lift', { title: '陪他举石锁', desc: '跟小时候一样。你举一下，他举一下。', rounds: 3, need: 2 });
    await nar(ms.ok ? '他举起来的时候，浑身都在抖。可他举起来了。他自己也愣住了——那股劲，不是从骨头里来的，是从血里来的。' : '他举了一整天，一次都没举起来。天黑的时候，他躺在地上笑了：“……明天再来。”');
    await say('秦昊', '（他擦了擦汗）……哥。');
    await nar('他说完就跑了。跑得比当年的你还快。');
    C.story.f.qinhao = 2; gainExp(BAL.expNext(C.lv) * 0.3); give('baoyao', 2); } },
  /* 重瞳 */
  { id: 'sy1', loc: 'xy_city', title: '重瞳', when: () => F_('xwhyDone') && F_('shiyiDuel'), scene: async () => {
    await nar('仙域古城的城墙上，坐着一个人，两只眼睛里各有两个瞳孔。他在看城外的界海。');
    await say('石毅', '（他没回头）……你也来了。');
    await nar('你在他旁边坐下。你们很久没有这样坐在一起了——也许从来没有。');
    await say('石毅', '我小时候，以为那块骨头是我的。后来知道不是，我想还，可还不回去了——它已经长在我身上了。（他低头看自己的手）我这一辈子，都在用别人的东西变强。');
    const c = await choose(['它在你身上，比在我身上用得好。', '那就用它，去守点什么。', '（什么都不说，陪他看海）']);
    if (c === 0) await say('石毅', '……（他笑了一下）你总是这样。让人没法恨你，也没法不欠你。');
    else if (c === 1) await say('石毅', '守什么？……（他看了看身后的仙域古城，又看了看你）……好。');
    else await nar('你们看着界海，一直看到天黑。他走的时候，拍了拍你的肩膀。');
    C.story.f.shiyiQ = 1; gainExp(BAL.expNext(C.lv) * 0.25); } },
  { id: 'sy2', loc: 'dl_age', title: '长河上游的重瞳', when: () => F_('dlAge') && C.story.f.shiyiQ === 1, scene: async () => {
    await nar('帝落古战场上，有人比你先到了。石毅站在一群帝落古兵中间，重瞳里的光一明一暗。');
    await say('石毅', '……你不是说，长河上游能看见很多东西吗？我也想看看。（他看着围上来的古兵）先打完再看。');
    await fight({ mobs: [['diluobing', slv(78)], ['diluobing', slv(78)], ['shiguang', slv(78)]], allies: ['a_shiyi'], title: '帝落古战场 · 双石', noLose: true });
    await nar('打完了。你们坐在一具古兵的盔甲上，看着天上的帝星一颗一颗地往下掉。');
    await say('石毅', '（他忽然开口）以后，要是哪一天你倒下了，起不来了——（他指了指自己的胸口）我的血，你拿去用。');
    await me('……别说这种话。');
    await say('石毅', '我说真的。（他的重瞳很平静）我欠的，总得还。');
    C.story.f.shiyiQ = 2; gainExp(BAL.expNext(C.lv) * 0.3); give('baoyao', 2); } },
  /* 不老泉 */
  { id: 'yx1', loc: 'jt_peak', title: '九天的夜', when: () => isNight() && F_('tiantingDone'), scene: async () => {
    await nar('九天之巅的夜里，有人站在你合上的那道裂缝边上。白衣服，月光落在她身上，像落在雪上。');
    await say('云曦', '……很多年不见了。（她转过身）灵湖阵里那个满脸是血、冲我傻笑的小矮子，长这么高了。');
    await me('你也没怎么变。');
    await say('云曦', '变了。（她看着九天的灯火）我现在，不太敢一个人回下界了。怕回去以后，发现那些地方都不在了。……不老泉还在吗？');
    const c = await choose(['我陪你回去看看。', '在。我上来的时候，还喝过一口。']);
    if (c === 1) await say('云曦', '……（她笑了一下，很轻）那你陪我回去，再喝一口。');
    C.story.f.yunxiQ = 1; tip('<b>百断山 · 不老泉</b>。云曦会在那里等你。'); } },
  { id: 'yx2', loc: 'bd_spring', title: '不老泉', when: () => C.story.f.yunxiQ === 1, scene: async () => {
    await nar('不老泉还在。只是泉眼小了很多，泉水从石缝里一滴一滴地渗出来，要接很久才接满一瓢。云曦已经在了，蹲在泉边，用手接着水。');
    await say('云曦', '……比当年小多了。（她把接满的那一捧递给你）你先喝。');
    const c = await choose(['（接过来，喝了）', '（推回去）你接的，你先喝。', '（把水倒进带来的玉瓶里）带回去，给天庭的药园。']);
    if (c === 0) { await nar('水还是那个味道。甜的，凉的，带着一点百断山的血腥气。'); fullHeal(); }
    else if (c === 1) await nar('她看了你很久，喝了一半，把另一半倒回了泉眼里：“留给下一个来的人。”');
    else { await say('云曦', '（她愣了一下，然后笑出了声）……你这个人。好，带回去。我帮你接。'); await nar('你们接了一整天，接满了一瓶。'); }
    await say('云曦', '以后药园缺水，就来找我。我替你守着这口泉。');
    C.story.f.yunxiQ = 2; C.tt = C.tt || {}; if (!C.tt.yao) { C.tt.yao = 1; logLine('<b class="lvup">天庭</b>：云曦带来的泉水，让药园自己长了起来（药园 1 级）。', 'sys'); } give('lingyao', 3); gainExp(BAL.expNext(C.lv) * 0.25); } },
  /* 盒子 */
  { id: 'box1', loc: 'jt_court', title: '盒子 · 小七', when: () => F_('tiantingDone'), scene: async () => {
    await say('qiwanghou', '（小七蹲在柱子下面，盯着你怀里那只烂木盒子）……你一直没打开过？');
    await me('没有。你替我收着的时候，打开过吗？');
    await say('qiwanghou', '没有。（他摇了摇头）孟老不让。孟老说，这只盒子比帝关还老。帝关最早的城墙，是木头的——城墙塌了以后，有人从塌掉的木头里，捡了一块，做成了这只盒子。');
    await say('qiwanghou', '再往前的事，孟老也不知道了。他说，异域那边有个活得很久的老东西，也许知道。');
    C.story.f.boxQ = 1; } },
  { id: 'box2', loc: 'yy_guzu', title: '盒子 · 蛄祖', when: () => C.story.f.boxQ === 1 && F_('v14end'), scene: async () => {
    await say('guzu', '（蛄祖眯着眼睛看了那只盒子很久）……这块木头，我见过。很久很久以前，它还是城墙的时候，我在城下面，看着它。');
    await say('guzu', '那时候帝关还没有名字。城墙上站着一个孩子，比你当年还小。他从塌掉的墙上掰下来一块木头，用牙咬，用指甲抠，抠出了一只盒子。');
    await me('他往里面放了什么？');
    await say('guzu', '（他笑了，笑得很慢）我在城下面，看不见。……去时光长河上游看看吧。那个孩子，还在那儿。');
    C.story.f.boxQ = 2; gainExp(BAL.expNext(C.lv) * 0.2); } },
  { id: 'box3', loc: 'dl_age', title: '盒子 · 长河上游', when: () => C.story.f.boxQ === 2, scene: async () => {
    await nar('长河里漂过来一段很旧很旧的光。光里有一道木头的城墙，城墙塌了一半。一个很小的孩子坐在塌掉的墙上，低着头，用指甲抠一块木头。');
    await nar('他抠完了，在盒底刻了一行字，然后把盒子抱在怀里，站到了城墙最前面。');
    await me('（你伸出手）……喂。');
    await nar('光漂走了。你没有看清那行字。可你看清了那个孩子的额头——上面没有“罪”字，干干净净的。那时候，还没有人往孩子的额头上刻字。');
    C.story.f.boxQ = 3; gainExp(BAL.expNext(C.lv) * 0.3); tip('盒子的来历，你知道了。打开它，等到最后。'); } },
  /* 王长生 */
  { id: 'wang2', loc: 'xy_city', title: '王长生', when: () => F_('v12end') && !!C.story.f.wang, scene: async () => {
    const now_ = C.story.f.wang === 'now';
    await nar('仙域古城最好的那条街上，有一座新宅子，门匾上写着一个“王”字。宅子里很安静，没有孩子的声音。');
    await say('王长生', now_ ? '（他从堂上站起来，胸口还缠着布——那是天门下你留下的伤）……你追到仙域来了。' : '（他从堂上站起来，衣服一尘不染）荒。……我就知道，你会来。');
    await me('六个儿子。你记得他们的名字吗？');
    await say('王长生', '（他沉默了一下）……记得。每一个都记得。（他看着你）我杀他们，是为了王家。你杀我，是为了什么？');
    if (!await fightRetry({ mobs: [['wangcs', slv(now_ ? 70 : 72, -1, 1)]], title: '仙域古城 · 王长生', epic: { name: '王长生', sub: '为了一家人进仙域，亲手杀了六个儿子', seal: '王家', intro: ['他说，他每一个名字都记得。'], phase: '王长生的脸上一点表情都没有：“我连儿子都能杀。你算什么？”', end: ['王长生跪了下去。', '他身后的宅子里，还是没有一点孩子的声音。'] } }, '王长生把你打出了宅子。他关上门，宅子里还是很安静。')) return;
    const c = await choose(['（斩）', '（废了他的修为）回九天去，给你六个儿子守墓。']);
    if (c === 0) await cine('剑落下去的时候，王长生闭上了眼睛。<br>他最后说了六个名字。<br>一个都没错。');
    else { await say('王长生', '……（他看了你很久，慢慢地站起来，没有求饶）好。'); await nar('后来有人在九天见过他：一个白头发的老人，每天在六座坟前扫地，扫得很干净。'); }
    C.story.f.wangEnd = c + 1; gainExp(BAL.expNext(C.lv) * 0.4); } },
  /* partners */
  { id: 'bazhen2', loc: 'sq_valley', title: '八珍麒', when: () => C.story.f.wd_sq_qilin && !C.pets.bazhen, scene: async () => {
    await nar('那头八种颜色的小麒麟又从草丛里钻了出来。这一回它没抢你的饼——它叼着一块饼，放在你脚边，然后蹲下，看着你。');
    await me('……你要跟我走？');
    await nar('它打了个响鼻，八种颜色的毛一起抖了抖。'); gainPet('bazhen'); } },
  { id: 'jh_fish', loc: 'jh_dam', title: '枯叶上的水洼', when: () => F_('dam'), scene: async () => {
    await nar('堤坝下面，界海冲上来一片很小的枯叶。叶子上有一个水洼，水洼里有一条小鱼——只有手指长，在黑水里游来游去，一点都不怕。它发着一点光，长得像当年拖着你冲进界海的那条始祖鱼苗——小了好几号。');
    const c = await choose(['（把它捧起来）', '（把枯叶推回海里）']);
    if (c === 0) { await nar('你把它捧起来。它在你掌心里转了一圈，然后吐了一个泡泡，泡泡里映着天庭的柱子。'); gainPet('yumiao'); }
    else { await nar('你把枯叶推回海里。小鱼跳了起来，跳回了你的掌心——它不走了。'); gainPet('yumiao'); } } },
  { id: 'jt_lion', loc: 'jt_feng', title: '九个脑袋', when: () => F_('jinfeng'), scene: async () => {
    await nar('风族的山崖下面，有一窝东西在吵架。你走近一看——是一只小狮子，九个脑袋，八个在睡觉，醒着的那个在冲另外八个吼。');
    await nar('它看见你，九个脑袋同时醒了，同时冲你吼了一声。然后同时打了个哈欠。');
    const c = await choose(['（掰一块肉干扔过去）', '（蹲下来，冲它吼回去）']);
    await nar(c === 0 ? '九个脑袋抢一块肉干，打成了一团。打完，它们一起蹭了过来。' : '你吼得比它们九个加起来还响。它们愣了一下，九个脑袋一起低了下去——认了。');
    gainPet('jiutou'); } },
  /* the late world */
  { id: 'yy_old', loc: 'yy_gate', title: '扔饼的孩子', when: () => F_('v14end') && C.story.f.wd_yy_stone, scene: async () => {
    await nar('异域城门下，一个白头发的老人站在那里，手里拿着一块饼。他看见你，笑了——缺了两颗牙。');
    await say('异域老人', '……我娘说你是坏人。我扔了你一百年的饼。（他把饼递过来）今天，城门上没人吊着了。我想当面给你。');
    await nar('你接过饼，咬了一口。还是那个味道。'); gainExp(BAL.expNext(C.lv) * 0.15); give('baoyao', 2); } },
  { id: 'xy_milk', loc: 'xy_city', title: '仙域的兽奶', when: () => F_('yuanshiDone'), scene: async () => {
    await nar('仙域古城的街角，有一个老婆婆在卖兽奶。她说，这是下界的方子——很久很久以前，一个从下界飞升上来的人教她的。');
    const c = await choose(['（买一罐）', '（问她那个人叫什么）']);
    if (c === 0) { await nar('你喝了一口，愣住了。是石村的味道。'); give('milk', 3); }
    else await say('卖兽奶的老婆婆', '叫什么？（她想了很久）……她说她男人姓石。她说，下界有个村子，村里的娃娃，都是喝这个长大的。');
    gainExp(BAL.expNext(C.lv) * 0.1); } },
  { id: 'jt_kids', loc: 'jt_gate', title: '荒和异域', when: () => F_('v9end') && !isNight(), scene: async () => {
    await nar('九天的街上，一群孩子在玩打仗。一边叫“荒”，一边叫“异域”。没有一个孩子愿意当异域。');
    await say('九天的孩子', '（一个最小的孩子被推了出来，哭丧着脸）……为什么又是我当异域！');
    const c = await choose(['（蹲下来）我来当异域。', '（看着他们笑）']);
    if (c === 0) await nar('你当了一下午的异域，被一群孩子打得“落花流水”。最小的那个孩子打得最起劲，打完了，把他的糖分了你一半。');
    else await nar('你看了一会儿就走了。走远了，还听见他们在喊：“荒——！吃饱了再打——！”');
    gainExp(BAL.expNext(C.lv) * 0.1); } },
  { id: 'jh_oldman', loc: 'jh_dam', title: '守坝的老人', when: () => F_('v14end'), scene: async () => {
    await say('守坝的老人', '（他还站在那个位置，一步都没挪过）……异域平了？');
    await me('平了。');
    await say('守坝的老人', '那你该往海里去了。（他从怀里摸出一块硬得像石头的干粮，掰了一半给你）吃饱了再去。');
    await me('……你也是石村的？');
    await say('守坝的老人', '（他笑了）不是。可守坝的人，都这么说。'); give('baoyao', 2); gainExp(BAL.expNext(C.lv) * 0.15); } },
);
WILD.unshift(
  { id: 'dl_shard', when: P => P.area === 'diluo' && C.bar.length > 0, run: () => { const id = pick(C.bar); for (let i = 0; i < 4; i++) profUse(id); logLine(`一片时光碎片从长河里漂过来，碎片里是你自己——在很多年以前练${SKILLS[id].name}的样子。${SKILLS[id].icon}${SKILLS[id].name} 熟练度 +4。`, 'enc'); } },
  { id: 'yy_patrol', when: P => P.area === 'yiyu' && F_('yyEnd'), run: async () => { logLine('一队异域巡兵从城门那边走过来，看见你，愣了一下——然后硬着头皮冲了上来。', 'enc'); const lv = Math.max(60, C.lv - 1); await startBattle({ mobs: [['yytj', lv], ['yuzu9', lv]], title: '异域 · 巡兵', flee: true }); } },
);
{ const q = WILD.find(e => e.id === 'sq_qilin'), old = q.scene; q.scene = async () => { await old(); await nar('它走出去几步，又回头看了看你。然后它不走了。'); gainPet('bazhen'); }; }

/* ---------- 歇脚: one quiet scene in each later chapter ---------- */
const BREATH = {
  17: async () => { await nar('帝冲峰下有一条小溪。你洗了把脸，水里映出一张满是灰的脸——比争霸台那会儿，又长开了一点。');
    const c = await choose(['（在溪边睡一觉）', '（在那个大大的“帝”字旁边，刻一个小小的“荒”）']);
    if (c === 1) { F().carveHuang = 1; await nar('你刻得很小，小得要趴下来才看得见。刻完，你自己看着笑了半天。'); } else await nar('你睡得很沉。梦里，石村的柳树还是绿的。'); },
  18: async () => { await nar('夜里，帝关的城头上只点着几盏灯。小七蹲在墙根下，拿手指一个一个地摸墙上刻着的名字。');
    await say('qiwanghou', '这些都是守过城的人。（他摸到一个快磨平的名字）这个是我爷爷。这个是我爷爷的爷爷。');
    const c = await choose(['（把自己的名字也刻上去）', '（替他把那个快磨平的名字描深一点）']);
    if (c === 0) { F().wallName = 1; await say('qiwanghou', '（他瞪大了眼睛）你、你还没死呢！刻上去不吉利！……算了，刻吧。刻小一点。'); }
    else await say('qiwanghou', '（他看着你描，很久没说话）……谢谢。'); },
  19: async () => { await nar('你抱着盒子坐在城墙根下，孟天正端着两碗饭走过来，塞给你一碗。饭是黑的，硬的，有一股沙子味。');
    await say('mengtz', '帝关的饭，难吃，管够。（他自己先吃了一大口）……当年我第一天到帝关，吃了一口，哭了。');
    await me('难吃哭的？');
    await say('mengtz', '（他哈哈大笑）也有一点。'); },
  20: async () => { await nar('黑水天牢里没有白天，只有水滴。一滴，一天。你数到第三千滴的时候，开始哼石村的调子。');
    await nar('隔壁牢房里，一个看不清脸的异域罪人，跟着哼了起来。哼错了好几个音。');
    const c = await choose(['（教他哼对）', '（跟着他哼错的那个调子哼）']);
    await nar(c === 0 ? '你教了他三百滴。第三百零一滴的时候，他哼对了。他在那边笑出了声，被狱卒抽了一鞭子，还在笑。' : '后来你们俩哼的，就成了一首新的调子。石村没有，异域也没有。'); },
  21: async () => { await nar('海瀑的边上，风大得站不稳。你坐了下来，把腿垂在悬崖外面。下面是界海，上面是异域的天。');
    await nar('你从怀里摸出最后一片悟道茶叶，放在嘴里嚼了很久。很苦。苦完了，有一点甜。');
    await me('（小声）……柳神，我要跳了。你要是还在，接我一下。'); },
  22: async () => { await nar('原始帝城的街上空荡荡的。只有一个老头在街角支着一口锅，锅里煮着面。他看见你，招了招手。');
    await say('煮面的老头', '下界来的？（他给你盛了一大碗）好久没见过下界来的人了。上一个，是好几个纪元以前。他也是一个人，也是吃得很香。');
    await nar('你吃了两碗。他不收钱，说下界来的，都不收。'); },
  23: async () => { await nar('前一天夜里，孟天正一个人坐在城头上喝酒。你走过去，他递给你一碗。');
    await say('mengtz', '孩子。你知道我为什么想成仙吗？（他看着边荒的天）我想飞得很高很高，看一眼我老家。我离开那里，已经三万年了。');
    const c = await choose(['你老家在哪儿？', '……成了仙，带我也去看看。']);
    if (c === 0) await say('mengtz', '（他笑了）一个小村子。村口有一棵树。……跟你们石村，大概差不多。');
    else await say('mengtz', '（他愣了一下，然后拍了拍你的头）好。说定了。');
    F().mengTalk = c + 1; await nar('那是你最后一次跟他喝酒。'); },
  24: async () => { await nar('晚饭是你娘做的。她做了一大桌，全是你小时候爱吃的——你小时候其实什么都爱吃。');
    await nar('你爹蹲在门口，一声不吭地给那张小木床接了一截床腿。接完，你躺上去试了试——脚还是伸在外面。');
    await say('石子凌', '……（他看了看你的脚，又看了看床）明天再接一截。'); },
  25: async () => { await nar('石村八百兵在七大道统的山脚下扎营。夜里篝火一堆一堆的，有人唱歌，有人磨刀，有人在给家里写信——写的全是“吃饱了”。');
    await nar('皮猴在火堆边上翻跟头。第十一个，过去了。第十二个——他摔了个狗啃泥。全营的人都笑醒了。');
    const c = await choose(['（扶他起来）', '（你也翻一个）']);
    await nar(c === 0 ? '皮猴爬起来，满脸是泥：“明天打完了，我再翻！”' : '你翻了十三个。全营的人都不笑了，盯着你看。皮猴哭了：“……小不点你欺负人！”'); },
  26: async () => { await nar('你在堤坝上待到天黑。守坝的老人一直没回头，到了吃饭的时候，从怀里摸出一块干粮，掰了一半，往后一递。');
    await say('守坝的老人', '……数叶子吗？我数了很多年了。今天漂过去三片。（他嚼着干粮）有一片上面，有灯。'); },
  27: async () => { await nar('造化之门前面，你坐在那些骨头中间，给石村写了一封信。写了很长，最后全划掉了，只剩一句。');
    await nar('<b>“我挺好。吃饱了。”</b>');
    await nar('你把信交给了来送你的小七。他说，他亲自送下去。'); F().zaohuaLetter = 1; },
  28: async () => { await nar('帝落古战场的夜里，天上的帝星一颗一颗地往下掉，像下雨。你躺在一块大石头上数，数到一百就数不清了。');
    if (F().carveHuang) await nar('你翻了个身，手底下摸到了什么——石头上刻着一个很小很小的“荒”字，小得要趴下来才看得见。<br>……是你在帝冲峰下刻的那一个？还是很久很久以前，有另一个人，也这么刻过？');
    else await nar('你想起了石村的夜。石村的星星不掉，就那么挂着，挂了一辈子。'); },
  29: async () => { if (F().stoneName === 3 && !F().stoneLate) { await nar('你回到石村的时候，村口那块石头上，刻满了一代一代孩子的名字。最上面，还空着一个位置——那是族长当年给你留的。');
      await nar('你从怀里摸出那把小刀。刀刃早就钝了。你在空着的那个位置上，刻下了三个字：<b>小不点</b>。'); F().stoneLate = 1; F().stoneName = 1; }
    else await nar('你回到石村的时候，村口那块石头上，刻满了一代一代孩子的名字。最上面那个，是' + (F().stoneName === 2 ? '“石昊”——旁边不知道哪个孩子，又给你补刻了一个“小不点”。' : '“小不点”。'));
    await nar('一个孩子在石头边上举石锁，举不动，在哭。');
    const c = await choose(['（蹲下来，教他怎么使劲）', '（帮他把石锁抬起来一点点，再松手）']);
    await nar(c === 0 ? '你教了他一下午。天黑的时候，他举起来了，扔下石锁就往家跑：“娘！我举起来了！”' : '你只帮了一点点。他自己举起来的时候，以为全是自己的力气，高兴得在地上打滚。你没告诉他。'); },
  30: async () => { await nar('天庭最高的那间屋子里，火灵儿睡着。你在她床边坐了一夜。');
    const c = await choose(['（给她讲百断山的烤肉）', '（什么都不说，坐到天亮）']);
    if (c === 0) await nar('你从百断山讲起，讲到上界，讲到帝关，讲到黑水，讲到这里。讲到烤肉的时候，你觉得她的嘴角动了一下。……也许是灯光晃的。');
    else await nar('天亮的时候，窗外有一只火鸟落在窗台上，叫了一声，又飞走了。'); F().huoNight = c + 1; },
  31: async () => { await nar('你躺在仙域古城的城墙下养伤。黑柳的枝条垂下来，在你身上搭了一个棚子，挡着太阳。');
    await say('willow', '……你小时候，就是这么躺在我底下的。尿了我一身。');
    await me('……我不记得了。');
    await say('willow', '我记得。（柳枝轻轻晃了晃）你记不住的，我都替你记着。'); },
  32: async () => { await nar('跳进界海之前，天庭摆了最后一顿饭。柱子底下摆满了桌子，从天庭一直摆到天门外面。');
    await nar('大壮的后人端来一大罐兽奶。小七——一个白胡子老人——坐在最前面那一桌。齐道临喝多了，在讲你小时候的事，全讲错了。');
    const c = await choose(['（举起兽奶）吃饱了再打！', '（举起兽奶）……都要好好的。']);
    await nar(c === 0 ? '“吃饱了再打——！”整个天庭的人一起喊。喊声传得很远，远到九天十地都听见了。' : '桌子边上安静了一会儿。然后所有人一起举起了碗。没有人说话。'); },
};
async function breath(n) { if (!BREATH[n]) return; if (C.story.f['br' + n]) return; C.story.f['br' + n] = 1; await nar('<span class="dim">—— 歇一口气 ——</span>'); await BREATH[n](); }

/* ---------- what the ending remembers ---------- */
function finaleEchoes() { const f = C.story.f, L = [];
  if (f.huoBye === 3) L.push('百断山里那块烤肉。你欠了她一辈子的烤肉。'); else if (f.huoBye === 2) L.push('你跟火灵儿说过：我会回来的。你回来了。');
  if (f.duelTalk === 'father') L.push('天空战场上，石毅说了一声谢谢。'); if (f.held7) L.push('七神面前那四个回合。“麦子，也会扎手。”');
  if (f.yinkun === 'spare') L.push('那个你放过的银坤，后来在天庭扫了一辈子地。');
  if (f.wallName) L.push('帝关城墙上，那个刻得很小的名字。'); if (f.mengTalk === 2) L.push('孟天正说好了，成了仙，带你去看他老家。他没成仙。你替他去看过了。');
  if (f.xiaoqiSafe) L.push('安澜面前，你一直挡在小七前面。'); if (f.letter) L.push('那封没寄出去的信，一直跟盒子放在一起。');
  if (f.jinwuFire) L.push('别人的火堆边上，金乌族的烤法。'); if (f.star) L.push('上界摘下来的那颗星星。'); if (f.leaf) L.push('天庭柱子底下，那片从界海捡回来的叶子，已经长成了一棵小树。');
  if (f.jinFate === 1) L.push('帝关城下，小七亲手审了金太君。'); if (f.wangEnd === 2) L.push('九天的六座坟前，有一个白头发的老人在扫地。');
  if (f.yunxiQ >= 2) L.push('不老泉的水，一直养着天庭的药园。'); if (f.huoGuard) L.push('三位仙王伏击的时候，没有一道光落在她身上。');
  if (f.carveHuang) L.push('帝冲峰下，那个很小很小的“荒”字。');
  if (f.stoneName === 3) L.unshift('族长塞给你的那把小刀，你一直带着。村口那块石头上，还空着一个位置。'); else if (f.stoneName) L.unshift('村口那块石头上，你自己刻的那个名字，被一代一代的孩子摸得发亮。');
  return L; }

/* ---------- titles for the late game ---------- */
ACH.push(
  { id: 'yinshi', n: '隐世无双', d: '赢过全部六位隐世天骄', ok: () => HIDDEN.every(H => C.hidden && C.hidden[H.id] && C.hidden[H.id].win) },
  { id: 'ttfull', n: '天庭之主', d: '把天庭的药园、炼器坊、演武场、城墙都修到 3 级', ok: () => TT.every(T => ttLv(T.k) >= 3) },
  { id: 'forge5', n: '炼器宗师', d: '把一件宝骨炼到 +5', ok: () => Object.values(C.forge || {}).some(v => v >= 5) },
  { id: 'dao', n: '悟道', d: '把气血、攻击、防御的悟道都练满', ok: () => DAO_OPTS.every(o => ((C.daoP || {})[o.k] || 0) >= DAO_MAX) },
  { id: 'side4', n: '人情', d: '把弟弟、重瞳、不老泉、烂木盒子四段支线都走完', ok: () => SIDEQ.slice(0, 4).every(q => q.st() >= q.max) },
  { id: 'zhenshen', n: '真身', d: '让一个伙伴显出真身', ok: () => Object.values(C.pets).some(p => p.evo3) },
  { id: 'lunhui2', n: '第二世', d: '轮回一次，从石村重新开始', ok: () => (C.ng || 0) >= 1 },
  { id: 'late4', n: '深处', d: '走通黑水天牢深处、原始帝城地宫、帝落帝陵、界海死世界', ok: () => ['heishui', 'yuanshidg', 'diling', 'jhsi'].every(k => (C.dungeons || {})[k]) },
);
