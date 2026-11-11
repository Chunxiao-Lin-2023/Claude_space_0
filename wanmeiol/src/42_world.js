/* ================= the wild: events while exploring (some open as your realm grows, some only at night),
   and the 骨文 memory game used when 石昊 reads a 宝术 off its runes ================= */
const WILD = [
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

/* ---------- 骨文 memory game: watch the runes light up, then tap them in the same order ---------- */
function runeGame(id) {
  if (window.__dbg && __dbg.auto) return Promise.resolve(!__dbg.runeFail);
  const n = { qly: 4, sn: 5, lei: 6, gw: 6 }[id] || 5, nodes = [];
  for (let t = 0; nodes.length < n && t < 400; t++) { const x = 34 + Math.random() * 252, y = 30 + Math.random() * 130; if (nodes.every(o => Math.hypot(o.x - x, o.y - y) > 64)) nodes.push({ x: Math.round(x), y: Math.round(y), g: runeGlyph() }); }
  const seq = shuffle(nodes.map((_, i) => i));
  return new Promise(res => { DLG = { rune: { id, name: SKILLS[id].name, nodes, seq, got: [], phase: 'show', fails: 0, k: uid() }, res }; renderDlg(); netSync(); runeShowThen(); });
}
function runeGlyph() { // a few strokes inside a circle — an abstract rune, different every time
  const P = () => [Math.round((Math.random() - 0.5) * 26), Math.round((Math.random() - 0.5) * 26)]; let d = '';
  for (let i = 0; i < 2 + rint(0, 1); i++) { const a = P(), b = P(), c = P(); d += i % 2 ? `M${a[0]} ${a[1]}Q${c[0]} ${c[1]} ${b[0]} ${b[1]}` : `M${a[0]} ${a[1]}L${b[0]} ${b[1]}`; } return d;
}
function runeShowThen() { const R = DLG && DLG.rune; if (!R) return; const k = R.k; setTimeout(() => { if (DLG && DLG.rune && DLG.rune.k === k && DLG.rune.phase === 'show') { DLG.rune.phase = 'input'; renderDlg(); netSync(); } }, R.seq.length * 600 + 500); }
function runeTap(i) { const R = DLG && DLG.rune; if (!R || R.phase !== 'input' || NETROLE === 'guest') return;
  if (R.seq[R.got.length] === i) { R.got.push(i); sfx('click'); if (R.got.length === R.seq.length) { R.phase = 'done'; sfx('epic'); renderDlg(); netSync(); setTimeout(() => runeEnd(R.fails === 0), 800); return; } }
  else { R.fails++; R.got = []; R.phase = 'show'; R.k = uid(); sfx('fail'); }
  renderDlg(); netSync(); if (R.phase === 'show') runeShowThen(); }
function runeSkip() { if (DLG && DLG.rune && NETROLE !== 'guest') runeEnd(false); }
function runeEnd(ok) { const D_ = DLG; if (!D_ || !D_.rune) return; DLG = null; logLine(ok ? '骨文的走向，你一次就看清了。' : '骨文你没全看懂，只能先硬记下来，往后慢慢磨。', 'dim'); renderDlg(); netSync(); D_.res(ok); }
function runeHtml(R) {
  const order = {}; R.seq.forEach((n, j) => order[n] = j); const links = R.got.slice(1).map((n, j) => { const a = R.nodes[R.got[j]], b = R.nodes[n]; return `<line class="lnk" x1="${a.x}" y1="${a.y}" x2="${b.x}" y2="${b.y}"/>`; }).join('');
  const nodes = R.nodes.map((o, i) => `<g class="nd ${R.got.includes(i) || R.phase === 'done' ? 'lit' : ''} ${R.phase === 'show' ? 'flash' : ''}" style="--d:${order[i] * 0.6}s" onclick="runeTap(${i})" transform="translate(${o.x} ${o.y})"><circle r="21"/><path d="${o.g}"/></g>`).join('');
  const msg = R.phase === 'show' ? (R.fails ? '顺序错了。再看一遍——' : '看清骨文亮起的顺序……') : R.phase === 'input' ? `照着刚才的顺序点亮骨文（${R.got.length}/${R.seq.length}）` : '成了！';
  return `<div class="line"><div>${sealHtml({ n: R.name, c: '#7a4a1a' })}</div><div class="tx nar">${R.phase === 'done' ? '骨文连成了一体，在你眼前亮了一下，钻进了你的骨头里。' : '骨文在你眼前一道道亮起来。'}</div></div>
    <div class="rune"><svg viewBox="0 0 320 190">${links}${nodes}</svg><div class="msg">${msg}</div></div>${R.phase !== 'done' ? `<div class="ch"><button class="chb" onclick="runeSkip()">看不懂，先硬记下来（跳过）</button></div>` : ''}`;
}
