/* 扫雷 — 单人。首击必安全，插旗、双击/点数字快速开（chording），长按插旗，触屏插旗模式，自动适配/缩放平移。 */
const D = BX.draw, K = BX.data.slkit;
const LV = {e: [9, 9, 10, '初级'], m: [16, 16, 40, '中级'], h: [30, 16, 99, '高级']};
const NUMC = ['', '#2f5d8a', '#3f7f3b', '#b23a2b', '#3a2a7a', '#7a2a1a', '#2a7a7a', '#2b2118', '#7a7a7a'];

function drawMine(g, x, y, r) {
  g.save(); g.translate(x, y);
  g.strokeStyle = '#1b1510'; g.lineWidth = r * .22; g.lineCap = 'round';
  for (let k = 0; k < 4; k++) { const a = k * Math.PI / 4; g.beginPath(); g.moveTo(Math.cos(a) * r * 1.05, Math.sin(a) * r * 1.05); g.lineTo(-Math.cos(a) * r * 1.05, -Math.sin(a) * r * 1.05); g.stroke(); }
  const gr = g.createRadialGradient(-r * .3, -r * .3, r * .1, 0, 0, r * .75); gr.addColorStop(0, '#6a5a4a'); gr.addColorStop(1, '#141008');
  g.fillStyle = gr; D.circle(g, 0, 0, r * .72); g.fill();
  g.fillStyle = 'rgba(255,255,255,.75)'; D.circle(g, -r * .25, -r * .25, r * .15); g.fill();
  g.restore();
}
function drawFlag(g, x, y, s, wrong) {
  g.save(); g.translate(x, y);
  g.fillStyle = '#4a3020'; g.fillRect(-s * .04, -s * .32, s * .08, s * .62);
  g.fillStyle = '#5e4b38'; D.rr(g, -s * .2, s * .26, s * .4, s * .09, s * .03); g.fill();
  g.beginPath(); g.moveTo(s * .04, -s * .34); g.quadraticCurveTo(s * .2, -s * .3, s * .33, -s * .2); g.quadraticCurveTo(s * .2, -s * .1, s * .04, -s * .04); g.closePath();
  g.fillStyle = '#c23a2b'; g.fill();
  if (wrong) { g.strokeStyle = '#c0291f'; g.lineWidth = s * .09; g.beginPath(); g.moveTo(-s * .3, -s * .3); g.lineTo(s * .3, s * .3); g.moveTo(s * .3, -s * .3); g.lineTo(-s * .3, s * .3); g.stroke(); }
  g.restore();
}

BX.register({
  id: 'minesweeper', title: '扫雷', cat: 'solo', order: 2, sub: '避开地雷，翻开全部安全格',
  desc: '经典扫雷三档难度：初级 9×9、中级 16×16、高级 30×16。第一下必定安全，支持插旗、快速开格、长按插旗，手机上可缩放平移。',
  kind: 'solo',
  options: [{key: 'lv', label: '难度', choices: [['e', '初级 9×9·10雷'], ['m', '中级 16×16·40雷'], ['h', '高级 30×16·99雷']], def: 'e'}],
  rules: `<p>雷区中藏着若干地雷。翻开一个格子：若是地雷则失败；否则显示它周围 8 格中地雷的数量，数字为 0 时会自动翻开周围一片。</p>
<p>根据数字推断地雷位置，用<b>旗子</b>标记确定的地雷。<b>翻开全部非雷格子</b>即获胜（不要求插完旗）。第一次翻开的格子及其周围必定无雷。</p>
<p><b>操作</b><br>· 电脑：左键翻开，右键插旗/取消；在已满足旗数的数字上点击（或左右键同按、双击）可一次翻开周围其余格子（快速开格）。<br>
· 触屏：轻点翻开，<b>长按插旗</b>；也可点底部「插旗模式」切换轻点的功能；轻点已满足旗数的数字即快速开格。<br>
· 高级雷区在手机上可<b>双指缩放、拖动平移</b>，竖屏手机上自动转为 16×30 竖向排列。</p>
<p>左上显示剩余雷数（总雷数减旗数），并计时；每档难度记录最快用时。</p>`,
  icon(g, w, h) {
    D.wood(g, 0, 0, w, h, {base: '#8a5a30', dark: '#4a2a12', seed: 9});
    const s = h / 4.6, ox = (w - 6 * s) / 2, oy = (h - 4 * s) / 2;
    const m = ['11?..2', '1F1.2F', '111.2?', '.....1'];
    for (let y = 0; y < 4; y++) for (let x = 0; x < 6; x++) {
      const c = m[y][x], X = ox + x * s, Y = oy + y * s;
      if (c === '?' || c === 'F') { D.rr(g, X + 1, Y + 1, s - 2, s - 2, s * .15); const gr = g.createLinearGradient(X, Y, X + s, Y + s); gr.addColorStop(0, '#d9b27a'); gr.addColorStop(1, '#a8723d'); g.fillStyle = gr; g.fill(); if (c === 'F') drawFlag(g, X + s / 2, Y + s / 2, s * .9); }
      else { g.fillStyle = '#efe2c4'; g.fillRect(X + .5, Y + .5, s - 1, s - 1); if (c !== '.') D.text(g, c, X + s / 2, Y + s / 2 + 1, {size: s * .62, color: NUMC[+c], weight: 900}); }
    }
    g.save(); g.translate(w * .82, h * .78); drawMine(g, 0, 0, h * .14); g.restore();
  },
  create(ctx) {
    const lvK = ctx.opts.lv || 'e', [W0, H0, M] = LV[lvK];
    const cv = ctx.canvas(), fx = K.fx(), say = K.status(ctx);
    let W = W0, H = H0, rotated = false;     // logical board is W0×H0; when rotated, displayed transposed
    const N = W0 * H0;
    let mine = new Uint8Array(N), cnt = new Uint8Array(N), open = new Uint8Array(N), flag = new Uint8Array(N);
    let placed = false, over = false, won = false, time = 0, started = false, flagMode = false, opened = 0, boom = -1, clicks = 0;
    let revealAnim = new Float32Array(N).fill(1), press = -1, chordFlash = null;
    let view = {s: 1, x: 0, y: 0, user: false}, geo = null;
    const bar = K.bar(ctx, [
      {k: 'flag', ic: '⚑', t: '插旗模式', on: () => { flagMode = !flagMode; bar.on('flag', flagMode); ctx.sfx('tick'); }},
      {k: 'fit', ic: '⤢', t: '适应屏幕', on: () => { view.user = false; ctx.sfx('tick'); }},
      {k: 'hint', ic: '☞', t: '提示', on: () => doHint()},
      {k: 'new', ic: '↻', t: '新局', on: async () => { if (started && !over && !(await BX.confirm('放弃这一局？', '新局'))) return; ctx.restart(); }},
    ]);
    const nb = i => { const x = i % W0, y = (i / W0) | 0, o = []; for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) { if (!dx && !dy) continue; const X = x + dx, Y = y + dy; if (X >= 0 && Y >= 0 && X < W0 && Y < H0) o.push(Y * W0 + X); } return o; };
    function place(first) {
      const banned = new Set([first, ...nb(first)]), pool = [];
      for (let i = 0; i < N; i++) if (!banned.has(i)) pool.push(i);
      ctx.rng.shuffle(pool);
      for (let k = 0; k < M; k++) mine[pool[k]] = 1;
      for (let i = 0; i < N; i++) cnt[i] = nb(i).reduce((a, j) => a + mine[j], 0);
      placed = true;
    }
    function reveal(i0, delayBase) {
      const q = [i0], dist = new Map([[i0, 0]]); let n = 0;
      while (q.length) {
        const i = q.shift(); if (open[i] || flag[i]) continue;
        open[i] = 1; opened++; n++; revealAnim[i] = -Math.min(dist.get(i) * .035, .6) - (delayBase || 0);
        if (!cnt[i] && !mine[i]) for (const j of nb(i)) if (!open[j] && !flag[j] && !dist.has(j)) { dist.set(j, dist.get(i) + 1); q.push(j); }
      }
      return n;
    }
    function lose(i) {
      over = true; boom = i; ctx.sfx('boom');
      const p = cellXY(i); fx.burst(p.x, p.y, 40, {colors: ['#e05a20', '#f2a040', '#ffd060', '#5a4030'], sp: 300, size: 5});
      // reveal mines progressively from the boom
      const list = []; for (let k = 0; k < N; k++) if (mine[k] && !flag[k] && k !== i) list.push(k);
      const bx = i % W0, by = (i / W0) | 0; list.sort((a, b) => Math.hypot(a % W0 - bx, (a / W0 | 0) - by) - Math.hypot(b % W0 - bx, (b / W0 | 0) - by));
      list.forEach((k, j) => { open[k] = 2; revealAnim[k] = -.3 - j * Math.min(.04, 1.5 / list.length); });
      ctx.end({win: false, title: '踩到地雷了', text: `用时 ${K.fmt(time)} · 已翻开 ${opened}/${N - M} 格`, delay: 1800});
      say('💥 踩雷了');
    }
    function checkWin() {
      if (opened === N - M && !over) {
        over = won = true;
        for (let k = 0; k < N; k++) if (mine[k]) flag[k] = 1;
        const secs = Math.round(time * 10) / 10, b = ctx.best('t_' + lvK, secs, 'min');
        ctx.sfx('win'); fx.rain(cv.w, cv.h, 70);
        say(`扫雷成功 · 用时 ${secs.toFixed(1)} 秒`);
        ctx.end({win: true, title: '扫雷成功', text: `用时 ${secs.toFixed(1)} 秒 步数 ${clicks}` + (b.isNew ? ' · 新纪录！' : ` · 最快 ${(+b.best).toFixed(1)} 秒`), delay: 1600});
      }
    }
    function openCell(i) {
      if (over || open[i] || flag[i]) return;
      if (!placed) place(i);
      if (!started) started = true;
      clicks++;
      if (mine[i]) { open[i] = 1; lose(i); return; }
      const n = reveal(i); ctx.sfx(n > 1 ? 'swish' : 'click');
      checkWin();
    }
    function chord(i) {
      if (over || !open[i] || !cnt[i]) return false;
      const ns = nb(i), f = ns.filter(j => flag[j]).length, closed = ns.filter(j => !open[j] && !flag[j]);
      if (!closed.length) return false;
      if (f !== cnt[i]) { chordFlash = {ids: closed, t: .35}; ctx.sfx('tick'); return false; }
      clicks++;
      const bad = closed.find(j => mine[j]);
      if (bad != null) { for (const j of closed) if (!mine[j]) reveal(j); open[bad] = 1; lose(bad); return true; }
      let n = 0; for (const j of closed) n += reveal(j);
      ctx.sfx('swish'); checkWin(); return true;
    }
    function toggleFlag(i) {
      if (over || open[i]) return;
      flag[i] ^= 1; ctx.sfx(flag[i] ? 'pen' : 'tick'); if (!started && placed) started = true;
      if (navigator.vibrate && flag[i]) try { navigator.vibrate(20); } catch (e) {}
    }
    function doHint() {
      if (over) return;
      if (!placed) { const c = ((H0 / 2) | 0) * W0 + ((W0 / 2) | 0); hintCell = {i: c, t: 0, safe: true}; ctx.toast('第一下点哪里都安全'); return; }
      // find a closed safe cell adjacent to an opened number (deducible-ish), else any safe cell
      let best = -1;
      for (let i = 0; i < N && best < 0; i++) if (open[i] && cnt[i]) { const ns = nb(i), f = ns.filter(j => flag[j] || (!open[j] && mine[j])).length; for (const j of ns) if (!open[j] && !flag[j] && !mine[j] && f === cnt[i]) { best = j; break; } }
      const wrongFlag = flag.findIndex((f, i) => f && !mine[i]);
      if (wrongFlag >= 0 && best < 0) { hintCell = {i: wrongFlag, t: 0, wrong: true}; ctx.toast('这面旗插错了'); return; }
      if (best < 0) for (let i = 0; i < N; i++) if (!open[i] && !mine[i] && !flag[i]) { best = i; break; }
      if (best >= 0) { hintCell = {i: best, t: 0, safe: true}; ctx.sfx('tick'); time += 10; ctx.toast('提示：这一格是安全的（罚时 10 秒）'); }
    }
    let hintCell = null;

    /* ---------- geometry ---------- */
    function layout() {
      const A = bar.area(cv.w, cv.h);
      const top = 46, pad = 8;
      const aw = A.w - 2 * pad, ah = A.h - top - pad;
      rotated = W0 > H0 && ah > aw * 1.15;
      W = rotated ? H0 : W0; H = rotated ? W0 : H0;
      const fitS = Math.min(aw / W, ah / H, 52);
      const minS = BX.TOUCH.matches ? 22 : 16;
      if (!view.user) { const s = Math.max(fitS, Math.min(minS, 52)); view.s = s; view.x = A.x + pad + (aw - W * s) / 2; view.y = top + (ah - H * s) / 2; if (W * s > aw) view.x = A.x + pad; if (H * s > ah) view.y = top; }
      geo = {A, top, pad, aw, ah, fitS};
      clampView();
    }
    function clampView() {
      const {A, top, pad, aw, ah} = geo, bw = W * view.s, bh = H * view.s;
      const x0 = A.x + pad, x1 = A.x + pad + aw, y0 = top, y1 = top + ah;
      view.x = bw <= aw ? x0 + (aw - bw) / 2 : BX.clamp(view.x, x1 - bw, x0);
      view.y = bh <= ah ? y0 + (ah - bh) / 2 : BX.clamp(view.y, y1 - bh, y0);
    }
    const toLogical = (dx, dy) => rotated ? dx * W0 + (W0 - 1 - dy) : dy * W0 + dx;     // display (dx,dy) → index
    function cellAt(p) {
      const dx = Math.floor((p.x - view.x) / view.s), dy = Math.floor((p.y - view.y) / view.s);
      if (dx < 0 || dy < 0 || dx >= W || dy >= H || p.y < geo.top - 4) return -1;
      return toLogical(dx, dy);
    }
    function dispXY(i) { const x = i % W0, y = (i / W0) | 0; return rotated ? {dx: y, dy: W0 - 1 - x} : {dx: x, dy: y}; }
    function cellXY(i) { const d = dispXY(i); return {x: view.x + (d.dx + .5) * view.s, y: view.y + (d.dy + .5) * view.s}; }

    /* ---------- input: tap / long press / right click / pan / pinch ---------- */
    const ptrs = new Map(); let gest = null, lpT = 0, lastUp = {t: 0, i: -1};
    ctx.on(cv.cv, 'contextmenu', e => e.preventDefault());
    ctx.on(cv.cv, 'pointerdown', e => {
      const p = cv.pos(e); ptrs.set(e.pointerId, p);
      try { cv.cv.setPointerCapture(e.pointerId); } catch (_) {}
      if (ptrs.size === 2) {   // pinch
        clearTimeout(lpT); const [a, b] = [...ptrs.values()];
        gest = {pinch: true, d0: Math.hypot(a.x - b.x, a.y - b.y), s0: view.s, cx: (a.x + b.x) / 2, cy: (a.y + b.y) / 2, vx: view.x, vy: view.y};
        press = -1; return;
      }
      if (ptrs.size > 2) return;
      const i = cellAt(p);
      if (e.pointerType === 'mouse') {
        if (e.button === 2 || (e.buttons & 3) === 3) { if (i >= 0) { if ((e.buttons & 3) === 3) chord(i); else toggleFlag(i); } gest = {done: true}; return; }
        if (e.button === 1) { gest = {pan: true, sx: p.x, sy: p.y, vx: view.x, vy: view.y, moved: true}; return; }
      }
      gest = {sx: p.x, sy: p.y, vx: view.x, vy: view.y, i, moved: false, mouse: e.pointerType === 'mouse', lp: false};
      press = i;
      if (e.pointerType !== 'mouse' && i >= 0) lpT = setTimeout(() => { if (gest && !gest.moved && !gest.pinch) { gest.lp = true; press = -1; if (!open[gest.i]) toggleFlag(gest.i); else chord(gest.i); } }, 380);
    });
    ctx.on(cv.cv, 'pointermove', e => {
      if (!ptrs.has(e.pointerId)) return;
      const p = cv.pos(e); ptrs.set(e.pointerId, p);
      if (!gest || gest.done) return;
      if (gest.pinch && ptrs.size >= 2) {
        const [a, b] = [...ptrs.values()], d = Math.hypot(a.x - b.x, a.y - b.y), cx = (a.x + b.x) / 2, cy = (a.y + b.y) / 2;
        const s = BX.clamp(gest.s0 * d / Math.max(10, gest.d0), Math.min(geo.fitS, 14), 64);
        view.x = cx - (gest.cx - gest.vx) * s / gest.s0; view.y = cy - (gest.cy - gest.vy) * s / gest.s0; view.s = s; view.user = true; clampView(); return;
      }
      const dd = Math.hypot(p.x - gest.sx, p.y - gest.sy);
      if (!gest.moved && dd > (gest.mouse ? 6 : 10)) { gest.moved = true; press = -1; clearTimeout(lpT); }
      if (gest.moved && !gest.lp) { const bw = W * view.s, bh = H * view.s; if (bw > geo.aw + 1 || bh > geo.ah + 1) { view.x = gest.vx + p.x - gest.sx; view.y = gest.vy + p.y - gest.sy; view.user = true; clampView(); } }
    });
    const up = e => {
      if (!ptrs.has(e.pointerId)) return;
      ptrs.delete(e.pointerId); clearTimeout(lpT);
      const gs = gest; press = -1;
      if (ptrs.size) return;
      gest = null;
      if (!gs || gs.done || gs.pinch || gs.moved || gs.lp || e.type === 'pointercancel') return;
      const i = gs.i; if (i < 0 || over) return;
      const now = performance.now(), dbl = now - lastUp.t < 350 && lastUp.i === i; lastUp = {t: now, i};
      if (open[i]) { chord(i); return; }
      if (dbl && gs.mouse) return;
      if (flagMode) toggleFlag(i); else openCell(i);
    };
    ctx.on(cv.cv, 'pointerup', up); ctx.on(cv.cv, 'pointercancel', up);
    ctx.on(cv.cv, 'wheel', e => {
      e.preventDefault(); const p = cv.pos(e), s0 = view.s, s = BX.clamp(s0 * Math.exp(-e.deltaY * .0015), Math.min(geo.fitS, 14), 64);
      view.x = p.x - (p.x - view.x) * s / s0; view.y = p.y - (p.y - view.y) * s / s0; view.s = s; view.user = true; clampView();
    }, {passive: false});

    /* ---------- drawing ---------- */
    function tile(g, x, y, s, hl) {
      const r = s * .14;
      D.rr(g, x + s * .04, y + s * .04, s * .92, s * .92, r);
      const gr = g.createLinearGradient(x, y, x + s, y + s); gr.addColorStop(0, hl ? '#f0cf94' : '#ddb47c'); gr.addColorStop(1, hl ? '#c99654' : '#a8733f');
      g.fillStyle = gr; g.fill();
      g.lineWidth = Math.max(1, s * .05); g.strokeStyle = 'rgba(255,240,210,.55)';
      g.beginPath(); g.moveTo(x + s * .12, y + s * .88); g.lineTo(x + s * .12, y + s * .12); g.lineTo(x + s * .88, y + s * .12); g.stroke();
      g.strokeStyle = 'rgba(70,40,15,.45)'; g.beginPath(); g.moveTo(x + s * .12, y + s * .9); g.lineTo(x + s * .9, y + s * .9); g.lineTo(x + s * .9, y + s * .12); g.stroke();
    }
    let bgC = null, bgKey = '';
    function bg(g) {
      const key = cv.w + 'x' + cv.h + cv.dpr;
      if (key !== bgKey) { bgKey = key; bgC = document.createElement('canvas'); bgC.width = Math.ceil(cv.w * cv.dpr); bgC.height = Math.ceil(cv.h * cv.dpr); const b = bgC.getContext('2d'); b.scale(cv.dpr, cv.dpr); K.table(b, cv.w, cv.h, 'wood'); }
      g.drawImage(bgC, 0, 0, cv.w, cv.h);
    }
    function hud(g) {
      const {A} = geo, cx = A.x + A.w / 2, y = 23;
      const left = M - flag.reduce((a, b) => a + b, 0);
      const box = (x, w, label, val, col) => {
        g.fillStyle = 'rgba(25,14,6,.72)'; D.rr(g, x, y - 17, w, 34, 10); g.fill(); g.strokeStyle = 'rgba(230,197,125,.35)'; g.lineWidth = 1; g.stroke();
        D.text(g, label, x + 10, y, {size: 13, color: '#c8a052', align: 'left', weight: 700});
        D.text(g, val, x + w - 10, y + 1, {size: 19, color: col, align: 'right', font: BX.F.mono, weight: 800});
      };
      box(cx - 150, 120, '余雷', String(left).padStart(2, '0'), '#ff7a5a');
      // center seal: face
      K.seal(g, cx, y, 34, over ? (won ? '胜' : '败') : flagMode ? '旗' : '扫', 0);
      box(cx + 30, 120, '用时', K.fmt(time), '#f3e2c0');
    }
    const inst = {
      frame(dt) {
        const g = cv.g; cv.clear(); layout();
        if (started && !over) time += dt;
        bg(g);
        const s = view.s, bx = view.x, by = view.y;
        g.save(); g.beginPath(); g.rect(0, geo.top - 4, cv.w, cv.h); g.clip();
        // board frame
        g.fillStyle = 'rgba(0,0,0,.35)'; D.rr(g, bx - 6, by - 3, W * s + 12, H * s + 12, 10); g.fill();
        g.fillStyle = '#efe2c4'; D.rr(g, bx - 4, by - 4, W * s + 8, H * s + 8, 8); g.fill();
        g.strokeStyle = '#6b4426'; g.lineWidth = 3; g.stroke();
        const x0 = Math.max(0, Math.floor((-bx) / s)), x1 = Math.min(W - 1, Math.ceil((cv.w - bx) / s)), y0 = Math.max(0, Math.floor((geo.top - by) / s)), y1 = Math.min(H - 1, Math.ceil((cv.h - by) / s));
        g.strokeStyle = 'rgba(120,90,50,.25)'; g.lineWidth = 1;
        for (let dy = y0; dy <= y1; dy++) for (let dx = x0; dx <= x1; dx++) {
          const i = toLogical(dx, dy), X = bx + dx * s, Y = by + dy * s;
          if (revealAnim[i] < 1) revealAnim[i] = Math.min(1, revealAnim[i] + dt * 6);
          const ra = revealAnim[i];
          if (open[i] && ra > 0) {
            g.fillStyle = i === boom ? '#e0704a' : open[i] === 2 ? '#e8d3b0' : '#efe2c4'; g.fillRect(X, Y, s, s); g.strokeRect(X + .5, Y + .5, s - 1, s - 1);
            if (mine[i]) drawMine(g, X + s / 2, Y + s / 2, s * .36 * Math.min(1, ra * 1.4));
            else if (cnt[i]) D.text(g, String(cnt[i]), X + s / 2, Y + s * .54, {size: s * .66 * (.6 + .4 * ra), color: NUMC[cnt[i]], weight: 900, font: 'sans'});
          }
          if (!open[i] || ra <= 0 || ra < 1) {
            const k = open[i] ? (ra <= 0 ? 1 : 1 - ra) : 1;
            if (k > 0) {
              g.save(); if (k < 1) { g.globalAlpha = k; g.translate(X + s / 2, Y + s / 2); g.scale(.6 + .4 * k, .6 + .4 * k); g.translate(-X - s / 2, -Y - s / 2); }
              const hl = press === i || (chordFlash && chordFlash.ids.includes(i));
              if (press === i && !flag[i]) { g.fillStyle = '#e3d0a8'; g.fillRect(X, Y, s, s); } else tile(g, X, Y, s, hl);
              if (flag[i]) drawFlag(g, X + s / 2, Y + s / 2, s * .9, over && !won && !mine[i]);
              g.restore();
            }
          }
          if (over && !won && flag[i] && !mine[i] && open[i] !== 1) { /* drawn above */ }
        }
        if (hintCell) {
          hintCell.t += dt; const p = cellXY(hintCell.i), a = .5 + .5 * Math.sin(hintCell.t * 10);
          g.strokeStyle = hintCell.wrong ? `rgba(220,60,40,${a})` : `rgba(60,200,140,${a})`; g.lineWidth = 3; D.rr(g, p.x - s / 2 + 1, p.y - s / 2 + 1, s - 2, s - 2, s * .15); g.stroke();
          if (hintCell.t > 3 || open[hintCell.i] || (hintCell.wrong && !flag[hintCell.i])) hintCell = null;
        }
        g.restore();
        if (chordFlash && (chordFlash.t -= dt) <= 0) chordFlash = null;
        hud(g);
        fx.draw(g, dt);
        if (!over) say(`${LV[lvK][3]} · ${flagMode ? '插旗模式：轻点插旗' : BX.TOUCH.matches ? '轻点翻开 · 长按插旗' : '左键翻开 · 右键插旗'}`);
        bar.dis('fit', !view.user); bar.dis('hint', over);
      },
      key(e) { if (e.code === 'KeyF') { flagMode = !flagMode; bar.on('flag', flagMode); } },
      debug: {
        center(i) { const d = dispXY(i); view.user = true; view.x = cv.w / 2 - (d.dx + .5) * view.s; view.y = cv.h / 2 - (d.dy + .5) * view.s; clampView(); },
        get mine() { return mine; }, get open() { return open; }, W0, H0, get rotated() { return rotated; }, get view() { return view; },
        cellXY: i => { const p = cellXY(i), r = cv.cv.getBoundingClientRect(); return {x: p.x + r.left, y: p.y + r.top}; },
      },
    };
    return inst;
  },
});
