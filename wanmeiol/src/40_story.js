/* ================= hand-written branching story =================
   main quest = list of steps.  A step is finished by: auto | enter (arrive at loc) | talk (npc) |
   kill (n monsters, then turn in at npc) | dungeon (clear, then turn in) | level | multi (sub-goals).
   Scenes are async scripts: say / nar / me / choose / fight / give …  */
const clsBeast = () => ({ mangniu: '莽牛', kunpeng: '鲲鹏', liushen: '柳枝' }[C.cls]);
const F = () => C.story.f;
const sub = s => s.replace(/\{name\}/g, esc(C.name)).replace(/\{cls\}/g, CLASSES[C.cls].name).replace(/\{beast\}/g, clsBeast());
// ---- script primitives (UI implemented in 50_ui) ----
const nar = t => dlgShow({ who: '', text: sub(t) });
const me = t => dlgShow({ who: C.name, text: sub(t), mine: 1 });
const say = (npc, t) => { const N = NPCS[npc]; return dlgShow({ who: N ? N.name : npc, icon: N ? N.icon : '', text: sub(t) }); };
const choose = (opts) => dlgChoose(opts.map(o => typeof o === 'string' ? { t: sub(o) } : Object.assign({}, o, { t: sub(o.t) })));
const tip = t => logLine('【指引】' + t, 'tip');
function give(id, n = 1) { addItem(id, n); }
function giveEq(base, r = 1) { addEquip(makeEquip(base, r)); }
async function fight(spec) { const r = await startBattle(Object.assign({ flee: false }, spec)); return r && r.win; }
async function fightRetry(spec, loseText) { // story boss fights: lose → offer a retry
  for (; ;) { if (await fight(Object.assign({ noLose: true }, spec))) return true; await nar(loseText || '你被打倒在地，眼前一黑……再醒来时，伤口已经被人包扎好了。');
    fullHeal(); refresh(); const c = await choose(['再来一次', '先回去变强一些']); if (c === 1) return false; }
}
const slv = (base, lo = -1, hi = 2) => clamp(C.lv, base + lo, base + hi); // scale story enemies around the player

/* ---------------- 第一章 · 石村 ---------------- */
async function S_wake() {
  await nar('黑暗。很长很长的黑暗。<br>……有人在说话。');
  await say('chief', '醒了？醒了就好。');
  await nar('你睁开眼，发现自己躺在一张铺着兽皮的石床上。一个须发皆白、腰背却挺得笔直的老人坐在床边，手里端着一碗冒热气的兽奶。');
  await say('chief', '三天前，村里的猎手在大荒边上发现了你，浑身是伤，怀里只揣着一块碎骨头。孩子，你叫什么？从哪儿来？');
  await me('我叫{name}……');
  const c = await choose(['我不记得了。只记得一道很亮的光。', '我从山外来，很远很远的地方。', '（盯着那碗兽奶，咽了口口水）']);
  if (c === 0) { F().origin = 'light'; await say('chief', '一道光……（他沉默了好一会儿）大荒里怪事多，想不起来就别想了。'); }
  if (c === 1) { F().origin = 'outside'; await say('chief', '山外？呵，老头子活了一辈子，也没走出过这片大山。外面……一定很大吧。'); }
  if (c === 2) { F().origin = 'milk'; await say('chief', '哈哈哈，先喝！跟村里那个小崽子一个德性。'); give('milk', 2); }
  await nar('你低头看那块碎骨，上面的纹路忽然微微一亮——是一头{beast}的轮廓，一闪就没入了你的掌心。');
  await say('chief', '这是……宝骨上的符文！它认了你。孩子，你身上有{cls}一脉的传承。');
  await say('chief', '既然来了石村，就是石村的人。先去村西头拜拜祭灵，再去村南练武场，跟娃娃们一起锻体。大荒里，没点本事活不下去。');
  await nar('族长给你换上了一身兽皮衣，又塞给你一根骨矛。');
  tip('右上角 📬 邮件里有<b>开服礼包</b>，📅 每日签到也别忘了。');
  tip('点击下方的方向按钮移动。祭灵柳在村子西边：先往<b>西</b>走到村中石路，再继续往<b>西</b>。');
}
async function S_willow() {
  await nar('那是一截焦黑的柳树桩，粗得十几个人都合抱不过来，像是被天火烧过。只有顶端抽出一根嫩绿的柳枝，在风里轻轻摇晃。');
  await nar('你刚走近，柳枝忽然停住了——明明还有风。一缕极淡的光落在你的额头，你体内那道{beast}符文跟着亮了一下。');
  const c = await choose(['跪下拜一拜', '伸手摸一摸那根柳枝', '绕着树桩走一圈']);
  if (c === 0) { F().willow = 'bow'; await nar('你跪下磕了个头。一股清凉从头顶灌下，三天来的疲惫一扫而空，连骨头缝里都舒坦。'); fullHeal(); gainExp(25); }
  if (c === 1) { F().willow = 'touch'; await nar('柳枝轻轻缠住你的手指，像在打量你……然后松开了。指尖酥酥麻麻的，好一会儿才散。'); give('pill', 2); }
  if (c === 2) { F().willow = 'walk'; await nar('树桩背面刻着一道道歪歪扭扭的刻痕，是村里的娃娃们量身高留下的。最上面一道旁边写着：“小不点要长得比柳神还高”。'); give('herb', 3); }
  await nar('村里人说，当年一场天火落下来，是这棵柳树挡在了石村前面。它烧得只剩一根枝条，却护住了整个村子。');
  tip('祭灵柳旁边可以“休息”回满气血。接下来去村南的<b>练武场</b>。');
}
async function S_yard() {
  await nar('朝霞刚刚升起，练武场上一群娃娃光着膀子，迎着霞光吐纳、打拳。场边的大石锁一个比一个重。');
  await nar('一个三四岁的小娃娃正抱着一只比他还大的石锁，脸憋得通红——“嘿！”——石锁被举过了头顶。周围的大人一片叫好。');
  await say('xiaobudian', '（啪嗒啪嗒跑过来，仰头看你）你就是那个从天上掉下来的人？');
  const c = await choose(['我没有从天上掉下来……', '对，我是天上的神仙。', '你是谁家的孩子？力气这么大。']);
  if (c === 0) await say('xiaobudian', '可是虎婶说你是从天上掉下来的，还说你身上会发光！（凑近看了看）……不发光啊。');
  if (c === 1) { F().fairy = 1; await say('xiaobudian', '（眼睛瞪得溜圆）真的？那你会飞吗？会不会变兽奶？……你骗人，神仙才不会躺三天。'); }
  if (c === 2) await say('xiaobudian', '我是小不点！我爹娘……（挠挠头）反正全村都是我家的！');
  await say('hunterhu', '小不点，别缠着人家。{name}是吧？族长说你有传承，来，打那个木人桩给我看看。');
  if (!await fight({ mobs: [['dummy', 1]], title: '迎霞锻体 · 木人桩', tag: 'dummy', noLose: true })) await nar('木人桩晃了晃，把你弹了个跟头。石林虎憋着笑把你拉起来：“没事，第一次都这样。”');
  await say('xiaobudian', '哇——不过我也能！（他一拳砸在旁边那个木人桩上，“咔嚓”一声，木桩断成了两截）');
  await say('hunterhu', '……那是村里最后一个好木桩。（叹气）算了。{name}，北边山林小径上的山狼最近多得邪乎，叼走了好几只羊。你去打三头回来，算是出师。');
  tip('从练武场往北回到村中，再往北出村口，就是<b>山林小径</b>。在野外点<b>探索</b>会遇到怪物和可采集的东西。');
}
async function S_huntDone() {
  await say('hunterhu', '三头山狼，一头不少。好！手脚挺利索。');
  await say('hunterhu', '这串兽牙链你拿着，我年轻时候戴的，辟邪。');
  giveEq('c1', 1); addGold(40);
  await nar('还没说完，村中传来一声尖叫：“我的兽奶——！！”');
  await say('hunterhu', '（扶额）又来了。是虎婶。你去看看吧，就在村中石路上。');
}
async function S_milk1() {
  await say('auntie', '我家的兽奶罐子又空了！一滴都不剩！我腌了半个月的兽肉也少了两块！');
  await say('auntie', '肯定是哪个小崽子干的……你帮我去练武场看看，谁嘴边白白的，就是谁！');
}
async function S_milk2() {
  await nar('小不点蹲在练武场角落里，嘴角挂着一圈白胡子，正舔着手指头上的肉油。看见你过来，他把手背到身后，一脸无辜。');
  await say('xiaobudian', '我、我什么也没干！');
  const c = await choose(['（揭穿）你嘴边白白的是什么？', '（压低声音）我替你保密，下次分我一口。', '（蹲下来）偷东西不对。自己去跟虎婶认个错吧。']);
  if (c === 0) { F().milk = 'snitch'; await nar('小不点“哇”地一声跳起来就跑。没过多久，全村都听见虎婶举着擀面杖追着他满村跑的声音。'); await say('auntie', '（气喘吁吁回来）多亏了你！这块肉拿着！'); give('meat', 3); }
  if (c === 1) { F().milk = 'ally'; await say('xiaobudian', '（眼睛一亮）够意思！我告诉你一个秘密——村后头那块大石头底下，我藏了好多亮晶晶的石头！'); await nar('你在石头底下摸到了几块透亮的强化石，还有一小罐兽奶。'); give('stone', 3); give('milk', 3); }
  if (c === 2) { F().milk = 'honest'; await nar('小不点咬着嘴唇想了半天，最后耷拉着脑袋，自己走到虎婶门口。'); await say('auntie', '（愣了一下，又好气又好笑）……算你这小崽子还有点良心。下回想喝跟婶说！'); give('milk', 3); gainExp(80); }
  await nar('这时，石林虎从村口快步走来，脸色难看。');
  await say('hunterhu', '放羊的石二伯被狼咬伤了。我顺着脚印追到黑石林北边，那里有个狼穴——里面有头狼王。山狼这么多，就是它在作怪。');
  await say('hunterhu', '狼穴里面窄，人多施展不开，可一个人去又太险。你要是能找到帮手最好。打掉狼王，回来告诉族长。');
  tip('<b>狼穴</b>是一个副本：从山林小径往西是黑石林，再往北就是狼穴洞口。建议 5 级以上，可以在“社交”里邀请其他玩家组队。');
}
async function S_denDone() {
  await say('chief', '狼王的皮……你真把它宰了！（他摸着那张银白的狼皮，半天没说话）');
  await say('chief', '好孩子。石村欠你一份情。从今往后，你就是石村的猎手了。');
  addGold(150); giveEq('a2', 1);
  await nar('<b>【第一章 · 石村 · 完】</b>');
  worldEvent('chapter', { ch: 1 });
  await say('chief', '入冬前，村里要备足过冬的肉。莽牛坡上的莽牛正肥，你去猎三头回来，交给虎婶。');
  tip('莽牛坡在山林小径的<b>东边</b>。莽牛皮糙肉厚，冲锋前会蓄力——看到“蓄力”就先防御或者打断它。');
}
/* ---------------- 第二章 · 大荒 ---------------- */
async function S_calf() {
  await nar('刚上坡，你就听见一阵“哞哞”的哀叫。草丛里有个猎人挖的陷坑，一头莽牛犊掉在里面，腿卡在尖木桩之间，挣扎得满身是血。');
  await nar('不远处，一头山一样的母莽牛来回踱步，冲着陷坑低吼，却够不着。它看见了你，鼻孔里喷出两道白气。');
  const c = await choose(['跳下去，把小牛推上来', '一矛结果它，带回去是好肉', '不管它，打猎要紧']);
  if (c === 0) { F().calf = 'saved'; await nar('你跳进坑里，拔掉木桩，用肩膀把小牛一点点顶了上去。母莽牛冲过来——却在你面前停住，低头用鼻子拱了拱小牛，又看了你一眼，慢慢走远了。'); gainExp(90); }
  if (c === 1) { F().calf = 'killed'; give('meat', 3); await nar('小牛不叫了。母莽牛发出一声震天的怒吼，朝你冲了过来！'); await fight({ mobs: [['bull', slv(5)]], title: '暴怒的母莽牛', noLose: true }); }
  if (c === 2) { F().calf = 'ignored'; await nar('你绕开陷坑往前走。身后的哀叫声越来越弱。'); }
}
async function S_bullDone() {
  await say('auntie', '三头莽牛！够全村吃一冬了！（乐得合不拢嘴）');
  if (F().calf === 'saved') await say('auntie', '听说你还救了一头莽牛犊？心善是好事。大荒里的畜生，也记恩。');
  if (F().calf === 'killed') await say('auntie', '小牛犊的肉最嫩……不过它娘那一下，没撞坏你吧？');
  give('elixir', 2); addGold(80);
  await say('auntie', '族长刚才在找你，好像有什么事，脸色不太好。');
}
async function S_raid() {
  await say('chief', '狈村的人最近在村子周围转悠，石林虎在林子里发现了他们的脚印。今晚……你留在村里。');
  await nar('入夜。<br>“呜——呜——”村口的号角突然响了！火光从北边亮起来，喊杀声越来越近。');
  await say('hunterhu', '狈村的人摸过来了！{name}，跟我上！');
  go('sc_gate', true, true);
  const allies = [['a_hunter']]; if (F().calf === 'saved') { allies.push(['a_bull']); await nar('黑暗中传来一阵沉闷的蹄声——那头母莽牛冲出了林子，一头把一个狈村猎手撞飞了出去！'); }
  const win = await fight({ mobs: [['beihunter', slv(7)], ['beihunter', slv(7)], ['beishaman', slv(7)]], allies, title: '夜袭 · 村口保卫战', noLose: true, tag: 'raid' });
  if (win) await nar('狈村的人丢下几具同伴的身体，退回了黑暗里。'); else { F().raidLost = 1; await nar('你被一棒打倒在地。等你醒来，村里的汉子们已经举着火把把狈村的人赶跑了，村口的石屋烧塌了一间。'); }
  await say('chief', '（盯着村口的火光，攥紧了拳头）狈村……几十年了，从来没有这样过。');
  const c = await choose(['打上门去！让他们知道石村不好惹！', '先派人去谈，弄清楚他们为什么突然来抢', '听族长的']);
  if (c === 0) { F().bei = 'war'; await say('chief', '……好。明天一早，你和石林虎带人去狈村。记住，打疼他们就行，别赶尽杀绝。'); }
  else { F().bei = 'talk'; await say('chief', c === 1 ? '你说得对。狈村再坏，也不至于这样拼命。你去一趟，问问清楚。' : '先礼后兵。你去狈村走一趟，问问他们到底想干什么。要是谈不拢……再说。'); }
  tip('<b>狈村</b>在深山老林的北边（山林小径往北）。那一带的怪物 7 级起步。');
}
async function S_bei() {
  if (F().bei === 'war') {
    await nar('你们冲进狈村的时候，狈村的人正围着篝火。看见石村的人，他们愣了一下，抄起骨棒就冲了上来。');
    const w1 = await fightRetry({ mobs: [['beihunter', slv(8)], ['beihunter', slv(8)]], allies: [['a_hunter']], title: '攻入狈村' }); if (!w1) return false;
    await nar('一个高大的汉子推开人群走出来，脸上涂着狈祖的图腾，手里提着一根镶满兽牙的狼牙棒。');
    await say('狈烈', '石村的小崽子，敢打上门来？今天谁也别想走！');
    const w2 = await fightRetry({ mobs: [['beichief', slv(9)]], allies: [['a_hunter']], title: '狈村头领 · 狈烈' }); if (!w2) return false;
    await nar('狈烈跪倒在地。一个拄着骨杖的老婆婆颤巍巍地走出来，挡在他前面。');
  } else {
    await nar('你一个人走进狈村。墙头的猎手拉开了弓，却没有放箭。一个拄着骨杖的老婆婆颤巍巍地走出来，挥手让他们放下弓。');
  }
  await say('狈村老祭司', '石村的人……唉。我知道你为什么来。');
  await say('狈村老祭司', '今年开春，东边崖上那只青鳞鹰孵了蛋，脾气暴得吓人，方圆百里的凶兽都被它赶跑了。我们狈村靠打猎过活，猎物没了……孩子们饿得直哭。年轻人不听我的，才去抢。');
  if (F().bei === 'talk') {
    await say('狈烈', '（从人群里走出来，脸上涂着狈祖的图腾）阿婆，跟石村的人有什么好说的！小子，想谈？先赢了我手里这根棒子！');
    const w = await fightRetry({ mobs: [['beichief', slv(8, -1, 1)]], title: '单挑 · 狈烈' }); if (!w) return false;
    await say('狈烈', '（揉着肩膀，咧嘴笑了）……你这人，有意思。行，听你的。');
    await me('石村有过冬的肉，可以分一些给狈村。但你们得保证，再也不许来抢。');
    await say('狈村老祭司', '狈祖在上，狈村记下了。（她从怀里掏出一个兽皮包）这是我们狈村的药方子和几株老药，拿去吧。');
    F().peace = 1; give('lingyao', 5); gainExp(200);
  } else {
    await say('狈村老祭司', '你们赢了。狈村认输。只求你们……别伤孩子。');
    const c = await choose(['我们不是来杀人的。把抢走的东西还回来就行。', '狈村以后每年向石村进贡。']);
    if (c === 0) { F().peace = 1; await say('狈村老祭司', '（眼眶红了）……谢谢。'); give('lingyao', 3); gainExp(150); }
    else { F().tribute = 1; await say('狈烈', '（咬着牙）……好。'); addGold(300); }
  }
  await say('狈村老祭司', '石村的孩子，那只青鳞鹰……你们最好也去看看。它再这么闹下去，整片大荒都不得安宁。');
  return true;
}
async function S_eagle1() {
  await say('xiaobudian', '你要去青鳞鹰崖？！带我去带我去！……不行？（瘪嘴）那、那你给我带一根青鳞鹰的羽毛回来！');
  await say('xiaobudian', '族长爷爷屋里挂着一个好大的鸟头骨，他说那是很久很久以前的一只雷鸟……我也想要一只那么大的鸟！');
  tip('青鳞鹰崖在深山老林的<b>东边</b>。崖顶的大鹰很强，带上烤兽肉也许有别的办法。');
}
async function S_eagle2() {
  await nar('崖顶的大鹰发现了你。它收起翅膀落在崖边，一双金色的眼睛冷冷地盯着你，脚下的巢里传来几声细细的啼叫。');
  const hasMeat = itemN('meat') > 0;
  const c = await choose([{ t: '趁它离巢，爬上去摸一枚蛋' }, { t: '在崖下放一块烤兽肉，退开等着' + (hasMeat ? '' : '（需要烤兽肉）'), dis: !hasMeat }, { t: '堂堂正正地向它挑战' }]);
  if (c === 0) {
    await nar('你等到大鹰飞去捕食，手脚并用爬上绝壁。巢里卧着三枚青色的蛋，还带着体温。你刚抱起一枚——头顶一暗，一声尖啸撕裂了天空！');
    if (!await fightRetry({ mobs: [['eagle', slv(9)]], title: '护巢的青鳞鹰' })) return false;
    F().eagle = 'egg'; give('egg'); give('feather', 1); await nar('大鹰负伤飞走了，在高空盘旋着，久久不肯离去。你抱着鹰蛋，心里说不出是什么滋味。');
  }
  if (c === 1) {
    takeItem('meat'); await nar('你把烤兽肉放在崖下的大石上，退到远处坐下。过了很久，大鹰俯冲下来，叼起兽肉，却没有马上飞走。');
    await nar('它歪着头打量你，看了很久很久。然后它展开翅膀飞回崖顶——一根青色的长羽从空中飘落，正好落在你脚边。');
    F().eagle = 'friend'; give('feather', 2); gainExp(220);
  }
  if (c === 2) {
    await me('我不偷你的蛋，也不拿肉哄你。我就想看看，大荒里的青鳞鹰到底有多强！');
    if (!await fightRetry({ mobs: [['eagle', slv(9)]], title: '挑战 · 青鳞鹰' })) return false;
    F().eagle = 'respect'; await nar('大鹰落在你面前，收起了翅膀。它低下头，用喙轻轻碰了碰你的肩膀，然后长啸一声，飞回了巢里。'); give('feather', 3); giveEq('c3', 1);
  }
  return true;
}
async function S_eagle3() {
  if (F().eagle === 'egg') { await say('xiaobudian', '（抱着鹰蛋，眼睛亮得吓人）鹰蛋！是鹰蛋！我要把它孵出来，以后骑着它飞！'); await say('chief', '……（看着鹰蛋，叹了口气）也罢。好好养着，别让它饿着。'); }
  else if (F().eagle === 'friend') { await say('xiaobudian', '它自己给你的？！（捧着羽毛跳了起来）我也要去喂它！明天就去！'); await say('chief', '能让青鳞鹰低头的，不是力气。好孩子。'); }
  else { await say('xiaobudian', '你打赢了青鳞鹰？！哇——等我长大了，我也要去跟它打一架！'); }
  give('milk', 3);
  await say('chief', '{name}，有件事我想了很久。');
}
async function S_thunder1() {
  await say('chief', '我屋里那个鸟头骨，是我年轻时候在雷泽捡的，是一头雷鸟的。雷鸟死后，宝骨上刻着它一族的宝术。');
  await say('chief', '这些年雷泽里又出了一头雷鸟。要是能得到它的宝骨，石村就又多了一门宝术……还有它守着的天地精华，能让你突破境界。');
  await say('chief', '雷泽在青鳞鹰崖东边。那东西很凶，千万小心。');
}
async function S_thunder2() {
  await nar('雷云压得极低，沼泽里的水被电光照得发白。芦苇深处，一头浑身缠着电蛇的巨鸟缓缓抬起了头——它的每一根羽毛都在噼啪作响。');
  const allies = []; if (F().eagle === 'friend' || F().eagle === 'respect') { allies.push(['a_eagle']); await nar('一声熟悉的鹰啸从头顶传来。青鳞鹰穿过雷云，落在了你身边。'); }
  if (!await fightRetry({ mobs: [['thunderbird', slv(12, -2, 1)]], allies, title: '雷泽之主 · 雷鸟' }, '雷光吞没了你。等你醒来，自己躺在沼泽边上——那头雷鸟好像并不屑于追杀你。')) return false;
  await nar('雷鸟倒下了。它的骨头在雷光中显露出一道道符文，像是在你眼前慢慢写开——你看懂了。');
  F().thunder = 1; logLine(`领悟宝术：<b>🌩️雷鸟宝术</b>——${SKILLS.sk_thunder.desc}`, 'sys'); sfx('epic');
  give('jinghua'); give('thunderbone', 2);
  tip('获得<b>天地精华</b>。等级到 9 级、经验满了以后，在“角色”页点<b>突破</b>，就能进入洞天境。');
  return true;
}
async function S_break() {
  await nar('突破之后，你回到石村。村口站满了人，族长、石林虎、虎婶……还有骑在石大壮脖子上、拼命挥手的小不点。');
  await say('chief', '洞天境……石村几十年没出过这样的人了。（他从怀里掏出一封兽皮信）');
  await say('chief', '大荒太小，困不住你。出了山往北，有座石国的边城，我有个老朋友在那儿开交易行，姓钱。拿着这封信去找他。');
  await say('chief', '外面的天有多大，地有多广……替我们这些老骨头，去看一看。');
  give('letter');
  await say('xiaobudian', '（从石大壮脖子上滑下来，抱住你的腿）等我长大了，也去外面找你！说好了！');
  await nar('<b>【第二章 · 大荒 · 完】</b>');
  worldEvent('chapter', { ch: 2 });
  tip('出山的古道在<b>雷泽北边</b>。到了边城，就能用交易行、强化、虚神界和悬赏榜了。');
}
/* ---------------- 第三章 · 石国边城 ---------------- */
async function S_road() {
  await nar('古道上，一支商队被山匪团团围住。几辆兽车翻倒在路边，护卫已经倒下了好几个。一个独眼的匪首扛着鬼头刀，正狞笑着往前走。');
  const c = await choose(['冲上去帮忙', '绕开他们，悄悄走过去']);
  if (c === 1) { F().caravan = 'skip'; await nar('你从林子里绕了过去。身后传来商人的哭喊声。'); return true; }
  if (!await fightRetry({ mobs: [['bandit', slv(11)], ['banditboss', slv(13, -2, 1)], ['bandit', slv(11)]], title: '古道劫匪', tag: 'road' })) return false;
  F().caravan = 'saved'; await say('胡老板', '恩人！恩人呐！我姓胡，在边城做皮货生意，以后到了边城，尽管来找我！'); addGold(300); give('stone', 5);
  await nar('你坐着商队的兽车，一路晃到了边城。');
  return true;
}
async function S_city() {
  await nar('边城比石村大了不知多少倍。城门口人来人往，有扛着凶兽尸体的猎人，有骑着异兽的少年，有穿着长袍的符文师……');
  await nar('你站在城门口，忽然有点恍惚：原来外面的世界，真的这么大。');
  tip('边城是<b>主城</b>：市集有交易行和强化，客栈能休息，虚神殿能和其他玩家切磋，城主府有每日悬赏。去<b>市集</b>找钱掌柜送信。');
  F().city = 1; C.home = 'bc_inn';
}
async function S_broker() {
  await say('broker', '（读完信，哈哈大笑）石云峰这个老东西！几十年不来信，一来就给我塞个人！');
  await say('broker', '行，他的人就是我的人。不过边城不比石村，光有傻力气可不够。我考考你：去虚神殿赢一场，再去城主府揭一张悬赏。做完了来找我。');
  takeItem('letter');
}
async function S_prove() {
  await say('broker', '不错，不错！手上有功夫，脑子也不笨。（递过来一张符）这是保护符，强化的时候用得着。');
  give('protect'); addGold(200);
  await say('broker', '对了，虚神殿的主事托我带句话——最近虚神界里来了个了不得的少年，打遍边城无敌手，指名要见见“从大荒来的那个人”。');
}
async function S_shiyi() {
  await say('arenamaster', '你来了。他已经等你三天了。');
  await nar('你在光幕前盘膝坐下，神魂一沉——再睁眼时，已经站在一片灰白的虚空里。对面站着一个少年，衣着华贵，双手负在身后。');
  await nar('他抬起眼睛。你心里猛地一跳：他的每只眼睛里，都有两个瞳孔。');
  await say('重瞳少年', '大荒里来的？我听说那片穷山恶水里，出了几个有意思的人。让我看看，你是不是其中一个。');
  const win = await fight({ foes: [{ id: 'shiyi', name: '重瞳少年', cls: 'kunpeng', lv: C.lv + 3, gear: 1.35 }], title: '虚神界 · 重瞳', noLose: true, arena: 'story' });
  if (win) { F().shiyi = 'won'; await say('重瞳少年', '（看着自己被划破的衣袖，沉默了很久）……很好。下一次，我不会再留手。'); await nar('他转身走进虚空，消失了。光幕上，他的名字后面多了一行小字：“首败”。'); C.title = '虚神界新秀'; worldEvent('shiyi', {}); }
  else { F().shiyi = 'lost'; await say('重瞳少年', '你还不够。等你再强一些，再来找我。'); await nar('你从虚神界里醒来，满头冷汗。你记住了那双眼睛。'); }
  gainExp(400);
}
async function S_token1() {
  await say('portalkeeper', '这是补天阁的接引阵。补天阁收徒，只认引荐令，没有令牌，阵是不会亮的。');
  await say('portalkeeper', '引荐令？城里的大商家手里偶尔会有一两块。你去问问钱掌柜吧。');
}
async function S_token2() {
  await say('broker', '补天阁的引荐令？（摸着下巴）巧了，我手里还真有一块。不过……这东西金贵，我不能白给。');
  await say('broker', '我这儿有三件麻烦事：护送一支商队出城、帮客栈抓一个偷儿、帮铁匠修补传送阵的阵纹。你挑两件办了，令牌就是你的。');
}
async function S_escort() {
  await nar('商队刚出城门不远，路边的林子里就冲出了一伙山匪。');
  return await fightRetry({ mobs: [['bandit', slv(12)], ['bandit', slv(12)], ['bandit', slv(12)]], title: '护送商队' });
}
async function S_thief() {
  await say('innkeeper', '客官您可来了！那偷儿专挑住店的客人下手，偷了七八家了，可谁也没看清他长什么样。');
  await nar('你在大堂里坐了一下午。说书先生、两个喝酒的猎人、一个低头吃面的瘦子、一个抱着包袱打盹的胖商人。');
  const c = await choose(['盯着那个低头吃面的瘦子', '盯着那个抱着包袱打盹的胖商人', '盯着说书先生']);
  if (c === 1) { await nar('胖商人“打盹”的时候，手指却在桌子底下动来动去——旁边猎人的钱袋，不知什么时候到了他怀里。你一把扣住了他的手腕。'); await say('innkeeper', '就是他！装睡的！客官好眼力！'); gainExp(300); return true; }
  await nar(c === 0 ? '瘦子吃完面，付了钱，走了。他只是饿。' : '说书先生讲得口沫横飞，一下午都没离开过那张桌子。'); await nar('等你回过神来，胖商人已经不见了——连带着你腰间的几两碎银。');
  addGold(-30); const c2 = await choose(['追出去！', '算了']); if (c2 === 1) return false;
  return await fightRetry({ mobs: [['bandit', slv(12)]], title: '追捕偷儿' });
}
async function S_form() {
  if (itemN('ore') < 3 || itemN('lingyao') < 2) { await say('smith', '阵纹要用赤铜矿和灵药调的符泥来补。赤铜矿三块，灵药两株，凑齐了再来。'); return false; }
  takeItem('ore', 3); takeItem('lingyao', 2); await say('smith', '东西齐了！（叮叮当当敲了一下午）成了！这阵纹，补得比原来还结实。'); gainExp(300); return true;
}
async function S_token3() {
  await say('broker', '说到做到，痛快！（他郑重地把一块青玉令牌放在你手里）补天阁的引荐令。');
  await say('broker', '小子，补天阁可是大宗门，里头的天才多如牛毛。去了，别给石云峰丢脸。');
  give('token');
}
async function S_portal() {
  await say('portalkeeper', '引荐令……好，好。老头子又要送走一个了。');
  await nar('你把令牌嵌进阵心。地上的符文一个接一个亮起来，光芒冲天而起——你只觉得身子一轻，眼前一白。');
  takeItem('token'); go('bt_gate', true, true);
  await nar('再睁眼时，你站在云海之上。九座山峰悬在空中，铁索横空，仙鹤从脚下飞过。');
  await say('gatekeeper', '新来的？补天阁的规矩：入门之前，先走问心路。问心路在外门广场西边。');
  await nar('<b>【第三章 · 石国边城 · 完】</b>'); worldEvent('chapter', { ch: 3 });
}
/* ---------------- 第四章 · 补天阁 ---------------- */
async function S_heart() {
  await nar('石阶上雾气越来越浓。走着走着，四周的雾里浮现出了画面。');
  const score = { ren: 0, yong: 0, zhi: 0 };
  await nar('<b>第一幻：</b>石村在燃烧。天火从天而降，柳枝在火里挣扎。族长、虎婶、小不点……都在火里喊你的名字。');
  let c = await choose(['冲进火里，能救一个是一个', '去找柳神，只有它能挡住天火', '记住这场火是从哪里来的']); score[['ren', 'zhi', 'yong'][c]]++;
  await nar('<b>第二幻：</b>一个看不清面目的人站在你面前，手里托着一块流光溢彩的至尊骨。“拿去，它能让你天下无敌。代价是，你再也回不去石村。”');
  c = await choose(['不要。我有自己的路。', '先问清楚，这块骨头是从谁身上挖下来的？', '……我想要变强。']); score[['yong', 'zhi', 'ren'][c]]++;
  await nar('<b>第三幻：</b>小不点坐在一个空荡荡的大坑里哭。他胸口有一道很长的疤，抬头问你：“他们为什么要挖走我的骨头？”');
  c = await choose(['抱住他：“以后谁也不能欺负你。”', '“谁干的？告诉我。”', '“那你就长出一块更好的。”']); score[['ren', 'yong', 'zhi'][c]]++;
  const h = Object.entries(score).sort((a, b) => b[1] - a[1])[0][0]; F().heart = h;
  const T = { ren: ['仁', '心怀仁念，气血 +5%'], yong: ['勇', '一往无前，攻击 +5%'], zhi: ['智', '洞察入微，符力 +8%'] }[h];
  await nar(`雾散了。石阶尽头站着一位白发长老，看着你点了点头：“心性为<b>${T[0]}</b>。”`); logLine(`获得心性「${T[0]}」：${T[1]}`, 'sys');
  await nar('长老一拂袖，石阶上站起一具青铜傀儡。“最后一关。”');
  if (!await fightRetry({ mobs: [['puppet', slv(14, -1, 1)]], title: '问心路 · 试炼傀儡' })) return false;
  await nar('傀儡碎了一地。长老转身离去，只留下一句：“去外门报到吧。”');
  F().inSect = 1; C.home = 'bt_outer'; return true;
}
async function S_steward() {
  await say('steward', '问心路走下来了？好。从今天起，你就是补天阁外门弟子。（递过来一套青色道袍）');
  giveEq('a4', 1); give('elixir', 3);
  await say('steward', '外门弟子靠贡献说话。后山百断山是历练的地方，断口上镇着一道太古残魂——谁能打散它，谁就有资格参加外门大比。');
  tip('<b>百断山</b>在外门广场东边，建议 17 级以上、3 人组队。可以先去太古遗地、虚神界和悬赏榜提升自己。');
}
async function S_baiduanDone() {
  await say('steward', '你打散了太古残魂？！（他上下打量你，眼神变了）好，好！外门大比，记你一个名额。去找林师兄报名吧。');
  addGold(500); give('protect');
}
async function S_contest() {
  await say('senior', '你也报了外门大比？哈，正好，今年我可不想再拿第七了。');
  await nar('外门广场上人山人海。白玉擂台上，名字一个个被念出来。');
  let wins = 0;
  for (const [i, spec] of [[0, { mobs: [['disciple', slv(15)]], title: '外门大比 · 第一轮' }], [1, { mobs: [['disciple', slv(16)]], title: '外门大比 · 第二轮' }], [2, { foes: [{ id: 'lin', name: '林师兄', cls: 'mangniu', lv: C.lv + 2, gear: 1.3 }], title: '外门大比 · 决赛 · 林师兄' }]]) {
    if (i === 2) await nar('决赛。擂台对面，林师兄抱着拳，冲你咧嘴一笑。');
    const w = await fight(Object.assign({ noLose: true }, spec)); fullHeal(); refresh();
    if (!w) { await nar(i === 0 ? '你在第一轮就被打下了擂台。' : i === 1 ? '第二轮，你差了一口气。' : '林师兄的金身硬得像一座山，你最后一击没能打穿。'); break; }
    wins++;
  }
  const place = ['前十六', '前八', '第二', '魁首'][wins]; F().contest = wins;
  await nar(`外门大比结束。你的名次：<b>${place}</b>。`);
  if (wins === 3) { C.title = '外门魁首'; worldEvent('contest', {}); giveEq('w5', 3); }
  else if (wins === 2) { C.title = '外门亚军'; giveEq('w5', 2); } else giveEq('w4', 2);
  await say('senior', wins === 3 ? '（揉着胳膊）输给你，我服。' : '别灰心，明年再来！');
  await say('senior', '对了，你听说没？下界来了个小娃娃，在补天阁里横冲直撞，把好几位师兄的宝贝都“借”走了。据说……也是大荒来的。');
  await nar('你愣了一下，脑子里浮现出一张嘴角挂着白胡子的小脸。');
  await nar('<b>【第四章 · 补天阁 · 完】</b><br><br>《完美世界OL》第一卷到此结束。<br>补天阁、太古遗地、百断山、虚神界和世界首领都还开着——<br>第二卷，敬请期待。');
  worldEvent('chapter', { ch: 4 });
}

const MAIN = [
  { id: 'q_wake', ch: 1, title: '异乡人', goal: '在族长家醒来', type: 'auto', scene: S_wake },
  { id: 'q_willow', ch: 1, title: '祭灵', goal: '去村西的祭灵柳看看', type: 'enter', loc: 'sc_willow', scene: S_willow },
  { id: 'q_yard', ch: 1, title: '迎霞锻体', goal: '去村南的练武场', type: 'enter', loc: 'sc_yard', scene: S_yard },
  { id: 'q_hunt', ch: 1, title: '初入大荒', goal: '在山林小径猎杀山狼', type: 'kill', mob: 'wolf', n: 3, loc: 'fl_path', npc: 'hunterhu', scene: S_huntDone },
  { id: 'q_milk1', ch: 1, title: '偷奶贼', goal: '去村中石路问问虎婶', type: 'talk', npc: 'auntie', scene: S_milk1 },
  { id: 'q_milk2', ch: 1, title: '偷奶贼', goal: '去练武场找嘴边白白的人', type: 'talk', npc: 'xiaobudian', scene: S_milk2 },
  { id: 'q_den', ch: 1, title: '狼穴', goal: '清剿黑石林北边的狼穴（副本）', type: 'dungeon', dungeon: 'wolfden', loc: 'dn_gate', npc: 'chief', scene: S_denDone, rec: 5 },
  { id: 'q_bull', ch: 2, title: '莽牛坡', goal: '在莽牛坡猎杀莽牛', type: 'kill', mob: 'bull', n: 3, loc: 'mn_slope', npc: 'auntie', scene: S_bullDone, onEnter: { loc: 'mn_slope', scene: S_calf }, rec: 4 },
  { id: 'q_raid', ch: 2, title: '夜袭', goal: '去族长家', type: 'talk', npc: 'chief', scene: S_raid, rec: 7 },
  { id: 'q_bei', ch: 2, title: '狈村', goal: '前往狈村', type: 'enter', loc: 'bei_ruin', scene: S_bei, rec: 8 },
  { id: 'q_eagle1', ch: 2, title: '青鳞鹰', goal: '回石村，跟小不点说说青鳞鹰的事', type: 'talk', npc: 'xiaobudian', scene: S_eagle1 },
  { id: 'q_eagle2', ch: 2, title: '青鳞鹰', goal: '前往青鳞鹰崖', type: 'enter', loc: 'cl_eagle', scene: S_eagle2, rec: 9 },
  { id: 'q_eagle3', ch: 2, title: '青鳞鹰', goal: '回练武场告诉小不点', type: 'talk', npc: 'xiaobudian', scene: S_eagle3 },
  { id: 'q_thunder1', ch: 2, title: '雷泽宝骨', goal: '去族长家听族长说话', type: 'talk', npc: 'chief', scene: S_thunder1 },
  { id: 'q_thunder2', ch: 2, title: '雷泽宝骨', goal: '前往雷泽，挑战雷鸟', type: 'enter', loc: 'th_marsh', scene: S_thunder2, rec: 10 },
  { id: 'q_break', ch: 2, title: '洞天', goal: '突破到洞天境（10 级）', type: 'level', lv: 10, scene: S_break },
  { id: 'q_road', ch: 3, title: '出山', goal: '沿出山古道前往石国边城', type: 'enter', loc: 'road', scene: S_road, rec: 11 },
  { id: 'q_city', ch: 3, title: '边城', goal: '进入边城', type: 'enter', loc: 'bc_gate', scene: S_city },
  { id: 'q_broker', ch: 3, title: '送信', goal: '去市集把信交给钱掌柜', type: 'talk', npc: 'broker', scene: S_broker },
  { id: 'q_prove', ch: 3, title: '考校', goal: '虚神界胜一场，完成一张悬赏', type: 'multi', npc: 'broker', scene: S_prove, need: 2,
    subs: [{ k: 'arena', goal: '虚神殿：胜利 1 场', check: () => (C.arena.wins || 0) > (F().arena0 || 0) }, { k: 'bounty', goal: '城主府：完成 1 张悬赏', check: () => (C.stats.bounty || 0) > (F().bounty0 || 0) }],
    start: () => { F().arena0 = C.arena.wins || 0; F().bounty0 = C.stats.bounty || 0; } },
  { id: 'q_shiyi', ch: 3, title: '重瞳', goal: '去虚神殿见主事', type: 'talk', npc: 'arenamaster', scene: S_shiyi },
  { id: 'q_token1', ch: 3, title: '引荐令', goal: '去城北古传送阵看看', type: 'talk', npc: 'portalkeeper', scene: S_token1 },
  { id: 'q_token2', ch: 3, title: '引荐令', goal: '回市集找钱掌柜', type: 'talk', npc: 'broker', scene: S_token2 },
  { id: 'q_token3', ch: 3, title: '三件麻烦事', goal: '替钱掌柜办两件事', type: 'multi', npc: 'broker', scene: S_token3, need: 2,
    subs: [{ k: 'escort', goal: '护送商队：去出山古道', type: 'enter', loc: 'road', scene: S_escort }, { k: 'thief', goal: '捉拿偷儿：去悦来客栈打听', type: 'talk', npc: 'innkeeper', scene: S_thief },
      { k: 'form', goal: '修补阵纹：给铁匠王赤铜矿×3、灵药×2', type: 'talk', npc: 'smith', scene: S_form }] },
  { id: 'q_portal', ch: 3, title: '接引', goal: '去古传送阵，前往补天阁', type: 'talk', npc: 'portalkeeper', scene: S_portal, rec: 14 },
  { id: 'q_heart', ch: 4, title: '问心路', goal: '走一遍问心路（外门广场西边）', type: 'enter', loc: 'bt_trial', scene: S_heart, rec: 14 },
  { id: 'q_steward', ch: 4, title: '外门', goal: '去外门广场找赵执事报到', type: 'talk', npc: 'steward', scene: S_steward },
  { id: 'q_baiduan', ch: 4, title: '百断山', goal: '打散百断山断口上的太古残魂（副本）', type: 'dungeon', dungeon: 'baiduan', loc: 'bt_bdgate', npc: 'steward', scene: S_baiduanDone, rec: 17 },
  { id: 'q_contest', ch: 4, title: '外门大比', goal: '找林师兄报名外门大比', type: 'talk', npc: 'senior', scene: S_contest, rec: 18 },
  { id: 'q_end', ch: 4, title: '第一卷 · 完', goal: '第二卷敬请期待（日常、副本、世界首领、虚神界都还开着）', type: 'none' },
];
const SIDE = {
  sq_pelt: { npc: 'auntie', title: '虎婶的皮袄', minLv: 2, need: [['wolfpelt', 5]], ask: '入冬了，婶想给娃娃们缝几件皮袄，你能帮我弄五张狼皮来吗？', done: '好皮子！这件婶给你缝的皮衣，比你身上那件暖和！', reward: () => { giveEq('a1', 2); give('milk', 5); } },
  sq_venom: { npc: 'hunterhu', title: '淬毒箭', minLv: 4, need: [['venom', 4]], ask: '碧鳞蝎的毒囊能淬箭头，黑石林里多的是。弄四个来，我教你个好东西。', done: '好！这些止血草你拿着，进山用得着。', reward: () => { give('herb', 6); addGold(120); gainExp(150); } },
  sq_herb: { npc: 'pharma', title: '药婆婆的方子', minLv: 8, need: [['lingyao', 5]], ask: '老婆子缺几味灵药，五株就够。', done: '药香正！这几颗大还丹给你，比银子管用。', reward: () => { give('elixir', 3); addGold(200); } },
  sq_ore: { npc: 'smith', title: '赤铜', minLv: 10, need: [['ore', 6]], ask: '铺子里赤铜矿不够了，弄六块来，我送你一张保护符。', done: '够意思！保护符拿好，强化的时候贴上，碎不了。', reward: () => { give('protect'); give('stone', 5); } },
  sq_scale: { npc: 'senior', title: '太古鳞片', minLv: 20, need: [['ancientscale', 3]], ask: '太古遗地里的凶兽鳞片能炼宝贝，给我三片，我拿家传的玉佩跟你换。', done: '说话算话，玉佩给你！', reward: () => { giveEq('c5', 3); } },
};

/* ---------------- quest engine ---------------- */
const curQ = () => MAIN[C.story.q];
function questAdvance() {
  C.story.q = Math.min(MAIN.length - 1, C.story.q + 1); C.story.n = 0; C.story.subs = {}; const q = curQ(); if (q.start) q.start();
  logLine(`<span class="qnew">【主线】${q.title}</span>：${q.goal}`, 'quest'); save(); refresh(); setTimeout(storyPoll, 300);
}
async function runScene(fn) {
  if (STATE.scene) return false; STATE.scene = fn.name || 'scene'; netPub(); refresh(); let r;
  try { r = await fn(); } catch (e) { console.error(e); } finally { STATE.scene = null; dlgClose(); netPub(); save(); refresh(); }
  return r !== false;
}
async function questComplete(q) { const ok = await runScene(q.scene); if (ok && curQ() === q) questAdvance(); return ok; }
function questTalkOptions(npc) { // quest entries an NPC offers right now
  const q = curQ(), out = [];
  if (q.type === 'talk' && q.npc === npc) out.push({ t: '❗ ' + q.title, f: () => questComplete(q) });
  if ((q.type === 'kill' || q.type === 'dungeon') && q.npc === npc && questReady(q)) out.push({ t: '✔ 交付：' + q.title, f: () => questComplete(q) });
  if (q.type === 'multi') { for (const s of q.subs) if (s.type === 'talk' && s.npc === npc && !(C.story.subs || {})[s.k]) out.push({ t: '❗ ' + s.goal.split('：')[0], f: () => subComplete(q, s) }); if (q.npc === npc && questReady(q)) out.push({ t: '✔ 交付：' + q.title, f: () => questComplete(q) }); }
  for (const [id, S] of Object.entries(SIDE)) { if (S.npc !== npc || C.lv < S.minLv) continue; const st = C.side[id]; if (st === 'done') continue;
    if (!st) out.push({ t: '❔ ' + S.title, f: () => sideOffer(id) }); else if (S.need.every(([k, n]) => itemN(k) >= n)) out.push({ t: '✔ 交付：' + S.title, f: () => sideDone(id) }); }
  return out;
}
async function subComplete(q, s) { const ok = await runScene(s.scene); if (ok) { C.story.subs = C.story.subs || {}; C.story.subs[s.k] = 1; logLine(`【主线】完成：${s.goal.split('：')[0]}`, 'quest'); save(); refresh(); } }
function questReady(q) {
  if (q.type === 'kill') return C.story.n >= q.n;
  if (q.type === 'dungeon') return C.story.n >= 1;
  if (q.type === 'multi') { const subs = C.story.subs || {}; return q.subs.filter(s => s.check ? s.check() : subs[s.k]).length >= q.need; }
  return false;
}
function questGoalText() {
  const q = curQ(); let t = q.goal;
  if (q.type === 'kill') t += `（${Math.min(C.story.n, q.n)}/${q.n}）` + (questReady(q) ? ` → 回去找${NPCS[q.npc].name}` : '');
  if (q.type === 'dungeon' && questReady(q)) t += ` → 回去找${NPCS[q.npc].name}`;
  if (q.type === 'level') t += `（当前 ${C.lv} 级）`;
  if (q.type === 'multi') { const subs = C.story.subs || {}; t += '<br>' + q.subs.map(s => (s.check ? s.check() : subs[s.k]) ? `<s>${s.goal}</s>` : '· ' + s.goal).join('<br>'); if (questReady(q)) t += `<br>→ 回去找${NPCS[q.npc].name}`; }
  return t;
}
function questWhere() { // place id the quest wants you at (for the map marker and route hint)
  const q = curQ(); const npcLoc = n => Object.values(PLACES).find(p => (p.npcs || []).includes(n));
  if (q.type === 'enter') return q.loc; if (q.type === 'talk') return npcLoc(q.npc)?.id;
  if (q.type === 'kill' || q.type === 'dungeon') return questReady(q) ? npcLoc(q.npc)?.id : q.loc;
  if (q.type === 'multi') { if (questReady(q)) return npcLoc(q.npc)?.id; const subs = C.story.subs || {}; for (const s of q.subs) if (!(s.check ? s.check() : subs[s.k])) return s.loc || (s.npc && npcLoc(s.npc)?.id) || (s.k === 'arena' ? 'bc_arena' : s.k === 'bounty' ? 'bc_hall' : null); }
  return null;
}
function storyKill(mob) { const q = curQ(); if (q.type === 'kill' && q.mob === mob && C.story.n < q.n) { C.story.n++; logLine(`【主线】${q.title}：${NPCS[q.npc] ? '' : ''}${MOBS[mob].name} ${C.story.n}/${q.n}`, 'quest'); if (C.story.n >= q.n) logLine(`【主线】目标完成，回去找<b>${NPCS[q.npc].name}</b>交付。`, 'quest'); } bountyKill(mob); }
function storyDungeon(id) { const q = curQ(); if (q.type === 'dungeon' && q.dungeon === id) { C.story.n = 1; logLine(`【主线】${q.title}：完成！回去找<b>${NPCS[q.npc].name}</b>。`, 'quest'); } }
function storyItemCheck() { }
function storyLevelCheck() { setTimeout(storyPoll, 200); }
async function storyPoll() { // auto / level / enter triggers that fire without clicking
  if (!C || STATE.scene || STATE.battle || STATE.dungeon || STATE.mode !== 'play') return; const q = curQ();
  if (q.type === 'auto') return questComplete(q);
  if (q.type === 'level' && C.lv >= q.lv) return questComplete(q);
  if (q.type === 'enter' && C.loc === q.loc && !q.tried) { q.tried = 1; return questComplete(q); } // first time only; afterwards the ▶ 剧情 button retries
}
async function sideOffer(id) { const S = SIDE[id]; await runScene(async () => { await say(S.npc, S.ask); const c = await choose(['好，交给我', '下次吧']); if (c === 0) { C.side[id] = 'on'; logLine(`【支线】${S.title}：${S.need.map(([k, n]) => ITEMS[k].name + '×' + n).join('、')} → ${NPCS[S.npc].name}`, 'quest'); } }); }
async function sideDone(id) { const S = SIDE[id]; await runScene(async () => { for (const [k, n] of S.need) takeItem(k, n); await say(S.npc, S.done); S.reward(); C.side[id] = 'done'; }); }
