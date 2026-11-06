/* ================= 第二十九夜 · 法老的诅咒 ================= */
(() => {
  /* ---------- 小工具 ---------- */
  const bx2 = (R, x, y, w, h, fill, edge) => { R(x, y, w, h, edge || shade(fill, -.45)); R(x + 1, y + 1, w - 2, h - 2, fill); };
  const cycle = (S, key, lines) => lines[(S.f[key] = ((S.f[key] ?? -1) + 1) % lines.length)];
  const GOLD = '#d8a830', GOLD2 = '#f0cc60', GOLDD = '#8a6418', LAPIS = '#24408a', LAPIS2 = '#3a5cb0', FAI = '#3a9a9a';
  const RS = '萨拉姆老爹', MO = '莫顿', HA = '哈米德先生';
  /* 墓室壁画：照国王走过的路——东墙送葬 → 北墙从右往左三幅 → 西墙十二狒狒 */
  const ORDER = ['pE', 'pN1', 'pN2', 'pN3', 'pW'];
  const JUNC = { j1: 'b1', j2: 'b2', j3: 'b3' };
  const CHASERS = ['pw', 'pw2'];
  let rustleT = 0, genT = 0;
  const SPD = [2.8, 2.95, 3.1];
  /* 墓门上的六种印（密码盘只用数字键，避免字母触发引擎快捷键） */
  const SEALS = ['一只站着的胡狼，举着一把刀', '一只趴着的胡狼，底下九个捆着手的人', '一个椭圆圈，圈里是一只流着三道泪的眼睛', '一个椭圆圈，圈里：篮子、圣甲虫、三道竖、太阳', '一只张开翅膀的秃鹫，爪下一行字「死亡将展开翅膀」', '一个骷髅，底下两根交叉的骨头'];
  const SEAL_OK = '24';

  /* ---------- 合成音效（双方都听得到；都很短，不提前排长串） ---------- */
  const genHum = (S, v = .03) => { for (let i = 0; i < 6; i++) S.tone('square', 52, 50, .1, v, i * .14, 300); };
  const genDie = S => { for (let i = 0; i < 4; i++) S.tone('square', 56 - i * 6, 42 - i * 5, .16, .035 - i * .006, i * .22, 280); S.tone('sawtooth', 90, 30, 1.1, .02, .1, 400); };
  const flutter = (S, v = .04, n = 10) => { for (let i = 0; i < n; i++) S.tone('triangle', 900 + (i % 3) * 140, 300, .05, v * (1 - i / n * .5), i * .055, 2400); };
  const thud = (S, v = .08) => { S.tone('sine', 90, 45, .25, v, 0, 400); S.tone('triangle', 180, 80, .08, v * .5, 0, 900); };
  const buzz = S => { S.tone('sawtooth', 120, 120, .35, .02, 0, 700); S.tone('sine', 1760, 1700, .12, .02, .05, 0); };
  const litNote = (S, i) => { const f = [294, 330, 392, 440, 494][i] || 523; S.tone('sine', f, f, 1.2, .05, 0, 2600); S.tone('triangle', f * 2, f * 2, .6, .015, .04, 3000); };
  const shriek = S => { S.tone('sawtooth', 1400, 200, 1.1, .03, 0, 2600); flutter(S, .05, 14); };
  const clank = S => { S.tone('square', 220, 180, .12, .03, 0, 1200); S.tone('triangle', 660, 600, .3, .02, .03, 2000); };
  /* 前室危险段里的可调查物：对话会让追逐暂停又不公平，危险时只弹提示 */
  const look = text => async S => { if (S.f.ph === 'dark') return S.toast(text.split('\n')[0]); return S.narr(text); };

  /* ================= 帝王谷：开场 ================= */
  async function valleyEnter(S, first) {
    if (!first) return;
    await S.narr('四月的帝王谷，白天的石头烫得能烙饼。\n到了夜里，冷风从山口灌下来，吹得篝火一伏一伏的。');
    S.face('reis', 'pl');
    await S.say(RS, ['卡里姆，把火拨一拨。', '后半夜还长着呢。']);
    await S.say(RS, ['开罗来的人说，勋爵还烧着，一天比一天不好。', '卢克索的旅馆里住满了外国报社的人。白天在谷口转，晚上在酒馆里写稿子。']);
    S.show('paper'); S.sfx('paper'); flutter(S, .025, 6);
    await S.narr('一阵风卷过来，一张报纸翻着跟头，贴着地滚进了火光里。');
    await S.say(RS, '你在卢克索念过教会学校，认得洋文。捡起来，给我念念——他们又写了些什么。');
    S.goal('捡起被风吹来的报纸，念给老爹听');
  }
  async function paperOn(S) {
    await S.note('news');
    if (S.f.paper) return;
    S.f.paper = true; S.hide('paper'); S.give('news', true);
    S.face('reis', 'pl');
    await S.say(RS, ['「死亡将展开翅膀」……', '哼。我在这条谷里挖了四十年土，没见过谁的墓里刻着这种话。', '泥板呢？谁见过？你去问问写报纸的人。']);
    S.goal('和老爹聊聊（问问墓门上的事）');
  }
  async function reisOn(S) {
    S.face('reis', 'pl');
    if (S.f.gate) return S.say(RS, cycle(S, '_rg', ['快下去吧。灯提稳，别碰任何东西。', '我在上头看着发电机。灯要是灭了，我来弄。', '……愿真主保佑你，孩子。']));
    if (!S.f.paper) return S.say(RS, '报纸呢？捡过来，念给我听听。');
    for (;;) {
      const opts = ['「报上说的诅咒，是真的吗？」', '「第一级台阶，是怎么找到的？」', '「墓门上的印，是什么样子？」', '（没事了）'];
      const r = await S.ask('你问老爹：', opts, RS);
      if (r === 3) break;
      if (r === 0) {
        S.f.aCurse = true;
        await S.say(RS, ['诅咒？我挖出来过罐子、麻布、骨头，最多的是沙子。诅咒，没见过。', '你知道报纸为什么这么写？勋爵把消息卖给了伦敦的一家报社。别家报社进不了谷，拍不着照片，就只好在外头编。', '墓里真正写着的字，画工优素福给我念过。前室门口那只白石头杯子上，刻的是祝福，不是诅咒。', '文物局的人说，没被盗空的墓，里头的东西就该留在埃及。', '这是他的家。是我们的老祖宗给他盖的。']);
      } else if (r === 1) {
        S.f.aStep = true;
        await S.say(RS, ['去年十一月四号早上。我们在拉美西斯六世墓口底下清古时候工匠住的小屋地基。', '铲子底下「当」的一声——是一级凿进石头里的台阶。', '有人说，是送水的孩子先发现的：他放水罐的时候，罐底碰着了石头。各村说法不一样，谁也说不准。', '可是那十六级台阶、那一甬道的碎石，是我们的人一筐一筐背出来的。', '工头的名字，都记在我那本记工簿上。']);
      } else {
        S.f.aSeal = true;
        await S.say(RS, ['那扇门，我亲眼看着它一点一点露出来的。灰泥上盖满了印。', '一种是一只趴着的胡狼，底下九个捆着手的人——那是看守墓地的官员的印，意思是：这地方有人看着。', '另一种是个椭圆圈，圈里是国王的名字：一个篮子、一只圣甲虫、三道竖、一个太阳。', '门上有一块补过。古时候就有贼打穿过它，后来又补上了。', '补上的那一块，只盖着胡狼的印——补墙的是看守墓地的人，他们手里没有国王的印。', '记工簿上我也记了。你识字，自己翻。']);
      }
    }
    if (S.f.aSeal && !S.f.morton && S.once('mortonQ')) S.after(900, mortonCome);
    else if (!S.f.aSeal) S.goal('和老爹聊聊（问问墓门上的事）');
  }
  async function mortonCome(S) {
    S.f.morton = true;
    S.place('mor', 26, 10, 1);
    S.sfx('step');
    await S.narr('谷口那边的黑暗里，有人吹着口哨走过来。皮鞋踩在碎石上，咯吱咯吱的。');
    const tx = S.pl.x === 12 && S.pl.y === 10 ? 13 : 12;
    S.focus(17, 10);
    await S.walk('mor', [tx, 10], 3.4);
    S.focus(null);
    S.face('mor', 'pl'); S.face('reis', 'mor');
    await S.say(MO, ['晚上好，先生们。莫顿，伦敦来的。', '别紧张，我只是路过。……其实，有一桩小买卖。']);
    await S.say(MO, ['我只要一张照片。墓里，黑着灯，一张就行。', '五镑。不，十镑——够你们干两个月的活了。', '「法老墓中的黑暗」——你们不知道这种标题能卖多少份。']);
    const r = await S.ask('他把一张钞票捏在指缝里，冲你晃了晃。', ['「不行。墓门晚上不许开。」', '「你们的报纸，一个字都没说对。」']);
    if (r === 1) await S.say(MO, ['说对？孩子，报纸不用说对，只要有人买。']);
    await S.say(RS, '先生，请回吧。这里是文物局的地方。');
    await S.say(MO, ['随你们。', '反正这座墓的故事，明天早上会登在报纸上——不管里面有没有东西。']);
    await S.walk('mor', [26, 10], 3.6);
    S.hide('mor');
    S.face('reis', 'pl');
    await S.say(RS, '那个人的眼神不对。');
    await S.wait(1300);
    clank(S); S.sfx('open');
    const gt = S.ent('tgate'); gt.open = true; gt.off = false;
    S.focus(11, 6);
    await S.narr('坑底下，「哐」的一声。\n铁栅门开了一道缝——墓里的电灯，一盏接一盏地亮了起来。');
    S.focus(null);
    await S.say(RS, ['……那个洋人！他从后面绕过去了！', '锁是撬开的。']);
    S.hide('donkey');
    await S.say(RS, ['我这条腿，下不了那十六级台阶。', '送水的孩子已经骑上驴，去卢克索叫文物局的人了。', '你提上灯下去，把他找出来。别让他碰任何东西——里头每一件都有号、有照片。少一件，明天一早，文物局就要挨家挨户问古尔纳的人。', '我在上头看着发电机。去吧，孩子。']);
    S.give('lamp');
    S.f.gate = true;
    S.goal('提着灯下到墓里（坑底的铁栅门），找到闯进去的人');
    S.cp();
  }
  async function gateOn(S) {
    if (!S.f.gate) {
      if (S.f.morton) return S.narr('铁栅门。');
      return S.narr('坑底是一扇铁栅门，后面还有一道木门。挂着一把大锁。\n钥匙在卡特先生手里。夜里，谁也不许下去。');
    }
    S.sfx('open');
    await S.go('corridor', 4, 17, 3);
  }

  /* ================= 甬道：灯灭、古代封墓人、墓门上的印 ================= */
  async function corrEnter(S, first) {
    if (!first) return;
    await S.narr('十六级台阶，一级比一级凉。\n下到底，是一条斜着往下走的甬道，天花板上拉着一根电线，隔几步挂一个灯泡。');
    await S.narr('去年十一月，这条甬道里塞满了白色的碎石，一直塞到顶。\n是工人们一筐一筐地背空的。');
    S.goal('顺着甬道往里走，找到莫顿');
  }
  function corrTick(S) {
    if (!S.f.dream && !S.busy && S.map === 'corridor' && S.pl.y <= 7) S.run(blackout);
  }
  async function blackout(S) {
    S.f.dream = true;
    genDie(S);
    await S.wait(300);
    for (const id of ['cb1', 'cb2', 'cb3']) S.ent(id).off = true;
    S.dark(.95); S.plr(2.3); S.amb('otherworld');
    S.shake(300, 1);
    await S.narr('灯灭了。上头的发电机咳嗽了两声，没了动静。\n只剩手里这盏马灯，照着脚前两三步远。');
    thud(S, .06); await S.wait(500); thud(S, .06);
    S.focus(4, 3);
    const g1 = S.ent('g1'), g2 = S.ent('g2'); g1.alpha = 0; g2.alpha = 0; S.show('g1'); S.show('g2'); S.face('g1', 3); S.face('g2', 3);
    S.ent('seal').s.st = 1; S.ent('seal').off = false;
    S.alpha('g1', .6, 900); await S.alpha('g2', .6, 900);
    await S.narr('通往前室的门口，不知什么时候，又砌上了一堵墙。\n墙前站着两个人影：光着膀子，腰上围着白麻布裙，头剃得干干净净。');
    for (let i = 0; i < 3; i++) { thud(S, .07); await S.wait(420); }
    await S.narr('一个往墙上抹灰泥。另一个举着一块小东西，在湿泥上一下、一下地按。\n按一下，墙上就多一个印——一只趴着的胡狼。\n……是封墓门的人。三千多年前，就是这样干活的人，凿好了墓，又亲手把门封上。');
    S.face('g1', 0); S.face('g2', 0); S.sfx('whisper');
    await S.wait(900);
    await S.narr('他们停下手，转过身，看了你一眼。\n眼神很平静，像收工的人，看见了来接班的人。');
    S.alpha('g1', 0, 1200); await S.alpha('g2', 0, 1200);
    S.focus(null);
    await S.wait(400);
    S.sfx('knock');
    await S.say('墙后面', ['Hello？！有人吗？！', '……是守墓的那个孩子吗？救救我——这里面有东西！'], { style: 'whisper' });
    await S.think('莫顿。他被封在里面了。\n墙摸上去冰凉、干硬，像是三千年前就在这儿了。只有右边那几个印，黑得发亮。');
    S.goal('墙又封上了——对照「笺」里的记工簿认出真印（双人：一人念，一人选）');
    S.cp();
  }
  async function sealOn(S) {
    const w = S.ent('seal');
    if (w.s.st === 2) { S.sfx('step'); return S.go('ante', 9, 10, 3); }
    if (!w.s.st) return S.narr('通往前室的门口，门框是凿出来的，黑洞洞的。');
    if (S.once('sealLook')) await S.narr('灰泥墙上，密密麻麻盖满了印。\n你把马灯凑近，一个一个地看。翻来覆去，一共是六种。');
    if (!S.f.sealOk) {
      const v = await S.keypad('墙上的印，哪两种是真的？（按两下）\n' + SEALS.map((s, i) => (i + 1) + '　' + s).join('\n'), ['1', '2', '3', '4', '5', '6'], 2);
      if (v == null) return;
      const s = [...v].sort().join('');
      if (s !== SEAL_OK) return sealWrong(S, v);
      S.f.sealOk = true; S.sfx('chime');
      await S.narr('趴着的胡狼和九个俘虏；椭圆圈里的国王名字。\n这两种印压得很深，边缘早就干透了，摸上去像石头。');
      await S.narr('它们只盖在墙的左边和中间。\n右边那一块，全是湿漉漉的黑墨水盖的怪印——闻着一股印刷厂的味儿。');
    }
    const r = await S.ask('古时候被贼打穿、后来又补上的，是哪一块？', ['左边：王名印和胡狼印挨着盖', '中间：只有胡狼印，灰泥颜色深一点', '右边：湿墨水盖的那几个怪印', '（再想想）']);
    if (r === 3) return;
    if (r !== 1) {
      const n = S.f.patchTry = (S.f.patchTry || 0) + 1;
      S.plr(Math.max(1.5, 2.3 - .3 * n));   // 推错有代价：使劲的时候马灯晃了，灯油洒出去一截
      if (r === 0) { S.sfx('thud'); await S.narr('你用肩膀抵住左边，使劲一推。\n灰泥又冷又硬，纹丝不动——这一块是当年一次抹好、一次盖满印的，三千多年没人动过。'); }
      else { S.sfx('tear'); S.shake(300, 2); flutter(S, .04, 8); await S.narr('你的手刚按上右边，湿墨水就顺着指缝往下淌。\n墙后面，有什么东西「沙」地动了一下，像一大摞纸被风掀起来。'); }
      await S.narr('马灯在手里一晃，灯油洒出去一截，火苗矮了下去。');
      if (n === 1) await S.think('不能瞎推了。老爹说过墙上补过的事。');
      else if (n === 2) await S.think('记工簿上写着：补上的那块，只盖着胡狼的印。\n补墙的是看守墓地的人——他们手里没有国王的印。');
      else await S.think('是中间那块。只有胡狼印、颜色深一点的那块。');
      return;
    }
    S.sfx('thud'); S.shake(500, 2); S.plr(2.3);
    await S.narr('你用肩膀抵住中间那块颜色深一点的灰泥。\n一推，泥皮就酥了，一块一块地往下掉。');
    w.s.st = 2;
    await S.narr('墙上露出一个刚好钻得过一个人的洞。\n三千多年前，贼钻的就是这儿。后来，看守墓地的人把它补上，盖满了胡狼。');
    await S.narr('你把马灯举到洞口，眯着眼往里照。\n热乎乎的空气从洞里往外冒，火苗晃了一下——然后，有什么东西在黑暗里闪了一下。金的。到处都是金的。');
    await S.think('去年十一月，听说卡特先生也是这样，举着一根蜡烛往洞里看。\n有人问他看见了什么，他说：「奇妙的东西。」');
    S.goal('钻过墙洞，进前室找莫顿');
    S.cp();
  }
  async function sealWrong(S, v) {
    const n = S.f.sealTry = (S.f.sealTry || 0) + 1;
    S.sfx('tear'); S.fx('static', { dur: .35 });
    const bad = [...v].find(c => !SEAL_OK.includes(c));
    const why = { '1': '站着、举刀的胡狼？老爹说的胡狼是趴着的。', '3': '圈里是一只流泪的眼睛——那不是国王的名字。', '5': '那行字……就是报纸上那句。', '6': '骷髅和交叉的骨头，是洋人海盗旗上的东西。' }[bad] || '你按了两下同一个印。';
    await S.narr('你按下去的那个印，墨迹是湿的，蹭了你一手黑。\n' + why);
    if (n === 2) await S.think('老爹的记工簿上写着两种：趴着的胡狼，底下九个捆着手的俘虏；\n椭圆圈里的国王名字——篮子、圣甲虫、三道竖、太阳。');
    else if (n >= 3) await S.think('是 2 号和 4 号。');
    else await S.think('真印是三千多年前压进灰泥里的，早就干透了。\n老爹说过墓门上有哪两种印。（「笺」里有他的记工簿）');
  }
  async function corrExit(S) {
    if (S.f.dream && !S.f.metM) { S.toast('莫顿还在里面——灯也灭了，得先把他找出来。'); S.pos(4, 16, 3); return; }
    if (S.has('eye') && !S.f.returned) return takeOut(S);
    await S.go('valley', 11, 6, 0);
  }
  async function takeOut(S) {
    const r = await S.ask('你攥着那只蓝色的小眼睛，站在最后一级台阶底下。\n外面就是帝王谷。', ['把它带出去', '不——先把它放回去']);
    if (r === 1) { S.pos(4, 16, 3); return; }
    S.take('eye');
    await S.fade(1, 1200);
    await S.end({ bad: true, id: 'take', title: '带出墓室', text: '你把它攥在手心里，走上了十六级台阶。\n\n天亮以后，文物局清点墓室，神龛门前少了一样东西。\n古尔纳的工人被挨个叫去问话，问了三天。\n老爹什么也没说。他只是再也没有叫过你的名字。\n\n报纸上的标题是：《法老的诅咒：又一桩怪事》。\n\n那只蓝色的小眼睛，你一直没敢拿出来。\n可是每天夜里，枕头底下都有纸张哗啦哗啦扇动的声音，\n像翅膀。' });
  }

  /* ================= 前室：东西全回来了 · 莫顿 · 报纸怪 ================= */
  async function anteEnter(S, first) {
    if (!first) return;
    await S.narr('你从墙洞里钻过去，把马灯往前一探——');
    S.sfx('sting');
    await S.narr('前室早就该空了。\n这两个多月，里面的东西一件一件编了号、拍了照，垫上棉花，用木托盘抬去了化验室。');
    await S.narr('可是现在，马灯照到的地方，它们全在。\n三张镀金的长床，床头是牛、狮子和河马的脑袋；一摞摞白色的椭圆木盒；拆开叠在角落里的战车……');
    await S.think('跟化验室墙上钉着的那些照片，一模一样。\n——跟它们三千多年前被放进来的那天，一模一样。');
    S.sfx('cry');
    await S.narr('狮子床后面的角落里，有人在发抖。');
    await S.walk('pl', [2, 7], 3.4);
    S.face('pl', 1);
    await mortonScene(S);
  }
  async function mortonScene(S) {
    S.face('morA', 'pl');
    await S.say(MO, ['谁——哦，是你。守墓的孩子。', '我就想拍一张照片。一张。', '灯一灭……有东西从我那摞报纸里站起来了。有翅膀。上面全是字。']);
    await S.narr('他摊开手。掌心里是一只小小的蓝色眼睛——上釉的彩陶，眼角拖着一道弯弯的花纹。');
    await S.think('乌加特之眼。荷鲁斯的眼睛。\n老爹说，那是保人完好无损的意思。');
    await S.say(MO, ['在里面那间金屋子里捡的。就在那个大金柜子的门口，地上。', '我本来想拍完就放回去的！真的！']);
    await S.say(MO, ['听着，孩子。给你二十镑。', '你们卢克索的集市上天天在卖这种东西。少一个，谁会知道？', '要不……就让我带出去。明天的头版：「被诅咒的护身符」。我保证不写你的名字。']);
    const r = await S.ask('他把那只蓝眼睛捏在两根指头中间。', ['「给我。我把它放回去。」', '「……你拿走吧。就当我什么也没看见。」']);
    if (r === 1) return headline(S);
    await S.say('你', ['集市上卖的那些，是做给你们这种人的。', '这一只，是他的。']);
    await S.narr('莫顿看了你一会儿，把它放进了你手心。\n凉的。比你想的要轻。');
    S.give('eye');
    S.f.metM = true;
    S.focus(null);
    await darkBegins(S);
  }
  async function headline(S) {
    S.sfx('bad');
    await S.narr('莫顿把它揣进口袋，从你身边挤过去，钻出墙洞，头也不回地跑了。');
    S.hide('morA');
    await S.fade(1, 1200);
    await S.end({ bad: true, id: 'headline', title: '头条', text: '第二个星期，伦敦一家报纸登出一张照片：\n一只蓝色的小护身符，躺在黑丝绒上。标题是《被诅咒的护身符》。\n\n文物局清点墓室时，少了一件东西。古尔纳的工人被挨个盘问了三天。\n\n后来，那只眼睛去了哪里，没有人知道。\n有人说在海那边某个收藏家的玻璃柜里，有人说早就转了好几道手。\n\n它再也没有回到国王身边。' });
  }
  async function darkBegins(S) {
    await S.walk('morA', [9, 10], 5);
    S.sfx('thud'); buzz(S);
    await S.narr('莫顿连滚带爬地往外跑，一脚绊在地上的电线上——\n「啪」，三处接头冒出火星，散了一地。他爬起来，钻出墙洞，没影了。');
    S.hide('morA');
    for (const j in JUNC) S.ent(j).s.loose = true;
    await S.wait(500);
    flutter(S, .05, 12);
    S.focus(10, 8);
    const a = S.ent('pw'); S.place('pw', 10, 9, 1); a.alpha = 0;
    await S.narr('墙洞边上，莫顿扔下的那摞报纸，自己动了。\n一张，两张，一张叠一张地立起来，越叠越高。');
    await S.alpha('pw', 1, 800);
    await S.scare('face', { face: 'pw', sfx: 'scare' });
    await S.say('？？？', '「死亡……将展开……翅膀……」', { style: 'whisper' });
    S.focus(null);
    genHum(S, .02);
    await S.narr('上头远远传来「突突突」的声音——是老爹，把发电机又摇着了！\n可前室里一盏灯也没亮。电线的接头，全叫莫顿扯断了。');
    await S.think('那东西是冲着我手里的眼睛来的。\n……它只在黑地方走。灯底下，它不敢。');
    await S.narr('（灯下它不动；离你一格就会扑上来。在黑地方要跑——Shift，或屏幕上的「跑」键。）');
    S.f.ph = 'dark'; S.f.jn = 0;
    S.goal('接好三个电线接头（还剩 3 个）——灯下它不敢过来');
    S.cp('dark');
    await startDark(S, false);
  }
  function litAt(S, x, y) {
    for (const j in JUNC) { const b = S.ent(JUNC[j]); if (b && !b.off && (x - b.x) ** 2 + (y - b.y) ** 2 <= 2.4 * 2.4) return true; }
    return false;
  }
  function chaseOn(S, id, wait) {
    const c = S.ent(id);
    S.chase(id, { spd: SPD[Math.min(2, S.f.jn || 0)], catch: S2 => hitBy(S2, id), zone: (x, y) => !litAt(S, x, y) });
    if (wait) c.chase.wait = wait;
  }
  function stopAll(S) { for (const id of CHASERS) { S.stop(id); S.freeze(id, false); S.ent(id).s.fz = false; } }
  function near(S, c) { return Math.abs(c.px - S.pl.px) + Math.abs(c.py - S.pl.py) < 16.5; }
  /* 把报纸怪甩开：离玩家至少 5 格、没有灯，并且尽量远离还没接好的接头（不会正好堵在下一个目标上） */
  function farSpot(S, avoid) {
    const cand = [[10, 9], [16, 10], [16, 2], [12, 3], [8, 7], [1, 10], [5, 5], [11, 7], [14, 4], [9, 3], [3, 2]];
    const left = Object.keys(JUNC).filter(j => S.ent(j).s.loose).map(j => S.ent(j));
    let best = null, bs = -1e9;
    for (const [x, y] of cand) {
      if (litAt(S, x, y)) continue;
      if (avoid) { const o = S.ent(avoid); if (!o.hidden && Math.abs(Math.round(o.px / 16) - x) + Math.abs(Math.round(o.py / 16) - y) < 3) continue; }
      const dp = Math.abs(x - S.pl.x) + Math.abs(y - S.pl.y); if (dp < 5) continue;
      const dj = left.length ? Math.min(...left.map(j => Math.abs(x - j.x) + Math.abs(y - j.y))) : dp;
      const sc = Math.min(dj, 9) * 10 - Math.abs(dp - 7);
      if (sc > bs) { bs = sc; best = [x, y]; }
    }
    return best || [10, 9];
  }
  function knockBack(S, id) { const [x, y] = farSpot(S, id === 'pw' ? 'pw2' : 'pw'); S.place(id, x, y, 1); }
  async function startDark(S, retry) {
    stopAll(S);
    S.hide('pw2'); S.hidePlayer(false);
    S.dark(.95); S.plr(2.4);
    const a = S.ent('pw'); S.place('pw', 10, 9, 1); a.alpha = 0;
    if (retry) await S.narr('你又回到了狮子床旁边。墙洞边上，那摞报纸又在一张一张地立起来。\n（灯下它不动；离你一格就会扑上来。黑地方一定要跑；先接最近的那个，再挑离它远的那一个，一盏一盏「跳」过去。）');
    if (S.coop) S.toast('联机：一个人盯着报纸怪喊方位，一个人跑（按 T 交接）');
    flutter(S, .045, 10);
    await S.alpha('pw', 1, 700);
    chaseOn(S, 'pw', .6);
  }
  async function hitBy(S, id) {
    if (S.f.ph !== 'dark') return;
    stopAll(S);
    if (!S.f.hit) {
      S.f.hit = true;
      await S.scare('flash', { sfx: 'tear', dur: .5 });
      knockBack(S, id);
      S.toast('它扑到你脸上——你抡起马灯，把纸片打散了！再被扑上一次，就完了。');
      for (const c of CHASERS) if (!S.ent(c).hidden) chaseOn(S, c, c === id ? 1.4 : .4);
      return;
    }
    await S.scare('face', { face: 'pw', sfx: 'scream', dur: 1 });
    await S.die('纸，一张接一张，糊住了你的眼睛、你的嘴。\n每一张上都印着同一行字：「死亡将展开翅膀，降临到打扰法老安息的人身上。」\n\n你攥着那只蓝眼睛的手，被一根一根地掰开了。', '你被报纸吞没了');
  }
  async function junctionOn(S, j) {
    const e = S.ent(j);
    if (S.f.ph !== 'dark') return S.narr(e.s.loose ? '电线的接头，铜螺丝拧得紧紧的。\n灯泡就在头顶上，嗡嗡地响。' : '一个电线接头，铜螺丝拧得紧紧的。发掘队把电从谷里一直拉到了墓室。');
    if (!e.s.loose) return S.toast('这个接头已经接好了。');
    for (const id of CHASERS) { const c = S.ent(id); if (c.chase) c.chase.always = true; }
    S.sfx('switch'); S.toast('拧紧接头……');
    await S.wait(600);
    for (const id of CHASERS) { const c = S.ent(id); if (c.chase) c.chase.always = false; }
    for (const id of CHASERS) { const c = S.ent(id); if (!c.hidden && c.chase && near(S, c)) return hitBy(S, id); }
    e.s.loose = false;
    S.ent(JUNC[j]).off = false;
    S.sfx('switch'); buzz(S);
    S.f.jn = (S.f.jn || 0) + 1;
    if (S.f.jn >= 3) return victory(S);
    /* 灯泡一亮，一闪：三格以内的纸片都被惊散，给你喘口气 */
    for (const id of CHASERS) { const c = S.ent(id); const cx = Math.round(c.px / 16), cy = Math.round(c.py / 16); if (!c.hidden && c.chase && (litAt(S, cx, cy) || Math.abs(cx - S.pl.x) + Math.abs(cy - S.pl.y) <= 3)) { S.stop(id); knockBack(S, id); shriek(S); chaseOn(S, id, 1.2); } }
    for (const id of CHASERS) { const c = S.ent(id); if (c.chase) c.chase.spd = SPD[S.f.jn]; }
    S.goal('接好三个电线接头（还剩 ' + (3 - S.f.jn) + ' 个）——灯下它不敢过来');
    if (S.f.jn === 2) {
      const p = farSpot(S, 'pw'); const b = S.ent('pw2'); S.place('pw2', p[0], p[1], 1); b.alpha = 0;
      flutter(S, .05, 12);
      S.toast('灯亮了！……可是另一摞报纸，也飞起来了。');
      await S.alpha('pw2', 1, 700);
      chaseOn(S, 'pw2', .3);
    } else S.toast('灯亮了！');
  }
  async function victory(S) {
    S.f.ph = 'lit'; stopAll(S);
    shriek(S); S.shake(600, 3);
    S.dark(.62); S.plr(null);
    await S.narr('最后一盏灯「嗡」地亮了。\n三团光连成一片，前室里一下子再没有一块黑地方。');
    S.alpha('pw', 0, 900); await S.alpha('pw2', 0, 900);
    for (const p of ['pile1', 'pile2']) S.ent(p).s.blank = true;
    S.sfx('paper');
    await S.narr('那两团纸在光里打着旋，「哗」地散开，落了一地。\n你捡起一张——上面的铅字一个一个地褪掉，最后只剩一张白纸。');
    await S.think('……还没完。它还会回来。\n得把眼睛还回去——还到那间金屋子的金柜子门口。');
    S.goal('从两尊守卫雕像中间的墙洞，钻进墓室');
    S.cp();
  }
  async function blockOn(S) {
    const w = S.ent('block');
    if (S.f.ph === 'dark') return S.toast('它就在后面！先把灯接上！');
    if (w.s.st === 2) { S.sfx('step'); return S.go('burial', 7, 9, 3); }
    await S.narr('墓室的封墙，又抹得严严实实，两尊黑色的守卫雕像一边一个。\n灰泥上同样盖满了印。');
    await S.narr('墙脚靠左的地方，有一块颜色深一点的补丁。\n上面只有胡狼——趴着的胡狼，和九个捆着手的人。');
    await S.think('又是贼打穿过、看守墓地的人补上的地方。\n……老爹，我认得了。');
    S.sfx('thud'); S.shake(400, 2);
    w.s.st = 2;
    await S.narr('你蹲下去一推，补丁就塌了，露出一个只够爬过去的矮洞。');
    S.sfx('step');
    await S.go('burial', 7, 9, 3);
  }
  async function anteExit(S) {
    if (S.f.ph === 'dark') { S.toast('外头黑成一片——那东西就是从那边来的。先把灯接上！'); S.pos(9, 10, 3); return; }   // 退回原来那一格（以前推到 9,9，正贴着报纸怪冒出来的那摞报纸）
    await S.go('corridor', 4, 2, 0);
  }

  /* ================= 墓室：壁画的顺序 ================= */
  const PDESC = {
    pE: { look: '东墙。十二个人排成一行，肩上套着绳子，拉着一架雪橇。\n雪橇上是一座小龛，龛里躺着国王。走在后头的两个人，衣服跟别人不一样。', done: '送葬的队伍。国王在人间走的最后一段路。' },
    pN1: { look: '北墙最右边（东头）。一位戴蓝色头冠、披着豹皮的老人，举着一把小斧子样的东西，对着一个裹着白布的国王的嘴。', done: '开口仪式。阿伊让国王在那边重新能说话、能吃喝、能呼吸。' },
    pN2: { look: '北墙中间。一个女人张开双手，迎着一位穿着活人衣裳的国王。她的裙子是蓝的。', done: '天空女神努特，迎接国王。' },
    pN3: { look: '北墙最左边（西头）。一个裹着白布、脸是绿色的神，把国王抱在怀里。\n国王身后，还站着一个和他一模一样的人，头上顶着一双举起来的手臂。', done: '冥王奥西里斯拥抱国王；身后是国王的「卡」。' },
    pW: { look: '西墙。十二只狒狒蹲成几排，举着手。上面是一条小船，船上坐着神。', done: '十二只狒狒，迎接夜里第一个钟点的太阳船。' }
  };
  async function burialEnter(S, first) {
    if (!first) return;
    await S.narr('墙洞那边低了一截。你爬过去，站直——');
    S.sfx('chime');
    await S.narr('马灯的光一下子被什么东西接住了，又整片整片地反射回来。\n金的。一整面墙那么大的金子。');
    await S.narr('是一座镀金的木神龛，几乎填满了整间墓室，四周只留一条窄窄的过道。\n神龛的门朝着东边。');
    await S.narr('四面墙刷成了暖黄色，上面画着人。马灯晃过去，那些人好像也跟着动了一下。');
    await S.think('莫顿说，他是在「金柜子的门口」捡的。……就是这里。\n可是墙上的人，好像都在看着我。');
    S.goal('看看脚手架上画工留下的东西');
  }
  async function scaffoldOn(S) {
    if (S.f.sketch) return S.note('sketch');
    await S.narr('角落里搭着一副木头脚手架，是给画工描壁画用的。\n木板上压着一本速写本，铅笔还夹在里面。');
    await S.note('sketch');
    S.f.sketch = true; S.give('sketch', true);
    await S.think('壁画上的，是国王死了以后走的路。\n……要把他的东西还回去，是不是也得照着他的路，先走一遍？');
    S.goal('照国王走过的路摸五幅画：东墙一、北墙三、西墙一（双人：一人念，一人摸）');
  }
  async function panelOn(S, id) {
    const e = S.ent(id), d = PDESC[id];
    if (S.f.panels) return S.narr(d.done);
    if (!S.f.sketch) return S.narr(d.look + '\n\n……这画的是什么？脚手架上好像有画工留下的东西。');
    if (e.lit) return S.toast('这一幅已经亮了。');
    if (!S.f['pd_' + id]) { await S.narr(d.look); if (await S.ask('把手按在这幅画上？', ['按上去', '先不']) === 1) return; S.f['pd_' + id] = true; }
    const seq = S.f.seq || 0;
    if (ORDER[seq] === id) {
      e.lit = true; e.off = false; litNote(S, seq); S.f.seq = seq + 1;
      if (S.f.seq >= ORDER.length) return panelsDone(S);
      return S.toast('画上的颜色一下子亮了起来。（' + S.f.seq + '/5）');
    }
    return panelWrong(S);
  }
  async function panelWrong(S) {
    for (const id of ORDER) { const p = S.ent(id); p.lit = false; p.off = true; }
    S.f.seq = 0;
    const n = S.f.pwrong = (S.f.pwrong || 0) + 1;
    S.plr(Math.max(1.6, 2.6 - .3 * n));
    S.shake(500, 2); S.sfx('thud'); flutter(S, .03, 6);
    await S.narr('顶上簌簌地落下一阵沙子，亮起来的画又全暗了。\n马灯的火苗缩了一下——灯油好像少了一截。');
    if (n === 1) await S.think('不对。得照国王走过的路来。');
    else if (n === 2) await S.think('速写本上说：送葬，是国王在人间走的最后一段路。\n先得把他送进墓里，才轮得到后面那些。');
    else if (n === 3) await S.think('北墙那三幅要从右往左读——人脸朝着右边。\n东墙 → 北墙 → 西墙，就像太阳从东边走到西边。');
    else await S.think('东墙的送葬 → 北墙最右的开口仪式 → 北墙中间的努特 → 北墙最左的奥西里斯 → 西墙的十二只狒狒。');
  }
  async function panelsDone(S) {
    S.f.panels = true; S.sfx('chime');
    S.plr(null); S.dark(.78);
    S.ent('shrine').s.ready = true; const sp = S.ent('spot'); sp.s.ready = true; sp.off = false;
    await S.narr('五幅画都亮了。\n从东墙到西墙，一圈暖黄色的光，像太阳从早上走到了晚上。');
    await S.narr('神龛东边那两扇金门底下，有一块地方在发亮。\n那么小，刚好放得下一只眼睛。');
    S.goal('把护身符放回神龛的金门前（神龛东边）');
  }
  async function shrineOn(S) {
    const sh = S.ent('shrine');
    if (S.f.returned) return S.narr('金门前，那只蓝色的小眼睛安安静静地躺在原处。');
    if (S.pl.x < 11 || S.pl.y < 4 || S.pl.y > 6) return S.narr('一座镀金的大神龛，外面刻满了蓝色的护符图案——一排「节德柱」，一排「伊西斯结」，一个挨一个。\n它的门在东边。');
    if (!sh.s.ready) return S.narr('神龛的两扇金门，用麻绳系着，绳结上压着一块泥印。\n门前的地上空着一小块，干干净净的，像是本来放着什么。' + (S.f.sketch ? '' : '\n\n脚手架上好像有画工留下的东西。'));
    if (!S.has('eye')) return S.narr('金门前空着一小块地方。');
    if (await S.ask('把那只蓝色的眼睛放回去？', ['放回去', '再等等']) === 1) return;
    await placeEye(S);
  }
  async function placeEye(S) {
    S.take('eye'); S.f.returned = true;
    S.ent('spot').s.eye = true; S.ent('shrine').s.ready = false;
    await S.narr('你跪下来，把那只蓝色的小眼睛，轻轻放回金门前的地上。\n放下去的那一下，你觉得手心一空——好像有人从你手里，把它接了过去。');
    S.sfx('chime');
    await S.wait(600);
    flutter(S, .06, 14);
    const f = S.ent('pwF'); S.place('pwF', 7, 9, 3); f.alpha = 0;
    await S.alpha('pwF', 1, 300);
    await S.say('？？？', '「死亡……将展开……翅膀……」', { style: 'whisper' });
    await S.walk('pwF', [[11, 9], [11, 7]], 8);
    await S.scare('face', { face: 'pw', sfx: 'scream', dur: 1 });
    shriek(S);
    for (const id of ORDER) S.ent(id).off = false;
    await S.narr('它扑到你跟前的那一刻，墙上五幅画同时亮了一下。\n像五扇窗户一齐打开，外头是正午的太阳。');
    await S.alpha('pwF', 0, 900);
    S.sfx('paper');
    await S.narr('纸片哗啦啦落了一地。\n每一张都是白的。一个字也没有。');
    genHum(S, .025);
    S.dark(.55);
    await S.narr('上头，发电机又突突地响起来。墓里的电灯，一盏一盏地亮了。');
    const a = S.ent('gA'), b = S.ent('gB'); a.alpha = 0; b.alpha = 0; S.show('gA'); S.show('gB'); S.face('gA', 3); S.face('gB', 3);
    S.alpha('gA', .5, 900); await S.alpha('gB', .5, 900);
    await S.narr('墙洞边上，站着那两个围白麻布裙的人。\n他们朝你点了点头——像收工的人，跟接班的人打招呼。');
    S.alpha('gA', 0, 1400); await S.alpha('gB', 0, 1400);
    await S.fade(1, 1200);
    await S.card('天亮了', '1923年4月5日　清晨', '你走上十六级台阶的时候，\n东边的山脊上，已经透出了一线白。');
    await epilogue(S);
  }

  /* ================= 尾声：天亮 ================= */
  async function epilogue(S) {
    S.goal('');
    S.dark(.3, 'valley');
    S.ent('fire').off = true;
    for (const p of ['pole1', 'pole2']) S.ent(p).off = true;
    S.place('reis', 10, 10, 2); S.place('insp', 13, 10, 1); S.place('mor', 8, 11, 2); S.place('donkey', 15, 11, 1);
    await S.go('valley', 11, 9, 0, { fade: false });
    S.amb('wind');
    await S.fade(0, 1000);
    S.face('reis', 'pl');
    await S.say(RS, ['卡里姆！', '……感谢真主。你出来了。']);
    S.face('insp', 'pl');
    await S.say(HA, ['我是文物局的哈米德。送水的孩子半夜敲开了我的门。', '天一亮，我就带人下去看过了。', '封泥、木箱、号签……墓室里一样不少。', '神龛门前的地上，有一只蓝色的小护身符。登记簿上没有它——画工的速写本上倒是画着。我会把它补登上去。']);
    await S.wait(500);
    await S.say(HA, ['还有一件事。', '开罗来了电报。勋爵……今天凌晨，走了。']);
    S.bubble('reis', '…', 2000);
    await S.say(RS, '愿真主怜悯他。');
    await S.narr('谁也没再说话。\n风从山口灌下来，把篝火的灰吹得一圈一圈地转。');
    S.face('mor', 'pl');
    await S.say(MO, ['……你知道明天的报纸会怎么写吗？「法老的诅咒应验了」。不管我写不写，都会有人这么写。', '我欠你一条命，孩子。你告诉我——下面到底有什么？我照你说的写。']);
    const opts = ['「有诅咒。你自己看见了。」', '「没有诅咒。只有一句祝福，和一代一代干活的人。」', '「……我什么都没看见。」'];
    if (S.f.draft) opts.push('「『死亡将展开翅膀』——那句话，是你自己在本子上写的。」');
    const r = await S.ask('莫顿把本子摊在膝盖上，等着。', opts);
    S.f.answer = r;
    if (r === 1) await S.say(MO, '……一句祝福，和干活的人。好。我记下了。');
    else if (r === 0) await S.say(MO, '……我就知道。');
    else if (r === 2) await S.say(MO, '好吧。你什么都没看见。');
    else { S.bubble('mor', '…', 2000); await S.narr('莫顿的笔停住了。\n他低头看了半天自己的本子，然后把那一页撕下来，揉成一团，扔进了篝火的灰里。'); await S.say(MO, '……是我写的。'); }
    await S.fade(1, 1400);
    let t = '那一年春天，世界各地的报纸都在登同一个故事：法老的诅咒。\n勋爵死了，于是诅咒是真的；后来又有人死了，诅咒就更真了。\n后来人们还说，勋爵咽气的那一刻，开罗全城的灯都灭了。\n\n';
    if (r === 1) t += '莫顿的稿子也登了出来，标题里照样有「诅咒」两个字。\n可是最后一段，有一行小字：\n「一位古尔纳的守墓人说：墓里没有诅咒，只有一句祝福，和一代一代干活的人。」\n\n';
    else if (r === 0) t += '莫顿的稿子里，多了一个「吓得浑身发抖的土著守卫」。\n你在卢克索的报摊上看见那张报纸，买下来，折好，塞进了灶膛。\n\n';
    else if (r === 2) t += '莫顿那天发回伦敦的稿子里，没有你。\n\n';
    else t += '莫顿那天没有发稿。\n可是第二天，别的报纸上，那句「死亡将展开翅膀」还是登出来了——一个字也没改。\n一句话一旦印在纸上，就再也收不回来了。\n\n';
    t += '帝王谷里，发掘照常进行。工人们一筐一筐地背土，一件一件地给东西编号。\n墓里的五千多件东西，后来都留在了埃及。那只蓝色的小眼睛，也在其中。';
    if (S.f.roster) t += '\n\n很多年以后，人们才开始把另一些名字也写进书里：\n艾哈迈德·杰里加尔、加德·哈桑、侯赛因·阿布·阿瓦德、侯赛因·艾哈迈德·赛义德……\n还有那些一筐一筐把土背出来、没留下名字的人。';
    if (S.f.cup) t += '\n\n你常常想起前室门口那只白杯子上的话：\n「……面朝北风坐着，双眼看见幸福。」';
    const det = ['roster', 'cup', 'draft', 'aStep'].filter(k => S.f[k]).length;
    t += '\n\n（这一夜，你留意到了 ' + det + '/4 处细节：记工簿、许愿杯、莫顿的本子、第一级台阶的故事。）';
    await S.end({ id: 'return', title: '第二十九夜　完', text: t });
  }

  defChapter({
    id: 'pharaoh', n: 29, title: '法老的诅咒', sub: '「死亡将展开翅膀，降临到打扰法老安息的人身上。」——报纸上是这么写的。墓里写的，是另一句话。', origin: '1922—1923 埃及帝王谷', color: '#2a3a6a',
    amb: 'night', floor: 'sand', wall: 'stone', dark: .8, plr: 3.2,
    endings: { return: '第二十九夜　完（还给了他）', take: '带出墓室', headline: '头条' },
    thumb(g, w, h) {   // 金面具：蓝金条纹的头巾、金色的脸、黑眼线
      const cx = Math.round(w / 2), y0 = h - 22 - 88;
      const gr = g.createRadialGradient(cx, y0 + 44, 4, cx, y0 + 44, 70); gr.addColorStop(0, 'rgba(255,200,90,.32)'); gr.addColorStop(1, 'rgba(255,200,90,0)'); g.fillStyle = gr; g.fillRect(0, 0, w, h);
      const R = (x, y, ww, hh, c) => { g.fillStyle = c; g.fillRect(cx + x, y0 + y, ww, hh); };
      for (let y = 0; y < 80; y++) { const half = y < 16 ? 12 + y : y < 50 ? 28 : 28 + Math.round((y - 50) * .45); R(-half, y + 6, half * 2, 1, Math.floor(y / 4) % 2 ? '#d8a830' : '#24408a'); }
      R(-14, 14, 28, 40, '#e8c060'); R(-12, 54, 24, 4, '#e8c060'); R(-9, 58, 18, 3, '#d8b050'); R(8, 16, 6, 38, '#c8a040');
      R(-11, 26, 9, 2, '#24408a'); R(2, 26, 9, 2, '#24408a');
      R(-10, 30, 7, 4, '#f4f0e0'); R(3, 30, 7, 4, '#f4f0e0'); R(-8, 30, 4, 4, '#101010'); R(5, 30, 4, 4, '#101010'); R(-13, 32, 3, 1, '#101010'); R(10, 32, 4, 1, '#101010');
      R(-1, 34, 3, 9, '#c8a040'); R(-3, 43, 6, 2, '#b89038'); R(-5, 47, 10, 3, '#a8603a');
      for (let i = 0; i < 5; i++) R(-3, 61 + i * 3, 6, 2, i % 2 ? '#24408a' : '#d8a830');
      R(-2, 4, 4, 8, '#d8a830'); R(-1, 2, 2, 3, '#24408a'); R(-5, 8, 3, 3, '#e8c060'); R(2, 8, 3, 3, '#e8c060');
    },
    faces: {
      /* 报纸怪：揉皱的报纸脸，额头一道黑色大标题，两个往下淌墨的眼洞，撕开的嘴；两边是扇动的纸翅膀 */
      pw(R, a, t) {
        const P = '#dcd6c0', P2 = '#b4ae98', P3 = '#8a8474', INK = '#0c0a0c';
        for (let i = 0; i < 5; i++) { const y = 4 + i * 4 + Math.round(Math.sin(t * 20 + i)); R(0, y, 9 - i, 3, i % 2 ? P2 : P); R(1, y + 1, 6 - i, 1, P3); R(23 + i, y, 9 - i, 3, i % 2 ? P2 : P); R(24 + i, y + 1, 6 - i, 1, P3); }
        R(9, 3, 14, 26, P); R(8, 6, 16, 20, P); R(7, 9, 18, 13, P);
        R(10, 8, 1, 6, P2); R(21, 12, 1, 8, P2); R(13, 25, 6, 1, P2); R(8, 15, 3, 1, P2);
        for (let y = 9; y < 28; y += 2) { R(10, y, 3, 1, P3); R(19, y, 3, 1, P3); }
        R(8, 4, 16, 3, INK); for (let x = 9; x < 23; x += 3) R(x, 5, 1, 1, P);
        R(10, 10, 4, 4, INK); R(18, 10, 4, 4, INK);
        R(11, 14, 1, 2 + Math.round(a * 9), INK); R(20, 14, 1, 3 + Math.round(a * 7), INK); R(13, 14, 1, 1 + Math.round(a * 4), INK);
        if (a > .3) { R(11, 11, 1, 1, '#f0e8d0'); R(19, 12, 1, 1, '#f0e8d0'); }
        const mh = 2 + Math.round(a * 6);
        R(11, 20, 10, mh, INK); for (let x = 11; x < 21; x += 2) R(x, 20, 1, 1, P); for (let x = 12; x < 21; x += 2) R(x, 19 + mh, 1, 1, P);
        R(7, 26, 2, 2, '#000'); R(23, 4, 2, 2, '#000'); R(24, 20, 1, 3, '#000');
      }
    },
    people: (() => {
      const turban = (c1, c2) => (g, d, fr, G, R) => { R(3, G.hT - 1, 10, 3, c1); R(4, G.hT - 2, 8, 1, c1); R(4, G.hT, d === 1 ? 7 : 8, 1, c2); };
      return {
        me: { key: 'ph-me', skin: '#a8724a', hair: '#151012', hs: 'short', top: '#8a9aa6', top2: '#6a7a86', robe: true, shoes: '#4a3020', extra: turban('#ece6d6', '#c8c0ae') },
        reis: { key: 'ph-reis', skin: '#8a5c3a', hair: '#c8c4bc', hs: 'short', top: '#3a3a48', top2: '#2a2a36', robe: true, shoes: '#2a1a10',
          extra(g, d, fr, G, R) { turban('#e8e2d2', '#b8ae98')(g, d, fr, G, R); if (d === 0) { R(5, G.hT + 6, 6, 2, '#d8d4cc'); R(6, G.hT + 8, 4, 1, '#d8d4cc'); } else if (d === 1) R(4, G.hT + 6, 3, 2, '#d8d4cc'); } },
        mor: { key: 'ph-mor', skin: '#eac8a8', hair: '#7a5a3a', hs: 'short', top: '#9a8a6a', top2: '#e8e4d8', bottom: '#7a6a4e', shoes: '#3a2a1a', hat: 'cap', hatC: '#6a5a40',
          extra(g, d, fr, G, R) { R(2, G.hT, 12, 1, '#5a4a30'); if (d === 0) { R(7, G.tT + 1, 2, 3, '#7a2a2a'); R(4, G.tT + 4, 3, 3, '#2a2a2a'); } } },
        anc: { key: 'ph-anc', skin: '#9a5a34', hair: '#121010', hs: 'bald', top: '#9a5a34', top2: '#9a5a34', bottom: '#ece6d4', skirt: true, ghost: true,
          extra(g, d, fr, G, R) { R(4, G.tB - 1, 8, 1, '#ece6d4'); } },
        insp: { key: 'ph-insp', skin: '#9a6a44', hair: '#151012', hs: 'short', top: '#2a2a30', top2: '#e8e4dc', bottom: '#2a2a30', shoes: '#111', coat: true,
          extra(g, d, fr, G, R) { R(5, G.hT - 2, 6, 3, '#a82a22'); R(5, G.hT - 2, 6, 1, '#c03a2a'); if (d !== 3) R(9, G.hT - 1, 1, 2, '#151010'); if (d === 0) R(5, G.hT + 6, 6, 1, '#2a1a10'); } }
      };
    })(),
    items: {
      news: { name: '吹来的报纸', desc: '一张三天前的伦敦报纸，标题里有「诅咒」两个字。边上有人用铅笔写了个价钱。' },
      lamp: { name: '马灯', desc: '发掘队的防风马灯，玻璃罩熏黑了一半。灯油不多了。' },
      eye: { name: '蓝色的眼睛', desc: '一只小小的彩陶护身符，蓝得发亮，眼角拖着一道弯弯的花纹。乌加特之眼——荷鲁斯的眼睛。它不是你的。' },
      sketch: { name: '画工的速写本', desc: '画工优素福描墓室壁画用的本子，铅笔线，边上有阿拉伯文和英文的小注。' }
    },
    notes: {
      news: { title: '被风吹来的报纸', text: '（英文报纸，日期是三天前。你凑着火光，一句一句翻给老爹听。）\n\n《伦敦每日回声报》\n法老的诅咒？——著名女作家警告：擅闯古墓者必遭严惩\n\n……一位知名女小说家致函本报，称她收藏的一本罕见阿拉伯古书记载：侵扰法老安息者，将遭「最可怕的惩罚」……\n\n另据本报消息：墓中曾发现一块泥板，刻有铭文——\n「死亡将展开翅膀，降临到打扰法老安息的人身上。」\n该泥板据称已被发掘者秘密藏匿，以免惊扰土著工人。\n\n……资助发掘的勋爵目前仍在开罗卧病，据悉病情反复……\n\n（报纸边上，有人用铅笔写了一个价钱。）' },
      roster: { title: '阿卜杜·萨拉姆的记工簿', text: '（阿拉伯文，字一笔一划写得很用力。你一边看，一边在心里翻成话。）\n\n1922年11月4日　清拉美西斯六世墓口底下的古时工棚。上午，铲子底下碰到一级凿出来的台阶。各人分得一份赏钱。\n11月5日　清到第十二级。门顶露出来了，灰泥上盖着墓地的印：一只趴着的胡狼，底下九个捆着手的俘虏。\n11月24日　十六级全清出来。门的下半截有国王的印：椭圆圈里一个篮子、一只圣甲虫、三道竖、一个太阳。\n　门上有一块补过——古时候有贼打穿过，又补上了。补上的那块，只盖着胡狼的印。\n11月26日　前室开了。\n12月起　东西一件件编号、照相，垫上棉花，用木托盘抬到塞提二世墓的化验室。抬了几百趟，没摔过一件。\n1923年2月　墓室开了。\n\n本季工头：大工头艾哈迈德·杰里加尔；加德·哈桑、侯赛因·阿布·阿瓦德、侯赛因·艾哈迈德·赛义德。\n夜班：阿卜杜·萨拉姆、卡里姆。' },
      draft: { title: '莫顿的记者本', text: '（硬皮记者本，字写得飞快，划掉的比留下的多。）\n\n标题：图坦卡蒙的复仇？\n\n「墓门上刻着——」（划掉。没人见过墓门上刻着什么）\n「据可靠消息，墓中有一块泥板——」（划掉，改成「据说」）\n「死亡将降临」——太平。\n「死亡将张开翅膀」——好。\n「死亡将展开翅膀，降临到打扰法老安息的人身上。」——好！！就这句。\n\n备注：独家被别家拿走了，进不去，拍不到。今晚想办法。\n备注2：要一张墓里黑着灯的照片。要一件「被诅咒的东西」。' },
      sketch: { title: '画工优素福的速写本', text: '（铅笔速写，边上有阿拉伯文和英文的小注。）\n\n东墙：十二个人拉着一架雪橇，雪橇上的龛里是国王。后头两个穿得不一样——是两位大臣。\n　注：送葬。国王在人间走的最后一段路。\n\n北墙·东头：戴蓝冠、披豹皮的阿伊，举着一把小斧子样的工具，对着裹白布的国王的嘴。\n　注：开口仪式——让他在那边重新能说话、能吃喝、能呼吸。\n北墙·中间：天空女神努特张开手，迎接穿着活人衣裳的国王。\n北墙·西头：冥王奥西里斯拥抱国王；国王身后，是他的「卡」——另一个自己。\n　注：老师说，北墙这三幅要从右往左读。画上人脸朝哪边，就从哪边读起。\n\n西墙：十二只狒狒，迎着太阳船——《冥界之书》里，夜里的第一个钟点。\n　注：国王跟着太阳神，开始在冥界里夜航。\n\n（最后一页，画着神龛门前地上的一只小眼睛，旁边写着：「这个，还没编号。」）' }
    },
    legend: '1922年11月4日，在英国贵族卡纳冯勋爵出资、霍华德·卡特主持的发掘中，工人们在帝王谷拉美西斯六世墓下方清理古代工匠小屋的遗迹时，发现了一级凿进岩石的台阶。十六级台阶下，是第十八王朝少年国王图坦卡蒙的墓（编号KV62）：11月26日前室被打开，1923年2月墓室的封墙被拆开，里面是几乎填满整间屋子的镀金神龛。墓中出土了五千多件文物，清理、登记和保护持续了约十年。这座墓是埃及工人们挖开的：据卡特本人的记录，发掘队的大工头是艾哈迈德·杰里加尔，工头还有加德·哈桑、侯赛因·阿布·阿瓦德和侯赛因·艾哈迈德·赛义德，他们带着来自西岸村庄的工人清运碎石、守卫墓室、搬运文物。流传很广的「第一级台阶是送水的男孩侯赛因·阿卜杜·拉苏尔发现的」，来自他的家族和后来的口述，当年的发掘日记里没有写，真假难以考证。\n\n「诅咒」是报纸炒作出来的。1923年1月，勋爵把发掘消息的独家报道权卖给了伦敦《泰晤士报》，其他报社（包括埃及本地报纸）进不了现场，不满之下，耸人听闻的故事越写越多；3月，一位英国女小说家公开写信，警告擅闯法老墓的人会受「可怕的惩罚」。4月5日，勋爵在开罗去世，据记载是蚊虫叮咬处感染引发的血液中毒和肺炎。此后「诅咒」成了现成的标题：据说他去世时开罗全城停电，据说他在英国的狗同时嚎叫着死去——这些都出自后来的转述，无从核实。至于「死亡将展开翅膀，降临到打扰法老安息的人身上」，据说刻在墓里的某块泥板或门楣上，但出土文物和考古记录里从没找到过这样的铭文（这句话最早出自谁笔下，至今也说不清）。墓里真正写着的，是像前室那只白色「许愿杯」上的祝福：「愿你的卡长存，愿你度过百万年，热爱底比斯的人，面朝北风坐着，双眼看见幸福。」\n\n后来的人一次次去数「死于诅咒的人」。2002年《英国医学杂志》上的一项研究统计了当时在埃及的四十多名西方人，参加过开墓等关键场合的人和没参加的人，寿命并没有明显差别；卡特本人在墓里工作了十年，1939年才去世，享年64岁。而日复一日在墓里干活、守夜的埃及工人，既很少被写进「诅咒名单」，也很少被写进发掘的故事——直到发掘一百周年前后，他们的名字和照片才越来越多地被展出和讨论。墓中文物全部留在了埃及，如今陈列在吉萨的大埃及博物馆；2010年，纽约大都会艺术博物馆把馆藏中19件被认定出自这座墓的小件文物归还了埃及。\n\n（本章中的古尔纳青年卡里姆、守夜的老工头阿卜杜·萨拉姆、记者莫顿、文物局的哈米德先生、画工优素福和他的速写本、那份报纸和莫顿的记者本，全部是游戏虚构；「1923年4月4日夜里有人闯进墓里」、那只蓝色的荷鲁斯之眼护身符和它的位置、「照壁画顺序摸墙」的规矩、报纸化成的怪物、古代封墓人的幻影、夜里前室「东西全回来了」，也都是本章编的。真实的发掘中，那年春天前室早已清空，工作重心在附近塞提二世墓里的化验室；地图方位为了玩法做了简化。墓门上的「墓地印」（伏卧的胡狼与九个捆缚的俘虏）和王名印、门上被盗墓者打穿后只盖着墓地印的补封处、墓室北墙从右往左的三幅壁画、东墙的送葬行列和西墙的十二只狒狒，取自公开的考古记录。真实人物在本章中只作为背景提及，没有虚构他们的言行。）',
    start: { map: 'valley', x: 7, y: 10, dir: 1 },
    resume: {
      dark: async S => { if (S.f.ph !== 'dark') return; await startDark(S, true); }
    },
    async intro(S) {
      await S.card('第二十九夜　法老的诅咒', '1923年4月4日夜　埃及卢克索　帝王谷', '去年十一月，古尔纳村的工人们\n在帝王谷的碎石底下，挖出了第一级台阶。\n\n今年春天，报纸上的字，\n比墓里的字多得多。');
    },
    tiles: {
      pitwall: { solid: true, paint(R, X, Y) {   // 凿开的岩壁：上沿亮，往坑里一侧发暗，带凿痕
        TILE.sand.paint(R, X, Y); R(0, 0, 16, 16, '#7a6646'); R(0, 0, 16, 2, '#a08a60');
        for (let i = 0; i < 4; i++) R(((hash(X, Y, i) * 12) | 0) + 1, 3 + i * 3, 3, 1, '#5a4a30');
        if (X === 9) R(12, 2, 4, 14, '#3a2e1c'); else if (X === 13) R(0, 2, 4, 14, '#3a2e1c'); else R(0, 12, 16, 4, '#3a2e1c');
      } },
      steps: { solid: false, paint(R, X, Y) {   // 一级一级往下：越往北越暗，每格两级台阶
        const k = Math.min(.62, Math.max(0, (10 - Y) * .12));
        for (let i = 0; i < 2; i++) { R(0, i * 8, 16, 8, shade('#9a8660', -k - i * .05)); R(0, i * 8, 16, 1, shade('#c0ac80', -k)); R(0, i * 8 + 6, 16, 2, shade('#4a3c26', -k)); }
      } },
      limef: { solid: false, paint(R, X, Y) { R(0, 0, 16, 16, '#8e8470'); for (let i = 0; i < 9; i++) { const h = hash(X, Y, i + 40); R((h * 15) | 0, (hash(Y, X, i + 41) * 15) | 0, 2, 1, i % 2 ? '#a0967e' : '#7a705c'); } } },
      boulder: { solid: true, paint(R, X, Y) { TILE.sand.paint(R, X, Y); R(1, 4, 14, 11, '#6a5a40'); R(2, 3, 10, 3, '#7e6c4c'); R(3, 5, 4, 2, '#90805c'); R(1, 13, 14, 2, '#3a3020'); } }
    },
    sprites: {
      campfire(g, e, t, R) {
        R(2, 11, 12, 3, '#3a3430'); R(3, 10, 2, 2, '#5a524a'); R(11, 10, 2, 2, '#5a524a'); R(7, 12, 2, 2, '#4a4440');
        R(4, 9, 8, 2, '#3a2414'); R(5, 8, 6, 1, '#4a2e18');
        if (e.off) { R(6, 9, 1, 1, '#a83a1a'); R(9, 9, 1, 1, '#6a2a14'); R(7, 5, 1, 3, 'rgba(160,160,160,.4)'); return; }
        const f = Math.sin(t * 14 + e.px) * 1.5;
        R(5, 3 + f * .5, 6, 6, '#c8501a'); R(6, 1 - f * .3, 4, 7, '#e8801a'); R(7, 3, 2, 5, '#f8d060'); R(7, -f, 1, 2, '#e8801a');
      },
      kettle(g, e, t, R) { R(4, 8, 8, 6, '#2a5a8a'); R(5, 7, 6, 1, '#3a6a9a'); R(7, 5, 2, 2, '#2a5a8a'); R(12, 9, 3, 1, '#2a5a8a'); R(1, 9, 3, 3, '#1a3a5a'); R(4, 14, 8, 1, '#1a1410'); R(6, 9, 2, 1, '#8ab0d0'); },
      tent(g, e, t, R) {
        for (let i = 0; i < 14; i++) R(16 - i * 1.15 - 1, -4 + i, i * 2.3 + 2, 1, i % 4 === 0 ? '#988a6a' : '#a89a78');
        R(0, 10, 32, 2, '#8a7c5e'); R(13, 2, 6, 10, '#1a140c'); R(15, -6, 2, 18, '#5a4a32'); R(0, 12, 32, 2, '#3a3020');
      },
      ledger(g, e, t, R) { bx2(R, 2, 6, 12, 8, '#6a4a2a'); R(3, 3, 10, 4, '#e8e0c8'); R(8, 3, 1, 4, '#8a7a5a'); R(4, 4, 3, 1, '#4a4030'); R(9, 4, 3, 1, '#4a4030'); R(4, 5, 2, 1, '#4a4030'); },
      genshed(g, e, t, R) {
        bx2(R, 0, -10, 32, 25, '#6a5236'); for (let x = 3; x < 32; x += 5) R(x, -9, 1, 23, '#5a442c'); R(-1, -13, 34, 4, '#4a3a28');
        R(20, -2, 8, 16, '#3a2c1c'); R(26, 5, 1, 2, '#c9a35a'); R(4, -24, 3, 12, '#3a3a3a');
        if (!e.off) { const p = (t * 1.6) % 1; R(3, -26 - p * 8, 4, 3, `rgba(120,120,120,${.5 - p * .45})`); R(5 + p * 3, -30 - p * 10, 3, 3, `rgba(120,120,120,${.35 - p * .3})`); }
        R(5, -2, 10, 6, '#2a2620'); R(6, -1, 8, 1, '#5a5244');
      },
      pole(g, e, t, R) { R(7, -20, 2, 34, '#5a4632'); R(3, -20, 10, 1, '#5a4632'); R(11, -19, 1, 3, '#2a2a2a'); R(10, -16, 3, 3, e.off ? '#4a4638' : '#fff0b0'); R(6, 13, 4, 2, '#3a2a1a'); },
      zir(g, e, t, R) { R(3, 12, 10, 3, '#3a2a1a'); R(4, -2, 8, 14, '#9a5a34'); R(3, 1, 10, 9, '#a8643c'); R(5, -4, 6, 2, '#7a4422'); R(5, 2, 2, 6, '#b87a50'); R(4, 10, 8, 1, '#6a3a20'); },
      donkey(g, e, t, R) {
        const b = '#6a625a', d = '#4a4440'; R(2, 2, 11, 6, b); R(12, -3, 3, 7, b); R(13, -6, 4, 4, b); R(13, -8, 1, 3, d); R(15, -8, 1, 3, d); R(16, -4, 1, 1, '#111');
        R(3, 8, 2, 6, d); R(10, 8, 2, 6, d); R(1, 3, 1, 4, d); R(4, 1, 7, 2, '#8a5a3a'); R(6, 3, 3, 4, '#7a4a2a'); R(16, -3, 1, 2, '#c8c0b0');
      },
      kv9(g, e, t, R) { R(2, -10, 44, 26, '#4a3a24'); R(4, -12, 40, 3, '#7a6646'); R(8, -6, 32, 22, '#0a0806'); R(8, -6, 32, 2, '#2a2018'); R(6, -8, 36, 2, '#5a4a30'); },
      labdoor(g, e, t, R) { R(1, -8, 14, 24, '#4a3a24'); R(3, -6, 10, 22, '#5a4228'); for (let x = 4; x < 13; x += 2) R(x, -5, 1, 20, '#2a2a2a'); R(3, 2, 10, 1, '#2a2a2a'); R(10, 3, 2, 3, '#8a7a4a'); },
      hutst(g, e, t, R) { const c = '#7a6a4a'; R(0, 6, (e.w || 1) * 16, 4, c); R(0, 6, (e.w || 1) * 16, 1, '#9a8a64'); R(0, 10, (e.w || 1) * 16, 2, '#4a3e2a'); R(0, 2, 4, 8, c); R((e.w || 1) * 16 - 4, 3, 4, 7, c); },
      tgate(g, e, t, R) {
        R(0, 0, 16, 16, '#2a2218');
        if (e.open) { R(2, 1, 12, 15, '#e8c878'); R(2, 1, 2, 15, '#4a4a4a'); R(12, 1, 2, 15, '#4a4a4a'); }
        else { R(2, 1, 12, 15, '#0a0806'); for (let x = 3; x < 14; x += 3) R(x, 1, 1, 15, '#5a5a5e'); R(2, 6, 12, 1, '#5a5a5e'); R(6, 8, 4, 3, '#8a7a4a'); }
      },
      bulb(g, e, t, R) { R(7, -14, 2, 8, '#1a1a1a'); R(6, -6, 4, 2, '#3a3a3a'); R(6, -4, 4, 4, e.off ? '#5a5648' : '#fff4c0'); if (!e.off) R(7, -3, 2, 2, '#ffffff'); },
      camera(g, e, t, R) { R(3, 8, 9, 6, '#1a1a1a'); R(5, 9, 4, 4, '#3a3a40'); R(6, 10, 2, 2, '#8a9aaa'); R(11, 5, 3, 2, '#8a8a8a'); R(12, 4, 1, 1, '#e8e8e8'); R(2, 14, 12, 1, 'rgba(0,0,0,.4)'); },
      papers(g, e, t, R) {
        const c = e.blank ? '#ece8dc' : '#d6d0be', ink = e.blank ? '#e0dccf' : '#4a4640';
        R(1, 8, 13, 6, shade(c, -.15)); R(2, 6, 12, 7, c); R(3, 7, 9, 2, ink); R(3, 10, 4, 2, ink); R(8, 10, 5, 1, ink); R(0, 11, 5, 3, c); R(10, 12, 5, 3, shade(c, -.08));
      },
      sealwall(g, e, t, R) {
        const st = e.st || 0;
        R(0, -8, 48, 24, '#5a5446'); R(2, -10, 44, 3, '#6a6454');
        if (st === 0) { R(6, -4, 36, 20, '#0a0806'); R(6, -4, 36, 2, '#2a241c'); return; }
        R(6, -4, 36, 20, '#c8bca0');
        for (let i = 0; i < 14; i++) R(6 + ((hash(i, 1, 9) * 34) | 0), -4 + ((hash(i, 2, 9) * 18) | 0), 2, 1, '#b4a888');
        R(18, -2, 12, 13, '#aa9c7c');
        const cart = (x, y) => { R(x, y, 3, 5, '#6a5a44'); R(x + 1, y + 1, 1, 3, '#c8bca0'); };
        const jack = (x, y, bg) => { R(x, y + 2, 4, 1, '#5a4a36'); R(x + 3, y, 1, 2, '#5a4a36'); R(x, y + 4, 4, 1, '#7a6a50'); };
        cart(8, -2); jack(12, -1); cart(8, 6); jack(13, 7); cart(14, 3);
        jack(20, 0); jack(25, 1); jack(21, 6); jack(25, 7);
        const drip = ((t * 2) | 0) % 3;
        for (const [x, y] of [[33, -2], [38, 0], [34, 6], [39, 8]]) { R(x, y, 3, 3, '#141010'); R(x + 1, y + 3, 1, 1 + drip, '#141010'); }
        if (st === 2) { R(19, 0, 10, 12, '#050403'); R(18, 2, 1, 8, '#7a6e54'); R(29, 1, 1, 9, '#7a6e54'); R(18, 12, 12, 4, '#9a8e70'); R(20, 13, 3, 2, '#b8ac8e'); }
      },
      couch(g, e, t, R) {
        const k = e.k || 'cow';
        R(2, 12, 44, 3, 'rgba(0,0,0,.35)');
        for (const x of [8, 38]) { R(x, 6, 3, 8, GOLDD); R(x, 13, 3, 2, '#3a2a10'); }
        bx2(R, 6, 1, 40, 7, GOLD, GOLDD); R(7, 2, 38, 1, GOLD2);
        if (k === 'cow') [[12, 3], [20, 4], [30, 3], [38, 4]].forEach(([x, y]) => R(x, y, 3, 2, '#1a1410'));
        if (k === 'ammut') for (let x = 9; x < 44; x += 4) R(x, 2, 1, 5, LAPIS);
        if (k === 'lion') for (let x = 10; x < 44; x += 6) R(x, 4, 2, 1, GOLDD);
        R(44, -3, 2, 7, GOLD);
        if (k === 'cow') { R(2, -6, 5, 10, GOLD); R(0, -10, 7, 6, GOLD); R(-1, -16, 1, 6, GOLD2); R(7, -16, 1, 6, GOLD2); R(1, -18, 5, 3, '#c8401a'); R(1, -7, 1, 1, '#111'); R(3, -9, 2, 2, '#1a1410'); }
        if (k === 'lion') { R(2, -5, 6, 9, GOLD); R(0, -12, 9, 8, GOLDD); R(1, -10, 6, 6, GOLD2); R(2, -8, 1, 1, '#111'); R(5, -8, 1, 1, '#111'); R(3, -6, 2, 1, '#6a3a10'); }
        if (k === 'ammut') { R(2, -5, 6, 9, GOLD); R(-5, -9, 12, 5, GOLD); R(-5, -5, 10, 1, '#f0e8d0'); R(0, -11, 2, 2, GOLD2); R(4, -11, 2, 2, GOLD2); R(2, -8, 1, 1, '#f4f0e0'); R(-5, -9, 3, 1, LAPIS); }
      },
      foodbox(g, e, t, R) { for (let i = 0; i < 3; i++) { R(2 + i, 10 - i * 5, 12 - i * 2, 5, '#e8e2d2'); R(2 + i, 14 - i * 5, 12 - i * 2, 1, '#a8a294'); R(5, 11 - i * 5, 2, 1, '#c8b88a'); } },
      throne(g, e, t, R) { R(2, -10, 12, 12, GOLD); R(3, -9, 10, 10, LAPIS2); R(5, -7, 6, 6, GOLD2); R(6, -5, 4, 3, FAI); R(1, 2, 14, 4, GOLD); R(2, 6, 2, 8, GOLDD); R(12, 6, 2, 8, GOLDD); R(1, 12, 3, 2, GOLD2); R(12, 12, 3, 2, GOLD2); R(0, -4, 2, 8, GOLD2); R(14, -4, 2, 8, GOLD2); },
      chest(g, e, t, R) { bx2(R, 0, 0, 32, 14, '#e0d4b0'); R(2, 2, 28, 8, '#c8642a'); R(3, 3, 26, 6, '#e8c890'); for (let i = 0; i < 5; i++) { R(5 + i * 5, 5, 2, 3, i % 2 ? '#2a4a8a' : '#8a2a1a'); R(6 + i * 5, 4, 1, 1, '#3a2a1a'); } R(0, -2, 32, 3, '#c8b890'); R(2, 14, 3, 2, '#5a4a30'); R(27, 14, 3, 2, '#5a4a30'); },
      chariot(g, e, t, R) {
        R(0, 4, 48, 26, 'rgba(0,0,0,.25)');
        for (const [cx, cy] of [[10, 10], [24, 6], [38, 12]]) { R(cx - 7, cy - 1, 14, 2, GOLDD); R(cx - 1, cy - 7, 2, 14, GOLDD); R(cx - 5, cy - 5, 10, 10, 'rgba(0,0,0,0)'); R(cx - 6, cy - 6, 12, 1, GOLD); R(cx - 6, cy + 5, 12, 1, GOLD); R(cx - 6, cy - 6, 1, 12, GOLD); R(cx + 5, cy - 6, 1, 12, GOLD); R(cx - 1, cy - 1, 2, 2, GOLD2); }
        bx2(R, 4, 16, 36, 12, GOLD, GOLDD); R(8, 19, 28, 6, GOLD2); for (let x = 10; x < 36; x += 5) R(x, 20, 2, 4, LAPIS); R(38, 18, 10, 2, '#6a4a2a');
      },
      naos(g, e, t, R) { R(2, -12, 12, 26, GOLD); R(1, -14, 14, 3, GOLD2); R(4, -8, 8, 16, GOLDD); R(5, -7, 3, 14, GOLD2); R(8, -7, 3, 14, GOLD2); R(2, 13, 12, 2, '#5a4010'); },
      vases(g, e, t, R) { R(2, 0, 5, 14, '#e8e0cc'); R(3, -3, 3, 3, '#d8d0bc'); R(9, 3, 5, 11, '#ece4d2'); R(10, 1, 3, 2, '#d8d0bc'); R(2, 5, 5, 1, '#b8a888'); R(9, 7, 5, 1, '#b8a888'); },
      cup(g, e, t, R) { R(5, 4, 6, 6, '#f0ece0'); R(4, 3, 8, 2, '#f8f4ea'); R(7, 10, 2, 3, '#e8e2d2'); R(5, 13, 6, 1, '#d8d0bc'); R(2, 4, 2, 5, '#e0dccc'); R(12, 4, 2, 5, '#e0dccc'); R(6, 6, 1, 3, '#c8c0aa'); },
      junction(g, e, t, R) {
        bx2(R, 3, 6, 10, 8, '#2a2a2a'); R(5, 8, 2, 2, '#c9a35a'); R(9, 8, 2, 2, '#c9a35a');
        if (e.loose) { R(0, 12, 4, 1, '#1a1a1a'); R(12, 13, 4, 1, '#1a1a1a'); if (((t * 6) | 0) % 4 === 0) { R(4, 7, 1, 1, '#fff6a0'); R(11, 6, 1, 1, '#fff6a0'); } }
        else { R(5, 4, 1, 3, '#1a1a1a'); R(10, 4, 1, 3, '#1a1a1a'); R(5, 4, 6, 1, '#1a1a1a'); R(7, 11, 2, 1, '#6ae070'); }
      },
      kastatue(g, e, t, R) {
        const K = '#141416', K2 = '#2a2a30';
        R(3, 12, 10, 3, '#2a2010');
        R(5, 6, 2, 7, K); R(9, 6, 2, 7, K); R(4, 13, 3, 1, GOLD); R(9, 13, 3, 1, GOLD);
        R(4, 0, 8, 7, GOLD); R(5, 1, 6, 5, GOLD2); R(7, 0, 2, 7, GOLDD);
        R(4, -9, 8, 9, K); R(5, -8, 2, 7, K2);
        R(3, -16, 10, 7, GOLD); R(2, -12, 2, 6, GOLD); R(12, -12, 2, 6, GOLD); R(5, -14, 6, 5, K);
        R(6, -12, 1, 1, '#f4f0e0'); R(9, -12, 1, 1, '#f4f0e0'); R(7, -18, 2, 2, GOLD2);
        R(13, -14, 1, 28, GOLDD); R(2, -6, 2, 2, GOLD); R(1, -4, 1, 8, GOLDD);
      },
      blockwall(g, e, t, R) {
        const st = e.st || 0;
        R(0, -8, 32, 24, '#5a5446');
        R(2, -6, 28, 22, '#c8bca0');
        for (let i = 0; i < 10; i++) R(3 + ((hash(i, 5, 9) * 24) | 0), -5 + ((hash(i, 6, 9) * 18) | 0), 2, 1, '#b4a888');
        const jack = (x, y) => { R(x, y + 2, 4, 1, '#5a4a36'); R(x + 3, y, 1, 2, '#5a4a36'); R(x, y + 4, 4, 1, '#7a6a50'); };
        for (const [x, y] of [[5, -4], [12, -3], [20, -4], [25, 0], [16, 2], [24, 7]]) jack(x, y);
        for (const [x, y] of [[8, 1], [19, -1], [13, 8]]) { R(x, y, 3, 5, '#6a5a44'); R(x + 1, y + 1, 1, 3, '#c8bca0'); }
        if (st === 2) { R(3, 6, 11, 10, '#050403'); R(3, 5, 11, 1, '#7a6e54'); }
        else { R(3, 6, 11, 10, '#aa9c7c'); jack(5, 8); jack(9, 11); }
      },
      annex(g, e, t, R) { R(10, 6, 6, 10, '#0a0806'); R(9, 5, 7, 1, '#5a5446'); R(10, 12, 6, 4, '#3a3428'); },
      shrine(g, e, t, R) {
        R(-2, 44, 100, 4, 'rgba(0,0,0,.4)');
        bx2(R, 0, -14, 96, 60, GOLD, GOLDD);
        R(-2, -18, 100, 5, GOLD2); for (let x = 0; x < 96; x += 4) R(x, -17, 2, 3, LAPIS);
        R(1, -13, 94, 2, GOLDD);
        for (let i = 0; i < 9; i++) for (let j = 0; j < 3; j++) {
          const x = 4 + i * 8, y = -6 + j * 16;
          R(x, y, 6, 12, GOLDD); R(x + 1, y + 1, 4, 10, GOLD2);
          if ((i + j) % 2) { R(x + 2, y + 2, 2, 8, FAI); for (let k = 0; k < 4; k++) R(x + 1, y + 2 + k * 2, 4, 1, LAPIS); }
          else { R(x + 2, y + 2, 2, 2, FAI); R(x + 1, y + 4, 4, 1, FAI); R(x + 2, y + 5, 2, 5, LAPIS); }
        }
        const rd = e.ready;
        R(78, -10, 16, 54, GOLDD); R(79, -9, 7, 52, rd ? '#ffe090' : GOLD2); R(87, -9, 6, 52, rd ? '#ffe090' : GOLD2);
        R(85, 12, 2, 6, '#3a2a10'); R(83, 14, 6, 1, '#c8b08a'); R(84, 15, 4, 3, '#8a3a2a');
        if (rd) { const p = (Math.sin(t * 3) + 1) / 2; R(78, -10, 16, 1, `rgba(255,250,210,${.4 + p * .5})`); R(78, 43, 16, 1, `rgba(255,250,210,${.4 + p * .5})`); }
      },
      panel(g, e, t, R) {   // 北墙的壁画（墙面，w=2）
        const L = e.lit, bg = L ? '#ecc868' : '#a88a44', ln = '#3a2a10';
        R(0, -10, 32, 24, bg); R(0, -10, 32, 1, ln); R(0, 13, 32, 1, ln);
        const fig = (x, y, body, head, crown) => { R(x, y + 3, 4, 8, body); R(x + 1, y, 3, 3, head); if (crown) R(x + 1, y - 2, 3, 2, crown); R(x + 1, y + 11, 1, 3, head); R(x + 3, y + 11, 1, 3, head); };
        const k = e.k;
        if (k === 'N1') { fig(6, -6, '#f0ece0', '#3a8a5a', '#f0ece0'); R(10, -2, 1, 6, '#f0ece0'); fig(20, -6, '#d8a830', '#8a5232', '#2a4aa0'); R(21, -2, 3, 1, '#2a1a10'); R(22, 0, 2, 1, '#2a1a10'); R(14, -3, 6, 1, '#5a4030'); R(13, -4, 2, 2, '#8a8a8a'); }
        if (k === 'N2') { fig(7, -6, '#2a4aa0', '#c87a4a', '#2a1a10'); R(11, -2, 6, 1, '#c87a4a'); R(3, -2, 4, 1, '#c87a4a'); fig(22, -6, '#f4f0e4', '#8a5232', '#d8a830'); }
        if (k === 'N3') { fig(5, -6, '#f0ece0', '#3a8a5a', '#f0ece0'); R(9, -3, 4, 1, '#3a8a5a'); fig(13, -6, '#f4f0e4', '#8a5232', '#d8a830'); fig(22, -6, '#f4f0e4', '#8a5232', '#2a1a10'); R(22, -11, 1, 3, '#2a1a10'); R(25, -11, 1, 3, '#2a1a10'); R(22, -11, 4, 1, '#2a1a10'); }
        if (L) { const p = (Math.sin(t * 4 + e.px) + 1) / 2; R(0, -10, 32, 1, `rgba(255,255,220,${.5 + p * .5})`); R(0, 13, 32, 1, `rgba(255,255,220,${.5 + p * .5})`); }
      },
      sidepanel(g, e, t, R) {   // 东墙/西墙的壁画：画在墙顶靠里的一条
        const L = e.lit, bg = L ? '#ecc868' : '#a88a44', W = e.k === 'W', x0 = W ? 8 : 0;
        R(x0, 0, 8, 48, bg); R(W ? 8 : 7, 0, 1, 48, '#3a2a10');
        if (W) { R(x0 + 1, 2, 6, 3, '#2a2a20'); R(x0 + 2, 1, 4, 1, '#d8a830'); for (let r = 0; r < 4; r++) for (let c = 0; c < 3; c++) { R(x0 + 1 + c * 2, 8 + r * 10, 2, 3, '#6a4a2a'); R(x0 + 1 + c * 2, 7 + r * 10, 1, 1, '#4a3a1a'); } }
        else { R(x0 + 2, 2, 4, 6, '#d8a830'); R(x0 + 1, 8, 6, 1, '#6a2a1a'); for (let r = 0; r < 6; r++) { R(x0 + 2, 11 + r * 6, 2, 4, '#f4f0e4'); R(x0 + 2, 10 + r * 6, 2, 1, '#8a5232'); R(x0 + 5, 11 + r * 6, 2, 4, '#f4f0e4'); R(x0 + 5, 10 + r * 6, 2, 1, '#8a5232'); } R(x0 + 4, 9, 1, 38, '#5a4030'); }
        if (L) { const p = (Math.sin(t * 4 + e.py) + 1) / 2; R(x0, 0, 8, 1, `rgba(255,255,220,${.5 + p * .5})`); R(x0, 47, 8, 1, `rgba(255,255,220,${.5 + p * .5})`); }
      },
      anubis(g, e, t, R) {
        R(-2, 4, 20, 10, GOLD); R(-2, 4, 20, 1, GOLD2); R(-1, 6, 18, 6, GOLDD); for (let x = 0; x < 16; x += 4) R(x, 7, 2, 4, LAPIS); R(-4, 12, 24, 1, '#5a4010');
        R(0, -2, 14, 6, '#121214'); R(10, -8, 5, 7, '#121214'); R(14, -6, 4, 3, '#121214'); R(11, -12, 2, 4, '#121214'); R(14, -11, 1, 3, '#121214');
        R(12, -6, 1, 1, GOLD2); R(10, -3, 4, 1, GOLD); R(1, 3, 3, 1, '#121214'); R(1, -1, 1, 4, '#121214');
      },
      treas(g, e, t, R) { R(0, 0, 8, 32, '#050403'); R(7, 0, 1, 32, '#3a2a10'); },
      scaffold(g, e, t, R) { R(0, 4, 32, 3, '#8a6a42'); R(0, 4, 32, 1, '#a8885a'); R(2, 7, 2, 8, '#6a4a2a'); R(28, 7, 2, 8, '#6a4a2a'); R(14, 7, 2, 8, '#6a4a2a'); R(6, -2, 10, 6, '#e8e2d0'); R(7, -1, 8, 1, '#7a7060'); R(7, 1, 5, 1, '#7a7060'); R(18, 1, 6, 3, '#4a6a8a'); R(20, 0, 1, 1, '#c9a35a'); },
      oars(g, e, t, R) { for (let i = 0; i < 3; i++) { R(4, 4 + i * 4, 52, 1, '#5a3a20'); R(50 + i * 2, 3 + i * 4, 8, 3, '#4a2e18'); } },
      spot(g, e, t, R) {
        if (e.eye) { R(4, 8, 8, 4, '#3a7ad0'); R(5, 9, 6, 2, '#5aa0f0'); R(7, 9, 2, 2, '#101828'); R(4, 12, 3, 2, '#3a7ad0'); R(9, 12, 1, 3, '#3a7ad0'); return; }
        if (e.ready) { const b = (Math.sin(t * 5) + 1) / 2; R(5, 9, 6, 2, `rgba(255,240,180,${.3 + b * .5})`); R(7, 7, 2, 6, `rgba(255,240,180,${.2 + b * .5})`); }
      },
      paperwing(g, e, t, R) {
        const fz = e.fz, fl = fz ? 0 : Math.sin(t * 16 + e.px * .1), up = Math.round(fl * 3);
        const P = fz ? '#9a968a' : '#d8d2bc', P2 = fz ? '#7e7a70' : '#b8b29c', INK = '#141012';
        R(2, 13, 12, 2, 'rgba(0,0,0,.3)');
        for (let i = 0; i < 3; i++) {
          const y = -6 + i * 4 - Math.round(up * (3 - i) / 3);
          R(-9 + i * 2, y, 9, 4, i % 2 ? P2 : P); R(-8 + i * 2, y + 1, 6, 1, '#6a6458');
          R(16 - i * 2, y, 9, 4, i % 2 ? P2 : P); R(17 - i * 2, y + 1, 6, 1, '#6a6458');
        }
        R(3, -9, 10, 20, P); R(4, -10, 8, 1, P2); R(2, -4, 1, 10, P2); R(13, -5, 1, 11, P2);
        for (let y = 2; y < 10; y += 2) R(4, y, 8, 1, y % 4 ? '#8a8474' : '#6a6458');
        R(3, -8, 10, 2, INK);
        R(5, -4, 2, 3, INK); R(9, -4, 2, 3, INK); R(5, -1, 1, 2 + (((t * 3) | 0) % 3), INK); R(10, -1, 1, 1 + (((t * 3 + 1) | 0) % 3), INK);
        R(6, 3, 4, 2, INK); R(7, 3, 1, 1, P); R(9, 4, 1, 1, P);
        if (fz) { const j = ((t * 20) | 0) % 2; R(-1 + j, -12, 1, 2, '#e8e0c8'); R(16 - j, -11, 1, 2, '#e8e0c8'); }   // 被灯定住：翅膀不扇，只是发抖
      }
    },
    maps: {
      /* ---------------- 帝王谷 · 夜 ---------------- */
      valley: {
        amb: 'night', dark: .8, plr: 3.2, wall: 'stone', floor: 'sand',
        wallC: { face: '#7a6646', trim: '#4a3c28', top: '#1e1912' },
        legend: { 'P': 'pitwall', 'S': 'steps', 'K': 'boulder' },
        rows: [
          '############################',
          '############################',
          'ssssssssssssssssssssssssssss',
          'ssssssssssssssssssssssssssss',
          'sssssssssPPPPPssssssssssssss',
          'sssssssssPSSSPssssssssssssss',
          'sssssssssPSSSPssssssssssssss',
          'sssssssssPSSSPssssssssssssss',
          'sssssssssPSSSPssssssssssssss',
          'ssssssssssSSSsssssssssssssss',
          'ssssssssssssssssssssssssssss',
          'ssssssssssssssssssssssssssss',
          'ssssssssssssssssssssssssssss',
          'KKKKKKKKKKKKKKKKKKKKKKKKKKKK'],
        ents: [
          { id: 'kv9', x: 3, y: 1, w: 3, spr: 'kv9', on: S => S.narr('山崖上凿着一个大墓口——拉美西斯六世的墓，三千年来一直敞着。\n当年给他凿墓的工匠，就在山脚下搭小屋住。小屋的地基，正好压住了另一座墓的台阶。') },
          { id: 'lab', x: 22, y: 1, spr: 'labdoor', on: S => S.narr('塞提二世的墓，如今是发掘队的化验室。\n墓里搬出来的东西，一件一件在这里清理、加固、装箱。铁门锁着。') },
          { id: 'tent', x: 1, y: 8, w: 2, spr: 'tent', on: S => S.narr('守夜人歇脚的帆布棚子。里面铺着一张草席，一条毯子，一个装椰枣的布口袋。') },
          { id: 'ledger', x: 3, y: 10, spr: 'ledger', async on(S) { await S.note('roster'); S.f.roster = true; } },
          { id: 'reis', x: 4, y: 10, spr: '@reis', dir: 2, on: reisOn },
          { id: 'fire', x: 5, y: 10, spr: 'campfire', light: { r: 3.6, col: 'rgba(255,150,60,.25)', flick: true }, on: S => S.narr(S.f.returned ? '火灭了，灰还是温的。' : '篝火噼噼啪啪地响。老爹往火里扔了一把干椰枣核，香得发甜。') },
          { id: 'kettle', x: 5, y: 11, spr: 'kettle', on: S => S.narr('蓝色的搪瓷茶壶坐在石头上。茶熬得又浓又甜，老爹说，守夜就靠它。') },
          { id: 'paper', x: 8, y: 11, spr: 'newspaper', hidden: true, on: paperOn },
          { id: 'hut1', x: 6, y: 4, w: 2, spr: 'hutst', on: S => S.narr('一圈矮矮的碎石墙根——三千多年前，给国王凿墓的工匠住的小屋。\n去年十一月，就是在这样的墙根底下，铲子碰到了第一级台阶。') },
          { id: 'hut2', x: 15, y: 6, spr: 'hutst', on: S => S.narr('又一处古时工棚的墙根。碎石里还能捡到陶片。') },
          { id: 'tgate', x: 11, y: 4, spr: 'tgate', off: true, light: { r: 2.4, dy: 10, col: 'rgba(255,220,140,.2)' }, on: gateOn },
          { id: 'gen', x: 18, y: 2, w: 2, spr: 'genshed', on: S => S.narr(S.f.dream && !S.f.returned ? '发电机。' : '木板棚子里蹲着一台汽油发电机，突突突地响，震得棚顶的沙子往下掉。\n一根电线从这里拉出去，顺着杆子，一直拉进墓里。') },
          { id: 'pole1', x: 16, y: 5, spr: 'pole', light: { r: 2.4, dy: -14, col: 'rgba(255,230,160,.16)' }, on: S => S.narr('木头电线杆，顶上挂着一个灯泡，飞蛾围着它打转。') },
          { id: 'pole2', x: 13, y: 9, spr: 'pole', light: { r: 2.4, dy: -14, col: 'rgba(255,230,160,.16)' }, on: S => S.narr('电线从这根杆子拐下去，钻进了坑里。') },
          { id: 'sign', x: 15, y: 10, spr: 'sign', col: '#5a4a32', on: S => S.narr('木牌上用阿拉伯文和英文写着：「文物局　发掘重地　闲人免进」。\n英文那一行，被人用小刀划了一道。') },
          { x: 21, y: 9, spr: 'zir', on: S => S.narr('一口大陶缸，装着从尼罗河边驮来的水。缸壁渗着水珠，摸上去凉丝丝的。') },
          { x: 22, y: 9, spr: 'zir', on: S => S.narr('送水的孩子每天赶着驴，一趟一趟地把这两口缸灌满。') },
          { id: 'donkey', x: 24, y: 11, spr: 'donkey', on: S => S.narr('送水的驴，拴在桩子上打盹。你摸摸它的脖子，它甩了一下耳朵。') },
          { x: 27, y: 2, h: 11, spr: 'invisible', async touch(S) { S.toast('往东是回卢克索的路。守夜的人不能离岗。'); S.pos(26, S.pl.y, 1); } },
          { id: 'mor', x: 26, y: 10, spr: '@mor', dir: 1, hidden: true, on: S => S.f.returned ? S.say(MO, '……') : S.say(MO, '孩子，十镑，考虑考虑。') },
          { id: 'insp', x: 13, y: 10, spr: '@insp', dir: 1, hidden: true, on: S => S.say(HA, '天亮了。今天还有很多活要干。') }
        ],
        enter: valleyEnter,
        tick(S, dt) {
          if (S.f.dream || S.f.returned) return;
          genT -= dt; if (genT > 0) return; genT = .42;
          const d = Math.hypot(S.pl.x - 18.5, S.pl.y - 2);
          if (d < 9) S.tone('square', 50, 48, .09, .022 * (1 - d / 9) + .002, 0, 260);
        }
      },
      /* ---------------- 阶梯与甬道 ---------------- */
      corridor: {
        amb: 'drone', dark: .82, plr: 3, wall: 'plain', floor: 'limef',
        wallC: { face: '#8a8270', trim: '#5a5446', top: '#1c1a16' },
        legend: { 'S': 'steps' },
        rows: [
          '#########',
          '#########',
          '###...###',
          '###...###',
          '###...###',
          '###...###',
          '###...###',
          '###...###',
          '###...###',
          '###...###',
          '###...###',
          '###...###',
          '###SSS###',
          '###SSS###',
          '###SSS###',
          '###SSS###',
          '###SSS###',
          '###SSS###',
          '###SSS###',
          '#########'],
        ents: [
          { id: 'seal', x: 3, y: 1, w: 3, spr: 'sealwall', off: true, light: { r: 2, dy: 12, col: 'rgba(220,205,160,.12)' }, on: sealOn },
          { id: 'cb1', x: 4, y: 4, spr: 'bulb', solid: false, z: 1, light: { r: 3.2, col: 'rgba(255,225,150,.18)' } },
          { id: 'cb2', x: 4, y: 9, spr: 'bulb', solid: false, z: 1, light: { r: 3.2, col: 'rgba(255,225,150,.18)' } },
          { id: 'cb3', x: 4, y: 14, spr: 'bulb', solid: false, z: 1, light: { r: 3.2, col: 'rgba(255,225,150,.18)' } },
          { id: 'npile', x: 5, y: 3, spr: 'papers', solid: false, on: S => S.narr('一摞今天的报纸，用麻绳捆着，绳子松了。\n每一份的头版上，都有「诅咒」两个字。是莫顿带进来的。') },
          { id: 'draft', x: 3, y: 8, spr: 'book', col: '#3a3a2a', solid: false, async on(S) { if (S.once('draftF')) await S.narr('地上掉着一个硬皮本子。是莫顿的。'); await S.note('draft'); S.f.draft = true; } },
          { id: 'camera', x: 5, y: 11, spr: 'camera', solid: false, on: S => S.narr('一台折叠相机，镁光粉的托盘还是烫的，一股呛鼻子的焦味。\n他在这儿拍过一张。') },
          { id: 'g1', x: 3, y: 2, spr: '@anc', dir: 3, solid: false, hidden: true },
          { id: 'g2', x: 5, y: 2, spr: '@anc', dir: 3, solid: false, hidden: true },
          { id: 'cexit', x: 3, y: 18, w: 3, spr: 'invisible', touch: corrExit }
        ],
        enter: corrEnter,
        tick: corrTick
      },
      /* ---------------- 前室 ---------------- */
      ante: {
        amb: 'otherworld', dark: .9, plr: 2.6, wall: 'plain', floor: 'limef',
        wallC: { face: '#8e8672', trim: '#5a5446', top: '#1c1a16' },
        rows: [
          '##################',
          '##################',
          '#................#',
          '#................#',
          '#................#',
          '#................#',
          '#................#',
          '#................#',
          '#................#',
          '#................#',
          '#................#',
          '#########.########'],
        ents: [
          { id: 'block', x: 8, y: 1, w: 2, spr: 'blockwall', on: blockOn },
          { id: 'kaL', x: 7, y: 2, spr: 'kastatue', on: look('一尊和真人一般高的国王雕像，通身漆黑，头巾、短裙和凉鞋是金的。一手拄长杖，一手握权杖。\n黑色，是尼罗河两岸黑土的颜色——在这里，它的意思是复活。') },
          { id: 'kaR', x: 10, y: 2, spr: 'kastatue', on: look('另一尊守卫雕像，和左边那尊一模一样，眼睛是白石头嵌的，瞳仁黑亮。\n它们一左一右，守着墓室的门，守了三千多年。') },
          { id: 'cow', x: 2, y: 3, w: 3, spr: 'couch', k: 'cow', on: look('镀金的长床，床头是母牛的脑袋，两只角中间托着一轮红太阳，身上是黑色的斑点。\n是天上的母牛，要驮着国王去天上。') },
          { id: 'lion', x: 2, y: 6, w: 3, spr: 'couch', k: 'lion', on: look('镀金的长床，床头是两只瘦长的狮子，眼睛描着黑线。') },
          { id: 'ammut', x: 2, y: 9, w: 3, spr: 'couch', k: 'ammut', on: look('镀金的长床，床头是一张长长的嘴，露着牙——一半像河马，一半像鳄鱼。\n床底下有一扇矮门，通向侧室。') },
          { id: 'food', x: 5, y: 3, spr: 'foodbox', on: look('一摞白色的椭圆木盒，像一个个大鸡蛋。\n里面装着烤好的鸭子、牛肉、面包——给国王在那边吃的。') },
          { id: 'throne', x: 6, y: 6, spr: 'throne', on: look('一把金椅子，靠背上镶着蓝色和绿色的石头。\n画上是年轻的国王坐着，王后站在他面前，伸手往他肩上抹香膏。') },
          { id: 'naos', x: 13, y: 2, spr: 'naos', on: look('一座金色的小神龛，门上画着国王和王后，一个递东西，一个接。') },
          { id: 'vases', x: 16, y: 2, spr: 'vases', on: look('几只白色的雪花石膏瓶，瓶口封着，里面装的是油膏。') },
          { id: 'chest', x: 12, y: 5, w: 2, spr: 'chest', on: look('一只彩绘木箱。箱子上画着国王驾着战车打猎、打仗，画得比指甲盖还细。') },
          { id: 'chariot', x: 13, y: 8, w: 3, h: 2, spr: 'chariot', on: look('拆开的战车，车轮、车身叠在角落里，金箔在马灯下一闪一闪。\n当年搬进来的时候，门太窄，只能拆开了抬。') },
          { id: 'cup', x: 11, y: 10, spr: 'cup', async on(S) {
            if (S.f.ph === 'dark') return S.toast('一只白色的杯子，像一朵开着的莲花。');
            S.f.cup = true;
            await S.narr('一只白色雪花石膏的杯子，像一朵开着的莲花，两边的把手是小小的花苞。\n杯沿上刻着一圈字。画工优素福给老爹念过，你记得：');
            await S.narr('「愿你的卡长存，愿你度过百万年，\n热爱底比斯的人，面朝北风坐着，双眼看见幸福。」');
            await S.think('……这才是墓里写着的话。');
          } },
          { id: 'annex', x: 0, y: 10, spr: 'annex', on: look('西墙脚下的一扇矮门，通向侧室。\n侧室里乱得像被人翻过——三千多年前，贼来过，没来得及拿走多少，就被赶走了。') },
          { id: 'j1', x: 1, y: 4, spr: 'junction', on: S => junctionOn(S, 'j1') },
          { id: 'j2', x: 16, y: 6, spr: 'junction', on: S => junctionOn(S, 'j2') },
          { id: 'j3', x: 6, y: 10, spr: 'junction', on: S => junctionOn(S, 'j3') },
          { id: 'b1', x: 2, y: 4, spr: 'bulb', solid: false, z: 1, off: true, light: { r: 2.8, col: 'rgba(255,225,150,.2)' } },
          { id: 'b2', x: 15, y: 6, spr: 'bulb', solid: false, z: 1, off: true, light: { r: 2.8, col: 'rgba(255,225,150,.2)' } },
          { id: 'b3', x: 6, y: 9, spr: 'bulb', solid: false, z: 1, off: true, light: { r: 2.8, col: 'rgba(255,225,150,.2)' } },
          { id: 'pile1', x: 10, y: 9, spr: 'papers', decal: true, solid: false },
          { id: 'pile2', x: 16, y: 10, spr: 'papers', decal: true, solid: false },
          { id: 'morA', x: 1, y: 7, spr: '@mor', dir: 2 },
          { id: 'pw', x: 10, y: 9, spr: 'paperwing', solid: false, hidden: true, light: { r: 1.2, col: 'rgba(230,220,190,.14)' } },
          { id: 'pw2', x: 16, y: 10, spr: 'paperwing', solid: false, hidden: true, light: { r: 1.2, col: 'rgba(230,220,190,.14)' } },
          { id: 'aexit', x: 9, y: 11, spr: 'invisible', touch: anteExit }
        ],
        enter: anteEnter,
        tick(S, dt) {
          if (S.f.ph !== 'dark') return;
          const inL = litAt(S, S.pl.x, S.pl.y);
          /* 纸张扇动声：每 0.5 秒一下，越近越响（声音没有左右，方位靠画面上那团微光） */
          rustleT -= dt;
          if (rustleT <= 0) {
            rustleT = .5;
            let dmin = 99; for (const id of CHASERS) { const c = S.ent(id); if (c && !c.hidden && c.chase) dmin = Math.min(dmin, Math.hypot(c.px - S.pl.px, c.py - S.pl.py) / 16); }
            if (dmin < 9 && !S.busy) { const v = .05 * (1 - dmin / 9) + .006; S.tone('triangle', 1100, 320, .06, v, 0, 2200); S.tone('triangle', 900, 300, .05, v * .7, .07, 2200); }
          }
          for (const id of CHASERS) {
            const c = S.ent(id); if (!c || c.hidden || !c.chase) continue;
            if (S.isFrozen(id) !== inL) { S.freeze(id, inL); c.s.fz = inL; }
            if (!S.busy && !inL && near(S, c)) { c.chase = null; S.run(S2 => hitBy(S2, id)); return; }   // 一格以内算追上（引擎默认只有 11 像素）
          }
        }
      },
      /* ---------------- 墓室 ---------------- */
      burial: {
        amb: 'otherworld', dark: .86, plr: 2.6, wall: 'plain', floor: 'limef',
        wallC: { face: '#c49a3e', trim: '#7a5a20', top: '#1c160c' },
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
          '#######.########'],
        ents: [
          { id: 'shrine', x: 5, y: 4, w: 6, h: 3, spr: 'shrine', on: shrineOn },
          { id: 'pN3', x: 3, y: 1, w: 2, spr: 'panel', k: 'N3', off: true, light: { r: 1.8, dy: 4, col: 'rgba(255,220,130,.22)' }, on: S => panelOn(S, 'pN3') },
          { id: 'pN2', x: 7, y: 1, w: 2, spr: 'panel', k: 'N2', off: true, light: { r: 1.8, dy: 4, col: 'rgba(255,220,130,.22)' }, on: S => panelOn(S, 'pN2') },
          { id: 'pN1', x: 11, y: 1, w: 2, spr: 'panel', k: 'N1', off: true, light: { r: 1.8, dy: 4, col: 'rgba(255,220,130,.22)' }, on: S => panelOn(S, 'pN1') },
          { id: 'pE', x: 15, y: 4, h: 3, spr: 'sidepanel', k: 'E', off: true, light: { r: 1.8, dx: 0, dy: 24, col: 'rgba(255,220,130,.22)' }, on: S => panelOn(S, 'pE') },
          { id: 'pW', x: 0, y: 4, h: 3, spr: 'sidepanel', k: 'W', off: true, light: { r: 1.8, dx: 16, dy: 24, col: 'rgba(255,220,130,.22)' }, on: S => panelOn(S, 'pW') },
          { id: 'treas', x: 15, y: 1, h: 2, spr: 'treas', on: S => S.narr('东墙北头开着一个没有门的门洞，里面黑漆漆的，是另一间小屋子。\n发掘队拿木板把它挡了起来——今年还不打算进去。') },
          { id: 'anubis', x: 13, y: 2, spr: 'anubis', on: S => S.narr('门洞口趴着一只漆黑的胡狼，伏在一只镀金的箱子上，耳朵竖得笔直，眼睛描着金边。\n阿努比斯——守墓的神。它脸朝着墓室，像在守着谁睡觉。') },
          { id: 'scaffold', x: 12, y: 8, w: 2, spr: 'scaffold', on: scaffoldOn },
          { id: 'oars', x: 5, y: 3, w: 4, spr: 'oars', decal: true, solid: false, on: S => S.narr('神龛和北墙之间的地上，摆着几支黑色的木桨。\n据说，是给国王在那边划船用的。') },
          { id: 'spot', x: 11, y: 5, spr: 'spot', decal: true, solid: false, off: true, light: { r: 1.2, col: 'rgba(160,200,255,.2)' } },
          { id: 'pwF', x: 7, y: 9, spr: 'paperwing', solid: false, hidden: true },
          { id: 'gA', x: 6, y: 9, spr: '@anc', solid: false, hidden: true },
          { id: 'gB', x: 8, y: 9, spr: '@anc', solid: false, hidden: true },
          { id: 'bexit', x: 7, y: 10, spr: 'invisible', async touch(S) { await S.go('ante', 8, 2, 0); } }
        ],
        enter: burialEnter
      }
    }
  });
})();
