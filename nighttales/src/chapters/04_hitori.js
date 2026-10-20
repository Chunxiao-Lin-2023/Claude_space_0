/* ================= 第四夜 · 一个人的捉迷藏 ================= */
(() => {
  const dn = S => S.f.dname || '小熊';
  let ambT = 4, gigT = 0, tvT = 0, gazeT = 0, lastTile = '';
  const BEAR = '#a07a50', WETB = '#7a5a3a';
  const TC = { red: '#c01818', white: '#e8e4dc', black: '#1a1a1a' };
  const TNAME = { red: '红', white: '白', black: '黑' };

  /* ---------------- 通用：目标（含盐水时加前缀）/ 检查点 ---------------- */
  function goal(S, t) { S.f.gl = t; S.goal((S.f.mouth ? '〔含着盐水·不能出声〕' : '') + t); }
  function regoal(S) { if (S.f.gl) goal(S, S.f.gl); }
  /* 用自己的名字起名以后，后面的检查点都不再存：所有失败都回到「起名」那一刻 */
  function cp(S, n) { if (!S.f.selfName) S.cp(n); }
  function buzz(S, msg) { S.tone('square', 70, 60, .22, .05); S.tone('square', 70, 60, .22, .05, .3); S.toast(msg || '手机在被子里震了一下'); }

  /* ---------------- 准备清单 ---------------- */
  function need(S) {
    const f = S.f, L = [];
    if (!f.gotBear) L.push(['房间', '布偶']);
    if (!(f.opened || S.has('scissors'))) L.push(['房间', '剪刀']);
    if (!(f.sewn || S.has('sewkit'))) L.push(['房间', '针线']);
    if (!(f.rice || S.has('rice'))) L.push(['厨房', '米']);
    if (!S.has('knife')) L.push(['厨房', '刀']);
    if (!(f.saltPlaced || S.has('saltcup'))) L.push(['厨房', '盐水']);
    if (!(f.nail || S.has('nail'))) L.push(['浴室', '指甲']);
    if (!f.tubFull) L.push(['浴室', '放水']);
    if (S.has('saltcup') && !f.saltPlaced) L.push(['房间', '盐水放进壁橱']);
    return L;
  }
  const dollMade = f => f.opened && f.rice && f.nail && f.sewn && f.named;
  function prepDone(S) {
    const f = S.f;
    return [f.gotBear, f.opened || S.has('scissors'), f.rice || S.has('rice'), f.nail || S.has('nail'), f.sewn || S.has('sewkit'), S.has('knife'), f.saltPlaced || S.has('saltcup'), dollMade(f), f.tubFull, f.saltPlaced].filter(Boolean).length;
  }
  function prepClock(S) { const m = 14 + Math.round(prepDone(S) / 10 * 44); return '2:' + String(m).padStart(2, '0'); }
  function prepGoal(S) {
    if (S.f.phase !== 'prep') return;
    if (!S.f.readRules) return goal(S, '在电脑上看看那个帖子');
    const L = need(S);
    if (L.length) {
      const by = {}; for (const [a, t] of L) (by[a] = by[a] || []).push(t);
      return goal(S, '准备 · ' + ['房间', '厨房', '浴室'].filter(a => by[a]).map(a => a + '：' + by[a].join('、')).join('　') + (dollMade(S.f) ? '' : '　（布偶在暖桌上做）'));
    }
    if (!dollMade(S.f)) return goal(S, '东西都齐了——在暖桌上把布偶做好');
    goal(S, '等到凌晨三点（看墙上的钟）');
  }
  function checklist(S) {
    const f = S.f, mk = (ok, t) => (ok ? '■ ' : '□ ') + t;
    return [
      '（你把要做的事抄在便利贴上，贴在显示器边上。做完一样，涂黑一格。）', '',
      mk(f.gotBear, '布偶 ………… 床角那只熊'),
      mk(f.opened || S.has('scissors'), '剪刀 ………… 书架上的笔筒'),
      mk(f.sewn || S.has('sewkit'), '针线 ………… 壁橱（妈妈放的针线包）'),
      mk(f.rice || S.has('rice'), '米 ……………… 厨房的米桶'),
      mk(S.has('knife'), '刀 ……………… 厨房的抽屉'),
      mk(f.saltPlaced || S.has('saltcup'), '盐水 ………… 厨房的调料架'),
      mk(f.nail || S.has('nail'), '指甲 ………… 浴室镜柜里的指甲刀'), '',
      mk(dollMade(f), '在暖桌上做布偶：剪开 → 塞米和指甲 → 缝线 → 起名'),
      mk(f.tubFull, '浴缸放好水'),
      mk(f.saltPlaced, '盐水放进躲的地方（壁橱）'), '',
      '墙上的钟：' + prepClock(S) + '。三点整开始。'
    ].join('\n');
  }
  function ritGoal(S) {
    const f = S.f;
    if (!f.said) return goal(S, '对布偶说三遍「第一个当鬼的是……」');
    if (!f.inTub) return goal(S, '把布偶放进浴缸');
    if (!(f.lR && f.lH && f.lB)) return goal(S, '关掉家里所有的灯（房间、走廊、浴室）');
    if (!f.counted) return goal(S, '打开电视，闭上眼睛数到十');
    if (!f.stabbed) return goal(S, '拿着刀回浴室');
    return goal(S, '马上躲进壁橱！');
  }

  /* ---------------- 灯 ---------------- */
  const LIGHTS = { R: ['room', .94, '「咔哒」。房间里只剩下电脑屏幕那一点蓝光。'], H: ['hall', .95, '走廊黑了。冰箱嗡嗡地响，微波炉的时钟发着一点绿光。'], B: ['bath', .97, '浴室的灯灭了。半开的门后面，黑得像一口井。'] };
  function lightSwitch(k) {
    return async S => {
      const f = S.f, sw = S.ent('sw' + k), [map, dk, msg] = LIGHTS[k];
      if (f.phase === 'prep') { S.sfx('switch'); await S.wait(150); S.sfx('switch'); return S.narr('灯闪了一下，又亮了。\n……现在关还太早。'); }
      if (f.phase === 'ritual') {
        if (!f.inTub) return S.narr('先把它放进浴缸，再关灯。');
        if (f['l' + k]) return S.narr('已经关了。开关冰凉冰凉的。');
        f['l' + k] = true; sw.off = true; S.sfx('switch'); S.dark(dk, map);
        await S.narr(msg);
        if (f.lR && f.lH && f.lB) {
          S.ent('pc').s.off = true; S.plr(2.5);
          await S.narr('最后，你按灭了电脑显示器。\n从现在起，只能用手机看帖子了。');
        }
        return ritGoal(S);
      }
      if (f.phase === 'after') {
        sw.off = !sw.off; S.sfx('switch'); S.dark(sw.off ? dk : null, map);
        if (!sw.off && S.once('lightBack')) await S.narr('灯亮了。日光灯「嗡」地一声。\n……原来这个房间这么小。');
        return;
      }
      await S.narr('你的手指碰到开关，又缩了回来。\n规矩说，结束之前不能开灯。');
    };
  }

  async function pcUse(S) {
    const f = S.f;
    if (f.phase === 'prep') {
      if (!f.readRules) {
        await S.narr('2ch オカルト板。帖子标题是：\n「一个人的捉迷藏，真的有人试过吗？」');
        await S.note('rules');
        await S.note('rules2');
        await S.think('（降灵术啊……骗小孩的吧。）');
        await S.narr('你盯着屏幕看了很久。然后新开了一个帖子，敲下第一行字。');
        await S.note('t1');
        f.readRules = true; prepGoal(S);
        await S.think('（……开个玩笑而已。做完了，就当是给这个失眠的晚上找点事干。）');
        return S.narr('你把要准备的东西抄在一张便利贴上，贴在显示器边上。\n（随时可以回电脑这里看清单。）');
      }
      if ((f.t1buzz || prepDone(S) >= 5) && !f.t1read) {
        f.t1read = f.t1buzz = true; S.sfx('blip');
        await S.narr('帖子底下多了几条回复。');
        return S.note('t1b');
      }
      const r = await S.ask('电脑屏幕的光有点刺眼。', ['看看准备清单', '再看一遍做法', '看看自己的帖子', '算了']);
      if (r === 0) await S.note('准备清单', checklist(S));
      else if (r === 1) { await S.note('rules'); await S.note('rules2'); }
      else if (r === 2) { await S.note('t1'); if (f.t1read) await S.note('t1b'); }
      return;
    }
    if (f.phase === 'seek' && spotHere(S, 3)) return spotUse(S, 3);
    if (f.phase === 'after') return S.narr('你按亮显示器。帖子还开着，停在第50楼。\n你不想再看了，把它关了。');
    await S.narr('显示器黑着。屏幕上映出一个模模糊糊的人影——是你自己。\n……应该是你自己。');
  }

  /* ---------------- 布偶：准备 & 三点 ---------------- */
  async function getBear(S) {
    const f = S.f;
    if (f.gotBear) return S.narr('床上只剩一个熊形状的凹陷。');
    S.hide('kumaBed'); S.give('kuma'); f.gotBear = true;
    await S.narr('床角那只熊。美纪今年四月送的生日礼物。\n分手以后你一直没扔，也一直没正眼看过它。');
    await S.narr('左耳上缝着一个布标，背面有圆珠笔写的字。');
    await S.note('tag');
    await S.think('（有手，有脚。……就你了。）');
    prepGoal(S);
  }
  async function kotatsuUse(S) {
    const f = S.f, d = S.ent('dollK'), tv = S.ent('tv');
    if (f.phase === 'prep') {
      if (!f.gotBear) return S.narr('暖桌上摆着吃剩的杯面、遥控器，和一个空啤酒罐。\n要做布偶的话……得先有个布偶。床角那只熊就行。');
      let did = false;
      if (d.hidden) { S.take('kuma'); S.show('dollK'); did = true; await S.narr('你把空罐子扫到一边，把熊放在暖桌上。\n它歪着头，用两颗塑料眼睛看着你。'); }
      const miss = () => {
        const M = [];
        if (!f.opened && !S.has('scissors')) M.push('剪刀（书架上的笔筒）');
        if (!f.rice && !S.has('rice')) M.push('米（厨房的米桶）');
        if (!f.nail && !S.has('nail')) M.push('指甲（浴室镜柜里有指甲刀）');
        if (!f.sewn && !S.has('sewkit')) M.push('针线（壁橱里，妈妈放的针线包）');
        return M;
      };
      let listed = false;
      if (S.once('kotList') && miss().length) {
        listed = true;
        await S.narr('你把帖子上的步骤在脑子里过了一遍。\n还缺：' + miss().join('、') + '。');
        await S.note('准备清单', checklist(S));
      }
      if (!f.opened && S.has('scissors')) {
        S.sfx('cut'); f.opened = true; did = true; d.s.op = true;
        await S.narr('你沿着背上的缝线剪开一道口子，把棉花一团一团地掏出来。\n熊一下子瘪了下去，像一张空空的皮。');
        tv.s.power = 'static'; tv.s.off = false; S.sfx('tv'); await S.wait(320); tv.s.power = false; tv.s.off = true;
        await S.think('（……电视刚才是不是亮了一下？）');
      }
      if (f.opened && !f.rice && S.has('rice')) {
        S.take('rice'); f.rice = true; did = true; S.sfx('paper');
        await S.narr('你把米一把一把塞进去。米粒从指缝里漏出来，在桌面上蹦了几下。\n帖子说，米是它的内脏。');
      }
      if (f.opened && !f.nail && S.has('nail')) {
        S.take('nail'); f.nail = true; did = true;
        await S.narr('你把纸巾里那几片指甲倒进去，埋进米里。');
        await S.think('（指甲代表自己。……从现在起，它身体里有一小块是我。）');
      }
      if (f.opened && f.rice && f.nail && !f.sewn && S.has('sewkit')) {
        const r = await S.ask('针线包里有三种颜色的线。穿哪一根？', ['白线', '黑线', '红线']);
        f.thread = ['white', 'black', 'red'][r];
        S.sfx('tear'); f.sewn = true; d.s.tc = TC[f.thread]; did = true;
        await S.narr('你笨手笨脚地缝了十几针，针扎了两次手指。\n剩下的线，一圈一圈缠在它身上，最后在脖子上打了个死结。');
        await S.think(f.thread === 'red' ? '（……像被五花大绑了一样。）' : `（${TNAME[f.thread]}线。……反正都是线，应该没关系吧。）`);
      }
      if (f.sewn && !f.named) {
        S.cp('name');
        const r = await S.ask('给它起个名字。', ['小熊（它本来的名字）', '美纪', '浩']);
        f.dname = ['小熊', '美纪', '浩'][r]; f.named = true; did = true;
        if (r === 2) f.selfName = true;
        await S.think(['（就叫小熊吧。它本来就叫这个。）', '（反正她也不会知道。）', '（……就叫浩吧。反正它肚子里也有我的指甲。）'][r]);
        await S.say('阿浩', `你叫${dn(S)}。……听见没有？`);
        if (r === 2) { S.sfx('tick'); await S.narr('屋子里静了一下。\n冰箱的嗡嗡声停了半秒，又响了起来。'); }
      }
      prepGoal(S);
      const M = miss();
      if (M.length && !did) return listed ? undefined : S.narr('还差：' + M.join('、') + '。');
      if (M.length) return S.narr('接下来还差：' + M.join('、') + '。');
      if (!need(S).length && dollMade(f)) return S.think('都准备好了。剩下的……就是等三点。');
      if (dollMade(f)) return S.narr(`${dn(S)}坐在暖桌上，浑身缠着${TNAME[f.thread]}线。\n剩下的准备：` + need(S).map(x => x[1]).join('、') + '。');
      return;
    }
    if (f.phase === 'ritual' && !f.said) return sayFirst(S);
    if (f.phase === 'seek' && spotHere(S, 2)) return spotUse(S, 2);
    await S.narr(f.phase === 'after' ? '暖桌上散着几粒米，和半碗冷透了的杯面。' : '暖桌上散着几粒米。遥控器还在原来的地方。');
  }
  async function sayFirst(S) {
    const f = S.f;
    await S.narr('你把它捧起来，面对面。\n它比你想象的沉——肚子里全是米。');
    for (let i = 0; i < 3; i++) {
      const opts = f.dname === '浩' ? ['浩'] : ['浩', dn(S)];
      const r = await S.ask(`（第${'一二三'[i]}遍）「第一个当鬼的是——」`, opts);
      const who = opts[r];
      await S.say('阿浩', `第一个当鬼的是${who}。`, { style: 'big' });
      if (who !== '浩' && !f.wrongFirst) {
        f.wrongFirst = true; S.sfx('tick'); await S.wait(400);
        await S.narr('……说错了。你说的是它的名字。\n帖子说，第一个当鬼的，要是你自己。');
        await S.think('（说出口的话，是收不回来的。……9楼是这么说的吧。）');
        continue;
      }
      if (i === 0) { S.sfx('tick'); await S.wait(500); }
      if (i === 1) await S.narr('自己的声音在这么小的房间里，听起来像是别人的。');
    }
    S.sfx('heart'); await S.wait(500);
    await S.narr(f.wrongFirst ? '说完了。\n熊的脑袋往你这边歪了一下。……不像是米沉下去了。' : '说完了。\n……熊的脑袋好像往你这边歪了一点。大概是米沉下去了。');
    f.said = true; S.hide('dollK'); S.give('kuma');
    ritGoal(S);
  }
  async function clockUse(S) {
    const f = S.f;
    if (f.phase === 'prep') {
      const L = need(S);
      if (L.length || !dollMade(f)) {
        await S.narr(`${prepClock(S)}。秒针咔哒咔哒地走。\n还没准备好的：` + (L.map(x => x[1]).concat(dollMade(f) ? [] : ['在暖桌上做布偶'])).join('、') + '。');
        return f.readRules ? S.note('准备清单', checklist(S)) : undefined;
      }
      const r = await S.ask('东西都准备好了。等到三点吗？', ['等', '再检查一下']); if (r) return;
      S.amb('none'); await S.fade(1, 600);
      await S.card('凌晨 2:59', '', `你坐在暖桌前，盯着那只缝满${TNAME[f.thread]}线的熊。\n${dn(S)}也盯着你。\n\n秒针走到了十二。` + (S.coop ? '\n\n（双人：可以在这里交换操作，由另一位来主持仪式。）' : ''));
      f.phase = 'ritual'; f.three = true; S.amb('room');
      await S.fade(0, 600);
      S.sfx('tick');
      await S.narr('三点整。\n楼下有辆车开过去。然后，什么声音都没有了。');
      ritGoal(S); cp(S, 'ritual');
      return;
    }
    if (f.phase === 'seek') return S.narr(`${fakeClock(S)}。……你盯着秒针看了很久，它好像走得比平时慢。\n帖子说，一到两个小时之内，必须结束。`);
    const t = { ritual: '三点过五分。', hide: '三点五十几分。', after: '四点四十几分。秒针又正常地走起来了。' };
    await S.narr(t[f.phase] || '');
  }

  /* ---------------- 电视 ---------------- */
  async function tvUse(S) {
    const f = S.f, tv = S.ent('tv');
    if (f.phase === 'prep') return S.narr('电视。这个点只有购物节目和天气预报。\n遥控器在暖桌上。');
    if (f.phase === 'ritual') {
      if (!f.inTub) return S.narr('还不到开电视的时候。');
      if (!(f.lR && f.lH && f.lB)) return S.narr('还有灯开着。帖子说，要关掉家里「所有的」灯。');
      if (f.counted) return S.narr('雪花。沙沙沙沙。');
      tv.s.power = 'static'; tv.s.off = false; S.sfx('tv'); S.amb('tv');
      await S.narr('你按下遥控器。屏幕「嗡」地一声亮了。\n没有台，只有雪花。灰白的光一跳一跳地铺满了房间。');
      await S.ask('雪花的光一跳一跳的。闭上眼睛，数到十。', ['……闭上眼睛']);
      await S.fade(1, 500);
      await S.say('阿浩', ['一。', '二。', '三。']);
      S.sfx('drip'); await S.wait(500);
      await S.say('阿浩', ['四……', '五。']);
      S.sfx('splash'); await S.wait(600);
      await S.narr('……浴室那边，「哗啦」一声。');
      await S.think('（别睁眼。还没数完。）');
      await S.say('阿浩', ['六……七……']);
      S.sfx('whisper'); await S.wait(500);
      await S.say('阿浩', ['八。', '九。', '十。']);
      await S.fade(0, 700);
      await S.narr('你睁开眼睛。电视还在沙沙作响。\n房间和刚才一模一样。……应该是一模一样。');
      f.counted = true; ritGoal(S); cp(S, 'stab');
      return;
    }
    if (f.phase === 'seek') {
      if (f.ss === 'find' || f.ss === 'stand') return S.narr(f.mouth ? '屏幕停在一个蓝色的、没有信号的频道上。\n反光里，你看见自己鼓着腮帮子，脸白得像纸。' : '屏幕停在一个蓝色的、没有信号的频道上。\n反光里，你的嘴角还挂着盐水。……它看得见你。');
      return S.narr('频道一直在跳。新闻、购物节目、雪花、一部你没见过的黑白老电影……\n遥控器好好地放在暖桌上。');
    }
    await S.narr('电视黑着。屏幕上映出房间的轮廓，和你。\n只有你。');
  }

  /* ---------------- 浴缸 ---------------- */
  async function tubUse(S) {
    const f = S.f, tub = S.ent('tub');
    if (f.phase === 'prep') {
      if (f.tubFull) return S.narr('水已经放满了。水面上浮着一根你的头发。');
      S.sfx('water'); tub.full = true; f.tubFull = true;
      await S.narr('你拧开水龙头。热水器「轰」地点着了火。\n水哗哗地往浴缸里灌，蒸汽爬上了镜子。');
      S.after(9000, async S => {
        if (S.f.phase !== 'prep' || S.map === 'bath') return;
        S.sfx('drip'); await S.wait(400);
        await S.think('（……浴室那边，「滴答」一声。\n水龙头，明明拧紧了。）');
      });
      return prepGoal(S);
    }
    if (f.phase === 'ritual') {
      if (!f.said) return S.narr('水已经放好了。……还要先对它说那句话。');
      if (!f.inTub) {
        S.take('kuma'); S.sfx('splash'); S.show('dollB'); S.ent('dollB').s.tc = TC[f.thread || 'red']; f.inTub = true;
        await S.narr('你把它放进水里。\n米吸了水，它慢慢地沉下去，只剩一只缠着线的耳朵露在外面。');
        await S.think('（……好了。去关灯。）');
        return ritGoal(S);
      }
      if (!f.counted) return S.narr('它脸朝下浮在水里，一动不动。\n先去把灯关掉，打开电视。');
      if (!f.stabbed) return stab(S);
      return S.narr('别回头看。快去躲起来。');
    }
    if (f.phase === 'seek') {
      if (!f.tubSeen) {
        f.tubSeen = true; f.ss = 'trail'; S.sfx('drip');
        await S.narr('浴缸里的水黑沉沉的，只有一圈细细的波纹，还在慢慢地散开。\n……布偶不见了。' + (f.ver === 'cut' ? '剪刀也不见了。' : '刀也不见了。'));
        await S.narr('浴缸边沿上，有一个小小的、湿漉漉的手印。');
        for (let i = 0; i < 6; i++) S.show('pd' + i);
        goal(S, '跟着地上的水迹走（往玄关那边）'); cp(S, 'seek');
        return;
      }
      return S.narr('浴缸里只剩下水。水面上浮着几粒米。');
    }
    await S.narr(f.phase === 'after' ? '你拔掉了浴缸的塞子。水打着旋儿流走了，发出很响的咕噜声。' : '浴缸。');
  }
  async function stab(S) {
    const f = S.f;
    await S.narr('浴室里一片漆黑。\n它脸朝下浮在水面上，线在水里散开，像细细的血丝。');
    const m = await S.ask('帖子8楼说，有的版本不是刺，是剪断红线。你要……', ['用菜刀刺它', '用剪刀剪断它身上的线']);
    if (m === 0 && !S.has('knife')) return S.narr('刀……刀呢？得拿着刀。');
    if (m === 1 && !S.has('scissors')) return S.narr('剪刀……剪刀呢？');
    const opts = f.dname === '浩' ? ['浩'] : [dn(S), '浩'];
    const r = await S.ask('你把它从水里捞出来。「找到你了，____。」', opts);
    await S.say('阿浩', `找到你了，${opts[r]}。`, { style: 'big' });
    if (opts[r] === '浩' && f.dname !== '浩') {
      S.amb('none'); await S.wait(900);
      S.sfx('splash');
      await S.narr('……说错了。\n手里的熊忽然变得很沉。浴缸里，有个小小的声音，跟着你说：');
      await S.say('？？？', '找到你了，浩。', { style: 'whisper' });
      await S.scare('face', { spr: '@kumaF' });
      return S.die('你说出口的，是你自己的名字。\n被「找到」的，是你。\n\n（规则第7步：找到的是它，说它的名字。）', '找到的是你');
    }
    if (f.dname === '浩') { S.sfx('heart'); await S.think('（……找到你了，浩。\n这句话说出口的时候，后颈一阵发凉。）'); }
    const dB = S.ent('dollB');
    if (m === 0) {
      S.sfx('cut'); S.shake(400, 2); dB.knife = true; S.take('knife'); f.ver = 'knife';
      await S.narr('你一刀扎了下去。\n刀尖进去的时候，里面的米粒「沙」地响了一声。');
    } else {
      S.sfx('cut'); S.shake(300, 1); dB.s.cut = true; S.take('scissors'); f.ver = 'cut';
      await S.narr('你把剪刀贴着它脖子上的死结——\n「咔嚓」。');
      await S.narr('线「啪」地断开了。\n像是有什么东西，松了一口气。');
    }
    for (let i = 0; i < 3; i++) {
      await S.say('阿浩', `下一个当鬼的是${dn(S)}。`, { style: 'big' });
      if (i === 1) { S.sfx('drip'); await S.wait(500); }
    }
    await S.narr(m === 0 ? '你把它连同那把刀，一起放回了水里。' : '你把它和那把剪刀，一起放回了水里。');
    f.stabbed = true; S.sfx('heart');
    await S.think('（现在轮到它来找我了。）');
    ritGoal(S);
  }

  /* ---------------- 壁橱 ---------------- */
  async function oshiireUse(S) {
    const f = S.f, o = S.ent('oshiire');
    if (f.phase === 'prep') {
      if (!f.gotKit) {
        o.open = true; S.sfx('open'); f.gotKit = true; S.give('sewkit');
        await S.narr('你拉开壁橱的纸门。上层塞着冬天的被子，下层是几个没拆的纸箱。\n纸箱上放着一个针线包——是妈妈塞进行李里的。');
        await S.note('mom');
        o.open = false; S.sfx('close');
        return prepGoal(S);
      }
      if (!f.saltPlaced) {
        if (!S.has('saltcup')) return S.narr('要躲的地方就定在这里。下层腾一腾，刚好够一个人蜷着。\n帖子说，盐水要提前放在躲藏的地方。（厨房的调料架上有盐。）');
        S.take('saltcup'); f.saltPlaced = true; S.sfx('open');
        await S.narr('你把那杯盐水和剩下的半瓶，小心地放进壁橱下层。\n被子里冒出一股樟脑丸的味道。');
        return prepGoal(S);
      }
      return S.narr('盐水在里面放着。纸门拉上了，留了一条缝。');
    }
    if (f.phase === 'ritual') {
      if (!f.stabbed) return S.narr('还没到躲的时候。');
      if (S.coop) S.toast('双人：躲进去之前，也可以交换操作');
      o.open = true; S.sfx('open');
      return S.go('oshiire', 4, 3, 0);
    }
    if (f.phase === 'seek') {
      if (!f.mouth) {
        S.sfx('water'); f.mouth = true;
        await S.narr('你一头扎进壁橱，拧开那半瓶盐水，猛灌了一口含在嘴里。\n……咸得想吐。');
        if (f.refill && !f.refilled) {
          f.refilled = true; S.give('saltcup', true); S.toast('获得：半瓶盐水');
          await S.narr('你把剩下的半瓶整个攥在手里。\n这一次，全浇上去。浇到它身体里的米都泡透为止。');
        }
        if (S.map === 'room') {
          S.stop('dollR'); S.sfx('whisper');
          if (f.ss === 'stand') {
            relocate(S); startDollChase(S, 1.2);
            await S.narr('身后的脚步声停住了。\n它在原地转了两圈，像是一下子找不到你了。');
            goal(S, '盯着它，走过去调查它（背对它，它就会动）');
          } else {
            S.hide('dollR');
            await S.narr('身后的脚步声停住了。\n它在原地转了两圈，像是一下子找不到你了。……然后，啪嗒啪嗒地跑开了。');
            if (!f.trailOn) startFind(S);
            goal(S, '找到它（跟着湿脚印和米粒）');
          }
        } else regoal(S);
        cp(S, f.ss === 'stand' ? 'stand' : 'seek');
        return;
      }
      return S.narr(f.refilled ? '壁橱里的盐水已经用光了。\n被子上压出一个人形的坑。' : '壁橱里还剩小半瓶盐水。\n被子上压出一个人形的坑。你不想再钻进去了。');
    }
    await S.narr('壁橱的纸门开着。被子上压出一个人形的坑。');
  }

  /* ---- 躲藏：按真实时间推进的事件 ---- */
  const HG = { 1: '别出声，等。（手机 3:04）', 2: '别出声，等。（手机 3:12）', 3: '一动也别动。（手机 3:14）', 4: '别出声，等。（手机 3:20）', 5: '手机震了——看看帖子（手机 3:56）', 6: '含着盐水出去，找到布偶' };
  function hideGoal(S) { goal(S, HG[S.f.hs] || '含一口盐水'); }
  function sched(S, fast) {
    const f = S.f, g = f.hs;
    const at = { 1: [15000, evA], 2: [f.wrongFirst ? 12000 : 20000, evB], 3: [10000, knockEvent], 4: [12000, evT5] }[g];
    if (at) S.after(fast || at[0], async S => { if (S.f.phase === 'hide' && S.f.hs === g) await at[1](S); });
  }
  async function cupUse(S) {
    const f = S.f;
    if (f.phase !== 'hide') return S.narr('盐水。');
    if (!f.mouth) {
      S.sfx('water'); f.mouth = true; f.hs = 1;
      await S.narr('你端起杯子，含了一大口。\n咸得发苦，舌头一下子就麻了。');
      await S.think('（含着。不能咽，不能吐，不能说话。）');
      await S.narr('你用被子罩住手机，敲了一行字发出去：\n「刺了。躲进壁橱了。」');
      hideGoal(S); cp(S, 'hide'); sched(S);
      return;
    }
    await S.narr('杯子里还剩大半杯。出去的时候要带上。');
  }
  const POSTS = ['t2', 't3', 't4', 't5'], NPOST = { 1: 1, 2: 2, 3: 3, 4: 3, 5: 4, 6: 4 };
  async function phoneUse(S) {
    const f = S.f;
    if (!f.mouth) return S.narr('先含一口盐水。帖子说，躲好之后第一件事就是这个。');
    const unread = POSTS.slice(0, NPOST[f.hs] || 0).filter(k => !f['rd_' + k]);
    if (!unread.length) {
      if (f.hs >= 6) return S.note('t5');
      return S.narr('没有新回复。\n屏幕的光太亮了。你赶紧用被子把它罩住。');
    }
    for (const k of unread) { f['rd_' + k] = true; await S.note(k); }
    if (unread.includes('t5') && f.hs === 5) await evD(S);
  }
  async function evA(S) {
    const f = S.f, c = S.ent('crack');
    S.sfx('tv'); c.col = 'rgba(255,205,130,.9)';
    await S.narr('门缝外，电视的沙沙声忽然断了。');
    await S.wait(300); S.sfx('laugh');
    await S.narr('……一阵罐头笑声。深夜综艺。\n然后是新闻播报员的声音，说到一半——又变回了雪花。又是笑声。');
    c.col = 'rgba(130,160,255,.9)';
    await S.think('（换台了。遥控器在暖桌上。我没有碰它。）');
    await S.narr('你用发抖的拇指打了一行字，发了出去。');
    f.hs = 2; buzz(S, '手机震了一下——有新回复'); hideGoal(S); sched(S);
  }
  async function evB(S) {
    const f = S.f, c = S.ent('crack');
    S.sfx('drip'); await S.wait(500); S.sfx('step'); await S.wait(450); S.sfx('step'); await S.wait(450); S.sfx('drip');
    await S.narr('啪嗒。啪嗒。\n有什么东西，从浴室的方向，慢慢地走过来。');
    await S.narr('很轻。很小。\n每一步之间，都有水滴在地板上的声音。');
    S.sfx('heart'); c.col = 'rgba(70,80,120,.9)'; c.s.leg = true; c.light = { r: .9, col: 'rgba(170,190,255,.06)' };
    await S.narr('门缝里的光，被什么东西挡住了。\n两条短短的、小小的影子。');
    await S.think('（别动。……一下也别动。）');
    f.hs = 3; buzz(S); hideGoal(S); sched(S);
  }
  async function knockEvent(S) {
    const f = S.f, c = S.ent('crack');
    if (f.knocked) return;
    cp(S, 'hide');
    c.s.leg = true; c.col = 'rgba(70,80,120,.9)';
    S.sfx('knock'); await S.wait(300); S.sfx('knock');
    await S.narr('叩、叩。\n就在你脸前面。纸门被轻轻敲了两下。');
    if (f.selfName) {
      await S.say('门外', ['浩。', '……浩，找到你了。'], { style: 'whisper' });
      await S.narr('那是你自己的声音。');
      await S.think('（不对。我在这里。我在壁橱里。\n……那门外的，是谁？）');
      S.sfx('open'); await S.wait(400);
      await S.narr('纸门被拉开了。\n门外蹲着一个人。穿着你的运动服，鼓着腮帮子，脸白得像纸。');
      await S.scare('face', { face: 'hiro2', dur: 1.1 });
      return S.end({ id: 'twohiro', bad: true, title: '两个浩', text: '帖子写得清清楚楚：不能用自己的名字。\n\n它有了你的指甲，又有了你的名字。\n那它为什么不能是你？\n\n第二天，有人看见阿浩照常去考了期中考试。\n他一句话也没说。腮帮子一直鼓着。\n\n（重来时，会回到给布偶起名的那一刻。）' });
    }
    await S.say('门外', dn(S) === '美纪' ? ['浩……是我呀。', '你为什么……给它起我的名字？'] : ['浩……是我。美纪。', '开开门嘛。外面好冷。'], { style: 'whisper' });
    S.sfx('heart'); await S.narr('你听见自己的心跳。咚、咚、咚……');
    if (S.coop) await S.wait(2500);
    const { v: r, agree } = await S.vote('门外的声音在等你回答。你要……', ['（咬紧牙关，一声不出）', '「……美纪？」（盐水会流出来）', '（把纸门推开一条缝）']);
    if (!agree) await S.narr('你们一个想开口，一个想忍住。\n……最后动起来的，是握着手机的那只手。');
    if (r === 1) {
      f.mouth = false; S.sfx('water');
      await S.narr('你一张嘴，盐水就顺着下巴流了下去。');
      S.amb('none'); await S.wait(600);
      await S.say('门外', '……找到了。', { style: 'whisper' });
      await S.scare('face', { spr: '@kumaF' });
      return S.die('纸门被拉开了一条缝。\n一只湿漉漉的、小小的、塞满了米的手，伸了进来。\n\n（42楼说过：躲着的时候出声，就等于告诉它你在哪。）', '它找到你了');
    }
    if (r === 2) {
      S.sfx('sting');
      await S.narr('你用指尖把纸门推开了一点点——');
      S.fx('flash'); c.s.leg = false;
      await S.narr('门外什么都没有。电视停在雪花上。\n……地板上，从浴室一直到壁橱门前，是一串小小的、湿漉漉的印子。');
      await S.think('（它刚才就站在这儿。就在我脸前面。）');
    } else {
      await S.narr('你把指甲掐进手心里。嘴里的盐水咸得发苦。');
      S.sfx('giggle'); c.s.leg = false;
      await S.narr('门外安静了很久。\n然后，有个很小的声音「嘻」地笑了一下，走远了。');
    }
    c.col = 'rgba(200,210,235,.85)'; c.light = { r: 1.8, col: 'rgba(170,190,255,.12)' };
    f.knocked = true; f.hs = 4; hideGoal(S); sched(S);
  }
  async function evT5(S) {
    S.f.hs = 5; S.sfx('tick');
    await S.narr('不知道过了多久。腿麻得已经没有感觉了。');
    buzz(S); hideGoal(S);
  }
  async function evD(S) {
    await S.narr('三点二十七分。\n那个时候你正缩在这里，咬着嘴唇，一动也不敢动。');
    await S.think('（我没发过这一条。）');
    await S.think('（もういいかい——「藏好了没有？」\n……那是当鬼的人才会问的话。）');
    S.sfx('tick');
    await S.narr('手机右上角的时间：3:56。\n快一个小时了。帖子说，一到两个小时之内，必须结束。');
    S.f.hs = 6; S.f.canExit = true; hideGoal(S);
  }
  async function crackUse(S) {
    const f = S.f;
    if (!f.mouth) return S.narr('门缝外面是电视的光。……先把盐水含上。');
    if (!f.canExit) {
      return S.narr(['门缝里只能看见电视的一角。雪花的光一闪一闪。', '门缝里只能看见电视的一角。雪花的光一闪一闪。', '电视在换台。一个台，又一个台。没有人拿遥控器。', '门缝被什么东西挡着。你不敢凑过去。', '房间里好像什么都没有。\n……也许它就在你看不见的地方。', '手机在震。……先看看帖子。'][Math.min(f.hs || 0, 5)]);
    }
    await S.narr('出去之前，你把帖子转载的「结束的方法」又看了一遍。');
    await S.note('rules2');
    const r = await S.ask('拉开纸门，出去吗？', ['出去', '再等等']); if (r) return;
    S.sfx('open'); S.give('saltcup', true); S.hide('cup');
    await S.narr('你一只手端起盐水杯，另一只手拉开了纸门。');
    f.phase = 'seek'; f.ss = 'bath'; S.ent('oshiire').open = true; S.wear('@me');
    S.ent('dollB').s.gone = true; S.plr(2.4);
    await S.go('room', 2, 2, 0);
    startTimer(S); goal(S, '去浴室看看布偶'); cp(S, 'seek');
  }

  /* ---------------- 找布偶 ---------------- */
  function fakeClock(S) { const left = Math.min(180, S.f.tLeft ?? 180), m = 238 + Math.round((180 - left) / 180 * 62); return Math.floor(m / 60) + ':' + String(m % 60).padStart(2, '0'); }
  function startTimer(S) {
    S.timer(Math.max(60, S.f.tLeft ?? 180), '两小时期限', async S => {
      if (S.f.won) return;
      S.stop('dollR'); S.sfx('tick');
      await S.narr('秒针走到了五点。\n帖子说的两个小时，到了。');
      return S.end({ id: 'timeup', bad: true, title: '两个小时到了', text: '一到两个小时之内，必须结束。\n\n你在漆黑的房间里一直找到天亮，也没有再找到那只熊。\n\n从那天起，每天凌晨三点，电视都会自己打开。\n有时候是雪花。有时候，是一个你没见过的、黑白的房间。' });
    });
  }
  /* 藏身处：0被子里 1衣柜抽屉 2暖桌下 3电脑桌下；TRAIL 从电视前 (3,3) 一路指过去 */
  const HIDE = ['床上的被子里', '衣柜的抽屉里', '暖桌底下', '电脑桌底下'];
  const TRAIL = [
    [[3, 3], [2, 3], [2, 4], [2, 5], [2, 6]],
    [[3, 3], [4, 3], [5, 3], [6, 4], [8, 4], [9, 5]],
    [[3, 3], [5, 3], [6, 4], [6, 5], [5, 6], [4, 5]],
    [[3, 3], [4, 3], [5, 2], [6, 2], [6, 3], [7, 3]]
  ];
  function startFind(S) {
    const f = S.f; f.spot = S.rand(4); f.trailOn = true;
    const T = TRAIL[f.spot];
    for (let i = 0; i < 6; i++) { if (T[i]) S.place('tr' + i, T[i][0], T[i][1]); else S.hide('tr' + i); }
  }
  const spotHere = (S, k) => S.f.ss === 'find' && S.f.trailOn;
  const WRONG = ['被子鼓起来一块。\n……你掀开——只是枕头。', '最下面的抽屉开着一条缝。你拉开——\n只有一团没配对的袜子。', '你掀开暖桌的被子往里看。\n黑乎乎的，一股煤油味。……没有。', '电脑桌底下，只有一团缠在一起的电线。\n和一粒米。'];
  const FOUND = ['被子鼓起来一小团。湿的，往外渗着水。\n你一把掀开——', '最下面的抽屉开着一条缝，一根线从缝里垂出来。\n你拉开——', '暖桌的被子底下，伸出来一只湿漉漉的、缠着线的小手。\n你掀开被子——', '电脑桌底下，有两颗小小的、反着蓝光的东西。\n你蹲下去——'];
  async function spotUse(S, k) {
    const f = S.f;
    if (!f.mouth) return S.narr('嘴里没有盐水。……先回壁橱！');
    if (k !== f.spot) {
      await S.narr(WRONG[k]);
      S.sfx('giggle'); await S.wait(300);
      return S.narr(['身后，有个很小的声音「嘻」地笑了一下。', '……嘻嘻。\n声音是从你背后传来的。还是从头顶？', '有米粒滚过榻榻米的声音。很远。又好像很近。'][S.rand(3)]);
    }
    await S.narr(FOUND[k]);
    S.sfx('sting');
    await S.scare('face', { spr: '@kumaF', dur: .8 });
    await S.narr('两颗塑料眼睛，正对着你。');
    const tv = S.ent('tv');
    tv.s.power = false; tv.s.off = true; S.sfx('tv'); S.dark(.99);
    for (let i = 0; i < 6; i++) S.hide('tr' + i);
    S.sfx('step'); await S.wait(220); S.sfx('step'); await S.wait(220); S.sfx('drip');
    await S.narr('电视「啪」地灭了。\n黑暗里，有什么东西从你脚边窜了出去。啪嗒、啪嗒、啪嗒——');
    f.ss = 'stand'; relocate(S);
    tv.s.power = true; tv.s.off = false; S.dark(.94); S.sfx('tv');
    await S.narr('电视又亮了。蓝色的，没有信号。\n它站在房间的另一头，面朝着你。');
    await S.think('（帖子里有人说过：它只在你不看它的时候动。\n……别移开视线。）');
    goal(S, '盯着它，走过去调查它（背对它，它就会动）');
    if (S.coop) S.toast('双人：另一位可以点屏幕，标出它的位置');
    cp(S, 'stand'); startDollChase(S);
  }
  const SPOTS = [[8, 7], [3, 7], [2, 3], [8, 3], [6, 7], [9, 4], [5, 3], [2, 7], [9, 7], [6, 3]];
  function relocate(S) {
    const p = S.pl, ds = ([x, y]) => Math.abs(x - p.x) + Math.abs(y - p.y);
    let c = SPOTS.filter(s => ds(s) >= 5 && ds(s) <= 7);
    if (!c.length) c = SPOTS.slice().sort((a, b) => Math.abs(ds(a) - 6) - Math.abs(ds(b) - 6)).slice(0, 2);
    const sp = c[S.rand(c.length)];
    S.stop('dollR'); S.place('dollR', sp[0], sp[1]); S.face('dollR', 'pl');
  }
  function startDollChase(S, delay) {
    const f = S.f;
    S.chase('dollR', { spd: (f.mouth ? 2.5 : 2.7) + (f.wrongFirst ? .3 : 0), catch: dollCatch, wait: delay || 0 });
    gigT = 1.2;
  }
  /* 「看着它」= 含着盐水、面朝它（前方 90° 左右）、距离 7 格以内 */
  function sees(S, d) {
    const p = S.pl, v = DIRS[p.dir], dx = (d.px - p.px) / 16, dy = (d.py - p.py) / 16;
    const fw = dx * v[0] + dy * v[1], lat = Math.abs(dx * v[1] - dy * v[0]);
    return S.f.mouth && fw > .3 && lat <= fw + .5 && Math.abs(dx) + Math.abs(dy) <= 7;
  }
  async function dollCatch(S) {
    S.stop('dollR'); S.clearTimer(); S.sfx('giggle');
    await S.scare('face', { spr: '@kumaF', dur: 1.1 });
    return S.end({ id: 'caught', bad: true, title: '下一个当鬼的是你', text: '一只塞满了米的小手，碰到了你的脚踝。\n\n你听见自己的声音，在很近很近的地方说：\n「找到你了，浩。」\n\n那个帖子停在了第50楼。\n很久以后，有人在下面回了一句：「1さん？」' + (S.f.mouth ? '\n\n（它只在你不看它的时候动。）' : '\n\n（嘴里没有盐水的时候，它看得见你。）') });
  }
  /* 进房间（找布偶阶段） */
  async function roomSeek(S) {
    const f = S.f, d = S.ent('dollR'), tv = S.ent('tv');
    tv.s.power = true; tv.s.off = false;
    if (!f.mouth) {
      S.place('dollR', 7, 3, 0);
      if (S.once('dollSeenDry')) {
        S.focus(7, 3); S.sfx('sting');
        await S.narr('黑暗里，有个小小的东西坐在电脑桌前。\n它转过了头。');
        S.focus(null);
        await S.think('（嘴里没有盐水了。它看得见我——快回壁橱！）');
      } else S.sfx('giggle');
      goal(S, '嘴里没有盐水了——回壁橱重新含一口！');
      return startDollChase(S, 2.2);
    }
    if (f.ss === 'find' && !f.trailOn) {
      tv.s.power = 'static'; S.amb('tv');
      S.place('dollR', 3, 3, 3); S.focus(3, 3); S.sfx('sting');
      await S.narr(`电视停在了雪花上。\n雪花的光里，地板上坐着一个小小的背影。浑身缠着${TNAME[f.thread || 'red']}线。怀里，抱着那把${d.s.hold === 'scissors' ? '剪刀' : '刀'}。`);
      await S.think('（别出声。……别移开视线。）');
      S.sfx('tv'); tv.s.power = false; tv.s.off = true; S.dark(.99); await S.wait(700);
      S.hide('dollR'); startFind(S); S.sfx('giggle'); await S.wait(500);
      tv.s.power = true; tv.s.off = false; S.dark(.94); S.focus(null); S.amb('room');
      await S.narr('电视又亮了。蓝色的，没有信号。\n……它不见了。');
      await S.think('（地上，一串湿脚印，和几粒米。\n……它藏起来了。这一次，轮到我去找它。）');
      goal(S, '找到它（跟着湿脚印和米粒）'); cp(S, 'seek');
      return;
    }
    if (f.ss === 'stand') { relocate(S); S.sfx('giggle'); startDollChase(S, .6); }
  }
  async function momEvent(S) {
    const f = S.f;
    await S.wait(600); S.sfx('knock'); await S.wait(350); S.sfx('knock'); await S.wait(350); S.sfx('knock');
    S.focus(1, 2);
    await S.narr('咚、咚、咚。\n玄关的铁门，被人敲响了。');
    await S.say('门外', ['浩？是妈妈呀。', '你电话一直打不通，妈不放心，坐夜车来看看你。', '米吃完了没有？……开门呀，浩。'], { style: 'whisper' });
    S.focus(null);
    await S.think('（妈在秋田。……现在是凌晨四点。）');
    S.sfx('heart'); await S.narr('你听见自己的心跳。嘴里的盐水咸得发苦……');
    if (S.coop) await S.wait(2500);
    const { v: r, agree } = await S.vote('门外的人在等。你要……', ['（含住盐水，一动不动）', '「……妈？」（盐水会流出来）', '（去开门）']);
    if (!agree) await S.narr('你们一个想答应，一个想忍住。\n……身体先动了。');
    if (r === 2) {
      await S.narr('你的手摸到了门链。冰凉冰凉的。');
      S.sfx('open'); await S.wait(400);
      await S.narr('门外没有人。\n走廊的灯管一闪一闪。楼梯口有一串湿漉漉的小脚印——朝着你的方向。');
      await S.scare('face', { spr: '@kumaF' });
      return S.die('规矩说，游戏结束之前不能出门。\n你回过头的时候，那东西已经站在你身后了。', '你开了门');
    }
    f.momDone = true; f.ss = 'find';
    if (r === 1) {
      f.mouth = false; S.sfx('water');
      await S.narr('话一出口，盐水就顺着下巴流了下去。\n门外的声音停了。');
      await S.wait(600); S.sfx('giggle');
      await S.narr('……房间那边，有个很小的声音，笑了一下。');
      goal(S, '嘴里没有盐水了——回壁橱重新含一口！'); cp(S, 'seek');
      return;
    }
    await S.narr('你屏住呼吸。敲门声又响了两下，停了。\n门外的人好像贴在门上，贴了很久很久。然后，脚步声下楼去了。');
    await S.think('（……那不是妈。）');
    S.sfx('tv'); await S.wait(300); S.sfx('giggle');
    await S.narr('房间里，电视「啪」地换了一个台。\n然后，再也没有换过。');
    goal(S, '回房间。找到它'); cp(S, 'seek');
  }
  async function dollRUse(S) {
    const f = S.f, p = S.pl;
    if (f.won) return afterDoll(S);
    if (!f.mouth) return S.narr('嘴里没有盐水。现在碰它……不行。先回壁橱！');
    S.stop('dollR');
    const d = S.ent('dollR');
    if (Math.round(d.px / 16) === p.x && Math.round(d.py / 16) === p.y) {   // 和玩家叠在同一格：挪到玩家面前
      const tx = p.x + DIRS[p.dir][0], ty = p.y + DIRS[p.dir][1];
      if (passable(curMap(), tx, ty, d)) S.place('dollR', tx, ty);
    }
    S.face('dollR', 'pl');
    const hold = d.s.hold === 'scissors' ? '剪刀' : '刀', second = f.refilled;
    await S.narr(second ? '它又站在你脚边了。\n浑身湿透，米粒一粒一粒地往下掉。' : `它就站在你脚边，一动不动。\n背上的线松开了，米粒从缝里一粒一粒地漏出来。${hold}不是插在它身上——是被它抱在怀里。`);
    S.sfx('heart');
    const done = {};
    while (!done.say) {
      const r = await S.ask('它就在脚边。嘴里含着盐水，手里' + (second ? '攥着半瓶盐水——' : '端着杯子——'), [second ? '把整瓶盐水浇上去' : '把杯里的盐水泼上去', '把嘴里的盐水喷上去', '说「我赢了」']);
      if (r === 0) {
        if (done.cup) { await S.narr(second ? '瓶子已经空了。' : '杯子已经空了。'); continue; }
        done.cup = true; S.take('saltcup'); S.sfx('splash');
        await S.narr(second ? '你拧开瓶盖，把整瓶盐水从它头顶浇了下去。\n水顺着线缝渗进去，米粒「滋滋」地响。' : '你把整杯盐水泼了上去。\n它的身体「嗤」地一下，像是缩了缩。');
      } else if (r === 1) {
        if (done.mouth) { await S.narr('嘴里已经空了，只剩下咸味。'); continue; }
        done.mouth = true; f.mouth = false; S.sfx('water'); regoal(S);
        await S.narr('「噗——」\n你把含了' + (second ? '' : '快一个小时的') + '盐水，全喷在了它脸上。');
      } else {
        if (!done.mouth) { await S.think('（嘴里还含着盐水，说不出话。）'); continue; }
        if (!done.cup) { await S.think('（' + (second ? '瓶里' : '杯里') + '的盐水还没泼。……先把该做的做完。）'); continue; }
        done.say = true;
      }
    }
    const tv = S.ent('tv');
    await S.say('阿浩', '我赢了。', { style: 'big' });
    S.sfx('whisper'); await S.wait(500);
    await S.say('阿浩', '我赢了！', { style: 'big' });
    S.shake(500, 2); tv.s.power = 'static'; S.sfx('tv'); await S.wait(500);
    await S.say('阿浩', '我赢了！！', { style: 'big' });
    if (f.thread !== 'red' && !second) {
      /* 用了白线/黑线：没有「血管」，盐水只打湿了表面 */
      tv.s.power = true; S.sfx('giggle');
      await S.narr('……电视没有灭。');
      await S.narr(`它浑身湿透了。可是那身${TNAME[f.thread]}线，一点颜色也没有变。\n盐水只是顺着毛往下淌，一滴也没渗进去。`);
      await S.think('（帖子上写的是红线。……红线是血管。\n没有血管，盐水进不到它身体里。）');
      await S.narr('它慢慢地，抬起了头。');
      f.mouth = false; f.refill = true; S.take('saltcup');
      relocate(S); startDollChase(S, 2.5);
      goal(S, '回壁橱！再含一口盐水，把剩下的半瓶也带上'); cp(S, 'stand');
      return;
    }
    tv.s.power = false; tv.s.off = true; S.amb('room'); S.sfx('thud');
    await S.narr('电视「啪」地一声黑了。\n房间里只剩下冰箱的嗡嗡声，和你自己的喘气声。');
    d.s.fallen = true;
    await S.narr(`它歪倒在地板上，${hold}从怀里滑了出来。\n就是一只湿透了的、缝得乱七八糟的熊。`);
    f.won = true; f.phase = 'after'; S.clearTimer(); S.plr(null); S.dark(.86, 'room');
    goal(S, '把布偶擦干，然后烧掉'); S.cp('after');
  }
  async function afterDoll(S) {
    const f = S.f;
    if (!S.has('towel')) return S.narr('湿透了，米粒和水一起往外渗。\n得先把它擦干。走廊洗衣机旁边的洗衣篮里有浴巾。');
    f.dried = true; S.take('towel'); S.hide('dollR'); S.give('kuma');
    await S.narr('你用浴巾把它裹起来，一点一点地按干。\n把肚子里的米掏出来，倒进了垃圾袋。');
    await S.narr('它一下子轻得像什么都没有。');
    goal(S, '去阳台，把它烧掉');
  }
  async function getTowel(S) {
    if (S.f.phase === 'after' && !S.f.gotTowel) { S.f.gotTowel = true; S.give('towel'); return S.narr('你抽出一条还算干净的浴巾。'); }
    return null;
  }
  async function burn(S) {
    const f = S.f, can = S.ent('can');
    if (f.phase !== 'after') return S.narr('一个生锈的铁皮罐。\n房东说过，不许在阳台上烧东西。');
    if (!f.dried) return S.narr('先把它弄干。湿的烧不着。');
    if (!S.has('lighter')) return S.narr('打火机……烟灰缸旁边应该有一个。');
    S.take('kuma'); S.sfx('match'); can.lit = true; can.light = { r: 3.2, col: 'rgba(255,140,60,.28)', flick: true }; S.amb('fire');
    await S.narr('你把熊放进罐子里，点着了布标的一角。\n火苗舔上线头，一圈一圈地往上爬，像是把它重新缝了一遍。');
    await S.think('（……对不起啊。）');
    await S.narr('烧焦的米粒噼啪作响，冒出一股像烤年糕一样的、奇怪的香味。');
    await S.fade(1, 1200);
    await S.card('凌晨 4:58', '', '窗外还是黑的。只有对面便利店的招牌亮着。\n你蹲在阳台上，看着罐子里最后一点火光灭掉。\n' + (f.ver === 'cut' ? '剪断的线头在灰里蜷成一个一个小小的结。\n' : '那把菜刀，你决定天亮就扔掉。\n') + '然后拿出手机，发了最后一条。');
    can.lit = false; S.dark(.6); S.amb('wind');
    await S.fade(0, 1000);
    await S.narr('你回到被窝里，把手机攥在手心。\n眼皮重得抬不起来。睡着之前，你又刷新了一次。');
    const miki = f.dname === '美纪';
    await S.note(miki ? 'finM' : 'fin');
    S.sfx('tick');
    if (miki) {
      await S.think('（三点二十七分。\n……那个时候，我在壁橱里。手机一直攥在手里，一个字都没打。）');
      await S.narr('不知道过了多久，窗帘的缝里，透进来一点点灰白的光。');
      return S.end({ id: 'miki', title: '第四夜　完　·　另一通电话', text: '你给它起了她的名字。\n\n那天早上，美纪又打来一次。你没有接。\n铃声响了很久，停了。然后，壁橱里传来一声很轻的「嘻」。\n\n第二年春天，阿浩搬了家。退房那天，房东在壁橱下层的被子里，找到了几粒米。\n还有一根线。打着死结。\n\n（' + (f.ver === 'cut' ? '剪断红线' : '刀刺布偶') + '的版本 · 隐藏结局）' });
    }
    await S.think('（もういいかい——藏好了没有？\nまあだだよ——还没有呢。）');
    await S.think('（……回答的，是藏起来的那一个。）');
    await S.narr('不知道过了多久，窗帘的缝里，透进来一点点灰白的光。');
    await S.end({ id: 'win', title: '第四夜　完', text: '后来，阿浩再也没有关着灯睡过觉。\n\n第二年春天他搬了家。退房那天，房东在壁橱下层的被子里，找到了几粒米。\n\n还有一根线。打着死结。\n\n（' + (f.ver === 'cut' ? '这一次，你用的是「剪断红线」的版本。' : '这一次，你用的是「拿刀刺」的版本。') + '）' });
  }

  defChapter({
    id: 'hitori', n: 4, title: '一个人的捉迷藏', sub: '凌晨三点，浴缸，一只塞满了米的布偶。这一次，当鬼的是它。', origin: '日本网络怪谈', color: '#2a3446',
    endings: { win: '第四夜　完', miki: '另一通电话（隐藏）', caught: '下一个当鬼的是你', timeup: '两个小时到了', twohiro: '两个浩' },
    icon: '@kuma', amb: 'room', floor: 'wood', wall: 'plain', dark: .4, plr: 3.2,
    people: {
      me: { skin: '#f0c8a0', hair: '#1e1a1a', hs: 'messy', top: '#5a5f6a', top2: '#3a3e48', bottom: '#2e3a52', shoes: '#d8d4c8' },
      kuma: { key: 'kuma-doll', child: true, skin: BEAR, hair: BEAR, hs: 'bald', top: BEAR, bottom: BEAR, shoes: '#7a5a38', eye: '#0a0a0a', mouth: '#c01818',
        extra(g, d, fr, G, R) {
          R(3, G.hT - 1, 3, 3, BEAR); R(10, G.hT - 1, 3, 3, BEAR); R(4, G.hT, 1, 1, '#5a3a24'); R(11, G.hT, 1, 1, '#5a3a24');
          if (d === 0) { R(6, G.hT + 5, 4, 2, '#c8a882'); R(7, G.hT + 5, 2, 1, '#2a1a14'); R(4, G.tT + 1, 8, 1, '#c01818'); R(4, G.tT + 4, 8, 1, '#c01818'); R(7, G.tT, 1, G.tB - G.tT, '#c01818'); R(3, G.hT + 7, 10, 1, '#c01818'); R(1, G.tT + 2, 1, 6, '#d8d8d8'); R(1, G.tT + 8, 1, 3, '#4a3020'); }
        } },
      kumaF: { key: 'kuma-face', skin: BEAR, hair: BEAR, hs: 'bald', top: BEAR, bottom: BEAR, shoes: '#7a5a38', eye: '#0a0a0a', mouth: '#c01818',
        extra(g, d, fr, G, R) {
          R(3, G.hT - 1, 3, 3, BEAR); R(10, G.hT - 1, 3, 3, BEAR); R(4, G.hT, 1, 1, '#5a3a24'); R(11, G.hT, 1, 1, '#5a3a24');
          if (d === 0) { R(6, G.hT + 5, 4, 2, '#c8a882'); R(7, G.hT + 5, 2, 1, '#2a1a14'); R(4, G.tT + 1, 8, 1, '#c01818'); R(4, G.tT + 4, 8, 1, '#c01818'); R(7, G.tT, 1, G.tB - G.tT, '#c01818'); R(3, G.hT + 7, 10, 1, '#c01818'); R(1, G.tT + 2, 1, 6, '#d8d8d8'); R(1, G.tT + 8, 1, 3, '#4a3020'); }
        } }
    },
    faces: {
      /* 湿透的布偶熊：一只纽扣眼吊在线上、缝死的嘴往外漏米 */
      kumaF(R, a, t) {
        const B = '#8a6440', B2 = '#6a4a2c', D = '#3a2414', L = '#c8a070', K = '#050303', RD = '#d01818', W = '#f0ead6';
        R(1, 1, 10, 10, B); R(21, 1, 10, 10, B); R(3, 3, 6, 6, D); R(23, 3, 6, 6, D);
        R(4, 6, 24, 23, B); R(2, 9, 28, 16, B); R(6, 4, 20, 3, B); R(7, 29, 18, 2, B2);
        R(2, 21, 28, 4, B2); R(4, 25, 24, 4, B2);
        for (let y = 5; y < 28; y += 3) R(15, y, 2, 1, RD);
        R(6, 10, 8, 8, K); R(7, 11, 2, 2, '#ffffff'); R(9, 15, 1, 1, '#3a3a3a'); R(11, 13, 1, 1, '#3a3a3a');
        const dr = Math.min(4, (a * 6) | 0);
        R(22, 9, 1, 3 + dr, RD); R(19, 12 + dr, 8, 8, K); R(20, 13 + dr, 2, 2, '#ffffff');
        R(10, 18, 12, 9, L); R(13, 18, 6, 3, K);
        const op = Math.min(3, (a * 5) | 0);
        R(11, 24, 10, 1 + op, '#1a0606'); for (let x = 11; x < 22; x += 2) R(x, 23, 1, 3 + op, RD);
        for (let i = 0; i < 7; i++) R(12 + i * 1.4, 25 + op + ((t * 24 + i * 5) % 7), 1, 1, W);
        for (let i = 0; i < 30; i++) R(1 + i, 7 + i * .42, 1, 1, RD);
        for (let i = 0; i < 24; i++) R(4 + i, 28 - i * .3, 1, 1, RD);
        for (let i = 0; i < 5; i++) R(5 + i * 5.5, 29 + ((t * 18 + i * 3) % 3), 1, 2, 'rgba(150,190,215,.9)');
      },
      /* 门外的「浩」：你自己的脸，鼓着腮帮子，没有眼白 */
      hiro2(R, a, t) {
        const H = '#120e0e', S = '#dcd8ce', S2 = '#b4b0a6', K = '#000', RD = '#c01818';
        R(5, 1, 22, 10, H); R(3, 5, 4, 13, H); R(25, 5, 4, 13, H); R(7, 0, 3, 2, H); R(15, 0, 4, 1, H); R(22, 0, 3, 2, H);
        R(7, 9, 18, 19, S); R(4, 14, 24, 10, S); R(4, 18, 3, 6, S2); R(25, 18, 3, 6, S2);
        R(7, 9, 18, 3, H); R(9, 12, 3, 2, H); R(18, 12, 4, 2, H); R(14, 12, 2, 1, H);
        const e = a > .5 ? 1 : 0;
        R(9, 14, 5, 5 + e, K); R(18, 14, 5, 5 + e, K);
        R(12, 24, 8, 1, '#5a4444');
        R(15, 25, 1, 2 + ((a * 6) | 0), 'rgba(170,200,225,.9)');
        R(8, 28, 16, 4, '#5a5f6a'); R(10, 27, 12, 1, RD); R(15, 28, 1, 3, RD);
      }
    },
    items: {
      keitai: { name: '手机', desc: '银色的翻盖手机。能上2ch的手机版，就是字小得要命。' },
      kuma: { name: '布偶熊', desc: '美纪送的生日礼物。灰棕色，有手有脚，左耳上缝着一个布标。' },
      scissors: { name: '剪刀', desc: '笔筒里的文具剪刀，刃口有点钝。' },
      rice: { name: '一袋米', desc: '妈妈从秋田寄来的新米，装在便利店的塑料袋里。' },
      nail: { name: '指甲', desc: '用纸巾包着的几片自己的指甲。' },
      sewkit: { name: '针线包', desc: '妈妈塞进行李的针线包。白线、黑线、红线都有。' },
      saltcup: { name: '盐水', desc: '浓浓的盐水，一杯，外加一个塑料瓶装的半瓶。要放在躲藏的地方；结束的时候要泼在它身上。' },
      knife: { name: '菜刀', desc: '搬家时妈妈硬塞给你的菜刀，一次都没用过。' },
      towel: { name: '浴巾', desc: '洗衣篮里还算干净的一条浴巾。' },
      lighter: { name: '打火机', desc: '红色的一次性打火机。说好要戒烟的。' }
    },
    notes: {
      rules: { title: '「一个人的捉迷藏」做法 ①准备与步骤', text: '（オカルト板转载。结束的方法在下一页）\n\n【准备】\n・有手有脚的布偶\n・米（能塞满布偶的量）\n・自己的指甲（一点就行）\n・红线和针（一定要红线）\n・刀，或者其他尖的东西\n・一杯盐水（提前放在躲藏的地方）\n\n【步骤】\n1. 掏出布偶的棉花，塞进米和自己的指甲，用红线缝好。剩下的线缠在布偶身上，打结。\n2. 给布偶起名字。※绝对不能用自己的名字。\n3. 浴缸放好水。\n4. 凌晨三点，对布偶说三遍「第一个当鬼的是（自己的名字）」。\n5. 把布偶放进浴缸。\n6. 关掉家里所有的灯，打开电视，闭上眼睛数到十。\n7. 拿着刀回浴室，说「找到你了，（布偶名）」，刺它。\n8. 说三遍「下一个当鬼的是（布偶名）」，放回水里，马上躲起来。\n9. 躲好之后，含一口盐水。' },
      rules2: { title: '「一个人的捉迷藏」做法 ②结束与禁忌', text: '【结束】\n含着盐水出去，找到布偶。\n泼上杯里的盐水，喷上嘴里的盐水（先后有不同说法），说三遍「我赢了」。\n之后把布偶弄干，烧掉。\n\n【禁忌】\n※一到两个小时以内必须结束。\n※游戏期间不能出门。\n※躲着的时候不能出声。有人叫你，也不要回答。\n※嘴里没有盐水的时候，它看得见你。\n※不要半途而废。\n\n（转载者补充：找它的时候，眼睛别离开它。\n听说它只在你不看它的时候动。）' },
      t1: { title: '【实况】现在开始玩一个人的捉迷藏【第一次】', text: '1 ：本当にあった怖い名無し：2006/11/21(火) 02:16:40 ID:hR0k4N2b\n睡不着，来玩一个人的捉迷藏。东京，一个人住，1K。\n布偶是前女友留下的熊。三点开始，用手机实况。\n\n\n（还没有人回。）' },
      t1b: { title: '【实况】一个人的捉迷藏【第一次】· 3～9', text: '3 ：本当にあった怖い名無し：2006/11/21(火) 02:31:55 ID:Zx0pPq3e\n又来了。上礼拜那个说要实况的，后来就没下文了（ ´・ω・`）\n\n4 ：本当にあった怖い名無し：2006/11/21(火) 02:32:31 ID:mN3dE9wT\n>>1 前女友的熊（笑）怨念也太重了吧　wktk\n\n5 ：本当にあった怖い名無し：2006/11/21(火) 02:33:12 ID:Rt6yU2iO\n顺便说一句：米是内脏，红线是血管，指甲是你自己。\n等于亲手给它做了个身体，再请外面的东西住进去。劝你别玩。\n\n7 ：本当にあった怖い名無し：2006/11/21(火) 02:34:58 ID:Ws4hJ7kL\n盐水一定要放在躲的地方。含在嘴里，它就找不到你。\n\n8 ：本当にあった怖い名無し：2006/11/21(火) 02:35:20 ID:Pp1aN5vC\n我看的版本是剪断红线，不是拿刀刺。到底哪个对\n\n9 ：本当にあった怖い名無し：2006/11/21(火) 02:36:03 ID:Rt6yU2iO\n>>8 哪个都行。要紧的是你亲口说了「下一个当鬼的是它」。\n说出口的话，是收不回来的。' },
      t2: { title: '实况帖（手机）· 31～34', text: '（手机屏幕的光太亮了。你用被子把它罩住，往下翻。）\n\n31 ：本当にあった怖い名無し：2006/11/21(火) 03:04:12 ID:hR0k4N2b\n刺了。躲进壁橱了。含着盐水，打字好难\n\n32 ：本当にあった怖い名無し：2006/11/21(火) 03:04:40 ID:Zx0pPq3e\n来了来了 wktk\n\n33 ：本当にあった怖い名無し：2006/11/21(火) 03:05:02 ID:Gh2kD8sY\n支援\n\n34 ：本当にあった怖い名無し：2006/11/21(火) 03:06:19 ID:Ws4hJ7kL\n千万别出声。手机调静音了吧？' },
      t3: { title: '实况帖（手机）· 35～39', text: '35 ：本当にあった怖い名無し：2006/11/21(火) 03:07:51 ID:Gh2kD8sY\n你身后的电视怎么换台了\n\n36 ：本当にあった怖い名無し：2006/11/21(火) 03:08:10 ID:mN3dE9wT\n>>35 别吓人啊，又没开摄像头\n\n37 ：本当にあった怖い名無し：2006/11/21(火) 03:08:44 ID:kQ8sLm1A\n>>35 （ ´・ω・`）？？？\n\n38 ：本当にあった怖い名無し：2006/11/21(火) 03:11:30 ID:hR0k4N2b\n电视真的在换台。我没碰遥控器\n\n39 ：本当にあった怖い名無し：2006/11/21(火) 03:11:58 ID:Pp1aN5vC\n来了！！！！' },
      t4: { title: '实况帖（手机）· 40～43', text: '40 ：本当にあった怖い名無し：2006/11/21(火) 03:12:40 ID:Rt6yU2iO\n>>38 别出来。也别回帖了，手机的光会从门缝漏出去。\n\n41 ：本当にあった怖い名無し：2006/11/21(火) 03:14:05 ID:Gh2kD8sY\n地板湿了吧\n\n42 ：本当にあった怖い名無し：2006/11/21(火) 03:15:22 ID:Ws4hJ7kL\n>>1 听好。接下来不管谁叫你，都不要回答，不要开门。\n它会用你认识的人的声音。\n躲着的时候出声，就等于告诉它你在哪。\n万一出来以后把盐水吐了，就赶紧回去再含一口。\n\n43 ：本当にあった怖い名無し：2006/11/21(火) 03:15:49 ID:mN3dE9wT\n>>41 你到底是谁' },
      t5: { title: '实况帖（手机）· 44～50', text: '44 ：本当にあった怖い名無し：2006/11/21(火) 03:19:33 ID:kQ8sLm1A\n1さん？\n\n45 ：本当にあった怖い名無し：2006/11/21(火) 03:22:10 ID:Zx0pPq3e\n没动静了。不会真出事了吧\n\n46 ：本当にあった怖い名無し：2006/11/21(火) 03:27:41 ID:hR0k4N2b\nもういいかい\n\n47 ：本当にあった怖い名無し：2006/11/21(火) 03:27:58 ID:mN3dE9wT\n>>46 ？？？\n\n48 ：本当にあった怖い名無し：2006/11/21(火) 03:28:30 ID:Rt6yU2iO\n>>46 「もういいかい」——捉迷藏里当鬼的人问「藏好了没有」。\n1さん，这是你发的？\n\n49 ：本当にあった怖い名無し：2006/11/21(火) 03:40:02 ID:Ws4hJ7kL\n快一个小时了。不管发生了什么，现在出来把它结束掉。\n记得嘴里含着盐水。\n\n50 ：本当にあった怖い名無し：2006/11/21(火) 03:51:16 ID:Pp1aN5vC\n>>1 回个话啊' },
      fin: { title: '实况帖（手机）· 51～55', text: '51 ：本当にあった怖い名無し：2006/11/21(火) 04:58:20 ID:hR0k4N2b\n结束了。泼了盐水，说了三遍我赢了，烧掉了。天还没亮。\n……46不是我发的。\n\n52 ：本当にあった怖い名無し：2006/11/21(火) 04:59:03 ID:Zx0pPq3e\n乙！！活着就好\n\n53 ：本当にあった怖い名無し：2006/11/21(火) 05:00:41 ID:mN3dE9wT\n>>51 乙。那46到底是谁\n\n54 ：本当にあった怖い名無し：2006/11/21(火) 05:02:17 ID:Rt6yU2iO\n>>51 辛苦了。等天亮了把窗帘拉开，让太阳照进来，好好睡一觉。\n\n55 ：本当にあった怖い名無し：2006/11/21(火) 05:12:09 ID:hR0k4N2b\nまあだだよ' },
      finM: { title: '实况帖 · 51～54，和一条短信', text: '51 ：本当にあった怖い名無し：2006/11/21(火) 04:58:20 ID:hR0k4N2b\n结束了。泼了盐水，说了三遍我赢了，烧掉了。天还没亮。\n……46不是我发的。\n\n52 ：本当にあった怖い名無し：2006/11/21(火) 04:59:03 ID:Zx0pPq3e\n乙！！活着就好\n\n54 ：本当にあった怖い名無し：2006/11/21(火) 05:02:17 ID:Rt6yU2iO\n>>51 辛苦了。好好睡一觉。\n\n――――――――――――\n（手机又震了一下。不是帖子，是一条短信。发件人：美纪）\n\n浩，你昨晚给我打电话了吗？\n三点二十七分。\n我接起来，那边一直是水声。\n还有一个小孩子的声音，在问「藏好了没有」。' },
      mom: { title: '妈妈的便条（夹在针线包里）', text: '浩：\n天冷了，被子要拿出去晒。\n一个人住，饭要按时吃，别老吃泡面。\n扣子掉了就自己缝，针线包给你放在壁橱里了，白线黑线红线都有。\n新米寄了十公斤，吃完了跟妈说。\n你爸嘴上不说，其实也惦记你。\n\n　　　　　　　　　　妈　十月' },
      tag: { title: '熊耳朵上的布标', text: '（布标背面，圆珠笔写的字已经有点洇开了）\n\n浩：\n生日快乐！它叫小熊。\n以后你不开心的时候就抱抱它，\n不许拿它出气哦！\n\n　　　　　美纪　2006.4.2' },
      miki: { title: '粉红包装纸里的便条', text: '（垃圾袋里那角粉红色的包装纸。里面裹着一个没拆的小盒子，和一张对折的便条。是你自己扔进去的。）\n\n浩：\n这是第二份礼物，本来想等你考完试再给你。\n\n你最近总是半夜不睡，看那些吓人的帖子。\n打电话不接，接了也不说话，就听着。\n我有点害怕。不是怕鬼，是怕你。\n\n我们先分开一阵子吧。\n熊你留着。不开心的时候，抱抱它。\n\n　　　　　美纪　十月' }
    },
    legend: '「一个人的捉迷藏」（ひとりかくれんぼ，Hitori Kakurenbo）是2000年代中期在日本网络上流传开的一种降灵游戏。据说它早先在关西、四国一带私下流传，与「狐狗狸さん」（こっくりさん，类似碟仙）并称；真正让它出名的是2ch（2ちゃんねる）的「オカルト超常現象板」——一般认为2006至2007年间有人贴出了详细做法，随后不断有人一边照做、一边用手机在帖子里「实况」，这种半直播的形式让它迅速扩散。也有一种说法认为，它是某个大学社团为研究都市传说如何传播而刻意放出来的。\n\n流传最广的做法是：给有手有脚的布偶取名（不能用自己的名字），掏出棉花，塞进米和自己的指甲，用红线缝好，余线缠在身上；凌晨三点对它说三遍「第一个当鬼的是（自己）」，放进浴缸；关掉所有的灯、打开电视、闭眼数到十；拿着利器回浴室说「找到你了」并刺它，再说三遍「下一个当鬼的是（布偶）」，然后含着盐水躲起来。结束时含着盐水出来找到布偶，泼上杯中的盐水、喷上口中的盐水，说三遍「我赢了」，最后把布偶弄干、烧掉。\n\n关于象征，常见的说法是米代表内脏、红线代表血管，指甲则代表「自己」——等于亲手给某种东西做了一具身体，所以也有人说这是一场「诅咒自己的游戏」。盐自古用来驱邪，据说含在口中能让「它」找不到你。各版本出入不少：有的刺布偶，有的剪断红线；盐水先泼还是先喷说法不一。流传最多的是告诫：一到两个小时内必须结束，中途不能出门，不能半途而废。\n\n2008年前后，日本的灵异节目和视频网站上的尝试视频让它更加出名；同年它以 One-Man Hide and Seek / Hide and Seek Alone 之名被英文博客译介到海外，之后还被改编成多部电影。\n\n（本章中的阿浩、美纪、帖子里的全部回复、凌晨3:27那条「もういいかい」，以及「它只在你不看它的时候动」「用错线盐水就渗不进去」等规则，均为游戏虚构。）',
    start: { map: 'room', x: 2, y: 3, dir: 3 },
    resume: {
      name: async S => { prepGoal(S); },
      ritual: async S => { },
      stab: async S => { },
      hide: async S => {
        const f = S.f;
        if (f.hs === 3 && !f.knocked) return sched(S, 1500);
        sched(S);
      },
      seek: async S => {
        startTimer(S);
        if (S.map === 'room' && S.f.ss === 'find' && !S.f.mouth) await roomSeek(S);
      },
      stand: async S => {
        startTimer(S);
        if (S.map !== 'room') return;
        if (!S.f.mouth) return roomSeek(S);
        relocate(S); startDollChase(S, 1);
      },
      after: async S => { }
    },
    async intro(S) {
      await S.card('第四夜　一个人的捉迷藏', '2006年11月21日　凌晨2:14　东京都杉并区　某单身公寓', '大学二年级的秋天。\n失眠，空荡荡的1K，\n和一只没人要的布偶熊。\n\n网上说，凌晨三点，\n可以和「它」玩一场捉迷藏。');
    },
    tick(S, dt) {
      const f = S.f;
      if (f.phase === 'prep' && f.readRules && !W.busy) {
        prepGoal(S);
        if (!f.t1buzz && prepDone(S) >= 5) {
          f.t1buzz = true;
          S.after(600, async S => { buzz(S, '手机震了一下'); await S.think('（帖子有人回了。……回电脑上看看。）'); });
        }
      }
      if (f.phase === 'seek' && W.timer) {
        f.tLeft = W.timer.left;
        const k = Math.floor((180 - f.tLeft) / 36);
        if (k > (f.clkK || 0) && k < 5) { f.clkK = k; S.toast('墙上的钟：' + fakeClock(S)); }
      }
      if (f.phase === 'seek' && !f.won && S.map === 'room') {
        if (f.ss === 'bath' || f.ss === 'trail') { tvT -= dt; if (tvT <= 0) { tvT = .4 + Math.random() * 1.4; const tv = S.ent('tv'); tv.s.power = Math.random() < .5 ? 'static' : true; tv.s.off = false; if (Math.random() < .3) S.sfx('tv'); } }
        const d = S.ent('dollR');
        if (d && !d.hidden && d.chase) {
          const p = S.pl, dist = Math.abs(d.px - p.px) / 16 + Math.abs(d.py - p.py) / 16;
          if (f.ss === 'stand' && !W.busy) {
            const look = sees(S, d);
            if (look && !S.isFrozen('dollR')) {
              if (d.mv) { S.stop('dollR'); startDollChase(S); }   // 走到一半被看住：退回当前格站定
              S.freeze('dollR', true);
              if (gazeT <= 0) { S.sfx('giggle'); gazeT = 3; }
            } else if (!look && S.isFrozen('dollR')) S.freeze('dollR', false);
          }
          gazeT -= dt;
          if (!S.isFrozen('dollR') && !W.busy) {
            gigT -= dt;
            if (gigT <= 0) { gigT = .6 + dist * .35; S.sfx(dist <= 2 ? 'heart' : 'step'); }
            const tk = Math.round(d.px / 16) + ',' + Math.round(d.py / 16);
            if (tk !== lastTile) { lastTile = tk; if (dist <= 3) S.sfx('drip'); }
          }
        }
      }
      if (f.phase === 'hide' && S.map === 'oshiire') {
        if (!W.busy) { ambT -= dt; if (ambT <= 0) { ambT = 5 + Math.random() * 5; S.sfx(['drip', 'step', 'tv', 'drip'][S.rand(4)]); } }
        if (f.hs === 3 && !f.knocked && !f._kn && S.moving) {
          f._kn = true; S.sfx('thud');
          S.after(0, async S => { if (S.f.hs === 3 && !S.f.knocked) { await S.narr('「咚。」\n你的膝盖撞到了纸箱。\n……门外的脚步声，停住了。'); await knockEvent(S); } });
        }
      }
    },
    sprites: {
      hanger(g, e, t, R) { R(1, -12, 14, 1, '#888'); R(1, -12, 1, 27, '#888'); R(14, -12, 1, 27, '#888'); R(0, 14, 16, 1, '#555'); R(3, -11, 5, 14, '#2a3a6a'); R(3, -11, 5, 2, '#d8d8d8'); R(9, -11, 4, 16, '#1a1a1e'); R(10, -10, 2, 6, '#e8e4dc'); R(10, -9, 1, 5, '#7a2a2a'); },
      heater(g, e, t, R) { box(R, 3, 2, 10, 13, '#c8c2b0'); R(4, 3, 8, 2, '#9a9484'); R(5, 6, 6, 6, '#2a2420'); for (let i = 0; i < 3; i++) R(5, 7 + i * 2, 6, 1, '#4a3a30'); R(11, 13, 2, 2, '#a83030'); },
      pcdesk(g, e, t, R) {
        box(R, 0, 1, 16, 13, '#5d4632'); R(1, 2, 14, 2, '#73583e');
        box(R, 2, -9, 12, 10, '#cfc9b8'); R(4, 1, 8, 1, '#a8a294');
        if (e.off) R(3, -8, 10, 7, '#0c0f14');
        else { R(3, -8, 10, 7, '#e4e9f0'); R(4, -7, 6, 1, '#6a7aa8'); R(4, -5, 8, 1, '#8a8a8a'); R(4, -3, 5, 1, '#8a8a8a'); R(4, -2, 7, 1, '#b05050'); }
        R(12, -6, 3, 3, '#f0e070');
        R(3, 4, 10, 2, '#d8d2c0'); R(4, 4, 8, 1, '#bdb6a2');
      },
      oshiire(g, e, t, R) {
        R(0, -2, 32, 16, '#4a3a28');
        if (e.open) { R(1, -1, 30, 14, '#0a0806'); R(1, 5, 30, 1, '#3a2a1a'); R(2, -1, 20, 5, '#5a5040'); R(3, 7, 10, 6, '#3a3430'); return; }
        R(1, -1, 15, 14, '#d9cfb4'); R(16, -1, 15, 14, '#d2c7aa');
        for (let i = 0; i < 4; i++) { R(3 + i * 3, 2 + (i % 2) * 5, 2, 1, '#c6bb9c'); R(19 + i * 3, 4 + (i % 2) * 4, 2, 1, '#bfb393'); }
        R(13, 5, 2, 3, '#3a2a1a'); R(17, 5, 2, 3, '#3a2a1a'); R(15, -1, 1, 14, '#6a5a40');
      },
      garasu(g, e, t, R) {
        R(0, -2, 32, 16, '#8a8e94');
        const gl = e.lit ? '#7a8aa8' : '#0e1726';
        R(1, -1, 14, 14, gl); R(17, -1, 14, 14, gl); R(16, -1, 1, 14, '#6a6e74');
        if (!e.lit) { R(4, 3, 1, 1, '#d9c27a'); R(9, 6, 1, 1, '#d9c27a'); R(21, 2, 1, 1, '#c8d0e0'); R(26, 8, 1, 1, '#d9c27a'); }
        else { R(1, 8, 30, 5, '#c8a0a0'); }
        R(2, 0, 1, 6, 'rgba(255,255,255,.25)'); R(18, 0, 1, 6, 'rgba(255,255,255,.2)');
        R(1, -1, 4, 14, '#3a4658'); R(27, -1, 4, 14, '#3a4658');
      },
      ricebin(g, e, t, R) { box(R, 2, 0, 12, 15, '#d8d4c8'); R(3, 1, 10, 2, '#bab5a6'); R(5, 6, 6, 3, '#a33'); R(6, 7, 4, 1, '#eee'); },
      washer(g, e, t, R) { box(R, 0, -4, 16, 19, '#e0ded6'); R(2, -3, 5, 2, '#9aa'); R(3, 2, 10, 10, '#9aa3a8'); R(4, 3, 8, 8, '#33424c'); R(5, 4, 2, 2, '#5a6c78'); },
      can(g, e, t, R) {
        box(R, 3, 3, 10, 12, '#9a9ca2'); R(4, 4, 8, 2, '#7a7c82'); R(5, 9, 6, 1, '#7a5a3a');
        if (e.lit) { const f = Math.sin(t * 14) > 0 ? 1 : 0; R(4, 0 + f, 8, 4, '#ff8a2a'); R(6, -3 + f, 4, 4, '#ffcf5a'); R(7, -5 + f, 2, 2, '#fff2b0'); }
      },
      pet(g, e, t, R) { R(6, 3, 4, 11, 'rgba(200,225,240,.85)'); R(7, 1, 2, 2, '#3a6aa8'); R(6, 8, 4, 6, '#8fb8cc'); R(6, 6, 4, 1, '#e0e0e0'); },
      ashtray(g, e, t, R) { R(3, 9, 9, 4, '#6a6a70'); R(4, 10, 7, 2, '#2a2a2a'); R(5, 9, 4, 1, '#eee'); R(8, 8, 3, 1, '#ddd'); if (!e.s.taken) { R(12, 7, 2, 6, '#c02828'); R(12, 7, 2, 1, '#aaa'); } },
      aircon(g, e, t, R) { box(R, 0, 1, 16, 14, '#c8c8c0'); R(2, 3, 9, 9, '#555'); R(3, 4, 7, 7, '#777'); R(6, 7, 1, 1, '#333'); for (let i = 0; i < 4; i++) R(12, 3 + i * 3, 3, 1, '#999'); },
      /* 壁橱门缝（在下方）：电视的光漏进来；leg = 门外两条小短腿的影子 */
      crack(g, e, t, R) {
        const c = e.col || 'rgba(200,210,235,.85)', f = Math.sin(t * 11) > .6 ? 1 : 0;
        R(4, 0, 8, 16, 'rgba(150,170,255,.07)'); R(7, 0, 2, 16, c); R(6, 1, 1, 14, 'rgba(255,255,255,.12)'); if (f && !e.leg) R(7, 4, 2, 6, 'rgba(255,255,255,.3)');
        if (e.leg) { const w = Math.sin(t * 2) > .9 ? 1 : 0; R(4 + w, 6, 3, 9, '#050408'); R(9 + w, 6, 3, 9, '#050408'); R(7, 6, 2, 9, 'rgba(10,10,20,.85)'); R(5 + w, 14, 1, 1, 'rgba(150,180,210,.8)'); }
      },
      keitai(g, e, t, R) { R(5, 3, 6, 11, '#b8bcc4'); R(6, 4, 4, 4, '#9fd0ff'); R(6, 4, 4, 1, '#d8ecff'); R(6, 10, 4, 3, '#7a7e86'); R(5, 8, 6, 1, '#888c94'); },
      grains(g, e, t, R) { for (let i = 0; i < 9; i++) R(((hash(i, e.px, 4) * 13) | 0) + 1, ((hash(i, e.py, 5) * 12) | 0) + 2, 1, 1, '#ece6d2'); R(3, 10, 6, 1, '#a01818'); R(9, 9, 1, 2, '#a01818'); R(5, 5, 4, 3, 'rgba(110,140,160,.35)'); },
      /* 湿漉漉的小熊脚印 */
      wetprint(g, e, t, R) { const c = 'rgba(120,160,185,.55)', h = hash(e.px, e.py, 9) < .5; R(h ? 3 : 8, 4, 3, 3, c); R(h ? 3 : 8, 3, 1, 1, c); R(h ? 5 : 10, 3, 1, 1, c); R(h ? 9 : 4, 10, 3, 3, c); R(h ? 9 : 4, 9, 1, 1, c); R(h ? 11 : 6, 9, 1, 1, c); R(7, 7, 1, 1, '#ece6d2'); },
      grainsK(g, e, t, R) { for (let i = 0; i < 7; i++) R(((hash(i, 3, 4) * 12) | 0) + 2, ((hash(i, 4, 4) * 5) | 0) + 9, 1, 1, '#ece6d2'); },
      kotatsu(g, e, t, R) {
        R(-1, 7, 34, 9, '#6a3438'); for (let i = 0; i < 8; i++) R(1 + i * 4, 9 + (i % 2) * 3, 2, 1, '#8a4a4a');
        box(R, 0, 2, 32, 8, '#8a6a48'); R(1, 3, 30, 1, '#a08060');
        R(22, 4, 3, 3, '#e8e2d6'); R(25, 5, 1, 1, '#e88a20'); R(4, 4, 2, 4, '#9aa0a8');
      },
      calendar(g, e, t, R) { R(4, 1, 8, 11, '#eeeae0'); R(4, 1, 8, 3, '#b83030'); for (let y = 6; y < 12; y += 2) R(5, y, 6, 1, '#bbb'); R(9, 8, 1, 1, '#b83030'); },
      /* 暖桌上的布偶（坐着）：tc = 线的颜色，op = 已剪开 */
      kdoll(g, e, t, R) {
        const c = BEAR, d2 = '#7a5a38';
        R(4, 1, 3, 3, c); R(10, 1, 3, 3, c); R(5, 2, 1, 1, d2); R(11, 2, 1, 1, d2);
        R(4, 3, 9, 7, c); R(6, 6, 1, 1, '#111'); R(10, 6, 1, 1, '#111'); R(7, 7, 3, 2, '#c8a882'); R(8, 7, 1, 1, '#2a1a14');
        R(4, 10, 9, e.op && !e.tc ? 4 : 5, c); R(2, 10, 2, 3, c); R(13, 10, 2, 3, c); R(4, 14, 3, 2, d2); R(10, 14, 3, 2, d2);
        if (e.op && !e.tc) { R(8, 10, 1, 4, '#3a2414'); R(7, 9, 1, 1, '#eee'); R(10, 12, 1, 1, '#eee'); }
        if (e.tc) { R(4, 10, 9, 1, e.tc); R(4, 12, 9, 1, e.tc); R(8, 10, 1, 5, e.tc); R(3, 11, 1, 1, e.tc); R(13, 11, 1, 1, e.tc); R(5, 4, 7, 1, e.tc); }
      },
      /* 浴缸里脸朝下漂着的布偶：只露出背和一只耳朵；knife = 斜插的刀柄，cut = 剪断的线头，gone = 只剩涟漪和米 */
      dollFloat(g, e, t, R) {
        const W = 'rgba(70,100,118,.55)';
        if (e.gone) {
          const r = 2 + ((t * 3) % 4);
          R(16 - r * 2, 7 - r / 2, r * 4, 1, 'rgba(200,220,235,.35)'); R(16 - r * 2, 9 + r / 2, r * 4, 1, 'rgba(200,220,235,.25)');
          for (let i = 0; i < 6; i++) R(((hash(i, 7, 2) * 22) | 0) + 5, ((hash(i, 8, 2) * 7) | 0) + 4, 1, 1, '#ece6d2');
          return;
        }
        const c = '#6a5038', tc = e.tc || '#c01818';
        R(8, 6, 13, 6, c); R(20, 5, 7, 8, c); R(6, 6, 3, 2, c); R(6, 10, 3, 2, c); R(17, 4, 2, 2, c); R(17, 12, 2, 2, c);
        R(8, 6, 19, 7, W);
        R(23, 3, 3, 3, '#7a5a3e'); R(24, 4, 1, 1, '#4a3020');
        R(9, 8, 11, 1, tc); R(13, 6, 1, 6, tc); R(20, 9, 6, 1, tc);
        if (e.cut) { R(3, 7, 4, 1, tc); R(2, 6, 1, 1, tc); R(24, 12, 1, 2, tc); R(26, 13, 2, 1, tc); R(12, 4, 1, 2, tc); }
        else { R(3, 8, 5, 1, tc); R(26, 4, 3, 1, tc); R(27, 11, 2, 1, tc); R(11, 12, 1, 2, tc); R(15, 3, 1, 2, tc); }
        if (e.knife) { R(14, 6, 2, 1, '#c8c8c8'); R(15, 5, 2, 1, '#4a3020'); R(16, 4, 2, 1, '#4a3020'); R(17, 3, 2, 1, '#4a3020'); R(18, 2, 2, 1, '#5a3a24'); R(19, 1, 1, 1, '#2a1a10'); }
        R(10, 6, 3, 1, 'rgba(200,220,235,.3)');
      },
      /* 找你的布偶（走路）：tc 线色，hold = knife/scissors，fallen = 倒在地上 */
      walker(g, e, t, R) {
        const c = WETB, c2 = '#5a4028', tc = e.tc || '#c01818', K = '#0a0a0a', mz = '#a8885e';
        if (e.fallen) {
          R(2, 9, 9, 5, c); R(10, 8, 5, 6, c); R(13, 7, 2, 2, c); R(4, 13, 3, 2, c2); R(1, 10, 2, 2, c2);
          R(11, 10, 1, 1, K); R(3, 11, 7, 1, tc); R(6, 9, 1, 5, tc);
          if (e.hold === 'scissors') { R(1, 15, 4, 1, '#c8c8c8'); R(0, 14, 2, 2, '#c03030'); } else { R(0, 15, 6, 1, '#d8d8d8'); R(6, 14, 3, 2, '#4a3020'); }
          R(9, 14, 1, 1, '#ece6d2'); R(12, 14, 1, 1, '#ece6d2'); return;
        }
        const d = e.dir, side = d === 1 || d === 2, X = (x, w) => d === 2 ? 16 - x - w : x, Rx = (x, y, w, h, col) => R(X(x, w), y, w, h, col);
        const l1 = e.fr === 1 ? 1 : 0, l2 = e.fr === 3 ? 1 : 0;
        Rx(4, 13 - l1, 3, 3, c2); Rx(9, 13 - l2, 3, 3, c2);
        Rx(4, 8, 8, 6, c);
        Rx(3, 1, 10, 8, c); Rx(2, 0, 3, 3, c); Rx(11, 0, 3, 3, c); Rx(3, 1, 1, 1, c2); Rx(12, 1, 1, 1, c2);
        if (d === 0) {
          R(5, 4, 2, 2, K); R(9, 4, 2, 2, K); R(5, 4, 1, 1, '#555'); R(6, 6, 4, 2, mz); R(7, 6, 2, 1, K);
          R(2, 9, 2, 4, c); R(12, 9, 2, 4, c);
          R(3, 8, 10, 1, tc); R(4, 10, 8, 1, tc); R(4, 12, 8, 1, tc); R(7, 8, 1, 6, tc);
          if (e.hold === 'scissors') { R(13, 4, 1, 6, '#c8c8c8'); R(14, 5, 1, 5, '#b0b0b0'); R(12, 10, 2, 2, '#c03030'); R(14, 10, 2, 2, '#c03030'); }
          else { R(13, 3, 1, 7, '#d8d8d8'); R(14, 4, 1, 5, '#b8b8b8'); R(13, 10, 2, 3, '#4a3020'); }
        } else if (d === 3) {
          R(2, 9, 2, 4, c); R(12, 9, 2, 4, c);
          R(3, 8, 10, 1, tc); for (let y = 9; y < 14; y += 2) { R(6, y, 1, 1, tc); R(9, y, 1, 1, tc); R(7, y + 1, 2, 1, tc); }
          R(7, 2, 2, 5, c2); R(8, 13, 1, 1, '#ece6d2');
        } else {
          Rx(3, 4, 2, 2, K); Rx(1, 6, 3, 2, mz); Rx(1, 6, 1, 1, K); Rx(6, 9, 3, 4, c);
          Rx(4, 8, 8, 1, tc); Rx(4, 11, 8, 1, tc);
          if (e.hold === 'scissors') { Rx(3, 7, 1, 6, '#c8c8c8'); Rx(4, 12, 2, 2, '#c03030'); } else { Rx(2, 6, 1, 7, '#d8d8d8'); Rx(2, 12, 2, 2, '#4a3020'); }
        }
        if (Math.sin(t * 3 + e.px * .1) > .6) R(side ? X(8, 1) : 6, 16, 1, 1, 'rgba(160,190,215,.85)');
        if (Math.sin(t * 2.3 + e.py * .1) > .8) R(10, 15, 1, 1, '#ece6d2');
      },
      /* 壁橱里蜷着的你：膝盖抱在胸前，头埋得很低 */
      crouch(g, e, t, R) {
        const H = '#1e1a1a', Sk = '#f0c8a0', T = '#5a5f6a', B = '#2e3a52', SH = '#d8d4c8', d = e.dir;
        R(3, 14, 4, 2, SH); R(9, 14, 4, 2, SH);
        R(3, 7, 10, 7, T); R(4, 9, 8, 5, B);
        if (d === 3) { R(3, 6, 10, 8, T); R(7, 7, 2, 6, '#4a4e58'); }
        R(4, 2, 8, 6, H); R(3, 4, 1, 3, H); R(12, 4, 1, 3, H);
        if (d === 0) { R(5, 5, 6, 3, Sk); R(4, 6, 1, 2, Sk); R(11, 6, 1, 2, Sk); R(5, 5, 6, 1, H); R(6, 6, 1, 1, '#111'); R(9, 6, 1, 1, '#111'); R(5, 10, 2, 2, Sk); R(9, 10, 2, 2, Sk); R(4, 9, 8, 1, T); }
        else if (d === 1) { R(3, 5, 4, 3, Sk); R(2, 6, 1, 2, Sk); R(4, 6, 1, 1, '#111'); R(3, 10, 2, 2, Sk); }
        else if (d === 2) { R(9, 5, 4, 3, Sk); R(13, 6, 1, 2, Sk); R(11, 6, 1, 1, '#111'); R(11, 10, 2, 2, Sk); }
        const b = Math.sin(t * 1.6) > .3 ? 0 : 1; R(4, 2 + b, 8, 1, H);
      },
      /* 压在头顶的被子（画在最上层，下沿垂到人物头上） */
      quilt(g, e, t, R) {
        const A = '#4e3e60', B = '#5e4e72', C = '#3a2c4a', P = '#7a6890';
        R(0, -8, 112, 24, A);
        for (let i = 0; i < 7; i++) { R(i * 16 + 2, -6, 12, 2, B); R(i * 16 + 6, 1, 2, 2, P); R(i * 16 + 12, 7, 2, 2, P); R(i * 16 + 1, 10, 14, 1, C); }
        R(0, -1, 112, 1, C); R(0, 13, 112, 3, B);
        for (let x = 0; x < 112; x += 4) { const h = 3 + ((x * 7) % 5); R(x, 16, 4, h, A); R(x, 15 + h, 4, 1, C); }
      }
    },
    tiles: {
      balrail: { solid: true, paint(R, X, Y) { R(0, 0, 16, 16, '#0b0d14'); R(0, 0, 16, 3, '#4a4c50'); R(0, 3, 16, 1, '#2a2c30'); for (let x = 1; x < 16; x += 4) R(x, 4, 1, 10, '#5a5d62'); R(0, 13, 16, 2, '#3a3c40'); } },
      city: { solid: true, paint(R, X, Y) { R(0, 0, 16, 16, '#080a12'); const h = hash(X, Y, 31); R(2, 4 + ((h * 6) | 0), 5, 12, '#11141e'); R(9, 2 + ((h * 4) | 0), 6, 14, '#0e111a'); if (h < .6) R(3, 7, 1, 1, '#d9c27a'); if (h > .4) R(11, 5 + ((h * 5) | 0), 1, 1, '#c8b070'); if (h > .8) R(12, 9, 1, 1, '#8ab'); } }
    },
    maps: {
      /* ---------------- 房间（六叠和室） ---------------- */
      room: {
        amb: 'room', dark: .4, wall: 'plain', floor: 'tatami', plr: 3.2,
        rows: [
          '############',
          '############',
          '#tttttttttt#',
          '#tttttttttt#',
          '#tttttttttt#',
          '#tttttttttt#',
          '#tttttttttt#',
          '#tttttttttt#',
          '#tttttttttt#',
          '##########w#'],
        ents: [
          { id: 'oshiire', x: 1, y: 1, w: 2, spr: 'oshiire', on: oshiireUse },
          { id: 'garasu', x: 4, y: 1, w: 2, spr: 'garasu', async on(S) {
            const f = S.f;
            if (f.phase === 'prep' || f.phase === 'after') { S.sfx('open'); return S.go('balcony', 4, 3, 3); }
            await S.narr('窗帘拉得严严实实。\n规矩说，结束之前不能出门。阳台……大概也算外面。');
          } },
          { x: 6, y: 1, spr: 'calendar', on: S => S.narr('十一月的日历。21号那格写着：「物理化学　期中」。\n……明天。不对，已经是今天了。') },
          { id: 'clock', x: 8, y: 1, spr: 'wallclock', on: clockUse },
          { id: 'swR', x: 10, y: 1, spr: 'switch', on: lightSwitch('R') },
          { id: 'tv', x: 3, y: 2, spr: 'tv', s: { power: false, off: true }, light: { r: 3.4, col: 'rgba(150,170,255,.16)' }, on: tvUse },
          { id: 'pc', x: 7, y: 2, spr: 'pcdesk', light: { r: 2, col: 'rgba(140,170,255,.12)', dy: 0 }, on: pcUse },
          { x: 7, y: 3, spr: 'cushion', col: '#3a4a6a', decal: true, solid: false },
          { id: 'shelf', x: 9, y: 2, spr: 'bookshelf', async on(S) {
            if (!S.f.gotScissors) { S.f.gotScissors = true; S.give('scissors'); await S.narr('书架上的笔筒里插着圆珠笔、荧光笔，和一把剪刀。\n你把剪刀拿了出来。'); return prepGoal(S); }
            await S.narr('《物理化学》、《ゴルゴ13》第87卷，还有一本没拆封的《英语单词 Target 1900》。\n最上层，放着一张被扣过去的大头贴。');
            if (S.f.phase !== 'prep' && S.once('purikura')) await S.narr('……大头贴被翻过来了。\n你记得你没碰过它。照片上，美纪旁边的那张脸，被指甲一下一下刮花了。');
          } },
          { id: 'bed', x: 1, y: 5, h: 2, spr: 'bed', col: '#5a6a7a', async on(S) {
            if (!S.f.gotBear) return getBear(S);
            if (S.f.phase === 'seek' && spotHere(S, 0)) return spotUse(S, 0);
            if (S.f.phase === 'seek') return S.narr('被子乱成一团。你不想掀开它。');
            await S.narr('没叠的被子。枕头上有一个睡不着的人压出来的坑。');
          } },
          { id: 'kumaBed', x: 1, y: 5, spr: 'doll', col: BEAR, oy: 1, z: 1 },
          { id: 'kotatsu', x: 3, y: 4, w: 2, spr: 'kotatsu', on: kotatsuUse },
          { id: 'dollK', x: 4, y: 4, spr: 'kdoll', oy: -5, hidden: true, z: 1 },
          { id: 'dresser', x: 10, y: 5, spr: 'dresser', col: '#6a5a48', on: S => (S.f.phase === 'seek' && spotHere(S, 1)) ? spotUse(S, 1) : S.narr(S.f.phase === 'seek' ? '最下面的抽屉开了一条缝。\n你记得你关上了。' : '衣柜抽屉。最上面一格塞满了没配对的袜子。') },
          { x: 5, y: 5, spr: 'cushion', col: '#4a5a7a', decal: true, solid: false },
          { x: 10, y: 7, spr: 'hanger', on: S => S.narr('挂衣架上挂着大学的运动服，和一件只穿过一次的西装。\n入学典礼那天，美纪帮你打的领带。') },
          { x: 7, y: 6, spr: 'heater', on: S => S.narr(S.f.phase === 'prep' ? '煤油暖炉。油箱见底了，你懒得下楼去买。\n难怪这么冷。' : '暖炉早就凉了。\n可房间里有一股煤油的味道，越来越浓。') },
          { x: 5, y: 7, spr: 'newspaper', on: S => S.narr('一本翻烂的《月刊ムー》，摊开在「全国心灵スポット特集」那一页。\n上个月买的。就是从那时候开始，你迷上了这些东西。') },
          { x: 1, y: 8, spr: 'sack', async on(S) {
            if (S.f.phase === 'hide' || S.f.phase === 'ritual' || S.f.phase === 'seek' || S.f.mikiRead) return S.narr('可燃垃圾。周四才能扔。\n袋子里露出一角粉红色的包装纸。');
            S.f.mikiRead = true; S.sfx('paper');
            await S.narr('可燃垃圾。周四才能扔。\n袋子里露出一角粉红色的包装纸。……你把它抽了出来。');
            await S.note('miki');
            await S.think('（……扔掉的时候，我连看都没看。）');
          } },
          { x: 2, y: 8, spr: 'box', on: S => S.narr('搬家用的纸箱，半年了还没拆完。\n上面用马克笔写着：「浩・冬衣」。是妈妈的字。') },
          { x: 8, y: 8, spr: 'deadplant', on: S => S.narr('美纪买的仙人掌。\n仙人掌都能养死，你也算是个人才。') },
          ...[0, 1, 2, 3, 4, 5].map(i => ({ id: 'tr' + i, x: 1, y: 2, spr: i % 2 ? 'grains' : 'wetprint', decal: true, hidden: true, solid: false })),
          { id: 'dollR', x: 8, y: 5, spr: 'walker', hidden: true, light: { r: 1, col: 'rgba(200,40,40,.10)' }, s: { hold: 'knife', tc: '#c01818' }, on: dollRUse },
          { x: 10, y: 9, spr: 'invisible', to: ['hall', 10, 2, 0] }
        ],
        async enter(S, first) {
          const f = S.f;
          if (f.phase === 'seek' && !f.won) {
            const d = S.ent('dollR'); d.s.tc = TC[f.thread || 'red']; d.s.hold = f.ver === 'cut' ? 'scissors' : 'knife';
            if (f.ss === 'find' || f.ss === 'stand') return roomSeek(S);
            if (f.ss === 'trail') { S.sfx('tv'); return S.think('（房间里只有电视在换台。……地上的水迹，不是往这边来的。是往玄关去的。）'); }
            if (S.once('seekRoom')) {
              S.ent('tv').s.power = true; S.ent('tv').s.off = false;
              await S.narr('纸门外，冷得像冰箱里。\n电视一直在换台——新闻、购物节目、雪花、新闻。每一下「啪」，房间的颜色就跟着变一次。');
              await S.narr('遥控器好好地放在暖桌上。');
              await S.think('（……布偶。先去浴室看看。）');
            }
            return;
          }
          if (!first) return;
          f.phase = 'prep';
          S.give('keitai', true);
          await S.narr('凌晨两点十四分。暖桌上的杯面早就凉透了。\n电脑屏幕上，开着一个帖子。');
          await S.think('（明天还有期中考试。……算了，反正也睡不着。）');
          goal(S, '在电脑上看看那个帖子');
        }
      },
      /* ---------------- 走廊兼厨房、玄关 ---------------- */
      hall: {
        amb: 'room', dark: .4, wall: 'plain', floor: 'linoleum', plr: 3,
        rows: [
          '#############',
          '#############',
          '#xxnnnnnnnnn#',
          '#xxnnnnnnnnn#',
          '#xxnnnnnnnnn#',
          '#############'],
        ents: [
          { id: 'front', x: 1, y: 1, spr: 'door', col: '#5a5e66', async on(S) {
            const f = S.f;
            if (f.phase === 'prep') return S.narr('铁门。门链挂着。\n猫眼外面，走廊的日光灯一闪一闪的。');
            if (f.phase === 'after') return S.narr('门链还挂着。\n你决定，等天完全亮了再开这扇门。');
            await S.narr('规矩：游戏结束之前，不能出门。\n……门把手冰凉冰凉的。');
          } },
          { id: 'swH', x: 3, y: 1, spr: 'switch', on: lightSwitch('H') },
          { id: 'swB', x: 5, y: 1, spr: 'switch', on: lightSwitch('B') },
          { x: 6, y: 1, spr: 'door', col: '#c8c4b8', to: ['bath', 3, 4, 3] },
          { x: 8, y: 1, spr: 'poster', col: '#8a9ab0', on: S => S.narr('垃圾分类表。房东用红笔写着：「不遵守的话请搬走」。') },
          { x: 10, y: 1, spr: 'door', col: '#8a7058', to: ['room', 10, 8, 3] },
          { x: 2, y: 2, spr: 'getabako', on: S => S.narr('鞋柜。上面放着备用钥匙，和一张没寄出去的明信片。') },
          { x: 1, y: 3, spr: 'shoes', col: '#2a2a32', decal: true, on: S => S.narr('你的运动鞋，鞋带没解就踩着后跟脱下来的。\n鞋尖朝里。') },
          { x: 7, y: 2, spr: 'washer', on: S => S.narr('洗衣机。里面还泡着前天的衣服。\n旁边是洗衣篮。') },
          { id: 'basket', x: 9, y: 2, spr: 'basket', async on(S) {
            if (await getTowel(S) !== null) return;
            await S.narr(S.f.gotTowel ? '洗衣篮。堆得冒尖了。' : '洗衣篮。堆得冒尖了。最上面有一条还算干净的浴巾。');
          } },
          { id: 'drawer', x: 5, y: 4, spr: 'counter', async on(S) {
            if (!S.has('knife') && !S.f.gotKnife) { S.f.gotKnife = true; S.give('knife'); await S.narr('抽屉里躺着一把菜刀。搬家时妈妈硬塞给你的，一次都没用过。\n……用它来刺一只熊，大概是它这辈子最大的用处了。'); return prepGoal(S); }
            await S.narr('抽屉里还有一把开瓶器，和一叠外卖菜单。');
          } },
          { x: 6, y: 4, spr: 'sink', on: S => S.narr(S.f.phase === 'seek' ? '水龙头在滴水。\n……你记得你拧紧了。' : '水槽里泡着两个碗，一双筷子。水龙头滴答、滴答。') },
          { x: 7, y: 4, spr: 'stove', on: S => S.narr('单口的煤气灶。上面那口锅，上一次用是什么时候来着。') },
          { id: 'saltC', x: 8, y: 4, spr: 'counter', col: '#9a8a72', async on(S) {
            if (!S.f.gotSalt && !S.f.saltPlaced) {
              S.f.gotSalt = true; S.give('saltcup'); S.sfx('water');
              await S.narr('调料架上有一罐食盐。\n你往杯子里倒了满满三勺，在水槽接上自来水，用筷子搅了搅。');
              await S.narr('剩下的灌进一个空塑料瓶里——万一不够呢。');
              await S.think('（浓得发苦。……含在嘴里，它就找不到你。）');
              return prepGoal(S);
            }
            await S.narr('调料架。酱油、味醂、一瓶没开过的七味粉。');
          } },
          { id: 'ricebin', x: 9, y: 4, spr: 'ricebin', async on(S) {
            if (!S.f.gotRice) { S.f.gotRice = true; S.give('rice'); await S.narr('米桶里是妈妈从秋田寄来的新米。\n你用便利店的塑料袋装了一大捧。米粒凉凉的，从指缝里往下漏。'); return prepGoal(S); }
            await S.narr('米桶。还剩大半桶。\n妈妈说，吃完了就说一声。');
          } },
          { x: 11, y: 4, spr: 'fridge', light: { r: 1.2, col: 'rgba(120,255,160,.07)' }, on: S => S.narr('冰箱里：两罐啤酒，一盒过期的纳豆，妈妈寄来的腌萝卜。\n上面的微波炉亮着绿色的「' + (S.f.phase === 'prep' ? prepClock(S) : S.f.phase === 'ritual' ? '3:05' : S.f.phase === 'seek' ? fakeClock(S) : '-:--') + '」。') },
          ...[[6, 3], [5, 3], [4, 2], [3, 3], [2, 3], [1, 2]].map(([x, y], i) => ({ id: 'pd' + i, x, y, spr: i % 2 ? 'wetprint' : 'puddle', decal: true, hidden: true, solid: false }))
        ],
        step(S, x, y) {
          const f = S.f;
          if (f.phase === 'seek' && f.tubSeen && !f.momDone && x <= 3) return momEvent(S);
        },
        async enter(S, first) {
          if (first) await S.narr('走廊兼厨房。冰箱嗡嗡地响。\n从玄关到房间，一共七步。');
        }
      },
      /* ---------------- 浴室（整体浴室） ---------------- */
      bath: {
        amb: 'room', dark: .3, wall: 'tile', floor: 'tile', plr: 3,
        tileOpts: { tileC: '#c8ccc6' },
        rows: [
          '#######',
          '#######',
          '#+++++#',
          '#+++++#',
          '#+++++#',
          '###+###'],
        ents: [
          { x: 1, y: 2, spr: 'toilet', on: S => S.narr('马桶的水箱发出细细的嘶嘶声。') },
          { id: 'bmirror', x: 2, y: 1, h: 2, spr: 'mirror', frame: '#a8a8a0', async on(S) {
            const f = S.f;
            if (f.phase === 'prep' && !f.gotNail) {
              f.gotNail = true; S.give('nail'); S.sfx('cut');
              await S.narr('你打开镜柜，拿出指甲刀。\n咔嚓。咔嚓。在这么小的浴室里，剪指甲的声音大得吓人。');
              await S.narr('你把剪下来的指甲拢在一张纸巾里，包好。');
              return prepGoal(S);
            }
            if (f.phase === 'seek') return S.narr(f.mouth ? '镜子里，你鼓着腮帮子，脸色白得像纸。\n你身后的浴帘，动了一下。' : '镜子里，你的下巴上还挂着盐水。\n嘴里空了。……你身后的浴帘，动了一下。');
            if (f.phase === 'ritual' || f.phase === 'hide') return S.narr('太黑了，镜子里什么也看不见。\n……看不见最好。');
            await S.narr(S.f.phase === 'after' ? '镜子里是一个熬了一整夜的人。眼睛底下两团青黑。' : '镜柜。洗脸台上：牙刷一支，杯子一个。\n本来是两支的。');
          } },
          { x: 2, y: 2, spr: 'sink' },
          { x: 3, y: 1, spr: 'curtain', on: S => S.narr('浴帘。上面印着褪色的小鸭子。') },
          { id: 'tub', x: 4, y: 2, w: 2, spr: 'bathtub', on: tubUse },
          { id: 'dollB', x: 4, y: 2, spr: 'dollFloat', hidden: true },
          { x: 3, y: 4, spr: 'towel', col: '#7a9aa8', decal: true, solid: false, async on(S) {
            if (await getTowel(S) !== null) return;
            await S.narr(S.f.phase === 'prep' ? '地垫边上搭着一条毛巾。有点潮。' : '地上那条毛巾湿透了，冰凉冰凉的。');
          } },
          { x: 3, y: 5, spr: 'invisible', to: ['hall', 6, 2, 0] }
        ],
        async enter(S, first) {
          if (first) await S.narr('一体成型的小浴室。马桶、洗脸台、浴缸挤在一起。\n转个身都会撞到膝盖。');
          if (S.f.phase === 'ritual' && S.f.counted && !S.f.stabbed) { S.sfx('drip'); await S.narr('黑暗里，水滴的声音很响。'); }
        }
      },
      /* ---------------- 壁橱里（下层，门缝在脚前） ---------------- */
      oshiire: {
        amb: 'tv', dark: .93, wall: 'wood', floor: 'darkwood', plr: 1.5,
        rows: [
          '#########',
          '#########',
          '#WWWWWWW#',
          '#WWWWWWW#',
          '#########'],
        ents: [
          { id: 'quilt', x: 1, y: 2, w: 7, spr: 'quilt', z: 1, solid: true, on: S => S.narr('压在头顶的冬被。樟脑丸的味道呛得人想咳嗽。\n……不能咳。') },
          { x: 1, y: 3, spr: 'pet', solid: true, on: S => S.narr('剩下的半瓶盐水。\n万一……万一要用。') },
          { id: 'cup', x: 2, y: 3, spr: 'cup', full: true, solid: true, light: { r: .8, col: 'rgba(200,220,255,.12)' }, on: cupUse },
          { id: 'phone', x: 6, y: 3, spr: 'keitai', solid: true, light: { r: 1.3, col: 'rgba(150,200,255,.14)' }, on: phoneUse },
          { x: 7, y: 3, spr: 'box', on: S => S.narr('纸箱。里面是高中时候的相册。\n你不想在这种时候打开它。') },
          { id: 'crack', x: 4, y: 4, spr: 'crack', col: 'rgba(200,210,235,.85)', light: { r: 1.8, col: 'rgba(170,190,255,.12)' }, on: crackUse }
        ],
        async enter(S, first) {
          if (!first) return;
          S.f.phase = 'hide'; S.f.hs = 0; S.f.mouth = false; S.plr(1.5); S.wear('crouch');
          await S.narr('你钻进壁橱下层，反手拉上纸门，只留了一条缝。\n被子压在头顶上。黑暗里，只有门缝外电视的光一闪一闪。');
          await S.think('（盐水。先含一口盐水。）');
          goal(S, '含一口盐水（杯子在左手边）');
          cp(S, 'hide');
        }
      },
      /* ---------------- 阳台 ---------------- */
      balcony: {
        amb: 'wind', dark: .72, wall: 'concrete', floor: 'concrete', plr: 3,
        legend: { 'Q': 'city', 'V': 'balrail' },
        rows: [
          'QQQQQQQQ',
          'VVVVVVVV',
          '#xxxxxx#',
          '#xxxxxx#',
          '###xx###'],
        ents: [
          { id: 'garasuB', x: 3, y: 4, w: 2, spr: 'garasu', async on(S) { S.sfx('open'); await S.go('room', 4, 2, 0); } },
          { id: 'ash', x: 6, y: 2, spr: 'ashtray', async on(S) {
            if (!S.ent('ash').s.taken) { S.ent('ash').s.taken = true; S.give('lighter'); return S.narr('栏杆边的烟灰缸里塞满了烟头。旁边是一个红色的打火机。\n说好要戒的。你把打火机揣进了兜里。'); }
            await S.narr('烟灰缸。最上面那根烟头上，有一圈淡淡的口红印。\n……美纪最后一次来，就站在这里。');
          } },
          { id: 'can', x: 1, y: 2, spr: 'can', on: burn },
          { x: 6, y: 3, spr: 'aircon', on: S => S.narr('空调外机。这个月的电费单还没敢拆。') },
          { x: 5, y: 2, spr: 'pet', decal: true, solid: false },
          { x: 2, y: 1, spr: 'invisible', solid: true, on: S => S.narr(S.f.phase === 'after' ? '天还黑着。对面便利店的招牌亮了一整夜。\n送报纸的自行车「叮铃」一声，拐过了街角。' : '对面公寓楼只剩两三扇窗户还亮着。\n远处，中央线的末班车早就开走了。') }
        ],
        async enter(S, first) {
          if (first && S.f.phase === 'prep') await S.narr('十一月的风灌进领口。\n这栋楼的每一个阳台都黑着，只有你这里亮着一扇窗。');
        }
      }
    }
  });
})();
