/* ================= 宝术谱 · 机缘 scenes (the tasks are BSQ in 34_baoshu.js) ================= */
/* the 机缘 scenes */
const bsRetry = id => { C.story.f['ev_' + id] = 0; }; // not done yet: the place keeps its secret until you come back
EVENTS.push(
  { id: 'bs_kp0', loc: 'xs_hall', title: '鲲鹏法的下落', when: () => BSQ[0].open() && bsSt('kp') === 0, scene: async () => {
    await nar('光幕边上，一个穿紫衣的姑娘冲你招手。是云曦。她身边站着一个白胡子老头，眯着眼看你的后背——像在看你背上有没有翅膀。');
    await say('云曦', '爷爷说，你身上有鹰的骨文，可鹰飞不到最高。');
    await say('云曦的爷爷', '鲲鹏死了很多年了，巢还在。在百断山天骨禁区的尽头，悬在一面断崖上。里头的东西，没人拿得走——因为没人能活着走到巢里。');
    await nar('他把一只旧护臂扔给你：“戴上。巢里的风，能把骨头吹散。”');
    await me('……为什么帮我？'); await say('云曦', '（她别过头）谁帮你了。护臂是借的，要还。');
    C.story.f.bs_kp = 1; logLine('机缘：鲲鹏巢在 <b>百断山 · 天骨禁区</b> 的尽头。', 'sys'); } },
  { id: 'bs_kp1', loc: 'bd_bone', title: '鲲鹏巢', when: () => BSQ[0].open() && bsSt('kp') === 1, scene: async () => {
    await nar('天骨禁区的尽头是一面看不见底的断崖。崖壁上挂着一个巢——大得像一座倒扣的山，每一根枝条都是一截发白的骨头。');
    await nar('风从巢里往外灌。护臂嗡嗡作响，你的骨头也跟着嗡嗡作响。巢的正中，一团残念睁开了眼——它还记得自己能吞天。');
    if (!await fightRetry({ mobs: [['kpcan', Math.max(24, C.lv)]], title: '鲲鹏巢 · 鲲鹏残念', epic: { name: '鲲鹏残念', sub: '十凶 · 死了很多年', seal: '鲲鹏', intro: ['它只剩下一口气。', '这一口气，也能把你吹下崖。'] } }, '风把你卷出了巢，挂在崖壁的一根骨头上。')) { bsRetry('bs_kp1'); return; }
    await nar('残念散了。巢底压着一块骨头，上面的骨文像一条鱼，又像一只鸟——游着游着，就飞了起来。');
    const r = await miniGame('lights', { title: '鲲鹏骨文', desc: '鱼的纹路和鸟的纹路缠在一起。按灭多余的那几道，让它们合成一道。', presses: 4 });
    if (!r.ok) { await nar('骨文在你手里滑走了。你得再来一次。'); bsRetry('bs_kp1'); return; }
    await cine('你身上的鹰纹一道道褪下去，<br>长出来的，是鹏的翅膀。<br><b>🐋 鲲鹏法</b>');
    bsGain('kunpeng'); C.story.f.bs_kp = 2; save(); } },
  { id: 'bs_fw', loc: 'hg_nirvana', title: '另一个你', when: () => BSQ[1].open() && bsSt('fw') === 0, scene: async () => {
    await nar('涅槃池已经凉了。你坐在池边，胸口那块刚长回来的骨头一跳一跳，像有人在里面敲门。');
    await nar('你闭上眼，顺着骨文往里走。走到最深处，你看见一个人背对着你坐着——和你一模一样。');
    await say('另一个你', '（他没回头）你终于来了。打一架，看看谁是谁。');
    if (!await fightRetry({ rivals: [{ name: '符文里的你', lv: C.lv, gear: 1.05, sk: (C.bar.length ? C.bar : ['qly', 'sn']).slice(0, 4), icon: '👤' }], title: '至尊骨 · 另一个你', noPet: true }, '他和你打成了平手——然后你就醒了，满头大汗。')) { bsRetry('bs_fw'); return; }
    await say('另一个你', '……行吧。你是你，我是你的影子。要用我的时候，叫一声。');
    await cine('骨文一道道亮起来，<br>在你身边，凝出另一个你。<br><b>👤 符文分身</b>'); bsGain('fuwen'); C.story.f.bs_fw = 1; save(); } },
  { id: 'bs_tj0', loc: 'bz_field', title: '古龙骸骨', when: () => BSQ[2].open() && bsSt('tj') === 0, scene: async () => {
    await nar('百族战场的边上，横着一具龙骨，长得一眼望不到头。几个天角蚁族的人在远处守着，谁也不往骨头里走。');
    await say('天角蚁族战士', '那是我们老祖宗打死的龙。骨头里有我们的东西——外人进去，出不来。');
    if (!await fightRetry({ mobs: [['tianjiao', Math.max(35, C.lv - 1)], ['tianjiao', Math.max(35, C.lv - 1)]], title: '古龙骸骨 · 天角蚁族' }, '天角蚁族的人把你扔出了龙骨。')) { bsRetry('bs_tj0'); return; }
    await nar('你钻进龙的肚子。最里面放着一只蒲团，坐垫上压出了一个小小的印子——像一只蚂蚁坐过。');
    await nar('你坐上去。脑子里只剩一个字：<b>力</b>。不是拳头的力，是把一座山扛起来再放下的那种力。');
    const r = await miniGame('mash', { title: '力之篇', desc: '蒲团上的力往你身上压。扛住它！', time: 6500, rate: 8 }); if (!r.ok) { await nar('你被压趴在蒲团上，起不来。缓一缓，再来。'); bsRetry('bs_tj0'); return; }
    bsGain('tjy0'); C.story.f.bs_tj = 1; save(); } },
  { id: 'bs_tj1', loc: 'xg_forest', title: '老天角蚁', when: () => BSQ[2].open() && bsSt('tj') === 1, scene: async () => {
    await nar('仙古古林里，一只蚂蚁趴在树根上晒太阳。它有拳头那么大，角已经磨秃了，壳上全是裂纹。');
    await say('老天角蚁', '（它连眼都没睁）你身上有我们家的力之篇。坐过那只蒲团了？');
    await me('坐过。'); await say('老天角蚁', '那只是开头。后面的，叫不灭。……接我三下，你没趴下，我就教你。');
    if (!await fightRetry({ rivals: [{ name: '老天角蚁', lv: C.lv + 1, gear: 1.15, sk: ['tjy', 'tjy0', 'sn'], icon: '🐜', boss: 1 }], title: '仙古古林 · 老天角蚁', noPet: true }, '你趴下了。老天角蚁打了个哈欠。')) { bsRetry('bs_tj1'); return; }
    await say('老天角蚁', '……没趴下。行，记住：打不死，才打得死人。');
    await cine('力之篇往下翻了一页，<br>翻到的那一页上，写着两个字。<br><b>🐜 不灭经</b>'); bsGain('tjy'); C.story.f.bs_tj = 2; save(); } },
  { id: 'bs_ld0', loc: 'sj_desert', title: '元天秘境', when: () => BSQ[3].open() && bsSt('ld') === 0, scene: async () => {
    await nar('荒漠下面埋着一座秘境。元天至尊死前，把他这辈子最得意的东西都塞了进去。你挤在一群上界天才中间，踩着他们的脚印往里走。');
    await nar('秘境最深处躺着一副巨兽的骨架，脑袋像獒，身子像龙。它的肋骨缝里，夹着一张金色的纸。');
    if (!await fightRetry({ mobs: [['longao', Math.max(41, C.lv)]], title: '元天秘境 · 龙獒骸骨', epic: { name: '龙獒骸骨', sub: '元天秘境 · 守着一页纸', seal: '獒', intro: ['骨头动了。', '它守着这页纸，守了几千年。'] } }, '骸骨一爪子把你拍出了秘境。')) { bsRetry('bs_ld0'); return; }
    await nar('金纸到了你手里。纸上画着四道雷：一道劈天，一道劈地，一道劈人，一道——劈自己。');
    const r = await miniGame('thunder', { title: '四绝天', desc: '四道雷，一道一道接住它。', strikes: 5, need: 3 }); if (!r.ok) { await nar('雷把纸上的字劈乱了。等它们重新排好，再来。'); bsRetry('bs_ld0'); return; }
    bsGain('lei4'); C.story.f.bs_ld = 1; logLine('金纸只有一页。听人说，第二页飘进了 <b>无人区</b>。', 'sys'); save(); } },
  { id: 'bs_ld1', loc: 'sj_wild', title: '第二页金纸', when: () => BSQ[3].open() && bsSt('ld') === 1, scene: async () => {
    await nar('无人区的一块骨头上，压着一只青色的蒲团。蒲团底下，露出金纸的一角。你刚伸手，一道雷从天上劈下来——第二页纸，在挑人。');
    const r = await miniGame('thunder', { title: '雷帝', desc: '这一回的雷，是活的。它往哪儿躲，你往哪儿接。', strikes: 6, need: 4 }); if (!r.ok) { await nar('你被劈出去三丈远。纸还在那儿，等着。'); bsRetry('bs_ld1'); return; }
    await cine('两页金纸合在一起，<br>纸上的雷，从你的骨头里响了起来。<br>你身上，披了一层雷做的甲。<br><b>🌩️ 雷帝宝术</b>'); bsGain('leidi'); C.story.f.bs_ld = 2; save(); } },
  { id: 'bs_zh', loc: 'xs_hall', title: '真凰的传承地', when: () => BSQ[4].open() && bsSt('zh') === 1, scene: async () => {
    await nar('十块青铜书碎片在你手心里拼成了一本书。书一合上，虚神界的光幕裂开一道门，门里全是火。');
    await nar('火里站着一只鸟。比朱雀大，比朱雀亮——朱雀只是它掉下来的一根羽毛。');
    if (!await fightRetry({ mobs: [['zhyy', Math.max(44, C.lv)]], title: '虚神界 · 真凰虚影', epic: { name: '真凰虚影', sub: '十凶 · 火里生，火里死', seal: '凰', intro: ['它看了一眼你身上的朱雀羽。', '然后，它笑了。'] } }, '火把你推回了光幕外面。碎片还在，门也还开着。')) { bsRetry('bs_zh'); return; }
    await cine('朱雀的火一点点熄了，<br>再烧起来的时候，<br>它不会再灭。<br><b>🐦‍🔥 真凰宝术</b>'); bsGain('zhenhuang'); C.story.f.bs_zh = 2; save(); } },
  { id: 'bs_cz0', loc: 'xs_hall', title: '惜花', when: () => BSQ[5].open() && bsSt('cz') === 0, scene: async () => {
    await nar('虚神界的一角，一个老婆婆坐在花丛里绣花。她绣的不是花，是剑。');
    await say('补天教的老婆婆', '石昊？补天教找你很久了。（她把针一抽，花丛里立起九片草叶）我这把老骨头，正好拿你试试剑。');
    if (!await fightRetry({ rivals: [{ name: '惜花婆婆', lv: C.lv + 1, gear: 1.15, sk: ['caozi0', 'gw', 'jian'], icon: '🌿', boss: 1 }], title: '虚神界 · 惜花婆婆', noPet: true }, '剑叶把你钉在了光幕上。老婆婆接着绣她的花。')) { bsRetry('bs_cz0'); return; }
    await nar('她化成光散了，地上留下一张兽皮。兽皮上写着半篇剑诀，字是用草叶刻的。');
    bsGain('caozi0'); C.story.f.bs_cz = 1; logLine('剑诀只有半篇。另外半篇，在下界的 <b>至尊殿堂</b>。', 'sys'); save(); } },
  { id: 'bs_cz1', loc: 'jt_peak', title: '至尊殿堂', when: () => BSQ[5].open() && bsSt('cz') === 1 && F_('zhizun'), scene: async () => {
    await nar('你重回至尊的那天夜里，九天之巅的云散了，露出一座殿。殿门上没有字，门槛上长着一株草，九片叶子。');
    await nar('你把兽皮放在门槛上。草叶动了一下，兽皮上缺的那半篇，一个字一个字地长了出来。');
    const r = await miniGame('memory', { title: '九叶', desc: '九片剑叶，每一片都对着兽皮上的一个字。把它们一一对上。' }); if (!r.ok) { await nar('有几片叶子对错了，字又缩了回去。'); bsRetry('bs_cz1'); return; }
    await cine('九片叶子，<br>一片一片落在你的剑上。<br><b>🍃 草字剑诀</b>'); bsGain('caozi'); C.story.f.bs_cz = 2; save(); } },
  { id: 'bs_gz', loc: 'yy_guzu', title: '蛄祖的礼物', when: () => BSQ[6].open() && bsSt('gz') === 0, scene: async () => {
    await nar('蛄祖坐在洞口，手里捏着一只虫子。虫子很小，壳是灰的，看着一点也不起眼。');
    await say('蛄祖', '我们这一族，没什么本事。就是能吃——吃护体的光，吃别人身上的神力，吃到最后，连道都能啃一口。');
    await say('蛄祖', '（他把虫子按在你的眉心）我老了。这点东西，留给你，比留给异域强。');
    const r = await miniGame('lights', { title: '蛄', desc: '虫子往你的骨文里钻。把挡路的骨文按灭，给它让出一条道。', presses: 5 }); if (!r.ok) { await nar('虫子退了回去。蛄祖说：“不急，它认人，慢慢来。”'); bsRetry('bs_gz'); return; }
    await cine('你身上多了一样东西。<br>它很小，不起眼。<br>可它什么都吃。<br><b>🪲 蛄之宝术</b>'); bsGain('gu'); C.story.f.bs_gz = 1; save(); } },
  { id: 'bs_ql', loc: 'dl_age', title: '白麒麟', when: () => BSQ[7].open() && bsSt('ql') === 0, scene: async () => {
    await nar('古战场的雾里走出来一头麒麟，浑身雪白，蹄子落下的地方开出火做的花。它看你的眼神，像认识你很久了。');
    await say('白麒麟', '你身上有我们一族的血的味道——不是你的，是被你打过的人的。六冠王那个孩子，是你打的？');
    await me('他先动的手。'); await say('白麒麟', '（它笑了）那就好。来，我看看你配不配学。');
    if (!await fightRetry({ rivals: [{ name: '白麒麟', lv: C.lv + 1, gear: 1.2, sk: ['qilin', 'zhuque', 'lei'], icon: '🦄', boss: 1 }], title: '帝落古战场 · 白麒麟', noPet: true }, '白麒麟用蹄子把你按在地上，按了一会儿，又松开了。')) { bsRetry('bs_ql'); return; }
    await cine('火做的花，从你脚下开了一路。<br><b>🦄 麒麟宝术</b>'); bsGain('qilin'); C.story.f.bs_ql = 1; save(); } },
  { id: 'bs_zl', loc: 'xy_city', title: '老仙王', when: () => BSQ[8].open() && bsSt('zl') === 0, scene: async () => {
    await nar('古城的一家酒馆里，一个老头独自喝酒。他身上没有一点仙王的样子，可酒馆里谁也不敢坐他旁边。');
    await say('老仙王', '我年轻时跟一条真龙换过命，换来一门宝术，一直没传人。你拿你的本事来换——赢我一次。');
    if (!await fightRetry({ rivals: [{ name: '老仙王', lv: C.lv + 2, gear: 1.25, sk: ['zhenlong', 'lunhui', 'zhizun'], icon: '🧓', boss: 1 }], title: '仙域古城 · 老仙王', noPet: true }, '老头把你扔出了酒馆，接着喝。')) { bsRetry('bs_zl'); return; }
    await say('老仙王', '（他擦了擦嘴角的血，乐了）好，好。龙给你了——别给它丢人。');
    await cine('龙吟从你的骨头里响起来，<br>整座古城的人都抬起了头。<br><b>🐉 真龙宝术</b>'); bsGain('zhenlong'); C.story.f.bs_zl = 1; save(); } },
);
for (const H of HIDDEN) if (H.id === 'longnv') H.sk = H.sk.map(s => s === 'lunhui' ? 'zhenlong' : s); // 龙女: of course she has the dragon
