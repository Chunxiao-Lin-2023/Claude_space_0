/* ================= 第三夜 · 猿梦 ================= */
(() => {
  /* ---------- 常量 ---------- */
  const ROWS = [4, 7, 10, 13, 16, 19, 22, 25];   // 小火车的座位列（每列上下两个座）
  const PS = [10, 2];                             // 你的座位：第三排，靠窗
  const AISLE = 3;
  const PAX = ['paxA', 'paxB', 'paxC', 'paxD', 'paxE', 'paxF', 'paxG'];
  const bx2 = (R, x, y, w, h, fill, edge) => { R(x, y, w, h, edge || shade(fill, -.45)); R(x + 1, y + 1, w - 2, h - 2, fill); };
  const KEYS = ['猿', '月', '終', '夢', '見', '点', '坂', '駅', '次'];
  const KALIAS = Object.fromEntries(KEYS.map((k, i) => [String(i + 1), k]));   // 键盘数字 1–9 对应九个字
  const TILE_GR = (R, X, Y) => { R(0, 0, 16, 16, '#2a2630'); for (let i = 0; i < 10; i++) R((hash(X, Y, i) * 15) | 0, (hash(Y, X, i + 9) * 15) | 0, 2, 1, i % 2 ? '#3a3540' : '#1e1a22'); };
  const T3 = 90;   // 第三夜：小人走到你面前的时间（秒）
  /* 第一夜的站台：看了站名牌/钟，或者随便看了三样东西，车就进站（不会因为没看「对」的东西而干等） */
  async function look(S) { if (S.f.n === 1 && !S.f.arrived && (S.f.lk = (S.f.lk || 0) + 1) >= 3) return trainArrive(S); }
  function sn(txt) { return async S => { await S.narr(txt); return look(S); }; }

  /* 每一夜的「行刑」顺序：广播报到谁，倒计时多少秒 */
  const STEPS = {
    1: [{ id: 'paxB', x: 7, y: 4, w: '挖眼', k: 'eye', sec: 45 }, { you: true, w: '绞肉', sec: 40 }],
    2: [{ id: 'paxC', x: 7, y: 2, w: '绞肉', k: 'mince', sec: 50, ann: ['上一次……有人逃掉了呢。', '逃掉的那一份，就请后面这位先生，先替一下吧。'] }, { you: true, sec: 40 }],
    3: [{ you: true, sec: T3 }]
  };
  const NEED = { 1: 2, 2: 3 };   // 醒来需要的「这是梦」证据数
  const cur = S => (STEPS[S.f.n] || [])[S.f.ei || 0];

  /* ---------- 声音：站内广播的「叮咚」四音（S.tone 合成，双方都听得到）、绞肉机的嗡鸣 ---------- */
  function chime(S, down) {   // 上行 = 广播开始；下行 = 广播结束。tone 自带 ±4% 的随机走音，听起来像一台老旧的喇叭
    const f = [659, 831, 988, 1319]; (down ? f.slice().reverse() : f).forEach((x, i) => S.tone('sine', x, x * .995, .6, .07, i * .17, 2600));
  }
  function grind(S, n = 4, vol = .1) {   // 绞肉机：低沉的锯齿波，一阵一阵
    for (let i = 0; i < n; i++) { S.tone('sawtooth', 52, 64, .42, vol, i * .5, 420); S.tone('square', 104, 92, .42, vol * .35, i * .5 + .05, 700); }
  }
  /* 关键抉择都用 S.vote：双人时两人各选一次（单人时等同 ask），意见不合时各处写了不同的分支 */

  /* ---------- 行刑场面：只有广播、声音、黑暗和剪影 ---------- */
  const SCENE = {
    ike: {
      pre: '两个小小的影子，从车尾那扇黑洞洞的门里钻了出来。\n它们一左一右，站到了最后一排那个男人的身边。手里握着什么东西，细细长长的，反着一点光。',
      async dark(S) { for (let i = 0; i < 6; i++) { S.sfx('cut'); await S.wait(240); } S.sfx('scream'); S.shake(500, 2); await S.wait(900); for (let i = 0; i < 4; i++) { S.sfx('cut'); await S.wait(200); } },
      mid: '（嚓。嚓。嚓。\n很有耐心，很有条理——就像厨房里有人在片一条还在扑腾的鱼。\n那个男人的惨叫，比刀声还要长。）',
      post: '灯又亮了。\n最后一排，空了。座位上干干净净，好像从来没有人坐过。\n前面的乘客还是直直地看着前方。没有一个人回头。'
    },
    eye: {
      pre: '小人们走到了倒数第二排。那个穿紫色毛衣的女人还是直直地看着前方，眼睛一眨不眨。\n其中一个小人踮起脚，举起了手——它手里是一把小小的、亮晶晶的勺子。',
      async dark(S) { S.sfx('scream'); S.shake(400, 1); await S.wait(1200); S.sfx('scream'); await S.wait(700); S.sfx('thud'); await S.wait(500); S.sfx('giggle'); },
      mid: '（女人的尖叫声，一声比一声高，一声比一声尖——\n你死死捂住耳朵。可那声音不是从耳朵进来的，是从你脑子里面响起来的。\n然后，小人们咯咯地笑了。）',
      post: '尖叫停了。\n灯亮的时候，倒数第二排的座位上，只剩一条叠得整整齐齐的紫色围巾。'
    },
    mince: {
      pre: '小人们又推来了那台铁做的机器。大漏斗，摇柄。\n它没有停在你面前——它停在了你身后，那个老人的座位旁边。\n老人还是直直地看着前方。他的嘴唇在动：「下一个，下一个……」',
      async dark(S) { S.ent('mincer').s.run = true; for (let i = 0; i < 4; i++) { grind(S, 1, .12); S.sfx('car'); S.shake(300, 1); await S.wait(520); } S.sfx('scream'); await S.wait(800); for (let i = 0; i < 5; i++) { grind(S, 1, .1); await S.wait(480); } S.sfx('thud'); S.ent('mincer').s.run = false; },
      mid: '（嗡——嗡——嗡——\n摇柄转起来了。一开始还有人在喊，后来，就只剩下机器的声音。\n它响了很久，很久，很久。）',
      post: '机器停了。你身后那一排，空了。\n空气里有一股生铁的味道。'
    }
  };

  async function execScene(S, st) {
    const D = SCENE[st.k];
    chime(S); await S.wait(700);
    if (st.ann) await S.say('车内广播', st.ann, { style: 'whisper' });
    await S.say('车内广播', [`下一个是——「${st.w}」。`, `${st.w}——${st.w}——`]);
    if (S.map !== 'train') {   // 你不在车厢里：只听得见
      S.sfx('scream'); S.shake(500, 2); await S.wait(600);
      await S.narr('车厢那边传来一声惨叫。\n然后是很长很长的安静。');
      S.hide(st.id); S.place('kobA', st.x, AISLE, st.y < AISLE ? 3 : 0); S.place('kobB', st.x - 1, AISLE, 2);
      return;
    }
    S.place('kobA', st.x, AISLE, st.y < AISLE ? 3 : 0); S.place('kobB', st.x - 1, AISLE, 2);
    if (st.k === 'mince') S.place('mincer', st.x + 1, AISLE);
    S.focus(st.x, 3);
    S.sfx('heart'); await S.narr(D.pre);
    S.place('xl', st.x, st.y); S.ent('xl').hidden = false;
    S.dark(.985); S.plr(.25); S.sfx('switch');
    await S.wait(600);
    await S.narr('车厢的灯一盏一盏地灭了。\n只剩一点暗红色的光，照出两个小小的、歪着脑袋的剪影。');
    await S.fade(1, 300);
    await D.dark(S);
    await S.narr(D.mid);
    S.hide(st.id);
    await S.wait(400);
    S.hide('xl'); S.dark(null); S.plr(null);
    await S.fade(0, 500);
    S.focus(null);
    await S.narr(D.post);
  }

  function startExec(S) {
    const st = cur(S); if (!st) return;
    S.f.ph = 'exec';
    S.timer(st.sec, st.you ? (S.f.n === 3 ? '它们来了' : st.w ? `${st.w}……是你` : '下一个……是你') : '下一个', execStep);
  }
  async function execStep(S) {
    const st = cur(S); if (!st) return;
    if (st.you) return yourTurn(S);
    await execScene(S, st);
    S.f.ei = (S.f.ei || 0) + 1; S.f.kx = st.x;
    if (cur(S) && cur(S).you && S.f.n === 1) {   // 原帖的顺序：活造り、挖眼，然后「绞肉」——轮到讲述者自己
      chime(S); await S.wait(700);
      await S.say('车内广播', ['下一个是——「绞肉」。', '绞肉——绞肉——']);
      S.f.kx = PS[0] - 1; resetKob(S); S.place('mincer', PS[0], AISLE); S.face('kobA', 'pl');
      S.sfx('heart'); grind(S, 2, .06);
      await S.narr('小人们推来了一台东西。铁做的，一个大漏斗，一根摇柄。\n你认得它。小时候，奶奶家的厨房里也有一台——过年包饺子的时候用。');
      await S.narr('机器停在了你的座位旁边。');
      await S.think('后面……已经没有人了。\n下一个，是我。');
    }
    if (cur(S) && cur(S).you && S.f.n === 2) {
      await S.say('车内广播', '下一个是——', { style: 'whisper' });
      S.f.kx = PS[0] - 1; resetKob(S); S.place('mincer', PS[0], AISLE); S.face('kobA', 'pl');
      await S.narr('广播停住了。像是故意的。\n两个小人把机器推到你的座位旁边，转过身来，看着你。');
    }
    startExec(S);
  }
  function resetKob(S) {
    const x = S.f.kx ?? 2;
    S.place('kobA', x, AISLE, 2); S.place('kobB', x - 1, AISLE, 2);
    S.ent('kobA').alpha = 1; S.ent('kobB').alpha = 1;
    S.hide('xl');
  }
  /* 把两个小人放到玩家身边（被「报到」的那一刻，它们一定就在你面前） */
  function kobsAtYou(S) {
    const m = curMap(), p = S.pl, a = S.ent('kobA');
    const c = [[p.x - 1, p.y], [p.x, p.y + 1], [p.x, p.y - 1], [p.x + 1, p.y], [p.x - 1, p.y + 1], [p.x - 1, p.y - 1], [p.x + 1, p.y + 1]].filter(([x, y]) => passable(m, x, y, a));
    const [x1, y1] = c[0] || [p.x, p.y], [x2, y2] = c[1] || c[0] || [p.x, p.y];
    S.place('kobA', x1, y1); S.place('kobB', x2, y2); S.face('kobA', 'pl'); S.face('kobB', 'pl'); S.face('pl', 'kobA');
  }

  async function yourTurn(S) {
    S.clearTimer(); S.f.ph = 'caught';
    const n = S.f.n;
    chime(S); await S.wait(600);
    if (S.map === 'train') kobsAtYou(S);
    else if (S.map === 'cab') { S.ent('cback').open = true; S.sfx('open'); }
    await S.say('车内广播', n === 1 ? '下一个是——「绞肉」。' : '下一个是——', { style: 'big' });
    S.dark(.99); S.plr(.3);
    await S.wait(700);
    await S.narr(S.map === 'cab' ? '驾驶室的门，自己开了。\n两个小人站在门口，歪着头，抬起脸看你。它们的脸……是猴子的脸。' : '两个小人站在你面前，歪着头，抬起脸看你。\n它们的脸……是猴子的脸。');
    await S.scare('face', { spr: '@kobA', dur: 1.1 });
    S.dark(null); S.plr(null);
    if (n === 3) return S.die('「说好了的，这是最后一次。」\n一只小小的、冰凉的手，搭上了你的膝盖。\n\n这一次，你连「这是梦」都没来得及想。', '轮到你了');
    await S.die(n === 1 ? '一个小人爬上了你的膝盖。机器的摇柄，「嘎吱」一声转了起来。\n你拼命想着「这是梦」——可是太晚了。\n\n你没能醒过来。' : '广播里那个尖细的声音，报出了一个你听不清的词。\n你拼命想着「这是梦」——可是太晚了。\n\n你没能醒过来。', '轮到你了');
  }

  /* ---------- 「这是梦」的证据 ---------- */
  function evGoal(S) {
    const n = S.f.n, c = S.f.evc || 0;
    if (n === 1) return `找出「这是梦」的证据（${c}/2）`;
    if (n === 2) return S.f.ph === 'station' ? (c >= 2 ? '上车（还差一个证据）' : `找出「这是梦」的证据（${c}/3）——就在站台上`) : '最后一个证据——《清醒梦入门》上的第四条（坐回自己的座位）';
    return '';
  }
  async function ev(S, key) {
    const n = S.f.n; if (!NEED[n] || !(S.f.ph === 'station' || S.f.ph === 'exec')) return;
    if (S.f.ph === 'station' && (S.f.evc || 0) >= 2) { await S.think('够了。我已经确信了——这是梦。\n上车吧。'); return; }
    const k = 'ev' + n + '_' + key; if (S.f[k]) return;
    S.f[k] = true; S.f.evc = (S.f.evc || 0) + 1;
    S.sfx('chime');
    S.toast(`「这是梦」的证据 ${Math.min(S.f.evc, NEED[n])}/${NEED[n]}`);
    if (S.f.ph === 'exec' && S.f.evc >= NEED[n]) return wakeChoice(S);
    S.goal(evGoal(S));
  }
  async function wakeChoice(S) {
    S.f.canWake = true;
    const seen = S.f.n === 1 ? [S.f.ev1_clock && '钟会乱走。', S.f.ev1_ad && '字会自己变。', S.f.ev1_win && '车窗里的我，没有脸。'].filter(Boolean).join('') + '……' : '';
    await S.think(S.f.n === 1 ? [seen, '这不是真的。这是梦。'] : ['这一次，我知道了。', '这是梦。']);
    const r = await S.vote('（这是梦。）', ['这是梦——醒过来！', '……再等等']);
    if (!r.agree) {   // 两个人里只要有一个喊「醒过来」，就醒
      await S.narr('你心里有两个声音。一个说「再等等，再看清楚一点」——\n另一个，喊得比它大声得多。');
      return wakeUp(S);
    }
    if (r.v) { S.goal('醒过来（调查自己的座位）'); return; }
    return wakeUp(S);
  }
  async function wakeUp(S) {
    const n = S.f.n;
    S.clearTimer(); S.f.ph = 'wake'; S.f.canWake = false; S.f.moving = false;
    if (n === 1) { S.ent('mincer').s.run = true; grind(S, 3, .1); }
    await S.say('', ['这是梦。', '这是梦。这是梦。这是梦——', '醒过来！！'], { style: 'big' });
    if (n === 1) await S.narr('机器的声音越来越近，越来越响。\n你感觉到脸上吹过一阵风——');
    S.sfx('heart'); S.shake(600, 2);
    if (n === 2) {
      S.dark(.99); S.plr(.3);
      await S.wait(600);
      chime(S, true); await S.wait(500);
      await S.say('车内广播', ['哎呀——', '又要逃走了吗？', '……下次再来的时候，就是最后一次了哦。'], { style: 'whisper' });
      S.sfx('giggle');
    }
    S.fx('flash');
    S.ent('mincer').s.run = false;
    S.hide('kobA'); S.hide('kobB'); S.hide('xl'); S.hide('mincer'); S.dark(null); S.plr(null);
    S.f.day = n + 1; S.f.ph = 'day';
    await S.go('room', 2, 3, 1, { ms: 800 });
  }

  /* ---------- 坏结局（只留给主动的选择；时间到了是死亡重来） ---------- */
  async function badEnd(S, kind) {
    S.clearTimer(); S.f.ph = 'bad';
    if (kind === 'eyes') {
      await S.narr('你闭上了眼睛。\n……只要不看，就不会发生。只要不看——');
      await S.fade(1, 900);
      chime(S); await S.wait(600);
      await S.say('车内广播', '下一个是——', { style: 'whisper' });
      await S.wait(900); S.sfx('cut'); await S.wait(260); S.sfx('cut'); await S.wait(600); S.sfx('giggle');
      await S.wait(900);
      chime(S, true);
      await S.say('车内广播', ['……终点站，到了。', '感谢您的乘坐。'], { style: 'whisper' });
      return S.end({ bad: true, id: 'eyes', title: '闭上眼睛', text: '第二天早上，美穗打了十一个电话，没有人接。\n\n那个帖子底下，后来多了一条回复，没有名字：\n「下一个是——」\n\n后面的字，再也没有人打完。' });
    }
    await S.fade(1, 1200);
    S.sfx('bell'); await S.wait(500); S.sfx('bell'); await S.wait(500); S.sfx('bell');
    await S.narr('小火车慢了下来。\n一个没有灯的站台，从黑暗里滑了过来。站名牌上写着两个字：「終点」。');
    chime(S, true);
    await S.say('车内广播', ['终点站，到了。', '请全体乘客……下车。'], { style: 'whisper' });
    return S.end({ bad: true, id: 'terminal', title: '终点站', text: '第二天中午，房东打开了真弓的房门。\n她躺在被褥里，表情很安详。像是坐车坐到了终点，睡着了。\n\n诊断书上写的是：心脏麻痹。\n\n——在这边，是心脏麻痹。\n　在那边……' });
  }

  /* 小人：披着破布兜帽的猴脸小人（原帖里「穿着破布的小人」） */
  const kobFace = c => function (g, d, fr, G, R) {
    const rag = '#2a221c';
    if (d === 0) {
      R(2, G.hT + 2, 2, 3, c); R(12, G.hT + 2, 2, 3, c); R(2, G.hT + 3, 1, 1, '#d88a7a'); R(13, G.hT + 3, 1, 1, '#d88a7a');   // 从兜帽两边支出来的耳朵
      R(5, G.hT + 2, 6, 5, '#c87262'); R(6, G.hT + 5, 4, 2, '#e0a890');   // 红脸、浅色的口鼻
      R(6, G.hT + 3, 1, 1, '#ff2a1a'); R(9, G.hT + 3, 1, 1, '#ff2a1a'); R(5, G.hT + 2, 6, 1, '#7a3a2a');
      R(6, G.hT + 6, 4, 1, '#3a0808'); R(7, G.hT + 6, 1, 1, '#e8e0d0'); R(9, G.hT + 6, 1, 1, '#e8e0d0');
    } else if (d === 1) { R(4, G.hT + 2, 3, 5, '#c87262'); R(3, G.hT + 5, 3, 2, '#e0a890'); R(4, G.hT + 3, 1, 1, '#ff2a1a'); R(10, G.hT + 2, 2, 3, c); }
    for (const x of [3, 6, 9, 12]) R(x, 20 + ((x * 7) % 3 === 0 ? 1 : 0), 1, 2, rag);   // 破破烂烂的下摆
    if (d !== 3) { R(4, G.tT + 2, 1, 3, rag); R(10, G.tT + 4, 2, 1, rag); }
  };

  defChapter({
    id: 'saruyume', n: 3, title: '猿梦', sub: '昏暗的小站，猴子模样的小火车。广播报出下一个人的死法——快醒过来。', origin: '日本网络怪谈', color: '#4a3a5c',
    icon: '@kobA', amb: 'otherworld', floor: 'wood', wall: 'concrete', dark: .78, plr: 3,
    people: {
      me: { skin: '#f1cfb0', hair: '#2a1e1c', hs: 'bob', top: '#b8a0b8', top2: '#e8e0e0', bottom: '#3a3a52', skirt: true, shoes: '#2a2228' },
      paxA: { skin: '#cfc6be', hair: '#1a1818', hs: 'short', top: '#3a3e4a', top2: '#c8c8c8', bottom: '#2a2c34', eye: '#3a3438' },
      paxB: { skin: '#d6cbc4', hair: '#3a2a22', hs: 'long', top: '#6a4a7a', bottom: '#3a3040', skirt: true, eye: '#3a3438' },
      paxC: { skin: '#cbbfb4', hair: '#8a8680', hs: 'short', top: '#5a5a48', coat: true, bottom: '#3a3a30', eye: '#3a3438' },
      paxD: { skin: '#efd2b8', hair: '#1a1416', hs: 'long', top: '#e8e8ec', top2: '#2a3a6a', bottom: '#2a3a6a', skirt: true, shoes: '#2a1a14', key: 'saru-girl', extra(g, d, fr, G, R) { if (d === 0) { R(6, G.tT + 1, 4, 2, '#a02a3a'); } } },
      paxE: { skin: '#d8ccc2', hair: '#2a1a14', hs: 'bun', top: '#4a5a6a', bottom: '#4a5a6a', skirt: true, eye: '#3a3438' },
      paxF: { skin: '#d2c4b6', hair: '#b8b4ae', hs: 'bun', top: '#5a4a3a', bottom: '#3a2e26', skirt: true, eye: '#3a3438' },
      paxG: { skin: '#d4cac0', hair: '#4a3020', hs: 'messy', top: '#7a3a3a', bottom: '#2a3048', eye: '#3a3438', key: 'saru-hp', extra(g, d, fr, G, R) { if (d === 0) { R(3, G.hT + 3, 1, 3, '#222'); R(12, G.hT + 3, 1, 3, '#222'); R(3, G.hT - 1, 10, 1, '#222'); } else if (d === 1) R(8, G.hT + 3, 2, 3, '#222'); } },
      kobA: { key: 'saru-kobA', child: true, skin: '#c87262', hair: '#4a3020', hs: 'messy', top: '#4a4036', top2: '#2a2018', bottom: '#4a3a2a', robe: true, shoes: '#2a1a10', eye: '#ff2a1a', hat: 'hood', hatC: '#3e352c', extra: kobFace('#b86a5a') },
      kobB: { key: 'saru-kobB', child: true, skin: '#b86656', hair: '#3a2418', hs: 'messy', top: '#3e3a34', top2: '#2a2018', bottom: '#3a3028', robe: true, shoes: '#2a1a10', eye: '#ff2a1a', hat: 'hood', hatC: '#34302a', extra: kobFace('#a85e50') }
    },
    /* 惊吓大头像（32×32）：破布兜帽里的猴脸——红脸、深眼窝里针尖似的红瞳、越咧越大的尖牙嘴；车窗里没有脸的「你」 */
    faces: {
      kobA(R, a) {
        const C = '#3a3028', C2 = '#55463a', C3 = '#1e1814', FUR = '#4a2e1c', SK = '#c66656', SK2 = '#943e34', MZ = '#e4ac92', K = '#120606';
        R(9, 0, 14, 2, C); R(6, 2, 20, 3, C); R(4, 5, 24, 22, C); R(2, 22, 28, 10, C);   // 破布兜帽
        for (const [x, h] of [[2, 3], [6, 2], [11, 4], [17, 2], [22, 3], [27, 4]]) R(x, 32 - h, 2, h, C3);   // 下摆的破口
        R(6, 4, 2, 12, C2); R(24, 6, 2, 10, C2); R(11, 1, 4, 1, C2); R(3, 24, 1, 6, C2); R(28, 23, 1, 6, C2);
        R(2, 11, 5, 7, SK2); R(3, 12, 3, 5, SK); R(25, 11, 5, 7, SK2); R(26, 12, 3, 5, SK);   // 从兜帽两边支出来的大耳朵
        R(8, 6, 16, 20, FUR); R(7, 9, 1, 14, FUR); R(24, 9, 1, 14, FUR);
        R(10, 7, 12, 1, SK); R(9, 8, 14, 16, SK); R(10, 24, 12, 1, SK);
        R(9, 9, 14, 3, SK2); R(10, 12, 1, 1, SK2); R(21, 12, 1, 1, SK2);   // 皱巴巴的眉骨
        const open = a < .2 ? 1 : 3;
        R(10, 12, 5, 4, K); R(17, 12, 5, 4, K);
        R(12, 14 - (open >> 1), 2, open, '#ff2a1a'); R(18, 14 - (open >> 1), 2, open, '#ff2a1a'); R(12, 13, 1, 1, '#ffd0c0'); R(18, 13, 1, 1, '#ffd0c0');
        R(11, 17, 10, 7, MZ); R(14, 18, 1, 2, K); R(17, 18, 1, 2, K);   // 口鼻
        R(9, 16, 2, 1, SK2); R(21, 16, 2, 1, SK2); R(9, 20, 1, 2, SK2); R(22, 20, 1, 2, SK2);
        const mw = 6 + Math.round(a * 6), mh = 1 + Math.round(a * 3), mx = 16 - (mw >> 1);
        R(mx, 21, mw, mh, '#2a0606');
        for (let x = mx; x < mx + mw; x += 2) { R(x, 21, 1, 1 + (x % 4 === 0 ? 1 : 0), '#f0e6d0'); if (mh > 2) R(x + 1, 20 + mh, 1, 1, '#f0e6d0'); }
      },
      noface(R, a) {
        R(0, 0, 32, 32, '#2a1e2a'); R(2, 2, 28, 28, '#06040a');   // 车窗框和外面的黑暗
        R(3 + Math.round(a * 20), 4, 3, 22, 'rgba(255,200,140,.18)');   // 隧道的灯掠过
        const H = '#2a1e1c', SK = '#d8b8a4', SK2 = '#b8988a';
        R(8, 5, 16, 6, H); R(6, 8, 20, 15, H); R(6, 23, 5, 5, H); R(21, 23, 5, 5, H);   // 齐肩短发
        R(10, 10, 12, 1, SK); R(9, 11, 14, 12, SK); R(10, 23, 12, 2, SK); R(12, 25, 8, 1, SK);
        R(20, 11, 2, 13, SK2); R(18, 24, 2, 1, SK2);
        R(9, 9, 14, 3, H); R(9, 12, 2, 4, H);   // 刘海——下面什么都没有
        if (a > .5) R(15, 18, 2, 1, SK2);   // 光滑的皮肤上，只有一点点起伏
        R(11, 27, 10, 5, '#b8a0b8'); R(14, 27, 4, 2, '#e8e0e0');
        R(2, 2, 28, 1, 'rgba(255,255,255,.08)');
      }
    },
    endings: { good: '見月坂', girl: '两个人的站台', eyes: '闭上眼睛', terminal: '终点站' },
    items: {
      pass: { name: '定期券', desc: '电车月票。「見月坂 ⇄ 大学前」。每天早上七点四十二分，你都在見月坂站的二号站台等车。' },
      diary: { name: '梦日记', desc: '你开始记的梦日记。第一页写着：「车头是猴子。我坐在后面数第三排。」' },
      ribbon: { name: '红领结', desc: '穿水手服的女孩留下的领结。背面用圆珠笔写着：「它没有站。所以它不停。对着广播，说出你自己的车站。」' }
    },
    notes: {
      post: { title: '你发的帖子 · 2000年5月', text: '【超常现象板】说说我做的一个梦\n\n我在一个很暗的小车站里。站台上一个人也没有。\n广播响了，是个没精神的男人声音：\n「电车马上就要进站了。乘上去的话，会很恐怖哦。」\n\n来的是游乐园里那种小火车，车头画成猴子的样子。乘客都坐着，一个个面无表情。\n我坐在从后面数第三排。\n\n车开动以后，广播又说：「下一个是活造り。」\n后面传来惨叫。我回头，看见几个披着破布的小人围着最后一排的男人……我不敢写下去。\n然后是「下一个是挖眼。」小人手里拿着勺子一样的东西。\n\n然后广播说：「下一个是绞肉。」\n我后面，已经没有人了。小人推来一台机器，停在我的座位旁边。\n\n我心里想：这是梦，这一定是梦。拼命地想。\n机器的声音越来越近，脸上感觉到一阵风——然后就醒了。\n\n醒来的时候，枕头湿了一大片。' },
      book: { title: '《清醒梦入门》第三章', text: '◆ 现实检验（Reality Check）\n\n梦里的世界经不起「看第二遍」。养成习惯，在梦里也会下意识地去做：\n\n一、看钟。移开视线，再看一次。梦里的指针往往会乱跳、倒转，或者数字不对。\n二、读字。读一行字，移开眼睛，再读一次。梦里的字会变。\n三、照镜子。梦里的镜像常常迟钝、模糊，或者干脆没有。\n四、数手指。梦里的手，手指的数目常常不对。\n\n◆ 一旦确信「这是梦」\n大多数人会在这一瞬间醒来。练习得当的人，则可以留在梦里，甚至改变梦。\n\n（书页空白处，有你用铅笔写的字：\n钟、字、镜子。别忘了。）' },
      reply: { title: '帖子的回复（节选）', text: '2：好可怕。你还记得广播的声音吗？\n5：我小时候也做过很像的梦。车头是猴子。我当时是从前面数的第二排，醒过来了。\n9：活造り、挖眼、绞肉……别写了别写了\n14：听说这种梦会传染。看了帖子的人，也会梦见那辆车。\n18：楼主，再梦到的话千万别等，马上醒。\n23：（楼主）我又梦到了。接着上次的。还是绞肉——这次，坐我后面的老人替我……然后广播说「又要逃走了吗？下次再来就是最后一次了」\n24：……\n27：我看过一个说法：在这个梦里没醒过来的人，这边的死因写的是心脏麻痹。\n　　可是在那边，是绞肉。\n28：别说了！！\n31：我奶奶说过：梦里的车，只有到站才肯停。它不停，是因为没人告诉它「下一站」是哪儿。\n32：＞31 什么意思？\n33：＞32 抢在它前面广播啊。报一个真实存在的、你每天都去的车站。那辆车没有自己的站，它只能停在你给它的站。\n34：＞33 编的吧\n35：（楼主）……我试试。' },
      route: { title: '驾驶室里的路线图', text: '一张褪色的游乐园路线图。小火车的线路画成一个圈，绕着「猿梦乐园」转。\n\n站名一个一个写在圈上：\n\n　猿梦　→　活造り　→　挖眼　→　绞肉\n　→　□□　→　□□　→　……　→　终点\n\n后面的站名被人用红笔一个一个涂掉了。\n只有「终点」两个字没有涂。\n\n角落里印着一行小字：\n「本列车不设停车站。如需下车，请向广播申报站名。」' }
    },
    legend: '「猿梦」（さるゆめ）是日本网络时代最有名的怪谈之一。据说它最早是1999年前后投稿到个人怪谈网站上的一篇《恐怖的广播》（恐怖のアナウンス），2000年夏天被转贴到大型匿名论坛「2ちゃんねる」超常现象板的怪谈串里，之后才以「猿梦」这个标题流传开来。讲述者以第一人称说自己做过的一个梦：在一个昏暗的无人小站里，广播说「电车马上就要来了，坐上去的话，你会遇到可怕的事哦」；驶来的是游乐园里那种猴子小火车，乘客们面无表情地坐着，他坐在从后面数第三个位子。\n\n车开动后，广播一个一个地报：「下一个是活造り」——最后面的男人被几个披着破布的小人像片活鱼一样剖开；「下一个是挖眼」——他正后方的长发女人被小人用勺子一样的东西挖出眼睛；「下一个是绞肉」——轮到他自己，小人带着机器爬上他的膝盖。他闭上眼睛拼命想「这是梦，快醒过来」，在越来越近的机器声和吹到脸上的风里醒了过来。原帖说，几年以后他又做了同一个梦，「接着上次的」，又一次在绞肉机前醒来，耳边留下一句「又要逃走了吗？下次再来的时候，就是最后一次了哦」——他坚信这句话是在醒着的房间里听见的。\n\n流传中加上去的东西更多：不少转述在结尾补了一句「在这边是心脏麻痹，在那边就是绞肉」；「看过这个故事的人也会梦见那辆车」成了最常见的附加规则，也有人说它会在你主动去查它的时候找上门。处刑的种类、顺序和人数，各个版本并不一致，也有版本把小火车换成了普通电车。「猿梦」常被拿来和「如月车站」等「异界列车」怪谈相提并论；而「意识到是梦就能醒」的情节，和清醒梦里的「现实检验」几乎一模一样，许多人把它当作最朴素的破解法。\n\n（本章是游戏改编：主角真弓、朋友美穗、穿水手服的女孩、「見月坂」站、帖子的回复、驾驶室与路线图，以及「抢先广播站名让列车停靠」的破解方法，均为虚构；原帖两次梦之间隔了好几年，本章压缩成了连续三夜，第二夜由身后的老人「替」了一次绞肉，也是游戏的安排。）',
    start: { map: 'station', x: 10, y: 3, dir: 3 },
    resume: {
      n1: async S => { resetKob(S); S.pos(PS[0], PS[1], 2); startExec(S); },
      n2: async S => { resetKob(S); S.pos(PS[0], PS[1], 2); startExec(S); },
      n3: async S => { night3Seat(S); },
      n3e: async S => { edgeReset(S); S.goal('跑！跑向站台尽头的出口'); }
    },
    async intro(S) {
      S.f.n = 1; S.f.ph = 'station1';
      await S.card('第三夜　猿梦', '2000年5月　日本　东京近郊', '真弓是大学二年级的学生。\n她从来不记得自己做过什么梦。\n\n直到那天晚上。');
    },
    tick(S, dt) {
      if (S.f.n === 3 && S.map === 'edge' && S.f.ph === 'exec' && !W.busy) edgeTick(S, dt);
    },
    sprites: {
      ekisign(g, e, t, R) {   // 站名牌（2 格宽，挂墙面）
        R(2, -2, 1, 4, '#3a3a40'); R(29, -2, 1, 4, '#3a3a40');
        bx2(R, 0, 2, 32, 10, e.text === '見月坂' ? '#eef0f2' : '#d8d4dc');
        const s = e.text || '';
        R(1, 9, 30, 2, e.text === '見月坂' ? '#2a6a4a' : '#5a3a6a');
        if (!s) return;
        for (let i = 0; i < Math.min(3, s.length); i++) { const c = s.charCodeAt(i), x = 6 + i * 8; for (let k = 0; k < 9; k++) if ((c >> k) & 1) R(x + (k % 3) * 2, 3 + ((k / 3) | 0) * 2, 2, 2, '#1a1620'); }
      },
      dclock(g, e, t, R) {   // 指针钟：num = 时针（0~11），s.m = 分针（0~11）；s.spin 乱转
        R(3, 0, 10, 10, '#2a2420'); R(4, 1, 8, 8, '#e0dccc'); R(3, 1, 1, 8, '#2a2420'); R(12, 1, 1, 8, '#2a2420');
        const hand = (k, len, col) => { const a = k / 12 * Math.PI * 2; for (let i = 0; i <= len; i++) R(Math.round(8 + Math.sin(a) * i) - (i ? 0 : 0), Math.round(5 - Math.cos(a) * i), 1, 1, col); };
        const sp = e.spin ? t * 9 : 0;
        hand((e.num ?? 4) + sp * .3, 2.4, '#111'); hand((e.m ?? 8.8) + sp, 3.4, '#3a2a2a');
      },
      speaker(g, e, t, R) { R(3, 2, 10, 8, '#3a3a3e'); R(4, 3, 8, 6, '#1a1a1e'); for (let y = 4; y < 9; y += 2) R(5, y, 6, 1, '#4a4a50'); R(7, 0, 2, 2, '#3a3a3e'); },
      tad(g, e, t, R) {   // 车厢广告
        R(1, 2, 14, 10, '#d8c8a8'); R(2, 3, 12, 3, e.red ? '#8a1818' : '#c86a2a'); R(3, 7, 10, 1, '#6a5a4a'); R(3, 9, 7, 1, '#6a5a4a');
        R(10, 7, 3, 4, '#8a5a3a'); R(11, 8, 1, 1, e.red ? '#ff2020' : '#1a1010');
      },
      twin(g, e, t, R) {   // 车窗：隧道的黑暗，偶尔有灯掠过
        R(1, 2, 14, 10, '#3a2a3a'); R(2, 3, 12, 8, '#08060c');
        if (e.mov !== false) { const p = ((t * 90 + e.px * 0.7) % 260); if (p < 14) R(2 + Math.max(0, 12 - p), 4, Math.min(3, p), 5, 'rgba(255,200,140,.55)'); }
        if (e.me) { R(6, 5, 4, 5, 'rgba(140,130,150,.35)'); R(6, 4, 4, 2, 'rgba(40,30,40,.6)'); }
        R(2, 3, 12, 1, 'rgba(255,255,255,.08)');
      },
      tseat(g, e, t, R) { const c = e.col || '#7a4a5a'; bx2(R, 2, -2, 12, 7, shade(c, -.15)); bx2(R, 1, 4, 14, 10, c); R(2, 5, 12, 2, shade(c, .15)); },
      sidedoor(g, e, t, R) { const c = e.col || '#6a3a3a'; bx2(R, 3, -6, 10, 20, c); if (e.open) { R(4, -5, 8, 18, '#08060a'); R(5, 8, 6, 1, 'rgba(255,80,80,.5)'); return; } R(5, -4, 6, 6, '#120c10'); R(10, 4, 2, 2, '#c9a35a'); if (e.face) { R(5, 4, 6, 6, '#8a5a3a'); R(6, 6, 1, 1, '#c01818'); R(9, 6, 1, 1, '#c01818'); R(6, 8, 4, 1, '#2a0a0a'); } },
      minitrain(g, e, t, R) {   // 停在站台的猿梦小火车（10 格宽）
        const cars = ['#b87a8a', '#6aa0a0', '#c8b060'], ghost = e.s && e.s.dim;
        R(0, 26, 160, 3, 'rgba(0,0,0,.45)');
        for (let i = 0; i < 3; i++) {
          const x = 2 + i * 38, c = shade(cars[i], ghost ? -.35 : -.1);
          bx2(R, x, 6, 34, 18, c); R(x + 1, 7, 32, 2, shade(c, .25)); R(x + 3, 13, 28, 1, shade(c, -.3));
          for (let k = 0; k < 3; k++) { R(x + 4 + k * 10, 1, 6, 6, '#3a2a30'); if (!e.empty || k === 1) { R(x + 5 + k * 10, -3, 4, 4, '#cfc6c0'); R(x + 5 + k * 10, -4, 4, 2, '#2a2022'); } }
          R(x + 6, 24, 6, 5, '#141012'); R(x + 22, 24, 6, 5, '#141012'); R(x + 8, 26, 2, 1, '#888');
          if (i < 2) R(x + 34, 17, 4, 2, '#2a2a2a');
        }
        const ex = 118;   // 车头：猴子的脸
        bx2(R, ex, 0, 38, 24, '#7a4a2a'); R(ex + 1, 1, 36, 3, '#9a6a3a');
        R(ex + 6, -8, 26, 10, '#6a3a1a'); R(ex + 2, -4, 6, 7, '#8a5a3a'); R(ex + 30, -4, 6, 7, '#8a5a3a');
        R(ex + 9, 4, 20, 16, '#e0b898'); R(ex + 12, 7, 4, 4, '#140c0c'); R(ex + 22, 7, 4, 4, '#140c0c');
        R(ex + 13, 8, 1, 1, e.red ? '#ff3030' : '#f0e0d0'); R(ex + 23, 8, 1, 1, e.red ? '#ff3030' : '#f0e0d0');
        R(ex + 10, 12, 3, 2, '#d88080'); R(ex + 25, 12, 3, 2, '#d88080'); R(ex + 14, 15, 10, 2, '#4a1a1a'); R(ex + 15, 15, 8, 1, '#e8e0d0');
        R(ex + 6, 24, 7, 5, '#141012'); R(ex + 26, 24, 7, 5, '#141012');
        R(ex + 36, 10, 3, 4, ghost ? '#6a5a40' : '#ffe8a0');
      },
      pmirror(g, e, t, R) { R(7, -2, 2, 16, '#4a4a50'); bx2(R, 3, -10, 10, 9, '#2a2a2e'); R(4, -9, 8, 7, '#6a7a8a'); R(5, -8, 2, 3, '#9aaaba'); if (e.face) { R(7, -7, 3, 4, '#d8ccc8'); R(7, -8, 3, 1, '#2a1e1c'); R(8, -5, 1, 1, '#a01818'); } },
      mic(g, e, t, R) { bx2(R, 0, 2, 16, 12, '#3a3a40'); R(2, 4, 12, 3, '#1a1a20'); for (let i = 0; i < 4; i++) R(3 + i * 3, 9, 2, 2, ['#c03030', '#30a040', '#d0b030', '#3060c0'][i]); R(7, -6, 2, 9, '#5a5a60'); R(5, -9, 6, 4, '#2a2a2e'); R(6, -8, 4, 2, '#5a5a62'); if (e.lit) R(13, 4, 2, 2, Math.sin(t * 8) > 0 ? '#ff3a3a' : '#5a1010'); },
      cabwin(g, e, t, R) { R(0, 1, 16, 12, '#2a2a30'); R(1, 2, 14, 10, '#4a4858'); for (let i = 0; i < 4; i++) R(((t * 20 + i * 5) % 14) + 1, 3 + i * 2, 4, 1, 'rgba(220,215,235,.35)'); R(7, 8, 2, 4, '#2a2830'); },
      route(g, e, t, R) { R(1, 2, 14, 10, '#e0d8c0'); R(3, 4, 10, 6, '#c8b898'); R(4, 5, 8, 4, '#e0d8c0'); for (let i = 0; i < 5; i++) R(3 + i * 2, 4, 1, 1, i < 4 ? '#c01818' : '#1a1a1a'); },
      pc(g, e, t, R) { bx2(R, 1, -6, 14, 12, '#d8d4c8'); R(3, -4, 10, 8, e.power ? '#2a4a7a' : '#1a1e22'); if (e.power) { R(4, -3, 6, 1, '#cfe0f0'); R(4, -1, 8, 1, '#8ab0d0'); R(4, 1, 5, 1, '#8ab0d0'); } R(6, 6, 4, 2, '#b8b4a8'); bx2(R, 2, 8, 12, 4, '#cfcbc0'); },
      bag(g, e, t, R) { bx2(R, 3, 5, 10, 9, '#6a4a5a'); R(5, 2, 6, 1, '#4a3040'); R(5, 3, 1, 3, '#4a3040'); R(10, 3, 1, 3, '#4a3040'); R(7, 8, 2, 2, '#c9a35a'); },
      diary(g, e, t, R) { R(4, 7, 8, 6, '#3a4a6a'); R(5, 8, 6, 4, '#4a5a7a'); R(11, 7, 1, 6, '#e8e0c8'); },
      mincer(g, e, t, R) {   // 铁做的绞肉机：漏斗、机身、出口、摇柄（s.run 时摇柄转、机身抖）
        const j = e.run ? (Math.sin(t * 50) > 0 ? 1 : 0) : 0, a = e.run ? t * 9 : .6;
        R(4, 13, 9, 2, 'rgba(0,0,0,.4)');
        bx2(R, 3 + j, -3, 9, 3, '#5a5a62'); R(5 + j, 0, 5, 3, '#45454c');   // 漏斗
        bx2(R, 3 + j, 3, 9, 8, '#4a4a52'); R(4 + j, 4, 7, 2, '#6a6a74');   // 机身
        R(12 + j, 6, 3, 3, '#3a3a40'); R(13 + j, 7, 2, 1, '#1a0e0e');   // 出口
        R(5, 11, 5, 3, '#2a2a2e');   // 夹在座位边上的底座
        const cx = 2 + j, cy = 6; R(cx, cy, 1, 1, '#2a2a2e');
        R(cx + Math.round(Math.cos(a) * 2) - 1, cy + Math.round(Math.sin(a) * 2), 2, 2, '#8a6a3a');   // 摇柄
      }
    },
    tiles: {
      gravel: { solid: true, paint(R, X, Y) { R(0, 0, 16, 16, '#2a2630'); for (let i = 0; i < 10; i++) R((hash(X, Y, i) * 15) | 0, (hash(Y, X, i + 9) * 15) | 0, 2, 1, i % 2 ? '#3a3540' : '#1e1a22'); } },
      railT: { solid: true, paint(R, X, Y) { TILE_GR(R, X, Y); R(0, 2, 16, 3, '#3a2a22'); R(0, 11, 16, 3, '#3a2a22'); for (let x = 1; x < 16; x += 5) R(x, 1, 3, 14, '#2a1e18'); R(0, 4, 16, 2, '#6a6a72'); R(0, 10, 16, 2, '#6a6a72'); } },
      railW: { solid: false, paint(R, X, Y) { TILE_GR(R, X, Y); for (let x = 1; x < 16; x += 5) R(x, 2, 3, 12, '#2a1e18'); if (Y === 3) { R(0, 0, 16, 2, '#5a5a62'); R(0, 14, 16, 2, '#5a5a62'); } } },
      pedge: { solid: false, paint(R, X, Y) { TILE.stone.paint(R, X, Y); R(0, 6, 16, 4, '#b8a040'); for (let x = 1; x < 16; x += 3) R(x, 7, 1, 2, '#8a7830'); R(0, 14, 16, 2, '#1a1820'); } },
      tfloor: { solid: false, paint(R, X, Y) { const b = '#5a4650'; R(0, 0, 16, 16, b); for (let r = 0; r < 4; r++) { R(0, r * 4 + 3, 16, 1, shade(b, -.3)); if (hash(X, Y + r, 4) < .3) R(((hash(X, Y, r) * 12) | 0), r * 4 + 1, 3, 1, shade(b, .12)); } } },
      dreamv: { solid: true, paint(R, X, Y) { R(0, 0, 16, 16, '#14101c'); for (let i = 0; i < 3; i++) if (hash(X, Y, 60 + i) < .5) R((hash(X, Y, 70 + i) * 14) | 0, (hash(Y, X, 80 + i) * 14) | 0, 2, 1, '#2a2438'); if (hash(X, Y, 90) < .12) R(6, 6, 1, 1, '#8a80a0'); } },
      dfloor: { solid: false, paint(R, X, Y) { R(0, 0, 16, 16, '#0e0c14'); if (hash(X, Y, 91) < .3) R((hash(X, Y, 92) * 12) | 0, (hash(X, Y, 93) * 14) | 0, 4, 1, '#1e1a2a'); } }
    },
    maps: {
      /* ---------------- 梦中的无人小站 ---------------- */
      station: {
        amb: 'otherworld', dark: .8, plr: 2.8, wall: 'concrete', wallC: { face: '#4a4458', trim: '#2a2434' }, fog: .18,
        darkC: '#0a0612',
        legend: { 'Y': 'pedge', 'G': 'railT', 'X': 'gravel' },
        rows: [
          '######################',
          '######################',
          '#kkkkkkkkkkkkkkkkkkkk#',
          '#kkkkkkkkkkkkkkkkkkkk#',
          '#kkkkkkkkkkkkkkkkkkkk#',
          'YYYYYYYYYYYYYYYYYYYYYY',
          'GGGGGGGGGGGGGGGGGGGGGG',
          'GGGGGGGGGGGGGGGGGGGGGG',
          'XXXXXXXXXXXXXXXXXXXXXX'],
        ents: [
          { id: 'spk', x: 4, y: 1, spr: 'speaker', on: speakerOn },
          { id: 'sign', x: 8, y: 1, w: 2, spr: 'ekisign', text: '猿梦', on: signOn },
          { id: 'sclock', x: 13, y: 1, spr: 'dclock', num: 4, s: { m: 8.8 }, on: sclockOn },
          { x: 16, y: 1, spr: 'poster', col: '#b89ab0', on: sn('褪色的海报：「欢迎光临　猿梦乐园」。\n画上是一辆笑嘻嘻的猴子小火车，载着一车笑嘻嘻的孩子。\n……孩子们的脸，都被人用指甲刮掉了。') },
          { x: 11, y: 1, spr: 'window', on: sn('站房的小窗户。里面没有站务员，只有一把转椅，慢慢地、慢慢地自己转着。') },
          { x: 5, y: 3, w: 2, spr: 'bench', on: sn('长椅冰凉。椅背上刻着一行歪歪扭扭的字：「别等车」。') },
          { id: 'pmir', x: 17, y: 3, spr: 'pmirror', on: pmirOn },
          { x: 19, y: 2, spr: 'vending', col: '#6a4a7a', on: sn('自动贩卖机。所有的按钮都亮着「售罄」。\n玻璃后面摆着一排一模一样的饮料罐，罐子上印着猴子的脸。') },
          { x: 2, y: 4, spr: 'barrel', on: sn('铁皮垃圾桶。里面塞满了没剪过的车票。') },
          { id: 'stairs', x: 1, y: 2, spr: 'stairsdown', solid: false, async touch(S) {
            await S.narr('你顺着楼梯往下走。\n雾是灰紫色的。走着走着，脚下的台阶又变成了往上的。');
            await S.walk('pl', [3, 3], 5);
            await S.narr('……你又回到了站台上。');
          } },
          { id: 'sl1', x: 6, y: 2, light: { r: 3.6, col: 'rgba(170,140,220,.13)', flick: true } },
          { id: 'sl2', x: 15, y: 2, light: { r: 3.4, col: 'rgba(170,140,220,.12)' } },
          { id: 'mtrain', x: -12, y: 6, w: 10, h: 2, spr: 'minitrain', hidden: true, light: { r: 4, dx: 150, dy: 10, col: 'rgba(255,220,150,.12)' }, on: boardOn }
        ],
        async enter(S, first) {
          if (S.f.n === 1 && first) {
            await S.narr('……你站在一个很暗的小车站里。\n站台上一个人也没有。荧光灯一闪一闪，发出蚊子一样的嗡嗡声。');
            await S.think('我怎么会在这儿？\n……我刚才明明在床上。');
            chime(S); await S.wait(800);
            S.bubble('spk', '…', 1800);
            await S.say('站内广播', ['电车，马上就要进站了。', '乘上去的话……会很恐怖哦。'], { style: 'whisper' });
            await S.narr('那是一个男人的声音。没精打采的，好像刚睡醒，又好像根本没睡醒。');
            S.goal('四处看看（站名牌在墙上）');
            return;
          }
          if (S.f.n === 2 && S.f.ph === 'station' && S.once('st2')) {
            S.place('mtrain', 6, 6); S.ent('mtrain').s.empty = true;
            await S.narr('又是这里。\n灰紫色的雾，一闪一闪的荧光灯。');
            await S.narr('小火车已经停在站台边上了。车门开着。\n车头那张猴子的脸，冲着你笑。');
            chime(S); await S.wait(700);
            await S.say('站内广播', ['欢迎回来。', '电车已经进站了。这一次……也请好好享受哦。'], { style: 'whisper' });
            await S.think('别慌。书上说的——钟、字、镜子。\n在上车之前，先确认清楚：这是梦。');
            S.goal(evGoal(S));
            S.cp();
          }
        }
      },
      /* ---------------- 猿梦小火车 车厢 ---------------- */
      train: {
        amb: 'bus', dark: .72, plr: 2.6, wall: 'plain', wallC: { face: '#5a4a5e', trim: '#3a2a3a', top: '#140e16' }, floor: 'tfloor',
        darkC: '#0c0610',
        legend: { '.': 'tfloor' },
        rows: [
          '##############################',
          '##############################',
          '#............................#',
          '#............................#',
          '#............................#',
          '##############################'],
        ents: [
          { id: 'rdoor', x: 1, y: 1, spr: 'door', open: true, on: S => S.narr(S.f.n === 3 ? '车尾的门开着。门里面黑得像一口井。\n里面有东西在笑。你不想过去。' : '车尾那扇门开着，里面黑洞洞的。\n小人们就是从那里出来的。') },
          ...[3, 6, 18, 21, 24].map(x => ({ id: 'tw' + x, x, y: 1, spr: 'twin', on: S => (S.f.n === 1 && S.f.ph === 'exec' && !S.f.ev1_win)
            ? S.narr('漆黑的车窗变成了一面镜子。可是从这个角度，只映得出空座位和别人的后脑勺。\n……要看自己的样子，得站到自己座位旁边的那扇窗前。')
            : S.narr(['窗外是隧道。隧道壁上的灯一盏一盏地往后掠过去。\n……你数了数。每隔七盏灯，就有一盏是红的。一直都是。', '车窗玻璃很凉。你把额头贴上去——外面的黑暗，好像也在贴着玻璃看你。'][x % 2]) })),
          { id: 'wme', x: 11, y: 1, spr: 'twin', s: { me: true }, on: wmeOn },
          { id: 'tad', x: 8, y: 1, spr: 'tad', on: tadOn },
          { id: 'tad2', x: 20, y: 1, spr: 'tad', on: S => S.narr('车厢广告：「猿梦乐园　全年无休　永远营业」。\n画上的猴子竖着大拇指。它的大拇指……有点太长了。') },
          { id: 'tclock', x: 14, y: 1, spr: 'dclock', num: 4, s: { m: 8.8 }, on: tclockOn },
          { id: 'spk2', x: 16, y: 1, spr: 'speaker', on: S => S.narr('车厢里的喇叭。网眼里积着一层灰。\n凑近了听——里面有很轻很轻的呼吸声。') },
          { id: 'cdoor', x: 27, y: 1, spr: 'sidedoor', col: '#7a4a2a', on: cdoorOn },
          ...[4, 7, 10, 13, 16, 19, 22, 25].flatMap(x => [2, 4].map(y => ({ x, y, spr: 'tseat', decal: true, solid: false, col: ['#7a4a5a', '#4a6a6a', '#8a7a3a'][((x - 4) / 3 | 0) % 3] }))),
          { id: 'myseat', x: PS[0], y: PS[1], spr: 'invisible', solid: false, on: seatOn },
          { id: 'paxA', x: 4, y: 4, spr: '@paxA', dir: 2, on: S => S.narr('一个穿西装的男人。他直直地盯着前方，嘴微微张着。\n你在他面前挥了挥手。他连眼皮都没有动一下。') },
          { id: 'paxB', x: 7, y: 4, spr: '@paxB', dir: 2, on: S => S.narr('穿紫色毛衣的女人，脖子上围着一条紫色围巾。\n她的眼睛睁得很大，很大，一下都不眨。眼珠上蒙着一层灰。') },
          { id: 'paxC', x: 13, y: 2, spr: '@paxC', dir: 2, on: S => S.narr(S.f.n === 2 ? '那个穿旧大衣的老人，被换到了你身后的座位上。\n他的嘴唇在动，没有声音。你凑近了看——\n他在念：「下一个，下一个，下一个……」' : '穿旧大衣的老人，手里攥着一张车票。车票上什么字都没有。') },
          { id: 'paxD', x: 16, y: 4, spr: '@paxD', dir: 1, on: girlOn },
          { id: 'paxE', x: 19, y: 2, spr: '@paxE', dir: 2, on: S => S.narr('一个女人抱着一个空空的襁褓，轻轻地拍着。\n襁褓里什么都没有。') },
          { id: 'paxF', x: 22, y: 4, spr: '@paxF', dir: 2, on: S => S.narr('老太太在织毛衣。毛线是红色的，一直垂到地上，又一直延伸到车尾那扇门里去。') },
          { id: 'paxG', x: 25, y: 2, spr: '@paxG', dir: 2, on: S => S.narr('戴着耳机的年轻人。耳机线没有插在任何东西上。\n他在跟着什么节拍点头。你听不见。') },
          { id: 'ribbon', x: 16, y: 4, spr: 'thread', hidden: true, on: S => ribbonOn(S) },
          { id: 'kobA', x: 1, y: 3, spr: '@kobA', solid: false, hidden: true, on: S => S.narr('小人歪着头看你。它的个子只到你的腰。\n它在笑。') },
          { id: 'kobB', x: 0, y: 3, spr: '@kobB', solid: false, hidden: true, on: S => S.narr('另一个小人。它手里的东西藏在背后。') },
          { id: 'mincer', x: 9, y: 3, spr: 'mincer', solid: false, hidden: true, on: S => S.narr('铁做的绞肉机。漏斗里黑乎乎的，摇柄上缠着一圈红色的毛线。\n你不敢再看第二眼。') },
          { id: 'xl', x: 4, y: 4, hidden: true, light: { r: 2.4, col: 'rgba(200,30,30,.35)', flick: true } },
          ...[5, 11, 17, 23].map(x => ({ id: 'cl' + x, x, y: 3, light: { r: 3.6, col: 'rgba(230,200,150,.10)', flick: x === 5 } }))
        ],
        async enter(S, first) {
          if (S.f.n === 1 && S.once('t1')) return night1Board(S);
          if (S.f.n === 2 && S.once('t2')) return night2Board(S);
          if (S.f.n === 3 && S.once('t3')) return night3Board(S);
        },
        tick(S, dt) {
          if (!W.busy && S.f.moving && Math.random() < dt * .1) S.shake(200, 1);
          /* 第一、二夜：只剩 15 秒还没集齐证据时，给一次提示 */
          const n = S.f.n, st = cur(S);
          if (NEED[n] && S.f.ph === 'exec' && st && st.you && W.timer && W.timer.left < 15 && !W.busy && (S.f.evc || 0) < NEED[n] && !S.f.canWake && S.once('hint' + n)) {
            if (n === 1) { S.face('paxD', 'pl'); S.bubble('paxD', '!', 2500); S.toast('穿水手服的女孩冲你比口型：「钟——字——车窗——看两遍！」'); }
            else S.toast('（书上的第四条……数手指。坐回自己的座位上！）');
            S.sfx('heart');
          }
          if (n === 3 && S.f.ph === 'exec' && W.timer && !W.busy) {   // 第三夜：小人沿过道一格一格逼近；走到你身边就轮到你了
            const tgt = Math.min(8, 2 + Math.floor((1 - W.timer.left / T3) * 7.5));
            const a = S.ent('kobA'), b = S.ent('kobB'), p = S.pl;
            if (!a.mv && Math.round(a.px / TS) < tgt && !(p.y === AISLE && p.x === Math.round(a.px / TS) + 1)) { startMove(a, 2, 1.6); S.sfx('step'); if (Math.random() < .5) { S.sfx('giggle'); S.bubble('kobA', '…', 900); } }
            if (!b.mv && Math.round(b.px / TS) < Math.round(a.px / TS) - 1) startMove(b, 2, 1.6);
            const ax = Math.round(a.px / TS), ay = Math.round(a.py / TS);
            if (!a.hidden && Math.abs(ax - p.x) + Math.abs(ay - p.y) <= 1) { S.f.ph = 'caught'; S.clearTimer(); S.after(0, yourTurn); }
          }
        }
      },
      /* ---------------- 驾驶室 ---------------- */
      cab: {
        amb: 'bus', dark: .7, plr: 2.6, wall: 'metal', floor: 'metal',
        rows: [
          '#########',
          '#########',
          '#.......#',
          '#.......#',
          '#.......#',
          '#########'],
        ents: [
          { id: 'cback', x: 1, y: 1, spr: 'sidedoor', col: '#7a4a2a', on: S => (S.ent('cback').face ? S.narr('门上的小窗里，贴着一张红红的、皱巴巴的猴脸。\n它冲你咧开了嘴。……不能开门。') : S.go('train', 27, 2, 0)) },
          { id: 'cw1', x: 4, y: 1, spr: 'cabwin', on: cabwinOn },
          { id: 'cw2', x: 5, y: 1, spr: 'cabwin', on: cabwinOn },
          { id: 'cw3', x: 6, y: 1, spr: 'cabwin', on: cabwinOn },
          { id: 'route', x: 2, y: 1, spr: 'route', on: S => S.note('route') },
          { id: 'mic', x: 5, y: 2, spr: 'mic', on: micOn },
          { id: 'dseat', x: 4, y: 3, spr: 'chair', col: '#4a3a3a', on: S => S.narr('驾驶座上坐着一只布猴子。\n它的两只手被缝在操纵杆上，脑袋耷拉着。\n——这辆车，从来就没有司机。') },
          { id: 'mkdoll', x: 4, y: 3, oy: -4, spr: 'doll', col: '#8a5a3a', solid: false, z: 1 },
          { x: 7, y: 4, spr: 'box', on: S => S.narr('一箱没剪过的车票。每一张上都印着：「单程」。') },
          { id: 'cabL', x: 5, y: 3, light: { r: 3.4, col: 'rgba(255,90,90,.10)', flick: true } }
        ],
        async enter(S, first) {
          if (first) await S.narr('驾驶室很窄。挡风玻璃外面是隧道，隧道，还是隧道。\n控制台上的灯，一闪，一闪。');
          if (S.f.n === 3) { S.ent('mic').lit = true; if (S.f.ph === 'exec') S.goal('对着控制台上的话筒报站（三个字）'); }
        },
        tick(S, dt) {   // 第三夜：躲进驾驶室也没用——时间越少，身后的门敲得越急，门上的小窗里出现猴脸
          if (S.f.n !== 3 || S.f.ph !== 'exec' || !W.timer || W.busy) return;
          const left = W.timer.left, d = S.ent('cback');
          if (left < 30 && !d.face) { d.face = true; S.sfx('giggle'); S.bubble('cback', '!', 1200); }
          S.f._kn = (S.f._kn ?? 2) - dt;
          if (left < 45 && S.f._kn <= 0) { S.f._kn = left < 20 ? 1.1 : 2.4; S.sfx('knock'); if (left < 20) S.shake(160, 1); }
        }
      },
      /* ---------------- 真弓的公寓（白天） ---------------- */
      room: {
        amb: 'room', dark: .42, plr: 3.4, wall: 'paper', wallC: { face: '#8a8070', trim: '#4a4038' }, floor: 'wood',
        rows: [
          '#############',
          '#############',
          '#ttttttwwwww#',
          '#ttttttwwwww#',
          '#ttttttwwwww#',
          '#ttttttwwwww#',
          '#ttttttwwwww#',
          '#############'],
        ents: [
          { id: 'rwin', x: 2, y: 1, spr: 'window', lit: true, on: S => S.narr(S.f.day === 3 ? '阴天。楼下的电车道口「当当当」地响着。\n一辆电车开过去。你下意识地数了数车厢——三节。……不，是五节。真的电车是五节。' : '五月的早晨。窗外是一排晾衣竿，对面楼的阿姨在拍被子。\n普普通通的早晨。你却觉得，耳朵里还有那种嗡嗡声。') },
          { id: 'cal', x: 4, y: 1, spr: 'poster', col: '#e8e4d8', on: S => S.narr('挂历翻在五月。今天这一格里，你用红笔写着：「第二节：统计学小测」。\n……好像是很久以前的事了。') },
          { id: 'rclock', x: 6, y: 1, spr: 'dclock', num: 7, s: { m: 8.4 }, on: S => S.narr('七点四十二分。你盯着它看。移开眼睛，再看一次。\n还是七点四十二分。秒针一格一格地走着。\n……是真的。这里是真的。') },
          { id: 'shelf', x: 8, y: 2, spr: 'bookshelf', on: shelfOn },
          { id: 'pcdesk', x: 10, y: 2, spr: 'desk', col: '#6a5a4a', on: pcOn },
          { id: 'pc', x: 10, y: 2, oy: -2, spr: 'pc', solid: false, z: 1 },
          { id: 'phone', x: 11, y: 2, spr: 'phone', on: phoneOn },
          { id: 'bed', x: 1, y: 3, h: 2, spr: 'futon', col: '#8a7aa0', on: bedOn },
          { id: 'rdiary', x: 3, y: 4, spr: 'diary', on: diaryOn },
          { x: 3, y: 5, w: 2, spr: 'lowtable', col: '#6a4a30', on: S => S.narr('矮桌上放着昨晚没喝完的麦茶，和一包吃了一半的饼干。\n麦茶的表面，浮着一层薄薄的灰。') },
          { id: 'bag', x: 9, y: 6, spr: 'bag', on: bagOn },
          { id: 'rmir', x: 11, y: 5, spr: 'pmirror', on: S => S.narr('穿衣镜里的你，眼睛下面挂着两团青黑。\n你抬起手。镜子里的你也抬起手，一点也不慢。\n……很好。') },
          { id: 'rdoorR', x: 7, y: 7, spr: 'invisible', solid: true, on: S => S.narr('玄关的门。现在出门的话……\n不行。在搞清楚之前，哪儿也不想去。') },
          { id: 'rlamp', x: 6, y: 4, light: { r: 6, col: 'rgba(255,235,200,.10)' } }
        ],
        async enter(S, first) {
          if (S.f.day === 2 && S.once('d2')) {
            await S.narr('——！！\n你从被窝里弹起来，浑身都是冷汗。');
            await S.narr('天亮了。窗外有麻雀在叫。\n枕头湿了一大片。');
            await S.think(['刚才那个……是梦。', '是梦，对吧？', '……那个女人的尖叫声，现在还在耳朵里。']);
            S.goal('把那个梦写下来（书桌上的电脑）');
            S.cp();
          }
          if (S.f.day === 3 && S.once('d3')) {
            await S.narr('你睁开眼睛。\n这一次你没有叫出声。你只是躺着，盯着天花板，等心跳慢下来。');
            await S.think(['又是那辆车。接着上一次。', '「下次再来的时候，就是最后一次了哦。」', '……今晚。今晚还会再去。']);
            S.goal('看看帖子有没有人回复（电脑）');
            S.cp();
          }
        },
        tick(S, dt) {   // 写完帖子 / 看完回复之后，美穗的电话会自己响起来
          const ring = (S.f.day === 2 && S.f.posted && !S.f.call2) || (S.f.day === 3 && S.f.replies && !S.f.call3);
          if (!ring || W.busy) return;
          S.f._rg = (S.f._rg ?? 1.2) - dt;
          if (S.f._rg <= 0) { S.f._rg = 3.2; S.sfx('phone'); S.bubble('phone', '!', 1400); }
        }
      },
      /* ---------------- 梦的边缘：見月坂 ---------------- */
      edge: {
        amb: 'otherworld', dark: .7, plr: 3, wall: 'concrete', wallC: { face: '#8a8a90', trim: '#3a5a4a' }, floor: 'stone', fog: .22,
        darkC: '#0c0a14',
        legend: { 'V': 'dreamv', 'Y': 'pedge', 'G': 'railT', 'X': 'gravel', 'D': 'dfloor' },
        rows: [
          '##############################',
          '##############################',
          'VVVkkkkkkVVkkkkkkkkkVkkkkkkkkk',
          'DDkkkkVkkkkkkVVkkkkkkkkkkVkkkk',
          'DDkkkkVkkkkkkkkkkVVkkkkkkVkkkk',
          'DDkkkkkkkkVVkkkkkkkkkkVkkkkkkk',
          'VVYYYYYYYYYYYYYYYYYYYYYYYYYYYY',
          'VVGGGGGGGGGGGGGGGGGGGGGGGGGGGG',
          'VVXXXXXXXXXXXXXXXXXXXXXXXXXXXX'],
        ents: [
          { id: 'etrain', x: 3, y: 7, w: 10, h: 2, spr: 'minitrain', s: { dim: true, empty: true } },
          { id: 'esign', x: 14, y: 1, w: 2, spr: 'ekisign', text: '見月坂', on: S => S.narr('站名牌：「見月坂」。\n白底绿字。你每天早上都看着它等车。读一遍，移开眼睛，再读一遍——\n还是「見月坂」。一个笔画都没变。') },
          { id: 'eclock', x: 19, y: 1, spr: 'dclock', num: 7, s: { m: 8.4 }, on: S => S.narr('站台的钟：七点四十二分。\n这一次，它一动不动地、规规矩矩地，指着该指的地方。') },
          { x: 9, y: 1, spr: 'poster', col: '#a8c0b0', on: S => S.narr('「注意脚下　请勿奔跑」——你只看了一眼就跑了过去。') },
          { x: 24, y: 2, spr: 'vending', col: '#3a6a9a', on: S => S.narr('普通的自动贩卖机。罐装咖啡一百二十日元。\n灯是亮的。……真好。') },
          { id: 'exit', x: 29, y: 3, h: 2, spr: 'stairsup', solid: false, light: { r: 4.4, col: 'rgba(255,250,230,.35)' }, touch: goodEnd },
          { id: 'kobE', x: 1, y: 4, spr: '@kobA', solid: false, hidden: true },
          { id: 'kobF', x: 1, y: 5, spr: '@kobB', solid: false, hidden: true },
          { id: 'girlE', x: 27, y: 3, spr: '@paxD', solid: false, hidden: true, dir: 2 },
          { id: 'el1', x: 14, y: 3, light: { r: 3.4, col: 'rgba(220,240,230,.10)' } },
          { id: 'el2', x: 22, y: 3, light: { r: 3.4, col: 'rgba(220,240,230,.12)' } }
        ],
        async enter(S, first) {
          if (!first) return;
          S.f.ph = 'exec';
          await S.narr('车门开了。\n外面是一个站台——白底绿字的站名牌，黄色的盲道，一排熟悉的自动贩卖机。');
          await S.think('是見月坂。是我的车站。');
          await S.narr('可是站台的一半还泡在梦里：地面一块一块地塌进灰紫色的雾中。\n站台尽头，楼梯口透进来白白的、早晨的光。');
          S.sfx('giggle');
          await S.narr('身后的车厢里，传来咯咯的笑声。\n小小的脚步声，啪嗒，啪嗒，下了车。');
          S.sfx('thud'); S.shake(300, 1);
          await S.think('车尾那边的站台……在往下塌。\n别回头。');
          S.goal('跑！跑向站台尽头的出口');
          edgeReset(S);
          S.cp('n3e');
        }
      }
    }
  });

  /* ================= 站台 ================= */
  async function speakerOn(S) {
    S.bubble('spk', '…', 1400);
    if (S.f.n === 2) return S.narr('喇叭里传来很轻的笑声。\n……还有一点点口水的声音，像是有人贴着话筒在舔嘴唇。');
    await S.narr('站台的喇叭。铁网上锈迹斑斑。\n你凑过去听——里面只有沙沙的电流声。');
    return look(S);
  }
  async function signOn(S) {
    const e = S.ent('sign');
    if (S.f.n === 2 && S.f.ph === 'station') {
      if (!S.f.sg2) { S.f.sg2 = 1; return S.narr('站名牌上写着：「猿梦」。\n书上说：读一遍，移开眼睛，再读一遍。'); }
      if (S.f.ev2_sign) return S.narr(`站名牌上写着：「${e.text}」。\n你不想再看它了。`);
      e.text = '下一个'; S.sfx('whisper');
      await S.narr('你移开眼睛，数了三下，再看回去——');
      await S.narr('站名牌上写着：「下一个」。\n墨迹还是湿的，正顺着牌子往下淌。');
      await S.think('字变了。……真的字不会变。');
      return ev(S, 'sign');
    }
    await S.narr('站名牌上只有两个字：「猿梦」。\n左边写着上一站，右边写着下一站——两边都被涂成了黑色。');
    await S.think('……猿梦站？\n我从来没听说过这个车站。');
    if (S.f.n === 1 && !S.f.arrived) return trainArrive(S);
  }
  async function sclockOn(S) {
    const c = S.ent('sclock');
    if (S.f.n === 2 && S.f.ph === 'station') {
      if (!S.f.ck2) { S.f.ck2 = 1; return S.narr('四点四十四分。\n——好，记住了。移开眼睛，再看一次。'); }
      if (S.f.ev2_clock) return S.narr('指针还在倒着转，越转越快。');
      c.s.spin = true; S.sfx('tick');
      await S.narr('你再看过去的时候，指针在转。\n倒着转。时针和分针追着彼此，一圈，又一圈。');
      return ev(S, 'clock');
    }
    await S.narr('站台的钟停在四点四十四分。\n秒针在原地一下一下地抖，好像想往前走，又被什么东西按住了。');
    if (S.f.n === 1 && !S.f.arrived) return trainArrive(S);
  }
  async function pmirOn(S) {
    const m = S.ent('pmir');
    if (S.f.n === 2 && S.f.ph === 'station') {
      if (S.f.ev2_mir) return S.narr('凸面镜里，那个「你」还在冲你笑。');
      await S.narr('站台角落的凸面镜。镜子里映出整个站台，还有站在镜子前的你。\n你抬起右手。');
      m.face = true; S.sfx('sting'); S.shake(300, 1);
      await S.narr('镜子里的你，慢了半拍，才抬起手。\n然后它歪了歪头，咧开嘴笑了。……你没有笑。');
      m.face = undefined;
      return ev(S, 'mir');
    }
    await S.narr('站台角落的凸面镜，给司机看站台用的。\n镜子里的站台被拉得很长很长，长得看不见尽头。');
    return look(S);
  }
  async function trainArrive(S) {
    S.f.arrived = true;
    await S.wait(500);
    chime(S); await S.wait(800);
    await S.say('站内广播', '……电车，进站了。', { style: 'whisper' });
    S.sfx('bell'); await S.wait(400); S.sfx('bell');
    await S.narr('当、当、当——\n远处的黑暗里，响起了游乐园里那种小火车的铃声。');
    S.place('mtrain', -12, 6, 2); S.focus(10, 5);
    S.amb('bus');
    await S.walk('mtrain', 'rrrrrrrrrrrrrrrrrr', 7);
    S.sfx('brake'); S.shake(300, 1);
    S.focus(null);
    await S.narr('驶进站台的，是游乐园里那种小火车。\n车头被漆成一张猴子的脸，咧着嘴，红脸蛋，眼睛是两个黑洞。');
    await S.narr('车厢里坐着乘客。一个个直挺挺地坐着，面无表情，看着正前方。\n没有一个人看你。');
    await S.think('乘上去的话……会很恐怖。\n——可是站台上，没有别的路。');
    S.goal('上车');
  }
  async function boardOn(S) {
    if (S.f.n === 1 && S.f.arrived) {
      const r = await S.vote('要上车吗？', ['上车', '再等等']);
      if (!r.agree) {   // 一个想上车，一个想再等等：站台替你们做了决定
        S.sfx('switch'); S.dark(.9);
        await S.narr('你们俩还没商量好，站台上的荧光灯「啪」地灭了一盏。\n又一盏。\n黑暗从楼梯那边，一盏灯一盏灯地漫过来。');
        S.dark(null);
        await S.think('……没有别的路了。');
      } else if (r.v) return;
      S.sfx('step');
      return S.go('train', PS[0], PS[1], 2);
    }
    if (S.f.n === 2) {
      if ((S.f.evc || 0) < 2) return S.think('还不行。上车之前，至少要确认两件事——\n钟、字、镜子。');
      const r = await S.vote('上车吗？', ['上车', '再等等']);
      if (!r.agree) await S.narr('一个人的脚已经迈了出去，另一个人想拉住——\n车门「咔嚓」一声，在身后关上了。');
      else if (r.v) return;
      return S.go('train', PS[0], PS[1], 2);
    }
  }

  /* ================= 车厢 ================= */
  function trainSetup(S) {
    S.f.moving = true; S.f.ei = 0;
    for (const id of ['tw3', 'tw6', 'tw18', 'tw21', 'tw24', 'wme']) S.ent(id).s.mov = true;
  }
  async function night1Board(S) {
    trainSetup(S); S.f.ph = 'ride';
    S.hide('ribbon');
    await S.narr('你在空着的座位上坐下。\n你回头数了数——从后面数，第三排。');
    S.sfx('bell'); await S.wait(300);
    await S.narr('车门自己关上了。小火车「吱呀」一声，开动了。\n窗外是隧道。隧道的墙上，一盏一盏昏黄的灯往后掠去。');
    await S.wait(500);
    chime(S); await S.wait(700);
    await S.say('车内广播', ['各位乘客，欢迎乘坐。', '下一个是——「活造り」。'], { style: 'whisper' });
    await S.think('活造り？……那不是把活鱼片成生鱼片的意思吗？');
    S.f.kx = 4;
    await execScene(S, { id: 'paxA', x: 4, y: 4, w: '活造り', k: 'ike' });
    S.f.kx = 4;
    await S.think(['……这是什么？', '这是什么？！']);
    S.face('paxD', 'pl'); S.bubble('paxD', '…', 1200);
    await S.narr('前面那个穿水手服的女孩，轻轻地，回过头看了你一眼。\n只有她的眼睛是活的。');
    S.goal(evGoal(S));
    S.cp('n1');
    startExec(S);
  }
  async function night2Board(S) {
    trainSetup(S); S.f.ph = 'exec';
    for (const id of ['paxA', 'paxB', 'paxD']) S.hide(id);
    S.place('paxC', 7, 2, 2); S.show('ribbon');
    S.f.kx = 5; resetKob(S);
    await S.narr('你坐回了那个座位。从后面数，第三排。\n——可是，你身后已经坐着人了。是那个穿旧大衣的老人。');
    await S.narr('最后两排是空的。\n两个小人坐在空座位上，晃着脚，冲你笑。');
    chime(S); await S.wait(700);
    await S.say('车内广播', '这次……是接着上次的哦。', { style: 'whisper' });
    S.goal(evGoal(S));
    S.cp('n2');
    startExec(S);
  }
  async function wmeOn(S) {
    if (S.f.n === 1 && S.f.ph === 'exec') {
      if (S.f.ev1_win) return S.narr('玻璃里那个没有脸的你，还在看着你。');
      await S.narr('漆黑的车窗变成了镜子，映出车厢里的样子。\n一排一排面无表情的乘客。还有你——');
      await S.scare('face', { face: 'noface', sfx: 'sting', dur: 1.0, shake: 1 });
      await S.narr('玻璃里的「你」，没有脸。\n头发下面，是一片光滑的、肉色的空白。');
      await S.think('不对。这不对。……人不会没有脸。');
      return ev(S, 'win');
    }
    await S.narr('车窗玻璃里映着你的脸。苍白，憔悴，眼睛下面两团青黑。\n还好，是你的脸。');
  }
  async function tadOn(S) {
    const e = S.ent('tad');
    if (S.f.n === 1 && S.f.ph === 'exec') {
      if (!S.f.ad1) { S.f.ad1 = 1; return S.narr('车厢广告：「猿梦乐园　欢迎全家光临」。\n……读一遍。移开眼睛。'); }
      if (S.f.ev1_ad) return S.narr('广告上写着：「下一个是你」。\n你不想再看了。');
      e.red = true; S.sfx('whisper');
      await S.narr('你再看回去。\n广告上的字变了：「下一个是你」。\n画上那只猴子的眼睛，变成了红色。');
      return ev(S, 'ad');
    }
    await S.narr('车厢广告：「猿梦乐园　欢迎全家光临」。\n画上的猴子在笑。它的牙齿画得太仔细了。');
  }
  async function tclockOn(S) {
    const c = S.ent('tclock');
    if (S.f.n === 1 && S.f.ph === 'exec') {
      if (!S.f.tk1) { S.f.tk1 = 1; return S.narr('车厢里挂着一个小钟。四点四十四分。\n……刚才在站台上，好像也是四点四十四分。'); }
      if (S.f.ev1_clock) return S.narr('指针乱转着，停不下来。');
      c.s.spin = true; S.sfx('tick');
      await S.narr('你再看过去——指针在乱转。\n一会儿顺着走，一会儿倒着走，像一只被困在玻璃底下的虫子。');
      return ev(S, 'clock');
    }
    await S.narr('车厢里的小钟：四点四十四分。\n好像从来没有走过。');
  }
  async function girlOn(S) {
    S.face('paxD', 'pl');
    if (S.f.n !== 1) return;
    if (S.once('girl1')) {
      await S.say('穿水手服的女孩', ['（她压低了声音，嘴唇几乎没动）……你也是，在做梦的人吧？', '别学他们一直看着前面。他们已经忘了自己在做梦。'], { style: 'whisper' });
      await S.say('穿水手服的女孩', ['想醒的话，就要让自己相信「这是梦」。', '光是想没有用。要找到证据——', '看钟。看字。看车窗里的你自己。都要看两遍——梦经不起看第二遍。'], { style: 'whisper' });
      await S.say('穿水手服的女孩', '我已经醒过两次了。……可是这一次，我好像，醒不过来了。', { style: 'whisper' });
      return;
    }
    await S.say('穿水手服的女孩', ['看钟、看字、看车窗。看两遍。', '快一点。它们不会等你的。', '……要是能让车停下来就好了。它从来不停。'][(S.f._gi = ((S.f._gi ?? -1) + 1) % 3)], { style: 'whisper' });
  }
  async function cdoorOn(S) {
    if (S.f.n === 3) { S.sfx('open'); return S.go('cab', 1, 2, 0); }
    S.sfx('locked');
    await S.narr('通往车头的门，锁着。\n门上的小窗里黑漆漆的，只有控制台上一点红灯，一闪，一闪。');
  }
  async function seatOn(S) {
    if (S.f.canWake) return wakeUp(S);
    if (S.f.n === 2 && S.f.ph === 'exec' && !S.f.ev2_hand) {
      await S.think('书上说……还有一个：数手指。');
      await S.narr('你把手举到眼前。一、二、三、四、五——');
      S.sfx('heart'); await S.wait(400);
      await S.narr('六。\n小指旁边，还有一根细细的、灰色的手指。它自己弯了一下。');
      return ev(S, 'hand');
    }
    if (S.f.n === 3 && S.f.ph === 'exec') {
      const vr = await S.vote('（你坐在座位上，手抖得厉害。）', ['这是梦——醒过来！', '闭上眼睛……等它过去', '（站起来）']);
      let r = vr.v;
      if (!vr.agree && (vr.h === 1 || vr.g === 1)) {   // 只有一个人想闭眼：另一个人不让
        await S.narr('你刚要闭上眼睛，脑子里另一个声音喊了起来：\n「别闭眼！闭上眼睛，就再也睁不开了！」');
        r = 2;
      } else if (!vr.agree) await S.narr('你们俩想的不一样。……可是，时间不等人。');
      if (r === 0) { S.sfx('heart'); await S.say('', '这是梦。这是梦。这是梦——', { style: 'big' }); await S.narr('什么也没发生。\n广播里传来咯咯的笑声：「没——有——用——哦。」'); S.goal('它们来了——想办法让车停下来'); return; }
      if (r === 1) return badEnd(S, 'eyes');
      return;
    }
    await S.narr('硬邦邦的座位，红色的绒面磨得发亮。\n从后面数，第三排。……为什么总是第三排？');
  }
  async function ribbonOn(S) {
    await S.narr('那个女孩的座位上，只剩下一条红色的水手服领结。\n……她没能醒过来。');
    if (S.once('ribbonMsg')) {
      await S.narr('领结背面，有人用圆珠笔写了一行小字，字迹抖得厉害：');
      await S.say('', '「它没有站。所以它不停。\n　对着广播，说出你自己的车站。」', { style: 'whisper' });
      S.f.ribbon = true;
    }
    if (S.f.n === 3 && !S.has('ribbon')) {   // 第三夜：可以把领结带走（隐藏结局）
      await S.narr('你把领结解下来，叠好，攥在手心里。');
      await S.think('……要是能带她一起下车就好了。');
      S.give('ribbon'); S.hide('ribbon');
    }
  }
  /* ================= 白天的公寓 ================= */
  function dayGoal(S) {
    if (S.f.day === 2) S.goal(!S.f.posted ? '把那个梦写下来（书桌上的电脑）' : !S.f.call2 ? '电话在响（电脑旁边）' : !S.f.book ? '书架上好像有本讲梦的书' : '天黑了……该睡了（被褥）');
    else S.goal(!S.f.replies ? '看看帖子有没有人回复（电脑）' : !S.f.call3 ? '电话在响（电脑旁边）' : !S.has('pass') ? '我每天去的那个车站……（包里的定期券）' : '准备好了。睡吧（被褥）');
  }
  async function pcOn(S) {
    S.ent('pc').power = true; S.sfx('switch');
    if (S.f.day === 2 && !S.f.posted) {
      await S.narr('拨号上网的声音「哔——嘎——」地响了半天。\n你打开那个常去的匿名论坛，点进「超常现象」板。');
      await S.think('写下来吧。写下来，说不定就不怕了。');
      S.sfx('tick'); await S.wait(300); S.sfx('tick'); await S.wait(300); S.sfx('tick');
      await S.note('post');
      S.f.posted = true;
      await S.narr('你按下了「发送」。\n页面刷新的那一瞬间，屏幕暗了一下——好像有一张脸，在黑色的屏幕上一闪而过。');
      S.ent('pc').power = false; return dayGoal(S);
    }
    if (S.f.day === 3 && !S.f.replies) {
      await S.narr('你打开昨天的帖子。\n回复已经有三十多条了。');
      await S.note('reply');
      S.f.replies = true;
      await S.think(['「它没有自己的站，它只能停在你给它的站。」', '……报一个真实存在的、我每天都去的车站。', '我每天都去的车站——']);
      S.ent('pc').power = false; return dayGoal(S);
    }
    if (S.f.replies) await S.note('reply');
    else if (S.f.posted) await S.note('post');
    S.ent('pc').power = false;
  }
  async function shelfOn(S) {
    if (S.f.day === 2 || S.f.day === 3) {
      if (S.once('bookFind')) await S.narr('书架最底层，夹着一本你大一时候在旧书店买的书，一直没看完：\n《清醒梦入门——在梦中醒来的技术》。');
      await S.note('book');
      if (!S.f.book) { S.f.book = true; await S.think('钟、字、镜子。看两遍。\n……那个女孩说的，和书上一模一样。'); }
      return dayGoal(S);
    }
    await S.narr('书架上塞满了教科书和漫画。');
  }
  async function phoneOn(S) {
    S.sfx('phone'); await S.wait(500);
    if (S.f.day === 2 && !S.f.call2) {
      S.f.call2 = true;
      await S.say('美穗（电话）', ['喂？真弓？你今天怎么没来上课？统计学小测欸！', '……做噩梦？什么梦能把你吓得旷课啊。']);
      await S.say('真弓', '……一辆小火车。车头是猴子。广播一个一个地报……');
      await S.say('美穗（电话）', ['等等。猴子的电车？', '我好像在网上看过类似的故事欸。说是做那种梦的人，在轮到自己之前醒过来就没事——', '……不过后面还有一句。说是同一个梦，会接着做。'], {});
      await S.say('美穗（电话）', '哎呀，你别想太多啦！晚上早点睡，我明天去找你。');
      return dayGoal(S);
    }
    if (S.f.day === 3 && !S.f.call3) {
      S.f.call3 = true;
      await S.say('美穗（电话）', ['……真弓。', '我昨天晚上，看了你发的那个帖子。', '然后，我做了个梦。']);
      await S.narr('电话那头安静了很久。');
      await S.say('美穗（电话）', ['我站在一个很暗的车站里。', '远处有铃声，当、当、当……我在车来之前就吓醒了。', '……真弓，帖子下面有人说，这种梦会传染。是真的吗？']);
      await S.say('真弓', '……今天晚上，我会把它结束掉。');
      await S.say('美穗（电话）', '结束？怎么结束？真弓？真弓——');
      await S.narr('电话断了。听筒里的忙音，听起来像远处的铃声。');
      return dayGoal(S);
    }
    await S.narr('你拿起听筒，又放下了。\n听筒里的忙音，听起来像远处的铃声。');
  }
  async function diaryOn(S) {
    if (!S.has('diary')) S.give('diary');
    await S.narr(S.f.day === 3 ? '梦日记。你把第二个梦也写了进去：\n「从后面数第三排。绞肉。下次是最后一次。」\n最后一行的字，你不记得是自己写的：「它在等你说话」。' : '一本新买的笔记本。你决定从今天开始记梦日记。\n第一页：「车头是猴子。从后面数第三排。下一个是活造り。」');
  }
  async function bagOn(S) {
    if (S.f.day === 3 && !S.has('pass')) {
      S.give('pass');
      await S.narr('你从包里翻出电车的定期券。\n「見月坂 ⇄ 大学前」。\n每天早上七点四十二分，你都站在見月坂站二号站台，等同一班车。');
      await S.think('見月坂。\n那是我的车站。真的车站。');
      return dayGoal(S);
    }
    await S.narr('大学用的帆布包。里面有课本、笔袋，还有一包没拆的润喉糖。');
  }
  async function bedOn(S) {
    if (S.f.day === 2) {
      if (!(S.f.posted && S.f.book)) return S.think('现在睡不着。\n……也不想睡。');
      const r = await S.ask('天已经黑了。要睡了吗？', ['睡吧', '再等等']); if (r) return;
      await S.fade(1, 1000);
      await S.card('第二夜', '', '你以为自己会失眠。\n可是一闭上眼睛，耳边就响起了那种嗡嗡声。');
      S.f.n = 2; S.f.ph = 'station'; S.f.evc = 0; S.f.ei = 0;
      return S.go('station', 10, 3, 3);
    }
    if (S.f.day === 3) {
      if (!(S.f.replies && S.has('pass'))) return S.think('还没准备好。\n今晚是最后一次——我不能就这样睡过去。');
      const r = await S.ask('最后一夜。要睡了吗？', ['睡吧', '再等等']); if (r) return;
      await S.fade(1, 1000);
      await S.card('第三夜', '', '你把定期券攥在手心里，闭上了眼睛。\n\n这一次，没有车站。\n你一睁眼，就已经坐在车上了。');
      S.f.n = 3; S.f.ph = 'ride'; S.f.evc = 0;
      return S.go('train', PS[0], PS[1], 2);
    }
    await S.narr('被褥还是乱的。');
  }

  /* ================= 第三夜 ================= */
  async function night3Board(S) {
    trainSetup(S);
    for (const id of PAX) S.hide(id);
    S.show('ribbon');
    await S.narr('车厢里一个乘客都没有了。\n只有你。从后面数，第三排。');
    S.f.kx = 2; resetKob(S);
    await S.narr('车尾那扇门开着。\n两个小人站在门口，手牵着手，歪着头看你。');
    chime(S); await S.wait(700);
    await S.say('车内广播', ['欢迎回来。', '说好了的，这是最后一次。', '下一个是——你。'], { style: 'whisper' });
    S.sfx('giggle');
    await S.think(['……前面。车头那扇门。', '今天，它开着。']);
    S.ent('cdoor').open = true;
    night3Seat(S);
    S.cp('n3');
  }
  function night3Seat(S) {
    resetKob(S);
    S.f.ph = 'exec'; S.f.ei = 0; S.f._kn = null;
    S.goal('它们来了——去车头的驾驶室');
    S.timer(T3, '它们来了', yourTurn);
  }
  async function cabwinOn(S) {
    if (S.f.stopped) return S.narr('隧道尽头，有一点白色的光。');
    await S.narr('挡风玻璃外，是没有尽头的隧道。\n铁轨在车灯里一直延伸下去，延伸到一个圆圈里——\n这条隧道是环形的。这辆车，一直在原地绕圈。');
  }
  async function micOn(S) {
    if (S.f.n !== 3) return S.narr('控制台上的广播话筒。');
    if (S.once('micFirst')) {
      await S.narr('控制台上有一个老式的广播话筒。红灯一闪一闪的。\n话筒旁边贴着一张纸条：「报站请按键输入站名（三字）」。');
      if (!S.f.ribbon && !S.f.replies) await S.think('……报站。报哪一站？');
      else await S.think('「它没有站。所以它不停。对着广播，说出你自己的车站。」');
    }
    const v = await S.keypad('报站：下一站是——（三个字 · 数字键 1–9 也能按）', KEYS, 3, { alias: KALIAS });
    if (v == null) return;
    if (v === '見月坂') return stopTrain(S);
    if (v.startsWith('終点')) {
      await S.narr(`你对着话筒说：「下一站——${v}。」`);
      S.sfx('laugh');
      await S.say('车内广播', ['好——的。', '下一站，终点。', '感谢您一直以来的乘坐。'], { style: 'whisper' });
      return badEnd(S, 'terminal');
    }
    S.sfx('bad'); S.shake(300, 1);
    await S.narr(`你对着话筒说：「下一站——${v}。」`);
    await S.say('车内广播', ['没——有——这——站——哦。', '……咯咯咯。'], { style: 'whisper' });
    if (W.timer) W.timer.left = Math.max(5, W.timer.left - 10);
    const m = S.f.mw = (S.f.mw || 0) + 1;   // 报错的次数：提示一次比一次具体
    if (m === 1) await S.think('不是随便哪个站都行。帖子里说的是——\n「报一个真实存在的、你每天都去的车站」。');
    else if (m === 2) await S.think('我每天都去的车站……\n包里那张定期券上，印着站名。（打开随身物品看看）');
    else await S.think('見月坂。「見」「月」「坂」。\n每天早上七点四十二分，我都站在那里等车。');
  }
  async function stopTrain(S) {
    S.clearTimer(); S.f.ph = 'stop';
    await S.narr('你按住话筒。你的声音从车厢里每一个喇叭里传了出来——');
    chime(S);
    await S.say('真弓（广播）', ['各位乘客。', '下一站——見月坂。', '下一站，見月坂。在見月坂站，停车。'], { style: 'big' });
    S.sfx('scream'); S.shake(900, 3); S.ent('cback').face = undefined;
    await S.narr('车厢后面传来尖叫声。不是人的尖叫——是小人们的。\n它们在喊：不对，不对，不对，没有这一站，没有这一站——');
    S.sfx('brake'); S.shake(1200, 2);
    await S.narr('刹车的声音，尖得像指甲刮过黑板。\n小火车猛地一顿。');
    S.f.stopped = true; S.f.moving = false;
    await S.narr('挡风玻璃外面，隧道的尽头，出现了一点白色的光。\n光里有一块站名牌：白底，绿字。');
    await S.go('edge', 13, 5, 2, { ms: 700 });
  }

  /* ================= 梦的边缘：追逐 + 身后的站台一列一列塌进雾里 ================= */
  const EDGE_KOB = [[4, 6], [3, 6]];   // 小人从车尾的门下车
  const WAVE_SPD = 1.6;                // 塌陷速度（列/秒）
  function edgeReset(S) {
    S.hide('kobE'); S.hide('kobF'); S.hide('girlE');
    S.f.ph = 'exec'; S.f._ke = 1.5; S.f._wv = 2.2; S.f._wx = 2;
  }
  function edgeTick(S, dt) {
    if (S.f._ke != null) {
      S.f._ke -= dt;
      if (S.f._ke <= 0) {
        S.f._ke = null;
        S.place('kobE', EDGE_KOB[0][0], EDGE_KOB[0][1], 2); S.place('kobF', EDGE_KOB[1][0], EDGE_KOB[1][1], 2);
        S.sfx('giggle'); S.bubble('kobE', '!', 1000);
        S.chase('kobE', { spd: 3.1, catch: caughtN3 }); S.chase('kobF', { spd: 2.9, wait: .5, catch: caughtN3 });
      }
    }
    S.f._wv -= dt;
    if (S.f._wv <= 0 && S.f._wx < 28) {
      S.f._wv = 1 / WAVE_SPD;
      const x = S.f._wx++;
      for (let y = 2; y <= 6; y++) S.tile(x, y, 'V');
      if (x % 3 === 0) { S.sfx('thud'); S.shake(150, 1); }
      if (S.pl.x <= x) { S.f.ph = 'fall'; S.after(0, fallN3); }
    }
  }
  async function fallN3(S) {
    S.stop('kobE'); S.stop('kobF');
    S.sfx('glass'); S.shake(700, 3);
    await S.scare('glitch', { sfx: 'thud', dur: .7 });
    await S.die('脚下的站台，忽然变成了软的。\n你往下沉，沉进灰紫色的雾里。\n雾的下面，远远地，传来小火车「当、当、当」的铃声。', '掉回了梦里');
  }
  async function caughtN3(S) {
    S.f.ph = 'caught';
    await S.scare('face', { spr: '@kobA' });
    await S.die('一只小小的、冰凉的手，抓住了你的脚踝。\n「下一个是——」\n你没有听见后面的字。', '轮到你了');
  }
  async function goodEnd(S) {
    if (S.f.ph !== 'exec') return;
    S.f.ph = 'end';
    S.stop('kobE'); S.stop('kobF');
    S.sfx('scream');
    await S.alpha('kobE', 0, 400); S.hide('kobF');
    S.fx('flash'); S.sfx('chime');
    await S.narr('你冲上楼梯，冲进白色的光里。\n身后，小人们停在了光的边缘，不甘心地尖叫着。');
    chime(S, true); await S.wait(700);
    await S.say('车内广播', '……下次……', { style: 'whisper' });
    await S.narr('喇叭「啪」地一声，断了。');
    const girl = S.has('ribbon');
    if (girl) {   // 隐藏结局：带着她的领结下车
      const g = S.ent('girlE'); g.alpha = 0; S.place('girlE', 27, S.pl.y === 3 ? 4 : 3, 2);
      await S.alpha('girlE', 1, 900);
      S.face('pl', 'girlE');
      await S.narr('楼梯口的光里，站着一个穿水手服的女孩。\n她的领口，空荡荡的。');
      await S.say('穿水手服的女孩', ['……我听见了。', '在车厢最后面的黑暗里，我听见有人对着广播说「見月坂」。', '那不是我的站。……可它是一个真的站。'], { style: 'whisper' });
      S.take('ribbon');
      await S.narr('你把攥了一路的红领结递给她。\n她低头看了很久，把它系回了自己的领口。');
      await S.say('穿水手服的女孩', '我也可以……在这里下车吗？', { style: 'whisper' });
      await S.narr('你点了点头。\n你们一起，走进了早晨的光里。');
    }
    await S.fade(1, 1200);
    S.amb('room');
    await S.card('早上　七点四十二分', '2000年5月', '闹钟在响。\n窗外，電车道口「当当当」地响着。\n\n你躺在被窝里，手心里攥着那张定期券，攥得都出了汗。');
    if (girl) {
      await S.card('', '', '那天你去上了课。\n在見月坂站的二号站台上，你等来了一辆五节车厢的普通电车。\n车头上，没有脸。\n\n车门打开的时候，你看见对面站台上，站着一个穿水手服的女孩。\n红领结系得端端正正。\n她冲你点了点头，上了另一个方向的车。');
      return S.end({ id: 'girl', title: '第三夜　完 · 两个人的站台', text: '帖子的最后一条回复，是你自己写的：\n\n「我没有逃。我让它停了。\n　车上还有别人。如果你也梦见了那辆车——\n　记住你每天等车的那个站，替他们也报一次。」\n\n后来，那个帖子底下再也没有人说自己梦见过猴子的小火车。\n……只是有时候，站台上的广播响起来之前，你还是会下意识地，看一眼钟。' });
    }
    await S.card('', '', '那天你去上了课。\n在見月坂站的二号站台上，你等来了一辆五节车厢的普通电车。\n车头上，没有脸。\n\n美穗说，她后来再也没有梦见过那个车站。');
    await S.end({ id: 'good', title: '第三夜　完', text: '帖子的最后一条回复，是你自己写的：\n\n「我没有逃。我让它停了。\n　如果你也梦见了那辆车——\n　记住你每天等车的那个站。」\n\n……只是有时候，站台上的广播响起来之前，\n你还是会下意识地，看一眼钟。\n\n（那个穿水手服的女孩，后来怎么样了呢？）' });
  }
})();
