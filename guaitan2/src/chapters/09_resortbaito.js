/* ================= 第九夜 · 旅馆打工（リゾートバイト） ================= */
(() => {
  /* ---------- 模块级小状态（不进存档） ---------- */
  let bgT = 4, lastDeath = null;

  /* ---------- 声音（S.tone 合成，双方都听得到） ---------- */
  function knock(S, d = 0, v = .17) { S.tone('triangle', 230, 170, .07, v, d, 1400); S.tone('sine', 120, 90, .1, v * .8, d, 500); }
  function knock3(S, v) { knock(S, 0, v); knock(S, .42, v); knock(S, .84, v); }
  function thump(S, v = .14, d = 0) { S.tone('sine', 74, 46, .24, v, d, 260); S.tone('triangle', 115, 70, .08, v * .5, d, 420); }
  function crawlPat(S, v = .12, d0 = 0) { [0, .36, .82, 1.16].forEach(t => thump(S, v, d0 + t)); }
  function rin(S, v = .1, d = 0) { S.tone('sine', 1250, 1238, 2.6, v, d); S.tone('sine', 3320, 3300, 1.3, v * .3, d); S.tone('sine', 1262, 1250, 2.2, v * .45, d + .01); }
  function mokugyo(S, v = .12, d = 0) { S.tone('triangle', 640, 520, .07, v, d, 2400); S.tone('sine', 320, 250, .09, v * .7, d, 900); }
  function chant(S, n = 6, v = .1) { for (let i = 0; i < n; i++) mokugyo(S, v, i * .42); S.tone('sawtooth', 132, 128, n * .42, .03, 0, 380); }
  function rooster(S) { S.tone('sawtooth', 520, 780, .22, .07, 0, 1900); S.tone('sawtooth', 780, 940, .32, .07, .24, 1900); S.tone('sawtooth', 940, 560, .7, .06, .58, 1700); }
  function hum(S, v = .045, d0 = 0) { [440, 494, 440, 392, 330, 392, 440, 0, 392, 330, 294, 330].forEach((f, i) => { if (f) S.tone('triangle', f, f, .3, v, d0 + i * .34, 1300); }); }
  function drip(S, v = .07, d = 0) { S.tone('sine', 1900, 880, .09, v, d); }
  function chew(S, v = .05, d0 = 0) { [0, .17, .46, .63, .95, 1.12].forEach(t => S.tone('triangle', 760, 420, .04, v, d0 + t, 1700)); }
  function wave(S, v = .05) { S.tone('sine', 95, 60, 2.2, v, 0, 200); S.tone('triangle', 180, 90, 1.6, v * .4, .3, 300); }

  /* ---------- 打工日程：柱钟随干活往前走，天色跟着变 ---------- */
  const CN = ['十二', '一', '两', '三', '四', '五', '六', '七', '八', '九', '十', '十一'];
  function hourText(h) { return (h < 5 ? '半夜' : h < 9 ? '早上' : h < 12 ? '上午' : h < 13 ? '中午' : h < 18 ? '下午' : '晚上') + CN[h % 12] + '点'; }
  function setHour(S, h, quiet) {
    const f = S.f, old = f.hour; f.hour = h; S.ent('hclock').num = h % 12;
    if (f.ph === 'd1' || f.ph === 'd2') { const v = h >= 17 ? .34 : h >= 15 ? .24 : .15; S.dark(v, 'kan1'); S.dark(v, 'kan2'); S.dark(Math.max(0, v - .15), 'umibe'); }
    if (!quiet && old != null && old !== h) S.toast('柱钟：' + hourText(h));
  }

  /* ---------- 小工具 ---------- */
  const N = t => S => S.narr(t);
  const rot = (who, lines, k) => async S => { const f = S.f; const i = f[k] = ((f[k] ?? -1) + 1) % lines.length; await S.say(who, lines[i]); };
  const dots = g => '●'.repeat(Math.min(3, g)) + '○'.repeat(Math.max(0, 3 - g));

  /* ---------- 被盯上（违反规则） ---------- */
  async function gazeUp(S, why) {
    const f = S.f; f.gaze = (f.gaze || 0) + 1;
    S.sfx('heart'); S.shake(350, 1);
    S.toast('背后一凉——被盯上了 ' + dots(f.gaze) + (why ? '（' + why + '）' : ''));
    if (f.gaze >= 3) {
      lastDeath = 'gaze';
      await S.wait(500);
      await S.scare('face', { spr: '@shoF', dur: 1.1 });
      await S.die('……它记住你的脸了。\n不管你逃到哪儿，晚上一闭上眼睛，就能听见有个小孩，在门外叫你的名字。\n\n（同一个夏天里犯了三次规矩：被它盯上了。）', '被盯上了');
    }
  }

  /* ---------- 规则单（每天多一条） ---------- */
  function rulesText(S) {
    const f = S.f, d = f.day || 1;
    let t = '（老板娘的字，圆珠笔写在便笺上，贴在员工房门外的墙上。）\n\n汐见屋　打工须知\n\n一、二楼最里面的「浜之间」，不许进去。\n二、晚上九点以后，不要上二楼。';
    if (d >= 2) t += '\n三、夜里有人隔着门叫你的名字，不要答应。\n四、二楼走廊尽头的镜子，布不要掀开。\n　（三、四两条墨水颜色不一样，是今天早上才添上去的。）';
    if (d >= 3) t += '\n\n五、不要把哥哥带走\n　（这一行是蜡笔写的。字歪歪扭扭，像小孩子写的。最后一个字写出了纸外。）';
    t += '\n\n违反规矩的时候，背后一凉的次数：' + dots(f.gaze || 0);
    return t;
  }
  const showRules = S => S.note('规则单', rulesText(S), 'rules');

  /* ---------- 目标 ---------- */
  function setGoal(S) {
    const f = S.f;
    if (f.ph === 'd1') {
      if (!f.bag) return S.goal('把行李放进员工房的柜子（走廊东头）');
      const L = [];
      if ((f.srv || 0) < 2) L.push('送晚饭 ' + (f.srv || 0) + '/2（厨房找老板）');
      const b = (f.b1 ? 1 : 0) + (f.b2 ? 1 : 0) + (f.b3 ? 1 : 0);
      setHour(S, 4 + (f.srv || 0) + b);
      if (b < 3) L.push('刷浴场 ' + b + '/3');
      return S.goal('【第一天·傍晚】今天的活：' + L.join('、'));
    }
    if (f.ph === 'd2') {
      const L = [], r = (f.r1 ? 1 : 0) + (f.r2 ? 1 : 0) + (f.r3 ? 1 : 0);
      setHour(S, [6, 8, 10, 12, 14, 15, 17][Math.min(6, (f.tr || 0) + r)]);
      if ((f.tr || 0) < 3) L.push('海边捡垃圾 ' + (f.tr || 0) + '/3');
      if (r < 3) L.push('收拾二楼 ' + r + '/3（叠松之间、竹之间的被褥，扫浜之间门口）');
      if (!L.length) return S.goal(S.map === 'kan1' ? '活干完了' : '活干完了——回旅馆一楼');
      return S.goal('【第二天】今天的活：' + L.join('、'));
    }
  }

  /* ================= 画：道具精灵 ================= */
  function trayDraw(R, x, y, full) {   // 漆盘：一碗冒尖的白饭，筷子直直插在正中间；一杯水
    R(x, y + 4, 14, 4, '#2a0e0a'); R(x + 1, y + 4, 12, 1, '#5a1e16'); R(x, y + 7, 14, 1, '#140604');
    R(x + 2, y, 6, 5, '#e8e4dc'); R(x + 2, y + 4, 6, 1, '#b8b4aa');
    if (full) { R(x + 3, y - 2, 4, 2, '#f8f6f0'); R(x + 4, y - 3, 2, 1, '#ffffff'); }
    else { R(x + 3, y, 4, 1, '#cfcac0'); R(x + 10, y + 8, 1, 1, '#f4f2ec'); R(x + 12, y + 9, 1, 1, '#f4f2ec'); }
    R(x + 4, y - 9, 1, 8, '#c8a060'); R(x + 6, y - 9, 1, 8, '#b08a4a');
    R(x + 9, y + 1, 3, 4, 'rgba(200,225,235,.85)'); R(x + 9, y + 1, 3, 1, '#e8f4f8');
  }
  const ofudaPos = [[1, 0], [5, 1], [10, 0], [3, 6], [8, 5], [12, 6], [1, 10], [6, 10], [11, 10]];
  const SPRITES = {
    zendai(g, e, t, R) {   // 厨房调理台（w=2）：摞着的漆盘
      box(R, 0, 2, 32, 12, '#7a6650'); R(1, 3, 30, 2, '#9a866c'); R(2, 12, 2, 3, '#3a2a1a'); R(28, 12, 2, 3, '#3a2a1a');
      for (let i = 0; i < 3; i++) R(3, 4 - i * 2, 12, 2, i % 2 ? '#3a120c' : '#5a1e16');
      R(19, -1, 8, 6, '#e8e4dc'); R(20, -2, 6, 1, '#f4f2ec'); R(18, 4, 10, 1, '#b8b4aa');
    },
    kama(g, e, t, R) { box(R, 0, 2, 16, 13, '#8a7a62'); R(3, -3, 10, 7, '#2a2624'); R(2, -4, 12, 2, '#4a4440'); R(7, -6, 2, 2, '#6a6460'); if (Math.sin(t * 1.3) > .2) R(7 + Math.round(Math.sin(t * 3)), -11, 1, 4, 'rgba(230,230,230,.35)'); },
    zen(g, e, t, R) { trayDraw(R, 1, 6, e.full !== false); },
    zenspot(g, e, t, R) { trayDraw(R, 1, 6, !!e.full); },
    fdoor(g, e, t, R) {   // 浜之间的纸门：贴满了御札
      R(0, -2, 16, 16, '#2a1e14'); R(1, -1, 7, 14, '#c9c1aa'); R(8, -1, 7, 14, '#c4bca4');
      if (e.open) { R(6, -1, 4, 14, '#030203'); if (e.eyes) { R(7, 3, 1, 1, '#e8f0f0'); R(9, 3, 1, 1, '#e8f0f0'); } }
      for (const [x, y] of ofudaPos) { if (e.open && x >= 5 && x <= 9) continue; R(x, y, 3, 5, '#f2eee2'); R(x + 1, y + 1, 1, 1, '#a01818'); R(x + 1, y + 3, 1, 1, '#1a1a1a'); }
      R(0, 6, 16, 1, '#2a1e14');
    },
    kagami(g, e, t, R) {   // 走廊尽头的大镜子（墙面）：蒙着白布 / 掀开
      box(R, 2, -7, 12, 21, '#3a2414'); R(3, -6, 10, 19, '#2c3a44');
      if (e.covered) {
        R(1, -8, 14, 23, '#dcd7ca'); R(1, 13, 14, 2, '#bcb6a8'); for (let x = 3; x < 14; x += 3) R(x, -6, 1, 19, '#c4beb0');
        R(1, -8, 14, 1, '#ece8de'); return;
      }
      R(4, -5, 3, 9, '#46586a'); R(9, -4, 1, 6, '#5a6e80');
      if (e.face) { R(6, 6, 4, 4, '#8a9aa0'); R(6, 5, 4, 2, '#0a0a0c'); R(5, 10, 6, 3, '#5a6a74'); R(7, 7, 1, 1, '#000'); R(9, 7, 1, 1, '#000'); }
      if (e.s.cloth) { R(1, 12, 14, 3, '#dcd7ca'); R(2, 11, 6, 1, '#cfc9bb'); }
    },
    bmirror(g, e, t, R) {   // 浴场的镜子（墙面）：一层雾
      box(R, 1, 0, 14, 12, '#8a8a84'); R(2, 1, 12, 10, e.s.wiped ? '#6a7c88' : '#b8c0c4');
      if (!e.s.wiped) for (let i = 0; i < 6; i++) R(3 + (i * 5) % 10, 2 + (i * 3) % 8, 2, 1, '#cdd4d6');
      if (e.s.hand) { R(9, 4, 3, 3, 'rgba(70,80,86,.8)'); R(9, 2, 1, 2, 'rgba(70,80,86,.8)'); R(10, 2, 1, 2, 'rgba(70,80,86,.8)'); R(11, 3, 1, 1, 'rgba(70,80,86,.8)'); R(12, 5, 1, 1, 'rgba(70,80,86,.8)'); }
    },
    drain(g, e, t, R) { R(5, 5, 6, 6, '#4a5a5a'); R(6, 6, 4, 4, '#1a2222'); for (let i = 0; i < 3; i++) R(6, 6 + i * 1.5, 4, 1, '#6a7a7a'); if (!e.s.done) { R(9, 9, 3, 2, '#0a0a0a'); R(11, 10, 2, 1, '#0a0a0a'); } },
    oke(g, e, t, R) { box(R, 2, 6, 7, 8, '#b08a58'); R(2, 8, 7, 1, '#6a5030'); R(2, 11, 7, 1, '#6a5030'); box(R, 9, 9, 6, 5, '#e8e4d8'); },
    koyomi(g, e, t, R) {   // 挂历（墙面）
      R(3, 0, 10, 12, '#f2eee4'); R(3, 0, 10, 3, '#b03030'); R(6, 1, 4, 1, '#f2eee4');
      for (let r = 0; r < 4; r++) for (let c = 0; c < 4; c++) R(4 + c * 2, 4 + r * 2, 1, 1, '#555');
      R(7, 7, 3, 3, 'rgba(200,30,30,.0)'); R(7, 7, 3, 1, '#c82020'); R(7, 9, 3, 1, '#c82020'); R(7, 7, 1, 3, '#c82020'); R(9, 7, 1, 3, '#c82020');
    },
    hclock(g, e, t, R) {   // 柱时钟（墙面）
      box(R, 4, -6, 8, 19, '#4a2a18'); R(5, -5, 6, 6, '#e8e2cc');
      const a = ((e.num ?? 6) % 12) / 12 * Math.PI * 2; R(8, -2, 1, 1, '#111'); R(8 + Math.round(Math.sin(a) * 2), -2 - Math.round(Math.cos(a) * 2), 1, 1, '#111');
      R(6, 3, 4, 8, '#2a1a10'); const s = Math.round(Math.sin(t * 3.2) * 1.5); R(7 + s, 8, 2, 2, '#c9a35a'); R(8, 3, 1, 5, '#8a7040');
    },
    rulesP(g, e, t, R) { R(4, 2, 8, 10, '#f4f0e2'); R(5, 4, 6, 1, '#555'); R(5, 6, 5, 1, '#555'); R(5, 8, 6, 1, e.s.d2 ? '#2a3a8a' : '#555'); if (e.s.d3) R(5, 10, 5, 1, '#d83a2a'); R(7, 1, 2, 2, '#c03030'); },
    kamidana(g, e, t, R) {   // 神龛（墙面）：一张黑色的符
      box(R, 0, 0, 16, 5, '#6a5036'); R(5, -6, 6, 6, '#8a6a44'); R(4, -7, 8, 1, '#4a3420');
      R(7, -5, 2, 5, '#141012'); R(7, -4, 2, 1, '#6a1010'); R(2, 5, 12, 1, '#e8e2d0'); R(4, 6, 1, 2, '#e8e2d0'); R(11, 6, 1, 2, '#e8e2d0');
      R(9, 3, 3, 1, '#1a1212');
    },
    mfuton(g, e, t, R) {   // 客房里没叠的被褥（h=2）/ 叠好
      if (e.s.done) { box(R, 2, 14, 12, 8, '#e8e4d8'); R(2, 14, 12, 3, '#7a8aa8'); R(2, 17, 12, 1, '#5a6a88'); return; }
      R(1, 2, 14, 28, '#e4dfd2'); R(2, 3, 10, 5, '#f2eee6'); R(0, 10, 16, 18, '#7a8aa8'); R(2, 12, 9, 4, '#9aa6be'); R(4, 20, 11, 6, '#6a7a98'); R(12, 8, 4, 6, '#7a8aa8');
    },
    toybox(g, e, t, R) { box(R, 1, 4, 14, 11, '#a88a5a'); R(1, 7, 14, 1, '#7a6040'); R(4, 9, 8, 3, '#f2eee2'); R(6, 10, 4, 1, '#2a2a2a'); R(3, 1, 5, 4, '#d8c070'); R(9, 2, 5, 3, '#3a8ad8'); },
    innfront(g, e, t, R) {   // 汐见屋的门脸（画在屋顶最下一行，w=12）
      const w = e.w * 16;
      R(0, -4, w, 20, '#4a3828'); R(0, -4, w, 2, '#2a1e14');
      for (let i = 0; i < e.w; i++) { if (i === 6 || i === 11) continue; R(i * 16 + 2, 0, 12, 9, '#c9c1aa'); R(i * 16 + 7, 0, 1, 9, '#4a3828'); R(i * 16 + 2, 4, 12, 1, '#4a3828'); }
      R(6 * 16 + 1, -2, 14, 18, '#1a120c'); R(6 * 16 + 2, -2, 12, 5, '#2a3a6a'); R(6 * 16 + 6, -1, 4, 3, '#e8e2d0');   // 正门的暖帘
      R(11 * 16 + 3, 1, 10, 15, '#3a2a1a'); R(11 * 16 + 4, 2, 8, 13, '#5a4430'); R(11 * 16 + 10, 8, 1, 2, '#c9a35a');   // 厨房侧门
      R(2 * 16, -12, 3 * 16, 8, '#2a1e14'); R(2 * 16 + 2, -11, 3 * 16 - 4, 6, '#d8ccaa'); for (let i = 0; i < 3; i++) R(2 * 16 + 8 + i * 13, -10, 6, 4, '#2a1e14');   // 招牌「汐见屋」
      R(0, 14, w, 2, '#2a1e14');
    },
    uminoie(g, e, t, R) {   // 海之家（关着卷帘，w=3）
      const w = e.w * 16; R(0, -10, w, 4, '#c83a2a'); for (let x = 0; x < w; x += 8) R(x, -6, 4, 3, '#e8e2d0');
      box(R, 1, -3, w - 2, 18, '#8a7a62'); for (let y = -1; y < 14; y += 3) R(3, y, w - 6, 1, '#6a5a44'); R(6, -2, w - 12, 3, '#3a6ab0'); R(10, -1, w - 20, 1, '#e8e2d0');
    },
    parasol(g, e, t, R) { R(7, -2, 2, 17, '#e8e2d6'); R(0, -8, 16, 3, e.col || '#d84a3a'); R(2, -10, 12, 2, e.col || '#d84a3a'); R(4, -8, 4, 3, '#f2eee4'); R(10, -8, 3, 3, '#f2eee4'); R(5, 13, 6, 2, 'rgba(0,0,0,.25)'); },
    gomi(g, e, t, R) {
      const k = e.num || 0;
      if (k === 0) { R(5, 9, 6, 4, '#c8c8c8'); R(5, 9, 6, 1, '#e8e8e8'); R(5, 11, 6, 1, '#c03030'); }   // 空罐
      else if (k === 1) { R(3, 8, 9, 6, 'rgba(230,236,240,.8)'); R(4, 7, 3, 2, 'rgba(230,236,240,.8)'); R(6, 10, 4, 1, '#3a6ab0'); }   // 塑料袋
      else { R(4, 11, 8, 1, '#3a2a1a'); R(5, 8, 1, 4, '#e84a8a'); R(8, 7, 1, 5, '#e8c040'); R(10, 9, 1, 3, '#4ac0e8'); R(5, 7, 1, 1, '#2a2a2a'); R(8, 6, 1, 1, '#2a2a2a'); }   // 烟花棒
      if (Math.sin(t * 3 + k) > .7) R(12, 6, 1, 1, '#fff6c0');
    },
    sandalS(g, e, t, R) { R(4, 10, 7, 3, '#c82a2a'); R(4, 10, 7, 1, '#e84a3a'); R(5, 8, 1, 2, '#c82a2a'); R(9, 8, 1, 2, '#c82a2a'); R(5, 8, 5, 1, '#a01a1a'); R(3, 13, 9, 1, 'rgba(0,0,0,.25)'); },
    ireihi(g, e, t, R) {   // 海边的慰灵碑
      R(2, 11, 12, 4, '#5a5a56'); R(4, -8, 8, 20, '#7a7a74'); R(4, -8, 8, 1, '#9a9a94'); R(11, -7, 1, 19, '#5a5a56');
      for (let y = -5; y < 8; y += 3) R(7, y, 2, 1, '#3a3a36');
      R(1, 12, 3, 3, '#2a6ab0'); R(1, 11, 1, 1, '#e8f0f8'); R(12, 12, 3, 2, '#e8c040'); R(13, 11, 2, 1, '#3a8ad8');
    },
    tomyo(g, e, t, R) {   // 灯明台
      R(4, 13, 8, 2, '#2a1a10'); R(7, 2, 2, 12, '#4a3020'); R(4, 1, 8, 2, '#8a6a3a'); R(7, -4, 2, 5, '#ece6d2');
      if (!e.off) { const f = Math.sin(t * 15 + e.px) > 0 ? 0 : 1; R(7, -9 + f, 2, 5 - f, '#ffcf5a'); R(7, -7, 2, 2, '#fff2b0'); R(8, -10 + f, 1, 1, '#ff8a2a'); }
      else { R(8, -7, 1, 3, 'rgba(200,200,200,.35)'); R(7, -5, 2, 1, '#2a2a2a'); }
    },
    kfuton(g, e, t, R) {   // 被褥上躺着健太（h=2）
      R(1, 1, 14, 30, '#d8d2c2'); R(2, 2, 12, 6, '#eeeae0');
      if (!e.s.empty) { R(5, 2, 6, 6, '#e0b490'); R(5, 1, 6, 3, '#2a1a12'); R(4, 2, 1, 3, '#2a1a12'); R(11, 2, 1, 2, '#2a1a12'); if (e.s.eyes) { R(6, 5, 1, 1, '#000'); R(9, 5, 1, 1, '#000'); } else { R(6, 5, 2, 1, '#6a4a3a'); R(9, 5, 2, 1, '#6a4a3a'); } }
      R(1, 9, 14, 22, '#8a7a9a'); R(1, 9, 14, 2, '#a898b8');
      if (!e.s.empty) { R(3, 12, 10, 14, '#7a6a8a'); }
      for (let i = 0; i < 4; i++) R(0, 4 + i * 8, 1, 3, '#d8c890');   // 结界的白纸垂（御币）
    },
    crawler(g, e, t, R) {   // 趴在地上爬的人（健太 / 那个孩子）：e.col 衣服颜色，e.s.kid 小孩
      const kid = !!e.s.kid, sk = kid ? '#a6b6ba' : '#d0aa88', hr = kid ? '#08090b' : '#1a1210', c = e.col || '#b83a2a', st = e.fr === 1 ? 1 : e.fr === 3 ? -1 : 0;
      R(2, 13, 12, 2, 'rgba(0,0,0,.3)');
      if (e.dir === 0) {
        R(4, 3, 8, 8, c); R(3, 10 + st, 2, 4, sk); R(11, 10 - st, 2, 4, sk); R(4, 1 - st, 2, 3, c); R(10, 1 + st, 2, 3, c);
        R(5, 9, 6, 5, sk); R(5, 8, 6, 3, hr); R(4, 9, 1, 4, hr); R(11, 9, 1, 4, hr); R(6, 11, 1, 1, '#000'); R(9, 11, 1, 1, '#000');
        if (kid) { R(6, 10, 1, 3, hr); R(9, 10, 1, 2, hr); }
      } else if (e.dir === 3) {
        R(4, 5, 8, 8, c); R(3, 3 + st, 2, 4, sk); R(11, 3 - st, 2, 4, sk); R(4, 12 - st, 2, 3, c); R(10, 12 + st, 2, 3, c);
        R(5, 1, 6, 5, hr);
      } else {
        const fl = e.dir === 2, X = (x, w) => fl ? 16 - x - w : x;
        R(X(4, 9), 7, 9, 4, c); R(X(3, 2), 10 + st, 2, 4, sk); R(X(11, 2), 10 - st, 2, 4, c); R(X(9, 2), 11, 2, 3, c);
        R(X(0, 5), 5, 5, 5, sk); R(X(0, 5), 4, 5, 2, hr); R(X(4, 1), 5, 1, 4, hr); R(X(1, 1), 7, 1, 1, '#000');
        if (kid) { R(X(0, 1), 6, 1, 4, hr); R(X(2, 1), 6, 1, 3, hr); }
      }
      if (kid && Math.sin(t * 5 + e.px) > .6) R(7, 14, 1, 1, 'rgba(150,200,215,.8)');
    },
    shoro(g, e, t, R) { R(-2, -22, 20, 3, '#2a2018'); R(0, -19, 2, 34, '#4a3020'); R(14, -19, 2, 34, '#4a3020'); R(5, -16, 6, 2, '#3a3a30'); R(4, -14, 8, 12, '#5a5a48'); R(4, -14, 8, 1, '#7a7a64'); R(3, -3, 10, 2, '#4a4a3a'); },
    sanmon(g, e, t, R) { R(-6, -26, 44, 4, '#2a2420'); R(-4, -22, 40, 2, '#4a3a2a'); R(-3, -20, 4, 35, '#5a3a22'); R(31, -20, 4, 35, '#5a3a22'); R(0, -18, 32, 3, '#5a3a22'); R(10, -15, 12, 4, '#d8d0bc'); R(11, -14, 10, 1, '#333'); },
    mokugyo(g, e, t, R) { R(3, 8, 10, 6, '#8a2a1a'); R(4, 7, 8, 2, '#a83a24'); R(5, 10, 6, 1, '#3a0a06'); R(11, 4, 1, 5, '#6a4a2a'); R(10, 3, 3, 2, '#c8a060'); R(2, 13, 12, 2, '#4a2a6a'); },
    rinS(g, e, t, R) { R(3, 12, 10, 3, '#6a2a4a'); R(4, 7, 8, 6, '#b08a3a'); R(4, 7, 8, 1, '#d8b860'); R(5, 8, 6, 1, '#3a2a10'); },
    touba(g, e, t, R) { R(6, -10, 4, 24, '#d8ccaa'); R(6, -10, 4, 2, '#c8bc9a'); R(7, -12, 2, 2, '#d8ccaa'); for (let y = -7; y < 10; y += 3) R(7, y, 2, 1, '#2a2a2a'); },
    kdenwa(g, e, t, R) { box(R, 2, 4, 12, 11, '#5a4030'); R(4, 1, 8, 4, '#d86a8a'); R(3, 0, 10, 2, '#e88aa0'); R(6, 2, 4, 2, '#3a3a3a'); },
    signT(g, e, t, R) { R(7, -2, 2, 16, '#5a4430'); box(R, 1, -10, 14, 8, '#d8ccaa'); R(3, -7, 7, 1, '#2a2a2a'); R(10, -8, 3, 3, '#2a2a2a'); R(11, -9, 1, 1, '#2a2a2a'); }
  };

  /* ================= 惊吓大头像 ================= */
  const FACES = {
    /* 那个孩子：泡得发灰的脸，湿头发一绺一绺贴在脸上，两个黑洞洞的眼窝，嘴慢慢张开 */
    shoF(R, a, t) {
      const HR = '#050608', SK = '#9fb0b4', SK2 = '#7d8f94', SK3 = '#5f7176';
      R(0, 0, 32, 32, '#030508');
      R(6, 2, 20, 10, HR); R(4, 6, 5, 26, HR); R(23, 6, 5, 26, HR);
      R(9, 9, 14, 17, SK); R(9, 9, 1, 17, SK2); R(22, 9, 1, 17, SK2); R(10, 25, 12, 2, SK2); R(11, 27, 10, 1, SK3);
      for (const [x, l] of [[10, 9], [12, 6], [15, 12], [18, 7], [20, 10], [21, 5]]) R(x, 9, 1, l, HR);
      const e = 3 + Math.round(Math.min(1, a * 1.4) * 2);
      R(11, 14, 4, e, '#000'); R(17, 14, 4, e, '#000');
      if (Math.sin(t * 19) > .6) { R(12, 15, 1, 1, '#cfe8ee'); R(18, 15, 1, 1, '#cfe8ee'); }
      R(15, 19, 2, 2, SK2);
      const h = 1 + Math.round(Math.min(1, a * 1.6) * 5);
      R(14, 22, 4, h, '#0a0204'); if (h > 2) { R(13, 23, 1, h - 2, SK3); R(18, 23, 1, h - 2, SK3); }
      for (let i = 0; i < 4; i++) { const y = ((t * 30 + i * 9) % 22) | 0; R(8 + i * 5, 10 + y, 1, 2, 'rgba(160,200,210,.75)'); }
      R(7, 18, 2, 1, '#2c4a32'); R(8, 19, 3, 1, '#2c4a32'); R(10, 20, 2, 1, '#2c4a32');
      R(8, 28, 16, 4, '#6a7a84'); R(14, 28, 4, 2, '#4a5a64');
    },
    /* 被附上的健太：咧到耳根的笑，嘴角粘着饭粒，眼珠翻上去只剩一点 */
    kentaPF(R, a, t) {
      const SK = '#cdb49a', SK2 = '#a89078', HR = '#120c0a';
      R(0, 0, 32, 32, '#0a0606');
      R(6, 4, 20, 8, HR); R(5, 7, 3, 9, HR); R(24, 7, 3, 9, HR); for (let i = 0; i < 6; i++) R(7 + i * 3, 3 - (i % 2), 2, 3, HR);
      R(8, 9, 16, 17, SK); R(8, 9, 1, 17, SK2); R(23, 9, 1, 17, SK2); R(9, 26, 14, 2, SK2);
      R(10, 13, 5, 4, '#efe9dc'); R(17, 13, 5, 4, '#efe9dc'); const up = a > .4 ? 0 : 1; R(12, 13 + up, 2, 1, '#000'); R(19, 13 + up, 2, 1, '#000');
      R(10, 17, 5, 1, '#7a5a5a'); R(17, 17, 5, 1, '#7a5a5a');
      R(15, 18, 2, 2, SK2);
      const w = 10 + Math.round(Math.min(1, a * 1.5) * 4); R(16 - w / 2, 21, w, 3, '#3a0a0a'); R(17 - w / 2, 21, w - 2, 1, '#e8e4d8');
      R(9, 23, 1, 1, '#ffffff'); R(22, 22, 1, 1, '#ffffff'); R(20, 25, 1, 1, '#ffffff'); R(12, 25, 1, 1, '#ffffff');
      R(8, 28, 16, 4, '#9a3a30');
    }
  };

  /* ================= 瓦片 ================= */
  const TILES = {
    roof: { solid: true, paint(R, X, Y) { R(0, 0, 16, 16, '#3c424e'); for (let y = 0; y < 16; y += 4) { R(0, y + 3, 16, 1, '#272b33'); for (let x = (y / 4 % 2) * 2; x < 16; x += 4) R(x, y, 1, 3, '#4e5664'); } } },
    steps: { solid: false, paint(R, X, Y) { R(0, 0, 16, 16, '#6a665e'); R(0, 0, 16, 2, '#86827a'); R(0, 13, 16, 3, '#46433d'); if (hash(X, Y, 4) < .4) R(((hash(X, Y, 5) * 12) | 0) + 1, 6, 3, 2, '#4e6a3e'); R(X % 2 ? 15 : 0, 2, 1, 11, '#5a5650'); } },
    gravel: { solid: false, paint(R, X, Y) { speck(R, '#8e8a80', ['#a29e94', '#7a766c', '#b4b0a6'], X, Y, 26, 14); } }
  };

  /* 员工房里睡着人的被褥 */
  SPRITES.futonP = (g, e, t, R) => {
    const c = e.col || '#4a6a8a';
    R(1, 1, 14, 30, '#d8d2c2'); R(2, 2, 12, 6, '#eeeae0');
    if (e.s.occ) { R(5, 2, 6, 5, e.s.sk || '#e8b88e'); R(5, 1, 6, 3, e.s.hc || '#2a1a12'); }
    R(1, 9, 14, 22, c); R(1, 9, 14, 2, shade(c, .2));
    if (e.s.occ) { R(3, 11, 10, 14, shade(c, -.12)); R(3, 11, 10, 1, shade(c, .15)); }
  };

  /* ================= 第一天 ================= */
  async function lobbyIntro(S) {
    const f = S.f;
    S.focus(13, 12);
    await S.narr('门框被海风吹得发白。玄关里一股潮乎乎的榻榻米味，混着线香。\n帐场后面，一个穿和服的女人抬起头，笑了。');
    await S.say('老板娘', ['欢迎欢迎。你们就是网上应聘的三位大学生吧？', '我是这里的老板娘。这个暑假，辛苦你们了。']);
    S.bubble('kenta1', '!', 900);
    await S.say('健太', '包吃包住对吧？饭管够吗？');
    await S.say('老板娘', '管够。我们家老板做的饭，香着呢。');
    await S.say('老板娘', ['干活的事，阿兼婆婆会教你们。', '不过有几条规矩，一定要守。']);
    f.day = 1; await showRules(S);
    await S.say('修一', '……「浜之间」？', { style: 'whisper' });
    await S.say('健太', '里面藏着宝贝吧！');
    await S.narr('老板娘的笑容一点都没变。');
    await S.say('老板娘', ['……那间屋子，在装修。', '行李先放到员工房的柜子里——走廊东头。放好了，去厨房找老板，帮忙送晚饭。']);
    S.focus(null);
    await Promise.all([S.walk('kenta1', [15, 9], 4.6), S.walk('shu1', [14, 8], 4.6)]);
    S.place('kenta1', 24, 3, 0); S.place('shu1', 20, 5, 2);
    f.ph = 'd1'; setHour(S, 4, true); setGoal(S);
  }
  async function lockerUse(S) {
    const f = S.f;
    if (f.ph !== 'd1' || f.bag) return S.narr('铁皮柜子。你的那一格里塞着运动包。\n' + (f.memo ? '柜子最里面，就是那本打工日记掉出来的地方。' : ''));
    S.sfx('open');
    await S.narr('你把运动包塞进柜子。包顶住了什么东西——\n柜子最里面，卡着一本皱巴巴的小本子。');
    f.memo = true; await S.note('memo');
    await S.think('（……去年在这儿打工的人留下的。最后几页被撕掉了。）');
    f.bag = true; setGoal(S);
  }
  const lockerOther = N('别人的柜子。门上贴着「健太」「修一」的胶布，字是老板娘写的，很好看。');

  /* ---------- 送晚饭 ---------- */
  async function taishoTalk(S) {
    const f = S.f; S.face('taisho', 'pl');
    if (f.ph === 'd1') {
      if (!f.bag) return S.say('老板', '……先放行李。');
      if (S.has('zenA') || S.has('zenB')) return S.say('老板', S.has('zenA') ? '……松之桌。两位。' : '……竹之桌。一位。');
      if ((f.srv || 0) === 0) { S.give('zenA'); return S.say('老板', ['……宴会厅，松之桌，两位。刺身定食。', '……别洒了。']); }
      if (f.srv === 1) { S.give('zenB'); return S.say('老板', '……竹之桌。烤鱼。老先生，饭少盛。'); }
      return S.say('老板', '……辛苦。');
    }
    if (f.ph === 'n2pre') return taishoZen(S);
    if (f.ph === 'd3') return taishoD3(S);
    if (f.ph === 'eve1' || f.ph === 'n1') return S.say('老板', '……九点以后，别上楼。');
    if (f.ph === 'd2') return S.say('老板', ['……二楼的活，天黑以前干完。', '……盂兰盆快到了。别下海。'][(f._ta = ((f._ta ?? -1) + 1) % 2)]);
    await S.say('老板', '……');
  }
  async function tableUse(S, which) {
    const f = S.f;
    if (f.ph !== 'd1') return S.narr(which === 'M' ? '矮桌擦得发亮。' : '矮桌上放着一个烟灰缸，里面一个烟头也没有。');
    const want = which === 'M' ? 'zenA' : 'zenB', other = which === 'M' ? 'zenB' : 'zenA';
    if (S.has(want)) {
      S.take(want); S.sfx('select'); f.srv = (f.srv || 0) + 1;
      if (which === 'M') await S.say('客人（男）', ['哇，这生鱼片！', '……对了小哥，二楼半夜是不是有小孩在跑？咚咚咚的。']);
      else await S.say('老先生', ['……谢谢。', '这家啊，我年轻的时候常来。那时候老板娘的小儿子，晒得黑黑的，老在走廊里跑来跑去。', '……这几年来，倒是一次都没见着。']);
      setGoal(S); return dayCheck1(S);
    }
    if (S.has(other)) return S.say(which === 'M' ? '客人（女）' : '老先生', '……这不是我们点的。');
    return S.narr(which === 'M' ? '一对来海边玩的夫妻，晒得通红。' : '一位老先生，一个人慢慢地喝着啤酒。');
  }
  const guestLine = (who, a, b) => async S => S.say(who, S.f.ph === 'd1' && (S.f.srv || 0) < 2 ? a : b);

  /* ---------- 刷浴场 ---------- */
  async function tubUse(S) {
    const f = S.f;
    if (f.ph !== 'd1' || f.b1) return S.narr('浴池里放着温泉水，冒着白气。');
    S.sfx('water'); f.b1 = true;
    await S.narr('你跪在浴池边上，把瓷砖刷了一遍。\n水垢底下，有几道细细的划痕。很浅，像是小孩子的指甲抓出来的。');
    setGoal(S); return dayCheck1(S);
  }
  async function bmirrorUse(S) {
    const f = S.f, m = S.ent('bmirror');
    if (f.ph !== 'd1' || f.b2) return S.narr(m.s.hand ? '镜子擦干净了。那个小手印，你擦了三遍都擦不掉。' : '浴场的镜子。');
    m.s.wiped = true; S.sfx('select'); f.b2 = true;
    await S.narr('镜子上全是雾。你拿抹布从左到右抹了一把——');
    await S.wait(400); m.s.hand = true; S.sfx('sting'); S.shake(250, 1);
    await S.narr('抹干净的地方，留着一个小小的手印。五根手指。\n……你又抹了一把。抹不掉。');
    await S.think('（……是从镜子的那一面按上来的。）');
    setGoal(S); return dayCheck1(S);
  }
  async function drainUse(S) {
    const f = S.f, d = S.ent('drain');
    if (f.ph !== 'd1' || f.b3) return S.narr('排水口。水哗哗地流下去。');
    d.s.done = true; f.b3 = true; S.sfx('drip'); drip(S);
    await S.narr('排水口塞住了。你用夹子夹出来一团东西——\n一团短短的黑头发。小孩子的头发。\n还是湿的，带着一股海水的咸味。');
    setGoal(S); return dayCheck1(S);
  }
  async function dayCheck1(S) {
    const f = S.f;
    if (f.ph !== 'd1' || (f.srv || 0) < 2 || !(f.b1 && f.b2 && f.b3)) return;
    await S.wait(300);
    return evening1(S);
  }
  async function evening1(S) {
    const f = S.f; f.ph = 'eve1';
    await S.fade(1, 700);
    S.amb('night'); S.dark(.6, 'kan1'); S.plr(3);
    ['gM', 'gF', 'gO'].forEach(i => S.hide(i));
    S.pos(15, 9, 1); S.place('kenta1', 16, 9, 1); S.place('shu1', 13, 8, 0);
    setHour(S, 21, true);
    await S.fade(0, 700);
    await S.narr('晚上九点。走廊里的柱钟「当、当」地敲着。');
    S.place('okamiT', 4, 8, 2); S.focus(8, 7);
    await S.narr('厨房的门帘一掀，老板娘端着一个漆盘走了出来。\n盘子上是一碗盛得冒尖的白饭。一双筷子，直直地插在饭的正中间。');
    await S.walk('okamiT', [10, 8], 2.2);
    S.face('okamiT', 2); await S.say('老板娘', '……晚安。早点睡。');
    await S.walk('okamiT', [[10, 6], [10, 3]], 2.2); S.hide('okamiT');
    S.sfx('step'); await S.wait(400); S.sfx('step'); S.focus(null);
    await S.say('健太', '……喂。那碗饭，是给谁吃的？', { style: 'whisper' });
    await S.say('修一', '饭上竖着插筷子——那是「枕饭」。供给死人的。', { style: 'whisper' });
    crawlPat(S, .14); S.shake(600, 1);
    await S.narr('天花板上，有什么东西，咚、咚地，从这头爬到那头。\n停在了楼梯口的正上方。');
    await S.say('健太', '……猫吧。');
    await S.say('修一', '那么重的猫？');
    S.place('kenta1', 24, 3, 0); S.place('shu1', 20, 5, 2);
    f.ph = 'n1'; S.goal('回员工房睡觉（你的被褥在最里面）');
    S.cp('n1');
  }

  /* ================= 第一夜 ================= */
  async function stairsUp(S) {
    const f = S.f;
    if (f.ph === 'd1') return S.narr('通往二楼的楼梯。老板娘说，二楼是客房，今天不用上去。');
    if (f.ph === 'eve1') return;
    if (f.ph === 'n1') {
      const r = await S.ask('楼梯上黑漆漆的。规矩上写着：晚上九点以后，不要上二楼。', ['算了，回去睡觉', '就上去看一眼']);
      if (r === 0) { S.pos(10, 4, 0); return; }
      await S.narr('你踩上了第一级台阶。木头「吱」地叫了一声。\n第二级。第三级——');
      S.sfx('heart');
      await S.narr('楼梯的尽头，站着老板娘。\n手里端着那个漆盘。碗空了。筷子还竖在空碗里。');
      await S.say('老板娘', ['……拓海君。', '规矩上写着的吧？'], { style: 'whisper' });
      await gazeUp(S, '九点以后上了二楼');
      await S.narr('她就那么笑着，一直看着你退回楼下，退进员工房。');
      S.pos(24, 6, 3); return;
    }
    if (f.ph === 'd2') return S.go('kan2', 2, 7, 2);
    if (f.ph === 'eve2' || f.ph === 'n2pre') return S.narr('楼上静悄悄的。……九点再上去。');
    if (f.ph === 'n2') return S.go('kan2', 2, 7, 2);
    if (f.ph === 'd3') return S.narr('楼梯上，有一串小小的湿脚印，一直通到二楼。\n……现在不是上去的时候。');
  }
  async function n1Hum(S) {
    hum(S, .04);
    await S.narr('楼梯上面黑漆漆的。\n二楼，有人在很小声地哼歌。是个小孩子的声音。');
    await S.think('（……九点以后，不要上二楼。）');
  }
  async function myFuton(S) {
    const f = S.f;
    if (f.ph === 'n1') return night1(S);
    if (f.ph === 'd1') return S.narr('你的被褥。阿兼婆婆说，晚上自己铺，早上自己叠。');
    if (f.ph === 'd3') return S.narr('健太的被褥是空的。枕头上有几粒干掉的饭粒。');
    return S.narr('你的被褥。一股晒过太阳的味道。');
  }
  async function night1(S) {
    const f = S.f;
    S.ent('sfK').s.occ = true; S.ent('sfS').s.occ = true; S.hide('kenta1'); S.hide('shu1');
    await S.narr('你钻进被窝。窗外是一阵一阵的浪声。');
    await S.fade(1, 800); setHour(S, 2, true); S.hidePlayer(true); S.ent('sfM').s.occ = true; await S.wait(600); await S.fade(0, 800);
    S.amb('none');
    await S.narr('……半夜。浪声不知什么时候停了。');
    crawlPat(S, .13); await S.wait(1300); crawlPat(S, .1);
    await S.narr('咚。咚。咚。\n天花板上的东西，又在爬。这一次，爬到员工房的正上方，停住了。');
    await S.wait(600); S.sfx('whisper');
    await S.say('门外', '……健太……', { style: 'whisper' });
    await S.say('健太', '嗯……？谁啊……', { style: 'whisper' });
    await S.say('修一', '嘘——！', { style: 'whisper' });
    await S.wait(700);
    await S.say('门外', '……拓海……', { style: 'whisper' });
    const r = await S.ask('门外有人，隔着纸门，叫你的名字。声音很小，很近。', ['（蒙住头，不出声）', '「……谁？」']);
    if (r === 1) {
      await S.narr('「谁？」\n门外安静了。\n过了很久，那个声音笑了一下。像小孩子捉迷藏时，找到人的那种笑。');
      await gazeUp(S, '夜里应了声');
    } else await S.narr('你把被子拉过头顶，咬住被角。\n那个声音在门外又叫了两遍，然后沿着走廊，一点一点爬远了。\n……往楼梯那边。');
    return day2Start(S);
  }

  /* ================= 第二天 ================= */
  async function day2Start(S) {
    const f = S.f;
    await S.fade(1, 900);
    S.hidePlayer(false); S.ent('sfM').s.occ = false; S.ent('sfK').s.occ = false; S.ent('sfS').s.occ = false;
    f.ph = 'd2'; f.day = 2; S.ent('rulesP').s.d2 = true;
    S.dark(null, 'kan1'); S.plr(null); S.amb('room'); setHour(S, 6, true);
    S.pos(24, 5, 0); S.place('kenta1', 21, 6, 2); S.place('shu1', 24, 6, 3);
    await S.card('第二天', '八月十日　早上六点', '浪声。海鸥。\n还有，天花板上，一夜都没停的声音。');
    await S.fade(0, 900);
    await S.say('修一', '……你们来看门外那张规矩。');
    await showRules(S);
    await S.say('修一', '第三条和第四条，是今天早上才添上去的。墨水颜色都不一样。');
    await S.say('健太', ['……昨晚有人叫我，我好像应了一声。', '……我还以为是做梦。']);
    await S.say('修一', '她怎么知道昨晚的事？', { style: 'whisper' });
    S.place('kaneK', 23, 8, 3); S.sfx('open');
    await S.say('阿兼婆婆', ['起来了？上午跟我去海边，把沙滩上的垃圾捡了。', '下午把二楼的客房收拾了。松之间、竹之间，被褥叠好，走廊扫一扫。', '……天黑以前，一定下来。']);
    S.hide('kaneK');
    S.place('kenta1', 3, 14, 0); S.place('shu1', 24, 6, 0);
    ['g1', 'g2', 'g3', 'kaneU', 'shuU'].forEach(i => S.show(i));
    setGoal(S); S.cp('d2');
  }

  /* ---------- 海边捡垃圾 ---------- */
  async function gomiUse(S, id, txt) {
    const f = S.f;
    if (f.ph !== 'd2') return;
    S.hide(id); S.sfx('item'); f.tr = (f.tr || 0) + 1;
    await S.narr(txt);
    if (f.tr >= 3) await S.say('阿兼婆婆', '行了。下午上二楼。……天黑以前下来。');
    setGoal(S); return dayCheck2(S);
  }
  async function kaneBeach(S) {
    const f = S.f; S.face('kaneU', 'pl');
    if (S.has('sandal') && !f.kaneSandal) {
      f.kaneSandal = true;
      await S.narr('阿兼婆婆看见你手里那只红色的小凉鞋，扫帚停住了。');
      await S.say('阿兼婆婆', ['……在礁石那儿捡的？', '……', '收着吧。别让老板娘看见。']);
      return;
    }
    await rot('阿兼婆婆', [
      ['再过几天就是盂兰盆了。', '盂兰盆那几天，不许下海。老话说，海里的人会回来，拉活人的脚。'],
      ['那块碑？……十二年前立的。', '……我不该多嘴。快捡吧。'],
      ['老板娘命苦啊。', '每年夏天都招男孩子来打工。年年都招。……年年都是男孩子。']
    ], '_kb')(S);
  }
  async function sandalUse(S) {
    const f = S.f;
    const r = await S.ask('礁石缝里卡着一只小小的红色凉鞋。孩子穿的。\n泡得发白了，鞋带上缠着一根海草。', ['捡起来', '别碰它']);
    if (r) return;
    S.hide('sandalS'); S.give('sandal'); S.sfx('item');
    await S.think('（……只有一只。另一只呢？）');
  }

  /* ---------- 二楼客房 ---------- */
  async function mfutonUse(S, id, key, txt) {
    const f = S.f, e = S.ent(id);
    if (f.ph !== 'd2' || e.s.done) return S.narr(e.s.done ? '被褥叠得整整齐齐。' : '客人睡过的被褥。');
    e.s.done = true; f[key] = true; S.sfx('select');
    await S.narr(txt);
    setGoal(S); return dayCheck2(S);
  }
  async function photoUse(S) {
    const f = S.f;
    if (f.r3) return S.note('photo');
    f.r3 = true; S.hide('photoF'); S.sfx('paper');
    await S.narr('你拿扫帚扫到浜之间门口。地板缝里，卡着一张照片。');
    await S.note('photo');
    await S.think('（……红凉鞋。晒得黑黑的小男孩。老先生说的，就是他吧。）');
    setGoal(S); return dayCheck2(S);
  }
  async function dayCheck2(S) {
    const f = S.f;
    if (f.ph !== 'd2' || (f.tr || 0) < 3 || !(f.r1 && f.r2 && f.r3) || f.d2done) return;
    f.d2done = true; setHour(S, 17, true);
    if (S.map === 'kan2') { await S.narr('楼下传来阿兼婆婆的声音：\n「拓海！快下来！」'); S.goal('下楼'); }
    else if (S.map === 'umibe') { await S.narr('太阳偏西了。旅馆那边，阿兼婆婆在门口朝你招手。'); S.goal('回旅馆'); }
  }
  async function evening2(S) {
    const f = S.f; f.ph = 'eve2';
    S.dark(.42, 'kan1'); S.amb('room');
    S.hide('kaneU'); S.hide('shuU'); S.hide('okamiL'); S.show('okamiS'); S.show('sfuton'); S.place('kaneL', 15, 12, 0);
    S.place('kenta1', 17, 8, 0); S.place('shu1', 18, 8, 0);
    await S.narr('天色暗下来了。走廊里的灯一盏一盏亮起来。');
    S.face('kaneL', 'pl');
    await S.say('阿兼婆婆', ['拓海。老板娘烧得厉害，躺在帐场后面的屋里。', '……她叫你过去。叫你一个人。']);
    S.goal('去帐场后屋看老板娘（走廊东南边）');
  }

  /* ================= 第二夜 ================= */
  async function okamiSick(S) {
    const f = S.f; S.face('okamiS', 'pl');
    if (f.ph === 'eve2') {
      await S.narr('老板娘靠坐在被褥边上，头发散着，脸白得像纸。屋里一股退烧膏药的味道。');
      await S.say('老板娘', ['……拓海君。今晚，你替我把饭端上去。', '九点。到厨房找老板拿膳，端到浜之间门口，放下。', '敲三下门，说：「翔，吃饭了。」']);
      const r = await S.ask('「……翔，吃饭了。」老板娘又小声念了一遍。', ['「……翔是谁？」', '「……好。」'], '老板娘');
      if (r === 0) { await S.narr('老板娘笑了。'); await S.say('老板娘', '我儿子呀。……他怕生。'); }
      await S.say('老板娘', ['放下就走。门里面不管说什么，都不要应。', '走廊尽头那面镜子……布要是掉了，闭上眼睛，摸着盖回去。千万别看。', '下楼的时候——不要回头。']);
      f.knowName = true; f.ph = 'n2pre';
      S.goal('九点前到厨房，找老板拿膳');
      return;
    }
    if (f.ph === 'n2pre' || f.ph === 'n2') return S.say('老板娘', '……放下就走。不要回头。', { style: 'whisper' });
    await S.say('老板娘', '……');
  }
  async function taishoZen(S) {
    const f = S.f;
    if (S.has('zen')) return S.say('老板', '……端稳了。');
    S.give('zen');
    await S.narr('老板把一个漆盘递给你。\n一碗盛得冒尖的白饭，筷子笔直地插在正中间。一杯清水。一颗包着糖纸的水果糖。');
    await S.say('老板', '……端稳了。');
    await S.narr('他看了你很久。嘴唇动了动。');
    await S.say('老板', '……下楼的时候，别回头。', { style: 'whisper' });
    await S.fade(1, 600);
    setHour(S, 21, true); S.dark(.62, 'kan1'); S.amb('night');
    S.hide('kenta1'); S.place('shu1', 9, 8, 3);
    await S.card('晚上九点', '', '走廊里的柱钟敲了九下。\n楼上，那个声音停了。\n像是在等。');
    await S.fade(0, 600);
    await S.say('修一', ['……健太刚才还在这儿的。上厕所去了吧。', '你小心点。'], { style: 'whisper' });
    f.ph = 'n2'; f.n2s = 'up';
    S.goal('把膳端到二楼最里面的浜之间门口');
    S.cp('n2');
  }

  /* 二楼：门、镜子 */
  async function fdoorUse(S) {
    const f = S.f, d = S.ent('fdoor');
    if (f.ph === 'd2') {
      await S.narr('纸门上贴满了御札。一张压着一张，旧的发黄，新的还白着。门缝里透出一股潮乎乎的海水味。\n门口摆着早上收回来的膳：碗空了，一粒饭都不剩，筷子还竖着插在空碗里。');
      const r = await S.ask('规矩一：浜之间，不许进去。', ['别碰', '把门拉开一条缝']);
      if (r === 0) return;
      d.open = true; S.sfx('open');
      await S.narr('门缝里黑漆漆的。\n榻榻米上，有一串小小的湿脚印，一直走到门边——\n走到你的脚边。');
      d.eyes = true; S.sfx('sting'); await S.wait(500);
      d.open = false; d.eyes = false; S.sfx('close');
      await S.narr('纸门「啪」地自己合上了。');
      return gazeUp(S, '拉开了浜之间的门');
    }
    if (f.ph === 'n2' && f.n2s === 'up') return placeZen(S);
    if (f.ph === 'n2') { chew(S, .05); return S.narr('纸门关着。门缝底下，什么东西在吧唧吧唧地吃。'); }
    await S.narr('贴满了御札的纸门。');
  }
  async function placeZen(S) {
    const f = S.f;
    if (!S.has('zen')) return S.narr('……膳呢？');
    S.take('zen'); const z = S.ent('zspot'); z.full = true; S.show('zspot');
    S.sfx('select');
    await S.narr('你蹲下来，把漆盘放在门口。筷子在碗里晃了晃，又站直了。');
    knock3(S, .16); await S.wait(1300);
    await S.say('你', '……翔，吃饭了。', { style: 'whisper' });
    await S.wait(500); crawlPat(S, .15); S.shake(500, 1);
    await S.narr('门里面，有什么东西从屋子那头，咚、咚地爬了过来。\n停在门的另一边。隔着一层纸。');
    await S.say('门里', '……妈妈？', { style: 'whisper' });
    await S.wait(900);
    await S.say('门里', ['……不是妈妈。', '……你是谁？'], { style: 'whisper' });
    const r = await S.ask('门里的声音，是个小孩子。', ['（不出声）', '「我是……新来打工的。」']);
    if (r === 1) {
      await S.narr('门里安静了一下。然后，很高兴地说：');
      await S.say('门里', '……拓海哥哥。', { style: 'whisper' });
      await gazeUp(S, '应了门里的声音');
    }
    await S.wait(400);
    S.sfx('thud'); const k = S.ent('kagami'); k.covered = false; k.s.cloth = true; S.shake(300, 1); S.focus(25, 6);
    await S.narr('走廊尽头，「哗啦」一声。\n镜子上的白布，滑到了地上。');
    S.focus(null);
    f.n2s = 'mirror';
    S.goal('闭着眼，把镜子上的布盖回去！');
    S.timer(7, '镜子', async S => { lastDeath = 'mirror'; await caught(S, '你还是看见了。\n镜子里，你身后的走廊上，浜之间的纸门开着一条缝。\n一个小小的、湿漉漉的东西，蹲在漆盘前面，慢慢地转过头来——', '它从镜子里看见你了'); }, { during: true });
  }
  async function kagamiUse(S) {
    const f = S.f, k = S.ent('kagami');
    if (f.ph === 'n2' && f.n2s === 'mirror') {
      const r = await S.ask('布在脚边。镜子就在你眼前。', ['闭上眼，摸索着把布盖回去', '……先看一眼镜子']);
      if (r === 1) {
        k.face = true; S.sfx('sting');
        await S.narr('镜子里是你自己，和你身后长长的走廊。\n走廊的地板上，有一个小孩。\n他趴在地上。一点一点，朝你的背后爬过来。');
        S.clearTimer();
        await S.scare('face', { spr: '@shoF', dur: 1 });
        k.face = false;
        await gazeUp(S, '看了二楼的镜子');
      }
      S.clearTimer();
      k.covered = true; k.s.cloth = false; S.sfx('paper');
      await S.narr('你闭着眼，摸到粗糙的布，把它往镜框上一搭。\n盖上了。');
      f.n2s = 'back';
      S.goal('下楼。不要回头。');
      return;
    }
    if (f.ph === 'd2') {
      await S.narr('走廊尽头的大镜子，蒙着一块白布。布的下摆，有几个小小的湿手印。');
      const r = await S.ask('规矩四：镜子上的布，不要掀开。', ['别碰', '掀开一角看看']);
      if (r === 0) return;
      k.covered = false; k.face = true; S.sfx('sting');
      await S.narr('镜子里是你，和你身后的走廊。\n你身后，浜之间门口，蹲着一个小小的影子。');
      await S.wait(500); S.sfx('heart');
      await S.narr('你猛地回头。\n……走廊上什么都没有。漆盘里的空碗，筷子还竖着。');
      k.covered = true; k.face = false;
      return gazeUp(S, '掀开了镜子上的布');
    }
    if (f.ph === 'n2') return S.narr('镜子蒙得好好的。你不想再碰它。');
    await S.narr('蒙着白布的镜子。');
  }
  /* 回头——健太 */
  async function kentaBehind(S, forced) {
    const f = S.f; if (f.n2s !== 'back') return;
    f.n2s = 'kenta';
    S.sfx('open'); await S.wait(300);
    await S.narr('身后，纸门「嘶——」地拉开了。');
    await S.say('健太（身后）', ['……拓海。', '拓海，你回头看看……里面有个小孩……', '……他在吃饭。他让我陪他一起吃。'], { style: 'whisper' });
    let r = 1;
    if (!forced) r = await S.ask('是健太的声音。他什么时候跟上来的？', ['（不回头）「健太！快下来！」', '回头']);
    if (r === 1) {
      S.turn(2); S.place('kenta2', 23, 7, 3); S.ent('fdoor').open = true; S.ent('fdoor').eyes = true; S.focus(22, 7);
      await S.narr('你回过头。\n走廊尽头，健太站在浜之间的门口，背对着你。\n他的肩膀上，搭着一只很小的、灰白色的手。');
      await S.wait(600);
      await gazeUp(S, '在二楼回了头');
      S.focus(null);
    } else {
      await S.say('你', '健太！下来！', { style: 'whisper' });
      chew(S, .06); chew(S, .04, .3);
      await S.narr('身后没有回答。\n只有吧唧、吧唧的声音。两个人的。');
    }
    S.sfx('close'); S.hide('kenta2'); S.ent('fdoor').open = false; S.ent('fdoor').eyes = false;
    await S.narr('纸门「啪」地合上了。\n走廊里，只剩你一个人。');
    S.turn(1); f.n2s = 'done';
    S.goal('下楼，告诉修一');
  }
  async function stairsDown(S) {
    const f = S.f;
    if (f.ph === 'n2' && (f.n2s === 'up' || f.n2s === 'mirror')) return S.narr(f.n2s === 'up' ? '老板娘交代的事，还没办完。' : '镜子上的布还没盖！');
    if (f.ph === 'n2' && f.n2s === 'back') return kentaBehind(S, false);
    if (f.ph === 'n2' && f.n2s === 'done') return night2End(S);
    await S.go('kan1', 10, 3, 0);
  }
  async function night2End(S) {
    const f = S.f;
    await S.go('kan1', 10, 3, 0);
    S.place('shu1', 10, 5, 3);
    await S.say('修一', ['……健太呢？！', '你上楼以后，他就偷偷跟上去了。我拉都没拉住。'], { style: 'whisper' });
    await S.narr('你张了张嘴。一个字都说不出来。');
    await S.fade(1, 900);
    S.pos(24, 5, 0); S.hidePlayer(true); S.ent('sfM').s.occ = true; S.ent('sfS').s.occ = true; S.hide('shu1');
    setHour(S, 3, true);
    await S.card('半夜三点', '', '纸门轻轻地拉开了。\n有人爬进了员工房。爬进了健太的被窝。\n\n「……健太？」修一小声问。\n\n「嗯。」黑暗里，健太说。\n「我吃饱了。」');
    return day3Start(S);
  }

  /* ================= 第三天 ================= */
  async function day3Start(S) {
    const f = S.f;
    S.hidePlayer(false); S.ent('sfM').s.occ = false; S.ent('sfS').s.occ = false; S.ent('sfK').s.occ = false;
    f.ph = 'd3'; f.day = 3; S.ent('rulesP').s.d3 = true;
    S.dark(null, 'kan1'); S.plr(null); S.amb('room'); setHour(S, 7, true);
    S.hide('okamiS'); S.hide('sfuton'); S.hide('kaneL'); S.hide('okamiL');
    const k = S.ent('kenta1'); k.spr = 'crawler'; k.col = '#9a3a30'; S.place('kenta1', 5, 14, 3);
    S.show('okamiD'); S.face('okamiD', 2); S.show('zenD');
    S.place('shu1', 24, 6, 3); S.place('kaneK', 7, 4, 1);
    S.pos(24, 5, 0);
    await S.card('第三天', '八月十一日　早上', '健太的被褥是空的。\n枕头上，有几粒干掉的饭粒。');
    await S.fade(0, 900);
    await S.say('修一', ['……健太不见了。我醒的时候他就不在了。', '你去宴会厅那边看看，我去浴场。']);
    S.hide('shu1');
    S.goal('找健太（宴会厅那边）');
    S.cp('d3');
  }
  async function kentaD3(S) {
    const f = S.f;
    if (f.ph !== 'd3') return;
    if (!f.sawK) {
      f.sawK = true;
      chew(S, .05);
      await S.narr('健太趴在宴会厅的角落里，面前摆着那个漆盘。\n他用手抓着饭往嘴里塞。一把，又一把。');
      hum(S, .04);
      await S.narr('老板娘跪坐在他身边，一下一下地摸着他的头。嘴里哼着歌。');
      await S.say('你', '……健太？');
      S.face('kenta1', 'pl'); await S.wait(500);
      await S.scare('face', { spr: '@kentaPF', dur: 1 });
      await S.say('健太', '……拓海哥哥。', { style: 'whisper' });
      await S.narr('他从来不叫你「哥哥」。你们同岁。');
      await S.say('老板娘', ['健太君说，今天想一直待在家里。', '……对吧？']);
      await S.walk('okamiD', [14, 11], 2.6); S.hide('okamiD'); S.show('okamiL');
      S.place('shu1', 4, 12, 0); S.face('shu1', 'pl');
      await S.say('修一', '……你看门外那张规矩。最后一行。', { style: 'whisper' });
      await showRules(S);
      await S.say('修一', ['……得带他走。今天就走。', '阿兼婆婆好像知道什么。去厨房问问她。']);
      S.goal('去厨房问阿兼婆婆');
      return;
    }
    if (f.lure && !f.follow) {
      S.take('onigiri'); f.follow = true;
      await S.narr('你把饭团在他眼前晃了晃。\n健太的眼睛跟着饭团转。他慢慢地站起来，跟着你。');
      S.ent('kenta1').spr = '@kentaP'; S.follow('kenta1', true);
      S.goal('带健太从厨房的后门出去，去山上的寺');
      return;
    }
    if (f.follow) return S.narr('健太跟在你身后。眼睛一直盯着你手里——你手里已经没有饭团了。');
    await S.narr('健太头也不抬，抓着碗底的饭粒往嘴里送。\n你拽他的胳膊。他的手冰凉，力气大得吓人。');
    if (f.askedK) await S.think('（他现在只认吃的……老板那儿，能不能要点吃的？）');
  }
  async function kaneD3(S) {
    const f = S.f; S.face('kaneK', 'pl');
    if (!f.sawK) return S.say('阿兼婆婆', '……健太？去宴会厅看看。');
    if (f.askedK) return S.say('阿兼婆婆', f.follow ? '走后门。快。' : '他现在只认吃的。……去找老板。');
    f.askedK = true;
    await S.narr('阿兼婆婆把手里的碗放下，往帐场那边看了一眼，压低了声音。');
    await S.say('阿兼婆婆', [
      '十二年前的夏天，盂兰盆那几天。老板娘的小儿子，翔，一个人跑到海里去游泳。……再也没上来。',
      '老板娘不肯办丧事。不立牌位，不烧纸。每天晚上端饭上楼。',
      '后来不知道从哪儿学来一个法子。……每年夏天，都招男孩子来打工。',
      '去年那个孩子，盂兰盆前一天也是这个样子。……后来就不见了。'
    ], { style: 'whisper' });
    await S.say('阿兼婆婆', ['山上有座寺。住持知道这件事。', '从厨房后门走，别让老板娘看见。快。']);
    await S.say('修一', '我先跑去寺里，跟住持说一声。你把健太带出来——别走前门。');
    S.hide('shu1');
    S.goal('把健太带出来（他只认吃的——问问老板）');
  }
  async function taishoD3(S) {
    const f = S.f;
    if (!f.askedK) return S.say('老板', '……');
    if (f.lure) return S.say('老板', '……快走。');
    f.lure = true; S.give('onigiri');
    await S.narr('老板没说话，从饭锅里抓了一把饭，攥成一个饭团，塞进你手里。\n又往你兜里塞了一小包盐。');
    await S.say('老板', ['……他现在只认吃的。', '……对不起。'], { style: 'whisper' });
    S.goal('用饭团把健太引出来');
  }
  async function frontExit(S) {
    const f = S.f;
    if (f.ph === 'd1' || f.ph === 'd2') return S.go('umibe', 7, 3, 0);
    if (f.ph === 'd3') {
      if (!f.follow) return S.narr('老板娘坐在帐场里，看着门口。\n……健太还在里面。不能一个人走。');
      S.face('okamiL', 'pl');
      await S.say('老板娘', ['健太君？', '要去哪儿呀？'], { style: 'whisper' });
      S.follow('kenta1', false); f.follow = false; f.lure = false;
      await S.narr('健太站住了。他看了老板娘一眼，扭头就往宴会厅那边走。');
      S.place('kenta1', 5, 14, 3); S.ent('kenta1').spr = 'crawler';
      await S.think('（……前门不行。得走厨房的后门。饭团……再跟老板要一个吧。）');
      S.goal('再跟老板要个饭团，从厨房后门把健太带出去');
      return;
    }
    await S.narr('天黑了。门外只听得见浪声。\n老板娘说过，夜里别出去。');
  }
  async function backDoor(S) {
    const f = S.f;
    if (f.ph === 'd3') {
      if (!f.follow) return S.narr('厨房的后门。外面是通往海边的小巷。\n……得先把健太带上。');
      S.follow('kenta1', false); S.hide('kenta1');
      S.show('kentaU'); S.follow('kentaU', true);
      S.sfx('open'); f.ph = 'esc';
      return S.go('umibe', 12, 3, 0);
    }
    if (['d1', 'd2'].includes(f.ph)) { S.sfx('open'); return S.go('umibe', 12, 3, 0); }
    await S.narr('后门上了闩。门外黑漆漆的，只听得见浪声。');
  }

  /* ================= 死亡（通用） ================= */
  async function caught(S, msg, title) {
    const f = S.f; S.clearTimer(); f.crawl = false; S.hidePlayer(false);
    await S.scare('face', { spr: '@shoF', dur: 1.1 });
    await S.die(msg, title);
  }

  /* ================= 逃去寺里 ================= */
  async function toTemple(S) {
    const f = S.f;
    if (f.ph === 'esc') { S.follow('kentaU', false); S.hide('kentaU'); S.show('kentaT'); S.follow('kentaT', true); return S.go('tera', 9, 42, 3); }
    await S.narr('沿着海边的路往东，有一条石阶通到山上的寺里。\n……现在是打工时间。');
    S.pos(27, S.pl.y, 1);
  }
  async function teraExit(S) {
    const f = S.f;
    if (f.ph === 'esc') { S.follow('kentaT', false); S.hide('kentaT'); S.show('kentaU'); S.follow('kentaU', true); return S.go('umibe', 28, 3, 1); }
    await S.narr('住持说，今晚就得做。');
    S.pos(S.pl.x, 41, 3);
  }
  async function meetJ(S) {
    const f = S.f; f.ph = 'tera';
    S.follow('kentaT', false); S.place('kentaT', S.pl.x, 13, 3);
    S.face('jushoY', 'pl'); S.face('shuY', 'pl');
    await S.narr('杉树围着一座老寺。蝉声一下子远了。\n本堂前面站着一个穿黑衣的老和尚。修一在他身边，满头是汗。');
    await S.say('住持', '……来了。');
    await S.narr('住持扳开健太的眼皮看了看，又抓起他的手闻了闻。\n健太嘻嘻地笑。');
    await S.say('住持', [
      '附在他身上的，是个孩子。饿着肚子的孩子。',
      '汐见屋的事，我知道。十二年前，我去给那孩子念经——老板娘把我赶出了门。',
      '她不知从哪儿学来一个邪门的法子：把孩子的魂关在屋里，天天端饭供着。等到盂兰盆，找一个年纪合适的身子……'
    ]);
    await S.say('修一', '……让他附上去？', { style: 'whisper' });
    await S.say('住持', ['盂兰盆以前送不走，就再也送不走了。今晚就做。', '得先给那孩子立一块塔婆。写上他的俗名和命日——名字叫得出、日子对得上，他才肯跟我走。']);
    S.goal('在塔婆上写下那孩子的俗名和命日（跟住持说话）');
    S.cp('tera');
  }
  function dateHint(v, n) {
    const sp = v === '0812' ? '这是照片上的日子。照片背面还写着——那天，他说「明天」还要去海里游泳。'
      : ['0809', '0810', '0811'].includes(v) ? '那是这几天的日子。那孩子是十二年前走的。'
        : ['0814', '0815', '0816'].includes(v) ? '盂兰盆当中？……那几天，汐见屋已经关了门。' : null;
    const tier = n <= 1 ? '……不对。日子写错了，他不认。'
      : n === 2 ? '照片背面写着什么？他「明天」要去做的事——那个「明天」，是哪一天？'
        : n === 3 ? '去年那本打工日记里写着：盂兰盆头一天，是八月几号？照片，是盂兰盆的「前一天」拍的。'
          : '……照片是盂兰盆前一天拍的，他第二天下了海。盂兰盆头一天，八月十三号。写「0813」。';
    return [sp, tier].filter(Boolean);
  }
  async function jushoTalk(S) {
    const f = S.f; S.face('jushoY', 'pl');
    if (f.ph !== 'tera') return S.say('住持', '南无阿弥陀佛……');
    if (!f.nameOK) {
      const r = await S.ask('「那孩子，叫什么？」', ['翔', '健太', '浜', '……想不起来'], '住持');
      if (r !== 0) {
        f.wrongN = (f.wrongN || 0) + 1;
        if (f.wrongN >= 2) return S.say('住持', ['……老板娘让你端饭上楼的时候，叫的是：「翔，吃饭了。」', '那孩子叫翔。']);
        return S.say('住持', r === 1 ? '那是你朋友的名字。他还活着呢。' : r === 2 ? '「浜之间」，是那间屋子的名字。' : ['……老板娘让你端饭上楼的时候，叫的是哪个名字？', '「□，吃饭了。」——是什么？']);
      }
      f.nameOK = true; await S.say('住持', '翔……是了。俗名，翔。');
    }
    await S.narr('住持把一块新削的木牌和蘸好墨的毛笔递给你。');
    if (S.coop && S.once('kpTip')) S.toast('联机：一人翻「笺」里的照片和日记念给对方听，一人写');
    const v = await S.keypad('塔婆　俗名「翔」\n命日：平成八年 □□月□□日 —— 写四位数（月月日日）\n联机时：一人翻「笺」里的照片和日记，一人写', ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'], 4);
    if (v == null) return S.say('住持', '想好了再写。写错的塔婆，他不认。');
    if (v !== '0813') {
      f.wrongD = (f.wrongD || 0) + 1; S.sfx('bad');
      if (f.wrongD === 2) { drip(S); await S.narr('木牌上的墨，自己晕开了。像被水泡过。'); }
      else if (f.wrongD === 1) { crawlPat(S, .07); S.shake(300, 1); await S.narr('……身后的杉树林里，有个小孩子在笑。咯咯，咯咯。'); }
      else { S.bubble('kentaT', '…', 1500); await S.say('健太', '……错啦。', { style: 'whisper' }); S.shake(300, 1); }
      return S.say('住持', dateHint(v, f.wrongD));
    }
    S.sfx('chime'); S.give('touba');
    await S.narr('你一笔一笔写上去：\n俗名　翔\n平成八年八月十三日　殁');
    await S.say('住持', '……对上了。');
    return vigilSetup(S);
  }

  /* ================= 守夜 ================= */
  const CANDLES = ['c0', 'c1', 'c2', 'c3'], CRAWL_SPD = .72, CRAWL_WAIT = 2, C_T = 13;
  async function vigilSetup(S) {
    const f = S.f;
    await S.fade(1, 800);
    ['jushoY', 'shuY', 'kentaT'].forEach(i => S.hide(i));
    ['jushoV', 'shuV', 'kentaV', 'toubaV'].forEach(i => S.show(i));
    CANDLES.forEach(c => { S.ent(c).off = false; });
    ['doorL', 'doorR'].forEach(i => { const d = S.ent(i); d.open = false; d.solid = true; });
    S.pos(15, 7, 1); S.dark(.8, 'tera'); S.plr(2.4); S.amb('night'); S.give('match', true);
    await S.card('守夜', '八月十一日　晚上十点', '本堂的门从外面插上了。\n四盏灯明，围着健太的被褥。\n住持坐在佛前，木鱼一声一声地响。\n\n鸡叫以前，谁也不许出去。');
    await S.fade(0, 800);
    chant(S, 5, .1);
    await S.say('住持', ['规矩写在柱子上那张纸上。', '灯明灭了，就点上。有人叫，别应。健太要是往外爬——按住他。']);
    await S.note('okite');
    f.ph = 'vigil';
    S.goal('守夜：守着四盏灯明和健太，谁叫都别应');
    S.cp('vigil');
    return vStageA(S);
  }
  async function vStageA(S) {
    const f = S.f; f.vs = 'A'; f.crawl = false;
    await S.wait(900); chant(S, 4, .08); await S.wait(1600);
    await S.narr('……十一点。\n一阵风从门缝底下钻进来，冷得像海水。');
    S.ent('c1').off = true; S.sfx('switch');
    await S.narr('东北角的灯明，「噗」地灭了。');
    S.goal('东北角的灯明灭了——快去点上！');
    S.timer(8, '灯明', candleFail, { during: true });
  }
  async function candleFail(S) { lastDeath = 'candle'; await caught(S, '你没来得及。\n灯明一灭，结界就开了一道口子。\n黑暗里，有什么湿漉漉的东西，贴着地板爬了进来。', '灯明灭了'); }
  async function kentaFail(S) { lastDeath = 'kenta'; await caught(S, '健太爬过了门槛。\n门外的黑暗里，伸出一只很小的手，拉住了他的手。\n……然后，也拉住了你的脚。', '健太爬出去了'); }
  async function tomyoUse(S, id) {
    const f = S.f, e = S.ent(id);
    if (f.ph !== 'vigil') return S.narr('灯明台。');
    if (!e.off) return S.narr('灯明的火苗笔直地立着。');
    e.off = false; S.sfx('match'); S.toast('点上了');
    return vCheck(S);
  }
  function allLit(S) { return CANDLES.every(c => !S.ent(c).off); }
  async function vCheck(S) {
    const f = S.f;
    if (f.vs === 'A' && allLit(S)) { S.clearTimer(); return vStageB(S); }
    if (f.vs === 'C' && f.held && allLit(S)) { S.clearTimer(); return vStageD(S); }
    if (f.vs === 'C') S.goal(f.held ? '还有灯明没点上！' : '按住健太！');
  }
  async function vStageB(S) {
    const f = S.f; f.vs = 'B'; S.goal('守夜：守着四盏灯明和健太，谁叫都别应'); S.cp('vB');
    await S.fade(1, 500); await S.wait(500); await S.fade(0, 500);
    await S.narr('……一点。木鱼声停了。');
    knock3(S, .12); await S.wait(1200);
    await S.say('门外', ['健太君——', '回家吃饭了。妈妈今天，做了你最爱吃的。'], { style: 'whisper' });
    await S.narr('是老板娘的声音。');
    let r = await S.ask('门外安静了一下。', ['（不出声）', '「……老板娘？」']);
    if (r === 1) { lastDeath = 'voice'; return caught(S, '「老板娘？」\n门外的声音笑了。\n「……不是哦。」', '你应了声'); }
    await S.say('门外', '……拓海君？你也在里面吧？开开门呀。', { style: 'whisper' });
    r = await S.ask('门外的人，在等你开门。', ['（不出声）', '去拉门闩']);
    if (r === 1) { lastDeath = 'voice'; return caught(S, '你的手刚碰到门闩，门就从外面被拉开了。\n门外没有老板娘。\n只有一滩水，和水里一串小小的脚印。', '你开了门'); }
    if ((f.gaze || 0) >= 1) {
      const k = S.ent('kentaV'); k.s.eyes = true; S.sfx('heart');
      await S.narr('被褥上，健太睁开了眼睛。\n他歪着头，看着你。');
      await S.say('健太', '……拓海哥哥。你答应过，要陪我玩的。', { style: 'whisper' });
      r = await S.ask('它记得你。你犯过的规矩，它都记得。', ['（不出声）', '「我没答应过！」']);
      if (r === 1) { lastDeath = 'voice'; return caught(S, '「我没答应过！」\n健太笑了。\n「你答应了。」他说，「你刚才就答应了。」', '你应了声'); }
      k.s.eyes = false;
    }
    await S.narr('门外的脚步声，绕着本堂走了一圈。又一圈。\n然后没有了。');
    S.goal('守夜：守着四盏灯明和健太');
    S.cp('vC');
    return vStageC(S);
  }
  async function vStageC(S) {
    const f = S.f; f.vs = 'C'; f.held = false; f.crawl = false;
    await S.fade(1, 500); S.pos(15, 7, 1); await S.wait(400); await S.fade(0, 500);
    await S.narr('……两点半。你靠着柱子，眼皮越来越沉——');
    S.ent('kentaV').s.empty = true; S.place('kentaC', 9, 7, 0); S.ent('kentaC').alpha = 1;
    S.ent('c0').off = true; S.ent('c3').off = true; S.sfx('switch'); S.shake(400, 2);
    await S.narr('「哗啦」一声，被褥空了。\n健太四肢着地，朝门口爬过去。\n西北角和东南角的灯明，一起灭了！');
    await S.say('修一', '我——我动不了！身上像压着什么东西！');
    S.goal('先按住健太！再把两盏灯明点上！（联机：一人盯着健太和灯明报位置，一人跑）');
    f.crawl = true; f.crawlWait = CRAWL_WAIT;
    S.timer(C_T, '灯明', candleFail, { during: true });
  }
  function crawlTick(S, dt) {
    const f = S.f; if (!f.crawl || S.busy) return;
    const e = S.ent('kentaC'); if (!e || e.hidden) return;
    if (f.crawlWait > 0) { f.crawlWait -= dt; return; }
    if (e.mv) return;
    const ey = Math.round(e.py / TS);
    if (ey >= 9) { f.crawl = false; S.clearTimer(); S.run(kentaFail); return; }
    startMove(e, 0, CRAWL_SPD); e.dir = 0;
  }
  async function kentaCUse(S) {
    const f = S.f; if (f.vs !== 'C' || f.held) return;
    f.crawl = false; const e = S.ent('kentaC'); e.mv = null; e.px = Math.round(e.px / TS) * TS; e.py = Math.round(e.py / TS) * TS;
    await S.narr('你扑过去，从后面抱住健太的腰，把他往回拖。\n他嘴里发出小孩子一样的哭声。');
    S.hide('kentaC'); S.ent('kentaV').s.empty = false; f.held = true;
    await S.say('修一', '……我能动了！我来按着他！你去点灯！');
    return vCheck(S);
  }
  async function vStageD(S) {
    const f = S.f; f.vs = 'D';
    await S.fade(1, 600); await S.wait(400); await S.fade(0, 600);
    await S.narr('……四点。');
    S.dark(.9, 'tera');
    drip(S, .08); drip(S, .07, .7); drip(S, .08, 1.5);
    await S.narr('滴答。滴答。\n门缝底下，渗进来一滩水。');
    S.place('shoV', 10, 9, 3); S.ent('shoV').alpha = 0; await S.alpha('shoV', 1, 1200);
    crawlPat(S, .1);
    await S.narr('一个小小的、湿漉漉的东西，从门缝底下挤了进来。\n它趴在地上，一点一点，朝健太爬过去。');
    await S.say('住持', '——来了。塔婆！', { style: 'big' });
    const opts = ['举起塔婆，叫它的名字']; if (S.has('sandal')) opts.push('先把那只红色的小凉鞋，放在它面前');
    const r = await S.ask('它停在结界外面，抬起了头。', opts);
    if (r === 1) {
      f.kuyou = true; S.take('sandal');
      await S.narr('你把那只红色的小凉鞋，轻轻放在地板上。\n那个东西停住了。\n它伸出一只灰白的小手，碰了碰鞋。然后，把鞋抱进了怀里。');
      hum(S, .035);
    }
    await S.narr('你把塔婆高高举起来。');
    await S.say('你', '……翔！', { style: 'big' });
    rin(S); chant(S, 8, .12);
    await S.scare('face', { spr: '@shoF', dur: 1.1 });
    await S.say('住持', ['俗名，翔。平成八年八月十三日，殁于此海。', '……你已经死了。回家去吧。']);
    await S.narr(f.kuyou ? '它抱着那只鞋，慢慢地往后退。\n退到门缝那儿，不见了。' : '那个东西尖叫了一声——像小孩子摔倒时的哭声——\n缩回了门缝底下。');
    S.hide('shoV'); S.dark(.6, 'tera');
    await S.wait(900); rooster(S); await S.wait(1200);
    await S.narr('……远处，鸡叫了。');
    await S.say('健太', ['……这是哪儿？', '我好饿……我梦见我在海里，有人一直拽着我的脚……']);
    await S.say('修一', '……健太。', { style: 'whisper' });
    await S.say('住持', ['送走了一大半。可它还会跟着，送你们到山门。', '下山的时候，它会在后面叫。叫什么都别回头。', '你走前面，让健太拽着你的衣角。修一先下去，在山门外等着。出了山门，就到此为止。']);
    const g = f.gaze || 0;
    await S.say('住持', g === 0 ? '……你身上很干净。它没记住你的脸。' : g >= 2 ? '……你犯过规矩，它记得你的脸。下山的路上，它会叫得更凶。' : '……它记得你应过它一次。别再应了。');
    return descentSetup(S);
  }

  /* ================= 下山：不能回头 ================= */
  async function descentSetup(S) {
    const f = S.f;
    await S.fade(1, 700);
    S.hide('shuV'); S.hide('toubaV'); S.ent('kentaV').s.empty = true;
    ['doorL', 'doorR'].forEach(i => { const d = S.ent(i); d.open = true; d.solid = false; });
    S.pos(10, 11, 0); S.place('kentaT', 10, 10, 0); S.follow('kentaT', true); S.ent('kentaT').alpha = 0;
    S.place('okamiG', 11, 41, 1);
    S.dark(.35, 'tera'); S.plr(null); S.amb('wind');
    f.ph = 'down'; f.look = 0; f.lookCD = 0; f.downArm = false;
    await S.fade(0, 700);
    await S.narr('天边发白了。石阶一路往下，没进了雾里。\n你看不见身后。只觉得衣角被一只手攥着，攥得很紧。');
    await S.narr('……石阶最下面，山门底下，雾里站着一个人影。');
    S.goal('下山。不管身后谁叫，都不要回头（别往回走）' + (S.coop ? '——联机：另一个人帮忙盯着，别让操作的人按↑' : ''));
    S.cp('down');
  }
  async function armDown(S) {
    const f = S.f; f.downArm = true; S.turn(0);
    await S.narr('……从这一级台阶开始，不要回头。');
  }
  async function lookBack(S) {
    const f = S.f; f.look = (f.look || 0) + 1;
    if (f.look === 1) {
      S.turn(0); S.sfx('heart');
      await S.narr('你的脖子刚要转过去——\n衣角被狠狠拽了一下。');
      await S.say('健太（身后）', '……别回头。', { style: 'whisper' });
      await S.think('（……是健太的声音吗？）');
      S.turn(0); f.lookCD = 1.2;
      S.goal('别回头！一直往下走');
      return;
    }
    return badLeft(S);
  }
  const voiceAt = {
    16: async S => { await S.say('身后（很远）', ['健太君——', '你的包，忘拿了——'], { style: 'whisper' }); await S.narr('是老板娘的声音。从石阶上面传下来。'); },
    22: async S => { await S.say('身后（很远）', ['拓海——！等等我！', '你拽着的那个不是我！我在这儿！'], { style: 'whisper' }); await S.narr('是健太的声音。从本堂那边。\n……可是你的衣角，还被一只手攥着。'); await S.think('（别回头。）'); },
    28: async S => { drip(S, .07); drip(S, .06, .5); await S.narr('啪嗒、啪嗒。\n身后的脚步声，是光着脚踩在湿石头上的声音。\n攥着你衣角的那只手，越来越凉。'); await S.say('身后（很近）', '……哥哥。', { style: 'whisper' }); },
    31: async S => { S.shake(300, 1); await S.say('身后（贴着耳朵）', ['拓海哥哥。', '你答应过要陪我玩的。你应过我的。'], { style: 'whisper' }); await S.narr('衣角被往后拽了一下。很用力。'); },
    34: async S => { await S.say('修一（山门那边）', '拓海！这边！快到了！'); }
  };
  async function gateScene(S) {
    const f = S.f; f.ph = 'gate';
    S.face('okamiG', 'pl'); S.show('shuD');
    await S.narr('山门底下，站着老板娘。\n她没有往前走一步。怀里抱着健太的运动包。');
    await S.say('老板娘', ['……你们要走了啊。', '……翔他，吃饱了吗？']);
    if (f.kuyou) {
      await S.narr('老板娘的另一只手里，攥着一只红色的小凉鞋。泡得发白。\n和你放在本堂地板上的那一只，是一双。');
      await S.say('老板娘', ['这一只，是那年从海里漂回来的。另一只，我找了十二年。', '……他穿上了吗？']);
      await S.say('你', '……穿上了。');
      await S.narr('老板娘捂住了嘴。');
    }
    if (!(f.gaze || 0)) { await S.say('老板娘', '……拓海君，你一条规矩都没犯呢。', { style: 'whisper' }); await S.narr('她说这句话的时候，像是有点可惜。'); }
    const r = await S.ask('健太在你身后，攥着你的衣角。', ['（不说话，拉着健太走出山门）', '「……我留下来。放健太走。」']);
    if (r === 1) return badStay(S);
    return ending(S);
  }
  async function ending(S) {
    const f = S.f;
    S.sfx('step');
    await S.narr('你从老板娘身边走过去。她没有拦。\n迈出山门的那一刻，攥着衣角的手，松开了。');
    if (f.kuyou) {
      S.place('shoK', 10, 39, 3); S.focus(10, 35);
      await S.narr('……身后，一个小孩子的声音，很轻很轻地说了一句什么。\n像是「谢谢」。');
      S.ent('shoK').alpha = .8; await S.walk('shoK', [10, 35], 1.6); await S.alpha('shoK', 0, 1400); S.focus(null);
    } else await S.narr('……身后，什么声音都没有了。');
    S.ent('kentaT').alpha = 1;
    await S.narr('出了山门，你才敢回头。\n健太站在你身后，脸色发白，愣愣地看着你。');
    await S.say('修一', '……健太！');
    await S.say('健太', '……修一？我们这是在哪儿？我饿死了。');
    await S.fade(1, 1200);
    await S.card('之后', '', '回城的电车上，健太睡得像死猪一样。\n他什么都不记得了。只说那三天一直很饿，梦里总有人拽他的脚。\n\n工资，我们一分钱都没拿。');
    if (f.kuyou) return S.end({ id: 'kuyou', title: '第九夜　完（送他回家）', text: '半年后，修一说汐见屋关门了。\n二楼最里面那间屋子的窗户，一直开着，能看见整片海。\n\n听说那年盂兰盆送火的晚上，有人看见一个戴草帽的小男孩，穿着一双红色的凉鞋，沿着海边一直往东走，走进了寺的山门。\n\n他没有回头。' });
    return S.end({ id: 'all3', title: '第九夜　完', text: '盂兰盆那天，修一给我发了一条短信：\n「汐见屋的招聘又挂出来了。」\n\n我没有回。\n\n那天晚上，我梦见一条很长的走廊。\n走廊尽头，镜子上的白布，慢慢地滑了下来。' });
  }
  async function badLeft(S) {
    S.amb('none'); S.sfx('heart');
    await S.narr('你回过头。');
    const k = S.ent('kentaT'); k.spr = '@shoW'; k.alpha = 1; S.follow('kentaT', false); S.face('kentaT', 'pl');
    await S.scare('face', { spr: '@shoF', dur: 1.2 });
    S.fx('red');
    await S.narr('攥着你衣角的，不是健太。\n是一个浑身湿透的小男孩，光着一只脚。\n他抬起头，冲你笑了一下，松开了手。');
    S.hide('kentaT');
    const fy = Math.max(13, S.pl.y - 6); S.place('kentaFar', 10, fy, 3); S.focus(10, fy - 2);
    await S.walk('kentaFar', [10, Math.max(12, fy - 4)], 1.4);
    await S.narr('石阶上面，很远的地方，健太正一步一步往回走。\n往本堂。往海那边。\n他没有回头。');
    S.focus(null);
    return S.end({ bad: true, id: 'left', title: '留下一个', text: '我和修一走出了山门。\n\n健太的家里人来过好几次。旅馆说，他打完了暑假的工，自己走的。\n\n第二年夏天，网上又挂出了那家旅馆的招聘：\n「海边老旅馆，包吃包住，限男性大学生。有前辈带新人。」\n\n照片上，站在老板娘身边笑着的前辈，是健太。\n他手里端着一个漆盘。' });
  }
  async function badStay(S) {
    await S.narr('「我留下来。放健太走。」\n老板娘愣了一下。然后，笑了。笑得很温柔。');
    await S.narr('身后，攥着衣角的手松开了。\n那只手，轻轻地，牵住了你的手。');
    S.fx('red');
    return S.end({ bad: true, id: 'stay', title: '替身', text: '修一扶着健太，走出了山门。\n\n我回到了汐见屋。\n二楼最里面的屋子，窗户开着，能看见整片海。\n每天晚上九点，老板娘端着饭上楼来。饭盛得冒尖，筷子直直地插在正中间。\n\n她叫我「翔」。\n我已经开始答应了。' });
  }

  /* ================= 地图 ================= */
  const R28 = (s) => s;
  function kan1Rows() {
    const room = '#+++++++#lll#gggggg#ttttttt#', low = '#ttttttttt#wwwwwwww#WWWWWWW#';
    return [
      '#'.repeat(28), '#'.repeat(28), room, room, room, room, room,
      '####l#####l#####l######l####',
      '#' + 'l'.repeat(26) + '#', '#' + 'l'.repeat(26) + '#',
      '#####l########ll#######l####',
      low, low, low, low, '#ttttttttt#xxxxxxxx#WWWWWWW#',
      '##############xx############', '#'.repeat(28)
    ];
  }
  function kan2Rows() {
    const room = '#tttttt#tttttt#llll#XXXXXXX#';
    return ['#'.repeat(28), '#'.repeat(28), room, room, room, room, '###l######l#####l###########', '#' + 'w'.repeat(26) + '#', '#' + 'w'.repeat(26) + '#', '#'.repeat(28), '#'.repeat(28)];
  }
  function umibeRows() {
    const r = [];
    r.push('FFFFFFFFFFFFFF' + 'PPPPPPPPPPPPPPPP');
    r.push('FFFFFFFFFFFFFF' + 'PPPPPPTPPPPPPPPP');
    r.push('FFFFFFFFFFFFFF' + '""B"""""""T"""""');
    r.push(':'.repeat(30));
    r.push('_'.repeat(30));
    r.push('LLLLLLLLLLkkLLLLLLLLLLLLLLLLLL');
    r.push('s'.repeat(30));
    r.push('s'.repeat(25) + 'KKKKK'); r.push('s'.repeat(25) + 'KKKKK'); r.push('s'.repeat(24) + 'KKKKKK'); r.push('s'.repeat(25) + 'KKKKK');
    r.push('s'.repeat(30)); r.push('s'.repeat(30));
    r.push('o'.repeat(30));
    for (let i = 0; i < 4; i++) r.push('~'.repeat(30));
    return r;
  }
  function teraRows() {
    const r = ['#'.repeat(20), '#'.repeat(20)];
    for (let i = 0; i < 8; i++) r.push('#' + 't'.repeat(18) + '#');
    r.push('#########ll#########');
    r.push('PPPjjjjjjjjjjjjjjPPP');
    r.push('PPP"""""jjjj"""""PPP');
    r.push('PPPP"""""kk"""""PPPP');
    for (let y = 14; y <= 41; y++) r.push('PPPPPPPP"kk"PPPPPPPP');
    r.push('PPPPPPPPPkkPPPPPPPPP'); r.push('PPPPPPPPPkkPPPPPPPPP');
    return r;
  }
  const LEG = { F: 'roof', j: 'gravel' };

  async function kan1Enter(S, first) {
    const f = S.f;
    if (first && !f.ph) return lobbyIntro(S);
    if (f.ph === 'd2' && f.d2done) return evening2(S);
    if (f.ph === 'd2') setGoal(S);
  }
  async function kan2Enter(S, first) {
    const f = S.f;
    if (f.ph === 'd2') {
      S.dark(.15, 'kan2'); S.plr(null);
      if (S.once('k2d')) await S.narr('二楼的走廊很长，地板擦得发亮。\n尽头那面大镜子蒙着白布，旁边就是浜之间——纸门上贴满了御札。');
      setGoal(S);
    }
    if (f.ph === 'n2' && S.once('k2n')) {
      S.dark(.9, 'kan2'); S.plr(2.4);
      await S.narr('二楼的灯没开。走廊很长，长得看不到头。\n尽头那面镜子蒙着白布，像一个站着不动的人。');
    }
  }
  async function umibeEnter(S, first) {
    const f = S.f;
    if (f.ph === 'esc' && S.once('escU')) { await S.narr('海风很大。健太被你拽着，走一步，回头看一眼海。'); S.goal('去山上的寺（沿着海边的路，一直往东）'); return; }
    if (first && f.ph === 'd1') await S.narr('旅馆门口就是海。浪一层一层地推上沙滩。\n……活还没干完呢。');
    if (f.ph === 'd2') setGoal(S);
  }
  async function teraEnter(S, first) {
    const f = S.f;
    if (f.ph === 'esc' && S.once('teraE')) {
      await S.narr('石阶很陡，两边是黑压压的杉树。\n健太走到一半，忽然站住不肯走了。');
      await S.say('健太', '……我要回家。妈妈在等我吃饭。', { style: 'whisper' });
      S.goal('爬上石阶，去山顶的寺');
    }
  }
  function teraStep(S, x, y) {
    const f = S.f;
    if (f.ph === 'esc' && y <= 12) return meetJ(S);
    if (f.ph === 'down') {
      if (!f.downArm && y >= 12) return armDown(S);
      if (f.downArm) for (const k of [16, 22, 28, 31, 34]) if (y >= k && (k !== 31 || (f.gaze || 0) >= 2) && S.once('voice' + k)) return voiceAt[k](S);
      if (y >= 40) return gateScene(S);
    }
  }
  const innDoor = async S => { if (S.f.ph === 'esc') return S.narr('不能回去。'); S.sfx('open'); await S.go('kan1', 14, 15, 3); };
  const sideDoor = async S => { if (S.f.ph === 'esc') return S.narr('不能回去。'); S.sfx('open'); await S.go('kan1', 2, 2, 0); };

  function MAPS() {
    return {
      /* ---------------- 汐见屋 一楼 ---------------- */
      kan1: {
        amb: 'room', dark: .15, plr: 3.4, wall: 'wood', floor: 'lightwood', legend: LEG,
        tileOpts: { tileC: '#c8c4b4' },
        rows: kan1Rows(),
        ents: [
          /* 厨房 */
          { id: 'backdoor', x: 2, y: 1, spr: 'door', col: '#5a4430', on: backDoor },
          { x: 1, y: 2, spr: 'fridge', on: N('冰箱上贴着一张盂兰盆的进货单：茄子、黄瓜、素面、线香。\n还有一行：「白米　多备」。') },
          { x: 3, y: 2, spr: 'sink', on: N('水槽里泡着一摞漆盘。每个漆盘里都有一碗冒尖的白饭的印子。') },
          { x: 4, y: 2, spr: 'stove', on: N('灶上炖着鱼。咕嘟、咕嘟。') },
          { x: 5, y: 2, spr: 'stove', on: N('汤锅里是味噌汤。老板一天要煮三大锅。') },
          { x: 6, y: 2, spr: 'shelf', on: N('碗柜里，有一套小小的儿童碗筷，碗上画着一条小鲸鱼。\n洗得很干净。') },
          { x: 7, y: 2, spr: 'kama', on: N('老式的大电饭锅，冒着白气。\n一锅饭，比四个人吃的多得多。') },
          { id: 'zendai', x: 2, y: 5, w: 2, spr: 'zendai', on: async S => (S.f.ph === 'd1' || S.f.ph === 'n2pre') ? taishoTalk(S) : S.narr('调理台上摞着漆盘。最上面那个，是老板娘每天晚上端上楼的。') },
          { id: 'taisho', x: 5, y: 3, spr: '@taisho', dir: 3, on: taishoTalk },
          { id: 'kaneK', x: 7, y: 4, spr: '@kane', dir: 1, on: async S => S.f.ph === 'd3' ? kaneD3(S) : rot('阿兼婆婆', [['我在这家干了四十年了。', '老板娘嫁过来那年，我就在。'], '送完饭，记得去把浴场刷了。', '二楼？……你们老老实实守规矩，就没事。'], '_kk')(S) },
          /* 楼梯间 */
          { id: 'stairsU', x: 10, y: 2, spr: 'stairsup', solid: false, touch: stairsUp },
          { x: 9, y: 1, spr: 'painting', on: N('一幅褪色的海景画。画的角落，有人用铅笔添了一个小小的人，站在浪里。') },
          /* 浴场 */
          { id: 'tub', x: 14, y: 3, w: 2, spr: 'bathtub', full: true, on: tubUse },
          { id: 'bmirror', x: 17, y: 1, spr: 'bmirror', on: bmirrorUse },
          { id: 'drain', x: 16, y: 5, spr: 'drain', solid: false, decal: true, on: drainUse },
          { x: 13, y: 6, spr: 'oke', on: N('木头小水桶，摞成一摞。最底下那个特别小，是孩子用的。') },
          /* 员工房 */
          { x: 20, y: 2, spr: 'locker', on: lockerOther }, { x: 21, y: 2, spr: 'locker', on: lockerOther },
          { id: 'locker', x: 22, y: 2, spr: 'locker', on: lockerUse },
          { x: 24, y: 1, spr: 'koyomi', on: N('八月的挂历。十三号到十六号，用红笔框着：「盂兰盆」。\n十三号那一格，被红笔圈了一圈又一圈，把纸都划破了。') },
          { x: 26, y: 1, spr: 'window', lit: true, on: async S => S.narr(['n1', 'n2', 'eve1', 'n2pre'].includes(S.f.ph) ? '窗外黑漆漆的。只听得见浪声。\n……窗玻璃上，好像有一个小小的手印。' : '窗外是海。白晃晃的，晃得人睁不开眼。') },
          { x: 26, y: 2, spr: 'fan', on: N('电风扇一边摇头一边嗡嗡响。') },
          { id: 'sfK', x: 21, y: 4, h: 2, spr: 'futonP', col: '#a85a4a', s: { hc: '#2a1a12' }, on: N('健太的被褥。枕头边上堆着零食袋子。') },
          { id: 'sfS', x: 23, y: 4, h: 2, spr: 'futonP', col: '#4a6a5a', s: { hc: '#121010', sk: '#f0c8a0' }, on: N('修一的被褥，叠得方方正正。枕边放着一本书和眼镜盒。') },
          { id: 'sfM', x: 25, y: 4, h: 2, spr: 'futonP', col: '#4a5a8a', s: { hc: '#1e1a18', sk: '#f0c8a0' }, on: myFuton },
          /* 走廊 */
          { id: 'rulesP', x: 24, y: 7, spr: 'rulesP', on: showRules },
          { id: 'hclock', x: 13, y: 7, spr: 'hclock', num: 4, on: async S => S.narr('走廊里的柱钟。' + hourText(S.f.hour ?? 16) + '。\n钟摆一下一下地晃。' + (['d1', 'd2'].includes(S.f.ph) ? '\n（每干完一件活，钟就往前走一截。）' : '')) },
          { x: 19, y: 8, spr: 'kdenwa', on: N('粉红色的投币电话。旁边贴着一张泛黄的纸：「寻人」。\n照片被撕掉了，只剩下一行字：「去年夏天在本馆打工的……」') },
          { id: 'okamiT', x: 4, y: 8, spr: '@okamiZ', hidden: true, solid: false },
          /* 宴会厅 */
          { id: 'tabM', x: 2, y: 12, w: 2, spr: 'lowtable', on: S => tableUse(S, 'M') },
          { id: 'tabT', x: 6, y: 12, w: 2, spr: 'lowtable', on: S => tableUse(S, 'T') },
          { id: 'gM', x: 2, y: 11, spr: '@guestM', on: guestLine('客人（男）', '饭还没好吗？肚子都叫了。', '……二楼半夜，真的有小孩在跑。我老婆也听见了。') },
          { id: 'gF', x: 3, y: 11, spr: '@guestF', on: guestLine('客人（女）', '这家店好安静呀。', '我们住二楼的竹之间。半夜有人在走廊里，一直叫「妈妈」……') },
          { id: 'gO', x: 7, y: 11, spr: '@oldman', on: guestLine('老先生', '……烤鱼，饭少盛一点。', '二楼最里面那间，以前是最好的屋子，推开窗就是整片海。\n……现在不让住人了。') },
          { x: 8, y: 10, spr: 'scroll', on: N('挂轴上画着一片海。浪里，站着一个小小的人影。') },
          { id: 'zenD', x: 6, y: 14, spr: 'zen', hidden: true, on: N('那个漆盘。碗里的饭被抓得乱七八糟，筷子倒在一边。') },
          { id: 'okamiD', x: 4, y: 14, spr: '@okami', hidden: true, dir: 2, on: S => S.say('老板娘', '……嘘。他在吃饭呢。', { style: 'whisper' }) },
          /* 帐场 */
          { id: 'okamiL', x: 12, y: 11, spr: '@okami', dir: 0, on: async S => S.say('老板娘', { d1: '活儿不急，慢慢来。', d2: ['……昨晚睡得好吗？', '规矩，都记住了吧？'][(S.f._ol = ((S.f._ol ?? -1) + 1) % 2)], d3: '……健太君呢？他今天要陪我的。' }[S.f.ph] || '……') },
          { x: 12, y: 12, spr: 'counter', on: N('帐场的柜台。登记簿摊开着，这个星期的客人只有三组。') },
          { x: 13, y: 12, spr: 'counter', col: '#7a6a52', on: N('柜台上摆着一只招财猫。猫的一只眼睛被人用记号笔涂黑了。') },
          { x: 17, y: 11, spr: 'plant', on: N('盆栽的叶子上落了一层盐霜。海风太大了。') },
          { x: 18, y: 14, spr: 'getabako', on: async S => { await S.narr('鞋柜。最下面一格，摆着一双男式运动鞋，落满了灰。\n不是客人的，也不是你们的。'); if (S.f.memo) await S.think('（日记里写着：「他的鞋还在玄关。」）'); } },
          { x: 14, y: 16, spr: 'invisible', touch: frontExit }, { x: 15, y: 16, spr: 'invisible', touch: frontExit },
          /* 帐场后屋 */
          { x: 21, y: 10, spr: 'kamidana', on: N('神龛上供着一张黑色的符，上面的字一个也认不得。\n符底下，压着一绺短短的头发。') },
          { x: 26, y: 11, spr: 'bookshelf', on: N('架子上一排旧宿帐。平成八年八月那一本：\n十二号以前写得满满的，十三号以后，一个字都没有。\n只有一行：「本馆休业」。') },
          { x: 20, y: 12, spr: 'desk', on: N('老板娘的书桌。抽屉里塞满了招聘广告的底稿。\n每一张都写着：「限男性，十八到二十二岁」。') },
          { id: 'sfuton', x: 24, y: 13, h: 2, spr: 'futon', col: '#8a6a7a', hidden: true, on: N('老板娘的被褥。枕头上落着好多根头发。') },
          { id: 'okamiS', x: 22, y: 13, spr: '@okamiS', dir: 2, hidden: true, on: okamiSick },
          { id: 'kaneL', x: 15, y: 12, spr: '@kane', hidden: true, on: S => S.say('阿兼婆婆', '老板娘在后屋。……快去。') },
          /* 三个人 */
          { id: 'kenta1', x: 16, y: 14, spr: '@kenta', dir: 3, on: async S => S.f.ph === 'd3' ? kentaD3(S) : rot('健太', { d1: ['我饿了……送完饭能偷吃一口吗？', '浜之间里肯定藏着什么。等着瞧。'], d2: ['（嘴里塞满了）……厨房的饭团太好吃了。', '那张规矩单……肯定是老板娘半夜起来写的。吓唬人。'], n1: ['……猫吧。', '修一你别吓我。'], eve1: ['……猫吧。'], eve2: ['今晚你端饭上去？我跟你去！我就看一眼！', '……修一真没劲。'], n2pre: ['我跟你去！就看一眼！'] }[S.f.ph] || ['……'], '_kt' + S.f.ph)(S) },
          { id: 'shu1', x: 14, y: 14, spr: '@shuichi', dir: 3, on: async S => rot('修一', { d1: ['先把活干了吧。', '……规矩写得真怪。'], d2: ['规矩单上的字，是一夜之间多出来的。', '昨晚那个声音……叫我们名字的时候，是从天花板上传下来的。'], n1: ['……别出去。', '九点以后别上楼。写着呢。'], eve1: ['……枕饭。'], eve2: ['别让健太跟着你。', '老板娘让你一个人去？……小心点。'], n2pre: ['别让健太跟着你。'], n2: ['你小心点。'], d3: ['我去寺里。你带健太出来。'] }[S.f.ph] || ['……'], '_st' + S.f.ph)(S) }
        ],
        enter: kan1Enter,
        step(S, x, y) { if (S.f.ph === 'n1' && x >= 9 && x <= 11 && y <= 6 && S.once('n1hum')) return n1Hum(S); }
      },
      /* ---------------- 汐见屋 二楼 ---------------- */
      kan2: {
        amb: 'room', dark: .2, plr: 3, wall: 'paper', floor: 'tatami',
        legend: Object.assign({ X: { t: 'tatami', solid: true } }, LEG),
        rows: kan2Rows(),
        ents: [
          { x: 1, y: 7, spr: 'stairsdown', solid: false, touch: stairsDown },
          { x: 5, y: 1, spr: 'window', lit: true, on: N('松之间的窗户。海风把窗帘吹得鼓起来。') },
          { id: 'futM', x: 2, y: 3, h: 2, spr: 'mfuton', on: S => mfutonUse(S, 'futM', 'r1', '你把松之间的被褥叠好，摞进壁橱。\n枕头底下压着一张纸条，是客人留的：「半夜有小孩敲门，说要找妈妈。」') },
          { x: 4, y: 4, w: 2, spr: 'lowtable', on: N('矮桌上放着客人喝剩的两罐啤酒。') },
          { x: 11, y: 1, spr: 'window', lit: true, on: N('竹之间的窗户。从这里能看见旅馆门口的海滩。') },
          { id: 'futT', x: 9, y: 3, h: 2, spr: 'mfuton', on: S => mfutonUse(S, 'futT', 'r2', '你把竹之间的被褥叠起来。\n褥子上有一块湿印子，小小的，像有个孩子在上面坐过。\n……摸上去，是凉的。') },
          { x: 12, y: 2, spr: 'tv', on: N('旅馆的老电视。投一百日元，能看一个小时。') },
          { x: 15, y: 2, spr: 'linen', on: N('布草柜里摞着干净的床单和浴衣。') },
          { x: 16, y: 2, spr: 'linen', on: N('浴衣有大号、中号……最底下一格，是一套小孩穿的浴衣。叠得整整齐齐。') },
          { x: 18, y: 3, spr: 'toybox', on: N('一个纸箱，箱子上写着一个字：「翔」。\n里面是一把水枪、一顶草帽、一个泄了气的游泳圈。\n草帽的帽檐上，还沾着沙子。') },
          { x: 13, y: 6, spr: 'painting', on: N('走廊上挂着一张全家福。老板、老板娘，和一个小男孩。\n小男孩的脸，被人用指甲刮花了——不，是被手摸了太多遍，摸花了。') },
          { id: 'photoF', x: 21, y: 8, spr: 'photo', on: photoUse },
          { id: 'fdoor', x: 23, y: 6, spr: 'fdoor', on: fdoorUse },
          { id: 'zspot', x: 23, y: 7, spr: 'zenspot', solid: false, full: false },
          { id: 'kagami', x: 26, y: 6, spr: 'kagami', covered: true, on: kagamiUse },
          { id: 'kenta2', x: 23, y: 7, spr: '@kentaP', hidden: true, solid: false, dir: 3 }
        ],
        enter: kan2Enter,
        step(S, x, y) { const f = S.f; if (f.ph === 'n2' && f.n2s === 'back' && x <= 14) return kentaBehind(S, false); }
      },
      /* ---------------- 海边 ---------------- */
      umibe: {
        amb: 'wind', dark: 0, plr: 3.6, legend: LEG, floor: 'sand',
        tileOpts: { grassC: '#3a5a2e', treeC: '#24402a' },
        rows: umibeRows(),
        ents: [
          { x: 1, y: 2, w: 12, spr: 'innfront', on: null },
          { x: 7, y: 2, spr: 'invisible', solid: true, on: innDoor },
          { x: 12, y: 2, spr: 'invisible', solid: true, on: sideDoor },
          { x: 20, y: 2, spr: 'vending', col: '#2a6ab0', on: N('自动售货机。弹珠汽水，一百二十日元。') },
          { x: 28, y: 2, spr: 'signT', on: N('路牌：「→ 海云寺　石阶四百级」') },
          { x: 29, y: 3, spr: 'invisible', touch: toTemple }, { x: 29, y: 4, spr: 'invisible', touch: toTemple },
          { x: 16, y: 6, w: 3, spr: 'uminoie', on: N('海之家关着卷帘门。上面贴着：「盂兰盆期间　禁止游泳」。') },
          { x: 4, y: 8, spr: 'parasol', on: N('沙滩上插着一把遮阳伞，被风吹得歪歪扭扭。') },
          { x: 12, y: 9, spr: 'parasol', col: '#3a8ad8', on: N('遮阳伞底下，有人用沙子堆了一座小山，山顶插着一双筷子。') },
          { x: 1, y: 11, w: 2, spr: 'boat', on: N('翻过来晾着的小渔船。船底长满了藤壶。') },
          { id: 'g1', x: 5, y: 9, spr: 'gomi', num: 0, hidden: true, on: S => gomiUse(S, 'g1', '一个空啤酒罐。罐子里灌满了沙子。') },
          { id: 'g2', x: 14, y: 12, spr: 'gomi', num: 1, hidden: true, on: S => gomiUse(S, 'g2', '一个塑料袋，被浪卷上来的。袋子里有一只小小的、泡烂了的螃蟹。') },
          { id: 'g3', x: 21, y: 8, spr: 'gomi', num: 2, hidden: true, on: S => gomiUse(S, 'g3', '昨晚有人在这儿放过烟花。烧黑的烟花棒插在沙子里，排成一个圈。') },
          { x: 23, y: 9, spr: 'ireihi', on: N('海边的慰灵碑。「慰灵　平成八年夏　于此海岸」\n碑前供着一瓶弹珠汽水，和一把褪了色的水枪。\n汽水瓶上有水珠。是今天早上才放的。') },
          { id: 'sandalS', x: 26, y: 11, spr: 'sandalS', on: sandalUse },
          { id: 'kaneU', x: 9, y: 7, spr: '@kane', hidden: true, dir: 0, on: kaneBeach },
          { id: 'shuU', x: 15, y: 11, spr: '@shuichi', hidden: true, dir: 1, on: rot('修一', ['……规矩单上的字，是怎么一夜之间多出来的？', '老先生说，老板娘有个小儿子。……我们来了两天，一次都没见过。', '盂兰盆不许下海……我奶奶家那边也这么说。'], '_su') },
          { id: 'kentaU', x: 12, y: 3, spr: '@kentaP', hidden: true, on: N('健太盯着海，嘴里念念有词：「……妈妈。」') }
        ],
        enter: umibeEnter
      },
      /* ---------------- 海云寺 ---------------- */
      tera: {
        amb: 'wind', dark: .15, plr: 3.4, wall: 'wood', floor: 'lightwood', legend: Object.assign({ k: 'steps' }, LEG),
        tileOpts: { grassC: '#2e4a2a', treeC: '#1e3a24' },
        rows: teraRows(),
        ents: [
          { x: 9, y: 2, w: 2, spr: 'altar', on: N('本堂的佛坛。金色的佛像半闭着眼睛。') },
          { x: 6, y: 2, spr: 'candles', on: N('一排小蜡烛。火苗一动不动。') }, { x: 13, y: 2, spr: 'candles', on: N('一排小蜡烛。火苗一动不动。') },
          { x: 8, y: 3, spr: 'mokugyo', on: N('木鱼。被敲了几十年，木头都磨亮了。') },
          { x: 11, y: 3, spr: 'rinS', on: async S => { rin(S, .08); await S.narr('你轻轻碰了一下铜磬。「当——」\n声音在本堂里转了很久，才散。'); } },
          { id: 'toubaV', x: 12, y: 3, spr: 'touba', hidden: true, on: N('你写的塔婆。「俗名　翔　平成八年八月十三日　殁」') },
          { id: 'jushoV', x: 10, y: 3, spr: '@jushoku', dir: 3, hidden: true, on: async S => { chant(S, 3, .07); await S.say('住持', S.f.vs === 'C' ? '按住他！' : '……南无阿弥陀佛。守好灯。'); } },
          { x: 3, y: 1, spr: 'scroll', on: async S => S.f.ph === 'vigil' ? S.note('okite') : S.narr('柱子上贴着一张白纸。') },
          { id: 'kentaV', x: 9, y: 6, h: 2, spr: 'kfuton', hidden: true, on: N('健太躺在被褥上，被子盖到下巴。\n他的嘴在动，像在嚼什么东西。') },
          ...[[7, 5], [12, 5], [7, 8], [12, 8]].map(([x, y], i) => ({ id: 'c' + i, x, y, spr: 'tomyo', off: false, light: { r: 2.6, col: 'rgba(255,190,110,.22)', flick: true }, on: S => tomyoUse(S, 'c' + i) })),
          { id: 'shuV', x: 15, y: 5, spr: '@shuichi', dir: 1, hidden: true, on: S => S.say('修一', S.f.vs === 'C' ? '……我动不了……！' : '……我一闭眼，就听见有人在门外走。', { style: 'whisper' }) },
          { id: 'kentaC', x: 9, y: 7, spr: 'crawler', col: '#b83a2a', hidden: true, solid: false, dir: 0, on: kentaCUse },
          { id: 'shoV', x: 10, y: 9, spr: 'crawler', col: '#5a6a74', s: { kid: true }, hidden: true, solid: false, dir: 3 },
          { id: 'doorL', x: 9, y: 10, spr: 'sliding', open: true, solid: false, on: N('本堂的拉门。') },
          { id: 'doorR', x: 10, y: 10, spr: 'sliding', open: true, solid: false, on: N('本堂的拉门。') },
          /* 院子 */
          { x: 5, y: 12, spr: 'shoro', on: N('钟楼。撞木用粗麻绳吊着。') },
          { x: 7, y: 12, spr: 'stonelantern', on: N('石灯笼。底座上刻着「海难供养」。') },
          { x: 12, y: 12, spr: 'stonelantern', off: true, on: N('石灯笼。里面插着一根烧了一半的线香。') },
          { x: 15, y: 12, spr: 'gravestone', flowers: true, on: N('一排小小的墓碑，都朝着海的方向。\n最边上那块，没有刻名字。') },
          { id: 'jushoY', x: 11, y: 11, spr: '@jushoku', dir: 0, on: jushoTalk },
          { id: 'shuY', x: 13, y: 12, spr: '@shuichi', dir: 1, on: async S => S.say('修一', S.f.ph === 'tera' ? ['塔婆上要写命日……照片背面写的是「盂兰盆的前一天」。', '去年那本日记里，写着盂兰盆是哪天开始的吧？'][(S.f._sy = ((S.f._sy ?? -1) + 1) % 2)] : '……来了。') },
          { id: 'kentaT', x: 9, y: 42, spr: '@kentaP', hidden: true, on: N('健太。他一直在嚼着什么——嘴里什么都没有。') },
          /* 石阶 */
          ...[16, 22, 28, 34].flatMap(y => [{ x: 8, y, spr: 'stonelantern', on: N('石阶旁的石灯笼。灯里没有火，结着蜘蛛网。') }, { x: 11, y, spr: 'stonelantern', off: true, on: N('石灯笼上落满了杉树的针叶。') }]),
          { x: 9, y: 41, w: 2, spr: 'sanmon', solid: false, z: 1 },
          { id: 'okamiG', x: 11, y: 41, spr: '@okami', hidden: true, dir: 1, on: N('老板娘。') },
          { id: 'shuD', x: 10, y: 43, spr: '@shuichi', hidden: true, dir: 3 },
          { id: 'kentaFar', x: 10, y: 20, spr: '@kentaP', hidden: true, solid: false, dir: 3 },
          { id: 'shoK', x: 10, y: 39, spr: '@shoK', hidden: true, solid: false, dir: 3 },
          { x: 9, y: 43, spr: 'invisible', touch: teraExit }, { x: 10, y: 43, spr: 'invisible', touch: teraExit }
        ],
        enter: teraEnter,
        step: teraStep
      }
    };
  }

  /* ================= 人物 ================= */
  const glasses = (g, d, fr, G, R) => { if (d === 0) { R(5, G.hT + 3, 2, 1, '#1a1a1a'); R(9, G.hT + 3, 2, 1, '#1a1a1a'); R(7, G.hT + 4, 2, 1, '#1a1a1a'); R(5, G.hT + 5, 1, 1, '#cfe0f0'); } else if (d === 1) R(3, G.hT + 3, 3, 1, '#1a1a1a'); };
  const trayX = (g, d, fr, G, R) => {
    if (d === 3) return;
    const x = d === 1 ? -1 : 2, y = G.tT + 6;
    R(x, y + 2, 12, 2, '#2a0e0a'); R(x + 1, y + 2, 10, 1, '#5a1e16');
    R(x + 2, y - 1, 5, 3, '#ece8e0'); R(x + 3, y - 2, 3, 1, '#fbfaf6');
    R(x + 3, y - 4, 1, 3, '#c8a060'); R(x + 5, y - 4, 1, 3, '#b08a4a'); R(x + 8, y, 2, 2, 'rgba(200,225,235,.9)');
  };
  const PEOPLE_R = {
    me: { key: 'rb-takumi', skin: '#f0c8a0', hair: '#1e1a18', hs: 'short', top: '#e8e6de', top2: '#c8c4b8', bottom: '#2a3448', shoes: '#e8e8e8', apron: '#2a3a5a' },
    kenta: { key: 'rb-kenta', skin: '#e8b88e', hair: '#2a1a12', hs: 'messy', top: '#c83a2a', top2: '#a02a1e', bottom: '#4a4a4a', shoes: '#e8e8e8' },
    kentaP: { key: 'rb-kentaP', skin: '#c8b4a0', hair: '#120c0a', hs: 'messy', top: '#9a3a30', top2: '#7a2a22', bottom: '#3a3a3a', shoes: '#cfcfcf', eye: '#000000',
      extra(g, d, fr, G, R) { if (d === 0) { R(5, G.hT + 6, 6, 1, '#3a0a0a'); R(4, G.hT + 5, 1, 1, '#3a0a0a'); R(11, G.hT + 5, 1, 1, '#3a0a0a'); R(6, G.hT + 3, 1, 1, '#7a6a6a'); R(9, G.hT + 3, 1, 1, '#7a6a6a'); R(7, G.hT + 7, 1, 1, '#ffffff'); } } },
    shuichi: { key: 'rb-shuichi', skin: '#f0c8a0', hair: '#121010', hs: 'short', top: '#3a5a8a', top2: '#e8e8e8', bottom: '#2a2a32', shoes: '#3a2a1a', extra: glasses },
    okami: { key: 'rb-okami', skin: '#ecd0b4', hair: '#1a1416', hs: 'bun', top: '#5a4a6a', top2: '#e8e2d6', bottom: '#5a4a6a', robe: true, shoes: '#e8e2d6', apron: '#ddd6c6' },
    okamiZ: { key: 'rb-okamiZ', skin: '#ecd0b4', hair: '#1a1416', hs: 'bun', top: '#5a4a6a', top2: '#e8e2d6', bottom: '#5a4a6a', robe: true, shoes: '#e8e2d6', apron: '#ddd6c6', extra: trayX },
    okamiS: { key: 'rb-okamiS', skin: '#e8dccc', hair: '#1a1416', hs: 'long', top: '#e8e2d6', top2: '#c8c0b0', bottom: '#e8e2d6', robe: true, shoes: '#e8e2d6' },
    taisho: { key: 'rb-taisho', skin: '#c89a72', hair: '#3a3430', hs: 'bald', top: '#ecebe4', top2: '#d0cec4', bottom: '#3a3a40', shoes: '#2a2a2a', extra(g, d, fr, G, R) { R(4, G.hT + 1, 8, 1, '#2a3a6a'); if (d === 1) R(11, G.hT + 1, 2, 2, '#2a3a6a'); } },
    kane: { key: 'rb-kane', skin: '#d8b49a', hair: '#c8c4c0', hs: 'bun', top: '#6a7a6a', bottom: '#4a4a4a', skirt: true, apron: '#e8e2d6', shoes: '#2a2a2a' },
    jushoku: { key: 'rb-jushoku', skin: '#d8b090', hair: '#3a3430', hs: 'bald', top: '#1e1c22', top2: '#e8e2d6', bottom: '#1e1c22', robe: true, shoes: '#e8e2d6', extra(g, d, fr, G, R) { if (d === 0) { R(4, G.tT + 1, 2, G.tB - G.tT, '#8a6a2a'); R(6, G.tT + 3, 2, 2, '#8a6a2a'); R(8, G.tT + 5, 2, 2, '#8a6a2a'); } } },
    guestM: { key: 'rb-gM', skin: '#e8b080', hair: '#2a2020', hs: 'short', top: '#2a4a6a', top2: '#e8e8e8', bottom: '#2a4a6a', robe: true },
    guestF: { key: 'rb-gF', skin: '#f0b898', hair: '#3a2418', hs: 'bob', top: '#c8a0b8', top2: '#e8e8e8', bottom: '#c8a0b8', robe: true },
    oldman: { key: 'rb-old', skin: '#d4a07a', hair: '#d8d4d0', hs: 'short', top: '#3a4a6a', top2: '#e8e8e8', bottom: '#3a4a6a', robe: true },
    shoW: { key: 'rb-shoW', child: true, skin: '#a6b6ba', hair: '#08090b', hs: 'messy', cover: true, top: '#5a6a74', bottom: '#4a5a64', shoes: '#a6b6ba' },
    shoK: { key: 'rb-shoK', child: true, skin: '#c89a72', hair: '#1a1210', hs: 'short', top: '#e8e4d8', bottom: '#3a5a8a', shoes: '#c82a2a', hat: 'straw', hatC: '#d8c070' }
  };

  /* ================= 选章卡片：贴满御札的纸门，门口一碗插着筷子的饭 ================= */
  function thumb(g, w, h) {
    const F = (x, y, ww, hh, c) => { g.fillStyle = c; g.fillRect(x, y, ww, hh); };
    F(0, 58, w, 10, '#3a2a1c'); for (let x = 0; x < w; x += 12) F(x, 58, 1, 10, '#2a1e14');
    F(14, 10, 46, 50, '#1e140c'); F(16, 12, 20, 46, '#c9c1aa'); F(38, 12, 20, 46, '#c4bca4');
    F(34, 13, 6, 44, '#030203'); F(35, 30, 1, 1, '#e8f0f0'); F(38, 30, 1, 1, '#e8f0f0');
    const P = [[18, 14], [26, 18], [44, 14], [52, 20], [20, 30], [46, 32], [18, 44], [27, 46], [44, 46], [52, 42], [24, 24], [50, 26]];
    for (const [x, y] of P) { F(x, y, 5, 9, '#f2eee2'); F(x + 2, y + 2, 1, 2, '#a01818'); F(x + 1, y + 5, 3, 1, '#1a1a1a'); }
    F(16, 34, 42, 1, '#1e140c');
    F(26, 60, 22, 5, '#2a0e0a'); F(27, 60, 20, 1, '#5a1e16'); F(29, 54, 8, 6, '#ece8e0'); F(30, 51, 6, 3, '#fbfaf6'); F(32, 43, 1, 10, '#c8a060'); F(34, 43, 1, 10, '#b08a4a'); F(40, 56, 4, 4, 'rgba(200,225,235,.85)');
  }

  /* ================= 章节 ================= */
  defChapter({
    id: 'resortbaito', n: 9, title: '旅馆打工', sub: '海边老旅馆的暑期打工。二楼最里面的房间不许进，老板娘每晚端一碗插着筷子的饭上去。', origin: '日本网络怪谈', color: '#2e4a5a',
    icon: '@okamiZ', iconX: 30, amb: 'room', floor: 'lightwood', wall: 'wood', dark: .15, plr: 3.4,
    thumb,
    people: PEOPLE_R,
    items: {
      zenA: { name: '刺身定食（松之桌）', desc: '两份刺身定食。老板说：松之桌，两位。' },
      zenB: { name: '烤鱼定食（竹之桌）', desc: '一份烤鱼定食，饭盛得少。老板说：竹之桌，老先生。' },
      zen: { name: '膳', desc: '漆盘上一碗冒尖的白饭，筷子笔直地插在正中间。一杯清水，一颗水果糖。\n端到浜之间门口，敲三下门。' },
      sandal: { name: '红色的小凉鞋', desc: '礁石缝里捡到的，孩子穿的凉鞋。只有一只。泡得发白了。' },
      onigiri: { name: '饭团', desc: '老板攥的饭团，还热乎着。健太现在只认吃的。' },
      touba: { name: '塔婆', desc: '新削的木牌。「俗名　翔　平成八年八月十三日　殁」' },
      match: { name: '火柴', desc: '住持给的火柴。灯明灭了，用它点上。' }
    },
    notes: {
      rules: { title: '规则单', text: '（老板娘的字，圆珠笔写在便笺上，贴在员工房门外的墙上。每天早上，都会多一条。）\n\n汐见屋　打工须知\n\n一、二楼最里面的「浜之间」，不许进去。\n二、晚上九点以后，不要上二楼。\n三、夜里有人隔着门叫你的名字，不要答应。\n四、二楼走廊尽头的镜子，布不要掀开。\n\n五、不要把哥哥带走\n　（最后一行是蜡笔写的，字歪歪扭扭，像小孩子写的。）' },
      memo: { title: '去年的打工日记', text: '（柜子最里面塞着的小本子。封面写着「汐见屋　打工日记」。是去年在这儿打工的人留下的。）\n\n七月三十日　海很蓝，饭很香。规矩有点怪。\n\n八月二日　半夜天花板上有东西在爬。S说是猫。哪有那么重的猫。\n\n八月五日　规矩单上多了一条。昨晚门外有人叫S的名字，S应了。\n\n八月十日　S不对劲。用手抓饭吃，半夜在走廊上爬。老板娘摸着他的头笑。\n\n八月十三日　盂兰盆头一天（迎火）\n老板娘一早在门口烧了迎火，说「盂兰盆这几天，海里的人会回来」。\nS不见了。老板娘说他家里有事，先走了。\n他的鞋还在玄关。\n\n（后面几页被撕掉了。）' },
      photo: { title: '浜之间门口的照片', text: '（一张旧照片，卡在浜之间门口的地板缝里。边角被水泡过。）\n\n照片上是一个晒得黑黑的小男孩，戴着草帽，站在汐见屋门口，咧着嘴笑。脚上穿着一双红色的小凉鞋。\n他身后，二楼最里面那间屋子的窗户开着。\n\n照片背面，圆珠笔写着：\n\n「翔　七岁\n　平成八年　盂兰盆的前一天\n　说明天还要去海里游泳」' },
      okite: { title: '守夜的规矩', text: '（住持用毛笔写在一张白纸上，贴在本堂的柱子上。）\n\n一、灯明四盏，守在结界四角。灭了一盏，立刻点上。\n二、不管谁在门外叫，叫谁的名字，都不要应，不要开门。\n三、健太要是起来往外爬，先按住他。不能让他出这道门。\n四、它来的时候，举起塔婆，叫它的名字。\n五、鸡叫以后，才可以出本堂。\n\n下山的时候，不要回头。出了山门，就到此为止。' }
    },
    legend: '「リゾートバイト」（度假村打工）是日本网络论坛2ch的オカルト板上流传很广的长篇怪谈，一般认为最早贴出于2009年前后，作者匿名，真实身份不可考。故事的大致框架是：几个大学生暑假到海边的旅馆住店打工，旅馆里有一间不许进的房间，老板娘每天晚上把饭菜端上去；年轻人出于好奇偷偷去看，结果其中一人渐渐变得不对劲，最后不得不求助于寺里的和尚，在一连串严格的禁忌里熬过驱邪——出寺下山的时候，绝对不能回头。原帖篇幅很长，后来的转述、漫画和朗读视频在细节上出入不小，这里只取各版本共有的骨架。\n\n故事里的许多细节，借用了日本真实的民间习俗：竖着插在饭上的筷子是供给死者的「枕饭」，所以日常吃饭忌讳把筷子插在饭里；盂兰盆（多数地方在八月十三日至十六日）有烧迎火、送火迎送祖先的习俗；各地都流传「盂兰盆期间不要下海」的说法——据说那几天回来的亡魂会把人拉下水，也有人认为，这其实是因为八月中旬浪大、水母多的经验之谈。「夜里被叫名字不要随便应」「驱邪之后不能回头」，也是日本怪谈里很常见的禁忌。\n\n这个故事常被列为2ch オカルト板的「名作」之一，与《八尺大人》《子取箱》等一起被反复转载和改编。它吓人的地方不在某一个鬼怪，而在一种慢慢收紧的感觉：一份看起来只是「有点怪」的打工，规矩、饭菜、同伴的变化，一点一点把人往一个早就准备好的位置上推。\n\n（本章中的汐见屋、拓海·健太·修一、老板娘与她的儿子「翔」、阿兼婆婆、老板、海云寺住持，每天多一条的规则单与蜡笔写的第五条，去年打工生的日记，照片与「八月十三日」的命日，塔婆、四盏灯明与守夜，红色的小凉鞋，山门前的几种结局，均为游戏虚构，与原帖情节并不一一对应。）',
    start: { map: 'kan1', x: 15, y: 14, dir: 3 },
    faces: FACES,
    endings: { all3: '第九夜　完', kuyou: '送他回家（隐藏）', left: '留下一个', stay: '替身' },
    resume: {
      n1: async S => { S.amb('night'); S.hidePlayer(false); if (lastDeath === 'gaze') await S.think('（规矩上写着的每一条……都别碰。）'); lastDeath = null; },
      d2: async S => { S.amb('room'); lastDeath = null; },
      n2: async S => {
        S.amb('night'); S.hidePlayer(false);
        if (lastDeath === 'mirror') await S.think('（布一掉，就马上过去，闭着眼睛把它盖回去。……别犹豫。）');
        else if (lastDeath === 'gaze') await S.think('（门里的声音别应，镜子别看，下楼别回头。……规矩，一条都别碰。）');
        lastDeath = null;
      },
      d3: async S => { S.amb('room'); lastDeath = null; },
      tera: async S => { S.amb('wind'); lastDeath = null; },
      vigil: async S => { S.amb('night'); S.f.crawl = false; if (lastDeath === 'candle') await S.think('（灯明一灭，就马上去点。火柴在手里。）'); lastDeath = null; return vStageA(S); },
      vB: async S => { S.amb('night'); S.f.crawl = false; if (lastDeath === 'voice') await S.think('（门外不管是谁的声音……都别应，也别开门。）'); lastDeath = null; return vStageB(S); },
      vC: async S => {
        S.amb('night'); S.f.crawl = false;
        if (lastDeath === 'kenta') await S.think('（先按住健太——他爬得比灯灭得快。按住了，修一会帮忙。）');
        else if (lastDeath === 'candle') await S.think('（按住健太以后，别发愣。两盏灯：西北角，东南角。）');
        else if (lastDeath === 'voice') await S.think('（门外不管是谁的声音……都别应。）');
        lastDeath = null; return vStageC(S);
      },
      down: async S => { S.amb('wind'); await S.think('（不管身后是谁的声音——都别回头。一直往下走。）'); }
    },
    async intro(S) {
      await S.card('第九夜　旅馆打工', '2008年8月　日本某县　海边的小镇', '大一的暑假，\n我和健太、修一三个人，\n在网上找了一份「包吃包住」的打工。\n\n海边的老旅馆。时薪不高，\n但每天都能看见海。\n\n后来，我们只干了三天。');
    },
    tick(S, dt) {
      const f = S.f, m = S.map;
      if (!S.busy) {
        bgT -= dt;
        if (bgT <= 0) {
          bgT = 9 + Math.random() * 9;
          if (m === 'kan1' && ['n1', 'eve2', 'n2pre', 'n2'].includes(f.ph)) crawlPat(S, .045);
          else if (m === 'kan2' && f.ph === 'n2') { thump(S, .06); if (Math.random() < .5) drip(S, .04, .6); }
          else if (m === 'kan2' && f.ph === 'd2') { if (Math.random() < .4) hum(S, .02); }
          else if (m === 'umibe') wave(S, .05);
          else if (m === 'tera' && f.ph === 'vigil') mokugyo(S, .05);
        }
      }
      if (m === 'tera') crawlTick(S, dt);
      if (m === 'kan2' && f.ph === 'n2' && f.n2s === 'back' && !S.busy && W.pl.dir === 2 && W.pl.x <= 21) S.run(S => kentaBehind(S, true));
      if (m === 'tera' && f.ph === 'down' && f.downArm && !S.busy) {
        if (f.lookCD > 0) f.lookCD -= dt;
        else if (W.pl.dir === 3) S.run(lookBack);
      }
    },
    sprites: SPRITES,
    tiles: TILES,
    maps: MAPS()
  });
})();
