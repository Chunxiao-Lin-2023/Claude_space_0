/* ================= 闲聊: short conversations you can start with people =================
   Clicking someone shows 💬 闲聊 while they have something new to say at this point of the story. Each talk plays once.
   s: steps — [npc id or a name, line] · ['me', line] · ['nar', line] · ['ch', [option…], [[steps…] per option]]
   Same rules as CHATTER: from / to are main quest steps (checked by build.py), nothing runs ahead of the story. */
const TALKS = [
  // 石村
  { id: 'tk_chief1', npc: 'chief', from: 'q_wolf0', to: 'q_bei', s: [['chief', '小不点，你过来。今天跟谁打架了？'], ['me', '没有！'], ['chief', '那你袖子呢？'], ['me', '……被狼借走了。'], ['chief', '（族长扶着额头叹气）狼还会借袖子了。去，把这件换上。'], ['nar', '他扔过来一件新缝的小褂，针脚密得像鱼鳞。']] },
  { id: 'tk_chief2', npc: 'chief', from: 'q_yaoding', to: 'q_leave', s: [['chief', '你知道“骨文”是什么吗？'], ['ch', ['凶兽骨头上的花纹', '能吃的花纹？'], [[['chief', '对了一半。那是天地刻在它们身上的道理。认得了骨文，就认得了它们的本事。']], [['chief', '……（族长沉默了很久）你这辈子，是不是除了吃就没别的了？'], ['me', '还有睡觉。'], ['chief', '滚去练功！']]]]] },
  { id: 'tk_chief3', npc: 'chief', from: 'q_xushen0', to: 'q_leave', s: [['chief', '虚神界里，打得过就打，打不过……'], ['me', '就跑？'], ['chief', '……就记住他的样子，回来练。跑什么跑，石村的孩子不跑。'], ['me', '可你上次说打不过就跑。'], ['chief', '那是在墓里！虚神界又死不了人！']] },
  { id: 'tk_linhu1', npc: 'linhu', from: 'q_yard', to: 'q_tomb', s: [['linhu', '进山打猎，第一条规矩是什么？'], ['ch', ['别出声', '先吃饱'], [[['linhu', '对。第二条？'], ['me', '……还是先吃饱。'], ['linhu', '（林虎叔想了想）……也对。']], [['linhu', '（他张嘴想骂，又闭上了）……行吧，这条也算。饿着肚子拉不开弓。']]]]] },
  { id: 'tk_linhu2', npc: 'linhu', from: 'q_bei', to: 'q_leave', s: [['linhu', '小不点，我打了三十年猎，你知道最难打的是什么吗？'], ['me', '青鳞鹰？'], ['linhu', '是你婶子。'], ['nar', '远处传来一声“石林虎！你又在那儿说我什么？！”林虎叔的脸一下子白了。'], ['linhu', '……我什么都没说。你也什么都没听见。']] },
  { id: 'tk_dz1', npc: 'dazhuang', from: 'q_wake', to: 'q_egg', s: [['dazhuang', '小不点，你说，凶兽是生吃好吃，还是烤着好吃？'], ['ch', ['烤着', '看什么凶兽'], [[['dazhuang', '我也这么想！我们果然是好兄弟！']], [['me', '狼要烤，鸟要炖，蛇要熬汤。'], ['dazhuang', '（擦口水）……你懂得真多。你以后肯定能当族长。'], ['me', '当族长能多吃吗？'], ['dazhuang', '能！'], ['me', '那我当。']]]]] },
  { id: 'tk_dz2', npc: 'dazhuang', from: 'q_ruin', to: 'q_leave', s: [['dazhuang', '小不点，搬家那天，我把我家的肉干全扛上了。'], ['me', '那你爹娘呢？'], ['dazhuang', '……他们自己会走啊。'], ['nar', '大壮的爹在不远处，正好听见了这句话。'], ['nar', '那天晚上，大壮家传出了很响的声音。']] },
  { id: 'tk_ph1', npc: 'pihou', from: 'q_wake', to: 'q_tomb', s: [['pihou', '小不点，我教你一招“猴子偷桃”！'], ['ch', ['好啊', '你先打一遍'], [[['nar', '皮猴一爪子抓过来，你一侧身，他一头扎进了草垛。'], ['pihou', '（从草里探出头）……这招还有第二式，叫“猴子钻草”。']], [['nar', '皮猴打了一遍，摔了两跤，扭了一回脚。'], ['pihou', '这招是这样的，你学会了吗？'], ['me', '学会了。“别学”。']]]]] },
  { id: 'tk_ph2', npc: 'pihou', from: 'q_xushen0', to: 'q_leave', s: [['pihou', '小不点，虚神界里是不是有好多长角的、长翅膀的？'], ['me', '还有眼睛里有两个瞳孔的。'], ['pihou', '两个？那他看我是看到两个我吗？'], ['me', '……不知道。下回我问问。'], ['pihou', '你问的时候说我是你大哥！']] },
  { id: 'tk_em1', npc: 'ermeng', from: 'q_wake', to: 'q_bei', s: [['ermeng', '……（二猛看了看四周，压低声音）你要兽奶吗？'], ['ch', ['要', '哪儿来的？'], [[['nar', '他从怀里掏出一罐，又掏出一罐，又掏出一罐。'], ['me', '你身上到底装了多少？'], ['ermeng', '……够用。']], [['ermeng', '……你别问。问了你就是同伙了。'], ['me', '那我不问了。给我。']]]]] },
  { id: 'tk_em2', npc: 'ermeng', from: 'q_jijing', to: 'q_leave', s: [['ermeng', '毛球偷了族长的兽奶，族长以为是我。'], ['me', '然后呢？'], ['ermeng', '我挨了一顿骂。'], ['me', '那你冤啊。'], ['ermeng', '……不冤。我昨天也偷了。']] },
  { id: 'tk_willow1', npc: 'willow', from: 'q_egg0', to: 'q_leave', s: [['me', '柳神柳神，你吃东西吗？'], ['nar', '柳枝一动不动。'], ['me', '那你饿不饿？'], ['nar', '柳枝一动不动。'], ['me', '我给你带了块肉干——'], ['nar', '一根柳枝轻轻垂下来，把肉干推回了你手里，又在你脑袋上拍了拍。'], ['me', '……好吧，我自己吃。']] },
  { id: 'tk_willow2', npc: 'willow', from: 'q_memory', to: 'q_leave', s: [['me', '柳神，我要出村了。'], ['nar', '风停了。柳枝垂得很低，几乎碰到你的头顶。'], ['me', '我会回来的。到时候给你带外面的土，外面的水，还有外面的肉——'], ['nar', '柳枝在你额头上，轻轻弹了一下。'], ['me', '……好，肉就不带了。']] },
  // 补天阁
  { id: 'tk_qf1', npc: 'qingfeng', from: 'q_join', to: 'q_qf2', s: [['qingfeng', '你一顿吃九碗饭，伙房的人都在说。'], ['me', '他们做得好吃。'], ['qingfeng', '……我一顿吃一碗。'], ['me', '那你吃得太少了，所以才——'], ['qingfeng', '才什么？'], ['ch', ['才打不过我', '才这么好看'], [[['nar', '清风盯着你看了三息，转身走了。第二天，她练拳的木桩换成了石桩。']], [['nar', '清风愣了一下，耳朵慢慢红了，然后一拳砸在你肩膀上。'], ['qingfeng', '……吃你的饭去。']]]]] },
  { id: 'tk_qf2', npc: 'qingfeng', from: 'q_qf2', to: 'q_end', s: [['qingfeng', '小比的时候，我用了你那招“绕到背后”。'], ['me', '管用吧？'], ['qingfeng', '管用。就是守关的师兄说我“跟那个大荒来的一个德行”。'], ['me', '那是夸你。'], ['qingfeng', '……我知道。']] },
  { id: 'tk_gy1', npc: 'guiye', from: 'q_bully', to: 'q_end', s: [['me', '诡爷，你今天说了几个字了？'], ['guiye', '……'], ['me', '我数着呢，零个。'], ['guiye', '……一。'], ['me', '“一”也算？'], ['guiye', '……二。'], ['nar', '你觉得他在笑。可他的脸一点都没动。']] },
  { id: 'tk_gy2', npc: 'guiye', from: 'q_qf3', to: 'q_end', s: [['me', '诡爷，百断山里那把锈剑，你认识？'], ['guiye', '……'], ['nar', '诡爷看了你很久，伸手在你脑袋上按了一下，又放开。'], ['guiye', '……吵。'], ['me', '我就问了一句！'], ['guiye', '……一句，也吵。']] },
  { id: 'tk_gz1', npc: 'gezhu', from: 'q_bully', to: 'q_end', s: [['gezhu', '听说你把收份例的那几个师兄打了？'], ['me', '他们先动的手。'], ['gezhu', '嗯。打得好。'], ['me', '……你不罚我？'], ['gezhu', '罚。去伙房帮厨三天。'], ['me', '！！！'], ['gezhu', '……你是不是太高兴了？把厨子吓跑了我拿你是问。']] },
  { id: 'tk_gz2', npc: 'gezhu', from: 'q_lei', to: 'q_baiduan', s: [['gezhu', '神藤一年不如一年了。补天阁的根，都在它身上。'], ['me', '它渴吗？我去给它挑水。'], ['gezhu', '（阁主笑了）它要的水，不是井里的水。'], ['me', '那是哪儿的水？'], ['gezhu', '……等你再强一点，我告诉你。']] },
  { id: 'tk_lib1', npc: 'libelder', from: 'q_lib', to: 'q_end', s: [['libelder', '你，站住。'], ['me', '我什么都没拿。'], ['libelder', '那你怀里鼓的是什么？'], ['me', '……肉干。'], ['libelder', '藏经阁不许吃东西！'], ['ch', ['（老老实实交出来）', '（分他一半）'], [[['libelder', '……下不为例。（他把肉干揣进了自己袖子）']], [['libelder', '（他犹豫了一下，接了过去）……第五层的书，可以多看半个时辰。']]]]] },
  // 百断山
  { id: 'tk_hl1', npc: 'huolinger', from: 'q_lion', to: 'q_end', s: [['huolinger', '喂，小不点，打九头狮那次，是我出力多。'], ['me', '是我。'], ['huolinger', '是我！我放的火！'], ['me', '火是你放的，狮子是我打倒的。'], ['huolinger', '狮子是被火烧倒的！'], ['ch', ['好好好，你出力多', '那下次比比？'], [[['huolinger', '（她愣了一下）……你让我？我才不要你让！'], ['nar', '她气鼓鼓地走了。走了没两步，又回头冲你做了个鬼脸。']], [['huolinger', '比就比！谁输了谁请吃烤肉！'], ['me', '那我输了也有烤肉吃？'], ['huolinger', '……你脑子里除了吃还有什么？！']]]]] },
  { id: 'tk_hl2', npc: 'huolinger', from: 'q_cliff', to: 'q_end', s: [['huolinger', '你那只大红鸟，到底是什么来头？'], ['me', '它？它是我的鸟。'], ['huolinger', '我是问它是什么血脉！'], ['me', '（想了想）……很能吃的血脉。'], ['huolinger', '我的火鸟最近茶饭不思，老往它那儿看。'], ['me', '那它俩……'], ['huolinger', '不许说！']] },
];
const talkNext = id => TALKS.find(T => T.npc === id && !(C.talked || {})[T.id] && C.story.q >= qi(T.from) && C.story.q <= qi(T.to));
async function talkSteps(steps) { for (const st of steps) { const [w, t, r] = st;
  if (w === 'me') await me(t); else if (w === 'nar') await nar(t); else if (w === 'ch') { const c = await choose(t); await talkSteps(r[c] || []); } else await say(w, t); } }
function talkPlay(id) { const T = talkNext(id); if (!T) return; (C.talked = C.talked || {})[T.id] = 1; save(); return runScene(() => talkSteps(T.s), { title: '闲聊' }); }
