/* ================= battle banter: everyone talks, briefly =================
   On top of SAY (enemy open / low / die), fights now have:
     · more lines per enemy, plus 'hit' (it lands a heavy blow) and 'miss' (you dodge it)
     · 石昊 answering back by kind of foe (beast → it's dinner; people → cheek; ghosts → mild disgust), on a crit, a kill, low health, a pill, a win
     · the 灵兽伙伴 and companions reacting (beasts in （）)
   At most two extra lines a round, so the fight stays readable. All lines are original; none goes past the story. */
const SAY_MORE = {
  boar: { open: ['（野猪打了个响鼻，一脸“你瞅啥”。）', '（它冲你哼哼两声，獠牙上还挂着半截树根。）'], low: ['（它开始后悔今天出门了。）'], die: ['（这头野猪用一生证明了：獠牙不能当饭吃，但它能。）'], hit: ['（獠牙一挑，你在空中多转了半圈。）'] },
  wolf: { open: ['（山狼舔了舔嘴唇。它显然把你当成了今天的口粮——它错了。）', '（头狼回头看了一眼，确认兄弟们都在。）'], low: ['（它犹豫了一下要不要喊兄弟。）'], die: ['（狼群里少了一个声音。）'], hit: ['（狼牙擦着你的胳膊过去，带走了一块袖子。）'], miss: ['（扑了个空，山狼一头扎进了草窠。）'] },
  monkey: { open: ['（石猿冲你做了个鬼脸。毛球在你肩上，回了它一个更丑的。）'], hit: ['（一块石头正中你脑门。石猿高兴得直拍巴掌。）'], die: ['（石猿手里的石头滚了出去，它最后看了一眼天。）'] },
  snake: { open: ['（青鳞蛇吐着信子，在掂量你这一口能不能吞下去。）'], die: ['（蛇身软了下去。你在想蛇羹放不放姜。）'], miss: ['（它咬了个空，牙磕在石头上，“嘎嘣”一声。）'] },
  owl: { open: ['（夜枭的脑袋转了一整圈，盯着你。）'], miss: ['（它扑了个空，在半空中“咕？”了一声。）'] },
  rhino: { open: ['（两个脑袋在争谁先上，差点自己打起来。）'], hit: ['（两股火同时喷过来，你闻到了自己头发焦了的味道。）'] },
  eagle: { hit: ['（爪子在你背上犁出几道血口。）'], miss: ['（它一爪抓空，抓碎了半块山岩。）'] },
  tombguard: { open: ['（石兽活动了一下脖子，咔咔作响——它好几百年没动过了。）'], hit: ['（石爪拍下来，地上多了个坑。）'] },
  tombbat: { open: ['（蝙蝠们吱吱乱叫，有几只撞到了一起。）'], die: ['（蝠群散了，墓道里安静了不少。）'] },
  suanni: { open: ['墓里清净了几百年……你们这些小东西，一个比一个吵。'], low: ['……有点意思。几百年了，头一回有人把我打疼。'], hit: ['跪下。……哦，你还站着。'] },
  beihunter: { open: ['兄弟们，就一个奶娃娃，别丢狈村的脸！', '我数三声，你把珠子扔过来——一！'], low: ['说好的奶娃娃呢？！', '风狈哥，这跟说好的不一样啊！'], die: ['我……我就是来凑个数的……'], hit: ['中了！我射中了！……他怎么还在笑？'] },
  fengbei: { open: ['小娃娃，你知道“风狈”两个字在大荒值多少钱吗？'], low: ['祖灵……祖灵你倒是使劲啊！', '我还没成年！这次不算！'], hit: ['疼吗？风里有刀，刀里有风。'] },
  lielao: { open: ['老夫在狈村横了五十年。'], low: ['……这娃娃到底吃什么长大的？'] },
  leopard: { open: ['（赤豹的身影一晃，你只看见一道红光。）'], miss: ['（它扑过头了，在地上打了个滚，假装是故意的。）'] },
  python: { open: ['（巨蟒慢慢绕着你转圈，像在量尺寸。）'], hit: ['（蛇尾一甩，你被抽得原地转了三圈。）'] },
  bear: { open: ['（黑罴人立起来，比两个你还高。它拍了拍胸口，震下来一身灰。）', '（它闻了闻空气，好像闻到了你身上的兽奶味。）'], low: ['（它坐在地上喘粗气，看起来想吃口蜂蜜冷静一下。）'], die: ['（黑罴轰然倒下，压断了一片灌木。）'], hit: ['（一熊掌下来，你眼前全是星星。）'] },
  bandit: { open: ['此山是我开，此树是我栽——', '兄弟们，这娃娃身上的兽皮能卖钱！', '小孩，你家大人呢？'], low: ['大、大侠饶命！我上有八十老母——', '这年头打劫个小孩都这么难吗？！'], die: ['早知道……就去种地了……'], hit: ['怕了吧？怕了就把肉干交出来！'], miss: ['人呢？刚才还在这儿的！'] },
  jiling: { hit: ['你的恐惧……真好吃……', '嘻……再害怕一点……'], miss: ['你……躲得掉……一次……'] },
  tiger: { open: ['（黑纹虎打了个哈欠，露出一嘴比你胳膊还长的牙。）'], hit: ['（虎爪带着腥风扫过来，你被拍进了洞壁。）'], die: ['（虎穴之主倒在黑水边上。你开始盘算虎皮能做几件坎肩。）'] },
  ape: { open: ['（雷猿拍了拍胸口，掌心冒出一串电火花。）'], hit: ['（你被电得头发全竖了起来。）'] },
  puppet: { open: ['（傀儡的眼睛亮起一行阵纹：入侵者。）'], hit: ['（铜拳砸下来，像被一口大钟撞了。）'] },
  senior: { open: ['小师弟，规矩就是规矩。', '外门的份例，内门的规矩，懂？', '诡爷不管事，阁主不在家——今天我说了算。'], low: ['你、你把我的玉冠打歪了！', '师弟！师弟有话好说！份例不要了！'], die: ['……我回去就闭关，谁也别来找我……'], hit: ['这一下，是替补天阁教你的。'] },
  wisp: { open: ['（鬼火在你耳边“呼——”地吹了一口凉气。）'], miss: ['（鬼火扑了个空，害羞地暗了一下。）'] },
  lion: { hit: ['（九张嘴同时咬过来，你只来得及躲开八张。）'], miss: ['（九个脑袋撞在了一起。有两个开始互相瞪眼。）'] },
  yuzu: { open: ['冻成冰雕，带回去也好看。', '雨族的冰，从来不化。'], low: ['冰……冰化了？！这不可能！'], hit: ['冷吗？会更冷的。'] },
  bigwolf: { open: ['（白狼的毛上挂着冰碴，一张嘴，一口白雾。）'], die: ['（白狼倒下的地方，沙子上结了一层霜。）'] },
  yuchief: { open: ['我只说一遍：跪下，留全尸。'], hit: ['冰封千里——你就站在这一里。'], miss: ['……身法不错，可惜是个短命的。'] },
  dahongbird: { open: ['（它把你的肉咽了下去，打了个嗝，然后才想起来跟你打架。）', '（大红鸟冲你“嘎”了一声，听起来很像骂人。）'], hit: ['（它一嘴啄在你脑门上，啄完还骄傲地抖了抖羽毛。）'], die: ['（大红鸟扑棱着跑了，临走回头又“嘎”了一声——这梁子结下了。）'], miss: ['（它啄空了，一头撞在树上，假装是在磨嘴。）'] },
  scorpion: { open: ['（毒蝎举起两只大钳子，“咔嚓咔嚓”，像在鼓掌。）'], die: ['（蝎壳碎了。你想起林虎叔说过，烤蝎子是香的。）'] },
  whitetiger: { hit: ['（白虎一掌拍下，你像片叶子一样飞了出去。）'], die: ['（白虎低低地吼了一声，伏倒在泉边。它守了一辈子的泉。）'] },
  jinpeng: { hit: ['（金鹏的翅膀扫过来，带起的风像刀。）'], die: ['（金鹏坠了下来，半边身子的金光，一点一点熄了。）'] },
  bonewraith: { open: ['……肉……身……', '……好……暖……'], miss: ['……抓……不住……'] },
  boneking: { hit: ['……跪下……', '……蝼蚁……'] },
  pumo: { hit: ['（花粉迷了眼，你看见族长在冲你招手。……不对，族长不会笑得这么好看。）'] },
  monkeyking: { open: ['那两个桃，我等了三百年。', '本王的桃，你也配吃？'], low: ['……有点疼。好久没疼过了。'], hit: ['这一锤，叫你记住花果山。'] },
  peach: { open: ['（一只小猴子冲你扔了个桃核，正中脑门。）'], die: ['（小猴子们一哄而散，有一只临走还顺走了你一块肉干。）'] },
  leishou: { open: ['（它看你的眼神，像在看一根避雷针。）'], hit: ['（一道雷劈在你头顶。你闻到了自己烤熟的味道。）'] },
  r_rhino: { die: ['（独角兕倒下了。它的角，够做三把刀。）'] },
  r_snake: { die: ['（巨蟒软软地瘫在地上。够全村吃三天。）'] },
  r_bird: { die: ['（雷翅雕坠下来，羽毛还在噼啪放电。）'] },
};
for (const [k, v] of Object.entries(SAY_MORE)) { SAY[k] = SAY[k] || {}; for (const [kind, L] of Object.entries(v)) SAY[k][kind] = [...(SAY[k][kind] || []), ...L]; }
Object.assign(RIVAL_SAY.rival, { hit: ['就这？', '这一下，替我们族记账。'], miss: ['……躲得倒快。'] });
RIVAL_SAY.rival.open.push('我族长老说，大荒只出蛮子。', '赢了你，我就能上前一百了。', '你身上……怎么一股烤肉味？');
RIVAL_SAY.rival.low.push('等等！我、我刚才没准备好！', '这不对！你一个大荒来的——');
RIVAL_SAY.rival.die.push('……回去我就闭关。', '光幕前那么多人看着呢……', '这把不算！明天再来！');
RIVAL_SAY.shiyi.open.push('你的名字，我在光幕上见过很多次了。', '……你很像一个人。');
RIVAL_SAY.shiyi.hit = ['……看清楚了。', '你的宝术，我看过一遍就够了。'];

const FOE_KIND = id => ['lingyi', 'fengyin', 'beihunter', 'fengbei', 'lielao', 'bandit', 'senior', 'yuzu', 'yuchief', 'yuwangling', 'shiziteng', 'yuwai', 'wanghou', 'shichong', 'butianjiao', 'bulaoshan', 'ningjin', 'shenming', 'shenming2', 'mozhu', 'qingluan', 'jinwu', 'tianjiao', 'zhengzu', 'wuji', 'jitanshi', 'txdizi', 'tianrenzu', 'tianming', 'yaolong'].includes(id) ? 'human' : ['jiling', 'wisp', 'suanni', 'bonewraith', 'boneking', 'tombguard', 'puppet', 'yinbing', 'yinhun', 'zhanhun', 'gutaihun', 'gutaiwang', 'baoling'].includes(id) ? 'ghost' : 'beast';
const HERO_SAY = {
  open: { beast: ['……这么大一只，够全村吃三天。', '你是清蒸，还是红烧？', '别跑啊，我还没想好怎么烤你。', '大壮说过，长得越凶的，肉越香。'], human: ['你话真多。', '打完再说。', '我饿了，快点。', '族长说，话多的都打不过我。', '你们是一起上，还是排队？'], ghost: ['……这个不能吃吧？', '你没有肉，我打你有什么好处？', '柳神说过，你们这种东西，怕打。'], rival: ['大荒来的，怎么了？', '让我三招？那你可别后悔。', '赢了你，晚上加个鸡腿。'] },
  crit: ['这一下，是替我们村的老母鸡打的！', '舒坦！', '族长！你看见没！', '嘿，正中！', '这一拳，我在空地上练了三百遍。'],
  kill: { beast: ['今晚加餐！', '毛球，生火！', '这张皮，给大壮做个坎肩。', '别浪费，扛回去。'], human: ['下回出门，记得看看黄历。', '回去告诉你们头儿，大荒的娃娃不好惹。', '……我都说了，我饿了。'], ghost: ['散了好。', '……嗯，还是不能吃。'], rival: ['承让。', '下回见。'] },
  low: ['……还行，还能打。', '族长说过，疼说明还活着。', '再来！刚才那下我是让着你！'],
  item: ['（一口吞下）……比族长熬的药好喝。', '（嚼嚼嚼）再来一口。', '（咕咚）好了，我又行了。', '嘿嘿，没想到吧？我带了干粮。'],
  dodge: ['没打着～', '慢了。', '你瞄哪儿呢？'],
  win: ['收工！', '吃饭吃饭！', '……就这么点本事？', '下一个！'],
};
const PET_SAY = {
  maoqiu: { act: ['（毛球吱的一声蹿了出去，顺手在敌人头上薅了一把毛。）', '（毛球冲敌人做了个鬼脸，然后才出手。）'], heroCrit: ['（毛球在旁边拍着巴掌，吱吱乱叫。）', '（毛球学着你的样子挥了一拳，差点把自己甩飞。）'], heroLow: ['（毛球急得在你肩上直跳，把一颗果子塞进你嘴里。）', '（毛球龇着牙挡在你前面，浑身的金毛都炸了起来。）'], kill: ['（毛球第一个冲过去，翻敌人的口袋。）'], win: ['（毛球已经在掏战利品了，掏出来的一半直接塞进了自己嘴里。）'] },
  dahong: { act: ['（大红“嘎”了一声，意思大概是：看好了，学着点。）', '（大红俯冲下去，临走还在敌人头上拉了一泡。）'], heroCrit: ['（大红嘎了一声，好像在说“还行”。）'], heroLow: ['（大红扑过来，用翅膀把你罩住，冲敌人嘎嘎乱骂。）'], kill: ['（大红叼起敌人掉下的东西就飞，被你一把揪住了尾巴。）'], win: ['（大红落在你头上，一副“都是我打的”的样子。）'] },
  ertuzi: { act: ['（二秃子“啾”地一声冲上去——又“啾”地一声跑了回来。）', '（二秃子光溜溜的身子突然亮了一下，像一颗小太阳。）'], heroCrit: ['（二秃子在你衣领里激动得直扑腾，啾啾啾！）'], heroLow: ['（二秃子从衣领里探出头，冲敌人啄了一口，然后吓得缩了回去。）'], kill: ['（二秃子盯着地上的东西，口水滴了下来。）'], win: ['（二秃子打了个饱嗝。它什么时候吃的？）'] },
};
const ALLY_SAY = {
  a_kids: { open: ['大壮：“小不点，我们来了！”二猛：“……我偷了两罐兽奶。”'], heroCrit: ['大壮：“好！！再来一下！”'], heroLow: ['二猛：“（塞过来一罐兽奶）喝。偷的。”'], win: ['大壮：“回去别告诉族长……”'] },
  a_huo: { open: ['先说好，打死了算我的。', '你打左边，我打右边——不对，我全打了。'], heroCrit: ['……哼，还行吧。', '这一下……我也能打出来！'], heroLow: ['喂！你别死啊！', '让开，换我来！'], win: ['这次算平手。', '你欠我一只烤鸟——不是我的鸟！'] },
  a_yunxi: { open: ['……小心它的左翼。'], heroCrit: ['……不错。'], heroLow: ['站到我身后。'], win: ['……你流血了。（她递过来一块手帕，又收了回去）算了，你用袖子吧。'] },
  a_linhu: { open: ['小不点，跟紧我！'], heroCrit: ['好小子！'], heroLow: ['退后！我来！'], win: ['回去别跟你族长说我带你打的。'] },
  a_chief: { open: ['让爷爷看看你长进了没有。'], heroCrit: ['好！这一拳有我当年的样子！'], heroLow: ['小不点！'], win: ['……长大了。'] },
  a_lion: { open: ['大哥！这几个交给我！……您先上，我在后面看着。', '（九个脑袋同时冲敌人龇牙，有一个龇得太用力，咬到了旁边那个。）'], heroCrit: ['大哥威武！九个脑袋给您鼓掌！', '（九个脑袋齐声吼了一嗓子，震得石头直掉。）'], heroLow: ['大哥别怕！我挡着！……您别看我的头，我说的是用身子挡！'], win: ['大哥，这些……能吃吗？我是说，您吃，我看着。'] },
  a_eagle: { open: ['（小鹰冲你叫了一声，飞到了你头顶。）'], heroCrit: ['（小鹰在空中翻了个跟头。）'], win: ['（小鹰落在你肩上，用脑袋蹭了蹭你。）'] },
};

/* ---------- when to speak ---------- */
const bq = B => { if (B.bqR !== B.round) { B.bqR = B.round; B.bqN = 0; } return B.bqN < 2; };
function bSay(B, u, text, cls = 'foe') { if (!text) return; B.bqN = (B.bqN || 0) + 1; fxe(B, { k: 'say', t: u.id, text }); blog(B, `<span class="taunt"><span class="${cls}">${esc(u.name)}</span>：${text.startsWith('（') || /^[^：]{1,4}：“/.test(text) ? text : '「' + text + '」'}</span>`); }
const heroOf = B => B.units.find(u => u.kind === 'pc');
const partnerOf = B => B.units.find(u => u.pet && u.alive);
const alliesOf = B => B.units.filter(u => u.side === 0 && u.kind === 'npc' && !u.pet && u.alive && ALLY_SAY[u.mob]);
function foeKindOf(B) { const f = B.units.find(u => u.side === 1); return !f ? 'beast' : f.kind === 'rival' ? 'rival' : FOE_KIND(f.mob); }
function banterOpen(B) { const h = heroOf(B), al = alliesOf(B); if (al.length && chance(0.7)) { const a = al[0], L = ALLY_SAY[a.mob].open; if (L) bSay(B, a, pickFresh(L), 'pc'); }
  if (chance(0.45)) bSay(B, h, pickFresh(HERO_SAY.open[foeKindOf(B)]), 'pc'); B.bqN = 0; }
function banterHit(B, a, d, info) { if (!a || !d || info.dot || B.over) return;
  if (a.kind === 'pc' && info.crit && d.side === 1 && bq(B)) { const p = partnerOf(B), al = alliesOf(B); const r = Math.random();
    if (r < 0.3) bSay(B, a, pickFresh(HERO_SAY.crit), 'pc'); else if (r < 0.55 && p && PET_SAY[p.mob]) bSay(B, p, pickFresh(PET_SAY[p.mob].heroCrit), 'pc'); else if (r < 0.75 && al.length && ALLY_SAY[al[0].mob].heroCrit) bSay(B, al[0], pickFresh(ALLY_SAY[al[0].mob].heroCrit), 'pc'); return; }
  if (d.kind === 'pc' && a.side === 1 && d.hp > 0 && bq(B)) { const S = sayOf(a);
    if (info.crit && S && S.hit && chance(0.5)) return bSay(B, a, pickFresh(S.hit));
    if (!B.lowSaid && d.hp < d.hpMax * 0.4 && !B.epic) { B.lowSaid = 1; const p = partnerOf(B), al = alliesOf(B);
      if (al.length && ALLY_SAY[al[0].mob].heroLow && chance(0.6)) return bSay(B, al[0], pickFresh(ALLY_SAY[al[0].mob].heroLow), 'pc');
      if (p && PET_SAY[p.mob] && chance(0.7)) return bSay(B, p, pickFresh(PET_SAY[p.mob].heroLow), 'pc'); if (chance(0.5)) bSay(B, d, pickFresh(HERO_SAY.low), 'pc'); } } }
function banterMiss(B, a, d) { if (!a || !d || B.over || !bq(B)) return; if (a.side === 1 && d.kind === 'pc' && chance(0.3)) { const S = sayOf(a); if (S && S.miss && chance(0.6)) bSay(B, a, pickFresh(S.miss)); else bSay(B, d, pickFresh(HERO_SAY.dodge), 'pc'); } }
function banterKill(B, a, d) { if (!d || d.side !== 1 || !a || !bq(B)) return; const last = !alive(B, 1).length;
  if (a.kind === 'pc' && chance(last ? 0.5 : 0.25)) bSay(B, a, pickFresh(HERO_SAY.kill[d.kind === 'rival' ? 'rival' : FOE_KIND(d.mob)]), 'pc');
  else if (a.pet && PET_SAY[a.mob] && chance(0.4)) bSay(B, a, pickFresh(PET_SAY[a.mob].kill), 'pc'); }
function banterAct(B, u) { if (u.pet && PET_SAY[u.mob] && chance(0.12) && bq(B)) bSay(B, u, pickFresh(PET_SAY[u.mob].act), 'pc'); }
function banterWin(B) { if (!B.win || B.epic) return; const h = heroOf(B), p = partnerOf(B), al = alliesOf(B), r = Math.random();
  if (al.length && ALLY_SAY[al[0].mob].win && r < 0.5) bSay(B, al[0], pickFresh(ALLY_SAY[al[0].mob].win), 'pc'); else if (p && PET_SAY[p.mob] && r < 0.65) bSay(B, p, pickFresh(PET_SAY[p.mob].win), 'pc'); else if (h.alive && r < 0.85) bSay(B, h, pickFresh(HERO_SAY.win), 'pc'); }
