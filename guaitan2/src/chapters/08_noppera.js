/* ================= 第八夜 · 无脸人（のっぺらぼう） ================= */
(() => {
  /* 坂上的四个人：一个是真人，三个是貉（一家三口：老的藏不住尾巴、母的藏不住手、小的学不会说话） */
  const FIG = ['kusuri', 'kago', 'komuso', 'kozo'];
  const NAME = { kusuri: '卖药郎', kago: '轿夫', komuso: '虚无僧', kozo: '小伙计' };
  const FPOS = { kusuri: [7, 4, 0], kago: [12, 7, 2], komuso: [19, 3, 0], kozo: [25, 6, 1] };
  const FLAWT = { tail: '影子后头拖着尾巴', hand: '手背上长着毛', voice: '只会说一声「もし」' };
  const DIED = { chase: 0, sakaue: 0, soba: 0 };            // 死亡 / 坏结局次数（新开一局清零，重来不清），决定提示等级
  const SPD = 3.2;                                 // 她追人的速度（格/秒）
  const CS = { frz: 0, pend: null, cool: 0, snd: 0, hb: 0 };   // 追逐的临时状态（只在主机上跑，不进存档）
  function resetChase(frz) { Object.assign(CS, { frz, pend: null, cool: 0, snd: 0, hb: 0 }); }
  let sobT = 0, furT = 0, shakuT = 4, idleT = 0;

  /* ---------------- 合成音（S.tone，双方都听得到） ---------------- */
  const T = {
    sob(S, v = .05) { for (let i = 0; i < 3; i++) { const t = i * .36; S.tone('sine', 640 - i * 40, 470 - i * 40, .3, v, t, 1600); S.tone('triangle', 320 - i * 20, 250, .22, v * .45, t + .04, 900); } },
    furin(S, v = .04) { S.tone('sine', 2637, 2630, 1.3, v, 0); S.tone('sine', 3951, 3940, .9, v * .5, .01); S.tone('sine', 5274, 5260, .5, v * .25, .02); },
    hyoshigi(S, n = 2) { for (let i = 0; i < n; i++) { const t = i * .34; S.tone('square', 2600, 1700, .035, .1, t, 3400); S.tone('triangle', 1250, 1050, .07, .14, t, 2600); } },
    shaku(S, v = .05) {   // 尺八：都节音阶上的四个长音，音头略往上滑
      const N = [293.7, 311.1, 392, 440, 466.2, 587.3], ph = [[3, 1.1], [2, .7], [4, .5], [3, 1.6]]; let t = 0;
      for (const [n, d] of ph) { const f = N[n]; S.tone('sine', f * .97, f, d, v, t, 1800); S.tone('triangle', f * 2, f * 2.01, d * .9, v * .16, t + .03, 2400); t += d + .08; }
    },
    spark(S) { S.tone('square', 3600, 1400, .035, .07, 0, 5000); S.tone('sawtooth', 5200, 2600, .02, .04, .01, 7000); },
    blank(S) { S.tone('sine', 72, 54, 2.2, .16, 0, 500); S.tone('sawtooth', 900, 2200, 1.4, .018, .1, 1800); S.tone('sine', 1800, 1790, 1.8, .02, .3); },
    puff(S) { for (let i = 0; i < 6; i++) S.tone('sawtooth', 300 - i * 30, 120, .08, .03, i * .04, 600); },   // 灯被风吹灭
    leaf(S) { S.tone('triangle', 1400, 700, .25, .03, 0, 2200); S.tone('sine', 900, 500, .3, .02, .12, 1600); },
    squeal(S) { S.tone('sine', 1500, 2600, .12, .05, 0, 4000); S.tone('sine', 2600, 1800, .1, .04, .12, 4000); }   // 貉「吱」的一声
  };

  /* ---------------- 人物 ---------------- */
  const HAIR = '#1a1214';
  function meX(d, G, R) { R(6, G.hT - 2, 4, 2, HAIR); if (d === 1) R(8, G.hT - 2, 3, 2, HAIR); }   // 学徒的小发髻
  function lanternX(d, G, R, lit) {   // 手里提着的小提灯
    const body = lit ? '#f4d27a' : '#cfc6b0', rib = lit ? '#d09a40' : '#9a9282', cap = '#2a1e16', y = G.tT + 3, x = d === 0 ? 12 : d === 3 ? 0 : 0;
    R(x + 1, y - 2, 1, 3, '#3a2a1c');
    R(x, y + 1, 4, 1, cap); R(x, y + 2, 4, 5, body); R(x, y + 7, 4, 1, cap); R(x, y + 4, 4, 1, rib);
    if (lit) { R(x + 1, y + 3, 1, 3, '#fff4c8'); R(x + 2, y + 5, 1, 1, '#c03a2a'); }
  }
  const MEB = { skin: '#f0c8a0', hair: HAIR, hs: 'short', top: '#34466a', top2: '#d8d0b8', bottom: '#2c3a58', apron: '#23283a', shoes: '#b8a478' };
  const ME = Object.assign({}, MEB, { key: 'n8-me', extra(g, d, fr, G, R) { meX(d, G, R); } });
  const MEL = Object.assign({}, MEB, { key: 'n8-me-l', extra(g, d, fr, G, R) { meX(d, G, R); lanternX(d, G, R, true); } });
  const MED = Object.assign({}, MEB, { key: 'n8-me-d', extra(g, d, fr, G, R) { meX(d, G, R); lanternX(d, G, R, false); } });

  /* 河边的女人：岛田髻、绛紫的和服、金色的腰带 */
  const ONB = { skin: '#f4e6dc', hair: '#100a0e', hs: 'bun', top: '#5a2238', top2: '#efe2c8', robe: true, bottom: '#5a2238', shoes: '#e8e0d0' };
  function shimada(d, G, R) {
    const h = '#100a0e'; R(4, G.hT - 2, 8, 2, h); R(5, G.hT - 3, 6, 1, h); R(5, G.hT - 2, 6, 1, '#c8a040');
    R(4, G.tT + 4, 8, 2, '#b88a3a'); if (d === 3) R(6, G.tT + 2, 4, 4, '#b88a3a');
  }
  const ONNA = Object.assign({}, ONB, { key: 'n8-onna', extra(g, d, fr, G, R) { shimada(d, G, R); } });
  const ONNAC = Object.assign({}, ONB, { key: 'n8-onna-c', extra(g, d, fr, G, R) {   // 用袖子遮着脸
    shimada(d, G, R); if (d === 0) { R(3, G.hT + 3, 8, 6, ONB.top); R(3, G.hT + 3, 8, 1, '#7a3a50'); R(9, G.hT + 3, 2, 2, ONB.skin); } else if (d === 1) R(2, G.hT + 3, 6, 6, ONB.top);
  } });
  const ONNANF = Object.assign({}, ONB, { key: 'n8-onna-nf', eye: ONB.skin, extra(g, d, fr, G, R) { shimada(d, G, R); if (d === 0) R(9, G.hT + 1, 1, 2, '#ffffff'); else if (d === 1) R(6, G.hT + 1, 1, 2, '#ffffff'); } });

  /* 卖荞麦面的老头：白头巾 */
  function hachi(d, G, R) { const c = '#e8e4d8'; if (d === 1) { R(5, G.hT + 2, 6, 1, c); R(10, G.hT + 1, 2, 2, c); } else { R(4, G.hT + 2, 8, 1, c); if (d === 3) R(7, G.hT + 1, 2, 2, c); } }
  const SOBB = { skin: '#d6b08a', hair: '#4a423c', hs: 'short', top: '#4a3826', top2: '#c8b890', bottom: '#3a2e22', apron: '#2a3040', shoes: '#6a5a40' };
  const SOBA = Object.assign({}, SOBB, { key: 'n8-soba', extra(g, d, fr, G, R) { hachi(d, G, R); } });
  const SOBANF = Object.assign({}, SOBB, { key: 'n8-soba-nf', eye: SOBB.skin, extra(g, d, fr, G, R) { hachi(d, G, R); if (d === 0) R(9, G.hT + 3, 1, 2, '#ffffff'); } });

  /* 坂上的四个人 */
  const FB = {
    kusuri: { skin: '#e2b894', hair: '#2a2420', hs: 'short', top: '#2a3450', top2: '#c8c0a8', bottom: '#2a3450', shoes: '#8a7a5a', hat: 'straw', hatC: '#b8984a' },
    kago: { skin: '#d8a880', hair: '#1a1414', hs: 'messy', top: '#9a7040', top2: '#e8dcc0', bottom: '#4a4038', shoes: '#c8b890' },
    komuso: { skin: '#e0c0a0', hair: '#1a1414', hs: 'bald', top: '#2e2c30', top2: '#d8d0c0', robe: true, bottom: '#2e2c30', shoes: '#c8c0b0' },
    kozo: { skin: '#f0c8a8', hair: '#2a2020', hs: 'bald', top: '#56687a', top2: '#d8d0c0', bottom: '#56687a', apron: '#2a3040', shoes: '#b8a478', child: true }
  };
  const FX = {
    kusuri(d, G, R) {   // 背上的药箱（柳条箱 + 绿包袱）
      const bx = '#6a5236', st = '#3a6a4a';
      if (d === 3) { R(3, G.tT - 1, 10, 9, bx); R(3, G.tT + 2, 10, 1, st); R(3, G.tT - 1, 10, 1, shade(bx, .2)); }
      else if (d === 1) R(10, G.tT - 1, 5, 9, bx), R(10, G.tT + 2, 5, 1, st);
      else { R(4, G.tT, 1, 6, st); R(11, G.tT, 1, 6, st); }
    },
    kago(d, G, R) { hachi(d, G, R); if (d === 0) R(6, G.tT + 3, 4, 3, '#e8dcc0'); },
    komuso(d, G, R, nf) {   // 天盖（深斗笠）+ 尺八；nf：斗笠摘下来拿在手里
      const b = '#9a8050', l = '#7a6438';
      if (!nf) { R(3, G.hT - 3, 10, 10, b); for (let i = 0; i < 5; i++) R(3, G.hT - 2 + i * 2, 10, 1, l); if (d === 0) R(6, G.hT + 4, 4, 1, '#3a2c18'); }
      else if (d === 0) { R(12, G.tT + 1, 4, 6, b); R(12, G.tT + 3, 4, 1, l); }
      if (d === 0) { R(4, G.tT, 2, 7, '#8a7a5a'); R(8, G.tT + 2, 1, 9, '#c8b070'); }
      else if (d === 1) R(3, G.tT + 2, 1, 8, '#c8b070');
    },
    kozo(d, G, R, nf, lit) { lanternX(d, G, R, !!lit); }
  };
  function fig(k, nf, lit) {
    const b = FB[k];
    return Object.assign({}, b, { key: 'n8-' + k + (nf ? '-nf' : '') + (lit ? '-l' : ''), eye: nf ? b.skin : undefined,
      extra(g, d, fr, G, R) { FX[k](d, G, R, nf, lit); if (nf && d === 0) R(9, G.hT + 1, 1, 2, '#ffffff'); } });
  }
  const PEOPLE8 = {
    me: ME, meL: MEL, meD: MED, onna: ONNA, onnaC: ONNAC, onnaNF: ONNANF, soba: SOBA, sobaNF: SOBANF,
    genroku: { key: 'n8-gen', skin: '#d8b090', hair: '#9a9690', hs: 'short', top: '#5a4a34', top2: '#c8b890', bottom: '#3a3428', shoes: '#6a5a40',
      extra(g, d, fr, G, R) { if (d === 0) { R(4, G.tT + 2, 8, 1, '#2a2420'); R(6, G.tT + 4, 4, 2, '#e8dcc0'); } } },
    isha: { skin: '#e2c0a0', hair: '#c8c4c0', hs: 'bun', top: '#3a3a3a', top2: '#c8c0b0', robe: true, bottom: '#3a3a3a', shoes: '#c8c0b0' }
  };
  for (const k of FIG) { PEOPLE8[k] = fig(k); PEOPLE8[k + 'NF'] = fig(k, true); }
  PEOPLE8.kozoL = fig('kozo', false, true);

  /* ---------------- 惊吓大头像（32×32） ---------------- */
  const FACES = {
    nop(R, a, t) {   // 河边的女人：手从额头往下一抹，抹过的地方什么都没有了
      const hair = '#0e080c', sk = '#f4e8de', sk2 = '#d8c8bc', kim = '#5a2238';
      R(9, 0, 14, 3, hair); R(6, 2, 20, 8, hair); R(7, 1, 3, 2, hair); R(22, 1, 3, 2, hair);
      R(8, 5, 16, 1, '#c8a040'); R(13, 0, 6, 1, '#3a2a30');
      R(4, 8, 4, 17, hair); R(24, 8, 4, 17, hair); R(5, 9, 1, 14, '#2a2026'); R(26, 9, 1, 14, '#2a2026');
      R(10, 8, 12, 1, sk); R(9, 9, 14, 15, sk); R(8, 11, 1, 10, sk); R(23, 11, 1, 10, sk); R(10, 24, 12, 2, sk); R(12, 26, 8, 1, sk);
      R(21, 10, 2, 14, sk2); R(19, 24, 3, 2, sk2);
      R(12, 11, 3, 1, '#ffffff'); R(11, 12, 1, 3, '#fbf6f0');   // 蛋壳一样的高光
      const hy = Math.round(6 + Math.min(1, a * 1.3) * 24);
      if (hy < 14) { R(11, 15, 3, 2, '#1a1012'); R(18, 15, 3, 2, '#1a1012'); R(12, 15, 1, 1, '#fff'); R(19, 15, 1, 1, '#fff'); R(11, 14, 3, 1, '#3a2a2c'); R(18, 14, 3, 1, '#3a2a2c'); }
      if (hy < 18) R(15, 18, 2, 2, sk2);
      if (hy < 21) { R(13, 22, 6, 1, '#8a2a30'); R(14, 23, 4, 1, '#6a1a20'); }
      if (a < .97) {   // 抹脸的手和袖口
        R(8, hy, 17, 4, '#ecd8cc'); for (let i = 0; i < 4; i++) R(9 + i * 4, hy - 1, 3, 1, '#ecd8cc'); R(8, hy + 3, 17, 1, '#c8b0a4');
        R(24, hy - 1, 8, 8, kim); R(24, hy - 1, 1, 8, '#7a3a50');   // 袖口从右边伸进来，不挡住还没抹掉的五官
      }
      R(5, 27, 22, 5, kim); R(12, 27, 8, 2, '#efe2c8'); R(14, 29, 4, 3, kim);
    },
    soba(R, a, t) {   // 卖面的老头：「是不是这样的脸？」——一只大鸡蛋，底下映着灯笼的光，光慢慢灭掉
      const sk = '#f2ece2', sk2 = '#d6ccbe';
      R(8, 2, 16, 4, '#4a423c');
      R(6, 5, 20, 2, '#e8e4d8'); R(24, 3, 3, 3, '#e8e4d8'); R(26, 2, 2, 2, '#d8d4c8');
      R(10, 7, 12, 1, sk); R(8, 8, 16, 3, sk); R(7, 11, 18, 12, sk); R(8, 23, 16, 3, sk); R(10, 26, 12, 2, sk); R(12, 28, 8, 1, sk);
      R(22, 10, 3, 14, sk2); R(19, 25, 4, 2, sk2);
      R(10, 10, 4, 2, '#ffffff'); R(9, 12, 2, 3, '#ffffff');
      if (a < .8) { const k = (1 - a / .8); R(7, 19, 18, 9, `rgba(255,160,70,${(.45 * k).toFixed(2)})`); R(3, 29, 26, 3, `rgba(255,170,80,${(.6 * k).toFixed(2)})`); }
      const hy = 12 + Math.round(Math.min(1, a * 1.4) * 10);   // 抹过脸的手，停在下巴上
      R(23, hy, 6, 6, '#d6b08a'); R(22, hy + 1, 1, 4, '#d6b08a'); R(23, hy + 6, 6, 4, '#4a3826');
      R(3, 29, 26, 3, '#4a3826'); R(12, 29, 8, 3, '#c8b890');
    },
    self(R, a, t) {   // 你自己的脸：摸上去，光溜溜的
      const sk = '#f0c8a0', sk2 = '#d8ae88';
      R(9, 3, 14, 5, HAIR); R(13, 0, 6, 3, HAIR); R(8, 6, 2, 6, HAIR); R(22, 6, 2, 6, HAIR);
      R(10, 7, 12, 1, sk); R(9, 8, 14, 15, sk); R(10, 23, 12, 2, sk); R(12, 25, 8, 1, sk); R(20, 8, 3, 15, sk2);
      R(11, 10, 3, 1, '#fff6ea'); R(11, 11, 1, 2, '#fff6ea');
      const s = Math.round(Math.sin(t * 40) * .8), up = Math.round(Math.min(1, a * 1.5) * 4);   // 两只发抖的手摸上脸颊
      R(3 + s, 18 - up, 6, 11, '#e8bc94'); R(23 - s, 18 - up, 6, 11, '#e8bc94');
      for (let i = 0; i < 3; i++) { R(5 + s + i * 2, 17 - up, 1, 2, '#e8bc94'); R(24 - s + i * 2, 17 - up, 1, 2, '#e8bc94'); }
      R(4, 27, 24, 5, '#34466a'); R(13, 27, 6, 3, '#d8d0b8');
    }
  };

  /* ---------------- 道具精灵 ---------------- */
  const SPR8 = {
    banya(g, e, t, R) {   // 辻番所（w=2）
      R(-1, -16, 34, 5, '#2e2a2a'); R(0, -17, 32, 1, '#4a4444'); R(-2, -12, 36, 1, '#1e1a1a');
      box(R, 1, -11, 30, 25, '#5a4430');
      R(3, -7, 12, 9, '#f2cc7a'); R(9, -7, 1, 9, '#5a4430'); R(3, -3, 12, 1, '#5a4430'); R(4, -6, 2, 2, '#fff2c8');
      R(18, -7, 11, 21, '#3a2a1c'); R(19, -6, 9, 1, '#4a3a2a');
      R(20, -15, 7, 3, '#e8e0c8'); R(21, -14, 5, 1, '#3a3030');
      R(1, 12, 30, 2, '#3a2c1e');
    },
    hibachi(g, e, t, R) {   // 火盆
      R(3, 6, 10, 8, '#4a3a30'); R(3, 6, 10, 1, '#6a5a4a'); R(2, 13, 12, 1, '#2a201a');
      const f = Math.sin(t * 9) > 0;
      R(4, 4, 8, 2, '#c83a10'); R(5, 3, 2, 1, f ? '#ffb040' : '#e06020'); R(9, 3, 2, 1, f ? '#e06020' : '#ffb040'); R(6, 5, 3, 1, '#ffd070');
      if (Math.sin(t * 5 + 1) > .7) R(7 + Math.round(Math.sin(t * 3) * 2), 0, 1, 1, '#ffc060');
      R(12, -2, 1, 9, '#5a5a5a'); R(13, -2, 1, 9, '#4a4a4a');   // 火筷子
    },
    kosatsu(g, e, t, R) {   // 高札
      R(2, -6, 2, 20, '#4a3826'); R(12, -6, 2, 20, '#4a3826');
      R(-1, -18, 18, 3, '#2e2a2a'); R(0, -19, 16, 1, '#4a4444');
      R(0, -15, 16, 11, '#d8ccaa'); for (let i = 0; i < 5; i++) R(2 + i * 3, -13, 1, 7, '#3a3430'); R(1, -15, 14, 1, '#b8ac8a');
    },
    kawaraban(g, e, t, R) {   // 柱子上贴着的瓦版
      R(7, -14, 2, 28, '#5a4a3a'); R(6, 12, 4, 2, '#3a2e22');
      R(2, -12, 12, 11, '#e8dcb8'); R(2, -12, 12, 1, '#c8bc98');
      R(4, -10, 4, 5, '#f8f2e4'); R(4, -10, 4, 1, '#3a3030');
      R(9, -10, 1, 7, '#3a3430'); R(11, -10, 1, 6, '#3a3430'); R(4, -4, 4, 1, '#a03030');
      R(12 + Math.round(Math.sin(t * 2 + 1)), -2, 2, 2, '#e8dcb8');
    },
    willow(g, e, t, R) {   // 护城河边的柳树
      R(6, -10, 4, 24, '#3a2e24'); R(7, -10, 1, 24, '#4a3c30');
      const sw = Math.sin(t * 1.2 + e.px * .1) * 1.4;
      R(-6, -24, 28, 8, '#2c3a26'); R(-4, -26, 24, 3, '#34442c');
      for (let i = 0; i < 9; i++) { const x = -5 + i * 3, l = 14 + (i * 7) % 9; R(x + Math.round(sw * (l / 20)), -18, 1, l, i % 2 ? '#3a4c30' : '#2a3824'); }
    },
    jizo(g, e, t, R) {   // 路边的小地藏；ema：旁边挂着绘马
      R(2, 12, 12, 2, '#5a5854');
      R(4, 3, 8, 10, '#8a8a84'); R(5, -2, 6, 6, '#9a9a94'); R(6, 0, 1, 1, '#5a5a56'); R(9, 0, 1, 1, '#5a5a56');
      R(4, 4, 8, 3, '#b03030'); R(5, 7, 6, 1, '#902020'); R(6, 11, 4, 2, '#e8e0c8');
      if (e.ema) { R(13, -6, 2, 20, '#4a3420'); R(12, -7, 8, 1, '#3a2818'); for (let i = 0; i < 3; i++) { R(13 + (i % 2) * 3, -5 + i * 4, 4, 3, '#d8c49a'); R(14 + (i % 2) * 3, -4 + i * 4, 2, 1, i === 1 ? '#a02020' : '#3a3430'); } }
    },
    mon(g, e, t, R) {   // 关着的大门（墙面，w=3）
      R(0, -6, 48, 20, '#2a2420'); R(0, -8, 48, 3, '#1e1a18');
      R(3, -4, 20, 18, '#4a3624'); R(25, -4, 20, 18, '#4a3624'); R(23, -4, 2, 18, '#1a1410');
      for (let y = -2; y < 12; y += 4) for (let x = 6; x < 44; x += 6) if (x < 22 || x > 26) R(x, y, 1, 1, '#8a8070');
      R(19, 4, 2, 2, '#9a8a6a'); R(27, 4, 2, 2, '#9a8a6a');
    },
    wana(g, e, t, R) {   // 芦苇里的绳套和挣扎的小貉；free：空了
      R(2, 9, 12, 4, 'rgba(30,40,24,.6)');
      R(7, 1, 1, 11, '#6a5a3a'); R(6, 1, 3, 1, '#6a5a3a');
      if (e.free) { R(4, 11, 8, 1, '#a89870'); R(5, 10, 2, 1, '#a89870'); return; }
      const s = Math.round(Math.sin(t * 7)), c = '#6a5a48', dk = '#2a2420';
      R(3 + s, 7, 9, 6, c); R(2 + s, 8, 1, 4, c); R(11 + s, 8, 3, 4, c);
      R(10 + s, 6, 4, 4, c); R(11 + s, 7, 3, 1, dk); R(12 + s, 7, 1, 1, '#ffe0a0'); R(13 + s, 9, 1, 1, dk); R(10 + s, 5, 1, 1, c); R(13 + s, 5, 1, 1, c);
      R(4 + s, 7, 6, 1, '#b8ac98'); R(1 + s, 9, 2, 2, dk);
      R(8, 10, 4, 1, '#a89870'); R(7, 9, 1, 2, '#a89870');
    },
    yatai(g, e, t, R) {   // 挑担的荞麦面摊（w=2）：方纸灯笼「二八そば」、风铃、锅；off：灯灭了
      const on = !e.off;
      R(1, -15, 30, 2, '#3a2c1e'); R(0, -16, 32, 1, '#5a4430');
      R(2, -13, 2, 27, '#5a4430'); R(28, -13, 2, 27, '#5a4430');
      box(R, 1, 2, 30, 12, '#6a5034'); R(2, 3, 28, 2, '#8a6a48');
      R(18, -2, 9, 4, '#3a3030'); R(19, -3, 7, 1, '#4a4040');
      if (on) for (let i = 0; i < 3; i++) { const y = -6 - ((t * 8 + i * 4) % 10); R(20 + i * 2 + Math.round(Math.sin(t * 2 + i)), y, 1, 2, 'rgba(230,230,220,.35)'); }
      R(4, -12, 1, 2, '#2a2020'); R(2, -10, 6, 8, on ? '#f6d68a' : '#6a6458'); R(2, -10, 6, 1, '#2a2020'); R(2, -3, 6, 1, '#2a2020');
      for (const y of [-9, -7, -5]) R(4, y, 2, 1, on ? '#b03020' : '#4a4038');
      const s = on ? Math.sin(t * 3) * 1.5 : 0; R(13, -13, 1, 2, '#888'); R(12, -11, 3, 2, 'rgba(180,220,240,.8)'); R(13 + Math.round(s), -9, 1, 3, '#e8e0c8');
      R(6, 6, 6, 3, '#2a2420'); R(7, 5, 4, 1, '#c8b890');
    },
    shadow(g, e, t, R) {
      /* 灯照出来的影子（贴地 decal）：方向背着光源。lx/ly 是固定光源（格）；没有就用玩家手里的提灯（离开 3.8 格就照不到）。
         ax：影子的主人在这个实体左边几格。tail：貉——影子腰后翘起一条往回卷的粗尾巴，头上两只圆耳朵 */
      const ax = (e.ax || 0) * TS, fx = e.px + ax + 8, fy = e.py + 14, fixed = e.lx != null;
      let lx, ly; if (fixed) { lx = e.lx * TS + 8; ly = e.ly * TS + 8; } else { lx = W.pl.px + 8; ly = W.pl.py + 10; }
      let dx = fx - lx, dy = fy - ly; const dist = Math.hypot(dx, dy) / TS;
      if (!fixed && dist > 3.8) return;
      if (dist < .2) { dx = 0; dy = 1; }
      const n = Math.hypot(dx, dy) || 1; dx /= n; dy /= n;
      const L = Math.round(fixed ? 13 : 8 + Math.min(6, dist * 2)), a = fixed || dist < 2.6 ? .72 : .5, col = `rgba(6,3,8,${a})`;   // 短一点、浓一点：别落到灯照不到的地方
      const P = (u, v, w, h) => R(ax + 8 + dx * u + px * v - w / 2, 14 + (dy * u + py * v) * .6 - h / 2, w, h, col);
      let px = -dy, py = dx; if (py > 0 || (Math.abs(py) < .3 && px < 0)) { px = -px; py = -py; }   // 尾巴朝画面上方翘，看得清
      for (let i = 0; i <= L; i++) P(i, 0, i < 3 || i > L - 5 ? 5 : 3, 2);
      if (e.tail) {
        const b = L * .35;
        for (let j = 1; j <= 9; j++) P(b - j * j * .04, j * 1.6, j > 6 ? 6 : j > 3 ? 4 : 3, j > 6 ? 6 : j > 3 ? 4 : 3);
        P(L, 3, 2, 3); P(L, -3, 2, 3);
      }
    },
    kagop(g, e, t, R) {   // 空轿子
      R(-6, -5, 28, 2, '#6a5030'); R(-6, -5, 28, 1, '#8a6a48');
      box(R, 1, -3, 14, 15, '#7a5a38'); R(3, -1, 10, 8, '#c8b078'); for (let i = 0; i < 5; i++) R(3, i * 2 - 1, 10, 1, '#a8905a');
      R(2, 12, 12, 2, '#3a2c1e');
    },
    michi(g, e, t, R) {   // 石头道标
      R(4, 12, 8, 2, '#4a4844'); R(5, -10, 6, 23, '#8a8880'); R(5, -10, 6, 1, '#a8a69e'); R(10, -9, 1, 22, '#6a6862');
      for (let i = 0; i < 4; i++) R(7, -7 + i * 4, 2, 2, '#4a4844');
    },
    eave(g, e, t, R) {   // 白墙顶上的瓦檐
      R(0, -5, 16, 5, '#2a2a32'); R(0, -5, 16, 1, '#4a4a54'); for (let x = (e.px / TS % 2) * 4; x < 16; x += 8) R(x, -4, 1, 4, '#1a1a20');
      R(0, 0, 16, 1, 'rgba(0,0,0,.35)');
    },
    leaf(g, e, t, R) { R(6, 9, 4, 2, '#7a8a3a'); R(5, 10, 1, 1, '#6a7a30'); R(10, 9, 1, 1, '#6a7a30'); R(7, 10, 3, 1, '#5a6a28'); },
    ishamon(g, e, t, R) {   // 大夫家的门（墙面，w=2）：「本道」招牌
      R(0, -6, 32, 20, '#3a2c20'); R(-1, -8, 34, 3, '#2a2420');
      R(4, -2, 11, 16, '#5a4430'); R(17, -2, 11, 16, '#5a4430'); R(15, -2, 2, 16, '#2a1e16');
      for (let y = 0; y < 14; y += 3) { R(4, y, 11, 1, '#4a3626'); R(17, y, 11, 1, '#4a3626'); }
      R(9, -14, 14, 7, '#e8e0c8'); R(9, -14, 14, 1, '#3a2c20'); R(12, -12, 2, 4, '#2a2420'); R(17, -12, 2, 4, '#2a2420');
      R(28, -4, 4, 6, e.lit ? '#f4d27a' : '#8a8470'); R(29, -5, 2, 1, '#2a2020');
    },
    kido(g, e, t, R) {   // 四谷大木户（墙面）
      R(0, -6, 16, 20, '#2a2420'); R(2, -4, 12, 18, '#4a3624'); R(7, -4, 2, 18, '#2a1e16'); R(-1, -8, 18, 3, '#1e1a18');
      R(3, 2, 4, 2, '#8a8070'); R(9, 2, 4, 2, '#8a8070');
    },
    amado(g, e, t, R) { R(0, 0, 16, 14, '#4a3a2a'); for (let x = 1; x < 16; x += 3) R(x, 0, 1, 14, '#3a2c20'); R(0, -4, 16, 4, '#2a2420'); R(2, -3, 12, 2, e.col || '#5a2a2a'); },
    tanu(g, e, t, R) {   // 树篱底下的一双小眼睛
      const b = Math.sin(t * 1.7) > .92; if (b) return;
      R(5, 9, 2, 1, '#ffe08a'); R(9, 9, 2, 1, '#ffe08a'); R(6, 9, 1, 1, '#fff6c8'); R(10, 9, 1, 1, '#fff6c8');
    }
  };

  /* ---------------- 坂上四个人的台词（真人和貉开场一样，只有破绽不同） ---------------- */
  const HI = {
    kusuri: ['……哟，这么晚了，小哥也走这条坂？', '我是越中来的卖药郎。灯笼让风吹灭了，正在这儿歇脚。'],
    kago: ['……谁？哦，是个小伙计啊。', '我那搭档跑了，说这坂上有东西。剩我一个，抬不动这顶空轿子。'],
    komuso: ['……', '（深深的斗笠底下，传出一个很低的声音。）贫僧云游至此。'],
    kozo: ['……灯、灯笼让风吹灭了……', '我是四谷伊势屋的小伙计，跟掌柜的走散了……我不敢动……']
  };
  const PROMPT = {
    kusuri: '背着药箱的卖药郎，斗笠压得低低的。',
    kago: '扎着头巾的轿夫，靠着一顶空轿子，搓着手。',
    komuso: '头上扣着深深的天盖斗笠、手持尺八的虚无僧。看不见脸。',
    kozo: '跟你差不多年纪的小伙计，攥着一盏灭了的提灯，冻得直哆嗦。'
  };
  const VOICE_OK = {
    kusuri: 'もしもし？——哎，在呢，在呢。小哥有事？',
    kago: 'もしもし！……吓我一跳。叫这么大声干嘛？',
    komuso: '……もしもし。施主，有何事。',
    kozo: 'も、もしもし……是、是掌柜的吗？……不是啊。'
  };
  const HAND = {
    kusuri: '他伸出手给你看。指节粗大，指甲缝里嵌着黄黄的药粉，一股苦味。\n……是一双走过很多路的手。',
    kago: '他搓着手，往手心哈气。掌心一层厚厚的老茧，指根磨得发亮。',
    komuso: '他握着尺八的手指修长，左手拇指和食指上，磨出了按孔的硬茧。',
    kozo: '他的小手冻得通红，手背上裂了好几道口子，死死攥着灯柄。\n……跟你自己的手一模一样。'
  };
  const HANDF = {
    kusuri: '他伸出手给你看。指甲缝里嵌着黄黄的药粉——\n可手背上，长着一层灰褐色的短毛。指甲又黑又厚。',
    kago: '他搓着手，往手心哈气。掌心是一层老茧——\n手背上，却长着一层灰褐色的短毛，指甲又黑又厚。',
    komuso: '他握着尺八的手指修长——\n可那手背上，长着一层灰褐色的短毛，指甲又黑又厚。',
    kozo: '他的小手冻得通红，死死攥着灯柄——\n可手背上，长着一层灰褐色的短毛，指甲又黑又厚。'
  };
  const DENY = {   // 指认错了：真人和没被说中马脚的貉，反应一模一样
    kusuri: ['……啊？貉？', '小哥，你吓糊涂了吧。我走了二十年街，还是头一回被人当成貉。'],
    kago: ['貉？我？', '……你这小子，眼睛长哪儿去了。'],
    komuso: ['……', '施主心乱了。贫僧不怪你。'],
    kozo: ['我、我不是！', '呜……我不是貉……']
  };
  const LEAVE = {
    kusuri: ['够了！', '好心陪你在这儿站着，你倒一口一个貉——你自己走吧！'],
    kago: ['行，行！你嫌我是貉，我还嫌你晦气！', '这破轿子我也不要了！'],
    komuso: ['……施主既不信贫僧，贫僧也不必留在此处。'],
    kozo: ['……你也欺负我！', '我、我自己走！']
  };
  const UNMASK = {
    kusuri: '卖药郎的脸，像被水抹过的沙子一样，一下子平了。\n斗笠底下，什么都没有。',
    kago: '轿夫的脸，一下子平了，像一只剥了壳的蛋。\n他缩成一团，往轿子底下一钻——',
    komuso: '他慢慢摘下了天盖斗笠。\n斗笠底下，是一张光溜溜的脸。',
    kozo: '小伙计的脸，一下子平了。\n他扔下提灯，四脚着地，往黑暗里一窜——'
  };
  const HELP = {
    kusuri: ['……四谷？巧了，我今晚就住四谷的客栈。', '来，借你的火点上我的灯笼。两个人，两盏灯——那些东西就不敢近身了。'],
    kago: ['请大夫？那可巧了！', '这顶空轿子，正好拿去抬大夫！走，我在前头开路！'],
    komuso: ['……', '贫僧送你一程。'],
    kozo: ['……你也要去四谷？', '我认得路！伊势屋就在四谷大木户边上！只要灯亮着，我就认得！']
  };
  const BYE = {
    kusuri: ['到了。挂着「本道」招牌的，就是大夫家。', '这包是越中的退烧药，给你家小姐。……钱？下回再说吧。'],
    kago: ['就是这家。你去敲门。', '我在门口候着——大夫一出来，我抬上他就跑，比你两条腿快多了！'],
    komuso: ['贫僧就此别过。', '……愿令爱平安。'],
    kozo: ['大夫家就在那儿！我得回店里了，掌柜的该急死了。', '……谢谢你的灯！']
  };

  /* ---------------- 小工具 ---------------- */
  function noteCount() {
    try { const got = store.get('notes', []), ks = Object.keys(W.ch.notes); return '（本章笔记：' + ks.filter(k => got.includes(W.ch.id + ':' + k)).length + ' / ' + ks.length + '）'; } catch (e) { return ''; }
  }
  const tx = e => Math.round(e.px / TS), ty = e => Math.round(e.py / TS);
  function figGoal(S) {   // 短一点：iPad 竖屏右上角也放得下
    const live = FIG.filter(k => !S.f.gone[k]), n = live.length;
    if (n === 1) return '只剩' + NAME[live[0]] + '了——向他求助';
    return '坂上 ' + n + ' 人里只有 1 个真人：查影子、手、声音，向他求助';
  }
  const KW = { tail: '影子', hand: '手', voice: '声音' };
  function known(S, k) {   // 菜单题头的小结：你已经查过的
    const c = S.f.chk || {}, fl = S.f.flaw[k], l = [];
    if (c[k + '_tail']) l.push(fl === 'tail' ? '影子——拖着尾巴！' : '影子——正常');
    if (c[k + '_hand']) l.push(fl === 'hand' ? '手——长着毛！' : '手——正常');
    if (c[k + '_voice']) l.push(fl === 'voice' ? '声音——只说一声「もし」！' : '声音——「もしもし」两声');
    return l.length ? '\n（你查过：' + l.join('；') + '）' : '';
  }
  function hintText(S, n) {
    const live = FIG.filter(z => !S.f.gone[z]), muj = live.filter(z => z !== S.f.real);
    if (n <= 1) return '（影子、手、声音。三只貉，三处马脚，各不相同。\n先举着灯一个一个走近，看看他们的影子。）';
    if (n === 2) {
      const tl = muj.find(z => S.f.flaw[z] === 'tail');
      if (tl) return '（……' + NAME[tl] + '的影子，好像不太对劲。走近了再看看。）';
      return '（拖尾巴的那只已经走了。剩下的貉，' + muj.map(z => S.f.flaw[z] === 'hand' ? '一只藏不住手' : '一只学不会「もしもし」').join('，') + '。）';
    }
    if (n === 3 && muj.length) return '（' + muj.map(z => NAME[z] + '——' + FLAWT[S.f.flaw[z]]).join('；\n') + '。）';
    return '（……是' + NAME[S.f.real] + '。只有他，影子、手、声音，样样都对得上。）';
  }

  /* ---------------- 坂下：番太源六 ---------------- */
  async function genTalk(S) {
    S.face('genroku', 'pl');
    if (!S.f.metGen) {
      S.bubble('genroku', '!', 900);
      await S.say('番太', '谁？——站住。这么晚了，往哪儿去？');
      await S.say('你', '京桥丸屋的伙计，清吉。小姐烧得厉害，我去四谷请大夫。');
      await S.say('番太', '走纪伊国坂？……你先说一声「もしもし」，我听听。');
      for (;;) {
        const r = await S.ask('「说呀。」', ['「もし。」', '「もしもし。」', '「喂——！」'], '番太');
        if (r === 1) break;
        S.shake(200, 1);
        await S.say('番太', r === 0 ? '（一把抄起火筷子）——再说一遍！一声不够！' : '我让你说「もしもし」！');
      }
      S.f.metGen = true;
      await S.say('番太', ['……嗯，是人。狐狸也好，貉也好，学人说话，「もし」只会说一声。', '那条坂上有貉。哭哭啼啼的姑娘、卖面的，它什么都变——样样都像，就是没有脸。', '入冬以来有人在濠边下套抓貉，坂上就闹得更凶了。']);
      await S.say('番太', '提灯借你，火打袋也拿着。到火盆上点着——灯千万别灭。');
      S.give('chochin'); S.give('hiuchi');
      if (!S.f.cub) await S.say('番太', '……芦苇里那个绳套，下午套住个东西，叫了一下午。我可不敢碰。');
      return S.goal('把提灯拿到火盆上点着');
    }
    if (!S.f.lit) return S.say('番太', '提灯拿到火盆上点着。');
    const L = ['灯千万别灭了。', '路上碰见什么人，先叫一声「もしもし」。', '看穿了，就照直说出它的马脚——它就待不住。', '……小姐会好的。快去吧。'];
    await S.say('番太', L[(S.f._gl = ((S.f._gl ?? -1) + 1) % L.length)]);
  }
  async function lightLantern(S) {
    if (S.f.lit) return S.narr('火盆里的炭烧得通红。你把冻僵的手凑过去烤了烤。');
    if (!S.has('chochin')) return S.narr('火盆里的炭烧得通红。番太的火筷子斜插在灰里。');
    S.f.lit = true; S.sfx('match'); S.wear('@meL'); S.plr(3.2);
    await S.narr('你从火盆里夹起一块炭，引着了提灯里的蜡烛。\n纸灯笼「呼」地亮了，上面写着「赤坂　辻番」四个字。');
    S.face('genroku', 'pl');
    await S.say('番太', '等等。你瞧——');
    S.focus(9, 3);
    await S.narr('火盆的光照着番太。他的影子背着火光，长长地拖在地上。');
    await S.say('番太', ['灯底下的人，影子都背着灯。貉变的，影子屁股后头拖着一条尾巴。', '还有手，还有声音——我说，你记下来。路上心慌了，拿出来看。']);
    S.focus(null);
    await S.note('kuden');
    S.goal('上纪伊国坂（往右走）——去四谷请大夫');
  }
  async function wanaOn(S) {
    if (S.f.cub) return S.narr('绳套空了。芦苇丛里留下几个小小的爪印，一直通到柳树底下。');
    await S.narr('芦苇里，一只灰褐色的小东西被绳套勒住了后腿。\n眼睛周围一圈黑，像戴着面罩。它一见光，拼命往后挣，「吱吱」直叫。');
    T.squeal(S);
    await S.think('……貉崽子？番太说的就是它吧。');
    const r = await S.ask('', ['（解开绳套，放了它）', '（不管它）']);
    if (r) return S.think('……天这么冷，它挨得过今晚吗。');
    S.f.cub = true; S.ent('wana').s.free = true; S.sfx('item');
    await S.narr('你蹲下去，摸索着解开了绳结。小东西一瘸一拐地退了两步，没跑。');
    if (S.has('onigiri') && !(await S.ask('它盯着你怀里。', ['（把饭团掰一半给它）', '（不给）']))) {
      S.take('onigiri'); S.f.cubFed = true;
      await S.narr('它叼起饭团，回头看了你一眼。\n——然后一头钻进了芦苇里。');
    } else await S.narr('它回头看了你一眼。\n——然后一头钻进了芦苇里。');
  }

  /* ---------------- 坂道：河边的女人 ---------------- */
  async function meetWoman(S) {
    if (S.f.phase) return;
    S.f.phase = 'meet';
    S.face('pl', 'onna'); S.amb('none');
    await S.narr('一个年轻女人蹲在护城河边，背对着你，把脸埋在袖子里哭。\n衣裳是上好的料子，头发梳成良家姑娘的岛田髻。');
    await S.say('你', '……姑娘？这么晚了，一个人在这儿……');
    T.sob(S, .05);
    await S.narr('她没有回头。哭声细细的，一抽一抽。');
    const r = await S.ask('', ['「别哭了。出什么事了？我能帮上忙吗？」', '（把手轻轻搭在她肩上）']);
    if (r === 0) { await S.say('你', '别哭了，姑娘。出什么事了？跟我说说——我能帮上忙的话……'); await S.narr('哭声顿了一下。\n像是在听。'); }
    else await S.narr('你把手轻轻搭在她肩上。冰凉的，像摸着一块河底的石头。\n她的肩头上，贴着一片湿漉漉的柳叶。');
    S.ent('onna').spr = '@onnaC'; S.ent('onna').oy = 0; S.face('onna', 'pl'); S.sfx('step');
    await S.narr('她慢慢站起来，转过身。\n一只袖子，还遮着脸。');
    await S.say('你', '姑娘，你……');
    await S.narr('她放下了袖子。\n用手掌从额头往下，慢慢地、慢慢地，抹了一把脸。');
    S.ent('onna').spr = '@onnaNF'; T.blank(S);
    await S.scare('face', { face: 'nop', dur: 1.6 });
    await S.narr('没有眼睛。没有鼻子。没有嘴。\n那张脸光溜溜的，像一只剥了壳的鸡蛋。');
    S.f.faces = 1; S.toast('（第一张脸）');
    T.puff(S); S.wear('@meD'); S.plr(1.9); S.dark(.88);
    await S.narr('一阵风从河面上卷过来——\n手里的提灯「噗」地灭了。');
    for (const id of ['yatai', 'soba', 'sh_soba']) S.show(id);
    S.focus(38, 4);
    await S.narr('黑漆漆的坂道尽头，远远地，亮着一点灯火。\n风里还飘来一声风铃。……是卖荞麦面的摊子。');
    S.focus(null);
    await S.think('跑！往那点灯火跑！');
    S.f.phase = 'chase'; S.f.grab = 0; S.f.blinks = 0;
    S.speed(.9); S.amb('wind');
    S.goal('逃！往坂上那点灯火跑');
    if (S.coop) S.toast('双人：观看的人点击画面，给同伴标出石堆中间的路');
    resetChase(1.4);
    S.cp('chase');
  }
  async function caught(S) {
    S.sfx('sting'); S.shake(300, 2);
    const p = S.pl, o = S.ent('onna');
    if (!S.f.grab) {
      S.f.grab = 1;
      let x = Math.max(12, p.x - 5), y = 4; while (x > 1 && !passable(curMap(), x, y, o)) x--;
      S.place('onna', x, y, 2); o.alpha = .4;
      S.chase('onna', { spd: SPD, catch: caught, wait: 1.6 });
      await S.narr('冰凉的手指一把攥住了你的袖子——\n你拼了命一挣，「嘶啦」，袖子撕开了一道口子。');
      await S.think('不能停！灯火就在前面！');
      return;
    }
    DIED.chase++;
    await S.scare('face', { face: 'nop', dur: 1.1 });
    await S.die('那张光溜溜的脸贴了上来。\n没有嘴，可你清清楚楚地听见她在耳边问：\n「……你刚才，不是说要帮我吗？」', '被她追上了');
  }
  async function endChase(S) {
    S.stop('onna'); await S.alpha('onna', 0, 500); S.speed(1);
    await S.narr('哭声……停了。\n你回头看了一眼。身后只有黑漆漆的坂道。');
    S.goal('去面摊那里（坂上的灯火）');
    if (S.coop) S.toast('双人：观看的人盯着灯下的影子，看见不对劲就点出来');
    S.cp('soba');
  }

  /* ---------------- 坂道：荞麦面摊 ---------------- */
  async function sobaShadow(S) {
    if (S.f.sobaDone) return S.narr('地上什么也没有。');
    if (S.f.sobaSeen) return sobaTalk(S);
    S.f.sobaSeen = true;
    await S.narr('灯笼挂在摊子左边，卖面的站在右边。\n地上他的影子朝右拖得长长的——');
    S.sfx('heart');
    await S.narr('影子的腰后面，还拖着一条又粗又短的东西。\n像一条尾巴。');
    await S.think('番太说过……灯底下，貉的影子拖着尾巴。');
  }
  async function sobaTalk(S) {
    if (S.f.sobaDone) return S.narr(S.f.relit ? '摊子不见了。地上只有一片湿漉漉的叶子。' : '黑。什么也看不见。');
    S.face('soba', 'pl');
    if (S.once('sobaHi')) {
      await S.narr('一副挑担的荞麦面摊。方纸灯笼上写着「二八そば」，风铃在檐下叮叮地响。\n锅里冒着热气。卖面的老头背对着你，正在切葱。');
      S.face('soba', 1);
      await S.say('卖面的', ['哎哟——客官，怎么了这是？', '跑得上气不接下气的……脸白得跟纸一样。']);
    }
    const opts = ['（把河边看见的告诉他）', '（先喘口气，什么也不说）'], keys = ['tell', 'quiet'];
    if (S.f.sobaSeen) { opts.push('「……老伯，你的影子。」'); keys.push('shadow'); }
    const k = keys[await S.ask('', opts)];
    if (k === 'quiet') {
      await S.say('卖面的', ['不说也行，不说也行。', '大冷天的，先来碗热荞麦面暖暖身子吧。今晚这碗，不收钱。']);
      const r = await S.ask('他把一碗热腾腾的面推到你面前。', ['（端起来吃）', '「不、不用了……」']);
      if (r === 0) return badSoba(S);
      await S.say('卖面的', '……不吃啊。那就算了。');
      return S.narr('他把碗收了回去，又低头切起了葱。\n灯笼底下，他的影子在地上晃了一晃。');
    }
    if (k === 'tell') {
      await S.say('你', ['老、老伯……河边……河边有个女人……', '她的脸……她的脸上，什么都……']);
      await S.say('卖面的', '哦？');
      await S.narr('老头放下菜刀，慢慢地转过身来。');
      S.face('soba', 'pl');
      await S.say('卖面的', '她给你看的——', { style: 'whisper' });
      return sobaReveal(S, true);
    }
    await S.say('你', '……老伯，你的影子。');
    await S.narr('老头切葱的手停了。');
    await S.say('卖面的', ['……嘿嘿。', '眼睛倒是挺尖。可惜啊——']);
    await S.narr('他慢慢地转过身来。');
    S.face('soba', 'pl');
    await S.say('卖面的', '你在河边看见的——', { style: 'whisper' });
    return sobaReveal(S, false);
  }
  async function sobaReveal(S, fooled) {
    await S.say('卖面的', '是不是，这样的脸？', { style: 'big' });
    S.ent('soba').spr = '@sobaNF'; T.blank(S);
    await S.scare('face', { face: 'soba', dur: 1.5 });
    if (fooled) { S.f.faces = 2; S.toast('（第二张脸）'); }
    S.ent('yatai').off = true; S.hide('sh_soba'); T.puff(S);
    S.amb('none'); S.dark(.97); S.plr(.7);
    await S.narr('灯笼灭了。');
    S.hide('soba');
    await S.narr('四下里一片漆黑。风铃不响了，锅里的热气也闻不到了。\n……什么都没有了。');
    S.f.sobaDone = true; S.f.phase = 'dark';
    if (!fooled) await S.think('……可我没上当。没把它当成人，没向它求救。\n绘马上写的：那样才算一回。');
    else await S.think('两张脸了……\n绘马上写着，它只骗三回。');
    await relight(S);
  }
  async function relight(S) {
    S.goal('用火打石把提灯点着');
    await S.think('火打石……番太给的火打袋！');
    const lines = ['火星一闪。\n一刹那间，你看见——面摊不见了。地上只有一片湿漉漉的叶子。', '又一闪。\n白墙底下，好像蹲着个什么。矮矮的，毛茸茸的。', '火口「嗤」地冒起一缕烟。你凑过去吹了吹，点着了提灯里那截蜡烛头。'];
    for (let i = 0; i < 3; i++) {
      await S.ask('黑暗里，你摸出火打石和火打金。', ['（敲）']);
      T.spark(S); S.fx('flash');
      if (i === 0) { S.hide('yatai'); S.show('leaf1'); }
      await S.narr(lines[i]);
    }
    S.wear('@meL'); S.plr(2.8); S.dark(.92); S.amb('wind'); S.f.relit = true;
    await S.narr('提灯又亮了。\n可蜡烛只剩下短短的一截……撑不了多久。');
    S.goal('继续往坂上走（往右，去四谷）');
  }
  async function badSoba(S) {
    DIED.soba++;
    await S.narr('你捧起碗。热气扑在脸上，面条滑溜溜的，汤又咸又鲜……\n你一口气吃了个精光。');
    await S.say('卖面的', '好吃吧？……再来一碗？', { style: 'whisper' });
    await S.narr('暖和。困。眼皮越来越沉……');
    await S.fade(1, 1200);
    S.amb('none'); await S.wait(700); T.furin(S, .03); await S.wait(1200);
    await S.end({ bad: true, id: 'soba', title: '一碗荞麦面', text: '天亮的时候，巡夜的番太在弁庆濠边上找到了清吉。\n他蹲在河边睡得正香，怀里抱着一只缺了口的破碗。\n碗里盛着一把湿漉漉的柳叶，和几条还在动的蚯蚓。\n\n那一夜，四谷的大夫没有等到来请他的人。' });
  }

  /* ---------------- 坂上：四个人 ---------------- */
  function setupFigs(S) {
    const real = FIG[S.rand(4)], fl = ['tail', 'hand', 'voice'], muj = FIG.filter(k => k !== real);
    for (let i = fl.length - 1; i > 0; i--) { const j = S.rand(i + 1); [fl[i], fl[j]] = [fl[j], fl[i]]; }
    S.f.real = real; S.f.flaw = {}; muj.forEach((k, i) => { S.f.flaw[k] = fl[i]; });
    S.f.gone = {}; S.f.chk = {}; S.f.wrong = 0; S.f.helped = false; S.f.acts = 0; S.f.hintN = 0; S.f.candleWarn = false;
    for (const k of FIG) {
      const [x, y, d] = FPOS[k], e = S.ent('f_' + k);
      S.stop('f_' + k); S.follow('f_' + k, false); e.solid = true; e.spr = '@' + k; e.alpha = 1; S.place('f_' + k, x, y, d);
      S.place('sh_' + k, x, y); S.ent('sh_' + k).s.tail = S.f.flaw[k] === 'tail'; S.hide('lf_' + k);
    }
    S.ent('kagop').alpha = 1; S.show('kagop');
    idleT = 0;
  }
  async function candleOut(S) {
    DIED.sakaue++;
    T.puff(S); S.wear('@meD'); S.plr(.6);
    await S.narr('蜡烛头「嗤」地一声，灭了。');
    await S.narr('黑暗里，四面八方都响起了脚步声。很轻，很近。');
    await S.scare('face', { face: 'soba', dur: 1 });
    await S.die('好几只冰凉的手，同时摸上了你的脸。\n「……是不是，这样的脸？」\n「……是不是，这样的脸？」', '蜡烛烧完了');
  }
  const CANDLE = 170;   // 实测：每页读 1.6 秒、四个人挨个查完约用 100 秒；读得慢（2.4 秒一页）也来得及，愣着就不行
  function startCandle(S, sec) { S.timer(sec, '蜡烛', candleOut, { during: true }); S.wear('@meL'); }
  async function figTalk(S, k) {
    if (S.f.helped || S.f.gone[k]) return;
    S.face('f_' + k, 'pl');
    if (S.once('hi_' + k)) await S.say(NAME[k], HI[k]);
    for (;;) {
      const r = await S.ask(PROMPT[k] + known(S, k), ['「もしもし——」', '（看看他的手）', '「你……是貉吧！」', '「求求你，帮帮我！」', '（先走开）'], NAME[k]);
      if (r === 4) return;
      S.f.acts++;
      if (r === 0) {
        S.f.chk[k + '_voice'] = true;
        await S.say('你', 'もしもし——');
        if (S.f.flaw[k] === 'voice') {
          S.bubble('f_' + k, '…', 1500); await S.wait(500);
          await S.say(NAME[k], '…………もし。', { style: 'whisper' });
          await S.narr('只有一声。\n他咧了咧嘴，像是还想再说一声，却怎么也说不出来。');
        } else await S.say(NAME[k], VOICE_OK[k]);
        continue;
      }
      if (r === 1) { S.f.chk[k + '_hand'] = true; await S.narr(S.f.flaw[k] === 'hand' ? HANDF[k] : HAND[k]); continue; }
      if (r === 2) return accuse(S, k);
      return askHelp(S, k);
    }
  }
  async function vanish(S, k) {
    const e = S.ent('f_' + k), x = tx(e), y = ty(e);
    e.spr = '@' + k + 'NF'; T.blank(S); S.shake(300, 2);
    await S.narr(UNMASK[k]);
    T.squeal(S); T.leaf(S); S.hide('sh_' + k); S.f.gone[k] = true;
    await S.alpha('f_' + k, 0, 600);
    S.place('lf_' + k, x, y);
    if (k === 'kago') { S.hide('kagop'); S.place('lf_kago', 13, 7); }
  }
  async function accuse(S, k) {
    const ev = await S.ask('「你是貉！因为——」', ['「你的影子拖着尾巴！」', '「你手背上长着毛！」', '「你只会说一声『もし』！」', '（算了，还没看准）'], '你');
    if (ev === 3) return;
    const kind = ['tail', 'hand', 'voice'][ev];
    await S.say('你', ['你的影子拖着尾巴！', '你手背上长着毛！', '你只会说一声「もし」！'][ev], { style: 'big' });
    if (S.f.real !== k && S.f.flaw[k] === kind) {
      S.bubble('f_' + k, '!', 800); await S.wait(400);
      await vanish(S, k);
      await S.narr('原地只剩下一片枯叶，打着旋儿落在地上。');
      const left = FIG.filter(z => !S.f.gone[z]);
      if (left.length === 1) await S.think('……只剩下' + NAME[left[0]] + '了。');
      else await S.think('一只。……还有' + (left.length - 1) + '只。');
      return S.goal(figGoal(S));
    }
    await S.say(NAME[k], DENY[k]);
    S.timerAdd(-12); S.toast('蜡烛又短了一截');
    if (S.f.real === k && ++S.f.wrong >= 2) {
      S.clearTimer();
      await S.say(NAME[k], LEAVE[k]);
      S.hide('sh_' + k); await S.alpha('f_' + k, 0, 900);
      DIED.sakaue++;
      await S.narr('他的脚步声往坂下去了，越来越远。\n坂上剩下的那几个「人」，一齐慢慢地转过身来。');
      return S.die('这条坂上，再没有一个活人了。\n（被冤枉两次，真人就会走掉。指认之前，先看准马脚。）', '你赶走了唯一的人');
    }
    const did = S.f.chk[k + '_' + kind];
    await S.think((did ? '……' + NAME[k] + '的' + KW[kind] + '，明明没什么不对。' : '……' + NAME[k] + '的' + KW[kind] + '，我还没' + (kind === 'voice' ? '听' : '看') + '过，就乱说。') + '\n冤枉了真人，他可不会一直忍着。');
  }
  async function askHelp(S, k) {
    if (S.f.real === k) return realHelp(S, k);
    if ((S.f.faces || 0) >= 2) S.clearTimer();   // 这一回就是第三张脸
    await S.say('你', '求求你……帮帮我。我要去四谷请大夫，可这条坂……');
    await S.say(NAME[k], '帮你？好啊。', { style: 'whisper' });
    await S.narr('他慢慢地抬起手，从额头往下，抹了一把脸。');
    S.ent('f_' + k).spr = '@' + k + 'NF'; T.blank(S); S.shake(500, 2);
    await S.say(NAME[k], '——是不是，这样的脸？', { style: 'big' });
    S.f.faces = (S.f.faces || 0) + 1;
    if (S.f.faces >= 3) return badThird(S, k);
    S.fx('flash'); S.toast('（第二张脸）'); S.timerAdd(-15);
    T.squeal(S); S.hide('sh_' + k); S.f.gone[k] = true;
    { const e = S.ent('f_' + k); await S.alpha('f_' + k, 0, 600); S.place('lf_' + k, tx(e), ty(e)); if (k === 'kago') { S.hide('kagop'); S.place('lf_kago', 13, 7); } }
    await S.think('……又被骗了一回。\n绘马上写着，它只骗三回。——不能再错了。');
    S.goal(figGoal(S));
  }
  async function badThird(S, k) {
    DIED.sakaue++;
    T.puff(S); S.wear('@meD'); S.plr(.6);
    await S.narr('灯里的蜡烛头「嗤」地灭了。');
    await S.narr('第三张脸。\n你想起绘马上那行字，伸手摸了摸自己的脸。');
    await S.scare('face', { face: 'self', dur: 1.7 });
    await S.narr('……光溜溜的。');
    await S.fade(1, 1200);
    await S.end({ bad: true, id: 'third', title: '第三张脸', text: '第二天夜里，有人路过纪伊国坂，看见护城河边蹲着一个年轻人，\n穿着商家伙计的蓝布衣裳，把脸埋在袖子里，一抽一抽地哭。\n\n那人走过去，问他出了什么事。\n他慢慢地抬起头——' });
  }
  async function realHelp(S, k) {
    S.f.helped = true; S.clearTimer();
    await S.say('你', '求求你……帮帮我。我要去四谷请大夫，可这条坂……');
    S.face('f_' + k, 'pl');
    await S.say(NAME[k], HELP[k]);
    if (k === 'komuso') { T.shaku(S, .07); await S.narr('他把尺八凑到斗笠底下，吹了一声。\n长长的、低低的一声，在坂道上远远地传开。'); }
    const rest = FIG.filter(z => z !== k && !S.f.gone[z]);
    if (rest.length) {
      await S.narr('灯光一晃。\n剩下的那几个人影，不知什么时候，都背过了身去。');
      for (const z of rest) { S.hide('sh_' + z); S.alpha('f_' + z, 0, 900); if (z === 'kago') S.alpha('kagop', 0, 900); }
      await S.wait(1000);
      for (const z of rest) { S.f.gone[z] = true; S.place('lf_' + z, FPOS[z][0], FPOS[z][1]); }
    }
    S.plr(3.4); S.dark(.86);
    if (k === 'kozo') { S.ent('f_kozo').spr = '@kozoL'; await S.narr('你把蜡烛凑过去，点着了小伙计的提灯。\n两盏灯，一大一小，把坂道照亮了一片。'); }
    else if (k === 'kusuri') await S.narr('他就着你的蜡烛点着了自己的灯笼。\n两盏灯，把坂道照亮了一片。');
    else await S.narr('两个人，一前一后。\n他的脚步声，踏踏实实的。');
    S.f.helper = k;
    S.follow('f_' + k, true);
    S.goal('跟着' + NAME[k] + '去四谷（往右）');
  }
  async function mayutsuba(S) {
    if (S.f.helped) return S.narr('石头道标：「右　四谷　左　赤坂」。');
    if (S.once('michiRead')) await S.narr('路边一块石头道标，刻着「右　四谷　左　赤坂」。\n底下有人用小刀刻了一行歪歪扭扭的字：「灯尽，莫问人」。');
    const r = await S.ask('心里乱成一团。', ['（往眉毛上抹点唾沫，定定神）', '（算了）']);
    if (r) return;
    S.f.hintN = Math.max(S.f.hintN || 0, DIED.sakaue) + 1; S.timerAdd(-6); S.f.acts++;
    await S.narr('你舔了舔指头，往两边眉毛上各抹了一下。\n凉飕飕的。脑子清醒了一点。');
    await S.think(hintText(S, S.f.hintN));
  }

  /* ---------------- 四谷：结尾 ---------------- */
  async function ending(S) {
    if (S.f.knocked) return;
    S.f.knocked = true;
    S.sfx('knock'); await S.wait(300); S.sfx('knock');
    await S.say('你', '大夫！大夫！京桥丸屋的伙计——小姐烧得厉害，求您去看看！');
    await S.wait(700); S.sfx('open'); S.ent('ishamon').lit = true;
    S.place('isha', S.pl.x === 12 ? 13 : 12, 2, 0); S.ent('isha').alpha = 0; await S.alpha('isha', 1, 500);
    if (S.f.cub) {
      await S.say('门里', ['来了来了——', '……又是京桥丸屋？']);
      await S.narr('门开了。头发花白的大夫已经穿戴整齐，药箱也挎在了肩上。');
      await S.say('大夫', ['刚才有个小和尚来敲门，说的也是京桥丸屋的小姐发烧。', S.f.cubFed ? '我问他是哪座寺里的，他一溜烟就跑了。嘴边还沾着一粒饭。……门槛上就落下了这个。' : '我问他是哪座寺里的，他一溜烟就跑了。门槛上就落下了这个。']);
      await S.narr('大夫摊开手心。\n是一片还带着露水的柳叶。');
      if (S.f.tanuSeen) await S.think('……树篱底下那双小眼睛。');
      await S.think('柳叶……赤坂御门外，护城河边，那一排柳树。');
      await S.fade(1, 1000);
      await S.card('后来', '', '大夫天亮前赶到了京桥。小姐的烧，第三天就退了。\n\n那年开春，清吉又去了一趟赤坂御门外的护城河边。\n芦苇里那个绳套还在，空的。\n他在柳树底下放了一个饭团。\n\n第二天再去，饭团不见了。\n原地放着一片柳叶，叠得整整齐齐。');
      return S.end({ id: 'ongaeshi', title: '第八夜　完（貉的谢礼）', text: '纪伊国坂的貉，后来还骗过很多人。\n\n可据说，它再也没有对一个京桥口音的年轻人，\n露出过那张光溜溜的脸。\n\n' + noteCount() });
    }
    await S.say('大夫', ['……这么晚了。', '京桥？好，好，我收拾一下药箱。……你从哪条路来的？']);
    await S.say('你', '纪……纪伊国坂。');
    await S.narr('大夫系药箱带子的手停了一下。');
    await S.say('大夫', ['……那条坂，你一个人走上来的？', '过来，让我看看你的脸。']);
    await S.narr('他举起灯，照着你的脸，看了很久。\n然后像是松了一口气，笑了。');
    await S.say('大夫', '嗯。眼睛、鼻子、嘴，都在。');
    await S.fade(1, 1000);
    await S.card('后来', '', '大夫天亮前赶到了京桥。小姐的烧，第三天就退了。\n\n清吉后来当上了丸屋的掌柜，又过了很多很多年，\n成了京桥一带有名的老商人。\n有年轻人请他讲纪伊国坂的貉，他总要先说一声：\n「もしもし。」\n听对方也答了两遍，才肯开口。');
    await S.end({ id: 'real', title: '第八夜　完', text: '据说，他是最后一个在纪伊国坂见过貉的人。\n' + (S.f.faces === 1 ? '他总说，那天夜里，自己只上了一回当。\n' : '') + '\n后来，赤坂点起了路灯，街上跑起了人力车。\n天黑以后，纪伊国坂上也渐渐有人走了。\n\n' + noteCount() });
  }

  /* ---------------- 地图字符画 ---------------- */
  function grid(w, h, fill) { const r = []; for (let y = 0; y < h; y++) r.push(Array.from({ length: w }, (_, x) => fill(x, y))); return r; }
  const ZAKA_ROWS = (() => {
    const r = grid(46, 12, (x, y) => y < 2 ? '#' : y <= 6 ? 'd' : y <= 8 ? '"' : '~');
    const put = (c, ...ps) => ps.forEach(([x, y]) => { r[y][x] = c; });
    put('P', [4, 7], [10, 7], [16, 7], [23, 7], [31, 7], [32, 7], [38, 7], [43, 7]);
    put('K', [19, 2], [19, 3], [19, 4], [23, 5], [23, 6], [31, 4], [31, 5], [31, 6]);   // 修墙的石料堆，挡出几道弯
    put('f', [27, 2], [27, 3]);
    put('e', [33, 8]);                                                                   // 河边草坡走到这里是死路
    return r.map(a => a.join(''));
  })();
  const MITSUKE_ROWS = (() => {
    const r = grid(26, 12, (x, y) => y < 2 ? '#' : y <= 4 ? (x < 10 ? 'k' : 'd') : y <= 6 ? 'd' : y <= 8 ? '"' : y === 9 ? 'e' : '~');
    [3, 6, 9, 11, 16, 19].forEach(x => { r[8][x] = 'e'; });
    return r.map(a => a.join(''));
  })();
  const SAKAUE_ROWS = grid(32, 12, (x, y) => y < 2 ? '#' : y <= 8 ? (y === 5 ? 'k' : 'd') : y === 9 ? ([4, 12, 21, 29].includes(x) ? 'P' : '"') : '~').map(a => a.join(''));
  const YOTSUYA_ROWS = grid(20, 8, (x, y) => y < 2 ? '#' : y <= 5 ? 'k' : y === 6 ? 'h' : 'T').map(a => a.join(''));
  const exitCol = (x, ys, fn) => ys.map(y => ({ x, y, spr: 'invisible', touch: S => fn(S, y) }));
  const rng = (a, b) => Array.from({ length: b - a + 1 }, (_, i) => a + i);

  defChapter({
    id: 'noppera', n: 8, title: '无脸人', sub: '纪伊国坂的夜里，河边哭泣的女人转过脸来——什么都没有。', origin: '日本怪谈·小泉八云《貉》（1904）', color: '#2a3446',
    amb: 'wind', floor: 'dirt', wall: 'mud', dark: .85, plr: 3.2,
    endings: { real: '第八夜　完', ongaeshi: '第八夜　完（貉的谢礼）', third: '第三张脸', soba: '一碗荞麦面' },
    thumb(g, w, h) {
      const s = Math.max(2, Math.floor(h / 42)), ox = Math.round(w / 2 - 16 * s), oy = Math.round((h - 22) / 2 - 16 * s);
      const gr = g.createRadialGradient(w / 2, oy + 26 * s, 2, w / 2, oy + 26 * s, 24 * s); gr.addColorStop(0, 'rgba(255,180,90,.32)'); gr.addColorStop(1, 'rgba(255,180,90,0)'); g.fillStyle = gr; g.fillRect(0, 0, w, h);
      FACES.nop((x, y, ww, hh, c) => { g.fillStyle = c; g.fillRect(ox + x * s, oy + y * s, ww * s, hh * s); }, 1, 0);   // 抹过之后：一张光溜溜的蛋脸
    },
    people: PEOPLE8,
    faces: FACES,
    items: {
      onigiri: { name: '饭团', desc: '出门前老板娘塞进你怀里的饭团，用竹皮包着，还有一点温。「路上饿了吃。」' },
      chochin: { name: '提灯', desc: '番太借你的小提灯，纸上写着「赤坂　辻番」。里面的蜡烛只有一指长。' },
      hiuchi: { name: '火打袋', desc: '一只旧布袋：一块火打石、一片火打金、一小撮火口。番太说：灯灭了就用它。' }
    },
    notes: {
      kuden: { title: '番太源六的话（你记在纸片上）', text: '夜里认人，看三样：\n\n一、影。灯底下的人，影子背着灯。\n　　貉变的，影子屁股后头拖着一条尾巴。\n二、手。貉的手背有毛，指甲又黑又厚。\n三、声。叫一声「もしもし」。\n　　貉学人说话，只会回一声「もし」。\n\n坂上的貉，听说是一家三口：\n老的藏不住尾巴，母的藏不住手，小的学不会说话。\n一只只露一处马脚，三只三处，各不相同。\n\n看穿了，就照直说出它的马脚，它就待不住。\n心慌了，往眉毛上抹点唾沫（眉唾），定定神。' },
      kawaraban: { title: '瓦版（贴在柱子上）', text: '【赤坂纪伊国坂怪事】\n\n近日夜半，有武家仆从行经纪伊国坂，见一小僧蹲于濠边。问其何故，小僧仰首——面上无目、无鼻、无口，平如鸡卵。仆从魂飞魄散，奔逃半里方止。\n\n乡里皆曰：此貉所为。貉善化人形，或为妇人，或为小贩，惟面不能成。\n\n又闻：入冬以来，有人于濠边芦苇中设绳套捕貉。自此，坂上怪事愈多。\n\n（纸角被人用墨涂了一张圆圆的、什么也没有的脸。）' },
      ema: { title: '地藏旁的绘马', text: '「愿家人夜归平安。」\n\n「某月某夜，坂下濠边见一女子掩面而泣。近前问之，彼以手抚面——」（后面的字被刮掉了）\n\n「卖面的灯火，莫近。」\n\n「它只骗三回。\n　把它当成人、向它伸手的那一回，才算数。\n　第一回、第二回，还跑得掉。\n　第三回——你就成了它。」\n\n「愿坂上之貉早得往生。」' },
      zuihitsu: { title: '被风吹来的半页随笔', text: '……世有无面之怪，俗呼「のっぺらぼう」。其面如卵，无目无鼻无口。\n\n其怪多作两番：行人遇之，惊走，逢一人而诉之，其人曰「所见莫非此乎」，以手抚面，亦无面焉。\n\n或曰狐，或曰狸，或曰貉，诸国称呼不一。\n\n又俗说：狐狸学人语，「もし」只能一言，故夜里呼人，必曰「もしもし」。又以唾涂眉，则不为所惑。\n\n（下半页被撕掉了。）' }
    },
    legend: '「のっぺらぼう」（无脸妖怪）是日本最有名的妖怪之一：看上去是个普通人，脸上却没有眼睛、鼻子和嘴，光溜溜的像一只鸡蛋。江户时代的怪谈集和妖怪画里就有类似的妖怪。它的故事常常是「两段式」的：受惊的人逃到另一个人那里诉说，对方说「你看见的，是不是这样的脸？」再一次露出无脸——日本民俗学里有人把这种结构叫作「再度の怪」，它也出现在不少别的妖怪故事里。\n\n这一类故事里流传最广的，是小泉八云（Lafcadio Hearn）1904 年《怪谈》（Kwaidan）中的《貉》（Mujina）。故事发生在东京赤坂的纪伊国坂：坂的一边是又深又宽的古濠，另一边是高高的宫墙；在有路灯和人力车之前，天黑以后几乎没人敢独自走这条坂。京桥的一位老商人深夜赶路，看见河边一个年轻女子掩面哭泣，上前安慰，她转过脸来，用手一抹——什么都没有。他逃到坂上一个荞麦面摊，老板问：「是不是这样的？」又抹了一把脸，灯随即灭了。八云说，最后一个见过这只貉的就是那位商人，「大约三十年前去世」。一般认为八云取材于明治年间刊行的怪谈集，原本的故事更短。纪伊国坂得名于坂旁的纪州德川家宅邸（今赤坂御用地一带），坂下的弁庆濠至今还在。\n\n「むじな」（貉）指什么，日本各地说法不一：有的地方指獾，有的指狸，也有两者混称的；狐、狸、貉会变人骗人的故事遍布各地。有一种流传很广的说法：狐狸学人说话，「もし」只能说一声，所以叫人要说「もしもし」——这多半是后来附会的俗说，查无实据。往眉毛上抹唾沫就不会被狐狸迷惑的俗信也很古老，「眉唾物」后来就成了「靠不住的东西」的意思。荞麦面摊则是江户夜里常见的「夜鸣荞麦」，一碗十六文的叫「二八荞麦」，有的摊子檐下挂着风铃。\n\n（本章的清吉、丸屋、番太源六、坂上的四个人和四谷的大夫，以及瓦版、绘马、随笔的具体内容均为游戏虚构；「靠影子、手、声音认出貉」「貉一家三口、三处马脚各不相同」「只骗三回，第三回就轮到你」「说中马脚它就待不住」是本章为玩法设计的规则。八云原作里，商人只遇见了两张脸。）',
    start: { map: 'mitsuke', x: 2, y: 5, dir: 2 },
    async intro(S) {
      for (const k in DIED) DIED[k] = 0;   // 新开一局：死亡计数清零（重来不清）
      sobT = 0; furT = 0; shakuT = 4; idleT = 0; resetChase(0);
      await S.card('第八夜　无脸人', '江户末年　冬夜　赤坂·纪伊国坂', '京桥丸屋的小姐，烧了三天，退不下去。\n掌柜的说，四谷有位大夫，半夜也肯出诊。\n\n从赤坂御门去四谷，最近的路是纪伊国坂。\n天黑以后，没有人愿意一个人走那条坂。');
    },
    resume: {
      chase: async S => {
        S.stop('onna'); const o = S.ent('onna'); S.place('onna', 14, 8, 3); o.spr = '@onnaNF'; o.alpha = 1; o.oy = 0;
        S.pos(17, 4, 2);   // 你已经跑出去三步：重来时和她隔开，给 0.5 秒以上的反应时间
        S.f.grab = 0; S.f.blinks = 0; S.f.phase = 'chase'; resetChase(1.8); S.speed(.9); S.wear('@meD'); S.plr(1.9); S.amb('wind');
        S.goal('逃！往坂上那点灯火跑');
        if (DIED.chase) await S.think(DIED.chase === 1 ? '（别愣着，一直跑。她闪到前面的时候，从旁边绕过去。）' : '（贴着白墙那一侧跑：河边的草坡走到石堆那儿是死路。每道石堆旁边，总留着一条缝。）');
      },
      soba: async S => {
        S.speed(1); S.wear('@meD'); S.hide('onna'); S.amb('wind');
        if (DIED.soba) await S.think('（绘马上写着：卖面的灯火，莫近。……他给的东西，别碰。\n灯底下，先看看他的影子。）');
      },
      sakaue: async S => {
        setupFigs(S); startCandle(S, CANDLE); S.plr(3.2); S.amb('wind'); S.goal(figGoal(S));
        if (DIED.sakaue) { const n = Math.min(4, DIED.sakaue); S.f.hintN = n; await S.think(hintText(S, n)); }
      }
    },
    sprites: SPR8,
    maps: {
      /* ---------------- 赤坂御门外·坂下 ---------------- */
      mitsuke: {
        amb: 'wind', dark: .78, plr: 2.6, wall: 'stone', floor: 'dirt',
        rows: MITSUKE_ROWS,
        ents: [
          { id: 'mon', x: 1, y: 1, w: 3, spr: 'mon', on: S => S.narr('赤坂御门。暮六つ一敲，大门就关上了。\n石垣上结着一层白霜。') },
          { id: 'banya', x: 6, y: 2, w: 2, spr: 'banya', light: { r: 2.4, col: 'rgba(255,200,120,.2)', dx: 9, dy: -2 }, on: S => S.narr('辻番所。窗纸上透出黄黄的灯光，门边挂着刺股和突棒。\n小屋里飘出一股烤年糕的焦香。') },
          { id: 'hibachi', x: 7, y: 3, spr: 'hibachi', light: { r: 2.6, col: 'rgba(255,140,60,.25)', flick: true }, on: S => lightLantern(S) },
          { id: 'genroku', x: 8, y: 3, spr: '@genroku', dir: 1, on: S => genTalk(S) },
          { id: 'sh_gen', x: 9, y: 3, spr: 'shadow', decal: true, s: { ax: -1, lx: 7.4, ly: 3.2 } },
          { id: 'kosatsu', x: 12, y: 2, spr: 'kosatsu', on: S => S.narr('高札：「夜间行路，须持灯火。无灯者，辻番得以盘问。」\n墨迹被雨水冲得发淡了。') },
          { id: 'kawaraban', x: 16, y: 2, spr: 'kawaraban', async on(S) { if (S.once('kwP')) await S.narr('柱子上贴着一张瓦版，被风吹得一角翘起来。'); await S.note('kawaraban'); } },
          { id: 'jizo', x: 21, y: 2, spr: 'jizo', on: S => S.narr('路边的地藏，红围兜旧得发白。\n脚下供着一小撮米，已经冻硬了。你合掌拜了拜。') },
          ...[[4, 7], [14, 7], [22, 7]].map(([x, y], i) => ({ x, y, spr: 'willow', on: S => S.narr(['柳枝垂到水面上，被风吹得一下一下地甩。', '柳树底下的草被踩倒了一片，像是有什么东西常在这儿趴着。', '护城河黑沉沉的。对岸的石垣一直伸进黑暗里。'][i]) })),
          { id: 'wana', x: 10, y: 8, spr: 'wana', on: S => wanaOn(S) },
          ...exitCol(0, rng(2, 6), async (S, y) => { S.pos(1, y, 2); await S.think('回京桥？……不行，小姐还等着大夫呢。'); }),
          ...exitCol(25, rng(2, 6), async (S, y) => {
            if (!S.f.lit) { S.pos(24, y, 1); return S.think(S.has('chochin') ? '提灯还没点着……那条坂黑得伸手不见五指。\n先到火盆上点灯。' : '没有灯……那条坂黑得伸手不见五指。\n先去辻番所借一盏灯。'); }
            await S.go('zaka', 1, 4, 2);
          })
        ],
        async enter(S, first) {
          if (!first) return;
          S.give('onigiri', true);
          T.hyoshigi(S, 2);
          await S.narr('「火——の——用——心——」\n远远地，传来巡夜的拍子木声。');
          await S.narr('赤坂御门早就关了。护城河边的柳树，在北风里一下一下地甩着枝条。');
          await S.think('过了这片护城河，往右就是纪伊国坂。\n……没有灯，走不了那条坂。');
          S.goal('去辻番所，跟番太打声招呼');
        }
      },
      /* ---------------- 纪伊国坂 ---------------- */
      zaka: {
        amb: 'wind', dark: .9, plr: 3.2, wall: 'school', floor: 'dirt',
        rows: ZAKA_ROWS,
        ents: [
          ...rng(0, 45).map(x => ({ x, y: 1, spr: 'eave', solid: false, decal: true })),
          { id: 'jizo2', x: 5, y: 2, spr: 'jizo', s: { ema: true }, async on(S) { if (S.once('emaP')) await S.narr('坂口的小地藏旁边，挂着一串旧绘马。被风吹得「嗒嗒」地碰在一起。'); await S.note('ema'); } },
          { id: 'mon2', x: 24, y: 1, w: 3, spr: 'mon', on: S => S.narr('纪州大人宅邸的长屋门，关得紧紧的。\n门里静悄悄的，连条狗都不叫。') },
          ...[[9, 1], [15, 1], [34, 1], [42, 1]].map(([x, y], i) => ({ x, y, spr: 'invisible', solid: true, on: S => S.narr(['白墙上的瓦檐，一片接着一片，一直排到黑暗里。', '墙根底下有几道新抓的痕迹，低低的，像小兽的爪子。', '墙那边是一大片林子，风吹得树梢「呜呜」地响。', '白墙在灯下白得发青。'][i]) })),
          ...[[4, 7], [10, 7], [16, 7], [38, 7]].map(([x, y]) => ({ x, y, spr: 'invisible', solid: true, on: S => S.narr('河边的老松。树根底下就是陡陡的草坡，再往下是黑沉沉的护城河。') })),
          { id: 'onna', x: 14, y: 8, spr: '@onna', dir: 3, solid: false, oy: 5, light: { r: 1.3, col: 'rgba(210,225,255,.10)' }, on: S => meetWoman(S) },
          { id: 'yatai', x: 39, y: 3, w: 2, spr: 'yatai', hidden: true, light: { r: 4.4, col: 'rgba(255,190,110,.26)', dx: 5, dy: -4, flick: true }, on: S => sobaTalk(S) },
          { id: 'soba', x: 41, y: 3, spr: '@soba', dir: 1, hidden: true, on: S => sobaTalk(S) },
          { id: 'sh_soba', x: 42, y: 3, spr: 'shadow', decal: true, hidden: true, s: { ax: -1, lx: 39.3, ly: 2.6, tail: true }, on: S => sobaShadow(S) },
          { id: 'leaf1', x: 40, y: 4, spr: 'leaf', decal: true, hidden: true, on: S => S.narr('一片湿漉漉的柳叶。\n刚才面摊就摆在这儿。地上连个担子压过的印子都没有。') },
          ...exitCol(0, rng(2, 6), async (S, y) => {
            if (S.f.phase) { S.pos(1, y, 2); return S.think('回头？那个女人……还在坂下。'); }
            await S.go('mitsuke', 24, 4, 1);
          }),
          ...exitCol(45, rng(2, 6), async (S, y) => {
            if (!S.f.relit) { S.pos(44, y, 1); return S.think('前面黑得什么也看不见。'); }
            await S.go('sakaue', 1, 5, 2);
          })
        ],
        async enter(S, first) {
          if (!first) return;
          await S.narr('纪伊国坂。\n一边是纪州大人宅邸的白墙，长得望不到头；一边是又深又宽的护城河。');
          await S.think('一盏灯也没有。只有手里这盏提灯，照得见脚下几步。');
          S.goal('沿着坂道往上走（往右，去四谷）');
          S.cp('zaka');
        },
        step(S, x, y) {
          if (S.f.phase) return;
          if (x >= 9 && S.once('sobHear')) { S.goal('河边有人在哭——过去看看'); return S.think('……有人在哭。\n河边。'); }
          if (x >= 18) { S.pos(17, y, 1); return S.think('哭声就在身后……\n这么晚了，一个姑娘家，就这么走过去不管，好像不太好。'); }
        },
        tick(S, dt) {
          const p = S.pl;
          if (!S.f.phase) { sobT -= dt; if (p.x >= 5 && sobT <= 0) { sobT = 3.2; T.sob(S, Math.max(.012, .06 - (Math.abs(p.x - 14) + Math.abs(p.y - 8)) * .003)); } }
          else if (!S.f.sobaDone && p.x >= 22) { furT -= dt; if (furT <= 0) { furT = 2.6; T.furin(S, Math.max(.008, .045 - Math.abs(p.x - 40) * .002)); } }
          if (S.f.phase !== 'chase' || S.busy || W.ended) return;
          const o = S.ent('onna'); if (!o) return;
          if (p.x >= 35) { S.f.phase = 'soba'; S.run(endChase); return; }
          if (o.alpha < 1) o.alpha = Math.min(1, o.alpha + dt * 1.5);
          if (CS.frz > 0) { CS.frz -= dt; if (CS.frz <= 0) S.chase('onna', { spd: SPD, catch: caught }); return; }
          if (!o.chase) return;
          const ox = o.px / TS, oy = o.py / TS, d = Math.hypot(ox - p.x, oy - p.y);
          CS.snd -= dt; CS.hb -= dt; CS.cool -= dt;
          if (CS.snd <= 0) { T.sob(S, d < 4 ? .07 : .035); CS.snd = d < 4 ? 1.4 : 2.4; }
          if (d < 9 && CS.hb <= 0) { S.sfx('heart'); CS.hb = .4 + d * .12; }
          /* 落后太远：前面先传来一声哭（0.9 秒预警），她再出现在你「此刻」前面四格、和你至少隔三格。整段最多两次 */
          if (CS.pend) {
            if ((CS.pend.t -= dt) <= 0) {
              CS.pend = null;
              const m = curMap(), x = Math.min(28, p.x + 4); let q = null;   // 不出现在最后那道石堆的窄口（31）跟前
              for (const dy of [0, 1, -1, 2, -2, 3, -3]) { const y = p.y + dy; if (y >= 2 && y <= 8 && passable(m, x, y, o) && Math.abs(x - p.x) + Math.abs(y - p.y) >= 3) { q = { x, y }; break; } }
              if (!q || x - p.x < 3) { CS.cool = 1; return; }
              S.place('onna', q.x, q.y, 1); o.alpha = .25; o.chase.wait = 1.0;
              S.f.blinks = (S.f.blinks || 0) + 1; CS.cool = 5; S.sfx('sting');
              if (S.f.blinks === 1) { S.toast('她在前面！从旁边绕过去！'); S.bubble('pl', '!', 900); }
            }
            return;
          }
          if ((S.f.blinks || 0) < 2 && CS.cool <= 0 && p.x - ox >= 6 && p.x >= 16 && p.x <= 25) {
            CS.pend = { t: .9 }; T.sob(S, .08);
          }
        }
      },
      /* ---------------- 坂上 ---------------- */
      sakaue: {
        amb: 'wind', dark: .95, plr: 3.2, wall: 'school', floor: 'dirt',
        rows: SAKAUE_ROWS,
        ents: [
          ...rng(0, 31).map(x => ({ x, y: 1, spr: 'eave', solid: false, decal: true })),
          { id: 'michi', x: 3, y: 2, spr: 'michi', on: S => mayutsuba(S) },
          { id: 'zuihitsu', x: 5, y: 8, spr: 'paper', async on(S) { if (S.once('zuiP')) await S.narr('草里卡着半页纸，被露水打湿了，是从什么书上撕下来的。'); await S.note('zuihitsu'); } },
          { id: 'kagop', x: 13, y: 7, spr: 'kagop', on: S => S.narr('一顶空轿子。帘子半卷着，里面黑洞洞的。\n坐垫上还留着一点体温似的——不，是你的错觉。') },
          ...FIG.flatMap(k => {
            const [x, y, d] = FPOS[k];
            return [
              { id: 'sh_' + k, x, y, spr: 'shadow', decal: true },
              { id: 'lf_' + k, x, y, spr: 'leaf', decal: true, hidden: true, on: S => S.narr('一片枯叶。\n刚才站在这儿的，是' + NAME[k] + '。') },
              { id: 'f_' + k, x, y, spr: '@' + k, dir: d, on: S => figTalk(S, k) }
            ];
          }),
          ...exitCol(31, rng(2, 8), async (S, y) => {
            if (!S.f.helped) { S.pos(30, y, 1); return S.think('前面黑得像一堵墙，提灯照不出一步。\n……一个人，走不出去。'); }
            await S.go('yotsuya', 1, 4, 2);
          }),
          ...exitCol(0, rng(2, 8), async (S, y) => { S.pos(1, y, 2); await S.think('回头？……坂下还有那张脸。'); })
        ],
        async enter(S, first) {
          if (!first) return;
          await S.narr('坂道到了顶。路忽然宽了，两边黑得看不见边。');
          setupFigs(S);
          await S.narr('提灯的光圈外面，影影绰绰地站着几个人。\n一个、两个……四个。');
          await S.think((S.f.faces || 1) >= 2 ? '……已经被骗了两回了。\n绘马上写着：它只骗三回。第三回——' : '河边那一回，算一回。\n面摊那一回，我没上当……还能再错一回。');
          await S.think('四个人里，说不定只有一个是真的人。\n番太说过——影子、手、声音。');
          S.goal(figGoal(S));
          startCandle(S, CANDLE);
          S.toast(S.coop ? '双人：一人举灯走近看影子，一人上前问话' : '卡住了：去路边的石头道标前抹「眉唾」定定神（会烧掉一点蜡烛）');
          S.cp('sakaue');
        },
        tick(S, dt) {
          if (!S.f.gone || S.f.helped) return;
          const left = S.timerLeft;
          if (left != null) {
            S.plr(1.9 + 1.7 * Math.max(0, Math.min(1, left / CANDLE)));
            if (left < 30 && !S.f.candleWarn) { S.f.candleWarn = true; S.toast('蜡烛快烧完了！'); for (let i = 0; i < 4; i++) S.tone('square', 900, 300, .03, .05, i * .23, 2000); S.sfx('heart'); }
            for (const k of FIG) if (!S.f.gone[k] && !S.f.chk[k + '_tail']) { const e = S.ent('f_' + k); if (Math.hypot(e.px / TS - S.pl.x, e.py / TS - S.pl.y) <= 2.6) S.f.chk[k + '_tail'] = true; }
          }
          shakuT -= dt;
          if (shakuT <= 0 && !S.f.gone.komuso) { shakuT = 9 + Math.random() * 4; const e = S.ent('f_komuso'), d = Math.hypot(e.px / TS - S.pl.x, e.py / TS - S.pl.y); T.shaku(S, Math.max(.008, .05 - d * .0025)); }
          if (!S.busy && !S.f.acts) { idleT += dt; if (idleT > 35 && S.once('idleHint')) S.run(async S => { await S.think('……番太说过：灯底下看影子。举着灯走近他们——貉的影子，拖着尾巴。\n（心慌的话，路边道标那儿抹点眉唾。）'); }); }
        }
      },
      /* ---------------- 四谷·大夫家门前 ---------------- */
      yotsuya: {
        amb: 'night', dark: .8, plr: 3.4, wall: 'wood', floor: 'stone',
        rows: YOTSUYA_ROWS,
        ents: [
          { id: 'kido', x: 1, y: 1, spr: 'kido', on: S => S.narr('四谷大木户。木户番打着瞌睡，把你们放了进来。') },
          { x: 3, y: 1, spr: 'window', lit: true, light: { r: 1.8, col: 'rgba(255,200,120,.16)', dy: 14 }, on: S => S.narr('木户番小屋的窗户。里面的老头抱着火盆，鼾声一阵一阵的。') },
          ...[5, 7, 9, 15, 17].map((x, i) => ({ x, y: 1, spr: 'amado', col: ['#5a2a2a', '#2a3a5a', '#3a4a2a', '#5a4a2a', '#4a2a4a'][i], on: S => S.narr(['米铺。门板上得严严实实。', '和服铺。招牌上写着「伊势屋」——小伙计说的，就是这家吧。', '药铺。门缝里飘出一股甘草的味道。', '酒铺。门口的杉玉在风里晃。', '灯笼铺。屋檐下挂着一排还没糊纸的灯笼骨架。'][i]) })),
          { id: 'ishamon', x: 12, y: 1, w: 2, spr: 'ishamon', light: { r: 2.2, col: 'rgba(255,200,120,.2)', dx: 30, dy: 0 }, on: S => ending(S) },
          { id: 'isha', x: 12, y: 2, spr: '@isha', dir: 0, hidden: true, on: S => S.say('大夫', '走吧，别耽搁了。') },
          { id: 'helper', x: 2, y: 4, spr: '@kago', dir: 2, hidden: true, solid: false, on: S => S.say(NAME[S.f.helper] || '', '快去敲门吧。') },
          { id: 'tanu', x: 16, y: 6, spr: 'tanu', hidden: true, solid: false, async on(S) { S.f.tanuSeen = true; await S.narr('树篱底下，一双小小的眼睛亮了一下。\n你一眨眼，它就不见了。只听见叶子「沙沙」响。'); S.hide('tanu'); } },
          ...exitCol(0, rng(2, 5), async (S, y) => { S.pos(1, y, 2); await S.think('大夫家就在前面。'); })
        ],
        async enter(S, first) {
          if (!first) return;
          const k = S.f.helper || 'kago', h = S.ent('helper');
          h.spr = '@' + (k === 'kozo' ? 'kozoL' : k); S.place('helper', 2, 4, 2);
          await S.narr('四谷大木户。木户番的小屋里，还透出一点灯光。\n木户后面的街上，一排排的店都上了门板。');
          await Promise.all([S.walk('pl', [10, 3], 3.4), S.walk('helper', [10, 4], 3.4)]);
          S.face('helper', 'pl'); S.face('pl', 'helper');
          await S.say(NAME[k], BYE[k]);
          if (k === 'kago') { await S.walk('helper', [15, 4], 3); S.face('helper', 1); }
          else {
            if (k === 'komuso') T.shaku(S, .05);
            await S.walk('helper', [19, 4], 3.4); S.hide('helper');
            await S.narr('脚步声拐进了小巷，听不见了。');
          }
          if (S.f.cub) S.show('tanu');
          S.goal('敲大夫家的门（挂着「本道」招牌）');
        }
      }
    }
  });
})();
