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
    if (h) { h.px = W.pl.px; h.py = W.pl.py; h.s.blind = !!f.blind; h.s.in = !m.def.field; h.s.cv = f.quiet ? 0 : (m.def.cicV ?? 1); h.s.dusk = f.dusk ? 1 : 0; }
    if (m.id === 'house') { const u = m.ents.find(e => e.id === 'shinji'); if (u) u.ox = f.shStill ? 0 : Math.round(Math.sin(W.t * 1.9) * 1.4); }
    if (!W.busy && !f.lock) {
      const r = m.def.field ? lookRate(m, f) : 0;
      f.gz = clamp((f.gz || 0) + (r > 0 ? r * dt : -.32 * dt), 0, 1.05);
      /* 正午还没听外婆讲规矩：看不死，翔太会喊你过去 */
      if (f.phase === 'noon' && !f.sawIt && f.gz > .5) { f.gz = .5; if (!f._noonCall) { f._noonCall = 1; runScript(noonCall); } }
      if (f.gz > .3) { f._hb = (f._hb || 0) - dt; if (f._hb <= 0) { f._hb = 1.1 - f.gz * .6; S.sfx('heart'); } }
      /* 耳鸣：越看得清楚，越尖、越响 */
      if (f.gz > .4) { f._er = (f._er || 0) - dt; if (f._er <= 0) { f._er = .55; const hz = 2600 + f.gz * 3400; S.tone('sine', hz, hz * 1.04, .7, .006 + f.gz * .016); } }
      if (f.gz > .3 && !f._w1) { f._w1 = 1; S.toast(['……别盯着它看。', '眼睛自己在往那边转。低头！', '看着脚下。看着脚下。'][(f._wn = ((f._wn || 0) + 1)) % 3]); }
      if (f.gz > .62 && !f._w2) { f._w2 = 1; S.fx('static', { dur: .5 }); S.sfx('whisper'); S.toast('它在扭……它是……它是——'); }
      if (f.gz < .15) { f._w1 = 0; f._w2 = 0; }
      if (f.gz >= 1) { f.gz = 1; runScript(seen); }
      /* 蒙着眼睛往回走的时候不能停：站着不动，身后的水声就一下一下近过来（S.moving 对客机操作也准） */
      if (f.blind && (f.got || f.phase === 'home')) {
        if (S.moving) f._still = 0;
        else {
          f._still = (f._still || 0) + dt;
          if (f._still > 4 && !f._st1) { f._st1 = 1; S.sfx('splash'); S.toast('……哗啦。身后的水田里，有什么东西近了一步。'); }
          if (f._still > 8 && !f._st2) { f._st2 = 1; S.sfx('whisper'); S.shake(300, 1); S.toast('「……看一看嘛。」它就贴在你背后。——走！别停下来！'); }
        }
        if (f._still === 0) { f._st1 = 0; f._st2 = 0; }
      }
    }
    const g = Math.round((f.gz || 0) * 40) / 40;
    if (h) h.s.g = g;
    for (const e of m.ents) if (e.kk) e.s.g = g;
  }
  function goBlind(S) { S.f.blind = true; S.wear('@meB'); S.norun(true); S.speed(.75); }
  function unblind(S) { S.f.blind = false; S.wear('@me'); S.norun(false); S.speed(1); }

  /* ---------- 声音（S.tone 合成，双方都听得到） ---------- */
  function bellTone(S, v = 1, delay = 0) {   // 田神的铃：小铜铃，高而细，尾音发颤
    S.tone('sine', 2637, 2610, 1.3, .06 * v, delay); S.tone('sine', 3951, 3900, .8, .025 * v, delay + .01);
    S.tone('triangle', 1318, 1318, 1, .02 * v, delay); S.tone('sine', 2650, 2600, .5, .02 * v, delay + .09);
  }
  async function bellRing(S, n, gap) { for (let i = 0; i < n; i++) { bellTone(S); await S.wait(gap); } }
  function koshien(S) {   // 甲子园开赛的警笛：拉长的一声，升上去，再慢慢落下来
    S.tone('sawtooth', 300, 820, 1.6, .035, 0, 1300); S.tone('sawtooth', 820, 800, 2.4, .035, 1.55, 1300); S.tone('sawtooth', 800, 260, 1.8, .03, 3.9, 1300);
  }
  const stepTick = (S, n) => { S.tone('triangle', 440, 400, .06, .035, 0, 1800); if (n % 3 === 0) bellTone(S, .35, .05); };   // 蒙眼时每一步：脚下「嗒」一声，每三步胸前的铃轻轻一响

  /* ---------- 两人一起决定 ----------
     safe：「诱惑」类选项里不去看的那一项。两人意见不一致时，不让操作者一个人把两个人都搭进去——
     手举到一半被按住，算没看，但眼睛已经往那边转过去了一点。 */
  async function choose(S, q, opts, who, safe, msg) {
    if (!S.coop) return S.ask(q, opts, who);
    const r = await S.vote(q, opts, who);
    if (r.agree) return r.v;
    if (safe != null) {
      S.sfx('heart');
      await S.narr(msg || '你的手抬到一半，又被另一股力气死死按了下去。\n心里有两个声音在吵——一个说「看一眼」，一个说「别看」。');
      if (!msg) S.f.gz = Math.max(S.f.gz || 0, .35);
      return safe;
    }
    await S.narr('你们俩的意见不一样。\n……最后，还是由现在拿主意的那个人做了决定。');
    return r.v;
  }
  /* 读档/死后重来：注视清零，脸转开（不让人一睁眼就正对着它） */
  function faceAway(S) {
    const m = curMap(), p = W.pl; if (!m || !m.def.field) return;
    let k = null, kd = VIEW + 1;
    for (const e of m.ents) if (e.kk && !e.hidden) { const d = Math.hypot(e.px - p.px, e.py - p.py) / TS; if (d < kd) { kd = d; k = e; } }
    if (!k) return;
    const dx = k.px - p.px, dy = k.py - p.py;
    S.turn(Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 1 : 2) : (dy > 0 ? 3 : 0));
  }

  /* ---------- 精灵 ---------- */
  const SPRITES = {
    haze(g, e, t) {   // 全屏：热浪扭曲 / 注视时的雪花与发白 / 蒙眼时的暗红；顺带合成蝉鸣
      const gz = e.g || 0;
      if (e.blind) {
        const px = W.pl.px - Math.round(CAM.x) + 8, py = W.pl.py - Math.round(CAM.y) + 3;
        const gr = g.createRadialGradient(px, py, 4, px, py, 36);
        gr.addColorStop(0, 'rgba(26,8,6,0)'); gr.addColorStop(.5, 'rgba(26,8,6,.66)'); gr.addColorStop(1, 'rgba(22,6,5,.975)');
        g.fillStyle = gr; g.fillRect(0, 0, VW, VH);
        g.fillStyle = 'rgba(150,40,20,.08)'; g.fillRect(0, 0, VW, VH);
        g.fillStyle = 'rgba(90,40,30,.10)';
        for (let y = 0; y < VH; y += 3) g.fillRect(0, y, VW, 1);
        for (let x = 0; x < VW; x += 4) g.fillRect(x, 0, 1, VH);
      } else {
        const amp = (e.in || e.dusk ? 0 : .9) + gz * gz * 8;
        if (amp > .4) for (let y = 0; y < VH; y += 2) {
          const o = Math.round(Math.sin(y * .12 + t * 5.2) * amp * (.55 + .45 * Math.sin(y * .027 - t * 1.6)));
          if (o) g.drawImage(g.canvas, 0, y, VW, 2, o, y, VW, 2);
        }
        if (e.dusk) {   // 结尾：太阳斜了，院子里铺着一层橘红色的光
          const gr = g.createLinearGradient(0, 0, 0, VH);
          gr.addColorStop(0, 'rgba(255,120,40,.30)'); gr.addColorStop(1, 'rgba(200,70,30,.16)');
          g.fillStyle = gr; g.fillRect(0, 0, VW, VH);
        } else if (!e.in) { g.fillStyle = 'rgba(255,238,190,.06)'; g.fillRect(0, 0, VW, VH); }
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
      const body = gz > .5 ? '#ffffff' : '#fbfbf5', sh = gz > .5 ? '#a8a8a0' : '#dcdcd2';
      const offAt = i => Math.sin(st * 1.3 + i * .42) * (1.2 + i * .1) + Math.sin(st * 2.9 - i * .23) * .9;
      R(2, 13, 12, 2, 'rgba(255,255,255,.14)'); R(3, -14, 10, 24, 'rgba(255,255,240,.07)');
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
    radio(g, e, t, R) {
      box(R, 2, 5, 12, 9, '#8a2a20'); R(3, 6, 6, 7, '#c8b898'); for (let y = 7; y < 13; y += 2) R(3, y, 6, 1, '#9a8a70');
      R(10, 7, 3, 2, e.st ? (Math.random() < .5 ? '#f4f4ee' : '#3a3a3a') : Math.sin(t * 3) > 0 ? '#ffd860' : '#e8b840'); R(10, 10, 3, 1, '#c9a35a'); R(12, -3, 1, 9, '#aaa');
      if (e.st) for (let i = 0; i < 6; i++) R(3 + ((Math.random() * 6) | 0), 6 + ((Math.random() * 7) | 0), 1, 1, '#f4f4ee');   // 只剩杂音
    },
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
  /* ---------- 惊吓大头像（32×32） ---------- */
  const FACES = {
    /* 看清的那一刻：一条被拧着的白布似的长脸，整张脸一行一行地错开着扭；
       两只高低不齐的黑洞眼，一道波浪形的嘴，越张越开；两条细胳膊在脸边上乱舞 */
    kunef(R, a, t) {
      const W1 = '#f6f6f0', W2 = '#d2d2c8', W3 = '#9a9a90', K = '#050505';
      const tw = .8 + a * 3.2;
      const off = y => Math.round(Math.sin(y * .33 + t * 7) * tw + Math.sin(y * .12 - t * 2.6) * tw * .7);
      for (let i = 0; i < 9; i++) {   // 两条细长的胳膊，关节反着弯
        const y = 30 - i * 2, s = Math.sin(t * 6 + i * .8) * 2;
        R(4 - i * .2 + s, y, 2, 2, W1); R(26 + i * .2 - s, y - 1, 2, 2, W1);
      }
      for (let y = 1; y < 32; y++) {
        const k = (y - 16) / 15, w = Math.max(1, Math.round(Math.sqrt(Math.max(0, 1 - k * k)) * (y < 16 ? 8.5 : 10)));
        const x = 16 - w + off(y);
        R(x, y, w * 2, 1, W1); R(x + w * 2 - 3, y, 3, 1, W2); R(x, y, 1, 1, W3);
        if (w > 3) R(x + ((y * 2 + Math.floor(t * 9)) % (w * 2 - 2)) + 1, y, 1, 1, W2);   // 拧出来的斜褶
      }
      const eh = 3 + Math.round(a * 5);
      for (let i = 0; i < eh; i++) { R(10 + off(10 + i), 10 + i, 3, 1, K); R(19 + off(13 + i), 13 + i, 2, 1, K); }
      const mh = 1 + Math.round(a * 3);
      for (let x = 9; x < 24; x++) { const y = 23 + Math.round(Math.sin(x * .8 + t * 10) * 1.5); R(x + off(y), y, 1, mh, K); }
    },
    /* 田埂上的「外婆」：先是一张笑眯眯的老人脸；接着脸色发白、眯着的眼变成两个黑洞、嘴一直咧到耳根，整张脸跟着扭起来 */
    nise(R, a, t) {
      const turn = a > .45, SK = turn ? '#f2f0e8' : '#e2bc98', SK2 = turn ? '#c8c8c0' : '#b88e6c', H = '#c8c4c0', H2 = '#8a8682', K = '#0a0606';
      const tw = turn ? (a - .45) * 7 : 0, off = y => Math.round(Math.sin(y * .42 + t * 8) * tw);
      R(12, 0, 8, 4, H); R(13, 0, 6, 1, H2); R(8, 3, 16, 6, H); R(6, 6, 3, 10, H); R(23, 6, 3, 10, H); R(10, 4, 1, 4, H2); R(21, 4, 1, 4, H2);
      for (let y = 7; y < 29; y++) { const k = (y - 17) / 12, w = Math.round(Math.sqrt(Math.max(0, 1 - k * k)) * 8.5); R(16 - w + off(y), y, w * 2, 1, SK); R(16 + w - 2 + off(y), y, 2, 1, SK2); }
      R(12 + off(9), 9, 8, 1, SK2); R(11 + off(11), 11, 10, 1, SK2); R(9 + off(20), 20, 2, 1, SK2); R(21 + off(20), 20, 2, 1, SK2);
      if (!turn) {   // 笑眯眯的弯眼
        R(10, 15, 4, 1, K); R(9, 16, 1, 1, K); R(14, 16, 1, 1, K); R(18, 15, 4, 1, K); R(17, 16, 1, 1, K); R(22, 16, 1, 1, K);
      } else for (let i = 0; i < 6; i++) { R(10 + off(13 + i), 13 + i, 4, 1, K); R(18 + off(13 + i), 13 + i, 4, 1, K); }
      const mw = 6 + Math.round(a * 14), mh = 1 + Math.round(a * 3), my = 23;
      R(16 - (mw >> 1) + off(my), my, mw, mh, '#2a0808'); if (a > .3) R(17 - (mw >> 1) + off(my), my, mw - 2, 1, '#e8e2cc');
    }
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
  async function seen(S, noFace) {
    S.f.lock = true;
    S.amb('none'); S.sfx('tv'); S.fx('static', { dur: 1.4 });
    await S.wait(700);
    if (noFace !== true) await S.scare('face', { face: 'kunef', dur: 1.2 });
    await S.die('你看清楚了。\n\n它是什么，它为什么一直在扭——那一瞬间，你全都明白了。\n明白了以后，就一点也不害怕了。\n\n「……不知道，比较好。」', '你看清了它');
  }
  async function confirmBino(S) {
    await S.narr('你把望远镜举到了眼前——');
    S.sfx('whisper');
    await S.say('', '「……不知道……比较好……」', { style: 'whisper' });
    await S.narr('不知道从哪里，传来了舅舅的声音。');
    return (await choose(S, '还要看吗？', ['看。', '放下望远镜'], '', 1)) === 0;
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
    await S.scare('face', { face: 'kunef', dur: 1.4 });
    S.fx('static', { dur: 2 }); S.fx('flash', { dur: 1.6 });
    await S.narr('啊。\n\n……原来是这样。');
    await S.fade(1, 1500); S.focus(null); f.gz = 0;
    await S.end({ bad: true, id: 'seen', title: '看清楚了', text: '那天傍晚，美夏一个人从田那边走回来，站在门口，笑着对外婆说了一句：\n「不知道比较好。」\n\n爸妈连夜从城里赶来，在外婆家的饭桌前坐了一整夜。\n天亮的时候，爸爸红着眼睛说：\n「……这孩子，不能带回去了。」\n\n从那以后，外婆家最里面那间没有窗户的屋子里，住着两个人。\n他们并排对着墙坐着，一起，轻轻地扭。' });
  }

  /* ---------- 正午：晾衣竿边 ---------- */
  async function noonScene(S) {
    const f = S.f; f.sawIt = true; f.lock = true;
    S.face('shota_y', 'pl'); S.face('pl', 'shota_y');
    await S.say('翔太', '姐姐你看！田里有个白白的人在跳舞！扭来扭去的，好好笑！');
    S.face('shota_y', 2);
    S.focus(28, 13);
    await S.wait(500);
    await S.narr('顺着翔太的手指看过去——\n绿油油的稻子中间，站着一个白色的东西。');
    for (let i = 1; i <= 5; i++) { f.gz = .07 * i; await S.wait(180); }
    await S.narr('它在扭。像一条被风吹着的白布——可今天一丝风也没有。\n而且那扭法，太……太用力了。');
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
    await S.say('外婆', ['……美夏，你也是。眼睛往下看，看自己的脚。', '那东西，老人们叫它「田里的白东西」。大晴天的晌午，水田边上——它最喜欢这种日子。']);
    await S.say('翔太', '它扭来扭去的！就叫它「くねくね」好了！');
    await S.say('外婆', ['叫什么都行。远远地瞟一眼，不碍事。可千万别盯着看，别想弄明白它是个什么东西。', '弄明白了的人，就……']);
    S.bubble('baba_y', '…', 1800);
    await S.narr('外婆没有说下去。她回头看了一眼屋子最里面，那扇一直关着的拉门。');
    await S.say('外婆', '……就回不来了。走，进屋吃素面。');
    await S.fade(1, 900);
    S.hide('baba_y'); S.hide('shota_y'); S.ent('shota_y').spr = '@shotaH';
    S.hide('baba_h'); S.show('nebaba');
    f.gz = 0; f.lock = false; f.phase = 'search';
    await S.card('午后一点', '', '吃完素面，外婆躺在缘侧的凉席上打起了盹。\n收音机里，甲子园还在转播。你听着听着，也睡着了。\n\n醒来的时候，太阳还是那么白。\n屋子里安静得出奇。');
    await S.go('house', 10, 5, 0);
    S.cp('search');
  }
  async function noonCall(S) {   // 正午还没碰头就自己去盯着田看：翔太把你叫回来
    S.bubble('shota_y', '!', 1200);
    await S.say('翔太', '姐姐——！你也看见了？快过来这边看呀！');
    await S.think('……眼睛好酸。热气晃得厉害。\n先去晾衣竿那边，把翔太叫回来。');
    S.goal('去晾衣竿那边找翔太');
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
    bellTone(S);
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
    if (S.coop) S.toast('双人时：蒙上眼睛以后，一个人打开「笺」看舅舅的画念路，一个人走');
    upd(S);
    S.cp('uta');
  }
  async function butsu(S) {
    if (S.once('butsu1')) await S.narr('黑漆的佛龛。外公的遗像摆在里面，戴着一顶草帽，眯着眼睛笑。\n线香刚燃完，烟还没散，一缕一缕地往上扭。');
    if (S.f.phase === 'noon') return S.narr('佛龛底下有一个小抽屉。外婆每天晚上都会坐在这里，写点什么。');
    if (S.once('butsuDrawer')) await S.narr('佛龛底下的小抽屉没有上锁。\n里面是一本旧日记本，有一页折了角。');
    S.f.readBaba = true;
    await S.note('baba');
    if (S.once('afterBaba')) {
      await S.think('蒙上眼睛，摇着田神的铃，牵着手走回来……\n铃在藏里。藏的锁号，是「伸二回不来的那一天」。');
      /* 屋里的一下：收音机断了，杂音里有翔太的笑声 */
      const rd = S.ent('radio'); rd.s.st = 1; S.sfx('tv'); S.shake(250, 1);
      await S.narr('身后的收音机「滋啦」一声，甲子园的解说断了。');
      S.sfx('giggle');
      await S.narr('沙沙的杂音里，有一个小孩在笑。\n离得很远，笑得很开心——\n是翔太的声音。');
      await S.wait(600); rd.s.st = 0; S.sfx('blip');
      await S.narr('……解说员的声音又回来了。好像什么都没发生过。');
    }
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
      const n = (f.lockMiss = (f.lockMiss || 0) + 1);
      /* 几个「差一点」的号码：说清楚错在哪 */
      const near = { '0814': '0814——是今天。……不对，要的是舅舅「回不来」的那一天。',
        '0820': '0820 是外婆写日记的日子。日记里说，那时候伸二已经那样「一个礼拜了」。……要往前推。',
        '1973': '昭和四十八年……是 1973 年没错。可锁只有四位，要的是「那一天」，不是哪一年。',
        '0812': '8 月 12 日，绘日记里哥哥说「明天用爸爸的望远镜看」。……是「明天」。' };
      if (near[v]) await S.think(near[v]);
      else if (!f.readBaba) await S.think('……号码会是什么？外婆一定知道。');
      else if (!f.readEhon) await S.think(n >= 3 ? '外婆的日记写在 8 月 20 日，那时候伸二已经回不来「一个礼拜」了。\n……那年夏天的事，妈妈小时候会不会也记下来过？壁橱里有她的旧本子。' : '外婆写的是「伸二回不来的那一天」。……那是哪一天？\n那年夏天的事，也许还有别人记下来过。');
      else if (n >= 3) await S.think('妈妈的绘日记：12 号，哥哥说「明天」要用望远镜看；\n13 号那一页，一个字也没有，只有一圈一圈的白蜡笔。\n……八月十三日。0、8、1、3。');
      else await S.think('「伸二回不来的那一天」……妈妈的绘日记里，有一页一个字也没有。');
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
    bellTone(S);
    await S.narr('铃铛轻轻地响了一声。\n望远镜沉甸甸地挂在你脖子上，镜片冰凉。');
    upd(S);
    S.cp('bell');
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
      const r = await choose(S, '要用望远镜看看，翔太在不在田里吗？', ['举起望远镜', '不。（外婆说过，不能看。）'], '', 1);
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
    const r = await choose(S, '', ['（摘下手巾，睁开眼睛）', '（外婆在屋里睡觉。……不睁。）'], '', 1);
    if (r === 0) {
      unblind(S); f.lock = true;
      S.focus(28, 13);
      await S.narr('你扯下手巾——');
      await S.scare('face', { face: 'nise', dur: 1.5, sfx: 'laugh' });
      for (let i = 1; i <= 6; i++) { f.gz = i * .15; await S.wait(120); }
      await S.narr('那张笑眯眯的脸，一下子就扭开了。\n田埂边上，什么外婆也没有。只有一个白色的东西，离你只有几步远，扭得那么高兴。');
      S.focus(null);
      return seen(S, true);
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
    const r = await choose(S, '', ['举起望远镜', '不看。（握紧翔太的手，往前走）'], '', 1);
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
    const r = await choose(S, '', ['摘下手巾', '（……真的是外婆吗？）']);
    if (r === 1) {
      await S.say('外婆', '……来，摸摸外婆的手。');
      await S.narr('一只干瘪、粗糙、暖乎乎的手，握住了你的手。\n手心里全是汗——是从梦里惊醒、光着脚跑出来的那种汗。');
    }
    unblind(S); S.dark(.18); f.dusk = true; f.quiet = true; S.hide('kk_y'); S.fx('flash', { dur: .8 });
    S.follow('shota_y', false); S.ent('shota_y').spr = '@shotaE';
    await S.narr('你解开了手巾。\n太阳已经斜了，院子里铺着一层橘红色的光。蝉不叫了。');
    S.face('pl', 0);
    await S.narr('你回过头。\n田那边，什么都没有。只有稻子，绿油油的，一动不动。');
    S.ent('shota_y').spr = '@shota';
    await S.say('翔太', ['外婆……', '我刚才，差一点就看懂了。']);
    await S.say('外婆', '不懂才好。一辈子都别懂。');
    S.show('shinji_y');
    await S.narr('缘侧的柱子旁边，舅舅不知什么时候走了出来。\n他站在屋檐的阴影里，望着你们。肩膀没有晃。');
    await S.say('伸二舅舅', '……回来了啊。');
    await S.narr('那是你第一次，听见舅舅说「不知道比较好」以外的话。');
    await S.fade(1, 1400);
    await S.card('那天晚上', '', '爸妈从城里赶了回来。\n外婆什么也没解释，只是在门口点了一小堆迎火——\n明明盂兰盆的头一天，早就过去了。\n\n翔太发了一夜的烧。\n第二天早上醒过来，喊饿，要吃西瓜。\n田里的事，他一点也不记得了。\n\n第三天，下了一场大雨。\n田里干干净净的。');
    await S.end({ id: 'home', title: '第一夜　完', text: '那副望远镜，后来再也没有找到。\n\n很多年以后，网上有人讲起一个故事：夏天的乡下，田的那一头，有一个白色的东西在扭。\n翔太把手机递给你看。\n\n「姐姐，你说那到底是什么？」\n「不知道。」\n\n——不知道，比较好。' });
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
      S.cp('field');
      return;
    }
    const L = [['有人说那是田神，管雨水的。有人说是水神，是蛇。', '我年轻的时候，听海边来的鱼贩子讲，海上也有。浪头上一个，扭啊扭的——说是黑的。'], ['看懂它的人会怎么样？……你舅舅那样。', '有人说那是疯了。我看不是。我看他们是……一点一点，变成那边的东西了。'],
      ['老辈人还有一句话，我小时候听了一直睡不着：', '「看懂了的孩子，别往城里带。留在家里养着——过几年，放回田里去。」', '……你外公那年，没舍得。'], ['它只在大晴天出来。阴天、下雨，田里干干净净的。', '所以这一带的老人，都盼着盂兰盆下雨。']];
    await S.say('茂爷', L[(f._jy = ((f._jy ?? -1) + 1) % 4)]);
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
      const r = await choose(S, '……', ['举起望远镜，看清楚', '不看。下去。'], '', 1);
      if (r === 0 && await confirmBino(S)) return badEnd(S);
    }
    await S.narr('你闭上眼睛，摸着梯子爬了下来。');
    upd(S);
    S.cp('field');
  }
  async function pickTrace(S, id, item, text, after) {
    S.hide(id); if (item) S.give(item);
    await S.narr(text);
    if (after) await S.think(after);
    S.f.toIke = true; upd(S);
    S.cp('field');   // 田里死了，不用再把东西捡一遍（重来时脸会先转开）
  }

  /* ---------- 水神池 ---------- */
  const DEAD = {   // 死路 → [退回的格子, 朝向, 违反的是画上的哪一句]
    '3,10': [5, 12, 2, '「灯笼往右走」——你往左边去了。'],
    '13,14': [11, 13, 3, '「风铃往上数五步」——你往下去了。'],
    '11,4': [11, 6, 0, '「往上数五步」——你多走了。第五步就该往右，踩上木桥。'] };
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
    bellTone(S);
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
    await S.think('舅舅的画上写的是' + back[3] + (n >= 2 ? '\n（记不清的话，打开「笺」再看一遍舅舅的画。）' : ''));
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
    const r = await choose(S, '', ['（摇响铃铛）', '翔太，你看见什么了？']);
    if (r === 1) {
      await S.say('翔太', ['它的脸……它没有脸。它的脸是……', '是……'], { style: 'whisper' });
      S.sfx('whisper'); S.shake(300, 1);
      const r2 = await choose(S, '（铃铛就攥在你手里。）', ['（摇铃，打断他）', '（……让他说完）'], '', 0, '你心里有两个声音：一个想听他说完，一个拼命喊「摇铃」。\n——攥着铃铛的手先抖了起来。');
      if (r2 === 1) return stayEnd(S);
      await S.narr('你的手比脑子先动了。');
    }
    await bellRing(S, 3, 520);
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
  /* 第三结局：让翔太把话说完——就是原帖里那个哥哥的结局 */
  async function stayEnd(S) {
    const f = S.f; f.lock = true;
    S.amb('none'); f.quiet = true;
    await S.say('翔太', '……是……', { style: 'whisper' });
    await S.wait(900);
    S.sfx('tv'); S.fx('static', { dur: 1.2 });
    await S.narr('翔太的肩膀，不抖了。');
    await S.say('翔太', ['啊。', '……原来是这样啊。'], { style: 'whisper' });
    await S.narr('他转过身来。你看不见他的脸，可你听得出来——他在笑。');
    S.ent('shota_i').spr = '@shota';
    await S.say('翔太', '姐姐。……不知道，比较好。', { style: 'whisper' });
    bellTone(S, .6);
    await S.narr('你手里的铃铛，「叮铃」一声，响得太晚了。');
    await S.fade(1, 1500);
    await S.end({ bad: true, id: 'stay', title: '留在乡下', text: '翔太是自己走回家的。一路上没有摔一跤，也没有说一句话。\n\n爸妈连夜赶来，在饭桌前坐了一整夜。天亮的时候，外婆把翔太的小背包收进了壁橱：\n「这孩子，别往城里带了。留在这儿，外婆养着。」\n\n你一个人坐上了回城的车。\n后来每年夏天再去，舅舅屋里都多一个坐垫。两个人并排对着墙，一起，轻轻地晃。\n\n有一年，你听见外婆在佛龛前小声说：\n「……再过几年，等稻子长高了，就放回田里去吧。」' });
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
  async function kakashi1(S) {
    if (S.once('kk1')) { S.sfx('sting'); S.shake(250, 1); await S.narr('白色的——！'); await S.wait(300); }
    await S.narr('……是个稻草人。\n穿着一件旧白衬衫，脸是用墨画的，一副傻乎乎的笑脸。');
    if (S.once('kk1b')) await S.think('吓死人了……腿都软了。');
  }
  async function ikeExit(S) {
    if (S.f.blind && !S.f.got) { await S.narr('……翔太还在里面。'); return S.pos(6, 16, 3); }
    await S.go('tanbo', 38, 21, 1);
  }

  /* ---------- 地图行 ---------- */
  const q = (c, n) => c.repeat(n);
  function yardRows() {
    const top = 'TTT' + q('#', 9) + 'TTTTT' + '####' + q('T', 13), pad = 'TT' + q('"', 30) + 'TT';
    const fld = q('i', 15) + 'a' + q('i', 8) + 'a' + q('i', 9);
    return [top, top, 'TT"' + q('w', 9) + q('"', 5) + 'xxxx' + q('"', 11) + 'TT', pad, pad, pad,
      q('h', 15) + '"""' + q('h', 16), q('v', 34), q('v', 34), 'eee' + q('~', 12) + 'a' + q('~', 15) + 'eee',
      fld, fld, q('a', 34), fld, fld, fld, q('i', 15) + 'a' + q('i', 18)];
  }
  function tanboRows() {
    const VX = [3, 12, 21, 30, 38], HY = [3, 9, 15, 21], rows = [];
    for (let y = 0; y < 24; y++) {
      let s = '';
      for (let x = 0; x < 40; x++) {
        let c = 'i';
        if (HY.includes(y) && x >= 3 && x <= 38) c = 'a';
        if (VX.includes(x) && y >= 1 && y <= 22) c = 'a';
        if (x === 25 || x === 26) c = HY.includes(y) ? 'l' : '~';                       // 水渠，田埂处架木板
        if ((y === 14 && x >= 13 && x <= 20) || (y === 20 && x >= 31 && x <= 37)) c = 'e';   // 芦苇：挡视线
        if ((x === 24 || x === 27) && y >= 4 && y <= 7) c = 'e';
        if (x >= 32 && x <= 36 && y >= 5 && y <= 7) c = 'T';                             // 镇守的小树林
        if (x === 2 && y === 12) c = 'd';
        if (x <= 1 || x === 39 || y === 0 || y === 23) c = 'T';
        if ((x === 3 && y === 0) || (x === 39 && y === 21)) c = 'a';
        s += c;
      }
      rows.push(s);
    }
    return rows;
  }
  function ikeRows() {
    const P = new Set(), add = (x0, y0, x1, y1) => { for (let x = x0; x <= x1; x++) for (let y = y0; y <= y1; y++) P.add(x + ',' + y); };
    add(6, 12, 6, 17); add(4, 16, 9, 16);       // 鸟居前后的石板路
    add(3, 12, 5, 12); add(3, 10, 3, 11);       // 死路 A（灯笼往左）
    add(7, 12, 11, 12);                         // 灯笼 → 风铃
    add(11, 13, 11, 14); add(12, 14, 13, 14);   // 死路 B（风铃往下）
    add(11, 7, 11, 11);                         // 风铃 ↑ 五步
    add(11, 4, 11, 6);                          // 死路 C（再往上）
    add(16, 7, 17, 7); add(17, 8, 17, 11);      // 过桥到头 → 往下 → 地藏
    const rows = [];
    for (let y = 0; y < 18; y++) {
      let s = '';
      for (let x = 0; x < 26; x++) {
        const water = x >= 18 || (y <= 6 && x >= 8) || (x >= 12 && x <= 16 && y >= 6 && y <= 8);
        let c = water ? '~' : 'B';
        if (x >= 12 && x <= 15 && y === 7) c = 'l';
        if (P.has(x + ',' + y)) c = 'k';
        if ((x <= 1 || y <= 1) && !water) c = 'T';
        if (y === 17 && x !== 6) c = 'T';
        s += c;
      }
      rows.push(s);
    }
    return rows;
  }
  const HZ = id => ({ id, hz: true, x: 0, y: 0, spr: 'haze', solid: false, z: 1 });
  const R0 = async S => { S.f.gz = 0; S.f.lock = false; S.f._still = 0; S.norun(!!S.f.blind); S.speed(S.f.blind ? .75 : 1); faceAway(S); };

  defChapter({
    id: 'kunekune', n: 1, title: 'くねくね', sub: '盛夏正午，田的那一头有个白色的东西在扭。远远看着不要紧——千万别想看清楚它是什么。', origin: '日本网络怪谈（2ch）', color: '#5e7a2e',
    icon: '@kuneI', amb: 'wind', floor: 'wood', wall: 'shoji', dark: 0, plr: 4,
    tileOpts: { grassC: '#4f7a34', treeC: '#2a4a24' },
    people: PEOPLE, sprites: SPRITES, tiles: TILES,
    items: {
      towel: { name: '白手巾', desc: '外婆晾在晾衣竿上的白手巾，晒得又干又暖。叠成长条，正好能蒙住眼睛。' },
      bell: { name: '田神的铃', desc: '一只小小的铜铃铛，用红绳拴在望远镜的背带上，怎么也解不开。' },
      bino: { name: '外公的望远镜', desc: '黑色的老式双筒望远镜，镜片冰凉。用它看，什么都能看得清清楚楚。' },
      hat: { name: '翔太的草帽', desc: '帽檐有点开线了。里面还是温的。' },
      net: { name: '捕虫网', desc: '翔太的捕虫网。网兜上挂着几根白色的、像丝一样的东西。' },
      sandal: { name: '黄色凉鞋', desc: '翔太的一只凉鞋，湿透了。' }
    },
    notes: {
      nikki: { title: '翔太的暑假日记（今天的）', text: '8月14日　晴\n\n外婆家的田里，有一个白白的人在跳舞。\n扭来扭去，扭来扭去，好好笑。\n外婆说不可以看。为什么？\n\n妈妈说，外公以前有一个望远镜。\n可是锁在藏里，打不开。\n\n那我就走近一点看。\n我要看清楚它到底是什么！\n\n（下面用铅笔画了一个白色的小人，手脚弯成奇怪的角度。旁边是戴草帽的翔太自己，在挥手。）' },
      baba: { title: '外婆的日记（折了角的一页）', text: '昭和四十八年　八月二十日\n\n伸二变成那样，已经一个礼拜了。\n\n那天中午，他和纪子在晾衣台上，说田那头有个白东西在扭。纪子说，哥哥举着他爸爸的望远镜看了好久，脸一下子就白了，放下望远镜，说：「不知道比较好。」\n从那天起，他就只会说这一句。\n\n他爸爸说，这孩子回不来了，别带回城里，就留在这儿。他把望远镜锁进藏里，锁的号码，设成了伸二回不来的那一天。说要一辈子记着。\n\n老人们说，要是有人被那东西勾住了，趁他还没看懂，还有办法：\n用布蒙住眼睛，摇着田神的铃走过去，牵住他的手，一路走回家。路上不管听见什么，都不能睁眼。\n\n——我那时候，为什么不知道。' },
      ehon: { title: '妈妈小时候的绘日记', text: '（一本褪了色的暑假绘日记。封面：二年级　纪子。）\n\n8月11日　晴\n外婆家的西瓜好甜。哥哥吃了五块。\n\n8月12日　晴\n哥哥说田里有白色的人在跳舞。外婆说不许看。\n哥哥说，明天用爸爸的望远镜看。\n\n8月13日　晴\n（这一页没有字。整页都用白蜡笔涂满了，一圈一圈，扭来扭去。蜡笔用力得把纸都划破了。）\n\n8月14日　晴\n哥哥不跟我玩了。\n妈妈一直在哭。' },
      minzoku: { title: '受潮的笔记本 · 水无濑村民间传承调查', text: '（封面：「昭和五十一年夏」。调查者的名字被水洇掉了。）\n\n· 田里的白东西\n老人叫它「田里的白东西」，城里来的学生叫它「くねくね」。晴天、炎热的正午前后，见于水田、溪边；阴雨天从不出现。远看是白色人形，不停地扭，像风吹的布——可那天多半没有风。\n\n· 禁忌\n远看无事。想看清它「是什么」的人，会言语失常。问他们看懂了什么，没有一个答得上来。\n\n· 诸说\n田神的使者；水神；蛇。看懂的人，自己也会慢慢变成它。邻县渔民说海上也有，是黑的；也有人说在城里的楼顶上见过。\n\n· 破除\n不明。只有一句老话：「看不清就看不清，闭着眼睛走回家。」\n\n（最后一行是铅笔字，很潦草）\n同行的Ｋ说今天在田里看见了，要回旅馆拿相机，拉近了拍——' },
      uta: { title: '舅舅的蜡笔画 · 去水神池的路', text: '（旧挂历的背面，用白蜡笔画的。线条歪歪扭扭，却一笔也没有断。）\n\n鸟居　↑　石灯笼\n石灯笼　→　风铃\n风铃　↑（五步）\n→　木桥　→　走到头\n↓　地藏\n\n旁边是外公教过的顺口溜：\n「闭眼过鸟居，往上摸灯笼；\n　灯笼往右走，风铃叮铃铃；\n　风铃往上数五步，往右踩木桥；\n　过桥走到头，往下找地藏；\n　地藏跟前人，牵手不回头。」\n\n（右下角，用很小很小的字写着：不知道比较好）' }
    },
    legend: '「くねくね」是日本的网络怪谈，名字是个拟态词，意思就是「扭来扭去」。据说最早的雏形在2000年前后就出现在网上：有人转述朋友小时候的经历——在乡下从窗口望见田里有个白色的东西，关节古怪地扭动；一起看的哥哥看着看着，好像「明白」了什么，从此就疯了。2003年前后，日本匿名论坛2ch灵异版（オカルト板）上流传开的一篇把故事定了型：一个孩子和哥哥回乡下外婆家，看见远处水田里有一个白色的人形东西，一刻不停地扭；哥哥拿来望远镜去看，看清之后脸色大变，只说了一句「わからないほうがいい」（不知道比较好），从此痴痴呆呆，像变了一个人。外婆哭着说那东西是不能看的；家里人最后决定，哥哥不能带回城里了，就留在乡下养着——「过几年，放回田里去」。\n\n在一遍遍的转贴和「我也见过」的回帖里，它的规矩渐渐固定下来：多在晴朗炎热的白天出现，常在水田、河边，也有人说在海边、在楼顶；远远看着不要紧，一旦「理解」了它是什么，人就会精神失常。它多半是白色的，也有黑色的版本。它不追人，也不伤人，什么也不做——可怕的只是「看懂」这件事本身。\n\n关于它到底是什么，说法很多。有人把它和日本农村的田神、水神信仰联系起来（田神春天从山里下来守护稻田，秋收后再回到山里；田里的稻草人，本来也被看作田神暂住的地方），也有人说是蛇神；有人觉得它不过是田边晒着的白布、稻草人，或者正午热浪里的海市蜃楼，被吓坏了的人越讲越玄；还有一种「同化」的说法：看懂了它的人，自己也会慢慢变成那样扭动的东西。\n\n后来，くねくね和「八尺大人」等一起，成了2ch「洒落怖」（开不得玩笑的恐怖故事）里最有代表性的形象之一，被写进漫画、小说和游戏，「不知道比较好」这句话也跟着它一起流传开来。\n\n（本章中的水无濑村、美夏一家和伸二舅舅的遭遇、外公的望远镜和土藏、茂爷、舅舅的蜡笔画，以及「蒙眼摇铃、牵手回家」的破解法，均为游戏虚构；那本民俗调查笔记也是虚构的，里面的说法综合自网上流传的各种版本。）',
    start: { map: 'house', x: 10, y: 5, dir: 0 },
    resume: { search: R0, bell: R0, uta: R0, field: R0, ike: R0, blind: R0, back: R0, home: R0 },
    endings: { home: '第一夜　完', seen: '看清楚了', stay: '留在乡下' },
    faces: FACES,
    async intro(S) {
      S.f.phase = 'noon';
      await S.card('第一夜　くねくね', '2003年8月14日　日本东北·水无濑村', '盂兰盆节，爸妈把你和弟弟翔太送到乡下外婆家，\n自己回城里加班去了。\n\n蝉叫得人头昏。\n田里的稻子绿得发亮，热气从地面上一层一层地往上冒。\n远处的东西，看起来都在轻轻地晃。');
    },
    tick(S, dt) { gazeTick(S, dt); },
    maps: {
      /* ---------------- 外婆家 ---------------- */
      house: {
        amb: 'room', dark: .22, darkC: '#1a1208', plr: 5, wall: 'shoji', floor: 'wood', cicV: .7,
        rows: [
          '######################',
          '######################',
          '#ttttt#ttttttttt#dddd#',
          '#ttttt#ttttttttt#dddd#',
          '#ttttt.ttttttttt.dddd#',
          '#ttttt#ttttttttt#dddd#',
          '#ttttt#ttttttttt#dddd#',
          '#######wwwwwwwwwwdddd#',
          '#wwwwwwwwwwwwwwww#####',
          '#########.############'],
        ents: [
          HZ('hz_house'),
          { x: 2, y: 1, spr: 'invisible', solid: true, on: look('墙上什么也没挂。\n这间屋子没有窗户——外婆说，是后来特意封上的。') },
          { x: 1, y: 2, spr: 'dresser', col: '#5a4030', on: look('旧衣柜。最下层的抽屉里，整整齐齐叠着几件小学生的白衬衫。\n尺码一年比一年大——到了某一年，就再也没变过。') },
          { id: 'oshiire', x: 4, y: 2, spr: 'closet', on: oshiire },
          { x: 2, y: 6, spr: 'tsuru', solid: false, on: look('榻榻米上排着一列白色的纸鹤。\n每一只的脖子，都被折成了扭曲的角度。像是在……跳舞。') },
          { id: 'shinji', x: 3, y: 4, spr: '@shinji', dir: 3, on: shinjiTalk },
          { id: 'butsu', x: 8, y: 2, spr: 'butsu', on: butsu },
          { x: 10, y: 1, spr: 'koyomi', on: look('农协送的挂历，翻在八月。\n十三号那一格用红笔写着「迎火」——盂兰盆的头一天，要在门口点一小堆火，把祖先接回家。十六号写着「送火」。') },
          { x: 13, y: 1, spr: 'mado', on: look('北边的窗外是后山。竹林一动不动，连一片叶子都不晃。') },
          { id: 'radio', x: 15, y: 2, spr: 'radio', on: look('「……第八十五届全国高中棒球锦标赛，第七天第二场比赛……」\n解说员的声音被暑气泡得软绵绵的。') },
          { x: 10, y: 4, w: 2, spr: 'lowtable', col: '#5a3a22', on: S => S.narr(S.f.phase === 'noon' ? '矮桌上摆着三副碗筷。外婆说，舅舅那份她会端进屋里去。' : '碗里的素面吃完了。翔太的碗边上，还粘着一片紫苏叶。') },
          { x: 9, y: 5, spr: 'cushion', col: '#6a4a8a', on: look('紫色的坐垫，被太阳晒得发烫。') },
          { x: 14, y: 4, spr: 'senpuki', on: look('电风扇「嗡嗡」地摇着头。转到你这边的时候，吹来的也是热风。') },
          { id: 'katori', x: 13, y: 6, spr: 'katori', on: look('陶土烧的蚊遣猪，嘴里吐着蚊香的烟。\n烟往上走，走着走着，就扭了起来——\n你赶紧把眼睛移开了。') },
          { id: 'bag', x: 8, y: 6, spr: 'bag', on: bag },
          { x: 17, y: 2, spr: 'stove', on: look('灶上的锅还冒着热气，煮素面的水咕嘟咕嘟地翻滚。') },
          { x: 18, y: 2, spr: 'sink', on: look('水龙头里出来的是井水，冰得手指发麻。') },
          { x: 19, y: 2, spr: 'counter', on: look('案板上切了一半的紫苏叶和茗荷，散着一股清凉的香味。') },
          { x: 20, y: 2, spr: 'fridge', on: look('冰箱门上贴着一张褪色的老照片：两个小孩站在稻田边上。\n大一点的男孩举着一副黑色的望远镜，冲着镜头笑。小一点的女孩扎着两根小辫。') },
          { x: 19, y: 1, spr: 'mado', on: look('厨房的窗外，是晒得发白的院子，和远处一片绿油油的田。') },
          { x: 18, y: 5, w: 2, spr: 'table2', col: '#8a6a44', on: S => S.narr(S.f.phase === 'noon' ? '大碗里的素面泡在冰水里，上面浮着几块冰。' : '大碗里只剩下冰水，冰块都化了。') },
          { id: 'baba_h', x: 18, y: 3, spr: '@baba', dir: 3, async on(S) {
            S.face('baba_h', 'pl');
            const L = ['素面马上就好。快去把翔太叫回来。', '翔太在院子里晾衣竿那边。……大中午的，别让他往田那边看。', '舅舅那份，外婆一会儿端进去。你别去吵他。'];
            await S.say('外婆', L[(S.f._bk = ((S.f._bk ?? -1) + 1) % 3)]);
            S.face('baba_h', 3);
          } },
          { id: 'nebaba', x: 11, y: 8, w: 2, spr: 'nebaba', hidden: true, on: babaSleep },
          { id: 'shoesS', x: 8, y: 8, spr: 'shoes', col: '#e8c030', on: S => S.narr(S.f.phase === 'noon' ? '踏板石上摆着三双鞋：外婆的木屐，你的运动鞋，翔太的黄色小凉鞋。' : '踏板石上只剩两双鞋了：外婆的木屐，你的运动鞋。\n翔太的黄色小凉鞋不见了。') },
          { x: 4, y: 8, spr: 'furin', solid: false, on: look('屋檐下挂着一只玻璃风铃。没有风，它一声也不响。') },
          { x: 9, y: 9, spr: 'invisible', touch: S => S.go('yard', 7, 2, 0) }
        ],
        async enter(S, first) {
          const f = S.f;
          if (f.phase === 'noon' && first) {
            koshien(S);
            await S.narr('……好热。你在榻榻米上醒过来，后背上全是汗。\n收音机里，甲子园的比赛开始了。警笛声拉得老长，被外面的蝉声盖住了一半。');
            await S.say('外婆（厨房）', ['美夏，醒啦？去把翔太叫回来，素面马上就好。他在院子里晾衣竿那边玩呢。', '大中午的，太阳毒——别让他往田那边看。']);
            upd(S);
          }
          if (f.phase === 'search' && S.once('missing')) {
            S.ent('shoesS').col = '#5a4030';
            await S.narr('翔太不在屋里。');
            await S.narr('缘侧的踏板石上，他那双黄色的小凉鞋不见了。挂在柱子上的捕虫网，也不见了。');
            await S.think('……他该不会，又去看那个东西了吧？');
            upd(S);
          }
        }
      },
      /* ---------------- 院子和村道 ---------------- */
      yard: {
        amb: 'wind', dark: 0, plr: 4, wall: 'wood', floor: 'wood', field: true,
        legend: { i: 'ine', a: 'aze', v: 'jari', '~': 'mizu', e: 'ashi' },
        rows: yardRows(),
        ents: [
          HZ('hz_yard'),
          { id: 'kuraF', x: 17, y: 0, w: 4, h: 2, spr: 'kuraF', decal: true },
          { id: 'genkan', x: 7, y: 1, spr: 'sliding', on: genkan },
          { x: 4, y: 1, spr: 'mado', on: look('窗户开着，竹帘卷起了一半。屋里的电风扇在慢慢地摇头。', '（手指碰到了竹帘。是外婆家的窗户。）') },
          { x: 10, y: 1, spr: 'mado', on: look('厨房的窗户。灶上的热气从窗口飘出来。', '（窗台被晒得发烫。）') },
          { id: 'kuraD', x: 18, y: 1, spr: 'kuraD', on: kuraDoor },
          { x: 3, y: 2, spr: 'furin', solid: false, on: look('屋檐下的玻璃风铃，一声也不响。', '（头顶上，风铃一声也不响。）') },
          { id: 'hosho', x: 4, y: 4, w: 3, spr: 'hosho', s: { towel: true }, on: hosho },
          { id: 'shota_y', x: 5, y: 5, spr: '@shotaH', dir: 0, async on(S) {
            if (S.f.phase === 'noon') return noonScene(S);
            await S.say('翔太', '……姐姐，我闭着眼睛呢。手好疼，你别攥那么紧。', { style: 'whisper' });
          } },
          { id: 'baba_y', x: 7, y: 2, spr: '@baba', hidden: true, on: S => S.say('外婆', '……好孩子。') },
          { id: 'shinji_y', x: 2, y: 2, spr: '@shinji', dir: 2, hidden: true, on: S => S.say('伸二舅舅', '……回来了啊。') },
          { x: 13, y: 4, spr: 'well', on: look('老水井，井口盖着半块木板。\n井绳上吊着一只木桶，桶里泡着一个大西瓜，凉气一丝一丝地往上冒。', '（井沿的石头，凉凉的。）') },
          { x: 14, y: 5, spr: 'jizo', on: look('院墙边的小地藏，红围兜晒得发白。\n脚边供着一块西瓜，已经招来了一串蚂蚁。', '（一尊小小的石像。是院子里的地藏。快到了。）') },
          { x: 27, y: 3, w: 2, spr: 'kei', on: look('外婆家的白色轻卡车，车斗里堆着几捆稻草。\n挡风玻璃上积了一层灰，雨刷底下夹着一张褪色的农协传单。', '（铁皮晒得烫手。是外婆家的轻卡车。）') },
          { x: 19, y: 6, spr: 'vending', col: '#d8d8dc', on: look('路边的自动贩卖机，嗡嗡地响着。\n「冰的」那一排，一半都亮着红色的「售完」。', '（嗡嗡的声音。是路边的贩卖机。）') },
          { x: 30, y: 6, spr: 'busstop', on: look('「水无濑」公交站。一天三班。下一班是下午四点十二分。\n站牌的铁杆子被晒得发烫。', '（铁杆子，烫的。）') },
          { x: 0, y: 7, spr: 'invisible', solid: true, on: look('村道往西通向镇上。爸妈的车，就是沿着这条路开走的。') },
          { x: 0, y: 8, spr: 'invisible', solid: true, on: look('村道往西通向镇上。爸妈的车，就是沿着这条路开走的。') },
          { x: 33, y: 7, spr: 'invisible', solid: true, on: look('村道往东拐进了山里。路面上的热气晃得厉害，看久了眼睛发酸。') },
          { x: 33, y: 8, spr: 'invisible', solid: true, on: look('村道往东拐进了山里。路面上的热气晃得厉害，看久了眼睛发酸。') },
          { x: 24, y: 16, spr: 'kakashi', col: '#7a7a6a', on: look('一个稻草人，戴着破草帽。它的衣服是灰的。\n……灰的。不是白的。你松了一口气。') },
          { id: 'kk_y', x: 30, y: 14, spr: 'kune', kk: true, solid: false },
          { x: 15, y: 16, spr: 'invisible', touch: toTanbo }
        ],
        async enter(S, first) {
          const f = S.f;
          if (f.phase === 'noon') {
            if (first) {
              await S.narr('一出门，热气就扑到了脸上。\n蝉声像是从四面八方的地底下冒出来的，吵得耳朵嗡嗡响。');
              S.bubble('shota_y', '!', 1200);
              await S.say('翔太', '姐姐——！快过来看！');
            }
            S.goal('去晾衣竿那边找翔太');
            return;
          }
          if (f.phase === 'search') {
            if (S.once('yardSearch')) {
              await S.narr('院子里一个人也没有。\n晾衣竿上那条白床单，一下一下地鼓起来，又慢慢地瘪下去。');
              await S.think('……今天明明一丝风都没有。');
            }
            return upd(S);
          }
          if (f.phase === 'home' && S.once('yardHome')) {
            await S.narr('脚下的田埂变宽了。前面传来水渠哗哗的声音。\n……快到家了。');
            await S.say('翔太', '姐姐，我能睁眼了吗？', { style: 'whisper' });
            await S.say('美夏', '还不行。进了家门才行。');
            upd(S);
            S.cp('home');
          }
        },
        step(S, x, y) {
          const f = S.f;
          if (f.phase === 'noon' && !f.sawIt && Math.abs(x - 5) + Math.abs(y - 5) <= 2) return noonScene(S);
          if (f.phase === 'home' && !f.lock) {
            if (f.blind) stepTick(S, (f._sn = (f._sn || 0) + 1));
            if (!f.t1 && y <= 12) return tempt1(S);
            if (f.t1 && !f.t2 && y <= 6) return tempt2(S);
          }
        }
      },
      /* ---------------- 土藏 ---------------- */
      kura: {
        amb: 'drone', dark: .8, darkC: '#060504', plr: 2.4, wall: 'plain', floor: 'darkwood',
        rows: [
          '############',
          '############',
          '#WWWWWWWWWW#',
          '#WWWWWWWWWW#',
          '#WWWWWWWWWW#',
          '#WWWWWWWWWW#',
          '#WWWWWWWWWW#',
          '#####W######'],
        ents: [
          { x: 6, y: 1, spr: 'slit', light: { r: 3.4, col: 'rgba(255,240,200,.14)', dy: 40 }, on: look('高处一扇小小的气窗。从这里只能看见一小块白晃晃的天。') },
          { x: 1, y: 2, spr: 'shelf', on: look('架子上摆着装稻种的纸袋，上面是外公的字：「越光」「笹锦」「去年的，勿用」。') },
          { x: 3, y: 2, spr: 'dresser', col: '#4a3424', on: look('旧衣柜。抽屉里塞满了发黄的报纸。\n最上面一张是昭和四十八年夏天的地方报，角落里有一小块：「水无濑村　十二岁男童疑似中暑　言语异常」。') },
          { id: 'chest', x: 5, y: 2, w: 2, spr: 'chest', async on(S) {
            if (S.once('chest')) await S.narr('长条形的旧木箱，盖子上落着厚厚的灰。\n箱子里是几卷旧挂轴，还有一本受了潮的笔记本。');
            await S.note('minzoku');
          } },
          { id: 'tana', x: 9, y: 2, spr: 'tana', on: boxOpen },
          { x: 10, y: 2, spr: 'kuwa', on: look('锄头和镰刀靠在墙上，刃口生了锈。\n墙角盘着一捆草绳，跟田里稻草人身上捆的是一样的。') },
          { id: 'tsutsumi', x: 10, y: 4, spr: 'tsutsumi', on: look('一个用旧白布裹起来的稻草人。白布裹得严严实实，连脸都蒙住了，外面捆了好几道草绳。\n布上用墨写着三个字：「看不得」。') },
          { x: 1, y: 5, spr: 'sack', on: look('几袋陈米。袋子上写的日期，是十年前的。') },
          { x: 8, y: 6, spr: 'barrel', on: look('腌菜桶，盖子上压着一块大石头。凑近了，有一股咸咸的酸味。') },
          { x: 9, y: 6, spr: 'crate', on: look('木箱里装着旧农具的零件，还有一盏没有灯泡的提灯。') },
          { x: 5, y: 7, spr: 'invisible', touch: S => S.go('yard', 18, 2, 0) }
        ],
        async enter(S, first) {
          if (!first) return;
          await S.narr('土藏里比外面凉快得多。一股霉味，混着陈米的味道。\n外面的蝉声一下子远了，像是隔着一层水。');
          await S.narr('高处的气窗里斜斜地照进来一道光，光里浮着灰。');
          upd(S);
        },
        async step(S, x, y) {
          if (Math.abs(x - 10) + Math.abs(y - 4) <= 1 && S.once('tsutsumiMove')) {
            const e = S.ent('tsutsumi');
            S.sfx('thud'); e.ox = 1; await S.wait(120); e.ox = -1; await S.wait(120); e.ox = 1; await S.wait(120); e.ox = 0;
            await S.narr('墙角那个裹着白布的东西，动了一下。');
            await S.think('……是风。\n……藏里哪来的风？');
          }
        }
      },
      /* ---------------- 水田 ---------------- */
      tanbo: {
        amb: 'wind', dark: 0, plr: 4, wall: 'plain', floor: 'dirt', field: true,
        legend: { i: 'ine', a: 'aze', '~': 'mizu', e: 'ashi', l: 'lightwood' },
        rows: tanboRows(),
        ents: [
          HZ('hz_tanbo'),
          { x: 3, y: 0, spr: 'invisible', touch: S => S.go('yard', 15, 15, 3) },
          { x: 39, y: 21, spr: 'invisible', touch: S => S.go('ike', 6, 16, 3) },
          { x: 4, y: 2, spr: 'sign', col: '#7a6040', on: look('木牌：「← 水无濑　　　水神池 →」\n箭头底下，有人用小刀刻了一行歪歪扭扭的字：「晌午别抬头」。') },
          { id: 'kakashi1', x: 8, y: 4, spr: 'kakashi', col: '#f2f0e8', on: kakashi1 },
          { id: 'jizoT', x: 13, y: 8, spr: 'jizo', on: look('田埂路口的地藏，红围兜晒褪了色。脚边供着一个干瘪的橘子。\n地藏的眼睛，是闭着的。') },
          { id: 'hat', x: 12, y: 9, spr: 'mugi', solid: false, on: S => pickTrace(S, 'hat', 'hat', '翔太的草帽。帽檐朝下扣在田埂上，像是跑的时候被风吹掉的——\n可今天没有风。\n帽子里面，还是温的。', '他往东边跑了。') },
          { id: 'jii', x: 8, y: 16, spr: '@jii', dir: 0, on: jiiTalk },
          { id: 'yagura', x: 2, y: 12, spr: 'yagura', on: yagura },
          { id: 'net', x: 21, y: 14, spr: 'ami', solid: false, on: S => pickTrace(S, 'net', 'net', '翔太的捕虫网。网杆斜插在芦苇边上，网兜朝着东边。\n网兜上挂着几根白色的、像丝一样的东西。', '……像是在给我指路。') },
          { id: 'sandal', x: 33, y: 21, spr: 'zori', solid: false, on: S => pickTrace(S, 'sandal', 'sandal', '一只黄色的小凉鞋，泡在水口边上。另一只不知道去哪儿了。\n水口的水哗哗地往东流——流向水神池的方向。', '翔太……光着一只脚，也要去看它吗？') },
          { x: 33, y: 22, spr: 'mizuguchi', on: look('水口。田里的水从这里哗哗地流出去，一路往东。') },
          { id: 'kakashi2', x: 35, y: 10, spr: 'kakashi', col: '#6a6a7a', blind: true, on: look('又一个稻草人。\n它的眼睛被人用一条白布蒙上了。\n……谁会给稻草人蒙眼睛？') },
          { id: 'kk_t1', x: 17, y: 12, spr: 'kune', kk: true, solid: false },
          { id: 'kk_t2', x: 34, y: 18, spr: 'kune', kk: true, solid: false }
        ],
        async enter(S, first) {
          if (!first) return;
          await S.narr('田埂窄得只能走一个人。两边的稻子快齐腰高了，绿得晃眼。\n水面上蒸起来的热气，让远处的一切都在轻轻地抖。');
          await S.think('别朝着它走。别盯着它看。……芦苇和树后面，应该就看不见它了。');
          S.toast('别长时间面朝白色的东西——芦苇、树丛能挡住视线');
          upd(S);
          S.cp('field');
        },
        step(S, x, y) {
          if (y === 3 && x >= 4 && x <= 7 && S.once('kk1see')) return (async () => {
            S.sfx('sting'); S.bubble('pl', '!', 1000);
            await S.narr('前面的田里，有一个白色的东西！');
            await S.think('……不对。它没在动。');
          })();
        }
      },
      /* ---------------- 水神池 ---------------- */
      ike: {
        amb: 'river', dark: .28, darkC: '#06100a', plr: 4, wall: 'stone', floor: 'stone', field: true, cicV: .4,
        legend: { '~': 'pond' },
        rows: ikeRows(),
        ents: [
          HZ('hz_ike'),
          { x: 6, y: 17, spr: 'invisible', touch: ikeExit },
          { id: 'torii', x: 6, y: 15, ox: -8, spr: 'torii', solid: false, on: toriiOn },
          { x: 4, y: 15, spr: 'sekihi', on: look('一块长着青苔的石碑，刻着：「水神　昭和十年　水难供养」。\n旁边还有一行更小的字，被苔藓盖住了一半：「……者，闭目而归」。', '（冰凉的石碑。摸得到刻字。）') },
          { x: 9, y: 15, spr: 'hokora', on: look('小小的水神祠。供台上放着一只倒扣的酒杯，还有一只铜铃铛——跟你胸前的那只一模一样，只是长满了绿锈。', '（木头的小祠堂。）') },
          { id: 'lantern', x: 6, y: 11, spr: 'stonelantern', off: true, on: look('长满青苔的石灯笼。火袋里积着雨水，泡着一只死蜻蜓。', '冰凉、粗糙的石头。是石灯笼。\n舅舅的画上——灯笼，往右。') },
          { id: 'chimetree', x: 12, y: 12, spr: 'kareki', on: look('一棵枯死的杉树，枝上挂着一只玻璃风铃。', '叮铃——\n风铃就挂在你头顶上。舅舅的画上——风铃，往上，五步。') },
          { id: 'jizoI', x: 16, y: 11, spr: 'jizo', on: look('池边的小地藏，脸被水汽泡得模糊了。', '（一尊小小的、湿漉漉的石像。……地藏。）') },
          { id: 'shota_i', x: 17, y: 11, spr: '@shota', dir: 2, on: findShota },
          { id: 'kk_i', x: 21, y: 9, spr: 'kune', kk: true, solid: false }
        ],
        async enter(S, first) {
          if (!first) return;
          await S.narr('田埂的尽头是一片杉树林。林子里比外面阴凉，蝉声也远了。\n一座褪了色的红鸟居，立在石板路的入口。');
          S.focus(16, 10);
          await S.narr('透过树缝，能看见池子的水光。\n水边站着一个穿黄背心的小小身影。\n……水面上，还有一个白色的、细长的东西。');
          S.focus(null);
          await S.think('翔太！……不能喊。不能往那边看。');
          upd(S);
          S.cp('ike');
        },
        step(S, x, y) {
          const f = S.f, k = x + ',' + y;
          if (!f.blind) { if (x === 6 && y <= 14) return pushBack(S); return; }
          stepTick(S, (f._sn = (f._sn || 0) + 1));   // 看不见，只能数着脚步
          if (DEAD[k]) return deadEnd(S, DEAD[k]);
          if (NEAR.includes(k)) { S.sfx('whisper'); if (S.once('near' + k)) S.toast('……前面，有什么东西在轻轻地晃。'); return; }
          if (x === 6 && y === 12 && S.once('cueLantern')) return cue(S, '你伸出手——指尖碰到了冰凉、粗糙的石头。\n是石灯笼。', 'thud');
          if (x === 11 && y === 12) { S.sfx('bell'); if (S.once('cueChime')) return cue(S, '叮铃——\n头顶上，有一只风铃在响。\n……可是，一丝风也没有。'); return; }
          if (y === 7 && x >= 12 && x <= 15 && S.once('cueBridge')) return cue(S, '脚底下「嘎吱」一声，变成了木板。\n板缝里，能听见水在流。');
          if (x === 17 && y === 10 && !f.got && S.once('cueShota')) return cue(S, '前面……有人在喘气。\n很轻、很急，像一个跑累了的小孩。');
          if (f.got && x === 6 && y === 16) return leaveIke(S);
        }
      }
    }
  });
})();
