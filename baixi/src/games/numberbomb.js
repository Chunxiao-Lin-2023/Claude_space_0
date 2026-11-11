/* 数字炸弹 — guess inside the shrinking range; whoever hits the secret number explodes. */
const D = BX.draw, C = BX.C;

/* explosion probability table: P[m][j] = prob that the player j turns from the mover explodes, range size m, all play self-optimally.
   bestPos[m] = list of optimal pick positions (0-based within range). */
function solve(n, M = 100) {
  const P = [null, [1].concat(new Array(n - 1).fill(0))], best = [null, [0]];
  for (let m = 2; m <= M; m++) {
    let bv = 1e9, bl = [], bvec = null;
    for (let p = 0; p < m; p++) {
      const vec = new Array(n).fill(0); vec[0] = 1 / m;
      for (const [sz, q] of [[p, p / m], [m - 1 - p, (m - 1 - p) / m]]) {
        if (!sz || !q) continue;
        const sub = P[sz];
        for (let j = 1; j < n; j++) vec[j] += q * sub[j - 1];
        vec[0] += q * sub[n - 1];
      }
      if (vec[0] < bv - 1e-12) { bv = vec[0]; bl = [p]; bvec = vec; } else if (Math.abs(vec[0] - bv) <= 1e-12) bl.push(p);
    }
    P[m] = bvec; best[m] = bl;
  }
  return {P, best};
}
const SOLVED = {};

BX.register({
  id: 'numberbomb', title: '数字炸弹', cat: 'deduce', order: 3, sub: '猜中炸弹数字就爆炸',
  desc: '1 到 100 之间藏着一颗炸弹。大家轮流报数，范围越缩越小，谁报中了炸弹谁就“砰”地出局！适合多人一起玩的紧张小游戏。',
  kind: 'turn', seats: [2, 6], defSeats: 3, firstLabel: '先报',
  options: [
    {key: 'max', label: '数字范围', choices: [[50, '1～50（快）'], [100, '1～100（经典）'], [200, '1～200']], def: 100},
    {key: 'timer', label: '限时', choices: [[0, '不限时'], [15, '每人 15 秒'], [8, '每人 8 秒（刺激）']], def: 0},
  ],
  howto: ['用数字键盘输入后点「报数」；也可以在刻度尺上<b>点或拖动</b>选数，再点一次同一个数确认。', '刻度尺只显示<b>当前范围</b>（上方细条是全局 1～100）；剩 40 个数以内会变成一格一格的数字牌，直接点。开启辅助模式后，范围下方还会显示这一手的踩中几率。', '开启「限时」选项后，倒计时结束会替你随机报一个数！', '💡 提示会推荐一个最“安全”的数（让压力传给下家）。'],
  rules: `<p>开局时系统在 <b>1～100</b> 中随机藏一个炸弹数字，没有人知道它是多少。</p>
<p>玩家按顺序轮流报一个数，必须在<b>当前范围之内</b>（含两端）。</p>
<ul><li>没报中：系统提示炸弹比它大还是小，范围随之缩小（例如范围 1～100 报 40，炸弹更大，新范围变为 41～100）。</li>
<li>报中炸弹：<b>“砰！”</b>这位玩家爆炸出局，本局输掉，其他所有人获胜。</li></ul>
<p>范围越来越小，压力就转给下一位——当范围只剩一个数时，轮到的人只能硬着头皮报了。</p>
<p>操作：用数字键盘输入后点“报数”，也可以直接点刻度尺上的数字（再点一次确认）。选项可改数字范围（1～50 / 1～200）和每人限时，默认经典 1～100、不限时。</p>`,
  icon(g, w, h) {
    D.iconBase(g, w, h, '#3a1e14', '#1b0e08');
    g.fillStyle = 'rgba(255,170,60,.18)'; D.circle(g, w * .5, h * .55, h * .48); g.fill();
    const cx = w * .5, cy = h * .58, r = h * .27;
    D.disc(g, cx, cy, r, '#2a2420', {ring: 'rgba(255,255,255,.15)'});
    g.fillStyle = '#5a4a3a'; g.fillRect(cx - r * .25, cy - r * 1.2, r * .5, r * .3);
    g.strokeStyle = '#c8a052'; g.lineWidth = 3; g.beginPath(); g.moveTo(cx, cy - r * 1.2); g.quadraticCurveTo(cx + r * .4, cy - r * 1.7, cx + r * .9, cy - r * 1.55); g.stroke();
    g.fillStyle = '#ffd76a'; D.circle(g, cx + r * .95, cy - r * 1.55, 6); g.fill(); g.fillStyle = '#ff6a2a'; D.circle(g, cx + r * .95, cy - r * 1.55, 3.5); g.fill();
    D.text(g, '?', cx, cy + 2, {size: r * 1.1, color: '#e6c57d', font: 'deco', weight: 400});
    D.text(g, '1', w * .12, h * .5, {size: h * .2, color: 'rgba(243,226,192,.5)', font: 'deco', weight: 400});
    D.text(g, '100', w * .86, h * .5, {size: h * .17, color: 'rgba(243,226,192,.5)', font: 'deco', weight: 400});
  },
  create(ctx) {
    const n = ctx.n;
    const MAX = [50, 100, 200].includes(+ctx.opts.max) ? +ctx.opts.max : 100, TLIM = +ctx.opts.timer || 0;
    const st = {bomb: 1 + ctx.rng.int(MAX), lo: 1, hi: MAX, turn: 0, hist: [], over: false, loser: -1};
    const cv = ctx.canvas();
    let entry = '', boom = 0, parts = [], shake = 0, lastFx = {v: -1, t: 1}, hintV = -1, hintT = 0, pass = null;
    let turnKey = -1, turnT0 = 0, lastTick = -1, dragging = false;

    /* ---------- keypad ---------- */
    const ui = ctx.ui();
    const pad = document.createElement('div'); ui.append(pad);
    pad.style.cssText = 'position:absolute;display:grid;gap:6px;grid-template-columns:repeat(6,1fr);grid-template-rows:1fr 1fr';
    const mk = (txt, cls, fn) => { const b = document.createElement('button'); b.className = 'bx-btn ' + cls; b.textContent = txt; b.style.cssText = 'min-height:44px;padding:0;font-size:20px;min-width:0'; b.onclick = fn; pad.append(b); return b; };
    const keys = '1234567890'.split('').map(d => mk(d, 'ghost', () => press(d)));
    const bDel = mk('⌫', 'ghost', () => { entry = entry.slice(0, -1); ctx.sfx('click'); sync(); });
    const bOk = mk('报数', 'red', submit); bOk.style.fontSize = '17px';
    const mine = () => ctx.canAct(st.turn);
    function press(d) { if (!mine()) return; const e = (entry + d).replace(/^0+/, ''); if (+e > MAX || e.length > 3) { ctx.sfx('error'); return; } entry = e; ctx.sfx('click'); sync(); }
    const okVal = v => Number.isInteger(v) && v >= st.lo && v <= st.hi;
    function submit() { const v = +entry; if (!mine() || !okVal(v)) { ctx.sfx('error'); ctx.buzz(12); ctx.toast('请报 ' + st.lo + '～' + st.hi + ' 之间的数'); return; } entry = ''; hintV = -1; ctx.act({v}, st.turn); sync(); }
    function key(e) { if (/^\d$/.test(e.key)) press(e.key); else if (e.key === 'Backspace') { entry = entry.slice(0, -1); sync(); } else if (e.key === 'Enter') submit(); }
    function sync() {
      const ok = mine();
      if (turnKey !== st.hist.length) {   // a new turn started
        turnKey = st.hist.length; turnT0 = performance.now(); lastTick = -1;
        if (ok && !st.over && ctx.mode === 'local' && ctx.mySeats.length > 1 && st.hist.length && !BX.bot) { pass = {s: st.turn, t: 0}; ctx.anim(1300, k => pass && (pass.t = k), () => pass = null, k => k); }
        if (ok && !st.over && st.hi - st.lo < 5 && st.hist.length) ctx.buzz(30);
      }
      pad.style.display = ctx.isLocal(st.turn) && !st.over && !BX.bot && !useTiles() ? 'grid' : 'none';
      placePad();
      keys.forEach(b => b.disabled = !ok); bDel.disabled = !ok || !entry; bOk.disabled = !ok || !okVal(+entry);
      status();
    }

    /* ---------- layout ---------- */
    function L() {
      const W = cv.w, H = cv.h, portrait = H > W * 1.05;
      const tiles = useTiles(), pw = Math.min(W - 20, portrait ? 380 : 420), ph = tiles ? 0 : portrait ? 104 : Math.min(104, H * .26);
      return {W, H, portrait, pw, ph, px: (W - pw) / 2, py: H - ph - 10, tiles};
    }
    const useTiles = () => !st.over && st.hi - st.lo + 1 <= 40 && mine() && !BX.bot;
    function placePad() { const l = L(); Object.assign(pad.style, {left: l.px + 'px', top: l.py + 'px', width: l.pw + 'px', height: l.ph + 'px'}); }
    // tap / drag on the ruler or the number tiles
    let rulerGeo = null;
    function valAt(p, loose) {
      const r = rulerGeo; if (!r) return null;
      if (r.tiles) { const t = r.tiles.find(q => p.x >= q.x - 2 && p.x <= q.x + q.w + 2 && p.y >= q.y - 2 && p.y <= q.y + q.h + 2); return t ? t.v : null; }
      if (!loose && (p.y < r.y - 28 || p.y > r.y + r.h + 28 || p.x < r.x - 14 || p.x > r.x + r.w + 14)) return null;
      return BX.clamp(Math.round(r.lo + (p.x - r.x) / r.w * (r.hi - r.lo)), st.lo, st.hi);
    }
    ctx.on(cv.cv, 'pointerdown', e => {
      if (!mine()) return;
      const v = valAt(cv.pos(e)); if (v == null) return;
      if (String(v) === entry) { submit(); return; }
      entry = String(v); dragging = !rulerGeo.tiles; ctx.sfx('tick'); sync();
    });
    ctx.on(cv.cv, 'pointermove', e => { if (!dragging || !mine()) return; const v = valAt(cv.pos(e), true); if (v != null && String(v) !== entry) { entry = String(v); ctx.sfx('tick'); sync(); } });
    ctx.on(cv.cv, 'pointerup', () => dragging = false);
    ctx.on(cv.cv, 'pointercancel', () => dragging = false);

    function status() {
      for (let s = 0; s < n; s++) ctx.info(s, st.over ? (s === st.loser ? '爆' : '胜') : '');
      if (st.over) return ctx.status(ctx.name(st.loser) + ' 踩中了炸弹 ' + st.bomb + '！');
      const rng = `<b style="color:#e6c57d">${st.lo} ～ ${st.hi}</b>`;
      if (mine()) ctx.status((ctx.hotseat ? ctx.name(st.turn) : '轮到你') + ' 报数 ' + rng + (st.lo === st.hi ? ' · 只剩一个数了…' : entry && okVal(+entry) ? ' · 再点一次 / 按「报数」确认 ' + entry : ''));
      else ctx.status('等待 ' + ctx.name(st.turn) + ' 报数 ' + rng);
    }
    const inst = {
      st,
      toMove: () => st.over ? null : st.turn,
      valid: a => okVal(a.v),
      apply(a, by) {
        const v = a.v;
        st.hist.push({s: st.turn, v, r: v === st.bomb ? 0 : v < st.bomb ? 1 : -1});
        lastFx = {v, t: 0}; ctx.anim(500, k => lastFx.t = k);
        if (v === st.bomb) {
          st.over = true; st.loser = st.turn; entry = '';
          if (!ctx.fast) { ctx.sfx('tick'); ctx.after(450, () => { ctx.sfx('boom'); boom = 1; shake = 1; spawn(); }); }
          sync();
          if (ctx.isLocal(st.loser) && !ctx.hotseat) ctx.buzz(60);
          const trail = st.hist.map(q => `<span style="color:${ctx.color(q.s)}">${q.v}${q.r > 0 ? '↑' : q.r < 0 ? '↓' : '💥'}</span>`).join(' ');
          ctx.end({winner: BX.range(n).filter(s => s !== st.loser), html: `炸弹是 <b style="color:#b23a2b;font-size:22px">${st.bomb}</b><br>${BX.esc(ctx.name(st.loser))} 被炸飞了！<br><small>共报 ${st.hist.length} 次：${trail}</small>`, delay: 1900});
          return;
        }
        if (v < st.bomb) st.lo = v + 1; else st.hi = v - 1;
        ctx.sfx(st.hi - st.lo < 6 ? 'buzz' : 'coin');
        st.turn = (st.turn + 1) % n; void by; sync();
      },
      aiMove(seat, level) {
        const m = st.hi - st.lo + 1;
        if (m === 1) return {v: st.lo};
        if (level === 1) {   // nervous: random, slightly prefers round-ish middles
          const r = Math.random();
          return {v: r < .5 ? st.lo + ((Math.random() * m) | 0) : Math.round((st.lo + st.hi) / 2 + (Math.random() - .5) * m * .3)};
        }
        if (level === 2) {   // squeezes: bisects with a little noise, avoids leaving itself trouble
          const mid = (st.lo + st.hi) / 2, off = (Math.random() - .5) * m * .4;
          return {v: BX.clamp(Math.round(mid + off), st.lo, st.hi)};
        }
        const S = SOLVED[n + ':' + MAX] || (SOLVED[n + ':' + MAX] = solve(n, MAX));
        const opts = S.best[m]; const p = opts[(Math.random() * opts.length) | 0];
        return {v: st.lo + p};
      },
      onTurn: sync,
      resize() { placePad(); },
      showHint(a) { hintV = a.v; hintT = performance.now(); entry = String(a.v); ctx.toast('💡 建议报 ' + a.v); sync(); },
      key,
      frame(dt) {
        const g = cv.g; cv.clear(); const l = L();
        // backdrop
        const gr = g.createRadialGradient(l.W / 2, l.H * .4, 20, l.W / 2, l.H * .4, Math.max(l.W, l.H) * .7);
        const danger = st.over ? 1 : 1 - (st.hi - st.lo) / (MAX - 1);
        gr.addColorStop(0, `rgb(${90 + danger * 60},${50 - danger * 20},${30 - danger * 10})`); gr.addColorStop(1, '#1b0e08');
        g.fillStyle = gr; g.fillRect(0, 0, l.W, l.H);
        if (shake > 0) { shake = Math.max(0, shake - dt * 1.4); g.save(); g.translate((Math.random() - .5) * 18 * shake, (Math.random() - .5) * 18 * shake); }
        const top = 8, bottomAvail = l.py - 10;
        // ---- players ring ----
        const seatsH = l.portrait ? 64 : 56;
        const sw = Math.min(150, (l.W - 20) / n);
        for (let s = 0; s < n; s++) {
          const x = l.W / 2 - n * sw / 2 + s * sw + 4, y = top, w = sw - 8, h = seatsH - 8;
          const on = s === st.turn && !st.over, lost = st.over && s === st.loser;
          g.fillStyle = lost ? 'rgba(178,58,43,.6)' : on ? 'rgba(230,197,125,.25)' : 'rgba(255,255,255,.06)'; D.rr(g, x, y, w, h, 10); g.fill();
          if (on) { g.strokeStyle = '#e6c57d'; g.lineWidth = 2; g.stroke(); }
          D.disc(g, x + 16, y + h / 2, 8, ctx.color(s), {shadow: false});
          D.text(g, ctx.name(s), x + 30, y + h * .36, {size: 13, color: '#f3e2c0', align: 'left', maxW: w - 36});
          const last = [...st.hist].reverse().find(q => q.s === s);
          D.text(g, last ? '报 ' + last.v + (last.r > 0 ? ' ↑' : last.r < 0 ? ' ↓' : ' 爆') : '—', x + 30, y + h * .72, {size: 12, color: lost ? '#fff' : 'rgba(243,226,192,.65)', align: 'left', maxW: w - 36});
        }
        // ---- bomb + range ----
        const midTop = top + seatsH + 4, midH = bottomAvail - midTop;
        const cntNow = st.hi - st.lo + 1, tilesMode = l.tiles ? tileLayout(l, cntNow) : null;
        const rulerH = tilesMode ? tilesMode.h : l.portrait ? 40 : 34, rulerY = midTop + midH - rulerH - 22;
        const avail = rulerY - 44 - midTop;            // space for bomb + range text
        const side = avail < 230 && l.W > 500;           // short landscape: bomb left, text right
        let bombR, bx, by, tx, ty, fs;
        if (side) {
          bombR = Math.max(22, Math.min(avail / 2.6, 70)); fs = Math.min(56, avail * .36);
          bx = l.W / 2 - bombR * 1.6 - fs * 1.2; by = midTop + avail * .5 + bombR * .55; tx = l.W / 2 + bombR * .4; ty = midTop + avail * .45;
        } else {
          bombR = Math.max(26, Math.min(avail / 4.4, l.W * .2, 100)); fs = Math.min(72, l.W / 7, bombR * .95);
          const groupH = bombR * 3.3 + fs * 1.5, gy = midTop + (avail - groupH) / 2;
          bx = l.W / 2; by = gy + bombR * 2.1; tx = bx; ty = by + bombR * 1.2 + fs * .55;
        }
        if (!st.over || boom <= 0) drawBomb(g, bx, by, bombR, danger, dt);
        if (st.over) D.text(g, '炸弹是 ' + st.bomb, tx, ty, {size: fs * .85, color: '#ff8a5a', font: 'deco', weight: 400, shadow: true});
        else {
          D.text(g, st.lo + '  ～  ' + st.hi, tx, ty, {size: fs, color: '#ffe6b0', font: 'deco', weight: 400, shadow: 'rgba(0,0,0,.6)', blur: 10});
          const cnt = st.hi - st.lo + 1;
          D.text(g, '剩 ' + cnt + ' 个数' + (ctx.assist ? ' · 踩中几率 ' + (cnt === 1 ? '100%' : (100 / cnt < 10 ? (100 / cnt).toFixed(1) : Math.round(100 / cnt)) + '%') : ''), tx, ty + fs * .72, {size: 13, color: cnt <= 5 ? '#ff9a7a' : 'rgba(243,226,192,.7)'});
          const recent = st.hist.slice(-6);
          if (recent.length && ty + fs * .72 + 24 < rulerY - 30) {
            const items = recent.map(q => ({t: q.v + (q.r > 0 ? '↑' : '↓'), c: ctx.color(q.s)})), wEach = 44, x0 = tx - items.length * wEach / 2 + wEach / 2;
            items.forEach((it, k) => { g.fillStyle = 'rgba(0,0,0,.3)'; D.rr(g, x0 + k * wEach - 20, ty + fs * .72 + 14, 40, 20, 10); g.fill(); D.text(g, it.t, x0 + k * wEach, ty + fs * .72 + 24, {size: 12, color: '#f3e2c0', weight: 700}); g.fillStyle = it.c; D.circle(g, x0 + k * wEach - 14, ty + fs * .72 + 24, 3); g.fill(); });
          }
        }
        // turn timer (visual only; when it runs out the local player auto-reports a random number)
        if (TLIM && !st.over && mine() && !BX.bot) {
          const left = Math.max(0, TLIM - (performance.now() - turnT0) / 1000), frac = left / TLIM;
          g.strokeStyle = 'rgba(255,255,255,.15)'; g.lineWidth = 6; D.circle(g, bx, by, bombR * 1.28); g.stroke();
          g.strokeStyle = frac < .3 ? '#ff5a3a' : '#e6c57d'; g.beginPath(); g.arc(bx, by, bombR * 1.28, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * frac); g.stroke();
          D.text(g, String(Math.ceil(left)), bx - bombR * 1.28, by - bombR * 1.0, {size: 18, color: frac < .3 ? '#ff8a6a' : '#f3e2c0', font: 'deco', weight: 400, shadow: true});
          const sec = Math.ceil(left);
          if (sec <= 3 && sec !== lastTick && left > 0) { lastTick = sec; ctx.sfx('tick'); }
          if (left <= 0 && turnKey === st.hist.length && lastTick !== -99) {
            lastTick = -99;
            const v = okVal(+entry) ? +entry : st.lo + Math.floor(Math.random() * (st.hi - st.lo + 1));
            ctx.toast('时间到！自动报 ' + v); entry = ''; ctx.act({v}, st.turn);
          }
        }
        // entry bubble
        if (entry && mine()) { const ok = okVal(+entry); g.fillStyle = ok ? 'rgba(230,197,125,.95)' : 'rgba(178,58,43,.9)'; const ew = 86, eh = 40; D.rr(g, bx + bombR * 1.25, by - eh / 2, ew, eh, 12); g.fill(); D.text(g, entry, bx + bombR * 1.25 + ew / 2, by + 1, {size: 26, color: ok ? C.ink : '#fff', font: 'deco', weight: 400}); }
        drawRuler(g, l, rulerY, rulerH, tilesMode);
        // explosion
        if (boom > 0) {
          boom = Math.max(0, boom - dt * .5);
          const k = 1 - boom;
          g.fillStyle = `rgba(255,220,150,${Math.max(0, .9 - k * 2)})`; g.fillRect(0, 0, l.W, l.H);
          for (const p of parts) { p.x += p.vx * dt; p.y += p.vy * dt; p.vy += 300 * dt; p.vx *= .99; p.life -= dt; if (p.life <= 0) continue; g.globalAlpha = Math.min(1, p.life); g.fillStyle = p.c; D.circle(g, p.x, p.y, p.r); g.fill(); }
          g.globalAlpha = 1;
          D.text(g, '砰！', bx, by, {size: bombR * (1.2 + k * .6), color: '#ffe6b0', font: 'deco', weight: 400, stroke: '#b23a2b', strokeW: 6, shadow: true});
        } else if (st.over) {   // aftermath: scorched star burst
          g.fillStyle = '#ff8a3a'; g.beginPath(); for (let k = 0; k < 24; k++) { const a = k * Math.PI / 12, rr = bombR * (k % 2 ? .55 : 1.1); g.lineTo(bx + Math.cos(a) * rr, by + Math.sin(a) * rr); } g.closePath(); g.fill();
          g.fillStyle = '#ffd76a'; g.beginPath(); for (let k = 0; k < 24; k++) { const a = k * Math.PI / 12 + .13, rr = bombR * (k % 2 ? .35 : .72); g.lineTo(bx + Math.cos(a) * rr, by + Math.sin(a) * rr); } g.closePath(); g.fill();
          D.text(g, '砰', bx, by, {size: bombR * .7, color: '#b23a2b', font: 'deco', weight: 400});
        }
        if (pass) { const a = pass.t < .15 ? pass.t / .15 : pass.t > .75 ? (1 - pass.t) / .25 : 1; g.globalAlpha = a; g.fillStyle = 'rgba(20,10,4,.82)'; D.rr(g, l.W / 2 - 150, by - 40, 300, 80, 16); g.fill(); g.strokeStyle = ctx.color(pass.s); g.lineWidth = 3; g.stroke(); D.text(g, '传给 ' + ctx.name(pass.s), l.W / 2, by - 8, {size: 26, color: '#ffe6b0', font: 'deco', weight: 400}); D.text(g, '范围 ' + st.lo + '～' + st.hi, l.W / 2, by + 22, {size: 13, color: 'rgba(243,226,192,.75)'}); g.globalAlpha = 1; }
        if (shake > 0) g.restore();
        function spawn() { parts = []; for (let i = 0; i < 90; i++) { const a = Math.random() * 6.283, sp = 100 + Math.random() * 520; parts.push({x: bx, y: by, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 120, r: 2 + Math.random() * 6, life: .8 + Math.random() * 1.4, c: ['#ffd76a', '#ff8a3a', '#ff4020', '#5a4a3a', '#fff3c0'][i % 5]}); } }
        spawnRef = spawn;
      },
    };
    let spawnRef = null, fuseT = 0;
    function tileLayout(l, cnt) {
      const rw = l.W - 36, short = l.H < 500, maxRows = short ? (cnt <= Math.floor(rw / 34) ? 1 : 2) : 4;
      let cols = Math.min(cnt, Math.max(1, Math.floor(rw / 58))); if (Math.ceil(cnt / cols) > maxRows) cols = Math.ceil(cnt / maxRows);
      const rows = Math.ceil(cnt / cols), tw = Math.min(64, rw / cols), th = Math.min(short ? 40 : 48, Math.max(34, tw * .9));
      return {cols, rows, tw, th, h: rows * th + (rows - 1) * 4, x: (l.W - cols * tw) / 2};
    }
    function drawRuler(g, l, rulerY, rulerH, T) {
      const rx = 18, rw = l.W - 36, tk = performance.now() / 1000;
      // overview strip: the whole 1..MAX with the live range
      const oy = rulerY - (T ? 30 : 34), OX = v => rx + (v - 1) / (MAX - 1) * rw;
      g.fillStyle = 'rgba(120,100,80,.35)'; D.rr(g, rx, oy, rw, 6, 3); g.fill();
      const lo = st.over ? st.bomb : st.lo, hi = st.over ? st.bomb : st.hi;
      g.fillStyle = '#e6c57d'; D.rr(g, OX(lo) - 2, oy - 1, Math.max(4, OX(hi) - OX(lo) + 4), 8, 4); g.fill();
      for (const hst of st.hist) { g.fillStyle = hst.r === 0 ? '#ff4020' : ctx.color(hst.s); D.circle(g, OX(hst.v), oy + 3, 2.5); g.fill(); }
      D.text(g, '1', rx - 8, oy + 3, {size: 10, color: 'rgba(243,226,192,.55)'}); D.text(g, String(MAX), rx + rw + 10, oy + 3, {size: 10, color: 'rgba(243,226,192,.55)'});
      if (T) {   // number tiles
        const tiles = []; let k = 0;
        for (let v = st.lo; v <= st.hi; v++, k++) {
          const c = k % T.cols, r = (k / T.cols) | 0, x = T.x + c * T.tw + 2, y = rulerY + r * (T.th + 4), w = T.tw - 4, h = T.th;
          const sel = String(v) === entry, hv = v === hintV;
          g.fillStyle = sel ? '#ffd76a' : 'rgba(243,226,192,.9)'; D.rr(g, x, y, w, h, 8); g.fill();
          if (hv) { g.strokeStyle = 'rgba(90,220,160,' + (.6 + .4 * Math.sin(tk * 7)) + ')'; g.lineWidth = 3; g.stroke(); }
          if (sel) { g.strokeStyle = '#b23a2b'; g.lineWidth = 2.5; D.rr(g, x, y, w, h, 8); g.stroke(); }
          D.text(g, String(v), x + w / 2, y + h / 2 + 1, {size: Math.min(20, h * .5, w * .42), color: C.ink, weight: 800});
          tiles.push({x, y, w, h, v});
        }
        rulerGeo = {tiles};
        return;
      }
      // zoomed ruler over the live range
      const wlo = st.over ? Math.max(1, st.bomb - 5) : st.lo, whi = st.over ? Math.min(MAX, st.bomb + 5) : Math.max(st.hi, st.lo + 1);
      const X = v => rx + (v - wlo) / (whi - wlo) * rw;
      rulerGeo = {x: rx, y: rulerY, w: rw, h: rulerH, lo: wlo, hi: whi};
      g.fillStyle = 'rgba(0,0,0,.35)'; D.rr(g, rx - 6, rulerY - 6, rw + 12, rulerH + 12, 10); g.fill();
      const g2 = g.createLinearGradient(rx, 0, rx + rw, 0); g2.addColorStop(0, '#e6c57d'); g2.addColorStop(1, '#d9822b');
      g.fillStyle = g2; g.fillRect(rx, rulerY, rw, rulerH);
      const pxPer = rw / Math.max(1, whi - wlo), step = [1, 2, 5, 10, 20, 25, 50].find(q => q * pxPer >= 34) || 50;
      g.strokeStyle = 'rgba(30,18,8,.6)'; g.lineWidth = 1;
      for (let v = wlo; v <= whi; v++) {
        if (pxPer < 3 && v % 5) continue;
        const x = X(v), tall = v % step === 0; g.beginPath(); g.moveTo(x, rulerY + rulerH); g.lineTo(x, rulerY + rulerH - (tall ? rulerH * .5 : rulerH * .22)); g.stroke();
        if (tall && v !== wlo && v !== whi && Math.abs(x - X(wlo)) > 22 && Math.abs(x - X(whi)) > 22) D.text(g, String(v), x, rulerY + rulerH + 12, {size: 11, color: 'rgba(243,226,192,.7)'});
      }
      D.text(g, String(wlo), X(wlo), rulerY + rulerH + 12, {size: 12, color: '#ffe6b0', weight: 800}); D.text(g, String(whi), X(whi), rulerY + rulerH + 12, {size: 12, color: '#ffe6b0', weight: 800});
      for (const hst of st.hist) if (hst.v >= wlo && hst.v <= whi) { g.fillStyle = hst.r === 0 ? '#ff4020' : ctx.color(hst.s); D.circle(g, X(hst.v), rulerY + rulerH * .3, 5); g.fill(); }
      if (lastFx.t < 1 && lastFx.v >= wlo && lastFx.v <= whi) { g.strokeStyle = `rgba(255,240,200,${1 - lastFx.t})`; g.lineWidth = 3; D.circle(g, X(lastFx.v), rulerY + rulerH / 2, 6 + lastFx.t * 30); g.stroke(); }
      if (hintV >= wlo && hintV <= whi) { g.strokeStyle = 'rgba(90,220,160,' + (.6 + .4 * Math.sin(tk * 7)) + ')'; g.lineWidth = 3; D.circle(g, X(hintV), rulerY + rulerH / 2, 10); g.stroke(); }
      if (entry && okVal(+entry)) { const x = X(+entry); g.fillStyle = '#fff'; g.beginPath(); g.moveTo(x, rulerY - 2); g.lineTo(x - 8, rulerY - 14); g.lineTo(x + 8, rulerY - 14); g.closePath(); g.fill(); g.fillStyle = 'rgba(255,255,255,.5)'; g.fillRect(x - 1, rulerY, 2, rulerH); }
      if (st.over) { g.fillStyle = '#ff4020'; D.circle(g, X(st.bomb), rulerY + rulerH / 2, 8); g.fill(); }
    }
    function spawn() { if (spawnRef) spawnRef(); }
    function drawBomb(g, x, y, r, danger, dt) {
      fuseT += dt;
      const wob = Math.sin(fuseT * (3 + danger * 14)) * danger * .06;
      g.save(); g.translate(x, y); g.rotate(wob);
      g.fillStyle = 'rgba(0,0,0,.35)'; g.beginPath(); g.ellipse(r * .1, r * 1.02, r * .9, r * .2, 0, 0, Math.PI * 2); g.fill();
      const gr = g.createRadialGradient(-r * .35, -r * .4, r * .1, 0, 0, r); gr.addColorStop(0, '#5a524a'); gr.addColorStop(1, '#141210');
      g.fillStyle = gr; D.circle(g, 0, 0, r); g.fill();
      g.fillStyle = '#6a5a4a'; D.rr(g, -r * .28, -r * 1.2, r * .56, r * .32, 4); g.fill();
      // fuse length shrinks with range
      const len = r * (.3 + 1.2 * (1 - danger));
      g.strokeStyle = '#c8a052'; g.lineWidth = Math.max(3, r * .08); g.lineCap = 'round';
      const ex = r * .2 + len * .7, ey = -r * 1.2 - len * .55;
      g.beginPath(); g.moveTo(0, -r * 1.2); g.quadraticCurveTo(len * .1, -r * 1.2 - len * .7, ex, ey); g.stroke();
      const fl = .7 + Math.random() * .5;
      g.fillStyle = '#ffd76a'; D.circle(g, ex, ey, r * .14 * fl); g.fill(); g.fillStyle = '#ff6a2a'; D.circle(g, ex, ey, r * .08 * fl); g.fill();
      for (let i = 0; i < 3; i++) { g.fillStyle = 'rgba(255,215,106,.8)'; D.circle(g, ex + (Math.random() - .5) * r * .5, ey + (Math.random() - .5) * r * .5, 1.5); g.fill(); }
      g.fillStyle = 'rgba(255,255,255,.18)'; g.beginPath(); g.ellipse(-r * .38, -r * .42, r * .22, r * .12, -.6, 0, Math.PI * 2); g.fill();
      D.text(g, '?', 0, r * .06, {size: r * .9, color: 'rgba(230,197,125,.85)', font: 'deco', weight: 400});
      g.restore();
    }
    void spawn;
    placePad(); sync();
    return inst;
  },
});
