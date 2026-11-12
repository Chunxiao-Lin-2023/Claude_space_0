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
  /* 对上 (was a 16-card flip game — too hard): one line on top, eight things below, tap the one it means. No memorising, a few slips allowed. */
  memory: { title: '逆活八世', hint: '看上面写的是哪一世、哪样东西，<b>点下面对应的那一个</b>。点错几次也没关系。',
    init(o) { const P = (o.pairs || [['🔨', '第一世 · 打铁的铁匠'], ['🛡️', '第二世 · 守城的将军'], ['🥣', '第三世 · 城门下的乞丐'], ['🌳', '第四世 · 一棵树'], ['🤱', '第五世 · 池边跪了三天的母亲'], ['🧱', '第六世 · 守坝的人'], ['🪵', '第七世 · 树桩边等孩子回家的老人'], ['⚔️', '第八世 · 你自己']]).slice(0, 8);
      return { P, faces: shuffle(P.map(x => x[0])), order: o.inOrder ? P.map((_, i) => i) : shuffle(P.map((_, i) => i)), i: 0, miss: 0, lim: o.miss || 4, bad: -1 }; },
    tap(M, k) { if (typeof k !== 'number' || M.i >= M.order.length) return; const want = M.P[M.order[M.i]][0];
      if (M.faces[k] === want) { M.i++; M.bad = -1; M.last = '对上了'; M.lastOk = true; sfx('level'); if (M.i >= M.order.length) return { end: true, score: M.miss === 0 ? 3 : M.miss <= 2 ? 2 : 1 }; }
      else { M.miss++; M.bad = k; M.last = '不是这个'; M.lastOk = false; sfx('miss'); if (M.miss > M.lim) return { end: false }; } M._dirty = 1; },
    html(M) { const cur = M.P[M.order[Math.min(M.i, M.order.length - 1)]], done = M.order.slice(0, M.i).map(j => M.P[j][0]);
      return `<div class="mprompt">${esc(cur[1])}</div><div class="mgrid" style="grid-template-columns:repeat(4,1fr);width:248px">${M.faces.map((f, k) => `<button class="cell pick ${done.includes(f) ? 'on' : ''} ${M.bad === k ? 'bad' : ''}" ${done.includes(f) ? 'disabled' : ''} onclick="miniTap(${k})">${f}</button>`).join('')}</div>
        <div class="mmsg ${M.lastOk ? 'ok' : ''}">${M.last || ''}　对上 ${M.i}/${M.order.length} · 点错 <span class="${M.miss > M.lim * 0.7 ? 'bad' : ''}">${M.miss}/${M.lim}</span></div>`; } },
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
  jinmaohou: { name: '金毛犼', lv: 78, boss: 1, mul: { hp: 7.2, atk: 1.75, def: 1.85 }, sk: [{ n: '犼啸', dmg: 1.0, aoe: 1, mag: 1, w: 2 }, { n: '金毛爪', dmg: 1.45, w: 3 }, { n: '陨仙一扑', dmg: 2.2, w: 1, charge: 1 }], loot: [['baoyao', 3]], p2: '金毛犼的金毛全竖了起来——仙王的气息压满了整座岭！', d: '陨仙岭之主，一位仙王。你破仙王境那一夜，它出过手。' },
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
  /* partners from the novel */
  { id: 'xiaobai', loc: 'sc_gate', title: '小白', when: () => F_('v2') && !C.pets.xiaobai, scene: async () => {
    await nar('村口的老槐树底下，站着一头独角兽。毛有点脏了，角上缠着草——可你一眼就认出来了。');
    await me('……小白？');
    await nar('你六岁那年，在山里跟它打了三天，把它拖回了村里，给它起名叫小白。它驮着你在大荒里跑了一整个夏天。后来你出村了，它就天天在村后的山坳里等。');
    await say('chief', '（族长拄着拐杖站在后面）它每天傍晚都来村口站一会儿。站了这么多年。');
    await nar('小白走过来，用脑袋顶了顶你的胸口。顶得你倒退了两步。'); gainPet('xiaobai'); } },
  { id: 'jinmao', loc: 'jt_yunxian', title: '陨仙岭', when: () => F_('v12end') && !C.pets.jinmao, scene: async () => {
    await nar('陨仙岭上全是骨头，仙的骨头。岭顶上趴着一头金毛的巨兽，金毛像一片烧着的麦田。');
    await say('金毛犼', '（它睁开一只眼睛）……是你。你破仙王境那一夜，我出过手。没打散你，算你命大。');
    await me('我记着呢。今天来，是还你那一下的。');
    if (!await fightRetry({ mobs: [['jinmaohou', slv(78, -1, 1)]], title: '陨仙岭 · 金毛犼', epic: { name: '金毛犼', sub: '陨仙岭之主 · 一位仙王', seal: '仙王', intro: ['那一夜的那一爪，你记着。'], phase: '金毛犼的金毛全竖了起来——仙王的气息压满了整座岭！', end: ['金毛犼被你按在了岭上。', '它喘着气：“……要杀就杀。”'] } }, '金毛犼把你拍下了岭。它趴回去，又闭上了眼睛：“明天再来。”')) { delete C.story.f.ev_jinmao; return; }
    const c = await choose(['不杀你。驮我。', '（松开手）你走吧。']);
    if (c === 0) { await say('金毛犼', '……（它咬着牙）我是仙王！'); await me('我也是。'); await nar('它瞪了你很久。最后，它把背低了下去。'); }
    else { await nar('你松开手，转身下岭。走到半山腰，身后一阵风——它追上来了。'); await say('金毛犼', '……陨仙岭太冷清了。（它别过脸去）我去你那个天庭看看。只是看看。'); }
    gainPet('jinmao'); gainExp(BAL.expNext(C.lv) * 0.4); } },
  { id: 'wuwei', loc: 'dg_field', title: '无畏狮子', when: () => F_('dizuDone') && !C.pets.wuwei, scene: async () => {
    await nar('边荒战场的尸堆里，站着一头金色的狮子，身上插着三杆断矛。它是异域那边的——可它的眼睛，一直往帝关这边看。');
    await say('异域的兵', '（远处有人喊）无畏狮子！你祖上从九天十地叛出来，现在又想叛回去？');
    await nar('狮子冲你扑了过来。你接住了它，把它按在地上，一道契约落在它额头上——主仆契约，一辈子挣不开的那种。');
    const c = await choose(['我不要坐骑。跟着我，当兄弟。', '（把它身上的断矛一根根拔掉）']);
    await nar(c === 0 ? '它愣住了。很久以后，它把脑袋放在了你的手心里。' : '你拔完最后一根，它舔了舔伤口，跟在了你身后。没有回头。');
    gainPet('wuwei'); } },
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
  { id: 'dashen', once: 1, title: '打神石开口了', when: P => P.area === 'baiduan' && C.sk.includes('dsh') && F_('cliff') && !C.pets.dashen, scene: async () => {
    await nar('你掏出那块灰石头，照着一头凶兽的脑门砸了过去。');
    await say('打神石', '（凶兽倒了。石头在地上滚了两圈，突然开口）……轻点！你砸了一路了，有没有问过我疼不疼？！');
    await me('……这能吃吗？');
    await say('打神石', '吃？！我是打神石！专砸神的！（它自己蹦回你手里）算了。你扔得还挺准，以后我跟你混。往哪儿砸，你指，我来。');
    gainPet('dashen'); } },
  { id: 'sanhei', once: 1, title: '寒潭里的老龟', when: P => P.area === 'butian' && F_('v3end') && !C.pets.sanhei, scene: async () => {
    await nar('补天阁后山的寒潭里，趴着一只老龟，背甲上长满了青苔。你扔了块石头下去——它把石头吞了，接着睡。');
    await nar('你跳下去，跟它在潭底打了一架。它是尊者境，可它太懒了，打到一半就缩进壳里不出来了。');
    await me('跟我走。你叫……（大红，二秃子……）三黑。');
    await say('三黑', '（它从壳里探出半个脑袋，看了你一眼，又看了看天）……认命了。'); gainPet('sanhei'); } },
  { id: 'dl_shard', when: P => P.area === 'diluo' && C.bar.length > 0, run: () => { const id = pick(C.bar); for (let i = 0; i < 4; i++) profUse(id); logLine(`一片时光碎片从长河里漂过来，碎片里是你自己——在很多年以前练${SKILLS[id].name}的样子。${SKILLS[id].icon}${SKILLS[id].name} 熟练度 +4。`, 'enc'); } },
  { id: 'yy_patrol', when: P => P.area === 'yiyu' && F_('yyEnd'), run: async () => { logLine('一队异域巡兵从城门那边走过来，看见你，愣了一下——然后硬着头皮冲了上来。', 'enc'); const lv = Math.max(60, C.lv - 1); await startBattle({ mobs: [['yytj', lv], ['yuzu9', lv]], title: '异域 · 巡兵', flee: true }); } },
);

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
    await say('石子陵', '……（他看了看你的脚，又看了看床）明天再接一截。'); },
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
  if (f.mengGourd === 1) L.push('孟天正那只酒葫芦，一直揣在你怀里。'); else if (f.mengGourd === 3) L.push('七王祠的供桌上，那只酒葫芦。');
  if (f.burnt === 1) L.push('枯柳崖上，你把被挖骨那一夜的恨烧掉了。');
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

/* ---------- 人物图鉴 (记录 → 人物): partners with where they came from, and the people you have met ---------- */
const PET_FROM = {
  maoqiu: ['旧村废墟', '大荒深处争夺山宝的那一夜之后，你在旧村的石缝里捡到了它。浑身是伤，一条腿断了，咬了你一口，然后赖着不走了。'],
  dahong: ['百断山', '朱雀真羽在它眼前一晃，它就认了你当老大。后来驮着你飞过好几回，嘴上从来不承认自己是坐骑。'],
  ertuzi: ['百断山 · 分宝崖下的蛋', '分宝崖石缝里滚出来的一颗蛋，你揣在怀里打了好多场仗，它才孵出来。一根毛都没有。'],
  dashen: ['百断山 · 分宝崖下', '本来只是一块用来砸人的石头。砸了一路以后，它开口骂人了。'],
  xiaobai: ['石村', '你六岁那年降服的独角兽，出村以后一直在村后的山坳里等你回来。'],
  sanhei: ['补天阁后山寒潭', '一只又懒又怂的尊者境老龟，打到一半缩进壳里不出来，最后认了命。'],
  wuwei: ['边荒战场', '异域那边的金色狮子，一直往帝关这边看。主仆契约绑住了它，你把它当兄弟。'],
  jinmao: ['九天 · 陨仙岭', '陨仙岭之主，一位仙王。它在你破仙王境时出过手；你在岭上把它按住了。'],
};
const PET_HINT = { maoqiu: '大荒深处，一场大乱以后', dahong: '百断山里，一只脾气很坏的鸟', ertuzi: '一颗没有窝的蛋', dashen: '你一直拿来砸人的那块石头……', xiaobai: '石村里，有谁一直在等你回来', sanhei: '补天阁后山，有个东西在睡觉', wuwei: '边荒的战场上', jinmao: '九天十地的禁区，一座全是仙骨的岭' };
const PEOPLE = [
  { k: '石村', L: [
    { n: '石云峰', t: '族长', i: '👴', ok: () => true, d: () => '石村的族长，把你从一个婴儿拉扯大。拐杖不离手，口头禅是“吃饱了再打”。' },
    { n: '柳神', t: '祭灵', i: '🌳', ok: () => true, d: () => '村口那棵被雷劈焦的柳树，只剩一根绿枝，却护了石村很多年。' + (F_('liushenBack') ? '后来它在界海里挡得太久，挡黑了；你把它接了回来。' : '') },
    { n: '石林虎', t: '林虎叔', i: '🏹', ok: () => true, d: () => '村里最好的猎人，带你第一次进山。' },
    { n: '大壮 · 二猛 · 皮猴', t: '村里的孩子', i: '👦', ok: () => true, d: () => '一起举石锁、一起偷兽奶长大的伙伴。' + (F_('army') ? '后来，他们带着石村八百兵，跟你上了九天。' : '') },
    { n: '石子陵 · 秦怡宁', t: '爹娘', i: '👪', ok: () => F_('parents'), d: () => '你被挖骨那年，他们被封进了不老山，关了十六年。你一层一层劈开山，把他们接了出来。' },
    { n: '秦昊', t: '弟弟', i: '🧒', ok: () => !!C.story.f.qinhao, d: () => '爹娘后来生的孩子，在不老山长大，身上带着一块仙骨。骄傲，嘴硬。' + ((C.story.f.qinhao || 0) >= 2 ? '没了那块骨头以后，他第一次自己举起了石锁，叫了你一声“哥”。' : '') } ] },
  { k: '一路上的人', L: [
    { n: '清风', t: '同行的小姑娘', i: '👧', ok: () => F_('qingfeng'), d: () => '和你一起出村去补天阁的小姑娘，后来自己考进了内门。' },
    { n: '诡爷', t: '补天阁', i: '🧓', ok: () => F_('joined'), d: () => '补天阁里说话最少的老人，第一句话是“……吵。”锈剑是他指给你的。' },
    { n: '小塔', t: '四层的塔', i: '🗼', ok: () => C.sk.includes('ta'), d: () => '只有四层、不知道从哪来的小塔。危急的时候，它会垂下一层光幕。' },
    { n: '九头狮子', t: '百断山的霸主', i: '🦁', ok: () => F_('lion'), d: () => '想收你当战仆，结果被你打服了，从此当了你的小弟。雨族追杀的时候，它没跑。' },
    { n: '火灵儿', t: '火国公主', i: '👘', ok: () => F_('cave'), d: () => '百断山神窟里认识的红衣服姑娘，爱争功，你欠她一辈子烤肉。' + (F_('huoling') ? '很久以后，你从异域的封印里把她背了回来。' : '') + (F_('shihaiDone') ? '她醒了。' : '') },
    { n: '云曦', t: '白衣少女', i: '🌙', ok: () => F_('spring'), d: () => '灵湖阵里你回头拉了她一把，她在不老泉边还了这个人情。' + ((C.story.f.yunxiQ || 0) >= 2 ? '后来，她替你守着那口泉。' : '') },
    { n: '石毅', t: '重瞳者', i: '👁️', ok: () => F_('sawShiyi'), d: () => '从你身上挖走的那块至尊骨，长在了他身上。他没选过，也没还过。' + (F_('xgNing') ? '血湖边，你们第一次站在一起。' : '') + ((C.story.f.shiyiQ || 0) >= 2 ? '他说：我的血，你拿去用。' : '') },
    { n: '火皇', t: '火国之主', i: '👑', ok: () => F_('huohuang'), d: () => '火灵儿的父亲，告诉你你娘在涅槃池边跪了三天三夜。' },
    { n: '齐道临', t: '至尊道场', i: '🧔', ok: () => F_('qidao'), d: () => '拿一朵渡劫神莲把你骗进至尊道场的师父。道场“在装修”。教你的无敌道只有一条规矩：往前，不回头。' },
    { n: '孟天正', t: '补天道 · 守关人', i: '🗡️', ok: () => F_('v7end'), d: () => '背着旧剑的老人，带你去了帝关。帝关的饭难吃，管够。' + (F_('anlan') ? '安澜来的那天，他斩断了自己的成仙路。' : '') },
    { n: '小七', t: '七王之后', i: '🕯️', ok: () => F_('qiwangDone'), d: () => '额头上烙着“罪”字的孩子，七王祠的守灯人。替你收着那只烂木盒子。' },
    { n: '三藏 · 神冥', t: '一起跳海瀑的人', i: '🧘', ok: () => F_('yyEnd'), d: () => '黑水天牢里关了很多年的两个人，商量了五十年没敢跳。你抓着鱼尾巴，他们抓着你的脚。' },
    { n: '蛄祖', t: '异域 · 天牢深处', i: '🕯️', ok: () => F_('daoze'), d: () => '活得很久很久的老东西，替你补全了道则。它见过帝关还是木头城墙的时候。' } ] },
  { k: '对手', L: [
    { n: '帝冲', t: '仙古最狂的天骄', i: '⚔️', ok: () => F_('dichong'), d: () => '化身见过你，就以为知道你所有的招。' },
    { n: '宁川', t: '六冠王', i: '🩸', ok: () => F_('v6end'), d: () => '十凶麒麟血，看你的眼神和上界那些人一样。' },
    { n: '王长生', t: '王家家主', i: '🏯', ok: () => F_('envoy'), d: () => '为了一家人进仙域，亲手杀了六个儿子。' + (C.story.f.wangEnd ? '账，算完了。' : '') },
    { n: '金太君', t: '金家老太君', i: '🦯', ok: () => F_('yiyu0'), d: () => '说“用一个罪血换五百年太平，划算”的那个人。' },
    { n: '安澜', t: '不朽之王', i: '🌑', ok: () => F_('anlan'), d: () => '他走一步，边荒的沙就退一里。' },
    { n: '鲲帝', t: '异域第一', i: '🐋', ok: () => F_('kundiWar'), d: () => '异域真正的主人。' },
    { n: '尸骸仙帝', t: '黑暗的源头', i: '⚱️', ok: () => F_('xiandi'), d: () => '它杀过你一次。' } ] },
];
function pChars() { const pets = Object.keys(PETS), have = pets.filter(k => C.pets[k]);
  let h = `<div class="card"><div class="row"><div>伙伴 <b>${have.length}</b> / ${pets.length}</div><span class="sp"></span><div class="dim" style="font-size:.8rem">认识的人 ${PEOPLE.reduce((s, g) => s + g.L.filter(p => p.ok()).length, 0)} / ${PEOPLE.reduce((s, g) => s + g.L.length, 0)}</div></div></div>`;
  h += `<div class="chap">伙伴</div><div class="list">${pets.map(k => { const P = PETS[k], p = C.pets[k], fr = PET_FROM[k];
    if (!p) return `<div class="li unk"><span class="ic">？</span><div class="t">？？？<small>${PET_HINT[k] || '还没遇见'}</small></div></div>`;
    const st = p.evo3 ? '真身' : p.evo2 ? '返祖' : p.evo ? '觉醒' : '';
    return `<div class="li"><span class="ic">${P.icon}</span><div class="t"><b>${P.name}</b> <span class="pill">${P.race}</span><span class="pill gold">${P.role}</span>${st ? `<span class="pill gold">${st}</span>` : ''}<span class="pill">${petLv(k)} 级 · 亲近 ${p.aff}</span>
      <small>${P.desc}</small>${fr ? `<small><b>来历 · ${fr[0]}</b>：${fr[1]}</small>` : ''}</div></div>`; }).join('')}</div>`;
  for (const g of PEOPLE) h += `<div class="chap">${g.k}</div><div class="list">${g.L.map(p => p.ok() ? `<div class="li"><span class="ic">${p.i}</span><div class="t"><b>${p.n}</b> <span class="pill">${p.t}</span><small>${p.d()}</small></div></div>` : `<div class="li unk"><span class="ic">？</span><div class="t">？？？<small>还没遇见</small></div></div>`).join('')}</div>`;
  return h; }

/* ---------- 生死之间: dying is not a cut — two deaths get a stretch you play through ----------
   七神 (第九章): you sink into a slow black river of lanterns; swim back against it (连点), then gather the pieces of yourself
   (翻牌). Doing both well makes the 轮回 fight that follows a little easier.
   界海深处 (第三十三章): the dark eats you from the edges; answer the voices of the people who remember you (one by one, from
   what you did along the way), then put out the dark marks on your 元神 (破阵) before 他化自在 brings you back. */
async function dieBack7() {
  await cine('你在往下沉。<br>下面是一条很宽、很慢的黑河。<br>河面上漂着很多盏灯，每一盏灯里，都坐着一个孩子。', 'mem');
  await nar('你认出了其中几个——不认识，可他们的样子你认得：跟你一样，下界的孩子，被神“收”走的那些。一代一代，漂了很多年。');
  await say('灯里的孩子', '（离你最近的那盏灯里，一个梳着冲天辫的小孩冲你招手）新来的？别怕，往下漂就不疼了。下面很安静，没有神。');
  const c = await choose(['（问他）你们……在这里漂了多久？', '（看着自己的手，它在一点点变淡）', '（不说话，回头往上看）']);
  if (c === 0) await say('灯里的孩子', '不知道。（他想了想）我来的时候，下界还没有石国。');
  else if (c === 1) await nar('你的手指已经淡得能看见后面的灯了。你握了握拳——还能握。');
  else await nar('上面很远很远的地方，有一点光。光里有人在喊，喊的是你的名字，喊得嗓子都破了。');
  await nar('你想起来了：龙椅才坐了七天。石村的兽奶还没喝够。答应火灵儿的烤肉，还欠着。');
  await me('……我还没吃饱。');
  await say('灯里的孩子', '（他愣了一下，然后笑了，笑得很大声）那你回去吧！替我们也吃一口！');
  const sw = await miniGame('mash', { title: '逆流', desc: '黑河往下流。你往上游——别让它把你带走！', time: 7500, rate: 7 });
  await nar(sw.ok ? '你一下一下地往上划。河水推你，灯里的孩子们在后面推你。' : '河水把你冲下去三次。第四次，好几盏灯一起撞在你背上——是灯里的孩子，在推你。');
  await nar('你游到了河的源头。那里散落着很多碎片——都是你。被神火烧碎的，你自己。');
  const mm = await miniGame('memory', { title: '拼回自己', desc: '碎掉的你，一片一片拼回来。上面说的是哪一片，就点哪一个。', hint: '看上面写的是哪一片，<b>点下面对应的那一个</b>。点错几次也没关系。', pairs: [['🪨', '族长逼你举了一年的石锁'], ['🥛', '全村人一口一口喂大你的兽奶'], ['🌿', '雷劈过的柳树上，那根柳枝'], ['🐒', '毛球'], ['🔥', '大红掉下来的火羽'], ['🗡️', '诡爷给的锈剑'], ['🗼', '小塔'], ['🌊', '你烧了三天的涅槃池']], miss: 5 });
  if (sw.ok && mm.ok) { F().dieBack = 1; await nar('每一片都对上了。你从来没有这么清楚地知道，自己是由什么拼起来的。'); }
  else await nar(mm.ok ? '碎片拼回来了。有几道裂缝，可你不在乎——裂缝里，能透进光来。' : '有几片怎么也找不着了。你没再找——缺了几块，也还是你。');
}
async function dieBackSea() {
  await cine('黑暗从你的边缘开始吃。<br>先是手指，然后是脚，然后是名字的最后一个字。<br>你快要什么都不是了。', 'mem');
  const f = C.story.f, V = [['willow', '……昊儿。', '柳神的枝条，在很远很远的地方响。'], ['chief', '吃饱了再打！', '族长的拐杖，在石村的石头上敲了三下。']];
  if (f.huoling) V.push(['huolinger', '……你答应过请我吃烤肉的。', '天庭最高的那间屋子里，一个睡了很多年的人，嘴唇动了一下。']);
  if (f.qiwangDone) V.push(['qiwanghou', '我们守城，从来不回头看。', '帝关的城头上，一个白胡子老人把七王祠的灯，又添了一次油。']);
  if ((f.shiyiQ || 0) >= 2) V.push(['石毅', '……我欠的，还了。', '一盏灯灭了。灭之前，它亮得像一块骨头。']);
  if ((f.qinhao || 0) >= 2) V.push(['秦昊', '哥——！', '界海里有一个很轻的人，在喊。']);
  if (f.army) V.push(['dazhuang', '小不点——！', '石村村口，一代一代的孩子，一起在喊。']);
  await nar('你听见有人在喊你。不止一个人。');
  const heard = [];
  for (let k = 0; k < 3 && V.length; k++) { const c = await choose(V.map(v => `（回应：${v[1]}）`), '黑暗里，好几个声音同时在喊你——先回应哪一个？'); const [who, t, line] = V.splice(c, 1)[0];
    await say(who, t); await nar(line); heard.push(who); }
  await nar('每回应一个声音，你身上就有一块地方，从黑里亮了回来。可你的元神上，还爬满了黑色的纹。');
  const lt = await miniGame('lights', { title: '元神', desc: '把元神上的黑纹一道一道按灭。按错了，它会长回来。', presses: 6 });
  await nar(lt.ok ? '最后一道黑纹灭了。你的元神干干净净，像刚从石村的河里捞出来。' : '还剩几道黑纹没按灭。你不管了——记得你的人太多，黑吃不完。');
  F().dieBackSea = heard.length; }

/* ---------- 转折不能一笔带过: the turning points that used to pass in a line or two ---------- */
// 第七章 · 天空战场之后: the 尊者 fall on you while you can barely stand; then the two bones' essence settles in your chest
async function tzShiyi() {
  const h = await holdOut({ mobs: [['qingluan', slv(30, 1, 3)], ['mozhu', slv(30, 1, 3)]], title: '天空战场 · 尊者围杀', noPet: true, epic: { name: '尊者', sub: '他们看你，像看一块刚长成的宝骨', seal: '围杀', intro: ['你已经站不太稳了。'], phase: '尊者的手已经伸到了你胸口——' } }, 2);
  await nar(h.survived ? '你咬着牙撑了两个回合。第三个回合，你的膝盖一软——' : '你只撑了一下，膝盖就软了——');
  F().held2 = h.survived ? 1 : 0; }
async function tzBone() {
  await nar('魔女走了。你一个人坐在那块石头上，胸口烫得像揣了一块炭。');
  await nar('打的时候，石毅身上那块骨头一次次撞在你的骨头上。每撞一次，就有一点东西从那边流过来——那块骨头在他身上长了十三年，长出来的那一点精华，认得你。');
  const r = await miniGame('lights', { title: '骨文归位', desc: '胸口的骨文乱成一团。一道一道按灭乱窜的光，让它们回到该在的地方。', presses: 5 });
  await nar(r.ok ? '最后一道骨文落了下去。你听见胸口“咔”的一声，像一扇关了很多年的门，合上了。' : '骨文还在乱窜，可它们慢慢地自己找到了位置。你坐了一整夜，等它们安静下来。');
  const c = await choose(['（摸摸胸口）……回来了。', '（想起石毅最后那个笑）……他也不好受吧。']);
  if (c === 1) { F().boneThink = 1; await nar('你望着重瞳女带走他的方向，很久没有动。'); } }
// 第十五章 · 枯柳崖: burning the 至尊 blood is a choice of what to burn, and a fire you have to sit through
async function tzKuliu() {
  await nar('至尊血一烧，就回不来了。你知道烧掉的不只是血。');
  const c = await choose(['（把被挖骨那一夜的恨，一起烧掉）', '（把“至尊骨”这三个字的骄傲，一起烧掉）', '（把怕——怕再被人挖一次——一起烧掉）'], '要烧掉的旧东西里，你先扔进火里的是——');
  F().burnt = c + 1;
  await nar(['那一夜的疼，那一夜的冷，那把挖你骨头的刀——都扔进去了。火一下子窜得老高。', '“至尊骨”。这三个字你听了一辈子：被夸，被抢，被挖，被羡慕。你把它扔进了火里。火烧得很安静。', '你一直没跟人说过：你怕。你把这个“怕”字扔进了火里。火烧得噼啪响，像在笑你。'][c]);
  const r = await miniGame('lift', { title: '烧血', desc: '血在烧。火最旺的那一下，稳住呼吸，别让它把你烧散。', rounds: 3, need: 2 });
  await nar(r.ok ? '三次火头，你三次都稳住了。' : '你被火冲散了一回，又自己一点一点地把自己拢了回来。'); }
// 第二十三章 · 安澜之后: before you run, you find what is left of 孟天正
async function tzMeng() {
  await nar('你从城墙下面爬起来，爬到了孟天正站过的地方。城头上什么都没有了——只有一只酒葫芦，滚在墙根下，里面还剩一口酒。');
  const c = await choose(['（把酒葫芦揣进怀里）', '（把那口酒喝了，把葫芦立在城头上）', '（把葫芦交给小七）']);
  F().mengGourd = c + 1;
  await nar(['你把葫芦揣进怀里，跟那只烂木盒子放在一起。它还是温的。', '酒很烈，烈得你眼泪直流。你把空葫芦立在城头最高的那块砖上，口朝着边荒。', '小七接过葫芦，抱在怀里，一句话都没说。后来，七王祠的供桌上，多了一只酒葫芦。'][c]); }
// 第二十四章 · 重回至尊: years of training are three things you do, not one line
async function tzTrain2() {
  await nar('第三年。你站在村前空地上，等雷。大壮的儿子坐在石头上看着你，嘴里嚼着草：“小不点叔，雷又不听你的。”');
  const r = await miniGame('thunder', { title: '再引一次雷', desc: '像在补天阁的时候一样。圈收到指尖那一刻，伸手。', strikes: 5, need: 3 });
  await nar(r.ok ? '第三道雷落下来的时候，钻进了你的手心。大壮的儿子嘴里的草掉了。' : '雷劈了你七回。第八回，它终于顺着你的手指钻了进去。大壮的儿子在旁边数着，数到最后，不笑了。');
  await nar('第五年。你娘每天中午送一碗饭到柳神的树桩旁边。你坐在那里，一坐就是一天。');
  await say('你娘', '（她把碗放下，没走，坐在你旁边）……你小时候，坐不住一盏茶。');
  const r2 = await miniGame('lights', { title: '打通经脉', desc: '帝关那一战断掉的经脉，一条一条接回去。', presses: 5 });
  await nar(r2.ok ? '最后一条经脉接上的时候，你听见那截树桩里，有东西轻轻动了一下。' : '有几条经脉怎么也接不上。你不急了——柳神也是一点一点长回来的。'); }
// 第二十七章 · 造化之门: the light takes you apart nine times; three times it asks what you want to keep
async function tzZaohua() {
  await nar('门里没有路，只有光。光把你拆开的时候，问了你三次同一个问题：<b>拼回去的时候，要留下什么？</b>');
  const keep = [];
  for (const opts of [['石村的名字', '至尊骨的骄傲'], ['胸口那道疤', '一身干干净净的皮肉'], ['所有的疼', '所有的人']]) { const c = await choose(opts.map(o => `（留下：${o}）`), '光在等你回答。'); keep.push(opts[c]); }
  F().zaohuaKeep = keep.join('、');
  await nar(`你留下了：${keep.join('、')}。别的，都还给了光。`);
  const r = await miniGame('lights', { title: '九拆九拼', desc: '光把你拆开了。照着留下的东西，一块一块拼回去。', presses: 6 });
  await nar(r.ok ? '第九次拼回去的时候，你比进门之前，轻了很多。' : '拼到第七次的时候你差点散了。是你留下的那些东西，把你拽了回来。'); }
// 第三十一章 · 准仙帝: the breakthrough is a 劫 you take, while 柳神's branches break one by one
async function tzZhun() {
  await nar('刀王倒下的时候，黑柳挡在你身前的最后一根枝条，也断了。');
  await say('willow', '（柳神的声音很轻）……昊儿。往上走。我在下面接着你。');
  await nar('天上开了一道口子。不是敌人——是劫。准仙帝的劫。');
  const r = await miniGame('thunder', { title: '仙劫', desc: '劫雷一道比一道快。接住它们——让它们把你的骨头再锻一遍。', strikes: 6, need: 4 });
  await nar(r.ok ? '六道劫雷，你接住了五道。最后一道落在你头顶，你没躲——它进了你的骨头，成了你的一部分。' : '劫雷劈得你单膝跪地。你撑着地站起来，一道一道地，把剩下的都接住了。');
  await cine('你骨头里那根柳枝，长成了一棵树。<br><b>准仙帝。</b>'); }
// 第三十一章 · 原始古器: you don't just get pulled back — you tear yourself out of the black matter first
async function tzKundi() {
  await nar('黑色的物质顺着你的伤口往里钻，像界海的水往骨头缝里灌。你的手开始不听使唤了。');
  const r = await miniGame('mash', { title: '挣脱', desc: '黑色的东西在把你往原始古器里拽。挣出来！', time: 7000, rate: 7 });
  await nar(r.ok ? '你硬生生地把自己从那团黑里扯了出来，扯掉了一层皮。' : '你挣了三次，都没挣开。第四次，有好几只手从你身后伸了过来——'); }

/* ---------- 承上启下: a few lines that carry you from the last scene into the next, when the place changes ----------
   Played once, at the start of the step's scene (after the chapter card when the scene opens with one). */
const BRIDGE = {
  q_gate: ['出山古道走了七天。清风把补天石揣在你的包袱里，说这样最安全。', '你每天晚上都要摸一遍包袱，确认那块石头还在——再摸一遍兽奶罐子，确认它也还在。'],
  q_bdgate: ['萧天一路上都在讲百断山的规矩：进去的人，一半出不来；出来的人，一半不敢再进去。', '你问他：“里面的凶兽能吃吗？”他想了想，没回答。'],
  q_end: ['百断山的门在你身后合上的时候，你回头看了一眼。那片山里，有一棵仙桃树，你抱走了。', '回石村的路，比来的时候短。大概是因为你一路都在跑。'],
  q_sgarrive: ['柳神说，石国皇都有你的另一个“家”。你不太懂这句话。', '往北走了十几天，地上的路越来越宽，路边的房子越来越高。毛球蹲在你肩上，看什么都想伸手。'],
  q_v3: ['雷霆留下的消息，你在侯府的灯底下看了一整夜：一个女人，抱着一个昏迷的孩子，去过火国。', '天亮的时候，你已经出了皇都的东门。钟伯追到城门口，往你怀里塞了一包干粮。'],
  q_shiyi2: ['七天。你在火国吃了七天的烤肉，睡了七天的好觉。火灵儿问你怕不怕，你说：“饿着肚子才怕。”', '第七天早上，你回了皇都。天空战场浮在侯府北边的云上，像一块很大很平的石头。'],
  q_dajie: ['你在魔女放下你的那块石头上，睡了一天一夜。醒来的时候，胸口那块骨头安安静静的，像从来没离开过。', '你回皇都的那天，城门口的守卫看你的眼神不对——像在看一个不该回来的人。'],
  q_v3end: ['爹娘在石村住下了。你娘第一天就把族长家的灶台霸占了，族长在门口站了半天，没敢进去。', '钟伯托人捎来一句话：侯府里，有一卷老太爷留下的东西，等你回去看。'],
  q_bzcamp: ['血祭台往西，天一点一点地变黄。风里有沙子，沙子里有骨头。', '这里是下界的边陲。再往外，就没有路了——只有往上的路。'],
  q_huobye: ['登天路就在眼前。你站在路口，往回看了一眼。', '然后你转身，绕了很远很远的路——去了一趟火国。'],
  q_dengtian: ['从火国回来，你怀里多了一根火红的羽毛。你把它和那块烤肉放在一起。', '登天路的台阶上，站着一个守关的影子。它看了你很久，往旁边让了一步。'],
  q_tianren: ['天仙书院的事传得很快。你走到哪儿，都有人小声说：“就是他，踢翻灯的那个。”', '齐道临走在你旁边，背挺得很直，好像踢翻灯的是他。'],
  q_v5end: ['古台的事，三千州都知道了。有人说你疯了，有人说你是真的“荒”。', '齐道临把你叫回天仙城的时候，手里拿着一张皱巴巴的帖子，笑得胡子都在抖。'],
  q_sqtown: ['穿过无人区，再往北走，地上的草开始有颜色了。远处有一座城，城里的人走路都抬着头——三千州的争霸城。'],
  q_arena: ['银磨山的血，你在河边洗了三遍才洗干净。', '石毅的话还在你耳朵里转。你没回头去找他。你知道，台上会见的。'],
  q_v7: ['争霸台的事结束以后，你在台上坐了一夜。孤剑云没走，抱着剑，坐在台下。', '天亮的时候，北边那座石门，开了。'],
  q_dichong: ['仙古古殿的泉水还在你骨头里流。你走路的时候，能听见自己的骨头在响，像在说话。', '古殿东边有一座峰，峰顶上刻着一个字。离得很远，你就看见了。'],
  q_v8: ['孟天正走在前面，背着那把很旧的剑，一句话也不说。你跟在后面，数他的脚印。', '走出仙古的那一刻，风变了——变冷了，变硬了，带着铁锈的味道。'],
  q_box: ['边荒古阵的七色阵纹，在你身后一道一道地熄了。', '你听见边荒深处有人在追什么东西。不是追你——是在追一件很老的东西。'],
  q_yyfalls: ['悟道茶的味道还在你舌头上：苦，然后甜。', '蛄祖最后跟你说的那句话，你记了一路：“想出去，就往下跳。”'],
  q_yuanshi: ['三藏在沙滩上念了一整夜的经，神冥哭了一整夜。天亮的时候，你们三个都饿了。', '远处那座白色的城，在晨光里亮得刺眼。'],
  q_back: ['原始帝城的白城墙在你身后越来越小。城门上那七个名字，你一个一个地记住了。', '你一路往东。帝关在那边。小七在那边。'],
  q_envoy: ['你在柳神的树桩旁边躺了很多天。你娘每天端一碗汤过来，看着你喝完才走。', '那三块留影晶石，你一直攥在手里。攥到它们都被你的手捂热了。'],
  q_train: ['天门下面的事，你谁也没说。你回了下界，回到了村口。', '大壮已经是个胡子拉碴的大人了。他看见你，愣了一下，然后笑了：“小不点，你怎么又是一身伤？”'],
  q_purge: ['八百个人走登天路，走了很久。没有人喊累。走到最上面，二猛回头看了一眼，小声说：“……咱们村，真小啊。”'],
  q_v9end: ['九天之巅的裂缝合上以后，你在上面站了很久。九天十地的灯，一盏一盏地亮了。', '然后你回了家。族长还坐在柳神的树桩旁边晒太阳，好像你只是出去玩了一个下午。'],
  q_canxian: ['九天太平了一阵子。可你总觉得，九天底下，有东西在喘气。', '九天之巅往西，有一座墓。墓里的呼吸声，你在山顶上都听得见。'],
  q_tianting: ['残仙墓塌下去的时候，九天的灵气第一次往上飘。', '你在天门东边那片空地上，站了一整天。你在想，要立一个什么样的地方。'],
  q_dam: ['天庭的柱子立起来了。你每天都去摸一下，像小时候每天去摸柳神的树桩。', '有人从仙域带来一句话：界海之滨往西，有一道很长很长的坝。'],
  q_xwhy: ['堤坝上那个老人的话，你想了好几天：“你会去的。迟早。”', '在那之前，仙域古城里，有一群人在等你。'],
  q_v13: ['造化之门在你身后合上了。门里留下了一些东西，你没回头去看。', '门的北边，有一条看不见源头的河。河水往回流。'],
  q_lives: ['帝落古兵说的那个传说，一直在你耳边：“一个从下面爬上来的孩子。”', '长河东边，水开始打转。转着转着，河里出现了很多个你。'],
  q_v14: ['你从长河里回来，过了很久很久。你先回了一趟石村，在村口的石头前站了一会儿。', '然后，三藏带回来一个消息。你听完，一句话没说，往西走。'],
  q_liushen2: ['火灵儿睡在天庭最高的那间屋子里。你每天去看她，跟她说一会儿话。', '有一天，你站在堤坝上，往界海里看。很远很远的地方，有一棵树，枝条垂进海里。'],
  q_chiwang: ['黑色的柳枝缠在你的手腕上，凉凉的，像小时候它点在你额头上的那一下。', '赤王在异域城门等你。那座城门，你被吊过。'],
  q_xianwar: ['你被仙王们接回仙域的时候，身上的黑还在往骨头里钻。柳神用枝条一点一点地往外拔。', '还没拔干净，界海和异域的巨头，就打到了仙域古城下。'],
  q_kundi2: ['仙域城下的血，三天三夜才干。', '鲲帝逃回了异域。你包好最后一道伤口，站了起来。'],
  q_shihai: ['最后一个黑暗之帝沉进海底的时候，界海安静了一下。', '只有一下。界海深处，有一样东西，睁开了眼睛。'],
};
function bridgeWrap(q) { const L = BRIDGE[q.id], card = q.scene && /chapterCard\(/.test(q.scene.toString());
  if (!L || C.story.f['bd_' + q.id]) return q.scene;
  const fn = async () => { if (card) STATE.bridgeQ = q.id; else await playBridge(q.id); return q.scene(); }; return fn; }
async function playBridge(id) { const L = BRIDGE[id || STATE.bridgeQ]; const k = id || STATE.bridgeQ; STATE.bridgeQ = null; if (!L || C.story.f['bd_' + k]) return; C.story.f['bd_' + k] = 1; for (const t of L) await nar(t); }
