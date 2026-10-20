/* 数字炸弹 — guess inside the shrinking range; whoever hits the secret number explodes. */
const D = BX.draw, C = BX.C;

/* explosion probability table: P[m][j] = prob that the player j turns from the mover explodes, range size m, all play self-optimally.
   bestPos[m] = list of optimal pick positions (0-based within range). */
function solve(n) {
  const P = [null, [1].concat(new Array(n - 1).fill(0))], best = [null, [0]];
  for (let m = 2; m <= 100; m++) {
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
  rules: `<p>开局时系统在 <b>1～100</b> 中随机藏一个炸弹数字，没有人知道它是多少。</p>
<p>玩家按顺序轮流报一个数，必须在<b>当前范围之内</b>（含两端）。</p>
<ul><li>没报中：系统提示炸弹比它大还是小，范围随之缩小（例如范围 1～100 报 40，炸弹更大，新范围变为 41～100）。</li>
<li>报中炸弹：<b>“砰！”</b>这位玩家爆炸出局，本局输掉，其他所有人获胜。</li></ul>
<p>范围越来越小，压力就转给下一位——当范围只剩一个数时，轮到的人只能硬着头皮报了。</p>
<p>操作：用数字键盘输入后点“报数”，也可以直接点刻度尺上的数字。</p>`,
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
    const st = {bomb: 1 + ctx.rng.int(100), lo: 1, hi: 100, turn: 0, hist: [], over: false, loser: -1};
    const cv = ctx.canvas();
    let entry = '', boom = 0, parts = [], shake = 0, lastFx = {v: -1, t: 1};

    /* ---------- keypad ---------- */
    const ui = ctx.ui();
    const pad = document.createElement('div'); ui.append(pad);
    pad.style.cssText = 'position:absolute;display:grid;gap:6px;grid-template-columns:repeat(6,1fr);grid-template-rows:1fr 1fr';
    const mk = (txt, cls, fn) => { const b = document.createElement('button'); b.className = 'bx-btn ' + cls; b.textContent = txt; b.style.cssText = 'min-height:44px;padding:0;font-size:20px;min-width:0'; b.onclick = fn; pad.append(b); return b; };
    const keys = '1234567890'.split('').map(d => mk(d, 'ghost', () => press(d)));
    const bDel = mk('⌫', 'ghost', () => { entry = entry.slice(0, -1); ctx.sfx('click'); sync(); });
    const bOk = mk('报数', 'red', submit); bOk.style.fontSize = '17px';
    const mine = () => ctx.canAct(st.turn);
    function press(d) { if (!mine()) return; const e = (entry + d).replace(/^0+/, ''); if (+e > 100 || e.length > 3) { ctx.sfx('error'); return; } entry = e; ctx.sfx('click'); sync(); }
    const okVal = v => Number.isInteger(v) && v >= st.lo && v <= st.hi;
    function submit() { const v = +entry; if (!mine() || !okVal(v)) { ctx.sfx('error'); ctx.toast('请报 ' + st.lo + '～' + st.hi + ' 之间的数'); return; } entry = ''; ctx.act({v}, st.turn); sync(); }
    function key(e) { if (/^\d$/.test(e.key)) press(e.key); else if (e.key === 'Backspace') { entry = entry.slice(0, -1); sync(); } else if (e.key === 'Enter') submit(); }
    function sync() {
      const ok = mine();
      pad.style.display = ctx.isLocal(st.turn) && !st.over && !BX.bot ? 'grid' : 'none';
      keys.forEach(b => b.disabled = !ok); bDel.disabled = !ok || !entry; bOk.disabled = !ok || !okVal(+entry);
      status();
    }

    /* ---------- layout ---------- */
    function L() {
      const W = cv.w, H = cv.h, portrait = H > W * 1.05;
      const pw = Math.min(W - 20, portrait ? 380 : 420), ph = portrait ? 104 : Math.min(104, H * .26);
      return {W, H, portrait, pw, ph, px: (W - pw) / 2, py: H - ph - 10};
    }
    function placePad() { const l = L(); Object.assign(pad.style, {left: l.px + 'px', top: l.py + 'px', width: l.pw + 'px', height: l.ph + 'px'}); }
    // tap on the ruler
    let rulerGeo = null;
    ctx.on(cv.cv, 'pointerdown', e => {
      if (!mine() || !rulerGeo) return;
      const p = cv.pos(e), r = rulerGeo; if (p.y < r.y - 24 || p.y > r.y + r.h + 24 || p.x < r.x - 10 || p.x > r.x + r.w + 10) return;
      const v = BX.clamp(Math.round(1 + (p.x - r.x) / r.w * 99), st.lo, st.hi);
      if (String(v) === entry) { submit(); return; }
      entry = String(v); ctx.sfx('tick'); sync();
    });

    function status() {
      for (let s = 0; s < n; s++) ctx.info(s, st.over ? (s === st.loser ? '爆' : '胜') : '');
      if (st.over) return ctx.status(ctx.name(st.loser) + ' 踩中了炸弹 ' + st.bomb + '！');
      const rng = `<b style="color:#e6c57d">${st.lo} ～ ${st.hi}</b>`;
      if (mine()) ctx.status((ctx.hotseat ? ctx.name(st.turn) : '轮到你') + ' 报数 ' + rng + (st.lo === st.hi ? ' · 只剩一个数了…' : ''));
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
          ctx.end({winner: BX.range(n).filter(s => s !== st.loser), html: `炸弹是 <b style="color:#b23a2b;font-size:22px">${st.bomb}</b><br>${BX.esc(ctx.name(st.loser))} 被炸飞了！`, delay: 1900});
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
        const S = SOLVED[n] || (SOLVED[n] = solve(n));
        const opts = S.best[m]; const p = opts[(Math.random() * opts.length) | 0];
        return {v: st.lo + p};
      },
      onTurn: sync,
      resize() { placePad(); },
      key,
      frame(dt) {
        const g = cv.g; cv.clear(); const l = L();
        // backdrop
        const gr = g.createRadialGradient(l.W / 2, l.H * .4, 20, l.W / 2, l.H * .4, Math.max(l.W, l.H) * .7);
        const danger = st.over ? 1 : 1 - (st.hi - st.lo) / 99;
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
        const rulerH = l.portrait ? 40 : 34, rulerY = midTop + midH - rulerH - 22;
        const avail = rulerY - 20 - midTop;            // space for bomb + range text
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
          D.text(g, '剩 ' + (st.hi - st.lo + 1) + ' 个数', tx, ty + fs * .72, {size: 13, color: 'rgba(243,226,192,.7)'});
        }
        // entry bubble
        if (entry && mine()) { const ok = okVal(+entry); g.fillStyle = ok ? 'rgba(230,197,125,.95)' : 'rgba(178,58,43,.9)'; const ew = 86, eh = 40; D.rr(g, bx + bombR * 1.25, by - eh / 2, ew, eh, 12); g.fill(); D.text(g, entry, bx + bombR * 1.25 + ew / 2, by + 1, {size: 26, color: ok ? C.ink : '#fff', font: 'deco', weight: 400}); }
        // ruler
        const rx = 18, rw = l.W - 36; rulerGeo = {x: rx, y: rulerY, w: rw, h: rulerH};
        g.fillStyle = 'rgba(0,0,0,.35)'; D.rr(g, rx - 6, rulerY - 6, rw + 12, rulerH + 12, 10); g.fill();
        const X = v => rx + (v - 1) / 99 * rw;
        g.fillStyle = 'rgba(120,100,80,.35)'; g.fillRect(rx, rulerY, rw, rulerH);
        const lo = st.over ? st.bomb : st.lo, hi = st.over ? st.bomb : st.hi;
        const g2 = g.createLinearGradient(X(lo), 0, X(hi), 0); g2.addColorStop(0, '#e6c57d'); g2.addColorStop(1, '#d9822b');
        g.fillStyle = g2; g.fillRect(X(lo) - rw / 198, rulerY, Math.max(4, X(hi) - X(lo) + rw / 99), rulerH);
        g.strokeStyle = 'rgba(30,18,8,.6)'; g.lineWidth = 1;
        for (let v = 1; v <= 100; v++) { const x = X(v), tall = v % 10 === 0 || v === 1; g.beginPath(); g.moveTo(x, rulerY + rulerH); g.lineTo(x, rulerY + rulerH - (tall ? rulerH * .5 : rulerH * .22)); g.stroke(); }
        for (const v of [1, 25, 50, 75, 100]) D.text(g, String(v), X(v), rulerY + rulerH + 12, {size: 11, color: 'rgba(243,226,192,.7)'});
        for (const hst of st.hist) { const x = X(hst.v); g.fillStyle = hst.r === 0 ? '#ff4020' : ctx.color(hst.s); D.circle(g, x, rulerY + rulerH * .3, 4); g.fill(); }
        if (lastFx.t < 1 && lastFx.v > 0) { g.strokeStyle = `rgba(255,240,200,${1 - lastFx.t})`; g.lineWidth = 3; D.circle(g, X(lastFx.v), rulerY + rulerH / 2, 6 + lastFx.t * 30); g.stroke(); }
        if (entry && okVal(+entry)) { const x = X(+entry); g.fillStyle = '#fff'; g.beginPath(); g.moveTo(x, rulerY - 2); g.lineTo(x - 7, rulerY - 12); g.lineTo(x + 7, rulerY - 12); g.closePath(); g.fill(); }
        if (!st.over) { D.text(g, String(st.lo), X(st.lo), rulerY - 12, {size: 12, color: '#ffe6b0', weight: 800}); if (st.hi !== st.lo) D.text(g, String(st.hi), X(st.hi), rulerY - 12, {size: 12, color: '#ffe6b0', weight: 800}); }
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
        if (shake > 0) g.restore();
        function spawn() { parts = []; for (let i = 0; i < 90; i++) { const a = Math.random() * 6.283, sp = 100 + Math.random() * 520; parts.push({x: bx, y: by, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 120, r: 2 + Math.random() * 6, life: .8 + Math.random() * 1.4, c: ['#ffd76a', '#ff8a3a', '#ff4020', '#5a4a3a', '#fff3c0'][i % 5]}); } }
        spawnRef = spawn;
      },
    };
    let spawnRef = null, fuseT = 0;
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
