/* ================= 第二十六夜 · 水妖奈克 ================= */
(() => {
  /* ---------------- 常量与小工具 ---------------- */
  /* 数字谱：1 最低，7 最高（D 大调，从 D4 起）；8 以上是高八度 */
  const FQ = [0, 293.66, 329.63, 369.99, 392.00, 440.00, 493.88, 554.37];
  const fq = n => FQ[((n - 1) % 7) + 1] * Math.pow(2, Math.floor((n - 1) / 7));
  const ROUND = {
    1: { name: '《摇篮曲》', q: [5, 3, 2, 1], a: '3567', human: '1235', desc: '四个音，一个比一个低' },
    2: { name: '《奈克调》', q: [7, 5, 6, 3], a: '1325', human: '', desc: '头一个音高得刺耳，后三个落下去，又往上挑了一下' }
  };
  const NACK_FULL = [[7, 1], [5, .5], [6, .5], [3, 1], [1, .5], [3, .5], [2, .5], [5, .5], [6, .5], [7, .5], [8, 1], [7, .5], [5, .5], [6, .5], [4, .5], [3, 1.5]];
  const POLSKA = [5, 6, 7, 8, 7, 6, 5, 3, 4, 5, 6, 5, 3, 4, 5, 6, 5, 4, 3, 1, 2, 3, 2, 1];
  const ELEVEN = [8, 7, 8, 9, 10, 9, 8, 7, 6, 7, 8, 5, 8, 7, 8, 9, 10, 12, 11, 10, 9, 8, 7, 8];
  /* 溪马绕潭的环路（浅水一圈），顺时针：上边 → 右边 → 下边 → 左边 */
  const LOOP = 36, H_WALK = 3.0, H_SHY = 5.0, H_BOLT = 8.0, T_FULL = 36, T_MIN = 30;
  function loopPos(s) {
    s = ((s % LOOP) + LOOP) % LOOP;
    if (s < 11) return { x: 9 + s, y: 3, fx: 1, fy: 0 };
    if (s < 18) return { x: 20, y: 3 + (s - 11), fx: 0, fy: 1 };
    if (s < 29) return { x: 20 - (s - 18), y: 10, fx: -1, fy: 0 };
    return { x: 9, y: 10 - (s - 29), fx: 0, fy: -1 };
  }
  let HS = { on: false, s: 12, dir: 1, pause: 0, bolt: 0, shy: 0, hoof: 0, mus: 0, mi: 0 };
  let lastLeft = null, died = false, bgT = 4, kT = 0, nT = 0;
  if (typeof QS !== 'undefined' && QS.get('debug') === '1') window.__nokken = { get HS() { return HS; }, loopPos };

  const N = (S, t, o) => S.say('奈克', t, o);
  const ME = (S, t, o) => S.say('奥洛夫', t, o);

  /* 拉琴：sawtooth 主音 + 泛音 + 弓毛咬弦的一下（双方都听得到） */
  function fid(S, seq, o = {}) {
    const beat = o.beat || .34, vol = o.vol || .05, lp = o.lp || 2600; let t = o.delay || 0;
    for (const it of seq) {
      const [n, b] = Array.isArray(it) ? it : [it, 1];
      const d = b * beat;
      if (n) {
        const f = fq(n) * (o.oct || 1);
        S.tone(o.type || 'sawtooth', f, f * (o.sour ? .97 : 1.004), d * .95, vol, t, lp);
        S.tone('triangle', f * 2, f * 2.006, d * .85, vol * .3, t + .01, lp + 800);
        S.tone('square', f * 3, f * 3, .035, vol * .25, t, 3800);
      }
      t += d;
    }
    return t;
  }
  /* 远处的琴声：低通、轻，越靠近溪越响 */
  function fidFar(S, k) { fid(S, [[7, 1], [5, .5], [6, .5], [3, 1.5]], { vol: .012 + .03 * k, lp: 700 + 900 * k, beat: .38 }); }
  function whinny(S, v = 1, d = 0) {
    S.tone('sawtooth', 620, 1250, .22, .04 * v, d, 2400);
    S.tone('sawtooth', 1250, 520, .7, .035 * v, d + .2, 2200);
    S.tone('square', 900, 700, .5, .012 * v, d + .25, 3000);
  }
  function pluck(S, f, d = 0, v = .05) { S.tone('triangle', f, f * .998, .9, v, d, 3000); S.tone('sine', f * 2, f * 2, .5, v * .3, d, 4000); }
  function splash(S, v = 1) { S.sfx('splash'); S.tone('sine', 900, 260, .18, .02 * v, 0, 3000); }
  const sleep = (S, ms) => S.wait(ms);
  /* 卡琳脚下的水位：0 没过脚踝，1 没过膝盖，2 快到腰（答错一次涨一格） */
  function kwLevel(S, lv) { const k = S.ent('karin'), w = S.ent('kwater'); k.oy = lv; w.s.d = lv; return lv; }

  /* ---------------- 人物 ---------------- */
  const PEOPLE = {
    me: { key: 'nk-me', skin: '#f2d2b4', hair: '#d8bc6a', hs: 'short', top: '#e6dcc6', top2: '#cfc2a4', bottom: '#4a3a2a', shoes: '#2a1e14',
      extra(g, d, fr, G, R) { if (d === 0) { R(4, G.tT + 1, 2, G.tB - G.tT, '#3a4658'); R(10, G.tT + 1, 2, G.tB - G.tT, '#3a4658'); R(7, G.tT, 2, 1, '#c8ccd4'); } else if (d === 1) R(5, G.tT + 1, 4, G.tB - G.tT, '#3a4658'); else R(4, G.tT, 8, G.tB - G.tT + 1, '#3a4658'); } },
    mor: { key: 'nk-mor', skin: '#ecc8a8', hair: '#cfcfc8', hs: 'bun', top: '#2e2a3a', top2: '#e8e2d4', bottom: '#2e2a3a', dress: true, apron: '#c8b8a0', shoes: '#1a1410', hat: 'scarf', hatC: '#7a2a2a' },
    karin: { key: 'nk-kar', child: true, skin: '#f4d8bc', hair: '#e8d080', hs: 'twin', top: '#ece8e0', top2: '#d8d2c8', bottom: '#ece8e0', dress: true, shoes: '#f0d0b4', eye: '#3a4a6a' },
    karinR: { key: 'nk-karR', child: true, skin: '#f4d8bc', hair: '#e8d080', hs: 'twin', top: '#ece8e0', top2: '#d8d2c8', bottom: '#ece8e0', dress: true, shoes: '#f0d0b4', eye: '#3a4a6a',
      extra(g, d, fr, G, R) { if (d !== 3) { R(1, G.hT + 3, 2, 1, '#d02a2a'); R(13, G.hT + 3, 2, 1, '#d02a2a'); } } },
    /* 奈克：苍白发青的年轻人，湿长发缠着水草，光着上身，下半截泡在水里；琴夹在下巴底下 */
    nack: { key: 'nk-nack', skin: '#cfdcd6', hair: '#14201e', hs: 'long', top: '#cfdcd6', top2: '#b8c8c0', bottom: '#1a2a28', ghost: true, eye: '#a8ffd8',
      extra(g, d, fr, G, R) {
        R(3, G.hT + 6, 1, 4, '#2e5a3e'); R(12, G.hT + 5, 1, 5, '#2e5a3e'); R(5, G.hT - 1, 2, 1, '#2e5a3e');
        if (d === 0) {
          R(6, G.tT + 2, 1, 3, '#b0c0b8'); R(9, G.tT + 2, 1, 3, '#b0c0b8');
          R(0, G.tT, 5, 6, '#6a2e14'); R(1, G.tT + 1, 3, 4, '#8a4420'); R(2, G.hT + 5, 2, 4, '#1e120a'); R(2, G.tT + 2, 1, 2, '#1e120a');
          R(3, G.tT + 3, 12, 1, '#d8ccaa'); R(14, G.tT + 2, 1, 3, '#5a3a20');
        } else if (d === 1) { R(1, G.tT, 6, 5, '#6a2e14'); R(2, G.tT + 1, 4, 3, '#8a4420'); R(0, G.tT + 2, 14, 1, '#d8ccaa'); }
      } }
  };

  /* ---------------- 惊吓大头像（32×32） ---------------- */
  const FACES = {
    nack(R, a, t) {   // 黑水里浮上来的一张脸：湿发贴脸、水草、发青的皮肤、两只没有眼白的大眼睛，嘴越咧越开
      const H = '#0a1412', HD = '#16261f', SK = '#bccdc6', SK2 = '#8fa59c', SK3 = '#5d736a', WE = '#2e5a3e';
      R(0, 22, 32, 10, '#06100e'); for (let i = 0; i < 6; i++) R(i * 6 + ((t * 8) | 0) % 3, 24 + (i % 2) * 3, 4, 1, '#3a5a5a');
      R(5, 1, 22, 26, HD); R(3, 6, 26, 22, HD); R(8, 0, 16, 3, H);
      R(10, 4, 12, 3, SK); R(8, 7, 16, 14, SK); R(9, 21, 14, 3, SK); R(11, 24, 10, 2, SK);
      R(19, 7, 5, 14, SK2); R(17, 21, 5, 3, SK2);
      R(7, 3, 3, 22, H); R(22, 3, 3, 22, H); R(11, 3, 2, 8, H); R(15, 3, 2, 5, H); R(19, 3, 2, 9, H);
      R(6, 8, 1, 14, WE); R(25, 6, 1, 17, WE); R(13, 5, 1, 4, WE); R(24, 20, 2, 6, WE);
      const e = 3 + Math.round(a * 1.5);
      R(10, 11, 5, e, '#030806'); R(18, 11, 5, e, '#030806');
      if (Math.sin(t * 5) < .9) { R(11, 12, 2, 1, '#a8ffd8'); R(19, 12, 2, 1, '#a8ffd8'); }
      R(15, 15, 2, 3, SK3); R(14, 18, 1, 1, SK3); R(17, 18, 1, 1, SK3);
      const w = 6 + Math.round(Math.min(1, a * 1.3) * 4), o = 1 + Math.round(Math.min(1, a * 1.3) * 3);
      R(16 - w / 2, 20, w, o, '#0a0a0a'); R(16 - w / 2, 20, 1, 1, SK3); R(15 + w / 2, 20, 1, 1, SK3);
      for (let i = 0; i < 4; i++) R(16 - w / 2 + 1 + i * 2, 20, 1, 1, '#c8d4cc');
      for (const x of [9, 14, 21]) R(x, 24 + ((t * 6 + x) % 4), 1, 2, '#9ab8c8');   // 往下滴的水
    },
    horse(R, a, t) {   // 白马正脸：又长又窄的脸、额前湿鬃毛缠着水草、两侧一对又黑又亮的眼睛、张开的鼻孔，最后龇出牙
      const Wh = '#e4e8ea', W2 = '#b8c2c8', W3 = '#8a969e', MA = '#24382e';
      R(0, 0, 32, 32, '#070b0c');
      R(9, 0, 3, 4, W2); R(20, 0, 3, 4, W2); R(10, 1, 1, 2, '#4a3a3a'); R(21, 1, 1, 2, '#4a3a3a');
      R(8, 3, 16, 9, Wh); R(7, 6, 18, 5, Wh); R(9, 12, 14, 8, Wh); R(10, 20, 12, 6, Wh); R(9, 26, 14, 6, W2);
      R(20, 4, 4, 18, W2); R(19, 22, 3, 4, W3);
      R(11, 2, 10, 4, MA); R(13, 5, 2, 6, MA); R(17, 5, 2, 4, MA); R(10, 3, 2, 7, MA);
      for (const [x, l] of [[5, 22], [26, 24], [3, 14], [28, 12], [6, 8]]) R(x, 3, 1, l, MA);
      const e = 2 + Math.round(a * 2);
      R(7, 9, 3, e, '#020202'); R(22, 9, 3, e, '#020202'); R(8, 9, 1, 1, '#ffffff'); R(23, 9, 1, 1, '#ffffff');
      R(15, 12, 2, 10, W2);
      const n = 2 + Math.round(a * 2);
      R(11, 27, 3, n, '#2a1a1a'); R(18, 27, 3, n, '#2a1a1a');
      if (a > .5) { R(12, 30, 8, 2, '#f4f0e0'); for (let i = 0; i < 4; i++) R(12 + i * 2, 31, 1, 1, '#a8a090'); }
      for (const x of [10, 16, 22]) R(x, 18 + ((t * 7 + x) % 8), 1, 2, '#9ab8c8');
    }
  };

  /* ---------------- 物品 ---------------- */
  const ITEMS = {
    needle: { name: '钢针', desc: '外婆别在你衣领上的一根钢针，针尖朝外。\n「奈克，奈克，偷针贼——你在水里，我在岸上。」' },
    fiddle: { name: '外公的琴', desc: '外公的提琴。琴身上的漆被下巴磨掉了一块。' },
    brandyH: { name: '半瓶白兰地', desc: '外公喝剩的半瓶白兰地，瓶口的软木塞上有牙印。' },
    brandyF: { name: '一整瓶白兰地', desc: '地窖土豆底下藏的那瓶，封口的蜡还没破。外公说过，留着嫁闺女用。' },
    string: { name: 'E弦', desc: '外公的备用琴弦，用油纸包着。' },
    ribbon: { name: '红头绳', desc: '卡琳的红头绳，挂在篱笆上，湿漉漉的。她每天早上都要外婆给她扎。' }
  };

  /* ---------------- 笔记 ---------------- */
  const NOTES = {
    tunes: { title: '外公的琴谱', text: '（牛皮纸封面，一行一行的数字。外公说过：1 最低，7 最高，跟教堂里的数字谱一个记法。）\n\n《摇篮曲》——卡琳每晚要听\n　问：5 3 2 1　　答：1 2 3 5\n《婚礼进行曲》——下礼拜六要拉\n　问：1 3 5 5　　答：6 5 3 1\n《奈克调》——跟瘸腿佩尔学的\n　问：■ 5 6 3（第一个数字被水泡开了）　　答：（空着）\n\n页边小字：备用的E弦，在磨坊工具架上的铁盒里。\n好的那瓶白兰地留着嫁闺女，藏在地窖土豆底下。别让老婆子知道。\n\n最后一页，墨水是新的：\n「年轻时候我给了他半瓶酒，他只教会我调弦。剩下的，我自己摸了五十年。」' },
    bible: { title: '家里的圣经（扉页）', text: '扉页上是外婆的母亲写的字，墨水已经褪成了褐色。\n\n「孩子们去溪边，要念：\n　奈克，奈克，偷针贼——\n　你在水里，我在岸上。\n念的时候，把钢针扔进水里。」\n\n底下还抄了一个故事：\n牧师家的两个孩子在河边玩，看见奈克坐在水里拉琴。孩子们笑他：「你拉得再好有什么用？你永远进不了天堂。」\n奈克扔下琴，哭了。\n牧师听说了，叫孩子们回去告诉他：「你也能得救。」\n那天晚上，河里的琴声一直响到天亮，是人们听过的最快活的曲子。' },
    pelle: { title: '佩尔的信', text: '安德斯老兄：\n\n你问奈克调后半首怎么拉。我只能告诉你我知道的。\n\n那年我十九，连着三个星期四晚上去磨坊下面的水闸边。头一回我带了一瓶白兰地。他还要过别的——三滴……我没给。\n\n回他的琴，可不能像岸上那样回。他是水里的人，你在岸上看他，什么都是倒过来的——磨坊那根水尺你天天看，照着它的影子回他。\n\n奈克调开头那个音，是七个音里最高的，高得像要从水里跳出来。\n\n还有：奈克调一共十一段变奏。第十一段千万别拉。一拉，桌子、椅子、老太太、摇篮里的娃娃，全都要跳起来，跳到天亮也停不下。\n\n——瘸腿佩尔' }
  };

  const LEGEND = '奈克（瑞典语 Näcken，挪威叫 Nøkken，丹麦叫 Nøkke，和英格兰的 nix、德国的 Nix 同出一源）是北欧流传最广的水怪之一。在瑞典，人们说他常化作一个光着身子的年轻男人，坐在溪流、瀑布或磨坊的水闸边拉提琴，夏天的夜里、星期四的晚上和仲夏夜最容易遇到。他的琴声好听得叫人挪不开脚，听的人会跟着跳舞，一直跳进水里——据说他尤其爱引诱女人和孩子。和他相近的还有「溪中琴师」（strömkarlen），流传着一支「溪中琴师调」，据说有十一段变奏，第十一段不能拉：一拉，桌椅、老人、摇篮里的婴儿都会跳起来，停不下来。\n\n奈克也会教人拉琴。流传的条件五花八门：一只黑色的牲口、一瓶白兰地（瑞典的 brännvin）、一撮鼻烟，或者三滴血；有的说要连着三个星期四晚上去水边。学琴的人手指会被他按得流血，学成之后，琴声能让树木起舞、瀑布停流。有一种说法：贡品给得不够，他就只教你怎么调弦。防他的办法也代代相传：身上带钢——针、刀、船底钉一颗钉子；下水前把钢针扔进水里，念「奈克，奈克，偷针贼，你在水里，我在岸上」；叫出他的名字，他就失了法力。\n\n他还会变成一匹白马，叫「溪马」（bäckahästen），在雾里的河边吃草。孩子们爬上它的背，它的背就一截一截地变长，好让更多的孩子坐上去，然后驮着他们走进水里——直到有个孩子喊出了它的名字（有的版本里是喊了一句祷告），它才消失。也有许多故事说奈克渴望得救：两个孩子笑他永远进不了天堂，他扔下琴大哭；孩子们的父亲是牧师，叫他们回去告诉他「你也能得救」，那一夜河上的琴声快活得出奇。十九世纪末，北欧的画家们把他画进了画里：瀑布下拉琴的裸身少年，黑水里只露出一双眼睛的怪物。也有研究者认为，这些说法一面是在吓唬孩子别靠近水，一面也和乡村琴手的名声有关——拉得太好的人，常被说成「跟奈克学过」。\n\n（本章中的奥洛夫、卡琳、外婆、外公安德斯、瘸腿佩尔，外公的琴谱、佩尔的信、圣经扉页上的字，琴谱的具体数字、磨坊水尺的「倒影」规则、回琴石，追溪马的规则，以及三个结局，均为游戏虚构；瑞典十九世纪确有用数字给赞美诗记谱的做法，本章借用了这个形式。）';

  /* ---------------- 自定义精灵 ---------------- */
  const SPRITES = {
    kbed(g, e, t, R) {   // 卡琳的床（竖 2 格）：被子掀在地上
      box(R, 1, -2, 14, 32, '#5a3c26'); R(2, -1, 12, 4, '#6a4a30'); R(3, 3, 10, 6, '#e6e2d6'); R(6, 5, 4, 2, '#d0ccc0');
      R(2, 10, 12, 18, '#d8d0c0'); for (let i = 0; i < 3; i++) R(2, 13 + i * 5, 12, 1, '#c4bcac');
      R(-2, 22, 8, 9, '#8a5a6a'); R(-3, 26, 6, 5, '#7a4a5a'); R(-1, 23, 6, 1, '#a07080');
      R(10, 28, 3, 3, '#a07a4a'); R(13, 28, 3, 3, '#a07a4a');
    },
    winopen(g, e, t, R) {   // 打开的窗：两扇窗板朝外，月光和雾
      box(R, 2, 1, 12, 10, '#4a3a2a'); R(3, 2, 10, 8, '#7a8aa8'); R(3, 7, 10, 3, '#9aa8bc');
      R(9, 3, 3, 3, '#e8ecf4'); R(10, 2, 1, 1, '#e8ecf4');
      R(0, 1, 2, 10, '#5a2a20'); R(14, 1, 2, 10, '#5a2a20');
      const k = Math.sin(t * 1.3) * 1.5; R(3 + k, 9, 8, 1, 'rgba(220,226,236,.6)'); R(5 - k, 10, 7, 1, 'rgba(220,226,236,.4)');
    },
    wallfid(g, e, t, R) {   // 墙上挂的琴
      R(7, -1, 2, 2, '#3a2a1a');
      if (e.taken) { R(5, 2, 6, 11, 'rgba(0,0,0,.18)'); return; }
      R(7, 0, 2, 5, '#2a1a10'); R(6, -1, 4, 2, '#3a2416');
      R(5, 5, 6, 3, '#8a4420'); R(4, 8, 8, 2, '#7a3a1a'); R(5, 10, 6, 3, '#8a4420'); R(6, 13, 4, 1, '#6a2e14');
      R(7, 6, 2, 6, '#1e120a'); R(6, 8, 1, 1, '#1e120a'); R(9, 8, 1, 1, '#1e120a'); R(6, 6, 1, 1, '#b07040');
      R(12, 2, 1, 12, '#c8b890'); R(12, 1, 2, 2, '#3a2a1a');
    },
    hearthS(g, e, t, R) {   // 石砌壁炉，只剩炭火（2 格宽）
      box(R, -1, -10, 34, 25, '#5d5650');
      for (let r = 0; r < 4; r++) for (let c = 0; c < 5; c++) R(0 + c * 7 + (r % 2) * 3, -9 + r * 6, 6, 5, shade('#6e665e', (hash(c, r, 6) - .5) * .25));
      R(-2, -12, 36, 3, '#3a2a1e');
      R(7, -1, 18, 15, '#120a08');
      for (let i = 0; i < 6; i++) { const k = (Math.sin(t * 2 + i * 1.9) + 1) / 2; R(9 + i * 2.5, 11 + (i % 2), 3, 2, k > .55 ? '#e8501a' : '#8a2a10'); }
      R(9, 13, 14, 1, '#2a1410');
    },
    shelfH(g, e, t, R) {   // 墙上的木板架：盐罐、蜡烛，半瓶白兰地
      R(0, 9, 16, 2, '#5a3c22'); R(1, 11, 2, 3, '#4a3018'); R(13, 11, 2, 3, '#4a3018');
      R(2, 5, 3, 4, '#d8d0c0'); R(2, 4, 3, 1, '#a89a80');
      if (!e.taken) { R(9, 1, 3, 8, '#3a5a3a'); R(10, -1, 1, 2, '#3a5a3a'); R(10, -2, 1, 1, '#a08060'); R(9, 5, 3, 4, '#7a5a2a'); R(10, 2, 1, 2, '#6a8a6a'); }
      R(13, 6, 2, 3, '#e8e0c8');
    },
    kista(g, e, t, R) {   // 韦姆兰风格的彩绘木箱
      box(R, 0, 2, 16, 12, '#2e4a6a'); R(1, 3, 14, 3, '#3a5a7a'); R(0, 6, 16, 1, '#1e3048');
      R(3, 8, 2, 2, '#c84a3a'); R(7, 8, 2, 2, '#e8c050'); R(11, 8, 2, 2, '#c84a3a'); R(5, 10, 6, 1, '#4a8a5a');
      R(7, 5, 2, 2, '#b89a5a');
    },
    trapdoor(g, e, t, R) {   // 地窖的盖板，一角压着毯子
      R(1, 1, 14, 14, '#3a2616'); R(2, 2, 12, 12, '#5a3c22'); for (let x = 4; x < 14; x += 4) R(x, 2, 1, 12, '#3a2616');
      R(6, 7, 4, 2, '#8a8a8a'); R(7, 6, 2, 1, '#6a6a6a');
      R(-2, -2, 9, 6, '#7a3a3a'); R(-2, -2, 9, 1, '#9a5a4a'); R(-1, 0, 7, 1, '#a07a3a');
    },
    potbin(g, e, t, R) {   // 地窖的土豆筐
      box(R, 1, 3, 14, 11, '#6a4a2a'); R(1, 7, 14, 1, '#4a3018');
      for (let i = 0; i < 7; i++) R(2 + ((hash(i, 1, e.px) * 11) | 0), 1 + ((hash(i, 2, e.px) * 4) | 0), 3, 3, i % 2 ? '#a8885a' : '#94744a');
      if (e.bottle) { R(10, -3, 2, 5, '#2a4a2a'); R(10, -4, 2, 1, '#c84a3a'); }
    },
    jars(g, e, t, R) { R(0, 9, 16, 2, '#4a3018'); for (let i = 0; i < 4; i++) { R(1 + i * 4, 3, 3, 6, i % 2 ? '#c87a3a' : '#7a2a3a'); R(1 + i * 4, 2, 3, 1, '#d8d0c0'); } },
    ladderS(g, e, t, R) { R(3, -6, 2, 21, '#6a4a2a'); R(11, -6, 2, 21, '#6a4a2a'); for (let y = -4; y < 14; y += 4) R(3, y, 10, 1, '#8a6a3a'); R(0, -8, 16, 2, 'rgba(255,220,160,.25)'); },
    /* 外面 */
    hassja(g, e, t, R) {   // 晾草架（3 格宽）：木杆上搭着一排排干草
      for (const x of [1, 23, 45]) R(x, -14, 2, 29, '#5a4028');
      for (let r = 0; r < 4; r++) { R(0, -10 + r * 6, 48, 1, '#6a4a2a'); for (let i = 0; i < 12; i++) R(i * 4, -9 + r * 6, 4, 4 + ((hash(i, r, 3) * 2) | 0), shade('#8a7a48', (hash(i, r, 5) - .5) * .3)); }
    },
    gate(g, e, t, R) {   // 桦树林口的木栅门（2 格宽）
      R(0, -6, 3, 21, '#5a4028'); R(29, -6, 3, 21, '#5a4028');
      if (e.open) { R(3, -2, 3, 15, '#7a5a38'); R(3, 0, 3, 1, '#5a4028'); R(3, 8, 3, 1, '#5a4028'); return; }
      for (const y of [-1, 5, 11]) R(3, y, 26, 2, '#7a5a38');
      for (let x = 6; x < 28; x += 6) R(x, -2, 2, 15, '#6a4a2e');
      R(4, 9, 24, 1, 'rgba(0,0,0,.25)');
    },
    ribbon(g, e, t, R) { const k = Math.sin(t * 2) * 1; R(6, 3, 4, 2, '#d02a2a'); R(8, 5, 1, 5 + k, '#b02020'); R(10, 5, 1, 4 - k, '#b02020'); },
    pondeyes(g, e, t, R) {   // 水塘里的眼睛：平时只是两片睡莲叶
      R(1, 6, 5, 3, '#2a4a32'); R(10, 9, 5, 3, '#2a4a32'); R(3, 7, 1, 1, '#4a6a4a');
      if (e.open) { const b = Math.sin(t * 3) > .92 ? 0 : 1; R(4, 2, 3, b, '#a8ffd8'); R(10, 2, 3, b, '#a8ffd8'); for (let i = 0; i < 4; i++) R(2 + i * 4, 4 + (i % 2), 1, 4, '#1a2a24'); }
    },
    rstone(g, e, t, R) { R(3, 3, 10, 12, '#5a5a56'); R(4, 1, 8, 3, '#5a5a56'); R(5, 4, 6, 9, '#6a6a64'); R(7, 5, 2, 7, '#3a3a38'); R(5, 8, 6, 1, '#3a3a38'); R(3, 13, 10, 2, '#2a3a24'); },
    mwheel(g, e, t, R) {   // 磨坊水轮（竖 2 格）
      const a = t * 1.4; R(0, 2, 16, 28, 'rgba(0,0,0,.3)');
      for (let i = 0; i < 8; i++) { const k = a + i * Math.PI / 4; R(8 + Math.cos(k) * 11 - 1, 15 + Math.sin(k) * 11 - 1, 3, 3, '#6a4a2a'); for (let j = 1; j < 10; j += 2) R(8 + Math.cos(k) * j, 15 + Math.sin(k) * j, 1, 1, '#4a3018'); }
      R(6, 13, 4, 4, '#3a2616');
      R(2, 26 + Math.sin(t * 6) * 1, 12, 2, 'rgba(220,235,245,.55)');
    },
    doorR(g, e, t, R) { box(R, 3, -2, 10, 17, '#4a2a1e'); for (let x = 5; x < 12; x += 3) R(x, -1, 1, 15, '#3a1e14'); R(4, -3, 8, 1, '#e8e2d6'); R(10, 6, 2, 2, '#a08a6a'); if (e.lit) R(4, 13, 8, 2, 'rgba(255,160,80,.4)'); },
    /* 磨坊 */
    mstone(g, e, t, R) {   // 磨盘（2×2）
      R(-1, 4, 34, 28, '#3a2c20'); R(1, 6, 30, 24, '#6a6660'); R(3, 8, 26, 20, '#7a766e');
      for (let i = 0; i < 8; i++) { const k = i * Math.PI / 4; R(16 + Math.cos(k) * 10, 18 + Math.sin(k) * 8, 2, 1, '#5a5650'); }
      R(14, 15, 4, 4, '#2a2420'); R(10, -6, 12, 10, '#7a5a38'); R(12, -4, 8, 6, '#5a4028'); R(15, 2, 2, 6, '#5a4028');
      R(4, 26, 8, 3, '#e8e0d0'); R(20, 27, 6, 2, '#e8e0d0');
    },
    tinshelf(g, e, t, R) {   // 工具架：锤子、凿子、铁盒
      R(0, 9, 16, 2, '#5a3c22'); R(1, 3, 1, 6, '#6a4a2a'); R(0, 3, 4, 2, '#7a7a7a'); R(6, 4, 1, 5, '#8a8a8a'); R(6, 3, 1, 1, '#5a4028');
      if (!e.taken) { R(9, 5, 6, 4, '#7a5a3a'); R(9, 5, 6, 1, '#9a7a4a'); R(11, 7, 2, 1, '#4a3a2a'); }
    },
    gauge(g, e, t, R) {   // 水闸里的水尺：刻度 1–7，4 压在水面上；水面以下是 5、6、7 的倒影
      R(6, -20, 4, 26, '#c8b890'); R(6, -20, 1, 26, '#e8dcb8');
      for (let i = 0; i < 4; i++) R(5, 5 - i * 7, 6, 1, '#2a1a10');
      R(10, -19, 2, 2, '#c02a2a');
      R(-2, 6, 20, 1, 'rgba(220,235,245,.7)');
      R(6, 7, 4, 20, 'rgba(200,184,144,.35)'); for (let i = 1; i < 4; i++) R(5, 6 + i * 7 + Math.sin(t * 3 + i) * .6, 6, 1, 'rgba(42,26,16,.5)');
      R(13, 27 + Math.sin(t * 4), 2, 1, 'rgba(220,235,245,.4)');
    },
    cog(g, e, t, R) { const a = t * .8; R(5, -14, 6, 30, '#5a4028'); for (let i = 0; i < 10; i++) { const k = a + i * Math.PI / 5; R(8 + Math.cos(k) * 6 - 1, -4 + Math.sin(k) * 6 - 1, 2, 2, '#7a5a38'); } R(6, -6, 4, 4, '#3a2616'); },
    /* 溪边 */
    kwater(g, e, t, R) {   // 盖在卡琳腿上的一圈水面
      const d = e.d || 0, top = 11 - d * 4, k = Math.sin(t * 4) * 1.5;
      R(-1, top, 18, 16 - top, 'rgba(60,100,130,.6)'); R(-1, top, 18, 1, 'rgba(200,225,240,.75)');
      R(1 + k, top + 2, 5, 1, 'rgba(200,225,240,.4)'); R(10 - k, top + 3, 4, 1, 'rgba(200,225,240,.35)');
    },
    rocker(g, e, t, R) {   // 外婆的摇椅（画在她身后）
      const a = Math.round(Math.sin(t * 1.2));
      R(2, -10 + a, 12, 2, '#5a3c22'); R(2, -10 + a, 2, 21, '#4a3018'); R(12, -10 + a, 2, 21, '#4a3018');
      for (let y = -7; y < 6; y += 3) R(4, y + a, 8, 1, '#6a4a2a');
      R(0, 13, 16, 1, '#3a2616'); R(-1, 12, 2, 1, '#3a2616'); R(15, 12, 2, 1, '#3a2616');
    },
    falls(g, e, t, R) {   // 瀑布（4 格宽、4 格高），落进深潭
      R(0, -4, 64, 4, '#4a4e50');
      for (let x = 2; x < 62; x += 3) { const o = ((t * 60 + x * 7) % 16); for (let y = -2; y < 38; y += 16) R(x, y + o, 2, Math.min(7, 44 - y - o), x % 2 ? 'rgba(220,236,248,.75)' : 'rgba(170,200,224,.6)'); }
      R(0, 38, 64, 10, 'rgba(230,240,250,.25)');
      for (let i = 0; i < 9; i++) R(4 + i * 7 + Math.sin(t * 5 + i) * 2, 43 + (i % 3), 4, 2, 'rgba(240,246,252,.7)');
    },
    nrock(g, e, t, R) {   // 潭心的大石头（2 格宽）
      R(-2, 10, 36, 6, 'rgba(200,220,235,.18)'); R(0, 13 + Math.sin(t * 2) * .5, 32, 1, 'rgba(220,236,248,.4)');
      box(R, 1, -2, 30, 15, '#4a4e4c'); R(3, -1, 18, 4, '#5e6461'); R(4, 0, 8, 1, '#7a807c');
      R(3, 8, 8, 3, '#2e4a3a'); R(22, 6, 6, 4, '#2e4a3a'); R(14, 10, 10, 2, '#3a3e3c');
    },
    astone(g, e, t, R) {   // 回琴石：岸边一块被磨平的花岗岩
      R(0, 9, 16, 6, '#2a2e2c'); R(1, 5, 14, 9, '#7a7a76'); R(2, 6, 12, 3, '#8e8e88'); R(4, 7, 4, 1, '#a8a8a2');
      R(10, 10, 3, 2, '#5a5a56'); R(3, 11, 2, 1, '#5a5a56'); if (e.lit) R(2, 6, 12, 1, 'rgba(168,255,216,.5)');
    },
    horse(g, e, t, R) {   // 溪马：侧面，背会随 s.len 一截一截变长；s.rider 时卡琳骑在上面，变长的背上坐着一排淡淡的影子
      const len = e.len || 0, Wd = 30 + len * 7, ox = 8 - Wd / 2, fl = e.dir === 2;
      const F = (x, y, w, h, c) => R(ox + (fl ? Wd - x - w : x), y, w, h, c);
      const k = e.fr ? (e.fr === 1 ? 1 : -1) : Math.sin(t * 2) > .95 ? 1 : 0;
      F(-1, 14, Wd + 2, 2, 'rgba(220,236,248,.35)');
      const Wh = '#e6eaec', W2 = '#b8c2c8', MA = '#24382e';
      F(7, -4, Wd - 9, 9, Wh); F(7, 3, Wd - 9, 2, W2);
      F(1, -12, 7, 5, Wh); F(-1, -9, 4, 3, Wh); F(4, -9, 6, 6, Wh); F(6, -5, 5, 4, Wh); F(-1, -7, 1, 1, '#2a2a2a'); F(3, -11, 1, 1, '#050505');
      F(5, -14, 2, 3, W2); F(7, -12, 3, 9, MA); F(9, -5, 2, 4, MA); F(6, -13, 2, 2, MA); F(1, -12, 2, 1, MA);
      const legs = [[9, k], [13, -k], [Wd - 9, -k], [Wd - 5, k]];
      for (const [x, s] of legs) { F(x + (s > 0 ? 1 : 0), 5, 2, 9 - (s < 0 ? 1 : 0), Wh); F(x + (s > 0 ? 1 : 0), 13 - (s < 0 ? 1 : 0), 2, 1, '#6a6a6a'); }
      F(Wd - 2, -3, 2, 9, '#d0d6da'); F(Wd - 1, 4, 2, 6, MA);
      for (let i = 0; i < 3; i++) F(10 + i * 6, 5 + ((t * 5 + i * 2) % 6), 1, 2, 'rgba(160,200,224,.8)');
      if (e.rider) {
        for (let i = 1; i <= len; i++) { const x = 13 + i * 7; F(x, -10, 5, 7, 'rgba(220,228,236,.22)'); F(x + 1, -13, 3, 3, 'rgba(220,228,236,.22)'); }
        F(10, -12, 6, 8, '#ece8e0'); F(10, -16, 5, 5, '#f4d8bc'); F(10, -17, 5, 2, '#e8d080'); F(9, -15, 1, 4, '#e8d080'); F(11, -14, 1, 1, '#3a4a6a');
        F(8, -10, 3, 1, '#f4d8bc');
      }
    }
  };

  /* ---------------- 自定义瓦片 ---------------- */
  const TILES = {
    roofR: { solid: true, paint(R, X, Y) { R(0, 0, 16, 16, '#2e2a26'); for (let r = 0; r < 4; r++) { R(0, r * 4, 16, 1, '#1e1a18'); for (let c = 0; c < 3; c++) if (hash(X * 3 + c, Y * 4 + r, 4) < .35) R(c * 5 + 1, r * 4 + 1, 4, 2, '#3a4a30'); } } },
    redw: { solid: true, paint(R, X, Y) { R(0, 0, 16, 16, '#8a2a20'); for (let x = 0; x < 16; x += 4) R(x, 0, 1, 16, '#6a1e16'); R(0, 14, 16, 2, '#4a1610'); if (hash(X, Y, 3) < .25) { R(4, 4, 8, 7, '#e8e2d6'); R(5, 5, 6, 5, '#1a2230'); R(7, 5, 1, 5, '#e8e2d6'); } } },
    greyw: { solid: true, paint(R, X, Y) { R(0, 0, 16, 16, '#5e5a54'); for (let x = 0; x < 16; x += 4) R(x, 0, 1, 16, '#4a4640'); R(0, 14, 16, 2, '#3a3630'); for (let i = 0; i < 3; i++) R((hash(X, Y, i) * 14) | 0, (hash(Y, X, i) * 14) | 0, 1, 2, '#6e6a62'); } },
    roofM: { solid: true, paint(R, X, Y) { R(0, 0, 16, 16, '#3a3836'); for (let r = 0; r < 4; r++) { const o = (r + Y) % 2 ? 0 : 3; for (let c = -1; c < 3; c++) R(o + c * 6, r * 4, 5, 3, shade('#4a4744', (hash(X + c, Y * 4 + r, 9) - .5) * .3)); } } },
    birch: { solid: true, paint(R, X, Y) {
      TILE.grass.paint(R, X, Y, { grassC: '#2e4630' });
      const x = 6 + ((hash(X, Y, 1) * 4) | 0);
      R(x, 4, 3, 12, '#e8e6de'); R(x + 2, 4, 1, 12, '#c8c6be'); for (let i = 0; i < 4; i++) R(x, 5 + i * 3 + ((hash(X, Y, i + 2) * 2) | 0), 2, 1, '#1e1e1e');
      for (let i = 0; i < 9; i++) R(((hash(X, Y, 10 + i) * 14) | 0), ((hash(X, Y, 20 + i) * 7) | 0), 3, 2, i % 3 ? '#4a6a34' : '#6a8a3a');
    } }
  };

  /* ================= 剧情 ================= */

  /* ---------------- 农舍：半夜醒来 ---------------- */
  async function wake(S) {
    S.f.ph = 'night';
    S.face('mor', 0);
    fidFar(S, .3);
    await S.narr('半夜。你是被琴声吵醒的——不是外公的琴，外公的琴还挂在墙上。\n声音从窗外来，从溪那边来。又细又长，像有人在水底下拉。');
    S.bubble('pl', '!', 1000); S.sfx('heart');
    await S.narr('卡琳的床空着。被子掀在地上，窗户大开，雾正一点一点地往屋里爬。');
    S.face('mor', 'pl');
    await S.say('外婆', ['……你也听见了。卡琳光着脚走的，木鞋还在床底下。', '今天是星期四。溪里那位，星期四晚上拉琴。']);
    await ME(S, '奈克？那不是吓唬小孩的吗？');
    await S.say('外婆', '你外公年轻时候见过他。我这双腿追不上了——你去。');
    S.give('needle');
    await S.narr('她从针线笸箩里抽出一根钢针，别在你的衣领上，针尖朝外。');
    await S.say('外婆', ['身上带着钢。他拉琴是在问话——他问，你就得回。', '他最怕人叫他的名字，可得等他露出真身再叫。要是他变成一匹白马……别站在它前头，也别跑。', '你外公什么都记在琴谱上，琴谱在蓝箱子里。拿上琴，去吧。']);
    S.goal('拿上外公的琴（墙上）和琴谱（蓝木箱），出门去溪边找卡琳');
    S.cp();
  }
  async function morTalk(S) {
    S.face('mor', 'pl');
    const f = S.f;
    if (f.ph === 'night') {
      if (!S.has('fiddle') || !f.readTunes) return S.say('外婆', S.has('fiddle') ? '琴谱！在蓝箱子里。他问你话，你总得知道拿什么回。' : '琴在墙上。别愣着。');
      if (!f.askCellar && f.readTunes) {
        f.askCellar = true;
        return S.say('外婆', ['……地窖里的酒？', '你外公那老东西，以为藏在土豆底下我就不知道。', '拿去吧。那位挑剔得很——给得不够，他就只教你一半。']);
      }
      if (!f.readBible) return S.say('外婆', ['桌上那本圣经，扉页上有你太姥姥写的几句话。', '出门前念一遍。溪边的孩子，都是念着那几句长大的。']);
      return S.say('外婆', ['钢针别好了？', '……去吧。外婆在家里点着灯等你们。']);
    }
    await S.say('外婆', '卡琳……奥洛夫，求你了。');
  }
  async function takeFiddle(S) {
    const e = S.ent('wallfid');
    if (e.s.taken) return S.narr('墙上留着一块浅色的印子，是琴挂了几十年的地方。');
    e.s.taken = true; S.give('fiddle');
    await S.narr('外公的琴。琴身上的漆被下巴磨掉了一块。\n你把它摘下来——最细的那根E弦断了，卷成一个小圈挂在琴头上。');
    await S.think('（少一根E弦，拉不全调子。外公的备用弦放在哪儿来着……）');
    goalHouse(S);
  }
  function goalHouse(S) {
    if (S.f.ph !== 'night') return;
    if (S.has('fiddle') && S.f.readTunes) S.goal('出门（南边的门），先去磨坊拿备用E弦，再去溪边');
    else S.goal('拿上外公的琴（墙上）和琴谱（蓝木箱），出门去溪边找卡琳');
  }
  async function readTunes(S) {
    if (S.once('tunesFirst')) await S.narr('箱子里压着外公的礼拜天衣服、一块怀表，最底下是一本牛皮纸封面的本子。');
    await S.note('tunes');
    S.f.readTunes = true;
    goalHouse(S);
  }
  async function cellarDown(S) {
    if (await S.ask('地窖的盖板，底下存着土豆和腌鱼。要下去吗？', ['（掀开盖板，下去）', '（算了）'])) return;
    S.sfx('open'); await S.fade(1, 300);
    S.pos(34, 2, 0); S.plr(2); S.dark(.86);
    await S.fade(0, 300);
    if (S.once('cellarIn')) await S.narr('地窖里又冷又潮，一股土腥味。墙角有水滴下来，嗒，嗒。');
  }
  async function cellarUp(S) {
    S.sfx('open'); await S.fade(1, 300);
    S.pos(13, 10, 0); S.plr(null); S.dark(null);
    await S.fade(0, 300);
  }
  async function binFull(S) {
    const e = S.ent('bin3');
    if (!e.s.bottle) return S.narr('土豆筐。底下被你翻得乱七八糟。');
    await S.narr('你把手伸进土豆底下，摸到一个凉冰冰的瓶颈。\n一整瓶白兰地，封口的蜡还没破。');
    e.s.bottle = false; S.give('brandyF');
    await S.think('（外公留着嫁闺女用的那瓶。）');
  }
  async function leaveHouse(S) {
    if (S.f.ph === 'night' && (!S.has('fiddle') || !S.f.readTunes)) {
      S.pos(8, 11, 3);
      S.face('mor', 'pl');
      return S.say('外婆', S.has('fiddle') ? '琴谱！他问你话，你拿什么回？在蓝箱子里。' : '空着手去？把外公的琴带上！');
    }
    if (S.f.ph === 'night') S.f.ph = 'out';
    await S.go('meadow', 5, 4, 0);
  }

  /* ---------------- 草场 ---------------- */
  async function meadowEnter(S, first) {
    bgT = 3;
    if (first) {
      await S.narr('外面起了雾。\n雾贴着草皮往前爬，没过了脚脖子。琴声从南边的桦树林后面飘过来，一会儿近，一会儿远。');
      S.goal(S.has('string') ? '穿过南边的桦树林，去溪边找卡琳' : '先去东边的磨坊拿外公的备用E弦，再穿过南边的桦树林去溪边');
    }
    if (S.has('string') && !S.f.glimpse && S.map === 'meadow') {
      S.f.glimpse = true;
      const h = S.ent('hglimpse'); h.alpha = 0; S.show('hglimpse');
      await S.alpha('hglimpse', .85, 900);
      whinny(S, .35);
      await S.narr('雾里站着一匹白马。\n没有鞍，没有缰绳，白得像刚洗过的床单。鬃毛一绺一绺地往下滴水。');
      await S.narr('它抬起头，朝你这边看了一眼。');
      await S.alpha('hglimpse', 0, 700);
      await S.think('……一眨眼，它就不见了。只有雾。\n（外婆说过：他要是变成一匹白马——别站在它前头，也别跑。）');
      S.goal('穿过南边的桦树林，去溪边找卡琳');
    }
  }
  async function gateUse(S) {
    const g = S.ent('gate');
    if (g.open) return S.narr('木栅门开着。琴声就在树林后面。');
    if (!S.has('string')) {
      fidFar(S, .8);
      return S.narr('琴声就在桦树林后面。\n可你的琴少一根E弦——他问话，你拿什么回？\n（先去东边的磨坊，拿外公的备用弦）');
    }
    S.sfx('open'); g.open = true; g.solid = false;
    await S.narr('你拔开门闩。木栅门「吱呀」一声荡开了。\n桦树林里的雾更浓，白树干一根一根地立在雾里，像一排没有脸的人。');
  }
  async function pondEyes(S) {
    const e = S.ent('eyes');
    if (S.f.pondSeen) return S.narr('那个小水塘。你不想再凑过去了。');
    await S.narr('一个小水塘，黑得像一块铁。水面上浮着两片睡莲叶子。');
    if (await S.ask('要蹲下去看看吗？', ['（蹲下去看）', '（算了）'])) return;
    S.f.pondSeen = true;
    e.open = true; S.sfx('heart'); S.tone('sine', 180, 60, .7, .05, 0, 600); S.tone('sine', 240, 90, .4, .03, .5, 600);
    await S.narr('……水底下有两点光。\n不是月亮的倒影。月亮在你背后。');
    await S.narr('那两点光，眨了一下。');
    await S.scare('face', { spr: '@nack', dur: .9 });
    e.open = false; splash(S);
    await S.narr('你往后一坐，跌在草里。\n再看的时候，水面上什么也没有，只有几根头发一样的水草，慢慢地沉下去。');
  }

  /* ---------------- 磨坊 ---------------- */
  async function takeString(S) {
    const e = S.ent('tin');
    if (e.s.taken) return S.narr('工具架上的锤子、凿子，都蒙着一层面粉灰。');
    await S.narr('一只生了锈的铁盒，盖子上用小刀刻着一个「安」字。\n里面是两根卷好的琴弦，用油纸包着。');
    e.s.taken = true; S.give('string', true);
    await S.narr('你借着月光把E弦换上，拧紧，轻轻拨了一下——');
    pluck(S, 659.25); await sleep(S, 500);
    await S.narr('「叮」。\n声音在空磨坊里转了一圈，从水闸那边弹了回来，像有人在水底下也拨了一下。');
    S.toast('外公的琴换好了E弦');
    S.goal(S.f.readPelle ? '回草场，穿过南边的桦树林去溪边' : '磨坊里再看看（外公常在这儿拉琴）；然后去溪边');
  }
  async function gaugeUse(S) {
    S.f.gauge = true;
    await S.narr('水尺插在水闸里，刻着 1 到 7。刻度 4 正好压在水面上。\n今晚的水平得像镜子。');
    await S.narr('露出水面的是 5、6、7，它们的影子倒映在水里——\n5 的影子落在 3 的位置，6 的影子落在 2 的位置，7 的影子落在 1 的位置。\n在岸上越高，在水里越低。');
    await S.narr('水尺底下，有人用刀刻了一行歪歪扭扭的小字：\n「回水里的话，照影子说。」');
  }
  async function readPelle(S) {
    if (S.once('pelleFirst')) await S.narr('磨工的小木箱里，塞着一封折了好几折的信。信封上写着：「安德斯收」。');
    await S.note('pelle');
    S.f.readPelle = true;
    if (S.has('string')) S.goal('回草场，穿过南边的桦树林去溪边');
  }

  /* ---------------- 溪边：问答 ---------------- */
  async function brookArrive(S) {
    S.f.ph = 'brook'; S.f.round = 1; S.f.wrong = {}; S.f.kdance = true;
    S.focus(14, 7);
    await S.narr('桦树林尽头，是一道小瀑布，底下一汪深潭。\n月光照在水上，亮得发白。');
    await S.narr('潭中间的石头上，坐着一个人。\n年轻，光着上身，长头发湿淋淋地披在肩上，下半截身子泡在水里。他把琴夹在下巴底下，闭着眼，拉得浑身都在晃。');
    S.focus(17, 9);
    await S.narr('浅水里，卡琳光着脚，穿着睡衣，一圈一圈地转。\n她的眼睛睁着，可是什么也没在看。');
    S.focus(null);
    await ME(S, '卡琳！', { style: 'big' });
    await S.narr('卡琳没有回头。\n琴声停了。');
    S.face('nack', 0);
    await N(S, ['……安德斯家的小子。', '你外公的琴，我认得。']);
    await N(S, ['星期四晚上的规矩，你外婆告诉你了吧？', '我拉，你回。回得上，你妹妹就慢慢地转；回不上——']);
    splash(S); kwLevel(S, 1);
    await S.narr('卡琳往深处挪了一步。水没过了她的膝盖。');
    await N(S, '我就拉跳舞的那支。');
    kwLevel(S, 0);
    await N(S, '第一句。你外公每天晚上都在你们家拉。');
    await sleep(S, fid(S, ROUND[1].q, { beat: .5 }) * 1000 + 200);
    await S.narr('四个音，一个比一个低，像一只手在摸小孩的头。\n——是外公的《摇篮曲》。');
    await N(S, '到岸边那块平石头上去，回我。');
    S.ent('astone').lit = true;
    S.goal('到岸边的回琴石上回他的琴（按 J 看外公的琴谱；两人时一人念谱、一人拉琴）');
    S.cp();
  }
  async function stoneUse(S) {
    const f = S.f, r = f.round;
    if (f.ph !== 'brook') return S.narr('岸边一块平平的花岗岩，被水磨得发亮。');
    if (r === 3) return S.narr('他已经不在等你回琴了。\n他在等你过去——顺着潭里那排踏石，走到他的石头跟前。');
    const R0 = ROUND[r];
    const c = await S.ask('回琴石上。他在等你回他的' + R0.name + '。', ['（拉琴回他）', '「……再拉一遍。」', '（先不回）']);
    if (c === 2) return;
    if (c === 1) {
      S.sfx('laugh');
      await N(S, r === 1 ? '耳朵不好使？听好了。' : '我的调子，你听一遍就该记住。……再一遍。');
      await sleep(S, fid(S, R0.q, { beat: .5 }) * 1000 + 200);
      await S.narr(r === 1 ? '5、3、2、1——一个比一个低。外公的《摇篮曲》。' : '头一个音高得刺耳，后面三个音落下去，又往上挑了一下。\n——外公琴谱上被水泡过的那首《奈克调》。');
      return;
    }
    const v = await S.keypad('回他的' + R0.name + '：拉四个音（1 最低，7 最高）\n他拉的：' + R0.desc + '\n按 J 可以翻外公的琴谱', ['1', '2', '3', '4', '5', '6', '7'], 4);
    if (v == null) return;
    await sleep(S, fid(S, [...v].map(Number), { beat: .4, vol: .06, type: 'triangle', lp: 3400 }) * 1000 + 150);
    if (v === R0.a) return roundWin(S, r);
    return roundWrong(S, r, v);
  }
  async function roundWrong(S, r, v) {
    const f = S.f, R0 = ROUND[r];
    const n = f.wrong[r] = (f.wrong[r] || 0) + 1;
    const tot = (f.wrongAll = (f.wrongAll || 0) + 1);
    fid(S, [[1, .5], [2, .5]], { beat: .3, sour: true, vol: .04 });
    splash(S); S.fx('red');
    const prev = S.ent('kwater').s.d || 0, lv = kwLevel(S, Math.min(2, prev + 1));
    if (r === 1 && n === 2 && S.once('faceR1')) await S.scare('face', { spr: '@nack', dur: .8 });
    /* 针对错法的回应 */
    const q = R0.q.join(''), rev = R0.q.slice().reverse().join('');
    if (v === q) await N(S, '学舌？那是八哥干的事。我问你，你得回我。');
    else if (r === 1 && v === R0.human) await N(S, ['那是岸上的答法。', '你在岸上，我在水里——你外公的琴谱，是写给岸上的人看的。']);
    else if (v === rev) await N(S, '倒着拉？水里的影子是上下颠倒，不是前后颠倒。');
    else if (r === 2 && v === ROUND[1].a) await N(S, '那是《摇篮曲》的回法。这一句，是我的。');
    else if (r === 2 && v.slice(1) === R0.a.slice(1)) await N(S, '后三个音对了。开头那个……你外公的琴谱上泡掉的那个，真当我不知道？');
    else await N(S, S.rand(2) ? '不对。' : '……不对。水都替你害臊了。');
    await S.narr(prev >= 2 ? '卡琳在水里晃了晃，差一点就站不住了。水已经到她的腰了。' : lv === 2 ? '卡琳又往深处挪了一步。水快到她的腰了。' : '卡琳往深处挪了一步。水没过了她的膝盖。');
    /* 逐级提示：卡住 2 次给方向，3 次给具体位置，4 次直接给答案 */
    if (n === 2) {
      if (r === 1) S.toast(f.gauge ? '提示：想想磨坊那根水尺——「回水里的话，照影子说」' : '提示：佩尔的信里说过怎么回水里的人；去磨坊看看那根水尺');
      else S.toast('提示：《奈克调》泡掉的第一个数字，佩尔的信里写着');
    } else if (n === 3) {
      if (r === 1) S.toast('提示：照影子回——1 换 7，2 换 6，3 换 5，4 不变。他拉的是琴谱上《摇篮曲》的「问」：5 3 2 1');
      else S.toast('提示：佩尔说开头是七个音里最高的——问句是 7 5 6 3；再照影子换');
    } else if (n >= 4) {
      await N(S, r === 1 ? ['……笨小子。', '三、五、六、七。'] : ['五十年了，还是这么笨。', '一、三、二、五。']);
    }
    if (tot === 3) await S.think('（照这样下去，卡琳会走进深水里的。按 J，把琴谱和佩尔的信再看一遍。）');
  }
  async function roundWin(S, r) {
    const f = S.f; kwLevel(S, 0);
    if (r === 1) {
      S.sfx('chime');
      await S.narr('琴声落进水里，水面轻轻一荡。');
      await N(S, ['……照着水回的。', '佩尔那个瘸子，嘴倒是不严。']);
      await S.narr('卡琳的脚步慢了一下，像在梦里听见了外公的琴。');
      await S.say('卡琳', '……外公？', { style: 'whisper' });
      await S.narr('然后她又转了起来。');
      await N(S, '那第二句——听我的。');
      await sleep(S, fid(S, ROUND[2].q, { beat: .5 }) * 1000 + 200);
      await S.narr('头一个音高得刺耳，像一条鱼从水里蹿出来；后面三个音落下去，又往上挑了一下。\n——是外公琴谱上被水泡过的那首《奈克调》。');
      f.round = 2;
      S.goal('在回琴石上回他的《奈克调》（琴谱上泡掉了第一个数字——佩尔的信里有）');
      return;
    }
    S.sfx('good');
    await S.narr('最后一个音拉完，潭里静得能听见瀑布后面的风。');
    S.sfx('laugh');
    await N(S, ['好。好。', '五十年了，头一回有人回得上这一句。']);
    await sleep(S, fid(S, NACK_FULL, { beat: .24, vol: .04 }) * 1000);
    await S.narr('他把《奈克调》剩下的半首拉了出来。\n你外公摸了五十年也没摸出来的那半首。');
    await N(S, ['想学吗？', '你外公学了一半就跑了。剩下的，我可以都教给你——下礼拜六的婚礼，全韦姆兰的人都会站着听你拉。', '星期四晚上，老规矩：拿东西来换。', '顺着踏石过来，到我石头跟前。']);
    f.round = 3; S.ent('astone').lit = false;
    S.goal('顺着潭里的踏石，走到奈克的石头跟前（拿什么换？）');
  }

  /* ---------------- 交换：贡品与学琴 ---------------- */
  async function rockUse(S) {
    const f = S.f;
    if (f.ph !== 'brook') return S.narr('潭心的大石头，湿漉漉的，长着青苔。');
    S.face('nack', 1);
    if (f.round < 3) return N(S, f.round === 1 ? '到岸上的回琴石去。岸上的人，在岸上回话。' : '还有一句没回呢。回琴石。');
    const opts = [], keys = [];
    if (S.has('brandyF')) { opts.push('（递上那瓶满满的白兰地）'); keys.push('full'); }
    if (S.has('brandyH')) { opts.push('（递上那半瓶白兰地）'); keys.push('half'); }
    opts.push('「你还要过……三滴，是吗？」'); keys.push('blood');
    opts.push('（什么也不给）'); keys.push('none');
    const k = keys[await S.ask('「拿什么来换？」\n他的手从水里伸出来，摊开，等着。', opts, '奈克')];
    if (k === 'blood') {
      await S.narr('他看了一眼你领子上的钢针。');
      return N(S, ['你外婆把针别在你领子上，就是怕你说这句话。', '收起来吧。我不收孩子的那个。……拿酒来。']);
    }
    if (k === 'none') return N(S, ['空着手来学琴？', '回去拿。星期四的夜，还长着呢。']);
    if (k === 'full') { S.take('brandyF'); await teachFull(S); }
    else { S.take('brandyH'); await teachHalf(S); }
    await becomeHorse(S);
  }
  async function teachFull(S) {
    S.f.learned = 'full';
    await S.narr('他拔开蜡封，仰头喝了一大口，把瓶子往水里一放——瓶子没沉，顺着水漂走了。');
    await N(S, ['手给我。', '……别怕。拿着弓。']);
    await S.narr('他的手从水里伸过来，握住了你拿弓的手。\n冷。像一块刚从井底捞上来的铁。');
    await sleep(S, fid(S, NACK_FULL.concat(NACK_FULL.map(([n, b]) => [n + 1, b])), { beat: .17, vol: .045 }) * 1000);
    await S.narr('琴弓自己走了起来。你的手指在弦上跑，快得你自己都看不清。\n指尖先是疼，然后是麻，然后什么都感觉不到了。\n弦上沾了一点黑乎乎的东西——月光底下，看不出是什么颜色。');
    await S.narr('一段，两段，三段……一直拉到第十段，他松开了手。');
    await N(S, '第十一段，我不教。谁也不教。');
    await S.think('你低头看自己的手。手指上一道一道的白印子——可是，你会了。\n那些曲子，就在手指头里。');
  }
  async function teachHalf(S) {
    S.f.learned = 'half';
    await N(S, ['半瓶。', '……你外公当年，也是半瓶。']);
    S.sfx('laugh');
    await S.narr('他握住你的手，一根一根地拧琴轴。');
    for (const [i, f] of [[0, 196], [1, 293.66], [2, 440], [3, 659.25]]) pluck(S, f, i * .6, .05);
    await sleep(S, 2600);
    await N(S, ['调弦。就教这么多。', '半瓶酒，半门手艺——你们家的人，记性都不好。']);
  }
  async function becomeHorse(S) {
    await N(S, ['琴教完了。', '现在——该收账了。']);
    S.sfx('whisper');
    await S.alpha('nack', 0, 700);
    await S.narr('他往后一仰，整个人滑进了深潭，连一点水花都没有。');
    S.shake(900, 2); S.tone('sine', 70, 40, 1.4, .1, 0, 300);
    await sleep(S, 600);
    const h = S.ent('horse'); h.s.rider = 0; h.s.len = 0; S.place('horse', 19, 10, 1); h.alpha = 0;
    S.focus(18, 9);
    await S.alpha('horse', 1, 700);
    whinny(S, 1);
    await S.narr('卡琳身边的水鼓起一个大包——\n一匹白马从水里站了起来。');
    await S.narr('雾里看见过的那匹马。白得发亮，鬃毛上缠着水草，一绺一绺往下滴水。\n它朝卡琳低下头。');
    await S.narr('卡琳伸手摸了摸它的鼻子，笑了。\n然后她抓住鬃毛，爬了上去。');
    S.hide('karin'); S.hide('kwater'); h.s.rider = 1; S.sfx('splash');
    await sleep(S, 400);
    for (let i = 1; i <= 2; i++) { h.s.len = i; S.tone('sawtooth', 120, 90, .3, .03, 0, 400); await sleep(S, 350); }
    await S.narr('马背……变长了。\n像有人把它往两头拉，长出一截，又长出一截——好像在给更多的孩子腾地方。');
    h.s.len = 0;
    await ME(S, '卡琳！下来！', { style: 'big' });
    await S.narr('白马打了个响鼻，驮着她，顺着浅水绕着深潭走了起来。\n一圈，又一圈。');
    S.focus(null);
    S.pos(12, 13, 3);
    await S.narr('你连滚带爬地跳回了岸上。');
    await S.think('（外婆说过：它要是变成白马——别站在它前头，也别跑。）');
    S.f.ph = 'horse'; S.f.touch = 0;
    horseSetup(S);
    S.goal('追上溪马！从后面或侧面走近它（只能走，一跑它就惊；别挡在它前头）');
    S.cp('horse');
    horseStart(S, T_FULL);
  }

  /* ---------------- 危险段：追溪马 ---------------- */
  function horseSetup(S) {
    HS = { on: false, s: 12, dir: 1, pause: 0, bolt: 0, shy: 0, hoof: 0, mus: 0, mi: 0, seen: 0 };
    const h = S.ent('horse'), p = loopPos(HS.s);
    S.place('horse', p.x, p.y, 2); h.alpha = 1; h.s.rider = 1; h.s.len = 0; h.s.hs = HS.s; h.s.hd = 1;
    S.hide('karin'); S.hide('nack'); S.hide('kwater');
  }
  function horseStart(S, sec) {
    HS.on = true; HS.pause = .8;
    S.timer(sec, '溪马走进深潭', drownEnd, { during: true });
  }
  function horseTick(S, dt) {
    if (!HS.on || S.f.ph !== 'horse' || S.busy) return;
    const h = S.ent('horse'), p = S.pl;
    HS.pause -= dt; HS.bolt -= dt; HS.shy -= dt;
    const hp = loopPos(HS.s), px = p.px / 16, py = p.py / 16;
    const dx = px - hp.x, dy = py - hp.y, dist = Math.hypot(dx, dy);
    const fx = hp.fx * HS.dir, fy = hp.fy * HS.dir, ahead = (dx * fx + dy * fy) / Math.max(dist, .01);
    /* 一格以内、不在它正前头：追上了 */
    if (HS.bolt > 0 && HS.charge ? dist <= 1.15 : dist <= .8 && ahead > .35) { HS.on = false; S.run(touched); return; }   // 迎面撞上（受惊冲过来时更容易撞上）
    if (dist <= 1.3 && ahead <= .35 && HS.bolt <= 0) { HS.on = false; S.run(caught); return; }
    if (S.running && dist < 7 && HS.bolt <= 0) {   // 一跑它就惊：在它前头跑，它直冲过来；在后头跑，它甩开你
      HS.charge = ahead > 0; HS.bolt = HS.charge ? 1.75 : 1.4; HS.pause = HS.charge ? .35 : 0;   // 冲过来之前先人立而起一下
      whinny(S, .8); S.shake(300, 1); S.bubble('horse', '!', 700);
      if (S.once('boltTip')) S.toast('它听见你跑——惊了！追溪马只能走');
    } else if (!S.running && HS.bolt <= 0 && HS.pause <= 0 && ahead > .5 && dist < 4.5) {   // 看见你在前头：掉头
      HS.dir = -HS.dir; HS.pause = .25; HS.shy = .8; S.tone('sawtooth', 300, 180, .25, .03, 0, 900); S.bubble('horse', '!', 600);
      if (++HS.seen === 1) S.toast('它看见你在前头，掉头了——从后面追');
    }
    const spd = HS.pause > 0 ? 0 : HS.bolt > 0 ? H_BOLT : HS.shy > 0 ? H_SHY : H_WALK;
    HS.s = ((HS.s + HS.dir * spd * dt) % LOOP + LOOP) % LOOP;
    const np = loopPos(HS.s);
    h.px = np.x * 16; h.py = np.y * 16; h.x = Math.round(np.x); h.y = Math.round(np.y);
    const mx = np.fx * HS.dir; if (mx) h.dir = mx < 0 ? 1 : 2;
    h.fr = spd > 0 ? [1, 0, 3, 0][Math.floor(HS.hw = (HS.hw || 0) + spd * dt * 3) % 4] : 0;
    h.s.hs = HS.s; h.s.hd = HS.dir;
    const left = S.timerLeft;
    if (left != null) { const L = Math.min(3, Math.floor((1 - left / T_FULL) * 4)); if (L > (h.s.len || 0)) { S.tone('sawtooth', 130, 85, .45, .04, 0, 420); S.tone('square', 95, 70, .3, .02, .2, 300); S.toast(['', '马背又长了一截……', '马背又长了一截，它离潭心更近了', '马背长得像一条船——快！'][L]); } h.s.len = L; }
    /* 蹄声（踩在浅水里）和奈克调的跳舞曲：越到后来越快 */
    if (spd > 0) { HS.hoof -= dt * spd / H_WALK; if (HS.hoof <= 0) { HS.hoof = .3; const v = clamp(1.4 - dist / 10, .25, 1); S.tone('triangle', 140, 70, .05, .05 * v, 0, 700); S.tone('sine', 900, 300, .06, .015 * v, .01, 3000); } }   // 蹄声远轻近响：看不见它时也听得出远近
    HS.mus -= dt; if (HS.mus <= 0) {
      const urg = left != null ? 1 - left / T_FULL : 0;
      HS.mus = .2 - urg * .07; const n = POLSKA[HS.mi++ % POLSKA.length];
      S.tone('sawtooth', fq(n), fq(n) * 1.003, .17, .028, 0, 1800); if (HS.mi % 3 === 1) S.tone('sine', fq(n) / 2, fq(n) / 2, .3, .03, 0, 900);
    }
  }
  function pushAway(S, k) {
    const hp = loopPos(HS.s), p = S.pl, m = W.maps[W.mapId];
    let dx = p.x - hp.x, dy = p.y - hp.y; const d = Math.hypot(dx, dy) || 1; dx /= d; dy /= d;
    for (let n = k; n >= 1; n--) for (const [ax, ay] of [[dx, dy], [dy, -dx], [-dy, dx]]) {
      const tx = Math.round(p.x + ax * n), ty = Math.round(p.y + ay * n);
      if (passable(m, tx, ty, W.pl)) { S.pos(tx, ty, p.dir); return; }
    }
  }
  async function touched(S) {
    const f = S.f; f.touch = (f.touch || 0) + 1;
    if (f.touch === 1) {
      splash(S); S.fx('flash'); S.shake(400, 3); whinny(S, 1);
      await S.narr('它一头撞了过来——你的手按在了它湿淋淋的脖子上。\n手心一下子粘住了，像按在一块冰上……');
      S.sfx('cut');
      await S.narr('领子上的钢针猛地扎了你一下。\n你一哆嗦，手从它脖子上弹开了。');
      pushAway(S, 2);
      HS.dir = -HS.dir; HS.pause = .6; HS.bolt = 0; HS.on = true;
      S.toast('别挡在它前头！钢针只救得了你一回——从后面追');
      return;
    }
    lastLeft = Math.max(0, (S.timerLeft || 0)); S.clearTimer(); died = true;
    await S.scare('face', { spr: '@horse', dur: 1 });
    await S.die('你的手粘在它的脖子上，怎么也拿不下来。\n白马驮着你们兄妹俩，一步一步走进了深潭。\n水面合上的时候，雾里还在响着琴声。', '你被溪马驮走了');
  }
  async function drownEnd(S) {
    HS.on = false; lastLeft = 0; died = true;
    const h = S.ent('horse'); h.s.len = 3;
    await S.narr('白马不再绕圈了。\n它转过头，朝潭心走去。');
    const x0 = h.px, y0 = h.py, x1 = 16 * 16, y1 = 6 * 16;
    for (let i = 1; i <= 12; i++) { h.px = x0 + (x1 - x0) * i / 12; h.py = y0 + (y1 - y0) * i / 12; h.fr = [1, 0, 3, 0][i % 4]; await sleep(S, 90); }
    splash(S);
    await S.alpha('horse', 0, 600);
    await S.scare('face', { spr: '@horse', dur: .8 });
    await S.die('你扑进水里，抓住的只有一把水草。\n潭面上一圈一圈的波纹，很快就平了。\n\n雾里，琴声又响了起来。', '溪马走进了深潭');
  }
  async function caught(S) {
    const left = S.timerLeft || 12; S.clearTimer();
    const h = S.ent('horse'); h.fr = 0;
    S.face('pl', S.ent('horse').px < S.pl.px ? 1 : 2);
    whinny(S, .6);
    await S.narr('你一把攥住了它湿淋淋的鬃毛。\n白马猛地停住，回过头来看你——它的眼睛是黑的，黑得像潭底。');
    const named = S.f.readBible;
    const c = await S.ask('卡琳就趴在它的背上，迷迷糊糊的，伸手就能够着。', ['「卡琳！醒醒！下来！」', named ? '「奈克，奈克，偷针贼——你在水里，我在岸上！」（拔下钢针，扎进它的鬃毛）' : '「奈克！」（拔下钢针，扎进它的鬃毛）', '「……先别走。第十一段——教我。」']);
    if (c === 0) {
      await S.narr('卡琳动都没动。\n白马一甩脖子，把你甩出去老远。');
      splash(S); pushAway(S, 3);
      await S.think('（外婆说过：他最怕人叫他的名字——等他把真身露出来的时候。）');
      HS.dir = -HS.dir; HS.pause = .5; HS.on = true;
      S.timer(Math.max(8, left - 3), '溪马走进深潭', drownEnd, { during: true });
      return;
    }
    if (c === 2) return badDawn(S);
    return goodName(S, named);
  }

  /* ---------------- 结局 ---------------- */
  async function goodName(S, named) {
    S.f.ph = 'done';
    S.take('needle');
    await S.narr('你拔下领子上的钢针，攥在手心里，冲着那双黑眼睛喊——');
    await ME(S, named ? '奈克，奈克，偷针贼——你在水里，我在岸上！' : '奈克！', { style: 'big' });
    S.fx('flash'); S.shake(700, 3);
    S.tone('sawtooth', 1400, 300, 1.2, .05, 0, 2600); S.tone('sine', 2200, 600, .9, .02, .05, 4000);
    await S.narr('钢针扎进了湿淋淋的鬃毛里。');
    whinny(S, 1.2);
    await S.narr('白马一声长嘶，整个身子塌了下去——像一捧雪掉进了热水里。\n它化成一大片水，「哗」地泼回了深潭。');
    const h = S.ent('horse'), kx = Math.round(h.px / 16), ky = Math.round(h.py / 16);
    S.hide('horse'); splash(S, 1.5);
    S.place('karin', kx, ky, 0); S.ent('karin').oy = 0; S.f.kdance = false;
    await S.narr('卡琳掉进浅水里，呛了一口水，「哇」地哭了出来。');
    await S.say('卡琳', ['哥哥……', '我冷。']);
    if (S.has('ribbon')) {
      S.take('ribbon'); S.ent('karin').spr = '@karinR';
      await S.narr('你把她抱上岸，从兜里掏出那根湿漉漉的红头绳，给她扎在辫子上。\n她吸着鼻子，笑了。');
    } else await S.narr('你把她抱上岸，用外衣裹住。她的脚冰凉，还在发抖。');
    await sleep(S, 400);
    S.ent('nack').alpha = 0; S.show('nack'); await S.alpha('nack', 1, 900);
    await S.narr('潭心的石头上，那个年轻人又坐在那儿了。\n头发贴在脸上，琴搁在膝头。他没有拉。');
    await N(S, '……你叫了我的名字。');
    if (S.f.learned === 'full') await N(S, ['你外公学了一半就跑了。你比他强。', '下礼拜六，你拉吧。拉什么都行——别拉第十一段。']);
    else await N(S, ['半瓶酒，半门手艺，再加一根钢针。', '你外公那年十九，口袋里只有半瓶酒的钱。后来他常坐在磨坊里，拉给水听——拉得不好，可我每回都听完了。', '……下礼拜六，你就拿调准的弦，拉你会的那三首吧。']);
    let saved = false;
    if (S.f.readBible) {
      await N(S, '你家圣经上抄的那个故事……');
      const r = await S.ask('「……我，能得救吗？」', ['「能。」', '「我不知道。」'], '奈克');
      if (r === 0) {
        saved = true;
        await S.narr('他低下头，看了你很久。\n然后他把琴夹在下巴底下，拉了起来。');
        await sleep(S, fid(S, [[1, 1], [3, 1], [5, 1], [8, 2], [7, 1], [5, 1], [6, 1], [8, 3]], { beat: .3, vol: .045 }) * 1000);
        await S.narr('那是你这辈子听过的最快活的一支曲子。');
      } else await S.narr('他点了点头，什么也没说，慢慢地沉进了水里。');
    } else await S.narr('他点了点头，慢慢地沉进了水里。');
    S.tone('sine', 660, 990, 1.4, .03, .3, 3000); S.tone('sine', 990, 880, 1.2, .025, 1.7, 3000);
    await S.narr('远处，从家那边，传来外婆喊人回家的长调子，一声比一声高。\n东边的天还黑着，可雾已经开始散了。');
    await S.fade(1, 1200);
    const home = '那天后半夜，你背着卡琳回了家。外婆站在门口，一句话也没说，把你们俩一起搂住了。\n\n';
    const tail = saved ? '\n\n那年秋天，有人说夜里经过溪边，听见水里有人在拉一支赞美诗。' : '';
    if (S.f.learned === 'full') return S.end({ id: 'name', title: '叫出他的名字', text: home + '下礼拜六的婚礼上，你拉了外公的《婚礼进行曲》，又拉了好多外公没教过的曲子。\n一屋子人跳到半夜，没有一个想停下来——可是到了半夜，大家都停下了。\n\n你的手指上留着几道浅浅的白印子。\n每到星期四晚上，它们就会有点凉。' + tail });
    return S.end({ id: 'tune', title: '半瓶酒', text: home + '下礼拜六的婚礼上，你只拉了外公教你的那三首曲子，翻来覆去地拉。\n可你的弦调得那么准，准得连邻村的老琴手都跑来问你是怎么调的。\n\n你没告诉他们。\n后来，你也像外公一样，自己摸了五十年。' + tail });
  }
  async function badDawn(S) {
    S.f.ph = 'done';
    await N(S, '……你想学第十一段？');
    await S.narr('白马的身子在雾里化开，又变回了那个坐在石头上的年轻人。\n卡琳从半空里落下来，落进浅水里，接着转圈。');
    const h = S.ent('horse'), kx = Math.round(h.px / 16), ky = Math.round(h.py / 16);
    S.hide('horse'); S.place('karin', kx, ky, 0); S.place('kwater', kx, ky); S.ent('kwater').s.d = 0; S.f.kdance = true; S.ent('nack').alpha = 1; S.show('nack');
    await N(S, ['好。我拉一遍，你跟一遍。', '你外公没学会的、佩尔不敢学的——你学。']);
    await sleep(S, fid(S, ELEVEN.concat(ELEVEN), { beat: .1, vol: .055 }) * 1000);
    S.shake(1600, 2);
    await S.narr('第十一段一起头，你的脚就离了地。\n桦树在跳，石头在跳，瀑布停在半空里不往下落了。卡琳在浅水里转，你在岸上拉。');
    await S.scare('face', { spr: '@nack', dur: .8 });
    await S.narr('你停不下来。\n谁也停不下来。');
    await S.fade(1, 1500);
    await S.end({ bad: true, id: 'dawn', title: '跳到天亮', text: '天亮的时候，割草的人在溪边找到了你们。\n\n妹妹在浅水里转圈，脚底板磨破了，还在转。\n哥哥坐在石头上拉琴，弓毛断得只剩几根，琴弦上黑乎乎的，还在拉。\n\n太阳一出来，琴声就停了。两个人一起倒在草里，睡了三天三夜。\n\n下礼拜六的婚礼上，奥洛夫拉了一整天的琴，拉得好极了——好得谁也不敢跳。\n从那以后，每到星期四晚上，他的手就自己去找琴。' });
  }

  /* ================= 地图 ================= */
  const MAPS = {};

  /* ---------------- 农舍（右边远处是地窖） ---------------- */
  MAPS.house = {
    amb: 'room', dark: .62, plr: 2.8, wall: 'wood', floor: 'wood',
    tileOpts: { woodC: '#6a4a30', rugC: '#7a3a3a' },
    rows: [
      '##################            ##########',
      '##################            ##########',
      '#................#            #kkkkkkkk#',
      '#................#            #kkkkkkkk#',
      '#................#            #kkkkkkkk#',
      '#................#            #kkkkkkkk#',
      '#................#            #kkkkkkkk#',
      '#.....rrr........#            #kkkkkkkk#',
      '#.....rrr........#            ##########',
      '#................#                      ',
      '#................#                      ',
      '#................#                      ',
      '########.#########                      '],
    ents: [
      { id: 'win', x: 3, y: 1, spr: 'winopen', on: S => S.narr('窗户大开着。窗台上有两个湿脚印——小小的，光着脚踩上去的。\n雾从窗口往屋里漫，琴声就是从那边来的。') },
      { x: 3, y: 2, spr: 'invisible', solid: false, light: { r: 3.2, a: .6, col: 'rgba(150,170,220,.12)' } },
      { id: 'kbed', x: 2, y: 2, h: 2, spr: 'kbed', on: S => S.narr('卡琳的床。被子掀到了地上，枕头上还有一个小小的坑。\n床底下摆着她的一双木鞋，整整齐齐。') },
      { id: 'obed', x: 5, y: 2, h: 2, spr: 'bed', col: '#4a5a7a', on: S => S.narr('你的床，被窝还是热的。\n刚才那支曲子钻进梦里的时候，你还以为是外公回来了。') },
      { id: 'wallfid', x: 8, y: 1, spr: 'wallfid', on: S => takeFiddle(S) },
      { id: 'hearth', x: 10, y: 1, w: 2, spr: 'hearthS', light: { r: 3.4, col: 'rgba(255,110,40,.2)', flick: true }, on: S => S.narr('炉膛里只剩一堆红炭。外婆守了一晚上，没舍得添柴。') },
      { id: 'clock', x: 13, y: 1, spr: 'wallclock', on: S => S.narr('墙上的钟。十二点过一刻。\n外公活着的时候，每天晚上这个钟点，他都要给卡琳拉一遍《摇篮曲》。') },
      { id: 'shelfH', x: 15, y: 1, spr: 'shelfH', async on(S) {
        const e = S.ent('shelfH');
        if (e.s.taken) return S.narr('架子上剩一罐盐、半截蜡烛。');
        e.s.taken = true; S.give('brandyH');
        await S.narr('架子上有半瓶白兰地，是外公喝剩的。软木塞上还有他的牙印。\n你把它揣进了怀里。');
      } },
      { id: 'rocker', x: 11, y: 3, spr: 'rocker', solid: false },
      { id: 'mor', x: 11, y: 3, spr: '@mor', dir: 0, on: S => morTalk(S) },
      { id: 'kista', x: 15, y: 4, spr: 'kista', on: S => readTunes(S) },
      { id: 'tbl', x: 6, y: 7, w: 2, spr: 'table2', col: '#5a3e26', async on(S) {
        if (S.once('bibleFirst')) await S.narr('桌上摊着家里的大本圣经，压着一盏没点的油灯。\n扉页上有几行褪了色的字。');
        await S.note('bible'); S.f.readBible = true;
      } },
      { x: 6, y: 7, spr: 'book', col: '#3a2416', z: 1, oy: -8, solid: false },
      { x: 7, y: 7, spr: 'lamp', off: true, z: 1, oy: -10, solid: false },
      { x: 1, y: 10, spr: 'barrel', on: S => S.narr('水缸。水面上漂着一层薄薄的雾。') },
      { x: 16, y: 9, spr: 'basket', on: S => S.narr('外婆的针线笸箩。钢针少了一根。') },
      { id: 'lucka', x: 13, y: 9, spr: 'trapdoor', decal: true, solid: false, on: S => cellarDown(S) },
      { id: 'xHouse', x: 8, y: 12, spr: 'invisible', touch: S => leaveHouse(S) },
      /* 地窖 */
      { id: 'ladder', x: 34, y: 1, spr: 'ladderS', on: S => cellarUp(S) },
      { x: 32, y: 1, spr: 'jars', on: S => S.narr('一排腌越橘、腌鲱鱼的罐子。罐口都用蜡封着。') },
      { id: 'bin1', x: 32, y: 4, spr: 'potbin', on: S => S.narr('土豆筐。土豆发了芽，长出白白的须子。') },
      { id: 'bin2', x: 34, y: 5, spr: 'potbin', on: S => S.narr('又一筐土豆。底下什么也没有。') },
      { id: 'bin3', x: 37, y: 4, spr: 'potbin', s: { bottle: true }, on: S => binFull(S) },
      { x: 37, y: 6, spr: 'puddle', decal: true }
    ],
    async enter(S, first) {
      bgT = 3;
      if (!S.f.ph) return wake(S);
      if (first) return;
      S.plr(null); S.dark(null);
      if (S.f.ph !== 'night' && S.once('backHome')) { S.face('mor', 'pl'); await S.say('外婆', '……卡琳呢？快去呀！'); }
    },
    tick(S, dt) {   // 屋里也听得见：远远的、细细的琴声
      if (S.busy || S.f.ph !== 'night') return;
      bgT -= dt; if (bgT <= 0) { bgT = 9 + Math.random() * 5; fidFar(S, .15); }
    }
  };

  /* ---------------- 草场（农舍 · 牲口棚 · 磨坊 · 桦树林） ---------------- */
  MAPS.meadow = {
    amb: 'night', dark: .6, plr: 3.2, floor: 'dirt', fog: .35,
    legend: { 'Y': 'roofR', 'V': 'roofR', 'H': 'redw', 'J': 'redw', 'M': 'roofM', 'N': 'greyw', 'I': 'birch' },
    tileOpts: { grassC: '#2e4630' },
    rows: [
      'PPPPPPPPPPPPPPPPPPPPPPPPPPPPPPP~~P',
      'P"YYYYYYY"""VVVVVV""""""MMMMMMM~~P',
      'P"YYYYYYY"""VVVVVV""""""MMMMMMM~~P',
      'P"HHHHHHH"""JJJJJJ""""""NNNNNNN~~P',
      'P""""d"""""""""""""""""""""d"""~~P',
      'PI"""d""""""""""""""""I""""d"""~~P',
      'PI"""d"""""""""""""""""""""d"""~~P',
      'P""""ddddddddddddddddddddddd"""~~P',
      'P""""""""""""""dd""""""""""""""~~P',
      'P"e~~~~e"""""""dd"""""""""""""I~~P',
      'Pe~~~~~~e""""""dd"""""""""""""I~~P',
      'Pe~~~~~e"""""""dd""""""""""""""~~P',
      'Pffffffffffffffddffffffffffffff~~P',
      'P"IB"I""""B"I""dd""B""II"""I"""~~P',
      'PII"III"I"""II"dd"III"""""II"""~~P',
      'P"II"BIIBI"I"""dd""I"II"I"""III~~P',
      'PII"B"II"B"""I"dd"""IIIII""I"""~~P',
      'PIIBI""II"I""I"dd""II""BI""II"I~~P',
      'PI"I"I""""IB"""dd"""III"III""""~~P',
      'P""""B"II""""""dd"II"I""I""I"B"~~P',
      'P"I""II"II""IB"dd"I"I"III""I""I~~P',
      'PPPPPPPPPPPPPPPddPPPPPPPPPPPPPP~~P'],
    ents: [
      { id: 'doorH', x: 5, y: 3, spr: 'doorR', lit: true, to: ['house', 8, 11, 3], light: { r: 1.6, col: 'rgba(255,150,70,.18)', dy: 14 } },
      { x: 4, y: 3, spr: 'invisible', solid: false, on: S => S.narr('窗户里透出一点炭火的红光。外婆在等你们。') },
      { x: 14, y: 3, spr: 'door', col: '#4a2018', on: S => S.narr('牲口棚。两头奶牛挤在角落里，一声不吭，眼睛瞪得溜圆。') },
      { id: 'millDoor', x: 27, y: 3, spr: 'door', col: '#4a4038', to: ['mill', 5, 9, 3] },
      { x: 31, y: 2, h: 2, spr: 'mwheel', solid: true, on: S => S.narr('磨坊的水轮，被溪水推着慢慢地转。\n吱——呀——吱——呀，像有人在水底下拉一把锯。') },
      { id: 'hass1', x: 8, y: 5, w: 3, spr: 'hassja', on: S => S.narr('晾草架上搭着刚割的干草。白天外公会坐在这底下抽烟斗——外公不在了。') },
      { id: 'hass2', x: 19, y: 5, w: 3, spr: 'hassja', on: S => S.narr('干草在雾里吸饱了水，沉甸甸地往下坠。') },
      { id: 'eyes', x: 4, y: 9, spr: 'pondeyes', solid: false, on: S => pondEyes(S) },
      { id: 'ribbon', x: 11, y: 12, spr: 'ribbon', solid: false, async on(S) {
        S.hide('ribbon'); S.give('ribbon');
        await S.narr('篱笆上挂着一根红头绳，湿漉漉的。\n是卡琳的。她每天早上都要外婆给她扎这根头绳。');
        await S.think('（她是从这儿往南边去的。）');
      } },
      { id: 'rstone', x: 23, y: 10, spr: 'rstone', on: S => S.narr('一块界石，上面刻着一道竖线、一道横线。\n老人们说，界石那边的地，夜里归别人。') },
      { id: 'gate', x: 15, y: 12, w: 2, spr: 'gate', on: S => gateUse(S) },
      { id: 'hglimpse', x: 22, y: 9, spr: 'horse', hidden: true, solid: false, dir: 1 },
      { id: 'xMeadowS', x: 15, y: 21, w: 2, spr: 'invisible', to: ['brook', 14, 14, 3] }
    ],
    enter: meadowEnter,
    tick(S, dt) {   // 远处的琴声：越往南越响
      if (S.busy) return;
      bgT -= dt; if (bgT <= 0) { bgT = 7 + Math.random() * 4; fidFar(S, clamp(S.pl.y / 21, 0, 1)); }
    }
  };

  /* ---------------- 磨坊 ---------------- */
  MAPS.mill = {
    amb: 'river', dark: .7, plr: 2.8, wall: 'wood', floor: 'wood',
    tileOpts: { woodC: '#5e5446' },
    rows: [
      '##############',
      '##############',
      '#..........~~#',
      '#..........~~#',
      '#..........~~#',
      '#..........~~#',
      '#..........~~#',
      '#..........~~#',
      '#..........~~#',
      '#..........~~#',
      '#####.########'],
    ents: [
      { id: 'mwin', x: 8, y: 1, spr: 'window', on: S => S.narr('窗外是磨坊的水闸。月光照在水面上，平得像一块玻璃。') },
      { x: 8, y: 2, spr: 'invisible', solid: false, light: { r: 3, a: .55, col: 'rgba(150,170,220,.1)' } },
      { id: 'tin', x: 3, y: 1, spr: 'tinshelf', on: S => takeString(S) },
      { x: 5, y: 1, spr: 'cog', on: S => S.narr('带着木齿的大轮子，连着水轮的轴。磨坊停工了，可它还被水带着，一格一格地转。') },
      { id: 'mstone', x: 5, y: 4, w: 2, h: 2, spr: 'mstone', on: S => S.narr('磨盘上落着一层面粉灰。上面有一串小小的脚印，光着脚的——\n……不，那是老鼠。') },
      { x: 1, y: 3, spr: 'sack', on: S => S.narr('一袋没磨完的黑麦。') },
      { x: 1, y: 4, spr: 'sack', on: S => S.narr('面粉袋。外公以前就坐在这几个袋子上拉琴，磨坊老板说，琴声一响，水轮转得都快了。') },
      { id: 'gauge', x: 11, y: 5, spr: 'gauge', solid: true, on: S => gaugeUse(S) },
      { id: 'mbox', x: 2, y: 8, spr: 'box', on: S => readPelle(S) },
      { x: 8, y: 8, spr: 'lantern', off: true, on: S => S.narr('磨工的马灯，没有油了。') },
      { id: 'xMill', x: 5, y: 10, spr: 'invisible', touch: S => S.go('meadow', 27, 4, 0) }
    ],
    async enter(S, first) {
      if (first) {
        await S.narr('磨坊里黑洞洞的，一股陈面粉的味道。\n水闸那边哗哗地响，水轮的大轴在墙里吱吱地转。');
        S.goal('找外公的备用E弦（工具架上的铁盒）');
      }
    }
  };

  /* ---------------- 溪边深潭 ---------------- */
  MAPS.brook = {
    amb: 'river', dark: .5, plr: 3.4, floor: 'dirt', fog: .18,
    legend: { 'I': 'birch' },
    tileOpts: { grassC: '#2a4430' },
    rows: [
      'PPKKKKKKKKKKKKKKKKKKKKKKKKKKPP',
      'PPKKKKKKKKKKKKKKKKKKKKKKKKKKPP',
      'PP"""""""""""~~~~"""""""I"""PP',
      'PPIII""""oooooooooooo""I""""PP',
      'PPII"II""o~~k~~~~~~~o""II"""PP',
      'PP"""""e"o~~k~~~~~~~o""I""""PP',
      'PPIIII"""o~~k~~~~~~~o"""""""PP',
      'PPII"""""o~~k~~~~~~~o"e"I""IPP',
      'PPII""Ie"o~~k~~~~~~~o"eIII"IPP',
      'PP""I"I""o~~k~~~~~~~o"""I"IIPP',
      'PP""I"I""oooooooooooo"""""I"PP',
      'PPII"II"e""""""""""""e"II"I"PP',
      'PP""""""""""""dd""""""""II""PP',
      'PPII""III"""""dd""""II"""""IPP',
      'PPI"I"I"II""""dd""I""""""II"PP',
      'PPPPPPPPPPPPPPddPPPPPPPPPPPPPP'],
    ents: [
      { id: 'falls', x: 13, y: 0, w: 4, h: 3, spr: 'falls', solid: false, light: { r: 4, a: .5, col: 'rgba(170,200,230,.1)' }, on: S => S.narr('小瀑布从岩壁上挂下来，白花花的。\n水声那么大，可琴声一响，你就只听得见琴声。') },
      { id: 'nrock', x: 13, y: 6, w: 2, spr: 'nrock', on: S => rockUse(S) },
      { id: 'nack', x: 14, y: 6, spr: '@nack', dir: 0, solid: false, oy: -5, light: { r: 2.2, a: .6, col: 'rgba(140,220,190,.12)' } },
      { id: 'karin', x: 17, y: 10, spr: '@karin', dir: 0, async on(S) {
        if (S.f.ph === 'done') return S.say('卡琳', '哥哥，我们回家吧……');
        await S.narr('你抓住她的胳膊——她的胳膊冰凉，脚下还在转，力气大得吓人，一下就把你甩开了。');
        await S.think('（拉不走。得先让他停下琴。）');
      } },
      { id: 'kwater', x: 17, y: 10, spr: 'kwater', solid: false, z: 1 },
      { id: 'horse', x: 19, y: 10, spr: 'horse', hidden: true, solid: false, dir: 1, light: { r: 1.6, a: .5, col: 'rgba(220,235,245,.1)' } },
      { id: 'astone', x: 14, y: 12, spr: 'astone', on: S => stoneUse(S) },
      { x: 12, y: 11, spr: 'invisible', solid: false, on: S => S.narr('岸边的泥地上有一串小脚印，一直走进水里。没有走出来的。') },
      { x: 21, y: 2, spr: 'invisible', solid: false, on: S => S.narr('瀑布溅起的水雾扑在脸上，凉得人一激灵。') },
      { id: 'xBrook', x: 14, y: 15, w: 2, spr: 'invisible', async touch(S) {
        if (S.f.ph === 'brook' || S.f.ph === 'horse') { S.pos(14, 14, 3); return S.think('卡琳还在水里。你不能走。'); }
        await S.go('meadow', 15, 20, 3);
      } }
    ],
    async enter(S, first) {
      bgT = 3;
      if (first && S.f.ph !== 'brook') return brookArrive(S);
    },
    tick(S, dt) {
      const f = S.f;
      if (f.kdance) {   // 卡琳在浅水里转圈
        kT -= dt; if (kT <= 0) { kT = .28; const k = S.ent('karin'); if (k && !k.hidden) { k.dir = [0, 2, 3, 1][(([0, 2, 3, 1].indexOf(k.dir) + 1) % 4)]; k.fr = k.fr === 1 ? 3 : 1; } }
      }
      if (f.ph === 'brook') { nT -= dt; if (nT <= 0) { nT = .22; const n = S.ent('nack'); n.fr = n.fr === 1 ? 3 : 1; } }   // 他一直在拉：手臂跟着弓子摆
      if (f.ph === 'horse') return horseTick(S, dt);
      if (S.busy || f.ph !== 'brook') return;
      bgT -= dt; if (bgT <= 0) { bgT = 6 + Math.random() * 3; fid(S, POLSKA.slice(0, 12).map(n => [n, .5]), { beat: .3, vol: .022, lp: 1600 }); }
    }
  };

  /* ================= 章节定义 ================= */
  defChapter({
    id: 'nokken', n: 26, title: '水妖奈克', sub: '星期四的晚上，溪边有人拉琴。听见的人会跟着跳，一直跳进水里。', origin: '瑞典民间传说 · Näcken', color: '#1c3a3a',
    icon: '@nack', amb: 'night', floor: 'wood', wall: 'wood', dark: .6, plr: 3,
    people: PEOPLE, faces: FACES, items: ITEMS, notes: NOTES, legend: LEGEND,
    endings: { name: '叫出他的名字', tune: '半瓶酒', dawn: '跳到天亮' },
    sprites: SPRITES, tiles: TILES, maps: MAPS,
    start: { map: 'house', x: 5, y: 4, dir: 2 },
    resume: {
      horse: async S => {
        S.amb('river'); S.focus(null);
        horseSetup(S);
        S.goal('追上溪马！从后面或侧面走近它（只能走，一跑它就惊；别挡在它前头）');
        if (died) await S.narr('（追溪马：只能走——一跑它就惊，在它前头跑还会被撞上。它看见你在前头就掉头，所以要从后面跟上去、走到一格以内。潭里的踏石能抄近道。）');
        const t = lastLeft == null ? T_FULL : Math.max(T_MIN, lastLeft);
        lastLeft = null;
        horseStart(S, t);
      }
    },
    async intro(S) {
      HS.on = false; lastLeft = null; died = false;
      await S.card('第二十六夜　水妖奈克', '1871年8月24日　星期四　瑞典韦姆兰', '你叫奥洛夫，十五岁。\n\n今年春天，外公死了。他是这一带最好的琴手，\n临走前教了你半年琴——你只学会了三首曲子。\n\n下礼拜六，表姐出嫁。\n村里人说，婚礼上没有琴，新人一辈子不顺。');
    }
  });
})();
