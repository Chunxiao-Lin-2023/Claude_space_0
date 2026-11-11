/* ================= the wild: events while exploring (some open as your realm grows, some only at night),
   and the 骨文 memory game used when 石昊 reads a 宝术 off its runes ================= */
const WILD = [
  { id: 'yy_stone', once: 1, title: '城门下的饼', when: P => P.area === 'yiyu' && C.story.q >= qi('q_yyarena') && C.story.q < qi('q_yyfalls'), scene: async () => {
    await nar('夜里，一个异域的小孩偷偷溜到城门下，往上扔了一块饼。饼砸在你的额头上，掉了下去。');
    await nar('他又扔了一块。这回你张嘴接住了。');
    await say('异域小孩', '（他小声说）我娘说你是坏人。……可坏人为什么不哭？');
    const c = await choose(['因为哭了，饼就掉了。', '……谢谢你的饼。']);
    if (c === 0) await nar('小孩“噗”地笑了，捂着嘴跑了。');
    else await nar('小孩愣了一下，跑远了。第二天夜里，他又来了。');
    gainExp(BAL.expNext(C.lv) * 0.1); } },
  { id: 'dl_lamp', once: 1, title: '长河里的灯', when: P => P.area === 'diluo', scene: async () => {
    await nar('时光长河里漂过来一盏灯。灯里有一个小小的村子，村口有一群孩子在举石锁。其中最小的那个，举不动，在哭。');
    await nar('你伸手想去摸那盏灯。灯从你指缝里漂走了。');
    await me('……别哭。以后会举起来的。');
    gainExp(BAL.expNext(C.lv) * 0.1); give('baoyao', 2); } },
  { id: 'jh_leaf', once: 1, title: '一片叶子', when: P => P.area === 'jiehai' && C.story.q >= qi('q_kundi2'), scene: async () => {
    await nar('界海上漂过来一片很小的枯叶——一个死掉的世界。叶子上，还有一棵很小很小的树，树上，还有一点绿。');
    const c = await choose(['（把它推回岸边）', '（把它捧起来，带回天庭）']);
    if (c === 1) { await nar('你把它捧回了天庭，放在那根柱子下面。第二天，那一点绿，长大了一点。'); F().leaf = 1; }
    else await nar('你把它推回了岸边。它在岸边停住了，没有再往黑里漂。');
    gainExp(BAL.expNext(C.lv) * 0.1); give('baoyao', 2); } },
  { id: 'sq_qilin', once: 1, title: '八珍麒', when: P => P.area === 'sanqian' && C.story.q >= qi('q_arena'), scene: async () => {
    await nar('一头小小的麒麟从草丛里钻出来，浑身的毛是八种颜色。它蹭了蹭你的腿，然后叼走了你手里的干饼。');
    await me('……喂！');
    await nar('它跑出去几步，又回头看了看你，把干饼放在地上，用鼻子推回来一半。');
    const c = await choose(['（接过那一半）', '（把另一半也推给它）']);
    if (c === 1) { await nar('它愣了一下，然后高高兴兴地吃了。吃完，它在你脚边放下一株八种颜色的灵草，跑掉了。'); give('baoyao', 2); }
    else { await nar('你们一人一半，坐在草丛里吃完了那块硬得能砸死人的干饼。'); give('lingyao', 3); } } },
  { id: 'xg_mural', once: 1, title: '最后一幅画', when: P => P.area === 'xiangu' && C.story.q >= qi('q_xgdian'), scene: async () => {
    await nar('遗迹的一面断墙上，画着一个仙古纪元的孩子。他手里拿着一块骨头，冲着画外面笑。');
    await nar('画的旁边刻着一行小字。你认不全，只认出了几个：“……留给……下一个纪元……的孩子……”');
    await me('……那就是我们。');
    await nar('你在那面墙前面站了一会儿，把手按在了画上。墙是热的。'); gainExp(BAL.expNext(C.lv) * 0.12); } },
  { id: 'dg_letter', once: 1, title: '没寄出去的信', when: P => P.area === 'diguan' && C.story.q >= qi('q_bianhuang') && C.story.q < qi('q_betray'), scene: async () => {
    await nar('城头的一块砖缝里，塞着一封信。信封上写着：“给娘”。没有寄出去。');
    await nar('你认得那个字迹——是那个说打完这一仗就回家成亲的少年。');
    const c = await choose(['（收好，等太平了替他寄回去）', '（放回砖缝里）']);
    if (c === 0) { await nar('你把信小心地折好，放进了怀里，和那只烂木盒子放在一起。'); F().letter = 1; }
    else await nar('你把信放回了砖缝里。帝关的砖，会替他记着。');
    gainExp(BAL.expNext(C.lv) * 0.1); } },
  { id: 'jt_light', once: 1, title: '九天的灯', when: P => P.area === 'jiutian' && isNight() && C.story.q >= qi('q_peace'), scene: async () => {
    await nar('夜里，你站在天门上往下看。九天的灯一盏一盏地亮着，十地的灯也一盏一盏地亮着。再往下，很远很远的地方，有一盏很小的灯——石村。');
    await me('……孟老，你看。都还在。');
    await nar('风从帝关那边吹过来。你好像听见有人在笑。'); gainExp(BAL.expNext(C.lv) * 0.1); give('baoyao'); } },
  { id: 'bz_fire', once: 1, title: '别人的火堆', when: P => P.area === 'baizu' && C.story.q >= qi('q_bzcore') && isNight(), scene: async () => {
    await nar('夜里，你路过一堆金乌族的篝火。火边坐着一个金乌族的少年，是白天被你打败的那三个之一。他看见你，愣了一下。');
    await say('金乌族少年', '……坐吧。（他往旁边挪了挪）就这一回。');
    const c = await choose(['（坐下）', '（摆摆手走了）']);
    if (c === 0) { await nar('你们谁也没说话，就那么烤着火。过了很久，他递过来一块烤得金黄的肉：“金乌族的烤法。尝尝。”'); await me('……比我烤的好吃。'); await say('金乌族少年', '（他笑了，第一次笑）那是当然。'); give('meat', 3); F().jinwuFire = 1; }
    else await nar('你走出去很远，回头看了一眼。那堆金色的火，还在亮着。'); } },
  { id: 'bz_name', once: 1, title: '崖上的名字', when: P => P.id === 'bz_yun' && C.story.q >= qi('q_huobye'), scene: async () => {
    await nar('云族的崖壁上，刻满了名字。那是从飞升祭坛的锁链上抄下来的——每一个“飞升”上去的人。');
    await nar('你一个一个地看过去。在很靠下的地方，有一个名字旁边，被人用刀刻了一个小小的记号——一条瘸腿。');
    await me('……是老兵的兄弟。');
    await nar('你在那个名字旁边站了一会儿，从怀里掏出一块肉干，放在了崖下。'); gainExp(BAL.expNext(C.lv) * 0.1); give('lingyao', 2); } },
  { id: 'sj_star', once: 1, title: '摘星星', when: P => P.area === 'shangjie' && isNight() && C.story.q >= qi('q_ladder'), scene: async () => {
    await nar('上界的夜里，星星离得很近。你躺在一块石头上，伸手往天上够了够。');
    await nar('一颗很小的星星，真的落进了你的手心。凉凉的，一闪一闪。');
    const c = await choose(['（揣进怀里，带回去给云族的小娃娃）', '（放它回去）']);
    if (c === 0) { await nar('你把它揣进怀里。它在你怀里亮了一夜，像揣了一盏小灯。'); F().star = 1; give('baoyao'); }
    else await nar('你松开手。它慢慢地飘了回去，在天上冲你闪了两下。'); } },
  { id: 'sj_qi', once: 1, title: '师父的酒', when: P => P.area === 'shangjie' && C.story.q >= qi('q_tianren') && !isNight(), scene: async () => {
    await nar('齐道临蹲在路边，面前摆着一个破酒壶。他看见你，招了招手。');
    await say('qidaolin', '徒弟，来，陪为师喝一口。今天是为师的师父的忌日。');
    await say('qidaolin', '为师的师父……也是个骗子。当年就是他，在天仙书院门口把为师骗走的。（他笑了）你说巧不巧。');
    await nar('他把酒壶递给你。酒很辣，你呛得直咳嗽。他在旁边笑得前仰后合。');
    gainExp(BAL.expNext(C.lv) * 0.12); } },
  { id: 'sg_candy', once: 1, title: '糖葫芦', when: P => P.area === 'shiguo' && C.story.q >= qi('q_yuwang') && !isNight(), scene: async () => {
    await nar('一个扎着冲天辫的小娃娃拽住了你的衣角，仰着脸看你。他手里攥着一串糖葫芦，糖衣都化了。');
    await say('小娃娃', '大哥哥，你就是那个吃法旨的人吗？……法旨好吃，还是糖葫芦好吃？');
    const c = await choose(['糖葫芦。', '法旨。脆。']);
    if (c === 0) { await say('小娃娃', '我就知道！（他把糖葫芦塞进你手里）给你！我娘说，好东西要分给好人。'); give('meat'); }
    else await say('小娃娃', '……（他看了看手里的糖葫芦，又看了看你，把糖葫芦往身后藏了藏）那、那这个你别吃。');
    await nar('他跑远了。跑到街角，又回头冲你挥了挥手。'); give('lingyao'); } },
  { id: 'sg_ghost', once: 1, title: '城墙下的阴兵', when: P => P.id === 'sg_wild' && isNight() && C.story.q >= qi('q_wuwang'), scene: async () => {
    await nar('夜里的城墙下，一队阴兵排成一列，慢慢地走。它们的甲片里没有身子，只有一团冷风。');
    await nar('走在最后面的那个，停了下来，转过头来“看”你。它手里那杆锈枪上，刻着一个字——“石”。');
    await me('……你也是石家的人？');
    await nar('阴兵没有回答。它冲你点了点头，把锈枪插在你脚边，跟上了队伍。枪杆一碰到地，就化成了一堆带着骨文的碎骨。');
    give('bone', 4); F().sgGhost = 1; } },
  { id: 'hg_egg', once: 1, title: '火山口的鸟蛋', when: P => P.area === 'huoguo' && C.story.q >= qi('q_niepan'), scene: async () => {
    await nar('火山口边上的石缝里，躺着一颗烧得通红的蛋。蛋壳上有一道裂缝，里面有什么东西在动。');
    await say('大红鸟', '（大红一把把你推开，自己凑上去，用嘴把蛋往外拱了拱。）');
    await nar('蛋“咔”地一声碎了，钻出来一只浑身是火的小雀。它看了看大红，“啾”了一声，就钻进了大红的翅膀底下。');
    await me('……你这是要当娘？');
    await say('大红鸟', '（大红骄傲地挺起了胸脯。）');
    await nar('小雀在大红翅膀下睡了一晚，第二天飞走了，临走前叼来一颗火晶，放在你脚边。'); give('baoyao'); } },
  { id: 'hg_old', once: 1, title: '涅槃池边的老人', when: P => P.id === 'hg_nirvana' && C.story.q >= qi('q_letter'), scene: async () => {
    await nar('涅槃池边坐着一个白头发的老祭司，正往池子里撒一把灰。');
    await say('守池的老祭司', '这是火国历代祭司的骨灰。我们死了，都回到这池子里。……它烧过你，你身上就有我们的一点火了。');
    const c = await choose(['谢谢你们。', '那我以后会烫手吗？']);
    if (c === 1) await say('守池的老祭司', '（老人笑得直咳嗽）会。打别人的时候。');
    else await say('守池的老祭司', '不用谢。替我们……多看看这天底下。');
    gainExp(BAL.expNext(C.lv) * 0.15); } },
  { id: 'chick', once: 1, title: '青鳞小鹰', when: P => P.area === 'dahuang' && C.story.q >= qi('q_ruin') && !isNight(), scene: async () => {
    await nar('头顶传来一声鹰啸，又尖又亮，你觉得耳熟。一只青色的鹰收拢翅膀，落在你面前的石头上——它站起来已经比你还高了。');
    await nar('它歪着脑袋看你，用弯弯的喙蹭了蹭你的手背。是那年柳神救活的那只小鹰。');
    if (F().lure) await nar('你想起那天，你抱着它的蛋冲它娘大喊“蛋在我这儿”。它大概不记得了。可它记得你身上的味道。');
    await me('你都长这么大了？……你娘还好吗？');
    await nar('它“嘎”了一声，扔下一块带着符文的兽骨和一株灵药，扇扇翅膀，飞回了云里。');
    give('bone', 2); give('lingyao'); F().chick = 1; } },
  { id: 'carve', once: 1, title: '石头上的划痕', when: P => P.id === 'dh_ruin' && C.story.q >= qi('q_leave'), scene: async () => {
    await nar('你走到那块刻着字的大石头前。“石村迁往……”几个字还在，可字底下多了一道浅浅的划痕。');
    await nar('划痕很新，弯弯曲曲，像是有人用指尖一个字一个字摸过去，摸到最后，停了很久。');
    await me('……有人来过。');
    await nar('四周只有风。你在石头前站到天黑，什么人也没等到。'); F().carve = 1; } },
  { id: 'sense', when: P => C.lv >= 10 && P.gather && P.area !== 'shicun', run: () => { logLine('你体内的洞天微微一热——地底下埋着什么。你刨开土，挖出两株灵药。', 'enc'); addItem('lingyao', 2); } },
  { id: 'chick2', once: 1, title: '它跟来了', when: P => P.id === 'bt_wild' && F().chick && C.lv >= 12, scene: async () => {
    await nar('两头黑纹虎一前一后，把你堵在了一片乱石里。你刚摆开架势，一道青影从天上直扎下来——');
    await nar('是那只青鳞鹰！它从大荒一路跟到了补天阁。');
    await fight({ mobs: [['tiger', clamp(C.lv, 11, 14)], ['tiger', clamp(C.lv - 1, 11, 14)]], allies: ['a_eagle'], title: '阁外山林 · 和青鳞鹰一起', noLose: true, flee: true });
    await nar('它站在虎尸上梳了梳羽毛，冲你叫了一声，又飞走了。地上留着一颗它不知从哪儿叼来的宝药。'); give('baoyao'); } },
  { id: 'trapped', once: 1, title: '被虎追的师弟', when: P => P.id === 'bt_wild' && C.lv >= 13 && F().joined, scene: async () => {
    await nar('林子里传来一声惨叫。一个外门的小师弟抱着药篓拼命跑，身后一头黑纹虎越追越近。');
    const c = await choose(['冲上去！', '（他好像能自己跑掉……）']);
    if (c === 1) { await nar('小师弟一头扎进了溪水里，老虎在岸边转了两圈，悻悻地走了。他湿淋淋地爬上岸，看了你一眼，什么也没说。'); return; }
    if (await fight({ mobs: [['tiger', clamp(C.lv, 12, 15)]], title: '阁外山林 · 救人', noLose: true, flee: false })) {
      await say('外门弟子', '多、多谢师兄！我认得你，你是清风师姐的朋友！这个给你……我采了一早上的。'); give('lingyao', 2); give('baoyao'); } } },
  { id: 'oldbones', once: 1, title: '古战士的骨', when: P => P.area === 'baiduan' && C.lv >= 16, scene: async () => {
    await nar('断崖底下躺着一具不知多少年的骸骨，骨头已经变成了石头的颜色，手里还攥着一块骨片。');
    await nar('骨片上刻着骨文，刻得又深又急，像是临死前拼命刻下的。');
    if (C.sk.includes('gw')) { await nar('你认得这些纹路——和藏经阁五层那卷骨简是一路的，只是更狠，更老。你照着它在掌心里比划了一遍，骨文锁链好像变得更顺手了。'); C.prof.gw = (C.prof.gw || 0) + 15; logLine(`📿骨文·缚 熟练度 +15（${C.prof.gw}）`, 'sys'); }
    else { await nar('你看不懂，可还是把骨片收好了。骸骨旁边长着两株灵药。'); give('lingyao', 2); }
    await nar('你把那具骸骨埋了，在坟头压了一块石头。'); } },
  // night
  { id: 'fireflies', night: true, when: P => P.area === 'dahuang', run: () => { logLine('一群萤火虫绕着你飞，一明一暗，把你领到了石缝里一丛药草跟前。', 'enc'); addItem(chance(0.35) ? 'lingyao' : 'herb'); } },
  { id: 'owlnest', night: true, once: 1, title: '夜枭的窝', when: P => P.area === 'dahuang' && C.lv >= 4, scene: async () => {
    await nar('月亮很亮。一棵枯树的树洞里，几只毛茸茸的小夜枭挤成一团，正眨巴着大眼睛看你。');
    const c = await choose(['（悄悄退开）', '（摸一摸）']);
    if (c === 1) { await nar('你刚伸出手，头顶一阵冷风——它们的娘回来了！'); await fight({ mobs: [['owl', clamp(C.lv, 3, 9)], ['owl', clamp(C.lv, 3, 9)]], title: '夜枭的窝', noLose: true, flee: true }); }
    else { await nar('你退开的时候，树上的大夜枭盯了你一路，最后扔下来一块兽骨。'); give('bone'); } } },
  { id: 'wisps', night: true, when: P => P.area === 'baiduan', run: async () => { logLine('断山之间飘起一串鬼火，悠悠地朝你围了过来。', 'enc'); const lv = clamp(rint(P0().lv[0], P0().lv[1]), 13, 20); const r = await startBattle({ mobs: [['wisp', lv], ['wisp', lv]], title: '百断山 · 鬼火', flee: true }); if (r && r.win) logLine('鬼火散了，地上留下几点亮晶晶的东西。', 'dim'); } },
];
const P0 = () => PLACES[C.loc];
function wildEventFor(P) {
  const L = WILD.filter(e => (!e.once || !C.story.f['wd_' + e.id]) && (e.night === undefined || e.night === isNight()) && e.when(P));
  const once = L.filter(e => e.once); return once.length ? once[0] : L.length ? pick(L) : null;
}
async function runWild(e) { if (e.once) C.story.f['wd_' + e.id] = 1; if (e.scene) await runScene(e.scene, { title: e.title }); else await e.run(); save(); refresh(); }

/* ---------- 骨文 game: the runes light up one by one (numbered), then you connect them 1 → n.
   Nothing to memorise — the numbers stay. Finishing in time without a wrong tap gives the 宝术 a head start.
   The lighting is game state (R.shown), not a CSS animation, so it works with animations off and is mirrored in co-op. */
function runeGame(id) {
  if (window.__dbg && __dbg.auto) return Promise.resolve(!__dbg.runeFail);
  const n = { qly: 4, sn: 5, lei: 6, gw: 6 }[id] || 5, nodes = [];
  for (let t = 0; nodes.length < n && t < 400; t++) { const x = 34 + Math.random() * 252, y = 34 + Math.random() * 124; if (nodes.every(o => Math.hypot(o.x - x, o.y - y) > 66)) nodes.push({ x: Math.round(x), y: Math.round(y), g: runeGlyph() }); }
  const seq = shuffle(nodes.map((_, i) => i));
  return new Promise(res => { DLG = { rune: { id, name: SKILLS[id].name, nodes, seq, got: [], phase: 'show', shown: 0, fails: 0, bad: -1, dur: n * 1400 + 2000, t0: 0, k: uid() }, res }; renderDlg(); netSync(); runeShowStep(); });
}
function runeGlyph() { // a few strokes inside a circle — an abstract rune, different every time
  const P = () => [Math.round((Math.random() - 0.5) * 24), Math.round((Math.random() - 0.5) * 24)]; let d = '';
  for (let i = 0; i < 2 + rint(0, 1); i++) { const a = P(), b = P(), c = P(); d += i % 2 ? `M${a[0]} ${a[1]}Q${c[0]} ${c[1]} ${b[0]} ${b[1]}` : `M${a[0]} ${a[1]}L${b[0]} ${b[1]}`; } return d;
}
function runeShowStep() { const R = DLG && DLG.rune; if (!R || R.phase !== 'show') return; const k = R.k;
  setTimeout(() => { const Q = DLG && DLG.rune; if (!Q || Q.k !== k || Q.phase !== 'show') return;
    if (Q.shown < Q.seq.length) { Q.shown++; sfx('click'); renderDlg(); netSync(); runeShowStep(); }
    else { Q.phase = 'input'; Q.t0 = now(); renderDlg(); netSync(); } }, R.shown === 0 ? 500 : R.shown < R.seq.length ? 520 : 800); }
function runeTap(i) { const R = DLG && DLG.rune; if (!R || R.phase !== 'input' || NETROLE === 'guest' || R.got.includes(i)) return;
  if (R.seq[R.got.length] === i) { R.got.push(i); R.bad = -1; sfx('click'); if (R.got.length === R.seq.length) { R.phase = 'done'; R.ok = R.fails === 0 && now() - R.t0 <= R.dur; sfx(R.ok ? 'epic' : 'click'); renderDlg(); netSync(); if (R.ok) setTimeout(() => runeEnd(true), 900); return; } }
  else { R.fails++; R.bad = i; sfx('fail'); }
  renderDlg(); netSync(); }
function runeRetry() { const R = DLG && DLG.rune; if (!R || R.phase !== 'done' || R.ok || NETROLE === 'guest') return; Object.assign(R, { seq: shuffle(R.seq.slice()), got: [], phase: 'show', shown: 0, fails: 0, bad: -1, t0: 0, tries: (R.tries || 0) + 1, k: uid() }); sfx('click'); renderDlg(); netSync(); runeShowStep(); }
function runeAccept() { const R = DLG && DLG.rune; if (R && R.phase === 'done' && !R.ok && NETROLE !== 'guest') runeEnd(false); }
function runeSkip() { if (DLG && DLG.rune && NETROLE !== 'guest') runeEnd(false); }
function runeEnd(ok) { const D_ = DLG; if (!D_ || !D_.rune) return; DLG = null; logLine(ok ? '骨文一气呵成地连了起来，你一下子就看透了它的走向。' : '骨文连上了，可还不够顺，往后得慢慢磨。', 'dim'); renderDlg(); netSync(); D_.res(ok); }
function runeHtml(R) {
  const order = {}; R.seq.forEach((n, j) => order[n] = j); const path = R.phase === 'show' ? R.seq.slice(0, R.shown) : R.phase === 'done' ? R.seq : R.got;
  const links = path.slice(1).map((n, j) => { const a = R.nodes[path[j]], b = R.nodes[n]; return `<line class="lnk ${R.phase === 'show' ? 'demo' : ''}" x1="${a.x}" y1="${a.y}" x2="${b.x}" y2="${b.y}"/>`; }).join('');
  const numOn = i => R.phase !== 'show' || order[i] < R.shown, lit = i => R.phase === 'show' ? order[i] < R.shown : R.phase === 'done' || R.got.includes(i);
  const nodes = R.nodes.map((o, i) => `<g class="nd ${lit(i) ? 'lit' : ''} ${R.phase === 'show' && order[i] === R.shown - 1 ? 'pop' : ''} ${R.phase === 'input' && R.seq[R.got.length] === i ? 'next' : ''} ${R.bad === i ? 'bad' : ''}" onclick="runeTap(${i})" transform="translate(${o.x} ${o.y})"><circle r="22"/><path d="${o.g}"/>${numOn(i) ? `<g class="num" transform="translate(16 -16)"><circle r="9"/><text y="4">${order[i] + 1}</text></g>` : ''}</g>`).join('');
  const left = R.phase === 'input' ? Math.max(0, R.dur - (now() - R.t0)) : R.dur;
  const msg = R.phase === 'show' ? `看骨文一道道亮起来……（${R.shown}/${R.seq.length}）` : R.phase === 'input' ? `按 1 → ${R.seq.length} 的顺序点，把骨文连起来（${R.got.length}/${R.seq.length}）${R.fails ? `　<span class="bad">点错 ${R.fails} 次</span>` : ''}` : R.ok ? '一气呵成！熟练度起步更高。' : `连上了，不过${R.fails ? `点错了 ${R.fails} 次` : '慢了一点'}。一气呵成的话，熟练度起步更高。`;
  return `<div class="line"><div>${sealHtml({ n: R.name, c: '#7a4a1a' })}</div><div class="tx nar">${R.phase === 'done' ? '骨文连成了一体，在你眼前亮了一下，钻进了你的骨头里。' : R.phase === 'show' ? '骨文在你眼前一道接一道地亮起来，串成一条路。' : '照着它的路，自己走一遍。不用记——数字都在。'}</div></div>
    <div class="rune"><svg viewBox="0 0 320 190">${links}${nodes}</svg>${R.phase === 'input' ? `<div class="rtime" title="又快又不点错，熟练度起步更高"><i style="animation-duration:${R.dur}ms;animation-delay:-${R.dur - left}ms"></i></div>` : ''}<div class="msg">${msg}</div></div>${R.phase !== 'done' ? `<div class="ch"><button class="chb" onclick="runeSkip()">先不连了，直接学（跳过）</button></div>` : R.ok ? '' : `<div class="ch"><button class="chb" onclick="runeRetry()">↻ 再连一次</button><button class="chb" onclick="runeAccept()">就这样，学下来</button></div>`}`;
}
