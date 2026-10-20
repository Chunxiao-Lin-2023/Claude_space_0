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

  /* fade = [s0, s1]：在路径 s0 处从雾里淡入，到 s1 处淡出（山径上的队伍用） */
  function placeLine(S, ids, path, p, fade) {
    ids.forEach((id, i) => {
      const e = S.ent(id); if (!e) return;
      const s = p - i;
      if (s < 0 || s > path.length - 1 || (fade && (s < fade[0] || s > fade[1]))) { e.hidden = true; return; }
      const a = Math.floor(s), b = Math.min(path.length - 1, a + 1), k = s - a, A = path[a], B = path[b];
      e.hidden = false; e.alpha = fade ? Math.max(0, Math.min(1, (s - fade[0]) / 2, (fade[1] - s) / 2)) : (e.alpha ?? 1);
      e.px = (A[0] + (B[0] - A[0]) * k) * TS; e.py = (A[1] + (B[1] - A[1]) * k) * TS;
      e.x = Math.round(e.px / TS); e.y = Math.round(e.py / TS);
      if (B[0] !== A[0] || B[1] !== A[1]) e.dir = B[0] > A[0] ? 2 : B[0] < A[0] ? 1 : B[1] > A[1] ? 0 : 3;
      e.fr = [1, 0, 3, 0][Math.floor(s * 4) % 4];
    });
  }
  /* 剧本里的行进：MARCH 让地图 tick 每帧补上走路帧（引擎每帧会把没在 mv 的实体 fr 清零） */
  let MARCH = null;
  async function march(S, ids, path, from, to, spd = 2.6) {
    let p = from; MARCH = { ids, path, p };
    try { while (p < to) { p = Math.min(to, p + spd * .05); MARCH.p = p; placeLine(S, ids, path, p); await S.wait(50); } }
    finally { MARCH = null; }
    ids.forEach(id => { const e = S.ent(id); if (e) e.fr = 0; });
    return p;
  }
  function marchFrames(S) { if (MARCH) placeLine(S, MARCH.ids, MARCH.path, MARCH.p); }
  /* 唢呐：一小段五声音阶的吹打（双方都听得见）；v = 音量倍数（队伍越近越响） */
  function suona(S, sad, v = 1) {
    const N = sad ? [523, 466, 392, 349, 392, 311] : [784, 880, 784, 659, 587, 659, 784, 880];
    N.forEach((f, i) => S.tone('sawtooth', f, f * (i % 2 ? 1.015 : .985), sad ? .34 : .2, .035 * v, i * (sad ? .3 : .17), 2600));
    S.tone('square', N[0] / 2, N[0] / 2, sad ? 1.8 : 1.3, .012 * v, 0, 700);
  }
  /* 包了红布的锣：闷、低、尾音往下掉 */
  function gong(S, v = 1) {
    S.tone('triangle', 210, 186, 1.3, .07 * v, 0, 1200);
    S.tone('square', 105, 96, .9, .02 * v, 0, 500);
    S.tone('sine', 422, 380, .5, .02 * v, .01, 1600);
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
    if (m === 'pool') { S.dark(ph === 'shoot' ? .42 : ph === 'good' ? .62 : .84); }
  }

  const caughtProc = async S => {
    S.f.procOn = false; S.lights(null);
    await S.scare('face', { face: 'porterface', sfx: 'scream' });
    await S.die('一根冰冷的轿杠横着撞上了你的胸口。\n你脚下一空，被人一左一右架了起来——红衣的轿夫们没有看你，脚步一下也没有停。\n唢呐吹得好欢喜。', '你挡了迎亲的路');
  };

  defChapter({
    id: 'bridepool', n: 9, title: '新娘潭', sub: '黄昏的山涧，夜里有人吹唢呐。听见了，不要回头，不要应声。', origin: '香港新界都市传说', color: '#164338',
    icon: '@bride', amb: 'river', floor: 'granite', wall: 'stone', dark: .8, plr: 3,
    endings: { good: '送嫁', sedan: '被请上花轿', answer: '应了一声', snatch: '抢轿' },
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
      },
      /* 轿帘掀开一条缝：缝里一只眼睛 */
      slitface(R, a, t) {
        R(0, 0, 32, 32, '#7a0a10'); R(0, 0, 32, 3, '#4a0408'); R(0, 3, 32, 1, GOLD);
        const X = 3, Y = 6; R(X, Y, 4, 1, GOLD2); R(X, Y + 2, 4, 1, GOLD2); R(X + 1, Y + 1, 2, 1, GOLD2); R(X, Y + 4, 4, 1, GOLD2);
        R(25, 6, 4, 1, GOLD2); R(25, 8, 4, 1, GOLD2); R(26, 7, 2, 1, GOLD2); R(25, 10, 4, 1, GOLD2);
        const w = 2 + Math.round(a * 6); R(16 - w, 0, w * 2, 32, '#060203');
        if (w > 3) {
          R(16 - w + 1, 9, w * 2 - 2, 10, '#d6d8cf');
          R(13, 12, 6, 4, '#f0ece0'); R(14, 12, 4, 4, '#000'); R(15, 13, 1, 1, '#8a0a0a');
          R(16 - w + 1, 9, w * 2 - 2, 2, '#141010'); R(16 - w + 1, 19, w * 2 - 2, 1, '#9a9c94');
          for (let i = 0; i < 3; i++) R(14 + i * 2, 20 + ((t * 18 + i * 5) % 8), 1, 2, WET);
        }
        R(0, 28, 32, 4, '#5a0810'); R(0, 28, 32, 1, GOLD);
      },
      /* 水底伸上来的手 */
      handface(R, a, t) {
        R(0, 0, 32, 32, '#06201c'); for (let i = 0; i < 6; i++) R(0, 4 + i * 5 + Math.round(Math.sin(t * 3 + i)), 32, 1, '#0e3a33');
        const y = 30 - Math.round(a * 14);
        R(10, y, 12, 16, '#9a0e16'); R(10, y, 12, 2, GOLD); R(9, y + 2, 1, 14, '#6a0a10');
        R(11, y - 9, 10, 10, '#c8ccc0'); R(12, y - 8, 8, 8, '#d6d8cf');
        for (let i = 0; i < 4; i++) R(11 + i * 3 - (i === 0 ? 1 : 0), y - 16 + (i === 0 || i === 3 ? 3 : 0), 2, 8 - (i === 0 ? 1 : 0), '#d6d8cf');
        R(8, y - 6, 4, 2, '#c8ccc0'); R(7, y - 7, 2, 2, '#d6d8cf');
        for (let i = 0; i < 4; i++) R(11 + i * 3 - (i === 0 ? 1 : 0), y - 16 + (i === 0 || i === 3 ? 3 : 0), 2, 1, '#5a6a64');
        R(0, 26, 32, 6, 'rgba(10,46,42,.85)'); for (let i = 0; i < 5; i++) R(3 + i * 6, 26 + ((t * 10 + i * 3) % 3), 4, 1, 'rgba(200,230,225,.5)');
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
      post: { title: '小敏手机上的讨论区帖子', text: '【求助】下个月摆酒，想去新娘潭影裙褂相，会唔会唔吉利？\n\n#1 楼主：个名好浪漫，仲有瀑布。男朋友话无所谓。\n\n#2：清朝有顶花轿经过，轿夫跣脚，新娘连人带轿跌落潭浸死，所以叫新娘潭。你话吉唔吉利？\n\n#3：上面仲有个照镜潭。有人见过潭边企住个女人，水入面冇佢个倒影。\n\n#4：我阿爸话以前有人喺潭度见到一对脚，着住红鞋。亦有版本话出事嘅系一对新婚夫妇。\n\n#5：夜晚山入面吹吹打打，好似娶老婆，但一个人都见唔到。听到就唔好回头，唔好应。\n\n#6：四大鬼域之首。有人揸电单车经新娘潭路，倒后镜见到车尾多咗个人。玄学佬话佢搵替身。\n\n#7：讲真，出事系因为石滑、落雨水急、路弯多。日头去，唔好落水，天黑前走。\n\n#8 楼主：多谢！我哋日头去㗎！（不过而家七月喎……应该冇所谓啩？）' },
      stele: { title: '新娘桥旁的石碑', text: '（石碑上的字被风雨蚀得只剩一半，你借着夕阳一个字一个字地辨认）\n\n光绪□□年七月，乌蛟腾谢氏女于归鹿颈陈门。\n是日大雨，山溪暴涨。\n花轿行至潭上，石滑，轿夫失足，\n新人坠潭，殁焉。\n\n乡人哀之，名其潭曰新娘。\n复于溪上架石为桥，以利往来，\n毋使后之嫁娶者，再蹈斯险。\n\n　　　　光绪三十二年　丙午　乡人公立\n\n（碑脚有人摆了一对小红蜡烛，烧剩半截。）' },
      diary: { title: '泡过水的簿仔', text: '（土地公神台底下压着一本旧簿仔，字迹歪歪斜斜）\n\n谢家嫁女那天，我抬前杠。\n那块斜石我行过一百次。那日落雨，我跣咗。\n秀姑娘跌落水之前，掀开轿帘望咗我一眼。佢冇叫。\n\n之后每年七月，夜晚山入面都有吹打声。佢哋由照镜潭抬落嚟，抬去新娘潭，抬去鹿颈——抬唔到。\n\n老人家讲：\n听见唢呐，莫回头，莫应声。\n见轿行过，让路，面朝山壁企定，莫望轿。\n挡路嘅，会被一齐抬走；应声嘅，会被当系新娘，请上轿。\n\n秀姑娘上轿前喺照镜潭照过镜，个铜镜跌咗落潭。\n佢一只绣花鞋沉喺新娘潭底。一只脚光住，点行得到夫家？\n我老咯，落唔到水。后生仔，替我还返俾佢。\n\n（最后一页，另一个人的笔迹：「阿爷，今年我又嚟上香。」）' },
      gengtie: { title: '庚帖', text: '（镜匣里垫着一张对折的红纸，墨迹化开了一点）\n\n坤造　谢氏　秀\n生于同治□年□月□日□时\n年方十七\n许配鹿颈陈门为室\n天作之合　百年偕老\n\n（红纸背面，有人用很小很小的字写着）\n\n阿妈话，上咗轿就唔好回头。\n回头，就嫁唔出。\n\n轿行到潭边，我好惊，我回咗头。' }
    },
    legend: '新娘潭位于香港新界东北的船湾郊野公园，是一条有好几级瀑布和深潭的山溪，也是烧烤和行山的热门地点。流传最广的说法是：清朝时（也有人说是民国初年），一顶花轿从乌蛟腾抬往鹿颈，四名轿夫路过潭边时正逢雨后，山石湿滑，一人失足，花轿翻侧，新娘跌进瀑布下的深潭溺死，水潭从此被叫作「新娘潭」。据说村民后来在溪上修了一道石桥，就是今天的新娘桥，有说法称桥建于1906年（光绪三十二年）。另一个版本则说，在这里阴阳相隔的是一对新婚夫妇。\n\n附近还有一个「照镜潭」，潭水平静如镜。一种说法是新娘出嫁前在这里梳妆照镜；另一种说法更阴森：有人看见潭边站着一个女人，水里却没有她的倒影。\n\n几十年来，传闻越积越多：夜里听见吹箫打鼓的迎亲声，四周却不见人；有人在水里看见一双穿红鞋的脚；骑电单车经过新娘潭路，车尾多了一个人……它常被列为香港的「四大鬼域」之一，也有人说这里的意外是冤魂在「找替身」。这些都属于都市传说。真实的情况是：山溪雨后水势湍急、石面湿滑，郊野公园里的失足和遇溺事故确实时有发生——日间前往、不要擅自下水、天黑前离开，比任何禁忌都管用。\n\n「夜里有人在背后叫你，不要应，不要回头」是华南民间常见的夜行忌讳；旧时婚俗讲究「新娘上轿不回头」；农历七月俗称鬼月，传统上不办婚嫁。本章把这几条揉进了新娘潭的故事。\n\n（本章中的新娘谢秀、她的庚帖、轿夫的手记、石碑碑文、铜镜与绣花鞋、每年七月抬轿的说法，以及所有人物和结局，均为游戏虚构。）',
    start: { map: 'carpark', x: 10, y: 8, dir: 3 },
    async intro(S) {
      await S.card('第九夜　新娘潭', '2011年8月（农历七月）　香港新界　船湾郊野公园', '小敏下个月结婚。\n婚纱照要影两套：一套白纱，在海边；\n一套大红裙褂——\n\n「去新娘潭啦。个名咁啱，几有意思呀。」\n\n我是她的姊妹。成个袋，都是我孭。');
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
    maps: {
      /* ---------------- 新娘潭烧烤场 · 停车场 ---------------- */
      carpark: {
        amb: 'river', dark: .22, plr: 3.2, floor: 'dirt',
        legend: { J: 'jadew', j: 'jadeo' },
        tileOpts: { grassC: '#2e4a2a', treeC: '#183a22' },
        rows: [
          'TTTTTTTTTTTTTTTTTTJJTTdTTT',
          'TTTTTTTTTTTTTTTTTTJJTTdTTT',
          'TTB"""""""""""""""jJ"BddTT',
          'TT""""""""""""""""jJ""dBTT',
          'TT""""""""""""""""JJ""dTTT',
          'TT""""""""""""""""Jj"dd"TT',
          'TT"ddddddddddddddkkkkdd""T',
          'TT"d""""""""""""""JJ"""""T',
          'TTBd""""""""""""""jJ"""B"T',
          'TT_d______________JJ"BTTTT',
          'TT::::::::::::::::::::::TT',
          'TT::::::::::::::::::::::TT',
          'TT______________________TT',
          'TTTTTTTTTTTTTTTTTTTTTTTTTT'],
        ents: [
          { x: 22, y: 0, spr: 'invisible', async touch(S) {
            if (S.f.ph === 'day') { S.sfx('locked'); await S.narr('小敏叫你先去士多买水。\n士多在烧烤场左上角，绿色帐篷那里。'); return S.pos(22, 1, 0); }
            await S.go('pool', 12, 11, 3);
          } },
          { id: 'kiosk', x: 4, y: 3, w: 2, spr: 'kiosk', async on(S) {
            if (S.f.ph === 'day' || S.f.ph === 'day2') return bak(S);
            await S.narr('士多落了闸。铁闸上用粉笔写着：「七月　早收」。');
          } },
          { id: 'bak', x: 6, y: 3, spr: '@bak', dir: 0, on: S => bak(S) },
          { id: 'net', x: 21, y: 3, spr: 'lnet', solid: false, async on(S) {
            const ph = S.f.ph;
            if (ph === 'day' || ph === 'day2' || ph === 'shoot') return S.narr('一支长柄捞叶网，插在溪边的石缝里。\n阿伯刚刚用它捞完溪里的落叶，网兜还在滴水。');
            S.hide('net'); S.give('net'); S.f.gotNet = true;
            await S.narr('阿伯的捞叶网，还插在溪边的石缝里。\n竹柄比你还高，网兜上挂着几片湿叶子。');
            if (S.f.ph === 'net') S.goal('带捞叶网回新娘潭，捞起斜石底下的绣花鞋');
          } },
          { x: 2, y: 4, spr: 'barrel', on: S => S.narr('垃圾桶上贴着告示：「请将垃圾带走」。\n旁边堆满了垃圾，还有一束被人扔掉的塑料红花。') },
          { id: 'bbq1', x: 8, y: 4, spr: 'bbq', lit: true, light: { r: 1.4, col: 'rgba(255,120,60,.14)' }, on: S => S.narr(S.f.ph === 'day' || S.f.ph === 'day2' ? '炭还是暖的。铁网上粘着一片烧焦的鸡翼。' : '炉里的炭早就熄了。铁网冰冷冰冷。') },
          { x: 12, y: 4, spr: 'bbq', on: S => S.narr('烧烤炉边上，有人留下了一封没拆的红色利是。\n封面上印着一个金色的「囍」字。') },
          { x: 14, y: 8, spr: 'bbq', on: S => S.narr('这个炉旁边的长凳上刻着：「阿明❤阿芬　1998」。') },
          { id: 'table', x: 6, y: 7, spr: 'table', col: '#6a5a3a', async on(S) {
            if (S.once('phone')) await S.narr('小敏的手机放在枱上，她一定是忘了拿。\n屏幕还亮着，停在一个讨论区的帖子上。');
            await S.note('post');
          } },
          { x: 6, y: 7, spr: 'phone', solid: false, z: 1, oy: -6 },
          { x: 15, y: 5, spr: 'board', on: S => S.narr('绿色的导赏牌：\n「船湾郊野公园　新娘潭自然教育径」\n「相传昔日有一花轿途经此处，轿夫失足，新娘堕潭身亡，故名新娘潭。」\n\n底下一行红字：溪涧湿滑，切勿涉水。') },
          { x: 17, y: 7, spr: 'stele', async on(S) { if (S.once('stele')) await S.narr('新娘桥西头立着一块小石碑，碑脚有人上过香。'); await S.note('stele'); } },
          { x: 20, y: 7, spr: 'sign', col: '#5a3a22', on: S => S.narr('木牌：新娘潭 ↑　照镜潭 ↑\n有人在「照镜」两个字上画了一个红圈。') },
          { x: 19, y: 8, spr: 'invisible', solid: true, on: S => S.narr(S.f.ph === 'day' || S.f.ph === 'day2' ? '溪水清得见底，石头缝里有几条小鱼。\n水是从新娘潭流下来的。' : '黑漆漆的溪水，流得比白天急。\n水声里好像夹着人说话的声音。') },
          { x: 5, y: 9, spr: 'busstop', on: S => S.narr(S.f.ph === 'day' || S.f.ph === 'day2' ? '巴士站牌：275R 假日专线　新娘潭 ⇄ 大埔墟站。\n有人在站牌上用原子笔写：「尾班车好早，唔好等天黑。」' : '尾班车早就走了。站牌在风里轻轻地晃。') },
          { x: 8, y: 9, spr: 'payphone', async on(S) {
            if (S.f.ph === 'day' || S.f.ph === 'day2') return S.narr('公众电话。你口袋里只有八达通。');
            S.sfx('tv');
            await S.narr('你拿起听筒。没有拨号音，只有沙沙的杂音。');
            if (S.once('phoneSuona')) { suona(S, true); await S.narr('……杂音里，很远很远的地方，有人在吹唢呐。\n还有人在笑。'); }
            await S.narr('你把听筒挂了回去。手心全是汗。');
          } },
          { x: 13, y: 10, spr: 'car', col: '#c8c8c0', on: S => S.narr(S.f.ph === 'day' || S.f.ph === 'day2' ? '阿希借来的七人车，车尾箱塞满了灯架和衣袋。' : '车窗上凝了一层水汽。\n有人用手指在上面画了一个「囍」字。\n……从车里面画的。') },
          { x: 2, y: 12, spr: 'streetlamp', light: { r: 4, col: 'rgba(255,220,150,.14)' } },
          { x: 23, y: 12, spr: 'streetlamp', flicker: true, light: { r: 3, col: 'rgba(255,220,150,.12)' } },
          { id: 'min', x: 9, y: 7, spr: '@min', dir: 0, on: S => S.say('小敏', '晴晴，水呀水呀～') },
          { id: 'hei', x: 11, y: 7, spr: '@hei', dir: 1, on: S => S.say('阿希', '快啲啦，光唔等人。') }
        ],
        async enter(S, first) {
          light(S);
          if (first) return opening(S);
          if (S.f.ph !== 'day' && S.f.ph !== 'day2') {
            S.hide('bak'); S.ent('kiosk').off = true; S.ent('bbq1').lit = false; S.ent('bbq1').light = null;
            if (S.once('carNight')) await S.narr('烧烤场一个人也没有。士多落了闸，275R 早就走了。\n只有一盏路灯，在停车场边上一闪一闪。');
          }
        }
      },
      /* ---------------- 新娘潭 ---------------- */
      pool: {
        amb: 'river', dark: .84, plr: 3, floor: 'granite', fog: .14,
        legend: POOL_LEG,
        tileOpts: { grassC: '#24402a', treeC: '#14301c' },
        rows: POOL_ROWS,
        ents: [
          { x: 8, y: 0, w: 4, spr: 'fall', solid: false, light: { r: 3, col: 'rgba(170,230,215,.1)', dy: 30 } },
          { x: 11, y: 3, spr: 'invisible', light: { r: 6, col: 'rgba(150,200,190,.08)' } },
          { x: 0, y: 4, spr: 'invisible', async touch(S) {
            const ph = S.f.ph;
            if (ph === 'day2' || ph === 'shoot') { await S.narr('左边是一条更窄的山径，往山里去。\n阿希还在等你帮手。'); return S.pos(1, 4, 2); }
            if (ph === 'final' || ph === 'good') return S.pos(1, 4, 2);
            if (!S.has('lamp')) { await S.narr('山径里黑得伸手不见五指。\n……先问问阿希。'); return S.pos(1, 4, 2); }
            await S.go('trail', 5, 1, 0);
          } },
          { x: 12, y: 12, spr: 'invisible', async touch(S) {
            if (S.f.ph === 'shoot') { await S.narr('小敏和阿希还在这里。'); return S.pos(12, 11, 3); }
            await S.go('carpark', 22, 1, 0);
          } },
          { id: 'pooleye', x: 10, y: 6, spr: 'invisible', solid: true, on: S => poolEye(S) },
          { x: 15, y: 4, spr: 'invisible', solid: true, on: S => S.narr('瀑布右边的石壁，被水汽打得湿漉漉的。\n石缝里卡着一根褪了色的红绳。') },
          { x: 4, y: 4, spr: 'invisible', solid: true, on: S => S.narr('一块斜斜的大石，一半没在潭里。\n石面被水冲得又光又滑，长着一层薄薄的青苔。') },
          { id: 'glint', x: 5, y: 5, spr: 'glint', hidden: true, solid: true, on: S => glintOn(S) },
          { id: 'reflector', x: 17, y: 4, spr: 'reflector', async on(S) {
            S.hide('reflector'); S.give('reflector');
            await S.narr('阿希的反光板。银色那一面，照出你自己汗湿的脸。');
            S.goal('把反光板交给阿希');
          } },
          { id: 'tripod', x: 15, y: 8, spr: 'tripod', on: S => S.narr(S.f.ph === 'shoot' ? '阿希的三脚架，相机已经架好了。' : '三脚架倒在石头上，镜头盖不知道滚到哪里去了。') },
          { x: 11, y: 9, spr: 'bag', on: S => S.narr('你的背包。里面有纸巾、蚊怕水、小敏的补妆盒、两件雨衣。\n……还有一支打不着的打火机。') },
          { x: 19, y: 7, spr: 'sign', col: '#a83a2a', on: S => S.narr('红色告示牌：「危险！水深！切勿游泳！」\n下面有人用原子笔写了一行小字：「佢喺下面。」') },
          { id: 'flower', x: 16, y: 7, spr: 'hflower', hidden: true, async on(S) {
            S.hide('flower'); S.give('flower');
            await S.narr('小敏的红头花。湿透了，凉得像刚从潭底捞上来。');
          } },
          { id: 'min', x: 18, y: 5, spr: '@min', dir: 1, async on(S) { S.face('min', 'pl'); await S.say('小敏', S.has('reflector') ? '快俾阿希啦，个光就冇喇！' : '晴晴，帮手拎反光板啦～'); } },
          { id: 'hei', x: 16, y: 8, spr: '@hei', dir: 3, on: S => hei(S) },
          { id: 'fp0', x: 0, y: 4, spr: '@lt', hidden: true, solid: false, light: { r: 2.6, col: 'rgba(255,60,50,.24)', flick: true } },
          { id: 'fp1', x: 0, y: 4, spr: '@sn', hidden: true, solid: false },
          { id: 'fp2', x: 0, y: 4, spr: '@jf', hidden: true, solid: false },
          { id: 'fp3', x: 0, y: 4, spr: 'huajiao', hidden: true, solid: false, light: { r: 1.8, col: 'rgba(255,80,60,.16)' } },
          { id: 'fp4', x: 0, y: 4, spr: '@jf', hidden: true, solid: false },
          { id: 'fp5', x: 0, y: 4, spr: '@lt', hidden: true, solid: false, light: { r: 2.6, col: 'rgba(255,60,50,.24)', flick: true } },
          { id: 'offer', x: 8, y: 9, spr: 'offer', hidden: true, solid: false },
          { id: 'bride_p', x: 6, y: 7, spr: '@bride', hidden: true, solid: false, light: { r: 1.6, col: 'rgba(200,60,60,.14)' } },
          { id: 'bride2_p', x: 6, y: 7, spr: '@bride2', hidden: true, solid: false, light: { r: 2, col: 'rgba(255,200,170,.16)' } },
          { id: 'min_p', x: 6, y: 9, spr: '@min', hidden: true, solid: false }
        ],
        async enter(S, first) {
          const f = S.f; light(S);
          if (f.ph === 'day2') return startShoot(S);
          if (f.ph === 'carry' && S.once('backPool')) {
            await S.narr('你回到了新娘潭。\n阿希还坐在石头上，看见你，整个人松了一口气。');
            S.goal('用铜镜照一照新娘潭的潭水');
          }
        },
        tick(S, dt) {
          marchFrames(S);
          const f = S.f; if (W.busy || !['night', 'seek', 'carry', 'net'].includes(f.ph)) return;
          f._ps = (f._ps ?? 9) - dt; if (f._ps <= 0) { f._ps = 24 + Math.random() * 10; suona(S, true); S.bubble('hei', '…', 1500); }
        }
      },
      /* ---------------- 光绪年间 · 新娘潭（铜镜里的过去） ---------------- */
      past: {
        amb: 'rain', dark: .46, plr: 3.4, floor: 'granite', rain: true,
        legend: POOL_LEG,
        tileOpts: { grassC: '#2a4a2c', treeC: '#183a20' },
        rows: POOL_ROWS,
        ents: [
          { x: 8, y: 0, w: 4, spr: 'fall', solid: false },
          { x: 0, y: 4, spr: 'invisible', touch: S => S.pos(1, 4, 2) },
          { x: 12, y: 12, spr: 'invisible', async touch(S) { await S.narr('（你是送嫁的喜娘。要跟住花轿。）'); S.pos(12, 11, 3); } },
          { x: 4, y: 4, spr: 'invisible', solid: true, on: S => S.narr('那块斜石。雨水在石面上流成一层亮亮的薄膜。') },
          { id: 'pp0', x: 0, y: 4, spr: '@meipo', solid: false, on: S => S.say('媒人婆', '行快啲！过咗呢个潭就到鹿颈喇，误咗时辰唔吉利！') },
          { id: 'pp1', x: 0, y: 4, spr: '@sn2', solid: false, on: S => S.narr('吹唢呐的后生，腮帮子鼓得圆圆的。雨水顺着他的帽檐往下淌。') },
          { id: 'pp2', x: 0, y: 4, spr: '@jf2', solid: false, on: S => S.narr('抬前杠的轿夫，看起来不过二十出头。他的草鞋已经湿透了。') },
          { id: 'pp3', x: 0, y: 4, spr: 'huajiao', solid: false, async on(S) { await S.say('轿里的声音', '……阿好，鹿颈仲有几远？', { style: 'whisper' }); await S.say('你', '就快到喇，秀姑娘。'); } },
          { id: 'pp4', x: 0, y: 4, spr: '@jf2', solid: false, on: S => S.narr('抬后杠的轿夫，一边走一边念：「慢慢行，慢慢行……」') },
          { id: 'pp5', x: 0, y: 4, spr: '@sn2', solid: false, on: S => S.narr('打锣的后生，锣上包着红布，敲起来闷闷的。') },
          { id: 'xiu', x: 5, y: 7, spr: '@xiu', hidden: true, solid: false },
          { id: 'glint_p', x: 5, y: 5, spr: 'glint', hidden: true, solid: false }
        ],
        async enter(S) {
          S.wear('@ximiang');
          placeLine(S, PASTP, PPATH, 9); PASTP.forEach(id => { S.ent(id).fr = 0; });
          S.ent('pp3').s = {};
          await S.card('光绪年间　七月', '乌蛟腾　→　鹿颈', '雨落了一整日。\n山溪涨到了石边，\n大红的花轿淋成了深红色。\n\n你是送嫁的喜娘阿好。\n你跟在轿尾，一步，一步。');
          S.goal('跟住花轿');
        },
        step(S, x, y) { if (y <= 10 && !S.f.accident) return accident(S); },
        tick(S) { marchFrames(S); }
      },
      /* ---------------- 山径（新娘潭 ⇄ 照镜潭） ---------------- */
      trail: {
        amb: 'night', dark: .9, plr: 2.6, floor: 'dirt',
        legend: { p: 'trailp', a: 'nook' },
        tileOpts: { grassC: '#1e3420', treeC: '#122818' },
        rows: TRAIL_ROWS,
        ents: [
          { x: 5, y: 0, spr: 'invisible', async touch(S) { const fled = S.f.procOn; procReset(S); trailGoal(S); await S.go('pool', 1, 4, 2); if (fled) await S.think('唢呐声停了。\n……它们没有走。它们还在山径里等。'); } },
          { x: 12, y: 31, spr: 'invisible', async touch(S) { procReset(S); trailGoal(S); await S.go('mirror', 12, 1, 0); } },
          { x: 6, y: 2, spr: 'marker', on: S => S.narr('标距柱：C1207。\n柱子底下压着一叠黄纸，被露水打湿了。') },
          { x: 4, y: 22, spr: 'marker', on: S => S.narr('标距柱：C1211。\n有人用红笔在柱子上写了个「囍」，又用力划掉了。') },
          { x: 13, y: 9, spr: 'lantern', off: true, on: S => S.narr('树枝上挂着一个褪了色的红灯笼，纸都烂了，竹骨露在外面。\n……这里怎么会有灯笼？') },
          { id: 'mshoe', x: 10, y: 4, spr: 'shoes', col: '#c81e28', async on(S) {
            await S.narr('一只红色的高跟鞋，是小敏配裙褂穿的那双。\n鞋跟上沾着湿泥。');
            await S.think('她光着一只脚，走下去了。');
          } },
          { id: 'tudi', x: 3, y: 12, spr: 'tudi', light: { r: 1.6, col: 'rgba(255,120,70,.16)', flick: true }, async on(S) {
            if (S.once('tudi')) await S.narr('山径旁边有一座小小的土地庙，只有半人高。\n香炉里插着三支香，还没烧完——不久前有人来上过香。\n神台底下压着一本泡过水的簿仔。');
            await S.note('diary'); S.f.readDiary = true;
            if (S.once('tudiThink')) await S.think('「让路，面朝山壁，莫望轿。莫应声。」\n……还有，铜镜在照镜潭，绣花鞋在新娘潭底。');
          } },
          ...[[4, 2], [8, 7], [13, 10], [4, 20], [11, 28]].map(([x, y]) => ({ x, y, spr: 'redbits', decal: true })),
          { id: 'pr0', x: 12, y: 31, spr: '@lt', hidden: true, solid: false, light: { r: 2.8, col: 'rgba(255,60,50,.26)', flick: true } },
          { id: 'pr1', x: 12, y: 31, spr: '@sn', hidden: true, solid: false },
          { id: 'pr2', x: 12, y: 31, spr: '@jf', hidden: true, solid: false },
          { id: 'pr3', x: 12, y: 31, spr: 'huajiao', hidden: true, solid: false, light: { r: 1.8, col: 'rgba(255,80,60,.16)' } },
          { id: 'pr4', x: 12, y: 31, spr: '@jf', hidden: true, solid: false },
          { id: 'pr5', x: 12, y: 31, spr: '@lt', hidden: true, solid: false, light: { r: 2.8, col: 'rgba(255,60,50,.26)', flick: true } }
        ],
        async enter(S, first) {
          const f = S.f; procReset(S);
          if (f.ph === 'night') {
            f.ph = 'seek';
            await S.narr('山径很窄，只够一个人走。两边的树枝在头灯的光圈外面交叉在一起，像一条长长的隧道。\n路边的山壁上，隔一段就凹进去一块——是给挑担的人让路用的。');
            await S.think('小敏……你到底去了哪里？');
            S.goal('沿山径往里走，去照镜潭找小敏');
          }
          if ((f.ph === 'seek' && !f.pass_seek) || (f.ph === 'carry' && !f.pass_carry)) S.cp('trail');
        },
        step(S, x, y) {
          const f = S.f, i = PIDX[x + ',' + y];
          if (f.ph === 'seek' && !f.pass_seek && !f.procOn && i != null && i >= 9) return procIntro(S, 'up');
          if (f.ph === 'carry' && !f.pass_carry && !f.procOn && i != null && i <= 44) return procIntro(S, 'down');
          if (i == null && y >= 12 && y <= 14 && x <= 8 && S.once('clearing')) return S.narr('一小块平地。地上铺着烧剩的溪钱，踩上去沙沙地响。');
        },
        tick(S, dt) { procTick(S, dt); }
      },
      /* ---------------- 照镜潭 ---------------- */
      mirror: {
        amb: 'river', dark: .84, plr: 2.8, floor: 'granite',
        legend: { Q: 'cliffq', k: 'granite', '@': 'tanw', p: 'trailp' },
        tileOpts: { grassC: '#1e3420', treeC: '#122818' },
        rows: [
          'PPPPPPPPPPPPpPPP',
          'PPPQQQQQQQQQkQPP',
          'PPQkkkkkkkkkkkQP',
          'PQkkkkkkkkkkkkQP',
          'PQ@@@@@@@@@@@@QP',
          'PQ@@@@@@@@@@@@QP',
          'PQ@@@@@@@@@@@@QP',
          'PQ@@@@@@@@@@@@QP',
          'PQ@@@@@@@@@@@@QP',
          'PQkkkkkkkkkkkkQP',
          'PQkkkkkkkkkkkkQP',
          'PPQQQQQQQQQQQQPP',
          'PPPPPPPPPPPPPPPP'],
        ents: [
          { x: 12, y: 0, spr: 'invisible', async touch(S) {
            if (S.f.ph === 'mirror') { await S.narr('小敏不在这里……可是对岸那块大石上，好像有什么东西。\n先过去看看。'); return S.pos(12, 1, 0); }
            await S.go('trail', 12, 30, 3);
          } },
          { x: 7, y: 6, spr: 'invisible', light: { r: 5.5, col: 'rgba(170,210,200,.08)' } },
          ...STONES.map(([x, y, real, sub], i) => ({ id: 'st' + i, x, y, spr: 'tstone', decal: true, solid: false, s: { real, sub, ra: 0 } })),
          { id: 'jingshi', x: 7, y: 3, spr: 'jingshi', solid: false, decal: true, on: S => jingshi(S) },
          { id: 'bride_r', x: 9, y: 8, spr: 'brider', hidden: true, decal: true, solid: false },
          { id: 'jingxia', x: 8, y: 10, spr: 'jingxia', on: S => jingxia(S) },
          { x: 9, y: 10, w: 2, spr: 'bigrock', on: S => S.narr('一块平顶的大石，像一张梳妆台。\n石面上有一圈一圈的水渍，好像刚刚有人坐在这里梳过头。') },
          { x: 2, y: 2, spr: 'invisible', solid: true, on: S => S.narr('石壁上的青苔湿漉漉的，摸上去……像头发。') },
          { x: 13, y: 2, spr: 'invisible', solid: true, on: S => S.narr('石壁的裂缝里，塞着一小卷红纸。展开来，上面一个字也没有。') },
          { x: 3, y: 10, spr: 'redbits', decal: true },
          { x: 10, y: 2, spr: 'redbits', decal: true },
          { id: 'bride_m', x: 7, y: 9, spr: '@bride', hidden: true, solid: false, light: { r: 1.6, col: 'rgba(200,60,60,.14)' } }
        ],
        async enter(S, first) {
          const f = S.f; f._ra = -1; f.looking = false; f.reflT = 0;
          if (f.ph === 'seek') {
            f.ph = 'mirror'; f.mside = 'near';
            await S.narr('照镜潭。\n这里没有瀑布，潭水平得一丝波纹也没有，像一块打磨过的铜镜，把月亮整个装了进去。');
            await S.narr('潭面上露出几块踏脚石，斜斜地排向对岸。\n对岸那块大石上，好像放着一个木匣。');
            await S.think('小敏不在这里。可是……她的鞋在山径上。她一定来过。');
            S.goal('过到对岸的大石（有的石头不是石头）');
            S.cp('mirror');
          }
        },
        step(S, x, y) {
          const f = S.f;
          if (y <= 3) f.mside = 'near'; else if (y >= 9) f.mside = 'far';
          if (y >= 4 && y <= 8 && !REAL.has(x + ',' + y)) return fall(S);
        },
        tick(S, dt) {
          const f = S.f, p = W.pl, on = p.x === 7 && p.y === 3;
          if (on && f.looking) f.reflT = f.reflHold || 4; else { if (!on) f.looking = false; f.reflT = Math.max(0, (f.reflT || 0) - dt); }
          const ra = f.reflPerm ? 1 : Math.min(1, Math.ceil((f.reflT || 0) * 4) / 4);
          if (ra !== f._ra) {
            f._ra = ra;
            STONES.forEach((s, i) => { const e = S.ent('st' + i); if (e) e.s.ra = ra; });
            const b = S.ent('bride_r'); if (b) b.hidden = !(ra > 0 && !f.gotMirror && !f.reflPerm);
          }
        }
      }
    }
  });

  const FINAL = ['fp0', 'fp1', 'fp2', 'fp3', 'fp4', 'fp5'];
  const PASTP = ['pp0', 'pp1', 'pp2', 'pp3', 'pp4', 'pp5'];

  /* ================= 剧情：白天 ================= */
  async function opening(S) {
    S.f.ph = 'day'; light(S);
    await S.narr('星期六，下午五点。\n烧烤场里只剩几档人在收拾炭炉。溪水在新娘桥底下哗哗地响。');
    S.face('min', 'pl'); S.bubble('min', '♥', 900);
    await S.say('小敏', ['晴晴！你睇，好唔好睇？', '（她提着裙褂的下摆转了一个圈，金线绣的凤凰在夕阳里一闪一闪。）']);
    S.face('hei', 'pl');
    await S.say('阿希', ['靓，靓到可以去饮。', '不过要快啲，仲有个几钟就日落，golden hour 唔等人㗎。']);
    const r = await S.ask('小敏望着你，等你夸她。', ['「好靓。你老公睇到实喊。」', '「着成咁去行山……你肯定？」'], '阿晴');
    if (r === 1) await S.say('小敏', ['肯定！新娘潭呀，个名咁啱。', '网上啲人话，日头去乜都冇事。你唔好咁扫兴啦晴晴～']);
    else await S.say('小敏', '佢喊就好喇，我要佢喊足一世。');
    await S.say('小敏', ['晴晴，你帮我去阿伯个士多买两樽水先，我哋喺上面等你。', '过咗桥，跟住个牌沿溪边行上去就到。']);
    await S.say('阿希', '我部电话就快冇电，你到咗大叫一声就得。');
    const a = bg(S.walk('min', [22, 1], 3.6)); await S.walk('hei', [22, 3], 3.6); await a;
    S.hide('min'); S.hide('hei');
    await S.think('……这个人，连电话都忘在枱上了。');
    S.goal('去左上角的士多跟阿伯买水');
  }
  async function bak(S) {
    S.face('bak', 'pl');
    const f = S.f;
    if (f.ph === 'day') {
      await S.say('阿伯', ['两樽水？二十蚊。', '……头先嗰个着到成身红嘅，系你朋友？']);
      S.give('water'); f.ph = 'day2';
      await S.say('阿伯', ['而家七月呀，鬼门开，人哋连嫁娶都避开。', '佢着裙褂上新娘潭影相……唉，总之天黑之前一定要落山。']);
      const r = await S.ask('阿伯摇着葵扇，望着溪水上游的方向。', ['「阿伯，新娘潭有咩故仔呀？」', '「知道喇，多谢阿伯。」'], '阿晴');
      if (r === 0) await bakStory(S);
      else { await S.say('阿伯', ['记住：夜晚喺山入面听到唢呐声，唔好回头，唔好应。', '见到有队伍行过嚟，就让路，面朝山壁企定。']); f.heardRule = true; }
      S.goal('过新娘桥，沿溪边山径去新娘潭');
      return;
    }
    if (!f.heardStory) return bakStory(S);
    const L = ['七月嘅水好凉，千祈唔好落水。', '有人话出事嘅唔止新娘，连新郎都一齐冇咗。\n我阿爷话唔系——新郎喺鹿颈，等咗一世。', '我阿爷以前成日讲：嗰块石，佢行过一百次。', '去啦，天黑前记得落山。'];
    await S.say('阿伯', L[(f._bk = ((f._bk ?? -1) + 1) % L.length)]);
  }
  async function bakStory(S) {
    await S.say('阿伯', [
      '光绪年间嘅事喇。乌蛟腾谢家个女，叫阿秀，十七岁，嫁去鹿颈陈家。',
      '嗰日落大雨。四个轿夫行到潭边嗰块斜石，前杠嗰个跣咗脚——成顶轿侧咗落水。',
      '所以叫新娘潭。村民后来喺溪上起咗条石桥，就系出面嗰条新娘桥。',
      '上面仲有个照镜潭。有人话阿秀上轿前喺嗰度照过镜；亦有人见过潭边企住个女人——水入面，冇佢个影。',
      '……抬前杠嗰个，系我阿爷。佢之后一世冇再抬过轿，每年七月都上山，去土地庙上香。而家轮到我。']);
    await S.say('阿伯', ['记住：夜晚喺山入面听到唢呐声，唔好回头，唔好应。', '见到有队伍行过嚟，就让路，面朝山壁企定。千祈唔好挡路，唔好望顶轿。']);
    S.f.heardStory = true; S.f.heardRule = true;
  }

  /* ================= 剧情：黄昏拍照 ================= */
  async function startShoot(S) {
    S.f.ph = 'shoot'; light(S);
    await S.narr('新娘潭。\n瀑布从十几米高的石壁上冲下来，落进一个翡翠绿的深潭里。水声大得要扯着嗓子说话。');
    S.face('min', 'pl'); S.bubble('min', '♥', 900);
    await S.say('小敏', '晴晴！快啲嚟，个光好靓呀！');
    S.face('hei', 'pl');
    await S.say('阿希', '阿晴，帮我拎块反光板嚟——喺右上面嗰块石度，我头先放低咗。');
    S.goal('去右上方大石拿反光板，交给阿希');
  }
  async function hei(S) {
    const f = S.f, ph = f.ph; S.face('hei', 'pl');
    if (ph === 'shoot') return S.has('reflector') ? shoot(S) : S.say('阿希', '反光板喺右上面嗰块大石度。快啲，个光就冇喇。');
    if (ph === 'night' || ph === 'seek' || ph === 'mirror') {
      if (!S.has('lamp')) { S.give('lamp'); return S.say('阿希', '拎住我个头灯。'); }
      const L = ['左边嗰条山径……小敏就系行咗入去。', '你一定要带佢返嚟。我……我喺度等你。', '你有冇听到？好似有人吹喇叭。……唔好理，唔好理。'];
      return S.say('阿希', L[(f._hl = ((f._hl ?? -1) + 1) % L.length)]);
    }
    if (ph === 'carry') return S.say('阿希', ['铜镜？……阿伯唔系讲，阿秀上轿前喺照镜潭照过镜咩？', '你……你试下用佢照下个潭？']);
    if (ph === 'net') return S.say('阿希', S.has('net') ? '捞叶网？好……斜石度，慢慢嚟。' : ['潭底有只鞋？', '阿伯有支捞叶网，日头佢捞完落叶就插喺停车场桥边嗰度。']);
    return S.say('阿希', '……');
  }
  async function shoot(S) {
    S.take('reflector');
    await S.say('阿希', ['好嘢！你企喺小敏右手边，个板斜住，对住佢块面……', '好，小敏，望过嚟——笑！']);
    S.face('min', 1);
    for (let i = 0; i < 3; i++) { S.ent('tripod').lit = true; S.fx('flash'); S.sfx('cut'); await S.wait(250); S.ent('tripod').lit = false; await S.wait(380); }
    S.face('min', 'pl'); S.bubble('min', '♥', 900);
    await S.say('小敏', '点呀点呀？俾我睇下！');
    await S.say('阿希', '等阵……');
    S.bubble('hei', '?', 1400);
    await S.narr('阿希盯着相机后面的小屏幕，按了一下，又按了一下。\n他的脸色变了。');
    const r = await S.vote('阿希把相机递给你。', ['（看）', '（不看）'], '阿晴');
    if (!r.agree) {
      await S.narr('你伸手去接，手伸到一半又缩了回来——\n只来得及瞥见屏幕上一角红色。\n阿希呆了一会儿，默默地把那张相删了。');
      S.fx('red'); S.sfx('sting');
    } else if (r.v === 0) {
      await S.narr('屏幕上，小敏站在潭边，笑得好甜。\n她身后的潭水上……站着另一个人。\n大红嫁衣，红盖头，双脚没在水里。');
      await S.scare('face', { face: 'brideface' });
    } else await S.narr('你没有接。\n阿希呆了一会儿，默默地把那张相删了。');
    await S.say('阿希', '……水面反光啫。系反光。');
    S.dark(.62);
    await S.narr('太阳好像一下子掉到了山后面。\n雾从潭面上升起来，冷得像有人对着你的后颈呵气。');
    await S.say('小敏', '最后一张啦！我想企近啲个潭，影埋个倒影。');
    await S.walk('min', [16, 7], 2.4); S.face('min', 1);
    S.amb('none'); await S.wait(600);
    suona(S, true);
    await S.wait(900);
    await S.say('阿希', '……边个咁夜吹喇叭？');
    S.bubble('min', '…', 1600);
    await S.say('小敏', ['你哋听唔听到……', '有人叫我。'], { style: 'whisper' });
    await S.say('阿晴', '小敏？');
    await S.fade(1, 200); suona(S); gong(S);
    await S.say('', '新娘子——上轿喇——', { style: 'big' });
    S.sfx('splash'); S.shake(700, 3); await S.wait(900);
    S.hide('min'); S.show('flower'); S.place('hei', 13, 8, 2);
    S.f.ph = 'night'; light(S); S.amb('river');
    await S.fade(0, 900);
    await S.narr('……\n雾散了一点。天已经全黑了。');
    await S.say('阿晴', '小敏？……小敏！！');
    await S.narr('潭边的石头上，只剩下一朵湿透的红头花。');
    S.face('hei', 'pl');
    await S.say('阿希', ['阿晴……我跌亲只脚……', '我见到佢……佢自己行咗入左边嗰条山径。好似有人拖住佢只手咁。', '我叫佢，佢冇回头。']);
    S.give('lamp');
    await S.say('阿希', ['呢度冇信号，999都打唔通。', '你拎住我个头灯。我行唔到……我喺度等。你千祈小心。']);
    S.goal('从潭边左边的山径去追小敏');
    S.cp('night');
  }

  /* ================= 剧情：新娘潭的水 ================= */
  async function poolEye(S) {
    const ph = S.f.ph;
    if (ph === 'day2' || ph === 'shoot') return S.narr('潭水是翡翠一样的绿色，深得看不见底。\n瀑布落下的地方，一圈一圈的白沫转个不停。');
    if (ph === 'carry' && S.has('mirror')) return flashback(S);
    if (ph === 'net' || ph === 'final') return S.narr('瀑布左边那块斜石底下，有一点红光，一闪一闪。');
    await S.narr('黑漆漆的潭水，水面上浮着一层白雾。\n雾里好像有人在梳头。你不敢看太久。');
  }
  async function flashback(S) {
    await S.narr('你举起铜镜。\n云缝里漏下来一线月光，落在镜面上，又从镜面上弹出去，落进了潭水里。');
    S.sfx('chime'); S.fx('flash');
    await S.narr('潭水亮了。\n水底下不是石头，不是沙——是另一个下着大雨的白天。');
    await S.go('past', 12, 11, 3);
  }
  async function accident(S) {
    const f = S.f; f.accident = true;
    gong(S); suona(S);
    await S.say('媒人婆', '石头好滑！大家睇住脚，慢慢行！');
    const w = bg(S.walk('pl', [9, 8], 2.4));
    await march(S, PASTP, PPATH, 9, 14, 2.2); await w;
    S.turn(1);
    await S.say('轿里的声音', '……阿好，鹿颈仲有几远？', { style: 'whisper' });
    await S.say('你', '就快到喇，秀姑娘。过咗呢个潭就到。');
    S.amb('none'); await S.wait(500);
    S.sfx('thud'); S.bubble('pp2', '!', 1200); S.shake(500, 3);
    S.ent('pp3').s.tilt = 1; S.ent('pp3').s.still = 1;
    await S.narr('抬前杠的后生一脚踩在斜石的青苔上——\n整个人往后一仰。');
    S.ent('pp3').s.open = 1;
    S.place('xiu', 5, 7, 2); S.ent('xiu').alpha = 1;
    await S.narr('花轿往潭那边侧了过去，轿帘被甩开。\n新娘从轿里滑了出来，红盖头飞起一角——');
    S.face('xiu', 'pl');
    await S.narr('她回过头，看了你一眼。\n她没有叫。');
    S.sfx('splash'); S.shake(700, 3);
    S.place('xiu', 5, 6, 3); await S.alpha('xiu', 0, 900);
    await S.say('媒人婆', '新娘子！！新娘子——！！', { style: 'big' });
    S.show('glint_p');
    await S.narr('潭水翻了一下，又合上了。\n只有一只小小的红绣花鞋浮上来，在水面上转了两个圈——\n然后慢慢沉下去，沉到瀑布左边那块斜石底下。');
    await S.fade(1, 1200);
    S.wear('@me'); f.ph = 'net';
    await S.go('pool', 10, 7, 3, { fade: false });
    S.show('glint'); S.amb('river');
    await S.fade(0, 900);
    await S.narr('……你跪在新娘潭边，手里的铜镜冰冷。\n雨声没有了，只剩下瀑布的声音。');
    await S.narr('瀑布左边那块斜石底下，有一点红光，一闪一闪。');
    S.face('hei', 'pl');
    await S.say('阿希', ['阿晴？你、你头先成个人定住咗……', '……你话潭底有只鞋？我哋点捞呀？', '等等——阿伯有支捞叶网！我日头见佢插喺停车场桥边嗰度。']);
    S.goal(S.has('net') ? '用捞叶网捞起斜石底下的绣花鞋' : '去停车场桥边拿捞叶网');
    S.cp('net');
  }
  async function glintOn(S) {
    if (!S.has('net')) return S.narr('斜石底下，深水里，有一点红光。\n伸手是够不着的——要找个长柄的东西来捞。');
    return fish(S);
  }
  async function fish(S) {
    await S.narr('你趴在斜石上，把捞叶网伸进潭里。\n竹柄一节一节没进水中，冷得像伸进了冬天。');
    S.sfx('water'); await S.wait(600);
    await S.narr('网口碰到了潭底。你往石缝里一兜——');
    S.shake(500, 2); S.sfx('splash');
    await S.narr('有东西从下面拉住了网。\n一下，两下，很轻，像是有人在水底下拉你的手。');
    const r = await S.vote('竹柄在你手里发抖。', ['（不放手，慢慢往上拉）', '（松手）'], '阿晴');
    if (!r.agree) await S.narr('一只手想松，一只手死死攥住——竹柄在你掌心里转了半圈，\n最后，还是攥住了。');
    else if (r.v === 1) return S.narr('你一松手，网就自己往下沉了一点——又停住了。\n它在等你。');
    await S.narr('你咬着牙，一点一点往上收。\n拉住网的力气……忽然松开了。');
    S.hide('glint'); S.give('shoe');
    await S.narr('网兜里躺着一只小小的红绣花鞋。\n鞋面上绣着并蒂莲，丝线红得像刚刚绣好。');
    S.f.ph = 'final'; S.goal('把铜镜和绣花鞋还给她'); S.cp('final');
    await finale(S);
  }

  /* ================= 剧情：结局 ================= */
  async function finale(S) {
    const f = S.f;
    FINAL.forEach(id => { const e = S.ent(id); e.hidden = true; e.alpha = 1; e.s = {}; });
    ['bride_p', 'bride2_p', 'min_p', 'offer'].forEach(id => S.hide(id));
    S.amb('none'); await S.wait(500);
    suona(S); gong(S);
    if (!f.finSeen) {
      await S.narr('唢呐。\n就在左边的山径口，吹得又近、又响、又欢喜。');
      S.face('hei', 0);
      await S.say('阿希', '阿、阿晴……佢哋嚟咗……');
      await S.walk('pl', [7, 9], 5); S.turn(3);
      S.focus(7, 7);
      await march(S, FINAL, FPATH, 0, 7, 2.4); suona(S); gong(S);
      await march(S, FINAL, FPATH, 7, 14, 2.4);
      f.finSeen = true; S.cp('final');   // 坏结局重来时直接从队伍停在轿前开始
    } else {
      S.pos(7, 9, 3); S.face('hei', 0); S.focus(7, 7);
      placeLine(S, FINAL, FPATH, 14); FINAL.forEach(id => { S.ent(id).fr = 0; });
    }
    S.ent('fp3').s.still = 1; S.ent('fp3').dir = 2;
    S.goal('把铜镜和绣花鞋还给她');
    await S.narr('迎亲的队伍在你面前停了下来。\n红衣的轿夫低着头，灯笼里的火是青白色的。没有一个人看你。');
    S.ent('fp3').s.open = 1; S.ent('fp3').s.min = 1;
    await S.narr('轿帘自己掀开了一角。\n小敏坐在里面，双眼紧闭，裙褂湿透了。');
    await S.say('小敏', '……晴晴？', { style: 'whisper' });
    S.ent('fp3').s.open = 0;
    S.place('bride_p', 6, 7, 0); S.ent('bride_p').alpha = 0; S.sfx('drip');
    await S.alpha('bride_p', .9, 1200);
    await S.narr('轿旁的潭水里，慢慢站起来一个人。\n红嫁衣，红盖头，盖头的流苏一直在滴水。\n她只穿着一只鞋。');
    let grabs = 0;
    for (; ;) {
      const r = await S.vote('她在等。整条队伍，都在等。', ['把铜镜和绣花鞋放在轿前', '「放咗小敏！要抬，就抬我上轿！」', '冲过去，一手拉开轿帘'], '阿晴');
      let v = r.v;
      if (!r.agree && (r.h === 0 || r.g === 0)) {   // 有一个人想还东西：先还
        await S.narr('你往前冲了半步，另一只手却已经把铜镜和绣花鞋掏了出来。\n……先还给她。');
        v = 0;
      }
      if (v === 1) return badSedan(S);
      if (v === 2) {
        if (++grabs >= 2) return badSnatch(S);
        await S.scare('face', { face: 'porterface' });
        await S.narr('两只冰冷的手同时按住了你的肩膀。\n轿夫们还是低着头，像两块石头一样，把你推回了原地。\n……再来一次，它们就不会只是推了。');
        continue;
      }
      break;
    }
    S.take('mirror'); S.take('shoe'); S.show('offer');
    await S.narr('你把铜镜和那只绣花鞋并排放在轿前的石头上，镜面朝天。');
    await S.say('阿晴', '秀姑娘……你嘅嘢，我帮你搵返嚟喇。');
    S.hide('offer'); S.sfx('chime');
    await S.narr('一阵很轻的风。石头上的东西不见了。\n新娘弯下腰——那只绣花鞋，已经穿在她光着的那只脚上。');
    await S.narr('她举起铜镜，照了照。\n……这一次，镜子里有她。');
    S.place('bride2_p', 6, 7, 0); S.ent('bride2_p').alpha = 0;
    bg(S.alpha('bride_p', 0, 1000)); await S.alpha('bride2_p', 1, 1000);
    await S.narr('她掀起了红盖头。\n盖头底下，是一张很年轻、很年轻的脸。十七岁。');
    await S.say('阿秀', ['……多谢你。', '我行咗成百年，都行唔出呢个潭。']);
    const q = await S.ask('「鹿颈嗰边……仲有冇人等我？」', ['「有。佢哋等咗你好耐。」', '「我唔知……但系条桥起好咗。你行得过去。」'], '阿晴');
    if (q === 0) await S.say('阿秀', '……咁，唔好再俾佢哋等喇。');
    else await S.say('阿秀', '桥……系呀。我听到好多人喺上面行过。');
    await S.say('阿秀', ['上轿之前，阿妈叫我唔好回头。我回咗。', '今次……我唔回头喇。']);
    S.ent('fp3').s.open = 1; S.ent('fp3').s.min = 0;
    S.place('min_p', 6, 9, 3); S.ent('min_p').alpha = 0; await S.alpha('min_p', 1, 700);
    S.face('min_p', 'pl'); S.face('pl', 'min_p');
    await S.say('小敏', ['……晴晴？我……我点解喺度……', '我好凍……'], { style: 'whisper' });
    S.bubble('pl', '♥', 1200);
    await S.narr('你一把抱住她。她的裙褂冰冷，可是她在发抖——活人才会发抖。');
    await S.walk('bride2_p', [6, 8], 1.6); S.face('bride2_p', 2);
    await S.alpha('bride2_p', 0, 900);
    S.ent('fp3').s.open = 0; S.ent('fp3').s.still = 0;
    suona(S); S.sfx('chime');
    await S.narr('轿帘落下。\n唢呐重新响起来——这一次，吹的是真正的喜乐。');
    FINAL.forEach(id => { const e = S.ent(id); if (id !== 'fp3') e.light = e.light ? { r: 2.6, col: 'rgba(255,170,90,.26)', flick: true } : null; });
    S.focus(12, 8);
    await march(S, FINAL, FPATH, 14, 20 + FINAL.length, 2.2);
    S.focus(null);
    await S.narr('红灯笼的光，一点一点，过了新娘桥，往鹿颈的方向去了。\n唢呐声越来越远，越来越轻，最后变成了虫叫。');
    S.f.ph = 'good'; light(S); S.amb('night'); S.goal('');
    S.face('hei', 'pl');
    await S.say('阿希', '……佢哋……行咗？');
    await S.say('小敏', ['晴晴……我发咗个梦。', '梦见有个姐姐坐喺我隔离，问我嫁嘅人系点样。我同佢讲咗好耐好耐。', '佢话，佢好羡慕我。']);
    await S.fade(1, 1400);
    await S.card('第二天清晨', '', '搜救队在新娘潭边找到我们三个。\n小敏发了两日烧，没什么大碍。\n\n下山的时候经过新娘桥，\n桥头的石碑前，多了一对新点的红蜡烛。\n\n阿伯站在那里，对着溪水上游，\n鞠了三个躬。');
    await S.end({ id: 'good', title: '第九夜　完', text: '那一辑裙褂相，阿希一张也没有删。\n\n最后一张里，小敏站在潭边笑。\n她身后的水面上，倒影里有两个人：\n一个穿着裙褂，一个盖着红盖头。\n\n两个人，都没有回头。' });
  }
  async function badSedan(S) {
    await S.say('阿晴', '放咗小敏！要抬，就抬我上轿！');
    S.amb('none'); await S.wait(500);
    await S.narr('唢呐声停了。\n四个轿夫一齐抬起头，看着你。他们的脸，白得像泡过水的纸。');
    S.ent('fp3').s.open = 1; S.ent('fp3').s.min = 0;
    S.place('min_p', 6, 9, 3); S.ent('min_p').alpha = 1;
    await S.narr('小敏从轿里跌了出来，倒在石头上。');
    suona(S); S.sfx('chime');
    await S.say('轿夫们', '新娘子——上轿喇——', { style: 'big' });
    await S.narr('有人从后面替你盖上了一块红布。\n眼前一片红。口袋里的铜镜滑出来，跌在石头上，「叮」的一声裂开了。');
    await S.scare('face', { face: 'brideface' });
    await S.narr('你踏上轿子。轿帘落下。\n外面的世界，变成了一片红。');
    await S.fade(1, 1500);
    await S.end({ bad: true, id: 'sedan', title: '被请上花轿', text: '小敏在潭边醒过来的时候，天已经亮了。她浑身湿透，手里攥着一只红绣花鞋。\n\n阿晴不见了。\n\n后来，每年七月的夜里，新娘潭的吹打声照旧响起。\n有人说，轿子里多了一个穿行山衫的新娘，一直在问：\n「鹿颈……仲有几远？」' });
  }

  async function badSnatch(S) {
    await S.narr('你甩开那两只手，一把扯开轿帘，抓住小敏的手腕往外拖。\n她的手腕冰得像潭底的石头。');
    S.ent('fp3').s.open = 1; S.ent('fp3').s.min = 0;
    S.place('min_p', 6, 9, 3); S.ent('min_p').alpha = 1;
    S.amb('none'); S.sfx('splash'); S.shake(600, 3);
    await S.narr('唢呐声断了。灯笼一盏一盏熄掉。\n整条队伍，连同那顶花轿，像倒影被石子打碎一样，散进了潭水里。');
    FINAL.forEach(id => S.hide(id));
    await S.scare('face', { face: 'brideface' });
    await S.narr('最后散开的，是潭里那个只穿一只鞋的人。\n她没有叫。她只是回过头，看了你一眼。');
    await S.alpha('bride_p', 0, 900);
    await S.fade(1, 1500);
    await S.end({ bad: true, id: 'snatch', title: '抢轿', text: '小敏活了下来。下个月，她如期出嫁。\n\n铜镜和绣花鞋，后来在你的背包里找到，湿漉漉的，怎么晾也晾不干。\n\n婚宴那晚，酒楼外面有人吹唢呐。\n别人都说没听见。\n小敏坐在台上，一直回头。' });
  }

  /* ================= 山径：迎亲队伍 ================= */
  /* 队伍不再从山径另一头走完全程：在玩家前方约 13 格的雾里出现，过了玩家几格就淡进雾里（每趟约 9 秒） */
  const NOOKS = [];
  TRAIL_ROWS.forEach((r, y) => [...r].forEach((c, x) => { if (c === 'a' && [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dy]) => PSET.has((x + dx) + ',' + (y + dy)))) NOOKS.push([x, y]); }));
  function nearIdx(x, y) { let b = 0, bd = 1e9; TPATH.forEach((c, i) => { const d = Math.abs(c[0] - x) + Math.abs(c[1] - y); if (d < bd) { bd = d; b = i; } }); return b; }
  const procQ = S => { const i = nearIdx(W.pl.x, W.pl.y); return S.f.procDir === 'down' ? i : TPATH.length - 1 - i; };
  function procReset(S) {
    const f = S.f; f.procOn = false; f.procP = 0; f.procCalled = false; f._pend = false; S.lights(null);
    PROC.forEach(id => { const e = S.ent(id); if (e) { e.hidden = true; e.alpha = 1; } });
  }
  function trailGoal(S) {
    const f = S.f;
    if (f.ph === 'seek') S.goal('沿山径往里走，去照镜潭找小敏');
    else if (f.ph === 'carry') S.goal('带铜镜原路回新娘潭');
  }
  const procPath = S => S.f.procDir === 'down' ? TPATH : TUP;
  async function procIntro(S, dir) {
    procReset(S);
    S.amb('none'); await S.wait(300);
    S.f.procDir = dir;
    const q = procQ(S), p = W.pl;
    suona(S, false, .45); gong(S, .45);
    if (dir === 'up') await S.narr('……山径前头，照镜潭那边，传来了唢呐声。\n吹的是喜庆的调子，一句一句，越吹越近。\n两点红红的灯笼光，在树影里一晃一晃。');
    else await S.narr('……山径前头，新娘潭那边，唢呐又响了。\n它们掉过头来了——朝着你手里的铜镜。');
    let nk = NOOKS[0], nd = 1e9; NOOKS.forEach(c => { const d = Math.abs(c[0] - p.x) + Math.abs(c[1] - p.y); if (d < nd) { nd = d; nk = c; } });
    S.lights([[nk[0] * TS + 8, nk[1] * TS + 8, 1.3, .9]]); S.bubble('pl', '!', 1200);
    await S.think(S.f.readDiary ? '让路，面朝山壁，莫望轿。莫应声。' : '阿伯讲过：见到队伍行过嚟，就让路，面朝山壁企定。唔好望顶轿，唔好应。');
    S.goal('躲进山壁凹位，面朝山壁，等队伍过去');
    Object.assign(S.f, { procOn: true, _sn: 2, lookWarn: false, procP: Math.max(0, q - 13), procS0: Math.max(0, q - 13), procEnd: Math.min(TPATH.length - 1, q + 6) });
    S.amb('night');
    placeLine(S, PROC, procPath(S), S.f.procP, [S.f.procS0, S.f.procEnd + 1]);
  }
  function procTick(S, dt) {
    const f = S.f; if (!f.procOn || W.busy || f._pend || W.endScreen) return;
    const path = procPath(S);
    f.procEnd = Math.max(f.procEnd, Math.min(path.length - 1, procQ(S) + 4));   // 往前逃也会被跟上，直到山径尽头
    f.procP += dt * PSPD; placeLine(S, PROC, path, f.procP, [f.procS0, f.procEnd + 1]);
    if (f.procP - (PROC.length - 1) > f.procEnd + 1) { procReset(S); f['pass_' + f.ph] = true; S.after(0, passed); return; }
    const p = W.pl, inPath = PSET.has(p.x + ',' + p.y);
    const fx = p.x + DIRS[p.dir][0], fy = p.y + DIRS[p.dir][1], lookPath = PSET.has(fx + ',' + fy);
    let near = 99 * TS, sedanD = 99 * TS;
    PROC.forEach((id, i) => { const e = S.ent(id); if (!e || e.hidden || e.alpha < .3) return; const d = Math.abs(e.px - p.px) + Math.abs(e.py - p.py); if (d < near) near = d; if (i === 3) sedanD = d; });
    f._sn = (f._sn || 0) - dt;
    if (f._sn <= 0) { f._sn = 2.4; const v = Math.max(.3, Math.min(1.3, 1.35 - near / TS / 10)); suona(S, false, v); gong(S, v); }
    if (near < 11) { f._pend = true; S.after(0, caughtProc); return; }
    if (!inPath && lookPath && near < 36) { f._pend = true; S.after(0, lookedAt); return; }
    if (!f.procCalled && sedanD < 22) { f.procCalled = true; f._pend = true; S.after(0, theCall); }
  }
  async function lookedAt(S) {
    const f = S.f;
    if (f.lookWarn) {
      f.procOn = false; S.lights(null);
      await S.scare('face', { face: 'slitface', sfx: 'scream' });
      return S.die('轿帘掀开了一条缝。\n缝里有一只眼睛，正好对住你的眼睛。\n「……揾到你喇。」', '你望了花轿');
    }
    f.lookWarn = true;
    S.sfx('sting'); S.shake(300, 2);
    const p = W.pl;
    for (let d = 0; d < 4; d++) { const x = p.x + DIRS[d][0], y = p.y + DIRS[d][1]; if (!PSET.has(x + ',' + y)) { S.turn(d); break; } }
    await S.think('——别看！\n面朝山壁。莫望轿。（再望一次，就冇下次。）');
    f._pend = false;
  }
  async function theCall(S) {
    const f = S.f;
    S.amb('none');
    await S.say('轿里的声音', '……阿晴？阿晴，系咪你呀？', { style: 'whisper' });
    await S.say('轿里的声音', ['我好凍呀……佢哋唔俾我落轿……', '你应我一声啦。应我一声，我就知道你喺度。'], { style: 'whisper' });
    const r = await S.vote('是小敏的声音。', ['（咬实牙关，一声不出）', '「小敏！我喺度！」'], '');
    if (!r.agree) { await S.narr('你死死咬住牙关——可是喉咙里，另一个你已经替你应了出来。'); return answered(S); }
    if (r.v === 1) return answered(S);
    S.amb('night');
    await S.think('……不是小敏。\n小敏从来不叫我「阿晴」。她只会叫我「晴晴」。');
    f._pend = false;
  }
  async function answered(S) {
    S.f.procOn = false; S.lights(null);
    await S.say('阿晴', '小敏！我喺度！');
    await S.wait(600);
    suona(S); gong(S); S.sfx('chime');
    await S.narr('唢呐声停了一停，然后吹得更响、更欢喜。\n轿帘掀开了。里面没有人，只有一张铺着红布的空座位。');
    await S.say('轿夫们', '新娘子——上轿喇——', { style: 'big' });
    await S.narr('有人从后面替你盖上了一块红布。\n眼前一片红。你听见自己的脚步声，一步、一步，踏上了轿子。');
    await S.fade(1, 1500);
    await S.end({ bad: true, id: 'answer', title: '应了一声', text: '第二天，搜救队在新娘潭边找到了阿希和小敏。小敏说她一直坐在潭边的石头上，好像睡着了，什么也不记得。\n\n阿晴的头灯漂在照镜潭的水面上，还亮着。\n\n后来，行山的人说，七月的夜里，新娘潭的唢呐声里，多了一个声音在应：\n「我喺度——我喺度——」' });
  }
  async function passed(S) {
    S.amb('night'); S.lights(null);
    if (S.f.ph === 'seek') await S.narr('唢呐声往新娘潭那边去了，越来越远，最后被水声吞掉。\n山径上只剩下你自己的呼吸。');
    else await S.narr('吹打声沉进了照镜潭那边的黑暗里。\n……它们还会再来的。');
    trailGoal(S);
  }

  /* ================= 照镜潭 ================= */
  async function jingshi(S) {
    const f = S.f, p = W.pl;
    if (p.x !== 7 || p.y !== 3) return S.narr('岸边一块平平的白石，石面被磨得发亮，像有很多人在上面跪过。\n站上去，伏低身子，就能看见潭水。');
    if (f.reflPerm) return S.narr('有了铜镜，你不用再伏低身子，也看得见水里的路。');
    S.turn(0); f.looking = true; f.reflT = f.reflHold || 4;
    if (S.once('look1')) {
      await S.narr('你跪在白石上，伏低身子，看向潭水。\n水面平得像一块铜镜，连你呼出的白气都照得见。');
      await S.narr('岸上那几块斜斜排开的石头，在水里——有的有倒影，有的没有。\n还有几处，岸上明明只有水，水里却照出了一块块石头。');
      S.focus(9, 7); S.sfx('whisper');
      await S.narr('……对岸那块大石的倒影上，坐着一个人。\n大红的衣裳，低着头，在梳头。');
      S.focus(null);
      await S.narr('你猛地抬起头。\n对岸的大石上，什么也没有。');
      await S.think('岸上看见的不一定是真的。\n只踩水里照得出来的石头。');
    } else await S.narr('你又伏低身子看向水面。倒影里的石头，一块接一块，连成一条弯弯曲曲的路。');
    if (!f.gotMirror) S.goal('照着倒影里的石头过对岸（倒影只留一会儿）');
    if (S.coop && S.once('coopRefl')) S.toast('两个人：一个记左右、一个数步数，边走边报');
  }
  async function fall(S) {
    const f = S.f; f.falls = (f.falls || 0) + 1;
    S.sfx('splash'); S.shake(400, 2);
    if (f.falls === 1) {
      await S.scare('face', { face: 'handface', sfx: 'splash' });
      await S.narr('脚下的「石头」一踩就沉了——那根本不是石头。\n冰冷的潭水漫到腰。水底下，有一只手，轻轻地握住了你的脚踝。');
    } else await S.narr(['你一脚踩空，整个人滑进水里。\n水底下的手，比上次多了。', '水没过了胸口。你听见水底下有人在笑，笑声一串一串地冒上来。'][f.falls % 2]);
    await S.fade(1, 300);
    if (f.mside === 'far') S.pos(8, 9, 3); else S.pos(7, 3, 0);
    await S.fade(0, 400);
    await S.narr('你连滚带爬地爬回岸上，浑身湿透。');
    if (f.falls === 2 && !f.reflPerm) await S.think('岸上看见的石头……靠不住。\n阿伯说过，照镜潭照出来的东西，跟岸上不一样。\n要不要伏低身子，看看水里？');
    if (f.falls >= 3 && !f.reflPerm && !f.reflHold) {
      f.reflHold = 9;
      await S.think('冷静。刚才倒影里那条路……\n头一块，在白石左边第三格的正下面。\n之后是往下两块、往右两块，往下两块、往右两块——像落楼梯。\n（再伏到白石上看一次，倒影会在眼里留久一点。）');
    }
    if (!f.reflPerm) S.goal('站上白石，看水里的倒影');
  }
  async function jingxia(S) {
    const f = S.f;
    if (f.gotMirror) return S.narr('空了的镜匣。红色的垫布上，还留着一个圆圆的印子。');
    f.gotMirror = true; S.ent('jingxia').open = true;
    await S.narr('一个巴掌大的木匣，卡在大石的石缝里，漆面已经剥落。\n你打开盖子——');
    S.give('mirror');
    await S.narr('一面铜镜，用红布包着。\n镜子底下，垫着一张对折的红纸。');
    await S.note('gengtie');
    await S.think('谢氏，秀。十七岁。\n「我回咗头。」');
    S.place('bride_m', 7, 9, 2); S.ent('bride_m').alpha = 0;
    S.sfx('drip'); await S.wait(500); S.sfx('drip');
    await S.narr('身后，有水滴落在石头上的声音。\n滴答。滴答。');
    await S.alpha('bride_m', .9, 900);
    S.turn(1);
    await S.scare('face', { face: 'brideface' });
    await S.say('新娘', '……我只鞋……', { style: 'whisper' });
    await S.say('新娘', '……我要……嫁过去……', { style: 'whisper' });
    S.face('bride_m', 3);
    await S.narr('她抬起湿透的袖子，指着山径——新娘潭的方向。\n然后，像一滴墨落进水里，她散开了。');
    await S.alpha('bride_m', 0, 1200);
    f.reflPerm = true; f.ph = 'carry'; f._ra = -1;
    await S.narr('你低头看手里的铜镜。\n镜子里照出的潭面上，那条石头路清清楚楚。');
    S.goal('带铜镜原路回新娘潭');
    S.cp('carry');
  }
})();
