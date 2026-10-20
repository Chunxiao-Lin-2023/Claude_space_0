/* ================= 第四夜 · 黄皮子讨封 ================= */
(() => {
  /* ---------- 黄皮子（人立、作揖、戴草帽）：people 与地图精灵共用 ---------- */
  const FUR = '#c27c2c', FUR2 = '#8a5218', BELLY = '#efd6a6', MUZ = '#f6e8cc', EYE = '#ffd23a';
  function weasel(R, d, o) {
    const b = o.bow ? 2 : 0, h = 5 + b;
    const hatC = o.hat === 'old' ? '#b0924c' : '#dccb8e';
    if (d === 0 || d === 3) {
      R(11, 14, 3, 6, FUR2); R(12, 10, 3, 5, FUR); R(13, 8, 2, 3, '#3e220c');          // 尾巴往右上卷
      R(5, 19, 2, 3, FUR2); R(9, 19, 2, 3, FUR2); R(4, 22, 3, 1, '#2a1608'); R(9, 22, 3, 1, '#2a1608');
      R(5, 11 + b, 6, 9 - b, FUR); R(10, 12 + b, 1, 7, FUR2);
      if (d === 0) R(6, 13 + b, 4, 6, BELLY);
      R(5, h, 6, 6, FUR); R(4, h - 1, 2, 2, FUR2); R(10, h - 1, 2, 2, FUR2);
      if (d === 0) {
        R(6, h + 3, 4, 3, MUZ); R(7, h + 4, 2, 1, '#1a0c06');
        R(5, h + 2, 2, 1, '#3a2010'); R(9, h + 2, 2, 1, '#3a2010');
        R(6, h + 2, 1, 1, EYE); R(9, h + 2, 1, 1, EYE);
        R(6, 12 + b, 4, 2, FUR2); R(7, 11 + b, 2, 1, MUZ);                         // 两只前爪拱在胸前——作揖
      } else R(5, h + 1, 6, 5, FUR2);
      if (o.hat) {
        R(1, h - 1, 14, 1, hatC); R(4, h - 4, 8, 3, shade(hatC, .12)); R(4, h - 2, 8, 1, '#8a3a1e');
        if (o.hat === 'old') { R(9, h - 4, 2, 1, '#3a2a10'); R(2, h - 1, 2, 1, '#3a2a10'); R(13, h - 1, 1, 1, '#3a2a10'); }
        else { R(0, h - 1, 1, 1, '#b8a868'); R(15, h - 1, 1, 1, '#b8a868'); R(6, h - 5, 1, 1, '#b8a868'); }
      }
    } else {   // 侧面（朝左）
      R(10, 15, 4, 3, FUR2); R(12, 11, 3, 5, FUR); R(13, 9, 2, 3, '#3e220c');
      R(7, 19, 3, 3, FUR2); R(5, 22, 5, 1, '#2a1608');
      R(6, 11 + b, 5, 9 - b, FUR); R(6, 13 + b, 2, 6, BELLY);
      R(4, h, 6, 6, FUR); R(1, h + 3, 4, 2, MUZ); R(1, h + 3, 1, 1, '#1a0c06'); R(8, h - 1, 2, 2, FUR2);
      R(4, h + 2, 2, 1, '#3a2010'); R(5, h + 2, 1, 1, EYE);
      R(3, 12 + b, 3, 2, FUR2);
      if (o.hat) { R(1, h - 1, 12, 1, hatC); R(3, h - 4, 7, 3, shade(hatC, .12)); R(3, h - 2, 7, 1, '#8a3a1e'); if (o.hat === 'old') R(7, h - 4, 2, 1, '#3a2a10'); }
    }
  }
  const wzPeople = (key, hat, bow) => ({ key, skin: FUR, hair: FUR2, top: FUR, bottom: FUR2, extra(g, d, fr, G, R) { g.clearRect(0, 0, 16, 24); weasel(R, d, { hat, bow: bow || fr === 1 }); } });

  /* ---------- 小工具 ---------- */
  const cycle = (S, key, lines) => lines[(S.f[key] = ((S.f[key] ?? -1) + 1) % lines.length)];
  const rnd = n => (Math.random() * n) | 0;
  /* 联机：关键抉择两人各投一票（单人时等同 ask）。safe != null 时，意见不合就走 safe 那一项 */
  async function choose(S, q, opts, who, safe, splitMsg) {
    if (S.coop) S.toast('联机：这一下，两个人各投一票');
    const r = await S.vote(q, opts, who);
    if (r.agree) return r.v;
    if (safe != null) { await S.narr(splitMsg || '你们俩一个想这样，一个想那样。\n到底还是稳当的那个占了上风。'); return safe; }
    await S.narr('你心里有两个声音在吵。一个说' + opts[r.h] + '，一个说' + opts[r.g] + '。\n最后，还是嘴快的那个说了算。');
    return r.v;
  }

  /* ---------- 声音（S.tone 合成，双方都听得到） ---------- */
  function drum(S, n = 3, gap = .3, d0 = 0) {   // 二神的单鼓：羊皮鼓「咚」+ 鼓边铁环「哗啦」
    for (let i = 0; i < n; i++) {
      const d = d0 + i * gap;
      S.tone('sine', 170, 52, .34, .22, d, 500); S.tone('triangle', 95, 48, .26, .09, d, 320);
      for (let k = 0; k < 3; k++) S.tone('square', 2300 + k * 410, 2150 + k * 380, .07, .012, d + .03 + k * .035, 6000);
    }
  }
  function squeak(S, n = 3, d0 = 0) {   // 黄皮子尖细的「吱吱」声
    for (let i = 0; i < n; i++) { const f = 2100 + Math.random() * 700; S.tone('square', f, f * 1.35, .05, .016, d0 + i * .09, 5000); }
  }
  function callTone(S) {   // 风里拖长了的「军儿——」
    S.tone('triangle', 560, 470, .55, .045, 0, 1400); S.tone('triangle', 640, 380, .9, .04, .62, 1400); S.tone('sine', 1280, 760, .9, .01, .64, 2400);
  }
  const SNOWC = ['#c6d0dc', '#a3aec0', '#d0d8e2'];
  function exit(to, x, y, dir, block) {
    return async S => {
      const m = block ? block(S) : null;
      if (m) { S.sfx('locked'); await S.narr(m); const p = S.pl; if (p.prev && (p.prev[0] !== p.x || p.prev[1] !== p.y)) S.pos(p.prev[0], p.prev[1]); return; }
      await S.go(to, x, y, dir);
    };
  }
  /* 天色：按阶段调黑暗度 */
  function light(S) {
    const ph = S.f.ph, night = ['ritual', 'night'].includes(ph);
    const t = { tun: night ? .86 : .62, house: night ? .7 : .58, cang: .82, mama: .55 }[S.map];
    if (t != null) S.dark(t);
  }

  const SPRS = {
    wz(g, e, t, R) {   // 四条腿贴地窜的黄皮子（追的那个）
      const f = e.dir === 2 ? (a, b, w, h, c) => R(16 - a - w, b, w, h, c) : R;
      const s = Math.sin(t * 16) > 0 ? 1 : 0;
      f(3, 8, 10, 4, FUR); f(4, 11, 8, 1, FUR2); f(0, 6, 5, 4, FUR); f(0, 8, 1, 1, '#1a0c06'); f(1, 7, 1, 1, EYE); f(3, 5, 1, 1, FUR2);
      f(4 + s, 12, 1, 3, FUR2); f(10 - s, 12, 1, 3, FUR2); f(12, 6, 4, 3, FUR); f(14, 4, 2, 3, '#3e220c');
    },
    eyes(g, e, t, R) {   // 黑地里一对一对的黄眼睛
      const k = Math.sin(t * 1.3 + e.x * 2.7 + e.y) > -.85;
      if (!k) return;
      R(4, 7, 2, 1, EYE); R(10, 7, 2, 1, EYE); R(4, 8, 2, 1, 'rgba(255,210,60,.45)'); R(10, 8, 2, 1, 'rgba(255,210,60,.45)');
    },
    snowfx(g, e, t, R) {   // 满屏的雪（实体跟着镜头走）
      const bx0 = Math.round(CAM.x) - e.px, by0 = Math.round(CAM.y) - e.py, n = e.heavy ? 150 : 90;
      for (let i = 0; i < n; i++) {
        const sx = ((hash(i, 1, 7) * VW + t * (6 + hash(i, 2, 7) * 12) + Math.sin(t * .9 + i) * 5) % VW + VW) % VW;
        const sy = (hash(i, 3, 7) * VH + t * (16 + hash(i, 4, 7) * 16)) % VH;
        R(bx0 + sx, by0 + sy, i % 7 ? 1 : 2, 1, i % 3 ? 'rgba(232,238,248,.75)' : 'rgba(255,255,255,.95)');
      }
    },
    kang(g, e, t, R) {   // 火炕（w 格宽、两格高）：炕席 + 炕沿
      const w = (e.w || 1) * 16;
      R(0, -3, w, 35, '#3a2618');
      R(1, -2, w - 2, 27, e.col || '#c9a86a');
      for (let y = 0; y < 25; y += 3) R(1, y - 1, w - 2, 1, shade(e.col || '#c9a86a', -.12));
      for (let x = 5; x < w - 2; x += 6) R(x, -2, 1, 27, shade(e.col || '#c9a86a', .1));
      R(0, 25, w, 3, '#7a5032'); R(0, 25, w, 1, '#9a7048'); R(0, 28, w, 4, '#5a4a40');
      for (let x = 3; x < w; x += 8) R(x, 29, 4, 2, '#4a3a30');
    },
    beiduo(g, e, t, R) { R(1, -6, 14, 4, '#c03a3a'); R(3, -5, 2, 1, '#f0c040'); R(1, -2, 14, 4, '#3a6aa8'); R(1, 2, 14, 4, '#e0b040'); R(1, 6, 14, 3, '#5a8a4a'); R(1, 9, 14, 1, '#2a2a2a'); },
    oillamp(g, e, t, R) {
      R(5, 10, 6, 3, '#4a5a4a'); R(6, 6, 4, 5, 'rgba(200,220,210,.7)'); R(7, 9, 2, 1, '#5a4a2a');
      if (!e.off) { const f = Math.sin(t * 15 + e.x) > 0 ? 0 : 1; R(7, 5 + f, 2, 3 - f, '#ffcf5a'); R(7, 7, 2, 1, '#fff2b0'); }
    },
    kangtable(g, e, t, R) { R(2, 11, 2, 3, '#5a3a1a'); R(12, 11, 2, 3, '#5a3a1a'); box(R, 0, 4, 16, 8, '#8a5a2a'); R(1, 5, 14, 1, '#a8743a'); },
    zaotai(g, e, t, R) {   // 东北大锅台
      box(R, 0, 0, 16, 15, '#7a6656'); R(1, 7, 14, 1, '#5a4a3e');
      R(2, 1, 12, 5, '#1e1e1e'); R(3, 1, 10, 3, '#8a6a3a'); R(7, 0, 2, 1, '#5a3a1a');
      R(5, 9, 6, 5, '#140a06'); const f = Math.sin(t * 9) > 0 ? 1 : 0; R(6, 11 + f, 4, 3 - f, '#ff8a2a'); R(7, 12, 2, 1, '#ffcf5a');
      R(7, -3 - ((t * 5) % 4), 2, 2, 'rgba(220,220,220,.35)');
    },
    wanjia(g, e, t, R) { box(R, 0, -10, 16, 25, '#8a6a42'); for (let s = 0; s < 3; s++) { R(1, -3 + s * 6, 14, 1, '#5a4228'); for (let i = 0; i < 3; i++) R(2 + i * 5, -6 + s * 6, 4, 3, s === 2 ? '#3a6a9a' : '#e8e4d8'); } },
    vat(g, e, t, R) { box(R, 1, 1, 14, 14, '#4a4440'); R(2, 2, 12, 3, '#1a2630'); R(3, 3, 4, 1, '#3a5060'); R(1, 8, 14, 1, '#38322e'); if (e.stone) { R(4, 0, 8, 4, '#7a7a74'); R(5, 0, 6, 1, '#8a8a84'); } },
    nianhua(g, e, t, R) { box(R, 2, 0, 12, 13, '#c83a2a'); R(3, 1, 10, 11, '#f0e0c0'); R(5, 2, 4, 4, '#f0c8a0'); R(5, 2, 4, 1, '#1a1010'); R(4, 6, 6, 5, '#d83a3a'); R(8, 7, 5, 3, '#e88a2a'); R(12, 8, 1, 1, '#e88a2a'); },
    cwin(g, e, t, R) {   // 糊了窗花、结了霜的窗户（墙面）
      box(R, 1, 0, 14, 13, '#5a3a22');
      R(2, 1, 12, 11, e.lit ? '#e8c27a' : '#aebdd0');
      if (!e.lit) for (let i = 0; i < 9; i++) R(2 + ((hash(e.x, i, 3) * 11) | 0), 1 + ((hash(i, e.x, 4) * 10) | 0), 2, 1, '#d6e0ec');
      R(7, 1, 1, 11, '#5a3a22'); R(2, 6, 12, 1, '#5a3a22');
      R(3, 2, 3, 3, '#c8202a'); R(4, 3, 1, 1, e.lit ? '#e8c27a' : '#aebdd0'); R(10, 8, 3, 3, '#c8202a'); R(11, 9, 1, 1, e.lit ? '#e8c27a' : '#aebdd0');
      if (e.face) { const c = e.lit ? '#3a2412' : '#c27c2c'; R(8, 2, 6, 5, c); R(8, 1, 2, 1, c); R(12, 1, 2, 1, c); R(10, 7, 2, 1, c); R(9, 4, 1, 1, EYE); R(12, 4, 1, 1, EYE); }   // 贴在霜花上的小尖脸（背光是个黑影，只有两点黄眼睛）
    },
    mdoor(g, e, t, R) {   // 贴了春联的门
      if (e.open) R(2, -2, 12, 16, '#08070a'); else { box(R, 2, -2, 12, 16, '#6a3a22'); R(4, 0, 8, 5, '#7a4628'); R(4, 7, 8, 5, '#7a4628'); R(11, 6, 1, 2, '#c9a35a'); }
      R(0, -4, 2, 18, '#c81e1e'); R(14, -4, 2, 18, '#c81e1e'); R(2, -6, 12, 2, '#c81e1e');
      for (let i = 0; i < 4; i++) { R(0, -2 + i * 4, 2, 1, '#e8c040'); R(14, -2 + i * 4, 2, 1, '#e8c040'); }
      if (!e.open) { R(7, 2, 2, 1, '#c81e1e'); R(6, 3, 4, 2, '#c81e1e'); R(7, 5, 2, 1, '#c81e1e'); R(7, 3, 2, 2, '#e8c040'); }
    },
    cdoor(g, e, t, R) { if (e.open) { R(2, -2, 12, 16, '#08070a'); return; } box(R, 2, -2, 12, 16, '#5a4a3a'); for (let x = 5; x < 14; x += 3) R(x, -1, 1, 14, '#4a3a2c'); R(3, 4, 10, 1, '#3a2c20'); R(11, 5, 2, 2, '#8a8a8a'); },
    redlant(g, e, t, R) { R(7, -8, 2, 3, '#333'); box(R, 3, -5, 10, 10, e.off ? '#5a2020' : '#d82222'); R(3, -5, 10, 1, '#e8c040'); R(3, 4, 10, 1, '#e8c040'); R(7, 5, 2, 4, '#e8c040'); if (!e.off) R(5, -3, 2, 6, '#ff6a5a'); },
    chaiduo(g, e, t, R) {   // 柴火垛
      box(R, 0, -10, 16, 25, '#5a3e24');
      for (let i = 0; i < 14; i++) { const x = (hash(i, 2, 9) * 13) | 0, y = -9 + ((hash(i, 5, 9) * 22) | 0); R(x, y, 3, 2, '#a8865a'); R(x + 1, y, 1, 1, '#7a5a3a'); }
      R(-1, -12, 18, 3, '#dfe6ee'); R(1, -13, 13, 1, '#eef2f6');
    },
    jiwo(g, e, t, R) { box(R, 1, 0, 14, 14, '#6a5038'); R(-1, -4, 18, 5, '#4a3828'); R(-1, -5, 18, 2, '#dfe6ee'); R(5, 6, 6, 8, '#140c08'); R(5, 12, 6, 2, '#c8a858'); if (e.open) R(6, 10, 2, 2, '#f0ead8'); },
    deadji(g, e, t, R) { R(2, 8, 6, 4, '#d8d0c0'); R(2, 8, 1, 1, '#c02020'); R(3, 9, 3, 1, '#a89880'); R(9, 10, 5, 3, '#c8b8a0'); R(13, 10, 1, 1, '#c02020'); R(5, 12, 1, 1, 'rgba(110,10,10,.8)'); R(11, 13, 1, 1, 'rgba(110,10,10,.8)'); R(6, 3, 2, 1, '#e8e0d0'); R(10, 5, 1, 2, '#e8e0d0'); },
    meihua(g, e, t, R) {   // 梅花样的小爪印
      const c = e.col || 'rgba(60,50,60,.55)';
      const p = (x, y) => { R(x, y + 2, 3, 2, c); R(x - 1, y, 1, 1, c); R(x + 1, y - 1, 1, 1, c); R(x + 3, y, 1, 1, c); };
      p(3, 4); p(10, 10);
    },
    baomi(g, e, t, R) {   // 苞米垛子
      R(0, 3, 16, 12, '#b88a26'); R(2, -3, 12, 7, '#c89a2e'); R(5, -6, 6, 4, '#d8aa3a');
      for (let i = 0; i < 16; i++) R((hash(i, e.x, 3) * 14) | 0, -4 + ((hash(e.y, i, 4) * 17) | 0), 3, 1, i % 2 ? '#e8c050' : '#a07a1e');
      R(0, 13, 16, 2, '#7a5a12');
    },
    tangzi(g, e, t, R) {   // 藏在仓房里的保家仙堂子
      R(-1, -10, 18, 3, '#3a1a10'); box(R, 1, -8, 14, 22, '#7a1818'); R(1, -8, 14, 2, '#c82828');
      R(3, -5, 10, 10, '#2a0a0a'); R(5, -4, 6, 8, '#e8d070'); R(7, -3, 2, 1, '#8a1a1a'); R(7, -1, 2, 1, '#8a1a1a'); R(7, 1, 2, 1, '#8a1a1a');
      R(2, 6, 12, 2, '#5a3a22'); R(3, 4, 2, 2, '#f0ead8'); R(11, 4, 2, 2, '#f0ead8');
      R(6, 8, 4, 3, '#6a5a3a'); if (!e.off) { R(7, 4, 1, 4, '#8a3a2a'); R(9, 5, 1, 3, '#8a3a2a'); R(7, 4, 1, 1, '#ff6a2a'); R(7, 1 - ((t * 3) % 3), 1, 2, 'rgba(220,220,220,.4)'); }
    },
    muxiang(g, e, t, R) { if (e.open) { R(0, -4, 16, 6, '#5a3a1a'); R(1, -3, 14, 4, '#3a2410'); } box(R, 0, 2, 16, 12, '#6a4a2a'); R(0, 5, 16, 1, '#3a2a1a'); R(0, 10, 16, 1, '#3a2a1a'); if (e.open) R(1, 2, 14, 3, '#1a1008'); else { R(7, 5, 2, 3, '#c9a35a'); R(7, 7, 2, 1, '#6a5a2a'); } },
    slogan(g, e, t, R) { R(-6, 3, 28, 8, 'rgba(160,40,30,.22)'); for (let i = 0; i < 6; i++) R(-5 + i * 4.5, 4, 3, 6, 'rgba(170,40,30,.5)'); R(-4, 6, 2, 1, 'rgba(90,70,60,.4)'); },
    tools(g, e, t, R) { R(3, -6, 1, 18, '#6a4a2a'); R(1, -6, 5, 1, '#888'); for (let i = 0; i < 3; i++) R(1 + i * 2, -5, 1, 2, '#888'); R(10, -4, 1, 16, '#6a4a2a'); R(8, -4, 5, 2, '#9a9a9a'); R(12, -2, 1, 1, '#9a9a9a'); },
    tangdan(g, e, t, R) {   // 出马仙的堂单（红布，两格宽）
      R(0, -6, 32, 20, '#a81c1c'); R(0, -6, 32, 1, '#e8c040'); R(0, 13, 32, 1, '#e8c040'); R(8, -4, 16, 1, '#f0d060');
      for (let c = 0; c < 8; c++) for (let r = 0; r < 4; r++) R(3 + c * 3.6, -1 + r * 3, 2, 2, (c + r) % 3 ? '#e8c040' : '#f4dc80');
    },
    xiangan(g, e, t, R) {
      box(R, 0, 1, 16, 13, '#5a2a1a'); R(1, 2, 14, 1, '#7a3a22');
      R(5, -2, 6, 4, '#8a7a4a'); R(7, -6, 1, 4, '#8a3a2a'); R(9, -5, 1, 3, '#8a3a2a'); R(8, -9 - ((t * 3) % 3), 1, 2, 'rgba(220,220,220,.4)');
      R(1, -3, 2, 5, '#e02020'); R(13, -3, 2, 5, '#e02020'); const f = Math.sin(t * 13) > 0 ? 1 : 0; R(1, -5 + f, 2, 2 - f, '#ffcf5a'); R(13, -5 + f, 2, 2 - f, '#ffcf5a');
    },
    gu(g, e, t, R) { R(4, 3, 8, 12, '#5a3a1a'); R(3, 4, 10, 10, '#5a3a1a'); R(4, 4, 8, 10, '#d8c090'); R(5, 5, 4, 2, '#e8d4a8'); R(2, 8, 1, 2, '#c9a35a'); R(13, 8, 1, 2, '#c9a35a'); R(7, 14, 2, 2, '#4a2a1a'); },
    luzi(g, e, t, R) { box(R, 3, 2, 10, 12, '#2a2a2a'); R(7, -14, 2, 17, '#3a3a3a'); R(4, 1, 8, 1, '#4a4a4a'); const f = Math.sin(t * 7) > 0 ? 1 : 0; R(5, 8, 6, 3, f ? '#ff6a2a' : '#e05a20'); },
    fen(g, e, t, R) {   // 雪盖着的坟包
      R(1, 6, 14, 8, '#cfd8e4'); R(3, 3, 10, 4, '#e2e8f0'); R(5, 2, 6, 2, '#eef2f6'); R(1, 13, 14, 2, '#7a8698');
      if ((e.x * 7 + e.y * 3) % 3 === 0) { R(7, -3, 2, 8, '#4a3a2a'); R(6, -3, 4, 1, '#5a4a3a'); }
    },
    bei(g, e, t, R) { R(3, -10, 10, 24, '#5a5a5a'); R(4, -9, 8, 22, '#7a7a78'); for (let i = 0; i < 4; i++) R(7, -6 + i * 4, 2, 2, '#5a5a58'); R(2, -11, 12, 3, '#e6ecf2'); R(1, 12, 14, 3, '#4a4a48'); },
    liu(g, e, t, R) {   // 冬天光秃秃的柳树
      const s = Math.sin(t * 1.4 + e.x) * 1.2;
      R(6, -14, 4, 28, '#2a2018'); R(-4, -20, 24, 3, '#2a2018'); R(-2, -21, 20, 1, '#dfe6ee');
      for (let i = 0; i < 8; i++) R(-4 + i * 3 + s, -17 + (i % 3), 1, 12 + (i % 4) * 3, '#3a3024');
      R(5, 12, 6, 3, '#1e1810');
    },
    yu(g, e, t, R) {   // 系着红布条的老榆树
      const s = Math.sin(t * 1.7) * 1;
      R(5, -20, 7, 35, '#2a2018'); R(3, 12, 11, 3, '#1e1810');
      R(-8, -26, 30, 3, '#2a2018'); R(-10, -31, 12, 2, '#2a2018'); R(12, -33, 12, 2, '#2a2018'); R(3, -36, 3, 12, '#2a2018');
      R(-8, -27, 30, 1, '#dfe6ee'); R(-10, -32, 12, 1, '#dfe6ee'); R(12, -34, 12, 1, '#dfe6ee');
      R(-3 + s, -23, 2, 6, '#c82020'); R(15 - s, -22, 2, 7, '#c82020'); R(9 + s, -18, 2, 5, '#d83030'); R(1 + s, -28, 2, 5, '#b81818'); R(20 - s, -30, 2, 5, '#c82020');
    },
    snowman(g, e, t, R) { R(3, 6, 10, 9, '#e2e8f0'); R(5, 0, 6, 6, '#eef2f6'); R(6, 2, 1, 1, '#111'); R(9, 2, 1, 1, '#111'); R(7, 3, 3, 1, '#e8802a'); R(1, 7, 3, 1, '#4a3a2a'); R(12, 6, 3, 1, '#4a3a2a'); R(5, -1, 6, 2, '#c82828'); },
    bulb(g, e, t, R) { R(7, -26, 2, 41, '#3a2e24'); R(3, -24, 10, 1, '#3a2e24'); R(8, -22, 6, 2, '#333'); R(10, -20, 2, 2, e.off ? '#555' : e.flicker && Math.sin(t * 37) + Math.sin(t * 11) > .4 ? '#6a6450' : '#ffe8a0'); },
    plaque(g, e, t, R) { box(R, 0, 2, 32, 9, '#e8e2d0'); for (let i = 0; i < 3; i++) R(6 + i * 8, 4, 5, 5, '#b81e1e'); },
    eggs(g, e, t, R) { R(4, 6, 3, 3, '#f0ead8'); R(8, 7, 3, 3, '#efe6d0'); R(6, 9, 3, 3, '#f4eedc'); },
    jiu(g, e, t, R) { R(6, 4, 4, 10, '#c8d8d0'); R(7, 1, 2, 3, '#c8d8d0'); R(7, 0, 2, 1, '#c82020'); R(6, 8, 4, 3, '#c82020'); },
    xiang(g, e, t, R) { R(6, 10, 5, 4, '#6a5a3a'); R(7, 4, 1, 6, '#8a3a2a'); R(9, 5, 1, 5, '#8a3a2a'); R(7, 4, 1, 1, '#ff6a2a'); R(9, 5, 1, 1, '#ff6a2a'); R(8, 1 - ((t * 3) % 3), 1, 2, 'rgba(220,220,220,.4)'); },
    hatitem(g, e, t, R) { R(1, 9, 14, 3, '#b0924c'); R(4, 5, 8, 5, '#c0a25c'); R(4, 8, 8, 1, '#8a3a1e'); R(9, 5, 2, 1, '#3a2a10'); },
    gonghuo(g, e, t, R) {   // 供在坟头的鸡蛋和一炷香
      R(3, 10, 3, 3, '#f0ead8'); R(6, 11, 3, 3, '#efe6d0'); R(11, 9, 3, 4, '#6a5a3a'); R(12, 5, 1, 4, '#8a3a2a'); R(12, 5, 1, 1, '#ff6a2a');
    }
  };

  const TILES = {
    snow: { solid: false, paint(R, X, Y) { R(0, 0, 16, 16, '#b4bfce'); for (let i = 0; i < 10; i++) R((hash(X * 13 + i, Y, 41) * 16) | 0, (hash(X, Y * 7 + i, 42) * 16) | 0, 1, 1, SNOWC[i % 3]); if (hash(X, Y, 43) < .25) R(3, 10, 5, 1, '#c8d2de'); } },
    snowp: { solid: false, paint(R, X, Y) { R(0, 0, 16, 16, '#9aa4b4'); R(0, 4, 16, 1, '#86909f'); R(0, 11, 16, 1, '#86909f'); for (let i = 0; i < 6; i++) R((hash(X + i, Y, 44) * 16) | 0, (hash(X, Y + i, 45) * 16) | 0, 2, 1, i % 2 ? '#aab4c2' : '#8c96a6'); } },
    drift: { solid: true, paint(R, X, Y) { R(0, 0, 16, 16, '#b4bfce'); R(0, 3, 16, 12, '#d4dce6'); R(1, 1, 14, 4, '#e2e8f0'); R(3, 0, 8, 2, '#eaeff5'); R(0, 14, 16, 2, '#8e9aac'); if (hash(X, Y, 46) < .5) R(9, 6, 4, 1, '#c4ceda'); } },
    spine: { solid: true, paint(R, X, Y) { TILES.snow.paint(R, X, Y); for (let i = 0; i < 7; i++) { R(7 - i, 1 + i * 2, 2 + i * 2, 2, i % 2 ? '#14261c' : '#1c3424'); if (i % 2 === 0) R(7 - i, 1 + i * 2, 2 + i * 2, 1, '#d0d8e2'); } R(7, 14, 2, 2, '#2a1c12'); } },
    sfence: { solid: true, paint(R, X, Y) { TILES.snow.paint(R, X, Y); R(0, 6, 16, 1, '#4a3826'); R(0, 11, 16, 1, '#4a3826'); for (let x = 1; x < 16; x += 3) { R(x, 2, 2, 13, '#5a4632'); R(x, 1, 2, 1, '#e2e8f0'); } } },
    brickf: { solid: false, paint(R, X, Y) { R(0, 0, 16, 16, '#5e5048'); const o = Y % 2 ? 4 : 0; R(0, 7, 16, 1, '#3e342e'); R(0, 15, 16, 1, '#3e342e'); R(o + 3, 0, 1, 7, '#3e342e'); R(o + 11, 8, 1, 7, '#3e342e'); if (hash(X, Y, 47) < .3) R(6, 3, 3, 1, '#6a5c52'); } }
  };

  const PEOPLE4 = {
    me: { skin: '#eac39c', hair: '#1e1814', hs: 'short', top: '#4a5a3a', top2: '#6a6a50', coat: true, bottom: '#2a3040', shoes: '#2a2018', hat: 'cap', hatC: '#6a5232' },
    die: { skin: '#d8a880', hair: '#2a2420', hs: 'short', top: '#2a3a5a', bottom: '#2a2a30', shoes: '#1a1a1a', hat: 'cap', hatC: '#5a4a30' },
    ma: { skin: '#e8c0a0', hair: '#1a1210', hs: 'bun', top: '#7a3a3a', bottom: '#2a2a3a', shoes: '#2a1a1a', hat: 'scarf', hatC: '#c83030' },
    nai: { skin: '#e0bea0', hair: '#c8c4bc', hs: 'bun', top: '#3a3a44', bottom: '#2a2a30', shoes: '#1a1a1a' },
    nai2: { key: 'hp-nai2', skin: '#d8b49a', hair: '#c8c4bc', hs: 'messy', top: '#3a3a44', bottom: '#2a2a30', shoes: '#1a1a1a',
      extra(g, d, fr, G, R) { if (d === 0) { R(6, G.hT + 4, 1, 1, EYE); R(9, G.hT + 4, 1, 1, EYE); R(6, G.hT + 6, 4, 1, '#3a1008'); R(6, G.hT + 6, 1, 1, '#e8e0c8'); R(9, G.hT + 6, 1, 1, '#e8e0c8'); } else if (d === 1) { R(6, G.hT + 4, 1, 1, EYE); R(5, G.hT + 6, 2, 1, '#3a1008'); } } },
    mlt: { key: 'hp-mlt', skin: '#d8b090', hair: '#9a948c', hs: 'bun', top: '#1e1e24', bottom: '#1a1a1e', shoes: '#111', hat: 'scarf', hatC: '#2a2a32',
      extra(g, d, fr, G, R) { if (d === 0) { R(10, G.hT + 6, 4, 1, '#6a4a2a'); R(13, G.hT + 4, 2, 2, '#8a8a8a'); } else if (d === 1) { R(1, G.hT + 6, 4, 1, '#6a4a2a'); R(0, G.hT + 4, 2, 2, '#8a8a8a'); } } },
    ma2: { skin: '#d0a07a', hair: '#1a1410', hs: 'short', top: '#5a4a3a', bottom: '#2a2a2a', shoes: '#1a1a1a', hat: 'cap', hatC: '#3a3a3a' },
    sun: { key: 'hp-sun', skin: '#c89870', hair: '#8a8680', hs: 'bald', top: '#2a2a30', coat: true, bottom: '#22222a', shoes: '#1a1a1a', hat: 'cap', hatC: '#6a5232',
      extra(g, d, fr, G, R) { if (d === 0) { R(5, G.hT + 7, 6, 1, '#d8d4cc'); R(10, G.hT + 6, 4, 1, '#3a2a1a'); R(13, G.hT + 5, 1, 1, '#ff6a2a'); } } },
    erya: { skin: '#f0c8a0', hair: '#1a1210', hs: 'twin', top: '#c82a2a', bottom: '#3a5a8a', shoes: '#2a1a1a', child: true, blush: '#f08080' },
    huang: wzPeople('hp-huang', 'new'),
    huangO: wzPeople('hp-huangO', 'old'),
    huangN: wzPeople('hp-huangN', null),
    huangB: wzPeople('hp-huangB', 'old', true)
  };

  /* ---------- 夜里屯子上的黄皮子（追逐） ---------- */
  const WZ = ['wz1', 'wz2', 'wz3'];
  const TUNZONE = (x, y) => x >= 1 && x <= 33 && y >= 4 && y <= 15;
  /* 它们怕光：电线杆的灯泡底下（灯没灭的时候）、亮着灯的窗户底下 */
  const UNDERBULB = (x, y) => (x - 15) ** 2 + (y - 5.5) ** 2 <= 6.3;
  function litCell(x, y) {
    const b = getEnt('bulb1', 'tun');
    if (b && !b.off && UNDERBULB(x, y)) return true;
    return (y === 4 && ((x >= 2 && x <= 4) || (x >= 7 && x <= 9) || (x >= 25 && x <= 27))) || (y === 13 && x >= 2 && x <= 4);
  }
  const WZZONE = (x, y) => TUNZONE(x, y) && !litCell(x, y);
  const wzAt = e => [Math.round(e.px / TS), Math.round(e.py / TS)];
  function wzGo(S, id, x, y, dir, spd, wait) {
    S.place(id, x, y, dir); S.ent(id).alpha = 1;
    S.chase(id, { spd, wait, zone: WZZONE, catch: wzCaught });
  }
  async function wzCaught(S) {
    S.sfx('scream'); S.shake(500, 3); squeak(S, 5);
    WZ.forEach(i => { S.stop(i); S.hide(i); });
    await S.scare('face', { spr: '@huangN', dur: 1 });
    await S.die('一团黄乎乎的东西扑上了你的胸口。\n你只记得一股骚臭味，和一双贴得很近很近的黄眼睛。\n\n第二天一早，有人在屯子外头的雪地里找到了你。\n你绕着一棵树，踩出了一圈又一圈的脚印。', '你被「迷」住了');
  }
  function wzReset(S) {
    WZ.forEach(i => { const e = S.ent(i); if (!e) return; S.stop(i); e.hidden = true; e.frozen = false; });
    const f = S.f; f._wzT = 2.2; f.hid = false; f.hidT = 0; f.lost = false; f.still = 0; f.underT = 0; f.bulbOut = 0; f.noBack = 0;
    const b = S.ent('bulb1'); if (b) { b.off = false; b.flicker = false; }
    S.hidePlayer(false);
  }
  /* 灯泡底下站久了：先「滋滋」地闪，再灭两秒多 */
  function bulbTick(S, dt) {
    const b = S.ent('bulb1'), p = S.pl, f = S.f;
    if (f.bulbOut > 0) { f.bulbOut -= dt; if (f.bulbOut <= 0) { b.off = false; b.flicker = false; S.sfx('switch'); } return; }
    const under = UNDERBULB(p.x, p.y) && !p.hidden;
    f.underT = under ? (f.underT || 0) + dt : Math.max(0, (f.underT || 0) - dt * 2);
    if (f.underT > 5 && !b.flicker) { b.flicker = true; S.sfx('switch'); S.toast('灯泡「滋滋」地响，一闪一闪的……'); }
    else if (f.underT > 8) { b.off = true; b.flicker = false; f.bulbOut = 2.6; f.underT = 0; S.sfx('glass'); squeak(S, 4); S.toast('灯，灭了。'); }
    else if (!under && b.flicker && f.underT < 3) b.flicker = false;
  }
  async function lookBack(S) {
    S.sfx('laugh'); S.fx('red'); S.shake(300, 2);
    await S.narr('你没忍住，回了一下头。\n身后没有人。雪地上一串梅花样的小爪印，一直跟到你脚后跟。');
    const p = S.pl, m = curMap(); let n = 0;
    for (const i of WZ) {
      if (n >= 2 || !S.ent(i).hidden) continue;
      for (let k = 0; k < 24; k++) {   // 就在身后，光圈外头
        const x = clamp(p.x - 3 - rnd(5), 2, 32), y = clamp(p.y + rnd(5) - 2, 4, 15);
        if (!passable(m, x, y, null) || litCell(x, y)) continue;
        wzGo(S, i, x, y, 2, 3.2, .35); S.bubble(i, '!', 700); n++; break;
      }
    }
    squeak(S, 4);
    await S.think('……说了别回头。跑！');
  }
  function wzTick(S, dt) {
    if (S.f.ph !== 'night' || S.map !== 'tun' || W.busy) return;
    const p = S.pl, f = S.f;
    /* 叫完名儿那几秒：别回头 */
    if (f.noBack > 0) { f.noBack -= dt; if (p.dir === 1 && !f.lookedBack) { f.lookedBack = true; f.noBack = 0; runScript(lookBack); return; } }
    bulbTick(S, dt);
    /* 躲在苞米垛里：待够两秒多，外头那几只就跑散了 */
    if (f.hid) {
      if (f.hidAt !== p.x + ',' + p.y) { f.hid = false; S.hidePlayer(false); f._wzT = 1.8; }
      else {
        f.hidT = (f.hidT || 0) + dt;
        if (f.hidT > 2.5 && !f.lost) { f.lost = true; WZ.forEach(i => { const e = S.ent(i); if (e && !e.hidden) { S.stop(i); e.hidden = true; } }); S.toast('外头的吱吱声，跑远了'); }
        return;
      }
    }
    const lit = litCell(p.x, p.y);
    WZ.forEach(i => {
      const e = S.ent(i); if (!e || e.hidden) return;
      const [ex, ey] = wzAt(e), d = Math.abs(ex - p.x) + Math.abs(ey - p.y);
      S.freeze(i, lit && d <= 2);   // 灯底下：挨到光边上的那只不敢上前
      if (ex < p.x - 9 || d > 16) { S.stop(i); e.hidden = true; }   // 甩远了的就不追了，换前头的上来
    });
    /* 站着不动（S.moving：客机操作时也准）：围上来的更快 */
    f.still = !S.moving && !lit ? (f.still || 0) + dt : 0;
    if (f.still > 2.2 && S.once('stillWarn')) { S.sfx('whisper'); S.toast('别停下！'); }
    f._wzT = (f._wzT ?? 2.2) - dt * (lit ? .5 : f.still > 1.2 ? 2.5 : 1);
    if (f._wzT > 0) return;
    f._wzT = 1.9 + Math.random() * 1.1;
    const free = WZ.find(i => S.ent(i).hidden);
    if (!free) return;
    const m = curMap();
    for (let k = 0; k < 16; k++) {
      const road = Math.random() < .5;   // 一半蹲在前头的大道上，一半从两边的雪地里斜插过来
      const x = clamp(p.x + (road ? 6 + rnd(4) : 3 + rnd(4)), 2, 32);
      const y = road ? 6 + rnd(2) : clamp(p.y + (Math.random() < .5 ? -1 : 1) * (2 + rnd(2)), 4, 15);
      if (Math.abs(x - p.x) + Math.abs(y - p.y) < 4 || !passable(m, x, y, null) || litCell(x, y)) continue;
      wzGo(S, free, x, y, 1, 2.9 + Math.random() * .3, .45);
      S.sfx('giggle'); squeak(S, 2); S.bubble(free, '!', 700);
      return;
    }
  }

  defChapter({
    id: 'huangpizi', n: 4, title: '黄皮子讨封', sub: '雪夜的道上，一只戴草帽的黄鼠狼人立起来，问你：「你看我像人，还是像神？」', origin: '中国东北民间传说', color: '#3a4258',
    icon: '@huang', amb: 'wind', floor: 'wood', wall: 'mud', dark: .6, plr: 3.4,
    people: PEOPLE4,
    sprites: SPRS,
    tiles: TILES,
    endings: { shan: '它上山去了', hong: '哄来的封', po: '说破了它' },
    faces: {
      /* 黄皮子：尖脸、黑眼罩、黄眼睛竖瞳，嘴越张越开、露出两排小尖牙 */
      huangN(R, a, t) {
        const D = '#1a0c06', M = '#3a2010', T = '#f8f0e0', IN = '#2a1408';
        R(0, 0, 32, 32, '#040203');
        R(7, 27, 18, 5, FUR); R(11, 26, 10, 6, BELLY);
        R(4, 5, 5, 4, FUR2); R(5, 6, 3, 2, IN); R(23, 5, 5, 4, FUR2); R(24, 6, 3, 2, IN);   // 小圆耳朵
        R(5, 7, 22, 7, FUR); R(6, 14, 20, 3, FUR); R(8, 17, 16, 3, FUR); R(10, 20, 12, 3, FUR);   // 上宽下尖的楔形脸
        R(9, 7, 14, 2, FUR2); R(14, 8, 4, 4, FUR2);
        R(6, 11, 8, 5, M); R(18, 11, 8, 5, M);   // 眼罩一样的深色毛
        const eh = 3 + Math.round(a), sl = a > .6;
        R(8, 12, 5, eh, EYE); R(19, 12, 5, eh, EYE);
        R(sl ? 10 : 9, 12, sl ? 1 : 2, eh, '#000'); R(sl ? 21 : 20, 12, sl ? 1 : 2, eh, '#000');
        R(8, 12, 1, 1, '#fff6c8'); R(19, 12, 1, 1, '#fff6c8');
        if (Math.sin(t * 23) > .7) { R(9, 13, 3, 1, '#fff6c8'); R(20, 13, 3, 1, '#fff6c8'); }
        R(9, 17, 4, 3, MUZ); R(19, 17, 4, 3, MUZ); R(12, 18, 8, 4, MUZ);   // 白嘴巴子
        R(14, 17, 4, 2, D);
        R(1, 18, 9, 1, '#e8dcc0'); R(2, 20, 8, 1, '#cfc2a4'); R(22, 18, 9, 1, '#e8dcc0'); R(22, 20, 8, 1, '#cfc2a4');
        const mh = 1 + Math.round(a * 5);
        R(12, 22, 8, mh, '#2a0606'); R(13, 22, 6, mh, '#4a0c0c');
        R(12, 22, 1, 2, T); R(19, 22, 1, 2, T); R(14, 22, 1, 1, T); R(17, 22, 1, 1, T);
        if (mh > 3) { R(13, 21 + mh, 1, 1, T); R(18, 21 + mh, 1, 1, T); }
        R(12, 22 + mh, 8, 2, BELLY);
      },
      /* 附了身的奶奶：白发乱蓬蓬，眼睛眯成缝又猛地睁开——黄眼仁、竖瞳；嘴咧到腮帮子，腮上冒出黄毛 */
      nai2(R, a, t) {
        const SK = '#d8b49a', SK2 = '#b8907a', HA = '#c8c4bc', HA2 = '#9a968e', L = '#3a1008';
        R(0, 0, 32, 32, '#050304');
        R(6, 28, 20, 4, '#3a3a44'); R(13, 26, 6, 3, SK2);
        R(11, 0, 10, 3, HA2); R(7, 2, 18, 6, HA); R(5, 5, 4, 16, HA); R(23, 5, 4, 16, HA);
        for (let i = 0; i < 6; i++) R(6 + i * 4, 1 + (i % 2), 1, 5, HA2);
        R(4, 10 + Math.round(a * 2), 1, 8, HA); R(27, 9, 1, 9 + Math.round(Math.sin(t * 3)), HA);
        R(9, 7, 14, 20, SK); R(8, 9, 1, 15, SK2); R(23, 9, 1, 15, SK2); R(10, 26, 12, 1, SK2);
        R(11, 9, 10, 1, SK2); R(12, 11, 8, 1, SK2);
        R(10, 12, 5, 1, HA2); R(17, 12, 5, 1, HA2);
        const eo = a < .35 ? 1 : 3;
        R(10, 14, 5, eo, '#f2e8c0'); R(17, 14, 5, eo, '#f2e8c0');
        R(11, 14, 3, eo, EYE); R(18, 14, 3, eo, EYE); R(12, 14, 1, eo, '#000'); R(19, 14, 1, eo, '#000');
        R(10, 17, 5, 1, SK2); R(17, 17, 5, 1, SK2);
        R(15, 15, 2, 5, SK2); R(14, 19, 4, 1, '#9a7060');
        R(11, 22, 10, 1, L); R(10, 21, 1, 1, L); R(21, 21, 1, 1, L); R(9, 20, 1, 1, L); R(22, 20, 1, 1, L);
        const mh = Math.round(a * 4);
        if (mh) { R(11, 22, 10, mh, '#1a0406'); R(12, 22, 1, 2, '#e8e0c8'); R(19, 22, 1, 2, '#e8e0c8'); R(15, 22, 2, 1, '#e8e0c8'); }
        R(9, 23, 2, 1, SK2); R(21, 23, 2, 1, SK2);
        if (a > .4) { R(7, 18, 1, 4, FUR); R(24, 17, 1, 5, FUR); R(8, 21, 1, 2, FUR2); R(23, 21, 1, 2, FUR2); }
      }
    },
    items: {
      hat: { name: '旧草帽', desc: '一顶破草帽，小得只能扣在拳头上。帽檐烧焦了一块，帽顶缝着一圈褪色的红布条。' },
      paiwei: { name: '五块牌位', desc: '巴掌大的小木牌，红漆剥落。每块背面刻着一个字：胡、黄、白、柳、灰，五家仙家一家一块。' },
      xiang: { name: '三炷香', desc: '马老太给的香，用红纸包着。「到了地方再点。」' }
    },
    notes: {
      zuowen: { title: '一九五七年的作文本', text: '（爹小时候的作文本，压在木箱底下。铅笔字，歪歪扭扭）\n\n作文　我的爹\n五年级　林德福\n\n我爹叫林老栓，是赶大车的。去年腊月，他跟孙家小叔上公社送公粮，回来走到东头老榆树那，碰上了一个黄皮子。\n\n爹回家当笑话讲，说那东西跟人似的站着，还戴个小草帽，问了他一句话。问的啥，他不告诉我。他把草帽捡回来了，挂在仓房墙上。\n\n过了年爹就咳嗽，咳了俩月，开春就没了。娘把草帽摘下来藏了，天天往仓房里送鸡蛋。娘说是黄大仙找来了。\n\n（下面一行老师的红笔字：\n封建迷信思想要不得！要相信科学。　良）' },
      tongzhi: { title: '大队的通知（一九六六年）', text: '老榆树大队革命委员会\n关于彻底清除封建迷信活动的通知\n\n各生产队：\n\n凡私设神龛、供奉「狐黄白柳灰」等所谓「仙家」者，一律限期自行拆除。跳大神、看香、「出马」等活动，坚决取缔。\n\n（通知背面，是奶奶的笔迹——她只会写几个字：\n\n「藏到苞米楼子底下了。\n　老栓欠它一句话。\n　我替他供着。」）' },
      tangdan: { title: '马老太家的堂单', text: '（红布上用金粉写着一个个名号。马老太说，这叫「堂单」，上头是她「堂口」里的仙家）\n\n胡家：胡三太爷　胡三太奶\n黄家：黄天龙　黄小妹\n白家：白老太太\n柳家：柳四爷\n灰家：灰八爷\n\n（马老太：「立堂子摆牌位，老规矩——胡家坐当中。黄家在胡家左手，白家在右手；柳家挨着黄家，灰家挨着白家。」\n「左右，是按仙家坐在龛里、脸冲外说的。左手为大。摆错了，人家不认。」）' },
      changben: { title: '马老太的手抄唱本', text: '（牛皮纸订的小本，页边磨得发黑。是请仙时「二神」要唱的词）\n\n日落西山黑了天，\n家家户户把门关。\n喜鹊老鸹奔大树，\n家雀扑棱奔房檐。\n……\n头遍鼓，请的是哪路仙家？\n——黄家的老仙家，下山来坐坐。\n\n（最后一页，另一种笔迹抄着几句，像是老辈人留下的话）\n\n讨封讨封，讨的是一句话。\n说神是哄它，说人是绝它。\n人也罢来神也罢——\n修行的，走的是修行的道。' }
    },
    legend: '「黄皮子讨封」（也叫「讨口封」）流传于东北、华北的农村。黄皮子就是黄鼬，俗称黄鼠狼。民间相信它修炼到一定年头，会在夜里或荒路上戴着草帽、披着衣裳，像人一样直立起来拦住行人，作揖发问：「你看我像人，还是像神？」据说它要借人的一句话来「封正」：答「像神」，它就得了正果，日后会报答那个人；答「像人」，或者说破它是个黄鼠狼，它多年的道行就一下子散了，从此记恨，找上门来报复。也有说法正好相反，认为替它「封神」的人反倒要折福，所以有经验的老人遇上了宁可不答，绕着走，或者绕着弯子说话。讨封的也不只是黄皮子：据说狐狸也会，蛇讨封问的则是「你看我像不像龙」。版本很多，各地并不一致。\n\n这个传说长在更大的民间信仰里。东北民间有「五大仙」或「五大家」的说法，常见的写法是「狐黄白柳灰」（「狐」常写作「胡」）——狐狸、黄鼬、刺猬、蛇、老鼠；北京、天津一带的旧说法则叫「四大门」，只算前四家。人们相信这些动物修行有成，可以「附」在人身上说话、治病、看事；被附身的人叫「弟马」或「出马仙」，把仙家供在家里保佑全家的叫「保家仙」，挂着仙家名号的红布叫「堂单」。出于敬畏，很多地方不直呼其名，管黄鼬叫「黄大仙」「黄仙」「黄二大爷」。人如果突然神志恍惚、用别人的口气说胡话，老人会说是「撞客」了，要请人来「看香」或「跳大神」：大神（被附身的人）和「二神」一唱一和，二神敲着单鼓唱「日落西山黑了天」之类的神调，请仙家下来「说道说道」。\n\n这些做法在二十世纪中叶被当作封建迷信大量禁止，八十年代以后又在一些乡村悄悄恢复。今天的研究者多把它看作北方萨满文化与汉族民间信仰交融的产物；从医学角度看，所谓「撞客」常常被解释为癔症、谵妄或某些精神疾病的表现，信与不信，当地人的说法也并不一致。至于黄鼬本身，它确实会在夜里偷鸡，常常咬住鸡的脖子，于是有了「黄鼠狼给鸡拜年」的俗话；它受惊时会放出一股浓烈的臭气，民间说它能「迷人」，大概也和这股味道有关；它还常常后腿直立、四下张望——人们在雪夜的荒路上看见一个站着的小黄影，大概就是这个故事最初的样子。\n\n（本章中的老榆树屯、林家三代、马老太、孙大爷、二丫，一九五七年的作文本、一九六六年的通知、堂单上的名号和「胡家居中、左右按仙家算」的牌位摆法、唱本最后几行的「第三种回答」以及各个结局，均为游戏虚构；神调开头几句取自东北民间流传的唱词，「左为上」的讲究在旧时的礼俗里常见。）',
    start: { map: 'tun', x: 17, y: 16, dir: 3 },
    resume: {
      night: async S => { wzReset(S); S.amb('wind'); light(S); S.plr(2.8); },
      fen: async S => { fenReset(S); }
    },
    async intro(S) {
      await S.card('第四夜　黄皮子讨封', '一九八六年　腊月二十八　黑龙江 · 老榆树屯', '在哈尔滨的厂里干了一年，\n腊月二十八，总算挤上了回屯子的最后一班车。\n\n娘在信里说：「你奶奶这些天不大对劲。\n回来再说。」');
    },
    tick(S, dt) {
      wzTick(S, dt);
      const sn = getEnt('snow_' + S.map);
      if (sn && !sn.hidden) { sn.px = Math.round(CAM.x); sn.py = Math.round(CAM.y); }
    },
    maps: {
      /* ---------------- 老榆树屯（雪地） ---------------- */
      tun: {
        amb: 'wind', dark: .62, plr: 3.4, wall: 'mud', floor: 'snow',
        wallC: { face: '#6b5a46', top: '#d6dde6' },
        legend: { 'S': 'snow', 'p': 'snowp', 'D': 'drift', 'Y': 'spine', 'F': 'sfence' },
        rows: [
          'YYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYY',
          'YS########SS#####SSSS#######SSSSSY',
          'YS########SS#####SSSS#######SSSSSY',
          'YS########SS#####SSSS#######SSSSSY',
          'YSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSY',
          'YSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSY',
          'Ypppppppppppppppppppppppppppppppppp',
          'Ypppppppppppppppppppppppppppppppppp',
          'YSSSSSSSSSSSSSSSppSSSSSSSSSSSSSSSY',
          'YSSSSSSSSSSSSSSSppSSSSSSSSSSSSSSSY',
          'YS#######SSSSSSSppSSSSSSSSSSSSSSSY',
          'YS#######SSSSSSSppSSSSFFFFFFFSSSSY',
          'YS#######SSSSSSSppSSSSFSSSSSFSSSSY',
          'YSSSSSSSSSSSSSSSppSSSSFSSSSSFSSSSY',
          'YSSSSSSSSSSSSSSSppSSSSFFFSFFFSSSSY',
          'YSSSSSSSSSSSSSSSppSSSSSSSSSSSSSSSY',
          'YYYYYYYYYYYYYYYYppYYYYYYYYYYYYYYYY',
          'YYYYYYYYYYYYYYYYppYYYYYYYYYYYYYYYY'],
        ents: [
          { id: 'snow_tun', x: 0, y: 0, spr: 'snowfx', z: 2, solid: false },
          /* 出口 */
          { x: 16, y: 17, spr: 'invisible', touch: exit('tun', 0, 0, 0, () => '末班车早开走了。\n往南三十里地都是雪，回不去了。') },
          { x: 17, y: 17, spr: 'invisible', touch: exit('tun', 0, 0, 0, () => '末班车早开走了。\n往南三十里地都是雪，回不去了。') },
          { x: 33, y: 6, spr: 'invisible', touch: exit('fen', 1, 7, 2, eastBlock) },
          { x: 33, y: 7, spr: 'invisible', touch: exit('fen', 1, 7, 2, eastBlock) },
          /* 林家 */
          { id: 'ldoor', x: 5, y: 3, spr: 'mdoor', async on(S) {
            if (S.f.ph === 'night') return S.narr('门从里面插上了。\n娘隔着门缝说：「去吧。……早点回来。」');
            S.sfx('open'); await S.go('house', 3, 8, 3);
          } },
          { x: 3, y: 3, spr: 'cwin', lit: true, light: { r: 1.6, col: 'rgba(255,190,110,.14)' }, on: S => S.narr(S.f.ph === 'night' ? '窗户上的霜花里，映着炕头那盏油灯。\n奶奶的影子一动不动地坐着。' : '自家的窗户。窗花是娘剪的，一对喜鹊登梅。\n玻璃上结了一层厚厚的霜。') },
          { id: 'lwin2', x: 8, y: 3, spr: 'cwin', lit: true, light: { r: 1.6, col: 'rgba(255,190,110,.14)' }, on: S => S.narr(S.f._o_peek ? '里屋的窗。霜花上，有两个小小的圆印子，像是让什么东西的鼻头哈化了。\n印子的位置很低——比二丫还矮。' : '里屋的窗。热气从窗缝里往外冒，一出来就冻成了白霜。') },
          { id: 'jiwo', x: 11, y: 4, spr: 'jiwo', on: S => jiwoOn(S) },
          { x: 10, y: 5, spr: 'deadji', decal: true, on: S => S.narr('雪地上躺着两只死鸡，脖子上各有两个小小的牙眼儿。\n血没流多少——像是被什么东西喝干了。') },
          { id: 'chaiduo', x: 1, y: 4, spr: 'chaiduo', on: S => chaiOn(S) },
          /* 仓房 */
          { x: 13, y: 3, spr: 'cdoor', async on(S) {
            const ph = S.f.ph;
            if (ph === 'arrive') return S.narr('自家的仓房。门上的铁鼻儿冻得粘手。\n先进屋见见娘吧。');
            if (ph === 'night') return S.narr('仓房里黑洞洞的。\n今晚，那里头的「人」都不在家。');
            S.sfx('open'); await S.go('cang', 5, 6, 3);
          } },
          { x: 15, y: 3, spr: 'slogan', on: S => S.narr('仓房墙上一条刷了又刷的旧标语，红漆都褪成粉的了。\n还能认出四个字：「破除迷信」。') },
          /* 马老太家 */
          { x: 24, y: 3, spr: 'mdoor', async on(S) {
            const ph = S.f.ph;
            if (ph === 'arrive') return S.narr('马老太家。门口挂着一盏红灯笼，屯子里的人说她「有堂口」。\n先回家吧。');
            if (ph === 'night') return S.narr('马老太家的灯笼灭了。\n她说过，今晚这道门谁敲都不开。');
            if (ph === 'ritual') return S.narr('屋里叮叮当当的，马老太在翻箱子找家什。\n「回家等着去！」她隔着门喊，「唱本看熟了没？」');
            S.sfx('open'); await S.go('mama', 6, 7, 3);
          } },
          { id: 'redlant', x: 22, y: 3, spr: 'redlant', light: { r: 2.6, col: 'rgba(255,80,60,.2)' }, on: S => S.narr(S.f.ph === 'night' ? '红灯笼灭了，在风里一下一下地撞着门框。' : '红灯笼底下吊着一串铜钱，风一吹，叮当叮当地响。\n屯里人说，挂这个的人家，是能「看事儿」的。') },
          { x: 26, y: 3, spr: 'cwin', lit: true, light: { r: 1.6, col: 'rgba(255,170,90,.14)' }, on: S => S.narr('马老太家的窗户上贴着一张黄纸，画着看不懂的道道。\n屋里有股烧香的味儿，隔着窗户都闻得着。') },
          /* 孙大爷家 */
          { x: 5, y: 12, spr: 'cdoor', on: S => S.narr('孙大爷家的门。门槛底下垫着一只破棉鞋挡风。\n他老伴前年没了，屋里就他一个人。') },
          { x: 3, y: 12, spr: 'cwin', lit: true, light: { r: 1.4, col: 'rgba(255,190,110,.12)' }, on: S => S.narr('窗台上摆着一排冻梨，黑黢黢的，硬得像石头。') },
          { id: 'sun', x: 7, y: 13, spr: '@sun', dir: 0, light: { r: 1.2, col: 'rgba(255,120,40,.12)', dy: 2 }, on: S => sunOn(S) },
          /* 路上 */
          { id: 'bulb1', x: 15, y: 5, spr: 'bulb', light: { r: 3.4, col: 'rgba(255,220,150,.16)', dy: -16 }, on: S => S.narr('电线杆上吊着一只灯泡，屯里八三年才通的电。\n灯泡底下飘着雪，一圈一圈的。') },
          { id: 'bulb2', x: 19, y: 13, spr: 'bulb', light: { r: 3.2, col: 'rgba(255,220,150,.14)', dy: -16 }, on: S => S.narr('另一根电线杆。上面贴着一张卫生所的告示，写着「预防煤烟中毒」。') },
          { x: 18, y: 15, spr: 'busstop', on: S => S.narr('「老榆树屯」站牌。一天两班车，早一班，晚一班。\n站牌底下的雪，被你踩出一串新脚印。') },
          { x: 31, y: 5, spr: 'sign', col: '#5a4a32', on: S => S.narr('木牌子上写着：「往东　坟茔地　老榆树」。\n字是用烧火棍写的，让雪埋了一半。') },
          { x: 21, y: 8, spr: 'snowman', on: S => S.narr('二丫堆的雪人，鼻子是根胡萝卜，围脖是块红布头。\n雪人的脚底下，有一圈梅花样的小爪印，绕着它转了好几圈。') },
          { id: 'erya', x: 20, y: 8, spr: '@erya', dir: 1, on: S => eryaOn(S) },
          { x: 24, y: 12, spr: 'baomi', on: S => baomiOn(S) },
          { x: 26, y: 12, spr: 'baomi', on: S => baomiOn(S) },
          { x: 30, y: 9, spr: 'sack', col: '#8a7a5a', on: S => S.narr('一袋冻土豆，不知谁家落在道边的。袋口被咬开了一个洞。') },
          ...[[9, 6], [12, 7], [18, 5], [20, 4], [23, 6], [27, 7], [30, 6], [13, 9], [25, 13]].map(([x, y], i) => ({ id: 'mh' + i, x, y, spr: 'meihua', decal: true, solid: false })),
          { x: 12, y: 7, spr: 'invisible', solid: false, on: S => S.narr('雪地上一串梅花样的小爪印，一个挨一个，从仓房一直通到屯子东头。\n奇怪的是——走到一半，爪印变成了两行。像是那东西，站起来走了。') },
          ...[[2, 15], [30, 15], [31, 4], [23, 13], [32, 10], [10, 15], [27, 4]].map(([x, y], i) => ({ id: 'ey' + i, x, y, spr: 'eyes', hidden: true, solid: false, light: { r: .4, a: .75, col: 'rgba(255,200,40,.5)' } })),
          ...WZ.map(id => ({ id, x: 2, y: 9, spr: 'wz', hidden: true, solid: false }))
        ],
        async enter(S, first) {
          light(S);
          const ph = S.f.ph;
          if (first) {
            S.f.ph = 'arrive';
            await S.narr('班车扬起一阵雪沫子，开走了。\n下午四点，天已经擦黑。屯子里家家户户的烟囱都冒着烟。');
            await S.think('一年没回来了。……娘说奶奶「不大对劲」，是啥意思？');
            S.goal('回家（屯子西头，贴春联那家）');
            return;
          }
          if (ph === 'invest' && S.once('peek')) {   // 一出门：里屋窗户的霜花上贴着一张小脸
            await S.wait(450);
            S.ent('lwin2').face = true; squeak(S, 2);
            await S.wait(700);
            S.bubble('pl', '!', 800); S.face('pl', 2);
            S.ent('lwin2').face = false;
            await S.think('……里屋窗户的霜花上，刚才是不是贴着一张小脸？');
          }
          if (ph === 'ritual') S.hide('erya');   // 天擦黑，二丫让她娘喊回家了
          if (ph === 'night') {
            ['erya', 'sun'].forEach(i => S.hide(i));
            for (let i = 0; i < 7; i++) S.show('ey' + i);
            S.ent('redlant').off = true; S.ent('bulb2').off = true; S.ent('snow_tun').s.heavy = true;
            S.plr(2.8); S.amb('wind');
            if (S.once('nightOut')) {
              await S.narr('外头的雪下大了。风卷着雪，打在脸上生疼。');
              S.sfx('giggle'); squeak(S, 3, .3);
              await S.narr('屯子里的狗，一声都不叫。\n雪地里，东一对、西一对，亮起了黄豆大的小眼睛。');
              await S.think('马老太说了：别停下，别回头，有人喊名儿也别答应。\n跑不动了，就上灯底下站站——可别站久了。');
              S.goal('往东跑！穿过屯子，去坟圈子的老榆树');
              S.toast('灯泡底下、亮灯的窗户底下，它们不敢过来；东边地里的苞米垛也能躲');
              S.cp('night');
            }
            wzReset(S);
          }
        },
        step(S, x, y) {
          if (S.f.ph === 'arrive' && y <= 10 && S.once('meetErya')) return meetErya(S);
          if (S.f.ph === 'night' && x >= 15 && x <= 18 && S.once('callName')) return callName(S);   // 往东必经这几列，哪一行都躲不开
        }
      },
      /* ---------------- 林家（外屋地 + 里屋） ---------------- */
      house: {
        amb: 'fire', dark: .58, plr: 3.4, wall: 'mud', floor: 'lightwood',
        wallC: { face: '#c8b896', top: '#1e1812' },
        legend: { 'Q': 'brickf' },
        rows: [
          '####################',
          '####################',
          '#QQQQQQ#...........#',
          '#QQQQQQ#...........#',
          '#QQQQQQ#...........#',
          '#QQQQQQ#...........#',
          '#QQQQQQQ...........#',
          '#QQQQQQ#...........#',
          '#QQQQQQ#...........#',
          '###Q################'],
        ents: [
          { id: 'hexit', x: 3, y: 9, spr: 'invisible', touch: exit('tun', 5, 4, 0) },
          /* 外屋地 */
          { x: 2, y: 2, spr: 'zaotai', light: { r: 2.4, col: 'rgba(255,140,60,.2)', flick: true }, on: S => S.narr(S.f.ph === 'night' ? '灶坑里的火压着，锅里温着一锅水。\n娘说，等你回来烫烫脚。' : '大锅里炖着酸菜白肉，咕嘟咕嘟冒泡。\n锅盖一掀，一屋子都是白气。') },
          { x: 4, y: 2, spr: 'vat', stone: true, on: S => S.narr('酸菜缸，上面压着一块大青石头。\n这块石头是爷爷从河套里背回来的，压了三十年酸菜。') },
          { x: 5, y: 2, spr: 'vat', on: S => S.narr('水缸里结了一层薄冰。舀水的瓢冻在了冰面上。') },
          { x: 1, y: 5, spr: 'wanjia', on: S => S.narr('碗架子。最上层摆着几个蓝边大碗，是过年才拿下来用的。') },
          { x: 6, y: 8, spr: 'barrel', col: '#4a3a2a', on: S => S.narr('一缸冻豆包，黄米面的，是娘年前蒸好冻上的。') },
          { x: 1, y: 8, spr: 'box', on: S => S.narr('柴火筐，里面码着劈好的豆秸和苞米瓤子。') },
          { id: 'ma', x: 4, y: 5, spr: '@ma', dir: 0, on: S => maOn(S) },
          /* 里屋 */
          { id: 'nai', x: 9, y: 3, oy: -5, z: 1, spr: '@nai', dir: 3, on: S => naiOn(S) },
          { id: 'mlt_h', x: 11, y: 3, oy: -5, z: 1, spr: '@mlt', dir: 0, hidden: true, on: S => S.say('马老太', '别吱声。') },
          { x: 14, y: 3, z: 1, spr: 'beiduo', on: S => S.narr('炕梢码着被垛，被面是大红大绿的牡丹花。\n最底下那床，是你小时候盖过的。') },
          { x: 12, y: 3, z: 1, spr: 'kangtable', on: S => S.narr(S.f.ph === 'arrive' || S.f.ph === 'invest' ? '炕桌上摆着酸菜白肉、蘸酱菜，还有一盘冻梨。\n奶奶那双筷子，一直没动过。' : '炕桌收起来了，只剩一圈油印子。') },
          { id: 'hlamp', x: 13, y: 3, z: 1, spr: 'oillamp', light: { r: 3.6, col: 'rgba(255,190,100,.22)', flick: true }, on: S => S.narr('煤油灯。屯里通了电，可奶奶说电灯「晃眼睛」，炕头还是点这个。') },
          { x: 11, y: 1, spr: 'cwin', on: S => S.narr('北窗。窗户缝里塞着棉花条子，霜花一直长到了窗框上。') },
          { x: 16, y: 1, spr: 'nianhua', on: S => S.narr('墙上贴着新年画：胖娃娃抱鲤鱼。\n旁边是去年的那张，已经让烟熏黄了，没舍得揭。') },
          { x: 18, y: 1, spr: 'wallclock', on: S => S.narr(S.f.ph === 'night' ? '挂钟指着十一点四十。\n钟摆的声音，在这屋里显得特别响。' : '挂钟指着四点半。钟摆一下一下的，跟你小时候一样。') },
          { x: 17, y: 1, spr: 'portrait', on: S => S.narr('墙上镶着一张黑白照片：一个戴狗皮帽子的庄稼汉，站在一挂大车旁边，咧着嘴笑。\n是爷爷。你没见过他。') },
          { x: 15, y: 2, spr: 'muxiang', on: S => S.narr('炕梢头奶奶的炕琴柜。上面落了一把锁。\n娘说，奶奶这些天老是半夜起来，摸着这把锁，一摸就是半宿。') },
          { id: 'die', x: 12, y: 6, spr: '@die', dir: 1, on: S => dieOn(S) },
          { id: 'kang', x: 8, y: 2, w: 7, h: 2, spr: 'kang', col: '#c9a86a', on: S => S.narr(S.f.ph === 'night' ? '炕还热乎着。奶奶睡着了，被子盖到下巴。' : '烧得滚烫的火炕。炕席底下压着几张旧报纸，炕头最热的地方，是奶奶的位置。') }
        ],
        async enter(S, first) {
          light(S);
          if (S.f.ph === 'arrive' && S.once('dinner')) return dinner(S);
          if (S.f.ph === 'ritual' && S.once('ritualIn')) return ritual(S);
        }
      },
      /* ---------------- 仓房 ---------------- */
      cang: {
        amb: 'drone', dark: .82, plr: 2.9, wall: 'wood', floor: 'dirt',
        wallC: { face: '#4a3a2a', top: '#16110c' },
        rows: [
          '############',
          '############',
          '#dddddddddd#',
          '#dddddddddd#',
          '#dddddddddd#',
          '#dddddddddd#',
          '#dddddddddd#',
          '#####d######'],
        ents: [
          { x: 5, y: 7, spr: 'invisible', touch: exit('tun', 13, 4, 0) },
          { id: 'tangzi', x: 2, y: 1, spr: 'tangzi', off: true, on: S => tangOn(S) },
          { id: 'tlight', x: 2, y: 2, spr: 'invisible', solid: false, hidden: true, light: { r: 2.4, col: 'rgba(255,90,60,.18)', flick: true } },
          { x: 10, y: 1, spr: 'tools', on: S => S.narr('墙上挂着二齿钩子、木锨和一把冻得梆硬的镰刀。\n镰刀把上缠着红布——过年了，家伙什儿也得「挂红」。') },
          { x: 6, y: 1, spr: 'invisible', solid: true, on: S => S.narr('墙上钉着一排木头橛子，挂着一辫一辫的干辣椒和蒜。\n有一橛子空着，下面的墙皮上，留着一个草帽大小的白印子。') },
          { id: 'muxiang', x: 8, y: 2, spr: 'muxiang', on: S => boxOn(S) },
          { x: 4, y: 2, spr: 'sack', on: S => S.narr('一麻袋黄豆，开春要下种的。袋子底下有一圈黄乎乎的毛。') },
          { x: 5, y: 2, spr: 'barrel', on: S => S.narr('一缸荤油，冻成了白花花的一坨。缸沿上有几道小爪子挠过的印子。') },
          { id: 'baomi_c', x: 1, y: 5, spr: 'baomi', on: S => baomiC(S) },
          { x: 1, y: 6, spr: 'baomi', on: S => S.narr('苞米棒子码成的垛，一冬天的烧柴和口粮都在这儿。') },
          { x: 10, y: 5, spr: 'lantern', light: { r: 2.6, col: 'rgba(255,170,80,.18)', flick: true }, on: S => S.narr('一盏马灯挂在柱子上，玻璃罩子熏黑了半边。') },
          { x: 9, y: 6, spr: 'crate', on: S => S.narr('装冻梨冻柿子的木头箱子。柿子少了好几个，箱缝里卡着半个，被啃得只剩一层皮。') },
          { id: 'ceye', x: 10, y: 3, spr: 'eyes', hidden: true, solid: false, light: { r: .4, a: .75, col: 'rgba(255,200,40,.5)' } },
          { id: 'cwz', x: 10, y: 4, spr: 'wz', hidden: true, solid: false }
        ],
        async enter(S, first) {
          light(S);
          if (first) {
            await S.narr('仓房里冷得跟冰窖一样，一股苞米和耗子屎的味儿。\n马灯一晃，墙上的影子跟着晃。');
            if (S.f.mlt) S.goal(goalText(S));
          }
        }
      },
      /* ---------------- 马老太家 ---------------- */
      mama: {
        amb: 'fire', dark: .55, plr: 3.2, wall: 'mud', floor: 'lightwood',
        wallC: { face: '#a89878', top: '#1a140e' },
        rows: [
          '##############',
          '##############',
          '#............#',
          '#............#',
          '#............#',
          '#............#',
          '#............#',
          '#............#',
          '######.#######'],
        ents: [
          { x: 6, y: 8, spr: 'invisible', touch: exit('tun', 24, 4, 0) },
          { x: 2, y: 1, w: 2, spr: 'tangdan', on: S => { S.f.tdRead = true; return S.note('tangdan'); } },
          { x: 4, y: 2, spr: 'xiangan', light: { r: 2.6, col: 'rgba(255,120,60,.2)', flick: true }, on: S => S.narr('供桌上摆着两根红蜡、一碗小米插着香，还有一盘煮鸡蛋，一盅烧酒。\n香灰积了厚厚一层，没断过。') },
          { x: 5, y: 2, spr: 'eggs', solid: true, on: S => S.narr('剥了皮的煮鸡蛋，白生生的，摞成一个小尖。\n屯里人说，黄家仙爱吃这口。') },
          { x: 6, y: 1, spr: 'cwin', lit: false, on: S => S.narr('窗户上糊着报纸，报纸上用红笔圈了一个日子：腊月二十八。\n今天。') },
          { id: 'gu', x: 6, y: 4, spr: 'gu', on: S => S.narr('一面单鼓，羊皮蒙的，鼓边上拴着一串铁环。\n马老太说，这是「二神」敲的。大神请仙，二神帮腔。') },
          { x: 2, y: 6, spr: 'luzi', light: { r: 3, col: 'rgba(255,130,50,.22)', flick: true }, on: S => S.narr('铁炉子烧得通红，炉盖子上烤着两个土豆。') },
          { x: 12, y: 6, spr: 'cabinet', col: '#6a3a2a', on: S => S.narr('炕琴柜上摆着一张黑白照片：一个梳着大辫子的姑娘，跟现在的马老太眉眼一模一样。\n「那是我娘，」马老太说，「她也是干这个的。」') },
          { id: 'mlt', x: 10, y: 3, oy: -5, z: 1, spr: '@mlt', dir: 0, on: S => mltOn(S) },
          { x: 12, y: 3, z: 1, spr: 'jiu', on: S => S.narr('一瓶「北大荒」，喝了半瓶。马老太说，这是给「老仙家」预备的。') },
          { id: 'mkang', x: 8, y: 2, w: 5, h: 2, spr: 'kang', col: '#b89a5e', on: S => S.narr('马老太家的炕，炕沿磨得发亮。\n来找她看事儿的人，都坐在这炕沿上。') }
        ],
        async enter(S, first) {
          light(S);
          if (first) { S.bubble('mlt', '…', 1400); await S.narr('屋里烧着香，烟熏火燎的。\n一个瘦小的老太太盘腿坐在炕上，叼着烟袋，眼睛半睁半闭。'); }
        }
      },
      /* ---------------- 坟圈子 · 老榆树 ---------------- */
      fen: {
        amb: 'wind', dark: .9, plr: 2.6, wall: 'mud', floor: 'snow',
        legend: { 'S': 'snow', 'p': 'snowp', 'Y': 'spine' },
        rows: [
          'YYYYYYYYYYYYYYYYYYYYYY',
          'YSSSSSSSSSSSSSSSSSSSSY',
          'YSSSSSSSSSSSSSSSSSSSSY',
          'YSSSSSSSSSSSSSSSSSSSSY',
          'YSSSSSSSSSSSSSSSSSSSSY',
          'YSSSSSSSSSSSSSSSSSSSSY',
          'YSSSSSSSSSSSSSSSSSSSSY',
          'pppppppppppppSSSSSSSSY',
          'YSSSSSSSSSSSSSSSSSSSSY',
          'YSSSSSSSSSSSSSSSSSSSSY',
          'YSSSSSSSSSSSSSSSSSSSSY',
          'YSSSSSSSSSSSSSSSSSSSSY',
          'YSSSSSSSSSSSSSSSSSSSSY',
          'YYYYYYYYYYYYYYYYYYYYYY'],
        ents: [
          { id: 'snow_fen', x: 0, y: 0, spr: 'snowfx', z: 2, solid: false, s: { heavy: true } },
          { x: 0, y: 7, spr: 'invisible', touch: exit('tun', 32, 7, 1, () => '（马老太说过：上了道，就别回头。）') },
          { id: 'yu', x: 11, y: 4, spr: 'yu', on: S => S.narr('老榆树。屯里的老人说，它比屯子还老。\n枝杈上系满了红布条，是这些年来许愿、还愿的人系上的。') },
          { x: 4, y: 3, spr: 'fen', on: S => S.narr('一座老坟，雪把它埋得只剩一个圆鼓包。\n坟头插着一根柳木哭丧棒，已经发了芽，又冻死了。') },
          { x: 7, y: 10, spr: 'fen', on: S => S.narr('坟前的雪被扒开了一块，露出一个碗口大的洞。\n洞口的雪上，全是梅花样的小爪印。') },
          { x: 16, y: 3, spr: 'fen', on: S => S.narr('坟包上的雪化了又冻，结了一层亮晶晶的冰壳。') },
          { x: 17, y: 9, spr: 'fen', on: S => S.narr('一座没有碑的坟。\n孙大爷说过，爷爷就埋在东边这一片。') },
          { x: 5, y: 11, spr: 'fen' }, { x: 14, y: 11, spr: 'fen' }, { x: 19, y: 5, spr: 'fen' },
          { x: 8, y: 3, spr: 'bei', on: S => { S.f.sawEggs = true; return S.narr('一块石碑，字让风雪磨平了，只看得清一个「林」字。\n碑前摆着两个冻得梆硬的鸡蛋——有人比你先来过。'); } },
          { x: 13, y: 5, spr: 'gonghuo', decal: true, light: { r: .9, col: 'rgba(255,110,40,.3)', flick: true, dx: 12, dy: 6 }, on: S => S.narr('树底下供着几个鸡蛋，一炷香烧得只剩个香根。\n不知是谁家的人，年年来这儿上供。') },
          ...[[8, 5], [14, 6], [7, 8], [15, 9], [10, 10], [12, 10], [9, 2], [13, 2], [3, 6], [18, 7]].map(([x, y], i) => ({ id: 'fe' + i, x, y, spr: 'eyes', hidden: true, solid: false, light: { r: .4, a: .75, col: 'rgba(255,200,40,.5)' } })),
          { id: 'hz', x: 11, y: 6, spr: '@huangN', dir: 0, hidden: true, solid: false, light: { r: 1.6, col: 'rgba(255,200,120,.16)' }, on: S => S.narr('它站在那儿，等着。') },
          { id: 'hatE', x: 12, y: 7, spr: 'hatitem', hidden: true, solid: false }
        ],
        async enter(S, first) {
          light(S);
          if (S.once('fenIn')) {
            await S.narr('出了屯子，风一下子停了。\n雪还在下，静得能听见雪落在雪上的声音。');
            await S.narr('坟圈子当中，那棵老榆树黑黢黢地立着，枝杈上的红布条一动不动。');
            S.goal('走到老榆树底下');
            S.cp('fen');
          }
        },
        step(S, x, y) {
          if (S.f.ph === 'night' && x >= 8 && x <= 14 && y >= 5 && y <= 9 && S.once('finale')) return finale(S);
        }
      }
    }
  });

  /* ================= 剧情 ================= */
  function goalText(S) {
    const t = [];
    if (!S.f.tangOK) t.push('立起仓房里的堂子');
    if (!S.has('hat')) t.push('找回那顶草帽');
    if (!S.f.sunTold) t.push('问孙大爷三十年前的事');
    return t.length ? t.join(' · ') : '回马老太家';
  }
  function upGoal(S) { if (S.f.ph === 'invest' && S.f.mlt) S.goal(goalText(S)); }
  function eastBlock(S) {
    if (S.f.ph === 'night') return null;
    return S.f.ph === 'arrive' ? '往东是坟圈子。天都黑了，先回家吧。' : '往东是坟圈子和老榆树。\n这会儿去那儿干啥？先把马老太交代的事办了。';
  }

  async function meetErya(S) {
    S.bubble('erya', '!', 900);
    await S.say('小丫头', '建军哥——！');
    await S.walk('erya', [S.pl.x + 1 <= 32 ? S.pl.x + 1 : S.pl.x - 1, S.pl.y], 5);
    S.face('erya', 'pl'); S.face('pl', 'erya');
    await S.say('二丫', ['建军哥你回来啦！我娘说你在哈尔滨当工人，天天吃面包！', '……我跟你说个事儿。你奶奶撞客了！']);
    const r = await S.ask('「撞客」？', ['瞎说，啥撞客。', '……啥叫撞客？'], '二丫');
    if (r === 0) await S.say('二丫', '才不是瞎说！我娘说的！');
    else await S.say('二丫', '就是让「啥东西」给附上了呗！说话跟换了个人似的！');
    await S.say('二丫', ['前天半夜，我起来尿尿，从窗户里看见你奶奶站在你家当院里，光着脚。', '冲着东边，一个劲儿地作揖。嘴里念叨：帽子、帽子……', '我娘说，是黄皮子。黄皮子会戴草帽，还会站起来走道儿！']);
    S.bubble('erya', '?', 900);
    await S.say('二丫', '建军哥，你见过黄皮子戴草帽吗？');
    await S.think('……小孩子瞎说。可是光着脚站在雪地里？');
    S.goal('回家（屯子西头，贴春联那家）');
  }
  async function eryaOn(S) {
    S.face('erya', 'pl');
    if (S.f.ph === 'arrive' && !S.f._o_meetErya) { S.f._o_meetErya = true; return meetErya(S); }
    await S.say('二丫', cycle(S, '_ey', ['黄皮子会拜月亮！我姥姥说的，拜够了一百年就能变成人。', '我家的鸡也让黄皮子叼走一只。我奶说，黄鼠狼给鸡拜年——没安好心！', '你看我堆的雪人！……它脚底下那些爪印不是我踩的。', '马奶奶家的灯笼一到晚上就亮，我娘不让我上她家门口玩。']));
  }
  async function sunOn(S) {
    S.face('sun', 'pl');
    const ph = S.f.ph;
    if (ph === 'arrive') return S.say('孙大爷', '这不老林家的建军嘛！回来过年啦？快家去，你娘天天上道口望你。');
    if (!S.f.mlt) return S.say('孙大爷', ['你奶奶的事儿？……唉。', '这事儿我说不明白。你上马家，找马老太去。']);
    if (S.f.sunTold) return S.say('孙大爷', cycle(S, '_sn', ['「说神是哄它，说人是绝它」……后半句，我是真想不起来了。马家她娘那时候在场，兴许留下啥了。', '你爷那人，一辈子没说过一句瞎话。', '天黑了别往东边去。真要去，也别一个人。……唉，它就认你们老林家的人。']));
    await S.narr('孙大爷蹲在自家门口抽旱烟，烟袋锅一明一灭。\n他听你说完，半天没吭声。');
    await S.say('孙大爷', ['三十年了……你爷走的那年，我十八。那年腊月，我跟你爷赶大车上公社送公粮，回来天就黑透了，也是这么大的雪。', '走到东头老榆树那儿，马忽然就惊了，前蹄子刨着雪，说啥不往前走。']);
    S.sfx('heart');
    await S.say('孙大爷', ['道当间儿，站着个东西。一尺来高，跟人似的立着。', '脑瓜顶上扣个小草帽，两只前爪子抱在一块儿——冲我们作揖。', '它张嘴说话了。声儿尖尖的，跟个小老太太似的——']);
    await S.say('孙大爷', '「大哥，你看我像人，还是像神？」', { style: 'whisper' });
    await S.say('孙大爷', ['我吓得一头钻进草料堆里了。你爷喝了两口酒，胆儿大。', '他攥着鞭子瞅了半天，说——「我看你像个人。」']);
    const r = await S.ask('「我看你像个人。」', ['我爷是故意的？', '它……后来呢？']);
    if (r === 0) await S.say('孙大爷', ['不是。你爷那人实在，看着啥就说啥。他是真那么看的。', '可这话……不能这么说。']);
    await S.say('孙大爷', ['那东西「嗷」一嗓子就趴下了，在雪里打滚，叫得跟小孩哭似的。草帽掉了，你爷给捡回来了。', '过了年你爷就病了，开春人就没了。屯里都说是黄家报的仇。']);
    await S.say('孙大爷', ['后来，屯里来过一个游方的老道，在马家老太太她娘那儿坐了一宿。他说了一句话，我就记住了半句：', '「说神是哄它，说人是绝它。」', '后半句……我那时候年轻，没往心里去。马家她娘兴许给记下来了。']);
    S.f.sunTold = true; upGoal(S); S.cp();
  }
  async function maOn(S) {
    S.face('ma', 'pl');
    const ph = S.f.ph;
    if (ph === 'night') return S.say('娘', ['军儿……你可得囫囵个儿回来。', '……娘给你温着洗脚水。']);
    if (S.f.mlt && !S.has('hat') && !S.f.hatHint) { S.f.hatHint = true; return S.say('娘', ['草帽？那顶破草帽啊……你爹拾掇仓房的时候翻出来的。', '我瞅着瘆得慌，没敢烧，随手扔鸡窝顶上了。就在仓房边上那个鸡窝。']); }
    await S.say('娘', cycle(S, '_ma', ['饿了吧？锅里有酸菜，先垫补两口。', '你奶奶这样已经三宿了。白天睡，晚上坐着，冲墙念叨。', '我嫁过来那年，就见你奶奶天天往仓房里送鸡蛋。我问她，她只说是「供着」。', '去找马老太。屯东头，门口挂红灯笼那家。']));
  }
  async function dieOn(S) {
    S.face('die', 'pl');
    const ph = S.f.ph;
    if (ph === 'night') return S.say('爹', ['……我不信这个。', '可你奶奶要是真能好……你去吧。我在门口等你。']);
    if (S.f.mlt && !S.has('paiwei') && !S.f.tangOK && !S.f.pwHint) { S.f.pwHint = true; return S.say('爹', ['牌位？那几块破木头牌子？', '……扔当院柴火垛上了，本来想劈了烧火。', '你也跟着她们折腾？……行，行，随你们。']); }
    await S.say('爹', cycle(S, '_die', ['卫生所的大夫来看过，说是血压高，老年人糊涂。开春上县医院拍个片子。', '那仓房开春要扒了接房子。我总不能留着个神龛子不让扒吧。', '你爷？我十二岁那年他就没了。过了年就咳，咳了俩月，开春人就没了。卫生所说是痨病。', '……你奶奶这辈子，就信这个。']));
  }
  async function naiOn(S) {
    const ph = S.f.ph;
    if (ph === 'night') return S.narr('奶奶睡着了，呼吸轻轻的。\n她的手在被子外头攥着，攥成一个拳头，像攥着啥东西。');
    S.bubble('nai', '…', 1400);
    await S.narr('奶奶背冲着你坐着，脸贴着墙，嘴里念念叨叨的。');
    await S.say('奶奶', cycle(S, '_nai', ['……帽子……帽子……', '……三十年了……', '老栓……你倒是说句话呀……', '……冷……雪地里……好冷……']), { style: 'whisper' });
  }

  /* ---------- 到家 ---------- */
  async function dinner(S) {
    S.face('ma', 'pl'); S.bubble('ma', '!', 800);
    await S.say('娘', '军儿！可算回来了！快脱鞋上炕，冻坏了吧！');
    S.face('die', 'pl');
    await S.say('爹', '回来了。……上炕，暖和暖和。');
    await S.narr('屋里热气腾腾的，一股酸菜炖肉的香味。\n奶奶盘腿坐在炕头上，脸冲着墙，一动不动。');
    await S.say('建军', '奶奶，我回来了。');
    await S.wait(900);
    await S.narr('奶奶没回头。\n娘扯了扯你的袖子，小声说：「你奶奶这几天……就这样。别吓着她。」');
    await S.fade(1, 600);
    await S.narr('一家人围着炕桌吃了饭，谁也没怎么说话。\n挂钟「当、当」地敲了五下。');
    await S.fade(0, 600);
    S.sfx('heart'); S.ent('hlamp').light = { r: 2, col: 'rgba(255,190,100,.12)', flick: true };
    await S.narr('煤油灯的火苗，忽然往下一缩。');
    await S.wait(500);
    S.ent('nai').spr = '@nai2'; S.face('nai', 0); squeak(S, 2);
    await S.narr('奶奶慢慢地，慢慢地，把脸转了过来。');
    await S.say('奶奶', '老林家的小子……回来啦？', { style: 'whisper' });
    await S.narr('那不是奶奶的声音。\n尖尖的，细细的，像个小老太太捏着嗓子说话。');
    await S.say('奶奶', '我的帽子呢？', { style: 'big' });
    await S.scare('face', { spr: '@nai2', dur: 1.1 });
    S.ent('nai').spr = '@nai'; S.face('nai', 3);
    S.ent('hlamp').light = { r: 3.6, col: 'rgba(255,190,100,.22)', flick: true };
    await S.narr('奶奶「咕咚」一声歪在被垛上，打起了呼噜。\n就跟什么事都没发生过一样。');
    await S.say('娘', '就是这个！一到天黑就来！');
    await S.say('爹', ['前些日子我拾掇仓房，开春要扒了接一间房。旮旯里藏着个破神龛子，几块木头牌位、一顶破草帽——我全给拆了扔了。', '打那天起，你奶奶就这样了。']);
    await S.say('娘', '那是你妈偷着供了快三十年的！');
    await S.say('爹', '供啥？供个黄鼠狼？啥年代了！');
    const r = await S.ask('爹和娘都看着你。', ['屯里人说的「撞客」……是真的？', '爹，还是上县医院看看吧。']);
    if (r === 0) await S.say('娘', '屯里老人都这么说。黄家的仙家记仇，你爷那辈儿就得罪过它。');
    else { await S.say('爹', '我也是这么说的！开了春就去。'); await S.say('娘', '开了春？她能熬到开春？'); }
    await S.say('娘', '军儿，你去一趟马老太家。屯东头，门口挂红灯笼那家。她有「堂口」，能看事儿。');
    await S.say('爹', '……随你们折腾吧。');
    S.f.ph = 'invest';
    S.goal('去屯子东头找马老太（门口挂红灯笼）');
    S.cp();
  }

  /* ---------- 马老太 ---------- */
  async function mltOn(S) {
    S.face('mlt', 'pl');
    if (S.f.ph !== 'invest') return S.say('马老太', '去吧。我随后就到。');
    if (!S.f.mlt) {
      await S.say('马老太', ['老林家的大孙子？……坐。', '你奶奶的事，我知道。她撞客了。']);
      const r = await S.ask('「撞客」？', ['是让……啥东西附上了？', '我爹说是血压高。']);
      if (r === 1) await S.say('马老太', '血压也高，客也撞了。俩事儿不打架。');
      await S.say('马老太', ['咱这疙瘩老辈儿人信「五大仙家」：胡、黄、白、柳、灰——狐仙、黄仙、刺猬、长虫、耗子。修行年头长了，就成了仙家。', '有的仙家跟着人「出马」，借人的身子看病看事儿——我就是干这个的，屯里叫「弟马」。有的让人供在家里，保一家平安，叫「保家仙」。', '谁家得罪了仙家，仙家就上谁家人的身，借人的嘴说话。这就叫撞客。']);
      await S.say('马老太', '你奶奶身上那个，是黄家的。我搭眼一瞅就知道——它要帽子。');
      const rn = await S.ask('「黄家的」？', ['……黄鼠狼？', '黄家，是哪家？']);
      if (rn === 0) {
        S.f.saidName = true; S.sfx('knock'); S.shake(200, 1); S.bubble('mlt', '!', 800);
        await S.narr('马老太的烟袋锅「梆」地一声磕在炕沿上。');
        await S.say('马老太', ['嘘——！在我这屋里，别这么叫。', '老辈儿没人直呼它的名儿，都叫「黄家」「老仙家」「黄大仙」。叫破了，它记着。']);
      } else await S.say('马老太', '黄家，就是黄仙。……这屋里不兴直呼它的名儿，老辈儿都叫「黄大仙」「老仙家」。叫破了，它记着。');
      const r2 = await S.ask('「你知道啥叫讨封不？」', ['听说过一点……', '不知道。']);
      if (r2 === 0) await S.say('马老太', '听说过就好。');
      await S.say('马老太', ['黄家修到一定火候，就得找个人「讨封」：戴上草帽，人立起来，拦住过路的问——你看我像人，还是像神？', '你说它像神，它就借你这一口气，成了仙。你要说它像人——它几百年的道行，一口气就散了。']);
      S.sfx('whisper');
      await S.say('马老太', '三十年前，你爷就是那个过路的人。', { style: 'whisper' });
      await S.say('马老太', ['要请它出来说话，得有三样。', '头一样，仓房里那个堂子，你爹给拆了。得重新立起来，让它有个落脚的地方。', '第二样，那顶草帽，是它的脸面，得找回来。第三样，三十年前到底咋回事，你得知道——去问孙大爷，那年他跟你爷一块儿赶的车。']);
      S.f.mlt = true; upGoal(S); S.cp();
      return;
    }
    if (S.f.sunTold && S.f.tangOK && S.has('hat')) return mltReady(S);
    const hint = [];
    if (!S.f.tangOK) hint.push(S.has('paiwei') ? '牌位找着了？摆的时候看我墙上那块堂单——胡家坐当中，左右按仙家的左右算。' : '堂子立起来，得先有牌位。你爹扔哪儿了，你问问他。');
    if (!S.has('hat')) hint.push('那顶草帽，你娘兴许知道搁哪儿了。');
    if (!S.f.sunTold) hint.push('孙大爷就在西头，他家门口蹲着抽烟呢。');
    await S.say('马老太', hint);
  }
  async function mltReady(S) {
    await S.say('马老太', '三样都齐了？……行。堂子立起来了，帽子也找着了，当年那些事，你也听明白了。');
    await S.narr('马老太从炕琴柜里摸出一个牛皮纸订的小本子，递给你。');
    S.f.chang = true;
    await S.note('changben');
    await S.say('马老太', ['我请仙，得有个「二神」敲鼓帮腔。你家没别人懂这个——你来。鼓我敲，词儿你接。', '唱本上那几句，看熟了。最后一页是我娘当年记下的，那老道的话，都在上头。']);
    await S.say('马老太', '天擦黑了。你先家去，让你娘把炕收拾出来。我拾掇拾掇家什，随后就到。');
    S.f.ph = 'ritual';
    S.goal('回家等马老太来请仙（路上把「笺」里的唱本再看看）');
    S.toast('唱本收进了「笺」，随时能翻');
    S.cp();
  }

  /* ---------- 请仙 ---------- */
  async function ritual(S) {
    await S.fade(1, 400);
    S.show('mlt_h'); S.place('ma', 15, 6, 3); S.place('die', 16, 5, 1); S.pos(12, 5, 3);
    S.dark(.84); S.amb('none');
    S.ent('hlamp').light = { r: 2.4, col: 'rgba(255,170,90,.18)', flick: true };
    await S.fade(0, 600);
    await S.narr('天黑透了，马老太前后脚就到了。\n娘把门窗关严，拿棉被堵上门缝。马老太脱鞋上炕，挨着奶奶盘腿坐下，闭上了眼睛。');
    if (S.coop) S.toast('联机：一个人翻「笺」里的唱本，一个人接词');
    await S.say('马老太', '敲。');
    const lines = [
      ['日落西山黑了天——', ['喜鹊老鸹奔大树', '家家户户把门关', '头遍鼓来请仙家'], 1, '家家户户'],
      ['喜鹊老鸹奔大树——', ['家雀扑棱奔房檐', '家家户户把门关', '黄家的老仙家下山来坐坐'], 0, '家雀扑棱'],
      ['头遍鼓，请的是哪路仙家——', ['胡家的老仙家', '灰家的老仙家', '黄家的老仙家，下山来坐坐'], 2, '黄家的']
    ];
    for (const [sing, opts, ok, hint] of lines) {
      drum(S, 3); await S.wait(950);
      let miss = 0;
      for (;;) {
        await S.say('马老太', sing, { style: 'whisper' });
        const r = await S.ask(miss >= 2 ? '（马老太的嘴唇动了动：「' + hint + '……」）' : '（二神该接词了——唱本在「笺」里）', opts);
        if (r === ok) { S.sfx('chant'); drum(S, 2, .22); await S.say('建军', opts[r]); break; }
        miss++; S.sfx('bad'); S.bubble('mlt_h', '!', 800);
        await S.narr(miss >= 2 ? '鼓点又乱了。马老太额头上沁出了汗，嘴唇动了动，像是在给你递词儿。' : '马老太眼皮一跳，鼓点乱了。\n「错了！」她压着嗓子，「唱本上咋写的？重来！」');
      }
    }
    S.sfx('whisper'); S.shake(500, 1);
    await S.narr('鼓声停了。屋里静得能听见灯芯「吱吱」地响。');
    await S.wait(600);
    S.ent('nai').spr = '@nai2'; S.face('nai', 0); S.sfx('heart'); squeak(S, 2);
    await S.say('奶奶', '哈——欠——', { style: 'whisper' });
    await S.say('奶奶', ['好冷的天。', '马家的丫头，你把我请来，干啥呀？']);
    await S.narr('马老太七十多岁了。\n奶奶嘴里的那个东西，管她叫「丫头」。');
    await S.say('马老太', '老仙家，林家的后人，给您赔不是来了。');
    await S.say('奶奶', ['赔不是？', '三十年前，腊月，老榆树底下。我问林老栓一句话。', '他说，我像个人。']);
    S.sfx('sting');
    await S.say('奶奶', '四百年的道行，一口气，散了。', { style: 'big' });
    await S.say('奶奶', ['我在雪地里打了三天滚。', '他老婆给我立了堂子，偷着供了我二十九年。我认了。', '今年，他儿子把我的堂子扔了。帽子也扔了。']);
    S.face('nai', 'pl');
    await S.say('奶奶', ['……可堂子，又立起来了。帽子，也找着了。', '你是老栓的孙子？']);
    const r = await S.ask('它盯着你。用奶奶的眼睛。', ['……是。', '（不吭声）'], '奶奶');
    if (r === 1) await S.say('奶奶', '不吭声也是。');
    if (S.f.saidName) {
      squeak(S, 3);
      await S.say('奶奶', ['下晌在马家，你管我叫啥来着？', '……黄、鼠、狼？'], { style: 'whisper' });
      S.bubble('mlt_h', '!', 800);
      await S.say('马老太', '老仙家！孩子不懂事，您老别跟他一般见识！');
      await S.say('奶奶', '哼。记着呢。');
    }
    await S.say('奶奶', ['像。眉眼像。', '今儿半夜，你拿着我的帽子，上老榆树底下来。', '我再问一回。']);
    await S.say('奶奶', ['答对了，我走。你奶奶还给你们。', '答不对——']);
    S.sfx('laugh');
    await S.scare('face', { spr: '@huangN', dur: 1.1 });
    S.ent('nai').spr = '@nai'; S.face('nai', 3);
    await S.narr('奶奶往后一仰，又睡过去了。\n马老太睁开眼，满头都是汗。');
    await S.say('马老太', ['听见了吧。它要讨的，还是三十年前那句话。', '你要说它像神——那是哄它。哄来的封，不作数，往后它还得找你们老林家要供，一辈一辈的。', '你要说它像人——那是要它的命。它连本带利，都得找回来。', '唱本最后那几行，你再琢磨琢磨。我娘记下的，一个字没改。']);
    await S.narr('马老太从怀里摸出三炷香，用红纸包着，塞进你手里。');
    S.give('xiang');
    await S.say('马老太', ['到了地方再点。', '道上要是有人喊你名儿——谁的声儿都别答应。别回头。', '它那些小崽子会扑你。别停下，别让它们挨着你。', '它们怕亮。实在跑不动了，就上灯底下站站——可别站久了。']);
    S.face('die', 'pl');
    await S.say('爹', '我跟你去！');
    await S.say('马老太', '不行。它只认老林家这一个后生。');
    S.hide('mlt_h');
    await S.fade(1, 800);
    S.f.ph = 'night'; light(S); S.amb('fire');
    S.ent('hlamp').light = { r: 3.2, col: 'rgba(255,190,100,.2)', flick: true };
    await S.fade(0, 800);
    await S.bells(11, 380);
    await S.narr('挂钟敲了十一下。');
    S.goal('半夜，拿着草帽去老榆树（出门往东，穿过屯子）');
    S.cp();
  }
  /* ---------- 夜里的道上 ---------- */
  async function callName(S) {
    await S.wait(300);
    callTone(S); S.sfx('whisper');
    await S.say('（身后）', '军儿——军儿——你回来——', { style: 'whisper' });
    await S.narr('是娘的声音。就在你身后，不远。');
    const r = await choose(S, '身后有人在喊你。', ['「哎！娘？」（答应）', '（不答应，也不回头）'], '', 1, '你张嘴就要应——另一个你一把捂住了自己的嘴。\n那个声音停了停，好像在等。');
    if (r === 0) {
      await S.say('建军', '哎！娘？');
      await S.narr('身后的声音停了。\n然后，在你耳朵根底下，有个东西轻轻地「嘻」了一声。');
      S.fx('red'); squeak(S, 4); await S.scare('face', { spr: '@huangN', dur: 1 });
      return S.die('你一答应，腿就不是你自己的了。\n你转身往回走，越走越快，一直走进了屯子北边的松树林子。\n\n天亮以后，人们在林子里找到你的时候，你正对着一棵松树，一下一下地作揖。', '你答应了');
    }
    await S.narr('你咬着牙，没应声，也没回头。\n那个声音又喊了两声，越来越尖，越来越细——最后变成一阵吱吱的笑声，钻进了雪地里。');
    squeak(S, 4);
    S.cp('night');   // 过了这一关再死，就从这儿重来
    S.f.noBack = 3; S.f.lookedBack = false;
  }
  async function baomiOn(S) {
    if (S.f.ph !== 'night') return S.narr('秋收以后码在地里的苞米秸子垛，冻得梆硬。\n小时候你们常钻进去藏猫猫。');
    const p = S.pl;
    S.hidePlayer(true); S.f.hid = true; S.f.hidAt = p.x + ',' + p.y; S.f.hidT = 0; S.f.lost = false;
    WZ.forEach(i => { const e = S.ent(i); if (e && !e.hidden) S.bubble(i, '?', 900); });
    await S.narr('你一头扎进苞米垛里，大气都不敢喘。\n外面有东西「嗖嗖」地跑过去，又跑回来，吱吱地叫。');
  }

  /* ---------- 物件 ---------- */
  async function jiwoOn(S) {
    if (!S.f.mlt || S.has('hat') || S.f.ph !== 'invest') return S.narr(S.has('hat') ? '空荡荡的鸡窝。鸡毛冻在雪里，一撮一撮的。' : '鸡窝。前天夜里，鸡全让啥东西咬死了，一只没剩。\n鸡窝顶上的雪堆得老高。');
    S.give('hat');
    await S.narr('你扒开鸡窝顶上的雪。\n雪底下埋着一顶草帽——小得出奇，只有拳头那么大。');
    await S.narr('帽檐烧焦了一块，帽顶缝着一圈红布条。\n你把它捧在手里，手心里一阵发痒，像有什么东西的毛蹭了一下。');
    upGoal(S); S.cp();
  }
  async function chaiOn(S) {
    if (!S.f.mlt || S.has('paiwei') || S.f.tangOK) return S.narr('柴火垛上压着一层雪。劈好的木柈子码得齐齐整整，是爹的手艺。');
    S.give('paiwei');
    await S.narr('你在柴火垛顶上翻了半天，翻出来五块巴掌大的小木牌。\n红漆掉得差不多了，每块背面刻着一个字。');
    if (S.coop) S.toast('联机：摆牌位时，一个人打开「笺」看堂单，一个人摆');
    upGoal(S);
  }
  async function boxOn(S) {
    if (S.once('boxScare')) {
      S.ent('muxiang').open = true; S.sfx('open');
      await S.narr('你掀开木箱盖子——');
      S.show('cwz'); S.place('cwz', 10, 4, 1); S.sfx('sting'); S.shake(300, 2); squeak(S, 3);
      await S.walk('cwz', [3, 4], 10);
      S.hide('cwz');
      await S.narr('一团黄乎乎的东西从箱子后头蹿了出去，「嗖」地一下，钻进了苞米垛。');
      await S.think('……耗子？不对，比耗子大。');
      await S.narr('箱子里是爷爷的旧东西：一根鞭杆，一双乌拉鞋，一个铁皮烟盒。\n底下压着一本发黄的作文本。');
    }
    await S.note('zuowen');
  }
  async function baomiC(S) {
    if (S.once('tongzhi')) {
      await S.narr('苞米垛最底下，好像压着什么东西。\n你扒开冻硬的苞米叶子，摸出一张叠成方块的纸。');
    }
    await S.note('tongzhi');
  }
  const TANG_OK = '灰白胡黄柳';   // 面对龛从左往右：胡家居中；仙家的左手（你的右边）是黄、柳，右手（你的左边）是白、灰
  async function tangOn(S) {
    const t = S.ent('tangzi');
    if (S.f.tangOK) return S.narr('堂子立起来了。五块牌位排得整整齐齐，香炉里的香，一直没灭。\n香烟直直地往上走，一点也不晃。');
    if (S.once('tangSeen')) await S.narr('墙上钉着一个红漆小木龛，门脸上的漆掉得斑斑驳驳。\n里头空空的，只有一个落了灰的小香炉。');
    if (!S.f.mlt) return S.narr('龛子底下的木板上，有五个小方印子，像原先摆过什么东西。\n……这就是爹说的「破神龛子」？');
    if (!S.has('paiwei')) return S.narr('牌位没了。得先把那五块牌位找回来。\n（爹说扔哪儿了来着？）');
    const v = await S.keypad('面对着龛，五块牌位从左往右摆：', ['胡', '黄', '白', '柳', '灰'], 5);
    if (v == null) return;
    if (v !== TANG_OK) {
      S.sfx('thud'); S.f.tangErr = (S.f.tangErr || 0) + 1;
      await S.narr('牌位刚摆上，「啪嗒」一声，倒下来一块。\n再扶，又倒。');
      if (!S.f.tdRead) return S.narr('摆法不对。马老太家墙上挂着一块红布堂单，兴许那上面有讲究。');
      if (S.f.tangErr >= 3) return S.think('……仙家坐在龛里，脸冲着外头。它的左手，就是我的右手。\n胡家当中；黄、柳在我右边，白、灰在我左边——从左往右：灰、白、胡、黄、柳。');
      if (v === '胡黄白柳灰') return S.think('口诀是「胡黄白柳灰」，可堂单上说，摆的时候不是一溜排下去的——胡家坐当中。');
      if (v === '柳黄胡白灰') return S.think('当中是对了，可左右好像反了。\n……马老太说的「左手」，是谁的左手？');
      if (v[2] === '胡') return S.think('胡家坐当中，这个没错。两边不对——再翻翻「笺」里的堂单。');
      return S.think('不对。堂单上写着：胡家坐当中，黄家在胡家左手，白家在右手。');
    }
    S.take('paiwei'); t.off = false; S.show('tlight'); S.f.tangOK = true;
    S.sfx('chime');
    await S.narr('五块牌位，一块一块，稳稳当当地立住了。');
    await S.wait(500);
    S.sfx('match');
    await S.narr('香炉里那截剩香，「哧」地一声——自己着了。');
    S.show('ceye'); S.sfx('giggle'); squeak(S, 2);
    await S.wait(900);
    S.hide('ceye');
    await S.narr('仓房旮旯里，有一对黄豆大的小眼睛闪了一下，就没了。');
    upGoal(S); S.cp();
  }

  /* ---------- 老榆树底下 ---------- */
  function fenReset(S) {
    S.hide('hz'); S.hide('hatE'); S.ent('hz').spr = '@huangN';
    for (let i = 0; i < 10; i++) S.hide('fe' + i);
    S.dark(null); S.plr(null); S.amb('wind'); S.lights(null);
  }
  const SAY_HEAD = '你是个修行的。人也罢，神也罢——';
  async function finale(S) {
    await S.walk('pl', [11, 8], 3.2); S.turn(3);
    S.amb('none');
    await S.narr('你在老榆树底下站住了。');
    for (let i = 0; i < 10; i++) { S.show('fe' + i); if (i % 3 === 0) S.sfx('giggle'); await S.wait(180); }
    await S.narr('四周的雪地上，亮起了一对一对的小黄眼睛，围成了一个圈。\n它们一声不吭，就那么看着你。');
    await S.wait(500);
    S.sfx('heart'); S.shake(400, 1);
    S.place('hz', 11, 6, 0); S.ent('hz').alpha = 0; S.ent('hz').spr = '@huangN';
    await S.alpha('hz', 1, 1200);
    await S.narr('树底下的雪，一点一点鼓了起来。\n一个黄乎乎的小东西钻了出来，抖了抖身上的雪——');
    await S.narr('然后，慢慢地，用两条后腿，站了起来。');
    squeak(S, 2);
    await S.say('黄皮子', ['老栓的孙子。', '帽子。']);
    S.take('hat'); S.sfx('item');
    await S.narr('你把那顶破草帽递了过去。\n它伸出两只前爪接住，端端正正地扣在了自己的脑袋上。');
    S.ent('hz').spr = '@huangO';
    if (S.has('xiang')) {
      S.take('xiang'); S.sfx('match');
      S.lights([[11 * TS + 8, 7 * TS + 10, 2.3, .9]]);   // 三炷香的火光，照亮它和你之间那一小块雪地
      await S.narr('你按马老太教的，把三炷香插在雪地里，点着了。\n香头的火光一明一灭，照着它的小脸。');
    }
    S.ent('hz').spr = '@huangB'; await S.wait(500); S.ent('hz').spr = '@huangO';
    await S.narr('它冲你作了个揖。\n跟三十年前，一模一样。');
    squeak(S, 2);
    await S.say('黄皮子', '大哥——你看我，', { style: 'whisper' });
    await S.say('黄皮子', '像人，还是像神？', { style: 'big' });
    let silent = 0, split = false;
    for (;;) {
      const opts = ['「像神。」', '「像人。」', '（随口）「……像个耗子。」'];
      if (silent < 2) opts.push('（一声不吭）');
      if (S.f.chang) opts.push('「你是个……」（想起唱本最后那几行）');
      if (S.coop) S.toast('联机：这一句，两个人各投一票');
      const v = await S.vote('它等着。四周所有的眼睛，都等着。', opts);
      if (!v.agree && !split) {   // 两人意见不合：它不收，让你们想齐了再说
        split = true; squeak(S, 3);
        await S.narr('你俩一个要这么说，一个要那么说，话卡在嗓子眼儿里。');
        await S.say('黄皮子', ['两个心眼儿，两句话。', '讨封，只讨一句。想齐了再说。']);
        continue;
      }
      if (!v.agree) await S.narr('你们俩还是没想到一块儿去。\n话到嘴边，是先张嘴的那个说出了口。');
      const pick = opts[v.v];
      if (pick === '（一声不吭）') { silent++; await keepSilent(S, silent); continue; }
      if (v.v === 0) return endGod(S);
      if (v.v === 1) return dieHuman(S);
      if (v.v === 2) return endRat(S);
      /* 自己把那句话接上：唱本最后一页 */
      const o2 = ['「……往后，老林家供着你。」', '「修行的，走的是修行的道。」', '「……说到底，你还是个黄皮子。」'];
      const v2 = await S.vote('「' + SAY_HEAD + '」', o2);
      if (!v2.agree) await S.narr('后半句，你们俩想的不一样。\n话到嘴边，是先张嘴的那个说出了口。');
      if (v2.v === 0) return endGod(S, true);
      if (v2.v === 2) return endRat(S, true);
      return endGood(S);
    }
  }
  async function keepSilent(S, n) {   // 传说里的老办法：碰上了，不答
    if (n === 1) {
      await S.narr('你攥紧了拳头，一个字也没说。');
      squeak(S, 2);
      await S.say('黄皮子', ['不吭声？', '老辈儿人教的吧——碰上了，别答，绕着走。', '可今儿个，是你自个儿找上门来的。']);
      await S.say('黄皮子', '我等着。', { style: 'whisper' });
      return;
    }
    await S.narr('雪落在你肩膀上。你还是没吭声。');
    S.sfx('giggle');
    const used = new Set(['11,6', '11,7', '11,8']);
    for (let i = 0; i < 10; i++) {
      const [x, y] = wzAt(S.ent('fe' + i)), nx = x + Math.sign(11 - x), ny = y + Math.sign(7 - y);
      if (used.has(nx + ',' + ny)) continue;
      used.add(nx + ',' + ny); S.place('fe' + i, nx, ny);
    }
    await S.narr('四周那一圈小黄眼睛，一齐往里挪了一步。');
    squeak(S, 3);
    await S.say('黄皮子', ['你奶奶也不吭声。二十九年，她一句话不替老栓说，就光送鸡蛋。', '不答，我就一直问。问你，问你儿子，问你孙子。']);
    await S.think('……今天这句话，躲不过去了。');
  }
  async function dieHuman(S) {
    await S.say('建军', '……像人。');
    S.ent('hz').spr = '@huangN'; S.place('hatE', 11, 7); S.sfx('scream'); S.shake(600, 3); S.lights(null);
    await S.narr('它像被人迎头打了一棍子，「扑通」一声趴在了雪里。\n草帽骨碌碌滚到了你脚边，香也灭了。');
    await S.say('黄皮子', '跟你爷……一模一样……', { style: 'whisper' });
    S.fx('red'); squeak(S, 6);
    await S.scare('face', { spr: '@huangN', dur: 1.1 });
    await S.die('四周所有的黄眼睛，一下子全都扑了上来。\n\n你说了和你爷一样的话。\n它说过，这一回，要连本带利。', '你说了那句话');
  }
  async function endRat(S, via) {
    if (via) { await S.say('建军', [SAY_HEAD, '……说到底，你还是个黄皮子。']); await S.narr('话到了嘴边，拐了个弯。\n你把它的名儿，叫破了。'); }
    else { await S.say('建军', '……像个耗子。'); await S.narr('话一出口，你就后悔了。\n可是已经晚了。'); }
    await S.wait(700);
    await S.narr('它没叫，也没打滚。\n它就那么站着。帽檐底下那两只眼睛，一点一点地，冷了下来。');
    await S.say('黄皮子', '好。', { style: 'whisper' });
    S.ent('hz').spr = '@huangN'; S.place('hatE', 11, 7); S.lights(null);
    S.sfx('laugh'); S.fx('red'); squeak(S, 5);
    await S.scare('face', { spr: '@huangN', dur: 1.2 });
    return S.end({ bad: true, id: 'po', title: via ? '说破了它' : '像个耗子', text: '那天夜里，你是怎么回的家，自己一点也想不起来了。\n\n奶奶没再说过胡话。她只是每天夜里坐起来，冲着墙，一下一下地作揖。\n开春的时候，换成了娘。\n\n后来屯里的人都说，老林家欠黄家的，欠了两句话。\n这笔账，一辈一辈地往下传。' });
  }
  async function endGod(S, via) {
    await S.say('建军', via ? [SAY_HEAD, '……往后，老林家供着你。'] : '……像神。');
    await S.wait(600);
    S.sfx('laugh'); squeak(S, 5);
    await S.narr('它笑了。吱吱的，尖尖的，四周的小眼睛也跟着笑。');
    await S.say('黄皮子', via ? ['供着我？', '……你也是来哄我的。', '行。说出口的话，我记着。'] : ['你哄我。', '你心里头想的不是这个。', '……哄来的封，也是封。我认了。']);
    await S.say('黄皮子', '往后，老林家供着我。', { style: 'big' });
    S.fx('flash'); S.lights(null);
    return S.end({ bad: true, id: 'hong', title: '哄来的封', text: '奶奶第二天就好了，能吃能睡，跟没事人一样。\n仓房扒了以后，爹在新房的西墙上钉了一个红漆木龛。他还是说不信，可初一十五的鸡蛋，从来没断过。\n\n你回了哈尔滨。\n每回你出门走远一点，家里就有人撞客。\n\n马老太说：哄来的封不作数，它要的是一辈子的供。' });
  }
  async function endGood(S) {
    await S.say('建军', [SAY_HEAD, '修行的，走的是修行的道。往后的道，你自个儿修。']);
    S.amb('wind');
    await S.wait(900);
    await S.narr('它一动不动地站着。\n香头的火一明一灭。四周的小眼睛，一对一对地，眨了眨。');
    await S.wait(700);
    await S.narr('它把草帽摘了下来，捧在胸前。');
    squeak(S, 2);
    await S.say('黄皮子', ['修行的……', '不哄我，也不踩我。', '三十年，我等的就是这么一句实在话。']);
    for (let i = 0; i < 3; i++) { S.ent('hz').spr = '@huangB'; drum(S, 1); await S.wait(520); S.ent('hz').spr = '@huangO'; await S.wait(420); }
    await S.narr('它冲你作了三个揖。');
    await S.say('黄皮子', ['替我跟你奶奶说一声：这些年的鸡蛋，我领了。', '堂子，往后不用供了。我上山去了。']);
    S.sfx('chime');
    S.ent('hz').spr = '@huangO';
    await S.walk('hz', [[11, 5], [13, 5], [16, 4]], 2.4);
    await S.alpha('hz', 0, 1200);
    for (let i = 9; i >= 0; i--) { S.hide('fe' + i); await S.wait(120); }
    await S.narr('雪地上只留下一行小小的脚印，两只两只的——像人一样，一直走进了东边的林子里。');
    S.lights(null);
    await S.fade(1, 1400);
    await S.card('腊月二十九　早上', '', '奶奶醒了。\n她坐起来，揉了揉眼睛，问的头一句话是：\n「军儿回来啦？饺子包了没？」\n\n爹还是说，那是血压的毛病，开春得上县医院。\n马老太只说了三个字：「它走了。」\n\n是黄大仙，还是老人一时糊涂——屯里人说法不一。\n只是那年开春扒仓房的时候，\n墙上那个红漆小龛，爹没让扔。');
    const eggs = S.f.sawEggs ? '你跟爹说起林家坟前那两个冻鸡蛋。\n爹半天没吭声，后来说：「……你奶奶。三十年，年年腊月都去，一回没落下。」\n\n' : '';
    await S.end({ id: 'shan', title: '第四夜　完', text: eggs + '后来，再有人走夜路经过老榆树，说看见过一只戴草帽的黄皮子，蹲在树杈上，仰着头，像在看月亮。\n\n也有人说，那就是一只普通的黄鼠狼。' });
  }
})();
