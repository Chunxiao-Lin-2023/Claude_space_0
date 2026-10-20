/* ================= 第一夜 · くねくね ================= */
(() => {
  const VIEW = 8.5;                                      // 超过这个距离（格），怎么看都没事
  const BLOCK = new Set(['ashi', 'reeds', 'tree', 'pine', 'hedge', 'bushes', 'wall', 'void']);   // 挡得住视线的格子
  const CIC = { t: 0, gap: 1 };                          // 蝉鸣节拍（本地合成，主客机各自响）
  const KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'];

  /* ---------- 小工具 ---------- */
  function adj(S, id, tx, ty) {   // 实体走到 (tx,ty) 旁边的空格
    const m = curMap(), e = S.ent(id), ex = Math.round(e.px / TS), ey = Math.round(e.py / TS);
    const c = [[tx + 1, ty], [tx - 1, ty], [tx, ty + 1], [tx, ty - 1]].filter(([x, y]) => passable(m, x, y, e));
    c.sort((a, b) => (Math.abs(a[0] - ex) + Math.abs(a[1] - ey)) - (Math.abs(b[0] - ex) + Math.abs(b[1] - ey)));
    return c[0] || [ex, ey];
  }
  const look = (sight, feel) => S => S.narr(S.f.blind && feel ? feel : sight);
  function los(m, x0, y0, x1, y1) {   // 视线：中间的格子有芦苇、树丛就看不见
    if (x0 === x1 && y0 === y1) return true;
    const dx = Math.abs(x1 - x0), dy = -Math.abs(y1 - y0), sx = x0 < x1 ? 1 : -1, sy = y0 < y1 ? 1 : -1;
    let err = dx + dy, x = x0, y = y0;
    for (let n = 0; n < 80; n++) {
      const e2 = 2 * err;
      if (e2 >= dy) { err += dy; x += sx; }
      if (e2 <= dx) { err += dx; y += sy; }
      if (x === x1 && y === y1) return true;
      if (BLOCK.has(tileName(m, x, y))) return false;
      if (m.ents.some(e => e.blk && !e.hidden && Math.round(e.px / TS) === x && Math.round(e.py / TS) === y)) return false;
    }
    return true;
  }
  /* 注视：面朝它、离得越近、中间没有遮挡，就看得越清楚 */
  function lookRate(m, f) {
    if (f.blind) return 0;
    const p = W.pl, fx = DIRS[p.dir][0], fy = DIRS[p.dir][1];
    let r = 0;
    for (const e of m.ents) {
      if (!e.kk || e.hidden) continue;
      const dx = (e.px - p.px) / TS, dy = (e.py - p.py) / TS, d = Math.hypot(dx, dy);
      if (d > VIEW || !los(m, p.x, p.y, Math.round(e.px / TS), Math.round(e.py / TS))) continue;
      const dot = d > .01 ? (dx * fx + dy * fy) / d : 1;
      if (d < 1.8) r += 1.4;                                  // 太近了，不看也看见了
      else if (dot > .55) r += .12 + (VIEW - d) / VIEW * .7;  // 正面朝着它
      else if (dot > -.1 && d < 4) r += .12;                  // 眼角余光
    }
    return r;
  }
  function gazeTick(S, dt) {
    const m = curMap(); if (!m) return;
    const f = S.f, h = m.ents.find(e => e.hz);
    if (h) { h.px = W.pl.px; h.py = W.pl.py; h.s.blind = !!f.blind; h.s.in = !m.def.field; h.s.cv = f.quiet ? 0 : (m.def.cicV ?? 1); }
    if (m.id === 'house') { const u = m.ents.find(e => e.id === 'shinji'); if (u) u.ox = f.shStill ? 0 : Math.round(Math.sin(W.t * 1.9) * 1.4); }
    if (!W.busy && !f.lock) {
      const r = m.def.field ? lookRate(m, f) : 0;
      f.gz = clamp((f.gz || 0) + (r > 0 ? r * dt : -.32 * dt), 0, 1.05);
      if (f.gz > .3) { f._hb = (f._hb || 0) - dt; if (f._hb <= 0) { f._hb = 1.1 - f.gz * .6; S.sfx('heart'); } }
      if (f.gz > .3 && !f._w1) { f._w1 = 1; S.toast(['……别盯着它看。', '眼睛自己在往那边转。低头！', '看着脚下。看着脚下。'][(f._wn = ((f._wn || 0) + 1)) % 3]); }
      if (f.gz > .62 && !f._w2) { f._w2 = 1; S.fx('static', { dur: .5 }); S.sfx('whisper'); S.toast('它在扭……它是……它是——'); }
      if (f.gz < .15) { f._w1 = 0; f._w2 = 0; }
      if (f.gz >= 1) { f.gz = 1; runScript(seen); }
    }
    const g = Math.round((f.gz || 0) * 40) / 40;
    if (h) h.s.g = g;
    for (const e of m.ents) if (e.kk) e.s.g = g;
  }
  function goBlind(S) { S.f.blind = true; S.wear('@meB'); S.norun(true); S.speed(.75); }
  function unblind(S) { S.f.blind = false; S.wear('@me'); S.norun(false); S.speed(1); }

  /* ---------- 精灵 ---------- */
  const SPRITES = {
    haze(g, e, t) {   // 全屏：热浪扭曲 / 注视时的雪花与发白 / 蒙眼时的暗红；顺带合成蝉鸣
      const gz = e.g || 0;
      if (e.blind) {
        const px = W.pl.px - Math.round(CAM.x) + 8, py = W.pl.py - Math.round(CAM.y) + 3;
        const gr = g.createRadialGradient(px, py, 3, px, py, 30);
        gr.addColorStop(0, 'rgba(26,8,6,0)'); gr.addColorStop(.45, 'rgba(26,8,6,.84)'); gr.addColorStop(1, 'rgba(22,6,5,.975)');
        g.fillStyle = gr; g.fillRect(0, 0, VW, VH);
        g.fillStyle = 'rgba(150,40,20,.08)'; g.fillRect(0, 0, VW, VH);
        g.fillStyle = 'rgba(90,40,30,.10)';
        for (let y = 0; y < VH; y += 3) g.fillRect(0, y, VW, 1);
        for (let x = 0; x < VW; x += 4) g.fillRect(x, 0, 1, VH);
      } else {
        const amp = (e.in ? 0 : .9) + gz * gz * 8;
        if (amp > .4) for (let y = 0; y < VH; y += 2) {
          const o = Math.round(Math.sin(y * .12 + t * 5.2) * amp * (.55 + .45 * Math.sin(y * .027 - t * 1.6)));
          if (o) g.drawImage(g.canvas, 0, y, VW, 2, o, y, VW, 2);
        }
        if (!e.in) { g.fillStyle = 'rgba(255,238,190,.06)'; g.fillRect(0, 0, VW, VH); }
        if (gz > .22) {
          const n = ((gz - .22) * 1400) | 0;
          for (let i = 0; i < n; i++) { g.fillStyle = Math.random() < .55 ? 'rgba(240,240,232,.85)' : 'rgba(30,30,30,.7)'; g.fillRect((Math.random() * VW) | 0, (Math.random() * VH) | 0, Math.random() < .3 ? 2 : 1, 1); }
        }
        if (gz > .55) { g.fillStyle = `rgba(244,243,236,${Math.min(.55, (gz - .55) * .9)})`; g.fillRect(0, 0, VW, VH); }
      }
      const cv = e.cv ?? 1;
      if (cv > 0 && AU.ctx && RT - CIC.t > CIC.gap) {   // ミーン、ミンミンミン……
        CIC.t = RT; CIC.gap = 1.3 + Math.random() * 2.4;
        const v = (e.in ? .011 : .02) * cv, f0 = 4100 + Math.random() * 900, n = 4 + ((Math.random() * 4) | 0);
        for (let i = 0; i < n; i++) AU.noise(.13, v, 'bandpass', f0, f0 * .93, 8, i * .17);
        if (Math.random() < .5) AU.noise(1.3, v * .6, 'bandpass', f0 * 1.05, f0 * .98, 6, n * .17);
      }
    },
    kune(g, e, t, R) {   // 白色的、细长的、一直在扭的东西
      const gz = e.g || 0, seed = (e.x || 0) * 1.7 + (e.y || 0);
      const tt = t * 2.4 + seed + Math.sin(t * .9 + seed) * 1.2;
      const st = Math.sin(t * .37 + seed) > .82 ? Math.floor(tt * 3) / 3 : tt;   // 偶尔一顿一顿的
      const body = gz > .5 ? '#fbfbf6' : '#ecebe4', sh = gz > .5 ? '#a8a8a0' : '#d0cfc6';
      const offAt = i => Math.sin(st * 1.3 + i * .42) * (1.2 + i * .1) + Math.sin(st * 2.9 - i * .23) * .9;
      R(2, 13, 12, 2, 'rgba(255,255,255,.14)');
      for (let i = 0; i < 26; i++) {
        const y = 13 - i, w = i > 20 ? 4 : 3, x = 6 + offAt(i);
        R(x, y, w, 1, i < 4 ? 'rgba(236,235,228,.55)' : body); if (i >= 4) R(x + w - 1, y, 1, 1, sh);
        if (gz > .45 && i >= 4) R(x - 1, y, 1, 1, `rgba(20,20,20,${Math.min(1, (gz - .45) * 1.6)})`);
      }
      const arm = (i0, dir, ph) => {
        let x = 6 + offAt(i0) + (dir > 0 ? 3 : 0), y = 13 - i0;
        for (let k = 0; k < 7; k++) { x += dir * (k > 3 ? 0 : 1); y += Math.sin(st * 2 + ph + k * .9) * 1.4; R(x, y, 1, 1, body); }
      };
      arm(17, 1, 0); arm(15, -1, 2);
      if (gz > .7) { const x = 6 + offAt(23); R(x, -9, 4, 1, '#3a3a36'); R(x + 1, -8, 1, 2, '#3a3a36'); }
    },
    kakashi(g, e, t, R) {   // 稻草人
      const c = e.col || '#8a8a7a';
      R(7, -10, 2, 25, '#6a4a2a'); R(1, -4, 14, 2, '#6a4a2a');
      R(3, -5, 10, 10, c); R(3, -5, 10, 1, shade(c, .2)); R(7, -5, 2, 10, shade(c, -.15));
      R(1, -4, 2, 4, c); R(13, -4, 2, 4, c); R(5, 5, 6, 3, '#b8a060'); R(6, 8, 1, 2, '#b8a060'); R(9, 8, 1, 2, '#b8a060');
      R(5, -13, 6, 7, '#e8e0c8'); R(6, -11, 1, 1, '#222'); R(9, -11, 1, 1, '#222'); R(7, -9, 2, 1, '#222'); R(6, -8, 1, 1, '#222');
      if (e.blind) { R(4, -12, 8, 2, '#f4f2ea'); R(11, -11, 2, 3, '#f4f2ea'); }
      R(2, -15, 12, 2, '#c9a35a'); R(4, -17, 8, 2, '#d8b46a'); R(4, -15, 8, 1, '#a03030');
    },
    jizo(g, e, t, R) {
      R(3, 13, 10, 2, 'rgba(0,0,0,.25)'); R(4, 2, 8, 12, '#8a8a84'); R(5, -3, 6, 6, '#9a9a94'); R(5, -3, 6, 1, '#aaaaa4');
      R(6, -1, 1, 1, '#5a5a56'); R(9, -1, 1, 1, '#5a5a56'); R(7, 1, 2, 1, '#6a6a66');
      R(4, 3, 8, 4, '#c03a2a'); R(5, 7, 6, 1, '#a02a20'); R(3, 13, 10, 2, '#6a6a66');
      if (e.hat) { R(3, -5, 10, 2, '#d8b46a'); R(5, -6, 6, 1, '#e8c87a'); }
    },
    mugi(g, e, t, R) { R(2, 9, 12, 4, '#c9a35a'); R(4, 6, 8, 5, '#e8c87a'); R(4, 9, 8, 1, '#a03030'); R(5, 7, 3, 1, '#f0d890'); },
    ami(g, e, t, R) { for (let i = 0; i < 12; i++) R(2 + i, 14 - i, 1, 1, '#c9a35a'); R(11, -3, 6, 6, 'rgba(230,240,230,.75)'); R(12, -2, 4, 4, 'rgba(110,170,110,.45)'); R(11, -3, 6, 1, '#c9a35a'); },
    zori(g, e, t, R) { R(5, 8, 5, 7, '#e8c030'); R(5, 8, 5, 1, '#c8a020'); R(6, 9, 3, 1, '#c03a2a'); R(7, 10, 1, 2, '#c03a2a'); R(3, 14, 10, 1, 'rgba(160,200,220,.5)'); },
    hosho(g, e, t, R) {   // 晾衣竿（3 格宽）
      const b = Math.round(Math.sin(t * 1.3) * 2);
      R(1, -10, 2, 25, '#6a5a48'); R(45, -10, 2, 25, '#6a5a48'); R(0, -10, 48, 1, '#cfcfc8');
      if (e.towel) { R(6, -9, 7, 10, '#f0ece0'); R(6, -4, 7, 1, '#4a6a9a'); R(6, 0, 7, 1, '#d8d4c8'); }
      R(17, -9, 16, 15 + b, '#f6f4ec'); R(17, -9, 16, 1, '#d8d6cc'); R(24 + b, -8, 1, 13, '#e2e0d6'); R(17, 5 + b, 16, 1, '#d8d6cc');
      R(36, -9, 7, 8, '#e8a0a0'); R(35, -9, 2, 3, '#e8a0a0'); R(42, -9, 2, 3, '#e8a0a0');
    },
    kuraF(g, e, t, R) {   // 土藏外墙（4×2）
      R(-2, -6, 68, 5, '#26262c'); R(0, -8, 64, 3, '#34343a'); for (let x = 0; x < 64; x += 4) R(x, -6, 1, 5, '#1a1a1e');
      R(0, -1, 64, 21, '#ece8dc'); R(0, -1, 64, 1, '#c8c4b8'); R(0, 19, 64, 1, '#c8c4b8');
      R(40, 3, 12, 7, '#2a2a2e'); for (let x = 42; x < 52; x += 3) R(x, 3, 1, 7, '#55555a');
      R(0, 20, 64, 12, '#2c2c30');
      for (let x = 0; x < 64; x += 6) for (let y = 20; y < 32; y += 6) { R(x + 2, y + 1, 1, 4, '#d8d4c8'); R(x, y + 3, 5, 1, '#d8d4c8'); }
    },
    kuraD(g, e, t, R) {
      R(0, -8, 16, 24, '#3a3a3e');
      if (e.open) { R(2, -6, 12, 22, '#0a0806'); R(2, -6, 2, 22, '#4a3a2a'); return; }
      R(2, -6, 12, 22, '#4a3a2a'); R(7, -6, 2, 22, '#2a2018');
      for (let y = -4; y < 16; y += 5) { R(3, y, 1, 1, '#8a8a8a'); R(12, y, 1, 1, '#8a8a8a'); }
      R(6, 3, 4, 5, '#7a6a4a'); R(7, 4, 2, 2, '#3a3020'); R(6, 1, 1, 2, '#9a9a9a'); R(9, 1, 1, 2, '#9a9a9a');
    },
    mado(g, e, t, R) {   // 墙上的窗：外面是正午
      box(R, 2, 1, 12, 11, '#4a3a2a'); R(3, 2, 10, 4, '#a8d0ec'); R(3, 6, 10, 2, '#6aa040'); R(3, 8, 10, 3, '#7fae48');
      R(3, 2, 10, 3, 'rgba(200,170,110,.85)'); for (let x = 3; x < 13; x += 2) R(x, 2, 1, 3, 'rgba(120,90,50,.6)');
      R(7, 2, 1, 9, '#4a3a2a');
    },
    butsu(g, e, t, R) {   // 佛龛
      box(R, 1, -12, 14, 26, '#161212'); R(3, -10, 10, 13, '#2a2018'); R(3, -10, 10, 1, '#c9a35a'); R(3, 2, 10, 1, '#c9a35a');
      R(6, -8, 4, 5, '#d8d0c0'); R(7, -7, 2, 2, '#5a5a5a'); R(6, -8, 4, 1, '#c9a35a');
      R(4, -1, 1, 3, '#e8e2cc'); R(11, -1, 1, 3, '#e8e2cc');
      for (let i = 0; i < 6; i++) R(8 + Math.round(Math.sin(t * 2 + i * .9)), -2 - i * 2, 1, 2, 'rgba(220,220,220,.35)');
      R(4, 7, 8, 3, '#2a1e16'); R(7, 8, 2, 1, '#c9a35a');
    },
    senpuki(g, e, t, R) {   // 电风扇
      R(7, 3, 2, 10, '#d8d8d0'); R(4, 12, 8, 3, '#c8c8c0');
      R(3, -7, 10, 10, 'rgba(210,215,225,.55)'); R(3, -7, 10, 1, '#b8bcc4'); R(3, 2, 10, 1, '#b8bcc4');
      const a = t * 18; for (let k = 0; k < 3; k++) R(7 + Math.round(Math.cos(a + k * 2.09) * 3), -3 + Math.round(Math.sin(a + k * 2.09) * 3), 2, 2, '#7ab0d8');
      R(7, -3, 2, 2, '#555');
    },
    katori(g, e, t, R) {   // 蚊遣猪，烟往上走，走着走着就扭了
      R(3, 8, 10, 7, '#d8d0c0'); R(3, 14, 10, 1, '#a8a090'); R(13, 10, 2, 3, '#c8c0b0'); R(14, 11, 1, 1, '#2a2420');
      R(4, 7, 2, 2, '#c8c0b0'); R(9, 7, 2, 2, '#c8c0b0'); R(10, 10, 1, 1, '#2a2420');
      for (let i = 0; i < 8; i++) R(14 + Math.round(Math.sin(t * 3 + i * .8) * (1 + i * .25)), 9 - i * 2, 1, 2, `rgba(230,230,230,${.5 - i * .05})`);
    },
    radio(g, e, t, R) { box(R, 2, 5, 12, 9, '#8a2a20'); R(3, 6, 6, 7, '#c8b898'); for (let y = 7; y < 13; y += 2) R(3, y, 6, 1, '#9a8a70'); R(10, 7, 3, 2, Math.sin(t * 3) > 0 ? '#ffd860' : '#e8b840'); R(10, 10, 3, 1, '#c9a35a'); R(12, -3, 1, 9, '#aaa'); },
    koyomi(g, e, t, R) { R(4, 1, 8, 11, '#ece8dc'); R(4, 1, 8, 3, '#3a6a3a'); for (let y = 5; y < 11; y += 2) for (let x = 5; x < 11; x += 2) R(x, y, 1, 1, '#8a8478'); R(6, 7, 1, 1, '#c02020'); R(9, 7, 1, 1, '#c02020'); },
    nebaba(g, e, t, R) {   // 侧躺着打盹的外婆（2 格）
      R(-1, 5, 34, 10, '#c8b880'); for (let x = 1; x < 32; x += 3) R(x, 5, 1, 10, '#b8a870');
      R(3, 6, 6, 6, '#e2bc98'); R(2, 5, 5, 4, '#c8c4c0'); R(1, 6, 2, 2, '#c8c4c0'); R(5, 9, 1, 1, '#4a3a30');
      const br = Math.sin(t * 1.4) > 0 ? 1 : 0;
      R(9, 6 - br, 17, 7 + br, '#5a5a7a'); R(11, 6 - br, 8, 7 + br, '#e8e4dc'); R(26, 9, 4, 3, '#e2bc98');
      R(4, 12, 6, 3, '#e88a3a'); R(6, 13, 2, 2, '#c86a2a');
    },
    bag(g, e, t, R) { box(R, 4, 6, 8, 8, '#3a6ab0'); R(5, 5, 6, 2, '#2a4a8a'); R(12, 8, 2, 2, '#5a3a1a'); R(12, 7, 1, 1, '#3a2a10'); R(5, 3, 5, 3, '#e8e2cc'); },
    tsuru(g, e, t, R) { for (let i = 0; i < 4; i++) { const x = 1 + i * 4; R(x, 10, 3, 2, '#f0eee6'); R(x + 1, 9, 1, 1, '#f0eee6'); R(x + (i % 2 ? 3 : -1), 8 - (i % 3), 1, 2, '#f0eee6'); R(x + (i % 2 ? 3 : -1), 7 - (i % 3), 1, 1, '#d8d6cc'); } },
    yagura(g, e, t, R) {   // 火警瞭望塔
      R(2, -40, 2, 55, '#5a3a2a'); R(12, -40, 2, 55, '#5a3a2a');
      for (let y = -36; y < 14; y += 6) R(5, y, 6, 1, '#7a5a3a');
      for (let i = 0; i < 4; i++) { R(4 + i * 2, -30 + i * 3, 1, 1, '#4a2a1a'); R(11 - i * 2, -18 + i * 3, 1, 1, '#4a2a1a'); }
      R(0, -44, 16, 4, '#4a2a1a'); R(1, -52, 14, 6, '#3a3a3a'); R(3, -54, 10, 2, '#2a2a2a'); R(7, -50, 3, 4, '#8a6a2a');
    },
    kei(g, e, t, R) {   // 白色轻卡车（2 格）
      R(1, 13, 30, 2, 'rgba(0,0,0,.25)');
      R(0, 0, 32, 11, '#e8e8e4'); R(0, 0, 32, 1, '#f8f8f4'); R(20, -8, 12, 10, '#e8e8e4'); R(22, -6, 8, 4, '#6a8aa0'); R(23, -6, 2, 1, '#c8e0f0');
      R(2, -3, 17, 4, '#c8a860'); R(3, -5, 6, 3, '#d8b870'); R(10, -4, 7, 2, '#b89850');
      R(4, 10, 6, 5, '#222'); R(22, 10, 6, 5, '#222'); R(6, 12, 2, 1, '#888'); R(24, 12, 2, 1, '#888');
    },
    tana(g, e, t, R) {   // 藏里的架子，最上层一只桐木箱
      box(R, 0, -10, 16, 25, '#4a3a2a'); R(1, -2, 14, 1, '#2a1e14'); R(1, 6, 14, 1, '#2a1e14');
      R(2, 1, 4, 5, '#8a7a5a'); R(9, 2, 5, 4, '#6a5a4a'); R(3, 8, 10, 5, '#5a4a3a');
      if (!e.got) { R(1, -9, 14, 6, '#c8b088'); R(1, -9, 14, 1, '#d8c098'); R(6, -9, 4, 6, '#f0e8d8'); R(7, -8, 2, 1, '#a02020'); R(7, -6, 2, 1, '#a02020'); }
      else { R(1, -7, 14, 4, '#c8b088'); R(2, -6, 12, 2, '#3a2a1a'); }
    },
    chest(g, e, t, R) { box(R, 0, 2, 32, 13, '#5a3a22'); R(0, 1, 32, 3, '#4a2a18'); R(0, 2, 3, 3, '#8a7a5a'); R(29, 2, 3, 3, '#8a7a5a'); R(0, 12, 3, 3, '#8a7a5a'); R(29, 12, 3, 3, '#8a7a5a'); R(14, 6, 4, 3, '#8a7a5a'); },
    tsutsumi(g, e, t, R) {   // 裹着白布的旧稻草人
      R(7, 2, 2, 13, '#5a4a3a'); R(3, -15, 10, 18, '#d8d4c8'); R(4, -15, 2, 18, '#c8c4b8'); R(10, -13, 1, 15, '#c0bcb0');
      R(3, -8, 10, 1, '#8a6a3a'); R(3, -1, 10, 1, '#8a6a3a'); R(5, -13, 6, 1, '#8a6a3a');
      R(6, -5, 1, 3, '#2a2a2a'); R(8, -5, 2, 1, '#2a2a2a'); R(8, -3, 2, 1, '#2a2a2a');
    },
    kuwa(g, e, t, R) { R(3, -8, 1, 22, '#8a6a40'); R(1, -10, 5, 3, '#6a6a6a'); R(10, -6, 1, 20, '#8a6a40'); R(8, -7, 5, 2, '#7a7a7a'); R(12, 8, 4, 6, '#a08a5a'); R(13, 9, 2, 4, '#7a6440'); },
    slit(g, e, t, R) { R(5, 2, 6, 5, '#f4ecd0'); R(7, 2, 1, 5, '#2a2a2a'); R(9, 2, 1, 5, '#2a2a2a'); R(4, 1, 8, 1, '#3a3a3a'); R(4, 7, 8, 1, '#3a3a3a'); },
    hokora(g, e, t, R) { R(1, -7, 14, 3, '#3a2a1a'); R(3, -9, 10, 2, '#2a1e12'); R(3, -4, 10, 12, '#7a5a3a'); R(5, -1, 6, 7, '#2a1a10'); R(6, 1, 4, 1, '#c9a35a'); R(1, 8, 14, 6, '#6a6a66'); R(6, 6, 4, 2, '#e8e2cc'); },
    sekihi(g, e, t, R) { R(4, -9, 8, 22, '#6a6a64'); R(4, -9, 8, 1, '#7a7a74'); R(6, -6, 1, 14, '#4a4a46'); R(9, -6, 1, 10, '#4a4a46'); R(2, 12, 12, 3, '#55554f'); R(5, 0, 2, 3, '#3e5a32'); },
    kareki(g, e, t, R) {   // 枯树，枝上挂着一只风铃
      R(6, -14, 4, 29, '#4a3a2a'); R(2, -14, 5, 2, '#4a3a2a'); R(9, -10, 5, 2, '#4a3a2a'); R(1, -17, 2, 4, '#4a3a2a');
      R(12, -8, 1, 3, '#888'); R(11, -5, 3, 3, 'rgba(160,200,230,.85)'); R(12, -2 + Math.round(Math.sin(t * 2.3)), 1, 4, '#e8d8a0');
    },
    mizuguchi(g, e, t, R) { R(4, 3, 8, 7, '#6a5a3a'); R(4, 3, 8, 1, '#7a6a4a'); R(6, 10, 4, 5, 'rgba(170,210,230,.65)'); R(7, 11 + (Math.sin(t * 8) > 0 ? 1 : 0), 2, 1, '#e8f4f8'); },
    furin(g, e, t, R) { R(7, -14, 1, 3, '#888'); R(5, -11, 5, 4, 'rgba(170,210,240,.9)'); R(6, -10, 1, 1, '#e84a3a'); R(7 + Math.round(Math.sin(t * 2)), -7, 1, 5, '#e8d8a0'); }
  };

  /* ---------- 瓦片 ---------- */
  const TILES = {
    ine: { solid: true, paint(R, X, Y) {   // 水田：稻子快齐腰了
      R(0, 0, 16, 16, '#4c6e40');
      for (let r = 0; r < 4; r++) for (let c = 0; c < 4; c++) { const x = c * 4 + ((r % 2) * 2), y = r * 4; R(x, y + 1, 2, 3, '#7fae48'); R(x, y, 1, 2, '#9cc85a'); R(x + 1, y + 3, 1, 1, '#5a8a34'); }
      if (hash(X, Y, 3) < .35) R((hash(X, Y, 4) * 14) | 0, (hash(X, Y, 5) * 14) | 0, 2, 1, '#b8d878');
    } },
    aze: { solid: false, paint(R, X, Y) { speck(R, '#9a8458', ['#a8925f', '#86714a', '#b09a68'], X, Y, 18, 41); if (hash(X, Y, 42) < .5) { R((hash(X, Y, 43) * 13) | 0, (hash(X, Y, 44) * 13) | 0, 2, 2, '#6a9a3a'); } if (hash(X, Y, 45) < .3) R((hash(X, Y, 46) * 14) | 0, 0, 1, 3, '#7aaa42'); } },
    jari: { solid: false, paint(R, X, Y) { speck(R, '#8a8578', ['#9a958a', '#76716a', '#a8a294'], X, Y, 22, 31); } },
    mizu: { solid: true, paint(R, X, Y) { R(0, 0, 16, 16, '#3c6a78'); for (let i = 0; i < 3; i++) { const h = hash(X, Y, 50 + i); R((h * 12) | 0, (hash(X, Y, 55 + i) * 14) | 0, 4, 1, '#6a9aa8'); } R(0, 0, 16, 1, '#2a4a50'); } },
    pond: { solid: true, paint(R, X, Y) { R(0, 0, 16, 16, '#24443c'); for (let i = 0; i < 3; i++) { const h = hash(X, Y, 60 + i); R((h * 12) | 0, (hash(X, Y, 65 + i) * 14) | 0, 4, 1, '#3e6a5a'); } if (hash(X, Y, 69) < .15) R(5, 6, 3, 2, '#3a5a2a'); } },
    ashi: { solid: true, paint(R, X, Y) { R(0, 0, 16, 16, '#3a5a2e'); for (let i = 0; i < 8; i++) { const x = (hash(X, Y, i) * 15) | 0; R(x, 1 + (i % 3), 1, 14, i % 2 ? '#7a9a48' : '#5e7e38'); R(x, (i % 3), 1, 2, '#a8b860'); } } }
  };

  /* ---------- 人物 ---------- */
  const ME = { skin: '#f1c9a5', hair: '#2a1e1a', hs: 'bob', top: '#7ab0d8', top2: '#e8f0f8', bottom: '#3a4a6a', shoes: '#c84a3a' };
  const PEOPLE = {
    me: Object.assign({ key: 'mika' }, ME),
    meB: Object.assign({ key: 'mika-blind', extra(g, d, fr, G, R) {   // 蒙着白手巾
      if (d === 0) { R(3, G.hT + 3, 10, 2, '#efebe0'); R(3, G.hT + 5, 10, 1, '#c8c4b8'); }
      else if (d === 1) { R(4, G.hT + 3, 8, 2, '#efebe0'); R(11, G.hT + 3, 2, 4, '#efebe0'); }
      else { R(3, G.hT + 3, 10, 2, '#efebe0'); R(7, G.hT + 5, 2, 3, '#efebe0'); }
    } }, ME),
    shota: { key: 'shota', skin: '#f0c49a', hair: '#1a1412', hs: 'short', top: '#e8c030', top2: '#f0d860', bottom: '#c03a2a', shoes: '#e8e0d0', child: true },
    shotaH: { key: 'shota-hat', skin: '#f0c49a', hair: '#1a1412', hs: 'short', top: '#e8c030', top2: '#f0d860', bottom: '#c03a2a', shoes: '#e8c030', child: true, hat: 'straw' },
    shotaE: { key: 'shota-eyes', skin: '#f0c49a', hair: '#1a1412', hs: 'short', top: '#e8c030', top2: '#f0d860', bottom: '#c03a2a', shoes: '#3a3030', child: true,
      extra(g, d, fr, G, R) { if (d === 0) { R(4, G.hT + 3, 8, 3, '#f0c49a'); R(4, G.hT + 3, 8, 1, '#d8a880'); } else if (d === 1) R(4, G.hT + 3, 3, 3, '#f0c49a'); } },
    baba: { skin: '#e2bc98', hair: '#c8c4c0', hs: 'bun', top: '#5a5a7a', bottom: '#4a4a5a', skirt: true, apron: '#e8e4dc', shoes: '#3a3030' },
    shinji: { key: 'shinji', skin: '#e0c0a0', hair: '#2a2420', hs: 'messy', top: '#7a8070', top2: '#5a6050', bottom: '#5a6050', shoes: '#3a3a3a', eye: '#9a9a94' },
    jii: { skin: '#c89a70', hair: '#d8d4cc', hs: 'bald', top: '#4a5a7a', top2: '#e8e4dc', bottom: '#3a3a48', hat: 'straw', shoes: '#2a2a2a' },
    kunef: { key: 'kunef', skin: '#f0f0ea', hair: '#f0f0ea', hs: 'bald', eye: '#f0f0ea', top: '#f0f0ea', bottom: '#f0f0ea', shoes: '#f0f0ea',
      extra(g, d, fr, G, R) { R(7, G.hT + 1, 1, 2, '#a8a8a0'); R(8, G.hT + 3, 1, 2, '#a8a8a0'); R(7, G.hT + 5, 1, 2, '#a8a8a0'); R(5, G.hT + 4, 1, 1, '#c8c8c0'); R(10, G.hT + 2, 1, 1, '#c8c8c0'); } },
    kuneI: { key: 'kune-icon', skin: '#f2f2ec', hair: '#f2f2ec', hs: 'bald', eye: '#f2f2ec', top: '#eeeee8', bottom: '#eeeee8', shoes: '#e0e0d8', noFeet: true,
      extra(g, d, fr, G, R) {
        const w = '#f2f2ec', s = '#c8c8c0';
        R(1, G.tT - 1, 3, 1, w); R(0, G.tT - 4, 1, 3, w); R(1, G.tT - 6, 1, 2, w);
        R(12, G.tT + 2, 3, 1, w); R(15, G.tT + 3, 1, 4, w); R(14, G.tT + 7, 1, 2, w);
        R(5, G.hT + 3, 6, 1, s); R(7, G.hT + 4, 1, 2, s); R(9, G.tT + 2, 1, 4, s); R(6, G.tT + 4, 1, 3, s);
      } }
  };
  /* ---------- 目标 ---------- */
  function goalNow(S) {
    const f = S.f;
    if (f.phase === 'noon') return '去院子里叫翔太回来吃饭';
    if (f.phase === 'home') return '闭着眼睛回家（外婆家的门在院子北边）';
    if (f.got) return '牵着翔太，闭着眼睛走回鸟居';
    if (f.blind) return '闭着眼睛，按舅舅画的路去找翔太';
    if (!f.readNikki && !f.readBaba) return '找翔太';
    if (!f.readBaba) return '翔太去田里了！外婆每晚都在佛龛前写东西——也许写着该怎么办';
    const need = [];
    if (!S.has('bell')) need.push('打开院子里的土藏，取出田神的铃');
    if (!S.has('towel')) need.push('找一块能蒙住眼睛的布');
    if (!f.uta) need.push(S.has('bell') ? '带着铃去找舅舅' : '弄清去水神池的路');
    if (need.length) return need.join('；');
    return '穿过水田，去东边的水神池找翔太';
  }
  const upd = S => S.goal(goalNow(S));

  /* ---------- 看清了 = 死 ---------- */
  async function seen(S) {
    S.f.lock = true;
    S.amb('none'); S.sfx('tv'); S.fx('static', { dur: 1.4 });
    await S.wait(700);
    await S.scare('face', { spr: '@kunef', dur: 1.2 });
    await S.die('你看清楚了。\n\n它是什么，它为什么一直在扭——那一瞬间，你全都明白了。\n明白了以后，就一点也不害怕了。\n\n「……不知道，比较好。」', '你看清了它');
  }
  async function confirmBino(S) {
    await S.narr('你把望远镜举到了眼前——');
    S.sfx('whisper');
    await S.say('', '「……不知道……比较好……」', { style: 'whisper' });
    await S.narr('不知道从哪里，传来了舅舅的声音。');
    return (await S.ask('还要看吗？', ['看。', '放下望远镜'])) === 0;
  }
  async function badEnd(S) {
    const f = S.f; f.lock = true;
    const m = curMap(), p = W.pl;
    let k = null, kd = 1e9;
    for (const e of m.ents) if (e.kk && !e.hidden) { const d = Math.hypot(e.px - p.px, e.py - p.py); if (d < kd) { kd = d; k = e; } }
    if (f.blind) { await S.narr('你一把扯下了蒙在眼睛上的手巾。\n正午的阳光刺进来，白得什么都看不见，眼泪一下子涌了出来。'); unblind(S); }
    S.amb('none'); f.quiet = true;
    await S.narr('你举起了望远镜。');
    if (k) S.focus(Math.round(k.px / TS), Math.round(k.py / TS));
    for (let i = 1; i <= 8; i++) { f.gz = i * .09; await S.wait(170); }
    await S.narr('镜片里，田的那一头一下子被拉到了眼前。\n白色的。细长的。在扭。');
    S.sfx('tv');
    for (let i = 0; i < 5; i++) { f.gz = .75 + i * .05; await S.wait(160); }
    await S.narr('它不是布。\n它也不是人。\n它扭，是因为——');
    await S.scare('face', { spr: '@kunef', dur: 1.4 });
    S.fx('static', { dur: 2 }); S.fx('flash', { dur: 1.6 });
    await S.narr('啊。\n\n……原来是这样。');
    await S.fade(1, 1500); S.focus(null); f.gz = 0;
    await S.end({ bad: true, title: '看清楚了', text: '那天傍晚，美夏一个人从田那边走回来，站在门口，笑着对外婆说了一句：\n「不知道比较好。」\n\n爸妈连夜从城里赶来，在外婆家的饭桌前坐了一整夜。\n天亮的时候，爸爸红着眼睛说：\n「……这孩子，不能带回去了。」\n\n从那以后，外婆家最里面那间没有窗户的屋子里，住着两个人。\n他们并排对着墙坐着，一起，轻轻地扭。' });
  }

  /* ---------- 正午：晾衣竿边 ---------- */
  async function noonScene(S) {
    const f = S.f; f.sawIt = true; f.lock = true;
    S.face('shota_y', 'pl'); S.face('pl', 'shota_y');
    await S.say('翔太', ['姐姐你看，你看！田里有个白白的人在跳舞！', '那边那边！扭来扭去的，好好笑！']);
    S.face('shota_y', 2);
    S.focus(28, 13);
    await S.wait(500);
    await S.narr('顺着翔太的手指看过去——\n田的那一头，绿油油的稻子中间，站着一个白色的东西。');
    for (let i = 1; i <= 5; i++) { f.gz = .07 * i; await S.wait(180); }
    await S.narr('它在扭。\n像一条被风吹着的白布——可今天一丝风也没有。\n而且那扭法，也不像布。太……太用力了。');
    for (let i = 6; i <= 10; i++) { f.gz = .065 * i; await S.wait(160); }
    S.sfx('tv');
    await S.think('那是什么？人？稻草人？……再仔细看看——');
    S.fx('static', { dur: .6 }); S.sfx('heart');
    f.gz = .72; await S.wait(500);
    S.place('baba_y', 7, 2, 0);
    await S.say('外婆', '美夏！翔太！不许看！！', { style: 'big' });
    f.gz = 0; S.focus(null);
    await S.walk('baba_y', adj(S, 'baba_y', 5, 5), 4);
    S.face('baba_y', 'shota_y'); S.ent('shota_y').spr = '@shotaE';
    await S.narr('外婆一把把翔太搂过去，用粗糙的手掌捂住了他的眼睛。');
    await S.say('翔太', '外婆你干嘛呀！我还没看清楚呢——');
    await S.say('外婆', '看清楚就坏了！', { style: 'big' });
    S.face('baba_y', 'pl');
    await S.say('外婆', ['……美夏，你也是。眼睛往下看，看自己的脚。', '那东西，咱们这儿的老人叫它「田里的白东西」。大晴天，正午前后，水田边上——它最喜欢这种日子。']);
    await S.say('翔太', '它扭来扭去的！就叫它「くねくね」好了！');
    await S.say('外婆', ['叫什么都行。你们俩给我记住：远远地瞟一眼，不碍事。', '可千万别盯着看。别想去弄明白它是个什么东西。', '弄明白了的人，就……']);
    S.bubble('baba_y', '…', 1800);
    await S.narr('外婆没有说下去。\n她回过头，看了一眼屋子最里面，那扇一直关着的拉门。');
    await S.say('外婆', '……就回不来了。走，进屋吃素面。');
    await S.fade(1, 900);
    S.hide('baba_y'); S.hide('shota_y'); S.ent('shota_y').spr = '@shotaH';
    S.hide('baba_h'); S.show('nebaba'); S.hide('shoesS');
    f.gz = 0; f.lock = false; f.phase = 'search';
    await S.card('午后一点', '', '素面又凉又滑。外婆一边吃，一边念叨城里的孩子不经晒。\n\n吃完饭，她躺在缘侧的凉席上打起了盹。\n收音机里，甲子园还在转播。\n你听着听着，也迷迷糊糊地睡着了。\n\n醒来的时候，太阳还是那么白。\n屋子里安静得出奇。');
    await S.go('house', 10, 5, 0);
    S.cp('search');
  }

  /* ---------- 屋里 ---------- */
  async function shinjiTalk(S) {
    const f = S.f;
    if (S.has('bell') && !f.uta) return shinjiMap(S);
    if (f.phase === 'noon') {
      if (S.once('meetShinji')) {
        await S.narr('伸二舅舅背对着门，坐在屋子正中间，面朝着墙。\n他的肩膀一直在轻轻地晃。左一下，右一下。');
        await S.say('美夏', '……舅舅，我们来啦。');
        S.bubble('shinji', '…', 1500);
        await S.say('伸二舅舅', '不知道……比较好。', { style: 'whisper' });
        await S.think('妈妈说，舅舅小时候生过一场病，从那以后就一直住在外婆家，没有再回城里上学。\n每年来，他都只会说这一句话。');
        return;
      }
      return S.say('伸二舅舅', '……不知道……比较好……', { style: 'whisper' });
    }
    if (f.uta) return S.say('伸二舅舅', ['……铃。', '闭着眼睛。……别睁。'], { style: 'whisper' });
    const L = [['翔太……去了。', '去看了。去……弄明白。'], ['……白的。在扭。', '扭啊……扭啊……'], ['不知道……比较好。', '不知道……比较好。']];
    await S.say('伸二舅舅', L[(f._sj = ((f._sj ?? -1) + 1) % 3)], { style: 'whisper' });
    if (S.once('shinjiHint')) await S.think('舅舅好像知道翔太去了哪儿。\n……可他听不进人话。他会对什么有反应呢？');
  }
  async function shinjiMap(S) {
    const f = S.f; f.uta = true;
    S.sfx('bell');
    await S.narr('挂在你胸前的铃铛，「叮铃」响了一声。');
    f.shStill = true;
    await S.narr('舅舅的肩膀停住了。\n很慢很慢地，他转过身来。');
    S.face('shinji', 'pl');
    await S.say('伸二舅舅', '……爷爷的，铃。');
    await S.narr('他的眼睛是灰的，像蒙着一层水汽。可他确确实实是在看着你。');
    await S.say('伸二舅舅', ['水神池……爷爷，带我去过。闭着眼睛。', '闭着眼睛……就不会……知道。']);
    await S.narr('他从榻榻米缝里摸出一截白蜡笔，在一张旧挂历的背面画了起来。\n画得很慢，很用力。');
    await S.note('uta');
    await S.say('伸二舅舅', '翔太……在等。快去。');
    await S.narr('说完，他又转回去，面朝着墙。\n肩膀又开始晃。左一下，右一下。');
    f.shStill = false; S.face('shinji', 3);
    upd(S);
  }
  async function butsu(S) {
    if (S.once('butsu1')) await S.narr('黑漆的佛龛。外公的遗像摆在里面，戴着一顶草帽，眯着眼睛笑。\n线香刚燃完，烟还没散，一缕一缕地往上扭。');
    if (S.f.phase === 'noon') return S.narr('佛龛底下有一个小抽屉。外婆每天晚上都会坐在这里，写点什么。');
    if (S.once('butsuDrawer')) await S.narr('佛龛底下的小抽屉没有上锁。\n里面是一本旧日记本，有一页折了角。');
    S.f.readBaba = true;
    await S.note('baba');
    if (S.once('afterBaba')) await S.think('蒙上眼睛，摇着田神的铃，牵着手走回来……\n铃在藏里。藏的锁号，是「伸二回不来的那一天」。');
    upd(S);
  }
  async function bag(S) {
    if (S.f.phase === 'noon') return S.narr('翔太的小背包。拉链上挂着一只塑料独角仙，是他在车站的扭蛋机里扭的。');
    if (S.once('bagOpen')) await S.narr('背包敞着口。暑假作业本被翻开了，铅笔字还亮晶晶的。');
    S.f.readNikki = true;
    await S.note('nikki');
    if (S.once('afterNikki')) await S.think('……这个笨蛋。');
    upd(S);
  }
  async function oshiire(S) {
    if (S.f.phase === 'noon') return S.narr('壁橱的拉门关着。舅舅就坐在它前面，你不好意思去翻。');
    if (S.once('oshi')) {
      await S.narr('壁橱里塞满了旧被褥和纸箱。最上面的纸箱里，是一摞小学生的作业本。\n最上面那本，封面上写着：「绘日记　二年级　纪子」。');
      await S.think('纪子——是妈妈的名字。');
    }
    S.f.readEhon = true;
    await S.note('ehon');
    upd(S);
  }
  async function babaSleep(S) {
    S.bubble('nebaba', '…', 1500);
    if (S.once('babaSleep1')) {
      await S.narr('外婆侧躺在缘侧的凉席上，睡得很沉。团扇从她手里滑了下来。');
      await S.say('外婆（梦话）', ['……伸二……别看……', '……把铃……摇响……闭上……眼睛……'], { style: 'whisper' });
      await S.narr('你推了推她的肩膀。她只是皱了皱眉，翻了个身。');
      await S.think('叫不醒。……外婆每天晚上，都会在佛龛前面写点什么。');
      return;
    }
    await S.say('外婆（梦话）', ['……别看……别看呀……', '……那孩子……回不来了……'][(S.f._bs = ((S.f._bs ?? -1) + 1) % 2)], { style: 'whisper' });
  }

  /* ---------- 土藏 ---------- */
  async function kuraDoor(S) {
    const f = S.f;
    if (f.phase === 'home') return S.narr('（冰凉的铁门。……这是藏。家门还在左边。）');
    if (f.kuraOpen) { S.sfx('open'); return S.go('kura', 5, 6, 3); }
    if (f.phase === 'noon') return S.narr('土藏的铁门上挂着一把老式的数字锁。\n外婆说，那是外公的藏，小孩子别进去。');
    await S.narr('厚重的铁门上挂着一把老式数字锁。四个转轮，锈得发黑。');
    const v = await S.keypad('四位数字锁', KEYS, 4);
    if (v == null) return;
    if (v !== '0813') {
      S.sfx('locked'); await S.narr('「咔」——锁纹丝不动。');
      if (!f.readBaba) await S.think('……号码会是什么？外婆一定知道。');
      else if (!f.readEhon) await S.think('外婆写的是「伸二回不来的那一天」。……那是哪一天？\n那年夏天的事，也许还有别人记下来过。');
      else await S.think('「伸二回不来的那一天」……妈妈的绘日记里，那一页一个字也没有。');
      return;
    }
    f.kuraOpen = true; S.ent('kuraD').open = true; S.sfx('open');
    await S.narr('锁「咔哒」一声弹开了。\n门轴发出一声长长的呻吟。一股陈年的霉味和凉气，从黑洞洞的门里涌出来。');
    await S.go('kura', 5, 6, 3);
  }
  async function boxOpen(S) {
    if (S.f.gotBell) return S.narr('桐木箱空了。箱底的绒布上，留着一副望远镜和一只铃铛压出来的印子。');
    S.f.gotBell = true; S.ent('tana').s.got = true;
    await S.narr('架子最上层放着一只长长的桐木箱。箱盖上用毛笔写了一个字：「封」。');
    S.sfx('open');
    await S.narr('箱子里是一副黑色的老式双筒望远镜。\n背带上，用红绳拴着一只小小的铜铃铛。');
    await S.narr('你想把铃铛解下来——可红绳打的结又紧又怪，一圈缠着一圈，像是故意不让人把它们分开。');
    S.give('bino'); S.give('bell');
    await S.think('……只能两样一起带着了。');
    S.sfx('bell');
    await S.narr('铃铛轻轻地响了一声。\n望远镜沉甸甸地挂在你脖子上，镜片冰凉。');
    upd(S);
  }

  /* ---------- 院子 ---------- */
  async function hosho(S) {
    const f = S.f;
    if (f.phase === 'home') return S.narr('（手碰到了晒得发烫的晾衣竿。床单擦过你的脸。……没事。是床单。）');
    if (f.phase === 'noon') return S.narr('晾衣竿上挂着外婆的白手巾、一条白床单，还有你的粉色T恤，晒得硬邦邦的。');
    if (!S.has('towel') && !f.usedTowel) {
      S.ent('hosho').s.towel = false; S.give('towel');
      await S.narr('你从晾衣竿上取下外婆的白手巾。又干又暖，带着太阳的味道。\n叠成长条，正好能蒙住眼睛。');
      return upd(S);
    }
    if (S.has('bino')) {
      await S.narr('这里是外婆家视野最好的地方。整片水田，一眼就能望到头。\n脖子上的望远镜，好像比刚才沉了一点。');
      const r = await S.ask('要用望远镜看看，翔太在不在田里吗？', ['举起望远镜', '不。（外婆说过，不能看。）']);
      if (r === 0 && await confirmBino(S)) return badEnd(S);
      return S.narr('你把望远镜塞回了衣服里。镜片贴着肚皮，冰凉冰凉的。');
    }
    await S.narr('白床单还在一下一下地鼓起来，又瘪下去。\n……今天一丝风都没有。');
  }
  async function genkan(S) {
    const f = S.f;
    if (f.phase === 'home') {
      if (!f.t2) return S.narr('（是玄关的拉门。……可你总觉得，身后还有什么事没了结。）');
      return finale(S);
    }
    S.sfx('open');
    await S.go('house', 9, 8, 3);
  }
  async function toTanbo(S) {
    const f = S.f;
    if (f.phase === 'noon') { S.sfx('locked'); await S.narr('外婆说了，大中午的不许往田里去。\n……先去叫翔太吃饭。'); return S.pos(15, 14, 3); }
    if (f.phase === 'home') { await S.narr('翔太的手在发抖。……先回家。'); return S.pos(15, 14, 3); }
    await S.go('tanbo', 3, 1, 0);
  }
  async function tempt1(S) {
    const f = S.f; f.t1 = true;
    S.sfx('whisper');
    await S.say('外婆的声音', '美夏——翔太——', { style: 'whisper' });
    await S.say('外婆的声音', ['到家啦。没事啦。', '把布摘下来吧。睁开眼睛，看看外婆。']);
    await S.narr('声音是从右手边传来的。\n从田里。');
    const r = await S.ask('', ['（摘下手巾，睁开眼睛）', '（外婆在屋里睡觉。……不睁。）']);
    if (r === 0) {
      unblind(S); f.lock = true;
      S.focus(28, 13);
      await S.narr('你扯下手巾——');
      for (let i = 1; i <= 6; i++) { f.gz = i * .15; await S.wait(120); }
      await S.narr('田埂边上，什么外婆也没有。\n只有一个白色的东西，离你只有几步远，扭得那么高兴。');
      S.focus(null);
      return seen(S);
    }
    await S.narr('你攥紧翔太的手，继续往前走。\n身后的「外婆」不出声了。\n只有稻子沙沙地响，一下，一下，像是有什么东西在里面扭。');
  }
  async function tempt2(S) {
    const f = S.f; f.t2 = true;
    await S.narr('脚下的碎石子变成了院子里的泥地。\n快到了——');
    S.sfx('heart');
    await S.narr('脖子上的望远镜，一下一下地撞着你的胸口。');
    await S.say('', ['「只要看一眼。」', '「只要一眼，你就全都明白了。」', '「它是什么。舅舅为什么那样。外公为什么把望远镜锁起来——全都明白。」'], { style: 'whisper' });
    await S.say('翔太', '……姐姐？你的手好凉。', { style: 'whisper' });
    const r = await S.ask('', ['举起望远镜', '不看。（握紧翔太的手，往前走）']);
    if (r === 0) return badEnd(S);
    S.sfx('tear');
    await S.narr('你把望远镜的背带从脖子上扯下来，使劲扔进了身后的草丛里。\n拴在上面的铃铛跟着飞了出去，「叮铃」一声，就再也不响了。');
    S.take('bino'); S.take('bell');
    S.goal('回家（玄关就在前面）');
  }
  async function finale(S) {
    const f = S.f; f.lock = true;
    S.sfx('open');
    await S.narr('你摸到了玄关的拉门。\n门「哗啦」一声，从里面被拉开了。');
    S.place('baba_y', 7, 1, 0);
    await S.say('外婆', '……美夏？翔太？');
    await S.say('外婆', ['好孩子……好孩子。', '到家了。是真的到家了。把布摘下来吧。']);
    const r = await S.ask('', ['摘下手巾', '（……真的是外婆吗？）']);
    if (r === 1) {
      await S.say('外婆', '……来，摸摸外婆的手。');
      await S.narr('一只干瘪、粗糙、暖乎乎的手，握住了你的手。\n手心里全是汗——是从梦里惊醒、光着脚跑出来的那种汗。');
    }
    unblind(S); S.dark(.32); S.fx('flash', { dur: .8 });
    S.follow('shota_y', false); S.ent('shota_y').spr = '@shotaE';
    await S.narr('你解开了手巾。\n太阳已经斜了，院子里铺着一层橘红色的光。');
    S.face('pl', 3);
    await S.narr('田那边，什么都没有。只有稻子，绿油油的，一动不动。');
    S.ent('shota_y').spr = '@shota';
    await S.say('翔太', ['外婆……', '我刚才，差一点就看懂了。']);
    await S.say('外婆', '不懂才好。一辈子都别懂。');
    S.show('shinji_y');
    await S.narr('缘侧的柱子旁边，舅舅不知什么时候走了出来。\n他站在屋檐的阴影里，望着你们。肩膀没有晃。');
    await S.say('伸二舅舅', '……回来了啊。');
    await S.narr('那是你第一次，听见舅舅说「不知道比较好」以外的话。');
    await S.fade(1, 1400);
    await S.card('那天晚上', '', '爸妈从城里赶了回来。\n外婆什么也没解释，只是在门口点了一小堆迎火——\n明明盂兰盆的头一天，早就过去了。\n\n翔太发了一夜的烧。\n第二天早上醒过来，喊饿，要吃西瓜。\n田里的事，他一点也不记得了。\n\n第三天，下了一场大雨。\n田里干干净净的。');
    await S.end({ title: '第一夜　完', text: '那副望远镜，后来再也没有找到。\n\n很多年以后，网上有人讲起一个故事：夏天的乡下，田的那一头，有一个白色的东西在扭。\n翔太把手机递给你看。\n\n「姐姐，你说那到底是什么？」\n「不知道。」\n\n——不知道，比较好。' });
  }

  /* ---------- 水田 ---------- */
  async function jiiTalk(S) {
    const f = S.f;
    if (S.once('jii1')) {
      await S.narr('水田里，一个戴草帽的老爷爷弯着腰在拔稗草。\n他的脸几乎贴着水面，从头到尾没有抬一下头。');
      await S.say('茂爷', ['……是阿婆家的外孙女吧。', '别停下来跟我说话，丫头。也别抬头。我在这块田里干了六十年，大晴天的晌午，从来不抬头。']);
      const r = await S.ask('', ['您看见我弟弟了吗？穿黄背心的小男孩。', '您……也见过那个白色的东西？']);
      if (r === 1) await S.say('茂爷', ['见过？……这一带谁没见过。远远地瞟一眼，一辈子也就那么几回，不碍事。', '要紧的是别去琢磨它。一琢磨，它就钻进你脑子里去了。']);
      await S.say('茂爷', ['小男孩？……拿着网子，往东边跑过去了。往水神池那边。', '我喊他，他不回头。一边跑一边笑，说要去看清楚。']);
      await S.say('茂爷', ['过了水神池的鸟居，就是它的地盘了。它就站在池子当中，在水上扭。', '想把人从那儿带回来——就得闭着眼睛进去。睁着眼睛，你自己也得搭进去。']);
      await S.say('茂爷', '走田埂的时候，挨着芦苇走。芦苇挡着，你就看不见它。……它也就看不见你。');
      f.toIke = true; upd(S);
      return;
    }
    const L = [['有人说那是田神，管雨水的。有人说是水神，是蛇。', '我年轻的时候，听海边来的鱼贩子讲，海上也有。浪头上一个，扭啊扭的——说是黑的。'], ['它只在大晴天出来。阴天、下雨，田里干干净净的。', '所以这一带的老人，都盼着盂兰盆下雨。'], ['看懂它的人会怎么样？……你舅舅那样。', '有人说那是疯了。我看不是。我看他们是……一点一点，变成那边的东西了。']];
    await S.say('茂爷', L[(f._jy = ((f._jy ?? -1) + 1) % 3)]);
  }
  async function yagura(S) {
    await S.narr('村里的火警瞭望塔。铁梯子晒得烫手，塔顶挂着一口锈了的警钟。');
    if ((await S.ask('要爬上去吗？', ['爬上去看看', '算了'])) === 1) return;
    S.sfx('step'); await S.wait(300); S.sfx('step'); await S.wait(300);
    await S.narr('你爬上塔顶。整片水田在脚下铺开，绿得发亮，热气一层一层地往上蒸。');
    await S.narr('东边，田的尽头，有一片黑沉沉的杉树林。树林中间亮着一块白光——是水神池。\n池子边上，有一个小小的黄点。');
    await S.think('是翔太！他的黄背心！');
    S.f.toIke = true;
    if (S.has('bino')) {
      await S.narr('黄点旁边的水面上，还有一个白色的东西，在扭。\n挂在脖子上的望远镜，好像比刚才更沉了。');
      const r = await S.ask('……', ['举起望远镜，看清楚', '不看。下去。']);
      if (r === 0 && await confirmBino(S)) return badEnd(S);
    }
    await S.narr('你闭上眼睛，摸着梯子爬了下来。');
    upd(S);
  }
  async function pickTrace(S, id, item, text, after) {
    S.hide(id); if (item) S.give(item);
    await S.narr(text);
    if (after) await S.think(after);
    S.f.toIke = true; upd(S);
  }

  /* ---------- 水神池 ---------- */
  const DEAD = { '3,10': [5, 12, 2], '13,14': [11, 13, 3], '11,4': [11, 6, 0] };
  const NEAR = ['3,11', '12,14', '11,5'];
  async function toriiOn(S) {
    const f = S.f;
    if (f.blind) {
      if (f.got) return S.narr('（鸟居粗糙的柱子。再往后，就是回家的路了。）');
      const r = await S.ask('（你摸到了鸟居的柱子。）', ['继续往里走', '摘下手巾，退回去']);
      if (r === 1) { unblind(S); S.pos(6, 16, 3); await S.narr('你解开手巾。阳光从树缝里漏下来，刺得眼睛发疼。'); upd(S); }
      return;
    }
    await S.narr('一座褪了色的红鸟居。柱子上贴着一张被雨泡烂的纸：「水神池　禁止垂钓」。\n鸟居那头的石板路，一直通到池子边。');
    const miss = [];
    if (!f.readBaba && !f.toIke) miss.push('……过了鸟居，眼睛就会自己去找它。该怎么做，外婆一定知道。');
    if (!S.has('towel')) miss.push('得有一块布，把眼睛蒙起来。');
    if (!S.has('bell')) miss.push('外婆的日记里说，要摇响田神的铃。铃在家里的土藏里。');
    if (!f.uta) miss.push('闭着眼睛，往哪儿走？……一脚就会踩进池子里。舅舅也许知道路。');
    if (miss.length) { await S.think(miss); return upd(S); }
    const r = await S.ask('要蒙上眼睛，走进鸟居吗？', ['蒙上眼睛', '再等等']);
    if (r) return;
    goBlind(S); f.usedTowel = true;
    await S.narr('你把外婆的手巾叠成长条，蒙在眼睛上，在脑后打了个死结。\n世界一下子变成了暗红色——那是正午的太阳，透过布照进来的颜色。');
    S.sfx('bell');
    await S.narr('你摇了一下铃铛。叮铃。\n舅舅画的路，你在心里又过了一遍。');
    S.toast('看不见了——按舅舅画的路走（笔记里可以重看）');
    upd(S);
    S.cp('blind');
  }
  async function cue(S, text, sfx) { if (sfx) S.sfx(sfx); await S.narr(text); }
  async function deadEnd(S, back) {
    S.sfx('sting'); S.shake(400, 2);
    const n = (S.f.dead = (S.f.dead || 0) + 1);
    const T = ['有什么东西，擦过了你的脸。\n凉的，湿的，软软的——像一条刚从水里捞出来的床单。\n它在扭。', '你的手碰到了它。\n它不是布。它比布要……\n你猛地缩回了手。', '它就在你面前。\n你能感觉到它在扭，扭得那么用力，连空气都跟着晃。\n它在等你睁开眼睛。'];
    await S.narr(T[(n - 1) % 3]);
    await S.say('', '「……看一看嘛。」', { style: 'whisper' });
    await S.narr('你咬紧牙，一步一步，摸着往回退。');
    S.pos(back[0], back[1], back[2]);
    if (S.f.got) S.place('shota_i', back[0], back[1]);
  }
  async function pushBack(S) {
    S.f.gz = Math.max(S.f.gz || 0, .45); S.sfx('heart');
    await S.narr('才走了两步，你的眼睛就自己往池子那边转了过去——\n白色的。扭着的。');
    await S.think('不行……睁着眼睛，过不去。');
    S.pos(6, 16, 3);
  }
  async function findShota(S) {
    const f = S.f;
    if (f.got) return S.say('翔太', '……姐姐，我闭着眼睛呢。', { style: 'whisper' });
    if (!f.blind) return S.narr('翔太背对着你，一动不动地望着池子。');
    await S.narr('你伸出手，摸到了一个小小的、汗湿的肩膀。');
    await S.say('翔太', ['……姐姐？', '姐姐，你看。它在跳舞。离得好近好近……', '我马上……马上就要看懂了。'], { style: 'whisper' });
    const r = await S.ask('', ['（摇响铃铛）', '翔太，你看见什么了？']);
    if (r === 1) {
      await S.say('翔太', ['它的脸……它没有脸。它的脸是……', '是……'], { style: 'whisper' });
      S.sfx('whisper'); S.shake(300, 1);
      await S.narr('你的手比脑子先动了。');
    }
    await S.bells(3, 520);
    await S.narr('叮铃——叮铃——\n铃声在水面上一圈一圈地荡开。翔太的肩膀猛地一抖。');
    S.ent('shota_i').spr = '@shotaE';
    await S.say('翔太', '……姐姐？我、我怎么了……眼睛好烫……');
    await S.say('美夏', ['闭上眼睛，翔太。用手捂住。', '抓着我的手。不管听见什么，都别睁开。']);
    await S.say('翔太', '……嗯。');
    S.sfx('whisper');
    await S.narr('你们身后的水面上，什么东西「哗啦」一声。\n它扭得更快了。');
    f.got = true; S.follow('shota_i', true);
    upd(S);
    S.cp('back');
  }
  async function leaveIke(S) {
    const f = S.f; f.lock = true;
    await S.narr('脚下又是那段平平的石板路了。你摸到了鸟居的柱子。');
    await S.say('翔太', '姐姐……它还在后面。它在叫我的名字。', { style: 'whisper' });
    await S.say('美夏', '别回头。别睁眼。抓紧我。');
    await S.fade(1, 900);
    await S.card('', '', '你们摸着田埂往回走。\n\n一步，一步。脚下的泥是烫的，稻叶刮着小腿。\n铃铛在胸口叮铃、叮铃地响。\n\n好几次，你听见身后的水田里，\n有什么东西跟着你们，「哗啦——哗啦——」地扭。\n\n你没有回头。');
    S.follow('shota_i', false); S.hide('shota_i');
    S.ent('shota_y').spr = '@shotaE'; S.show('shota_y'); S.follow('shota_y', true);
    f.phase = 'home'; f.lock = false;
    await S.go('yard', 15, 15, 3);
  }
  /*@@PART3@@*/
})();
