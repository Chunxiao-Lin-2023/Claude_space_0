/* ================= 第九夜 · 新娘潭 ================= */
(() => {
  const bg = p => { if (p && p.catch) p.catch(() => { }); return p; };
  const GOLD = '#d8a830', GOLD2 = '#f0c850', RED = '#b01018', WET = '#7ab0b0';

  /* ---------------- 地图字符表 ---------------- */
  const POOL_ROWS = [
    'QQQQQQQQQQQQQQQQQQQQQQ',
    'QQQQQQQQJJJJQQQQQQQQQQ',
    'QQQQQQQJJJJJJQQQQQQQQQ',
    'TQQQQQJJJJJJJJQQQQQQQT',
    'ddkkQJJJJJJJJJJQkkkQTT',
    'TddkkJJJJJJJJJJJkkkkTT',
    'TTdkkjJJJJJJJJJjkkkkTT',
    'TTTdkkjjjjjjjjjjkkk"TT',
    'TTTTdkkkkkkkkkkkkk""TT',
    'TTTTTdddddddkkkk"""TTT',
    'TTTTTTTTTTTTdd""BTTTTT',
    'TTTTTTTTTTTTdTTTTTTTTT',
    'TTTTTTTTTTTTdTTTTTTTTT'];
  const POOL_LEG = { Q: 'cliffq', J: 'jadew', j: 'jadeo', k: 'granite' };
  const TRAIL_ROWS = [
    'PPPPPpPPPPPPPPPP',
    'PPPPPpPPPPPPPPPP',
    'PPPPapPPPPPPPPPP',
    'PPPPPpppppPPPPPP',
    'PPPPPPPPPpaPPPPP',
    'PPPPPPPPPpPPPPPP',
    'PPPPPPPPPpPPPPPP',
    'PPPPPPPPapPPPPPP',
    'PPPPPPPPPppppPPP',
    'PPPPPPPPPPPPpPPP',
    'PPPPPPPPPPPPpaPP',
    'PPPPPPPPPPPPpPPP',
    'PPPaaaaPPPPPpPPP',
    'PPPaaaaaappppPPP',
    'PPPaaaaPPpPPPPPP',
    'PPPPPPPPPpPPPPPP',
    'PPPPPPPPPpPPPPPP',
    'PPPPPPPPPpaPPPPP',
    'PPPPPpppppPPPPPP',
    'PPPPPpPPPPPPPPPP',
    'PPPPapPPPPPPPPPP',
    'PPPPPpPPPPPPPPPP',
    'PPPPPppppPPPPPPP',
    'PPPPPPPPpPPPPPPP',
    'PPPPPPPPpaPPPPPP',
    'PPPPPPPPpPPPPPPP',
    'PPPPPPPPpppppPPP',
    'PPPPPPPPPPPPpPPP',
    'PPPPPPPPPPPapPPP',
    'PPPPPPPPPPPPpPPP',
    'PPPPPPPPPPPPpPPP',
    'PPPPPPPPPPPPpPPP'];
  /* 山径：从上（新娘潭）到下（照镜潭）的单线路径；a = 让路的山壁凹位 */
  function tracePath(rows, sx, sy) {
    const out = [[sx, sy]], seen = new Set([sx + ',' + sy]); let x = sx, y = sy;
    for (; ;) {
      let nx = null;
      for (const [dx, dy] of [[0, 1], [1, 0], [-1, 0], [0, -1]]) {
        const a = x + dx, b = y + dy;
        if (b < 0 || b >= rows.length || a < 0 || a >= rows[b].length) continue;
        if (rows[b][a] === 'p' && !seen.has(a + ',' + b)) { nx = [a, b]; break; }
      }
      if (!nx) break;
      seen.add(nx[0] + ',' + nx[1]); out.push(nx); x = nx[0]; y = nx[1];
    }
    return out;
  }
  const TPATH = tracePath(TRAIL_ROWS, 5, 0);            // 0 = 顶（新娘潭）… 末 = 底（照镜潭）
  const TUP = TPATH.slice().reverse();                   // 队伍从照镜潭抬上新娘潭
  const PSET = new Set(TPATH.map(c => c[0] + ',' + c[1]));
  const PIDX = {}; TPATH.forEach((c, i) => PIDX[c[0] + ',' + c[1]] = i);
  const PROC = ['pr0', 'pr1', 'pr2', 'pr3', 'pr4', 'pr5'];   // 灯笼 唢呐 前轿夫 花轿 后轿夫 灯笼
  const PSPD = 2.7;

  /* 照镜潭：倒影里才看得见的路 */
  const REAL = new Set(['4,4', '4,5', '5,5', '6,5', '6,6', '6,7', '7,7', '8,7', '8,8']);
  const STONES = [   // [x, y, 真/假, 沉在水下]
    [4, 4, 1, 0], [4, 5, 1, 1], [5, 5, 1, 0], [6, 5, 1, 1], [6, 6, 1, 0], [6, 7, 1, 1], [7, 7, 1, 0], [8, 7, 1, 1], [8, 8, 1, 0],
    [11, 4, 0, 0], [11, 5, 0, 0], [11, 6, 0, 0], [11, 7, 0, 0], [11, 8, 0, 0], [2, 6, 0, 0], [9, 5, 0, 0], [3, 8, 0, 0], [13, 6, 0, 0]
  ];

  /* 新娘潭：队伍从左边山径抬进来，经过石滩，出右下（过新娘桥，往鹿颈） */
  const FPATH = [[0, 4], [1, 4], [1, 5], [2, 5], [2, 6], [3, 6], [3, 7], [4, 7], [4, 8], [5, 8], [6, 8], [7, 8], [8, 8], [9, 8], [10, 8], [11, 8], [12, 8], [12, 9], [12, 10], [12, 11], [12, 12]];
  /* 光绪年间：队伍从下面抬上来，沿石滩往左边山径走 */
  const PPATH = FPATH.slice().reverse();

  function placeLine(S, ids, path, p) {
    ids.forEach((id, i) => {
      const e = S.ent(id); if (!e) return;
      const s = p - i;
      if (s < 0 || s > path.length - 1) { e.hidden = true; return; }
      const a = Math.floor(s), b = Math.min(path.length - 1, a + 1), k = s - a, A = path[a], B = path[b];
      e.hidden = false; e.alpha = e.alpha ?? 1;
      e.px = (A[0] + (B[0] - A[0]) * k) * TS; e.py = (A[1] + (B[1] - A[1]) * k) * TS;
      e.x = Math.round(e.px / TS); e.y = Math.round(e.py / TS);
      if (B[0] !== A[0] || B[1] !== A[1]) e.dir = B[0] > A[0] ? 2 : B[0] < A[0] ? 1 : B[1] > A[1] ? 0 : 3;
      e.fr = [1, 0, 3, 0][Math.floor(s * 4) % 4];
    });
  }
  async function march(S, ids, path, from, to, spd = 2.6) {
    let p = from;
    while (p < to) { p = Math.min(to, p + spd * .05); placeLine(S, ids, path, p); await S.wait(50); }
    ids.forEach(id => { const e = S.ent(id); if (e) e.fr = 0; });
    return p;
  }
  /* 唢呐：一小段五声音阶的吹打（双方都听得见） */
  function suona(S, sad) {
    const N = sad ? [523, 466, 392, 349, 392, 311] : [784, 880, 784, 659, 587, 659, 784, 880];
    N.forEach((f, i) => S.tone('sawtooth', f, f * (i % 2 ? 1.015 : .985), sad ? .34 : .2, .035, i * (sad ? .3 : .17), 2600));
    S.tone('square', N[0] / 2, N[0] / 2, sad ? 1.8 : 1.3, .012, 0, 700);
  }

  /* ---------------- 人物 ---------------- */
  function brideX(veil) {
    return function (g, d, fr, G, R) {
      const h = G.hT;
      R(4, h - 2, 8, 2, GOLD); if (d !== 3) { R(5, h - 3, 2, 1, GOLD2); R(9, h - 3, 2, 1, GOLD2); R(3, h, 1, 3, GOLD2); R(12, h, 1, 3, GOLD2); }
      if (veil) {
        if (d === 0) { R(3, h - 1, 10, 9, RED); R(4, h, 8, 1, '#c8202a'); R(3, h + 8, 10, 1, GOLD); R(4, h + 9, 1, 1, GOLD); R(7, h + 9, 2, 1, GOLD); R(11, h + 9, 1, 1, GOLD); }
        else if (d === 1) { R(3, h - 1, 9, 9, RED); R(3, h + 8, 9, 1, GOLD); R(4, h + 9, 1, 1, GOLD); }
        else { R(3, h - 1, 10, 10, RED); R(3, h + 9, 10, 1, GOLD); }
      }
      if (d === 0) { R(6, G.tT + 2, 4, 1, GOLD); R(5, G.tT + 4, 2, 2, GOLD); R(9, G.tT + 4, 2, 2, GOLD); R(4, G.tB + 2, 8, 1, GOLD); R(5, G.tB + 3, 1, 1, WET); R(10, G.tB + 2, 1, 2, WET); }
      else if (d === 1) { R(6, G.tT + 3, 3, 1, GOLD); R(5, G.tB + 2, 6, 1, GOLD); R(4, G.tB + 3, 1, 2, WET); }
    };
  }
  function minX(g, d, fr, G, R) {
    const C = '#e0b040';
    if (d === 0) { R(5, G.tT + 2, 2, 2, C); R(9, G.tT + 4, 2, 2, C); R(4, G.tB + 1, 8, 1, C); R(6, G.tB + 3, 1, 2, C); R(9, G.tB + 2, 1, 2, C); R(10, G.hT - 1, 2, 2, GOLD2); R(4, G.hT - 1, 2, 2, '#e83a4a'); }
    else if (d === 1) { R(6, G.tT + 3, 2, 2, C); R(4, G.tB + 1, 7, 1, C); R(10, G.hT - 1, 2, 2, '#e83a4a'); }
    else R(6, G.hT - 2, 4, 1, GOLD2);
  }
  function camX(g, d, fr, G, R) {
    if (d === 0) { R(5, G.tT + 2, 5, 3, '#18181c'); R(7, G.tT + 3, 2, 1, '#6a7a9a'); R(5, G.tT, 1, 2, '#18181c'); R(10, G.tT, 1, 2, '#18181c'); }
    else if (d === 1) { R(3, G.tT + 2, 3, 3, '#18181c'); R(3, G.tT + 3, 1, 1, '#6a7a9a'); }
  }
  /* 轿夫、唢呐手、灯笼手：红衣、瓜皮红帽、脸色发青 */
  function bearer(kind, ghost) {
    return {
      key: 'bp-' + kind + (ghost ? 'g' : 'a'), skin: ghost ? '#b8c0b6' : '#d8a87e', hair: '#141010', hs: 'queue',
      top: ghost ? '#7a1418' : '#a8202a', top2: GOLD, bottom: '#2a1a1a', shoes: '#1a1010', ghost, hat: 'qing', hatC: ghost ? '#5a0e12' : '#8a1a1e', eye: ghost ? '#050505' : '#1a1214',
      extra(g, d, fr, G, R) {
        if (d === 0) { R(4, G.tT + 5, 8, 1, GOLD); if (ghost) { R(6, G.hT + 4, 1, 2, '#000'); R(9, G.hT + 4, 1, 2, '#000'); R(5, G.hT + 6, 6, 1, 'rgba(90,110,100,.6)'); } }
        else if (d === 1) R(5, G.tT + 5, 6, 1, GOLD);
        if (kind === 'sn') {
          if (d === 0) { R(7, G.hT + 6, 2, 4, '#b8903a'); R(5, G.hT + 10, 6, 2, '#e0b850'); }
          else if (d === 1) { R(1, G.hT + 5, 4, 1, '#b8903a'); R(0, G.hT + 4, 2, 3, '#e0b850'); }
        }
        if (kind === 'lt') {
          if (d === 3) { R(12, G.tT - 4, 1, 10, '#3a2a1a'); R(11, G.tT - 7, 4, 4, '#d02028'); }
          else if (d === 1) { R(2, G.tT - 4, 1, 10, '#3a2a1a'); R(0, G.tT - 7, 4, 4, '#d02028'); R(0, G.tT - 6, 4, 1, GOLD2); }
          else { R(12, G.tT - 4, 1, 10, '#3a2a1a'); R(11, G.tT - 7, 4, 4, '#d02028'); R(11, G.tT - 6, 4, 1, GOLD2); }
        }
        if (kind === 'jf') { if (d === 0 || d === 3) { R(2, G.tT + 1, 1, 6, '#4a2a18'); R(13, G.tT + 1, 1, 6, '#4a2a18'); } }
      }
    };
  }

  /* ---------------- 剧情小工具 ---------------- */
  function light(S) {
    const ph = S.f.ph, m = S.map;
    if (m === 'carpark') { S.dark(ph === 'day' || ph === 'day2' ? .22 : .8); S.amb(ph === 'day' || ph === 'day2' ? 'river' : 'night'); }
    if (m === 'pool') { S.dark(ph === 'shoot' ? .42 : ph === 'good' ? .3 : .84); }
  }

  const caughtProc = async S => {
    S.f.procOn = false;
    await S.scare('face', { face: 'porterface', sfx: 'scream' });
    await S.die('一根冰冷的轿杠横着撞上了你的胸口。\n你脚下一空，被人一左一右架了起来——红衣的轿夫们没有看你，脚步一下也没有停。\n唢呐吹得好欢喜。', '你挡了迎亲的路');
  };

  defChapter({
    id: 'bridepool', n: 9, title: '新娘潭', sub: '黄昏的山涧，夜里有人吹唢呐。听见了，不要回头，不要应声。', origin: '香港新界都市传说', color: '#164338',
    icon: '@bride', amb: 'river', floor: 'granite', wall: 'stone', dark: .8, plr: 3,
    endings: { good: '送嫁', sedan: '被请上花轿', answer: '应了一声' },
    people: {
      me: { skin: '#f0c8a0', hair: '#1e1614', hs: 'bob', top: '#2f7a86', top2: '#d8e4e0', bottom: '#3a3a44', shoes: '#c84a3a' },
      min: { key: 'bp-min', skin: '#f4d2b4', hair: '#140e0e', hs: 'bun', top: '#b81e26', top2: '#e0b040', bottom: '#b81e26', robe: true, shoes: '#b81e26', blush: '#f0a0a0', mouth: '#c0404a', extra: minX },
      hei: { key: 'bp-hei', skin: '#d8a880', hair: '#1a1410', hs: 'messy', hat: 'cap', hatC: '#2a2a30', top: '#6a6e4a', top2: '#3a3a2a', bottom: '#2a2e38', shoes: '#4a4a4a', extra: camX },
      bak: { skin: '#b88058', hair: '#c8c8c4', hs: 'short', hat: 'straw', hatC: '#c9a35a', top: '#e8e4d8', top2: '#d0ccc0', bottom: '#2e3a4a', shoes: '#2a2a2a' },
      bride: { key: 'bp-bride', skin: '#e2dcd2', hair: '#0c0808', hs: 'long', top: '#a8121c', top2: GOLD, robe: true, ghost: true, extra: brideX(true) },
      bride2: { key: 'bp-bride2', skin: '#efe0d0', hair: '#0c0808', hs: 'bun', top: '#b8141e', top2: '#e0b040', robe: true, ghost: true, blush: '#e8a0a0', mouth: '#b02030', extra: brideX(false) },
      xiu: { key: 'bp-xiu', skin: '#f0dcc8', hair: '#0c0808', hs: 'long', top: '#c8141e', top2: GOLD, robe: true, shoes: '#c8141e', extra: brideX(true) },
      ximiang: { key: 'bp-xm', skin: '#f0c8a0', hair: '#1a1010', hs: 'bun', top: '#d86a7a', top2: '#f0e0e0', bottom: '#5a3a4a', robe: true, shoes: '#3a2020',
        extra(g, d, fr, G, R) { if (d !== 3) R(d === 0 ? 10 : 9, G.hT - 1, 2, 2, '#e83a4a'); } },
      meipo: { key: 'bp-mp', skin: '#e8c4a4', hair: '#2a2020', hs: 'bun', top: '#6a2a4a', top2: '#d8a830', bottom: '#3a2030', robe: true, shoes: '#2a1a1a', mouth: '#b03040',
        extra(g, d, fr, G, R) { if (d === 0) { R(9, G.hT + 6, 1, 1, '#1a1010'); R(10, G.hT - 2, 3, 2, '#e83a4a'); } else if (d === 1) R(9, G.hT - 2, 3, 2, '#e83a4a'); } },
      jf: bearer('jf', true), sn: bearer('sn', true), lt: bearer('lt', true),
      jf2: bearer('jf', false), sn2: bearer('sn', false)
    },
    faces: {
      brideface(R, a, t) {
        R(0, 0, 32, 32, '#0a0405');
        R(6, 1, 20, 4, '#c8962a'); R(8, 0, 4, 2, GOLD2); R(14, 0, 4, 2, GOLD2); R(20, 0, 4, 2, GOLD2);
        for (let i = 0; i < 9; i++) R(7 + i * 2, 5, 1, 2 + (i % 2), GOLD2);
        R(3, 4, 6, 28, '#9a0e16'); R(23, 4, 6, 28, '#9a0e16'); R(4, 5, 2, 26, '#b8141e'); R(26, 5, 2, 26, '#b8141e');
        R(9, 6, 14, 20, '#d6d8cf'); R(10, 26, 12, 3, '#c8cac0');
        R(9, 6, 3, 13, '#141010'); R(20, 6, 3, 15, '#141010'); R(12, 6, 8, 3, '#141010'); R(14, 9, 1, 6, '#141010');
        const eh = 3 + Math.round(a * 3); R(12, 13, 3, eh, '#000'); R(18, 13, 3, eh, '#000'); R(13, 14, 1, 1, '#8a0a0a'); R(19, 14, 1, 1, '#8a0a0a');
        const mh = 1 + Math.round(a * 4); R(13, 21, 7, 1, '#8a1a1a'); R(14, 22, 5, mh, '#2a0406');
        for (let i = 0; i < 5; i++) R(10 + i * 3, 26 + ((t * 20 + i * 7) % 6), 1, 2, WET);
      },
      porterface(R, a, t) {
        R(0, 0, 32, 32, '#060404'); R(6, 3, 20, 6, '#5a0e12'); R(14, 1, 4, 2, '#c8202a');
        R(8, 9, 16, 17, '#aab4aa'); R(8, 26, 16, 3, '#98a298'); R(8, 9, 16, 2, '#1a1414');
        R(11, 14, 3, 3, '#000'); R(18, 14, 3, 3, '#000');
        const m = Math.round(a * 3); R(11, 21, 10, 1, '#3a1010'); R(12, 22, 8, 1 + m, '#1a0a0a');
        R(4, 25, 24, 7, '#7a1418'); R(4, 25, 24, 1, GOLD);
      }
    },
    items: {
      water: { name: '两樽蒸馏水', desc: '阿伯档口买的，一樽十蚊。瓶身上凝了一层水珠，冻冰冰的。' },
      reflector: { name: '反光板', desc: '阿希的折叠反光板，银色那面亮得照得见人。' },
      lamp: { name: '头灯', desc: '阿希的头灯。光圈不大，照出去全是雾。' },
      flower: { name: '小敏的头花', desc: '裙褂配的红绢头花，湿透了，摸上去像刚从水里捞起来。' },
      mirror: { name: '铜镜', desc: '巴掌大的旧铜镜，背面铸着一对鸳鸯。镜面磨得发亮，照出来的东西比真的暗一点。' },
      net: { name: '捞叶网', desc: '阿伯平时用来捞溪里落叶的长柄网，竹柄磨得光滑。' },
      shoe: { name: '红绣花鞋', desc: '一只很小的红绣花鞋，鞋面绣着并蒂莲。在水底泡了一百多年，丝线的颜色还是那么红。' }
    },
    notes: {
      post: { title: '小敏手机上的讨论区帖子', text: '【求助】下个月摆酒，想去新娘潭影裙褂相，会唔会好唔吉利？\n\n#1 楼主：个名好浪漫呀，仲有瀑布，男朋友话无所谓，问下大家意见。\n\n#2：清朝有顶花轿经过，轿夫跣脚，新娘连人带轿跌落个潭度浸死咗，所以先叫新娘潭。你话吉唔吉利？\n\n#3：唔止。上面仲有个照镜潭，话新娘上轿前喺嗰度照过镜。有人见过潭边企住个女人，水入面冇佢个倒影。\n\n#4：我阿爸讲，以前有人喺个潭度见到一对脚，着住红鞋。\n\n#5：夜晚入面吹吹打打，好似有人娶老婆，但系一个人都见唔到。听到就唔好回头，唔好应。\n\n#6：我朋友揸电单车经过新娘潭路，倒后镜见到车尾坐多咗一个人。\n\n#7：另一个版本话系一对新婚夫妇喺度阴阳相隔，唔系单单新娘。\n\n#8：四大鬼域之首呀大佬。成日有人出事，玄学佬话佢搵替身。\n\n#9：讲真，出事系因为啲石湿滑、落雨水急、条路弯多。日头去，唔好落水，天黑前走，乜都冇事。\n\n#10 楼主：多谢晒。我哋会日头去㗎啦！' },
      stele: { title: '新娘桥旁的石碑', text: '（石碑上的字被风雨蚀得只剩一半，你借着夕阳一个字一个字地辨认）\n\n光绪□□年七月，乌蛟腾谢氏女于归鹿颈陈门。\n是日大雨，山溪暴涨。\n花轿行至潭上，石滑，轿夫失足，\n新人坠潭，殁焉。\n\n乡人哀之，名其潭曰新娘。\n复于溪上架石为桥，以利往来，\n毋使后之嫁娶者，再蹈斯险。\n\n（碑脚有人摆了一对小红蜡烛，烧剩半截。）' },
      diary: { title: '泡过水的簿仔', text: '（土地公神台底下压着一本旧簿仔，字迹歪歪斜斜）\n\n我系谢家嫁女那天，抬前杠的。\n那块石，我行过一百次。那日落雨，我跣咗。\n秀姑娘跌落水之前，掀开轿帘望咗我一眼。\n佢冇叫。\n\n之后每年七月，夜晚山入面都有吹打声。佢哋仲系由照镜潭抬落嚟，抬去新娘潭，抬去鹿颈。\n抬唔到。\n\n听老人家讲：\n听见唢呐，莫回头，莫应声。\n见到轿行过，让路，面朝山壁企定，莫望轿。\n挡佢条路嘅人，会被一齐抬走。\n应咗声嘅人，佢哋会当你系新娘，请你上轿。\n\n秀姑娘上轿前喺照镜潭照过镜，个铜镜跌咗落潭。\n佢有一只绣花鞋，沉喺新娘潭底。\n一只脚光住，佢点行得到夫家？\n\n我老咯，落唔到水。\n边个后生仔见到呢本嘢，替我还返俾佢。\n\n（最后一页，另一个人的笔迹：「阿爷，今年我又嚟上香。」）' },
      gengtie: { title: '庚帖', text: '（镜匣里垫着一张对折的红纸，墨迹化开了一点）\n\n坤造　谢氏　秀\n生于同治□年□月□日□时\n年方十七\n许配鹿颈陈门为室\n天作之合　百年偕老\n\n（红纸背面，有人用很小很小的字写着）\n\n阿妈话，上咗轿就唔好回头。\n回头，就嫁唔出。\n\n轿行到潭边，我好惊，我回咗头。' }
    },
    legend: '新娘潭位于香港新界东北的船湾郊野公园，是一条有好几级瀑布和深潭的山溪，也是著名的烧烤和行山地点。关于它的名字，流传最广的说法是：清朝时（也有人说是民国初年），一顶花轿从乌蛟腾一带抬往鹿颈，路过潭边时正逢雨后，山石湿滑，一名轿夫失足，花轿翻侧，新娘跌进瀑布下的深潭溺死，水潭从此被叫作「新娘潭」。据说村民后来在溪上修了一道石桥，好让日后嫁娶的人平安经过。另一个版本则说，在这里阴阳相隔的是一对新婚夫妇。\n\n附近还有一个「照镜潭」，潭水平静如镜。一种说法是新娘出嫁前在这里梳妆照镜；另一种说法更阴森：有人看见潭边站着一个女人，水里却没有她的倒影，这个潭才因此得名。\n\n几十年来，关于这里的传闻越来越多：夜里听见吹吹打打的迎亲乐声，四周却不见人；有人在水里看见一双穿红鞋的脚；骑电单车经过新娘潭路，发现车尾多了一个人……它常被列为香港的「四大鬼域」之一，也有人说这里的意外是冤魂在「找替身」。这些都属于都市传说。真实的情况是：山溪雨后水势湍急、石面湿滑，郊野公园里的失足和遇溺事故确实时有发生——日间前往、不要擅自下水、天黑前离开，比任何禁忌都管用。\n\n「夜里听见唢呐不要回头、不要应声」，是华南民间关于夜行的常见忌讳之一：有人在背后叫你的名字，不要应。旧时婚俗里也有「新娘上轿不回头」的讲究。本章把这两条揉进了新娘潭的故事。\n\n（本章中的新娘谢秀、她的庚帖、轿夫的手记、铜镜与绣花鞋、每年七月抬轿的说法，以及所有人物和结局，均为游戏虚构。）',
    start: { map: 'carpark', x: 10, y: 8, dir: 3 },
    async intro(S) {
      await S.card('第九夜　新娘潭', '2011年9月　香港新界　船湾郊野公园', '小敏下个月结婚。\n婚纱照要影两套：一套白纱，在海边；\n一套大红裙褂——\n\n「去新娘潭啦。个名咁啱，几有意思呀。」\n\n我是她的姊妹。成个袋，都是我孭。');
    },
    resume: {
      trail: async S => { procReset(S); },
      final: async S => { await finale(S); }
    },
    sprites: {
      fall(g, e, t, R) {
        R(2, -6, 60, 46, '#2c5a54');
        for (let x = 2; x < 62; x += 2) { const ph = (t * 60 + hash(x, 1, 3) * 40) % 46; R(x, -6 + ph, 2, 8, 'rgba(220,240,235,.5)'); R(x, -6 + ((ph + 23) % 46), 1, 5, 'rgba(180,220,215,.35)'); }
        R(0, 36, 64, 4, 'rgba(230,245,240,.55)');
        for (let i = 0; i < 8; i++) R((hash(i, 2, 5) * 60) | 0, 34 + Math.sin(t * 6 + i) * 2, 3, 2, 'rgba(240,250,250,.7)');
      },
      huajiao(g, e, t, R) {
        const b = e.still ? 0 : (Math.sin(t * 7) > 0 ? 1 : 0), tl = e.tilt ? 4 : 0, y0 = b + (e.tilt ? 3 : 0), vert = e.dir === 0 || e.dir === 3;
        if (vert) { R(0 + tl, -14 + y0, 2, 44, '#3a1a10'); R(14 + tl, -14 + y0, 2, 44, '#3a1a10'); }
        else R(-14, 4 + y0, 44, 2, '#3a1a10');
        box(R, 1 + tl, -12 + y0, 14, 24, '#a8141c');
        R(2 + tl, -11 + y0, 12, 1, GOLD); R(2 + tl, 9 + y0, 12, 1, GOLD); R(1 + tl, -2 + y0, 1, 10, '#7a0a10'); R(14 + tl, -2 + y0, 1, 10, '#7a0a10');
        R(-1 + tl, -16 + y0, 18, 4, '#6a0a10'); R(0 + tl, -17 + y0, 16, 1, GOLD); R(6 + tl, -21 + y0, 4, 4, GOLD); R(7 + tl, -23 + y0, 2, 2, GOLD2);
        R(-2 + tl, -13 + y0, 2, 5, GOLD); R(16 + tl, -13 + y0, 2, 5, GOLD);
        if (e.dir !== 3) {
          R(4 + tl, -8 + y0, 8, 15, e.open ? '#120406' : '#c81e28');
          if (!e.open) { const X = 6 + tl, Y = -6 + y0; R(X, Y, 4, 1, GOLD2); R(X, Y + 2, 4, 1, GOLD2); R(X + 1, Y + 1, 2, 1, GOLD2); R(X, Y + 4, 4, 1, GOLD2); R(X, Y + 5, 1, 3, GOLD2); R(X + 3, Y + 5, 1, 3, GOLD2); R(X, Y + 8, 4, 1, GOLD2); }
          else if (e.min) { R(6 + tl, -6 + y0, 4, 4, '#f4d2b4'); R(6 + tl, -7 + y0, 4, 2, '#140e0e'); R(5 + tl, -2 + y0, 6, 8, '#b81e26'); R(7 + tl, -4 + y0, 1, 1, '#1a1214'); R(9 + tl, -4 + y0, 1, 1, '#1a1214'); }
        }
        R(3 + tl, 13 + y0, 10, 2, 'rgba(0,0,0,.35)');
      },
      tstone(g, e, t, R) {
        const ra = e.ra || 0;
        if (!e.sub) { R(2, 4, 12, 8, '#5a5e58'); R(3, 3, 10, 2, '#6e726a'); R(4, 5, 4, 2, '#7e827a'); R(2, 11, 12, 1, '#2a2e2a'); }
        else R(5, 8, 6, 1, 'rgba(120,170,160,.1)');
        if (ra > 0 && e.real) {
          const A = g.globalAlpha; g.globalAlpha = A * ra;
          R(2, 12, 12, 4, 'rgba(150,190,180,.55)'); R(3, 12, 10, 1, 'rgba(200,230,220,.55)');
          if (e.sub) { R(2, 4, 12, 8, 'rgba(140,190,180,.42)'); R(3, 4, 10, 1, 'rgba(215,240,230,.65)'); R(2, 4, 1, 8, 'rgba(215,240,230,.5)'); R(13, 4, 1, 8, 'rgba(215,240,230,.5)'); }
          g.globalAlpha = A;
        }
      },
      jingshi(g, e, t, R) { R(1, 4, 14, 9, '#767a72'); R(2, 3, 12, 2, '#8a8e86'); R(3, 6, 8, 3, '#9aa098'); R(4, 6, 3, 1, '#c8d0c8'); R(1, 12, 14, 1, '#3a3e3a'); if (!e.read) R(7, -2 + (Math.sin(t * 4) > 0 ? 1 : 0), 2, 2, '#ffe680'); },
      jingxia(g, e, t, R) { box(R, 2, 5, 12, 9, '#5a2a18'); R(3, 6, 10, 1, '#7a3a20'); R(7, 8, 2, 2, GOLD); if (e.open) { R(2, 1, 12, 5, '#3a1a10'); R(4, 2, 8, 3, '#2a1a10'); R(4, 9, 8, 1, '#b8141c'); } },
      bigrock(g, e, t, R) { R(1, -3, 30, 17, '#4e524c'); R(3, -5, 24, 4, '#5e625a'); R(6, -2, 10, 3, '#6e726a'); R(1, 13, 30, 2, '#262a26'); R(20, 2, 6, 1, '#3a3e3a'); R(4, 6, 5, 2, '#3d5a3a'); },
      bbq(g, e, t, R) { box(R, 1, 4, 14, 10, '#7a7a76'); R(2, 5, 12, 3, '#2a2a2a'); for (let i = 0; i < 6; i++) R(3 + i * 2, 5, 1, 3, '#8a8a8a'); if (e.lit) { R(4, 6, 8, 1, '#c84a1a'); R(6 + (Math.sin(t * 8) > 0 ? 1 : 0), 4, 2, 1, '#ff8a3a'); } },
      board(g, e, t, R) { R(2, 0, 2, 15, '#5a3a22'); R(12, 0, 2, 15, '#5a3a22'); box(R, 0, -12, 16, 13, '#2e5a3a'); R(2, -10, 12, 2, '#e8e0c8'); R(2, -7, 8, 1, '#c8d0c0'); R(2, -5, 10, 1, '#c8d0c0'); R(2, -3, 6, 1, '#c8d0c0'); R(11, -6, 3, 3, '#b83a2a'); },
      stele(g, e, t, R) { R(3, -6, 10, 20, '#6a6a62'); R(4, -7, 8, 2, '#7a7a72'); R(4, -5, 8, 17, '#7d7d74'); for (let i = 0; i < 5; i++) { R(6, -3 + i * 3, 1, 2, '#4a4a44'); R(9, -3 + i * 3, 1, 2, '#4a4a44'); } R(2, 13, 12, 2, '#3a3a36'); R(4, 11, 1, 3, '#e8e0c8'); R(11, 11, 1, 3, '#e8e0c8'); R(4, 10, 1, 1, '#c84a3a'); R(11, 10, 1, 1, '#c84a3a'); },
      tudi(g, e, t, R) { R(0, -5, 16, 3, '#5a2a1a'); R(-1, -6, 18, 1, '#7a3a22'); box(R, 1, -2, 14, 16, '#8a7a66'); R(4, 0, 8, 8, '#2a1a10'); R(6, 2, 4, 5, '#c84030'); R(5, 9, 6, 2, '#6a4a2a'); R(7, 9, 1, 3, '#a03020'); R(9, 9, 1, 3, '#a03020'); R(7, 6 + Math.sin(t * 2), 1, 2, 'rgba(220,220,220,.4)'); },
      glint(g, e, t, R) { const b = (Math.sin(t * 3) + 1) / 2; R(5, 7, 6, 3, `rgba(200,30,40,${.3 + b * .35})`); R(6, 6, 3, 1, `rgba(240,200,80,${.25 + b * .4})`); if (b > .7) R(9, 5, 1, 1, '#fff6c0'); },
      lnet(g, e, t, R) { R(3, -14, 1, 28, '#9a8a5a'); R(4, -14, 1, 28, '#6a5a3a'); R(0, -21, 9, 8, 'rgba(70,100,70,.85)'); R(1, -20, 7, 6, 'rgba(30,50,30,.7)'); R(0, -21, 9, 1, '#9a8a5a'); },
      reflector(g, e, t, R) { R(7, 6, 2, 9, '#333'); R(4, 14, 8, 1, '#333'); R(2, -6, 12, 12, '#a8a8a8'); R(3, -5, 10, 10, '#e8e8e0'); R(5, -3, 4, 2, '#fff'); },
      tripod(g, e, t, R) { R(7, -2, 2, 12, '#222'); R(3, 9, 2, 6, '#222'); R(11, 9, 2, 6, '#222'); R(7, 10, 2, 5, '#222'); R(4, -6, 8, 5, '#18181c'); R(10, -5, 3, 3, '#3a4a6a'); if (e.lit) R(4, -8, 4, 2, '#fff'); },
      bag(g, e, t, R) { box(R, 3, 3, 10, 12, '#c84a3a'); R(5, 5, 6, 3, '#a03a2a'); R(4, 1, 8, 3, '#8a3020'); R(4, 10, 8, 1, '#e8e0c8'); },
      hflower(g, e, t, R) { R(5, 8, 6, 4, '#c81e28'); R(6, 7, 4, 1, '#e83a4a'); R(7, 9, 2, 2, GOLD2); R(10, 11, 3, 1, '#8a1a1a'); },
      brider(g, e, t, R) { const w = Math.sin(t * 2) > 0 ? 1 : 0; R(5 + w, 0, 6, 9, 'rgba(168,18,28,.5)'); R(4, 9, 8, 2, 'rgba(168,18,28,.45)'); R(4 + w, 11, 8, 5, 'rgba(176,16,24,.55)'); R(5, 15, 6, 1, 'rgba(216,168,48,.45)'); R(0, 7, 16, 1, 'rgba(200,230,225,.12)'); },
      redbits(g, e, t, R) { for (let i = 0; i < 6; i++) R((hash(e.x, e.y, i) * 13) | 0, (hash(e.y, e.x, i + 5) * 13) | 0, 2, 1 + (i % 2), i % 3 ? '#a8141c' : GOLD); },
      marker(g, e, t, R) { R(5, -2, 6, 16, '#c8c4b4'); R(5, -2, 6, 2, '#2a6a3a'); R(6, 3, 4, 1, '#3a3a3a'); R(6, 5, 4, 1, '#3a3a3a'); R(6, 7, 3, 1, '#3a3a3a'); R(4, 14, 8, 1, '#3a3a36'); },
      kiosk(g, e, t, R) {
        R(-2, -14, 36, 5, '#2a6a4a'); for (let i = 0; i < 6; i++) R(-2 + i * 6, -9, 3, 2, '#3a8a5a');
        R(0, -9, 2, 23, '#4a3420'); R(30, -9, 2, 23, '#4a3420'); box(R, 0, 2, 32, 12, '#6a4a30');
        if (e.off) { R(2, -8, 28, 10, '#6a6e72'); for (let y = -7; y < 2; y += 2) R(2, y, 28, 1, '#4a4e52'); }
        else { R(4, -2, 4, 4, '#4a8ac8'); R(9, -2, 3, 4, '#e8e8e8'); R(13, -2, 3, 4, '#c8a050'); R(20, -1, 8, 3, '#e8d8a8'); R(22, -3, 4, 2, '#f0f0e8'); }
      },
      offer(g, e, t, R) { R(2, 8, 5, 4, '#c81e28'); R(2, 7, 4, 1, GOLD); R(8, 4, 6, 7, '#a07a3a'); R(9, 5, 4, 5, '#d8c890'); R(10, 6, 1, 1, '#fff'); }
    },
    tiles: {
      jadew: { solid: true, paint(R, X, Y) { R(0, 0, 16, 16, '#0d3a33'); for (let i = 0; i < 3; i++) R((hash(X, Y, 20 + i) * 12) | 0, (hash(X, Y, 30 + i) * 14) | 0, 4, 1, '#1b5a4e'); if (hash(X, Y, 9) < .2) R(3, 9, 2, 1, '#2a7a68'); } },
      jadeo: { solid: false, paint(R, X, Y) { R(0, 0, 16, 16, '#215a4e'); for (let i = 0; i < 4; i++) R((hash(X, Y, 40 + i) * 14) | 0, (hash(X, Y, 50 + i) * 14) | 0, 2, 2, i % 2 ? '#4a6a5a' : '#3a5048'); R((hash(X, Y, 60) * 12) | 0, (hash(X, Y, 61) * 14) | 0, 3, 1, '#3a8070'); } },
      granite: { solid: false, paint(R, X, Y) { speck(R, '#55584f', ['#62655c', '#484b44', '#5d6056'], X, Y, 16, 21); if (hash(X, Y, 22) < .3) R(2, (hash(X, Y, 23) * 12) | 0, 7, 1, '#3c3f38'); if (hash(X, Y, 24) < .25) R((hash(X, Y, 25) * 12) | 0, 2, 3, 2, '#3d5a3a'); } },
      cliffq: { solid: true, paint(R, X, Y) { R(0, 0, 16, 16, '#2c2e2a'); for (let r = 0; r < 4; r++) R(0, r * 4 + ((X + r) % 2), 16, 1, '#1e201c'); R((hash(X, Y, 26) * 10) | 0, (hash(X, Y, 27) * 12) | 0, 5, 2, '#3a3d36'); if (hash(X, Y, 28) < .35) R((hash(X, Y, 29) * 12) | 0, (hash(X, Y, 30) * 12) | 0, 3, 2, '#2e4a2e'); } },
      tanw: { solid: false, paint(R, X, Y) { R(0, 0, 16, 16, '#0a2e2a'); if (hash(X, Y, 31) < .35) R((hash(X, Y, 32) * 12) | 0, (hash(X, Y, 33) * 14) | 0, 4, 1, '#174a42'); if (hash(X, Y, 34) < .12) R((hash(X, Y, 35) * 14) | 0, (hash(X, Y, 36) * 14) | 0, 1, 1, '#bfd8d0'); } },
      nook: { solid: false, paint(R, X, Y) { speck(R, '#55473a', ['#62523f', '#463a2c'], X, Y, 14, 46); R(0, 0, 16, 2, '#6e6e66'); R(1, 2, 3, 2, '#7e7e76'); R(12, 12, 3, 3, '#6e6e66'); R(5, 13, 2, 2, '#7a7a72'); } },
      trailp: { solid: false, paint(R, X, Y) { speck(R, '#4a3a2a', ['#58462f', '#3b2e21', '#6a5a44'], X, Y, 18, 41); if (hash(X, Y, 42) < .3) R((hash(X, Y, 43) * 12) | 0, (hash(X, Y, 44) * 12) | 0, 3, 2, '#6a6a62'); } }
    },
